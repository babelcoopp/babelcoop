/* babel-coop · o navegador próprio na tela: a aba "Navegador · <agente>" com um <webview> de verdade e o Raio-X ao lado
   Contrato: .deus/terminal-ao-vivo/PROTOCOLO.md §9 (navegador próprio) e §11 (HUD) · UX.md "Navegador do agente" · CHECKLIST §3.
   Carregado pelo servidor depois de ponte.js e organismo.js (lista INJETAR). JS puro, sem módulos.

   O que esta peça faz:
   - troca a simulação do protótipo (prototipo/navegador.js) pelo navegador real quando a página vem do servidor da Estação
     (window.COOP_REAL) e roda no app (window.coopElectron). Nenhum Google Chrome: a página abre num <webview> do próprio
     Electron, partição persist:navegador-<pessoa>, sem Node e sem acesso ao disco.
   - a aba do meio: barra de endereço (só leitura enquanto o agente controla), faixa "controlado por <agente> · você vê tudo"
     ou "você está no controle", Assumir e Devolver, cursor do agente, lista de passos embaixo.
   - o Raio-X ao lado: HTML (DOM vivo em árvore, busca, copiar bloco), CSS (estilos do elemento, fontes, cores), Copy
     (textos em ordem, exportar Markdown), Rede, Console e "Selecionar elemento".
   - o clone aberto como site editável na Estação (Site | Código), lido e gravado pelo servidor da Estação (/api/arquivo).
   - sem Electron (celular, iPad): um aviso curto, "navegador só no app".

   Com o módulo do processo principal (window.coopElectron.navegador, PROTOCOLO §9) a peça registra cada webview, recebe os
   passos do agente, avisa Assumir/Devolver e usa Rede, clonar, copy e print de lá. Sem ele, a própria tela lê a página
   (executeJavaScript no webview) e o console (evento console-message): o Raio-X funciona igual, com a Rede medida pela
   própria página (Resource Timing).

   Organismo (BC.organismo): a faixa e a moldura acendem a cada passo e esfriam pela meia-vida; a varredura cruza a página
   quando o agente age (metáfora: o agente lendo a página); no DOM vivo, a linha que mudou acende. prefers-reduced-motion:
   nada se move, só a cor muda. HUD do Babel OS (vidro, borda ciano, scanlines a 3,5 %) só enquanto o agente controla.

   Segurança: tudo que vem da página vira texto (textContent), nunca HTML da Estação; o clone abre num iframe com sandbox sem
   allow-same-origin; a barra de endereço só aceita http(s).
*/
(function () {
  'use strict';
  var BC = window.BC = window.BC || {};
  if (!window.COOP_REAL) return;                      /* protótipo puro: a simulação de prototipo/navegador.js continua */
  if (BC.navegadorReal) return;                       /* já carregado nesta página */
  if (!BC.estacao || !BC.vistas) return;

  var E = BC.estacao;
  var NOME_APP = 'babel-coop';
  var ELETRON = !!window.coopElectron;
  /* o Electron define <webview> um pouco depois dos scripts da página (o INJETAR roda antes do load): confere na hora do uso */
  function webviewLigado() { return ELETRON && !!(window.customElements && window.customElements.get && window.customElements.get('webview')); }
  var S = {};            /* sessões do navegador, por id do agente */
  var C = {};            /* clones abertos, por 'clone:<pasta>' */
  var ouvintes = [];     /* quem acompanha os passos (testes, presença local) */

  /* ================================================================== utilidades */
  function O() { return BC.organismo || null; }
  function L() { return BC.loja; }
  function eu() { var r = BC.real && BC.real.eu && BC.real.eu(); return (r && r.id) || (L() && L().eu) || 'eu'; }
  function dois(n) { return (n < 10 ? '0' : '') + n; }
  function hora(ms) { var d = new Date(ms || Date.now()); return dois(d.getHours()) + ':' + dois(d.getMinutes()); }
  function horaSeg(ms) { var d = new Date(ms || Date.now()); return hora(ms) + ':' + dois(d.getSeconds()); }
  function aviso(t) { try { if (E.aviso) E.aviso(t); } catch (e) { /* sem toast */ } }
  function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function guardar(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento: vale nesta página */ } }
  function kb(n) { n = +n || 0; if (n < 1024) return n + ' B'; if (n < 1048576) return (n / 1024).toFixed(n < 10240 ? 1 : 0).replace('.', ',') + ' KB'; return (n / 1048576).toFixed(1).replace('.', ',') + ' MB'; }
  function iniciais(nome) { var p = String(nome || '?').trim().split(/\s+/); return ((p[0] || '?')[0] + (p[1] ? p[1][0] : (p[0] || '')[1] || '')).toUpperCase(); }
  function hostDe(url) { try { return new URL(url).host.toLowerCase(); } catch (e) { return ''; } }
  /* o mesmo nome de pasta que navegador/clonar.js (nomeDoSite) usa: Clones/<site>/ é um lugar só, venha do agente ou da pessoa */
  function pastaDoSite(url) {
    var host = '';
    try { var u = new URL(url); host = u.protocol === 'file:' ? 'arquivo-local' : u.host; } catch (e) { host = ''; }
    return (host || 'pagina').toLowerCase().replace(/[^a-z0-9.-]+/g, '_').replace(/^[._]+|[._]+$/g, '').slice(0, 80) || 'pagina';
  }
  function urlSegura(t) {
    t = String(t || '').trim();
    if (!t) return null;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(t)) t = (/^(localhost|127\.|\[::1\])/i.test(t) ? 'http://' : 'https://') + t;
    try { var u = new URL(t); return /^https?:$/.test(u.protocol) ? u.href : null; } catch (e) { return null; }
  }

  /* monta elementos sem nunca interpretar texto da página como HTML */
  function h(tag, props, filhos) {
    var el = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k === 'dataset') Object.keys(v).forEach(function (d) { el.dataset[d] = v[d]; });
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : String(v));
    });
    (filhos || []).forEach(function (f) { if (f == null || f === false) return; el.appendChild(typeof f === 'string' ? document.createTextNode(f) : f); });
    return el;
  }
  function svg(markup) { var s = document.createElement('span'); s.className = 'navr-ic'; s.innerHTML = markup; return s; } /* só desenhos fixos deste arquivo */
  var IC = {
    cadeado: '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><rect x="3.2" y="7" width="9.6" height="6.6" rx="1.4"/><path d="M5.4 7V5.2a2.6 2.6 0 0 1 5.2 0V7"/></svg>',
    globo: '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c2 2.2 2 9.8 0 12M8 2c-2 2.2-2 9.8 0 12"/></svg>',
    voltar: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3.5 5.5 8l4.5 4.5"/></svg>',
    avancar: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 3.5 4.5 4.5L6 12.5"/></svg>',
    recarregar: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M13 8a5 5 0 1 1-1.6-3.7"/><path d="M13 2.8v2.8h-2.8"/></svg>',
    mira: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="8" cy="8" r="4.6"/><path d="M8 1.2v3M8 11.8v3M1.2 8h3M11.8 8h3"/></svg>',
    raio: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="1.8" y="2.6" width="12.4" height="10.8" rx="1.6"/><path d="M9.6 2.6v10.8M11.4 5.4h1.2M11.4 7.6h1.2M11.4 9.8h1.2"/></svg>',
    cursor: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M4.2 3.2 18.6 11l-6.1 1.9-3.2 6.4z" fill="var(--navr-cor,#2ad5e5)" stroke="#060b16" stroke-width="1.4" stroke-linejoin="round"/></svg>'
  };

  /* ================================================================== o módulo do processo principal (NAV-MAIN), se existir */
  function api() { var c = window.coopElectron; return c && c.navegador ? c.navegador : null; }
  function temApi(nome) { var a = api(); return !!(a && typeof a[nome] === 'function'); }
  function chamar(nome, args) {
    var a = api();
    if (!a || typeof a[nome] !== 'function') return Promise.reject(new Error('sem ' + nome));
    try { return Promise.resolve(a[nome].apply(a, args || [])); } catch (e) { return Promise.reject(e); }
  }
  /* assina o primeiro nome de evento que o preload expuser */
  function assinar(nomes, fn) {
    var a = api();
    if (!a) return false;
    for (var i = 0; i < nomes.length; i++) if (typeof a[nomes[i]] === 'function') { try { a[nomes[i]](fn); return true; } catch (e) { /* tenta o próximo */ } }
    return false;
  }
  function idAgente(x) { if (x == null) return null; if (typeof x === 'string' || typeof x === 'number') return String(x); return x.id != null ? String(x.id) : x.agente != null ? idAgente(x.agente) : x.agenteId != null ? String(x.agenteId) : null; }

  /* quem é o agente: nome e cor vêm do que chegou, dos agentes da pessoa (L.estado) ou dos terminais do servidor */
  function agenteDe(x) {
    var id = idAgente(x) || 'navegador';
    var ag = { id: id, nome: null, cor: null, dono: null };
    if (x && typeof x === 'object') { ag.nome = x.nome || (x.agente && x.agente.nome) || null; if (ag.nome === id) ag.nome = null; /* o módulo principal repete o id quando não sabe o nome */ ag.cor = x.cor || (x.agente && x.agente.cor) || null; ag.dono = x.dono || (x.agente && x.agente.dono) || null; }
    var p = L() && L().pessoa ? L().pessoa(eu()) : null;
    var lista = (p && p.agentes) || [];
    for (var i = 0; i < lista.length; i++) {
      var a = lista[i];
      if (String(a.id) === id || (a.nome && String(a.nome).toLowerCase() === id.toLowerCase())) { ag.nome = ag.nome || a.nome; ag.cor = ag.cor || a.cor; break; }
    }
    var bv = BC.real && BC.real.bemvindo;
    if (!ag.nome && bv && bv.terminais) bv.terminais.forEach(function (t) { if (t && String(t.id) === id && t.nome) ag.nome = t.nome; });
    if (!ag.nome) ag.nome = id === 'navegador' ? 'Navegador' : id.charAt(0).toUpperCase() + id.slice(1);
    if (!ag.cor) ag.cor = (p && p.cor) || '#2ad5e5';
    if (!/^#[0-9a-f]{3,8}$|^rgba?\([0-9., ]+\)$/i.test(String(ag.cor))) ag.cor = '#2ad5e5'; /* a cor vai para um estilo: só cor de verdade */
    ag.dono = ag.dono || eu();
    return ag;
  }
  function corDaPessoa() { var p = L() && L().pessoa ? L().pessoa(eu()) : null; return (p && p.cor) || '#7dbdfa'; }

  /* ================================================================== o programa que roda DENTRO da página (executeJavaScript)
     Sem nada de fora: é serializado com toString. Só lê a página; os únicos efeitos visíveis são o contorno de "Selecionar
     elemento" e o destaque de um nó, marcados para o DOM vivo não contá-los como mudança da página. */
  function PROGRAMA_PAGINA() {
    var V = 5;
    if (window.__coopRaio && window.__coopRaio.v === V) return window.__coopRaio;
    var MARCA = '__coopRaioX';
    var R = { v: V, seq: 0, mapa: new WeakMap(), refs: new Map(), mut: 0, mudados: [], sel: null };
    var SECAO = /^(HEADER|NAV|MAIN|SECTION|ARTICLE|ASIDE|FOOTER|FORM)$/;
    var PROPS = ['display', 'position', 'box-sizing', 'width', 'height', 'margin', 'padding', 'border', 'border-radius', 'color', 'background-color', 'background-image',
      'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-align', 'text-transform', 'text-decoration-line', 'gap', 'flex-direction', 'justify-content',
      'align-items', 'grid-template-columns', 'opacity', 'z-index', 'box-shadow', 'transform', 'transition', 'cursor'];
    var SEMPRE = { display: 1, color: 1, 'background-color': 1, 'font-family': 1, 'font-size': 1, 'font-weight': 1, 'line-height': 1, width: 1, height: 1 };
    function nosso(n) { return !!(n && (n[MARCA] || n.id === '__babel-coop-cursor' || (n.hasAttribute && n.hasAttribute('data-babel-coop-raiox')))); }
    function marcar(el) { el[MARCA] = 1; el.setAttribute('data-babel-coop-raiox', ''); return el; } /* o contorno daqui e o cursor do agente (navegador/pagina.js) não são a página */
    function id(n) { var i = R.mapa.get(n); if (!i) { i = ++R.seq; R.mapa.set(n, i); R.refs.set(i, new WeakRef(n)); } return i; }
    function no(i) { var r = R.refs.get(+i); var n = r && r.deref(); return n && n.isConnected ? n : null; }
    function corta(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) + '…' : s; }
    function limpa(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
    function classes(el) { var c = typeof el.className === 'string' ? el.className : (el.getAttribute && el.getAttribute('class')) || ''; return c.trim().split(/\s+/).filter(Boolean); }
    function rotulo(el) {
      if (!el || el.nodeType !== 1) return '#texto';
      var s = el.nodeName.toLowerCase();
      if (el.id) s += '#' + el.id;
      var c = classes(el).slice(0, 3);
      if (c.length) s += '.' + c.join('.');
      return s;
    }
    function visivel(el) {
      if (!el.getClientRects || !el.getClientRects().length) return false;
      var cs = getComputedStyle(el);
      return cs.visibility !== 'hidden' && cs.display !== 'none';
    }
    function seletor(el) {
      if (el && el.nodeType !== 1) el = el.parentElement;
      var partes = [];
      while (el && el.nodeType === 1 && el !== document.documentElement) {
        if (el.id && /^[A-Za-z][\w-]*$/.test(el.id) && document.querySelectorAll('#' + el.id).length === 1) { partes.unshift('#' + el.id); break; }
        var p = el.parentElement, s = el.nodeName.toLowerCase();
        if (p) {
          var irmaos = [].filter.call(p.children, function (x) { return x.nodeName === el.nodeName; });
          if (irmaos.length > 1) s += ':nth-of-type(' + (irmaos.indexOf(el) + 1) + ')';
        }
        partes.unshift(s);
        el = p;
      }
      return partes.join(' > ') || 'html';
    }
    function contaFilhos(n) { var k = 0; for (var c = n.firstChild; c; c = c.nextSibling) if ((c.nodeType === 1 && !nosso(c)) || (c.nodeType === 3 && c.nodeValue.trim())) k++; return k; }
    function resumo(n) {
      if (n.nodeType === 3) return { i: id(n), x: corta(limpa(n.nodeValue), 160) };
      var a = [], at = n.attributes || [];
      for (var k = 0; k < at.length && k < 14; k++) a.push([at[k].name, corta(at[k].value, 90)]);
      var o = { i: id(n), t: n.nodeName.toLowerCase(), a: a, n: contaFilhos(n) };
      if (o.n === 1 && !n.firstElementChild) { o.x = corta(limpa(n.textContent), 160); o.n = 0; }
      if (n.shadowRoot) o.sombra = 1;
      return o;
    }
    function caminhoRotulos(el) { var r = [], a = el.parentElement; while (a && a !== document.documentElement && r.length < 4) { r.unshift(rotulo(a)); a = a.parentElement; } return r.join(' › '); }
    function hex(c) {
      var m = /rgba?\(([^)]+)\)/.exec(c);
      if (!m) return c;
      var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
      var s = '#' + [p[0], p[1], p[2]].map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join('');
      if (p.length > 3 && p[3] < 1) s += ('0' + Math.round(p[3] * 255).toString(16)).slice(-2);
      return s;
    }
    function transparente(c) { return !c || c === 'transparent' || /rgba\([^)]*[,\/]\s*0\)$/.test(c); }

    try {
      new MutationObserver(function (lista) {
        var conta = 0;
        for (var k = 0; k < lista.length; k++) {
          var r = lista[k], alvo = r.target;
          if (nosso(alvo) || (alvo.parentNode && nosso(alvo.parentNode))) continue;
          if (r.type === 'childList') {
            var so = r.addedNodes.length + r.removedNodes.length > 0;
            [].forEach.call(r.addedNodes, function (x) { if (!nosso(x)) so = false; });
            [].forEach.call(r.removedNodes, function (x) { if (!nosso(x)) so = false; });
            if (so) continue;
          }
          conta++;
          var el = alvo.nodeType === 1 ? alvo : alvo.parentNode;
          if (el && R.mapa.has(el)) { var i = R.mapa.get(el); if (R.mudados.indexOf(i) < 0) R.mudados.push(i); }
        }
        if (conta) { R.mut += conta; if (R.mudados.length > 200) R.mudados.splice(0, R.mudados.length - 200); }
      }).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
    } catch (e) { /* sem observador: o DOM vivo só atualiza no ↻ */ }

    R.raiz = function () { return { url: location.href, titulo: document.title, raiz: resumo(document.documentElement), mut: R.mut }; };
    R.filhos = function (i) {
      var n = no(i);
      if (!n) return null;
      var out = [];
      for (var c = n.firstChild; c; c = c.nextSibling) {
        if (nosso(c)) continue;
        if (c.nodeType === 1 || (c.nodeType === 3 && c.nodeValue.trim())) {
          if (out.length >= 400) { out.push({ mais: contaFilhos(n) - 400 }); break; }
          out.push(resumo(c));
        }
      }
      return out;
    };
    R.caminho = function (i) { var n = no(i), ids = []; while (n && n !== document) { ids.unshift(id(n)); n = n.parentNode; } return ids; };
    R.estado = function () { var m = R.mudados; R.mudados = []; return { mut: R.mut, mudados: m, url: location.href }; };
    R.outer = function (i) {
      var n = no(i);
      if (!n) return null;
      var s = n.nodeType === 1 ? n.outerHTML : n.nodeValue;
      return s.length > 300000 ? s.slice(0, 300000) + '\n<!-- … cortado em 300 mil caracteres -->' : s;
    };
    R.buscar = function (q) {
      var bruto = String(q || '').trim();
      q = bruto.toLowerCase();
      if (!q) return [];
      var out = [], todos = document.getElementsByTagName('*');
      /* parece seletor CSS (.classe, #id, [atributo], a > b): vale o que o motor acha */
      if (/^[.#\[]|\s>\s|:[a-z-]+\(/i.test(bruto)) {
        var porSel = null;
        try { porSel = document.querySelectorAll(bruto); } catch (e) { porSel = null; }
        if (porSel && porSel.length) {
          for (var s0 = 0; s0 < porSel.length && out.length < 80; s0++) if (!nosso(porSel[s0])) out.push({ i: id(porSel[s0]), rotulo: rotulo(porSel[s0]), trecho: '', caminho: caminhoRotulos(porSel[s0]), seletor: 1 });
          return out;
        }
      }
      for (var k = 0; k < todos.length && out.length < 80; k++) {
        var el = todos[k];
        if (nosso(el)) continue;
        var achou = rotulo(el).toLowerCase().indexOf(q) >= 0, trecho = '';
        if (!achou) for (var a = 0; a < el.attributes.length; a++) {
          var at = el.attributes[a];
          if ((at.name + '="' + at.value + '"').toLowerCase().indexOf(q) >= 0) { achou = true; trecho = at.name + '="' + corta(at.value, 60) + '"'; break; }
        }
        if (!achou) {
          var proprio = '';
          for (var c = el.firstChild; c; c = c.nextSibling) if (c.nodeType === 3) proprio += c.nodeValue;
          proprio = limpa(proprio);
          var p = proprio.toLowerCase().indexOf(q);
          if (p >= 0) { achou = true; trecho = (p > 30 ? '…' : '') + corta(proprio.slice(Math.max(0, p - 30)), 90); }
        }
        if (achou) out.push({ i: id(el), rotulo: rotulo(el), trecho: trecho, caminho: caminhoRotulos(el) });
      }
      return out;
    };
    R.estilos = function (i) {
      var el = no(i);
      if (el && el.nodeType !== 1) el = el.parentElement;
      if (!el) el = document.body || document.documentElement;
      var cs = getComputedStyle(el), comp = [];
      var flex = /flex|grid/.test(cs.display), grade = /grid/.test(cs.display);
      PROPS.forEach(function (p) {
        var v = cs.getPropertyValue(p);
        if (!v) return;
        if (!flex && /^(flex-direction|justify-content|align-items|gap)$/.test(p)) return;
        if (!grade && p === 'grid-template-columns') return;
        if (p === 'transition' && /^all( 0s ease 0s)?$/.test(v)) return;
        if (p === 'text-decoration-line' && v === 'none') return;
        if (!SEMPRE[p] && /^(none|normal|auto|0px|0s|0px none rgb\(0, 0, 0\)|rgba\(0, 0, 0, 0\)|static|visible|start|content-box|1)$/.test(v)) return;
        comp.push([p, v]);
      });
      var regras = [], bloqueadas = 0;
      function andar(lista, origem, midia) {
        for (var k = 0; k < lista.length && regras.length < 60; k++) {
          var r = lista[k];
          if (r.selectorText != null && r.style) {
            try { if (el.matches(r.selectorText)) regras.push({ sel: corta(r.selectorText, 240), decl: corta(r.style.cssText, 1600), origem: origem, midia: midia || '' }); } catch (e) { /* seletor que o motor não entende */ }
          } else if (r.cssRules) {
            var ok = true;
            if (r.media && r.conditionText != null && /media/i.test(r.constructor && r.constructor.name)) { try { ok = matchMedia(r.media.mediaText).matches; } catch (e) { ok = true; } }
            if (ok) andar(r.cssRules, origem, r.media ? '@media ' + r.media.mediaText : midia);
          }
        }
      }
      for (var s = 0; s < document.styleSheets.length; s++) {
        var sh = document.styleSheets[s], rs;
        try { rs = sh.cssRules; } catch (e) { bloqueadas++; continue; }
        var nome = sh.href ? (sh.href.split('?')[0].split('/').pop() || sh.href) : '<style> da página';
        andar(rs, nome, '');
      }
      if (el.getAttribute('style')) regras.push({ sel: 'style="…"', decl: corta(el.getAttribute('style'), 800), origem: 'no próprio elemento', midia: '' });
      var r = el.getBoundingClientRect();
      return { i: id(el), rotulo: rotulo(el), seletor: seletor(el), caixa: { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY) },
        margem: cs.margin, recuo: cs.padding, computado: comp, regras: regras.reverse(), bloqueadas: bloqueadas, texto: corta(limpa(el.innerText || el.textContent), 200), caminho: caminhoRotulos(el) };
    };
    R.pagina = function () {
      var usos = {}, cores = {}, els = document.body ? document.body.getElementsByTagName('*') : [], lim = Math.min(els.length, 3000);
      function add(c, papel) {
        if (transparente(c)) return;
        var k = hex(c), o = cores[k] || (cores[k] = { cor: k, n: 0, texto: 0, fundo: 0, borda: 0 });
        o.n++; o[papel]++;
      }
      var lista = [document.body || document.documentElement];
      for (var k = 0; k < lim; k++) lista.push(els[k]);
      lista.forEach(function (el) {
        if (!el || nosso(el) || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(el.nodeName)) return;
        var cs = getComputedStyle(el);
        if (cs.display === 'none') return;
        var fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim() || '(padrão)';
        var u = usos[fam] || (usos[fam] = { familia: fam, pilha: corta(cs.fontFamily, 140), n: 0, pesos: {}, tamanhos: {} });
        u.n++; u.pesos[cs.fontWeight] = 1; u.tamanhos[cs.fontSize] = 1;
        add(cs.color, 'texto'); add(cs.backgroundColor, 'fundo');
        if (parseFloat(cs.borderTopWidth) > 0) add(cs.borderTopColor, 'borda');
      });
      var faces = [];
      try { document.fonts.forEach(function (f) { faces.push({ familia: f.family.replace(/["']/g, ''), peso: f.weight, estilo: f.style, estado: f.status }); }); } catch (e) { /* sem FontFaceSet */ }
      var fontes = Object.keys(usos).map(function (k) { var u = usos[k]; return { familia: u.familia, pilha: u.pilha, n: u.n, pesos: Object.keys(u.pesos).sort().join(' · '), tamanhos: Object.keys(u.tamanhos).sort(function (a, b) { return parseFloat(a) - parseFloat(b); }).slice(0, 8).join(' · ') }; })
        .sort(function (a, b) { return b.n - a.n; }).slice(0, 16);
      var cs = Object.keys(cores).map(function (k) { return cores[k]; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 28);
      return { fontes: fontes, faces: faces.slice(0, 40), cores: cs, amostra: lista.length };
    };
    R.copy = function () {
      var BLOCOS = { H1: 'titulo', H2: 'subtitulo', H3: 'subtitulo', H4: 'subtitulo', H5: 'subtitulo', H6: 'subtitulo', P: 'paragrafo', LI: 'item', BLOCKQUOTE: 'citacao',
        FIGCAPTION: 'legenda', BUTTON: 'botao', A: 'link', LABEL: 'campo', DT: 'item', DD: 'paragrafo', TD: 'celula', TH: 'celula', SUMMARY: 'campo', CAPTION: 'legenda' };
      var itens = [], tomados = new Set();
      var raiz = document.body || document.documentElement;
      var w = document.createTreeWalker(raiz, NodeFilter.SHOW_ELEMENT, { acceptNode: function (el) { return nosso(el) || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|SVG|IFRAME|CANVAS)$/i.test(el.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
      function secaoDe(el) {
        var a = el.parentElement;
        while (a && a !== document.body) {
          if (SECAO.test(a.nodeName)) {
            var t = a.querySelector('h1,h2,h3');
            return { i: id(a), tag: a.nodeName.toLowerCase(), rotulo: rotulo(a), titulo: t ? corta(limpa(t.textContent), 80) : '' };
          }
          a = a.parentElement;
        }
        return { i: 0, tag: 'body', rotulo: 'body', titulo: '' };
      }
      var el;
      while ((el = w.nextNode()) && itens.length < 800) {
        var tipo = BLOCOS[el.nodeName];
        if (el.nodeName === 'INPUT' && /^(submit|button)$/i.test(el.type) && el.value) tipo = 'botao';
        if (el.nodeName === 'INPUT' && el.placeholder && !/^(submit|button|hidden|password)$/i.test(el.type)) tipo = 'campo';
        if (el.nodeName === 'IMG' && el.alt) tipo = 'imagem';
        if (!tipo) continue;
        var anc = el.parentElement, dentro = false;
        while (anc) { if (tomados.has(anc)) { dentro = true; break; } anc = anc.parentElement; }
        if (dentro || !visivel(el)) continue;
        var texto = tipo === 'imagem' ? el.alt : el.nodeName === 'INPUT' ? (el.value && /^(submit|button)$/i.test(el.type) ? el.value : el.placeholder) : limpa(el.innerText || el.textContent);
        if (!texto) continue;
        tomados.add(el);
        itens.push({ tipo: tipo, nivel: /^H\d$/.test(el.nodeName) ? +el.nodeName[1] : 0, texto: corta(texto, 2000), secao: secaoDe(el), i: id(el) });
      }
      return { url: location.href, titulo: document.title, itens: itens };
    };
    R.rede = function () {
      var out = [];
      try {
        performance.getEntriesByType('navigation').concat(performance.getEntriesByType('resource')).forEach(function (e) {
          out.push({ url: e.name, tipo: e.entryType === 'navigation' ? 'documento' : e.initiatorType, status: e.responseStatus || 0, bytes: e.transferSize || e.encodedBodySize || 0,
            ms: Math.round(e.duration), inicio: Math.round(e.startTime), mime: e.contentType || '', metodo: e.entryType === 'navigation' ? 'GET' : '' });
        });
      } catch (e) { /* sem Resource Timing */ }
      return out.slice(-400);
    };
    R.resposta = function (url) {
      return fetch(url, { cache: 'force-cache', credentials: 'same-origin' }).then(function (r) {
        return r.text().then(function (t) { return { status: r.status, mime: r.headers.get('content-type') || '', corpo: t.slice(0, 20000), total: t.length }; });
      }).catch(function (e) { return { erro: String((e && e.message) || e) }; });
    };
    R.ponto = function (alvo) {
      var el = null;
      try { if (alvo && alvo.seletor) el = document.querySelector(alvo.seletor); } catch (e) { el = null; }
      if (!el && alvo && alvo.texto) {
        var t = String(alvo.texto).toLowerCase(), cands = document.querySelectorAll('button,a,[role=button],input[type=submit],label,summary,h1,h2,h3,li,p,span,div');
        for (var k = 0; k < cands.length; k++) { var c = cands[k]; if (!nosso(c) && visivel(c) && limpa(c.innerText || c.value || '').toLowerCase().indexOf(t) >= 0) { el = c; break; } }
      }
      if (!el) return null;
      var r = el.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + Math.min(r.height / 2, 18)), rotulo: rotulo(el) };
    };
    R.destacar = function (i) {
      var el = no(i);
      if (el && el.nodeType !== 1) el = el.parentElement;
      if (!el) return false;
      try { el.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (e) { /* segue */ }
      var r = el.getBoundingClientRect(), d = marcar(document.createElement('div'));
      d.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height +
        'px;outline:2px solid #2ad5e5;background:rgba(42,213,229,.12);box-shadow:0 0 18px rgba(42,213,229,.45);border-radius:2px;transition:opacity .9s ease';
      document.documentElement.appendChild(d);
      setTimeout(function () { d.style.opacity = '0'; }, 500);
      setTimeout(function () { d.remove(); }, 1500);
      return true;
    };
    R.selecionar = function () {
      if (R.sel) R.sel.cancelar();
      return new Promise(function (ok) {
        var caixa = marcar(document.createElement('div')), etiqueta = marcar(document.createElement('div')), atual = null;
        caixa.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;outline:1.5px solid #2ad5e5;background:rgba(42,213,229,.10);box-shadow:0 0 0 1px rgba(6,11,22,.55),0 0 16px rgba(42,213,229,.35);border-radius:2px;display:none';
        etiqueta.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;padding:2px 7px;border-radius:4px;background:#060b16;color:#2ad5e5;font:11px/1.5 ui-monospace,Menlo,monospace;border:1px solid rgba(63,227,255,.35);display:none;white-space:nowrap';
        document.documentElement.appendChild(caixa);
        document.documentElement.appendChild(etiqueta);
        function mostrar(el) {
          if (!el || nosso(el)) return;
          atual = el;
          var r = el.getBoundingClientRect();
          caixa.style.display = etiqueta.style.display = 'block';
          caixa.style.left = r.left + 'px'; caixa.style.top = r.top + 'px'; caixa.style.width = r.width + 'px'; caixa.style.height = r.height + 'px';
          etiqueta.textContent = rotulo(el) + '  ' + Math.round(r.width) + '×' + Math.round(r.height);
          etiqueta.style.left = Math.max(0, r.left) + 'px';
          etiqueta.style.top = (r.top > 24 ? r.top - 22 : r.bottom + 4) + 'px';
        }
        function mover(e) { mostrar(document.elementFromPoint(e.clientX, e.clientY)); }
        function parar(e) { e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation(); }
        function clicar(e) { parar(e); var el = document.elementFromPoint(e.clientX, e.clientY); fim(el && !nosso(el) ? el : atual); }
        function tecla(e) { if (e.key === 'Escape') { parar(e); fim(null); } }
        var EVS = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'dblclick', 'auxclick', 'contextmenu'];
        function fim(el) {
          window.removeEventListener('mousemove', mover, true);
          window.removeEventListener('click', clicar, true);
          window.removeEventListener('keydown', tecla, true);
          EVS.forEach(function (n) { window.removeEventListener(n, parar, true); });
          caixa.remove(); etiqueta.remove();
          R.sel = null;
          ok(el ? { i: id(el), rotulo: rotulo(el), seletor: seletor(el), caminho: R.caminho(id(el)) } : null);
        }
        window.addEventListener('mousemove', mover, true);
        window.addEventListener('click', clicar, true);
        window.addEventListener('keydown', tecla, true);
        EVS.forEach(function (n) { window.addEventListener(n, parar, true); });
        R.sel = { cancelar: function () { fim(null); } };
      });
    };
    R.cancelar = function () { if (R.sel) R.sel.cancelar(); return true; };
    /* antes de clonar, copiar ou fotografar: nada do Raio-X fica na página */
    R.limpar = function () { if (R.sel) R.sel.cancelar(); [].forEach.call(document.querySelectorAll('[data-babel-coop-raiox]'), function (x) { x.remove(); }); return true; };
    R.porSeletor = function (sel) { var el = null; try { el = document.querySelector(sel); } catch (e) { el = null; } return el ? id(el) : null; };
    R.rolar = function (dx, dy) { window.scrollBy(dx, dy); return true; };
    /* cópia leve (sem o módulo do processo principal): HTML + CSS legível; imagens e fontes ficam no endereço original */
    R.clonar = function () {
      var css = [], lidos = new Set();
      function absolutos(texto, base) { return texto.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, function (m, q, u) { if (/^(data:|#)/i.test(u)) return m; try { return 'url("' + new URL(u, base).href + '")'; } catch (e) { return m; } }); }
      for (var s = 0; s < document.styleSheets.length; s++) {
        var sh = document.styleSheets[s];
        if (!sh.href) continue;
        try { var rs = sh.cssRules, t = []; for (var k = 0; k < rs.length; k++) t.push(rs[k].cssText); css.push('/* ' + sh.href + ' */\n' + absolutos(t.join('\n'), sh.href)); lidos.add(sh.href); } catch (e) { /* folha de outra origem: fica o link */ }
      }
      var d = document.documentElement.cloneNode(true);
      [].forEach.call(document.documentElement.querySelectorAll('*'), function (el, k) { if (nosso(el)) { var c = d.querySelectorAll('*')[k]; if (c) c.setAttribute('data-coop-fora', ''); } });
      [].forEach.call(d.querySelectorAll('[data-coop-fora]'), function (el) { el.remove(); });
      [].forEach.call(d.querySelectorAll('link[rel~="stylesheet"][href]'), function (l) { var abs = new URL(l.getAttribute('href'), location.href).href; if (lidos.has(abs)) l.remove(); else l.setAttribute('href', abs); });
      [['img', 'src'], ['script', 'src'], ['source', 'src'], ['video', 'poster'], ['audio', 'src'], ['link', 'href'], ['a', 'href'], ['form', 'action'], ['iframe', 'src']].forEach(function (p) {
        [].forEach.call(d.querySelectorAll(p[0] + '[' + p[1] + ']'), function (el) { var v = el.getAttribute(p[1]); if (v && !/^(data:|#|mailto:|tel:|javascript:)/i.test(v)) { try { el.setAttribute(p[1], new URL(v, location.href).href); } catch (e) { /* fica */ } } });
      });
      [].forEach.call(d.querySelectorAll('img[srcset],source[srcset]'), function (el) { el.setAttribute('srcset', el.getAttribute('srcset').split(',').map(function (x) { var p = x.trim().split(/\s+/); try { p[0] = new URL(p[0], location.href).href; } catch (e) { /* fica */ } return p.join(' '); }).join(', ')); });
      [].forEach.call(d.querySelectorAll('style'), function (st) { st.textContent = absolutos(st.textContent, location.href); });
      var head = d.querySelector('head');
      if (head && css.length) { var l = document.createElement('link'); l.setAttribute('rel', 'stylesheet'); l.setAttribute('href', 'estilos.css'); head.appendChild(l); }
      return { html: '<!doctype html>\n' + d.outerHTML, css: css.join('\n\n'), url: location.href, titulo: document.title };
    };
    window.__coopRaio = R;
    return R;
  }
  var PROGRAMA = '(' + PROGRAMA_PAGINA.toString() + ')()';
  function naPagina(s, metodo, args) {
    if (!s || !s.wv || !s.anexado) return Promise.reject(new Error('a página ainda não abriu'));
    var codigo = PROGRAMA + '.' + metodo + '.apply(null,' + JSON.stringify(args || []) + ')';
    try { return Promise.resolve(s.wv.executeJavaScript(codigo)); } catch (e) { return Promise.reject(e); }
  }

  /* ================================================================== a camada que segura os webviews
     O webview não pode sair do DOM (sair = a página do agente morre). Então ele mora numa camada fixa dentro de .e-editor,
     posicionada sobre #e-conteudo quando a aba ativa é de navegador; nas outras abas, a camada fica invisível e a página
     do agente continua viva. */
  var camadaEl = null, observador = null;
  function camada() {
    if (camadaEl && camadaEl.isConnected) return camadaEl;
    var main = document.querySelector('#vista-estacao .e-editor');
    camadaEl = h('div', { class: 'navr-camada', id: 'navr-camada', 'aria-hidden': 'true' });
    (main || document.body).appendChild(camadaEl);
    if (main) main.classList.add('navr-hospeda');
    if (window.ResizeObserver && !observador) {
      observador = new ResizeObserver(function () { posicionar(); });
      var c = document.getElementById('e-conteudo'), a = document.getElementById('e-abas');
      if (c) observador.observe(c);
      if (a) observador.observe(a);
      if (main) observador.observe(main);
    }
    return camadaEl;
  }
  function abaAtual() { try { return E.abaAtual ? E.abaAtual() : null; } catch (e) { return null; } }
  function refAtiva() { var t = abaAtual(); return t && t.tipo === 'navegador' ? String(t.ref) : null; }
  function posicionar() {
    var cam = camada(), c = document.getElementById('e-conteudo'), ref = refAtiva();
    var visivel = !!(ref && c && c.offsetParent !== null && (S[ref] || C[ref]));
    if (visivel) {
      cam.style.left = c.offsetLeft + 'px'; cam.style.top = c.offsetTop + 'px';
      cam.style.width = c.offsetWidth + 'px'; cam.style.height = c.offsetHeight + 'px';
    }
    cam.classList.toggle('visivel', visivel);
    cam.setAttribute('aria-hidden', visivel ? 'false' : 'true');
    return visivel ? ref : null;
  }
  function sincronizar() {
    if (!webviewLigado() && !Object.keys(C).length) return;
    var ref = posicionar();
    Object.keys(S).forEach(function (k) { S[k].el.classList.toggle('ativa', k === ref); });
    /* clones cuja aba foi fechada saem da camada (o arquivo continua no disco) */
    var abertas = {};
    (E.ui && E.ui.abas || []).forEach(function (t) { if (t.tipo === 'navegador') abertas[String(t.ref)] = true; });
    Object.keys(C).forEach(function (k) {
      if (!abertas[k]) { if (C[k].el) C[k].el.remove(); delete C[k]; return; }
      C[k].el.classList.toggle('ativa', k === ref);
    });
    if (ref && S[ref]) { var s = S[ref]; if (s.rx.aberto && s.rx.sujo) rxCarregar(s); }
    vigiarDom();
  }

  /* ================================================================== sessões: uma por agente, cada uma com o seu webview */
  function novoRx() {
    var guardada = +(ler('babel-coop:raiox-largura') || 0);
    return { aberto: false, aba: 'html', largura: guardada ? Math.max(300, Math.min(760, guardada)) : 380, escolhida: !!guardada, cache: {}, pai: {}, filhos: {}, abertos: {}, raiz: null,
      sel: null, busca: '', resultados: null, estilos: null, pagina: null, copy: null, rede: null, reqSel: null, resp: {}, consoleFiltro: 'todos', mut: -1, sujo: true,
      selecionando: false, carregando: false, erro: '' };
  }

  function criarSessao(ag) {
    var s = { ag: ag, url: '', titulo: '', assumido: !temApi('registrar'), suaVez: false, fim: false, carregando: false, anexado: false, wcId: null, registrado: false,
      passos: [], console: [], rx: novoRx(), criada: Date.now(), ultimoPasso: 0 };
    S[ag.id] = s;
    montarSecao(s);
    return s;
  }

  function montarSecao(s) {
    var ag = s.ag, cam = camada();
    var sec = h('section', { class: 'navr-secao navr', dataset: { agente: ag.id }, style: '--navr-cor:' + ag.cor, 'aria-label': 'Navegador de ' + ag.nome });
    /* barra: quem, navegação, endereço, Assumir/Devolver, Raio-X */
    var mini = h('span', { class: 'navr-mini', 'aria-hidden': 'true' });
    var quem = h('span', { class: 'navr-quem', title: 'o navegador de ' + ag.nome }, [h('span', { class: 'navr-av', text: iniciais(ag.nome) }), mini, h('b', { text: ag.nome })]);
    var bVoltar = h('button', { class: 'navr-bt-ic', type: 'button', title: 'Voltar', 'aria-label': 'Voltar', onclick: function () { if (s.assumido && s.wv && s.wv.canGoBack()) s.wv.goBack(); } }, [svg(IC.voltar)]);
    var bAvancar = h('button', { class: 'navr-bt-ic', type: 'button', title: 'Avançar', 'aria-label': 'Avançar', onclick: function () { if (s.assumido && s.wv && s.wv.canGoForward()) s.wv.goForward(); } }, [svg(IC.avancar)]);
    var bRecarregar = h('button', { class: 'navr-bt-ic', type: 'button', title: 'Recarregar', 'aria-label': 'Recarregar', onclick: function () { if (s.assumido && s.wv) s.wv.reload(); } }, [svg(IC.recarregar)]);
    var cadeado = svg(IC.cadeado);
    var url = h('input', { class: 'navr-url', type: 'text', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'Endereço', placeholder: 'endereço do site' });
    var form = h('form', { class: 'navr-end', onsubmit: function (ev) { ev.preventDefault(); if (!s.assumido) return; var u = urlSegura(url.value); if (!u) { aviso('Endereço inválido: só http e https.'); return; } ir(s, u, 'você'); } }, [cadeado, url]);
    var bAssumir = h('button', { class: 'botao navr-assumir', type: 'button', onclick: function () { if (s.assumido || s.suaVez) devolver(s); else assumir(s); } });
    var bRaio = h('button', { class: 'botao navr-raio-bt', type: 'button', 'aria-pressed': 'false', 'aria-label': 'Raio-X', title: 'Raio-X do site: HTML, CSS, Copy, Rede e Console', onclick: function () { rxAlternar(s); } }, [svg(IC.raio), h('span', { class: 'navr-rot', text: 'Raio-X' })]);
    var barra = h('header', { class: 'navr-barra' }, [quem, h('span', { class: 'navr-nav' }, [bVoltar, bAvancar, bRecarregar]), form, bAssumir, bRaio]);

    /* faixa de estado (superfície viva: vidro HUD enquanto o agente controla) */
    var faixaTexto = h('span', { class: 'navr-faixa-texto' });
    var faixaDir = h('span', { class: 'navr-faixa-dir' });
    var faixa = h('div', { class: 'navr-faixa', role: 'status', 'aria-live': 'polite' }, [h('i', { class: 'navr-ponto', 'aria-hidden': 'true' }), faixaTexto, faixaDir]);

    /* a página */
    var pagina = h('div', { class: 'navr-pagina' });
    var wv = null;
    if (webviewLigado()) {
      wv = document.createElement('webview');
      wv.className = 'navr-wv';
      wv.setAttribute('partition', 'persist:navegador-' + eu());
      wv.setAttribute('webpreferences', 'contextIsolation=yes, javascript=yes');
      wv.setAttribute('src', 'about:blank');
      pagina.appendChild(wv);
    }
    var escudo = h('div', { class: 'navr-escudo', 'aria-hidden': 'true' });
    var dica = h('div', { class: 'navr-dica', role: 'status' });
    var cursor = h('div', { class: 'navr-cursor', 'aria-hidden': 'true' }, [svg(IC.cursor), h('span', { text: ag.nome })]);
    var carga = h('div', { class: 'navr-carga', 'aria-hidden': 'true' });
    var varredura = h('div', { class: 'navr-varredura', 'aria-hidden': 'true' });
    var cantos = ['tl', 'tr', 'bl', 'br'].map(function (c) { return h('i', { class: 'navr-canto navr-canto-' + c, 'aria-hidden': 'true' }); });
    [escudo, varredura, carga, cursor, dica].concat(cantos).forEach(function (x) { pagina.appendChild(x); });

    var raio = h('aside', { class: 'navr-raiox', hidden: true, 'aria-label': 'Raio-X do site' });
    var corpo = h('div', { class: 'navr-corpo' }, [pagina, raio]);
    var passosCab = h('div', { class: 'navr-passos-cab' }, [h('span', { class: 'rotulo', text: 'Passos' }), h('span', { class: 'navr-passos-n', text: '0' })]);
    var passos = h('ol', { class: 'navr-passos', 'aria-label': 'Passos do agente' });
    var rodape = h('div', { class: 'navr-rodape' }, [passosCab, passos]);
    sec.appendChild(barra); sec.appendChild(faixa); sec.appendChild(corpo); sec.appendChild(rodape);
    if (!webviewLigado()) pagina.appendChild(h('div', { class: 'navr-sem', text: 'Este app ainda não liga o navegador próprio (webviewTag). Atualize a Estação.' }));

    s.el = sec; s.wv = wv;
    s.ui = { barra: barra, url: url, cadeado: cadeado, bAssumir: bAssumir, bRaio: bRaio, bVoltar: bVoltar, bAvancar: bAvancar, bRecarregar: bRecarregar, faixa: faixa, faixaTexto: faixaTexto,
      faixaDir: faixaDir, pagina: pagina, escudo: escudo, dica: dica, cursor: cursor, carga: carga, varredura: varredura, raio: raio, passos: passos, passosN: passosCab.lastChild, mini: mini };
    cam.appendChild(sec);

    /* a presença mini do agente na barra (o mesmo anel das abas do terminal) */
    var Org = O();
    if (Org && Org.Presenca) { try { s.presenca = new Org.Presenca(mini, { tamanho: 'mini', estado: 'shell' }); } catch (e) { s.presenca = null; } }

    /* escudo: enquanto o agente controla, o mouse é dele; a rolagem da pessoa passa */
    var rolagem = { dx: 0, dy: 0, t: null };
    escudo.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      rolagem.dx += ev.deltaX; rolagem.dy += ev.deltaY;
      if (rolagem.t) return;
      rolagem.t = setTimeout(function () { var dx = rolagem.dx, dy = rolagem.dy; rolagem.dx = rolagem.dy = 0; rolagem.t = null; naPagina(s, 'rolar', [Math.round(dx), Math.round(dy)]).catch(function () {}); }, 40);
    }, { passive: false });
    escudo.addEventListener('pointerdown', function () { mostrarDica(s, ag.nome + ' está no controle · clique em Assumir para mexer'); });

    if (wv) ligarWebview(s);
    pintar(s);
    return sec;
  }

  function mostrarDica(s, texto) {
    var d = s.ui.dica;
    d.textContent = texto;
    d.classList.add('visivel');
    clearTimeout(d._t);
    d._t = setTimeout(function () { d.classList.remove('visivel'); }, 2600);
  }

  function ligarWebview(s) {
    var wv = s.wv;
    /* o id do webContents existe desde que o webview se prende à tela (did-attach); dom-ready confirma */
    function pegarId() {
      if (s.wcId != null) return;
      try { s.wcId = wv.getWebContentsId(); } catch (e) { s.wcId = null; }
      if (s.wcId != null) { emitir({ tipo: 'webview', agente: s.ag.id, webContentsId: s.wcId }); registrar(s); }
    }
    wv.addEventListener('did-attach', function () { pegarId(); });
    wv.addEventListener('dom-ready', function () {
      s.anexado = true;
      pegarId();
      if (s.wcId != null && !s.registrado && !s.erroRegistro) registrar(s);
      if (s.pendente) { var u = s.pendente; s.pendente = null; wv.loadURL(u).catch(function () {}); }
    });
    wv.addEventListener('did-start-loading', function () { s.carregando = true; pintar(s); });
    wv.addEventListener('did-stop-loading', function () {
      s.carregando = false;
      try { s.url = wv.getURL(); s.titulo = wv.getTitle(); } catch (e) { /* segue */ }
      pintar(s);
      if (s.rx.aberto && (s.rx.aba === 'rede' || s.rx.aba === 'copy' || s.rx.aba === 'css')) rxSujar(s);
    });
    wv.addEventListener('did-navigate', function (e) {
      s.url = e.url;
      novoDocumento(s);
      pintar(s);
    });
    wv.addEventListener('did-navigate-in-page', function (e) { if (e.isMainFrame !== false) { s.url = e.url; pintar(s); } });
    wv.addEventListener('page-title-updated', function (e) { s.titulo = e.title; pintar(s); });
    wv.addEventListener('console-message', function (e) { anotarConsole(s, e); });
    wv.addEventListener('did-fail-load', function (e) {
      if (e.errorCode === -3 || e.isMainFrame === false) return; /* -3 = trocou de página antes de terminar */
      anotarConsole(s, { level: 3, message: 'a página não abriu: ' + (e.errorDescription || 'erro ' + e.errorCode) + ' · ' + (e.validatedURL || ''), sourceId: '', line: 0 });
      s.carregando = false;
      pintar(s);
    });
    wv.addEventListener('render-process-gone', function () { anotarConsole(s, { level: 3, message: 'o processo da página caiu; recarregue', sourceId: '', line: 0 }); });
  }

  function nomeDaPessoa() { var p = L() && L().pessoa ? L().pessoa(eu()) : null; var r = BC.real && BC.real.eu && BC.real.eu(); return (p && p.nome) || (r && r.nome) || ''; }
  function registrar(s) {
    if (s.registrado || s.registrando || s.wcId == null || !temApi('registrar')) return;
    s.registrando = true;
    var cor = /^#[0-9a-f]{3,8}$/i.test(String(s.ag.cor || '')) ? s.ag.cor : undefined;
    chamar('registrar', [s.wcId, s.ag.id, { nome: s.ag.nome, cor: cor, pessoa: nomeDaPessoa() }]).then(function (r) {
      s.registrado = true; s.registrando = false; s.erroRegistro = null;
      if (r) { s.assumido = r.controlador === 'pessoa' || !!r.assumido; s.suaVez = !!r.suaVez; }
      pintar(s);
      emitir({ tipo: 'registrado', agente: s.ag.id, webContentsId: s.wcId });
    }).catch(function (e) {
      s.registrando = false;
      s.erroRegistro = (e && e.message) || String(e);
      console.warn('[navegador-real] registrar falhou:', s.erroRegistro);
      pintar(s);
    });
  }

  function novoDocumento(s) {
    var rx = s.rx;
    s.console = []; /* documento novo, console novo (como o DevTools sem "preservar registro") */
    if (s.ui) s.ui.bRaio.dataset.erros = '';
    s.rx = novoRx();
    s.rx.aberto = rx.aberto; s.rx.aba = rx.aba; s.rx.largura = rx.largura; s.rx.escolhida = rx.escolhida; s.rx.consoleFiltro = rx.consoleFiltro;
    if (rx.aberto) rxCarregar(s);
  }

  var NIVEL = { 0: 'debug', 1: 'log', 2: 'aviso', 3: 'erro', verbose: 'debug', debug: 'debug', info: 'log', log: 'log', warning: 'aviso', warn: 'aviso', error: 'erro' };
  function anotarConsole(s, e) {
    /* o aviso de segurança do Electron (só em app não empacotado) é do app, não da página: fica fora do Raio-X */
    if (/^%cElectron Security Warning/.test(String(e.message || ''))) return;
    var nivel = NIVEL[e.level] || 'log';
    var item = { nivel: nivel, texto: String(e.message || ''), fonte: String(e.sourceId || '').split('?')[0].split('/').pop(), linha: e.line || e.lineNumber || 0, ts: Date.now() };
    s.console.push(item);
    if (s.console.length > 600) s.console.splice(0, s.console.length - 600);
    if (s.rx.aberto && s.rx.aba === 'console') rxDesenhar(s);
    else if (s.ui) s.ui.bRaio.dataset.erros = String(s.console.filter(function (c) { return c.nivel === 'erro'; }).length || '');
  }

  /* ---------- navegar ---------- */
  function ir(s, url, quem) {
    s.fim = false;
    if (!s.wv) return Promise.resolve(false);
    /* a pessoa digitou o endereço: com o módulo principal, vai por ele (valida o endereço e anota o passo) */
    if (quem === 'você' && s.registrado && temApi('abrir')) {
      pintar(s);
      return chamar('abrir', [s.ag.id, url]).then(function () { return true; }, function (e) { aviso('Não abri: ' + ((e && e.message) || e)); return false; });
    }
    s.url = url;
    if (quem === 'você') adicionarPasso(s, { texto: 'você abriu ' + url, quem: 'pessoa' });
    if (!s.anexado) { s.pendente = url; pintar(s); return Promise.resolve(true); }
    pintar(s);
    return s.wv.loadURL(url).then(function () { return true; }, function (e) {
      if (e && /ERR_ABORTED|\(-3\)/.test(String(e.message || e))) return true;
      anotarConsole(s, { level: 3, message: 'não abriu ' + url + ': ' + ((e && e.message) || e), sourceId: '', line: 0 });
      return false;
    });
  }

  /* ---------- Assumir e Devolver ---------- */
  /* com o módulo principal, o passo "assumiu/devolveu" vem de lá (um registro só); sem ele, a tela anota */
  function comModulo(s) { return !!(s.registrado && api()); }
  function assumir(s) {
    s.assumido = true;
    s.suaVez = false;
    if (comModulo(s)) chamar('assumir', [s.ag.id]).then(function (r) { aoEstado(r); }, function (e) { aviso('Não assumi: ' + ((e && e.message) || e)); });
    else adicionarPasso(s, { texto: 'você assumiu o navegador · ' + s.ag.nome + ' espera', quem: 'pessoa' });
    pintar(s);
    try { s.ui.url.focus(); s.ui.url.select(); } catch (e) { /* segue */ }
  }
  function devolver(s) {
    /* a pessoa digitou a senha e devolveu: o "sua vez" acabou, mesmo que o módulo só limpe na próxima ação do agente */
    if (s.suaVez) s.suaVezEncerrada = true;
    s.assumido = false;
    s.suaVez = false;
    if (comModulo(s)) chamar('devolver', [s.ag.id]).then(function (r) { aoEstado(r); }, function (e) { aviso('Não devolvi: ' + ((e && e.message) || e)); });
    else adicionarPasso(s, { texto: 'você devolveu o navegador para ' + s.ag.nome, quem: 'pessoa' });
    pintar(s);
  }

  /* ---------- passos do agente ---------- */
  function adicionarPasso(s, p) {
    var texto = String(p.texto || p.descricao || '').trim();
    if (!texto) return;
    var ts = +p.ts || Date.now();
    /* tipos do módulo principal: navegador, abrir, clicar, digitar, senha, erro, aviso, ler, raiox, clonar, copy, print, controle, selecionar */
    var suaVez = p.tipo === 'senha' || p.tipo === 'sua-vez' || /sua vez/i.test(texto);
    var fim = p.tipo === 'fim' || /^✓/.test(texto);
    var erro = p.tipo === 'erro' || /^(✗|×|erro)/i.test(texto);
    var quem = p.quem || (p.tipo === 'controle' || p.tipo === 'selecionar' ? 'pessoa' : 'agente');
    var item = { texto: texto, ts: ts, quem: quem, tipo: p.tipo || '', suaVez: suaVez, fim: fim, erro: erro, feito: !!p.feito, pasta: p.pasta || p.arquivo || null };
    s.passos.push(item);
    if (s.passos.length > 300) s.passos.shift();
    var li = h('li', { class: 'navr-passo' + (quem === 'pessoa' ? ' pessoa' : '') + (suaVez ? ' sua-vez' : '') + (fim ? ' fim' : '') + (erro ? ' erro' : '') + (item.feito ? ' feito' : ''), dataset: { tipo: item.tipo } },
      [h('time', { text: horaSeg(ts) }), h('span', { text: texto })]);
    var m = item.pasta && /(Clones\/[^\/\\]+)/.exec(String(item.pasta).replace(/\\/g, '/'));
    if (m) li.appendChild(h('button', { class: 'navr-mini-bt', type: 'button', text: 'abrir', onclick: function () { abrirClone(m[1]); } }));
    var lista = s.ui.passos;
    [].forEach.call(lista.querySelectorAll('.atual'), function (x) { x.classList.remove('atual'); });
    li.classList.add('atual');
    lista.appendChild(li);
    while (lista.children.length > 300) lista.removeChild(lista.firstChild);
    lista.scrollTop = lista.scrollHeight;
    s.ui.passosN.textContent = String(s.passos.length);
    var Org = O();
    if (quem !== 'pessoa') {
      s.ultimoPasso = Date.now();
      if (suaVez) { s.suaVez = true; s.suaVezEncerrada = false; if (Org) Org.som('espera', { seForaDeFoco: s.el }); }
      if (fim) { s.fim = true; if (Org && Org.faiscas) Org.faiscas(s.ui.faixa, 4, false, { onde: 'topo' }); }
      else if (!suaVez) s.fim = false;
      if (Org) { Org.acender(li, 6000); Org.acender(s.ui.faixa, 6000); Org.acender(s.ui.pagina, 6000); }
      if (p.tipo !== 'navegador') varrer(s);
      /* o módulo principal desenha o cursor do agente dentro da página; a camada só desenha quando o passo vem de outro lugar */
      if (p.alvo && p.origem !== 'modulo') apontar(s, p.alvo, /clic|clique|click/i.test(texto) || p.tipo === 'clicar');
    } else if (Org) Org.acender(li, 6000);
    pintar(s);
    emitir({ tipo: 'passo', agente: s.ag.id, texto: texto, ts: ts });
  }

  function varrer(s) {
    var Org = O();
    if (Org && Org.semMovimento && Org.semMovimento()) return;
    if (s.assumido) return;
    var v = s.ui.varredura, agora = Date.now();
    if (v._t && agora - v._t < 700) return;
    v._t = agora;
    v.classList.remove('passando');
    void v.offsetWidth;
    v.classList.add('passando');
    setTimeout(function () { v.classList.remove('passando'); }, 900);
  }

  function apontar(s, alvo, clique) {
    var mover = function (pt) {
      if (!pt || typeof pt.x !== 'number') return;
      var c = s.ui.cursor;
      c.style.left = pt.x + 'px'; c.style.top = pt.y + 'px';
      c.classList.add('visivel');
      if (clique) { c.classList.remove('clicando'); void c.offsetWidth; c.classList.add('clicando'); }
    };
    if (typeof alvo.x === 'number' && typeof alvo.y === 'number') return mover(alvo);
    naPagina(s, 'ponto', [{ seletor: alvo.seletor || null, texto: alvo.texto || null }]).then(mover).catch(function () {});
  }

  /* ---------- pintar a barra, a faixa e a página ---------- */
  function pintar(s) {
    var u = s.ui, ag = s.ag;
    var quem = s.suaVez ? 'sua-vez' : s.assumido ? 'pessoa' : s.fim ? 'fim' : 'agente';
    s.el.dataset.quem = quem;
    s.el.classList.toggle('carregando', !!s.carregando);
    s.el.classList.toggle('selecionando', !!s.rx.selecionando);
    var ativo = document.activeElement === u.url;
    if (!ativo || !s.assumido) u.url.value = s.url && s.url !== 'about:blank' ? s.url : '';
    u.url.readOnly = !s.assumido;
    u.url.title = s.assumido ? 'Digite o endereço e Enter' : 'controlado por ' + ag.nome + '; assuma para navegar você';
    u.cadeado.innerHTML = s.assumido ? IC.globo : IC.cadeado;
    var devolve = s.assumido || s.suaVez;
    u.bAssumir.textContent = devolve ? 'Devolver para ' + ag.nome : 'Assumir';
    u.bAssumir.classList.toggle('primario', !!devolve);
    u.bAssumir.title = devolve ? ag.nome + ' retoma de onde parou' : 'Pausa ' + ag.nome + ' e o mouse passa a ser seu';
    [u.bVoltar, u.bAvancar, u.bRecarregar].forEach(function (b) { b.disabled = !s.assumido; });
    var txt, dir = '';
    if (!webviewLigado()) txt = 'navegador próprio desligado nesta versão do app';
    else if (s.suaVez) { txt = 'sua vez: digite a senha' + (s.senha && s.senha.rotulo ? ' em ' + s.senha.rotulo : ' na página') + ' · depois clique em Devolver'; dir = ag.nome + ' espera você'; }
    else if (s.assumido) { txt = 'você está no controle'; dir = api() ? (s.registrado ? ag.nome + ' espera · Devolver quando terminar' : s.erroRegistro ? 'o módulo do navegador recusou: ' + s.erroRegistro : 'ligando o navegador…') : 'o agente ainda não comanda este navegador'; }
    else if (s.fim) { txt = 'concluído · ' + hora(s.ultimoPasso) + ' · controlado por ' + ag.nome; dir = s.passos.length + ' passos'; }
    else { txt = 'controlado por ' + ag.nome + ' · você vê tudo'; dir = s.carregando ? 'abrindo…' : s.passos.length ? s.passos.length + ' passos · ' + hora(s.ultimoPasso || Date.now()) : 'aguardando o primeiro passo'; }
    u.faixaTexto.textContent = txt;
    u.faixaDir.textContent = dir;
    u.raio.hidden = !s.rx.aberto;
    var larguraCorpo = u.pagina.parentNode ? u.pagina.parentNode.clientWidth : 0;
    u.raio.style.width = (larguraCorpo > 0 && !s.rx.escolhida ? Math.min(s.rx.largura, Math.max(300, Math.round(larguraCorpo * 0.46))) : s.rx.largura) + 'px';
    u.bRaio.setAttribute('aria-pressed', s.rx.aberto ? 'true' : 'false');
    u.bRaio.classList.toggle('primario', !!s.rx.aberto);
    if (s.assumido) u.cursor.classList.remove('visivel');
    if (s.presenca) {
      var e = s.suaVez ? 'espera' : s.carregando || (!s.assumido && Date.now() - s.ultimoPasso < 2500) ? 'rodando' : s.fim ? 'terminou' : 'shell';
      if (s._estadoPresenca !== e) { s._estadoPresenca = e; try { s.presenca.estado(e, {}); } catch (x) { /* segue */ } }
      var vis = s.assumido ? corDaPessoa() : null;
      if (s._visita !== vis) { s._visita = vis; try { s.presenca.visitante(vis); } catch (x) { /* segue */ } }
    }
    atualizarTituloAba(s);
  }
  function atualizarTituloAba(s) {
    var t = (E.ui && E.ui.abas || []).filter(function (x) { return x.id === 'nav:' + s.ag.id; })[0];
    if (t) t.titulo = 'Navegador · ' + s.ag.nome;
  }

  /* ================================================================== abrir a aba */
  function abrir(agente, url, opcoes) {
    opcoes = opcoes || {};
    var ag = agenteDe(agente);
    var s = S[ag.id] || criarSessao(ag);
    if (agente && typeof agente === 'object' && agente.nome && s.ag.nome !== agente.nome) { s.ag.nome = agente.nome; }
    var tab = { id: 'nav:' + ag.id, tipo: 'navegador', ref: ag.id, titulo: 'Navegador · ' + s.ag.nome, atividade: 'terminais' };
    if (opcoes.mostrar !== false) E.abrirAba(tab);
    else if (!(E.ui.abas || []).some(function (t) { return t.id === tab.id; })) { E.ui.abas.push(tab); E.render(); }
    sincronizar();
    var u = url ? urlSegura(url) : null;
    var pronto = u ? ir(s, u, opcoes.quem || 'agente') : Promise.resolve(true);
    return pronto.then(function () { return esperarRegistro(s, opcoes.esperar || 8000); }).then(function () { return { agente: ag.id, webContentsId: s.wcId, registrado: s.registrado }; });
  }
  function esperarRegistro(s, ms) {
    if (!webviewLigado()) return Promise.resolve();
    var fim = Date.now() + ms;
    return new Promise(function (ok) {
      (function olhar() {
        if ((s.wcId != null && (s.registrado || !temApi('registrar'))) || Date.now() > fim) return ok();
        setTimeout(olhar, 60);
      })();
    });
  }

  /* ================================================================== Raio-X */
  function rxAlternar(s, aberto) {
    s.rx.aberto = aberto == null ? !s.rx.aberto : !!aberto;
    if (!s.rx.aberto && s.rx.selecionando) rxCancelarSelecao(s);
    montarRaio(s);
    pintar(s);
    if (s.rx.aberto) rxCarregar(s);
    vigiarDom();
  }
  function rxSujar(s) { s.rx.sujo = true; if (s.rx.aberto && s.el.classList.contains('ativa')) rxCarregar(s); }

  function montarRaio(s) {
    var r = s.ui.raio;
    if (r.firstChild) return;
    var alca = h('div', { class: 'navr-rx-alca', role: 'separator', 'aria-orientation': 'vertical', 'aria-label': 'Largura do Raio-X', tabindex: '0' });
    var host = h('span', { class: 'navr-rx-host' });
    var cab = h('header', { class: 'navr-rx-cab' }, [h('span', { class: 'rotulo', text: 'Raio-X' }), host,
      h('button', { class: 'navr-bt-ic', type: 'button', title: 'Recarregar os dados desta aba', 'aria-label': 'Recarregar dados', onclick: function () { rxRecarregar(s); } }, [svg(IC.recarregar)]),
      h('button', { class: 'navr-bt-ic', type: 'button', title: 'Fechar o Raio-X', 'aria-label': 'Fechar o Raio-X', text: '✕', onclick: function () { rxAlternar(s, false); } })]);
    var bSel = h('button', { class: 'botao navr-rx-sel', type: 'button', title: 'Aponte um elemento na página: o Raio-X mostra o que ele é', onclick: function () { if (s.rx.selecionando) rxCancelarSelecao(s); else rxSelecionar(s); } }, [svg(IC.mira), 'Selecionar elemento']);
    var acoes = h('div', { class: 'navr-rx-acoes' }, [
      h('button', { class: 'botao primario', type: 'button', text: 'Clonar página', title: 'HTML, CSS, imagens e fontes em Clones/<site>/, aberta como site', onclick: function () { clonarPagina(s); } }),
      h('button', { class: 'botao', type: 'button', text: 'Clonar copy', title: 'copy.md com os textos por seção', onclick: function () { clonarCopy(s); } }),
      h('button', { class: 'botao', type: 'button', text: 'Print inteiro', title: 'a página inteira em PNG na pasta do clone', onclick: function () { printInteiro(s); } }),
      bSel]);
    var ABAS = [['html', 'HTML'], ['css', 'CSS'], ['copy', 'Copy'], ['rede', 'Rede'], ['console', 'Console']];
    var abas = h('div', { class: 'alternar navr-rx-abas', role: 'tablist' }, ABAS.map(function (a) {
      return h('button', { type: 'button', role: 'tab', dataset: { aba: a[0] }, text: a[1], onclick: function () { s.rx.aba = a[0]; rxCarregar(s); } });
    }));
    var card = h('div', { class: 'navr-rx-card', hidden: true });
    var corpo = h('div', { class: 'navr-rx-corpo', role: 'tabpanel' });
    [alca, cab, acoes, abas, card, corpo].forEach(function (x) { r.appendChild(x); });
    s.ui.rx = { host: host, bSel: bSel, abas: abas, card: card, corpo: corpo };
    /* arrastar a borda muda a largura (fica guardada para a próxima vez) */
    alca.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      var x0 = ev.clientX, w0 = s.rx.largura;
      s.el.classList.add('arrastando');
      function mover(e) { s.rx.largura = Math.max(300, Math.min(760, w0 + (x0 - e.clientX))); r.style.width = s.rx.largura + 'px'; }
      function soltar() { window.removeEventListener('pointermove', mover); window.removeEventListener('pointerup', soltar); s.el.classList.remove('arrastando'); s.rx.escolhida = true; guardar('babel-coop:raiox-largura', String(s.rx.largura)); }
      window.addEventListener('pointermove', mover);
      window.addEventListener('pointerup', soltar);
    });
  }

  function rxRecarregar(s) {
    var rx = s.rx;
    if (rx.aba === 'html') { var abertos = rx.abertos, sel = rx.sel; rx.raiz = null; rx.cache = {}; rx.filhos = {}; rx.pai = {}; rx.abertos = abertos; rx.sel = sel; }
    if (rx.aba === 'css') { rx.estilos = null; rx.pagina = null; }
    if (rx.aba === 'copy') rx.copy = null;
    if (rx.aba === 'rede') rx.rede = null;
    rxCarregar(s, true);
  }

  function guardarResumos(rx, pai, lista) {
    rx.filhos[pai] = [];
    (lista || []).forEach(function (n) {
      if (n.mais) { rx.filhos[pai].push({ mais: n.mais }); return; }
      rx.cache[n.i] = n; rx.pai[n.i] = pai; rx.filhos[pai].push(n.i);
    });
  }

  function rxCarregar(s, forcar) {
    var rx = s.rx;
    if (!rx.aberto) return;
    montarRaio(s);
    rx.sujo = false;
    var t0 = performance.now(), aba = rx.aba;
    var feito = function () { rx.carregando = false; rx.ms = Math.round(performance.now() - t0); rxDesenhar(s); emitir({ tipo: 'raiox', agente: s.ag.id, aba: aba, ms: rx.ms }); };
    var falhou = function (e) { rx.carregando = false; rx.erro = (e && e.message) || String(e); rxDesenhar(s); };
    rx.erro = '';
    if (aba === 'html') {
      if (rx.raiz && !forcar) { rxDesenhar(s); return; }
      rx.carregando = true; rxDesenhar(s);
      naPagina(s, 'raiz', []).then(function (r) {
        rx.raiz = r.raiz.i; rx.cache[r.raiz.i] = r.raiz; rx.mut = r.mut;
        rx.abertos[r.raiz.i] = true;
        return carregarAbertos(s, r.raiz.i).then(function () {
          /* primeira vez: abre o body */
          var body = (rx.filhos[r.raiz.i] || []).filter(function (i) { return rx.cache[i] && rx.cache[i].t === 'body'; })[0];
          if (body && rx.abertos[body] == null) { rx.abertos[body] = true; return carregarFilhos(s, body); }
        });
      }).then(feito, falhou);
    } else if (aba === 'css') {
      if (rx.estilos && rx.pagina && !forcar && rx.estilos.i === rx.sel) { rxDesenhar(s); return; }
      rx.carregando = true; rxDesenhar(s);
      Promise.all([carregarEstilos(s, rx.sel || 0), rx.pagina && !forcar ? Promise.resolve(rx.pagina) : naPagina(s, 'pagina', [])])
        .then(function (r) { rx.estilos = r[0]; rx.pagina = r[1]; }).then(feito, falhou);
    } else if (aba === 'copy') {
      if (rx.copy && !forcar) { rxDesenhar(s); return; }
      rx.carregando = true; rxDesenhar(s);
      naPagina(s, 'copy', []).then(function (r) { rx.copy = r; }).then(feito, falhou);
    } else if (aba === 'rede') {
      if (rx.rede && !forcar) { rxDesenhar(s); return; }
      rx.carregando = true; rxDesenhar(s);
      redeDaPagina(s).then(function (r) { rx.rede = r; }).then(feito, falhou);
    } else { rxDesenhar(s); feito(); }
  }

  /* a Rede vem do processo principal (CDP: método, status, cabeçalhos, corpo) quando ele existe; senão, da própria página */
  function redeDaPagina(s) {
    var local = naPagina(s, 'rede', []).then(function (l) { return { fonte: 'página', itens: (l || []).map(normalizarPedido) }; });
    if (!comModulo(s) || !temApi('raioX')) return local;
    return chamar('raioX', [s.ag.id, { partes: ['rede', 'console'], dom: false }]).then(function (r) {
      var lista = r && (r.rede || r.network || r.pedidos);
      if (!Array.isArray(lista) || !lista.length) return local;
      return { fonte: 'processo principal', itens: lista.map(normalizarPedido) };
    }, function () { return local; });
  }
  function normalizarPedido(p) {
    p = p || {};
    var resp = p.resposta || p.response || {};
    return { url: String(p.url || (p.request && p.request.url) || ''), metodo: String(p.metodo || p.method || (p.request && p.request.method) || ''), status: +(p.status || resp.status || 0),
      tipo: String(p.tipo || p.type || p.resourceType || ''), mime: String(p.mime || p.mimeType || resp.mimeType || ''), bytes: +(p.bytes || p.tamanho || p.size || p.encodedDataLength || 0),
      ms: Math.round(+(p.ms || p.duracao || p.duration || 0)), falhou: p.falhou ? String(p.falhou) : '', doCache: !!p.doCache, redirecionou: p.redirecionou || '', corpo: p.corpo != null ? String(p.corpo) : p.body != null ? String(p.body) : null, cabecalhos: p.cabecalhos || p.headers || resp.headers || null };
  }

  function carregarFilhos(s, i) {
    return naPagina(s, 'filhos', [i]).then(function (l) { if (l) guardarResumos(s.rx, i, l); return l; });
  }
  function carregarAbertos(s, raiz) {
    var rx = s.rx, fila = [raiz], ps = [];
    while (fila.length) {
      var i = fila.shift();
      if (!rx.abertos[i]) continue;
      if (!rx.filhos[i]) ps.push(carregarFilhos(s, i).then(function () { return null; }));
      (rx.filhos[i] || []).forEach(function (f) { if (typeof f === 'number') fila.push(f); });
    }
    return Promise.all(ps);
  }

  function rxDesenhar(s) {
    var rx = s.rx, ui = s.ui.rx;
    if (!ui) return;
    ui.host.textContent = hostDe(s.url) || '—';
    [].forEach.call(ui.abas.children, function (b) { var at = b.dataset.aba === rx.aba; b.classList.toggle('ativo', at); b.setAttribute('aria-selected', at ? 'true' : 'false'); if (b.dataset.aba === 'console') { var n = s.console.filter(function (c) { return c.nivel === 'erro'; }).length; b.textContent = n ? 'Console · ' + n : 'Console'; } });
    ui.bSel.classList.toggle('primario', !!rx.selecionando);
    ui.bSel.lastChild.textContent = rx.selecionando ? 'Apontando… (Esc cancela)' : 'Selecionar elemento';
    desenharCard(s);
    var c = ui.corpo, topo = c.scrollTop, mesma = c.dataset.aba === rx.aba;
    c.textContent = '';
    c.dataset.aba = rx.aba;
    if (rx.erro) c.appendChild(h('p', { class: 'navr-rx-erro', text: 'Não li a página: ' + rx.erro }));
    if (rx.carregando) c.appendChild(h('p', { class: 'navr-rx-lendo', text: 'lendo a página…' }));
    if (rx.aba === 'html') desenharHtml(s, c);
    else if (rx.aba === 'css') desenharCss(s, c);
    else if (rx.aba === 'copy') desenharCopy(s, c);
    else if (rx.aba === 'rede') desenharRede(s, c);
    else desenharConsole(s, c);
    if (mesma) c.scrollTop = topo;
    vigiarDom();
  }

  function desenharCard(s) {
    var rx = s.rx, card = s.ui.rx.card, n = rx.sel && rx.cache[rx.sel];
    card.hidden = !rx.sel;
    card.textContent = '';
    if (!rx.sel) return;
    var e = rx.estilos && rx.estilos.i === rx.sel ? rx.estilos : null;
    card.appendChild(h('div', { class: 'navr-rx-card-l1' }, [h('span', { class: 'rotulo', text: 'Selecionado' }), h('code', { text: e ? e.rotulo : n ? rotuloDe(n) : '#' + rx.sel }),
      e ? h('span', { class: 'navr-rx-medida', text: e.caixa.w + ' × ' + e.caixa.h }) : null]));
    if (e && e.seletor) card.appendChild(h('code', { class: 'navr-rx-seletor', text: e.seletor }));
    card.appendChild(h('div', { class: 'navr-rx-card-acoes' }, [
      h('button', { class: 'navr-mini-bt', type: 'button', text: 'ver HTML', onclick: function () { revelar(s, rx.sel); } }),
      h('button', { class: 'navr-mini-bt', type: 'button', text: 'ver CSS', onclick: function () { rx.aba = 'css'; rxCarregar(s); } }),
      h('button', { class: 'navr-mini-bt', type: 'button', text: 'copiar bloco', onclick: function () { copiarBloco(s, rx.sel); } }),
      h('button', { class: 'navr-mini-bt', type: 'button', text: 'mostrar na página', onclick: function () { naPagina(s, 'destacar', [rx.sel]).catch(function () {}); } })]));
  }
  function rotuloDe(n) {
    if (!n.t) return '#texto';
    var s = n.t, idA = (n.a || []).filter(function (a) { return a[0] === 'id'; })[0], cl = (n.a || []).filter(function (a) { return a[0] === 'class'; })[0];
    if (idA) s += '#' + idA[1];
    if (cl) s += '.' + String(cl[1]).trim().split(/\s+/).slice(0, 3).join('.');
    return s;
  }

  /* ---------- HTML: a árvore viva ---------- */
  function desenharHtml(s, c) {
    var rx = s.rx;
    var busca = h('input', { class: 'navr-rx-busca', type: 'search', placeholder: 'buscar no HTML: tag, #id, .classe, atributo ou texto', value: rx.busca, autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Buscar no HTML' });
    busca.addEventListener('input', function () {
      rx.busca = busca.value;
      clearTimeout(rx._tb);
      rx._tb = setTimeout(function () {
        if (!rx.busca.trim()) { rx.resultados = null; rxDesenhar(s); focarBusca(s); return; }
        var pedido = rx.busca;
        naPagina(s, 'buscar', [pedido]).then(function (r) { if (s.rx !== rx || rx.busca !== pedido) return; /* resposta velha: a pessoa já digitou outra coisa */ rx.resultados = r || []; rxDesenhar(s); focarBusca(s); }).catch(function () {});
      }, 220);
    });
    c.appendChild(busca);
    if (rx.resultados) {
      var porSeletor = rx.resultados.length && rx.resultados[0].seletor;
      var res = h('div', { class: 'navr-rx-resultados' }, [h('p', { class: 'navr-rx-nota', text: rx.resultados.length ? rx.resultados.length + (rx.resultados.length >= 80 ? '+' : '') + (porSeletor ? ' pelo seletor CSS' : ' encontrados') + ' · clique para ir até o nó' : 'nada com "' + rx.busca + '"' })]);
      rx.resultados.forEach(function (r) {
        res.appendChild(h('button', { class: 'navr-rx-res', type: 'button', onclick: function () { revelar(s, r.i); } },
          [h('code', { text: r.rotulo }), r.trecho ? h('span', { text: r.trecho }) : null, r.caminho ? h('small', { text: r.caminho }) : null]));
      });
      c.appendChild(res);
    }
    var arvore = h('div', { class: 'navr-rx-arvore', role: 'tree', 'aria-label': 'DOM da página' });
    if (rx.raiz) desenharNo(s, arvore, rx.raiz, 0);
    c.appendChild(arvore);
    c.appendChild(h('p', { class: 'navr-rx-nota', text: 'DOM vivo: o que muda na página acende aqui · ' + (rx.ms != null ? 'lido em ' + rx.ms + ' ms' : '') }));
  }
  function focarBusca(s) { var b = s.ui.rx.corpo.querySelector('.navr-rx-busca'); if (b) { b.focus(); var n = b.value.length; try { b.setSelectionRange(n, n); } catch (e) { /* segue */ } } }

  function desenharNo(s, alvo, i, nivel) {
    var rx = s.rx, n = rx.cache[i];
    if (!n) return;
    var aberto = !!rx.abertos[i], temFilhos = n.n > 0;
    var linha = h('div', { class: 'navr-no' + (rx.sel === i ? ' sel' : ''), role: 'treeitem', 'aria-expanded': temFilhos ? String(aberto) : null, dataset: { i: String(i) }, style: 'padding-left:' + (6 + nivel * 12) + 'px' });
    var seta = h('button', { class: 'navr-no-seta', type: 'button', tabindex: '-1', 'aria-label': aberto ? 'recolher' : 'abrir', text: temFilhos ? (aberto ? '▾' : '▸') : '', onclick: function (ev) { ev.stopPropagation(); if (temFilhos) alternarNo(s, i); } });
    var cod = h('code', { class: 'navr-no-cod' });
    if (!n.t) cod.appendChild(h('span', { class: 'navr-no-txt', text: '"' + n.x + '"' }));
    else {
      cod.appendChild(h('span', { class: 'navr-no-tag', text: '<' + n.t }));
      (n.a || []).forEach(function (a) { cod.appendChild(document.createTextNode(' ')); cod.appendChild(h('span', { class: 'navr-no-at', text: a[0] })); if (a[1] !== '') { cod.appendChild(document.createTextNode('=')); cod.appendChild(h('span', { class: 'navr-no-val', text: '"' + a[1] + '"' })); } });
      cod.appendChild(h('span', { class: 'navr-no-tag', text: '>' }));
      if (n.x) { cod.appendChild(h('span', { class: 'navr-no-txt', text: n.x })); cod.appendChild(h('span', { class: 'navr-no-tag', text: '</' + n.t + '>' })); }
      else if (temFilhos && !aberto) cod.appendChild(h('span', { class: 'navr-no-mais', text: '…' + n.n + '</' + n.t + '>' }));
    }
    var acoes = h('span', { class: 'navr-no-acoes' }, [
      h('button', { class: 'navr-mini-bt', type: 'button', text: 'copiar', title: 'copiar este bloco (outerHTML)', onclick: function (ev) { ev.stopPropagation(); copiarBloco(s, i); } }),
      h('button', { class: 'navr-mini-bt', type: 'button', text: '⌖', title: 'mostrar na página', 'aria-label': 'mostrar na página', onclick: function (ev) { ev.stopPropagation(); naPagina(s, 'destacar', [i]).catch(function () {}); } })]);
    linha.appendChild(seta); linha.appendChild(cod); linha.appendChild(acoes);
    linha.addEventListener('click', function () { selecionarNo(s, i); });
    linha.addEventListener('dblclick', function () { if (temFilhos) alternarNo(s, i); });
    alvo.appendChild(linha);
    if (aberto && rx.filhos[i]) {
      rx.filhos[i].forEach(function (f) {
        if (typeof f === 'number') desenharNo(s, alvo, f, nivel + 1);
        else if (f && f.mais) alvo.appendChild(h('div', { class: 'navr-no navr-no-resto', style: 'padding-left:' + (18 + (nivel + 1) * 12) + 'px', text: '+ ' + f.mais + ' nós não mostrados' }));
      });
      if (n.t && !n.x) alvo.appendChild(h('div', { class: 'navr-no navr-no-fecha', style: 'padding-left:' + (18 + nivel * 12) + 'px' }, [h('code', {}, [h('span', { class: 'navr-no-tag', text: '</' + n.t + '>' })])]));
    }
  }
  function alternarNo(s, i) {
    var rx = s.rx;
    rx.abertos[i] = !rx.abertos[i];
    if (rx.abertos[i] && !rx.filhos[i]) carregarFilhos(s, i).then(function () { rxDesenhar(s); }).catch(function () {});
    else rxDesenhar(s);
  }
  function selecionarNo(s, i) {
    s.rx.sel = i;
    s.rx.estilos = null;
    carregarEstilos(s, i).then(function (e) { if (s.rx.sel === i) { s.rx.estilos = e; rxDesenhar(s); } }).catch(function () { rxDesenhar(s); });
    rxDesenhar(s);
  }
  /* estilos calculados lidos na página; as regras que casam vêm do CDP (módulo principal) quando ele existe:
     ele lê folhas de outra origem, a linha de cada regra, o que é herdado e as fontes que o motor usou de verdade */
  function carregarEstilos(s, i) {
    return naPagina(s, 'estilos', [i]).then(function (e) {
      if (!e || !comModulo(s) || !temApi('raioX')) return e;
      var em = s.rx.elementoModulo;
      if (em && em.seletor === e.seletor && em.dados && em.dados.regras) { e.modulo = em.dados; return e; }
      return chamar('raioX', [s.ag.id, { seletor: e.seletor, dom: false, partes: ['elemento'] }]).then(function (r) {
        if (r && r.elemento) e.modulo = r.elemento;
        return e;
      }, function () { return e; });
    });
  }
  /* abre a árvore até o nó, seleciona e mostra na página */
  function revelar(s, i) {
    var rx = s.rx;
    rx.aba = 'html';
    var comecar = rx.raiz ? Promise.resolve() : naPagina(s, 'raiz', []).then(function (r) { rx.raiz = r.raiz.i; rx.cache[r.raiz.i] = r.raiz; rx.mut = r.mut; });
    return comecar.then(function () { return naPagina(s, 'caminho', [i]); }).then(function (ids) {
      ids = ids || [];
      var cadeia = Promise.resolve();
      ids.slice(0, -1).forEach(function (a) {
        cadeia = cadeia.then(function () { rx.abertos[a] = true; if (!rx.filhos[a]) return carregarFilhos(s, a); });
      });
      return cadeia;
    }).then(function () {
      selecionarNo(s, i);
      var linha = s.ui.rx.corpo.querySelector('.navr-no[data-i="' + i + '"]');
      if (linha) { linha.scrollIntoView({ block: 'center' }); var Org = O(); if (Org) Org.acender(linha, 6000); }
      naPagina(s, 'destacar', [i]).catch(function () {});
      emitir({ tipo: 'revelado', agente: s.ag.id, i: i });
    }).catch(function (e) { s.rx.erro = (e && e.message) || String(e); rxDesenhar(s); });
  }
  function copiarBloco(s, i) {
    naPagina(s, 'outer', [i]).then(function (t) {
      if (t == null) { aviso('Esse nó não existe mais na página.'); return; }
      copiar(t).then(function () { aviso('Bloco copiado · ' + t.length.toLocaleString('pt-BR') + ' caracteres'); emitir({ tipo: 'copiado', agente: s.ag.id, texto: t }); });
    }).catch(function () {});
  }

  /* DOM vivo: enquanto a aba HTML do Raio-X está à vista, a cada 1,5 s pergunta à página o que mudou e acende a linha.
     Fora disso o relógio não existe (R1: em repouso nada roda; aba oculta ou Raio-X fechado = parado). */
  var relogioDom = null;
  function vigiarDom() {
    var ref = refAtiva(), s = ref && S[ref];
    var precisa = !!(s && s.rx.aberto && s.rx.aba === 'html' && !document.hidden && camada().classList.contains('visivel'));
    if (precisa && !relogioDom) relogioDom = setInterval(passoDom, 1500);
    else if (!precisa && relogioDom) { clearInterval(relogioDom); relogioDom = null; }
  }
  function passoDom() {
    if (document.hidden) { vigiarDom(); return; }
    var ref = refAtiva(), s = ref && S[ref];
    if (!s || !s.rx.aberto || s.rx.aba !== 'html') { vigiarDom(); return; }
    if (!s.rx.raiz || s.rx.carregando || s.rx.selecionando) return;
    naPagina(s, 'estado', []).then(function (st) {
      if (!st || st.mut === s.rx.mut) return;
      s.rx.mut = st.mut;
      var rx = s.rx, recarregar = {};
      (st.mudados || []).forEach(function (i) {
        if (rx.abertos[i] && rx.filhos[i]) recarregar[i] = true;
        else if (rx.pai[i] != null && rx.abertos[rx.pai[i]]) recarregar[rx.pai[i]] = true;
      });
      var ids = Object.keys(recarregar).slice(0, 40).map(Number);
      if (!ids.length) return;
      return Promise.all(ids.map(function (i) { return carregarFilhos(s, i); })).then(function () {
        rxDesenhar(s);
        var Org = O();
        (st.mudados || []).forEach(function (i) {
          var l = s.ui.rx.corpo.querySelector('.navr-no[data-i="' + i + '"]');
          if (l) { l.classList.add('mudou'); if (Org) Org.acender(l, 6000); }
        });
        emitir({ tipo: 'dom-vivo', agente: s.ag.id, mudados: st.mudados || [] });
      });
    }).catch(function () {});
  }

  /* ---------- CSS: o elemento, as fontes e as cores ---------- */
  function secao(titulo, filhos) { return h('section', { class: 'navr-rx-sec' }, [h('h4', { class: 'rotulo', text: titulo })].concat(filhos || [])); }
  function ehCor(v) { return /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\(|oklch\(|color\()/i.test(String(v).trim()); }
  function amostra(cor) { var a = h('i', { class: 'navr-amostra', 'aria-hidden': 'true' }); a.style.backgroundColor = cor; return a; }
  function desenharCss(s, c) {
    var e = s.rx.estilos, p = s.rx.pagina;
    if (!e) return;
    c.appendChild(secao('Elemento', [h('div', { class: 'navr-css-el' }, [h('code', { text: e.rotulo }), h('span', { text: e.caixa.w + ' × ' + e.caixa.h + ' px · margem ' + e.margem + ' · recuo ' + e.recuo }), e.texto ? h('small', { text: '"' + e.texto + '"' }) : null])]));
    var tab = h('div', { class: 'navr-css-props' });
    e.computado.forEach(function (kv) {
      var v = h('span', { class: 'navr-css-v' });
      if (ehCor(kv[1])) v.appendChild(amostra(kv[1]));
      v.appendChild(document.createTextNode(kv[1]));
      tab.appendChild(h('span', { class: 'navr-css-k', text: kv[0] }));
      tab.appendChild(v);
    });
    c.appendChild(secao('Estilos calculados', [tab]));
    var regras = h('div', { class: 'navr-css-regras' });
    function declaracao(nome, val, importante) {
      var linha = h('span', {}, [h('i', { text: nome }), ': ']);
      if (ehCor(val)) linha.appendChild(amostra(val));
      linha.appendChild(document.createTextNode(val + (importante ? ' !important' : '')));
      return linha;
    }
    var m = e.modulo;
    var lista = m && Array.isArray(m.regras) ? m.regras.map(function (r) {
      return { sel: r.seletor, origem: String(r.origem || '').split('?')[0].split('/').pop() + (r.linha ? ':' + r.linha : ''), midia: r.midia || '', props: (r.propriedades || []).map(function (p) { return [p.nome, p.valor, p.importante]; }) };
    }) : e.regras.map(function (r) {
      return { sel: r.sel, origem: r.origem, midia: r.midia, props: String(r.decl).split(/;\s*/).filter(Boolean).map(function (d) { var k = d.indexOf(':'); return [d.slice(0, k).trim(), d.slice(k + 1).trim(), false]; }) };
    });
    if (!lista.length) regras.appendChild(h('p', { class: 'navr-rx-nota', text: 'nenhuma regra própria: o elemento herda os estilos do navegador' }));
    lista.forEach(function (r) {
      regras.appendChild(h('div', { class: 'navr-css-regra' }, [h('b', { text: r.sel }), h('small', { text: r.origem + (r.midia ? ' · ' + r.midia : '') })].concat(r.props.map(function (p) { return declaracao(p[0], p[1], p[2]); }))));
    });
    if (m && m.regrasDoNavegador) regras.appendChild(h('p', { class: 'navr-rx-nota', text: '+ ' + m.regrasDoNavegador + ' regra(s) do próprio navegador (user-agent)' }));
    if (!m && e.bloqueadas) regras.appendChild(h('p', { class: 'navr-rx-nota', text: e.bloqueadas + ' folha(s) de outra origem não deixam ler as regras (os estilos calculados acima valem assim mesmo)' }));
    c.appendChild(secao('Regras que casam · ' + lista.length + (m ? ' · lidas pelo CDP' : ''), [regras]));
    if (m && m.herdadas && m.herdadas.length) {
      var her = h('div', { class: 'navr-css-regras' });
      m.herdadas.forEach(function (r) { her.appendChild(h('div', { class: 'navr-css-regra herdada' }, [h('b', { text: r.seletor }), h('small', { text: 'herdada de ' + r.nivel + ' nível(is) acima · ' + String(r.origem || '').split('/').pop() })].concat((r.propriedades || []).map(function (p) { return declaracao(p.nome, p.valor, p.importante); })))); });
      c.appendChild(secao('Herdado', [her]));
    }
    if (m && m.fontesRenderizadas && m.fontesRenderizadas.length) {
      c.appendChild(secao('Fontes que desenham este texto', [h('div', { class: 'navr-css-fontes' }, m.fontesRenderizadas.map(function (f) {
        return h('div', { class: 'navr-css-fonte' }, [h('b', { text: f.familia }), h('span', { text: f.glifos + ' glifos · ' + (f.daPagina ? 'fonte da página' : 'fonte do sistema') }), f.postScript ? h('small', { class: 'navr-pilha', text: f.postScript }) : null]);
      }))]));
    }
    if (p) {
      var fontes = h('div', { class: 'navr-css-fontes' });
      p.fontes.forEach(function (f) { fontes.appendChild(h('div', { class: 'navr-css-fonte' }, [h('b', { text: f.familia }), h('span', { text: f.n + ' elementos · pesos ' + f.pesos }), h('small', { text: 'tamanhos ' + f.tamanhos }), h('small', { class: 'navr-pilha', text: f.pilha })])); });
      if (p.faces.length) fontes.appendChild(h('p', { class: 'navr-rx-nota', text: 'arquivos de fonte: ' + p.faces.map(function (f) { return f.familia + ' ' + f.peso + (f.estilo !== 'normal' ? ' ' + f.estilo : '') + ' (' + (f.estado === 'loaded' ? 'carregada' : f.estado) + ')'; }).join(' · ') }));
      c.appendChild(secao('Fontes da página', [fontes]));
      var cores = h('div', { class: 'navr-css-cores' });
      p.cores.forEach(function (k) {
        var papeis = [k.texto ? 'texto ' + k.texto : '', k.fundo ? 'fundo ' + k.fundo : '', k.borda ? 'borda ' + k.borda : ''].filter(Boolean).join(' · ');
        cores.appendChild(h('button', { class: 'navr-cor', type: 'button', title: 'copiar ' + k.cor, onclick: function () { copiar(k.cor).then(function () { aviso('Cor ' + k.cor + ' copiada'); }); } }, [amostra(k.cor), h('code', { text: k.cor }), h('small', { text: papeis })]));
      });
      c.appendChild(secao('Cores da página · ' + p.amostra + ' elementos lidos', [cores]));
    }
  }

  /* ---------- Copy: os textos em ordem, por seção ---------- */
  var TIPOS_COPY = { titulo: 'título', subtitulo: 'subtítulo', paragrafo: 'parágrafo', item: 'item', citacao: 'citação', legenda: 'legenda', botao: 'botão', link: 'link', campo: 'campo', celula: 'célula', imagem: 'imagem' };
  function nomeSecao(sec) {
    var base = { header: 'Topo', nav: 'Menu', footer: 'Rodapé', form: 'Formulário', main: 'Conteúdo', aside: 'Lateral', body: 'Página' }[sec.tag];
    if (sec.titulo && sec.tag !== 'nav' && sec.tag !== 'footer') return (base ? base + ' · ' : '') + sec.titulo;
    return base || sec.rotulo;
  }
  function desenharCopy(s, c) {
    var cp = s.rx.copy;
    if (!cp) return;
    c.appendChild(h('div', { class: 'navr-rx-linha-acoes' }, [
      h('button', { class: 'botao primario', type: 'button', text: 'Exportar Markdown', title: 'grava copy.md em Clones/' + pastaDoSite(s.url) + '/ e copia', onclick: function () { exportarCopy(s); } }),
      h('button', { class: 'botao', type: 'button', text: 'Copiar tudo', onclick: function () { copiar(copyMarkdown(s)).then(function () { aviso('Copy copiada em Markdown'); }); } }),
      h('span', { class: 'navr-rx-nota', text: cp.itens.length + ' textos em ordem' })]));
    var atual = null, bloco = null;
    cp.itens.forEach(function (it) {
      if (!atual || atual !== it.secao.i) { atual = it.secao.i; bloco = h('div', { class: 'navr-copy-sec' }, [h('span', { class: 'rotulo', text: nomeSecao(it.secao) })]); c.appendChild(bloco); }
      bloco.appendChild(h('p', { class: 'navr-copy-it t-' + it.tipo }, [h('small', { text: TIPOS_COPY[it.tipo] + (it.nivel ? ' h' + it.nivel : '') }), h('span', { text: it.texto })]));
    });
  }
  function copyMarkdown(s) {
    var cp = s.rx.copy || { itens: [], url: s.url, titulo: s.titulo }, d = new Date();
    var md = ['# Copy de ' + pastaDoSite(cp.url || s.url), '', '> ' + (cp.url || s.url) + (cp.titulo ? ' · "' + cp.titulo + '"' : '') + ' · extraída pelo navegador do ' + NOME_APP + ' em ' + dois(d.getDate()) + '/' + dois(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + hora(), ''];
    var atual = null;
    cp.itens.forEach(function (it) {
      if (atual !== it.secao.i) { atual = it.secao.i; md.push('', '## ' + nomeSecao(it.secao), ''); }
      var t = it.texto.replace(/\n+/g, ' ');
      if (it.tipo === 'titulo') md.push('### ' + t);
      else if (it.tipo === 'subtitulo') md.push('#### ' + t);
      else if (it.tipo === 'paragrafo') md.push(t, '');
      else if (it.tipo === 'citacao') md.push('> ' + t, '');
      else if (it.tipo === 'legenda') md.push('_' + t + '_', '');
      else md.push('- ' + (it.tipo === 'item' || it.tipo === 'celula' ? '' : '[' + TIPOS_COPY[it.tipo] + '] ') + t);
    });
    return md.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }
  function gravar(rel, conteudo) {
    return fetch('/api/arquivo?caminho=' + encodeURIComponent(rel), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conteudo: conteudo }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.erro || 'HTTP ' + r.status); return j; }); });
  }
  function exportarCopy(s) {
    var feito = s.rx.copy ? Promise.resolve() : naPagina(s, 'copy', []).then(function (r) { s.rx.copy = r; });
    return feito.then(function () {
      var md = copyMarkdown(s), rel = 'Clones/' + pastaDoSite(s.url) + '/copy.md';
      return gravar(rel, md).then(function () {
        copiar(md).catch(function () {});
        aviso('copy.md salvo em ' + rel + ' · ' + s.rx.copy.itens.length + ' textos (também copiado)');
        adicionarPasso(s, { texto: '✓ copy.md em ' + rel, quem: 'pessoa', pasta: rel });
        emitir({ tipo: 'copy', agente: s.ag.id, caminho: rel, bytes: md.length });
        return rel;
      });
    }).catch(function (e) { aviso('Não gravei o copy.md: ' + ((e && e.message) || e)); });
  }

  /* ---------- Rede ---------- */
  function desenharRede(s, c) {
    var rd = s.rx.rede;
    if (!rd) return;
    var total = rd.itens.reduce(function (t, p) { return t + (p.bytes || 0); }, 0);
    var filtro = h('input', { class: 'navr-rx-busca', type: 'search', placeholder: 'filtrar por endereço, tipo ou status', value: s.rx.filtroRede || '', 'aria-label': 'Filtrar pedidos' });
    filtro.addEventListener('input', function () { s.rx.filtroRede = filtro.value; clearTimeout(s.rx._tr); s.rx._tr = setTimeout(function () { rxDesenhar(s); var f = s.ui.rx.corpo.querySelector('.navr-rx-busca'); if (f) { f.focus(); f.setSelectionRange(f.value.length, f.value.length); } }, 150); });
    c.appendChild(filtro);
    c.appendChild(h('p', { class: 'navr-rx-nota', text: rd.itens.length + ' pedidos · ' + kb(total) + ' · fonte: ' + (rd.fonte === 'página' ? 'medições da própria página' : 'processo principal (CDP)') }));
    var q = String(s.rx.filtroRede || '').toLowerCase();
    var lista = h('div', { class: 'navr-rede' });
    rd.itens.forEach(function (p, k) {
      if (q && (p.url + ' ' + p.tipo + ' ' + p.status + ' ' + p.mime).toLowerCase().indexOf(q) < 0) return;
      var nome = p.url.replace(/^https?:\/\/[^\/]+/, '') || '/';
      var aberto = s.rx.reqSel === k;
      var st = p.falhou ? 'falhou' : p.status ? String(p.status) : '—';
      lista.appendChild(h('button', { class: 'navr-req' + (aberto ? ' ativo' : ''), type: 'button', title: p.url, onclick: function () { s.rx.reqSel = aberto ? null : k; rxDesenhar(s); } }, [
        h('b', { text: p.metodo || 'GET' }), h('i', { class: 'st' + (p.falhou || p.status >= 400 ? ' ruim' : p.status >= 200 ? ' bom' : ''), text: st }), h('span', { class: 'navr-req-nome', text: nome }),
        h('small', { text: [p.tipo, p.mime].filter(Boolean).join(' · ') + ' · ' + kb(p.bytes) + ' · ' + p.ms + ' ms' + (p.doCache ? ' · do cache' : '') + (p.falhou ? ' · ' + p.falhou : '') + (p.redirecionou ? ' · → ' + p.redirecionou : '') })]));
      if (aberto) {
        var det = h('div', { class: 'navr-req-det' }, [h('code', { class: 'navr-req-url', text: p.url })]);
        if (p.cabecalhos) det.appendChild(h('pre', { text: Object.keys(p.cabecalhos).map(function (k2) { return k2 + ': ' + p.cabecalhos[k2]; }).join('\n') }));
        var resp = s.rx.resp[p.url];
        if (p.corpo != null) det.appendChild(h('pre', { class: 'navr-resp', text: p.corpo.slice(0, 20000) }));
        else if (resp) det.appendChild(h('pre', { class: 'navr-resp', text: resp.erro ? 'não li: ' + resp.erro : '[' + resp.status + ' · ' + resp.mime + ' · ' + resp.total + ' caracteres · relido pela página]\n' + resp.corpo }));
        else if (!p.metodo || p.metodo === 'GET') det.appendChild(h('button', { class: 'navr-mini-bt', type: 'button', text: 'ver a resposta', onclick: function () { naPagina(s, 'resposta', [p.url]).then(function (r) { s.rx.resp[p.url] = r; rxDesenhar(s); }).catch(function () {}); } }));
        lista.appendChild(det);
      }
    });
    c.appendChild(lista);
  }

  /* ---------- Console ---------- */
  function desenharConsole(s, c) {
    var f = s.rx.consoleFiltro;
    var filtros = h('div', { class: 'alternar navr-console-filtros' }, [['todos', 'Tudo'], ['erro', 'Erros'], ['aviso', 'Avisos'], ['log', 'Logs']].map(function (x) {
      var n = x[0] === 'todos' ? s.console.length : s.console.filter(function (m) { return m.nivel === x[0]; }).length;
      return h('button', { type: 'button', class: f === x[0] ? 'ativo' : '', text: x[1] + ' ' + n, onclick: function () { s.rx.consoleFiltro = x[0]; rxDesenhar(s); } });
    }));
    c.appendChild(h('div', { class: 'navr-rx-linha-acoes' }, [filtros, h('button', { class: 'navr-mini-bt', type: 'button', text: 'limpar', onclick: function () { s.console = []; rxDesenhar(s); } })]));
    var lista = h('div', { class: 'navr-console' });
    var itens = s.console.filter(function (m) { return f === 'todos' || m.nivel === f || (f === 'log' && m.nivel === 'debug'); });
    if (!itens.length) lista.appendChild(h('p', { class: 'navr-rx-nota', text: 'nada no console desde que a página abriu' }));
    itens.slice(-400).forEach(function (m) {
      lista.appendChild(h('div', { class: 'navr-log n-' + m.nivel }, [h('b', { text: m.nivel }), h('span', { text: m.texto }), h('small', { text: (m.fonte ? m.fonte + (m.linha ? ':' + m.linha : '') + ' · ' : '') + horaSeg(m.ts) })]));
    });
    c.appendChild(lista);
    lista.scrollTop = lista.scrollHeight;
  }

  /* ---------- Selecionar elemento ---------- */
  /* "Selecionar elemento": com o módulo principal, o modo inspeção do próprio Chromium (realce com medidas, regras pelo CDP);
     sem ele, um contorno desenhado na página. Nos dois, o nó escolhido abre na árvore e no CSS. */
  function rxSelecionar(s) {
    var rx = s.rx;
    rx.selecionando = true;
    rx.viaModulo = comModulo(s) && temApi('selecionar');
    pintar(s); rxDesenhar(s);
    mostrarDica(s, rx.viaModulo ? 'aponte e clique num elemento · o botão cancela' : 'aponte e clique num elemento · Esc cancela');
    emitir({ tipo: 'selecionando', agente: s.ag.id, modulo: rx.viaModulo });
    var escolha = rx.viaModulo
      ? chamar('selecionar', [s.ag.id, true]).then(function (r) {
        if (!r || !r.seletor) return null;
        rx.elementoModulo = r.elemento ? { seletor: r.seletor, dados: r.elemento } : null;
        return naPagina(s, 'porSeletor', [r.seletor]).then(function (i) { return i ? { i: i, rotulo: r.rotulo, seletor: r.seletor } : null; });
      })
      : naPagina(s, 'selecionar', []);
    escolha.then(function (r) {
      rx.selecionando = false;
      pintar(s);
      if (!r) { rxDesenhar(s); return; }
      rx.aberto = true;
      emitir({ tipo: 'selecionado', agente: s.ag.id, rotulo: r.rotulo, seletor: r.seletor, i: r.i, modulo: rx.viaModulo });
      return revelar(s, r.i);
    }).catch(function (e) { rx.selecionando = false; rx.erro = (e && e.message) || String(e); pintar(s); rxDesenhar(s); });
  }
  function rxCancelarSelecao(s) {
    s.rx.selecionando = false;
    if (s.rx.viaModulo) chamar('selecionar', [s.ag.id, false]).catch(function () {});
    else naPagina(s, 'cancelar', []).catch(function () {});
    pintar(s); rxDesenhar(s);
  }
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    var ref = refAtiva(), s = ref && S[ref];
    if (s && s.rx.selecionando) rxCancelarSelecao(s);
  });

  /* ---------- Clonar página, Clonar copy e Print inteiro ---------- */
  function relDoClone(r, s) {
    var t = typeof r === 'string' ? r : r && (r.relativo || r.pasta || r.caminho || r.index || r.arquivo);
    var m = t && /(Clones\/[^\/\\]+)/.exec(String(t).replace(/\\/g, '/'));
    return m ? m[1] : 'Clones/' + pastaDoSite(s.url);
  }
  function clonarPagina(s) {
    if (!s.url || s.url === 'about:blank') { aviso('Abra uma página antes de clonar.'); return Promise.resolve(null); }
    mostrarDica(s, 'clonando ' + hostDe(s.url) + '…');
    var viaApi = comModulo(s) && temApi('clonar') ? limparPagina(s).then(function () { return chamar('clonar', [s.ag.id]); }).then(function (r) { if (r && r.erro) throw new Error(r.erro); return { rel: relDoClone(r, s), completo: true }; }) : Promise.reject(new Error('sem módulo'));
    return viaApi.catch(function (e) {
      if (comModulo(s) && temApi('clonar')) console.warn('[navegador-real] clonar pelo processo principal falhou, faço a cópia leve:', e && e.message);
      return clonarLeve(s).then(function (rel) { return { rel: rel, completo: false }; });
    }).then(function (r) {
      if (!r.completo) adicionarPasso(s, { texto: '✓ página clonada em ' + r.rel + '/ (cópia leve: imagens e fontes no endereço original)', quem: 'pessoa', pasta: r.rel });
      emitir({ tipo: 'clonado', agente: s.ag.id, pasta: r.rel, completo: r.completo });
      abrirClone(r.rel);
      return r.rel;
    }).catch(function (e) { aviso('Não clonei: ' + ((e && e.message) || e)); return null; });
  }
  function limparPagina(s) { return naPagina(s, 'limpar', []).catch(function () { return false; }); }
  function clonarLeve(s) {
    return naPagina(s, 'clonar', []).then(function (r) {
      var rel = 'Clones/' + pastaDoSite(r.url || s.url);
      var ps = [gravar(rel + '/index.html', r.html)];
      if (r.css) ps.push(gravar(rel + '/estilos.css', r.css));
      return Promise.all(ps).then(function () { return rel; });
    });
  }
  function clonarCopy(s) {
    if (!comModulo(s) || !temApi('copy')) return exportarCopy(s);
    return limparPagina(s).then(function () { return chamar('copy', [s.ag.id]); }).then(function (r) {
      var rel = (r && (r.relativo || r.caminho || r.arquivo)) ? String(r.relativo || r.caminho || r.arquivo) : 'Clones/' + pastaDoSite(s.url) + '/copy.md';
      aviso('copy.md salvo · ' + rel.replace(/^.*?(Clones\/)/, '$1') + (r && r.secoes ? ' · ' + r.secoes + ' seções' : ''));
      emitir({ tipo: 'copy', agente: s.ag.id, caminho: rel.replace(/^.*?(Clones\/)/, '$1'), bytes: r && r.bytes, modulo: true });
      return rel;
    }, function () { return exportarCopy(s); });
  }
  function printInteiro(s) {
    if (!comModulo(s) || !temApi('print')) { aviso('Print inteiro precisa do navegador do app (módulo principal); esta versão ainda não tem.'); return Promise.resolve(null); }
    mostrarDica(s, 'fotografando a página inteira…');
    return limparPagina(s).then(function () { return chamar('print', [s.ag.id]); }).then(function (r) {
      var rel = String((r && (r.relativo || r.caminho || r.arquivo)) || r || '');
      aviso('Print salvo · ' + rel.replace(/^.*?(Clones\/)/, '$1') + (r && r.largura ? ' · ' + r.largura + '×' + r.altura : ''));
      emitir({ tipo: 'print', agente: s.ag.id, caminho: rel.replace(/^.*?(Clones\/)/, '$1'), bytes: r && r.bytes, largura: r && r.largura, altura: r && r.altura });
      return rel;
    }).catch(function (e) { aviso('Não fiz o print: ' + ((e && e.message) || e)); return null; });
  }

  /* ================================================================== o clone aberto como site editável (Site | Código) */
  function urlDoServidor(rel) { return location.origin + '/api/arquivo?caminho=' + encodeURIComponent(rel); }
  function resolver(dir, ref, raizClone) {
    ref = String(ref || '').trim();
    if (!ref || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref)) return null;
    var base = ref.charAt(0) === '/' ? raizClone : dir;
    var u;
    try { u = new URL(ref.replace(/^\//, ''), 'http://clone.invalid/' + base.replace(/\/?$/, '/')); } catch (e) { return null; }
    if (u.host !== 'clone.invalid') return null;
    try { return decodeURIComponent(u.pathname.replace(/^\//, '')); } catch (e) { return u.pathname.replace(/^\//, ''); }
  }
  function lerTexto(rel) {
    return fetch('/api/arquivo?caminho=' + encodeURIComponent(rel)).then(function (r) { if (!r.ok) throw new Error(rel + ' não existe'); return r.json(); }).then(function (j) { return String(j.conteudo || ''); });
  }
  function lerDataUri(rel) {
    return fetch('/api/arquivo?caminho=' + encodeURIComponent(rel)).then(function (r) { if (!r.ok) throw new Error(rel); return r.blob(); })
      .then(function (b) { return new Promise(function (ok) { var f = new FileReader(); f.onload = function () { ok(f.result); }; f.readAsDataURL(b); }); });
  }
  var RE_URL = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
  /* reescreve url() de uma folha: fontes viram data: (a página do clone não tem origem, e fonte exige CORS); o resto vai pelo servidor */
  function reescreverCss(css, dir, raizClone, mapa, orcamento) {
    var fontes = [];
    css.replace(RE_URL, function (m, q, u) { var rel = resolver(dir, u, raizClone); if (rel && /\.(woff2?|ttf|otf|eot)(\?|#|$)/i.test(rel)) fontes.push(rel.replace(/[?#].*$/, '')); return m; });
    var uris = {};
    return Promise.all(fontes.map(function (rel) {
      if (orcamento.bytes > 6e6) return null;
      return lerDataUri(rel).then(function (d) { orcamento.bytes += d.length; uris[rel] = d; }).catch(function () {});
    })).then(function () {
      return css.replace(RE_URL, function (m, q, u) {
        var rel = resolver(dir, u, raizClone);
        if (!rel) return m;
        var limpo = rel.replace(/[?#].*$/, '');
        if (uris[limpo]) return 'url("' + uris[limpo] + '")';
        var abs = urlDoServidor(limpo);
        mapa[abs] = u;
        return 'url("' + abs + '")';
      });
    });
  }
  function montarSrcdoc(cl, edicao) {
    var raizClone = cl.rel, mapa = {}, orcamento = { bytes: 0 };
    var doc = new DOMParser().parseFromString(cl.fonte, 'text/html');
    [].forEach.call(doc.querySelectorAll('base'), function (b) { b.remove(); });
    var tarefas = [];
    [].forEach.call(doc.querySelectorAll('link[rel~="stylesheet"][href]'), function (l) {
      var rel = resolver(raizClone, l.getAttribute('href'), raizClone);
      if (!rel) return;
      var dir = rel.split('/').slice(0, -1).join('/');
      tarefas.push(lerTexto(rel.replace(/[?#].*$/, '')).then(function (css) { return reescreverCss(css, dir, raizClone, mapa, orcamento); }).then(function (css) {
        var st = doc.createElement('style');
        st.setAttribute('data-coop-origem', l.getAttribute('href'));
        st.textContent = css;
        l.replaceWith(st);
      }).catch(function () { /* folha que não veio: a página abre sem ela */ }));
    });
    [].forEach.call(doc.querySelectorAll('style'), function (st) { tarefas.push(reescreverCss(st.textContent, raizClone, raizClone, mapa, orcamento).then(function (css) { st.textContent = css; })); });
    [['img', 'src'], ['source', 'src'], ['video', 'src'], ['video', 'poster'], ['audio', 'src'], ['link', 'href'], ['script', 'src'], ['image', 'href'], ['input', 'src']].forEach(function (p) {
      [].forEach.call(doc.querySelectorAll(p[0] + '[' + p[1] + ']'), function (el) {
        if (p[0] === 'link' && /stylesheet/i.test(el.getAttribute('rel') || '')) return;
        var orig = el.getAttribute(p[1]), rel = resolver(raizClone, orig, raizClone);
        if (!rel) return;
        if (p[0] === 'script') { tarefas.push(lerTexto(rel).then(function (js) { el.removeAttribute('src'); el.setAttribute('data-coop-origem', orig); el.textContent = js; }).catch(function () {})); return; }
        var abs = urlDoServidor(rel.replace(/[?#].*$/, ''));
        mapa[abs] = orig;
        el.setAttribute(p[1], abs);
      });
    });
    [].forEach.call(doc.querySelectorAll('[srcset]'), function (el) {
      var orig = el.getAttribute('srcset');
      var novo = orig.split(',').map(function (x) { var q = x.trim().split(/\s+/), rel = resolver(raizClone, q[0], raizClone); if (rel) { var abs = urlDoServidor(rel); mapa[abs] = q[0]; q[0] = abs; } return q.join(' '); }).join(', ');
      el.setAttribute('srcset', novo);
    });
    [].forEach.call(doc.querySelectorAll('[style*="url("]'), function (el) {
      var st = el.getAttribute('style');
      tarefas.push(reescreverCss(st, raizClone, raizClone, mapa, orcamento).then(function (css) { el.setAttribute('style', css); }));
    });
    return Promise.all(tarefas).then(function () {
      if (edicao) {
        var sc = doc.createElement('script');
        sc.setAttribute('data-coop-edicao', '');
        sc.textContent = 'document.designMode="on";addEventListener("message",function(e){var m=e.data||{};if(m.t!=="coop-pegar")return;var b=document.body.cloneNode(true);[].forEach.call(b.querySelectorAll("[data-coop-edicao]"),function(x){x.remove()});parent.postMessage({t:"coop-html",id:m.id,html:b.innerHTML},"*")});';
        (doc.body || doc.documentElement).appendChild(sc);
        var est = doc.createElement('style');
        est.setAttribute('data-coop-edicao', '');
        est.textContent = '*:hover{outline:1px dashed rgba(42,213,229,.55)!important;outline-offset:1px}';
        (doc.head || doc.documentElement).appendChild(est);
      }
      cl.mapa = mapa;
      return '<!doctype html>\n' + doc.documentElement.outerHTML;
    });
  }

  function abrirClone(rel) {
    rel = String(rel || '').replace(/\\/g, '/').replace(/^.*?(Clones\/)/, '$1').replace(/\/+$/, '');
    if (/\/index\.html?$/i.test(rel)) rel = rel.replace(/\/index\.html?$/i, '');
    var chave = 'clone:' + rel, cl = C[chave];
    if (!cl) cl = C[chave] = { chave: chave, rel: rel, host: rel.split('/').pop(), modo: 'site', edicao: false, fonte: '', mapa: {}, salvo: 0 };
    if (!cl.el) montarClone(cl);
    E.abrirAba({ id: chave, tipo: 'navegador', ref: chave, titulo: 'Clone · ' + cl.host, atividade: 'explorador' });
    sincronizar();
    return carregarClone(cl).then(function () { return cl; });
  }
  function montarClone(cl) {
    var modoSite = h('button', { type: 'button', text: 'Site', onclick: function () { trocarModo(cl, 'site'); } });
    var modoCod = h('button', { type: 'button', text: 'Código', onclick: function () { trocarModo(cl, 'codigo'); } });
    var bEditar = h('button', { class: 'botao', type: 'button', text: '✎ Editar na tela', title: 'Clique no texto da página e escreva; Salvar grava no index.html', onclick: function () { cl.edicao = !cl.edicao; desenharClone(cl); } });
    var bSalvar = h('button', { class: 'botao primario', type: 'button', text: 'Salvar', onclick: function () { salvarClone(cl); } });
    var bRec = h('button', { class: 'navr-bt-ic', type: 'button', title: 'Reler do disco', 'aria-label': 'Reler do disco', onclick: function () { carregarClone(cl); } }, [svg(IC.recarregar)]);
    var estado = h('span', { class: 'navr-clone-estado' });
    var barra = h('header', { class: 'navr-barra navr-clone-barra' }, [h('span', { class: 'rotulo', text: 'Clone' }), h('code', { class: 'navr-clone-caminho', text: cl.rel + '/index.html' }),
      h('span', { class: 'alternar navr-clone-modos' }, [modoSite, modoCod]), bEditar, bSalvar, bRec, estado]);
    var iframe = h('iframe', { class: 'navr-clone-site', sandbox: 'allow-scripts', title: 'O clone como site', referrerpolicy: 'no-referrer' });
    var codigo = h('textarea', { class: 'navr-clone-codigo', spellcheck: 'false', 'aria-label': 'Código do index.html', hidden: true });
    codigo.addEventListener('input', function () { cl.sujo = true; pintarClone(cl); });
    var faixa = h('div', { class: 'navr-faixa navr-clone-faixa' }, [h('i', { class: 'navr-ponto', 'aria-hidden': 'true' }), h('span', { class: 'navr-faixa-texto', text: 'o site clonado, servido pela sua Estação · edite e salve: muda no arquivo' })]);
    cl.el = h('section', { class: 'navr-secao navr-clone', dataset: { clone: cl.rel } }, [barra, faixa, h('div', { class: 'navr-clone-corpo' }, [iframe, codigo])]);
    cl.ui = { modoSite: modoSite, modoCod: modoCod, bEditar: bEditar, bSalvar: bSalvar, estado: estado, iframe: iframe, codigo: codigo, faixa: faixa };
    camada().appendChild(cl.el);
  }
  function carregarClone(cl) {
    cl.ui.estado.textContent = 'lendo…';
    return lerTexto(cl.rel + '/index.html').then(function (t) { cl.fonte = t; cl.sujo = false; return desenharClone(cl); })
      .catch(function (e) { cl.ui.estado.textContent = 'não achei ' + cl.rel + '/index.html'; throw e; });
  }
  function trocarModo(cl, modo) {
    if (cl.modo === 'codigo' && modo === 'site' && cl.sujo) cl.fonte = cl.ui.codigo.value;
    cl.modo = modo;
    if (modo === 'codigo') cl.edicao = false;
    desenharClone(cl);
  }
  function pintarClone(cl) {
    var u = cl.ui;
    u.modoSite.classList.toggle('ativo', cl.modo === 'site');
    u.modoCod.classList.toggle('ativo', cl.modo === 'codigo');
    u.bEditar.hidden = cl.modo !== 'site';
    u.bEditar.textContent = cl.edicao ? '✓ Editando na tela' : '✎ Editar na tela';
    u.bEditar.classList.toggle('primario', !!cl.edicao);
    u.bSalvar.disabled = !(cl.edicao || cl.sujo);
    u.estado.textContent = cl.sujo ? 'não salvo' : cl.salvo ? 'salvo · ' + hora(cl.salvo) : '';
    cl.el.classList.toggle('editando', !!cl.edicao);
  }
  function desenharClone(cl) {
    var u = cl.ui;
    pintarClone(cl);
    u.iframe.hidden = cl.modo !== 'site';
    u.codigo.hidden = cl.modo !== 'codigo';
    if (cl.modo === 'codigo') { if (!cl.sujo) u.codigo.value = cl.fonte; return Promise.resolve(); }
    return montarSrcdoc(cl, cl.edicao).then(function (html) { u.iframe.srcdoc = html; emitir({ tipo: 'clone-aberto', pasta: cl.rel, bytes: html.length }); });
  }
  function salvarClone(cl) {
    var feito;
    if (cl.modo === 'codigo') feito = Promise.resolve(cl.ui.codigo.value);
    else if (cl.edicao) feito = pegarEdicao(cl).then(function (corpo) {
      Object.keys(cl.mapa).forEach(function (abs) { corpo = corpo.split(abs.replace(/&/g, '&amp;')).join(cl.mapa[abs]).split(abs).join(cl.mapa[abs]); });
      var m = /(<body[^>]*>)([\s\S]*)(<\/body>)/i.exec(cl.fonte);
      return m ? cl.fonte.slice(0, m.index) + m[1] + '\n' + corpo + '\n' + m[3] + cl.fonte.slice(m.index + m[0].length) : cl.fonte.replace(/<\/html>\s*$/i, '') + corpo;
    });
    else return Promise.resolve(false);
    return feito.then(function (novo) {
      return gravar(cl.rel + '/index.html', novo).then(function () {
        cl.fonte = novo; cl.sujo = false; cl.salvo = Date.now();
        var Org = O(); if (Org) Org.acender(cl.ui.faixa, 6000);
        aviso('Salvo em ' + cl.rel + '/index.html');
        emitir({ tipo: 'clone-salvo', pasta: cl.rel, bytes: novo.length });
        return desenharClone(cl).then(function () { return true; });
      });
    }).catch(function (e) { aviso('Não salvei: ' + ((e && e.message) || e)); return false; });
  }
  function pegarEdicao(cl) {
    return new Promise(function (ok, erro) {
      var id = 'e' + Date.now(), janela = cl.ui.iframe.contentWindow, t = setTimeout(function () { window.removeEventListener('message', ouvir); erro(new Error('a página do clone não respondeu')); }, 3000);
      function ouvir(ev) {
        if (ev.source !== janela || !ev.data || ev.data.t !== 'coop-html' || ev.data.id !== id) return;
        clearTimeout(t); window.removeEventListener('message', ouvir);
        ok(String(ev.data.html || ''));
      }
      window.addEventListener('message', ouvir);
      janela.postMessage({ t: 'coop-pegar', id: id }, '*');
    });
  }

  /* ================================================================== área de transferência */
  function copiar(texto) {
    texto = String(texto == null ? '' : texto);
    BC.navegadorReal.ultimaCopia = texto;
    /* no app, a cópia vai pelo processo principal (vale mesmo com o foco dentro do webview); fora dele, o navigator.clipboard */
    var ce = window.coopElectron;
    var principal = ce && typeof ce.copiar === 'function' ? Promise.resolve(ce.copiar(texto)).then(function (ok) { if (!ok) throw new Error('recusado'); }) : Promise.reject(new Error('sem app'));
    var viaApi = principal.catch(function () { return navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(texto) : Promise.reject(new Error('sem clipboard')); });
    return viaApi.catch(function () {
      var ta = h('textarea', { style: 'position:fixed;left:-9999px;top:0;opacity:0' });
      ta.value = texto; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) { /* sem cópia */ }
      ta.remove();
    });
  }

  /* ================================================================== eventos para quem acompanha (testes, presença local) */
  function emitir(ev) { ev.ts = ev.ts || Date.now(); ouvintes.forEach(function (fn) { try { fn(ev); } catch (e) { /* segue */ } }); }

  /* ================================================================== ligações: o que chega do processo principal e do servidor */
  /* o agente pode chegar como id ('aurora') com o nome ao lado ({agente:'aurora', nome:'Aurora'}) ou como objeto */
  function agenteDoEvento(p) {
    if (p && typeof p.agente === 'object' && p.agente) return p.agente;
    return { id: idAgente(p && p.agente != null ? p.agente : p), nome: p && p.nome, cor: p && p.cor };
  }
  function aoPasso(p, origem) {
    if (!p) return;
    var ag = agenteDoEvento(p), id = idAgente(ag);
    var s = S[id];
    /* passo do módulo para um agente sem aba aqui: o webview dele é de outra tela (ou de um teste). Abrir uma aba nossa
       roubaria o registro; quando o módulo precisa de aba ele pede ('navegador:aba' → aoPedidoDeAba) */
    if (!s && origem === 'modulo') return;
    if (!s) { abrir(ag, null, { mostrar: true }); s = S[id]; }
    if (!s) return;
    /* a pessoa fechou a aba e o agente continua: a aba volta para a fila (sem roubar a vez da aba ativa) */
    if (!(E.ui.abas || []).some(function (t) { return t.id === 'nav:' + id; })) { E.ui.abas.push({ id: 'nav:' + id, tipo: 'navegador', ref: id, titulo: 'Navegador · ' + s.ag.nome, atividade: 'terminais' }); E.render(); }
    if (p.url && p.feito) s.url = p.url;
    adicionarPasso(s, { texto: p.texto || p.descricao, alvo: p.alvo, ts: p.ts, tipo: p.tipo, feito: p.feito, pasta: p.pasta || p.arquivo, quem: p.quem, origem: origem });
  }
  function aoEstado(e) {
    if (!e) return;
    var s = S[idAgente(e.agente != null ? e.agente : e)];
    if (!s) return;
    if (e.controlador) s.assumido = e.controlador === 'pessoa';
    else if (e.assumido != null) s.assumido = !!e.assumido;
    if (e.suaVez === false) s.suaVezEncerrada = false;
    if (e.suaVez != null) s.suaVez = !!e.suaVez && !s.suaVezEncerrada;
    if (e.senha && !s.suaVezEncerrada) { s.suaVez = true; s.senha = e.senha; }
    if (e.url) s.url = e.url;
    if (e.titulo != null) s.titulo = e.titulo;
    if (e.carregando != null) s.carregando = !!e.carregando;
    if (e.registrado === false && e.motivo && s.registrado) { s.registrado = false; s.wcIdSolto = s.wcId; }
    if (e.selecionando != null && !e.selecionando && s.rx.selecionando && s.rx.viaModulo) { /* a seleção terminou lá (clique ou prazo): a promessa de selecionar resolve em seguida */ }
    pintar(s);
  }
  function aoPedidoDeAba(p) {
    if (!p) return Promise.resolve(null);
    return abrir(agenteDoEvento(p), p.url || null, { mostrar: p.mostrar !== false, quem: 'agente' });
  }
  function ligarApi() {
    if (!api() || ligarApi.feito) return;
    ligarApi.feito = true;
    assinar(['aoPasso', 'onPasso'], function (p) { aoPasso(p, 'modulo'); });
    assinar(['aoEstado', 'onEstado'], aoEstado);
    assinar(['aoPedirAba', 'aoAbrir', 'aoPedido', 'onAbrir'], aoPedidoDeAba);
    /* o processo principal pode reiniciar a partição ou perder o registro: re-registra quem já existe */
    Object.keys(S).forEach(function (k) { registrar(S[k]); });
  }
  if (BC.real && BC.real.ouvir) BC.real.ouvir(function (m) {
    if (!m || typeof m.tipo !== 'string' || m.tipo.indexOf('navegador-') !== 0) return;
    if (m.tipo === 'navegador-abrir') aoPedidoDeAba(m);
    else if (m.tipo === 'navegador-passo') aoPasso(m);
    else if (m.tipo === 'navegador-estado') aoEstado(m);
  });

  /* ================================================================== a vista da Estação: o meio mostra a camada */
  function avisoSemApp() {
    return '<div class="pagina navr-so-app"><span class="rotulo">Navegador</span><h1 class="pagina-titulo">Navegador só no app</h1>' +
      '<p class="pagina-sub">O navegador do agente roda dentro da Estação, no computador (app ' + NOME_APP + '). Aqui você acompanha pelos avisos e pelo terminal.</p></div>';
  }
  var vistaAntiga = BC.vistas.navegador || {};
  BC.vistas.navegador = {
    lateral: function (tab) { return vistaAntiga.lateral ? vistaAntiga.lateral(tab) : ''; },
    conteudo: function (tab) {
      if (!ELETRON) return avisoSemApp();
      var ref = String(tab.ref || '');
      if (ref.indexOf('clone:') === 0 && !C[ref]) { setTimeout(function () { abrirClone(ref.slice(6)); }, 0); }
      else if (ref.indexOf('clone:') !== 0 && !S[ref] && webviewLigado()) { setTimeout(function () { abrir({ id: ref }, null, { mostrar: false }); }, 0); }
      return '<div class="navr-lugar" aria-hidden="true"></div>';
    },
    montar: function () { sincronizar(); }
  };
  /* a Estação chama BC.navegador.abrir (terminal simulado) e atualizar (a cada render da aba): o real atende os dois */
  BC.navegador = {
    sessoes: {},            /* vazio de propósito: com ele vazio, a Estação não remonta a aba (e o webview não morre) */
    real: true,
    abrir: function (ag, url) { if (!ELETRON) { E.abrirAba({ id: 'nav:' + idAgente(ag), tipo: 'navegador', ref: idAgente(ag) || 'navegador', titulo: 'Navegador', atividade: 'terminais' }); return null; } return abrir(ag, url, { mostrar: true }); },
    atualizar: function () { sincronizar(); },
    clonar: function (ag) { var s = S[idAgente(ag)]; return s ? clonarPagina(s) : Promise.resolve(null); }
  };
  BC.formularios = BC.formularios || {};
  BC.formularios['nav-ir'] = function () {
    var campo = document.getElementById('nav-url-nova'), u = urlSegura(campo ? campo.value : '');
    if (!ELETRON) { aviso('Navegador só no app.'); return; }
    if (!u) { aviso('Endereço inválido: só http e https.'); return; }
    var p = L() && L().pessoa ? L().pessoa(eu()) : null, ag = ((p && p.agentes) || [])[0] || { id: 'navegador', nome: 'Navegador' };
    abrir(ag, u, { mostrar: true, quem: 'você' }).then(function () { var s = S[idAgente(ag)]; if (s && !s.assumido) assumir(s); });
  };

  /* a Estação redesenha: a camada acompanha (troca de aba, lateral recolhida, painel arrastado) */
  var renderOriginal = E.render;
  E.render = function () {
    var r = renderOriginal.apply(this, arguments);
    try { sincronizar(); } catch (e) { console.warn('[navegador-real] sincronizar:', e); }
    return r;
  };
  window.addEventListener('resize', function () { posicionar(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) sincronizar(); else vigiarDom(); });

  /* ================================================================== API pública (coop-ui.js, presença, testes) */
  BC.navegadorReal = {
    versao: '1.0.0',
    disponivel: function () { return webviewLigado(); },
    noApp: function () { return ELETRON; },
    comModulo: function () { return !!api(); },
    abrir: function (agente, url, opcoes) { return abrir(agente, url, opcoes); },
    sessao: function (id) { var s = S[idAgente(id)]; return s ? { agente: s.ag, url: s.url, titulo: s.titulo, assumido: s.assumido, suaVez: s.suaVez, fim: s.fim, carregando: s.carregando, registrado: s.registrado, webContentsId: s.wcId, passos: s.passos.slice(), console: s.console.slice(), raiox: { aberto: s.rx.aberto, aba: s.rx.aba, sel: s.rx.sel, selecionando: s.rx.selecionando } } : null; },
    sessoes: function () { return Object.keys(S); },
    webview: function (id) { var s = S[idAgente(id)]; return s ? s.wv : null; },
    passo: function (agente, texto, extra) { var p = extra || {}; p.agente = agente; p.texto = texto; aoPasso(p); },
    estado: aoEstado,
    assumir: function (id) { var s = S[idAgente(id)]; if (s) assumir(s); },
    devolver: function (id) { var s = S[idAgente(id)]; if (s) devolver(s); },
    raioX: function (id, aba) { var s = S[idAgente(id)]; if (!s) return; if (aba) s.rx.aba = aba; rxAlternar(s, true); },
    selecionar: function (id) { var s = S[idAgente(id)]; if (s) { if (!s.rx.aberto) rxAlternar(s, true); rxSelecionar(s); } },
    revelar: function (id, i) { var s = S[idAgente(id)]; return s ? revelar(s, i) : Promise.resolve(); },
    naPagina: function (id, metodo, args) { return naPagina(S[idAgente(id)], metodo, args); },
    exportarCopy: function (id) { var s = S[idAgente(id)]; return s ? exportarCopy(s) : Promise.resolve(null); },
    clonar: function (id) { var s = S[idAgente(id)]; return s ? clonarPagina(s) : Promise.resolve(null); },
    abrirClone: abrirClone,
    salvarClone: function (rel) { var cl = C['clone:' + rel]; return cl ? salvarClone(cl) : Promise.resolve(false); },
    clone: function (rel) { var cl = C['clone:' + rel]; return cl ? { rel: cl.rel, modo: cl.modo, edicao: cl.edicao, sujo: cl.sujo, salvo: cl.salvo, fonte: cl.fonte } : null; },
    ouvir: function (fn) { ouvintes.push(fn); return function () { var i = ouvintes.indexOf(fn); if (i >= 0) ouvintes.splice(i, 1); }; },
    relogios: function () { return { domVivo: !!relogioDom }; },
    copyMarkdown: function (id) { var s = S[idAgente(id)]; return s ? copyMarkdown(s) : ''; },
    ultimaCopia: null
  };

  ligarApi();
  /* o preload pode ligar o módulo depois (janela recarregada, módulo tardio): confere mais algumas vezes, sem laço eterno */
  var tentativas = 0;
  (function conferir() { if (ligarApi.feito || tentativas++ > 20) return; setTimeout(function () { ligarApi(); conferir(); }, 500); })();
  if (E.ui) sincronizar();
})();
