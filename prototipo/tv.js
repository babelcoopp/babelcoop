/* Babel Coop — protótipo · TV (tela principal): painel geral, reunião, quadro ao vivo e projeção. Só exibe; o controle vem da Estação e do iPad */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc;
  function L() { return BC.loja; }
  function $(id) { return document.getElementById(id); }

  var T = { fila: [], atual: null, ate: 0, mapa: null, pulso: null, inicio: Date.now(), atualizado: Date.now(), mexeuTimer: null,
    giraI: 0, comp: {}, proj: null };
  var GIRA_MS = 12000;

  /* ---------- fila de acontecimentos (um por vez, agrupa quando chegam muitos) ---------- */

  function enfileirar(ev) {
    if (ev.ts < T.inicio - 5000) return;
    T.fila.push(ev);
    if (Date.now() > T.ate) proximo();
  }

  function proximo() {
    if (!T.fila.length) return;
    if (T.fila.length >= 3) {
      var junta = T.fila.splice(0, T.fila.length);
      T.atual = { pessoa: junta[junta.length - 1].pessoa, texto: junta.length + ' novidades: ' + junta.map(function (e) { return e.textoTv || e.texto; }).join(' · '), ts: Date.now(), grupo: true };
    } else {
      T.atual = T.fila.shift();
    }
    T.ate = Date.now() + (T.fila.length ? 5000 : 8000);
    renderEvento(true);
  }

  function renderEvento(animar) {
    var ev = T.atual, box = $('tv-evento');
    if (!ev) { box.innerHTML = ''; return; }
    var p = L().pessoa(ev.pessoaTv || ev.pessoa);
    box.innerHTML = '<span class="estrela" aria-hidden="true">✦</span>' + (p ? U.avatar(p) : '') +
      '<p' + (animar ? '' : ' style="animation:none"') + '>' + esc(ev.textoTv || ev.texto) + '</p>' +
      '<time>' + U.relativo(ev.ts) + '</time>' + (T.fila.length ? '<span class="fila">+' + T.fila.length + ' na fila</span>' : '');
  }

  /* ---------- mostrar um arquivo de verdade (reunião e projeção) ---------- */

  function paginaSimples(a, n) {
    try {
      var d = JSON.parse(BC.editor.conteudo(a)), p = d.paginas[Math.min(n, d.paginas.length) - 1] || [];
      return '<div class="tv-pdf-simples"><h3>' + esc(d.titulo) + '</h3>' + p.map(function (l) { return l.indexOf('# ') === 0 ? '<h4>' + esc(l.slice(2)) + '</h4>' : '<p>' + esc(l) + '</p>'; }).join('') + '</div>';
    } catch (e) { return '<div class="tv-vazio">PDF sem prévia.</div>'; }
  }

  function pdfNaTv(el, a, pagina) {
    if (!window.pdfjsLib) { el.innerHTML = paginaSimples(a, pagina); return; }
    el.innerHTML = '<div class="tv-pdf"><canvas></canvas></div>';
    var cv = el.querySelector('canvas');
    try { if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; } catch (e) { /* sem worker */ }
    window.pdfjsLib.getDocument({ data: BC.editor.bytesDe(a) }).promise
      .then(function (pdf) { return pdf.getPage(Math.min(pagina, pdf.numPages)); })
      .then(function (pg) {
        var alto = Math.max(200, el.clientHeight - 8), base = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: alto / base.height });
        var dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = vp.width * dpr; cv.height = vp.height * dpr;
        cv.style.width = vp.width + 'px'; cv.style.height = vp.height + 'px';
        var ctx = cv.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return pg.render({ canvasContext: ctx, viewport: vp }).promise;
      })
      .catch(function () { el.innerHTML = paginaSimples(a, pagina); });
  }

  /* desenha o arquivo dentro de "el" e devolve as partes vivas (quadro, mapa) */
  function mostrarArquivo(el, a, pagina) {
    var ed = BC.editor, c = ed.conteudo(a), h = {}, dono = a.dono === 'equipe' ? 'da equipe' : 'de ' + L().nome(a.dono);
    el.innerHTML = '';
    if ((a.local && c == null) || ((a.tipo === 'video' || a.tipo === 'binario') && a.dono !== 'equipe' && !L().online(a.dono))) {
      el.innerHTML = '<div class="tv-vazio">Este arquivo fica no computador ' + esc(dono) + ' e abre pela rede quando ele estiver ligado.</div>';
      return h;
    }
    switch (a.tipo) {
      case 'pdf': pdfNaTv(el, a, pagina || 1); break;
      case 'imagem': el.innerHTML = '<img class="tv-img" src="' + esc(c) + '" alt="' + esc(a.caminho.split('/').pop()) + '">'; break;
      case 'md': el.innerHTML = '<article class="md-corpo tv-md">' + ed.markdown(c || '') + '</article>'; break;
      case 'csv': el.innerHTML = '<div class="tv-tabela">' + ed.tabelaCsv(c || '') + '</div>'; break;
      case 'html':
        el.innerHTML = '<iframe class="tv-iframe" sandbox="allow-scripts" title="Prévia do site"></iframe>';
        el.querySelector('iframe').srcdoc = c || '';
        break;
      case 'mapa':
        el.innerHTML = '<div class="tv-mm"></div>';
        try { h.mapa = new BC.MapaMental(el.firstChild, JSON.parse(c), { editavel: false, apresentar: true }); } catch (e) { el.innerHTML = '<div class="tv-vazio">Mapa ilegível.</div>'; }
        break;
      case 'quadro':
        el.innerHTML = '<div class="tv-q"></div>';
        h.quadro = new BC.Quadro(el.firstChild, a.id, { tv: true });
        break;
      case 'video':
        el.innerHTML = a.local && c ? '<video class="tv-img" src="' + esc(c) + '" autoplay muted loop playsinline></video>'
          : '<div class="tv-video"><div class="proj-play"></div><span>' + esc(a.caminho.split('/').pop()) + ' · toca pela rede, do computador ' + esc(dono) + '</span></div>';
        break;
      case 'binario': el.innerHTML = '<div class="tv-vazio">Sem prévia para este tipo de arquivo.</div>'; break;
      default: el.innerHTML = '<div class="tv-codigo">' + ed.blocoCodigo(c || '', ed.lingua(a.tipo)) + '</div>';
    }
    return h;
  }

  function apagarVivos(h) { if (h && h.quadro) h.quadro.destruir(); }
  function atualizarVivos(h, a) {
    if (!h) return;
    if (h.quadro) h.quadro.atualizar();
    if (h.mapa && a) { try { h.mapa.atualizar(JSON.parse(BC.editor.conteudo(a))); } catch (e) { /* mapa ilegível */ } }
  }

  /* ---------- topo e selos ---------- */

  function renderTopo(e) {
    var ct = e.cronometroTv, c = e.campanha, box = $('tv-cronometro');
    if (ct && ct.fim > Date.now()) {
      box.className = 'tv-cronometro reuniao';
      box.innerHTML = '<span class="tv-rotulo">◷ ' + esc(ct.rotulo) + '</span><span class="tv-cron-valor" data-regressiva="' + ct.fim + '">' + U.regressiva(ct.fim).texto + '</span>';
    } else {
      box.className = 'tv-cronometro';
      box.innerHTML = '<span class="tv-rotulo">◷ ' + esc(c.nome) + ' · faltam</span><span class="tv-cron-valor" data-regressiva="' + c.fim + '">' + U.regressiva(c.fim).texto + '</span>';
    }
    var s = e.sala, r = e.reuniao, selos = '';
    if (s.gravando) selos += '<span class="tv-selo gravando">gravando a sala desde ' + U.hora(s.desde) + '</span>';
    else if (s.memoria) selos += '<span class="tv-selo memoria">sala com memória de 5 min</span>';
    else selos += '<span class="tv-selo apagado">sala sem memória</span>';
    if (r && r.ativa && e.tvModo !== 'reuniao') selos += '<span class="tv-selo reuniao">reunião aberta</span>';
    (e.controles || []).filter(function (c) { return c.estado === 'ativo'; }).slice(0, 2).forEach(function (c) {
      selos += '<span class="tv-selo controle">' + esc(L().nome(c.quem)) + ' no terminal de ' + esc(L().nome(c.dono)) + '</span>';
    });
    $('tv-selos').innerHTML = selos;
    var sg = e.sugestaoIdeia, box = $('tv-sugestao');
    if (box) {
      var viva = sg && Date.now() - sg.ts < 30000;
      box.hidden = !viva;
      if (viva) box.innerHTML = '<span class="tv-sug-ic">💡</span><span class="tv-sug-texto">Parece que saiu uma ideia: <em>“' + esc(sg.texto) + '”</em></span><b>salvar na Estação ou no celular · ou diga “Babel, guarda isso”</b>';
    }
  }

  /* ---------- modo painel ---------- */

  function renderFaixa(e) {
    var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    var abertas = e.tarefas.filter(function (t) { return t.atual < L().fluxo(t.fluxo).etapas.length; });
    var paradas = abertas.filter(function (t) { return Date.now() - t.paradaDesde > 2 * U.DIA; }).length;
    var atrasadas = abertas.filter(function (t) { return t.prazo && t.prazo < hoje.getTime(); }).length +
      e.demandas.filter(function (d) { return d.prazo && d.prazo < hoje.getTime() && d.estado !== 'concluida' && d.estado !== 'cancelada'; }).length;
    var rodando = e.demandas.filter(function (d) { return d.estado === 'andamento'; }).length;
    var livres = e.demandas.filter(function (d) { return d.estado === 'livre'; }).length;
    var online = e.pessoas.filter(function (p) { return p.status === 'online' || p.status === 'foco'; }).length;
    var atencao = atrasadas > 0, f = $('tv-faixa');
    f.className = 'tv-faixa' + (atencao ? ' atencao' : '');
    f.innerHTML = '<span class="tv-faixa-palavra">' + (atencao ? 'ATENÇÃO' : 'NO RITMO') + '</span>' +
      '<span class="tv-faixa-numeros"><b>' + U.pad(e.concluidasHoje) + '</b> concluídas hoje</span>' +
      '<span class="tv-faixa-numeros"><b>' + U.pad(rodando) + '</b> rodando</span>' +
      '<span class="tv-faixa-numeros livres"><b>' + U.pad(livres) + '</b> livres para pegar</span>' +
      (paradas ? '<span class="tv-faixa-numeros fora"><b>' + U.pad(paradas) + '</b> paradas há dias</span>' : '') +
      (atrasadas ? '<span class="tv-faixa-numeros fora"><b>' + U.pad(atrasadas) + '</b> atrasadas</span>' : '') +
      '<span class="tv-faixa-numeros"><b>' + online + '/' + e.pessoas.length + '</b> online</span>' +
      '<span class="tv-faixa-numeros">equipe mediu <b>' + U.duracao(L().trabalhoHoje()) + '</b></span>';
  }

  function renderMetas(e) {
    var cor = getComputedStyle($('vista-tv')).getPropertyValue('--tv-assin').trim() || '#a040fd';
    $('tv-metas').innerHTML = '<span class="tv-rotulo">Metas do mês</span><div class="tv-instrumentos">' + e.metas.map(function (m) {
      var pc = BC.pctMeta(m);
      return '<div class="tv-inst' + (pc == null ? ' sem-dado' : '') + '">' + BC.arco(pc, pc != null && pc >= 0.9 ? '#7fd6a6' : cor, pc == null) +
        '<b>' + (pc == null ? 'sem dado' : Math.round(pc * 100) + '%') + '</b><span>' + esc(e.areas[m.area]) + '</span></div>';
    }).join('') + '</div>';
  }

  function renderCampanha(e) {
    var c = e.campanha, pc = c.atual / c.alvo;
    $('tv-campanha').innerHTML = '<span class="tv-rotulo">' + esc(c.nome) + '</span><div class="tv-campanha">' +
      '<div class="tv-anel">' + BC.anel(pc, pc >= 1 ? '#7fd6a6' : '#29ccec', 'rgba(255,255,255,0.08)') +
      '<div class="tv-anel-centro"><b>' + U.pad(c.atual) + '<span class="tv-de">/' + c.alvo + '</span></b><span>' + Math.round(pc * 100) + '%</span></div></div>' +
      '<p>' + esc(c.descricao) + (c.atual < c.alvo ? ' · faltam ' + (c.alvo - c.atual) : ' · meta batida!') + '</p></div>';
  }

  /* a zona que gira: avisos, evolução, pergunta, sonho, tarefas livres, ideias */
  function cartoesGira(e) {
    var r = [], m = e.mural;
    r.push(['Avisos e mural', '<ul class="tv-avisos">' + e.avisos.slice(0, 2).map(function (a) { return '<li>' + esc(a.texto) + '</li>'; }).join('') + '</ul>' +
      '<div class="tv-mural">' + (m[0] ? '<p class="fala">“' + esc(m[0].texto) + '”</p><span class="quem">' + esc(L().nome(m[0].pessoa)) + ' · ' + U.relativo(m[0].ts) + '</span>' : '') + '</div>']);
    var hoje = e.aprendizados.filter(function (a) { return U.mesmoDia(a.ts); }), ult = (hoje.length ? hoje : e.aprendizados).slice(0, 2);
    r.push(['A Babel está aprendendo', '<p class="tv-grande"><b>' + hoje.length + '</b> aprendizado' + (hoje.length === 1 ? '' : 's') + ' novo' + (hoje.length === 1 ? '' : 's') + ' hoje · ' + e.aprendizados.length + ' no total</p>' +
      ult.map(function (a) { return '<p class="tv-citacao"><em>“' + esc(a.texto) + '”</em><span>' + (a.ia ? 'IA do terminal de ' : '') + esc(L().nome(a.pessoa)) + (a.confirmacoes.length ? ' · +' + a.confirmacoes.length : '') + '</span></p>'; }).join('')]);
    var resp = e.pergunta.respostas[e.pergunta.respostas.length - 1];
    r.push(['Pergunta da semana', '<p class="tv-pergunta">' + esc(e.pergunta.texto) + '</p>' +
      (resp ? '<p class="tv-citacao"><em>“' + esc(resp.texto) + '”</em><span>' + esc(L().nome(resp.pessoa)) + ' · ' + e.pergunta.respostas.length + ' respostas</span></p>' : '<p class="tv-citacao">Responda na sua Estação, em Meu dia.</p>')]);
    var so = e.sonho, top = so ? so.top.map(function (id) { return e.prompts.filter(function (p) { return p.id === id; })[0]; }).filter(Boolean) : [];
    if (top.length) {
      r.push(['O sonho desta noite · top 3 prompts', '<ol class="tv-top">' + top.map(function (p) { return '<li><span>“' + esc(p.texto) + '”</span><small>' + esc(L().nome(p.pessoa)) + ' · ⭐ ' + p.estrelas.length + ' · reusado ' + p.reusos + '×</small></li>'; }).join('') + '</ol>' +
        (so.temas.length ? '<p class="tv-temas">' + so.temas.slice(0, 4).map(function (t) { return '<span>' + esc(t.termo) + '</span>'; }).join('') + '</p>' : '')]);
    }
    var livres = e.demandas.filter(function (d) { return d.estado === 'livre'; });
    if (livres.length) {
      r.push(['Tarefas livres · pega quem puder', '<ul class="tv-livres">' + livres.slice(0, 3).map(function (d) {
        return '<li>' + U.avatar(L().pessoa(d.de)) + '<span>' + esc(d.titulo) + '<small>pedida por ' + esc(L().nome(d.de)) + (d.estimativaMin ? ' · ~' + d.estimativaMin + ' min' : '') + '</small></span></li>';
      }).join('') + '</ul><p class="tv-dica">Na Estação: Meu dia → Tarefas livres, ou no terminal: <b>coop livres</b></p>']);
    }
    var ideias = e.ideias.slice().sort(function (a, b) { return b.apoios.length - a.apoios.length; }).slice(0, 2);
    if (ideias.length) {
      r.push(['Ideias da equipe', ideias.map(function (i) { return '<p class="tv-citacao"><em>' + (i.falada ? '🎙 ' : '') + '“' + esc(i.texto) + '”</em><span>' + esc(L().nome(i.pessoa)) + ' · ' + i.apoios.length + ' apoio(s)</span></p>'; }).join('')]);
    }
    return r;
  }

  function renderGira(e) {
    var cs = cartoesGira(e), i = T.giraI % cs.length, c = cs[i];
    $('tv-gira').innerHTML = '<div class="tv-gira-cab"><span class="tv-rotulo">' + esc(c[0]) + '</span><span class="tv-pontos">' + cs.map(function (x, k) { return '<i' + (k === i ? ' class="on"' : '') + '></i>'; }).join('') + '</span></div>' +
      '<div class="tv-gira-corpo" data-cartao="' + i + '">' + c[1] + '</div>';
  }

  function renderTrilhas(e) {
    var todas = e.tarefas.filter(function (t) { return t.atual < L().fluxo(t.fluxo).etapas.length; }).sort(function (a, b) { return b.paradaDesde - a.paradaDesde; });
    var abertas = todas.slice(0, 2), maisParada = todas[todas.length - 1];
    if (maisParada && abertas.indexOf(maisParada) === -1) abertas.push(maisParada);
    var pulso = T.pulso && T.pulso.ate > Date.now() ? T.pulso : null;
    $('tv-trilhas').innerHTML = '<span class="tv-rotulo">Tarefas passando de mão em mão</span>' + abertas.map(function (t) {
      var dias = Math.floor((Date.now() - t.paradaDesde) / U.DIA);
      var elos = t.donos.map(function (id, i) {
        var p = L().pessoa(id), cls = i < t.atual ? 'feito' : i === t.atual ? 'atual' : '';
        var fio = i ? '<span class="tv-fio' + (i <= t.atual ? ' feito' : '') + (pulso && pulso.tarefa === t.id && i === t.atual ? ' pulso' : '') + '"></span>' : '';
        return fio + '<span class="tv-elo ' + cls + '" style="--cor:' + p.cor + '" title="' + esc(p.nome) + '">' + (p.foto ? '<img src="' + esc(p.foto) + '" alt="">' : esc(p.nome.slice(0, 2).toUpperCase())) + '</span>';
      }).join('');
      return '<div class="tv-trilha"><div class="tv-trilha-titulo">' + esc(t.titulo) + (dias >= 2 ? '<small>parada há ' + dias + ' dias com ' + esc(L().nome(t.donos[t.atual])) + '</small>' : '') + '</div>' +
        '<div class="tv-corrente">' + elos + '</div><span class="tv-pct">' + L().pct(t) + '%</span></div>';
    }).join('');
  }

  /* cuidando da gente: o que o sistema notou e quem pode ajudar (a pessoa pode desligar) */
  function renderCuidado(e) {
    var lista = L().cuidados().filter(function (c) { var p = L().pessoa(c.pessoa); return p && !p.naoMostrarCuidado; });
    var box = $('tv-cuidado');
    box.classList.toggle('tudo-bem', !lista.length);
    if (!lista.length) {
      box.innerHTML = '<span class="tv-rotulo">Cuidando da gente</span><p class="tv-tudo-bem">Todo mundo bem por aqui ✓</p><p class="tv-dica">Se alguém ficar muito tempo numa tarefa, travar ou sumir, aparece aqui, com quem pode ajudar.</p>';
      return;
    }
    box.innerHTML = '<span class="tv-rotulo">Cuidando da gente · ' + lista.length + '</span><ul class="tv-cuidados">' + lista.slice(0, 2).map(function (c) {
      var p = L().pessoa(c.pessoa);
      return '<li>' + U.avatar(p) + '<span><b>' + esc(p.nome) + '</b> ' + esc(c.texto) + '<small>' + esc(c.detalhe || '') + ' · quem pode ajudar: <b>' + esc(L().nome(c.ajuda)) + '</b></small></span></li>';
    }).join('') + '</ul>' + (lista.length > 2 ? '<p class="tv-dica">+' + (lista.length - 2) + ' sinal(is) na Estação, em Equipe</p>' : '');
  }

  function renderPainel(e) {
    renderFaixa(e);
    renderMetas(e);
    renderCampanha(e);
    renderGira(e);
    renderTrilhas(e);
    renderCuidado(e);
  }

  /* ---------- modo reunião ---------- */

  function renderReuniao(e) {
    var r = e.reuniao, s = e.sala;
    $('tv-reu-cab').innerHTML = '<div><span class="tv-rotulo">Reunião</span><h2>' + esc(r.titulo) + '</h2></div>' +
      '<div class="tv-reu-info"><span class="num tv-reu-tempo" data-desde="' + r.inicio + '">' + U.relogio(Date.now() - r.inicio) + '</span>' +
      '<span class="tv-reu-pessoas">' + r.participantes.map(function (id) { return U.avatar(L().pessoa(id)); }).join('') + '</span></div>';
    var dest = r.destaque || '', mat = r.materiais.filter(function (m) { return m.id === dest; })[0];
    var quadroId = dest.indexOf('quadro:') === 0 ? dest.slice(7) : null, a = quadroId ? L().arquivo(quadroId) : mat ? L().arquivo(mat.caminho) : null;
    var chave = a ? a.id + '|' + (a.tipo === 'quadro' || a.tipo === 'mapa' ? 'vivo' : a.modificado) : 'vazio';
    var mesa = $('tv-reu-palco');
    if (T.comp.chaveMesa !== chave) {
      apagarVivos(T.comp.mesa);
      T.comp.chaveMesa = chave;
      T.comp.mesa = a ? mostrarArquivo(mesa, a, 1) : null;
      if (!a) mesa.innerHTML = '<div class="tv-vazio">A mesa está vazia. Na Estação, em qualquer arquivo: “☰ Levar para a reunião”.</div>';
    } else atualizarVivos(T.comp.mesa, a);
    $('tv-reu-mesa-cab').innerHTML = a ? '<span class="tv-rotulo">Na mesa</span><b>' + esc(a.caminho.split('/').pop()) + '</b><span class="tv-dica">' + (mat ? 'levado por ' + esc(L().nome(mat.por)) : 'quadro ao vivo') + '</span>' : '<span class="tv-rotulo">Na mesa</span>';
    $('tv-reu-fila').innerHTML = r.materiais.map(function (m) {
      return '<span class="tv-mat' + (m.id === dest ? ' on' : '') + '">' + U.avatar(L().pessoa(m.por)) + esc(m.caminho.split('/').pop()) + '</span>';
    }).join('');
    var falas = (s.trechos || []).slice(-3);
    $('tv-reu-lado').innerHTML =
      '<section><span class="tv-rotulo">Pauta</span><ul class="tv-pauta">' + r.pauta.map(function (p) { return '<li class="' + (p.feito ? 'feito' : '') + '">' + (p.feito ? '✓ ' : '○ ') + esc(p.texto) + '</li>'; }).join('') + '</ul></section>' +
      '<section><span class="tv-rotulo">Decidido</span><ul class="tv-pauta">' + (r.decisoes.map(function (d) { return '<li class="decisao">' + esc(d.texto) + '</li>'; }).join('') || '<li class="apagado">nada ainda</li>') + '</ul></section>' +
      '<section><span class="tv-rotulo">Próximos passos</span><ul class="tv-pauta">' + (r.proximos.map(function (p) { return '<li><b>' + esc(L().nome(p.quem)) + '</b> · ' + esc(p.texto) + '</li>'; }).join('') || '<li class="apagado">nenhum ainda</li>') + '</ul></section>' +
      (s.gravando || s.memoria ? '<section><span class="tv-rotulo">' + (s.gravando ? '● Gravando' : '◌ Memória da sala') + '</span>' + (falas.map(function (x) { return '<p class="tv-fala"><b>' + esc(L().nome(x.quem)) + '</b> ' + esc(x.texto) + '</p>'; }).join('') || '<p class="tv-dica">Ninguém falou ainda.</p>') + '</section>' : '');
  }

  /* ---------- modo quadro ao vivo (iPad ou Estação desenhando) ---------- */

  function renderQuadro(e) {
    var a = L().arquivo(e.tvQuadro);
    $('tv-q-cab').innerHTML = '<span class="tv-rotulo">▢ Quadro ao vivo</span><b>' + esc(a.caminho.split('/').pop().replace('.quadro', '')) + '</b><span class="tv-dica">desenhe no iPad ou na Estação: aparece aqui na hora</span>';
    if (T.comp.chaveQuadro !== a.id) {
      apagarVivos(T.comp.quadro);
      T.comp.chaveQuadro = a.id;
      $('tv-q-palco').innerHTML = '<div class="tv-q"></div>';
      T.comp.quadro = { quadro: new BC.Quadro($('tv-q-palco').firstChild, a.id, { tv: true }) };
    } else atualizarVivos(T.comp.quadro, a);
  }

  /* ---------- troca de modo ---------- */

  var ESQUELETO = {
    painel: '<div class="tv-painel"><div class="tv-faixa" id="tv-faixa"></div><section class="tv-blocos"><article class="tv-bloco" id="tv-metas"></article>' +
      '<article class="tv-bloco" id="tv-campanha"></article><article class="tv-bloco tv-gira" id="tv-gira"></article></section>' +
      '<section class="tv-meio"><article class="tv-bloco tv-trilhas" id="tv-trilhas"></article><article class="tv-bloco tv-cuidado" id="tv-cuidado"></article></section></div>',
    reuniao: '<div class="tv-reu"><header class="tv-reu-cab" id="tv-reu-cab"></header><div class="tv-reu-grade"><section class="tv-bloco tv-reu-mesa">' +
      '<div class="tv-reu-mesa-cab" id="tv-reu-mesa-cab"></div><div class="tv-reu-palco" id="tv-reu-palco"></div><div class="tv-reu-fila" id="tv-reu-fila"></div></section>' +
      '<aside class="tv-bloco tv-reu-lado" id="tv-reu-lado"></aside></div></div>',
    quadro: '<div class="tv-quadro-modo"><header class="tv-q-cab" id="tv-q-cab"></header><div class="tv-bloco tv-q-palco" id="tv-q-palco"></div></div>',
    site: '<div class="tv-site-modo"><header class="tv-q-cab" id="tv-site-cab"></header><div class="tv-bloco tv-site-palco" id="tv-site-palco"></div></div>'
  };

  function renderSite(e) {
    var s = e.tvSite;
    $('tv-site-cab').innerHTML = '<span class="tv-rotulo">⌂ Site</span><b>' + esc(s.url.replace(/^https?:\/\//, '')) + '</b><span class="tv-dica">pedido por ' + esc(L().nome(s.por)) + ' · controle na Estação</span>';
    if (T.comp.chaveSite !== s.url) {
      T.comp.chaveSite = s.url;
      $('tv-site-palco').innerHTML = '<iframe class="tv-iframe tv-site-iframe" sandbox="allow-scripts allow-same-origin allow-popups" src="' + esc(s.url) + '" title="Site na TV"></iframe>' +
        '<div class="tv-site-aviso">Se o site não aparecer, ele bloqueia ser mostrado dentro de outra página. No app real a TV é um Chromium e mostra qualquer site.</div>';
    }
  }

  function montarModo(modo) {
    var corpo = $('tv-corpo');
    if (corpo.dataset.modo === modo) return;
    apagarVivos(T.comp.mesa);
    apagarVivos(T.comp.quadro);
    T.comp = {};
    corpo.dataset.modo = modo;
    $('vista-tv').dataset.modo = modo;
    corpo.innerHTML = ESQUELETO[modo];
  }

  /* ---------- projeção por cima de tudo ---------- */

  function renderProjecao(e) {
    var p = e.projecao, box = $('tv-projecao'), a = p && L().arquivo(p.caminho);
    box.hidden = !a;
    if (!a) { apagarVivos(T.proj && T.proj.h); T.proj = null; box.innerHTML = ''; return; }
    var chave = a.id + '|' + p.pagina + '|' + (a.tipo === 'quadro' || a.tipo === 'mapa' ? 'vivo' : a.modificado);
    if (!T.proj || T.proj.chave !== chave) {
      apagarVivos(T.proj && T.proj.h);
      box.innerHTML = '<div class="proj-cab"><span class="tv-rotulo">Projetando</span><span class="proj-nome">' + esc(a.caminho.split('/').pop()) + '</span>' +
        '<span class="proj-por">' + (a.dono === 'equipe' ? 'pasta EQUIPE' : 'HD de ' + esc(L().nome(a.dono))) + ' · projetado por ' + esc(L().nome(p.por)) + '</span></div>' +
        '<div class="proj-palco" id="proj-palco"></div><div class="proj-rodape"><span>' + (p.paginas > 1 ? 'pág. ' + p.pagina + ' de ' + p.paginas : '') + '</span><span>controle na Estação de ' + esc(L().nome(p.por)) + '</span></div>';
      T.proj = { chave: chave, h: null };
      T.proj.h = mostrarArquivo($('proj-palco'), a, p.pagina);
    } else atualizarVivos(T.proj.h, a);
    /* rolagem controlada pela Estação de quem projetou */
    var palco = $('proj-palco');
    if (palco) {
      var alvo = palco.querySelector('.tv-iframe') ? null : palco;
      if (alvo) {
        var max = alvo.scrollHeight - alvo.clientHeight;
        if (max > 0) alvo.scrollTo({ top: Math.round((p.rolagem || 0) * max), behavior: 'smooth' });
      } else {
        var f = palco.querySelector('.tv-iframe');
        try { var d = f.contentDocument; if (d) d.documentElement.scrollTo({ top: Math.round((p.rolagem || 0) * (d.documentElement.scrollHeight - d.documentElement.clientHeight)), behavior: 'smooth' }); } catch (e) { /* iframe isolado */ }
      }
    }
  }

  /* ---------- comemoração ---------- */

  function comemorar(texto) {
    var box = $('tv-comemora');
    $('tv-comemora-texto').textContent = texto;
    box.hidden = false;
    var cv = $('tv-confete'), ctx = cv.getContext('2d'), r = box.getBoundingClientRect();
    cv.width = r.width; cv.height = r.height;
    var cores = ['#a040fd', '#29ccec', '#f2eaff', '#7fd6a6', '#ffcf5c'], pecas = [];
    if (!U.movimentoReduzido()) {
      for (var i = 0; i < 140; i++) pecas.push({ x: Math.random() * r.width, y: -Math.random() * r.height * 0.6, vy: 2 + Math.random() * 3, vx: -1 + Math.random() * 2, a: Math.random() * 6, c: cores[i % cores.length] });
    }
    var fim = Date.now() + 6500;
    (function anima() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      pecas.forEach(function (p) {
        p.y += p.vy; p.x += p.vx; p.a += 0.08;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-4, -8, 8, 16); ctx.restore();
      });
      if (Date.now() < fim) requestAnimationFrame(anima); else box.hidden = true;
    })();
  }

  /* ---------- desenho geral ---------- */

  function modoAtual(e) {
    if (e.tvModo === 'reuniao' && e.reuniao && e.reuniao.ativa) return 'reuniao';
    if (e.tvModo === 'quadro' && e.tvQuadro && L().arquivo(e.tvQuadro)) return 'quadro';
    if (e.tvModo === 'site' && e.tvSite) return 'site';
    return 'painel';
  }

  T.render = function () {
    var e = L().estado, modo = modoAtual(e);
    T.atualizado = Date.now();
    $('vista-tv').dataset.tema = e.temaTv;
    document.documentElement.dataset.tema = e.temaTv;
    $('tv-visita').hidden = !e.visita;
    renderTopo(e);
    montarModo(modo);
    if (modo === 'painel') renderPainel(e);
    else if (modo === 'reuniao') renderReuniao(e);
    else if (modo === 'site') renderSite(e);
    else renderQuadro(e);
    renderProjecao(e);
    renderEvento(false);
    tique();
  };

  function tique() {
    var agora = Date.now();
    $('tv-hora').textContent = U.hora(agora);
    $('tv-data').textContent = U.dataCurta();
    $('tv-visita-hora').textContent = U.hora(agora);
    document.querySelectorAll('#vista-tv [data-regressiva]').forEach(function (el) { el.textContent = U.regressiva(+el.getAttribute('data-regressiva')).texto; });
    document.querySelectorAll('#vista-tv [data-desde]').forEach(function (el) { el.textContent = U.relogio(agora - +el.getAttribute('data-desde')); });
    $('tv-rodape').innerHTML = '<span>protótipo com dados de exemplo · atualizado às ' + U.horaSeg(T.atualizado) + '</span><span>' +
      (L().conectado('estacao') ? 'conectada à Estação' : 'demonstração: sem Estação aberta, a própria TV simula a equipe') + '</span>';
    if (agora > T.ate && T.fila.length) proximo();
  }

  /* ---------- início ---------- */

  T.iniciar = function () {
    var raiz = $('vista-tv');
    raiz.hidden = false;
    T.mapa = new BC.Mapa($('tv-mapa'), { interativo: false, rotulos: false });
    T.mapa.atualizar(L().estado);
    T.atual = L().estado.eventos.filter(function (e) { return e.tv; })[0] || null;

    L().aoMudar(function (estado, novos) {
      novos.forEach(function (ev) {
        if (ev.tipo === 'passagem') { T.mapa.pulso(ev.de, ev.para); T.pulso = { tarefa: ev.tarefa, ate: Date.now() + 4200 }; }
        if (ev.tipo === 'comemoracao' && ev.ts > T.inicio) comemorar(ev.texto);
        if (ev.tv && ev.tipo !== 'comemoracao') enfileirar(ev);
      });
      if ($('vista-tv').hidden) return;
      T.mapa.atualizar(estado);
      T.render();
    });

    /* a TV não tem botão: é um espelho. Tela cheia com a tecla F, para quem espelha por HDMI. */
    document.addEventListener('keydown', function (ev) {
      if (raiz.hidden || ev.target.tagName === 'INPUT') return;
      if (ev.key === 'f' || ev.key === 'F') { var p = raiz.requestFullscreen ? raiz.requestFullscreen() : null; if (p && p.catch) p.catch(function () { /* recusada */ }); }
    });

    raiz.dataset.mexeu = 'sim';
    function mexeu() {
      raiz.dataset.mexeu = 'sim';
      clearTimeout(T.mexeuTimer);
      T.mexeuTimer = setTimeout(function () { raiz.dataset.mexeu = 'nao'; }, 3000);
    }
    raiz.addEventListener('mousemove', mexeu);
    mexeu();

    function acordada() {
      if (navigator.wakeLock && document.visibilityState === 'visible') navigator.wakeLock.request('screen').catch(function () { /* recusado */ });
    }
    acordada();
    document.addEventListener('visibilitychange', acordada);

    setInterval(function () { if (!$('vista-tv').hidden) { tique(); var sg = L().estado.sugestaoIdeia; if (sg && Date.now() - sg.ts > 30000 && !$('tv-sugestao').hidden) $('tv-sugestao').hidden = true; } }, 1000);
    setInterval(function () {
      T.giraI++;
      if (!$('vista-tv').hidden && $('tv-gira')) renderGira(L().estado);
    }, GIRA_MS);
    T.render();
  };

  BC.tv = T;
})(window.BC);
