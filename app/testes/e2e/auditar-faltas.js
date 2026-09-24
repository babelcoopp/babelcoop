/* babel-coop · auditoria das FALTAS no app limpo (Electron escondido, raiz temporária nova)
   Funda "Theus" pela tela de boas-vindas e mede cada falta do .deus/terminal-ao-vivo/FALTAS.md.
   Rodar: cd app && node testes/e2e/auditar-faltas.js [saida.json]   ·   Portas: HTTP 5191, UDP 41691. */
'use strict';
const fs = require('fs');
const path = require('path');
const { abrirEstacao, raizTemporaria } = require('./estacao');

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const raiz = raizTemporaria('auditar');
  const T = await abrirEstacao({ nome: 'auditar', raiz, porta: Number(process.env.AUDITAR_PORTA || 5191), descoberta: Number(process.env.AUDITAR_DESCOBERTA || 41691) });
  const { app, page } = T;
  const erros = [];
  page.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
  const r = {};
  try {
    await page.waitForFunction(() => !!document.getElementById('cbv-fundar'), null, { timeout: 20000 });
    await page.evaluate(() => { document.querySelector('#coop-boasvindas details').open = true; });
    await page.fill('#cbv-nome', 'Theus');
    await Promise.all([page.waitForEvent('load', { timeout: 20000 }), page.click('#cbv-fundar')]);
    await page.waitForFunction(() => window.BC && BC.real && BC.real.bemvindo && BC.real.bemvindo.eu && BC.real.bemvindo.eu.pronto && BC.estacao && BC.estacao.ui && BC.loja.estado, null, { timeout: 25000 });
    await esperar(1500);

    /* F1: barra e avatares */
    r.barra = await page.evaluate(() => [...document.querySelectorAll('#e-atividades button, .e-atividades button, nav[aria-label] button')].map((b) => (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 20)));
    r.avatares = await page.evaluate(() => [...document.querySelectorAll('.avatar')].slice(0, 6).map((a) => { const s = getComputedStyle(a); return { cls: a.className, w: a.offsetWidth, sh: s.boxShadow, anim: s.animationName, borda: s.borderColor, pai: (a.parentElement || {}).className }; }));

    /* F7: paleta */
    r.paleta = await page.evaluate(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
      await new Promise((ok) => setTimeout(ok, 300));
      const inp = document.getElementById('paleta-entrada'); if (!inp) return 'sem paleta';
      inp.value = 'tema'; inp.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((ok) => setTimeout(ok, 200));
      const itens = [...document.querySelectorAll('#paleta-lista li')].map((l) => l.textContent.trim());
      document.getElementById('paleta').hidden = true;
      return itens;
    });

    /* F3: Máquina */
    await page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.abrir('maquina'); });
    await esperar(1500);
    r.maquina = await page.evaluate(() => ({ lateral: document.getElementById('e-lateral').textContent.replace(/\s+/g, ' ').slice(0, 300), conteudo: document.getElementById('e-conteudo').textContent.replace(/\s+/g, ' ').slice(0, 400), canvas: document.querySelectorAll('#e-conteudo canvas').length, botoes3d: [...document.querySelectorAll('#e-conteudo [data-acao]')].map((b) => b.dataset.acao).filter((a) => /3d|modo|vista/i.test(a)) }));
    await page.screenshot({ path: path.join(raiz, 'maquina.png') });

    /* F2 + F4.2: TV numa janela escondida */
    await app.evaluate(({ BrowserWindow }, url) => { const w = new BrowserWindow({ show: false, width: 1920, height: 1080 }); w.loadURL(url); }, T.base + '/#tv');
    await esperar(5000);
    const tv = app.windows().find((w) => /#tv/.test(w.url()));
    if (tv) {
      r.tv = await tv.evaluate(() => ({ texto: document.body.innerText.replace(/\s+/g, ' ').slice(0, 1500), nan: /NaN/.test(document.body.innerText), rodape: (document.getElementById('tv-rodape') || {}).textContent, videos: [...document.querySelectorAll('video')].map((v) => ({ src: (v.currentSrc || v.src || '').split('/').pop(), paused: v.paused, vis: getComputedStyle(v).display, ready: v.readyState })) }));
      await tv.screenshot({ path: path.join(raiz, 'tv.png') });
    } else r.tv = 'janela da TV não achada: ' + app.windows().map((w) => w.url()).join(', ');
  } catch (e) { r.erro = e.message; }
  r.erros = erros;
  r.prints = raiz;
  const saida = process.argv[2];
  if (saida) fs.writeFileSync(saida, JSON.stringify(r, null, 2));
  console.log(JSON.stringify(r, null, 2));
  await T.fechar().catch(() => {});
})();
