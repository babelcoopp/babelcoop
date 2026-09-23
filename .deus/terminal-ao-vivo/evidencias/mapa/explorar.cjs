/* babel-coop · mapa · sonda: abre a Estação real (Electron escondido), funda a equipe e diz o que existe na página */
'use strict';
const { abrirEstacao } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/testes/e2e/estacao.js');
(async () => {
  const e = await abrirEstacao({ nome: 'mapa-sonda', porta: 5041, descoberta: 41541 });
  const erros = [];
  try {
    const { page } = e;
    page.on('pageerror', (x) => erros.push(String(x).slice(0, 200)));
    await page.waitForLoadState('domcontentloaded');
    const f = await e.api('/api/fundar', { nome: 'Theus' });
    console.log('fundar:', JSON.stringify(f).slice(0, 120));
    await page.reload(); await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2500);
    const info = await page.evaluate(() => ({
      url: location.href, tam: innerWidth + 'x' + innerHeight,
      eu: BC.loja && BC.loja.eu, papel: BC.loja && BC.loja.papel,
      mapas: (BC.loja.estado.arquivos || []).filter((a) => a.tipo === 'mapa').map((a) => a.caminho),
      nArquivos: (BC.loja.estado.arquivos || []).length,
      organismo: !!(BC.organismo && BC.organismo.versao),
      termIa: !!(BC.estacao && BC.estacao.terminal && BC.estacao.terminal.ia),
      projetos: (BC.loja.estado.projetos || []).map((p) => p.id),
      campanha: typeof (BC.campanha && BC.campanha.gerar),
      endereco: Object.keys(BC.endereco || {}),
      maquina: Object.keys(BC.maquina || {})
    }));
    console.log(JSON.stringify(info, null, 1));
  } catch (err) { console.error('FALHOU:', err.message); }
  finally { console.log('erros:', JSON.stringify(erros)); await e.fechar(); }
})();
