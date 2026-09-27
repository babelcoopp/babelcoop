/* Babel Coop — protótipo · babel Cursor (26/09/2026, pedido do Dominic; especificação em docs/babel-cursor.md)
   Ligado (botão no topo ou Ctrl/⌘ + .), o ponteiro passa a ler o que está embaixo dele:
   · identifica o elemento (tarefa, arquivo, pasta, documento, código, caixa de texto, mensagem, seção, texto) e acende o contorno;
   · parado ali, abre a lente com as ações dele: criar ou delegar tarefa (a Nova demanda abre preenchida, com uma pessoa
     sugerida) e resumir, pesquisar, explicar, organizar pasta (o pedido vai para o campo ❯ do agente "babel Cursor");
   · check-in automático: concluir uma tarefa ou marcar um item acrescenta a conquista ao check-in do dia;
   · voz: segurar o botão esquerdo sobre o elemento (ou "Falar" na lente) liga o microfone; ao soltar, ele entende a fala:
     "explica…" explica (tarefa: fala os dados em voz alta), "cria/manda/pede…" escreve uma tarefa, numa caixa de texto
     escreve o que foi dito, e o resto vira pedido falado ao agente babel Cursor (mandado na hora: a voz já é o clique);
   · roxo: enquanto ouve, fala ou o agente babel Cursor pensa/trabalha, tudo que é dele passa do ciano para o roxo.
   Pelos cliques nada é criado nem enviado sozinho: a pessoa confere e manda. Visual em babel-cursor.css. Retirada: tirar as 2 linhas de index.html. */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var NOME = 'babel Cursor', CHAVE = 'babel-coop:babel-cursor', ESPERA = 380, TROCA = 140, SAIDA = 260, SEGURAR = 450;
  var ligado = false, lente = null, alvo = null, candidato = null, tMostrar = 0, tEsconder = 0, botao = null, ponteiro = { x: 0, y: 0 };

  /* as instruções do agente: a especificação inteira não cabe no limite de 4.000 caracteres do servidor; esta é a condensada */
  var INSTRUCOES = [
    'Você é o babel Cursor (escreva sempre assim: b minúsculo, C maiúsculo), o cérebro técnico do babel-coop: arquiteto de soluções em IA e especialista em engenharia de prompt e integrações.',
    'Tom técnico, didático e prático, como um engenheiro experiente que ensina um colega. Explique qualquer jargão na primeira vez que usar.',
    'Você é o tradutor universal de fluxos de trabalho da equipe: mapeia dados e contexto da empresa, explica IA de forma simples e planeja a conexão do sistema com o mundo externo.',
    'Como você é chamado: com o babel Cursor ligado, a pessoa para o mouse sobre algo (tarefa, arquivo, pasta, documento, código, caixa de texto, mensagem, texto) e a tela escreve no seu campo um pedido que começa com [babel Cursor · tipo: nome] e traz o trecho do elemento. A pessoa confere e manda. Entenda o elemento pelo tipo e pelo trecho e ajude na hora: resumo, pesquisa, explicação, organização de pasta.',
    'Respostas importantes seguem 3 passos: 1) O quê: o que a tecnologia ou o elemento faz, direto. 2) Como funciona: o fluxo dos dados, de como a entrada vira requisição a como a saída resolve o problema. 3) Ação prática: passo a passo exato, código, JSON ou configuração no-code.',
    'Abra respostas importantes com uma linha chamativa, como ✦ babel Cursor ✦, lembrando o neon do nome da pessoa na tela inicial.',
    'Tarefas: se o elemento for um problema ou uma ideia, proponha virar tarefa, com título, escopo e quem deve fazer (quem conhece o assunto ou quem tem menos tarefas abertas). Quem cria e delega é a pessoa, pelo botão da tela; você nunca cria nem delega sozinho.',
    'Pesquisa: consulte primeiro o acervo da equipe (coop_buscar) e cite de onde veio cada coisa. Hipótese é hipótese: diga que é.',
    'APIs, em três níveis: A) No-code: autenticação OAuth e mapeamento de campos em Make, Zapier ou na busca nativa da plataforma. B) Low-code: webhooks e REST (GET, POST, PUT, DELETE), com payloads JSON bem estruturados e o cabeçalho Authorization: Bearer <TOKEN>; nunca mostre um token de verdade. C) High-code e agentes: MCP (Model Context Protocol) ou tools/function calling, quando uma IA precisa usar a API em tempo real.',
    'Código: Python ou Node.js, limpo e comentado. Ao fim de cada explicação de API, pergunte se a pessoa prefere ver a implementação em No-Code (ferramentas visuais) ou em Code (programação pura).',
    'Nunca invente execução, fonte ou resultado. Senhas e chaves só a pessoa digita.'
  ].join(' ');

  var ROTULO = { tarefa: 'Tarefa', arquivo: 'Arquivo', pasta: 'Pasta', documento: 'Documento', codigo: 'Código', campo: 'Caixa de texto', mensagem: 'Mensagem', secao: 'Seção', texto: 'Texto' };
  var ACOES = {
    tarefa: ['resumir', 'delegar', 'pesquisar'],
    arquivo: ['resumir', 'criar', 'pesquisar'],
    pasta: ['organizar', 'resumir'],
    documento: ['resumir', 'criar', 'pesquisar'],
    codigo: ['explicar', 'criar'],
    campo: ['criar', 'pesquisar'],
    mensagem: ['criar', 'resumir'],
    secao: ['resumir', 'criar'],
    texto: ['criar', 'pesquisar', 'explicar']
  };
  var NOME_ACAO = { resumir: 'Resumir', pesquisar: 'Pesquisar', explicar: 'Explicar', organizar: 'Organizar a pasta', criar: 'Criar tarefa', delegar: 'Delegar uma parte', falar: '🎙 Falar' };

  function L() { return BC.loja; }
  function U() { return BC.util; }
  function E() { return BC.estacao; }
  function esc(s) { return U().esc(s == null ? '' : String(s)); }
  function aviso(t) { if (E() && E().aviso) E().aviso(t); }
  function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function guardar(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento: vale só nesta aba */ } }
  function limpar(s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); return n && s.length > n ? s.slice(0, n - 1) + '…' : s; }
  /* textContent, não innerText: os títulos agora são maiúsculos só no CSS, e o texto de verdade continua em caixa normal */
  function textoDe(el) { return limpar(el.textContent || ''); }

  /* ---------- 1. Identificação por proximidade ---------- */

  var REGRAS = [
    { sel: '.item', tipo: 'tarefa', ok: function (n) { return !!abreTarefa(n); } },
    { sel: '.arv-linha.arv-arq', tipo: 'arquivo' },
    { sel: '.arv-linha.arv-pasta', tipo: 'pasta' },
    { sel: '.zap-msgs > *', tipo: 'mensagem', ok: function (n) { return textoDe(n).length > 2; } },
    { sel: 'pre, .codigo', tipo: 'codigo' },
    { sel: 'input[type="text"], input[type="search"], input:not([type]), textarea', tipo: 'campo', ok: function (n) { return String(n.value || '').trim().length >= 3; } },
    { sel: 'p, li, h1, h2, h3, h4, blockquote, td, .dem-desc', tipo: 'texto', ok: function (n) { return textoDe(n).length >= 16 && !n.closest('.lat-lista, .e-atividades, .pagina-cab'); } },
    { sel: '.secao, .cartao', tipo: 'secao', ok: function (n) { return !!n.querySelector('.rotulo'); } },
    { sel: '.md-corpo', tipo: 'documento' }
  ];

  function abreTarefa(n) {
    return n.matches('[data-acao="abrir-demanda"], [data-acao="abrir-tarefa"]') ? n : n.querySelector('[data-acao="abrir-demanda"], [data-acao="abrir-tarefa"]');
  }

  function identificar(el) {
    if (!el || !el.closest || el.closest('.bcur-lente, .balao-tarefa')) return null;
    var zona = el.closest('#e-conteudo, #e-lateral');
    if (!zona) return null;
    for (var n = el; n; n = n.parentElement) {
      for (var i = 0; i < REGRAS.length; i++) {
        var r = REGRAS[i];
        if (n.matches(r.sel) && (!r.ok || r.ok(n))) return descrever(n, r.tipo);
      }
      if (n === zona) break;
    }
    return null;
  }

  /* o que se sabe do elemento: nome, trecho e quem é o dono do assunto (para sugerir a pessoa) */
  function descrever(n, tipo) {
    var a = { el: n, tipo: tipo, rotulo: ROTULO[tipo], nome: '', trecho: '', dono: null, botaoDemanda: null };
    if (tipo === 'tarefa') {
      var abre = abreTarefa(n), id = abre.dataset.id;
      var d = abre.dataset.acao === 'abrir-tarefa' ? L().tarefa(id) : L().demanda(id);
      a.nome = d ? d.titulo : textoDe(n.querySelector('.item-titulo') || n);
      a.trecho = d && d.descricao ? d.descricao : textoDe(n);
      a.dono = d ? (d.para || (d.donos && d.donos[d.atual])) : null;
    } else if (tipo === 'arquivo') {
      var arq = L().arquivo(n.dataset.id);
      a.nome = arq ? arq.caminho : textoDe(n);
      a.dono = arq ? arq.autor : null;
    } else if (tipo === 'pasta') {
      a.nome = n.dataset.caminho || textoDe(n);
    } else if (tipo === 'mensagem') {
      a.trecho = textoDe(n).slice(0, 500);
      a.nome = limpar(a.trecho, 60);
      a.botaoDemanda = n.querySelector('[data-acao="msg-demanda"]');
    } else if (tipo === 'codigo') {
      a.trecho = (n.innerText || '').slice(0, 1500);
      a.nome = limpar(a.trecho.split('\n')[0], 60) || 'bloco de código';
    } else if (tipo === 'campo') {
      a.trecho = limpar(n.value, 600);
      a.nome = n.getAttribute('aria-label') || n.placeholder || 'campo';
    } else if (tipo === 'secao') {
      var rot = n.querySelector('.rotulo');
      a.nome = textoDe(rot);
      a.trecho = limpar(textoDe(n).replace(a.nome, ''), 700);
    } else if (tipo === 'documento') {
      var aba = E().abaAtual && E().abaAtual(), doc = aba && aba.tipo === 'arquivo' && L().arquivo(aba.ref);
      a.nome = doc ? doc.caminho : 'documento aberto';
      a.trecho = textoDe(n).slice(0, 700);
      a.dono = doc ? doc.autor : null;
    } else {
      a.trecho = textoDe(n).slice(0, 700);
      a.nome = limpar(a.trecho, 60);
    }
    return a;
  }

  /* ---------- 2. A lente ---------- */

  function criarLente() {
    if (lente) return lente;
    lente = document.createElement('div');
    lente.className = 'bcur-lente';
    lente.setAttribute('role', 'dialog');
    lente.setAttribute('aria-label', NOME);
    lente.dataset.aberta = 'nao';
    lente.addEventListener('pointerenter', function () { clearTimeout(tEsconder); });
    lente.addEventListener('pointerleave', agendarEsconder);
    lente.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-bcur]');
      if (!b || !alvo) return;
      var a = alvo;
      esconder();
      executar(b.dataset.bcur, a);
    });
    document.body.appendChild(lente);
    return lente;
  }

  function marcar(el) {
    if (candidato === el) return;
    if (candidato) candidato.classList.remove('bcur-foco');
    candidato = el;
    if (el) el.classList.add('bcur-foco');
  }

  function mostrar(a) {
    criarLente();
    alvo = a;
    marcar(a.el);
    var acoes = ACOES[a.tipo].concat('falar');
    lente.innerHTML = '<p class="bcur-cab"><span class="bcur-marca">✦ ' + NOME + '</span><span class="bcur-tipo">' + esc(a.rotulo) + '</span></p>' +
      '<p class="bcur-nome" title="' + esc(a.nome) + '">' + esc(limpar(a.nome, 70) || a.rotulo) + '</p>' +
      '<div class="bcur-acoes">' + acoes.map(function (x, i) {
        return '<button type="button" class="bcur-acao' + (i === 0 ? ' primeira' : '') + '" data-bcur="' + x + '">' + NOME_ACAO[x] + '</button>';
      }).join('') + '</div>';
    posicionar();
    lente.dataset.aberta = 'sim';
  }

  /* elemento pequeno: a lente fica no canto de cima, à direita, sem cobrir o que ele diz; elemento grande: perto do ponteiro */
  function posicionar() {
    if (!alvo || !lente) return;
    var r = alvo.el.getBoundingClientRect(), w = lente.offsetWidth, h = lente.offsetHeight, m = 12, topoMin = 56;
    var esq, topo;
    if (r.height > 220 || r.width > 900) {
      esq = ponteiro.x + 18;
      topo = ponteiro.y + 18;
    } else {
      esq = r.right - w;
      topo = r.top - h - 8;
      if (topo < topoMin) topo = r.bottom + 8;
    }
    esq = Math.max(m, Math.min(window.innerWidth - w - m, esq));
    topo = Math.max(topoMin, Math.min(window.innerHeight - h - m, topo));
    lente.style.left = Math.round(esq) + 'px';
    lente.style.top = Math.round(topo) + 'px';
  }

  function esconder() {
    clearTimeout(tMostrar);
    clearTimeout(tEsconder);
    alvo = null;
    marcar(null);
    if (lente) lente.dataset.aberta = 'nao';
  }
  function agendarEsconder() {
    clearTimeout(tEsconder);
    tEsconder = setTimeout(esconder, SAIDA);
  }

  /* ---------- 3. As ações ---------- */

  function executar(acao, a) {
    if (acao === 'criar' || acao === 'delegar') return criarTarefa(a, acao);
    if (acao === 'falar') return ouvir(a, 'clique');
    pedirAoAgente(pedido(acao, a));
  }

  function pedido(acao, a) {
    var cab = '[' + NOME + ' · ' + a.rotulo + ': ' + limpar(a.nome, 90) + '] ';
    var trecho = a.trecho ? ' Trecho: "' + limpar(a.trecho, 900) + '"' : '';
    if (acao === 'resumir') {
      if (a.tipo === 'pasta') return cab + 'Resuma o que tem nesta pasta e para que serve cada parte.';
      if (a.tipo === 'arquivo' || a.tipo === 'documento') return cab + 'Resuma este arquivo em até 5 linhas e diga o que fazer em seguida.' + trecho;
      return cab + 'Resuma em até 5 linhas e diga o que precisa acontecer em seguida.' + trecho;
    }
    if (acao === 'pesquisar') return cab + 'Pesquise sobre isto: primeiro no acervo da equipe (coop_buscar), depois fora, e cite as fontes.' + trecho;
    if (acao === 'explicar') return cab + (a.tipo === 'codigo' ? 'Explique este código nos 3 passos: o quê, como funciona e como usar.' : 'Explique isto de forma didática, nos 3 passos: o quê, como funciona e ação prática.') + trecho;
    if (acao === 'organizar') return cab + 'Proponha uma organização para esta pasta: nomes claros, subpastas e o que arquivar. Não mova nada antes de eu aprovar.';
    return cab + trecho;
  }

  /* app real: a aba do agente "babel Cursor" (criada na primeira vez); protótipo: o terminal simulado */
  function pedirAoAgente(texto, enviar) {
    var R = BC.terminalReal;
    if (E().alternarTerminal) E().alternarTerminal(true);
    if (R && R.pronto && R.pronto()) {
      var eu = L().pessoa(L().eu), ag = ((eu && eu.agentes) || []).filter(function (x) { return x.nome === NOME; })[0];
      var id = ag ? ag.id : R.novoAgente(NOME, { oQueFaz: INSTRUCOES });
      if (!id) return aviso('Não consegui abrir o agente ' + NOME + '. Abra o painel do terminal e tente de novo.');
      R.abrirAba(id);
      R.face('presenca', id);
      return preencher(function () { return document.querySelector('[aria-label="Agente ' + NOME + '"] .tr-entrada'); }, texto, 0, enviar);
    }
    preencher(function () { return document.getElementById('term-entrada'); }, texto, 0, enviar);
  }

  function preencher(achar, texto, tentativa, enviar) {
    var campo = achar();
    if (!campo || !campo.offsetParent) {
      if (tentativa < 40) return setTimeout(function () { preencher(achar, texto, tentativa + 1, enviar); }, 75);
      return aviso('Não achei o campo do ' + NOME + '. Abra o painel do terminal e tente de novo.');
    }
    campo.value = texto;
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    campo.focus();
    if (campo.setSelectionRange) campo.setSelectionRange(texto.length, texto.length);
    if (!enviar) return aviso('O pedido está no campo do ' + NOME + '. Confira e aperte Enter para mandar.');
    /* pela voz, manda na hora: terminal real pelo formulário do campo ❯, terminal simulado pelo Enter */
    if (campo.form && campo.form.requestSubmit) campo.form.requestSubmit();
    else campo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    estadoLocal('enviando', 2500);
    aviso('Mandei para o ' + NOME + '. A resposta aparece no painel dele.');
  }

  /* delegação automática: o dono do assunto, se houver e não for eu; senão, quem tem menos tarefas abertas agora */
  function sugerir(a) {
    var e = L().estado, eu = L().eu;
    function abertas(id) {
      return e.demandas.filter(function (d) { return d.para === id && ['enviada', 'andamento', 'pausada', 'pronta'].indexOf(d.estado) !== -1; }).length;
    }
    var dono = a.dono && a.dono !== eu ? L().pessoa(a.dono) : null;
    if (dono && dono.status !== 'offline') return { id: dono.id, porque: a.tipo === 'arquivo' || a.tipo === 'documento' ? 'é quem fez o arquivo' : 'já cuida deste assunto' };
    var gente = e.pessoas.filter(function (p) { return p.id !== eu && p.id !== 'cliente' && p.status !== 'offline'; });
    if (!gente.length) return null;
    gente.sort(function (x, y) { return abertas(x.id) - abertas(y.id); });
    var n = abertas(gente[0].id);
    return { id: gente[0].id, porque: n === 0 ? 'está sem tarefas abertas agora' : 'tem menos tarefas abertas agora (' + n + ')' };
  }

  function tituloDe(a, acao) {
    if (acao === 'delegar') return 'Parte de: ' + a.nome;
    if (a.tipo === 'texto' || a.tipo === 'campo' || a.tipo === 'secao') {
      var t = limpar(a.trecho || a.nome, 200), fim = t.search(/[.!?](\s|$)/), frase = fim > 12 ? t.slice(0, fim) : t;
      return a.tipo === 'secao' ? a.nome + (frase ? ': ' + frase : '') : frase;
    }
    if (a.tipo === 'arquivo' || a.tipo === 'documento') return 'Revisar ' + a.nome.split('/').pop();
    if (a.tipo === 'codigo') return 'Revisar o código: ' + a.nome;
    return a.nome;
  }

  function criarTarefa(a, acao) {
    if (a.tipo === 'mensagem' && a.botaoDemanda && BC.acoes['msg-demanda']) { BC.acoes['msg-demanda'](a.botaoDemanda); return; }
    var s = sugerir(a);
    E().ui.rascunho = {
      titulo: limpar(tituloDe(a, acao), 110),
      para: s ? s.id : '',
      descricao: (a.trecho ? limpar(a.trecho, 600) + '\n\n' : '') + 'Criada com o ' + NOME + ' a partir de: ' + a.rotulo.toLowerCase() + ' "' + limpar(a.nome, 90) + '".'
    };
    BC.acoes['nova-demanda']();
    aviso(s ? 'Tarefa pronta para você revisar. Sugeri ' + L().nome(s.id) + ': ' + s.porque + '.' : 'Tarefa pronta para você revisar.');
  }

  /* ---------- 4. Check-in automático ---------- */

  function registrarCheckin(frase) {
    setTimeout(function () { /* depois que a ação de origem terminou de ir para o diário */
      var ck = L().estado.checkins[L().eu], hoje = ck && U().mesmoDia(ck.ts);
      var texto = limpar((hoje && ck.hoje ? ck.hoje + ' · ' : '') + frase, 400);
      if (L().fazer('checkin', texto, hoje ? ck.bloqueio : '')) aviso('Check-in atualizado: ' + frase + '.');
    }, 0);
  }

  function conquista(nome, a, b) {
    if (nome === 'pronta') { var d1 = L().demanda(a); return d1 && 'entreguei "' + d1.titulo + '"'; }
    if (nome === 'ok') { var d2 = L().demanda(a); return d2 && 'dei o OK em "' + d2.titulo + '"'; }
    if (nome === 'concluirEtapa') {
      var t = L().tarefa(a), f = t && L().fluxo(t.fluxo);
      return t && f && 'concluí a etapa ' + (f.etapas[t.atual - 1] || 'final') + ' de "' + t.titulo + '"';
    }
    if (nome === 'marcarChecklist' && b != null) {
      var t2 = L().tarefa(a), item = t2 && t2.checklist && t2.checklist[b];
      return item && item.feito && 'marquei "' + item.texto + '"';
    }
    return null;
  }

  function vigiarConquistas() {
    var A = L().A, antes = A._reagir;
    A._reagir = function (nome, a, b) {
      var r = antes ? antes.apply(this, arguments) : undefined;
      if (ligado) { var frase = conquista(nome, a, b); if (frase) registrarCheckin(frase); }
      return r;
    };
    /* os primeiros passos com IA são marcados só neste navegador (não passam pela loja). O app redesenha a tela no clique,
       então a leitura é na captura do clique, quando a caixa já mudou e ainda está na página */
    document.addEventListener('click', function (ev) {
      var c = ev.target;
      if (!ligado || !c.matches || !c.matches('input[type="checkbox"][data-acao="passo"]') || !c.checked) return;
      var rot = c.closest('label');
      registrarCheckin('fiz o passo "' + limpar(rot ? rot.textContent : c.dataset.id, 80) + '"');
    }, true);
  }

  /* ---------- 6. Voz: segurar e falar ---------- */

  var Reconhecer = window.SpeechRecognition || window.webkitSpeechRecognition;
  var escuta = null, segurar = null, pilula = null;

  function normal(t) { return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }

  function ouvir(a, modo) {
    if (!Reconhecer) return aviso('Este navegador não consegue ouvir. No Chrome ou no Safari funciona.');
    if (escuta) return;
    var rec = new Reconhecer();
    rec.lang = 'pt-BR';
    rec.interimResults = true;
    rec.continuous = modo === 'segurar';
    rec.maxAlternatives = 1;
    escuta = { rec: rec, alvo: a, modo: modo, finais: '', parcial: '', erro: false };
    rec.onresult = function (ev) {
      if (!escuta) return;
      var parcial = '';
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) escuta.finais += ev.results[i][0].transcript + ' ';
        else parcial += ev.results[i][0].transcript;
      }
      escuta.parcial = parcial;
      mostrarPilula();
    };
    rec.onerror = function (ev) {
      if (!escuta) return;
      escuta.erro = true;
      var motivo = {
        'not-allowed': 'O navegador não deixou usar o microfone. Libere o microfone para este endereço e tente de novo.',
        'service-not-allowed': 'O navegador não deixou usar o reconhecimento de voz aqui.',
        'network': 'O reconhecimento de voz precisa de internet e não conseguiu falar com o serviço.',
        'audio-capture': 'Não achei um microfone ligado.',
        'no-speech': 'Não ouvi nada. Segure o botão esquerdo e fale.'
      }[ev.error];
      if (motivo) aviso(motivo);
    };
    rec.onend = function () {
      var e = escuta;
      escuta = null;
      esconderPilula();
      estadoLocal('');
      if (e && !e.erro) interpretar(limpar(e.finais + ' ' + e.parcial), e.alvo);
    };
    try { rec.start(); } catch (err) { escuta = null; return aviso('Não consegui ligar o microfone agora. Tente de novo.'); }
    if (window.speechSynthesis) speechSynthesis.cancel();
    esconder();
    marcar(a.el);
    estadoLocal('ouvindo');
    mostrarPilula();
  }
  function pararDeOuvir() { if (escuta) { try { escuta.rec.stop(); } catch (e) { /* já parou */ } } }

  function mostrarPilula() {
    if (!escuta) return;
    if (!pilula) {
      pilula = document.createElement('div');
      pilula.className = 'bcur-ouvindo';
      pilula.setAttribute('role', 'status');
      pilula.addEventListener('click', function (ev) { if (ev.target.closest('[data-bcur="parar"]')) pararDeOuvir(); });
      document.body.appendChild(pilula);
    }
    var dito = limpar(escuta.finais + ' ' + escuta.parcial);
    pilula.innerHTML = '<p class="bcur-ouvindo-cab"><span class="bcur-mic" aria-hidden="true"></span><b>Ouvindo</b><span>' +
      (escuta.modo === 'segurar' ? 'solte o botão para terminar' : 'fale e faça uma pausa') + '</span>' +
      (escuta.modo === 'clique' ? '<button type="button" data-bcur="parar">Parar</button>' : '') + '</p>' +
      '<p class="bcur-ouvindo-texto">' + (dito ? esc(dito) : '<i>' + esc(escuta.alvo.rotulo) + ': ' + esc(limpar(escuta.alvo.nome, 50)) + '</i>') + '</p>';
    var w = pilula.offsetWidth || 300, h = pilula.offsetHeight || 70;
    pilula.style.left = Math.round(Math.max(12, Math.min(window.innerWidth - w - 12, ponteiro.x + 18))) + 'px';
    pilula.style.top = Math.round(Math.max(56, Math.min(window.innerHeight - h - 12, ponteiro.y + 22))) + 'px';
    pilula.dataset.aberta = 'sim';
  }
  function esconderPilula() { if (pilula) pilula.dataset.aberta = 'nao'; }

  /* o que a fala pede, pela primeira palavra (e pelo tipo do elemento) */
  var PEDE_EXPLICAR = /^(me )?(explica|explique|explicar|o que e|o que eh|fala sobre|conta|resume|resuma|le|leia)\b/;
  var PEDE_PESQUISAR = /^(pesquisa|pesquise|procura|procure|busca|busque)\b/;
  var PEDE_TAREFA = /^(cria|crie|criar|anota|anote|nova tarefa|tarefa|manda|mande|pede|peca|pedir|delega|delegue|passa|passe)\b/;

  function interpretar(fala, a) {
    if (!fala) return aviso('Não ouvi nada. Segure o botão esquerdo e fale.');
    var baixo = normal(fala);
    if (a.tipo === 'campo' && !PEDE_EXPLICAR.test(baixo) && !PEDE_TAREFA.test(baixo)) return escreverNoCampo(a.el, fala);
    if (PEDE_EXPLICAR.test(baixo)) return explicar(a, fala);
    if (PEDE_PESQUISAR.test(baixo)) return pedirAoAgente(pedido('pesquisar', a) + ' Pedido falado: "' + fala + '"', true);
    if (PEDE_TAREFA.test(baixo)) return criarTarefaFalada(a, fala);
    pedirAoAgente('[' + NOME + ' · ' + a.rotulo + ': ' + limpar(a.nome, 90) + '] ' + fala + (a.trecho ? ' Trecho: "' + limpar(a.trecho, 900) + '"' : ''), true);
  }

  function escreverNoCampo(campo, fala) {
    /* a tela pode ter sido redesenhada enquanto a pessoa falava: a caixa nova tem o mesmo id */
    if (!campo.isConnected && campo.id) campo = document.getElementById(campo.id) || campo;
    if (!campo.isConnected) return aviso('A caixa de texto mudou de lugar. Segure o botão sobre ela e fale de novo.');
    campo.value = (campo.value ? campo.value.replace(/\s+$/, '') + ' ' : '') + fala;
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    campo.focus();
    aviso('Escrevi o que você falou.');
  }

  function explicar(a, fala) {
    if (a.tipo === 'tarefa') {
      var texto = contarTarefa(a);
      if (texto) { dizer(texto); aviso('🔊 ' + limpar(texto, 160)); return; }
    }
    pedirAoAgente(pedido('explicar', a) + ' Pedido falado: "' + fala + '"', true);
  }

  /* a tarefa contada em voz alta, com os mesmos dados da caixa que sai do título */
  function contarTarefa(a) {
    var abre = abreTarefa(a.el), u = U();
    if (!abre) return '';
    var id = abre.dataset.id;
    if (abre.dataset.acao === 'abrir-tarefa') {
      var t = L().tarefa(id), f = t && L().fluxo(t.fluxo);
      if (!t || !f) return '';
      var faltam = (t.checklist || []).filter(function (c) { return !c.feito; }).map(function (c) { return c.texto; });
      return 'Tarefa do fluxo ' + f.nome + ': ' + t.titulo + '. Está na etapa ' + (f.etapas[t.atual] || 'final') + ', com ' + quemFala(t.donos[t.atual]) + '. ' +
        'Prazo: ' + u.prazo(t.prazo).texto + '. Andamento: ' + L().pct(t) + ' por cento.' + (faltam.length ? ' Falta: ' + faltam.join('; ') + '.' : '');
    }
    var d = L().demanda(id);
    if (!d) return '';
    var pz = u.prazo(d.prazo), tempo = d.inicio ? L().tempo(d) : null;
    return 'Tarefa: ' + d.titulo + '. ' + (d.para ? 'De ' + quemFala(d.de) + ' para ' + quemFala(d.para) : 'Livre, pedida por ' + quemFala(d.de)) + '. ' +
      'Estado: ' + BC.demandasUI.rotulo[d.estado] + '. Prazo: ' + pz.texto + (d.prazo && pz.classe === 'hoje' ? ' às ' + u.hora(d.prazo) : '') + '. ' +
      (d.estimativaMin ? 'Estimativa: ' + u.duracao(d.estimativaMin * u.MIN) + '. ' : '') +
      (tempo ? 'Trabalhado: ' + u.duracao(tempo.trabalho) + '. ' : '') + (d.descricao ? d.descricao : '');
  }
  function quemFala(id) { return id === L().eu ? 'você' : L().nome(id); }

  function dizer(texto) {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(texto);
    u.lang = 'pt-BR';
    u.rate = 1.04;
    var vozes = speechSynthesis.getVoices();
    var voz = vozes.filter(function (v) { return /^pt[-_]BR/i.test(v.lang); })[0] || vozes.filter(function (v) { return /^pt/i.test(v.lang); })[0];
    if (voz) u.voice = voz;
    u.onstart = function () { estadoLocal('falando'); };
    u.onend = u.onerror = function () { estadoLocal(''); };
    speechSynthesis.speak(u);
  }

  /* "cria uma tarefa pra Carla revisar o contrato": a pessoa citada vira o "para quem"; o resto vira o título */
  function criarTarefaFalada(a, fala) {
    var eu = L().eu, baixo = normal(fala);
    var citada = L().estado.pessoas.filter(function (p) {
      var primeiro = normal(String(p.nome || '').split(' ')[0]);
      return p.id !== eu && primeiro.length > 1 && new RegExp('\\b' + primeiro + '\\b').test(baixo);
    })[0];
    var s = citada ? { id: citada.id, porque: 'você falou o nome' } : sugerir(a);
    var titulo = fala.replace(/^\s*(cria|crie|criar|anota|anote)\s+(uma\s+)?(nova\s+)?(tarefa\s*)?(pra|para)?\s*/i, '').replace(/^\s*(nova\s+)?tarefa[:,]?\s*/i, '');
    titulo = titulo.charAt(0).toUpperCase() + titulo.slice(1);
    E().ui.rascunho = {
      titulo: limpar(titulo || fala, 110),
      para: s ? s.id : '',
      descricao: 'Pedido falado: "' + fala + '"\n\nCriada com o ' + NOME + ' a partir de: ' + a.rotulo.toLowerCase() + ' "' + limpar(a.nome, 90) + '".' +
        (a.trecho && a.tipo !== 'campo' ? '\n' + limpar(a.trecho, 400) : '')
    };
    BC.acoes['nova-demanda']();
    aviso('Escrevi a tarefa pelo que você falou' + (s ? ', para ' + L().nome(s.id) + ' (' + s.porque + ')' : '') + '. Confira e envie.');
  }

  /* o gesto: segurar o botão esquerdo sobre o elemento. Clique rápido continua sendo clique. */
  document.addEventListener('pointerdown', function (ev) {
    if (!ligado || ev.button !== 0 || ev.pointerType === 'touch' || escuta) return;
    if (ev.target.closest && ev.target.closest('.bcur-lente, .bcur-ouvindo')) return;
    var a = identificar(ev.target);
    if (!a) return;
    clearTimeout(tMostrar); /* apertou: a lente que ia abrir não abre mais (ou é clique, ou é fala) */
    var s = { a: a, x: ev.clientX, y: ev.clientY, ligou: false };
    s.t = setTimeout(function () {
      s.ligou = true;
      if (window.getSelection) window.getSelection().removeAllRanges();
      ouvir(a, 'segurar');
    }, SEGURAR);
    segurar = s;
  }, true);
  document.addEventListener('pointermove', function (ev) {
    if (segurar && !segurar.ligou && Math.abs(ev.clientX - segurar.x) + Math.abs(ev.clientY - segurar.y) > 10) { clearTimeout(segurar.t); segurar = null; }
    if (escuta && pilula) mostrarPilula();
  }, { passive: true });
  document.addEventListener('pointerup', function () {
    if (!segurar) return;
    clearTimeout(segurar.t);
    if (segurar.ligou) { engolirClique(); pararDeOuvir(); }
    segurar = null;
  }, true);
  document.addEventListener('dragstart', function (ev) { if (segurar && segurar.ligou) ev.preventDefault(); }, true);

  /* o clique que vem depois de soltar o botão não abre nada: aquele aperto era fala */
  function engolirClique() {
    function engolir(ev) { ev.preventDefault(); ev.stopPropagation(); document.removeEventListener('click', engolir, true); }
    document.addEventListener('click', engolir, true);
    setTimeout(function () { document.removeEventListener('click', engolir, true); }, 500);
  }

  /* ---------- 7. Roxo: ouvindo, falando, mandando ou o agente pensando ---------- */

  var estadoProprio = '', tEstado = 0;
  function estadoLocal(e, dura) {
    estadoProprio = e;
    clearTimeout(tEstado);
    if (e && dura) tEstado = setTimeout(function () { estadoLocal(''); }, dura);
    pintarEstado();
  }
  function agenteTrabalhando() {
    var R = BC.terminalReal;
    if (R && R.pronto && R.pronto()) {
      return R.sessoes().some(function (s) { return s.nome === NOME && /pensando|rodando/.test(String(s.estado)); });
    }
    return /pensando|rodando/.test(document.documentElement.dataset.agente || '') || !!document.querySelector('.term-estado.pensando');
  }
  function pintarEstado() {
    var html = document.documentElement, estado = ligado ? (estadoProprio || (agenteTrabalhando() ? 'pensando' : '')) : '';
    if ((html.dataset.bcurEstado || '') === estado) return;
    if (estado) html.dataset.bcurEstado = estado; else delete html.dataset.bcurEstado;
    if (botao) botao.title = estado === 'ouvindo' ? NOME + ' ouvindo' : estado === 'falando' ? NOME + ' falando' : estado ? NOME + ' trabalhando' : botao.title;
  }

  /* ---------- 5. Ligar e desligar ---------- */

  function ligar(v, calado) {
    ligado = !!v;
    guardar(CHAVE, ligado ? '1' : '0');
    document.documentElement.dataset.babelCursor = ligado ? 'ligado' : 'desligado';
    if (botao) {
      botao.setAttribute('aria-pressed', String(ligado));
      botao.title = ligado ? NOME + ' ligado: pare o mouse sobre qualquer coisa. Clique (ou Ctrl/⌘ + .) para desligar.'
        : 'Ligar o ' + NOME + ': o mouse passa a ler o que está embaixo dele (Ctrl/⌘ + .)';
    }
    if (!ligado) { esconder(); pararDeOuvir(); if (window.speechSynthesis) speechSynthesis.cancel(); }
    pintarEstado();
    if (!calado) aviso(ligado ? NOME + ' ligado: pare o mouse sobre uma tarefa, um arquivo ou um texto.' : NOME + ' desligado.');
  }

  function instalarBotao() {
    var topo = document.querySelector('.e-topo-dir');
    if (!topo || topo.querySelector('.bcur-botao')) return;
    botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'bcur-botao';
    botao.innerHTML = '<span class="bcur-ponto" aria-hidden="true"></span><span class="bcur-texto">' + NOME + '</span>';
    botao.addEventListener('click', function () { ligar(!ligado); });
    topo.insertBefore(botao, topo.firstChild);
    ligar(ligado, true);
  }

  document.addEventListener('pointermove', function (ev) { ponteiro.x = ev.clientX; ponteiro.y = ev.clientY; }, { passive: true });

  document.addEventListener('pointerover', function (ev) {
    if (!ligado || ev.pointerType === 'touch') return;
    if (ev.target.closest && ev.target.closest('.bcur-lente')) { clearTimeout(tEsconder); return; }
    var a = identificar(ev.target);
    if (a && alvo && a.el === alvo.el) { clearTimeout(tEsconder); return; }
    clearTimeout(tMostrar);
    if (!a) { if (!alvo) marcar(null); agendarEsconder(); return; }
    clearTimeout(tEsconder);
    marcar(a.el);
    tMostrar = setTimeout(function () { mostrar(a); }, alvo ? TROCA : ESPERA);
  });

  document.addEventListener('keydown', function (ev) {
    if ((ev.metaKey || ev.ctrlKey) && ev.key === '.') { ev.preventDefault(); ligar(!ligado); return; }
    if (ev.key === 'Escape' && alvo) esconder();
  });
  window.addEventListener('scroll', function () { if (alvo) esconder(); }, true);

  ligado = ler(CHAVE) === '1';
  document.documentElement.dataset.babelCursor = ligado ? 'ligado' : 'desligado';
  vigiarConquistas();
  instalarBotao();
  /* o topo nasce com o app (app.js vem depois deste arquivo) e pode ser redesenhado: confere de vez em quando */
  setInterval(instalarBotao, 1000);
  setInterval(pintarEstado, 400);

  BC.babelCursor = { ligar: ligar, ligado: function () { return ligado; }, instrucoes: INSTRUCOES, interpretar: interpretar, identificar: identificar };
})(window.BC);
