/* babel-coop · e2e da entrada fácil com DUAS Estações Electron de verdade (janelas escondidas)
   A primeira funda (Theus, gestão). A segunda abre sem equipe: a tela de boas-vindas acha "Equipe babel · Theus" no Wi-Fi,
   a pessoa escreve o nome e toca em "Pedir para entrar"; as duas telas mostram o mesmo código; a pessoa confirma "O código bateu";
   o Theus aceita pelo cartão do topo; a segunda recarrega sozinha já na equipe e aparece nos pares da gestão. Nada de token copiado.
   O cartão também é conferido no tema Vibe (Recusar legível) e fora da Estação (na TV e no cronômetro ele não aparece).
   Portas só deste arquivo: HTTP 5455 (Theus) e 5456 (nova), UDP 41955. Prints numa pasta temporária (ou BABEL_TESTE_EVIDENCIAS/entrada).
   Rodar: cd app && node --test testes/e2e/entrada.test.js
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { abrirEstacao, raizTemporaria } = require('./estacao');

const EVID = process.env.BABEL_TESTE_EVIDENCIAS ? path.join(process.env.BABEL_TESTE_EVIDENCIAS, 'entrada') : fs.mkdtempSync(path.join(os.tmpdir(), 'babel-e2e-entrada-prints-'));
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function ate(page, fn, arg, oque, ms = 15000) {
  try { return await page.waitForFunction(fn, arg, { timeout: ms, polling: 100 }); }
  catch (e) { throw new Error('tempo esgotado esperando ' + oque + ': ' + e.message.split('\n')[0]); }
}
/* a página recarrega sozinha no meio: tenta de novo até a condição valer */
async function ateMesmoRecarregando(page, fn, oque, ms = 20000) {
  const fim = Date.now() + ms;
  let ultimo = null;
  while (Date.now() < fim) {
    try { if (await page.evaluate(fn)) return; } catch (e) { ultimo = e.message.split('\n')[0]; }
    await esperar(150);
  }
  throw new Error('tempo esgotado esperando ' + oque + (ultimo ? ' (' + ultimo + ')' : ''));
}
function vigiarErros(page, quem, lista) {
  page.on('pageerror', (e) => lista.push(quem + ' pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') lista.push(quem + ' console: ' + m.text()); });
}

describe('entrada fácil · a pessoa nova pede pelo Wi-Fi e a gestão aceita pela tela', { timeout: 240000 }, () => {
  let T = null, N = null;
  const erros = [], medidas = {};

  before(async () => {
    fs.mkdirSync(EVID, { recursive: true });
    T = await abrirEstacao({ nome: 'entrada-theus', raiz: raizTemporaria('entrada-theus'), porta: 5455, descoberta: 41955 });
    vigiarErros(T.page, 'theus', erros);
    await T.page.waitForLoadState('domcontentloaded');
    await ate(T.page, () => !!document.getElementById('cbv-fundar'), null, 'a tela de boas-vindas do Theus');
    await T.page.evaluate(() => { document.querySelector('#coop-boasvindas details').open = true; });
    await T.page.fill('#cbv-nome', 'Theus');
    await Promise.all([T.page.waitForEvent('load', { timeout: 20000 }), T.page.click('#cbv-fundar')]);
    await ate(T.page, () => window.BC && BC.real && BC.real.bemvindo && BC.real.bemvindo.eu.pronto && BC.estacao && BC.estacao.ui, null, 'o Theus na equipe', 20000);
    N = await abrirEstacao({ nome: 'entrada-nova', raiz: raizTemporaria('entrada-nova'), porta: 5456, descoberta: 41955 });
    vigiarErros(N.page, 'nova', erros);
    await N.page.waitForLoadState('domcontentloaded');
  });

  after(async () => {
    try { fs.writeFileSync(path.join(EVID, 'resultado.json'), JSON.stringify({ erros, medidas }, null, 2)); } catch (e) { /* segue */ }
    if (T) await T.fechar().catch(() => {});
    if (N) await N.fechar().catch(() => {});
  });

  it('acha a equipe, pede, o mesmo código nas duas telas, a gestão aceita pelo cartão e a nova entra sozinha', async (t) => {
    const t0 = Date.now();
    await ate(N.page, () => !!document.getElementById('cbv-status'), null, 'a tela de boas-vindas da nova', 20000);
    medidas.status_inicial = await N.page.$eval('#cbv-status', (e) => e.textContent);
    await ate(N.page, () => [...document.querySelectorAll('.cbv-equipe')].some((e) => /Equipe babel · Theus/.test(e.textContent)), null, '"Equipe babel · Theus" na tela da nova', 8000);
    medidas.achou_ms = Date.now() - t0;
    assert.equal(await N.page.$eval('#cbv-status', (e) => e.textContent), 'Achei a sua equipe no Wi-Fi.');
    assert.equal(await N.page.isVisible('#cbv-token'), true, 'o token continua ali como plano B');
    await N.page.screenshot({ path: path.join(EVID, '1-nova-achou.png') });

    /* sem nome: pede o nome, não manda nada */
    await N.page.click('[data-entrar]');
    assert.equal(await N.page.$eval('#cbv-erro', (e) => e.textContent), 'Escreva seu nome.');
    await N.page.fill('#cbv-seu-nome', 'Rita');
    await N.page.click('[data-entrar]');
    await ate(N.page, () => { const c = document.getElementById('cbv-codigo'); return c && /^\d{4}$/.test(c.textContent); }, null, 'o código na tela da nova');
    const codigoNova = await N.page.$eval('#cbv-codigo', (e) => e.textContent);
    assert.match(await N.page.$eval('#cbv-pedido', (e) => e.textContent), /Pedido enviado para Theus/);
    assert.equal(await N.page.isVisible('[data-confirmar="sim"]'), true, 'a nova pede para conferir o código');
    await N.page.screenshot({ path: path.join(EVID, '2-nova-codigo.png') });
    /* a pessoa confere com a tela do Theus e confirma */
    await N.page.click('[data-confirmar="sim"]');
    await ate(N.page, () => /Código conferido/.test((document.getElementById('cbv-espera') || {}).textContent || ''), null, 'a nova registrar o código conferido');

    /* a gestão: cartão persistente no topo com nome, código, Aceitar e Recusar; a lateral da Equipe mostra o mesmo pedido */
    await ate(T.page, () => !!document.querySelector('#coop-entrada .cen-cartao'), null, 'o cartão do pedido no topo da Estação do Theus');
    const cartao = await T.page.$eval('#coop-entrada .cen-cartao', (c) => ({ texto: c.textContent, codigo: c.querySelector('.cen-codigo').textContent, botoes: [...c.querySelectorAll('button')].map((b) => b.textContent), topo: Math.round(c.getBoundingClientRect().top), porCima: (() => { const b = c.getBoundingClientRect(); const e = document.elementFromPoint(b.left + 20, b.top + b.height / 2); return !!(e && e.closest('#coop-entrada')); })(), fundo: getComputedStyle(c).backgroundColor, opacidade: getComputedStyle(c).opacity }));
    t.diagnostic('cartão na gestão: ' + JSON.stringify(cartao) + ' · código na nova: ' + codigoNova);
    assert.match(cartao.texto, /Rita quer entrar na equipe/);
    assert.equal(cartao.codigo, codigoNova, 'o mesmo código nas duas telas');
    assert.deepEqual(cartao.botoes, ['Aceitar', 'Recusar']);
    assert.ok(cartao.topo < 90, 'o cartão fica no topo');
    assert.ok(cartao.porCima, 'nada da Estação cobre o cartão');
    await T.page.evaluate(() => BC.estacao.abrir('equipe'));
    await ate(T.page, () => !!document.querySelector('[data-acao="eq-entrada-aceitar"]'), null, 'o pedido na lateral da Equipe');
    assert.match(await T.page.$eval('[data-acao="eq-entrada-aceitar"]', (b) => b.closest('.convite-cartao').textContent), new RegExp('Código ' + codigoNova));
    await esperar(400); /* a chegada do cartão (0,32 s) termina antes do print */
    await T.page.screenshot({ path: path.join(EVID, '3-theus-pedido.png') });

    /* tema Vibe (claro): o cartão continua escuro e o Recusar legível (contraste do texto sobre o fundo do cartão) */
    const vibe = await T.page.evaluate(() => {
      const h = document.documentElement, antes = h.getAttribute('data-tema-estacao');
      h.setAttribute('data-tema-estacao', 'claro');
      const rgb = (c) => (c.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      const lum = (c) => { const v = rgb(c).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
      const contraste = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
      const cartao = document.querySelector('#coop-entrada .cen-cartao'), fundo = getComputedStyle(cartao).backgroundColor;
      const r = [...cartao.querySelectorAll('button')].map((b) => { const s = getComputedStyle(b); const bg = s.backgroundColor === 'rgba(0, 0, 0, 0)' ? fundo : s.backgroundColor; return { rotulo: b.textContent, contraste: Math.round(contraste(s.color, bg) * 10) / 10 }; });
      if (antes == null) h.removeAttribute('data-tema-estacao'); else h.setAttribute('data-tema-estacao', antes);
      return r;
    });
    medidas.vibe_contraste = vibe;
    vibe.forEach((b) => assert.ok(b.contraste >= 4.5, 'no Vibe, "' + b.rotulo + '" com contraste ' + b.contraste + ':1'));
    /* fora da Estação (TV, cronômetro): o cartão não aparece */
    const foraDaEstacao = await T.page.evaluate(() => {
      const h = document.documentElement, antes = h.getAttribute('data-vista');
      h.setAttribute('data-vista', 'tv');
      const naTv = getComputedStyle(document.getElementById('coop-entrada')).display;
      h.setAttribute('data-vista', antes || 'estacao');
      return { naTv: naTv, deVolta: getComputedStyle(document.getElementById('coop-entrada')).display };
    });
    medidas.fora_da_estacao = foraDaEstacao;
    assert.equal(foraDaEstacao.naTv, 'none', 'na vista TV o cartão some');
    assert.notEqual(foraDaEstacao.deVolta, 'none', 'de volta à Estação, o cartão volta');

    /* Aceitar pelo cartão do topo */
    const tAceite = Date.now();
    await T.page.click('#coop-entrada [data-entrada="aceitar"]');
    await ate(T.page, () => !document.querySelector('#coop-entrada'), null, 'o cartão sumir depois de aceitar');

    /* a nova recarrega sozinha já na equipe */
    await ateMesmoRecarregando(N.page, () => !!(window.BC && BC.real && BC.real.bemvindo && BC.real.bemvindo.eu && BC.real.bemvindo.eu.pronto && BC.real.bemvindo.eu.id === 'rita' && !document.getElementById('coop-boasvindas')), 'a nova dentro da equipe como Rita');
    medidas.aceite_ate_dentro_ms = Date.now() - tAceite;
    const euNova = await N.api('/api/eu');
    assert.deepEqual([euNova.id, euNova.nome, euNova.papel, euNova.equipe], ['rita', 'Rita', 'membro', 'babel']);

    /* a gestão vê a Rita ligada nos pares e na equipe (como com o token) */
    await ate(T.page, () => BC.real.pares().some((p) => p.id === 'rita' && p.ligado) && BC.loja.pessoa('rita') && BC.loja.pessoa('rita').status === 'online', null, 'o Theus ver a Rita ligada', 30000);
    await ate(N.page, () => BC.real.pares().some((p) => p.id === 'theus' && p.ligado), null, 'a Rita ver o Theus ligado', 30000);
    medidas.total_ms = Date.now() - t0;
    await T.page.screenshot({ path: path.join(EVID, '4-theus-rita-na-equipe.png') });
    await N.page.screenshot({ path: path.join(EVID, '5-rita-dentro.png') });
    t.diagnostic('medidas: ' + JSON.stringify(medidas) + ' · prints em ' + EVID);
    assert.deepEqual(erros, [], 'erros nas páginas: ' + erros.join(' | '));
  });
});
