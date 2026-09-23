/* babel-coop · o placar: pontos com origem, no rodapé da Estação (window.BC.placar)
   Contrato: .deus/terminal-ao-vivo/PROTOCOLO.md §10 · régua: docs/design/REGUA_ORGANISMO.md §1 (R1–R10) e §3 (a fórmula).

   pontos_evento = base × esforço × surpresa, e cada ponto guarda a origem (R3):
   - item do plano do MEU agente feito (agente-plano: concluidosAgora, ou a passagem para 'feito' que vi acontecer):
       base 1 · esforço ×2 se o item travava há mais de 1 dia · ×2 se 3 ou mais itens fecharam de uma vez · surpresa 1
       (1,5 antes do prazo, 0,75 depois, quando o plano trouxer prazo) → +1 a +4
   - plano concluído (todos os itens feitos): base 8 × esforço (2 se algum item travava) × surpresa → +8 (e os itens já contaram)
   - OK que eu dei a um pedido de permissão do meu agente (agente-espera → agente-ok): +2, a segurança funcionando.
     Só conta se o pedido existiu (pid visto num agente-espera), uma vez por pedido.
   Nunca: pontos por tempo, por abrir o app, por mensagem, sorteados, comprados; nunca ranking (R4): só a pessoa vê,
   guardado por pessoa neste computador (localStorage 'babel-coop:placar:<id>'); a TV nunca mostra.

   Casa no rodapé "N pontos · hoje" com o anel da meta semanal (escolhida pela pessoa, R5): o número sobe contando;
   cada ganho mostra de onde veio; clique abre a lista com a origem de cada ponto; o anel vira ouro ao fechar a
   meta, uma vez por semana (som 'tres'). A pessoa pode esconder os números (R9).
   JS puro, sem módulos. Carregado depois de ponte.js e organismo.js (lista INJETAR do servidor).
*/
(function () {
  'use strict';
  var BC = window.BC = window.BC || {};
  if (BC.placar && BC.placar.versao) return;

  var VERSAO = '1.0.0';
  var DIA = 86400000;
  var MAX_EVENTOS = 2000;

  function agora() { return performance.now(); }
  function org() { return BC.organismo || null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function dois(n) { return (n < 10 ? '0' : '') + n; }
  function hora(ms) { var d = new Date(ms || Date.now()); return dois(d.getHours()) + ':' + dois(d.getMinutes()); }
  function diaDe(ms) { var d = new Date(ms); return d.getFullYear() + '-' + dois(d.getMonth() + 1) + '-' + dois(d.getDate()); }
  function segundaDe(ms) { var d = new Date(ms); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); }
  function semanaDe(ms) { return diaDe(segundaDe(ms)); }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
  function norma(t) { return String(t == null ? '' : t).trim(); }
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function semMovimento() { var o = org(); if (o && o.semMovimento) return o.semMovimento(); return !!(mq && mq.matches); }
  function eu() { var r = BC.real && BC.real.eu && BC.real.eu(); return r && r.id ? r : null; }
  function L() { return BC.loja || null; }
  function nomeAgente(dono, id, m) {
    if (m && (m.nome || m.agente)) return String(m.nome || m.agente);
    var l = L(), p = l && l.pessoa && l.pessoa(dono);
    var ag = p && (p.agentes || []).filter(function (a) { return a.id === id; })[0];
    return ag ? ag.nome : (nomes[(dono || '') + '/' + id] || 'o agente');
  }
  var nomes = {};

  /* a TV, o iPad e o cronômetro nunca contam nem mostram pontos (R4: nada pessoal na TV) */
  function naEstacao() {
    var h = String(location.hash || '').replace('#', '');
    if (/^(tv|ipad|cronometro)\b/.test(h)) return false;
    var v = document.documentElement.getAttribute('data-vista');
    if (v && v !== 'estacao') return false;
    return !!document.getElementById('e-status');
  }

  (function garantirCss() {
    if (document.querySelector('link[href$="/coop/placar.css"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = '/coop/placar.css';
    (document.head || document.documentElement).appendChild(l);
  })();

  /* ------------------------------------------------------------------ armazenamento por pessoa */
  var dados = null, chaveAtual = null;
  function vazio() { return { v: 1, meta: 0, oculto: false, eventos: [], ouro: {}, vistos: {} }; }
  function chave() { var e = eu(); return e ? 'babel-coop:placar:' + e.id : null; }
  function carregar() {
    var k = chave();
    if (!k) return null;
    var d = null;
    try { d = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { d = null; }
    if (!d || d.v !== 1) d = (chaveAtual === k && dados) ? dados : vazio();
    d.eventos = Array.isArray(d.eventos) ? d.eventos : [];
    d.ouro = d.ouro || {}; d.vistos = d.vistos || {};
    chaveAtual = k; dados = d;
    return d;
  }
  function salvar() {
    if (!dados || !chaveAtual) return;
    /* guarda 120 dias e no máximo 2000 pontos: o placar informa competência, não é arquivo morto */
    var corte = Date.now() - 120 * DIA;
    dados.eventos = dados.eventos.filter(function (e) { return e.t >= corte; }).slice(-MAX_EVENTOS);
    var ks = Object.keys(dados.vistos);
    if (ks.length > 600) ks.sort(function (a, b) { return dados.vistos[a] - dados.vistos[b]; }).slice(0, ks.length - 600).forEach(function (k) { delete dados.vistos[k]; });
    try { localStorage.setItem(chaveAtual, JSON.stringify(dados)); } catch (e) { /* sem armazenamento: vale nesta página */ }
  }

  /* ------------------------------------------------------------------ contas */
  function soma(filtro) { var s = 0; (dados ? dados.eventos : []).forEach(function (e) { if (filtro(e)) s += e.pts; }); return s; }
  function hoje() { var d = diaDe(Date.now()); return soma(function (e) { return diaDe(e.t) === d; }); }
  function semana() { var s = segundaDe(Date.now()); return soma(function (e) { return e.t >= s; }); }
  /* sequência: dias úteis seguidos com pelo menos um ponto; sábado e domingo congelam (não quebram) */
  function sequencia() {
    if (!dados || !dados.eventos.length) return 0;
    var dias = {};
    dados.eventos.forEach(function (e) { dias[diaDe(e.t)] = true; });
    var d = new Date(); d.setHours(12, 0, 0, 0);
    var n = 0, primeiro = true;
    for (var i = 0; i < 400; i++) {
      var ds = d.getDay();
      if (ds !== 0 && ds !== 6) {
        if (dias[diaDe(d.getTime())]) n++;
        else if (!primeiro) break; /* hoje sem ponto ainda não quebra a sequência */
        primeiro = false;
      }
      d.setDate(d.getDate() - 1);
    }
    return n;
  }
  function metaFechada() { return !!(dados && dados.meta > 0 && semana() >= dados.meta); }

  /* ------------------------------------------------------------------ instrumentação */
  var cont = { eventos: 0, pontos: 0, recusados: 0, ouro: 0, contagens: 0 };
  var reg = [];
  function anotar(o) { o.t = Math.round(agora()); reg.push(o); if (reg.length > 200) reg.shift(); }

  /* ------------------------------------------------------------------ somar um ponto (com a origem) */
  function somar(ev) {
    if (!naEstacao()) return false;
    if (!carregar()) { cont.recusados++; anotar({ tipo: 'recusado', motivo: 'sem-pessoa', chave: ev.chave }); return false; }
    if (dados.eventos.some(function (e) { return e.chave === ev.chave; })) { cont.recusados++; anotar({ tipo: 'recusado', motivo: 'repetido', chave: ev.chave }); return false; }
    ev.t = ev.t || Date.now();
    ev.pts = Math.max(1, Math.round(ev.pts));
    var antes = hoje(), fechadaAntes = metaFechada();
    dados.eventos.push(ev);
    salvar();
    cont.eventos++; cont.pontos += ev.pts;
    anotar({ tipo: 'ponto', pts: ev.pts, origem: ev.origem, chave: ev.chave });
    mostrarGanho(antes, hoje(), ev);
    if (!fechadaAntes) checarOuro();
    if (pop) desenharPop();
    avisar(ev);
    return true;
  }
  var ouvintes = [];
  function avisar(ev) { ouvintes.forEach(function (fn) { try { fn(ev); } catch (e) { /* segue */ } }); }

  /* ------------------------------------------------------------------ eventos reais: plano do agente */
  /* itens do plano como o PROTOCOLO manda (texto, estado feito|andamento|pendente) ou crus do TodoWrite (content, completed|in_progress|pending) */
  function normalizarItens(lista) {
    return (Array.isArray(lista) ? lista : []).slice(0, 100).map(function (x) {
      var e = x && (x.estado || x.status);
      return { texto: String(x && (x.texto || x.content) || '').trim().slice(0, 300), estado: e === 'feito' || e === 'completed' ? 'feito' : e === 'andamento' || e === 'in_progress' ? 'andamento' : 'pendente' };
    });
  }
  var planoAntes = {};
  function surpresaDe(m) {
    var p = +m.prazo || 0;
    if (!p) return { k: 1, txt: 'surpresa 1' };
    var t = Date.now();
    if (t < p - DIA / 2) return { k: 1.5, txt: 'surpresa 1,5 (antes do prazo)' };
    if (t > p) return { k: 0.75, txt: 'surpresa 0,75 (depois do prazo)' };
    return { k: 1, txt: 'surpresa 1 (no prazo)' };
  }
  function aoPlano(m) {
    if (!naEstacao() || !carregar()) return;
    var mim = eu();
    if (m.dono && mim && m.dono !== mim.id) return; /* só o MEU agente me dá pontos */
    var itens = normalizarItens(m.itens);
    var sess = (m.dono || mim.id) + '/' + (m.id || '');
    var agente = nomeAgente(m.dono || mim.id, m.id, m);
    var antes = planoAntes[sess] || {};
    var agoraT = Date.now(), mudouVistos = false;
    /* quando cada item apareceu não feito (para "travava há mais de 1 dia") */
    itens.forEach(function (it) {
      if (!it || it.estado === 'feito') return;
      var k = 'item:' + sess + ':' + hash(norma(it.texto));
      if (!dados.vistos[k]) { dados.vistos[k] = agoraT; mudouVistos = true; }
    });
    var idx = {};
    (Array.isArray(m.concluidosAgora) ? m.concluidosAgora : []).forEach(function (i) { if (itens[i] && itens[i].estado === 'feito') idx[i] = true; });
    itens.forEach(function (it, i) { if (it && it.estado === 'feito' && antes[norma(it.texto)] && antes[norma(it.texto)] !== 'feito') idx[i] = true; });
    var novos = Object.keys(idx).map(Number).sort(function (a, b) { return a - b; }).filter(function (i) {
      var k = 'item:' + sess + ':' + hash(norma(itens[i].texto));
      return !dados.eventos.some(function (e) { return e.chave === k; });
    });
    var lote = novos.length >= 3, sup = surpresaDe(m), algumTravava = false;
    novos.forEach(function (i) {
      var texto = norma(itens[i].texto), k = 'item:' + sess + ':' + hash(texto);
      var desde = dados.vistos[k], travava = !!(desde && agoraT - desde > DIA);
      if (travava) algumTravava = true;
      var esforco = (travava ? 2 : 1) * (lote ? 2 : 1), motivos = [];
      if (travava) motivos.push('travava há mais de 1 dia');
      if (lote) motivos.push(novos.length + ' itens de uma vez');
      somar({
        tipo: 'item', chave: k, sessao: sess, item: texto, agente: agente,
        pts: 1 * esforco * sup.k,
        origem: 'item do plano feito · ' + texto,
        conta: '1 × esforço ' + esforco + (motivos.length ? ' (' + motivos.join(' · ') + ')' : '') + ' × ' + sup.txt,
        prova: 'item ' + (i + 1) + ' de ' + itens.length + ' do plano de ' + agente
      });
    });
    var tudo = itens.length > 0 && itens.every(function (x) { return x && x.estado === 'feito'; });
    if (tudo) {
      var textos = itens.map(function (x) { return norma(x.texto); });
      var kp = 'plano:' + sess + ':' + hash(textos.join('\n'));
      if (!algumTravava) algumTravava = textos.some(function (t) { var d = dados.vistos['item:' + sess + ':' + hash(t)]; return d && agoraT - d > DIA; });
      var ep = algumTravava ? 2 : 1;
      somar({
        tipo: 'plano', chave: kp, sessao: sess, agente: agente, pts: 8 * ep * sup.k,
        origem: 'plano concluído · ' + itens.length + (itens.length === 1 ? ' item' : ' itens'),
        conta: '8 × esforço ' + ep + (algumTravava ? ' (um item travava há mais de 1 dia)' : '') + ' × ' + sup.txt,
        prova: textos.join(' · ')
      });
    }
    var mapa = {};
    itens.forEach(function (it) { if (it) mapa[norma(it.texto)] = it.estado; });
    planoAntes[sess] = mapa;
    if (mudouVistos) salvar();
  }

  /* ------------------------------------------------------------------ eventos reais: OK da pessoa a um pedido de permissão */
  var pedidos = {};
  function aoEspera(m) {
    var mim = eu();
    if (!m.pid || (m.dono && mim && m.dono !== mim.id)) return;
    var sess = (m.dono || (mim && mim.id) || '') + '/' + (m.id || '');
    pedidos[m.pid] = { sess: sess, ferramenta: m.ferramenta || '', resumo: m.resumo || '', agente: nomeAgente(m.dono || (mim && mim.id), m.id, m), t: Date.now() };
  }
  function registrarOk(pid, decisao) {
    var p = pedidos[pid];
    if (!p) { cont.recusados++; anotar({ tipo: 'recusado', motivo: 'sem-pedido', pid: pid }); return false; }
    var d = decisao === 'negar' ? 'negar' : 'permitir';
    var ok = somar({
      tipo: 'ok', chave: 'ok:' + p.sess + ':' + pid + ':' + p.t, sessao: p.sess, agente: p.agente, pts: 2,
      origem: 'você decidiu um pedido de ' + p.agente + ' · ' + (d === 'negar' ? 'negou' : 'permitiu'),
      conta: '2 · a segurança funcionou (a pessoa viu antes de o agente agir)',
      prova: (p.ferramenta ? p.ferramenta + ': ' : '') + String(p.resumo).slice(0, 160)
    });
    delete pedidos[pid];
    return ok;
  }

  /* ------------------------------------------------------------------ a casa no rodapé */
  var casa = null, numero = null, anel = null, rotulo = null, mostrado = 0, animNum = null;
  function montarCasa() {
    if (casa) return casa;
    casa = document.createElement('button');
    casa.type = 'button';
    casa.className = 'st-item st-placar';
    casa.setAttribute('aria-haspopup', 'dialog');
    casa.setAttribute('aria-expanded', 'false');
    casa.title = 'Meus pontos de hoje e a meta da semana (só você vê). Clique para ver de onde veio cada ponto.';
    casa.innerHTML = '<svg class="pl-anel" viewBox="0 0 16 16" aria-hidden="true"><circle class="pl-fundo" cx="8" cy="8" r="6"/><circle class="pl-val" cx="8" cy="8" r="6" pathLength="100"/></svg>' +
      '<span class="pl-n">0</span><span class="pl-rot">pontos · hoje</span>';
    numero = casa.querySelector('.pl-n'); anel = casa.querySelector('.pl-anel'); rotulo = casa.querySelector('.pl-rot');
    casa.addEventListener('click', function (ev) { ev.stopPropagation(); if (pop) fecharPop(); else abrirPop(); });
    return casa;
  }
  function garantirCasa() {
    var st = document.getElementById('e-status');
    if (!st || !naEstacao()) return;
    montarCasa();
    var dir = st.querySelector('.st-dir');
    var pai = dir || st;
    if (casa.parentNode !== pai || pai.firstChild !== casa) pai.insertBefore(casa, pai.firstChild);
  }
  function desenharCasa(semAnimar) {
    if (!casa) return;
    var h = hoje(), sem = semana(), meta = dados ? dados.meta : 0, oculto = !!(dados && dados.oculto);
    casa.classList.toggle('oculto', oculto);
    if (semAnimar || !animNum) { numero.textContent = String(h); mostrado = h; }
    rotulo.textContent = oculto ? 'pontos' : (h === 1 ? 'ponto · hoje' : 'pontos · hoje');
    var pct = meta > 0 ? Math.min(1, sem / meta) : 0;
    anel.querySelector('.pl-val').style.strokeDashoffset = String(100 - pct * 100);
    anel.classList.toggle('sem-meta', !meta);
    anel.classList.toggle('ouro', meta > 0 && sem >= meta);
    casa.setAttribute('aria-label', (oculto ? 'pontos escondidos' : h + ' pontos hoje') + (meta ? ' · meta da semana ' + sem + ' de ' + meta : ' · sem meta da semana'));
  }
  /* o número sobe contando (700 ms, sem movimento = na hora); um relógio de segurança garante o valor final */
  function contar(de, para) {
    if (animNum) { cancelAnimationFrame(animNum.raf); clearTimeout(animNum.seg); }
    cont.contagens++;
    if (semMovimento() || de === para) { animNum = null; numero.textContent = String(para); mostrado = para; return; }
    var t0 = agora(), dur = 700, vistos = [];
    animNum = { vistos: vistos };
    casa.classList.add('sobe');
    function q(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3), v = Math.round(de + (para - de) * e);
      numero.textContent = String(v); mostrado = v;
      if (vistos[vistos.length - 1] !== v) vistos.push(v);
      if (k < 1) animNum.raf = requestAnimationFrame(q); else fim();
    }
    function fim() { if (!animNum) return; clearTimeout(animNum.seg); cancelAnimationFrame(animNum.raf); numero.textContent = String(para); mostrado = para; ultimaContagem = vistos.concat(vistos[vistos.length - 1] === para ? [] : [para]); animNum = null; setTimeout(function () { if (!animNum) casa.classList.remove('sobe'); }, 300); }
    animNum.raf = requestAnimationFrame(q);
    animNum.seg = setTimeout(fim, dur + 250);
  }
  var ultimaContagem = [];
  function mostrarGanho(antes, depois, ev) {
    garantirCasa();
    if (!casa) return;
    var o = org();
    desenharCasa(true);
    if (!dados.oculto) { numero.textContent = String(antes); mostrado = antes; contar(antes, depois); }
    if (o) o.acender(casa, 6000);
    if (!dados.oculto) voo(ev);
  }
  /* o ganho mostra de onde veio, acima da casa, e some (R3) */
  var voos = [];
  function voo(ev) {
    if (!casa || !casa.isConnected || pop) return; /* com a lista aberta, a linha nova já aparece nela */
    var r = casa.getBoundingClientRect();
    if (!r.width) return;
    var v = document.createElement('div');
    v.className = 'pl-voo';
    v.setAttribute('aria-hidden', 'true');
    v.innerHTML = '<b>+' + ev.pts + '</b> ' + esc(ev.origem.length > 64 ? ev.origem.slice(0, 63) + '…' : ev.origem);
    v.style.left = Math.round(r.left) + 'px'; /* provisório: medido abaixo e alinhado pela direita da casa (cresce sobre o meio, não cobre o campo do painel) */
    v.style.bottom = Math.round(window.innerHeight - r.top + 6) + 'px';
    document.body.appendChild(v);
    var vv = v.getBoundingClientRect();
    v.style.left = Math.round(Math.max(8, Math.min(window.innerWidth - 8 - vv.width, r.right - vv.width))) + 'px';
    /* ganhos no mesmo instante (o último item e o plano concluído) se empilham: cada um legível, o mais novo embaixo */
    voos = voos.filter(function (x) { return x.isConnected; });
    voos.forEach(function (x) { x.style.bottom = (parseFloat(x.style.bottom) + vv.height + 4) + 'px'; });
    voos.push(v);
    while (voos.length > 3) { var velho = voos.shift(); if (velho.parentNode) velho.parentNode.removeChild(velho); }
    var dur = 2200;
    if (!semMovimento() && v.animate) {
      var a = v.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none', offset: 0.12 }, { opacity: 1, transform: 'translateY(-6px)', offset: 0.7 }, { opacity: 0, transform: 'translateY(-12px)' }], { duration: dur, easing: 'cubic-bezier(.2,0,0,1)' });
      a.onfinish = function () { if (v.parentNode) v.parentNode.removeChild(v); };
      setTimeout(function () { if (v.parentNode) v.parentNode.removeChild(v); }, dur + 400);
    } else setTimeout(function () { if (v.parentNode) v.parentNode.removeChild(v); }, dur);
  }
  /* meta semanal fechada: o anel vira ouro, uma vez por semana, três notas */
  function checarOuro() {
    if (!dados || !(dados.meta > 0)) return false;
    var s = semanaDe(Date.now());
    if (semana() < dados.meta || dados.ouro[s]) return false;
    dados.ouro[s] = Date.now();
    salvar();
    cont.ouro++;
    anotar({ tipo: 'ouro', semana: s, meta: dados.meta });
    desenharCasa(true);
    var o = org();
    if (anel && !semMovimento() && anel.animate) anel.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)', offset: 0.35 }, { transform: 'scale(1)' }], { duration: 800, easing: 'cubic-bezier(.16,1,.3,1)' });
    if (o) { o.som('tres'); o.faiscas(anel || casa, 8, false, { cor: 'ouro' }); o.acender(casa, 6000); }
    if (pop) desenharPop();
    return true;
  }

  /* ------------------------------------------------------------------ a lista com a origem de cada ponto */
  var pop = null;
  var NOMES_DIA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  function desenharPop() {
    if (!pop || !dados) return;
    var h = hoje(), sem = semana(), seq = sequencia(), meta = dados.meta || 0, diaHoje = diaDe(Date.now());
    var lista = dados.eventos.filter(function (e) { return diaDe(e.t) === diaHoje; }).slice().reverse();
    var seg = segundaDe(Date.now()), porDia = {};
    dados.eventos.forEach(function (e) { if (e.t >= seg && diaDe(e.t) !== diaHoje) porDia[diaDe(e.t)] = (porDia[diaDe(e.t)] || 0) + e.pts; });
    var antes = Object.keys(porDia).sort().map(function (d) { var x = new Date(d + 'T12:00:00'); return NOMES_DIA[x.getDay()] + ' ' + porDia[d]; });
    var pct = meta > 0 ? Math.min(1, sem / meta) : 0, fechada = meta > 0 && sem >= meta;
    pop.innerHTML =
      '<header class="pl-cab"><span class="pl-titulo">meus pontos</span><span class="pl-so">só você vê · nunca ranking · nunca por tempo</span>' +
      '<button type="button" class="pl-x" data-pl="fechar" aria-label="Fechar">✕</button></header>' +
      '<div class="pl-nums"><div><b class="pl-hoje">' + h + '</b><span>hoje</span></div><div><b>' + sem + '</b><span>esta semana</span></div>' +
      '<div><b>' + seq + '</b><span>' + (seq === 1 ? 'dia útil' : 'dias úteis') + ' em sequência</span></div></div>' +
      '<div class="pl-meta"><svg class="pl-anel-g' + (fechada ? ' ouro' : '') + (meta ? '' : ' sem-meta') + '" viewBox="0 0 40 40" aria-hidden="true"><circle class="pl-fundo" cx="20" cy="20" r="16"/>' +
      '<circle class="pl-val" cx="20" cy="20" r="16" pathLength="100" style="stroke-dashoffset:' + (100 - pct * 100).toFixed(1) + '"/></svg>' +
      '<div class="pl-meta-txt"><b>' + (meta ? sem + ' / ' + meta : 'sem meta') + '</b> ' + (fechada ? '· meta da semana fechada' : 'meta da semana · escolhida por você') +
      '<form class="pl-meta-form"><label>meta <input type="number" min="1" max="9999" step="1" inputmode="numeric" value="' + (meta || '') + '" placeholder="40" aria-label="Meta de pontos da semana"></label>' +
      '<button type="submit" class="pl-bt">guardar</button>' + (meta ? '<button type="button" class="pl-bt fraco" data-pl="sem-meta">sem meta</button>' : '') + '</form></div></div>' +
      '<div class="pl-rot-lista">de onde veio · hoje</div>' +
      (lista.length ? '<ol class="pl-lista">' + lista.map(function (e) {
        return '<li><b class="pl-pts">+' + e.pts + '</b><span class="pl-org">' + esc(e.origem) +
          '<small>' + esc(e.conta || '') + (e.agente ? ' · ' + esc(e.agente) : '') + ' · ' + hora(e.t) + '</small>' +
          (e.prova ? '<small class="pl-prova">prova: ' + esc(e.prova) + '</small>' : '') + '</span></li>';
      }).join('') + '</ol>' : '<p class="pl-vazio">nada ainda hoje · os pontos vêm do plano que o seu agente conclui e dos pedidos que você decide</p>') +
      (antes.length ? '<p class="pl-antes">antes, nesta semana: ' + esc(antes.join(' · ')) + '</p>' : '') +
      '<footer class="pl-pe"><button type="button" class="pl-bt fraco" data-pl="ocultar">' + (dados.oculto ? 'mostrar os pontos no rodapé' : 'esconder os pontos no rodapé') + '</button></footer>';
  }
  function posicionarPop() {
    if (!pop || !casa) return;
    var r = casa.getBoundingClientRect(), w = pop.offsetWidth || 380;
    pop.style.bottom = Math.round(window.innerHeight - r.top + 8) + 'px';
    pop.style.left = Math.round(Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w))) + 'px';
  }
  function abrirPop() {
    if (!carregar()) return;
    pop = document.createElement('div');
    pop.className = 'pl-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Meus pontos · de onde veio cada um');
    document.body.appendChild(pop);
    desenharPop();
    posicionarPop();
    casa.setAttribute('aria-expanded', 'true');
    pop.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-pl]');
      if (!b) return;
      var a = b.getAttribute('data-pl');
      if (a === 'fechar') fecharPop();
      else if (a === 'sem-meta') definirMeta(0);
      else if (a === 'ocultar') { dados.oculto = !dados.oculto; salvar(); desenharCasa(true); desenharPop(); }
    });
    pop.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var inp = pop.querySelector('.pl-meta-form input'), n = Math.round(+inp.value || 0);
      if (n > 0) definirMeta(n);
    });
    if (!semMovimento() && pop.animate) pop.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'cubic-bezier(.2,0,0,1)' });
  }
  function fecharPop() {
    if (!pop) return;
    if (pop.parentNode) pop.parentNode.removeChild(pop);
    pop = null;
    if (casa) casa.setAttribute('aria-expanded', 'false');
  }
  document.addEventListener('pointerdown', function (ev) { if (pop && !pop.contains(ev.target) && !(casa && casa.contains(ev.target))) fecharPop(); }, true);
  document.addEventListener('keydown', function (ev) { if (pop && ev.key === 'Escape') { fecharPop(); if (casa) casa.focus(); } });
  window.addEventListener('resize', posicionarPop);

  function definirMeta(n) {
    if (!carregar()) return false;
    dados.meta = Math.max(0, Math.min(9999, Math.round(+n || 0)));
    salvar();
    anotar({ tipo: 'meta', meta: dados.meta });
    desenharCasa(true);
    checarOuro();
    if (pop) { desenharPop(); posicionarPop(); }
    return true;
  }

  /* ------------------------------------------------------------------ barramento */
  function ouvir(m) {
    if (!m || !m.tipo) return;
    switch (m.tipo) {
      case 'bemvindo': carregar(); garantirCasa(); desenharCasa(true); break;
      case 'agente-plano': aoPlano(m); break;
      case 'agente-espera': aoEspera(m); break;
      case 'term-aberto': if (m.info && m.info.id && m.info.nome) nomes[(m.info.dono || '') + '/' + m.info.id] = m.info.nome; break;
    }
  }
  /* o OK sai da tela para o servidor (agente-ok): a peça que manda não precisa conhecer o placar */
  var enviarEspiado = null;
  function espiarEnvio() {
    if (!BC.real || !BC.real.enviar || BC.real.enviar === enviarEspiado) return;
    var original = BC.real.enviar;
    enviarEspiado = function (msg) {
      try { if (msg && msg.tipo === 'agente-ok' && msg.pid) registrarOk(msg.pid, msg.decisao); } catch (e) { /* o envio segue de qualquer jeito */ }
      return original.apply(this, arguments);
    };
    BC.real.enviar = enviarEspiado;
  }
  var ligado = false, obs = null;
  function ligar() {
    if (!ligado && BC.real && BC.real.ouvir) { ligado = true; BC.real.ouvir(ouvir); }
    espiarEnvio();
    var st = document.getElementById('e-status');
    if (st && !obs && window.MutationObserver) {
      obs = new MutationObserver(function () { garantirCasa(); });
      obs.observe(st, { childList: true });
    }
    if (eu()) { carregar(); garantirCasa(); desenharCasa(true); }
    return ligado && !!obs;
  }
  if (!ligar()) {
    document.addEventListener('DOMContentLoaded', ligar);
    var tentativas = 0, t = setInterval(function () { if (ligar() || ++tentativas > 40) clearInterval(t); }, 250);
  }
  /* outra janela desta Estação mudou o placar: relê, sem festa */
  window.addEventListener('storage', function (ev) { if (ev.key && ev.key === chaveAtual) { carregar(); desenharCasa(true); if (pop) desenharPop(); } });
  /* o dia vira: "hoje" zera sozinho */
  setInterval(function () { if (dados && casa && !animNum && String(hoje()) !== numero.textContent) desenharCasa(true); }, 60000);

  /* ------------------------------------------------------------------ API pública */
  BC.placar = {
    versao: VERSAO,
    hoje: function () { carregar(); return hoje(); },
    semana: function () { carregar(); return semana(); },
    sequencia: function () { carregar(); return sequencia(); },
    meta: function () { carregar(); return dados ? dados.meta : 0; },
    definirMeta: definirMeta,
    eventos: function () { carregar(); return dados ? dados.eventos.slice() : []; },
    /* pontos que um plano rendeu (itens + conclusão): o rito "concluído" mostra no subtítulo */
    doPlano: function (sessao, textos) {
      if (!carregar()) return null;
      var set = {}; (textos || []).forEach(function (t) { set[norma(t)] = true; });
      var kp = 'plano:' + sessao + ':' + hash((textos || []).map(norma).join('\n'));
      return soma(function (e) { return e.sessao === sessao && ((e.tipo === 'item' && set[e.item]) || e.chave === kp); });
    },
    /* para as peças que decidem um pedido de permissão sem passar por BC.real.enviar */
    registrarOk: registrarOk,
    abrir: abrirPop, fechar: fecharPop, aberto: function () { return !!pop; },
    ouvir: function (fn) { ouvintes.push(fn); return function () { var i = ouvintes.indexOf(fn); if (i >= 0) ouvintes.splice(i, 1); }; },
    contagem: function () { return JSON.parse(JSON.stringify(cont)); },
    ultimaContagem: function () { return ultimaContagem.slice(); },
    registro: function () { return reg.slice(); },
    religar: ligar
  };
})();
