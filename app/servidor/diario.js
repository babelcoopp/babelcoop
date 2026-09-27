/* Babel Coop · diário de eventos
   Cada Estação numera os próprios eventos (autor:seq) e guarda os dos outros.
   Nada é apagado: o estado de todo mundo é o resultado de aplicar os eventos na ordem.
   Replicação: cada par diz "conheço até seq N de cada autor" e recebe o que falta.
*/
'use strict';
const fs = require('fs');
const token = require('./token');

/* assinatura do autor (a chave da carteira dele, que a chave da equipe certifica): um par não forja evento de outra pessoa,
   nem ao vivo nem na sincronização, onde eventos de terceiros chegam repassados. O texto assinado é o evento sem os três
   campos da assinatura, depois de ida e volta em JSON (o que o disco e a rede guardam), em ordem canônica. */
function corpoAssinado(ev) {
  const c = JSON.parse(JSON.stringify(ev));
  delete c.ass; delete c.carteira; delete c.cass;
  return token.canonico(c);
}
function assinarEvento(ev, cfg) {
  ev.carteira = cfg.carteira; ev.cass = cfg.assinatura;
  ev.ass = token.assinar(cfg.privada, corpoAssinado(ev));
  return ev;
}
/* null se o evento vale para esta equipe, ou o motivo */
function motivoEvento(ev, cfg) {
  if (!ev || !ev.carteira || ev.carteira.id !== ev.autor) return 'sem a carteira do autor';
  const m = token.motivoCarteira(cfg.publicaEquipe, cfg.equipe, ev.carteira, ev.cass);
  if (m) return m;
  if (typeof ev.ass !== 'string' || !token.conferir(ev.carteira.chave, corpoAssinado(ev), ev.ass)) return 'assinatura do autor não confere';
  return null;
}

class Diario {
  constructor(caminho, autor) {
    this.caminho = caminho;
    this.autor = autor;
    this.eventos = [];
    this.ids = new Set();
    this.seq = 0;
    this.ouvintes = [];
    this.assinar = null;  /* (ev) → assina com a carteira desta Estação (servidor.js liga quando há equipe) */
    this.conferir = null; /* (ev) → true se a assinatura do autor vale; ligado, evento de fora sem assinatura não entra */
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
    if (this.assinar) this.assinar(ev);
    this._guardar(ev, true);
    this.ouvintes.forEach((fn) => fn(ev, true));
    return ev;
  }

  /* evento de outra Estação: entra se ainda não conheço.
     Cada Estação só numera os próprios eventos (anexar: quem = autor = id dela), então um evento válido tem
     id = autor:seq e quem = autor; um par não põe ação na conta de outra pessoa com autor dele.
     Isso só barra a forja ingênua: quem manda pode pôr autor = quem = outra pessoa. Quem fecha é a assinatura do autor
     (this.conferir), que vale ao vivo e na sincronização (lista 'eventos', que repassa eventos de terceiros legitimamente).
     `de` (opcional): o id do par que mandou, para o evento AO VIVO (servidor.js só espalha os seus). */
  aceitar(ev, de) {
    if (!ev || typeof ev.id !== 'string' || ev.autor === this.autor) return false;
    if (typeof ev.autor !== 'string' || !ev.autor || !Number.isSafeInteger(ev.seq) || ev.seq < 1 || ev.id !== ev.autor + ':' + ev.seq) return false;
    if (ev.quem !== ev.autor) return false;
    if (de != null && ev.autor !== de) return false;
    if (this.ids.has(ev.id)) return false;
    if (this.conferir && !this.conferir(ev)) return false;
    if (!this._guardar(ev, true)) return false;
    this.ouvintes.forEach((fn) => fn(ev, false));
    return true;
  }

  /* os meus eventos de antes da assinatura (ou de antes da equipe) ganham assinatura na memória para ir aos pares;
     o disco fica como está e isto roda de novo a cada vez que a rede liga */
  assinarMeus() {
    if (!this.assinar) return 0;
    let n = 0;
    this.eventos.forEach((ev) => { if (ev.autor === this.autor && !ev.ass) { this.assinar(ev); n += 1; } });
    return n;
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

module.exports = { Diario, assinarEvento, motivoEvento };
