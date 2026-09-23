/* Babel Coop · quem pode digitar nos meus terminais (PROTOCOLO §4)
   Decidido aqui, no servidor do dono, nunca na tela de quem pede.
   Registro: { id:'ct-…', dono, quem, sessao (id ou null = todas), estado:'pedido'|'ativo', direto, ts }.
   - direto = a carteira de quem pede é da gestão, ou dono e quem pede estão no mesmo projeto → nasce ativo;
     senão nasce pedido e o dono aceita (ou recusa) com um clique.
   - Os projetos vêm do navegador local do dono ({tipo:'projetos', lista:[{id, membros:[ids]}]}).
   - Espelho: os meus controles nos terminais dos outros, como os donos avisaram (só para mostrar nas minhas telas).
   Eventos (aoMudar): { c } a cada mudança do registro · { c, fim:true, motivo } ao terminar · { espelho:true }.
*/
'use strict';
const crypto = require('crypto');

const ID_CONTROLE = /^ct-[0-9a-f]{12}$/;
const ID_PESSOA = /^[a-z0-9][a-z0-9-]{0,47}$/;
const ID_SESSAO = /^[A-Za-z0-9_-]{1,48}$/;

class Controle {
  constructor(cfg) {
    this.cfg = cfg;
    this.registros = new Map();  /* id → controle nos MEUS terminais */
    this.espelho = new Map();    /* 'dono/id' → controle MEU nos terminais de outro dono */
    this.projetos = [];
    this.ouvintes = [];
  }

  aoMudar(fn) { this.ouvintes.push(fn); }
  avisar(ev) { this.ouvintes.forEach((fn) => { try { fn(ev); } catch (e) { console.error('[controle] ouvinte:', e.message); } }); }

  /* ---------- projetos (do navegador local do dono) ---------- */
  definirProjetos(lista) {
    this.projetos = (Array.isArray(lista) ? lista : []).slice(0, 500).map((p) => ({
      id: String(p && p.id != null ? p.id : '').slice(0, 80),
      membros: (Array.isArray(p && p.membros) ? p.membros : []).filter((m) => typeof m === 'string' && ID_PESSOA.test(m)).slice(0, 200)
    })).filter((p) => p.membros.length);
  }
  mesmoProjeto(a, b) { return this.projetos.some((p) => p.membros.includes(a) && p.membros.includes(b)); }
  ehDireto(par) { return par.papel === 'gestao' || this.mesmoProjeto(this.cfg.id, par.id); }

  /* ---------- o dono decide ---------- */
  /* par = { id, papel } vindos da carteira verificada */
  pedir(par, sessao) {
    sessao = sessao == null ? null : String(sessao);
    if (sessao !== null && !ID_SESSAO.test(sessao)) return null;
    const direto = this.ehDireto(par);
    let c = [...this.registros.values()].find((x) => x.quem === par.id && x.sessao === sessao);
    if (c) {
      if (c.estado === 'pedido' && direto) { c.estado = 'ativo'; c.direto = true; c.ts = Date.now(); }
      this.avisar({ c }); /* devolve o mesmo (e a tela do dono se atualiza se mudou) */
      return c;
    }
    c = { id: 'ct-' + crypto.randomBytes(6).toString('hex'), dono: this.cfg.id, quem: par.id, sessao, estado: direto ? 'ativo' : 'pedido', direto, ts: Date.now() };
    this.registros.set(c.id, c);
    this.avisar({ c });
    return c;
  }

  aceitar(id) {
    const c = this.registros.get(id);
    if (!c || c.estado !== 'pedido') return null;
    c.estado = 'ativo'; c.ts = Date.now();
    this.avisar({ c });
    return c;
  }
  recusar(id) { const c = this.registros.get(id); return c ? this.terminar(id, c.estado === 'pedido' ? 'recusado' : 'encerrado') : null; }
  encerrar(id) { return this.terminar(id, 'encerrado'); }
  /* quem controla sai por conta própria (só vale para o próprio controle) */
  sair(id, quem) { const c = this.registros.get(id); return c && c.quem === quem ? this.terminar(id, 'saiu') : null; }

  terminar(id, motivo) {
    const c = this.registros.get(id);
    if (!c) return null;
    this.registros.delete(id);
    this.avisar({ c, fim: true, motivo });
    return c;
  }

  /* o terminal fechou: acaba o controle daquela sessão (o de "todas" continua) */
  sessaoFechou(sessao) { [...this.registros.values()].filter((c) => c.sessao === sessao).forEach((c) => this.terminar(c.id, 'terminal fechado')); }

  /* o par caiu: os controles dele nos meus terminais somem, e os meus nos terminais dele também */
  parCaiu(quem) {
    let mudou = false;
    [...this.registros.values()].filter((c) => c.quem === quem).forEach((c) => { this.registros.delete(c.id); this.avisar({ c, fim: true, motivo: 'desligou', semAviso: true }); });
    this.espelho.forEach((c, k) => { if (c.dono === quem) { this.espelho.delete(k); mudou = true; } });
    if (mudou) this.avisar({ espelho: true });
  }

  /* teclas de par: só com controle ativo para a sessão (ou para todas) */
  podeDigitar(quem, sessao) {
    for (const c of this.registros.values()) if (c.quem === quem && c.estado === 'ativo' && (c.sessao === null || c.sessao === sessao)) return true;
    return false;
  }

  /* ---------- espelho: o que os donos me avisam sobre os meus controles ---------- */
  espelhar(dono, c) {
    if (!c || typeof c !== 'object' || !ID_CONTROLE.test(String(c.id)) || c.quem !== this.cfg.id) return null;
    const e = { id: c.id, dono, quem: this.cfg.id, sessao: c.sessao == null ? null : String(c.sessao).slice(0, 48), estado: c.estado === 'ativo' ? 'ativo' : 'pedido', direto: !!c.direto, ts: +c.ts || Date.now() };
    this.espelho.set(dono + '/' + e.id, e);
    this.avisar({ espelho: true });
    return e;
  }
  fimEspelho(dono, id) {
    const k = dono + '/' + id;
    if (!this.espelho.has(k)) return false;
    this.espelho.delete(k);
    this.avisar({ espelho: true });
    return true;
  }

  /* o que as minhas telas veem: os controles nos meus terminais + os meus nos terminais dos outros */
  lista() { return [...this.registros.values(), ...this.espelho.values()].map((c) => Object.assign({}, c)); }
}

module.exports = { Controle };
