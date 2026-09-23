/* Babel Coop · terminais de verdade (node-pty) no servidor do dono (PROTOCOLO §3)
   Cada agente é uma sessão de shell da pessoa, aberta na pasta compartilhada dela.
   Duas telas em memória por sessão (@xterm/headless + @xterm/addon-serialize, 1000 linhas):
     - telaReal: toda a saída (serve para a própria Estação recarregar);
     - telaPublica: só a saída fora da pausa (é o que quem assiste de fora recebe ao entrar).
   Nada vai para o disco e nada do conteúdo vai para o log.
   Quem pode digitar não é decidido aqui: o servidor (controle.js) decide antes de chamar escrever().
   Eventos:
     aoLocal(msg)   → para as telas desta Estação (tudo, inclusive durante a pausa)
     aoPublico(msg) → para as outras Estações (nunca o que saiu durante a pausa);
                      term-saida e term-tela só para quem assiste aquela sessão, o resto para todos
*/
'use strict';
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
let pty = null;
try { pty = require('node-pty'); } catch (e) { pty = null; }
let Tela = null, Serializar = null;
try { Tela = require('@xterm/headless').Terminal; Serializar = require('@xterm/addon-serialize').SerializeAddon; } catch (e) { Tela = null; }

const ID = /^[A-Za-z0-9_-]{1,48}$/;
const ROLAGEM = 1000;
const TIQUE = 300;            /* leitura do processo da frente */
const ESPERA = 1500;          /* claude parado sem saída há 1,5 s = esperando a pessoa */
const MAX_SESSOES = 32;
const MAX_ENTRADA = 1024 * 1024; /* por mensagem de teclas (colar texto grande): a interface fatia se passar disso */
const ALTO = 8 * 1024 * 1024, BAIXO = 1024 * 1024; /* controle de fluxo: a tela em memória nunca fica para trás */
const RETOMADA = '\x1b[2J\x1b[H— transmissão retomada —\r\n';
/* o que o terminal do app não herda de quem abriu o app (outro terminal, o próprio Claude Code): identidade de outro emulador e tokens de sessão */
const NAO_HERDAR = /^(CLAUDECODE|CLAUDE_CODE_.*|CLAUDE_PID|CLAUDE_EFFORT|TERM_SESSION_ID|TERM_PROGRAM|TERM_PROGRAM_VERSION|TERM_FEATURES|TERMINFO_DIRS|ITERM_.*|LC_TERMINAL|LC_TERMINAL_VERSION|COLORFGBG|VSCODE_.*|ELECTRON_RUN_AS_NODE)$/;

function inteiro(v, min, max, padrao) { v = Math.floor(+v); return Number.isFinite(v) && v >= min && v <= max ? v : padrao; }
function limparNome(n) { return String(n == null ? '' : n).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 60); }
function ehClaude(nome) { return /claude/i.test(String(nome || '')); }

/* o estado da presença a partir do que se sabe agora (função pura: os testes de unidade usam) */
function estadoDe({ pausada, naShell, nome, comm, ultimoDado, agora, fim }) {
  if (pausada) return 'pausado';
  if (naShell) return fim ? 'terminou' : 'shell';
  if ((ehClaude(nome) || ehClaude(comm)) && agora - ultimoDado >= ESPERA) return 'espera';
  return 'rodando';
}

class Terminais {
  constructor(cfg) {
    this.cfg = cfg;
    this.sessoes = new Map();
    this.ouvintesLocal = [];
    this.ouvintesPublico = [];
    this.ouvintesFechou = [];
    this.timer = setInterval(() => this.sessoes.forEach((s) => this.tique(s)), TIQUE);
    if (this.timer.unref) this.timer.unref();
  }

  disponivel() { return !!(pty && Tela && Serializar); }

  shell() {
    if (process.platform === 'win32') return { cmd: 'powershell.exe', args: ['-NoLogo'] };
    return { cmd: process.env.SHELL || (process.platform === 'darwin' ? '/bin/zsh' : '/bin/bash'), args: ['-l'] };
  }
  nomeShell() { return path.basename(this.shell().cmd).replace(/\.exe$/i, '').toLowerCase(); }
  ehShell(comm) { return comm == null || String(comm).replace(/^-/, '').replace(/\.exe$/i, '').toLowerCase() === this.nomeShell(); }

  ambiente(nome) {
    const env = {};
    Object.keys(process.env).forEach((k) => { if (!NAO_HERDAR.test(k)) env[k] = process.env[k]; });
    return Object.assign(env, {
      TERM: 'xterm-256color', COLORTERM: 'truecolor', LANG: process.env.LANG || 'pt_BR.UTF-8', TERM_PROGRAM: 'BabelCoop',
      BABEL_COOP: '1', BABEL_AGENTE: nome, BABEL_EU: this.cfg.id
    });
  }

  /* ---------- abrir e fechar ---------- */
  abrir({ id, nome, cols, rows } = {}) {
    if (typeof id !== 'string' || !ID.test(id)) throw new Error('id de terminal inválido');
    if (this.sessoes.has(id)) return this.info(this.sessoes.get(id), false);
    if (!pty) throw new Error('node-pty indisponível: rode npm install');
    if (!Tela || !Serializar) throw new Error('@xterm/headless indisponível: rode npm install');
    if (this.sessoes.size >= MAX_SESSOES) throw new Error('limite de ' + MAX_SESSOES + ' terminais abertos');
    cols = inteiro(cols, 2, 500, 100); rows = inteiro(rows, 1, 200, 30);
    nome = limparNome(nome) || id;
    const sh = this.shell();
    const proc = pty.spawn(sh.cmd, sh.args, { name: 'xterm-256color', cols, rows, cwd: this.cfg.pasta, env: this.ambiente(nome) });
    const agora = Date.now();
    const s = {
      id, nome, dono: this.cfg.id, proc, pid: proc.pid, cols, rows, pausada: false, criada: agora, fechada: false,
      telaReal: new Tela({ cols, rows, scrollback: ROLAGEM, allowProposedApi: true }), serReal: new Serializar(),
      telaPublica: new Tela({ cols, rows, scrollback: ROLAGEM, allowProposedApi: true }), serPublica: new Serializar(),
      bytes: 0, bytesPublicos: 0, ultimoDado: agora, pendente: 0, segurando: false, saindo: false, digitou: false,
      frente: { comm: null, nome: this.nomeShell(), desde: agora, naShell: true }, fim: null, pausaDesde: null,
      enviadoLocal: null, enviadoPublico: null
    };
    s.telaReal.loadAddon(s.serReal);
    s.telaPublica.loadAddon(s.serPublica);
    proc.onData((d) => this.dados(s, d));
    proc.onExit(({ exitCode }) => this.saiu(s, exitCode));
    this.sessoes.set(id, s);
    this.lista_();
    return this.info(s, false);
  }

  dados(s, d) {
    if (s.saindo) return; /* o processo já saiu: o term-fim já está na fila */
    const n = Buffer.byteLength(d);
    s.bytes += n;
    s.ultimoDado = Date.now();
    /* a saída sai no callback da tela: a ordem de quem recebe é a mesma da tela serializada (quem entra depois não perde nem repete pedaço) */
    this.escreverTela(s, 'telaReal', d, () => this.local({ tipo: 'term-saida', dono: s.dono, id: s.id, dados: d }));
    if (!s.pausada) {
      s.bytesPublicos += n;
      this.escreverTela(s, 'telaPublica', d, () => this.publico({ tipo: 'term-saida', dono: s.dono, id: s.id, dados: d }));
    }
  }

  escreverTela(s, qual, d, depois) {
    s.pendente += d.length;
    if (s.pendente > ALTO && !s.segurando) { s.segurando = true; try { s.proc.pause(); } catch (e) { /* ok */ } }
    try {
      s[qual].write(d, () => {
        s.pendente -= d.length;
        if (s.segurando && s.pendente < BAIXO) { s.segurando = false; try { s.proc.resume(); } catch (e) { /* ok */ } }
        depois();
      });
    } catch (e) { s.pendente -= d.length; if (!s.fechada) depois(); }
  }

  saiu(s, codigo) {
    if (s.saindo) return;
    s.saindo = true;
    this.sessoes.delete(s.id);
    /* term-fim depois do último pedaço de saída de cada tela */
    let faltam = 2;
    const pronto = () => {
      if (--faltam) return;
      s.fechada = true;
      try { s.telaReal.dispose(); s.telaPublica.dispose(); } catch (e) { /* ok */ }
      this.lista_();
      this.ouvintesFechou.forEach((fn) => fn(s.id));
    };
    const fim = { tipo: 'term-fim', dono: s.dono, id: s.id, codigo: codigo == null ? null : codigo };
    this.escreverTela(s, 'telaReal', '', () => { this.local(fim); pronto(); });
    this.escreverTela(s, 'telaPublica', '', () => { this.publico(fim); pronto(); });
  }

  fechar(id) { const s = this.sessoes.get(id); if (s) try { s.proc.kill(); } catch (e) { /* já fechou */ } }
  fecharTodos() {
    this.sessoes.forEach((s) => { try { s.proc.kill(); } catch (e) { /* já fechou */ } });
    clearInterval(this.timer);
  }

  /* ---------- o que o dono faz ---------- */
  escrever(id, dados) {
    const s = this.sessoes.get(id);
    if (!s || s.saindo || typeof dados !== 'string' || !dados) return false;
    s.digitou = true;
    s.proc.write(dados.length > MAX_ENTRADA ? dados.slice(0, MAX_ENTRADA) : dados);
    return true;
  }

  redimensionar(id, cols, rows) {
    const s = this.sessoes.get(id);
    cols = inteiro(cols, 2, 500, 0); rows = inteiro(rows, 1, 200, 0);
    if (!s || !cols || !rows) return false;
    if (cols === s.cols && rows === s.rows) return true;
    try { s.proc.resize(cols, rows); } catch (e) { return false; }
    s.telaReal.resize(cols, rows); s.telaPublica.resize(cols, rows);
    s.cols = cols; s.rows = rows;
    const msg = { tipo: 'term-tamanho', dono: s.dono, id, cols, rows };
    this.local(msg); this.publico(msg);
    return true;
  }

  pausar(id, sim) {
    const s = this.sessoes.get(id);
    sim = !!sim;
    if (!s || s.pausada === sim) return false;
    s.pausada = sim;
    const msg = { tipo: 'term-pausa', dono: s.dono, id, pausada: sim };
    this.local(msg); this.publico(msg);
    if (sim) s.pausaDesde = Date.now();
    else {
      s.pausaDesde = null;
      /* quem assiste recomeça de uma tela limpa: o que saiu durante a pausa nunca é transmitido, nem depois */
      this.escreverTela(s, 'telaPublica', RETOMADA, () => this.publico(this.telaMsg(s, true)));
    }
    this.lista_();
    this.tique(s);
    return true;
  }

  renomear(id, nome) {
    const s = this.sessoes.get(id);
    nome = limparNome(nome);
    if (!s || !nome) return false;
    s.nome = nome;
    this.lista_();
    return true;
  }

  /* ---------- telas ---------- */
  existe(id) { return this.sessoes.has(id); }
  pausada(id) { const s = this.sessoes.get(id); return !!(s && s.pausada); }
  /* o shell está parado no prompt (nada na frente)? Lido na hora, sem esperar o tique: agentes.js só digita o `claude` assim */
  parado(id) {
    const s = this.sessoes.get(id);
    if (!s || s.saindo) return false;
    let comm = null;
    try { comm = s.proc.process; } catch (e) { return false; }
    return this.ehShell(comm);
  }

  /* a tela inteira (depois de tudo que já chegou), para quem abre ou entra agora */
  tela(id, publica, cb) {
    const s = this.sessoes.get(id);
    if (!s) return cb(null);
    this.escreverTela(s, publica ? 'telaPublica' : 'telaReal', '', () => cb(this.telaMsg(s, publica)));
  }
  telaMsg(s, publica) {
    const ser = publica ? s.serPublica : s.serReal;
    let dados = '';
    try { dados = ser.serialize({ scrollback: ROLAGEM }); } catch (e) { dados = ''; }
    return { tipo: 'term-tela', dono: s.dono, id: s.id, cols: s.cols, rows: s.rows, pausada: s.pausada, dados };
  }

  info(s, publica) {
    if (typeof s === 'string') s = this.sessoes.get(s);
    if (!s) return null;
    const a = this.atividade(s);
    const i = { id: s.id, nome: s.nome, dono: s.dono, pid: s.pid, cols: s.cols, rows: s.rows, pausada: s.pausada, criada: s.criada, estado: a.estado, processo: a.processo };
    if (publica && s.pausada) delete i.processo;
    return i;
  }
  lista(publica) { return Array.from(this.sessoes.values()).map((s) => this.info(s, publica)); }
  lista_() {
    this.local({ tipo: 'term-lista', dono: this.cfg.id, lista: this.lista(false) });
    this.publico({ tipo: 'term-lista', dono: this.cfg.id, lista: this.lista(true) });
  }

  /* ---------- atividade (alimenta a presença) ---------- */
  atividade(s) {
    const agora = Date.now(), f = s.frente;
    const estado = estadoDe({ pausada: s.pausada, naShell: f.naShell, nome: f.nome, comm: f.comm, ultimoDado: s.ultimoDado, agora, fim: s.fim });
    const a = { estado, processo: f.nome, desde: f.desde };
    if (estado === 'terminou') { a.processo = s.fim.processo; a.desde = s.fim.fim; a.duracao = s.fim.duracao; a.fim = s.fim.fim; }
    if (estado === 'pausado') a.desde = s.pausaDesde;
    return a;
  }

  tique(s) {
    if (s.saindo) return;
    const agora = Date.now();
    let comm = null;
    try { comm = s.proc.process; } catch (e) { comm = null; }
    if (comm !== s.frente.comm) {
      const antes = s.frente, naShell = this.ehShell(comm);
      /* "terminou" só para o que a pessoa rodou: processos do arranque do shell (antes da primeira tecla) não contam */
      if (!antes.naShell && naShell && antes.pedido) s.fim = { processo: antes.nome, duracao: agora - antes.desde, fim: agora };
      if (!naShell && s.digitou) s.fim = null;
      s.frente = { comm, nome: naShell ? this.nomeShell() : String(comm), desde: naShell && antes.naShell ? antes.desde : agora, naShell, pedido: !naShell && s.digitou };
      if (!naShell) this.resolverNome(s, s.frente);
    }
    const a = this.atividade(s);
    const local = Object.assign({ tipo: 'term-atividade', dono: s.dono, id: s.id }, a, { bytes: s.bytes });
    const chave = (m) => m.estado + '|' + (m.processo || '') + '|' + m.desde + '|' + (m.bytes == null ? '' : m.bytes);
    if (chave(local) !== s.enviadoLocal) { s.enviadoLocal = chave(local); this.local(local); }
    /* em pausa, quem está fora só sabe que está pausado (sem processo, sem contagem) */
    const pub = s.pausada ? { tipo: 'term-atividade', dono: s.dono, id: s.id, estado: 'pausado', desde: s.pausaDesde } : Object.assign({}, local, { bytes: s.bytesPublicos });
    if (chave(pub) !== s.enviadoPublico) { s.enviadoPublico = chave(pub); this.publico(pub); }
  }

  /* o nome do processo que o sistema dá (p_comm) pode não ser o que a pessoa digitou: o `claude` instalado é um link
     para um binário chamado pela versão (ex.: 2.1.281). O argv[0] do líder do grupo da frente, lido do `ps` só quando
     a frente muda, é o nome que a pessoa reconhece. */
  resolverNome(s, frente) {
    if (process.platform === 'win32' || typeof s.proc._pty !== 'string') return;
    const tty = s.proc._pty.replace(/^\/dev\//, '');
    execFile(process.platform === 'darwin' ? '/bin/ps' : 'ps', ['-o', 'pid=,tpgid=,comm=', '-t', tty], { timeout: 1500 }, (erro, saida) => {
      if (erro || s.saindo || s.frente !== frente) return;
      const linha = String(saida).split('\n').map((l) => l.trim().match(/^(\d+)\s+(\d+)\s+(.+)$/)).find((m) => m && m[1] === m[2]);
      if (!linha) return;
      const nome = path.basename(linha[3].trim());
      if (nome && nome !== frente.nome && !this.ehShell(nome)) { frente.nome = nome.slice(0, 60); this.tique(s); }
    });
  }

  aoLocal(fn) { this.ouvintesLocal.push(fn); }
  aoPublico(fn) { this.ouvintesPublico.push(fn); }
  aoFechar(fn) { this.ouvintesFechou.push(fn); }
  local(msg) { this.ouvintesLocal.forEach((fn) => { try { fn(msg); } catch (e) { console.error('[terminal] ouvinte local:', e.message); } }); }
  publico(msg) { this.ouvintesPublico.forEach((fn) => { try { fn(msg); } catch (e) { console.error('[terminal] ouvinte público:', e.message); } }); }
}

module.exports = { Terminais, estadoDe, ehClaude, ID, plataforma: os.platform() };
