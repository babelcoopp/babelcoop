/* Babel Coop — protótipo · os ícones 3D de criar (26/09/2026, pedido do Dominic)
   Troca os ícones de Tela, Máquina e Pesquisa (cartões da página Criar e atalhos da lateral) por desenhos com movimento:
   · Tela: TV antiga cyberpunk; ao passar o mouse, a tela liga, mostra o chiado e a TV cresce;
   · Máquina: banco de dados comprido de três camadas; as camadas se abrem e letras pulam de dentro;
   · Pesquisa: livros amarrados no estilo do ícone do WinRAR, com a lupa que cresce e gira 360°.
   Só troca o desenho de dentro do botão: o clique continua fazendo o que fazia. Visual em criar-icones.css. */
(function () {
  'use strict';

  var conta = 0;

  function tv(n) {
    return '<svg class="ic3d ic3d-tv" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
      '<defs>' +
        '<linearGradient id="' + n + 'c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d2247"/><stop offset="1" stop-color="#110d1d"/></linearGradient>' +
        '<radialGradient id="' + n + 'l" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#f2fdff"/><stop offset=".55" stop-color="#8be9ff"/><stop offset="1" stop-color="#2b5f86"/></radialGradient>' +
        '<filter id="' + n + 'r" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="1">' +
          '<animate attributeName="seed" values="1;8;3;12;5;10;2" dur="0.42s" repeatCount="indefinite" calcMode="discrete"/></feTurbulence>' +
          '<feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="1.4"/></feComponentTransfer></filter>' +
        '<clipPath id="' + n + 'k"><rect x="13" y="27" width="31" height="23" rx="6"/></clipPath>' +
      '</defs>' +
      '<g class="ic3d-antenas" fill="none" stroke-linecap="round">' +
        '<path d="M27 21 L19 9" stroke="#22d3ee" stroke-width="1.8"/><path d="M34 21 L45 7" stroke="#ff4fd8" stroke-width="1.8"/>' +
        '<circle class="ic3d-ponta" cx="19" cy="9" r="2.2" fill="#22d3ee"/><circle class="ic3d-ponta" cx="45" cy="7" r="2.2" fill="#ff4fd8"/>' +
      '</g>' +
      '<rect x="8" y="22" width="50" height="35" rx="7" fill="none" stroke="#22d3ee" stroke-opacity=".55" stroke-width="1"/>' +
      '<rect x="7" y="21" width="50" height="35" rx="7" fill="url(#' + n + 'c)" stroke="#ff4fd8" stroke-width="1.5"/>' +
      '<rect x="13" y="27" width="31" height="23" rx="6" fill="#06080c" stroke="#3b2f58"/>' +
      '<g clip-path="url(#' + n + 'k)">' +
        '<rect class="ic3d-tv-luz" x="13" y="27" width="31" height="23" fill="url(#' + n + 'l)"/>' +
        '<rect class="ic3d-tv-chiado" x="13" y="27" width="31" height="23" filter="url(#' + n + 'r)"/>' +
        '<rect class="ic3d-tv-faixa" x="13" y="27" width="31" height="4" fill="rgba(255,255,255,.4)"/>' +
      '</g>' +
      '<path d="M17 31 q6 -2.4 13 -.6" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="1.2" stroke-linecap="round"/>' +
      '<circle cx="50.5" cy="31" r="2.6" fill="#22d3ee"/><circle cx="50.5" cy="39" r="2.6" fill="#ff4fd8"/>' +
      '<path d="M47.5 45h6M47.5 48h6M47.5 51h6" stroke="#6d5a92" stroke-width="1"/>' +
      '<path d="M15 57 l-3 5M50 57 l3 5" stroke="#ff4fd8" stroke-width="2" stroke-linecap="round"/>' +
    '</svg>';
  }

  /* um andar do cilindro: o corpo e a tampa (a elipse) no alto */
  function andar(y, classe, n) {
    return '<g class="ic3d-db-camada ' + classe + '">' +
      '<path d="M16 ' + y + ' v12 a16 4.6 0 0 0 32 0 v-12 z" fill="url(#' + n + 'b)"/>' +
      '<path d="M16 ' + (y + 12) + ' a16 4.6 0 0 0 32 0" fill="none" stroke="#22d3ee" stroke-opacity=".75" stroke-width="1"/>' +
      '<ellipse cx="32" cy="' + y + '" rx="16" ry="4.6" fill="url(#' + n + 't)" stroke="#d9ceff" stroke-opacity=".6" stroke-width=".8"/>' +
    '</g>';
  }
  function db(n) {
    return '<svg class="ic3d ic3d-db" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
      '<defs>' +
        '<linearGradient id="' + n + 'b" x1="0" x2="1"><stop offset="0" stop-color="#2c1f78"/><stop offset=".45" stop-color="#7c5cff"/><stop offset="1" stop-color="#231862"/></linearGradient>' +
        '<linearGradient id="' + n + 't" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9bcff"/><stop offset="1" stop-color="#8a72ff"/></linearGradient>' +
      '</defs>' +
      andar(40, 'c3', n) + andar(26, 'c2', n) + andar(12, 'c1', n) +
      '<g class="ic3d-db-letras" font-family="JetBrains Mono, ui-monospace, monospace" font-weight="700" font-size="9" text-anchor="middle">' +
        '<text x="25" y="27" fill="#22d3ee">0</text><text x="32" y="27" fill="#ffffff">A</text>' +
        '<text x="39" y="27" fill="#ff4fd8">1</text><text x="32" y="27" fill="#ffd166">{}</text>' +
      '</g>' +
    '</svg>';
  }

  /* livro em pé: capa, lombada escura, borda das páginas e duas faixas */
  function livro(x, y, alt, cor, escura, faixa, giro) {
    return '<g transform="rotate(' + giro + ' ' + (x + 7.5) + ' 34)">' +
      '<rect x="' + x + '" y="' + y + '" width="15" height="' + alt + '" rx="2" fill="' + cor + '"/>' +
      '<rect x="' + x + '" y="' + y + '" width="3.2" height="' + alt + '" rx="1.2" fill="' + escura + '"/>' +
      '<rect x="' + (x + 12.4) + '" y="' + (y + 2) + '" width="1.8" height="' + (alt - 4) + '" fill="#f4ecd8" opacity=".9"/>' +
      '<rect x="' + (x + 4.5) + '" y="' + (y + 5) + '" width="7" height="2" rx=".6" fill="' + faixa + '"/>' +
      '<rect x="' + (x + 4.5) + '" y="' + (y + alt - 8) + '" width="7" height="2" rx=".6" fill="' + faixa + '"/>' +
    '</g>';
  }
  function livros() {
    return '<svg class="ic3d ic3d-livros" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
      '<g class="ic3d-pilha">' +
        livro(9, 13, 42, '#b3359f', '#76206a', '#f7c6ec', -5) + livro(24.5, 10, 45, '#2f7fd8', '#1d4f8f', '#bfe0ff', 0) + livro(40, 14, 41, '#2aa84a', '#17702e', '#c9f5d3', 5) +
        '<rect x="5.5" y="30" width="53" height="8" rx="1.6" fill="#7b4a1e" stroke="#4a2a0e"/>' +
        '<path d="M5.5 32h53" stroke="#a36a34" stroke-width=".8" opacity=".7"/>' +
        '<rect x="28" y="28.3" width="8.4" height="11.4" rx="1.4" fill="none" stroke="#f0c75e" stroke-width="1.7"/>' +
      '</g>' +
      '<g class="ic3d-lupa">' +
        '<circle cx="44" cy="46" r="8.6" fill="rgba(170,235,255,.32)" stroke="#eef7ff" stroke-width="2.7"/>' +
        '<path d="M39.6 42.6 q2.6 -2.8 6.1 -2.3" fill="none" stroke="#fff" stroke-width="1.3" opacity=".85" stroke-linecap="round"/>' +
        '<path d="M50.3 52.3 L57.4 59.4" stroke="#c8d4e4" stroke-width="4.4" stroke-linecap="round"/>' +
      '</g>' +
    '</svg>';
  }

  var MAPA = { 'criar-tela': tv, 'pj-maquina': db, 'criar-pesquisa': livros };

  function trocar() {
    [].forEach.call(document.querySelectorAll('.criar-cartao[data-acao], .criar-atalhos button[data-acao]'), function (b) {
      var desenho = MAPA[b.dataset.acao], ic = b.querySelector('.criar-ic, i');
      if (!desenho || !ic || ic.dataset.ic3d) return;
      ic.dataset.ic3d = b.dataset.acao;
      ic.classList.add('ic3d-caixa');
      ic.innerHTML = desenho('ic3d' + (++conta));
    });
  }

  /* a página e a lateral se redesenham: troca de novo quando aparecem botões novos */
  ['e-conteudo', 'e-lateral'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) new MutationObserver(trocar).observe(el, { childList: true, subtree: true });
  });
  trocar();
})();
