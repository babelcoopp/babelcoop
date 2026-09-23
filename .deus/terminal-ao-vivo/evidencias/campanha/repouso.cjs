'use strict';
const { estacao, esperar } = require('./abrir.cjs');
(async () => {
  const s = await estacao({ porta: 5058, udp: 41558 });
  const p = s.page;
  const g = await p.evaluate(() => BC.campanha.gerar({ nome: 'Clínica Vida', para: 'carla', prazo: '30/09' }));
  await p.waitForFunction((id) => BC.campanha.estado(id).estado === 'pronta', g.id, { timeout: 15000 });
  await p.evaluate((id) => BC.campanha.ok(id, '*'), g.id);
  for (const t of [2000, 6000]) {
    await esperar(t);
    const r = await p.evaluate(() => { const pal = document.querySelector('.cp-palco:not([hidden])'); return document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.target && pal.contains(a.effect.target)).map((a) => { const el = a.effect.target, tm = a.effect.getTiming(); return { alvo: (el.getAttribute('class') || el.tagName), dur: tm.duration, it: tm.iterations, t: Math.round(a.currentTime), kf: JSON.stringify(a.effect.getKeyframes()).slice(0, 160) }; }); });
    console.log(t, JSON.stringify(r, null, 1));
  }
  await s.fechar();
})();
