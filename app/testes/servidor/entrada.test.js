/* babel-coop · entrar na equipe pelo Wi-Fi (servidor/entrada.js)
   Unidade: código igual dos dois lados e amarrado às duas partes (compromisso e revelação), quem está no meio não mói um código igual,
   token cifrado que só a chave efêmera do pedido abre, token de outra equipe recusado, nada entra sem a pessoa confirmar o código,
   nome de quem já está na equipe recusado, anúncio forjado não troca a gestão, limites e validade (relógio falso).
   Servidor: duas Estações de verdade (Theus funda; a nova abre sem equipe, acha a equipe pelo anúncio UDP, pede, é recusada,
   pede de novo, é aceita, confirma o código e entra); um cliente à mão faz o papel de quem escuta o Wi-Fi e de quem tenta pular a gestão.
   Portas só deste arquivo: HTTP 5457 (Theus) e 5458 (nova), UDP 41957.
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const dgram = require('dgram');
const fs = require('fs');
const path = require('path');
const { Estacao, ipDaRede, esperar } = require('./estacoes');
const { Entrada, Pedidos, novaChave, novoNonce, compromisso, codigo, cifrar, decifrar, VALIDADE, INTERVALO } = require('../../servidor/entrada');
const token = require('../../servidor/token');

const UDP = 41957;
const EQUIPE = token.fundar('Theus', 'babel').publicaEquipe || 'chave-da-equipe-de-teste';

/* a Estação nova em miniatura: chave, sorteio, compromisso */
function nova() { const k = novaChave(); const n = novoNonce(); return { k, n, comp: compromisso(k.publica, n) }; }
const erro = (fn, status, re) => { try { fn(); } catch (e) { assert.equal(e.status, status, e.message); if (re) assert.match(e.message, re); return e; } assert.fail('devia recusar'); };

describe('entrada · unidade', () => {
  it('o código sai igual dos dois lados e depende da chave do pedido, da chave da equipe e dos DOIS sorteios', () => {
    const p = new Pedidos();
    const a = nova();
    const r = p.pedir({ nome: 'Rita', chavePublica: a.k.publica, compromisso: a.comp, endereco: '10.0.0.2' }, { meuId: 'theus', publicaEquipe: EQUIPE });
    assert.equal(p.abertos().length, 0, 'antes da revelação a gestão não vê o pedido (ainda não há código)');
    const naNova = codigo({ id: r.id, publica: a.k.publica, publicaEquipe: r.publicaEquipe, nonceGestao: r.nonce, nonceNova: a.n });
    const naGestao = p.revelar(r.id, r.segredo, a.n).codigo;
    assert.match(naGestao, /^\d{4}$/);
    assert.equal(naGestao, naNova, 'o mesmo código nas duas telas');
    assert.equal(p.abertos()[0].codigo, naNova);
    const base = { id: r.id, publica: a.k.publica, publicaEquipe: EQUIPE, nonceGestao: r.nonce, nonceNova: a.n };
    const variar = (campo, gerar) => new Set(Array.from({ length: 20 }, () => codigo(Object.assign({}, base, { [campo]: gerar() }))));
    ['nonceGestao', 'nonceNova'].forEach((c) => assert.ok(variar(c, novoNonce).size > 10, 'o código muda com ' + c));
    assert.ok(variar('publicaEquipe', () => token.fundar('X', 'y').publicaEquipe || novoNonce()).size > 10, 'o código muda com a chave da equipe');
    assert.ok(variar('publica', () => novaChave().publica).size > 10, 'o código muda com a chave do pedido');
  });

  it('quem está no meio não mói o código: sorteio fora do compromisso é recusado, e a mesma chave em outra grafia também', () => {
    const p = new Pedidos();
    const rita = nova(), ataque = nova();
    /* o atacante repassa o pedido da Rita com a chave dele; a gestão responde com o sorteio dela */
    const r = p.pedir({ nome: 'Rita', chavePublica: ataque.k.publica, compromisso: ataque.comp, endereco: '10.0.0.9' }, { publicaEquipe: EQUIPE });
    /* o código que a Rita vê (o atacante escolheu o sorteio que manda a ela antes de saber o da Rita) */
    const daRita = codigo({ id: r.id, publica: rita.k.publica, publicaEquipe: EQUIPE, nonceGestao: novoNonce(), nonceNova: rita.n });
    /* agora ele procura um sorteio que faça a gestão mostrar o mesmo código... */
    let moido = null, t = 0;
    while (!moido && t++ < 100000) { const n = novoNonce(); if (codigo({ id: r.id, publica: ataque.k.publica, publicaEquipe: EQUIPE, nonceGestao: r.nonce, nonceNova: n }) === daRita) moido = n; }
    assert.ok(moido, 'achou um sorteio que dá o mesmo código (é o ataque de moer)');
    /* ...mas o sorteio moído não é o do compromisso: a gestão recusa e o pedido morre */
    erro(() => p.revelar(r.id, r.segredo, moido), 400, /compromisso/);
    assert.equal(p.ver(r.id, r.segredo), null, 'compromisso quebrado: o pedido some');
    /* a mesma chave em outra grafia (quebra de linha, espaço) não entra: o código é sobre o DER canônico */
    const b = rita.k.publica;
    [b.slice(0, 10) + '\n' + b.slice(10), ' ' + b, b + '\n'].forEach((g) => erro(() => p.pedir({ nome: 'Rita', chavePublica: g, compromisso: rita.comp, endereco: 'x' + g.length }, { publicaEquipe: EQUIPE }), 400, /chave/));
    erro(() => compromisso(b.slice(0, 10) + '\n' + b.slice(10), rita.n), 400, /chave/);
    /* compromisso faltando ou torto */
    erro(() => p.pedir({ nome: 'Rita', chavePublica: b, endereco: 'y' }, { publicaEquipe: EQUIPE }), 400, /compromisso/);
    erro(() => p.pedir({ nome: 'Rita', chavePublica: b, compromisso: 'abc', endereco: 'y' }, { publicaEquipe: EQUIPE }), 400, /compromisso/);
  });

  it('o token aceito sai cifrado: só a chave efêmera do pedido abre; outra chave, outro id ou um byte trocado falham', () => {
    const k = novaChave(), outra = novaChave();
    const cif = cifrar('babel-segredo-de-teste', k.publica, 'pedido1');
    assert.ok(!JSON.stringify(cif).includes('babel-segredo'), 'o texto não aparece no cifrado');
    assert.equal(decifrar(cif, k.privada, 'pedido1'), 'babel-segredo-de-teste');
    assert.throws(() => decifrar(cif, outra.privada, 'pedido1'));
    assert.throws(() => decifrar(cif, k.privada, 'pedido2'));
    const d = Buffer.from(cif.dados, 'base64'); d[0] ^= 1;
    assert.throws(() => decifrar(Object.assign({}, cif, { dados: d.toString('base64') }), k.privada, 'pedido1'));
  });

  it('limites: nome até 40, chave X25519, 1 por endereço a cada 10 s, 5 abertos, validade de 10 min, nome de quem já está na equipe', () => {
    let agora = 1e12;
    const p = new Pedidos({ agora: () => agora });
    const ctx = { meuId: 'theus', publicaEquipe: EQUIPE, conhecidos: ['theus', 'ana'] };
    const pede = (nome, end, c = ctx) => { const x = nova(); return p.pedir({ nome, chavePublica: x.k.publica, compromisso: x.comp, endereco: end }, c); };
    erro(() => pede('', 'a'), 400);
    erro(() => pede('x'.repeat(41), 'a'), 400, /40/);
    erro(() => pede('Theus', 'a'), 400, /gestão/);
    erro(() => pede('Ana', 'a'), 409, /já tem alguém com o nome Ana/);
    erro(() => pede('ANA ', 'a'), 409, /já tem alguém/);
    erro(() => p.pedir({ nome: 'Rita', chavePublica: token.novasChaves().publica, compromisso: nova().comp, endereco: 'a' }, ctx), 400, /chave/); /* Ed25519 não serve */
    erro(() => p.pedir({ nome: 'Rita', chavePublica: 'lixo', compromisso: nova().comp, endereco: 'a' }, ctx), 400, /chave/);
    erro(() => pede('Rita', 'a', { meuId: 'x' }), 403, /não é da gestão/);
    pede('x'.repeat(40), 'a');
    erro(() => pede('Rita', 'a'), 429, /10 s/);
    agora += INTERVALO;
    pede('Rita', 'a');
    erro(() => pede('rita', 'z'), 409, /já tem um pedido com o nome/);
    ['b', 'c', 'd'].forEach((e) => pede('P' + e, e));
    assert.equal([...p.lista.values()].filter((x) => x.estado === 'aberto').length, 5);
    erro(() => pede('Sexta', 'e'), 429, /muitos/);
    const um = [...p.lista.values()][0];
    p.recusar(um.id);
    pede('Sexta', 'e'); /* recusado abre vaga; o pedido barrado antes não marcou o endereço */
    erro(() => pede('Sétima', 'f'), 429, /muitos/);
    agora += VALIDADE;
    p.limpar();
    assert.equal(p.lista.size, 0, 'depois de 10 min nada fica');
    pede('Sétima', 'f');
    assert.equal(p.lista.size, 1);
  });

  it('o pedido só se vê com o segredo; aceitar só depois do código; aceitar confere de novo o nome e entrega o token cifrado', () => {
    const p = new Pedidos();
    const a = nova();
    const r = p.pedir({ nome: 'Rita', chavePublica: a.k.publica, compromisso: a.comp, endereco: '1' }, { publicaEquipe: EQUIPE });
    assert.equal(p.ver(r.id, 'errado'), null);
    assert.equal(p.ver(r.id, ''), null);
    erro(() => p.revelar(r.id, 'errado', a.n), 404);
    erro(() => p.aceitar(r.id, () => 'x'), 409, /código/);
    const cod = p.revelar(r.id, r.segredo, a.n).codigo;
    assert.equal(p.revelar(r.id, r.segredo, a.n).codigo, cod, 'revelar de novo com o mesmo sorteio devolve o mesmo código');
    erro(() => p.revelar(r.id, r.segredo, novoNonce()), 409);
    assert.equal(p.ver(r.id, r.segredo).estado, 'aberto');
    erro(() => p.aceitar(r.id, () => 'x', ['rita']), 409, /já tem alguém/); /* alguém entrou com o token e o mesmo nome no meio tempo */
    p.aceitar(r.id, (nome) => 'token-de-' + nome, ['theus']);
    const v = p.ver(r.id, r.segredo);
    assert.equal(v.estado, 'aceito');
    assert.equal(decifrar(v.cifrado, a.k.privada, r.id), 'token-de-Rita');
    assert.throws(() => p.aceitar(r.id, () => 'de novo'), /não existe/);
    /* desistir tira o cartão da gestão */
    const b = nova();
    const r2 = p.pedir({ nome: 'Bia', chavePublica: b.k.publica, compromisso: b.comp, endereco: '2' }, { publicaEquipe: EQUIPE });
    p.revelar(r2.id, r2.segredo, b.n);
    assert.equal(p.abertos().length, 1);
    assert.equal(p.desistir(r2.id, 'errado'), null);
    assert.ok(p.desistir(r2.id, r2.segredo));
    assert.equal(p.abertos().length, 0);
  });

  it('a nova só entra depois de a pessoa confirmar o código, e recusa token de outra equipe', () => {
    const gestao = token.fundar('Theus', 'babel');
    const vizinho = token.fundar('Theus', 'babel'); /* mesma cara, outra equipe (outra chave) */
    const cfgDe = (f) => Object.assign({ porta: 5999 }, f, { papel: 'gestao' });
    const usados = [];
    const e = new Entrada({ cfg: () => ({}), pronto: () => false, json: () => {}, usarToken: (t) => usados.push(t), paraLocais: () => {} });
    const montar = () => { const k = novaChave(); e.meu = { id: 'p1', segredo: 's', host: '127.0.0.1', porta: 9, privada: k.privada, publica: k.publica, publicaEquipe: gestao.publicaEquipe, equipe: 'babel', gestao: 'Theus', nome: 'Rita', estado: 'aberto', confirmado: false, codigo: '1234' }; return k; };
    /* token do vizinho (outra chave da equipe): recusado mesmo cifrado certinho para a chave do pedido */
    let k = montar();
    e.aceitoChegou(cifrar(token.gerar(cfgDe(vizinho), { nome: 'Rita' }), k.publica, 'p1'));
    assert.equal(e.estadoMeu().estado, 'erro');
    assert.match(e.estadoMeu().erro, /equipe conferida/);
    assert.equal(usados.length, 0);
    /* token certo, mas a pessoa ainda não confirmou: espera */
    k = montar();
    e.aceitoChegou(cifrar(token.gerar(cfgDe(gestao), { nome: 'Rita' }), k.publica, 'p1'));
    assert.equal(e.estadoMeu().estado, 'aceito');
    assert.equal(usados.length, 0, 'sem a pessoa confirmar o código, nada entra');
    e.confirmar(true);
    assert.equal(e.estadoMeu().estado, 'dentro');
    assert.equal(usados.length, 1);
    assert.equal(token.ler(usados[0]).carteira.id, 'rita');
    /* confirmou antes: entra assim que o aceite chega */
    k = montar();
    e.confirmar(true);
    assert.equal(e.estadoMeu().estado, 'aberto');
    e.aceitoChegou(cifrar(token.gerar(cfgDe(gestao), { nome: 'Rita' }), k.publica, 'p1'));
    assert.equal(e.estadoMeu().estado, 'dentro');
    assert.equal(usados.length, 2);
    /* não bateu: o pedido morre e nada entra */
    k = montar();
    e.confirmar(false);
    assert.equal(e.estadoMeu().estado, 'nao-bateu');
    assert.throws(() => e.confirmar(true), /nenhum pedido/);
    e.parar();
  });

  it('anúncio forjado com o mesmo id da gestão não troca o endereço dela: os dois aparecem, marcados como repetidos', () => {
    const e = new Entrada({ cfg: () => ({}), pronto: () => false, json: () => {}, usarToken: () => {}, paraLocais: () => {} });
    const an = { coop: 1, entrada: 1, id: 'theus', equipe: 'babel', nome: 'Theus', porta: 4800 };
    e.ouvir(an, { address: '192.168.0.10' });
    assert.deepEqual(e.equipes().map((x) => [x.chave, x.repetida]), [['192.168.0.10:4800', false]]);
    for (let i = 0; i < 50; i++) e.ouvir(an, { address: '192.168.0.66' });
    const l = e.equipes();
    assert.deepEqual(l.map((x) => x.chave).sort(), ['192.168.0.10:4800', '192.168.0.66:4800'], 'a gestão verdadeira continua lá');
    assert.ok(l.every((x) => x.repetida), 'os dois vão marcados, com o endereço');
    for (let i = 0; i < 40; i++) e.ouvir(Object.assign({}, an, { id: 'x' + i }), { address: '10.1.0.' + i });
    assert.ok(e.ouvidas.size <= 16, 'inundar a rede não enche a memória');
    e.ouvir(Object.assign({}, an, { porta: 0 }), { address: '1.2.3.4' });
    e.ouvir(Object.assign({}, an, { entrada: 0 }), { address: '1.2.3.5' });
    assert.ok(![...e.ouvidas.keys()].some((k) => k.startsWith('1.2.3.')), 'anúncio sem porta ou sem entrada não conta');
  });
});

describe('entrada · duas Estações de verdade', { timeout: 120000 }, () => {
  const T = new Estacao({ nome: 'entrada-theus', porta: 5457, descoberta: UDP });
  const N = new Estacao({ nome: 'entrada-nova', porta: 5458, descoberta: UDP });
  const ip = ipDaRede();
  const cfgT = () => JSON.parse(fs.readFileSync(path.join(T.raiz, 'coop.json'), 'utf8'));
  /* cliente à mão: as duas voltas do pedido */
  async function aMao(nome, extra) {
    const x = nova();
    const r = await T.api('POST', '/api/entrar/pedido', { nome, chavePublica: x.k.publica, compromisso: x.comp }, extra);
    return Object.assign(x, { r });
  }
  const revelar = (r, n) => T.api('POST', '/api/entrar/pedido/' + r.json.id + '/revelar', { nonce: n }, { headers: { 'X-Coop-Pedido': r.json.segredo } });

  before(async () => {
    await Promise.all([T.subir(), N.subir()]);
    const f = await T.api('POST', '/api/fundar', { nome: 'Theus' });
    assert.equal(f.status, 200, JSON.stringify(f.json));
  });
  after(async () => { await Promise.all([T.parar(), N.parar()]); });

  it('o anúncio UDP da gestão diz equipe, nome, porta e que aceita pedidos, e nada de segredo', async () => {
    const udp = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    const visto = await new Promise((ok, falhou) => {
      const t = setTimeout(() => { udp.close(); falhou(new Error('nenhum anúncio em 6 s')); }, 6000);
      udp.on('message', (b) => { let m; try { m = JSON.parse(b.toString()); } catch (e) { return; } if (m.id === 'theus' && m.porta === 5457) { clearTimeout(t); udp.close(); ok({ m, cru: b.toString() }); } });
      udp.bind(UDP);
    });
    assert.deepEqual(Object.keys(visto.m).sort(), ['coop', 'entrada', 'equipe', 'id', 'nome', 'porta']);
    assert.deepEqual([visto.m.equipe, visto.m.nome, visto.m.entrada], ['babel', 'Theus', 1]);
    const cfg = cfgT();
    [cfg.segredo, cfg.privada, cfg.privadaEquipe].forEach((s) => assert.ok(s && !visto.cru.includes(s), 'segredo no anúncio'));
  });

  it('o cliente à mão pede em duas voltas: o token volta cifrado, só a chave dele abre, e quem escuta o Wi-Fi não lê nada', async () => {
    const z = await aMao('Zeca');
    assert.equal(z.r.status, 200, JSON.stringify(z.r.json));
    assert.deepEqual([z.r.json.equipe, z.r.json.gestao, z.r.json.publicaEquipe], ['babel', 'Theus', cfgT().publicaEquipe]);
    assert.equal((await T.api('GET', '/api/entrar/pedidos')).json.lista.length, 0, 'sem revelar, a gestão não vê o pedido');
    /* 1 por endereço a cada 10 s */
    const de = await aMao('Outro');
    assert.equal(de.r.status, 429, JSON.stringify(de.r.json));
    /* sem o segredo o pedido "não existe"; com Origin de navegador, recusado */
    assert.equal((await T.api('GET', '/api/entrar/pedido/' + z.r.json.id)).status, 404);
    assert.equal((await T.api('GET', '/api/entrar/pedido/' + z.r.json.id, null, { headers: { 'X-Coop-Pedido': 'x' } })).status, 404);
    assert.equal((await T.api('POST', '/api/entrar/pedido/' + z.r.json.id + '/revelar', { nonce: z.n }, { headers: { 'X-Coop-Pedido': 'x' } })).status, 404);
    assert.equal((await aMao('Pagina', { headers: { Origin: 'http://evil.example' } })).r.status, 403);
    assert.equal((await T.api('POST', '/api/entrar/pedido/' + z.r.json.id + '/revelar', { nonce: z.n }, { headers: { 'X-Coop-Pedido': z.r.json.segredo, Origin: 'http://evil.example' } })).status, 403);
    const rev = await revelar(z.r, z.n);
    assert.equal(rev.status, 200, JSON.stringify(rev.json));
    const esperado = codigo({ id: z.r.json.id, publica: z.k.publica, publicaEquipe: z.r.json.publicaEquipe, nonceGestao: z.r.json.nonce, nonceNova: z.n });
    assert.equal(rev.json.codigo, esperado, 'o mesmo código dos dois lados');
    const ver = () => T.api('GET', '/api/entrar/pedido/' + z.r.json.id, null, { headers: { 'X-Coop-Pedido': z.r.json.segredo } });
    assert.equal((await ver()).json.estado, 'aberto');
    /* a gestão vê o pedido com o mesmo código; aceitar/recusar/ver a lista só da tela local */
    const lista = (await T.api('GET', '/api/entrar/pedidos')).json.lista;
    assert.deepEqual(lista.map((p) => [p.nome, p.codigo]), [['Zeca', esperado]]);
    if (ip) {
      assert.equal((await T.api('POST', '/api/entrar/aceitar', { id: z.r.json.id }, { host: ip })).status, 403, 'aceitar pela rede');
      assert.equal((await T.api('GET', '/api/entrar/pedidos', null, { host: ip })).status, 403, 'lista pela rede');
      assert.equal((await T.api('POST', '/api/entrar/confirmar', { bateu: true }, { host: ip })).status, 403, 'confirmar pela rede');
    }
    const ac = await T.api('POST', '/api/entrar/aceitar', { id: z.r.json.id });
    assert.equal(ac.status, 200, JSON.stringify(ac.json));
    const v = (await ver()).json;
    assert.equal(v.estado, 'aceito');
    const cru = JSON.stringify(v);
    assert.ok(!/babel-/.test(cru), 'o token não passa em claro');
    assert.ok(!cru.includes(cfgT().segredo), 'o segredo da equipe não passa em claro');
    assert.throws(() => decifrar(v.cifrado, novaChave().privada, z.r.json.id), 'outra chave não abre');
    const t = token.ler(decifrar(v.cifrado, z.k.privada, z.r.json.id));
    assert.deepEqual([t.carteira.id, t.carteira.nome, t.carteira.papel, t.equipe, t.publicaEquipe], ['zeca', 'Zeca', 'membro', 'babel', z.r.json.publicaEquipe]);
    assert.ok(!t.privadaEquipe, 'membro não leva a chave da equipe');
    assert.deepEqual((await T.api('GET', '/api/entrar/pedidos')).json.lista, []);
  });

  it('Estação sem equipe não aceita pedido (não é da gestão)', async () => {
    const x = nova();
    const r = await N.api('POST', '/api/entrar/pedido', { nome: 'Ana', chavePublica: x.k.publica, compromisso: x.comp });
    assert.equal(r.status, 403);
    assert.match(r.json.erro, /não é da gestão/);
  });

  it('a Estação nova acha a equipe, pede, a gestão recusa; pede de novo, a gestão aceita, a pessoa confirma o código e entra', { skip: !ip && 'sem IPv4 da rede local' }, async (t) => {
    const t0 = Date.now();
    let achou = null;
    while (!achou && Date.now() - t0 < 8000) {
      const r = (await N.api('GET', '/api/entrar/procurar')).json;
      achou = (r.equipes || []).find((e) => e.gestao === 'Theus');
      if (!achou) await esperar(300);
    }
    assert.ok(achou, 'a nova não achou a equipe em 8 s');
    assert.equal(achou.equipe, 'babel');
    t.diagnostic('achou "Equipe ' + achou.equipe + ' · ' + achou.gestao + '" em ' + (Date.now() - t0) + ' ms (' + achou.chave + ')');
    /* pedido da tela local da nova (nome com mais de 40 recusado já na nova; confirmar sem pedido, recusado) */
    assert.equal((await N.api('POST', '/api/entrar/pedir', { chave: achou.chave, nome: 'r'.repeat(41) })).status, 400);
    assert.equal((await N.api('POST', '/api/entrar/confirmar', { bateu: true })).status, 409);
    const p1 = await N.api('POST', '/api/entrar/pedir', { chave: achou.chave, nome: 'Rita' });
    assert.equal(p1.status, 200, JSON.stringify(p1.json));
    assert.match(p1.json.codigo, /^\d{4}$/);
    const naGestao = (await T.api('GET', '/api/entrar/pedidos')).json.lista;
    assert.equal(naGestao.length, 1);
    assert.deepEqual([naGestao[0].nome, naGestao[0].codigo], ['Rita', p1.json.codigo], 'o mesmo código nas duas telas');
    assert.equal((await T.api('POST', '/api/entrar/recusar', { id: naGestao[0].id })).status, 200);
    const estado = async (quer, ms = 8000) => {
      const fim = Date.now() + ms;
      for (;;) { const r = (await N.api('GET', '/api/entrar/procurar')).json; if (r.pedido && r.pedido.estado === quer) return r; if (Date.now() > fim) throw new Error('esperava ' + quer + ': ' + JSON.stringify(r)); await esperar(200); }
    };
    await estado('recusado');
    assert.equal((await N.eu()).pronto, false, 'recusado não entra');
    /* pedir de novo: 10 s por endereço */
    assert.equal((await N.api('POST', '/api/entrar/cancelar', {})).status, 200);
    await esperar(INTERVALO + 200);
    const p2 = await N.api('POST', '/api/entrar/pedir', { chave: achou.chave, nome: 'Rita' });
    assert.equal(p2.status, 200, JSON.stringify(p2.json));
    assert.equal(p2.json.confirmado, false);
    const id2 = (await T.api('GET', '/api/entrar/pedidos')).json.lista[0].id;
    /* a gestão aceita primeiro: a nova recebe, mas só entra quando a pessoa confirmar o código */
    assert.equal((await T.api('POST', '/api/entrar/aceitar', { id: id2 })).status, 200);
    await estado('aceito');
    assert.equal((await N.eu()).pronto, false, 'aceito sem a pessoa confirmar o código: ainda fora');
    const conf = await N.api('POST', '/api/entrar/confirmar', { bateu: true });
    assert.equal(conf.status, 200, JSON.stringify(conf.json));
    const fim = Date.now() + 10000;
    let eu = null;
    while (Date.now() < fim) { eu = await N.eu(); if (eu.pronto) break; await esperar(200); }
    assert.deepEqual([eu.pronto, eu.id, eu.nome, eu.papel, eu.equipe], [true, 'rita', 'Rita', 'membro', 'babel']);
    await T.esperarPar('rita');
    await N.esperarPar('theus');
    /* agora a nova é membro: pedido a ela é recusado; e na gestão, "Rita" já é nome de alguém da equipe */
    const x = nova();
    assert.equal((await N.api('POST', '/api/entrar/pedido', { nome: 'Bia', chavePublica: x.k.publica, compromisso: x.comp })).status, 403);
    const dup = await aMao('Rita');
    assert.equal(dup.r.status, 409, JSON.stringify(dup.r.json));
    assert.match(dup.r.json.erro, /já tem alguém com o nome Rita/);
    t.diagnostic('da primeira procura até o Theus ver a Rita ligada: ' + (Date.now() - t0) + ' ms (inclui 10 s de espera entre pedidos)');
  });
});
