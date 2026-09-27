/* Babel Coop — protótipo · o nome em neon no "Bom dia, <nome>." (camada profundidade, 26/09/2026)
   Por cima do nome vai um SVG com o mesmo texto, só em contorno: um tubo de neon fraco e duas luzes que correm pelo
   contorno das letras (stroke-dashoffset animado). O nome continua sendo texto normal; o SVG é só enfeite (aria-hidden).
   O visual e a animação estão em profundidade.css (neon só no modo Tech). Retirada: tirar o <script> de index.html. */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  function el(tag, classe) { var e = document.createElement(tag); e.className = classe; return e; }
  function svgEl(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  /* brilho do neon: o próprio traço, borrado em duas distâncias, por baixo do traço nítido */
  function filtroBrilho() {
    var f = svgEl('filter', { id: 'sn-brilho', x: '-20%', y: '-60%', width: '140%', height: '220%' });
    f.appendChild(svgEl('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '2', result: 'perto' }));
    f.appendChild(svgEl('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '6', result: 'longe' }));
    var m = svgEl('feMerge');
    ['longe', 'perto', 'SourceGraphic'].forEach(function (n) { m.appendChild(svgEl('feMergeNode', { in: n })); });
    f.appendChild(m);
    var defs = svgEl('defs');
    defs.appendChild(f);
    return defs;
  }

  /* "Bom dia, Dominic." → "Bom dia, " + [Dominic com neon] + "." */
  function montar(p) {
    var texto = p.textContent, i = texto.lastIndexOf(', ');
    p.dataset.neon = 'sim';
    if (i < 0) return;
    var resto = texto.slice(i + 2), ponto = /\.$/.test(resto) ? '.' : '', nome = ponto ? resto.slice(0, -1) : resto;
    if (!nome) return;

    var sn = el('span', 'sn'), letras = el('span', 'sn-texto');
    letras.textContent = nome;
    sn.appendChild(letras);
    var svg = svgEl('svg', { class: 'sn-neon', 'aria-hidden': 'true', focusable: 'false' });
    svg.appendChild(filtroBrilho());
    ['sn-tubo', 'sn-luz', 'sn-luz sn-luz-2'].forEach(function (c) {
      var t = svgEl('text', { class: c, filter: 'url(#sn-brilho)' });
      t.textContent = nome;
      svg.appendChild(t);
    });
    sn.appendChild(svg);

    p.textContent = '';
    p.appendChild(document.createTextNode(texto.slice(0, i + 2)));
    p.appendChild(sn);
    if (ponto) p.appendChild(document.createTextNode(ponto));
    ajustar(p);
  }

  /* o contorno precisa cair exatamente em cima das letras: mesma fonte, mesmo tamanho, mesma linha de base */
  function ajustar(p) {
    var sn = p.querySelector('.sn'), letras = sn && sn.querySelector('.sn-texto'), svg = sn && sn.querySelector('.sn-neon');
    if (!svg) return;
    var cs = getComputedStyle(letras), tam = parseFloat(cs.fontSize) || 48, folga = Math.ceil(tam * 0.7);
    var marco = document.createElement('span');
    marco.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    letras.appendChild(marco);
    var rSn = sn.getBoundingClientRect(), rLetras = letras.getBoundingClientRect(), base = marco.getBoundingClientRect().top - rSn.top;
    letras.removeChild(marco);
    svg.setAttribute('width', Math.ceil(rSn.width + folga * 2));
    svg.setAttribute('height', Math.ceil(rSn.height + folga * 2));
    svg.style.left = -folga + 'px';
    svg.style.top = -folga + 'px';
    [].forEach.call(svg.querySelectorAll('text'), function (t) {
      t.setAttribute('x', (rLetras.left - rSn.left + folga).toFixed(2));
      t.setAttribute('y', (base + folga).toFixed(2));
      t.style.fontFamily = cs.fontFamily;
      t.style.fontSize = cs.fontSize;
      t.style.fontWeight = cs.fontWeight;
      t.style.letterSpacing = cs.letterSpacing;
    });
  }

  function varrer() {
    [].forEach.call(document.querySelectorAll('.saudacao:not([data-neon])'), montar);
  }
  function reajustar() {
    [].forEach.call(document.querySelectorAll('.saudacao[data-neon]'), ajustar);
  }

  new MutationObserver(varrer).observe(document.getElementById('e-conteudo') || document.body, { childList: true, subtree: true });
  if (document.fonts) {
    document.fonts.ready.then(reajustar);
    document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', reajustar);
  }
  window.addEventListener('resize', reajustar);
  varrer();
})();
