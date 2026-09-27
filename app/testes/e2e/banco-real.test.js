/* babel-coop · e2e do banco real da Máquina no app real: Estação Electron escondida, app limpo, equipe fundada pelo Theus,
   projeto novo. O agente monta o banco pelo conector coop e cada mudança nasce como peça 3D. Prova:
   (a) coop_banco_sql cria empresas e pacientes (vínculo), RLS com a política "cada empresa vê só o seu", a função e o gatilho
       de boas-vindas → gavetas bd-t-empresas / bd-t-pacientes com os campos, fio pacientes → empresas, chave certa, robô do
       gatilho com o fio da gaveta; a migração é um arquivo na pasta compartilhada e os dados ficam em <raiz>/.coop/bancos;
   (b) a Máquina abriu no 3D e a fila de efeitos (BC.maquinaEfeitos.registro) tocou nascer, cadeado e fio, em ordem, no 3D;
       as peças do banco estão com corpo no 3D (medidas3d: comCorpo), com o selo "no banco local";
   (c) coop_banco_consulta insere 3 pacientes (o gatilho preenche a boas-vindas) → efeito "dados" tocado, contagem 3 no
       rótulo 3D e no rodapé da gaveta no 2D;
   (d) SQL errado → a resposta traz a mensagem do Postgres, nada gravado (a tabela criada antes do erro também não fica),
       nenhuma peça nova, nenhum arquivo novo, efeito "erro" tocado na gaveta citada;
   sem movimento (prefers-reduced-motion): a coluna nova e a linha nova só piscam na cor, rápido, e nada fica na cena;
   repouso: depois dos efeitos o 3D para de desenhar (no máximo o quadro de esfriar os rótulos em 7 s);
   (e) fechar e reabrir a Estação com a mesma raiz → coop_banco_estado ainda lista as tabelas e as 3 linhas;
   (f) prints em sequência (antes, durante o nascer, depois, dados, rodapé 2D, erro, reaberto).
   (g) outra Estação pelo diário (outro banco): a migração daqui não tira nem muda a peça dela, e ela não tira nem muda as
       daqui; o rótulo e a Casa de Máquinas dizem de quem é o banco; a chave sai da regra (tenant_isolation = cada empresa;
       "cada empresa vê só o seu" com true = aberta); o mesmo gatilho em duas tabelas vira dois robôs; RLS desligado abre o
       cadeado e ligado fecha; na parede da TV (estado.corpo) as peças do banco têm corpo e o que sai do banco sai de lá;
   (h) migração grande (35 efeitos): acelera, cabe antes do teto de 15 s, nada fica escondido e a próxima chamada não espera.
   As chamadas chegam como viriam do servidor (BC.real.simular, o mesmo caminho do maquina-real.test.js).
   Porta 5411, descoberta 41911. Evidências: BABEL_TESTE_EVIDENCIAS=<pasta> (banco-real-resultado.json + prints).
   Rodar: node --test testes/e2e/banco-real.test.js
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { abrirEstacao, raizTemporaria } = require('./estacao');

const PORTA = 5411, DESCOBERTA = 41911;
const EVID = process.env.BABEL_TESTE_EVIDENCIAS || null;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function ate(fn, { ms = 15000, passo = 150, oque = 'condição' } = {}) {
  const fim = Date.now() + ms;
  let ultimo;
  while (Date.now() < fim) {
    ultimo = await fn();
    if (ultimo) return ultimo;
    await esperar(passo);
  }
  throw new Error('tempo esgotado esperando ' + oque + (ultimo !== undefined ? ' (último: ' + JSON.stringify(ultimo) + ')' : ''));
}

const MIGRACAO = [
  'create table empresas (',
  '  id serial primary key,',
  '  nome text not null',
  ');',
  'create table pacientes (',
  '  id serial primary key,',
  '  empresa_id integer not null references empresas (id),',
  '  nome text not null,',
  '  nascimento date,',
  '  boas_vindas text',
  ');',
  'alter table empresas enable row level security;',
  'alter table pacientes enable row level security;',
  'create policy "cada empresa vê só o seu" on empresas using (id = current_setting(\'app.empresa\', true)::integer);',
  'create policy "cada empresa vê só o seu" on pacientes using (empresa_id = current_setting(\'app.empresa\', true)::integer);',
  'create function boas_vindas() returns trigger language plpgsql as $$',
  'begin',
  "  new.boas_vindas := 'Bem-vindo, ' || new.nome || '!';",
  '  return new;',
  'end',
  '$$;',
  'create trigger boas_vindas_paciente before insert on pacientes for each row execute function boas_vindas();',
  /* função que não é de gatilho: vira Porta na Máquina */
  'create function contar_pacientes(empresa integer) returns bigint language sql stable as $$ select count(*) from pacientes where empresa_id = empresa $$;'
].join('\n');
const INSERIR = "insert into empresas (nome) values ('Empresa A');\ninsert into pacientes (empresa_id, nome) values (1, 'Pessoa A'), (1, 'Pessoa B'), (1, 'Pessoa C') returning nome, boas_vindas";
/* a primeira linha cria uma tabela de verdade; a segunda erra o tipo: a transação inteira volta, a tabela "rascunho" não fica */
const ERRADO = 'create table rascunho (id integer);\nalter table pacientes add column telefone textoo;';

const GAVETA_E = 'bd-t-empresas', GAVETA_P = 'bd-t-pacientes', ROBO = 'bd-g-pacientes-boas_vindas_paciente', PORTA_BD = 'bd-f-contar_pacientes';

/* o que a Máquina tem no estado da equipe, no 3D e nos rótulos do 3D */
const medirMaquina = (page, pj) => page.evaluate((id) => {
  const d = BC.maquina.doEstado(id), med = BC.maquina.medidas3d(), v = BC.maquina.vista3d();
  return {
    pecas: d.pecas.map((p) => ({ id: p.id, tipo: p.tipo, nome: p.nome, banco: !!p.banco, campos: p.campos || [], chave: p.chave || null, quando: p.quando || null, frase: p.frase || '', assinatura: p.assinatura || null })),
    fios: d.fios.map((f) => [f[0], f[1]]),
    med,
    fiosEmCena: v && v.fiosObj ? v.fiosObj.length : null,
    rotulos: [...document.querySelectorAll('#e-conteudo .v3c-rotulo')].map((r) => ({ texto: r.textContent.replace(/\s+/g, ' ').trim(), banco: r.classList.contains('banco'), tracejada: r.classList.contains('tracejada') })),
    legenda: ((document.querySelector('#e-conteudo .mq-3d-legenda') || {}).textContent || '').replace(/\s+/g, ' ').trim()
  };
}, pj);

describe('Banco real na Máquina: o agente monta o Postgres local e as peças nascem no 3D', () => {
  const raiz = raizTemporaria('banco');
  let est, eu, pj, pasta, resultado = { casos: {}, raiz }, erros = [];

  const vigiar = (page) => {
    page.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
    page.on('console', (m) => {
      const t = m.text();
      if (m.type() === 'error' && !/favicon|Failed to load resource/.test(t)) erros.push('console: ' + t);
      if (m.type() === 'warning' && /\[(efeito|efeitos|coop-ui|máquina)\]/.test(t)) erros.push('aviso: ' + t);
    });
  };
  const preparar = async () => {
    await est.page.waitForLoadState('load');
    await ate(() => est.page.evaluate(() => !!(window.BC && BC.real && BC.real.bemvindo && BC.real.eu() && BC.real.eu().pronto && BC.loja.eu === BC.real.eu().id && BC.estacao && BC.estacao.ui && BC.coop && BC.maquina && BC.maquinaEfeitos)), { ms: 25000, oque: 'a Estação reconhecer o Theus' });
    await est.page.evaluate(() => {
      window.__enviados = [];
      const original = BC.real.enviar;
      BC.real.enviar = function (m) { window.__enviados.push(JSON.parse(JSON.stringify(m))); return original(m); };
    });
  };
  const enviar = (cid, ferramenta, args) => est.page.evaluate((m) => BC.real.simular(m), { tipo: 'mcp-chamada', cid, sessao: 's-rita', ferramenta, args, agente: { id: 'ag-rita', nome: 'Rita', dono: eu.id } });
  const resposta = async (cid, ferramenta, args, inicio) => {
    const r = await ate(() => est.page.evaluate((c) => window.__enviados.filter((m) => m.tipo === 'mcp-resposta' && m.cid === c)[0] || null, cid), { ms: 125000, passo: 100, oque: 'mcp-resposta ' + cid });
    resultado.casos[cid] = { ferramenta, args, ms: Date.now() - inicio, ok: r.ok, texto: r.ok ? r.resultado.texto : r.erro };
    return r;
  };
  const chamar = async (cid, ferramenta, args) => { const t0 = Date.now(); await enviar(cid, ferramenta, args); return resposta(cid, ferramenta, args, t0); };
  const registro = () => est.page.evaluate(() => BC.maquinaEfeitos.registro());
  /* espera o efeito começar no 3D; se a resposta chegar antes (recusa), falha na hora com o motivo */
  const efeitoNoAr = async (cid, tipo, ms) => {
    const x = await ate(() => est.page.evaluate((a) => {
      const m = BC.maquina.medidas3d();
      if (m && m.efeitos && m.efeitos.indexOf(a.tipo) !== -1) return { med: m };
      const r = window.__enviados.filter((e) => e.tipo === 'mcp-resposta' && e.cid === a.cid)[0];
      return r ? { resposta: r } : null;
    }, { cid, tipo }), { ms, passo: 40, oque: 'o efeito ' + tipo + ' começar no 3D' });
    if (!x.med) assert.fail('a resposta chegou antes do efeito ' + tipo + ': ' + JSON.stringify(x.resposta));
    return x.med;
  };
  const print = async (nome) => {
    if (!EVID) return;
    fs.mkdirSync(EVID, { recursive: true });
    try { await est.page.screenshot({ path: path.join(EVID, nome) }); (resultado.prints = resultado.prints || []).push(nome); } catch (e) { (resultado.printsFalhos = resultado.printsFalhos || []).push(nome + ': ' + e.message); }
  };

  before(async () => {
    est = await abrirEstacao({ nome: 'banco', raiz, porta: PORTA, descoberta: DESCOBERTA });
    vigiar(est.page);
    await est.page.waitForLoadState('load');
    const f = await est.api('/api/fundar', { nome: 'Theus' });
    assert.ok(f.pronto, 'fundou a equipe: ' + JSON.stringify(f));
    eu = f;
    await est.page.reload();
    await preparar();
    pasta = (await est.api('/api/eu')).pasta;
    resultado.eu = { id: eu.id, nome: eu.nome };
    resultado.pasta = pasta;
  });

  after(async () => {
    resultado.erros = erros;
    if (EVID) { fs.mkdirSync(EVID, { recursive: true }); fs.writeFileSync(path.join(EVID, 'banco-real-resultado.json'), JSON.stringify(resultado, null, 2)); }
    if (est) await est.fechar().catch(() => {});
    if (/babel-e2e-banco-/.test(raiz)) fs.rmSync(raiz, { recursive: true, force: true }); /* só a raiz temporária deste teste */
  });

  it('(a)(b) coop_banco_sql monta empresas, pacientes, RLS, função e gatilho: peças do banco, arquivo da migração e efeitos no 3D', async () => {
    await est.page.evaluate(() => BC.loja.fazer('novoProjeto', { nome: 'Agenda Banco' }));
    pj = await est.page.evaluate(() => BC.loja.estado.projetos[0].id);
    resultado.projeto = pj;
    await est.page.evaluate((id) => { BC.estacao.fecharTodas(); BC.maquina.abrir(id); }, pj);
    await esperar(800);
    const antes = await est.page.evaluate((id) => ({ pecas: BC.maquina.doEstado(id).pecas.length, conteudo: document.getElementById('e-conteudo').textContent.replace(/\s+/g, ' ').trim().slice(0, 300), registro: BC.maquinaEfeitos.registro().length }), pj);
    resultado.casos.antes = antes;
    await print('banco-1-antes.png');
    assert.equal(antes.pecas, 0, 'a Máquina do projeto novo nasce vazia');
    assert.match(antes.conteudo, /A Máquina de Agenda Banco ainda está vazia/);
    /* o projeto ainda não tem banco: o estado responde vazio sem criar os ~40 MB */
    const vazio = await est.api('/api/banco/estado?projeto=' + pj);
    assert.deepEqual(vazio, { ok: true, snapshot: { tabelas: [], fios: [], politicas: [], gatilhos: [], funcoes: [] } });
    assert.equal(fs.existsSync(path.join(raiz, '.coop', 'bancos', pj)), false);

    const t0 = Date.now();
    await enviar('b-sql', 'coop_banco_sql', { projeto: pj, sql: MIGRACAO, nome: 'cria empresas e pacientes' });
    /* durante: a Máquina abriu no 3D e a primeira gaveta está caindo (efeito "nascer" vivo na cena) */
    const durante = await efeitoNoAr('b-sql', 'nascer', 120000);
    resultado.casos.tresDProntoMs = Date.now() - t0;
    await esperar(380); /* perto do encaixe: a gaveta chega ao chão, o anel e as faíscas aparecem */
    await print('banco-2-durante-o-nascer.png');
    resultado.casos.durante = { efeitos: durante.efeitos, fxObjetos: durante.fxObjetos, reservadas: durante.reservadas, emCena: durante.emCena };
    assert.ok(durante.fxObjetos > 0, 'o nascer põe objetos de efeito na cena (anel, faíscas)');
    assert.ok(durante.reservadas > 0, 'as peças que ainda vão nascer ficam escondidas até a vez delas');

    const r = await resposta('b-sql', 'coop_banco_sql', { projeto: pj, nome: 'cria empresas e pacientes' }, t0);
    assert.equal(r.ok, true, r.erro);
    const arqRel = 'projetos/' + pj + '/banco/0001_cria_empresas_e_pacientes.sql';
    assert.match(r.resultado.texto, new RegExp('^Migração aplicada no banco local de Agenda Banco e gravada em ' + arqRel.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '\\.'));
    assert.match(r.resultado.texto, /Nasceram na Máquina, com corpo: Gaveta "empresas" \(2 colunas, chave: cada empresa vê só o seu\); Gaveta "pacientes" \(5 colunas, chave: cada empresa vê só o seu\); Porta "contar_pacientes" \(função\); Robô "boas_vindas_paciente" \(gatilho: antes de inserir em pacientes\)\./);
    assert.match(r.resultado.texto, /Fios: pacientes → empresas\./);
    assert.match(r.resultado.texto, /A Máquina abriu em 3D: 8 de 8 efeitos tocaram\./);
    assert.match(r.resultado.texto, /É o banco local deste computador/);
    assert.deepEqual(r.resultado.dados.falhas, []);
    assert.equal(r.resultado.dados.arquivo, arqRel);
    assert.deepEqual(r.resultado.dados.mudancas.map((x) => x.k), ['tabela', 'tabela', 'rls', 'rls', 'politica', 'politica', 'fio', 'funcao', 'funcao', 'gatilho']);

    /* (a) as peças do banco no estado da equipe, assinadas pelo agente */
    const m = await medir();
    resultado.casos.pecas = m.pecas;
    resultado.casos.fios = m.fios;
    assert.deepEqual(m.pecas.map((p) => p.id), [GAVETA_E, GAVETA_P, PORTA_BD, ROBO]);
    assert.ok(m.pecas.every((p) => p.banco && p.assinatura === 'Rita · Theus'), 'todas banco:true, assinadas Rita · Theus');
    const [pe, pp, pf, pr] = m.pecas;
    assert.deepEqual([pe.tipo, pe.nome, pp.tipo, pp.nome, pf.tipo, pf.nome, pr.tipo, pr.nome], ['gaveta', 'empresas', 'gaveta', 'pacientes', 'porta', 'contar_pacientes', 'robo', 'boas_vindas_paciente']);
    assert.deepEqual(pf.campos, ['empresa integer']);
    assert.equal(pf.frase, 'função do banco local: contar_pacientes(empresa integer)');
    assert.deepEqual(pe.campos, ['id (número · integer · chave)', 'nome (texto · text)']);
    assert.deepEqual(pp.campos, ['id (número · integer · chave)', 'empresa_id (ligação com empresas · integer)', 'nome (texto · text)', 'nascimento (data · date)', 'boas_vindas (texto · text)']);
    assert.equal(pe.chave, 'cada empresa vê só o seu');
    assert.equal(pp.chave, 'cada empresa vê só o seu');
    assert.match(pp.frase, /regra de acesso: "cada empresa vê só o seu" \(tudo\)/);
    assert.equal(pr.quando, 'antes de inserir');
    assert.match(pr.frase, /gatilho do banco local: antes de inserir em pacientes, roda boas_vindas\(\)/);
    assert.deepEqual(m.fios, [[GAVETA_P, GAVETA_E], [GAVETA_P, ROBO]], 'fio pacientes → empresas e gaveta → robô');
    /* a função do gatilho aparece no robô, não vira porta solta; a outra função é a Porta */
    assert.deepEqual(m.pecas.filter((p) => /^bd-f-/.test(p.id)).map((p) => p.id), [PORTA_BD]);

    /* a migração é um arquivo na pasta compartilhada; os dados, fora dela */
    const arq = path.join(pasta, 'projetos', pj, 'banco', '0001_cria_empresas_e_pacientes.sql');
    assert.ok(fs.existsSync(arq), 'arquivo da migração: ' + arq);
    const conteudo = fs.readFileSync(arq, 'utf8');
    assert.match(conteudo, /^-- babel-coop · migração 0001 do projeto /);
    assert.ok(conteudo.includes(MIGRACAO), 'o arquivo guarda o SQL inteiro');
    assert.ok(fs.existsSync(path.join(raiz, '.coop', 'bancos', pj, 'PG_VERSION')), 'dados do Postgres em <raiz>/.coop/bancos/<projeto>');
    assert.ok(!fs.existsSync(path.join(pasta, '.coop')), 'nada do banco dentro da pasta compartilhada além da migração');
    resultado.casos.arquivo = { caminho: arq, bytes: conteudo.length };

    /* o diário guardou as peças assinadas (as outras Estações aplicam o mesmo) */
    const diario = await est.api('/api/diario');
    const doBanco = diario.filter((x) => x.acao === 'porAgente' && (x.args[1] === 'maquinaPeca' || x.args[1] === 'maquinaLigar')).map((x) => x.args[1] + ':' + (x.args[2][0].peca ? x.args[2][0].peca.id : x.args[2][0].de + '>' + x.args[2][0].para));
    assert.deepEqual(doBanco, ['maquinaPeca:' + GAVETA_E, 'maquinaPeca:' + GAVETA_P, 'maquinaLigar:' + GAVETA_P + '>' + GAVETA_E, 'maquinaPeca:' + PORTA_BD, 'maquinaPeca:' + ROBO]);

    /* (b) a fila de efeitos desta chamada: em ordem, todos tocados no 3D */
    const reg = (await registro()).slice(antes.registro);
    resultado.casos.efeitosSql = reg;
    assert.deepEqual(reg.map((x) => x.tipo + ' ' + x.peca), [
      'nascer ' + GAVETA_E, 'nascer ' + GAVETA_P, 'cadeado ' + GAVETA_E, 'cadeado ' + GAVETA_P,
      'fio ' + GAVETA_P + '>' + GAVETA_E, 'nascer ' + PORTA_BD, 'nascer ' + ROBO, 'fio ' + GAVETA_P + '>' + ROBO
    ]);
    assert.ok(reg.every((x) => x.tocou === true && x.onde === '3d'), 'todos tocaram no 3D: ' + JSON.stringify(reg.map((x) => [x.tipo, x.tocou, x.motivo])));
    assert.ok(reg.every((x) => x.ms >= 400 && x.ms < 2500), 'cada efeito com começo e fim (~0,4–2,5 s): ' + JSON.stringify(reg.map((x) => x.ms)));
    assert.equal(await est.page.evaluate(() => BC.maquinaEfeitos.ocupado()), false);

    /* as peças do banco têm corpo no 3D (nunca tracejadas) e o selo "no banco local"; nada de efeito sobrando na cena */
    const med = await ate(async () => { const x = await medir(); return x.med && x.med.animando === 0 && x.med.fxObjetos === 0 ? x : null; }, { ms: 8000, oque: 'o 3D sossegar' });
    resultado.casos.tresD = { med: med.med, rotulos: med.rotulos, legenda: med.legenda, fiosEmCena: med.fiosEmCena };
    await print('banco-3-depois.png');
    assert.equal(med.med.pj, pj);
    assert.equal(med.med.total, 4);
    assert.equal(med.med.comCorpo, 4, 'as 4 peças do banco com corpo no 3D');
    assert.equal(med.med.tracejadas, 0);
    assert.equal(med.med.emCena, 4);
    assert.equal(med.med.reservadas, 0, 'nada ficou escondido');
    assert.equal(med.fiosEmCena, 2);
    /* o selo "no banco local" nas 4; as gavetas já com o nº real de linhas (0: ainda sem dados) */
    assert.deepEqual(med.rotulos.map((x) => [x.texto, x.banco, x.tracejada]), [['empresasno banco local · 0 linhas', true, false], ['pacientesno banco local · 0 linhas', true, false], ['contar_pacientesno banco local', true, false], ['boas_vindas_pacienteno banco local', true, false]]);
    assert.match(med.legenda, /^4 peças com corpo \(4 no banco local\) · 2 fios$/);
    /* depois dos efeitos o 3D fica parado: em 7 s, no máximo o quadro de esfriar os rótulos (nada de laço em repouso) */
    const r0 = med.med.renders;
    await esperar(7000);
    const repouso = (await medir()).med;
    resultado.casos.repouso = { quadros7s: repouso.renders - r0, animando: repouso.animando };
    assert.ok(repouso.renders - r0 <= 2 && repouso.animando === 0, 'o 3D parado não desenha em laço: ' + JSON.stringify(resultado.casos.repouso));
    /* no 2D também: com corpo, sem tracejado */
    await est.page.click('.mq2 .mq-zoom [data-z="dominio"]');
    const d2 = await est.page.evaluate(() => {
      return [...document.querySelectorAll('.mq2 .mq-peca[data-no^="bd-"]')].map((el) => ({ id: el.getAttribute('data-no'), banco: el.classList.contains('banco'), local: el.classList.contains('local'), borda: getComputedStyle(el).borderTopStyle }));
    });
    resultado.casos.dois_d = d2;
    assert.equal(d2.length, 4);
    assert.ok(d2.every((x) => x.banco && !x.local && x.borda !== 'dashed'), 'no 2D as peças do banco não são tracejadas: ' + JSON.stringify(d2));
  });

  async function medir() { return medirMaquina(est.page, pj); }

  it('(c) coop_banco_consulta insere 3 pacientes: o gatilho roda, efeito "dados" tocado e a contagem 3 aparece', async () => {
    /* a Máquina está no 2D (fim do caso anterior): a própria consulta abre o 3D antes de tocar os dados */
    const n0 = (await registro()).length;
    const t0 = Date.now();
    await enviar('b-inserir', 'coop_banco_consulta', { projeto: pj, sql: INSERIR });
    await efeitoNoAr('b-inserir', 'dados', 60000);
    await esperar(350);
    await print('banco-4-dados-entrando.png');
    const r = await resposta('b-inserir', 'coop_banco_consulta', { projeto: pj }, t0);
    assert.equal(r.ok, true, r.erro);
    assert.match(r.resultado.texto, /^INSERT no banco local de Agenda Banco: 3 linhas afetadas\. Mudou: empresas \+1, pacientes \+3\. Linhas agora: empresas 1 · pacientes 3\./);
    assert.match(r.resultado.texto, /A Máquina abriu em 3D: 2 de 2 efeitos tocaram\./);
    assert.deepEqual(r.resultado.dados.linhas, [
      { nome: 'Pessoa A', boas_vindas: 'Bem-vindo, Pessoa A!' },
      { nome: 'Pessoa B', boas_vindas: 'Bem-vindo, Pessoa B!' },
      { nome: 'Pessoa C', boas_vindas: 'Bem-vindo, Pessoa C!' }
    ], 'o gatilho de boas-vindas rodou no Postgres');
    assert.deepEqual(r.resultado.dados.contagens, { empresas: 1, pacientes: 3 });

    const reg = (await registro()).slice(n0);
    resultado.casos.efeitosDados = reg;
    assert.deepEqual(reg.map((x) => [x.tipo, x.peca, x.tocou, x.onde]), [['dados', GAVETA_E, true, '3d'], ['dados', GAVETA_P, true, '3d']]);
    assert.equal(await est.page.evaluate((id) => BC.maquina.contagem(id, 'bd-t-pacientes'), pj), 3);

    /* a contagem real no rótulo do 3D e no rodapé da gaveta (2D) */
    const m = await ate(async () => { const x = await medir(); return x.med && x.med.animando === 0 && x.rotulos.some((y) => /^pacientes ?no banco local · 3 linhas$/.test(y.texto)) ? x : null; }, { ms: 8000, oque: 'o rótulo 3D com 3 linhas' });
    resultado.casos.rotulosComContagem = m.rotulos;
    assert.ok(m.rotulos.some((y) => /^empresas ?no banco local · 1 linha$/.test(y.texto)), JSON.stringify(m.rotulos));
    await est.page.click('.mq2 .mq-zoom [data-z="dominio"]');
    const rodape = await ate(() => est.page.evaluate(() => { const el = document.querySelector('.mq2 .mq-peca[data-no="bd-t-pacientes"] .mq-rodape-peca'); return el ? el.textContent.replace(/\s+/g, ' ').trim() : null; }), { oque: 'o rodapé da gaveta no 2D' });
    resultado.casos.rodape = rodape;
    await print('banco-5-rodape-2d.png');
    assert.equal(rodape, 'TABELA · pacientes · 3 linhas');
  });

  it('(d) SQL errado: a mensagem do Postgres volta, nada é gravado, nenhuma peça nova, efeito "erro" na gaveta', async () => {
    /* de novo no 2D (fim do caso anterior): o erro também abre o 3D antes de tremer a gaveta */
    const pecasAntes = (await medir()).pecas.map((p) => p.id);
    const n0 = (await registro()).length;
    const t0 = Date.now();
    await enviar('b-errado', 'coop_banco_sql', { projeto: pj, sql: ERRADO, nome: 'telefone' });
    await efeitoNoAr('b-errado', 'erro', 60000);
    await esperar(200);
    await print('banco-6-erro.png');
    const r = await resposta('b-errado', 'coop_banco_sql', { projeto: pj, nome: 'telefone' }, t0);
    assert.equal(r.ok, false);
    assert.match(r.erro, /^o Postgres recusou: type "textoo" does not exist \(na linha 2\)\. Nada foi gravado: a transação foi desfeita e nenhum arquivo de migração foi criado\./);
    const reg = (await registro()).slice(n0);
    resultado.casos.efeitoErro = reg;
    assert.deepEqual(reg.map((x) => [x.tipo, x.peca, x.tocou, x.onde]), [['erro', GAVETA_P, true, '3d']]);
    const m = await medir();
    assert.deepEqual(m.pecas.map((p) => p.id), pecasAntes, 'nenhuma peça nova');
    assert.deepEqual(fs.readdirSync(path.join(pasta, 'projetos', pj, 'banco')), ['0001_cria_empresas_e_pacientes.sql'], 'nenhum arquivo novo');
    const s = (await est.api('/api/banco/estado?projeto=' + pj)).snapshot;
    assert.deepEqual(s.tabelas.map((t) => t.nome), ['empresas', 'pacientes'], 'a tabela "rascunho" não ficou (a transação inteira voltou)');
    assert.ok(!s.tabelas[1].colunas.some((c) => c.nome === 'telefone'));
    const sossegou = await ate(async () => { const x = await medir(); return x.med && x.med.animando === 0 && x.med.fxObjetos === 0 ? x : null; }, { ms: 8000, oque: 'o erro acabar' });
    assert.equal(await est.page.evaluate(() => document.querySelectorAll('#e-conteudo .v3c-fx-erro, #e-conteudo .v3c-rotulo.erro').length), 0, 'o vermelho sai quando o efeito acaba');
    resultado.casos.depoisDoErro = sossegou.med;
  });

  it('sem movimento (prefers-reduced-motion): coluna nova e linha nova piscam só na cor, rápido, e nada fica na cena', async () => {
    await est.page.emulateMedia({ reducedMotion: 'reduce' });
    try {
      assert.equal(await est.page.evaluate(() => BC.organismo ? BC.organismo.semMovimento() : BC.util.movimentoReduzido()), true);
      const n0 = (await registro()).length;
      const r = await chamar('b-cidade', 'coop_banco_sql', { projeto: pj, sql: 'alter table empresas add column cidade text;', nome: 'cidade da empresa' });
      assert.equal(r.ok, true, r.erro);
      assert.match(r.resultado.texto, /gravada em projetos\/[\w-]+\/banco\/0002_cidade_da_empresa\.sql\./);
      assert.match(r.resultado.texto, /Mudaram: Gaveta "empresas": 3 colunas\./);
      assert.match(r.resultado.texto, /A Máquina abriu em 3D: 1 de 1 efeito tocou\./);
      const campos = await est.page.evaluate((id) => BC.maquina.pecaDoEstado(id, 'bd-t-empresas').campos, pj);
      assert.deepEqual(campos, ['id (número · integer · chave)', 'nome (texto · text)', 'cidade (texto · text)'], 'a coluna nova vira campo da gaveta');
      const r2 = await chamar('b-mais-uma', 'coop_banco_consulta', { projeto: pj, sql: "insert into empresas (nome, cidade) values ('Empresa B', 'Recife')" });
      assert.equal(r2.ok, true, r2.erro);
      assert.match(r2.resultado.texto, /^INSERT no banco local de Agenda Banco: 1 linha afetada\. Mudou: empresas \+1\. Linhas agora: empresas 2 · pacientes 3\./);
      const reg = (await registro()).slice(n0);
      resultado.casos.semMovimento = { registro: reg, ms: [resultado.casos['b-cidade'].ms, resultado.casos['b-mais-uma'].ms] };
      assert.deepEqual(reg.map((x) => [x.tipo, x.peca, x.tocou, x.onde]), [['nascer', GAVETA_E, true, '3d'], ['dados', GAVETA_E, true, '3d']]);
      assert.ok(reg.every((x) => /sem movimento/.test(x.motivo) && x.ms < 700), 'só a cor, sem esperar a fila de ~1 s: ' + JSON.stringify(reg));
      const m = await ate(async () => { const x = await medir(); return x.med && x.med.animando === 0 && x.med.fxObjetos === 0 ? x : null; }, { ms: 5000, oque: 'o 3D sossegar sem movimento' });
      assert.equal(m.med.reservadas, 0, 'sem movimento nada fica escondido');
      assert.ok(m.rotulos.some((y) => /^empresas ?no banco local · 2 linhas$/.test(y.texto)), JSON.stringify(m.rotulos));
    } finally {
      await est.page.emulateMedia({ reducedMotion: 'no-preference' });
    }
  });

  it('(e) fechar e reabrir a Estação com a mesma raiz: o banco continua com as tabelas e as 3 linhas', async () => {
    await est.fechar();
    est = null;
    est = await abrirEstacao({ nome: 'banco', raiz, porta: PORTA, descoberta: DESCOBERTA });
    vigiar(est.page);
    await preparar();
    const r = await chamar('b-estado', 'coop_banco_estado', { projeto: pj });
    assert.equal(r.ok, true, r.erro);
    const t = r.resultado.texto;
    assert.match(t, /^Banco local de Agenda Banco \(Postgres deste computador; a nuvem vem depois\): 2 tabelas\./);
    assert.match(t, /\n- empresas · 2 linhas · RLS ligado: "cada empresa vê só o seu" \(tudo\) · colunas: id integer pk not null, nome text not null, cidade text\n/);
    assert.match(t, /\n- pacientes · 3 linhas · RLS ligado: "cada empresa vê só o seu" \(tudo\) · colunas: id integer pk not null, empresa_id integer not null, nome text not null, nascimento date, boas_vindas text/);
    assert.match(t, /\nVínculos: pacientes\.empresa_id → empresas\./);
    assert.match(t, /\nFunções: boas_vindas\(\); contar_pacientes\(empresa integer\)\./);
    assert.match(t, /\nGatilhos: pacientes "boas_vindas_paciente" antes de inserir → boas_vindas\(\)\./);
    /* a Máquina volta do diário com as peças do banco, e a contagem real volta pela leitura do banco */
    await est.page.evaluate((id) => { BC.estacao.fecharTodas(); BC.maquina.abrir3d(id); }, pj);
    const m = await ate(async () => { const x = await medir(); return x.med && x.med.pronto && x.med.emCena === 4 && x.rotulos.some((y) => /3 linhas$/.test(y.texto)) ? x : null; }, { ms: 30000, oque: 'o 3D da Máquina reaberta' });
    resultado.casos.reaberto = { med: m.med, rotulos: m.rotulos, pecas: m.pecas.map((p) => p.id) };
    await esperar(300);
    await print('banco-7-reaberto.png');
    assert.deepEqual(m.pecas.map((p) => p.id), [GAVETA_E, GAVETA_P, PORTA_BD, ROBO]);
    assert.equal(m.med.comCorpo, 4);
    assert.equal(m.med.tracejadas, 0);
  });

  it('(g) outra Estação, chave pela regra, gatilho de mesmo nome, cadeado que abre e a parede da TV com corpo', async () => {
    /* a Estação do Davi (outro computador, outro banco) chega pelo diário: monta a gaveta produtos no banco DELA e tenta tirar
       e mudar gavetas do banco do Theus (o que a varredura antiga fazia). A Máquina é da equipe; o banco não. */
    const DAVI = 'davi-estacao-2';
    await est.page.evaluate((d) => BC.real.simular({ tipo: 'pares', lista: [{ id: d, nome: 'Davi' }] }), DAVI);
    const doDavi = (n, acao, d) => est.page.evaluate((m) => BC.real.simular(m), { tipo: 'evento', evento: { id: 'ev-davi-' + n, acao: 'porAgente', quem: DAVI, args: [{ id: 'ag-lu', nome: 'Lu' }, acao, [d], acao], origem: 'janela-davi-' + n } });
    const camposE = (await medir()).pecas.find((p) => p.id === GAVETA_E).campos;
    await doDavi(1, 'maquinaPeca', { projeto: pj, peca: { id: 'bd-t-produtos', tipo: 'gaveta', nome: 'produtos', banco: true, dom: 'banco', campos: ['id (número · integer · chave)'], chave: 'só o dono', frase: 'tabela produtos do banco local' }, fios: [] });
    await doDavi(2, 'maquinaMudar', { projeto: pj, peca: GAVETA_P, sai: true });
    await doDavi(3, 'maquinaMudar', { projeto: pj, peca: GAVETA_E, campos: ['x (texto)'] });
    let m = await ate(async () => { const x = await medir(); return x.pecas.some((p) => p.id === 'bd-t-produtos') ? x : null; }, { oque: 'a gaveta do Davi entrar' });
    assert.ok(m.pecas.some((p) => p.id === GAVETA_P), 'a Estação do Davi não tira a gaveta do banco do Theus');
    assert.deepEqual(m.pecas.find((p) => p.id === GAVETA_E).campos, camposE, 'nem muda os campos dela');
    assert.equal(await est.page.evaluate((id) => BC.maquina.donoBanco(BC.maquina.pecaDoEstado(id, 'bd-t-produtos')), pj), DAVI);

    /* o agente do Theus monta mais no banco DESTE computador: a gaveta do Davi fica (não está aqui, mas também não é daqui) */
    const MAIS = [
      'create table notas (id serial primary key, empresa_id int, texto text);',
      'alter table notas enable row level security;',
      "create policy tenant_isolation on notas using (empresa_id = current_setting('app.empresa', true)::int);",
      'create table avisos (id serial primary key, texto text);',
      'alter table avisos enable row level security;',
      'create policy "cada empresa vê só o seu" on avisos using (true);',
      'create table a2 (id int); create table b2 (id int);',
      'create function set_upd() returns trigger language plpgsql as $$ begin return new; end $$;',
      'create trigger set_updated_at before update on a2 for each row execute function set_upd();',
      'create trigger set_updated_at before update on b2 for each row execute function set_upd();'
    ].join('\n');
    const r = await chamar('b-mais', 'coop_banco_sql', { projeto: pj, sql: MAIS, nome: 'notas avisos e robos' });
    assert.equal(r.ok, true, r.erro);
    assert.deepEqual(r.resultado.dados.falhas, []);
    assert.deepEqual(r.resultado.dados.sairam, [], 'nada do Davi saiu: ' + r.resultado.texto);
    m = await medir();
    const peca = (id) => m.pecas.find((p) => p.id === id);
    assert.ok(peca('bd-t-produtos'), 'a gaveta do banco do Davi continua na Máquina da equipe');
    /* a chave sai da regra, não do nome: tenant_isolation por empresa = cada empresa; "cada empresa vê só o seu" com true = aberta */
    assert.equal(peca('bd-t-notas').chave, 'cada empresa vê só o seu');
    assert.equal(peca('bd-t-avisos').chave, '⚠ aberta para todos');
    assert.match(peca('bd-t-avisos').frase, /regra de acesso: "cada empresa vê só o seu" \(tudo\): true/);
    /* o mesmo gatilho em duas tabelas: dois robôs, cada um com o fio da sua gaveta */
    assert.equal(peca('bd-g-a2-set_updated_at').nome, 'set_updated_at');
    assert.equal(peca('bd-g-b2-set_updated_at').nome, 'set_updated_at · b2');
    assert.ok(m.fios.some((f) => f[0] === 'bd-t-b2' && f[1] === 'bd-g-b2-set_updated_at'));
    /* no 3D, a gaveta do Davi diz de quem é o banco */
    const rot = await ate(async () => { const x = await medir(); return x.rotulos.find((y) => /^produtos/.test(y.texto)) || null; }, { ms: 8000, oque: 'o rótulo da gaveta do Davi' });
    assert.equal(rot.texto, 'produtosno banco local de Davi');
    assert.match(await est.page.evaluate(() => document.querySelector('.mq2 .mq-casa b + span').textContent), /banco local deste computador \(Postgres do projeto\) · \d+ tabelas · e 1 no banco local de Davi · a nuvem vem depois/);
    /* a mesma tabela no banco daqui: a peça continua do Davi e a resposta diz */
    const r2 = await chamar('b-produtos', 'coop_banco_sql', { projeto: pj, sql: 'create table produtos (id int primary key);', nome: 'produtos daqui' });
    assert.equal(r2.ok, true, r2.erro);
    assert.match(r2.resultado.texto, /Já estavam na Máquina por outra Estação \(o banco delas é outro; esta migração não mexe nelas\): Gaveta "produtos" \(no banco local de Davi\)\./);
    assert.equal(await est.page.evaluate((id) => BC.maquina.donoBanco(BC.maquina.pecaDoEstado(id, 'bd-t-produtos')), pj), DAVI);

    /* desligar o RLS abre o cadeado (âmbar, a alça sobe); ligar de novo fecha */
    let n0 = (await registro()).length;
    const ab = await chamar('b-abre', 'coop_banco_sql', { projeto: pj, sql: 'alter table notas disable row level security;', nome: 'abre notas' });
    assert.equal(ab.ok, true, ab.erro);
    assert.match(ab.resultado.texto, /Mudaram: Gaveta "notas": chave "⚠ aberta para todos"/);
    assert.doesNotMatch(ab.resultado.texto, /outra Estação/, 'a nota da gaveta do Davi só vem quando a migração mexe nela');
    let reg = (await registro()).slice(n0);
    assert.deepEqual(reg.map((x) => [x.tipo, x.peca, !!x.abre, x.tocou]), [['cadeado', 'bd-t-notas', true, true]]);
    n0 = (await registro()).length;
    const fe = await chamar('b-fecha', 'coop_banco_sql', { projeto: pj, sql: 'alter table notas enable row level security;', nome: 'fecha notas' });
    assert.equal(fe.ok, true, fe.erro);
    reg = (await registro()).slice(n0);
    assert.deepEqual(reg.map((x) => [x.tipo, x.peca, !!x.abre]), [['cadeado', 'bd-t-notas', false]]);
    assert.equal((await medir()).pecas.find((p) => p.id === 'bd-t-notas').chave, 'cada empresa vê só o seu');

    /* a parede da TV (estado.corpo): as peças do banco com corpo (nunca tracejadas); o que sai do banco sai da parede */
    const corpo = () => est.page.evaluate((id) => { const c = BC.loja.estado.corpo, p = c && c.projetos && c.projetos[id]; return p ? p.pecas.filter((x) => /^bd-/.test(x.id)).map((x) => ({ id: x.id, estado: x.estado, banco: !!x.banco, bancoEm: x.bancoEm || null })) : null; }, pj);
    const naParede = await ate(async () => { const c = await corpo(); return c && c.some((x) => x.id === 'bd-g-b2-set_updated_at') ? c : null; }, { ms: 8000, oque: 'as peças do banco na parede' });
    resultado.casos.parede = naParede;
    assert.ok(naParede.every((x) => x.estado === 'corpo' && x.banco), 'na parede, peça do banco tem corpo: ' + JSON.stringify(naParede.filter((x) => x.estado !== 'corpo' || !x.banco)));
    assert.equal(naParede.find((x) => x.id === 'bd-t-produtos').bancoEm, DAVI);
    /* a TV de verdade (janela #tv escondida, o mesmo caminho do botão "Tela da TV"): a legenda conta as peças do banco com corpo, nenhuma tracejada */
    await est.app.evaluate(({ BrowserWindow }, url) => {
      const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { contextIsolation: true, backgroundThrottling: false } });
      w.loadURL(url);
    }, est.base + '/#tv');
    const tv = await ate(() => est.app.windows().filter((p) => p.url().endsWith('#tv'))[0] || null, { oque: 'a janela da TV' });
    await tv.waitForLoadState('load');
    tv.on('pageerror', (e) => erros.push('tv pageerror: ' + e.message));
    const legendaTv = (n) => ate(() => tv.evaluate((k) => { const t = ((document.getElementById('tv-corpo-legenda') || {}).textContent || '').replace(/\s+/g, ' ').trim(); return t.indexOf(k + ' peças com corpo') === 0 ? t : null; }, n), { ms: 20000, oque: 'a TV mostrar ' + n + ' peças com corpo' });
    const naTv = await legendaTv(naParede.length);
    resultado.casos.tv = naTv;
    assert.doesNotMatch(naTv, /tracejada/, 'na TV, peça do banco não é tracejada: ' + naTv);
    const dr = await chamar('b-drop', 'coop_banco_sql', { projeto: pj, sql: 'drop table a2;', nome: 'tira a2' });
    assert.equal(dr.ok, true, dr.erro);
    assert.match(dr.resultado.texto, /Saíram: .*Gaveta "a2"/);
    const semA2 = await ate(async () => { const c = await corpo(); return c && !c.some((x) => /a2/.test(x.id)) ? c : null; }, { ms: 8000, oque: 'a gaveta a2 sair da parede' });
    assert.ok(semA2.some((x) => x.id === 'bd-t-b2'), 'só o que saiu do banco sai da parede');
    await legendaTv(naParede.length - 2); /* a gaveta a2 e o robô dela saíram da TV também */
    await tv.close().catch(() => {});
  });

  it('(h) migração grande (12 tabelas com RLS, política e vínculo): a animação cabe no orçamento e a próxima chamada não espera', async () => {
    const linhas = [];
    for (let i = 1; i <= 12; i++) {
      const t = 'grande_' + String(i).padStart(2, '0'), pai = i > 1 ? 'grande_' + String(i - 1).padStart(2, '0') : null;
      linhas.push('create table ' + t + ' (id serial primary key, empresa_id int' + (pai ? ', pai_id int references ' + pai + ' (id)' : '') + ');');
      linhas.push('alter table ' + t + ' enable row level security;');
      linhas.push('create policy por_empresa on ' + t + " using (empresa_id = current_setting('app.empresa', true)::int);");
    }
    const n0 = (await registro()).length;
    const t0 = Date.now();
    const r = await chamar('b-grande', 'coop_banco_sql', { projeto: pj, sql: linhas.join('\n'), nome: 'doze tabelas' });
    const ms = Date.now() - t0;
    assert.equal(r.ok, true, r.erro);
    resultado.casos.grande = { ms, texto: r.resultado.texto.slice(-300) };
    assert.doesNotMatch(r.resultado.texto, /ainda estava animando/, 'a fila acabou antes do teto de 15 s');
    assert.match(r.resultado.texto, /A Máquina abriu em 3D: \d+ de 35 efeitos/);
    assert.ok(ms < 15000, 'respondeu em ' + ms + ' ms');
    const reg = (await registro()).slice(n0);
    assert.equal(reg.length, 35);
    assert.ok(reg.filter((x) => x.tocou).every((x) => x.ritmo && x.ritmo <= 0.5), 'lista longa acelera: ' + JSON.stringify(reg.map((x) => x.ritmo)));
    assert.ok(reg.every((x) => x.tocou || /passou do prazo/.test(x.motivo)), 'o que não tocou foi pelo prazo: ' + JSON.stringify(reg.filter((x) => !x.tocou)));
    const med = await ate(async () => { const x = await medir(); return x.med && x.med.animando === 0 && x.med.fxObjetos === 0 ? x.med : null; }, { ms: 8000, oque: 'o 3D sossegar' });
    assert.equal(med.reservadas, 0, 'nada ficou escondido');
    assert.equal(med.emCena, med.total);
    /* a próxima chamada não fica atrás da fila */
    const t1 = Date.now();
    const q = await chamar('b-grande-dados', 'coop_banco_consulta', { projeto: pj, sql: 'insert into grande_01 (empresa_id) values (1)' });
    assert.equal(q.ok, true, q.erro);
    assert.ok(Date.now() - t1 < 6000, 'a consulta seguinte respondeu em ' + (Date.now() - t1) + ' ms');
  });

  it('nenhum erro de página nem aviso das peças do banco e dos efeitos', () => {
    assert.deepEqual(erros, []);
  });
});
