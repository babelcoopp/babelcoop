'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { abrirEstacao } = require('./estacao');

test('TV carrega arquivo real, acompanha alteração e encerra a projeção', { timeout: 60000 }, async () => {
  const est = await abrirEstacao({ nome: 'projecao-real', porta: 5297, descoberta: 41797,
    executavel: path.join(__dirname, '../../dist/mac-arm64/babel-coop.app/Contents/MacOS/babel-coop') });
  try {
    const eu = await est.api('/api/fundar', { nome: 'Theus' });
    assert.ok(eu.pronto);
    await est.page.reload();
    await est.page.waitForFunction(() => window.BC && BC.real && BC.real.bemvindo && BC.loja.eu === BC.real.eu().id);
    const gravar = async (conteudo) => {
      const r = await fetch(est.base + '/api/arquivo?caminho=projecao.md', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-coop-quem': eu.id }, body: JSON.stringify({ conteudo })
      });
      assert.equal(r.status, 200);
    };
    await gravar('# Projeção real\n\nConteúdo confirmado na TV.');
    const caminho = eu.id + '/projecao.md';
    await est.page.waitForFunction((c) => !!BC.loja.arquivo(c), caminho);
    const janelaTv = est.app.waitForEvent('window');
    await est.app.evaluate(({ BrowserWindow }, url) => {
      const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { contextIsolation: true, backgroundThrottling: false } });
      w.loadURL(url);
    }, est.base + '/#tv');
    const tv = await janelaTv;
    await tv.waitForFunction((c) => window.BC && BC.real && BC.real.bemvindo && !!BC.loja.arquivo(c), caminho);
    assert.equal(await tv.evaluate((c) => BC.loja.arquivo(c)._carregado, caminho), false);
    await est.page.evaluate((c) => BC.loja.fazer('projetar', c), caminho);
    await tv.waitForFunction(() => document.querySelector('#proj-palco')?.textContent.includes('Conteúdo confirmado na TV.'));
    assert.equal(await tv.evaluate(() => document.querySelector('#tv-projecao').hidden), false);
    assert.equal(await tv.evaluate(() => BC.tv.medidas().chao.trabalhando), 0);
    assert.equal(await tv.evaluate(() => BC.tv.medidas().chao.estado), 'parado');
    await gravar('# Projeção atualizada\n\nMudança recebida em tempo real.');
    await tv.waitForFunction(() => document.querySelector('#proj-palco')?.textContent.includes('Mudança recebida em tempo real.'));
    await est.page.evaluate(() => BC.loja.fazer('encerrarProjecao'));
    await tv.waitForFunction(() => document.querySelector('#tv-projecao').hidden);
  } finally { await est.fechar(); }
});
