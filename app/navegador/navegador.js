/* babel-coop · o navegador próprio dos agentes (processo principal do Electron) · PROTOCOLO §9
   Nada de Playwright, nada de Google Chrome: cada agente tem um <webview> na aba do meio ("Navegador · <agente>"),
   a tela avisa quando ele nasce (coopElectron.navegador.registrar) e daqui em diante o controle é pelo webContents
   dele + webContents.debugger (CDP 1.3, o protocolo do próprio Chromium do app).

   API (agente = id em texto ou {id, nome}; toda ação do agente passa numa fila por agente, uma de cada vez):
     registrar(webContentsId, agente, {nome, cor, pessoa, host})  liga o webview ao agente e começa a gravar rede e console
     abrir(agente, url)                → {url, titulo, status, ms}
     clicar(agente, {seletor}|{texto}|'texto ou seletor')  cursor do agente vai até o ponto e clica com mouse de verdade
     digitar(agente, seletor, texto)   teclado de verdade (Input.insertText); campo de senha → {ok:false, recusado:'senha', mensagem:'sua vez: a pessoa digita a senha'}
                                       texto terminando em "\n" aperta Enter depois; <select> escolhe a opção pelo texto
     ler(agente)                       → {url, titulo, markdown}
     raioX(agente, {seletor, busca})   → {dom, elemento{html, estilos, regras, fontesRenderizadas}, busca, fontes, cores, copy, rede, console}
     clonar(agente, pasta?)            → <pasta>/Clones/<site>/index.html + assets/ (CSS, imagens, fontes; URLs locais)
     copy(agente, pasta?)              → <pasta>/Clones/<site>/copy.md (h1/h2/h3 abrem seção; textos em ordem)
     print(agente, pasta?)             → <pasta>/Clones/<site>/print-<data>.png (página inteira)
     inspeção, só leitura (nada de código livre na página nem comando livre de CDP):
       codigo(agente, {url?, max?})      sem url: os recursos carregados (Page.getResourceTree); com url: o conteúdo (JS, CSS, HTML
                                         original, resposta de fetch) e o source map quando existe; url "dom" = o DOM vivo
       rede(agente, {filtro?, corpo?})   pedidos gravados (método, url, status, cabeçalhos, tempos) e o corpo (Network.getResponseBody)
       console(agente, {nivel?})         mensagens e erros do console
       armazenamento(agente)             cookies da partição, localStorage e sessionStorage (senha nunca)
     navegação: rolar(agente, {para|pixels}) · aguardar(agente, {seletor|texto|ms}) · voltar · avancar · recarregar
       teclas(agente, 'Enter' | 'Tab Tab Enter' | 'Shift+Tab' …)  Input.dispatchKeyEvent; foco num campo de senha = recusa ("sua vez")
       baixar(agente, url)               salva em <pasta>/Downloads/ (até 100 MB)
     assumir(agente) / devolver(agente)  enquanto a pessoa assume, abrir/clicar/digitar do agente são recusados
     selecionar(agente, ligar=true)    modo inspeção (Overlay do Chromium): resolve com o elemento que a pessoa clicar
     estado(agente) · lista() · navegacaoPermitida(url) · fechar()
   Eventos (EventEmitter): 'passo' {agente, nome, tipo, texto, alvo?, feito?, ts} e 'estado' {agente, registrado, url, titulo,
     carregando, controlador:'agente'|'pessoa', selecionando, aba?:'pedida', senha?:{seletor,rotulo}, selecionado?, ts}.
     main.js repassa os dois às telas ('navegador:passo' e 'navegador:estado').
   pasta: sem pasta explícita, vale a pasta compartilhada da pessoa (opcoes.pasta()); caminho relativo é relativo a ela e
     nada é gravado fora dela. file:// só abre dentro dela. A própria Estação (localhost:<porta>) só abre em /pasta/.
   Endereço interno (SSRF): o que o AGENTE abre, clica, é redirecionado ou baixa passa pelo DNS (dns.lookup {all}) e é recusado se
     cair em link-local (169.254/16, fe80::/10: sempre) ou em loopback/rede privada (127/8, ::1, 10/8, 172.16/12, 192.168/16,
     fc00::/7, 0/8): "endereço interno: a pessoa abre pela barra de endereço (Assumir)". A pessoa no controle abre qualquer endereço.
     A /pasta/ da própria Estação continua valendo. Conferido de novo no redirecionamento (will-redirect, no main.js), na resposta
     do documento (IP remoto pelo CDP) e em cada salto do download (até 5). BABEL_COOP_NAV_INTERNO=1 libera o interno (não o
     link-local) para os testes com site local; uma lista "host:porta,…" libera só esses. Em produção vem desligado.
*/
'use strict';
const { EventEmitter } = require('events');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { fileURLToPath } = require('url');
const dns = require('dns');
const net = require('net');
const PAG = require('./pagina');
const { Gravador, regrasDoElemento } = require('./raiox');
const { clonarPagina, nomeDoSite } = require('./clonar');

const MUNDO = 1107; /* mundo isolado do babel-coop dentro da página */
const KIT = PAG.kit.toString();
const DESTAQUE = { showInfo: true, showStyles: true, showAccessibilityInfo: false, contentColor: { r: 42, g: 213, b: 229, a: 0.22 }, paddingColor: { r: 163, g: 118, b: 233, a: 0.22 }, borderColor: { r: 42, g: 213, b: 229, a: 0.9 }, marginColor: { r: 245, g: 199, b: 106, a: 0.16 } };
const IGNORADOS = /^(\.env.*|.*\.pem|.*\.key|\.ssh|credentials.*|\.git|\.coop|coop\.json)$/i;

const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));
/* teclas que o agente pode apertar (nada de Ctrl/Cmd: colar, selecionar tudo e atalhos do app ficam com a pessoa) */
const TECLAS = {
  enter: ['Enter', 'Enter', 13, '\r'], tab: ['Tab', 'Tab', 9], esc: ['Escape', 'Escape', 27], escape: ['Escape', 'Escape', 27],
  cima: ['ArrowUp', 'ArrowUp', 38], baixo: ['ArrowDown', 'ArrowDown', 40], esquerda: ['ArrowLeft', 'ArrowLeft', 37], direita: ['ArrowRight', 'ArrowRight', 39],
  arrowup: ['ArrowUp', 'ArrowUp', 38], arrowdown: ['ArrowDown', 'ArrowDown', 40], arrowleft: ['ArrowLeft', 'ArrowLeft', 37], arrowright: ['ArrowRight', 'ArrowRight', 39],
  backspace: ['Backspace', 'Backspace', 8], apagar: ['Backspace', 'Backspace', 8], delete: ['Delete', 'Delete', 46], home: ['Home', 'Home', 36], end: ['End', 'End', 35],
  pageup: ['PageUp', 'PageUp', 33], pagedown: ['PageDown', 'PageDown', 34], espaco: [' ', 'Space', 32, ' '], space: [' ', 'Space', 32, ' ']
};
const MAX_BAIXAR = 50 * 1024 * 1024;
const MAX_SALTOS = 5;

/* ---------- endereço interno (SSRF) ---------- */
function classificarIp(ip) {
  let s = String(ip || '').toLowerCase().replace(/^\[|\]$/g, '').replace(/%.*$/, '');
  const mapeado = /^(?:0*:)*:?ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(s) || /^::(\d+\.\d+\.\d+\.\d+)$/.exec(s);
  if (mapeado) s = mapeado[1];
  /* IPv4 mapeado em hexadecimal (::ffff:7f00:1 = 127.0.0.1) */
  const hexa = !mapeado && /^(?:0*:)*:?ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(s);
  if (hexa) { const x = parseInt(hexa[1], 16), y = parseInt(hexa[2], 16); s = [x >> 8, x & 255, y >> 8, y & 255].join('.'); }
  if (net.isIPv4(s)) {
    const [a, b] = s.split('.').map(Number);
    if (a === 169 && b === 254) return 'link-local';
    if (a === 127 || a === 10 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return 'interno';
    return null;
  }
  if (net.isIPv6(s)) {
    if (s === '::1' || s === '::' || /^0*(:0*)*:0*1$/.test(s)) return 'interno';
    const h = parseInt(s.split(':')[0] || '0', 16);
    if (h >= 0xfe80 && h <= 0xfebf) return 'link-local';
    if (h >= 0xfc00 && h <= 0xfdff) return 'interno';
    return null;
  }
  return null;
}
/* BABEL_COOP_NAV_INTERNO: "1" = todo endereço interno liberado ao agente (testes com site local); "host:porta,…" = só esses */
function internoLiberado(u) {
  const v = String(process.env.BABEL_COOP_NAV_INTERNO || '').trim();
  if (!v) return false;
  if (v === '1') return true;
  const hp = (u.hostname.replace(/^\[|\]$/g, '') + ':' + (u.port || (u.protocol === 'https:' ? '443' : '80'))).toLowerCase();
  return v.toLowerCase().split(',').map((x) => x.trim()).includes(hp);
}
const MSG_INTERNO = 'endereço interno: a pessoa abre pela barra de endereço (Assumir)';
/* sem DNS: IP escrito no endereço ou localhost (o que dá para decidir na hora, no will-navigate e no will-redirect) */
function internoLiteral(u) {
  const h = u.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost')) return 'interno';
  return net.isIP(h) ? classificarIp(h) : null;
}
const PARECE_SENHA = /(senha|password|passwd|pwd|secret|segredo)/i;
const TEXTUAL = /^(text\/|application\/(javascript|x-javascript|ecmascript|json|ld\+json|xml|xhtml\+xml|manifest\+json)|image\/svg\+xml)/i;
function tamanhoTexto(n) { return n < 1024 ? n + ' B' : n < 1048576 ? Math.round(n / 1024) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }
/* nome de arquivo seguro para Downloads/: sem pasta, sem caractere de controle, sem nome escondido nem .env */
function nomeSeguro(nome) {
  let n = String(nome || '').split(/[\\/]/).pop().replace(/[\u0000-\u001f<>:"|?*]/g, '_').replace(/^\.+/, '').trim().slice(0, 120);
  if (!n) n = 'download';
  if (IGNORADOS.test(n)) n = '_' + n;
  return n;
}
function erro(msg, codigo) { const e = new Error(msg); e.codigo = codigo; return e; }
function comPrazo(p, ms, oque) {
  let t;
  return Promise.race([p, new Promise((_, falha) => { t = setTimeout(() => falha(erro('demorou demais: ' + oque, 'prazo')), ms); })]).finally(() => clearTimeout(t));
}
function codigo(fn, args) {
  return '(function(){try{return (' + fn.toString() + ')((' + KIT + ')(),' + JSON.stringify(args || {}) + ');}catch(e){return {__erro:String(e&&e.message||e)};}})()';
}
function curto(url) {
  try { const u = new URL(url); if (u.protocol === 'file:') return path.basename(fileURLToPath(u)); return u.host + (u.pathname !== '/' ? u.pathname : ''); } catch (e) { return String(url || '').slice(0, 60); }
}
function limparErro(e) { return String(e && e.message || e).replace(/^Error:\s*/, '').replace(/ loading '.*'$/, ''); }
function carimbo() { const d = new Date(); const z = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + '-' + z(d.getHours()) + z(d.getMinutes()) + z(d.getSeconds()); }
function dataHora() { const d = new Date(); const z = (n) => String(n).padStart(2, '0'); return z(d.getDate()) + '/' + z(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + z(d.getHours()) + ':' + z(d.getMinutes()); }
/* 'Cadastro' → {texto}; '#email', 'form > button', 'input[name=x]' → {seletor} */
function normalizarAlvo(alvo) {
  if (alvo && typeof alvo === 'object') return { seletor: alvo.seletor || undefined, texto: alvo.seletor ? undefined : alvo.texto };
  const s = String(alvo == null ? '' : alvo).trim();
  if (/^[#.[]/.test(s) || / > /.test(s) || /^[a-z][a-z0-9-]*(\[|#|\.[a-z_-]|:[a-z-]+(\(|$)|\s*>)/i.test(s) || /^(input|button|select|textarea|form|a|h[1-6]|body|main|nav|header|footer)$/i.test(s)) return { seletor: s };
  return { texto: s };
}
function resumoAlvo(i) { return { seletor: i.seletor, rotulo: i.rotulo, x: i.x, y: i.y, caixa: i.caixa }; }
function dimensoesPng(buf) { if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null; return { largura: buf.readUInt32BE(16), altura: buf.readUInt32BE(20) }; }
function ipsDestaMaquina() {
  const s = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);
  try { Object.values(os.networkInterfaces()).forEach((l) => (l || []).forEach((i) => s.add(i.address))); } catch (e) { /* sem interfaces: fica o loopback */ }
  return s;
}

class Navegadores extends EventEmitter {
  /**
   * @param {object} [o]
   * @param {() => string|null} [o.pasta] a pasta compartilhada da pessoa (cfg.pasta)
   * @param {() => number|null} [o.porta] a porta da Estação
   * @param {number} [o.esperaAbaMs] quanto esperar a tela abrir a aba do agente quando uma ferramenta chega antes dela (10 s)
   */
  constructor(o = {}) {
    super();
    this.o = o;
    this.agentes = new Map();
    this.esperas = new Map();
    this.setMaxListeners(50);
  }

  /* ---------------- registro ---------------- */

  _id(agente) {
    const id = agente && typeof agente === 'object' ? agente.id : agente;
    if (typeof id !== 'string' || !/^[A-Za-z0-9_.:@-]{1,80}$/.test(id)) throw erro('agente inválido', 'agente');
    return id;
  }

  _dados(r, o) {
    if (o.nome) r.nome = String(o.nome).slice(0, 40);
    if (o.cor && /^#[0-9a-f]{3,8}$|^rgba?\([0-9., ]+\)$/i.test(String(o.cor))) r.cor = String(o.cor);
    if (o.pessoa) r.pessoa = String(o.pessoa).slice(0, 40);
  }

  async registrar(webContentsId, agente, opcoes = {}) {
    const { webContents } = require('electron');
    const id = this._id(agente);
    const wc = webContents.fromId(Number(webContentsId));
    if (!wc || wc.isDestroyed()) throw erro('webview não encontrado', 'webview');
    if (wc.getType() !== 'webview') throw erro('só um <webview> vira o navegador de um agente', 'webview');
    if (opcoes.host && (!wc.hostWebContents || wc.hostWebContents.id !== opcoes.host.id)) throw erro('esse webview não é desta tela', 'webview');
    for (const outro of this.agentes.values()) if (outro.wc === wc && outro.id !== id) this._soltar(outro, 'o webview passou para ' + id);
    let r = this.agentes.get(id);
    if (r && r.wc === wc) { this._dados(r, opcoes); this._estado(r); return this.estado(id); }
    if (r) this._soltar(r, 'trocou de webview');
    r = { id, nome: id, cor: '#2ad5e5', pessoa: '', wc, controlador: 'agente', grav: new Gravador(), passos: [], cursor: null, selecionando: null, fila: Promise.resolve(), ouvintes: [], navegacoes: 0, cdp: false, reduzido: false, solto: false, desde: Date.now() };
    this._dados(r, opcoes);
    this.agentes.set(id, r);
    this._ouvir(r);
    try { await this._ligarCdp(r); } catch (e) { this._soltar(r, e.message); throw e; }
    this._passo(r, 'navegador', 'navegador de ' + r.nome + ' pronto');
    this._estado(r);
    const esperas = this.esperas.get(id) || [];
    this.esperas.delete(id);
    esperas.forEach((ok) => ok(r));
    return this.estado(id);
  }

  _ouvir(r) {
    const on = (ev, fn) => { r.wc.on(ev, fn); r.ouvintes.push([ev, fn]); };
    on('did-start-navigation', (d, _url, mesmoDoc, principal) => {
      const ehPrincipal = d && d.isMainFrame !== undefined ? d.isMainFrame : principal;
      const mesmo = d && d.isSameDocument !== undefined ? d.isSameDocument : mesmoDoc;
      if (ehPrincipal && !mesmo) r.navegacoes++;
    });
    on('did-start-loading', () => this._estado(r));
    on('did-stop-loading', () => this._estado(r));
    on('did-navigate', () => this._estado(r));
    on('did-navigate-in-page', (_e, _url, principal) => { if (principal) this._estado(r); });
    on('page-title-updated', () => this._estado(r));
    on('did-fail-load', (_e, cod, desc, url, principal) => { if (principal && cod !== -3) this._passo(r, 'erro', 'não abriu ' + curto(url) + ': ' + desc); });
    on('render-process-gone', (_e, d) => this._passo(r, 'erro', 'a página caiu (' + (d && d.reason) + ')'));
    on('destroyed', () => this._soltar(r, 'webview fechado'));
  }

  _soltar(r, motivo) {
    if (r.solto) return;
    r.solto = true;
    if (this.agentes.get(r.id) === r) this.agentes.delete(r.id);
    if (r.selecionando) { clearTimeout(r.selecionando.timer); r.selecionando.ok(null); r.selecionando = null; }
    if (!r.wc.isDestroyed()) {
      r.ouvintes.forEach(([ev, fn]) => r.wc.removeListener(ev, fn));
      try {
        if (r.aoCdp) { r.wc.debugger.removeListener('message', r.aoCdp); r.wc.debugger.removeListener('detach', r.aoSoltarCdp); }
        if (r.wc.debugger.isAttached()) r.wc.debugger.detach();
      } catch (e) { /* já solto */ }
    }
    this.emit('estado', { agente: r.id, nome: r.nome, registrado: false, motivo, ts: Date.now() });
  }

  async _ligarCdp(r) {
    const dbg = r.wc.debugger;
    try { if (!dbg.isAttached()) dbg.attach('1.3'); } catch (e) { throw erro('não consegui ligar o raio-X neste webview: ' + e.message, 'cdp'); }
    if (!r.aoCdp) {
      r.aoCdp = (_ev, metodo, params) => this._eventoCdp(r, metodo, params);
      r.aoSoltarCdp = () => { r.cdp = false; };
      dbg.on('message', r.aoCdp);
      dbg.on('detach', r.aoSoltarCdp);
    }
    r.cdp = true;
    for (const [m, p] of [['Page.enable'], ['Network.enable', { maxPostDataSize: 0 }], ['Runtime.enable'], ['Log.enable'], ['DOM.enable'], ['CSS.enable']]) await this._cdp(r, m, p);
    /* a página se comporta como focada mesmo quando a pessoa está digitando no terminal: o agente não rouba o foco dela */
    await this._cdp(r, 'Emulation.setFocusEmulationEnabled', { enabled: true }).catch(() => {});
    try { const arv = await this._cdp(r, 'Page.getFrameTree'); r.grav.quadroPrincipal = arv.frameTree.frame.id; } catch (e) { /* segue sem */ }
  }

  async _cdp(r, metodo, params, ms = 15000) {
    if (r.solto || r.wc.isDestroyed()) throw erro('o navegador de ' + r.nome + ' foi fechado', 'fechado');
    if (!r.wc.debugger.isAttached()) await this._ligarCdp(r);
    return comPrazo(r.wc.debugger.sendCommand(metodo, params || {}), ms, metodo);
  }

  _eventoCdp(r, metodo, p) {
    r.grav.evento(metodo, p);
    /* o documento principal chegou de um IP interno com o agente no controle (nome que o DNS trocou, redirecionamento por nome):
       a página sai antes de o agente ler */
    if (metodo === 'Network.responseReceived' && p.type === 'Document' && (!r.grav.quadroPrincipal || p.frameId === r.grav.quadroPrincipal) && p.response && p.response.remoteIPAddress && this._agenteNoControle(r)) {
      try {
        const u = new URL(p.response.url);
        const c = classificarIp(p.response.remoteIPAddress);
        if (c && /^https?:$/.test(u.protocol) && !(this._ehEstacao(u) && u.pathname.startsWith('/pasta/')) && (c === 'link-local' || !internoLiberado(u))) this._bloqueado(r, p.response.url, c === 'link-local' ? 'endereço link-local: o agente nunca abre' : MSG_INTERNO, true);
      } catch (e) { /* segue */ }
    }
    if (metodo === 'Overlay.inspectNodeRequested') this._escolhido(r, p.backendNodeId).catch(() => {});
    else if (metodo === 'Page.javascriptDialogOpening') {
      /* o main.js liga disableDialogs no webview: alert segue sozinho, confirm e prompt voltam cancelados */
      const msg = String(p.message || '').slice(0, 160);
      const texto = p.type === 'alert' ? 'a página avisou: ' + msg : p.type === 'confirm' ? 'a página perguntou: ' + msg + ' · cancelei (confirmar é com a pessoa)' : p.type === 'prompt' ? 'a página pediu um texto: ' + msg + ' · cancelei' : 'a página quis segurar a saída: ' + msg;
      this._passo(r, 'aviso', texto, { dialogo: { tipo: p.type, mensagem: msg } });
      this._estado(r, { dialogo: { tipo: p.type, mensagem: msg } });
    }
  }

  async _pagina(r, fn, args, ms = 20000) {
    if (r.solto || r.wc.isDestroyed()) throw erro('o navegador de ' + r.nome + ' foi fechado', 'fechado');
    const res = await comPrazo(r.wc.executeJavaScriptInIsolatedWorld(MUNDO, [{ code: codigo(fn, args) }]), ms, 'a página não respondeu');
    if (res && res.__erro) throw erro('na página: ' + res.__erro, 'pagina');
    return res;
  }

  /* uma ação de cada vez por agente (dois pedidos do claude ao mesmo tempo não se atropelam) */
  _vez(r, fn) {
    const p = r.fila.then(fn);
    r.fila = p.catch(() => {});
    return p;
  }

  /* acha o navegador do agente; se a aba ainda não existe, pede à tela e espera ela nascer */
  async _reg(agente) {
    const id = this._id(agente);
    const r = this.agentes.get(id);
    if (r) return r;
    const nome = agente && typeof agente === 'object' && agente.nome ? String(agente.nome).slice(0, 40) : id;
    const ms = this.o.esperaAbaMs != null ? this.o.esperaAbaMs : 10000;
    const falta = erro('o navegador de ' + nome + ' não está aberto: abra a aba "Navegador · ' + nome + '" na Estação', 'sem-aba');
    if (ms <= 0) throw falta;
    this.emit('estado', { agente: id, nome, registrado: false, aba: 'pedida', ts: Date.now() });
    this.emit('aba', { agente: id, nome, ts: Date.now() });
    return new Promise((ok, falha) => {
      const lista = this.esperas.get(id) || [];
      const pronto = (reg) => { clearTimeout(t); ok(reg); };
      const t = setTimeout(() => { const l = this.esperas.get(id) || []; const i = l.indexOf(pronto); if (i !== -1) l.splice(i, 1); falha(falta); }, ms);
      lista.push(pronto);
      this.esperas.set(id, lista);
    });
  }

  _regJa(agente) {
    const id = this._id(agente);
    const r = this.agentes.get(id);
    if (!r) throw erro('o navegador de ' + id + ' não está aberto', 'sem-aba');
    return r;
  }

  _agenteMexe(r) {
    if (r.controlador === 'pessoa') throw erro((r.pessoa || 'a pessoa') + ' assumiu o navegador de ' + r.nome + ': espere devolver', 'assumido');
    if (r.suaVez) { r.suaVez = false; this._estado(r); }
  }

  _passo(r, tipo, texto, extra) {
    const p = Object.assign({ agente: r.id, nome: r.nome, tipo, texto, ts: Date.now() }, extra || {});
    r.passos.push(p);
    if (r.passos.length > 60) r.passos.shift();
    this.emit('passo', p);
    return p;
  }

  _resumo(r) {
    const vivo = !r.solto && !r.wc.isDestroyed();
    let voltar = false, avancar = false;
    if (vivo) { try { voltar = r.wc.navigationHistory.canGoBack(); avancar = r.wc.navigationHistory.canGoForward(); } catch (e) { /* versão sem navigationHistory */ } }
    return {
      agente: r.id, nome: r.nome, cor: r.cor, pessoa: r.pessoa, registrado: vivo, webContentsId: vivo ? r.wc.id : null,
      url: vivo ? r.wc.getURL() : '', titulo: vivo ? r.wc.getTitle() : '', carregando: vivo ? r.wc.isLoading() : false,
      controlador: r.controlador, assumido: r.controlador === 'pessoa', suaVez: !!r.suaVez, selecionando: !!r.selecionando, podeVoltar: voltar, podeAvancar: avancar, cdp: r.cdp, ts: Date.now()
    };
  }

  _estado(r, extra) { if (!r.solto) this.emit('estado', Object.assign(this._resumo(r), extra || {})); }

  estado(agente) {
    const id = this._id(agente);
    const r = this.agentes.get(id);
    if (!r) return { agente: id, registrado: false };
    return Object.assign(this._resumo(r), { passos: r.passos.slice(-30) });
  }

  lista() { return Array.from(this.agentes.values()).map((r) => this._resumo(r)); }

  /* ---------------- endereços e pastas ---------------- */

  _pasta() { const p = this.o.pasta && this.o.pasta(); return p ? path.resolve(p) : null; }

  _dentroDaPasta(f) {
    const pasta = this._pasta();
    if (!pasta) return false;
    const alvo = path.resolve(f);
    if (alvo !== pasta && !alvo.startsWith(pasta + path.sep)) return false;
    return !path.relative(pasta, alvo).split(path.sep).some((p) => IGNORADOS.test(p));
  }

  _ehEstacao(u) {
    const porta = this.o.porta && this.o.porta();
    if (!porta) return false;
    const p = u.port || (u.protocol === 'https:' ? '443' : '80');
    return String(p) === String(porta) && ipsDestaMaquina().has(u.hostname.replace(/^\[|\]$/g, ''));
  }

  _urlAceita(url) {
    let s = String(url || '').trim();
    if (!s) throw erro('faltou o endereço', 'url');
    if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = (/^(localhost|127\.0\.0\.1|\[::1\])([:/]|$)/i.test(s) ? 'http://' : 'https://') + s;
    let u;
    try { u = new URL(s); } catch (e) { throw erro('endereço inválido: ' + url, 'url'); }
    if (u.href === 'about:blank') return u.href;
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      if (this._ehEstacao(u) && !u.pathname.startsWith('/pasta/')) throw erro('o navegador do agente não abre a própria Estação (só os arquivos em /pasta/)', 'url');
      return u.href;
    }
    if (u.protocol === 'file:') {
      if (this._dentroDaPasta(fileURLToPath(u))) return u.href;
      throw erro('só abro arquivos da sua pasta compartilhada', 'url');
    }
    throw erro('endereço não aceito: ' + u.protocol, 'url');
  }

  /* para o main.js vigiar o que a própria página tenta abrir (links, redirecionamentos, janelas novas) */
  /* o main.js pergunta (will-navigate, will-redirect, janela nova) passando o webContents do webview: se o agente está no controle,
     endereço interno escrito no link ou no redirecionamento também não passa (o nome que só o DNS revela é conferido na resposta) */
  navegacaoPermitida(url, wcId) {
    if (/^(blob|data):/i.test(String(url || ''))) return true;
    try {
      this._urlAceita(url);
      if (!/^[a-z][a-z0-9+.-]*:/i.test(String(url))) return false;
      const r = wcId != null ? Array.from(this.agentes.values()).find((x) => x.wc && !x.wc.isDestroyed() && x.wc.id === wcId) : null;
      if (r && this._agenteNoControle(r)) {
        const u = new URL(url);
        if (/^https?:$/.test(u.protocol) && !(this._ehEstacao(u) && u.pathname.startsWith('/pasta/'))) {
          const c = internoLiteral(u);
          if (c === 'link-local' || (c && !internoLiberado(u))) { this._bloqueado(r, url, c === 'link-local' ? 'endereço link-local: o agente nunca abre' : MSG_INTERNO, false); return false; }
        }
      }
      return true;
    } catch (e) { return false; }
  }

  /* quem está mexendo: o agente (e não a pessoa pela barra, nem a pessoa que assumiu) */
  _agenteNoControle(r) { return r.controlador !== 'pessoa' && !r.navDaPessoa; }

  _bloqueado(r, url, msg, parar) {
    r.bloqueio = { url, msg, ts: Date.now() };
    this._passo(r, 'erro', 'recusado ' + curto(url) + ': ' + msg);
    if (parar && !r.wc.isDestroyed()) { try { r.wc.stop(); r.wc.loadURL('about:blank'); } catch (e) { /* segue */ } }
  }

  /* o que o agente pede (abrir, baixar, cada salto do download): o DNS decide se é interno */
  async _checarAgente(u) {
    if (!/^https?:$/.test(u.protocol)) return;
    if (this._ehEstacao(u) && u.pathname.startsWith('/pasta/')) return; /* a pasta compartilhada servida pela própria Estação */
    let ips;
    const lit = internoLiteral(u);
    if (lit) ips = [lit === 'interno' && !net.isIP(u.hostname.replace(/^\[|\]$/g, '')) ? '127.0.0.1' : u.hostname.replace(/^\[|\]$/g, '')];
    else {
      try { ips = (await dns.promises.lookup(u.hostname, { all: true, verbatim: true })).map((x) => x.address); } catch (e) { return; /* não resolve: o Chromium falha sozinho */ }
    }
    for (const ip of ips) {
      const c = classificarIp(ip);
      if (c === 'link-local') throw erro('endereço link-local (' + ip + '): o agente nunca abre', 'interno');
      if (c && !internoLiberado(u)) throw erro(MSG_INTERNO + ' (' + u.host + ' → ' + ip + ')', 'interno');
    }
  }

  /* pasta de destino: a pasta da pessoa ou uma subpasta dela; nunca fora */
  _destino(pastaDestino) {
    const pasta = this._pasta();
    let alvo;
    if (pastaDestino) alvo = pasta && !path.isAbsolute(pastaDestino) ? path.resolve(pasta, pastaDestino) : path.resolve(pastaDestino);
    else alvo = pasta;
    if (!alvo) throw erro('sem pasta compartilhada para gravar', 'pasta');
    if (pasta && alvo !== pasta && !alvo.startsWith(pasta + path.sep)) throw erro('só gravo dentro da sua pasta compartilhada', 'pasta');
    fs.mkdirSync(alvo, { recursive: true });
    return alvo;
  }

  /* ---------------- mãos do agente ---------------- */

  async _assentar(r, ms) {
    const fim = Date.now() + ms;
    while (Date.now() < fim && !r.wc.isDestroyed() && r.wc.isLoading()) await esperar(50);
  }

  async _apontar(r, info, acao) {
    const c = await this._pagina(r, PAG.cursor, { x: info.x, y: info.y, de: r.cursor, cor: r.cor, nome: r.nome, acao }).catch(() => null);
    r.cursor = { x: info.x, y: info.y };
    r.reduzido = !!(c && c.reduzido);
    if (!r.reduzido) await esperar(300);
  }

  async _clique(r, x, y) {
    await this._cdp(r, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0 });
    await this._cdp(r, 'Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
    await this._cdp(r, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
  }

  async _teclar(r, texto) {
    const letras = Array.from(texto);
    const pedaco = letras.length <= 80 ? 1 : Math.ceil(letras.length / 80);
    for (let i = 0; i < letras.length; i += pedaco) {
      await this._cdp(r, 'Input.insertText', { text: letras.slice(i, i + pedaco).join('') });
      if (!r.reduzido) await esperar(14);
    }
  }

  async _enter(r) {
    await this._cdp(r, 'Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' });
    await this._cdp(r, 'Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
  }

  async abrir(agente, url, opcoes = {}) {
    const r = await this._reg(agente);
    return this._vez(r, async () => {
      if (!opcoes.pessoa) this._agenteMexe(r);
      const alvo = this._urlAceita(url);
      if (!opcoes.pessoa) {
        try { await this._checarAgente(new URL(alvo)); } catch (e) { this._passo(r, 'erro', 'recusado ' + curto(alvo) + ': ' + e.message); throw e; }
      }
      const t0 = Date.now();
      this._passo(r, 'abrir', 'abrindo ' + curto(alvo) + '…', { url: alvo });
      r.navDaPessoa = !!opcoes.pessoa;
      try {
        try { await comPrazo(r.wc.loadURL(alvo), 45000, 'abrir ' + curto(alvo)); } catch (e) {
          const bloq = r.bloqueio && r.bloqueio.ts >= t0;
          if (!bloq && !/ERR_ABORTED|\(-3\)|ERR_BLOCKED/.test(e.message)) { const msg = 'não abriu ' + curto(alvo) + ': ' + limparErro(e); this._passo(r, 'erro', msg); throw erro(msg, 'rede'); }
        }
        await this._assentar(r, 3000);
      } finally { r.navDaPessoa = false; }
      if (r.bloqueio && r.bloqueio.ts >= t0) throw erro(r.bloqueio.msg + ' (' + curto(r.bloqueio.url) + ')', 'interno');
      const doc = r.grav.documento;
      const res = { url: r.wc.getURL(), titulo: r.wc.getTitle(), status: doc ? doc.status : null, ms: Date.now() - t0 };
      this._passo(r, 'abrir', 'abriu ' + (res.titulo || curto(res.url)) + ' · ' + res.ms + ' ms', { feito: true, url: res.url });
      return res;
    });
  }

  async clicar(agente, alvo) {
    const r = await this._reg(agente);
    return this._vez(r, async () => {
      this._agenteMexe(r);
      const info = await this._pagina(r, PAG.localizar, { alvo: normalizarAlvo(alvo) });
      if (info.erro) { this._passo(r, 'erro', info.erro); throw erro(info.erro, 'alvo'); }
      this._passo(r, 'clicar', 'clicando em ' + info.rotulo + '…', { alvo: resumoAlvo(info) });
      const t0 = Date.now();
      await this._apontar(r, info, 'clicando');
      const antes = r.navegacoes;
      await this._clique(r, info.x, info.y);
      this._pagina(r, PAG.cursor, { x: info.x, y: info.y, clique: true, cor: r.cor, nome: r.nome, acao: 'clicou' }).catch(() => {});
      await esperar(200);
      const navegou = r.navegacoes > antes;
      if (navegou) await this._assentar(r, 15000);
      if (r.bloqueio && r.bloqueio.ts >= t0) throw erro(r.bloqueio.msg + ' (' + curto(r.bloqueio.url) + ')', 'interno');
      this._passo(r, 'clicar', 'clicou em ' + info.rotulo + (navegou ? ' · abriu ' + (r.wc.getTitle() || curto(r.wc.getURL())) : ''), { feito: true, alvo: resumoAlvo(info) });
      return { ok: true, clicou: info.rotulo, seletor: info.seletor, x: info.x, y: info.y, coberto: info.coberto || undefined, navegou, url: r.wc.getURL(), titulo: r.wc.getTitle() };
    });
  }

  _recusarSenha(r, info) {
    r.suaVez = true;
    this._passo(r, 'senha', 'senha em ' + info.rotulo + ': sua vez, ' + (r.pessoa || 'a pessoa') + ' digita', { alvo: resumoAlvo(info) });
    this._estado(r, { senha: { seletor: info.seletor, rotulo: info.rotulo } });
    if (info.x != null) this._pagina(r, PAG.cursor, { x: info.x, y: info.y, de: r.cursor, cor: r.cor, nome: r.nome, acao: 'senha: sua vez' }).catch(() => {});
    return { ok: false, recusado: 'senha', mensagem: 'sua vez: a pessoa digita a senha', campo: info.rotulo, seletor: info.seletor };
  }

  /* o conector recusou antes de digitar (o seletor parece de senha): nada é digitado; se o campo existir, a aba marca
     "sua vez" nele (passo 'senha', estado.senha e o cursor apontando), como faz o digitar ao achar um campo de senha */
  async recusarSenha(agente, seletor) {
    const r = await this._reg(agente);
    return this._vez(r, async () => {
      let info = null;
      try { info = await this._pagina(r, PAG.localizar, { alvo: normalizarAlvo(seletor), campo: true }); } catch (e) { info = null; }
      if (!info || info.erro) info = { rotulo: String(seletor || 'o campo de senha').slice(0, 80), seletor: String(seletor || '').slice(0, 200) };
      return this._recusarSenha(r, info);
    });
  }

  async digitar(agente, seletor, texto) {
    const r = await this._reg(agente);
    return this._vez(r, async () => {
      this._agenteMexe(r);
      const info = await this._pagina(r, PAG.localizar, { alvo: normalizarAlvo(seletor), campo: true });
      if (info.erro) { this._passo(r, 'erro', info.erro); throw erro(info.erro, 'alvo'); }
      if (info.senha) return this._recusarSenha(r, info);
      let t = String(texto == null ? '' : texto);
      let enter = false;
      if (/\r?\n$/.test(t) && info.tag !== 'textarea') { enter = true; t = t.replace(/\r?\n$/, ''); }
      this._passo(r, 'digitar', 'preenchendo ' + info.rotulo + '…', { alvo: resumoAlvo(info) });
      await this._apontar(r, info, 'preenchendo');
      if (info.tag === 'select') {
        const e = await this._pagina(r, PAG.escolher, { seletor: info.seletor, texto: t });
        if (e.erro) { this._passo(r, 'erro', e.erro); throw erro(e.erro + (e.opcoes ? ' (opções: ' + e.opcoes.join(', ') + ')' : ''), 'alvo'); }
        this._passo(r, 'digitar', 'escolheu ' + e.valor + ' em ' + info.rotulo, { feito: true });
        return { ok: true, campo: info.rotulo, seletor: info.seletor, valor: e.valor, modo: 'escolha' };
      }
      await this._clique(r, info.x, info.y);
      const prep = await this._pagina(r, PAG.prepararCampo, { seletor: info.seletor });
      if (prep.senha) return this._recusarSenha(r, info);
      if (prep.erro) throw erro(prep.erro, 'alvo');
      await this._teclar(r, t);
      let fim = await this._pagina(r, PAG.valorDe, { seletor: info.seletor });
      let modo = 'teclado';
      if (fim.senha) return this._recusarSenha(r, info);
      if (!fim.erro && String(fim.valor).trim() !== t.trim()) { fim = await this._pagina(r, PAG.definirValor, { seletor: info.seletor, texto: t }); modo = 'valor'; }
      if (enter) await this._enter(r);
      this._passo(r, 'digitar', 'preencheu ' + info.rotulo, { feito: true, alvo: resumoAlvo(info) });
      return { ok: true, campo: info.rotulo, seletor: info.seletor, valor: fim.valor, modo, enviou: enter || undefined };
    });
  }

  /* ---------------- olhos do agente ---------------- */

  async ler(agente, opcoes = {}) {
    const r = await this._reg(agente);
    return this._vez(r, async () => {
      if (!opcoes.silencioso) this._passo(r, 'ler', 'lendo ' + (r.wc.getTitle() || curto(r.wc.getURL())) + '…');
      return this._pagina(r, PAG.ler, { max: opcoes.max || 60000 });
    });
  }

  async raioX(agente, opcoes = {}) {
    const r = await this._reg(agente);
    return this._vez(r, async () => {
      if (!opcoes.silencioso) this._passo(r, 'raiox', 'raio-X de ' + (opcoes.seletor ? opcoes.seletor + ' em ' : '') + (r.wc.getTitle() || curto(r.wc.getURL())) + '…');
      const partes = Array.isArray(opcoes.partes) && opcoes.partes.length ? opcoes.partes.map(String) : null;
      const soGravado = partes && partes.every((p) => p === 'rede' || p === 'console');
      const pag = soGravado ? { url: r.wc.getURL(), titulo: r.wc.getTitle(), contagem: {} }
        : await this._pagina(r, PAG.raioX, { seletor: opcoes.seletor, busca: opcoes.busca, dom: opcoes.dom !== false, maxNos: opcoes.maxNos, partes }, 30000);
      if (pag.elemento) {
        try { Object.assign(pag.elemento, await regrasDoElemento((m, p) => this._cdp(r, m, p), pag.elemento.seletor, r.grav.folhas)); } catch (e) { pag.elemento.erroRegras = e.message; }
      }
      pag.rede = r.grav.redeResumo(opcoes.maxRede || 300);
      pag.console = r.grav.consoleResumo(opcoes.maxConsole || 300);
      if (pag.fontes) pag.fontes.arquivos = r.grav.rede.filter((e) => e.tipo === 'Font').map((e) => ({ url: e.url, status: e.status, bytes: e.bytes, mime: e.mime, falhou: e.falhou || undefined }));
      pag.resumo = {
        elementos: pag.contagem.elementos, pedidos: pag.rede.length,
        falhas: pag.rede.filter((e) => e.falhou || e.status >= 400).length,
        errosNoConsole: pag.console.filter((m) => m.nivel === 'erro').length,
        fontes: pag.fontes ? pag.fontes.declaradas.length : undefined, cores: pag.cores ? pag.cores.length : undefined, blocosDeCopy: pag.copy ? pag.copy.length : undefined
      };
      return pag;
    });
  }

  /* ---------------- levar para a pasta ---------------- */

  async _arvoreDeRecursos(r) {
    const mapa = new Map();
    const { frameTree } = await this._cdp(r, 'Page.getResourceTree');
    const andar = (no) => {
      (no.resources || []).forEach((x) => { const u = x.url.split('#')[0]; if (!mapa.has(u)) mapa.set(u, { frameId: no.frame.id, mime: x.mimeType, tipo: x.type, falhou: !!x.failed }); });
      (no.childFrames || []).forEach(andar);
    };
    andar(frameTree);
    return mapa;
  }

  async _obter(r, url, mapa) {
    const x = mapa.get(url);
    if (x && !x.falhou) {
      try {
        const c = await this._cdp(r, 'Page.getResourceContent', { frameId: x.frameId, url });
        if (c && typeof c.content === 'string') { const buf = Buffer.from(c.content, c.base64Encoded ? 'base64' : 'utf8'); if (buf.length) return { buf, mime: x.mime, deCache: true }; }
      } catch (e) { /* não está mais na memória: vai pela rede */ }
    }
    const u = new URL(url);
    if (u.protocol === 'file:') {
      const f = fileURLToPath(u);
      if (!this._dentroDaPasta(f)) throw erro('arquivo fora da pasta compartilhada', 'pasta');
      return { buf: fs.readFileSync(f), mime: '' };
    }
    if (!/^https?:$/.test(u.protocol)) throw erro('esquema não suportado: ' + u.protocol, 'url');
    if (this._ehEstacao(u) && !u.pathname.startsWith('/pasta/')) throw erro('não copio da própria Estação', 'url');
    const resp = await comPrazo(r.wc.session.fetch(url), 20000, 'baixar ' + curto(url));
    if (!resp.ok) throw erro('HTTP ' + resp.status, 'rede');
    return { buf: Buffer.from(await resp.arrayBuffer()), mime: resp.headers.get('content-type') || '' };
  }

  _paginaAtual(r) {
    const url = r.wc.getURL();
    if (!/^(https?|file):/i.test(url)) throw erro('abra uma página antes', 'vazio');
    return url;
  }

  async clonar(agente, pastaDestino) {
    const r = await this._reg(agente);
    return this._vez(r, async () => {
      const pasta = this._destino(pastaDestino);
      const url = this._paginaAtual(r);
      const site = nomeDoSite(url);
      const dir = path.join(pasta, 'Clones', site);
      const t0 = Date.now();
      this._passo(r, 'clonar', 'clonando ' + curto(url) + '…', { url });
      const pag = await this._pagina(r, PAG.serializar, {}, 30000);
      const mapa = await this._arvoreDeRecursos(r);
      const res = await clonarPagina({ pagina: pag, obter: (u) => this._obter(r, u, mapa), dir });
      res.relativo = path.relative(pasta, res.index).split(path.sep).join('/');
      res.ms = Date.now() - t0;
      if (res.lista.length > 200) res.lista = res.lista.slice(0, 200);
      this._passo(r, 'clonar', 'clone pronto: ' + res.relativo + ' · ' + res.arquivos + ' arquivos' + (res.faltaram.length ? ' · ' + res.faltaram.length + ' não vieram' : ''), { feito: true, arquivo: res.relativo });
      return res;
    });
  }

  async copy(agente, pastaDestino) {
    const r = await this._reg(agente);
    return this._vez(r, async () => {
      const pasta = this._destino(pastaDestino);
      const url = this._paginaAtual(r);
      this._passo(r, 'copy', 'copiando os textos de ' + curto(url) + '…');
      const c = await this._pagina(r, PAG.copy, {}, 30000);
      const md = '<!-- copy de ' + String(c.url).replace(/--/g, '- -') + ' · babel-coop -->\n> copy de **' + (c.titulo || curto(c.url)).replace(/\*/g, '') + '** · ' + c.url + ' · ' + dataHora() + '\n\n' + c.corpo + '\n';
      const arquivo = path.join(pasta, 'Clones', nomeDoSite(url), 'copy.md');
      fs.mkdirSync(path.dirname(arquivo), { recursive: true });
      fs.writeFileSync(arquivo, md);
      const relativo = path.relative(pasta, arquivo).split(path.sep).join('/');
      this._passo(r, 'copy', 'copy pronta: ' + relativo + ' · ' + c.secoes + ' seções', { feito: true, arquivo: relativo });
      return { arquivo, relativo, secoes: c.secoes, blocos: c.blocos, bytes: Buffer.byteLength(md), markdown: md.slice(0, 20000) };
    });
  }

  async print(agente, pastaDestino) {
    const r = await this._reg(agente);
    return this._vez(r, async () => {
      const pasta = this._destino(pastaDestino);
      const url = this._paginaAtual(r);
      this._passo(r, 'print', 'print da página inteira de ' + curto(url) + '…');
      await this._pagina(r, PAG.cursor, { esconder: true }).catch(() => {});
      let buf, largura, alturaPagina, altura;
      try {
        const m = await this._cdp(r, 'Page.getLayoutMetrics');
        const tam = m.cssContentSize || m.contentSize;
        const vis = m.cssLayoutViewport || m.layoutViewport;
        largura = Math.max(1, Math.ceil(Math.max(tam.width, vis.clientWidth)));
        alturaPagina = Math.max(1, Math.ceil(tam.height));
        altura = Math.min(alturaPagina, 16000);
        const shot = await this._cdp(r, 'Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true, clip: { x: 0, y: 0, width: largura, height: altura, scale: 1 } }, 60000);
        buf = Buffer.from(shot.data, 'base64');
      } finally {
        this._pagina(r, PAG.cursor, { esconder: false }).catch(() => {});
      }
      const dim = dimensoesPng(buf) || {};
      const arquivo = path.join(pasta, 'Clones', nomeDoSite(url), 'print-' + carimbo() + '.png');
      fs.mkdirSync(path.dirname(arquivo), { recursive: true });
      fs.writeFileSync(arquivo, buf);
      const relativo = path.relative(pasta, arquivo).split(path.sep).join('/');
      this._passo(r, 'print', 'print pronto: ' + relativo + ' · ' + dim.largura + '×' + dim.altura, { feito: true, arquivo: relativo });
      return { arquivo, relativo, bytes: buf.length, largura: dim.largura, altura: dim.altura, larguraPagina: largura, alturaPagina, escala: dim.altura && altura ? +(dim.altura / altura).toFixed(3) : null, cortado: alturaPagina > altura };
    });
  }

  /* ---------------- inspeção (só leitura): o agente vê o site até o osso, sem rodar código livre na página ---------------- */

  /* os recursos da página: documentos (quadros), scripts, estilos, imagens, fontes… (frameId para ler o conteúdo) */
  async _recursos(r) {
    const { frameTree } = await this._cdp(r, 'Page.getResourceTree');
    const lista = [];
    const andar = (no, principal) => {
      lista.push({ url: no.frame.url, tipo: 'Document', mime: no.frame.mimeType || 'text/html', frameId: no.frame.id, quadro: principal ? 'principal' : 'filho' });
      (no.resources || []).forEach((x) => lista.push({ url: x.url, tipo: x.type, mime: x.mimeType, bytes: x.contentSize || undefined, falhou: x.failed || undefined, frameId: no.frame.id, quadro: principal ? 'principal' : 'filho' }));
      (no.childFrames || []).forEach((c) => andar(c, false));
    };
    andar(frameTree, true);
    const porUrl = new Map(r.grav.rede.map((e) => [e.url, e]));
    lista.forEach((x) => { const e = porUrl.get(x.url); if (e && !x.bytes) x.bytes = e.bytes || e.transferido || undefined; });
    return lista;
  }

  /* o conteúdo de um recurso da página: da memória do Chromium; com "Cache-Control: no-store" ele não guarda, então vem do
     corpo que a rede gravou (Network.getResponseBody) e, por último, é buscado de novo pela sessão do agente (rebaixado) */
  async _conteudo(r, x) {
    try {
      const c = await this._cdp(r, 'Page.getResourceContent', { frameId: x.frameId, url: x.url });
      return { texto: c.content, base64: !!c.base64Encoded };
    } catch (e) {
      const g = r.grav.rede.slice().reverse().find((y) => y.url === x.url && y.fim && !y.falhou);
      if (g) { try { const b = await this._cdp(r, 'Network.getResponseBody', { requestId: g.id }); return { texto: b.body, base64: !!b.base64Encoded }; } catch (e2) { /* o buffer da rede já soltou */ } }
      const o = await this._obter(r, x.url, new Map());
      return { texto: o.buf.toString('base64'), base64: true, rebaixado: true };
    }
  }

  /* source map de um JS ou CSS: data: embutido, um recurso já carregado ou buscado pela sessão do agente (como o DevTools) */
  async _sourceMap(r, ref, base, lista, max) {
    const res = { ref: ref.length > 200 ? ref.slice(0, 200) + '…' : ref };
    try {
      let texto;
      if (/^data:/i.test(ref)) {
        const m = /^data:[^,]*?(;base64)?,(.*)$/is.exec(ref);
        texto = m ? (m[1] ? Buffer.from(m[2], 'base64').toString('utf8') : decodeURIComponent(m[2])) : '';
        res.url = 'data: (embutido)';
      } else {
        const u = new URL(ref, base).href;
        res.url = u;
        const x = lista.find((y) => y.url === u);
        if (x) { const c = await this._conteudo(r, x); texto = c.base64 ? Buffer.from(c.texto, 'base64').toString('utf8') : c.texto; }
        else { const o = await this._obter(r, u, new Map()); texto = o.buf.toString('utf8'); }
      }
      res.bytes = texto.length;
      try { const j = JSON.parse(texto); res.fontes = Array.isArray(j.sources) ? j.sources.slice(0, 200) : []; if (Array.isArray(j.sourcesContent)) res.comConteudo = j.sourcesContent.filter(Boolean).length; } catch (e) { res.invalido = true; }
      res.cortado = texto.length > max;
      res.conteudo = texto.slice(0, max);
    } catch (e) { res.erro = e.message; }
    return res;
  }

  async codigo(agente, opcoes = {}) {
    const r = await this._reg(agente);
    return this._vez(r, async () => {
      const pagina = this._paginaAtual(r);
      const max = Math.max(1000, Math.min(+opcoes.max || 100000, 400000));
      const alvo = opcoes.url == null ? '' : String(opcoes.url).trim();
      if (!alvo) {
        this._passo(r, 'codigo', 'listando o código de ' + curto(pagina) + '…');
        const lista = await this._recursos(r);
        const porTipo = {};
        lista.forEach((x) => { porTipo[x.tipo] = (porTipo[x.tipo] || 0) + 1; });
        this._passo(r, 'codigo', 'código de ' + curto(pagina) + ': ' + Object.keys(porTipo).map((k) => porTipo[k] + ' ' + k).join(' · '), { feito: true });
        return { url: pagina, total: lista.length, porTipo, recursos: lista.map((x) => ({ url: x.url, tipo: x.tipo, mime: x.mime, bytes: x.bytes, falhou: x.falhou, quadro: x.quadro })), dom: 'url "dom" = o DOM vivo, como está agora' };
      }
      if (/^dom( vivo)?$/i.test(alvo)) {
        this._passo(r, 'codigo', 'lendo o DOM vivo de ' + curto(pagina) + '…');
        const d = await this._pagina(r, PAG.domVivo, { max });
        this._passo(r, 'codigo', 'DOM vivo de ' + curto(pagina) + ' · ' + tamanhoTexto(d.bytes), { feito: true });
        return { url: pagina, tipo: 'DOM vivo', mime: 'text/html', bytes: d.bytes, cortado: d.cortado, conteudo: d.html };
      }
      let u;
      try { u = new URL(alvo, pagina).href.split('#')[0]; } catch (e) { throw erro('endereço inválido: ' + alvo, 'url'); }
      this._passo(r, 'codigo', 'lendo o código de ' + curto(u) + '…', { url: u });
      const lista = await this._recursos(r);
      const x = lista.find((y) => y.url.split('#')[0] === u);
      let bruto, tipo, mime;
      if (x) { bruto = await this._conteudo(r, x); tipo = x.tipo; mime = x.mime; }
      else {
        /* resposta de fetch/XHR (não entra na árvore de recursos): o corpo que a rede gravou */
        const e = r.grav.rede.slice().reverse().find((y) => y.url.split('#')[0] === u && y.fim && !y.falhou);
        if (!e) { const msg = curto(u) + ' não foi carregado nesta página (só leio o que ela carregou)'; this._passo(r, 'erro', msg); throw erro(msg + ': peça navegador_codigo sem url para ver a lista', 'alvo'); }
        const b = await this._cdp(r, 'Network.getResponseBody', { requestId: e.id });
        bruto = { texto: b.body, base64: !!b.base64Encoded }; tipo = e.tipo; mime = e.mime;
      }
      const buf = bruto.base64 ? Buffer.from(bruto.texto, 'base64') : null;
      const res = { url: u, tipo, mime, bytes: buf ? buf.length : Buffer.byteLength(bruto.texto || '') };
      if (bruto.rebaixado) res.rebaixado = true; /* o Chromium não guardou (no-store): esta é uma cópia buscada agora */
      if (buf && !TEXTUAL.test(mime || '')) {
        res.binario = true;
        res.nota = 'arquivo binário (' + (mime || tipo) + ', ' + tamanhoTexto(buf.length) + '): o conteúdo não vai em texto; navegador_arquivo_baixar guarda uma cópia em Downloads/';
      } else {
        const texto = buf ? buf.toString('utf8') : String(bruto.texto || '');
        res.cortado = texto.length > max;
        res.conteudo = texto.slice(0, max);
        const m = /[#@]\s*sourceMappingURL\s*=\s*([^\s*'"]+)/.exec(texto.slice(-4000));
        if (m && /^(Script|Stylesheet)$/.test(tipo || '') || (m && /javascript|css/i.test(mime || ''))) res.sourceMap = await this._sourceMap(r, m[1], u, lista, max);
      }
      this._passo(r, 'codigo', 'li ' + curto(u) + ' · ' + (tipo || mime) + ' · ' + tamanhoTexto(res.bytes) + (res.sourceMap && !res.sourceMap.erro ? ' · com source map' : ''), { feito: true });
      return res;
    });
  }

  async rede(agente, opcoes = {}) {
    const r = await this._reg(agente);
    return this._vez(r, async () => {
      const pagina = r.wc.getURL();
      const f = String(opcoes.filtro || '').toLowerCase().trim();
      this._passo(r, 'rede', 'lendo a rede de ' + curto(pagina) + (f ? ' (filtro "' + f + '")' : '') + '…');
      const lista = r.grav.rede.filter((e) => !f || (e.url + ' ' + e.metodo + ' ' + e.tipo + ' ' + (e.status || '') + ' ' + (e.mime || '')).toLowerCase().includes(f)).slice(-100);
      let corpos = 0;
      const saida = [];
      for (const e of lista) {
        const x = { url: e.url, metodo: e.metodo, tipo: e.tipo, status: e.status, textoStatus: e.textoStatus, mime: e.mime, bytes: e.bytes, ms: e.ms, tempos: e.tempos, falhou: e.falhou || undefined, doCache: e.doCache || undefined, redirecionou: e.redirecionou || undefined, hora: e.hora, cabecalhosPedido: e.cabPedido, cabecalhosResposta: e.cabResposta };
        if (opcoes.corpo && e.fim && !e.falhou && e.status && corpos < 10 && !/^(Image|Font|Media)$/.test(e.tipo)) {
          corpos++;
          try {
            const b = await this._cdp(r, 'Network.getResponseBody', { requestId: e.id });
            const buf = b.base64Encoded ? Buffer.from(b.body, 'base64') : null;
            if (buf && !TEXTUAL.test(e.mime || '')) x.corpo = '(binário, ' + tamanhoTexto(buf.length) + ')';
            else { const t = buf ? buf.toString('utf8') : String(b.body || ''); x.corpo = t.slice(0, 20000); if (t.length > 20000) x.corpoCortado = true; }
          } catch (err) { x.corpo = null; x.semCorpo = 'o navegador não guardou este corpo (' + err.message.split('\n')[0] + ')'; }
        }
        saida.push(x);
      }
      this._passo(r, 'rede', 'rede de ' + curto(pagina) + ': ' + saida.length + ' pedidos' + (corpos ? ' · ' + corpos + ' com corpo' : ''), { feito: true });
      return { url: pagina, total: r.grav.rede.length, mostrados: saida.length, filtro: f || undefined, pedidos: saida };
    });
  }

  async console(agente, opcoes = {}) {
    const r = await this._reg(agente);
    return this._vez(r, async () => {
      const pagina = r.wc.getURL();
      this._passo(r, 'console', 'lendo o console de ' + curto(pagina) + '…');
      const nivel = opcoes.nivel ? String(opcoes.nivel) : null;
      const msgs = r.grav.consoleResumo(300).filter((m) => !nivel || m.nivel === nivel);
      const erros = msgs.filter((m) => m.nivel === 'erro').length;
      this._passo(r, 'console', 'console de ' + curto(pagina) + ': ' + msgs.length + ' mensagens · ' + erros + ' erros', { feito: true });
      return { url: pagina, total: msgs.length, erros, mensagens: msgs };
    });
  }

  async armazenamento(agente) {
    const r = await this._reg(agente);
    return this._vez(r, async () => {
      const pagina = this._paginaAtual(r);
      this._passo(r, 'armazenamento', 'lendo cookies e armazenamento de ' + curto(pagina) + '…');
      let cookies = [];
      if (/^https?:/i.test(pagina)) { try { cookies = await r.wc.session.cookies.get({ url: pagina }); } catch (e) { cookies = []; } }
      const pag = await this._pagina(r, PAG.armazenamento, { valores: cookies.map((c) => String(c.value || '')) });
      const comSenha = new Set(pag.cookiesComSenha || []);
      const lista = cookies.slice(0, 200).map((c, i) => ({
        nome: c.name, valor: comSenha.has(i) || PARECE_SENHA.test(c.name) ? '[redigido]' : String(c.value).slice(0, 4000), dominio: c.domain, caminho: c.path,
        httpOnly: !!c.httpOnly, seguro: !!c.secure, sameSite: c.sameSite, expira: c.expirationDate ? new Date(c.expirationDate * 1000).toISOString() : 'fim da sessão'
      }));
      const n = (x) => (Array.isArray(x) ? x.length : 0);
      this._passo(r, 'armazenamento', 'armazenamento de ' + curto(pagina) + ': ' + lista.length + ' cookies · ' + n(pag.local) + ' no localStorage · ' + n(pag.sessao) + ' no sessionStorage', { feito: true });
      return { url: pagina, origem: pag.origem, cookies: lista, localStorage: pag.local, sessionStorage: pag.sessao, particao: 'a do navegador de ' + r.nome };
    });
  }

  /* ---------------- navegação ---------------- */

  async rolar(agente, opcoes = {}) {
    const r = await this._reg(agente);
    return this._vez(r, async () => {
      this._agenteMexe(r);
      this._paginaAtual(r);
      let res, desc;
      const para = opcoes.para == null ? '' : String(opcoes.para).trim();
      if (opcoes.pixels != null && para === '') {
        const px = Math.max(-100000, Math.min(100000, Math.round(+opcoes.pixels || 0)));
        desc = px + ' px';
        this._passo(r, 'rolar', 'rolando ' + desc + '…');
        res = await this._pagina(r, PAG.rolar, { pixels: px });
      } else if (/^(topo|in[ií]cio|top)$/i.test(para) || /^(fim|final|rodap[eé]|bottom)$/i.test(para)) {
        const fim = /^(fim|final|rodap[eé]|bottom)$/i.test(para);
        desc = fim ? 'o fim' : 'o topo';
        this._passo(r, 'rolar', 'rolando até ' + desc + '…');
        res = await this._pagina(r, PAG.rolar, { para: fim ? 'fim' : 'topo' });
      } else if (para) {
        const info = await this._pagina(r, PAG.localizar, { alvo: normalizarAlvo(para), rolar: true });
        if (info.erro) { this._passo(r, 'erro', info.erro); throw erro(info.erro, 'alvo'); }
        desc = info.rotulo;
        this._passo(r, 'rolar', 'rolando até ' + desc + '…', { alvo: resumoAlvo(info) });
        res = Object.assign(await this._pagina(r, PAG.rolar, { so: true }), { elemento: info.rotulo, seletor: info.seletor });
      } else throw erro('diga para onde rolar (topo, fim, um seletor ou um texto) ou quantos pixels', 'alvo');
      this._passo(r, 'rolar', (opcoes.pixels != null && para === '' ? 'rolou ' : 'rolou até ') + desc + ' · y ' + res.y + ' de ' + res.altura, { feito: true });
      return res;
    });
  }

  /* navegador_esperar: até um seletor aparecer, um texto aparecer, ou um tempo (tudo até 30 s) */
  async aguardar(agente, opcoes = {}) {
    const r = await this._reg(agente);
    return this._vez(r, async () => {
      const prazo = Math.max(100, Math.min(+opcoes.ms || (opcoes.seletor || opcoes.texto ? 10000 : 1000), 30000));
      const t0 = Date.now();
      if (!opcoes.seletor && !opcoes.texto) {
        this._passo(r, 'esperar', 'esperando ' + prazo + ' ms…');
        await esperar(prazo);
        this._passo(r, 'esperar', 'esperou ' + prazo + ' ms', { feito: true });
        return { esperou: prazo };
      }
      const oque = opcoes.seletor ? String(opcoes.seletor) : '"' + String(opcoes.texto).slice(0, 80) + '"';
      this._passo(r, 'esperar', 'esperando ' + oque + ' aparecer…');
      for (;;) {
        let v = null;
        try { v = await this._pagina(r, PAG.achou, { seletor: opcoes.seletor || null, texto: opcoes.seletor ? null : opcoes.texto }, 5000); } catch (e) { v = null; /* a página trocou no meio: tenta de novo */ }
        if (v && v.erro) throw erro(v.erro, 'alvo');
        if (v && v.achou) { const ms = Date.now() - t0; this._passo(r, 'esperar', oque + ' apareceu em ' + ms + ' ms', { feito: true }); return { achou: true, ms, url: r.wc.getURL() }; }
        if (Date.now() - t0 >= prazo) { this._passo(r, 'esperar', oque + ' não apareceu em ' + prazo + ' ms', { feito: true }); return { achou: false, ms: Date.now() - t0, url: r.wc.getURL() }; }
        await esperar(150);
      }
    });
  }

  async _historico(agente, qual) {
    const r = await this._reg(agente);
    return this._vez(r, async () => {
      this._agenteMexe(r);
      const h = r.wc.navigationHistory || { canGoBack: () => r.wc.canGoBack(), canGoForward: () => r.wc.canGoForward(), goBack: () => r.wc.goBack(), goForward: () => r.wc.goForward() };
      if (qual === 'voltar' && !h.canGoBack()) throw erro('não há página anterior', 'historico');
      if (qual === 'avancar' && !h.canGoForward()) throw erro('não há página seguinte', 'historico');
      const nomes = { voltar: ['voltando…', 'voltou para '], avancar: ['avançando…', 'avançou para '], recarregar: ['recarregando ' + curto(r.wc.getURL()) + '…', 'recarregou '] };
      this._passo(r, qual, nomes[qual][0]);
      const t0 = Date.now(), antes = r.navegacoes, urlAntes = r.wc.getURL();
      if (qual === 'voltar') h.goBack(); else if (qual === 'avancar') h.goForward(); else r.wc.reload();
      const limite = Date.now() + 3000;
      while (Date.now() < limite && r.navegacoes === antes && r.wc.getURL() === urlAntes && !r.wc.isLoading()) await esperar(30);
      await this._assentar(r, 15000);
      const res = { url: r.wc.getURL(), titulo: r.wc.getTitle(), ms: Date.now() - t0 };
      this._passo(r, qual, nomes[qual][1] + (res.titulo || curto(res.url)), { feito: true, url: res.url });
      return res;
    });
  }
  voltar(agente) { return this._historico(agente, 'voltar'); }
  avancar(agente) { return this._historico(agente, 'avancar'); }
  recarregar(agente) { return this._historico(agente, 'recarregar'); }

  /* navegador_teclas: 'Enter', 'Tab Tab Enter', 'Shift+Tab', 'baixo, baixo, Enter' (até 30). Foco num campo de senha: recusa */
  async teclas(agente, teclas) {
    const lista = (Array.isArray(teclas) ? teclas : String(teclas || '').split(/[\s,]+/)).map((x) => String(x).trim()).filter(Boolean);
    if (!lista.length) throw erro('diga as teclas: Enter, Tab, Shift+Tab, Esc, setas (cima, baixo, esquerda, direita), Backspace, Delete, Home, End, PageUp, PageDown, Espaço', 'alvo');
    if (lista.length > 30) throw erro('no máximo 30 teclas por vez', 'alvo');
    const plano = lista.map((x) => {
      const m = /^(shift\+)?(.+)$/i.exec(x);
      const def = TECLAS[m[2].toLowerCase().replace(/^seta[-_ ]?/, '').replace(/ç/g, 'c')];
      if (!def) throw erro('tecla não permitida: "' + x + '" (o agente aperta Enter, Tab, Shift+Tab, Esc, setas, Backspace, Delete, Home, End, PageUp, PageDown e Espaço; atalho com Ctrl/Cmd fica com a pessoa)', 'alvo');
      return { nome: (m[1] ? 'Shift+' : '') + def[0].replace(' ', 'Espaço'), def, shift: !!m[1] };
    });
    const r = await this._reg(agente);
    return this._vez(r, async () => {
      this._agenteMexe(r);
      this._paginaAtual(r);
      const antes = r.navegacoes;
      this._passo(r, 'teclas', 'teclas: ' + plano.map((p) => p.nome).join(' ') + '…');
      const feitas = [];
      for (const p of plano) {
        const f = await this._pagina(r, PAG.foco, {});
        if (f && f.senha) return Object.assign(this._recusarSenha(r, f), { feitas, recusada: p.nome });
        const [key, code, vk, texto] = p.def;
        const mods = p.shift ? 8 : 0;
        await this._cdp(r, 'Input.dispatchKeyEvent', Object.assign({ type: texto ? 'keyDown' : 'rawKeyDown', key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: mods }, texto ? { text: texto, unmodifiedText: texto } : {}));
        await this._cdp(r, 'Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: mods });
        feitas.push(p.nome);
        await esperar(r.reduzido ? 20 : 60);
      }
      await esperar(200);
      const navegou = r.navegacoes > antes;
      if (navegou) await this._assentar(r, 15000);
      const f = await this._pagina(r, PAG.foco, {}).catch(() => null);
      this._passo(r, 'teclas', 'apertou ' + feitas.join(' ') + (navegou ? ' · abriu ' + (r.wc.getTitle() || curto(r.wc.getURL())) : ''), { feito: true });
      return { ok: true, teclas: feitas, navegou, url: r.wc.getURL(), titulo: r.wc.getTitle(), foco: f ? { tag: f.tag, rotulo: f.rotulo, seletor: f.seletor } : null };
    });
  }

  /* navegador_arquivo_baixar: com os cookies da partição do agente, direto para <pasta>/Downloads/ */
  async baixar(agente, url) {
    const r = await this._reg(agente);
    return this._vez(r, async () => {
      const pagina = r.wc.getURL();
      let u;
      try { u = new URL(String(url || '').trim(), /^https?:/i.test(pagina) ? pagina : undefined); } catch (e) { throw erro('endereço inválido: ' + url, 'url'); }
      if (!/^https?:$/.test(u.protocol)) throw erro('só baixo endereços http ou https', 'url');
      this._urlAceita(u.href);
      if (this._ehEstacao(u)) throw erro('não baixo da própria Estação (o arquivo já está na sua pasta)', 'url');
      const pasta = this._destino('Downloads');
      this._passo(r, 'baixar', 'baixando ' + curto(u.href) + '…', { url: u.href });
      let resp;
      try { resp = await this._buscarSeguro(r, u.href); } catch (e) { this._passo(r, 'erro', 'não baixei ' + curto(u.href) + ': ' + e.message); throw e; }
      const buf = resp.buf;
      const cd = resp.cabecalho('content-disposition') || '';
      const mcd = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(cd) || /filename\s*=\s*"?([^";]+)"?/i.exec(cd);
      let nome = nomeSeguro(mcd ? decodeURIComponent(mcd[1].trim().replace(/^"|"$/g, '')) : decodeURIComponent(u.pathname.split('/').pop() || ''));
      const ext = path.extname(nome), raiz = nome.slice(0, nome.length - ext.length);
      for (let i = 2; fs.existsSync(path.join(pasta, nome)) && i < 1000; i++) nome = raiz + ' (' + i + ')' + ext;
      const arquivo = path.join(pasta, nome);
      if (path.dirname(path.resolve(arquivo)) !== path.resolve(pasta)) throw erro('nome de arquivo fora de Downloads/', 'pasta'); /* o nome seguro nunca sai; fica a trava */
      fs.writeFileSync(arquivo, buf);
      const relativo = path.relative(this._pasta() || pasta, arquivo).split(path.sep).join('/');
      this._passo(r, 'baixar', 'baixado: ' + relativo + ' · ' + tamanhoTexto(buf.length), { feito: true, arquivo: relativo });
      return { arquivo, relativo, bytes: buf.length, mime: resp.cabecalho('content-type') || '', saltos: resp.saltos, url: resp.url };
    });
  }

  /* download do agente: net.request na sessão (cookies de lá) sem seguir redirecionamento sozinho. O Electron só deixa seguir
     dentro do próprio evento (sem tempo para o DNS), então cada salto é um pedido novo, conferido antes (até 5). Até MAX_BAIXAR. */
  async _buscarSeguro(r, url) {
    let atual = url;
    await this._checarAgente(new URL(atual));
    for (let saltos = 0; ; saltos++) {
      const resp = await this._umPedido(r, atual);
      if (!resp.redirecionar) return Object.assign(resp, { saltos, url: atual });
      if (saltos + 1 > MAX_SALTOS) throw erro('redirecionamentos demais (mais de ' + MAX_SALTOS + ')', 'rede');
      let u;
      try { u = new URL(resp.redirecionar, atual); } catch (e) { throw erro('redirecionamento inválido', 'url'); }
      this._urlAceita(u.href);
      if (!/^https?:$/.test(u.protocol) || this._ehEstacao(u)) throw erro('redirecionamento recusado: ' + curto(u.href), 'url');
      try { await this._checarAgente(u); } catch (e) { throw erro('redirecionamento recusado (' + curto(u.href) + '): ' + e.message, e.codigo || 'interno'); }
      atual = u.href;
    }
  }

  /* um pedido GET, sem seguir redirecionamento: {redirecionar: destino} ou {buf, cabecalho(k), status} */
  _umPedido(r, url) {
    const { net: rede } = require('electron');
    return new Promise((ok, falha) => {
      let feito = false, destino = null;
      const req = rede.request({ url, session: r.wc.session, useSessionCookies: true, redirect: 'manual' });
      const acabar = (e, v) => { if (feito) return; feito = true; clearTimeout(t); if (e) { try { req.abort(); } catch (x) { /* já foi */ } falha(e); } else ok(v); };
      const t = setTimeout(() => acabar(erro('demorou demais: baixar ' + curto(url), 'prazo')), 60000);
      /* não chama followRedirect: o pedido morre com "Redirect was cancelled" e o salto é decidido lá em cima */
      req.on('redirect', (_status, _metodo, novo) => { destino = novo; });
      req.on('response', (res) => {
        const cab = (k) => { const v = res.headers[k]; return Array.isArray(v) ? v[0] : v; };
        if (res.statusCode >= 400) return acabar(erro('HTTP ' + res.statusCode, 'rede'));
        if (+cab('content-length') > MAX_BAIXAR) return acabar(erro('arquivo maior que ' + tamanhoTexto(MAX_BAIXAR), 'tamanho'));
        const partes = []; let n = 0;
        res.on('data', (c) => { n += c.length; if (n > MAX_BAIXAR) return acabar(erro('arquivo maior que ' + tamanhoTexto(MAX_BAIXAR), 'tamanho')); partes.push(c); });
        res.on('end', () => acabar(null, { buf: Buffer.concat(partes), cabecalho: cab, status: res.statusCode }));
        res.on('error', (e) => acabar(e));
      });
      req.on('error', (e) => { if (destino) acabar(null, { redirecionar: destino }); else acabar(e); });
      req.end();
    });
  }

  /* ---------------- a pessoa ---------------- */

  async assumir(agente) {
    const r = this._regJa(agente);
    r.controlador = 'pessoa';
    r.suaVez = false;
    this._pagina(r, PAG.cursor, { remover: true }).catch(() => {});
    r.cursor = null;
    this._passo(r, 'controle', (r.pessoa || 'a pessoa') + ' assumiu o navegador');
    this._estado(r);
    return this._resumo(r);
  }

  async devolver(agente) {
    const r = this._regJa(agente);
    r.controlador = 'agente';
    r.suaVez = false; /* a pessoa já fez a parte dela (a senha) e devolveu: o estado emitido não traz mais "sua vez" */
    this._passo(r, 'controle', 'navegador devolvido a ' + r.nome);
    this._estado(r);
    return this._resumo(r);
  }

  /* "Selecionar elemento": o modo inspeção do próprio Chromium (realce com medidas); resolve com o elemento clicado */
  async selecionar(agente, ligar = true) {
    const r = this._regJa(agente);
    if (!ligar) { await this._pararSelecao(r, null); return null; }
    if (r.selecionando) return r.selecionando.promessa;
    let ok;
    const promessa = new Promise((res) => { ok = res; });
    r.selecionando = { promessa, ok, timer: setTimeout(() => { this._pararSelecao(r, null); }, 180000) };
    try {
      await this._cdp(r, 'Overlay.enable');
      await this._cdp(r, 'Overlay.setInspectMode', { mode: 'searchForNode', highlightConfig: DESTAQUE });
    } catch (e) {
      clearTimeout(r.selecionando.timer);
      r.selecionando = null;
      throw erro('não consegui ligar o modo de seleção: ' + e.message, 'cdp');
    }
    this._passo(r, 'selecionar', 'selecionar elemento: clique na página');
    this._estado(r);
    return promessa;
  }

  async _pararSelecao(r, escolha) {
    const s = r.selecionando;
    if (!s) return;
    r.selecionando = null;
    clearTimeout(s.timer);
    try { await this._cdp(r, 'Overlay.setInspectMode', { mode: 'none', highlightConfig: {} }); await this._cdp(r, 'Overlay.hideHighlight'); } catch (e) { /* página foi embora */ }
    s.ok(escolha);
    this._estado(r, { selecionado: escolha ? { seletor: escolha.seletor, tag: escolha.tag, rotulo: escolha.rotulo } : null });
  }

  async _escolhido(r, backendNodeId) {
    if (!r.selecionando) return;
    let info = null;
    try {
      const { object } = await this._cdp(r, 'DOM.resolveNode', { backendNodeId });
      const fn = PAG.seletorDoNo.toString().replace('(KIT)', '(' + KIT + ')');
      const res = await this._cdp(r, 'Runtime.callFunctionOn', { objectId: object.objectId, functionDeclaration: fn, returnByValue: true });
      info = res && res.result && res.result.value;
      this._cdp(r, 'Runtime.releaseObject', { objectId: object.objectId }).catch(() => {});
    } catch (e) { info = null; }
    let raio = null;
    if (info && info.seletor) raio = await this.raioX(r.id, { seletor: info.seletor, dom: false, silencioso: true }).catch(() => null);
    const escolha = info ? Object.assign({}, info, { elemento: raio && raio.elemento }) : null;
    if (escolha) this._passo(r, 'selecionar', 'elemento escolhido: ' + info.rotulo + ' (' + info.seletor + ')', { alvo: { seletor: info.seletor, rotulo: info.rotulo } });
    await this._pararSelecao(r, escolha);
  }

  fechar() { Array.from(this.agentes.values()).forEach((r) => this._soltar(r, 'app fechando')); }
}

module.exports = { Navegadores, normalizarAlvo, classificarIp, nomeSeguro };
