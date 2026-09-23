'use strict';
const { prototipo, esperar } = require('./abrir.cjs');
(async () => {
  const s = await prototipo({ porta: 5059, udp: 41559, largura: 980, altura: 860 });
  const p = s.page;
  const g = await p.evaluate(() => { BC.estacao.fecharTodas(); return BC.campanha.gerar({ nome: 'Estúdio Norte', para: 'eva', prazo: '10/10' }); });
  await p.waitForFunction((id) => BC.campanha.estado(id).estado === 'pronta', g.id, { timeout: 15000 });
  await esperar(900);
  const medir = () => p.evaluate(() => { const pal = document.querySelector('.cp-palco:not([hidden])'), R = pal.getBoundingClientRect(); const fora = [...pal.querySelectorAll('*')].filter((el) => { const r = el.getBoundingClientRect(); return r.width && r.right > R.right + 1 && !el.closest('.cp-tela-quadro'); }).slice(0, 12).map((el) => (el.getAttribute('class') || el.tagName) + ' → ' + Math.round(el.getBoundingClientRect().right - R.right)); return { largura: pal.clientWidth, scroll: pal.scrollWidth, fora }; });
  console.log('980 com lateral e terminal', JSON.stringify(await medir(), null, 1));
  await p.setViewportSize({ width: 400, height: 860 });
  await esperar(800);
  console.log('celular 400', JSON.stringify(await medir(), null, 1));
  await p.screenshot({ path: '/Users/matheussilveirapro/Desktop/babel-coop/.deus/terminal-ao-vivo/evidencias/campanha/depois-15-celular.png' });
  console.log('erros', s.erros);
  await s.fechar();
})();
