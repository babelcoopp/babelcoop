/* Print da Estação real (Electron, janela oculta) com a casca 2030; fecha tudo no fim. */
const path = require('path');
const { abrirEstacao } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/testes/e2e/estacao.js');
(async () => {
  const saida = process.argv[2];
  const e = await abrirEstacao({ nome: 'casca', porta: 4893, descoberta: 41393 });
  try {
    const { page } = e;
    await page.waitForLoadState('domcontentloaded');
    const f = await e.api('/api/fundar', { nome: 'Theus' }); console.log('fundar:', JSON.stringify(f).slice(0, 80));
    await page.reload(); await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => { try { const a = BC.loja.estado.arquivos.find((a) => /README\.md$/.test(a.caminho)); if (a) BC.explorador.abrirArquivo(a.id); } catch (x) {} });
    await page.waitForTimeout(2500);
    await page.evaluate(() => document.fonts && document.fonts.ready);
    const info = await page.evaluate(() => ({
      url: location.href, tamanho: innerWidth + 'x' + innerHeight,
      casca: !!document.querySelector('link[href="casca-2030.css"]'), tokens: !!document.querySelector('link[href="tokens.css"]'),
      vista: document.documentElement.dataset.vista || null,
      topo: document.querySelector('.e-topo') ? getComputedStyle(document.querySelector('.e-topo')).height : null,
      barra: document.querySelector('.e-atividades') ? getComputedStyle(document.querySelector('.e-atividades')).width : null,
      regiao: document.querySelector('.e-topo') ? getComputedStyle(document.querySelector('.e-topo')).getPropertyValue('-webkit-app-region') || getComputedStyle(document.querySelector('.e-topo')).webkitAppRegion : null,
      s0: getComputedStyle(document.documentElement).getPropertyValue('--s0').trim(),
      painel: document.getElementById('e-painel') ? document.getElementById('e-painel').className : null
    }));
    console.log(JSON.stringify(info));
    await page.screenshot({ path: saida, timeout: 15000 });
    console.log('print:', saida);
  } catch (err) { console.error('FALHOU:', err.message); }
  finally { await e.fechar(); }
})();
