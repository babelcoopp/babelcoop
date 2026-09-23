/* Babel Coop — protótipo · quadro branco (no estilo do Freeform): caneta, marca-texto, post-it, texto; ao vivo na TV */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var U = BC.util;
  var CORES = ['#f2eaff', '#c7a2ff', '#29ccec', '#7fd6a6', '#ffcf5c', '#ff7ab8', '#ff6b6b'];
  var CORES_POSTIT = ['#ffcf5c', '#7fd6a6', '#ff7ab8', '#88d7ea', '#c7a2ff'];
  var FERRAMENTAS = [['mao', '✋', 'Mover a tela'], ['caneta', '✎', 'Caneta'], ['marca', '▮', 'Marca-texto'], ['borracha', '⌫', 'Borracha'], ['postit', '▢', 'Post-it'], ['texto', 'T', 'Texto']];

  function caminho(pts) {
    if (!pts.length) return '';
    if (pts.length === 1) return 'M' + pts[0][0] + ' ' + pts[0][1] + ' l0.1 0';
    var d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (var i = 1; i < pts.length - 1; i++) {
      d += ' Q' + pts[i][0] + ' ' + pts[i][1] + ' ' + ((pts[i][0] + pts[i + 1][0]) / 2).toFixed(1) + ' ' + ((pts[i][1] + pts[i + 1][1]) / 2).toFixed(1);
    }
    var u = pts[pts.length - 1];
    return d + ' L' + u[0] + ' ' + u[1];
  }
  function pressao(pts) { var s = 0; pts.forEach(function (p) { s += p[2] == null ? 0.5 : p[2]; }); return s / pts.length; }
  function traco(t) {
    var marca = t.ferramenta === 'marca', w = marca ? 18 : (t.largura || 3) * (0.6 + pressao(t.pontos) * 0.8);
    return '<path data-item="' + U.esc(t.id || '') + '" d="' + caminho(t.pontos) + '" stroke="' + U.esc(t.cor) + '" stroke-width="' + w.toFixed(1) +
      '" stroke-opacity="' + (marca ? 0.35 : 1) + '" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
  }

  function Quadro(el, arquivoId, opcoes) {
    this.el = el;
    this.id = arquivoId;
    this.op = opcoes || {};
    this.ferramenta = this.op.editavel ? 'caneta' : 'mao';
    this.cor = '#c7a2ff';
    this.pan = { x: 40, y: 40 };
    this.zoom = 1;
    this.vivos = {};
    this.atual = null;
    this.destruido = false;
    this.montar();
    this.atualizar();
    var eu = this;
    BC.canal.ouvir(function (msg) {
      if (eu.destruido || msg.quadro !== eu.id) return;
      if (msg.tipo === 'traco-vivo') { eu.vivos[msg.traco.id] = msg.traco; eu.desenharVivos(); }
      if (msg.tipo === 'traco-fim') { delete eu.vivos[msg.tracoId]; eu.desenharVivos(); }
    });
    setTimeout(function () { eu.enquadrar(); }, 30);
  }

  Quadro.prototype.montar = function () {
    var eu = this, op = this.op;
    this.el.classList.add('quadro');
    if (op.ipad) this.el.classList.add('quadro-ipad');
    var barra = '';
    if (!op.tv) {
      barra = '<div class="q-barra">' + (op.editavel ? FERRAMENTAS.map(function (f) {
        return '<button type="button" class="q-ferr" data-q="ferr:' + f[0] + '" title="' + f[2] + '" aria-label="' + f[2] + '">' + f[1] + '</button>';
      }).join('') + '<span class="q-sep"></span>' + CORES.map(function (c) {
        return '<button type="button" class="q-cor" data-q="cor:' + c + '" style="--c:' + c + '" aria-label="Cor ' + c + '"></button>';
      }).join('') + '<span class="q-sep"></span><button type="button" class="botao discreto" data-q="desfazer">Desfazer</button>' : '<span class="rotulo">Só para ver</span>') +
        '<span class="q-sep"></span><button type="button" class="botao discreto" data-q="menos" aria-label="Diminuir">−</button><button type="button" class="botao discreto" data-q="mais" aria-label="Aumentar">+</button>' +
        '<button type="button" class="botao discreto" data-q="enquadrar">Enquadrar</button>' +
        (op.aoVivo ? '<button type="button" class="botao q-vivo" data-q="vivo">Ao vivo na TV</button>' : '') + '</div>';
    }
    this.el.innerHTML = barra + '<div class="q-palco"><div class="q-mundo"><svg class="q-svg" width="4000" height="3000"><g class="q-itens"></g><g class="q-vivos"></g><g class="q-atual"></g></svg><div class="q-notas"></div></div></div>';
    this.palco = this.el.querySelector('.q-palco');
    this.mundo = this.el.querySelector('.q-mundo');
    this.gItens = this.el.querySelector('.q-itens');
    this.gVivos = this.el.querySelector('.q-vivos');
    this.gAtual = this.el.querySelector('.q-atual');
    this.notas = this.el.querySelector('.q-notas');
    this.marcarBarra();

    this.el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-q]');
      if (!b) return;
      var q = b.dataset.q;
      if (q.indexOf('ferr:') === 0) eu.ferramenta = q.slice(5);
      if (q.indexOf('cor:') === 0) eu.cor = q.slice(4);
      if (q === 'mais') eu.zoomEm(1.2);
      if (q === 'menos') eu.zoomEm(1 / 1.2);
      if (q === 'enquadrar') eu.enquadrar();
      if (q === 'desfazer') eu.desfazer();
      if (q === 'vivo') eu.alternarVivo();
      eu.marcarBarra();
    });
    if (op.tv) return;

    var arrasto = null, ultimoEnvio = 0;
    this.palco.addEventListener('pointerdown', function (ev) {
      if (ev.target.closest('.q-nota') && eu.ferramenta !== 'borracha') return;
      var p = eu.xy(ev);
      if (eu.ferramenta === 'mao' || !op.editavel || ev.button === 1) {
        arrasto = { x: ev.clientX - eu.pan.x, y: ev.clientY - eu.pan.y };
      } else if (eu.ferramenta === 'caneta' || eu.ferramenta === 'marca') {
        eu.atual = { id: U.id('tr'), pontos: [[p.x, p.y, ev.pressure || 0.5]], cor: eu.cor, largura: 3, ferramenta: eu.ferramenta, quem: BC.loja.eu };
      } else if (eu.ferramenta === 'borracha') {
        eu.apagarEm(p); arrasto = { borracha: true };
      } else if (eu.ferramenta === 'postit') {
        BC.loja.fazer('quadroItem', eu.id, { tipo: 'postit', x: Math.round(p.x), y: Math.round(p.y), w: 180, h: 120, cor: U.sorteia(CORES_POSTIT), texto: 'Nova ideia' });
        eu.ferramenta = 'caneta'; eu.marcarBarra(); return;
      } else if (eu.ferramenta === 'texto') {
        BC.loja.fazer('quadroItem', eu.id, { tipo: 'texto', x: Math.round(p.x), y: Math.round(p.y), texto: 'Texto' });
        eu.ferramenta = 'caneta'; eu.marcarBarra(); return;
      }
      eu.palco.setPointerCapture(ev.pointerId);
      ev.preventDefault();
    });
    this.palco.addEventListener('pointermove', function (ev) {
      if (eu.atual) {
        var p = eu.xy(ev), u = eu.atual.pontos[eu.atual.pontos.length - 1];
        if (Math.abs(p.x - u[0]) + Math.abs(p.y - u[1]) < 1.5) return;
        eu.atual.pontos.push([Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10, Math.round((ev.pressure || 0.5) * 100) / 100]);
        eu.gAtual.innerHTML = traco(eu.atual);
        if (Date.now() - ultimoEnvio > 50) { ultimoEnvio = Date.now(); BC.canal.enviar({ tipo: 'traco-vivo', quadro: eu.id, traco: eu.atual }, true); }
      } else if (arrasto && arrasto.borracha) {
        eu.apagarEm(eu.xy(ev));
      } else if (arrasto) {
        eu.pan.x = ev.clientX - arrasto.x; eu.pan.y = ev.clientY - arrasto.y; eu.aplicar();
      }
    });
    function soltar() {
      if (eu.atual) {
        var t = eu.atual;
        eu.atual = null;
        eu.gAtual.innerHTML = '';
        BC.canal.enviar({ tipo: 'traco-fim', quadro: eu.id, tracoId: t.id }, true);
        if (t.pontos.length > 1) BC.loja.fazer('quadroItem', eu.id, { tipo: 'traco', pontos: t.pontos, cor: t.cor, largura: t.largura, ferramenta: t.ferramenta });
      }
      arrasto = null;
    }
    this.palco.addEventListener('pointerup', soltar);
    this.palco.addEventListener('pointercancel', soltar);
    this.palco.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      var r = eu.palco.getBoundingClientRect();
      eu.zoomEm(ev.deltaY < 0 ? 1.1 : 1 / 1.1, ev.clientX - r.left, ev.clientY - r.top);
    }, { passive: false });

    /* post-its e textos: editar e arrastar */
    this.notas.addEventListener('focusout', function (ev) {
      var n = ev.target.closest('[data-item]');
      if (!n || !ev.target.isContentEditable) return;
      var texto = ev.target.innerText.trim();
      BC.loja.fazer('quadroMudar', eu.id, n.dataset.item, { texto: texto || ' ' });
    });
    var nota = null;
    this.notas.addEventListener('pointerdown', function (ev) {
      var alca = ev.target.closest('.q-alca');
      if (!alca || !op.editavel) return;
      var n = alca.closest('[data-item]'), p = eu.xy(ev);
      nota = { el: n, dx: p.x - parseFloat(n.style.left), dy: p.y - parseFloat(n.style.top) };
      n.setPointerCapture(ev.pointerId);
      ev.stopPropagation();
    });
    this.notas.addEventListener('pointermove', function (ev) {
      if (!nota) return;
      var p = eu.xy(ev);
      nota.el.style.left = (p.x - nota.dx) + 'px';
      nota.el.style.top = (p.y - nota.dy) + 'px';
    });
    this.notas.addEventListener('pointerup', function () {
      if (!nota) return;
      BC.loja.fazer('quadroMudar', eu.id, nota.el.dataset.item, { x: Math.round(parseFloat(nota.el.style.left)), y: Math.round(parseFloat(nota.el.style.top)) });
      nota = null;
    });
  };

  Quadro.prototype.marcarBarra = function () {
    var eu = this;
    this.el.querySelectorAll('[data-q]').forEach(function (b) {
      var q = b.dataset.q;
      b.setAttribute('aria-pressed', q === 'ferr:' + eu.ferramenta || q === 'cor:' + eu.cor ? 'true' : 'false');
    });
    var vivo = this.el.querySelector('.q-vivo');
    if (vivo) {
      var e = BC.loja.estado, noAr = e.tvModo === 'quadro' && e.tvQuadro === this.id;
      vivo.textContent = noAr ? '● Ao vivo na TV · parar' : 'Ao vivo na TV';
      vivo.classList.toggle('primario', noAr);
    }
  };

  Quadro.prototype.alternarVivo = function () {
    var e = BC.loja.estado, noAr = e.tvModo === 'quadro' && e.tvQuadro === this.id;
    BC.loja.fazer('tvModo', noAr ? 'painel' : 'quadro', noAr ? null : this.id);
  };

  Quadro.prototype.xy = function (ev) {
    var r = this.palco.getBoundingClientRect();
    return { x: (ev.clientX - r.left - this.pan.x) / this.zoom, y: (ev.clientY - r.top - this.pan.y) / this.zoom };
  };

  Quadro.prototype.aplicar = function () {
    this.mundo.style.transform = 'translate(' + this.pan.x + 'px,' + this.pan.y + 'px) scale(' + this.zoom + ')';
  };

  Quadro.prototype.zoomEm = function (f, cx, cy) {
    var r = this.palco.getBoundingClientRect();
    cx = cx == null ? r.width / 2 : cx;
    cy = cy == null ? r.height / 2 : cy;
    var z = Math.max(0.25, Math.min(3, this.zoom * f));
    this.pan.x = cx - (cx - this.pan.x) * z / this.zoom;
    this.pan.y = cy - (cy - this.pan.y) * z / this.zoom;
    this.zoom = z;
    this.aplicar();
  };

  Quadro.prototype.itens = function () {
    var a = BC.loja.arquivo(this.id);
    if (!a) return [];
    try { return JSON.parse(a.conteudo).itens; } catch (e) { return []; }
  };

  Quadro.prototype.enquadrar = function () {
    var itens = this.itens(), x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    itens.forEach(function (i) {
      if (i.tipo === 'traco') i.pontos.forEach(function (p) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
      else { x0 = Math.min(x0, i.x); y0 = Math.min(y0, i.y); x1 = Math.max(x1, i.x + (i.w || 160)); y1 = Math.max(y1, i.y + (i.h || 40)); }
    });
    var r = this.palco.getBoundingClientRect();
    if (!isFinite(x0) || !r.width) { this.pan = { x: 40, y: 40 }; this.zoom = 1; this.aplicar(); return; }
    var m = 40, z = Math.min(2.2, Math.max(0.25, Math.min((r.width - 2 * m) / (x1 - x0 || 1), (r.height - 2 * m) / (y1 - y0 || 1))));
    this.zoom = z;
    this.pan = { x: (r.width - (x1 - x0) * z) / 2 - x0 * z, y: (r.height - (y1 - y0) * z) / 2 - y0 * z };
    this.aplicar();
  };

  Quadro.prototype.apagarEm = function (p) {
    var raio = 12 / this.zoom, alvo = null;
    this.itens().forEach(function (i) {
      if (i.tipo === 'traco' && i.pontos.some(function (q) { return Math.abs(q[0] - p.x) < raio && Math.abs(q[1] - p.y) < raio; })) alvo = i;
      if (i.tipo !== 'traco' && p.x >= i.x && p.x <= i.x + (i.w || 120) && p.y >= i.y && p.y <= i.y + (i.h || 40)) alvo = i;
    });
    if (alvo) BC.loja.fazer('quadroApagar', this.id, alvo.id);
  };

  Quadro.prototype.desfazer = function () {
    var eu = BC.loja.eu, meus = this.itens().filter(function (i) { return i.autor === eu; });
    if (meus.length) BC.loja.fazer('quadroApagar', this.id, meus[meus.length - 1].id);
  };

  Quadro.prototype.desenharVivos = function () {
    var eu = this;
    this.gVivos.innerHTML = Object.keys(this.vivos).map(function (k) { return traco(eu.vivos[k]); }).join('');
  };

  /* redesenha a partir do estado, sem atrapalhar o post-it que está sendo editado */
  Quadro.prototype.atualizar = function () {
    var itens = this.itens(), editavel = !!this.op.editavel, ativo = document.activeElement, notas = this.notas;
    this.gItens.innerHTML = itens.filter(function (i) { return i.tipo === 'traco'; }).map(traco).join('');
    var vistos = {};
    itens.filter(function (i) { return i.tipo !== 'traco'; }).forEach(function (i) {
      vistos[i.id] = true;
      var el = notas.querySelector('[data-item="' + i.id + '"]');
      if (!el) {
        el = document.createElement('div');
        el.dataset.item = i.id;
        el.innerHTML = '<div class="q-alca"></div><div class="q-nota-texto"' + (editavel ? ' contenteditable="true"' : '') + ' spellcheck="false"></div>';
        notas.appendChild(el);
      }
      el.className = i.tipo === 'postit' ? 'q-nota' : 'q-nota q-texto';
      el.style.left = i.x + 'px';
      el.style.top = i.y + 'px';
      if (i.tipo === 'postit') { el.style.width = i.w + 'px'; el.style.minHeight = i.h + 'px'; el.style.background = i.cor; }
      var t = el.querySelector('.q-nota-texto');
      if (!(ativo && el.contains(ativo)) && t.innerText !== i.texto) t.innerText = i.texto;
    });
    Array.prototype.slice.call(notas.children).forEach(function (el) { if (!vistos[el.dataset.item]) el.remove(); });
    this.marcarBarra();
    if (this.op.tv) this.enquadrar();
  };

  Quadro.prototype.destruir = function () { this.destruido = true; };

  BC.Quadro = Quadro;
})(window.BC);
