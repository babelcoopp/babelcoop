/* babel-coop · e2e da parede ao vivo com DUAS Estações Electron de verdade (janelas escondidas)
   Aceites: A5 (parede com o terminal da Rita, agente e foto, saída ao vivo, clique amplia) · A7 (Theus entra direto e digita
   na sessão da Rita) · A9 (selo "Theus está no seu terminal" na Rita; Encerrar → tecla seguinte recusada pelo servidor dela)
   · A8 (Rita, membro fora do projeto, pede; o Theus aceita com um clique; as teclas dela passam) · A10/A16 (Rita pausa: o
   cartão esfria na parede do Theus e nada do que sai durante a pausa chega, nem depois).
   Portas só deste arquivo: HTTP 4960 (Theus) e 4961 (Rita), UDP 41460. zsh sem configuração pessoal (ZDOTDIR temporário).
   Prints em .deus/terminal-ao-vivo/evidencias/parede/. Rodar: cd app && node --test testes/e2e/parede.test.js
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { abrirEstacao, raizTemporaria } = require('./estacao');

const EVID = process.env.BABEL_TESTE_EVIDENCIAS ? path.join(process.env.BABEL_TESTE_EVIDENCIAS, 'parede') : path.join(__dirname, '..', '..', '..', '.deus', 'terminal-ao-vivo', 'evidencias', 'parede');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/* zsh dos testes: sem .zshrc da pessoa e sem histórico no $HOME dela */
function ambienteZsh(raiz) {
  const z = path.join(raiz, '.zdot');
  fs.mkdirSync(z, { recursive: true });
  fs.writeFileSync(path.join(z, '.zshrc'), '# zsh dos testes da parede: sem configuração pessoal\n');
  return { ZDOTDIR: z, SHELL: '/bin/zsh' };
}

async function print(page, nome) {
  const arq = path.join(EVID, nome);
  await page.screenshot({ path: arq, timeout: 15000 });
  return arq;
}

/* espera uma condição dentro da página; no tempo esgotado diz o que esperava */
async function ate(page, fn, arg, oque, ms = 15000) {
  try { return await page.waitForFunction(fn, arg, { timeout: ms, polling: 100 }); }
  catch (e) { throw new Error('tempo esgotado esperando ' + oque + ': ' + e.message.split('\n')[0]); }
}

/* a parede só assina o que está na tela: rola até o cartão, como a pessoa faria */
async function verCartao(page, k) {
  await ate(page, (kk) => !!document.querySelector('[data-k="' + kk + '"]'), k, 'o cartão ' + k);
  await page.$eval('[data-k="' + k + '"]', (c) => c.scrollIntoView({ block: 'center' }));
  await ate(page, (kk) => { const s = BC.parede.sessao(kk); return s && s.assistindo && s.temTerm; }, k, 'o cartão ' + k + ' assistindo');
}

function vigiarErros(page, quem, lista) {
  page.on('pageerror', (e) => lista.push(quem + ' pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') lista.push(quem + ' console: ' + m.text()); });
}

async function prontaNaEquipe(page) {
  await page.waitForLoadState('domcontentloaded');
  await ate(page, () => window.BC && BC.real && BC.real.bemvindo && BC.real.bemvindo.eu && BC.real.bemvindo.eu.pronto && BC.parede && BC.estacao && BC.estacao.ui, null, 'a Estação pronta na equipe', 20000);
}

describe('parede ao vivo · duas Estações (Theus e Rita)', { timeout: 300000 }, () => {
  let T = null, R = null;
  const erros = [];
  const medidas = {};

  before(async () => {
    fs.mkdirSync(EVID, { recursive: true });
    const raizT = raizTemporaria('parede-theus'), raizR = raizTemporaria('parede-rita');
    T = await abrirEstacao({ nome: 'theus', raiz: raizT, porta: 4960, descoberta: 41460, env: ambienteZsh(raizT) });
    vigiarErros(T.page, 'theus', erros);
    await T.page.waitForLoadState('domcontentloaded');
    /* o Theus funda a equipe (gestão) pelo navegador local, como o botão "Fundar a equipe" faz */
    const f = await T.page.evaluate(() => fetch('/api/fundar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: 'Theus' }) }).then((r) => r.json()));
    assert.equal(f.papel, 'gestao', JSON.stringify(f));
    await T.page.reload();
    await prontaNaEquipe(T.page);
    /* o token da Rita sai do navegador local do Theus (/api/convite só aceita a própria Estação) */
    const conv = await T.page.evaluate(() => fetch('/api/convite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: 'Rita', papel: 'membro' }) }).then((r) => r.json()));
    assert.match(String(conv.token), /^babel-/, JSON.stringify(conv).slice(0, 200));

    R = await abrirEstacao({ nome: 'rita', raiz: raizR, porta: 4961, descoberta: 41460, env: ambienteZsh(raizR) });
    vigiarErros(R.page, 'rita', erros);
    await R.page.waitForLoadState('domcontentloaded');
    const t = await R.page.evaluate((token) => fetch('/api/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }).then((r) => r.json()), conv.token);
    assert.equal(t.id, 'rita', JSON.stringify(t));
    await R.page.reload();
    await prontaNaEquipe(R.page);
    await ate(T.page, () => BC.real.pares().some((p) => p.id === 'rita' && p.ligado), null, 'o Theus ver a Rita na rede', 30000);
    await ate(R.page, () => BC.real.pares().some((p) => p.id === 'theus' && p.ligado), null, 'a Rita ver o Theus na rede', 30000);
    /* espião de recusas nas duas telas (term-recusado vem do servidor do dono) */
    for (const p of [T.page, R.page]) await p.evaluate(() => {
      window.__recusas = []; window.__teclas = [];
      BC.real.ouvir((m) => { if (m.tipo === 'term-recusado') window.__recusas.push(m); });
      const orig = BC.real.enviar; BC.real.enviar = function (m) { if (m && m.tipo === 'term-entrada' && m.dono) window.__teclas.push(m); return orig.apply(this, arguments); };
    });
    /* a Rita abre a sessão "Nina" (é o que o painel da direita faz: term-abrir no servidor dela) e as duas telas vão para Terminais */
    await R.page.evaluate(() => BC.real.enviar({ tipo: 'term-abrir', id: 'nina', nome: 'Nina', cols: 90, rows: 24 }));
    await T.page.evaluate(() => BC.estacao.abrir('terminais'));
    await R.page.evaluate(() => BC.estacao.abrir('terminais'));
  });

  after(async () => {
    const r = { erros, medidas };
    try { fs.writeFileSync(path.join(EVID, 'resultado.json'), JSON.stringify(r, null, 2)); } catch (e) { /* segue */ }
    if (T) await T.fechar().catch(() => {});
    if (R) await R.fechar().catch(() => {});
  });

  it('A5 · a parede do Theus mostra o terminal da Rita com agente e foto, a saída ao vivo, e um clique amplia', async (t) => {
    const { page } = T;
    await verCartao(page, 'rita/nina');
    const t0 = Date.now();
    await R.page.evaluate(() => BC.real.enviar({ tipo: 'term-entrada', id: 'nina', dados: 'echo parede-viva-$((40+2))\r' }));
    await ate(page, () => BC.parede.texto('rita/nina').includes('parede-viva-42'), null, 'a saída da Rita no cartão do Theus');
    medidas.a5_saida_ms = Date.now() - t0;
    const cartao = await page.$eval('[data-k="rita/nina"]', (c) => ({
      avatar: c.querySelector('.pr-av .avatar') && c.querySelector('.pr-av .avatar').textContent.trim(),
      titulo: c.querySelector('.pr-av .avatar') && c.querySelector('.pr-av .avatar').getAttribute('title'),
      agente: c.querySelector('.pr-ag-nome').textContent, pessoa: c.querySelector('.pr-ag-pessoa').textContent,
      selo: c.querySelector('.pr-selo').textContent.trim(), vivo: c.dataset.vivo,
      mini: !!c.querySelector('.pr-mini .bc-presenca--mini'),
      vidro: getComputedStyle(c).backdropFilter || getComputedStyle(c).webkitBackdropFilter
    }));
    t.diagnostic('cartão: ' + JSON.stringify(cartao) + ' · saída em ' + medidas.a5_saida_ms + ' ms');
    assert.equal(cartao.avatar, 'RI'); assert.equal(cartao.titulo, 'Rita');
    assert.equal(cartao.agente, 'Nina'); assert.match(cartao.pessoa, /Rita/);
    assert.equal(cartao.selo, 'ao vivo'); assert.equal(cartao.vivo, 'sim'); assert.ok(cartao.mini, 'mini presença no cartão');
    assert.match(String(cartao.vidro), /blur/, 'HUD de vidro no cartão ao vivo');
    /* o mapa da sala tem a Rita e o Theus */
    const nos = await page.evaluate(() => Array.from(document.querySelectorAll('.pr-constelacao .bc-c-no text')).map((x) => x.textContent));
    assert.ok(nos.some((n) => /^Rita · /.test(n)), 'nó da Rita no mapa: ' + nos.join(' | '));
    t.diagnostic('mapa da sala: ' + nos.join(' | '));
    await page.waitForTimeout(400);
    await print(page, 'a5-parede-theus.png');
    /* o xterm do cartão sobrevive ao render da Estação (ela refaz o innerHTML do meio): a raiz é recolocada, nada é recriado */
    const sobrevive = await page.evaluate(async () => {
      const antes = document.querySelector('[data-k="rita/nina"] .xterm');
      BC.estacao.render(); BC.estacao.render();
      await new Promise((r) => setTimeout(r, 50));
      return { mesmo: antes === document.querySelector('[data-k="rita/nina"] .xterm'), conectado: document.contains(antes), texto: BC.parede.texto('rita/nina').includes('parede-viva-42'), assistindo: BC.parede.sessao('rita/nina').assistindo };
    });
    assert.deepEqual(sobrevive, { mesmo: true, conectado: true, texto: true, assistindo: true });
    /* um clique amplia */
    await page.click('[data-k="rita/nina"] .pr-tela');
    await ate(page, () => BC.parede.ampliado() === 'rita/nina' && !document.querySelector('.pr-amp').hidden && document.querySelector('.pr-amp-escala .xterm'), null, 'o ampliado da Nina');
    const amp = await page.evaluate(() => ({ titulo: document.querySelector('.pr-amp-titulo h1').textContent, botao: (document.querySelector('.pr-amp-acoes [data-acao="term-entrar"]') || {}).textContent }));
    assert.equal(amp.titulo, 'Rita · Nina');
    assert.equal(amp.botao, 'Entrar', 'Theus é gestão: entra direto');
    await page.waitForTimeout(300);
    await print(page, 'a5-ampliado-theus.png');
  });

  it('A7 · o Theus (gestão) entra direto e o comando dele roda no terminal da Rita', async (t) => {
    const { page } = T;
    await page.click('.pr-amp-acoes [data-acao="term-entrar"]');
    await ate(page, () => BC.parede.controles().some((c) => c.quem === 'theus' && c.dono === 'rita' && c.estado === 'ativo'), null, 'controle ativo do Theus na Rita');
    await ate(page, () => /você está no terminal de Rita/.test(document.querySelector('.pr-amp-faixa').textContent) && !document.querySelector('.pr-amp-faixa').hidden, null, 'a faixa "você está no terminal de Rita"');
    await verCartao(R.page, 'rita/nina'); /* o xterm da própria Rita, na parede dela */
    await page.click('.pr-amp-tela');
    const t0 = Date.now();
    await page.keyboard.type('echo "theus-aqui $BABEL_EU"');
    await page.keyboard.press('Enter');
    /* lido no xterm da própria Rita (o cartão da sessão dela na tela dela) */
    try { await ate(R.page, () => BC.parede.texto('rita/nina').split('\n').some((l) => l.trim() === 'theus-aqui rita'), null, '"theus-aqui rita" no xterm da Rita'); }
    catch (e) { t.diagnostic('DEPURAR ' + JSON.stringify(await page.evaluate(() => ({ teclas: window.__teclas.slice(-40), recusas: window.__recusas, amp: BC.parede.ampliado(), ativo: document.activeElement && document.activeElement.className, pode: BC.parede.podeDigitar('rita/nina'), ctl: BC.parede.controles(), aviso: document.querySelector('.pr-amp-aviso').textContent }))) + ' RITA ' + JSON.stringify(await R.page.evaluate(() => BC.parede.texto('rita/nina').slice(-300)))); throw e; }
    medidas.a7_tecla_ate_rita_ms = Date.now() - t0;
    await ate(page, () => BC.parede.texto('rita/nina').split('\n').some((l) => l.trim() === 'theus-aqui rita'), null, 'o eco no ampliado do Theus');
    t.diagnostic('digitado pelo Theus, rodou na Rita em ' + medidas.a7_tecla_ate_rita_ms + ' ms (inclui digitação de 29 teclas)');
    /* latência: tecla do Theus no terminal da Rita → eco de volta na tela dele (60 teclas, uma por vez) */
    const lat = await page.evaluate(async () => {
      const amostras = []; let esperando = null, ligado = true;
      BC.real.ouvir((m) => { if (!ligado || !esperando || m.tipo !== 'term-saida' || m.dono !== 'rita' || m.id !== 'nina' || m.dados.indexOf(esperando.c) < 0) return; amostras.push(performance.now() - esperando.t); const r = esperando.r; esperando = null; r(); });
      for (let i = 0; i < 60; i++) {
        const c = String.fromCharCode(97 + (i % 26));
        await new Promise((r) => { esperando = { c, t: performance.now(), r }; BC.real.enviar({ tipo: 'term-entrada', dono: 'rita', id: 'nina', dados: c }); setTimeout(() => { if (esperando) { esperando = null; r(); } }, 1000); });
      }
      BC.real.enviar({ tipo: 'term-entrada', dono: 'rita', id: 'nina', dados: '\x15' }); /* Ctrl+U apaga a linha */
      ligado = false;
      amostras.sort((a, b) => a - b);
      const q = (p) => Math.round(amostras[Math.min(amostras.length - 1, Math.floor(p * amostras.length))] * 10) / 10;
      return { n: amostras.length, p50: q(0.5), p95: q(0.95), max: q(1) };
    });
    medidas.a7_eco_teclas = lat;
    t.diagnostic('tecla → eco (Theus no terminal da Rita, 2 Estações na mesma máquina): ' + JSON.stringify(lat));
    assert.ok(lat.n >= 55, 'ecos medidos: ' + lat.n);
    assert.ok(lat.p95 < 100, 'p95 < 100 ms: ' + lat.p95);
    /* a parede da Rita mostra o Theus no terminal dela; no mapa da sala, o laço */
    await ate(R.page, () => /Theus aqui/.test(document.querySelector('[data-k="rita/nina"] .pr-selo').textContent), null, 'selo "Theus aqui" no cartão da Rita');
    const laco = await page.evaluate(() => document.querySelectorAll('.pr-constelacao .bc-c-laco').length);
    assert.ok(laco >= 1, 'laço no mapa da sala');
    await page.waitForTimeout(300);
    await print(page, 'a7-theus-no-terminal-da-rita.png');
    await R.page.evaluate(() => BC.parede.voltar());
    await R.page.waitForTimeout(300);
    await print(R.page, 'a7-parede-da-rita-com-theus.png');
  });

  it('A9 · selo na tela da Rita; ela encerra e a tecla seguinte do Theus é recusada pelo servidor dela', async (t) => {
    const { page } = R;
    await ate(page, () => { const s = document.querySelector('#e-status .st-controle.pr-selo-st'); return s && /Theus está no seu terminal Nina/.test(s.textContent); }, null, 'selo "Theus está no seu terminal Nina" no rodapé da Rita');
    const selo = await page.$eval('#e-status .st-controle.pr-selo-st', (s) => ({ texto: s.textContent.trim(), cor: s.style.getPropertyValue('--pr-cor'), luz: s.style.getPropertyValue('--luz') }));
    t.diagnostic('selo: ' + JSON.stringify(selo));
    await print(page, 'a9-selo-na-rita.png');
    await page.click('#e-status .st-controle.pr-selo-st [data-acao="controle-encerrar"]');
    await ate(T.page, () => !BC.parede.controles().some((c) => c.quem === 'theus' && c.dono === 'rita'), null, 'o controle do Theus acabar');
    /* a tela do Theus já não deixa digitar; e se uma tecla sair assim mesmo (tela atrasada), o servidor da Rita recusa */
    assert.equal(await T.page.evaluate(() => BC.parede.podeDigitar('rita/nina')), false);
    await T.page.click('.pr-amp-tela');
    await T.page.keyboard.type('x');
    await ate(T.page, () => /entre no terminal/i.test(document.querySelector('.pr-amp-aviso').textContent), null, 'o aviso "entre no terminal" no ampliado do Theus');
    await T.page.evaluate(() => { window.__recusas = []; BC.real.enviar({ tipo: 'term-entrada', dono: 'rita', id: 'nina', dados: 'echo nao-deve-rodar-9\r' }); });
    const rec = await ate(T.page, () => window.__recusas.find((m) => m.dono === 'rita' && m.id === 'nina'), null, 'term-recusado da Rita');
    const motivo = await rec.evaluate((m) => m.motivo);
    assert.equal(motivo, 'sem permissão');
    await ate(T.page, () => /recusada/.test(document.querySelector('.pr-amp-aviso').textContent), null, 'aviso de tecla recusada');
    await esperar(1500);
    const textoRita = await page.evaluate(() => BC.parede.texto('rita/nina'));
    assert.ok(!textoRita.includes('nao-deve-rodar-9'), 'a tecla recusada não chegou ao terminal da Rita');
    await print(T.page, 'a9-theus-depois-de-encerrado.png');
    await T.page.evaluate(() => BC.parede.voltar());
  });

  it('A8 · a Rita (membro, fora do projeto) pede para entrar no terminal do Theus; ele aceita com um clique e as teclas dela passam', async (t) => {
    await T.page.evaluate(() => BC.real.enviar({ tipo: 'term-abrir', id: 'aurora', nome: 'Aurora', cols: 90, rows: 24 }));
    await verCartao(R.page, 'theus/aurora');
    /* sem permissão ainda: a tecla dela é recusada no servidor do Theus */
    await R.page.evaluate(() => { window.__recusas = []; BC.real.enviar({ tipo: 'term-entrada', dono: 'theus', id: 'aurora', dados: 'echo sem-permissao\r' }); });
    const rec = await ate(R.page, () => window.__recusas.find((m) => m.dono === 'theus'), null, 'recusa sem permissão');
    assert.equal(await rec.evaluate((m) => m.motivo), 'sem permissão');
    const rotulo = await R.page.$eval('[data-k="theus/aurora"] [data-acao="term-entrar"]', (b) => b.textContent);
    assert.equal(rotulo, 'Pedir para entrar');
    await R.page.click('[data-k="theus/aurora"] [data-acao="term-entrar"]');
    await ate(R.page, () => BC.parede.ampliado() === 'theus/aurora' && BC.parede.controles().some((c) => c.dono === 'theus' && c.quem === 'rita' && c.estado === 'pedido'), null, 'o pedido da Rita registrado');
    await ate(T.page, () => { const s = document.querySelector('#e-status .st-pedido.pr-selo-st'); return s && /Rita quer entrar no seu terminal Aurora/.test(s.textContent); }, null, 'o pedido no rodapé do Theus');
    await R.page.waitForTimeout(200);
    await print(R.page, 'a8-rita-pediu.png');
    await print(T.page, 'a8-pedido-no-theus.png');
    await T.page.click('#e-status .st-pedido.pr-selo-st [data-acao="controle-aceitar"]');
    await ate(R.page, () => BC.parede.podeDigitar('theus/aurora'), null, 'a Rita poder digitar');
    await verCartao(T.page, 'theus/aurora'); /* o xterm do próprio Theus, na parede dele */
    await R.page.click('.pr-amp-tela');
    await R.page.keyboard.type('echo "rita-aqui $BABEL_EU"');
    await R.page.keyboard.press('Enter');
    await ate(T.page, () => BC.parede.texto('theus/aurora').split('\n').some((l) => l.trim() === 'rita-aqui theus'), null, '"rita-aqui theus" no xterm do Theus');
    await ate(T.page, () => { const s = document.querySelector('#e-status .st-controle.pr-selo-st'); return s && /Rita está no seu terminal Aurora/.test(s.textContent); }, null, 'selo "Rita está no seu terminal Aurora" no Theus');
    await R.page.waitForTimeout(300);
    await print(R.page, 'a8-rita-no-terminal-do-theus.png');
    await print(T.page, 'a8-selo-rita-no-theus.png');
    /* a Rita sai */
    await R.page.click('.pr-amp-acoes [data-acao="controle-sair"]');
    await ate(T.page, () => !BC.parede.controles().some((c) => c.quem === 'rita'), null, 'a Rita sair');
    await R.page.evaluate(() => BC.parede.voltar());
  });

  it('A10/A16 · a Rita pausa: o cartão esfria na parede do Theus e nada do que sai durante a pausa chega, nem depois', async (t) => {
    await R.page.evaluate(() => BC.parede.voltar());
    await T.page.evaluate(() => BC.parede.voltar());
    await verCartao(T.page, 'rita/nina');
    await R.page.$eval('[data-k="rita/nina"]', (c) => c.scrollIntoView({ block: 'center' }));
    await R.page.click('[data-k="rita/nina"] [data-acao="parede-pausar"]');
    await ate(T.page, () => { const c = document.querySelector('[data-k="rita/nina"]'); return c && c.dataset.estado === 'pausado' && /pausado por Rita/.test(c.querySelector('.pr-selo').textContent); }, null, 'cartão pausado na parede do Theus');
    await R.page.evaluate(() => BC.real.enviar({ tipo: 'term-entrada', id: 'nina', dados: 'echo segredo-pausa-$((70+7))\r' }));
    await ate(R.page, () => BC.parede.texto('rita/nina').includes('segredo-pausa-77'), null, 'o comando rodar na Rita (ela vê)');
    await esperar(1500);
    assert.ok(!(await T.page.evaluate(() => BC.parede.texto('rita/nina'))).includes('segredo-pausa-77'), 'durante a pausa nada chega ao Theus');
    const pausado = await T.page.$eval('[data-k="rita/nina"]', (c) => ({ vivo: c.dataset.vivo, filtro: getComputedStyle(c.querySelector('.pr-escala')).filter, aviso: c.querySelector('.pr-tela-aviso').textContent, no: document.querySelector('.pr-constelacao .bc-c-no[data-estado="pausado"]') ? 'pausado' : 'outro', vidro: getComputedStyle(c).backdropFilter }));
    t.diagnostic('cartão pausado: ' + JSON.stringify(pausado));
    assert.equal(pausado.vivo, 'nao'); assert.match(pausado.filtro, /saturate/); assert.equal(pausado.vidro, 'none', 'pausado perde o vidro do HUD'); assert.equal(pausado.aviso, 'transmissão pausada por Rita');
    await print(T.page, 'a10-pausado-na-parede-do-theus.png');
    await R.page.click('[data-k="rita/nina"] [data-acao="parede-pausar"]');
    await ate(T.page, () => BC.parede.texto('rita/nina').includes('transmissão retomada'), null, 'a tela limpa "transmissão retomada" no Theus');
    await R.page.evaluate(() => BC.real.enviar({ tipo: 'term-entrada', id: 'nina', dados: 'echo depois-da-pausa\r' }));
    await ate(T.page, () => BC.parede.texto('rita/nina').includes('depois-da-pausa'), null, 'a saída de depois da pausa');
    assert.ok(!(await T.page.evaluate(() => BC.parede.texto('rita/nina'))).includes('segredo-pausa-77'), 'nem depois de retomar');
    await T.page.waitForTimeout(300);
    await print(T.page, 'a16-parede-duas-estacoes.png');
  });

  it('assinatura por visibilidade: a parede saiu da tela → term-parar; voltou → tela nova do dono, com o que saiu nesse meio-tempo', async (t) => {
    const { page } = T;
    await page.evaluate(() => BC.parede.voltar());
    await verCartao(page, 'rita/nina');
    await page.evaluate(() => BC.estacao.abrir('dia'));
    await ate(page, () => !BC.parede.sessao('rita/nina').assistindo, null, 'a parede parar de assistir', 6000);
    await R.page.evaluate(() => BC.real.enviar({ tipo: 'term-entrada', id: 'nina', dados: 'echo longe-da-tela-$((5*5))\r' }));
    await ate(R.page, () => BC.parede.texto('rita/nina').includes('longe-da-tela-25'), null, 'o comando rodar na Rita');
    await esperar(800);
    assert.ok(!(await page.evaluate(() => BC.parede.texto('rita/nina'))).includes('longe-da-tela-25'), 'sem assinatura, nada chega ao Theus');
    await page.evaluate(() => BC.estacao.abrir('terminais'));
    await verCartao(page, 'rita/nina');
    await ate(page, () => BC.parede.texto('rita/nina').includes('longe-da-tela-25'), null, 'a tela nova do dono ao voltar');
  });

  it('agente real (simulado na tela): bloco e estado do agente aparecem no cartão; a parede nunca soa', async (t) => {
    const antes = await T.page.evaluate(() => BC.organismo.contagem());
    await T.page.evaluate(() => {
      BC.real.simular({ tipo: 'agente-bloco', dono: 'rita', id: 'nina', bloco: { bid: 'b1', tipo: 'consulta', titulo: 'consultei', texto: 'atas.md · campanhas.csv', ts: Date.now() } });
      BC.real.simular({ tipo: 'agente-estado', dono: 'rita', id: 'nina', estado: 'espera', ferramenta: 'Bash', desde: Date.now() - 4000, ts: Date.now() });
    });
    const c = await T.page.$eval('[data-k="rita/nina"]', (x) => ({ bloco: x.querySelector('.pr-bloco').textContent, oculto: x.querySelector('.pr-bloco').hidden, mini: x.querySelector('.bc-presenca').dataset.estado, frase: x.querySelector('.pr-frase').textContent }));
    t.diagnostic('cartão com agente: ' + JSON.stringify(c));
    assert.equal(c.oculto, false); assert.match(c.bloco, /consultei/); assert.equal(c.mini, 'espera'); assert.match(c.frase, /espera você/);
    const depois = await T.page.evaluate(() => BC.organismo.contagem());
    const sons = (o) => Object.values(o.somPedido || {}).reduce((a, b) => a + b, 0);
    medidas.sons_pedidos_theus = { antes: sons(antes), depois: sons(depois) };
    assert.equal(sons(depois) - sons(antes), 0, 'a parede não pediu som');
    await print(T.page, 'agente-bloco-no-cartao.png');
    const soDaParede = erros.filter((e) => /parede-real/.test(e));
    assert.deepEqual(soDaParede, [], 'nenhum erro vindo da parede');
  });

  it('controles-publico: entre terceiros a parede mostra "● Carla aqui" (resumo que o dono espalha) e desfaz quando o resumo esvazia', async (t) => {
    await T.page.evaluate(() => BC.parede.voltar());
    await verCartao(T.page, 'rita/nina');
    const seloRita = () => T.page.$eval('[data-k="rita/nina"] .pr-selo', (x) => x.textContent.trim());
    assert.doesNotMatch(await seloRita(), /Carla aqui/);
    /* o servidor da Rita espalha "a Carla está no Nina" e o do Theus repassa às telas dele (servidor: testes/servidor/integracao.test.js) */
    /* o app limpo só conhece quem tem token e está na rede: a Carla entra como terceira Estação (par) antes do resumo */
    await T.page.evaluate(() => BC.real.simular({ tipo: 'pares', lista: BC.real.pares().concat([{ id: 'carla', nome: 'Carla', papel: 'membro', ligado: true }]) }));
    await T.page.evaluate(() => BC.real.simular({ tipo: 'controles-publico', dono: 'rita', lista: [{ dono: 'rita', quem: 'carla', sessao: 'nina' }] }));
    await ate(T.page, () => /Carla aqui/.test(document.querySelector('[data-k="rita/nina"] .pr-selo').textContent), null, 'selo "Carla aqui" entre terceiros');
    const c = await T.page.$eval('[data-k="rita/nina"]', (x) => ({ selo: x.querySelector('.pr-selo').textContent.trim(), controlado: x.classList.contains('controlado'), acoes: x.querySelector('.pr-acoes').textContent }));
    const ativos = await T.page.evaluate(() => BC.parede.ativos().filter((x) => x.publico));
    t.diagnostic('cartão com a Carla (terceiros): ' + JSON.stringify(c));
    assert.ok(c.controlado, 'o cartão pega a luz de quem está nele');
    assert.doesNotMatch(c.acoes, /Encerrar Carla/, 'o resumo público não dá botão de encerrar a quem não é dono');
    assert.deepEqual(ativos.map((x) => [x.dono, x.quem, x.sessao]), [['rita', 'carla', 'nina']]);
    await print(T.page, 'parede-carla-aqui-entre-terceiros.png');
    await T.page.evaluate(() => BC.real.simular({ tipo: 'controles-publico', dono: 'rita', lista: [] }));
    await ate(T.page, () => !/Carla aqui/.test(document.querySelector('[data-k="rita/nina"] .pr-selo').textContent), null, 'o selo some quando o resumo esvazia');
  });
});
