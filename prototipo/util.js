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

  /* avatar: foto quando houver, senão iniciais */
  U.avatar = function (p, tam, comPonto) {
    if (!p) return '';
    var estilo = '--cor:' + p.cor + (tam ? ';--tam:' + tam + 'px' : '');
    var dentro = p.foto ? '<img src="' + U.esc(p.foto) + '" alt="">' : U.esc(p.nome.slice(0, 2).toUpperCase());
    return '<span class="avatar' + (p.foto ? ' com-foto' : '') + '" style="' + estilo + '" title="' + U.esc(p.nome) + '">' +
      dentro + (comPonto ? '<span class="ponto ' + p.status + '"></span>' : '') + '</span>';
  };

  BC.util = U;
})(window.BC);
