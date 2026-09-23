/* babel-coop · o mapa como carta de observatório (PLANO §1 propriedade 5, R6) — só vale dentro da Estação (embutido=1).
   O MindForge continua o mesmo editor; aqui ele ganha: o céu do observatório (anéis, retícula, azimutes) centrado na raiz,
   o HUD com dados reais (galhos, materializados, fechados, último sinal), a ficha do galho com "Materializar em…",
   o estado vivo de cada galho ligado (linha de estado, cartão ao lado, barra de progresso), a luz que anda pelos galhos
   quando o objeto ligado trabalha (pulso roxo → ciano pelo próprio fio, faíscas, meia-vida) e a apresentação galho a galho na TV.
   Regras: luz só com evento real (op "luz" da Estação); nada em laço sem dado; prefers-reduced-motion = cor sem movimento;
   aba escondida = sem pulso; no máximo 2 pulsos vivos. O som e as faíscas grandes são do organismo da Estação (BC.organismo). */
(() => {
  'use strict';
  const MF = window.mindforge;
  if (!MF || !MF.embutido) return;

  const $ = (s) => document.querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';
  const RAIZ_DOC = document.documentElement;
  RAIZ_DOC.classList.add('observatorio');
  const reduz = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const semMovimento = () => reduz.matches;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hora = (ts) => { if (!ts) return ''; const d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  const T = { tela: 'Tela', campanha: 'Campanha', demanda: 'Demanda', peca: 'Peça da Máquina' };
  const GLIFO = {
    tela: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18"/>',
    campanha: '<path d="M4 10v4h3l6 4V6l-6 4H4z"/><path d="M16.5 9a4 4 0 0 1 0 6"/>',
    demanda: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9.5 4h5v3h-5z"/><path d="M9 13.5l2 2 4-4"/>',
    peca: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>'
  };
  const glifo = (t, tam = 14) => '<svg class="mf-glifo" viewBox="0 0 24 24" width="' + tam + '" height="' + tam + '" aria-hidden="true">' + (GLIFO[t] || GLIFO.peca) + '</svg>';

  let vivo = {};                 /* noId → { p, fase, fechado, rotulo, ts, n, quem, extra } (vem da Estação) */
  let ctx = { organismo: false, editavel: false, apresentar: false, pessoas: [], eu: '' };
  let tv = null;                 /* Estação: { passo, total, no, por } quando este mapa está na TV */
  let foco = null;               /* TV: o mesmo, para focar o galho do passo */
  let fichaAberta = false, escolhendoDemanda = false;
  const luzes = new Map();       /* noId → { t, mv, forte } : meia-vida da luz de cada galho */
  let relogio = null, pulsosVivos = 0;
  const medidas = { luzes: 0, pulsos: 0, pulsosDescartados: 0, faiscasOrganismo: 0, faiscasCss: 0, focos: 0, materializar: 0 };
  MF.medidas = () => JSON.parse(JSON.stringify(medidas));

  const enviar = (m) => { try { window.parent.postMessage(m, '*'); } catch (e) { /* sem a Estação */ } };
  const estado = () => MF.estado();
  const raiz = () => estado().nodes.find((n) => !n.parent);
  const profundidade = (n) => { let d = 0, p = n; while (p && p.parent) { d++; p = MF.byId(p.parent); } return d; };
  const cadeia = (id) => { const r = []; let n = MF.byId(id); while (n) { r.unshift(n.id); n = n.parent ? MF.byId(n.parent) : null; } return r; };
  const subarvore = (id) => { const r = [id]; for (let i = 0; i < r.length; i++) MF.children(r[i]).forEach((c) => r.push(c.id)); return r; };
  const noEl = (id) => document.querySelector('.node[data-id="' + CSS.escape(id) + '"]');
  const fioEl = (id) => document.querySelector('#connections path[data-filho="' + CSS.escape(id) + '"]');
  const fechado = (n) => !!(n && (n.fechado || (vivo[n.id] && vivo[n.id].fechado)));

  /* ------------------------------------------------------------------ camadas */
  const world = $('#world');
  const ceu = document.createElementNS(NS, 'svg');
  ceu.id = 'observatorio'; ceu.setAttribute('aria-hidden', 'true');
  world.insertBefore(ceu, world.firstChild);
  const camadaPulsos = document.createElementNS(NS, 'svg');
  camadaPulsos.id = 'mf-pulsos'; camadaPulsos.setAttribute('aria-hidden', 'true');
  world.insertBefore(camadaPulsos, $('#nodes'));
  const defsPulsos = document.createElementNS(NS, 'defs');
  camadaPulsos.appendChild(defsPulsos);

  const hud = document.createElement('div');
  hud.className = 'mf-hud-sup'; hud.setAttribute('aria-live', 'polite');
  const ficha = document.createElement('aside');
  ficha.className = 'mf-ficha glass'; ficha.id = 'mf-ficha'; ficha.hidden = true; ficha.setAttribute('aria-label', 'Ficha do galho');
  const legenda = document.createElement('div');
  legenda.className = 'mf-legenda glass'; legenda.id = 'mf-legenda'; legenda.hidden = true; legenda.setAttribute('aria-live', 'polite');
  const barraTv = document.createElement('div');
  barraTv.className = 'mf-barra-tv glass'; barraTv.id = 'mf-barra-tv'; barraTv.hidden = true;
  const faiscasCamada = document.createElement('div');
  faiscasCamada.className = 'mf-faiscas'; faiscasCamada.setAttribute('aria-hidden', 'true');
  const app = $('#app');
  [hud, ficha, legenda, barraTv, faiscasCamada].forEach((x) => app.appendChild(x));

  /* botões novos: materializar (caixa de ferramentas) e levar para a TV (barra de ações) */
  const matBtn = document.createElement('button');
  matBtn.className = 'tool mf-mat-btn'; matBtn.id = 'mfMatBtn'; matBtn.title = 'Materializar o galho selecionado'; matBtn.setAttribute('aria-label', 'Materializar o galho selecionado');
  matBtn.innerHTML = glifo('peca', 18);
  $('#toolbox').appendChild(matBtn);
  const tvBtn = document.createElement('button');
  tvBtn.className = 'icon-btn mf-tv-btn'; tvBtn.id = 'mfTvBtn'; tvBtn.title = 'Levar o mapa para a TV, galho a galho'; tvBtn.setAttribute('aria-label', 'Levar o mapa para a TV');
  tvBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/></svg><span>TV</span>';
  const shareBtn = $('#shareBtn');
  shareBtn.parentNode.insertBefore(tvBtn, shareBtn);

  /* menu do galho: materializar, ir até, fechar */
  const menuMat = document.createElement('div');
  menuMat.className = 'mf-menu';
  const menu = $('#contextMenu');
  menu.insertBefore(menuMat, menu.querySelector('span'));

  /* ------------------------------------------------------------------ o céu do observatório (estático: é a carta, não é luz) */
  function desenharCeu() {
    const r = raiz();
    if (!r) { ceu.innerHTML = ''; return; }
    const cx = r.x, cy = r.y, W = 4000, H = 3000;
    let s = '';
    [170, 340, 540, 760, 1000, 1280].forEach((raio, i) => { s += '<circle class="mf-anel' + (i === 3 ? ' forte' : '') + '" cx="' + cx + '" cy="' + cy + '" r="' + raio + '"/>'; });
    let marcas = '';
    for (let i = 0; i < 144; i++) {
      const a = (i / 144) * Math.PI * 2, longa = i % 12 === 0, r1 = 760, r2 = longa ? 736 : 748;
      marcas += 'M' + (cx + Math.cos(a) * r1).toFixed(1) + ' ' + (cy + Math.sin(a) * r1).toFixed(1) + 'L' + (cx + Math.cos(a) * r2).toFixed(1) + ' ' + (cy + Math.sin(a) * r2).toFixed(1);
    }
    s += '<path class="mf-marcas" d="' + marcas + '"/>';
    s += '<path class="mf-reticula" d="M' + (cx - 1500) + ' ' + cy + 'H' + (cx + 1500) + 'M' + cx + ' ' + (cy - 1400) + 'V' + (cy + 1400) +
      'M' + (cx - 1000) + ' ' + (cy - 1000) + 'L' + (cx + 1000) + ' ' + (cy + 1000) + 'M' + (cx + 1000) + ' ' + (cy - 1000) + 'L' + (cx - 1000) + ' ' + (cy + 1000) + '"/>';
    [['000', 0, -792], ['090', 800, 4], ['180', 0, 808], ['270', -800, 4]].forEach((z) => { s += '<text class="mf-azimute" x="' + (cx + z[1]) + '" y="' + (cy + z[2]) + '">' + z[0] + '</text>'; });
    ceu.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    ceu.innerHTML = s;
  }

  /* ------------------------------------------------------------------ decorar os galhos depois de cada desenho */
  function linhaEstado(n, v) {
    const li = n.liga;
    if (fechado(n)) return '✓ ' + esc((v && v.rotulo) || 'fechado') + (v && v.ts ? ' · ' + hora(v.ts) : '');
    if (!li) return '';
    return esc(T[li.tipo] || li.tipo).toUpperCase() + ' · ' + esc((v && v.rotulo) || 'nasceu') + (v && v.ts ? ' · ' + hora(v.ts) : '');
  }
  function cartao(n, v) {
    const li = n.liga, x = (v && v.extra) || {}, p = Math.max(0, Math.min(1, (v && v.p) || 0));
    let miolo = '';
    if (li.tipo === 'tela') miolo = '<div class="mf-mini"><i></i><b>' + esc(x.titulo || n.text) + '</b>' + (x.secoes || []).slice(0, 2).map((s) => '<span>' + esc(s) + '</span>').join('') + '</div>';
    if (li.tipo === 'campanha') {
      const c = 2 * Math.PI * 13;
      const pontos = (x.pecas || []).map((k) => '<i class="' + (k.ok ? 'ok' : k.pronta ? 'pronta' : '') + '" title="' + esc(k.titulo) + '"></i>').join('');
      miolo = '<div class="mf-anel-c"><svg viewBox="0 0 34 34" width="34" height="34" aria-hidden="true"><circle cx="17" cy="17" r="13" class="trilho"/><circle cx="17" cy="17" r="13" class="valor" stroke-dasharray="' + (c * p).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 17 17)"/></svg>' +
        '<span><b>' + (x.alvo ? x.atual + '/' + x.alvo : Math.round(p * 100) + '%') + '</b>' + (pontos ? '<em class="mf-pontos">' + pontos + '</em>' : '') + '</span></div>';
    }
    if (li.tipo === 'demanda' && x.pessoa) miolo = '<div class="mf-pessoa"><i style="--cor:' + esc(x.pessoa.cor || '#5d6b78') + '">' + esc(x.pessoa.iniciais) + '</i><span>' + esc(x.pessoa.nome) + '</span></div>';
    if (li.tipo === 'peca') miolo = '<div class="mf-peca">' + glifo('peca', 22) + '<span>' + esc(li.rotulo || n.text) + '</span></div>';
    return '<div class="mf-cartao tipo-' + esc(li.tipo) + (v && v.fase === 'andando' ? ' vivo' : '') + '"><div class="mf-c-cab">' + glifo(li.tipo, 12) + '<span>' + esc(T[li.tipo]) + '</span></div>' + miolo +
      '<div class="mf-c-end" title="' + esc(x.endereco || '') + '">' + esc(x.endereco || li.rotulo || '') + '</div><div class="mf-c-barra"><i style="width:' + Math.round(p * 100) + '%"></i></div></div>';
  }
  function decorar() {
    const r = raiz(), st = estado();
    document.querySelectorAll('#connections path').forEach((p) => p.classList.remove('viva', 'fechada', 'mf-fora'));
    document.querySelectorAll('#nodes .node').forEach((el) => {
      const n = MF.byId(el.dataset.id);
      if (!n) return;
      el.querySelectorAll('.mf-linha, .mf-cartao, .mf-selo, .mf-na-tv').forEach((x) => x.remove());
      const nivel = profundidade(n);
      el.classList.remove('nivel-0', 'nivel-1', 'nivel-2', 'nivel-3', 'ligado', 'fechado', 'esq', 'mf-fora', 'tipo-tela', 'tipo-campanha', 'tipo-demanda', 'tipo-peca');
      el.classList.add('nivel-' + Math.min(nivel, 3));
      if (r && n.x < r.x) el.classList.add('esq');
      const v = vivo[n.id], fech = fechado(n);
      el.style.setProperty('--p', v ? String(Math.max(0, Math.min(1, v.p || 0))) : '0');
      if (n.liga) { el.classList.add('ligado', 'tipo-' + n.liga.tipo); }
      if (fech) el.classList.add('fechado');
      const linha = linhaEstado(n, v);
      if (linha) { const s = document.createElement('span'); s.className = 'mf-linha'; s.innerHTML = (n.liga ? glifo(n.liga.tipo, 11) : '') + '<span>' + linha + '</span>'; el.appendChild(s); }
      if (n.liga && !MF.children(n.id).length) el.insertAdjacentHTML('beforeend', cartao(n, v));
      if (fech) el.insertAdjacentHTML('beforeend', '<i class="mf-selo" title="galho fechado" aria-label="galho fechado">✓</i>');
      if (tv && tv.no === n.id) el.insertAdjacentHTML('beforeend', '<i class="mf-na-tv">NA TV</i>');
      if (n.liga || fech) cadeia(n.id).slice(1).forEach((id) => { const f = fioEl(id); if (f) f.classList.add(fech && id === n.id ? 'fechada' : 'viva'); });
      const l = luzes.get(n.id);
      if (l) aplicarLuz(el, nivelLuz(l));
    });
    if (foco) marcarFoco();
    desenharCeu();
    atualizarHud();
    atualizarFicha();
    atualizarMenu();
    atualizarBarraTv();
    if (st && foco !== null) atualizarLegenda();
  }
  MF.ganchos.desenhou.push(decorar);
  /* a ficha abre quando a PESSOA toca um galho (o agente selecionar um galho novo não abre nada por cima do mapa) */
  let toque = 0;
  $('#nodes').addEventListener('pointerdown', (e) => { if (e.target.closest('.node')) toque = performance.now(); }, true);
  $('#nodes').addEventListener('contextmenu', () => { toque = performance.now(); }, true);
  MF.ganchos.selecionou.push(() => {
    escolhendoDemanda = false;
    if (performance.now() - toque < 400) fichaAberta = true;
    atualizarFicha(); atualizarMenu();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && fichaAberta) { fichaAberta = false; ficha.hidden = true; } });

  /* ------------------------------------------------------------------ HUD: só número de verdade */
  function atualizarHud() {
    const st = estado(), total = st.nodes.length;
    const lig = st.nodes.filter((n) => n.liga).length, fech = st.nodes.filter(fechado).length;
    let ultimo = null;
    Object.keys(vivo).forEach((id) => { const v = vivo[id]; if (v && v.ts && (!ultimo || v.ts > ultimo.ts)) ultimo = Object.assign({ id }, v); });
    const nUlt = ultimo && MF.byId(ultimo.id);
    hud.innerHTML = '<b>MAPA · OBSERVATÓRIO</b>' +
      '<span>GALHOS ' + total + ' · MATERIALIZADOS ' + lig + ' · FECHADOS ' + fech + '</span>' +
      (nUlt ? '<span class="mf-sinal">ÚLTIMO SINAL ' + hora(ultimo.ts) + ' · ' + esc(nUlt.text) + ' · ' + esc(ultimo.rotulo || '') + '</span>' : '<span class="mf-sem">SEM SINAL · nenhum galho materializado ainda</span>');
  }

  /* ------------------------------------------------------------------ a ficha do galho */
  function atualizarFicha() {
    const n = MF.byId(MF.selecionado());
    const presente = document.body.classList.contains('presentation');
    const inspetor = !$('#inspector').hidden;
    if (!n || !fichaAberta || presente || inspetor) { ficha.hidden = true; return; }
    const v = vivo[n.id], li = n.liga, fech = fechado(n), podeMexer = ctx.editavel && !document.body.classList.contains('somente-ver');
    const trilha = cadeia(n.id).map((id) => esc((MF.byId(id) || {}).text || '')).join(' › ');
    let h = '<header><span class="mf-rot">GALHO · NÍVEL ' + profundidade(n) + '</span><button type="button" class="icon-btn small" data-f="fechar-ficha" aria-label="Fechar a ficha">×</button></header>' +
      '<h3>' + esc(n.text) + '</h3><p class="mf-trilha">' + trilha + '</p>';
    if (li) {
      const p = Math.round(Math.max(0, Math.min(1, (v && v.p) || 0)) * 100);
      h += '<div class="mf-liga' + (v && v.fase === 'andando' ? ' vivo' : '') + '"><span class="mf-chip">' + glifo(li.tipo, 13) + esc(T[li.tipo]) + '</span>' +
        '<p class="mf-end">' + esc(((v && v.extra && v.extra.endereco) || (li.endereco && li.endereco.texto)) || li.rotulo || '') + '</p>' +
        '<div class="mf-barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '"><i style="width:' + p + '%"></i></div>' +
        '<p class="mf-est">' + esc((v && v.rotulo) || 'nasceu') + (v && v.ts ? ' · ' + hora(v.ts) : '') + '</p>' +
        '<p class="mf-dica">nasceu de ' + esc(nomeDe(li.por)) + ' · ' + hora(li.em) + ' · a luz anda por este galho quando o objeto trabalha</p>' +
        '<div class="mf-acoes"><button type="button" class="mf-botao primario" data-f="ir">↗ Ir até</button>' +
        (podeMexer && !fech ? '<button type="button" class="mf-botao" data-f="fechar">✓ Fechar galho</button>' : '') +
        (podeMexer && n.fechado ? '<button type="button" class="mf-botao" data-f="reabrir">Reabrir</button>' : '') + '</div></div>';
    } else if (podeMexer) {
      h += '<p class="mf-rot">MATERIALIZAR EM…</p><div class="mf-grade">' +
        ['tela', 'campanha', 'demanda', 'peca'].map((t) => '<button type="button" class="mf-botao' + (t === 'demanda' && escolhendoDemanda ? ' ativo' : '') + '" data-mat="' + t + '">' + glifo(t, 16) + '<span>' + T[t] + '</span></button>').join('') + '</div>';
      if (escolhendoDemanda) {
        h += '<p class="mf-rot">DEMANDA PARA</p><div class="mf-pessoas"><button type="button" class="mf-botao" data-para="livre">livre · pega quem puder</button>' +
          ctx.pessoas.filter((p) => p.id !== ctx.eu).map((p) => '<button type="button" class="mf-pessoa-b' + (p.online ? '' : ' off') + '" data-para="' + esc(p.id) + '" title="' + esc(p.nome) + (p.online ? '' : ' · offline') + '"><i style="--cor:' + esc(p.cor || '#5d6b78') + '">' + esc(p.iniciais) + '</i>' + esc(p.nome) + '</button>').join('') + '</div>';
      }
      h += '<p class="mf-dica">O objeto nasce de verdade no babel-coop e fica ligado a este galho, com endereço.</p>' +
        (fech ? '' : '<div class="mf-acoes"><button type="button" class="mf-botao discreto" data-f="fechar">✓ Fechar galho sem objeto</button></div>');
      if (n.fechado) h += '<div class="mf-acoes"><button type="button" class="mf-botao" data-f="reabrir">Reabrir</button></div>';
    } else {
      h += '<p class="mf-dica">' + (fech ? '✓ Galho fechado. ' : '') + 'Mapa só para ver: quem materializa é o dono ou a gestão.</p>';
    }
    ficha.innerHTML = h;
    ficha.classList.toggle('vivo', !!(v && v.fase === 'andando'));
    const abrindo = ficha.hidden;
    ficha.hidden = false;
    if (abrindo || ficha.dataset.no !== n.id) { ficha.dataset.no = n.id; requestAnimationFrame(() => garantirVisivel(n.id)); }
  }
  /* o galho que a pessoa está mexendo fica à vista, fora da ficha e das barras (desliza, não salta) */
  function garantirVisivel(id) {
    const el = noEl(id);
    if (!el || ficha.hidden) return;
    const r = el.getBoundingClientRect(), f = ficha.getBoundingClientRect();
    const livre = { esq: 70, dir: f.left > innerWidth / 3 ? f.left - 24 : innerWidth - 24, cima: 64, baixo: f.left > innerWidth / 3 ? innerHeight - 70 : f.top - 24 };
    let dx = 0, dy = 0;
    if (r.right > livre.dir) dx = livre.dir - r.right; else if (r.left < livre.esq) dx = livre.esq - r.left;
    if (r.bottom > livre.baixo) dy = livre.baixo - r.bottom; else if (r.top < livre.cima) dy = livre.cima - r.top;
    if (!dx && !dy) return;
    const t = MF.transform();
    voar({ x: t.x + dx, y: t.y + dy });
  }
  function nomeDe(id) { const p = ctx.pessoas.find((x) => x.id === id); return p ? p.nome : (id || 'alguém'); }

  function atualizarMenu() {
    const n = MF.byId(MF.selecionado()), pode = ctx.editavel && !document.body.classList.contains('somente-ver');
    if (!n) { menuMat.innerHTML = ''; return; }
    let h = '<span class="mf-menu-sep"></span>';
    if (n.liga) h += '<button type="button" data-f="ir">↗ Ir até ' + esc(T[n.liga.tipo]) + '</button>';
    else if (pode) h += '<small>Materializar em</small><div class="mf-menu-linha">' + ['tela', 'campanha', 'demanda', 'peca'].map((t) => '<button type="button" data-mat="' + t + '" title="Materializar em ' + T[t] + '">' + glifo(t, 14) + (t === 'peca' ? 'Peça' : T[t]) + '</button>').join('') + '</div>';
    if (pode && !fechado(n)) h += '<button type="button" data-f="fechar">✓ Fechar galho</button>';
    menuMat.innerHTML = h;
  }

  /* ------------------------------------------------------------------ cliques (ficha, menu, barra da TV) */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mat], [data-para], [data-f], [data-tv]');
    if (!b) return;
    const id = MF.selecionado();
    if (b.dataset.mat) {
      MF.hideContext();
      if (b.dataset.mat === 'demanda') { escolhendoDemanda = !escolhendoDemanda || !!b.closest('.mf-menu'); fichaAberta = true; atualizarFicha(); return; }
      medidas.materializar++;
      enviar({ tipo: 'babel-mapa-acao', acao: 'materializar', no: id, em: b.dataset.mat });
      return;
    }
    if (b.dataset.para) { escolhendoDemanda = false; medidas.materializar++; enviar({ tipo: 'babel-mapa-acao', acao: 'materializar', no: id, em: 'demanda', para: b.dataset.para }); return; }
    if (b.dataset.f === 'fechar-ficha') { fichaAberta = false; ficha.hidden = true; return; }
    if (b.dataset.f) { MF.hideContext(); enviar({ tipo: 'babel-mapa-acao', acao: b.dataset.f, no: id }); return; }
    if (b.dataset.tv) enviar({ tipo: 'babel-mapa-acao', acao: 'tv', passo: b.dataset.tv });
  });
  matBtn.addEventListener('click', () => { fichaAberta = true; escolhendoDemanda = false; atualizarFicha(); });
  tvBtn.addEventListener('click', () => enviar({ tipo: 'babel-mapa-acao', acao: 'tv', passo: tv ? 'encerrar' : 'comecar' }));
  $('#closeInspector').addEventListener('click', () => setTimeout(atualizarFicha, 0));

  /* ------------------------------------------------------------------ a luz: meia-vida de cada galho (4 Hz, só enquanto houver luz) */
  function nivelLuz(l) { const k = Math.pow(2, -(performance.now() - l.t) / l.mv); return semMovimento() ? (k > 0.6 ? 1 : k > 0.2 ? 0.35 : 0) : k; }
  function aplicarLuz(el, k) { el.style.setProperty('--luz', k.toFixed(3)); }
  function passoLuz() {
    if (document.hidden) return;
    luzes.forEach((l, id) => {
      const k = nivelLuz(l), el = noEl(id);
      if (k < 0.02) { luzes.delete(id); if (el) el.style.setProperty('--luz', '0'); return; }
      if (el) aplicarLuz(el, k);
    });
    if (!luzes.size) { clearInterval(relogio); relogio = null; }
  }
  function acender(id, forte) {
    luzes.set(id, { t: performance.now(), mv: forte ? 9000 : 6000, forte });
    const el = noEl(id);
    if (el) aplicarLuz(el, 1);
    if (!relogio) relogio = setInterval(passoLuz, 250);
  }

  /* o pulso roxo → ciano corre pelo próprio fio, da raiz até o galho; ao chegar o galho acende, respira e solta faíscas */
  function mistura(k) { const a = [163, 118, 233], b = [42, 213, 229]; return 'rgb(' + a.map((x, i) => Math.round(x + (b[i] - x) * k)).join(',') + ')'; }
  let seqPulso = 0;
  function luz(id, forte) {
    const n = MF.byId(id);
    if (!n) return;
    medidas.luzes++;
    (medidas.origem = medidas.origem || []).push(n.text + (forte ? " (forte)" : "")); if (medidas.origem.length > 30) medidas.origem.shift();
    const ids = cadeia(id).slice(1), fios = ids.map(fioEl).filter(Boolean);
    const semPulso = semMovimento() || document.hidden || !fios.length;
    if (!semPulso && pulsosVivos >= 2) medidas.pulsosDescartados++;
    if (semPulso || pulsosVivos >= 2) { chegou(id, forte, true); return; }
    pulsosVivos++; medidas.pulsos++;
    const dur = forte ? 1100 : 720, porFio = dur / fios.length;
    fios.forEach((f, i) => {
      const d = f.getAttribute('d'), len = f.getTotalLength(), cauda = Math.min(110, Math.max(36, len * 0.5));
      const a = f.getPointAtLength(0), b = f.getPointAtLength(len), gid = 'mfp' + (++seqPulso);
      const gr = document.createElementNS(NS, 'linearGradient');
      gr.id = gid; gr.setAttribute('gradientUnits', 'userSpaceOnUse');
      gr.setAttribute('x1', a.x); gr.setAttribute('y1', a.y); gr.setAttribute('x2', b.x); gr.setAttribute('y2', b.y);
      gr.innerHTML = '<stop offset="0" stop-color="' + mistura(i / fios.length) + '"/><stop offset="1" stop-color="' + mistura((i + 1) / fios.length) + '"/>';
      defsPulsos.appendChild(gr);
      const q = document.createElementNS(NS, 'path');
      q.setAttribute('d', d); q.setAttribute('class', 'mf-pulso' + (forte ? ' forte' : ''));
      q.setAttribute('stroke', 'url(#' + gid + ')');
      q.style.strokeDasharray = cauda + ' ' + (len + cauda + 10);
      q.style.strokeDashoffset = String(cauda);
      camadaPulsos.appendChild(q);
      const an = q.animate([{ strokeDashoffset: cauda }, { strokeDashoffset: -len }], { duration: porFio * 1.45, delay: i * porFio, easing: 'cubic-bezier(.2,0,0,1)', fill: 'both' });
      const fim = () => { q.remove(); gr.remove(); };
      an.onfinish = fim; an.oncancel = fim;
    });
    setTimeout(() => { pulsosVivos = Math.max(0, pulsosVivos - 1); chegou(id, forte, false); }, dur);
  }
  function chegou(id, forte, direto) {
    acender(id, forte);
    const el = noEl(id);
    if (!el) return;
    if (!semMovimento() && !document.hidden) { el.classList.remove('mf-respira'); void el.offsetWidth; el.classList.add('mf-respira'); setTimeout(() => el.classList.remove('mf-respira'), 1300); }
    if (semMovimento() || document.hidden) return;
    const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + 2, n = forte ? 12 : 5;
    if (ctx.organismo) { medidas.faiscasOrganismo++; enviar({ tipo: 'babel-mapa-faiscas', x, y, n, forte: !!forte }); return; }
    medidas.faiscasCss++;
    for (let i = 0; i < n; i++) {
      const f = document.createElement('i'), ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.8, v = 26 + Math.random() * (forte ? 44 : 26);
      f.className = 'mf-faisca' + (i % 2 ? ' ciano' : '');
      f.style.left = x + 'px'; f.style.top = y + 'px';
      f.style.setProperty('--dx', (Math.cos(ang) * v).toFixed(1) + 'px'); f.style.setProperty('--dy', (Math.sin(ang) * v).toFixed(1) + 'px');
      faiscasCamada.appendChild(f);
      setTimeout(() => f.remove(), 950);
    }
  }
  MF.luz = luz; /* para teste manual no console */

  /* ------------------------------------------------------------------ TV: galho a galho */
  function marcarFoco() {
    const alvo = foco && foco.no ? MF.byId(foco.no) : null;
    if (!alvo) { document.querySelectorAll('.mf-fora').forEach((x) => x.classList.remove('mf-fora')); return; }
    const ver = new Set(cadeia(alvo.id).concat(subarvore(alvo.id)));
    document.querySelectorAll('#nodes .node').forEach((el) => el.classList.toggle('mf-fora', !ver.has(el.dataset.id)));
    document.querySelectorAll('#connections path').forEach((p) => p.classList.toggle('mf-fora', !ver.has(p.dataset.filho)));
  }
  function voar(t) {
    if (semMovimento()) { MF.definirTransform(t); return; }
    world.classList.add('mf-voo');
    MF.definirTransform(t);
    setTimeout(() => world.classList.remove('mf-voo'), 950);
  }
  function enquadrar(ids) {
    const nos = ids.map((i) => MF.byId(i)).filter(Boolean);
    if (!nos.length) return;
    const minX = Math.min(...nos.map((n) => n.x)) - 190, maxX = Math.max(...nos.map((n) => n.x)) + 190;
    const minY = Math.min(...nos.map((n) => n.y)) - 90, maxY = Math.max(...nos.map((n) => n.y)) + 150;
    const alto = innerHeight - (foco ? 190 : 120);
    const s = Math.min(1.7, Math.max(0.2, Math.min((innerWidth - 120) / (maxX - minX), alto / (maxY - minY))));
    voar({ scale: s, x: innerWidth / 2 - ((minX + maxX) / 2) * s, y: (alto / 2 + 30) - ((minY + maxY) / 2) * s });
  }
  function atualizarLegenda() {
    if (!foco) { legenda.hidden = true; return; }
    const st = estado();
    if (!foco.no) {
      const lig = st.nodes.filter((n) => n.liga).length, fech = st.nodes.filter(fechado).length;
      legenda.innerHTML = '<span class="mf-rot">VISÃO GERAL · ' + foco.total + ' GALHOS · APRESENTADO POR ' + esc(String(foco.por || '').toUpperCase()) + '</span><h2>' + esc(st.title) + '</h2><p>' + lig + ' materializado' + (lig === 1 ? '' : 's') + ' · ' + fech + ' fechado' + (fech === 1 ? '' : 's') + '</p>';
      legenda.hidden = false;
      return;
    }
    const n = MF.byId(foco.no);
    if (!n) { legenda.hidden = true; return; }
    const v = vivo[n.id], li = n.liga, sub = subarvore(n.id).slice(1).map((i) => MF.byId(i)), subF = sub.filter(fechado).length;
    legenda.innerHTML = '<span class="mf-rot">GALHO ' + (foco.passo + 1) + ' DE ' + foco.total + ' · APRESENTADO POR ' + esc(String(foco.por || '').toUpperCase()) + '</span>' +
      '<h2>' + (fechado(n) ? '<i class="mf-ok">✓</i> ' : '') + esc(n.text) + '</h2>' +
      '<p>' + (li ? glifo(li.tipo, 16) + esc(T[li.tipo]) + ' · ' + esc(((v && v.extra && v.extra.endereco) || (li.endereco && li.endereco.texto)) || li.rotulo || '') + (v ? ' · ' + esc(v.rotulo || '') + (v.ts ? ' · ' + hora(v.ts) : '') : '') : 'ainda não materializado') + '</p>' +
      (sub.length ? '<p class="mf-sub">' + sub.length + ' subgalho' + (sub.length === 1 ? '' : 's') + ' · ' + subF + ' fechado' + (subF === 1 ? '' : 's') + '</p>' : '');
    legenda.hidden = false;
  }
  function aplicarFoco(info) {
    const antes = foco;
    foco = info;
    medidas.focos++;
    marcarFoco();
    atualizarLegenda();
    if (!info) { legenda.hidden = true; MF.fitView(); return; }
    if (!info.no) { MF.fitView(); return; }
    const alvos = cadeia(info.no).slice(-1).concat(subarvore(info.no));
    enquadrar(alvos);
    if (!antes) setTimeout(() => { if (foco && foco.no === info.no) enquadrar(alvos); }, 180); /* o primeiro foco chega junto com o fitView de abertura */
    if (!antes || antes.no !== info.no) setTimeout(() => luz(info.no, false), semMovimento() ? 0 : 520);
  }
  function atualizarBarraTv() {
    tvBtn.classList.toggle('ativo', !!tv);
    tvBtn.title = tv ? 'Encerrar a apresentação na TV' : 'Levar o mapa para a TV, galho a galho';
    if (!tv || document.body.classList.contains('presentation')) { barraTv.hidden = true; return; }
    const n = tv.no ? MF.byId(tv.no) : null;
    barraTv.innerHTML = '<span class="mf-rot">NA TV</span><b>' + (n ? 'galho ' + (tv.passo + 1) + ' de ' + tv.total + ' · ' + esc(n.text) : 'visão geral') + '</b>' +
      '<button type="button" class="icon-btn small" data-tv="anterior" aria-label="Galho anterior"' + (tv.passo <= 0 ? ' disabled' : '') + '>‹</button>' +
      '<button type="button" class="icon-btn small" data-tv="proximo" aria-label="Próximo galho"' + (tv.passo >= tv.total ? ' disabled' : '') + '>›</button>' +
      '<button type="button" class="mf-botao discreto" data-tv="encerrar">encerrar</button>';
    barraTv.hidden = false;
  }

  /* ------------------------------------------------------------------ mensagens da Estação */
  window.addEventListener('message', (e) => {
    const m = e.data || {};
    if (m.tipo !== 'babel-mapa') return;
    if (m.op === 'vivo') { vivo = m.vivo || {}; ctx = Object.assign(ctx, m.contexto || {}); decorar(); }
    if (m.op === 'luz' && m.no) luz(m.no, !!m.forte);
    if (m.op === 'tv') { tv = m.tv || null; decorar(); }
    if (m.op === 'foco') aplicarFoco(m.tv || null);
    if (m.op === 'apresentar' || m.op === 'somente-ver') setTimeout(decorar, 0);
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && luzes.size && !relogio) relogio = setInterval(passoLuz, 250); });

  decorar();
  enviar({ tipo: 'babel-mapa-observatorio' }); /* pronto para receber o estado vivo (a Estação reenvia se já tinha mandado) */
})();
