/* ANTES no protótipo puro: o pedido "gera a campanha …" no terminal simulado */
'use strict';
const path = require('path');
const fs = require('fs');
const { prototipo, EVID, esperar } = require('./abrir.cjs');

(async () => {
  const s = await prototipo({});
  const r = {};
  try {
    const p = s.page;
    await p.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.terminal.ia('gera a campanha Clínica Vida para a Carla até 30/09'); BC.estacao.terminal.mostrar(); });
    await esperar(1500);
    r.aba = await p.evaluate(() => ({ tipo: BC.estacao.abaAtual().tipo, ref: BC.estacao.abaAtual().ref || null }));
    r.arquivo = await p.evaluate(() => { const t = BC.estacao.abaAtual(); const a = t.ref && BC.loja.arquivo(t.ref); return a ? a.caminho : null; });
    r.campanhas = await p.evaluate(() => (BC.loja.estado.campanhas || []).length);
    r.ultimasLinhasTerminal = await p.evaluate(() => Array.from(document.querySelectorAll('.term-saida .term-linha')).slice(-4).map((l) => l.textContent.trim().slice(0, 140)));
    await p.screenshot({ path: path.join(EVID, 'antes-04-prototipo-gera-a-campanha.png') });
    r.erros = s.erros;
  } catch (e) { r.falha = String(e && e.stack || e); }
  fs.writeFileSync(path.join(EVID, 'antes-prototipo.json'), JSON.stringify(r, null, 2));
  console.log(JSON.stringify(r, null, 2));
  await s.fechar();
})();
