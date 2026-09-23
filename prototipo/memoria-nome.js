/* babel-coop · memoria-nome.js · A MEMÓRIA TEM NOME
   PLANO §1 propriedade 3 ("Aprendizado · Davi · reembolso · usado 7×", e o Davi vê a luz acender; todo agente novo
   nasce sabendo) · §3 "F · Acervo · Inteligência" · REGUA_ORGANISMO R1 (luz só com evento real), R3 (ponto com origem),
   R4 (pessoal informa, só a pessoa vê), R7 (retorno social ligado à contribuição: a luz vai para o autor; nunca
   "quem consultou o quê" para os outros).

   O que é memória com nome: aprendizados, presets, prompts, ideias, ideias faladas (momentos da sala) e atas, cada uma
   com autor e usos. Um USO é alguém (ou o agente de alguém) pondo a memória para trabalhar: "Usar" no Acervo, "Usar no
   terminal" de um prompt, um preset montado na Máquina, ou a presença consultando o acervo (BC.memoria.consultar).
   Regras do uso (para a pontuação não inflar):
   - o autor usando a própria memória não conta;
   - a mesma pessoa e a mesma memória contam uma vez por hora;
   - cada uso conta +1 no "usado N×" e dá +2 ao autor (régua §3: "uso do meu trabalho 2"), com a origem.
   O autor vê: um cartão de vidro (HUD) "Carla usou o seu aprendizado" com a luz dirigida que esfria (meia-vida curta de
   6 s, --mv-curta), o pulso roxo → ciano vindo do Acervo, faíscas, +2 com a origem. Ninguém mais vê esse cartão, e o
   uso não entra em Novidades, na TV nem no mural.

   Tudo passa por ações da loja (L.A.memoriaUso, L.A.memoriaVista): no protótipo vale para todas as janelas; no app,
   a ponte leva a ação pelo diário às outras Estações, e a do autor acende. As ações recebem a hora como argumento,
   então aplicar o diário de novo dá o mesmo resultado.

   API (window.BC.memoria) — para o conector coop, o painel real e as outras peças:
   - consultar(termo, {quem, agente, limite=8, citar=3, contar=true}) → [{tipo, titulo, autor, usos, trecho, id,
       autorId, rotulo, tema, memoria, contou, caminho, relevancia}]: busca no acervo (BM25; sem nada, semelhança),
       memória com nome primeiro; as `citar` primeiras memórias contam um uso cada (de `quem`, pelo `agente`).
   - usar(id, {quem, agente, tema, via}) → {id, contou, motivo, usos, rotulo}: um uso explícito.
   - usos(id) → número · citar(id, tema?) → "Aprendizado · Davi · reembolso · usado 7×"
   - resumoParaAgente({limite=20}) → {total, porTipo, texto: "já li N coisas que a equipe aprendeu", itens: os 20
       aprendizados mais usados, instrucoes: Markdown para o --append-system-prompt do claude}
   - semana() → número público da equipe (usos da memória e aprendizados novos na semana; sem nomes)
   - meus(pessoa?) → pontos e usos do trabalho da pessoa (só a própria pessoa ou a gestão; senão null)
   - luzesPara(pessoa?) → as luzes dirigidas a ela (mesma regra)
   JS puro, sem módulos. Carregado depois de acoes.js, acervo.js, terminal.js e maquina.js; antes de estacao.js. */
window.BC = window.BC || {};

(function (BC) {
  'use strict';
  if (!BC.util || !BC.loja || !BC.acervo) return;

  var U = BC.util, esc = U.esc, HORA = U.HORA, DIA = U.DIA;
  var L = BC.loja, LA = L.A;
  var VERSAO = '1.0.0';
  var NOME = { aprendizado: 'Aprendizado', preset: 'Preset', prompt: 'Prompt', ideia: 'Ideia', fala: 'Ideia falada', ata: 'Ata' };
  var DO_SEU = { aprendizado: 'o seu aprendizado', preset: 'o seu preset', prompt: 'o seu prompt', ideia: 'a sua ideia', fala: 'a sua ideia falada', ata: 'a sua ata' };
  var FEMININO = { ideia: true, fala: true, ata: true };
  var JANELA_USO = HORA, PONTOS_USO = 2, LUZ_MS = 6000, CARTAO_MS = 8000, TETO_LUZES = 300, TETO_PONTOS = 400;

  function E() { return L.estado; }
  function acha(lista, id) { for (var i = 0; i < (lista || []).length; i++) if (lista[i].id === id) return lista[i]; return null; }
  function limitar(v, a, b) { v = +v; if (isNaN(v)) v = a; return v < a ? a : v > b ? b : v; }
  function segundaDe(ms) { var d = new Date(ms); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); }
  function org() { return BC.organismo && BC.organismo.acender ? BC.organismo : null; }
  function reduzido() { var o = org(); if (o && o.semMovimento) return o.semMovimento(); return U.movimentoReduzido(); }

  /* ------------------------------------------------------------------ a memória no estado (com os usos de exemplo) */
  /* usos de exemplo do protótipo (como os reusos dos prompts e os usos dos presets em dados.js) */
  var SEMENTE = { 'ap:ap1': 7, 'ap:ap2': 4, 'ap:ap3': 9, 'ap:ap4': 3, 'ap:ap5': 5, 'ap:ap6': 2, 'ap:ap7': 6, 'ap:ap8': 4, 'ap:ap9': 7, 'id:i1': 2, 'id:i2': 1, 'id:i3': 1, 'fala:mo1': 3 };

  function garantir(e) {
    e = e || E();
    if (!e.memoria) {
      var usos = {};
      Object.keys(SEMENTE).forEach(function (k) { if (bruto(e, k)) usos[k] = SEMENTE[k]; });
      e.memoria = { usos: usos, ultimo: {}, luzes: [], pontos: {} };
    }
    var m = e.memoria;
    m.usos = m.usos || {}; m.ultimo = m.ultimo || {}; m.luzes = m.luzes || []; m.pontos = m.pontos || {};
    return m;
  }

  /* o estado nasce com o aprendizado da Carla sobre reembolso (o exemplo do PLANO: "o que a equipe aprendeu sobre reembolso") */
  function semear(e) {
    if (!e || e.memoria) return e;
    if (e.aprendizados && !acha(e.aprendizados, 'ap9')) {
      e.aprendizados.push({ id: 'ap9', texto: 'Reembolso de viagem só fecha o mês com as notas anexadas e o OK do Theus até as 18h.', pessoa: 'carla',
        ts: Date.now() - 26 * HORA, confirmacoes: ['theus'], origem: 'Reembolso da viagem a Campinas' });
    }
    garantir(e);
    return e;
  }
  if (typeof BC.criarEstado === 'function' && !BC.criarEstado.__memoria) {
    var criarOriginal = BC.criarEstado;
    BC.criarEstado = function () { return semear(criarOriginal.apply(this, arguments)); };
    BC.criarEstado.__memoria = true;
  }

  /* uma memória pelo id do acervo, direto das listas do estado (não depende do índice em cache) */
  function bruto(e, ref) {
    ref = String(ref || '');
    var i = ref.indexOf(':'), pre = ref.slice(0, i), id = ref.slice(i + 1), x;
    if (i < 1 || !id) return null;
    if (pre === 'ap') { x = acha(e.aprendizados, id); return x && { tipo: 'aprendizado', autor: x.pessoa, texto: x.texto, obj: x }; }
    if (pre === 'pr') { x = acha(e.prompts, id); return x && { tipo: 'prompt', autor: x.pessoa, texto: x.texto, obj: x }; }
    if (pre === 'pre') { x = acha(e.presets, id); return x && { tipo: 'preset', autor: x.por, texto: x.nome + (x.descricao ? ': ' + x.descricao : ''), obj: x }; }
    if (pre === 'id') { x = acha(e.ideias, id); return x && { tipo: 'ideia', autor: x.pessoa, texto: x.texto, obj: x }; }
    if (pre === 'fala') {
      x = acha(e.sala && e.sala.momentos, id);
      return x && { tipo: 'fala', autor: x.por, texto: (x.ideias && x.ideias[0]) || ((x.trechos || [])[0] || {}).texto || 'momento guardado da sala', obj: x };
    }
    if (pre === 'arq') {
      x = acha(e.arquivos, id);
      if (!x || x.caminho.indexOf('equipe/Reuniões/') !== 0) return null;
      return { tipo: 'ata', autor: x.autor || x.salvoPor, texto: x.caminho.split('/').pop().replace(/\.md$/, ''), obj: x };
    }
    return null;
  }

  function usosDe(e, ref, b) {
    b = b || bruto(e, ref);
    if (!b) return 0;
    if (b.tipo === 'prompt') return b.obj.reusos || 0;
    if (b.tipo === 'preset') return b.obj.usos || 0;
    return garantir(e).usos[ref] || 0;
  }
  function somarUso(e, ref, b) {
    if (b.tipo === 'prompt') return (b.obj.reusos = (b.obj.reusos || 0) + 1);
    if (b.tipo === 'preset') return (b.obj.usos = (b.obj.usos || 0) + 1);
    var m = garantir(e);
    return (m.usos[ref] = (m.usos[ref] || 0) + 1);
  }

  /* ------------------------------------------------------------------ textos: a citação com nome */
  var GENERICAS = { quando: 1, quase: 1, sempre: 1, antes: 1, depois: 1, porque: 1, melhor: 1, precisa: 1, passar: 1, sobre: 1, entre: 1, ainda: 1, muito: 1, fazer: 1, fica: 1, deixa: 1, funciona: 1, começando: 1 };
  function temaDe(texto) {
    var ws = String(texto || '').match(/[A-Za-zÀ-ÿ]{5,}/g) || [];
    for (var i = 0; i < ws.length; i++) { var w = ws[i].toLowerCase(); if (!GENERICAS[w] && !GENERICAS[U.normalizar(w)]) return w; }
    return '';
  }
  function usadoTxt(tipo, n) { return (FEMININO[tipo] ? 'usada ' : 'usado ') + n + '×'; }
  function rotulo(tipo, autor, tema, n) { return (NOME[tipo] || tipo) + ' · ' + L.nome(autor) + (tema ? ' · ' + tema : '') + ' · ' + usadoTxt(tipo, n); }
  function avatarMini(pessoaId) {
    var p = L.pessoa(pessoaId);
    if (!p) return '';
    return '<i class="mem-av" style="--cor:' + esc(p.cor) + '" data-ini="' + esc(p.nome.slice(0, 2).toUpperCase()) + '" aria-hidden="true"></i>';
  }
  function citaHtml(tipo, autor, tema, n, id) {
    return '<span class="mem-cita"' + (id ? ' data-mem="' + esc(id) + '"' : '') + '><b>' + esc(NOME[tipo] || tipo) + '</b> · <span class="mem-quem">' + avatarMini(autor) + esc(L.nome(autor)) + '</span>' +
      (tema ? ' · ' + esc(tema) : '') + ' · <span class="mem-usos">' + usadoTxt(tipo, n) + '</span></span>';
  }
  function quemTexto(quem, agente) { return agente ? agente + ' (agente de ' + L.nome(quem) + ')' : L.nome(quem); }

  /* ------------------------------------------------------------------ ações (passam pelo diário no app) */
  function acenderPara(e, d) {
    var m = garantir(e), id = 'luz:' + d.ref + ':' + d.usos;
    if (acha(m.luzes, id)) return null;
    var luz = { id: id, para: d.autor, quem: d.quem, agente: d.agente || null, ref: d.ref, tipo: d.tipo, resumo: String(d.texto || '').slice(0, 140),
      tema: d.tema || '', usos: d.usos, ts: d.ts, pts: PONTOS_USO, vista: false };
    m.luzes.push(luz);
    while (m.luzes.length > TETO_LUZES) {
      var k = -1;
      for (var i = 0; i < m.luzes.length; i++) if (m.luzes[i].vista) { k = i; break; }
      m.luzes.splice(k === -1 ? 0 : k, 1);
    }
    var pts = m.pontos[d.autor] = m.pontos[d.autor] || [];
    pts.push({ chave: id, pts: PONTOS_USO, ts: d.ts, ref: d.ref,
      origem: quemTexto(d.quem, d.agente) + ' usou ' + DO_SEU[d.tipo],
      conta: PONTOS_USO + ' = uso do meu trabalho 2 × esforço 1 × surpresa 1 (régua §3)',
      prova: (NOME[d.tipo] || d.tipo) + ' · “' + luz.resumo + '” · ' + usadoTxt(d.tipo, d.usos) });
    if (pts.length > TETO_PONTOS) pts.splice(0, pts.length - TETO_PONTOS);
    return luz;
  }

  /* um uso: +1 no "usado N×" e a luz para o autor. info = {agente, tema, ts, via} */
  LA.memoriaUso = function (quem, ref, info) {
    info = info || {};
    var e = E(), b = bruto(e, ref);
    if (!b || !b.autor || b.autor === quem || !L.pessoa(b.autor)) return;
    var m = garantir(e), ts = +info.ts || Date.now(), chave = quem + '|' + ref;
    if (m.ultimo[chave] && ts - m.ultimo[chave] < JANELA_USO && ts >= m.ultimo[chave]) return;
    m.ultimo[chave] = ts;
    var ks = Object.keys(m.ultimo);
    if (ks.length > 600) ks.forEach(function (k) { if (ts - m.ultimo[k] > JANELA_USO) delete m.ultimo[k]; });
    var n = somarUso(e, ref, b);
    acenderPara(e, { ref: ref, tipo: b.tipo, autor: b.autor, quem: quem, agente: info.agente ? String(info.agente).slice(0, 40) : null,
      texto: b.texto, tema: String(info.tema || temaDe(b.texto)).slice(0, 40), usos: n, ts: ts });
    return [];
  };

  /* o autor viu as luzes (o cartão apareceu na tela dele) */
  LA.memoriaVista = function (quem, ids) {
    ids = [].concat(ids || []);
    var n = 0;
    garantir(E()).luzes.forEach(function (l) { if (l.para === quem && !l.vista && ids.indexOf(l.id) !== -1) { l.vista = true; n++; } });
    return n ? [] : undefined;
  };

  /* os caminhos de uso que já existiam (prompt "Usar no terminal", preset montado na Máquina) também acendem para o autor */
  function envolver(nome, prefixo) {
    var f0 = LA[nome];
    if (typeof f0 !== 'function' || f0.__memoria) return;
    LA[nome] = function (quem, id) {
      var r = f0.apply(this, arguments);
      try {
        if (r && r !== 'cedo') {
          var e = E(), ref = prefixo + ':' + id, b = bruto(e, ref);
          if (b && b.autor && b.autor !== quem && L.pessoa(b.autor)) {
            acenderPara(e, { ref: ref, tipo: b.tipo, autor: b.autor, quem: quem, texto: b.texto, tema: temaDe(b.texto), usos: usosDe(e, ref, b), ts: Date.now() });
          }
        }
      } catch (x) { console.warn('[memoria] ' + nome + ':', x); }
      return r;
    };
    LA[nome].__memoria = true;
  }
  envolver('reusar', 'pr');
  envolver('presetUso', 'pre');

  /* ------------------------------------------------------------------ API */
  var M = { versao: VERSAO, tipos: NOME, janelaUsoMs: JANELA_USO, pontosPorUso: PONTOS_USO };

  M.usos = function (ref) { return usosDe(E(), ref); };
  M.citar = function (ref, tema) {
    var e = E(), b = bruto(e, ref);
    if (!b) return '';
    return rotulo(b.tipo, b.autor, tema || temaDe(b.texto), usosDe(e, ref, b));
  };
  M.citarHtml = function (ref, tema) {
    var e = E(), b = bruto(e, ref);
    if (!b) return '';
    return citaHtml(b.tipo, b.autor, tema || temaDe(b.texto), usosDe(e, ref, b), ref);
  };
  M.eMemoria = function (ref) { return !!bruto(E(), ref); };
  M.autor = function (ref) { var b = bruto(E(), ref); return b ? b.autor : null; };

  M.usar = function (ref, opcoes) {
    opcoes = opcoes || {};
    var e = E(), b = bruto(e, ref);
    if (!b) return { id: ref, contou: false, motivo: 'não é memória com nome', usos: 0, rotulo: '' };
    var quem = opcoes.quem || L.eu, tema = String(opcoes.tema || '').trim() || temaDe(b.texto);
    var info = { agente: opcoes.agente || null, tema: tema, ts: Date.now(), via: opcoes.via || '' };
    var motivo = b.autor === quem ? 'é sua (o próprio uso não conta)' : null, r = false;
    if (!motivo) r = quem === L.eu ? L.fazer('memoriaUso', ref, info) : L.fazerComo(quem, 'memoriaUso', ref, info);
    if (!motivo && r !== true) motivo = 'já contou nesta hora';
    return { id: ref, contou: r === true, motivo: r === true ? null : motivo, usos: usosDe(E(), ref), rotulo: M.citar(ref, tema) };
  };

  function textoPlano(html) { return String(html || '').replace(/<\/?mark>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&[a-z#0-9]+;/g, ' '); }

  M.consultar = function (termo, opcoes) {
    opcoes = opcoes || {};
    var e = E(), q = String(termo == null ? '' : termo).trim().slice(0, 300);
    if (!q) return [];
    var limite = limitar(opcoes.limite || 8, 1, 30), citar = opcoes.citar == null ? 3 : limitar(opcoes.citar, 0, 10);
    var res = BC.acervo.buscar(e, q, { limite: 40 }), porSemelhanca = false;
    if (!res.length) { res = BC.acervo.buscar(e, q, { limite: 40, modo: 'semelhanca' }); porSemelhanca = true; }
    /* o próprio pedido (o terminal grava cada pedido como prompt) não é memória a citar */
    var qn = U.normalizar(q).replace(/\s+/g, ' ').trim();
    res = res.filter(function (r) { var b = bruto(e, r.doc.id); return !b || U.normalizar(b.texto).replace(/\s+/g, ' ').trim() !== qn; });
    var mem = res.filter(function (r) { return !!bruto(e, r.doc.id); });
    var primeiro = mem.slice(0, Math.max(1, citar));
    var ordem = primeiro.concat(res.filter(function (r) { return primeiro.indexOf(r) === -1; })).slice(0, limite);
    var quem = opcoes.quem || L.eu, contadas = 0;
    return ordem.map(function (r) {
      var d = r.doc, b = bruto(e, d.id), tema = BC.acervo.termosEm(q, d).join(' ') || (b ? temaDe(b.texto) : '');
      var x = { id: d.id, tipo: b ? b.tipo : d.tipo, titulo: d.titulo, autor: L.nome(d.pessoa), autorId: d.pessoa || null, usos: b ? usosDe(e, d.id, b) : null,
        trecho: textoPlano(r.trecho).slice(0, 220), tema: tema, memoria: !!b, contou: false, caminho: d.caminho || null, relevancia: Math.round(r.pontos * 1000) / 1000 };
      /* só conta o que casou de verdade: por palavras (BM25 > 0) ou, por semelhança, cosseno ≥ 0,25 */
      if (b && opcoes.contar !== false && contadas < citar && (!porSemelhanca || r.pontos >= 0.25)) {
        contadas++;
        var u = M.usar(d.id, { quem: quem, agente: opcoes.agente || null, tema: tema, via: 'consulta' });
        x.contou = u.contou; x.usos = u.usos;
      }
      x.rotulo = b ? rotulo(b.tipo, b.autor, tema, x.usos) : (x.titulo + (d.pessoa ? ' · ' + x.autor : ''));
      return x;
    });
  };

  /* tudo o que é memória com nome, direto do estado */
  M.documentos = function () {
    var e = E(), r = [];
    (e.aprendizados || []).forEach(function (a) { r.push('ap:' + a.id); });
    (e.presets || []).forEach(function (p) { r.push('pre:' + p.id); });
    (e.prompts || []).forEach(function (p) { if (p.resultado !== 'devolvida') r.push('pr:' + p.id); });
    (e.ideias || []).forEach(function (i) { r.push('id:' + i.id); });
    ((e.sala && e.sala.momentos) || []).forEach(function (m) { r.push('fala:' + m.id); });
    (e.arquivos || []).forEach(function (a) { if (a.caminho.indexOf('equipe/Reuniões/') === 0) r.push('arq:' + a.id); });
    return r.map(function (ref) { var b = bruto(e, ref); return b && { id: ref, tipo: b.tipo, autorId: b.autor, autor: L.nome(b.autor), texto: b.texto, usos: usosDe(e, ref, b) }; }).filter(Boolean);
  };

  M.resumoParaAgente = function (opcoes) {
    opcoes = opcoes || {};
    var e = E(), docs = M.documentos(), porTipo = { aprendizado: 0, preset: 0, prompt: 0, ideia: 0, fala: 0, ata: 0 };
    docs.forEach(function (d) { porTipo[d.tipo] = (porTipo[d.tipo] || 0) + 1; });
    var limite = limitar(opcoes.limite || 20, 1, 50);
    var itens = (e.aprendizados || []).map(function (a) {
      return { id: 'ap:' + a.id, tipo: 'aprendizado', texto: a.texto, autor: L.nome(a.pessoa), autorId: a.pessoa, usos: usosDe(e, 'ap:' + a.id), confirmacoes: (a.confirmacoes || []).length, ts: a.ts };
    }).sort(function (x, y) { return (y.usos - x.usos) || (y.confirmacoes - x.confirmacoes) || (y.ts - x.ts); }).slice(0, limite);
    var total = docs.length, texto = 'já li ' + total + ' coisas que a equipe aprendeu';
    var partes = [[porTipo.aprendizado, 'aprendizado', 'aprendizados'], [porTipo.preset, 'preset', 'presets'], [porTipo.prompt, 'prompt', 'prompts'],
      [porTipo.ideia, 'ideia', 'ideias'], [porTipo.fala, 'ideia falada', 'ideias faladas'], [porTipo.ata, 'ata', 'atas']]
      .filter(function (x) { return x[0]; }).map(function (x) { return x[0] + ' ' + (x[0] === 1 ? x[1] : x[2]); });
    var instrucoes = ['## O que a equipe já sabe (babel-coop · memória com nome)', '',
      'Você nasceu sabendo: ' + texto + ' (' + partes.join(', ') + ').',
      'Quando usar algo daqui, cite quem ensinou, no formato "Aprendizado · <autor> · <tema> · usado N×". Para mais, use coop_buscar antes de criar: cada consulta soma +1 para quem ensinou e acende a luz na tela dele.',
      '', 'Os ' + itens.length + ' aprendizados mais usados da equipe:']
      .concat(itens.map(function (a, i) { return (i + 1) + '. ' + a.texto + ' (' + a.autor + ' · usado ' + a.usos + '×)'; })).join('\n');
    return { total: total, porTipo: porTipo, partes: partes, texto: texto, frase: 'Já li ' + total + ' coisas que a equipe aprendeu.', itens: itens, instrucoes: instrucoes };
  };

  /* número público da semana: da equipe inteira, sem nomes (R4) */
  M.semana = function () {
    var e = E(), ini = segundaDe(Date.now()), m = garantir(e);
    return { desde: ini, usos: m.luzes.filter(function (l) { return l.ts >= ini; }).length,
      aprendizadosNovos: (e.aprendizados || []).filter(function (a) { return a.ts >= ini; }).length, total: M.documentos().length };
  };

  function podeVer(pessoa) { return pessoa === L.eu || (L.eAdmin && L.eAdmin()); }
  M.meus = function (pessoa) {
    pessoa = pessoa || L.eu;
    if (!podeVer(pessoa)) return null;
    var e = E(), m = garantir(e), ini = segundaDe(Date.now());
    var luzes = m.luzes.filter(function (l) { return l.para === pessoa; }), pts = (m.pontos[pessoa] || []).slice();
    var minhas = M.documentos().filter(function (d) { return d.autorId === pessoa; });
    return { pessoa: pessoa, memorias: minhas.length, usadoTotal: minhas.reduce(function (s, d) { return s + d.usos; }, 0),
      usosSemana: luzes.filter(function (l) { return l.ts >= ini; }).length, pontos: pts,
      pontosSemana: pts.filter(function (p) { return p.ts >= ini; }).reduce(function (s, p) { return s + p.pts; }, 0),
      pendentes: luzes.filter(function (l) { return !l.vista; }).length };
  };
  M.luzesPara = function (pessoa) {
    pessoa = pessoa || L.eu;
    if (!podeVer(pessoa)) return [];
    return garantir(E()).luzes.filter(function (l) { return l.para === pessoa; }).map(function (l) { return JSON.parse(JSON.stringify(l)); });
  };

  /* ------------------------------------------------------------------ luz em elementos que a Estação redesenha (4 Hz, só enquanto há luz) */
  var acesos = {}, relogio = null, vigia = null;
  function alvosDe(k) {
    if (k.indexOf('ativ:') === 0) return document.querySelectorAll('.e-atividades [data-acao="atividade"][data-id="' + k.slice(5) + '"]');
    if (k.indexOf('mem:') === 0) return document.querySelectorAll('[data-mem="' + k.slice(4).replace(/"/g, '') + '"]');
    return [];
  }
  function luzAgora(k) {
    var t0 = acesos[k];
    if (!t0) return 0;
    var l = Math.pow(2, -(Date.now() - t0) / LUZ_MS);
    if (reduzido()) l = l > 0.6 ? 1 : l > 0.2 ? 0.35 : 0;
    return l;
  }
  function aplicarAcesos() {
    var vivos = 0;
    Object.keys(acesos).forEach(function (k) {
      var l = luzAgora(k);
      if (l < 0.03) { delete acesos[k]; l = 0; } else vivos++;
      if (document.hidden && l) return; /* aba oculta: não pinta (o relógio só confere) */
      Array.prototype.forEach.call(alvosDe(k), function (el) {
        if (l) { el.style.setProperty('--luz', l.toFixed(3)); el.setAttribute('data-t', String(acesos[k] || 0)); el.classList.toggle('aceso', l > 0.6); el.classList.toggle('morno', l > 0.2 && l <= 0.6); }
        else { el.style.removeProperty('--luz'); el.classList.remove('aceso', 'morno'); }
      });
    });
    if (!vivos) {
      if (relogio) { clearInterval(relogio); relogio = null; }
      if (vigia) { vigia.disconnect(); vigia = null; }
    }
  }
  function acenderChave(k) {
    acesos[k] = Date.now();
    aplicarAcesos();
    if (!relogio) relogio = setInterval(aplicarAcesos, 250);
    if (!vigia && window.MutationObserver) {
      var raiz = document.getElementById('vista-estacao');
      if (raiz) { vigia = new MutationObserver(function () { aplicarAcesos(); }); vigia.observe(raiz, { childList: true, subtree: true }); }
    }
  }
  M.luz = luzAgora;

  /* ------------------------------------------------------------------ o autor vê a luz (só na Estação dele) */
  function naEstacao() {
    var h = String(location.hash || '').replace('#', '');
    if (/^(tv|ipad|cronometro)\b/.test(h)) return false;
    var raiz = document.getElementById('vista-estacao');
    return L.papel === 'estacao' && !!raiz && !raiz.hidden;
  }

  var mostradas = {}, cartaoTimer = null, verificarTimer = null;
  function agendarVerificacao() { if (verificarTimer) return; verificarTimer = setTimeout(function () { verificarTimer = null; verificar(); }, 40); }
  function verificar() {
    if (!L.estado) return;
    /* o cartão é só de quem ensinou: trocou a pessoa (ou a vista), ele sai na hora */
    var aberto = document.querySelector('#vista-estacao .mem-luz');
    if (aberto && (aberto.dataset.para !== L.eu || !naEstacao())) fecharCartao(aberto, true);
    if (!naEstacao()) return;
    var eu = L.eu, m = garantir(E());
    var pend = m.luzes.filter(function (l) { return l.para === eu && !l.vista && !mostradas[eu + '|' + l.id]; });
    if (!pend.length) return;
    pend.forEach(function (l) { mostradas[eu + '|' + l.id] = true; });
    try { mostrarCartao(pend); } catch (x) { console.warn('[memoria] cartão:', x); }
    L.fazer('memoriaVista', pend.map(function (l) { return l.id; }));
  }

  function fecharCartao(el, depressa) {
    if (!el || !el.parentNode) return;
    if (depressa || reduzido()) { el.parentNode.removeChild(el); return; }
    el.classList.add('saindo');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 420);
  }
  function agendarSaida(el, ms) { clearTimeout(cartaoTimer); cartaoTimer = setTimeout(function () { fecharCartao(el); }, ms); }

  function mostrarCartao(lista) {
    var raiz = document.getElementById('vista-estacao');
    if (!raiz) return;
    var l = lista[lista.length - 1], mais = lista.length - 1, pontos = lista.reduce(function (s, x) { return s + (x.pts || 0); }, 0);
    var velho = raiz.querySelector('.mem-luz');
    if (velho) fecharCartao(velho, true);
    var quem = L.pessoa(l.quem);
    var el = document.createElement('div');
    el.className = 'mem-luz';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.dataset.ref = l.ref;
    el.dataset.para = l.para;
    el.dataset.t = String(Date.now());
    el.innerHTML = '<span class="mem-luz-fio" aria-hidden="true"></span>' +
      '<div class="mem-luz-cab">' + (quem ? U.avatar(quem, 22) : '') + '<b>' + esc(quemTexto(l.quem, l.agente)) + ' usou ' + DO_SEU[l.tipo] + '</b>' +
      '<button class="mem-luz-x" type="button" data-acao="mem-luz-fechar" aria-label="Fechar">✕</button></div>' +
      '<button class="mem-luz-corpo" type="button" data-acao="mem-luz-abrir" data-ref="' + esc(l.ref) + '">' +
      '<span class="mem-luz-texto">“' + esc(l.resumo) + '”</span>' +
      '<span class="mem-luz-pe">' + citaHtml(l.tipo, l.para, l.tema, l.usos) + '<span class="mem-luz-pts" title="' + esc(PONTOS_USO + ' pontos por uso do seu trabalho (régua §3). Só você vê.') + '">+' + pontos + '</span></span></button>' +
      '<small class="mem-luz-origem">origem: uso do seu trabalho · ' + U.hora(l.ts) + (mais ? ' · e mais ' + mais + (mais === 1 ? ' uso' : ' usos') + ' enquanto você não olhava' : '') + ' · só você vê</small>';
    raiz.appendChild(el);
    el.addEventListener('mouseenter', function () { clearTimeout(cartaoTimer); });
    el.addEventListener('mouseleave', function () { agendarSaida(el, 2500); });
    agendarSaida(el, CARTAO_MS);

    /* a luz: dirigida ao autor, vem do Acervo (a memória da equipe) até o cartão; acende onde a memória mora */
    var o = org(), casa = l.tipo === 'preset' ? 'explorador' : 'inteligencia';
    var deOnde = document.querySelector('.e-atividades [data-acao="atividade"][data-id="acervo"]');
    if (o) {
      el.dataset.motor = 'sim';
      o.acender(el, LUZ_MS);
      if (deOnde && !reduzido()) o.pulso(deOnde, el, { aoChegar: function () { o.faiscas(el, 6, false, { onde: 'topo' }); } });
    } else {
      el.classList.add('sem-motor');
    }
    acenderChave('ativ:' + casa);
    lista.forEach(function (x) { acenderChave('mem:' + x.ref); });

    /* +2 no placar do app, quando ele aceitar pontos de fora (pedido no relatório: BC.placar.somarUso) */
    var p = BC.placar;
    if (p && typeof p.somarUso === 'function') {
      lista.forEach(function (x) {
        try { p.somarUso({ chave: x.id, pts: x.pts, origem: quemTexto(x.quem, x.agente) + ' usou ' + DO_SEU[x.tipo], conta: PONTOS_USO + ' · uso do meu trabalho (régua §3)', prova: (NOME[x.tipo] || x.tipo) + ' · “' + x.resumo + '” · ' + usadoTxt(x.tipo, x.usos) }); } catch (y) { /* segue */ }
      });
    }
  }

  L.aoMudar(function () { agendarVerificacao(); });

  /* ------------------------------------------------------------------ ações da interface */
  var A = BC.acoes = BC.acoes || {};
  A['mem-luz-fechar'] = function (el) { fecharCartao(el.closest('.mem-luz')); };
  A['mem-luz-abrir'] = function (el) {
    var ref = el.dataset.ref, b = bruto(E(), ref), ui = BC.estacao && BC.estacao.ui;
    fecharCartao(el.closest('.mem-luz'));
    if (!b || !ui) return;
    if (b.tipo === 'preset' && b.obj.arquivo && L.arquivo(b.obj.arquivo)) { BC.explorador.abrirArquivo(L.arquivo(b.obj.arquivo).id); return; }
    if (b.tipo === 'ata') { BC.explorador.abrirArquivo(b.obj.id); return; }
    if (b.tipo === 'fala') { BC.estacao.abrir('reuniao'); return; }
    ui.secaoInt = b.tipo === 'prompt' ? 'prompts' : b.tipo === 'ideia' ? 'ideias' : 'aprendizados';
    BC.estacao.abrir(b.tipo === 'preset' ? 'explorador' : 'inteligencia');
    setTimeout(function () { acenderChave('mem:' + ref); var alvo = document.querySelector('#e-conteudo [data-mem="' + ref + '"]'); if (alvo && alvo.scrollIntoView) alvo.scrollIntoView({ block: 'center' }); }, 60);
  };

  /* "Usar": a memória vai para o agente (o campo ❯ da presença) e conta um uso */
  function campoDoAgente() {
    var c = document.getElementById('term-entrada');
    if (c && c.offsetParent) return c;
    var reais = document.querySelectorAll('.tr-entrada');
    for (var i = 0; i < reais.length; i++) if (reais[i].offsetParent) return reais[i];
    return c || null;
  }
  A['mem-usar'] = function (el) {
    var ref = el.dataset.doc, e = E(), b = bruto(e, ref);
    if (!b) return;
    var ui = BC.estacao && BC.estacao.ui, tema = (ui && ui.buscaAcervo) || '';
    var r = M.usar(ref, { quem: L.eu, tema: tema, via: 'acervo' });
    if (BC.estacao && BC.estacao.alternarTerminal) BC.estacao.alternarTerminal(true);
    var campo = campoDoAgente();
    if (campo) {
      campo.value = 'Use o que ' + L.nome(b.autor) + ' ensinou (' + (NOME[b.tipo] || b.tipo).toLowerCase() + '): “' + b.texto + '” ';
      try { campo.focus(); campo.dispatchEvent(new Event('input', { bubbles: true })); } catch (x) { /* segue */ }
    }
    acenderChave('mem:' + ref);
    if (BC.estacao && BC.estacao.aviso) BC.estacao.aviso(r.contou ? r.rotulo + ' · no seu agente' : 'No seu agente · ' + (r.motivo || '') + ' · ' + r.rotulo);
    if (BC.estacao && BC.estacao.render) BC.estacao.render();
  };

  /* ------------------------------------------------------------------ a presença do protótipo: consulta com nome e agente que nasce sabendo */
  var T = BC.Terminal;
  function blocoConsulta(itens, agNome) {
    return '<div class="term-linha mem-consulta" data-t="' + Date.now() + '"><span class="mem-rot">consulta · ' + esc(agNome || 'o agente') + ' leu o que a equipe ensinou</span>' +
      itens.map(function (x) {
        var b = bruto(E(), x.id);
        return '<span class="mem-linha">' + citaHtml(b.tipo, b.autor, x.tema, x.usos, x.id) + (x.contou ? '<i class="mem-mais" title="este uso contou: +1 e a luz acendeu para ' + esc(L.nome(b.autor)) + '">+1</i>' : '') + '</span>';
      }).join('') + '</div>';
  }
  function blocoNasce(ag, r) {
    var top = r.itens.slice(0, 3);
    return '<div class="term-linha mem-nasce"><span class="mem-rot">' + esc(ag.nome) + ' nasceu sabendo</span>' +
      '<span class="mem-nasce-frase">' + esc(r.frase) + '</span><span class="mem-nasce-partes">' + esc(r.partes.join(' · ')) + '</span>' +
      (top.length ? '<span class="mem-rot">as mais usadas</span>' + top.map(function (a) { return '<span class="mem-linha">' + citaHtml('aprendizado', a.autorId, temaDe(a.texto), a.usos, a.id) + '</span>'; }).join('') : '') + '</div>';
  }
  if (T && T.prototype && typeof T.prototype.ia === 'function' && !T.prototype.ia.__memoria) {
    var iaOriginal = T.prototype.ia;
    T.prototype.ia = function (pedido) {
      var k = this.chave(), antes = (this.linhas[k] || []).length;
      var r = iaOriginal.apply(this, arguments);
      try {
        var linhas = this.linhas[k] || [], novas = linhas.slice(antes), onde = -1;
        novas.forEach(function (l, i) { if (onde === -1 && l.indexOf('consultando o acervo') !== -1) onde = antes + i; });
        var jaCitou = novas.some(function (l) { return l.indexOf('mem-consulta') !== -1; });
        if (onde !== -1 && !jaCitou) {
          var ag = this.agente();
          var achados = M.consultar(String(pedido || '').replace(/^"|"$/g, ''), { quem: L.eu, agente: ag ? ag.nome : null, limite: 3, citar: 2 }).filter(function (x) { return x.memoria; });
          if (achados.length) {
            linhas.splice(onde + 1, 0, blocoConsulta(achados, ag ? ag.nome : null));
            achados.forEach(function (x) { acenderChave('mem:' + x.id); });
          }
        }
      } catch (x) { console.warn('[memoria] consulta da presença:', x); }
      return r;
    };
    T.prototype.ia.__memoria = true;
  }
  if (T && T.prototype && typeof T.prototype.boasVindas === 'function' && !T.prototype.boasVindas.__memoria) {
    var boasOriginal = T.prototype.boasVindas;
    T.prototype.boasVindas = function (ag) {
      boasOriginal.apply(this, arguments);
      try {
        var k = this.dono + '|' + ag.id, lista = this.linhas[k] = this.linhas[k] || [];
        lista.splice(Math.max(0, lista.length - 1), 0, blocoNasce(ag, M.resumoParaAgente()));
      } catch (x) { console.warn('[memoria] agente nasce sabendo:', x); }
    };
    T.prototype.boasVindas.__memoria = true;
  }

  /* ------------------------------------------------------------------ estilo (tokens 2030 + HUD do Babel OS só na superfície viva) */
  (function estilo() {
    if (document.getElementById('memoria-nome-css')) return;
    var css = [
      '.mem-cita{display:inline-flex;align-items:center;flex-wrap:wrap;gap:4px 6px;font:500 var(--t-125,12.5px)/1.45 var(--fonte-mono);color:var(--texto-90);font-variant-numeric:tabular-nums}',
      '.mem-cita b{font-weight:500;color:var(--texto)}',
      '.mem-av{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;border:1.5px solid var(--cor);color:var(--cor);font:600 8px/1 var(--fonte-mono);font-style:normal;flex:none}',
      '.mem-av::before{content:attr(data-ini)}',
      '.mem-quem{display:inline-flex;align-items:center;gap:5px;white-space:nowrap}',
      '.mem-usos{color:var(--texto-90)}',
      '[data-mem]{--luz-cor:color-mix(in srgb,var(--t0) calc(var(--luz,0)*100%),transparent)}',
      '.mem-cita[data-mem]{border-radius:var(--r-chip);padding:0 4px;margin-left:-4px;background:color-mix(in srgb,var(--t2) calc(var(--luz,0)*22%),transparent)}',
      '.mem-cita[data-mem] .mem-usos{color:color-mix(in oklch,var(--texto-90),var(--t0) calc(var(--luz,0)*100%))}',
      '.resultado[data-mem],.item[data-mem]{box-shadow:inset 2px 0 0 var(--luz-cor)}',
      '.resultado .mem-cita{margin:0}',
      '.mem-acoes{display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
      '.mem-acoes .botao{padding-inline:10px}',
      '.mem-acoes .mem-seu{font:400 var(--t-11,11px)/1.3 var(--fonte-mono);color:var(--apagado)}',
      '.mem-painel{display:grid;gap:6px;margin:10px 0 4px;padding:10px 12px;border:1px solid var(--linha-fraca);border-radius:var(--r-cartao);background:var(--s1)}',
      '.mem-painel b{font:500 var(--t-20,20px)/1.1 var(--fonte-mono);color:var(--texto);font-variant-numeric:tabular-nums}',
      '.mem-painel small{color:var(--apagado);font:400 var(--t-11,11px)/1.4 var(--fonte-ui)}',
      '.mem-painel .mem-eu{border-top:1px solid var(--linha-fraca);padding-top:6px}',
      /* o bloco consulta e o agente que nasce sabendo, no painel da direita */
      '.term-linha.mem-consulta,.term-linha.mem-nasce{display:grid;gap:3px;margin:4px 0 8px;padding:6px 10px 7px;border-left:2px solid var(--t1);border-radius:0 var(--r-chip) var(--r-chip) 0;background:color-mix(in srgb,var(--s2) 70%,transparent);color:var(--apagado);white-space:normal}',
      '.term-linha.mem-nasce{border-image:linear-gradient(180deg,var(--t2),var(--t0)) 1}',
      '.mem-rot{font:500 var(--t-11,11px)/1.2 var(--fonte-ui);letter-spacing:var(--rotulo-tracking,.08em);text-transform:uppercase;color:var(--apagado)}',
      '.mem-linha{display:flex;align-items:center;gap:6px}',
      '.mem-mais{flex:none;white-space:nowrap;font:600 var(--t-11,11px)/1 var(--fonte-mono);font-style:normal;color:var(--ok)}',
      '.mem-nasce-frase{color:var(--texto);font:500 var(--t-13,13px)/1.4 var(--fonte-mono)}',
      '.mem-nasce-partes{color:var(--apagado);font:400 var(--t-11,11px)/1.4 var(--fonte-mono)}',
      /* a luz dirigida ao autor: cartão de vidro (HUD do Babel OS), só enquanto o evento está vivo */
      '.mem-luz{position:fixed;z-index:70;right:calc(var(--term,0px) + var(--r2,0px) + var(--esp-4,16px));bottom:calc(var(--rodape,24px) + var(--esp-3,12px) + 44px);width:min(380px,calc(100vw - 32px));display:grid;gap:6px;padding:12px 14px 10px;border-radius:var(--r-painel,8px);overflow:hidden;',
      'background:color-mix(in srgb,var(--s2) 80%,transparent);-webkit-backdrop-filter:blur(14px) saturate(1.15);backdrop-filter:blur(14px) saturate(1.15);',
      'border:1px solid color-mix(in srgb,rgba(63,227,255,.22),var(--t0) calc(var(--luz,0)*75%));box-shadow:0 0 calc(2px + var(--luz,0)*26px) -6px color-mix(in srgb,var(--t0) calc(var(--luz,0)*70%),transparent);',
      'color:var(--texto);font:400 var(--t-13,13px)/1.45 var(--fonte-ui);animation:mem-nasce var(--mov-padrao,180ms) var(--ease-saida,ease-out);transition:opacity .4s var(--ease-saida,ease-out),transform .4s var(--ease-saida,ease-out)}',
      '.mem-luz::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(215,228,251,.035) 0 1px,transparent 1px 3px);opacity:calc(.35 + var(--luz,0)*.65)}',
      '.mem-luz-fio{position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,var(--t2),var(--t0));opacity:var(--luz,0);pointer-events:none}',
      '.mem-luz.saindo{opacity:0;transform:translateY(6px)}',
      '.mem-luz-cab{display:flex;align-items:center;gap:8px}',
      '.mem-luz-cab b{flex:1;font:500 var(--t-14,14px)/1.3 var(--fonte-ui);color:color-mix(in oklch,var(--texto),var(--t0) calc(var(--luz,0)*55%))}',
      '.mem-luz-x{width:24px;height:24px;border:0;border-radius:var(--r-chip);background:transparent;color:var(--apagado);cursor:pointer}',
      '.mem-luz-x:hover{background:var(--s3);color:var(--texto)}',
      '.mem-luz-corpo{display:grid;gap:6px;text-align:left;border:0;padding:0;background:transparent;color:inherit;font:inherit;cursor:pointer}',
      '.mem-luz-texto{font-family:var(--fonte-fala);font-weight:500;font-size:17px;line-height:1.3;color:var(--latte-88)}',
      '.mem-luz-pe{display:flex;align-items:center;justify-content:space-between;gap:8px}',
      '.mem-luz-pts{flex:none;font:600 var(--t-15,15px)/1 var(--fonte-mono);color:color-mix(in oklch,var(--ok),var(--t0) calc(var(--luz,0)*60%));font-variant-numeric:tabular-nums}',
      '.mem-luz-origem{color:var(--apagado);font:400 var(--t-11,11px)/1.3 var(--fonte-mono)}',
      /* sem o motor do organismo (protótipo puro): a mesma luz em CSS, que esfria em 6 s */
      '.mem-luz.sem-motor{--luz:0;animation:mem-nasce var(--mov-padrao,180ms) var(--ease-saida,ease-out),mem-esfria var(--mv-curta,6s) linear}',
      '.mem-luz.sem-motor .mem-luz-fio{animation:mem-fio var(--mv-curta,6s) linear forwards}',
      '@keyframes mem-nasce{from{opacity:0;transform:translateY(6px)}}',
      '@keyframes mem-esfria{from{border-color:var(--t0);box-shadow:0 0 26px -6px color-mix(in srgb,var(--t0) 70%,transparent)}to{border-color:rgba(63,227,255,.22);box-shadow:0 0 0 0 transparent}}',
      '@keyframes mem-fio{from{opacity:1}to{opacity:0}}',
      '@media (max-width:760px){.mem-luz{left:16px;right:16px;width:auto;bottom:76px}}',
      '@media (prefers-reduced-motion:reduce){.mem-luz,.mem-luz.sem-motor,.mem-luz.sem-motor .mem-luz-fio{animation:none;transition:none}.mem-luz.sem-motor{border-color:var(--t0)}.mem-luz.sem-motor .mem-luz-fio{opacity:1}}',
      '@media (prefers-reduced-transparency:reduce){.mem-luz{background:var(--s2);-webkit-backdrop-filter:none;backdrop-filter:none}}'
    ].join('\n');
    var s = document.createElement('style');
    s.id = 'memoria-nome-css';
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  })();

  BC.memoria = M;
})(window.BC);
