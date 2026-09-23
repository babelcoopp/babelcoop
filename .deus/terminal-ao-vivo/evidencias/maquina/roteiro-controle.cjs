/* controle: o mesmo roteiro, com a maquina.js antiga (git HEAD) servida no lugar da nova, para saber se uma falha é da Máquina */
'use strict';
const fs = require('fs');
const path = require('path');
const { abrirEstacao, raizTemporaria } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/testes/e2e/estacao.js');
const ANTIGA = process.argv[2], SAIDA = process.argv[3];
(async () => {
  const E = await abrirEstacao({ nome: 'maquina-ctl', raiz: raizTemporaria('maquina-ctl'), porta: 5027, descoberta: 41527 });
  try {
    await E.page.waitForLoadState();
    const src = fs.readFileSync('/Users/matheussilveirapro/Desktop/babel-coop/docs/testes/roteiro.js', 'utf8');
    const fn = (0, eval)('(' + src + '\n)');
    const { app, page } = E;
    const ctx = page.context();
    const ctxProxy = new Proxy(ctx, { get(a, k) { if (k === 'route') return async (u, h) => { await a.route(u, h); await a.route('**/maquina.js', (r) => r.fulfill({ body: fs.readFileSync(ANTIGA, 'utf8'), contentType: 'text/javascript; charset=utf-8' })); await a.route('**/maquina-2030.css', (r) => r.fulfill({ body: '', contentType: 'text/css' })); }; if (k === 'newPage') return async () => { const nova = app.waitForEvent('window'); await app.evaluate(({ BrowserWindow }) => { const w = new BrowserWindow({ show: false, width: 1280, height: 720 }); w.loadURL('about:blank'); }); const p = await nova; await p.waitForLoadState().catch(() => {}); return p; }; const v = a[k]; return typeof v === 'function' ? v.bind(a) : v; } });
    const pg = new Proxy(page, { get(a, k) { if (k === 'context') return () => ctxProxy; const v = a[k]; return typeof v === 'function' ? v.bind(a) : v; } });
    const r = await fn(pg);
    fs.writeFileSync(SAIDA, JSON.stringify(r, null, 2));
    console.log(r.resumo); r.falhas.forEach((f) => console.log('FALHA', JSON.stringify(f)));
  } finally { await E.fechar(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
