/* sonda: a TV (2ª janela do Electron) recebe o estado da Estação pelo canal? (porta 5045) */
'use strict';
const { abrirEstacao } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/testes/e2e/estacao.js');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const e = await abrirEstacao({ nome: 'mapa-canal', porta: 5045, descoberta: 41545 });
  try {
    const { app, page } = e;
    await page.waitForLoadState('domcontentloaded');
    await e.api('/api/fundar', { nome: 'Theus' });
    await page.reload(); await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.BC && BC.mapaVivo, null, { timeout: 30000 }); await esperar(1500);
    console.log("clone/tamanho", JSON.stringify(await page.evaluate(() => { let c = "ok"; try { structuredClone(BC.loja.estado); } catch (x) { c = x.message; } return { clone: c, kb: Math.round(JSON.stringify(BC.loja.estado).length / 1024) }; })));
    for (const rodada of [1]) {
      await app.evaluate(({ BrowserWindow }) => { const w = new BrowserWindow({ show: false, width: 1280, height: 720 }); w.loadURL('http://localhost:5045/#tv'); });
      const tv = await app.waitForEvent('window'); await tv.waitForLoadState('domcontentloaded');
      const t0 = Date.now(); let r;
      for (let i = 0; i < 20; i++) { await esperar(500); r = await tv.evaluate(() => ({ v: BC.loja.estado.v, estacaoViva: BC.loja.conectado('estacao'), lider: BC.loja.lider })); if (r.v > 5) break; }
      const est = await page.evaluate(() => ({ v: BC.loja.estado.v, lider: BC.loja.lider, tvViva: BC.loja.conectado('tv') }));
      await page.evaluate(() => BC.loja.fazer('recado', 'teste do canal'));
      await esperar(1200);
      const r2 = await tv.evaluate(() => ({ v: BC.loja.estado.v, recado: JSON.stringify(BC.loja.estado.mural || []).indexOf('teste do canal') !== -1 }));
      console.log('rodada', rodada, 'ms', Date.now() - t0, 'TV', JSON.stringify(r), 'Estação', JSON.stringify(est), 'depois de uma ação', JSON.stringify(r2));
    }
  } catch (x) { console.error(x); } finally { await e.fechar(); }
})();
