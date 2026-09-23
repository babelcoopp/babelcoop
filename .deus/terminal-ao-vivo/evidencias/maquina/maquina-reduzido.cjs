/* prefers-reduced-motion: o pulso não anda, mas a cor, a narração e o resultado continuam (reduzir, não remover) */
'use strict';
const fs = require('fs');
const path = require('path');
const { estacaoFundada, espera, EVID } = require('./maquina-prova.cjs');
(async () => {
  const E = await estacaoFundada(5028, 41528, 'maquina-red');
  const { page } = E;
  const r = {};
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => { BC.estacao.fecharTodas(); BC.maquina.abrir('clinicas'); });
    await espera(600);
    r.semMovimento = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    const t0 = Date.now();
    await page.click('.mq2 [data-acao="mq-testar-abrir"]');
    await page.click('.mq-teste-form button[type="submit"]');
    await espera(900);
    r.durante = await page.evaluate(() => ({ pontos: document.querySelectorAll('.mq-fx .mq-ponto').length, faiscas: document.querySelectorAll('.mq-fx .mq-faisca').length, acesas: document.querySelectorAll('.mq2 [data-luz-cor]').length, luzes: Array.from(document.querySelectorAll('.mq2 .mq-peca[data-luz-t]')).map((e) => e.style.getPropertyValue('--luz')) }));
    await page.waitForFunction(() => BC.maquina.retrato('clinicas').funcionando, null, { timeout: 20000, polling: 100 });
    r.segundos = Math.round((Date.now() - t0) / 100) / 10;
    await espera(600);
    r.fim = await page.evaluate(() => { const m = BC.maquina.maquinas.clinicas; return { passou: m.teste.passou, barrado: m.teste.barrado, log: m.teste.log.length, pontos: m.pontos.map((p) => p.pts), corpo: m.pecas.filter((p) => p.corpo).length, animando: Array.from(document.querySelectorAll('.mq2 *')).filter((e) => getComputedStyle(e).animationName !== 'none').length }; });
    await page.screenshot({ path: path.join(EVID, 'depois-16-movimento-reduzido.png') });
    r.erros = E.erros.slice();
  } catch (e) { r.falhou = String(e && e.message || e); }
  finally { fs.writeFileSync(path.join(EVID, 'depois-reduzido.json'), JSON.stringify(r, null, 2)); await E.fechar(); }
  console.log(JSON.stringify(r, null, 1));
})();
