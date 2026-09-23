/* ANTES: o que acontece hoje quando se pede "gera a campanha …" (sem a F3) */
'use strict';
const path = require('path');
const fs = require('fs');
const { estacao, EVID, esperar } = require('./abrir.cjs');

(async () => {
  const s = await estacao({ porta: 5050, udp: 41550 });
  const r = {};
  try {
    const p = s.page;
    r.temTerminalSimulado = await p.evaluate(() => !!(BC.estacao.terminal && BC.estacao.terminal.ia));
    r.organismo = await p.evaluate(() => !!(window.BC && BC.organismo && BC.organismo.versao));
    r.bcCampanha = await p.evaluate(() => typeof (BC.campanha && BC.campanha.gerar));
    await p.screenshot({ path: path.join(EVID, 'antes-01-estacao.png') });
    if (r.temTerminalSimulado) {
      await p.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.terminal.ia('gera a campanha Clínica Vida para a Carla até 30/09'); });
      await esperar(1500);
      r.abaDepoisDoPedido = await p.evaluate(() => ({ tipo: BC.estacao.abaAtual().tipo, titulo: document.querySelector('#e-abas .e-aba[aria-selected="true"]') ? document.querySelector('#e-abas .e-aba[aria-selected="true"]').textContent : null }));
      r.campanhas = await p.evaluate(() => (BC.loja.estado.campanhas || []).length);
      await p.screenshot({ path: path.join(EVID, 'antes-02-pedido-gera-a-campanha.png') });
    }
    await p.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.abrir('metas'); });
    await esperar(600);
    await p.screenshot({ path: path.join(EVID, 'antes-03-metas-e-campanhas.png') });
    r.erros = s.erros;
  } catch (e) { r.falha = String(e && e.stack || e); }
  fs.writeFileSync(path.join(EVID, 'antes.json'), JSON.stringify(r, null, 2));
  console.log(JSON.stringify(r, null, 2));
  await s.fechar();
})();
