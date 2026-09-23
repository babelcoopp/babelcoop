/* babel-coop · e2e do navegador próprio "até o osso": inspeção (só leitura) e navegação, no Electron de verdade
   O módulo principal (navegador/navegador.js) com um site de teste local; a aba "Navegador · Osso" nasce pela tela real
   (interface/navegador-real.js atende o pedido de aba), como quando o claude chama as ferramentas pelo conector coop.
   Prova: codigo lista os recursos e lê o .js (com source map), o .css, o DOM vivo e o corpo de um fetch · rede mostra o fetch
   com o corpo e os cabeçalhos · console traz o log e o erro · armazenamento lê o cookie, o localStorage e o sessionStorage
   (nada com cara de senha) · teclas manda Enter num formulário e é recusada com o foco na senha · rolar e esperar funcionam ·
   voltar, avançar e recarregar · baixar grava em Downloads/ · cada ferramenta vira passo na aba.
   Portas: HTTP 4947 (Estação), 4948 (site), UDP 41447. Rodar: cd app && node --test testes/e2e/navegador-osso.test.js
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { abrirEstacao, APP } = require('./estacao');

const PORTA = 4947, SITE_PORTA = 4948, UDP = 41447;
const SITE = 'http://localhost:' + SITE_PORTA;
const EVID = process.env.BABEL_TESTE_EVIDENCIAS ? path.join(process.env.BABEL_TESTE_EVIDENCIAS, 'navegador-osso') : path.join(APP, '..', '.deus', 'terminal-ao-vivo', 'evidencias', 'integracao', 'navegador-osso');
const AGENTE = { id: 'osso', nome: 'Osso' };
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const HTML = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Osso Teste</title><link rel="stylesheet" href="/css/app.css"></head>
<body><header id="topo"><h1>Osso Teste</h1><a id="ir-p2" href="/pagina2">Página 2</a></header>
<main><button id="cadastrar-btn" class="botao-cadastro" type="button">Cadastrar</button>
<form id="busca"><label for="q">Busca</label><input id="q" name="q"><label for="senha">Senha</label><input id="senha" name="senha" type="password"><button type="submit">Ir</button></form>
<section class="longa"><p>conteúdo longo</p></section><p id="fundo">fim da página</p></main>
<script src="/js/app.js"></script></body></html>`;
const CSS = `body { margin: 0; background: #0f1a24; color: #e8f2fb; font-family: system-ui, sans-serif; }
.botao-cadastro { background: #8670ff; color: #fff; border: 0; border-radius: 10px; padding: 12px 20px; font-weight: 700; }
.longa { min-height: 3200px; }
/*# sourceMappingURL=app.css.map */`;
const JS = `console.log('osso pronto');
console.error('erro do osso');
localStorage.setItem('tema', 'escuro');
localStorage.setItem('senhaSalva', 'nao-deve-sair');
sessionStorage.setItem('passo', '2');
document.getElementById('busca').addEventListener('submit', function (e) { e.preventDefault(); document.body.dataset.enviou = document.getElementById('q').value; });
setTimeout(function () { var p = document.createElement('p'); p.id = 'atrasado'; p.textContent = 'apareceu depois'; document.querySelector('main').prepend(p); }, 700);
fetch('/api/dados').then(function (r) { return r.json(); }).then(function (j) { document.body.dataset.marca = j.marca; });
//# sourceMappingURL=app.js.map`;
const MAPA = JSON.stringify({ version: 3, file: 'app.js', sources: ['src/app.ts'], names: [], mappings: 'AAAA', sourcesContent: ["console.log('osso pronto')"] });

function subirSite() {
  const rotas = {
    '/': ['text/html; charset=utf-8', HTML, { 'Set-Cookie': ['sessao=abc123; Path=/', 'pref=azul; Path=/'] }],
    '/pagina2': ['text/html; charset=utf-8', '<!DOCTYPE html><title>Página 2</title><h1>Página 2</h1><a href="/">voltar</a>'],
    '/css/app.css': ['text/css', CSS], '/js/app.js': ['text/javascript', JS], '/js/app.js.map': ['application/json', MAPA],
    '/css/app.css.map': ['application/json', JSON.stringify({ version: 3, sources: ['src/app.scss'], names: [], mappings: 'AAAA' })],
    '/api/dados': ['application/json', JSON.stringify({ itens: [1, 2, 3], marca: 'osso-123' }), { 'X-Teste': 'cabecalho-do-osso' }],
    '/relatorio.csv': ['text/csv; charset=utf-8', 'nome;total\nRita;3\n', { 'Content-Disposition': "attachment; filename=\"relatorio.csv\"; filename*=UTF-8''relat%C3%B3rio.csv" }]
  };
  const srv = http.createServer((req, res) => {
    const a = rotas[new URL(req.url, SITE).pathname];
    if (!a) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('não achei'); }
    res.writeHead(200, Object.assign({ 'Content-Type': a[0], 'Cache-Control': 'no-store' }, a[2] || {}));
    res.end(a[1]);
  });
  return new Promise((ok) => srv.listen(SITE_PORTA, '127.0.0.1', () => ok({ fechar: () => new Promise((f) => { srv.closeAllConnections(); srv.close(() => f()); }) })));
}

describe('navegador até o osso: inspeção só leitura e navegação (Electron, site local)', { timeout: 240000 }, () => {
  let E, site, pasta;
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
  const naPagina = async (js) => E.app.evaluate(async ({ webContents }, codigo) => {
    const e = globalThis.babelCoop.navegadores.estado('osso');
    return webContents.fromId(e.webContentsId).executeJavaScript(codigo);
  }, js);
  async function print(nome) { try { await E.page.screenshot({ path: path.join(EVID, nome + '.png'), timeout: 15000 }); } catch (e) { /* segue */ } }

  before(async () => {
    fs.mkdirSync(EVID, { recursive: true });
    site = await subirSite();
    E = await abrirEstacao({ nome: 'osso', porta: PORTA, descoberta: UDP });
    E.app.context().pages().forEach((p) => p.on('dialog', () => {}));
    await E.page.waitForFunction(() => !!(window.coopElectron && window.coopElectron.navegador && window.BC && BC.navegadorReal), null, { timeout: 30000 });
    pasta = (await E.api('/api/eu')).pasta;
    await E.page.evaluate(() => { window.__passos = []; window.coopElectron.navegador.aoPasso((p) => { if (p.agente === 'osso') window.__passos.push(p.tipo + ' · ' + p.texto); }); });
  });
  after(async () => {
    try { fs.writeFileSync(path.join(EVID, 'medidas.json'), JSON.stringify(medidas, null, 2) + '\n'); } catch (e) { /* segue */ }
    if (E) await E.fechar().catch(() => {});
    if (site) await site.fechar().catch(() => {});
  });

  it('abrir pela tela real (a aba nasce) e esperar um elemento que chega depois', async () => {
    const r = await nav('abrir', AGENTE, SITE + '/');
    assert.ok(r.ok, r.erro);
    assert.equal(r.v.titulo, 'Osso Teste');
    const aba = await E.page.evaluate(() => (BC.estacao.ui.abas.find((a) => a.id === 'nav:osso') || {}).titulo);
    assert.equal(aba, 'Navegador · Osso');
    const w = await nav('aguardar', AGENTE, { seletor: '#atrasado' });
    assert.ok(w.ok && w.v.achou, JSON.stringify(w));
    const nao = await nav('aguardar', AGENTE, { texto: 'isso nunca aparece', ms: 400 });
    assert.equal(nao.v.achou, false);
    const t = await nav('aguardar', AGENTE, { ms: 150 });
    assert.equal(t.v.esperou, 150);
    medidas.esperar = { atrasadoMs: w.v.ms };
  });

  it('codigo: lista os recursos e lê o .js (com source map), o .css, o HTML original, o DOM vivo e o corpo de um fetch', async () => {
    const lista = await nav('codigo', AGENTE, {});
    assert.ok(lista.ok, lista.erro);
    const tipos = lista.v.recursos.map((x) => x.tipo + ' ' + new URL(x.url).pathname);
    for (const k of ['Document /', 'Script /js/app.js', 'Stylesheet /css/app.css']) assert.ok(tipos.includes(k), k + ' em ' + tipos.join(', '));
    const js = await nav('codigo', AGENTE, { url: '/js/app.js' });
    assert.ok(js.ok, js.erro);
    assert.equal(js.v.tipo, 'Script');
    assert.match(js.v.conteudo, /console\.log\('osso pronto'\)/);
    assert.deepEqual(js.v.sourceMap.fontes, ['src/app.ts']);
    assert.match(js.v.sourceMap.conteudo, /sourcesContent/);
    const css = await nav('codigo', AGENTE, { url: SITE + '/css/app.css' });
    assert.ok(css.ok, css.erro);
    assert.match(css.v.conteudo, /\.botao-cadastro \{ background: #8670ff/);
    assert.deepEqual(css.v.sourceMap.fontes, ['src/app.scss']);
    const html = await nav('codigo', AGENTE, { url: '/' });
    assert.ok(html.ok, html.erro);
    assert.equal(html.v.tipo, 'Document');
    assert.ok(html.v.conteudo.includes('<script src="/js/app.js"></script>') && !html.v.conteudo.includes('atrasado'), 'o HTML original, como veio do servidor');
    const dom = await nav('codigo', AGENTE, { url: 'dom' });
    assert.ok(dom.ok, dom.erro);
    assert.ok(dom.v.conteudo.includes('id="atrasado"'), 'o DOM vivo tem o que o JavaScript pôs');
    assert.ok(!dom.v.conteudo.includes('__babel-coop-cursor'), 'sem o cursor do agente');
    const api = await nav('codigo', AGENTE, { url: '/api/dados' });
    assert.ok(api.ok, api.erro);
    assert.match(api.v.conteudo, /"marca":"osso-123"/);
    const fora = await nav('codigo', AGENTE, { url: 'https://exemplo.invalid/segredo.js' });
    assert.equal(fora.ok, false, 'só lê o que a página carregou: nada de buscar endereço qualquer');
    medidas.codigo = { recursos: lista.v.total, porTipo: lista.v.porTipo, jsBytes: js.v.bytes, ms: js.ms };
  });

  it('rede: o fetch com status, cabeçalhos e o corpo; console: o log e o erro', async () => {
    const r = await nav('rede', AGENTE, { filtro: 'api', corpo: true });
    assert.ok(r.ok, r.erro);
    const p = r.v.pedidos.find((x) => x.url.endsWith('/api/dados'));
    assert.ok(p, JSON.stringify(r.v.pedidos.map((x) => x.url)));
    assert.equal(p.status, 200);
    assert.equal(p.metodo, 'GET');
    assert.match(p.corpo, /osso-123/);
    assert.equal(p.cabecalhosResposta['x-teste'] || p.cabecalhosResposta['X-Teste'], 'cabecalho-do-osso');
    const c = await nav('console', AGENTE, {});
    const textos = c.v.mensagens.map((m) => m.nivel + ':' + m.texto);
    assert.ok(textos.includes('log:osso pronto') && textos.includes('erro:erro do osso'), textos.join(' | '));
    const soErro = await nav('console', AGENTE, { nivel: 'erro' });
    assert.ok(soErro.v.mensagens.every((m) => m.nivel === 'erro'));
    medidas.rede = { pedidos: r.v.total, corpo: p.corpo.length };
  });

  it('armazenamento: cookie, localStorage e sessionStorage; o que parece senha não sai', async () => {
    const a = await nav('armazenamento', AGENTE);
    assert.ok(a.ok, a.erro);
    const ck = Object.fromEntries(a.v.cookies.map((c) => [c.nome, c.valor]));
    assert.equal(ck.sessao, 'abc123');
    assert.equal(ck.pref, 'azul');
    const ls = Object.fromEntries(a.v.localStorage.map((x) => [x.chave, x.valor]));
    assert.equal(ls.tema, 'escuro');
    assert.equal(ls.senhaSalva, '[redigido]');
    assert.ok(!JSON.stringify(a.v).includes('nao-deve-sair'));
    assert.equal(a.v.sessionStorage.find((x) => x.chave === 'passo').valor, '2');
  });

  it('rolar (fim, pixels, elemento, topo)', async () => {
    let r = await nav('rolar', AGENTE, { para: 'fim' });
    assert.ok(r.ok && r.v.noFim, JSON.stringify(r));
    r = await nav('rolar', AGENTE, { pixels: -400 });
    assert.ok(r.v.y < r.v.antes);
    r = await nav('rolar', AGENTE, { para: '#fundo' });
    assert.equal(r.v.seletor, '#fundo');
    r = await nav('rolar', AGENTE, { para: 'topo' });
    assert.equal(r.v.y, 0);
  });

  it('teclas: Enter envia o formulário; com o foco na senha é recusada ("sua vez"); atalho com Ctrl não passa', async () => {
    assert.ok((await nav('digitar', AGENTE, '#q', 'babel')).ok);
    const k = await nav('teclas', AGENTE, 'Enter');
    assert.ok(k.ok && k.v.ok, JSON.stringify(k));
    assert.equal(await naPagina('document.body.dataset.enviou'), 'babel', 'o Enter enviou o formulário');
    await nav('clicar', AGENTE, { seletor: '#senha' });
    const s = await nav('teclas', AGENTE, 'Tab');
    assert.ok(s.ok, s.erro);
    assert.equal(s.v.recusado, 'senha');
    assert.equal((await nav('estado', AGENTE)).v.suaVez, true);
    assert.equal(await naPagina('document.getElementById("senha").value'), '');
    const ctrl = await nav('teclas', AGENTE, 'Ctrl+A');
    assert.equal(ctrl.ok, false);
    assert.match(ctrl.erro, /tecla não permitida/);
    await print('osso-senha-sua-vez');
  });

  it('voltar, avançar e recarregar', async () => {
    assert.ok((await nav('clicar', AGENTE, { seletor: '#ir-p2' })).ok);
    let r = await nav('voltar', AGENTE);
    assert.ok(r.ok, r.erro);
    assert.equal(new URL(r.v.url).pathname, '/');
    r = await nav('avancar', AGENTE);
    assert.equal(new URL(r.v.url).pathname, '/pagina2');
    r = await nav('recarregar', AGENTE);
    assert.equal(r.v.titulo, 'Página 2');
  });

  it('baixar: o arquivo vai para Downloads/ da pasta compartilhada, com nome seguro, sem sobrescrever', async () => {
    const r = await nav('baixar', AGENTE, '/relatorio.csv');
    assert.ok(r.ok, r.erro);
    assert.equal(r.v.relativo, 'Downloads/relatório.csv');
    assert.equal(fs.readFileSync(path.join(pasta, 'Downloads', 'relatório.csv'), 'utf8'), 'nome;total\nRita;3\n');
    const de2 = await nav('baixar', AGENTE, SITE + '/relatorio.csv');
    assert.equal(de2.v.relativo, 'Downloads/relatório (2).csv');
    const estacao = await nav('baixar', AGENTE, 'http://localhost:' + PORTA + '/api/eu');
    assert.equal(estacao.ok, false, 'nada da própria Estação');
    const arq = await nav('baixar', AGENTE, 'file:///etc/hosts');
    assert.equal(arq.ok, false);
  });

  it('cada ferramenta virou passo na aba do navegador', async () => {
    await print('osso-passos');
    const passos = await E.page.evaluate(() => window.__passos.slice());
    fs.writeFileSync(path.join(EVID, 'passos.txt'), passos.join('\n') + '\n');
    for (const tipo of ['esperar', 'codigo', 'rede', 'console', 'armazenamento', 'rolar', 'teclas', 'senha', 'voltar', 'avancar', 'recarregar', 'baixar']) {
      assert.ok(passos.some((p) => p.startsWith(tipo + ' · ')), 'passo ' + tipo + ':\n' + passos.join('\n'));
    }
    const naAba = await E.page.evaluate(() => { const s = BC.navegadorReal.sessao('osso'); return s ? (s.passos || []).length : 0; });
    assert.ok(naAba >= 10, 'a lista de passos da aba: ' + naAba);
  });
});
