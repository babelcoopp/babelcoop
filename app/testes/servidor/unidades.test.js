/* Babel Coop · testes de unidade do servidor (sem rede, sem pty): carteira, token v2, aperto de mão, canal selado,
   matriz de permissões do controle, estados da presença e a ordem do que é injetado na página.
   Rodar: cd app && node --test testes/servidor/
*/
'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const token = require('../../servidor/token');
const { Controle } = require('../../servidor/controle');
const { estadoDe } = require('../../servidor/terminal');
const { INJETAR } = require('../../servidor/servidor');

function b64u(o) { return Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function corpoDe(t) { return JSON.parse(Buffer.from(t.slice(6).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')); }
function gestao() { return Object.assign(token.fundar('Theus', 'babel'), { porta: 4711 }); }
function membroDe(g, nome, papel) { const t = token.ler(token.gerar(g, { nome, papel })); return Object.assign(t, { id: t.carteira.id, papel: t.carteira.papel, porta: 4711 }); }

describe('carteira e token v2', () => {
  it('fundar cria a carteira da gestão assinada pela chave da equipe', () => {
    const g = gestao();
    assert.equal(g.carteira.papel, 'gestao');
    assert.equal(g.carteira.id, 'theus');
    assert.ok(token.conferir(g.publicaEquipe, token.canonico(g.carteira), g.assinatura));
    assert.equal(token.publicaDe(g.privada), g.carteira.chave);
    assert.equal(token.motivoCarteira(g.publicaEquipe, 'babel', g.carteira, g.assinatura), null);
  });

  it('convite → ler: membro sem a chave da equipe; gestão com ela', () => {
    const g = gestao();
    const m = token.ler(token.gerar(g, { nome: 'Rita Souza', papel: 'membro' }));
    assert.deepEqual([m.v, m.carteira.id, m.carteira.nome, m.carteira.papel], [2, 'rita-souza', 'Rita Souza', 'membro']);
    assert.equal(m.privadaEquipe, undefined);
    assert.equal(m.segredo, g.segredo);
    const g2 = token.ler(token.gerar(g, { nome: 'Ana', papel: 'gestao' }));
    assert.equal(g2.carteira.papel, 'gestao');
    assert.equal(token.publicaDe(g2.privadaEquipe), g.publicaEquipe);
  });

  it('só a gestão convida; nome vazio ou igual ao meu não passa', () => {
    const g = gestao();
    const m = membroDe(g, 'Rita');
    assert.throws(() => token.gerar(m, { nome: 'X' }), /só a gestão convida/);
    assert.throws(() => token.gerar(g, { nome: '' }), /faltou o nome/);
    assert.throws(() => token.gerar(g, { nome: 'Theus' }), /já é o desta Estação/);
  });

  it('ler recusa token v1, lixo, carteira alterada, chave trocada e membro que vira gestão sem a chave da equipe', () => {
    const g = gestao();
    const t = token.gerar(g, { nome: 'Rita' });
    assert.throws(() => token.ler('babel-' + b64u({ v: 1, equipe: 'babel', segredo: 'x', id: 'rita' })), /token antigo/);
    assert.throws(() => token.ler('qualquer coisa'), /não é um token/);
    assert.throws(() => token.ler('babel-%%%'), /ilegível|incompleto/);
    const c1 = corpoDe(t); c1.carteira.papel = 'gestao';
    assert.throws(() => token.ler('babel-' + b64u(c1)), /não assinada/);
    const c2 = corpoDe(t); c2.privada = token.novasChaves().privada;
    assert.throws(() => token.ler('babel-' + b64u(c2)), /não é a da carteira/);
    const outra = token.fundar('Theus', 'babel');
    const c3 = corpoDe(t); c3.publicaEquipe = outra.publicaEquipe;
    assert.throws(() => token.ler('babel-' + b64u(c3)), /não assinada/);
    /* ler aceita o token com quebras de linha (colado de mensagem) */
    assert.equal(token.ler(t.slice(0, 40) + '\n' + t.slice(40)).carteira.id, 'rita');
  });
});

describe('aperto de mão (desafio/ola) e canal selado', () => {
  const g = gestao();
  const rita = membroDe(g, 'Rita');
  const bruno = membroDe(g, 'Bruno');

  function aperto(a, b, forjarB) {
    const da = token.novoDesafio(), db = token.novoDesafio();
    let olaB = token.ola(b, { nonce: da.nonce, efemera: da.efemera }, db, {});
    if (forjarB) olaB = forjarB(olaB, da, db) || olaB;
    return { r: token.conferirOla(a, olaB, da, db.efemera), da, db };
  }

  it('ola verdadeiro passa e a carteira devolvida é a do outro', () => {
    const { r } = aperto(rita, bruno);
    assert.equal(r.erro, undefined);
    assert.equal(r.carteira.id, 'bruno');
    assert.equal(aperto(g, rita).r.carteira.papel, 'membro');
  });

  it('cada conferência derruba o ola quando falha', () => {
    assert.match(aperto(rita, bruno, (o) => Object.assign(o, { equipe: 'outra' })).r.erro, /outra equipe/);
    assert.match(aperto(rita, bruno, (o) => Object.assign(o, { prova: 'x'.repeat(64) })).r.erro, /segredo/);
    const falsa = token.fundar('Theus', 'babel');
    const forjada = token.emitirCarteira({ equipe: 'babel', privadaEquipe: falsa.privadaEquipe }, { id: 'bruno', nome: 'Bruno', papel: 'gestao', chave: bruno.carteira.chave });
    assert.match(aperto(rita, bruno, (o) => Object.assign(o, forjada)).r.erro, /não assinada/);
    assert.match(aperto(rita, bruno, (o) => Object.assign(o, { carteira: Object.assign({}, o.carteira, { papel: 'gestao' }) })).r.erro, /não assinada/);
    assert.match(aperto(rita, bruno, (o, da, db) => Object.assign(o, { resposta: token.assinar(bruno.privada, token.textoResposta('0'.repeat(32), 'bruno', db.efemera, da.efemera)) })).r.erro, /resposta/);
    assert.match(aperto(rita, bruno, (o) => Object.assign(o, { resposta: token.assinar(token.novasChaves().privada, 'x') })).r.erro, /resposta/);
    assert.match(aperto(rita, rita).r.erro, /eu mesmo/);
  });

  it('quem troca a chave efêmera no meio do caminho quebra a assinatura', () => {
    const da = token.novoDesafio(), db = token.novoDesafio(), meio = token.novoDesafio();
    /* o do meio entrega a Bruno a efêmera dele no lugar da de Rita */
    const olaB = token.ola(bruno, { nonce: da.nonce, efemera: meio.efemera }, db, {});
    assert.match(token.conferirOla(rita, olaB, da, db.efemera).erro, /resposta/);
  });

  it('canal: os dois lados derivam as mesmas chaves; alterar, repetir ou trocar a ordem falha', () => {
    const da = token.novoDesafio(), db = token.novoDesafio();
    const ca = token.canal(da, { nonce: db.nonce, efemera: db.efemera });
    const cb = token.canal(db, { nonce: da.nonce, efemera: da.efemera });
    const s1 = token.selar(ca, '{"tipo":"um"}'), s2 = token.selar(ca, '{"tipo":"dois"}');
    assert.equal(token.abrir(cb, s1), '{"tipo":"um"}');
    assert.equal(token.abrir(cb, s2), '{"tipo":"dois"}');
    assert.equal(token.abrir(ca, token.selar(cb, 'volta')), 'volta');
    assert.throws(() => token.abrir(cb, s2), 'repetida');
    const cb2 = token.canal(db, { nonce: da.nonce, efemera: da.efemera });
    assert.throws(() => token.abrir(cb2, s2), 'fora de ordem');
    const cb3 = token.canal(db, { nonce: da.nonce, efemera: da.efemera });
    const mexida = Buffer.from(s1); mexida[0] ^= 1;
    assert.throws(() => token.abrir(cb3, mexida), 'alterada');
  });
});

describe('controle: matriz de permissões no servidor do dono', () => {
  const cfg = { id: 'rita' };
  const gestaoPar = { id: 'theus', papel: 'gestao' }, bruno = { id: 'bruno', papel: 'membro' }, caio = { id: 'caio', papel: 'membro' };

  it('gestão entra direto; membro fora de projeto pede; o mesmo pedido volta o mesmo', () => {
    const c = new Controle(cfg);
    const a = c.pedir(gestaoPar, 'r1');
    assert.deepEqual([a.estado, a.direto, a.dono, a.quem], ['ativo', true, 'rita', 'theus']);
    assert.ok(c.podeDigitar('theus', 'r1'));
    assert.ok(!c.podeDigitar('theus', 'r2'), 'controle de uma sessão não vale para outra');
    const p = c.pedir(bruno, 'r1');
    assert.deepEqual([p.estado, p.direto], ['pedido', false]);
    assert.ok(!c.podeDigitar('bruno', 'r1'));
    assert.equal(c.pedir(bruno, 'r1').id, p.id);
  });

  it('mesmo projeto entra direto; projeto sem o dono não conta', () => {
    const c = new Controle(cfg);
    c.definirProjetos([{ id: 'p', membros: ['bruno', 'caio'] }]);
    assert.equal(c.pedir(bruno, 'r1').estado, 'pedido');
    c.definirProjetos([{ id: 'p', membros: ['rita', 'bruno'] }]);
    const d = c.pedir(bruno, 'r1');
    assert.deepEqual([d.estado, d.direto], ['ativo', true], 'o pedido pendente sobe para ativo quando passa a ser direto');
    assert.equal(c.pedir(caio, 'r1').estado, 'pedido');
    c.definirProjetos('lixo');
    assert.deepEqual(c.projetos, []);
  });

  it('aceitar, recusar, encerrar, sair (só o próprio), par caiu, terminal fechou e sessão null = todas', () => {
    const c = new Controle(cfg);
    const fins = [];
    c.aoMudar((ev) => { if (ev.fim) fins.push(ev.motivo); });
    const p = c.pedir(bruno, null);
    assert.ok(!c.podeDigitar('bruno', 'qualquer'));
    c.aceitar(p.id);
    assert.ok(c.podeDigitar('bruno', 'qualquer'), 'null vale para todas');
    assert.equal(c.sair(p.id, 'caio'), null, 'caio não encerra o controle do bruno');
    assert.ok(c.podeDigitar('bruno', 'r9'));
    c.sair(p.id, 'bruno');
    assert.ok(!c.podeDigitar('bruno', 'r9'));
    const q = c.pedir(caio, 'r1'); c.recusar(q.id);
    const e = c.pedir(gestaoPar, 'r1'); c.encerrar(e.id);
    c.pedir(gestaoPar, 'r2'); c.sessaoFechou('r2');
    c.pedir(caio, 'r3'); c.parCaiu('caio');
    assert.deepEqual(fins, ['saiu', 'recusado', 'encerrado', 'terminal fechado', 'desligou']);
    assert.deepEqual(c.lista(), []);
  });

  it('espelho só aceita controle sobre mim e some quando o dono cai', () => {
    const c = new Controle({ id: 'theus' });
    assert.equal(c.espelhar('rita', { id: 'ct-000000000000', quem: 'bruno', estado: 'ativo' }), null);
    const e = c.espelhar('rita', { id: 'ct-0123456789ab', quem: 'theus', sessao: 'r1', estado: 'ativo', direto: true });
    assert.deepEqual([e.dono, e.quem, e.estado], ['rita', 'theus', 'ativo']);
    assert.equal(c.lista().length, 1);
    c.parCaiu('rita');
    assert.equal(c.lista().length, 0);
  });
});

describe('presença: estados a partir do processo da frente', () => {
  const base = { pausada: false, naShell: true, nome: 'zsh', comm: 'zsh', ultimoDado: 0, agora: 10000, fim: null };
  it('shell, terminou, rodando, espera (nome ou comm com "claude", 1,5 s sem saída) e pausado', () => {
    assert.equal(estadoDe(base), 'shell');
    assert.equal(estadoDe(Object.assign({}, base, { fim: { processo: 'sleep' } })), 'terminou');
    assert.equal(estadoDe(Object.assign({}, base, { naShell: false, nome: 'npm', comm: 'node' })), 'rodando');
    assert.equal(estadoDe(Object.assign({}, base, { naShell: false, nome: 'claude', comm: '2.1.281', ultimoDado: 9000 })), 'rodando', 'claude com saída recente');
    assert.equal(estadoDe(Object.assign({}, base, { naShell: false, nome: 'claude', comm: '2.1.281', ultimoDado: 8500 })), 'espera');
    assert.equal(estadoDe(Object.assign({}, base, { naShell: false, nome: '2.1.281', comm: 'Claude', ultimoDado: 0 })), 'espera');
    assert.equal(estadoDe(Object.assign({}, base, { pausada: true, naShell: false, nome: 'claude' })), 'pausado');
  });
});

describe('página', () => {
  it('INJETAR: ordem do PROTOCOLO (organismo antes de terminal-real e parede-real, ponte antes do organismo)', () => {
    const h = INJETAR(true, ['mostrador-anel.png']);
    /* lista completa da parte 2 (§7–§11): estilos, COOP_REAL com a mídia, xterm, ponte, organismo e as peças reais */
    const ordem = ['/vendor/xterm.css', '/coop/terminal-real.css', '/coop/parede-real.css', '/coop/navegador-real.css', '/coop/nascendo.css', '/coop/placar.css', 'window.COOP_REAL', '/vendor/xterm.js', '/vendor/addon-fit.js', 'ponte.js', '/coop/organismo.js', '/coop/terminal-real.js', '/coop/parede-real.js', '/coop/navegador-real.js', '/coop/coop-ui.js', '/coop/nascendo.js', '/coop/placar.js'];
    const pos = ordem.map((s) => h.indexOf(s));
    assert.ok(pos.every((p) => p >= 0), JSON.stringify(pos));
    assert.deepEqual(pos.slice().sort((a, b) => a - b), pos);
    assert.match(h, /window\.COOP_REAL = \{"terminal":true,"midia":\["mostrador-anel\.png"\]\}/);
  });
});
