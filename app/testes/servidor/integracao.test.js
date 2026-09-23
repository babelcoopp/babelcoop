/* Babel Coop · integração do servidor (a costura entre as peças da segunda leva)
   - GET /pasta/<caminho>: a pasta compartilhada como site estático (o clone abre "como site" pela Estação), com MIME certo,
     CSP sandbox sem allow-same-origin e as mesmas travas do /api/arquivo (nada fora da pasta, nada de .env, nada de atalho que sai);
   - controles-publico: o dono espalha aos pares quem está no terminal de quem, e a parede de um terceiro fica sabendo;
   - bemvindo.agentes = true (a presença chama o agente sozinha) e a lista em agentesLista;
   - passos do navegador próprio (navegador.on('passo')) viram blocos da presença, atualizam o bloco da chamada navegador_*,
     "sua vez" da senha vira espera (nunca falha) e nada do que nasce na pausa sai para quem assiste.
   Portas próprias: HTTP 4935–4937, UDP 41435. Rodar: cd app && node --test testes/servidor/integracao.test.js
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Estacao, pedirHttp, esperar } = require('./estacoes');
const { Agentes } = require('../../servidor/agentes');

const UDP = 41435;

/* ------------------------------------------------------------------ passos do navegador → blocos (unidade, sem processo) */
describe('integração · passos do navegador viram blocos da presença', () => {
  let raiz, A, locais, publicos, pausado;
  const terminais = {
    aoFechar() {}, existe: () => true, parado: () => true, info: () => ({ nome: 'Aurora' }), shell: () => ({ cmd: '/bin/zsh' }),
    escrever() {}, pausada: () => pausado
  };
  before(() => {
    raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'babel-srv-integ-'));
    locais = []; publicos = []; pausado = false;
    A = new Agentes({ cfg: () => ({ id: 'theus', nome: 'Theus', raiz, pasta: path.join(raiz, 'theus') }), terminais, porta: () => 4935,
      paraLocais: (m) => { locais.push(JSON.parse(JSON.stringify(m))); return 1; }, publicar: (id, m) => publicos.push(JSON.parse(JSON.stringify(m))) });
    A.iniciar({}, { id: 's1', nome: 'Aurora' });
    A.tratar(A.sessoes.get('s1'), 'UserPromptSubmit', { prompt: 'preencha o cadastro' });
  });
  after(() => { A.parar(); fs.rmSync(raiz, { recursive: true, force: true }); });
  const blocos = (lista) => lista.filter((m) => m.tipo === 'agente-bloco').map((m) => m.bloco);
  const ultimo = (lista, bid) => blocos(lista).filter((b) => b.bid === bid).pop();

  it('dentro da chamada navegador_digitar o passo atualiza o bloco dela; a senha vira espera "sua vez", nunca falha', () => {
    const a = A.sessoes.get('s1');
    const b = A.tratar(a, 'PreToolUse', { tool_name: 'mcp__coop__navegador_digitar', tool_use_id: 't1', tool_input: { seletor: '#nome', texto: 'Rita' } });
    assert.equal(b.tipo, 'acao');
    assert.equal(b.titulo, 'Digitar num campo', 'o título humano da ferramenta do conector');
    assert.equal(b.texto, 'preencher #nome com "Rita"');
    A.passoNavegador({ agente: 's1', nome: 'Aurora', tipo: 'digitar', texto: 'preenchendo Nome…', ts: Date.now() });
    A.passoNavegador({ agente: 's1', nome: 'Aurora', tipo: 'digitar', texto: 'preencheu Nome', feito: true, ts: Date.now() });
    let x = ultimo(locais, b.bid);
    assert.deepEqual([x.tipo, x.texto, x.estado, x.navegador], ['acao', 'preencheu Nome', 'feito', 'digitar']);
    assert.equal(x.passo_, undefined, 'campo interno não sai');
    A.tratar(a, 'PostToolUse', { tool_name: 'mcp__coop__navegador_digitar', tool_use_id: 't1', tool_input: {}, tool_response: [{ type: 'text', text: '{"ok":true}' }] });
    x = ultimo(locais, b.bid);
    assert.equal(x.estado, 'feito');
    assert.equal(x.prova, undefined, 'o passo já contou: a resposta crua não vira prova');
    /* a senha: o módulo recusa (passo senha) e o conector devolve "sua vez" como erro */
    const s = A.tratar(a, 'PreToolUse', { tool_name: 'mcp__coop__navegador_digitar', tool_use_id: 't2', tool_input: { seletor: '#s', texto: 'x' } });
    A.passoNavegador({ agente: 's1', tipo: 'senha', texto: 'senha em Senha: sua vez, Theus digita', ts: Date.now() });
    const n0 = blocos(locais).length;
    A.tratar(a, 'PostToolUseFailure', { tool_name: 'mcp__coop__navegador_digitar', tool_use_id: 't2', tool_input: {}, error: 'sua vez: a pessoa digita a senha. O agente nunca preenche campo de senha.' });
    x = ultimo(locais, s.bid);
    assert.deepEqual([x.tipo, x.senha, x.titulo], ['espera', true, 'sua vez: a senha']);
    assert.equal(blocos(locais).slice(n0).filter((y) => y.tipo === 'falha').length, 0, 'senha nunca vira bloco de falha');
    const est = locais.filter((m) => m.tipo === 'agente-estado').map((m) => m.estado);
    assert.ok(est.includes('espera'), 'o agente fica em espera enquanto a pessoa digita');
  });

  it('fora de uma chamada: "clonando…" e "clone pronto" dividem um bloco que vira resultado com o arquivo; ler = consulta; erro = falha', () => {
    const n0 = locais.length;
    const b1 = A.passoNavegador({ agente: 's1', tipo: 'clonar', texto: 'clonando localhost:4941…', ts: Date.now() });
    const b2 = A.passoNavegador({ agente: 's1', tipo: 'clonar', texto: 'clone pronto: Clones/localhost_4941/index.html · 7 arquivos', feito: true, arquivo: 'Clones/localhost_4941/index.html', ts: Date.now() });
    assert.equal(b1.bid, b2.bid);
    const x = ultimo(locais.slice(n0), b1.bid);
    assert.deepEqual([x.tipo, x.arquivos, x.prova], ['resultado', ['Clones/localhost_4941/index.html'], { arquivo: 'Clones/localhost_4941/index.html', acao: 'criado' }]);
    assert.equal(A.passoNavegador({ agente: 's1', tipo: 'ler', texto: 'lendo Cadastro…' }).tipo, 'consulta');
    assert.equal(A.passoNavegador({ agente: 's1', tipo: 'erro', texto: 'não abriu x' }).tipo, 'falha');
    assert.equal(A.passoNavegador({ agente: 's1', tipo: 'controle', texto: 'Theus assumiu o navegador' }), null, 'controle fica só na aba');
    /* as ferramentas "até o osso": leitura = consulta, navegação = ação, baixar pronto com arquivo = resultado */
    for (const tp of ['codigo', 'rede', 'console', 'armazenamento']) assert.equal(A.passoNavegador({ agente: 's1', tipo: tp, texto: tp + ' lido', feito: true }).tipo, 'consulta', tp);
    for (const tp of ['rolar', 'esperar', 'voltar', 'avancar', 'recarregar', 'teclas']) assert.equal(A.passoNavegador({ agente: 's1', tipo: tp, texto: tp + ' feito', feito: true }).tipo, 'acao', tp);
    const baixou = A.passoNavegador({ agente: 's1', tipo: 'baixar', texto: 'baixado: Downloads/relatorio.csv', feito: true, arquivo: 'Downloads/relatorio.csv' });
    assert.deepEqual([baixou.tipo, baixou.arquivos], ['resultado', ['Downloads/relatorio.csv']]);
    assert.equal(A.passoNavegador({ agente: 'outro', tipo: 'abrir', texto: 'abrindo…' }), null, 'sem agente nesta sessão: nada');
    assert.equal(A.passoNavegador({ agente: 's1', tipo: 'clonar', texto: 'x', feito: true, arquivo: '/etc/passwd' }).tipo, 'acao', 'caminho absoluto não vira arquivo');
  });

  it('pausa: o passo que nasce na pausa chega à minha tela e nunca a quem assiste, nem depois', () => {
    pausado = true;
    const p0 = publicos.length, l0 = locais.length;
    const b = A.passoNavegador({ agente: 's1', tipo: 'abrir', texto: 'abrindo site-secreto.example…' });
    pausado = false;
    A.passoNavegador({ agente: 's1', tipo: 'abrir', texto: 'abriu Site Secreto · 80 ms', feito: true });
    assert.ok(locais.slice(l0).some((m) => m.tipo === 'agente-bloco' && m.bloco.bid === b.bid));
    assert.ok(!JSON.stringify(publicos.slice(p0)).includes('ecreto'), 'nada do passo da pausa saiu para os pares');
  });

  it('todas as agente-* levam o nome do agente', () => {
    const semNome = locais.filter((m) => /^agente-/.test(m.tipo) && m.nome !== 'Aurora');
    assert.deepEqual(semNome.map((m) => m.tipo), []);
    assert.ok(publicos.every((m) => m.nome === 'Aurora'));
  });
});

/* ------------------------------------------------------------------ servidor de verdade: /pasta/, controles-publico, bemvindo */
const T = new Estacao({ nome: 'theus-int', porta: 4935, descoberta: UDP });
const R = new Estacao({ nome: 'rita-int', porta: 4936, descoberta: UDP });
const Z = new Estacao({ nome: 'zeca-int', porta: 4937, descoberta: UDP, ambiente: { BABEL_COOP_AGENTES: '0' } });

describe('integração · servidor', { timeout: 120000 }, () => {
  let nt, nr, nz, pastaT;
  before(async () => {
    await Promise.all([T.subir(), R.subir(), Z.subir()]);
    assert.equal((await T.api('POST', '/api/fundar', { nome: 'Theus' })).status, 200);
    for (const [E, nome] of [[R, 'Rita'], [Z, 'Zeca']]) {
      const c = await T.api('POST', '/api/convite', { nome, papel: 'membro' });
      assert.equal((await E.api('POST', '/api/token', { token: c.json.token })).status, 200);
    }
    await T.esperarPar('rita'); await T.esperarPar('zeca'); await R.esperarPar('zeca'); await Z.esperarPar('rita');
    nt = await T.navegador(); nr = await R.navegador(); nz = await Z.navegador();
    pastaT = (await T.eu()).pasta;
  });
  after(async () => { await Promise.all([T.parar(), R.parar(), Z.parar()]); });

  it('bemvindo.agentes = true liga a presença; BABEL_COOP_AGENTES=0 desliga; a lista vai em agentesLista', () => {
    const bt = nt.msgs.find((m) => m.tipo === 'bemvindo'), bz = nz.msgs.find((m) => m.tipo === 'bemvindo');
    assert.equal(bt.agentes, true);
    assert.ok(Array.isArray(bt.agentesLista));
    assert.equal(bz.agentes, false);
  });

  it('GET /pasta/: o clone abre como site, com MIME certo e CSP sandbox sem allow-same-origin (origem "null" recusada); nada fora da pasta', async () => {
    const site = path.join(pastaT, 'Clones', 'localhost_9999');
    fs.mkdirSync(path.join(site, 'assets'), { recursive: true });
    fs.writeFileSync(path.join(site, 'index.html'), '<!doctype html><title>clone</title><link rel="stylesheet" href="assets/a.css"><h1>Clínica Vida</h1>');
    fs.writeFileSync(path.join(site, 'assets', 'a.css'), 'h1{color:red}');
    fs.writeFileSync(path.join(site, 'assets', 'fonte.woff2'), Buffer.from([0x77, 0x4f, 0x46, 0x32]));
    fs.writeFileSync(path.join(pastaT, '.env'), 'SEGREDO=1');
    const fora = path.join(T.raiz, 'fora.txt');
    fs.writeFileSync(fora, 'fora da pasta');
    fs.symlinkSync(fora, path.join(pastaT, 'atalho.txt'));

    const r = await pedirHttp({ porta: T.porta, caminho: '/pasta/Clones/localhost_9999/' });
    assert.equal(r.status, 200);
    assert.match(r.texto, /Clínica Vida/);
    const h = await new Promise((ok) => require('http').get({ host: '127.0.0.1', port: T.porta, path: '/pasta/Clones/localhost_9999/' }, (res) => { res.resume(); ok(res.headers); }));
    assert.equal(h['content-type'], 'text/html; charset=utf-8');
    assert.equal(h['content-security-policy'], 'sandbox allow-scripts allow-forms allow-popups');
    assert.ok(!/allow-same-origin/.test(h['content-security-policy']), 'a página nunca vira a origem da Estação');
    /* e a origem opaca dela ("null") não passa nas rotas que só a Estação usa */
    assert.equal((await pedirHttp({ porta: T.porta, metodo: 'POST', caminho: '/api/convite', corpo: { nome: 'Intrusa', papel: 'gestao' }, headers: { Origin: 'null' } })).status, 403);
    assert.equal((await pedirHttp({ porta: T.porta, metodo: 'POST', caminho: '/api/evento', corpo: { acao: 'aviso', args: ['x'] }, headers: { Origin: 'null' } })).status, 403);
    const semBarra = await pedirHttp({ porta: T.porta, caminho: '/pasta/Clones/localhost_9999' });
    assert.equal(semBarra.status, 301, 'pasta sem barra: redireciona (os caminhos relativos do clone funcionam)');
    const css = await new Promise((ok) => require('http').get({ host: '127.0.0.1', port: T.porta, path: '/pasta/Clones/localhost_9999/assets/a.css' }, (res) => { let s = ''; res.on('data', (c) => { s += c; }); res.on('end', () => ok({ s, tipo: res.headers['content-type'] })); }));
    assert.deepEqual(css, { s: 'h1{color:red}', tipo: 'text/css; charset=utf-8' });
    const fonte = await new Promise((ok) => require('http').get({ host: '127.0.0.1', port: T.porta, path: '/pasta/Clones/localhost_9999/assets/fonte.woff2' }, (res) => { res.resume(); ok(res.headers['content-type']); }));
    assert.equal(fonte, 'font/woff2');
    for (const c of ['/pasta/.env', '/pasta/atalho.txt', '/pasta/..%2ffora.txt', '/pasta/Clones/../../fora.txt', '/pasta/%2e%2e/fora.txt', '/pasta/nao-existe.html']) {
      assert.equal((await pedirHttp({ porta: T.porta, caminho: c })).status, 404, c);
    }
    assert.equal((await pedirHttp({ porta: T.porta, metodo: 'POST', caminho: '/pasta/Clones/localhost_9999/index.html', corpo: {} })).status, 405);
  });

  it('controles-publico: Theus entra no terminal da Rita e a parede do Zeca fica sabendo (e desfaz quando ele sai)', async () => {
    nr.enviar({ tipo: 'term-abrir', id: 's1', nome: 'Nina', cols: 80, rows: 24 });
    await nr.esperar((m) => m.tipo === 'term-aberto' && m.info.id === 's1');
    let z0 = nz.msgs.length;
    nt.enviar({ tipo: 'term-pedir', dono: 'rita', sessao: 's1' }); /* Theus é gestão: entra direto */
    const pub = await nz.esperar((m) => m.tipo === 'controles-publico' && m.dono === 'rita' && m.lista.length === 1, { desde: z0, ms: 8000, oque: 'resumo público na tela do Zeca' });
    assert.deepEqual(pub.lista, [{ dono: 'rita', quem: 'theus', sessao: 's1' }]);
    /* uma tela nova do Zeca recebe o resumo já no bemvindo */
    const nz2 = await Z.navegador();
    const bv = nz2.msgs.find((m) => m.tipo === 'bemvindo');
    assert.deepEqual(bv.controlesPublicos.rita, [{ dono: 'rita', quem: 'theus', sessao: 's1' }]);
    nz2.fechar();
    const ct = (await nt.esperar((m) => m.tipo === 'controles' && m.lista.some((c) => c.dono === 'rita' && c.estado === 'ativo'), { oque: 'o controle no espelho do Theus' })).lista.find((c) => c.dono === 'rita');
    z0 = nz.msgs.length;
    nt.enviar({ tipo: 'controle-sair', id: ct.id, dono: 'rita' });
    const vazio = await nz.esperar((m) => m.tipo === 'controles-publico' && m.dono === 'rita' && m.lista.length === 0, { desde: z0, ms: 8000, oque: 'o resumo público vazio' });
    assert.deepEqual(vazio.lista, []);
  });
});
