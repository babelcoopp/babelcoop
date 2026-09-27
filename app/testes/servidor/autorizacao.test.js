/* Babel Coop · autorização no servidor de quem executa (CHECKLIST: "Toda ação é autorizada no servidor de quem executa, nunca só na tela")
   Theus funda (gestão) · Mara entra por convite (membro) · Caio é um par escrito à mão com convite de verdade.
   1) celular/iPad pela rede: 'fazer' só passa o que o iPad usa (quadro e TV); o resto volta como {tipo:'erro'} e não entra no diário.
   1b) a página aberta pelo IP recebe COOP_REAL.remoto (acoes.js nem aplica o resto); a desta máquina não.
   2) diário: evento de fora só entra com a assinatura do autor (carteira certificada pela equipe), ao vivo e na sincronização;
      um par não põe evento na conta da gestão nem pula o cursor dela; o evento de terceiro assinado continua passando.
   3) Oficina: membro não publica atualização do app (403); a gestão publica.
   Portas só deste arquivo: HTTP 4974–4975, UDP 41474.
   Rodar: cd app && node --test testes/servidor/autorizacao.test.js
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const token = require('../../servidor/token');
const { Diario, assinarEvento, motivoEvento } = require('../../servidor/diario');
const { Estacao, Navegador, ParFalso, ipDaRede, esperar } = require('./estacoes');

const UDP = 41474;
const G = new Estacao({ nome: 'gestao', porta: 4974, descoberta: UDP });
const M = new Estacao({ nome: 'membro', porta: 4975, descoberta: UDP });
const IP = ipDaRede();
const QUADRO_VAZIO = JSON.stringify({ itens: [] });

let theus = null, mara = null, convites = {};
const diarioDe = async (e) => (await e.api('GET', '/api/diario')).json;
async function esperarNoDiario(e, pred, oque, ms = 8000) {
  const fim = Date.now() + ms;
  while (Date.now() < fim) { const ev = (await diarioDe(e)).find(pred); if (ev) return ev; await esperar(120); }
  throw new Error('tempo esgotado esperando no diário: ' + oque);
}

describe('diário (unidade): o autor de um evento de par é quem o numerou', () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'babel-diario-'));
  after(() => { try { fs.rmSync(pasta, { recursive: true, force: true }); } catch (e) { /* temporário */ } });
  const ev = (autor, seq, extra) => Object.assign({ id: autor + ':' + seq, autor, seq, ts: Date.now(), quem: autor, acao: 'recado', args: ['oi'] }, extra || {});

  it('aceita o evento do próprio par e o de terceiros repassado na sincronização (sem `de`)', () => {
    const d = new Diario(path.join(pasta, 'a.jsonl'), 'theus');
    assert.equal(d.aceitar(ev('rita', 1), 'rita'), true, 'evento ao vivo do próprio par');
    assert.equal(d.aceitar(ev('bruno', 1)), true, 'evento do Bruno repassado pela Rita na sincronização');
    assert.deepEqual(d.cursores(), { rita: 1, bruno: 1 });
  });

  it('recusa quem ≠ autor, id ≠ autor:seq, seq inválido, autor = eu e, com `de`, autor ≠ quem mandou', () => {
    const d = new Diario(path.join(pasta, 'b.jsonl'), 'theus');
    assert.equal(d.aceitar(ev('rita', 1, { quem: 'theus', acao: 'visita', args: [true] })), false, 'a Rita pondo ação na conta do Theus');
    assert.equal(d.aceitar(ev('rita', 2, { id: 'rita:9' })), false, 'id que não bate com autor:seq');
    assert.equal(d.aceitar(ev('rita', 0)), false, 'seq 0');
    assert.equal(d.aceitar(Object.assign(ev('rita', 3), { seq: '3' })), false, 'seq em texto');
    assert.equal(d.aceitar(ev('theus', 1)), false, 'evento com o meu autor vindo de fora');
    assert.equal(d.aceitar(ev('bruno', 1), 'rita'), false, 'ao vivo, a Rita mandando evento com autor Bruno');
    assert.equal(d.todos().length, 0);
    assert.equal(fs.existsSync(path.join(pasta, 'b.jsonl')), false, 'nada foi para o disco');
  });
});

describe('diário (unidade): assinatura do autor', () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'babel-assinado-'));
  after(() => { try { fs.rmSync(pasta, { recursive: true, force: true }); } catch (e) { /* temporário */ } });
  /* uma equipe de verdade: Theus funda, Rita ganha carteira; outra equipe à parte */
  const theusCfg = token.fundar('Theus', 'babel');
  const conv = (gestao, id) => { const ch = token.novasChaves(); const c = token.emitirCarteira(gestao, { id, nome: id, papel: 'membro', chave: ch.publica }); return { id, carteira: c.carteira, assinatura: c.assinatura, privada: ch.privada }; };
  const rita = conv(theusCfg, 'rita');
  const fora = token.fundar('Theus', 'outra');
  const ev = (autor, seq, extra) => Object.assign({ id: autor + ':' + seq, autor, seq, ts: Date.now(), quem: autor, acao: 'recado', args: ['oi', { a: 1, b: [null, 2] }] }, extra || {});
  const diarioDoTheus = (arq) => { const d = new Diario(path.join(pasta, arq), 'theus'); d.conferir = (e) => !motivoEvento(e, theusCfg); return d; };

  it('evento assinado pelo autor entra (inclusive repassado); forjado, alterado ou de outra equipe não', () => {
    const d = diarioDoTheus('a.jsonl');
    const bom = JSON.parse(JSON.stringify(assinarEvento(ev('rita', 1), rita))); /* ida e volta pela rede */
    assert.equal(motivoEvento(bom, theusCfg), null);
    assert.equal(d.aceitar(bom), true, 'evento da Rita, assinado por ela');
    assert.equal(d.aceitar(ev('rita', 2)), false, 'sem assinatura');
    assert.equal(d.aceitar(Object.assign(JSON.parse(JSON.stringify(assinarEvento(ev('rita', 3), rita))), { args: ['mudado'] })), false, 'alterado depois de assinado');
    /* a Rita tentando pôr um evento na conta do Theus: com a carteira dela o autor não bate; com a do Theus a assinatura não confere */
    const comCarteiraDela = assinarEvento(ev('theus', 5000, { acao: 'visita', args: [true] }), rita);
    assert.equal(d.aceitar(comCarteiraDela), false, 'carteira da Rita num evento do Theus');
    const comCarteiraDele = Object.assign(ev('theus', 5000, { acao: 'visita', args: [true] }), { carteira: theusCfg.carteira, cass: theusCfg.assinatura });
    comCarteiraDele.ass = token.assinar(rita.privada, 'qualquer coisa');
    assert.equal(d.aceitar(comCarteiraDele), false, 'carteira do Theus, assinatura da Rita');
    const outra = conv(fora, 'rita');
    assert.equal(d.aceitar(assinarEvento(ev('rita', 4), outra)), false, 'carteira de outra equipe');
    assert.deepEqual(d.cursores(), { rita: 1 }, 'o cursor do Theus não pulou');
  });

  it('o evento meu sai assinado e o histórico de antes da assinatura ganha assinatura (assinarMeus)', () => {
    const arq = path.join(pasta, 'b.jsonl');
    const antigo = new Diario(arq, 'rita');
    antigo.anexar('rita', 'recado', ['de antes da assinatura']);
    const d = new Diario(arq, 'rita');
    assert.equal(d.eventos[0].ass, undefined);
    d.assinar = (e) => assinarEvento(e, rita);
    assert.equal(d.assinarMeus(), 1);
    const novo = d.anexar('rita', 'recado', ['assinado'], 'janela-1');
    const t = diarioDoTheus('c.jsonl');
    assert.equal(t.aceitar(JSON.parse(JSON.stringify(d.eventos[0]))), true, 'o antigo, assinado agora');
    assert.equal(t.aceitar(JSON.parse(JSON.stringify(novo))), true, 'o novo, com origem');
  });
});

describe('autorização no servidor de quem executa (Estações de verdade)', { timeout: 90000 }, () => {
  before(async () => {
    await Promise.all([G.subir(), M.subir()]);
    const f = await G.api('POST', '/api/fundar', { nome: 'Theus' });
    assert.equal(f.status, 200, f.texto);
    theus = f.json;
    assert.equal(theus.papel, 'gestao');
    for (const nome of ['Mara', 'Caio', 'Bruno']) {
      const r = await G.api('POST', '/api/convite', { nome, papel: 'membro' });
      assert.equal(r.status, 200, r.texto);
      convites[nome.toLowerCase()] = r.json.token;
    }
    const t = await M.api('POST', '/api/token', { token: convites.mara });
    assert.equal(t.status, 200, t.texto);
    mara = t.json;
    assert.equal(mara.papel, 'membro');
  });
  after(async () => { await Promise.all([G.parar(), M.parar()]); });

  it('1) celular/iPad pela rede: só quadro e TV entram no diário (assinados pelo dono); o resto volta como erro; a Estação local segue igual', async (t) => {
    if (!IP) { t.skip('sem IPv4 de rede nesta máquina: o caso do aparelho pela rede ficou de fora'); return; }
    const cel = new Navegador('ws://' + IP + ':' + G.porta + '/ws', 'http://' + IP + ':' + G.porta);
    await cel.aberto;
    const bv = await cel.esperar((m) => m.tipo === 'bemvindo');
    assert.equal(bv.eu.id, theus.id);

    const recusadas = [
      ['novaDemanda', [{ titulo: 'demanda forjada pelo celular' }]],
      ['oficinaPublicar', ['versão forjada']],
      ['visita', [true]],
      ['temaTv', ['azul']],
      ['regra', ['pausaAutomatica', true]],
      ['encerrarProjecao', []],
      ['pararCronometroTv', []],
      ['toString', []],
      ['constructor', []],
      ['criarArquivo', ['theus/segredo.md', 'md', 'oi']],
      ['criarArquivo', ['equipe/Quadros/../fora.quadro', 'quadro', QUADRO_VAZIO]],
      ['criarArquivo', ['equipe/Quadros/Cheio.quadro', 'quadro', JSON.stringify({ itens: [{ tipo: 'texto', texto: 'x' }] })]],
      ['tvModo', ['site']],
      ['tvModo', ['reuniao']],
      ['quadroItem', ['f-1', 'não é objeto']]
    ];
    for (const [acao, args] of recusadas) {
      const d = cel.msgs.length;
      cel.enviar({ tipo: 'fazer', acao, args, origem: 'cel-x' });
      const e = await cel.esperar((m) => m.tipo === 'erro', { desde: d, oque: 'erro de ' + acao });
      assert.match(e.erro, /Pela rede só o quadro e a TV/, acao);
      assert.equal(e.contexto, 'fazer');
    }

    const permitidas = [
      ['criarArquivo', ['equipe/Quadros/Quadro do iPad 2026-09-24 10h00.quadro', 'quadro', QUADRO_VAZIO]],
      ['quadroItem', ['f-1', { tipo: 'postit', x: 10, y: 20, w: 180, h: 120, texto: 'Nova ideia' }]],
      ['quadroMudar', ['f-1', 'q-1', { texto: 'mudou' }]],
      ['quadroApagar', ['f-1', 'q-1']],
      ['tvModo', ['quadro', 'f-1']],
      ['tvModo', ['painel', null]]
    ];
    for (const [acao, args] of permitidas) {
      const d = cel.msgs.length;
      cel.enviar({ tipo: 'fazer', acao, args, origem: 'cel-ok' });
      const m = await cel.esperar((x) => (x.tipo === 'evento' && x.evento.acao === acao && x.evento.origem === 'cel-ok') || x.tipo === 'erro', { desde: d, oque: 'evento de ' + acao });
      assert.equal(m.tipo, 'evento', acao + ' foi recusada: ' + JSON.stringify(m));
      assert.equal(m.evento.quem, theus.id);
      assert.deepEqual(m.evento.args, args);
    }

    await esperar(300);
    const diario = await diarioDe(G);
    const nomesRecusados = new Set(recusadas.map((r) => r[0]));
    assert.deepEqual(diario.filter((ev) => nomesRecusados.has(ev.acao) && ev.acao !== 'criarArquivo' && ev.acao !== 'tvModo' && ev.acao !== 'quadroItem'), [], 'nenhuma recusada entrou');
    assert.equal(diario.filter((ev) => ev.acao === 'criarArquivo').length, 1, 'só o quadro vazio em equipe/Quadros entrou');
    assert.equal(diario.filter((ev) => ev.acao === 'tvModo').length, 2, 'só quadro e painel entraram');
    assert.equal(diario.filter((ev) => ev.acao === 'quadroItem').length, 1);
    cel.fechar();

    /* a Estação desta máquina continua fazendo qualquer ação (o que ela pode, a tela e as regras de acoes.js decidem) */
    const nav = await G.navegador();
    nav.enviar({ tipo: 'fazer', acao: 'novaDemanda', args: [{ titulo: 'demanda da própria Estação' }], origem: 'local-1' });
    const ev = await esperarNoDiario(G, (x) => x.acao === 'novaDemanda' && x.origem === 'local-1', 'a demanda local');
    assert.equal(ev.quem, theus.id);
    nav.fechar();
  });

  it('1b) a página aberta pelo IP recebe a lista do que o servidor aceita dela; a desta máquina não', async (t) => {
    const daPagina = (html) => { const m = html.match(/window\.COOP_REAL = (\{.*?\});<\/script>/); assert.ok(m, 'COOP_REAL injetado'); return JSON.parse(m[1]); };
    const local = daPagina(await (await fetch('http://127.0.0.1:' + G.porta + '/index.html')).text());
    assert.equal(local.remoto, undefined, 'a Estação desta máquina faz tudo');
    if (!IP) { t.skip('sem IPv4 de rede nesta máquina'); return; }
    const remoto = daPagina(await (await fetch('http://' + IP + ':' + G.porta + '/index.html')).text());
    assert.deepEqual(remoto.remoto.slice().sort(), ['criarArquivo', 'quadroApagar', 'quadroItem', 'quadroMudar', 'tvModo']);
  });

  /* três pessoas: o Caio (par escrito à mão) fala com a Estação da Mara e tenta pôr eventos na conta do Theus (a gestão);
     o Bruno nunca ligou na Mara, então o evento dele só chega repassado pelo Caio */
  it('2) par de verdade (carteira do convite): só entra evento assinado pelo autor, ao vivo e na sincronização', async () => {
    const caio = Object.assign(token.ler(convites.caio), { porta: 9 });
    caio.id = caio.carteira.id;
    const bruno = token.ler(convites.bruno);
    /* antes: os eventos de verdade do Theus (o teste 1) chegam à Mara pela rede, assinados */
    await esperarNoDiario(M, (x) => x.autor === theus.id && x.acao === 'quadroItem', 'um evento do Theus replicado na Mara', 15000);
    const par = new ParFalso(M.porta, { cfg: caio });
    /* a Estação manda a lista de eventos só depois de conferir o ola: daí em diante o canal selado vale */
    await par.esperar((m) => m.tipo === 'eventos', 8000);
    const agora = Date.now();
    const doCaio = (seq, extra) => assinarEvento(Object.assign({ id: caio.id + ':' + seq, autor: caio.id, seq, ts: agora, quem: caio.id, acao: 'recado', args: ['do caio ' + seq] }, extra || {}), caio);
    /* forja: autor = quem = Theus (a gestão), com a carteira do Caio ou sem assinatura; seq alto para pular o cursor */
    const forjado = (seq, carteiraDeQuem) => Object.assign({ id: theus.id + ':' + seq, autor: theus.id, seq, ts: agora, quem: theus.id, acao: 'visita', args: [true] },
      carteiraDeQuem ? { carteira: carteiraDeQuem.carteira, cass: carteiraDeQuem.assinatura, ass: token.assinar(caio.privada, 'x') } : {});
    par.selado({ tipo: 'evento', evento: forjado(5000) });
    par.selado({ tipo: 'evento', evento: forjado(5001, caio) });
    par.selado({ tipo: 'evento', evento: doCaio(1, { quem: theus.id, acao: 'visita', args: [true] }) });
    par.selado({ tipo: 'evento', evento: Object.assign(doCaio(2), { args: ['alterado no caminho'] }) });
    par.selado({ tipo: 'evento', evento: { id: caio.id + ':4', autor: caio.id, seq: 4, ts: agora, quem: caio.id, acao: 'recado', args: ['sem assinatura'] } });
    par.selado({ tipo: 'eventos', lista: [
      forjado(5002),
      forjado(5003, caio),
      Object.assign(forjado(5004), { carteira: caio.carteira, cass: caio.assinatura }),
      doCaio(3),
      assinarEvento({ id: bruno.carteira.id + ':1', autor: bruno.carteira.id, seq: 1, ts: agora, quem: bruno.carteira.id, acao: 'recado', args: ['do bruno, repassado'] }, bruno),
      { id: 'ze:1', autor: 'ze', seq: 1, ts: agora, quem: 'ze', acao: 'recado', args: ['zé, sem carteira'] }
    ] });
    await esperarNoDiario(M, (x) => x.id === bruno.carteira.id + ':1', 'o evento do Bruno repassado pelo Caio');
    await esperarNoDiario(M, (x) => x.id === caio.id + ':3', 'o evento assinado do próprio Caio');
    await esperar(300);
    const diario = await diarioDe(M);
    assert.ok(!diario.some((x) => x.autor === theus.id && x.seq >= 5000), 'nenhum evento forjado na conta do Theus (ao vivo ou na lista)');
    assert.ok(!diario.some((x) => x.acao === 'visita'), 'o modo visita não ligou');
    for (const id of [caio.id + ':1', caio.id + ':2', caio.id + ':4', 'ze:1']) assert.ok(!diario.some((x) => x.id === id), id + ' recusado');
    assert.ok(!diario.some((x) => x.autor !== theus.id && x.quem !== x.autor), 'nenhum evento de fora com quem ≠ autor');
    /* o cursor do Theus na Mara não pulou: ela segue pedindo os eventos de verdade dele */
    const doTheus = diario.filter((x) => x.autor === theus.id);
    assert.ok(doTheus.length > 0 && doTheus.every((x) => x.seq < 5000));
    assert.ok(doTheus.every((x) => typeof x.ass === 'string' && x.carteira && x.carteira.id === theus.id), 'os eventos do Theus chegam assinados');
    assert.ok(!(await diarioDe(G)).some((x) => x.autor === theus.id && x.seq >= 5000));
    par.fechar();
  });

  it('3) Oficina: membro recebe 403 ao publicar atualização do app; a gestão publica', async () => {
    const r = await M.api('POST', '/api/app/publicar', { notas: 'versão do membro' });
    assert.equal(r.status, 403, r.texto);
    assert.match(r.json.erro, /só a gestão publica atualização do app/);
    assert.equal((await M.api('GET', '/api/app/manifesto')).status, 404, 'nada publicado na Estação do membro');
    assert.ok(!(await diarioDe(M)).some((ev) => ev.acao === 'oficinaPublicar'), 'nenhum evento oficinaPublicar do membro');

    const g = await G.api('POST', '/api/app/publicar', { notas: 'v1 de teste' });
    assert.equal(g.status, 200, g.texto);
    assert.equal(g.json.versao, 1);
    assert.equal(g.json.por, theus.id);
    assert.ok(g.json.arquivos.some((a) => a.caminho === 'index.html'));
    const ev = await esperarNoDiario(G, (x) => x.acao === 'oficinaPublicar', 'o evento da publicação');
    assert.equal(ev.quem, theus.id);
  });
});
