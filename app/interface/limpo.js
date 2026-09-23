/* babel-coop · app limpo: no app real o estado nasce vazio e válido, só com as pessoas de verdade
   Carregado pelo servidor (INJETAR) depois da ponte e antes do app.js: troca BC.criarEstado antes de a loja iniciar.
   O protótipo puro (sem window.COOP_REAL) continua com a equipe e os dados de exemplo; o roteiro dele não muda.
   Quem enche o estado daqui em diante é o diário real (a ponte aplica os eventos) e a pasta real (arquivos-real.js). */
(function () {
  'use strict';
  var BC = window.BC;
  /* COOP_REAL.exemplos (BABEL_COOP_EXEMPLOS=1, só nos testes que precisam da equipe de exemplo) mantém os dados do protótipo */
  if (!window.COOP_REAL || window.COOP_REAL.exemplos || !BC || !BC.loja || typeof BC.criarEstado !== 'function' || BC.criarEstado.__limpo) return;
  var L = BC.loja;

  /* quem sou eu, antes de o app.js desenhar a primeira tela (pedido local, síncrono, uma vez) */
  var eu = null;
  try {
    var x = new XMLHttpRequest();
    x.open('GET', '/api/eu', false);
    x.send();
    if (x.status === 200) eu = JSON.parse(x.responseText);
  } catch (e) { eu = null; }
  var euId = (eu && eu.id) || 'eu';

  function corDe(id) { return BC.real && BC.real.corDe ? BC.real.corDe(id) : '#8670ff'; }
  function pessoa(p, status) {
    return { id: p.id, nome: p.nome || p.id, area: p.papel === 'gestao' ? 'gestao' : 'geral', cor: corDe(p.id), status: status, papel: p.papel === 'gestao' ? 'admin' : 'membro',
      foto: null, ultimaVez: Date.now(), naoMostrarCuidado: false, agentes: [], _real: true };
  }

  var criarOriginal = BC.criarEstado;
  BC.criarEstado = function () {
    var ex = criarOriginal.apply(this, arguments), t = Date.now();
    var pessoas = [pessoa({ id: euId, nome: (eu && eu.nome) || 'Você', papel: eu && eu.papel }, 'online')];
    ((eu && eu.pares) || []).forEach(function (p) { if (p && p.id && p.id !== euId) pessoas.push(pessoa(p, p.ligado ? 'online' : 'offline')); });
    var areas = {}; Object.keys(ex.areas || {}).forEach(function (k) { areas[k] = ex.areas[k]; }); areas.geral = 'Geral';
    var limpo = {
      areas: areas, pessoas: pessoas, fluxos: ex.fluxos || [], /* os fluxos são moldes (Proposta, Chamado…), não dados */
      demandas: [], tarefas: [], arquivos: [], metas: [],
      campanha: { nome: 'Sem campanha', descricao: '', atual: 0, alvo: 0, fim: null }, cronometroTv: null,
      avisos: [], mural: [],
      conversas: [{ id: 'geral', tipo: 'grupo', nome: 'babel-coop · todos', fixada: true }], mensagens: { geral: [] }, lidas: {},
      checkins: {},
      reuniao: { ativa: false, titulo: '', inicio: null, condutor: null, pauta: [], materiais: [], destaque: null, decisoes: [], proximos: [], participantes: [] },
      ideias: [], pergunta: { texto: (ex.pergunta && ex.pergunta.texto) || 'Que trabalho acontece hoje fora de qualquer sistema, e ninguém vê?', desde: t, respostas: [] },
      aprendizados: [], prompts: [], terminais: {}, transmissao: {}, eventos: [],
      sala: { gravando: false, desde: null, memoria: true, trechos: [], momentos: [] },
      seq: 100, concluidasHoje: 0, projecao: null, visita: false, temaTv: ex.temaTv || 'roxo', tvModo: 'painel', tvQuadro: null, tvSite: null,
      regras: { pausaAutomatica: false }, cuidadoOk: {}, sonho: null,
      controles: [], projetos: [], whatsapp: { pareado: false, conversas: [] }, lojaEquipe: [], chaves: {},
      fazendo: {}, vendo: {}, campanhas: [], sugestaoIdeia: null, presets: [],
      app: { versao: 0, notas: '', publicadaEm: null, por: euId, construtores: [euId], mudancas: [], instalada: {}, historico: [] },
      memoria: { usos: {}, ultimo: {}, luzes: [], pontos: {} }
    };
    /* chave que outra peça acrescentar ao estado de exemplo: nasce vazia com o mesmo tipo */
    Object.keys(ex).forEach(function (k) {
      if (k in limpo) return;
      var v = ex[k];
      limpo[k] = Array.isArray(v) ? [] : v && typeof v === 'object' ? {} : v;
    });
    return limpo;
  };
  BC.criarEstado.__limpo = true;

  /* eu desde a primeira tela (a loja só troca L.eu se a pessoa salva existir) */
  L.eu = euId;
  try { localStorage.setItem('babel-coop:eu', JSON.stringify(euId)); } catch (e) { /* sem armazenamento */ }

  /* sem arquivo gerado a partir de nada: APRENDIZADOS.md só nasce quando existe um aprendizado */
  if (L.A && L.A.gerarAprendizadosMd) {
    var gerar = L.A.gerarAprendizadosMd;
    L.A.gerarAprendizadosMd = function () {
      var e = L.estado;
      if (e && !(e.aprendizados || []).length && !L.arquivo('equipe/Aprendizados/APRENDIZADOS.md')) return;
      return gerar.apply(this, arguments);
    };
  }

  /* "Ver como" é ferramenta de teste do protótipo: no app real cada um é quem é */
  var verComo = L.verComo;
  L.verComo = function (id) { if (id === L.eu) return verComo.call(L, id); };

  /* a casca sem os rótulos de protótipo (CONCEITO §3.4) */
  function casca() {
    var sub = document.querySelector('.e-marca-sub'); if (sub) { sub.textContent = ''; sub.hidden = true; }
    var vc = document.getElementById('ver-como'); if (vc && vc.closest('label')) vc.closest('label').hidden = true;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', casca); else casca();

  BC.limpo = { eu: function () { return eu; }, ativo: true };
})();
