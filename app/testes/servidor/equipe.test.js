/* Babel Coop · teste de integração do servidor: três Estações de verdade na mesma máquina
   Theus (gestão, funda) · Rita e Bruno (membros, por convite) · Duda (só pelo encontro do token) · Caio (convite usado por um par escrito à mão).
   Portas só deste arquivo: HTTP 4810–4814, UDP 41310 (compartilhada: descoberta) e 41311 (Duda, sozinha).
   Cobre PROTOCOLO §1–§5 e os aceites A6–A12 da missão babel-coop/terminal-ao-vivo.
   Rodar: cd app && node --test testes/servidor/
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const token = require('../../servidor/token');
const { Estacao, Navegador, ParFalso, pedirHttp, ipDaRede, buscarNoDisco, percentil, esperar, APP } = require('./estacoes');

const UDP = 41310;
const T = new Estacao({ nome: 'theus', porta: 4810, descoberta: UDP });
const R = new Estacao({ nome: 'rita', porta: 4811, descoberta: UDP });
const B = new Estacao({ nome: 'bruno', porta: 4812, descoberta: UDP });
const D = new Estacao({ nome: 'duda', porta: 4813, descoberta: 41311 });
const TODAS = [T, R, B, D];

/* o marcador do A10/A11 nasce aqui, na memória: nunca aparece inteiro no código, na linha de comando nem no log */
const PARTES = ['MARCA', crypto.randomBytes(6).toString('hex').toUpperCase()];
const MARCADOR = PARTES.join('');
const IP = ipDaRede();

let nav = {};          /* navegadores locais de cada Estação */
let convites = {};     /* tokens */
const pids = [];       /* PIDs dos shells abertos (conferidos no fim) */
const semMarcador = (texto, onde) => assert.ok(!String(texto).includes(MARCADOR), 'o marcador vazou em ' + onde);
const prompt = (s) => / % $|% \u001b\[K/.test(s);

describe('Estações de verdade: carteira, transmissão, controle, pausa e nada em disco', { timeout: 180000 }, () => {
  before(async () => { await Promise.all([T.subir(), R.subir(), B.subir(), D.subir()]); });
  after(async () => { await Promise.all(TODAS.map((e) => e.parar())); });

  it('a) Theus funda (gestão), convida Rita e Bruno; as Estações se veem pelo encontro do token e pela descoberta, com id e papel da carteira', async (t) => {
    const f = await T.api('POST', '/api/fundar', { nome: 'Theus' });
    assert.equal(f.status, 200, f.texto);
    assert.deepEqual([f.json.id, f.json.papel, f.json.pronto], ['theus', 'gestao', true]);
    const coop = JSON.parse(fs.readFileSync(path.join(T.raiz, 'coop.json'), 'utf8'));
    assert.equal(fs.statSync(path.join(T.raiz, 'coop.json')).mode & 0o777, 0o600, 'coop.json com as chaves em modo 600');
    assert.equal(coop.carteira.papel, 'gestao');
    assert.ok(token.conferir(coop.publicaEquipe, token.canonico(coop.carteira), coop.assinatura), 'carteira do fundador assinada pela chave da equipe');

    for (const [nome, papel] of [['Rita', 'membro'], ['Bruno', 'membro'], ['Duda', 'membro'], ['Caio', 'membro']]) {
      const r = await T.api('POST', '/api/convite', { nome, papel });
      assert.equal(r.status, 200, r.texto);
      assert.match(r.json.token, /^babel-/);
      convites[nome.toLowerCase()] = r.json.token;
    }
    const lido = token.ler(convites.rita);
    assert.equal(lido.v, 2);
    assert.equal(lido.carteira.id, 'rita');
    assert.equal(lido.privadaEquipe, undefined, 'membro não recebe a chave da equipe');
    assert.ok(lido.encontro.length > 0, 'o token traz onde achar o Theus');
    t.diagnostic('encontro no token: ' + lido.encontro.join(', '));

    /* só a gestão convida, e só pelo navegador local */
    const r1 = await R.api('POST', '/api/token', { token: convites.rita });
    assert.equal(r1.status, 200, r1.texto);
    assert.deepEqual([r1.json.id, r1.json.papel], ['rita', 'membro']);
    const b1 = await B.api('POST', '/api/token', { token: convites.bruno });
    assert.equal(b1.status, 200, b1.texto);
    assert.equal((await R.api('POST', '/api/convite', { nome: 'X' })).status, 403, 'membro não convida');
    assert.equal((await R.api('POST', '/api/token', { token: convites.bruno })).status, 400, 'quem já está na equipe não troca de identidade');

    await T.esperarPar('rita'); await T.esperarPar('bruno');
    await R.esperarPar('theus'); await R.esperarPar('bruno');
    await B.esperarPar('theus'); await B.esperarPar('rita');
    const vistosPeloTheus = await T.pares();
    assert.deepEqual(vistosPeloTheus.filter((p) => p.ligado).map((p) => [p.id, p.nome, p.papel]).sort(), [['bruno', 'Bruno', 'membro'], ['rita', 'Rita', 'membro']]);
    assert.equal((await R.pares()).find((p) => p.id === 'theus').papel, 'gestao', 'o papel da gestão vem da carteira');
    t.diagnostic('Rita↔Bruno não estão no token um do outro: a ligação veio da descoberta UDP');

    /* Duda, numa porta UDP só dela: só o encontro do token a liga ao Theus */
    const d1 = await D.api('POST', '/api/token', { token: convites.duda });
    assert.equal(d1.status, 200, d1.texto);
    await D.esperarPar('theus');
    await T.esperarPar('duda');
    await esperar(2500); /* um ciclo inteiro de anúncios */
    assert.deepEqual((await D.pares()).map((p) => p.id), ['theus'], 'Duda (sem descoberta) só acha quem estava no token');
    await D.parar();
    await T.esperarPar('duda', (p) => !p.ligado);
  });

  it('b) A6 · Bruno assiste um terminal da Rita: recebe a saída e o tamanho quando a Rita redimensiona', async () => {
    nav.rita = await R.navegador();
    nav.bruno = await B.navegador();
    nav.theus = await T.navegador();
    nav.rita.enviar({ tipo: 'term-abrir', id: 'r1', nome: 'agente-rita', cols: 100, rows: 30 });
    const ab = await nav.rita.esperar((m) => m.tipo === 'term-aberto' && m.info.id === 'r1', { oque: 'term-aberto' });
    assert.equal(ab.info.dono, 'rita');
    assert.equal(typeof ab.tela, 'string');
    pids.push(ab.info.pid);
    await nav.rita.esperarSaida('rita', 'r1', prompt, { oque: 'prompt do zsh da Rita' });

    await nav.bruno.esperar((m) => m.tipo === 'term-lista' && m.dono === 'rita' && m.lista.some((i) => i.id === 'r1'), { oque: 'lista da Rita no Bruno' });
    nav.bruno.enviar({ tipo: 'term-assistir', dono: 'rita', id: 'r1' });
    const tela = await nav.bruno.esperar((m) => m.tipo === 'term-tela' && m.dono === 'rita' && m.id === 'r1', { oque: 'term-tela no Bruno' });
    assert.equal(tela.cols, 100);
    assert.equal(tela.pausada, false);

    nav.rita.enviar({ tipo: 'term-entrada', id: 'r1', dados: 'echo transmissao-$((40+2))\r' });
    await nav.bruno.esperarSaida('rita', 'r1', 'transmissao-42', { oque: 'saída da Rita no Bruno' });

    nav.rita.enviar({ tipo: 'term-tamanho', id: 'r1', cols: 120, rows: 40 });
    const tam = await nav.bruno.esperar((m) => m.tipo === 'term-tamanho' && m.dono === 'rita' && m.id === 'r1', { oque: 'term-tamanho no Bruno' });
    assert.deepEqual([tam.cols, tam.rows], [120, 40]);

    /* redimensionar é só do dono: o navegador do Bruno pedindo para o terminal da Rita não muda nada */
    nav.bruno.enviar({ tipo: 'term-tamanho', dono: 'rita', id: 'r1', cols: 50, rows: 10 });
    await esperar(400);
    assert.equal(nav.bruno.ultima((m) => m.tipo === 'term-tamanho' && m.id === 'r1').cols, 120);
  });

  it('atividade (presença) · shell → rodando → terminou, e espera com um processo "claude" parado; quem assiste de fora vê o mesmo', async () => {
    const desde = nav.rita.msgs.length, desdeB = nav.bruno.msgs.length;
    nav.rita.enviar({ tipo: 'term-entrada', id: 'r1', dados: 'sleep 1\r' });
    const rodando = await nav.rita.esperar((m) => m.tipo === 'term-atividade' && m.id === 'r1' && m.estado === 'rodando' && m.processo === 'sleep', { desde, oque: 'rodando sleep' });
    const terminou = await nav.rita.esperar((m) => m.tipo === 'term-atividade' && m.id === 'r1' && m.estado === 'terminou', { desde, oque: 'terminou sleep' });
    assert.equal(terminou.processo, 'sleep');
    assert.ok(terminou.duracao >= 700 && terminou.duracao <= 2500, 'duração do sleep 1: ' + terminou.duracao);
    assert.ok(terminou.fim >= rodando.desde);
    await nav.bruno.esperar((m) => m.tipo === 'term-atividade' && m.dono === 'rita' && m.id === 'r1' && m.estado === 'terminou', { desde: desdeB, oque: 'terminou no Bruno' });

    /* "claude" de mentira: um link chamado claude-falso para /bin/sleep (o claude instalado também é um link, para um binário com nome de versão) */
    const bin = path.join(R.raiz, 'bin');
    fs.mkdirSync(bin, { recursive: true });
    fs.symlinkSync('/bin/sleep', path.join(bin, 'claude-falso'));
    const d2 = nav.rita.msgs.length;
    nav.rita.enviar({ tipo: 'term-entrada', id: 'r1', dados: '"' + path.join(bin, 'claude-falso') + '" 3\r' });
    await nav.rita.esperar((m) => m.tipo === 'term-atividade' && m.id === 'r1' && m.estado === 'rodando' && m.processo === 'claude-falso', { desde: d2, oque: 'rodando claude-falso' });
    const espera = await nav.rita.esperar((m) => m.tipo === 'term-atividade' && m.id === 'r1' && m.estado === 'espera', { desde: d2, oque: 'espera' });
    assert.equal(espera.processo, 'claude-falso');
    await nav.bruno.esperar((m) => m.tipo === 'term-atividade' && m.dono === 'rita' && m.estado === 'espera', { desde: desdeB, oque: 'espera no Bruno' });
    await nav.rita.esperar((m) => m.tipo === 'term-atividade' && m.id === 'r1' && m.estado === 'terminou' && m.processo === 'claude-falso', { desde: d2, ms: 6000, oque: 'terminou claude-falso' });
  });

  it('c) A7 · Theus (gestão) pede o terminal da Rita, entra direto, digita e o comando roda na sessão da Rita', async () => {
    nav.theus.enviar({ tipo: 'term-pedir', dono: 'rita', sessao: 'r1' });
    const ct = await nav.theus.esperar((m) => m.tipo === 'controles' && m.lista.some((c) => c.dono === 'rita' && c.quem === 'theus' && c.sessao === 'r1'), { oque: 'controle do Theus' });
    const c = ct.lista.find((x) => x.dono === 'rita' && x.quem === 'theus');
    assert.deepEqual([c.estado, c.direto], ['ativo', true], 'gestão entra direto');
    await nav.rita.esperar((m) => m.tipo === 'controles' && m.lista.some((x) => x.id === c.id && x.estado === 'ativo'), { oque: 'selo na tela da Rita' });

    nav.theus.enviar({ tipo: 'term-entrada', dono: 'rita', id: 'r1', dados: 'echo "eu-sou-$BABEL_EU em $(pwd)"\r' });
    const pasta = path.join(R.raiz, 'rita');
    const saida = await nav.rita.esperarSaida('rita', 'r1', (s) => s.includes('eu-sou-rita em ' + pasta) || s.includes('eu-sou-rita em ' + fs.realpathSync(pasta)), { oque: 'eco do comando do Theus na Rita' });
    assert.ok(saida.includes('eu-sou-rita'));
    /* a tela real (em memória) da Rita tem o mesmo */
    nav.rita.enviar({ tipo: 'term-assistir', dono: 'rita', id: 'r1' });
    const tela = await nav.rita.esperar((m) => m.tipo === 'term-tela' && m.dono === 'rita' && m.id === 'r1' && m.dados.includes('eu-sou-rita em'), { desde: nav.rita.msgs.length, oque: 'telaReal da Rita' });
    assert.ok(tela.dados.includes('eu-sou-rita em'));
  });

  let pedidoRita = null, diretoRita = null;
  it('d) A8 · Rita pede o terminal do Theus: pedido, teclas recusadas até o aceite; com projeto em comum entra direto; Bruno (fora) só pede', async () => {
    nav.theus.enviar({ tipo: 'term-abrir', id: 't1', nome: 'agente-theus', cols: 100, rows: 30 });
    nav.theus.enviar({ tipo: 'term-abrir', id: 't2', nome: 'agente-2', cols: 100, rows: 30 });
    const a1 = await nav.theus.esperar((m) => m.tipo === 'term-aberto' && m.info.id === 't1');
    const a2 = await nav.theus.esperar((m) => m.tipo === 'term-aberto' && m.info.id === 't2');
    pids.push(a1.info.pid, a2.info.pid);
    await nav.theus.esperarSaida('theus', 't1', prompt, { oque: 'prompt do Theus' });
    await nav.rita.esperar((m) => m.tipo === 'term-lista' && m.dono === 'theus' && m.lista.some((i) => i.id === 't1') && m.lista.some((i) => i.id === 't2'), { oque: 'lista do Theus na Rita' });

    nav.rita.enviar({ tipo: 'term-pedir', dono: 'theus', sessao: 't1' });
    const cr = await nav.rita.esperar((m) => m.tipo === 'controles' && m.lista.some((c) => c.dono === 'theus' && c.quem === 'rita' && c.sessao === 't1'), { oque: 'pedido da Rita' });
    pedidoRita = cr.lista.find((c) => c.dono === 'theus' && c.quem === 'rita' && c.sessao === 't1');
    assert.deepEqual([pedidoRita.estado, pedidoRita.direto], ['pedido', false]);
    await nav.theus.esperar((m) => m.tipo === 'controles' && m.lista.some((c) => c.id === pedidoRita.id && c.estado === 'pedido'), { oque: 'pedido na tela do Theus' });

    const d0 = nav.rita.msgs.length;
    nav.rita.enviar({ tipo: 'term-entrada', dono: 'theus', id: 't1', dados: 'echo antes-do-aceite-$((2+2))\r' });
    const rec = await nav.rita.esperar((m) => m.tipo === 'term-recusado' && m.dono === 'theus' && m.id === 't1', { desde: d0, oque: 'term-recusado' });
    assert.equal(rec.motivo, 'sem permissão');

    nav.theus.enviar({ tipo: 'controle-aceitar', id: pedidoRita.id });
    await nav.rita.esperar((m) => m.tipo === 'controles' && m.lista.some((c) => c.id === pedidoRita.id && c.estado === 'ativo'), { oque: 'aceite na Rita' });
    nav.rita.enviar({ tipo: 'term-entrada', dono: 'theus', id: 't1', dados: 'echo aceito-$((6*7))\r' });
    await nav.theus.esperarSaida('theus', 't1', 'aceito-42', { oque: 'comando da Rita no Theus' });
    assert.ok(!nav.theus.saida('theus', 't1').includes('antes-do-aceite-4'), 'a tecla recusada nunca chegou ao shell do Theus');

    /* projeto em comum (mandado pelo navegador do Theus): o próximo pedido da Rita já nasce ativo */
    nav.theus.enviar({ tipo: 'projetos', lista: [{ id: 'p1', membros: ['theus', 'rita'] }] });
    await esperar(150);
    nav.rita.enviar({ tipo: 'term-pedir', dono: 'theus', sessao: 't2' });
    const cd = await nav.rita.esperar((m) => m.tipo === 'controles' && m.lista.some((c) => c.dono === 'theus' && c.quem === 'rita' && c.sessao === 't2'), { oque: 'pedido direto' });
    diretoRita = cd.lista.find((c) => c.dono === 'theus' && c.sessao === 't2');
    assert.deepEqual([diretoRita.estado, diretoRita.direto], ['ativo', true], 'mesmo projeto entra direto');

    /* Bruno não é gestão nem está em projeto com a Rita: pede */
    nav.bruno.enviar({ tipo: 'term-pedir', dono: 'rita', sessao: 'r1' });
    const cb = await nav.bruno.esperar((m) => m.tipo === 'controles' && m.lista.some((c) => c.dono === 'rita' && c.quem === 'bruno'), { oque: 'pedido do Bruno' });
    const cBruno = cb.lista.find((c) => c.dono === 'rita' && c.quem === 'bruno');
    assert.deepEqual([cBruno.estado, cBruno.direto], ['pedido', false]);
    const d1 = nav.bruno.msgs.length;
    nav.bruno.enviar({ tipo: 'term-entrada', dono: 'rita', id: 'r1', dados: 'x' });
    await nav.bruno.esperar((m) => m.tipo === 'term-recusado' && m.dono === 'rita' && m.motivo === 'sem permissão', { desde: d1, oque: 'recusa ao Bruno' });
    /* a Rita recusa o pedido: o Bruno recebe controle-fim */
    nav.rita.enviar({ tipo: 'controle-recusar', id: cBruno.id });
    const fim = await nav.bruno.esperar((m) => m.tipo === 'controle-fim' && m.id === cBruno.id, { oque: 'controle-fim ao Bruno' });
    assert.deepEqual([fim.dono, fim.motivo], ['rita', 'recusado']);
  });

  it('e) A9 · o dono encerra: o controlador recebe controle-fim e as teclas seguintes são recusadas; quem controla também pode sair', async () => {
    const d0 = nav.rita.msgs.length;
    nav.theus.enviar({ tipo: 'controle-encerrar', id: pedidoRita.id });
    const fim = await nav.rita.esperar((m) => m.tipo === 'controle-fim' && m.id === pedidoRita.id, { desde: d0, oque: 'controle-fim' });
    assert.deepEqual([fim.dono, fim.motivo], ['theus', 'encerrado']);
    const ct = await nav.rita.esperar((m) => m.tipo === 'controles' && !m.lista.some((c) => c.id === pedidoRita.id), { desde: d0, oque: 'controles sem o encerrado' });
    assert.ok(ct.lista.some((c) => c.id === diretoRita.id), 'o outro controle (t2) continua');
    const d1 = nav.rita.msgs.length;
    nav.rita.enviar({ tipo: 'term-entrada', dono: 'theus', id: 't1', dados: 'echo depois-do-fim-$((3+3))\r' });
    const rec = await nav.rita.esperar((m) => m.tipo === 'term-recusado' && m.id === 't1', { desde: d1, oque: 'recusa depois do fim' });
    assert.equal(rec.motivo, 'sem permissão');
    await esperar(300);
    assert.ok(!nav.theus.saida('theus', 't1').includes('depois-do-fim-6'));

    /* Rita sai do t2 por conta própria */
    const d2 = nav.theus.msgs.length;
    nav.rita.enviar({ tipo: 'controle-sair', dono: 'theus', id: diretoRita.id });
    await nav.theus.esperar((m) => m.tipo === 'controles' && !m.lista.some((c) => c.id === diretoRita.id), { desde: d2, oque: 'Theus vê a Rita sair' });
  });

  it('f) A10 · pausa: o marcador não chega a quem assiste (nem ao entrar depois, nem depois de retomar) e teclas de par são recusadas', async (t) => {
    const desdeB = nav.bruno.msgs.length, desdeT = nav.theus.msgs.length;
    nav.rita.enviar({ tipo: 'term-pausar', id: 'r1', sim: true });
    await nav.bruno.esperar((m) => m.tipo === 'term-pausa' && m.dono === 'rita' && m.id === 'r1' && m.pausada === true, { desde: desdeB, oque: 'term-pausa no Bruno' });

    /* printf com partes: o marcador inteiro só existe na saída, nunca na linha de comando (nem no histórico) */
    nav.rita.enviar({ tipo: 'term-entrada', id: 'r1', dados: "printf '%s%s\\n' " + PARTES[0] + ' ' + PARTES[1] + '\r' });
    await nav.rita.esperarSaida('rita', 'r1', MARCADOR, { oque: 'o marcador na tela da própria Rita' });

    /* teclas do Theus (que tem controle ativo em r1) são recusadas durante a pausa */
    nav.theus.enviar({ tipo: 'term-entrada', dono: 'rita', id: 'r1', dados: 'echo tecla-na-pausa\r' });
    const rec = await nav.theus.esperar((m) => m.tipo === 'term-recusado' && m.dono === 'rita' && m.id === 'r1', { desde: desdeT, oque: 'recusa na pausa' });
    assert.equal(rec.motivo, 'pausado');

    /* presença de quem está fora: só "pausado", sem processo */
    const at = await nav.bruno.esperar((m) => m.tipo === 'term-atividade' && m.dono === 'rita' && m.id === 'r1' && m.estado === 'pausado', { desde: desdeB, oque: 'atividade pausado' });
    assert.equal(at.processo, undefined);
    await esperar(700);

    /* Bruno sai e entra de novo durante a pausa */
    nav.bruno.enviar({ tipo: 'term-parar', dono: 'rita', id: 'r1' });
    await esperar(200);
    const d1 = nav.bruno.msgs.length;
    nav.bruno.enviar({ tipo: 'term-assistir', dono: 'rita', id: 'r1' });
    const tela = await nav.bruno.esperar((m) => m.tipo === 'term-tela' && m.dono === 'rita' && m.id === 'r1', { desde: d1, oque: 'term-tela na pausa' });
    assert.equal(tela.pausada, true);
    semMarcador(tela.dados, 'term-tela de quem entrou na pausa');
    const listaB = nav.bruno.ultima((m) => m.tipo === 'term-lista' && m.dono === 'rita');
    assert.equal(listaB.lista.find((i) => i.id === 'r1').processo, undefined, 'lista pública em pausa não diz o processo');

    /* retomar: tela limpa com a linha de retomada */
    const d2 = nav.bruno.msgs.length;
    nav.rita.enviar({ tipo: 'term-pausar', id: 'r1', sim: false });
    const volta = await nav.bruno.esperar((m) => m.tipo === 'term-tela' && m.dono === 'rita' && m.id === 'r1' && m.dados.includes('— transmissão retomada —'), { desde: d2, oque: 'term-tela da retomada' });
    semMarcador(volta.dados, 'term-tela depois de retomar');
    nav.rita.enviar({ tipo: 'term-entrada', id: 'r1', dados: 'echo depois-$((1+1))\r' });
    await nav.bruno.esperarSaida('rita', 'r1', 'depois-2', { oque: 'a transmissão voltou' });
    /* e a tecla recusada nunca rodou */
    assert.ok(!nav.rita.saida('rita', 'r1').includes('tecla-na-pausa\r\n'), 'a tecla do Theus não entrou na pausa');

    /* nada do que Bruno e Theus receberam (nem os logs dos servidores) tem o marcador */
    semMarcador(JSON.stringify(nav.bruno.msgs), 'mensagens do Bruno');
    semMarcador(JSON.stringify(nav.theus.msgs), 'mensagens do Theus');
    TODAS.forEach((e) => semMarcador(e.log, 'log do servidor ' + e.nome));
    t.diagnostic('mensagens conferidas sem o marcador: Bruno ' + nav.bruno.msgs.length + ', Theus ' + nav.theus.msgs.length);
  });

  it('h) segurança · Origin de outro site, navegador sem Origin, celular pela rede, par forjado, resposta errada e papel declarado', async (t) => {
    /* navegador com Origin de outro site: recusado no upgrade */
    await assert.rejects(new Navegador('ws://127.0.0.1:4811/ws', 'http://evil.example').aberto, (e) => e.status === 403);
    /* Origin de outra porta desta máquina: recusado */
    await assert.rejects(new Navegador('ws://127.0.0.1:4811/ws', 'http://localhost:9999').aberto, (e) => e.status === 403);
    /* navegador sem Origin: recusado */
    await assert.rejects(new Navegador('ws://127.0.0.1:4811/ws', null).aberto, (e) => e.status === 403);
    /* "DNS rebinding": nome de fora apontando para cá */
    assert.equal((await pedirHttp({ porta: 4811, caminho: '/', headers: { Host: 'evil.example:4811' } })).status, 403);
    /* par com Origin (navegador fingindo ser Estação): recusado */
    await assert.rejects(new ParFalso(4811, { origem: 'http://localhost:4811' }).aberto, (e) => e.status === 403);
    /* convite pedido por outra página no navegador local: recusado */
    assert.equal((await T.api('POST', '/api/convite', { nome: 'Zé' }, { headers: { Origin: 'http://evil.example' } })).status, 403);

    if (IP) {
      /* celular pela rede: diário e pares sim, terminal nunca */
      const cel = new Navegador('ws://' + IP + ':4811/ws', 'http://' + IP + ':4811');
      await cel.aberto;
      const bv = await cel.esperar((m) => m.tipo === 'bemvindo');
      assert.deepEqual([bv.terminais, bv.controles, bv.terminalReal], [[], [], false]);
      assert.ok(Array.isArray(bv.pares) && bv.pares.length >= 2, 'o celular vê os pares');
      cel.enviar({ tipo: 'term-abrir', id: 'celular', cols: 80, rows: 24 });
      cel.enviar({ tipo: 'term-lista?' });
      cel.enviar({ tipo: 'term-assistir', dono: 'rita', id: 'r1' });
      cel.enviar({ tipo: 'projetos', lista: [{ id: 'x', membros: ['rita', 'bruno'] }] });
      nav.rita.enviar({ tipo: 'term-entrada', id: 'r1', dados: 'echo celular-nao-ve-$((5+5))\r' });
      await nav.rita.esperarSaida('rita', 'r1', 'celular-nao-ve-10');
      await esperar(700);
      const deTerminal = cel.msgs.filter((m) => /^term-|^controle/.test(m.tipo));
      assert.deepEqual(deTerminal, [], 'celular não recebe nada de terminal');
      const dl = nav.rita.msgs.length;
      nav.rita.enviar({ tipo: 'term-lista?' });
      const minhas = await nav.rita.esperar((m) => m.tipo === 'term-lista' && m.dono === 'rita', { desde: dl });
      assert.ok(!minhas.lista.some((i) => i.id === 'celular'), 'o celular não abriu terminal na Rita');
      assert.equal((await pedirHttp({ porta: 4810, host: IP, metodo: 'POST', caminho: '/api/convite', corpo: { nome: 'Zé' }, headers: { Origin: 'http://' + IP + ':4810' } })).status, 403, 'convite pela rede: recusado');
      cel.fechar();
      /* o projeto mandado pelo celular não valeu: Bruno continua pedindo */
      const d0 = nav.bruno.msgs.length;
      nav.bruno.enviar({ tipo: 'term-pedir', dono: 'rita', sessao: 'r1' });
      const cb = await nav.bruno.esperar((m) => m.tipo === 'controles' && m.lista.some((c) => c.dono === 'rita' && c.quem === 'bruno'), { desde: d0 });
      assert.equal(cb.lista.find((c) => c.dono === 'rita' && c.quem === 'bruno').estado, 'pedido');
    } else t.diagnostic('sem IPv4 de rede nesta máquina: o caso do celular pela rede ficou de fora');

    const coopTheus = JSON.parse(fs.readFileSync(path.join(T.raiz, 'coop.json'), 'utf8'));
    const caio = Object.assign(token.ler(convites.caio), { porta: 9 });
    caio.id = caio.carteira.id;

    /* par com carteira forjada: assinada por outra chave de equipe (mesmo sabendo o segredo) */
    const falsa = token.novasChaves(), minhas = token.novasChaves();
    const forjada = token.emitirCarteira({ equipe: 'babel', privadaEquipe: falsa.privada }, { id: 'intruso', nome: 'Intruso', papel: 'gestao', chave: minhas.publica });
    const intruso = new ParFalso(4811, { cfg: { carteira: forjada.carteira, assinatura: forjada.assinatura, privada: minhas.privada, segredo: coopTheus.segredo, equipe: 'babel', porta: 9 } });
    assert.notEqual(await intruso.fechouEm(3000), null, 'par com carteira forjada foi fechado');

    /* carteira verdadeira (copiada da rede), resposta assinada por outra chave */
    const copia = new ParFalso(4811, { cfg: caio, forjar: (ola) => Object.assign(ola, { resposta: token.assinar(token.novasChaves().privada, 'qualquer') }) });
    assert.notEqual(await copia.fechouEm(3000), null, 'resposta ao desafio errada: fechado');

    /* chave certa, mas sobre outro nonce (resposta velha repetida) */
    const replay = new ParFalso(4811, { cfg: caio, forjar: (ola, { meu, dele }) => Object.assign(ola, { resposta: token.assinar(caio.privada, token.textoResposta(crypto.randomBytes(16).toString('hex'), caio.id, meu.efemera, dele.efemera)) }) });
    assert.notEqual(await replay.fechouEm(3000), null, 'resposta sobre outro nonce: fechado');

    /* mensagens antes do aperto de mão: fechado e nada acontece */
    const cedo = new ParFalso(4811, { semDesafio: true });
    await cedo.aberto;
    const inv = 'INV' + crypto.randomBytes(4).toString('hex');
    cedo.cru({ tipo: 'term-entrada', id: 'r1', dados: 'echo ' + inv + '\r' });
    cedo.cru({ tipo: 'evento', evento: { id: 'intruso:1', autor: 'intruso', seq: 1, ts: Date.now(), quem: 'intruso', acao: 'x', args: [] } });
    assert.notEqual(await cedo.fechouEm(3000), null, 'mensagem antes do ola: fechado');
    await esperar(300);
    assert.ok(!nav.rita.saida('rita', 'r1').includes(inv), 'a tecla do invasor não chegou ao shell');
    assert.ok(!(await R.api('GET', '/api/diario')).json.some((ev) => ev.id === 'intruso:1'), 'o evento do invasor não entrou no diário');

    /* membro de verdade (Caio) que declara papel gestão no ola: entra como membro, só pede, e as teclas são recusadas */
    const declarado = new ParFalso(4811, { cfg: caio, forjar: (ola) => Object.assign(ola, { papel: 'gestao', id: 'theus', nome: 'Theus' }) });
    await declarado.pronto;
    await R.esperarPar('caio');
    assert.equal((await R.pares()).find((p) => p.id === 'caio').papel, 'membro', 'papel vem da carteira, não do ola');
    declarado.selado({ tipo: 'term-pedir', sessao: 'r1' });
    const c = await declarado.esperar((m) => m.tipo === 'controle');
    const dc = nav.rita.msgs.length;
    assert.deepEqual([c.c.quem, c.c.estado, c.c.direto], ['caio', 'pedido', false]);
    declarado.selado({ tipo: 'term-entrada', id: 'r1', dados: 'echo ' + inv + '\r' });
    const rc = await declarado.esperar((m) => m.tipo === 'term-recusado');
    assert.equal(rc.motivo, 'sem permissão');
    /* sem selo depois do aperto de mão: fechado */
    declarado.cru({ tipo: 'term-pedir', sessao: 'r1' });
    assert.notEqual(await declarado.fechouEm(3000), null, 'mensagem sem selo depois do aperto de mão: fechado');
    await R.esperarPar('caio', (p) => !p.ligado);
    await nav.rita.esperar((m) => m.tipo === 'controles' && !m.lista.some((x) => x.quem === 'caio'), { desde: dc, oque: 'o pedido de quem caiu some' });
    assert.ok(!nav.rita.saida('rita', 'r1').includes(inv));
    [intruso, copia, replay, cedo, declarado].forEach((p) => p.fechar());
  });

  it('i) A12 · latência: 200 teclas do Theus no terminal da Rita, tecla → eco no navegador do Theus, p95 < 100 ms', async (t) => {
    const d0 = nav.theus.msgs.length;
    nav.theus.enviar({ tipo: 'term-assistir', dono: 'rita', id: 'r1' });
    await nav.theus.esperar((m) => m.tipo === 'term-tela' && m.dono === 'rita' && m.id === 'r1', { desde: d0 });
    const amostras = [];
    const letras = 'abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < 200; i++) {
      if (i && i % 50 === 0) { nav.theus.enviar({ tipo: 'term-entrada', dono: 'rita', id: 'r1', dados: '\u0015' }); await esperar(80); } /* Ctrl-U: limpa a linha */
      const ch = letras[i % 26];
      const desde = nav.theus.msgs.length;
      const t0 = performance.now();
      nav.theus.enviar({ tipo: 'term-entrada', dono: 'rita', id: 'r1', dados: ch });
      const eco = await nav.theus.esperar((m) => m.tipo === 'term-saida' && m.dono === 'rita' && m.id === 'r1' && m.dados.includes(ch), { desde, ms: 3000, oque: 'eco da tecla ' + i });
      amostras.push(eco.chegou - t0);
    }
    nav.theus.enviar({ tipo: 'term-entrada', dono: 'rita', id: 'r1', dados: '\u0015' });
    const p50 = percentil(amostras, 50), p95 = percentil(amostras, 95), max = Math.max(...amostras);
    t.diagnostic('latência tecla→eco (Theus navegador → servidor Theus → servidor Rita → pty → volta), 200 teclas: p50 ' + p50.toFixed(2) + ' ms · p95 ' + p95.toFixed(2) + ' ms · máx ' + max.toFixed(2) + ' ms');
    assert.equal(amostras.length, 200);
    assert.ok(p95 < 100, 'p95 = ' + p95.toFixed(2) + ' ms');
  });

  it('g) A11 · nada em disco: o marcador não existe em nenhuma raiz temporária nem em app/, e nenhum shell ficou vivo', async (t) => {
    await Promise.all(TODAS.map((e) => e.parar()));
    await esperar(500);
    const pastas = TODAS.map((e) => e.raiz).concat([APP]);
    const r = buscarNoDisco(pastas, MARCADOR);
    t.diagnostic('busca do marcador: ' + r.arquivos + ' arquivos, ' + (r.bytes / 1024 / 1024).toFixed(1) + ' MB em ' + pastas.length + ' pastas');
    assert.deepEqual(r.achados, [], 'marcador em disco');
    const hist = path.join(R.zdot, '.zsh_history');
    if (fs.existsSync(hist)) {
      const h = fs.readFileSync(hist, 'utf8');
      t.diagnostic('histórico do zsh da Rita (na raiz temporária) tem ' + h.split('\n').filter(Boolean).length + ' linhas; o printf em partes está lá: ' + h.includes(PARTES[1]));
    } else t.diagnostic('o zsh da Rita não gravou histórico');
    const vivos = pids.filter((pid) => { try { process.kill(pid, 0); return true; } catch (e) { return false; } });
    assert.deepEqual(vivos, [], 'shells ainda vivos');
    TODAS.forEach((e) => semMarcador(e.log, 'log final de ' + e.nome));
  });
});
