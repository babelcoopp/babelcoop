/* larguras: tela larga sem terminal (5 colunas + plano), celular a 400 px, e a TV lendo o evento da campanha */
'use strict';
const path = require('path');
const fs = require('fs');
const { prototipo, EVID, esperar } = require('./abrir.cjs');
(async () => {
  const s = await prototipo({ porta: 5059, udp: 41559, largura: 1920, altura: 1080 });
  const p = s.page, r = {};
  try {
    await p.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.alternarTerminal(false); });
    const g = await p.evaluate(() => BC.campanha.gerar({ nome: 'Estúdio Norte', meta: '25 alunos', para: 'eva', prazo: '10/10', por: 'theus' }));
    await p.waitForFunction((id) => BC.campanha.estado(id).estado === 'pronta', g.id, { timeout: 15000 });
    await esperar(1200);
    r.largo = await p.evaluate(() => { const pal = document.querySelector('.cp-palco:not([hidden])'), pe = pal.querySelector('.cp-pecas'); return { palco: pal.clientWidth, colunas: getComputedStyle(pe).gridTemplateColumns.split(' ').length, plano: getComputedStyle(pal.querySelector('.cp-corpo')).gridTemplateColumns, transborda: pal.scrollWidth > pal.clientWidth + 1 }; });
    await p.screenshot({ path: path.join(EVID, 'depois-14-tela-larga.png') });
    /* a TV (janela escondida no mesmo contexto) lê o evento da campanha */
    const esperaJanela = s.E.app.waitForEvent('window');
    await s.E.app.evaluate(({ BrowserWindow }) => { const w = new BrowserWindow({ show: false, width: 1280, height: 720 }); w.loadURL('http://coop.local/#tv'); });
    const tv = await esperaJanela;
    await tv.waitForTimeout(2500);
    await p.evaluate((id) => BC.campanha.ok(id, '*'), g.id);
    await tv.waitForTimeout(1500);
    r.tv = await tv.evaluate(() => ({ evento: (document.getElementById('tv-evento') || {}).innerText || '', temCampanha: /Campanha "?Estúdio Norte"? no ar/.test(document.body.innerText), botoes: document.querySelectorAll('#vista-tv button, #vista-tv input').length, cp: !!document.querySelector('.cp-palco') }));
    await tv.screenshot({ path: path.join(EVID, 'depois-16-tv-evento.png') });
    await tv.close();
    /* celular */
    await s.E.app.evaluate(({ BrowserWindow }) => { const w = BrowserWindow.getAllWindows()[0]; w.setContentSize(400, 860); });
    await esperar(800);
    await p.evaluate((id) => { BC.estacao.alternarTerminal(true); BC.campanha.abrir(id); }, g.id);
    await esperar(700);
    r.celular = await p.evaluate(() => { const pal = document.querySelector('.cp-palco:not([hidden])'); return pal ? { palco: pal.clientWidth, transborda: pal.scrollWidth > pal.clientWidth + 1, colunas: getComputedStyle(pal.querySelector('.cp-pecas')).gridTemplateColumns.split(' ').length, larguraJanela: innerWidth } : null; });
    await p.screenshot({ path: path.join(EVID, 'depois-15-celular.png') });
    r.erros = s.erros;
  } catch (e) { r.falha = String(e && e.stack || e).slice(0, 1500); }
  fs.writeFileSync(path.join(EVID, 'depois-larguras.json'), JSON.stringify(r, null, 2));
  console.log(JSON.stringify(r, null, 1));
  await s.fechar();
})();
