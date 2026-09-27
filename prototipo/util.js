/* Babel Coop — protótipo · utilidades */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var MIN = 60000, HORA = 3600000, DIA = 86400000;
  var DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  var DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
    'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  var U = { MIN: MIN, HORA: HORA, DIA: DIA, pad: pad };

  U.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  /* minúsculas e sem acento, para busca */
  U.normalizar = function (s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  };

  U.relativo = function (ts) {
    var d = Date.now() - ts;
    if (d < 45000) return 'agora';
    if (d < HORA) return 'há ' + Math.max(1, Math.round(d / MIN)) + ' min';
    if (d < DIA) { var h = Math.round(d / HORA); return 'há ' + h + (h === 1 ? ' hora' : ' horas'); }
    var dd = Math.round(d / DIA);
    return 'há ' + dd + (dd === 1 ? ' dia' : ' dias');
  };

  U.hora = function (ts) { var d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  U.horaSeg = function (ts) { var d = new Date(ts); return U.hora(ts) + ':' + pad(d.getSeconds()); };
  U.mes = function (d) { return MESES[(d || new Date()).getMonth()]; };
  U.dataLonga = function (d) { d = d || new Date(); return DIAS[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()]; };
  U.dataCurta = function (d) { d = d || new Date(); return DIAS_CURTOS[d.getDay()] + ', ' + d.getDate() + ' ' + MESES[d.getMonth()].slice(0, 3); };
  U.dataArquivo = function (d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  U.mesmoDia = function (a, b) { return new Date(a).toDateString() === new Date(b || Date.now()).toDateString(); };

  U.quando = function (ts) {
    if (U.mesmoDia(ts)) return U.hora(ts);
    if (U.mesmoDia(ts, Date.now() - DIA)) return 'ontem';
    var d = new Date(ts);
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1);
  };

  /* duração em ms → "1h 52min", "12 min", "40 s" */
  U.duracao = function (ms) {
    ms = Math.max(0, ms);
    if (ms < MIN) return Math.round(ms / 1000) + ' s';
    var h = Math.floor(ms / HORA), m = Math.floor(ms % HORA / MIN);
    if (h === 0) return m + ' min';
    return h + 'h' + (m ? ' ' + pad(m) + 'min' : '');
  };

  /* duração em ms → "01:12:05" */
  U.relogio = function (ms) {
    ms = Math.max(0, ms);
    var h = Math.floor(ms / HORA), m = Math.floor(ms % HORA / MIN), s = Math.floor(ms % MIN / 1000);
    return pad(h) + ':' + pad(m) + ':' + pad(s);
  };

  U.regressiva = function (fim) {
    var r = Math.max(0, fim - Date.now());
    var d = Math.floor(r / DIA);
    return { total: r, dias: d, texto: (d > 0 ? d + 'd ' : '') + U.relogio(r % DIA) };
  };

  U.prazo = function (ts) {
    if (!ts) return { texto: 'sem prazo', classe: '' };
    var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    var alvo = new Date(ts); alvo.setHours(0, 0, 0, 0);
    var dd = Math.round((alvo - hoje) / DIA);
    if (dd === 0) return { texto: 'hoje', classe: 'hoje' };
    if (dd === 1) return { texto: 'amanhã', classe: '' };
    if (dd > 1) return { texto: 'em ' + dd + ' dias', classe: '' };
    return { texto: 'atrasada ' + (-dd) + (dd === -1 ? ' dia' : ' dias'), classe: 'atrasada' };
  };

  U.saudacao = function () {
    var h = new Date().getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  };

  U.sorteia = function (lista) { return lista[Math.floor(Math.random() * lista.length)]; };
  U.entre = function (a, b) { return a + Math.random() * (b - a); };
  U.id = function (prefixo) { return (prefixo || 'x') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };

  U.guardar = function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } };
  U.ler = function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } };
  U.guardarLocal = function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } };
  U.lerLocal = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };

  U.movimentoReduzido = function () {
    return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  };

  /* janela da Estação sem foco: html.sem-foco pausa o que respira sempre (logo e fotos; casca-2030.css). A TV e o iPad ficam
     numa tela que ninguém clica, então nunca recebem a classe: lá a luz continua viva */
  (function () {
    if (/^#?(tv|ipad)\b/.test(location.hash || '')) return;
    var marcar = function () { var h = document.documentElement, fora = document.hidden || !document.hasFocus(); if (/^(tv|ipad)$/.test(h.getAttribute('data-vista') || '')) fora = false; h.classList.toggle('sem-foco', fora); };
    ['focus', 'blur'].forEach(function (e) { window.addEventListener(e, marcar); });
    document.addEventListener('visibilitychange', marcar);
    marcar();
  })();

  /* avatar: foto quando houver, senão iniciais, no círculo da cor da pessoa que brilha em volta (casca-2030.css).
     Classe "on" = a pessoa está online (a borda respira devagar); "evento" = a luz pisca nas laterais da foto
     (U.avatarEvento). data-pessoa deixa o evento achar todas as fotos da pessoa na tela. */
  var PISCA_MS = 1400, avEventos = {}, avContagem = { eventos: 0, fotos: 0 };
  U.avatar = function (p, tam, comPonto) {
    if (!p) return '';
    var estilo = '--cor:' + p.cor + (tam ? ';--tam:' + tam + 'px' : '');
    var dentro = p.foto ? '<img src="' + U.esc(p.foto) + '" alt="">' : U.esc(p.nome.slice(0, 2).toUpperCase());
    var on = p.status === 'online' || p.status === 'foco', ev = avEventos[p.id], idade = ev ? Date.now() - ev : PISCA_MS;
    /* re-render no meio do piscar: a foto nova continua de onde a antiga estava (atraso negativo), não pisca de novo */
    if (idade < PISCA_MS) estilo += ';--av-atraso:-' + idade + 'ms';
    return '<span class="avatar' + (p.foto ? ' com-foto' : '') + (on ? ' on' : '') + (idade < PISCA_MS ? ' evento' : '') + '" style="' + estilo + '"' +
      (p.id ? ' data-pessoa="' + U.esc(p.id) + '"' : '') + ' title="' + U.esc(p.nome) + '">' +
      (on ? '<i class="av-luz" aria-hidden="true"></i>' : '') + dentro + (comPonto ? '<span class="ponto ' + p.status + '"></span>' : '') + '</span>';
  };
  /* evento da pessoa (ficou online, o terminal começou a rodar, terminou): a luz pisca nas laterais de todas as fotos
     dela, uma vez (1,4 s, só opacidade). Movimento reduzido: a luz fica parada o mesmo tempo (casca-2030.css).
     Repetido em menos de 0,4 s é o mesmo evento. Devolve quantas fotos acenderam. */
  U.avatarEvento = function (id) {
    if (!id || typeof document === 'undefined') return 0;
    var agora = Date.now();
    if (avEventos[id] && agora - avEventos[id] < 400) return 0;
    avEventos[id] = agora;
    avContagem.eventos++;
    var n = 0, sel = '.avatar[data-pessoa="' + String(id).replace(/["\\]/g, '\\$&') + '"]';
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (a) {
      a.classList.remove('evento');
      a.style.removeProperty('--av-atraso');
      void a.offsetWidth; /* reinicia a animação */
      a.classList.add('evento');
      clearTimeout(a.__avPisca);
      a.__avPisca = setTimeout(function () { a.classList.remove('evento'); }, PISCA_MS + 50);
      n++;
    });
    avContagem.fotos += n;
    return n;
  };
  U.avatarContagem = function () { return { eventos: avContagem.eventos, fotos: avContagem.fotos }; };

  BC.util = U;
})(window.BC);
