/* Babel Coop — protótipo · início: esta aba mostra a Estação, a TV ou o iPad (troca sem recarregar a página) */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var U = BC.util, VISTAS = ['estacao', 'tv', 'ipad'], iniciadas = {};

  function vistaEscolhida() {
    var h = (location.hash || '').replace('#', '');
    if (VISTAS.indexOf(h) !== -1) return h;
    var salva = U.ler('babel-coop:vista');
    return VISTAS.indexOf(salva) !== -1 ? salva : 'estacao';
  }
  function modulo(v) { return v === 'tv' ? BC.tv : v === 'ipad' ? BC.ipad : BC.estacao; }

  function mostrar(v) {
    VISTAS.forEach(function (x) { var el = document.getElementById('vista-' + x); if (el) el.hidden = x !== v; });
    document.documentElement.dataset.vista = v;
    BC.loja.papel = v;
    if (!iniciadas[v]) { iniciadas[v] = true; modulo(v).iniciar(); }
    else modulo(v).render();
  }

  BC.app = {
    trocarVista: function (v) {
      if (VISTAS.indexOf(v) === -1) return;
      U.guardar('babel-coop:vista', v);
      try { history.replaceState(null, '', location.pathname + location.search + (v === 'estacao' ? '' : '#' + v)); } catch (e) { /* sem histórico: segue sem mudar o endereço */ }
      mostrar(v);
    }
  };

  var vista = vistaEscolhida();
  BC.loja.iniciar(vista);
  mostrar(vista);

  /* atalhos pelo endereço: #maquina abre a Máquina do projeto, #projetos, #whatsapp, #loja, #terminais, #perfil */
  var atalho = (location.hash || '').replace('#', '');
  if (vista === 'estacao' && atalho && atalho !== 'estacao') {
    setTimeout(function () {
      try {
        if (atalho === 'maquina' && BC.maquina) { BC.loja.verComo('theus'); BC.maquina.abrir('clinicas'); }
        else if (atalho === 'perfil') BC.estacao.abrirPerfil(BC.loja.eu);
        else if (atalho === 'projeto') BC.estacao.abrirProjeto('clinicas');
        else if (BC.vistas[atalho] || atalho === 'explorador' || atalho === 'chat' || atalho === 'demandas') BC.estacao.abrir(atalho);
      } catch (e) { console.error(e); }
    }, 300);
  }
})(window.BC);
