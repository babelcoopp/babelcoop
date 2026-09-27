/* Babel Coop — protótipo · a placa-mãe do Meu dia (26/09/2026, pedido do Dominic)
   O que ficava no rodapé da Estação vira peça de placa-mãe fixa no Meu dia. Cada informação é a peça que uma placa de
   verdade usa para aquilo:
     presença → chave de liga (SW1) · caixa → visor de depuração de dois dígitos (DS1, o "Q-Code") ·
     relógio da demanda → cristal de quartzo (Y1) · memória da sala → pente de memória (RAM1) ·
     pontos de hoje → bateria CR2032 com o anel da meta da semana (BT1) · TV → porta HDMI (J1) ·
     terminal ao vivo → o processador (U1) · acervo → SSD M.2 · salvo na equipe → conector de rede com LEDs (J2) ·
     tarefas livres → barra de pinos (J3) · reunião, controle do terminal, atualização e "mostrar terminal" →
     pegadas vazias (DNP) que ganham a peça soldada quando aparecem.
   A trilha principal é uma pista fechada, anti-horária como Interlagos, com o "S do Senna" logo depois da largada.
   Duas luzes (azul e roxa da Babel) correm nela: freiam nas curvas, aceleram nas retas e se ultrapassam. Quando uma
   informação muda de verdade, sai uma faísca do processador pela trilha até a peça.
   Os dados vêm do próprio rodapé (#e-status), que continua sendo desenhado pela Estação e pelas peças do app real
   (placar, selos de controle): a placa espelha o rodapé e os cliques usam as mesmas ações (data-acao). No Meu dia o
   rodapé some da tela (placa-mae.css); nas outras abas ele continua lá. Visual em placa-mae.css; fontes em
   docs/placa-mae.md. */
(function () {
  'use strict';
  var BC = window.BC;
  if (!BC) return;
  var NS = 'http://www.w3.org/2000/svg';
  var html = document.documentElement;
  var mmReduz = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function svgEl(nome, attrs, pai) {
    var el = document.createElementNS(NS, nome);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    if (pai) pai.appendChild(el);
    return el;
  }

  /* ======================= as peças ======================= */

  /* o visor de sete segmentos (caixa de entrada) */
  var SEG = {
    a: '2.4,1.6 3.4,0.6 8.6,0.6 9.6,1.6 8.6,2.6 3.4,2.6', g: '2.4,10 3.4,9 8.6,9 9.6,10 8.6,11 3.4,11',
    d: '2.4,18.4 3.4,17.4 8.6,17.4 9.6,18.4 8.6,19.4 3.4,19.4', f: '1.6,2.4 2.6,3.4 2.6,8.6 1.6,9.6 0.6,8.6 0.6,3.4',
    b: '10.4,2.4 11.4,3.4 11.4,8.6 10.4,9.6 9.4,8.6 9.4,3.4', e: '1.6,10.4 2.6,11.4 2.6,16.6 1.6,17.6 0.6,16.6 0.6,11.4',
    c: '10.4,10.4 11.4,11.4 11.4,16.6 10.4,17.6 9.4,16.6 9.4,11.4'
  };
  var DIGITOS = ['abcdef', 'bc', 'abged', 'abgcd', 'fgbc', 'afgcd', 'afgedc', 'abc', 'abcdefg', 'abcdfg'];
  function digito(x) {
    return '<g transform="translate(' + x + ' 0) skewX(-7)">' + Object.keys(SEG).map(function (k) {
      return '<polygon class="pm-seg" data-s="' + k + '" points="' + SEG[k] + '"/>';
    }).join('') + '</g>';
  }
  function repetir(n, s) { var r = ''; for (var i = 0; i < n; i++) r += s; return r; }

  var PECAS = {
    tv:        { ref: 'J1', nome: 'TV', corpo: '<span class="pm-hdmi"><span class="pm-hdmi-cabo"></span><span class="pm-hdmi-casco"></span><span class="pm-hdmi-boca"></span><i class="pm-led"></i></span>' },
    rede:      { ref: 'J2', nome: 'Rede', corpo: '<span class="pm-rj45"><i class="pm-led pm-link"></i><i class="pm-led pm-act"></i><span class="pm-rj45-boca"></span></span>' },
    memoria:   { ref: 'RAM1', nome: 'Memória da sala', coluna: true, dnp: [172, 26],
                 corpo: '<span class="pm-dimm"><span class="pm-dimm-trava"></span><span class="pm-dimm-modulo">' + repetir(8, '<i></i>') + '</span><span class="pm-dimm-trava"></span><i class="pm-led"></i></span>' },
    atualizar: { ref: 'U7', nome: 'Atualização', dnp: [30, 20], corpo: '<span class="pm-ci pm-soic"><em>BIOS</em><i class="pm-led"></i></span>' },
    presenca:  { ref: 'SW1', nome: 'Presença', corpo: '<span class="pm-sw"><span class="pm-sw-tampa"></span></span>' },
    caixa:     { ref: 'DS1', nome: 'Caixa', corpo: '<span class="pm-qcode"><svg viewBox="-1 -1.5 28 23" aria-hidden="true">' + digito(1) + digito(14) + '</svg></span>' },
    terminal:  { ref: 'U1', nome: 'Terminal', corpo: '<span class="pm-cpu"><span class="pm-cpu-ihs"><span class="pm-cpu-logo"></span><b>BABEL</b><em>COOP · MB-01</em></span><i class="pm-led"></i></span>' },
    relogio:   { ref: 'Y1', nome: 'Relógio', corpo: '<span class="pm-cristal"><em>32.768K</em></span><span class="pm-cristal-pes"></span>' },
    pontos:    { ref: 'BT1', nome: 'Pontos', dnp: [44, 44],
                 corpo: '<span class="pm-bateria"><svg class="pm-anel" viewBox="0 0 58 58" aria-hidden="true"><circle class="fundo" cx="29" cy="29" r="27"/><circle class="val" cx="29" cy="29" r="27" pathLength="100"/></svg><span class="pm-moeda"><b>0</b><em>CR2032</em></span></span>' },
    acervo:    { ref: 'M2', nome: 'Acervo', coluna: true,
                 corpo: '<span class="pm-m2"><span class="pm-m2-dedos"></span><span class="pm-m2-ci"></span><span class="pm-m2-etiqueta"><b>0</b> docs</span><span class="pm-m2-ci nand"></span><span class="pm-m2-parafuso"></span></span>' },
    livres:    { ref: 'J3', nome: 'Livres', corpo: '<span class="pm-pinos">' + repetir(10, '<i></i>') + '</span>' },
    reuniao:   { ref: 'U5', nome: 'Reunião', dnp: [26, 26], corpo: '<span class="pm-ci pm-qfn"><em>AUD</em><i class="pm-led"></i></span>' },
    controle:  { ref: 'U6', nome: 'Controle', dnp: [30, 20], corpo: '<span class="pm-ci pm-soic"><em>INT</em><i class="pm-led"></i></span>' },
    mostrar:   { ref: 'SW2', nome: 'Painel', dnp: [30, 30], corpo: '<span class="pm-sw"><span class="pm-sw-tampa"></span></span>' }
  };
  var LARGA = { cima: ['tv', 'rede', 'memoria', 'atualizar'], esq: ['presenca', 'caixa', 'controle'], meio: ['terminal'], dir: ['relogio', 'pontos', 'mostrar'], baixo: ['acervo', 'livres', 'reuniao'] };
  var COMPACTA = ['terminal', 'presenca', 'relogio', 'caixa', 'pontos', 'tv', 'rede', 'memoria', 'acervo', 'livres', 'reuniao', 'controle', 'atualizar', 'mostrar'];

  var secao, placa, pecasEl, cimaEl, centroEl, colEsq, colDir, baixoEl, trilhoCima, trilhoBaixo, desenho, voltasEl;
  var G = {}; /* grupos do SVG */
  var pecas = {};
  var compacta = false, emCima = null;

  function montar() {
    secao = document.createElement('section');
    secao.className = 'secao pm-secao';
    secao.id = 'sec-placa';
    secao.setAttribute('aria-label', 'Placa-mãe: o estado da sua Estação');
    secao.innerHTML =
      '<div class="secao-cab"><span class="rotulo">Placa-mãe</span><span class="pm-rev">MB-01 · REV A</span></div>' +
      '<div class="pm-placa">' +
        '<svg class="pm-desenho" aria-hidden="true" focusable="false"></svg>' +
        '<div class="pm-pecas">' +
          '<div class="pm-cima"></div><div class="pm-trilho-cima"></div>' +
          '<div class="pm-centro"><div class="pm-col pm-col-esq"></div><div class="pm-col pm-col-dir"></div></div>' +
          '<div class="pm-trilho-baixo"></div><div class="pm-baixo"></div>' +
        '</div>' +
        '<div class="pm-seda-linha"><span>Babel-Coop · MB-01 · rev A · 2026</span><span>Pista anti-horária, como Interlagos · S do Senna depois da largada</span>' +
          '<span class="pm-voltas">Voltas · <span class="az">azul <b>0</b></span> · <span class="rx">roxo <b>0</b></span></span></div>' +
      '</div>';
    placa = secao.querySelector('.pm-placa');
    desenho = secao.querySelector('.pm-desenho');
    pecasEl = secao.querySelector('.pm-pecas');
    cimaEl = secao.querySelector('.pm-cima');
    centroEl = secao.querySelector('.pm-centro');
    colEsq = secao.querySelector('.pm-col-esq');
    colDir = secao.querySelector('.pm-col-dir');
    baixoEl = secao.querySelector('.pm-baixo');
    trilhoCima = secao.querySelector('.pm-trilho-cima');
    trilhoBaixo = secao.querySelector('.pm-trilho-baixo');
    voltasEl = secao.querySelector('.pm-voltas');

    Object.keys(PECAS).forEach(function (id) {
      var d = PECAS[id], el = document.createElement('div');
      el.className = 'pm-peca' + (d.coluna ? ' pm-coluna' : '');
      el.setAttribute('data-peca', id);
      el.innerHTML = '<button type="button" class="pm-toque" disabled>' +
        '<span class="pm-corpo">' + d.corpo + (d.dnp ? '<span class="pm-pegada" style="--pg-l:' + d.dnp[0] + 'px;--pg-a:' + d.dnp[1] + 'px">DNP</span>' : '') + '</span>' +
        '<span class="pm-leg"><span class="pm-ref">' + d.ref + '</span><b class="pm-nome">' + esc(d.nome) + '</b><span class="pm-val"></span></span>' +
        '</button><div class="pm-extra" hidden></div>';
      pecas[id] = { id: id, el: el, toque: el.querySelector('.pm-toque'), corpo: el.querySelector('.pm-corpo'), val: el.querySelector('.pm-val'), extra: el.querySelector('.pm-extra') };
      el.addEventListener('pointerenter', function () { emCima = id; acenderToco(id, true); });
      el.addEventListener('pointerleave', function () { if (emCima === id) emCima = null; acenderToco(id, false); });
    });
    arrumar(false);
    desenharDefs();

    /* a bateria abre a lista de pontos do placar (a casa dele continua no rodapé, escondida no Meu dia) */
    var popAberto = false;
    window.addEventListener('pointerdown', function (ev) {
      if (pecas.pontos && pecas.pontos.toque.contains(ev.target)) popAberto = !!document.querySelector('body > .pl-pop');
    }, true);
    pecas.caixa.toque.addEventListener('click', function () {
      var alvo = document.getElementById('sec-caixa');
      if (alvo) alvo.scrollIntoView({ block: 'start' });
    });
    pecas.pontos.toque.addEventListener('click', function () {
      var casa = document.querySelector('#e-status .st-placar');
      if (!casa || popAberto) { popAberto = false; return; }
      casa.click();
      ancorarPop(pecas.pontos.toque);
    });
  }

  /* larga: faixa de cima, miolo (duas colunas e o processador) e faixa de baixo · compacta: tudo no miolo, duas colunas */
  function arrumar(paraCompacta) {
    compacta = paraCompacta;
    placa.classList.toggle('pm-compacta', compacta);
    if (compacta) {
      if (colEsq.parentNode) centroEl.removeChild(colEsq);
      if (colDir.parentNode) centroEl.removeChild(colDir);
      COMPACTA.forEach(function (id) { centroEl.appendChild(pecas[id].el); });
    } else {
      LARGA.cima.forEach(function (id) { cimaEl.appendChild(pecas[id].el); });
      LARGA.baixo.forEach(function (id) { baixoEl.appendChild(pecas[id].el); });
      LARGA.esq.forEach(function (id) { colEsq.appendChild(pecas[id].el); });
      LARGA.dir.forEach(function (id) { colDir.appendChild(pecas[id].el); });
      centroEl.appendChild(colEsq);
      centroEl.appendChild(pecas.terminal.el);
      centroEl.appendChild(colDir);
      Object.keys(pecas).forEach(function (id) { pecas[id].el.classList.remove('pm-lado-dir'); });
    }
  }

  /* ======================= ler o rodapé ======================= */

  function ler() {
    var st = document.getElementById('e-status');
    if (!st) return null;
    function q(sel) { return st.querySelector(sel); }
    function porTexto(re) { var r = null; st.querySelectorAll('.st-item').forEach(function (el) { if (!r && re.test(txt(el))) r = el; }); return r; }
    var m = {};

    var pres = q('[data-acao="presenca"]');
    if (pres) { var pt = pres.querySelector('.ponto'); m.presenca = { status: pt ? pt.className.replace(/\bponto\b/, '').trim() : '', texto: txt(pres) }; }

    var cx = q('[data-acao="atividade"][data-id="dia"]');
    m.caixa = cx ? (parseInt(txt(cx), 10) || 0) : null;

    var rod = q('[data-acao="abrir-demanda"]');
    if (rod) {
      var rel = rod.querySelector('[data-relogio]');
      var tt = txt(rod).replace(/^◷\s*/, '');
      if (rel) tt = tt.replace(txt(rel), '').trim();
      m.relogio = { id: rod.getAttribute('data-id'), titulo: tt, rodando: rod.classList.contains('st-rodando'), tempo: txt(rel) };
    } else m.relogio = null;

    var liv = q('[data-filtro="livres"]');
    m.livres = liv ? (parseInt(txt(liv).replace(/\D+/g, ''), 10) || 0) : 0;

    var reu = q('.st-reuniao');
    var desde = reu && reu.querySelector('[data-desde]');
    m.reuniao = reu ? { desde: desde ? desde.getAttribute('data-desde') : '', tempo: txt(desde) } : null;

    m.sala = q('.st-gravando') ? 'gravando' : (porTexto(/memória da sala/i) ? 'memoria' : '');

    var proj = q('.st-proj');
    if (proj) {
      var nome = '', pag = '';
      proj.childNodes.forEach(function (n) { if (n.nodeType === 3) { var t = n.textContent.trim(); if (/na TV:/.test(t)) nome = t.replace(/^▣\s*na TV:\s*/, ''); else if (/^\d+\/\d+$/.test(t)) pag = t; } });
      var pr = BC.loja && BC.loja.estado && BC.loja.estado.projecao;
      if (pr && pr.caminho) nome = pr.caminho.split('/').pop(); /* o rodapé corta o nome em 22 letras */
      m.proj = { nome: nome, pag: pag, botoes: [].map.call(proj.querySelectorAll('button[data-acao]'), copiarBotao) };
    } else m.proj = null;

    m.controles = [].map.call(st.querySelectorAll('.st-controle, .st-pedido'), function (el) {
      var botoes = [].map.call(el.querySelectorAll('button[data-acao]'), copiarBotao);
      var t = el.cloneNode(true);
      t.querySelectorAll('button').forEach(function (b) { b.remove(); });
      return { pedido: el.classList.contains('st-pedido'), texto: txt(t).replace(/^●\s*/, ''), acao: el.matches('[data-acao]') ? copiarBotao(el) : null, botoes: botoes };
    });

    var atu = q('.st-atualizar');
    m.atualizar = atu ? { texto: txt(atu).replace(/^⬆\s*/, ''), rodando: atu.classList.contains('rodando'), acao: atu.matches('[data-acao]') ? copiarBotao(atu) : null, dica: atu.getAttribute('title') || '' } : null;

    var casa = q('.st-placar');
    if (casa) {
      var val = casa.querySelector('.pl-val'), anel = casa.querySelector('.pl-anel');
      var off = val ? parseFloat(val.style.strokeDashoffset) : NaN;
      m.pontos = { n: txt(casa.querySelector('.pl-n')), rotulo: txt(casa.querySelector('.pl-rot')), pct: isNaN(off) ? 0 : Math.max(0, Math.min(1, (100 - off) / 100)),
        ouro: !!(anel && anel.classList.contains('ouro')), semMeta: !!(anel && anel.classList.contains('sem-meta')), oculto: casa.classList.contains('oculto'), aria: casa.getAttribute('aria-label') || '' };
    } else m.pontos = null;

    var tv = q('[data-acao="coluna"]');
    m.tv = tv ? { conectada: /conectada/i.test(txt(tv)), texto: txt(tv) } : null;
    var term = q('[data-acao="term-transmissao"]');
    m.terminal = term ? { vivo: /ao vivo/i.test(txt(term)), texto: txt(term).replace(/^[●○]\s*/, '') } : null;
    var ac = porTexto(/^acervo:/i);
    m.acervo = ac ? (parseInt(txt(ac).replace(/\D+/g, ''), 10) || 0) : null;
    var grav = q('#st-gravado');
    m.rede = grav ? { salvando: /salvando/i.test(txt(grav)), texto: txt(grav) } : null;
    m.mostrar = !!q('[data-acao="terminal-alternar"]');
    return m;
  }
  function copiarBotao(b) {
    var d = {}; [].forEach.call(b.attributes, function (a) { if (a.name.indexOf('data-') === 0) d[a.name] = a.value; });
    return { dados: d, rotulo: txt(b), titulo: b.getAttribute('title') || b.getAttribute('aria-label') || '', classe: b.className };
  }

  /* ======================= pôr os valores nas peças ======================= */

  var antes = null, ultimaFaisca = {}, ganho = { base: null, t: 0 };

  function acao(p, dados, rotulo, propria) {
    var t = p.toque;
    [].slice.call(t.attributes).forEach(function (a) { if (a.name.indexOf('data-') === 0) t.removeAttribute(a.name); });
    if (dados) { Object.keys(dados).forEach(function (k) { t.setAttribute(k, dados[k]); }); t.disabled = false; }
    else t.disabled = !propria;
    t.setAttribute('aria-label', rotulo);
    t.title = rotulo;
  }
  function valor(p, html) { if (p.val.innerHTML !== html) p.val.innerHTML = html; }
  function led(el, cor, modo) {
    if (!el) return;
    el.style.setProperty('--led', cor || '#2a2d31');
    el.classList.toggle('acesa', !!cor && modo !== 'apagada');
    el.classList.toggle('pisca', modo === 'pisca');
    el.classList.toggle('pisca-rapido', modo === 'rapido');
  }
  function dnp(p, vazio) {
    var era = p.el.classList.contains('pm-dnp');
    p.el.classList.toggle('pm-dnp', vazio);
    if (era && !vazio && antes) { p.el.classList.remove('pm-soldou'); void p.el.offsetWidth; p.el.classList.add('pm-soldou'); setTimeout(function () { p.el.classList.remove('pm-soldou'); }, 700); }
  }
  function botoesExtra(p, lista) {
    var h = (lista || []).map(function (b) {
      var attrs = Object.keys(b.dados).map(function (k) { return k + '="' + esc(b.dados[k]) + '"'; }).join(' ');
      var cls = /\bok\b/.test(b.classe) ? ' ok' : (/encerrar|recusar/.test(b.dados['data-acao'] || '') ? ' perigo' : '');
      return '<button type="button" class="pm-mini' + cls + '" ' + attrs + (b.titulo ? ' title="' + esc(b.titulo) + '" aria-label="' + esc(b.titulo) + '"' : '') + '>' + esc(b.rotulo) + '</button>';
    }).join('');
    return h;
  }
  function extra(p, h) { if (p.extra.innerHTML !== h) p.extra.innerHTML = h; p.extra.hidden = !h; }

  var COR_PRESENCA = { online: '#34d399', foco: '#22d3ee', ausente: '#fbbf24', offline: '#4b5563' };

  function aplicar(m) {
    if (!m) return;
    var p;

    /* SW1 · presença */
    p = pecas.presenca;
    if (m.presenca) {
      var cor = COR_PRESENCA[m.presenca.status] || '#4b5563';
      p.el.querySelector('.pm-sw-tampa').style.setProperty('--led', cor);
      p.el.querySelector('.pm-sw-tampa').style.setProperty('--led-luz', m.presenca.status === 'offline' ? 'transparent' : cor);
      valor(p, esc(m.presenca.texto || m.presenca.status));
      acao(p, { 'data-acao': 'presenca' }, 'Presença: ' + (m.presenca.texto || m.presenca.status) + '. Trocar presença');
    }

    /* DS1 · caixa de entrada no visor de dois dígitos */
    p = pecas.caixa;
    var n = m.caixa == null ? 0 : Math.min(99, m.caixa), dz = Math.floor(n / 10), un = n % 10;
    var grupos = p.el.querySelectorAll('.pm-qcode g');
    [dz, un].forEach(function (d, i) {
      var acesos = DIGITOS[d];
      grupos[i].querySelectorAll('.pm-seg').forEach(function (s) { s.classList.toggle('on', acesos.indexOf(s.getAttribute('data-s')) !== -1); });
    });
    p.el.querySelector('.pm-qcode').classList.toggle('calmo', n === 0);
    valor(p, n === 0 ? 'nada novo' : '<b>' + n + '</b> na caixa');
    acao(p, null, (n === 0 ? 'Caixa de entrada vazia' : n + ' na caixa de entrada') + '. Ir para a caixa', true);

    /* Y1 · o relógio da demanda */
    p = pecas.relogio;
    p.el.classList.toggle('pm-rodando', !!(m.relogio && m.relogio.rodando));
    if (m.relogio) {
      var dem = BC.loja && BC.loja.demanda ? BC.loja.demanda(m.relogio.id) : null;
      if (dem && dem.titulo) m.relogio.titulo = dem.titulo;
      valor(p, '<span data-relogio="' + esc(m.relogio.id) + '">' + esc(m.relogio.tempo) + '</span> · ' + esc(m.relogio.titulo));
      acao(p, { 'data-acao': 'abrir-demanda', 'data-id': m.relogio.id }, 'Cronômetro ' + (m.relogio.rodando ? 'rodando' : 'parado') + ': ' + m.relogio.titulo + ', ' + m.relogio.tempo + '. Abrir a demanda');
    } else {
      valor(p, 'parado');
      acao(p, null, 'Cronômetro parado: nenhuma demanda rodando');
    }

    /* RAM1 · memória da sala */
    p = pecas.memoria;
    dnp(p, !m.sala);
    p.el.classList.toggle('pm-gravando', m.sala === 'gravando');
    led(p.el.querySelector('.pm-dimm .pm-led'), m.sala === 'gravando' ? '#fb7185' : (m.sala ? '#22d3ee' : ''), m.sala === 'gravando' ? 'pisca' : '');
    valor(p, m.sala === 'gravando' ? '<b>REC</b> gravando a sala' : (m.sala ? 'escuta os últimos 5 min' : 'desligada'));
    acao(p, m.sala === 'gravando' ? { 'data-acao': 'atividade', 'data-id': 'reuniao' } : null,
      m.sala === 'gravando' ? 'Gravando a sala. Abrir a reunião' : (m.sala ? 'Memória da sala: escuta os últimos 5 minutos e só guarda quando alguém aperta' : 'Memória da sala desligada'));

    /* U7 · atualização do app (Oficina) */
    p = pecas.atualizar;
    dnp(p, !m.atualizar);
    led(p.el.querySelector('.pm-led'), m.atualizar ? '#a855f7' : '', m.atualizar && m.atualizar.rodando ? 'rapido' : (m.atualizar ? 'pisca' : ''));
    valor(p, m.atualizar ? esc(m.atualizar.texto) : 'em dia');
    acao(p, m.atualizar && m.atualizar.acao ? m.atualizar.acao.dados : null, m.atualizar ? m.atualizar.texto + (m.atualizar.dica ? ': ' + m.atualizar.dica : '') : 'App em dia');

    /* BT1 · pontos de hoje (placar do app real) */
    p = pecas.pontos;
    dnp(p, !m.pontos);
    if (m.pontos) {
      var moeda = p.el.querySelector('.pm-moeda b');
      var mostrado = m.pontos.oculto ? '··' : m.pontos.n;
      if (moeda.textContent !== mostrado) moeda.textContent = mostrado;
      var anelEl = p.el.querySelector('.pm-anel');
      anelEl.querySelector('.val').style.strokeDashoffset = String(100 - m.pontos.pct * 100);
      anelEl.classList.toggle('ouro', m.pontos.ouro);
      valor(p, m.pontos.oculto ? 'escondidos' : esc(m.pontos.rotulo || 'pontos · hoje'));
      acao(p, null, (m.pontos.aria || 'Pontos de hoje') + '. Ver de onde veio cada ponto', true);
    } else {
      valor(p, 'sem placar');
      acao(p, null, 'Placar desligado nesta Estação');
    }

    /* J1 · TV (e a projeção) */
    p = pecas.tv;
    p.el.classList.toggle('pm-projetando', !!m.proj);
    if (m.tv) {
      led(p.el.querySelector('.pm-hdmi .pm-led'), m.proj ? '#22d3ee' : (m.tv.conectada ? '#34d399' : ''), m.proj ? 'pisca' : '');
      valor(p, m.proj ? '▣ ' + esc(m.proj.nome) + (m.proj.pag ? ' · ' + esc(m.proj.pag) : '') : (m.tv.conectada ? 'conectada' : 'não aberta'));
      acao(p, { 'data-acao': 'coluna' }, (m.proj ? 'Projetando na TV: ' + m.proj.nome : m.tv.texto) + '. Abrir a coluna da TV');
    }
    extra(p, m.proj ? botoesExtra(p, m.proj.botoes) : '');

    /* U1 · o processador: terminal ao vivo */
    p = pecas.terminal;
    if (m.terminal) {
      p.el.classList.toggle('pm-vivo', m.terminal.vivo);
      led(p.el.querySelector('.pm-cpu > .pm-led'), m.terminal.vivo ? '#22d3ee' : '#fbbf24', m.terminal.vivo ? '' : 'pisca');
      valor(p, m.terminal.vivo ? '<b>ao vivo</b>' : 'pausado');
      acao(p, { 'data-acao': 'term-transmissao' }, 'Terminal ' + m.terminal.texto + '. ' + (m.terminal.vivo ? 'Pausar a transmissão' : 'Voltar a transmitir'));
    }

    /* M.2 · acervo */
    p = pecas.acervo;
    var docs = m.acervo == null ? 0 : m.acervo;
    var etq = p.el.querySelector('.pm-m2-etiqueta b');
    if (etq.textContent !== String(docs)) etq.textContent = String(docs);
    valor(p, docs === 1 ? '1 documento' : docs + ' documentos');
    acao(p, { 'data-acao': 'atividade', 'data-id': 'acervo' }, 'Acervo com ' + docs + (docs === 1 ? ' documento' : ' documentos') + '. Abrir o acervo');

    /* J2 · rede: salvo na equipe */
    p = pecas.rede;
    if (m.rede) {
      led(p.el.querySelector('.pm-link'), '#34d399');
      led(p.el.querySelector('.pm-act'), m.rede.salvando ? '#fbbf24' : '', m.rede.salvando ? 'rapido' : '');
      valor(p, m.rede.salvando ? 'salvando…' : 'salvo na equipe');
      acao(p, null, m.rede.texto);
    }

    /* J3 · livres */
    p = pecas.livres;
    p.el.querySelectorAll('.pm-pinos i').forEach(function (pino, i) { pino.classList.toggle('on', i < m.livres); });
    valor(p, m.livres ? '<b>' + m.livres + '</b> ' + (m.livres > 1 ? 'livres' : 'livre') : 'nenhuma');
    acao(p, m.livres ? { 'data-acao': 'dem-filtro', 'data-filtro': 'livres' } : null, m.livres ? m.livres + (m.livres > 1 ? ' tarefas livres' : ' tarefa livre') + '. Ver as livres' : 'Nenhuma tarefa livre');

    /* U5 · reunião */
    p = pecas.reuniao;
    dnp(p, !m.reuniao);
    led(p.el.querySelector('.pm-led'), m.reuniao ? '#34d399' : '', m.reuniao ? 'pisca' : '');
    valor(p, m.reuniao ? 'ao vivo · <span data-desde="' + esc(m.reuniao.desde) + '">' + esc(m.reuniao.tempo) + '</span>' : 'nenhuma');
    acao(p, m.reuniao ? { 'data-acao': 'atividade', 'data-id': 'reuniao' } : null, m.reuniao ? 'Reunião acontecendo. Abrir' : 'Nenhuma reunião agora');

    /* U6 · controle do terminal (alguém no seu terminal, pedido para entrar, você no terminal de alguém) */
    p = pecas.controle;
    var cs = m.controles;
    dnp(p, !cs.length);
    led(p.el.querySelector('.pm-led'), cs.length ? (cs.some(function (c) { return c.pedido; }) ? '#fbbf24' : '#fb7185') : '', cs.length ? 'pisca' : '');
    valor(p, cs.length ? esc(cs[0].texto) + (cs.length > 1 ? ' <b>+' + (cs.length - 1) + '</b>' : '') : 'ninguém');
    acao(p, cs.length === 1 && cs[0].acao ? cs[0].acao.dados : null, cs.length ? cs.map(function (c) { return c.texto; }).join('; ') : 'Ninguém no seu terminal');
    extra(p, cs.length ? cs.map(function (c) { return botoesExtra(p, c.botoes); }).join('') : '');

    /* SW2 · mostrar o painel do terminal */
    p = pecas.mostrar;
    dnp(p, !m.mostrar);
    p.el.querySelector('.pm-sw-tampa').style.setProperty('--led', m.mostrar ? '#3b82f6' : '#2a2d31');
    p.el.querySelector('.pm-sw-tampa').style.setProperty('--led-luz', m.mostrar ? '#3b82f6' : 'transparent');
    valor(p, m.mostrar ? 'mostrar terminal' : 'aberto');
    acao(p, m.mostrar ? { 'data-acao': 'terminal-alternar' } : null, m.mostrar ? 'Mostrar o terminal' : 'O painel do terminal está aberto');

    /* o que mudou de verdade manda uma faísca do processador até a peça */
    if (antes) mudancas(antes, m);
    antes = m;
    conferirDesenho();
  }

  /* o rodapé muda a cada segundo (os relógios): só redesenha as trilhas se alguma peça mudou de tamanho ou de lugar */
  var assinatura = '', conferirPedido = 0, nTracados = 0;
  function assinar() {
    if (!placa || !placa.isConnected) return '';
    return Object.keys(pecas).map(function (id) {
      var r = naPlaca(pecas[id].corpo);
      return Math.round(r.l) + ',' + Math.round(r.t) + ',' + Math.round(r.w) + ',' + Math.round(r.h);
    }).join(';') + '|' + placa.offsetWidth + 'x' + placa.offsetHeight;
  }
  /* posição de layout dentro da placa, sem as transformações (a peça sobe 2 px no hover e não pode arrastar as trilhas) */
  function naPlaca(el) {
    var x = 0, y = 0, n = el;
    while (n && n !== placa) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    var w = el.offsetWidth, h = el.offsetHeight;
    return { l: x, t: y, r: x + w, b: y + h, w: w, h: h, cx: x + w / 2, cy: y + h / 2 };
  }
  function conferirDesenho() {
    if (conferirPedido) return;
    conferirPedido = requestAnimationFrame(function () { conferirPedido = 0; if (assinar() !== assinatura) tracar(); });
  }

  function mudancas(a, b) {
    function sobe(x, y) { return x != null && y != null && +y > +x; }
    if (a.presenca && b.presenca && a.presenca.status !== b.presenca.status) faisca('presenca');
    if (sobe(a.caixa, b.caixa)) faisca('caixa');
    if (b.relogio && (!a.relogio || a.relogio.id !== b.relogio.id || a.relogio.rodando !== b.relogio.rodando)) faisca('relogio');
    if (a.sala !== b.sala && b.sala) faisca('memoria', b.sala === 'gravando');
    if (b.atualizar && !a.atualizar) faisca('atualizar');
    if (b.pontos && a.pontos && sobe(a.pontos.n, b.pontos.n)) { faisca('pontos'); ganhou(+a.pontos.n, +b.pontos.n); }
    if ((b.tv && a.tv && a.tv.conectada !== b.tv.conectada) || (!!a.proj !== !!b.proj)) faisca('tv');
    if (a.terminal && b.terminal && a.terminal.vivo !== b.terminal.vivo) chegar('terminal');
    if (sobe(a.acervo, b.acervo)) faisca('acervo');
    if (b.rede && b.rede.salvando && !(a.rede && a.rede.salvando)) faisca('rede');
    if (a.livres !== b.livres) faisca('livres');
    if (b.reuniao && !a.reuniao) faisca('reuniao');
    if (b.controles.length > a.controles.length) faisca('controle', true);
    if (b.mostrar && !a.mostrar) faisca('mostrar');
  }

  /* +N sobe da bateria (o placar conta de 1 em 1: junta a rajada e mostra o total) */
  function ganhou(de, para) {
    if (ganho.base == null) ganho.base = de;
    clearTimeout(ganho.t);
    ganho.t = setTimeout(function () {
      var d = para - ganho.base; ganho.base = null;
      if (!(d > 0) || mmReduz.matches) return;
      var el = document.createElement('span');
      el.className = 'pm-ganho'; el.textContent = '+' + d;
      pecas.pontos.corpo.appendChild(el);
      setTimeout(function () { el.remove(); }, 1500);
    }, 750);
  }

  /* a lista de pontos do placar nasce presa à casa do rodapé; no Meu dia ela abre embaixo da bateria */
  function ancorarPop(botao) {
    var pop = document.querySelector('body > .pl-pop');
    if (!pop) return;
    function por() {
      if (!pop.isConnected) { mo.disconnect(); return; }
      if (html.getAttribute('data-placa') !== 'dia') return;
      var r = botao.getBoundingClientRect(), w = pop.offsetWidth || 380;
      var topo = Math.round(Math.min(r.bottom + 8, window.innerHeight - Math.min(pop.offsetHeight, window.innerHeight - 16) - 8)) + 'px';
      var esq = Math.round(Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2))) + 'px';
      if (pop.style.top !== topo || pop.style.bottom !== 'auto' || pop.style.left !== esq) { pop.style.top = topo; pop.style.bottom = 'auto'; pop.style.left = esq; }
    }
    var mo = new MutationObserver(por);
    mo.observe(pop, { attributes: true, attributeFilter: ['style'] });
    por();
  }

  /* ======================= o desenho: pista, tocos, vias, furos, carros ======================= */

  var geo = null; /* { pts, cum, L, cantos, d, tocos, largadaX } */

  function desenharDefs() {
    desenho.innerHTML =
      '<defs>' +
        '<linearGradient id="pm-grad-babel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#3b82f6"/><stop offset="1" stop-color="#a855f7"/></linearGradient>' +
        '<linearGradient id="pm-grad-placa" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="800" y2="300"><stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#3b82f6"/><stop offset="1" stop-color="#a855f7"/></linearGradient>' +
        '<pattern id="pm-hach" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" class="pm-hachura"/></pattern>' +
        '<pattern id="pm-xadrez" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="1.5" height="1.5" fill="#ebe7de"/><rect x="1.5" y="1.5" width="1.5" height="1.5" fill="#ebe7de"/><rect x="1.5" width="1.5" height="1.5" fill="#0a0b0c"/><rect y="1.5" width="1.5" height="1.5" fill="#0a0b0c"/></pattern>' +
        '<radialGradient id="pm-halo-az"><stop offset="0" stop-color="#a5f3fc" stop-opacity=".95"/><stop offset=".35" stop-color="#22d3ee" stop-opacity=".55"/><stop offset="1" stop-color="#3b82f6" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="pm-halo-rx"><stop offset="0" stop-color="#f3e8ff" stop-opacity=".95"/><stop offset=".35" stop-color="#c084fc" stop-opacity=".55"/><stop offset="1" stop-color="#7c3aed" stop-opacity="0"/></radialGradient>' +
      '</defs>';
    ['fundo', 'trilhas', 'marcas', 'carros', 'faiscas'].forEach(function (k) { G[k] = svgEl('g', { class: 'pm-g-' + k }, desenho); });
  }

  var tracarPedido = 0;
  function agendarTracar() {
    if (tracarPedido || !placa || !placa.isConnected) return;
    tracarPedido = requestAnimationFrame(function () { tracarPedido = 0; tracar(); });
  }

  function tracar() {
    var P = placa.getBoundingClientRect();
    if (!P.width || !P.height) return;
    assinatura = assinar();
    /* estreita demais para as faixas: tudo dentro da pista (histerese para não ficar trocando) */
    var querCompacta = compacta ? P.width < 640 : P.width < 600;
    if (querCompacta !== compacta) { arrumar(querCompacta); P = placa.getBoundingClientRect(); }

    var rel = naPlaca;
    nTracados++;
    var W = P.width, H = P.height;
    var grade = rel(pecasEl), tc = rel(trilhoCima), tb = rel(trilhoBaixo), ce = rel(centroEl);
    var calha = parseFloat(getComputedStyle(secao).getPropertyValue('--pm-calha')) || 30;
    var x0 = grade.l + calha / 2, x1 = grade.r - calha / 2, y0 = tc.cy, y1 = tb.cy, ch = 12;

    /* compacta: quem está na coluna da direita vira a serigrafia para o lado da pista */
    if (compacta) {
      COMPACTA.forEach(function (id) {
        if (id === 'terminal') return;
        if (pecas[id].el.classList.contains('pm-coluna')) { pecas[id].el.classList.remove('pm-lado-dir'); return; }
        var r = rel(pecas[id].el);
        pecas[id].el.classList.toggle('pm-lado-dir', r.cx > ce.cx);
      });
    }

    /* os tocos: da peça até a reta da pista mais perto dela */
    var tocos = [];
    Object.keys(pecas).forEach(function (id) {
      var p = pecas[id];
      if (!p.el.isConnected) return;
      var fisico = p.corpo.firstElementChild, vazia = p.el.classList.contains('pm-dnp');
      var c = rel(!vazia && fisico && !fisico.classList.contains('pm-pegada') ? fisico : p.corpo);
      var reta, a, b;
      if (id === 'terminal' || c.b <= y0 + 2) { reta = 'topo'; }
      else if (c.t >= y1 - 2) reta = 'base';
      else reta = compacta && p.el.classList.contains('pm-coluna') ? 'esq' : (c.cx < ce.cx ? 'esq' : 'dir');
      if (id === 'terminal') { a = { x: c.cx, y: c.t }; b = { x: c.cx, y: y0 }; }
      else if (reta === 'topo') { a = { x: c.cx, y: c.b }; b = { x: c.cx, y: y0 }; }
      else if (reta === 'base') { a = { x: c.cx, y: c.t }; b = { x: c.cx, y: y1 }; }
      else if (reta === 'esq') { a = { x: c.l, y: c.cy }; b = { x: x0, y: c.cy }; }
      else { a = { x: c.r, y: c.cy }; b = { x: x1, y: c.cy }; }
      if (reta === 'topo' || reta === 'base') b.x = Math.max(x0 + ch + 6, Math.min(x1 - ch - 6, b.x));
      else b.y = Math.max(y0 + ch + 6, Math.min(y1 - ch - 6, b.y));
      tocos.push({ id: id, reta: reta, a: a, b: b });
    });

    /* o S do Senna: no maior vão da reta de cima, com a largada logo antes (a pista corre para a esquerda em cima) */
    var xsTopo = tocos.filter(function (t) { return t.reta === 'topo'; }).map(function (t) { return t.b.x; }).sort(function (m, n) { return m - n; });
    var ini = x0 + ch + 14, fim = x1 - ch - 14, marcos = [ini].concat(xsTopo.map(function (x) { return x; })).concat([fim]);
    var vao = { a: ini, b: fim, w: 0 };
    for (var i = 0; i < marcos.length - 1; i++) {
      var a0 = i === 0 ? marcos[i] : marcos[i] + 10, b0 = i === marcos.length - 2 ? marcos[i + 1] : marcos[i + 1] - 10;
      if (b0 - a0 > vao.w) vao = { a: a0, b: b0, w: b0 - a0 };
    }
    var chicane = null, largadaX;
    if (vao.w >= 90) {
      var largura = Math.min(58, vao.w - 34);
      var cl = vao.a + (vao.w - largura - 22) / 2, cr = cl + largura;
      chicane = { l: cl, r: cr, h: 7 };
      largadaX = cr + 14;
    } else largadaX = vao.a + vao.w / 2;

    /* a pista, anti-horária: sai da largada para a esquerda pela reta de cima */
    var pts = [{ x: largadaX, y: y0 }];
    if (chicane) pts.push({ x: chicane.r, y: y0 }, { x: chicane.r - chicane.h, y: y0 + chicane.h }, { x: chicane.l + chicane.h, y: y0 + chicane.h }, { x: chicane.l, y: y0 });
    pts.push({ x: x0 + ch, y: y0 }, { x: x0, y: y0 + ch }, { x: x0, y: y1 - ch }, { x: x0 + ch, y: y1 }, { x: x1 - ch, y: y1 }, { x: x1, y: y1 - ch }, { x: x1, y: y0 + ch }, { x: x1 - ch, y: y0 });
    var cum = [0], L = 0;
    for (i = 0; i < pts.length; i++) {
      var p1 = pts[i], p2 = pts[(i + 1) % pts.length];
      L += Math.hypot(p2.x - p1.x, p2.y - p1.y);
      cum.push(L);
    }
    var d = 'M' + pts.map(function (p) { return p.x.toFixed(1) + ' ' + p.y.toFixed(1); }).join(' L') + ' Z';
    var cantos = cum.slice(1, pts.length); /* todos os vértices menos a largada, que fica numa reta */

    /* onde cada toco encosta na pista (distância ao longo da pista) */
    tocos.forEach(function (t) { t.s = sNaPista(pts, cum, t.b); });

    geo = { pts: pts, cum: cum, L: L, cantos: cantos, d: d, tocos: tocos, largadaX: largadaX, y0: y0, W: W, H: H };

    /* ---- desenhar ---- */
    desenho.setAttribute('viewBox', '0 0 ' + W.toFixed(1) + ' ' + H.toFixed(1));
    var gp = desenho.querySelector('#pm-grad-placa');
    gp.setAttribute('x2', W.toFixed(0)); gp.setAttribute('y2', H.toFixed(0));
    G.fundo.textContent = ''; G.trilhas.textContent = ''; G.marcas.textContent = '';

    /* o plano de terra dentro da pista (hachura bem fraca), furos de fixação e fiduciais */
    svgEl('path', { d: d, fill: 'url(#pm-hach)' }, G.fundo);
    [[14, 14], [W - 14, 14], [14, H - 14], [W - 14, H - 14]].forEach(function (f) {
      svgEl('circle', { cx: f[0], cy: f[1], r: 9, class: 'pm-furo-seda' }, G.fundo);
      svgEl('circle', { cx: f[0], cy: f[1], r: 5.2, class: 'pm-furo-anel' }, G.fundo);
      svgEl('circle', { cx: f[0], cy: f[1], r: 3.4, class: 'pm-furo' }, G.fundo);
      for (var k = 0; k < 8; k++) {
        var ang = k * Math.PI / 4;
        svgEl('circle', { cx: (f[0] + Math.cos(ang) * 7.2).toFixed(1), cy: (f[1] + Math.sin(ang) * 7.2).toFixed(1), r: 0.9, class: 'pm-via-tampada' }, G.fundo);
      }
    });
    [[W - 36, 10], [36, H - 10], [W / 2, 8]].forEach(function (f) {
      svgEl('circle', { cx: f[0], cy: f[1], r: 4.2, class: 'pm-fiducial-limpa' }, G.fundo);
      svgEl('circle', { cx: f[0], cy: f[1], r: 1.8, class: 'pm-fiducial' }, G.fundo);
    });

    /* abertura em leque: as pistinhas que saem do processador e do pente de memória e mergulham em vias */
    leque(rel(pecas.terminal.corpo.firstElementChild), 'cima', 5, 7);
    if (!pecas.memoria.el.classList.contains('pm-dnp') && !compacta) leque(rel(pecas.memoria.corpo.firstElementChild), 'baixo', 6, 12);

    /* os tocos (com sombra da máscara), a pista (cobre sob a máscara + a luz da borda) */
    tocos.forEach(function (t) {
      var dd = caminhoToco(t);
      svgEl('path', { d: dd, class: 'pm-toco-sombra' }, G.trilhas);
      t.el = svgEl('path', { d: dd, class: 'pm-toco' + (t.id === emCima ? ' aceso' : ''), 'data-toco': t.id, style: t.id === 'terminal' ? 'stroke-width:3' : '' }, G.trilhas);
    });
    svgEl('path', { d: d, class: 'pm-pista-cobre' }, G.trilhas);
    svgEl('path', { d: d, class: 'pm-pista' }, G.trilhas);
    svgEl('path', { d: d, class: 'pm-pista-luz' }, G.trilhas);

    /* costura de vias por fora da pista, longe dos tocos e do S */
    var cx0 = (x0 + x1) / 2, cy0 = (y0 + y1) / 2;
    for (var s = 16; s < L - 8; s += 26) {
      var q = pontoEm(s), dir = direcaoEm(s);
      var nx = dir.y, ny = -dir.x;
      if (((q.x + nx) - cx0) * (q.x - cx0) + ((q.y + ny) - cy0) * (q.y - cy0) < ((q.x - cx0) * (q.x - cx0) + (q.y - cy0) * (q.y - cy0))) { nx = -nx; ny = -ny; }
      var vx = q.x + nx * 7, vy = q.y + ny * 7;
      var perto = tocos.some(function (t) { return Math.hypot(t.b.x - q.x, t.b.y - q.y) < 11; }) || (chicane && q.y <= y0 + 1 && q.x > chicane.l - 8 && q.x < chicane.r + 22);
      if (!perto && vx > 6 && vy > 6 && vx < W - 6 && vy < H - 6) svgEl('circle', { cx: vx.toFixed(1), cy: vy.toFixed(1), r: 1.5, class: 'pm-via-tampada' }, G.trilhas);
    }

    /* pads nas peças e vias douradas onde o toco encosta na pista */
    tocos.forEach(function (t) {
      var vert = t.reta === 'topo' || t.reta === 'base';
      t.pad = svgEl('rect', { x: (t.a.x - (vert ? 3 : 2)).toFixed(1), y: (t.a.y - (vert ? 2 : 3)).toFixed(1), width: vert ? 6 : 4, height: vert ? 4 : 6, rx: 0.8, class: 'pm-pad' }, G.trilhas);
      svgEl('circle', { cx: t.b.x.toFixed(1), cy: t.b.y.toFixed(1), r: 2.6, class: 'pm-via-ouro' }, G.trilhas);
    });

    /* a largada (xadrez atravessando a pista) */
    var lg = svgEl('g', { class: 'pm-largada' }, G.marcas);
    svgEl('rect', { x: (largadaX - 2.25).toFixed(1), y: (y0 - 4.5).toFixed(1), width: 4.5, height: 9, fill: 'url(#pm-xadrez)' }, lg);
    geo.largadaEl = lg;

    montarCarros();
    desenharCarros();
    assinatura = assinar();
  }

  /* leque decorativo: n pistinhas saindo de um lado da peça, cada uma dobra a 45° e termina numa via tampada */
  function leque(c, lado, n, alt) {
    if (!c || !c.w) return;
    var passo = Math.min(7, (c.w - 24) / Math.max(1, n - 1));
    for (var i = 0; i < n; i++) {
      var off = (i - (n - 1) / 2) * passo;
      if (Math.abs(off) < 5) continue; /* o meio é do toco */
      var x = c.cx + off, sgn = off < 0 ? -1 : 1, dy = lado === 'cima' ? -1 : 1;
      var y0 = lado === 'cima' ? c.t : c.b;
      var y1 = y0 + dy * Math.max(3, alt - 5), x2 = x + sgn * 4, y2 = y1 + dy * 4;
      svgEl('path', { d: 'M' + x.toFixed(1) + ' ' + y0.toFixed(1) + ' L' + x.toFixed(1) + ' ' + y1.toFixed(1) + ' L' + x2.toFixed(1) + ' ' + y2.toFixed(1), class: 'pm-barramento' }, G.trilhas);
      svgEl('circle', { cx: x2.toFixed(1), cy: y2.toFixed(1), r: 1.3, class: 'pm-via-tampada' }, G.trilhas);
    }
  }

  function caminhoToco(t) { return 'M' + t.a.x.toFixed(1) + ' ' + t.a.y.toFixed(1) + ' ' + trechoToco(t) + ' L' + t.b.x.toFixed(1) + ' ' + t.b.y.toFixed(1); }
  /* se o toco teve de ser deslocado (perto da quina), anda reto e depois dobra a 45° até a pista */
  function trechoToco(t) {
    var dx = t.b.x - t.a.x, dy = t.b.y - t.a.y;
    if (Math.abs(dx) < 0.6 || Math.abs(dy) < 0.6) return '';
    if (t.reta === 'topo' || t.reta === 'base') {
      var yq = t.b.y - Math.sign(dy) * Math.min(Math.abs(dx), Math.abs(dy));
      return 'L' + t.a.x.toFixed(1) + ' ' + yq.toFixed(1);
    }
    var xq = t.b.x - Math.sign(dx) * Math.min(Math.abs(dx), Math.abs(dy));
    return 'L' + xq.toFixed(1) + ' ' + t.a.y.toFixed(1);
  }
  function pontosToco(t) {
    var out = [t.a], meio = trechoToco(t);
    if (meio) { var n = meio.slice(1).split(' '); out.push({ x: +n[0], y: +n[1] }); }
    out.push(t.b);
    return out;
  }

  function sNaPista(pts, cum, q) {
    var melhor = { d: Infinity, s: 0 };
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i], b = pts[(i + 1) % pts.length], vx = b.x - a.x, vy = b.y - a.y, l2 = vx * vx + vy * vy;
      var u = l2 ? Math.max(0, Math.min(1, ((q.x - a.x) * vx + (q.y - a.y) * vy) / l2)) : 0;
      var px = a.x + vx * u, py = a.y + vy * u, dd = Math.hypot(q.x - px, q.y - py);
      if (dd < melhor.d) melhor = { d: dd, s: cum[i] + Math.sqrt(l2) * u };
    }
    return melhor.s;
  }
  function segEm(s) {
    var c = geo.cum, n = geo.pts.length;
    s = ((s % geo.L) + geo.L) % geo.L;
    var i = 0;
    while (i < n - 1 && c[i + 1] <= s) i++;
    return { i: i, u: s - c[i] };
  }
  function pontoEm(s) {
    var g = segEm(s), a = geo.pts[g.i], b = geo.pts[(g.i + 1) % geo.pts.length], l = geo.cum[g.i + 1] - geo.cum[g.i] || 1;
    return { x: a.x + (b.x - a.x) * g.u / l, y: a.y + (b.y - a.y) * g.u / l };
  }
  function direcaoEm(s) {
    var g = segEm(s), a = geo.pts[g.i], b = geo.pts[(g.i + 1) % geo.pts.length], l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return { x: (b.x - a.x) / l, y: (b.y - a.y) / l };
  }

  function acenderToco(id, sim) {
    if (!geo) return;
    geo.tocos.forEach(function (t) { if (t.id === id && t.el) t.el.classList.toggle('aceso', sim); });
  }

  /* ======================= a corrida ======================= */

  var CARROS = [
    { nome: 'azul', vmax: 176, freio: 0.42, s0: 0, cores: ['#1d4ed8', '#22d3ee', '#ecfeff'], haloUrl: 'url(#pm-halo-az)', voltas: 0 },
    { nome: 'roxo', vmax: 186, freio: 0.34, s0: -26, cores: ['#6d28d9', '#c084fc', '#faf5ff'], haloUrl: 'url(#pm-halo-rx)', voltas: 0 }
  ];
  var RASTROS = [[64, 7, 0.16, 0], [38, 3.4, 0.45, 1], [16, 1.7, 0.95, 2]];
  var carrosProntos = false;

  function montarCarros() {
    CARROS.forEach(function (c) {
      if (c.s == null) { c.s = ((c.s0 % geo.L) + geo.L) % geo.L; c.fator = 1; }
      else c.s = Math.min(c.s, geo.L - 0.01);
      if (!c.rastros) {
        c.rastros = RASTROS.map(function (r) { return svgEl('path', { class: 'pm-rastro', stroke: c.cores[r[3]], 'stroke-width': r[1], 'stroke-opacity': r[2] }, G.carros); });
        c.halo = svgEl('circle', { r: 9, fill: c.haloUrl, class: 'pm-cabeca-halo' }, G.carros);
        c.nucleo = svgEl('circle', { r: 2.3, fill: c.cores[2] }, G.carros);
      }
      c.rastros.forEach(function (el, i) { el.setAttribute('d', geo.d); el.setAttribute('stroke-dasharray', RASTROS[i][0] + ' ' + (geo.L - RASTROS[i][0]).toFixed(2)); });
    });
    carrosProntos = true;
  }
  function desenharCarros() {
    if (!carrosProntos || !geo) return;
    CARROS.forEach(function (c) {
      c.rastros.forEach(function (r, i) { r.setAttribute('stroke-dashoffset', (RASTROS[i][0] - c.s).toFixed(2)); });
      var p = pontoEm(c.s);
      c.halo.setAttribute('cx', p.x.toFixed(1)); c.halo.setAttribute('cy', p.y.toFixed(1));
      c.nucleo.setAttribute('cx', p.x.toFixed(1)); c.nucleo.setAttribute('cy', p.y.toFixed(1));
    });
  }
  /* freia perto das quinas e do S, acelera nas retas */
  function velocidade(c) {
    var perto = Infinity, L = geo.L;
    for (var i = 0; i < geo.cantos.length; i++) {
      var dd = Math.abs(geo.cantos[i] - c.s);
      dd = Math.min(dd, L - dd);
      if (dd < perto) perto = dd;
    }
    return c.vmax * c.fator * (c.freio + (1 - c.freio) * Math.min(1, perto / 58));
  }
  function passou(de, para, alvo) { return de <= para ? (alvo > de && alvo <= para) : (alvo > de || alvo <= para); }

  var raf = 0, ultimo = 0, visivel = true, ativo = false;
  function podeCorrer() { return ativo && visivel && geo && !document.hidden && !mmReduz.matches && !html.classList.contains('sem-foco'); }
  function ligarMotor() { if (!raf && podeCorrer()) { ultimo = 0; raf = requestAnimationFrame(quadro); } }
  function quadro(t) {
    raf = 0;
    if (!podeCorrer()) return;
    var dt = ultimo ? Math.min(0.05, (t - ultimo) / 1000) : 0;
    ultimo = t;
    CARROS.forEach(function (c) {
      var de = c.s;
      c.s += velocidade(c) * dt;
      if (c.s >= geo.L) { c.s -= geo.L; volta(c); }
      geo.tocos.forEach(function (tc) { if (passou(de, c.s, tc.s)) boxe(tc, c); });
    });
    desenharCarros();
    raf = requestAnimationFrame(quadro);
  }
  function volta(c) {
    c.voltas++;
    c.fator = 0.97 + Math.random() * 0.06; /* cada volta, um fôlego um pouco diferente */
    var b = voltasEl.querySelector(c.nome === 'azul' ? '.az b' : '.rx b');
    if (b) b.textContent = String(c.voltas);
    if (geo.largadaEl) { geo.largadaEl.classList.add('flash'); setTimeout(function () { geo && geo.largadaEl && geo.largadaEl.classList.remove('flash'); }, 240); }
  }
  /* o carro passa pela entrada de uma peça: o pad brilha e a peça acende um instante */
  var boxeT = {};
  function boxe(tc, c) {
    var p = pecas[tc.id];
    if (!p) return;
    var cls = c.nome === 'roxo' ? 'pm-passou-roxo' : '';
    p.el.classList.add('pm-passou'); if (cls) p.el.classList.add(cls);
    if (tc.pad) tc.pad.classList.add('brilha');
    clearTimeout(boxeT[tc.id]);
    boxeT[tc.id] = setTimeout(function () { p.el.classList.remove('pm-passou', 'pm-passou-roxo'); if (tc.pad) tc.pad.classList.remove('brilha'); }, 260);
  }

  /* ======================= faíscas: a informação chega à peça ======================= */

  function chegar(id) {
    var p = pecas[id];
    if (!p) return;
    p.el.classList.remove('pm-chegou'); void p.el.offsetWidth; p.el.classList.add('pm-chegou');
    setTimeout(function () { p.el.classList.remove('pm-chegou'); }, 900);
  }
  function faisca(id, alerta) {
    var agora = Date.now();
    if (ultimaFaisca[id] && agora - ultimaFaisca[id] < 1200) return;
    ultimaFaisca[id] = agora;
    if (!geo || !podeCorrer() || !G.faiscas.animate) { chegar(id); return; }
    var alvo = geo.tocos.filter(function (t) { return t.id === id; })[0], cpu = geo.tocos.filter(function (t) { return t.id === 'terminal'; })[0];
    if (!alvo || !cpu || id === 'terminal') { chegar(id); return; }
    var L = geo.L, fwd = ((alvo.s - cpu.s) % L + L) % L, pontos = pontosToco(cpu), meio = [];
    var ida = fwd <= L / 2, dist = ida ? fwd : L - fwd;
    geo.cantos.concat([0]).forEach(function (sv) {
      var dd = ida ? ((sv - cpu.s) % L + L) % L : ((cpu.s - sv) % L + L) % L;
      if (dd > 0.5 && dd < dist - 0.5) meio.push({ d: dd, p: pontoEm(sv) });
    });
    meio.sort(function (m, n) { return m.d - n.d; });
    pontos = pontos.concat(meio.map(function (m) { return m.p; })).concat(pontosToco(alvo).reverse());
    var comp = 0;
    for (var i = 1; i < pontos.length; i++) comp += Math.hypot(pontos[i].x - pontos[i - 1].x, pontos[i].y - pontos[i - 1].y);
    var el = svgEl('path', { d: 'M' + pontos.map(function (p) { return p.x.toFixed(1) + ' ' + p.y.toFixed(1); }).join(' L'), class: 'pm-faisca' + (alerta ? ' alerta' : ''), 'stroke-dasharray': '22 ' + (comp + 40).toFixed(0) }, G.faiscas);
    var an = el.animate([{ strokeDashoffset: 22 }, { strokeDashoffset: -comp }], { duration: Math.max(380, Math.min(1100, comp * 1.25)), easing: 'cubic-bezier(.45,0,.2,1)' });
    an.onfinish = function () { el.remove(); chegar(id); };
  }

  /* ======================= onde a placa mora ======================= */

  function lugarNoDia() {
    if (html.getAttribute('data-vista') !== 'estacao') return null;
    var E = BC.estacao, aba = E && E.abaAtual ? E.abaAtual() : null;
    if (!aba || (aba.atividade || aba.tipo) !== 'dia') return null;
    var c = document.getElementById('e-conteudo'), cab = c && c.querySelector('.pagina-cab');
    return cab && cab.querySelector('.saudacao') ? cab : null;
  }
  function posicionar() {
    if (!secao) return;
    var cab = lugarNoDia();
    if (!cab) {
      if (secao.parentNode) secao.parentNode.removeChild(secao);
      if (html.hasAttribute('data-placa')) html.removeAttribute('data-placa');
      ativo = false;
      return;
    }
    var pai = cab.parentNode, antesDe = null, conteudo = document.getElementById('e-conteudo');
    for (var n = cab.nextElementSibling; n; n = n.nextElementSibling) { if (n !== secao && !n.classList.contains('cuidado-meu')) { antesDe = n; break; } }
    if (secao.parentNode !== pai || secao.nextElementSibling !== antesDe) {
      var voltou = !secao.parentNode && conteudo.dataset.aba === abaVista;
      pai.insertBefore(secao, antesDe);
      /* a Estação redesenhou o Meu dia: ela devolveu o scroll com a placa ainda fora (conta errada perto do fim da página);
         com a placa de volta, o scroll volta a ser exatamente o de antes do redesenho */
      if (voltou && conteudo.scrollTop !== ultimoTopo) conteudo.scrollTop = ultimoTopo;
    }
    abaVista = conteudo.dataset.aba;
    if (html.getAttribute('data-placa') !== 'dia') html.setAttribute('data-placa', 'dia');
    ativo = true;
    conferirDesenho();
    ligarMotor();
  }

  var lerPedido = 0, ultimoTopo = 0, abaVista = null;
  function agendarLer() {
    if (lerPedido) return;
    lerPedido = requestAnimationFrame(function () { lerPedido = 0; aplicar(ler()); });
  }

  function iniciar() {
    var conteudo = document.getElementById('e-conteudo'), st = document.getElementById('e-status');
    if (!conteudo || !st) return false;
    montar();
    new MutationObserver(posicionar).observe(conteudo, { childList: true });
    conteudo.addEventListener('scroll', function () { ultimoTopo = conteudo.scrollTop; }, { passive: true });
    new MutationObserver(agendarLer).observe(st, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'style', 'aria-label', 'data-id'] });
    if (window.ResizeObserver) new ResizeObserver(agendarTracar).observe(placa);
    else window.addEventListener('resize', agendarTracar);
    if (window.IntersectionObserver) new IntersectionObserver(function (es) { visivel = es[es.length - 1].isIntersecting; ligarMotor(); }).observe(placa);
    document.addEventListener('visibilitychange', ligarMotor);
    new MutationObserver(ligarMotor).observe(html, { attributes: true, attributeFilter: ['class'] });
    if (mmReduz.addEventListener) mmReduz.addEventListener('change', function () { ligarMotor(); desenharCarros(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(agendarTracar);
    aplicar(ler());
    posicionar();
    return true;
  }
  if (!iniciar()) document.addEventListener('DOMContentLoaded', iniciar);

  BC.placaMae = {
    versao: 1,
    ler: ler,
    faisca: faisca,
    geometria: function () { return geo ? { L: geo.L, tocos: geo.tocos.map(function (t) { return { id: t.id, reta: t.reta, s: Math.round(t.s) }; }), compacta: compacta } : null; },
    carros: function () { return CARROS.map(function (c) { return { nome: c.nome, s: Math.round(c.s), voltas: c.voltas }; }); },
    tracados: function () { return nTracados; }
  };
})();
