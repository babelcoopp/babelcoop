/* Babel Coop — protótipo · ações (tudo o que muda o estado) */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var U = BC.util, MIN = U.MIN, DIA = U.DIA;
  var L = BC.loja, A = L.A;
  function E() { return L.estado; }
  function ev(tipo, pessoa, texto, extra) { return L._evento(tipo, pessoa, texto, extra); }
  function titulo(d) { return '"' + d.titulo + '"'; }
  function nomeArq(a) { return a.caminho.split('/').pop(); }
  function registrar(d, quem, acao, nota) { d.historico.push({ ts: Date.now(), quem: quem, acao: acao, nota: nota || '' }); }
  function fecharPausa(d, agora) { d.pausas.forEach(function (p) { if (!p.fim) p.fim = agora; }); }
  function ativo(id) { var p = L.pessoa(id); return !!p && id !== L.eu && p.status !== 'offline'; }
  function admin(quem) { var p = L.pessoa(quem); return !!p && p.papel === 'admin'; }

  /* celular, iPad e TV abertos pelo IP da máquina: o servidor só aceita deles o que vem em COOP_REAL.remoto (servidor.js).
     O resto nem se aplica nesta tela (senão ela mostraria o que o diário nunca guarda); as que a tela dispara sozinha saem caladas.
     Os eventos que chegam do servidor não passam por aqui (a ponte aplica L.A direto). */
  var AUTOMATICAS = ['lida', 'agenteEstado', 'corpoPublicar', 'retomarSozinho'];
  var fazerDaLoja = L.fazer;
  L.fazer = function (nome) {
    var real = window.COOP_REAL;
    if (real && Array.isArray(real.remoto) && real.remoto.indexOf(nome) === -1) {
      if (AUTOMATICAS.indexOf(nome) === -1 && BC.estacao && BC.estacao.aviso) BC.estacao.aviso('Pela rede só o quadro e a TV. "' + String(nome).slice(0, 40) + '" fica para a Estação.');
      return false;
    }
    return fazerDaLoja.apply(L, arguments);
  };

  function pausarOutras(pessoa, exceto, agora) {
    E().demandas.forEach(function (o) {
      if (o.para === pessoa && o.id !== exceto && o.estado === 'andamento') {
        o.pausas.push({ inicio: agora, fim: null, motivo: 'trocou de demanda' });
        o.estado = 'pausada';
        registrar(o, pessoa, 'pausou', 'trocou de demanda');
      }
    });
  }

  /* ======================= demandas ======================= */

  A.novaDemanda = function (quem, dados) {
    if (!dados || !dados.titulo) return;
    var livre = !dados.para;
    var d = { id: L._novoId('d'), titulo: dados.titulo, descricao: dados.descricao || '', de: quem, para: livre ? null : dados.para, criada: Date.now(),
      prazo: dados.prazo || null, estimativaMin: dados.estimativaMin || null, prioridade: dados.prioridade || 'média', projeto: dados.projeto || null,
      estado: livre ? 'livre' : 'enviada', inicio: null, fim: null, pausas: [], devolucoes: 0, kudos: false, historico: [] };
    registrar(d, quem, livre ? 'deixou livre para quem puder pegar' : 'enviou');
    E().demandas.unshift(d);
    if (livre) return [ev('livre', quem, L.nome(quem) + ' deixou ' + titulo(d) + ' livre: pega quem puder', { demanda: d.id, tv: true })];
    return [ev('demanda', quem, L.nome(quem) + ' enviou ' + titulo(d) + ' para ' + L.nome(d.para), { para: d.para, demanda: d.id })];
  };

  /* tarefa livre: quem pega vira o responsável e o cronômetro já começa */
  A.pegar = function (quem, id) {
    var d = L.demanda(id), agora = Date.now();
    if (!d || d.estado !== 'livre') return;
    pausarOutras(quem, id, agora);
    d.para = quem;
    d.estado = 'andamento';
    d.inicio = agora;
    registrar(d, quem, 'pegou a tarefa livre e começou');
    return [ev('pegou', quem, L.nome(quem) + ' pegou ' + titulo(d) + ' da lista de livres', { para: d.de, demanda: id, tv: true })];
  };

  A.comecar = function (quem, id) {
    var d = L.demanda(id), agora = Date.now();
    if (!d || d.para !== quem || d.estado !== 'enviada') return;
    pausarOutras(quem, id, agora);
    d.estado = 'andamento';
    d.inicio = agora;
    registrar(d, quem, 'começou');
    return [ev('inicio', quem, L.nome(quem) + ' começou ' + titulo(d), { para: d.de, demanda: id, tv: true })];
  };

  A.pausar = function (quem, id, motivo) {
    var d = L.demanda(id), agora = Date.now();
    if (!d || d.para !== quem || d.estado !== 'andamento') return;
    d.pausas.push({ inicio: agora, fim: null, motivo: motivo || 'pausa' });
    d.estado = 'pausada';
    registrar(d, quem, 'pausou', motivo);
    return [ev('pausa', quem, L.nome(quem) + ' pausou ' + titulo(d) + ' (' + motivo + ')', { para: d.de, demanda: id, discreto: true })];
  };

  A.retomar = function (quem, id) {
    var d = L.demanda(id), agora = Date.now();
    if (!d || d.para !== quem || d.estado !== 'pausada') return;
    pausarOutras(quem, id, agora);
    fecharPausa(d, agora);
    d.estado = 'andamento';
    registrar(d, quem, 'retomou');
    return [ev('retomada', quem, L.nome(quem) + ' retomou ' + titulo(d), { para: d.de, demanda: id, discreto: true })];
  };

  /* para marcar como pronta, escreve-se o que aprendeu */
  A.pronta = function (quem, id, aprendizado) {
    var d = L.demanda(id), agora = Date.now();
    if (!d || d.para !== quem || (d.estado !== 'andamento' && d.estado !== 'pausada')) return;
    if (!aprendizado || aprendizado.trim().length < 8) return;
    fecharPausa(d, agora);
    d.pausas.push({ inicio: agora, fim: null, motivo: 'aguardando conferência' });
    d.estado = 'pronta';
    d.aprendizado = aprendizado.trim();
    registrar(d, quem, 'avisou que está pronta', 'aprendeu: ' + d.aprendizado);
    var evs = [ev('pronta', quem, L.nome(quem) + ' avisou que ' + titulo(d) + ' está pronta', { para: d.de, demanda: id })];
    return evs.concat(A.aprendizado(quem, d.aprendizado, d.titulo) || []);
  };

  A.ok = function (quem, id) {
    var d = L.demanda(id), agora = Date.now();
    if (!d || d.de !== quem || !d.inicio || d.estado === 'concluida') return;
    fecharPausa(d, agora);
    d.fim = agora;
    d.estado = 'concluida';
    registrar(d, quem, 'deu OK');
    E().concluidasHoje++;
    return [ev('conclusao', quem, L.nome(quem) + ' deu OK em ' + titulo(d) + ' · ' + U.duracao(L.tempo(d).trabalho) + ' de trabalho',
      { para: d.para, demanda: id, tv: true, textoTv: L.nome(d.para) + ' concluiu ' + titulo(d), pessoaTv: d.para })];
  };

  A.devolver = function (quem, id, comentario) {
    var d = L.demanda(id), agora = Date.now();
    if (!d || d.de !== quem || d.estado !== 'pronta' || !comentario) return;
    fecharPausa(d, agora);
    d.pausas.push({ inicio: agora, fim: null, motivo: 'devolvida para ajuste' });
    d.estado = 'pausada';
    d.devolucoes++;
    registrar(d, quem, 'devolveu', comentario);
    return [ev('devolucao', quem, L.nome(quem) + ' devolveu ' + titulo(d) + ': ' + comentario, { para: d.para, demanda: id })];
  };

  A.perguntar = function (quem, id, pergunta) {
    var d = L.demanda(id);
    if (!d || d.para !== quem || !pergunta) return;
    registrar(d, quem, 'perguntou', pergunta);
    return [ev('pergunta', quem, L.nome(quem) + ' perguntou sobre ' + titulo(d) + ': ' + pergunta, { para: d.de, demanda: id })];
  };

  A.responder = function (quem, id, resposta) {
    var d = L.demanda(id);
    if (!d || d.de !== quem) return;
    registrar(d, quem, 'respondeu', resposta);
    return [ev('resposta', quem, L.nome(quem) + ' respondeu sobre ' + titulo(d) + ': ' + resposta, { para: d.para, demanda: id })];
  };

  A.travado = function (quem, id, nota) {
    var d = L.demanda(id), agora = Date.now();
    if (!d || d.para !== quem || (d.estado !== 'andamento' && d.estado !== 'pausada')) return;
    if (d.estado === 'andamento') { d.pausas.push({ inicio: agora, fim: null, motivo: 'travado' }); d.estado = 'pausada'; }
    registrar(d, quem, 'travou', nota);
    return [ev('travado', quem, L.nome(quem) + ' está travado em ' + titulo(d) + (nota ? ': ' + nota : ''), { para: d.de, demanda: id, tv: true, textoTv: L.nome(quem) + ' pediu uma mão em ' + titulo(d) })];
  };

  A.cutucar = function (quem, id) {
    var d = L.demanda(id);
    if (!d || d.de !== quem || d.estado === 'concluida' || d.estado === 'cancelada') return;
    var antes = d.historico.filter(function (x) { return x.acao === 'cutucou'; }).pop();
    if (antes && Date.now() - antes.ts < U.HORA) return 'cedo';
    registrar(d, quem, 'cutucou');
    return [ev('cutucada', quem, L.nome(quem) + ' lembrou você de ' + titulo(d), { para: d.para, demanda: id })];
  };

  A.cancelar = function (quem, id) {
    var d = L.demanda(id);
    if (!d || d.de !== quem || (d.estado !== 'enviada' && d.estado !== 'livre')) return;
    d.estado = 'cancelada';
    registrar(d, quem, 'cancelou');
    return [ev('cancelada', quem, L.nome(quem) + ' cancelou ' + titulo(d), { para: d.para, demanda: id, discreto: true })];
  };

  A.valeu = function (quem, id) {
    var d = L.demanda(id);
    if (!d || d.de !== quem || d.estado !== 'concluida' || d.kudos) return;
    d.kudos = true;
    registrar(d, quem, 'agradeceu');
    return [ev('valeu', quem, L.nome(quem) + ' agradeceu ' + L.nome(d.para) + ' por ' + titulo(d),
      { para: d.para, demanda: id, tv: true, textoTv: 'Valeu, ' + L.nome(d.para) + '! · ' + d.titulo, pessoaTv: d.para })];
  };

  /* ======================= aprendizados ======================= */

  var LIMIAR = 0.62;

  /* não muda nada: diz se o texto já é conhecido */
  A.checarNovidade = function (texto) {
    var r = BC.acervo.parecidos(texto, E().aprendizados)[0];
    return r && r.sim >= LIMIAR ? { repetido: true, parecido: r.item, sim: r.sim } : { repetido: false, sim: r ? r.sim : 0, parecido: r ? r.item : null };
  };

  A.aprendizado = function (quem, texto, origem, ia) {
    if (!texto || texto.trim().length < 8) return;
    var n = A.checarNovidade(texto);
    if (n.repetido) {
      if (n.parecido.confirmacoes.indexOf(quem) === -1 && n.parecido.pessoa !== quem) n.parecido.confirmacoes.push(quem);
      A.gerarAprendizadosMd();
      return [ev('aprendizado-repetido', quem, (ia ? 'A IA de ' + L.nome(quem) : L.nome(quem)) + ' confirmou algo que a equipe já sabia: "' + n.parecido.texto + '"', { discreto: true })];
    }
    var ap = { id: L._novoId('ap'), texto: texto.trim(), pessoa: quem, ts: Date.now(), confirmacoes: [], origem: origem || '', ia: !!ia };
    E().aprendizados.unshift(ap);
    A.gerarAprendizadosMd();
    return [ev('aprendizado', quem, (ia ? 'A IA do terminal de ' + L.nome(quem) : L.nome(quem)) + ' aprendeu: ' + ap.texto, { tv: true })];
  };

  A.confirmar = function (quem, id) {
    var ap = E().aprendizados.filter(function (x) { return x.id === id; })[0];
    if (!ap || ap.pessoa === quem) return;
    var i = ap.confirmacoes.indexOf(quem);
    if (i === -1) ap.confirmacoes.push(quem); else ap.confirmacoes.splice(i, 1);
    A.gerarAprendizadosMd();
    return [];
  };

  /* o arquivo que a IA de cada terminal lê antes de começar */
  A.gerarAprendizadosMd = function () {
    var lista = E().aprendizados.slice().sort(function (a, b) { return (b.confirmacoes.length - a.confirmacoes.length) || (b.ts - a.ts); });
    var md = ['# Aprendizados da equipe', '', '> Gerado pelo babel-coop. A IA de cada terminal lê este arquivo antes de começar.',
      '> O que se repete não entra de novo: soma "+1 confirmado".', ''];
    lista.forEach(function (ap) {
      md.push('- ' + ap.texto + ' _(' + (ap.ia ? 'IA do terminal de ' : '') + L.nome(ap.pessoa) + ', ' + U.quando(ap.ts) +
        (ap.confirmacoes.length ? ', +' + ap.confirmacoes.length + ' confirmado' : '') + ')_');
    });
    var caminho = 'equipe/Aprendizados/APRENDIZADOS.md', a = L.arquivo(caminho), texto = md.join('\n');
    if (a) { a.conteudo = texto; a.modificado = Date.now(); }
    else E().arquivos.push({ id: 'f-aprendizados', caminho: caminho, dono: 'equipe', autor: 'theus', tipo: 'md', tamanho: '2 KB', modificado: Date.now(), conteudo: texto, versoes: [], consultas: 14 });
  };

  /* ======================= tarefas com fluxo ======================= */

  A.concluirEtapa = function (quem, id) {
    var t = L.tarefa(id);
    if (!t) return;
    var f = L.fluxo(t.fluxo);
    if (t.atual >= f.etapas.length) return;
    var de = t.donos[t.atual];
    t.atual++;
    t.paradaDesde = Date.now();
    if (t.atual >= f.etapas.length) {
      E().concluidasHoje++;
      return [ev('conclusao', de, L.nome(de) + ' concluiu "' + t.titulo + '"', { tarefa: id, tv: true })];
    }
    var para = t.donos[t.atual];
    return [ev('passagem', de, L.nome(de) + ' passou "' + t.titulo + '" para ' + L.nome(para), { de: de, para: para, tarefa: id, tv: true })];
  };

  /* a gestão monta a trilha: um responsável por etapa do fluxo */
  A.novaTarefa = function (quem, dados) {
    var f = dados && L.fluxo(dados.fluxo);
    if (!f || !dados.titulo || !dados.donos || dados.donos.length !== f.etapas.length) return;
    var t = { id: L._novoId('t'), titulo: dados.titulo, fluxo: f.id, donos: dados.donos.slice(), atual: 0, prazo: dados.prazo || null,
      prioridade: dados.prioridade || 'média', paradaDesde: Date.now(), checklist: [] };
    E().tarefas.unshift(t);
    return [ev('tarefa', quem, L.nome(quem) + ' criou a tarefa "' + t.titulo + '": começa com ' + L.nome(t.donos[0]), { para: t.donos[0], tarefa: t.id })];
  };

  A.marcarChecklist = function (quem, id, i, texto) {
    var t = L.tarefa(id);
    if (!t) return;
    t.checklist = t.checklist || [];
    if (texto) t.checklist.push({ texto: texto, feito: false });
    else if (t.checklist[i]) t.checklist[i].feito = !t.checklist[i].feito;
    else return;
    return [];
  };

  /* ======================= chat ======================= */

  A.mensagem = function (quem, convId, texto, extra) {
    texto = texto || '';
    if (!texto && !(extra && extra.arquivo)) return;
    var lista = E().mensagens[convId] || (E().mensagens[convId] = []);
    var m = { id: L._novoId('m'), pessoa: quem, texto: texto, ts: Date.now(), respondeA: (extra && extra.respondeA) || null, reacoes: {}, arquivo: (extra && extra.arquivo) || null };
    lista.push(m);
    (E().lidas[quem] = E().lidas[quem] || {})[convId] = m.ts;
    var c = L.conversa(convId), evs = [];
    (texto.match(/@([A-Za-zÀ-ú]+)/g) || []).forEach(function (t) {
      var p = E().pessoas.filter(function (x) { return U.normalizar(x.nome) === U.normalizar(t.slice(1)); })[0];
      if (p && p.id !== quem) evs.push(ev('mencao', quem, L.nome(quem) + ' mencionou você: ' + texto.slice(0, 90), { para: p.id, conversa: convId, discreto: true }));
    });
    if (c && c.tipo === 'direta') {
      var outro = c.membros.filter(function (x) { return x !== quem; })[0];
      evs.push(ev('direta', quem, L.nome(quem) + ': ' + (texto || 'enviou um arquivo').slice(0, 90), { para: outro, conversa: convId, discreto: true }));
    }
    return evs;
  };

  A.reagir = function (quem, convId, msgId, emoji) {
    var m = (E().mensagens[convId] || []).filter(function (x) { return x.id === msgId; })[0];
    if (!m) return;
    var lista = m.reacoes[emoji] || (m.reacoes[emoji] = []), i = lista.indexOf(quem);
    if (i === -1) lista.push(quem); else lista.splice(i, 1);
    if (!lista.length) delete m.reacoes[emoji];
    return [];
  };

  A.lida = function (quem, convId) { (E().lidas[quem] = E().lidas[quem] || {})[convId] = Date.now(); return []; };

  /* conversa direta com qualquer pessoa (cria se ainda não existe) */
  A.abrirDireta = function (quem, outro) {
    if (!L.pessoa(outro) || outro === quem) return;
    var id = L.conversaDireta(quem, outro);
    if (!L.conversa(id)) { E().conversas.push({ id: id, tipo: 'direta', membros: [quem, outro].sort() }); E().mensagens[id] = E().mensagens[id] || []; }
    return [];
  };

  /* ======================= TV ======================= */

  A.aviso = function (quem, texto) {
    if (!texto) return;
    E().avisos.unshift({ id: L._novoId('a'), pessoa: quem, texto: texto, ts: Date.now() });
    if (E().avisos.length > 4) E().avisos.length = 4;
    return [ev('aviso', quem, 'Aviso: ' + texto, { tv: true, textoTv: texto })];
  };

  A.recado = function (quem, texto) {
    if (!texto) return;
    E().mural.unshift({ id: L._novoId('r'), pessoa: quem, texto: texto, ts: Date.now() });
    if (E().mural.length > 6) E().mural.length = 6;
    return [ev('recado', quem, texto, { tv: true, discreto: true })];
  };

  A.projetar = function (quem, caminho) {
    var a = L.arquivo(caminho);
    if (!a) return;
    if ((a.tipo === 'video' || a.tipo === 'binario') && !L.online(a.dono)) return;
    var paginas = 1;
    if (a.tipo === 'pdf') { try { paginas = JSON.parse(a.conteudo).paginas.length; } catch (e) { paginas = 1; } }
    E().projecao = { caminho: a.caminho, tipo: a.tipo, por: quem, pagina: 1, paginas: paginas, desde: Date.now() };
    return [ev('projecao', quem, L.nome(quem) + ' projetou "' + nomeArq(a) + '" na TV', { discreto: true })];
  };
  A.pagina = function (quem, delta) { var p = E().projecao; if (!p) return; p.pagina = Math.min(p.paginas, Math.max(1, p.pagina + delta)); return []; };
  A.rolarProjecao = function (quem, delta) { var p = E().projecao; if (!p) return; p.rolagem = Math.max(0, Math.min(1, (p.rolagem || 0) + delta)); return []; };
  A.rolarProjecaoPara = function (quem, fracao) { var p = E().projecao; if (!p) return; p.rolagem = Math.max(0, Math.min(1, +fracao || 0)); return []; };
  /* a TV é da equipe: quem projetou ou a gestão encerra (antes, sem quem, passava qualquer um) */
  A.encerrarProjecao = function (quem) { var p = E().projecao; if (!p) return; if (p.por !== quem && !admin(quem)) return; E().projecao = null; return []; };
  A.tvSite = function (quem, url) {
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    E().tvSite = { url: url, por: quem, desde: Date.now() };
    E().tvModo = 'site';
    return [ev('tv-site', quem, L.nome(quem) + ' mostrou o site ' + url.replace(/^https?:\/\//, '') + ' na TV', { discreto: true })];
  };
  A.cronometroTv = function (quem, min, rotulo) {
    E().cronometroTv = { rotulo: rotulo, fim: Date.now() + min * MIN, por: quem };
    return [ev('cronometro', quem, L.nome(quem) + ' iniciou o cronômetro "' + rotulo + '" (' + min + ' min) na TV', { tv: true, textoTv: rotulo + ' · ' + min + ' min' })];
  };
  /* o cronômetro da TV: para quem o iniciou ou a gestão, como a projeção */
  A.pararCronometroTv = function (quem) { var c = E().cronometroTv; if (c && c.por !== quem && !admin(quem)) return; E().cronometroTv = null; return []; };
  A.visita = function (quem, ligado) { if (!admin(quem)) return; E().visita = !!ligado; return []; };
  A.temaTv = function (quem, tema) { if (!admin(quem) || ['noite', 'claro', 'ametista', 'roxo', 'azul'].indexOf(tema) === -1) return; E().temaTv = tema; return []; };
  /* modo da TV: a gestão troca qualquer um (Controle da TV); os outros só o que a interface dá a todos: voltar ao painel,
     pôr um quadro ao vivo (quadro, iPad) e a reunião aberta na TV */
  function tvModoDeTodos(modo, quadroId) {
    if (modo === 'painel') return true;
    if (modo === 'quadro') { if (quadroId == null) return true; var q = L.arquivo(quadroId); return !!q && q.tipo === 'quadro'; }
    if (modo === 'reuniao') return !!(E().reuniao && E().reuniao.ativa);
    return false;
  }
  A.tvModo = function (quem, modo, quadroId) { if (!admin(quem) && !tvModoDeTodos(modo, quadroId)) return; E().tvModo = modo; if (quadroId !== undefined) E().tvQuadro = quadroId; return []; };
  A.novaCampanha = function (quem, dados) {
    if (!dados || !dados.titulo) return;
    var c = { id: L._novoId('c'), titulo: dados.titulo, alvo: dados.alvo || 10, atual: 0, pessoa: dados.pessoa || quem, prazo: dados.prazo || null, por: quem, ts: Date.now(), unidade: dados.unidade || '' };
    E().campanhas = E().campanhas || [];
    E().campanhas.unshift(c);
    if (dados.principal) E().campanha = { nome: c.titulo, descricao: c.unidade || 'novos clientes', atual: 0, alvo: c.alvo, fim: c.prazo || E().campanha.fim };
    return [ev('campanha-nova', quem, L.nome(quem) + ' criou a campanha "' + c.titulo + '" para ' + L.nome(c.pessoa) + (dados.prazoTexto ? ' · até ' + dados.prazoTexto : ''), { tv: true, para: c.pessoa !== quem ? c.pessoa : undefined, campanha: c.id })];
  };
  A.desfazerCampanha = function (quem, id) { var cs = E().campanhas || [], i = cs.map(function (c) { return c.id; }).indexOf(id); if (i === -1) return; cs.splice(i, 1); return [ev('campanha-desfeita', quem, L.nome(quem) + ' desfez uma campanha', { discreto: true })]; };
  A.presenca = function (quem, status) { var p = L.pessoa(quem); if (!p) return; p.status = status; p.ultimaVez = Date.now(); return []; };
  A.regra = function (quem, chave, valor) { if (!admin(quem)) return; E().regras[chave] = valor; return []; };
  A.tocar = function () { return []; };

  A.maisUmCliente = function (quem) {
    var c = E().campanha;
    if (c.atual >= c.alvo) return;
    c.atual++;
    var evs = [ev('campanha', quem, L.nome(quem) + ' fechou mais um cliente · campanha em ' + c.atual + ' de ' + c.alvo, { tv: true })];
    if (c.atual === c.alvo) evs.push(ev('comemoracao', quem, c.nome + ' batida: ' + c.alvo + ' ' + c.descricao + '!', { tv: true, grande: true }));
    return evs;
  };

  A.checkin = function (quem, hoje, bloqueio) {
    if (!hoje) return;
    E().checkins[quem] = { hoje: hoje, bloqueio: bloqueio || '', ts: Date.now() };
    return bloqueio ? [ev('bloqueio', quem, L.nome(quem) + ' registrou um bloqueio: ' + bloqueio, {})] : [];
  };

  /* ======================= arquivos ======================= */

  A.salvarArquivo = function (quem, id, conteudo) {
    var a = L.arquivo(id);
    if (!a || !(a.dono === quem || a.dono === 'equipe' || admin(quem))) return;
    if (a.conteudo === conteudo) return [];
    a.versoes.unshift({ ts: Date.now(), quem: quem, conteudo: a.conteudo });
    if (a.versoes.length > 8) a.versoes.length = 8;
    a.conteudo = conteudo;
    a.modificado = Date.now();
    a.salvoPor = quem;
    a.salvoEm = Date.now();
    if (a.dono !== quem && a.dono !== 'equipe') return [ev('correcao', quem, L.nome(quem) + ' corrigiu "' + nomeArq(a) + '" na sua pasta. A versão anterior ficou guardada.', { para: a.dono, arquivo: a.id })];
    return [];
  };

  A.voltarVersao = function (quem, id, i) {
    var a = L.arquivo(id), v = a && a.versoes[i];
    if (!v) return;
    return A.salvarArquivo(quem, id, v.conteudo);
  };

  A.criarArquivo = function (quem, caminho, tipo, conteudo, tamanho) {
    if (L.arquivo(caminho)) caminho = caminho.replace(/(\.[a-z0-9]+)$/i, ' ' + Date.now().toString(36).slice(-3) + '$1');
    var a = { id: L._novoId('f'), caminho: caminho, dono: caminho.split('/')[0], autor: quem, tipo: tipo, tamanho: tamanho || '1 KB',
      modificado: Date.now(), conteudo: conteudo, versoes: [], consultas: 0, salvoPor: quem, salvoEm: Date.now() };
    E().arquivos.push(a);
    return [ev('arquivo', quem, L.nome(quem) + ' criou "' + nomeArq(a) + '"', { arquivo: a.id, discreto: true })];
  };

  /* ======================= quadro ======================= */

  function quadro(id) { var a = L.arquivo(id); if (!a || a.tipo !== 'quadro') return null; try { return { a: a, q: JSON.parse(a.conteudo) }; } catch (e) { return null; } }
  function gravarQuadro(x) { x.a.conteudo = JSON.stringify(x.q); x.a.modificado = Date.now(); }

  A.quadroItem = function (quem, id, item) {
    var x = quadro(id);
    if (!x) return;
    item.id = item.id || L._novoId('q');
    item.autor = quem;
    x.q.itens.push(item);
    gravarQuadro(x);
    return [];
  };
  A.quadroMudar = function (quem, id, itemId, campos) {
    var x = quadro(id);
    if (!x) return;
    x.q.itens.forEach(function (i) { if (i.id === itemId) Object.keys(campos).forEach(function (k) { i[k] = campos[k]; }); });
    gravarQuadro(x);
    return [];
  };
  A.quadroApagar = function (quem, id, itemId) {
    var x = quadro(id);
    if (!x) return;
    x.q.itens = x.q.itens.filter(function (i) { return i.id !== itemId; });
    gravarQuadro(x);
    return [];
  };

  /* ======================= reunião ======================= */

  A.iniciarReuniao = function (quem, tituloR) {
    E().reuniao = { ativa: true, titulo: tituloR || 'Reunião', inicio: Date.now(), condutor: quem, pauta: [], materiais: [], destaque: null, decisoes: [], proximos: [],
      participantes: E().pessoas.filter(function (p) { return p.status !== 'offline' && p.status !== 'ausente'; }).map(function (p) { return p.id; }) };
    return [ev('reuniao', quem, L.nome(quem) + ' abriu a reunião "' + E().reuniao.titulo + '"', { tv: true })];
  };
  A.jogarNaReuniao = function (quem, caminho) {
    var r = E().reuniao, a = L.arquivo(caminho);
    if (!r || !r.ativa || !a) return;
    var m = { id: L._novoId('mt'), caminho: a.caminho, por: quem, ts: Date.now() };
    r.materiais.push(m);
    if (!r.destaque) r.destaque = m.id;
    return [ev('mesa', quem, L.nome(quem) + ' levou "' + nomeArq(a) + '" para a reunião', { tv: true })];
  };
  A.destacar = function (quem, materialId) { var r = E().reuniao; if (!r || !r.ativa) return; r.destaque = materialId; return []; };
  A.pauta = function (quem, texto) { var r = E().reuniao; if (!r || !r.ativa || !texto) return; r.pauta.push({ texto: texto, feito: false }); return []; };
  A.marcarPauta = function (quem, i) { var r = E().reuniao; if (!r || !r.pauta[i]) return; r.pauta[i].feito = !r.pauta[i].feito; return []; };
  A.decisao = function (quem, texto) {
    var r = E().reuniao;
    if (!r || !r.ativa || !texto) return;
    r.decisoes.push({ texto: texto, por: quem, ts: Date.now() });
    return [ev('decisao', quem, 'Decidido: ' + texto, { tv: true })];
  };
  A.proximo = function (quem, texto, pessoa) { var r = E().reuniao; if (!r || !r.ativa || !texto) return; r.proximos.push({ texto: texto, quem: pessoa || quem, ts: Date.now() }); return []; };

  /* a ata sai sozinha, sem IA: junta o que aconteceu */
  A.encerrarReuniao = function (quem) {
    var r = E().reuniao;
    if (!r || !r.ativa) return;
    var data = U.dataArquivo(), dur = U.duracao(Date.now() - r.inicio);
    var falas = E().sala.momentos.filter(function (m) { return m.ts >= r.inicio; });
    var md = ['# Ata · ' + r.titulo + ' (' + data + ')', '', '**Duração:** ' + dur + ' · **Condução:** ' + L.nome(r.condutor), '',
      '**Participantes:** ' + r.participantes.map(L.nome).join(', '), '', '## Pauta'];
    r.pauta.forEach(function (p) { md.push('- [' + (p.feito ? 'x' : ' ') + '] ' + p.texto); });
    md.push('', '## Materiais');
    r.materiais.forEach(function (m) { md.push('- `' + m.caminho + '` (levado por ' + L.nome(m.por) + ')'); });
    md.push('', '## Decisões');
    r.decisoes.forEach(function (d) { md.push('- ' + d.texto); });
    md.push('', '## Próximos passos');
    r.proximos.forEach(function (p) { md.push('- **' + L.nome(p.quem) + '**: ' + p.texto); });
    if (falas.length) {
      md.push('', '## O que foi dito (momentos guardados)');
      falas.forEach(function (m) { m.trechos.forEach(function (x) { md.push('> ' + L.nome(x.quem) + ': ' + x.texto); }); });
    }
    var evs = A.criarArquivo(quem, 'equipe/Reuniões/' + data + ' ' + r.titulo.replace(/[\/\\]/g, '-') + '.md', 'md', md.join('\n'), '2 KB');
    r.ativa = false;
    if (E().tvModo === 'reuniao') E().tvModo = 'painel';
    return evs.concat([ev('ata', quem, 'A ata de "' + r.titulo + '" foi para o acervo', { tv: true })]);
  };

  /* ======================= ideias e pergunta da semana ======================= */

  A.ideia = function (quem, texto, falada) {
    if (!texto) return;
    var i = { id: L._novoId('i'), texto: texto, pessoa: quem, ts: Date.now(), apoios: [], falada: !!falada };
    E().ideias.unshift(i);
    return [ev('ideia', quem, 'Ideia nova de ' + L.nome(quem) + ': ' + texto, { tv: true })];
  };
  A.apoiar = function (quem, id) {
    var i = E().ideias.filter(function (x) { return x.id === id; })[0];
    if (!i || i.pessoa === quem) return;
    var k = i.apoios.indexOf(quem);
    if (k === -1) i.apoios.push(quem); else i.apoios.splice(k, 1);
    return [];
  };
  A.responderPergunta = function (quem, texto) {
    if (!texto) return;
    E().pergunta.respostas.push({ pessoa: quem, texto: texto, ts: Date.now() });
    return [ev('resposta', quem, L.nome(quem) + ' respondeu à pergunta da semana', { tv: true, textoTv: '“' + texto + '” · ' + L.nome(quem) })];
  };

  /* ======================= prompts e terminais ======================= */

  A.prompt = function (quem, texto) {
    if (!texto) return;
    E().prompts.unshift({ id: L._novoId('pr'), pessoa: quem, texto: texto, ts: Date.now(), estrelas: [], reusos: 0, resultado: null });
    return [];
  };
  A.estrela = function (quem, id) {
    var p = E().prompts.filter(function (x) { return x.id === id; })[0];
    if (!p || p.pessoa === quem) return;
    var k = p.estrelas.indexOf(quem);
    if (k === -1) p.estrelas.push(quem); else p.estrelas.splice(k, 1);
    return [];
  };
  A.reusar = function (quem, id) { var p = E().prompts.filter(function (x) { return x.id === id; })[0]; if (!p) return; p.reusos++; return []; };
  A.terminal = function (quem, linhas) {
    var lista = E().terminais[quem] || (E().terminais[quem] = []);
    linhas.forEach(function (l) { lista.push({ ts: Date.now(), tipo: l.tipo, texto: l.texto, agente: l.agente || null }); });
    if (lista.length > 200) lista.splice(0, lista.length - 200);
    return [];
  };
  A.transmissao = function (quem, ligado) { E().transmissao[quem] = !!ligado; return []; };

  /* ======================= fotos, perfil e cuidado ======================= */

  A.foto = function (quem, pessoaId, url) {
    var p = L.pessoa(pessoaId);
    if (!p || !(quem === pessoaId || admin(quem))) return;
    p.foto = url || null;
    return [ev('foto', quem, (url ? L.nome(pessoaId) + ' ganhou foto nova' : L.nome(pessoaId) + ' tirou a foto'), { discreto: true })];
  };
  A.perfil = function (quem, campos) { var p = L.pessoa(quem); if (!p) return; Object.keys(campos).forEach(function (k) { p[k] = campos[k]; }); return []; };
  A.estouBem = function (quem) { E().cuidadoOk[quem] = Date.now(); return []; };
  A.pedirAjuda = function (quem, texto, caminho, para) {
    var dados = { titulo: 'Ajuda: ' + (texto || 'me dá uma mão?'), para: para || 'theus', prioridade: 'alta', estimativaMin: 15,
      descricao: (caminho ? 'Arquivo: ' + caminho + '. ' : '') + 'Pedido pelo botão "Pedir ajuda".' };
    if (dados.para === quem) dados.para = 'davi';
    var evs = A.novaDemanda(quem, dados);
    return evs.concat([ev('ajuda', quem, L.nome(quem) + ' pediu uma mão', { tv: true, textoTv: L.nome(quem) + ' pediu uma mão' + (caminho ? ' com "' + caminho.split('/').pop() + '"' : '') })]);
  };

  /* ======================= sonho ======================= */

  function calcularSonho(ts) {
    var e = E(), dia = ts - DIA;
    var novos = e.aprendizados.filter(function (a) { return a.ts > dia && a.ts <= ts; });
    var textos = [].concat(
      novos.map(function (a) { return a.texto; }),
      e.prompts.filter(function (p) { return p.ts > dia; }).map(function (p) { return p.texto; }),
      e.demandas.filter(function (d) { return d.criada > dia; }).map(function (d) { return d.titulo + ' ' + (d.descricao || ''); }),
      e.sala.momentos.filter(function (m) { return m.ts > dia; }).map(function (m) { return m.trechos.map(function (x) { return x.texto; }).join(' '); }));
    var perguntas = [];
    e.demandas.forEach(function (d) {
      var p = d.historico.filter(function (x) { return x.acao === 'perguntou'; }), r = d.historico.filter(function (x) { return x.acao === 'respondeu'; });
      if (p.length > r.length) perguntas.push(p[p.length - 1].nota + ' (' + d.titulo + ')');
    });
    Object.keys(e.mensagens).forEach(function (c) {
      var ms = e.mensagens[c], ult = ms[ms.length - 1];
      if (ult && /\?\s*$/.test(ult.texto)) perguntas.push(L.nome(ult.pessoa) + ': ' + ult.texto);
    });
    return {
      ts: ts, novos: novos.map(function (a) { return a.id; }), reforcados: e.aprendizados.filter(function (a) { return a.confirmacoes.length; }).length,
      temas: BC.acervo.termosFrequentes(textos, 6), perguntas: perguntas.slice(0, 5), top: L.topPrompts(3).map(function (p) { return p.id; }),
      ideiasFaladas: e.sala.momentos.filter(function (m) { return m.ts > dia; }).reduce(function (n, m) { return n + m.ideias.length; }, 0),
      total: e.aprendizados.length
    };
  }
  A.sonhoInicial = function () { var d = new Date(); d.setHours(3, 0, 0, 0); if (d.getTime() > Date.now()) d.setDate(d.getDate() - 1); E().sonho = calcularSonho(d.getTime()); };
  A.sonhar = function (quem) {
    E().sonho = calcularSonho(Date.now());
    A.gerarAprendizadosMd();
    return [ev('sonho', quem, 'O sonho refinou o dia: ' + E().sonho.novos.length + ' aprendizados novos e ' + E().sonho.temas.length + ' temas', { tv: true })];
  };

  /* ======================= sala: nada do que é dito se perde ======================= */

  var DICAS = /\b(e se|que tal|podia|podiamos|poderia|a gente podia|vamos testar|ideia)\b/;
  function ideiasEm(trechos) { return trechos.filter(function (x) { return DICAS.test(U.normalizar(x.texto)); }).map(function (x) { return x.texto; }); }

  A.gravarSala = function (quem, ligado) {
    var s = E().sala;
    s.gravando = !!ligado;
    s.desde = ligado ? Date.now() : null;
    return [ev('sala', quem, (ligado ? 'Gravação da sala ligada' : 'Gravação da sala desligada') + ' por ' + L.nome(quem), { tv: true })];
  };
  A.memoriaSala = function (quem, ligado) { E().sala.memoria = !!ligado; return []; };
  A.falaSala = function (quem, texto) {
    var s = E().sala;
    if (!s.memoria && !s.gravando) return;
    s.trechos.push({ quem: quem, texto: texto, ts: Date.now() });
    if (s.trechos.length > 40) s.trechos.shift();
    return [];
  };
  A.guardarMomento = function (quem) {
    var s = E().sala, agora = Date.now();
    var trechos = s.trechos.filter(function (x) { return agora - x.ts < 5 * MIN; });
    if (!trechos.length) trechos = s.trechos.slice(-4);
    if (!trechos.length) return;
    var m = { id: L._novoId('mo'), ts: agora, por: quem, trechos: trechos, ideias: ideiasEm(trechos) };
    s.momentos.unshift(m);
    return [ev('momento', quem, L.nome(quem) + ' guardou os últimos 5 minutos da sala' + (m.ideias.length ? ' · ' + m.ideias.length + ' ideia(s)' : ''), { tv: true })];
  };
  A.ideiaFalada = function (quem, texto) { return A.ideia(quem, texto, true); };
  /* "Começar a gravar": junta os minutos anteriores (5, ou até 10 segurando o botão) com o que vem depois */
  A.comecarGravarSala = function (quem, juntarMin) {
    var s = E().sala, min = juntarMin || 5;
    if (s.gravando) return;
    s.gravando = true;
    s.desde = Date.now() - min * MIN;
    s.juntou = min;
    return [ev('sala', quem, L.nome(quem) + ' começou a gravar a sala, com os ' + min + ' min anteriores', { tv: true })];
  };
  A.pararGravarSala = function (quem) {
    var s = E().sala;
    if (!s.gravando) return;
    var desde = s.desde, agora = Date.now();
    var trechos = s.trechos.filter(function (x) { return x.ts >= desde; });
    if (!trechos.length) trechos = s.trechos.slice(-5);
    s.gravando = false;
    s.desde = null;
    var m = { id: L._novoId('mo'), ts: agora, por: quem, trechos: trechos, ideias: ideiasEm(trechos), inicio: desde, ata: true };
    s.momentos.unshift(m);
    var md = ['# Conversa gravada · ' + U.hora(desde) + ' às ' + U.hora(agora), '', '> Gravada por ' + L.nome(quem) + ', com os ' + (s.juntou || 5) + ' minutos anteriores. O áudio foi apagado; ficou só o texto.', ''];
    trechos.forEach(function (x) { md.push('- **' + L.nome(x.quem) + '** (' + U.hora(x.ts) + '): ' + x.texto); });
    if (m.ideias.length) { md.push('', '## Ideias marcadas', ''); m.ideias.forEach(function (i) { md.push('- 💡 ' + i); }); }
    var evs = A.criarArquivo(quem, 'equipe/Reuniões/' + U.dataArquivo() + ' conversa ' + U.hora(desde).replace(':', 'h') + '.md', 'md', md.join('\n'), '1 KB');
    return evs.concat([ev('momento', quem, L.nome(quem) + ' parou a gravação: conversa das ' + U.hora(desde) + ' às ' + U.hora(agora) + ' foi para o acervo' + (m.ideias.length ? ' · ' + m.ideias.length + ' ideia(s)' : ''), { tv: true })]);
  };
  /* a sala sugere: uma frase com cara de ideia acabou de ser dita */
  A.ideiaSugerida = function (quem, texto) {
    if (!texto) return;
    E().sugestaoIdeia = { texto: texto, quem: quem, ts: Date.now() };
    return [ev('ideiaSugerida', quem, 'parece que saiu uma ideia · salvar?', { tv: true, discreto: true, textoTv: '💡 parece que saiu uma ideia: “' + texto.slice(0, 70) + '” · salvar?' })];
  };

  /* ======================= agentes com nome ======================= */

  var CORES_AGENTE = ['#c7a2ff', '#29ccec', '#7fd6a6', '#ffcf5c', '#ff7ab8', '#9fb4ff', '#f2a65a'];
  A.novoAgente = function (quem, dados) {
    var p = L.pessoa(quem);
    if (!p || !dados || !dados.nome) return;
    p.agentes = p.agentes || [];
    var ag = { id: L._novoId('ag'), nome: dados.nome.trim().slice(0, 18), oQueFaz: (dados.oQueFaz || '').trim(), cor: CORES_AGENTE[p.agentes.length % CORES_AGENTE.length], visivel: dados.visivel !== false, estado: 'parado' };
    p.agentes.push(ag);
    return [ev('agente', quem, L.nome(quem) + ' criou o agente ' + ag.nome, { discreto: true })];
  };
  A.renomearAgente = function (quem, id, nome) { var p = L.pessoa(quem), ag = p && (p.agentes || []).filter(function (a) { return a.id === id; })[0]; if (!ag || !nome) return; ag.nome = nome.trim().slice(0, 18); return []; };
  A.apagarAgente = function (quem, id) { var p = L.pessoa(quem); if (!p) return; p.agentes = (p.agentes || []).filter(function (a) { return a.id !== id; }); return []; };
  A.agenteEstado = function (quem, id, estado) { var p = L.pessoa(quem), ag = p && (p.agentes || []).filter(function (a) { return a.id === id; })[0]; if (!ag) return; ag.estado = estado; return []; };

  /* ======================= ver e mexer no terminal dos outros ======================= */

  function mesmoProjeto(a, b) { return (E().projetos || []).some(function (p) { return p.membros.indexOf(a) !== -1 && p.membros.indexOf(b) !== -1; }); }
  function controleDe(id) { return (E().controles || []).filter(function (c) { return c.id === id; })[0]; }
  A.pedirEntrar = function (quem, dono, agenteId) {
    if (!L.pessoa(dono) || dono === quem) return;
    var cs = E().controles = E().controles || [];
    if (cs.some(function (c) { return c.quem === quem && c.dono === dono && c.estado !== 'encerrado'; })) return [];
    var direto = admin(quem) || mesmoProjeto(quem, dono);
    var c = { id: L._novoId('ct'), dono: dono, agenteId: agenteId || null, quem: quem, estado: direto ? 'ativo' : 'pedido', ts: Date.now() };
    cs.push(c);
    var ag = ((L.pessoa(dono) || {}).agentes || []).filter(function (a) { return a.id === c.agenteId; })[0];
    var nomeT = 'terminal' + (ag ? ' ' + ag.nome : '');
    if (direto) return [ev('controle', quem, L.nome(quem) + ' entrou no seu ' + nomeT, { para: dono, controle: c.id, textoTv: L.nome(quem) + ' entrou no terminal de ' + L.nome(dono), tv: true, discreto: true })];
    return [ev('controle-pedido', quem, L.nome(quem) + ' quer entrar no seu ' + nomeT, { para: dono, controle: c.id })];
  };
  A.aceitarEntrar = function (quem, id) { var c = controleDe(id); if (!c || c.dono !== quem || c.estado !== 'pedido') return; c.estado = 'ativo'; c.ts = Date.now(); return [ev('controle', quem, L.nome(quem) + ' deixou você entrar no terminal', { para: c.quem, controle: c.id })]; };
  A.recusarEntrar = function (quem, id) { var c = controleDe(id); if (!c || c.dono !== quem) return; c.estado = 'encerrado'; return [ev('controle-fim', quem, L.nome(quem) + ' disse "agora não"', { para: c.quem, discreto: true })]; };
  A.sairTerminal = function (quem, id) { var c = controleDe(id); if (!c || (c.quem !== quem && c.dono !== quem)) return; c.estado = 'encerrado'; return [ev('controle-fim', quem, (quem === c.dono ? L.nome(quem) + ' encerrou o controle' : L.nome(quem) + ' saiu do terminal de ' + L.nome(c.dono)), { para: quem === c.dono ? c.quem : c.dono, discreto: true })]; };
  /* quem controla digita: a linha vai para o terminal do dono, com o nome de quem digitou */
  A.controleDigitar = function (quem, id, texto) {
    var c = controleDe(id);
    if (!c || c.quem !== quem || c.estado !== 'ativo' || !texto) return;
    var lista = E().terminais[c.dono] || (E().terminais[c.dono] = []);
    lista.push({ ts: Date.now(), tipo: 'cmd', texto: texto, por: quem });
    var saida = /^coop /.test(texto) ? 'ok' : /^(ls|pwd)$/.test(texto) ? 'Projetos  notas  README.md' : /^npm test/.test(texto) ? '14 passed · 0 failed' : /^git /.test(texto) ? 'On branch main · nothing to commit' : /^cd /.test(texto) ? '' : 'feito';
    if (saida) lista.push({ ts: Date.now() + 1, tipo: 'saida', texto: saida });
    if (lista.length > 200) lista.splice(0, lista.length - 200);
    return [];
  };
  A.chamarParaTela = function (quem, para, oQue) {
    if (!L.pessoa(para) || para === quem) return;
    return [ev('chamado', quem, L.nome(quem) + ' te chamou para ver ' + (oQue || 'a tela dele(a)'), { para: para, chamado: oQue || '' })];
  };
  A.fazendo = function (quem, texto) { E().fazendo = E().fazendo || {}; E().fazendo[quem] = texto; return []; };
  A.vendoArquivo = function (quem, arquivoId) { E().vendo = E().vendo || {}; if (arquivoId) E().vendo[quem] = { arquivo: arquivoId, ts: Date.now() }; else delete E().vendo[quem]; return []; };

  /* ======================= projetos ======================= */

  A.novoProjeto = function (quem, dados) {
    if (!dados || !dados.nome) return;
    var membros = (dados.membros || []).slice();
    if (membros.indexOf(quem) === -1) membros.unshift(quem);
    var pr = { id: L._novoId('pj'), nome: dados.nome.trim(), membros: membros, desde: Date.now(), pasta: 'Projetos/' + dados.nome.trim().replace(/[\/\\]/g, '-'), canal: null, conversas: {}, proximos: [], descricao: dados.descricao || '' };
    E().projetos = E().projetos || [];
    E().projetos.unshift(pr);
    var evs = [ev('projeto', quem, L.nome(quem) + ' criou o projeto "' + pr.nome + '" com ' + membros.length + ' pessoas', { tv: true })];
    membros.forEach(function (m) { if (m !== quem) evs.push(ev('projeto-convite', quem, L.nome(quem) + ' te colocou no projeto "' + pr.nome + '"', { para: m, discreto: true })); });
    return evs;
  };
  A.entrarProjeto = function (quem, id, pessoa) {
    var pr = (E().projetos || []).filter(function (p) { return p.id === id; })[0], alvo = pessoa || quem;
    if (!pr || pr.membros.indexOf(alvo) !== -1 || !L.pessoa(alvo)) return;
    pr.membros.push(alvo);
    return [ev('projeto', quem, L.nome(alvo) + ' entrou no projeto "' + pr.nome + '"', { para: alvo !== quem ? alvo : undefined, discreto: true })];
  };
  A.proximoPasso = function (quem, id, texto, pessoa) {
    var pr = (E().projetos || []).filter(function (p) { return p.id === id; })[0];
    if (!pr || !texto) return;
    pr.proximos.push({ texto: texto, quem: pessoa || quem, ts: Date.now() });
    return [];
  };
  A.mensagemProjeto = function (quem, id, com, texto, arquivoId) {
    var pr = (E().projetos || []).filter(function (p) { return p.id === id; })[0];
    if (!pr || (!texto && !arquivoId)) return;
    var chave = com || 'todos', lista = pr.conversas[chave] || (pr.conversas[chave] = []);
    lista.push({ id: L._novoId('pm'), pessoa: quem, texto: texto || '', ts: Date.now(), arquivo: arquivoId || null });
    if (chave !== 'todos' && chave !== quem) return [ev('direta', quem, L.nome(quem) + ' (' + pr.nome + '): ' + (texto || 'mandou um arquivo').slice(0, 80), { para: chave, discreto: true })];
    return [];
  };
  /* arrastar um arquivo para uma pessoa: cópia na pasta de projeto dela, com "recebido de" */
  A.enviarArquivo = function (quem, arquivoId, para, projetoId) {
    var a = L.arquivo(arquivoId), p = L.pessoa(para);
    if (!a || !p || para === a.dono) return;
    var pr = (E().projetos || []).filter(function (x) { return x.id === projetoId; })[0];
    var rel = a.caminho.split('/').slice(1).join('/');
    if (pr && rel.indexOf(pr.pasta + '/') === 0) rel = rel.slice(pr.pasta.length + 1);
    var caminho = para + '/' + (pr ? pr.pasta + '/' : 'recebidos/') + rel.split('/').pop();
    if (L.arquivo(caminho)) caminho = caminho.replace(/(\.[a-z0-9]+)$/i, ' (' + L.nome(quem).toLowerCase() + ')$1');
    var novo = { id: L._novoId('f'), caminho: caminho, dono: para, autor: quem, tipo: a.tipo, tamanho: a.tamanho, modificado: Date.now(), conteudo: a.conteudo, versoes: [], consultas: 0, salvoPor: quem, salvoEm: Date.now(), recebidoDe: quem, recebidoEm: Date.now() };
    E().arquivos.push(novo);
    return [ev('arquivo-enviado', quem, L.nome(quem) + ' mandou "' + nomeArq(a) + '" para ' + L.nome(para), { para: para, arquivo: novo.id, tv: true, discreto: true })];
  };

  /* ======================= WhatsApp com o agente ======================= */

  function conversaWa(id) { return (E().whatsapp.conversas || []).filter(function (c) { return c.id === id; })[0]; }
  function sugestaoPara(texto) {
    var t = U.normalizar(texto || '');
    if (/proposta/.test(t)) return 'Chega hoje ainda! Estou fechando os últimos detalhes e te mando até as 18h. Posso já reservar o horário de implantação para segunda?';
    if (/horario|atendimento|suporte/.test(t)) return 'O suporte atende de segunda a sexta, das 8h às 19h, e a Babel responde os pacientes 24h. Se precisar fora do horário, é só chamar por aqui.';
    if (/desconto|anual|preco|preço|valor/.test(t)) return 'O plano anual tem 2 meses de desconto e continua valendo. Quer que eu mande a simulação com os valores?';
    if (/comecar|começar|segunda|quando/.test(t)) return 'Conseguimos começar na segunda, sim. Preciso só do número que vai ser usado e de um responsável na clínica.';
    if (/obrigad|valeu/.test(t)) return 'Nós que agradecemos! Qualquer coisa, é só chamar por aqui.';
    return 'Recebi, obrigado! Vou verificar e te respondo em até 1 hora.';
  }
  A.waParear = function (quem) { E().whatsapp.pareado = true; return []; };
  A.waSugerir = function (quem, convId, agenteNome) {
    var c = conversaWa(convId);
    if (!c) return;
    var ult = c.mensagens.filter(function (m) { return m.de === 'eles'; }).pop();
    if (!ult) return;
    c.sugestao = { texto: sugestaoPara(ult.texto), agente: agenteNome || 'Assistente', ts: Date.now() };
    return [];
  };
  A.waEnviar = function (quem, convId, texto, de) {
    var c = conversaWa(convId);
    if (!c || !texto) return;
    c.mensagens.push({ de: de || 'eu', texto: texto, ts: Date.now(), agente: de === 'agente' ? (c.sugestao && c.sugestao.agente) : undefined });
    c.sugestao = null;
    return [];
  };
  A.waLimparSugestao = function (quem, convId) { var c = conversaWa(convId); if (!c) return; c.sugestao = null; return []; };
  A.waAutomatico = function (quem, convId, ligado) { var c = conversaWa(convId); if (!c) return; c.automatico = !!ligado; return []; };
  A.waReceber = function (quem, convId, texto, agenteNome) {
    var c = conversaWa(convId);
    if (!c || !texto) return;
    c.mensagens.push({ de: 'eles', texto: texto, ts: Date.now() });
    if (c.automatico) c.mensagens.push({ de: 'agente', texto: sugestaoPara(texto), ts: Date.now() + 1, agente: agenteNome || 'Assistente' });
    else c.sugestao = { texto: sugestaoPara(texto), agente: agenteNome || 'Assistente', ts: Date.now() };
    return [];
  };

  /* ======================= loja da equipe ======================= */

  function itemLoja(id) { return (E().lojaEquipe || []).filter(function (i) { return i.id === id; })[0]; }
  A.lojaInstalar = function (quem, id) {
    var it = itemLoja(id);
    if (!it) return;
    if (it.precisaChave && !(E().chaves[quem] || {})[it.precisaChave]) return;
    it.instaladoPor[quem] = it.versao;
    return [ev('loja', quem, L.nome(quem) + ' instalou "' + it.nome + '" de ' + L.nome(it.dono), { discreto: true })];
  };
  A.lojaAtualizar = function (quem, id) { var it = itemLoja(id); if (!it || !it.instaladoPor[quem]) return; it.instaladoPor[quem] = it.versao; return []; };
  A.lojaChave = function (quem, nomeChave) { if (!nomeChave) return; (E().chaves[quem] = E().chaves[quem] || {})[nomeChave] = true; return []; };
  A.lojaPublicar = function (quem, dados) {
    if (!dados || !dados.nome) return;
    var it = { id: L._novoId('lj'), tipo: dados.tipo || 'skill', nome: dados.nome.trim(), dono: quem, descricao: (dados.descricao || '').trim(), versao: 1, precisaChave: dados.precisaChave || null, instaladoPor: {}, atualizadoEm: Date.now() };
    E().lojaEquipe.unshift(it);
    var TIPOS = { skill: 'a skill', mcp: 'o MCP', plugin: 'o plugin', agente: 'o agente', claudemd: 'o CLAUDE.md' };
    return [ev('loja', quem, L.nome(quem) + ' publicou ' + (TIPOS[it.tipo] || 'o item') + ' "' + it.nome + '" na Loja da equipe', { tv: true })];
  };
  A.lojaNovaVersao = function (quem, id) { var it = itemLoja(id); if (!it || it.dono !== quem) return; it.versao++; it.atualizadoEm = Date.now(); return [ev('loja', quem, L.nome(quem) + ' atualizou "' + it.nome + '" (v' + it.versao + ')', { discreto: true })]; };

  /* ======================= a equipe responde ao que você faz ======================= */

  var DEVOLUCOES = ['Faltou o anexo.', 'Pode revisar o último parágrafo?', 'O valor está diferente da proposta.'];
  var RESPOSTAS = ['Combinado!', 'Boa, vou ver agora.', 'Fechado, obrigado!', 'Pode deixar comigo.', '👍'];

  function depois(ms, fn) { setTimeout(function () { if (!L.lider) return; try { fn(); } catch (e) { console.error(e); } }, ms); }

  A._reagir = function (nome, a) {
    /* no app real (ponte.js, window.COOP_REAL) quem responde é a pessoa, pelo diário. Sem esta trava, 3 s depois de uma
       mensagem direta aparecia "Combinado!" em nome de quem estava online, só nesta tela e sumindo ao recarregar (26/09/2026) */
    if (window.COOP_REAL) return;
    var d = typeof a === 'string' ? L.demanda(a) : null;
    if (nome === 'pronta' && d && ativo(d.de)) {
      depois(U.entre(8000, 13000), function () {
        var x = L.demanda(d.id);
        if (!x || x.estado !== 'pronta') return;
        if (x.devolucoes === 0 && Math.random() < 0.25) L.fazerComo(x.de, 'devolver', x.id, U.sorteia(DEVOLUCOES));
        else L.fazerComo(x.de, 'ok', x.id);
      });
    }
    if (nome === 'novaDemanda' && a && ativo(a.para)) {
      var nova = E().demandas[0];
      depois(U.entre(12000, 18000), function () { L.fazerComo(nova.para, 'comecar', nova.id); });
    }
    if (nome === 'perguntar' && d && ativo(d.de)) depois(7000, function () { L.fazerComo(d.de, 'responder', d.id, 'Pode seguir assim, obrigado por perguntar.'); });
    if (nome === 'cutucar' && d && ativo(d.para) && d.estado === 'enviada') depois(6000, function () { L.fazerComo(d.para, 'comecar', d.id); });
    if (nome === 'mensagem' && typeof a === 'string') {
      var c = L.conversa(a);
      if (c && c.tipo === 'direta') {
        var outro = c.membros.filter(function (x) { return x !== L.eu; })[0];
        if (ativo(outro)) {
          if (BC.chat) BC.chat.digitando(a, outro, 2800);
          depois(3000, function () { L.fazerComo(outro, 'mensagem', a, U.sorteia(RESPOSTAS)); });
        }
      }
      if (c && c.tipo === 'cliente') {
        if (BC.chat) BC.chat.digitando(a, 'cliente', 4000);
        depois(4300, function () { L.fazerComo('cliente', 'mensagem', a, 'Perfeito, obrigada! Aguardo a proposta.'); });
      }
    }
  };
})(window.BC);
