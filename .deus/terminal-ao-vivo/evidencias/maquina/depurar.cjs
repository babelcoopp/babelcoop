'use strict';
const { estacaoFundada, espera } = require('./maquina-prova.cjs');
(async () => {
  const E = await estacaoFundada(5026, 41526, 'maquina-dep');
  const { page } = E;
  try {
    await page.evaluate(() => { BC.estacao.fecharTodas(); BC.maquina.abrir('clinicas'); });
    await espera(800);
    await page.click('.mq2 [data-acao="mq-testar-abrir"]'); await espera(300);
    await page.click('.mq2 .mq-zoom [data-z="inteira"]'); await espera(300); await page.click('.mq2 .mq-dominio[data-d="agenda"]'); await espera(400);
    const info = await page.evaluate(() => {
      const el = document.querySelector('.mq2 .mq-peca[data-no="agendamentos"]'), r = el.getBoundingClientRect(), p = document.querySelector('.mq2 .mq-palco').getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2, hit = document.elementFromPoint(x, y);
      return { r: [r.left, r.top, r.width, r.height].map(Math.round), palco: [p.left, p.top, p.width, p.height].map(Math.round), hit: hit && (hit.closest('[data-no]') || {}).dataset, esc: document.querySelector('.mq2 .mq-mesa').style.transform, scroll: document.querySelector('.mq2 .mq-palco').scrollTop };
    });
    console.log(JSON.stringify(info));
    await page.evaluate(() => { window.__log = []; ['mousedown','mouseup','click','dblclick'].forEach((t) => document.addEventListener(t, (e) => { const n = e.target.closest && e.target.closest('[data-no]'); window.__log.push(t + ':' + e.detail + ':' + (n ? n.dataset.no : e.target.className)); }, true)); });
    await page.dblclick('.mq2 .mq-peca[data-no="agendamentos"]');
    console.log(await page.evaluate(() => window.__log.join(' | ')));
    console.log(await page.evaluate(() => { const el = document.querySelector('.mq2 .mq-peca[data-no="agendamentos"]'); const r = el && el.getBoundingClientRect(); return JSON.stringify({ r: r && [r.left, r.top, r.width, r.height].map(Math.round), palcoScroll: document.querySelector('.mq2 .mq-palco').scrollTop }); }));
    await espera(400);
    console.log(await page.evaluate(() => JSON.stringify({ sel: BC.maquina.maquinas.clinicas.sel, zoom: BC.maquina.maquinas.clinicas.zoom, scroll: document.querySelector('.mq2 .mq-palco').scrollTop, rol: BC.maquina.maquinas.clinicas.rolagem })));
  } finally { console.log('erros', E.erros); await E.fechar(); }
})();
