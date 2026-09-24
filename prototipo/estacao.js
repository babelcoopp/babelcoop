/* Babel Coop — protótipo · Estação: casca com cara de VS Code
   explorador à esquerda, arquivo no meio, terminal à direita; as laterais recolhem (Ctrl+B, Ctrl+`) e as bordas arrastam */
window.BC = window.BC || {};
BC.acoes = BC.acoes || {};
BC.formularios = BC.formularios || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc, A = BC.acoes, F = BC.formularios;
  function L() { return BC.loja; }
  function $(id) { return document.getElementById(id); }

  /* ICONES · o desenho vem de BC.icones (icones.js: 61 da casca + 16 peças + 6 estados, traço 1,5, à mão);
     este mapa antigo só serve de reserva para um nome que ainda não esteja lá (ex.: ipad) */
  var ICONE_ANTIGO = {
    explorador: '<path d="M8 3h7l4 4v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M15 3v4h4"/><path d="M4 7v13a1 1 0 0 0 1 1h10"/>',
    dia: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    demandas: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9.5 2h5"/><path d="M12 2v3"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    reuniao: '<rect x="4" y="11" width="16" height="6" rx="2"/><circle cx="8" cy="6.5" r="2"/><circle cx="16" cy="6.5" r="2"/><path d="M8 17v3M16 17v3"/>',
    acervo: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>',
    inteligencia: '<path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7-4.7-1.8 4.7-1.8z"/><path d="M18 15l.8 2.2 2.2.8-2.2.8L18 21l-.8-2.2-2.2-.8 2.2-.8z"/>',
    terminais: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M12 15h5"/>',
    oficina: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.1-2.1z"/>',
    tarefas: '<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="4" height="13" rx="1"/>',
    metas: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.8"/>',
    equipe: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.2c3 .2 5.5 2.6 5.5 5.8"/>',
    mapa: '<circle cx="6" cy="7" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="12" cy="17" r="2.2"/><path d="M8 8l2.7 7M16.6 7.8L13.2 15M8.2 7h7.6"/>',
    tv: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>',
    ipad: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M11 18h2"/><path d="M8.5 12.5l2.5-2.5 3.5 3.5"/>',
    mais: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    projetos: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="9" cy="13" r="1.6"/><circle cx="15" cy="13" r="1.6"/>',
    whatsapp: '<path d="M4 20l1.3-3.8A8 8 0 1 1 8.4 19z"/><path d="M9.5 9.5c0 3 2 5 5 5l1-1.5-2-1-1 1a4 4 0 0 1-2-2l1-1-1-2z"/>',
    loja: '<path d="M4 9l1.5-4h13L20 9"/><path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M9 20v-6h6v6"/>',
    maquina: '<rect x="3" y="4" width="8" height="6" rx="1.2"/><rect x="13" y="4" width="8" height="6" rx="1.2"/><rect x="8" y="14" width="8" height="6" rx="1.2"/><path d="M7 10v2h10v-2M12 12v2"/>'
  };
  var ICONE = (function () {
    var o = {}, I = BC.icones;
    Object.keys(ICONE_ANTIGO).forEach(function (k) { o[k] = ICONE_ANTIGO[k]; });
    if (I && I.nomes) {
      I.nomes().forEach(function (k) { o[k] = I[k]; });
      Object.keys(I.apelidos || {}).forEach(function (k) { if (I.tem(k)) o[k] = I[I.real(k)]; });
    }
    return o;
  })();
  var ATIVIDADES = [
    ['explorador', 'Criar · telas, máquina e pesquisas'], ['dia', 'Meu dia'], ['demandas', 'Demandas'], ['chat', 'Chat'], ['reuniao', 'Reunião'],
    ['acervo', 'Acervo · busca sem LLM'], ['inteligencia', 'Inteligência da equipe'], ['terminais', 'Terminais ao vivo'],
    ['tarefas', 'Tarefas com fluxo'], ['metas', 'Metas e campanhas'], ['equipe', 'Equipe'], ['mapa', 'Mapa da equipe'],
    ['projetos', 'Projetos'], ['whatsapp', 'WhatsApp'], ['loja', 'Loja da equipe'], ['oficina', 'Oficina do app · mudar o Babel Coop pelo terminal']
  ];
  var CELULAR = [['dia', 'Meu dia'], ['demandas', 'Demandas'], ['chat', 'Chat'], ['explorador', 'Criar'], ['mais', 'Mais']];
  var NOMES = { explorador: 'Criar', maquina: 'Máquina' };
  /* eventos da loja que acendem as laterais da foto de quem fez (os acertos; o terminal e a presença vêm da parede-real) */
  var AV_EVENTOS = { inicio: 1, retomada: 1, pegou: 1, pronta: 1, conclusao: 1, comemoracao: 1, valeu: 1, controle: 1 };
  ATIVIDADES.forEach(function (a) { if (!NOMES[a[0]]) NOMES[a[0]] = a[1].split(' · ')[0]; });
  /* a barra do plano (CONCEITO §3.1): 12 atividades na ordem da peneira; os grupos abrem a primeira vista e a lateral
     mostra no topo o alternador entre as vistas do grupo. Todas as 16 vistas continuam registradas (E.abrir, paleta, Mais). */
  var BARRA = [
    ['dia', 'Meu dia', ['dia']], ['explorador', 'Criar', ['explorador']], ['demandas', 'Trabalho', ['demandas', 'tarefas']],
    ['chat', 'Chat', ['chat']], ['whatsapp', 'WhatsApp', ['whatsapp']], ['reuniao', 'Reunião', ['reuniao']], ['terminais', 'Terminais', ['terminais']],
    ['projetos', 'Projetos', ['projetos']], ['acervo', 'Acervo', ['acervo', 'inteligencia']], ['equipe', 'Equipe', ['equipe', 'metas', 'mapa']],
    ['loja', 'Loja', ['loja']], ['oficina', 'Oficina', ['oficina']]
  ];
  var GRUPO_DE = {};
  BARRA.forEach(function (g) { g[2].forEach(function (v) { GRUPO_DE[v] = g; }); });
  var NOME_VISTA = { demandas: 'Demandas', tarefas: 'Tarefas', acervo: 'Acervo', inteligencia: 'Inteligência', equipe: 'Equipe', metas: 'Metas', mapa: 'Mapa' };
  function tituloAtividade(id) { var a = ATIVIDADES.filter(function (x) { return x[0] === id; })[0]; return a ? a[1] : NOMES[id] || id; }
  var LAT_PADRAO = 264, TERM_PADRAO = 440;
  var FALAS_EXEMPLO = ['E se a gente mandasse um áudio de boas-vindas para cada cliente novo?', 'Que tal uma pergunta da semana só sobre atendimento?',
    'A gente podia gravar os webinars e deixar no acervo.', 'E se o cronômetro avisasse quando passar da estimativa?', 'Vamos testar a proposta de uma página com as clínicas de Campinas.'];

  function svg(nome, tam) {
    var I = BC.icones;
    if (I && I.tem && I.tem(nome)) return I.svg(nome, tam || 22);
    return '<svg class="bci" data-icone-antigo="' + nome + '" viewBox="0 0 24 24" width="' + (tam || 22) + '" height="' + (tam || 22) + '" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONE[nome] || '') + '</svg>';
  }
  function layoutSalvo() { try { return JSON.parse(U.lerLocal('babel-coop:layout') || '{}') || {}; } catch (e) { return {}; } }
  var salvo = layoutSalvo();

  var E = {
    ui: {
      abas: [], ativa: null,
      lat: salvo.lat !== false, term: salvo.term !== false, latW: salvo.latW || LAT_PADRAO, termW: salvo.termW || TERM_PADRAO,
      abertas: {}, filtroArq: '', novoArquivo: false,
      canal: 'geral', buscaChat: '', respondendo: null, emojis: false, anexar: false, digitando: {},
      filtroDem: 'recebidas', inline: null, cronMin: true, rascunho: null,
      visaoTarefas: 'todas', fluxoNovo: null, mapaNo: null,
      buscaAcervo: '', modoAcervo: 'palavras', tipoAcervo: '', secaoInt: 'aprendizados', termPessoa: null, buscaTerm: '',
      falar: false, ouvindo: false, perfil: false, mais: false, coluna: false, vistos: {}, novos: 0
    }
  };
  var mapa = null, terminal = null, avisoTimer = null, gravandoTimer = null, conteudoPendente = false;

  var VAZIA = { id: 'vazio', tipo: 'vazio' };
  E.abaAtual = function () {
    var u = E.ui;
    return u.abas.filter(function (t) { return t.id === u.ativa; })[0] || u.abas[0] || VAZIA;
  };
  function atividadeDe(tab) { return tab.atividade || tab.tipo; }

  function tituloAba(tab) {
    if (tab.tipo === 'chat') { var c = L().conversa(E.ui.canal); return c ? L().nomeConversa(c, L().eu) : 'Chat'; }
    if (tab.tipo === 'demanda') { var d = L().demanda(tab.ref); return d ? d.titulo : tab.titulo; }
    if (tab.tipo === 'arquivo') { var a = L().arquivo(tab.ref); return a ? a.caminho.split('/').pop() : tab.titulo; }
    if (tab.tipo === 'perfil') return 'Sobre ' + L().nome(tab.ref);
    if (tab.tipo === 'projeto') { var pj = (L().estado.projetos || []).filter(function (x) { return x.id === tab.ref; })[0]; return pj ? pj.nome : 'Projeto'; }
    return tab.titulo || NOMES[tab.tipo] || tab.tipo;
  }
  function iconeAba(tab) {
    if (tab.tipo === 'arquivo') { var a = L().arquivo(tab.ref); return a ? '<span class="arv-ic ic-' + esc(a.tipo) + '">' + esc(BC.explorador.sigla(a.tipo)) + '</span>' : ''; }
    if (tab.tipo === 'perfil') { var p = L().pessoa(tab.ref); return p ? U.avatar(p, 16) : ''; }
    var at = atividadeDe(tab);
    return ICONE[at] ? '<span class="aba-ic">' + svg(at, 14) + '</span>' : '';
  }

  E.abrirAba = function (tab) {
    var ja = E.ui.abas.filter(function (t) { return t.id === tab.id; })[0];
    if (!ja) E.ui.abas.push(tab); else if (tab.titulo) ja.titulo = tab.titulo;
    E.ui.ativa = tab.id;
    E.ui.inline = null;
    E.ui.mais = false;
    if (tab.tipo === 'arquivo') { var arq = L().arquivo(tab.ref); if (arq && arq.dono !== L().eu) L().fazer('vendoArquivo', arq.id); }
    E.render();
    var c = $('e-conteudo');
    if (c && !ja && tab.tipo !== 'arquivo') c.scrollTop = 0;
  };
  E.abrirPerfil = function (id) { if (L().pessoa(id)) E.abrirAba({ id: 'perfil:' + id, tipo: 'perfil', ref: id, atividade: 'equipe' }); };
  E.abrirProjeto = function (id) { E.abrirAba({ id: 'projeto:' + id, tipo: 'projeto', ref: id, atividade: 'projetos' }); };
  E.abrir = function (atividade) {
    if (atividade === 'explorador') {
      var arq = E.ui.abas.filter(function (t) { return t.tipo === 'arquivo'; }).pop();
      E.abrirAba(arq || { id: 'explorador', tipo: 'explorador' });
      return;
    }
    E.abrirAba({ id: atividade, tipo: atividade });
  };
  E.fecharAba = function (id) {
    var u = E.ui, i = u.abas.map(function (t) { return t.id; }).indexOf(id);
    if (i === -1) return;
    if (u.abas[i].tipo === 'arquivo') BC.editor.esquecer(u.abas[i].id);
    u.abas.splice(i, 1);
    if (u.ativa === id) u.ativa = u.abas.length ? u.abas[Math.max(0, i - 1)].id : null;
    E.render();
  };
  /* fecha tudo: o meio fica vazio, com a marca d'água */
  E.fecharTodas = function () {
    E.ui.abas.forEach(function (t) { if (t.tipo === 'arquivo') BC.editor.esquecer(t.id); });
    E.ui.abas = [];
    E.ui.ativa = null;
    E.render();
  };

  E.aviso = function (texto) {
    E.ui.ultimoAviso = texto;
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () { E.ui.ultimoAviso = null; renderToast(); }, 5200);
    renderToast();
  };

  /* ---------- laterais que recolhem e bordas que arrastam ---------- */

  function aplicarLayout() {
    var r = $('vista-estacao'), u = E.ui;
    r.style.setProperty('--lat', u.lat ? u.latW + 'px' : '0px');
    r.style.setProperty('--r1', u.lat ? '5px' : '0px');
    r.style.setProperty('--term', u.term ? u.termW + 'px' : '0px');
    r.style.setProperty('--r2', u.term ? '5px' : '0px');
    r.dataset.lat = u.lat ? 'sim' : 'nao';
    r.dataset.term = u.term ? 'sim' : 'nao';
    U.guardarLocal('babel-coop:layout', JSON.stringify({ lat: u.lat, term: u.term, latW: u.latW, termW: u.termW }));
  }
  E.alternarTerminal = function (abrir) {
    E.ui.term = abrir === undefined ? !E.ui.term : !!abrir;
    aplicarLayout();
    if (E.ui.term && terminal) terminal.focar();
    renderAbas();
    renderStatus();
  };
  E.alternarLateral = function (abrir) {
    E.ui.lat = abrir === undefined ? !E.ui.lat : !!abrir;
    aplicarLayout();
    renderAtividades();
    renderAbas();
  };

  function montarBordas() {
    document.querySelectorAll('#vista-estacao .e-borda').forEach(function (b) {
      var qual = b.dataset.borda;
      b.addEventListener('pointerdown', function (ev) {
        ev.preventDefault();
        b.setPointerCapture(ev.pointerId);
        b.classList.add('arrastando');
        var caixa = $('vista-estacao').getBoundingClientRect();
        function mover(e2) {
          if (qual === 'lat') E.ui.latW = Math.round(Math.max(170, Math.min(520, e2.clientX - caixa.left - 48)));
          else E.ui.termW = Math.round(Math.max(280, Math.min(Math.max(320, caixa.width - 560), caixa.right - e2.clientX)));
          aplicarLayout();
        }
        function soltar() {
          b.classList.remove('arrastando');
          b.removeEventListener('pointermove', mover);
          b.removeEventListener('pointerup', soltar);
          b.removeEventListener('pointercancel', soltar);
        }
        b.addEventListener('pointermove', mover);
        b.addEventListener('pointerup', soltar);
        b.addEventListener('pointercancel', soltar);
      });
      b.addEventListener('dblclick', function () { if (qual === 'lat') E.ui.latW = LAT_PADRAO; else E.ui.termW = TERM_PADRAO; aplicarLayout(); });
      b.addEventListener('keydown', function (ev) {
        var d = ev.key === 'ArrowLeft' ? -16 : ev.key === 'ArrowRight' ? 16 : 0;
        if (!d) return;
        ev.preventDefault();
        if (qual === 'lat') E.ui.latW = Math.max(170, Math.min(520, E.ui.latW + d));
        else E.ui.termW = Math.max(280, Math.min(900, E.ui.termW - d));
        aplicarLayout();
      });
    });
  }

  /* ---------- guardar e restaurar o que a pessoa está digitando ---------- */

  function guardar(raiz) {
    var r = { v: {}, foco: null, sel: null };
    raiz.querySelectorAll('input[id]:not([type="file"]), textarea[id], select[id]').forEach(function (el) { r.v[el.id] = el.type === 'checkbox' ? el.checked : el.value; });
    var a = document.activeElement;
    if (a && a.id && raiz.contains(a)) { r.foco = a.id; try { r.sel = [a.selectionStart, a.selectionEnd]; } catch (e) { r.sel = null; } }
    return r;
  }
  function restaurar(raiz, r) {
    Object.keys(r.v).forEach(function (id) {
      var el = raiz.querySelector('#' + CSS.escape(id));
      if (!el || el.type === 'file') return;
      if (el.type === 'checkbox') el.checked = r.v[id]; else el.value = r.v[id];
    });
    if (r.foco) {
      var f = raiz.querySelector('#' + CSS.escape(r.foco));
      if (f) { f.focus(); if (r.sel && f.setSelectionRange) try { f.setSelectionRange(r.sel[0], r.sel[1]); } catch (e) { /* campo sem seleção */ } }
    }
  }

  /* ---------- desenho ---------- */

  function vistaDe(atividade) {
    if (atividade === 'demandas') return BC.demandasUI;
    if (atividade === 'chat') return BC.chat;
    if (atividade === 'explorador') return BC.explorador;
    return BC.vistas[atividade];
  }

  function marcas() {
    var e = L().estado, eu = L().eu;
    return {
      demandas: e.demandas.filter(function (d) { return (d.para === eu && d.estado === 'enviada') || (d.de === eu && d.estado === 'pronta'); }).length,
      chat: L().minhasConversas(eu).reduce(function (s, c) { return s + L().naoLidas(eu, c.id); }, 0),
      reuniao: e.reuniao && e.reuniao.ativa ? '●' : 0
    };
  }

  var ALIAS_ATIVIDADE = { maquina: 'explorador', navegador: 'terminais', perfil: 'equipe', projeto: 'projetos' };
  function renderAtividades() {
    var atual = ALIAS_ATIVIDADE[atividadeAtual()] || atividadeAtual(), p = L().pessoa(L().eu), m = marcas(), grupo = GRUPO_DE[atual];
    $('e-atividades').innerHTML = BARRA.map(function (g) {
      var n = m[g[0]], titulo = g[2].map(tituloAtividade).join(' + ');
      return '<button type="button" data-acao="atividade" data-id="' + g[0] + '" data-grupo="' + g[2].join(' ') + '" title="' + esc(titulo) + '" aria-label="' + esc(g[1]) + '"' + (grupo === g ? ' aria-current="page"' : '') + '>' +
        svg(g[0], 20) + (n ? '<span class="marca-num' + (n === '●' ? ' vivo' : '') + '">' + n + '</span>' : '') + '<span class="ativ-rotulo">' + esc(g[1]) + '</span></button>';
    }).join('') + '<span class="ativ-espaco"></span>' +
      (p ? '<button type="button" class="ativ-perfil" data-acao="abrir-perfil" data-id="' + p.id + '" title="Sobre você: trabalhos, tempo, materiais e conquistas" aria-label="Seu perfil">' + U.avatar(p, 22, true) + '</button>' : '');
    $('e-abas-celular').innerHTML = CELULAR.map(function (c) {
      var ativo = c[0] === 'mais' ? E.ui.mais : c[0] === atual && !E.ui.mais;
      return '<button type="button" data-acao="' + (c[0] === 'mais' ? 'mais' : 'atividade') + '" data-id="' + c[0] + '"' + (ativo ? ' aria-current="page"' : '') + '>' + svg(c[0], 20) + '<span>' + c[1] + '</span>' +
        (m[c[0]] ? '<i class="marca-cel">' + m[c[0]] + '</i>' : '') + '</button>';
    }).join('');
  }

  /* a lateral não some quando o meio está vazio: continua na última atividade usada */
  function atividadeAtual() {
    var tab = E.abaAtual();
    if (tab.tipo === 'vazio') return E.ui.ultimaAtividade || 'explorador';
    E.ui.ultimaAtividade = atividadeDe(tab);
    return E.ui.ultimaAtividade;
  }
  function renderLateral() {
    var lat = $('e-lateral'), at = atividadeAtual(), v = vistaDe(at);
    var mesma = lat.dataset.vista === at, r = guardar(lat), topo = lat.scrollTop;
    /* grupo da barra (Trabalho, Acervo, Equipe): o alternador entre as vistas vem no topo da lateral */
    var g = GRUPO_DE[ALIAS_ATIVIDADE[at] || at], alternador = g && g[2].length > 1 ? '<div class="ativ-grupo" role="tablist" aria-label="' + esc(g[1]) + '">' + g[2].map(function (id) {
      return '<button type="button" role="tab" data-acao="grupo-vista" data-id="' + id + '" aria-selected="' + (id === at) + '">' + esc(NOME_VISTA[id] || NOMES[id]) + '</button>';
    }).join('') + '</div>' : '';
    /* Equipe: a planta da sala vem primeiro (quem está em cada projeto ou atividade, endereco.js) */
    lat.innerHTML = alternador + (at === 'equipe' && BC.endereco ? BC.endereco.planta() : '') + (v && v.lateral ? v.lateral() : '');
    lat.dataset.vista = at;
    if (mesma) { restaurar(lat, r); lat.scrollTop = topo; }
    if (BC.endereco) BC.endereco.decorarLateral(lat); /* presença vira posição ao lado de cada arquivo */
  }

  function renderAbas() {
    $('e-abas').innerHTML = E.ui.abas.map(function (t) {
      var sujo = t.modo === 'editar', a = t.tipo === 'arquivo' ? L().arquivo(t.ref) : null;
      return '<div class="e-aba" role="tab" tabindex="0" data-acao="aba" data-id="' + esc(t.id) + '" aria-selected="' + (t.id === E.ui.ativa) + '" title="' + esc(a ? a.caminho : tituloAba(t)) + '">' +
        iconeAba(t) + '<span class="e-aba-nome">' + esc(tituloAba(t).slice(0, 40)) + '</span>' +
        '<span class="fechar' + (sujo ? ' sujo' : '') + '" role="button" tabindex="-1" data-acao="fechar-aba" data-id="' + esc(t.id) + '" aria-label="Fechar aba">' + (sujo ? '●' : '×') + '</span></div>';
    }).join('') + '<div class="e-abas-fim">' +
      (E.ui.abas.length > 1 ? '<button class="e-aba-botao e-aba-fechar-todas" type="button" data-acao="fechar-todas" title="Fechar todas as abas (Ctrl+Shift+W)" aria-label="Fechar todas as abas">××</button>' : '') +
      '<button class="e-aba-botao" type="button" data-acao="lat-alternar" aria-pressed="' + E.ui.lat + '" title="Mostrar ou esconder a lateral (Ctrl+B)" aria-label="Mostrar ou esconder a lateral">' +
      '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="1.5" y="2.5" width="13" height="11" rx="1.5"/><path d="M6 2.5v11"/>' + (E.ui.lat ? '<path d="M2 3h4v10H2z" fill="currentColor" stroke="none" opacity=".45"/>' : '') + '</svg></button>' +
      '<button class="e-aba-botao" type="button" data-acao="terminal-alternar" aria-pressed="' + E.ui.term + '" title="Mostrar ou esconder o terminal (Ctrl+`)" aria-label="Mostrar ou esconder o terminal">' +
      '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="1.5" y="2.5" width="13" height="11" rx="1.5"/><path d="M10 2.5v11"/>' + (E.ui.term ? '<path d="M10 3h4v10h-4z" fill="currentColor" stroke="none" opacity=".45"/>' : '') + '</svg></button></div>';
  }

  function boasVindas() {
    var e = L().estado, recentes = e.arquivos.slice().sort(function (a, b) { return b.modificado - a.modificado; }).slice(0, 8);
    return '<div class="boas-vindas"><img src="babel-logo.png" alt="" class="bv-logo"><h1 class="pagina-titulo">Criar</h1>' +
      '<p class="pagina-sub">É aqui que tudo acontece. Dependendo do que você cria, a tela do meio vira a coisa certa: site vira <b>Tela</b>, backend vira <b>Máquina</b>, texto vira <b>Pesquisa</b>. Numa tela, o modo <b>3D</b> mostra a página num ambiente 3D com os próximos itens ao lado: digite nela, aperte Enter e veja o pulso correr. O agente do terminal participa de tudo.</p>' +
      '<div class="criar-grade">' +
      '<button class="criar-cartao" type="button" data-acao="criar-tela"><span class="criar-ic" style="--c:#29ccec">⬚</span><b>Tela</b><small>uma página, uma landing, um login: abre já como site, edita no visual e tem o modo 3D</small></button>' +
      '<button class="criar-cartao" type="button" data-acao="pj-maquina" data-id="clinicas"><span class="criar-ic" style="--c:#8670ff">⚙</span><b>Máquina</b><small>o backend em peças de Lego: gavetas, portas, robôs, chaves; testa vendo os dados andar</small></button>' +
      '<button class="criar-cartao" type="button" data-acao="criar-pesquisa"><span class="criar-ic" style="--c:#ffcf5c">▤</span><b>Pesquisa</b><small>MD, TXT ou PDF: o agente pesquisa e o texto abre em leitura</small></button>' +
      (L().arquivo('davi/Projetos/Clínicas/landing.html') ? '<button class="criar-cartao destaque" type="button" data-acao="abrir-caminho" data-caminho="davi/Projetos/Clínicas/landing.html"><span class="criar-ic" style="--c:#7fd6a6">◈</span><b>Ver um exemplo em 3D</b><small>abre a landing das clínicas: clique em "3D" para ver a tela e os próximos itens</small></button>' : '') + '</div>' +
      (BC.maquina && BC.maquina.presetsHtml ? '<section class="secao criar-presets"><span class="rotulo">Começar de um preset · o que a equipe já construiu e funcionou</span>' + BC.maquina.presetsHtml(null) + '</section>' : '') +
      '<div class="dem-acoes"><button class="botao" type="button" data-acao="novo-nota">＋ Nota</button><button class="botao" type="button" data-acao="novo-mapa">＋ Mapa mental</button>' +
      '<button class="botao" type="button" data-acao="novo-quadro">＋ Quadro</button><button class="botao" type="button" data-acao="subir-arquivo">↥ Abrir do computador</button></div>' +
      '<section class="secao"><span class="rotulo">Mudaram por último</span><div class="lista-limpa">' + recentes.map(function (a) {
        return '<button class="item" type="button" data-acao="abrir-arquivo" data-id="' + esc(a.id) + '" style="--cor:#42597d"><span class="arv-ic ic-' + esc(a.tipo) + '">' + esc(BC.explorador.sigla(a.tipo)) + '</span>' +
          '<span class="item-corpo"><span class="item-titulo">' + esc(a.caminho.split('/').pop()) + '</span><span class="item-meta">' + esc(a.caminho) + ' · ' + U.relativo(a.modificado) + '</span></span></button>';
      }).join('') + '</div></section>' +
      '<p class="form-ajuda">Atalhos: Ctrl+B esconde a lateral · Ctrl+` esconde o terminal · Ctrl+K abre os comandos · Ctrl+S salva o arquivo.</p></div>';
  }

  function htmlConteudo(tab) {
    var D = BC.demandasUI;
    switch (tab.tipo) {
      case 'demandas': return D.lista();
      case 'demanda': return D.detalhe(tab);
      case 'nova-demanda': return D.formulario();
      case 'chat': return BC.chat.conteudo();
      case 'tarefa': return BC.vistas.tarefas.detalhe(tab);
      case 'nova-tarefa': return BC.vistas.tarefas.formulario();
      case 'explorador': return boasVindas();
      case 'vazio': return '<div class="e-vazio"><img src="babel-logo.png" alt="" class="e-vazio-marca"><p>Nada aberto · <kbd>Ctrl</kbd><kbd>K</kbd> para buscar · a lateral continua ao lado</p></div>';
    }
    var v = BC.vistas[tab.tipo];
    return v ? v.conteudo(tab) : '<p class="vazio">Tela não encontrada.</p>';
  }

  function editandoTexto() {
    var a = document.activeElement;
    return a && a.isContentEditable && $('e-conteudo').contains(a);
  }

  function renderConteudo() {
    var c = $('e-conteudo'), tab = E.abaAtual();
    if (editandoTexto()) { conteudoPendente = true; return; }
    conteudoPendente = false;
    c.className = 'e-conteudo' + (tab.tipo === 'mapa' ? ' sem-margem' : tab.tipo === 'chat' ? ' sem-margem modo-chat' : tab.tipo === 'arquivo' ? ' modo-editor' : tab.tipo === 'vazio' ? ' modo-vazio' : tab.tipo === 'navegador' || tab.tipo === 'whatsapp' || tab.tipo === 'maquina' ? ' modo-editor' : '');
    if (tab.tipo === 'arquivo') {
      if (mapa) { mapa.destruir(); mapa = null; }
      if (c.dataset.aba !== tab.id) c.dataset.chave = '';
      c.dataset.aba = tab.id;
      BC.editor.desenhar(tab, c);
      return;
    }
    if (tab.tipo !== 'navegador') c.dataset.chave = '';
    if (tab.tipo === 'mapa') {
      if (mapa && $('mapa-canvas')) { mapa.atualizar(L().estado); return; }
      c.innerHTML = htmlConteudo(tab);
      c.dataset.aba = tab.id;
      if (mapa) mapa.destruir();
      mapa = new BC.Mapa($('mapa-canvas'), { interativo: true, rotulos: true });
      mapa.atualizar(L().estado);
      mapa.aoSelecionar = function (n) { E.ui.mapaNo = n ? { tipo: n.tipo, id: n.id, rotulo: n.rotulo, offline: n.offline } : null; renderLateral(); };
      return;
    }
    if (mapa) { mapa.destruir(); mapa = null; }
    /* o navegador do agente não recarrega a página a cada mudança de estado: só quando algo da própria aba muda */
    if (tab.tipo === 'navegador' && BC.navegador) {
      var s = BC.navegador.sessoes[tab.ref], u = E.ui;
      var chaveNav = s ? [tab.id, s.raiox, s.aba, s.assumido, s.fim, u.raioxBusca || '', u.raioxReq, L().eu].join('|') : tab.id;
      if (c.dataset.aba === tab.id && c.dataset.chave === chaveNav) { BC.navegador.atualizar(tab.ref); return; }
      c.innerHTML = htmlConteudo(tab);
      c.dataset.aba = tab.id;
      c.dataset.chave = chaveNav;
      if (BC.vistas.navegador.montar) BC.vistas.navegador.montar(tab, c);
      return;
    }
    var mesma = c.dataset.aba === tab.id, topo = c.scrollTop;
    var chatAntes = $('chat-msgs'), chatTopo = chatAntes ? chatAntes.scrollTop : 0;
    var noFim = !chatAntes || chatAntes.scrollHeight - chatAntes.scrollTop - chatAntes.clientHeight < 60;
    var waAntes = $('wa-msgs'), waFim = !waAntes || waAntes.scrollHeight - waAntes.scrollTop - waAntes.clientHeight < 60;
    var r = guardar(c);
    c.innerHTML = htmlConteudo(tab);
    c.dataset.aba = tab.id;
    if (mesma) restaurar(c, r);
    c.scrollTop = mesma ? topo : 0;
    var chat = $('chat-msgs');
    if (chat) chat.scrollTop = noFim || !mesma ? chat.scrollHeight : chatTopo;
    var wa = $('wa-msgs');
    if (wa && (waFim || !mesma)) wa.scrollTop = wa.scrollHeight;
  }

  function renderCronometro() {
    var box = $('cronometro'), html = BC.demandasUI.cronometro();
    if (box.classList.contains('arrastando')) return; /* no meio de um arraste, nada de redesenhar nem reposicionar (era isso que fazia ele voltar para o canto) */
    if (!html) { box.hidden = true; box.innerHTML = ''; return; }
    var r = guardar(box);
    box.hidden = false;
    box.dataset.min = E.ui.cronMin ? 'sim' : 'nao';
    box.innerHTML = '<div class="cron-pega" title="Arraste para qualquer lugar · duplo clique volta ao canto">⋮⋮</div>' + html;
    restaurar(box, r);
    posicionarCronometro();
  }
  /* o cronômetro é móvel: arrasta para qualquer lugar da tela e lembra a posição */
  function posicionarCronometro() {
    var box = $('cronometro'), pos = null;
    try { pos = JSON.parse(U.lerLocal('babel-coop:cronometro-pos') || 'null'); } catch (e) { pos = null; }
    if (pos && typeof pos.x === 'number') { box.style.left = Math.max(0, Math.min(window.innerWidth - 80, pos.x)) + 'px'; box.style.top = Math.max(0, Math.min(window.innerHeight - 40, pos.y)) + 'px'; box.style.right = 'auto'; box.style.bottom = 'auto'; }
    else { box.style.left = ''; box.style.top = ''; box.style.right = ''; box.style.bottom = ''; }
  }
  function montarCronometroMovel() {
    var box = $('cronometro');
    /* arrasta por qualquer ponto da caixa que não seja botão, link ou campo (a pega ⋮⋮ é só a dica visual) */
    box.addEventListener('pointerdown', function (ev) {
      if (ev.button !== 0 || ev.target.closest('button, a, input, select, textarea')) return;
      ev.preventDefault();
      var r = box.getBoundingClientRect(), dx = ev.clientX - r.left, dy = ev.clientY - r.top, moveu = false;
      var pr = box.offsetParent ? box.offsetParent.getBoundingClientRect() : { left: 0, top: 0 }; /* a caixa é posicionada dentro da Estação, que tem uma margem */
      box.classList.add('arrastando');
      try { box.setPointerCapture(ev.pointerId); } catch (e) { /* sem captura: segue pelos eventos da janela */ }
      function mover(e2) {
        var x = Math.max(0, Math.min(window.innerWidth - r.width, e2.clientX - dx)) - pr.left, y = Math.max(0, Math.min(window.innerHeight - r.height, e2.clientY - dy)) - pr.top;
        moveu = true;
        box.style.left = x + 'px'; box.style.top = y + 'px'; box.style.right = 'auto'; box.style.bottom = 'auto';
        U.guardarLocal('babel-coop:cronometro-pos', JSON.stringify({ x: Math.round(x), y: Math.round(y) }));
      }
      function soltar() {
        box.classList.remove('arrastando');
        window.removeEventListener('pointermove', mover); window.removeEventListener('pointerup', soltar); window.removeEventListener('pointercancel', soltar);
        if (moveu) renderCronometro(); /* redesenha o que ficou represado durante o arraste */
      }
      window.addEventListener('pointermove', mover); window.addEventListener('pointerup', soltar); window.addEventListener('pointercancel', soltar);
    });
    box.addEventListener('dblclick', function (ev) {
      if (!ev.target.closest('.cron-pega, .cron-cab, .cron-titulo')) return;
      U.guardarLocal('babel-coop:cronometro-pos', 'null');
      posicionarCronometro();
    });
  }

  function renderStatus() {
    var e = L().estado, eu = L().eu, p = L().pessoa(eu), D = BC.demandasUI;
    var caixa = e.demandas.filter(function (d) { return d.para === eu && d.estado === 'enviada'; }).length + BC.comigo().length;
    var rod = D.doCronometro(), livres = e.demandas.filter(function (d) { return d.estado === 'livre'; }).length, s = e.sala, pr = e.projecao;
    var vivo = e.transmissao[eu] !== false, r = e.reuniao;
    $('e-status').innerHTML =
      '<button class="st-item" type="button" data-acao="presenca" title="Trocar presença"><span class="ponto ' + p.status + '"></span>' + p.status + '</button>' +
      '<button class="st-item" type="button" data-acao="atividade" data-id="dia">' + caixa + ' na caixa</button>' +
      (rod ? '<button class="st-item' + (rod.estado === 'andamento' ? ' st-rodando' : '') + '" type="button" data-acao="abrir-demanda" data-id="' + rod.id + '">◷ ' + esc(rod.titulo.slice(0, 24)) + ' <span data-relogio="' + rod.id + '">' + U.relogio(L().tempo(rod).trabalho) + '</span></button>' : '') +
      (livres ? '<button class="st-item st-livres" type="button" data-acao="dem-filtro" data-filtro="livres">◇ ' + livres + (livres > 1 ? ' livres' : ' livre') + '</button>' : '') +
      (r && r.ativa ? '<button class="st-item st-reuniao" type="button" data-acao="atividade" data-id="reuniao">☰ reunião · <span data-desde="' + r.inicio + '">' + U.relogio(Date.now() - r.inicio) + '</span></button>' : '') +
      (s.gravando ? '<button class="st-item st-gravando" type="button" data-acao="atividade" data-id="reuniao">● gravando a sala</button>' : s.memoria ? '<span class="st-item" title="Escuta os últimos 5 minutos e só guarda quando alguém aperta">◌ memória da sala</span>' : '') +
      (pr ? '<span class="st-item st-proj">▣ na TV: ' + esc(pr.caminho.split('/').pop().slice(0, 22)) +
        (pr.paginas > 1 ? ' <button class="st-mini" type="button" data-acao="pagina" data-delta="-1" aria-label="Página anterior">◀</button>' + pr.pagina + '/' + pr.paginas + '<button class="st-mini" type="button" data-acao="pagina" data-delta="1" aria-label="Próxima página">▶</button>' : '') +
        ' <button class="st-mini" type="button" data-acao="rolar-proj" data-delta="-0.25" title="Rolar para cima na TV (PageUp)" aria-label="Rolar para cima">▲</button><button class="st-mini" type="button" data-acao="rolar-proj" data-delta="0.25" title="Rolar para baixo na TV (PageDown)" aria-label="Rolar para baixo">▼</button>' +
        ' <button class="st-mini" type="button" data-acao="encerrar-projecao" aria-label="Encerrar a projeção">✕</button></span>' : '') +
      selosControle() +
      (BC.oficina ? BC.oficina.seloAtualizar() : '') +
      '<div class="st-dir"><button class="st-item" type="button" data-acao="coluna">' + (L().conectado('tv') ? 'TV conectada' : 'TV não aberta') + '</button>' +
      '<button class="st-item" type="button" data-acao="term-transmissao" title="Seu terminal aparece na tela Terminais ao vivo">' + (vivo ? '● terminal ao vivo' : '○ terminal pausado') + '</button>' +
      '<span class="st-item">acervo: ' + BC.acervo.estatisticas(e).docs + '</span>' +
      '<span class="st-item st-gravado" id="st-gravado">' + (E.ui.gravando ? 'Salvando…' : 'Salvo na equipe') + '</span>' +
      (E.ui.term ? '' : '<button class="st-item" type="button" data-acao="terminal-alternar">mostrar terminal</button>') + '</div>';
  }

  function renderToast() {
    var t = $('e-toast');
    t.hidden = !E.ui.ultimoAviso;
    t.textContent = E.ui.ultimoAviso || '';
  }

  /* quem está no meu terminal, e quem pediu para entrar */
  function nomeAgente(pessoaId, agenteId) {
    var p = L().pessoa(pessoaId), ag = p && (p.agentes || []).filter(function (a) { return a.id === agenteId; })[0];
    return ag ? ag.nome : 'terminal';
  }
  function selosControle() {
    var eu = L().eu, cs = (L().estado.controles || []), h = '';
    cs.filter(function (c) { return c.dono === eu && c.estado === 'ativo'; }).forEach(function (c) {
      h += '<span class="st-item st-controle">● ' + esc(L().nome(c.quem)) + ' está no seu terminal ' + esc(nomeAgente(eu, c.agenteId)) + ' <button class="st-mini" type="button" data-acao="controle-encerrar" data-id="' + c.id + '">Encerrar</button></span>';
    });
    cs.filter(function (c) { return c.dono === eu && c.estado === 'pedido'; }).forEach(function (c) {
      h += '<span class="st-item st-pedido">' + esc(L().nome(c.quem)) + ' quer entrar no seu terminal ' + esc(nomeAgente(eu, c.agenteId)) + ' <button class="st-mini ok" type="button" data-acao="controle-aceitar" data-id="' + c.id + '">Aceitar</button><button class="st-mini" type="button" data-acao="controle-recusar" data-id="' + c.id + '">Agora não</button></span>';
    });
    cs.filter(function (c) { return c.quem === eu && c.estado === 'ativo'; }).forEach(function (c) {
      h += '<button class="st-item st-controle" type="button" data-acao="term-pessoa" data-id="' + c.dono + '">● você está no terminal de ' + esc(L().nome(c.dono)) + '</button>';
    });
    return h;
  }
  E.selosControle = selosControle;

  function renderColuna() {
    var col = $('e-coluna'), e = L().estado, eu = L().eu;
    col.hidden = !E.ui.coluna;
    $('abrir-coluna').setAttribute('aria-expanded', E.ui.coluna);
    var cont = $('contador');
    cont.hidden = !E.ui.novos;
    cont.textContent = E.ui.novos;
    if (!E.ui.coluna) return;
    var dica = L().conectado('tv') ? '' :
      '<div class="col-dica"><strong>Para ver a TV:</strong> clique em <strong>Tela da TV</strong> (abre numa janela própria, sem botão) e arraste para a tela da TV. O iPad é um app à parte: abra este link com <code>#ipad</code> no fim. As janelas conversam na hora.</div>';
    col.innerHTML = '<div class="secao-cab"><span class="rotulo">Novidades</span><button class="botao discreto" type="button" data-acao="coluna">Fechar</button></div>' + dica +
      e.eventos.slice(0, 30).map(function (ev) {
        var p = L().pessoa(ev.pessoa) || { cor: '#8670ff' };
        return '<div class="col-cartao' + (E.ui.vistos[ev.id] === 'novo' ? ' novo' : '') + '" style="--cor:' + p.cor + '">' +
          '<span>' + esc(ev.texto) + '</span><time>' + U.relativo(ev.ts) + (ev.para === eu ? ' · para você' : '') + (ev.tv ? ' · na TV' : '') + '</time>' +
          (ev.demanda ? '<button class="botao discreto" type="button" data-acao="abrir-demanda" data-id="' + ev.demanda + '">Abrir demanda</button>' : '') +
          (ev.tarefa ? '<button class="botao discreto" type="button" data-acao="abrir-tarefa" data-id="' + ev.tarefa + '">Abrir tarefa</button>' : '') + '</div>';
      }).join('');
  }

  /* ---------- painéis por cima: falar uma ideia, perfil, todas as telas (celular) ---------- */

  function painelFalar() {
    var o = E.ui.ouvindo;
    return '<div class="sobre-caixa" role="dialog" aria-modal="true" aria-label="Falar uma ideia"><div class="secao-cab"><span class="rotulo">Falar uma ideia</span>' +
      '<button class="botao discreto" type="button" data-acao="sobre-fechar" aria-label="Fechar">✕</button></div>' +
      '<p class="dem-desc">Ideia falada não se perde: aperte, fale, e ela vira texto, vai para a TV e para o acervo.</p>' +
      '<button class="gravar-grande' + (o ? ' ouvindo' : '') + '" type="button" data-acao="falar-gravar"><span class="gravar-bola"></span>' + (o ? 'Ouvindo… (simulado)' : '🎙 Apertar e falar') + '</button>' +
      '<form class="form" data-form="falar-ideia"><textarea id="texto-falado" rows="3" placeholder="O que foi dito aparece aqui. Dá para corrigir antes de guardar."></textarea>' +
      '<div class="dem-acoes"><button class="botao primario" type="submit">Guardar a ideia</button><button class="botao" type="button" data-acao="sobre-fechar">Cancelar</button></div></form>' +
      '<p class="form-ajuda">No protótipo o microfone não é usado: a fala é simulada. No app, a transcrição roda no próprio computador (whisper.cpp), sem mandar áudio para fora.</p></div>';
  }

  function painelPerfil() {
    var p = L().pessoa(L().eu), e = L().estado, vivo = e.transmissao[p.id] !== false;
    return '<div class="sobre-caixa" role="dialog" aria-modal="true" aria-label="Seu perfil"><div class="secao-cab"><span class="rotulo">Seu perfil</span>' +
      '<button class="botao discreto" type="button" data-acao="sobre-fechar" aria-label="Fechar">✕</button></div>' +
      '<div class="perfil-cab">' + U.avatar(p, 72, true) + '<div><b class="perfil-nome">' + esc(p.nome) + '</b><p class="pagina-sub">' + esc(e.areas[p.area]) + (p.papel === 'admin' ? ' · gestão' : '') + '</p>' +
      '<div class="dem-acoes"><button class="botao" type="button" data-acao="foto-escolher" data-id="' + p.id + '">' + (p.foto ? 'Trocar foto' : 'Pôr foto') + '</button>' +
      (p.foto ? '<button class="botao discreto" type="button" data-acao="foto-tirar" data-id="' + p.id + '">Tirar foto</button>' : '') + '</div></div></div>' +
      '<div class="secao"><span class="rotulo">Presença</span><div class="alternar">' + ['online', 'foco', 'ausente'].map(function (s) {
        return '<button type="button" class="' + (p.status === s ? 'ativo' : '') + '" data-acao="presenca-set" data-status="' + s + '">' + s + '</button>';
      }).join('') + '</div></div>' +
      '<label class="marcar passo"><input type="checkbox" data-acao="term-transmissao"' + (vivo ? ' checked' : '') + '> Meu terminal aparece ao vivo para a equipe</label>' +
      '<label class="marcar passo"><input type="checkbox" data-acao="perfil-cuidado"' + (p.naoMostrarCuidado ? '' : ' checked') + '> A TV pode mostrar quando eu precisar de uma mão</label>' +
      '<p class="form-ajuda">A foto aparece no chat, na TV, nas demandas e no mapa. Ela é reduzida no seu computador antes de ir para o sistema.</p></div>';
  }

  function painelMais() {
    return '<div class="sobre-caixa mais-caixa" role="dialog" aria-modal="true" aria-label="Todas as telas"><div class="secao-cab"><span class="rotulo">Todas as telas</span>' +
      '<button class="botao discreto" type="button" data-acao="sobre-fechar" aria-label="Fechar">✕</button></div><div class="mais-grade">' +
      ATIVIDADES.map(function (a) { return '<button type="button" data-acao="atividade" data-id="' + a[0] + '">' + svg(a[0], 22) + '<span>' + esc(NOMES[a[0]]) + '</span></button>'; }).join('') +
      '<button type="button" data-acao="sala-guardar">' + svg('inteligencia', 22) + '<span>Salvar ideia falada</span></button><button type="button" data-acao="ir-tv">' + svg('tv', 22) + '<span>Controle da TV</span></button>' +
      '<button type="button" data-acao="abrir-perfil" data-id="' + L().eu + '">' + svg('equipe', 22) + '<span>Perfil</span></button></div></div>';
  }

  function renderSobre() {
    var box = $('e-sobre'), u = E.ui, html = u.falar ? painelFalar() : u.perfil ? painelPerfil() : u.mais ? painelMais() : '';
    if (!html) { box.hidden = true; box.innerHTML = ''; return; }
    var r = guardar(box);
    box.hidden = false;
    box.innerHTML = html;
    restaurar(box, r);
  }

  function renderVerComo() {
    var s = $('ver-como'), e = L().estado;
    if (s.options.length !== e.pessoas.length) {
      s.innerHTML = e.pessoas.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nome) + (p.papel === 'admin' ? ' (gestão)' : '') + '</option>'; }).join('');
    }
    s.value = L().eu;
  }

  E.render = function () {
    renderVerComo();
    renderAtividades();
    renderLateral();
    renderAbas();
    renderConteudo();
    if (BC.endereco) BC.endereco.render(E.abaAtual()); /* cabeçalho do objeto: Sala › bancada › peça e quem está com ele */
    renderCronometro();
    renderStatus();
    renderColuna();
    renderSobre();
    renderToast();
    if (terminal) terminal.atualizar();
  };

  /* ---------- relógios que andam sem redesenhar a tela ---------- */

  function tique() {
    document.querySelectorAll('#vista-estacao [data-relogio]').forEach(function (el) {
      var d = L().demanda(el.getAttribute('data-relogio'));
      if (d) el.textContent = U.relogio(L().tempo(d).trabalho);
    });
    document.querySelectorAll('#vista-estacao [data-regressiva]').forEach(function (el) { el.textContent = U.regressiva(+el.getAttribute('data-regressiva')).texto; });
    document.querySelectorAll('#vista-estacao [data-desde]').forEach(function (el) { el.textContent = U.relogio(Date.now() - +el.getAttribute('data-desde')); });
  }

  /* ---------- paleta de comandos ---------- */

  var paleta = { lista: [], sel: 0, pedindo: null };

  /* temas que existem de verdade: da Estação (casca-2030.css §20, sobre os tokens) e da TV (temaTv, tv-2030.css) */
  var TEMAS_ESTACAO = [['noite', 'noite', 'padrão'], ['ametista', 'ametista', ''], ['claro', 'claro', 'Latte']];
  var TEMAS_TV = [['roxo', 'roxo', 'grafo v5'], ['azul', 'azul', 'Babel Terminal'], ['ametista', 'ametista', '']];
  var CHAVE_TEMA = 'babel-coop:tema-estacao';
  /* E.tema() → o tema em uso; E.tema('claro') troca e guarda neste computador (localStorage, por pessoa e máquina) */
  E.tema = function (id) {
    var raiz = document.documentElement;
    if (id === undefined) return raiz.getAttribute('data-tema-estacao') || 'noite';
    if (!TEMAS_ESTACAO.some(function (t) { return t[0] === id; })) return E.tema();
    if (id === 'noite') raiz.removeAttribute('data-tema-estacao'); else raiz.setAttribute('data-tema-estacao', id);
    U.guardarLocal(CHAVE_TEMA, id);
    return id;
  };

  function mudarPessoa(id) {
    L().verComo(id);
    E.ui.inline = null;
    E.ui.abertas[id] = true;
    E.aviso('Agora você vê a Estação como ' + L().nome(id) + '.');
  }

  function comandos(q) {
    var e = L().estado, eu = L().eu, c = [];
    /* "Onde estão" (pessoas e agentes com a posição) e o verbo "Ir até" (endereco.js): primeiro quando a busca é
       vazia, "onde…/ir até…" ou um nome; depois dos outros comandos quando se busca outra coisa (arquivo, comando) */
    var onde = BC.endereco ? BC.endereco.comandos(q) : [];
    if (onde.primeiro) c = c.concat(onde);
    if (q) c.push({ nome: 'Procurar "' + q + '" no acervo', atalho: 'acervo', fixo: true, fn: function () { E.ui.buscaAcervo = q; E.abrir('acervo'); } });
    ATIVIDADES.forEach(function (a) { c.push({ nome: 'Ir para: ' + a[1], fn: function () { E.abrir(a[0]); } }); });
    c.push({ nome: 'Nova demanda', fn: function () { A['nova-demanda'](); } });
    c.push({ nome: 'Deixar uma tarefa livre (pega quem puder)', fn: function () { E.ui.rascunho = { para: '' }; A['nova-demanda'](); } });
    e.demandas.filter(function (d) { return d.estado === 'livre'; }).forEach(function (d) {
      c.push({ nome: 'Pegar tarefa livre: ' + d.titulo, fn: function () { if (L().fazer('pegar', d.id)) E.aviso('É sua: o cronômetro começou.'); } });
    });
    e.demandas.filter(function (d) { return d.para === eu && d.estado === 'enviada'; }).forEach(function (d) {
      c.push({ nome: 'Começar demanda: ' + d.titulo, fn: function () { L().fazer('comecar', d.id); } });
    });
    c.push({ nome: 'Nova nota', fn: function () { A['novo-nota'](); } }, { nome: 'Novo mapa mental', fn: function () { A['novo-mapa'](); } }, { nome: 'Novo quadro', fn: function () { A['novo-quadro'](); } });
    e.arquivos.forEach(function (a) { c.push({ nome: 'Abrir: ' + a.caminho, fn: function () { BC.explorador.abrirArquivo(a.id); } }); });
    e.arquivos.filter(function (a) { return a.dono === eu; }).forEach(function (a) { c.push({ nome: 'Projetar na TV: ' + a.caminho.split('/').pop(), fn: function () { L().fazer('projetar', a.caminho); } }); });
    if (e.projecao) c.push({ nome: 'Encerrar a projeção na TV', fn: function () { L().fazer('encerrarProjecao'); } });
    c.push({ nome: 'Falar uma ideia', fn: function () { A['falar-ideia'](); } });
    c.push({ nome: 'Guardar os últimos 5 minutos da sala', fn: function () { A['sala-guardar'](); } });
    c.push({ nome: (e.sala.memoria ? 'Desligar' : 'Ligar') + ' a memória da sala', fn: function () { A['sala-memoria'](); } });
    c.push({ nome: 'Sonhar agora (refinar o dia)', fn: function () { A.sonhar(); } });
    c.push({ nome: 'Mandar recado para o mural da TV…', pede: 'Recado para o mural', fn: function (t) { L().fazer('recado', t); } });
    if (L().eAdmin()) {
      c.push({ nome: 'Mandar aviso oficial para a TV…', pede: 'Texto do aviso', fn: function (t) { L().fazer('aviso', t); } });
      c.push({ nome: (e.visita ? 'Desligar' : 'Ligar') + ' o modo visita na TV', fn: function () { L().fazer('visita', !e.visita); } });
      [['painel', 'painel geral'], ['reuniao', 'reunião'], ['quadro', 'quadro ao vivo']].forEach(function (m) { c.push({ nome: 'TV: ' + m[1], fn: function () { A['tv-modo']({ dataset: { modo: m[0] } }); } }); });
    }
    /* temas: o da Estação é de cada um (fica neste computador); o da TV é da equipe (gestão, como no Controle da TV) */
    var temaAgora = E.tema();
    TEMAS_ESTACAO.forEach(function (t) { c.push({ nome: 'Tema ' + t[1] + ' na Estação' + (t[2] ? ' (' + t[2] + ')' : ''), atalho: temaAgora === t[0] ? 'em uso' : '', fn: function () { E.tema(t[0]); E.aviso('Estação no tema ' + t[1] + '.'); } }); });
    if (L().eAdmin()) TEMAS_TV.forEach(function (t) { c.push({ nome: 'Tema ' + t[1] + ' na TV' + (t[2] ? ' (' + t[2] + ')' : ''), atalho: e.temaTv === t[0] ? 'em uso' : '', fn: function () { L().fazer('temaTv', t[0]); E.aviso('TV no tema ' + t[1] + '.'); } }); });
    c.push({ nome: 'Cronômetro na TV: Foco · 25 min', fn: function () { L().fazer('cronometroTv', 25, 'Foco'); } });
    c.push({ nome: 'Mostrar ou esconder a lateral', atalho: 'Ctrl B', fn: function () { E.alternarLateral(); } });
    c.push({ nome: 'Mostrar ou esconder o terminal', atalho: 'Ctrl `', fn: function () { E.alternarTerminal(); } });
    c.push({ nome: 'Fechar todas as abas', atalho: 'Ctrl Shift W', fn: function () { E.fecharTodas(); } });
    c.push({ nome: 'Tela da TV (janela própria, para espelhar)', fn: function () { A['ir-tv'](); } });
    c.push({ nome: 'Mostrar um site na TV…', pede: 'Endereço do site', fn: function (t) { L().fazer('tvSite', t); } });
    c.push({ nome: 'Salvar ideia falada (últimos 5 min da sala)', atalho: 'Ctrl Shift I', fn: function () { A['sala-guardar'](); } });
    c.push({ nome: 'Sobre mim: trabalhos, tempo, materiais e conquistas', fn: function () { E.abrirPerfil(eu); } });
    e.pessoas.forEach(function (p) { if (p.id !== eu) c.push({ nome: 'Entrar no terminal de ' + p.nome, atalho: 'Ctrl Shift E', fn: function () { A['term-entrar']({ dataset: { id: p.id } }); } }); });
    e.pessoas.forEach(function (p) { if (p.id !== eu) c.push({ nome: 'Sobre ' + p.nome, fn: function () { E.abrirPerfil(p.id); } }); });
    (e.projetos || []).forEach(function (pj) { c.push({ nome: 'Projeto: ' + pj.nome, fn: function () { E.abrirProjeto(pj.id); } }); });
    /* "Ver como" é ferramenta de teste do protótipo: no app real cada um é quem é */
    if (!window.COOP_REAL) e.pessoas.forEach(function (p) { if (p.id !== eu) c.push({ nome: 'Ver como: ' + p.nome, fn: function () { mudarPessoa(p.id); } }); });
    if (!onde.primeiro) c = c.concat(onde);
    return c;
  }

  function desenharPaleta() {
    var bruto = $('paleta-entrada').value.trim(), q = U.normalizar(bruto);
    if (paleta.pedindo) { $('paleta-lista').innerHTML = ''; return; }
    paleta.lista = comandos(bruto).filter(function (c) { return c.fixo || !q || U.normalizar(c.nome).indexOf(q) !== -1; }).slice(0, 14);
    paleta.sel = Math.min(paleta.sel, Math.max(0, paleta.lista.length - 1));
    var grupoAnt = null;
    $('paleta-lista').innerHTML = paleta.lista.map(function (c, i) {
      /* grupos com rótulo (ex.: "Onde estão"); c.html já vem escapado por quem monta */
      var cab = c.grupo && c.grupo !== grupoAnt ? '<li class="paleta-grupo" role="presentation">' + esc(c.grupo) + '</li>' : '';
      grupoAnt = c.grupo || null;
      return cab + '<li role="option" data-i="' + i + '" aria-selected="' + (i === paleta.sel) + '"><span>' + (c.html || esc(c.nome)) + '</span><span>' + esc(c.atalho || '') + '</span></li>';
    }).join('') || '<li><span>Nenhum comando com esse nome</span></li>';
    var sel = $('paleta-lista').querySelector('li[aria-selected="true"]');
    if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest' });
  }

  E.abrirPaleta = function () {
    paleta.pedindo = null;
    paleta.sel = 0;
    $('paleta').hidden = false;
    $('paleta-entrada').value = '';
    $('paleta-entrada').placeholder = 'Digite um comando, um arquivo ou o que quer achar no acervo…';
    $('paleta-dica').textContent = 'Enter executa · ↑↓ escolhe · Esc fecha';
    desenharPaleta();
    $('paleta-entrada').focus();
  };
  function fecharPaleta() { $('paleta').hidden = true; paleta.pedindo = null; }
  function executar(i) {
    var c = paleta.lista[i];
    if (!c) return;
    if (c.pede) {
      paleta.pedindo = c;
      $('paleta-entrada').value = '';
      $('paleta-entrada').placeholder = c.pede;
      $('paleta-dica').textContent = c.nome.replace('…', '') + ' · Enter envia · Esc cancela';
      desenharPaleta();
      return;
    }
    /* de onde a luz sai quando o comando leva a pessoa a outro lugar ("Ir até") */
    var li = $('paleta-lista').querySelector('li[data-i="' + i + '"]'), r = li ? li.getBoundingClientRect() : null;
    E.ui.paletaOrigem = r && r.width ? { x: r.left + 28, y: r.top + r.height / 2 } : null;
    fecharPaleta();
    c.fn();
  }

  /* ---------- ações da casca ---------- */

  A.atividade = function (el) {
    var id = el.dataset.id, atual = atividadeAtual(), celular = window.innerWidth <= 760, vazio = E.abaAtual().tipo === 'vazio';
    E.ui.mais = false;
    /* com o meio vazio, o ícone da barra só troca a lateral; o meio abre quando se clica num item da lateral */
    if (vazio && el.closest && el.closest('.e-atividades')) { E.ui.ultimaAtividade = id; if (!E.ui.lat) E.alternarLateral(true); E.render(); return; }
    /* clicar de novo no grupo aberto (ex.: Trabalho estando em Tarefas) recolhe a lateral, como o ícone da própria vista */
    var naBarra = el.closest && el.closest('.e-atividades'), mesmo = id === atual || (naBarra && GRUPO_DE[id] && GRUPO_DE[id] === GRUPO_DE[ALIAS_ATIVIDADE[atual] || atual]);
    if (!celular && mesmo && E.ui.lat && !vazio) { E.alternarLateral(false); return; }
    if (!celular && !E.ui.lat) E.alternarLateral(true);
    E.abrir(id);
  };
  /* alternador do grupo no topo da lateral: Demandas | Tarefas · Acervo | Inteligência · Equipe | Metas | Mapa */
  A['grupo-vista'] = function (el) {
    var id = el.dataset.id;
    if (E.abaAtual().tipo === 'vazio') { E.ui.ultimaAtividade = id; E.render(); return; }
    E.abrir(id);
  };
  A.aba = function (el) { E.ui.ativa = el.dataset.id; E.ui.inline = null; E.render(); };
  A['fechar-aba'] = function (el, ev) { if (ev) ev.stopPropagation(); E.fecharAba(el.dataset.id); };
  A['lat-alternar'] = function () { E.alternarLateral(); };
  A['terminal-alternar'] = function () { E.alternarTerminal(); };
  A.coluna = function () {
    E.ui.coluna = !E.ui.coluna;
    if (E.ui.coluna) {
      E.ui.novos = 0;
      setTimeout(function () { Object.keys(E.ui.vistos).forEach(function (k) { E.ui.vistos[k] = 'visto'; }); }, 4000);
    }
    renderColuna();
  };
  A.terminal = function () { E.alternarTerminal(true); };
  A.presenca = function () {
    var ordem = ['online', 'foco', 'ausente'], p = L().pessoa(L().eu);
    L().fazer('presenca', ordem[(ordem.indexOf(p.status) + 1) % ordem.length]);
  };
  A['presenca-set'] = function (el) { L().fazer('presenca', el.dataset.status); };
  A['perfil-cuidado'] = function (el) { L().fazer('perfil', { naoMostrarCuidado: !el.checked }); };
  /* a TV abre numa janela própria, sem botão: é só espelhar na TV */
  A['ir-tv'] = function () {
    var w = null;
    try { w = window.open(location.pathname + location.search + '#tv', 'babel-tv', 'width=1280,height=720'); } catch (e) { w = null; }
    if (w) { E.aviso('A tela da TV abriu numa janela própria. Arraste para a TV e aperte F para tela cheia.'); try { w.focus(); } catch (e) { /* sem foco */ } }
    else { E.aviso('O navegador bloqueou a janela. Permita janelas para abrir a TV numa janela própria; mostrando aqui.'); BC.app.trocarVista('tv'); }
  };
  A['abrir-perfil'] = function (el, ev) { if (ev) ev.stopPropagation(); E.abrirPerfil(el.dataset.id || L().eu); };
  A['criar-tela'] = function () { E.ui.novoArquivo = true; E.abrir('explorador'); var i = $('novo-arq-nome'); if (i) { i.value = 'nova-tela.html'; i.focus(); i.select(); } E.aviso('Dê o nome da tela (termina em .html): abre já como site.'); };
  A['criar-pesquisa'] = function () { E.alternarTerminal(true); if (terminal) { terminal.entrada.value = 'Pesquisa sobre clínicas odontológicas em Campinas e gera um relatório em MD'; terminal.mencionar(); terminal.focar(); } E.aviso('Peça ao agente: ele pesquisa e deixa o relatório em MD, que abre em leitura.'); };
  A['abrir-projeto'] = function (el) { E.abrirProjeto(el.dataset.id); };
  A['fechar-todas'] = function () { E.fecharTodas(); };
  A['rolar-proj'] = function (el) { L().fazer('rolarProjecao', +el.dataset.delta); };
  A['controle-aceitar'] = function (el) { if (L().fazer('aceitarEntrar', el.dataset.id)) E.aviso('Pode entrar. O que a pessoa digitar aparece no seu terminal.'); };
  A['controle-recusar'] = function (el) { L().fazer('recusarEntrar', el.dataset.id); };
  A['controle-encerrar'] = function (el) { if (L().fazer('sairTerminal', el.dataset.id)) E.aviso('Controle encerrado.'); };
  A['term-entrar'] = function (el) {
    var dono = el.dataset.id, ag = el.dataset.agente || null;
    if (!dono || dono === L().eu) return;
    var r = L().fazer('pedirEntrar', dono, ag);
    if (!r) { E.aviso('Você já está (ou já pediu para entrar) nesse terminal.'); }
    else {
      var c = (L().estado.controles || []).filter(function (x) { return x.quem === L().eu && x.dono === dono && x.estado !== 'encerrado'; }).pop();
      E.aviso(c && c.estado === 'ativo' ? 'Você entrou no terminal de ' + L().nome(dono) + '. O que digitar aparece na tela dele(a).' : 'Pedido enviado: ' + L().nome(dono) + ' precisa aceitar.');
    }
    E.ui.termPessoa = dono;
    E.abrir('terminais');
  };
  A['term-chamar'] = function (el) { if (L().fazer('chamarParaTela', el.dataset.id, el.dataset.oque || '')) E.aviso('Convite enviado para ' + L().nome(el.dataset.id) + '.'); };
  A['falar-com'] = function (el) { E.aviso('Voz entre Estações: no app de verdade abre a chamada com ' + L().nome(el.dataset.id) + ' (WebRTC na rede local). No protótipo é só este aviso.'); };
  A.perfil = function () { E.abrirPerfil(L().eu); };
  A['editar-perfil'] = function () { E.ui.perfil = true; E.ui.falar = false; E.ui.mais = false; renderSobre(); };
  A.mais = function () { E.ui.mais = !E.ui.mais; E.ui.perfil = false; E.ui.falar = false; renderSobre(); renderAtividades(); };
  A['sobre-fechar'] = function () { E.ui.falar = E.ui.perfil = E.ui.mais = E.ui.ouvindo = false; renderSobre(); renderAtividades(); };
  A['falar-gravar'] = function () {
    if (E.ui.ouvindo) return;
    E.ui.ouvindo = true;
    renderSobre();
    setTimeout(function () {
      E.ui.ouvindo = false;
      if (!E.ui.falar) return;
      renderSobre();
      var c = $('texto-falado');
      if (c) { c.value = U.sorteia(FALAS_EXEMPLO); c.focus(); }
    }, 1600);
  };
  F['falar-ideia'] = function () {
    var c = $('texto-falado'), t = c ? c.value.trim() : '';
    if (!t) { if (c) c.focus(); return; }
    if (L().fazer('ideiaFalada', t)) { E.ui.falar = false; E.aviso('Ideia falada guardada: foi para a TV e para o acervo.'); E.render(); }
  };

  /* ---------- início ---------- */

  E.iniciar = function () {
    var raiz = $('vista-estacao'), eu = L().eu;
    raiz.hidden = false;
    E.tema(U.lerLocal(CHAVE_TEMA) || 'noite'); /* o tema escolhido na paleta volta com a Estação */
    E.ui.abertas.equipe = true;
    E.ui.abertas[eu] = true;
    var readme = L().arquivo(eu + '/README.md') || L().arquivo('theus/README.md');
    E.ui.abas = [{ id: 'dia', tipo: 'dia' }];
    if (readme) {
      E.ui.abas.push({ id: 'arq:' + readme.id, tipo: 'arquivo', ref: readme.id, titulo: 'README.md', atividade: 'explorador' });
      E.ui.ativa = 'arq:' + readme.id;
      readme.caminho.split('/').slice(0, -1).forEach(function (p, i, arr) { E.ui.abertas[arr.slice(0, i + 1).join('/')] = true; });
    } else E.ui.ativa = 'dia';
    aplicarLayout();
    montarBordas();
    montarCronometroMovel();
    terminal = new BC.Terminal($('e-painel'));
    E.terminal = terminal;

    var fazerOriginal = L().fazer;
    L().fazer = function () {
      E.ui.gravando = true;
      clearTimeout(gravandoTimer);
      gravandoTimer = setTimeout(function () { E.ui.gravando = false; var g = $('st-gravado'); if (g) g.textContent = 'Salvo na equipe'; }, 450);
      return fazerOriginal.apply(L(), arguments);
    };

    raiz.addEventListener('click', function (ev) {
      if (ev.target.id === 'e-sobre') { A['sobre-fechar'](); return; }
      var el = ev.target.closest('[data-acao]');
      if (!el || !raiz.contains(el)) return;
      var fn = A[el.dataset.acao];
      if (!fn) return;
      if (el.tagName === 'A') ev.preventDefault();
      fn(el, ev);
    });
    $('e-abas').addEventListener('auxclick', function (ev) {
      var aba = ev.target.closest('.e-aba');
      if (ev.button === 1 && aba) { ev.preventDefault(); E.fecharAba(aba.dataset.id); }
    });
    raiz.addEventListener('change', function (ev) {
      var t = ev.target;
      if (t.id === 'arq-upload' && t.files && t.files.length) { BC.explorador.receber(t.files); t.value = ''; return; }
      if (t.dataset && t.dataset.acaoMudar && A[t.dataset.acaoMudar]) A[t.dataset.acaoMudar](t, ev);
    });
    raiz.addEventListener('input', function (ev) {
      var t = ev.target;
      if (t.id === 'filtro-arq') { E.ui.filtroArq = t.value; renderLateral(); }
      if (t.id === 'busca-chat') { E.ui.buscaChat = t.value; renderLateral(); }
    });
    raiz.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && ev.target.getAttribute('role') === 'tab') ev.target.click();
      if (ev.key === 'Enter' && ev.target.getAttribute('role') === 'treeitem') ev.target.click();
      if (ev.key === 'Enter' && ev.target.id === 'chat-texto' && !ev.shiftKey) { ev.preventDefault(); BC.formularios.chat(); }
      if (ev.key === 'Enter' && ev.target.id && ev.target.id.indexOf('inline-') === 0 && ev.target.tagName === 'INPUT') {
        var b = ev.target.parentNode.querySelector('[data-acao="dem-enviar-inline"]');
        if (b) b.click();
      }
    });
    raiz.addEventListener('submit', function (ev) {
      var f = ev.target.closest('[data-form]');
      if (!f) return;
      ev.preventDefault();
      var fn = BC.formularios[f.dataset.form];
      if (fn) fn(f);
    });
    raiz.addEventListener('focusout', function () { if (conteudoPendente) setTimeout(renderConteudo, 0); });

    /* arrastar arquivos do computador para dentro da Estação */
    raiz.addEventListener('dragover', function (ev) {
      if (!ev.dataTransfer || Array.prototype.indexOf.call(ev.dataTransfer.types || [], 'Files') === -1) return;
      ev.preventDefault();
      raiz.classList.add('soltando');
    });
    raiz.addEventListener('dragleave', function (ev) { if (ev.target === raiz || !raiz.contains(ev.relatedTarget)) raiz.classList.remove('soltando'); });
    raiz.addEventListener('drop', function (ev) {
      raiz.classList.remove('soltando');
      if (!ev.dataTransfer || !ev.dataTransfer.files.length) return;
      ev.preventDefault();
      BC.explorador.receber(ev.dataTransfer.files);
    });

    $('abrir-paleta').addEventListener('click', E.abrirPaleta);
    $('abrir-coluna').addEventListener('click', A.coluna);
    $('ir-tv').addEventListener('click', A['ir-tv']);
    $('ver-como').addEventListener('change', function (ev) { mudarPessoa(ev.target.value); });

    $('paleta-entrada').addEventListener('input', function () { paleta.sel = 0; desenharPaleta(); });
    $('paleta-entrada').addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowDown') { paleta.sel = Math.min(paleta.sel + 1, paleta.lista.length - 1); desenharPaleta(); ev.preventDefault(); }
      if (ev.key === 'ArrowUp') { paleta.sel = Math.max(paleta.sel - 1, 0); desenharPaleta(); ev.preventDefault(); }
      if (ev.key === 'Enter') {
        ev.preventDefault();
        if (paleta.pedindo) {
          var t = $('paleta-entrada').value.trim(), c = paleta.pedindo;
          if (!t) return;
          fecharPaleta();
          c.fn(t);
          E.aviso('Feito: ' + c.nome.replace('…', '').toLowerCase() + '.');
        } else executar(paleta.sel);
      }
    });
    $('paleta-lista').addEventListener('click', function (ev) { var li = ev.target.closest('li[data-i]'); if (li) executar(+li.dataset.i); });
    $('paleta').addEventListener('click', function (ev) { if (ev.target.id === 'paleta') fecharPaleta(); });

    document.addEventListener('keydown', function (ev) {
      if ($('vista-estacao').hidden) return;
      var digitando = /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName) || ev.target.isContentEditable;
      var mod = ev.ctrlKey || ev.metaKey;
      if (mod && (ev.key === 'k' || ev.key === 'K' || ((ev.key === 'p' || ev.key === 'P') && ev.shiftKey))) { ev.preventDefault(); E.abrirPaleta(); return; }
      if (ev.ctrlKey && (ev.key === '`' || ev.code === 'Backquote')) { ev.preventDefault(); E.alternarTerminal(); return; }
      if (mod && (ev.key === 'b' || ev.key === 'B') && !ev.shiftKey) { ev.preventDefault(); E.alternarLateral(); return; }
      if (mod && ev.shiftKey && (ev.key === 'w' || ev.key === 'W')) { ev.preventDefault(); E.fecharTodas(); return; }
      if (mod && ev.shiftKey && (ev.key === 'i' || ev.key === 'I')) { ev.preventDefault(); A['sala-guardar'](); return; }
      if (mod && ev.shiftKey && (ev.key === 'e' || ev.key === 'E')) { ev.preventDefault(); E.abrirPaleta(); $('paleta-entrada').value = 'Entrar no terminal de'; $('paleta-entrada').dispatchEvent(new Event('input')); return; }
      if (mod && ev.shiftKey && (ev.key === 't' || ev.key === 'T')) { ev.preventDefault(); if (terminal) terminal.novoAgenteForm(); return; }
      if (!digitando && L().estado.projecao && L().estado.projecao.por === L().eu && (ev.key === 'PageDown' || ev.key === 'PageUp')) { ev.preventDefault(); L().fazer('rolarProjecao', ev.key === 'PageDown' ? 0.25 : -0.25); return; }
      if (mod && (ev.key === 's' || ev.key === 'S')) {
        var tab = E.abaAtual();
        if (tab.tipo === 'arquivo' && tab.modo === 'editar') { ev.preventDefault(); BC.editor.salvar(); }
        else if (tab.tipo === 'arquivo') ev.preventDefault();
        return;
      }
      if (ev.key === '/' && !digitando && $('paleta').hidden) { ev.preventDefault(); E.abrirPaleta(); return; }
      if (ev.key === 'Escape') {
        if (!$('paleta').hidden) fecharPaleta();
        else if (BC.endereco && BC.endereco.popAberto()) BC.endereco.fecharPop();
        else if (E.ui.falar || E.ui.perfil || E.ui.mais) A['sobre-fechar']();
        else if (E.ui.inline) { E.ui.inline = null; E.render(); }
        else if (E.ui.coluna) A.coluna();
      }
    });

    L().aoMudar(function (estado, novos) {
      var eu2 = L().eu;
      novos.forEach(function (ev) {
        if (ev.pessoa === eu2) return;
        E.ui.vistos[ev.id] = 'novo';
        if (ev.para === eu2 || (ev.tv && !ev.discreto)) {
          if (!E.ui.coluna) E.ui.novos++;
          if (ev.para === eu2) E.aviso(ev.texto + (ev.tipo === 'controle-pedido' ? ' · aceite na barra de baixo' : ev.tipo === 'chamado' ? ' · abra em Novidades' : ''));
        }
        if (ev.tipo === 'passagem' && mapa) mapa.pulso(ev.de, ev.para);
      });
      /* acerto de alguém (começou, entregou, concluiu, pegou, entrou num terminal): a luz pisca nas laterais da foto dela.
         Antes do render: a foto redesenhada continua o mesmo piscar (U.avatar lê o evento) */
      novos.forEach(function (ev) { if (ev.pessoa && AV_EVENTOS[ev.tipo]) U.avatarEvento(ev.pessoa); });
      if (!$('vista-estacao').hidden) E.render();
    });
    /* endereço: depois do ouvinte acima, para a luz de chegada achar o cabeçalho já desenhado */
    if (BC.endereco) BC.endereco.iniciar();

    setInterval(tique, 1000);
    setInterval(renderStatus, 5000);
    E.render();
  };

  BC.estacao = E;
})(window.BC);
