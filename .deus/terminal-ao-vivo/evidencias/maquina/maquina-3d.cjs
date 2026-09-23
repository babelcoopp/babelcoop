/* "Ver em 3D" a partir da ficha da peça: a vitrine do PEÇAS (midia/pecas/pecas.js) abre numa camada própria e fecha com Esc */
'use strict';
const fs = require('fs');
const path = require('path');
const { estacaoFundada, espera, EVID } = require('./maquina-prova.cjs');
(async () => {
  const E = await estacaoFundada(5029, 41529, 'maquina-3d');
  const { page } = E;
  const r = {};
  try {
    await page.evaluate(() => { BC.estacao.fecharTodas(); BC.maquina.abrir('clinicas'); });
    await page.waitForFunction(() => !!(window.BC && BC.pecas), null, { timeout: 10000 });
    await page.evaluate(() => BC.estacao.render());
    await espera(400);
    await page.click('.mq2 .mq-peca[data-no="agendamentos"]');
    await espera(200);
    if (await page.$('.mq2 .mq-ficha.recolhida')) await page.click('.mq2 .mq-ficha-alternar');
    await espera(300);
    await page.click('.mq2 [data-acao="mq-3d"]');
    await page.waitForFunction(() => { const p = document.querySelector('#mq-3d .pc-palco'); return p && (p.dataset.estado === 'corpo' || p.dataset.estado === 'falhou'); }, null, { timeout: 30000 }).catch(() => {});
    await espera(800);
    r.aberto = await page.evaluate(() => { const p = document.querySelector('#mq-3d .pc-palco'); const u = BC.pecas.ultimo && BC.pecas.ultimo(); return { estado: p && p.dataset.estado, peca: p && p.dataset.peca, canvas: !!document.querySelector('#mq-3d canvas'), ultimo: u }; });
    await page.screenshot({ path: path.join(EVID, 'depois-17-ver-em-3d.png') });
    await page.keyboard.press('Escape');
    await espera(200);
    r.fechou = await page.evaluate(() => !document.getElementById('mq-3d'));
    r.erros = E.erros.slice();
  } catch (e) { r.falhou = String(e && e.message || e); }
  finally { fs.writeFileSync(path.join(EVID, 'depois-3d.json'), JSON.stringify(r, null, 2)); await E.fechar(); }
  console.log(JSON.stringify(r, null, 1));
})();
