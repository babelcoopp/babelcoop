/* babel-coop · apagar e restaurar arquivo da pasta compartilhada (servidor/arquivos.js + DELETE /api/arquivo e POST /api/arquivo/restaurar)
   (a) no processo: apagar tira da pasta compartilhada para <raiz>/.coop/lixeira/<id>/<carimbo>__<caminho com / trocado por __> e some
       da lista (nada de lixeira dentro da pasta); restaurar volta ao
       caminho original (nome com "__" volta certo); ocupado → "nome (restaurado).ext"; recusa "..", a própria pasta, pasta, os gerados
       do acervo na raiz (ACERVO.md, APRENDIZADOS.md, CLAUDE.md), atalho que leva para fora e id de lixeira forjado.
   (b) Estação de verdade (processo filho): as duas rotas; a lixeira não se alcança por /api/arquivos, /api/arquivo, PUT nem /pasta;
       recusa pedido que não é do navegador desta máquina (outra origem, outro aparelho da rede).
   (c) acervo: o que foi apagado sai do inventário e da busca (a lixeira fica fora da pasta que o acervo varre) e volta com o Desfazer.
   Portas só deste arquivo: HTTP 5436, UDP 41936.
   Rodar: cd app && node --test testes/servidor/arquivos-apagar.test.js
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Arquivos } = require('../../servidor/arquivos');
const { Estacao, pedirHttp, ipDaRede } = require('./estacoes');

const temporarios = [];
after(() => { temporarios.forEach((r) => { try { fs.rmSync(r, { recursive: true, force: true }); } catch (e) { /* temporário */ } }); });
function montar() {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'babel-apagar-'));
  temporarios.push(raiz);
  const pasta = path.join(raiz, 'theus');
  fs.mkdirSync(pasta, { recursive: true });
  const w = (rel, s) => { fs.mkdirSync(path.dirname(path.join(pasta, rel)), { recursive: true }); fs.writeFileSync(path.join(pasta, rel), s); };
  return { raiz, pasta, w, arq: new Arquivos(pasta, 'theus') };
}
const caminhos = (arq) => arq.listar().map((f) => f.caminho).sort();
const lixeiraDe = (raiz) => path.join(raiz, '.coop', 'lixeira', 'theus');

/* ------------------------------------------------------------------ (a) no processo */
describe('apagar · no processo', () => {
  it('apagar vai para <raiz>/.coop/lixeira/<id> (carimbo__caminho) e some da lista; restaurar volta igual', () => {
    const { raiz, pasta, w, arq } = montar();
    w('notas/ideia.md', '# ideia\n');
    const r = arq.apagar('notas/ideia.md');
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.match(r.lixeira, /^\d{13}__notas__ideia\.md$/);
    assert.equal(r.caminho, 'notas/ideia.md');
    assert.equal(fs.existsSync(path.join(pasta, 'notas', 'ideia.md')), false);
    assert.equal(fs.readFileSync(path.join(lixeiraDe(raiz), r.lixeira), 'utf8'), '# ideia\n');
    assert.deepEqual(fs.readdirSync(pasta).filter((n) => n !== 'notas'), [], 'nada de lixeira dentro da pasta compartilhada');
    assert.deepEqual(caminhos(arq), [], 'o arquivo apagado não aparece na lista');
    const v = arq.restaurar(r.lixeira);
    assert.deepEqual(v, { ok: true, caminho: 'notas/ideia.md' });
    assert.equal(fs.readFileSync(path.join(pasta, 'notas', 'ideia.md'), 'utf8'), '# ideia\n');
    assert.equal(fs.existsSync(path.join(lixeiraDe(raiz), r.lixeira)), false);
    assert.deepEqual(caminhos(arq), ['theus/notas/ideia.md']);
    assert.equal(arq.restaurar(r.lixeira).status, 404, 'restaurar duas vezes: não está mais na lixeira');
  });

  it('nome com "__" volta ao caminho certo; lugar ocupado volta como "(restaurado)"; apagar o mesmo duas vezes não colide', () => {
    const { pasta, w, arq } = montar();
    w('src/__init__.py', 'x = 1\n');
    const r = arq.apagar('src/__init__.py');
    assert.deepEqual(arq.restaurar(r.lixeira), { ok: true, caminho: 'src/__init__.py' });
    w('a.md', 'primeiro');
    const r1 = arq.apagar('a.md');
    w('a.md', 'segundo');
    const r2 = arq.apagar('a.md');
    assert.notEqual(r1.lixeira, r2.lixeira);
    w('a.md', 'o novo que ficou no lugar');
    assert.deepEqual(arq.restaurar(r1.lixeira), { ok: true, caminho: 'a (restaurado).md' });
    assert.deepEqual(arq.restaurar(r2.lixeira), { ok: true, caminho: 'a (restaurado 2).md' });
    assert.equal(fs.readFileSync(path.join(pasta, 'a.md'), 'utf8'), 'o novo que ficou no lugar');
    assert.equal(fs.readFileSync(path.join(pasta, 'a (restaurado).md'), 'utf8'), 'primeiro');
    assert.equal(fs.readFileSync(path.join(pasta, 'a (restaurado 2).md'), 'utf8'), 'segundo');
  });

  it('recusa "..", a própria pasta, pasta, o que não existe e o que está fora', () => {
    const { raiz, pasta, w, arq } = montar();
    w('ok.md', 'fica');
    fs.writeFileSync(path.join(raiz, 'fora.md'), 'de fora');
    for (const rel of ['../fora.md', 'notas/../../fora.md', 'notas/../ok.md', '..']) assert.equal(arq.apagar(rel).status, 400, rel);
    for (const rel of ['', '.', './', path.join(pasta, 'ok.md')]) assert.equal(arq.apagar(rel).status, 400, JSON.stringify(rel));
    w('pasta/dentro.md', 'x');
    assert.equal(arq.apagar('pasta').status, 400, 'pasta inteira não');
    assert.equal(arq.apagar('nao-existe.md').status, 404);
    assert.equal(arq.apagar('.git/config').status, 400, 'o que já é ignorado continua fora');
    assert.equal(arq.apagar('.coop/lixeira/theus/itens.json').status, 400, 'a lixeira não se mexe por dentro da pasta');
    assert.equal(arq.apagar('../.coop/lixeira/theus/itens.json').status, 400, 'nem subindo da pasta');
    assert.ok(fs.existsSync(path.join(raiz, 'fora.md')) && fs.existsSync(path.join(pasta, 'ok.md')));
  });

  it('recusa os gerados do acervo na raiz (ACERVO.md, APRENDIZADOS.md, CLAUDE.md); numa subpasta pode', () => {
    const { pasta, w, arq } = montar();
    for (const n of ['ACERVO.md', 'APRENDIZADOS.md', 'CLAUDE.md', 'claude.md']) {
      w(n, '# gerado');
      const r = arq.apagar(n);
      assert.equal(r.status, 403, n);
      assert.match(r.erro, /gerado pelo acervo/);
      assert.ok(fs.existsSync(path.join(pasta, n)), n + ' continua');
    }
    w('projeto/CLAUDE.md', '# do projeto');
    assert.equal(arq.apagar('projeto/CLAUDE.md').ok, true);
  });

  it('atalho simbólico que leva para fora da pasta: nada sai de lá', { skip: process.platform === 'win32' ? 'symlink no Windows pede permissão' : false }, () => {
    const { raiz, pasta, arq } = montar();
    const fora = path.join(raiz, 'fora');
    fs.mkdirSync(fora);
    fs.writeFileSync(path.join(fora, 'segredo.md'), 'não é da pasta');
    fs.symlinkSync(fora, path.join(pasta, 'atalho'));
    assert.equal(arq.apagar('atalho/segredo.md').status, 400);
    assert.ok(fs.existsSync(path.join(fora, 'segredo.md')));
  });

  it('restaurar recusa id forjado (barra, "..", sem carimbo, o índice)', () => {
    const { arq } = montar();
    for (const id of ['../x', '1700000000000__../../x', '1700000000000__a/b', '1700000000000__a\\b', 'abc', 'itens.json', '', null, 42]) {
      assert.equal(arq.restaurar(id).status, 400, String(id));
    }
    assert.equal(arq.restaurar('1700000000000__nada.md').status, 404);
  });
});

/* ------------------------------------------------------------------ (b) Estação de verdade */
describe('apagar · rotas numa Estação de verdade', { timeout: 120000 }, () => {
  const E = new Estacao({ nome: 'theus-apagar', porta: 5436, descoberta: 41936 });
  temporarios.push(E.raiz);
  const pasta = () => path.join(E.raiz, 'theus');
  before(async () => {
    await E.subir();
    assert.equal((await E.api('POST', '/api/fundar', { nome: 'Theus' })).status, 200);
  });
  after(async () => { await E.parar().catch(() => {}); });

  it('DELETE manda para a lixeira; some de /api/arquivos; POST /api/arquivo/restaurar devolve', async () => {
    const q = '?caminho=' + encodeURIComponent('notas/apagar.md');
    assert.equal((await E.api('PUT', '/api/arquivo' + q, { conteudo: '# vai e volta\n' })).status, 200);
    const d = await E.api('DELETE', '/api/arquivo' + q);
    assert.equal(d.status, 200, d.texto);
    assert.equal(d.json.ok, true);
    assert.match(d.json.lixeira, /^\d{13}__notas__apagar\.md$/);
    assert.equal(fs.existsSync(path.join(pasta(), 'notas', 'apagar.md')), false);
    assert.ok(fs.existsSync(path.join(E.raiz, '.coop', 'lixeira', 'theus', d.json.lixeira)), 'na lixeira do babel-coop');
    assert.equal(fs.existsSync(path.join(pasta(), '.lixeira')), false, 'nada de lixeira dentro da pasta compartilhada');
    const lista = (await E.api('GET', '/api/arquivos')).json.map((f) => f.caminho);
    assert.ok(!lista.includes('theus/notas/apagar.md'), 'apagado ainda na lista');
    assert.ok(!lista.some((c) => c.includes('.lixeira')), 'a lixeira apareceu na lista: ' + lista.join(', '));
    /* a lixeira não se lê por fora: nem pela API de arquivo nem pela pasta servida como site (nem subindo com "..") */
    for (const c of ['../.coop/lixeira/theus/' + d.json.lixeira, '.coop/lixeira/theus/' + d.json.lixeira, '.lixeira/' + d.json.lixeira]) {
      assert.equal((await E.api('GET', '/api/arquivo?caminho=' + encodeURIComponent(c))).status, 404, c);
    }
    assert.equal((await E.api('GET', '/pasta/..%2F.coop%2Flixeira%2Ftheus%2F' + encodeURIComponent(d.json.lixeira))).status, 404);
    assert.equal((await E.api('GET', '/pasta/.coop/lixeira/theus/' + encodeURIComponent(d.json.lixeira))).status, 404);
    assert.equal((await E.api('PUT', '/api/arquivo?caminho=' + encodeURIComponent('../.coop/lixeira/theus/x.md'), { conteudo: 'x' })).status, 400);
    const r = await E.api('POST', '/api/arquivo/restaurar', { lixeira: d.json.lixeira });
    assert.equal(r.status, 200, r.texto);
    assert.deepEqual(r.json, { ok: true, caminho: 'notas/apagar.md' });
    assert.equal((await E.api('GET', '/api/arquivo' + q)).json.conteudo, '# vai e volta\n');
    assert.ok((await E.api('GET', '/api/arquivos')).json.some((f) => f.caminho === 'theus/notas/apagar.md'));
  });

  it('recusa "..", a pasta raiz, os gerados do acervo e item de lixeira inválido', async () => {
    fs.writeFileSync(path.join(E.raiz, 'fora.md'), 'fora');
    assert.equal((await E.api('DELETE', '/api/arquivo?caminho=' + encodeURIComponent('../fora.md'))).status, 400);
    assert.equal((await E.api('DELETE', '/api/arquivo?caminho=' + encodeURIComponent('a/../../fora.md'))).status, 400);
    assert.equal((await E.api('DELETE', '/api/arquivo?caminho=')).status, 400);
    assert.equal((await E.api('DELETE', '/api/arquivo?caminho=.')).status, 400);
    assert.ok(fs.existsSync(path.join(E.raiz, 'fora.md')));
    for (const n of ['ACERVO.md', 'APRENDIZADOS.md', 'CLAUDE.md']) {
      if (!fs.existsSync(path.join(pasta(), n))) fs.writeFileSync(path.join(pasta(), n), '# gerado\n');
      const r = await E.api('DELETE', '/api/arquivo?caminho=' + n);
      assert.equal(r.status, 403, n + ': ' + r.texto);
      assert.ok(fs.existsSync(path.join(pasta(), n)), n + ' continua');
    }
    assert.equal((await E.api('POST', '/api/arquivo/restaurar', { lixeira: '../../fora.md' })).status, 400);
    assert.equal((await E.api('POST', '/api/arquivo/restaurar', {})).status, 400);
    assert.equal((await E.api('DELETE', '/api/arquivo?caminho=nao-existe.md')).status, 404);
  });

  it('recusa pedido que não é do navegador desta máquina (outra origem, outro aparelho da rede)', async () => {
    const q = '?caminho=' + encodeURIComponent('fica.md');
    assert.equal((await E.api('PUT', '/api/arquivo' + q, { conteudo: 'fica' })).status, 200);
    const mal = { Origin: 'http://evil.example' };
    assert.equal((await E.api('DELETE', '/api/arquivo' + q, null, { headers: mal })).status, 403);
    const d = await E.api('DELETE', '/api/arquivo' + q);
    assert.equal(d.status, 200);
    assert.equal((await E.api('POST', '/api/arquivo/restaurar', { lixeira: d.json.lixeira }, { headers: mal })).status, 403);
    const ip = ipDaRede();
    if (ip) {
      assert.equal((await pedirHttp({ porta: 5436, host: ip, metodo: 'POST', caminho: '/api/arquivo/restaurar', corpo: { lixeira: d.json.lixeira }, headers: { Host: ip + ':5436' } })).status, 403, 'restaurar de outro aparelho da rede');
    }
    assert.equal(fs.existsSync(path.join(pasta(), 'fica.md')), false, 'nada foi restaurado por quem não pode');
    assert.equal((await E.api('POST', '/api/arquivo/restaurar', { lixeira: d.json.lixeira })).status, 200);
    if (ip) assert.equal((await pedirHttp({ porta: 5436, host: ip, metodo: 'DELETE', caminho: '/api/arquivo' + q, headers: { Host: ip + ':5436' } })).status, 403, 'apagar de outro aparelho da rede');
    assert.equal(fs.readFileSync(path.join(pasta(), 'fica.md'), 'utf8'), 'fica');
  });
});

/* ------------------------------------------------------------------ (c) acervo */
describe('apagar · acervo', () => {
  it('o apagado sai do inventário e da busca do acervo (texto e nome); o Desfazer devolve', (t) => {
    let Acervo;
    try { ({ Acervo } = require('../../servidor/acervo')); } catch (e) { return t.skip('acervo indisponível: ' + e.message); }
    const { raiz, pasta, w, arq } = montar();
    w('segredo-rh.md', '# Folha do RH\n\nzebraquartzo aparece só aqui\n');
    const ac = new Acervo({ raiz, pasta, eu: 'theus', nomeDe: (id) => id, anexar: () => null, eventos: () => [], tempoGerar: 50, tempoVarrer: 50 });
    try {
      ac.varrer();
      const achou = () => ac.buscar('zebraquartzo', { modo: 'palavras' }).map((x) => x.id || x.item || JSON.stringify(x));
      assert.ok(achou().length > 0, 'antes de apagar, o acervo acha o texto (a busca do teste funciona)');
      const r = arq.apagar('segredo-rh.md');
      assert.equal(r.ok, true);
      ac.varrer();
      const inv = ac.q.invTodos.all().map((x) => x.caminho);
      assert.ok(!inv.some((c) => /lixeira|itens\.json|segredo-rh/.test(c)), 'o apagado (ou a lixeira) no inventário: ' + inv.join(', '));
      assert.deepEqual(achou(), [], 'a busca ainda acha o texto apagado');
      assert.equal(ac.ler('segredo-rh.md'), null, 'ler pelo caminho antigo ainda devolve');
      assert.ok(fs.existsSync(path.join(lixeiraDe(raiz), r.lixeira)), 'o arquivo está guardado na lixeira');
      assert.equal(arq.restaurar(r.lixeira).ok, true);
      ac.varrer();
      assert.ok(achou().length > 0, 'depois do Desfazer, o acervo acha de novo');
    } finally { try { ac.db.close(); } catch (e) { /* fechado */ } }
  });
});
