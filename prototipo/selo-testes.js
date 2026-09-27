/* Babel Coop — protótipo · selo "TESTES" (26/09/2026)
   Na Estação de testes (servidor com BABEL_COOP_EXEMPLOS=1: a equipe e os dados de exemplo do protótipo), um selo no topo
   deixa claro que ali nada é de verdade. No app real e no protótipo puro não aparece. Visual em profundidade.css (§10). */
(function () {
  'use strict';
  /* o servidor injeta window.COOP_REAL logo antes do app.js, depois deste arquivo: a conferência é feita na hora de pôr o selo */
  function deTestes() { return !!(window.COOP_REAL && window.COOP_REAL.exemplos); }
  function instalar() {
    if (!deTestes()) return;
    document.documentElement.dataset.testes = 'sim';
    var marca = document.querySelector('.e-marca');
    if (!marca || marca.querySelector('.selo-testes')) return;
    var s = document.createElement('span');
    s.className = 'selo-testes';
    s.title = 'Estação de testes: a equipe, as tarefas e os arquivos são de exemplo. O Babel de verdade é outro (porta 4711).';
    s.textContent = 'Testes';
    marca.appendChild(s);
  }
  window.addEventListener('load', instalar);
  setInterval(instalar, 1500);
})();
