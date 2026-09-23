/* Babel Coop · as Estações se acham na rede local e conversam só depois de provar quem são
   - Descoberta: anúncio por UDP broadcast a cada 2 s ("estou aqui, na porta X"); quem tem o id menor liga.
   - Encontro: os endereços que vieram no token (a Estação de quem convidou) são ligados direto,
     mesmo se o broadcast estiver bloqueado no Wi-Fi.
   - Aperto de mão (PROTOCOLO §2): ao abrir o WebSocket os dois lados mandam `desafio`; cada um responde com `ola`
     (carteira assinada pela equipe + resposta assinada com a própria chave). Nada além disso é aceito antes do ola conferido.
     id, nome e papel do par vêm da carteira, nunca do que ele declara (nem do anúncio UDP).
   - Depois do ola conferido, cada mensagem vai selada (AES-256-GCM, chaves da troca efêmera): quem está no meio
     da rede não lê o terminal de ninguém nem injeta tecla.
   Não depende de IP fixo nem de servidor central: cada computador é um servidor.
*/
'use strict';
const dgram = require('dgram');
const os = require('os');
const net = require('net');
const WebSocket = require('ws');
const token = require('./token');

const MORTO = 7000;          /* anúncio UDP sem renovação some da lista de vistos */
const APERTO = 5000;         /* tempo para o aperto de mão terminar */
const LOOPBACK = new Set(['127.0.0.1', '::1', 'localhost', '::ffff:127.0.0.1']);

class Rede {
  constructor(cfg, diario, aoMensagemDePar) {
    this.cfg = cfg;
    this.diario = diario;
    this.aoMensagemDePar = aoMensagemDePar; /* (par, msg) => void · terminais e controle que passam de máquina em máquina */
    this.pares = new Map();     /* id → { id, nome, papel, carteira, host, porta, ts, conexao, ws } · só pares verificados */
    this.vistos = new Map();    /* id → { host, porta, ts } · anúncios UDP (não valem como identidade) */
    this.conexoes = new Set();  /* todas as ligações WebSocket com outras Estações, em aperto de mão ou verificadas */
    this.tentando = new Map();  /* 'host:porta' → ws de saída ainda viva */
    this.idDoEndereco = new Map(); /* 'host:porta' → id de quem respondeu lá (o encontro não religa quem já está ligado por outro caminho) */
    this.ouvintesPares = [];
    this.ouvintesLigar = [];
    this.ouvintesCair = [];
    this.serie = 0;
    this.duplicadas = 0;       /* ligações fechadas porque já havia outra com o mesmo par */
  }

  iniciar() {
    this.udp = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    this.udp.on('message', (buf, rinfo) => {
      let m; try { m = JSON.parse(buf.toString()); } catch (e) { return; }
      if (!m || m.coop !== 1 || typeof m.id !== 'string' || !token.ID.test(m.id) || m.id === this.cfg.id) return;
      if (m.equipe !== this.cfg.equipe || !(m.porta > 0 && m.porta < 65536)) return;
      this.viu({ id: m.id, host: rinfo.address, porta: +m.porta });
    });
    this.udp.on('error', (e) => console.error('[rede] udp', e.message));
    this.udp.bind(this.cfg.descoberta, () => {
      try { this.udp.setBroadcast(true); } catch (e) { /* alguns sistemas negam */ }
      this.anunciar();
    });
    this.timer = setInterval(() => { this.anunciar(); this.limpar(); this.encontro(); }, 2000);
    this.encontro();
  }

  /* ---------- achar os outros ---------- */
  anunciar() {
    if (!this.udp) return;
    const msg = Buffer.from(JSON.stringify({ coop: 1, id: this.cfg.id, equipe: this.cfg.equipe, porta: this.cfg.porta }));
    const destinos = new Set(['255.255.255.255']);
    const ifs = os.networkInterfaces();
    Object.keys(ifs).forEach((k) => (ifs[k] || []).forEach((i) => { if (i.family === 'IPv4' && !i.internal && i.netmask) destinos.add(broadcastDe(i.address, i.netmask)); }));
    destinos.forEach((d) => { try { this.udp.send(msg, this.cfg.descoberta, d, () => { /* sem rota: tenta de novo em 2 s */ }); } catch (e) { /* interface sem broadcast */ } });
  }

  /* anúncio UDP: só dispara a ligação; quem é quem se decide no aperto de mão */
  viu(info) {
    this.vistos.set(info.id, { host: info.host, porta: info.porta, ts: Date.now() });
    const par = this.pares.get(info.id);
    if (par && this.ligado(par)) return;
    if (this.cfg.id < info.id) this.conectar(info.host, info.porta); /* só um dos dois liga, o de id menor */
  }

  /* os endereços que vieram no token: liga direto */
  encontro() {
    const meus = new Set(token.meusEnderecos(this.cfg.porta));
    (this.cfg.encontro || []).forEach((end) => {
      const i = end.lastIndexOf(':');
      const host = end.slice(0, i).replace(/^\[|\]$/g, ''), porta = +end.slice(i + 1);
      if (!host || !porta) return;
      if (porta === this.cfg.porta && (LOOPBACK.has(host) || meus.has(host + ':' + porta))) return; /* sou eu */
      const conhecido = this.idDoEndereco.get(host + ':' + porta);
      if (conhecido && (conhecido === this.cfg.id || this.ligado(this.pares.get(conhecido)))) return;
      const ja = [...this.pares.values()].some((p) => this.ligado(p) && p.host === host && +p.porta === porta);
      if (!ja) this.conectar(host, porta);
    });
  }

  conectar(host, porta) {
    const end = host + ':' + porta;
    if (this.tentando.has(end)) return;
    const alvo = 'ws://' + (net.isIPv6(host) ? '[' + host + ']' : host) + ':' + porta + '/ws?par=1';
    let ws;
    try { ws = new WebSocket(alvo, { handshakeTimeout: 4000, maxPayload: 32 * 1024 * 1024 }); } catch (e) { return; }
    this.tentando.set(end, ws);
    ws.on('open', () => this.nova(ws, { host, porta, iniciei: true }));
    ws.on('error', () => { /* desligado ou recusado: o próximo ciclo tenta de novo */ });
    ws.on('close', () => { if (this.tentando.get(end) === ws) this.tentando.delete(end); });
  }

  /* chamado pelo servidor quando alguém liga em /ws?par=1 */
  aceitar(ws, host) { this.nova(ws, { host, porta: null, iniciei: false }); }

  /* ---------- aperto de mão ---------- */
  nova(ws, { host, porta, iniciei }) {
    const c = { ws, host, porta, iniciei, serie: ++this.serie, meu: token.novoDesafio(), dele: null, verificado: false, canal: null, par: null };
    this.conexoes.add(c);
    ws.on('message', (buf, binario) => this.receber(c, buf, binario));
    ws.on('close', () => this.fechou(c));
    ws.on('error', () => { /* o close vem em seguida */ });
    c.limite = setTimeout(() => { if (!c.verificado) this.recusar(c, 'aperto de mão demorou'); }, APERTO);
    this.crua(c, { tipo: 'desafio', nonce: c.meu.nonce, efemera: c.meu.efemera });
  }

  recusar(c, motivo) {
    if (!c.recusada) console.warn('[rede] ligação recusada (' + (c.host || '?') + '): ' + motivo);
    c.recusada = true;
    try { c.ws.close(4001, 'recusado'); } catch (e) { /* já fechada */ }
    setTimeout(() => { try { c.ws.terminate(); } catch (e) { /* ok */ } }, 1000).unref();
  }

  receber(c, buf, binario) {
    if (c.recusada) return;
    if (c.verificado) {
      /* depois do ola conferido, só vale mensagem selada com a chave desta ligação */
      if (!binario) return this.recusar(c, 'mensagem sem selo');
      let texto; try { texto = token.abrir(c.canal, buf); } catch (e) { return this.recusar(c, 'selo não confere'); }
      let m; try { m = JSON.parse(texto); } catch (e) { return; }
      if (!m || typeof m.tipo !== 'string') return;
      return this.mensagem(c, m);
    }
    if (binario) return this.recusar(c, 'mensagem selada antes do aperto de mão');
    let m; try { m = JSON.parse(buf.toString()); } catch (e) { return this.recusar(c, 'mensagem ilegível'); }
    if (m && m.tipo === 'desafio') {
      if (c.dele) return this.recusar(c, 'desafio repetido');
      if (typeof m.nonce !== 'string' || !/^[0-9a-f]{32}$/.test(m.nonce) || typeof m.efemera !== 'string' || m.efemera.length > 200) return this.recusar(c, 'desafio inválido');
      c.dele = { nonce: m.nonce, efemera: m.efemera };
      try { this.crua(c, token.ola(this.cfg, c.dele, c.meu, this.diario.cursores())); } catch (e) { return this.recusar(c, 'não consegui assinar: ' + e.message); }
      return;
    }
    if (m && m.tipo === 'ola') {
      if (!c.dele) return this.recusar(c, 'ola antes do desafio');
      const r = token.conferirOla(this.cfg, m, c.meu, c.dele.efemera);
      if (r.erro === 'sou eu mesmo' && c.iniciei) this.idDoEndereco.set(c.host + ':' + c.porta, this.cfg.id); /* não liga de novo para si mesmo */
      if (r.erro) return this.recusar(c, r.erro);
      try { c.canal = token.canal(c.meu, c.dele); } catch (e) { return this.recusar(c, 'chave efêmera inválida'); }
      c.verificado = true;
      clearTimeout(c.limite);
      return this.verificado(c, r.carteira, m);
    }
    /* nada além de desafio e ola antes do aperto de mão */
    return this.recusar(c, 'mensagem antes do aperto de mão (' + String(m && m.tipo).slice(0, 20) + ')');
  }

  verificado(c, carteira, m) {
    let par = this.pares.get(carteira.id);
    if (!par) { par = { id: carteira.id }; this.pares.set(carteira.id, par); }
    const estava = this.ligado(par);
    Object.assign(par, { nome: carteira.nome, papel: carteira.papel, carteira, host: c.host, porta: c.porta || (+m.porta > 0 && +m.porta < 65536 ? +m.porta : null), ts: Date.now() });
    c.par = par;
    if (c.iniciei) this.idDoEndereco.set(c.host + ':' + c.porta, par.id);
    /* duas ligações com o mesmo par (descoberta + encontro ao mesmo tempo): as duas pontas escolhem a mesma */
    let fica = c;
    [...this.conexoes].filter((o) => o !== c && o.par === par && o.verificado && aberta(o)).forEach((o) => {
      if (o.iniciei !== c.iniciei) {
        const quemLiga = this.cfg.id < par.id ? 'eu' : 'ele';
        const guardar = ((c.iniciei ? 'eu' : 'ele') === quemLiga) ? c : o;
        const largar = guardar === c ? o : c;
        if (guardar !== c) fica = o;
        largar.largada = true;
        this.duplicadas += 1;
        try { largar.ws.close(1000, 'duplicada'); } catch (e) { /* ok */ }
      } else if (c.iniciei) {
        /* as duas saíram de mim: fecho a mais antiga */
        o.largada = true;
        this.duplicadas += 1;
        try { o.ws.close(1000, 'duplicada'); } catch (e) { /* ok */ }
      }
      /* as duas vieram dele: ele fecha a mais antiga; eu uso a mais nova */
    });
    if (!c.largada) { par.conexao = fica; par.ws = fica.ws; }
    this.selado(c, { tipo: 'eventos', lista: this.diario.desde(m.cursores) });
    if (!estava && this.ligado(par)) { this.avisar(); this.ouvintesLigar.forEach((fn) => fn(par)); }
  }

  mensagem(c, m) {
    const par = c.par;
    par.ts = Date.now();
    if (m.tipo === 'eventos') { (Array.isArray(m.lista) ? m.lista : []).forEach((ev) => this.diario.aceitar(ev)); return; }
    if (m.tipo === 'evento') { this.diario.aceitar(m.evento); return; }
    if (m.tipo === 'desafio' || m.tipo === 'ola') return;
    this.aoMensagemDePar(par, m);
  }

  fechou(c) {
    this.conexoes.delete(c);
    clearTimeout(c.limite);
    const par = c.par;
    if (!par || par.conexao !== c) return;
    const outra = [...this.conexoes].find((o) => o.par === par && o.verificado && aberta(o) && !o.largada);
    if (outra) { par.conexao = outra; par.ws = outra.ws; return; }
    par.conexao = null; par.ws = null; par.ts = Date.now();
    this.avisar();
    this.ouvintesCair.forEach((fn) => fn(par));
  }

  /* ---------- mandar ---------- */
  crua(c, msg) { if (aberta(c)) c.ws.send(JSON.stringify(msg)); }
  selado(c, msg) { if (aberta(c) && c.canal) c.ws.send(token.selar(c.canal, JSON.stringify(msg)), { binary: true }); }
  ligado(par) { return !!(par && par.conexao && aberta(par.conexao)); }
  enviarPar(par, msg) { if (!this.ligado(par)) return false; this.selado(par.conexao, msg); return true; }
  enviar(id, msg) { return this.enviarPar(this.pares.get(id), msg); }
  espalhar(msg) { this.pares.forEach((p) => this.enviarPar(p, msg)); }
  par(id) { return this.pares.get(id) || null; }

  limpar() {
    const agora = Date.now();
    this.vistos.forEach((v, id) => { if (agora - v.ts > MORTO) this.vistos.delete(id); });
  }

  /* diagnóstico (só para a própria Estação): as ligações abertas agora */
  estado() {
    return { serie: this.serie, duplicadas: this.duplicadas, pares: this.lista(), conexoes: [...this.conexoes].map((c) => ({ id: c.par ? c.par.id : null, host: c.host, porta: c.porta, iniciei: c.iniciei, verificado: c.verificado, usada: !!(c.par && c.par.conexao === c) })) };
  }

  /* quem aparece na interface: só quem já provou ser da equipe (ligado agora ou não) */
  lista() { return Array.from(this.pares.values()).map((p) => ({ id: p.id, nome: p.nome, papel: p.papel, host: p.host, porta: p.porta, ligado: this.ligado(p) })); }
  aoMudar(fn) { this.ouvintesPares.push(fn); }
  aoLigar(fn) { this.ouvintesLigar.push(fn); }
  aoCair(fn) { this.ouvintesCair.push(fn); }
  avisar() { const l = this.lista(); this.ouvintesPares.forEach((fn) => fn(l)); }

  parar() {
    clearInterval(this.timer);
    try { if (this.udp) this.udp.close(); } catch (e) { /* já fechado */ }
    this.udp = null;
    this.tentando.forEach((ws) => { try { ws.terminate(); } catch (e) { /* ok */ } });
    this.conexoes.forEach((c) => { clearTimeout(c.limite); try { c.ws.terminate(); } catch (e) { /* ok */ } });
  }
}

function aberta(c) { return !!(c && c.ws && c.ws.readyState === WebSocket.OPEN); }

function broadcastDe(ip, mascara) {
  const a = ip.split('.').map(Number), m = mascara.split('.').map(Number);
  return a.map((o, i) => (o & m[i]) | (~m[i] & 255)).join('.');
}

module.exports = { Rede };
