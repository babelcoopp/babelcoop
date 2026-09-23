/* babel-coop — protótipo · TV 2030: a parede da sala. Só exibe; o controle vem da Estação, do iPad e do `coop tv`.
   Linguagem: docs/design/CONCEITO.md §3.5 e §4 · PLANO.md §3 "I · TV" (F2 a planta, F4 o corpo) · REGUA_ORGANISMO.md.
   Leis que este arquivo cumpre: luz só com evento real (meia-vida), nada anima sem dado, zona que gira troca só quando o dado muda,
   o chão vivo toca enquanto a sala trabalha e para quando para, o b se desenha uma vez ao ligar, nenhum som, nunca.
   Efeitos: BC.organismo quando existe (app); no protótipo puro, um efeito CSS simples no lugar (FX abaixo). */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc;
  function L() { return BC.loja; }
  function $(id) { return document.getElementById(id); }
  var MV_CURTA = 6000, MV_MEDIA = 300000, MIN = U.MIN;

  var T = {
    fila: [], atual: null, ate: 0, pulso: null, inicio: Date.now(), atualizado: Date.now(), mexeuTimer: null, comp: {}, proj: null,
    gira: { atual: null, assin: {}, pendente: null, chave: null, trocas: 0, historico: [] },
    metas: {}, campanha: { valor: null, fechou: false, raf: 0 },
    chao: { estado: 'parado', trabalhando: 0, trocas: 0, desde: 0 },
    abertura: { feita: false, tocou: false, inicio: 0, fim: 0, motivo: null },
    agentes: {}, agentesReal: {}, planta: null, corpo: null, con: null, conTipo: null, conNos: {}, conLacos: {},
    efeitos: { pulsos: 0, faiscas: 0, acesos: 0, carimbos: 0, ganhou: 0 }
  };

  /* ================================================================== FX: organismo ou CSS */
  var FX = (function () {
    var luzes = new Map(), relogio = null, vivosCss = 0;
    function org() { var o = BC.organismo; return o && o.versao && typeof o.pulso === 'function' ? o : null; }
    function reduzido() { var o = org(); return o ? o.semMovimento() : U.movimentoReduzido(); }
    function passo() {
      var t = Date.now();
      luzes.forEach(function (v, el) {
        if (!el.isConnected) { luzes.delete(el); return; }
        var l = Math.pow(2, -(t - v.t) / v.mv);
        if (reduzido()) l = l > 0.6 ? 1 : l > 0.2 ? 0.35 : 0;
        if (l < 0.02) { el.style.setProperty('--luz', '0'); luzes.delete(el); return; }
        el.style.setProperty('--luz', l.toFixed(3));
      });
      if (!luzes.size) { clearInterval(relogio); relogio = null; }
    }
    function centro(el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
    function queimar(el, classe, ms) { if (!el || !el.classList) return; el.classList.remove(classe); void el.offsetWidth; el.classList.add(classe); setTimeout(function () { el.classList.remove(classe); }, ms); }
    return {
      org: org, reduzido: reduzido,
      acender: function (el, mv) {
        if (!el) return false;
        T.efeitos.acesos++;
        var o = org(); if (o) return o.acender(el, mv);
        el.setAttribute('data-t', String(Date.now()));
        luzes.set(el, { t: Date.now(), mv: Math.max(200, mv || MV_CURTA) });
        el.style.setProperty('--luz', '1');
        if (!relogio) relogio = setInterval(passo, 250);
        return true;
      },
      /* pulso roxo → ciano de um lugar a outro; sem organismo, o destino "recebe" (anel de luz de 600 ms) */
      pulso: function (de, para, op) {
        op = op || {}; T.efeitos.pulsos++;
        var o = org(); if (o) return o.pulso(de, para, op);
        if (reduzido() || vivosCss >= 2) { if (op.aoChegar) op.aoChegar(); return Promise.resolve(); }
        vivosCss++;
        queimar(para, 'tv-recebe', 700);
        return new Promise(function (r) { setTimeout(function () { vivosCss--; if (op.aoChegar) op.aoChegar(); r(); }, 600); });
      },
      /* faíscas (≤ 24 na tela); sem organismo, um estalo de luz em CSS no mesmo ponto */
      faiscas: function (el, n, forte) {
        if (!el || !el.isConnected) return 0;
        T.efeitos.faiscas++;
        var o = org(); if (o) return o.faiscas(el, n, forte);
        if (reduzido()) return 0;
        var p = centro(el), s = document.createElement('span');
        s.className = 'tv-estalo' + (forte ? ' forte' : '');
        s.style.left = p.x + 'px'; s.style.top = p.y + 'px';
        document.body.appendChild(s);
        setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 900);
        return n;
      },
      respirar: function (el, op) { var o = org(); if (o) return o.respirar(el, op); queimar(el, 'tv-respira', 1300); return true; }
    };
  })();

  /* luz calculada pelo dado (meia-vida), para o que é redesenhado: data-t = instante do evento, data-mv = meia-vida */
  function luzDe(t, mv) { if (!t) return 0; var l = Math.pow(2, -(Date.now() - t) / mv); if (FX.reduzido()) l = l > 0.6 ? 1 : l > 0.2 ? 0.35 : 0; return l < 0.02 ? 0 : l; }
  function luzesDoDado() {
    document.querySelectorAll('#vista-tv [data-tl]').forEach(function (el) { el.style.setProperty('--luz', luzDe(+el.getAttribute('data-tl'), +el.getAttribute('data-mv') || MV_CURTA).toFixed(3)); });
  }
  function atrLuz(t, mv) { return ' data-tl="' + (t || 0) + '" data-mv="' + (mv || MV_CURTA) + '" style="--luz:' + luzDe(t, mv || MV_CURTA).toFixed(3) + '"'; }

  /* ================================================================== fila de acontecimentos (um por vez; agrupa quando chegam muitos) */

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
    } else T.atual = T.fila.shift();
    T.ate = Date.now() + (T.fila.length ? 5000 : 8000);
    renderEvento(true);
  }
  function anelPessoa(p, cls) {
    if (!p) return '';
    return '<span class="tv-p' + (cls ? ' ' + cls : '') + '" style="--cor:' + esc(p.cor) + '" title="' + esc(p.nome) + '">' + (p.foto ? '<img src="' + esc(p.foto) + '" alt="">' : esc(p.nome.slice(0, 2).toUpperCase())) + '</span>';
  }
  function renderEvento(animar) {
    var ev = T.atual, box = $('tv-evento');
    if (!ev) { box.innerHTML = ''; return; }
    var p = L().pessoa(ev.pessoaTv || ev.pessoa);
    box.innerHTML = '<span class="tv-evento-luz"' + atrLuz(ev.ts, MV_CURTA) + '></span>' + anelPessoa(p) +
      '<p' + (animar ? ' class="entra"' : '') + '>' + esc(ev.textoTv || ev.texto) + '</p>' +
      '<time class="num" data-rel="' + ev.ts + '">' + U.relativo(ev.ts) + '</time>' + (T.fila.length ? '<span class="fila num">+' + T.fila.length + ' na fila</span>' : '');
  }

  /* ================================================================== mostrar um arquivo de verdade (reunião e projeção) */

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

  /* ================================================================== topo: marca, cronômetro, relógio, luzes da sala */

  var B_SVG = '<svg class="tv-b" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 2v16M5 9c1.2-1.4 2.6-2.2 4.4-2.2 3 0 5.1 2.3 5.1 5.6S12.4 18 9.4 18C7.6 18 6.2 17.2 5 15.8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

  /* memória da sala: 25 traços verticais, um por janela de 12 s (os últimos 5 min), altura = quanto se falou */
  function tracosDaSala(s) {
    var agora = Date.now(), n = 25, jan = 12000, alt = [];
    for (var i = 0; i < n; i++) alt.push(0);
    (s.trechos || []).forEach(function (x) {
      var k = Math.floor((agora - x.ts) / jan);
      if (k >= 0 && k < n) alt[n - 1 - k] += String(x.texto || '').length;
    });
    return '<span class="tv-tracos" aria-label="memória da sala: o que se falou nos últimos 5 minutos">' + alt.map(function (c) {
      var h = c ? Math.min(8, 1 + Math.round(c / 18)) : 1;
      return '<i style="--h:' + h + '"' + (c ? ' class="on"' : '') + '></i>';
    }).join('') + '</span>';
  }

  function renderTopo(e) {
    var ct = e.cronometroTv, c = e.campanha, box = $('tv-cronometro');
    if (ct && ct.fim > Date.now()) {
      box.className = 'tv-cronometro reuniao';
      box.innerHTML = '<span class="tv-rotulo">' + esc(ct.rotulo) + '</span><span class="tv-cron-valor num" data-regressiva="' + ct.fim + '">' + U.regressiva(ct.fim).texto + '</span>';
    } else {
      box.className = 'tv-cronometro';
      box.innerHTML = '<span class="tv-rotulo">' + esc(c.nome) + ' · faltam</span><span class="tv-cron-valor num" data-regressiva="' + c.fim + '">' + U.regressiva(c.fim).texto + '</span>';
    }
    var s = e.sala, r = e.reuniao, selos = '';
    if (s.gravando) selos += '<span class="tv-selo gravando"><i class="tv-rec" aria-hidden="true"></i>gravando · desde ' + U.hora(s.desde) + '</span>';
    if (s.gravando || s.memoria) selos += tracosDaSala(s);
    else selos += '<span class="tv-selo apagado">áudio apagado</span>';
    if (r && r.ativa && e.tvModo !== 'reuniao') selos += '<span class="tv-selo reuniao">reunião aberta</span>';
    (e.controles || []).filter(function (x) { return x.estado === 'ativo'; }).slice(0, 2).forEach(function (x) {
      selos += '<span class="tv-selo controle">' + esc(L().nome(x.quem)) + ' no terminal de ' + esc(L().nome(x.dono)) + '</span>';
    });
    $('tv-selos').innerHTML = selos;
    var sg = e.sugestaoIdeia, sb = $('tv-sugestao');
    if (sb) {
      var viva = sg && Date.now() - sg.ts < 30000;
      sb.hidden = !viva;
      if (viva) sb.innerHTML = '<span class="tv-rotulo">parece que saiu uma ideia · salvar na Estação ou no celular</span><q>' + esc(sg.texto) + '</q>';
      if (viva) sb.style.setProperty('--luz', Math.max(0, 1 - (Date.now() - sg.ts) / 30000).toFixed(3));
    }
  }

  /* ================================================================== painel: a faixa */

  function renderFaixa(e) {
    var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    var abertas = e.tarefas.filter(function (t) { return t.atual < L().fluxo(t.fluxo).etapas.length; });
    var paradas = abertas.filter(function (t) { return Date.now() - t.paradaDesde > 2 * U.DIA; }).length;
    var atrasadas = abertas.filter(function (t) { return t.prazo && t.prazo < hoje.getTime(); }).length +
      e.demandas.filter(function (d) { return d.prazo && d.prazo < hoje.getTime() && d.estado !== 'concluida' && d.estado !== 'cancelada'; }).length;
    var rodando = e.demandas.filter(function (d) { return d.estado === 'andamento'; }).length;
    var livres = e.demandas.filter(function (d) { return d.estado === 'livre'; }).length;
    var atencao = atrasadas > 0, f = $('tv-faixa');
    f.className = 'tv-faixa' + (atencao ? ' atencao' : '');
    f.innerHTML = '<span class="tv-faixa-palavra">' + (atencao ? 'atenção' : 'no ritmo') + '</span>' +
      '<span class="tv-faixa-n"><b class="num">' + U.pad(e.concluidasHoje) + '</b> concluídas hoje</span>' +
      '<span class="tv-faixa-n"><b class="num">' + U.pad(rodando) + '</b> rodando</span>' +
      '<span class="tv-faixa-n"><b class="num">' + U.pad(livres) + '</b> livres para pegar</span>' +
      (paradas ? '<span class="tv-faixa-n fora"><b class="num">' + U.pad(paradas) + '</b> paradas há dias</span>' : '') +
      (atrasadas ? '<span class="tv-faixa-n fora"><b class="num">' + U.pad(atrasadas) + '</b> atrasadas</span>' : '') +
      '<span class="tv-faixa-n"><b class="num">' + U.duracao(L().trabalhoHoje()) + '</b> medidas hoje</span>';
  }

  /* ================================================================== painel: a planta da sala (gemba walk) */

  function arquivoPorNome(e, nome) { nome = String(nome || '').trim(); if (!nome) return null; return e.arquivos.filter(function (a) { return a.caminho.split('/').pop() === nome; })[0] || null; }
  function projetoDoCaminho(e, caminho) {
    return (e.projetos || []).filter(function (pj) { return pj.pasta && caminho && caminho.indexOf(pj.pasta + '/') !== -1; })[0] || null;
  }
  /* onde a pessoa está: sala (projeto) › peça, com o cronômetro da demanda que roda. Endereço do BC.endereco quando existir. */
  function posicao(e, p) {
    var r = { sala: null, peca: '', desde: 0, cron: null, t: 0 };
    try {
      var en = BC.endereco && typeof BC.endereco.de === 'function' ? BC.endereco.de(p.id) : null;
      if (en && typeof en === 'object') { r.sala = en.sala || en.projeto || null; r.peca = en.peca || en.nome || ''; r.t = en.ts || 0; }
    } catch (x) { /* endereço ainda não pronto: segue pelo que a loja sabe */ }
    var rod = L().rodando(p.id)[0];
    if (rod) { r.cron = rod; if (rod.projeto) r.sala = r.sala || rod.projeto; }
    var v = e.vendo && e.vendo[p.id];
    if (!r.peca && v && Date.now() - v.ts < 5 * MIN) { var a = L().arquivo(v.arquivo); if (a) { r.peca = a.caminho.split('/').pop(); var pj = projetoDoCaminho(e, a.caminho); if (pj) r.sala = r.sala || pj.id; r.t = v.ts; } }
    var fz = e.fazendo && e.fazendo[p.id];
    if (!r.peca && fz) {
      var nome = String(fz).replace(/^(editando|lendo|abrindo|vendo|no|na|em)\s+/i, '');
      r.peca = nome;
      var arq = arquivoPorNome(e, nome), pj2 = arq && projetoDoCaminho(e, arq.caminho);
      if (pj2) r.sala = r.sala || pj2.id;
    }
    if (!r.peca && rod) r.peca = rod.titulo;
    if (!r.sala) { var mem = (e.projetos || []).filter(function (pj) { return (pj.membros || []).indexOf(p.id) !== -1; })[0]; r.sala = mem && r.peca ? mem.id : 'geral'; }
    return r;
  }
  function presencaT(e, p) {
    if (p.status === 'online' || p.status === 'foco') return Date.now();
    var t = p.ultimaVez || 0;
    for (var i = 0; i < e.eventos.length; i++) if (e.eventos[i].pessoa === p.id) { t = Math.max(t, e.eventos[i].ts); break; }
    return t;
  }
  function ultimoEventoDe(e, id) { for (var i = 0; i < e.eventos.length; i++) if (e.eventos[i].pessoa === id && !e.eventos[i].discreto) return e.eventos[i].ts; return 0; }
  function cronTexto(ms) { var h = Math.floor(ms / U.HORA), m = Math.floor(ms % U.HORA / MIN), s = Math.floor(ms % MIN / 1000); return h ? h + ':' + U.pad(m) + ':' + U.pad(s) : U.pad(m) + ':' + U.pad(s); }

  /* as salas: do BC.endereco (o mesmo modelo da planta da Estação: projetos + atividades com gente), senão derivadas aqui */
  function salasDoEndereco(e) {
    var r = null;
    try { r = BC.endereco && typeof BC.endereco.salas === 'function' ? BC.endereco.salas() : null; } catch (x) { r = null; }
    if (!r || !Array.isArray(r.salas)) return null;
    var agora = Date.now(), fora = (r.fora || []).map(function (f) { return f.pessoa || L().pessoa(f.id); }).filter(Boolean);
    var salas = r.salas.map(function (x) {
      var gente = [];
      (x.gente || []).forEach(function (g) {
        var rot = g.end ? g.end.rotulo : '';
        if (g.tipo === 'pessoa' && g.pessoa) {
          gente.push({ p: g.pessoa, pos: { peca: rot, cron: L().rodando(g.pessoa.id)[0] || null }, tp: presencaT(e, g.pessoa), tev: ultimoEventoDe(e, g.pessoa.id) });
        } else if (g.tipo === 'agente' && g.agente && g.dono && (g.estado === 'pensando' || (g.ts && agora - g.ts < MV_MEDIA))) {
          gente.push({ agente: true, chave: g.dono.id + ':' + g.agente.id, nome: g.nome, dono: g.dono, pos: { peca: rot }, tev: g.ts || 0, estado: g.estado });
        }
      });
      return { id: x.sala.id, nome: x.sala.rotulo, tipo: x.sala.tipo, gente: gente, t: 0, carimbo: null };
    });
    return { salas: salas, fora: fora, fonte: 'endereco' };
  }
  function salasProprias(e) {
    var salas = (e.projetos || []).map(function (pj) { return { id: pj.id, nome: pj.nome, tipo: 'projeto', gente: [], t: 0, carimbo: null }; });
    salas.push({ id: 'geral', nome: 'Sala geral', tipo: 'atividade', gente: [], t: 0, carimbo: null });
    var porId = {}, fora = [];
    salas.forEach(function (s) { porId[s.id] = s; });
    e.pessoas.forEach(function (p) {
      if (p.status === 'offline') { fora.push(p); return; }
      var pos = posicao(e, p), s = porId[pos.sala] || porId.geral;
      s.gente.push({ p: p, pos: pos, tp: presencaT(e, p), tev: ultimoEventoDe(e, p.id) });
    });
    return { salas: salas, fora: fora, fonte: 'propria' };
  }
  function montarSalas(e) {
    var m = salasDoEndereco(e) || salasProprias(e), salas = m.salas;
    salas.forEach(function (s) { s.gente.forEach(function (g) { s.t = Math.max(s.t, g.tev || 0); }); });
    /* o carimbo (OK de quem pediu) mais recente de cada sala, das últimas 8 horas: vai para a sala de quem recebeu o OK (ou de quem deu) */
    e.eventos.filter(function (ev) { return ev.tipo === 'conclusao' && Date.now() - ev.ts < 8 * U.HORA; }).forEach(function (ev) {
      var s = null;
      [ev.para, ev.pessoa].forEach(function (id) { if (s || !id) return; salas.forEach(function (x) { if (!s && x.gente.some(function (g) { return g.p && g.p.id === id; })) s = x; }); });
      s = s || salas.filter(function (x) { return x.gente.length; })[0] || salas[0];
      if (!s) return;
      if (!s.carimbo || s.carimbo.ts < ev.ts) s.carimbo = ev;
      s.t = Math.max(s.t, ev.ts);
    });
    /* salas com gente (ou carimbo) primeiro; as salas de projeto vazias viram uma linha só */
    var cheias = salas.filter(function (s) { return s.gente.length || s.carimbo; }), vazias = salas.filter(function (s) { return !s.gente.length && !s.carimbo && s.tipo === 'projeto'; });
    cheias.sort(function (a, b) { return (b.tipo === 'projeto') - (a.tipo === 'projeto') || b.gente.length - a.gente.length; });
    return { salas: cheias, vazias: vazias, fora: m.fora, fonte: m.fonte };
  }

  function agenteAtivoDe(pessoaId) {
    var r = null;
    Object.keys(T.agentes).forEach(function (k) { var a = T.agentes[k]; if (a.dono === pessoaId && (a.estado === 'rodando' || a.estado === 'espera') && (!r || a.desde > r.desde)) r = a; });
    return r;
  }

  function linhaPessoa(g, s) {
    var p = g.p, pos = g.pos, ag = agenteAtivoDe(p.id);
    T.planta.pessoas[p.id] = { sala: s.id, peca: pos.peca, cron: !!pos.cron };
    var cron = pos.cron ? '<span class="tv-cron num" data-cron="' + pos.cron.id + '">' + cronTexto(L().tempo(pos.cron).trabalho) + '</span>' : '<span class="tv-cron tv-cron-nada"></span>';
    return '<li class="tv-pos st-' + esc(p.status) + '" data-pessoa="' + esc(p.id) + '" style="--cor:' + esc(p.cor) + '">' +
      '<span class="tv-pres"' + atrLuz(g.tp, MV_MEDIA) + '><b>' + esc(p.nome.slice(0, 2).toUpperCase()) + '</b></span>' +
      '<span class="tv-quem"' + atrLuz(g.tev, MV_CURTA) + '>' + esc(p.nome) + '</span>' +
      '<span class="tv-onde">' + (pos.peca ? '→ ' + esc(pos.peca) : '<em>sem endereço</em>') + '</span>' +
      (ag ? '<span class="tv-mini-ag" data-agente="' + esc(ag.chave) + '" title="' + esc(ag.nome) + '"></span>' : '') + cron + '</li>';
  }
  function linhaAgente(g) {
    if (!T.agentes[g.chave]) T.agentes[g.chave] = { chave: g.chave, id: g.chave.split(':')[1], nome: g.nome, dono: g.dono.id, estado: g.estado === 'pensando' ? 'rodando' : 'terminou', desde: g.tev, fim: g.tev };
    return '<li class="tv-pos agente" data-agente-pos="' + esc(g.chave) + '" style="--cor:' + esc(g.dono.cor) + '">' +
      '<span class="tv-mini-ag" data-agente="' + esc(g.chave) + '"></span>' +
      '<span class="tv-quem"' + atrLuz(g.tev, MV_CURTA) + '>' + esc(g.nome) + '</span>' +
      '<span class="tv-onde">' + (g.pos.peca ? '→ ' + esc(g.pos.peca) : '') + ' <em>· agente de ' + esc(g.dono.nome) + '</em></span><span class="tv-cron tv-cron-nada"></span></li>';
  }
  function renderPlanta(e) {
    var m = montarSalas(e), n = e.pessoas.filter(function (p) { return p.status !== 'offline'; }).length;
    var max = m.salas.length <= 2 ? 8 : m.salas.length <= 4 ? 4 : m.salas.length <= 6 ? 2 : 1;
    T.planta = { salas: m.salas.length, presencas: n, fonte: m.fonte, pessoas: {}, carimbos: 0 };
    $('tv-mapa-rotulo').textContent = 'MAPA DA SALA · ' + n + (n === 1 ? ' PRESENÇA' : ' PRESENÇAS');
    var h = '<div class="tv-salas">' + m.salas.map(function (s) {
      var gente = s.gente.sort(function (a, b) { return (a.agente ? 1 : 0) - (b.agente ? 1 : 0) || ((b.pos.cron ? 1 : 0) - (a.pos.cron ? 1 : 0)) || (b.tev || 0) - (a.tev || 0); });
      var linhas = gente.slice(0, max).map(function (g) { return g.agente ? linhaAgente(g) : linhaPessoa(g, s); }).join('');
      var mais = '', resto = gente.length > max ? ' · +' + (gente.length - max) : '';
      var cb = s.carimbo, carimbo = '';
      if (cb) { T.planta.carimbos++; carimbo = '<p class="tv-carimbo" data-ev="' + esc(cb.id) + '"' + atrLuz(cb.ts, MV_CURTA) + '><span class="tv-selo-ok" aria-hidden="true"></span>OK · ' + esc(L().nome(cb.pessoa)) + ' · <span class="num">' + U.hora(cb.ts) + '</span>' + (cb.para ? ' <small>→ ' + esc(L().nome(cb.para)) + '</small>' : '') + '</p>'; }
      var nPessoas = s.gente.filter(function (g) { return !g.agente; }).length;
      return '<section class="tv-sala' + (s.tipo === 'projeto' ? ' projeto' : '') + '" data-sala="' + esc(s.id) + '"' + atrLuz(s.t, MV_CURTA) + '><header><span class="tv-rotulo">' + esc(String(s.nome).toUpperCase()) + '</span><span class="tv-sala-n num">' + nPessoas + resto + '</span></header>' +
        (linhas ? '<ul>' + linhas + mais + '</ul>' : '<p class="tv-sala-vazia">ninguém aqui agora</p>') + carimbo + '</section>';
    }).join('') + '</div>';
    var rodape = [];
    if (m.vazias.length) rodape.push('<span class="tv-rotulo">salas vazias</span> ' + m.vazias.map(function (s) { return esc(s.nome); }).join(' · '));
    if (m.fora.length) rodape.push('<span class="tv-rotulo">fora da sala</span> ' + m.fora.map(function (p) { return esc(p.nome); }).join(' · '));
    if (rodape.length) h += '<p class="tv-fora">' + rodape.join(' <span class="tv-sep">|</span> ') + '</p>';
    var box = $('tv-planta');
    box.setAttribute('data-salas', String(Math.min(m.salas.length, 6)));
    box.innerHTML = h;
    pintarMinis();
  }

  /* ================================================================== painel: a constelação da sala */

  /* versão própria (protótipo sem o organismo): o mesmo desenho do BC.organismo.Constelacao */
  var NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, a, pai) { var el = document.createElementNS(NS, tag); for (var k in a) el.setAttribute(k, a[k]); if (pai) pai.appendChild(el); return el; }
  function ConstelacaoSimples(el, op) {
    op = op || {};
    this.rx = op.rx || 225; this.ry = op.ry || 105;
    var svg = svgEl('svg', { viewBox: '-300 -150 600 300', class: 'bc-constelacao', role: 'img', 'aria-label': op.rotulo || 'constelação da sala' });
    this.gRaios = svgEl('g', {}, svg); this.gLacos = svgEl('g', {}, svg); this.gNos = svgEl('g', {}, svg);
    this.centro = svgEl('g', { class: 'bc-c-centro' }, svg); this.centroCirculo = svgEl('circle', { r: 36 }, this.centro);
    svgEl('text', { y: 5 }, this.centro).textContent = op.centro || 'a sala';
    this.el = svg; this.nos = {}; this.ordem = []; this.lacos = {};
    el.appendChild(svg);
  }
  ConstelacaoSimples.prototype = {
    no: function (id, o) {
      o = o || {};
      var n = this.nos[id];
      if (!n) {
        n = { g: svgEl('g', { class: 'bc-c-no', 'data-estado': 'shell' }, this.gNos), raio: svgEl('line', { class: 'bc-c-raio' }, this.gRaios) };
        n.brilho = svgEl('circle', { class: 'brilho', r: 9 }, n.g); n.anel = svgEl('circle', { class: 'anel', r: 10 }, n.g); n.miolo = svgEl('circle', { class: 'miolo', r: 5 }, n.g); n.texto = svgEl('text', {}, n.g);
        this.nos[id] = n; this.ordem.push(id); this._dispor();
      }
      if (o.nome != null) n.texto.textContent = o.nome;
      if (o.cor) { n.cor = o.cor; n.g.style.setProperty('--bc-cor', o.cor); }
      if (o.estado) n.g.setAttribute('data-estado', o.estado);
      return n.g;
    },
    _dispor: function () {
      var eu = this, total = this.ordem.length;
      this.ordem.forEach(function (id, j) {
        var n = eu.nos[id], ang = -Math.PI / 2 + (j / total) * Math.PI * 2, x = Math.cos(ang) * eu.rx, y = Math.sin(ang) * eu.ry, d = Math.sqrt(x * x + y * y) || 1, ux = x / d, uy = y / d;
        n.x = x; n.y = y;
        n.g.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
        svgAttrs(n.raio, { x1: (ux * 38).toFixed(1), y1: (uy * 38).toFixed(1), x2: (x - ux * 11).toFixed(1), y2: (y - uy * 11).toFixed(1) });
        var esq = Math.cos(ang) < -0.2, dir = Math.cos(ang) > 0.2, vert = Math.abs(Math.cos(ang)) <= 0.2;
        svgAttrs(n.texto, { x: esq ? -15 : dir ? 15 : 0, y: vert ? (y < 0 ? -16 : 24) : 4, 'text-anchor': esq ? 'end' : dir ? 'start' : 'middle' });
      });
      Object.keys(this.lacos).forEach(function (k) { eu._laco(k); });
    },
    estado: function (id, e) { var n = this.nos[id]; if (n) n.g.setAttribute('data-estado', e); },
    acender: function (id, op) {
      op = op || {};
      var n = this.nos[id]; if (!n) return;
      FX.acender(n.g, MV_CURTA); FX.acender(n.raio, MV_CURTA); n.raio.classList.add('aceso');
      if (op.pulso !== false) pulsoSvg(this, n);
    },
    laco: function (a, b, cor) {
      var k = a + '>' + b;
      if (!cor) { if (this.lacos[k]) { this.lacos[k].remove(); delete this.lacos[k]; } return; }
      if (!this.lacos[k]) this.lacos[k] = svgEl('path', { class: 'bc-c-laco' }, this.gLacos);
      this.lacos[k].style.stroke = cor; this._laco(k); FX.acender(this.lacos[k], MV_CURTA);
    },
    _laco: function (k) {
      var ids = k.split('>'), a = this.nos[ids[0]], b = this.nos[ids[1]], p = this.lacos[k];
      if (!a || !b || !p) return;
      p.setAttribute('d', 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + 'Q' + ((a.x + b.x) / 2 * 0.55).toFixed(1) + ' ' + ((a.y + b.y) / 2 * 0.55).toFixed(1) + ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1));
    },
    remover: function (id) { var n = this.nos[id], eu = this; if (!n) return; Object.keys(this.lacos).forEach(function (k) { if (k.split('>').indexOf(id) >= 0) eu.laco(k.split('>')[0], k.split('>')[1], null); }); n.g.remove(); n.raio.remove(); delete this.nos[id]; this.ordem.splice(this.ordem.indexOf(id), 1); this._dispor(); },
    destruir: function () { if (this.el) this.el.remove(); this.el = null; }
  };
  function svgAttrs(el, a) { for (var k in a) el.setAttribute(k, a[k]); }
  /* o pulso da versão própria: um ponto que corre pelo raio, do nó ao centro (600 ms), só quando há evento */
  function pulsoSvg(con, n) {
    if (FX.reduzido() || !con.el) return;
    var c = svgEl('circle', { class: 'bc-c-pulso', r: 5, cx: n.x, cy: n.y }, con.el), t0 = performance.now();
    (function passo(t) {
      var k = Math.max(0, Math.min(1, (t - t0) / 600)), e = 1 - Math.pow(1 - k, 3);
      c.setAttribute('cx', (n.x * (1 - e)).toFixed(1)); c.setAttribute('cy', (n.y * (1 - e)).toFixed(1));
      if (k < 1 && con.el) requestAnimationFrame(passo); else { c.remove(); FX.acender(con.centro, MV_CURTA); }
    })(t0);
  }

  function estadoNoPessoa(p) {
    if (p.status === 'offline') return 'desligado';
    var ag = agenteAtivoDe(p.id);
    if (ag && ag.estado === 'espera') return 'espera';
    if (ag) return 'rodando';
    if (p.status === 'ausente') return 'pausado';
    return 'shell';
  }
  function garantirConstelacao() {
    var box = $('tv-const-svg');
    if (!box) return null;
    if (T.con && T.con.el && box.contains(T.con.el)) return T.con;
    var O = FX.org(), op = { centro: 'a sala', rotulo: 'mapa da sala: cada pessoa é um anel; o evento acende o anel e corre até o centro', rx: 190, ry: 196 };
    T.con = O && O.Constelacao ? new O.Constelacao(box, op) : new ConstelacaoSimples(box, op);
    T.conTipo = O && O.Constelacao ? 'organismo' : 'propria';
    T.con.el.setAttribute('viewBox', '-300 -250 600 500');
    T.conNos = {}; T.conLacos = {};
    return T.con;
  }
  function renderConstelacao(e) {
    var con = garantirConstelacao(); if (!con) return;
    var vistos = {};
    e.pessoas.forEach(function (p) {
      var id = 'p:' + p.id, est = estadoNoPessoa(p), chave = p.nome + '|' + p.cor + '|' + est;
      vistos[id] = true;
      if (T.conNos[id] !== chave) { con.no(id, { nome: p.nome.split(' ')[0], cor: p.cor, estado: est }); T.conNos[id] = chave; }
    });
    Object.keys(T.conNos).forEach(function (id) { if (!vistos[id]) { con.remover(id); delete T.conNos[id]; } });
    /* laços de passagem: esfriam e somem em 60 s */
    Object.keys(T.conLacos).forEach(function (k) { if (Date.now() - T.conLacos[k] > 60000) { var ab = k.split('>'); con.laco(ab[0], ab[1], null); delete T.conLacos[k]; } });
  }

  /* ================================================================== painel: o chão vivo (R4) */

  function contarTrabalho(e) {
    var n = 0;
    e.demandas.forEach(function (d) { if (d.estado === 'andamento' && d.para) { var p = L().pessoa(d.para); if (p && p.status !== 'offline') n++; } });
    Object.keys(T.agentes).forEach(function (k) { if (T.agentes[k].estado === 'rodando') n++; });
    return n;
  }
  function renderChao(e) {
    var raiz = $('vista-tv'), v = $('tv-chao'), n = contarTrabalho(e), estado = n > 0 ? 'toca' : 'parado';
    T.chao.trabalhando = n;
    if (T.chao.estado !== estado) { T.chao.estado = estado; T.chao.trocas++; T.chao.desde = Date.now(); }
    raiz.dataset.chao = estado;
    raiz.style.setProperty('--chao', Math.min(1, 0.55 + 0.1 * n).toFixed(2));
    if (!v) return;
    var deveTocar = estado === 'toca' && !FX.reduzido() && !document.hidden && modoAtual(e) === 'painel';
    if (deveTocar && v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () { /* recusado: fica o pôster */ }); }
    else if (!deveTocar && !v.paused) v.pause();
  }

  /* ================================================================== painel: o corpo do projeto (R5) e os agentes trabalhando (R3) */

  function renderCorpo(e) {
    var dados = BC.visual3d && BC.visual3d.corpoDoEstado ? BC.visual3d.corpoDoEstado() : null, box = $('tv-corpo3d');
    if (!box) return;
    if (!dados) { $('tv-corpo-legenda').textContent = 'sem Máquina publicada'; return; }
    if (!T.corpo && BC.visual3d.corpo) T.corpo = BC.visual3d.corpo(box);
    var assin = JSON.stringify(dados.pecas.map(function (p) { return [p.id, p.estado]; })) + dados.fios.length;
    if (T.corpoAssin !== assin) { T.corpoAssin = assin; if (T.corpo) T.corpo.atualizar(dados); }
    var com = dados.pecas.filter(function (p) { return p.estado === 'corpo'; }).length, trac = dados.pecas.length - com, pub = dados.publicacoes[0];
    $('tv-corpo-nome').textContent = dados.nome.toUpperCase();
    $('tv-corpo-legenda').innerHTML = '<b class="num">' + com + '</b> ' + (com === 1 ? 'peça' : 'peças') + ' com corpo' + (trac ? ' · <b class="num tracejada">' + trac + '</b> tracejada' + (trac === 1 ? '' : 's') : '') +
      (pub ? ' · <span' + atrLuz(pub.ts, MV_CURTA) + ' class="tv-pub">v' + pub.versao + ' · ' + (U.mesmoDia(pub.ts) ? '<span class="num">' + U.hora(pub.ts) + '</span>' : U.quando(pub.ts)) + ' · ' + esc(L().nome(pub.por)) + '</span>' : '');
  }

  var ESTADO_AG = { pensando: 'rodando', rodando: 'rodando', acordou: 'rodando', espera: 'espera', terminou: 'terminou', falhou: 'falhou', parado: 'shell' };
  /* junta o que a loja sabe (pessoa.agentes[].estado) e o que o app manda (agente-estado, pelo BC.real) */
  function atualizarAgentes(e) {
    var agora = Date.now(), vistos = {};
    e.pessoas.forEach(function (p) {
      (p.agentes || []).forEach(function (a) {
        var k = p.id + ':' + a.id, est = ESTADO_AG[a.estado] || 'shell', r = T.agentesReal[k];
        if (r && r.ts > agora - 10 * MIN) est = r.estado;
        vistos[k] = true;
        var x = T.agentes[k];
        if (!x) { x = T.agentes[k] = { chave: k, id: a.id, nome: a.nome, dono: p.id, estado: 'shell', desde: 0, fim: 0 }; }
        x.nome = a.nome;
        if (est === 'rodando' || est === 'espera') { if (x.estado !== est) { if (x.estado !== 'rodando' && x.estado !== 'espera') x.desde = r && r.desde || agora; x.estado = est; } }
        else if (x.estado === 'rodando' || x.estado === 'espera') { x.estado = est === 'falhou' ? 'falhou' : 'terminou'; x.fim = agora; }
      });
    });
    Object.keys(T.agentesReal).forEach(function (k) {
      if (vistos[k]) return;
      var r = T.agentesReal[k], x = T.agentes[k];
      if (!x) x = T.agentes[k] = { chave: k, id: r.id, nome: r.nome || 'agente', dono: r.dono, estado: 'shell', desde: 0, fim: 0 };
      if (r.estado === 'rodando' || r.estado === 'espera') { if (x.estado !== r.estado) { x.desde = r.desde || agora; x.estado = r.estado; } }
      else if (x.estado === 'rodando' || x.estado === 'espera') { x.estado = r.estado === 'falhou' ? 'falhou' : 'terminou'; x.fim = agora; }
    });
  }
  function fraseAgente(a) {
    if (a.estado === 'rodando') return 'pensando há <span class="num" data-ha="' + a.desde + '">' + Math.max(0, Math.round((Date.now() - a.desde) / 1000)) + ' s</span>';
    if (a.estado === 'espera') return 'espera o OK de ' + esc(L().nome(a.dono));
    if (a.estado === 'falhou') return 'falhou · <span class="num">' + U.hora(a.fim) + '</span>';
    return 'terminou · <span class="num">' + U.hora(a.fim) + '</span>';
  }
  function renderAgentes() {
    var box = $('tv-agentes'); if (!box) return;
    var agora = Date.now(), lista = Object.keys(T.agentes).map(function (k) { return T.agentes[k]; }).filter(function (a) {
      return a.estado === 'rodando' || a.estado === 'espera' || ((a.estado === 'terminou' || a.estado === 'falhou') && agora - a.fim < MV_MEDIA);
    }).sort(function (a, b) { var va = a.estado === 'rodando' || a.estado === 'espera' ? 1 : 0, vb = b.estado === 'rodando' || b.estado === 'espera' ? 1 : 0; return vb - va || Math.max(b.desde, b.fim) - Math.max(a.desde, a.fim); }).slice(0, 3);
    var ativos = lista.filter(function (a) { return a.estado === 'rodando' || a.estado === 'espera'; }).length;
    var cab = '<header class="tv-bloco-cab"><span class="tv-rotulo">AGENTES TRABALHANDO' + (ativos ? ' · ' + ativos : '') + '</span></header>';
    var h = lista.map(function (a) {
      var dono = L().pessoa(a.dono), tl = a.estado === 'rodando' || a.estado === 'espera' ? agora : a.fim;
      return '<li class="tv-ag est-' + a.estado + '" style="--cor:' + esc(dono ? dono.cor : '#2ad5e5') + '"' + atrLuz(tl, MV_MEDIA) + '><span class="tv-mini-ag grande" data-agente="' + esc(a.chave) + '"></span>' +
        '<span class="tv-ag-nome">' + esc(a.nome) + ' <small>· agente ' + (dono ? 'de ' + esc(dono.nome) : '') + '</small></span><span class="tv-ag-estado">' + fraseAgente(a) + '</span></li>';
    }).join('');
    box.innerHTML = cab + (h ? '<ul>' + h + '</ul>' : '<p class="tv-ag-vazio">nenhum agente trabalhando agora</p>');
    pintarMinis();
  }
  /* a mini presença (o anel com a coluna de luz, 14 px na Estação; aqui na escala da TV) */
  function pintarMinis() {
    var O = FX.org();
    document.querySelectorAll('#vista-tv .tv-mini-ag[data-agente]').forEach(function (el) {
      var a = T.agentes[el.getAttribute('data-agente')], est = a ? a.estado : 'shell';
      if (O && O.Presenca) {
        if (!el.firstChild) { el._pres = new O.Presenca(el, { tamanho: 'mini', estado: est }); }
        else if (el._pres && el._pres.estadoAtual() !== est) el._pres.estado(est);
      } else {
        el.setAttribute('data-estado', est);
        if (!el.firstChild) el.innerHTML = '<i class="aro"></i><i class="col"></i>';
      }
    });
  }

  /* ================================================================== painel: metas (anel que fecha) e campanha (placar que sobe contando) */

  function anelSvg(cls) { return '<svg class="tv-anel-svg ' + (cls || '') + '" viewBox="0 0 100 100" aria-hidden="true"><circle class="trilho" cx="50" cy="50" r="44" pathLength="100"/><circle class="valor" cx="50" cy="50" r="44" pathLength="100"/></svg>'; }
  function renderMetas(e) {
    var box = $('tv-metas');
    if (!box.firstChild) box.innerHTML = '<header class="tv-bloco-cab"><span class="tv-rotulo">METAS DO MÊS</span></header><div class="tv-instrumentos"></div>';
    var grade = box.querySelector('.tv-instrumentos');
    e.metas.forEach(function (m) {
      var pc = BC.pctMeta(m), el = grade.querySelector('[data-meta="' + m.id + '"]'), st = T.metas[m.id];
      if (!el) {
        el = document.createElement('div'); el.className = 'tv-inst'; el.setAttribute('data-meta', m.id);
        el.innerHTML = '<div class="tv-inst-anel">' + anelSvg() + '<b class="num"></b></div><span></span>';
        grade.appendChild(el);
      }
      var fechada = pc != null && pc >= 1;
      if (!st) st = T.metas[m.id] = { pc: pc, fechou: fechada };
      var val = el.querySelector('.valor');
      el.classList.toggle('sem-dado', pc == null);
      val.style.strokeDashoffset = pc == null ? '100' : (100 - Math.max(0, Math.min(1, pc)) * 100).toFixed(2);
      el.querySelector('b').textContent = pc == null ? 'sem dado' : Math.round(pc * 100) + '%';
      el.querySelector('span').textContent = e.areas[m.area] || m.titulo;
      if (fechada && !st.fechou) { /* meta a 100 %: o anel fecha em ouro, 800 ms, uma vez */
        st.fechou = true; el.classList.add('fecha', 'ouro');
        setTimeout(function () { FX.faiscas(el.querySelector('svg'), 12, true); FX.acender(el, MV_CURTA); }, 820);
      } else el.classList.toggle('ouro', fechada);
      st.pc = pc;
    });
  }
  function renderCampanha(e) {
    var c = e.campanha, pc = Math.min(1, c.atual / c.alvo), box = $('tv-campanha'), st = T.campanha;
    var nova = !box.firstChild;
    if (nova) box.innerHTML = '<header class="tv-bloco-cab"><span class="tv-rotulo"></span></header><div class="tv-camp"><div class="tv-camp-anel">' + anelSvg('grande') + '<div class="tv-camp-centro"><b class="num"></b><span class="num"></span></div></div><p></p></div>';
    box.querySelector('.tv-rotulo').textContent = c.nome.toUpperCase();
    box.querySelector('.valor').style.strokeDashoffset = (100 - pc * 100).toFixed(2);
    box.querySelector('.tv-camp-centro span').textContent = Math.round(pc * 100) + '%';
    box.querySelector('p').textContent = c.descricao + (c.atual < c.alvo ? ' · faltam ' + (c.alvo - c.atual) : ' · meta batida');
    var num = box.querySelector('.tv-camp-centro b');
    if (nova || st.valor == null || FX.reduzido()) { cancelAnimationFrame(st.raf); num.innerHTML = U.pad(c.atual) + '<small>/' + c.alvo + '</small>'; }
    else if (st.valor !== c.atual) { /* o placar sobe contando (700 ms), com a origem no evento da faixa de baixo */
      var de = st.valor, para = c.atual, t0 = performance.now();
      cancelAnimationFrame(st.raf);
      (function passo(t) { var k = Math.max(0, Math.min(1, (t - t0) / 700)), v = Math.round(de + (para - de) * (1 - Math.pow(1 - k, 3))); num.innerHTML = U.pad(v) + '<small>/' + c.alvo + '</small>'; if (k < 1) st.raf = requestAnimationFrame(passo); })(t0);
      FX.acender(box, MV_CURTA);
      if (para > de) FX.faiscas(box.querySelector('svg'), 6, false);
    }
    if (pc >= 1 && !st.fechou && st.valor != null) { st.fechou = true; box.classList.add('fecha', 'ouro'); }
    else box.classList.toggle('ouro', pc >= 1);
    if (pc >= 1) st.fechou = true;
    st.valor = c.atual;
  }

  /* ================================================================== painel: a zona que gira (troca só quando o dado muda) */

  function citacao(texto, quem) { return '<blockquote class="tv-fala">“' + esc(texto) + '”</blockquote><p class="tv-quem-fala">' + quem + '</p>'; }
  function cartoesGira(e) {
    var r = [], m = e.mural.filter(function (x) { return !/^(Máquina|Sistema|Oficina):/.test(x.texto || ''); }), max = function (lista, campo) { return lista.reduce(function (a, x) { return Math.max(a, x[campo] || 0); }, 0); };
    var av = e.avisos.slice(0, 2);
    r.push({ id: 'avisos', titulo: 'AVISOS E MURAL', ts: Math.max(max(av, 'ts'), m[0] ? m[0].ts : 0), assin: av.map(function (a) { return a.id; }).join(',') + '|' + (m[0] ? m[0].id : ''),
      html: '<ul class="tv-avisos">' + av.map(function (a) { return '<li>' + esc(a.texto) + '</li>'; }).join('') + '</ul>' +
        (m[0] ? citacao(m[0].texto, esc(L().nome(m[0].pessoa)) + ' · <time data-rel="' + m[0].ts + '">' + U.relativo(m[0].ts) + '</time>') : '') });
    var hoje = e.aprendizados.filter(function (a) { return U.mesmoDia(a.ts); }), ult = e.aprendizados.slice().sort(function (a, b) { return b.ts - a.ts; })[0];
    if (ult) r.push({ id: 'aprendendo', titulo: 'A BABEL ESTÁ APRENDENDO · ' + hoje.length + ' HOJE · ' + e.aprendizados.length + ' NO TOTAL', ts: ult.ts, assin: e.aprendizados.length + '|' + ult.id + '|' + ult.confirmacoes.length,
      html: citacao(ult.texto, (ult.ia ? 'IA do terminal de ' : '') + esc(L().nome(ult.pessoa)) + (ult.origem ? ' · ' + esc(ult.origem) : '') + (ult.confirmacoes.length ? ' · +' + ult.confirmacoes.length : '')) });
    var resp = e.pergunta.respostas[e.pergunta.respostas.length - 1];
    r.push({ id: 'pergunta', titulo: 'PERGUNTA DA SEMANA', ts: resp ? resp.ts : e.pergunta.desde, assin: e.pergunta.texto + '|' + e.pergunta.respostas.length,
      html: '<blockquote class="tv-fala">' + esc(e.pergunta.texto) + '</blockquote><p class="tv-quem-fala">' + (resp ? esc(L().nome(resp.pessoa)) + ' respondeu · ' + e.pergunta.respostas.length + ' respostas' : 'responda na sua Estação, em Meu dia') + '</p>' });
    var so = e.sonho, top = so ? so.top.map(function (id) { return e.prompts.filter(function (p) { return p.id === id; })[0]; }).filter(Boolean) : [];
    if (top.length) r.push({ id: 'sonho', titulo: 'O SONHO DESTA NOITE · TOP 3 PROMPTS', ts: so.ts || 0, assin: so.top.join(','),
      html: '<ol class="tv-top">' + top.map(function (p) { return '<li><span>“' + esc(p.texto) + '”</span><small>' + esc(L().nome(p.pessoa)) + ' · ' + p.estrelas.length + ' estrelas · reusado ' + p.reusos + '×</small></li>'; }).join('') + '</ol>' });
    var livres = e.demandas.filter(function (d) { return d.estado === 'livre'; });
    if (livres.length) r.push({ id: 'livres', titulo: 'TAREFAS LIVRES · PEGA QUEM PUDER', ts: max(livres, 'criada'), assin: livres.map(function (d) { return d.id; }).join(','),
      html: '<ul class="tv-livres">' + livres.slice(0, 3).map(function (d) { return '<li>' + anelPessoa(L().pessoa(d.de)) + '<span>' + esc(d.titulo) + '<small>pedida por ' + esc(L().nome(d.de)) + (d.estimativaMin ? ' · ~' + d.estimativaMin + ' min' : '') + '</small></span></li>'; }).join('') + '</ul>' });
    var ideias = e.ideias.slice().sort(function (a, b) { return b.apoios.length - a.apoios.length; });
    if (ideias.length) r.push({ id: 'ideias', titulo: 'IDEIAS DA EQUIPE', ts: max(e.ideias, 'ts'), assin: e.ideias.map(function (i) { return i.id + ':' + i.apoios.length; }).join(','),
      html: citacao(ideias[0].texto, (ideias[0].falada ? 'ideia falada · ' : '') + esc(L().nome(ideias[0].pessoa)) + ' · ' + ideias[0].apoios.length + ' apoio(s)' + (ideias.length > 1 ? ' · +' + (ideias.length - 1) + ' ideias' : '')) });
    var todas = e.tarefas.filter(function (t) { return t.atual < L().fluxo(t.fluxo).etapas.length; }).sort(function (a, b) { return b.paradaDesde - a.paradaDesde; });
    if (todas.length) r.push({ id: 'trilhas', titulo: 'TAREFAS PASSANDO DE MÃO EM MÃO', ts: max(todas, 'paradaDesde'), assin: todas.map(function (t) { return t.id + ':' + t.atual; }).join(','), html: trilhas(todas) });
    var cuid = L().cuidados().filter(function (c) { var p = L().pessoa(c.pessoa); return p && !p.naoMostrarCuidado; });
    if (cuid.length) r.push({ id: 'cuidado', titulo: 'CUIDANDO DA GENTE', ts: 0, assin: cuid.map(function (c) { return c.pessoa + ':' + c.tipo; }).join(','),
      html: '<ul class="tv-cuidados">' + cuid.slice(0, 2).map(function (c) { var p = L().pessoa(c.pessoa); return '<li>' + anelPessoa(p) + '<span><b>' + esc(p.nome) + '</b> ' + esc(c.texto) + '<small>quem pode ajudar: ' + esc(L().nome(c.ajuda)) + '</small></span></li>'; }).join('') + '</ul>' });
    return r;
  }
  function trilhas(todas) {
    var abertas = todas.slice(0, 2), maisParada = todas[todas.length - 1];
    if (maisParada && abertas.indexOf(maisParada) === -1) abertas.push(maisParada);
    var pulso = T.pulso && T.pulso.ate > Date.now() ? T.pulso : null;
    return abertas.map(function (t) {
      var dias = Math.floor((Date.now() - t.paradaDesde) / U.DIA);
      var elos = t.donos.map(function (id, i) {
        var p = L().pessoa(id), cls = i < t.atual ? 'feito' : i === t.atual ? 'atual' : '';
        var fio = i ? '<span class="tv-fio' + (i <= t.atual ? ' feito' : '') + (pulso && pulso.tarefa === t.id && i === t.atual ? ' pulso' : '') + '"></span>' : '';
        return fio + '<span class="tv-elo ' + cls + '" style="--cor:' + esc(p.cor) + '" title="' + esc(p.nome) + '">' + esc(p.nome.slice(0, 2).toUpperCase()) + '</span>';
      }).join('');
      return '<div class="tv-trilha"><div class="tv-trilha-titulo">' + esc(t.titulo) + (dias >= 2 ? '<small>parada há ' + dias + ' dias com ' + esc(L().nome(t.donos[t.atual])) + '</small>' : '') + '</div>' +
        '<div class="tv-corrente">' + elos + '</div><span class="tv-pct num">' + L().pct(t) + '%</span></div>';
    }).join('');
  }
  function renderGira(e) {
    var G = T.gira, cs = cartoesGira(e), box = $('tv-gira');
    if (!cs.length) return;
    cs.forEach(function (c) { if (G.assin[c.id] !== undefined && G.assin[c.id] !== c.assin) G.pendente = c.id; G.assin[c.id] = c.assin; });
    var alvo = null;
    if (G.pendente) alvo = cs.filter(function (c) { return c.id === G.pendente; })[0];
    if (!alvo && G.atual) alvo = cs.filter(function (c) { return c.id === G.atual; })[0];
    if (!alvo) alvo = cs.slice().sort(function (a, b) { return b.ts - a.ts; })[0];
    G.pendente = null;
    var chave = alvo.id + '|' + alvo.assin;
    if (!box.firstChild) box.innerHTML = '<header class="tv-bloco-cab"><span class="tv-rotulo"></span><span class="tv-pontos"></span></header><div class="tv-gira-palco"></div>';
    box.querySelector('.tv-pontos').innerHTML = cs.map(function (c) { return '<i' + (c.id === alvo.id ? ' class="on"' : '') + '></i>'; }).join('');
    if (G.chave === chave) return;
    var trocouCartao = G.atual !== alvo.id;
    G.chave = chave; G.atual = alvo.id;
    if (trocouCartao) { G.trocas++; G.historico.push({ id: alvo.id, ts: Date.now() }); if (G.historico.length > 20) G.historico.shift(); }
    box.querySelector('.tv-rotulo').textContent = alvo.titulo;
    box.setAttribute('data-cartao', alvo.id);
    var palco = box.querySelector('.tv-gira-palco'), velho = palco.querySelector('.tv-gira-carta.on'), novo = document.createElement('div');
    novo.className = 'tv-gira-carta'; novo.setAttribute('data-cartao', alvo.id); novo.innerHTML = alvo.html;
    palco.appendChild(novo);
    palco.querySelectorAll('.tv-gira-carta.sai').forEach(function (x) { x.remove(); });
    if (!velho || FX.reduzido()) { if (velho) velho.remove(); novo.classList.add('on'); return; }
    /* crossfade de 400 ms: o dado novo entra enquanto o antigo sai */
    velho.classList.remove('on'); velho.classList.add('sai');
    requestAnimationFrame(function () { novo.classList.add('on'); });
    setTimeout(function () { if (velho.parentNode) velho.parentNode.removeChild(velho); }, 460);
  }

  function renderPainel(e) {
    atualizarAgentes(e);
    renderFaixa(e);
    renderPlanta(e);
    renderConstelacao(e);
    renderChao(e);
    renderCorpo(e);
    renderAgentes();
    renderMetas(e);
    renderCampanha(e);
    renderGira(e);
  }

  /* ================================================================== modo reunião */

  function renderReuniao(e) {
    var r = e.reuniao, s = e.sala;
    $('tv-reu-cab').innerHTML = '<div><span class="tv-rotulo">reunião</span><h2>' + esc(r.titulo) + '</h2></div>' +
      '<div class="tv-reu-info"><span class="num tv-reu-tempo" data-desde="' + r.inicio + '">' + U.relogio(Date.now() - r.inicio) + '</span>' +
      '<span class="tv-reu-pessoas">' + r.participantes.map(function (id) { return anelPessoa(L().pessoa(id)); }).join('') + '</span></div>';
    var dest = r.destaque || '', mat = r.materiais.filter(function (m) { return m.id === dest; })[0];
    var quadroId = dest.indexOf('quadro:') === 0 ? dest.slice(7) : null, a = quadroId ? L().arquivo(quadroId) : mat ? L().arquivo(mat.caminho) : null;
    var chave = a ? a.id + '|' + (a.tipo === 'quadro' || a.tipo === 'mapa' ? 'vivo' : a.modificado) : 'vazio';
    var mesa = $('tv-reu-palco');
    if (T.comp.chaveMesa !== chave) {
      apagarVivos(T.comp.mesa);
      T.comp.chaveMesa = chave;
      T.comp.mesa = a ? mostrarArquivo(mesa, a, 1) : null;
      if (!a) mesa.innerHTML = '<div class="tv-vazio">A mesa está vazia. Na Estação, em qualquer arquivo: “Levar para a reunião”.</div>';
    } else atualizarVivos(T.comp.mesa, a);
    $('tv-reu-mesa-cab').innerHTML = a ? '<span class="tv-rotulo">na mesa</span><b>' + esc(a.caminho.split('/').pop()) + '</b><span class="tv-dica">' + (mat ? 'levado por ' + esc(L().nome(mat.por)) : 'quadro ao vivo') + '</span>' : '<span class="tv-rotulo">na mesa</span>';
    $('tv-reu-fila').innerHTML = r.materiais.map(function (m) {
      return '<span class="tv-mat' + (m.id === dest ? ' on' : '') + '">' + anelPessoa(L().pessoa(m.por)) + esc(m.caminho.split('/').pop()) + '</span>';
    }).join('');
    var falas = (s.trechos || []).slice(-2);
    $('tv-reu-lado').innerHTML =
      '<section><span class="tv-rotulo">pauta</span><ul class="tv-pauta">' + r.pauta.map(function (p) { return '<li class="' + (p.feito ? 'feito' : '') + '">' + (p.feito ? '✓ ' : '○ ') + esc(p.texto) + '</li>'; }).join('') + '</ul></section>' +
      '<section><span class="tv-rotulo">decidido</span><ul class="tv-pauta">' + (r.decisoes.map(function (d) { return '<li class="decisao">' + esc(d.texto) + '</li>'; }).join('') || '<li class="apagado">nada ainda</li>') + '</ul></section>' +
      '<section><span class="tv-rotulo">próximos passos</span><ul class="tv-pauta">' + (r.proximos.map(function (p) { return '<li><b>' + esc(L().nome(p.quem)) + '</b> · ' + esc(p.texto) + '</li>'; }).join('') || '<li class="apagado">nenhum ainda</li>') + '</ul></section>' +
      (s.gravando || s.memoria ? '<section><span class="tv-rotulo">' + (s.gravando ? 'gravando' : 'memória da sala') + '</span>' + (falas.map(function (x) { return '<blockquote class="tv-fala pequena">' + esc(x.texto) + '</blockquote><p class="tv-quem-fala">' + esc(L().nome(x.quem)) + '</p>'; }).join('') || '<p class="tv-dica">ninguém falou ainda</p>') + '</section>' : '');
  }

  /* ================================================================== modo quadro ao vivo (iPad ou Estação desenhando) e site */

  function renderQuadro(e) {
    var a = L().arquivo(e.tvQuadro);
    $('tv-q-cab').innerHTML = '<span class="tv-rotulo">quadro ao vivo</span><b>' + esc(a.caminho.split('/').pop().replace('.quadro', '')) + '</b><span class="tv-dica">desenhe no iPad ou na Estação: aparece aqui na hora</span>';
    if (T.comp.chaveQuadro !== a.id) {
      apagarVivos(T.comp.quadro);
      T.comp.chaveQuadro = a.id;
      $('tv-q-palco').innerHTML = '<div class="tv-q"></div>';
      T.comp.quadro = { quadro: new BC.Quadro($('tv-q-palco').firstChild, a.id, { tv: true }) };
    } else atualizarVivos(T.comp.quadro, a);
  }
  function renderSite(e) {
    var s = e.tvSite;
    $('tv-site-cab').innerHTML = '<span class="tv-rotulo">site</span><b>' + esc(s.url.replace(/^https?:\/\//, '')) + '</b><span class="tv-dica">pedido por ' + esc(L().nome(s.por)) + ' · controle na Estação</span>';
    if (T.comp.chaveSite !== s.url) {
      T.comp.chaveSite = s.url;
      $('tv-site-palco').innerHTML = '<iframe class="tv-iframe tv-site-iframe" sandbox="allow-scripts allow-same-origin allow-popups" src="' + esc(s.url) + '" title="Site na TV"></iframe>' +
        '<div class="tv-site-aviso">Se o site não aparecer, ele bloqueia ser mostrado dentro de outra página. No app, a TV mostra pelo navegador próprio do babel-coop.</div>';
    }
  }

  /* ================================================================== troca de modo */

  var ESQUELETO = {
    painel: '<div class="tv-painel tv-painel-2030">' +
      '<div class="tv-faixa" id="tv-faixa"></div>' +
      '<section class="tv-bloco tv-mapa-sala" id="tv-mapa-sala">' +
        '<header class="tv-bloco-cab"><span class="tv-rotulo" id="tv-mapa-rotulo">MAPA DA SALA</span><span class="tv-sinal" id="tv-sinal"></span></header>' +
        '<div class="tv-mapa-corpo"><div class="tv-planta" id="tv-planta"></div>' +
        '<div class="tv-constelacao" id="tv-constelacao"><video class="tv-chao" id="tv-chao" src="midia/chao-vivo.mp4" poster="midia/chao-vivo-poster.jpg" muted loop playsinline preload="auto" aria-hidden="true" tabindex="-1"></video><div class="tv-const-svg" id="tv-const-svg"></div></div></div>' +
      '</section>' +
      '<section class="tv-bloco tv-corpo-bloco" id="tv-corpo-bloco">' +
        '<header class="tv-bloco-cab"><span class="tv-rotulo">CORPO DO PROJETO</span><span class="tv-corpo-nome" id="tv-corpo-nome"></span></header>' +
        '<div class="tv-corpo3d" id="tv-corpo3d"></div><p class="tv-corpo-legenda" id="tv-corpo-legenda"></p>' +
        '<div class="tv-agentes" id="tv-agentes"></div>' +
      '</section>' +
      '<section class="tv-bloco tv-metas" id="tv-metas"></section>' +
      '<section class="tv-bloco tv-campanha-bloco" id="tv-campanha"></section>' +
      '<section class="tv-bloco tv-gira" id="tv-gira"></section>' +
      '</div>',
    reuniao: '<div class="tv-reu"><header class="tv-reu-cab" id="tv-reu-cab"></header><div class="tv-reu-grade"><section class="tv-bloco tv-reu-mesa">' +
      '<div class="tv-reu-mesa-cab" id="tv-reu-mesa-cab"></div><div class="tv-reu-palco" id="tv-reu-palco"></div><div class="tv-reu-fila" id="tv-reu-fila"></div></section>' +
      '<aside class="tv-bloco tv-reu-lado" id="tv-reu-lado"></aside></div></div>',
    quadro: '<div class="tv-quadro-modo"><header class="tv-q-cab" id="tv-q-cab"></header><div class="tv-bloco tv-q-palco" id="tv-q-palco"></div></div>',
    site: '<div class="tv-site-modo"><header class="tv-q-cab" id="tv-site-cab"></header><div class="tv-bloco tv-site-palco" id="tv-site-palco"></div></div>'
  };

  function montarModo(modo) {
    var corpo = $('tv-corpo');
    if (corpo.dataset.modo === modo) return;
    apagarVivos(T.comp.mesa);
    apagarVivos(T.comp.quadro);
    if (T.corpo) { T.corpo.destruir(); T.corpo = null; T.corpoAssin = null; }
    if (T.con && T.con.destruir) T.con.destruir();
    T.con = null; T.conNos = {}; T.conLacos = {};
    T.gira.chave = null;
    T.comp = {};
    corpo.dataset.modo = modo;
    $('vista-tv').dataset.modo = modo;
    corpo.innerHTML = ESQUELETO[modo];
  }

  /* ================================================================== projeção por cima de tudo (hairline --t0 nas quatro bordas, estática) */

  function renderProjecao(e) {
    var p = e.projecao, box = $('tv-projecao'), a = p && L().arquivo(p.caminho);
    box.hidden = !a;
    if (!a) { apagarVivos(T.proj && T.proj.h); T.proj = null; box.innerHTML = ''; return; }
    var chave = a.id + '|' + p.pagina + '|' + (a.tipo === 'quadro' || a.tipo === 'mapa' ? 'vivo' : a.modificado);
    if (!T.proj || T.proj.chave !== chave) {
      apagarVivos(T.proj && T.proj.h);
      box.innerHTML = '<span class="proj-marca">projeção · ' + esc(L().nome(p.por)) + '</span><div class="proj-cab"><span class="proj-nome">' + esc(a.caminho.split('/').pop()) + '</span>' +
        '<span class="proj-por">' + (a.dono === 'equipe' ? 'pasta EQUIPE' : 'HD de ' + esc(L().nome(a.dono))) + '</span></div>' +
        '<div class="proj-palco" id="proj-palco"></div><div class="proj-rodape"><span class="num">' + (p.paginas > 1 ? 'pág. ' + p.pagina + ' de ' + p.paginas : '') + '</span><span>controle na Estação de ' + esc(L().nome(p.por)) + '</span></div>';
      T.proj = { chave: chave, h: null };
      T.proj.h = mostrarArquivo($('proj-palco'), a, p.pagina);
    } else atualizarVivos(T.proj.h, a);
    var palco = $('proj-palco');
    if (palco) {
      var alvo = palco.querySelector('.tv-iframe') ? null : palco;
      if (alvo) {
        var max = alvo.scrollHeight - alvo.clientHeight;
        if (max > 0) alvo.scrollTo({ top: Math.round((p.rolagem || 0) * max), behavior: FX.reduzido() ? 'auto' : 'smooth' });
      } else {
        var f = palco.querySelector('.tv-iframe');
        try { var d = f.contentDocument; if (d) d.documentElement.scrollTo({ top: Math.round((p.rolagem || 0) * (d.documentElement.scrollHeight - d.documentElement.clientHeight)), behavior: 'smooth' }); } catch (x) { /* iframe isolado */ }
      }
    }
  }

  /* ================================================================== comemoração: o anel fecha (sem confete) */

  function comemorar(texto) {
    var box = $('tv-comemora');
    if (!box.querySelector('.tv-com-anel')) box.insertAdjacentHTML('afterbegin', '<div class="tv-com-anel">' + anelSvg('grande') + '</div>');
    $('tv-comemora-texto').textContent = texto;
    box.classList.remove('fecha');
    box.hidden = false;
    void box.offsetWidth;
    box.classList.add('fecha');
    setTimeout(function () { FX.faiscas(box.querySelector('.tv-com-anel'), 16, true); }, 820);
    clearTimeout(T.comemoraTimer);
    T.comemoraTimer = setTimeout(function () { box.hidden = true; box.classList.remove('fecha'); }, 6500);
  }

  /* ================================================================== abertura: o b que se desenha (R1), uma vez ao ligar */

  function abertura() {
    var raiz = $('vista-tv'), A = T.abertura;
    A.inicio = Date.now();
    if (FX.reduzido()) { A.feita = true; A.fim = Date.now(); A.motivo = 'sem-movimento'; return; }
    var box = document.createElement('div');
    box.className = 'tv-abertura'; box.id = 'tv-abertura'; box.setAttribute('aria-hidden', 'true');
    box.innerHTML = '<video src="midia/b-entrada.mp4" poster="midia/b-entrada-poster.jpg" muted playsinline preload="auto" tabindex="-1"></video>';
    raiz.appendChild(box);
    var v = box.firstChild;
    function fim(motivo) {
      if (A.feita) return;
      A.feita = true; A.fim = Date.now(); A.motivo = motivo;
      box.classList.add('sai');
      setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 460);
    }
    v.addEventListener('playing', function () { A.tocou = true; });
    v.addEventListener('ended', function () { fim('terminou'); });
    v.addEventListener('error', function () { fim('sem-video'); });
    var p = v.play(); if (p && p.catch) p.catch(function () { fim('recusado'); });
    setTimeout(function () { fim('tempo'); }, 6500);
  }

  /* ================================================================== desenho geral */

  function modoAtual(e) {
    if (e.tvModo === 'reuniao' && e.reuniao && e.reuniao.ativa) return 'reuniao';
    if (e.tvModo === 'quadro' && e.tvQuadro && L().arquivo(e.tvQuadro)) return 'quadro';
    if (e.tvModo === 'site' && e.tvSite) return 'site';
    return 'painel';
  }

  T.render = function () {
    var e = L().estado, modo = modoAtual(e), raiz = $('vista-tv'), ametista = e.temaTv === 'ametista';
    T.atualizado = Date.now();
    raiz.dataset.tema = e.temaTv;
    raiz.dataset.tema2030 = ametista ? 'ametista' : 'noite';
    document.documentElement.dataset.tema = e.temaTv;
    document.documentElement.classList.toggle('tema-ametista', ametista);
    $('tv-visita').hidden = !e.visita;
    renderTopo(e);
    montarModo(modo);
    if (modo === 'painel') renderPainel(e);
    else { renderChaoParado(); if (modo === 'reuniao') renderReuniao(e); else if (modo === 'site') renderSite(e); else renderQuadro(e); }
    renderProjecao(e);
    renderEvento(false);
    tique();
  };
  function renderChaoParado() { var raiz = $('vista-tv'); raiz.dataset.chao = 'parado'; T.chao.estado = 'parado'; }

  function tique() {
    var agora = Date.now(), e = L().estado;
    $('tv-hora').textContent = U.hora(agora);
    $('tv-data').textContent = U.dataCurta();
    $('tv-visita-hora').textContent = U.hora(agora);
    document.querySelectorAll('#vista-tv [data-regressiva]').forEach(function (el) { el.textContent = U.regressiva(+el.getAttribute('data-regressiva')).texto; });
    document.querySelectorAll('#vista-tv [data-desde]').forEach(function (el) { el.textContent = U.relogio(agora - +el.getAttribute('data-desde')); });
    document.querySelectorAll('#vista-tv [data-cron]').forEach(function (el) { var d = L().demanda(el.getAttribute('data-cron')); if (d) el.textContent = cronTexto(L().tempo(d).trabalho); });
    document.querySelectorAll('#vista-tv [data-rel]').forEach(function (el) { el.textContent = U.relativo(+el.getAttribute('data-rel')); });
    document.querySelectorAll('#vista-tv [data-ha]').forEach(function (el) { el.textContent = Math.max(0, Math.round((agora - +el.getAttribute('data-ha')) / 1000)) + ' s'; });
    luzesDoDado();
    var sinal = $('tv-sinal');
    if (sinal) sinal.textContent = T.chao.trabalhando ? 'SINAL · ' + T.chao.trabalhando + (T.chao.trabalhando === 1 ? ' CRONÔMETRO RODANDO' : ' CRONÔMETROS RODANDO') : 'SINAL · EM REPOUSO';
    $('tv-rodape').innerHTML = '<span>protótipo com dados de exemplo · atualizado às <span class="num">' + U.horaSeg(T.atualizado) + '</span></span><span>' +
      (L().conectado('estacao') ? 'conectada à Estação' : 'demonstração: sem Estação aberta, a própria TV simula a equipe') + '</span>';
    var sg = e.sugestaoIdeia, sb = $('tv-sugestao');
    if (sb && !sb.hidden) { if (!sg || agora - sg.ts > 30000) sb.hidden = true; else sb.style.setProperty('--luz', Math.max(0, 1 - (agora - sg.ts) / 30000).toFixed(3)); }
    if (agora > T.ate && T.fila.length) proximo();
  }

  /* ================================================================== eventos reais → luzes (sem som, nunca) */

  function reagir(ev) {
    var e = L().estado;
    if (ev.tipo === 'passagem') {
      T.pulso = { tarefa: ev.tarefa, ate: Date.now() + 4200 };
      if (T.con && T.conNos['p:' + ev.de] && T.conNos['p:' + ev.para]) { var p = L().pessoa(ev.de); T.con.laco('p:' + ev.de, 'p:' + ev.para, p ? p.cor : '#2ad5e5'); T.conLacos['p:' + ev.de + '>p:' + ev.para] = Date.now(); T.con.acender('p:' + ev.para, { pulso: false }); }
    }
    if (ev.tipo === 'comemoracao' && ev.ts > T.inicio) comemorar(ev.texto);
    if (ev.tv && ev.tipo !== 'comemoracao') enfileirar(ev);
    if (modoAtual(e) !== 'painel') return;
    if (ev.pessoa && T.con && T.conNos['p:' + ev.pessoa] && !ev.discreto && ev.tipo !== 'passagem') T.con.acender('p:' + ev.pessoa, { pulso: true });
    if (ev.tipo === 'conclusao') {
      /* o carimbo aparece na sala certa; faíscas no carimbo, o anel da pessoa acende */
      T.efeitos.carimbos++;
      setTimeout(function () {
        var cb = document.querySelector('#tv-planta .tv-carimbo[data-ev="' + ev.id + '"]'), sala = cb ? cb.closest('.tv-sala') : null, linha = document.querySelector('#tv-planta [data-pessoa="' + (ev.para || ev.pessoa) + '"]');
        var no = T.con && T.con.nos && T.con.nos['p:' + ev.pessoa];
        /* o pulso roxo → ciano sai do anel de quem deu o OK e corre até o carimbo; ao chegar, faíscas e a sala respira */
        if (cb && no) FX.pulso(no.miolo || no.g, cb, { cor: 'marca', aoChegar: function () { FX.faiscas(cb, 8, true); FX.respirar(sala, { duracao: 1200 }); } });
        else if (cb) { FX.faiscas(cb, 8, true); FX.respirar(sala, { duracao: 1200 }); }
        else if (linha) FX.faiscas(linha, 6, false);
      }, 30);
    }
    if (ev.tipo === 'corpo') {
      T.efeitos.ganhou++;
      setTimeout(function () { var b = $('tv-corpo3d'); if (b) { FX.faiscas(b, 10, true); FX.respirar($('tv-corpo-bloco'), { duracao: 1200 }); } }, 900);
    }
    if (ev.tipo === 'inicio' || ev.tipo === 'pegou' || ev.tipo === 'retomada') {
      setTimeout(function () { var linha = document.querySelector('#tv-planta [data-pessoa="' + ev.pessoa + '"] .tv-cron'); if (linha) FX.acender(linha, MV_CURTA); }, 30);
    }
  }

  /* o app manda o estado dos agentes (ganchos do Claude) e dos terminais: a TV ouve, sem responder */
  function ouvirApp() {
    if (!BC.real || typeof BC.real.ouvir !== 'function') return;
    BC.real.ouvir(function (m) {
      if (!m || !m.tipo) return;
      if (m.tipo === 'agente-estado' && m.dono && m.id) {
        var est = ESTADO_AG[m.estado] || 'shell', p = L().pessoa(m.dono), ag = p && (p.agentes || []).filter(function (a) { return a.id === m.id; })[0];
        T.agentesReal[m.dono + ':' + m.id] = { id: m.id, dono: m.dono, nome: ag ? ag.nome : m.id, estado: est, desde: +m.desde || Date.now(), ts: Date.now() };
        if (!$('vista-tv').hidden) T.render();
      }
    });
  }

  /* ================================================================== medidas (para os testes e para quem quiser saber o que a TV está mostrando) */

  T.medidas = function () {
    var v = $('tv-chao'), raiz = $('vista-tv'), e = L().estado;
    return {
      modo: modoAtual(e), tema: raiz.dataset.tema2030,
      chao: { estado: raiz.dataset.chao || 'parado', trabalhando: T.chao.trabalhando, tocando: !!(v && !v.paused), tempo: v ? +v.currentTime.toFixed(2) : 0, trocas: T.chao.trocas },
      abertura: { feita: T.abertura.feita, tocou: T.abertura.tocou, motivo: T.abertura.motivo, ms: T.abertura.fim ? T.abertura.fim - T.abertura.inicio : null, naTela: !!$('tv-abertura') },
      planta: T.planta, gira: { atual: T.gira.atual, trocas: T.gira.trocas, historico: T.gira.historico.slice() },
      constelacao: { tipo: T.conTipo, nos: Object.keys(T.conNos).length, lacos: Object.keys(T.conLacos).length },
      corpo: T.corpo ? T.corpo.medidas() : null,
      agentes: Object.keys(T.agentes).map(function (k) { var a = T.agentes[k]; return { chave: k, nome: a.nome, estado: a.estado }; }).filter(function (a) { return a.estado !== 'shell'; }),
      metas: Object.keys(T.metas).map(function (k) { return { id: k, pc: T.metas[k].pc, fechou: T.metas[k].fechou }; }),
      efeitos: JSON.parse(JSON.stringify(T.efeitos)), organismo: !!FX.org(), som: 'nunca'
    };
  };

  /* ================================================================== início */

  T.iniciar = function () {
    var raiz = $('vista-tv');
    raiz.hidden = false;
    /* o b estático no topo (SVG, cor do texto) e na Visita; a imagem antiga sai */
    var marca = raiz.querySelector('.tv-marca');
    if (marca && !marca.querySelector('.tv-b')) marca.insertAdjacentHTML('afterbegin', B_SVG);
    var vis = $('tv-visita');
    if (vis && !vis.querySelector('.tv-b')) vis.insertAdjacentHTML('afterbegin', B_SVG);
    T.atual = L().estado.eventos.filter(function (e) { return e.tv; })[0] || null;

    L().aoMudar(function (estado, novos) {
      if ($('vista-tv').hidden) { novos.forEach(function (ev) { if (ev.tv && ev.tipo !== 'comemoracao') enfileirar(ev); }); return; }
      T.render();
      novos.forEach(reagir);
    });
    ouvirApp();

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
      if (!raiz.hidden && modoAtual(L().estado) === 'painel') renderChao(L().estado); /* aba escondida: o chão para; voltou: volta a tocar se a sala trabalha */
    }
    acordada();
    document.addEventListener('visibilitychange', acordada);

    setInterval(function () { if (!$('vista-tv').hidden) tique(); }, 1000);
    T.render();
    abertura();
  };

  BC.tv = T;
})(window.BC);
