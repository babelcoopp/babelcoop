/* Babel Coop · diário de eventos
   Cada Estação numera os próprios eventos (autor:seq) e guarda os dos outros.
   Nada é apagado: o estado de todo mundo é o resultado de aplicar os eventos na ordem.
   Replicação: cada par diz "conheço até seq N de cada autor" e recebe o que falta.
*/
'use strict';
const fs = require('fs');

class Diario {
  constructor(caminho, autor) {
    this.caminho = caminho;
    this.autor = autor;
    this.eventos = [];
    this.ids = new Set();
    this.seq = 0;
    this.ouvintes = [];
    this.carregar();
  }

  carregar() {
    let texto = '';
    try { texto = fs.readFileSync(this.caminho, 'utf8'); } catch (e) { texto = ''; }
    texto.split('\n').forEach((linha) => {
      if (!linha.trim()) return;
      try { this._guardar(JSON.parse(linha), false); } catch (e) { /* linha ilegível: pula */ }
    });
  }

  _guardar(ev, gravar) {
    if (!ev || !ev.id || this.ids.has(ev.id)) return false;
    this.ids.add(ev.id);
    this.eventos.push(ev);
    if (ev.autor === this.autor && ev.seq > this.seq) this.seq = ev.seq;
    if (gravar) fs.appendFileSync(this.caminho, JSON.stringify(ev) + '\n');
    return true;
  }

  /* evento meu: ganha número e vai para o disco */
  anexar(quem, acao, args, origem) {
    this.seq += 1;
    const ev = { id: this.autor + ':' + this.seq, autor: this.autor, seq: this.seq, ts: Date.now(), quem, acao, args: args || [] };
    if (origem) ev.origem = origem; /* a janela que já aplicou este evento localmente (não aplica de novo) */
    this._guardar(ev, true);
    this.ouvintes.forEach((fn) => fn(ev, true));
    return ev;
  }

  /* evento de outra Estação: entra se ainda não conheço */
  aceitar(ev) {
    if (!ev || typeof ev.id !== 'string' || ev.autor === this.autor) return false;
    if (!this._guardar(ev, true)) return false;
    this.ouvintes.forEach((fn) => fn(ev, false));
    return true;
  }

  /* até onde conheço cada autor */
  cursores() {
    const c = {};
    this.eventos.forEach((ev) => { if (!c[ev.autor] || ev.seq > c[ev.autor]) c[ev.autor] = ev.seq; });
    return c;
  }

  /* o que o outro ainda não tem */
  desde(cursores) {
    cursores = cursores || {};
    return this.eventos.filter((ev) => ev.seq > (cursores[ev.autor] || 0));
  }

  todos() { return this.eventos.slice().sort((a, b) => a.ts - b.ts); }

  aoNovo(fn) { this.ouvintes.push(fn); }
}

module.exports = { Diario };
