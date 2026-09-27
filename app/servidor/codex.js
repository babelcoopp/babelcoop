'use strict';
/* Codex app-server (JSON-RPC por stdio). Não altera a configuração pessoal nem envia pedidos ao ligar. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

function acharCodex() {
  if (process.env.BABEL_COOP_CODEX) return process.env.BABEL_COOP_CODEX;
  const nomes = process.platform === 'win32' ? ['codex.exe', 'codex.cmd'] : ['codex'];
  const pastas = String(process.env.PATH || '').split(path.delimiter).filter(Boolean).concat([
    path.join(os.homedir(), '.local', 'bin'), '/opt/homebrew/bin', '/usr/local/bin',
    '/Applications/Codex.app/Contents/Resources'
  ]);
  for (const pasta of pastas) for (const nome of nomes) {
    const f = path.join(pasta, nome);
    try { fs.accessSync(f, fs.constants.X_OK); if (fs.statSync(f).isFile()) return f; } catch (_) { /* próximo */ }
  }
  throw new Error('Codex não encontrado. Instale o Codex CLI e faça codex login no terminal; depois chame novamente.');
}

class Codex {
  constructor(o) { this.o = o; this.seq = 0; this.pendentes = new Map(); this.buffer = ''; this.fechado = false; this.turno = null; this.enviando = false; this.uso = { rateLimits: null, tokenUsage: null, threadUsage: null }; this.timerUso = null; }
  enviar(msg) {
    if (this.fechado || !this.processo || this.processo.stdin.destroyed) throw new Error('a conexão com o Codex terminou');
    this.processo.stdin.write(JSON.stringify(msg) + '\n');
  }
  chamar(method, params, opcoes) {
    return new Promise((resolve, reject) => {
      const id = ++this.seq;
      const timer = setTimeout(() => {
        this.pendentes.delete(id);
        reject(new Error('Codex demorou para responder: ' + method));
        if (!opcoes || opcoes.fecharAoExpirar !== false) this.fechar();
      }, opcoes && opcoes.timeoutMs || 90000);
      timer.unref();
      this.pendentes.set(id, { resolve, reject, timer });
      try { this.enviar({ id, method, params }); } catch (e) { clearTimeout(timer); this.pendentes.delete(id); reject(e); }
    });
  }
  responder(id, result) { if (!this.fechado) this.enviar({ id, result }); }
  receber(msg) {
    if (msg.method) {
      if (msg.id != null) {
        const responder = (result) => this.responder(msg.id, result);
        if (this.o.requisicao(msg.method, msg.params || {}, responder)) return;
        /* Protocolo desconhecido nunca concede acesso implicitamente. */
        this.enviar({ id: msg.id, error: { code: -32601, message: 'Pedido não suportado pelo Babel Coop; nenhuma permissão concedida.' } });
      } else {
        const p = msg.params || {};
        if (p.threadId && this.thread && p.threadId !== this.thread) return;
        if (msg.method === 'turn/started') this.turno = p.turn && p.turn.id;
        if (msg.method === 'turn/completed') this.turno = null;
        this.o.evento(msg.method, p);
      }
      return;
    }
    const p = this.pendentes.get(msg.id);
    if (!p) return;
    this.pendentes.delete(msg.id); clearTimeout(p.timer);
    if (msg.error) p.reject(new Error(msg.error.message || 'Codex recusou a operação')); else p.resolve(msg.result);
  }
  async iniciar() {
    const exe = acharCodex();
    /* binários nativos não recebem ELECTRON_RUN_AS_NODE; PATH do Finder ganha locais usuais. */
    const env = Object.assign({}, process.env);
    delete env.ELECTRON_RUN_AS_NODE;
    env.PATH = [path.dirname(exe), env.PATH || '', '/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin'].join(path.delimiter);
    this.processo = spawn(exe, ['app-server', '--listen', 'stdio://'], { cwd: this.o.pasta, env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    this.processo.stdout.setEncoding('utf8');
    this.processo.stdout.on('data', (s) => {
      this.buffer += s;
      if (Buffer.byteLength(this.buffer) > 32 * 1024 * 1024) return this.falhar(new Error('resposta do Codex excedeu o limite'));
      let i;
      while ((i = this.buffer.indexOf('\n')) >= 0) {
        const linha = this.buffer.slice(0, i); this.buffer = this.buffer.slice(i + 1);
        if (!linha.trim()) continue;
        try { this.receber(JSON.parse(linha)); } catch (e) { this.falhar(new Error('falha no protocolo Codex: ' + e.message)); return; }
      }
    });
    /* stderr pode conter dados de conectores; não publicar nem registrar. */
    this.processo.stderr.resume();
    this.processo.stdin.on('error', (e) => this.falhar(e));
    this.processo.on('error', (e) => this.falhar(e));
    this.processo.on('exit', () => { if (!this.fechado) this.falhar(new Error('o processo Codex saiu; chame novamente')); });
    await this.chamar('initialize', { clientInfo: { name: 'babel_coop', title: 'Babel Coop', version: '0.1.0' }, capabilities: { experimentalApi: true } });
    this.enviar({ method: 'initialized' });
    const conta = await this.chamar('account/read', { refreshToken: false });
    if (conta.requiresOpenaiAuth && !conta.account) throw new Error('Entre na sua conta: execute codex login no terminal e depois chame o Codex novamente.');
    const r = await this.chamar('thread/start', {
      cwd: this.o.pasta, developerInstructions: this.o.instrucoes,
      sandbox: 'workspace-write', approvalPolicy: 'on-request', approvalsReviewer: 'user', ephemeral: true,
      config: { 'mcp_servers.coop': { url: this.o.url, http_headers: { 'X-Coop-Segredo': this.o.segredo } } }
    });
    this.thread = r.thread.id;
    this.atualizarUso();
    this.timerUso = setInterval(() => this.atualizarUso(), 5 * 60 * 1000);
    if (this.timerUso.unref) this.timerUso.unref();
    return { modelo: r.model || null };
  }
  async atualizarUso() {
    if (this.fechado) return;
    const pedidos = [
      ['account/rateLimits/read', { excludeResetCreditDetails: true }],
      ['account/usage/read', { threadId: this.thread || null }]
    ];
    const resultados = await Promise.all(pedidos.map(([metodo, params]) => this.chamar(metodo, params, { timeoutMs: 12000, fecharAoExpirar: false }).catch(() => null)));
    if (this.fechado) return;
    if (resultados[0]) this.uso.rateLimits = resultados[0].rateLimitsByLimitId && resultados[0].rateLimitsByLimitId.codex || resultados[0].rateLimits || this.uso.rateLimits;
    if (resultados[1]) this.uso.threadUsage = resultados[1].threadUsage || null;
    if (typeof this.o.uso === 'function') this.o.uso(Object.assign({}, this.uso, { atualizadoEm: Date.now() }));
  }
  async pedido(texto) {
    if (!this.thread) throw new Error('o Codex está abrindo; espere ficar pronto');
    if (this.turno || this.enviando) throw new Error('o Codex está trabalhando; interrompa ou espere terminar');
    this.enviando = true;
    try {
      const r = await this.chamar('turn/start', { threadId: this.thread, input: [{ type: 'text', text: texto }] });
      if (r.turn && r.turn.status === 'inProgress') this.turno = r.turn.id;
      return true;
    } finally { this.enviando = false; }
  }
  async interromper() {
    if (!this.turno) return false;
    await this.chamar('turn/interrupt', { threadId: this.thread, turnId: this.turno }); return true;
  }
  falhar(e) { if (this.fechado) return; this.fechar(); this.o.falha(e); }
  fechar() {
    if (this.fechado) return;
    this.fechado = true;
    if (this.timerUso) clearInterval(this.timerUso);
    this.pendentes.forEach((p) => { clearTimeout(p.timer); p.reject(new Error('a conexão com o Codex terminou')); }); this.pendentes.clear();
    if (this.processo) { this.processo.stdin.destroy(); this.processo.kill('SIGTERM'); const p = this.processo; const t = setTimeout(() => { if (p.exitCode == null) p.kill('SIGKILL'); }, 2000); t.unref(); }
  }
}
module.exports = { Codex, acharCodex };
