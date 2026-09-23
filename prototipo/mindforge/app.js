(() => {
  'use strict';

  const COLORS = ['#31d5d3', '#2b8ef1', '#b26cff', '#ed46a7', '#ff715b', '#f0b53e', '#6bc86d', '#94a2a8'];
  const WORLD = { width: 4000, height: 3000 };
  const STORAGE_KEY = 'mindforge-map-v1';

  const seed = [
    { id: 'root', parent: null, text: 'REINO', x: 2000, y: 1430, color: '#2b8ef1', shape: 'pill', size: 16, bold: true },
    { id: 'plan', parent: 'root', text: 'Plano de Ação', x: 2270, y: 1430, color: '#31d5d3', shape: 'underline' },
    { id: 'period', parent: 'plan', text: '14 de Setembro a 23 de Outubro', x: 2520, y: 1430, color: '#31d5d3', shape: 'underline' },
    { id: 'w3', parent: 'period', text: 'Terceira Semana (8 a 14)', x: 2770, y: 1000, color: '#31d5d3' },
    { id: 'd27', parent: 'w3', text: '27/09 Domingo', x: 3010, y: 650, color: '#f0b53e' },
    { id: 'd27a', parent: 'd27', text: 'Grupo de co-fundadores', x: 3235, y: 585, color: '#31d5d3' },
    { id: 'd27b', parent: 'd27', text: 'Ranking de co-fundadores', x: 3235, y: 625, color: '#31d5d3' },
    { id: 'd27c', parent: 'd27', text: 'Canal do Reino', x: 3235, y: 665, color: '#31d5d3' },
    { id: 'guilds', parent: 'd27c', text: 'Guildas', x: 3450, y: 625, color: '#2b8ef1' },
    { id: 'intel', parent: 'd27c', text: 'Inteligência de Mercado', x: 3450, y: 665, color: '#ed46a7' },
    { id: 'buy', parent: 'd27c', text: 'Central de Compras Coletiva', x: 3450, y: 705, color: '#ed46a7' },
    { id: 'd28', parent: 'w3', text: '28/09 Segunda', x: 3010, y: 870, color: '#f0b53e' },
    { id: 'd28a', parent: 'd28', text: 'Página de Autoridades', x: 3235, y: 820, color: '#ed46a7' },
    { id: 'd28b', parent: 'd28', text: 'Grupos de Lideranças', x: 3235, y: 870, color: '#2b8ef1' },
    { id: 'd28c', parent: 'd28', text: 'Eventos', x: 3235, y: 920, color: '#ff715b' },
    { id: 'd29', parent: 'w3', text: '29/09 Terça', x: 3010, y: 1100, color: '#f0b53e' },
    { id: 'd29a', parent: 'd29', text: 'Conselho', x: 3235, y: 1040, color: '#31d5d3' },
    { id: 'd29b', parent: 'd29', text: 'Mesas Executivas', x: 3235, y: 1080, color: '#31d5d3' },
    { id: 'd29c', parent: 'd29', text: 'Corte', x: 3235, y: 1120, color: '#31d5d3' },
    { id: 'd29d', parent: 'd29', text: 'Conexões Estratégicas', x: 3235, y: 1160, color: '#f0b53e' },
    { id: 'd30', parent: 'w3', text: '30/09 Quarta', x: 3010, y: 1320, color: '#f0b53e' },
    { id: 'd30a', parent: 'd30', text: 'Canal do Reino', x: 3235, y: 1280, color: '#31d5d3' },
    { id: 'd30b', parent: 'd30', text: 'Níveis: Marquês · Duque · Príncipe · Rei · Imperador', x: 3270, y: 1340, color: '#b26cff' },
    { id: 'w4', parent: 'period', text: 'Quarta Semana (15 a 21)', x: 2770, y: 1700, color: '#31d5d3' },
    { id: 'd04', parent: 'w4', text: '04/10 Domingo', x: 3010, y: 1540, color: '#f0b53e' },
    { id: 'd04a', parent: 'd04', text: 'Conteúdo sobre network', x: 3240, y: 1510, color: '#31d5d3' },
    { id: 'd04b', parent: 'd04', text: 'Grupo Pré-Duques', x: 3240, y: 1560, color: '#2b8ef1' },
    { id: 'd05', parent: 'w4', text: '05/10 Segunda', x: 3010, y: 1700, color: '#f0b53e' },
    { id: 'd05a', parent: 'd05', text: 'Mostrar atendimento da Babel', x: 3260, y: 1670, color: '#31d5d3' },
    { id: 'd05b', parent: 'd05', text: 'Mostrar resultado do atendimento', x: 3260, y: 1720, color: '#31d5d3' },
    { id: 'd06', parent: 'w4', text: '06/10 Terça', x: 3010, y: 1850, color: '#f0b53e' },
    { id: 'd06a', parent: 'd06', text: 'Meet com convidados dos pré-duques', x: 3280, y: 1850, color: '#31d5d3' },
    { id: 'w5', parent: 'period', text: 'Quinta Semana (22 a 28)', x: 2770, y: 2170, color: '#31d5d3' },
    { id: 'd11', parent: 'w5', text: '11/10 Domingo', x: 3010, y: 2080, color: '#f0b53e' },
    { id: 'd12', parent: 'w5', text: '12/10 Segunda', x: 3010, y: 2170, color: '#f0b53e' },
    { id: 'd13', parent: 'w5', text: '13/10 Terça', x: 3010, y: 2260, color: '#f0b53e' },
  ];

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const viewport = $('#viewport');
  const world = $('#world');
  const nodesEl = $('#nodes');
  const svg = $('#connections');
  const ctx = $('#minimap').getContext('2d');
  const els = {
    zoom: $('#zoomLabel'), inspector: $('#inspector'), note: $('#noteInput'), font: $('#fontSize'), bold: $('#boldToggle'),
    searchPanel: $('#searchPanel'), search: $('#searchInput'), searchCount: $('#searchCount'), context: $('#contextMenu'), toast: $('#toast')
  };

  /* Dentro do Babel Coop o mapa é um arquivo .mapa da pessoa: o conteúdo chega da Estação por postMessage
     e cada mudança volta para ela (que grava, versiona e espelha na TV). Fora do Babel, continua o localStorage. */
  const EMBUTIDO = window.parent !== window && /embutido=1/.test(location.search);
  let state = EMBUTIDO ? { nodes: [], title: 'Sem título' } : (load() || { nodes: seed, title: 'REINO' });
  let avisarTimer;
  let ultimoEnviado = '';
  function avisarBabel() {
    if (!EMBUTIDO) return;
    clearTimeout(avisarTimer);
    avisarTimer = setTimeout(() => {
      const json = JSON.stringify(state);
      if (json === ultimoEnviado) return;
      ultimoEnviado = json;
      window.parent.postMessage({ tipo: 'babel-mapa-mudou', estado: JSON.parse(json) }, '*');
    }, 250);
  }
  let transform = { x: innerWidth / 2 - 570, y: innerHeight / 2 - 410, scale: .62 };
  let selected = 'root';
  let dragging = null;
  let panning = null;
  let history = [];
  let future = [];
  let toastTimer;

  function normalize() {
    state.nodes = state.nodes.map(n => ({ color: '#31d5d3', shape: 'pill', size: 14, bold: false, collapsed: false, note: '', ...n }));
    state.title ||= 'Sem título';
  }

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
  }

  function persist() {
    if (EMBUTIDO) { avisarBabel(); return; }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* sem armazenamento */ }
  }

  function snapshot() {
    history.push(JSON.stringify(state));
    if (history.length > 60) history.shift();
    future.length = 0;
    updateHistoryButtons();
  }

  function undo() {
    if (!history.length) return;
    future.push(JSON.stringify(state));
    state = JSON.parse(history.pop());
    selected = state.nodes.some(n => n.id === selected) ? selected : state.nodes[0]?.id;
    persist(); render(); updateHistoryButtons();
  }

  function redo() {
    if (!future.length) return;
    history.push(JSON.stringify(state));
    state = JSON.parse(future.pop());
    persist(); render(); updateHistoryButtons();
  }

  function updateHistoryButtons() {
    $('#undoBtn').disabled = !history.length;
    $('#redoBtn').disabled = !future.length;
  }

  const byId = id => state.nodes.find(n => n.id === id);
  const children = id => state.nodes.filter(n => n.parent === id);

  function hiddenByAncestor(node) {
    let parent = byId(node.parent);
    while (parent) {
      if (parent.collapsed) return true;
      parent = byId(parent.parent);
    }
    return false;
  }

  function render() {
    normalize();
    $('#mapTitle').value = state.title;
    nodesEl.innerHTML = '';
    svg.innerHTML = '';
    const visible = state.nodes.filter(n => !hiddenByAncestor(n));

    visible.forEach(n => {
      if (!n.parent || !visible.some(v => v.id === n.parent)) return;
      const p = byId(n.parent);
      const dir = n.x >= p.x ? 1 : -1;
      const startX = p.x + dir * 40;
      const endX = n.x - dir * 40;
      const bend = Math.max(42, Math.abs(endX - startX) * .48);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${startX} ${p.y} C ${startX + dir*bend} ${p.y}, ${endX - dir*bend} ${n.y}, ${endX} ${n.y}`);
      path.setAttribute('class', 'connector');
      path.dataset.filho = n.id;
      path.style.setProperty('--branch-color', n.color);
      svg.appendChild(path);
    });

    visible.forEach(n => {
      const el = document.createElement('div');
      el.className = `node shape-${n.shape}${n.id === selected ? ' selected' : ''}${!n.parent ? ' root' : ''}`;
      el.dataset.id = n.id;
      el.style.left = `${n.x}px`; el.style.top = `${n.y}px`;
      el.style.setProperty('--node-color', n.color);
      el.style.fontSize = `${n.size}px`;
      el.style.fontWeight = n.bold ? '800' : '500';
      el.innerHTML = `<div class="label"></div>${n.note ? '<i class="note-dot" title="Este tópico tem uma nota"></i>' : ''}`;
      el.querySelector('.label').textContent = n.text;
      if (children(n.id).length) {
        const fold = document.createElement('button');
        fold.className = `fold-badge${n.collapsed ? ' collapsed' : ''}`;
        fold.textContent = n.collapsed ? `${children(n.id).length}` : '−';
        fold.title = n.collapsed ? 'Expandir ramo' : 'Recolher ramo';
        fold.addEventListener('pointerdown', e => e.stopPropagation());
        fold.addEventListener('click', e => { e.stopPropagation(); toggleFold(n.id); });
        el.appendChild(fold);
      }
      bindNode(el, n);
      nodesEl.appendChild(el);
    });

    $('#emptyHint').hidden = !!state.nodes.length;
    updateTransform(); updateInspector(); drawMinimap(); persist();
    ganchos.desenhou.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
  }

  /* ganchos para o observatório do babel-coop (observatorio.js): quem quiser decorar o mapa depois de cada desenho */
  const ganchos = { desenhou: [], selecionou: [] };

  function bindNode(el, node) {
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0 || el.classList.contains('editing')) return;
      e.stopPropagation();
      select(node.id);
      const start = screenToWorld(e.clientX, e.clientY);
      dragging = { id: node.id, ox: start.x - node.x, oy: start.y - node.y, moved: false };
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', e => {
      if (!dragging || dragging.id !== node.id) return;
      const pt = screenToWorld(e.clientX, e.clientY);
      const nx = pt.x - dragging.ox, ny = pt.y - dragging.oy;
      if (!dragging.moved && Math.hypot(nx-node.x, ny-node.y) > 3) { snapshot(); dragging.moved = true; }
      node.x = nx; node.y = ny;
      el.style.left = `${node.x}px`; el.style.top = `${node.y}px`;
      drawConnectionsLive();
    });
    el.addEventListener('pointerup', e => { if (dragging?.id === node.id) { dragging = null; persist(); drawMinimap(); } });
    el.addEventListener('dblclick', e => { e.stopPropagation(); beginEdit(el, node); });
    el.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); select(node.id); showContext(e.clientX, e.clientY); });
  }

  function drawConnectionsLive() {
    const visible = state.nodes.filter(n => !hiddenByAncestor(n));
    [...svg.children].forEach((path, i) => {
      const n = visible.filter(v => v.parent && visible.some(q => q.id === v.parent))[i];
      if (!n) return;
      const p = byId(n.parent), dir = n.x >= p.x ? 1 : -1, sx = p.x + dir*40, ex = n.x-dir*40, bend = Math.max(42, Math.abs(ex-sx)*.48);
      path.setAttribute('d', `M ${sx} ${p.y} C ${sx+dir*bend} ${p.y}, ${ex-dir*bend} ${n.y}, ${ex} ${n.y}`);
    });
  }

  function select(id) {
    selected = id;
    $$('.node.selected').forEach(n => n.classList.remove('selected'));
    document.querySelector(`.node[data-id="${CSS.escape(id)}"]`)?.classList.add('selected');
    updateInspector();
    ganchos.selecionou.forEach(fn => { try { fn(id); } catch (e) { console.error(e); } });
  }

  function beginEdit(el, node) {
    snapshot();
    const label = el.querySelector('.label');
    el.classList.add('editing');
    label.contentEditable = 'true';
    label.focus();
    const range = document.createRange(); range.selectNodeContents(label); range.collapse(false);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
    const finish = () => {
      node.text = label.innerText.trim() || 'Tópico';
      label.textContent = node.text; label.contentEditable = 'false'; el.classList.remove('editing');
      persist(); drawMinimap();
    };
    label.addEventListener('blur', finish, { once: true });
    label.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); label.blur(); }
      if (e.key === 'Escape') { label.textContent = node.text; label.blur(); }
      e.stopPropagation();
    });
  }

  function addNode(kind = 'child', at) {
    const base = byId(selected) || state.nodes[0];
    snapshot();
    let parent, x, y;
    if (at) { parent = null; x = at.x; y = at.y; }
    else if (!base) { parent = null; x = WORLD.width/2; y = WORLD.height/2; }
    else if (kind === 'sibling' && base.parent) { parent = base.parent; x = base.x; y = base.y + 70; }
    else {
      /* o filho sai para o mesmo lado do pai (na raiz, para o lado com menos galhos) */
      const raiz = state.nodes.find(n => !n.parent);
      let dir = raiz && base.x < raiz.x ? -1 : 1;
      if (raiz && base.id === raiz.id) { const f = children(raiz.id), d = f.filter(n => n.x >= raiz.x).length; dir = f.length - d < d ? -1 : 1; }
      parent = base.id; x = base.x + dir * 235; y = base.y + (children(base.id).length - .5) * 62;
    }
    const n = { id: `n${Date.now().toString(36)}`, parent, text: 'Novo tópico', x, y, color: base?.color || COLORS[0], shape: 'pill', size: 14, bold: false, collapsed: false, note: '' };
    state.nodes.push(n); selected = n.id; render();
    requestAnimationFrame(() => { const el = document.querySelector(`.node[data-id="${n.id}"]`); if (el) beginEdit(el, n); });
  }

  function deleteSelected() {
    const node = byId(selected); if (!node) return;
    snapshot();
    const doomed = new Set([node.id]);
    let changed = true;
    while (changed) { changed = false; state.nodes.forEach(n => { if (doomed.has(n.parent) && !doomed.has(n.id)) { doomed.add(n.id); changed = true; } }); }
    state.nodes = state.nodes.filter(n => !doomed.has(n.id));
    selected = node.parent || state.nodes[0]?.id;
    render(); toast(`${doomed.size} tópico${doomed.size > 1 ? 's' : ''} removido${doomed.size > 1 ? 's' : ''}`);
  }

  function toggleFold(id = selected) { const n = byId(id); if (!n || !children(id).length) return; snapshot(); n.collapsed = !n.collapsed; render(); }

  function duplicateBranch() {
    const root = byId(selected); if (!root) return;
    snapshot();
    const originals = [];
    const collect = id => { const n = byId(id); originals.push(n); children(id).forEach(c => collect(c.id)); };
    collect(root.id);
    const map = new Map(originals.map(n => [n.id, `n${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`]));
    originals.forEach((n, i) => state.nodes.push({ ...n, id: map.get(n.id), parent: i === 0 ? n.parent : map.get(n.parent), x: n.x + 35, y: n.y + 75 }));
    selected = map.get(root.id); render(); toast('Ramo duplicado');
  }

  function updateTransform() {
    world.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
    els.zoom.textContent = `${Math.round(transform.scale * 100)}%`;
  }

  function screenToWorld(x, y) { return { x: (x-transform.x)/transform.scale, y: (y-transform.y)/transform.scale }; }

  function zoomAt(factor, x = innerWidth/2, y = innerHeight/2) {
    const before = screenToWorld(x, y);
    transform.scale = Math.min(2.2, Math.max(.15, transform.scale * factor));
    transform.x = x - before.x * transform.scale; transform.y = y - before.y * transform.scale;
    updateTransform(); drawMinimap();
  }

  function fitView() {
    const visible = state.nodes.filter(n => !hiddenByAncestor(n)); if (!visible.length) return;
    const minX = Math.min(...visible.map(n=>n.x))-150, maxX = Math.max(...visible.map(n=>n.x))+180;
    const minY = Math.min(...visible.map(n=>n.y))-100, maxY = Math.max(...visible.map(n=>n.y))+100;
    transform.scale = Math.min(.9, Math.max(.16, Math.min((innerWidth-150)/(maxX-minX), (innerHeight-150)/(maxY-minY))));
    transform.x = innerWidth/2 - ((minX+maxX)/2)*transform.scale;
    transform.y = innerHeight/2 - ((minY+maxY)/2)*transform.scale;
    updateTransform(); drawMinimap();
  }

  function autoLayout() {
    const root = state.nodes.find(n => !n.parent); if (!root) return;
    snapshot();
    const depth = n => { let d=0,p=n; while(p.parent){d++;p=byId(p.parent);} return d; };
    const levels = new Map(); state.nodes.forEach(n => { const d=depth(n); if(!levels.has(d)) levels.set(d,[]); levels.get(d).push(n); });
    levels.forEach((arr,d) => arr.forEach((n,i)=>{ n.x=root.x+d*245; n.y=root.y+(i-(arr.length-1)/2)*86; }));
    render(); fitView(); toast('Mapa reorganizado');
  }

  function updateInspector() {
    const n = byId(selected);
    if (!n) { els.inspector.hidden = true; return; }
    els.font.value = n.size; els.bold.checked = n.bold; els.note.value = n.note || '';
    $$('#swatches .swatch').forEach(s => s.classList.toggle('active', s.dataset.color === n.color));
    $$('.segmented button').forEach(b => b.classList.toggle('active', b.dataset.shape === n.shape));
  }

  function drawMinimap() {
    const c = $('#minimap'), w = c.width, h = c.height; ctx.clearRect(0,0,w,h); ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--mf-minimapa').trim()||'#202a2d'; ctx.fillRect(0,0,w,h);
    if (!state.nodes.length) return;
    const minX=Math.min(...state.nodes.map(n=>n.x))-100,maxX=Math.max(...state.nodes.map(n=>n.x))+100,minY=Math.min(...state.nodes.map(n=>n.y))-100,maxY=Math.max(...state.nodes.map(n=>n.y))+100;
    const s=Math.min((w-8)/(maxX-minX),(h-8)/(maxY-minY));
    state.nodes.forEach(n=>{ const p=byId(n.parent); if(!p)return; ctx.strokeStyle=n.color;ctx.globalAlpha=.6;ctx.beginPath();ctx.moveTo(4+(p.x-minX)*s,4+(p.y-minY)*s);ctx.lineTo(4+(n.x-minX)*s,4+(n.y-minY)*s);ctx.stroke(); });
    state.nodes.forEach(n=>{ctx.globalAlpha=1;ctx.fillStyle=n.color;ctx.fillRect(2+(n.x-minX)*s,2+(n.y-minY)*s,3,3);});
  }

  function search(q) {
    const term = q.trim().toLocaleLowerCase('pt-BR');
    $$('.node').forEach(el => el.classList.remove('search-hit'));
    if (!term) { els.searchCount.textContent=''; return; }
    const hits = state.nodes.filter(n => n.text.toLocaleLowerCase('pt-BR').includes(term));
    hits.forEach(n => document.querySelector(`.node[data-id="${n.id}"]`)?.classList.add('search-hit'));
    els.searchCount.textContent = `${hits.length} resultado${hits.length===1?'':'s'}`;
    if (hits[0]) { selected=hits[0].id; const n=hits[0]; transform.x=innerWidth/2-n.x*transform.scale;transform.y=innerHeight/2-n.y*transform.scale;updateTransform();select(n.id); }
  }

  function showContext(x,y) { els.context.hidden=false; els.context.style.left=`${Math.min(x,innerWidth-210)}px`; els.context.style.top=`${Math.min(y,innerHeight-290)}px`; }
  function hideContext() { els.context.hidden=true; }
  function toast(msg) { clearTimeout(toastTimer); els.toast.textContent=msg; els.toast.classList.add('show'); toastTimer=setTimeout(()=>els.toast.classList.remove('show'),2200); }

  function download(name, type, data) {
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  function outline(id, level=0) { const n=byId(id); if(!n)return ''; return `${'  '.repeat(level)}- ${n.text}\n${children(id).map(c=>outline(c.id,level+1)).join('')}`; }

  function exportSvg() {
    const visible=state.nodes.filter(n=>!hiddenByAncestor(n));
    const minX=Math.min(...visible.map(n=>n.x))-170,maxX=Math.max(...visible.map(n=>n.x))+220,minY=Math.min(...visible.map(n=>n.y))-120,maxY=Math.max(...visible.map(n=>n.y))+120;
    const paths=visible.filter(n=>n.parent&&visible.some(v=>v.id===n.parent)).map(n=>{const p=byId(n.parent),dir=n.x>=p.x?1:-1,sx=p.x+dir*40,ex=n.x-dir*40,b=Math.max(42,Math.abs(ex-sx)*.48);return `<path d="M ${sx} ${p.y} C ${sx+dir*b} ${p.y}, ${ex-dir*b} ${n.y}, ${ex} ${n.y}" fill="none" stroke="${n.color}" stroke-width="2"/>`;}).join('');
    const labels=visible.map(n=>`<g><rect x="${n.x-80}" y="${n.y-17}" width="160" height="34" rx="9" fill="#263134" stroke="${n.color}"/><text x="${n.x}" y="${n.y+5}" text-anchor="middle" font-family="sans-serif" font-size="${n.size}" fill="#fff">${n.text.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</text></g>`).join('');
    download(`${state.title}.svg`,'image/svg+xml',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${maxX-minX} ${maxY-minY}"><rect x="${minX}" y="${minY}" width="100%" height="100%" fill="#263134"/>${paths}${labels}</svg>`);
  }

  function importMap(file) {
    const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result);if(!Array.isArray(data.nodes))throw 0;snapshot();state=data;selected=state.nodes[0]?.id;render();fitView();$('#exportDialog').close();toast('Mapa importado');}catch{toast('Arquivo JSON inválido');}};reader.readAsText(file);
  }

  function initControls() {
    COLORS.forEach(color=>{const b=document.createElement('button');b.className='swatch';b.dataset.color=color;b.style.background=color;b.title=color;b.onclick=()=>{const n=byId(selected);if(!n)return;snapshot();n.color=color;render();};$('#swatches').appendChild(b);});
    $('#addChildBtn').onclick=()=>addNode('child'); $('#addSiblingBtn').onclick=()=>addNode('sibling'); $('#deleteBtn').onclick=deleteSelected; $('#foldBtn').onclick=()=>toggleFold();
    $('#undoBtn').onclick=undo; $('#redoBtn').onclick=redo; $('#zoomIn').onclick=()=>zoomAt(1.2); $('#zoomOut').onclick=()=>zoomAt(1/1.2); $('#historyBtn').onclick=fitView;
    $('#mapViewBtn').onclick=autoLayout; $('#toggleMini').onclick=()=>$('#minimapWrap').classList.toggle('hidden');
    $('#searchBtn').onclick=()=>{els.searchPanel.hidden=false;els.search.focus();}; $('#closeSearch').onclick=()=>{els.searchPanel.hidden=true;search('');}; els.search.oninput=e=>search(e.target.value);
    $('#shareBtn').onclick=()=>{$('#shareLink').value=`${location.href.split('#')[0]}#map=${btoa(unescape(encodeURIComponent(JSON.stringify(state))))}`;$('#shareDialog').showModal();};
    $('#copyLink').onclick=async()=>{await navigator.clipboard.writeText($('#shareLink').value);toast('Link copiado');};
    $('#exportBtn').onclick=()=>$('#exportDialog').showModal();
    $$('[data-export]').forEach(b=>b.onclick=()=>{const type=b.dataset.export;if(type==='json')download(`${state.title}.json`,'application/json',JSON.stringify(state,null,2));if(type==='svg')exportSvg();if(type==='outline'){const roots=state.nodes.filter(n=>!n.parent);download(`${state.title}.txt`,'text/plain',roots.map(r=>outline(r.id)).join('\n'));}$('#exportDialog').close();toast('Arquivo exportado');});
    $('#importFile').onchange=e=>e.target.files[0]&&importMap(e.target.files[0]);
    $('#presentBtn').onclick=()=>{document.body.classList.toggle('presentation');fitView();toast(document.body.classList.contains('presentation')?'Modo apresentação — Esc para sair':'Apresentação encerrada');};
    $('#themeBtn').onclick=()=>{document.documentElement.classList.toggle('light-map');const light=document.documentElement.classList.contains('light-map');document.documentElement.style.setProperty('--bg',light?'#e9eff0':'#060b16');document.documentElement.style.setProperty('--bg-deep',light?'#dce5e7':'#040811');toast(light?'Tema claro':'Tema escuro');};
    $('#menuBtn').onclick=e=>{select(state.nodes[0]?.id);showContext(e.currentTarget.getBoundingClientRect().left,e.currentTarget.getBoundingClientRect().bottom+8);};
    $('#mapTitle').onchange=e=>{snapshot();state.title=e.target.value.trim()||'Sem título';persist();};
    $('#closeInspector').onclick=()=>els.inspector.hidden=true;
    $('#fontSize').oninput=e=>{const n=byId(selected);if(n){n.size=+e.target.value;render();}};
    $('#boldToggle').onchange=e=>{const n=byId(selected);if(n){snapshot();n.bold=e.target.checked;render();}};
    $('#noteInput').onchange=e=>{const n=byId(selected);if(n){snapshot();n.note=e.target.value;render();}};
    $$('.segmented button').forEach(b=>b.onclick=()=>{const n=byId(selected);if(n){snapshot();n.shape=b.dataset.shape;render();}});
    $('#contextMenu').onclick=e=>{const a=e.target.closest('[data-action]');if(!a)return;const actions={edit:()=>{const el=document.querySelector(`.node[data-id="${selected}"]`);if(el)beginEdit(el,byId(selected));},child:()=>addNode('child'),sibling:()=>addNode('sibling'),duplicate:duplicateBranch,style:()=>{els.inspector.hidden=false;updateInspector();},delete:deleteSelected};actions[a.dataset.action]?.();hideContext();};
  }

  viewport.addEventListener('pointerdown', e=>{hideContext();if(e.target!==viewport&&e.target!==world&&e.target!==nodesEl&&e.target!==svg)return;panning={x:e.clientX,y:e.clientY,tx:transform.x,ty:transform.y};viewport.classList.add('panning');viewport.setPointerCapture(e.pointerId);});
  viewport.addEventListener('pointermove', e=>{if(!panning)return;transform.x=panning.tx+e.clientX-panning.x;transform.y=panning.ty+e.clientY-panning.y;updateTransform();});
  viewport.addEventListener('pointerup',()=>{panning=null;viewport.classList.remove('panning');drawMinimap();});
  viewport.addEventListener('dblclick',e=>{if(e.target===viewport||e.target===world||e.target===nodesEl||e.target===svg)addNode('child',screenToWorld(e.clientX,e.clientY));});
  viewport.addEventListener('wheel',e=>{e.preventDefault();if(e.ctrlKey||e.metaKey){zoomAt(e.deltaY<0?1.12:1/1.12,e.clientX,e.clientY);}else{transform.x-=e.deltaX;transform.y-=e.deltaY;updateTransform();}}, {passive:false});
  addEventListener('keydown',e=>{
    const editing=document.activeElement?.isContentEditable||['INPUT','TEXTAREA'].includes(document.activeElement?.tagName);
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return;}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='f'){e.preventDefault();els.searchPanel.hidden=false;els.search.focus();return;}
    if(editing)return;
    if(e.key==='Tab'){e.preventDefault();addNode('child');}
    if(e.key==='Enter'){e.preventDefault();addNode('sibling');}
    if(e.key==='Delete'||e.key==='Backspace')deleteSelected();
    if(e.key==='Escape'){document.body.classList.remove('presentation');els.inspector.hidden=true;hideContext();}
    if(e.key==='+'||e.key==='=')zoomAt(1.2); if(e.key==='-')zoomAt(1/1.2); if(e.key==='0')fitView();
  });
  addEventListener('resize',drawMinimap);
  document.addEventListener('click',e=>{if(!e.target.closest('#contextMenu')&&!e.target.closest('#menuBtn'))hideContext();});

  try { if(location.hash.startsWith('#map=')){const data=JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(5)))));if(Array.isArray(data.nodes))state=data;} } catch {}
  initControls(); normalize(); render(); updateHistoryButtons(); setTimeout(fitView, 40);

  /* o que o observatório do babel-coop (observatorio.js) lê e comanda; fora do babel-coop ninguém usa */
  window.mindforge = {
    embutido: EMBUTIDO, ganchos,
    estado: () => state, byId, children, selecionado: () => selected, select, render, fitView, toast, hideContext,
    transform: () => ({ ...transform }),
    definirTransform: (t) => { transform = { ...transform, ...t }; updateTransform(); drawMinimap(); }
  };

  /* ponte com a Estação do Babel Coop */
  if (EMBUTIDO) {
    window.addEventListener('message', e => {
      const m = e.data || {};
      if (m.tipo !== 'babel-mapa') return;
      if (m.op === 'carregar' && m.estado && Array.isArray(m.estado.nodes)) {
        const json = JSON.stringify(m.estado);
        if (json === JSON.stringify(state)) return;
        const editando = document.activeElement?.isContentEditable;
        if (editando) return; /* não atropela quem está digitando um tópico */
        ultimoEnviado = json;
        state = JSON.parse(json);
        if (!state.nodes.some(n => n.id === selected)) selected = state.nodes.find(n => !n.parent)?.id || state.nodes[0]?.id;
        render();
        if (m.ajustar) fitView();
        if (m.selecionar) { const n = byId(m.selecionar); if (n) { select(n.id); transform.x = innerWidth/2 - n.x*transform.scale; transform.y = innerHeight/2 - n.y*transform.scale; updateTransform(); } }
      }
      if (m.op === 'apresentar') { document.body.classList.toggle('presentation', !!m.ligado); fitView(); }
      if (m.op === 'somente-ver') { document.body.classList.toggle('somente-ver', !!m.ligado); }
      if (m.op === 'avatar' && m.iniciais) { const av = document.querySelector('.avatar'); if (av) { av.textContent = m.iniciais; av.title = m.nome || 'Você'; } }
    });
    window.parent.postMessage({ tipo: 'babel-mapa-pronto' }, '*');
  }
})();
