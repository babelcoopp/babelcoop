/* babel-coop · mede a TV (#tv) no app limpo: Electron escondido, raiz temporária nova, funda "Theus" e abre a TV em duas janelas
   escondidas, uma com backgroundThrottling padrão e outra com backgroundThrottling:false, para separar "janela escondida" de "chão parado".
   Rodar: cd app && node testes/e2e/tv-medir.js [saida.json] [pasta-dos-prints]   ·   Portas: HTTP 5291, UDP 41791 (TVMEDIR_PORTA / TVMEDIR_DESCOBERTA). */
'use strict';
const fs = require('fs');
const path = require('path');
const { abrirEstacao, raizTemporaria } = require('./estacao');

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function medir() {
  const v = [...document.querySelectorAll('video')].map((x) => ({ src: (x.currentSrc || x.src || '').split('/').pop(), paused: x.paused, t: +x.currentTime.toFixed(2), ready: x.readyState, muted: x.muted, loop: x.loop }));
  const m = window.BC && BC.tv && BC.tv.medidas ? BC.tv.medidas() : null;
  return {
    texto: document.body.innerText.replace(/\s+/g, ' ').slice(0, 1500), nan: /NaN/.test(document.body.innerText),
    exemplo: /Clínicas|Campinas|carla|Ana · Bruno|dados de exemplo|demonstração/i.test(document.body.innerText),
    rodape: (document.getElementById('tv-rodape') || {}).textContent, cronometro: (document.getElementById('tv-cronometro') || {}).textContent,
    hidden: document.hidden, visibilidade: document.visibilityState, videos: v, chao: m && m.chao, abertura: m && m.abertura
  };
}

(async () => {
  const raiz = raizTemporaria('tvmedir');
  const prints = process.argv[3] || raiz;
  fs.mkdirSync(prints, { recursive: true });
  const T = await abrirEstacao({ nome: 'tvmedir', raiz, porta: Number(process.env.TVMEDIR_PORTA || 5291), descoberta: Number(process.env.TVMEDIR_DESCOBERTA || 41791) });
  const { app, page } = T;
  const r = { erros: [] };
  try {
    await page.waitForFunction(() => !!document.getElementById('cbv-fundar'), null, { timeout: 20000 });
    await page.evaluate(() => { document.querySelector('#coop-boasvindas details').open = true; });
    await page.fill('#cbv-nome', 'Theus');
    await Promise.all([page.waitForEvent('load', { timeout: 20000 }), page.click('#cbv-fundar')]);
    await page.waitForFunction(() => window.BC && BC.real && BC.real.bemvindo && BC.real.bemvindo.eu && BC.real.bemvindo.eu.pronto && BC.loja.estado, null, { timeout: 25000 });
    await esperar(1500);

    for (const [nome, bt] of [['padrao', true], ['sem-throttling', false]]) {
      await app.evaluate(({ BrowserWindow }, a) => { const w = new BrowserWindow({ show: false, width: 1920, height: 1080, webPreferences: { contextIsolation: true, backgroundThrottling: a.bt } }); w.loadURL(a.url + '/?j=' + a.nome + '#tv'); }, { url: T.base, bt, nome });
      await esperar(2500);
      const tv = app.windows().find((w) => w.url().indexOf('j=' + nome) !== -1) || app.windows().find((w) => /#tv/.test(w.url()));
      if (!tv) { r[nome] = 'janela da TV não achada: ' + app.windows().map((w) => w.url()).join(', '); continue; }
      tv.on('pageerror', (e) => r.erros.push(nome + ': ' + String(e.stack || e.message).slice(0, 600)));
      const a = await tv.evaluate(medir);
      await esperar(2500);
      const b = await tv.evaluate(medir);
      /* o chão tem 4 s e volta ao começo: amostra o currentTime 6 vezes em 1,2 s e vê se andou */
      b.chaoAmostras = await tv.evaluate(async () => { const v = document.getElementById('tv-chao'), t = []; for (let i = 0; i < 6; i++) { t.push(v ? +v.currentTime.toFixed(2) : null); await new Promise((ok) => setTimeout(ok, 200)); } return t; });
      b.chaoAndou = b.chaoAmostras.some((t, i) => i && t !== b.chaoAmostras[i - 1]);
      r[nome] = { aos2s: a, aos5s: b };
      await tv.screenshot({ path: path.join(prints, 'tv-' + nome + '.png') });
    }
  } catch (e) { r.erro = e.message; }
  r.prints = prints;
  if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(r, null, 2));
  console.log(JSON.stringify(r, null, 2));
  await T.fechar().catch(() => {});
})();
