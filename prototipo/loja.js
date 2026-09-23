/* Babel Coop — protótipo · núcleo do estado: canal entre janelas, consultas e eventos
   (as ações ficam em acoes.js e a equipe simulada em simulador.js) */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var U = BC.util, MIN = U.MIN, HORA = U.HORA, DIA = U.DIA;

  /* ---------- canal entre janelas (Estação ↔ TV ↔ iPad) ---------- */

  var ID = Math.random().toString(36).slice(2, 10);
  var vistos = [];
  var ouvintesCanal = [];
  var bc = null;

  try {
    bc = new BroadcastChannel('babel-coop');
    bc.onmessage = function (e) { receber(e.data); };
  } catch (e) { bc = null; }

  window.addEventListener('storage', function (e) {
    if (e.key !== 'babel-coop:msg' || !e.newValue) return;
    try { receber(JSON.parse(e.newValue)); } catch (x) { /* mensagem ilegível */ }
  });

  function receber(msg) {
    if (!msg || msg.de === ID || vistos.indexOf(msg.n) !== -1) return;
    vistos.push(msg.n);
    if (vistos.length > 120) vistos.shift();
    ouvintesCanal.forEach(function (fn) { fn(msg); });
  }

  BC.canal = {
    id: ID,
    enviar: function (msg, soAoVivo) {
      msg.de = ID;
      msg.n = ID + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
      if (bc) { try { bc.postMessage(msg); } catch (e) { /* canal fechado */ } }
      if (!soAoVivo || !bc) { try { localStorage.setItem('babel-coop:msg', JSON.stringify(msg)); } catch (e) { /* cheio ou bloqueado */ } }
    },
    ouvir: function (fn) { ouvintesCanal.push(fn); }
  };

  /* ---------- estado ---------- */

  var ESQUEMA = 5; /* versão do estado: janelas com versão diferente (protótipo antigo aberto) não trocam estado */
  var L = { estado: null, eu: 'theus', papel: 'estacao', lider: false, A: {}, esquema: ESQUEMA };
  var ouvintes = [], vivos = {}, seqLocal = 0;

  L.iniciar = function (papel) {
    L.papel = papel;
    L.estado = BC.criarEstado();
    L.estado.v = 0;
    L.estado.esquema = ESQUEMA;
    var salvo = U.ler('babel-coop:eu');
    if (salvo && L.pessoa(salvo)) L.eu = salvo;
    if (L.A.gerarAprendizadosMd) L.A.gerarAprendizadosMd();
    if (L.A.sonhoInicial) L.A.sonhoInicial();
    BC.canal.ouvir(aoReceber);
    BC.canal.enviar({ tipo: 'pedir-estado', esquema: ESQUEMA });
    batida();
    setInterval(batida, 2000);
    setInterval(verificarLider, 2000);
    setTimeout(verificarLider, papel === 'estacao' ? 600 : 3500);
  };

  L.aoMudar = function (fn) { ouvintes.push(fn); };
  L.aoReceber = function (fn) { ouvintesCanal.push(fn); };

  function avisar(novos) {
    ouvintes.forEach(function (fn) { try { fn(L.estado, novos || []); } catch (e) { console.error(e); } });
  }

  L._mudou = function (novos) {
    L.estado.v = (L.estado.v || 0) + 1;
    L.estado.esquema = ESQUEMA;
    avisar(novos);
    BC.canal.enviar({ tipo: 'estado', estado: L.estado, esquema: ESQUEMA });
  };

  function adotar(novo) {
    var conhecidos = {};
    L.estado.eventos.forEach(function (e) { conhecidos[e.id] = true; });
    var novos = novo.eventos.filter(function (e) { return !conhecidos[e.id]; });
    L.estado = novo;
    avisar(novos);
  }

  function aoReceber(msg) {
    if (msg.esquema !== ESQUEMA) return;
    if (msg.tipo === 'batida') { vivos[msg.de] = { papel: msg.papel, ts: Date.now(), eu: msg.eu }; return; }
    if (msg.tipo === 'pedir-estado') { if (L.lider) BC.canal.enviar({ tipo: 'estado', estado: L.estado, esquema: ESQUEMA }); return; }
    if (msg.tipo === 'estado' && msg.estado && msg.estado.esquema === ESQUEMA && (msg.estado.v || 0) >= (L.estado.v || 0)) adotar(msg.estado);
  }

  function batida() { BC.canal.enviar({ tipo: 'batida', papel: L.papel, eu: L.eu, esquema: ESQUEMA }, true); }

  function verificarLider() {
    var agora = Date.now(), eraLider = L.lider, lider = true;
    Object.keys(vivos).forEach(function (id) {
      var v = vivos[id];
      if (agora - v.ts > 6500) { delete vivos[id]; return; }
      if (L.papel !== 'estacao' && v.papel === 'estacao') lider = false;
      if (L.papel === 'ipad' && v.papel === 'tv') lider = false;
      if (v.papel === L.papel && id < ID) lider = false;
    });
    L.lider = lider;
    if (lider && !eraLider && BC.simulador) BC.simulador.iniciar();
    if (!lider && eraLider && BC.simulador) BC.simulador.parar();
  }

  L.conectado = function (papel) {
    var agora = Date.now();
    return Object.keys(vivos).some(function (id) { return vivos[id].papel === papel && agora - vivos[id].ts < 6500; });
  };

  /* ---------- consultas ---------- */

  function achar(lista, id) { for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i]; return null; }
  L.pessoa = function (id) { return achar(L.estado.pessoas, id); };
  L.nome = function (id) { if (id === 'cliente') return 'Cliente'; var p = L.pessoa(id); return p ? p.nome : id; };
  L.fluxo = function (id) { return achar(L.estado.fluxos, id); };
  L.tarefa = function (id) { return achar(L.estado.tarefas, id); };
  L.demanda = function (id) { return achar(L.estado.demandas, id); };
  L.arquivo = function (idOuCaminho) {
    var lista = L.estado.arquivos;
    for (var i = 0; i < lista.length; i++) if (lista[i].id === idOuCaminho || lista[i].caminho === idOuCaminho) return lista[i];
    return null;
  };
  L.conversa = function (id) { return achar(L.estado.conversas, id); };
  L.eAdmin = function () { var p = L.pessoa(L.eu); return !!(p && p.papel === 'admin'); };
  L.podeEditar = function (a) { return !!a && (a.dono === L.eu || a.dono === 'equipe' || L.eAdmin()); };
  L.online = function (id) { var p = L.pessoa(id); return !!p && p.status !== 'offline'; };

  L.pct = function (t) {
    var n = L.fluxo(t.fluxo).etapas.length;
    return Math.round(Math.min(t.atual, n) / n * 100);
  };

  L.tempo = function (d, agora) {
    agora = agora || Date.now();
    if (!d.inicio) return { total: 0, parado: 0, trabalho: 0, porMotivo: {}, pausaAberta: null };
    var fim = d.fim || agora, parado = 0, porMotivo = {}, aberta = null;
    d.pausas.forEach(function (p) {
      var dur = Math.max(0, (p.fim || fim) - p.inicio);
      parado += dur;
      porMotivo[p.motivo] = (porMotivo[p.motivo] || 0) + dur;
      if (!p.fim) aberta = p;
    });
    var total = fim - d.inicio;
    return { total: total, parado: parado, trabalho: Math.max(0, total - parado), porMotivo: porMotivo, pausaAberta: aberta };
  };

  L.segmentos = function (d, agora) {
    if (!d.inicio) return [];
    agora = agora || Date.now();
    var fim = d.fim || agora, segs = [], cursor = d.inicio;
    d.pausas.slice().sort(function (a, b) { return a.inicio - b.inicio; }).forEach(function (p) {
      if (p.inicio > cursor) segs.push([cursor, Math.min(p.inicio, fim)]);
      cursor = Math.max(cursor, p.fim || fim);
    });
    if (cursor < fim) segs.push([cursor, fim]);
    return segs;
  };

  L.trabalhoHoje = function (pessoaId) {
    var ini = new Date(); ini.setHours(0, 0, 0, 0);
    var a0 = ini.getTime(), agora = Date.now(), soma = 0;
    L.estado.demandas.forEach(function (d) {
      if (pessoaId && d.para !== pessoaId) return;
      L.segmentos(d, agora).forEach(function (s) {
        var a = Math.max(s[0], a0), b = Math.min(s[1], agora);
        if (b > a) soma += b - a;
      });
    });
    return soma;
  };

  L.rodando = function (pessoaId) {
    return L.estado.demandas.filter(function (d) { return d.para === pessoaId && d.estado === 'andamento'; });
  };
  L.ultimaPausa = function (d) { return d.pausas.length ? d.pausas[d.pausas.length - 1] : { motivo: '' }; };

  /* conversas que a pessoa vê e quantas não lidas */
  L.minhasConversas = function (pessoaId) {
    return L.estado.conversas.filter(function (c) { return !c.membros || c.membros.indexOf(pessoaId) !== -1; });
  };
  L.naoLidas = function (pessoaId, convId) {
    var lidas = (L.estado.lidas[pessoaId] || {})[convId] || 0;
    return (L.estado.mensagens[convId] || []).filter(function (m) { return m.pessoa !== pessoaId && m.ts > lidas; }).length;
  };
  L.nomeConversa = function (c, pessoaId) {
    if (c.tipo !== 'direta') return c.nome;
    var outro = c.membros.filter(function (m) { return m !== pessoaId; })[0];
    return L.nome(outro);
  };
  L.conversaDireta = function (a, b) { return 'dm:' + [a, b].sort().join(':'); };

  /* sinais de "cuidando da gente" (contas simples, sem IA) */
  L.cuidados = function () {
    var e = L.estado, agora = Date.now(), r = [];
    function ajuda(p) {
      var mesma = e.pessoas.filter(function (o) { return o.id !== p.id && o.area === p.area && o.status !== 'offline'; })[0];
      return mesma ? mesma.id : 'theus';
    }
    e.pessoas.forEach(function (p) {
      if (e.cuidadoOk[p.id] && agora - e.cuidadoOk[p.id] < 2 * HORA) return;
      e.demandas.forEach(function (d) {
        if (d.para !== p.id) return;
        if (d.estado === 'andamento') {
          var tt = L.tempo(d).trabalho, est = (d.estimativaMin || 60) * MIN;
          if (tt > est * 1.5 && tt > 30 * MIN) r.push({ pessoa: p.id, tipo: 'tempo', texto: 'está há ' + U.duracao(tt) + ' em "' + d.titulo + '"', detalhe: 'a estimativa era ' + U.duracao(est), ajuda: ajuda(p), demanda: d.id });
        }
        if (d.estado === 'pausada' && L.ultimaPausa(d).motivo === 'travado') r.push({ pessoa: p.id, tipo: 'travado', texto: 'pediu uma mão em "' + d.titulo + '"', detalhe: 'marcou "estou travado"', ajuda: ajuda(p), demanda: d.id });
      });
      var trocas = 0;
      e.demandas.forEach(function (d) { trocas += d.historico.filter(function (h) { return h.quem === p.id && h.nota === 'trocou de demanda' && agora - h.ts < HORA; }).length; });
      if (trocas >= 3) r.push({ pessoa: p.id, tipo: 'trocas', texto: 'trocou de tarefa ' + trocas + ' vezes na última hora', detalhe: 'pode estar sendo puxado para muitos lados', ajuda: 'theus' });
      if (agora - p.ultimaVez > DIA && p.status !== 'ausente') r.push({ pessoa: p.id, tipo: 'sumido', texto: 'não abre a Estação há ' + Math.floor((agora - p.ultimaVez) / DIA) + ' dias', detalhe: 'vale uma mensagem', ajuda: 'theus' });
      var ck = e.checkins[p.id];
      if (ck && ck.bloqueio && U.mesmoDia(ck.ts)) r.push({ pessoa: p.id, tipo: 'bloqueio', texto: 'registrou um bloqueio no check-in', detalhe: ck.bloqueio, ajuda: 'theus' });
    });
    return r;
  };

  /* os melhores prompts, com os critérios à vista */
  L.pontosPrompt = function (p) {
    return p.estrelas.length * 2 + p.reusos * 1.5 + (p.resultado === 'ok' ? 2 : p.resultado === 'devolvida' ? -3 : 0) + (p.texto.length > 40 ? 1 : 0);
  };
  L.topPrompts = function (n) {
    return L.estado.prompts.slice().sort(function (a, b) { return L.pontosPrompt(b) - L.pontosPrompt(a); }).slice(0, n || 3);
  };

  /* ---------- eventos ---------- */

  L._evento = function (tipo, pessoa, texto, extra) {
    var ev = { id: 'e-' + ID + '-' + (++seqLocal), tipo: tipo, pessoa: pessoa, texto: texto, ts: Date.now() };
    if (extra) Object.keys(extra).forEach(function (k) { ev[k] = extra[k]; });
    L.estado.eventos.unshift(ev);
    if (L.estado.eventos.length > 90) L.estado.eventos.length = 90;
    return ev;
  };
  L._novoId = function (prefixo) { return prefixo + '-' + ID + '-' + (++seqLocal); };

  /* aplica uma ação em nome de quem usa esta janela */
  L.fazer = function (nome, a, b, c, d) {
    var fn = L.A[nome];
    if (!fn) return false;
    var r = fn(L.eu, a, b, c, d);
    if (r === 'cedo') return 'cedo';
    if (!r) return false;
    L._mudou(r);
    if (L.A._reagir) L.A._reagir(nome, a, b);
    return true;
  };

  /* uma pessoa da equipe (simulada) age */
  L.fazerComo = function (quem, nome, a, b, c) {
    var fn = L.A[nome];
    if (!fn) return false;
    var r = fn(quem, a, b, c);
    if (r && r !== 'cedo') { L._mudou(r); return true; }
    return false;
  };

  L.verComo = function (id) {
    if (!L.pessoa(id)) return;
    L.eu = id;
    U.guardar('babel-coop:eu', id);
    avisar([]);
  };

  BC.loja = L;
})(window.BC);
