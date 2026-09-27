/* babel-coop · e2e: a Estação abre inteira sem internet (rede local, sem saída para fora)
   Estação escondida, porta 5477, descoberta 41977, raiz temporária. A rede externa fica bloqueada no Electron
   (session.webRequest cancela todo pedido que não seja localhost/127.0.0.1/[::1]) e a página recarrega com o bloqueio ligado.
   Prova, em ordem:
   1. o HTML que o app serve (a Estação e as outras páginas do protótipo) não aponta nada para a internet;
   2. equipe fundada: IBM Plex Sans, JetBrains Mono e Cormorant Garamond carregam de /vendor/fontes (document.fonts),
      marked, DOMPurify, highlight.js e pdf.js existem na página; um PDF abre sem worker de fora e sem eval de fonte;
   3. um .md aberto pela árvore sai formatado (marked: título, negrito, bloco de código realçado pelo highlight.js);
   4. nenhum pedido da interface tentou sair para a internet;
   5. se existe o pacote (npm run empacotar): o app empacotado leva e serve as bibliotecas e as fontes.
   Uso: npm run teste:e2e -- (ou node --test testes/e2e/sem-internet.test.js). Evidências: $BABEL_TESTE_EVIDENCIAS/sem-internet ou tmp.
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { abrirEstacao, raizTemporaria, APP } = require('./estacao');

const PORTA = 5477, DESCOBERTA = 41977;
const EVID = process.env.BABEL_TESTE_EVIDENCIAS ? path.join(process.env.BABEL_TESTE_EVIDENCIAS, 'sem-internet') : path.join(os.tmpdir(), 'babel-e2e-sem-internet-evidencias');
const PROTOTIPO = path.join(APP, '..', 'prototipo');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const FONTES = [['IBM Plex Sans', '400', 'normal'], ['IBM Plex Sans', '600', 'normal'], ['JetBrains Mono', '400', 'normal'], ['JetBrains Mono', '700', 'normal'], ['Cormorant Garamond', '500', 'normal'], ['Cormorant Garamond', '500', 'italic']];

async function ate(page, fn, arg, oque, ms = 20000) {
  try { return await page.waitForFunction(fn, arg, { timeout: ms, polling: 100 }); }
  catch (e) { throw new Error('tempo esgotado esperando ' + oque + ': ' + e.message.split('\n')[0]); }
}
/* src/href/url() que saem para fora (link que a pessoa clica, <a href>, não conta) */
function externosNoHtml(html) {
  const achados = [];
  const re = /<(script|link|img|iframe|source|video|audio)\b[^>]*\b(?:src|href)=["'](https?:)?\/\/(?!localhost[:/]|127\.0\.0\.1[:/])[^"']*["'][^>]*>/gi;
  let m; while ((m = re.exec(html))) achados.push(m[0].slice(0, 160));
  const mapa = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
  if (mapa && /https?:\/\//.test(mapa[1])) achados.push('importmap: ' + mapa[1].slice(0, 160));
  return achados;
}
function htmlsDoPrototipo(rel = '') {
  const saida = [];
  for (const d of fs.readdirSync(path.join(PROTOTIPO, rel), { withFileTypes: true })) {
    const r = rel ? rel + '/' + d.name : d.name;
    if (d.isDirectory()) { if (d.name !== 'midia') saida.push(...htmlsDoPrototipo(r)); } else if (d.name.endsWith('.html')) saida.push(r);
  }
  return saida;
}
/* um PDF de uma página, com xref certo, feito aqui (nada de arquivo de fora) */
function pdfMinimo(texto) {
  const fluxo = 'BT /F1 24 Tf 20 60 Td (' + texto + ') Tj ET';
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    '<< /Length ' + fluxo.length + ' >>\nstream\n' + fluxo + '\nendstream', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  let s = '%PDF-1.4\n'; const pos = [];
  objs.forEach((o, i) => { pos.push(s.length); s += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
  const xref = s.length;
  s += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + pos.map((p) => String(p).padStart(10, '0') + ' 00000 n \n').join('');
  s += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
  return Array.from(Buffer.from(s, 'latin1'));
}

describe('sem internet · a Estação abre inteira na rede local', { timeout: 300000 }, () => {
  let T = null, raiz = null, idJanela = null;
  const erros = [], medidas = {};

  before(async () => {
    fs.mkdirSync(EVID, { recursive: true });
    raiz = raizTemporaria('sem-internet');
    fs.mkdirSync(path.join(raiz, 'zdot'), { recursive: true }); /* o zsh do terminal real não escreve no $HOME de ninguém */
    T = await abrirEstacao({ nome: 'sem-internet', raiz, porta: PORTA, descoberta: DESCOBERTA, env: { ZDOTDIR: path.join(raiz, 'zdot') } });
    T.page.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
    T.page.on('console', (m) => { if (m.type() === 'error' && !/favicon|ERR_|502|Failed to load resource/.test(m.text())) erros.push('console: ' + m.text()); });
    T.page.on('dialog', (d) => { erros.push('janela do navegador: ' + d.type() + ' ' + d.message()); d.dismiss().catch(() => {}); });
    await T.page.waitForLoadState('domcontentloaded');
    /* a rede de fora some: todo pedido http(s)/ws(s) que não é desta máquina é cancelado e anotado (com a janela que pediu) */
    idJanela = await T.app.evaluate(({ session, BrowserWindow }) => {
      global.__externos = [];
      const local = /^(https?|wss?):\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i;
      session.defaultSession.webRequest.onBeforeRequest((d, cb) => {
        if (/^(https?|wss?|ftp):/i.test(d.url) && !local.test(d.url)) { global.__externos.push({ url: d.url, tipo: d.resourceType, janela: d.webContentsId == null ? null : d.webContentsId }); return cb({ cancel: true }); }
        cb({});
      });
      const j = BrowserWindow.getAllWindows().find((w) => /^http:\/\/localhost:\d+\//.test(w.webContents.getURL()));
      return j ? j.webContents.id : null;
    });
    const f = await T.api('/api/fundar', { nome: 'Theus' });
    assert.equal(f.pronto, true, 'fundar: ' + JSON.stringify(f));
    await T.page.reload();
    await T.page.waitForLoadState('load');
    await ate(T.page, () => window.BC && BC.real && BC.real.bemvindo && BC.real.bemvindo.eu && BC.real.bemvindo.eu.pronto && BC.estacao && BC.estacao.ui && BC.loja.estado && BC.arquivosReal, null, 'a Estação pronta', 30000);
  });

  after(async () => {
    try { medidas.externos = await T.app.evaluate(() => global.__externos || []); } catch (e) { /* app já fechado */ }
    medidas.erros = erros;
    try { fs.writeFileSync(path.join(EVID, 'resultado.json'), JSON.stringify(Object.assign({ quando: new Date().toISOString() }, medidas), null, 2) + '\n'); } catch (e) { /* segue */ }
    if (T) await T.fechar().catch(() => {});
    try { if (raiz) fs.rmSync(raiz, { recursive: true, force: true }); } catch (e) { /* a pasta temporária some com o sistema */ }
  });

  it('1 · o HTML servido pelo app não aponta nada para a internet (Estação e as outras páginas do protótipo)', async () => {
    const paginas = ['index.html', ...htmlsDoPrototipo().filter((f) => f !== 'index.html')];
    const achados = {};
    for (const p of paginas) {
      const r = await fetch(T.base + '/' + p);
      assert.equal(r.status, 200, p);
      const fora = externosNoHtml(await r.text());
      if (fora.length) achados[p] = fora;
    }
    medidas.paginasConferidas = paginas;
    assert.deepEqual(achados, {}, 'página servida ainda busca a internet');
    const html = await (await fetch(T.base + '/')).text();
    for (const s of ['/vendor/fontes.css', '/vendor/marked.min.js', '/vendor/purify.min.js', '/vendor/highlight.min.js', '/vendor/pdf.min.js', '/vendor/pdf.worker.min.js', '/vendor/three/build/three.module.js']) assert.ok(html.includes(s), 'a página não usa ' + s);
    /* o protótipo puro (aberto fora do app) continua com a CDN: só o HTML servido troca */
    assert.match(fs.readFileSync(path.join(PROTOTIPO, 'index.html'), 'utf8'), /cdnjs\.cloudflare\.com\/ajax\/libs\/marked/);
  });

  it('2 · as três fontes carregam de dentro do app e as bibliotecas estão na página', async () => {
    const r = await T.page.evaluate(async (fontes) => {
      const saida = { fontes: [], libs: {} };
      for (const [familia, peso, estilo] of fontes) {
        const desc = estilo + ' ' + peso + ' 16px "' + familia + '"';
        let carregadas = [];
        try { carregadas = await document.fonts.load(desc, 'Ação já'); } catch (e) { /* conta como zero */ }
        saida.fontes.push({ desc, carregadas: carregadas.length, todasProntas: carregadas.every((f) => f.status === 'loaded'), check: document.fonts.check(desc, 'Ação já') });
      }
      saida.woff2 = performance.getEntriesByType('resource').map((e) => e.name).filter((n) => /\.woff2?(\?|$)/.test(n));
      saida.libs = {
        marked: typeof (window.marked && window.marked.parse), DOMPurify: typeof (window.DOMPurify && window.DOMPurify.sanitize), hljs: typeof (window.hljs && window.hljs.highlight),
        pdfjs: typeof (window.pdfjsLib && window.pdfjsLib.getDocument), pdfjsVersao: window.pdfjsLib && window.pdfjsLib.version, pdfjsWorker: typeof (window.pdfjsWorker && window.pdfjsWorker.WorkerMessageHandler),
        dompurifyVersao: window.DOMPurify && window.DOMPurify.version, hljsLinguas: window.hljs ? window.hljs.listLanguages().length : 0
      };
      return saida;
    }, FONTES);
    medidas.fontes = r.fontes; medidas.woff2 = r.woff2; medidas.libs = r.libs;
    for (const f of r.fontes) {
      assert.ok(f.carregadas > 0, 'nenhuma face carregou para ' + f.desc);
      assert.ok(f.todasProntas && f.check, 'fonte não pronta: ' + f.desc);
    }
    assert.ok(r.woff2.length >= FONTES.length, 'woff2 baixados: ' + r.woff2.length);
    assert.deepEqual(r.woff2.filter((n) => !n.startsWith(T.base + '/vendor/fontes/')), [], 'fonte vinda de fora do app');
    assert.equal(r.libs.marked, 'function');
    assert.equal(r.libs.DOMPurify, 'function');
    assert.equal(r.libs.hljs, 'function');
    assert.equal(r.libs.pdfjs, 'function');
    assert.equal(r.libs.pdfjsWorker, 'function', 'o worker do pdf.js roda na própria página (sem buscar pdf.worker de fora)');
    assert.ok(r.libs.hljsLinguas > 30, 'highlight.js com as linguagens comuns');
  });

  it('3 · um PDF abre com o pdf.js de dentro do app, sem worker de fora e sem eval de fonte', async () => {
    const r = await T.page.evaluate(async (bytes) => {
      /* como editor.js e tv.js fazem: o workerSrc aponta para a CDN; com o pdf.worker já na página, o pdf.js não busca nada */
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const tarefa = window.pdfjsLib.getDocument({ data: new Uint8Array(bytes) });
      const pdf = await tarefa.promise;
      const pg = await pdf.getPage(1);
      const vp = pg.getViewport({ scale: 1 });
      const cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
      await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
      const px = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      let tinta = 0; for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 0 && px[i] + px[i + 1] + px[i + 2] < 384) tinta++; /* pixels escuros: o texto (o fundo sai branco) */
      const texto = (await pg.getTextContent()).items.map((i) => i.str).join('');
      const params = tarefa._transport && tarefa._transport._params;
      const saida = { paginas: pdf.numPages, texto, tinta, evalDaFonte: params ? params.isEvalSupported : 'sem _params' };
      await tarefa.destroy();
      return saida;
    }, pdfMinimo('sem internet ok'));
    medidas.pdf = r;
    assert.equal(r.paginas, 1);
    assert.equal(r.texto, 'sem internet ok');
    assert.ok(r.tinta > 50 && r.tinta < 43200 / 2, 'o texto do PDF não foi desenhado: ' + r.tinta + ' pixels escuros');
    assert.equal(r.evalDaFonte, false, 'pdf.js 3.x com eval de fonte ligado (CVE-2024-4367)');
  });

  it('4 · um .md aberto pela árvore sai formatado (marked + DOMPurify + highlight.js)', async () => {
    const md = '# Sem internet\n\nA equipe trabalha **na rede local**.\n\n- um\n- dois\n\n```js\nconst porta = 5477;\n```\n';
    const put = await fetch(T.base + '/api/arquivo?caminho=' + encodeURIComponent('sem-internet.md'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conteudo: md }) });
    assert.equal(put.status, 200, 'PUT sem-internet.md');
    await T.page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.ui.abertas.theus = true; BC.estacao.abrir('explorador'); });
    const linha = '.arv-arq[data-id="theus/sem-internet.md"]';
    await ate(T.page, (s) => !!document.querySelector(s), linha, 'sem-internet.md na árvore');
    await T.page.click(linha);
    await ate(T.page, () => !!document.querySelector('.md-corpo h1') && !!document.querySelector('.md-corpo pre code .hljs-keyword'), null, 'o .md formatado com o código realçado');
    const r = await T.page.evaluate(() => {
      const c = document.querySelector('.md-corpo');
      return { h1: c.querySelector('h1').textContent, strong: (c.querySelector('strong') || {}).textContent, itens: c.querySelectorAll('ul li').length, codigoClasse: (c.querySelector('pre code') || {}).className, palavraChave: (c.querySelector('pre code .hljs-keyword') || {}).textContent, fonteCorpo: getComputedStyle(c).fontFamily };
    });
    medidas.md = r;
    assert.equal(r.h1, 'Sem internet');
    assert.equal(r.strong, 'na rede local');
    assert.equal(r.itens, 2);
    assert.match(r.codigoClasse, /language-js/, 'bloco de código do marked (o simples não faz <pre><code>)');
    assert.equal(r.palavraChave, 'const');
    try { await T.page.screenshot({ path: path.join(EVID, 'sem-internet-md.png'), timeout: 15000 }); medidas.print = 'sem-internet-md.png'; } catch (e) { medidas.print = 'falhou: ' + e.message; }
  });

  it('5 · nenhum pedido da interface tentou sair para a internet', async () => {
    await esperar(1500); /* o que ainda estava a caminho */
    const externos = await T.app.evaluate(() => global.__externos || []);
    medidas.externosTodos = externos;
    const daInterface = externos.filter((e) => e.janela === idJanela || e.janela == null && /^(mainFrame|subFrame|stylesheet|script|image|font|xhr|media|webSocket)$/.test(e.tipo));
    assert.ok(idJanela != null, 'a janela da Estação foi achada');
    assert.deepEqual(daInterface, [], 'a interface tentou a internet');
    assert.deepEqual(erros, [], 'erros na página');
    /* o instrumento pega de verdade: um pedido de fora feito pela página é cancelado e anotado */
    const antes = externos.length;
    const sonda = await T.page.evaluate(() => fetch('https://fonts.gstatic.com/sonda-sem-internet.woff2').then(() => 'passou', (e) => 'cancelado: ' + e.message));
    await esperar(300);
    const depois = await T.app.evaluate(() => global.__externos || []);
    medidas.sonda = { resultado: sonda, anotada: depois.slice(antes) };
    assert.match(sonda, /^cancelado/, 'o bloqueio deixou a sonda passar');
    assert.ok(depois.slice(antes).some((e) => /sonda-sem-internet/.test(e.url) && e.janela === idJanela), 'o bloqueio não anotou a sonda da janela da Estação');
  });
});

/* 5 · o app empacotado leva e serve as bibliotecas e as fontes (só com o pacote feito: npm run empacotar) */
const ARCH = process.arch;
const APP_PATH = path.join(APP, 'dist', ARCH === 'x64' ? 'mac' : 'mac-' + ARCH, 'babel-coop.app');
const EXEC = path.join(APP_PATH, 'Contents', 'MacOS', 'babel-coop');
const SEM_PACOTE = process.platform !== 'darwin' ? 'só no Mac' : (fs.existsSync(EXEC) ? false : 'sem pacote: rode npm run empacotar');
describe('sem internet · o pacote leva as bibliotecas e as fontes', { timeout: 180000, skip: SEM_PACOTE }, () => {
  const VENDOR = ['marked.min.js', 'purify.min.js', 'highlight.min.js', 'pdf.min.js', 'pdf.worker.min.js'];
  it('o asar tem os arquivos que o servidor serve, sem o resto dos pacotes', () => {
    const asar = require('@electron/asar');
    const lista = new Set(asar.listPackage(path.join(APP_PATH, 'Contents', 'Resources', 'app.asar'), { isPack: false }).map((f) => f.replace(/\\/g, '/')));
    const precisa = ['/node_modules/marked/marked.min.js', '/node_modules/dompurify/dist/purify.min.js', '/node_modules/@highlightjs/cdn-assets/highlight.min.js', '/node_modules/pdfjs-dist/build/pdf.min.js', '/node_modules/pdfjs-dist/build/pdf.worker.min.js',
      '/node_modules/@fontsource/ibm-plex-sans/600.css', '/node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2', '/node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2'];
    assert.deepEqual(precisa.filter((f) => !lista.has(f)), [], 'falta no asar');
    const sobra = [...lista].filter((f) => /^\/node_modules\/pdfjs-dist\/(legacy|web|types|cmaps)\/|^\/node_modules\/@highlightjs\/cdn-assets\/languages\/|^\/node_modules\/@fontsource\/[^/]+\/files\/[^/]+\.woff$|^\/node_modules\/canvas\//.test(f));
    assert.deepEqual(sobra.slice(0, 5), [], 'o asar leva o que o app não usa');
  });

  it('o app empacotado serve as bibliotecas, as fontes e a página sem internet', async () => {
    const { _electron } = require('playwright');
    const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'babel-sem-internet-pacote-'));
    const env = {};
    Object.keys(process.env).forEach((k) => { if (!/^(CLAUDE|BABEL_COOP|ELECTRON_RUN_AS_NODE)/.test(k)) env[k] = process.env[k]; });
    Object.assign(env, { BABEL_COOP_RAIZ: raiz, BABEL_COOP_PORTA: String(PORTA), BABEL_COOP_DESCOBERTA: String(DESCOBERTA), BABEL_COOP_OCULTO: '1', BABEL_COOP_AGENTES: '0', ZDOTDIR: raiz });
    const eapp = await _electron.launch({ executablePath: EXEC, args: [], env, cwd: raiz, timeout: 60000 });
    try {
      await (await eapp.firstWindow()).waitForLoadState('load');
      const base = 'http://localhost:' + PORTA;
      for (const v of VENDOR) {
        const r = await fetch(base + '/vendor/' + v);
        assert.equal(r.status, 200, '/vendor/' + v);
        assert.ok((await r.arrayBuffer()).byteLength > 10000, '/vendor/' + v + ' vazio');
      }
      const css = await (await fetch(base + '/vendor/fontes.css')).text();
      for (const fam of ['IBM Plex Sans', 'JetBrains Mono', 'Cormorant Garamond']) assert.ok(css.includes("font-family: '" + fam + "'"), fam + ' no fontes.css do pacote');
      const woff = css.match(/url\((\/vendor\/fontes\/[^)]+-latin-400-normal\.woff2)\)/);
      assert.ok(woff, 'woff2 latino no fontes.css');
      const r = await fetch(base + woff[1]);
      assert.equal(r.status, 200, woff[1]);
      assert.equal(r.headers.get('content-type'), 'font/woff2');
      assert.deepEqual(externosNoHtml(await (await fetch(base + '/')).text()), [], 'a página do pacote busca a internet');
    } finally {
      await eapp.close().catch(() => {});
      try { fs.rmSync(raiz, { recursive: true, force: true }); } catch (e) { /* segue */ }
    }
  });
});
