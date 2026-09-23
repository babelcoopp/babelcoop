/* Babel Coop — protótipo · vistas: Meu dia e Reunião (com a memória falada da sala) */
window.BC = window.BC || {};
BC.acoes = BC.acoes || {};
BC.vistas = BC.vistas || {};
BC.formularios = BC.formularios || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc, A = BC.acoes, F = BC.formularios;
  function L() { return BC.loja; }
  function ui() { return BC.estacao.ui; }

  /* ---------- peças usadas por várias telas (e pela TV) ---------- */

  BC.arco = function (pct, cor, semDado) {
    var r = 42, c = 50, ini = 150, fim = 390;
    function pt(a) { var rad = a * Math.PI / 180; return (c + r * Math.cos(rad)).toFixed(2) + ',' + (c + r * Math.sin(rad)).toFixed(2); }
    var v = Math.max(0, Math.min(1, pct || 0)), ang = ini + (fim - ini) * v;
    var trilho = 'M' + pt(ini) + ' A' + r + ' ' + r + ' 0 1 1 ' + pt(fim);
    var valor = v > 0.005 ? 'M' + pt(ini) + ' A' + r + ' ' + r + ' 0 ' + (ang - ini > 180 ? 1 : 0) + ' 1 ' + pt(ang) : '';
    return '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="' + trilho + '" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="7" stroke-linecap="round"' + (semDado ? ' stroke-dasharray="2 6"' : '') + '/>' +
      (valor && !semDado ? '<path d="' + valor + '" fill="none" stroke="' + cor + '" stroke-width="7" stroke-linecap="round"/>' : '') + '</svg>';
  };
  BC.anel = function (pct, cor, trilho) {
    var circ = 2 * Math.PI * 45, v = Math.max(0, Math.min(1, pct));
    return '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="45" fill="none" stroke="' + (trilho || 'rgba(255,255,255,0.08)') + '" stroke-width="6"/>' +
      '<circle cx="50" cy="50" r="45" fill="none" stroke="' + cor + '" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + (circ * v).toFixed(1) + ' ' + circ.toFixed(1) + '"/></svg>';
  };
  BC.valorMeta = function (m) {
    if (m.atual == null) return 'sem dado';
    if (m.unidade === 'R$') return 'R$ ' + Math.round(m.atual / 1000) + ' mil de ' + Math.round(m.alvo / 1000) + ' mil';
    return m.atual + ' de ' + m.alvo + (m.unidade ? ' ' + m.unidade : '');
  };
  BC.pctMeta = function (m) { return m.atual == null ? null : Math.min(1, m.atual / m.alvo); };

  function comigo() {
    var eu = L().eu;
    return L().estado.tarefas.filter(function (t) { return t.atual < L().fluxo(t.fluxo).etapas.length && t.donos[t.atual] === eu; });
  }
  BC.comigo = comigo;

  BC.itemTarefa = function (t) {
    var f = L().fluxo(t.fluxo), p = U.prazo(t.prazo), pct = L().pct(t), de = t.atual > 0 ? L().nome(t.donos[t.atual - 1]) : null;
    var parada = Date.now() - t.paradaDesde > 2 * U.DIA;
    return '<button class="item" type="button" style="--cor:#8670ff" data-acao="abrir-tarefa" data-id="' + t.id + '"><span class="item-corpo"><span class="item-titulo">' + esc(t.titulo) + '</span>' +
      '<span class="item-meta">' + esc(f.nome) + ' · etapa ' + esc(f.etapas[t.atual] || 'fim') + (de ? ' · passada por ' + esc(de) + ' ' + U.relativo(t.paradaDesde) : '') + '</span></span>' +
      '<span class="item-fim">' + (parada ? '<span class="chip parada">parada há ' + Math.floor((Date.now() - t.paradaDesde) / U.DIA) + ' dias</span>' : '') +
      '<span class="chip ' + p.classe + '">' + p.texto + '</span><span class="num">' + pct + '%</span></span></button>';
  };

  /* ======================= MEU DIA ======================= */

  var PASSOS = [
    ['abrir', 'Abra um arquivo no Explorador (▤)'], ['ajuda', 'No terminal, rode  coop ajuda'], ['ia', 'Use uma receita: "Explicar este arquivo"'],
    ['nota', 'Crie uma nota (＋ Nota) e leve para a reunião'], ['aprendi', 'Registre um aprendizado:  coop aprendi "..."'], ['demanda', 'Conclua uma demanda escrevendo o que aprendeu']
  ];
  function passosFeitos() { try { return JSON.parse(U.lerLocal('babel-coop:passos:' + L().eu) || '{}'); } catch (e) { return {}; } }

  BC.vistas.dia = {
    lateral: function () {
      var e = L().estado, eu = L().eu;
      var paraComecar = e.demandas.filter(function (d) { return d.para === eu && d.estado === 'enviada'; }).length;
      var esperaOk = e.demandas.filter(function (d) { return d.de === eu && d.estado === 'pronta'; }).length;
      function it(alvo, nome, n) { return '<li><button class="lat-item" type="button" data-acao="rolar" data-alvo="' + alvo + '"><span class="rotulo-texto">' + nome + '</span><span class="conta">' + n + '</span></button></li>'; }
      return '<div class="lat-titulo"><span class="rotulo">Meu dia</span></div><ul class="lat-lista">' +
        it('sec-caixa', 'Caixa de entrada', paraComecar + comigo().length) + it('sec-ok', 'Esperando meu OK', esperaOk) +
        it('sec-livres', 'Tarefas livres', e.demandas.filter(function (d) { return d.estado === 'livre'; }).length) +
        it('sec-passos', 'Primeiros passos com IA', '') + it('sec-contrib', 'Minha contribuição', '') + it('sec-pergunta', 'Pergunta da semana', e.pergunta.respostas.length) +
        it('sec-ideias', 'Ideias', e.ideias.length) + it('sec-checkin', 'Check-in do dia', e.checkins[eu] && U.mesmoDia(e.checkins[eu].ts) ? '✓' : '·') + '</ul>' +
        '<p class="lat-nota">A caixa de entrada junta o que chegou para você. A TV nunca mostra as suas horas; elas ficam aqui para você.</p>';
    },
    conteudo: function () {
      var e = L().estado, eu = L().eu, D = BC.demandasUI, p = L().pessoa(eu);
      var paraComecar = e.demandas.filter(function (d) { return d.para === eu && d.estado === 'enviada'; });
      var minhas = e.demandas.filter(function (d) { return d.para === eu && (d.estado === 'andamento' || d.estado === 'pausada' || d.estado === 'pronta'); });
      var esperaOk = e.demandas.filter(function (d) { return d.de === eu && d.estado === 'pronta'; });
      var cuidados = L().cuidados().filter(function (c) { return c.pessoa === eu; });
      var html = '<div class="pagina-cab"><div><p class="saudacao">' + U.saudacao() + ', ' + esc(p.nome) + '.</p>' +
        '<p class="pagina-sub">' + U.dataLonga() + ' · ' + (paraComecar.length + comigo().length) + ' na caixa de entrada · trabalho medido hoje ' + U.duracao(L().trabalhoHoje(eu)) + '</p></div>' +
        '<div class="dem-acoes"><button class="botao" type="button" data-acao="falar-ideia">🎙 Falar uma ideia</button><button class="botao primario" type="button" data-acao="nova-demanda">Nova demanda</button></div></div>';

      cuidados.forEach(function (c) {
        html += '<div class="cuidado-meu"><div><b>A equipe percebeu:</b> você ' + esc(c.texto) + '. <span>' + esc(c.detalhe || '') + '</span></div>' +
          '<div class="dem-acoes"><button class="botao" type="button" data-acao="estou-bem">Estou bem</button><button class="botao primario" type="button" data-acao="pedir-uma-mao">Pedir uma mão</button></div></div>';
      });

      html += '<div class="grade-2"><div>';
      html += '<section class="secao" id="sec-caixa"><span class="rotulo">Caixa de entrada</span>' +
        (paraComecar.length || comigo().length ? '<div class="lista-limpa">' + paraComecar.map(D.item).join('') + comigo().map(BC.itemTarefa).join('') + '</div>' : '<p class="vazio">Nada novo. Bom sinal.</p>') + '</section>';
      html += '<section class="secao"><span class="rotulo">Minhas demandas em andamento</span>' + (minhas.length ? '<div class="lista-limpa">' + minhas.map(D.item).join('') + '</div>' : '<p class="vazio">Nenhuma demanda rodando.</p>') + '</section>';
      html += '<section class="secao" id="sec-ok"><span class="rotulo">Esperando o seu OK</span>' + (esperaOk.length ? '<div class="lista-limpa">' + esperaOk.map(D.item).join('') + '</div>' : '<p class="vazio">Ninguém esperando você.</p>') + '</section>';
      var livres = e.demandas.filter(function (d) { return d.estado === 'livre'; });
      html += '<section class="secao" id="sec-livres"><div class="secao-cab"><span class="rotulo">Tarefas livres · pega quem puder</span>' +
        '<button class="botao discreto" type="button" data-acao="dem-filtro" data-filtro="livres">ver todas (' + livres.length + ')</button></div>' +
        (livres.length ? '<div class="lista-limpa">' + livres.slice(0, 3).map(D.itemLivre).join('') + '</div>' : '<p class="vazio">Nenhuma tarefa livre agora.</p>') + '</section>';

      var ideias = e.ideias.slice().sort(function (a, b) { return b.apoios.length - a.apoios.length; }).slice(0, 5);
      html += '<section class="secao" id="sec-ideias"><span class="rotulo">Ideias da equipe</span><div class="lista-limpa">' + ideias.map(function (i) {
        var apoiei = i.apoios.indexOf(eu) !== -1;
        return '<div class="item" style="--cor:' + (L().pessoa(i.pessoa) || {}).cor + '">' + U.avatar(L().pessoa(i.pessoa), 26) + '<span class="item-corpo"><span class="item-titulo">' + (i.falada ? '🎙 ' : '') + esc(i.texto) + '</span>' +
          '<span class="item-meta">' + esc(L().nome(i.pessoa)) + ' · ' + U.relativo(i.ts) + ' · ' + i.apoios.length + ' apoio(s)</span></span>' +
          (i.pessoa !== eu ? '<button class="botao' + (apoiei ? ' primario' : '') + '" type="button" data-acao="apoiar" data-id="' + i.id + '">' + (apoiei ? 'Apoiando' : 'Apoiar') + '</button>' : '') + '</div>';
      }).join('') + '</div><form class="campo-inline" data-form="ideia"><input type="text" id="nova-ideia" placeholder="Tive uma ideia…"><button class="botao" type="submit">Mandar ideia</button></form>' +
        '<div class="dem-acoes"><button class="botao" type="button" data-acao="sala-guardar">💡 Salvar ideia falada</button><button class="botao" type="button" data-acao="sala-gravar-toggle" data-segurar="sim">' + (e.sala.gravando ? '■ Parar de gravar' : '⏺ Começar a gravar') + '</button></div>' +
        '<p class="form-ajuda">A sala guarda só os últimos 5 minutos em memória. Nada é gravado até alguém apertar.</p></section>';
      html += '</div><div>';

      var feitos = passosFeitos(), nFeitos = PASSOS.filter(function (x) { return feitos[x[0]]; }).length;
      html += '<section class="secao cartao" id="sec-passos"><div class="secao-cab"><span class="rotulo">Primeiros passos com IA</span><span class="num">' + nFeitos + '/' + PASSOS.length + '</span></div>' +
        '<div class="barra" style="--v:' + Math.round(nFeitos / PASSOS.length * 100) + '%"></div><ul class="lista-limpa">' + PASSOS.map(function (x) {
          return '<li><label class="marcar passo"><input type="checkbox" data-acao="passo" data-id="' + x[0] + '"' + (feitos[x[0]] ? ' checked' : '') + '> ' + esc(x[1]) + '</label></li>';
        }).join('') + '</ul><p class="form-ajuda">Travou? O botão "Pedir ajuda" de qualquer arquivo manda ele para o Theus.</p></section>';

      var meusArq = e.arquivos.filter(function (a) { return a.autor === eu; });
      var consultas = meusArq.reduce(function (s, a) { return s + (a.consultas || 0); }, 0);
      var valeus = e.demandas.filter(function (d) { return d.para === eu && d.kudos; }).length;
      var meusAp = e.aprendizados.filter(function (a) { return a.pessoa === eu; });
      var confirm = meusAp.reduce(function (s, a) { return s + a.confirmacoes.length; }, 0);
      html += '<section class="secao cartao" id="sec-contrib"><span class="rotulo">Minha contribuição</span><div class="numeros" style="grid-template-columns:repeat(2,minmax(0,1fr))">' +
        '<div class="numero"><small>Materiais que criei</small><b>' + meusArq.length + '</b></div><div class="numero"><small>Vezes que foram abertos</small><b>' + consultas + '</b></div>' +
        '<div class="numero"><small>Aprendizados meus</small><b>' + meusAp.length + (confirm ? ' · +' + confirm : '') + '</b></div><div class="numero"><small>Valeus recebidos</small><b>' + valeus + '</b></div></div>' +
        '<p class="form-ajuda">Seus aprendizados estão no APRENDIZADOS.md: a IA do terminal de todos lê antes de começar.</p></section>';

      var minhaResp = e.pergunta.respostas.filter(function (r) { return r.pessoa === eu; })[0];
      html += '<section class="secao cartao" id="sec-pergunta"><span class="rotulo">Pergunta da semana</span><p class="pergunta-texto">' + esc(e.pergunta.texto) + '</p>' +
        (minhaResp ? '<p class="dem-desc">Você respondeu: “' + esc(minhaResp.texto) + '”</p>' : '<form class="campo-inline" data-form="pergunta"><input type="text" id="resp-pergunta" placeholder="Sua resposta (vai para a TV e o acervo)"><button class="botao primario" type="submit">Responder</button></form>') +
        '<p class="form-ajuda">' + e.pergunta.respostas.length + ' resposta(s) até agora.</p></section>';

      var ck = e.checkins[eu], ckHoje = ck && U.mesmoDia(ck.ts);
      html += '<section class="secao cartao" id="sec-checkin"><span class="rotulo">Check-in do dia</span>' + (ckHoje
        ? '<p class="dem-desc">' + esc(ck.hoje) + '</p>' + (ck.bloqueio ? '<p class="dem-desc" style="color:var(--alarme)">Bloqueio: ' + esc(ck.bloqueio) + '</p>' : '')
        : '<form class="form" data-form="checkin"><input type="text" id="ck-hoje" required placeholder="O que você vai fazer hoje?"><input type="text" id="ck-bloqueio" placeholder="Algum bloqueio? (opcional)"><div><button class="botao primario" type="submit">Registrar check-in</button></div></form>') + '</section>';

      html += '<section class="secao"><span class="rotulo">Avisos</span><ul class="lista-limpa">' + e.avisos.map(function (a) {
        return '<li class="cartao">' + esc(a.texto) + '<br><span class="pagina-sub">' + esc(L().nome(a.pessoa)) + ' · ' + U.relativo(a.ts) + '</span></li>';
      }).join('') + '</ul></section></div></div>';
      return html;
    }
  };

  F.checkin = function () { var h = document.getElementById('ck-hoje').value.trim(), b = document.getElementById('ck-bloqueio').value.trim(); if (L().fazer('checkin', h, b)) BC.estacao.aviso('Check-in registrado.'); };
  F.ideia = function () { var c = document.getElementById('nova-ideia'), t = c.value.trim(); if (t && L().fazer('ideia', t)) { c.value = ''; BC.estacao.aviso('Ideia enviada. Ela aparece na TV.'); } };
  F.pergunta = function () { var c = document.getElementById('resp-pergunta'), t = c.value.trim(); if (t && L().fazer('responderPergunta', t)) BC.estacao.aviso('Resposta registrada.'); };
  A.rolar = function (el) { var alvo = document.getElementById(el.dataset.alvo); if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  A.apoiar = function (el) { L().fazer('apoiar', el.dataset.id); };
  A.passo = function (el) { var f = passosFeitos(); f[el.dataset.id] = el.checked; U.guardarLocal('babel-coop:passos:' + L().eu, JSON.stringify(f)); BC.estacao.render(); };
  A['estou-bem'] = function () { L().fazer('estouBem'); BC.estacao.aviso('Anotado. A TV deixa de mostrar este aviso por 2 horas.'); };
  A['pedir-uma-mao'] = function () { var c = L().cuidados().filter(function (x) { return x.pessoa === L().eu; })[0]; if (L().fazer('pedirAjuda', c ? c.texto : 'me dá uma mão?')) BC.estacao.aviso('Pedido enviado. A TV mostra que você pediu uma mão.'); };

  /* ======================= REUNIÃO ======================= */

  function falas(s) {
    return (s.trechos || []).slice(-6).map(function (x) {
      return '<p class="fala-linha"><b>' + esc(L().nome(x.quem)) + '</b> ' + esc(x.texto) + ' <time>' + U.hora(x.ts) + '</time></p>';
    }).join('') || '<p class="form-ajuda">Ninguém falou nada ainda.</p>';
  }

  function cartaoIdeia() {
    var c = ui().cartaoIdeia;
    if (!c) return '';
    return '<div class="sala-cartao cartao"><div class="secao-cab"><span class="rotulo">💡 Ideia falada · os últimos 5 minutos</span><span class="chip">' + c.trechos.length + ' falas</span></div>' +
      '<div class="sala-trechos">' + c.trechos.map(function (x) { return '<p class="fala-linha"><b>' + esc(L().nome(x.quem)) + '</b> ' + esc(x.texto) + '</p>'; }).join('') + '</div>' +
      '<label class="form-rotulo">Título da ideia (a frase com cara de ideia; corrija se quiser)</label><input type="text" id="ideia-titulo" value="' + esc(c.titulo) + '" autocomplete="off">' +
      '<div class="dem-acoes"><button class="botao primario" type="button" data-acao="sala-confirmar">Confirmar · vai para Ideias e para o acervo</button><button class="botao" type="button" data-acao="sala-descartar">Descartar</button></div></div>';
  }
  BC.blocoSala = function () {
    var s = L().estado.sala, sg = L().estado.sugestaoIdeia, viva = sg && Date.now() - sg.ts < 30000;
    return '<section class="secao sala ' + (s.gravando ? 'gravando' : '') + '"><div class="secao-cab"><span class="rotulo">Memória da sala</span><span class="chip">' + (s.gravando ? '● gravando desde ' + U.hora(s.desde) : s.memoria ? '◌ últimos 5 min em memória' : '○ sem memória') + '</span></div>' +
      (viva ? '<div class="sala-sugestao">💡 A sala sugere: parece que saiu uma ideia · <em>“' + esc(sg.texto) + '”</em> <button class="botao primario" type="button" data-acao="sala-guardar">Salvar</button></div>' : '') +
      '<div class="dem-acoes"><button class="botao primario" type="button" data-acao="sala-guardar" title="Ctrl+Shift+I · ou fale: Babel, guarda isso">💡 Salvar ideia falada</button>' +
      '<button class="botao' + (s.gravando ? ' primario' : '') + '" type="button" data-acao="sala-gravar-toggle" data-segurar="sim" title="Junta os 5 min anteriores com o que vem depois. Segure para juntar 10.">' + (s.gravando ? '■ Parar' : '⏺ Começar a gravar') + '</button>' +
      '<button class="botao discreto" type="button" data-acao="sala-memoria">' + (s.memoria ? '○ Conversa particular (pausar a memória)' : '◌ Religar a memória') + '</button></div>' +
      '<p class="form-ajuda">' + (s.gravando ? 'Gravando desde ' + U.hora(s.desde) + ' (com os ' + (s.juntou || 5) + ' min anteriores). Ao parar, vira uma conversa no acervo com as ideias marcadas.' : s.memoria ? 'A sala guarda só os últimos 5 minutos em memória. Nada é gravado até alguém apertar. Também vale "Babel, guarda isso" e o botão físico na mesa.' : 'Memória pausada: conversa particular. A TV mostra "sala sem memória".') + '</p>' +
      cartaoIdeia() + '<div class="falas">' + falas(s) + '</div></section>';
  };
  function blocoSala() { return BC.blocoSala(); }

  BC.vistas.reuniao = {
    lateral: function () {
      var e = L().estado, atas = e.arquivos.filter(function (a) { return a.caminho.indexOf('equipe/Reuniões/') === 0; });
      return '<div class="lat-titulo"><span class="rotulo">Reuniões</span></div><ul class="lat-lista">' +
        '<li><button class="lat-item" type="button" data-acao="atividade" data-id="reuniao" aria-current="true"><span class="rotulo-texto">' + (e.reuniao && e.reuniao.ativa ? '● ' + esc(e.reuniao.titulo) : 'Nenhuma agora') + '</span></button></li></ul>' +
        '<div class="lat-titulo"><span class="rotulo">Atas no acervo</span></div><ul class="lat-lista">' + atas.map(function (a) {
          return '<li><button class="lat-item" type="button" data-acao="abrir-arquivo" data-id="' + a.id + '"><span class="rotulo-texto">' + esc(a.caminho.split('/').pop()) + '</span></button></li>';
        }).join('') + '</ul><div class="lat-titulo"><span class="rotulo">Momentos falados</span></div><ul class="lat-lista">' + e.sala.momentos.slice(0, 6).map(function (m) {
          return '<li><span class="lat-item"><span class="rotulo-texto">' + U.quando(m.ts) + ' · ' + esc(L().nome(m.por)) + (m.ideias.length ? ' · ' + m.ideias.length + ' ideia' : '') + '</span></span></li>';
        }).join('') + '</ul>';
    },
    conteudo: function () {
      var e = L().estado, r = e.reuniao;
      if (!r || !r.ativa) {
        return '<div class="pagina-cab"><div><h1 class="pagina-titulo">Reunião</h1><p class="pagina-sub">A TV vira a mesa da reunião: cada um joga materiais do próprio computador.</p></div></div>' +
          '<form class="campo-inline" data-form="abrir-reuniao"><input type="text" id="titulo-reuniao" placeholder="Título (ex.: Reunião geral)"><button class="botao primario" type="submit">Abrir reunião</button></form>' + blocoSala();
      }
      var naTv = e.tvModo === 'reuniao';
      var mesa = r.materiais.map(function (m) {
        var a = L().arquivo(m.caminho), dest = r.destaque === m.id;
        return '<div class="mesa-item' + (dest ? ' destaque' : '') + '">' + U.avatar(L().pessoa(m.por), 24) + '<span class="item-corpo"><span class="item-titulo">' + esc(m.caminho.split('/').pop()) + '</span>' +
          '<span class="item-meta">levado por ' + esc(L().nome(m.por)) + ' · ' + U.relativo(m.ts) + '</span></span>' +
          (a ? '<button class="botao discreto" type="button" data-acao="abrir-arquivo" data-id="' + a.id + '">Abrir</button>' : '') +
          '<button class="botao' + (dest ? ' primario' : '') + '" type="button" data-acao="reu-destacar" data-id="' + m.id + '">' + (dest ? 'Em destaque' : 'Destacar') + '</button></div>';
      }).join('') || '<p class="vazio">Ninguém levou nada ainda. Em qualquer arquivo: "☰ Levar para a reunião".</p>';
      var quadros = e.arquivos.filter(function (a) { return a.tipo === 'quadro'; });
      return '<div class="pagina-cab"><div><h1 class="pagina-titulo">' + esc(r.titulo) + '</h1><p class="pagina-sub">aberta por ' + esc(L().nome(r.condutor)) + ' · <span data-desde="' + r.inicio + '">' + U.relogio(Date.now() - r.inicio) + '</span> · ' + r.participantes.length + ' pessoas</p></div>' +
        '<div class="dem-acoes"><button class="botao' + (naTv ? ' primario' : '') + '" type="button" data-acao="reu-tv">' + (naTv ? '● Na TV' : 'Mostrar na TV') + '</button>' +
        '<button class="botao" type="button" data-acao="reu-encerrar">Encerrar e gerar a ata</button></div></div>' +
        '<div class="participantes">' + r.participantes.map(function (id) { return U.avatar(L().pessoa(id), 30); }).join('') + '</div>' +
        blocoSala() +
        '<div class="reuniao-grade">' +
        '<section class="secao cartao"><span class="rotulo">Pauta</span><ul class="lista-limpa">' + r.pauta.map(function (p, i) {
          return '<li><label class="marcar passo"><input type="checkbox" data-acao="reu-marcar" data-i="' + i + '"' + (p.feito ? ' checked' : '') + '> ' + esc(p.texto) + '</label></li>';
        }).join('') + '</ul><form class="campo-inline" data-form="reu-pauta"><input type="text" id="reu-pauta" placeholder="Novo item de pauta"><button class="botao" type="submit">+</button></form></section>' +
        '<section class="secao cartao"><span class="rotulo">Na mesa</span>' + mesa +
        (quadros.length ? '<p class="form-ajuda">Ou destaque um quadro ao vivo: ' + quadros.map(function (q) { return '<button class="botao discreto" type="button" data-acao="reu-quadro" data-id="' + q.id + '">▢ ' + esc(q.caminho.split('/').pop()) + '</button>'; }).join('') + '</p>' : '') + '</section>' +
        '<section class="secao cartao"><span class="rotulo">Decisões</span><ul class="lista-limpa">' + r.decisoes.map(function (d) { return '<li>✓ ' + esc(d.texto) + ' <span class="pagina-sub">' + esc(L().nome(d.por)) + '</span></li>'; }).join('') +
        '</ul><form class="campo-inline" data-form="reu-decisao"><input type="text" id="reu-decisao" placeholder="O que foi decidido?"><button class="botao" type="submit">+</button></form></section>' +
        '<section class="secao cartao"><span class="rotulo">Próximos passos</span><ul class="lista-limpa">' + r.proximos.map(function (p, i) {
          return '<li class="item" style="--cor:' + (L().pessoa(p.quem) || {}).cor + '"><span class="item-corpo"><span class="item-titulo">' + esc(p.texto) + '</span><span class="item-meta">' + esc(L().nome(p.quem)) + '</span></span>' +
            '<button class="botao discreto" type="button" data-acao="reu-demanda" data-i="' + i + '">Virar demanda</button></li>';
        }).join('') + '</ul><form class="campo-inline" data-form="reu-proximo"><input type="text" id="reu-proximo" placeholder="Próximo passo"><select id="reu-quem">' +
        e.pessoas.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nome) + '</option>'; }).join('') + '</select><button class="botao" type="submit">+</button></form></section>' +
        '</div>';
    }
  };

  F['abrir-reuniao'] = function () { var t = document.getElementById('titulo-reuniao').value.trim() || 'Reunião geral'; if (L().fazer('iniciarReuniao', t)) { L().fazer('tvModo', 'reuniao'); BC.estacao.aviso('Reunião aberta e na TV.'); } };
  F['reu-pauta'] = function () { var c = document.getElementById('reu-pauta'); if (L().fazer('pauta', c.value.trim())) c.value = ''; };
  F['reu-decisao'] = function () { var c = document.getElementById('reu-decisao'); if (L().fazer('decisao', c.value.trim())) c.value = ''; };
  F['reu-proximo'] = function () { var c = document.getElementById('reu-proximo'); if (L().fazer('proximo', c.value.trim(), document.getElementById('reu-quem').value)) c.value = ''; };
  A['reu-tv'] = function () { var naTv = L().estado.tvModo === 'reuniao'; L().fazer('tvModo', naTv ? 'painel' : 'reuniao'); };
  A['reu-encerrar'] = function () { if (L().fazer('encerrarReuniao')) BC.estacao.aviso('Reunião encerrada. A ata foi para EQUIPE/Reuniões e para o acervo.'); };
  A['reu-marcar'] = function (el) { L().fazer('marcarPauta', +el.dataset.i); };
  A['reu-destacar'] = function (el) { L().fazer('destacar', el.dataset.id); };
  A['reu-quadro'] = function (el) { L().fazer('destacar', 'quadro:' + el.dataset.id); L().fazer('tvModo', 'reuniao'); };
  A['reu-demanda'] = function (el) {
    var p = L().estado.reuniao.proximos[+el.dataset.i];
    ui().rascunho = { titulo: p.texto, para: p.quem !== L().eu ? p.quem : null, descricao: 'Próximo passo da reunião "' + L().estado.reuniao.titulo + '".' };
    A['nova-demanda']();
  };
  A['sala-gravar'] = function () { L().fazer('gravarSala', !L().estado.sala.gravando); };
  A['sala-memoria'] = function () { L().fazer('memoriaSala', !L().estado.sala.memoria); BC.estacao.aviso(L().estado.sala.memoria ? 'Memória da sala religada.' : 'Conversa particular: a sala parou de escutar. A TV avisa.'); };
  var segurando = null;
  document.addEventListener('pointerdown', function (ev) { var b = ev.target.closest && ev.target.closest('[data-segurar]'); if (b) segurando = Date.now(); });
  A['sala-gravar-toggle'] = function () {
    var s = L().estado.sala, longo = segurando && Date.now() - segurando > 600;
    segurando = null;
    if (s.gravando) { if (L().fazer('pararGravarSala')) BC.estacao.aviso('Gravação parada: a conversa foi para EQUIPE/Reuniões e para o acervo.'); return; }
    if (L().fazer('comecarGravarSala', longo ? 10 : 5)) BC.estacao.aviso('Gravando: juntei os ' + (longo ? 10 : 5) + ' minutos anteriores. A TV mostra desde quando.');
  };
  A['sala-guardar'] = function () {
    var s = L().estado.sala, agora = Date.now();
    var trechos = s.trechos.filter(function (x) { return agora - x.ts < 5 * U.MIN; });
    if (!trechos.length) trechos = s.trechos.slice(-4);
    if (!trechos.length) { BC.estacao.aviso('Ainda não há nada falado nos últimos 5 minutos.'); return; }
    var ideia = trechos.filter(function (x) { return /\b(e se|que tal|podia|podiamos|vamos testar)\b/.test(U.normalizar(x.texto)); }).pop() || trechos[trechos.length - 1];
    ui().cartaoIdeia = { trechos: trechos, titulo: ideia.texto };
    L().fazer('guardarMomento');
    BC.estacao.abrir('reuniao');
    BC.estacao.aviso('Os últimos 5 minutos viraram texto. Confira o título e confirme.');
    setTimeout(function () { var i = document.getElementById('ideia-titulo'); if (i) i.focus(); }, 50);
  };
  A['sala-confirmar'] = function () {
    var c = ui().cartaoIdeia, i = document.getElementById('ideia-titulo'), t = (i ? i.value : (c && c.titulo) || '').trim();
    if (!c || !t) return;
    L().fazer('ideiaFalada', t);
    ui().cartaoIdeia = null;
    BC.estacao.aviso('Ideia falada guardada: foi para Ideias, para a TV e para o acervo.');
    BC.estacao.render();
  };
  A['sala-descartar'] = function () { ui().cartaoIdeia = null; BC.estacao.render(); };
  A['falar-ideia'] = function () { ui().falar = true; BC.estacao.render(); var c = document.getElementById('texto-falado'); if (c) c.focus(); };
})(window.BC);
