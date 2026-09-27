/* Babel Coop · o acervo (servidor/acervo.js, IDEIAS §8.1–8.2, CHECKLIST §6)
   (a) no processo: indexar pasta e diário; palavras (acento, prefixo); semelhança; aprendizado +1 confirmado e o parecido
       abaixo do limiar; APRENDIZADOS.md, ACERVO.md, CLAUDE.md e os JSONL (cartões, fundidos, inventário); usos (o autor
       não infla); resultado de agente vira histórico de terminal sem o que foi digitado (Agentes de verdade, terminal falso);
       exportar o dia; reconstruir do zero dá o mesmo.
   (b) ponta a ponta pelo MCP (JSON-RPC por HTTP, coop-mcp.js com o acervo): coop_aprendi 2× → "novo" e "+1 confirmado";
       coop_buscar com autor e usos; coop_ler; coop_aprendizados.
   (c) Estações de verdade (processos filhos): rotas locais (e recusa do que não é local) e a busca federada com 2
       Estações; a que desliga vira ficha "computador desligado".
   Portas só deste arquivo: HTTP 5210–5219, UDP 41710.
   Rodar: node --test testes/servidor/acervo.test.js
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { Acervo, vetor, cosseno } = require('../../servidor/acervo');
const { Agentes } = require('../../servidor/agentes');
const { criar } = require('../../servidor/coop-mcp');
const { Estacao, pedirHttp, ipDaRede, esperar } = require('./estacoes');

const NOMES = { theus: 'Theus', davi: 'Davi', rita: 'Rita' };
const temporarios = [];
function montar(opcoes) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'babel-acervo-'));
  temporarios.push(raiz);
  const pasta = path.join(raiz, 'theus');
  fs.mkdirSync(pasta, { recursive: true });
  const eventos = [];
  let seq = 0, ac = null;
  /* o "diário": anexar grava e avisa o acervo, como o servidor faz em diario.aoNovo */
  const anexar = (quem, acao, args, ts) => { const ev = { id: 'theus:' + (++seq), autor: 'theus', seq, ts: ts || Date.now(), quem, acao, args: args || [] }; eventos.push(ev); if (ac) ac.evento(ev); return ev; };
  ac = new Acervo(Object.assign({ raiz, pasta, eu: 'theus', nomeDe: (id) => NOMES[id] || id, anexar: (q, a, g) => anexar(q, a, g), eventos: () => eventos, tempoGerar: 50, tempoVarrer: 50 }, opcoes || {}));
  return { raiz, pasta, ac, eventos, anexar };
}
const ids = (lista) => lista.map((r) => r.id);
after(() => { temporarios.forEach((r) => { try { fs.rmSync(r, { recursive: true, force: true }); } catch (e) { /* ok */ } }); });

/* ------------------------------------------------------------------ (a) no processo */
describe('acervo · substrato no processo', () => {
  let T;
  before(() => {
    T = montar();
    const p = T.pasta;
    const w = (rel, s) => { fs.mkdirSync(path.dirname(path.join(p, rel)), { recursive: true }); fs.writeFileSync(path.join(p, rel), s); };
    w('propostas/clinicas.md', '# Propostas para clínicas\nAs clínicas odontológicas pedem proposta curta, de uma página, com preço fechado.');
    w('financeiro/reembolso.txt', 'O reembolso do convênio demora trinta dias para cair na conta do paciente.');
    w('site/index.html', '<html><head><title>Página da Babel</title><style>.x{color:red}</style><script>var segredoDoScript=1</script></head><body><h1>Atendimento</h1><p>Agenda online para academias.</p></body></html>');
    w('dados/tabela.csv', 'cliente,cidade\nClínica Sorriso,Campinas\n');
    w('dados/config.json', '{"campanha": "cinquenta clientes"}');
    w('estilo.css', '.botao { color: tomato }');
    w('app.js', 'function saudacao() { return "olá equipe" }');
    w('relatorio-anual-2025.pdf', '%PDF-1.4 binário');
    fs.writeFileSync(path.join(p, 'foto.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 1, 2, 3]));
    w('Clones/exemplo.com/copy.md', '# Copy de exemplo.com\nConsultoria para clínicas veterinárias no interior.');
    w('Clones/exemplo.com/assets/app.js', 'console.log("minificado")');
    const ev = (quem, acao, args) => T.anexar(quem, acao, args);
    ev('theus', 'novaDemanda', [{ titulo: 'Proposta da clínica Sorriso', descricao: 'Fazer proposta curta', para: 'davi', prazo: '2026-09-30' }]);
    ev('davi', 'pegar', ['d-x-1']);
    ev('davi', 'pronta', ['d-x-1', 'Cliente de clínica prefere proposta curta de uma página']);
    ev('rita', 'ideiaFalada', ['Fazer um vídeo curto mostrando a agenda online']);
    ev('rita', 'responderPergunta', ['O que mais travou a semana foi esperar o convênio responder']);
    ev('theus', 'decisao', ['Toda proposta sai com preço fechado']);
    ev('theus', 'criarArquivo', ['equipe/Reuniões/2026-09-23 Semanal.md', 'md', '# Ata · Semanal\nDecidimos o preço fechado.']);
    ev('rita', 'mensagem', ['c1', 'mensagem comum que não é do acervo']);
    ev('rita', 'mensagem', ['c1', 'Guardem isto: o fornecedor de luvas mudou de telefone', { acervo: true }]);
    ev('theus', 'novaCampanha', [{ titulo: '50 clientes', alvo: 50, pessoa: 'davi' }]);
  });

  it('indexa a pasta (texto de .md .txt .html .css .js .json .csv; PDF só o nome; imagem só no inventário) e o diário, com autor e origem', () => {
    const r = T.ac.sincronizar();
    assert.equal(r.eventos, 10);
    const st = T.ac.estatisticas();
    assert.equal(st.inventario.arquivos, 11, 'todo arquivo servido entra no inventário');
    for (const id of ['arq:theus/propostas/clinicas.md', 'arq:theus/financeiro/reembolso.txt', 'arq:theus/site/index.html', 'arq:theus/dados/tabela.csv', 'arq:theus/dados/config.json', 'arq:theus/estilo.css', 'arq:theus/app.js', 'arq:theus/relatorio-anual-2025.pdf']) assert.ok(T.ac.q.item.get(id), 'faltou ' + id);
    assert.equal(T.ac.q.item.get('arq:theus/foto.png'), undefined, 'imagem: só inventário');
    assert.equal(T.ac.q.inv.get('theus/foto.png').ext, 'png');
    assert.match(T.ac.q.inv.get('theus/foto.png').hash, /^[0-9a-f]{40}$/);
    const html = T.ac.q.item.get('arq:theus/site/index.html');
    assert.equal(html.titulo, 'Página da Babel');
    assert.ok(html.texto.includes('Agenda online') && !html.texto.includes('segredoDoScript') && !html.texto.includes('color:red'), 'html vira texto sem script nem estilo');
    assert.equal(T.ac.q.item.get('arq:theus/relatorio-anual-2025.pdf').texto.trim(), 'relatorio-anual-2025.pdf\nrelatorio anual 2025'.trim());
    assert.equal(T.ac.q.item.get('arq:theus/Clones/exemplo.com/copy.md').tipo, 'clone', 'copy.md do navegador = clone');
    assert.equal(T.ac.q.item.get('arq:theus/Clones/exemplo.com/assets/app.js'), undefined, 'código do clone: só inventário');
    assert.deepEqual(st.porTipo.demanda, 2, 'a demanda e a história dela');
    assert.equal(st.porTipo.ideia, 1); assert.equal(st.porTipo.resposta, 1); assert.equal(st.porTipo.campanha, 1); assert.equal(st.porTipo.mensagem, 1, 'só a mensagem marcada');
    assert.equal(st.porTipo.ata, 2, 'decisão + ata da reunião'); assert.equal(st.porTipo.aprendizado, 1, 'o aprendizado do "pronta"');
    const ap = T.ac.aprendizados(5)[0];
    assert.equal(ap.autor, 'Davi'); assert.equal(ap.autorId, 'davi'); assert.equal(ap.origem.evento, 'theus:3'); assert.match(ap.cartao, /^apr-\d{3}$/);
    const hist = T.ac.q.item.get('demh:d-x-1');
    assert.ok(hist.texto.includes('Davi pegou') && hist.texto.includes('avisou que está pronta: Cliente de clínica'), hist.texto);
    /* de novo: nada mudou → nada regrava (hash) */
    const de_novo = T.ac.sincronizar();
    assert.equal(de_novo.arquivos.mudaram, 0);
    assert.equal(T.ac.estatisticas().itens, st.itens);
    fs.appendFileSync(path.join(T.pasta, 'financeiro/reembolso.txt'), '\nAtualizado: agora são vinte dias.');
    assert.equal(T.ac.varrer().mudaram, 1, 'só o que mudou reindexa');
  });

  it('busca por palavras: com e sem acento, maiúscula e prefixo ("clinica" acha "clínicas")', () => {
    for (const q of ['clinica', 'clínicas', 'CLINICA', 'odonto']) {
      const r = T.ac.buscar(q, { modo: 'palavras' });
      assert.ok(ids(r).includes('arq:theus/propostas/clinicas.md'), q + ' → ' + JSON.stringify(ids(r)));
    }
    const r = T.ac.buscar('clinica', { modo: 'palavras' })[0];
    for (const k of ['tipo', 'titulo', 'autor', 'dono', 'usos', 'trecho', 'origem', 'quando', 'pontuacao']) assert.ok(k in r, 'faltou ' + k);
    assert.equal(T.ac.buscar('zzzzqqq', { modo: 'palavras' }).length, 0);
  });

  it('busca por semelhança acha texto parecido escrito com outras palavras (e a por palavras não acha)', () => {
    const q = 'reembolsar convênios demorados';
    assert.equal(T.ac.buscar(q, { modo: 'palavras' }).filter((x) => x.id === 'arq:theus/financeiro/reembolso.txt').length, 0, 'por palavras não casa');
    const r = T.ac.buscar(q, { modo: 'semelhanca' });
    assert.equal(r[0].id, 'arq:theus/financeiro/reembolso.txt', JSON.stringify(r.map((x) => [x.id, x.semelhanca])));
    const tudo = T.ac.buscar(q, { modo: 'tudo' });
    assert.equal(tudo[0].id, 'arq:theus/financeiro/reembolso.txt');
    assert.ok(Array.isArray(tudo[0].vizinhos));
  });

  it('aprendizado repetido vira +1 confirmado (fundido) e o parecido abaixo do limiar entra como novo', () => {
    const a = T.ac.aprendi('Clientes de clínicas preferem propostas curtas de uma página', 'theus', 'teste');
    assert.equal(a.novo, false, 'o mesmo com outras flexões já era sabido');
    assert.equal(a.autor, 'Davi', 'devolve o que já se sabia, de quem ensinou');
    assert.equal(a.confirmacoes, 1);
    const f = T.ac.db.prepare('SELECT * FROM fundidos').all();
    assert.equal(f.length, 1); assert.equal(f[0].fundido_em, a.cartao); assert.ok(f[0].fundido_data);
    const b = T.ac.aprendi('Proposta curta de uma página funciona melhor com clínica', 'rita', 'teste');
    const s = cosseno(vetor('Cliente de clínica prefere proposta curta de uma página'), vetor('Proposta curta de uma página funciona melhor com clínica'));
    assert.ok(s < T.ac.limiar, 'semelhança ' + s);
    assert.equal(b.novo, true, 'parecido abaixo do limiar entra');
    assert.throws(() => T.ac.aprendi('curto', 'rita'), /8 letras/);
    assert.equal(T.eventos.filter((e) => e.acao === 'aprendizado').length, 2, 'cada aprendi vai para o diário (histórico cru)');
  });

  it('APRENDIZADOS.md, ACERVO.md, CLAUDE.md (bloco marcado, sem apagar o da pessoa) e os JSONL de cartões, fundidos e inventário', () => {
    T.ac.gerarArquivos();
    const ap = fs.readFileSync(path.join(T.pasta, 'APRENDIZADOS.md'), 'utf8');
    assert.ok(ap.includes('Cliente de clínica prefere proposta curta de uma página') && ap.includes('Davi') && ap.includes('confirmado 2×'), ap);
    assert.ok(ap.indexOf('Cliente de clínica prefere') < ap.indexOf('Proposta curta de uma página funciona'), 'mais confirmado primeiro');
    const md = fs.readFileSync(path.join(T.pasta, 'ACERVO.md'), 'utf8');
    assert.ok(md.includes('## Linha do tempo') && md.includes('## Temas') && /### \d{4}-\d{2}-\d{2}/.test(md), md.slice(0, 400));
    const cl = fs.readFileSync(path.join(T.pasta, 'CLAUDE.md'), 'utf8');
    for (const s of ['coop_buscar', 'APRENDIZADOS.md', 'coop_aprendi']) assert.ok(cl.includes(s), s);
    fs.writeFileSync(path.join(T.pasta, 'CLAUDE.md'), '# Minhas regras\nNunca mande proposta sem revisar.\n');
    T.ac.gerarArquivos(); T.ac.gerarArquivos();
    const cl2 = fs.readFileSync(path.join(T.pasta, 'CLAUDE.md'), 'utf8');
    assert.ok(cl2.startsWith('# Minhas regras\nNunca mande proposta sem revisar.'), 'o texto da pessoa fica');
    assert.equal(cl2.split('coop:acervo início').length, 2, 'um bloco só, mesmo gerando de novo');
    const cartoes = fs.readFileSync(path.join(T.raiz, '.coop/acervo/cartoes.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
    const c = cartoes.find((x) => x.tipo === 'aprendizado');
    assert.match(c.id, /^apr-\d{3}$/);
    for (const k of ['afirmacao', 'prova', 'data', 'autor', 'tags', 'fontes']) assert.ok(c[k] != null && c[k] !== '', 'cartão sem ' + k);
    assert.ok(c.tags.length >= 2 && c.tags.length <= 5);
    assert.ok(cartoes.some((x) => /^res-|^dem-|^ata-|^resp-/.test(x.id)), 'cartões de demanda, ata e resposta');
    const fundidos = fs.readFileSync(path.join(T.raiz, '.coop/acervo/fundidos.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
    assert.equal(fundidos[0].fundido_em, c.id);
    const inv = fs.readFileSync(path.join(T.raiz, '.coop/acervo/inventario.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
    assert.ok(inv.find((i) => i.caminho === 'theus/foto.png' && i.bytes === 8 && i.tem_texto === false));
    /* os gerados não voltam para o acervo (não entram em laço) */
    T.ac.varrer();
    assert.equal(T.ac.q.item.get('arq:theus/ACERVO.md'), undefined);
    assert.equal(T.ac.q.item.get('arq:theus/APRENDIZADOS.md'), undefined);
  });

  it('uso soma +1 por pessoa por hora por item e o próprio autor não infla', () => {
    const id = T.ac.aprendizados(1, 'confirmados')[0].id; /* de Davi */
    const usos = () => T.ac.q.item.get(id).usos;
    const antes = usos();
    T.ac.buscar('clinica proposta curta', { quem: 'davi' });
    assert.equal(usos(), antes, 'o autor não conta');
    T.ac.buscar('clinica proposta curta', { quem: 'theus' });
    assert.equal(usos(), antes + 1);
    T.ac.buscar('clinica proposta curta', { quem: 'theus' });
    assert.equal(usos(), antes + 1, 'a mesma pessoa na mesma hora conta uma vez');
    assert.equal(T.ac.usar(id, 'rita'), true);
    assert.equal(T.ac.usar(id, 'theus', Date.now() + 3600000), true, 'uma hora depois conta de novo');
    assert.equal(usos(), antes + 3);
    const r = T.ac.buscar('clinica proposta curta', { contar: false }).find((x) => x.id === id);
    assert.ok(/Aprendizado · Davi · .+ · usado \d+×/.test(r.rotulo), r.rotulo);
  });

  it('resultado de agente (Stop do claude, Agentes de verdade) entra como histórico de terminal, sem o que foi digitado; e o agente nasce sabendo', () => {
    const escrito = [];
    const terminais = { aoFechar() {}, existe: () => true, parado: () => true, info: () => ({ nome: 'Aurora' }), shell: () => ({ cmd: '/bin/zsh' }), escrever: (id, s) => escrito.push(s), pausada: () => false };
    const A = new Agentes({ cfg: () => ({ id: 'theus', nome: 'Theus', raiz: T.raiz, pasta: T.pasta }), terminais, porta: () => 5219, paraLocais: () => 1, publicar: () => {},
      saber: () => T.ac.resumoParaAgente(20), aoResultado: (r) => { if (!r.pausado) T.ac.terminal(Object.assign({ autor: 'theus', dono: 'theus' }, r)); } });
    try {
      A.iniciar({}, { id: 's1', nome: 'Aurora' });
      assert.ok(escrito.join('').includes('Já li 2 coisas que a equipe aprendeu'), 'o prompt leva o que a equipe aprendeu');
      assert.ok(escrito.join('').includes('coop_buscar'));
      const a = A.sessoes.get('s1');
      A.tratar(a, 'UserPromptSubmit', { prompt: 'minha senha é hunter2-DIGITADO, faça a proposta' });
      A.tratar(a, 'Stop', { last_assistant_message: 'Pronto: a proposta da clínica Sorriso ficou em propostas/sorriso.md, com preço fechado.' });
    } finally { A.parar(); }
    const r = T.ac.buscar('proposta sorriso preço fechado', { modo: 'palavras' }).find((x) => x.tipo === 'terminal');
    assert.ok(r, 'o resultado do agente é achado');
    assert.match(r.titulo, /^Resultado · Aurora · /);
    assert.match(r.cartao, /^res-\d{3}$/);
    assert.equal(T.ac.buscar('hunter2', { modo: 'palavras' }).length, 0, 'o que foi digitado não entra');
    const cru = fs.readFileSync(path.join(T.raiz, '.coop/historico/terminal.jsonl'), 'utf8');
    assert.ok(cru.includes('proposta da clínica Sorriso') && !cru.includes('hunter2'), 'o histórico cru guarda só a saída');
  });

  it('exportar o dia em JSONL (eventos, aprendizados, ideias, históricos de terminal) e reconstruir do zero dá o mesmo', () => {
    const hoje = new Date(); const dia = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' + String(hoje.getDate()).padStart(2, '0');
    const x = T.ac.exportar(dia);
    const linhas = x.jsonl.trim().split('\n').map(JSON.parse);
    const tipos = new Set(linhas.map((l) => l.registro));
    for (const t of ['evento', 'aprendizado', 'ideia', 'terminal', 'fundido']) assert.ok(tipos.has(t), 'faltou ' + t + ' em ' + Array.from(tipos));
    assert.equal(x.linhas, linhas.length);
    assert.equal(T.ac.exportar('2001-01-01').linhas, 0);
    const antes = T.ac.estatisticas();
    const r = T.ac.reconstruir();
    const depois = T.ac.estatisticas();
    for (const k of ['itens', 'cartoes', 'fundidos', 'confirmacoes', 'usos']) assert.equal(depois[k], antes[k], k + ' mudou ao reconstruir (' + JSON.stringify(r) + ')');
    assert.deepEqual(depois.porTipo, antes.porTipo);
  });
});

/* ------------------------------------------------------------------ (b) ponta a ponta pelo MCP */
describe('acervo · pelo conector coop (JSON-RPC por HTTP)', () => {
  let M, srv, porta = 5212;
  before(() => new Promise((ok) => {
    M = montar();
    M.anexar('davi', 'aprendizado', ['Reembolso de convênio: sempre anexar a nota fiscal digitalizada', 'demanda d-1']);
    const mcp = criar({ cfg: { id: 'theus', pasta: M.pasta }, acervo: () => M.ac, pedirUi: () => 0 });
    srv = http.createServer((req, res) => mcp.tratar(req, res, 's1', { id: 'ag-rita', nome: 'Rita', dono: 'theus' }));
    srv.listen(porta, '127.0.0.1', ok);
  }));
  after(() => new Promise((ok) => { srv.closeAllConnections(); srv.close(ok); }));
  let seq = 0;
  const chamar = (name, args) => pedirHttp({ porta, metodo: 'POST', caminho: '/mcp/s1', corpo: { jsonrpc: '2.0', id: ++seq, method: 'tools/call', params: { name, arguments: args } }, headers: { 'MCP-Protocol-Version': '2025-06-18' } })
    .then((r) => { assert.equal(r.status, 200, r.texto); return r.json.result; });

  it('tools/list tem coop_buscar, coop_ler, coop_aprendi e coop_aprendizados', async () => {
    const r = await pedirHttp({ porta, metodo: 'POST', caminho: '/mcp/s1', corpo: { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} } });
    const nomes = r.json.result.tools.map((f) => f.name);
    for (const n of ['coop_buscar', 'coop_ler', 'coop_aprendi', 'coop_aprendizados']) assert.ok(nomes.includes(n), n);
  });

  it('coop_aprendi duas vezes com o mesmo texto: "novo" e depois "+1 confirmado"; coop_buscar devolve com autor e usos', async () => {
    const t = 'Cliente de academia fecha mais rápido com teste grátis de sete dias';
    const a = await chamar('coop_aprendi', { texto: t });
    assert.ok(!a.isError && a.content[0].text.startsWith('novo'), a.content[0].text);
    const b = await chamar('coop_aprendi', { texto: t });
    assert.ok(b.content[0].text.startsWith('+1 confirmado'), b.content[0].text);
    assert.equal(b.structuredContent.confirmacoes, 1);
    const c = await chamar('coop_buscar', { termo: 'reembolso convenio' });
    assert.ok(!c.isError, c.content[0].text);
    assert.match(c.content[0].text, /Aprendizado · Davi · .+ · usado 1×/, c.content[0].text);
    const achado = c.structuredContent.resultados[0];
    assert.equal(achado.autor, 'Davi'); assert.equal(achado.usos, 1, 'Theus (dono do agente) usou o que Davi ensinou');
    const l = await chamar('coop_ler', { id: achado.cartao });
    assert.ok(l.content[0].text.includes('anexar a nota fiscal'), l.content[0].text);
    const z = await chamar('coop_ler', { id: 'nao-existe' });
    assert.equal(z.isError, true);
    const top = await chamar('coop_aprendizados', {});
    assert.ok(top.content[0].text.includes('anexar a nota fiscal') && top.content[0].text.includes('teste grátis'), top.content[0].text);
    const curto = await chamar('coop_aprendi', { texto: 'oi' });
    assert.equal(curto.isError, true);
  });
});

/* ------------------------------------------------------------------ (c) Estações de verdade */
describe('acervo · rotas locais e busca federada com 2 Estações', { timeout: 90000 }, () => {
  const UDP = 41710;
  const T = new Estacao({ nome: 'theus-ac', porta: 5210, descoberta: UDP });
  const Z = new Estacao({ nome: 'zeca-ac', porta: 5211, descoberta: UDP });
  const ate = async (fn, ms = 15000, oque = 'condição') => { const fim = Date.now() + ms; let ultimo; while (Date.now() < fim) { ultimo = await fn(); if (ultimo) return ultimo; await esperar(200); } throw new Error('tempo esgotado: ' + oque); };
  before(async () => { await Promise.all([T.subir(), Z.subir()]); });
  after(async () => { await Promise.all([T, Z].map((e) => e.parar().catch(() => {}))); });

  it('as rotas do acervo recusam quem não é o navegador desta máquina', async () => {
    const mal = { Origin: 'http://evil.example' };
    assert.equal((await T.api('GET', '/api/acervo/buscar?q=x', null, { headers: mal })).status, 403);
    assert.equal((await T.api('POST', '/api/acervo/aprendi', { texto: 'invasor tentando registrar aprendizado' }, { headers: mal })).status, 403);
    assert.equal((await T.api('GET', '/api/acervo/exportar', null, { headers: mal })).status, 403);
    const ip = ipDaRede();
    if (ip) assert.equal((await pedirHttp({ porta: 5210, host: ip, caminho: '/api/acervo/estatisticas', headers: { Host: ip + ':5210' } })).status, 403, 'de outro aparelho da rede');
    assert.equal((await T.api('GET', '/api/acervo/estatisticas')).status, 200);
  });

  it('POST /api/acervo/aprendi vai para o diário; repetido = +1 confirmado; item, exportar e estatísticas respondem', async () => {
    const t = 'Prazo de entrega sempre em dias úteis, nunca corridos';
    const a = await T.api('POST', '/api/acervo/aprendi', { texto: t, origem: 'teste' });
    assert.equal(a.status, 200); assert.equal(a.json.novo, true);
    const b = await T.api('POST', '/api/acervo/aprendi', { texto: t });
    assert.equal(b.json.novo, false); assert.equal(b.json.confirmacoes, 1);
    const diario = (await T.api('GET', '/api/diario')).json;
    assert.equal(diario.filter((e) => e.acao === 'aprendizado').length, 2, 'histórico cru: os dois ficam no diário');
    const it = await T.api('GET', '/api/acervo/item?id=' + encodeURIComponent(a.json.item));
    assert.equal(it.status, 200); assert.equal(it.json.texto, t);
    const ex = await T.api('GET', '/api/acervo/exportar');
    assert.equal(ex.status, 200);
    assert.ok(ex.texto.trim().split('\n').map(JSON.parse).some((l) => l.registro === 'aprendizado'));
    const st = (await T.api('GET', '/api/acervo/estatisticas')).json;
    assert.ok(st.itens >= 2 && st.fundidos === 1, JSON.stringify(st));
  });

  it('busca federada: acha na Estação do Zeca; o Zeca desliga e vira ficha "computador desligado"', async () => {
    assert.equal((await T.api('POST', '/api/fundar', { nome: 'Theus' })).status, 200);
    const tz = (await T.api('POST', '/api/convite', { nome: 'Zeca' })).json.token;
    assert.equal((await Z.api('POST', '/api/token', { token: tz })).status, 200);
    await T.esperarPar('zeca'); await Z.esperarPar('theus');
    assert.equal((await Z.api('PUT', '/api/arquivo?caminho=' + encodeURIComponent('vendas/tatuzinho.md'), { conteudo: '# Tatuzinho\nO cliente tatuzinho quer orçamento de parafusos inox.' })).status, 200);
    assert.equal((await T.api('PUT', '/api/arquivo?caminho=' + encodeURIComponent('notas/tatuzinho.md'), { conteudo: 'Ligar para o tatuzinho na sexta.' })).status, 200);
    const r = await ate(async () => { const x = (await T.api('GET', '/api/acervo/buscar?q=tatuzinho&modo=palavras')).json; return x.resultados.some((i) => i.dono === 'zeca') && x.resultados.some((i) => i.dono === 'theus') ? x : null; }, 15000, 'achados das duas Estações');
    const doZeca = r.resultados.find((i) => i.dono === 'zeca');
    assert.equal(doZeca.remoto, true); assert.equal(doZeca.donoNome, 'Zeca'); assert.ok(doZeca.trecho.includes('parafusos'));
    assert.deepEqual(r.fichas, []);
    await Z.parar();
    const f = await ate(async () => { const x = (await T.api('GET', '/api/acervo/buscar?q=tatuzinho')).json; return x.fichas.length ? x : null; }, 20000, 'a ficha do Zeca');
    assert.equal(f.fichas[0].dono, 'zeca'); assert.equal(f.fichas[0].desligado, true); assert.match(f.fichas[0].texto, /computador de Zeca (desligado|não respondeu)/);
    assert.ok(f.resultados.every((i) => i.dono === 'theus'), 'o que é local continua');
  });
});

/* ------------------------------------------------------------------ aprendizado errado: corrige sem apagar */
describe('acervo · corrigir um aprendizado errado', () => {
  it('coop_aprendi com corrige: o errado sai de APRENDIZADOS.md, da lista e da fusão; continua guardado; o evento leva o cartão', () => {
    const T = montar();
    const errado = T.ac.aprendi('Para ver um HTML local, sirva a pasta com python3 -m http.server e cole o endereço na barra', 'theus', 'agente Assistente');
    assert.equal(errado.novo, true);
    const certo = T.ac.aprendi('Para ver um HTML local, abra o caminho do arquivo da pasta compartilhada com navegador_abrir; fora dela, copie para a pasta antes', 'theus', 'agente Assistente', errado.cartao);
    assert.equal(certo.novo, true, 'o certo nasce como cartão novo');
    assert.equal(certo.corrigiu, errado.item);
    assert.deepEqual(T.eventos.filter((e) => e.acao === 'aprendizado').pop().args.slice(3), [errado.cartao], 'a equipe recebe a correção pelo diário');
    const lista = T.ac.aprendizados(50).map((a) => a.texto);
    assert.ok(lista.some((t) => /navegador_abrir/.test(t)) && !lista.some((t) => /python3/.test(t)), JSON.stringify(lista));
    T.ac.gerarArquivos();
    const ap = fs.readFileSync(path.join(T.pasta, 'APRENDIZADOS.md'), 'utf8');
    assert.ok(!ap.includes('python3') && ap.includes('navegador_abrir'), ap);
    assert.ok(T.ac.db.prepare('SELECT id FROM itens WHERE id = ?').get(errado.item), 'o errado continua guardado (corrigir, nunca apagar)');
    const repetido = T.ac.aprendi('Para ver um HTML local, sirva a pasta com python3 -m http.server e cole o endereço na barra', 'rita', 'teste');
    assert.equal(repetido.novo, true, 'o errado não recebe +1 confirmado: saiu da fusão');
  });
});
