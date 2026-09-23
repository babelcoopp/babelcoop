/* babel-coop · campanha · abre a Estação de verdade (Electron, janela escondida) nas portas só da campanha
   HTTP 5050–5059 · UDP 41550–41559. Sem Google Chrome, sem Playwright MCP. */
'use strict';
const path = require('path');
const fs = require('fs');
const { abrirEstacao, raizTemporaria } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/testes/e2e/estacao.js');

const EVID = '/Users/matheussilveirapro/Desktop/babel-coop/.deus/terminal-ao-vivo/evidencias/campanha';
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function estacao({ porta = 5050, udp = 41550, largura = 1440, altura = 900 } = {}) {
  const raiz = raizTemporaria('campanha');
  fs.mkdirSync(path.join(raiz, 'zdot'), { recursive: true });
  const E = await abrirEstacao({ nome: 'campanha', raiz, porta, descoberta: udp, env: { ZDOTDIR: path.join(raiz, 'zdot') } });
  const page = E.page;
  const erros = [];
  page.on('pageerror', (e) => erros.push(String(e && e.message || e).slice(0, 240)));
  await E.app.evaluate(({ BrowserWindow }, t) => { const w = BrowserWindow.getAllWindows()[0]; if (w) w.setContentSize(t[0], t[1]); }, [largura, altura]);
  const f = await E.api('/api/fundar', { nome: 'Theus' });
  await page.reload();
  await page.waitForFunction(() => window.BC && BC.estacao && BC.loja && document.getElementById('e-status') && document.getElementById('e-status').children.length, null, { timeout: 30000 });
  await esperar(1200);
  return { E, page, erros, raiz, fundou: f, fechar: async () => { try { await E.fechar(); } catch (e) { /* já fechou */ } try { fs.rmSync(raiz, { recursive: true, force: true }); } catch (e) { /* temporária */ } } };
}

/* o protótipo puro (sem ponte nem organismo), servido por route em http://coop.local, na mesma janela escondida */
const BASE = '/Users/matheussilveirapro/Desktop/babel-coop/prototipo';
const TIPOS = { html: 'text/html', js: 'text/javascript', css: 'text/css', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml', json: 'application/json' };
async function prototipo({ porta = 5054, udp = 41554, largura = 1440, altura = 900, hash = '' } = {}) {
  const s = await estacao({ porta, udp, largura, altura });
  const ctx = s.E.app.context();
  await ctx.route('http://coop.local/**', (route) => {
    let p = route.request().url().replace('http://coop.local', '').split('#')[0].split('?')[0];
    if (p === '/' || p === '') p = '/index.html';
    const ext = p.split('.').pop();
    route.fulfill({ path: BASE + decodeURIComponent(p), contentType: (TIPOS[ext] || 'text/plain') + '; charset=utf-8', headers: { 'Cache-Control': 'no-store' } }).catch(() => route.fulfill({ status: 404, body: 'x' }));
  });
  s.erros.length = 0;
  await s.page.goto('http://coop.local/' + hash);
  await s.page.waitForFunction(() => window.BC && BC.estacao && BC.estacao.terminal, null, { timeout: 20000 });
  await esperar(1200);
  return s;
}

module.exports = { estacao, prototipo, EVID, esperar };
