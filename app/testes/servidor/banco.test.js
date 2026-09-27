/* babel-coop · o banco real de cada projeto (servidor/banco.js, PGlite = Postgres 17 em WASM)
   (a) no processo: ler o SQL sem executar (comandos, $$…$$, BEGIN ATOMIC, controle de transação); tabelas com FK, RLS +
       política, função e gatilho → snapshot e mudanças certos e na ordem do contrato; colunas, RLS e remoções depois;
       erro de SQL não grava nada (nem tabela, nem arquivo, nem migração); BEGIN/COMMIT por fora aceito, COMMIT no meio
       recusado; consulta INSERT/SELECT/UPDATE com contagens e deltas; consulta que muda estrutura é desfeita; migração vira
       arquivo NNNN_ sequencial; duas ao mesmo tempo no mesmo projeto entram na fila; fechar e abrir de novo mantém tudo.
   (a2) revisão adversarial: nada sai da transação (nem com a leitura do SQL enganada), a consulta não muda estrutura
       nenhuma, o diff vê mudança por dentro, cabeçalho com a Estação, SELECT grande por cursor, limite de tempo que
       interrompe e reabre, e o laço do servidor livre enquanto o Postgres trabalha.
   (b) Estação de verdade (processo filho): as três rotas locais; recusa quem não é o navegador desta máquina; projeto
       inválido = 400; dados em <raiz>/.coop/bancos/<projeto> e migração na pasta; parar e subir de novo mantém o banco.
   Portas só deste arquivo: HTTP 5230, UDP 41730.
   Rodar: cd app && node --test testes/servidor/banco.test.js
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Bancos, comandos, preparar, comandoDe, jeitoDoUltimo } = require('../../servidor/banco');
const { Estacao, pedirHttp, ipDaRede } = require('./estacoes');

const temporarios = [];
function montar() {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'babel-banco-'));
  temporarios.push(raiz);
  const pasta = path.join(raiz, 'theus');
  fs.mkdirSync(pasta, { recursive: true });
  return { raiz, pasta, b: new Bancos({ raiz: () => raiz, pasta: () => pasta }) };
}
after(() => { temporarios.forEach((r) => { try { fs.rmSync(r, { recursive: true, force: true }); } catch (e) { /* temporário */ } }); });

const PJ = 'pj-clinicas-1';
const CRIAR = `-- clientes, pedidos e o robô que zera o total
create table clientes (id serial primary key, nome text not null, email text);
create table pedidos (
  id serial primary key,
  cliente_id int not null references clientes(id),
  total numeric(10,2)
);
alter table pedidos enable row level security;
create policy "cliente vê os seus" on pedidos for select using (true);
create function zera_total() returns trigger language plpgsql as $$
begin
  new.total := coalesce(new.total, 0); -- ponto e vírgula dentro do corpo
  return new;
end;
$$;
create trigger antes_de_gravar before insert or update on pedidos for each row execute function zera_total();
`;
const arquivosDe = (pasta, pj) => { try { return fs.readdirSync(path.join(pasta, 'projetos', pj, 'banco')).sort(); } catch (e) { return []; } };
const nomes = (snap) => snap.tabelas.map((t) => t.nome);

describe('banco · ler o SQL sem executar', () => {
  it('parte em comandos pulando aspas, $$…$$, comentários e BEGIN ATOMIC', () => {
    const sql = "create function f() returns trigger language plpgsql as $f$ begin; return new; end; $f$;\n" +
      "select 'a;b', E'x\\';y', \"c;d\" from t; -- c;omentário\n/* a /* b; */ c; */ select 1;\n" +
      'create function g() returns int language sql begin atomic select case when true then 1 end; select 2; end;\nselect $1';
    const l = comandos(sql);
    assert.deepEqual(l.map((c) => c.palavras[0].w), ['CREATE', 'SELECT', 'SELECT', 'CREATE', 'SELECT']);
    assert.equal(comandos('  ;; -- só comentário\n').length, 0);
    /* "begin" e "atomic" soltos são nomes: só CREATE FUNCTION/PROCEDURE … BEGIN ATOMIC abre o corpo (senão o COMMIT some da vista) */
    assert.deepEqual(comandos('CREATE TABLE begin (atomic int); DROP TABLE pacientes; COMMIT; BEGIN; SELECT 1/0;').map((c) => c.palavras[0].w), ['CREATE', 'DROP', 'COMMIT', 'BEGIN', 'SELECT']);
    assert.equal(preparar('SELECT begin atomic FROM (SELECT 1 AS begin) s; DROP TABLE pacientes; COMMIT; BEGIN; SELECT 1;').controle, 'COMMIT');
    assert.equal(preparar('create function f() returns int language sql set x = begin, atomic select 1; commit; select 2').controle, 'COMMIT', 'BEGIN e ATOMIC separados por vírgula não abrem corpo');
    assert.equal(comandos('create or replace procedure p() language sql begin /* c */ atomic insert into t values (1); end; select 2').length, 2);
  });

  it('o último comando da consulta: cursor (leitura), LIMIT por fora (RETURNING) ou direto', () => {
    const j = (sql) => jeitoDoUltimo(comandos(sql)[0]);
    assert.equal(j('select * from t'), 'cursor');
    assert.equal(j('with x as (select 1) select * from x'), 'cursor');
    assert.equal(j('select * from t for update'), 'cursor');
    assert.equal(j('values (1), (2)'), 'cursor');
    assert.equal(j('with x as (delete from t returning *) select * from x'), 'direto', 'DML dentro do WITH não entra em cursor');
    assert.equal(j('select * into nova from t'), 'direto');
    assert.equal(j('insert into t values (1) returning *'), 'devolve');
    assert.equal(j('update t set a = 1'), 'direto');
  });

  it('o embrulho BEGIN; … COMMIT; vira espaço (mesmas linhas); COMMIT no meio é controle de transação', () => {
    const p = preparar('begin;\ncreate table a (id int);\ncommit;');
    assert.equal(p.controle, null);
    assert.equal(p.sql.length, 'begin;\ncreate table a (id int);\ncommit;'.length);
    assert.equal(p.sql.trim(), 'create table a (id int);');
    assert.equal(preparar('create table a (id int); commit; drop table a;').controle, 'COMMIT');
    assert.equal(preparar('savepoint x; select 1').controle, 'SAVEPOINT');
    assert.equal(preparar('start transaction; select 1; rollback;').controle, 'START TRANSACTION', 'terminar em ROLLBACK não é o embrulho de migração');
    assert.equal(comandoDe(comandos('with x as (select 1) insert into a select * from x')[0]), 'INSERT');
    assert.equal(comandoDe(comandos('WITH RECURSIVE r(n) AS (SELECT 1 UNION SELECT n+1 FROM r WHERE n < 3) SELECT * FROM r')[0]), 'SELECT');
  });
});

describe('banco · no processo (PGlite de verdade)', { timeout: 120000 }, () => {
  let T;
  before(() => { T = montar(); });
  after(async () => { if (T) await T.b.fechar(); });

  it('projeto sem banco: snapshot vazio, sem criar nada no disco', async () => {
    const r = await T.b.estado(PJ);
    assert.deepEqual(r, { ok: true, snapshot: { tabelas: [], fios: [], politicas: [], gatilhos: [], funcoes: [] } });
    assert.equal(fs.existsSync(path.join(T.raiz, '.coop', 'bancos', PJ)), false);
  });

  it('projeto com id fora de [A-Za-z0-9_-]{1,64} é recusado antes de abrir qualquer coisa', async () => {
    for (const ruim of ['../x', 'a/b', '', 'a'.repeat(65), 'com espaço', null, 42]) {
      await assert.rejects(T.b.aplicar(ruim, 'select 1'), (e) => e.pedido === true, JSON.stringify(ruim));
    }
    await assert.rejects(T.b.aplicar(PJ, '   '), (e) => e.pedido === true);
    assert.equal(fs.existsSync(path.join(T.raiz, '.coop', 'bancos')), false);
  });

  it('tabelas com FK, RLS + política, função e gatilho: snapshot e mudanças na ordem do contrato; vira 0001_<slug>.sql', async () => {
    const r = await T.b.aplicar(PJ, CRIAR, 'Criar clientes e pedidos da clínica');
    assert.equal(r.ok, true, JSON.stringify(r.erro));
    assert.deepEqual(r.mudancas, [
      { k: 'tabela', nome: 'clientes', colunas: [{ nome: 'id', tipo: 'integer', pk: true, nulo: false }, { nome: 'nome', tipo: 'text', pk: false, nulo: false }, { nome: 'email', tipo: 'text', pk: false, nulo: true }] },
      { k: 'tabela', nome: 'pedidos', colunas: [{ nome: 'id', tipo: 'integer', pk: true, nulo: false }, { nome: 'cliente_id', tipo: 'integer', pk: false, nulo: false }, { nome: 'total', tipo: 'numeric(10,2)', pk: false, nulo: true }] },
      { k: 'rls', tabela: 'pedidos', ligado: true },
      { k: 'politica', tabela: 'pedidos', nome: 'cliente vê os seus', cmd: 'SELECT' },
      { k: 'fio', de: 'pedidos', para: 'clientes', coluna: 'cliente_id' },
      { k: 'funcao', nome: 'zera_total', args: '' },
      { k: 'gatilho', tabela: 'pedidos', nome: 'antes_de_gravar', quando: 'BEFORE', evento: 'INSERT OR UPDATE', funcao: 'zera_total' }
    ]);
    assert.deepEqual(r.snapshot.tabelas.map((t) => [t.nome, t.rls, t.linhas]), [['clientes', false, 0], ['pedidos', true, 0]]);
    assert.deepEqual(r.snapshot.fios, [{ de: 'pedidos', para: 'clientes', coluna: 'cliente_id' }]);
    /* a política leva a regra de verdade (usando/checa, permissiva, papéis): a chave da gaveta sai dela, não do nome */
    assert.deepEqual(r.snapshot.politicas, [{ tabela: 'pedidos', nome: 'cliente vê os seus', cmd: 'SELECT', permissiva: true, usando: 'true', checa: null, papeis: ['public'] }]);
    assert.deepEqual(r.snapshot.gatilhos, [{ tabela: 'pedidos', nome: 'antes_de_gravar', quando: 'BEFORE', evento: 'INSERT OR UPDATE', funcao: 'zera_total', ligado: true }]);
    assert.deepEqual(r.snapshot.funcoes, [{ nome: 'zera_total', args: '' }]);
    /* a tabela interna das migrações não aparece */
    assert.ok(!nomes(r.snapshot).some((n) => /migra/.test(n)));
    assert.equal(r.arquivo, 'projetos/' + PJ + '/banco/0001_criar_clientes_e_pedidos_da_clinica.sql');
    const txt = fs.readFileSync(path.join(T.pasta, r.arquivo), 'utf8');
    assert.match(txt, /^-- babel-coop · migração 0001/);
    assert.ok(txt.includes(CRIAR), 'o arquivo leva o SQL inteiro');
    assert.ok(fs.existsSync(path.join(T.raiz, '.coop', 'bancos', PJ, 'PG_VERSION')), 'dados em <raiz>/.coop/bancos/<projeto>');
    assert.deepEqual(await T.b.estado(PJ), { ok: true, snapshot: r.snapshot });
  });

  it('erro de SQL: ROLLBACK, a mensagem do Postgres com a linha, nenhuma tabela, arquivo ou migração nova', async () => {
    const antes = (await T.b.estado(PJ)).snapshot;
    const r = await T.b.aplicar(PJ, 'create table nova (id int);\nselect * from nao_existe;', 'quebra');
    assert.equal(r.ok, false);
    assert.match(r.erro.mensagem, /nao_existe.*does not exist/);
    assert.equal(r.erro.detalhe, 'na linha 2');
    assert.deepEqual(r.mudancas, []);
    assert.deepEqual(r.snapshot, antes);
    assert.deepEqual((await T.b.estado(PJ)).snapshot, antes, 'a tabela do primeiro comando também foi desfeita');
    assert.deepEqual(arquivosDe(T.pasta, PJ), ['0001_criar_clientes_e_pedidos_da_clinica.sql']);
    const m = await T.b.consulta(PJ, 'select n, arquivo from babel_coop.migracoes order by n');
    assert.deepEqual(m.linhas.map((x) => x.n), [1]);
  });

  it('COMMIT no meio é recusado sem executar nada; BEGIN; … COMMIT; por fora é aceito', async () => {
    const r = await T.b.aplicar(PJ, 'drop table pedidos; commit; drop table clientes;');
    assert.equal(r.ok, false); assert.match(r.erro.mensagem, /^COMMIT não entra na migração/);
    assert.deepEqual(nomes((await T.b.estado(PJ)).snapshot), ['clientes', 'pedidos']);
    assert.equal(arquivosDe(T.pasta, PJ).length, 1);
    const ok = await T.b.aplicar(PJ, 'BEGIN;\nalter table clientes add column cidade text;\nCOMMIT;\n');
    assert.equal(ok.ok, true, JSON.stringify(ok.erro));
    assert.deepEqual(ok.mudancas, [{ k: 'coluna', tabela: 'clientes', nome: 'cidade', tipo: 'text' }]);
    assert.equal(ok.arquivo, 'projetos/' + PJ + '/banco/0002_alter_table_clientes.sql', 'sem nome: o slug vem do primeiro comando');
  });

  it('mudanças em tabela que já existia: tabela nova, coluna, rls, política, fio e função, nessa ordem', async () => {
    const r = await T.b.aplicar(PJ, `alter table clientes add column fone text;
create table notas (id serial primary key, pedido_id int references pedidos(id) on delete cascade, texto text);
alter table clientes enable row level security;
create policy "todos leem" on clientes for select using (true);
create function conta_pedidos(c int) returns int language sql as $$ select count(*)::int from pedidos where cliente_id = c $$;`, 'notas e contagem');
    assert.equal(r.ok, true, JSON.stringify(r.erro));
    assert.deepEqual(r.mudancas, [
      { k: 'tabela', nome: 'notas', colunas: [{ nome: 'id', tipo: 'integer', pk: true, nulo: false }, { nome: 'pedido_id', tipo: 'integer', pk: false, nulo: true }, { nome: 'texto', tipo: 'text', pk: false, nulo: true }] },
      { k: 'coluna', tabela: 'clientes', nome: 'fone', tipo: 'text' },
      { k: 'rls', tabela: 'clientes', ligado: true },
      { k: 'politica', tabela: 'clientes', nome: 'todos leem', cmd: 'SELECT' },
      { k: 'fio', de: 'notas', para: 'pedidos', coluna: 'pedido_id' },
      { k: 'funcao', nome: 'conta_pedidos', args: 'c integer' }
    ]);
    assert.equal(r.arquivo.split('/').pop(), '0003_notas_e_contagem.sql');
  });

  it('consulta: INSERT (com o gatilho), SELECT e UPDATE devolvem comando, linhas, total, contagens e o delta', async () => {
    const i = await T.b.consulta(PJ, "insert into clientes (nome) values ('Ana'), ('Bia'), ('Caio');\ninsert into pedidos (cliente_id) values (1), (2) returning id, cliente_id, total");
    assert.equal(i.ok, true, JSON.stringify(i.erro));
    assert.equal(i.comando, 'INSERT');
    assert.equal(i.total, 2);
    assert.deepEqual(i.linhas, [{ id: 1, cliente_id: 1, total: '0.00' }, { id: 2, cliente_id: 2, total: '0.00' }], 'o gatilho zerou o total');
    assert.deepEqual(i.contagens, { clientes: 3, pedidos: 2, notas: 0 });
    assert.deepEqual(i.mudou, { clientes: 3, pedidos: 2 });
    const u = await T.b.consulta(PJ, "update clientes set nome = upper(nome) where nome <> 'Caio'; update clientes set email = 'a@b.c' where id = 1");
    assert.equal(u.comando, 'UPDATE');
    assert.equal(u.total, 1, 'o total é o do último comando, não a soma');
    assert.deepEqual(u.mudou, {});
    const s = await T.b.consulta(PJ, 'select id, nome from clientes order by id');
    assert.equal(s.comando, 'SELECT');
    assert.deepEqual(s.linhas, [{ id: 1, nome: 'ANA' }, { id: 2, nome: 'BIA' }, { id: 3, nome: 'Caio' }]);
    assert.equal(s.total, 3);
    const w = await T.b.consulta(PJ, "with c as (select id from clientes where nome = 'Caio') insert into pedidos (cliente_id) select id from c");
    assert.equal(w.comando, 'INSERT'); assert.equal(w.total, 1); assert.deepEqual(w.mudou, { pedidos: 1 });
    const muitos = await T.b.consulta(PJ, "insert into notas (texto) select 'nota ' || g from generate_series(1, 60) g; select * from notas order by id");
    assert.equal(muitos.linhas.length, 50, 'até 50 linhas');
    assert.equal(muitos.total, 60);
    assert.deepEqual(muitos.mudou, { notas: 60 });
    assert.equal((await T.b.estado(PJ)).snapshot.tabelas.find((t) => t.nome === 'notas').linhas, 60);
  });

  it('consulta com erro (FK) não muda nada; consulta que mexe na estrutura é desfeita', async () => {
    const antes = (await T.b.estado(PJ)).snapshot;
    const e = await T.b.consulta(PJ, "insert into clientes (nome) values ('Duda'); insert into pedidos (cliente_id) values (999)");
    assert.equal(e.ok, false);
    assert.match(e.erro.mensagem, /foreign key/);
    const ddl = await T.b.consulta(PJ, "insert into clientes (nome) values ('Eva'); create table escondida (id int)");
    assert.equal(ddl.ok, false);
    assert.match(ddl.erro.mensagem, /estrutura/);
    const agora = (await T.b.estado(PJ)).snapshot;
    assert.deepEqual(agora, antes, 'nem a Duda, nem a Eva, nem a tabela escondida');
    const seguro = await T.b.consulta(PJ, 'set role pg_read_all_data; select count(*)::int as n from clientes');
    assert.equal(seguro.ok, true, JSON.stringify(seguro.erro));
    assert.equal((await T.b.consulta(PJ, 'select current_user as u')).linhas[0].u, 'postgres', 'o SET ROLE da consulta não fica na sessão');
  });

  it('remoções no fim, do que depende para o que é dependido; o que sai junto com a tabela não se repete', async () => {
    const r = await T.b.aplicar(PJ, `alter table pedidos disable row level security;
drop trigger antes_de_gravar on pedidos;
drop policy "cliente vê os seus" on pedidos;
alter table clientes drop column email;
drop table notas;
drop function zera_total();`, 'limpar');
    assert.equal(r.ok, true, JSON.stringify(r.erro));
    assert.deepEqual(r.mudancas, [
      { k: 'rls', tabela: 'pedidos', ligado: false },
      { k: 'sai', o: 'gatilho', nome: 'antes_de_gravar', tabela: 'pedidos' },
      { k: 'sai', o: 'politica', nome: 'cliente vê os seus', tabela: 'pedidos' },
      { k: 'sai', o: 'coluna', nome: 'email', tabela: 'clientes' },
      { k: 'sai', o: 'tabela', nome: 'notas' },
      { k: 'sai', o: 'funcao', nome: 'zera_total', args: '' }
    ]);
    assert.deepEqual(nomes(r.snapshot), ['clientes', 'pedidos']);
    assert.deepEqual(r.snapshot.gatilhos, []);
  });

  it('duas migrações ao mesmo tempo no mesmo projeto entram na fila e ganham números seguidos', async () => {
    const [a, b] = await Promise.all([
      T.b.aplicar(PJ, 'create table fila_a (id int primary key);', 'fila a'),
      T.b.aplicar(PJ, 'create table fila_b (id int primary key, a int references fila_a(id));', 'fila b')
    ]);
    assert.equal(a.ok, true, JSON.stringify(a.erro)); assert.equal(b.ok, true, JSON.stringify(b.erro));
    assert.equal(a.arquivo.split('/').pop(), '0005_fila_a.sql');
    assert.equal(b.arquivo.split('/').pop(), '0006_fila_b.sql');
    assert.deepEqual(arquivosDe(T.pasta, PJ).map((f) => f.slice(0, 5)), ['0001_', '0002_', '0003_', '0004_', '0005_', '0006_']);
  });

  it('fechar e abrir de novo (outro Bancos, mesma raiz) mantém tabelas, linhas e a numeração', async () => {
    const antes = (await T.b.estado(PJ)).snapshot;
    assert.equal(antes.tabelas.find((t) => t.nome === 'clientes').linhas, 3);
    await T.b.fechar();
    await assert.rejects(T.b.estado(PJ), /fechando/);
    T.b = new Bancos({ raiz: () => T.raiz, pasta: () => T.pasta });
    assert.deepEqual((await T.b.estado(PJ)).snapshot, antes);
    const s = await T.b.consulta(PJ, 'select nome from clientes order by id');
    assert.deepEqual(s.linhas.map((x) => x.nome), ['ANA', 'BIA', 'Caio']);
    const r = await T.b.aplicar(PJ, 'create index clientes_nome on clientes (nome);', 'índice por nome');
    assert.equal(r.ok, true, JSON.stringify(r.erro));
    assert.deepEqual(r.mudancas, [], 'índice não é peça da Máquina');
    assert.equal(r.arquivo.split('/').pop(), '0007_indice_por_nome.sql');
  });

  it('cada projeto tem o seu banco', async () => {
    const r = await T.b.aplicar('pj-outro', 'create table so_aqui (id int);');
    assert.equal(r.ok, true);
    assert.deepEqual(nomes(r.snapshot), ['so_aqui']);
    assert.ok(!nomes((await T.b.estado(PJ)).snapshot).includes('so_aqui'));
    assert.equal(r.arquivo, 'projetos/pj-outro/banco/0001_create_table_so_aqui.sql');
  });
});

/* ------------------------------------------------------------------ (a2) o que a revisão adversarial achou */
describe('banco · revisão adversarial: transação, estrutura pela consulta, diff por dentro, limite e leveza', { timeout: 180000 }, () => {
  let T, raiz, pasta;
  const P = 'pj-revisao';
  before(() => {
    raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'babel-banco-rev-'));
    temporarios.push(raiz);
    pasta = path.join(raiz, 'theus');
    fs.mkdirSync(pasta, { recursive: true });
    T = new Bancos({ raiz: () => raiz, pasta: () => pasta, eu: () => ({ id: 'theus-1', nome: 'Theus' }), limite: 2000 });
  });
  after(async () => { if (T) await T.fechar(); });
  const tabelasDe = async () => (await T.estado(P)).snapshot.tabelas.map((t) => t.nome + ':' + t.linhas);
  const num = (n) => String(n).padStart(4, '0');

  it('SQL não sai da transação: "begin atomic" solto, COMMIT; BEGIN; e SET ROLE depois do COMMIT são recusados sem gravar nada', async () => {
    const c = await T.aplicar(P, 'create table pacientes (id int primary key)', 'pacientes');
    assert.equal(c.ok, true, JSON.stringify(c.erro));
    assert.equal((await T.consulta(P, 'insert into pacientes values (1), (2), (3)')).ok, true);
    const a = await T.aplicar(P, 'CREATE TABLE begin (atomic int); DROP TABLE pacientes; COMMIT; BEGIN; SELECT 1/0;');
    assert.equal(a.ok, false); assert.match(a.erro.mensagem, /^COMMIT não entra na migração/);
    const q = await T.consulta(P, 'SELECT begin atomic FROM (SELECT 1 AS begin) s; DROP TABLE pacientes; COMMIT; BEGIN; SELECT 1;');
    assert.equal(q.ok, false); assert.match(q.erro.mensagem, /^COMMIT não entra na consulta/);
    const r = await T.aplicar(P, 'CREATE TABLE begin (atomic int); COMMIT; SET ROLE pg_read_all_data;');
    assert.equal(r.ok, false);
    assert.deepEqual(await tabelasDe(), ['pacientes:3'], 'pacientes continua com as 3 linhas; a tabela "begin" não ficou');
    assert.deepEqual(arquivosDe(pasta, P), ['0001_pacientes.sql']);
    assert.equal((await T.consulta(P, 'select current_user as u')).linhas[0].u, 'postgres', 'nenhum SET ROLE ficou na sessão');
  });

  it('a leitura do SQL pode errar e ainda assim nada escapa: cada comando vai sozinho e o Postgres recusa dois no mesmo texto', async () => {
    /* com standard_conforming_strings desligado pelo próprio SQL, o Postgres vê COMMIT e DROP onde a leitura vê uma string só */
    const truque = "SET standard_conforming_strings = off;\nSELECT 'x\\' , ' ; COMMIT ; DROP TABLE pacientes ; SELECT ' , '\n'y';";
    const a = await T.aplicar(P, truque);
    assert.equal(a.ok, false); assert.match(a.erro.mensagem, /cannot insert multiple commands/);
    const q = await T.consulta(P, truque);
    assert.equal(q.ok, false); assert.match(q.erro.mensagem, /cannot insert multiple commands/);
    assert.deepEqual(await tabelasDe(), ['pacientes:3']);
    assert.deepEqual(arquivosDe(pasta, P), ['0001_pacientes.sql']);
  });

  it('consulta que mexe em qualquer estrutura é desfeita (regra, corpo de função, gatilho, CHECK, DEFAULT, FORCE, papel, GRANT, schema, babel_coop)', async () => {
    const m = await T.aplicar(P, [
      'alter table pacientes add column empresa_id int;',
      'alter table pacientes enable row level security;',
      "create policy cada_empresa on pacientes using (empresa_id = current_setting('app.empresa', true)::int);",
      'create function boas() returns trigger language plpgsql as $$ begin return new; end $$;',
      'create trigger t_boas before insert on pacientes for each row execute function boas();'
    ].join('\n'), 'regras');
    assert.equal(m.ok, true, JSON.stringify(m.erro));
    const antes = (await T.estado(P)).snapshot;
    const casos = [
      'ALTER POLICY cada_empresa ON pacientes USING (true)',
      'CREATE OR REPLACE FUNCTION boas() RETURNS trigger LANGUAGE plpgsql AS $$ begin new.id := new.id + 1; return new; end $$',
      'ALTER TABLE pacientes DISABLE TRIGGER t_boas',
      'ALTER TABLE pacientes ADD CONSTRAINT positivo CHECK (id > 0)',
      'ALTER TABLE pacientes ALTER COLUMN empresa_id SET DEFAULT 1',
      'ALTER TABLE pacientes FORCE ROW LEVEL SECURITY',
      'CREATE ROLE fraco',
      'GRANT SELECT ON pacientes TO public',
      'CREATE SCHEMA outro',
      'DROP SCHEMA babel_coop CASCADE'
    ];
    for (const c of casos) {
      const r = await T.consulta(P, 'insert into pacientes (id) values (99);\n' + c);
      assert.equal(r.ok, false, c + ' passou: ' + JSON.stringify(r));
      assert.match(r.erro.mensagem, /mudou a estrutura do banco e foi desfeita/, c);
    }
    assert.deepEqual((await T.estado(P)).snapshot, antes, 'nada ficou: nem a linha 99, nem a mudança');
    const depois = await T.aplicar(P, 'alter table pacientes add column idade int', 'idade');
    assert.equal(depois.ok, true, 'o schema interno continua de pé: ' + JSON.stringify(depois.erro));
    assert.equal(depois.arquivo.split('/').pop(), '0003_idade.sql');
  });

  it('o diff vê mudança por dentro: tipo e DEFAULT da coluna, regra da política, corpo da função e gatilho desligado', async () => {
    const c = await T.aplicar(P, 'alter table pacientes alter column idade type smallint; alter table pacientes alter column idade set not null;', 'idade curta');
    assert.equal(c.ok, false, 'NOT NULL com linhas nulas: o Postgres recusa');
    const c2 = await T.aplicar(P, 'alter table pacientes alter column idade type smallint; alter table pacientes alter column idade set default 0;', 'idade curta');
    assert.equal(c2.ok, true, JSON.stringify(c2.erro));
    assert.deepEqual(c2.mudancas, [{ k: 'coluna', tabela: 'pacientes', nome: 'idade', tipo: 'smallint' }]);
    const nn = await T.aplicar(P, 'update pacientes set idade = 0; alter table pacientes alter column idade set not null;', 'idade obrigatoria');
    assert.deepEqual(nn.mudancas, [{ k: 'coluna', tabela: 'pacientes', nome: 'idade', tipo: 'smallint' }], 'NOT NULL numa coluna que já existia');
    assert.equal(nn.snapshot.tabelas[0].colunas.find((x) => x.nome === 'idade').nulo, false);
    const p = await T.aplicar(P, 'alter policy cada_empresa on pacientes using (true);', 'abre');
    assert.deepEqual(p.mudancas, [{ k: 'politica', tabela: 'pacientes', nome: 'cada_empresa', cmd: 'ALL' }]);
    assert.equal(p.snapshot.politicas[0].usando, 'true');
    const f = await T.aplicar(P, 'create or replace function boas() returns trigger language plpgsql as $$ begin new.idade := 1; return new; end $$;', 'corpo novo');
    assert.deepEqual(f.mudancas, [{ k: 'funcao', nome: 'boas', args: '' }]);
    const g = await T.aplicar(P, 'alter table pacientes disable trigger t_boas;', 'desliga');
    assert.deepEqual(g.mudancas, [{ k: 'gatilho', tabela: 'pacientes', nome: 't_boas', quando: 'BEFORE', evento: 'INSERT', funcao: 'boas' }]);
    assert.equal(g.snapshot.gatilhos[0].ligado, false);
    assert.deepEqual((await T.aplicar(P, 'create index p_idade on pacientes (idade)', 'indice')).mudancas, [], 'índice não é peça da Máquina');
  });

  it('gatilho com o mesmo nome em duas tabelas: o snapshot traz os dois', async () => {
    const r = await T.aplicar(P, [
      'create table a (id int); create table c (id int);',
      'create function set_upd() returns trigger language plpgsql as $$ begin return new; end $$;',
      'create trigger set_updated_at before update on a for each row execute function set_upd();',
      'create trigger set_updated_at before update on c for each row execute function set_upd();'
    ].join('\n'), 'mesmo nome');
    assert.equal(r.ok, true, JSON.stringify(r.erro));
    assert.deepEqual(r.snapshot.gatilhos.filter((g) => g.nome === 'set_updated_at').map((g) => g.tabela), ['a', 'c']);
  });

  it('o cabeçalho da migração diz de qual Estação é o banco e sobre quais migrações rodou (a pasta é da equipe)', async () => {
    const lista = arquivosDe(pasta, P);
    assert.match(fs.readFileSync(path.join(pasta, 'projetos', P, 'banco', lista[0]), 'utf8'), /^-- babel-coop · migração 0001 do projeto pj-revisao · aplicada no banco local de Theus \(Estação theus-1\) em .+\n-- primeira migração deste banco\n/);
    /* uma migração de outra Estação chega pela pasta: o número seguinte pula ela, e o cabeçalho diz que ela é de outro banco */
    const n = lista.length + 1, alheio = num(n) + '_do_davi.sql';
    fs.writeFileSync(path.join(pasta, 'projetos', P, 'banco', alheio), '-- babel-coop · migração do banco local de Davi\ncreate table so_do_davi (id int);\n');
    const r = await T.aplicar(P, 'create table depois_do_davi (id int)', 'depois do davi');
    assert.equal(r.arquivo.split('/').pop(), num(n + 1) + '_depois_do_davi.sql');
    const cab = fs.readFileSync(path.join(pasta, r.arquivo), 'utf8').split('\n')[1];
    assert.equal(cab, '-- rodou depois de ' + lista.map((x, i) => num(i + 1)).join(', ') + ', neste mesmo banco · ' + num(n) + ' desta pasta rodaram em outro banco (outra Estação)');
    assert.ok(!(await T.estado(P)).snapshot.tabelas.some((t) => t.nome === 'so_do_davi'), 'o arquivo de outra Estação não roda aqui');
  });

  it('SELECT grande lê por cursor: 50 linhas e o total certo, sem trazer tudo; RETURNING grande também', async () => {
    const s = await T.consulta(P, "SELECT g, repeat('x', 200) AS r FROM generate_series(1, 300000) g");
    assert.equal(s.ok, true, JSON.stringify(s.erro));
    assert.equal(s.linhas.length, 50); assert.equal(s.total, 300000); assert.equal(s.linhas[49].g, 50);
    const i = await T.consulta(P, 'insert into a select generate_series(1, 200) returning id');
    assert.equal(i.comando, 'INSERT'); assert.equal(i.total, 200); assert.equal(i.linhas.length, 50); assert.deepEqual(i.linhas[0], { id: 1 });
    assert.deepEqual(i.mudou, { a: 200 });
    const u = await T.consulta(P, 'select id from pacientes order by id for update');
    assert.deepEqual(u.linhas.map((x) => x.id), [1, 2, 3]);
  });

  it('consulta sem fim é interrompida no limite (o laço do servidor segue vivo) e o banco reabre com tudo', async () => {
    let maior = 0, ult = Date.now();
    const iv = setInterval(() => { const a = Date.now(); maior = Math.max(maior, a - ult); ult = a; }, 20);
    try {
      const t0 = Date.now();
      const s = await T.consulta(P, 'SELECT pg_sleep(60)');
      assert.equal(s.ok, false); assert.match(s.erro.mensagem, /^a consulta passou de 2 s e foi interrompida: o Postgres local do projeto foi reiniciado/);
      const r = await T.consulta(P, 'insert into pacientes (id, idade) values (500, 1); WITH RECURSIVE r(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM r) SELECT count(*) FROM r');
      assert.equal(r.ok, false);
      assert.ok(Date.now() - t0 < 12000, 'as duas pararam no limite: ' + (Date.now() - t0) + ' ms');
      const m = await T.aplicar(P, 'create table nao_fica (id int); select pg_sleep(60);', 'dorme');
      assert.equal(m.ok, false); assert.match(m.erro.mensagem, /^a migração passou de 2 s.*Nenhum arquivo de migração foi criado\./);
      assert.ok(!m.snapshot.tabelas.some((t) => t.nome === 'nao_fica'));
      assert.ok(m.snapshot.tabelas.some((t) => t.nome === 'pacientes'), 'o snapshot vem do banco reaberto');
    } finally { clearInterval(iv); }
    assert.ok(maior < 400, 'o laço do servidor não travou esperando o Postgres: maior parada ' + maior + ' ms');
    assert.ok(!arquivosDe(pasta, P).some((f) => /dorme/.test(f)));
    const c = await T.consulta(P, 'select count(*)::int as n from pacientes');
    assert.equal(c.linhas[0].n, 3, 'a linha 500 da consulta interrompida não ficou');
  });

  it('resultado grande demais para a memória derruba só o trabalhador do banco: o servidor segue e nada fica gravado', async () => {
    const pouca = new Bancos({ raiz: () => raiz, pasta: () => pasta, memoriaMb: 96, limite: 60000 });
    try {
      assert.equal((await pouca.aplicar('pj-memoria', 'create table grande (id int, t text)', 'grande')).ok, true);
      assert.equal((await pouca.consulta('pj-memoria', "insert into grande select g, repeat('x', 200) from generate_series(1, 1000000) g")).total, 1000000);
      /* DML dentro do WITH não entra em cursor: o resultado inteiro viria para o JS do trabalhador */
      const r = await pouca.consulta('pj-memoria', 'WITH x AS (DELETE FROM grande RETURNING *) SELECT * FROM x');
      assert.equal(r.ok, false);
      assert.match(r.erro.mensagem, /^a consulta passou do limite de memória do banco \(96 MB\) e foi interrompida: o Postgres local do projeto foi reiniciado e desfez o que não tinha sido confirmado\. Nada dela ficou gravado\. Resultado grande demais/);
      assert.equal((await pouca.consulta('pj-memoria', 'select count(*)::int as n from grande')).linhas[0].n, 1000000, 'o DELETE foi desfeito');
    } finally { await pouca.fechar(); }
  });

  it('um milhão de linhas: o laço do servidor não para (o Postgres roda no trabalhador) e a contagem vem certa', async () => {
    let maior = 0, ult = Date.now();
    const iv = setInterval(() => { const a = Date.now(); maior = Math.max(maior, a - ult); ult = a; }, 10);
    let r, s;
    try {
      r = await T.consulta(P, 'insert into c select generate_series(1, 1000000)');
      s = await T.consulta(P, 'select 1 as x');
    } finally { clearInterval(iv); }
    assert.equal(r.ok, true, JSON.stringify(r.erro));
    assert.equal(r.total, 1000000); assert.equal(r.contagens.c, 1000000); assert.deepEqual(r.mudou, { c: 1000000 });
    assert.deepEqual(s.mudou, {});
    assert.ok(maior < 250, 'maior parada do laço: ' + maior + ' ms');
  });
});

/* ------------------------------------------------------------------ (b) Estação de verdade */
describe('banco · rotas locais numa Estação de verdade', { timeout: 120000 }, () => {
  const E = new Estacao({ nome: 'theus-bd', porta: 5230, descoberta: 41730 });
  temporarios.push(E.raiz);
  before(async () => { await E.subir(); });
  after(async () => { await E.parar().catch(() => {}); });

  it('recusa quem não é o navegador desta máquina (outra origem, outro aparelho) e projeto inválido', async () => {
    const mal = { Origin: 'http://evil.example' };
    assert.equal((await E.api('GET', '/api/banco/estado?projeto=pj-a', null, { headers: mal })).status, 403);
    assert.equal((await E.api('POST', '/api/banco/aplicar', { projeto: 'pj-a', sql: 'create table invasor (id int)' }, { headers: mal })).status, 403);
    assert.equal((await E.api('POST', '/api/banco/consulta', { projeto: 'pj-a', sql: 'select 1' }, { headers: mal })).status, 403);
    const ip = ipDaRede();
    if (ip) assert.equal((await pedirHttp({ porta: 5230, host: ip, metodo: 'POST', caminho: '/api/banco/aplicar', corpo: { projeto: 'pj-a', sql: 'create table invasor (id int)' }, headers: { Host: ip + ':5230' } })).status, 403, 'de outro aparelho da rede');
    assert.equal(fs.existsSync(path.join(E.raiz, '.coop', 'bancos', 'pj-a')), false, 'nada foi criado');
    const inv = await E.api('POST', '/api/banco/aplicar', { projeto: '../fora', sql: 'select 1' });
    assert.equal(inv.status, 400); assert.equal(inv.json.ok, false);
    assert.equal((await E.api('GET', '/api/banco/estado?projeto=a%2Fb')).status, 400);
    assert.equal((await E.api('GET', '/api/banco/nada')).status, 404);
  });

  it('aplicar, consultar e ler o estado pelo HTTP; erro volta 200 com ok:false e sem arquivo', async () => {
    const eu = await E.eu();
    const a = await E.api('POST', '/api/banco/aplicar', { projeto: 'pj-a', nome: 'Clientes', sql: 'create table clientes (id serial primary key, nome text not null);\ncreate table pedidos (id serial primary key, cliente_id int references clientes(id));' });
    assert.equal(a.status, 200); assert.equal(a.json.ok, true, JSON.stringify(a.json.erro));
    assert.deepEqual(a.json.mudancas.map((m) => m.k), ['tabela', 'tabela', 'fio']);
    assert.equal(a.json.arquivo, 'projetos/pj-a/banco/0001_clientes.sql');
    assert.ok(fs.existsSync(path.join(eu.pasta, 'projetos', 'pj-a', 'banco', '0001_clientes.sql')), 'na pasta compartilhada');
    assert.ok(fs.existsSync(path.join(E.raiz, '.coop', 'bancos', 'pj-a', 'PG_VERSION')), 'dados fora da pasta compartilhada');
    const e = await E.api('POST', '/api/banco/aplicar', { projeto: 'pj-a', sql: 'create table x (id int);\ncreate table x (id int);' });
    assert.equal(e.status, 200); assert.equal(e.json.ok, false);
    assert.match(e.json.erro.mensagem, /already exists/);
    assert.deepEqual(e.json.mudancas, []); assert.deepEqual(nomes(e.json.snapshot), ['clientes', 'pedidos']);
    assert.deepEqual(fs.readdirSync(path.join(eu.pasta, 'projetos', 'pj-a', 'banco')), ['0001_clientes.sql']);
    const c = await E.api('POST', '/api/banco/consulta', { projeto: 'pj-a', sql: "insert into clientes (nome) values ('Ana'), ('Bia') returning *" });
    assert.equal(c.status, 200);
    assert.deepEqual(c.json, { ok: true, comando: 'INSERT', linhas: [{ id: 1, nome: 'Ana' }, { id: 2, nome: 'Bia' }], total: 2, contagens: { clientes: 2, pedidos: 0 }, mudou: { clientes: 2 } });
    const s = await E.api('GET', '/api/banco/estado?projeto=pj-a');
    assert.equal(s.status, 200);
    assert.deepEqual(s.json.snapshot.tabelas.map((t) => [t.nome, t.linhas]), [['clientes', 2], ['pedidos', 0]]);
    const vazio = await E.api('GET', '/api/banco/estado?projeto=pj-sem-banco');
    assert.deepEqual(vazio.json, { ok: true, snapshot: { tabelas: [], fios: [], politicas: [], gatilhos: [], funcoes: [] } });
  });

  it('parar a Estação e subir de novo: o banco do projeto continua com as tabelas e as linhas', async () => {
    await E.parar();
    await E.subir();
    const s = await E.api('GET', '/api/banco/estado?projeto=pj-a');
    assert.deepEqual(s.json.snapshot.tabelas.map((t) => [t.nome, t.linhas]), [['clientes', 2], ['pedidos', 0]]);
    const c = await E.api('POST', '/api/banco/consulta', { projeto: 'pj-a', sql: 'select nome from clientes order by id' });
    assert.deepEqual(c.json.linhas, [{ nome: 'Ana' }, { nome: 'Bia' }]);
    const a = await E.api('POST', '/api/banco/aplicar', { projeto: 'pj-a', sql: 'alter table clientes add column fone text;' });
    assert.equal(a.json.arquivo, 'projetos/pj-a/banco/0002_alter_table_clientes.sql');
  });
});
