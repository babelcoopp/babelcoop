/* babel-coop · o que o raio-X lê pelo protocolo do próprio Chromium (CDP), fora da página
   - Gravador: pedidos de rede (Network) e mensagens do console (Runtime + Log) desde que o webview foi registrado;
     zera a cada documento novo no quadro principal, como o DevTools faz sem "preservar registro".
   - regrasDoElemento: as regras CSS que valem para o elemento (a mais forte primeiro), com a folha de origem,
     e as fontes que o motor usou de verdade para desenhar o texto dele.
*/
'use strict';

const MAX_REDE = 500;
const MAX_CONSOLE = 400;
const NIVEL = { log: 'log', info: 'info', warning: 'aviso', error: 'erro', debug: 'debug', assert: 'erro', trace: 'log', dir: 'log', table: 'log', verbose: 'debug' };

function textoDoArgumento(a) {
  if (!a) return '';
  if (a.value !== undefined) return typeof a.value === 'string' ? a.value : JSON.stringify(a.value);
  if (a.unserializableValue) return a.unserializableValue;
  if (a.preview && a.preview.properties) return (a.description || a.type) + ' {' + a.preview.properties.map((p) => p.name + ': ' + p.value).join(', ') + (a.preview.overflow ? ', …' : '') + '}';
  return a.description || a.type || '';
}

/* console.log('%c texto', 'color:red') → "texto" (tira o estilo, como o DevTools mostra) */
function formatarConsole(args) {
  const lista = (args || []).slice();
  if (lista.length && typeof lista[0].value === 'string' && /%[csdifoO]/.test(lista[0].value)) {
    let modelo = lista.shift().value;
    modelo = modelo.replace(/%([csdifoO])/g, (m, t) => { const a = lista.shift(); if (t === 'c') return ''; return a ? textoDoArgumento(a) : m; });
    return [modelo].concat(lista.map(textoDoArgumento)).join(' ').trim();
  }
  return lista.map(textoDoArgumento).join(' ');
}

/* cabeçalhos para o agente e a tela: os de autorização nunca saem (token de acesso não é assunto do raio-X) */
const REDIGIR = /^(authorization|proxy-authorization)$/i;
function cabecalhos(h) {
  const o = {};
  Object.keys(h || {}).slice(0, 80).forEach((k) => { o[k] = REDIGIR.test(k) ? '[redigido]' : String(h[k]).slice(0, 2000); });
  return o;
}
function dur(a, b) { return a >= 0 && b >= 0 ? Math.round(b - a) : undefined; }

class Gravador {
  constructor() { this.rede = []; this.mapa = new Map(); this.console = []; this.quadroPrincipal = null; this.folhas = new Map(); this.documento = null; }

  zerar() { this.rede = []; this.mapa.clear(); this.console = []; }

  evento(metodo, p) {
    switch (metodo) {
      case 'Page.frameNavigated': if (!p.frame.parentId) this.quadroPrincipal = p.frame.id; return;
      case 'CSS.styleSheetAdded': this.folhas.set(p.header.styleSheetId, p.header.sourceURL || (p.header.isInline ? '(estilo na página)' : '(folha criada por script)')); return;
      case 'CSS.styleSheetRemoved': this.folhas.delete(p.styleSheetId); return;
      case 'Network.requestWillBeSent': {
        const doc = p.type === 'Document' && p.requestId === p.loaderId && (!this.quadroPrincipal || p.frameId === this.quadroPrincipal) && !p.redirectResponse;
        if (doc) { this.zerar(); this.quadroPrincipal = p.frameId || this.quadroPrincipal; }
        const antigo = this.mapa.get(p.requestId);
        if (antigo && p.redirectResponse) { antigo.status = p.redirectResponse.status; antigo.redirecionou = p.request.url; antigo.fim = true; antigo.ms = Math.round((p.timestamp - antigo.inicio) * 1000); }
        const e = { id: p.requestId, url: p.request.url, metodo: p.request.method, tipo: p.type || 'Other', status: null, mime: null, bytes: 0, transferido: 0, ms: null, falhou: null, doCache: false, inicio: p.timestamp, hora: Math.round((p.wallTime || Date.now() / 1000) * 1000), cabPedido: cabecalhos(p.request.headers) };
        this.mapa.set(p.requestId, e);
        this.rede.push(e);
        if (this.rede.length > MAX_REDE) { const fora = this.rede.shift(); if (this.mapa.get(fora.id) === fora) this.mapa.delete(fora.id); }
        if (doc) this.documento = e;
        return;
      }
      case 'Network.responseReceived': {
        const e = this.mapa.get(p.requestId); if (!e) return;
        e.status = p.response.status; e.mime = p.response.mimeType; e.tipo = p.type || e.tipo; e.textoStatus = p.response.statusText || undefined;
        e.cabResposta = cabecalhos(p.response.headers);
        if (p.response.timing) { const tm = p.response.timing; e.tempos = { dns: dur(tm.dnsStart, tm.dnsEnd), conexao: dur(tm.connectStart, tm.connectEnd), envio: dur(tm.sendStart, tm.sendEnd), espera: dur(tm.sendEnd, tm.receiveHeadersEnd) }; }
        if (p.response.fromDiskCache || p.response.fromPrefetchCache) e.doCache = true;
        if (p.response.remoteIPAddress) e.ip = p.response.remoteIPAddress;
        return;
      }
      case 'Network.requestServedFromCache': { const e = this.mapa.get(p.requestId); if (e) e.doCache = true; return; }
      case 'Network.dataReceived': { const e = this.mapa.get(p.requestId); if (e) e.bytes += p.dataLength || 0; return; }
      case 'Network.loadingFinished': {
        const e = this.mapa.get(p.requestId); if (!e) return;
        e.transferido = p.encodedDataLength || 0; e.fim = true; e.ms = Math.round((p.timestamp - e.inicio) * 1000);
        if (!e.bytes) e.bytes = e.transferido;
        return;
      }
      case 'Network.loadingFailed': {
        const e = this.mapa.get(p.requestId); if (!e) return;
        e.falhou = p.canceled ? 'cancelado' : (p.blockedReason ? 'bloqueado: ' + p.blockedReason : p.errorText); e.fim = true; e.ms = Math.round((p.timestamp - e.inicio) * 1000);
        return;
      }
      case 'Runtime.consoleAPICalled': {
        const topo = p.stackTrace && p.stackTrace.callFrames && p.stackTrace.callFrames[0];
        this.anotar({ nivel: NIVEL[p.type] || 'log', texto: formatarConsole(p.args), url: topo ? topo.url : undefined, linha: topo ? topo.lineNumber + 1 : undefined, hora: Math.round(p.timestamp) });
        return;
      }
      case 'Runtime.exceptionThrown': {
        const d = p.exceptionDetails || {};
        this.anotar({ nivel: 'erro', excecao: true, texto: (d.exception && d.exception.description) || d.text || 'exceção', url: d.url, linha: d.lineNumber != null ? d.lineNumber + 1 : undefined, hora: Math.round(p.timestamp) });
        return;
      }
      case 'Log.entryAdded': {
        const x = p.entry || {};
        this.anotar({ nivel: NIVEL[x.level] || 'log', texto: x.text, url: x.url, linha: x.lineNumber != null ? x.lineNumber + 1 : undefined, origem: x.source, hora: Math.round(x.timestamp || Date.now()) });
        return;
      }
      default:
    }
  }

  anotar(m) {
    if (m.texto && m.texto.length > 2000) m.texto = m.texto.slice(0, 2000) + '…';
    this.console.push(m);
    if (this.console.length > MAX_CONSOLE) this.console.shift();
  }

  /* cópia limpa (sem ids internos do CDP) para mandar à tela e ao agente */
  redeResumo(max = 300) {
    return this.rede.slice(-max).map((e) => ({ url: e.url, metodo: e.metodo, tipo: e.tipo, status: e.status, mime: e.mime, bytes: e.bytes, transferido: e.transferido, ms: e.ms, falhou: e.falhou || undefined, doCache: e.doCache || undefined, redirecionou: e.redirecionou || undefined, hora: e.hora }));
  }

  consoleResumo(max = 300) { return this.console.slice(-max).map((m) => Object.assign({}, m)); }
}

/* regras CSS do elemento (DevTools › Styles) e fontes realmente usadas no texto dele */
async function regrasDoElemento(cdp, seletor, folhas) {
  const doc = await cdp('DOM.getDocument', { depth: 0 });
  const q = await cdp('DOM.querySelector', { nodeId: doc.root.nodeId, selector: seletor });
  if (!q || !q.nodeId) return null;
  const m = await cdp('CSS.getMatchedStylesForNode', { nodeId: q.nodeId });
  const props = (estilo) => (estilo && estilo.cssProperties || []).filter((p) => p.text || p.value).filter((p) => !p.disabled).map((p) => ({ nome: p.name, valor: p.value, importante: !!p.important || undefined }))
    .filter((p, i, todas) => todas.findIndex((x) => x.nome === p.nome && x.valor === p.valor) === i);
  let doNavegador = 0;
  const regras = [];
  if (m.inlineStyle && m.inlineStyle.cssProperties && m.inlineStyle.cssProperties.some((p) => p.text)) regras.push({ seletor: 'style=""', origem: 'atributo style', propriedades: props(m.inlineStyle) });
  (m.matchedCSSRules || []).slice().reverse().forEach((x) => {
    if (x.rule.origin === 'user-agent') { doNavegador++; return; }
    regras.push({ seletor: x.rule.selectorList.text, origem: folhas.get(x.rule.styleSheetId) || x.rule.origin, linha: x.rule.style.range ? x.rule.style.range.startLine + 1 : undefined, midia: (x.rule.media || []).map((md) => md.text).join(', ') || undefined, propriedades: props(x.rule.style) });
  });
  const herdadas = [];
  (m.inherited || []).forEach((h, nivel) => (h.matchedCSSRules || []).forEach((x) => {
    if (x.rule.origin === 'user-agent') return;
    const ps = props(x.rule.style).filter((p) => /^(color|font|line-height|letter-spacing|text-|visibility|cursor|white-space|word-|direction|quotes|list-style)/.test(p.nome));
    if (ps.length) herdadas.push({ seletor: x.rule.selectorList.text, origem: folhas.get(x.rule.styleSheetId) || x.rule.origin, nivel: nivel + 1, propriedades: ps });
  }));
  let fontesRenderizadas = [];
  try {
    const pf = await cdp('CSS.getPlatformFontsForNode', { nodeId: q.nodeId });
    fontesRenderizadas = (pf.fonts || []).map((f) => ({ familia: f.familyName, postScript: f.postScriptName, glifos: f.glyphCount, daPagina: !!f.isCustomFont }));
  } catch (e) { /* elemento sem texto próprio */ }
  return { regras, herdadas: herdadas.slice(0, 30), regrasDoNavegador: doNavegador, fontesRenderizadas };
}

module.exports = { Gravador, regrasDoElemento, formatarConsole };
