/* babel-coop · e2e da aba do navegador e do Raio-X na tela (NAV-UI · interface/navegador-real.js)
   Uma Estação Electron de verdade, escondida (HTTP 4940, UDP 41440), e um site de teste servido aqui mesmo (HTTP 4941):
   formulário com senha, CSS externo, fonte woff2, imagem, fetch para uma API, console.log/aviso/erro e um botão que muda o DOM.
   O agente é dirigido pelo módulo do processo principal (navegador/navegador.js, o mesmo que o conector coop usa):
   ele abre o site ANTES da aba existir, e a tela tem de abrir "Navegador · Aurora", registrar o webview e mostrar tudo.
   Nada de Google Chrome: o Playwright aqui só abre o Electron do app.
   Uso: cd app && node --test testes/e2e/navegador-ui.test.js      (BABEL_COOP_VER=1 mostra a janela)
   Prints e medidas: .deus/terminal-ao-vivo/evidencias/navegador-ui/
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { abrirEstacao, APP } = require('./estacao');

const PORTA = 4940, PORTA_SITE = 4941, DESCOBERTA = 41440;
const SITE = 'http://localhost:' + PORTA_SITE;
const PASTA_SITE = 'localhost_' + PORTA_SITE; /* o nome que navegador/clonar.js dá à pasta do clone */
const EVID = process.env.BABEL_TESTE_EVIDENCIAS ? path.join(process.env.BABEL_TESTE_EVIDENCIAS, 'navegador-ui') : path.join(APP, '..', '.deus', 'terminal-ao-vivo', 'evidencias', 'navegador-ui');
const AGENTE = 'aurora';
const esperarMs = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- uma fonte WOFF2 de verdade (TTF do sistema embrulhado em WOFF2 sem transformação) ---------- */
const TAGS = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix'];
function base128(n) { const b = []; do { b.unshift(n & 0x7f); n = Math.floor(n / 128); } while (n > 0); for (let i = 0; i < b.length - 1; i++) b[i] |= 0x80; return Buffer.from(b); }
function ttfParaWoff2(ttf) {
  const n = ttf.readUInt16BE(4), tabelas = [];
  for (let i = 0; i < n; i++) { const o = 12 + i * 16; tabelas.push({ tag: ttf.toString('latin1', o, o + 4), offset: ttf.readUInt32BE(o + 8), length: ttf.readUInt32BE(o + 12) }); }
  tabelas.sort((a, b) => (a.tag < b.tag ? -1 : 1));
  const li = tabelas.findIndex((t) => t.tag === 'loca');
  if (li !== -1) { const loca = tabelas.splice(li, 1)[0]; tabelas.splice(tabelas.findIndex((t) => t.tag === 'glyf') + 1, 0, loca); }
  const dir = [], dados = [];
  for (const t of tabelas) {
    const k = TAGS.indexOf(t.tag);
    dir.push(Buffer.from([(k === -1 ? 63 : k) | ((t.tag === 'glyf' || t.tag === 'loca' ? 3 : 0) << 6)]));
    if (k === -1) dir.push(Buffer.from(t.tag, 'latin1'));
    dir.push(base128(t.length));
    dados.push(ttf.subarray(t.offset, t.offset + t.length));
  }
  const comp = zlib.brotliCompressSync(Buffer.concat(dados), { params: { [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_FONT } });
  const diretorio = Buffer.concat(dir);
  const totalSfnt = 12 + 16 * n + tabelas.reduce((s, t) => s + ((t.length + 3) & ~3), 0);
  const pad = (4 - ((48 + diretorio.length + comp.length) % 4)) % 4;
  const h = Buffer.alloc(48);
  h.write('wOF2', 0, 'latin1'); h.writeUInt32BE(ttf.readUInt32BE(0), 4); h.writeUInt32BE(48 + diretorio.length + comp.length + pad, 8);
  h.writeUInt16BE(n, 12); h.writeUInt32BE(totalSfnt, 16); h.writeUInt32BE(comp.length, 20); h.writeUInt16BE(1, 24);
  return Buffer.concat([h, diretorio, comp, Buffer.alloc(pad)]);
}
const FONTES_DO_SISTEMA = ['/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf', '/System/Library/Fonts/Monaco.ttf', '/System/Library/Fonts/Geneva.ttf', 'C:\\Windows\\Fonts\\arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'];
function fonteWoff2() { for (const f of FONTES_DO_SISTEMA) { try { return ttfParaWoff2(fs.readFileSync(f)); } catch (e) { /* tenta a próxima */ } } return null; }
/* PNG 48×48 de verdade (azul-petróleo), montado aqui: assinatura, IHDR, IDAT (zlib) e IEND com CRC */
function criarPng(l, a, rgb) {
  const pedaco = (tipo, dados) => { const t = Buffer.from(tipo, 'latin1'), c = Buffer.alloc(4), n = Buffer.alloc(4); n.writeUInt32BE(dados.length); c.writeUInt32BE(zlib.crc32(Buffer.concat([t, dados])) >>> 0); return Buffer.concat([n, t, dados, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(l, 0); ihdr.writeUInt32BE(a, 4); ihdr[8] = 8; ihdr[9] = 2;
  const linha = Buffer.concat([Buffer.from([0]), Buffer.concat(Array.from({ length: l }, () => Buffer.from(rgb)))]);
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), pedaco('IHDR', ihdr), pedaco('IDAT', zlib.deflateSync(Buffer.concat(Array.from({ length: a }, () => linha)))), pedaco('IEND', Buffer.alloc(0))]);
}
const PNG = criarPng(48, 48, [14, 165, 164]);

/* ---------- o site de teste ---------- */
const HTML = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Clínica Vida · teste</title>
<link rel="stylesheet" href="/css/estilo.css"></head>
<body>
<header class="topo"><img id="logo" src="/img/logo.png" alt="Logo da Clínica Vida" width="48" height="48"><nav><a href="#planos" id="link-planos">Planos</a> <a href="#cadastro">Cadastro de fornecedor</a></nav></header>
<main>
<section id="hero"><h1>Atendimento que cuida do seu paciente</h1><p class="sub">A Clínica Vida atende em Campinas há 12 anos.</p><button id="mais" type="button">Mostrar mais um plano</button></section>
<section id="planos"><h2>Planos</h2><ul id="lista-planos"></ul></section>
<section id="cadastro"><h2>Cadastro de fornecedor</h2>
<form id="form-cadastro" onsubmit="return false"><label for="nome">Nome da empresa</label><input id="nome" name="nome" placeholder="Sua empresa">
<label for="email">E-mail</label><input id="email" name="email" type="email"><label for="senha">Senha</label><input id="senha" name="senha" type="password">
<button id="enviar" type="submit">Enviar cadastro</button></form></section>
<blockquote class="dep">Marquei pelo WhatsApp às 23h e às 8h já tinha a confirmação.</blockquote>
</main>
<footer><p>clinicavida.teste · Campinas, SP</p></footer>
<script src="/js/app.js"></script>
</body></html>`;
const HTML2 = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Página dois</title></head><body><h1>Página dois</h1><p>A pessoa chegou aqui pela barra de endereço.</p></body></html>';
const CSS = `@font-face { font-family: 'Teste Sans'; src: url('../fontes/teste.woff2') format('woff2'); font-display: block; }
body { margin: 0; background: #ffffff; color: #0f172a; font-family: 'Teste Sans', Georgia, serif; }
.topo { display: flex; gap: 16px; align-items: center; padding: 12px 24px; border-bottom: 1px solid #e5e7eb; }
h1 { font-size: 34px; color: #0f172a; margin: 24px; }
#hero .sub { margin: 0 24px 12px; color: #475569; }
button { background: #0ea5a4; color: #ffffff; border: 0; border-radius: 8px; padding: 10px 18px; margin: 0 24px; }
#form-cadastro { display: grid; gap: 8px; max-width: 420px; margin: 0 24px; }
#form-cadastro input { border: 1px solid #cbd5e1; padding: 8px 10px; }
.dep { margin: 24px; padding: 16px; border-left: 4px solid #0ea5a4; font-style: italic; }
@media (min-width: 200px) { footer { padding: 16px 24px; color: #94a3b8; } }`;
const JS = `console.log('coop-teste: log');
console.warn('coop-teste: aviso');
console.error('coop-teste: erro');
fetch('/api/planos.json').then(function (r) { return r.json(); }).then(function (d) {
  document.getElementById('lista-planos').innerHTML = d.planos.map(function (p) { return '<li>' + p.nome + ' · R$ ' + p.preco + '</li>'; }).join('');
  console.log('coop-teste: planos ' + d.planos.length);
});
document.getElementById('mais').addEventListener('click', function () {
  var li = document.createElement('li'); li.textContent = 'Plano empresa · sob consulta'; document.getElementById('lista-planos').appendChild(li);
});`;
const PLANOS = JSON.stringify({ planos: [{ nome: 'Consulta avulsa', preco: 180 }, { nome: 'Plano família', preco: 390 }] });

function subirSite() {
  const woff2 = fonteWoff2();
  const rotas = {
    '/': ['text/html; charset=utf-8', HTML], '/pagina2.html': ['text/html; charset=utf-8', HTML2], '/css/estilo.css': ['text/css; charset=utf-8', CSS], '/js/app.js': ['text/javascript; charset=utf-8', JS],
    '/api/planos.json': ['application/json', PLANOS], '/img/logo.png': ['image/png', PNG]
  };
  if (woff2) rotas['/fontes/teste.woff2'] = ['font/woff2', woff2];
  const srv = http.createServer((req, res) => {
    const r = rotas[req.url.split('?')[0]];
    if (!r) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('não achei'); }
    res.writeHead(200, { 'Content-Type': r[0], 'Cache-Control': 'no-store' });
    res.end(r[1]);
  });
  return new Promise((ok) => srv.listen(PORTA_SITE, '127.0.0.1', () => ok({ srv, woff2: !!woff2 })));
}

/* ---------- estado do teste ---------- */
let est, page, app, site, pasta;
const medidas = { inicio: new Date().toISOString() };
const prints = [];

async function ate(fn, { ms = 15000, passo = 80, rotulo = 'condição' } = {}) {
  const fim = Date.now() + ms;
  let ultimo;
  while (Date.now() < fim) {
    try { ultimo = await fn(); if (ultimo) return ultimo; } catch (e) { ultimo = e; }
    await esperarMs(passo);
  }
  throw new Error('tempo esgotado esperando: ' + rotulo + (ultimo instanceof Error ? ' (' + ultimo.message + ')' : ''));
}
const naTela = (fn, arg) => page.evaluate(fn, arg);
const noPrincipal = (fn, arg) => app.evaluate(fn, arg);
async function foto(nome) {
  const f = path.join(EVID, nome + '.jpg');
  await page.screenshot({ path: f, type: 'jpeg', quality: 82 }); /* escala do aparelho (com scale:'css' o webview sai pela metade); JPEG = leve no disco */
  prints.push(nome + '.jpg');
}
const secao = '.navr-secao[data-agente="' + AGENTE + '"]';
async function textoDe(sel) { return naTela((s) => { const e = document.querySelector(s); return e ? e.textContent : null; }, sel); }
async function clicar(sel) { await page.locator(sel).first().click(); }
async function passos() { return naTela((a) => (window.BC.navegadorReal.sessao(a) || { passos: [] }).passos.map((p) => p.texto), AGENTE); }
async function abaRaio(nome) { await clicar(secao + ' .navr-rx-abas button[data-aba="' + nome + '"]'); }

describe('navegador na tela (NAV-UI): aba do agente, Assumir/Devolver, passos, Raio-X e clone', { timeout: 240000 }, () => {
  before(async () => {
    fs.mkdirSync(EVID, { recursive: true });
    site = await subirSite();
    medidas.fonteWoff2 = site.woff2;
    est = await abrirEstacao({ nome: 'navui', porta: PORTA, descoberta: DESCOBERTA });
    page = est.page; app = est.app;
    const eu = await est.api('/api/fundar', { nome: 'Theus' });
    pasta = path.join(est.raiz, eu.id);
    const errosDaTela = medidas.errosDaTela = [];
    page.on('pageerror', (e) => errosDaTela.push('pageerror: ' + (e.stack || e.message)));
    page.on('console', (m) => { if (m.type() === 'error' || /navegador-real/.test(m.text())) errosDaTela.push(m.type() + ': ' + m.text()); });
    await page.reload();
    await ate(() => naTela(() => !!(window.BC && window.BC.real && window.BC.real.eu() && window.BC.real.eu().pronto && window.BC.estacao)), { rotulo: 'Estação pronta' });
    /* enquanto a lista INJETAR do servidor não traz esta peça, o teste injeta pela mesma rota /coop/ */
    const injetado = await naTela(() => !!window.BC.navegadorReal);
    medidas.injetadoPeloServidor = injetado;
    if (!injetado) {
      await page.addStyleTag({ url: '/coop/navegador-real.css' });
      await page.addScriptTag({ url: '/coop/navegador-real.js' });
    }
    await ate(() => naTela(() => !!window.BC.navegadorReal), { rotulo: 'BC.navegadorReal' });
    await naTela(() => { window.__eventosNav = []; window.BC.navegadorReal.ouvir((e) => window.__eventosNav.push(e)); });
  });

  after(async () => {
    medidas.fim = new Date().toISOString();
    medidas.prints = prints;
    try { fs.writeFileSync(path.join(EVID, 'medidas.json'), JSON.stringify(medidas, null, 2)); } catch (e) { /* segue */ }
    if (est) await est.fechar().catch(() => {});
    if (site) await new Promise((ok) => site.srv.close(ok));
    if (est && est.raiz && /babel-e2e-navui-/.test(est.raiz)) fs.rmSync(est.raiz, { recursive: true, force: true }); /* só a raiz temporária deste teste */
  });

  it('está no app: webview ligado e o módulo do processo principal presente', async () => {
    const r = await naTela(() => ({ webview: window.BC.navegadorReal.disponivel(), app: window.BC.navegadorReal.noApp(), modulo: window.BC.navegadorReal.comModulo() }));
    medidas.ambiente = r;
    assert.equal(r.app, true, 'window.coopElectron existe');
    assert.equal(r.webview, true, 'o <webview> está ligado (webviewTag)');
    assert.equal(r.modulo, true, 'coopElectron.navegador existe (preload do NAV-MAIN)');
  });

  it('o agente abre um site antes da aba existir: a aba "Navegador · Aurora" nasce, o webview registra e a página carrega', async () => {
    const t0 = Date.now();
    const res = await noPrincipal(async (_e, a) => global.babelCoop.navegadores.abrir({ id: a.agente, nome: 'Aurora' }, a.url), { agente: AGENTE, url: SITE + '/' });
    medidas.abrirAntesDaAba = { ms: Date.now() - t0, doModulo: res };
    assert.equal(res.status, 200);
    assert.match(res.titulo, /Clínica Vida/);
    const aba = await naTela((a) => { const t = window.BC.estacao.abaAtual(); return { id: t.id, tipo: t.tipo, titulo: t.titulo, ref: t.ref }; }, AGENTE);
    assert.deepEqual(aba, { id: 'nav:' + AGENTE, tipo: 'navegador', titulo: 'Navegador · Aurora', ref: AGENTE });
    const s = await naTela((a) => window.BC.navegadorReal.sessao(a), AGENTE);
    const noPrin = await noPrincipal((_e, a) => global.babelCoop.navegadores.estado(a), AGENTE);
    medidas.registro = { webContentsId: s.webContentsId, registrado: s.registrado, principal: { registrado: noPrin.registrado, webContentsId: noPrin.webContentsId, controlador: noPrin.controlador } };
    assert.equal(s.registrado, true);
    assert.equal(noPrin.webContentsId, s.webContentsId, 'o webview da tela é o que o processo principal controla');
    await ate(async () => (await naTela((sel) => document.querySelector(sel + ' .navr-url').value, secao)) === SITE + '/', { rotulo: 'barra de endereço com a URL' });
    const barra = await naTela((sel) => { const u = document.querySelector(sel + ' .navr-url'); const c = document.getElementById('navr-camada'); return { ro: u.readOnly, faixa: document.querySelector(sel + ' .navr-faixa-texto').textContent, visivel: c.classList.contains('visivel'), ativa: document.querySelector(sel).classList.contains('ativa'), quem: document.querySelector(sel).dataset.quem }; }, secao);
    assert.equal(barra.ro, true, 'barra só leitura enquanto o agente controla');
    assert.equal(barra.faixa, 'controlado por Aurora · você vê tudo');
    assert.ok(barra.visivel && barra.ativa);
    const ps = await passos();
    assert.ok(ps.some((p) => /^abrindo localhost:4941/.test(p)), 'passo "abrindo…" na lista: ' + ps.join(' | '));
    assert.ok(ps.some((p) => /^abriu Clínica Vida/.test(p)), 'passo "abriu…" na lista');
    await esperarMs(400);
    await foto('01-aba-do-agente');
  });

  it('HUD do Babel OS só com o agente no controle: moldura ciano, scanlines ≤ 5 %, cantos e faixa de vidro', async () => {
    const hud = await naTela((sel) => {
      const p = document.querySelector(sel + ' .navr-pagina'), a = getComputedStyle(p, '::after'), f = getComputedStyle(document.querySelector(sel + ' .navr-faixa'));
      const canto = getComputedStyle(document.querySelector(sel + ' .navr-canto'));
      return { opacidade: a.opacity, borda: a.borderTopColor, fundo: a.backgroundImage, canto: +canto.opacity, vidro: f.backdropFilter || f.webkitBackdropFilter, bordaFaixa: f.borderTopColor };
    }, secao);
    medidas.hud = hud;
    assert.equal(hud.opacidade, '1');
    assert.match(hud.borda, /rgba\(63, 227, 255/);
    assert.match(hud.fundo, /repeating-linear-gradient\(.*rgba\(42, 213, 229, 0\.035\)/);
    assert.ok(hud.canto >= 0.5);
    assert.match(hud.vidro, /blur\(10px\)/);
    assert.match(hud.bordaFaixa, /rgba\(63, 227, 255, 0\.22\)/);
  });

  it('passos reais do agente (clicar e digitar pelo CDP) aparecem na lista com luz, e a página muda de verdade', async () => {
    const antes = (await passos()).length;
    await noPrincipal(async (_e, a) => { const n = global.babelCoop.navegadores; await n.clicar(a, '#mais'); await n.digitar(a, '#nome', 'Babel Atendimento'); }, AGENTE);
    const ps = await passos();
    medidas.passosDoAgente = ps.slice(antes);
    assert.ok(ps.slice(antes).some((p) => /^clicando em/.test(p)), 'clicando: ' + ps.slice(antes).join(' | '));
    assert.ok(ps.slice(antes).some((p) => /^preencheu/.test(p)), 'preencheu');
    const luz = await naTela((sel) => { const li = document.querySelector(sel + ' .navr-passo.atual'); return { luz: +(li.style.getPropertyValue('--luz') || 0), faixa: +(document.querySelector(sel + ' .navr-faixa').style.getPropertyValue('--luz') || 0) }; }, secao);
    medidas.luzDoPasso = luz;
    assert.ok(luz.luz > 0 && luz.faixa > 0, 'o passo e a faixa acendem (organismo): ' + JSON.stringify(luz));
    const pagina = await naTela((a) => window.BC.navegadorReal.webview(a).executeJavaScript('({itens: document.querySelectorAll("#lista-planos li").length, nome: document.getElementById("nome").value})'), AGENTE);
    assert.equal(pagina.nome, 'Babel Atendimento');
    assert.ok(pagina.itens >= 3, 'o clique do agente acrescentou um plano');
  });

  it('senha: o agente para, a faixa fica âmbar "sua vez" e a página fica livre para a pessoa; Devolver volta ao agente', async () => {
    const r = await noPrincipal(async (_e, a) => global.babelCoop.navegadores.digitar(a, '#senha', 'nao-pode'), AGENTE);
    assert.equal(r.recusado, 'senha');
    await ate(async () => (await naTela((sel) => document.querySelector(sel).dataset.quem, secao)) === 'sua-vez', { rotulo: 'estado sua-vez' });
    const v = await naTela((sel) => ({ faixa: document.querySelector(sel + ' .navr-faixa-texto').textContent, escudo: getComputedStyle(document.querySelector(sel + ' .navr-escudo')).display, botao: document.querySelector(sel + ' .navr-assumir').textContent }), secao);
    medidas.suaVez = v;
    assert.match(v.faixa, /^sua vez: digite a senha em Senha/);
    assert.equal(v.escudo, 'none', 'o escudo sai: a pessoa digita na página');
    assert.equal(v.botao, 'Devolver para Aurora');
    await foto('02-sua-vez-senha');
    await clicar(secao + ' .navr-assumir');
    await ate(async () => (await naTela((sel) => document.querySelector(sel).dataset.quem, secao)) === 'agente', { rotulo: 'de volta ao agente' });
    const est2 = await noPrincipal((_e, a) => global.babelCoop.navegadores.estado(a), AGENTE);
    assert.equal(est2.controlador, 'agente');
  });

  it('Assumir: a pessoa fica no controle, o agente é recusado, a barra vira editável e navega; Devolver devolve', async () => {
    await clicar(secao + ' .navr-assumir');
    await ate(async () => (await noPrincipal((_e, a) => global.babelCoop.navegadores.estado(a).controlador, AGENTE)) === 'pessoa', { rotulo: 'controlador pessoa no processo principal' });
    await ate(() => naTela((sel) => getComputedStyle(document.querySelector(sel + ' .navr-pagina'), '::after').opacity === '0', secao), { ms: 2000, rotulo: 'HUD apaga (transição de 240 ms)' });
    const v = await naTela((sel) => ({ faixa: document.querySelector(sel + ' .navr-faixa-texto').textContent, ro: document.querySelector(sel + ' .navr-url').readOnly, escudo: getComputedStyle(document.querySelector(sel + ' .navr-escudo')).display, hud: getComputedStyle(document.querySelector(sel + ' .navr-pagina'), '::after').opacity }), secao);
    medidas.assumido = v;
    assert.equal(v.faixa, 'você está no controle');
    assert.equal(v.ro, false);
    assert.equal(v.escudo, 'none');
    assert.equal(v.hud, '0', 'sem HUD quando a pessoa controla (superfície calma)');
    const recusa = await noPrincipal(async (_e, a) => { try { await global.babelCoop.navegadores.clicar(a, '#mais'); return 'clicou'; } catch (e) { return e.message; } }, AGENTE);
    assert.match(recusa, /assumiu o navegador/);
    const url = page.locator(secao + ' .navr-url');
    await url.fill(SITE + '/pagina2.html');
    await url.press('Enter');
    await ate(async () => (await naTela((a) => window.BC.navegadorReal.sessao(a).titulo, AGENTE)) === 'Página dois', { rotulo: 'a pessoa navegou pela barra' });
    await foto('03-voce-no-controle');
    await clicar(secao + ' .navr-assumir');
    await ate(async () => (await noPrincipal((_e, a) => global.babelCoop.navegadores.estado(a).controlador, AGENTE)) === 'agente', { rotulo: 'devolvido' });
    assert.equal(await textoDe(secao + ' .navr-faixa-texto'), 'controlado por Aurora · você vê tudo');
    await noPrincipal(async (_e, a) => global.babelCoop.navegadores.abrir(a.agente, a.url), { agente: AGENTE, url: SITE + '/' });
    await ate(async () => (await naTela((a) => window.BC.navegadorReal.sessao(a).titulo, AGENTE)) === 'Clínica Vida · teste', { rotulo: 'o agente voltou ao site' });
    await ate(() => naTela((a) => window.BC.navegadorReal.webview(a).executeJavaScript('document.querySelectorAll("#lista-planos li").length'), AGENTE).then((n) => n >= 2), { rotulo: 'planos carregados pelo fetch' });
  });

  it('Raio-X · HTML: DOM vivo em árvore, busca, revelar, copiar bloco e o nó que muda acende', async () => {
    const t0 = Date.now();
    await clicar(secao + ' .navr-raio-bt');
    await ate(() => naTela((sel) => document.querySelectorAll(sel + ' .navr-rx-arvore .navr-no').length > 5, secao), { rotulo: 'árvore do DOM' });
    medidas.raioxHtmlMs = Date.now() - t0;
    const tags = await naTela((sel) => Array.from(document.querySelectorAll(sel + ' .navr-rx-arvore .navr-no .navr-no-tag')).map((e) => e.textContent).slice(0, 40), secao);
    assert.ok(tags.includes('<html') && tags.includes('<head') && tags.includes('<body'), 'html, head e body na árvore');
    assert.ok(tags.includes('<main'), 'o body abre sozinho');
    /* busca por texto */
    await page.locator(secao + ' .navr-rx-busca').fill('cadastro');
    await ate(() => naTela((sel) => Array.from(document.querySelectorAll(sel + ' .navr-rx-res code')).some((c) => c.textContent === 'form#form-cadastro'), secao), { rotulo: 'resultado form#form-cadastro' });
    const nRes = await naTela((sel) => document.querySelectorAll(sel + ' .navr-rx-res').length, secao);
    medidas.buscaCadastro = nRes;
    await page.locator(secao + ' .navr-rx-res', { hasText: 'form#form-cadastro' }).first().click();
    await ate(() => naTela((sel) => { const l = document.querySelector(sel + ' .navr-no.sel'); return l && /<form/.test(l.textContent) && /form-cadastro/.test(l.textContent); }, secao), { rotulo: 'form revelado e selecionado' });
    await ate(async () => /form#form-cadastro/.test(await textoDe(secao + ' .navr-rx-card')), { rotulo: 'cartão do selecionado' });
    /* busca por seletor CSS */
    await page.locator(secao + ' .navr-rx-busca').fill('#form-cadastro input');
    await ate(() => naTela((sel) => document.querySelectorAll(sel + ' .navr-rx-res').length === 3, secao), { rotulo: '3 inputs pelo seletor' });
    await page.locator(secao + ' .navr-rx-busca').fill('');
    /* copiar bloco (outerHTML do form) */
    await page.locator(secao + ' .navr-rx-card .navr-mini-bt', { hasText: 'copiar bloco' }).click();
    const copiado = await ate(() => naTela(() => window.BC.navegadorReal.ultimaCopia), { rotulo: 'bloco copiado' });
    assert.match(copiado, /^<form id="form-cadastro"/);
    assert.match(copiado, /<\/form>$/);
    const area = await ate(() => noPrincipal(({ clipboard }) => clipboard.readText()).then((t) => (t === copiado ? t : null)), { ms: 4000, rotulo: 'bloco na área de transferência do sistema' }).catch(() => noPrincipal(({ clipboard }) => clipboard.readText()));
    medidas.areaDeTransferencia = { igual: area === copiado, bytes: copiado.length };
    assert.equal(area, copiado, 'o bloco está na área de transferência do sistema');
    await foto('04-raiox-html');
    /* DOM vivo: abre a <ul> dos planos, o agente clica "mais" e a linha acende */
    await page.locator(secao + ' .navr-rx-busca').fill('lista-planos');
    await ate(() => naTela((sel) => Array.from(document.querySelectorAll(sel + ' .navr-rx-res code')).some((c) => c.textContent === 'ul#lista-planos'), secao), { rotulo: 'resultado ul#lista-planos' });
    await page.locator(secao + ' .navr-rx-res', { hasText: 'ul#lista-planos' }).first().click();
    await ate(() => naTela((sel) => { const l = document.querySelector(sel + ' .navr-no.sel'); return l && /lista-planos/.test(l.textContent); }, secao), { rotulo: 'ul selecionada' });
    await page.locator(secao + ' .navr-rx-busca').fill('');
    await page.locator(secao + ' .navr-no.sel .navr-no-seta').click();
    const antes = await ate(() => naTela((sel) => { const l = Array.from(document.querySelectorAll(sel + ' .navr-rx-arvore .navr-no .navr-no-txt')).filter((e) => /R\$|sob consulta/.test(e.textContent)); return l.length || null; }, secao), { rotulo: 'itens da lista na árvore' });
    const t1 = Date.now();
    await noPrincipal(async (_e, a) => global.babelCoop.navegadores.clicar(a, '#mais'), AGENTE);
    const depois = await ate(() => naTela((sel) => { const l = Array.from(document.querySelectorAll(sel + ' .navr-rx-arvore .navr-no .navr-no-txt')).filter((e) => /R\$|sob consulta/.test(e.textContent)); return l.length; }, secao).then((n) => (n > antes ? n : null)), { ms: 8000, rotulo: 'item novo na árvore (DOM vivo)' });
    medidas.domVivo = { ms: Date.now() - t1, antes, depois };
    const aceso = await naTela((sel) => { const l = document.querySelector(sel + ' .navr-no.mudou'); return l ? +(l.style.getPropertyValue('--luz') || 0) : 0; }, secao);
    medidas.domVivo.luz = aceso;
    assert.ok(aceso > 0, 'a linha que mudou acende');
  });

  it('Raio-X · CSS: estilos calculados, regras pelo CDP (com a folha e a linha), fontes e cores da página', async () => {
    await page.locator(secao + ' .navr-rx-busca').fill('h1');
    await ate(() => naTela((sel) => Array.from(document.querySelectorAll(sel + ' .navr-rx-res code')).some((c) => c.textContent === 'h1'), secao), { rotulo: 'resultado h1' });
    await page.locator(secao + ' .navr-rx-res', { hasText: /^h1/ }).first().click();
    await ate(async () => /h1/.test(await textoDe(secao + ' .navr-rx-card-l1 code') || ''), { rotulo: 'h1 selecionado' });
    const t0 = Date.now();
    await abaRaio('css');
    await ate(async () => /Regras que casam · \d+ · lidas pelo CDP/.test(await textoDe(secao + ' .navr-rx-corpo') || ''), { rotulo: 'regras pelo CDP' });
    medidas.raioxCssMs = Date.now() - t0;
    const css = await naTela((sel) => {
      const c = document.querySelector(sel + ' .navr-rx-corpo');
      return {
        props: Array.from(c.querySelectorAll('.navr-css-k')).map((e) => e.textContent),
        regras: Array.from(c.querySelectorAll('.navr-css-regra b')).map((e) => e.textContent),
        origens: Array.from(c.querySelectorAll('.navr-css-regra small')).map((e) => e.textContent),
        fontes: Array.from(c.querySelectorAll('.navr-css-fonte b')).map((e) => e.textContent),
        cores: Array.from(c.querySelectorAll('.navr-cor code')).map((e) => e.textContent)
      };
    }, secao);
    medidas.css = { regras: css.regras, origens: css.origens.slice(0, 6), fontes: css.fontes, cores: css.cores.slice(0, 12) };
    assert.ok(css.props.includes('font-size') && css.props.includes('color'));
    assert.ok(css.regras.includes('h1'), 'a regra "h1" de estilo.css: ' + css.regras.join(', '));
    assert.ok(css.origens.some((o) => /estilo\.css:\d+/.test(o)), 'folha e linha da regra');
    assert.ok(css.fontes.includes('Teste Sans'), 'a família da página');
    assert.ok(css.cores.includes('#0ea5a4') && css.cores.includes('#0f172a'), 'as cores da página');
    if (medidas.fonteWoff2) assert.ok(await naTela((sel) => /fonte da página/.test(document.querySelector(sel + ' .navr-rx-corpo').textContent), secao), 'o CDP diz que o h1 é desenhado com a fonte da página');
    await foto('05-raiox-css');
  });

  it('Raio-X · Copy: textos em ordem por seção e "Exportar Markdown" grava Clones/<site>/copy.md', async () => {
    await abaRaio('copy');
    await ate(() => naTela((sel) => document.querySelectorAll(sel + ' .navr-copy-it').length > 5, secao), { rotulo: 'itens de copy' });
    const itens = await naTela((sel) => Array.from(document.querySelectorAll(sel + ' .navr-copy-it')).map((e) => e.querySelector('small').textContent + ': ' + e.querySelector('span').textContent), secao);
    medidas.copy = itens.slice(0, 14);
    const iH1 = itens.findIndex((x) => /^título h1: Atendimento que cuida/.test(x));
    const iDep = itens.findIndex((x) => /^citação: Marquei pelo WhatsApp/.test(x));
    assert.ok(iH1 >= 0 && iDep > iH1, 'em ordem: título antes do depoimento');
    assert.ok(itens.includes('botão: Enviar cadastro'));
    await page.locator(secao + ' .navr-rx-corpo .botao', { hasText: 'Exportar Markdown' }).click();
    const arq = path.join(pasta, 'Clones', PASTA_SITE, 'copy.md');
    await ate(() => fs.existsSync(arq), { rotulo: 'copy.md no disco' });
    const md = fs.readFileSync(arq, 'utf8');
    medidas.copyMd = { bytes: md.length, inicio: md.slice(0, 240) };
    assert.match(md, /^# Copy de localhost_4941/);
    assert.match(md, /### Atendimento que cuida do seu paciente/);
    assert.match(md, /- \[botão\] Enviar cadastro/);
    assert.match(md, /> Marquei pelo WhatsApp/);
    await foto('06-raiox-copy');
  });

  it('Raio-X · Rede: os pedidos de verdade (pelo CDP), com status, tipo e a resposta da API', async () => {
    await abaRaio('rede');
    await ate(async () => /processo principal \(CDP\)/.test(await textoDe(secao + ' .navr-rx-corpo') || ''), { rotulo: 'rede pelo CDP' });
    const linhas = await naTela((sel) => Array.from(document.querySelectorAll(sel + ' .navr-req')).map((b) => b.querySelector('b').textContent + ' ' + b.querySelector('i').textContent + ' ' + b.querySelector('.navr-req-nome').textContent), secao);
    medidas.rede = linhas;
    ['GET 200 /', 'GET 200 /css/estilo.css', 'GET 200 /js/app.js', 'GET 200 /api/planos.json', 'GET 200 /img/logo.png'].forEach((l) => assert.ok(linhas.includes(l), l + ' em ' + linhas.join(' | ')));
    if (medidas.fonteWoff2) assert.ok(linhas.includes('GET 200 /fontes/teste.woff2'));
    await page.locator(secao + ' .navr-req', { hasText: '/api/planos.json' }).first().click();
    await page.locator(secao + ' .navr-req-det .navr-mini-bt', { hasText: 'ver a resposta' }).click();
    await ate(async () => /"planos"/.test(await textoDe(secao + ' .navr-resp') || ''), { rotulo: 'corpo da resposta' });
    await foto('07-raiox-rede');
  });

  it('Raio-X · Console: log, aviso e erro da página, ao vivo, com filtro', async () => {
    await abaRaio('console');
    const logs = await ate(() => naTela((sel) => { const l = Array.from(document.querySelectorAll(sel + ' .navr-log')).map((e) => e.className.replace('navr-log ', '') + ' ' + e.querySelector('span').textContent); return l.length >= 3 ? l : null; }, secao), { rotulo: 'mensagens do console' });
    medidas.console = logs;
    assert.ok(logs.includes('n-log coop-teste: log'));
    assert.ok(logs.includes('n-aviso coop-teste: aviso'));
    assert.ok(logs.includes('n-erro coop-teste: erro'));
    assert.equal(logs.filter((l) => l === 'n-log coop-teste: log').length, 1, 'documento novo, console novo: sem repetir a visita anterior');
    assert.ok(!logs.some((l) => /Electron Security Warning/.test(l)), 'o aviso do próprio Electron não é da página');
    await page.locator(secao + ' .navr-console-filtros button', { hasText: 'Erros' }).click();
    const soErros = await naTela((sel) => Array.from(document.querySelectorAll(sel + ' .navr-log')).every((e) => e.classList.contains('n-erro')), secao);
    assert.equal(soErros, true);
    await foto('08-raiox-console');
    await page.locator(secao + ' .navr-console-filtros button', { hasText: 'Tudo' }).click();
  });

  it('Selecionar elemento: o modo inspeção do Chromium, a pessoa clica no título e o Raio-X mostra o que é', async () => {
    await abaRaio('html');
    await clicar(secao + ' .navr-rx-sel');
    await ate(async () => (await noPrincipal((_e, a) => global.babelCoop.navegadores.estado(a).selecionando, AGENTE)) === true, { rotulo: 'modo inspeção ligado' });
    const escudo = await naTela((sel) => getComputedStyle(document.querySelector(sel + ' .navr-escudo')).display, secao);
    assert.equal(escudo, 'none', 'o escudo sai enquanto a pessoa aponta');
    /* onde está o <p class="sub"> na tela: retângulo do webview + retângulo do elemento dentro da página */
    const ponto = await naTela(async (a) => {
      const wv = window.BC.navegadorReal.webview(a), r = wv.getBoundingClientRect();
      const d = await wv.executeJavaScript('(function(){var b=document.querySelector("#hero .sub").getBoundingClientRect();return {x:b.left+Math.min(40,b.width/2),y:b.top+b.height/2}})()');
      return { x: Math.round(r.left + d.x), y: Math.round(r.top + d.y) };
    }, AGENTE);
    const t0 = Date.now();
    await page.mouse.move(ponto.x - 20, ponto.y);
    await page.mouse.move(ponto.x, ponto.y, { steps: 3 });
    await page.mouse.click(ponto.x, ponto.y);
    let via = 'mouse da tela (Playwright → Electron)';
    const ok = await ate(async () => /p\.sub/.test(await textoDe(secao + ' .navr-rx-card-l1 code') || ''), { ms: 4000, rotulo: 'p.sub escolhido' }).catch(() => null);
    if (!ok) {
      via = 'sendInputEvent no webContents do webview';
      const d = await naTela(async (a) => window.BC.navegadorReal.webview(a).executeJavaScript('(function(){var b=document.querySelector("#hero .sub").getBoundingClientRect();return {x:Math.round(b.left+10),y:Math.round(b.top+b.height/2)}})()'), AGENTE);
      await noPrincipal(({ webContents }, a) => { const wc = webContents.fromId(a.id); ['mouseMove', 'mouseDown', 'mouseUp'].forEach((t) => wc.sendInputEvent({ type: t, x: a.x, y: a.y, button: 'left', clickCount: 1 })); }, { id: medidas.registro.webContentsId, x: d.x, y: d.y });
      await ate(async () => /p\.sub/.test(await textoDe(secao + ' .navr-rx-card-l1 code') || ''), { ms: 6000, rotulo: 'p.sub escolhido (sendInputEvent)' });
    }
    medidas.selecionar = { via, ms: Date.now() - t0 };
    const sel = await naTela((s) => ({ card: document.querySelector(s + ' .navr-rx-card').textContent, linha: (document.querySelector(s + ' .navr-no.sel') || {}).textContent || '' }), secao);
    medidas.selecionar.card = sel.card.slice(0, 160);
    assert.match(sel.linha, /<p/);
    assert.match(sel.linha, /A Clínica Vida atende em Campinas/);
    const ps = await passos();
    assert.ok(ps.some((p) => /^elemento escolhido: /.test(p)), 'o passo do módulo principal');
    await foto('09-selecionar-elemento');
  });

  it('Clonar página: Clones/<site>/ com CSS, imagem e fonte, aberto como site editável (Site | Código | Editar na tela)', async () => {
    const t0 = Date.now();
    await page.locator(secao + ' .navr-rx-acoes .botao', { hasText: 'Clonar página' }).click();
    const chave = 'clone:Clones/' + PASTA_SITE;
    await ate(() => naTela((c) => window.BC.estacao.abaAtual().ref === c, chave), { ms: 30000, rotulo: 'aba do clone' });
    const cl = '.navr-clone.ativa';
    await ate(() => naTela((s) => { const f = document.querySelector(s + ' .navr-clone-site'); return f && /Atendimento que cuida/.test(f.srcdoc || ''); }, cl), { rotulo: 'o clone no iframe' });
    medidas.clone = { ms: Date.now() - t0 };
    const idx = path.join(pasta, 'Clones', PASTA_SITE, 'index.html');
    assert.ok(fs.existsSync(idx));
    assert.doesNotMatch(fs.readFileSync(idx, 'utf8'), /data-babel-coop-raiox|__babel-coop-cursor/, 'nada do Raio-X nem do cursor do agente entra no clone');
    const arquivos = [];
    (function andar(d) { fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) andar(f); else arquivos.push(path.relative(path.dirname(idx), f)); }); })(path.dirname(idx));
    medidas.clone.arquivos = arquivos;
    assert.ok(arquivos.some((f) => /\.css$/.test(f)) && arquivos.some((f) => /\.png$/.test(f)), 'CSS e imagem no clone: ' + arquivos.join(', '));
    const src = await naTela((s) => document.querySelector(s + ' .navr-clone-site').srcdoc, cl);
    const img = /<img[^>]+src="([^"]+)"/.exec(src);
    assert.ok(img && /\/api\/arquivo\?caminho=Clones%2Flocalhost_4941%2F/.test(img[1]), 'a imagem vem pelo servidor da Estação: ' + (img && img[1]));
    const r = await fetch(img[1].replace(/&amp;/g, '&'));
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type'), /image\/png/);
    medidas.clone.fonteEmbutida = /url\("data:font\/woff2;base64,/.test(src) || /url\("data:[^"]*;base64,/.test(src);
    if (medidas.fonteWoff2) assert.ok(medidas.clone.fonteEmbutida, 'a fonte do clone vai junto (data:)');
    assert.equal(await textoDe(cl + ' .navr-clone-caminho'), 'Clones/' + PASTA_SITE + '/index.html');
    await esperarMs(500);
    await foto('10-clone-site');
    /* Código: muda o título e salva */
    await page.locator(cl + ' .navr-clone-modos button', { hasText: 'Código' }).click();
    const cod = page.locator(cl + ' .navr-clone-codigo');
    const fonte = await cod.inputValue();
    assert.match(fonte, /<h1[^>]*>Atendimento que cuida do seu paciente<\/h1>/);
    await cod.fill(fonte.replace('Atendimento que cuida do seu paciente', 'Atendimento que cuida de verdade'));
    await page.locator(cl + ' .botao', { hasText: 'Salvar' }).click();
    await ate(() => /Atendimento que cuida de verdade/.test(fs.readFileSync(idx, 'utf8')), { rotulo: 'código salvo no disco' });
    await foto('11-clone-codigo');
    /* Editar na tela: escreve no site e salva */
    await page.locator(cl + ' .navr-clone-modos button', { hasText: 'Site' }).click();
    await page.locator(cl + ' .botao', { hasText: 'Editar na tela' }).click();
    await ate(() => naTela((s) => /designMode/.test(document.querySelector(s + ' .navr-clone-site').srcdoc), cl), { rotulo: 'modo edição' });
    await esperarMs(600);
    const quadro = page.frameLocator(cl + ' .navr-clone-site');
    await quadro.locator('h1').click({ position: { x: 6, y: 12 } });
    await page.keyboard.press('Home');
    await page.keyboard.type('EDITADO · ');
    await page.locator(cl + ' .botao', { hasText: 'Salvar' }).click();
    await ate(() => /EDITADO/.test(fs.readFileSync(idx, 'utf8')), { rotulo: 'edição na tela salva' });
    const salvo = fs.readFileSync(idx, 'utf8');
    medidas.clone.edicao = { h1: (/<h1[^>]*>([^<]*)<\/h1>/.exec(salvo) || [])[1], semUrlDoServidor: !/\/api\/arquivo\?caminho=/.test(salvo) };
    medidas.clone.edicao.trecho = (/<main>[\s\S]{0,260}/.exec(salvo) || [''])[0];
    assert.equal(medidas.clone.edicao.h1, 'EDITADO · Atendimento que cuida de verdade', medidas.clone.edicao.trecho);
    assert.ok(medidas.clone.edicao.semUrlDoServidor, 'o arquivo salvo guarda os caminhos originais do clone');
    await foto('12-clone-editado');
  });

  it('Clonar copy e Print inteiro pelo módulo principal (arquivos na pasta do clone)', async () => {
    await naTela((a) => window.BC.estacao.abrirAba({ id: 'nav:' + a, tipo: 'navegador', ref: a, titulo: 'Navegador · Aurora', atividade: 'terminais' }), AGENTE);
    await page.locator(secao + ' .navr-rx-acoes .botao', { hasText: 'Clonar copy' }).click();
    const arq = path.join(pasta, 'Clones', PASTA_SITE, 'copy.md');
    await ate(() => /<!-- copy de /.test(fs.readFileSync(arq, 'utf8')), { rotulo: 'copy.md do módulo' });
    await page.locator(secao + ' .navr-rx-acoes .botao', { hasText: 'Print inteiro' }).click();
    const png = await ate(() => fs.readdirSync(path.join(pasta, 'Clones', PASTA_SITE)).find((f) => /^print-.*\.png$/.test(f)), { ms: 30000, rotulo: 'print no disco' });
    const buf = fs.readFileSync(path.join(pasta, 'Clones', PASTA_SITE, png));
    medidas.print = { arquivo: png, bytes: buf.length, largura: buf.readUInt32BE(16), altura: buf.readUInt32BE(20) };
    assert.equal(buf.readUInt32BE(0), 0x89504e47);
    const ps = await passos();
    assert.ok(ps.some((p) => /^copy pronta: Clones\/localhost_4941\/copy\.md/.test(p)) && ps.some((p) => /^print pronto: /.test(p)));
    const botoes = await naTela((sel) => Array.from(document.querySelectorAll(sel + ' .navr-passo .navr-mini-bt')).map((b) => b.textContent), secao);
    assert.ok(botoes.includes('abrir'), 'o passo do clone tem "abrir"');
  });

  it('a página do agente não morre: trocar ou fechar a aba mantém o mesmo webview, e o relógio do DOM vivo só roda com o Raio-X HTML à vista', async () => {
    const id0 = medidas.registro.webContentsId;
    await abaRaio('console');
    assert.equal(await naTela(() => window.BC.navegadorReal.relogios().domVivo), false, 'Raio-X na aba Console: sem relógio');
    await abaRaio('html');
    await ate(() => naTela(() => window.BC.navegadorReal.relogios().domVivo), { rotulo: 'relógio do DOM vivo ligado' });
    await naTela(() => window.BC.estacao.abrir('demandas'));
    await ate(() => naTela(() => !document.getElementById('navr-camada').classList.contains('visivel')), { rotulo: 'camada escondida em outra aba' });
    assert.equal(await naTela(() => window.BC.navegadorReal.relogios().domVivo), false, 'outra aba à vista: relógio parado');
    await naTela((a) => window.BC.estacao.fecharAba('nav:' + a), AGENTE);
    const t0 = Date.now();
    await noPrincipal(async (_e, a) => global.babelCoop.navegadores.clicar(a, '#mais'), AGENTE);
    medidas.abaFechada = { msClique: Date.now() - t0 };
    const r = await naTela((a) => ({ abas: window.BC.estacao.ui.abas.map((t) => t.id), ativa: window.BC.estacao.abaAtual().id, wc: window.BC.navegadorReal.sessao(a).webContentsId }), AGENTE);
    medidas.abaFechada.depois = r;
    assert.ok(r.abas.includes('nav:' + AGENTE), 'a aba volta para a fila quando o agente age');
    assert.notEqual(r.ativa, 'nav:' + AGENTE, 'sem roubar a aba ativa');
    assert.equal(r.wc, id0, 'o mesmo webContents: a página não recarregou');
    const noPrin = await noPrincipal((_e, a) => global.babelCoop.navegadores.estado(a), AGENTE);
    assert.equal(noPrin.webContentsId, id0);
    await naTela((a) => window.BC.estacao.abrirAba({ id: 'nav:' + a, tipo: 'navegador', ref: a, titulo: 'Navegador · Aurora', atividade: 'terminais' }), AGENTE);
    await ate(() => naTela(() => document.getElementById('navr-camada').classList.contains('visivel')), { rotulo: 'camada de volta' });
  });

  it('sem o módulo principal a tela ainda lê a página: seleção desenhada na própria página e cópia leve (caminho de reserva)', async () => {
    const pendente = naTela((a) => window.BC.navegadorReal.naPagina(a, 'selecionar', []), AGENTE);
    await esperarMs(250);
    const d = await naTela((a) => window.BC.navegadorReal.webview(a).executeJavaScript('(function(){var b=document.querySelector("#planos h2").getBoundingClientRect();return {x:Math.round(b.left+8),y:Math.round(b.top+b.height/2)}})()'), AGENTE);
    await noPrincipal(({ webContents }, a) => { const wc = webContents.fromId(a.id); ['mouseMove', 'mouseDown', 'mouseUp'].forEach((tipo) => wc.sendInputEvent({ type: tipo, x: a.x, y: a.y, button: 'left', clickCount: 1 })); }, { id: medidas.registro.webContentsId, x: d.x, y: d.y });
    const r = await pendente;
    assert.equal(r.rotulo, 'h2');
    assert.ok(r.caminho.length >= 4, 'caminho do html até o nó');
    const c = await naTela((a) => window.BC.navegadorReal.naPagina(a, 'clonar', []), AGENTE);
    medidas.reserva = { selecionado: r.rotulo, seletor: r.seletor, htmlBytes: c.html.length, cssBytes: c.css.length };
    assert.match(c.html, /<h1>/);
    assert.doesNotMatch(c.html, /data-babel-coop-raiox|__babel-coop-cursor/);
    assert.match(c.css, /estilo\.css/);
    assert.match(c.html, /href="estilos\.css"/);
  });

  it('movimento reduzido: o passo acende a luz mas a varredura não corre', async () => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await naTela((sel) => { const v = document.querySelector(sel + ' .navr-varredura'); window.__varreu = 0; new MutationObserver(() => { if (v.classList.contains('passando')) window.__varreu++; }).observe(v, { attributes: true }); }, secao);
    await noPrincipal(async (_e, a) => global.babelCoop.navegadores.clicar(a, '#mais'), AGENTE);
    await esperarMs(300);
    const r = await naTela((sel) => ({ varreu: window.__varreu, luz: +(document.querySelector(sel + ' .navr-faixa').style.getPropertyValue('--luz') || 0) }), secao);
    medidas.reduzido = r;
    assert.equal(r.varreu, 0);
    assert.ok(r.luz > 0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await naTela((sel) => { const v = document.querySelector(sel + ' .navr-varredura'); window.__varreu2 = 0; new MutationObserver(() => { if (v.classList.contains('passando')) window.__varreu2++; }).observe(v, { attributes: true }); }, secao);
    await noPrincipal(async (_e, a) => global.babelCoop.navegadores.clicar(a, '#mais'), AGENTE);
    await esperarMs(200);
    medidas.reduzido.semReduzir = await naTela(() => window.__varreu2);
    assert.ok(medidas.reduzido.semReduzir >= 1, 'sem reduzir, a varredura corre');
  });

  it('sem Electron (celular): a aba mostra "Navegador só no app"', async () => {
    const r = await naTela(async (base) => {
      const f = document.createElement('iframe');
      f.style.cssText = 'position:fixed;left:0;top:0;width:390px;height:700px;border:0;z-index:9999';
      f.src = base + '/?celular';
      document.body.appendChild(f);
      await new Promise((ok) => f.addEventListener('load', ok, { once: true }));
      const w = f.contentWindow;
      const fim = Date.now() + 15000;
      while (Date.now() < fim && !(w.BC && w.BC.estacao && w.BC.real && w.BC.real.eu())) await new Promise((ok) => setTimeout(ok, 100));
      if (!w.BC.navegadorReal) {
        await new Promise((ok) => { const l = w.document.createElement('link'); l.rel = 'stylesheet'; l.href = '/coop/navegador-real.css'; l.onload = ok; w.document.head.appendChild(l); });
        await new Promise((ok) => { const s = w.document.createElement('script'); s.src = '/coop/navegador-real.js'; s.onload = ok; w.document.head.appendChild(s); });
      }
      w.BC.navegador.abrir({ id: 'aurora', nome: 'Aurora' }, 'https://exemplo.com.br');
      await new Promise((ok) => setTimeout(ok, 300));
      const out = { coopElectron: typeof w.coopElectron, webview: w.BC.navegadorReal.disponivel(), texto: (w.document.getElementById('e-conteudo') || {}).textContent || '' };
      f.remove();
      return out;
    }, est.base);
    medidas.semElectron = r;
    assert.equal(r.coopElectron, 'undefined');
    assert.equal(r.webview, false);
    assert.match(r.texto, /Navegador só no app/);
  });

  it('nenhum erro desta peça na tela da Estação durante o teste inteiro', () => {
    const meus = medidas.errosDaTela.filter((e) => /navegador-real/.test(e));
    medidas.errosDaTelaTotal = medidas.errosDaTela.length;
    assert.deepEqual(meus, []);
  });

  it('nenhum Google Chrome nesta peça: nada de shell.openExternal nem canal chrome', () => {
    for (const f of ['interface/navegador-real.js', 'interface/navegador-real.css']) {
      const t = fs.readFileSync(path.join(APP, f), 'utf8');
      assert.doesNotMatch(t, /shell\.openExternal|openExternal\(|channel\s*:\s*['"]chrome|chrome\.exe|Google Chrome\.app/);
    }
  });
});
