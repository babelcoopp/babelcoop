/* sonda: por que o mapa reaberto acende galhos sem evento novo? (Electron escondido, porta 5044) */
'use strict';
const { abrirEstacao } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/testes/e2e/estacao.js');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const e = await abrirEstacao({ nome: 'mapa-sonda2', porta: 5044, descoberta: 41544 });
  try {
    const { app, page } = e;
    await page.waitForLoadState('domcontentloaded');
    await e.api('/api/fundar', { nome: 'Theus' });
    await page.reload(); await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.BC && BC.mapaVivo, null, { timeout: 30000 }); await esperar(1500);
    const ev = (fn, ...a) => page.evaluate(fn, ...a);
    const id = await ev(() => { const t = { escrever: () => {}, cartao: () => {}, mostrar: () => {} }; BC.estacao.fecharTodas(); BC.mapaAgente.pedido('cria um mapa sobre Teste com A, B e C', { nome: 'Rita' }, t); return BC.estacao.abaAtual().ref; });
    await esperar(2000);
    await ev((id) => { const est = JSON.parse(BC.loja.arquivo(id).conteudo); BC.mapaVivo.fechar(id, est.nodes[1].id); }, id);
    await esperar(1500);
    const log = async (quando) => console.log(quando, JSON.stringify(await ev(() => ({ acesas: BC.mapaVivo.medidas().acesas.length, trans: BC.mapaVivo.medidas().transicoes.map((t) => t.fase + '|' + t.rotulo + '|antes:' + t.antes), arquivos: BC.loja.estado.arquivos.length, vivoA: Object.values(BC.mapaVivo.vivo(BC.estacao.abaAtual().ref)), comps: BC.mapaVivo.componentes(), v: BC.loja.estado.v }))));
    await log('depois de fechar A:');
    await ev(() => BC.estacao.abrir('demandas')); await esperar(800);
    await ev((id) => BC.explorador.abrirArquivo(id), id); await esperar(2000);
    await log('reaberto:');
    await app.evaluate(({ BrowserWindow }) => { const w = new BrowserWindow({ show: false, width: 1280, height: 720 }); w.loadURL('http://localhost:5044/#tv'); });
    const tv = await app.waitForEvent('window'); await tv.waitForLoadState('domcontentloaded'); await esperar(4000);
    await log('TV aberta:'); console.log('TV:', JSON.stringify(await tv.evaluate(() => ({ papel: BC.loja.papel, m: BC.mapaVivo.medidas().transicoes, verif: BC.mapaVivo.medidas().verificacoes }))));
    await ev((id) => BC.mapaVivo.apresentar(id, 0), id); await esperar(2500);
    await log('apresentando:');
  } catch (x) { console.error(x); } finally { await e.fechar(); }
})();
