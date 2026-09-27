/* babel-coop · o banco real de cada projeto (PGlite: Postgres 17 em WASM)
   - um banco por projeto, aberto sob demanda num trabalhador próprio (worker_thread): o Postgres em WASM roda fora da thread
     do servidor, então terminais, WebSocket, MCP e as outras rotas seguem vivos enquanto ele trabalha. Os dados ficam em
     <raiz>/.coop/bancos/<projeto>/ (fora da pasta compartilhada)
   - limite: cada operação tem até 30 s (o statement_timeout não vale no PGlite). Passou disso, o trabalhador é morto no meio
     do comando e o Postgres reabre desfazendo o que não foi confirmado; a resposta diz a verdade. Heap do trabalhador tem teto:
     estourou, só ele cai (o app segue)
   - aplicar: a migração inteira numa transação, comando a comando pelo protocolo estendido (um texto com dois comandos é
     recusado pelo próprio Postgres: nada escapa da transação nem se a leitura do SQL errar). Erro = ROLLBACK, nada gravado
     e a mensagem do Postgres volta. Deu certo = arquivo <pasta>/projetos/<projeto>/banco/NNNN_<slug>.sql (o cabeçalho diz de
     qual Estação é o banco e sobre quais migrações dele rodou) e as mudanças do catálogo (antes × depois), na ordem em que a
     Máquina anima: tabela, coluna (nova ou mudada), rls, política, fio, função, gatilho e, por último, o que saiu
   - consulta: dados (INSERT, SELECT, UPDATE…): até 50 linhas (o SELECT lê por cursor: o resultado inteiro nunca vem para o JS),
     o comando, o total e as contagens por tabela antes × depois. Mudar a estrutura pela consulta (qualquer catálogo: regra,
     corpo de função, gatilho desligado, CHECK, DEFAULT, GRANT, papel, schema…) é desfeito: estrutura vai por aplicar
   - estado: o snapshot do schema public (tabelas com colunas, RLS e nº de linhas; fios = chaves estrangeiras; políticas com a
     regra; gatilhos; funções). A tabela das migrações aplicadas mora no schema babel_coop: nunca aparece no snapshot
   - uma operação por vez em cada projeto (fila); o banco parado há 5 min fecha sozinho (e o trabalhador sai); fechar() fecha todos
   O PGlite é ESM e o servidor é CommonJS: entra por import() dinâmico, dentro do trabalhador (este mesmo arquivo).
*/
'use strict';
const fs = require('fs');
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_SQL = 1000000;          /* caracteres por pedido */
const MAX_LINHAS = 50;            /* linhas devolvidas pela consulta */
const OCIOSO = 5 * 60 * 1000;     /* banco sem uso por isto fecha (o app parado continua leve) */
const LIMITE = 30 * 1000;         /* cada operação (migração, consulta, leitura) */
const LIMITE_ABRIR = 60 * 1000;   /* ligar o Postgres (a primeira vez cria o banco) */
const MEMORIA_MB = 768;           /* heap do trabalhador: passou disso, só ele cai */
/* SET da migração ou da consulta (role, search_path, fuso…) valem só para ela: o catálogo e as contagens saem como dono do banco */
const LIMPAR_SESSAO = 'RESET ALL; RESET SESSION AUTHORIZATION; RESET ROLE';
const INTERNO = 'CREATE SCHEMA IF NOT EXISTS babel_coop; CREATE TABLE IF NOT EXISTS babel_coop.migracoes (n int PRIMARY KEY, nome text NOT NULL, arquivo text NOT NULL, sql text NOT NULL, mudancas int NOT NULL DEFAULT 0, em timestamptz NOT NULL DEFAULT now())';
const TEM_INTERNO = "SELECT to_regclass('babel_coop.migracoes') IS NOT NULL AS ok";

let modulo = null;
function pglite() {
  if (!modulo) modulo = import('@electric-sql/pglite').catch((e) => { modulo = null; throw e; });
  return modulo;
}

/* erro do pedido (projeto inválido, SQL vazio): a rota responde 400; erro do Postgres volta como {ok:false} */
function erroPedido(msg) { return Object.assign(new Error(msg), { pedido: true }); }
function conferirProjeto(projeto) { if (typeof projeto !== 'string' || !ID.test(projeto)) throw erroPedido('projeto inválido: use só letras, números, _ e - (até 64)'); return projeto; }
function conferirSql(sql) {
  if (typeof sql !== 'string' || !sql.trim()) throw erroPedido('faltou o SQL');
  if (sql.length > MAX_SQL) throw erroPedido('SQL grande demais (máximo ' + MAX_SQL + ' caracteres)');
  return sql;
}

/* ---------- ler o SQL sem executar: comandos de primeiro nível ----------
   Pula texto entre aspas ('…', E'…', "…"), $tag$…$tag$, comentários (de linha e de bloco, aninhado) e o corpo BEGIN ATOMIC … END
   (só o de CREATE FUNCTION/PROCEDURE: as duas palavras juntas, fora de parênteses; "begin" e "atomic" soltos são nomes).
   Cada comando: {ini, fim, palavras:[{w, prof}]} (w em maiúsculas; prof = profundidade de parênteses). */
const LETRA = /[A-Za-z_\u0080-￿]/, IDENT = /[A-Za-z0-9_$\u0080-￿]/;
function rotina(palavras) { return palavras.length > 1 && palavras[0].w === 'CREATE' && palavras.some((p) => p.prof === 0 && (p.w === 'FUNCTION' || p.w === 'PROCEDURE')); }
function comandos(sql) {
  const lista = [];
  let ini = 0, palavras = [], prof = 0, pilha = [], algo = false, i = 0, junto = false; /* junto: só espaço ou comentário desde a última palavra */
  const fechar = (fim) => { if (algo) lista.push({ ini, fim, palavras }); palavras = []; prof = 0; pilha = []; algo = false; junto = false; };
  while (i < sql.length) {
    const c = sql[i], d = sql[i + 1];
    if (c === '-' && d === '-') { const k = sql.indexOf('\n', i); i = k < 0 ? sql.length : k + 1; continue; }
    if (c === '/' && d === '*') {
      let nivel = 1; i += 2;
      while (i < sql.length && nivel) { if (sql[i] === '/' && sql[i + 1] === '*') { nivel += 1; i += 2; } else if (sql[i] === '*' && sql[i + 1] === '/') { nivel -= 1; i += 2; } else i += 1; }
      continue;
    }
    if (c === "'" || c === '"') {
      const barra = c === "'" && /[eE]/.test(sql[i - 1] || '') && !IDENT.test(sql[i - 2] || ' '); /* E'…' aceita \' */
      algo = true; junto = false; i += 1;
      while (i < sql.length) {
        if (barra && sql[i] === '\\') { i += 2; continue; }
        if (sql[i] === c) { if (sql[i + 1] === c) { i += 2; continue; } i += 1; break; }
        i += 1;
      }
      continue;
    }
    if (c === '$' && !IDENT.test(sql[i - 1] || ' ')) {
      const m = /^\$(?:[A-Za-z_\u0080-￿][A-Za-z0-9_\u0080-￿]*)?\$/.exec(sql.slice(i, i + 80));
      if (m) { const k = sql.indexOf(m[0], i + m[0].length); i = k < 0 ? sql.length : k + m[0].length; algo = true; junto = false; continue; }
    }
    if (LETRA.test(c)) {
      let j = i + 1; while (j < sql.length && IDENT.test(sql[j])) j += 1;
      const w = sql.slice(i, j).toUpperCase();
      const antes = palavras.length ? palavras[palavras.length - 1].w : '';
      if (w === 'ATOMIC' && antes === 'BEGIN' && junto && prof === 0 && !pilha.length && rotina(palavras)) pilha.push('atomic');
      else if (pilha.length && w === 'CASE') pilha.push('case');
      else if (pilha.length && w === 'END') pilha.pop();
      palavras.push({ w, prof }); algo = true; junto = true; i = j;
      continue;
    }
    if (c === ';' && !pilha.length) { fechar(i); ini = i + 1; i += 1; continue; }
    if (c === '(') prof += 1; else if (c === ')') prof = Math.max(0, prof - 1);
    if (!/\s/.test(c)) { algo = true; junto = false; }
    i += 1;
  }
  fechar(sql.length);
  return lista;
}
/* BEGIN/COMMIT/ROLLBACK/SAVEPOINT… dentro do SQL tirariam a migração da nossa transação (e do ROLLBACK) */
function controla(cmd) {
  const [a, b] = cmd.palavras.map((p) => p.w);
  return ['BEGIN', 'COMMIT', 'END', 'ROLLBACK', 'ABORT', 'SAVEPOINT', 'RELEASE'].includes(a) || ((a === 'START' || a === 'PREPARE') && b === 'TRANSACTION');
}
/* o que a transação executa: o embrulho BEGIN; … COMMIT; comum em migração vira espaço (as posições do erro continuam valendo) */
function preparar(sql) {
  let lista = comandos(sql);
  if (!lista.length) throw erroPedido('o SQL só tem comentário');
  const primeiro = lista[0], ultimo = lista[lista.length - 1];
  const w = (cmd, k) => (cmd.palavras[k] || {}).w;
  if (lista.length >= 2 && (w(primeiro, 0) === 'BEGIN' || (w(primeiro, 0) === 'START' && w(primeiro, 1) === 'TRANSACTION')) && (w(ultimo, 0) === 'COMMIT' || w(ultimo, 0) === 'END')) {
    const branco = (s, a, b) => s.slice(0, a) + s.slice(a, b).replace(/[^\n]/g, ' ') + s.slice(b);
    sql = branco(branco(sql, ultimo.ini, Math.min(sql.length, ultimo.fim + 1)), primeiro.ini, Math.min(sql.length, primeiro.fim + 1));
    lista = lista.slice(1, -1);
    if (!lista.length) throw erroPedido('o SQL só tem BEGIN e COMMIT');
  }
  const ctl = lista.find(controla);
  const rotulo = (cmd) => (['START', 'PREPARE'].includes(cmd.palavras[0].w) ? cmd.palavras[0].w + ' TRANSACTION' : cmd.palavras[0].w);
  return { sql, lista, controle: ctl ? rotulo(ctl) : null };
}
/* o comando principal (para a consulta): WITH … INSERT conta como INSERT */
function comandoDe(cmd) {
  const ws = cmd.palavras;
  if (!ws.length) return '';
  if (ws[0].w !== 'WITH') return ws[0].w;
  const v = ws.find((p, k) => k > 0 && p.prof === 0 && ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'MERGE'].includes(p.w));
  return v ? v.w : 'WITH';
}
/* como o último comando da consulta devolve linhas sem trazer tudo para o JS:
   'cursor' (leitura pura: FETCH 50 e MOVE conta o resto), 'devolve' (INSERT/UPDATE/DELETE … RETURNING: LIMIT 50 por fora)
   ou 'direto' (o resto: SHOW, EXPLAIN, CALL, DML sem RETURNING…) */
function jeitoDoUltimo(cmd) {
  const ws = cmd.palavras, w0 = ws[0].w;
  const muda = ws.some((p, k) => (p.w === 'INSERT' || p.w === 'DELETE' || p.w === 'MERGE' || (p.w === 'UPDATE' && !['FOR', 'KEY'].includes((ws[k - 1] || {}).w))));
  const into = ws.some((p) => p.prof === 0 && p.w === 'INTO');
  if ((['SELECT', 'VALUES', 'TABLE'].includes(w0) || (w0 === 'WITH' && comandoDe(cmd) === 'SELECT')) && !muda && !into) return 'cursor';
  if (['INSERT', 'UPDATE', 'DELETE'].includes(w0) && ws.some((p) => p.prof === 0 && p.w === 'RETURNING')) return 'devolve';
  return 'direto';
}

const slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+/, '').slice(0, 48).replace(/_+$/, '');
const aspas = (nome) => '"' + String(nome).replace(/"/g, '""') + '"';

/* erro do Postgres → {mensagem, detalhe?}: a linha do SQL onde parou (e.base = onde o comando começa), o detalhe e a dica */
function erroSql(e, sql) {
  const partes = [];
  const pos = +(e && e.position);
  if (pos > 0 && sql) partes.push('na linha ' + (sql.slice(0, Math.max(0, (+e.base || 0) + pos - 1)).split('\n').length));
  if (e && e.detail) partes.push(String(e.detail));
  if (e && e.hint) partes.push('dica: ' + e.hint);
  if (/cannot insert multiple commands/.test(String(e && e.message))) partes.push('o babel-coop não conseguiu separar os comandos deste trecho: confira aspas, $$ e comentários sem fechar');
  const erro = { mensagem: String((e && e.message) || e || 'erro') };
  if (partes.length) erro.detalhe = partes.join(' · ');
  return erro;
}

/* linha do Postgres → JSON: bigint vira número (ou texto, se não cabe), bytea vira \x…, o resto como veio */
function limpar(v) {
  if (typeof v === 'bigint') return Number.isSafeInteger(Number(v)) ? Number(v) : String(v);
  if (v instanceof Uint8Array) return '\\x' + Buffer.from(v).toString('hex');
  if (v instanceof Date) return isNaN(v) ? null : v.toISOString();
  if (Array.isArray(v)) return v.map(limpar);
  if (v && typeof v === 'object') { const o = {}; Object.keys(v).forEach((k) => { o[k] = limpar(v[k]); }); return o; }
  return v;
}

/* ---------- o catálogo (só o schema public), na ordem em que cada coisa foi criada (oid) ----------
   Além do contrato, guarda o que muda por dentro (DEFAULT da coluna, corpo da função, gatilho desligado) para o diff ver. */
const CATALOGO = [
  "SELECT c.relname AS nome, c.relrowsecurity AS rls FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind IN ('r','p') ORDER BY c.oid",
  "SELECT c.relname AS tabela, a.attname AS nome, pg_catalog.format_type(a.atttypid, a.atttypmod) AS tipo, NOT a.attnotnull AS nulo, EXISTS (SELECT 1 FROM pg_catalog.pg_index i WHERE i.indrelid = c.oid AND i.indisprimary AND a.attnum = ANY (i.indkey)) AS pk, coalesce(pg_catalog.pg_get_expr(d.adbin, d.adrelid), '') || '|' || a.attidentity::text || '|' || a.attgenerated::text AS padrao FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid = a.attrelid JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum WHERE n.nspname = 'public' AND c.relkind IN ('r','p') AND a.attnum > 0 AND NOT a.attisdropped ORDER BY c.oid, a.attnum",
  "SELECT cl.relname AS de, cf.relname AS para, (SELECT string_agg(a.attname, ', ' ORDER BY u.ord) FROM unnest(k.conkey) WITH ORDINALITY AS u(attnum, ord) JOIN pg_catalog.pg_attribute a ON a.attrelid = k.conrelid AND a.attnum = u.attnum) AS coluna FROM pg_catalog.pg_constraint k JOIN pg_catalog.pg_class cl ON cl.oid = k.conrelid JOIN pg_catalog.pg_class cf ON cf.oid = k.confrelid JOIN pg_catalog.pg_namespace nl ON nl.oid = cl.relnamespace JOIN pg_catalog.pg_namespace nf ON nf.oid = cf.relnamespace WHERE k.contype = 'f' AND k.conparentid = 0 AND nl.nspname = 'public' AND nf.nspname = 'public' ORDER BY k.oid",
  "SELECT c.relname AS tabela, p.polname AS nome, CASE p.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT' WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' ELSE 'ALL' END AS cmd, p.polpermissive AS permissiva, pg_catalog.pg_get_expr(p.polqual, p.polrelid) AS usando, pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid) AS checa, (SELECT coalesce(json_agg(CASE WHEN r = 0 THEN 'public' ELSE pg_catalog.pg_get_userbyid(r)::text END), '[]'::json) FROM unnest(p.polroles) AS r) AS papeis FROM pg_catalog.pg_policy p JOIN pg_catalog.pg_class c ON c.oid = p.polrelid JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' ORDER BY p.oid",
  "SELECT c.relname AS tabela, t.tgname AS nome, t.tgtype::int AS tipo, f.proname AS funcao, t.tgenabled <> 'D' AS ligado FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace JOIN pg_catalog.pg_proc f ON f.oid = t.tgfoid WHERE NOT t.tgisinternal AND t.tgparentid = 0 AND n.nspname = 'public' ORDER BY t.oid",
  "SELECT p.proname AS nome, pg_catalog.pg_get_function_identity_arguments(p.oid) AS args, md5(concat_ws('|', p.prosrc, p.probin, p.prosqlbody::text, p.proconfig::text, p.provolatile::text, p.prosecdef::text, p.proisstrict::text, p.prorettype::text, p.proretset::text, p.prolang::text)) AS corpo FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.prokind IN ('f','p') AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_depend d WHERE d.classid = 'pg_catalog.pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e') ORDER BY p.oid"
].join(';\n');
const TABELAS = "SELECT c.relname AS nome FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind IN ('r','p') ORDER BY c.oid";

/* a assinatura da estrutura inteira (todos os schemas e catálogos que só DDL muda): a consulta compara antes × depois.
   Fora dela, de propósito: o que DML, TRUNCATE e ANALYZE mexem (relfilenode, reltuples, estatísticas, valor de sequência). */
const CATALOGOS_INTEIROS = ['pg_namespace', 'pg_attribute', 'pg_attrdef', 'pg_constraint', 'pg_index', 'pg_policy', 'pg_proc', 'pg_trigger', 'pg_rewrite', 'pg_type', 'pg_enum',
  'pg_sequence', 'pg_auth_members', 'pg_default_acl', 'pg_extension', 'pg_db_role_setting', 'pg_description', 'pg_event_trigger', 'pg_inherits', 'pg_cast', 'pg_operator',
  'pg_opclass', 'pg_opfamily', 'pg_collation', 'pg_foreign_data_wrapper', 'pg_foreign_server', 'pg_foreign_table', 'pg_user_mapping', 'pg_publication', 'pg_publication_rel',
  'pg_statistic_ext', 'pg_aggregate', 'pg_language', 'pg_init_privs', 'pg_seclabel', 'pg_ts_config', 'pg_ts_dict', 'pg_ts_parser', 'pg_ts_template', 'pg_transform', 'pg_am',
  'pg_amop', 'pg_amproc', 'pg_conversion', 'pg_partitioned_table', 'pg_range', 'pg_shdescription', 'pg_shseclabel', 'pg_subscription', 'pg_tablespace', 'pg_parameter_acl'];
const hashDe = (de) => "md5(coalesce(string_agg(x::text, '|' ORDER BY x::text), '')) AS h FROM " + de;
const ASSINATURA = 'SELECT md5(string_agg(c || \':\' || h, \',\' ORDER BY c)) AS h FROM (' + CATALOGOS_INTEIROS.map((t) => "SELECT '" + t + "' AS c, " + hashDe('pg_catalog.' + t + ' x')).concat([
  "SELECT 'pg_class', " + hashDe('(SELECT oid, relname, relnamespace, reltype, reloftype, relowner, relam, relkind, relpersistence, relisshared, relrowsecurity, relforcerowsecurity, relacl, reloptions, relreplident, relispartition, relpartbound, relchecks, relhastriggers, relhasrules, relnatts, reltoastrelid, reltablespace FROM pg_catalog.pg_class) x'),
  "SELECT 'pg_roles', " + hashDe('pg_catalog.pg_roles x'),
  "SELECT 'pg_database', " + hashDe('(SELECT oid, datname, datdba, datacl, datallowconn, datconnlimit, datistemplate FROM pg_catalog.pg_database) x')
]).join(' UNION ALL ') + ') s';
async function assinatura(db) { return (await db.query(ASSINATURA)).rows[0].h; }

/* tgtype (pg_trigger.h): 1 ROW · 2 BEFORE · 4 INSERT · 8 DELETE · 16 UPDATE · 32 TRUNCATE · 64 INSTEAD */
function gatilho(g) {
  const t = +g.tipo;
  const evento = [[4, 'INSERT'], [16, 'UPDATE'], [8, 'DELETE'], [32, 'TRUNCATE']].filter(([b]) => t & b).map(([, n]) => n).join(' OR ');
  return { tabela: g.tabela, nome: g.nome, quando: t & 64 ? 'INSTEAD OF' : t & 2 ? 'BEFORE' : 'AFTER', evento, funcao: g.funcao, ligado: !!g.ligado };
}

async function contar(db, nomes) {
  if (!nomes.length) return {};
  const r = await db.query('SELECT ' + nomes.map((n) => '(SELECT count(*) FROM public.' + aspas(n) + ')::int8 AS ' + aspas(n)).join(', '));
  const o = {};
  nomes.forEach((n) => { o[n] = Number(r.rows[0][n]) || 0; });
  return o;
}
async function tabelas(db) { return (await db.query(TABELAS)).rows.map((x) => x.nome); }

/* snapshot do contrato + o completo (o snapshot com o que muda por dentro, só para o diff) */
async function catalogo(db, comLinhas) {
  const [t, c, f, p, g, fn] = await db.exec(CATALOGO);
  const colunas = new Map(t.rows.map((x) => [x.nome, []]));
  c.rows.forEach((x) => { const l = colunas.get(x.tabela); if (l) l.push({ nome: x.nome, tipo: x.tipo, pk: !!x.pk, nulo: !!x.nulo, padrao: x.padrao }); });
  const linhas = comLinhas ? await contar(db, t.rows.map((x) => x.nome)) : {};
  const semPadrao = (l) => l.map((x) => ({ nome: x.nome, tipo: x.tipo, pk: x.pk, nulo: x.nulo }));
  const completo = {
    tabelas: t.rows.map((x) => ({ nome: x.nome, colunas: colunas.get(x.nome), rls: !!x.rls, linhas: linhas[x.nome] || 0 })),
    fios: f.rows.map((x) => ({ de: x.de, para: x.para, coluna: x.coluna })),
    politicas: p.rows.map((x) => ({ tabela: x.tabela, nome: x.nome, cmd: x.cmd, permissiva: !!x.permissiva, usando: x.usando == null ? null : x.usando, checa: x.checa == null ? null : x.checa, papeis: Array.isArray(x.papeis) ? x.papeis : [] })),
    gatilhos: g.rows.map(gatilho),
    funcoes: fn.rows.map((x) => ({ nome: x.nome, args: x.args, corpo: x.corpo }))
  };
  const snapshot = {
    tabelas: completo.tabelas.map((x) => ({ nome: x.nome, colunas: semPadrao(x.colunas), rls: x.rls, linhas: x.linhas })),
    fios: completo.fios,
    politicas: completo.politicas,
    gatilhos: completo.gatilhos,
    funcoes: completo.funcoes.map((x) => ({ nome: x.nome, args: x.args }))
  };
  return { snapshot, completo, linhas };
}

/* ---------- as mudanças: catálogo antes × depois (o completo), na ordem da animação, no formato do contrato ---------- */
function mudancas(a, d) {
  const lista = [];
  const chave = (...k) => k.join('\u0000');
  const contrato = (c) => ({ nome: c.nome, tipo: c.tipo, pk: !!c.pk, nulo: !!c.nulo });
  const tabA = new Map(a.tabelas.map((x) => [x.nome, x])), tabD = new Map(d.tabelas.map((x) => [x.nome, x]));
  /* 1. tabelas novas (com as colunas) · 2. colunas novas ou mudadas (tipo, NOT NULL, chave, DEFAULT) nas que já existiam ·
     3. RLS que mudou (ou ligado na tabela nova) */
  d.tabelas.forEach((x) => { if (!tabA.has(x.nome)) lista.push({ k: 'tabela', nome: x.nome, colunas: x.colunas.map(contrato) }); });
  d.tabelas.forEach((x) => {
    const antes = tabA.get(x.nome);
    if (!antes) return;
    const tinha = new Map(antes.colunas.map((c) => [c.nome, JSON.stringify(c)]));
    x.colunas.forEach((c) => { if (tinha.get(c.nome) !== JSON.stringify(c)) lista.push({ k: 'coluna', tabela: x.nome, nome: c.nome, tipo: c.tipo }); });
  });
  d.tabelas.forEach((x) => { const antes = tabA.get(x.nome); if (antes ? antes.rls !== x.rls : x.rls) lista.push({ k: 'rls', tabela: x.nome, ligado: x.rls }); });
  /* 4. políticas · 5. fios · 6. funções · 7. gatilhos: novos, ou com a mesma chave e outro conteúdo (regra, corpo, desligado) */
  const novos = (antes, depois, k, fazer) => {
    const velho = new Map(antes.map((x) => [k(x), JSON.stringify(x)]));
    depois.forEach((x) => { if (velho.get(k(x)) !== JSON.stringify(x)) lista.push(fazer(x)); });
  };
  novos(a.politicas, d.politicas, (x) => chave(x.tabela, x.nome), (x) => ({ k: 'politica', tabela: x.tabela, nome: x.nome, cmd: x.cmd }));
  novos(a.fios, d.fios, (x) => chave(x.de, x.para, x.coluna), (x) => ({ k: 'fio', de: x.de, para: x.para, coluna: x.coluna }));
  novos(a.funcoes, d.funcoes, (x) => chave(x.nome, x.args), (x) => ({ k: 'funcao', nome: x.nome, args: x.args }));
  novos(a.gatilhos, d.gatilhos, (x) => chave(x.tabela, x.nome), (x) => ({ k: 'gatilho', tabela: x.tabela, nome: x.nome, quando: x.quando, evento: x.evento, funcao: x.funcao }));
  /* 8. o que saiu, do que depende para o que é dependido: gatilho, política, fio, coluna, tabela, função.
     O que sumiu junto com a tabela (colunas, gatilhos, políticas, fios que saem dela) não se repete. */
  const sai = (depois, antes, k, fazer, conta) => {
    const ficou = new Set(depois.map(k));
    antes.forEach((x) => { if (!ficou.has(k(x)) && (!conta || conta(x))) lista.push(Object.assign({ k: 'sai' }, fazer(x))); });
  };
  sai(d.gatilhos, a.gatilhos, (x) => chave(x.tabela, x.nome), (x) => ({ o: 'gatilho', nome: x.nome, tabela: x.tabela }), (x) => tabD.has(x.tabela));
  sai(d.politicas, a.politicas, (x) => chave(x.tabela, x.nome), (x) => ({ o: 'politica', nome: x.nome, tabela: x.tabela }), (x) => tabD.has(x.tabela));
  sai(d.fios, a.fios, (x) => chave(x.de, x.para, x.coluna), (x) => ({ o: 'fio', nome: x.coluna, tabela: x.de, para: x.para }), (x) => tabD.has(x.de));
  a.tabelas.forEach((x) => {
    const depois = tabD.get(x.nome);
    if (!depois) return;
    const tem = new Set(depois.colunas.map((c) => c.nome));
    x.colunas.forEach((c) => { if (!tem.has(c.nome)) lista.push({ k: 'sai', o: 'coluna', nome: c.nome, tabela: x.nome }); });
  });
  a.tabelas.forEach((x) => { if (!tabD.has(x.nome)) lista.push({ k: 'sai', o: 'tabela', nome: x.nome }); });
  sai(d.funcoes, a.funcoes, (x) => chave(x.nome, x.args), (x) => ({ o: 'funcao', nome: x.nome, args: x.args }));
  return lista;
}

const SNAPSHOT_VAZIO = () => ({ tabelas: [], fios: [], politicas: [], gatilhos: [], funcoes: [] });

/* um comando (pelo protocolo estendido: dois comandos no mesmo texto são recusados pelo Postgres). prefixo/sufixo embrulham
   o comando (cursor, LIMIT); e.base acerta a linha do erro. Se a transação acabou no meio, nada segue: "escapou". */
async function rodarUm(db, prep, cmd, prefixo, sufixo) {
  const texto = (prefixo || '') + prep.sql.slice(cmd.ini, cmd.fim) + (sufixo || '');
  let r;
  try { r = await db.query(texto); } catch (e) { if (e && typeof e === 'object') e.base = cmd.ini - (prefixo || '').length; throw e; }
  if (!db.isInTransaction()) throw Object.assign(new Error('a transação acabou no meio do SQL'), { escapou: true });
  return r;
}
async function rodarTodos(db, prep, ate) { for (let k = 0; k < ate; k++) await rodarUm(db, prep, prep.lista[k]); }

/* ---------- o banco de UM projeto, onde o PGlite está (no trabalhador) ---------- */
class Projeto {
  /* nota(o): avisa o servidor no meio do caminho (arquivo que vai ser criado, COMMIT começando): se o limite estourar ali,
     ele sabe o que conferir e o que limpar */
  constructor(db, nota) { this.db = db; this.nota = nota || (() => {}); this.linhas = null; /* nº de linhas por tabela, depois da última operação */ }

  async catalogo(comLinhas) { const c = await catalogo(this.db, comLinhas); if (comLinhas) this.linhas = c.linhas; return c; }
  async estado() { return { ok: true, snapshot: (await this.catalogo(true)).snapshot }; }
  async gravada(a) { return (await this.db.query('SELECT 1 FROM babel_coop.migracoes WHERE arquivo = $1', [String(a && a.rel)])).rows.length > 0; }

  async aplicar(a) {
    const db = this.db, sql = a.sql, nome = a.nome, prep = preparar(sql), eu = a.eu || null;
    if (prep.controle) return { ok: false, erro: { mensagem: prep.controle + ' não entra na migração: o babel-coop já aplica tudo numa transação (e desfaz tudo se der erro)' }, mudancas: [], snapshot: (await this.catalogo(true)).snapshot };
    if (!(await db.query(TEM_INTERNO)).rows[0].ok) await db.exec(INTERNO); /* banco que perdeu o schema interno volta a funcionar */
    const antes = await catalogo(db, false);
    let arquivo = null;
    await db.exec('BEGIN');
    try {
      await rodarTodos(db, prep, prep.lista.length);
      await db.exec(LIMPAR_SESSAO);
      if (!(await db.query(TEM_INTERNO)).rows[0].ok) throw new Error('a migração apagou o schema interno babel_coop (onde o babel-coop anota as migrações aplicadas): deixe esse schema de fora');
      const depois = await this.catalogo(true);
      const lista = mudancas(antes.completo, depois.completo);
      /* número seguinte: o maior entre a tabela interna e os arquivos que já estão na pasta (nunca sobrescreve).
         A pasta é compartilhada e o banco é de cada computador: o cabeçalho diz de qual Estação e sobre quais migrações rodou */
      const dir = a.dir, projeto = a.projeto;
      const deste = (await db.query('SELECT n FROM babel_coop.migracoes ORDER BY n')).rows.map((x) => +x.n);
      let n = deste.length ? deste[deste.length - 1] : 0;
      const naPasta = [];
      try { fs.readdirSync(dir).forEach((f) => { const m = /^(\d{4,})_.*\.sql$/.exec(f); if (m) { n = Math.max(n, +m[1]); naPasta.push(+m[1]); } }); } catch (e) { /* pasta ainda não existe */ }
      n += 1;
      const primeiro = prep.lista[0].palavras.slice(0, 3).map((p) => p.w).join(' ');
      const nomeArq = String(n).padStart(4, '0') + '_' + (slug(nome) || slug(primeiro) || 'migracao') + '.sql';
      const rel = ['projetos', projeto, 'banco', nomeArq].join('/');
      await db.query('INSERT INTO babel_coop.migracoes (n, nome, arquivo, sql, mudancas) VALUES ($1, $2, $3, $4, $5)', [n, String(nome || '').slice(0, 200) || nomeArq.slice(5, -4), rel, sql, lista.length]);
      fs.mkdirSync(dir, { recursive: true });
      const num = (x) => String(x).padStart(4, '0'), outros = naPasta.filter((x) => deste.indexOf(x) === -1).sort((x, y) => x - y);
      const onde = eu && eu.nome ? 'no banco local de ' + String(eu.nome).replace(/\s+/g, ' ').slice(0, 60) + (eu.id ? ' (Estação ' + String(eu.id).slice(0, 64) + ')' : '') : 'no banco local';
      const cabeca = '-- babel-coop · migração ' + nomeArq.slice(0, 4) + ' do projeto ' + projeto + ' · aplicada ' + onde + ' em ' + new Date().toISOString() + '\n' +
        '-- ' + (deste.length ? 'rodou depois de ' + deste.map(num).join(', ') + ', neste mesmo banco' : 'primeira migração deste banco') +
        (outros.length ? ' · ' + outros.map(num).join(', ') + ' desta pasta rodaram em outro banco (outra Estação)' : '') + '\n';
      this.nota({ arquivo: path.join(dir, nomeArq), rel });
      fs.writeFileSync(path.join(dir, nomeArq), cabeca + sql + (sql.endsWith('\n') ? '' : '\n'), { flag: 'wx' }); /* wx: nunca por cima de outro */
      arquivo = path.join(dir, nomeArq); /* criado agora: se o COMMIT falhar, sai */
      this.nota({ commit: true });
      await db.exec('COMMIT');
      arquivo = null;
      return { ok: true, mudancas: lista, arquivo: rel, snapshot: depois.snapshot };
    } catch (e) {
      if (db.isInTransaction()) await db.exec('ROLLBACK').catch(() => {});
      if (arquivo) try { fs.unlinkSync(arquivo); } catch (x) { /* não chegou a ser criado */ }
      await db.exec(LIMPAR_SESSAO).catch(() => {});
      const snapshot = (await this.catalogo(true)).snapshot;
      /* não devia acontecer (controle de transação é barrado e cada comando vai sozinho), mas se acontecer diz a verdade */
      if (e && e.escapou) return { ok: false, parcial: true, erro: { mensagem: 'o SQL encerrou a transação sozinho: parte dele pode ter ficado gravada, sem arquivo de migração; confira o snapshot' }, mudancas: [], snapshot };
      return { ok: false, erro: erroSql(e, prep.sql), mudancas: [], snapshot };
    }
  }

  /* o último comando dá as linhas, o comando e o total */
  async consulta(a) {
    const db = this.db, prep = preparar(a.sql);
    if (prep.controle) return { ok: false, erro: { mensagem: prep.controle + ' não entra na consulta: ela já roda numa transação' } };
    const antes = this.linhas || await contar(db, await tabelas(db));
    const forma = await assinatura(db);
    await db.exec('BEGIN');
    try {
      const n = prep.lista.length, ultimo = prep.lista[n - 1], jeito = jeitoDoUltimo(ultimo);
      await rodarTodos(db, prep, n - 1);
      let linhas, total, campos;
      if (jeito === 'cursor') {
        await rodarUm(db, prep, ultimo, 'DECLARE babel_coop_leitura NO SCROLL CURSOR FOR ');
        const r = await db.query('FETCH FORWARD ' + MAX_LINHAS + ' FROM babel_coop_leitura');
        linhas = r.rows; total = r.rows.length;
        if (total === MAX_LINHAS) total += (await db.query('MOVE FORWARD ALL IN babel_coop_leitura')).rowCount || 0;
        await db.query('CLOSE babel_coop_leitura');
        campos = true;
      } else if (jeito === 'devolve') {
        const r = await rodarUm(db, prep, ultimo, 'WITH babel_coop_r AS (\n', '\n) SELECT count(*) OVER () AS babel_coop_total, * FROM babel_coop_r LIMIT ' + MAX_LINHAS);
        total = r.rows.length ? Number(r.rows[0].babel_coop_total) || 0 : 0;
        linhas = r.rows.map((x) => { delete x.babel_coop_total; return x; });
        campos = true;
      } else {
        const r = await rodarUm(db, prep, ultimo);
        campos = !!(r.fields && r.fields.length);
        linhas = r.rows || [];
        total = campos ? linhas.length : (r.affectedRows || 0);
      }
      await db.exec(LIMPAR_SESSAO);
      if (await assinatura(db) !== forma) {
        await db.exec('ROLLBACK');
        return { ok: false, erro: { mensagem: 'a consulta mudou a estrutura do banco e foi desfeita: estrutura (tabela, coluna, regra de acesso, função, gatilho, permissão, schema…) vai por coop_banco_sql, que vira migração e aparece na Máquina' } };
      }
      const depois = await contar(db, await tabelas(db));
      this.nota({ commit: true });
      await db.exec('COMMIT');
      this.linhas = depois;
      const mudou = {};
      Object.keys(depois).forEach((t) => { const delta = depois[t] - (antes[t] || 0); if (delta) mudou[t] = delta; });
      return { ok: true, comando: comandoDe(ultimo), linhas: linhas.slice(0, MAX_LINHAS).map(limpar), total, contagens: depois, mudou };
    } catch (e) {
      if (db.isInTransaction()) await db.exec('ROLLBACK').catch(() => {});
      if (e && e.escapou) { this.linhas = null; return { ok: false, parcial: true, erro: { mensagem: 'a consulta encerrou a transação sozinha: parte dela pode ter ficado gravada' } }; }
      return { ok: false, erro: erroSql(e, prep.sql) };
    } finally {
      await db.exec(LIMPAR_SESSAO).catch(() => {});
    }
  }
}

async function abrirDb(dir) {
  const { PGlite } = await pglite();
  fs.mkdirSync(dir, { recursive: true });
  const db = await PGlite.create(dir);
  try { await db.exec(INTERNO); } catch (e) { await db.close().catch(() => {}); throw e; }
  return db;
}

/* ---------- o trabalhador (este mesmo arquivo, carregado por new Worker) ---------- */
function trabalhar(dados) {
  let db = null, proj = null;
  const OPS = { estado: 1, aplicar: 1, consulta: 1, gravada: 1 };
  parentPort.on('message', async (m) => {
    if (!m || typeof m !== 'object') return;
    const responder = (x) => parentPort.postMessage(Object.assign({ id: m.id }, x));
    try {
      if (m.op === 'abrir') {
        if (!db) { db = await abrirDb(dados.dir); proj = new Projeto(db); }
        return responder({ ok: true, valor: true });
      }
      if (m.op === 'fechar') { if (db) { const x = db; db = null; proj = null; await x.close(); } return responder({ ok: true, valor: true }); }
      if (!OPS[m.op] || !proj) throw new Error(proj ? 'operação desconhecida: ' + m.op : 'o banco não está aberto');
      proj.nota = (nota) => parentPort.postMessage({ id: m.id, nota });
      return responder({ ok: true, valor: await proj[m.op](m.args || {}) });
    } catch (e) {
      responder({ ok: false, erro: { mensagem: String((e && e.message) || e), pedido: !!(e && e.pedido) } });
    }
  });
}
if (!isMainThread && workerData && workerData.babelCoopBanco) trabalhar(workerData);

/* o canal com o trabalhador de um projeto: pedido com limite; passou do limite, o trabalhador morre (o comando para no meio) */
class Canal {
  constructor(dir, memoriaMb) {
    this.pend = new Map(); this.seq = 0; this.morto = null; this.memoriaMb = memoriaMb || MEMORIA_MB;
    this.w = new Worker(__filename, { workerData: { babelCoopBanco: true, dir }, resourceLimits: { maxOldGenerationSizeMb: this.memoriaMb } });
    this.w.unref(); /* parado não segura o processo; com pedido na fila, segura (ref) */
    this.w.on('message', (m) => this.receber(m));
    this.w.on('error', (e) => this.cair(e));
    this.w.on('exit', (code) => this.cair(new Error('o trabalhador do banco saiu (código ' + code + ')')));
  }
  receber(m) {
    const p = m && this.pend.get(m.id);
    if (!p) return;
    if (m.nota) { Object.assign(p.notas, m.nota); return; }
    this.soltar(m.id);
    if (m.ok) p.ok(m.valor);
    else p.erro(Object.assign(new Error(m.erro && m.erro.mensagem), { pedido: !!(m.erro && m.erro.pedido) }));
  }
  soltar(id) { const p = this.pend.get(id); if (p) { clearTimeout(p.t); this.pend.delete(id); } if (!this.pend.size && !this.morto) this.w.unref(); }
  /* o trabalhador caiu (sem memória, erro fatal) ou foi morto: quem esperava recebe o motivo */
  cair(e) {
    if (!this.morto) this.morto = e;
    const lista = [...this.pend.values()];
    this.pend.clear();
    const semMemoria = e && (e.code === 'ERR_WORKER_OUT_OF_MEMORY' || /out of memory|heap/i.test(String(e.message)));
    lista.forEach((p) => { clearTimeout(p.t); p.erro(Object.assign(new Error(semMemoria ? 'passou do limite de memória do banco (' + this.memoriaMb + ' MB)' : String((e && e.message) || e)), { caiu: true, memoria: !!semMemoria, notas: p.notas })); });
  }
  pedir(op, args, ms) {
    if (this.morto) return Promise.reject(Object.assign(new Error('o trabalhador do banco não está mais de pé'), { caiu: true, notas: {} }));
    const id = ++this.seq;
    return new Promise((ok, erro) => {
      const p = { ok, erro, notas: {}, t: null };
      if (ms) p.t = setTimeout(() => { this.pend.delete(id); erro(Object.assign(new Error('passou de ' + ms + ' ms'), { tempo: true, ms, notas: p.notas })); this.matar(); }, ms);
      this.pend.set(id, p);
      this.w.ref();
      this.w.postMessage({ id, op, args });
    });
  }
  matar() { if (!this.morto) this.morto = new Error('parado'); this.cair(this.morto); return this.w.terminate().catch(() => {}); }
  async fechar() { if (!this.morto) { try { await this.pedir('fechar', null, 5000); } catch (e) { /* segue: termina assim mesmo */ } } await this.matar(); }
}

/* a frase de quando a operação não chegou ao fim (limite ou o trabalhador caiu) */
function interrompida(oque, falha, ms) {
  const commit = !!(falha && falha.notas && falha.notas.commit);
  const s = (Math.round(ms / 100) / 10).toLocaleString('pt-BR');
  const motivo = falha && falha.tempo ? 'passou de ' + s + ' s e foi interrompida' : falha && falha.memoria ? falha.message + ' e foi interrompida' : 'derrubou o trabalhador do banco (' + ((falha && falha.message) || 'erro') + ')';
  return oque + ' ' + motivo + ': o Postgres local do projeto foi reiniciado e desfez o que não tinha sido confirmado' +
    (commit ? ' (ela já estava no COMMIT: pode ter ficado gravada; confira com coop_banco_estado).' : '. Nada dela ficou gravado.');
}

class Bancos {
  /* raiz() = <raiz BabelCoop>; pasta() = a pasta compartilhada (as duas podem mudar quando a identidade muda);
     eu() = {id, nome} desta Estação (vai no cabeçalho da migração); limite e limiteAbrir em ms; memoriaMb = heap do trabalhador */
  constructor({ raiz, pasta, eu, ocioso = OCIOSO, limite = LIMITE, limiteAbrir = LIMITE_ABRIR, memoriaMb = MEMORIA_MB }) {
    this.raiz = raiz; this.pasta = pasta; this.eu = eu || (() => null); this.ocioso = ocioso; this.limite = limite; this.limiteAbrir = limiteAbrir; this.memoriaMb = memoriaMb;
    this.abertos = new Map(); /* projeto → {canal, fila, pendentes, timer} */
    this.parado = false;
  }

  dirDados(projeto) { return path.join(this.raiz(), '.coop', 'bancos', projeto); }
  dirMigracoes(projeto) { return path.join(this.pasta(), 'projetos', projeto, 'banco'); }
  existe(projeto) { return fs.existsSync(path.join(this.dirDados(projeto), 'PG_VERSION')); }
  quem() { try { const e = this.eu(); return e && typeof e === 'object' ? { id: e.id || null, nome: e.nome || null } : null; } catch (x) { return null; } }

  async abrir(projeto) {
    const c = new Canal(this.dirDados(projeto), this.memoriaMb);
    try { await c.pedir('abrir', null, this.limiteAbrir); } catch (e) { await c.matar(); throw new Error('o Postgres local do projeto não abriu: ' + e.message); }
    return c;
  }

  /* uma operação por vez em cada projeto; abre o banco na primeira e agenda o fechamento por ociosidade */
  vez(projeto, fn) {
    if (this.parado) return Promise.reject(new Error('o banco deste computador está fechando'));
    let e = this.abertos.get(projeto);
    if (!e) { e = { canal: null, fila: Promise.resolve(), pendentes: 0, timer: null }; this.abertos.set(projeto, e); }
    e.pendentes += 1;
    if (e.timer) { clearTimeout(e.timer); e.timer = null; }
    const feito = e.fila.then(async () => {
      if (!e.canal || e.canal.morto) e.canal = await this.abrir(projeto);
      return fn(e);
    });
    e.fila = feito.catch(() => {}).then(() => { e.pendentes -= 1; this.adormecer(projeto, e); });
    return feito;
  }
  adormecer(projeto, e) {
    if (e.pendentes || !e.canal || this.parado || !this.ocioso) return;
    e.timer = setTimeout(() => {
      e.timer = null;
      if (e.pendentes || this.parado) return;
      e.fila = e.fila.then(async () => { if (!e.pendentes && e.canal) { const c = e.canal; e.canal = null; await c.fechar(); } });
    }, this.ocioso);
    if (e.timer.unref) e.timer.unref();
  }
  /* a operação no trabalhador, com o limite. Passou do limite (ou ele caiu): {falha}, e a próxima operação reabre */
  async pedir(e, op, args) {
    try { return { valor: await e.canal.pedir(op, args, this.limite) }; }
    catch (x) {
      if (!x.tempo && !x.caiu) throw x;
      const c = e.canal; e.canal = null;
      if (c) await c.matar();
      return { falha: x };
    }
  }

  /* GET /api/banco/estado: projeto sem banco ainda = snapshot vazio (não cria 40 MB de banco só para olhar) */
  async estado(projeto) {
    conferirProjeto(projeto);
    if (!this.abertos.has(projeto) && !this.existe(projeto)) return { ok: true, snapshot: SNAPSHOT_VAZIO() };
    return this.vez(projeto, async (e) => {
      const r = await this.pedir(e, 'estado');
      return r.falha ? { ok: false, erro: { mensagem: interrompida('a leitura do banco', r.falha, this.limite) } } : r.valor;
    });
  }

  /* POST /api/banco/aplicar */
  async aplicar(projeto, sql, nome) {
    conferirProjeto(projeto); conferirSql(sql); preparar(sql);
    return this.vez(projeto, async (e) => {
      const r = await this.pedir(e, 'aplicar', { sql, nome: nome == null ? '' : String(nome), projeto, dir: this.dirMigracoes(projeto), eu: this.quem() });
      if (!r.falha) return r.valor;
      /* interrompida: reabre, confere se o COMMIT chegou a gravar e tira o arquivo que ficou sem migração */
      const n = r.falha.notas || {};
      let snapshot = SNAPSHOT_VAZIO(), gravou = false, leu = false;
      try {
        e.canal = await this.abrir(projeto);
        if (n.rel) gravou = !!(await e.canal.pedir('gravada', { rel: n.rel }, this.limite));
        snapshot = (await e.canal.pedir('estado', null, this.limite)).snapshot; leu = true;
      } catch (x) { if (e.canal) { await e.canal.matar(); e.canal = null; } }
      if (n.arquivo && !gravou) try { fs.unlinkSync(n.arquivo); } catch (x) { /* não chegou a ser criado */ }
      if (gravou) return { ok: false, parcial: true, erro: { mensagem: 'a migração foi interrompida no fim, mas o banco confirma que ela ficou gravada (' + n.rel + '): confira com coop_banco_estado' }, mudancas: [], snapshot };
      return { ok: false, erro: { mensagem: interrompida('a migração', r.falha, this.limite) + ' Nenhum arquivo de migração foi criado.' + (leu ? '' : ' (O banco ainda não reabriu: o snapshot volta vazio.)') }, mudancas: [], snapshot };
    });
  }

  /* POST /api/banco/consulta */
  async consulta(projeto, sql) {
    conferirProjeto(projeto); conferirSql(sql); preparar(sql);
    return this.vez(projeto, async (e) => {
      const r = await this.pedir(e, 'consulta', { sql });
      if (!r.falha) return r.valor;
      return { ok: false, erro: { mensagem: interrompida('a consulta', r.falha, this.limite) + (r.falha.memoria
        ? ' Resultado grande demais: devolva menos linhas (LIMIT) ou leia com SELECT, que vem por cursor (só 50 linhas chegam aqui).'
        : ' Consulta sem fim (CTE recursiva sem parada, junção sem ON, pg_sleep) cai aqui: confira o WHERE e use LIMIT.') } };
    });
  }

  /* fecha todos (parar() do servidor): espera a operação em curso de cada projeto */
  fechar() {
    this.parado = true;
    const lista = [];
    this.abertos.forEach((e) => {
      if (e.timer) { clearTimeout(e.timer); e.timer = null; }
      lista.push(e.fila.then(async () => { if (e.canal) { const c = e.canal; e.canal = null; await c.fechar(); } }));
    });
    return Promise.all(lista);
  }
}

module.exports = { Bancos, Projeto, comandos, preparar, comandoDe, jeitoDoUltimo, mudancas };
