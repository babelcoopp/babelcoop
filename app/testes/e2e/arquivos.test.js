/* babel-coop · e2e de apagar e editar arquivo pela tela (explorador real + barra da aba)
   Uma Estação de verdade (Electron escondido, raiz temporária nova), fundada pela tela de boas-vindas:
   1. arquivo criado pela API aparece na árvore; ✎ e 🗑 na linha (com o mouse em cima); o gerado do acervo não tem 🗑
   2. apagar pela linha: confirmação inline → a linha SAI com movimento (animação arq-sai, fica à vista até o fim) e só depois o arquivo
      sai do disco para <raiz>/.coop/lixeira/theus (fora da pasta compartilhada) → "Desfazer" → volta igual, com o brilho arq-volta;
      nenhuma animação fica rodando depois
   3. Editar num .md: abre o texto editável → muda → Salvar → o GET /api/arquivo devolve o texto novo (versão anterior guardada)
   3b. editando com texto não salvo: 🗑 na árvore e Delete não perguntam nem apagam (avisam); a barra da aba esconde o Apagar
   4. a aba aberta tem "Editar" e "Apagar" na barra; apagar por ali (confirmação inline) fecha a aba sem nunca mostrar
      "Este arquivo não existe mais."; teclado: Delete pede, Esc cancela
   Prints: BABEL_TESTE_EVIDENCIAS (ou uma pasta temporária, dita no fim). Nada de alert/confirm: tudo inline.
   Rodar: cd app && node --test testes/e2e/arquivos.test.js   ·   Portas: HTTP 5433, UDP 41933. */
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { abrirEstacao, raizTemporaria } = require('./estacao');

const EVID = process.env.BABEL_TESTE_EVIDENCIAS || path.join(os.tmpdir(), 'babel-e2e-arquivos-evidencias');
const PORTA = 5433;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function ate(page, fn, arg, oque, ms = 15000) {
  try { return await page.waitForFunction(fn, arg, { timeout: ms, polling: 100 }); }
  catch (e) { throw new Error('tempo esgotado esperando ' + oque + ': ' + e.message.split('\n')[0]); }
}
async function ateNo(fn, oque, ms = 10000) {
  const fim = Date.now() + ms;
  for (;;) { const v = await fn(); if (v) return v; if (Date.now() > fim) throw new Error('tempo esgotado esperando ' + oque); await esperar(100); }
}
async function print(page, nome) { await page.screenshot({ path: path.join(EVID, nome), timeout: 15000 }); return nome; }
const linha = (id) => '.arv-arq[data-id="' + id + '"]';
/* sonda na página: marca quando a linha começa a sair (classe + animação) e quando some do DOM; setInterval, não rAF (janela escondida) */
function sondaSaida(s) {
  const w = window.__saida = { inicio: 0, fim: 0, animacoes: '', opacidadeMeio: null };
  const iv = setInterval(() => {
    const el = document.querySelector(s), t = performance.now();
    if (el && el.classList.contains('arq-saindo') && !w.inicio) { w.inicio = t; w.animacoes = (el.getAnimations ? el.getAnimations() : []).map((a) => a.animationName).join(','); }
    if (el && w.inicio && w.opacidadeMeio == null && t - w.inicio >= 90) w.opacidadeMeio = +getComputedStyle(el).opacity;
    if (!el && w.inicio && !w.fim) { w.fim = t; clearInterval(iv); }
  }, 5);
  setTimeout(() => clearInterval(iv), 10000);
}
const lixeira = (raiz) => path.join(raiz, '.coop', 'lixeira', 'theus');
async function lerApi(rel) {
  const r = await fetch('http://localhost:' + PORTA + '/api/arquivo?caminho=' + encodeURIComponent(rel), { cache: 'no-store' });
  return r.ok ? r.json() : null;
}
async function gravarApi(rel, conteudo) {
  const r = await fetch('http://localhost:' + PORTA + '/api/arquivo?caminho=' + encodeURIComponent(rel), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conteudo }) });
  assert.equal(r.status, 200, 'PUT ' + rel);
}

describe('arquivos · apagar e editar pela tela', { timeout: 300000 }, () => {
  let T = null, raiz = null;
  const erros = [], medidas = {};
  const pasta = () => path.join(raiz, 'theus');

  before(async () => {
    fs.mkdirSync(EVID, { recursive: true });
    raiz = raizTemporaria('arquivos');
    T = await abrirEstacao({ nome: 'arquivos', raiz, porta: PORTA, descoberta: 41933 });
    T.page.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
    T.page.on('console', (m) => { if (m.type() === 'error' && !/favicon|ERR_|502|Failed to load resource/.test(m.text())) erros.push('console: ' + m.text()); });
    T.page.on('dialog', (d) => { erros.push('janela do navegador: ' + d.type() + ' ' + d.message()); d.dismiss().catch(() => {}); });
    await T.page.waitForLoadState('domcontentloaded');
    await ate(T.page, () => !!document.getElementById('cbv-fundar'), null, 'a tela de boas-vindas');
    await T.page.evaluate(() => { document.querySelector('#coop-boasvindas details').open = true; });
    await T.page.fill('#cbv-nome', 'Theus');
    await Promise.all([T.page.waitForEvent('load', { timeout: 20000 }), T.page.click('#cbv-fundar')]);
    await T.page.waitForLoadState('domcontentloaded');
    await ate(T.page, () => window.BC && BC.real && BC.real.bemvindo && BC.real.bemvindo.eu && BC.real.bemvindo.eu.pronto && BC.estacao && BC.estacao.ui && BC.loja.estado && BC.arquivosReal, null, 'a Estação pronta', 25000);
    await T.page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.ui.abertas.theus = true; BC.estacao.abrir('explorador'); });
  });

  after(async () => {
    try { fs.writeFileSync(path.join(EVID, 'resultado.json'), JSON.stringify({ quando: new Date().toISOString(), erros, medidas }, null, 2)); } catch (e) { /* segue */ }
    if (T) await T.fechar().catch(() => {});
    try { if (raiz) fs.rmSync(raiz, { recursive: true, force: true }); } catch (e) { /* segue */ }
    console.log('# prints e medidas: ' + EVID);
  });

  it('1 · arquivo da API aparece na árvore com ✎ e 🗑; o gerado do acervo não tem 🗑', async () => {
    const { page } = T;
    await gravarApi('apagar-teste.md', '# vai e volta\n\nconteúdo original\n');
    fs.writeFileSync(path.join(pasta(), 'ACERVO.md'), '# gerado pelo acervo\n');
    await ate(page, (s) => !!document.querySelector(s[0]) && !!document.querySelector(s[1]), [linha('theus/apagar-teste.md'), linha('theus/ACERVO.md')], 'os dois arquivos na árvore');
    await page.hover(linha('theus/apagar-teste.md'));
    const b = page.locator(linha('theus/apagar-teste.md') + ' [data-acao="arq-apagar"]');
    await b.waitFor({ state: 'visible', timeout: 5000 });
    assert.ok(await page.locator(linha('theus/apagar-teste.md') + ' [data-acao="arq-editar"]').isVisible(), '✎ visível com o mouse em cima');
    assert.equal(await b.getAttribute('aria-label'), 'Apagar apagar-teste.md');
    assert.equal(await page.locator(linha('theus/ACERVO.md') + ' [data-acao="arq-apagar"]').count(), 0, 'ACERVO.md é gerado: sem 🗑');
    medidas.print_acoes = await print(page, 'arquivos-1-acoes-na-linha.png');
  });

  it('2 · apagar pela linha: confirmação inline → some da árvore e do disco → Desfazer → volta', async () => {
    const { page } = T;
    const id = 'theus/apagar-teste.md', noDisco = path.join(pasta(), 'apagar-teste.md');
    const antes = fs.readFileSync(noDisco, 'utf8');
    await page.hover(linha(id));
    await page.click(linha(id) + ' [data-acao="arq-apagar"]');
    const conf = page.locator('.arv-confirma');
    await conf.waitFor({ state: 'visible', timeout: 5000 });
    assert.match(await conf.textContent(), /Apagar apagar-teste\.md\?\s*Apagar\s*·\s*Cancelar/);
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.id), 'arq-conf-nao', 'o foco vai para o Cancelar');
    assert.ok(fs.existsSync(noDisco), 'só pedir não apaga');
    medidas.print_confirma = await print(page, 'arquivos-2-confirmacao-inline.png');
    await page.evaluate(sondaSaida, linha(id));
    const t0 = Date.now();
    await page.click('#arq-conf-sim');
    await ate(page, (s) => !document.querySelector(s) && !BC.loja.arquivo('theus/apagar-teste.md'), linha(id), 'a linha sumir da árvore');
    medidas.apagar_ate_sumir_ms = Date.now() - t0;
    const saida = await page.evaluate(() => window.__saida);
    medidas.saida = saida;
    assert.ok(saida.inicio > 0, 'a linha não ganhou a classe de saída');
    assert.match(saida.animacoes, /arq-sai/, 'sem animação de saída na linha');
    assert.ok(saida.fim - saida.inicio >= 220, 'a linha sumiu antes da animação acabar: ' + Math.round(saida.fim - saida.inicio) + ' ms');
    await ateNo(() => !fs.existsSync(noDisco), 'o arquivo sair do disco');
    assert.ok(!fs.existsSync(path.join(pasta(), '.lixeira')), 'nada de lixeira dentro da pasta compartilhada');
    const lixo = fs.readdirSync(lixeira(raiz)).filter((n) => /^\d{13}__apagar-teste\.md$/.test(n));
    assert.equal(lixo.length, 1, 'na lixeira: ' + fs.readdirSync(lixeira(raiz)).join(', '));
    assert.equal(fs.readFileSync(path.join(lixeira(raiz), lixo[0]), 'utf8'), antes);
    assert.ok(!(await fetch('http://localhost:' + PORTA + '/api/arquivos').then((r) => r.json())).some((f) => /lixeira/.test(f.caminho)), 'a lixeira apareceu na lista');
    const btn = page.locator('#arq-desfazer-botao');
    await btn.waitFor({ state: 'visible', timeout: 5000 });
    assert.match(await page.locator('#arq-desfazer').textContent(), /"apagar-teste\.md" foi para a lixeira \(fora da pasta compartilhada\)/);
    /* nenhuma lista velha do servidor traz de volta sozinha */
    await esperar(1200);
    assert.equal(await page.locator(linha(id)).count(), 0, 'voltou sem Desfazer');
    medidas.print_desfazer = await print(page, 'arquivos-2-aviso-desfazer.png');
    await page.evaluate((s) => {
      const w = window.__volta = { brilhou: false };
      const iv = setInterval(() => { const el = document.querySelector(s); if (el && el.classList.contains('arq-voltou') && (el.getAnimations ? el.getAnimations() : []).some((a) => a.animationName === 'arq-volta')) { w.brilhou = true; clearInterval(iv); } }, 5);
      setTimeout(() => clearInterval(iv), 5000);
    }, linha(id));
    await btn.click();
    await ate(page, (s) => !!document.querySelector(s), linha(id), 'a linha voltar pela Desfazer');
    await ate(page, () => window.__volta.brilhou, null, 'o brilho da volta (arq-volta)', 3000);
    medidas.print_voltando = await print(page, 'arquivos-2-voltando-com-brilho.png');
    await ateNo(() => fs.existsSync(noDisco), 'o arquivo voltar ao disco');
    assert.equal(fs.readFileSync(noDisco, 'utf8'), antes);
    await ate(page, () => !document.getElementById('arq-desfazer'), null, 'o aviso de Desfazer fechar');
    assert.equal(fs.readdirSync(lixeira(raiz)).filter((n) => n !== 'itens.json').length, 0, 'a lixeira esvaziou');
    /* efeito com começo e fim: passado o brilho, nenhuma animação arq-* segue rodando */
    await esperar(1000);
    const vivas = await page.evaluate(() => document.getAnimations().filter((a) => /^arq-/.test(a.animationName || '') && a.playState === 'running').map((a) => a.animationName));
    medidas.animacoes_vivas_depois = vivas;
    assert.deepEqual(vivas, [], 'animação que não acaba: ' + vivas.join(', '));
    medidas.print_voltou = await print(page, 'arquivos-2-voltou.png');
  });

  it('3 · Editar num .md abre o texto editável; mudar e salvar grava no disco (GET devolve o novo)', async () => {
    const { page } = T;
    const id = 'theus/editar-teste.md';
    await gravarApi('editar-teste.md', '# antes\n');
    await ate(page, (s) => !!document.querySelector(s), linha(id), 'editar-teste.md na árvore');
    await page.hover(linha(id));
    await page.click(linha(id) + ' [data-acao="arq-editar"]');
    const campo = page.locator('textarea[id="ed-texto-' + id + '"]');
    await campo.waitFor({ state: 'visible', timeout: 8000 });
    await ate(page, (i) => { const c = document.getElementById('ed-texto-' + i); return c && c.value === '# antes\n'; }, id, 'o texto do disco no campo editável');
    assert.equal(await page.evaluate((i) => document.activeElement && document.activeElement.id === 'ed-texto-' + i, id), true, 'o foco vai para o texto');
    const novo = '# depois\n\nEditado pelo botão Editar em ' + new Date().toISOString() + '\n';
    await campo.fill(novo);
    medidas.print_editando = await print(page, 'arquivos-3-editando.png');
    await page.click('[data-acao="ed-salvar"]');
    const lido = await ateNo(async () => { const j = await lerApi('editar-teste.md'); return j && j.conteudo === novo ? j : null; }, 'o GET devolver o texto novo');
    assert.equal(lido.conteudo, novo);
    const versoes = path.join(raiz, '.coop', 'versoes', 'theus');
    assert.ok(fs.readdirSync(versoes).some((n) => n.startsWith('editar-teste.md.')), 'a versão anterior ficou guardada');
    await ate(page, (i) => !document.getElementById('ed-texto-' + i) && /depois/.test(document.getElementById('e-conteudo').textContent), id, 'a aba voltar para leitura com o texto novo');
  });

  it('3b · com texto não salvo, 🗑 e Delete na árvore não apagam: avisam; a barra esconde o Apagar', async () => {
    const { page } = T;
    const id = 'theus/editar-teste.md', noDisco = path.join(pasta(), 'editar-teste.md');
    const salvo = fs.readFileSync(noDisco, 'utf8');
    await page.hover(linha(id));
    await page.click(linha(id) + ' [data-acao="arq-editar"]');
    const campo = page.locator('textarea[id="ed-texto-' + id + '"]');
    await campo.waitFor({ state: 'visible', timeout: 8000 });
    const digitado = salvo + '\nparágrafo digitado e ainda não salvo\n';
    await campo.fill(digitado);
    assert.equal(await page.locator('.ed-barra .arq-barra-apagar').count(), 0, 'editando, a barra não oferece Apagar');
    await page.hover(linha(id));
    await page.click(linha(id) + ' [data-acao="arq-apagar"]');
    await ate(page, () => /mudança que ainda não foi salva/.test((document.getElementById('e-toast') || {}).textContent || ''), null, 'o aviso de mudança não salva');
    await esperar(400);
    assert.equal(await page.locator('.arv-confirma').count(), 0, 'não pergunta: avisa');
    await page.focus(linha(id));
    await page.keyboard.press('Delete');
    await esperar(400);
    assert.equal(await page.locator('.arv-confirma').count(), 0, 'Delete também não pergunta');
    assert.ok(fs.existsSync(noDisco), 'o arquivo continua no disco');
    assert.equal(await page.evaluate((i) => (document.getElementById('ed-texto-' + i) || {}).value, id), digitado, 'o texto digitado continua no campo');
    assert.equal(await page.evaluate((i) => BC.estacao.ui.abas.some((t) => t.ref === i && t.modo === 'editar'), id), true, 'a aba continua aberta editando');
    medidas.print_pendente = await print(page, 'arquivos-3b-mudanca-nao-salva.png');
    /* cancelar a edição: volta a poder apagar */
    await page.click('.ed-barra [data-acao="ed-modo"][data-modo="ver"]');
    await ate(page, (i) => !document.getElementById('ed-texto-' + i), id, 'a aba sair do modo editar');
    assert.equal(fs.readFileSync(noDisco, 'utf8'), salvo, 'cancelar não gravou nada');
  });

  it('4 · a aba aberta tem Editar e Apagar na barra; apagar por ali fecha a aba; Delete e Esc pelo teclado', async () => {
    const { page } = T;
    const id = 'theus/editar-teste.md';
    await page.click(linha(id));
    await ate(page, () => !!document.querySelector('.ed-barra .arq-barra-apagar'), null, 'o Apagar na barra da aba');
    assert.equal(await page.locator('.ed-barra [data-acao="ed-modo"][data-modo="editar"]').count(), 1, 'Editar na barra');
    /* teclado na árvore: Delete pede a confirmação (foco no Cancelar), Esc cancela e devolve o foco à linha */
    await page.focus(linha(id));
    await page.keyboard.press('Delete');
    await page.locator('.arv-confirma').waitFor({ state: 'visible', timeout: 5000 });
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.id), 'arq-conf-nao');
    await page.keyboard.press('Escape');
    await ate(page, () => !document.querySelector('.arv-confirma'), null, 'a confirmação fechar com Esc');
    assert.equal(await page.evaluate((s) => document.activeElement === document.querySelector(s), linha(id)), true, 'o foco volta para a linha');
    /* pela barra da aba */
    await page.click('.ed-barra .arq-barra-apagar');
    const conf = page.locator('.ed-barra .arq-barra-confirma');
    await conf.waitFor({ state: 'visible', timeout: 5000 });
    assert.match(await conf.textContent(), /Apagar editar-teste\.md\?/);
    medidas.print_barra = await print(page, 'arquivos-4-confirmacao-na-barra.png');
    /* o meio nunca mostra "Este arquivo não existe mais." no caminho: a aba sai com movimento e fecha antes do pedido */
    await page.evaluate(() => {
      const w = window.__aba = { naoExiste: false, corpoSaiu: false };
      const c = document.getElementById('e-conteudo');
      const olhar = () => { if (/Este arquivo não existe mais/.test(c.textContent)) w.naoExiste = true; if (c.querySelector('.arq-saindo-corpo')) w.corpoSaiu = true; };
      const mo = new MutationObserver(olhar); mo.observe(c, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class'] });
      setTimeout(() => mo.disconnect(), 6000);
    });
    await page.click('#arq-conf-sim-aba');
    await ate(page, (i) => !BC.estacao.ui.abas.some((t) => t.ref === i) && !BC.loja.arquivo(i), id, 'a aba do arquivo apagado fechar');
    await ateNo(() => !fs.existsSync(path.join(pasta(), 'editar-teste.md')), 'o arquivo sair do disco');
    assert.equal(await page.locator('.e-aba[data-id="arq:' + id + '"]').count(), 0);
    const aba = await page.evaluate(() => window.__aba);
    medidas.aba = aba;
    assert.equal(aba.naoExiste, false, 'o meio mostrou "Este arquivo não existe mais."');
    assert.equal(aba.corpoSaiu, true, 'o corpo da aba não teve movimento de saída');
    medidas.print_aba_fechou = await print(page, 'arquivos-4-aba-fechou.png');
    assert.deepEqual(erros, [], 'erros na página: ' + erros.join(' | '));
  });
});
