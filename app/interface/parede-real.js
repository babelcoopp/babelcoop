/* babel-coop · a parede dos terminais da equipe, ao vivo (atividade Terminais)
   Contrato: .deus/terminal-ao-vivo/PROTOCOLO.md §3–§5 · visual: docs/design/TERMINAL_2030.md §4–§5 · motor: BC.organismo.
   O que esta peça faz:
   - troca BC.vistas.terminais (o simulado de prototipo/vistas-c.js) pela parede real quando window.COOP_REAL.terminal:
     cada sessão viva de cada Estação vira um cartão-instrumento (foto, pessoa, agente, mini presença, último bloco do agente,
     um xterm pequeno SÓ LEITURA espelhando a sessão no tamanho do dono, selo de estado); um clique amplia;
   - no topo, o mapa da sala (BC.organismo.Constelacao): cada pessoa é um anel com raio até o centro, aceso por evento real,
     e um laço na cor de quem está no terminal de outra pessoa;
   - ampliado: xterm grande, "Pessoa · Agente", estado e Entrar / Pedir para entrar / Cancelar / Sair; com controle ativo o
     teclado manda term-entrada {dono,id,dados} (quem decide é o servidor do dono, nunca esta tela);
   - controles e selos: L.estado.controles espelha a mensagem 'controles' do servidor (os selos do rodapé do protótipo), e as
     ações controle-aceitar / recusar / encerrar / sair e term-entrar viram mensagens ao servidor (nada de L.fazer);
   - manda {tipo:'projetos'} ao servidor no bemvindo e sempre que L.estado.projetos muda ("mesmo projeto" entra direto).
   Os xterm vivem numa raiz persistente: a Estação refaz o innerHTML do meio a cada render e a raiz é recolocada na vaga
   (MutationObserver), sem recriar terminal nenhum. Assinatura por visibilidade (IntersectionObserver): term-assistir quando o
   cartão aparece, term-parar 1,5 s depois de sumir. A parede nunca toca som (vincular com meu:false): só o painel do dono soa.
   HUD do Babel OS (vidro, glow, scanlines ≤ 5 %) só no cartão ao vivo e no ampliado (PROTOCOLO §11; estilos em parede-real.css).
*/
(function () {
  'use strict';
  var BC = window.BC;
  if (!BC || !BC.loja || !BC.real || !BC.util) return;
  if (!window.COOP_REAL || !window.COOP_REAL.terminal) return; /* sem node-pty nesta Estação: fica a parede do protótipo */
  if (typeof window.Terminal !== 'function') { console.warn('[parede] xterm.js não carregou: fica a parede do protótipo'); return; }
  if (BC.parede && BC.parede.versao) return;

  var L = BC.loja, U = BC.util, R = BC.real, esc = U.esc;
  var A = BC.acoes = BC.acoes || {};
  var O = BC.organismo || semOrganismo();

  var VERSAO = '1.0.0';
  var ID_SESSAO = /^[A-Za-z0-9_-]{1,48}$/;
  var ERRO = /error|erro|failed|falhou|✖|not found|Traceback/i;
  var FONTE = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  var FONTE_CARTAO = 11, FONTE_AMP = 13;
  var ESPERA_PARAR = 1500;            /* cartão sumiu: term-parar só depois disso (re-render não derruba a assinatura) */
  var BRUTO_MAX = 256 * 1024;          /* saída guardada de uma sessão minha antes do xterm existir */
  var MV_SELO = 300000;                /* "X está no seu terminal": meia-vida média (CONCEITO lei 3) */
  /* tema do xterm: nenhuma cor fora dos tokens (TERMINAL_2030 §2.4) */
  var TEMA = {
    background: '#060b16', foreground: '#c3cfe5', cursor: '#2ad5e5', cursorAccent: '#060b16', selectionBackground: 'rgba(163,118,233,.28)',
    black: '#0b1320', brightBlack: '#6c7b96', red: '#ff6b6b', brightRed: '#ff8f8f', green: '#7fd6a6', brightGreen: '#a3e6c1',
    yellow: '#f0b35a', brightYellow: '#f5c76a', blue: '#7ba4f0', brightBlue: '#9dbcf5', magenta: '#a376e9', brightMagenta: '#c7a2ff',
    cyan: '#2ad5e5', brightCyan: '#6fe3ff', white: '#d7e4fb', brightWhite: '#fff8e7'
  };
  var BLOCO = { pedido: ['❯', 'pedido'], consulta: ['◎', 'consultei'], plano: ['☰', 'plano'], acao: ['▸', 'ação'], resultado: ['✓', 'resultado'], espera: ['◌', 'espera você'], falha: ['✕', 'falha'] };
  var PRIO_ESTADO = { espera: 6, falhou: 5, rodando: 4, terminou: 3, shell: 2, pausado: 1, desligado: 0 };

  /* ------------------------------------------------------------------ estado */
  var S = new Map();          /* 'dono/id' → sessão (cartão + xterm + presença) */
  var listas = new Map();     /* dono → última lista de terminais dele */
  var controles = [];         /* como o servidor mandou: os meus terminais + os meus nos terminais dos outros */
  var publicos = {};          /* dono → [{quem, sessao}]: o resumo público que cada dono espalha (quem está no terminal de quem, entre terceiros) */
  var controlesPostos = null; /* o array que está em L.estado.controles (para refazer se outra janela trocar o estado) */
  var chegadas = {};          /* id do controle → quando apareceu (luz do selo) */
  var respirarSelo = {};      /* ids que acabaram de chegar: o selo do rodapé respira uma vez */
  var luzPessoa = {};         /* dono → última vez que o nó dele acendeu (a saída não acende o mapa mais de 1× por 0,7 s) */
  var amp = null;             /* chave da sessão ampliada */
  var filtro = null;          /* dono filtrado na parede (lateral) */
  var eu = null, pronto = false, assinaturaProjetos = '';
  var fontesProntas = false, esperandoFontes = false;
  var relogio = null;         /* 1 Hz só enquanto algum terminal roda ("rodando há N s") */

  /* ------------------------------------------------------------------ utilidades */
  function euId() { var e = R.eu && R.eu(); return (e && e.id) || eu || L.eu; }
  function enviar(m) { R.enviar(m); }
  function pessoa(id) { return L.pessoa(id) || { id: id, nome: id, cor: '#6c7b96', status: 'offline' }; }
  function nomeDe(id) { return pessoa(id).nome || id; }
  function corDe(id) { var p = L.pessoa(id); return (p && p.cor) || '#2ad5e5'; }
  function parLigado(id) { if (id === euId()) return true; return (R.pares() || []).some(function (p) { return p.id === id && p.ligado; }); }
  function aviso(t) { if (BC.estacao && BC.estacao.aviso) BC.estacao.aviso(t); }
  function txt(el, t) { if (el && el.textContent !== t) el.textContent = t; }
  /* troca o HTML só quando mudou (e quando ninguém mais escreveu por cima: a Estação refaz a lateral por conta própria) */
  function html(el, h) { if (!el || (el.__h === h && el.firstChild === el.__p)) return; el.innerHTML = h; el.__h = h; el.__p = el.firstChild; }
  function naEstacao() { return (document.documentElement.dataset.vista || 'estacao') === 'estacao'; }
  function limitar(v, a, b) { return v < a ? a : v > b ? b : v; }
  function el(tag, cls, h) { var e = document.createElement(tag); if (cls) e.className = cls; if (h) e.innerHTML = h; return e; }

  /* sem o motor do organismo (nunca deveria faltar: o servidor injeta antes), a parede funciona sem luz */
  function semOrganismo() {
    var nada = function () { return false; };
    function Pres(c) { this.el = document.createElement('span'); if (c) c.appendChild(this.el); }
    Pres.prototype = { estado: function () { return this; }, bytes: function () { return this; }, acordar: function () { return this; }, visitante: function () { return this; }, destruir: function () {}, nivelAtual: function () { return 0; } };
    return {
      acender: nada, apagar: nada, respirar: nada, Presenca: Pres, Constelacao: null, frase: function (e) { return e; },
      vincular: function () {
        var e = 'shell', d = {}, v = {};
        ['saida', 'enter', 'visitantes', 'aberto', 'recusado'].forEach(function (k) { v[k] = function () { return v; }; });
        v.atividade = function (m) { if (m && m.estado) { e = m.estado; d = m; } return v; };
        v.pausa = function (s) { e = s ? 'pausado' : 'shell'; return v; };
        v.fim = function (c) { e = c ? 'falhou' : 'desligado'; return v; };
        v.estado = function () { return e; }; v.dados = function () { return d; }; v.frase = function () { return e; }; v.destruir = function () {};
        return v;
      }
    };
  }

  /* ------------------------------------------------------------------ a raiz persistente (não morre no render da Estação) */
  var raiz = el('div', 'pr-raiz');
  raiz.innerHTML =
    '<div class="pr-vista-parede">' +
      '<div class="pagina-cab pr-cab"><div><h1 class="pagina-titulo">Terminais ao vivo</h1><p class="pagina-sub pr-sub"></p></div>' +
        '<div class="pr-cab-acoes"></div></div>' +
      '<section class="pr-sala" aria-label="Mapa da sala">' +
        '<div class="pr-sala-rot"><span>Mapa da sala</span><span class="pr-sala-equipe"></span><span class="pr-sala-sinal"></span></div>' +
        '<div class="pr-constelacao"></div>' +
      '</section>' +
      '<div class="pr-grade" role="list" aria-label="Terminais da equipe"></div>' +
      '<p class="pr-vazio" hidden></p>' +
    '</div>' +
    '<section class="pr-amp" hidden aria-label="Terminal ampliado">' +
      '<header class="pr-amp-cab"><span class="pr-amp-av"></span><span class="pr-amp-pres"></span>' +
        '<div class="pr-amp-titulo"><h1></h1><p class="pr-amp-frase"></p></div>' +
        '<span class="pr-selo pr-amp-selo"><i></i><span class="pr-selo-t"></span></span>' +
        '<div class="pr-amp-acoes"></div></header>' +
      '<nav class="pr-amp-sessoes" aria-label="Terminais desta pessoa"></nav>' +
      '<div class="pr-amp-faixa" hidden></div>' +
      '<div class="pr-amp-tela" data-acao="parede-focar"><span class="pr-fio pr-amp-fio" aria-hidden="true"></span><div class="pr-amp-escala"></div></div>' +
      '<p class="pr-amp-aviso" role="status" aria-live="polite"></p>' +
    '</section>';
  var vistaParede = raiz.querySelector('.pr-vista-parede'), grade = raiz.querySelector('.pr-grade'), salaEl = raiz.querySelector('.pr-sala');
  var ampEl = raiz.querySelector('.pr-amp'), ampTela = raiz.querySelector('.pr-amp-tela'), ampEscala = raiz.querySelector('.pr-amp-escala');
  var ampFio = raiz.querySelector('.pr-amp-fio'), ampAviso = raiz.querySelector('.pr-amp-aviso'), ampPresEl = raiz.querySelector('.pr-amp-pres');
  var ampPres = null, ampV = null, focoDentro = false;
  var con = O.Constelacao ? new O.Constelacao(raiz.querySelector('.pr-constelacao'), { centro: 'a sala', rotulo: 'mapa da sala: cada pessoa é um anel; o evento acende o anel e corre até o centro' }) : null;
  var lacosAtuais = {};

  raiz.addEventListener('focusin', function () { focoDentro = true; });
  raiz.addEventListener('focusout', function (ev) { if (raiz.isConnected && !raiz.contains(ev.relatedTarget)) focoDentro = false; });
  raiz.addEventListener('keydown', function (ev) {
    var c = ev.target.closest && ev.target.closest('.pr-cartao');
    if (c && ev.target === c && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); ampliar(c.dataset.k); }
    if (ev.key === 'Escape' && amp && !(ev.target.closest && ev.target.closest('.xterm'))) { ev.preventDefault(); voltar(); }
  });

  /* ------------------------------------------------------------------ montar e desmontar a raiz no meio da Estação */
  var conteudoEl = null, topoGuardado = 0, abaMontada = null;
  function vigiarEstacao() {
    conteudoEl = document.getElementById('e-conteudo');
    if (!conteudoEl) return;
    new MutationObserver(montar).observe(conteudoEl, { childList: true });
    conteudoEl.addEventListener('scroll', function () { if (raiz.parentNode === conteudoEl) topoGuardado = conteudoEl.scrollTop; }, { passive: true });
    var st = document.getElementById('e-status');
    if (st) new MutationObserver(decorarStatus).observe(st, { childList: true });
    window.addEventListener('resize', function () { S.forEach(function (s) { medirDepois(s); }); });
    montar();
  }
  function montar() {
    if (!conteudoEl) return;
    var vaga = conteudoEl.querySelector('[data-parede-vaga]');
    if (vaga) {
      var aba = conteudoEl.dataset.aba || '';
      if (aba !== abaMontada) topoGuardado = 0;
      abaMontada = aba;
      vaga.parentNode.replaceChild(raiz, vaga);
      conteudoEl.scrollTop = topoGuardado; /* o render da Estação zera a rolagem com a vaga vazia: devolve onde a pessoa estava */
      aoMontar();
    } else if (!raiz.isConnected) reconciliar();
  }
  function aoMontar() {
    pintarGeral();
    reconciliar();
    S.forEach(function (s) { medirDepois(s); });
    if (focoDentro && amp) { var s = S.get(amp); if (s && s.term && podeDigitar(s)) s.term.focus(); }
  }

  /* ------------------------------------------------------------------ visibilidade → assinatura (term-assistir / term-parar) */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) { var s = S.get(e.target.dataset.k); if (s) s.visto = e.isIntersecting; });
    reconciliar();
  }, { root: null, rootMargin: '160px' }) : null;

  function querAssistir(s) { return raiz.isConnected && !s.desligado && (amp === s.k || (!amp && (io ? s.visto : true) && !s.el.hidden)); }
  function reconciliar() {
    S.forEach(function (s) {
      if (querAssistir(s)) {
        if (s.pararT) { clearTimeout(s.pararT); s.pararT = null; }
        if (!s.assistindo) assistir(s);
      } else if (s.assistindo && !s.pararT) {
        s.pararT = setTimeout(function () { s.pararT = null; if (!querAssistir(s)) parar(s); }, ESPERA_PARAR);
      }
    });
  }
  function assistir(s) {
    if (!garantirTerm(s)) return;
    s.assistindo = true;
    /* terminal de outra pessoa: o dono manda a tela inteira e depois a saída ao vivo. Terminal meu: a saída já chega a todas
       as telas locais; só peço a tela quando não vi nenhuma (ex.: a página recarregou e o painel não pediu) */
    if (!s.meu) enviar({ tipo: 'term-assistir', dono: s.dono, id: s.id });
    else if (s.precisaTela) { s.precisaTela = false; enviar({ tipo: 'term-assistir', dono: s.dono, id: s.id }); }
  }
  function parar(s) {
    s.assistindo = false;
    if (!s.meu && S.has(s.k)) enviar({ tipo: 'term-parar', dono: s.dono, id: s.id });
  }

  /* ------------------------------------------------------------------ o xterm de cada sessão (só leitura no cartão) */
  function esperarFontes() {
    if (esperandoFontes || fontesProntas) return;
    esperandoFontes = true;
    var fim = function () { fontesProntas = true; reconciliar(); };
    try { Promise.race([document.fonts.load(FONTE_CARTAO + 'px "JetBrains Mono"'), new Promise(function (ok) { setTimeout(ok, 1500); })]).then(fim, fim); } catch (e) { fim(); }
  }
  function garantirTerm(s) {
    if (s.term) return true;
    if (!s.caixa.isConnected) return false;
    if (!fontesProntas) { esperarFontes(); return false; }
    var noAmp = amp === s.k;
    var t = new window.Terminal({
      cols: s.cols, rows: s.rows, fontFamily: FONTE, fontSize: noAmp ? FONTE_AMP : FONTE_CARTAO, lineHeight: 1.2, theme: TEMA,
      disableStdin: !noAmp, cursorBlink: false, cursorStyle: 'block', scrollback: 1000, allowProposedApi: true, drawBoldTextInBrightColors: true
    });
    t.open(s.caixa);
    s.term = t;
    /* só vira tecla o que nasce de um gesto da pessoa: as respostas automáticas do xterm (DA, posição do cursor, foco)
       já saíram do terminal do dono e não podem ir de novo para o pty dele */
    t.attachCustomKeyEventHandler(function (ev) { if (ev.type === 'keydown') s.tecla = performance.now(); return true; });
    s.caixa.addEventListener('paste', function () { s.tecla = performance.now(); }, true);
    t.onData(function (d) { aoDigitar(s, d); });
    if (typeof t.onRender === 'function') t.onRender(function () { medirDepois(s); });
    if (s.bruto) { t.write(s.bruto); s.bruto = ''; }
    medirDepois(s);
    return true;
  }
  function texto(s) {
    if (!s || !s.term) return '';
    var b = s.term.buffer.active, linhas = [];
    for (var i = 0; i < b.length; i++) { var l = b.getLine(i); if (l) linhas.push(l.translateToString(true)); }
    return linhas.join('\n').replace(/\n+$/, '');
  }
  function redimensionar(s, cols, rows) {
    cols = Math.floor(+cols); rows = Math.floor(+rows);
    if (!(cols > 1 && rows > 0) || (cols === s.cols && rows === s.rows)) return;
    s.cols = cols; s.rows = rows;
    if (s.term) { try { s.term.resize(cols, rows); } catch (e) { /* tamanho recusado: fica o anterior */ } }
    medirDepois(s);
  }

  /* escala: o xterm tem o tamanho do dono (cols × rows) e cabe no cartão por transform; se a altura passa, mostra a linha do cursor */
  var pendentesMedir = new Set(), medirAgendado = false;
  function medirDepois(s) {
    pendentesMedir.add(s);
    if (medirAgendado) return;
    medirAgendado = true;
    requestAnimationFrame(medirTodos);
    setTimeout(medirTodos, 120); /* janela sem quadro (escondida ou de fundo): mede do mesmo jeito */
  }
  function medirTodos() {
    if (!medirAgendado) return;
    medirAgendado = false;
    var l = Array.from(pendentesMedir); pendentesMedir.clear();
    l.forEach(medir);
  }
  function medir(s) {
    if (!s.term || !s.caixa.isConnected || !S.has(s.k)) return;
    var tela = s.caixa.querySelector('.xterm-screen');
    if (!tela) return;
    var w = tela.offsetWidth, h = tela.offsetHeight;
    if (!w || !h) return;
    var noAmp = amp === s.k, janela = noAmp ? ampTela : s.telaEl, escala = noAmp ? ampEscala : s.escala;
    var larg = janela.clientWidth - (noAmp ? 28 : 16);
    if (larg <= 0) return;
    /* no cartão a letra não fica menor que ~6,6 px: linha maior que o cartão é cortada à direita (o começo da linha é o que conta) */
    var k = limitar(larg / w, noAmp ? 0.5 : 0.6, 1);
    var alt = h * k, visivel;
    if (noAmp) visivel = Math.max(120, janela.clientHeight - 24);
    else { visivel = limitar(alt, 118, 168); var novaAlt = Math.round(visivel + 12) + 'px'; if (s.telaEl.style.height !== novaAlt) s.telaEl.style.height = novaAlt; }
    var desloc = 0;
    if (alt > visivel + 1) {
      var linhaH = h / Math.max(1, s.term.rows), cy = s.term.buffer.active.cursorY;
      desloc = limitar((cy + 1) * linhaH * k - visivel + 4, 0, alt - visivel);
    }
    var tr = 'translateY(' + (-desloc).toFixed(1) + 'px) scale(' + k.toFixed(4) + ')';
    if (escala.style.transform !== tr) escala.style.transform = tr;
  }

  /* ------------------------------------------------------------------ sessões e cartões */
  function criarSessao(dono, id) {
    var s = {
      k: dono + '/' + id, dono: dono, id: id, nome: id, meu: dono === euId(), cols: 100, rows: 30, pausada: false, desligado: false,
      processo: null, criada: Date.now(), term: null, bruto: '', visto: false, assistindo: false, pararT: null, tecla: 0,
      fimSaida: '', bloco: null, iniciada: false, telaVista: false, precisaTela: false, visitas: ''
    };
    var c = el('article', 'pr-cartao');
    c.setAttribute('role', 'listitem');
    c.tabIndex = 0;
    c.dataset.k = s.k; c.dataset.acao = 'parede-ampliar'; c.dataset.dono = dono; c.dataset.id = id;
    c.innerHTML = '<span class="pr-fio" aria-hidden="true"></span>' +
      '<header class="pr-topo"><span class="pr-av"></span><span class="pr-mini"></span>' +
        '<span class="pr-ag"><b class="pr-ag-nome"></b><small class="pr-ag-pessoa"></small></span>' +
        '<span class="pr-selo"><i></i><span class="pr-selo-t"></span></span></header>' +
      '<div class="pr-bloco" hidden></div>' +
      '<div class="pr-tela"><div class="pr-escala"></div><div class="pr-tela-aviso" hidden></div></div>' +
      '<footer class="pr-pe"><span class="pr-frase"></span><span class="pr-acoes"></span></footer>';
    s.el = c; s.fio = c.querySelector('.pr-fio'); s.telaEl = c.querySelector('.pr-tela'); s.escala = c.querySelector('.pr-escala');
    s.caixa = el('div', 'pr-xterm');
    s.escala.appendChild(s.caixa);
    s.mini = new O.Presenca(c.querySelector('.pr-mini'), { tamanho: 'mini' });
    s.erroProvavel = function () { return ERRO.test(s.fimSaida.slice(-2048)); };
    s.v = O.vincular({ mini: s.mini, aba: s.fio, corpo: c, meu: false, erroProvavel: s.erroProvavel });
    S.set(s.k, s);
    if (io) io.observe(c);
    return s;
  }
  function remover(s) {
    if (amp === s.k) voltar();
    if (io) io.unobserve(s.el);
    if (s.pararT) clearTimeout(s.pararT);
    if (s.assistindo && !s.meu) enviar({ tipo: 'term-parar', dono: s.dono, id: s.id });
    try { if (s.term) s.term.dispose(); } catch (e) { /* já foi */ }
    try { s.v.destruir(); s.mini.destruir(); } catch (e) { /* já foi */ }
    if (s.el.parentNode) s.el.parentNode.removeChild(s.el);
    S.delete(s.k);
  }
  function atualizarInfo(s, info, eraDesligado) {
    s.nome = String(info.nome || info.id).slice(0, 60);
    if (+info.cols > 0 && +info.rows > 0) redimensionar(s, +info.cols, +info.rows);
    if (+info.criada) s.criada = +info.criada;
    if (typeof info.processo === 'string') s.processo = info.processo;
    var pausada = !!info.pausada;
    if (!s.iniciada || eraDesligado) {
      s.iniciada = true;
      s.pausada = pausada;
      if (pausada) s.v.pausa(true);
      /* estado de partida sem acender nada: "terminou" antigo não é evento novo */
      else s.v.atividade({ estado: info.estado && info.estado !== 'terminou' && info.estado !== 'pausado' ? info.estado : 'shell', processo: info.processo, desde: +info.criada || Date.now() });
    } else if (pausada !== s.pausada) { s.pausada = pausada; s.v.pausa(pausada); }
  }
  function sessoesDe(dono) { var l = []; S.forEach(function (s) { if (s.dono === dono) l.push(s); }); return l.sort(function (a, b) { return a.criada - b.criada; }); }
  function minhas() { return sessoesDe(euId()); }
  function ordemPessoas() {
    var ids = [], vistos = {}, me = euId();
    function por(id) { if (id && !vistos[id]) { vistos[id] = true; ids.push(id); } }
    /* os terminais dos outros primeiro: os meus já estão no painel da direita */
    (R.pares() || []).slice().sort(function (a, b) { return String(a.nome || a.id).localeCompare(String(b.nome || b.id), 'pt-BR'); }).forEach(function (p) { por(p.id); });
    S.forEach(function (s) { if (s.dono !== me) por(s.dono); });
    por(me);
    return ids;
  }
  function ordenar() {
    var ordem = [];
    ordemPessoas().forEach(function (d) { sessoesDe(d).forEach(function (s) { ordem.push(s); }); });
    var atual = Array.prototype.slice.call(grade.children);
    var igual = atual.length === ordem.length && ordem.every(function (s, i) { return atual[i] === s.el; });
    if (!igual) ordem.forEach(function (s) { grade.appendChild(s.el); });
    ordem.forEach(function (s) { s.el.hidden = !!filtro && s.dono !== filtro; });
  }

  /* os controles ativos que a parede mostra: os do servidor (com id, para encerrar/sair) + os públicos entre terceiros
     ("● Carla aqui" no terminal da Rita, na minha parede), sem repetir o mesmo dono/quem/sessão */
  function ativos() {
    var l = controles.filter(function (c) { return c.estado === 'ativo'; }), visto = {};
    l.forEach(function (c) { visto[c.dono + '|' + c.quem + '|' + (c.sessao == null ? '*' : c.sessao)] = true; });
    Object.keys(publicos).forEach(function (d) {
      (publicos[d] || []).forEach(function (c) {
        var k = d + '|' + c.quem + '|' + (c.sessao == null ? '*' : c.sessao);
        if (visto[k]) return;
        visto[k] = true;
        l.push({ id: 'pub:' + k, dono: d, quem: c.quem, sessao: c.sessao, estado: 'ativo', publico: true });
      });
    });
    return l;
  }
  function controlesAtivosEm(s) {
    return ativos().filter(function (c) { return c.dono === s.dono && (c.sessao == null || c.sessao === s.id); });
  }
  function meuControle(s) {
    var me = euId();
    return controles.filter(function (c) { return c.quem === me && c.dono === s.dono && (c.sessao == null || c.sessao === s.id); })
      .sort(function (a, b) { return (a.estado === 'ativo' ? 0 : 1) - (b.estado === 'ativo' ? 0 : 1); })[0] || null;
  }
  function podeDireto(dono) {
    var me = euId();
    return L.eAdmin() || (L.estado.projetos || []).some(function (p) { return (p.membros || []).indexOf(me) !== -1 && (p.membros || []).indexOf(dono) !== -1; });
  }
  function podeDigitar(s) {
    if (s.meu) return true;
    var c = meuControle(s);
    return !!(c && c.estado === 'ativo' && !s.pausada && !s.desligado);
  }
  function estadoCartao(s) { return s.desligado ? 'desligado' : s.pausada ? 'pausado' : s.v.estado(); }
  function seloDe(s) {
    var vis = controlesAtivosEm(s), me = euId();
    if (s.desligado) return { texto: 'desligado', classe: 'off' };
    if (s.pausada) return { texto: s.meu ? 'você pausou' : 'pausado por ' + nomeDe(s.dono), classe: 'pausa' };
    if (vis.length) return { texto: (vis[0].quem === me ? 'você' : nomeDe(vis[0].quem)) + ' aqui' + (vis.length > 1 ? ' +' + (vis.length - 1) : ''), classe: 'visita', cor: corDe(vis[0].quem) };
    return { texto: 'ao vivo', classe: 'vivo' };
  }
  function fraseDe(s) {
    if (s.desligado) return 'computador de ' + nomeDe(s.dono) + ' desligado';
    var e = s.v.estado(), d = s.v.dados() || {};
    var proc = (e === 'rodando' || e === 'terminou' || e === 'espera' || e === 'falhou') && (d.processo || s.processo) ? (d.processo || s.processo) + ' · ' : '';
    return proc + s.v.frase();
  }
  function pintarSelo(seloEl, s) {
    var st = seloDe(s);
    seloEl.className = 'pr-selo ' + st.classe + (seloEl.classList.contains('pr-amp-selo') ? ' pr-amp-selo' : '');
    if (st.cor) seloEl.style.setProperty('--visita', st.cor); else seloEl.style.removeProperty('--visita');
    txt(seloEl.querySelector('.pr-selo-t'), st.texto);
    return st;
  }
  function acoesHtml(s, noAmp) {
    var h = '';
    if (s.meu) {
      h += '<button class="pr-bt" type="button" data-acao="parede-pausar" data-id="' + esc(s.id) + '" data-sim="' + (s.pausada ? 0 : 1) + '">' + (s.pausada ? 'Retomar transmissão' : 'Pausar transmissão') + '</button>';
      if (noAmp) controlesAtivosEm(s).forEach(function (c) { h += '<button class="pr-bt" type="button" data-acao="controle-encerrar" data-id="' + esc(c.id) + '">Encerrar ' + esc(nomeDe(c.quem)) + '</button>'; });
    } else if (!s.desligado) {
      var c = meuControle(s);
      if (!c) h += '<button class="pr-bt prim" type="button" data-acao="term-entrar" data-id="' + esc(s.dono) + '" data-agente="' + esc(s.id) + '">' + (podeDireto(s.dono) ? 'Entrar' : 'Pedir para entrar') + '</button>';
      else if (c.estado === 'pedido') h += (noAmp ? '' : '<span class="pr-chip">pedido enviado</span>') + '<button class="pr-bt" type="button" data-acao="controle-sair" data-id="' + esc(c.id) + '">Cancelar</button>';
      else h += '<button class="pr-bt" type="button" data-acao="controle-sair" data-id="' + esc(c.id) + '">Sair</button>';
      h += '<button class="pr-bt" type="button" data-acao="term-chamar" data-id="' + esc(s.dono) + '" data-oque="o meu terminal">Chamar</button>';
      if (noAmp) h += '<button class="pr-bt" type="button" data-acao="falar-com" data-id="' + esc(s.dono) + '">Falar</button>';
    }
    if (noAmp) h += '<button class="pr-bt discreto" type="button" data-acao="parede-voltar">Voltar para a parede</button>';
    return h;
  }
  function blocoHtml(b) {
    var t = BLOCO[b.tipo] || ['•', b.tipo || 'bloco'];
    var titulo = b.titulo && b.titulo.toLowerCase() !== t[1] ? b.titulo : '';
    var corpo = [titulo, b.texto].filter(Boolean).join(': ');
    return '<b>' + esc(t[0] + ' ' + t[1]) + '</b><span>' + esc(String(corpo).replace(/\s+/g, ' ').slice(0, 160)) + '</span>';
  }
  function pintarCartao(s) {
    if (!S.has(s.k)) return;
    var c = s.el, p = pessoa(s.dono);
    c.dataset.estado = estadoCartao(s);
    c.dataset.vivo = !s.desligado && !s.pausada ? 'sim' : 'nao';
    c.classList.toggle('meu', s.meu);
    c.style.setProperty('--pessoa', p.cor || '#2ad5e5');
    html(c.querySelector('.pr-av'), U.avatar(p, 22));
    txt(c.querySelector('.pr-ag-nome'), s.nome);
    txt(c.querySelector('.pr-ag-pessoa'), '· ' + p.nome + (s.meu ? ' (você)' : ''));
    var st = pintarSelo(c.querySelector('.pr-selo'), s);
    var vis = controlesAtivosEm(s);
    c.classList.toggle('controlado', vis.length > 0);
    if (vis.length) c.style.setProperty('--visita', corDe(vis[0].quem)); else c.style.removeProperty('--visita');
    var av = c.querySelector('.pr-tela-aviso');
    var aviso2 = s.desligado ? 'computador de ' + p.nome + ' desligado' : s.pausada && !s.meu ? 'transmissão pausada por ' + p.nome : '';
    av.hidden = !aviso2; txt(av, aviso2);
    pintarFrase(s);
    html(c.querySelector('.pr-acoes'), acoesHtml(s, false));
    var bl = c.querySelector('.pr-bloco');
    bl.hidden = !s.bloco;
    if (s.bloco) { bl.dataset.tipo = s.bloco.tipo || ''; html(bl, blocoHtml(s.bloco)); }
    c.setAttribute('aria-label', 'terminal ' + s.nome + ' de ' + p.nome + ' · ' + st.texto + ' · Enter amplia');
  }
  function pintarFrase(s) {
    var f = s.el.querySelector('.pr-frase');
    txt(f, fraseDe(s));
    f.dataset.estado = estadoCartao(s);
    if (amp === s.k) pintarAmpFrase(s);
  }

  /* ------------------------------------------------------------------ o mapa da sala (constelação) */
  function estadoPessoa(dono) {
    if (!parLigado(dono)) return 'desligado';
    var ss = sessoesDe(dono), melhor = 'shell', prio = -1;
    if (!ss.length) return 'shell';
    ss.forEach(function (s) { var e = estadoCartao(s), p = PRIO_ESTADO[e] == null ? 2 : PRIO_ESTADO[e]; if (p > prio) { prio = p; melhor = e; } });
    return melhor;
  }
  function pintarConstelacao() {
    if (!con) return;
    var ids = ordemPessoas(), quer = {};
    ids.forEach(function (d) {
      var ss = sessoesDe(d), p = pessoa(d);
      quer['p:' + d] = true;
      con.no('p:' + d, { nome: p.nome + (ss.length ? ' · ' + ss[0].nome + (ss.length > 1 ? ' +' + (ss.length - 1) : '') : ''), cor: p.cor || '#2ad5e5', estado: estadoPessoa(d) });
    });
    Object.keys(con.nos).forEach(function (id) { if (!quer[id]) con.remover(id); });
    var lacos = {};
    ativos().forEach(function (c) { if (quer['p:' + c.quem] && quer['p:' + c.dono]) lacos['p:' + c.quem + '>p:' + c.dono] = corDe(c.quem); });
    Object.keys(lacosAtuais).forEach(function (k) { if (!lacos[k]) { var ab = k.split('>'); con.laco(ab[0], ab[1], null); delete lacosAtuais[k]; } });
    Object.keys(lacos).forEach(function (k) { if (lacosAtuais[k] !== lacos[k]) { var ab = k.split('>'); con.laco(ab[0], ab[1], lacos[k]); lacosAtuais[k] = lacos[k]; } });
  }

  /* ------------------------------------------------------------------ o que depende de tudo: cabeçalho, mapa, lateral, vazio */
  function pintarGeral() {
    var ids = ordemPessoas(), total = S.size, vivos = 0, ajudando = 0;
    S.forEach(function (s) { if (!s.desligado && !s.pausada) vivos++; });
    ativos().forEach(function () { ajudando++; });
    txt(raiz.querySelector('.pr-sub'), ids.length + (ids.length === 1 ? ' pessoa' : ' pessoas') + ' · ' + total + (total === 1 ? ' terminal' : ' terminais') + ' · ' + vivos + ' ao vivo' +
      (ajudando ? ' · ' + ajudando + (ajudando === 1 ? ' pessoa ajudando' : ' pessoas ajudando') + ' em terminal de outra' : '') + '. Todo mundo vê todo mundo; para ajudar, entre e digite.');
    html(raiz.querySelector('.pr-cab-acoes'), filtro ? '<span class="pr-chip-filtro">só ' + esc(nomeDe(filtro)) + '</span><button class="pr-bt" type="button" data-acao="term-pessoa" data-id="">Parede (todos)</button>' : '');
    txt(raiz.querySelector('.pr-sala-equipe'), 'equipe: ' + ids.length + (ids.length === 1 ? ' presença' : ' presenças'));
    var sinal = raiz.querySelector('.pr-sala-sinal');
    txt(sinal, vivos ? 'sinal: ao vivo' : 'sinal: em silêncio');
    sinal.classList.toggle('quieto', !vivos);
    var vazio = raiz.querySelector('.pr-vazio');
    vazio.hidden = total > 0;
    txt(vazio, 'Nenhum terminal aberto na equipe agora. Abra um no painel da direita: ele aparece aqui para todo mundo, ao vivo.');
    ordenar();
    pintarConstelacao();
    atualizarLateral();
    /* o rodapé do protótipo mostra "terminal ao vivo / pausado" a partir disto (sem evento no diário) */
    var me = euId(), meus = minhas();
    if (me && L.estado) { L.estado.transmissao = L.estado.transmissao || {}; L.estado.transmissao[me] = !(meus.length && meus.every(function (s) { return s.pausada; })); }
    garantirRelogio();
  }
  function garantirRelogio() {
    var precisa = false;
    S.forEach(function (s) { if (!s.desligado && !s.pausada && s.v.estado() === 'rodando') precisa = true; });
    if (precisa && !relogio) relogio = setInterval(tique, 1000);
    if (!precisa && relogio) { clearInterval(relogio); relogio = null; }
  }
  function tique() {
    if (!document.hidden && raiz.isConnected) S.forEach(function (s) { if (s.v.estado() === 'rodando') pintarFrase(s); });
    garantirRelogio();
  }

  /* ------------------------------------------------------------------ ampliado */
  function ampliar(k) {
    var s = S.get(k);
    if (!s) return false;
    if (amp === k) { pintarAmp(); return true; }
    if (amp) devolverCaixa();
    amp = k;
    vistaParede.hidden = true;
    ampEl.hidden = false;
    ampEscala.appendChild(s.caixa);
    if (s.term) { s.term.options.fontSize = FONTE_AMP; s.term.options.disableStdin = false; }
    ampPresEl.innerHTML = '';
    ampPres = new O.Presenca(ampPresEl, { tamanho: 'grande', estado: s.v.estado(), dados: s.v.dados() });
    ampV = O.vincular({ presenca: ampPres, aba: ampFio, corpo: ampTela, meu: false, erroProvavel: s.erroProvavel });
    if (s.pausada) ampV.pausa(true);
    ampV.visitantes(visitantesDe(s));
    txt(ampAviso, ''); ampAviso.classList.remove('erro');
    pintarAmp();
    reconciliar();
    medirDepois(s);
    atualizarLateral();
    if (s.term && podeDigitar(s)) s.term.focus();
    return true;
  }
  function devolverCaixa() {
    var s = S.get(amp);
    amp = null;
    if (ampPres) { try { ampPres.destruir(); } catch (e) { /* já foi */ } ampPres = null; }
    if (ampV) { ampV.destruir(); ampV = null; }
    if (s) {
      s.escala.appendChild(s.caixa);
      if (s.term) { s.term.options.fontSize = FONTE_CARTAO; s.term.options.disableStdin = true; s.term.blur(); }
      medirDepois(s);
    }
  }
  function voltar() {
    if (!amp) return;
    devolverCaixa();
    ampEl.hidden = true;
    vistaParede.hidden = false;
    reconciliar();
    atualizarLateral();
  }
  function visitantesDe(s) { return controlesAtivosEm(s).map(function (c) { return { id: c.quem, nome: nomeDe(c.quem), cor: corDe(c.quem) }; }); }
  function pintarAmpFrase(s) {
    var p = pessoa(s.dono);
    txt(ampEl.querySelector('.pr-amp-frase'), (s.desligado ? 'desligado' : s.pausada ? (s.meu ? 'você pausou a transmissão' : 'transmissão pausada por ' + p.nome) : 'ao vivo') + ' · ' + fraseDe(s));
  }
  function pintarAmp() {
    if (!amp) return;
    var s = S.get(amp);
    if (!s) { voltar(); return; }
    var p = pessoa(s.dono), c = s.meu ? null : meuControle(s);
    ampEl.style.setProperty('--pessoa', p.cor || '#2ad5e5');
    html(ampEl.querySelector('.pr-amp-av'), U.avatar(p, 40));
    txt(ampEl.querySelector('.pr-amp-titulo h1'), p.nome + ' · ' + s.nome);
    pintarAmpFrase(s);
    pintarSelo(ampEl.querySelector('.pr-amp-selo'), s);
    html(ampEl.querySelector('.pr-amp-acoes'), acoesHtml(s, true));
    var ss = sessoesDe(s.dono);
    html(ampEl.querySelector('.pr-amp-sessoes'), ss.length > 1 ? ss.map(function (x) {
      return '<button class="pr-bt' + (x.k === amp ? ' ativo' : '') + '" type="button" data-acao="parede-ampliar" data-k="' + esc(x.k) + '" aria-pressed="' + (x.k === amp) + '">' + esc(x.nome) + '</button>';
    }).join('') : '');
    var faixa = ampEl.querySelector('.pr-amp-faixa'), textoFaixa = '';
    if (c && c.estado === 'ativo') textoFaixa = '● você está no terminal de ' + p.nome + ' · o que você digitar roda lá';
    else if (c && c.estado === 'pedido') textoFaixa = '◌ pedido enviado · esperando ' + p.nome + ' aceitar';
    else if (s.meu) textoFaixa = '● o seu terminal · o que você digitar aqui roda nele';
    faixa.hidden = !textoFaixa; txt(faixa, textoFaixa);
    faixa.style.setProperty('--visita', corDe(euId()));
    faixa.classList.toggle('pedido', !!(c && c.estado === 'pedido'));
    ampTela.classList.toggle('digitavel', podeDigitar(s));
    ampTela.dataset.estado = estadoCartao(s);
    ampTela.style.setProperty('--visita', corDe(euId()));
    if (s.term) s.term.options.cursorBlink = podeDigitar(s);
  }
  function avisoAmp(t, erro) { txt(ampAviso, t); ampAviso.classList.toggle('erro', !!erro); }

  /* o teclado do ampliado: meu terminal escreve direto; o de outra pessoa só com controle ativo (o dono confere de novo) */
  function aoDigitar(s, d) {
    if (amp !== s.k || !d) return;
    if (/^\x1b\[[IO]$/.test(d)) return;                     /* relato de foco: não é tecla */
    if (performance.now() - (s.tecla || 0) > 250) return;   /* resposta automática do xterm: o terminal do dono já respondeu */
    if (s.meu) { enviar({ tipo: 'term-entrada', id: s.id, dados: d }); return; }
    var c = meuControle(s);
    if (!c) { avisoAmp('Para digitar aqui, entre no terminal de ' + nomeDe(s.dono) + ' (botão ' + (podeDireto(s.dono) ? 'Entrar' : 'Pedir para entrar') + ').'); return; }
    if (c.estado !== 'ativo') { avisoAmp('Esperando ' + nomeDe(s.dono) + ' aceitar: ainda não dá para digitar.'); return; }
    if (s.pausada) { avisoAmp(nomeDe(s.dono) + ' pausou a transmissão: as teclas não passam até retomar.'); return; }
    enviar({ tipo: 'term-entrada', dono: s.dono, id: s.id, dados: d });
  }

  /* ------------------------------------------------------------------ lateral */
  function lateralHtml() {
    var me = euId(), ids = ordemPessoas();
    var h = '<div class="lat-titulo"><span class="rotulo">Terminais da equipe</span></div><ul class="lat-lista">' +
      '<li><button class="lat-item" type="button" data-acao="term-pessoa" data-id="" aria-current="' + (!filtro && !amp) + '"><span class="rotulo-texto">Parede (todos)</span><span class="conta">' + S.size + '</span></button></li>';
    ids.forEach(function (d) {
      var p = pessoa(d), ss = sessoesDe(d), ligado = parLigado(d);
      var st = !ligado ? 'desligado' : !ss.length ? 'sem terminal' : ss.every(function (s) { return s.pausada; }) ? 'pausado' : 'ao vivo';
      var atual = filtro === d || (amp && S.get(amp) && S.get(amp).dono === d);
      h += '<li><button class="lat-item" type="button" data-acao="term-pessoa" data-id="' + esc(d) + '" aria-current="' + !!atual + '"><span class="ponto ' + (st === 'ao vivo' ? 'online' : st === 'desligado' ? 'offline' : 'ausente') + '"></span>' +
        '<span class="rotulo-texto">' + esc(p.nome) + (d === me ? ' <small>(você)</small>' : '') + (ss.length ? ' <small>· ' + esc(ss.map(function (s) { return s.nome; }).join(', ')) + '</small>' : '') + '</span><span class="conta">' + st + '</span></button></li>';
    });
    h += '</ul><div class="lat-titulo"><span class="rotulo">Os seus terminais</span></div>';
    var meus = minhas();
    h += meus.length ? '<ul class="pr-lat-meus">' + meus.map(function (s) {
      return '<li class="pr-lat-meu' + (s.pausada ? ' pausado' : '') + '"><span>' + esc(s.nome) + '</span><small>' + (s.pausada ? '○ pausado' : '● ao vivo') + '</small>' +
        '<button class="botao discreto" type="button" data-acao="parede-pausar" data-id="' + esc(s.id) + '" data-sim="' + (s.pausada ? 0 : 1) + '">' + (s.pausada ? 'Retomar' : 'Pausar') + '</button></li>';
    }).join('') + '</ul>' : '<p class="lat-nota">Nenhum terminal seu aberto agora. Abra um no painel da direita.</p>';
    h += '<p class="lat-nota">Todos veem todos. Para mexer: a gestão entra direto; membros do mesmo projeto também; os outros pedem e o dono aceita com um clique. Quem está no seu terminal aparece com um selo, e você encerra quando quiser. Pausado: nada do que sair durante a pausa chega a ninguém, nem depois.</p>';
    return h;
  }
  function atualizarLateral() {
    var lat = document.getElementById('e-lateral');
    if (lat && lat.dataset.vista === 'terminais') html(lat, lateralHtml());
  }

  /* ------------------------------------------------------------------ selos do rodapé (desenhados pelo protótipo; aqui ganham luz e nome real) */
  function nomeSessao(dono, sessao) {
    if (sessao == null) return dono === euId() ? 'todos os seus terminais' : 'todos os terminais';
    var s = S.get(dono + '/' + sessao);
    return s ? s.nome : sessao;
  }
  function decorarStatus() {
    var st = document.getElementById('e-status');
    if (!st) return;
    var agora = Date.now(), me = euId();
    st.querySelectorAll('.st-controle, .st-pedido').forEach(function (item) {
      var b = item.matches('[data-acao]') ? item : item.querySelector('[data-id]');
      if (!b) return;
      var c = null;
      if (b.dataset.acao === 'term-pessoa') c = controles.filter(function (x) { return x.quem === me && x.dono === b.dataset.id && x.estado === 'ativo'; })[0];
      else c = controles.filter(function (x) { return x.id === b.dataset.id; })[0];
      if (!c) return;
      var quemCor = c.quem === me ? corDe(me) : corDe(c.quem);
      item.classList.add('pr-selo-st');
      item.style.setProperty('--pr-cor', quemCor);
      var t0 = chegadas[c.id] || agora;
      item.style.setProperty('--luz', Math.pow(2, -(agora - t0) / MV_SELO).toFixed(3));
      /* o protótipo procura o nome do agente em pessoa.agentes; no app real a sessão tem o próprio nome */
      var no = item.firstChild;
      if (no && no.nodeType === 3 && c.dono === me) {
        var alvo = nomeSessao(c.dono, c.sessao);
        no.data = c.estado === 'ativo' ? '● ' + nomeDe(c.quem) + ' está no seu terminal ' + alvo + ' ' : nomeDe(c.quem) + ' quer entrar no seu terminal ' + alvo + ' ';
      }
      if (respirarSelo[c.id]) { delete respirarSelo[c.id]; O.respirar(item, { cor: quemCor, duracao: 1200 }); }
    });
  }

  /* ------------------------------------------------------------------ mensagens do servidor */
  function aoBemvindo(m) {
    eu = m.eu && m.eu.id;
    pronto = true;
    S.forEach(function (s) { s.assistindo = false; if (s.pararT) { clearTimeout(s.pararT); s.pararT = null; } s.meu = s.dono === eu; }); /* reconectou: o servidor esqueceu quem assistia */
    aoLista(eu, m.terminais || []);
    var tp = m.terminaisPares || {};
    Object.keys(tp).forEach(function (d) { aoLista(d, tp[d]); });
    publicos = {};
    var cp = m.controlesPublicos || {};
    Object.keys(cp).forEach(function (d) { aoPublico(d, cp[d]); });
    aoControles(m.controles || []);
    mandarProjetos(true);
    enviar({ tipo: 'term-lista?' });
    /* as minhas sessões que já existiam: se ninguém pedir a tela delas em 2 s (o painel costuma pedir), peço uma vez */
    setTimeout(function () {
      S.forEach(function (s) {
        if (!s.meu || s.telaVista) return;
        s.precisaTela = true;
        if (s.term) { s.precisaTela = false; enviar({ tipo: 'term-assistir', dono: s.dono, id: s.id }); }
      });
    }, 2000);
    reconciliar();
  }
  function aoLista(dono, lista) {
    if (!dono) return;
    lista = Array.isArray(lista) ? lista : [];
    listas.set(dono, lista);
    var ids = {}, mudou = false;
    lista.forEach(function (info) {
      if (!info || !ID_SESSAO.test(String(info.id))) return;
      ids[info.id] = true;
      var s = S.get(dono + '/' + info.id), era = false;
      if (!s) { s = criarSessao(dono, info.id); mudou = true; } else era = s.desligado;
      s.desligado = false;
      atualizarInfo(s, info, era);
      pintarCartao(s);
    });
    var ligado = parLigado(dono);
    sessoesDe(dono).forEach(function (s) {
      if (ids[s.id]) return;
      if (ligado) remover(s); else marcarDesligado(s);
      mudou = true;
    });
    pintarGeral();
    if (amp) pintarAmp();
    if (mudou) reconciliar();
  }
  function marcarDesligado(s) {
    if (s.desligado) return;
    s.desligado = true;
    s.v.fim(0);
    if (s.assistindo) { s.assistindo = false; if (s.pararT) { clearTimeout(s.pararT); s.pararT = null; } }
    pintarCartao(s);
  }
  function aoPares() {
    var donos = {};
    S.forEach(function (s) { donos[s.dono] = true; });
    Object.keys(donos).forEach(function (d) { if (!parLigado(d)) sessoesDe(d).forEach(marcarDesligado); });
    pintarGeral();
    if (amp) pintarAmp();
  }
  function sessaoDe(m) { return m && m.id ? S.get((m.dono || euId()) + '/' + m.id) : null; }
  function aoTela(m) {
    var s = sessaoDe(m);
    if (!s) return;
    s.telaVista = true;
    if (+m.cols > 0 && +m.rows > 0) redimensionar(s, +m.cols, +m.rows);
    var dados = typeof m.dados === 'string' ? m.dados : '';
    if (s.term) { s.term.reset(); s.term.write(dados, function () { medirDepois(s); }); }
    else s.bruto = dados;
  }
  function aoAberto(m) {
    var info = m.info;
    if (!info || !ID_SESSAO.test(String(info.id))) return;
    var dono = info.dono || euId();
    if (!S.has(dono + '/' + info.id)) { var l = (listas.get(dono) || []).filter(function (x) { return x.id !== info.id; }).concat([info]); aoLista(dono, l); }
    var s = S.get(dono + '/' + info.id);
    if (!s) return;
    aoTela({ dono: dono, id: info.id, cols: info.cols, rows: info.rows, dados: m.tela || '' });
    s.v.aberto();
  }
  function aoSaida(m) {
    var s = sessaoDe(m);
    if (!s || typeof m.dados !== 'string') return;
    s.fimSaida = (s.fimSaida + m.dados).slice(-4096);
    if (s.term) s.term.write(m.dados);
    else if (s.meu) { s.bruto += m.dados; if (s.bruto.length > BRUTO_MAX) { s.bruto = ''; s.precisaTela = true; } }
    s.v.saida(m.dados);
    if (amp === s.k && ampV) ampV.saida(m.dados);
    O.acender(s.fio, 6000);
    var t = performance.now();
    if (con && t - (luzPessoa[s.dono] || 0) > 700) { luzPessoa[s.dono] = t; con.acender('p:' + s.dono, { pulso: false }); }
  }
  function aoPausa(m) {
    var s = sessaoDe(m);
    if (!s) return;
    s.pausada = !!m.pausada;
    s.v.pausa(s.pausada);
    if (amp === s.k && ampV) ampV.pausa(s.pausada);
    pintarCartao(s);
    if (amp === s.k) pintarAmp();
    pintarGeral();
  }
  function aoAtividade(m) {
    var s = sessaoDe(m);
    if (!s || !m.estado) return;
    if (m.estado === 'rodando') s.fimSaida = '';
    if (typeof m.processo === 'string') s.processo = m.processo;
    var antes = s.v.estado();
    s.pausada = m.estado === 'pausado';
    s.v.atividade(m);
    if (amp === s.k && ampV) ampV.atividade(m);
    if (m.estado === 'terminou' && antes !== 'terminou' && con) {
      var dur = +m.duracao || 0;
      /* R2: comando rápido era o esperado (só a luz); acima de 2 s o pulso corre do anel da pessoa até o centro e o chão acende */
      con.acender('p:' + s.dono, { pulso: dur >= 2000, forte: dur > 10000, cor: s.v.estado() === 'falhou' ? 'alarme' : 'marca' });
      if (dur >= 2000) O.acender(salaEl, 9000);
    }
    pintarCartao(s);
    if (amp === s.k) pintarAmp();
    if (con) con.estado('p:' + s.dono, estadoPessoa(s.dono));
    garantirRelogio();
  }
  function aoFim(m) {
    var s = sessaoDe(m);
    if (!s) return;
    s.v.fim(m.codigo);
    if (amp === s.k && ampV) ampV.fim(m.codigo);
    pintarCartao(s);
    if (con) con.estado('p:' + s.dono, estadoPessoa(s.dono));
  }
  function aoRecusado(m) {
    var dono = m.dono;
    if (m.motivo === 'fora da rede') { aviso('O computador de ' + nomeDe(dono) + ' não está na rede agora.'); if (amp && S.get(amp) && S.get(amp).dono === dono) avisoAmp('O computador de ' + nomeDe(dono) + ' não está na rede agora.', true); return; }
    var s = m.id ? S.get(dono + '/' + m.id) : null;
    var motivo = m.motivo || 'recusado';
    if (amp && ((s && amp === s.k) || (!s && S.get(amp) && S.get(amp).dono === dono))) {
      O.respirar(ampTela, { cor: 'alarme', duracao: 700 });
      avisoAmp('Tecla recusada por ' + nomeDe(dono) + ': ' + motivo + '.', true);
    } else if (s) s.v.recusado();
    else aviso('Recusado por ' + nomeDe(dono) + ': ' + motivo + '.');
  }
  function aoControles(lista) {
    var antes = controles, me = euId();
    controles = (Array.isArray(lista) ? lista : []).filter(function (c) { return c && typeof c.id === 'string' && c.dono && c.quem; }).map(function (c) {
      return { id: c.id, dono: c.dono, quem: c.quem, sessao: c.sessao == null ? null : String(c.sessao), estado: c.estado === 'ativo' ? 'ativo' : 'pedido', direto: !!c.direto, ts: +c.ts || Date.now() };
    });
    controles.forEach(function (c) {
      var a = antes.filter(function (x) { return x.id === c.id; })[0];
      var virouAtivo = c.estado === 'ativo' && (!a || a.estado !== 'ativo');
      if (!a || virouAtivo) { chegadas[c.id] = Date.now(); if (c.dono === me) respirarSelo[c.id] = true; }
      if (c.dono === me && c.estado === 'pedido' && !a) aviso(nomeDe(c.quem) + ' quer entrar no seu terminal ' + nomeSessao(c.dono, c.sessao) + ' · aceite na barra de baixo');
      if (c.dono === me && virouAtivo && !a) aviso(nomeDe(c.quem) + ' entrou no seu terminal ' + nomeSessao(c.dono, c.sessao) + (c.direto ? ' (entrada direta)' : '') + '. Você encerra na barra de baixo.');
      if (c.dono === me && virouAtivo && a) aviso('OK · ' + nomeDe(me) + ' · ' + (O.hora ? O.hora() : '') + ' — ' + nomeDe(c.quem) + ' está no seu terminal ' + nomeSessao(c.dono, c.sessao) + '.');
      if (c.quem === me && virouAtivo) {
        aviso('Você está no terminal ' + nomeSessao(c.dono, c.sessao) + ' de ' + nomeDe(c.dono) + '. O que digitar roda lá.');
        var alvo = amp && S.get(amp);
        if (alvo && alvo.dono === c.dono && (c.sessao == null || c.sessao === alvo.id)) { avisoAmp(''); setTimeout(function () { if (alvo.term && amp === alvo.k) alvo.term.focus(); }, 0); }
      }
    });
    Object.keys(chegadas).forEach(function (id) { if (!controles.some(function (c) { return c.id === id; })) delete chegadas[id]; });
    repintarControles();
    /* os selos do rodapé do protótipo leem L.estado.controles ({id,dono,quem,agenteId,estado,ts}): só os do servidor (os públicos não têm botão) */
    controlesPostos = controles.map(function (c) { return { id: c.id, dono: c.dono, quem: c.quem, agenteId: c.sessao, sessao: c.sessao, estado: c.estado, direto: c.direto, ts: c.ts }; });
    L.estado.controles = controlesPostos;
    if (naEstacao() && BC.estacao && BC.estacao.render && BC.estacao.ui) L._mudou([]);
  }
  function repintarControles() {
    S.forEach(function (s) {
      var vis = visitantesDe(s), chave = vis.map(function (v) { return v.id; }).join(',');
      if (chave !== s.visitas) { s.visitas = chave; s.v.visitantes(vis); if (amp === s.k && ampV) ampV.visitantes(vis); }
      pintarCartao(s);
    });
    pintarGeral();
    if (amp) pintarAmp();
  }
  /* {tipo:'controles-publico', dono, lista:[{quem, sessao}]}: o servidor do dono espalhou, o meu repassou (o dono é o par) */
  function aoPublico(dono, lista) {
    if (typeof dono !== 'string' || !dono) return;
    var me = euId();
    var l = (Array.isArray(lista) ? lista : []).filter(function (c) { return c && typeof c.quem === 'string' && c.quem !== dono; }).map(function (c) { return { quem: c.quem, sessao: c.sessao == null ? null : String(c.sessao) }; });
    if (dono === me) return; /* os meus terminais vêm completos em 'controles' */
    if (l.length) publicos[dono] = l; else delete publicos[dono];
    if (pronto) repintarControles();
  }
  function aoControleFim(m) {
    var motivo = m.motivo || 'encerrado', dono = m.dono;
    if (motivo === 'recusado') aviso(nomeDe(dono) + ' disse "agora não".');
    else if (motivo === 'encerrado') aviso(nomeDe(dono) + ' encerrou o seu acesso ao terminal.');
    else if (motivo === 'saiu') aviso('Você saiu do terminal de ' + nomeDe(dono) + '.');
    else if (motivo === 'terminal fechado') aviso('O terminal de ' + nomeDe(dono) + ' fechou.');
    if (amp && S.get(amp) && S.get(amp).dono === dono) avisoAmp(motivo === 'encerrado' ? nomeDe(dono) + ' encerrou o seu acesso: para digitar de novo, entre outra vez.' : '');
  }
  /* agente real (PROTOCOLO §7): o estado do agente manda na mini presença; o último bloco aparece no cartão */
  var ESTADO_AGENTE = { pensando: 'rodando', rodando: 'rodando', espera: 'espera', terminou: 'terminou', falhou: 'falhou' };
  function aoAgenteEstado(m) {
    var s = sessaoDe(m);
    if (!s) return;
    if (m.estado === 'acordou') { O.acender(s.mini.el, 1500); return; }
    var e = ESTADO_AGENTE[m.estado];
    if (!e || s.pausada) return;
    var ts = +m.ts || Date.now(), desde = +m.desde || ts;
    aoAtividade({ dono: s.dono, id: s.id, estado: e, processo: m.ferramenta || 'claude', desde: desde, duracao: e === 'terminou' ? Math.max(0, ts - desde) : 0, fim: ts });
  }
  function aoAgenteBloco(m) {
    var s = sessaoDe(m);
    if (!s || !m.bloco || typeof m.bloco !== 'object') return;
    s.bloco = { tipo: String(m.bloco.tipo || ''), titulo: String(m.bloco.titulo || ''), texto: String(m.bloco.texto || ''), ts: +m.bloco.ts || Date.now() };
    pintarCartao(s);
    O.acender(s.el.querySelector('.pr-bloco'), 6000);
  }

  R.ouvir(function (m) {
    if (!m || typeof m.tipo !== 'string') return;
    switch (m.tipo) {
      case 'bemvindo': aoBemvindo(m); return;
      case 'pares': if (pronto) aoPares(); return;
      case 'term-lista': if (pronto) aoLista(m.dono, m.lista); return;
      case 'term-aberto': if (pronto) aoAberto(m); return;
      case 'term-tela': aoTela(m); return;
      case 'term-saida': aoSaida(m); return;
      case 'term-tamanho': { var s = sessaoDe(m); if (s) redimensionar(s, m.cols, m.rows); return; }
      case 'term-pausa': aoPausa(m); return;
      case 'term-atividade': aoAtividade(m); return;
      case 'term-fim': aoFim(m); return;
      case 'term-recusado': aoRecusado(m); return;
      case 'controles': if (pronto) aoControles(m.lista); return;
      case 'controles-publico': aoPublico(m.dono, m.lista); return;
      case 'controle-fim': aoControleFim(m); return;
      case 'agente-estado': aoAgenteEstado(m); return;
      case 'agente-bloco': aoAgenteBloco(m); return;
      default: return;
    }
  });

  /* projetos → servidor (quem é do mesmo projeto entra direto; PROTOCOLO §4) */
  function mandarProjetos(forcar) {
    if (!pronto || !naEstacao()) return;
    var lista = (L.estado.projetos || []).map(function (p) { return { id: String(p.id), membros: (p.membros || []).slice() }; });
    var ass = JSON.stringify(lista);
    if (!forcar && ass === assinaturaProjetos) return;
    assinaturaProjetos = ass;
    enviar({ tipo: 'projetos', lista: lista });
  }
  L.aoMudar(function () {
    if (!pronto) return;
    mandarProjetos(false);
    /* outra janela desta máquina trocou o estado inteiro: os controles continuam os do servidor */
    if (controlesPostos && L.estado.controles !== controlesPostos) L.estado.controles = controlesPostos;
  });

  /* ------------------------------------------------------------------ ações (o que era L.fazer no protótipo vira mensagem ao servidor) */
  function controlePorId(id) { return controles.filter(function (c) { return c.id === id; })[0] || null; }
  function abrirParede() { if (BC.estacao && BC.estacao.abrir) BC.estacao.abrir('terminais'); }
  A['controle-aceitar'] = function (b) { var c = controlePorId(b.dataset.id); if (!c) return; enviar({ tipo: 'controle-aceitar', id: c.id }); };
  A['controle-recusar'] = function (b) { var c = controlePorId(b.dataset.id); if (!c) return; enviar({ tipo: 'controle-recusar', id: c.id }); };
  A['controle-encerrar'] = function (b) { var c = controlePorId(b.dataset.id); if (!c) return; enviar({ tipo: 'controle-encerrar', id: c.id }); aviso(nomeDe(c.quem) + ' saiu do seu terminal: controle encerrado.'); };
  A['controle-sair'] = function (b) { var c = controlePorId(b.dataset.id); if (!c) return; enviar({ tipo: 'controle-sair', id: c.id, dono: c.dono }); };
  A['term-entrar'] = function (b) {
    var dono = b.dataset.id, sessao = b.dataset.agente || null, me = euId();
    if (!dono || dono === me) return;
    if (sessao && !S.has(dono + '/' + sessao)) sessao = null;
    var alvo = sessao ? S.get(dono + '/' + sessao) : sessoesDe(dono)[0];
    var ja = alvo ? meuControle(alvo) : controles.filter(function (c) { return c.quem === me && c.dono === dono; })[0];
    if (ja) aviso(ja.estado === 'ativo' ? 'Você já está nesse terminal.' : 'Você já pediu para entrar: esperando ' + nomeDe(dono) + ' aceitar.');
    else {
      enviar({ tipo: 'term-pedir', dono: dono, sessao: sessao });
      aviso(podeDireto(dono) ? 'Entrando no terminal de ' + nomeDe(dono) + '…' : 'Pedido enviado: ' + nomeDe(dono) + ' precisa aceitar.');
    }
    if (alvo) { filtro = null; ampliar(alvo.k); }
    abrirParede();
  };
  A['term-pessoa'] = function (b) {
    var dono = b.dataset.id || null, sessao = b.dataset.agente || null, me = euId();
    if (!dono) { filtro = null; voltar(); }
    else {
      var c = controles.filter(function (x) { return x.quem === me && x.dono === dono && x.estado === 'ativo'; })[0];
      var alvo = sessao ? S.get(dono + '/' + sessao) : c ? (c.sessao ? S.get(dono + '/' + c.sessao) : sessoesDe(dono)[0]) : null;
      if (alvo) { filtro = null; ampliar(alvo.k); } else { filtro = dono; voltar(); }
    }
    pintarGeral();
    abrirParede();
  };
  A['parede-ampliar'] = function (b) { if (ampliar(b.dataset.k)) abrirParede(); };
  A['parede-voltar'] = function () { voltar(); };
  A['parede-focar'] = function () { var s = amp && S.get(amp); if (s && s.term) s.term.focus(); };
  A['parede-pausar'] = function (b) {
    var id = b.dataset.id, sim = b.dataset.sim === '1';
    if (!ID_SESSAO.test(String(id))) return;
    enviar({ tipo: 'term-pausar', id: id, sim: sim });
    aviso(sim ? 'Transmissão pausada: nada do que sair agora chega a ninguém, nem depois.' : 'Transmissão de volta: quem assiste recomeça de uma tela limpa.');
  };
  /* "terminal ao vivo / pausado" do rodapé do protótipo: se ninguém trocou a ação simulada, ela passa a pausar de verdade */
  if (A['term-transmissao'] && /fazer\('transmissao'/.test(String(A['term-transmissao']))) {
    A['term-transmissao'] = function () {
      var meus = minhas();
      if (!meus.length) { aviso('Nenhum terminal seu aberto para pausar.'); return; }
      var pausar = meus.some(function (s) { return !s.pausada; });
      meus.forEach(function (s) { enviar({ tipo: 'term-pausar', id: s.id, sim: pausar }); });
      aviso(pausar ? 'Transmissão pausada em todos os seus terminais.' : 'Transmissão ligada de novo.');
    };
  }

  /* a vista "Terminais" do protótipo passa a ser esta */
  BC.vistas = BC.vistas || {};
  var vistaSimulada = BC.vistas.terminais;
  BC.vistas.terminais = {
    lateral: lateralHtml,
    conteudo: function () {
      /* outras telas do protótipo abrem a parede já numa pessoa (ui.termPessoa): vira o filtro */
      var u = BC.estacao && BC.estacao.ui;
      if (u && u.termPessoa) { filtro = u.termPessoa; u.termPessoa = null; if (amp) voltar(); }
      return '<div class="pr-vaga" data-parede-vaga></div>';
    },
    simulada: vistaSimulada
  };

  /* ------------------------------------------------------------------ API (testes e as outras peças) */
  BC.parede = {
    versao: VERSAO,
    sessoes: function () {
      var l = [];
      S.forEach(function (s) { l.push({ k: s.k, dono: s.dono, id: s.id, nome: s.nome, meu: s.meu, pausada: s.pausada, desligado: s.desligado, estado: estadoCartao(s), assistindo: s.assistindo, visto: s.visto, cols: s.cols, rows: s.rows, temTerm: !!s.term }); });
      return l;
    },
    sessao: function (k) { var s = S.get(k); return s ? BC.parede.sessoes().filter(function (x) { return x.k === k; })[0] : null; },
    texto: function (k) { return texto(S.get(k)); },
    ampliar: ampliar,
    voltar: voltar,
    ampliado: function () { return amp; },
    controles: function () { return controles.map(function (c) { return Object.assign({}, c); }); },
    /* todos os ativos que a parede mostra, incluindo os públicos entre terceiros (publico:true) */
    ativos: function () { return ativos().map(function (c) { return Object.assign({}, c); }); },
    podeDigitar: function (k) { var s = S.get(k); return !!(s && podeDigitar(s)); },
    focar: function () { var s = amp && S.get(amp); if (s && s.term) { s.term.focus(); return true; } return false; }
  };

  esperarFontes();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', vigiarEstacao); else vigiarEstacao();
})();
