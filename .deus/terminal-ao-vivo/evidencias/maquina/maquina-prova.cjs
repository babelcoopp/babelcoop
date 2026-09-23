/* babel-coop · prova da MÁQUINA 2030 (missão babel-coop/terminal-ao-vivo, papel MÁQUINA)
   Tudo no Electron do próprio app, janela escondida (BABEL_COOP_OCULTO); nenhum Google Chrome.
   Uso (de dentro de app/, para achar o playwright):
     node <este>.cjs antes <prefixo>      prints da Máquina como está (Estação real, equipe fundada)
     node <este>.cjs fluxo <prefixo>      a Máquina por evento real: cliques em Testar, Enviar, outra empresa, zoom, vitrine, montar, publicar
     node <este>.cjs roteiro <saida.json> docs/testes/roteiro.js inteiro numa página do Electron (route em http://coop.local)
   Portas só deste papel: HTTP 5020–5029, UDP 41520–41529. */
'use strict';
const fs = require('fs');
const path = require('path');
const { abrirEstacao, raizTemporaria } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/testes/e2e/estacao.js');

const EVID = '/Users/matheussilveirapro/Desktop/babel-coop/.deus/terminal-ao-vivo/evidencias/maquina';
const ROTEIRO = '/Users/matheussilveirapro/Desktop/babel-coop/docs/testes/roteiro.js';
const [modo, arg] = process.argv.slice(2);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function estacaoFundada(porta, udp, nome) {
  const raiz = raizTemporaria(nome || 'maquina');
  fs.mkdirSync(path.join(raiz, 'zdot'), { recursive: true });
  const E = await abrirEstacao({ nome: nome || 'maquina', raiz, porta, descoberta: udp, env: { ZDOTDIR: path.join(raiz, 'zdot') } });
  const erros = [];
  E.page.on('pageerror', (e) => erros.push(String(e && e.message || e).slice(0, 240)));
  E.page.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text().slice(0, 200)); });
  const f = await E.api('/api/fundar', { nome: 'Theus' });
  await E.page.reload();
  await E.page.waitForFunction(() => window.BC && BC.estacao && BC.maquina && document.getElementById('e-status') && document.getElementById('e-status').children.length, null, { timeout: 25000 });
  await espera(1200);
  await E.page.evaluate(() => document.fonts && document.fonts.ready);
  return Object.assign(E, { erros, fundou: f });
}

async function antes(prefixo) {
  const E = await estacaoFundada(5020, 41520, 'maquina-antes');
  const { page } = E;
  const out = (n) => path.join(EVID, prefixo + '-' + n + '.png');
  const r = { fundou: E.fundou && (E.fundou.id || E.fundou.ok || E.fundou) };
  try {
    await page.evaluate(() => { BC.estacao.fecharTodas(); BC.maquina.abrir('clinicas'); });
    await espera(900);
    await page.screenshot({ path: out('maquina') });
    r.medidas = await page.evaluate(() => {
      const palco = document.querySelector('.mq-palco'), c = document.getElementById('e-conteudo');
      const rp = palco ? palco.getBoundingClientRect() : null;
      return {
        tamanho: innerWidth + 'x' + innerHeight,
        conteudo: c ? Math.round(c.getBoundingClientRect().width) + 'x' + Math.round(c.getBoundingClientRect().height) : null,
        palco: rp ? Math.round(rp.width) + 'x' + Math.round(rp.height) : null,
        pecas: document.querySelectorAll('.mq-peca').length,
        emojis: (document.querySelector('.mq') || document.body).innerText.match(/[\u{1F300}-\u{1FAFF}⚙]/gu) || [],
        organismo: !!(window.BC && BC.organismo && BC.organismo.versao)
      };
    });
    await page.evaluate(() => BC.acoes['mq-testar']());
    await espera(4000);
    await page.screenshot({ path: out('testando') });
    await espera(9000);
    await page.screenshot({ path: out('testou') });
    r.erros = E.erros.slice();
  } finally {
    fs.writeFileSync(path.join(EVID, prefixo + '-medidas.json'), JSON.stringify(r, null, 2));
    await E.fechar();
  }
  console.log(JSON.stringify(r, null, 2).slice(0, 3000));
}

/* a página do Electron com context().newPage() trocado por uma janela escondida do próprio app (Electron não cria página solta) */
function adaptar(E) {
  const { app, page } = E;
  const ctx = page.context();
  const ctxProxy = new Proxy(ctx, {
    get(alvo, k) {
      if (k === 'newPage') {
        return async () => {
          const nova = app.waitForEvent('window');
          await app.evaluate(({ BrowserWindow }) => { const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { contextIsolation: true } }); w.loadURL('about:blank'); });
          const p = await nova;
          await p.waitForLoadState().catch(() => {});
          return p;
        };
      }
      const v = alvo[k];
      return typeof v === 'function' ? v.bind(alvo) : v;
    }
  });
  return new Proxy(page, {
    get(alvo, k) {
      if (k === 'context') return () => ctxProxy;
      const v = alvo[k];
      return typeof v === 'function' ? v.bind(alvo) : v;
    }
  });
}

async function roteiro(saida) {
  const E = await abrirEstacao({ nome: 'maquina-rot', raiz: raizTemporaria('maquina-rot'), porta: 5022, descoberta: 41522 });
  try {
    await E.page.waitForLoadState();
    const src = fs.readFileSync(ROTEIRO, 'utf8');
    const fn = (0, eval)('(' + src + '\n)');
    const t0 = Date.now();
    const r = await fn(adaptar(E));
    r.segundos = Math.round((Date.now() - t0) / 1000);
    r.onde = 'Electron ' + (await E.app.evaluate(() => process.versions.electron)) + ' · janela escondida · route http://coop.local → prototipo/';
    fs.writeFileSync(saida, JSON.stringify(r, null, 2));
    console.log(r.resumo, '·', r.segundos, 's');
    r.falhas.forEach((f) => console.log('FALHA', JSON.stringify(f)));
    r.tudo.filter((t) => /Máquina|máquina|preset|Testar|B · /.test(t)).forEach((t) => console.log(t));
  } finally { await E.fechar(); }
}

module.exports = { estacaoFundada, espera, EVID };

if (require.main === module) {
  (async () => {
    if (modo === 'antes') await antes(arg || 'antes');
    else if (modo === 'roteiro') await roteiro(arg || path.join(EVID, 'roteiro.json'));
    else if (modo === 'fluxo') await require('./maquina-fluxo.cjs').fluxo(arg || 'depois');
    else console.log('uso: antes <prefixo> | fluxo <prefixo> | roteiro <saida.json>');
  })().catch((e) => { console.error('ERRO', e && e.stack || e); process.exitCode = 1; });
}
