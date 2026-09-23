/* babel-coop · prova do ENDEREÇO (missão babel-coop/terminal-ao-vivo, PLANO §1 propriedade 2 e F2 "a sala")
   Tudo no Electron do próprio app, janela escondida (BABEL_COOP_OCULTO); nenhum Google Chrome.
   Dois modos de página, a mesma interface (prototipo/):
     · protótipo: route http://coop.local → prototipo/ (equipe simulada andando pela sala)
     · app real : http://localhost:<porta> servido pelo app, equipe fundada pela API (/api/fundar)
   Uso (de qualquer pasta):
     node endereco-prova.cjs prints <prefixo>      prints (antes/depois) nos dois modos + medidas
     node endereco-prova.cjs roteiro <saida.json>  docs/testes/roteiro.js inteiro numa página do Electron
     node endereco-prova.cjs prova <prefixo>       cliques e ações de verdade na parte do endereço, com asserções
   Portas só deste papel: HTTP 5010–5019, UDP 41510–41519. */
'use strict';
const fs = require('fs');
const path = require('path');
const { abrirEstacao, raizTemporaria } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/testes/e2e/estacao.js');

const EVID = '/Users/matheussilveirapro/Desktop/babel-coop/.deus/terminal-ao-vivo/evidencias/endereco';
const PROTO = '/Users/matheussilveirapro/Desktop/babel-coop/prototipo';
const ROTEIRO = '/Users/matheussilveirapro/Desktop/babel-coop/docs/testes/roteiro.js';
const TIPOS = { html: 'text/html', js: 'text/javascript', css: 'text/css', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml', json: 'application/json', mp4: 'video/mp4' };
const [modo, arg] = process.argv.slice(2);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/* a página do Electron com context().newPage() trocado por uma janela escondida do próprio app (Electron não cria página solta) */
function adaptar(E) {
  const { app, page } = E;
  const ctx = page.context();
  const ctxProxy = new Proxy(ctx, {
    get(alvo, k) {
      if (k === 'newPage') {
        return async () => {
          const nova = app.waitForEvent('window');
          await app.evaluate(({ BrowserWindow }) => { const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { contextIsolation: true, backgroundThrottling: false } }); w.loadURL('about:blank'); });
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

async function servirProtótipo(page) {
  await page.context().route('http://coop.local/**', (route) => {
    let p = route.request().url().replace('http://coop.local', '').split('#')[0].split('?')[0];
    if (p === '/' || p === '') p = '/index.html';
    const ext = p.split('.').pop();
    route.fulfill({ path: PROTO + decodeURIComponent(p), contentType: (TIPOS[ext] || 'text/plain') + '; charset=utf-8', headers: { 'Cache-Control': 'no-store' } })
      .catch(() => route.fulfill({ status: 404, body: 'x' }));
  });
}

/* Estação do protótipo (equipe simulada) dentro do Electron */
async function estacaoProtótipo(porta, udp, largura, altura) {
  const E = await abrirEstacao({ nome: 'endereco-p', raiz: raizTemporaria('endereco-p'), porta, descoberta: udp });
  await E.page.waitForLoadState();
  const erros = [];
  E.page.on('pageerror', (e) => erros.push(String(e && (e.stack || e.message) || e).split('\n').slice(0, 2).join(' @ ').slice(0, 300)));
  await servirProtótipo(E.page);
  await E.page.setViewportSize({ width: largura || 1440, height: altura || 900 });
  await E.page.goto('http://coop.local/');
  await E.page.waitForFunction(() => window.BC && BC.estacao && BC.loja && BC.loja.estado && document.getElementById('e-status').children.length, null, { timeout: 20000 });
  await espera(1500);
  await E.page.evaluate(() => document.fonts && document.fonts.ready);
  return Object.assign(E, { erros, modo: 'protótipo' });
}

/* Estação do app real, equipe fundada (Theus) */
async function estacaoApp(porta, udp, largura, altura) {
  const raiz = raizTemporaria('endereco-a');
  fs.mkdirSync(path.join(raiz, 'zdot'), { recursive: true });
  const E = await abrirEstacao({ nome: 'endereco-a', raiz, porta, descoberta: udp, env: { ZDOTDIR: path.join(raiz, 'zdot') } });
  const erros = [];
  E.page.on('pageerror', (e) => erros.push(String(e && (e.stack || e.message) || e).split('\n').slice(0, 2).join(' @ ').slice(0, 300)));
  await E.page.waitForLoadState();
  const f = await E.api('/api/fundar', { nome: 'Theus' });
  await E.page.reload();
  await E.page.setViewportSize({ width: largura || 1440, height: altura || 900 });
  await E.page.waitForFunction(() => window.BC && BC.estacao && BC.real && BC.real.eu() && BC.real.eu().pronto && document.getElementById('e-status').children.length, null, { timeout: 25000 });
  await espera(1500);
  await E.page.evaluate(() => document.fonts && document.fonts.ready);
  return Object.assign(E, { erros, fundou: f, modo: 'app' });
}

function abrirLanding() {
  const a = BC.loja.estado.arquivos.find((x) => /Clínicas\/landing\.html$/.test(x.caminho));
  BC.estacao.fecharTodas();
  if (a) BC.explorador.abrirArquivo(a.id);
  return a ? a.caminho : null;
}

async function cenas(E, prefixo, sufixo) {
  const { page } = E;
  const out = (n) => path.join(EVID, prefixo + '-' + sufixo + '-' + n + '.png');
  const m = {};
  m.landing = await page.evaluate(abrirLanding);
  await espera(900);
  await page.screenshot({ path: out('arquivo') });
  const meio = await page.locator('.e-editor').boundingBox();
  if (meio) await page.screenshot({ path: out('cabecalho'), clip: { x: meio.x, y: meio.y, width: Math.min(meio.width, 1000), height: 120 } });
  m.cabecalho = await page.evaluate(() => ({
    endereco: document.getElementById('e-endereco') ? document.getElementById('e-endereco').innerText.replace(/\s+/g, ' ').slice(0, 200) : null,
    trilhaEditor: document.querySelector('.ed-trilha') ? document.querySelector('.ed-trilha').innerText.replace(/\s+/g, ' ') : null
  }));
  await page.evaluate(() => { BC.estacao.abrirPaleta(); const i = document.getElementById('paleta-entrada'); i.value = 'onde'; i.dispatchEvent(new Event('input', { bubbles: true })); });
  await espera(400);
  await page.screenshot({ path: out('paleta-onde') });
  m.paletaOnde = await page.evaluate(() => document.getElementById('paleta-lista').innerText.split('\n').slice(0, 14));
  await page.keyboard.press('Escape');
  await page.evaluate(() => { document.getElementById('paleta').hidden = true; BC.estacao.fecharTodas(); BC.estacao.abrir('equipe'); });
  await espera(700);
  await page.screenshot({ path: out('equipe') });
  const lat = await page.locator('#e-lateral').boundingBox();
  if (lat) await page.screenshot({ path: out('equipe-lateral'), clip: lat });
  m.lateralEquipe = await page.evaluate(() => document.getElementById('e-lateral').innerText.split('\n').filter(Boolean).slice(0, 24));
  m.erros = E.erros.slice();
  return m;
}

async function prints(prefixo) {
  const medidas = { prefixo, quando: new Date().toISOString() };
  let E = await estacaoProtótipo(5012, 41512);
  try { medidas.protótipo = await cenas(E, prefixo, 'prototipo'); } finally { await E.fechar(); }
  E = await estacaoApp(5013, 41513);
  try { medidas.app = await cenas(E, prefixo, 'app'); medidas.app.fundou = E.fundou && E.fundou.id; } finally { await E.fechar(); }
  fs.writeFileSync(path.join(EVID, prefixo + '-medidas.json'), JSON.stringify(medidas, null, 2));
  console.log(JSON.stringify(medidas, null, 2).slice(0, 6000));
}

async function roteiro(saida) {
  const E = await abrirEstacao({ nome: 'endereco-rot', raiz: raizTemporaria('endereco-rot'), porta: 5011, descoberta: 41511 });
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

const MODOS = { prints: () => prints(arg || 'antes'), roteiro: () => roteiro(arg || path.join(EVID, 'roteiro.json')) };
module.exports = { estacaoProtótipo, estacaoApp, adaptar, espera, EVID };
if (require.main === module) {
  (async () => {
    if (MODOS[modo]) await MODOS[modo]();
    else if (modo === 'prova') await require('./endereco-interacao.cjs').prova(arg || 'prova');
    else console.log('uso: prints <prefixo> | roteiro <saida.json> | prova <prefixo>');
  })().catch((e) => { console.error('ERRO', e && e.stack || e); process.exitCode = 1; });
}
