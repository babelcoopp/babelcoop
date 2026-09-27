/* babel-coop · protótipo · os efeitos de montar da Máquina (BC.maquinaEfeitos).
   Pedido do Theus: "pensa montar um motor de um carro, pensa lego, pensa minecraft… interativo, game, diversão, adrenalina"
   e "uns efeitos visuais pra mostrar que está sendo ativado".

   Quem chama é a tela (app/interface/coop-ui.js) depois que o banco local mudou de verdade:
     BC.maquinaEfeitos.tocar(pj, [{tipo:'nascer', peca}, {tipo:'fio', de, para}, {tipo:'cadeado', peca, abre?}, {tipo:'dados', peca, n}, {tipo:'erro', peca?, texto}])
     → Promise que resolve quando a fila acaba (ou logo, se não há 3D visível ou sem movimento), com o registro de cada item.
   Um item por vez no 3D da Máquina (quem desenha é visual3d.js: VistaCorpo.efeito). Chamadas seguidas entram na fila, não se atropelam.
   Cada chamada tem orçamento (~9 s): lista longa acelera cada efeito (até ~3x); com outra chamada esperando, acelera no máximo;
   passou do prazo, o resto aparece junto, sem efeito, e o registro diz. Assim a resposta ao agente e a próxima chamada não esperam.
   cadeado com abre:true = o aro abre e a alça sobe (a gaveta ficou mais aberta).

   Leis: só com evento real; cada efeito tem fim (≤ ~1 s) e nada fica vivo depois; sem 3D visível, marca o motivo e segue
   sem travar; sem movimento, só a cor; som só pelo BC.poderes (a mesma chave de som do organismo), se existir. */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var ESPERA = 3000, OLHAR = 100, FOLGA = 70, MAX_REG = 120;
  var ORCAMENTO = 9000, RITMO_MIN = 0.3; /* ms da chamada inteira no 3D; ritmo = fração da duração normal de cada efeito */
  var BASE = { nascer: 970, fio: 790, cadeado: 930, dados: 1000, erro: 830 }; /* ms de cada item no ritmo normal (efeito + folga) */
  var TIPOS = { nascer: 1, fio: 1, cadeado: 1, dados: 1, erro: 1 };
  var SOM = { nascer: 'poder', fio: 'impacto', cadeado: 'impacto', erro: 'estouro' }; /* dados: um 'impacto' por linha que entra */
  var reg = [], fila = Promise.resolve(), rodando = 0;

  function agora() { return window.performance && performance.now ? performance.now() : Date.now(); }
  function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function semMovimento() {
    var o = BC.organismo;
    if (o && o.versao && typeof o.semMovimento === 'function') { try { return !!o.semMovimento(); } catch (e) { /* segue */ } }
    return !!(BC.util && BC.util.movimentoReduzido && BC.util.movimentoReduzido());
  }
  function som(nome) { var p = BC.poderes; if (nome && p && typeof p.som === 'function') { try { p.som(nome); } catch (e) { /* sem som */ } } }
  function guardar(r) { reg.push(r); if (reg.length > MAX_REG) reg.splice(0, reg.length - MAX_REG); return r; }
  function texto(x) { return x == null || x === '' ? null : String(x); }
  function normalizar(lista) {
    return (Array.isArray(lista) ? lista : []).filter(function (x) { return x && typeof x === 'object'; }).map(function (x) {
      return { tipo: String(x.tipo || ''), peca: texto(x.peca), de: texto(x.de), para: texto(x.para), n: Math.round(Number(x.n) || 0), texto: x.texto == null ? '' : String(x.texto), abre: x.abre === true };
    });
  }

  /* ---------- onde a Máquina está: fora da tela, em 2D ou em 3D ---------- */
  function raizMaquina(pj) {
    var c = document.getElementById('e-conteudo'), r = c && c.querySelector('.mq2');
    if (!r || (pj && r.getAttribute('data-pj') !== pj)) return null;
    return r;
  }
  function naTela(pj) { var r = raizMaquina(pj); return !r ? 'fora' : r.querySelector('.mq-3d-lugar') ? '3d' : '2d'; }
  /* a vista 3D da Máquina deste projeto: montada, com tamanho na tela e com a aba visível */
  function vista(pj) {
    var M = BC.maquina, v = M && typeof M.vista3d === 'function' ? M.vista3d() : null;
    if (!v || !v.pronto || !v.gl || typeof v.efeito !== 'function' || !v.el || !v.el.isConnected || document.hidden) return null;
    var r = v.el.getBoundingClientRect();
    if (r.width < 40 || r.height < 40) return null;
    if (pj && typeof M.medidas3d === 'function') { var md = M.medidas3d(); if (md && md.pj != null && String(md.pj) !== pj) return null; }
    return v;
  }
  function temPecas(v, ef) {
    if (ef.tipo === 'erro') return true; /* sem a peça, o erro treme a cena inteira */
    if (ef.tipo === 'fio') return !!(ef.de && ef.para && v.itens[ef.de] && v.itens[ef.para]);
    return !!(ef.peca && v.itens[ef.peca]);
  }

  /* o roxo da marca no modo atual (--t2: #a376e9 no Tech, mais escuro no Vibe, para a faísca aparecer no papel) */
  function corMarca(el) { try { return getComputedStyle(el).getPropertyValue('--t2').trim() || '#a376e9'; } catch (e) { return '#a376e9'; } }

  /* no 2D: a peça que veio do banco cai no lugar e acende (classe com fim, maquina-2030.css) */
  function acender2d(pj, id) {
    var r = raizMaquina(pj);
    if (!r || !id || !/^[\w-]+$/.test(id)) return false;
    var el = r.querySelector('.mq-peca[data-no="' + id + '"]');
    if (!el) return false;
    el.classList.remove('mq-fx-nasce'); void el.offsetWidth; el.classList.add('mq-fx-nasce');
    setTimeout(function () { el.classList.remove('mq-fx-nasce'); }, 1000);
    if (BC.poderes && typeof BC.poderes.faisca === 'function') { try { BC.poderes.faisca(el, { cor: corMarca(el), n: 12 }); } catch (e) { /* segue */ } }
    return true;
  }

  /* espera (até ~3 s) a vista 3D existir, estar pronta e ter a peça em cena. Máquina em 2D ou 3D que não veio: desiste e
     marca para o resto da fila não esperar de novo (segue sem travar). */
  function procurar(ctx, ef) {
    if (ctx.semVista) return Promise.resolve({ v: null, motivo: ctx.motivo });
    var ate = Math.min(agora() + ESPERA, ctx.prazo), graca = ctx.primeiro ? agora() + 350 : 0; /* a tela pode estar trocando para o 3D agora */
    ctx.primeiro = false;
    return new Promise(function (ok) {
      (function olhar() {
        var tela = naTela(ctx.pj), v = vista(ctx.pj);
        if (v && temPecas(v, ef)) return ok({ v: v });
        if (!v && tela === '2d' && agora() >= graca) { ctx.semVista = true; ctx.modo = '2d'; ctx.motivo = 'o 3D não está na tela (a Máquina está em 2D)'; return ok({ v: null, motivo: ctx.motivo }); }
        if (agora() >= ate) {
          if (v) return ok({ v: null, motivo: agora() >= ctx.prazo ? 'a animação passou do prazo: a peça apareceu junto, sem efeito' : 'a peça não apareceu na cena 3D em 3 s' });
          ctx.semVista = true; ctx.motivo = tela === 'fora' ? 'a Máquina deste projeto não está na tela' : 'o 3D não ficou pronto em 3 s';
          return ok({ v: null, motivo: ctx.motivo });
        }
        setTimeout(olhar, OLHAR);
      })();
    });
  }

  /* as peças e os fios que ainda vão nascer ficam escondidos até a vez deles (uma vez por vista) */
  function reservar(ctx, v) {
    if (ctx.reservou === v || typeof v.reservar !== 'function') return;
    ctx.reservou = v;
    var resto = ctx.itens.slice(ctx.i - 1), lista = [];
    resto.forEach(function (x) {
      if (x.tipo === 'nascer' && x.peca) lista.push(x.peca);
      else if (x.tipo === 'fio' && x.de && x.para) lista.push([x.de, x.para]);
    });
    if (lista.length) v.reservar(lista, Math.max(800, ctx.prazo - agora() + 1500)); /* até o prazo da chamada: nada reaparece parado no meio */
  }

  function copia(ef) { return { tipo: ef.tipo, peca: ef.peca, de: ef.de, para: ef.para, n: ef.n, texto: ef.texto, abre: ef.abre }; }
  /* o ritmo agora: o da chamada, ou o mais rápido se outra chamada espera na fila */
  function ritmoDe(ctx) { return rodando > 1 ? RITMO_MIN : ctx.ritmo; }

  function tocar3d(v, ef, ritmo) {
    return new Promise(function (ok) {
      var feito = false, guarda = null;
      function fim(info) { if (feito) return; feito = true; clearTimeout(guarda); ok(info); }
      var c = copia(ef);
      if (ritmo < 1) c.ritmo = ritmo;
      if (ef.tipo === 'dados') c.aoImpacto = function () { som('impacto'); };
      guarda = setTimeout(function () { fim({ tocou: true, motivo: 'o 3D demorou a responder: a fila seguiu' }); }, 4000);
      var comecou = false;
      try { comecou = v.efeito(c, function (info) { fim(info && typeof info === 'object' ? info : { tocou: true, motivo: '' }); }); }
      catch (e) { fim({ tocou: false, motivo: 'erro no 3D: ' + (e && e.message) }); }
      if (comecou && ef.tipo !== 'dados') som(SOM[ef.tipo]);
    }).then(function (info) { return esperar(Math.round(FOLGA * Math.min(1, ritmo))).then(function () { return info; }); });
  }

  /* sem movimento: nada anda. Só a cor, na peça que já está na tela; não espera o 3D nem a fila de ~1 s por item */
  function parado(ctx, ef, fechar) {
    if (ef.tipo === 'nascer' && naTela(ctx.pj) === '2d' && acender2d(ctx.pj, ef.peca)) return esperar(120).then(function () { return fechar(true, 'sem movimento: só a cor, no 2D', '2d'); });
    var v = vista(ctx.pj);
    if (!v || !temPecas(v, ef)) return fechar(false, 'sem movimento e sem a peça no 3D');
    var tocou = false;
    try { tocou = v.efeito(copia(ef), function () {}); } catch (e) { tocou = false; }
    return esperar(120).then(function () { return fechar(tocou, tocou ? 'sem movimento: só a cor' : 'o 3D não tocou', '3d'); });
  }

  function um(ctx, ef) {
    var t0 = agora(), r = { tipo: ef.tipo, peca: ef.tipo === 'fio' ? (ef.de || '?') + '>' + (ef.para || '?') : ef.peca, tocou: false, motivo: '', ms: 0 };
    if (ef.abre) r.abre = true; /* o cadeado que abriu (a gaveta ficou mais aberta) */
    function fechar(tocou, motivo, onde) { r.tocou = !!tocou; r.motivo = motivo || ''; if (onde) r.onde = onde; r.ms = Math.round(agora() - t0); return guardar(r); }
    if (!TIPOS[ef.tipo]) return Promise.resolve(fechar(false, 'tipo desconhecido'));
    if (ctx.parado) return Promise.resolve(parado(ctx, ef, fechar));
    if (agora() >= ctx.prazo) return Promise.resolve(fechar(false, 'a animação passou do prazo: a peça apareceu junto, sem efeito'));
    return procurar(ctx, ef).then(function (achou) {
      var v = achou.v;
      if (!v) {
        if (ctx.modo === '2d' && ef.tipo === 'nascer' && acender2d(ctx.pj, ef.peca)) {
          som(SOM.nascer);
          return esperar(220).then(function () { return fechar(true, 'o 3D não está na tela: acendeu no 2D', '2d'); });
        }
        return fechar(false, achou.motivo || 'o 3D não está visível');
      }
      reservar(ctx, v);
      var ritmo = ritmoDe(ctx);
      if (ritmo < 1) r.ritmo = Math.round(ritmo * 100) / 100;
      return tocar3d(v, ef, ritmo).then(function (info) { return fechar(info.tocou, info.motivo, '3d'); });
    });
  }

  function rodar(pj, itens) {
    var ctx = { pj: texto(pj), parado: semMovimento(), semVista: false, primeiro: true, modo: null, motivo: '', reservou: null, itens: itens, i: 0 }, feitos = [];
    /* o orçamento desta chamada: lista longa acelera; o prazo conta a partir de quando ela sai da fila */
    var soma = itens.reduce(function (t, x) { return t + (BASE[x.tipo] || 800); }, 0);
    ctx.ritmo = Math.max(RITMO_MIN, Math.min(1, ORCAMENTO / Math.max(1, soma)));
    ctx.prazo = agora() + ORCAMENTO + ESPERA;
    function proximo() {
      if (ctx.i >= itens.length) {
        if (ctx.reservou && ctx.reservou.gl) ctx.reservou.liberar(); /* o que sobrou escondido (item pulado) aparece */
        return feitos;
      }
      var ef = itens[ctx.i++];
      return um(ctx, ef).then(function (r) { feitos.push(r); return proximo(); });
    }
    return Promise.resolve().then(proximo);
  }

  /* ---------- API ---------- */
  function tocar(pj, lista) {
    var itens = normalizar(lista);
    rodando++;
    var p = fila.then(function () { return rodar(pj, itens); });
    fila = p.catch(function () { return null; });
    return p.then(function (feitos) { rodando--; return feitos; }, function (e) { rodando--; console.warn('[efeitos]', e); return []; });
  }

  BC.maquinaEfeitos = {
    tocar: tocar,
    /* [{tipo, peca, tocou, motivo, ms, onde?, abre?, ritmo?}] dos últimos itens (o mais novo no fim) */
    registro: function () { return reg.map(function (r) { return Object.assign({}, r); }); },
    ocupado: function () { return rodando > 0; }
  };
})(window.BC);
