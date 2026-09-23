/* Babel Coop · terminais de verdade (node-pty)
   Cada agente é uma sessão de shell da pessoa. A saída é transmitida a quem assiste
   (a própria Estação, a parede dos outros) e a entrada chega de quem tem controle.
*/
'use strict';
const os = require('os');
let pty = null;
try { pty = require('node-pty'); } catch (e) { pty = null; }

const LIMITE = 200 * 1024; /* memória de tela para quem chega depois (não é gravação: nada vai para o disco) */

class Terminais {
  constructor(cfg) {
    this.cfg = cfg;
    this.sessoes = new Map();
    this.ouvintes = [];
  }

  disponivel() { return !!pty; }

  shell() {
    if (process.platform === 'win32') return { cmd: 'powershell.exe', args: [] };
    return { cmd: process.env.SHELL || (process.platform === 'darwin' ? '/bin/zsh' : '/bin/bash'), args: ['-l'] };
  }

  abrir({ id, nome, cols, rows }) {
    if (this.sessoes.has(id)) return this.sessoes.get(id).info();
    if (!pty) throw new Error('node-pty não compilado: rode npm install (postinstall faz o electron-rebuild)');
    const s = this.shell();
    const proc = pty.spawn(s.cmd, s.args, {
      name: 'xterm-256color', cols: cols || 100, rows: rows || 30,
      cwd: this.cfg.pasta, /* abre dentro da pasta compartilhada (CHECKLIST 1) */
      env: Object.assign({}, process.env, { BABEL_COOP: '1', BABEL_AGENTE: nome || id, BABEL_EU: this.cfg.id, TERM: 'xterm-256color' })
    });
    const sessao = {
      id, nome: nome || id, dono: this.cfg.id, proc, tela: '', pausada: false, controles: new Set(), criada: Date.now(),
      info: () => ({ id, nome: sessao.nome, dono: sessao.dono, pausada: sessao.pausada, controles: Array.from(sessao.controles), criada: sessao.criada })
    };
    proc.onData((dados) => {
      sessao.tela = (sessao.tela + dados).slice(-LIMITE);
      if (!sessao.pausada) this.ouvintes.forEach((fn) => fn({ tipo: 'term-saida', dono: sessao.dono, id, dados }));
    });
    proc.onExit(({ exitCode }) => {
      this.sessoes.delete(id);
      this.ouvintes.forEach((fn) => fn({ tipo: 'term-fim', dono: sessao.dono, id, codigo: exitCode }));
    });
    this.sessoes.set(id, sessao);
    this.ouvintes.forEach((fn) => fn({ tipo: 'term-lista', dono: this.cfg.id, lista: this.lista() }));
    return sessao.info();
  }

  /* quem pode digitar: o dono, quem tem controle aceito e a gestão */
  escrever(id, dados, quem) {
    const s = this.sessoes.get(id);
    if (!s) return false;
    if (quem !== s.dono && !s.controles.has(quem) && !(quem && quem.papel === 'gestao')) return false;
    s.proc.write(String(dados));
    return true;
  }

  redimensionar(id, cols, rows) { const s = this.sessoes.get(id); if (s && cols > 0 && rows > 0) s.proc.resize(cols, rows); }
  pausar(id, sim) { const s = this.sessoes.get(id); if (s) { s.pausada = !!sim; this.ouvintes.forEach((fn) => fn({ tipo: 'term-lista', dono: this.cfg.id, lista: this.lista() })); } }
  darControle(id, quem) { const s = this.sessoes.get(id); if (s) { s.controles.add(quem); this.ouvintes.forEach((fn) => fn({ tipo: 'term-lista', dono: this.cfg.id, lista: this.lista() })); } }
  tirarControle(id, quem) { const s = this.sessoes.get(id); if (s) { s.controles.delete(quem); this.ouvintes.forEach((fn) => fn({ tipo: 'term-lista', dono: this.cfg.id, lista: this.lista() })); } }
  fechar(id) { const s = this.sessoes.get(id); if (s) s.proc.kill(); }
  tela(id) { const s = this.sessoes.get(id); return s ? s.tela : ''; }
  lista() { return Array.from(this.sessoes.values()).map((s) => s.info()); }
  aoEvento(fn) { this.ouvintes.push(fn); }
  fecharTodos() { this.sessoes.forEach((s) => { try { s.proc.kill(); } catch (e) { /* já fechou */ } }); }
}

module.exports = { Terminais, plataforma: os.platform() };
