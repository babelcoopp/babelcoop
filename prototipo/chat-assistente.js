/* Babel Coop — protótipo · o chat do assistente: fundo escuro ou branco (26/09/2026, pedido do Dominic)
   Põe o botão ◐ no canto de cima da conversa de cada agente (app real) e guarda a escolha neste navegador.
   Também dobra as boas-vindas longas (o agente babel Cursor mostra as instruções inteiras) com "ler tudo".
   O visual (neon azul e roxo, o símbolo pulsando, as duas versões do fundo) está em chat-assistente.css. */
(function () {
  'use strict';

  var CHAVE = 'babel-coop:chat-fundo';

  function ler() {
    try { return localStorage.getItem(CHAVE) === 'branco' ? 'branco' : 'escuro'; } catch (e) { return 'escuro'; }
  }

  function aplicar(fundo) {
    var painel = document.getElementById('e-painel');
    if (painel) painel.dataset.chatFundo = fundo;
    [].forEach.call(document.querySelectorAll('.chat-fundo-botao'), function (b) {
      b.setAttribute('aria-pressed', String(fundo === 'branco'));
      b.title = fundo === 'branco' ? 'Voltar o fundo do chat para o escuro' : 'Deixar o fundo do chat branco';
      b.setAttribute('aria-label', b.title);
    });
  }

  /* o painel real nasce depois deste arquivo, e cada agente novo traz a sua conversa: confere de vez em quando */
  function instalar() {
    [].forEach.call(document.querySelectorAll('#e-painel .tr-face-presenca'), function (face) {
      if (!face.querySelector(':scope > .chat-fundo-botao')) face.appendChild(botao());
    });
    [].forEach.call(document.querySelectorAll('#e-painel .tr-saudacao .tr-txt:not([data-dobra])'), dobrar);
    aplicar(ler());
  }

  function dobrar(txt) {
    txt.dataset.dobra = 'sim';
    if (txt.textContent.length < 420) return;
    txt.classList.add('dobrado');
    var mais = document.createElement('button');
    mais.type = 'button';
    mais.className = 'tr-mais-txt';
    mais.textContent = 'ler tudo';
    mais.addEventListener('click', function () {
      var aberto = !txt.classList.toggle('dobrado');
      mais.textContent = aberto ? 'mostrar menos' : 'ler tudo';
    });
    txt.insertAdjacentElement('afterend', mais);
  }

  function botao() {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chat-fundo-botao';
    b.innerHTML = '<span aria-hidden="true">◐</span>';
    b.addEventListener('click', function () {
      var novo = ler() === 'branco' ? 'escuro' : 'branco';
      try { localStorage.setItem(CHAVE, novo); } catch (e) { /* sem armazenamento: vale só nesta aba */ }
      aplicar(novo);
    });
    return b;
  }

  aplicar(ler());
  instalar();
  setInterval(instalar, 1000);
})();
