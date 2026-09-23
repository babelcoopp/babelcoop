/* Babel Coop — protótipo · iPad: o "Freeform da Babel". Desenhar com o dedo ou a caneta, colar post-its e mandar ao vivo para a TV */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc;
  function L() { return BC.loja; }
  function $(id) { return document.getElementById(id); }

  var I = { quadro: null, atual: null };

  function quadros() { return L().estado.arquivos.filter(function (a) { return a.tipo === 'quadro'; }); }
  function nome(a) { return a.caminho.split('/').pop().replace(/\.quadro$/, ''); }

  function renderTopo() {
    var e = L().estado, noAr = e.tvModo === 'quadro' && e.tvQuadro === I.atual, p = L().pessoa(L().eu);
    $('ip-topo').innerHTML = '<div class="ip-marca"><img src="babel-logo.png" alt=""><b>Babel Quadro</b><span class="rotulo">iPad</span></div>' +
      '<div class="ip-quadros" role="tablist" aria-label="Quadros da equipe">' + quadros().map(function (a) {
        return '<button type="button" role="tab" class="ip-q" aria-selected="' + (a.id === I.atual) + '" data-ip="abrir:' + esc(a.id) + '">' + esc(nome(a)) + '</button>';
      }).join('') + '<button type="button" class="ip-q novo" data-ip="novo">＋ Novo quadro</button></div>' +
      '<div class="ip-dir"><button type="button" class="botao' + (noAr ? ' primario' : '') + '" data-ip="tv">' + (noAr ? '● Ao vivo na TV · parar' : '▣ Mandar ao vivo para a TV') + '</button>' +
      '<span class="ip-quem" title="Quem está desenhando">' + U.avatar(p, 30, true) + '</span>' +
      '<button type="button" class="botao discreto" data-ip="estacao">Voltar à Estação</button></div>';
  }

  function abrir(id) {
    var a = L().arquivo(id);
    if (!a) return;
    if (I.quadro) I.quadro.destruir();
    I.atual = a.id;
    U.guardar('babel-coop:ipad-quadro', a.id);
    $('ip-palco').innerHTML = '<div class="ip-q-el"></div>';
    I.quadro = new BC.Quadro($('ip-palco').firstChild, a.id, { editavel: true, ipad: true });
    renderTopo();
  }

  var IP = {
    render: function () {
      if (!L().arquivo(I.atual)) { var q = quadros()[0]; if (q) abrir(q.id); return; }
      if (I.quadro) I.quadro.atualizar();
      renderTopo();
    },
    iniciar: function () {
      var raiz = $('vista-ipad');
      raiz.hidden = false;
      var salvo = U.ler('babel-coop:ipad-quadro'), padrao = L().arquivo('equipe/Quadros/Brainstorm campanha.quadro');
      abrir(salvo && L().arquivo(salvo) ? salvo : padrao ? padrao.id : (quadros()[0] || {}).id);
      $('ip-topo').addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-ip]');
        if (!b) return;
        var q = b.dataset.ip, e = L().estado;
        if (q.indexOf('abrir:') === 0) abrir(q.slice(6));
        if (q === 'novo') {
          var agora = new Date();
          L().fazer('criarArquivo', 'equipe/Quadros/Quadro do iPad ' + U.dataArquivo(agora) + ' ' + U.pad(agora.getHours()) + 'h' + U.pad(agora.getMinutes()) + '.quadro', 'quadro', JSON.stringify({ itens: [] }));
          abrir(e.arquivos[e.arquivos.length - 1].id);
        }
        if (q === 'tv') {
          var noAr = e.tvModo === 'quadro' && e.tvQuadro === I.atual;
          L().fazer('tvModo', noAr ? 'painel' : 'quadro', noAr ? null : I.atual);
        }
        if (q === 'estacao') BC.app.trocarVista('estacao');
      });
      L().aoMudar(function () { if (!$('vista-ipad').hidden) IP.render(); });
    }
  };

  BC.ipad = IP;
})(window.BC);
