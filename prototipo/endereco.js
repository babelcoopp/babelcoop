/* babel-coop · endereco.js · tudo tem endereço (PLANO §1 propriedade 2 · F2 "a sala")
   Sala (projeto ou atividade) › bancada (pasta ou tipo) › peça (arquivo, Máquina, tela, demanda, canal).
   · o cabeçalho do objeto no meio mostra o endereço, clicável por parte, e quem está com o objeto;
   · presença vira posição, derivada do que o app já grava: posicoes (esta ação), vendo, fazendo e os terminais dos agentes;
   · o histórico vira rastro ("por onde passou"): cada parada com hora e o que fez, luz que esfria (meia-vida de 5 min);
   · Ctrl K → grupo "Onde estão" e o verbo "Ir até"; a lateral de Equipe mostra a planta da sala;
   · luz dirigida quando alguém chega no mesmo objeto que você (BC.organismo quando existe; senão só CSS).
   Régua (REGUA_ORGANISMO.md): luz só com evento real; nada pulsa em repouso; prefers-reduced-motion = três degraus sem laço;
   laço de luz parado com a aba oculta. Pessoas: só o que já é público (salvou, demanda, canal, terminal ao vivo) mais a
   posição de agora; o rastro completo de posições é só o seu. Agentes: cada passo.
   API para as outras telas (TV, celular): BC.endereco.de, texto, posicao, ondeEstao, salas, rastro, irAte, abrir. */
window.BC = window.BC || {};
BC.acoes = BC.acoes || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc, A = BC.acoes;
  function L() { return BC.loja; }
  function EST() { return BC.estacao; }
  function O() { var o = BC.organismo; return o && o.versao ? o : null; }
  function $(id) { return document.getElementById(id); }
  function reduzido() { var o = O(); return o ? o.reduzido() : U.movimentoReduzido(); }

  var MV_CHEGADA = 6000;       /* --mv-curta: a luz da chegada esfria em 6 s */
  var MV_PRESENCA = 300000;    /* --mv-media: presença e rastro (ponto cheio = agora · 50 % = 5 min) */
  var VALE_EXPLICITO = 60000;  /* posição dita (abriu, está vendo) vale mais que o "fazendo" por 1 min */

  var ATIVIDADES = {
    explorador: 'Criar', dia: 'Meu dia', demandas: 'Demandas', chat: 'Chat', reuniao: 'Reunião', acervo: 'Acervo',
    inteligencia: 'Inteligência', terminais: 'Terminais', tarefas: 'Tarefas', metas: 'Metas', equipe: 'Equipe',
    mapa: 'Mapa da equipe', projetos: 'Projetos', whatsapp: 'WhatsApp', loja: 'Loja', oficina: 'Oficina'
  };
  var NA_ATIVIDADE = {
    explorador: 'em Criar', dia: 'em Meu dia', demandas: 'em Demandas', chat: 'no Chat', reuniao: 'na Reunião', acervo: 'no Acervo',
    inteligencia: 'em Inteligência', terminais: 'em Terminais', tarefas: 'em Tarefas', metas: 'em Metas', equipe: 'em Equipe',
    mapa: 'no Mapa da equipe', projetos: 'em Projetos', whatsapp: 'no WhatsApp', loja: 'na Loja', oficina: 'na Oficina'
  };
  var TIPO_ARQ = { html: 'Tela', md: 'Texto', txt: 'Texto', csv: 'Planilha', pdf: 'PDF', imagem: 'Imagem', video: 'Vídeo', mapa: 'Mapa', quadro: 'Quadro',
    js: 'Código', ts: 'Código', py: 'Código', sh: 'Código', css: 'Código', json: 'Código', binario: 'Arquivo' };
  var ESTADO_DEM = { enviada: 'para começar', andamento: 'em andamento', pausada: 'pausadas', pronta: 'aguardando OK', concluida: 'concluídas', livre: 'livres', devolvida: 'devolvidas' };

  /* ======================================================================
     1. Consultas pequenas
     ====================================================================== */

  function estado() { return L().estado; }
  function projetos() { return estado().projetos || []; }
  function projeto(id) { return projetos().filter(function (p) { return p.id === id; })[0] || null; }
  function projetoDoArquivo(a) {
    if (!a || a.dono === 'equipe') return null;
    return projetos().filter(function (pj) { return a.caminho.indexOf(a.dono + '/' + pj.pasta + '/') === 0; })[0] || null;
  }
  function projetoDoCanal(id) { return projetos().filter(function (pj) { return pj.canal && pj.canal === id; })[0] || null; }
  function projetoDaPessoa(id) { return projetos().filter(function (pj) { return pj.membros.indexOf(id) !== -1; })[0] || null; }
  function nomeArq(a) { return a.caminho.split('/').pop(); }
  function nomeDe(id) { return id === 'equipe' ? 'equipe' : L().nome(id); }
  function dominio(url) { return String(url || '').replace(/^https?:\/\//, '').split('/')[0].toLowerCase(); }
  function agenteInfo(agId) {
    var ps = estado().pessoas;
    for (var i = 0; i < ps.length; i++) {
      var ags = ps[i].agentes || [];
      for (var j = 0; j < ags.length; j++) if (ags[j].id === agId) return { ag: ags[j], dono: ps[i] };
    }
    return null;
  }
  function agentePorNome(pessoaId, nome) {
    var p = L().pessoa(pessoaId), n = U.normalizar(nome).trim();
    return p ? (p.agentes || []).filter(function (a) { return U.normalizar(a.nome) === n; })[0] || null : null;
  }
  /* o arquivo cujo nome aparece no texto (prefere o de quem fala e o nome mais longo) */
  function arquivoNoTexto(texto, preferir) {
    var t = String(texto || '').toLowerCase(), melhor = null;
    estado().arquivos.forEach(function (a) {
      var n = nomeArq(a).toLowerCase();
      if (n.length < 4 || t.indexOf(n) === -1) return;
      var nota = n.length + (a.dono === preferir ? 100 : 0);
      if (!melhor || nota > melhor.nota) melhor = { a: a, nota: nota };
    });
    return melhor ? melhor.a : null;
  }
  function luzDe(ts, mv) { return ts ? Math.pow(2, -(Date.now() - ts) / (mv || MV_PRESENCA)) : 0; }
  function degraus(l) { return reduzido() ? (l > 0.6 ? 1 : l > 0.2 ? 0.35 : 0) : l; }
  /* a escala de tempo da marca: ciano = agora · azul = hoje · roxo = antes (só na marca de 6 px, nunca no texto) */
  function marcaTempo(ts) {
    if (!ts) return 'var(--t2)';
    if (Date.now() - ts < 10 * U.MIN) return 'var(--t0)';
    return U.mesmoDia(ts) ? 'var(--t1)' : 'var(--t2)';
  }

  /* ======================================================================
     2. Endereço: alvo → Sala › bancada › peça
     alvo = { tipo, ref, rotulo?, agente?, peca? }; chave = tipo:ref (mesmo objeto = mesma chave)
     ====================================================================== */

  function chaveDe(alvo) { return alvo ? alvo.tipo + ':' + (alvo.ref != null && alvo.tipo !== 'texto' && alvo.tipo !== 'site' ? alvo.ref : (alvo.rotulo || '')) : null; }
  function salaProjeto(pj) { return { id: 'pj:' + pj.id, rotulo: pj.nome, tipo: 'projeto', ir: { tipo: 'projeto', ref: pj.id } }; }
  function salaAtividade(at) { return { id: 'at:' + at, rotulo: ATIVIDADES[at] || at, tipo: 'atividade', ir: { tipo: 'atividade', ref: at } }; }

  function enderecar(alvo) {
    if (!alvo) return null;
    var t = alvo.tipo, ref = alvo.ref, sala = null, banc = null, peca = null, e = estado(), pj;
    if (t === 'arquivo') {
      var a = L().arquivo(ref);
      if (!a) { sala = salaAtividade('explorador'); peca = { rotulo: alvo.rotulo || 'arquivo que saiu', ir: null }; }
      else {
        pj = projetoDoArquivo(a);
        if (pj) {
          sala = salaProjeto(pj);
          banc = { rotulo: (TIPO_ARQ[a.tipo] || 'Arquivo') + ' · ' + nomeDe(a.dono), ir: { tipo: 'bancada-projeto', ref: pj.id, dono: a.dono, arquivo: a.id } };
        } else {
          sala = salaAtividade('explorador');
          var pastas = a.caminho.split('/').slice(1, -1);
          banc = { rotulo: (a.dono === 'equipe' ? 'HD da equipe' : 'pasta de ' + nomeDe(a.dono)) + (pastas.length ? ' › ' + pastas.join(' › ') : ''),
            ir: { tipo: 'pasta', ref: a.caminho.split('/').slice(0, -1).join('/'), arquivo: a.id } };
        }
        peca = { rotulo: nomeArq(a), ir: { tipo: 'copiar' } };
      }
    } else if (t === 'maquina') {
      pj = projeto(ref);
      sala = pj ? salaProjeto(pj) : salaAtividade('explorador');
      banc = { rotulo: 'Máquina', ir: { tipo: 'maquina', ref: ref } };
      var m = BC.maquina && BC.maquina.maquinas && BC.maquina.maquinas[ref], sel = m && m.sel ? (m.pecas || []).filter(function (p) { return p.id === m.sel; })[0] : null;
      peca = { rotulo: alvo.peca || (sel ? sel.nome : 'backend'), ir: { tipo: 'copiar' } };
    } else if (t === 'demanda') {
      var d = L().demanda(ref);
      sala = salaAtividade('demandas');
      banc = d ? { rotulo: ESTADO_DEM[d.estado] || d.estado, ir: { tipo: 'demandas', filtro: d.estado === 'livre' ? 'livres' : d.para === L().eu ? 'recebidas' : d.de === L().eu ? 'enviadas' : null } } : null;
      peca = { rotulo: d ? d.titulo : (alvo.rotulo || 'demanda'), ir: { tipo: 'copiar' } };
    } else if (t === 'chat') {
      var c = L().conversa(ref);
      pj = projetoDoCanal(ref);
      sala = pj ? salaProjeto(pj) : salaAtividade('chat');
      banc = { rotulo: !c ? 'conversas' : c.tipo === 'direta' ? 'diretas' : c.tipo === 'cliente' ? 'clientes' : 'canais', ir: { tipo: 'lateral', ref: 'chat' } };
      peca = { rotulo: !c ? (alvo.rotulo || ref) : c.tipo === 'direta' ? '@' + L().nomeConversa(c, L().eu) : '#' + (c.nome || c.id), ir: { tipo: 'copiar' } };
    } else if (t === 'navegador') {
      var info = agenteInfo(ref), s = BC.navegador && BC.navegador.sessoes ? BC.navegador.sessoes[ref] : null;
      sala = salaAtividade('terminais');
      banc = { rotulo: 'navegador de ' + (info ? info.ag.nome : 'agente'), ir: { tipo: 'terminal', ref: info ? info.dono.id : null } };
      peca = { rotulo: s ? dominio(s.url) : (alvo.rotulo || 'navegador'), ir: { tipo: 'copiar' } };
    } else if (t === 'site') {
      sala = salaAtividade('terminais');
      banc = { rotulo: 'navegador' + (ref ? ' de ' + nomeDe(ref) : ''), ir: { tipo: 'terminal', ref: ref } };
      peca = { rotulo: alvo.rotulo || 'site', ir: { tipo: 'copiar' } };
    } else if (t === 'terminal') {
      var ag = alvo.agente ? agenteInfo(alvo.agente) : null;
      sala = salaAtividade('terminais');
      banc = { rotulo: 'terminal de ' + nomeDe(ref), ir: { tipo: 'terminal', ref: ref } };
      peca = { rotulo: ag ? ag.ag.nome : 'shell', ir: { tipo: 'copiar' } };
    } else if (t === 'projeto') {
      pj = projeto(ref);
      sala = pj ? salaProjeto(pj) : salaAtividade('projetos');
      peca = { rotulo: 'visão do projeto', ir: { tipo: 'copiar' } };
    } else if (t === 'perfil') {
      sala = salaAtividade('equipe');
      banc = { rotulo: 'pessoas', ir: { tipo: 'atividade', ref: 'equipe' } };
      peca = { rotulo: nomeDe(ref), ir: { tipo: 'copiar' } };
    } else if (t === 'tarefa') {
      var tf = L().tarefa(ref), fl = tf && L().fluxo(tf.fluxo);
      sala = salaAtividade('tarefas');
      banc = fl ? { rotulo: fl.nome, ir: { tipo: 'atividade', ref: 'tarefas' } } : null;
      peca = { rotulo: tf ? tf.titulo : 'tarefa', ir: { tipo: 'copiar' } };
    } else if (t === 'atividade') {
      sala = salaAtividade(ref);
      if (alvo.rotulo) peca = { rotulo: alvo.rotulo, ir: { tipo: 'copiar' } };
    } else {
      sala = salaAtividade('explorador');
      peca = { rotulo: alvo.rotulo || 'algo', ir: null };
    }
    var partes = [sala];
    if (banc) partes.push(banc);
    if (peca) partes.push(peca);
    partes.forEach(function (p, i) { p.nivel = i === 0 ? 'sala' : (peca && i === partes.length - 1) ? 'peca' : 'bancada'; });
    var alvoLimpo = { tipo: t, ref: ref != null ? ref : null };
    if (alvo.rotulo) alvoLimpo.rotulo = alvo.rotulo;
    if (alvo.agente) alvoLimpo.agente = alvo.agente;
    return { chave: chaveDe(alvo), alvo: alvoLimpo, sala: sala, partes: partes, rotulo: (peca || banc || sala).rotulo, texto: partes.map(function (p) { return p.rotulo; }).join(' › ') };
  }

  /* a aba do meio → alvo */
  function alvoDaAba(tab) {
    if (!tab) return null;
    var E = EST();
    switch (tab.tipo) {
      case 'vazio': return null;
      case 'arquivo': case 'maquina': case 'demanda': case 'navegador': case 'projeto': case 'perfil': case 'tarefa':
        return { tipo: tab.tipo, ref: tab.ref };
      case 'chat': return { tipo: 'chat', ref: (E && E.ui.canal) || 'geral' };
      case 'explorador': return { tipo: 'atividade', ref: 'explorador' };
      case 'nova-demanda': return { tipo: 'atividade', ref: 'demandas', rotulo: 'nova demanda' };
      case 'nova-tarefa': return { tipo: 'atividade', ref: 'tarefas', rotulo: 'nova tarefa' };
      case 'terminais': return E && E.ui.termPessoa ? { tipo: 'terminal', ref: E.ui.termPessoa, agente: E.ui.termAgente || null } : { tipo: 'atividade', ref: 'terminais' };
      default: return { tipo: 'atividade', ref: tab.atividade && ATIVIDADES[tab.atividade] ? tab.atividade : tab.tipo };
    }
  }

  /* "fazendo" (texto que o app grava) → alvo */
  function alvoDoFazendo(id, texto) {
    var m;
    if ((m = /^(editando|lendo|abrindo|vendo|revisando)\s+(.+)$/i.exec(texto))) {
      var a = arquivoNoTexto(m[2], id);
      return a ? { tipo: 'arquivo', ref: a.id, oque: m[1].toLowerCase() } : { tipo: 'texto', rotulo: m[2], oque: m[1].toLowerCase() };
    }
    if ((m = /^no terminal\s+(.+)$/i.exec(texto))) { var ag = agentePorNome(id, m[1]); return { tipo: 'terminal', ref: id, agente: ag ? ag.id : null, oque: '' }; }
    if (/^no chat/i.test(texto)) return { tipo: 'atividade', ref: 'chat', oque: 'conversando' };
    if (/whatsapp/i.test(texto)) return { tipo: 'atividade', ref: 'whatsapp', oque: 'atendendo' };
    if (/m[aá]quina/i.test(texto)) { var pj = projetoDaPessoa(id); return pj ? { tipo: 'maquina', ref: pj.id, oque: 'montando' } : { tipo: 'atividade', ref: 'explorador', oque: 'na Máquina' }; }
    if ((m = /navegador\s*·\s*(\S+)/i.exec(texto))) return { tipo: 'site', ref: id, rotulo: m[1], oque: 'navegando' };
    return { tipo: 'texto', rotulo: texto, oque: '' };
  }

  /* texto de um passo do agente (pedido ou comando) → alvo */
  function alvoDoTexto(texto, donoId, agId) {
    var t = String(texto || ''), n = U.normalizar(t), a = arquivoNoTexto(t, donoId), url;
    if (a) return { tipo: 'arquivo', ref: a.id };
    if (/coop (buscar|aprendizados)|acervo/.test(n)) return { tipo: 'atividade', ref: 'acervo' };
    if (/campanha/.test(n)) return { tipo: 'atividade', ref: 'metas' };
    if (/coop (status|demandas)|demanda/.test(n)) return { tipo: 'atividade', ref: 'demandas' };
    if (/whatsapp|zap/.test(n)) return { tipo: 'atividade', ref: 'whatsapp' };
    if (/\bmapa\b/.test(n)) return { tipo: 'atividade', ref: 'explorador' };
    if ((url = /((?:https?:\/\/)?[a-z0-9][a-z0-9-]*\.(?:com|br|net|org|io|dev)(?:\.[a-z]{2})?)/i.exec(t))) return { tipo: 'site', ref: donoId, rotulo: dominio(url[1]) };
    return { tipo: 'terminal', ref: donoId, agente: agId || null };
  }

  /* ======================================================================
     3. Posição (presença vira posição)
     ====================================================================== */

  var observado = {};     /* pessoa → { texto, ts } do "fazendo" que eu vi mudar */
  var trocasFazendo = {}; /* pessoa → [{ ts, texto }] (só o que eu vi mudar nesta janela) */
  function observarFazendo() {
    var f = estado().fazendo || {}, agora = Date.now();
    Object.keys(f).forEach(function (id) {
      var o = observado[id];
      if (!o) { observado[id] = { texto: f[id], ts: null }; return; }
      if (o.texto === f[id]) return;
      observado[id] = { texto: f[id], ts: agora };
      var l = trocasFazendo[id] || (trocasFazendo[id] = []);
      l.push({ ts: agora, texto: f[id] });
      if (l.length > 12) l.shift();
    });
  }

  var cacheParadas = { v: null, mapa: {} };
  function paradasAgente(agId) {
    var v = estado().v + '|' + estado().pessoas.length;
    if (cacheParadas.v !== v) cacheParadas = { v: v, mapa: {} };
    if (!cacheParadas.mapa[agId]) cacheParadas.mapa[agId] = calcularParadas(agId);
    return cacheParadas.mapa[agId].map(function (x) { return Object.assign({}, x); });
  }
  function calcularParadas(agId) {
    var info = agenteInfo(agId);
    if (!info) return [];
    var linhas = (estado().terminais || {})[info.dono.id] || [], primeiro = (info.dono.agentes || [])[0], ehPrimeiro = !!primeiro && primeiro.id === agId, r = [];
    function dele(l) { return l.agente ? l.agente === agId : ehPrimeiro && (l.tipo === 'prompt' || l.tipo === 'ia') && !l.por; }
    for (var i = 0; i < linhas.length; i++) {
      var l = linhas[i];
      if (!dele(l) || (l.tipo !== 'prompt' && l.tipo !== 'cmd')) continue;
      var res = null;
      for (var j = i + 1; j < linhas.length && j < i + 6; j++) { if (dele(linhas[j]) && (linhas[j].tipo === 'ia' || linhas[j].tipo === 'saida')) { res = linhas[j].texto; break; } if (linhas[j].tipo === 'prompt' || linhas[j].tipo === 'cmd') break; }
      var pedido = String(l.texto).replace(/^claude\s+/, '').replace(/^"|"$/g, '');
      r.push({ ts: l.ts, alvo: alvoDoTexto(pedido + ' ' + (res || ''), info.dono.id, agId), oque: pedido, resultado: res, fonte: 'terminal' });
    }
    return r.sort(function (a, b) { return b.ts - a.ts; });
  }

  function posicaoAgente(agId) {
    var info = agenteInfo(agId);
    if (!info) return null;
    var base = { id: 'ag:' + agId, tipo: 'agente', agente: info.ag, dono: info.dono, nome: info.ag.nome, cor: info.dono.cor, fora: info.dono.status === 'offline', estado: info.ag.estado || 'parado' };
    var sess = BC.navegador && BC.navegador.sessoes ? BC.navegador.sessoes[agId] : null, alvo = null, ts = null, oque = '';
    if (sess && !sess.fim) { alvo = { tipo: 'navegador', ref: agId }; ts = Date.now(); oque = 'navegando'; }
    else if (info.ag.estado === 'pensando' && info.dono.id === L().eu && EST()) { alvo = alvoDaAba(EST().abaAtual()) || { tipo: 'terminal', ref: info.dono.id, agente: agId }; ts = Date.now(); oque = 'pensando'; }
    else {
      var ult = paradasAgente(agId)[0];
      if (ult) { alvo = ult.alvo; ts = ult.ts; oque = info.ag.estado === 'pensando' ? 'pensando' : 'terminou'; }
    }
    base.alvo = alvo; base.ts = ts; base.oque = oque;
    base.end = enderecar(alvo);
    base.chave = base.end ? base.end.chave : null;
    return base;
  }

  function posicaoPessoa(id) {
    var e = estado(), p = L().pessoa(id);
    if (!p) return null;
    var fora = p.status === 'offline', cands = [], agora = Date.now();
    if (id === L().eu && EST() && EST().abaAtual) {
      var al = alvoDaAba(EST().abaAtual());
      if (al) cands.push({ alvo: al, ts: agora, fonte: 'aba', oque: 'aqui', explicito: true });
    }
    var ps = (e.posicoes || {})[id];
    if (ps) cands.push({ alvo: { tipo: ps.tipo, ref: ps.ref, rotulo: ps.rotulo, agente: ps.agente }, ts: ps.ts, fonte: 'posicao', oque: ps.oque || '', explicito: true });
    var v = (e.vendo || {})[id];
    if (v && agora - v.ts < 45000) cands.push({ alvo: { tipo: 'arquivo', ref: v.arquivo }, ts: v.ts, fonte: 'vendo', oque: 'vendo', explicito: true });
    var f = (e.fazendo || {})[id];
    if (f && !fora) { var ob = observado[id], al2 = alvoDoFazendo(id, f); cands.push({ alvo: al2, ts: ob && ob.texto === f ? ob.ts : null, fonte: 'fazendo', oque: al2.oque || '' }); }
    var melhor = null;
    cands.forEach(function (c) {
      if (!melhor) { melhor = c; return; }
      var novoExp = c.explicito && c.ts && agora - c.ts < VALE_EXPLICITO, velhoExp = melhor.explicito && melhor.ts && agora - melhor.ts < VALE_EXPLICITO;
      if (novoExp && !velhoExp) { melhor = c; return; }
      if (velhoExp && !novoExp) return;
      if ((c.ts || 0) > (melhor.ts || 0)) melhor = c;
    });
    var r = { id: id, tipo: 'pessoa', pessoa: p, nome: p.nome, cor: p.cor, fora: fora, estado: p.status, eu: id === L().eu };
    if (melhor) { r.alvo = melhor.alvo; r.ts = melhor.ts; r.fonte = melhor.fonte; r.oque = melhor.oque; r.end = enderecar(melhor.alvo); r.chave = r.end ? r.end.chave : null; }
    return r;
  }

  function posicao(id) { return !id ? null : id.indexOf('ag:') === 0 ? posicaoAgente(id.slice(3)) : posicaoPessoa(id); }

  /* todas as posições, calculadas uma vez por mudança (estado, aba, pessoa, janela de 5 s) */
  var cache = { k: null, lista: [] };
  function todas() {
    var E = EST(), k = [estado().v, L().eu, E ? E.ui.ativa : '', E ? E.ui.canal : '', E ? E.ui.termPessoa : '', Math.floor(Date.now() / 5000), estado().pessoas.length].join('|');
    if (cache.k === k) return cache.lista;
    var r = [];
    estado().pessoas.forEach(function (p) {
      var pos = posicaoPessoa(p.id);
      if (pos) r.push(pos);
      (p.agentes || []).forEach(function (ag) { if (ag.visivel === false) return; var pa = posicaoAgente(ag.id); if (pa) r.push(pa); });
    });
    cache = { k: k, lista: r };
    return r;
  }
  function recente(pos) { return pos.tipo !== 'agente' || pos.estado === 'pensando' || (pos.ts && Date.now() - pos.ts < 60 * U.MIN); }
  /* quem está com o objeto (chave), sem você */
  function quemEsta(chave, comigo) {
    if (!chave) return [];
    var eu = L().eu;
    return todas().filter(function (p) { return p.chave === chave && !p.fora && (comigo || p.id !== eu) && recente(p); });
  }
  function minhaChave() { var E = EST(); return E ? chaveDe(alvoDaAba(E.abaAtual())) : null; }

  /* frases: "Carla está na landing.html" */
  function onde(end, alvo) {
    if (!end) return 'sem posição';
    var t = alvo.tipo, r = end.rotulo;
    if (t === 'arquivo') { var a = L().arquivo(alvo.ref); return (a && (a.tipo === 'html' || a.tipo === 'md') ? 'na ' : a && (a.tipo === 'mapa' || a.tipo === 'quadro') ? 'no ' : 'em ') + r; }
    if (t === 'maquina') return 'na Máquina · ' + end.sala.rotulo;
    if (t === 'demanda') return 'na demanda "' + r + '"';
    if (t === 'chat') return (r.charAt(0) === '@' ? 'na conversa com ' + r.slice(1) : 'no ' + r);
    if (t === 'terminal') return 'no terminal ' + (r === 'shell' ? 'de ' + nomeDe(alvo.ref) : r);
    if (t === 'navegador' || t === 'site') return 'no navegador · ' + r;
    if (t === 'projeto') return 'no projeto ' + end.sala.rotulo;
    if (t === 'perfil') return 'no perfil de ' + r;
    if (t === 'tarefa') return 'na tarefa "' + r + '"';
    if (t === 'atividade') return alvo.rotulo ? 'em ' + alvo.rotulo : NA_ATIVIDADE[alvo.ref] || 'em ' + end.sala.rotulo;
    return r;
  }
  var VERBOS = /^(editando|lendo|vendo|revisando|abrindo|abriu)$/;
  function acao(pos) {
    if (!pos.end) return pos.fora ? 'desligado(a)' : 'sem posição agora';
    var o = pos.oque && pos.oque !== 'aqui' && pos.oque !== 'no terminal' ? pos.oque : '';
    if (pos.alvo.tipo === 'arquivo' && VERBOS.test(o)) return o + ' ' + pos.end.rotulo;
    return onde(pos.end, pos.alvo) + (o ? ' · ' + o : '');
  }
  function frase(pos) {
    if (!pos) return '';
    var nome = pos.eu ? 'Você' : pos.nome;
    if (!pos.end) return nome + (pos.fora ? ' está desligado(a)' : ' ainda não abriu nada');
    return nome + (pos.eu ? ' está ' : ' está ') + onde(pos.end, pos.alvo);
  }
  function detalhe(pos) {
    var partes = [];
    if (pos.tipo === 'agente') partes.push('agente de ' + pos.dono.nome);
    if (pos.oque && pos.oque !== 'aqui') partes.push(pos.oque);
    if (pos.end && pos.end.sala) partes.push(pos.end.sala.rotulo);
    if (pos.ts && !pos.eu) partes.push(U.relativo(pos.ts));
    if (pos.fora) partes.push('desligado');
    return partes.join(' · ');
  }

  /* ======================================================================
     4. Rastro ("por onde passou")
     ====================================================================== */

  function rastro(id, max) {
    max = max || 12;
    var lista = [], e = estado(), eu = L().eu;
    if (id.indexOf('ag:') === 0) lista = paradasAgente(id.slice(3));
    else {
      if (id === eu) ((e.rastros || {})[id] || []).forEach(function (x) { lista.push({ ts: x.ts, alvo: { tipo: x.tipo, ref: x.ref, rotulo: x.rotulo, agente: x.agente }, oque: 'abriu', fonte: 'posicao' }); });
      e.demandas.forEach(function (d) { (d.historico || []).forEach(function (h) { if (h.quem === id) lista.push({ ts: h.ts, alvo: { tipo: 'demanda', ref: d.id }, oque: h.acao + (h.nota ? ' · ' + h.nota : ''), fonte: 'demanda' }); }); });
      e.arquivos.forEach(function (a) { if (a.salvoPor === id && (a.salvoEm || a.modificado)) lista.push({ ts: a.salvoEm || a.modificado, alvo: { tipo: 'arquivo', ref: a.id }, oque: a.salvoEm ? 'salvou' : 'mexeu por último', fonte: 'arquivo' }); });
      L().minhasConversas(eu).forEach(function (c) {
        if (c.tipo === 'direta' && (c.membros || []).indexOf(id) === -1) return;
        var ms = (e.mensagens[c.id] || []).filter(function (m) { return m.pessoa === id; }), m = ms[ms.length - 1];
        if (m) lista.push({ ts: m.ts, alvo: { tipo: 'chat', ref: c.id }, oque: 'escreveu: ' + String(m.texto).slice(0, 60), fonte: 'chat' });
      });
      if (e.transmissao[id] !== false) ((e.terminais || {})[id] || []).forEach(function (l) { if (!l.agente && (l.tipo === 'cmd' || l.tipo === 'prompt') && !l.por) lista.push({ ts: l.ts, alvo: { tipo: 'terminal', ref: id }, oque: String(l.texto).slice(0, 70), fonte: 'terminal' }); });
      (trocasFazendo[id] || []).forEach(function (x) { var al = alvoDoFazendo(id, x.texto); lista.push({ ts: x.ts, alvo: al, oque: al.oque || x.texto, fonte: 'fazendo' }); });
    }
    lista.sort(function (a, b) { return b.ts - a.ts; });
    /* a posição de agora abre o rastro quando é mais nova que a última parada */
    var pos = posicao(id);
    if (pos && pos.end && pos.ts && (!lista.length || pos.ts > lista[0].ts)) lista.unshift({ ts: pos.ts, alvo: pos.alvo, oque: pos.oque === 'aqui' ? 'está aqui agora' : (pos.oque || 'está') + ' agora', fonte: 'agora' });
    /* paradas seguidas no mesmo objeto viram uma só */
    var r = [];
    lista.forEach(function (x) {
      x.end = enderecar(x.alvo);
      if (!x.end) return;
      var ant = r[r.length - 1];
      if (ant && ant.end.chave === x.end.chave) { if (ant.mais < 2 && ant.oque.indexOf(x.oque) === -1) { ant.oque += ' · ' + x.oque; ant.mais++; } return; }
      x.mais = 0;
      r.push(x);
    });
    return r.slice(0, max).map(function (x) { x.luz = luzDe(x.ts, MV_PRESENCA); return x; });
  }

  /* ======================================================================
     5. Luz (meia-vida) sem laço em repouso: data-end-t + data-end-mv → --luz
     ====================================================================== */

  var chegadas = {};   /* pessoa → ts (chegou no meu objeto) */
  var luzGente = {};   /* pessoa → ts (mudou de sala: acende a linha na planta) */
  var fuiAte = null;   /* { id, ts }: eu fui até alguém */
  var ticker = null;
  function aplicarLuzes(raiz) {
    var agora = Date.now(), vivos = 0;
    (raiz || document).querySelectorAll('[data-end-t]').forEach(function (el) {
      var t = +el.getAttribute('data-end-t'), mv = +el.getAttribute('data-end-mv') || MV_CHEGADA, l = Math.pow(2, -(agora - t) / mv);
      if (l < 0.05) { l = 0; el.removeAttribute('data-end-t'); } else vivos++; /* abaixo de 5 % não se vê: a luz apagou */
      el.style.setProperty('--luz', degraus(l).toFixed(3));
    });
    return vivos;
  }
  function ligarTicker() {
    if (ticker || !aplicarLuzes()) return;
    ticker = setInterval(function () {
      if (document.hidden) return; /* aba oculta: o laço não trabalha */
      if (!aplicarLuzes()) { clearInterval(ticker); ticker = null; }
    }, 250);
  }
  function attrLuz(ts, mv) { return ts && Date.now() - ts < (mv || MV_CHEGADA) * 4.4 ? ' data-end-t="' + ts + '" data-end-mv="' + (mv || MV_CHEGADA) + '"' : ''; }

  /* ======================================================================
     6. Desenho: anéis, cabeçalho, planta, rastro, paleta
     ====================================================================== */

  function corSegura(c) { c = String(c || ''); return /^#[0-9a-f]{3,8}$/i.test(c) || /^var\(--[a-z0-9-]+\)$/.test(c) || /^(rgb|hsl|oklch)a?\([0-9.,%\s\/-]+\)$/i.test(c) ? c : 'var(--t0)'; }
  function iniciais(pos) { return pos.tipo === 'agente' ? pos.nome.slice(0, 1).toUpperCase() : pos.nome.slice(0, 2).toUpperCase(); }
  function anel(pos, tam, luzTs, clicavel) {
    var foto = pos.tipo === 'pessoa' && pos.pessoa.foto, pres = pos.eu ? 1 : pos.ts ? luzDe(pos.ts) : 0.5, txt = frase(pos) + (detalhe(pos) ? ' · ' + detalhe(pos) : '');
    return '<span class="end-anel' + (pos.tipo === 'agente' ? ' agente' : '') + (pos.fora ? ' fora' : '') + (pos.estado === 'pensando' ? ' pensando' : '') + '" data-end-pessoa="' + esc(pos.id) + '"' + attrLuz(luzTs) +
      ' style="--cor:' + esc(corSegura(pos.cor)) + ';--pres:' + degraus(pres).toFixed(2) + (tam ? ';--tam:' + tam + 'px' : '') + '" title="' + esc(txt) + (clicavel ? ' · clique: por onde passou' : '') + '"' + (clicavel ? ' role="button" tabindex="0" data-acao="end-rastro" data-id="' + esc(pos.id) + '"' : ' role="img"') + ' aria-label="' + esc(txt) + '">' +
      (foto ? '<img src="' + esc(foto) + '" alt="">' : esc(iniciais(pos))) + '</span>';
  }
  /* 1 ou 2 = anéis sobrepostos −4 px; 3+ = um anel + "+N" (CONCEITO §2, lei 2) */
  function aneis(lista, tam, luzDeId, clicavel) {
    if (!lista.length) return '';
    var mostrar = lista.length <= 2 ? lista : lista.slice(0, 1);
    return '<span class="end-aneis">' + mostrar.map(function (p) { return anel(p, tam, luzDeId ? luzDeId(p.id) : null, clicavel); }).join('') +
      (lista.length > 2 ? '<span class="end-mais" title="' + esc(lista.map(function (p) { return p.nome; }).join(', ')) + '">+' + (lista.length - 1) + '</span>' : '') + '</span>';
  }
  function nomesJuntos(lista) {
    var n = lista.map(function (p) { return p.nome; });
    if (n.length === 1) return n[0] + ' está aqui';
    if (n.length === 2) return n[0] + ' e ' + n[1] + ' estão aqui';
    return n[0] + ', ' + n[1] + ' e mais ' + (n.length - 2) + ' estão aqui';
  }
  var PINO = '<svg class="end-pino" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="7" r="4.6" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="7" r="1.4" fill="currentColor"/><path d="M8 11.6V15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

  /* o glifo da sala vem da família de ícones (icones.js) quando ela existe */
  function glifo(sala, tam) {
    var I = BC.icones;
    if (!I || !I.tem || !sala) return '';
    var nome = sala.tipo === 'projeto' ? 'projetos' : sala.ir && sala.ir.ref === 'explorador' ? 'criar' : sala.ir ? sala.ir.ref : '';
    return nome && I.tem(nome) ? I.svg(nome, tam || 14) : '';
  }

  var atual = null; /* o endereço desenhado agora no cabeçalho */
  function htmlCabecalho(tab) {
    var end = enderecar(alvoDaAba(tab));
    atual = end;
    if (!end) return '';
    var aqui = quemEsta(end.chave), agora = Date.now();
    var chegou = aqui.filter(function (p) { return chegadas[p.id] && agora - chegadas[p.id] < 9000; }).sort(function (a, b) { return chegadas[b.id] - chegadas[a.id]; })[0];
    var fui = fuiAte && agora - fuiAte.ts < 9000 && aqui.some(function (p) { return p.id === fuiAte.id; }) ? fuiAte : null;
    var partes = end.partes.map(function (p, i) {
      var ult = i === end.partes.length - 1;
      return (i ? '<span class="end-sep" aria-hidden="true">›</span>' : '') +
        '<button type="button" class="end-parte end-p-' + p.nivel + '" data-acao="end-parte" data-i="' + i + '"' + (ult ? ' aria-current="location"' : '') +
        ' title="' + esc(p.nivel === 'sala' ? 'Ir para a sala ' + p.rotulo : p.nivel === 'bancada' ? 'Abrir a bancada ' + p.rotulo : 'Copiar o endereço') + '">' + (p.nivel === 'sala' ? glifo(p, 14) : '') + '<span>' + esc(p.rotulo) + '</span></button>';
    }).join('');
    var aviso = chegou ? '<span class="end-chegou"' + attrLuz(chegadas[chegou.id]) + '>' + esc(chegou.nome) + ' chegou · ' + U.hora(chegadas[chegou.id]) + '</span>'
      : fui ? '<span class="end-chegou"' + attrLuz(fui.ts) + '>você chegou onde ' + esc(fui.nome) + ' está</span>' : '';
    return '<div class="end-trilha" role="navigation" aria-label="Endereço: ' + esc(end.texto) + '">' + PINO + partes + '</div>' +
      '<div class="end-aqui">' + aviso + (aqui.length ? aneis(aqui, 18, function (id) { return chegadas[id] || (fui && fui.id === id ? fui.ts : null); }, true) + '<span class="end-aqui-txt">' + esc(nomesJuntos(aqui)) + '</span>' : '') +
      '<button type="button" class="end-onde" data-acao="end-onde" title="Onde estão · Ctrl K">onde estão?</button></div>' +
      '<span class="end-vivo" aria-live="polite">' + (chegou ? esc(chegou.nome + ' chegou em ' + end.rotulo) : '') + '</span>';
  }

  /* a planta da sala: salas = projetos (sempre) + atividades com gente; quem está desligado fica fora */
  function salas() {
    var eu = L().eu, mapa = {}, ordem = [], fora = [], minha = null;
    projetos().forEach(function (pj) { var s = salaProjeto(pj); mapa[s.id] = { sala: s, gente: [] }; ordem.push(s.id); });
    todas().forEach(function (pos) {
      if (pos.tipo === 'agente' && (!recente(pos) || pos.fora)) return;
      if (pos.fora || !pos.end) { if (pos.tipo === 'pessoa') fora.push(pos); return; }
      var s = pos.end.sala;
      if (!mapa[s.id]) { mapa[s.id] = { sala: s, gente: [] }; ordem.push(s.id); }
      mapa[s.id].gente.push(pos);
      if (pos.eu) minha = s.id;
    });
    var lista = ordem.map(function (k) { var x = mapa[k]; x.minha = k === minha; return x; });
    var pjs = lista.filter(function (x) { return x.sala.tipo === 'projeto'; }), ats = lista.filter(function (x) { return x.sala.tipo !== 'projeto' && x.gente.length; });
    ats.sort(function (a, b) { return b.gente.length - a.gente.length; });
    lista = pjs.concat(ats);
    lista.forEach(function (x) { x.gente.sort(function (a, b) { return (b.eu ? 1 : 0) - (a.eu ? 1 : 0) || (a.tipo === 'agente') - (b.tipo === 'agente') || (b.ts || 0) - (a.ts || 0); }); });
    return { salas: lista, fora: fora, presentes: todas().filter(function (p) { return p.tipo === 'pessoa' && !p.fora && p.end; }).length };
  }
  function linhaGente(pos) {
    var nome = pos.eu ? 'você' : pos.nome + (pos.tipo === 'agente' ? ' · agente de ' + pos.dono.nome : '');
    return '<li class="end-gente' + (pos.eu ? ' eu' : '') + (pos.tipo === 'agente' ? ' agente' : '') + '" data-end-pessoa="' + esc(pos.id) + '"' + attrLuz(luzGente[pos.id] || chegadas[pos.id]) + '>' +
      '<button type="button" class="end-gente-nome" data-acao="end-rastro" data-id="' + esc(pos.id) + '" title="Por onde passou · ' + esc(nome) + '">' + anel(pos, 18) +
      '<span class="end-gente-txt"><b>' + esc(nome) + '</b><small>' + esc(acao(pos)) + '</small></span></button>' +
      (pos.eu ? '' : '<button type="button" class="end-ir" data-acao="end-ir-ate" data-id="' + esc(pos.id) + '" title="Ir até ' + esc(pos.nome) + '" aria-label="Ir até ' + esc(pos.nome) + '">' +
        '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>') + '</li>';
  }
  function htmlPlanta() {
    var s = salas();
    return '<section class="end-planta" aria-label="Planta da sala">' +
      '<div class="lat-titulo end-planta-cab"><span class="rotulo">Planta da sala</span><span class="end-planta-conta">' + s.presentes + ' ' + (s.presentes === 1 ? 'presente' : 'presentes') + '</span></div>' +
      '<div class="end-salas">' + s.salas.map(function (x) {
        var pessoas = x.gente.filter(function (p) { return p.tipo === 'pessoa'; }).length;
        return '<div class="end-sala ' + x.sala.tipo + (x.minha ? ' minha' : '') + (x.gente.length ? '' : ' vazia') + '" data-end-sala="' + esc(x.sala.id) + '">' +
          '<button type="button" class="end-sala-cab" data-acao="end-sala" data-id="' + esc(x.sala.id) + '" title="Entrar na sala ' + esc(x.sala.rotulo) + '">' + glifo(x.sala, 14) + '<span class="end-sala-nome">' + esc(x.sala.rotulo) + '</span><span class="num">' + (pessoas || '') + '</span></button>' +
          (x.gente.length ? '<ul class="end-gente-lista">' + x.gente.map(linhaGente).join('') + '</ul>' : '<p class="end-vazia">ninguém agora</p>') + '</div>';
      }).join('') + '</div>' +
      (s.fora.length ? '<div class="end-fora" title="Desligados: a posição volta quando a pessoa abrir a Estação">' + aneis(s.fora, 16) + '<span>' + esc(s.fora.map(function (p) { return p.nome; }).join(', ')) + ' · fora da sala</span></div>' : '') +
      '<p class="lat-nota end-planta-nota">Clique numa pessoa para ver por onde passou; → vai até onde ela está.</p></section>';
  }

  /* rastro em balão de vidro (superfície viva) */
  var pop = { el: null, id: null, paradas: [], timer: null, ancora: null };
  function htmlRastro(id) {
    var pos = posicao(id);
    if (!pos) return '';
    var ps = rastro(id, 12), eu = L().eu, ehAgente = id.indexOf('ag:') === 0;
    pop.paradas = ps;
    var nome = pos.eu ? 'Você' : pos.nome, sub = ehAgente ? 'agente de ' + pos.dono.nome + ' · cada passo' : pos.eu ? 'seu rastro de hoje' : 'o que já é público: salvou, demandas, canais, terminal ao vivo';
    return '<div class="end-pop-cab">' + anel(pos, 26) + '<div class="end-pop-tit"><b>' + esc(nome) + ' · por onde passou</b><small>' + esc(sub) + '</small></div>' +
      '<button type="button" class="end-pop-x" data-acao="end-pop-fechar" aria-label="Fechar">✕</button></div>' +
      '<div class="end-pop-agora"><span>' + esc(pos.end ? (ehAgente && pos.oque !== 'pensando' && pos.oque !== 'navegando' ? 'por último ' : 'agora ') + onde(pos.end, pos.alvo) + ' · ' + pos.end.sala.rotulo : frase(pos)) + '</span>' +
      (!pos.eu && pos.end ? '<button type="button" class="botao end-pop-ir" data-acao="end-ir-ate" data-id="' + esc(id) + '">Ir até ' + esc(pos.nome) + '</button>' : '') + '</div>' +
      (ps.length ? '<ol class="end-paradas">' + ps.map(function (x, i) {
        return '<li class="end-parada" style="--luz:' + degraus(x.luz).toFixed(3) + ';--marca:' + marcaTempo(x.ts) + '">' +
          '<time datetime="' + new Date(x.ts).toISOString() + '">' + (U.mesmoDia(x.ts) ? U.hora(x.ts) : U.quando(x.ts)) + '</time><span class="end-no" aria-hidden="true"></span>' +
          '<div><button type="button" class="end-parada-ir" data-acao="end-parada" data-i="' + i + '" title="Abrir ' + esc(x.end.texto) + '">' + esc(x.end.texto) + '</button>' +
          '<small>' + esc(x.oque) + (x.resultado ? ' → ' + esc(String(x.resultado).slice(0, 90)) : '') + '</small></div></li>';
      }).join('') + '</ol>' : '<p class="end-pop-vazio">Nenhuma parada ainda hoje.</p>') +
      '<p class="end-pop-pe">' + ps.length + (ps.length === 1 ? ' parada' : ' paradas') + ' · a luz esfria pela metade a cada 5 min · nunca ranking</p>';
  }
  function posicionarPop() {
    var el = pop.el;
    if (!el) return;
    var w = el.offsetWidth || 340, h = el.offsetHeight || 300, vw = window.innerWidth, vh = window.innerHeight, x, y;
    var r = pop.ancora && pop.ancora.isConnected ? pop.ancora.getBoundingClientRect() : null;
    if (r && r.width) { x = r.right + 8; y = r.top - 8; if (x + w > vw - 16) x = Math.max(16, r.left - w - 8); if (x < 16) { x = Math.max(16, Math.min(vw - w - 16, r.left)); y = r.bottom + 6; } }
    else { x = (vw - w) / 2; y = Math.max(48, vh * 0.14); }
    y = Math.max(16, Math.min(vh - h - 16, y));
    el.style.left = Math.round(x) + 'px';
    el.style.top = Math.round(y) + 'px';
  }
  function mostrarRastro(id, ancora) {
    var raiz = $('vista-estacao');
    if (!raiz || !posicao(id)) return false;
    if (!pop.el || !pop.el.isConnected) {
      pop.el = document.createElement('div');
      pop.el.className = 'end-pop';
      pop.el.id = 'end-pop';
      pop.el.setAttribute('role', 'dialog');
      raiz.appendChild(pop.el);
    }
    pop.id = id;
    pop.ancora = ancora || null;
    pop.el.setAttribute('aria-label', 'Por onde passou · ' + (posicao(id).nome || ''));
    pop.el.innerHTML = htmlRastro(id);
    pop.el.hidden = false;
    posicionarPop();
    clearInterval(pop.timer);
    pop.timer = setInterval(function () { if (!document.hidden && pop.id) atualizarPop(); }, 10000); /* a luz do rastro esfria devagar: 10 s basta */
    var o = O();
    if (o && !reduzido()) o.respirar(pop.el, { duracao: 900 });
    var x = pop.el.querySelector('.end-pop-x');
    if (x) x.focus({ preventScroll: true });
    return true;
  }
  function atualizarPop() {
    if (!pop.el || pop.el.hidden || !pop.id) return;
    var h = htmlRastro(pop.id);
    if (h && pop.el.innerHTML !== h) pop.el.innerHTML = h;
  }
  function fecharPop() {
    if (!pop.el || pop.el.hidden) return false;
    pop.el.hidden = true;
    pop.id = null;
    clearInterval(pop.timer);
    pop.timer = null;
    return true;
  }

  /* ======================================================================
     7. Ir até: abre o objeto onde a pessoa (ou o agente) está
     ====================================================================== */

  function abrirAlvo(alvo, quem) {
    var E = EST();
    if (!alvo || !E) return false;
    switch (alvo.tipo) {
      case 'arquivo': if (!L().arquivo(alvo.ref)) return false; BC.explorador.abrirArquivo(alvo.ref); return true;
      case 'maquina': if (!BC.maquina) return false; BC.maquina.abrir(alvo.ref); return true;
      case 'demanda': if (!L().demanda(alvo.ref)) return false; A['abrir-demanda']({ dataset: { id: alvo.ref } }); return true;
      case 'chat': E.ui.canal = alvo.ref; E.abrirAba({ id: 'chat', tipo: 'chat', atividade: 'chat' }); return true;
      case 'navegador':
        var s = BC.navegador && BC.navegador.sessoes ? BC.navegador.sessoes[alvo.ref] : null, info = agenteInfo(alvo.ref);
        if (s) { E.abrirAba({ id: 'nav:' + alvo.ref, tipo: 'navegador', ref: alvo.ref, titulo: 'Navegador · ' + s.agente.nome, atividade: 'terminais' }); return true; }
        if (!info) return false;
        E.ui.termPessoa = info.dono.id; E.ui.termAgente = alvo.ref; E.abrir('terminais'); return true;
      case 'terminal': case 'site': E.ui.termPessoa = alvo.ref || quem || null; E.ui.termAgente = alvo.agente || null; E.abrir('terminais'); return true;
      case 'projeto': if (!projeto(alvo.ref)) return false; E.abrirProjeto(alvo.ref); return true;
      case 'perfil': E.abrirPerfil(alvo.ref); return true;
      case 'tarefa': if (!L().tarefa(alvo.ref)) return false; A['abrir-tarefa']({ dataset: { id: alvo.ref } }); return true;
      case 'atividade': if (alvo.ref === 'explorador') E.abrirAba({ id: 'explorador', tipo: 'explorador' }); else E.abrir(alvo.ref); return true;
      default:
        if (quem && quem.indexOf('ag:') !== 0) { E.ui.termPessoa = quem; E.abrir('terminais'); return true; }
        return false;
    }
  }

  function irAte(id, origem) {
    var pos = posicao(id), E = EST();
    if (!pos || !E) return false;
    if (!pos.end || pos.fora) { E.aviso(pos.nome + (pos.fora ? ' está desligado(a): a posição volta quando abrir a Estação.' : ' não está em nenhum objeto agora.')); return false; }
    if (pos.eu) { E.aviso('Você já está aqui: ' + pos.end.texto + '.'); return false; }
    var alvo = pos.alvo, quem = pos.tipo === 'agente' ? pos.dono.id : id;
    if (!abrirAlvo(alvo, quem)) { E.aviso('Não deu para abrir ' + pos.end.rotulo + '.'); return false; }
    fuiAte = { id: id, ts: Date.now(), nome: pos.nome };
    E.render();
    /* luz dirigida: da origem (item clicado, planta ou paleta) até o anel de quem está aqui */
    var nav = $('e-endereco'), alvoEl = nav && (nav.querySelector('[data-end-pessoa="' + CSS.escape(id) + '"]') || nav.querySelector('.end-p-peca'));
    efeitoChegada(origem, alvoEl, nav, 'tique');
    aplicarLuzes(nav); ligarTicker();
    return true;
  }
  function irAtePorNome(texto) {
    var n = U.normalizar(texto).replace(/^(o|a)\s+/, '').trim();
    if (!n) return false;
    var achado = todas().filter(function (p) { return p.id !== L().eu && U.normalizar(p.nome).indexOf(n) === 0; })
      .sort(function (a, b) { return (a.tipo === 'agente') - (b.tipo === 'agente') || (a.fora - b.fora); })[0];
    if (!achado) { setTimeout(function () { EST().aviso('Ninguém com o nome "' + texto + '" na sala.'); }, 0); return false; }
    return irAte(achado.id);
  }

  /* pulso roxo → ciano + faíscas + som suave (BC.organismo) ou só a classe CSS */
  function efeitoChegada(origem, alvoEl, nav, somNome) {
    var o = O();
    if (!alvoEl) return;
    if (o) {
      var de = origem && (origem.nodeType === 1 ? (origem.isConnected ? origem : null) : origem);
      if (!de && nav) { var r = nav.getBoundingClientRect(); de = { x: r.left + 24, y: r.top + r.height / 2 }; }
      o.pulso(de, alvoEl, { cor: 'marca', aoChegar: function () { o.faiscas(alvoEl, 5, false, { onde: 'centro' }); } });
      o.som(somNome || 'acordar');
    } else if (nav && !reduzido()) {
      nav.classList.remove('end-chegada'); void nav.offsetWidth; nav.classList.add('end-chegada');
      setTimeout(function () { nav.classList.remove('end-chegada'); }, 1400);
    }
  }

  /* ======================================================================
     8. Chegada: alguém entrou no mesmo objeto que você
     ====================================================================== */

  var antes = null, antesEu = null, antesSala = {};
  function detectar() {
    var eu = L().eu, minha = minhaChave(), agora = {}, sala = {}, novos = [], mudouSala = [];
    todas().forEach(function (pos) {
      if (pos.id === eu || !pos.chave || pos.fora || !recente(pos) || (pos.tipo === 'agente' && pos.dono.id === eu)) return;
      agora[pos.id] = pos.chave;
      sala[pos.id] = pos.end.sala.id;
      if (antes && antesEu === eu && minha && pos.chave === minha && antes[pos.id] !== minha) novos.push(pos.id);
      if (antes && antesSala[pos.id] && antesSala[pos.id] !== sala[pos.id]) mudouSala.push(pos.id);
    });
    antes = agora; antesEu = eu; antesSala = sala;
    var t = Date.now();
    mudouSala.forEach(function (id) { luzGente[id] = t; });
    novos.forEach(function (id) { chegadas[id] = t; });
    if (!novos.length && !mudouSala.length) return;
    var E = EST();
    if (E && novos.length) {
      renderCabecalho(E.abaAtual());
      var nav = $('e-endereco'), id = novos[0], alvoEl = nav && nav.querySelector('[data-end-pessoa="' + CSS.escape(id) + '"]');
      var origem = document.querySelector('#e-lateral [data-end-pessoa="' + CSS.escape(id) + '"]') || document.querySelector('#e-lateral .arv-arq.aberto') || null;
      efeitoChegada(origem, alvoEl, nav, 'acordar');
    }
    if (mudouSala.length) { var lat = $('e-lateral'); if (lat && lat.querySelector('.end-planta')) { var h = htmlPlanta(), p = lat.querySelector('.end-planta'); if (p.outerHTML !== h) p.outerHTML = h; } }
    aplicarLuzes(); ligarTicker();
  }

  /* ======================================================================
     9. A posição de quem usa esta janela (o objeto aberto no meio)
     ====================================================================== */

  var reg = { chave: null, timer: null };
  function registrar(tab) {
    var alvo = alvoDaAba(tab);
    if (!alvo) return;
    var ch = chaveDe(alvo), eu = L().eu, ps = (estado().posicoes || {})[eu];
    if (ps && ps.chave === ch) { reg.chave = ch; clearTimeout(reg.timer); reg.timer = null; return; }
    if (reg.chave === ch && reg.timer) return;
    reg.chave = ch;
    clearTimeout(reg.timer);
    /* 700 ms parado no objeto: folhear abas depressa não vira posição */
    reg.timer = setTimeout(function () {
      reg.timer = null;
      var E = EST(), agoraAlvo = E ? alvoDaAba(E.abaAtual()) : null;
      if (!agoraAlvo || chaveDe(agoraAlvo) !== ch || L().eu !== eu) return;
      var end = enderecar(agoraAlvo), dado = { chave: ch, tipo: agoraAlvo.tipo, ref: agoraAlvo.ref != null ? agoraAlvo.ref : null, rotulo: end ? end.rotulo : '', sala: end ? end.sala.rotulo : '' };
      if (agoraAlvo.agente) dado.agente = agoraAlvo.agente;
      L().fazer('posicao', dado, Date.now());
    }, 700);
  }

  /* a ação (vale para esta janela, para a TV pelo canal e, no app, para o diário e as outras Estações) */
  L().A.posicao = function (quem, alvo, ts) {
    if (!alvo || !alvo.chave || !L().pessoa(quem)) return;
    var e = estado(), t = +ts || Date.now();
    e.posicoes = e.posicoes || {};
    e.rastros = e.rastros || {};
    var ant = e.posicoes[quem];
    if (ant && ant.chave === alvo.chave && ant.ts >= t) return;
    var p = { chave: String(alvo.chave).slice(0, 160), tipo: String(alvo.tipo || ''), ref: alvo.ref != null ? alvo.ref : null, rotulo: String(alvo.rotulo || '').slice(0, 80), sala: String(alvo.sala || '').slice(0, 60), ts: t };
    if (alvo.agente) p.agente = alvo.agente;
    e.posicoes[quem] = p;
    var r = e.rastros[quem] || (e.rastros[quem] = []);
    if (!r.length || r[r.length - 1].chave !== p.chave) r.push(p);
    if (r.length > 40) r.splice(0, r.length - 40);
    return [];
  };

  /* ======================================================================
     10. Ações (cliques)
     ====================================================================== */

  /* luz na lateral: a lateral se redesenha a cada mudança, então a luz fica guardada por seletor e volta a cada desenho */
  var luzesSel = [];
  function reacenderLateral(lat) {
    if (!lat) return;
    var agora = Date.now();
    luzesSel = luzesSel.filter(function (x) { return agora - x.ts < x.mv * 4.4; });
    luzesSel.forEach(function (x) { var el = lat.querySelector(x.sel); if (el) { el.setAttribute('data-end-t', x.ts); el.setAttribute('data-end-mv', x.mv); } });
  }
  function luzNaLateral(seletor) {
    luzesSel = luzesSel.filter(function (x) { return x.sel !== seletor; });
    luzesSel.push({ sel: seletor, ts: Date.now(), mv: MV_CHEGADA });
    setTimeout(function () {
      var lat = $('e-lateral'), el = lat && lat.querySelector(seletor);
      if (!el) return;
      try { el.scrollIntoView({ block: 'nearest' }); } catch (e) { /* segue */ }
      reacenderLateral(lat);
      aplicarLuzes(lat); ligarTicker();
    }, 30);
  }
  function irParte(ir, el) {
    var E = EST();
    if (!ir || !E) return;
    if (ir.tipo === 'projeto') E.abrirProjeto(ir.ref);
    else if (ir.tipo === 'atividade') { if (ir.ref === 'explorador') E.abrirAba({ id: 'explorador', tipo: 'explorador' }); else E.abrir(ir.ref); }
    else if (ir.tipo === 'bancada-projeto') {
      E.ui.projetoAtivo = ir.ref; E.ui.abertas[ir.dono] = true; E.ui.filtroArq = '';
      if (!E.ui.lat) E.alternarLateral(true);
      E.render();
      luzNaLateral(ir.arquivo ? '.arv-arq[data-id="' + CSS.escape(ir.arquivo) + '"]' : '.arv-juntos');
    } else if (ir.tipo === 'pasta') {
      E.ui.projetoAtivo = null; E.ui.filtroArq = '';
      var ps = ir.ref.split('/');
      ps.forEach(function (x, i) { E.ui.abertas[ps.slice(0, i + 1).join('/')] = true; });
      if (!E.ui.lat) E.alternarLateral(true);
      E.render();
      luzNaLateral(ir.arquivo ? '.arv-arq[data-id="' + CSS.escape(ir.arquivo) + '"]' : '.arv-pasta[data-caminho="' + CSS.escape(ir.ref) + '"]');
    } else if (ir.tipo === 'maquina') { var m = BC.maquina && BC.maquina.maquinas && BC.maquina.maquinas[ir.ref]; if (m) m.sel = null; if (BC.maquina) BC.maquina.abrir(ir.ref); E.render(); }
    else if (ir.tipo === 'demandas') { if (ir.filtro) E.ui.filtroDem = ir.filtro; E.abrir('demandas'); }
    else if (ir.tipo === 'lateral') { if (!E.ui.lat) E.alternarLateral(true); E.render(); luzNaLateral('.lat-titulo'); }
    else if (ir.tipo === 'terminal') { E.ui.termPessoa = ir.ref || null; E.abrir('terminais'); }
    else if (ir.tipo === 'copiar' && atual) {
      var texto = atual.texto;
      try { if (navigator.clipboard) navigator.clipboard.writeText(texto).catch(function () { /* sem área de transferência */ }); } catch (e) { /* segue */ }
      E.aviso('Endereço copiado: ' + texto);
      if (el) { var o = O(); if (o) o.acender(el, MV_CHEGADA); else { el.setAttribute('data-end-t', Date.now()); ligarTicker(); } }
    }
  }
  A['end-parte'] = function (el) { if (atual) irParte(atual.partes[+el.dataset.i] && atual.partes[+el.dataset.i].ir, el); };
  A['end-ir-ate'] = function (el, ev) { if (ev) ev.stopPropagation(); fecharPop(); irAte(el.dataset.id, el); };
  A['end-rastro'] = function (el) { if (pop.id === el.dataset.id && pop.el && !pop.el.hidden) { fecharPop(); return; } mostrarRastro(el.dataset.id, el); };
  A['end-pop-fechar'] = function () { fecharPop(); };
  A['end-parada'] = function (el) {
    var x = pop.paradas[+el.dataset.i];
    if (!x) return;
    var quem = pop.id;
    fecharPop();
    if (!abrirAlvo(x.alvo, quem && quem.indexOf('ag:') === 0 ? (agenteInfo(quem.slice(3)) || { dono: { id: null } }).dono.id : quem)) EST().aviso('Esse objeto não existe mais: ' + x.end.texto + '.');
  };
  A['end-sala'] = function (el) {
    var id = el.dataset.id || '';
    if (id.indexOf('pj:') === 0) EST().abrirProjeto(id.slice(3));
    else if (id.indexOf('at:') === 0) abrirAlvo({ tipo: 'atividade', ref: id.slice(3) });
  };
  A['end-onde'] = function () {
    var E = EST();
    E.abrirPaleta();
    var i = $('paleta-entrada');
    if (i) { i.value = 'onde '; i.dispatchEvent(new Event('input', { bubbles: true })); }
  };

  /* ======================================================================
     11. Paleta Ctrl K: grupo "Onde estão", o verbo "Ir até" e "Por onde passou"
     ====================================================================== */

  function comandos(bruto) {
    var q = U.normalizar(bruto || '').trim(), eu = L().eu, r = [];
    var m = /^(onde\s*(e|esta|estao|anda|andam|fica)?|cade|ir\s+ate|va\s+ate|vai\s+ate|leva\s+ate|me\s+leva\s+ate)\b\s*(o|a|os|as)?\s*(.*)$/.exec(q);
    var alvoNome = m ? m[4].replace(/[?!.,]/g, '').trim() : null;
    var gente = todas().filter(function (p) { return p.id !== eu && (p.tipo === 'pessoa' || recente(p) || (alvoNome && U.normalizar(p.nome).indexOf(alvoNome) === 0)); });
    gente.sort(function (a, b) { return (a.fora - b.fora) || (!a.end - !b.end) || (a.tipo === 'agente') - (b.tipo === 'agente') || ((b.ts || 0) - (a.ts || 0)); });
    var lista = gente.map(function (pos) {
      var nome = pos.nome + (pos.tipo === 'agente' ? ' (agente de ' + pos.dono.nome + ')' : ''), txt = acao(pos);
      var casa = alvoNome == null ? null : alvoNome === '' || U.normalizar(pos.nome).indexOf(alvoNome) === 0 || U.normalizar(nome).indexOf(alvoNome) !== -1;
      return {
        nome: 'Onde está ' + nome + ' · ' + txt + (pos.end ? ' · ' + pos.end.sala.rotulo + ' · Ir até ' + pos.nome : ''),
        html: '<span class="paleta-onde">' + anel(pos, 18) + '<span class="paleta-onde-txt"><b>' + esc(nome) + '</b><small>' + esc(txt) + (pos.end ? ' · ' + esc(pos.end.sala.rotulo) : '') + (pos.ts && !pos.fora ? ' · ' + esc(U.relativo(pos.ts)) : '') + '</small></span></span>',
        grupo: 'Onde estão', atalho: pos.end && !pos.fora ? 'Ir até' : '', fixo: casa === true, id: pos.id,
        fn: function () { var E = EST(), o = E && E.ui.paletaOrigem; if (E) E.ui.paletaOrigem = null; irAte(pos.id, o || null); }
      };
    }).filter(function (c) { return alvoNome == null || c.fixo; });
    if (!q) lista = lista.filter(function (c) { return c.atalho; }).slice(0, 4);
    r = r.concat(lista);
    /* vem antes dos outros comandos quando a busca é vazia, é "onde…/ir até…" ou começa pelo nome de alguém */
    r.primeiro = !q || !!m || /^(por onde|rastro)/.test(q) || todas().some(function (p) { return U.normalizar(p.nome).indexOf(q) === 0; });
    if (q && !m) {
      r.push({ nome: 'Ir até… (pessoa ou agente)', grupo: 'Onde estão', pede: 'Ir até quem? (nome da pessoa ou do agente)', fn: function (t) { irAtePorNome(t); } });
    }
    if (q) {
      var pq = /^(por onde|rastro|passou)/.test(q);
      gente.filter(function (p) { return p.tipo === 'agente' ? paradasAgente(p.agente.id).length : true; }).concat([posicaoPessoa(eu)]).forEach(function (pos) {
        if (!pos) return;
        var nome = pos.eu ? 'você' : pos.nome + (pos.tipo === 'agente' ? ' (agente de ' + pos.dono.nome + ')' : '');
        r.push({ nome: 'Por onde passou: ' + nome, grupo: 'Por onde passou', atalho: 'rastro', fixo: pq && (q.replace(/^(por onde passou|por onde|rastro|passou)\s*:?\s*(o|a)?\s*/, '') === '' || U.normalizar(nome).indexOf(q.replace(/^(por onde passou|por onde|rastro|passou)\s*:?\s*(o|a)?\s*/, '')) !== -1),
          fn: function () { mostrarRastro(pos.id); } });
      });
    }
    return r;
  }

  /* ======================================================================
     12. Estilo (injetado: o index.html não muda) · design 2030, tokens de tokens.css
     ====================================================================== */

  var CSS_ENDERECO = [
    /* cabeçalho do objeto: endereço + quem está com ele */
    '.e-endereco{position:relative;flex:none;display:flex;align-items:center;gap:12px;min-height:36px;padding:0 12px 0 10px;background:var(--s1);border-bottom:1px solid var(--linha-fraca);overflow:hidden;isolation:isolate}',
    '.e-endereco[hidden]{display:none}',
    '.e-endereco::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:1px;background:linear-gradient(90deg,var(--t2),var(--t0) 55%,transparent);opacity:calc(var(--luz,0) * .9);pointer-events:none}',
    /* a trilha encolhe da sala para a peça: sala e bancada ganham reticências, a peça (o objeto) fica inteira */
    '.end-trilha{display:flex;align-items:center;gap:2px;min-width:0;flex:1 1 auto;overflow:hidden;white-space:nowrap}',
    '.end-pino{flex:none;width:16px;height:16px;margin-right:4px;color:var(--casca-fraco,var(--apagado))}',
    '.end-parte{position:relative;flex:0 1 auto;min-width:0;display:inline-flex;align-items:center;height:26px;padding:0 6px;border:0;border-radius:var(--r-chip,4px);background:none;color:var(--casca-fraco,var(--apagado));font:400 var(--t-125,12.5px)/1 var(--fonte-mono);cursor:pointer;transition:color var(--mov-toque,120ms) var(--ease-saida),background-color var(--mov-toque,120ms) var(--ease-saida)}',
    '.end-parte:hover{background:var(--s3);color:var(--texto)}',
    '.end-parte svg,.end-sala-cab svg{flex:none;margin-right:6px;color:var(--casca-fraco,var(--apagado))}',
    '.end-sala-nome{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}',
    '.end-parte.end-p-sala{color:var(--texto-90);min-width:4.5em}',
    '.end-parte.end-p-bancada{min-width:3.5em}',
    '.end-parte.end-p-peca{flex:0 0 auto;max-width:min(52ch,62%)}',
    '.end-parte>span{min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}',
    '.end-parte.end-p-peca{color:var(--texto);font:500 var(--t-14,14px)/1 var(--fonte-ui)}',
    '.end-parte::after{content:"";position:absolute;left:6px;right:6px;bottom:2px;height:1px;background:linear-gradient(90deg,var(--t2),var(--t0));opacity:var(--luz,0);pointer-events:none}',
    '.end-sep{flex:none;color:var(--fraco);font:400 var(--t-11,11px)/1 var(--fonte-mono)}',
    '.end-aqui{flex:0 3 auto;display:flex;align-items:center;gap:8px;min-width:0;color:var(--apagado);font:400 var(--t-125,12.5px)/1 var(--fonte-ui)}',
    '.end-aqui-txt{flex:0 1 auto;min-width:0;max-width:200px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}',
    '.end-aqui:has(.end-chegou) .end-aqui-txt{display:none}',
    '.end-chegou{flex:none;font:500 var(--t-11,11px)/1 var(--fonte-mono);color:color-mix(in oklch,var(--texto-90),var(--t0) calc(var(--luz,0) * 100%));white-space:nowrap}',
    '.end-onde{flex:none;height:24px;padding:0 9px;border:1px solid var(--linha-fraca);border-radius:var(--r-pino,999px);background:none;color:var(--casca-fraco,var(--apagado));font:500 var(--t-11,11px)/1 var(--fonte-mono);cursor:pointer;transition:color var(--mov-toque,120ms),border-color var(--mov-toque,120ms)}',
    '.end-onde:hover{border-color:var(--linha);color:var(--texto)}',
    '.end-vivo{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    '.estacao.com-endereco .ed-trilha{display:none}',
    /* anéis: pessoa = círculo, agente = quadrado (raio 2) na cor do dono; presença esfria em 5 min; chegada acende 6 s */
    '.end-aneis{flex:none;display:inline-flex;align-items:center}',
    '.end-anel{--tam:18px;--cor:var(--t0);position:relative;flex:none;display:inline-grid;place-items:center;width:var(--tam);height:var(--tam);border:1.5px solid var(--cor);border-radius:50%;background:color-mix(in oklch,var(--cor) calc(var(--pres,0) * 26%),var(--s1));box-shadow:0 0 0 2px var(--s1);color:var(--texto);font:600 calc(var(--tam) * .42)/1 var(--fonte-mono);letter-spacing:0;overflow:visible}',
    '.end-anel+.end-anel{margin-left:-4px}',
    '.end-anel[role="button"]{cursor:pointer}',
    '.end-anel[role="button"]:hover{box-shadow:0 0 0 2px var(--s1),0 0 0 3px var(--cor)}',
    '.end-anel.agente{border-radius:var(--r-2,2px)}',
    '.end-anel.fora{border-style:dashed;background:var(--s1);color:var(--fraco)}',
    '.end-anel img{width:100%;height:100%;border-radius:inherit;object-fit:cover}',
    '.end-anel::after{content:"";position:absolute;inset:-4px;border-radius:inherit;box-shadow:0 0 10px 1px var(--cor),0 0 0 1px var(--cor);opacity:calc(var(--luz,0) * .85);pointer-events:none}',
    '.end-anel.pensando::before{content:"";position:absolute;inset:-3px;border-radius:inherit;border:1px dashed var(--cor);opacity:.8;animation:end-gira 1.2s linear infinite}',
    '@keyframes end-gira{to{transform:rotate(360deg)}}',
    '.end-mais{margin-left:4px;color:var(--apagado);font:500 var(--t-11,11px)/1 var(--fonte-mono)}',
    '.e-endereco.end-chegada .end-aqui .end-anel{animation:end-chega 1.2s var(--ease-heroi,cubic-bezier(.16,1,.3,1)) 1}',
    '.e-endereco.end-chegada::after{animation:end-varre 1.2s var(--ease-saida) 1}',
    '@keyframes end-chega{0%{transform:scale(.6);opacity:.2}40%{transform:scale(1.15);opacity:1}100%{transform:scale(1)}}',
    '@keyframes end-varre{0%{opacity:0;transform:scaleX(.1);transform-origin:left}35%{opacity:1}100%{opacity:0;transform:scaleX(1)}}',
    /* presença ao lado de cada arquivo na árvore */
    '.arv-linha .end-aneis{margin-left:auto;padding-left:6px}',
    '.arv-linha .end-aneis+.arv-acoes{margin-left:4px}',
    '.arv-linha:has(.end-aneis) .arv-vendo{display:none}',
    /* planta da sala (lateral de Equipe) */
    '.end-planta{padding:0 8px 6px}',
    '.end-planta-cab{display:flex;align-items:center;justify-content:space-between;padding-inline:6px}',
    '.end-planta-conta{color:var(--apagado);font:500 var(--t-11,11px)/1 var(--fonte-mono)}',
    '.end-salas{display:grid;gap:6px}',
    '.end-sala{position:relative;padding:3px 3px 5px;border:1px solid var(--linha-fraca);border-radius:var(--r-painel,8px);background:var(--s1);isolation:isolate}',
    '.end-sala.atividade{background:transparent;border-style:dashed}',
    '.end-sala.minha{border-color:rgba(63,227,255,.22);background:color-mix(in srgb,var(--s2) 72%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:0 0 22px -12px rgba(42,213,229,.55)}',
    '.end-sala.minha::after{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;background:repeating-linear-gradient(0deg,rgba(215,228,251,.035) 0 1px,transparent 1px 3px);pointer-events:none}',
    '.end-sala-cab{display:flex;align-items:center;justify-content:space-between;gap:6px;width:100%;height:26px;padding:0 6px;border:0;border-radius:var(--r-chip,4px);background:none;color:var(--texto-90);font:500 var(--t-125,12.5px)/1 var(--fonte-ui);text-align:left;cursor:pointer}',
    '.end-sala-cab:hover{background:var(--s3);color:var(--texto)}',
    '.end-sala.atividade .end-sala-cab{font:500 var(--t-11,11px)/1 var(--fonte-mono);color:var(--apagado)}',
    '.end-sala-cab .num{color:var(--apagado);font:500 var(--t-11,11px)/1 var(--fonte-mono)}',
    '.end-vazia{margin:0;padding:0 6px 2px;color:var(--casca-fraco,var(--apagado));font:400 var(--t-11,11px)/1.4 var(--fonte-mono)}',
    '.end-gente-lista{list-style:none;margin:0;padding:0}',
    '.end-gente{position:relative;display:flex;align-items:center;gap:2px;border-radius:var(--r-chip,4px);isolation:isolate}',
    '.end-gente::before{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;background:linear-gradient(90deg,color-mix(in srgb,var(--t2) 34%,transparent),color-mix(in srgb,var(--t0) 10%,transparent) 60%,transparent);opacity:var(--luz,0);pointer-events:none}',
    '.end-gente-nome{flex:1;min-width:0;display:flex;align-items:center;gap:8px;padding:4px 6px;border:0;border-radius:var(--r-chip,4px);background:none;color:var(--texto-90);text-align:left;cursor:pointer}',
    '.end-gente-nome:hover{background:var(--s3)}',
    '.end-gente-txt{display:flex;flex-direction:column;gap:3px;min-width:0}',
    '.end-gente-txt b{color:var(--texto);font:500 var(--t-125,12.5px)/1.15 var(--fonte-ui)}',
    '.end-gente.eu .end-gente-txt b{color:var(--t0)}',
    '.end-gente-txt small{overflow:hidden;color:var(--apagado);font:400 var(--t-11,11px)/1.3 var(--fonte-mono);white-space:nowrap;text-overflow:ellipsis}',
    '.end-ir{flex:none;display:grid;place-items:center;width:24px;height:24px;border:0;border-radius:var(--r-chip,4px);background:none;color:var(--casca-fraco,var(--apagado));cursor:pointer}',
    '.end-ir:hover,.end-ir:focus-visible{background:var(--s3);color:var(--t0)}',
    '.end-fora{display:flex;align-items:center;gap:8px;margin-top:8px;padding:4px 6px;color:var(--casca-fraco,var(--apagado));font:400 var(--t-11,11px)/1.4 var(--fonte-mono)}',
    '.end-planta-nota{margin:6px 6px 0}',
    /* rastro: balão de vidro (superfície viva) com trilho roxo → ciano */
    '.end-pop{position:fixed;z-index:60;width:352px;max-width:calc(100vw - 32px);max-height:min(72vh,580px);display:flex;flex-direction:column;border:1px solid rgba(63,227,255,.22);border-radius:var(--r-janela,10px);background:color-mix(in srgb,var(--s2) 86%,transparent);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);box-shadow:0 24px 60px rgb(0 0 0 / .55),0 0 26px -14px rgba(42,213,229,.6);color:var(--texto);overflow:hidden}',
    '.end-pop[hidden]{display:none}',
    '.end-pop::before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(215,228,251,.03) 0 1px,transparent 1px 3px)}',
    '.end-pop-cab{display:flex;align-items:center;gap:10px;padding:12px 10px 10px 14px;border-bottom:1px solid var(--linha-fraca)}',
    '.end-pop-tit{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}',
    '.end-pop-tit b{font:500 var(--t-14,14px)/1.2 var(--fonte-ui)}',
    '.end-pop-tit small{color:var(--apagado);font:400 var(--t-11,11px)/1.3 var(--fonte-mono)}',
    '.end-pop-x{flex:none;width:24px;height:24px;border:0;border-radius:var(--r-chip,4px);background:none;color:var(--casca-fraco,var(--apagado));cursor:pointer}',
    '.end-pop-x:hover{background:var(--s3);color:var(--texto)}',
    '.end-pop-agora{display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid var(--linha-fraca);color:var(--texto-90);font:400 var(--t-125,12.5px)/1.4 var(--fonte-ui)}',
    '.end-pop-agora span{flex:1;min-width:0}',
    '.end-pop-ir{flex:none;border-color:rgba(63,227,255,.35)}',
    '.end-paradas{position:relative;margin:0;padding:10px 14px 4px;overflow:auto;list-style:none}',
    '.end-parada{position:relative;display:grid;grid-template-columns:40px 12px minmax(0,1fr);gap:8px;align-items:start;padding:3px 0 7px}',
    '.end-parada::before{content:"";position:absolute;left:53px;top:16px;bottom:-4px;width:1px;background:linear-gradient(180deg,var(--marca,var(--t2)),color-mix(in srgb,var(--t2) 40%,transparent));opacity:.45}',
    '.end-parada:last-child::before{display:none}',
    '.end-parada time{color:var(--apagado);font:500 var(--t-11,11px)/18px var(--fonte-mono);text-align:right;font-variant-numeric:tabular-nums}',
    '.end-no{width:9px;height:9px;margin-top:4px;border:1.5px solid var(--marca,var(--t2));border-radius:50%;background:color-mix(in oklch,var(--marca,var(--t2)) calc(var(--luz,0) * 100%),var(--s2));box-shadow:0 0 calc(var(--luz,0) * 10px) var(--marca,var(--t2))}',
    '.end-parada-ir{display:block;max-width:100%;padding:0;border:0;background:none;color:color-mix(in oklch,var(--texto-90),var(--t0) calc(var(--luz,0) * 70%));font:500 var(--t-125,12.5px)/1.35 var(--fonte-ui);text-align:left;cursor:pointer;overflow-wrap:anywhere}',
    '.end-parada-ir:hover{color:var(--texto);text-decoration:underline;text-underline-offset:3px}',
    '.end-parada small{display:block;margin-top:2px;color:var(--apagado);font:400 var(--t-11,11px)/1.45 var(--fonte-mono);overflow-wrap:anywhere}',
    '.end-pop-vazio,.end-pop-pe{margin:0;padding:8px 14px 12px;color:var(--casca-fraco,var(--apagado));font:400 var(--t-11,11px)/1.4 var(--fonte-mono)}',
    '.end-pop-pe{border-top:1px solid var(--linha-fraca)}',
    /* paleta: grupo "Onde estão" */
    '.paleta-lista li.paleta-grupo{padding:10px 10px 4px;cursor:default;pointer-events:none;color:var(--casca-fraco,var(--apagado));font:500 var(--t-11,11px)/1 var(--fonte-ui);letter-spacing:var(--rotulo-tracking,.08em);text-transform:uppercase;background:none}',
    '.paleta-onde{display:flex;align-items:center;gap:10px;min-width:0}',
    '.paleta-onde-txt{display:flex;flex-direction:column;gap:3px;min-width:0}',
    '.paleta-onde-txt b{color:var(--texto);font-weight:500}',
    '.paleta-onde-txt small{overflow:hidden;color:var(--apagado);font:400 12px/1.2 var(--fonte-mono);white-space:nowrap;text-overflow:ellipsis}',
    '.paleta-lista li:has(.paleta-onde){align-items:center}',
    /* celular: a trilha rola, a planta sai (o "onde estão?" do cabeçalho abre a paleta) */
    '@media (max-width:760px){.e-endereco{gap:8px;padding:0 8px;min-height:40px}.end-aqui-txt,.end-chegou{display:none}.end-parte.end-p-bancada,.end-parte.end-p-bancada+.end-sep{display:none}.end-parte.end-p-peca{max-width:56vw}.end-planta{display:none}.end-pop{left:16px!important;right:16px;width:auto}}',
    /* sem movimento: cor sem laço */
    '@media (prefers-reduced-motion:reduce){.end-anel.pensando::before{animation:none}.e-endereco.end-chegada .end-aqui .end-anel,.e-endereco.end-chegada::after{animation:none}}',
    '@media (prefers-reduced-transparency:reduce){.end-pop,.end-sala.minha{background:var(--s2);-webkit-backdrop-filter:none;backdrop-filter:none}}'
  ].join('\n');
  function injetarEstilo() {
    if ($('endereco-estilo')) return;
    var st = document.createElement('style');
    st.id = 'endereco-estilo';
    st.textContent = CSS_ENDERECO;
    (document.head || document.documentElement).appendChild(st);
  }

  /* ======================================================================
     13. Ligação com a Estação (chamado por estacao.js)
     ====================================================================== */

  function montarNav() {
    var nav = $('e-endereco'), conteudo = $('e-conteudo');
    if (nav || !conteudo) return nav;
    nav = document.createElement('nav');
    nav.className = 'e-endereco';
    nav.id = 'e-endereco';
    nav.hidden = true;
    nav.setAttribute('aria-label', 'Endereço do objeto aberto');
    conteudo.parentNode.insertBefore(nav, conteudo);
    return nav;
  }
  function renderCabecalho(tab) {
    var nav = montarNav();
    if (!nav) return;
    var html = htmlCabecalho(tab);
    nav.hidden = !html;
    var raiz = $('vista-estacao');
    if (raiz) raiz.classList.toggle('com-endereco', !!html);
    if (nav.innerHTML !== html) {
      var luzes = {};
      nav.querySelectorAll('[data-end-pessoa]').forEach(function (el) { var l = el.style.getPropertyValue('--luz'); if (l) luzes[el.getAttribute('data-end-pessoa')] = l; });
      nav.innerHTML = html;
      nav.querySelectorAll('[data-end-pessoa]').forEach(function (el) { var l = luzes[el.getAttribute('data-end-pessoa')]; if (l && !el.hasAttribute('data-end-t')) el.style.setProperty('--luz', l); });
    }
    if (aplicarLuzes(nav)) ligarTicker();
  }
  function decorarLateral(lat) {
    if (!lat) return;
    lat.querySelectorAll('.arv-arq[data-id]').forEach(function (row) {
      var pes = quemEsta('arquivo:' + row.getAttribute('data-id'));
      if (!pes.length || row.querySelector('.end-aneis')) return;
      var span = document.createElement('span');
      span.innerHTML = aneis(pes, 14, function (id) { return chegadas[id] || null; });
      var el = span.firstChild, acoes = row.querySelector('.arv-acoes');
      row.insertBefore(el, acoes || null);
      row.setAttribute('title', (row.getAttribute('title') || '') + ' · ' + nomesJuntos(pes));
    });
    reacenderLateral(lat);
    if (aplicarLuzes(lat)) ligarTicker();
  }

  var iniciado = false;
  BC.endereco = {
    versao: '1.0.0',
    /* dados (a TV e o celular usam os mesmos) */
    /* de(x): x = aba do meio (tem id) · alvo { tipo, ref } · id de pessoa ou 'ag:<agente>' (devolve onde ela está, com peca, projeto e ts) */
    de: function (x) {
      if (typeof x === 'string') {
        var p = posicao(x);
        if (!p || !p.end) return null;
        var r = Object.assign({}, p.end);
        r.peca = p.end.rotulo; r.projeto = p.end.sala.tipo === 'projeto' ? p.end.sala.ir.ref : null; r.ts = p.ts || 0; r.oque = p.oque || ''; r.fora = p.fora;
        return r;
      }
      return enderecar(x && x.id !== undefined ? alvoDaAba(x) : x || null);
    },
    daAba: function (tab) { return enderecar(alvoDaAba(tab)); },
    texto: function (alvo) { var e = enderecar(alvo); return e ? e.texto : ''; },
    chave: chaveDe,
    posicao: posicao,
    frase: frase,
    ondeEstao: function () { return todas().filter(function (p) { return p.tipo === 'pessoa' || recente(p); }); },
    quemEsta: function (chave) { return quemEsta(chave, true); },
    salas: salas,
    rastro: rastro,
    /* ações */
    irAte: irAte,
    irAtePorNome: irAtePorNome,
    abrir: abrirAlvo,
    mostrarRastro: mostrarRastro,
    fecharPop: fecharPop,
    popAberto: function () { return !!(pop.el && !pop.el.hidden); },
    /* Estação */
    comandos: comandos,
    planta: htmlPlanta,
    decorarLateral: decorarLateral,
    render: function (tab) { renderCabecalho(tab); registrar(tab); atualizarPop(); },
    iniciar: function () {
      if (iniciado) return;
      iniciado = true;
      injetarEstilo();
      montarNav();
      observarFazendo();
      detectar();
      L().aoMudar(function () { try { observarFazendo(); detectar(); } catch (e) { console.error(e); } });
      document.addEventListener('mousedown', function (ev) {
        if (!pop.el || pop.el.hidden) return;
        if (pop.el.contains(ev.target) || (ev.target.closest && ev.target.closest('[data-acao="end-rastro"]'))) return;
        fecharPop();
      });
      window.addEventListener('resize', function () { if (pop.el && !pop.el.hidden) posicionarPop(); });
      document.addEventListener('visibilitychange', function () { if (!document.hidden) { aplicarLuzes(); ligarTicker(); } });
      document.addEventListener('keydown', function (ev) {
        var t = ev.target;
        if ((ev.key === 'Enter' || ev.key === ' ') && t && t.classList && t.classList.contains('end-anel') && t.getAttribute('role') === 'button') { ev.preventDefault(); mostrarRastro(t.getAttribute('data-id'), t); }
      });
    },
    /* instrumentação para os testes */
    _estado: function () { return { chegadas: JSON.parse(JSON.stringify(chegadas)), luzGente: JSON.parse(JSON.stringify(luzGente)), ticker: !!ticker, registro: reg.chave, pop: pop.id }; }
  };
  injetarEstilo();
})(window.BC);
