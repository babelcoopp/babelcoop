/* babel-coop · o meio vivo: o arquivo que o agente escreve nasce no meio da Estação (window.BC.nascendo)
   Contrato: .deus/terminal-ao-vivo/PROTOCOLO.md §7 e §10 · régua: docs/design/REGUA_ORGANISMO.md §2 ("arquivo nascendo",
   "documento concluído") · visual: docs/design/TERMINAL_2030.md e a demonstração docs/design/organismo.html.

   O que faz, só com mensagem real do servidor (R1):
   - agente-arquivo {dono,id,caminho,absoluto?,acao:'criado'|'editado',nome?} do MEU agente → abre no meio uma aba com o
     ARQUIVO REAL (GET /api/arquivo?caminho=<relativo à minha pasta compartilhada>). Criado: o texto nasce linha a linha,
     com o cursor da presença na ponta e um rastro de luz roxo → ciano que esfria (meia-vida de 280 ms). Editado: só as
     linhas que mudaram acendem (meia-vida curta de 6 s, lei 3), por diferença de linhas (LCS) contra a versão anterior.
   - agente-plano {dono,id,itens,concluidosAgora} com todos os itens feitos → o rito "concluído", uma vez por plano:
     o documento respira uma vez (1,2 s), faíscas, som 'duas', "Documento concluído" em Cormorant; depois esfria.
   - prefers-reduced-motion (ou efeitos desligados pela pessoa): o arquivo aparece inteiro, sem movimento; o rito vira
     cor e texto (o som continua: som não é movimento).
   - HUD do Babel OS (contexto Gabriel, PROTOCOLO §11): vidro, borda 1 px rgba(63,227,255,.22), glow discreto e
     scanlines ≤ 5 % só enquanto o documento está vivo (sendo escrito); esfria sozinho.
   - laço parado com a janela oculta ou a aba fora da tela: o que falta nascer aparece de uma vez (nada anima escondido).

   Como entra na Estação do protótipo: registra BC.vistas.nascendo (aba de tipo 'nascendo') e desenha o documento num
   painel próprio ao lado de #e-conteudo, dentro de .e-editor. O render da Estação troca o innerHTML de #e-conteudo a
   cada mudança; o painel não é tocado por ele (nada pisca, rolagem e animações seguem).
   JS puro, sem módulos. Carregado depois de ponte.js e organismo.js (lista INJETAR do servidor).
*/
(function () {
  'use strict';
  var BC = window.BC = window.BC || {};
  if (BC.nascendo && BC.nascendo.versao) return;

  var VERSAO = '1.0.0';
  var MV_RASTRO = 280;        /* meia-vida do rastro da linha que acabou de nascer (ms) */
  var MV_EDICAO = 6000;       /* meia-vida da linha editada (--mv-curta, lei 3) */
  var VIVO_DEPOIS = 6000;     /* quanto o documento continua "vivo" (HUD) depois de a presença parar de escrever */
  var MAX_LINHAS = 5000;      /* acima disso, o resto aparece como nota (o meio não é um visualizador de logs) */
  var ATRASO_RITO = 700;      /* o último item acende antes (pulso da presença, ~600 ms); o rito vem depois */
  var CHAVE_RITOS = 'babel-coop:nascendo:ritos';

  /* ------------------------------------------------------------------ utilidades */
  function agora() { return performance.now(); }
  function org() { return BC.organismo || null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function dois(n) { return (n < 10 ? '0' : '') + n; }
  function hora(ms) { var d = new Date(ms || Date.now()); return dois(d.getHours()) + ':' + dois(d.getMinutes()); }
  function limitar(v, a, b) { return v < a ? a : v > b ? b : v; }
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function semMovimento() {
    var o = org();
    if (o && o.semMovimento) return o.semMovimento();
    return !!(mq && mq.matches);
  }
  function lerJSON(chave, padrao) { try { var v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; } }
  function guardarJSON(chave, v) { try { localStorage.setItem(chave, JSON.stringify(v)); } catch (e) { /* sem armazenamento: vale só nesta página */ } }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
  function L() { return BC.loja || null; }
  function E() { return BC.estacao || null; }
  function eu() { var r = BC.real && BC.real.eu && BC.real.eu(); return r && r.id ? r : null; }

  /* só a Estação da pessoa vive o meio: a TV, o iPad e o cronômetro nunca abrem arquivo nem fazem rito */
  function naEstacao() {
    var h = String(location.hash || '').replace('#', '');
    if (/^(tv|ipad|cronometro)\b/.test(h)) return false;
    var v = document.documentElement.getAttribute('data-vista');
    if (v && v !== 'estacao') return false;
    var ve = document.getElementById('vista-estacao');
    return !!(ve && !ve.hidden && document.querySelector('.e-editor'));
  }

  /* estilo: se o servidor ainda não injetou /coop/nascendo.css, a própria peça pede */
  (function garantirCss() {
    if (document.querySelector('link[href$="/coop/nascendo.css"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = '/coop/nascendo.css';
    (document.head || document.documentElement).appendChild(l);
  })();

  /* ------------------------------------------------------------------ instrumentação (testes e a pessoa ver) */
  var cont = { abertos: 0, nascimentos: 0, edicoes: 0, linhasAcesas: 0, ritos: 0, ritosDelegados: 0, ignorados: 0, falhas: 0 };
  var reg = [];
  function anotar(o) { o.t = Math.round(agora()); reg.push(o); if (reg.length > 200) reg.shift(); }

  /* ------------------------------------------------------------------ caminho: o que o gancho manda → relativo à minha pasta */
  var pastaMinha = null, pedindoPasta = null;
  function pasta() {
    if (pastaMinha) return Promise.resolve(pastaMinha);
    if (pedindoPasta) return pedindoPasta;
    pedindoPasta = fetch('/api/eu').then(function (r) { return r.json(); }).then(function (j) { pastaMinha = j && j.pasta ? String(j.pasta) : ''; return pastaMinha; })
      .catch(function () { pedindoPasta = null; return ''; });
    return pedindoPasta;
  }
  function relativo(m, raiz) {
    var eid = (eu() || {}).id || '';
    var c = String(m.caminho || '').replace(/\\/g, '/');
    var abs = String(m.absoluto || (/^(\/|[A-Za-z]:\/)/.test(c) ? c : '')).replace(/\\/g, '/');
    raiz = String(raiz || '').replace(/\\/g, '/').replace(/\/+$/, '');
    if (abs && raiz) {
      /* no macOS a mesma pasta pode vir como /var/… ou /private/var/… (link simbólico do sistema) */
      var variantes = [raiz, raiz.replace(/^\/private(?=\/)/, ''), '/private' + raiz];
      for (var k = 0; k < variantes.length; k++) if (abs.indexOf(variantes[k] + '/') === 0) return abs.slice(variantes[k].length + 1);
    }
    if (abs && !c) return null; /* fora da pasta compartilhada */
    if (/^(\/|[A-Za-z]:\/)/.test(c)) return null;
    c = c.replace(/^\.\//, '');
    if (eid && c.indexOf(eid + '/') === 0) c = c.slice(eid.length + 1); /* "theus/Propostas/x.md" (como a lista de arquivos) */
    if (!c || /(^|\/)\.\.(\/|$)/.test(c)) return null;
    return c;
  }
  function ler(rel) {
    return fetch('/api/arquivo?caminho=' + encodeURIComponent(rel), { cache: 'no-store' }).then(function (r) {
      var tipo = r.headers.get('content-type') || '';
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) { throw new Error(j.erro || ('HTTP ' + r.status)); });
      if (tipo.indexOf('application/json') >= 0) return r.json().then(function (j) { return { texto: typeof j.conteudo === 'string' ? j.conteudo : null, tipo: j.tipo || '' }; });
      return { texto: null, tipo: tipo.split(';')[0], binario: true };
    });
  }

  /* ------------------------------------------------------------------ nomes: agente e dono */
  var nomesSessao = {};
  function lembrarSessoes(lista, dono) {
    if (lista && !Array.isArray(lista) && typeof lista === 'object') lista = Object.keys(lista).map(function (k) { return lista[k]; });
    if (!Array.isArray(lista)) return;
    lista.forEach(function (i) { if (i && i.id && i.nome) nomesSessao[(i.dono || dono || '') + '/' + i.id] = i.nome; });
  }
  function nomeAgente(dono, id, m) {
    if (m && (m.nome || m.agente)) return String(m.nome || m.agente);
    var n = nomesSessao[(dono || '') + '/' + id] || nomesSessao['/' + id];
    if (n) return n;
    var l = L(), p = l && l.pessoa && l.pessoa(dono);
    var ag = p && (p.agentes || []).filter(function (a) { return a.id === id; })[0];
    return ag ? ag.nome : 'o agente';
  }
  function nomePessoa(id) { var l = L(); try { return (l && l.nome && l.nome(id)) || id; } catch (e) { return id; } }

  /* ------------------------------------------------------------------ markdown leve, linha a linha (o documento nasce como documento) */
  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*\w])\*([^*\s][^*]*)\*(?!\w)/g, '$1<em>$2</em>')
      .replace(/(^|[^\w])_([^_\s][^_]*)_(?!\w)/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<u title="$2">$1</u>');
  }
  var EXT_MD = { md: 1, markdown: 1, txt: 0 };
  function ehMarkdown(rel) { return !!EXT_MD[String(rel).split('.').pop().toLowerCase()]; }
  /* devolve [{cls, html}] para cada linha (o estado das cercas ``` passa de uma linha para a outra) */
  function renderizar(linhas, md) {
    var codigo = false;
    return linhas.map(function (t) {
      if (!md) return { cls: 'cod' + (t.trim() ? '' : ' vazia'), html: esc(t) || '&#8203;' };
      if (/^\s*(```|~~~)/.test(t)) { codigo = !codigo; return { cls: 'cerca', html: esc(t) }; }
      if (codigo) return { cls: 'codigo', html: esc(t) || '&#8203;' };
      var m;
      if ((m = /^(#{1,6})\s+(.*)$/.exec(t))) return { cls: 'h' + Math.min(4, m[1].length), html: inline(m[2]) };
      if ((m = /^(\s*)[-*+]\s+(\[[ xX]\]\s+)?(.*)$/.exec(t))) {
        var marca = m[2] ? (/x/i.test(m[2]) ? '<b class="nasc-caixa feita">✓</b>' : '<b class="nasc-caixa"></b>') : '<b class="nasc-bala">•</b>';
        return { cls: 'li', html: marca + inline(m[3]), recuo: Math.min(6, Math.floor(m[1].length / 2)) };
      }
      if ((m = /^(\s*)(\d+)[.)]\s+(.*)$/.exec(t))) return { cls: 'li', html: '<b class="nasc-bala num">' + esc(m[2]) + '.</b>' + inline(m[3]), recuo: Math.min(6, Math.floor(m[1].length / 2)) };
      if ((m = /^\s*>\s?(.*)$/.exec(t))) return { cls: 'citacao', html: inline(m[1]) || '&#8203;' };
      if (/^\s*\|/.test(t)) return { cls: 'tabela', html: esc(t) };
      if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(t)) return { cls: 'hr', html: '' };
      if (!t.trim()) return { cls: 'vazia', html: '' };
      return { cls: 'p', html: inline(t) };
    });
  }

  /* ------------------------------------------------------------------ diferença de linhas (LCS depois de cortar começo e fim iguais)
     devolve, para cada linha nova, o índice da linha antiga que ela continua (ou -1 = mudou ou nasceu) */
  function diferenca(a, b) {
    var n = a.length, m = b.length, ini = 0, i, j;
    var mapa = new Array(m);
    for (i = 0; i < m; i++) mapa[i] = -1;
    while (ini < n && ini < m && a[ini] === b[ini]) { mapa[ini] = ini; ini++; }
    var fa = n, fb = m;
    while (fa > ini && fb > ini && a[fa - 1] === b[fb - 1]) { fa--; fb--; mapa[fb] = fa; }
    var la = fa - ini, lb = fb - ini;
    if (!la || !lb || la * lb > 400000) return mapa; /* grande demais: o miolo inteiro conta como mudado */
    var T = new Array(la + 1);
    for (i = 0; i <= la; i++) T[i] = new Uint32Array(lb + 1);
    for (i = la - 1; i >= 0; i--) for (j = lb - 1; j >= 0; j--) T[i][j] = a[ini + i] === b[ini + j] ? T[i + 1][j + 1] + 1 : Math.max(T[i + 1][j], T[i][j + 1]);
    i = 0; j = 0;
    while (i < la && j < lb) {
      if (a[ini + i] === b[ini + j]) { mapa[ini + j] = ini + i; i++; j++; }
      else if (T[i + 1][j] >= T[i][j + 1]) i++;
      else j++;
    }
    return mapa;
  }
  function paraLinhas(texto) {
    var ls = String(texto == null ? '' : texto).replace(/\r\n?/g, '\n').split('\n');
    if (ls.length > 1 && ls[ls.length - 1] === '') ls.pop();
    return ls;
  }

  /* ------------------------------------------------------------------ o painel ao lado de #e-conteudo */
  var vista = null, docs = {}, porSessao = {}, cache = {}, ordemCache = [];
  function garantirVista() {
    if (vista && vista.isConnected) return vista;
    var ed = document.querySelector('.e-editor');
    if (!ed) return null;
    vista = document.createElement('section');
    vista.className = 'nasc-vista';
    vista.setAttribute('aria-label', 'Arquivo que o agente escreve');
    vista.hidden = true;
    ed.appendChild(vista);
    return vista;
  }
  function idAba(rel) { return 'nascendo:' + rel; }
  function abaAtiva() { var e = E(); return e && e.abaAtual ? e.abaAtual() : null; }
  function visivel(d) {
    return !!(d && d.el && !d.el.hidden && d.el.isConnected && vista && !vista.hidden && document.visibilityState !== 'hidden');
  }

  /* a Estação pede o conteúdo da aba ao registro de vistas; o desenho de verdade é o painel (sincronizar) */
  BC.vistas = BC.vistas || {};
  BC.vistas.nascendo = {
    conteudo: function (tab) { return '<div class="nasc-lugar" data-aba="' + esc(tab.id) + '" aria-hidden="true"></div>'; },
    lateral: function () { return BC.explorador && BC.explorador.lateral ? BC.explorador.lateral() : ''; }
  };

  function sincronizar() {
    var ed = document.querySelector('.e-editor'), e = E();
    if (!ed || !e || !e.ui) return;
    var tab = abaAtiva(), abertas = {};
    (e.ui.abas || []).forEach(function (t) { abertas[t.id] = t; });
    /* aba fechada pela pessoa: o painel some (o conteúdo fica guardado para a próxima diferença) */
    Object.keys(docs).forEach(function (k) { if (!abertas[k]) destruir(docs[k]); });
    var meu = tab && tab.tipo === 'nascendo' && docs[tab.id];
    ed.classList.toggle('nasc-on', !!meu);
    if (vista) vista.hidden = !meu;
    Object.keys(docs).forEach(function (k) {
      var d = docs[k], mostra = !!meu && k === tab.id;
      if (d.el.hidden === !mostra) return;
      d.el.hidden = !mostra;
      if (mostra) { restaurarRolagem(d); if (d.pendenteRito) { var r = d.pendenteRito; d.pendenteRito = null; rito(d, r); } }
      else { if (d.nascendo) terminarNascimento(d, 'fora-da-tela'); pararAnimacoes(d.el); } /* nada anima escondido */
    });
    /* a aba do documento vivo ganha a marca (a barra de abas é redesenhada a cada render) */
    document.querySelectorAll('#e-abas .e-aba[data-id^="nascendo:"]').forEach(function (el) {
      var d = docs[el.getAttribute('data-id')];
      if (d) el.setAttribute('data-nasc', d.vivo ? 'vivo' : 'quieto');
    });
  }
  /* rastros e entradas em andamento terminam na hora (painel escondido, janela oculta, movimento reduzido ligado) */
  function pararAnimacoes(raiz) {
    if (!raiz || !raiz.getAnimations) return 0;
    var n = 0;
    try { raiz.getAnimations({ subtree: true }).forEach(function (a) { if (a instanceof window.CSSTransition || a instanceof window.CSSAnimation) return; a.cancel(); n++; }); } catch (e) { /* navegador sem getAnimations({subtree}) */ }
    return n;
  }
  var obs = null;
  function vigiar() {
    if (obs) return true;
    var abas = document.getElementById('e-abas'), cont2 = document.getElementById('e-conteudo');
    if (!abas || !cont2 || !window.MutationObserver) return false;
    obs = new MutationObserver(function () { sincronizar(); });
    obs.observe(abas, { childList: true });
    obs.observe(cont2, { childList: true });
    return true;
  }

  function criarDoc(rel, m) {
    garantirVista();
    var id = idAba(rel), d = docs[id];
    if (d) return d;
    var el = document.createElement('article');
    el.className = 'nasc-doc';
    el.setAttribute('data-aba', id);
    el.setAttribute('data-vivo', 'nao');
    el.hidden = true;
    var partes = rel.split('/'), nomeArq = partes.pop();
    el.innerHTML =
      '<header class="nasc-cab"><span class="nasc-pres"></span>' +
      '<span class="nasc-caminho"><span class="nasc-dono">' + esc(nomePessoa((eu() || {}).id || '')) + '</span>' +
      (partes.length ? '<span class="nasc-sep">›</span><span class="nasc-pasta">' + esc(partes.join('/')) + '</span>' : '') +
      '<span class="nasc-sep">›</span><b class="nasc-nome">' + esc(nomeArq) + '</b></span>' +
      '<span class="nasc-st" aria-live="polite"></span></header>' +
      '<div class="nasc-corpo"><div class="nasc-rolo" tabindex="0"><div class="nasc-folha ' + (ehMarkdown(rel) ? 'md' : 'codigo') + '"></div>' +
      '<div class="nasc-concluido" hidden>Documento concluído<small></small></div></div>' +
      '<div class="nasc-scan" aria-hidden="true"></div></div>';
    vista.appendChild(el);
    d = docs[id] = {
      id: id, rel: rel, nome: nomeArq, el: el, md: ehMarkdown(rel),
      folha: el.querySelector('.nasc-folha'), rolo: el.querySelector('.nasc-rolo'), st: el.querySelector('.nasc-st'), fim: el.querySelector('.nasc-concluido'),
      linhas: [], nos: [], nascidas: 0, nascendo: false, tempos: [], inicio: 0, fimT: 0, seq: 0, vivo: false,
      sessao: null, agente: 'o agente', dono: null, seguir: true, rolagem: 0, fila: null, timer: 0, timerVivo: 0, pendenteRito: null, concluido: false, pres: null
    };
    var o = org();
    if (o && o.Presenca) { try { d.pres = new o.Presenca(el.querySelector('.nasc-pres'), { tamanho: 'mini', estado: 'shell' }); } catch (e) { d.pres = null; } }
    /* a pessoa rolou para cima: o documento para de seguir o cursor até ela voltar ao fim */
    d.rolo.addEventListener('scroll', function () {
      d.rolagem = d.rolo.scrollTop;
      var noFim = d.rolo.scrollHeight - d.rolo.scrollTop - d.rolo.clientHeight < 48;
      if (d.nascendo && d.autoRolando) { d.autoRolando = false; return; }
      d.seguir = noFim;
    }, { passive: true });
    cont.abertos++;
    return d;
  }
  function destruir(d) {
    clearTimeout(d.timer); clearTimeout(d.timerVivo);
    if (d.pres && d.pres.destruir) { try { d.pres.destruir(); } catch (e) { /* segue */ } }
    if (d.el && d.el.parentNode) d.el.parentNode.removeChild(d.el);
    delete docs[d.id];
    Object.keys(porSessao).forEach(function (k) { if (porSessao[k] === d.id) delete porSessao[k]; });
  }
  function restaurarRolagem(d) { if (d.seguir) d.rolo.scrollTop = d.rolo.scrollHeight; else d.rolo.scrollTop = d.rolagem; }

  /* abre (ou traz para frente) a aba do documento; se a pessoa está digitando no meio, a aba entra sem roubar o foco */
  function abrirAba(d) {
    var e = E();
    if (!e || !e.ui) return;
    var tab = { id: d.id, tipo: 'nascendo', titulo: d.nome, atividade: 'explorador', ref: d.rel };
    var a = document.activeElement, ocupada = a && a !== document.body && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable) &&
      document.getElementById('e-conteudo') && document.getElementById('e-conteudo').contains(a);
    var ja = e.ui.abas.filter(function (t) { return t.id === d.id; })[0];
    if (ocupada) {
      if (!ja) { e.ui.abas.push(tab); e.render(); }
      var aba = document.querySelector('#e-abas .e-aba[data-id="' + (window.CSS && CSS.escape ? CSS.escape(d.id) : d.id) + '"]');
      if (aba && org()) org().acender(aba, 6000);
      anotar({ tipo: 'aba', rel: d.rel, foco: 'mantido' });
      return;
    }
    e.abrirAba(tab);
    sincronizar();
  }

  /* ------------------------------------------------------------------ o texto na tela */
  function montarLinha(r, n) {
    var el = document.createElement('div');
    el.className = 'nasc-l ' + r.cls;
    if (r.recuo) el.style.paddingLeft = (r.recuo * 18) + 'px';
    el.setAttribute('data-n', String(n));
    el.innerHTML = '<i class="nasc-rastro" aria-hidden="true"></i><span class="nasc-num" aria-hidden="true">' + n + '</span><span class="nasc-t">' + r.html + '</span>';
    return el;
  }
  function atualizarLinha(el, r, n) {
    var cls = 'nasc-l ' + r.cls;
    if (el.getAttribute('data-sig') !== cls + '|' + r.html) {
      el.className = cls;
      el.querySelector('.nasc-t').innerHTML = r.html;
      el.setAttribute('data-sig', cls + '|' + r.html);
    }
    el.style.paddingLeft = r.recuo ? (r.recuo * 18) + 'px' : '';
    if (el.getAttribute('data-n') !== String(n)) { el.setAttribute('data-n', String(n)); el.querySelector('.nasc-num').textContent = n; }
  }
  var cursor = null;
  function porCursor(d, el) {
    if (!cursor) { cursor = document.createElement('span'); cursor.className = 'nasc-cursor'; cursor.setAttribute('aria-hidden', 'true'); }
    var t = el.querySelector('.nasc-t');
    if (t) t.appendChild(cursor);
  }
  function tirarCursor() { if (cursor && cursor.parentNode) cursor.parentNode.removeChild(cursor); }
  /* rastro que esfria: opacidade 2^(-t/mv), amostrada em keyframes (compositor, sem laço nosso) */
  var QUADROS_RASTRO = (function () { var q = [], n = 8, dur = MV_RASTRO * 5; for (var i = 0; i <= n; i++) { var t = (i / n) * dur; q.push({ opacity: i === n ? 0 : Math.pow(2, -t / MV_RASTRO), offset: i / n }); } return q; })();
  function nascerLinha(d, i, animar) {
    var r = d.render[i], el = montarLinha(r, i + 1);
    el.setAttribute('data-sig', 'nasc-l ' + r.cls + '|' + r.html);
    d.folha.appendChild(el);
    d.nos[i] = el;
    d.nascidas = i + 1;
    d.tempos.push(Math.round(agora() - d.inicio));
    if (animar && el.animate) {
      el.animate([{ opacity: 0, transform: 'translateY(2px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.2,0,0,1)' });
      el.firstChild.animate(QUADROS_RASTRO, { duration: MV_RASTRO * 5, easing: 'linear' });
    }
    return el;
  }
  function seguirCursor(d, el) {
    if (!d.seguir || !el) return;
    var alvo = el.offsetTop + el.offsetHeight - d.rolo.clientHeight * 0.62;
    if (alvo > d.rolo.scrollTop) { d.autoRolando = true; d.rolo.scrollTop = alvo; }
  }
  function status(d, texto) { if (d.st) d.st.textContent = texto; }
  function vivificar(d, sim) {
    clearTimeout(d.timerVivo);
    d.vivo = !!sim;
    d.el.setAttribute('data-vivo', sim ? 'sim' : 'nao');
    var aba = document.querySelector('#e-abas .e-aba[data-id="' + (window.CSS && CSS.escape ? CSS.escape(d.id) : d.id) + '"]');
    if (aba) aba.setAttribute('data-nasc', sim ? 'vivo' : 'quieto');
  }
  function esfriarDepois(d, ms) {
    clearTimeout(d.timerVivo);
    d.timerVivo = setTimeout(function () { if (!d.nascendo && !d.ritoAgora) vivificar(d, false); }, ms);
  }

  /* nascimento: linha a linha, no tempo de quem escreve (≈ 90 ms por linha, 3,6 s no máximo; arquivos longos saem em grupos) */
  function nascer(d, texto, m) {
    d.linhas = paraLinhas(texto);
    var extra = 0;
    if (d.linhas.length > MAX_LINHAS) { extra = d.linhas.length - MAX_LINHAS; d.linhas = d.linhas.slice(0, MAX_LINHAS); }
    d.render = renderizar(d.linhas, d.md);
    d.folha.innerHTML = ''; d.nos = []; d.nascidas = 0; d.tempos = []; d.inicio = agora(); d.fimT = 0;
    d.fim.hidden = true; d.fim.classList.remove('on'); d.concluido = false;
    d.extra = extra; d.seguir = true;
    var n = d.linhas.length, animar = !semMovimento() && visivel(d);
    cont.nascimentos++;
    anotar({ tipo: 'nascer', rel: d.rel, linhas: n, animar: animar });
    vivificar(d, true);
    if (!animar || !n) { d.nascendo = true; terminarNascimento(d, animar ? 'vazio' : 'sem-movimento'); return; }
    var total = limitar(n * 90, 600, 3600), porVez = Math.max(1, Math.ceil(n / (total / 22))), passos = Math.ceil(n / porVez), intervalo = total / passos;
    d.nascendo = true;
    if (d.pres) { d.pres.estado('rodando', { desde: Date.now() }); }
    status(d, d.agente + ' escreve · linha 0 de ' + n);
    var i = 0, t0 = agora(), minha = ++d.seq;
    function passo() {
      if (minha !== d.seq || !d.nascendo) return;
      if (!visivel(d) || semMovimento()) { terminarNascimento(d, !visivel(d) ? 'fora-da-tela' : 'sem-movimento'); return; }
      var ultimo = null, bytes = 0;
      for (var k = 0; k < porVez && i < n; k++, i++) { ultimo = nascerLinha(d, i, true); bytes += d.linhas[i].length + 1; }
      porCursor(d, ultimo);
      seguirCursor(d, ultimo);
      if (d.pres && d.pres.bytes) d.pres.bytes(bytes);
      status(d, d.agente + ' escreve · linha ' + i + ' de ' + n);
      if (i >= n) { terminarNascimento(d, 'completo'); return; }
      /* agenda pelo relógio de parede: se um quadro atrasou, o próximo compensa (o total fica perto do previsto) */
      var proximo = t0 + (i / porVez) * intervalo;
      d.timer = setTimeout(passo, Math.max(0, proximo - agora()));
    }
    passo();
  }
  function terminarNascimento(d, motivo) {
    if (!d.nascendo) return;
    clearTimeout(d.timer);
    d.seq++;
    for (var i = d.nascidas; i < d.linhas.length; i++) nascerLinha(d, i, false);
    tirarCursor();
    d.nascendo = false;
    d.fimT = Math.round(agora() - d.inicio);
    if (d.extra) {
      var nota = document.createElement('div');
      nota.className = 'nasc-l nota';
      nota.textContent = '… mais ' + d.extra + ' linhas (abra o arquivo inteiro no explorador)';
      d.folha.appendChild(nota);
    }
    anotar({ tipo: 'nasceu', rel: d.rel, linhas: d.linhas.length, ms: d.fimT, motivo: motivo });
    if (d.pres) d.pres.estado('terminou', { fim: Date.now(), duracao: d.fimT });
    status(d, 'criado por ' + d.agente + ' · ' + hora() + ' · ' + d.linhas.length + (d.linhas.length === 1 ? ' linha' : ' linhas'));
    if (d.seguir) { d.autoRolando = true; d.rolo.scrollTop = d.rolo.scrollHeight; }
    esfriarDepois(d, VIVO_DEPOIS);
    if (d.fila) { var f = d.fila; d.fila = null; f(); }
    if (d.ritoEsperando) { var r = d.ritoEsperando; d.ritoEsperando = null; setTimeout(function () { rito(d, r); }, 250); }
  }

  /* edição: só as linhas mudadas acendem */
  function editar(d, texto) {
    var novas = paraLinhas(texto);
    if (novas.length > MAX_LINHAS) novas = novas.slice(0, MAX_LINHAS);
    var mapa = diferenca(d.linhas, novas), render = renderizar(novas, d.md);
    var antigos = d.nos, nos = new Array(novas.length), usados = {}, mudadas = [];
    for (var j = 0; j < novas.length; j++) {
      var velho = mapa[j];
      if (velho >= 0 && antigos[velho]) { nos[j] = antigos[velho]; usados[velho] = true; atualizarLinha(nos[j], render[j], j + 1); }
      else { nos[j] = montarLinha(render[j], j + 1); nos[j].setAttribute('data-sig', 'nasc-l ' + render[j].cls + '|' + render[j].html); mudadas.push(j); }
    }
    antigos.forEach(function (el, k) { if (!usados[k] && el && el.parentNode) el.parentNode.removeChild(el); });
    /* recoloca na ordem nova (só move o que saiu do lugar) */
    var ref = d.folha.firstChild;
    nos.forEach(function (el) { if (el !== ref) d.folha.insertBefore(el, ref); ref = el.nextSibling; });
    d.nos = nos; d.linhas = novas; d.render = render; d.nascidas = novas.length;
    var o = org(), animar = !semMovimento() && visivel(d);
    mudadas.forEach(function (j) {
      nos[j].classList.add('mudou');
      if (o && o.acender) o.acender(nos[j], MV_EDICAO);
      if (animar && nos[j].animate) nos[j].firstChild.animate(QUADROS_RASTRO, { duration: MV_RASTRO * 5, easing: 'linear' });
    });
    cont.edicoes++; cont.linhasAcesas += mudadas.length;
    anotar({ tipo: 'editar', rel: d.rel, linhas: novas.length, mudadas: mudadas.length });
    if (mudadas.length) {
      vivificar(d, true);
      if (d.pres) { d.pres.estado('terminou', { fim: Date.now() }); if (d.pres.acordar && animar) d.pres.acordar(); }
      var primeira = nos[mudadas[0]];
      if (primeira && visivel(d)) { d.seguir = false; d.rolo.scrollTop = Math.max(0, primeira.offsetTop - d.rolo.clientHeight * 0.3); }
      esfriarDepois(d, VIVO_DEPOIS);
    }
    status(d, 'editado por ' + d.agente + ' · ' + hora() + ' · ' + (mudadas.length ? mudadas.length + (mudadas.length === 1 ? ' linha mudou' : ' linhas mudaram') : 'nada mudou no texto'));
    return mudadas.length;
  }
  function guardarCache(rel, linhas) {
    cache[rel] = linhas;
    ordemCache = ordemCache.filter(function (r) { return r !== rel; }); ordemCache.push(rel);
    while (ordemCache.length > 24) delete cache[ordemCache.shift()];
  }

  function binario(d, info) {
    d.linhas = []; d.render = []; d.nos = []; d.nascidas = 0; d.folha.innerHTML = '';
    var url = '/api/arquivo?caminho=' + encodeURIComponent(d.rel);
    var el = document.createElement('div');
    el.className = 'nasc-l nasc-bin';
    if (/^image\//.test(info.tipo || '')) el.innerHTML = '<img alt="" src="' + esc(url) + '&t=' + Date.now() + '">';
    else el.textContent = 'arquivo ' + (info.tipo || 'binário') + ' · o meio mostra texto; abra pelo explorador';
    d.folha.appendChild(el);
    vivificar(d, true);
    if (d.pres) d.pres.estado('terminou', { fim: Date.now() });
    status(d, (d.acao === 'editado' ? 'editado' : 'criado') + ' por ' + d.agente + ' · ' + hora());
    if (!semMovimento() && el.animate) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240 });
    esfriarDepois(d, VIVO_DEPOIS);
  }

  /* ------------------------------------------------------------------ mensagem agente-arquivo */
  var ultimaLeitura = {};
  function aoArquivo(m) {
    if (!naEstacao()) return;
    var mim = eu();
    if (mim && m.dono && m.dono !== mim.id) { cont.ignorados++; anotar({ tipo: 'ignorado', motivo: 'outro-dono', dono: m.dono }); return; }
    var chaveSessao = (m.dono || (mim && mim.id) || '') + '/' + (m.id || '');
    pasta().then(function (raiz) {
      var rel = relativo(m, raiz);
      if (!rel) {
        cont.ignorados++;
        anotar({ tipo: 'ignorado', motivo: 'fora-da-pasta', caminho: m.caminho || m.absoluto });
        var e = E();
        if (e && e.aviso) e.aviso(nomeAgente(m.dono, m.id, m) + ' escreveu ' + String(m.caminho || m.absoluto || '').split(/[\\/]/).pop() + ' fora da pasta compartilhada: o meio só mostra o que a equipe pode ver.');
        return;
      }
      var marca = (ultimaLeitura[rel] || 0) + 1;
      ultimaLeitura[rel] = marca;
      ler(rel).then(function (info) {
        if (ultimaLeitura[rel] !== marca) return; /* chegou uma versão mais nova no caminho */
        var d = docs[idAba(rel)], novo = !d;
        d = d || criarDoc(rel, m);
        d.sessao = chaveSessao; d.dono = m.dono || (mim && mim.id); d.agente = nomeAgente(m.dono, m.id, m); d.acao = m.acao;
        porSessao[chaveSessao] = d.id;
        abrirAba(d);
        if (info.binario || info.texto == null) { binario(d, info); return; }
        var aplicar = function () {
          var antes = d.linhas.length ? d.linhas : cache[rel];
          if (!antes || (novo && m.acao !== 'editado' && !cache[rel])) nascer(d, info.texto, m);
          else if (novo) { /* a aba tinha sido fechada: volta com o texto de antes e acende só o que mudou */
            d.linhas = antes; d.render = renderizar(antes, d.md); d.nos = []; d.folha.innerHTML = '';
            for (var i = 0; i < antes.length; i++) { var el = montarLinha(d.render[i], i + 1); el.setAttribute('data-sig', 'nasc-l ' + d.render[i].cls + '|' + d.render[i].html); d.folha.appendChild(el); d.nos[i] = el; }
            editar(d, info.texto);
          } else editar(d, info.texto);
          guardarCache(rel, d.linhas);
        };
        if (d.nascendo) { d.fila = aplicar; terminarNascimento(d, 'nova-versao'); } else aplicar();
      }).catch(function (err) {
        cont.falhas++;
        anotar({ tipo: 'falha', rel: rel, erro: String(err && err.message || err) });
      });
    });
  }

  /* ------------------------------------------------------------------ o rito "concluído" (uma vez por plano) */
  var ritosFeitos = lerJSON(CHAVE_RITOS, []);
  function jaFeito(chave) { return ritosFeitos.indexOf(chave) >= 0; }
  function marcarFeito(chave) { ritosFeitos.push(chave); if (ritosFeitos.length > 200) ritosFeitos = ritosFeitos.slice(-200); guardarJSON(CHAVE_RITOS, ritosFeitos); }
  /* itens do plano como o PROTOCOLO manda (texto, estado feito|andamento|pendente) ou crus do TodoWrite (content, completed|in_progress|pending) */
  function normalizarItens(lista) {
    return (Array.isArray(lista) ? lista : []).slice(0, 100).map(function (x) {
      var e = x && (x.estado || x.status);
      return { texto: String(x && (x.texto || x.content) || '').trim().slice(0, 300), estado: e === 'feito' || e === 'completed' ? 'feito' : e === 'andamento' || e === 'in_progress' ? 'andamento' : 'pendente' };
    });
  }
  var planos = {};
  function aoPlano(m) {
    if (!naEstacao()) return;
    var mim = eu();
    if (mim && m.dono && m.dono !== mim.id) return;
    var itens = normalizarItens(m.itens);
    var chaveSessao = (m.dono || (mim && mim.id) || '') + '/' + (m.id || '');
    var tudo = itens.length > 0 && itens.every(function (x) { return x && x.estado === 'feito'; });
    var textos = itens.map(function (x) { return String(x && x.texto || '').trim(); });
    var chave = 'rito:' + chaveSessao + ':' + hash(textos.join('\n'));
    planos[chaveSessao] = { itens: itens, tudo: tudo };
    if (!tudo || jaFeito(chave)) return;
    marcarFeito(chave);
    var dados = { sessao: chaveSessao, itens: itens.length, textos: textos, agente: nomeAgente(m.dono, m.id, m), dono: m.dono || (mim && mim.id) };
    /* um rito só por plano (R6). Se a sessão é do painel da presença (terminal-real.js), ele faz o rito dele no plano
       (respira, faíscas, "duas") e avisa com babel-coop:plano-concluido: o documento vem depois, sem segundo som;
       sem documento, o rito do painel basta. Sem painel para a sessão, o rito inteiro é daqui. */
    function seguir(viuPresenca) {
      var d = docs[porSessao[chaveSessao]];
      dados.comSom = !somRecente('duas', 2500);
      dados.delegado = !!viuPresenca;
      if (d && d.nascendo) { d.ritoEsperando = dados; return; }
      if (d) quandoLivre(function () { rito(d, dados); }, 1500);
      else if (viuPresenca) { cont.ritosDelegados++; anotar({ tipo: 'rito', rel: null, delegado: 'presenca', sessao: chaveSessao }); }
      else quandoLivre(function () { ritoSemDocumento(dados); }, 1500);
    }
    if (!presencaCuida(m.id)) { setTimeout(function () { seguir(false); }, ATRASO_RITO); return; }
    if (presencaViu[chaveSessao] && Date.now() - presencaViu[chaveSessao] < 4000) { setTimeout(function () { seguir(true); }, 150); return; }
    var resolvido = false;
    esperandoPresenca[chaveSessao] = function (viu) { if (resolvido) return; resolvido = true; delete esperandoPresenca[chaveSessao]; setTimeout(function () { seguir(viu); }, 150); };
    setTimeout(function () { var w = esperandoPresenca[chaveSessao]; if (w) w(false); }, 3500);
  }
  var presencaViu = {}, esperandoPresenca = {};
  document.addEventListener('babel-coop:plano-concluido', function (ev) {
    var det = ev && ev.detail || {}, mim = eu();
    if (!det.id) return;
    var k = ((mim && mim.id) || '') + '/' + det.id;
    presencaViu[k] = Date.now();
    if (esperandoPresenca[k]) esperandoPresenca[k](true);
  });
  function presencaCuida(id) {
    try { return !!(id && BC.terminalReal && BC.terminalReal.sessoes && BC.terminalReal.sessoes().some(function (x) { return x && x.id === id; })); } catch (e) { return false; }
  }
  function somRecente(nome, ms) {
    var o = org();
    if (!o || !o.registro) return false;
    var t = agora();
    return o.registro().some(function (x) { return x.tipo === 'som' && x.nome === nome && x.ok && t - x.t < ms; });
  }
  /* o teto do organismo é de 2 efeitos vivos: o rito espera a vez (até limiteMs) em vez de ser descartado */
  function quandoLivre(fn, limiteMs) {
    var o = org(), t0 = agora();
    (function tenta() {
      if (!o || !o.vivos || o.vivos() < (o.limites ? o.limites.efeitos : 2) || agora() - t0 > limiteMs) fn();
      else setTimeout(tenta, 120);
    })();
  }
  function subtitulo(dados) {
    var pts = BC.placar && BC.placar.doPlano ? BC.placar.doPlano(dados.sessao, dados.textos) : null;
    return dados.itens + (dados.itens === 1 ? ' item' : ' itens') + (pts != null ? ' · ' + pts + ' pontos' : '') + ' · ' + dados.agente + ' · agente de ' + nomePessoa(dados.dono) + ' · ' + hora();
  }
  function rito(d, dados) {
    if (!d || !d.el) return;
    if (d.el.hidden) {
      /* a pessoa está em outra aba: a aba do documento acende e soa; o título fica no documento para quando ela abrir */
      d.pendenteRito = null;
      executarRito(d, dados, false);
      return;
    }
    executarRito(d, dados, true);
  }
  function executarRito(d, dados, naTela) {
    var o = org(), parado = semMovimento();
    cont.ritos++;
    d.concluido = true; d.ritoAgora = true;
    vivificar(d, true);
    d.fim.hidden = false;
    d.fim.querySelector('small').textContent = subtitulo(dados);
    /* reflow para a transição do título (500 ms) começar do estado apagado */
    void d.fim.offsetWidth;
    d.fim.classList.add('on');
    if (d.pres) { d.pres.estado('terminou', { fim: Date.now() }); if (o) o.acender(d.pres.el, 6000); }
    status(d, 'concluído · ' + dados.itens + ' de ' + dados.itens + ' · ' + hora());
    var aba = document.querySelector('#e-abas .e-aba[data-id="' + (window.CSS && CSS.escape ? CSS.escape(d.id) : d.id) + '"]');
    if (naTela) {
      d.seguir = true; d.autoRolando = true; d.rolo.scrollTop = d.rolo.scrollHeight;
      if (o) {
        o.respirar(d.el.querySelector('.nasc-corpo'), { duracao: 1200 });
        var soltar = function (tent) {
          if (o.vivos && o.vivos() >= (o.limites ? o.limites.efeitos : 2) && tent < 3) { setTimeout(function () { soltar(tent + 1); }, 400); return; }
          o.faiscas(d.fim, 12, true, { onde: 'topo' });
        };
        soltar(0);
      }
    } else if (o && aba) { o.respirar(aba, { duracao: 1200 }); o.faiscas(aba, 6, false); }
    if (aba && o) o.acender(aba, 6000);
    if (o && dados.comSom !== false) o.som('duas');
    anotar({ tipo: 'rito', rel: d.rel, naTela: naTela, sem: parado, som: dados.comSom !== false, depoisDaPresenca: !!dados.delegado });
    /* 1,2 s de herói; o placar já subiu contando (placar.js); depois o documento esfria */
    setTimeout(function () {
      d.ritoAgora = false;
      d.fim.querySelector('small').textContent = subtitulo(dados);
      esfriarDepois(d, 600);
    }, 1200);
  }
  /* plano concluído sem arquivo no meio: um cartão breve no pé do meio, que respira e some */
  var nCartao = 0;
  function ritoSemDocumento(dados) {
    var ed = document.querySelector('.e-editor'), o = org();
    if (!ed) return;
    cont.ritos++;
    var r = ed.getBoundingClientRect(), c = document.createElement('div');
    c.className = 'nasc-cartao';
    c.id = 'nasc-cartao-' + (++nCartao);
    c.setAttribute('role', 'status');
    c.innerHTML = 'Plano concluído<small></small>';
    c.querySelector('small').textContent = subtitulo(dados);
    c.style.left = (r.left + r.width / 2) + 'px';
    c.style.top = (r.bottom - 120) + 'px';
    document.body.appendChild(c);
    void c.offsetWidth;
    c.classList.add('on');
    if (o) { o.respirar(c, { duracao: 1200 }); o.faiscas(c, 10, true, { onde: 'topo' }); if (dados.comSom !== false) o.som('duas'); }
    anotar({ tipo: 'rito', rel: null, naTela: true, cartao: true });
    setTimeout(function () { c.querySelector('small').textContent = subtitulo(dados); }, 60);
    setTimeout(function () { c.classList.remove('on'); c.classList.add('sai'); }, 4200);
    setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 5000);
  }

  /* ------------------------------------------------------------------ barramento */
  function ouvir(m) {
    if (!m || !m.tipo) return;
    switch (m.tipo) {
      case 'agente-arquivo': aoArquivo(m); break;
      case 'agente-plano': aoPlano(m); break;
      case 'bemvindo': lembrarSessoes(m.terminais, m.eu && m.eu.id); if (m.eu && m.eu.pasta) pastaMinha = m.eu.pasta; break;
      case 'term-aberto': if (m.info) lembrarSessoes([m.info]); break;
      case 'term-lista': lembrarSessoes(m.lista, m.dono); break;
      case 'term-renomear': case 'agente-estado': if (m.id && m.nome) nomesSessao[(m.dono || '') + '/' + m.id] = m.nome; break;
    }
  }
  var ligado = false;
  function ligar() {
    if (!ligado && BC.real && BC.real.ouvir) { ligado = true; BC.real.ouvir(ouvir); }
    if (!vigiar()) return false;
    garantirVista();
    sincronizar();
    return ligado;
  }
  if (!ligar()) {
    document.addEventListener('DOMContentLoaded', ligar);
    var tentativas = 0, t = setInterval(function () { if (ligar() || ++tentativas > 40) clearInterval(t); }, 250);
  }
  /* janela escondida: o que falta nascer aparece de uma vez (o laço não roda sem ninguém ver) */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') Object.keys(docs).forEach(function (k) { if (docs[k].nascendo) terminarNascimento(docs[k], 'janela-oculta'); pararAnimacoes(docs[k].el); });
  });
  /* a pessoa ligou o movimento reduzido no meio do caminho: o que está nascendo aparece inteiro e nada mais se mexe */
  if (mq) {
    var aoMudarMovimento = function () { if (!mq.matches) return; Object.keys(docs).forEach(function (k) { if (docs[k].nascendo) terminarNascimento(docs[k], 'sem-movimento'); pararAnimacoes(docs[k].el); }); };
    if (mq.addEventListener) mq.addEventListener('change', aoMudarMovimento); else if (mq.addListener) mq.addListener(aoMudarMovimento);
  }

  /* ------------------------------------------------------------------ API pública */
  BC.nascendo = {
    versao: VERSAO,
    limites: { mvRastro: MV_RASTRO, mvEdicao: MV_EDICAO, maxLinhas: MAX_LINHAS },
    /* testes e ferramentas: o que está aberto e quanto levou para nascer */
    docs: function () {
      return Object.keys(docs).map(function (k) {
        var d = docs[k];
        return { aba: d.id, rel: d.rel, linhas: d.linhas.length, nascidas: d.nascidas, nascendo: d.nascendo, vivo: d.vivo, concluido: d.concluido, agente: d.agente, sessao: d.sessao, visivel: visivel(d) };
      });
    },
    medidas: function (rel) { var d = docs[idAba(rel)]; return d ? { linhas: d.linhas.length, tempos: d.tempos.slice(), fim: d.fimT } : null; },
    texto: function (rel) { var d = docs[idAba(rel)]; return d ? d.linhas.join('\n') : null; },
    contagem: function () { return JSON.parse(JSON.stringify(cont)); },
    registro: function () { return reg.slice(); },
    diferenca: diferenca,
    sincronizar: sincronizar
  };
})();
