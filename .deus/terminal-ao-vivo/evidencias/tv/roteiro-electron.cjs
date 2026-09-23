/* babel-coop · roda docs/testes/roteiro.js (a mesma função) numa janela ESCONDIDA do Electron do app, sem Google Chrome.
   O roteiro serve o protótipo por route em http://coop.local (o contexto do Electron intercepta); page.context().newPage()
   vira outra janela escondida do app (o Electron não cria páginas pelo contexto). Portas da TV: HTTP 5032, UDP 41532.
   Uso (da pasta app/): node ../.deus/terminal-ao-vivo/evidencias/tv/roteiro-electron.cjs [saida.json] */
'use strict';
const fs = require('fs');
const path = require('path');
const { abrirEstacao } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/testes/e2e/estacao.js');
const ROTEIRO = '/Users/matheussilveirapro/Desktop/babel-coop/docs/testes/roteiro.js';

async function janela(app, largura, altura) {
  const antes = new Set(app.windows());
  const nova = app.waitForEvent('window', { predicate: (p) => !antes.has(p), timeout: 20000 });
  const id = await app.evaluate(({ BrowserWindow }, o) => {
    const w = new BrowserWindow({ show: false, width: o.l, height: o.a, useContentSize: true, backgroundColor: '#060b16', webPreferences: { contextIsolation: true, backgroundThrottling: false } });
    w.loadURL('about:blank');
    return w.id;
  }, { l: largura, a: altura });
  const page = await nova;
  return embrulhar(app, page, id);
}

/* a page do Playwright com: context() → { route, newPage } e setViewportSize → tamanho da janela escondida */
function embrulhar(app, page, id) {
  const ctx = app.context();
  const ctxShim = { route: (...a) => ctx.route(...a), unrouteAll: (...a) => ctx.unrouteAll(...a), newPage: () => janela(app, 1280, 720) };
  return new Proxy(page, {
    get(alvo, k) {
      if (k === 'context') return () => ctxShim;
      if (k === 'setViewportSize') return async ({ width, height }) => { await app.evaluate(({ BrowserWindow }, o) => { const w = BrowserWindow.fromId(o.id); if (w) w.setContentSize(o.w, o.h); }, { id, w: width, h: height }); await page.waitForTimeout(150); };
      const v = alvo[k];
      return typeof v === 'function' ? v.bind(alvo) : v;
    }
  });
}

(async () => {
  const saida = process.argv[2];
  const e = await abrirEstacao({ nome: 'tv-roteiro', porta: 5032, descoberta: 41532 });
  let r = null;
  try {
    await e.page.waitForLoadState('domcontentloaded');
    /* a pilha completa de cada erro de página (o roteiro guarda só a primeira linha) */
    e.app.on('window', (p) => p.on('pageerror', (x) => console.log('[pageerror]', (p.url() || '').slice(0, 40), String(x && x.stack || x).split('\n').slice(0, 4).join(' ⏎ '))));
    const pg = await janela(e.app, 1400, 860);
    const src = fs.readFileSync(ROTEIRO, 'utf8');
    const fn = eval('(' + src + ')'); /* o próprio arquivo do roteiro, sem cópia */
    const t0 = Date.now();
    r = await fn(pg);
    r.duracao_s = Math.round((Date.now() - t0) / 1000);
    r.motor = 'Electron ' + (await e.app.evaluate(() => process.versions.electron)) + ' (janelas escondidas)';
    console.log(JSON.stringify({ resumo: r.resumo, falhas: r.falhas, duracao_s: r.duracao_s, motor: r.motor }, null, 1));
    console.log(r.tudo.join('\n'));
    if (saida) fs.writeFileSync(saida, JSON.stringify(r, null, 1));
  } catch (err) { console.error('FALHOU:', err && err.stack || err); }
  finally { await e.fechar(); }
})();
