/* Babel Coop · o conector `coop` (servidor/coop-mcp.js, PROTOCOLO §8) por JSON-RPC real sobre HTTP
   (a) protocolo: um http de teste com criar() + uma "tela" falsa que responde mcp-chamada. Prova initialize (era legada),
       notifications/initialized, tools/list, tools/call, server/discover (era moderna), cabeçalhos, versões e erros.
   (c) Claude Code de verdade (só com BABEL_TESTE_CLAUDE=1, custa uma chamada ao modelo barato): `claude -p` com
       --mcp-config apontando para o http de teste; o registro do servidor prova tools/list e tools/call e a resposta
       do claude usa o resultado (um nome marcador que só existe na tela falsa).
   Portas: HTTP 4920–4923 (faixa do conector: 4920–4929). Evidências de (c): BABEL_TESTE_EVIDENCIAS=<pasta>.
   Rodar: node --test testes/servidor/mcp.test.js
*/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { criar, ACOES_PERMITIDAS, FERRAMENTAS } = require('../../servidor/coop-mcp');

const AGENTE = { id: 'ag-rita', nome: 'Rita', dono: 'theus-1' };
const QUEM = { id: 'ag-rita', nome: 'Rita' }; /* o agente como o conector passa ao navegador (§9) */
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/* sobe o conector num http de teste; a "tela" falsa guarda cada mcp-chamada e responde (ou não) */
function subir(porta, { tela, criarCom = {} } = {}) {
  const log = [], chamadas = [];
  let mcp = null;
  const telaPadrao = (msg) => {
    chamadas.push(msg);
    setImmediate(() => mcp.aoMensagemUi({ tipo: 'mcp-resposta', cid: msg.cid, ok: true, resultado: { texto: 'feito na tela: ' + msg.ferramenta, dados: { eco: msg.args } } }));
  };
  mcp = criar(Object.assign({ cfg: { id: 'theus-1', pasta: path.join(os.tmpdir(), 'babel-mcp-pasta') }, pedirUi: tela ? (msg) => tela(msg, mcp, chamadas) : telaPadrao, registrar: (r) => log.push(r) }, criarCom));
  const srv = http.createServer((req, res) => {
    const m = req.url.match(/^\/mcp\/([A-Za-z0-9_-]{1,48})$/);
    if (!m) { res.writeHead(404); return res.end(); }
    mcp.tratar(req, res, m[1], AGENTE);
  });
  return new Promise((ok) => srv.listen(porta, '127.0.0.1', () => ok({ srv, mcp, log, chamadas, porta, fechar: () => new Promise((r) => { srv.closeAllConnections && srv.closeAllConnections(); srv.close(r); }) })));
}

function post(porta, corpo, headers = {}, { metodo = 'POST', caminho = '/mcp/s1' } = {}) {
  return new Promise((ok, erro) => {
    const dados = corpo == null ? null : Buffer.from(typeof corpo === 'string' ? corpo : JSON.stringify(corpo));
    const req = http.request({ agent: false, host: '127.0.0.1', port: porta, method: metodo, path: caminho, headers: Object.assign({ Accept: 'application/json, text/event-stream' }, dados ? { 'Content-Type': 'application/json', 'Content-Length': dados.length } : {}, headers) }, (res) => {
      let s = ''; res.on('data', (c) => { s += c; }); res.on('end', () => { let j = null; try { j = JSON.parse(s); } catch (e) { j = null; } ok({ status: res.statusCode, json: j, texto: s, headers: res.headers }); });
    });
    req.on('error', erro);
    if (dados) req.write(dados);
    req.end();
  });
}
let seq = 0;
const rpc = (method, params) => ({ jsonrpc: '2.0', id: ++seq, method, params });
const META = (v = '2026-07-28') => ({ 'io.modelcontextprotocol/protocolVersion': v, 'io.modelcontextprotocol/clientInfo': { name: 'teste', version: '1' }, 'io.modelcontextprotocol/clientCapabilities': {} });
const moderno = (method, params = {}, v = '2026-07-28', extra = {}) => ({ corpo: rpc(method, Object.assign({}, params, { _meta: META(v) })), headers: Object.assign({ 'MCP-Protocol-Version': v, 'Mcp-Method': method }, method === 'tools/call' ? { 'Mcp-Name': params.name } : {}, extra) });

/* ------------------------------------------------------------------ (a) protocolo */
test('conector coop · protocolo MCP (JSON-RPC por HTTP)', async (t) => {
  const s = await subir(4920);
  t.after(() => s.fechar());

  await t.test('initialize (era legada) devolve a versão pedida, tools e serverInfo coop', async () => {
    const r = await post(s.porta, rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'claude-code', version: '2.1.281' } }));
    assert.equal(r.status, 200);
    assert.match(r.headers['content-type'], /^application\/json/);
    assert.equal(r.json.jsonrpc, '2.0');
    assert.equal(r.json.result.protocolVersion, '2025-06-18');
    assert.deepEqual(r.json.result.capabilities, { tools: { listChanged: false } });
    assert.equal(r.json.result.serverInfo.name, 'coop');
    assert.match(r.json.result.instructions, /Google Chrome/);
    assert.match(r.json.result.instructions, /coop_banco_sql \(a Máquina anima ao vivo\).*coop_banco_consulta/, 'as instruções mandam montar o banco pelo conector');
    assert.equal(r.headers['mcp-session-id'], undefined, 'não cria sessão');
    const nova = await post(s.porta, rpc('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'x' } }));
    assert.equal(nova.json.result.protocolVersion, '2025-11-25');
    const estranha = await post(s.porta, rpc('initialize', { protocolVersion: '1999-01-01', capabilities: {}, clientInfo: { name: 'x' } }));
    assert.equal(estranha.json.result.protocolVersion, '2025-11-25', 'versão desconhecida → a mais nova legada');
  });

  await t.test('notifications/initialized → 202 sem corpo', async () => {
    const r = await post(s.porta, { jsonrpc: '2.0', method: 'notifications/initialized' }, { 'MCP-Protocol-Version': '2025-06-18' });
    assert.equal(r.status, 202);
    assert.equal(r.texto, '');
  });

  await t.test('tools/list: 47 ferramentas, navegador_* e coop_* (Máquina, banco e Estação incluídos), esquema objeto, ordem fixa', async () => {
    const r = await post(s.porta, rpc('tools/list', {}), { 'MCP-Protocol-Version': '2025-06-18' });
    assert.equal(r.status, 200);
    const nomes = r.json.result.tools.map((f) => f.name);
    assert.equal(nomes.length, 47);
    for (const n of ['navegador_abrir', 'navegador_clicar', 'navegador_digitar', 'navegador_ler', 'navegador_raio_x', 'navegador_clonar', 'navegador_copy', 'navegador_print',
      'coop_tv', 'coop_projetar', 'coop_aviso', 'coop_mural', 'coop_demanda', 'coop_campanha', 'coop_meta', 'coop_buscar', 'coop_aprendi', 'coop_pessoas', 'coop_projetos', 'coop_acao', 'coop_maquina', 'coop_maquina_peca', 'coop_maquina_ligar',
      'coop_banco_sql', 'coop_banco_consulta', 'coop_banco_estado', 'coop_abrir', 'coop_fechar', 'coop_onde', 'coop_tela']) assert.ok(nomes.includes(n), 'falta ' + n);
    /* as do banco e depois as da Estação entram no fim, antes de coop_acao; as de antes não mudam de lugar */
    assert.deepEqual(nomes.slice(-9), ['coop_maquina_ligar', 'coop_banco_sql', 'coop_banco_consulta', 'coop_banco_estado', 'coop_abrir', 'coop_fechar', 'coop_onde', 'coop_tela', 'coop_acao']);
    r.json.result.tools.forEach((f) => { assert.equal(f.inputSchema.type, 'object', f.name); assert.ok(f.description.length > 20, f.name); });
    assert.equal(r.json.result.resultType, undefined, 'era legada não leva resultType');
    assert.equal(r.json.result.ttlMs, undefined, 'nem dica de cache');
    const de_novo = await post(s.porta, rpc('tools/list', {}));
    assert.deepEqual(de_novo.json.result.tools.map((f) => f.name), nomes);
  });

  await t.test('tools/call coop_aviso: vira mcp-chamada {cid, sessao, ferramenta, args, agente} e volta como texto', async () => {
    const antes = s.chamadas.length;
    const r = await post(s.porta, rpc('tools/call', { name: 'coop_aviso', arguments: { texto: 'reunião às 16h' } }), { 'MCP-Protocol-Version': '2025-06-18' });
    assert.equal(r.status, 200);
    assert.equal(r.json.result.isError, undefined);
    assert.deepEqual(r.json.result.content, [{ type: 'text', text: 'feito na tela: coop_aviso' }]);
    assert.deepEqual(r.json.result.structuredContent, { eco: { texto: 'reunião às 16h' } });
    const c = s.chamadas[antes];
    assert.equal(c.tipo, 'mcp-chamada');
    assert.match(c.cid, /^mcp-[0-9a-f]{16}$/);
    assert.equal(c.sessao, 's1');
    assert.equal(c.ferramenta, 'coop_aviso');
    assert.deepEqual(c.args, { texto: 'reunião às 16h' });
    assert.deepEqual(c.agente, AGENTE);
    assert.equal(s.mcp.pendentes(), 0);
  });

  await t.test('argumento faltando ou do tipo errado: erro de ferramenta (isError) sem incomodar a tela', async () => {
    const antes = s.chamadas.length;
    const a = await post(s.porta, rpc('tools/call', { name: 'coop_campanha', arguments: { nome: '50 clientes', meta: 50, para: 'Carla' } }));
    assert.equal(a.json.result.isError, true);
    assert.match(a.json.result.content[0].text, /faltou "prazo"/);
    const b = await post(s.porta, rpc('tools/call', { name: 'coop_campanha', arguments: { nome: '50 clientes', meta: '50', para: 'Carla', prazo: '30/09' } }));
    assert.match(b.json.result.content[0].text, /"meta" tem de ser número inteiro/);
    const c = await post(s.porta, rpc('tools/call', { name: 'coop_tv', arguments: { modo: 'cinema' } }));
    assert.match(c.json.result.content[0].text, /"modo" tem de ser um de/);
    const d = await post(s.porta, rpc('tools/call', { name: 'coop_aviso', arguments: { texto: 'x', invasor: 1 } }));
    assert.match(d.json.result.content[0].text, /argumento desconhecido/);
    assert.equal(s.chamadas.length, antes, 'nada chegou à tela');
  });

  await t.test('Máquina: coop_maquina é consulta; coop_maquina_peca e coop_maquina_ligar viram mcp-chamada com os argumentos; tipo e chave fora da lista não chegam à tela', async () => {
    const f = Object.fromEntries(FERRAMENTAS.map((x) => [x.name, x]));
    assert.equal(f.coop_maquina.annotations.readOnlyHint, true, 'ler a Máquina é consulta');
    assert.ok(!f.coop_maquina_peca.annotations.readOnlyHint && !f.coop_maquina_ligar.annotations.readOnlyHint, 'montar e ligar mudam o app');
    assert.deepEqual(f.coop_maquina_peca.inputSchema.required, ['tipo', 'nome']);
    const antes = s.chamadas.length;
    const ruim = await post(s.porta, rpc('tools/call', { name: 'coop_maquina_peca', arguments: { tipo: 'banco', nome: 'x' } }));
    assert.match(ruim.json.result.content[0].text, /"tipo" tem de ser um de: gaveta, porta, robo/);
    const semNome = await post(s.porta, rpc('tools/call', { name: 'coop_maquina_peca', arguments: { tipo: 'gaveta' } }));
    assert.match(semNome.json.result.content[0].text, /faltou "nome"/);
    const chave = await post(s.porta, rpc('tools/call', { name: 'coop_maquina_peca', arguments: { tipo: 'gaveta', nome: 'pacientes', chave: 'qualquer um' } }));
    assert.match(chave.json.result.content[0].text, /"chave" tem de ser um de/);
    const ligar = await post(s.porta, rpc('tools/call', { name: 'coop_maquina_ligar', arguments: { de: 'tela agenda' } }));
    assert.match(ligar.json.result.content[0].text, /faltou "para"/);
    assert.equal(s.chamadas.length, antes, 'nada inválido chegou à tela');
    const args = { projeto: 'Clínica', tipo: 'gaveta', nome: 'pacientes', campos: ['nome (texto)', 'nascimento (data)'], chave: 'cada empresa vê só o seu', de: 'novo paciente' };
    const ok = await post(s.porta, rpc('tools/call', { name: 'coop_maquina_peca', arguments: args }));
    assert.equal(ok.json.result.isError, undefined);
    assert.equal(ok.json.result.content[0].text, 'feito na tela: coop_maquina_peca');
    const c = s.chamadas[s.chamadas.length - 1];
    assert.equal(c.ferramenta, 'coop_maquina_peca');
    assert.deepEqual(c.args, args);
    assert.deepEqual(c.agente, AGENTE);
    const l = await post(s.porta, rpc('tools/call', { name: 'coop_maquina_ligar', arguments: { de: 'novo paciente', para: 'pacientes' } }));
    assert.equal(l.json.result.content[0].text, 'feito na tela: coop_maquina_ligar');
    const q = await post(s.porta, rpc('tools/call', { name: 'coop_maquina', arguments: {} }));
    assert.equal(q.json.result.content[0].text, 'feito na tela: coop_maquina');
    assert.equal(s.chamadas.length, antes + 3);
  });

  await t.test('banco: coop_banco_sql e coop_banco_consulta mudam, coop_banco_estado é consulta; vão para a tela com os argumentos; sem projeto ou sql não chegam', async () => {
    const f = Object.fromEntries(FERRAMENTAS.map((x) => [x.name, x]));
    assert.equal(f.coop_banco_estado.annotations.readOnlyHint, true, 'ler o banco é consulta');
    assert.ok(!f.coop_banco_sql.annotations.readOnlyHint && !f.coop_banco_consulta.annotations.readOnlyHint, 'migração e dados de teste mudam o banco');
    assert.equal(f.coop_banco_sql.annotations.destructiveHint, true, 'uma migração pode apagar tabela');
    assert.deepEqual(f.coop_banco_sql.inputSchema.required, ['projeto', 'sql']);
    assert.deepEqual(Object.keys(f.coop_banco_sql.inputSchema.properties), ['projeto', 'sql', 'nome']);
    assert.deepEqual(f.coop_banco_consulta.inputSchema.required, ['projeto', 'sql']);
    assert.deepEqual(f.coop_banco_estado.inputSchema.required, ['projeto']);
    assert.match(f.coop_banco_sql.description, /^Constrói o banco de verdade do projeto \(Postgres local deste computador\): cria\/altera tabelas, vínculos, regras de acesso \(RLS\), funções e gatilhos\. Cada comando vira peça viva na Máquina, em 3D, na hora; a migração fica gravada na pasta do projeto\./);
    const antes = s.chamadas.length;
    const semSql = await post(s.porta, rpc('tools/call', { name: 'coop_banco_sql', arguments: { projeto: 'Clínica' } }));
    assert.equal(semSql.json.result.isError, true);
    assert.match(semSql.json.result.content[0].text, /faltou "sql"/);
    const semProjeto = await post(s.porta, rpc('tools/call', { name: 'coop_banco_estado', arguments: {} }));
    assert.match(semProjeto.json.result.content[0].text, /faltou "projeto"/);
    const intruso = await post(s.porta, rpc('tools/call', { name: 'coop_banco_consulta', arguments: { projeto: 'Clínica', sql: 'SELECT 1', limite: 5 } }));
    assert.match(intruso.json.result.content[0].text, /argumento desconhecido: "limite"/);
    assert.equal(s.chamadas.length, antes, 'nada inválido chegou à tela');
    const args = { projeto: 'Clínica', sql: 'CREATE TABLE pacientes (id uuid PRIMARY KEY, nome text NOT NULL);', nome: 'cria pacientes' };
    const ok = await post(s.porta, rpc('tools/call', { name: 'coop_banco_sql', arguments: args }));
    assert.equal(ok.json.result.isError, undefined);
    assert.equal(ok.json.result.content[0].text, 'feito na tela: coop_banco_sql');
    const c = s.chamadas[s.chamadas.length - 1];
    assert.equal(c.ferramenta, 'coop_banco_sql');
    assert.deepEqual(c.args, args);
    assert.deepEqual(c.agente, AGENTE);
    assert.equal((await post(s.porta, rpc('tools/call', { name: 'coop_banco_consulta', arguments: { projeto: 'Clínica', sql: "INSERT INTO pacientes (id, nome) VALUES (gen_random_uuid(), 'Pessoa de teste')" } }))).json.result.content[0].text, 'feito na tela: coop_banco_consulta');
    assert.equal((await post(s.porta, rpc('tools/call', { name: 'coop_banco_estado', arguments: { projeto: 'Clínica' } }))).json.result.content[0].text, 'feito na tela: coop_banco_estado');
    assert.equal(s.chamadas.length, antes + 3);
  });

  await t.test('Estação: coop_abrir e coop_fechar mudam só a tela, coop_onde e coop_tela são consulta; o/modo fora da lista não chegam; as instruções mandam usar coop_abrir', async () => {
    const f = Object.fromEntries(FERRAMENTAS.map((x) => [x.name, x]));
    assert.equal(f.coop_onde.annotations.readOnlyHint, true, 'onde está cada um é consulta');
    assert.equal(f.coop_tela.annotations.readOnlyHint, true, 'o que está na tela é consulta');
    assert.ok(!f.coop_abrir.annotations.readOnlyHint && !f.coop_fechar.annotations.readOnlyHint, 'abrir e fechar mexem na tela');
    assert.equal(f.coop_abrir.annotations.destructiveHint, false);
    assert.deepEqual(f.coop_abrir.inputSchema.required, ['o']);
    assert.deepEqual(f.coop_abrir.inputSchema.properties.o.enum, ['atividade', 'arquivo', 'projeto', 'maquina', 'pessoa']);
    assert.deepEqual(f.coop_abrir.inputSchema.properties.modo.enum, ['2d', '3d']);
    assert.deepEqual(f.coop_fechar.inputSchema.properties.o.enum, ['tudo', 'aba']);
    assert.deepEqual(Object.keys(f.coop_onde.inputSchema.properties), ['pessoa']);
    assert.deepEqual(Object.keys(f.coop_tela.inputSchema.properties), []);
    for (const n of ['Meu dia', 'Criar', 'Trabalho', 'Chat', 'WhatsApp', 'Reunião', 'Terminais', 'Projetos', 'Acervo', 'Equipe', 'Loja', 'Oficina']) assert.ok(f.coop_abrir.description.includes(n), 'a descrição cita a atividade ' + n);
    const init = await post(s.porta, rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'x' } }));
    assert.match(init.json.result.instructions, /pedir para abrir, mostrar ou ir para algo.*use coop_abrir/, 'as instruções mandam abrir pelo conector');
    /* o que o modelo ouve é o que acontece: a troca vale como um clique (posição, vendoArquivo, Chat lido) e a edição não salva fica */
    assert.match(init.json.result.instructions, /valem como um clique dela: o que ela passa a ver vira a posição dela, que a equipe vê/);
    assert.match(f.coop_abrir.description, /vale como um clique da pessoa: .*posição dela.*avisa o dono que ela está vendo.*marca a conversa como lida/);
    assert.match(f.coop_abrir.description, /editando um arquivo sem salvar, recusa em vez de jogar fora o texto/);
    assert.match(f.coop_fechar.description, /Aba com edição não salva .* não fecha/);
    for (const x of [init.json.result.instructions, f.coop_abrir.description]) assert.doesNotMatch(x, /ninguém mais vê|nada vai para o diário/, 'nada de prometer que a troca é privada');
    const antes = s.chamadas.length;
    const semO = await post(s.porta, rpc('tools/call', { name: 'coop_abrir', arguments: { ref: 'Projetos' } }));
    assert.equal(semO.json.result.isError, true);
    assert.match(semO.json.result.content[0].text, /faltou "o"/);
    const oRuim = await post(s.porta, rpc('tools/call', { name: 'coop_abrir', arguments: { o: 'disco', ref: '/' } }));
    assert.match(oRuim.json.result.content[0].text, /"o" tem de ser um de: atividade, arquivo, projeto, maquina, pessoa/);
    const modoRuim = await post(s.porta, rpc('tools/call', { name: 'coop_abrir', arguments: { o: 'maquina', modo: '4d' } }));
    assert.match(modoRuim.json.result.content[0].text, /"modo" tem de ser um de: 2d, 3d/);
    const fecharRuim = await post(s.porta, rpc('tools/call', { name: 'coop_fechar', arguments: { o: 'janela' } }));
    assert.match(fecharRuim.json.result.content[0].text, /"o" tem de ser um de: tudo, aba/);
    const telaIntrusa = await post(s.porta, rpc('tools/call', { name: 'coop_tela', arguments: { pessoa: 'Carla' } }));
    assert.match(telaIntrusa.json.result.content[0].text, /argumento desconhecido: "pessoa"/);
    assert.equal(s.chamadas.length, antes, 'nada inválido chegou à tela');
    const args = { o: 'maquina', ref: 'Clínica', modo: '3d' };
    const ok = await post(s.porta, rpc('tools/call', { name: 'coop_abrir', arguments: args }));
    assert.equal(ok.json.result.content[0].text, 'feito na tela: coop_abrir');
    const c = s.chamadas[s.chamadas.length - 1];
    assert.equal(c.ferramenta, 'coop_abrir');
    assert.deepEqual(c.args, args);
    assert.deepEqual(c.agente, AGENTE);
    for (const [nome, a] of [['coop_fechar', { o: 'tudo' }], ['coop_onde', { pessoa: 'Carla' }], ['coop_tela', {}]]) {
      assert.equal((await post(s.porta, rpc('tools/call', { name: nome, arguments: a }))).json.result.content[0].text, 'feito na tela: ' + nome);
    }
    assert.equal(s.chamadas.length, antes + 4);
  });

  await t.test('ferramenta desconhecida → erro JSON-RPC -32602; método desconhecido → -32601', async () => {
    const a = await post(s.porta, rpc('tools/call', { name: 'rm_rf', arguments: {} }));
    assert.equal(a.json.error.code, -32602);
    const b = await post(s.porta, rpc('resources/list', {}));
    assert.equal(b.status, 200);
    assert.equal(b.json.error.code, -32601);
  });

  await t.test('navegador sem Electron: "navegador disponível só no app"', async () => {
    const r = await post(s.porta, rpc('tools/call', { name: 'navegador_abrir', arguments: { url: 'https://exemplo.com.br' } }));
    assert.equal(r.json.result.isError, true);
    assert.match(r.json.result.content[0].text, /navegador disponível só no app/);
  });

  await t.test('JSON quebrado → 400 -32700; não é JSON-RPC → 400 -32600; lote atendido', async () => {
    const a = await post(s.porta, '{"jsonrpc": "2.0", "id": 1, "method": ');
    assert.equal(a.status, 400); assert.equal(a.json.error.code, -32700);
    const b = await post(s.porta, { id: 1, method: 'ping' });
    assert.equal(b.status, 400); assert.equal(b.json.error.code, -32600);
    const c = await post(s.porta, [rpc('ping', {}), { jsonrpc: '2.0', method: 'notifications/initialized' }, rpc('tools/list', {})]);
    assert.equal(c.status, 200);
    assert.equal(c.json.length, 2);
    assert.deepEqual(c.json[0].result, {});
    assert.equal(c.json[1].result.tools.length, 47);
  });

  await t.test('GET e DELETE → 405 (sem SSE, sem sessão); Origin de fora → 403; versão estranha no cabeçalho → 400', async () => {
    const g = await post(s.porta, null, {}, { metodo: 'GET' });
    assert.equal(g.status, 405); assert.equal(g.headers.allow, 'POST');
    const d = await post(s.porta, null, {}, { metodo: 'DELETE' });
    assert.equal(d.status, 405);
    const o = await post(s.porta, rpc('tools/list', {}), { Origin: 'https://site-malicioso.com' });
    assert.equal(o.status, 403);
    const ok = await post(s.porta, rpc('ping', {}), { Origin: 'http://localhost:' + s.porta });
    assert.equal(ok.status, 200);
    const v = await post(s.porta, rpc('tools/list', {}), { 'MCP-Protocol-Version': '1999-01-01' });
    assert.equal(v.status, 400);
  });

  await t.test('era moderna (2026-07-28): server/discover, resultType, cabeçalhos conferidos, versão e método', async () => {
    let m = moderno('server/discover');
    const disc = await post(s.porta, m.corpo, m.headers);
    assert.equal(disc.status, 200);
    assert.equal(disc.json.result.resultType, 'complete');
    assert.ok(disc.json.result.supportedVersions.includes('2026-07-28') && disc.json.result.supportedVersions.includes('2025-11-25'));
    assert.equal(disc.json.result._meta['io.modelcontextprotocol/serverInfo'].name, 'coop');
    /* dica de cache obrigatória em 2026-07-28 (sem ela o Claude Code 2.1.281 recusou a lista: tools/list 4 vezes e nenhuma ferramenta) */
    assert.equal(disc.json.result.ttlMs, 300000);
    assert.equal(disc.json.result.cacheScope, 'public');
    m = moderno('tools/list');
    const lista = await post(s.porta, m.corpo, m.headers);
    assert.equal(lista.json.result.resultType, 'complete');
    assert.equal(lista.json.result.tools.length, 47);
    assert.equal(lista.json.result.ttlMs, 300000);
    assert.equal(lista.json.result.cacheScope, 'public');
    m = moderno('tools/call', { name: 'coop_mural', arguments: { texto: 'bom dia' } });
    const chamada = await post(s.porta, m.corpo, m.headers);
    assert.equal(chamada.json.result.resultType, 'complete');
    assert.equal(chamada.json.result.content[0].text, 'feito na tela: coop_mural');
    /* Mcp-Name em Base64 (nome fora do ASCII seguro) também vale */
    m = moderno('tools/call', { name: 'coop_mural', arguments: { texto: 'oi' } }, '2026-07-28', { 'Mcp-Name': '=?base64?' + Buffer.from('coop_mural').toString('base64') + '?=' });
    assert.equal((await post(s.porta, m.corpo, m.headers)).status, 200);
    /* divergências → 400 -32020 */
    m = moderno('tools/list', {}, '2026-07-28', { 'Mcp-Method': 'tools/call' });
    let r = await post(s.porta, m.corpo, m.headers);
    assert.equal(r.status, 400); assert.equal(r.json.error.code, -32020);
    m = moderno('tools/call', { name: 'coop_mural', arguments: { texto: 'x' } }, '2026-07-28', { 'Mcp-Name': 'coop_aviso' });
    r = await post(s.porta, m.corpo, m.headers);
    assert.equal(r.status, 400); assert.equal(r.json.error.code, -32020);
    m = moderno('tools/list', {}, '2026-07-28', { 'MCP-Protocol-Version': '2025-11-25' });
    r = await post(s.porta, m.corpo, m.headers);
    assert.equal(r.status, 400); assert.equal(r.json.error.code, -32020);
    /* versão desconhecida → 400 -32022 com a lista */
    m = moderno('tools/list', {}, '2099-01-01');
    r = await post(s.porta, m.corpo, m.headers);
    assert.equal(r.status, 400); assert.equal(r.json.error.code, -32022);
    assert.equal(r.json.error.data.requested, '2099-01-01');
    assert.ok(r.json.error.data.supported.includes('2026-07-28'));
    /* método desconhecido → 404 -32601 */
    m = moderno('subscriptions/listen');
    r = await post(s.porta, m.corpo, m.headers);
    assert.equal(r.status, 404); assert.equal(r.json.error.code, -32601);
    /* cabeçalho ausente: aceito e registrado */
    m = moderno('tools/list');
    r = await post(s.porta, m.corpo, {});
    assert.equal(r.status, 200);
    assert.deepEqual(s.log[s.log.length - 1].cabecalhosAusentes, ['MCP-Protocol-Version', 'Mcp-Method']);
  });

  await t.test('o registro fica só em memória e não guarda argumentos nem respostas', async () => {
    const reg = s.mcp.registro();
    assert.ok(reg.length > 10);
    const texto = JSON.stringify(reg);
    assert.ok(!texto.includes('reunião às 16h'), 'argumento não vai para o registro');
    assert.ok(!texto.includes('feito na tela'), 'resposta não vai para o registro');
    assert.ok(reg.some((r) => r.metodo === 'tools/call' && r.ferramenta === 'coop_aviso' && r.ok === true));
  });
});

test('conector coop · a tela: sem tela, tela muda, cancelamento, recusa', async (t) => {
  await t.test('nenhuma tela aberta → erro na hora', async () => {
    const s = await subir(4921, { tela: () => false });
    try {
      const inicio = Date.now();
      const r = await post(s.porta, rpc('tools/call', { name: 'coop_pessoas', arguments: {} }));
      assert.equal(r.json.result.isError, true);
      assert.match(r.json.result.content[0].text, /nenhuma tela do babel-coop aberta/);
      assert.ok(Date.now() - inicio < 1000);
      assert.equal(s.mcp.pendentes(), 0);
    } finally { await s.fechar(); }
  });
  await t.test('tela que não responde → erro no prazo (30 s no app; 300 ms aqui)', async () => {
    const s = await subir(4921, { tela: () => true, criarCom: { tempoUi: 300 } });
    try {
      const inicio = Date.now();
      const r = await post(s.porta, rpc('tools/call', { name: 'coop_pessoas', arguments: {} }));
      const ms = Date.now() - inicio;
      assert.match(r.json.result.content[0].text, /não respondeu em 0,3 s/);
      assert.ok(ms >= 280 && ms < 2000, 'demorou ' + ms + ' ms');
      assert.equal(s.mcp.pendentes(), 0);
    } finally { await s.fechar(); }
  });
  await t.test('as do banco esperam a tela por mais tempo (120 s no app; 0,6 s aqui contra 0,2 s das outras)', async () => {
    const s = await subir(4921, { tela: () => true, criarCom: { tempoUi: 200, tempoUiBanco: 600 } });
    try {
      let inicio = Date.now();
      const outra = await post(s.porta, rpc('tools/call', { name: 'coop_pessoas', arguments: {} }));
      const msOutra = Date.now() - inicio;
      assert.match(outra.json.result.content[0].text, /não respondeu em 0,2 s/);
      inicio = Date.now();
      const banco = await post(s.porta, rpc('tools/call', { name: 'coop_banco_sql', arguments: { projeto: 'Clínica', sql: 'SELECT 1' } }));
      const msBanco = Date.now() - inicio;
      assert.match(banco.json.result.content[0].text, /não respondeu em 0,6 s/);
      assert.ok(msOutra >= 180 && msOutra < 550, 'as outras: ' + msOutra + ' ms');
      assert.ok(msBanco >= 580 && msBanco < 2500, 'o banco: ' + msBanco + ' ms');
      assert.equal(s.mcp.pendentes(), 0);
    } finally { await s.fechar(); }
  });
  await t.test('cliente desistiu (fechou a conexão) → a chamada pendente some; resposta atrasada é ignorada', async () => {
    let ultimo = null;
    const s = await subir(4921, { tela: (msg) => { ultimo = msg; return true; }, criarCom: { tempoUi: 20000 } });
    try {
      const corpo = Buffer.from(JSON.stringify(rpc('tools/call', { name: 'coop_pessoas', arguments: {} })));
      await new Promise((ok) => {
        const req = http.request({ host: '127.0.0.1', port: s.porta, method: 'POST', path: '/mcp/s1', headers: { 'Content-Type': 'application/json', 'Content-Length': corpo.length } });
        req.on('error', () => ok());
        req.write(corpo); req.end();
        setTimeout(() => { assert.equal(s.mcp.pendentes(), 1); req.destroy(); setTimeout(ok, 150); }, 150);
      });
      assert.equal(s.mcp.pendentes(), 0);
      assert.equal(s.mcp.aoMensagemUi({ tipo: 'mcp-resposta', cid: ultimo.cid, ok: true, resultado: 'tarde' }), false);
    } finally { await s.fechar(); }
  });
  await t.test('a tela recusou → isError com a mensagem dela; cid desconhecido é ignorado', async () => {
    const s = await subir(4921, { tela: (msg, mcp) => { setImmediate(() => mcp.aoMensagemUi({ tipo: 'mcp-resposta', cid: msg.cid, ok: false, erro: 'só a gestão manda aviso oficial. Use coop_mural para um recado.' })); return true; } });
    try {
      const r = await post(s.porta, rpc('tools/call', { name: 'coop_aviso', arguments: { texto: 'oi' } }));
      assert.equal(r.json.result.isError, true);
      assert.match(r.json.result.content[0].text, /só a gestão/);
      assert.equal(s.mcp.aoMensagemUi({ tipo: 'mcp-resposta', cid: 'mcp-inventado', ok: true }), false);
      assert.equal(s.mcp.aoMensagemUi({ tipo: 'outra-coisa' }), false);
    } finally { await s.fechar(); }
  });
});

test('conector coop · navegador (módulo falso com a API do §9)', async (t) => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'babel-mcp-nav-'));
  const feitas = [];
  const navegador = {
    abrir: async (ag, url) => { feitas.push(['abrir', ag, url]); return 'aberto: ' + url; },
    clicar: async (ag, alvo) => { feitas.push(['clicar', ag, alvo]); return { texto: 'cliquei' }; },
    digitar: async (ag, seletor, texto) => { feitas.push(['digitar', ag, seletor, texto]); if (seletor === '#codigo') { const e = new Error('é campo de senha'); e.codigo = 'senha'; throw e; } return 'digitei'; },
    ler: async (ag) => ({ markdown: '# Página\n\ntexto' }),
    raioX: async (ag, o) => ({ dom: 'html>body', seletor: o.seletor }),
    clonar: async (ag, destino) => { feitas.push(['clonar', ag, destino]); return { pasta: destino, arquivos: 3 }; },
    copy: async (ag, destino) => { feitas.push(['copy', ag, destino]); return 'copy.md gerado'; },
    print: async (ag, destino) => { feitas.push(['print', ag, destino]); return { png: path.join(destino, 'x.png') }; },
    codigo: async (ag, o) => { feitas.push(['codigo', ag, o]); return o.url ? { url: o.url, tipo: 'Script', mime: 'text/javascript', bytes: 12, conteudo: 'console.log(1)', sourceMap: { url: o.url + '.map', bytes: 40, fontes: ['src/app.ts'], conteudo: '{"version":3}' } } : { url: 'http://x/', total: 2, porTipo: { Document: 1, Script: 1 }, recursos: [{ url: 'http://x/', tipo: 'Document', mime: 'text/html', quadro: 'principal' }, { url: 'http://x/app.js', tipo: 'Script', mime: 'text/javascript', bytes: 12, quadro: 'principal' }] }; },
    rede: async (ag, o) => { feitas.push(['rede', ag, o]); return { pedidos: [{ url: 'http://x/api', metodo: 'GET', status: 200, corpo: '{"ok":true}' }] }; },
    console: async (ag, o) => { feitas.push(['console', ag, o]); return { mensagens: [{ nivel: 'erro', texto: 'falhou' }] }; },
    armazenamento: async (ag) => { feitas.push(['armazenamento', ag]); return { cookies: [{ nome: 'sessao', valor: 'abc' }], localStorage: [{ chave: 'tema', valor: 'escuro' }] }; },
    rolar: async (ag, o) => { feitas.push(['rolar', ag, o]); return { y: 800 }; },
    aguardar: async (ag, o) => { feitas.push(['aguardar', ag, o]); return { achou: true }; },
    voltar: async (ag) => { feitas.push(['voltar', ag]); return { url: 'http://x/' }; },
    avancar: async (ag) => { feitas.push(['avancar', ag]); return { url: 'http://x/2' }; },
    recarregar: async (ag) => { feitas.push(['recarregar', ag]); return { url: 'http://x/' }; },
    teclas: async (ag, k) => { feitas.push(['teclas', ag, k]); return k === 'Enter' ? { ok: true, teclas: ['Enter'] } : { ok: false, recusado: 'senha', campo: 'Senha' }; },
    baixar: async (ag, u) => { feitas.push(['baixar', ag, u]); return { relativo: 'Downloads/relatorio.csv', bytes: 10, mime: 'text/csv' }; }
  };
  const s = await subir(4922, { criarCom: { navegador, cfg: { id: 'theus-1', pasta } } });
  t.after(() => s.fechar());
  const chamar = async (name, args) => (await post(s.porta, rpc('tools/call', { name, arguments: args }))).json.result;

  await t.test('abrir delega com o agente {id, nome} (a aba pedida mostra o nome) e completa https://', async () => {
    const r = await chamar('navegador_abrir', { url: 'exemplo.com.br/cadastro' });
    assert.equal(r.content[0].text, 'aberto: https://exemplo.com.br/cadastro');
    assert.deepEqual(feitas.pop(), ['abrir', QUEM, 'https://exemplo.com.br/cadastro']);
    const ruim = await chamar('navegador_abrir', { url: 'javascript:alert(1)' });
    assert.equal(ruim.isError, true);
    const arquivo = await chamar('navegador_abrir', { url: 'file:///etc/passwd' });
    assert.equal(arquivo.isError, true);
  });
  await t.test('arquivo da pasta (caminho ou file://) abre pela /pasta/ da Estação; de fora, a resposta manda copiar (sem python)', async () => {
    const site = path.join(pasta, 'sites', 'lp reino');
    fs.mkdirSync(site, { recursive: true });
    const alvo = path.join(site, 'ATUAL - LP.html');
    fs.writeFileSync(alvo, '<h1>LP</h1>');
    const esperado = /^aberto: http:\/\/localhost:\d+\/pasta\/sites\/lp%20reino\/ATUAL%20-%20LP\.html$/;
    assert.match((await chamar('navegador_abrir', { url: alvo })).content[0].text, esperado);
    assert.match((await chamar('navegador_abrir', { url: require('url').pathToFileURL(alvo).href })).content[0].text, esperado);
    const fora = await chamar('navegador_abrir', { url: '/Users/alguem/Desktop/babel-os/entregas/sites/lp-reino/ATUAL.html' });
    assert.equal(fora.isError, true);
    assert.match(fora.content[0].text, /fora da pasta compartilhada/);
    assert.match(fora.content[0].text, /cp -R "\/Users\/alguem\/Desktop\/babel-os\/entregas\/sites\/lp-reino"/);
    assert.match(fora.content[0].text, /Não sirva com python/);
  });
  await t.test('clicar pede seletor ou texto; digitar recusa senha (pelo seletor e pelo aviso do módulo)', async () => {
    assert.equal((await chamar('navegador_clicar', {})).isError, true);
    assert.equal((await chamar('navegador_clicar', { texto: 'Enviar' })).content[0].text, 'cliquei');
    assert.deepEqual(feitas.pop(), ['clicar', QUEM, { texto: 'Enviar' }]);
    const n = feitas.length;
    const senha = await chamar('navegador_digitar', { seletor: 'input[type=password]', texto: '123' });
    assert.equal(senha.isError, true);
    assert.match(senha.content[0].text, /sua vez: a pessoa digita a senha/);
    assert.equal(feitas.length, n, 'nem chegou ao navegador');
    const modulo = await chamar('navegador_digitar', { seletor: '#codigo', texto: '123' });
    assert.match(modulo.content[0].text, /sua vez: a pessoa digita a senha/);
    assert.equal((await chamar('navegador_digitar', { seletor: '#nome', texto: 'Clínica Vida' })).content[0].text, 'digitei');
  });
  await t.test('ler devolve o Markdown; raio-X passa o seletor', async () => {
    assert.equal((await chamar('navegador_ler', {})).content[0].text, '# Página\n\ntexto');
    assert.match((await chamar('navegador_raio_x', { seletor: 'h1' })).content[0].text, /"seletor": "h1"/);
  });
  await t.test('clonar, copy e print: destino = a pasta compartilhada (o módulo grava em Clones/<site>/); pasta fora dela é recusada', async () => {
    await chamar('navegador_clonar', {});
    assert.deepEqual(feitas.pop(), ['clonar', QUEM, pasta], 'o módulo cria Clones/<site>/ dentro da pasta: nada de Clones/Clones');
    await chamar('navegador_clonar', { pasta: 'Projetos/Site' });
    assert.deepEqual(feitas.pop(), ['clonar', QUEM, path.join(pasta, 'Projetos', 'Site')]);
    await chamar('navegador_clonar', { pasta: 'Clones' });
    assert.deepEqual(feitas.pop(), ['clonar', QUEM, pasta], '"Clones" pedido pelo agente vale como o padrão');
    const fora = await chamar('navegador_clonar', { pasta: '../../etc' });
    assert.equal(fora.isError, true);
    assert.match(fora.content[0].text, /dentro da pasta compartilhada/);
    await chamar('navegador_copy', {});
    assert.deepEqual(feitas.pop(), ['copy', QUEM, pasta]);
    await chamar('navegador_print', {});
    assert.deepEqual(feitas.pop(), ['print', QUEM, pasta]);
  });
});

test('conector coop · navegador até o osso: inspeção só leitura e navegação (módulo falso)', async (t) => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'babel-mcp-osso-'));
  t.after(() => fs.rmSync(pasta, { recursive: true, force: true }));
  const feitas = [];
  const navegador = {
    codigo: async (ag, o) => { feitas.push(['codigo', o]); return o.url ? { url: o.url, tipo: 'Script', mime: 'text/javascript', bytes: 14, conteudo: 'console.log(1)', sourceMap: { url: o.url + '.map', bytes: 13, fontes: ['src/app.ts'], conteudo: '{"version":3}' } } : { url: 'http://x/', total: 2, porTipo: { Document: 1, Script: 1 }, recursos: [{ url: 'http://x/', tipo: 'Document', mime: 'text/html', quadro: 'principal' }, { url: 'http://x/app.js', tipo: 'Script', mime: 'text/javascript', bytes: 14, quadro: 'principal' }] }; },
    rede: async (ag, o) => { feitas.push(['rede', o]); return { pedidos: [{ url: 'http://x/api', metodo: 'GET', status: 200, corpo: '{"ok":true}' }] }; },
    console: async (ag, o) => { feitas.push(['console', o]); return { mensagens: [{ nivel: 'erro', texto: 'falhou' }] }; },
    armazenamento: async () => { feitas.push(['armazenamento']); return { cookies: [{ nome: 'sessao', valor: 'abc' }], localStorage: [{ chave: 'tema', valor: 'escuro' }] }; },
    rolar: async (ag, o) => { feitas.push(['rolar', o]); return { y: 800 }; },
    aguardar: async (ag, o) => { feitas.push(['aguardar', o]); return { achou: true }; },
    voltar: async () => { feitas.push(['voltar']); return { url: 'http://x/' }; },
    avancar: async () => { feitas.push(['avancar']); return { url: 'http://x/2' }; },
    recarregar: async () => { feitas.push(['recarregar']); return { url: 'http://x/' }; },
    teclas: async (ag, k) => { feitas.push(['teclas', k]); return k === 'Enter' ? { ok: true, teclas: ['Enter'] } : { ok: false, recusado: 'senha', campo: 'Senha' }; },
    baixar: async (ag, u) => { feitas.push(['baixar', u]); return { relativo: 'Downloads/relatorio.csv', bytes: 10, mime: 'text/csv' }; }
  };
  const s = await subir(4923, { criarCom: { navegador, cfg: { id: 'theus-1', pasta } } });
  t.after(() => s.fechar());
  const chamar = async (name, args) => (await post(s.porta, rpc('tools/call', { name, arguments: args }))).json.result;
  const nomes = FERRAMENTAS.map((f) => f.name);
  for (const n of ['navegador_codigo', 'navegador_rede', 'navegador_console', 'navegador_armazenamento', 'navegador_rolar', 'navegador_esperar', 'navegador_voltar', 'navegador_avancar', 'navegador_recarregar', 'navegador_teclas', 'navegador_arquivo_baixar']) assert.ok(nomes.includes(n), n);
  const leitura = FERRAMENTAS.filter((f) => f.annotations && f.annotations.readOnlyHint).map((f) => f.name);
  for (const n of ['navegador_codigo', 'navegador_rede', 'navegador_console', 'navegador_armazenamento']) assert.ok(leitura.includes(n), n + ' é só leitura (vira bloco consulta)');
  assert.ok(!nomes.some((n) => /executar|eval|script|cdp/i.test(n)), 'nenhuma ferramenta de código livre na página nem de CDP livre');
  let r = await chamar('navegador_codigo', {});
  assert.match(r.content[0].text, /^2 recursos em http:\/\/x\/:\n- Document · text\/html · http:\/\/x\/\n- Script · text\/javascript · 14 B · http:\/\/x\/app\.js/);
  r = await chamar('navegador_codigo', { url: 'http://x/app.js' });
  assert.match(r.content[0].text, /^\/\* http:\/\/x\/app\.js · Script · text\/javascript · 14 bytes \*\/\nconsole\.log\(1\)\n\n\/\* source map: http:\/\/x\/app\.js\.map · 13 bytes · fontes: src\/app\.ts \*\/\n\{"version":3\}$/);
  assert.deepEqual(r.structuredContent.sourceMap.fontes, ['src/app.ts']);
  r = await chamar('navegador_rede', { filtro: 'api', corpo: true });
  assert.match(r.content[0].text, /"corpo": "\{\\"ok\\":true\}"/);
  assert.deepEqual(feitas.pop(), ['rede', { filtro: 'api', corpo: true }]);
  assert.match((await chamar('navegador_console', { nivel: 'erro' })).content[0].text, /falhou/);
  assert.match((await chamar('navegador_armazenamento', {})).content[0].text, /"tema"/);
  assert.equal((await chamar('navegador_rolar', {})).isError, true, 'rolar sem para nem pixels');
  await chamar('navegador_rolar', { para: 'fim' });
  assert.deepEqual(feitas.pop(), ['rolar', { para: 'fim', pixels: undefined }]);
  await chamar('navegador_esperar', { seletor: '#pronto', ms: 3000 });
  assert.deepEqual(feitas.pop(), ['aguardar', { seletor: '#pronto', texto: undefined, ms: 3000 }]);
  for (const n of ['voltar', 'avancar', 'recarregar']) { await chamar('navegador_' + n, {}); assert.deepEqual(feitas.pop(), [n]); }
  assert.match((await chamar('navegador_teclas', { teclas: 'Enter' })).content[0].text, /"ok": true/);
  const senha = await chamar('navegador_teclas', { teclas: 'Tab' });
  assert.equal(senha.isError, true);
  assert.match(senha.content[0].text, /^sua vez: a pessoa digita a senha \(Senha\)/);
  r = await chamar('navegador_arquivo_baixar', { url: 'relatorio.csv' });
  assert.equal(r.content[0].text, 'Baixado em Downloads/relatorio.csv (10 bytes, text/csv).');
  assert.equal((await chamar('navegador_teclas', {})).isError, true, 'teclas é obrigatório');
});

test('conector coop · servidor e tela falam a mesma língua', () => {
  const ui = fs.readFileSync(path.join(__dirname, '..', '..', 'interface', 'coop-ui.js'), 'utf8');
  const lista = ui.match(/var PERMITIDAS = \[([\s\S]*?)\];/)[1].match(/'([A-Za-z]+)'/g).map((s) => s.slice(1, -1));
  assert.deepEqual(lista, ACOES_PERMITIDAS, 'a lista de ações permitidas é a mesma nos dois lados');
  const naTela = [...ui.matchAll(/^\s*F\.(coop_[a-z_]+) = function/gm)].map((m) => m[1]).sort();
  const noServidor = FERRAMENTAS.map((f) => f.name).filter((n) => n.startsWith('coop_')).sort();
  assert.deepEqual(naTela, noServidor, 'cada ferramenta coop_* tem quem a execute na tela');
  for (const proibida of ['ok', 'devolver', 'cancelar', 'pedirEntrar', 'aceitarEntrar', 'transmissao', 'gravarSala', 'waEnviar', 'foto', 'perfil', 'lojaChave', 'criarArquivo', 'salvarArquivo', 'oficinaPublicar']) {
    assert.ok(!ACOES_PERMITIDAS.includes(proibida), proibida + ' não pode estar na lista do agente');
  }
  /* maquinaMudar tira e muda peça do banco local: só as ferramentas coop_banco_* da tela fazem, nunca um coop_acao solto */
  assert.ok(!ACOES_PERMITIDAS.includes('maquinaMudar'), 'maquinaMudar não é do agente');
  assert.match(ui, /var DA_TELA = \{ maquinaMudar: true \};/);
  assert.match(ui, /if \(\(!permitida\[acao\] && !DA_TELA\[acao\]\) \|\| typeof L\.A\[acao\] !== 'function'\) return;/);
  assert.match(ui, /F\.coop_acao = function \(a, c\) \{\n\s+if \(!permitida\[a\.acao\]/, 'coop_acao só aceita a lista permitida');
});

/* ------------------------------------------------------------------ (c) Claude Code de verdade */
test('conector coop · Claude Code real chama tools/list e tools/call e usa o resultado', { skip: process.env.BABEL_TESTE_CLAUDE ? false : 'só com BABEL_TESTE_CLAUDE=1 (custa uma chamada ao modelo barato)', timeout: 240000 }, async () => {
  const MARCADOR = 'Zuleica Brandão';
  const tela = (msg, mcp, chamadas) => {
    chamadas.push(msg);
    const pessoas = [
      { id: 'theus-1', nome: 'Theus', papel: 'gestão', online: true, agentes: ['Rita'] },
      { id: 'carla', nome: 'Carla', papel: 'membro', online: false, agentes: ['Lu'] },
      { id: 'zuleica', nome: MARCADOR, papel: 'membro', online: true, agentes: ['Faro'] }
    ];
    const resultado = msg.ferramenta === 'coop_pessoas'
      ? { texto: pessoas.length + ' pessoas na equipe:\n' + pessoas.map((p) => '- ' + p.nome + ' (' + p.id + ') · ' + p.papel + ' · ' + (p.online ? 'online' : 'offline') + ' · agentes: ' + p.agentes.join(', ')).join('\n'), dados: { pessoas } }
      : { texto: 'feito: ' + msg.ferramenta };
    setImmediate(() => mcp.aoMensagemUi({ tipo: 'mcp-resposta', cid: msg.cid, ok: true, resultado }));
    return true;
  };
  const s = await subir(4923, { tela });
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'babel-mcp-claude-'));
  const mcpConfig = JSON.stringify({ mcpServers: { coop: { type: 'http', url: 'http://127.0.0.1:' + s.porta + '/mcp/s-claude' } } });
  const pedido = 'liste as pessoas da equipe usando a ferramenta coop';
  const args = ['-p', pedido, '--model', 'haiku', '--mcp-config', mcpConfig, '--strict-mcp-config', '--allowedTools', 'mcp__coop', 'mcp__coop__*', '--output-format', 'json', '--no-session-persistence', '--setting-sources', 'project', '--max-budget-usd', '0.30', '--debug-file', path.join(pasta, 'debug.log')];
  /* sem as variáveis que marcam "estou dentro de outra sessão do Claude Code" (o login fica onde está) */
  const env = Object.assign({}, process.env);
  Object.keys(env).forEach((k) => { if (/^CLAUDECODE$|^CLAUDE_CODE_(ENTRYPOINT|SSE_PORT|SESSION|EXECPATH)/.test(k)) delete env[k]; });
  const inicio = Date.now();
  const saida = await new Promise((ok, erro) => {
    const p = spawn('claude', args, { cwd: pasta, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (c) => { out += c; });
    p.stderr.on('data', (c) => { err += c; });
    const t = setTimeout(() => { p.kill('SIGTERM'); erro(new Error('claude passou de 200 s')); }, 200000);
    p.on('error', (e) => { clearTimeout(t); erro(e); });
    p.on('close', (codigo) => { clearTimeout(t); ok({ codigo, out, err }); });
  });
  const ms = Date.now() - inicio;
  await s.fechar();
  let j = null; try { j = JSON.parse(saida.out); } catch (e) { j = null; }
  const evidencia = {
    quando: new Date().toISOString(), comando: 'claude ' + args.map((a) => (/\s|[{}"]/.test(a) ? "'" + a + "'" : a)).join(' '), cwd: pasta, ms, codigo: saida.codigo,
    registroDoServidor: s.log, chamadasNaTela: s.chamadas.map((c) => ({ ferramenta: c.ferramenta, sessao: c.sessao, agente: c.agente, args: c.args })),
    resposta: j ? { result: j.result, is_error: j.is_error, num_turns: j.num_turns, duration_ms: j.duration_ms, total_cost_usd: j.total_cost_usd, usage: j.usage, modelUsage: j.modelUsage, subtype: j.subtype } : null,
    stderr: saida.err.slice(0, 4000), stdoutCru: j ? undefined : saida.out.slice(0, 4000),
    /* só as linhas do log de depuração que falam do servidor MCP coop (conexão, ferramentas, erros) */
    debugMcp: (() => { try { return fs.readFileSync(path.join(pasta, 'debug.log'), 'utf8').split('\n').filter((l) => /coop/i.test(l)).slice(0, 80).map((l) => l.slice(0, 400)); } catch (e) { return ['sem log: ' + e.message]; } })()
  };
  if (process.env.BABEL_TESTE_EVIDENCIAS) {
    fs.mkdirSync(process.env.BABEL_TESTE_EVIDENCIAS, { recursive: true });
    fs.writeFileSync(path.join(process.env.BABEL_TESTE_EVIDENCIAS, 'claude-real.json'), JSON.stringify(evidencia, null, 2));
  }
  fs.rmSync(pasta, { recursive: true, force: true });
  assert.equal(saida.codigo, 0, 'claude saiu com ' + saida.codigo + ': ' + saida.err.slice(0, 500));
  assert.ok(j, 'a saída do claude é JSON');
  const metodos = s.log.map((r) => r.metodo);
  assert.ok(metodos.includes('tools/list'), 'o claude pediu tools/list: ' + metodos.join(','));
  assert.ok(s.log.some((r) => r.metodo === 'tools/call' && r.ferramenta === 'coop_pessoas' && r.ok), 'o claude chamou coop_pessoas');
  assert.ok(s.chamadas.some((c) => c.ferramenta === 'coop_pessoas' && c.sessao === 's-claude'), 'a chamada chegou à tela');
  assert.ok(j.result.includes('Zuleica'), 'a resposta do claude usou o resultado da ferramenta: ' + j.result.slice(0, 300));
});
