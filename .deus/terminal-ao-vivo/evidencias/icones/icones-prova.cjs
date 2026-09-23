/* babel-coop · prova dos ícones (missão babel-coop/terminal-ao-vivo, papel ÍCONES)
   Tudo no Electron do próprio app, janela escondida (BABEL_COOP_OCULTO); nenhum Google Chrome.
   Uso (de dentro de app/, para achar o playwright):
     node <este>.cjs prints <prefixo>     prints da casca (Estação real, equipe fundada) + medidas
     node <este>.cjs roteiro <saida.json> docs/testes/roteiro.js inteiro numa página do Electron (route em http://coop.local)
     node <este>.cjs folha <prefixo>      folha de conferência /icones-folha.html: prints + cliques de verdade
   Portas só deste papel: HTTP 5070–5079, UDP 41570–41579. */
'use strict';
const fs = require('fs');
const path = require('path');
const { abrirEstacao, raizTemporaria } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/testes/e2e/estacao.js');

const EVID = '/Users/matheussilveirapro/Desktop/babel-coop/.deus/terminal-ao-vivo/evidencias/icones';
const PROTO = '/Users/matheussilveirapro/Desktop/babel-coop/prototipo';
const ROTEIRO = '/Users/matheussilveirapro/Desktop/babel-coop/docs/testes/roteiro.js';
const [modo, arg] = process.argv.slice(2);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (t) => console.error('[' + new Date().toISOString().slice(11, 19) + '] ' + t);
let ABERTA = null;
function vigia(ms) { const t = setTimeout(async () => { log('vigia: tempo esgotado, fechando o Electron'); try { if (ABERTA) await ABERTA.fechar(); } catch (e) { /* já fechado */ } process.exit(3); }, ms); t.unref(); }
const comPrazo = (p, ms, nome) => Promise.race([p, new Promise((_, n) => setTimeout(() => n(new Error('prazo estourado: ' + nome)), ms))]);

async function estacaoFundada(porta, udp) {
  const raiz = raizTemporaria('icones');
  fs.mkdirSync(path.join(raiz, 'zdot'), { recursive: true });
  const E = await abrirEstacao({ nome: 'icones', raiz, porta, descoberta: udp, env: { ZDOTDIR: path.join(raiz, 'zdot') } });
  ABERTA = E;
  const erros = [];
  E.page.on('pageerror', (e) => erros.push(String(e && e.message || e).slice(0, 200)));
  const f = await E.api('/api/fundar', { nome: 'Theus' });
  await E.page.reload();
  await E.page.waitForFunction(() => window.BC && BC.estacao && document.getElementById('e-status') && document.getElementById('e-status').children.length, null, { timeout: 25000 });
  await espera(1200);
  return Object.assign(E, { erros, fundou: f });
}

/* o que a casca desenhou: quantos ícones, de onde vêm e com que traço */
function medirCasca() {
  const svgs = Array.from(document.querySelectorAll('#vista-estacao svg'));
  const vis = svgs.filter((s) => { const r = s.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
  const tracos = {};
  vis.forEach((s) => { const w = getComputedStyle(s).strokeWidth; tracos[w] = (tracos[w] || 0) + 1; });
  const barra = Array.from(document.querySelectorAll('.e-atividades button > svg'));
  return {
    temBCicones: !!(window.BC && BC.icones && typeof BC.icones.svg === 'function'),
    nomesBCicones: window.BC && BC.icones && BC.icones.nomes ? BC.icones.nomes().length : 0,
    svgsVisiveis: vis.length,
    comDataIcone: vis.filter((s) => s.getAttribute('data-icone')).length,
    tracoComputado: tracos,
    barra: barra.map((s) => ({ id: s.parentElement.getAttribute('data-id') || s.parentElement.getAttribute('data-acao'), icone: s.getAttribute('data-icone') || '(antigo)', traco: getComputedStyle(s).strokeWidth, tam: Math.round(s.getBoundingClientRect().width) }))
  };
}

async function prints(prefixo) {
  const E = await estacaoFundada(5071, 41571);
  const { page } = E;
  const out = (n) => path.join(EVID, prefixo + '-' + n + '.png');
  const medidas = { fundou: E.fundou && E.fundou.id };
  try {
    await page.evaluate(() => { BC.estacao.fecharTodas(); ['dia', 'demandas', 'chat', 'acervo', 'terminais', 'metas'].forEach((a) => BC.estacao.abrir(a)); BC.estacao.abrir('dia'); });
    await espera(600);
    await page.screenshot({ path: out('estacao') });
    const barra = await page.locator('#e-atividades').boundingBox();
    if (barra) await page.screenshot({ path: out('barra'), clip: { x: barra.x, y: barra.y, width: barra.width, height: Math.min(barra.height, 900) } });
    const abas = await page.locator('#e-abas').boundingBox();
    if (abas) await page.screenshot({ path: out('abas'), clip: { x: abas.x, y: abas.y, width: Math.min(abas.width, 900), height: abas.height } });
    log('medir');
    medidas.casca = await comPrazo(page.evaluate(medirCasca), 10000, 'medirCasca');
    /* evento real: clicar em cada ícone da barra (clique do mouse, pelo Playwright) troca a atividade e o ícone ativo acende */
    const ids = await page.evaluate(() => Array.from(document.querySelectorAll('.e-atividades [data-acao="atividade"]')).map((b) => b.getAttribute('data-id')));
    medidas.cliques = [];
    for (const id of ids) {
      log('clique ' + id);
      await comPrazo(page.click('.e-atividades [data-acao="atividade"][data-id="' + id + '"]', { timeout: 5000 }), 8000, 'clique ' + id).catch((e) => medidas.cliques.push({ id, erro: String(e).slice(0, 120) }));
      await espera(120);
      medidas.cliques.push(await comPrazo(page.evaluate((id) => { const a = document.querySelector('.e-atividades [aria-current="page"]'); const s = a && a.querySelector('svg'); return { id, ativo: a ? a.getAttribute('data-id') : null, icone: s ? (s.getAttribute('data-icone') || '(antigo)') : null }; }, id), 8000, 'ler ' + id));
    }
    await page.evaluate(() => { BC.estacao.abrir('demandas'); });
    await espera(300);
    await page.evaluate(() => { const b = document.querySelector('.e-abas-celular [data-acao="mais"]') || null; BC.acoes.mais ? BC.acoes.mais({ dataset: {} }) : b && b.click(); });
    await espera(400);
    const mais = await page.locator('.mais-caixa').boundingBox().catch(() => null);
    if (mais) await page.screenshot({ path: out('mais'), clip: mais });
    medidas.mais = await page.evaluate(() => document.querySelectorAll('.mais-grade svg').length);
    await page.evaluate(() => { const b = document.querySelector('[data-acao="sobre-fechar"]'); if (b) b.click(); });
    /* celular: as 5 abas de baixo com o mesmo desenho a 20 px; clicar em "Chat" pelo toque troca a aba */
    await comPrazo(page.setViewportSize({ width: 400, height: 860 }), 8000, 'viewport').catch((e) => { medidas.celularErro = String(e).slice(0, 120); });
    await espera(600);
    const cel = await page.locator('#e-abas-celular').boundingBox().catch(() => null);
    if (cel && cel.width > 0) {
      await page.click('#e-abas-celular [data-id="chat"]', { timeout: 5000 }).catch(() => {});
      await espera(300);
      await page.screenshot({ path: out('celular') });
      medidas.celular = await page.evaluate(() => Array.from(document.querySelectorAll('#e-abas-celular button')).map((b) => (b.getAttribute('aria-current') ? '*' : '') + b.getAttribute('data-id') + ':' + ((b.querySelector('svg') || {}).getAttribute ? b.querySelector('svg').getAttribute('data-icone') || '(antigo)' : '-')));
    }
    /* a API para os outros agentes: svg() com rótulo, apelido antigo e hidratar() em HTML fixo */
    medidas.api = await page.evaluate(() => {
      if (!window.BC || !BC.icones || !BC.icones.svg) return 'sem BC.icones';
      const I = BC.icones, d = document.createElement('div');
      d.innerHTML = '<span data-icone="cofre" data-tam="16"></span><i data-icone="robo"></i><b data-icone="nao-existe"></b>';
      document.body.appendChild(d);
      const n = I.hidratar(d), r = {
        hidratou: n, cofre: d.querySelector('span svg') && d.querySelector('span svg').getAttribute('data-icone') + '@' + d.querySelector('span svg').getAttribute('width'),
        robo: !!d.querySelector('i svg[data-icone="robo"]'), inexistenteVazio: d.querySelector('b').innerHTML === '',
        apelidoExplorador: I.real('explorador'), rotulo: /role="img"/.test(I.svg('sino', 20, { rotulo: 'Novidades' })) && /<title>Novidades<\/title>/.test(I.svg('sino', 20, { rotulo: 'Novidades' })),
        chaves: Object.keys(I).length, sinoTopo: (document.querySelector('#abrir-coluna > svg') || { getAttribute: () => null }).getAttribute('data-icone')
      };
      d.remove();
      return r;
    });
    medidas.erros = E.erros.slice();
  } finally {
    fs.writeFileSync(path.join(EVID, prefixo + '-medidas.json'), JSON.stringify(medidas, null, 2));
    await E.fechar();
  }
  console.log(JSON.stringify(medidas, null, 2).slice(0, 4000));
}

/* a página do Electron com context().newPage() trocado por uma janela escondida do próprio app (Electron não cria página solta) */
function adaptar(E) {
  const { app, page } = E;
  const ctx = page.context();
  const ctxProxy = new Proxy(ctx, {
    get(alvo, k) {
      if (k === 'newPage') {
        return async () => {
          const nova = app.waitForEvent('window');
          await app.evaluate(({ BrowserWindow }) => { const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { contextIsolation: true } }); w.loadURL('about:blank'); });
          const p = await nova;
          await p.waitForLoadState().catch(() => {});
          return p;
        };
      }
      const v = alvo[k];
      return typeof v === 'function' ? v.bind(alvo) : v;
    }
  });
  return new Proxy(page, {
    get(alvo, k) {
      if (k === 'context') return () => ctxProxy;
      const v = alvo[k];
      return typeof v === 'function' ? v.bind(alvo) : v;
    }
  });
}

async function roteiro(saida) {
  const E = await abrirEstacao({ nome: 'icones-rot', raiz: raizTemporaria('icones-rot'), porta: 5072, descoberta: 41572 });
  ABERTA = E;
  try {
    await E.page.waitForLoadState();
    const src = fs.readFileSync(ROTEIRO, 'utf8');
    const fn = (0, eval)('(' + src + '\n)');
    const t0 = Date.now();
    const r = await fn(adaptar(E));
    r.segundos = Math.round((Date.now() - t0) / 1000);
    r.onde = 'Electron ' + (await E.app.evaluate(() => process.versions.electron)) + ' · janela escondida · route http://coop.local → prototipo/';
    fs.writeFileSync(saida, JSON.stringify(r, null, 2));
    console.log(r.resumo, '·', r.segundos, 's');
    r.falhas.forEach((f) => console.log('FALHA', JSON.stringify(f)));
  } finally { await E.fechar(); }
}

async function folha(prefixo) {
  const E = await estacaoFundada(5073, 41573);
  const { page, base } = E;
  const out = (n) => path.join(EVID, prefixo + '-' + n + '.png');
  const r = {};
  try {
    const erros = [];
    page.on('pageerror', (e) => erros.push(String(e && e.message || e).slice(0, 200)));
    await page.goto(base + '/icones-folha.html');
    await page.waitForFunction(() => window.BC && BC.icones && document.querySelectorAll('.fl-celula').length > 0, null, { timeout: 15000 });
    await espera(500);
    await page.screenshot({ path: out('inteira'), fullPage: true });
    r.inicial = await page.evaluate(() => BC.folha.medir());
    /* cliques de verdade: fundo --s2, tamanho 16, filtro "gav", clique num ícone copia o nome e abre a lupa */
    await page.click('[data-fl-fundo="s2"]');
    await page.click('[data-fl-tam="16"]');
    await page.fill('#fl-busca', 'gav');
    await espera(200);
    r.depoisFiltro = await page.evaluate(() => BC.folha.medir());
    await page.click('.fl-celula[data-nome="gaveta"]');
    await espera(250);
    r.lupa = await page.evaluate(() => ({ aberta: !document.getElementById('fl-lupa').hidden, nome: document.getElementById('fl-lupa-nome').textContent, copiado: document.getElementById('fl-aviso').textContent }));
    await page.screenshot({ path: out('lupa') });
    await page.keyboard.press('Escape');
    await page.fill('#fl-busca', '');
    await page.click('[data-fl-fundo="s0"]');
    await page.click('[data-fl-tam="todos"]');
    await espera(200);
    const sec = ['casca', 'pecas', 'estados'];
    for (const s of sec) {
      const bx = await page.locator('#fl-' + s).boundingBox().catch(() => null);
      if (bx) await page.screenshot({ path: out(s), clip: bx, fullPage: true });
    }
    r.erros = erros.concat(E.erros);
  } finally {
    fs.writeFileSync(path.join(EVID, prefixo + '-medidas.json'), JSON.stringify(r, null, 2));
    await E.fechar();
  }
  console.log(JSON.stringify(r, null, 2).slice(0, 4000));
}

/* prancheta de revisão: todos a 56 px (desenho) e a 16/20 px em escala 1:1 de CSS (como numa tela comum) */
async function prancheta(prefixo) {
  const E = await estacaoFundada(5074, 41574);
  const { page, base } = E;
  try {
    await page.goto(base + '/icones-folha.html');
    await page.waitForFunction(() => window.BC && BC.icones && BC.folha, null, { timeout: 15000 });
    await page.evaluate(() => {
      const I = BC.icones, todos = [].concat(I.casca(), I.nomes('pecas'), I.nomes('estados'));
      const d = document.createElement('div');
      d.id = 'prancheta';
      d.style.cssText = 'position:fixed;inset:0;z-index:9;background:var(--s1);padding:12px;display:grid;grid-template-columns:repeat(14,1fr);gap:4px;align-content:start;overflow:auto';
      d.innerHTML = todos.map((n) => '<div style="display:grid;justify-items:center;gap:2px;padding:4px 0;border:1px solid var(--linha-fraca);border-radius:4px;color:var(--texto)">' + I.svg(n, 56) + '<span style="font:10px var(--fonte-mono);color:var(--apagado)">' + n + '</span></div>').join('');
      document.body.appendChild(d);
      const p = document.createElement('div');
      p.id = 'pequenos';
      p.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:10;background:var(--s0);padding:8px;display:flex;flex-wrap:wrap;gap:10px;color:var(--texto-90)';
      p.innerHTML = todos.map((n) => I.svg(n, 16)).join('') + '<br style="flex-basis:100%">' + todos.map((n) => I.svg(n, 20)).join('');
      document.body.appendChild(p);
    });
    await espera(300);
    await page.screenshot({ path: path.join(EVID, prefixo + '-grande.png') });
    const bx = await page.locator('#pequenos').boundingBox();
    await page.screenshot({ path: path.join(EVID, prefixo + '-pequenos-1x.png'), clip: bx, scale: 'css' });
    await page.screenshot({ path: path.join(EVID, prefixo + '-pequenos-2x.png'), clip: bx });
  } finally { await E.fechar(); }
}

(async () => {
  if (modo === 'prancheta') { vigia(170000); await prancheta(arg || 'prancheta'); return; }
  vigia(modo === 'roteiro' ? 420000 : 170000);
  if (modo === 'prints') await prints(arg || 'antes');
  else if (modo === 'roteiro') await roteiro(arg || path.join(EVID, 'roteiro.json'));
  else if (modo === 'folha') await folha(arg || 'folha');
  else console.log('uso: prints <prefixo> | roteiro <saida.json> | folha <prefixo>');
})().catch((e) => { console.error('ERRO', e && e.stack || e); process.exitCode = 1; });
