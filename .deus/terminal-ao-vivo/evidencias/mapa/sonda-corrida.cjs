/* sonda: o observatorio.js do iframe chega 1,5 s atrasado (rede lenta); o estado vivo do mapa tem de chegar mesmo assim.
   Protótipo puro servido por route em http://coop.local, dentro do Electron do app (janela escondida). Porta 5047. */
'use strict';
const fs = require('fs');
const { abrirEstacao } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/testes/e2e/estacao.js');
const BASE = '/Users/matheussilveirapro/Desktop/babel-coop/prototipo';
const T = { html: 'text/html', js: 'text/javascript', css: 'text/css', png: 'image/png' };
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const E = await abrirEstacao({ nome: 'mapa-corrida', porta: 5047, descoberta: 41547 });
  const erros = [];
  try {
    const page = E.page;
    page.on('pageerror', (e) => erros.push(String(e).slice(0, 200)));
    await E.app.context().route('http://coop.local/**', async (route) => {
      let p = route.request().url().replace('http://coop.local', '').split('#')[0].split('?')[0]; if (p === '/' || p === '') p = '/index.html';
      if (/observatorio\.js$/.test(p)) await esperar(1500);
      const ext = p.split('.').pop();
      let corpo = fs.readFileSync(BASE + decodeURIComponent(p)); if (process.env.SEM_AVISO && /observatorio\.js$/.test(p)) corpo = String(corpo).replace("enviar({ tipo: 'babel-mapa-observatorio' });", "");
      try { route.fulfill({ body: corpo, contentType: (T[ext] || 'text/plain') + '; charset=utf-8', headers: { 'Cache-Control': 'no-store' } }); } catch (e) { route.fulfill({ status: 404, body: 'x' }); }
    });
    await page.goto('http://coop.local/'); await esperar(1500);
    const id = await page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.terminal.ia('cria um mapa sobre Corrida com A, B e C'); return null; });
    await esperar(3000);
    const arq = await page.evaluate(() => BC.estacao.abaAtual().ref);
    await page.evaluate((a) => { const est = JSON.parse(BC.loja.arquivo(a).conteudo); BC.mapaVivo.materializar(a, est.nodes[1].id, 'tela'); BC.mapaVivo.fechar(a, est.nodes[2].id); }, arq);
    await esperar(1200);
    await page.evaluate(() => BC.estacao.abrir('demandas')); await esperar(500);
    await page.evaluate((a) => BC.explorador.abrirArquivo(a), arq);
    await esperar(3500); /* 1,5 s de atraso + folga */
    const fr = page.frames().find((f) => /mindforge/.test(f.url()));
    const hud = await fr.evaluate(() => document.querySelector('.mf-hud-sup').innerText);
    const ok = /MATERIALIZADOS 1 · FECHADOS 1/.test(hud) && /ÚLTIMO SINAL/.test(hud);
    console.log(ok ? '✓' : '✗', 'observatório atrasado 1,5 s ainda recebe o estado vivo ·', JSON.stringify(hud), '· erros:', JSON.stringify(erros));
  } catch (x) { console.error('FALHOU', x); } finally { await E.fechar(); }
})();
