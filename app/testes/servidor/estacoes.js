/* Babel Coop · harness dos testes do servidor (node:test)
   Sobe Estações de verdade como processos filhos (`node servidor/servidor.js`), cada uma com a sua raiz temporária,
   porta HTTP e porta UDP (config lê a raiz ao carregar: por isso processos separados).
   Clientes WebSocket fazem o papel do navegador local (com Origin), do celular pela rede e de um invasor (par falso).
   O zsh de cada Estação usa um ZDOTDIR vazio dentro da raiz temporária: o histórico dos testes nunca vai para o $HOME do Theus.
*/
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const token = require('../../servidor/token');

/* BABEL_TESTE_APP: roda o mesmo teste contra outra cópia do app (usado para provar que os testes pegam defeito de propósito) */
const APP = process.env.BABEL_TESTE_APP || path.join(__dirname, '..', '..');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/* o ambiente dos filhos: sem variáveis de sessão de quem roda os testes (terminal, Claude Code) */
function ambienteLimpo() {
  const env = {};
  Object.keys(process.env).forEach((k) => { if (!/^(CLAUDE|TERM_SESSION|TERM_PROGRAM|TERM_FEATURES|ITERM|LC_TERMINAL|BABEL_COOP)/.test(k)) env[k] = process.env[k]; });
  return env;
}

/* um IPv4 da rede local desta máquina (para testar o "celular" e o encontro de verdade) */
function ipDaRede() {
  const ifs = os.networkInterfaces();
  for (const k of Object.keys(ifs)) for (const i of ifs[k] || []) if (i.family === 'IPv4' && !i.internal) return i.address;
  return null;
}

function pedirHttp({ porta, host = '127.0.0.1', metodo = 'GET', caminho, corpo, headers = {} }) {
  return new Promise((ok, erro) => {
    const dados = corpo == null ? null : Buffer.from(JSON.stringify(corpo));
    const req = http.request({ host, port: porta, method: metodo, path: caminho, headers: Object.assign({}, dados ? { 'Content-Type': 'application/json', 'Content-Length': dados.length } : {}, headers) }, (res) => {
      let s = ''; res.on('data', (c) => { s += c; }); res.on('end', () => { let j = null; try { j = JSON.parse(s); } catch (e) { j = null; } ok({ status: res.statusCode, json: j, texto: s }); });
    });
    req.on('error', erro);
    if (dados) req.write(dados);
    req.end();
  });
}

class Navegador {
  constructor(url, origem) {
    this.msgs = [];
    this.saidas = new Map();
    this.ouvintes = new Set();
    const opcoes = origem ? { origin: origem } : {};
    this.ws = new WebSocket(url, opcoes);
    this.aberto = new Promise((ok, erro) => {
      this.ws.on('open', ok);
      this.ws.on('unexpected-response', (req, res) => erro(Object.assign(new Error('recusado com HTTP ' + res.statusCode), { status: res.statusCode })));
      this.ws.on('error', (e) => erro(e));
    });
    this.aberto.catch(() => { /* quem testa recusa trata */ });
    this.ws.on('message', (b) => {
      let m; try { m = JSON.parse(b.toString()); } catch (e) { return; }
      m.chegou = performance.now();
      this.msgs.push(m);
      if (m.tipo === 'term-saida') { const k = m.dono + '/' + m.id; this.saidas.set(k, (this.saidas.get(k) || '') + m.dados); }
      this.ouvintes.forEach((fn) => fn(m));
    });
  }
  enviar(m) { this.ws.send(JSON.stringify(m)); }
  saida(dono, id) { return this.saidas.get(dono + '/' + id) || ''; }
  /* espera uma mensagem que case (olhando também as que já chegaram a partir de `desde`) */
  esperar(pred, { ms = 8000, desde = 0, oque = 'mensagem' } = {}) {
    for (let i = desde; i < this.msgs.length; i++) if (pred(this.msgs[i])) return Promise.resolve(this.msgs[i]);
    return new Promise((ok, erro) => {
      const fn = (m) => { if (pred(m)) { clearTimeout(t); this.ouvintes.delete(fn); ok(m); } };
      const t = setTimeout(() => { this.ouvintes.delete(fn); erro(new Error('tempo esgotado esperando ' + oque)); }, ms);
      this.ouvintes.add(fn);
    });
  }
  esperarSaida(dono, id, teste, { ms = 8000, oque = 'saída' } = {}) {
    const casa = () => (typeof teste === 'function' ? teste(this.saida(dono, id)) : this.saida(dono, id).includes(teste));
    if (casa()) return Promise.resolve(this.saida(dono, id));
    return this.esperar((m) => m.tipo === 'term-saida' && m.dono === dono && m.id === id && casa(), { ms, desde: this.msgs.length, oque }).then(() => this.saida(dono, id));
  }
  ultima(pred) { for (let i = this.msgs.length - 1; i >= 0; i--) if (pred(this.msgs[i])) return this.msgs[i]; return null; }
  fechar() { try { this.ws.close(); } catch (e) { /* ok */ } }
}

class Estacao {
  /* executavel/ambiente: para rodar o mesmo servidor no runtime do Electron (ELECTRON_RUN_AS_NODE=1), sem janela */
  constructor({ nome, porta, descoberta, raiz, executavel = process.execPath, ambiente = {} }) {
    this.nome = nome; this.porta = porta; this.descoberta = descoberta; this.executavel = executavel; this.ambienteExtra = ambiente;
    this.raiz = raiz || fs.mkdtempSync(path.join(os.tmpdir(), 'babel-srv-' + nome + '-'));
    this.zdot = path.join(this.raiz, '.zdot');
    fs.mkdirSync(this.zdot, { recursive: true });
    fs.writeFileSync(path.join(this.zdot, '.zshrc'), '# zsh dos testes do Babel Coop: sem configuração pessoal\n');
    this.log = '';
    this.navegadores = [];
  }

  async subir() {
    const env = Object.assign(ambienteLimpo(), { BABEL_COOP_RAIZ: this.raiz, BABEL_COOP_PORTA: String(this.porta), BABEL_COOP_DESCOBERTA: String(this.descoberta), ZDOTDIR: this.zdot, SHELL: '/bin/zsh' }, this.ambienteExtra);
    this.filho = spawn(this.executavel, ['servidor/servidor.js'], { cwd: APP, env, stdio: ['ignore', 'pipe', 'pipe'] });
    this.filho.stdout.on('data', (d) => { this.log += d; });
    this.filho.stderr.on('data', (d) => { this.log += d; });
    this.saiu = new Promise((ok) => this.filho.on('exit', (codigo, sinal) => ok({ codigo, sinal })));
    for (let i = 0; i < 100; i++) {
      try { const r = await this.api('GET', '/api/eu'); if (r.status === 200) return this; } catch (e) { /* ainda subindo */ }
      await esperar(100);
    }
    throw new Error(this.nome + ' não subiu: ' + this.log);
  }

  api(metodo, caminho, corpo, extra = {}) { return pedirHttp(Object.assign({ porta: this.porta, metodo, caminho, corpo }, extra)); }
  eu() { return this.api('GET', '/api/eu').then((r) => r.json); }

  /* navegador desta máquina (Estação): loopback + Origin http://localhost:<porta> */
  async navegador({ origem = 'http://localhost:' + this.porta, host = '127.0.0.1' } = {}) {
    const n = new Navegador('ws://' + host + ':' + this.porta + '/ws', origem);
    this.navegadores.push(n);
    await n.aberto;
    await n.esperar((m) => m.tipo === 'bemvindo', { oque: 'bemvindo' });
    return n;
  }

  /* os pares como esta Estação os vê */
  async pares() { return (await this.eu()).pares || []; }
  async esperarPar(id, pred = (p) => p.ligado, ms = 15000) {
    const fim = Date.now() + ms;
    while (Date.now() < fim) { const p = (await this.pares()).find((x) => x.id === id); if (p && pred(p)) return p; await esperar(150); }
    throw new Error(this.nome + ' não viu ' + id + ' a tempo: ' + JSON.stringify(await this.pares()));
  }

  async parar() {
    this.navegadores.forEach((n) => n.fechar());
    if (!this.filho || this.filho.exitCode !== null || this.filho.signalCode) return;
    this.filho.kill('SIGTERM');
    const r = await Promise.race([this.saiu, esperar(4000).then(() => null)]);
    if (!r) { this.filho.kill('SIGKILL'); await this.saiu; }
  }
}

/* um "par" escrito à mão: faz o aperto de mão com o que receber em `cfg` e deixa forjar o ola */
class ParFalso {
  constructor(porta, { cfg, forjar, host = '127.0.0.1', origem = null, semDesafio = false } = {}) {
    this.cfg = cfg; this.forjar = forjar;
    this.meu = token.novoDesafio();
    this.recebidas = [];
    this.ouvintes = new Set();
    this.ws = new WebSocket('ws://' + host + ':' + porta + '/ws?par=1', origem ? { origin: origem } : {});
    this.fechou = new Promise((ok) => this.ws.on('close', (codigo) => ok(codigo)));
    this.ws.on('error', () => { /* o close vem */ });
    this.aberto = new Promise((ok, erro) => { this.ws.on('open', ok); this.ws.on('unexpected-response', (q, res) => erro(Object.assign(new Error('HTTP ' + res.statusCode), { status: res.statusCode }))); });
    this.aberto.catch(() => { /* quem testa trata */ });
    if (!semDesafio) this.ws.on('open', () => this.desafiar()); /* o nosso desafio vai antes do nosso ola, como numa Estação de verdade */
    this.pronto = new Promise((ok) => { this.aoOla = ok; });
    this.ws.on('message', (buf, binario) => {
      if (binario) {
        let m; try { m = JSON.parse(token.abrir(this.canal, buf)); } catch (e) { return; }
        this.recebidas.push(m); this.ouvintes.forEach((fn) => fn(m));
        return;
      }
      const m = JSON.parse(buf.toString());
      if (m.tipo === 'desafio') {
        this.dele = m;
        this.canal = token.canal(this.meu, this.dele);
        if (this.cfg) {
          let ola = token.ola(this.cfg, this.dele, this.meu, {});
          if (this.forjar) ola = this.forjar(ola, { dele: this.dele, meu: this.meu }) || ola;
          this.cru(ola);
        }
      }
      if (m.tipo === 'ola') { this.olaDele = m; this.aoOla(m); }
    });
  }
  desafiar() { this.cru({ tipo: 'desafio', nonce: this.meu.nonce, efemera: this.meu.efemera }); }
  cru(m) { if (this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(m)); }
  selado(m) { if (this.ws.readyState === WebSocket.OPEN) this.ws.send(token.selar(this.canal, JSON.stringify(m)), { binary: true }); }
  esperar(pred, ms = 5000) {
    const ja = this.recebidas.find(pred);
    if (ja) return Promise.resolve(ja);
    return new Promise((ok, erro) => {
      const fn = (m) => { if (pred(m)) { clearTimeout(t); this.ouvintes.delete(fn); ok(m); } };
      const t = setTimeout(() => { this.ouvintes.delete(fn); erro(new Error('par falso: tempo esgotado')); }, ms);
      this.ouvintes.add(fn);
    });
  }
  /* fechou em até `ms`? devolve o código, ou null se continua aberta */
  fechouEm(ms = 3000) { return Promise.race([this.fechou, esperar(ms).then(() => null)]); }
  fechar() { try { this.ws.terminate(); } catch (e) { /* ok */ } }
}

/* procura um texto em todos os arquivos (sem seguir links) de cada pasta; devolve os arquivos onde achou */
function buscarNoDisco(pastas, texto) {
  const alvo = Buffer.from(texto);
  const achados = [];
  let arquivos = 0, bytes = 0;
  const andar = (p) => {
    let st; try { st = fs.lstatSync(p); } catch (e) { return; }
    if (st.isSymbolicLink()) return;
    if (st.isDirectory()) { let itens = []; try { itens = fs.readdirSync(p); } catch (e) { return; } itens.forEach((n) => andar(path.join(p, n))); return; }
    if (!st.isFile()) return;
    arquivos += 1; bytes += st.size;
    let buf; try { buf = fs.readFileSync(p); } catch (e) { return; }
    if (buf.indexOf(alvo) !== -1) achados.push(p);
  };
  pastas.forEach(andar);
  return { achados, arquivos, bytes };
}

function percentil(lista, p) { const o = lista.slice().sort((a, b) => a - b); return o[Math.min(o.length - 1, Math.ceil((p / 100) * o.length) - 1)]; }

module.exports = { Estacao, Navegador, ParFalso, pedirHttp, ipDaRede, buscarNoDisco, percentil, esperar, APP };
