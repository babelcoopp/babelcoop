/* Babel Coop — protótipo · o cronômetro persegue a pessoa e volta sozinho da pausa
   1. "⧉ destacar": o cronômetro vai para uma janelinha que fica por cima de tudo, mesmo com o app minimizado ou em outra mesa
      (Document Picture-in-Picture no Chrome; janela sempre-no-topo no Electron; janela popup como último recurso).
   2. Enquanto a demanda roda, o app lembra em que peças a pessoa mexeu (arquivos, terminal, projeto). Se ela pausar, sair e ao voltar
      mexer em qualquer uma dessas peças (ou numa citada na demanda), o cronômetro sai da pausa sozinho e avisa. */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc, A = BC.acoes, LA = BC.loja.A;
  var GRACA = 45 * 1000; /* logo depois de pausar, 45 s sem voltar sozinho (a pessoa pode estar só fechando o que fazia) */
  function L() { return BC.loja; }
  function D() { return BC.demandasUI; }
  function ui() { return BC.estacao.ui; }

  /* ---------- as peças do trabalho ---------- */

  function chave(d) { return 'babel-coop:pecas:' + d.id; }
  function pecas(d) { try { return JSON.parse(U.lerLocal(chave(d)) || '{}'); } catch (e) { return {}; } }
  function lembrar(d, peca) { var p = pecas(d); p[peca.chave] = { nome: peca.nome, ts: Date.now() }; U.guardarLocal(chave(d), JSON.stringify(p)); }

  function relacionada(d, peca) {
    if (peca.tipo === 'demanda') return peca.id === d.id;
    if (pecas(d)[peca.chave]) return true; /* mexeu nela enquanto a demanda rodava */
    var texto = U.normalizar((d.titulo || '') + ' ' + (d.descricao || ''));
    if (peca.tipo === 'arquivo') {
      var nome = U.normalizar(peca.nome || '');
      if (nome && texto.indexOf(nome) !== -1) return true;
      if (d.projeto) { var pj = (L().estado.projetos || []).filter(function (p) { return p.id === d.projeto; })[0]; if (pj && U.normalizar(peca.caminho || '').indexOf(U.normalizar('Projetos/' + pj.nome)) !== -1) return true; }
    }
    if (peca.tipo === 'projeto') return !!d.projeto && d.projeto === peca.id;
    return false;
  }

  LA.retomarSozinho = function (quem, id, peca) {
    var r = LA.retomar(quem, id);
    if (!r) return r;
    var d = L().demanda(id);
    d.historico.push({ ts: Date.now(), quem: quem, acao: 'o cronômetro voltou sozinho', nota: 'mexeu em ' + peca });
    return r;
  };

  BC.cronometro = {
    /* chamado quando a pessoa mexe numa peça: arquivo, terminal, demanda, projeto */
    tocou: function (peca) {
      var d = D().doCronometro();
      if (!d || d.para !== L().eu) return;
      if (d.estado === 'andamento') { lembrar(d, peca); return; }
      if (d.estado !== 'pausada') return;
      var p = L().ultimaPausa(d);
      if (p && p.inicio && Date.now() - p.inicio < GRACA) return;
      if (!relacionada(d, peca)) return;
      if (L().fazer('retomarSozinho', d.id, peca.nome)) {
        ui().cronMin = false;
        BC.estacao.aviso('◷ "' + d.titulo.slice(0, 34) + '" voltou a contar sozinho: você mexeu em ' + peca.nome + '. Se não era isso, pause de novo.');
      }
    },

    /* ---------- a janelinha que persegue a pessoa ---------- */
    pip: null,
    destacar: function () {
      var eu = this;
      if (eu.pip && !eu.pip.closed) { try { eu.pip.focus(); } catch (e) { /* PiP não foca */ } return; }
      function popup() { eu.pip = window.open(location.pathname + location.search + '#cronometro', 'babel-cron', 'popup=yes,width=300,height=170,top=60,left=60'); }
      if (window.coopElectron) { popup(); return; } /* no Electron, main.js abre uma janela sempre-no-topo e em todas as mesas */
      if (window.documentPictureInPicture && window.documentPictureInPicture.requestWindow) {
        window.documentPictureInPicture.requestWindow({ width: 300, height: 150 }).then(function (w) { eu.pip = w; eu.montarMini(w.document, true); w.addEventListener('pagehide', function () { eu.pip = null; }); }, popup);
      } else popup();
    },

    /* o cronômetro pequeno: relógio, estado e Pausar/Continuar; usado na janelinha e na aba #cronometro */
    montarMini: function (doc, copiarEstilos) {
      if (copiarEstilos) document.querySelectorAll('link[rel="stylesheet"], style').forEach(function (n) { doc.head.appendChild(n.cloneNode(true)); });
      doc.documentElement.dataset.vista = 'cronometro';
      doc.body.innerHTML = '<div class="cron-mini" id="cron-mini"></div>';
      var caixa = doc.getElementById('cron-mini');
      function desenhar() {
        var d = D().doCronometro();
        if (!d) { caixa.innerHTML = '<p class="cron-mini-vazio">Nenhuma demanda com cronômetro.</p>'; return; }
        var t = L().tempo(d), rodando = d.estado === 'andamento', pronta = d.estado === 'pronta';
        caixa.innerHTML = '<p class="cron-mini-titulo">' + esc(d.titulo) + '</p>' +
          '<span class="cron-relogio">' + U.relogio(t.trabalho) + '</span>' +
          '<span class="cron-estado ' + (rodando ? 'rodando' : pronta ? 'aguardando' : 'pausado') + '"><span class="luz"></span>' + (rodando ? 'Rodando' : pronta ? 'Aguardando OK de ' + esc(L().nome(d.de)) : 'Pausado · ' + esc(t.pausaAberta ? t.pausaAberta.motivo : 'pausa')) + '</span>' +
          (pronta ? '' : '<div class="cron-mini-acoes">' + (rodando ? '<button type="button" class="botao" data-mini="pausar">Pausar</button>' : '<button type="button" class="botao primario" data-mini="retomar">Continuar</button>') + '</div>');
      }
      caixa.addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-mini]'), d = D().doCronometro();
        if (!b || !d) return;
        if (b.dataset.mini === 'pausar') L().fazer('pausar', d.id, 'pausa');
        if (b.dataset.mini === 'retomar') L().fazer('retomar', d.id);
        desenhar();
      });
      desenhar();
      L().aoMudar(desenhar);
      var relogio = setInterval(function () { if (!doc.defaultView || doc.defaultView.closed) { clearInterval(relogio); return; } var d = D().doCronometro(), el = caixa.querySelector('.cron-relogio'); if (d && el) el.textContent = U.relogio(L().tempo(d).trabalho); }, 1000);
    }
  };

  A['cron-destacar'] = function () { BC.cronometro.destacar(); };

  /* o botão "destacar" no cronômetro inteiro */
  var cronometroOriginal = D().cronometro;
  D().cronometro = function () {
    var h = cronometroOriginal.apply(this, arguments);
    if (!h || ui().cronMin) return h;
    return h.replace('</div>', '<button class="cron-min" type="button" data-acao="cron-destacar" title="Abre o cronômetro numa janelinha que fica por cima de tudo, mesmo com o app minimizado ou em outra mesa">⧉ destacar</button></div>');
  };

  /* ---------- onde a pessoa mexe no trabalho ---------- */

  function envolver(obj, nome, depois) {
    var original = obj && obj[nome];
    if (!original) return;
    obj[nome] = function () { var r = original.apply(this, arguments); try { depois.apply(this, arguments); } catch (e) { console.warn('[cronometro]', e); } return r; };
  }
  function pecaArquivo(a) { return { tipo: 'arquivo', chave: 'arquivo:' + a.id, caminho: a.caminho, nome: a.caminho.split('/').pop() }; }
  function arquivoDaAba() { var t = BC.estacao.abaAtual(); return t && t.tipo === 'arquivo' ? L().arquivo(t.ref) : null; }

  envolver(BC.explorador, 'abrirArquivo', function (id) { var a = L().arquivo(id); if (a) BC.cronometro.tocou(pecaArquivo(a)); });
  envolver(BC.editor, 'salvar', function () { var a = arquivoDaAba(); if (a) BC.cronometro.tocou(pecaArquivo(a)); });
  envolver(A, 'ed-modo', function (el) { var a = arquivoDaAba(); if (a && el.dataset.modo === 'editar') BC.cronometro.tocou(pecaArquivo(a)); });
  envolver(A, 'ed-visual', function () { var a = arquivoDaAba(); if (a) BC.cronometro.tocou(pecaArquivo(a)); });
  envolver(A, 'ed-visual-salvar', function () { var a = arquivoDaAba(); if (a) BC.cronometro.tocou(pecaArquivo(a)); });
  envolver(A, 'abrir-demanda', function (el) { BC.cronometro.tocou({ tipo: 'demanda', id: el.dataset.id, chave: 'demanda:' + el.dataset.id, nome: 'a própria demanda' }); });
  envolver(BC.estacao, 'abrirProjeto', function (id) { var pj = (L().estado.projetos || []).filter(function (p) { return p.id === id; })[0]; BC.cronometro.tocou({ tipo: 'projeto', id: id, chave: 'projeto:' + id, nome: 'o projeto ' + (pj ? pj.nome : id) }); });
  if (BC.Terminal) envolver(BC.Terminal.prototype, 'ia', function () { var ag = this.agente ? this.agente() : null; if (ag) BC.cronometro.tocou({ tipo: 'terminal', chave: 'terminal:' + ag.id, nome: 'o terminal ' + ag.nome }); });

  /* a aba #cronometro (popup ou janela do Electron) mostra só o cronômetro pequeno */
  if ((location.hash || '') === '#cronometro') {
    setTimeout(function () { BC.cronometro.montarMini(document, false); }, 350);
  }
})(window.BC);
