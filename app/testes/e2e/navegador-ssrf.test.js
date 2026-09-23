/* babel-coop · e2e: o navegador do agente não vira ponte para dentro da rede (SSRF)
   Electron de verdade, SEM a liberação geral de endereço interno (BABEL_COOP_NAV_INTERNO só com "localhost:4953", o site que faz
   o papel de "site de fora"). Prova:
   - o agente abrindo http://127.0.0.1:<porta> (e localhost, [::1], 169.254.169.254) é recusado: "endereço interno: a pessoa abre
     pela barra de endereço (Assumir)"; a /pasta/ da própria Estação continua abrindo;
   - link e redirecionamento vindos de ação do agente não caem no endereço interno (will-navigate / will-redirect);
   - com Assumir, a pessoa abre o mesmo endereço interno pela barra;
   - download que redireciona para 127.0.0.1 é recusado (e o servidor interno nem recebe o pedido); mais de 5 saltos, recusado;
   - nome de arquivo com ../ fica dentro de Downloads/.
   Portas: HTTP 4951 (Estação), 4952 (interno, 127.0.0.1), 4953 ("de fora", localhost), UDP 41451.
   Rodar: cd app && node --test testes/e2e/navegador-ssrf.test.js
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { abrirEstacao, APP } = require('./estacao');

const PORTA = 4951, INTERNO = 4952, FORA = 4953, UDP = 41451;
const EVID = process.env.BABEL_TESTE_EVIDENCIAS ? path.join(process.env.BABEL_TESTE_EVIDENCIAS, 'navegador-ssrf') : path.join(APP, '..', '.deus', 'terminal-ao-vivo', 'evidencias', 'integracao', 'navegador-ssrf');
const AGENTE = { id: 'guarda', nome: 'Guarda' };
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function servidor(porta, host, rotas) {
  const pedidos = [];
  const srv = http.createServer((req, res) => {
    const p = new URL(req.url, 'http://x').pathname;
    pedidos.push(p);
    const r = rotas(p);
    if (!r) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('não achei'); }
    res.writeHead(r.status || 200, Object.assign({ 'Content-Type': r.tipo || 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }, r.cab || {}));
    res.end(r.corpo || '');
  });
  return new Promise((ok) => srv.listen(porta, host, () => ok({ pedidos, fechar: () => new Promise((f) => { srv.closeAllConnections(); srv.close(() => f()); }) })));
}

describe('navegador do agente e endereço interno (SSRF)', { timeout: 180000 }, () => {
  let E, interno, fora, pasta;
  const res = {};
  const nav = async (metodo, ...args) => E.app.evaluate(async (_el, [m, a]) => {
    const n = globalThis.babelCoop.navegadores;
    try { return { ok: true, v: await n[m](...a) }; } catch (e) { return { ok: false, erro: e.message, codigo: e.codigo }; }
  }, [metodo, args]);
  const tela = (metodo, ...args) => E.page.evaluate(([m, a]) => window.coopElectron.navegador[m](...a).then((v) => ({ ok: true, v }), (e) => ({ ok: false, erro: e.message })), [metodo, args]);

  before(async () => {
    fs.mkdirSync(EVID, { recursive: true });
    interno = await servidor(INTERNO, '127.0.0.1', (p) => (p === '/' ? { corpo: '<!doctype html><title>Interno</title><h1>painel interno</h1>' } : p === '/segredo.csv' ? { tipo: 'text/csv', corpo: 'segredo;1\n' } : null));
    fora = await servidor(FORA, '127.0.0.1', (p) => {
      if (p === '/') return { corpo: '<!doctype html><title>Fora</title><h1>site de fora</h1><a id="interno" href="http://127.0.0.1:' + INTERNO + '/">painel</a>' };
      if (p === '/vai') return { status: 302, cab: { Location: 'http://127.0.0.1:' + INTERNO + '/' } };
      if (p === '/baixar') return { status: 302, cab: { Location: 'http://127.0.0.1:' + INTERNO + '/segredo.csv' } };
      if (p === '/arquivo') return { tipo: 'text/csv', corpo: 'ok;1\n', cab: { 'Content-Disposition': 'attachment; filename="../../fora-da-pasta.csv"' } };
      const m = /^\/salto\/(\d+)$/.exec(p);
      if (m) return +m[1] >= 9 ? { tipo: 'text/plain', corpo: 'chegou' } : { status: 302, cab: { Location: '/salto/' + (+m[1] + 1) } };
      return null;
    });
    /* sem a liberação geral: só "localhost:4953" faz o papel de site de fora (o resto do interno fica fechado ao agente) */
    E = await abrirEstacao({ nome: 'ssrf', porta: PORTA, descoberta: UDP, env: { BABEL_COOP_NAV_INTERNO: 'localhost:' + FORA } });
    await E.page.waitForFunction(() => !!(window.coopElectron && window.coopElectron.navegador && window.BC && BC.navegadorReal), null, { timeout: 30000 });
    pasta = (await E.api('/api/eu')).pasta;
  });
  after(async () => {
    try { fs.writeFileSync(path.join(EVID, 'ssrf.json'), JSON.stringify(res, null, 2) + '\n'); } catch (e) { /* segue */ }
    if (E) await E.fechar().catch(() => {});
    if (interno) await interno.fechar();
    if (fora) await fora.fechar();
  });

  it('o agente abrindo 127.0.0.1, localhost, [::1] ou 169.254.169.254 é recusado; a /pasta/ da Estação abre', async () => {
    const r = await nav('abrir', AGENTE, 'http://127.0.0.1:' + INTERNO + '/');
    assert.equal(r.ok, false);
    assert.equal(r.codigo, 'interno');
    assert.match(r.erro, /^endereço interno: a pessoa abre pela barra de endereço \(Assumir\)/);
    for (const u of ['http://localhost:' + INTERNO + '/', 'http://[::1]:' + INTERNO + '/', 'http://2130706433:' + INTERNO + '/']) {
      const x = await nav('abrir', AGENTE, u);
      assert.equal(x.codigo, 'interno', u + ' · ' + x.erro);
    }
    const meta = await nav('abrir', AGENTE, 'http://169.254.169.254/latest/meta-data/');
    assert.equal(meta.codigo, 'interno');
    assert.match(meta.erro, /link-local/);
    assert.equal(interno.pedidos.length, 0, 'o servidor interno não recebeu nada');
    fs.writeFileSync(path.join(pasta, 'na-pasta.html'), '<!doctype html><title>Na pasta</title><p>ok</p>');
    const naPasta = await nav('abrir', AGENTE, 'http://localhost:' + PORTA + '/pasta/na-pasta.html');
    assert.ok(naPasta.ok, naPasta.erro);
    assert.equal(naPasta.v.titulo, 'Na pasta');
    res.recusas = { agente127: r.erro, metadados: meta.erro };
  });

  it('link e redirecionamento vindos do agente não caem no endereço interno', async () => {
    const f = await nav('abrir', AGENTE, 'http://localhost:' + FORA + '/');
    assert.ok(f.ok, f.erro);
    const clique = await nav('clicar', AGENTE, { seletor: '#interno' });
    assert.equal(clique.ok, false, 'o clique no link para o painel interno não navega');
    assert.equal(clique.codigo, 'interno');
    assert.equal(new URL((await nav('estado', AGENTE)).v.url).port, String(FORA), 'continua no site de fora');
    const redir = await nav('abrir', AGENTE, 'http://localhost:' + FORA + '/vai');
    assert.equal(redir.ok, false, 'o redirecionamento para 127.0.0.1 é barrado');
    assert.equal(redir.codigo, 'interno');
    assert.equal(interno.pedidos.length, 0, 'o servidor interno não recebeu nada');
    res.redirecionamento = redir.erro;
  });

  it('com Assumir, a pessoa abre o mesmo endereço interno pela barra', async () => {
    const a = await tela('assumir', AGENTE.id);
    assert.ok(a.ok, a.erro);
    const p = await tela('abrir', AGENTE.id, 'http://127.0.0.1:' + INTERNO + '/');
    assert.ok(p.ok, p.erro);
    assert.equal(p.v.titulo, 'Interno');
    assert.ok(interno.pedidos.includes('/'), 'agora sim o interno recebeu, pela pessoa');
    try { await E.page.screenshot({ path: path.join(EVID, 'pessoa-abre-interno.png'), timeout: 15000 }); } catch (e) { /* segue */ }
    const d = await tela('devolver', AGENTE.id);
    assert.ok(d.ok, d.erro);
    /* devolvido: o agente de novo não abre o interno */
    assert.equal((await nav('abrir', AGENTE, 'http://127.0.0.1:' + INTERNO + '/')).codigo, 'interno');
  });

  it('download: redirecionamento para 127.0.0.1 é recusado; mais de 5 saltos, recusado; "../" fica dentro de Downloads/', async () => {
    assert.ok((await nav('abrir', AGENTE, 'http://localhost:' + FORA + '/')).ok);
    const antes = interno.pedidos.filter((p) => p === '/segredo.csv').length;
    const b = await nav('baixar', AGENTE, '/baixar');
    assert.equal(b.ok, false);
    assert.match(b.erro, /redirecionamento recusado .*endereço interno/);
    assert.equal(interno.pedidos.filter((p) => p === '/segredo.csv').length, antes, 'o servidor interno nem recebeu o pedido');
    const direto = await nav('baixar', AGENTE, 'http://127.0.0.1:' + INTERNO + '/segredo.csv');
    assert.equal(direto.codigo, 'interno');
    const muitos = await nav('baixar', AGENTE, '/salto/1');
    assert.equal(muitos.ok, false);
    assert.match(muitos.erro, /redirecionamentos demais/);
    const poucos = await nav('baixar', AGENTE, '/salto/5');
    assert.ok(poucos.ok, poucos.erro);
    assert.equal(poucos.v.saltos, 4);
    const n = await nav('baixar', AGENTE, '/arquivo');
    assert.ok(n.ok, n.erro);
    assert.equal(n.v.relativo, 'Downloads/fora-da-pasta.csv');
    assert.equal(path.dirname(n.v.arquivo), path.join(pasta, 'Downloads'));
    assert.ok(!fs.existsSync(path.join(pasta, '..', 'fora-da-pasta.csv')) && !fs.existsSync(path.join(pasta, 'fora-da-pasta.csv')), 'nada fora de Downloads/');
    res.download = { redirecionamento: b.erro, saltos: muitos.erro, nome: n.v.relativo };
  });
});
