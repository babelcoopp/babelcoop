/* babel-coop · roda docs/testes/roteiro.js (a mesma função, lida do arquivo) numa página do Electron do app, janela escondida.
   O protótipo é servido por route em http://coop.local, como no roteiro original. Sem Google Chrome.
   page.context().newPage() (TV, folha de ícones) vira uma BrowserWindow escondida do mesmo Electron.
   Portas do agente LIMPO: HTTP 5110, descoberta UDP 41610. Uso: cd app && node ../.deus/.../limpo/roteiro-electron.cjs <saida.json> */
'use strict';
const fs = require('fs');
const path = require('path');
const { abrirEstacao } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/testes/e2e/estacao.js');
const ROTEIRO = '/Users/matheussilveirapro/Desktop/babel-coop/docs/testes/roteiro.js';
const EV = '/Users/matheussilveirapro/Desktop/babel-coop/.deus/terminal-ao-vivo/evidencias/limpo';
const saida = process.argv[2] || path.join(EV, 'roteiro.json');

(async () => {
  const E = await abrirEstacao({ nome: 'limpo-roteiro', porta: 5110, descoberta: 41610 });
  const r = { quando: new Date().toISOString(), onde: 'Electron do app (janela escondida), protótipo servido em http://coop.local por route' };
  const janelas = [];
  try {
    await E.page.waitForLoadState('domcontentloaded');
    const ctx = E.app.context();
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
    const pageProxy = new Proxy(E.page, {
      get(alvo, k) {
        if (k === 'context') return () => ctxProxy;
        const v = alvo[k];
        return typeof v === 'function' ? v.bind(alvo) : v;
      }
    });
    const src = fs.readFileSync(ROTEIRO, 'utf8');
    /* o roteiro é um arquivo do repositório no formato "async (page) => {…}" (o que o browser_run_code_unsafe executava) */
    const fn = eval('(' + src.replace(/^\s*\/\*[\s\S]*?\*\/\s*/, '') + ')');
    const t0 = Date.now();
    r.resultado = await fn(pageProxy);
    r.segundos = Math.round((Date.now() - t0) / 1000);
  } catch (e) { r.falha = String(e && e.stack || e).slice(0, 2000); }
  fs.writeFileSync(saida, JSON.stringify(r, null, 2));
  const res = r.resultado || {};
  console.log(JSON.stringify({ resumo: res.resumo, falhas: res.falhas, falha: r.falha, segundos: r.segundos }, null, 2));
  for (const j of janelas) { try { await j.close(); } catch (e) { /* já fechou */ } }
  await E.fechar();
})();
