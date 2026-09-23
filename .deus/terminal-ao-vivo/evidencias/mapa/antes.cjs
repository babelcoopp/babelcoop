/* babel-coop · mapa · prints do ANTES (código do HEAD em mapamental.js e mindforge/), no Electron do app com a janela escondida */
'use strict';
const path = require('path');
const { abrirEstacao } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/testes/e2e/estacao.js');
const EV = '/Users/matheussilveirapro/Desktop/babel-coop/.deus/terminal-ao-vivo/evidencias/mapa';
(async () => {
  const e = await abrirEstacao({ nome: 'mapa-antes', porta: 5042, descoberta: 41542 });
  const erros = [];
  try {
    const { page } = e;
    page.on('pageerror', (x) => erros.push(String(x).slice(0, 200)));
    await page.waitForLoadState('domcontentloaded');
    await e.api('/api/fundar', { nome: 'Theus' });
    await page.reload(); await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    await page.evaluate(() => { const a = BC.loja.arquivo('equipe/Mapas/Babel Coop.mapa'); BC.estacao.fecharTodas(); BC.explorador.abrirArquivo(a.id); });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(EV, 'antes-1-estacao-mapa.png') });
    await page.locator('.ed-mapa').screenshot({ path: path.join(EV, 'antes-2-mapa-perto.png') });
    const fr = page.frames().find((f) => /mindforge/.test(f.url()));
    const alvo = fr.locator('.node', { hasText: 'TV' }).first();
    await alvo.click({ button: 'right' });
    await page.waitForTimeout(400);
    await page.locator('.ed-mapa').screenshot({ path: path.join(EV, 'antes-3-menu-do-galho.png') });
    const menu = await fr.evaluate(() => Array.from(document.querySelectorAll('#contextMenu button')).map((b) => b.textContent.trim()));
    console.log(JSON.stringify({ menu, erros }));
  } catch (err) { console.error('FALHOU:', err.stack); }
  finally { await e.fechar(); }
})();
