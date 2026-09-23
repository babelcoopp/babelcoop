/* babel-coop · o que roda DENTRO da página do navegador do agente
   Cada função daqui vira texto e é executada num mundo isolado do webview (executeJavaScriptInIsolatedWorld):
   o DOM é o mesmo da página, mas o JavaScript da página não enxerga nem altera estas funções.
   Regra de ouro: cada função é autossuficiente (nada de fechar sobre variáveis deste arquivo).
   Todas recebem (K, a): K = o kit abaixo (utilidades), a = argumentos em JSON.
*/
'use strict';

/* ---------- kit: utilidades usadas pelas outras funções ---------- */
function kit() {
  var ID_CURSOR = '__babel-coop-cursor';
  /* o cursor do agente e os contornos do Raio-X (a tela os marca com data-babel-coop-raiox) não são a página */
  var MARCA_RAIOX = '[data-babel-coop-raiox]';
  var PULAR = 'script,style,noscript,template,svg,iframe,object,embed,head,#' + ID_CURSOR + ',' + MARCA_RAIOX;
  function limpo(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function nosso(el) { return !!(el && el.closest && el.closest('#' + ID_CURSOR + ',' + MARCA_RAIOX)); }
  function pular(el) { return !el || el.nodeType !== 1 || !!el.closest(PULAR); }
  function visivel(el) {
    if (!el || el.nodeType !== 1 || nosso(el)) return false;
    if (el.checkVisibility) return el.checkVisibility({ visibilityProperty: true, opacityProperty: false });
    if (!el.getClientRects().length) return false;
    return getComputedStyle(el).visibility !== 'hidden';
  }
  var esc = (window.CSS && CSS.escape) ? CSS.escape : function (s) { return String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&'); };
  function unico(sel) { try { return document.querySelectorAll(sel).length === 1; } catch (e) { return false; } }
  /* seletor curto e único (id quando dá; senão o caminho com nth-of-type até achar um ancestral com id) */
  function seletorDe(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el === document.documentElement) return 'html';
    if (el === document.body) return 'body';
    if (el.id && unico('#' + esc(el.id))) return '#' + esc(el.id);
    var partes = [];
    var atual = el;
    while (atual && atual.nodeType === 1 && atual !== document.documentElement) {
      if (atual !== el && atual.id && unico('#' + esc(atual.id))) { partes.unshift('#' + esc(atual.id)); break; }
      if (atual === document.body) { partes.unshift('body'); break; }
      var tag = atual.tagName.toLowerCase();
      var parte = tag;
      var nome = atual.getAttribute('name');
      if (nome && /^(input|select|textarea|button)$/.test(tag)) parte = tag + '[name="' + nome.replace(/["\\]/g, '\\$&') + '"]';
      var pai = atual.parentElement;
      if (pai && parte === tag) {
        var mesmos = Array.prototype.filter.call(pai.children, function (c) { return c.tagName === atual.tagName; });
        if (mesmos.length > 1) parte += ':nth-of-type(' + (mesmos.indexOf(atual) + 1) + ')';
      }
      partes.unshift(parte);
      if (unico(partes.join(' > '))) return partes.join(' > ');
      atual = pai;
    }
    return partes.join(' > ');
  }
  /* o nome que uma pessoa daria ao elemento: rótulo do campo, texto do botão, aria-label, placeholder */
  function rotuloDe(el) {
    if (!el || el.nodeType !== 1) return '';
    var t = '';
    if (el.labels && el.labels.length) t = limpo(el.labels[0].innerText || el.labels[0].textContent);
    if (!t) t = limpo(el.getAttribute('aria-label'));
    if (!t && el.getAttribute('aria-labelledby')) {
      t = limpo(el.getAttribute('aria-labelledby').split(/\s+/).map(function (i) { var x = document.getElementById(i); return x ? x.textContent : ''; }).join(' '));
    }
    if (!t) t = limpo(el.getAttribute('placeholder'));
    if (!t && el.tagName === 'INPUT' && /^(submit|button|reset)$/i.test(el.type)) t = limpo(el.value);
    if (!t && /^(BUTTON|A|SUMMARY|LABEL|OPTION|H[1-6])$/.test(el.tagName)) t = limpo(el.innerText || el.textContent);
    if (!t) t = limpo(el.getAttribute('title') || el.getAttribute('alt') || el.getAttribute('name'));
    if (!t) t = limpo(el.innerText || el.textContent).slice(0, 60);
    if (!t) t = el.tagName.toLowerCase();
    return t.replace(/\s*[:*]+\s*$/, '').slice(0, 80);
  }
  /* senha só a pessoa digita: type=password, autocomplete com "password" ou nome/id de senha */
  function ehSenha(el) {
    if (!el || el.nodeType !== 1) return false;
    var tipo = String(el.getAttribute('type') || '').toLowerCase();
    if (el.tagName === 'INPUT' && (tipo === 'password' || el.type === 'password')) return true;
    if (/password/i.test(el.getAttribute('autocomplete') || '')) return true;
    var nomes = (el.getAttribute('name') || '') + ' ' + (el.id || '');
    return el.tagName === 'INPUT' && /(^|[^a-z])(senha|password|passwd|pwd)([^a-z]|$)/i.test(nomes);
  }
  function caixa(el) { var r = el.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; }
  function hex(c) {
    var m = /rgba?\(([^)]+)\)/.exec(String(c || ''));
    if (!m) return null;
    var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
    if (p.length < 3) return null;
    var a = p.length > 3 ? p[3] : 1;
    if (a === 0) return null;
    var h = '#' + [p[0], p[1], p[2]].map(function (v) { var s = Math.round(v).toString(16); return s.length < 2 ? '0' + s : s; }).join('');
    if (a < 1) { var s = Math.round(a * 255).toString(16); h += (s.length < 2 ? '0' : '') + s; }
    return h;
  }
  /* blocos de texto em ordem de leitura (o que uma pessoa lê na página): base da copy e do raio-X */
  function blocosDeTexto(max) {
    max = max || 1500;
    var cacheDisplay = new Map();
    function display(el) { if (!cacheDisplay.has(el)) cacheDisplay.set(el, getComputedStyle(el).display); return cacheDisplay.get(el); }
    function temTextoDireto(el) { for (var i = 0; i < el.childNodes.length; i++) { var n = el.childNodes[i]; if (n.nodeType === 3 && limpo(n.nodeValue)) return true; } return false; }
    function blocoDe(el) {
      var b = el;
      while (b && b !== document.body) {
        if (/^(BUTTON|SUMMARY|LABEL|LI|TD|TH|P|H[1-6]|BLOCKQUOTE|FIGCAPTION|DT|DD|OPTION|LEGEND|CAPTION)$/.test(b.tagName)) return b;
        if ((b.tagName === 'A' || b.getAttribute('role') === 'button') && b.parentElement && !temTextoDireto(b.parentElement)) return b;
        var d = display(b);
        if (d && d.indexOf('inline') !== 0 && d !== 'contents') return b;
        b = b.parentElement;
      }
      return b || document.body;
    }
    var mapa = new Map();
    var blocos = [];
    if (!document.body) return blocos;
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = w.nextNode())) {
      if (blocos.length >= max) break;
      var p = n.parentElement;
      if (!p || !limpo(n.nodeValue) || pular(p) || !visivel(p)) continue;
      var b = blocoDe(p);
      var reg = mapa.get(b);
      if (!reg) { reg = { el: b, partes: [] }; mapa.set(b, reg); blocos.push(reg); }
      reg.partes.push(n.nodeValue);
    }
    /* botões feitos com <input type=submit> não têm nó de texto */
    Array.prototype.forEach.call(document.querySelectorAll('input[type=submit],input[type=button]'), function (el) {
      if (visivel(el) && !pular(el) && limpo(el.value) && !mapa.has(el)) { var reg = { el: el, partes: [el.value] }; mapa.set(el, reg); blocos.push(reg); }
    });
    blocos.sort(function (a, b) { return a.el === b.el ? 0 : (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1); });
    return blocos.map(function (r) {
      var el = r.el;
      var tag = el.tagName.toLowerCase();
      var tipo = /^h[1-6]$/.test(tag) ? tag : (tag === 'button' || (tag === 'input') || el.getAttribute('role') === 'button') ? 'botao' : tag === 'a' ? 'link' : tag === 'li' ? 'item' : tag === 'label' ? 'rotulo' : 'texto';
      return { tag: tag, tipo: tipo, texto: limpo(r.partes.join(' ')), el: el };
    }).filter(function (b) { return b.texto; });
  }
  return { ID_CURSOR: ID_CURSOR, MARCA_RAIOX: MARCA_RAIOX, limpo: limpo, nosso: nosso, pular: pular, visivel: visivel, seletorDe: seletorDe, rotuloDe: rotuloDe, ehSenha: ehSenha, caixa: caixa, hex: hex, blocosDeTexto: blocosDeTexto, unico: unico };
}

/* ---------- localizar: acha o alvo (seletor ou texto), rola até ele e devolve o ponto do clique ---------- */
function localizar(K, a) {
  var alvo = a.alvo || {};
  var el = null;
  if (alvo.seletor) {
    try { el = document.querySelector(alvo.seletor); } catch (e) { return { erro: 'seletor inválido: ' + alvo.seletor }; }
    if (!el) return { erro: 'não achei "' + alvo.seletor + '" na página' };
  } else {
    var t = K.limpo(alvo.texto).toLowerCase();
    if (!t) return { erro: 'diga o seletor ou o texto do que clicar' };
    var INTER = 'a,button,[role=button],[role=link],[role=tab],[role=menuitem],[role=checkbox],input,select,textarea,summary,label,[onclick],[tabindex]';
    var melhor = null, nota = 0;
    var todos = document.body ? document.body.querySelectorAll('*') : [];
    for (var i = 0; i < todos.length; i++) {
      var c = todos[i];
      if (K.pular(c)) continue;
      var bruto = (c.textContent || '').toLowerCase();
      var extras = [c.getAttribute('aria-label'), c.getAttribute('title'), c.getAttribute('placeholder'), c.getAttribute('alt'), c.tagName === 'INPUT' ? c.value : ''].map(function (s) { return K.limpo(s).toLowerCase(); });
      if (bruto.indexOf(t) === -1 && !extras.some(function (s) { return s && s.indexOf(t) !== -1; })) continue;
      if (bruto.length > 600 && !extras.some(function (s) { return s === t; })) continue;
      var texto = K.limpo(c.innerText || c.textContent).toLowerCase();
      var textos = [texto].concat(extras);
      var n = 0;
      if (textos.some(function (s) { return s === t; })) n = 3;
      else if (textos.some(function (s) { return s && s.indexOf(t) === 0; })) n = 2;
      else if (texto.indexOf(t) !== -1 && texto.length < t.length * 4 + 40) n = 1;
      if (!n || !K.visivel(c)) continue;
      if (c.matches(INTER)) n += 3;
      if (n > nota || (n === nota && melhor && melhor.contains(c))) { melhor = c; nota = n; }
    }
    if (!melhor) return { erro: 'não achei nada escrito "' + alvo.texto + '" na página' };
    el = melhor;
  }
  /* o rótulo de um campo leva ao próprio campo */
  if (a.campo && el.tagName === 'LABEL' && el.control) el = el.control;
  if (a.rolar !== false) { try { el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' }); } catch (e) { el.scrollIntoView(); } }
  var r = el.getBoundingClientRect();
  var x = Math.round(r.left + Math.min(r.width / 2, Math.max(r.width - 4, 1)));
  var y = Math.round(r.top + r.height / 2);
  x = Math.max(1, Math.min(x, window.innerWidth - 2));
  y = Math.max(1, Math.min(y, window.innerHeight - 2));
  var topo = document.elementFromPoint(x, y);
  var coberto = topo && topo !== el && !el.contains(topo) && !(topo.closest && topo.closest('label') && topo.closest('label').control === el) ? K.seletorDe(topo) : null;
  return {
    seletor: K.seletorDe(el), rotulo: K.rotuloDe(el), tag: el.tagName.toLowerCase(), tipo: String(el.type || '').toLowerCase(),
    senha: K.ehSenha(el), x: x, y: y, caixa: K.caixa(el), coberto: coberto,
    editavel: !!(el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)),
    reduzido: !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)
  };
}

/* ---------- cursor do agente: seta na cor do agente + nome num vidro HUD; onda no clique ---------- */
function cursor(K, a) {
  var host = document.getElementById(K.ID_CURSOR);
  if (a.remover) { if (host) host.remove(); return { ok: true }; }
  if (a.esconder !== undefined) {
    if (host) host.style.display = a.esconder ? 'none' : '';
    /* o print da página inteira sai sem os contornos do Raio-X; depois eles voltam como estavam */
    Array.prototype.forEach.call(document.querySelectorAll(K.MARCA_RAIOX), function (el) {
      if (a.esconder) { if (!el.hasAttribute('data-babel-coop-display')) el.setAttribute('data-babel-coop-display', el.style.display || ''); el.style.display = 'none'; }
      else if (el.hasAttribute('data-babel-coop-display')) { el.style.display = el.getAttribute('data-babel-coop-display'); el.removeAttribute('data-babel-coop-display'); }
    });
    return { ok: true };
  }
  var reduzido = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var cor = /^#[0-9a-f]{3,8}$|^rgba?\([0-9., ]+\)$/i.test(a.cor || '') ? a.cor : '#2ad5e5';
  if (!host) {
    host = document.createElement('div');
    host.id = K.ID_CURSOR;
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'all:initial;position:fixed;left:0;top:0;width:0;height:0;z-index:2147483647;pointer-events:none;';
    var sr = host.attachShadow({ mode: 'open' });
    sr.innerHTML = '<style>' +
      ':host{all:initial}' +
      '.c{position:fixed;left:0;top:0;transform:translate(-100px,-100px);will-change:transform;transition:transform .28s cubic-bezier(.3,.7,.2,1),opacity .6s}' +
      '.c.sem{transition:none}' +
      '.c.calmo{opacity:.55}' +
      'svg{display:block;width:22px;height:22px;filter:drop-shadow(0 0 5px var(--cor)) drop-shadow(0 1px 1px rgba(0,0,0,.6))}' +
      '.n{position:absolute;left:18px;top:18px;white-space:nowrap;font:600 11px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.02em;color:#c3cfe5;' +
      'padding:5px 8px;border-radius:6px;background:rgba(6,11,22,.74);border:1px solid rgba(63,227,255,.22);' +
      'box-shadow:0 0 12px -4px var(--cor);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);' +
      'background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.04) 0 1px,transparent 1px 3px)}' +
      '.n b{color:var(--cor);font-weight:700}' +
      '.o{position:absolute;left:-14px;top:-14px;width:28px;height:28px;border-radius:50%;border:2px solid var(--cor);opacity:0;transform:scale(.4)}' +
      '.o.vai{animation:onda .6s ease-out}' +
      '.o.vai.quieta{animation:some .6s ease-out}' +
      '@keyframes onda{0%{opacity:.9;transform:scale(.4)}100%{opacity:0;transform:scale(1.7)}}' +
      '@keyframes some{0%{opacity:.9}100%{opacity:0}}' +
      '</style>' +
      '<div class="c sem"><i class="o"></i><svg viewBox="0 0 22 22"><path d="M3 2 L3 18 L7.5 13.8 L10.6 20.5 L13.4 19.2 L10.4 12.7 L16.5 12.4 Z" fill="var(--cor)" stroke="#060b16" stroke-width="1.3" stroke-linejoin="round"/></svg><span class="n"></span></div>';
    document.documentElement.appendChild(host);
  }
  var sr2 = host.shadowRoot;
  var c = sr2.querySelector('.c');
  var nome = sr2.querySelector('.n');
  c.style.setProperty('--cor', cor);
  nome.innerHTML = '';
  var b = document.createElement('b'); b.textContent = String(a.nome || 'agente').slice(0, 40); nome.appendChild(b);
  if (a.acao) nome.appendChild(document.createTextNode(' · ' + String(a.acao).slice(0, 40)));
  var x = Math.round(+a.x || 0), y = Math.round(+a.y || 0);
  host.style.display = '';
  if (!host.dataset.x && a.de) {
    c.classList.add('sem');
    c.style.transform = 'translate(' + Math.round(+a.de.x || 0) + 'px,' + Math.round(+a.de.y || 0) + 'px)';
    void c.offsetWidth;
  }
  if (reduzido) c.classList.add('sem'); else c.classList.remove('sem');
  c.classList.remove('calmo');
  c.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  host.dataset.x = x; host.dataset.y = y;
  if (a.clique) {
    var o = sr2.querySelector('.o');
    o.classList.remove('vai'); void o.offsetWidth;
    o.classList.toggle('quieta', reduzido);
    o.classList.add('vai');
    host.dataset.cliques = String((+host.dataset.cliques || 0) + 1);
  }
  clearTimeout(host.__calmo);
  host.__calmo = setTimeout(function () { c.classList.add('calmo'); }, 2600);
  return { ok: true, x: x, y: y, reduzido: reduzido };
}

/* ---------- campo: foca, seleciona o conteúdo (o texto novo substitui) e confere de novo a senha ---------- */
function prepararCampo(K, a) {
  var el = document.querySelector(a.seletor);
  if (!el) return { erro: 'o campo sumiu da página' };
  if (K.ehSenha(el)) return { senha: true };
  el.focus();
  if (el.select && /^(INPUT|TEXTAREA)$/.test(el.tagName)) { try { el.select(); } catch (e) { /* type=email e afins não aceitam select(): vale o setSelectionRange abaixo */ } }
  if (el.isContentEditable) { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  return { ok: true, focado: document.activeElement === el, valor: 'value' in el ? String(el.value) : K.limpo(el.innerText) };
}

function valorDe(K, a) {
  var el = document.querySelector(a.seletor);
  if (!el) return { erro: 'o campo sumiu da página' };
  if (K.ehSenha(el)) return { senha: true };
  return { valor: 'value' in el ? String(el.value) : String(el.innerText || ''), focado: document.activeElement === el };
}

/* último recurso quando o teclado não chega (página esquisita): valor pelo setter nativo + eventos input/change */
function definirValor(K, a) {
  var el = document.querySelector(a.seletor);
  if (!el) return { erro: 'o campo sumiu da página' };
  if (K.ehSenha(el)) return { senha: true };
  if (el.isContentEditable) { el.textContent = a.texto; }
  else {
    var proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    var d = Object.getOwnPropertyDescriptor(proto, 'value');
    if (d && d.set) d.set.call(el, a.texto); else el.value = a.texto;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return { valor: 'value' in el ? String(el.value) : String(el.innerText || '') };
}

/* <select>: escolhe a opção pelo texto ou pelo valor */
function escolher(K, a) {
  var el = document.querySelector(a.seletor);
  if (!el || el.tagName !== 'SELECT') return { erro: 'não é uma lista de escolha' };
  var alvo = K.limpo(a.texto).toLowerCase();
  var op = Array.prototype.find.call(el.options, function (o) { return K.limpo(o.text).toLowerCase() === alvo || String(o.value).toLowerCase() === alvo; }) ||
    Array.prototype.find.call(el.options, function (o) { return K.limpo(o.text).toLowerCase().indexOf(alvo) !== -1; });
  if (!op) return { erro: 'não achei a opção "' + a.texto + '"', opcoes: Array.prototype.map.call(el.options, function (o) { return K.limpo(o.text); }) };
  el.focus();
  el.value = op.value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return { valor: K.limpo(op.text) };
}

/* ---------- ler: a página em Markdown simples (títulos, parágrafos, links, listas, tabelas, formulários) ---------- */
function ler(K, a) {
  var MAX = a.max || 60000;
  var linhas = [];
  var total = 0;
  function add(s) { s = String(s || '').replace(/[ \t]+\n/g, '\n').trim(); if (!s || total > MAX) return; linhas.push(s); total += s.length + 2; }
  var BLOCOS = /^(DIV|SECTION|ARTICLE|MAIN|HEADER|FOOTER|NAV|ASIDE|UL|OL|LI|P|H[1-6]|FORM|TABLE|FIGURE|BLOCKQUOTE|DL|DT|DD|DETAILS|FIELDSET|PRE|HR|ADDRESS|DIALOG)$/;
  function inline(el) {
    var out = '';
    el.childNodes.forEach(function (n) {
      if (n.nodeType === 3) { out += n.nodeValue; return; }
      if (n.nodeType !== 1 || K.pular(n)) return;
      var tag = n.tagName;
      if (tag === 'A' && n.getAttribute('href')) { var t = K.limpo(n.innerText || n.textContent) || K.limpo(n.getAttribute('aria-label')); if (t) out += ' [' + t + '](' + n.href + ') '; return; }
      if (tag === 'BR') { out += '\n'; return; }
      if (tag === 'IMG') { var alt = K.limpo(n.alt); if (alt) out += ' ![' + alt + '](' + n.currentSrc + ') '; return; }
      if (tag === 'STRONG' || tag === 'B') { var f = K.limpo(inline(n)); if (f) out += ' **' + f + '** '; return; }
      if (tag === 'EM' || tag === 'I') { var e = K.limpo(inline(n)); if (e) out += ' *' + e + '* '; return; }
      if (tag === 'CODE') { out += ' `' + K.limpo(n.textContent) + '` '; return; }
      if (/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(tag)) return;
      out += inline(n);
    });
    return out;
  }
  function linha(el) { return K.limpo(inline(el).replace(/\n/g, ' \u2028 ')).replace(/ ?\u2028 ?/g, '\n'); }
  function campo(el) {
    var tag = el.tagName, tipo = String(el.type || '').toLowerCase();
    if (tipo === 'hidden' || !K.visivel(el)) return;
    var r = K.rotuloDe(el), s = K.seletorDe(el);
    if (tag === 'BUTTON' || /^(submit|button|reset|image)$/.test(tipo)) return add('- botão **' + r + '** `' + s + '`');
    if (K.ehSenha(el)) return add('- campo **' + r + '** (senha: só a pessoa digita) `' + s + '`');
    if (tag === 'SELECT') return add('- escolha **' + r + '**: ' + Array.prototype.map.call(el.options, function (o) { return (o.selected ? '(•) ' : '') + K.limpo(o.text); }).join(' | ') + ' `' + s + '`');
    if (tipo === 'checkbox' || tipo === 'radio') return add('- [' + (el.checked ? 'x' : ' ') + '] ' + r + ' `' + s + '`');
    add('- campo **' + r + '** (' + (tag === 'TEXTAREA' ? 'texto longo' : (tipo || 'texto')) + (el.required ? ', obrigatório' : '') + ')' + (el.value ? ': ' + String(el.value).slice(0, 200) : '') + ' `' + s + '`');
  }
  function tabela(t) {
    var rows = Array.prototype.slice.call(t.rows, 0, 60);
    rows.forEach(function (row, i) {
      add('| ' + Array.prototype.map.call(row.cells, function (c) { return K.limpo(c.innerText).replace(/\|/g, '/'); }).join(' | ') + ' |');
      if (i === 0) add('|' + Array.prototype.map.call(row.cells, function () { return ' --- '; }).join('|') + '|');
    });
  }
  function andar(el) {
    for (var i = 0; i < el.children.length; i++) {
      if (total > MAX) return;
      var c = el.children[i];
      if (K.pular(c) || !K.visivel(c)) continue;
      var tag = c.tagName;
      if (/^H[1-6]$/.test(tag)) { add('\n' + '######'.slice(0, +tag[1]) + ' ' + linha(c)); continue; }
      if (tag === 'P' || tag === 'FIGCAPTION' || tag === 'DT' || tag === 'DD' || tag === 'ADDRESS') { add(linha(c)); continue; }
      if (tag === 'BLOCKQUOTE') { add('> ' + linha(c)); continue; }
      if (tag === 'PRE') { add('```\n' + c.innerText.slice(0, 4000) + '\n```'); continue; }
      if (tag === 'LI') { var temBloco = Array.prototype.some.call(c.children, function (x) { return /^(UL|OL)$/.test(x.tagName); }); if (!temBloco) { add('- ' + linha(c)); continue; } }
      if (tag === 'TABLE') { tabela(c); continue; }
      if (tag === 'FORM') {
        add('\n**Formulário**' + (c.getAttribute('name') || c.id ? ' ' + (c.getAttribute('name') || c.id) : '') + ' `' + K.seletorDe(c) + '`');
        Array.prototype.forEach.call(c.querySelectorAll('input,select,textarea,button'), campo);
        continue;
      }
      if (/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(tag)) { campo(c); continue; }
      if (tag === 'A' && c.getAttribute('href')) { var t = K.limpo(c.innerText || c.textContent) || K.limpo(c.getAttribute('aria-label')); if (t) add('[' + t + '](' + c.href + ')'); continue; }
      if (tag === 'IMG') { var alt = K.limpo(c.alt); if (alt) add('![' + alt + '](' + c.currentSrc + ')'); continue; }
      if (tag === 'HR') { add('---'); continue; }
      var temFilhoBloco = Array.prototype.some.call(c.children, function (x) { return BLOCOS.test(x.tagName) || /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(x.tagName); });
      if (!temFilhoBloco) { var l = linha(c); if (l) add(l); continue; }
      /* texto solto dentro de um contêiner que também tem blocos */
      var solto = '';
      c.childNodes.forEach(function (n) { if (n.nodeType === 3) solto += n.nodeValue; });
      if (K.limpo(solto)) add(K.limpo(solto));
      andar(c);
    }
  }
  if (document.body) andar(document.body);
  var md = linhas.join('\n\n').replace(/\n{3,}/g, '\n\n');
  return { url: location.href, titulo: document.title, markdown: md.slice(0, MAX), cortado: total > MAX, caracteres: md.length };
}

/* ---------- raio-X (lado da página): DOM resumido e navegável, elemento, busca, fontes, cores, copy em ordem ---------- */
function raioX(K, a) {
  var MAXN = a.maxNos || 1500, MAXP = a.profundidade || 14, MAXF = 80;
  var cont = 0;
  /* partes: só o que a tela pediu (o painel da Rede não precisa varrer o DOM inteiro) */
  var quer = function (p) { return !a.partes || a.partes.indexOf(p) !== -1; };
  function textoDireto(el) { var s = ''; el.childNodes.forEach(function (n) { if (n.nodeType === 3) s += n.nodeValue; }); return K.limpo(s); }
  function no(el, sel, prof) {
    if (cont >= MAXN) return null;
    cont++;
    var o = { t: el.tagName.toLowerCase(), s: sel };
    if (el.id) o.id = el.id;
    var cl = K.limpo(el.getAttribute('class'));
    if (cl) o.c = cl.split(' ').slice(0, 4).join(' ');
    var tx = /^(SCRIPT|STYLE)$/.test(el.tagName) ? '' : textoDireto(el);
    if (tx) o.x = tx.slice(0, 80);
    var at = {};
    ['href', 'src', 'type', 'name', 'alt', 'role', 'rel', 'action', 'placeholder'].forEach(function (n) { var v = el.getAttribute(n); if (v) at[n] = String(v).slice(0, 160); });
    if (Object.keys(at).length) o.a = at;
    if (!/^(HTML|HEAD|BODY|SCRIPT|STYLE|META|LINK|TITLE)$/.test(el.tagName) && !K.visivel(el)) o.oculto = true;
    var filhos = Array.prototype.filter.call(el.children, function (c) { return !K.nosso(c); });
    if (filhos.length) {
      if (prof >= MAXP) o.mais = filhos.length;
      else {
        o.f = [];
        for (var i = 0; i < filhos.length && i < MAXF; i++) {
          var f = no(filhos[i], sel + ' > ' + filhos[i].tagName.toLowerCase() + ':nth-child(' + (Array.prototype.indexOf.call(el.children, filhos[i]) + 1) + ')', prof + 1);
          if (!f) { o.mais = filhos.length - i; break; }
          o.f.push(f);
        }
        if (filhos.length > MAXF && !o.mais) o.mais = filhos.length - MAXF;
      }
    }
    return o;
  }
  var saida = { url: location.href, titulo: document.title, idioma: document.documentElement.lang || '', dom: null, contagem: { elementos: document.getElementsByTagName('*').length } };
  if (a.dom !== false && quer('dom')) { saida.dom = document.body ? no(document.body, 'body', 0) : null; saida.contagem.noArvore = cont; }

  /* o elemento pedido: HTML (copiar bloco), caixa, atributos e os estilos computados que importam */
  if (a.seletor) {
    var el = null;
    try { el = document.querySelector(a.seletor); } catch (e) { saida.erroSeletor = 'seletor inválido'; }
    if (el) {
      var cs = getComputedStyle(el);
      var PROPS = ['display', 'position', 'width', 'height', 'margin', 'padding', 'border', 'border-radius', 'color', 'background-color', 'background-image', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-transform', 'text-align', 'opacity', 'box-shadow', 'text-shadow', 'z-index', 'flex-direction', 'justify-content', 'align-items', 'gap', 'grid-template-columns', 'transform', 'transition', 'cursor', 'overflow'];
      var estilos = {};
      /* só o que difere do padrão (o painel mostra o que o site escolheu, não o que o navegador já faz) */
      var flex = /flex|grid/.test(cs.display);
      var PADRAO = { position: 'static', opacity: '1', 'text-align': 'start', overflow: 'visible', 'text-transform': 'none', 'font-style': 'normal', cursor: 'auto', 'z-index': 'auto' };
      PROPS.forEach(function (p) {
        var v = cs.getPropertyValue(p);
        if (!v || v === 'none' || v === 'normal' || v === 'auto' || v === '0px' || v === 'rgba(0, 0, 0, 0)' || PADRAO[p] === v) return;
        if (p === 'transition' && /^all( 0s ease 0s)?$/.test(v)) return;
        if (p === 'border' && /^0px none/.test(v)) return;
        if (!flex && /^(flex-direction|justify-content|align-items|gap|grid-template-columns)$/.test(p)) return;
        estilos[p] = v;
      });
      estilos.color = cs.color; estilos['font-family'] = cs.fontFamily; estilos['font-size'] = cs.fontSize; estilos.display = cs.display;
      var atributos = {};
      Array.prototype.forEach.call(el.attributes, function (x) { atributos[x.name] = String(x.value).slice(0, 300); });
      if (K.ehSenha(el) && 'value' in atributos) atributos.value = '[senha: não mostro]';
      var html = el.outerHTML;
      saida.elemento = {
        seletor: K.seletorDe(el), tag: el.tagName.toLowerCase(), rotulo: K.rotuloDe(el), texto: K.limpo(el.innerText || el.textContent).slice(0, 600),
        html: html.slice(0, 20000), htmlCortado: html.length > 20000, caixa: K.caixa(el), atributos: atributos, estilos: estilos,
        cores: { texto: K.hex(cs.color), fundo: K.hex(cs.backgroundColor), borda: parseFloat(cs.borderTopWidth) > 0 ? K.hex(cs.borderTopColor) : null },
        senha: K.ehSenha(el), filhos: el.children.length
      };
    } else if (!saida.erroSeletor) saida.erroSeletor = 'não achei "' + a.seletor + '" na página';
  }

  /* busca no DOM vivo: por seletor CSS ou por texto (no texto e nos atributos) */
  if (a.busca) {
    var achados = [];
    var termo = K.limpo(a.busca).toLowerCase();
    var porSeletor = null;
    try { porSeletor = document.querySelectorAll(a.busca); } catch (e) { porSeletor = null; }
    if (porSeletor && porSeletor.length) {
      Array.prototype.slice.call(porSeletor, 0, 50).forEach(function (el) { if (!K.nosso(el)) achados.push({ s: K.seletorDe(el), t: el.tagName.toLowerCase(), trecho: K.limpo(el.innerText || el.textContent).slice(0, 120), modo: 'seletor' }); });
    } else if (termo) {
      var todos = document.body ? document.body.querySelectorAll('*') : [];
      for (var i = 0; i < todos.length && achados.length < 50; i++) {
        var c = todos[i];
        if (K.pular(c)) continue;
        var direto = textoDireto(c), td = direto.toLowerCase();
        var noAtributo = Array.prototype.some.call(c.attributes, function (x) { return String(x.value).toLowerCase().indexOf(termo) !== -1; });
        if (td.indexOf(termo) !== -1 || noAtributo) achados.push({ s: K.seletorDe(c), t: c.tagName.toLowerCase(), trecho: (direto || c.outerHTML.slice(0, 120)).slice(0, 120), modo: td.indexOf(termo) !== -1 ? 'texto' : 'atributo' });
      }
    }
    saida.busca = { termo: a.busca, achados: achados };
  }

  if (!quer('fontes') && !quer('cores') && !quer('copy')) return saida;
  /* fontes: declaradas (@font-face / document.fonts), usadas (font-family computada no texto visível) */
  var declaradas = [];
  if (document.fonts) document.fonts.forEach(function (f) { declaradas.push({ familia: String(f.family).replace(/^["']|["']$/g, ''), peso: f.weight, estilo: f.style, status: f.status }); });
  var fontesCss = [];
  Array.prototype.forEach.call(document.styleSheets, function (sh) {
    var regras; try { regras = sh.cssRules; } catch (e) { return; }
    Array.prototype.forEach.call(regras || [], function (r) { if (r.type === 5) fontesCss.push({ familia: String(r.style.getPropertyValue('font-family')).replace(/^["']|["']$/g, ''), src: r.style.getPropertyValue('src').slice(0, 400), folha: sh.href || '(estilo na página)' }); });
  });
  var usadas = {}, cores = {}, vistos = 0;
  function cor(c, uso) { var h = K.hex(c); if (!h) return; var r = cores[h] || (cores[h] = { cor: h, vezes: 0, uso: {} }); r.vezes++; r.uso[uso] = 1; }
  var elementos = document.body ? document.body.querySelectorAll('*') : [];
  for (var j = 0; j < elementos.length && vistos < 4000; j++) {
    var e2 = elementos[j];
    if (K.pular(e2) && e2.tagName !== 'svg' && !(e2.closest && e2.closest('svg') && !K.nosso(e2))) continue;
    if (!K.visivel(e2)) continue;
    vistos++;
    var s2 = getComputedStyle(e2);
    var temTexto = !!textoDireto(e2);
    if (temTexto) { var fam = s2.fontFamily; usadas[fam] = (usadas[fam] || 0) + 1; cor(s2.color, 'texto'); }
    cor(s2.backgroundColor, 'fundo');
    if (parseFloat(s2.borderTopWidth) > 0 && s2.borderTopStyle !== 'none') cor(s2.borderTopColor, 'borda');
    if (e2.closest && e2.closest('svg')) { cor(s2.fill, 'svg'); if (s2.stroke && s2.stroke !== 'none') cor(s2.stroke, 'svg'); }
  }
  if (document.body) { var sb = getComputedStyle(document.body); cor(sb.backgroundColor, 'fundo da página'); }
  saida.fontes = {
    declaradas: declaradas.slice(0, 60),
    css: fontesCss.slice(0, 60),
    usadas: Object.keys(usadas).map(function (k) { return { familia: k, elementos: usadas[k] }; }).sort(function (x, y) { return y.elementos - x.elementos; }).slice(0, 30)
  };
  saida.cores = Object.keys(cores).map(function (k) { var c = cores[k]; return { cor: c.cor, vezes: c.vezes, uso: Object.keys(c.uso) }; }).sort(function (x, y) { return y.vezes - x.vezes; }).slice(0, 40);

  /* copy em ordem de leitura */
  if (quer('copy')) saida.copy = K.blocosDeTexto(a.maxCopy || 800).map(function (b) { return { tag: b.tag, tipo: b.tipo, texto: b.texto.slice(0, 1000) }; });
  return saida;
}

/* ---------- copy.md: textos por seção (h1/h2/h3 abrem seção; o resto entra embaixo, na ordem) ---------- */
function copy(K, a) {
  var blocos = K.blocosDeTexto(4000);
  var linhas = [];
  var secoes = 0;
  blocos.forEach(function (b) {
    if (b.tag === 'h1') { linhas.push('', '# ' + b.texto, ''); secoes++; return; }
    if (b.tag === 'h2') { linhas.push('', '## ' + b.texto, ''); secoes++; return; }
    if (b.tag === 'h3') { linhas.push('', '### ' + b.texto, ''); secoes++; return; }
    if (/^h[4-6]$/.test(b.tag)) { linhas.push('**' + b.texto + '**', ''); return; }
    if (b.tipo === 'botao') { linhas.push('**[' + b.texto + ']**', ''); return; }
    if (b.tipo === 'item') { linhas.push('- ' + b.texto); return; }
    if (b.tipo === 'rotulo') { linhas.push('*' + b.texto + '*', ''); return; }
    linhas.push(b.texto, '');
  });
  return { url: location.href, titulo: document.title, secoes: secoes, blocos: blocos.length, corpo: linhas.join('\n').replace(/\n{3,}/g, '\n\n').trim() };
}

/* ---------- serializar para clonar: HTML vivo com os recursos marcados (__BCRES_n__) para o Node trocar por arquivos locais ---------- */
function serializar(K, a) {
  var base = document.baseURI;
  var recursos = [], idx = {};
  function abs(u, b) { try { return new URL(u, b || base).href; } catch (e) { return null; } }
  function marca(u, tipo, b) {
    var x = abs(u, b);
    if (!x || /^(data:|blob:|javascript:|about:|mailto:|tel:)/i.test(x)) return u;
    x = x.split('#')[0];
    if (!(x in idx)) { idx[x] = recursos.length; recursos.push({ url: x, tipo: tipo }); }
    return '__BCRES_' + idx[x] + '__';
  }
  function css(texto, b) {
    return String(texto || '')
      .replace(/@import\s+(['"])([^'"]+)\1/g, function (m, q, u) { return '@import url("' + marca(u, 'css', b) + '")'; })
      .replace(/url\(\s*(['"]?)([^'")]+?)\1\s*\)/g, function (m, q, u) { if (/^(data:|#)/i.test(u.trim())) return m; return 'url("' + marca(u.trim(), 'css-url', b) + '")'; });
  }
  function textoDaFolha(sh) { try { return Array.prototype.map.call(sh.cssRules, function (r) { return r.cssText; }).join('\n'); } catch (e) { return ''; } }
  function srcset(v) { return String(v || '').split(',').map(function (parte) { var p = parte.trim().split(/\s+/); if (!p[0]) return ''; p[0] = marca(p[0], 'imagem'); return p.join(' '); }).filter(Boolean).join(', '); }

  var doc = document.documentElement.cloneNode(true);
  /* pares original ↔ cópia na mesma ordem (a cópia é profunda): lê o que só existe no original (currentSrc, CSSOM) */
  var origImgs = document.querySelectorAll('img'), copImgs = doc.querySelectorAll('img');
  for (var i = 0; i < copImgs.length; i++) {
    var oi = origImgs[i], ci = copImgs[i];
    var atual = oi && (oi.currentSrc || oi.src);
    if (atual) ci.setAttribute('src', marca(atual, 'imagem'));
    else if (ci.getAttribute('data-src')) ci.setAttribute('src', marca(ci.getAttribute('data-src'), 'imagem'));
    if (ci.getAttribute('srcset')) ci.setAttribute('srcset', srcset(ci.getAttribute('srcset')));
  }
  var origStyles = document.querySelectorAll('style'), copStyles = doc.querySelectorAll('style');
  for (var s = 0; s < copStyles.length; s++) {
    var os = origStyles[s], cst = copStyles[s];
    var texto = cst.textContent;
    /* CSS-em-JS (styled-components, emotion) põe as regras direto no CSSOM e deixa o <style> vazio */
    if (os && os.sheet && (!K.limpo(texto) || os.sheet.cssRules.length > 0 && K.limpo(texto).length < 8)) texto = textoDaFolha(os.sheet);
    cst.textContent = css(texto);
  }
  if (document.adoptedStyleSheets && document.adoptedStyleSheets.length) {
    var extra = document.createElement('style');
    extra.setAttribute('data-babel-coop', 'folhas-adotadas');
    extra.textContent = css(document.adoptedStyleSheets.map(textoDaFolha).join('\n'));
    (doc.querySelector('head') || doc).appendChild(extra);
  }
  /* o que não vai para o clone: scripts (a cópia é estática e editável), o cursor do agente, <base>, CSP, pré-carga de script */
  Array.prototype.forEach.call(doc.querySelectorAll('script,#' + K.ID_CURSOR + ',' + K.MARCA_RAIOX + ',base,meta[http-equiv="Content-Security-Policy" i],link[rel=modulepreload],link[rel=preload][as=script],link[rel=prefetch],link[rel=dns-prefetch],link[rel=preconnect]'), function (el) { el.remove(); });
  Array.prototype.forEach.call(doc.querySelectorAll('*'), function (el) {
    Array.prototype.slice.call(el.attributes).forEach(function (at) {
      var n = at.name.toLowerCase();
      if (/^on/.test(n)) el.removeAttribute(at.name);                                  /* eventos inline: nada executa na cópia */
      else if ((n === 'href' || n === 'src' || n === 'action' || n === 'formaction') && /^\s*javascript:/i.test(at.value)) el.setAttribute(at.name, '#');
      else if (n === 'integrity' || n === 'nonce') el.removeAttribute(at.name);        /* o CSS reescrito não bate mais com o hash */
    });
  });
  Array.prototype.forEach.call(doc.querySelectorAll('link[href]'), function (l) {
    var rel = String(l.getAttribute('rel') || '').toLowerCase();
    if (/stylesheet/.test(rel)) l.setAttribute('href', marca(l.getAttribute('href'), 'css'));
    else if (/icon|apple-touch-icon|mask-icon|manifest/.test(rel)) l.setAttribute('href', marca(l.getAttribute('href'), 'icone'));
    else if (rel === 'preload') { var as = String(l.getAttribute('as') || ''); if (/font|image|style/.test(as)) l.setAttribute('href', marca(l.getAttribute('href'), as === 'style' ? 'css' : as === 'font' ? 'fonte' : 'imagem')); }
    l.removeAttribute('crossorigin');
  });
  Array.prototype.forEach.call(doc.querySelectorAll('source[src],source[srcset],video[poster],video[src],audio[src],input[type=image][src],track[src]'), function (el) {
    if (el.getAttribute('src')) el.setAttribute('src', marca(el.getAttribute('src'), 'midia'));
    if (el.getAttribute('srcset')) el.setAttribute('srcset', srcset(el.getAttribute('srcset')));
    if (el.getAttribute('poster')) el.setAttribute('poster', marca(el.getAttribute('poster'), 'imagem'));
  });
  Array.prototype.forEach.call(doc.querySelectorAll('image[href],use[href],image'), function (el) {
    var h = el.getAttribute('href') || el.getAttribute('xlink:href');
    if (h && !/^#/.test(h)) { var m = marca(h, 'imagem'); el.setAttribute('href', m); if (el.hasAttribute('xlink:href')) el.setAttribute('xlink:href', m); }
  });
  Array.prototype.forEach.call(doc.querySelectorAll('[style]'), function (el) { var st = el.getAttribute('style'); if (/url\(/i.test(st)) el.setAttribute('style', css(st)); });
  /* links e formulários continuam apontando para o site original (endereço completo) */
  Array.prototype.forEach.call(doc.querySelectorAll('a[href]'), function (el) { var h = el.getAttribute('href'); if (h && !/^#/.test(h) && !/^__BCRES_/.test(h)) { var x = abs(h); if (x) el.setAttribute('href', x); } });
  Array.prototype.forEach.call(doc.querySelectorAll('form[action]'), function (el) { var x = abs(el.getAttribute('action')); if (x) el.setAttribute('action', x); });
  Array.prototype.forEach.call(doc.querySelectorAll('iframe[src]'), function (el) { var x = abs(el.getAttribute('src')); if (x) el.setAttribute('src', x); });
  /* valores que a pessoa ou o agente digitaram não vão para a cópia (dado pessoal); senha nunca */
  Array.prototype.forEach.call(doc.querySelectorAll('input[type=password]'), function (el) { el.removeAttribute('value'); });
  var dt = document.doctype ? '<!DOCTYPE ' + document.doctype.name + '>' : '<!DOCTYPE html>';
  return { html: dt + '\n' + doc.outerHTML, recursos: recursos, titulo: document.title, url: location.href };
}

/* seletor a partir de um nó que a pessoa escolheu no modo inspeção (roda com this = elemento, via Runtime.callFunctionOn) */
function seletorDoNo() {
  /* eslint-disable-next-line no-undef */
  var K = (KIT)();
  var el = this && this.nodeType === 1 ? this : (this && this.parentElement);
  return el ? { seletor: K.seletorDe(el), tag: el.tagName.toLowerCase(), rotulo: K.rotuloDe(el) } : null;
}

/* ---------- DOM vivo serializado (navegador_codigo com url "dom"): como está agora, depois do JavaScript da página,
   sem o cursor e os contornos do babel-coop e sem valor em campo de senha (o clone guarda atributos, nunca o que foi digitado) ---------- */
function domVivo(K, a) {
  var raiz = document.documentElement.cloneNode(true);
  Array.prototype.forEach.call(raiz.querySelectorAll('#' + K.ID_CURSOR + ',' + K.MARCA_RAIOX), function (el) { el.remove(); });
  Array.prototype.forEach.call(raiz.querySelectorAll('input'), function (el) { if (K.ehSenha(el)) el.removeAttribute('value'); });
  var dt = document.doctype ? '<!DOCTYPE ' + document.doctype.name + '>\n' : '';
  var html = dt + raiz.outerHTML, max = a.max || 100000;
  return { url: location.href, titulo: document.title, bytes: html.length, cortado: html.length > max, html: html.slice(0, max) };
}

/* ---------- rolar (navegador_rolar): N pixels, topo ou fim; com a.so só lê a posição (o elemento é o localizar que rola) ---------- */
function rolar(K, a) {
  var antes = Math.round(window.scrollY);
  if (!a.so) {
    if (a.pixels != null) window.scrollBy(0, +a.pixels || 0);
    else if (a.para === 'fim') window.scrollTo(0, document.documentElement.scrollHeight);
    else if (a.para === 'topo') window.scrollTo(0, 0);
  }
  var y = Math.round(window.scrollY), alt = document.documentElement.scrollHeight, jan = window.innerHeight;
  return { antes: antes, y: y, altura: alt, janela: jan, noFim: y + jan >= alt - 2, noTopo: y <= 0 };
}

/* ---------- esperar (navegador_esperar): uma olhada; quem repete até o prazo é o processo principal ---------- */
function achou(K, a) {
  if (a.seletor) {
    var el;
    try { el = document.querySelector(a.seletor); } catch (e) { return { erro: 'seletor inválido: ' + a.seletor }; }
    return { achou: !!(el && K.visivel(el)), existe: !!el, rotulo: el ? K.rotuloDe(el) : null };
  }
  var t = K.limpo(a.texto).toLowerCase();
  return { achou: !!t && K.limpo(document.body ? document.body.innerText : '').toLowerCase().indexOf(t) !== -1 };
}

/* ---------- foco (navegador_teclas): onde está o foco da página; campo de senha é a vez da pessoa ---------- */
function foco(K, a) {
  var el = document.activeElement;
  while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
  if (!el || el === document.body || el === document.documentElement) return { tag: 'body', senha: false };
  var r = el.getBoundingClientRect();
  return { tag: el.tagName.toLowerCase(), seletor: K.seletorDe(el), rotulo: K.rotuloDe(el), senha: K.ehSenha(el), x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), caixa: K.caixa(el) };
}

/* ---------- armazenamento (navegador_armazenamento): localStorage e sessionStorage da página.
   Nunca devolve senha: chave com cara de senha fica "[redigido]", e valor igual ao que está num campo de senha da página
   (comparado aqui dentro, o campo nunca sai) também; a.valores = os cookies, conferidos da mesma forma. ---------- */
function armazenamento(K, a) {
  var PARECE = /(senha|password|passwd|pwd|secret|segredo)/i;
  var senhas = Array.prototype.filter.call(document.querySelectorAll('input'), function (el) { return K.ehSenha(el) && el.value && el.value.length >= 3; }).map(function (el) { return el.value; });
  function temSenha(v) { v = String(v == null ? '' : v); return senhas.some(function (s) { return v.indexOf(s) !== -1; }); }
  function ler(st) {
    var l = [];
    try {
      for (var i = 0; i < st.length && l.length < 200; i++) {
        var k = st.key(i), v = String(st.getItem(k));
        l.push({ chave: k, valor: PARECE.test(k) || temSenha(v) ? '[redigido]' : v.slice(0, 4000), bytes: v.length });
      }
    } catch (e) { return { erro: String(e && e.message || e) }; }
    return l;
  }
  var cookiesComSenha = [];
  (a.valores || []).forEach(function (v, i) { if (temSenha(v)) cookiesComSenha.push(i); });
  return { origem: location.origin, local: ler(window.localStorage), sessao: ler(window.sessionStorage), cookiesComSenha: cookiesComSenha };
}

module.exports = { kit, localizar, cursor, prepararCampo, valorDe, definirValor, escolher, ler, raioX, copy, serializar, seletorDoNo, domVivo, rolar, achou, foco, armazenamento };
