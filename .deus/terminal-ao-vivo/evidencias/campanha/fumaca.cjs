/* fumaça: gera uma campanha pela API (como o conector coop vai chamar) e tira prints durante e depois */
'use strict';
const path = require('path');
const fs = require('fs');
const { estacao, prototipo, EVID, esperar } = require('./abrir.cjs');

(async () => {
  const modo = process.argv[2] || 'app';
  const s = modo === 'app' ? await estacao({ porta: 5056, udp: 41556 }) : await prototipo({ porta: 5057, udp: 41557 });
  const p = s.page, r = { modo };
  try {
    r.api = await p.evaluate(() => typeof (BC.campanha && BC.campanha.gerar));
    r.gerou = await p.evaluate(() => BC.campanha.gerar({ nome: 'Clínica Vida', meta: '40 clientes', para: 'carla', prazo: '30/09', por: 'theus' }));
    await esperar(2400);
    await p.screenshot({ path: path.join(EVID, 'fumaca-' + modo + '-1-gerando.png') });
    r.meio = await p.evaluate((id) => BC.campanha.estado(id), r.gerou.id);
    await esperar(6500);
    await p.screenshot({ path: path.join(EVID, 'fumaca-' + modo + '-2-pronta.png') });
    r.fim = await p.evaluate((id) => BC.campanha.estado(id), r.gerou.id);
    r.erros = s.erros;
  } catch (e) { r.falha = String(e && e.stack || e); }
  fs.writeFileSync(path.join(EVID, 'fumaca-' + modo + '.json'), JSON.stringify(r, null, 1));
  const est = (x) => x && x.pecas ? x.estado + ' · ' + x.pecas.map((q) => q.id + ':' + q.estado + ':' + q.progresso).join(' ') : x;
  console.log(JSON.stringify({ api: r.api, gerou: r.gerou && r.gerou.id, meio: est(r.meio), fim: est(r.fim), erros: r.erros, falha: r.falha }, null, 1));
  await s.fechar();
})();
