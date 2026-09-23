/* babel-coop · e2e do navegador próprio (PROTOCOLO §9 · NAV-MAIN)
   Uma Estação Electron de verdade, escondida (HTTP 4930, UDP 41430), e um site de teste servido aqui mesmo (HTTP 4931):
   cadastro com campo de senha, CSS externo, imagem, fonte woff2 (gerada na hora a partir de uma fonte do sistema),
   fetch para uma API e console.log/aviso/erro/exceção. Na página da Estação nasce um <webview>, registrado pelo preload;
   cada função do módulo (navegador/navegador.js) é provada com dado real, pelo IPC da tela e pelo processo principal
   (o mesmo caminho que o servidor e o conector coop usam). Nada de Playwright no produto: aqui ele só abre o Electron.
   Uso: cd app && node --test testes/e2e/navegador.test.js      (BABEL_COOP_VER=1 mostra a janela)
   Prints e medidas: .deus/terminal-ao-vivo/evidencias/navegador/
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { pathToFileURL } = require('url');
const { abrirEstacao, APP } = require('./estacao');

const PORTA = 4930, PORTA_SITE = 4931, DESCOBERTA = 41430;
const SITE = 'http://localhost:' + PORTA_SITE;
const EVID = process.env.BABEL_TESTE_EVIDENCIAS ? path.join(process.env.BABEL_TESTE_EVIDENCIAS, 'navegador') : path.join(APP, '..', '.deus', 'terminal-ao-vivo', 'evidencias', 'navegador');
const AGENTE = 'rita';

/* ---------- uma fonte WOFF2 de verdade: TTF do sistema embrulhado em WOFF2 (Brotli, tabelas sem transformação) ---------- */
const TAGS = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill'];
function base128(n) { const b = []; do { b.unshift(n & 0x7f); n = Math.floor(n / 128); } while (n > 0); for (let i = 0; i < b.length - 1; i++) b[i] |= 0x80; return Buffer.from(b); }
function ttfParaWoff2(ttf) {
  const n = ttf.readUInt16BE(4);
  const tabelas = [];
  for (let i = 0; i < n; i++) { const o = 12 + i * 16; tabelas.push({ tag: ttf.toString('latin1', o, o + 4), offset: ttf.readUInt32BE(o + 8), length: ttf.readUInt32BE(o + 12) }); }
  tabelas.sort((a, b) => (a.tag < b.tag ? -1 : 1));
  const li = tabelas.findIndex((t) => t.tag === 'loca');
  if (li !== -1) { const loca = tabelas.splice(li, 1)[0]; tabelas.splice(tabelas.findIndex((t) => t.tag === 'glyf') + 1, 0, loca); } /* loca logo depois de glyf */
  const dir = [], dados = [];
  for (const t of tabelas) {
    const k = TAGS.indexOf(t.tag);
    dir.push(Buffer.from([(k === -1 ? 63 : k) | ((t.tag === 'glyf' || t.tag === 'loca' ? 3 : 0) << 6)]));
    if (k === -1) dir.push(Buffer.from(t.tag, 'latin1'));
    dir.push(base128(t.length));
    dados.push(ttf.subarray(t.offset, t.offset + t.length));
  }
  const comp = zlib.brotliCompressSync(Buffer.concat(dados), { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9, [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_FONT } });
  const diretorio = Buffer.concat(dir);
  const totalSfnt = 12 + 16 * n + tabelas.reduce((s, t) => s + ((t.length + 3) & ~3), 0);
  const pad = (4 - ((48 + diretorio.length + comp.length) % 4)) % 4;
  const h = Buffer.alloc(48);
  h.write('wOF2', 0, 'latin1'); h.writeUInt32BE(ttf.readUInt32BE(0), 4); h.writeUInt32BE(48 + diretorio.length + comp.length + pad, 8);
  h.writeUInt16BE(n, 12); h.writeUInt32BE(totalSfnt, 16); h.writeUInt32BE(comp.length, 20); h.writeUInt16BE(1, 24);
  return Buffer.concat([h, diretorio, comp, Buffer.alloc(pad)]);
}
const FONTES_DO_SISTEMA = ['/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf', '/System/Library/Fonts/Monaco.ttf', '/System/Library/Fonts/Geneva.ttf', 'C:\\Windows\\Fonts\\arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'];

/* ---------- o site de teste ---------- */
const HTML = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Loja Teste</title>
<link rel="stylesheet" href="/css/site.css"><link rel="icon" href="/img/logo.png">
</head><body>
<header class="topo"><img class="logo" src="/img/logo.png" alt="Logo da Loja Teste" width="64" height="64"><nav><a href="/sobre">Sobre</a> <a href="#planos">Planos</a></nav></header>
<main>
<section class="hero"><h1>Loja Teste</h1><p>A loja de mentira que o <strong>agente</strong> usa para provar o navegador.</p>
<button id="abrir-cadastro" type="button">Cadastro</button> <button id="avisar" type="button">Avisar</button> <button id="apagar" type="button">Apagar conta</button></section>
<section id="planos"><h2>Planos</h2><h3>Básico</h3><p>Para começar sem pagar nada.</p><h3>Pro</h3><p>Para quem vende todo dia.</p><ul><li>Suporte humano</li><li>Relatórios</li></ul></section>
<section id="form-cadastro" hidden><h2>Cadastro</h2>
<form id="cadastro" onsubmit="return false">
<label for="nome">Nome</label><input id="nome" name="nome" required>
<label for="email">E-mail</label><input id="email" name="email" type="email" required>
<label for="senha">Senha</label><input id="senha" name="senha" type="password" autocomplete="new-password">
<label for="confirmar">Confirmar senha</label><input id="confirmar" name="confirmacao" type="text" autocomplete="new-password">
<label for="plano">Plano</label><select id="plano" name="plano"><option value="basico">Básico</option><option value="pro">Pro</option></select>
<button id="cadastrar" type="submit">Cadastrar</button>
</form><p id="resultado"></p></section>
<section class="longa"><h2>Depoimentos</h2><p>Primeiro depoimento: comprei e voltei.</p><p>Segundo depoimento: o suporte respondeu na hora.</p></section>
</main>
<footer><p>Rodapé da Loja Teste</p></footer>
<script src="/js/site.js"></script>
</body></html>`;
const CSS = `@font-face { font-family: 'Teste Sans'; src: url('../fontes/teste.woff2') format('woff2'); font-display: block; }
body { margin: 0; background: #101820; color: #c3cfe5; font-family: 'Teste Sans', Georgia, serif; }
.topo { display: flex; align-items: center; gap: 16px; padding: 12px 24px; background-image: url('../img/fundo.png'); background-size: 40px; }
.topo a { color: #7ba4f0; }
main { padding: 0 24px; }
h1 { color: #2ad5e5; font-size: 48px; letter-spacing: -0.02em; }
h2 { color: #a376e9; }
button { background: #2ad5e5; color: #060b16; border: 0; padding: 10px 18px; border-radius: 8px; font-size: 16px; }
input, select { display: block; margin: 4px 0 12px; padding: 8px; width: 320px; }
.longa { min-height: 2200px; border-top: 1px solid #1d2a3a; }
`;
const JS = `window.__cliques = [];
document.addEventListener('click', function (e) { window.__cliques.push({ alvo: e.target.id || e.target.tagName, confiavel: e.isTrusted, x: e.clientX, y: e.clientY }); }, true);
document.getElementById('abrir-cadastro').addEventListener('click', function () { document.getElementById('form-cadastro').hidden = false; });
document.getElementById('avisar').addEventListener('click', function () { alert('Obrigado pela visita!'); document.body.dataset.avisou = '1'; });
document.getElementById('apagar').addEventListener('click', function () { document.body.dataset.apagou = confirm('Tem certeza que quer apagar a conta?') ? 'sim' : 'nao'; });
document.getElementById('cadastro').addEventListener('submit', function (e) {
  e.preventDefault();
  fetch('/api/cadastro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: nome.value, email: email.value, plano: plano.value }) })
    .then(function (r) { return r.json(); }).then(function (j) { document.getElementById('resultado').textContent = 'Cadastro recebido: ' + j.nome; });
});
fetch('/api/produtos').then(function (r) { return r.json(); }).then(function (l) {
  var ul = document.createElement('ul'); ul.id = 'produtos';
  l.forEach(function (p) { var li = document.createElement('li'); li.textContent = p.nome; ul.appendChild(li); });
  document.querySelector('.hero').appendChild(ul);
  console.log('site de teste pronto', l.length, 'produtos');
});
console.warn('aviso de teste');
console.error('erro de teste proposital');
setTimeout(function () { throw new Error('exceção de teste'); }, 50);`;

function subirSite(fonte) {
  const recebidos = [];
  const arquivos = {
    '/': ['text/html; charset=utf-8', HTML], '/sobre': ['text/html; charset=utf-8', '<!DOCTYPE html><title>Sobre</title><h1>Sobre a Loja Teste</h1>'],
    '/css/site.css': ['text/css', CSS], '/js/site.js': ['text/javascript', JS],
    '/img/logo.png': ['image/png', fs.readFileSync(path.join(APP, 'interface', 'midia', 'mostrador-anel-512.png'))],
    '/img/fundo.png': ['image/png', fs.readFileSync(path.join(APP, '..', 'prototipo', 'babel-logo.png'))],
    '/api/produtos': ['application/json', JSON.stringify([{ nome: 'Camiseta' }, { nome: 'Caneca' }, { nome: 'Adesivo' }])]
  };
  if (fonte) arquivos['/fontes/teste.woff2'] = ['font/woff2', fonte];
  const srv = http.createServer((req, res) => {
    const p = new URL(req.url, SITE).pathname;
    if (p === '/api/cadastro' && req.method === 'POST') {
      let s = ''; req.on('data', (c) => { s += c; }); req.on('end', () => { let b = {}; try { b = JSON.parse(s); } catch (e) { b = {}; } recebidos.push(b); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, nome: b.nome })); });
      return;
    }
    const a = arquivos[p];
    if (!a) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('não achei'); }
    res.writeHead(200, { 'Content-Type': a[0], 'Cache-Control': 'no-store' });
    res.end(a[1]);
  });
  return new Promise((ok) => srv.listen(PORTA_SITE, '127.0.0.1', () => ok({ srv, recebidos, fechar: () => new Promise((f) => { srv.closeAllConnections(); srv.close(() => f()); }) })));
}

function dimPng(buf) { return buf.readUInt32BE(0) === 0x89504e47 ? { largura: buf.readUInt32BE(16), altura: buf.readUInt32BE(20) } : null; }

describe('navegador próprio do agente (webview + CDP, sem Chrome)', { timeout: 300000 }, () => {
  let E, site, wcId, pasta, urlClone, fonte = null, fonteOrigem = null;
  const medidas = {};
  const nav = async (metodo, ...args) => {
    const t0 = Date.now();
    const r = await E.app.evaluate(async (_el, [m, a]) => {
      const n = globalThis.babelCoop.navegadores;
      try { return { ok: true, v: await n[m](...a) }; } catch (e) { return { ok: false, erro: e.message, codigo: e.codigo }; }
    }, [metodo, args]);
    r.ms = Date.now() - t0;
    return r;
  };
  const naPagina = (js) => E.app.evaluate(({ webContents }, [id, codigo]) => webContents.fromId(id).executeJavaScript(codigo), [wcId, js]);
  const printDoWebview = async (nome) => {
    const b64 = await E.app.evaluate(async ({ webContents }, id) => (await webContents.fromId(id).capturePage()).toPNG().toString('base64'), wcId);
    const buf = Buffer.from(b64, 'base64');
    fs.writeFileSync(path.join(EVID, nome), buf);
    return buf;
  };
  const printDaEstacao = async (nome) => {
    const b64 = await E.app.evaluate(async ({ BrowserWindow }, porta) => {
      const w = BrowserWindow.getAllWindows().find((x) => x.webContents.getURL().indexOf(':' + porta) !== -1);
      return w ? (await w.capturePage()).toPNG().toString('base64') : '';
    }, PORTA);
    const buf = Buffer.from(b64, 'base64');
    if (buf.length) fs.writeFileSync(path.join(EVID, nome), buf);
    return buf;
  };

  before(async () => {
    fs.mkdirSync(EVID, { recursive: true });
    fonteOrigem = FONTES_DO_SISTEMA.find((f) => fs.existsSync(f)) || null;
    if (fonteOrigem) fonte = ttfParaWoff2(fs.readFileSync(fonteOrigem));
    site = await subirSite(fonte);
    E = await abrirEstacao({ nome: 'nav', porta: PORTA, descoberta: DESCOBERTA });
    /* o Playwright do teste também enxerga o webview e fecha diálogos sozinho; quem decide é o produto (disableDialogs no main.js).
       Um ouvinte vazio faz o Playwright não mexer (sem ele, a primeira rodada passou por causa do Playwright, não do app). */
    const naoMexerEmDialogo = (p) => p.on('dialog', () => {});
    E.app.context().pages().forEach(naoMexerEmDialogo);
    E.app.context().on('page', naoMexerEmDialogo);
    await E.page.waitForFunction(() => !!(window.coopElectron && window.coopElectron.navegador), null, { timeout: 30000 });
    pasta = (await E.api('/api/eu')).pasta;
    /* um <webview> na tela, como a aba "Navegador · Rita" faz */
    wcId = await E.page.evaluate(() => new Promise((ok, falha) => {
      const wv = document.createElement('webview');
      wv.id = 'wv-teste';
      wv.setAttribute('partition', 'persist:navegador-teste');
      wv.setAttribute('src', 'about:blank');
      wv.style.cssText = 'position:fixed;left:0;top:0;width:1100px;height:720px;z-index:2147483646;background:#fff';
      wv.addEventListener('dom-ready', () => ok(wv.getWebContentsId()), { once: true });
      document.body.appendChild(wv);
      setTimeout(() => falha(new Error('o webview não ficou pronto')), 20000);
    }));
    await E.page.evaluate(() => {
      window.__passos = []; window.__estados = []; window.__abas = [];
      window.coopElectron.navegador.aoPasso((p) => window.__passos.push(p));
      window.coopElectron.navegador.aoEstado((e) => window.__estados.push(e));
      window.coopElectron.navegador.aoPedirAba((a) => window.__abas.push(a));
    });
  });

  after(async () => {
    try { fs.writeFileSync(path.join(EVID, 'medidas.json'), JSON.stringify(medidas, null, 2)); } catch (e) { /* segue */ }
    if (E) await E.fechar().catch(() => {});
    if (site) await site.fechar().catch(() => {});
  });

  it('o preload expõe a API e o registro liga o webview ao agente', async (t) => {
    const chaves = await E.page.evaluate(() => Object.keys(window.coopElectron.navegador).sort());
    for (const k of ['registrar', 'assumir', 'devolver', 'selecionar', 'raioX', 'aoPasso', 'aoEstado', 'ler', 'copy', 'clonar', 'print', 'abrir', 'estado']) assert.ok(chaves.includes(k), 'falta ' + k);
    const semNode = await E.page.evaluate(() => typeof window.require + '/' + typeof window.process);
    assert.equal(semNode, 'undefined/undefined', 'a tela não enxerga Node');
    const est = await E.page.evaluate((id) => window.coopElectron.navegador.registrar(id, 'rita', { nome: 'Rita', cor: '#a376e9', pessoa: 'Theus' }), wcId);
    assert.equal(est.registrado, true);
    assert.equal(est.controlador, 'agente');
    assert.equal(est.nome, 'Rita');
    const de2 = await E.page.evaluate((id) => window.coopElectron.navegador.registrar(id, 'rita', { nome: 'Rita' }), wcId);
    assert.equal(de2.registrado, true, 'registrar de novo é idempotente');
    const guestSemNode = await naPagina('typeof require + "/" + typeof process');
    assert.equal(guestSemNode, 'undefined/undefined', 'o webview do agente não tem Node');
    t.diagnostic('webContentsId do webview: ' + wcId + ' · pasta ' + pasta + ' · fonte ' + (fonteOrigem || 'nenhuma') + ' (' + (fonte ? fonte.length : 0) + ' bytes woff2)');
  });

  it('abrir: carrega a página e devolve título e status', async (t) => {
    const r = await nav('abrir', AGENTE, SITE + '/');
    assert.ok(r.ok, r.erro);
    assert.equal(r.v.titulo, 'Loja Teste');
    assert.equal(r.v.status, 200);
    medidas.abrir_ms = r.v.ms;
    await naPagina('new Promise(function (ok) { var n = 0; (function ver() { if (document.getElementById("produtos") || n++ > 60) return ok(); setTimeout(ver, 50); })(); })');
    if (fonte) await naPagina('document.fonts.ready.then(function () { return true; })');
    await printDaEstacao('navegador-0-estacao-com-webview.png');
    t.diagnostic('abrir ' + r.v.ms + ' ms · status ' + r.v.status);
  });

  it('clicar: acha "Cadastro" pelo texto, leva o cursor do agente e clica com mouse de verdade', async (t) => {
    const r = await nav('clicar', AGENTE, { texto: 'Cadastro' });
    assert.ok(r.ok, r.erro);
    assert.equal(r.v.clicou, 'Cadastro');
    assert.equal(r.v.seletor, '#abrir-cadastro');
    medidas.clicar_ms = r.ms;
    const pag = await naPagina('({ aberto: !document.getElementById("form-cadastro").hidden, cliques: window.__cliques.slice(), cursor: (function () { var c = document.getElementById("__babel-coop-cursor"); return c ? { x: +c.dataset.x, y: +c.dataset.y, cliques: +c.dataset.cliques, nome: c.shadowRoot.querySelector(".n").textContent } : null; })() })');
    assert.equal(pag.aberto, true, 'o formulário abriu com o clique');
    const ultimo = pag.cliques[pag.cliques.length - 1];
    assert.equal(ultimo.alvo, 'abrir-cadastro');
    assert.equal(ultimo.confiavel, true, 'isTrusted: clique de mouse de verdade, não element.click()');
    assert.ok(pag.cursor, 'o cursor do agente está desenhado na página');
    assert.equal(pag.cursor.x, r.v.x); assert.equal(pag.cursor.y, r.v.y);
    assert.ok(pag.cursor.cliques >= 1);
    assert.match(pag.cursor.nome, /Rita/);
    await new Promise((ok) => setTimeout(ok, 120));
    await printDoWebview('navegador-1-clique-cadastro-cursor.png');
    t.diagnostic('clicou em (' + r.v.x + ',' + r.v.y + ') em ' + r.ms + ' ms · cursor em (' + pag.cursor.x + ',' + pag.cursor.y + ')');
  });

  it('digitar: preenche Nome (seletor) e E-mail (pelo rótulo) com o teclado', async () => {
    const a = await nav('digitar', AGENTE, '#nome', 'Rita Souza');
    assert.ok(a.ok, a.erro);
    assert.equal(a.v.ok, true);
    assert.equal(a.v.valor, 'Rita Souza');
    const b = await nav('digitar', AGENTE, 'E-mail', 'rita@teste.com');
    assert.ok(b.ok, b.erro);
    assert.equal(b.v.seletor, '#email');
    assert.equal(b.v.campo, 'E-mail');
    medidas.digitar_ms = b.ms;
    medidas.digitar_modo = [a.v.modo, b.v.modo];
    const v = await naPagina('[document.getElementById("nome").value, document.getElementById("email").value]');
    assert.deepEqual(v, ['Rita Souza', 'rita@teste.com']);
  });

  it('digitar em campo de senha: recusa e devolve "sua vez: a pessoa digita a senha"', async () => {
    const r = await nav('digitar', AGENTE, '#senha', 'segredo123');
    assert.ok(r.ok, r.erro);
    assert.equal(r.v.ok, false);
    assert.equal(r.v.recusado, 'senha');
    assert.equal(r.v.mensagem, 'sua vez: a pessoa digita a senha');
    const c = await nav('digitar', AGENTE, '#confirmar', 'segredo123');
    assert.equal(c.v.recusado, 'senha', 'autocomplete=new-password também é senha, mesmo com type=text');
    const v = await naPagina('[document.getElementById("senha").value, document.getElementById("confirmar").value]');
    assert.deepEqual(v, ['', ''], 'nenhuma letra entrou nos campos de senha');
    const suaVez = await E.page.waitForFunction(() => window.__estados.some((e) => e.suaVez === true && e.senha && e.senha.seletor === '#senha'), null, { timeout: 3000 }).then(() => true, () => false);
    assert.ok(suaVez, 'a tela recebeu o estado "sua vez" com o campo: ' + JSON.stringify(await E.page.evaluate(() => window.__estados.slice(-8))));
    await printDoWebview('navegador-2-senha-sua-vez.png');
  });

  it('escolher no <select> e enviar o cadastro: a API do site recebe sem senha', async () => {
    const s = await nav('digitar', AGENTE, '#plano', 'Pro');
    assert.ok(s.ok, s.erro);
    assert.equal(s.v.valor, 'Pro');
    const c = await nav('clicar', AGENTE, '#cadastrar');
    assert.ok(c.ok, c.erro);
    await naPagina('new Promise(function (ok) { var n = 0; (function ver() { if (document.getElementById("resultado").textContent || n++ > 60) return ok(); setTimeout(ver, 50); })(); })');
    const res = await naPagina('document.getElementById("resultado").textContent');
    assert.equal(res, 'Cadastro recebido: Rita Souza');
    const ultimo = site.recebidos[site.recebidos.length - 1];
    assert.deepEqual(ultimo, { nome: 'Rita Souza', email: 'rita@teste.com', plano: 'pro' });
  });

  it('aviso e confirmação da página não travam o agente: alert é aceito, confirm é cancelado (a pessoa decide)', async (t) => {
    const t0 = Date.now();
    const a = await nav('clicar', AGENTE, { texto: 'Avisar' });
    assert.ok(a.ok, a.erro);
    const c = await nav('clicar', AGENTE, { texto: 'Apagar conta' });
    assert.ok(c.ok, c.erro);
    const d = await naPagina('({ avisou: document.body.dataset.avisou, apagou: document.body.dataset.apagou })');
    assert.deepEqual(d, { avisou: '1', apagou: 'nao' });
    const passos = await E.page.evaluate(() => window.__passos.filter((p) => p.tipo === 'aviso').map((p) => p.texto));
    assert.ok(passos.some((p) => p.includes('Obrigado pela visita!')), passos.join(' | '));
    assert.ok(passos.some((p) => p.includes('Tem certeza que quer apagar a conta?') && /cancelei/.test(p)), passos.join(' | '));
    t.diagnostic('dois cliques com diálogo em ' + (Date.now() - t0) + ' ms');
  });

  it('ler: a página em Markdown com títulos, links e o formulário', async (t) => {
    const r = await nav('ler', AGENTE);
    assert.ok(r.ok, r.erro);
    const md = r.v.markdown;
    for (const trecho of ['# Loja Teste', '## Planos', '### Básico', '[Sobre](' + SITE + '/sobre)', '**Formulário**', 'campo **E-mail**', '(senha: só a pessoa digita)', 'escolha **Plano**', 'Cadastro recebido: Rita Souza', '- Suporte humano']) assert.ok(md.includes(trecho), 'faltou no Markdown: ' + trecho + '\n' + md);
    medidas.ler_ms = r.ms; medidas.ler_caracteres = md.length;
    fs.writeFileSync(path.join(EVID, 'ler.md'), md);
    t.diagnostic(md.length + ' caracteres de Markdown em ' + r.ms + ' ms');
  });

  it('raio-X: DOM, CSS do elemento, fontes, cores, copy, rede (fetch) e console', async (t) => {
    const r = await nav('raioX', AGENTE, { seletor: 'h1' });
    assert.ok(r.ok, r.erro);
    const x = r.v;
    medidas.raiox_ms = r.ms;
    /* DOM vivo */
    assert.equal(x.dom.t, 'body');
    const achar = (no, f) => (f(no) ? no : (no.f || []).reduce((a, c) => a || achar(c, f), null));
    const h1 = achar(x.dom, (n) => n.t === 'h1');
    assert.ok(h1 && h1.x === 'Loja Teste' && h1.s, 'o h1 está na árvore com seletor navegável');
    /* CSS do elemento */
    assert.equal(x.elemento.estilos.color, 'rgb(42, 213, 229)');
    assert.equal(x.elemento.cores.texto, '#2ad5e5');
    const regra = x.elemento.regras.find((g) => g.seletor === 'h1');
    assert.ok(regra, 'regra h1 do site.css: ' + JSON.stringify(x.elemento.regras));
    assert.ok(regra.origem.endsWith('/css/site.css'), regra.origem);
    assert.ok(regra.propriedades.some((p) => p.nome === 'color' && /#2ad5e5/i.test(p.valor)));
    assert.match(x.elemento.html, /^<h1>Loja Teste<\/h1>$/);
    /* fontes */
    if (fonte) {
      assert.ok(x.fontes.declaradas.some((f) => f.familia === 'Teste Sans' && f.status === 'loaded'), JSON.stringify(x.fontes.declaradas));
      assert.ok(x.fontes.arquivos.some((f) => f.url.endsWith('/fontes/teste.woff2') && f.status === 200 && f.bytes > 1000), JSON.stringify(x.fontes.arquivos));
      assert.ok(x.fontes.css.some((f) => f.familia === 'Teste Sans' && /teste\.woff2/.test(f.src)));
      assert.ok(x.elemento.fontesRenderizadas.some((f) => f.daPagina), 'o h1 foi desenhado com a fonte da página: ' + JSON.stringify(x.elemento.fontesRenderizadas));
    }
    assert.ok(x.fontes.usadas.some((f) => /Teste Sans/.test(f.familia)));
    /* cores */
    const cores = x.cores.map((c) => c.cor);
    for (const c of ['#2ad5e5', '#a376e9', '#101820']) assert.ok(cores.includes(c), 'faltou a cor ' + c + ': ' + cores.join(' '));
    /* copy em ordem */
    const textos = x.copy.map((b) => b.tag + ':' + b.texto);
    const i1 = textos.indexOf('h1:Loja Teste'), i2 = textos.indexOf('h2:Planos'), i3 = textos.indexOf('h2:Depoimentos');
    assert.ok(i1 !== -1 && i1 < i2 && i2 < i3, 'copy em ordem: ' + textos.join(' | '));
    /* rede */
    const pedido = (fim) => x.rede.find((e) => e.url.endsWith(fim));
    const api = pedido('/api/produtos');
    assert.ok(api && api.tipo === 'Fetch' && api.status === 200 && api.bytes > 0, JSON.stringify(api));
    const post = pedido('/api/cadastro');
    assert.ok(post && post.metodo === 'POST' && post.status === 200, JSON.stringify(post));
    assert.equal(pedido('/css/site.css').tipo, 'Stylesheet');
    assert.equal(pedido('/img/logo.png').tipo, 'Image');
    if (fonte) assert.equal(pedido('/fontes/teste.woff2').tipo, 'Font');
    /* console */
    const tem = (nivel, trecho) => x.console.some((m) => m.nivel === nivel && m.texto.includes(trecho));
    assert.ok(tem('log', 'site de teste pronto 3 produtos'), JSON.stringify(x.console));
    assert.ok(tem('aviso', 'aviso de teste'));
    assert.ok(tem('erro', 'erro de teste proposital'));
    assert.ok(x.console.some((m) => m.excecao && m.texto.includes('exceção de teste')));
    /* o mesmo pelo IPC da tela; e a Rede sozinha (sem varrer a página) */
    const pelaTela = await E.page.evaluate(() => window.coopElectron.navegador.raioX('rita', { seletor: 'h1' }));
    assert.equal(pelaTela.elemento.estilos.color, 'rgb(42, 213, 229)');
    const soRede = await E.page.evaluate(() => window.coopElectron.navegador.raioX('rita', { partes: ['rede', 'console'] }));
    assert.equal(soRede.dom, undefined);
    assert.ok(soRede.rede.length >= 6);
    const busca = await nav('raioX', AGENTE, { busca: 'Relatórios', dom: false });
    assert.ok(busca.v.busca.achados.some((a) => a.t === 'li' && a.trecho === 'Relatórios'));
    fs.writeFileSync(path.join(EVID, 'raiox-h1.json'), JSON.stringify({ resumo: x.resumo, elemento: x.elemento, fontes: x.fontes, cores: x.cores.slice(0, 12), copy: x.copy.slice(0, 20), rede: x.rede, console: x.console, domRaiz: { t: x.dom.t, filhos: (x.dom.f || []).map((f) => f.t + (f.id ? '#' + f.id : '')) } }, null, 2));
    t.diagnostic('raio-X em ' + r.ms + ' ms · ' + x.resumo.elementos + ' elementos · ' + x.rede.length + ' pedidos · ' + x.console.length + ' mensagens · ' + x.cores.length + ' cores');
  });

  it('selecionar elemento: modo inspeção do Chromium, a pessoa clica e vem o raio-X do elemento', async (t) => {
    const alvo = await naPagina('(function () { var e = document.querySelector("#planos h2"); e.scrollIntoView({ block: "center" }); var r = e.getBoundingClientRect(); return { x: Math.round(r.left + 20), y: Math.round(r.top + r.height / 2) }; })()');
    await E.page.evaluate(() => { window.__sel = null; window.coopElectron.navegador.selecionar('rita').then((s) => { window.__sel = s || 'nada'; }, (e) => { window.__sel = 'erro: ' + e.message; }); });
    await E.page.waitForFunction(() => window.__estados.some((e) => e.selecionando === true), null, { timeout: 10000 });
    /* a pessoa passa o mouse e clica (evento de entrada do sistema, não CDP) */
    await E.app.evaluate(async ({ webContents }, [id, p]) => {
      const wc = webContents.fromId(id);
      wc.sendInputEvent({ type: 'mouseMove', x: p.x, y: p.y });
      await new Promise((ok) => setTimeout(ok, 120));
      wc.sendInputEvent({ type: 'mouseDown', x: p.x, y: p.y, button: 'left', clickCount: 1 });
      wc.sendInputEvent({ type: 'mouseUp', x: p.x, y: p.y, button: 'left', clickCount: 1 });
    }, [wcId, alvo]);
    await E.page.waitForFunction(() => window.__sel !== null, null, { timeout: 15000 });
    const sel = await E.page.evaluate(() => window.__sel);
    assert.equal(typeof sel, 'object', String(sel));
    assert.equal(sel.tag, 'h2');
    assert.equal(sel.rotulo, 'Planos');
    assert.equal(sel.elemento.estilos.color, 'rgb(163, 118, 233)');
    const fim = await E.page.evaluate(() => window.coopElectron.navegador.estado('rita'));
    assert.equal(fim.selecionando, false, 'o modo inspeção desligou');
    t.diagnostic('escolhido: ' + sel.seletor);
  });

  it('assumir e devolver: com a pessoa no controle o agente não mexe', async () => {
    const a = await E.page.evaluate(() => window.coopElectron.navegador.assumir('rita'));
    assert.equal(a.controlador, 'pessoa');
    assert.equal(a.assumido, true);
    const recusa = await nav('clicar', AGENTE, { texto: 'Planos' });
    assert.equal(recusa.ok, false);
    assert.equal(recusa.codigo, 'assumido');
    assert.match(recusa.erro, /Theus assumiu o navegador de Rita/);
    const recusaDigitar = await nav('digitar', AGENTE, '#nome', 'x');
    assert.equal(recusaDigitar.codigo, 'assumido');
    const valor = await naPagina('document.getElementById("nome").value');
    assert.equal(valor, 'Rita Souza', 'nada mudou na página enquanto a pessoa tinha o controle');
    const lendo = await nav('ler', AGENTE);
    assert.ok(lendo.ok, 'ler continua valendo (não mexe na página)');
    const d = await E.page.evaluate(() => window.coopElectron.navegador.devolver('rita'));
    assert.equal(d.controlador, 'agente');
    const volta = await nav('clicar', AGENTE, { texto: 'Planos' });
    assert.ok(volta.ok, volta.erro);
    assert.equal(volta.v.clicou, 'Planos');
    assert.match(volta.v.seletor, /^(a|nav|header|body)/, 'clicou no link do menu, não no título: ' + volta.v.seletor);
    /* um link que leva a outra página: o clique espera a página nova carregar e conta que navegou */
    const sobre = await nav('clicar', AGENTE, { texto: 'Sobre' });
    assert.ok(sobre.ok, sobre.erro);
    assert.equal(sobre.v.navegou, true);
    assert.equal(sobre.v.titulo, 'Sobre');
    const deVolta = await nav('abrir', AGENTE, SITE + '/');
    assert.ok(deVolta.ok, deVolta.erro);
    await naPagina('new Promise(function (ok) { var n = 0; (function ver() { if (document.getElementById("produtos") || n++ > 60) return ok(); setTimeout(ver, 50); })(); })');
  });

  it('print: a página inteira em PNG, mais alta que a janela', async (t) => {
    const r = await nav('print', AGENTE);
    assert.ok(r.ok, r.erro);
    const buf = fs.readFileSync(r.v.arquivo);
    const dim = dimPng(buf);
    assert.ok(buf.length > 1000);
    assert.ok(r.v.alturaPagina > 720, 'a página é mais alta que o webview: ' + r.v.alturaPagina);
    assert.ok(dim.altura >= r.v.alturaPagina, 'o PNG cobre a página inteira: ' + dim.altura + ' ≥ ' + r.v.alturaPagina);
    assert.match(r.v.relativo, /^Clones\/localhost_4931\/print-.*\.png$/);
    fs.copyFileSync(r.v.arquivo, path.join(EVID, 'navegador-3-print-pagina-inteira.png'));
    medidas.print = { ms: r.ms, largura: dim.largura, altura: dim.altura, alturaPagina: r.v.alturaPagina, bytes: buf.length };
    t.diagnostic('print ' + dim.largura + '×' + dim.altura + ' px (página ' + r.v.larguraPagina + '×' + r.v.alturaPagina + ' CSS) · ' + buf.length + ' bytes · ' + r.ms + ' ms');
  });

  it('copy: copy.md por seção (h1/h2/h3) com os textos em ordem', async (t) => {
    const r = await nav('copy', AGENTE);
    assert.ok(r.ok, r.erro);
    const md = fs.readFileSync(r.v.arquivo, 'utf8');
    assert.equal(r.v.relativo, 'Clones/localhost_4931/copy.md');
    for (const trecho of ['# Loja Teste', '## Planos', '### Básico', '### Pro', 'Para quem vende todo dia.', '**[Cadastro]**', '- Suporte humano', '## Depoimentos']) assert.ok(md.includes(trecho), 'faltou na copy: ' + trecho + '\n' + md);
    assert.ok(md.indexOf('# Loja Teste') < md.indexOf('## Planos') && md.indexOf('## Planos') < md.indexOf('## Depoimentos'));
    fs.copyFileSync(r.v.arquivo, path.join(EVID, 'copy.md'));
    t.diagnostic(r.v.secoes + ' seções · ' + r.v.bytes + ' bytes');
  });

  it('clonar: HTML + CSS + imagens + fonte em Clones/<site>/ e a cópia abre sozinha, sem o site no ar', async (t) => {
    const r = await nav('clonar', AGENTE);
    assert.ok(r.ok, r.erro);
    const c = r.v;
    medidas.clonar = { ms: r.ms, arquivos: c.arquivos, bytes: c.bytes, porTipo: c.porTipo, faltaram: c.faltaram.length };
    assert.equal(c.relativo, 'Clones/localhost_4931/index.html');
    assert.deepEqual(c.faltaram, []);
    const html = fs.readFileSync(c.index, 'utf8');
    assert.ok(!/<script/i.test(html), 'a cópia não leva script');
    assert.ok(!/onsubmit=/i.test(html), 'nem evento inline');
    assert.ok(!html.includes(SITE + '/css/') && !html.includes('"/css/site.css"') && !html.includes(SITE + '/img/'), 'CSS e imagens apontam para a cópia local');
    assert.match(html, /<link rel="stylesheet" href="assets\/site-[0-9a-f]{6}\.css">/);
    assert.match(html, /<img class="logo" src="assets\/logo-[0-9a-f]{6}\.png"/);
    assert.ok(html.includes('href="' + SITE + '/sobre"'), 'links continuam indo para o site original');
    const assets = fs.readdirSync(path.join(path.dirname(c.index), 'assets'));
    const css = fs.readFileSync(path.join(path.dirname(c.index), 'assets', assets.find((a) => a.endsWith('.css'))), 'utf8');
    assert.match(css, /url\("fundo-[0-9a-f]{6}\.png"\)/);
    if (fonte) { assert.ok(assets.some((a) => /^teste-[0-9a-f]{6}\.woff2$/.test(a)), assets.join(', ')); assert.match(css, /url\("teste-[0-9a-f]{6}\.woff2"\)/); }
    /* pelo servidor da Estação (a rota da pasta compartilhada que a tela usa para abrir o clone como site editável) */
    const rel = 'Clones/localhost_4931/';
    const pag = await E.api('/api/arquivo?caminho=' + encodeURIComponent(rel + 'index.html'));
    assert.equal(pag.tipo, 'html');
    assert.ok(pag.conteudo.includes('assets/site-'));
    const png = assets.find((a) => /^logo-[0-9a-f]{6}\.png$/.test(a));
    const resp = await fetch(E.base + '/api/arquivo?caminho=' + encodeURIComponent(rel + 'assets/' + png));
    assert.equal(resp.status, 200);
    assert.equal(resp.headers.get('content-type'), 'image/png');
    assert.equal(Buffer.from(await resp.arrayBuffer()).length, fs.statSync(path.join(APP, 'interface', 'midia', 'mostrador-anel-512.png')).size);
    const estatica = await fetch(E.base + '/pasta/' + rel + 'index.html').then((x) => x.status).catch(() => 0);
    /* derruba o site original: tudo o que a cópia mostrar vem do disco */
    await site.fechar();
    site = null;
    const url = estatica === 200 ? E.base + '/pasta/' + rel + 'index.html' : pathToFileURL(c.index).href;
    urlClone = url;
    const ab = await nav('abrir', AGENTE, url);
    assert.ok(ab.ok, ab.erro);
    const vivo = await naPagina('new Promise(function (ok) { document.fonts.ready.then(function () { var img = document.querySelector("img.logo"); ok({ cor: getComputedStyle(document.querySelector("h1")).color, fundo: getComputedStyle(document.body).backgroundColor, img: img.naturalWidth, fonte: Array.from(document.fonts).filter(function (f) { return f.family.indexOf("Teste Sans") !== -1; }).map(function (f) { return f.status; }), topoFundo: getComputedStyle(document.querySelector(".topo")).backgroundImage }); }); })');
    assert.equal(vivo.cor, 'rgb(42, 213, 229)', 'o CSS da cópia carregou');
    assert.equal(vivo.fundo, 'rgb(16, 24, 32)');
    assert.ok(vivo.img > 0, 'a imagem da cópia carregou');
    assert.match(vivo.topoFundo, /assets\/fundo-[0-9a-f]{6}\.png/);
    if (fonte) assert.deepEqual(vivo.fonte, ['loaded'], 'a fonte woff2 da cópia carregou');
    const rede = await nav('raioX', AGENTE, { partes: ['rede', 'console'] });
    const deFora = rede.v.rede.filter((e) => e.url.includes('localhost:' + PORTA_SITE));
    assert.deepEqual(deFora, [], 'nenhum pedido ao site original');
    assert.ok(rede.v.rede.filter((e) => e.status === 200 || e.url.startsWith('file:')).length >= 3);
    await printDoWebview('navegador-4-clone-aberto.png');
    t.diagnostic('clone: ' + c.arquivos + ' arquivos · ' + c.bytes + ' bytes · ' + JSON.stringify(c.porTipo) + ' · aberto por ' + (estatica === 200 ? 'http://localhost:' + PORTA + '/pasta/' : 'file:// (a rota /pasta/ do servidor ainda não existe: ' + estatica + ')') + ' · ' + r.ms + ' ms');
  });

  it('segurança: nada fora da pasta, nada da própria Estação, nada de Chrome no código', async () => {
    const estacao = await nav('abrir', AGENTE, 'http://localhost:' + PORTA + '/');
    assert.equal(estacao.ok, false);
    assert.equal(estacao.codigo, 'url');
    const arq = await nav('abrir', AGENTE, 'file:///etc/hosts');
    assert.equal(arq.codigo, 'url');
    const coop = await nav('abrir', AGENTE, pathToFileURL(path.join(path.dirname(pasta), 'coop.json')).href);
    assert.equal(coop.codigo, 'url', 'coop.json (chaves) nunca abre no navegador do agente');
    const js = await nav('abrir', AGENTE, 'javascript:alert(1)');
    assert.equal(js.codigo, 'url');
    const fora = await nav('clonar', AGENTE, os.tmpdir());
    assert.equal(fora.codigo, 'pasta');
    /* com a tela real (interface/navegador-real.js, na lista INJETAR) o pedido de aba é atendido: ela cria "Navegador · ninguem" e a ação
       segue; sem ela, o módulo desiste com 'sem-aba'. Endereço local (about:blank): o teste não depende da internet */
    const temTela = await E.page.evaluate(() => !!(window.BC && BC.navegadorReal && BC.navegadorReal.comModulo && BC.navegadorReal.comModulo()));
    const semAba = await E.app.evaluate(async () => { const n = globalThis.babelCoop.navegadores; const antes = n.o.esperaAbaMs; n.o.esperaAbaMs = 300; try { await n.abrir('ninguem', 'about:blank'); return 'abriu?'; } catch (e) { return e.codigo; } finally { n.o.esperaAbaMs = antes; } });
    if (temTela) assert.ok(['abriu?', 'sem-aba'].includes(semAba), semAba); else assert.equal(semAba, 'sem-aba');
    const pedida = await E.page.evaluate(() => window.__abas.some((a) => a.agente === 'ninguem'));
    assert.ok(pedida, 'a tela recebeu o pedido de abrir a aba do agente');
    /* a página tenta ir sozinha para a Estação (link, redirecionamento, janela nova): o main.js barra */
    await naPagina('location.href = "http://localhost:' + PORTA + '/"; window.open("http://localhost:' + PORTA + '/#x"); true');
    await new Promise((ok) => setTimeout(ok, 800));
    const onde = await nav('estado', AGENTE);
    /* o clone aberto pela rota /pasta/ da Estação é permitido; a Estação em si (/, /#x, /api) não */
    const naEstacao = onde.v.url.startsWith('http://localhost:' + PORTA) && !onde.v.url.startsWith('http://localhost:' + PORTA + '/pasta/');
    assert.ok(!naEstacao, 'a página não conseguiu abrir a Estação: ' + onde.v.url);
    const janelas = await E.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length);
    assert.equal(janelas, 1, 'window.open da página não abriu janela nenhuma');
    /* registrar algo que não é <webview> (a própria janela da Estação) é recusado */
    const idJanela = await E.app.evaluate(({ BrowserWindow }, porta) => BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().indexOf(':' + porta) !== -1).webContents.id, PORTA);
    const naoWebview = await E.page.evaluate((id) => window.coopElectron.navegador.registrar(id, 'intruso').then(() => 'aceitou', (e) => e.message), idJanela);
    assert.match(naoWebview, /só um <webview>/);
    const codigo = ['main.js', 'preload.js', 'navegador/navegador.js', 'navegador/pagina.js', 'navegador/clonar.js', 'navegador/raiox.js'].map((f) => fs.readFileSync(path.join(APP, f), 'utf8')).join('\n');
    assert.ok(!/openExternal\s*\(/.test(codigo), 'ninguém chama shell.openExternal');
    assert.ok(!/channel\s*:\s*['"]chrome/.test(codigo) && !/require\(['"]playwright/.test(codigo), 'nada de Chrome nem Playwright no produto');
  });

  it('passos: a tela recebeu cada passo do agente, na ordem', async (t) => {
    const passos = await E.page.evaluate(() => window.__passos.filter((p) => p.agente === 'rita').map((p) => p.tipo + ' · ' + p.texto));
    const achar = (re) => passos.findIndex((p) => re.test(p));
    const ordem = [/^abrir · abrindo localhost:4931…$/, /^clicar · clicando em Cadastro…$/, /^digitar · preenchendo Nome…$/, /^digitar · preenchendo E-mail…$/, /^senha · senha em Senha: sua vez, Theus digita$/, /^clicar · clicando em Cadastrar…$/, /^controle · Theus assumiu o navegador$/, /^controle · navegador devolvido a Rita$/, /^print · print pronto/, /^copy · copy pronta/, /^clonar · clone pronto/];
    let antes = -1;
    for (const re of ordem) { const i = achar(re); assert.ok(i > antes, 'passo fora de ordem ou ausente: ' + re + '\n' + passos.join('\n')); antes = i; }
    fs.writeFileSync(path.join(EVID, 'passos.txt'), passos.join('\n') + '\n');
    t.diagnostic(passos.length + ' passos');
  });

  it('a ferramenta chega antes da aba: a tela recebe o pedido, cria o webview, registra e a ação segue', async (t) => {
    /* fecha o webview atual: o agente é solto */
    await E.page.evaluate(() => document.getElementById('wv-teste').remove());
    await E.page.waitForFunction(() => window.__estados.some((e) => e.agente === 'rita' && e.registrado === false), null, { timeout: 10000 });
    const solto = await nav('estado', AGENTE);
    assert.equal(solto.v.registrado, false);
    /* com a tela real, é ela que atende o pedido (cria a aba "Navegador · Rita", o webview e registra); sem ela, o teste faz o papel dela */
    const temTela = await E.page.evaluate(() => !!(window.BC && BC.navegadorReal && BC.navegadorReal.comModulo && BC.navegadorReal.comModulo()));
    if (!temTela) await E.page.evaluate(() => {
      window.coopElectron.navegador.aoPedirAba((a) => {
        if (a.agente !== 'rita' || document.getElementById('wv-novo')) return;
        const wv = document.createElement('webview');
        wv.id = 'wv-novo';
        wv.setAttribute('partition', 'persist:navegador-teste');
        wv.setAttribute('src', 'about:blank');
        wv.style.cssText = 'position:fixed;left:0;top:0;width:1100px;height:720px;z-index:2147483646';
        wv.addEventListener('dom-ready', () => { window.__wvNovo = wv.getWebContentsId(); window.coopElectron.navegador.registrar(wv.getWebContentsId(), 'rita', { nome: 'Rita', cor: '#a376e9', pessoa: 'Theus' }); }, { once: true });
        document.body.appendChild(wv);
      });
    });
    const t0 = Date.now();
    const r = await nav('abrir', AGENTE, urlClone);
    assert.ok(r.ok, r.erro);
    assert.equal(r.v.titulo, 'Loja Teste');
    wcId = temTela ? await E.page.evaluate(() => { const x = BC.navegadorReal.sessao('rita'); return x && x.webContentsId; }) : await E.page.evaluate(() => window.__wvNovo);
    assert.ok(wcId, 'o webview novo da Rita');
    const cor = await naPagina('getComputedStyle(document.querySelector("h1")).color');
    assert.equal(cor, 'rgb(42, 213, 229)');
    t.diagnostic('aba pedida, criada, registrada e página aberta em ' + (Date.now() - t0) + ' ms');
  });

  it('site de verdade na internet (só com BABEL_COOP_REDE=1): abrir, ler, raio-X, clonar e print', { skip: process.env.BABEL_COOP_REDE ? false : 'defina BABEL_COOP_REDE=1 para testar com a internet' }, async (t) => {
    const r = await nav('abrir', AGENTE, 'https://example.com/');
    assert.ok(r.ok, r.erro);
    assert.equal(r.v.status, 200);
    const l = await nav('ler', AGENTE);
    assert.match(l.v.markdown, /# Example Domain/);
    const x = await nav('raioX', AGENTE, { seletor: 'h1' });
    assert.ok(x.v.rede.some((e) => e.tipo === 'Document' && e.status === 200));
    assert.ok(x.v.elemento.regras.length > 0);
    const c = await nav('clonar', AGENTE);
    assert.ok(c.ok, c.erro);
    assert.ok(fs.existsSync(c.v.index));
    const p = await nav('print', AGENTE);
    assert.ok(p.ok && p.v.bytes > 1000);
    fs.copyFileSync(p.v.arquivo, path.join(EVID, 'navegador-5-example-com.png'));
    t.diagnostic('example.com: abrir ' + r.v.ms + ' ms · ' + x.v.rede.length + ' pedidos · clone ' + c.v.arquivos + ' arquivos (' + c.v.faltaram.length + ' faltaram) · print ' + p.v.largura + '×' + p.v.altura);
  });
});
