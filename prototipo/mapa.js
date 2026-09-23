/* Babel Coop — protótipo · Mapa da equipe (grafo vivo, inspirado no grafo v5) */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var U = BC.util;

  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function Mapa(canvas, opcoes) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.op = { interativo: true, rotulos: true };
    if (opcoes) Object.keys(opcoes).forEach(function (k) { this.op[k] = opcoes[k]; }, this);
    this.nos = [];
    this.arestas = [];
    this.porId = {};
    this.pulsos = [];
    this.foco = null;
    this.selecionado = null;
    this.arrastando = null;
    this.alfa = 1;
    this.vivo = true;
    this.aoSelecionar = null;
    this.redimensionar();
    var eu = this;
    if (window.ResizeObserver) {
      this.obs = new ResizeObserver(function () { eu.redimensionar(); });
      this.obs.observe(canvas);
    } else {
      window.addEventListener('resize', function () { eu.redimensionar(); });
    }
    if (this.op.interativo) this.ligarMouse();
    this.laco = this.laco.bind(this);
    requestAnimationFrame(this.laco);
  }

  Mapa.prototype.redimensionar = function () {
    var r = this.cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, r.width), h = Math.max(1, r.height);
    if (this.w && this.nos.length) {
      var sx = w / this.w, sy = h / this.h;
      this.nos.forEach(function (n) { n.x *= sx; n.y *= sy; });
    }
    this.w = w;
    this.h = h;
    this.cv.width = Math.round(w * dpr);
    this.cv.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  Mapa.prototype.atualizar = function (estado) {
    var L = BC.loja, antigos = this.porId, nos = [], lig = [], porId = {}, novo = !this.nos.length;

    function no(id, tipo, rotulo, cor, extra) {
      var velho = antigos[id];
      var n = { id: id, tipo: tipo, rotulo: rotulo, cor: cor, x: velho ? velho.x : null, y: velho ? velho.y : null, vx: 0, vy: 0, grau: 0 };
      if (extra) Object.keys(extra).forEach(function (k) { n[k] = extra[k]; });
      nos.push(n);
      porId[id] = n;
    }

    var areas = {};
    estado.pessoas.forEach(function (p) { areas[p.area] = true; });
    Object.keys(areas).forEach(function (a) { no('r:' + a, 'area', estado.areas[a], '#7a64a8'); });

    estado.pessoas.forEach(function (p) {
      no('p:' + p.id, 'pessoa', p.nome, p.cor, { offline: p.status === 'offline' });
      lig.push(['p:' + p.id, 'r:' + p.area, 'area']);
    });

    estado.tarefas.forEach(function (t) {
      var total = L.fluxo(t.fluxo).etapas.length;
      if (t.atual >= total) return;
      no('t:' + t.id, 'tarefa', t.titulo, '#c7a2ff', { pct: L.pct(t) / 100 });
      lig.push(['t:' + t.id, 'p:' + t.donos[t.atual], 'resp']);
      for (var i = 0; i < t.atual; i++) lig.push(['t:' + t.id, 'p:' + t.donos[i], 'passou']);
    });

    estado.demandas.forEach(function (d) {
      if (d.estado === 'concluida' || d.estado === 'cancelada') return;
      no('d:' + d.id, 'demanda', d.titulo, '#88d7ea', { rodando: d.estado === 'andamento' });
      lig.push(['d:' + d.id, 'p:' + d.para, 'resp']);
      lig.push(['d:' + d.id, 'p:' + d.de, 'pediu']);
    });

    var porDono = {};
    estado.arquivos.forEach(function (a) { if (a.dono !== 'equipe') (porDono[a.dono] = porDono[a.dono] || []).push(a); });
    Object.keys(porDono).forEach(function (dono) {
      var p = L.pessoa(dono);
      porDono[dono].slice(0, 2).forEach(function (a) {
        no('a:' + a.id, 'arquivo', a.caminho.split('/').pop(), '#8fa1c4', { offline: !!p && p.status === 'offline' });
        lig.push(['a:' + a.id, 'p:' + dono, 'arquivo']);
      });
    });

    var vistas = {};
    this.arestas = lig.filter(function (l) {
      var k = l[0] + '|' + l[1];
      if (vistas[k] || !porId[l[0]] || !porId[l[1]]) return false;
      vistas[k] = true;
      return true;
    }).map(function (l) { return { a: porId[l[0]], b: porId[l[1]], tipo: l[2] }; });
    this.arestas.forEach(function (e) { e.a.grau++; e.b.grau++; });

    var cx = this.w / 2, cy = this.h / 2;
    nos.forEach(function (n, i) {
      if (n.x === null) {
        var ang = i * 2.39996, r = 20 + 14 * Math.sqrt(i);
        n.x = cx + Math.cos(ang) * r;
        n.y = cy + Math.sin(ang) * r;
      }
    });
    this.nos = nos;
    this.porId = porId;
    if (this.selecionado) this.selecionado = porId[this.selecionado.id] || null;
    for (var k = 0; k < (novo ? 300 : 40); k++) this.passo(1);
    this.alfa = 0.25;
  };

  Mapa.prototype.passo = function (alfa) {
    var nos = this.nos, n = nos.length, cx = this.w / 2, cy = this.h / 2;
    var esc = Math.max(0.6, Math.min(this.w, this.h) / 620);
    var repulsao = 1100 * esc * esc;
    for (var i = 0; i < n; i++) {
      var a = nos[i];
      for (var j = i + 1; j < n; j++) {
        var b = nos[j], dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy + 0.01;
        if (d2 > 160000) continue;
        var d = Math.sqrt(d2), f = repulsao / d2 * alfa;
        a.vx -= dx / d * f; a.vy -= dy / d * f;
        b.vx += dx / d * f; b.vy += dy / d * f;
      }
    }
    this.arestas.forEach(function (e) {
      var alvo = (e.tipo === 'area' ? 74 : e.tipo === 'arquivo' ? 30 : 52) * esc;
      var dx = e.b.x - e.a.x, dy = e.b.y - e.a.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      var k = (d - alvo) / d * 0.045 * alfa;
      e.a.vx += dx * k; e.a.vy += dy * k;
      e.b.vx -= dx * k; e.b.vy -= dy * k;
    });
    var arr = this.arrastando, w = this.w, h = this.h;
    nos.forEach(function (p) {
      if (p === arr) { p.vx = 0; p.vy = 0; return; }
      p.vx += (cx - p.x) * 0.005 * alfa;
      p.vy += (cy - p.y) * 0.005 * alfa;
      p.vx *= 0.8; p.vy *= 0.8;
      p.x = Math.max(24, Math.min(w - 24, p.x + p.vx));
      p.y = Math.max(24, Math.min(h - 24, p.y + p.vy));
    });
  };

  Mapa.prototype.raio = function (n) {
    var base = n.tipo === 'pessoa' ? 7 : n.tipo === 'area' ? 5 : n.tipo === 'tarefa' ? 5.5 : n.tipo === 'demanda' ? 4.5 : 3;
    return base + Math.sqrt(n.grau) * (n.tipo === 'pessoa' ? 1.6 : 0.8);
  };

  Mapa.prototype.vizinhos = function (n) {
    var v = {};
    v[n.id] = true;
    this.arestas.forEach(function (e) {
      if (e.a === n) v[e.b.id] = true;
      if (e.b === n) v[e.a.id] = true;
    });
    return v;
  };

  /* pulso de luz de uma pessoa para outra (passagem de tarefa) */
  Mapa.prototype.pulso = function (deId, paraId) {
    var a = this.porId['p:' + deId], b = this.porId['p:' + paraId];
    if (a && b) this.pulsos.push({ a: a, b: b, t0: performance.now(), dur: 1600 });
  };

  Mapa.prototype.desenhar = function (t) {
    var ctx = this.ctx, eu = this, reduz = U.movimentoReduzido();
    var respira = reduz ? 1 : 1 + Math.sin(t / 8000 * Math.PI * 2) * 0.02;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.save();
    ctx.translate(this.w / 2, this.h / 2);
    ctx.scale(respira, respira);
    ctx.translate(-this.w / 2, -this.h / 2);

    var foco = this.foco || this.selecionado, viz = foco ? this.vizinhos(foco) : null;

    this.arestas.forEach(function (e) {
      var aceso = foco && (e.a === foco || e.b === foco);
      var a = aceso ? 0.8 : viz ? 0.04 : (e.tipo === 'resp' ? 0.34 : 0.16);
      ctx.strokeStyle = aceso ? 'rgba(214,190,255,' + a + ')' : 'rgba(160,64,253,' + a + ')';
      ctx.lineWidth = e.tipo === 'resp' ? 1.3 : 0.8;
      ctx.setLineDash(e.tipo === 'passou' || e.tipo === 'pediu' ? [2, 4] : []);
      ctx.beginPath();
      ctx.moveTo(e.a.x, e.a.y);
      ctx.lineTo(e.b.x, e.b.y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    var agora = performance.now();
    this.pulsos = this.pulsos.filter(function (p) { return agora - p.t0 < p.dur; });
    this.pulsos.forEach(function (p) {
      var k = (agora - p.t0) / p.dur, x = p.a.x + (p.b.x - p.a.x) * k, y = p.a.y + (p.b.y - p.a.y) * k;
      var tx = p.a.x + (p.b.x - p.a.x) * Math.max(0, k - 0.18), ty = p.a.y + (p.b.y - p.a.y) * Math.max(0, k - 0.18);
      var g = ctx.createLinearGradient(tx, ty, x, y);
      g.addColorStop(0, 'rgba(41,204,236,0)');
      g.addColorStop(1, 'rgba(242,234,255,0.95)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = '#f2eaff';
      ctx.shadowColor = '#29ccec';
      ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;
    });

    this.nos.forEach(function (n) {
      var r = eu.raio(n);
      ctx.globalAlpha = viz && !viz[n.id] ? 0.14 : 1;
      var g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3.2);
      g.addColorStop(0, rgba(n.cor, 0.34));
      g.addColorStop(1, rgba(n.cor, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(n.x, n.y, r * 3.2, 0, 7); ctx.fill();

      ctx.lineWidth = 1.4;
      ctx.strokeStyle = n.cor;
      if (n.tipo === 'arquivo') {
        ctx.setLineDash(n.offline ? [2, 2] : []);
        ctx.fillStyle = n.offline ? 'rgba(0,0,0,0)' : rgba(n.cor, 0.8);
        ctx.fillRect(n.x - r, n.y - r, r * 2, r * 2);
        ctx.strokeRect(n.x - r, n.y - r, r * 2, r * 2);
        ctx.setLineDash([]);
      } else if (n.tipo === 'tarefa') {
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.stroke();
        ctx.save();
        ctx.beginPath(); ctx.arc(n.x, n.y, r - 1.2, 0, 7); ctx.clip();
        ctx.fillStyle = rgba(n.cor, 0.9);
        ctx.fillRect(n.x - r, n.y + r - 2 * r * n.pct, r * 2, 2 * r * n.pct);
        ctx.restore();
      } else if (n.tipo === 'demanda') {
        var pulsa = n.rodando && !reduz ? 1 + Math.sin(t / 300) * 0.25 : 1;
        ctx.fillStyle = rgba(n.cor, 0.85);
        ctx.beginPath();
        ctx.moveTo(n.x, n.y - r * pulsa); ctx.lineTo(n.x + r * pulsa, n.y);
        ctx.lineTo(n.x, n.y + r * pulsa); ctx.lineTo(n.x - r * pulsa, n.y);
        ctx.closePath(); ctx.fill();
      } else if (n.tipo === 'area') {
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.stroke();
      } else {
        ctx.setLineDash(n.offline ? [3, 3] : []);
        ctx.fillStyle = n.offline ? 'rgba(0,0,0,0)' : rgba(n.cor, 0.9);
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.fill(); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#f7f3ff';
        ctx.beginPath(); ctx.arc(n.x, n.y, r * 0.32, 0, 7); ctx.fill();
      }

      if (n === eu.selecionado) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(n.x, n.y, r + 5, 0, 7); ctx.stroke();
      }

      var mostra = eu.op.rotulos && (n.tipo === 'pessoa' || n.tipo === 'area' || (viz && viz[n.id]));
      if (mostra) {
        ctx.font = (n.tipo === 'pessoa' ? '600 12px ' : '11px ') + '"JetBrains Mono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = n.tipo === 'area' ? 'rgba(199,162,255,0.6)' : 'rgba(230,220,255,0.9)';
        var rot = n.rotulo.length > 28 ? n.rotulo.slice(0, 27) + '…' : n.rotulo;
        ctx.fillText(rot.toLowerCase(), n.x, n.y + r + 14);
      }
      ctx.globalAlpha = 1;
    });
    ctx.restore();
  };

  Mapa.prototype.noEm = function (x, y) {
    var melhor = null, dmin = Infinity, eu = this;
    this.nos.forEach(function (n) {
      var d = Math.hypot(n.x - x, n.y - y);
      if (d < eu.raio(n) + 7 && d < dmin) { dmin = d; melhor = n; }
    });
    return melhor;
  };

  Mapa.prototype.ligarMouse = function () {
    var eu = this, cv = this.cv, moveu = false;
    function pos(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    cv.addEventListener('mousemove', function (e) {
      var p = pos(e);
      if (eu.arrastando) { eu.arrastando.x = p[0]; eu.arrastando.y = p[1]; moveu = true; return; }
      eu.foco = eu.noEm(p[0], p[1]);
      cv.style.cursor = eu.foco ? 'pointer' : 'default';
    });
    cv.addEventListener('mouseleave', function () { eu.foco = null; eu.arrastando = null; });
    cv.addEventListener('mousedown', function (e) { var p = pos(e); eu.arrastando = eu.noEm(p[0], p[1]); moveu = false; });
    window.addEventListener('mouseup', function () {
      if (eu.arrastando && !moveu) {
        eu.selecionado = eu.arrastando;
        if (eu.aoSelecionar) eu.aoSelecionar(eu.selecionado);
      }
      if (eu.arrastando && moveu) eu.alfa = 0.3;
      eu.arrastando = null;
    });
    cv.addEventListener('click', function (e) {
      var p = pos(e);
      if (!eu.noEm(p[0], p[1])) { eu.selecionado = null; if (eu.aoSelecionar) eu.aoSelecionar(null); }
    });
  };

  Mapa.prototype.laco = function (t) {
    if (!this.vivo) return;
    if (!document.hidden && this.cv.isConnected && this.cv.offsetParent !== null) {
      if (this.alfa > 0.02) { this.passo(this.alfa); this.alfa *= 0.985; }
      this.desenhar(t);
    }
    requestAnimationFrame(this.laco);
  };

  Mapa.prototype.destruir = function () {
    this.vivo = false;
    if (this.obs) this.obs.disconnect();
  };

  BC.Mapa = Mapa;
})(window.BC);
