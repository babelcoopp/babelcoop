/* Babel Coop — protótipo · vistas: Acervo, Inteligência (aprendizados, sonho, prompts) e Terminais ao vivo */
window.BC = window.BC || {};
BC.acoes = BC.acoes || {};
BC.vistas = BC.vistas || {};
BC.formularios = BC.formularios || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc, A = BC.acoes, F = BC.formularios;
  function L() { return BC.loja; }
  function ui() { return BC.estacao.ui; }
  var NOME_TIPO = { nota: 'nota', 'código': 'código', planilha: 'planilha', pdf: 'PDF', mapa: 'mapa mental', quadro: 'quadro', imagem: 'imagem', 'vídeo': 'vídeo', arquivo: 'arquivo',
    ata: 'ata', aprendizado: 'aprendizado', demanda: 'demanda', prompt: 'prompt', ideia: 'ideia', resposta: 'pergunta da semana', fala: 'fala guardada', terminal: 'terminal' };

  /* ======================= ACERVO ======================= */

  BC.vistas.acervo = {
    lateral: function () {
      var st = BC.acervo.estatisticas(L().estado), f = ui().tipoAcervo || '';
      var tipos = Object.keys(st.porTipo).sort(function (a, b) { return st.porTipo[b] - st.porTipo[a]; });
      return '<div class="lat-titulo"><span class="rotulo">Acervo</span></div>' +
        '<p class="lat-nota">' + st.docs + ' materiais e ' + st.termos + ' termos indexados, sem LLM.</p><ul class="lat-lista">' +
        '<li><button class="lat-item" type="button" data-acao="acervo-tipo" data-tipo="" aria-current="' + (!f) + '"><span class="rotulo-texto">Tudo</span><span class="conta">' + st.docs + '</span></button></li>' +
        tipos.map(function (t) {
          return '<li><button class="lat-item" type="button" data-acao="acervo-tipo" data-tipo="' + esc(t) + '" aria-current="' + (f === t) + '"><span class="rotulo-texto">' + esc(NOME_TIPO[t] || t) + '</span><span class="conta">' + st.porTipo[t] + '</span></button></li>';
        }).join('') + '</ul><p class="lat-nota">A IA do terminal usa o mesmo acervo: <code>coop buscar "…"</code> e <code>coop ler caminho</code>.</p>';
    },
    conteudo: function () {
      var q = ui().buscaAcervo || '', modo = ui().modoAcervo || 'palavras';
      var res = q ? BC.acervo.buscar(L().estado, q, { modo: modo, tipo: ui().tipoAcervo || null, limite: 15 }) : [];
      var html = '<div class="pagina-cab"><div><h1 class="pagina-titulo">Acervo</h1><p class="pagina-sub">Tudo o que a equipe cria vira busca. Sem LLM: por palavras (BM25) ou por semelhança (vetores calculados aqui).</p></div></div>' +
        '<div class="acervo-busca"><input type="text" id="busca-acervo" placeholder="Procure qualquer coisa: reembolso, sessão expirando, plano anual…" autocomplete="off" value="' + esc(q) + '">' +
        '<div class="alternar"><button type="button" class="' + (modo === 'palavras' ? 'ativo' : '') + '" data-acao="acervo-modo" data-modo="palavras">Palavras</button>' +
        '<button type="button" class="' + (modo === 'semelhanca' ? 'ativo' : '') + '" data-acao="acervo-modo" data-modo="semelhanca">Semelhança</button></div></div>';
      if (!q) {
        return html + '<div class="sugestoes"><span class="rotulo">Experimente</span>' + ['reembolso', 'sessão expirando', 'plano anual', 'clínicas Campinas', 'webinar dentistas', 'proposta de uma página'].map(function (s) {
          return '<button class="chip" type="button" data-acao="acervo-sugestao" data-q="' + esc(s) + '">' + esc(s) + '</button>';
        }).join('') + '</div><p class="form-ajuda">Tente "Semelhança" com palavras que não aparecem iguais no texto (ex.: "clinicas" sem acento, "reembolsos" no plural): a busca acha pelos pedaços das palavras.</p>';
      }
      html += '<p class="pagina-sub">' + res.length + ' resultado(s) · ' + (modo === 'palavras' ? 'por palavras' : 'por semelhança') + '</p><div class="lista-limpa">';
      res.forEach(function (r) {
        var d = r.doc;
        html += '<div class="resultado"><div class="resultado-cab"><span class="chip">' + esc(NOME_TIPO[d.tipo] || d.tipo) + '</span><b>' + esc(d.titulo) + '</b>' +
          '<span class="pagina-sub">' + esc(d.caminho || L().nome(d.pessoa)) + ' · ' + U.quando(d.ts) + ' · pontos ' + r.pontos.toFixed(2) + '</span></div>' +
          '<p class="resultado-trecho">' + r.trecho + '</p>' +
          '<button class="botao discreto" type="button" data-acao="acervo-abrir" data-tipo="' + esc(d.abrir.tipo) + '" data-ref="' + esc(d.abrir.ref || '') + '">Abrir</button></div>';
      });
      return html + '</div>' + (res.length ? '' : '<p class="vazio">Nada encontrado. Tente a busca por semelhança.</p>');
    }
  };

  var buscaTimer = null;
  document.addEventListener('input', function (ev) {
    if (ev.target.id === 'busca-acervo') {
      ui().buscaAcervo = ev.target.value;
      clearTimeout(buscaTimer);
      buscaTimer = setTimeout(function () { BC.estacao.render(); }, 180);
    }
    if (ev.target.id === 'busca-term') { ui().buscaTerm = ev.target.value; clearTimeout(buscaTimer); buscaTimer = setTimeout(function () { BC.estacao.render(); }, 180); }
    if (ev.target.id === 'novo-aprendizado') {
      var aviso = document.getElementById('novidade-geral'), v = ev.target.value.trim();
      if (!aviso) return;
      if (v.length < 8) { aviso.className = 'aprender-novidade'; aviso.textContent = 'Uma frase curta. Se a equipe já souber, soma +1 em vez de repetir.'; return; }
      var n = L().A.checarNovidade(v);
      aviso.className = 'aprender-novidade ' + (n.repetido ? 'repetido' : 'novo');
      aviso.textContent = n.repetido ? '≈ Já sabemos algo parecido: "' + n.parecido.texto + '" (' + L().nome(n.parecido.pessoa) + '). Vai somar +1.' : '✓ Parece novo. Entra no APRENDIZADOS.md que a IA lê.';
    }
  });

  A['acervo-tipo'] = function (el) { ui().tipoAcervo = el.dataset.tipo; BC.estacao.abrir('acervo'); };
  A['acervo-modo'] = function (el) { ui().modoAcervo = el.dataset.modo; BC.estacao.render(); };
  A['acervo-sugestao'] = function (el) { ui().buscaAcervo = el.dataset.q; BC.estacao.render(); };
  A['acervo-abrir'] = function (el) {
    var t = el.dataset.tipo, ref = el.dataset.ref;
    if (t === 'arquivo') BC.explorador.abrirArquivo(ref);
    else if (t === 'demanda') A['abrir-demanda'](el, null);
    else if (t === 'terminal') { ui().termPessoa = ref; BC.estacao.abrir('terminais'); }
    else if (t === 'momento') BC.estacao.abrir('reuniao');
    else { ui().secaoInt = t === 'prompts' ? 'prompts' : t === 'ideias' ? 'ideias' : t === 'pergunta' ? 'pergunta' : 'aprendizados'; BC.estacao.abrir('inteligencia'); }
  };

  /* ======================= INTELIGÊNCIA ======================= */

  var SECOES = [['aprendizados', 'Aprendizados'], ['sonho', 'O sonho'], ['prompts', 'Melhores prompts'], ['pergunta', 'Pergunta da semana'], ['ideias', 'Ideias']];

  function pontos(p) {
    return '⭐ ' + p.estrelas.length + ' · reusos ' + p.reusos + ' · ' + (p.resultado === 'ok' ? 'deu certo (OK)' : p.resultado === 'devolvida' ? 'foi devolvida' : 'sem resultado ainda') + (p.texto.length > 40 ? ' · específico' : ' · vago');
  }

  function cartaoPrompt(p, i) {
    var eu = L().eu, dei = p.estrelas.indexOf(eu) !== -1;
    return '<div class="prompt-cartao">' + (i != null ? '<span class="prompt-pos">' + (i + 1) + '</span>' : '') + U.avatar(L().pessoa(p.pessoa), 30) +
      '<div class="item-corpo"><p class="prompt-texto">“' + esc(p.texto) + '”</p><span class="item-meta">' + esc(L().nome(p.pessoa)) + ' · ' + U.quando(p.ts) + ' · ' + pontos(p) + ' · ' + L().pontosPrompt(p).toFixed(1) + ' pontos</span></div>' +
      '<div class="dem-acoes">' + (p.pessoa !== eu ? '<button class="botao' + (dei ? ' primario' : '') + '" type="button" data-acao="prompt-estrela" data-id="' + p.id + '">' + (dei ? '★' : '☆') + '</button>' : '') +
      '<button class="botao" type="button" data-acao="prompt-usar" data-id="' + p.id + '">Usar no terminal</button></div></div>';
  }

  BC.vistas.inteligencia = {
    lateral: function () {
      var e = L().estado, s = ui().secaoInt || 'aprendizados';
      var n = { aprendizados: e.aprendizados.length, sonho: e.sonho ? e.sonho.novos.length + ' novos' : '', prompts: e.prompts.length, pergunta: e.pergunta.respostas.length, ideias: e.ideias.length };
      return '<div class="lat-titulo"><span class="rotulo">Inteligência da equipe</span></div><ul class="lat-lista">' + SECOES.map(function (x) {
        return '<li><button class="lat-item" type="button" data-acao="int-secao" data-secao="' + x[0] + '" aria-current="' + (s === x[0]) + '"><span class="rotulo-texto">' + x[1] + '</span><span class="conta">' + n[x[0]] + '</span></button></li>';
      }).join('') + '</ul><p class="lat-nota">O que cada um aprende volta para a IA do terminal de todos, pelo APRENDIZADOS.md e pelo acervo.</p>';
    },
    conteudo: function () {
      var e = L().estado, s = ui().secaoInt || 'aprendizados', eu = L().eu, html = '';
      if (s === 'aprendizados') {
        var md = L().arquivo('equipe/Aprendizados/APRENDIZADOS.md');
        html = '<div class="pagina-cab"><div><h1 class="pagina-titulo">Aprendizados</h1><p class="pagina-sub">Repetido não é aprendizado: soma +1 confirmado. O que é novo entra e a IA de todos passa a saber.</p></div>' +
          (md ? '<button class="botao" type="button" data-acao="abrir-arquivo" data-id="' + md.id + '">Abrir o APRENDIZADOS.md (o que a IA lê)</button>' : '') + '</div>' +
          '<form class="aprender" data-form="aprendizado"><input type="text" id="novo-aprendizado" placeholder="O que você aprendeu hoje?" autocomplete="off">' +
          '<p class="aprender-novidade" id="novidade-geral">Uma frase curta. Se a equipe já souber, soma +1 em vez de repetir.</p><div><button class="botao primario" type="submit">Registrar aprendizado</button></div></form><div class="lista-limpa">';
        e.aprendizados.forEach(function (ap) {
          var confirmei = ap.confirmacoes.indexOf(eu) !== -1;
          html += '<div class="item" style="--cor:' + ((L().pessoa(ap.pessoa) || {}).cor || '#8670ff') + '">' + U.avatar(L().pessoa(ap.pessoa), 28) +
            '<span class="item-corpo"><span class="item-titulo quebra">' + esc(ap.texto) + '</span><span class="item-meta">' + (ap.ia ? '🤖 IA do terminal de ' : '') + esc(L().nome(ap.pessoa)) + ' · ' + U.quando(ap.ts) +
            (ap.origem ? ' · de "' + esc(ap.origem) + '"' : '') + (ap.confirmacoes.length ? ' · +' + ap.confirmacoes.length + ' confirmado' : '') + '</span></span>' +
            (ap.pessoa !== eu ? '<button class="botao' + (confirmei ? ' primario' : '') + '" type="button" data-acao="confirmar-ap" data-id="' + ap.id + '">' + (confirmei ? '+1 dado' : '+1 também aprendi') + '</button>' : '') + '</div>';
        });
        return html + '</div>';
      }
      if (s === 'sonho') {
        var so = e.sonho || {};
        var novos = (so.novos || []).map(function (id) { return e.aprendizados.filter(function (a) { return a.id === id; })[0]; }).filter(Boolean);
        var top = (so.top || []).map(function (id) { return e.prompts.filter(function (p) { return p.id === id; })[0]; }).filter(Boolean);
        return '<div class="pagina-cab"><div><h1 class="pagina-titulo">O sonho</h1><p class="pagina-sub">Toda madrugada o sistema revisa o dia e refina o conhecimento. Último sonho: ' + (so.ts ? U.quando(so.ts) + ' às ' + U.hora(so.ts) : '—') + '.</p></div>' +
          '<button class="botao primario" type="button" data-acao="sonhar">Sonhar agora (demonstração)</button></div>' +
          '<div class="numeros espaco"><div class="numero"><small>Aprendizados novos</small><b>' + novos.length + '</b></div><div class="numero"><small>Reforçados (+1)</small><b>' + (so.reforcados || 0) + '</b></div>' +
          '<div class="numero"><small>Ideias faladas guardadas</small><b>' + (so.ideiasFaladas || 0) + '</b></div><div class="numero"><small>Total no APRENDIZADOS.md</small><b>' + (so.total || 0) + '</b></div></div>' +
          '<div class="grade-2"><div><section class="secao"><span class="rotulo">O que a Babel aprendeu</span><div class="lista-limpa">' + (novos.map(function (ap) {
            return '<div class="cartao">' + esc(ap.texto) + '<br><span class="pagina-sub">' + (ap.ia ? '🤖 ' : '') + esc(L().nome(ap.pessoa)) + '</span></div>';
          }).join('') || '<p class="vazio">Nada novo nesse período.</p>') + '</div></section>' +
          '<section class="secao"><span class="rotulo">Perguntas que ficaram sem resposta</span><ul class="lista-limpa">' + ((so.perguntas || []).map(function (q) { return '<li class="cartao">' + esc(q) + '</li>'; }).join('') || '<li class="vazio">Nenhuma.</li>') + '</ul></section></div>' +
          '<div><section class="secao"><span class="rotulo">Temas do dia</span><div class="sugestoes">' + (so.temas || []).map(function (t) { return '<span class="chip">' + esc(t.termo) + ' · ' + t.vezes + '</span>'; }).join('') + '</div></section>' +
          '<section class="secao"><span class="rotulo">Os 3 melhores prompts</span><div class="lista-limpa">' + top.map(function (p, i) { return cartaoPrompt(p, i); }).join('') + '</div></section>' +
          '<section class="secao cartao"><span class="rotulo">Como o sonho funciona</span><ol class="passos-sonho"><li>Junta o dia: terminais, prompts, aprendizados, reuniões, demandas e falas guardadas.</li><li>Junta repetidos e reforça o que se confirmou.</li>' +
          '<li>Agrupa por tema e acha perguntas sem resposta.</li><li>Escolhe os 3 melhores prompts, com critérios à vista.</li><li>Atualiza o APRENDIZADOS.md que a IA de cada terminal lê.</li><li>Deixa este relatório no Meu dia e na TV.</li></ol>' +
          '<p class="form-ajuda">Tudo com contas, sem LLM. No app, os dados também saem em SQLite e JSONL para a IA que o Theus está programando.</p></section></div></div>';
      }
      if (s === 'prompts') {
        var todos = e.prompts.slice().sort(function (a, b) { return L().pontosPrompt(b) - L().pontosPrompt(a); });
        return '<div class="pagina-cab"><div><h1 class="pagina-titulo">Melhores prompts</h1><p class="pagina-sub">Critérios à vista: estrelas de quem viu, reusos, se a demanda deu certo e se o pedido é específico. Sem pontuação acumulada por pessoa.</p></div></div>' +
          '<section class="secao"><span class="rotulo">Top 3 de hoje</span><div class="lista-limpa">' + todos.slice(0, 3).map(function (p, i) { return cartaoPrompt(p, i); }).join('') + '</div></section>' +
          '<section class="secao"><span class="rotulo">Biblioteca de prompts</span><div class="lista-limpa">' + todos.slice(3).map(function (p) { return cartaoPrompt(p); }).join('') + '</div></section>';
      }
      if (s === 'pergunta') {
        var minha = e.pergunta.respostas.filter(function (r) { return r.pessoa === eu; })[0];
        return '<div class="pagina-cab"><div><h1 class="pagina-titulo">Pergunta da semana</h1><p class="pagina-sub">Perguntas abertas para descobrir o que ninguém ainda sabe. As respostas vão para a TV e o acervo.</p></div></div>' +
          '<p class="pergunta-texto grande">' + esc(e.pergunta.texto) + '</p>' +
          (minha ? '' : '<form class="campo-inline" data-form="pergunta"><input type="text" id="resp-pergunta" placeholder="Sua resposta"><button class="botao primario" type="submit">Responder</button></form>') +
          '<div class="lista-limpa">' + e.pergunta.respostas.map(function (r) {
            return '<div class="item" style="--cor:' + ((L().pessoa(r.pessoa) || {}).cor || '#8670ff') + '">' + U.avatar(L().pessoa(r.pessoa), 28) + '<span class="item-corpo"><span class="item-titulo quebra">“' + esc(r.texto) + '”</span><span class="item-meta">' + esc(L().nome(r.pessoa)) + ' · ' + U.quando(r.ts) + '</span></span></div>';
          }).join('') + '</div>';
      }
      html = '<div class="pagina-cab"><div><h1 class="pagina-titulo">Ideias</h1><p class="pagina-sub">Qualquer um propõe; os outros apoiam. As que ganham força aparecem na TV.</p></div><button class="botao" type="button" data-acao="falar-ideia">🎙 Falar uma ideia</button></div>' +
        '<form class="campo-inline" data-form="ideia"><input type="text" id="nova-ideia" placeholder="Tive uma ideia…"><button class="botao primario" type="submit">Mandar ideia</button></form><div class="lista-limpa">';
      e.ideias.slice().sort(function (a, b) { return b.apoios.length - a.apoios.length; }).forEach(function (i) {
        var apoiei = i.apoios.indexOf(eu) !== -1;
        html += '<div class="item" style="--cor:' + ((L().pessoa(i.pessoa) || {}).cor || '#8670ff') + '">' + U.avatar(L().pessoa(i.pessoa), 28) + '<span class="item-corpo"><span class="item-titulo quebra">' + (i.falada ? '🎙 ' : '') + esc(i.texto) + '</span>' +
          '<span class="item-meta">' + esc(L().nome(i.pessoa)) + ' · ' + U.quando(i.ts) + ' · ' + i.apoios.length + ' apoio(s)' + (i.apoios.length ? ': ' + i.apoios.map(L().nome).join(', ') : '') + '</span></span>' +
          (i.pessoa !== eu ? '<button class="botao' + (apoiei ? ' primario' : '') + '" type="button" data-acao="apoiar" data-id="' + i.id + '">' + (apoiei ? 'Apoiando' : 'Apoiar') + '</button>' : '') + '</div>';
      });
      return html + '</div>';
    }
  };

  F.aprendizado = function () {
    var c = document.getElementById('novo-aprendizado'), t = c.value.trim();
    if (t.length < 8) { c.focus(); return; }
    var n = L().A.checarNovidade(t);
    if (L().fazer('aprendizado', t, 'Meu dia')) { c.value = ''; BC.estacao.aviso(n.repetido ? 'Já sabíamos: somou +1 em "' + n.parecido.texto + '".' : 'Aprendizado novo! A IA de todos vai ler.'); }
  };
  A['int-secao'] = function (el) { ui().secaoInt = el.dataset.secao; BC.estacao.abrir('inteligencia'); };
  A['confirmar-ap'] = function (el) { L().fazer('confirmar', el.dataset.id); };
  A.sonhar = function () { if (L().fazer('sonhar')) BC.estacao.aviso('Sonho feito agora: veja o relatório.'); };
  A['prompt-estrela'] = function (el) { L().fazer('estrela', el.dataset.id); };
  A['prompt-usar'] = function (el) {
    var p = L().estado.prompts.filter(function (x) { return x.id === el.dataset.id; })[0];
    if (!p) return;
    L().fazer('reusar', p.id);
    BC.estacao.alternarTerminal(true);
    var campo = document.getElementById('term-entrada');
    if (campo) { campo.value = 'claude "' + p.texto + '"'; campo.focus(); }
    BC.estacao.aviso('Prompt no terminal. Ajuste e aperte Enter.');
  };

  /* ======================= TERMINAIS AO VIVO ======================= */

  function linhaTerm(l) {
    var marca = l.tipo === 'prompt' ? '✦ ' : l.tipo === 'cmd' ? '❯ ' : l.tipo === 'ia' ? '🤖 ' : '  ';
    return '<div class="tl tl-' + l.tipo + (l.por ? ' tl-controle' : '') + '"><time>' + U.hora(l.ts) + '</time>' + (l.por ? '<b class="tl-por">' + esc(L().nome(l.por)) + '</b> ' : '') + esc(marca + l.texto) + '</div>';
  }
  function agentesDe(p) { return (p.agentes && p.agentes.length ? p.agentes : [{ id: null, nome: 'terminal', cor: p.cor }]); }
  function linhasDo(pessoaId, agenteId, ags) {
    var todas = L().estado.terminais[pessoaId] || [];
    if (!agenteId) return todas;
    var primeiro = ags[0] && ags[0].id === agenteId;
    return todas.filter(function (l) { return l.agente === agenteId || (primeiro && !l.agente); });
  }
  function controleComigo(dono) { return (L().estado.controles || []).filter(function (c) { return c.quem === L().eu && c.dono === dono && c.estado !== 'encerrado'; })[0]; }
  function podeDireto(dono) { return L().eAdmin() || (L().estado.projetos || []).some(function (p) { return p.membros.indexOf(L().eu) !== -1 && p.membros.indexOf(dono) !== -1; }); }

  BC.vistas.terminais = {
    lateral: function () {
      var e = L().estado, eu = L().eu, meu = e.transmissao[eu] !== false;
      return '<div class="lat-titulo"><span class="rotulo">Terminais da equipe</span></div><ul class="lat-lista">' +
        '<li><button class="lat-item" type="button" data-acao="term-pessoa" data-id="" aria-current="' + (!ui().termPessoa) + '"><span class="rotulo-texto">Parede (todos)</span></button></li>' +
        e.pessoas.map(function (p) {
          var st = p.status === 'offline' ? 'offline' : e.transmissao[p.id] === false ? 'pausado' : 'ao vivo';
          return '<li><button class="lat-item" type="button" data-acao="term-pessoa" data-id="' + p.id + '" aria-current="' + (ui().termPessoa === p.id) + '"><span class="ponto ' + (st === 'ao vivo' ? 'online' : st === 'pausado' ? 'ausente' : 'offline') + '"></span>' +
            '<span class="rotulo-texto">' + esc(p.nome) + ' <small>· ' + esc(agentesDe(p).map(function (a) { return a.nome; }).join(', ')) + '</small></span><span class="conta">' + st + '</span></button></li>';
        }).join('') + '</ul><div class="lat-titulo"><span class="rotulo">Os seus agentes</span></div>' +
        '<p class="lat-nota">' + (meu ? '● Transmitindo ao vivo.' : '○ Transmissão pausada.') + ' <button class="botao discreto" type="button" data-acao="term-transmissao">' + (meu ? 'Pausar' : 'Ligar') + '</button></p>' +
        '<p class="lat-nota">Todos veem todos. Para mexer: o Theus e a gestão entram direto; membros do mesmo projeto também; os outros pedem e o dono aceita. Quem está no seu terminal aparece com um selo, e você encerra quando quiser.</p>';
    },
    conteudo: function () {
      var e = L().estado, alvo = ui().termPessoa, eu = L().eu;
      if (alvo) {
        var p = L().pessoa(alvo), ags = agentesDe(p), agSel = ui().termAgente && ags.some(function (a) { return a.id === ui().termAgente; }) ? ui().termAgente : (ags[0] && ags[0].id);
        var q = U.normalizar(ui().buscaTerm || ''), linhas = linhasDo(alvo, agSel, ags).filter(function (l) { return !q || U.normalizar(l.texto).indexOf(q) !== -1; });
        var pausado = e.transmissao[alvo] === false, ctrl = alvo !== eu ? controleComigo(alvo) : null, agObj = ags.filter(function (a) { return a.id === agSel; })[0];
        var botoes = alvo === eu ? '' : ctrl && ctrl.estado === 'ativo'
          ? '<span class="chip ok">● você está neste terminal</span><button class="botao" type="button" data-acao="controle-sair" data-id="' + ctrl.id + '">Sair</button>'
          : ctrl ? '<span class="chip">pedido enviado · esperando ' + esc(p.nome) + ' aceitar</span><button class="botao discreto" type="button" data-acao="controle-sair" data-id="' + ctrl.id + '">Cancelar</button>'
            : '<button class="botao primario" type="button" data-acao="term-entrar" data-id="' + p.id + '" data-agente="' + (agSel || '') + '">' + (podeDireto(alvo) ? 'Entrar' : 'Pedir para entrar') + '</button>';
        botoes += (alvo === eu ? '' : '<button class="botao" type="button" data-acao="term-chamar" data-id="' + p.id + '" data-oque="o meu terminal">Chamar para cá</button><button class="botao" type="button" data-acao="falar-com" data-id="' + p.id + '">Falar com</button>') +
          '<button class="botao discreto" type="button" data-acao="term-pessoa" data-id="">Voltar para a parede</button>';
        return '<div class="pagina-cab"><div class="dem-pessoas"><button class="sem-estilo" type="button" data-acao="abrir-perfil" data-id="' + p.id + '">' + U.avatar(p, 40, true) + '</button><div><h1 class="pagina-titulo">' + esc(p.nome) + ' · ' + esc(agObj ? agObj.nome : 'terminal') + '</h1>' +
          '<p class="pagina-sub">' + (pausado ? 'transmissão pausada' : 'ao vivo') + ' · ' + (agObj && agObj.oQueFaz ? esc(agObj.oQueFaz) + ' · ' : '') + linhas.length + ' linhas' + (e.fazendo && e.fazendo[alvo] ? ' · agora: ' + esc(e.fazendo[alvo]) : '') + '</p></div></div><div class="dem-acoes">' + botoes + '</div></div>' +
          (ags.length > 1 ? '<div class="alternar term-abas-pessoa">' + ags.map(function (a) { return '<button type="button" class="' + (a.id === agSel ? 'ativo' : '') + '" data-acao="term-agente" data-id="' + (a.id || '') + '"><span class="term-av" style="--cor:' + a.cor + '">' + esc(a.nome.slice(0, 2).toUpperCase()) + '</span>' + esc(a.nome) + '</button>'; }).join('') + '</div>' : '') +
          '<div class="arv-filtro"><input type="text" id="busca-term" placeholder="Procurar no histórico deste terminal" autocomplete="off" value="' + esc(ui().buscaTerm || '') + '"></div>' +
          '<div class="term-historico term-ampliado">' + (pausado && alvo !== eu ? '<p class="form-ajuda">' + esc(p.nome) + ' pausou a transmissão. O histórico anterior continua aqui.</p>' : '') + (linhas.map(linhaTerm).join('') || '<p class="vazio">Nada no histórico.</p>') +
          (ctrl && ctrl.estado === 'ativo' ? '<form class="term-controle" data-form="controle-digitar"><span class="term-p2">❯</span><input type="text" id="controle-texto" placeholder="Digite aqui: aparece na tela de ' + esc(p.nome) + ' e roda lá" autocomplete="off" spellcheck="false"><button class="botao primario" type="submit">Enviar</button></form>' : '') + '</div>';
      }
      var cs = e.controles || [], ativos = cs.filter(function (c) { return c.estado === 'ativo'; }).length, nAg = e.pessoas.reduce(function (s, p) { return s + agentesDe(p).length; }, 0);
      return '<div class="pagina-cab"><div><h1 class="pagina-titulo">Terminais ao vivo</h1><p class="pagina-sub">' + e.pessoas.length + ' pessoas · ' + nAg + ' agentes' + (ativos ? ' · ' + ativos + ' pessoa(s) ajudando em terminal alheio' : '') + '. Todo mundo vê todo mundo; para ajudar, entre e digite.</p></div></div>' +
        '<div class="parede">' + e.pessoas.map(function (p) {
          var pausado = e.transmissao[p.id] === false, off = p.status === 'offline', ags = agentesDe(p);
          return ags.map(function (ag) {
            var linhas = linhasDo(p.id, ag.id, ags), ult = linhas[linhas.length - 1], ultimas = linhas.slice(-3);
            var parado = ult && Date.now() - ult.ts > 10 * U.MIN, erro = ult && /erro|✗|failing|failed|error/i.test(ult.texto);
            var ctrlAtivo = cs.filter(function (c) { return c.dono === p.id && c.estado === 'ativo' && (!c.agenteId || c.agenteId === ag.id); })[0];
            var cls = 'parede-term' + (pausado || off ? ' parado' : '') + (erro && parado ? ' atencao' : '') + (p.id === eu ? ' meu' : '');
            return '<div class="' + cls + '"><button class="parede-abrir" type="button" data-acao="term-pessoa" data-id="' + p.id + '" data-agente="' + (ag.id || '') + '">' +
              '<span class="parede-cab">' + U.avatar(p, 22) + '<b>' + esc(p.nome) + '</b><span class="parede-agente"><span class="term-av" style="--cor:' + ag.cor + '">' + esc(ag.nome.slice(0, 2).toUpperCase()) + '</span>' + esc(ag.nome) + '</span>' +
              '<span class="' + (off ? 'selo-off' : pausado ? 'selo-pausa' : ctrlAtivo ? 'selo-controle' : 'selo-vivo') + '">' + (off ? 'desligado' : pausado ? 'pausado' : ctrlAtivo ? '● ' + esc(L().nome(ctrlAtivo.quem)) + ' aqui' : '● ao vivo') + '</span></span>' +
              '<span class="parede-corpo">' + (pausado ? '<span class="tl">transmissão pausada por ' + esc(p.nome) + '</span>' : off ? '<span class="tl">computador desligado</span>' : (ultimas.map(linhaTerm).join('') || '<span class="tl">sem atividade ainda</span>')) + '</span>' +
              (ult && !off ? '<span class="parede-quando">' + (erro && parado ? '⚠ mesmo erro há ' + U.duracao(Date.now() - ult.ts) : U.relativo(ult.ts)) + '</span>' : '') + '</button>' +
              (p.id !== eu && !off ? '<span class="parede-acoes"><button class="botao discreto" type="button" data-acao="term-entrar" data-id="' + p.id + '" data-agente="' + (ag.id || '') + '">' + (podeDireto(p.id) ? 'Entrar' : 'Pedir para entrar') + '</button>' +
                '<button class="botao discreto" type="button" data-acao="term-chamar" data-id="' + p.id + '" data-oque="o meu terminal">Chamar</button><button class="botao discreto" type="button" data-acao="falar-com" data-id="' + p.id + '">Falar</button></span>' : '') + '</div>';
          }).join('');
        }).join('') + '</div>';
    }
  };

  A['term-pessoa'] = function (el) { ui().termPessoa = el.dataset.id || null; ui().termAgente = el.dataset.agente || null; ui().buscaTerm = ''; BC.estacao.abrir('terminais'); };
  A['term-agente'] = function (el) { ui().termAgente = el.dataset.id || null; BC.estacao.render(); };
  A['term-transmissao'] = function () { var on = L().estado.transmissao[L().eu] !== false; L().fazer('transmissao', !on); };
  A['controle-sair'] = function (el) { L().fazer('sairTerminal', el.dataset.id); BC.estacao.render(); };
  F['controle-digitar'] = function () {
    var c = document.getElementById('controle-texto'), t = c ? c.value.trim() : '', ctrl = controleComigo(ui().termPessoa);
    if (!t || !ctrl) return;
    if (L().fazer('controleDigitar', ctrl.id, t)) { c.value = ''; c.focus(); }
  };

  /* ======================= SOBRE A PESSOA (perfil em tela inteira) ======================= */

  var SELOS = [
    ['🥇', 'Primeiro aprendizado', function (s) { return s.aprendizados >= 1; }],
    ['🤝', '10 ajudas dadas', function (s) { return s.ajudas >= 10; }],
    ['📚', 'Skill usada por 5 pessoas', function (s) { return s.skillUsada >= 5; }],
    ['💡', 'Ideia que virou demanda', function (s) { return s.ideias >= 2; }],
    ['📺', 'Quadro projetado na TV', function (s) { return s.quadros >= 1; }],
    ['🧠', '30 aprendizados', function (s) { return s.aprendizados >= 30; }],
    ['✅', '20 demandas com OK', function (s) { return s.demandasOk >= 20; }],
    ['🔥', '7 dias seguidos', function (s) { return s.sequencia >= 7; }]
  ];
  function estatisticas(id, mesIni) {
    var e = L().estado, noMes = function (ts) { return !mesIni || ts >= mesIni; };
    var demOk = e.demandas.filter(function (d) { return d.para === id && d.estado === 'concluida' && noMes(d.fim || d.criada); });
    var ajudas = (e.controles || []).filter(function (c) { return c.quem === id && c.estado !== 'pedido'; }).length + e.demandas.filter(function (d) { return d.para === id && /^Ajuda:/.test(d.titulo) && d.estado === 'concluida'; }).length;
    var aps = e.aprendizados.filter(function (a) { return a.pessoa === id; }), ideias = e.ideias.filter(function (i) { return i.pessoa === id; });
    var meus = e.arquivos.filter(function (a) { return a.autor === id || a.dono === id; });
    var skills = (e.lojaEquipe || []).filter(function (i) { return i.dono === id; }), skillUsada = skills.reduce(function (m, i) { return Math.max(m, Object.keys(i.instaladoPor).length); }, 0);
    var tarefas = e.tarefas.filter(function (t) { return t.donos.indexOf(id) !== -1 && t.atual > t.donos.indexOf(id); }).length;
    var horas = 0, pausas = 0, n = 0, porHora = {};
    e.demandas.forEach(function (d) { if (d.para !== id || !d.inicio || !noMes(d.inicio)) return; var tt = L().tempo(d); horas += tt.trabalho; pausas += tt.parado; n++; L().segmentos(d).forEach(function (s) { var h = new Date(s[0]).getHours(); porHora[h] = (porHora[h] || 0) + (s[1] - s[0]); }); });
    var melhor = Object.keys(porHora).sort(function (a, b) { return porHora[b] - porHora[a]; })[0];
    var totalAcervo = e.arquivos.length + e.aprendizados.length + e.ideias.length, minhaParte = meus.length + aps.length + ideias.length;
    var demMes = e.demandas.filter(function (d) { return noMes(d.criada); }).length, minhasDem = e.demandas.filter(function (d) { return (d.para === id || d.de === id) && noMes(d.criada); }).length;
    var projetos = (e.projetos || []), meusPj = projetos.filter(function (p) { return p.membros.indexOf(id) !== -1; }).length;
    var pontos = demOk.length * 10 + ajudas * 15 + aps.length * 5 + ideias.length * 5 + skills.length * 20 + meus.filter(function (a) { return a.tipo === 'quadro' || a.tipo === 'mapa'; }).length * 5;
    var nivel = Math.min(10, 1 + Math.floor(pontos / 60)), progresso = Math.round((pontos % 60) / 60 * 100);
    var dias = {}; aps.forEach(function (a) { dias[new Date(a.ts).toDateString()] = true; });
    var seq = 0; for (var i = 0; i < 60; i++) { if (dias[new Date(Date.now() - i * U.DIA).toDateString()]) seq++; else if (i > 0) break; }
    return { demandasOk: demOk.length, ajudas: ajudas, aprendizados: aps.length, ideias: ideias.length, skills: skills.length, skillUsada: skillUsada, tarefas: tarefas,
      quadros: meus.filter(function (a) { return a.tipo === 'quadro'; }).length, mapas: meus.filter(function (a) { return a.tipo === 'mapa'; }).length, clones: meus.filter(function (a) { return /\/Clones\//.test(a.caminho); }).length,
      arquivos: meus.length, horas: horas, pausas: pausas, media: n ? horas / n : 0, melhor: melhor, pctAcervo: totalAcervo ? Math.round(minhaParte / totalAcervo * 100) : 0, pctDem: demMes ? Math.round(minhasDem / demMes * 100) : 0,
      pctAjuda: Math.min(100, ajudas * 10), projetos: meusPj, totalProjetos: projetos.length, pontos: pontos, nivel: nivel, progresso: progresso, sequencia: seq,
      maisAbertos: meus.slice().sort(function (a, b) { return (b.consultas || 0) - (a.consultas || 0); }).slice(0, 3) };
  }
  var NIVEIS = ['', 'Aprendiz', 'Colega', 'Parceiro', 'Cuidador', 'Construtor', 'Mestre', 'Guia', 'Farol', 'Lenda', 'Babel'];

  BC.vistas.perfil = {
    lateral: function () {
      var e = L().estado, atual = BC.estacao.abaAtual(), id = atual.tipo === 'perfil' ? atual.ref : L().eu;
      return '<div class="lat-titulo"><span class="rotulo">Sobre a pessoa</span></div><ul class="lat-lista">' + e.pessoas.map(function (p) {
        return '<li><button class="lat-item" type="button" data-acao="abrir-perfil" data-id="' + p.id + '" aria-current="' + (p.id === id) + '">' + U.avatar(p, 20, true) + '<span class="rotulo-texto">' + esc(p.nome) + (p.id === L().eu ? ' (você)' : '') + '</span></button></li>';
      }).join('') + '</ul><p class="lat-nota">Todos veem o perfil de todos. A gamificação é da pessoa contra ela mesma: sem ranking, sem placar na TV.</p>';
    },
    conteudo: function (tab) {
      var e = L().estado, p = L().pessoa(tab.ref);
      if (!p) return '<p class="vazio">Pessoa não encontrada.</p>';
      var mesIni = new Date(); mesIni.setDate(1); mesIni.setHours(0, 0, 0, 0);
      var s = estatisticas(p.id, ui().perfilTudo ? null : mesIni.getTime()), sTotal = estatisticas(p.id, null), eu = L().eu === p.id;
      var conquistados = SELOS.filter(function (x) { return x[2](sTotal); }), proximo = SELOS.filter(function (x) { return !x[2](sTotal); })[0];
      var eventos = e.eventos.filter(function (ev) { return ev.pessoa === p.id; }).slice(0, 8);
      var linha = eventos.length ? eventos : e.demandas.filter(function (d) { return d.para === p.id || d.de === p.id; }).slice(0, 6).map(function (d) { var h = d.historico[d.historico.length - 1]; return { texto: (h ? L().nome(h.quem) + ' ' + h.acao : 'demanda') + ' · ' + d.titulo, ts: h ? h.ts : d.criada, demanda: d.id }; });
      return '<div class="perfil-tela"><header class="perfil-topo"><div class="perfil-cab">' + U.avatar(p, 88, true) + '<div><h1 class="pagina-titulo">' + esc(p.nome) + '</h1><p class="pagina-sub">' + esc(e.areas[p.area]) + (p.papel === 'admin' ? ' · gestão' : '') + ' · ' + p.status +
        ' · agentes: ' + esc((p.agentes || []).map(function (a) { return a.nome; }).join(', ') || 'nenhum') + (e.fazendo && e.fazendo[p.id] ? ' · agora: ' + esc(e.fazendo[p.id]) : '') + '</p>' +
        '<div class="perfil-agentes">' + (p.agentes || []).map(function (a) { return '<span class="chip"><span class="term-av" style="--cor:' + a.cor + '">' + esc(a.nome.slice(0, 2).toUpperCase()) + '</span>' + esc(a.nome) + (a.oQueFaz ? ' · ' + esc(a.oQueFaz.slice(0, 40)) : '') + '</span>'; }).join('') + '</div></div></div>' +
        '<div class="dem-acoes">' + (eu || L().eAdmin() ? '<button class="botao" type="button" data-acao="editar-perfil">Editar perfil</button>' : '<button class="botao" type="button" data-acao="term-pessoa" data-id="' + p.id + '">Ver terminal</button><button class="botao" type="button" data-acao="falar-com" data-id="' + p.id + '">Falar com</button>') + '</div></header>' +
        '<section class="perfil-nivel cartao"><div class="perfil-nivel-cab"><span class="perfil-nivel-num">NÍVEL ' + s.nivel + '</span><b>' + esc(NIVEIS[sTotal.nivel] || 'Babel') + '</b><span class="perfil-seq">🔥 ' + sTotal.sequencia + ' dia' + (sTotal.sequencia === 1 ? '' : 's') + ' com aprendizado</span></div>' +
        '<div class="barra" style="--v:' + sTotal.progresso + '%"></div><p class="pagina-sub">' + sTotal.progresso + '% para o nível ' + Math.min(10, sTotal.nivel + 1) + ' · ' + sTotal.pontos + ' pontos, só seus: contra você mesmo, nunca contra os outros</p>' +
        '<div class="perfil-selos">' + conquistados.map(function (x) { return '<span class="selo" title="' + esc(x[1]) + '">' + x[0] + ' ' + esc(x[1]) + '</span>'; }).join('') + (proximo ? '<span class="selo proximo">próxima: ' + proximo[0] + ' ' + esc(proximo[1]) + '</span>' : '') + '</div></section>' +
        '<div class="perfil-grade"><section class="cartao"><div class="secao-cab"><span class="rotulo">Trabalhos · ' + (ui().perfilTudo ? 'sempre' : U.mes()) + '</span><button class="botao discreto" type="button" data-acao="perfil-periodo">' + (ui().perfilTudo ? 'ver este mês' : 'ver tudo') + '</button></div>' +
        '<div class="numeros dois"><div class="numero"><small>Demandas com OK</small><b>' + s.demandasOk + '</b></div><div class="numero"><small>Ajudas dadas</small><b>' + s.ajudas + '</b></div><div class="numero"><small>Ideias · aprendizados</small><b>' + s.ideias + ' · ' + s.aprendizados + '</b></div><div class="numero"><small>Skills publicadas</small><b>' + s.skills + '</b></div><div class="numero"><small>Tarefas entregues</small><b>' + s.tarefas + '</b></div><div class="numero"><small>Quadros · mapas</small><b>' + s.quadros + ' · ' + s.mapas + '</b></div></div></section>' +
        '<section class="cartao"><span class="rotulo">Tempo · ' + (ui().perfilTudo ? 'sempre' : U.mes()) + '</span><div class="numeros dois"><div class="numero"><small>Em demandas</small><b>' + U.duracao(s.horas) + '</b></div><div class="numero"><small>Média por demanda</small><b>' + U.duracao(s.media) + '</b></div><div class="numero"><small>Pausada</small><b>' + U.duracao(s.pausas) + '</b></div><div class="numero"><small>Melhor foco</small><b>' + (s.melhor != null ? s.melhor + 'h–' + (+s.melhor + 2) + 'h' : '—') + '</b></div></div><p class="form-ajuda">É sobre a pessoa, para ela. Ninguém é comparado.</p></section>' +
        '<section class="cartao"><span class="rotulo">' + (eu ? 'Você' : esc(p.nome)) + ' no Babel Coop</span><p class="perfil-fatia">' + (eu ? 'você é' : 'é') + ' <b>' + sTotal.pctAcervo + '%</b> do que a Babel sabe</p>' +
        [['acervo', sTotal.pctAcervo], ['demandas do mês', s.pctDem], ['ajudas', sTotal.pctAjuda]].map(function (x) { return '<div class="perfil-barra"><span>' + x[0] + '</span><div class="barra" style="--v:' + x[1] + '%"></div><b>' + x[1] + '%</b></div>'; }).join('') +
        '<div class="perfil-barra"><span>projetos</span><div class="barra" style="--v:' + (sTotal.totalProjetos ? Math.round(sTotal.projetos / sTotal.totalProjetos * 100) : 0) + '%"></div><b>' + sTotal.projetos + ' de ' + sTotal.totalProjetos + '</b></div></section></div>' +
        '<div class="perfil-grade"><section class="cartao"><span class="rotulo">Dados e materiais</span><p class="pagina-sub">' + sTotal.arquivos + ' arquivos · ' + sTotal.mapas + ' mapas · ' + sTotal.quadros + ' quadros · ' + sTotal.clones + ' clones</p><div class="lista-limpa">' +
        (sTotal.maisAbertos.map(function (a) { return '<button class="item" type="button" data-acao="abrir-arquivo" data-id="' + a.id + '" style="--cor:' + p.cor + '"><span class="arv-ic ic-' + esc(a.tipo) + '">' + esc(BC.explorador.sigla(a.tipo)) + '</span><span class="item-corpo"><span class="item-titulo">' + esc(a.caminho.split('/').pop()) + '</span><span class="item-meta">aberto ' + (a.consultas || 0) + ' vezes pelos outros</span></span></button>'; }).join('') || '<p class="vazio">Nada ainda.</p>') + '</div></section>' +
        '<section class="cartao"><span class="rotulo">Linha do tempo</span><div class="lista-limpa">' + (linha.map(function (ev) { return '<div class="item" style="--cor:' + p.cor + '"><span class="item-corpo"><span class="item-titulo quebra">' + esc(ev.texto) + '</span><span class="item-meta">' + U.relativo(ev.ts) + '</span></span>' + (ev.demanda ? '<button class="botao discreto" type="button" data-acao="abrir-demanda" data-id="' + ev.demanda + '">abrir</button>' : '') + '</div>'; }).join('') || '<p class="vazio">Nada nos últimos dias.</p>') + '</div></section></div></div>';
    }
  };
  A['perfil-periodo'] = function () { ui().perfilTudo = !ui().perfilTudo; BC.estacao.render(); };
})(window.BC);
