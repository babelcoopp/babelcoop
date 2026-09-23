/* Roda docs/testes/roteiro.js (a mesma função, lida do arquivo) numa página do Electron do app, janela escondida.
   O protótipo é servido por route em http://coop.local, como no roteiro original. Sem Google Chrome.
   Uso: node roteiro-electron.cjs <saida.json> [--prints prefixo] */
'use strict';
const fs = require('fs');
const path = require('path');
const { estacao, EVID, esperar } = require('./abrir.cjs');

const ROTEIRO = process.env.ROTEIRO || '/Users/matheussilveirapro/Desktop/babel-coop/docs/testes/roteiro.js';
const saida = process.argv[2] || path.join(EVID, 'roteiro.json');
const prefixo = (process.argv.indexOf('--prints') > 0) ? process.argv[process.argv.indexOf('--prints') + 1] : null;

(async () => {
  const s = await estacao({ porta: 5052, udp: 41552 });
  const { E } = s;
  const r = { quando: new Date().toISOString(), onde: 'Electron do app (janela escondida), protótipo servido em http://coop.local por route' };
  let janelas = [];
  try {
    const ctx = E.app.context();
    /* o roteiro abre a TV com page.context().newPage(): no Electron a página nova é uma BrowserWindow escondida */
    const page = E.page;
    const ctxProxy = new Proxy(ctx, {
      get(alvo, k) {
        if (k === 'newPage') {
          return async () => {
            const esperaJanela = E.app.waitForEvent('window');
            await E.app.evaluate(({ BrowserWindow }) => { const w = new BrowserWindow({ show: false, width: 1280, height: 720 }); w.loadURL('about:blank'); });
            const p = await esperaJanela;
            janelas.push(p);
            return p;
          };
        }
        const v = alvo[k];
        return typeof v === 'function' ? v.bind(alvo) : v;
      }
    });
    const pageProxy = new Proxy(page, {
      get(alvo, k) {
        if (k === 'context') return () => ctxProxy;
        const v = alvo[k];
        return typeof v === 'function' ? v.bind(alvo) : v;
      }
    });
    const src = fs.readFileSync(ROTEIRO, 'utf8');
    /* eval de propósito: o roteiro é um arquivo do próprio repositório no formato "async (page) => {…}" (o mesmo que o
       browser_run_code_unsafe executava); nada vem de fora */
    const fn = eval('(' + src.replace(/^\s*\/\*[\s\S]*?\*\/\s*/, '') + ')');
    const t0 = Date.now();
    r.resultado = await fn(pageProxy);
    r.segundos = Math.round((Date.now() - t0) / 1000);
    if (prefixo) {
      await page.evaluate(() => { BC.estacao.fecharTodas(); });
      await page.screenshot({ path: path.join(EVID, prefixo + '-fim-do-roteiro.png') });
    }
    r.errosPaginaForaDoRoteiro = s.erros;
  } catch (e) { r.falha = String(e && e.stack || e).slice(0, 2000); }
  fs.writeFileSync(saida, JSON.stringify(r, null, 2));
  console.log(JSON.stringify({ resumo: r.resultado && r.resultado.resumo, falhas: r.resultado && r.resultado.falhas, falha: r.falha, segundos: r.segundos }, null, 2));
  for (const j of janelas) { try { await j.close(); } catch (e) { /* já fechou */ } }
  await s.fechar();
})();
