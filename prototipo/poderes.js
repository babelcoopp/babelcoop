/* babel-coop · os poderes (window.BC.poderes): explosão de luz, onda de choque, orbes que voam até o placar,
   "+N" que sobe e o combo de fim, com som de jogo. Pedido do Theus (24/09/2026): "brilhos, tipo poderes de jogo".

   Leis (docs/design/REGUA_ORGANISMO.md):
   - só acende com evento real (peça pronta, campanha pronta, no ar); nada de recompensa aleatória;
   - tem começo e fim: o canvas nasce no primeiro efeito e é removido quando a última partícula apaga.
     Em repouso não há canvas, rAF nem timer (o app parado já gasta CPU demais: memoria 2026-09-24);
   - "efeitos" desligado pela pessoa ou prefers-reduced-motion = só cor, sem movimento;
   - som só na Estação, com o som ligado (a mesma chave do organismo), ganho ≤ 0,08; nunca na TV nem no iPad.
*/
(function () {
  'use strict';
  var BC = window.BC = window.BC || {};
  if (BC.poderes) return;

  var TETO = 420, GANHO_MAX = 0.08, DPR_MAX = 2;
  var PADRAO = { t0: '#2ad5e5', t2: '#a376e9', ouro: '#f5c76a', ok: '#7fd6a6' };

  function org() { var o = BC.organismo; return o && o.versao ? o : null; }
  function mqReduz() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function semMovimento() { var o = org(); if (o && o.semMovimento) return o.semMovimento(); return mqReduz(); }
  function naTV() { var o = org(); if (o && o.naTV) return o.naTV(); return /^#?(tv|ipad)\b/.test(location.hash || ''); }
  function somLigado() { var o = org(); if (o && o.somLigado) return o.somLigado(); return !naTV(); }
  function elementoDe(x) { return x && x.getBoundingClientRect ? x : null; }
  function centro(el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r }; }
  function visivel(el) { var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; }
  function rgb(c) {
    c = String(c || '').trim();
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
    if (m) { var h = m[1]; if (h.length === 3) h = h.replace(/(.)/g, '$1$1'); var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    m = /^rgba?\(([^)]+)\)$/i.exec(c);
    if (m) { var p = m[1].split(/[\s,\/]+/).map(parseFloat); if (p.length >= 3) return [p[0], p[1], p[2]]; }
    return null;
  }
  function cor(nome, el) {
    if (!nome) return rgb(PADRAO.t0);
    var direta = rgb(nome);
    if (direta) return direta;
    var v = '';
    try { v = getComputedStyle(el || document.documentElement).getPropertyValue(nome.charAt(0) === '-' ? nome : '--' + nome).trim(); } catch (e) { v = ''; }
    return rgb(v) || rgb(PADRAO[nome]) || rgb(PADRAO.t0);
  }
  function rgba(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a < 0 ? 0 : a > 1 ? 1 : a).toFixed(3) + ')'; }
  function claro(c, k) { return [c[0] + (255 - c[0]) * k, c[1] + (255 - c[1]) * k, c[2] + (255 - c[2]) * k]; }

  /* ------------------------------------------------------------------ o palco de luz (canvas por cima de tudo, só enquanto vive) */
  var tela = null, ctx = null, dpr = 1, raf = 0, ultimo = 0;
  var parts = [], ondas = [], orbes = [], textos = [];
  function garantirTela() {
    if (tela && tela.isConnected) return true;
    tela = document.createElement('canvas');
    tela.className = 'pd-tela';
    tela.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tela);
    ctx = tela.getContext('2d');
    medir();
    addEventListener('resize', medir);
    return !!ctx;
  }
  function medir() {
    if (!tela) return;
    dpr = Math.min(DPR_MAX, window.devicePixelRatio || 1);
    tela.width = Math.round(innerWidth * dpr); tela.height = Math.round(innerHeight * dpr);
    tela.style.width = innerWidth + 'px'; tela.style.height = innerHeight + 'px';
  }
  function soltarTela() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    removeEventListener('resize', medir);
    if (tela && tela.parentNode) tela.parentNode.removeChild(tela);
    tela = null; ctx = null;
  }
  function vivos() { return parts.length + ondas.length + orbes.length + textos.length; }
  function acordar() { if (!raf && garantirTela()) { ultimo = performance.now(); raf = requestAnimationFrame(quadro); } }

  function quadro(t) {
    raf = 0;
    if (!ctx) return;
    var dt = Math.min(0.05, (t - ultimo) / 1000); ultimo = t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalCompositeOperation = 'lighter';
    /* ondas de choque */
    ondas = ondas.filter(function (o) {
      o.t += dt; var k = o.t / o.dur; if (k >= 1) return false;
      var e = 1 - Math.pow(1 - k, 3), raio = o.r0 + (o.r1 - o.r0) * e;
      ctx.lineWidth = o.largura * (1 - k) + 0.5;
      ctx.strokeStyle = rgba(o.cor, 0.9 * (1 - k));
      ctx.shadowColor = rgba(o.cor, 0.8 * (1 - k)); ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(o.x, o.y, raio, 0, Math.PI * 2); ctx.stroke();
      return true;
    });
    ctx.shadowBlur = 0;
    /* partículas (faíscas com rastro) */
    parts = parts.filter(function (p) {
      p.vida -= dt; if (p.vida <= 0) return false;
      p.vx *= Math.pow(p.arrasto, dt * 60); p.vy = p.vy * Math.pow(p.arrasto, dt * 60) + p.g * dt;
      var x0 = p.x, y0 = p.y;
      p.x += p.vx * dt; p.y += p.vy * dt;
      var k = p.vida / p.vida0, a = k * k;
      ctx.strokeStyle = rgba(p.cor, a); ctx.lineWidth = p.tam * (0.4 + k * 0.8); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0 - p.vx * dt * 2.2, y0 - p.vy * dt * 2.2); ctx.lineTo(p.x, p.y); ctx.stroke();
      if (p.brilho) { var gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.tam * 5); gr.addColorStop(0, rgba(claro(p.cor, 0.6), a * 0.7)); gr.addColorStop(1, rgba(p.cor, 0)); ctx.fillStyle = gr; ctx.fillRect(p.x - p.tam * 5, p.y - p.tam * 5, p.tam * 10, p.tam * 10); }
      return true;
    });
    /* orbes que voam até o alvo (curva de Bézier; o alvo é relido a cada quadro: rolar a tela não perde o placar) */
    orbes = orbes.filter(function (o) {
      o.t += dt; if (o.t < 0) return true;
      var k = Math.min(1, o.t / o.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      var fim = o.alvo && o.alvo.isConnected ? centro(o.alvo) : o.fim; o.fim = fim;
      var cx = (o.x0 + fim.x) / 2 + o.curva, cy = Math.min(o.y0, fim.y) - 90 - Math.abs(o.curva) * 0.4;
      var x = (1 - e) * (1 - e) * o.x0 + 2 * (1 - e) * e * cx + e * e * fim.x, y = (1 - e) * (1 - e) * o.y0 + 2 * (1 - e) * e * cy + e * e * fim.y;
      o.rastro.push([x, y]); if (o.rastro.length > 14) o.rastro.shift();
      for (var i = 1; i < o.rastro.length; i++) {
        var ka = i / o.rastro.length;
        ctx.strokeStyle = rgba(o.cor, ka * 0.8); ctx.lineWidth = 1 + ka * 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(o.rastro[i - 1][0], o.rastro[i - 1][1]); ctx.lineTo(o.rastro[i][0], o.rastro[i][1]); ctx.stroke();
      }
      var g = ctx.createRadialGradient(x, y, 0, x, y, 16); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.3, rgba(o.cor, 0.9)); g.addColorStop(1, rgba(o.cor, 0));
      ctx.fillStyle = g; ctx.fillRect(x - 16, y - 16, 32, 32);
      if (k >= 1) { estourar(fim.x, fim.y, o.cor, 14, 0.55); if (o.aoChegar) o.aoChegar(); return false; }
      return true;
    });
    /* textos que sobem ("+2", "COMBO") */
    ctx.globalCompositeOperation = 'source-over';
    textos = textos.filter(function (tx) {
      tx.t += dt; var k = tx.t / tx.dur; if (k >= 1) return false;
      var sobe = (1 - Math.pow(1 - k, 2)) * tx.sobe, esc = tx.escala * (k < 0.15 ? 0.6 + (k / 0.15) * 0.55 : 1.15 - Math.min(0.15, (k - 0.15) * 0.4));
      var a = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      ctx.save(); ctx.translate(tx.x, tx.y - sobe); ctx.scale(esc, esc);
      ctx.font = '800 ' + tx.tam + 'px ' + (tx.fonte || 'Inter, system-ui, sans-serif'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = rgba(tx.cor, 0.9 * a); ctx.shadowBlur = 22;
      ctx.fillStyle = rgba(claro(tx.cor, 0.55), a); ctx.fillText(tx.texto, 0, 0);
      ctx.shadowBlur = 0; ctx.lineWidth = 1; ctx.strokeStyle = rgba(tx.cor, a * 0.8); ctx.strokeText(tx.texto, 0, 0);
      ctx.restore();
      return true;
    });
    if (vivos()) raf = requestAnimationFrame(quadro);
    else setTimeout(function () { if (!vivos() && !raf) soltarTela(); }, 250);
  }

  /* ------------------------------------------------------------------ peças do vocabulário */
  function estourar(x, y, c, n, forca, opc) {
    opc = opc || {};
    n = Math.min(n, TETO - parts.length);
    for (var i = 0; i < n; i++) {
      var ang = (i / n) * Math.PI * 2 + (i % 3) * 0.37, vel = (140 + ((i * 53) % 100) * 3.2) * forca;
      parts.push({ x: x, y: y, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel - (opc.subir || 0), g: opc.g == null ? 380 : opc.g, arrasto: 0.93,
        vida: 0.55 + ((i * 29) % 40) / 80, vida0: 0, tam: 1.4 + (i % 4) * 0.6, cor: i % 5 === 0 ? claro(c, 0.7) : c, brilho: i % 3 === 0 });
      parts[parts.length - 1].vida0 = parts[parts.length - 1].vida;
    }
  }
  function onda(x, y, c, r0, r1, dur, largura) { ondas.push({ x: x, y: y, cor: c, r0: r0, r1: r1, dur: dur, t: 0, largura: largura || 6 }); }

  /* flash no próprio elemento (CSS): serve também sem movimento, é só cor */
  function flash(el, c, forte) {
    if (!el) return;
    el.style.setProperty('--pd-cor', rgba(c, 1));
    el.classList.remove('pd-flash', 'pd-flash-forte'); void el.offsetWidth;
    el.classList.add(forte ? 'pd-flash-forte' : 'pd-flash');
    setTimeout(function () { el.classList.remove('pd-flash', 'pd-flash-forte'); }, forte ? 1300 : 900);
  }

  /* explosão de luz: flash no elemento + 2 ondas de choque + chuva de faíscas na cor dada */
  function explodir(alvo, opc) {
    opc = opc || {};
    var el = elementoDe(alvo); if (!el) return false;
    var c = cor(opc.cor, el), forca = opc.forca || 1;
    flash(el, c, forca > 1);
    if (semMovimento() || !visivel(el)) return false;
    var m = centro(el), raio = Math.max(m.r.width, m.r.height) / 2;
    onda(m.x, m.y, c, raio * 0.25, raio * 1.25 * forca, 0.7, 7);
    onda(m.x, m.y, claro(c, 0.5), raio * 0.1, raio * 0.8 * forca, 0.5, 4);
    estourar(m.x, m.y, c, Math.round(46 * forca), 1.05 * forca, { subir: 60 });
    acordar();
    return true;
  }

  /* orbes que saem de um elemento e voam até outro; aoCadaUm(i) em cada chegada, aoFim() na última */
  function voar(de, para, opc) {
    opc = opc || {};
    var a = elementoDe(de), b = elementoDe(para);
    var n = opc.n || 4, fim = opc.aoFim || function () {}, cada = opc.aoCadaUm || function () {};
    if (!a || !b || semMovimento() || !visivel(a)) { for (var j = 0; j < n; j++) cada(j); fim(); return false; }
    var c = cor(opc.cor, a), m = centro(a), chegaram = 0;
    for (var i = 0; i < n; i++) {
      (function (i) {
        orbes.push({ x0: m.x + (i - (n - 1) / 2) * 18, y0: m.y, alvo: b, fim: centro(b), t: -i * 0.09, dur: 0.75 + i * 0.04,
          curva: (i % 2 ? 1 : -1) * (60 + i * 25), cor: i % 2 ? claro(c, 0.35) : c, rastro: [],
          aoChegar: function () { cada(i); chegaram++; flash(b, c, false); som('impacto'); if (chegaram === n) fim(); } });
      })(i);
    }
    acordar();
    return true;
  }

  /* "+N" que sobe do elemento */
  function flutuar(alvo, texto, opc) {
    opc = opc || {};
    var el = elementoDe(alvo); if (!el || semMovimento() || !visivel(el)) return false;
    var m = centro(el), c = cor(opc.cor, el);
    textos.push({ x: m.x, y: opc.topo ? m.r.top + 10 : m.y, texto: String(texto), cor: c, t: 0, dur: opc.dur || 1.3, sobe: opc.sobe || 70, tam: opc.tam || 30, escala: 1 });
    acordar();
    return true;
  }

  /* o combo do fim: fogos em volta, banner grande no meio do palco, luz nas bordas da janela */
  function combo(alvo, titulo, sub, opc) {
    opc = opc || {};
    var el = elementoDe(alvo); if (!el) return false;
    var c = cor(opc.cor, el);
    bordas(c);
    if (semMovimento()) return false;
    var r = el.getBoundingClientRect(), cx = Math.min(innerWidth - 60, Math.max(60, r.left + r.width / 2)), cy = Math.min(innerHeight - 80, Math.max(80, r.top + Math.min(r.height, innerHeight) / 2));
    var pontos = [[-0.32, -0.18], [0.3, -0.24], [0, 0.05], [-0.22, 0.26], [0.26, 0.2]];
    pontos.forEach(function (p, i) {
      setTimeout(function () {
        var x = cx + p[0] * Math.min(r.width, 900), y = cy + p[1] * Math.min(r.height, 600);
        onda(x, y, i % 2 ? claro(c, 0.4) : c, 6, 120, 0.8, 5);
        estourar(x, y, i % 2 ? claro(c, 0.3) : c, 60, 1.25, { subir: 120, g: 300 });
        if (i % 2 === 0) som('estouro');
        acordar();
      }, i * 170);
    });
    textos.push({ x: cx, y: cy, texto: titulo, cor: c, t: 0, dur: 2.2, sobe: 30, tam: opc.tam || 54, escala: 1, fonte: '"Babel Torre", "Arial Narrow", sans-serif' });
    if (sub) textos.push({ x: cx, y: cy + (opc.tam || 54) * 0.9, texto: sub, cor: claro(c, 0.2), t: -0.15, dur: 2.2, sobe: 30, tam: 24, escala: 1 });
    acordar();
    return true;
  }
  /* luz que acende nas quatro bordas da janela e apaga (CSS, sem movimento: vale com "efeitos" desligado) */
  function bordas(c) {
    var v = document.createElement('div');
    v.className = 'pd-bordas';
    v.setAttribute('aria-hidden', 'true');
    v.style.setProperty('--pd-cor', rgba(c, 1));
    document.body.appendChild(v);
    setTimeout(function () { if (v.parentNode) v.parentNode.removeChild(v); }, 1700);
  }
  /* faísca pequena (o poder carregando): usada a cada passo da peça */
  function faisca(alvo, opc) {
    opc = opc || {};
    var el = elementoDe(alvo); if (!el || semMovimento() || !visivel(el)) return false;
    var m = centro(el);
    estourar(m.x, m.y, cor(opc.cor, el), opc.n || 10, 0.45, { g: 120 });
    acordar();
    return true;
  }

  /* ------------------------------------------------------------------ sons de jogo (Web Audio, osciladores; mesma chave de som do organismo) */
  var SONS = {
    poder: { onda: 'triangle', notas: [[523, 0.06], [659, 0.06], [784, 0.06], [1047, 0.08], [1568, 0.22]], passo: 0.055 },
    impacto: { onda: 'sine', notas: [[1319, 0.09]], passo: 0.05, ganho: 0.04 },
    estouro: { onda: 'sawtooth', notas: [[196, 0.18], [98, 0.3]], passo: 0.03, ganho: 0.035, filtro: 900 },
    combo: { onda: 'triangle', notas: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.14], [784, 0.08], [1047, 0.45]], passo: 0.09, acorde: [[523, 659, 784, 1047], 0.6] }
  };
  var audio = null, ultimoSom = {};
  function som(nome) {
    var def = SONS[nome];
    if (!def || naTV() || !somLigado()) return false;
    var t = performance.now();
    if (ultimoSom[nome] && t - ultimoSom[nome] < 70) return false;
    ultimoSom[nome] = t;
    try {
      if (!audio) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false; audio = new AC(); }
      if (audio.state === 'suspended') audio.resume();
      var t0 = audio.currentTime + 0.005, pico = Math.min(GANHO_MAX, def.ganho || 0.06), saida = audio.destination;
      if (def.filtro) { var f = audio.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = def.filtro; f.connect(audio.destination); saida = f; }
      var tocar = function (freq, ini, dur, ganho) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.type = def.onda; o.frequency.value = freq;
        g.gain.setValueAtTime(0, ini); g.gain.linearRampToValueAtTime(ganho, ini + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, ini + dur);
        o.connect(g); g.connect(saida); o.start(ini); o.stop(ini + dur + 0.03);
        o.onended = function () { try { o.disconnect(); g.disconnect(); } catch (e) { /* segue */ } };
      };
      var off = 0;
      def.notas.forEach(function (n) { tocar(n[0], t0 + off, n[1], pico); off += def.passo; });
      if (def.acorde) def.acorde[0].forEach(function (fq) { tocar(fq, t0 + off, def.acorde[1], pico / def.acorde[0].length * 1.6); });
    } catch (e) { return false; }
    return true;
  }

  BC.poderes = { versao: '1.0.0', explodir: explodir, voar: voar, flutuar: flutuar, combo: combo, faisca: faisca, bordas: bordas, som: som,
    vivos: vivos, ativo: function () { return !!tela; } };

  /* acréscimo (25/09/2026, o meio vivo: app/interface/nascendo.js): 'poder-leve' é o 'poder' baixinho (3 notas curtas,
     ganho 0,022) para as micro-explosões do arquivo que nasce (seção, bloco que fecha, item marcado): várias por segundo
     não podem virar barulho. Mesma chave de som, mesmo silêncio na TV e no iPad. */
  SONS['poder-leve'] = { onda: 'triangle', notas: [[1047, 0.05], [1319, 0.05], [1568, 0.12]], passo: 0.045, ganho: 0.022 };
})();
