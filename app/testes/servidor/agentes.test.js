/* Babel Coop · agentes (PROTOCOLO §7): o `claude` no pty, observado por ganchos http, com o conector coop em /mcp
   (a) unidades: citação da linha de comando no zsh de verdade, plano, limpeza do que vem de par.
   (b) ganchos sintéticos contra Estações de verdade (sem modelo, sempre roda): Theus (gestão) com um agente "falso"
       (BABEL_COOP_CLAUDE=/usr/bin/true: o comando é digitado no pty, os arquivos nascem, o segredo vale) e Rita assistindo
       de outra Estação. Prova segredo, loopback, cada gancho → mensagens agente-*, permissão segurada (permitir, negar,
       sem resposta), pausa (nada para Rita, nem depois), /mcp com o segredo, campo ❯ e limpeza ao fechar.
   (c) Claude Code de verdade (só com BABEL_TESTE_CLAUDE=1; custa 3 pedidos ao modelo barato): Estação com
       BABEL_COOP_MODELO=haiku, o claude roda no pty, a pasta nova pede confiança (respondida pelo pty) e 3 pedidos:
       arquivo com plano, comando que pede permissão (OK pela tela) e a ferramenta coop_pessoas. Evidência em
       BABEL_TESTE_EVIDENCIAS=<pasta> (claude-real.json).
   Portas só deste arquivo: HTTP 4910–4919, UDP 41410–41419.
   Rodar: cd app && node --test testes/servidor/agentes.test.js   ·   real: BABEL_TESTE_CLAUDE=1 node --test testes/servidor/agentes.test.js
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { Estacao, pedirHttp, ipDaRede, esperar } = require('./estacoes');
const ag = require('../../servidor/agentes');
const { Terminal: Tela } = require('@xterm/headless');

const gancho = (e, sessao, segredo, corpo, extra = {}) => pedirHttp(Object.assign({ porta: e.porta, metodo: 'POST', caminho: '/api/gancho/' + sessao, corpo, headers: segredo ? { 'X-Coop-Segredo': segredo } : {} }, extra));
const mcp = (e, sessao, segredo, corpo, extra = {}) => pedirHttp(Object.assign({ porta: e.porta, metodo: 'POST', caminho: '/mcp/' + sessao, corpo, headers: Object.assign({ Accept: 'application/json, text/event-stream' }, segredo ? { 'X-Coop-Segredo': segredo } : {}) }, extra));
const lerJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
/* o texto como uma tela de `cols` colunas mostra, emendado (o zsh quebra a linha longa na margem com CR LF próprios):
   cada linha com as `cols` colunas inteiras, então o que atravessa a margem volta a ficar junto */
function textoDaTela(dados, cols) {
  const t = new Tela({ cols, rows: 50, scrollback: 2000, allowProposedApi: true });
  return new Promise((ok) => t.write(dados, () => {
    const b = t.buffer.active, linhas = [];
    for (let i = 0; i < b.length; i++) { const l = b.getLine(i); if (l) linhas.push(l.translateToString(false)); }
    t.dispose();
    ok(linhas.join(''));
  }));
}
const modo = (f) => (fs.statSync(f).mode & 0o777).toString(8);

/* ------------------------------------------------------------------ (a) unidades */
describe('agentes · unidades', () => {
  it('a linha de comando chega intacta ao programa pelo zsh (aspas, $, crase, !, acentos)', () => {
    const dificeis = ["aspas 'simples' e 'outra'", 'duplas "x" e \\ barra', '$HOME `date` $(date) !! !bang', 'ç ã é · 🚀', "fim'"];
    const codigo = 'console.log(JSON.stringify(process.argv.slice(1)))';
    const linha = ag.linhaDeComando({ shell: '/bin/zsh', claude: process.execPath, args: ['-e', codigo].concat(dificeis) });
    assert.match(linha, /^ CLAUDE_CODE_ENABLE_TODO_TOOLS=1 CLAUDE_CODE_ENABLE_TASKS=0 '/);
    const saida = execFileSync('/bin/zsh', ['-f', '-i', '-c', linha], { encoding: 'utf8', env: Object.assign({}, process.env, { ZDOTDIR: '/nonexistent' }) });
    assert.deepEqual(JSON.parse(saida.trim().split('\n').pop()), dificeis);
  });

  it('argumentos: --settings, --mcp-config, --no-chrome, -n, --append-system-prompt, --allowedTools do coop e o modelo só quando pedido', () => {
    const a = ag.argumentos({ ganchos: '/x/coop-ganchos.json', mcp: '/x/coop-mcp.json', nome: 'Aurora', prompt: 'p', modelo: 'haiku', permissao: 'manual', estrito: true });
    assert.deepEqual(a, ['--settings', '/x/coop-ganchos.json', '--mcp-config', '/x/coop-mcp.json', '--no-chrome', '-n', 'Aurora', '--append-system-prompt', 'p', '--allowedTools', 'mcp__coop', 'mcp__coop__*', '--model', 'haiku', '--permission-mode', 'manual', '--strict-mcp-config']);
    assert.ok(!ag.argumentos({ ganchos: 'g', mcp: 'm', nome: 'n', prompt: 'p' }).includes('--model'));
    const ps = ag.linhaDeComando({ shell: 'powershell.exe', claude: 'claude', args: ["it's"] });
    assert.equal(ps, "$env:CLAUDE_CODE_ENABLE_TODO_TOOLS='1'; $env:CLAUDE_CODE_ENABLE_TASKS='0'; & 'claude' 'it''s'");
  });

  it('o prompt do agente leva nome, dono, instruções e as regras do babel-coop numa linha só', () => {
    const p = ag.textoDoPrompt({ nome: 'Aurora', dono: 'Theus', donoId: 'theus', instrucoes: 'cuida\ndo site', pasta: '/p' });
    assert.ok(!/[\r\n]/.test(p));
    for (const s of ['Aurora', 'Theus', 'cuida do site', 'use as ferramentas coop para mexer no app e no navegador do babel-coop; nunca abra o Google Chrome; senhas só a pessoa digita']) assert.ok(p.toLowerCase().includes(s.toLowerCase()), s);
  });

  it('plano: TodoWrite vira itens e concluidosAgora só conta o que virou feito agora', () => {
    const antes = ag.itensTodo([{ content: 'A', status: 'completed' }, { content: 'B', status: 'in_progress' }, { content: 'C', status: 'pending' }]);
    assert.deepEqual(antes.map((i) => i.estado), ['feito', 'andamento', 'pendente']);
    const depois = ag.itensTodo([{ content: 'A', status: 'completed' }, { content: 'B', status: 'completed' }, { content: 'C', status: 'completed' }]);
    assert.deepEqual(ag.concluidosAgora(antes, depois), [1, 2]);
    assert.deepEqual(ag.concluidosAgora(depois, depois), []);
  });

  it('ferramentas: nome curto, consulta x ação, resumo', () => {
    assert.equal(ag.nomeCurto('mcp__coop__coop_aviso'), 'coop_aviso');
    assert.equal(ag.nomeCurto('mcp__claude_ai_Supabase__execute_sql'), 'claude_ai_Supabase · execute_sql');
    assert.ok(ag.ehConsulta('Read') && ag.ehConsulta('mcp__coop__coop_pessoas') && ag.ehConsulta('mcp__coop__navegador_ler'));
    assert.ok(!ag.ehConsulta('Write') && !ag.ehConsulta('mcp__coop__coop_aviso') && !ag.ehConsulta('Bash'));
    assert.equal(ag.resumoDe('Bash', { command: 'node -e 1' }, (c) => c), 'node -e 1');
    assert.equal(ag.resumoDe('Write', { file_path: '/p/ola.md' }, () => 'ola.md'), 'escrever ola.md');
  });

  it('o que vem de par: só campos conhecidos, caminho absoluto ou com .. recusado, dono reescrito', () => {
    assert.equal(ag.limparDePar({ tipo: 'agente-arquivo', id: 's1', caminho: '/etc/passwd', acao: 'criado' }, 'rita'), null);
    assert.equal(ag.limparDePar({ tipo: 'agente-arquivo', id: 's1', caminho: '../fora.md', acao: 'criado' }, 'rita'), null);
    assert.deepEqual(ag.limparDePar({ tipo: 'agente-arquivo', id: 's1', caminho: 'docs/ola.md', acao: 'criado', absoluto: '/Users/x/ola.md', dono: 'forjado' }, 'rita'), { tipo: 'agente-arquivo', dono: 'rita', id: 's1', caminho: 'docs/ola.md', acao: 'criado' });
    assert.equal(ag.limparDePar({ tipo: 'agente-estado', id: 's1', estado: 'hackeado' }, 'rita'), null);
    assert.equal(ag.limparDePar({ tipo: 'agente-espera', id: 's1', pid: 'p-1' }, 'rita'), null, 'pedido de permissão nunca vem de fora');
    const b = ag.limparDePar({ tipo: 'agente-bloco', id: 's1', bloco: { bid: 's1-1', tipo: 'acao', titulo: 'x'.repeat(500), texto: 't', comando: 'ls', html: '<script>', prova: { saida: 'ok' } } }, 'rita');
    assert.equal(b.bloco.titulo.length, 200);
    assert.equal(b.bloco.html, undefined);
    assert.deepEqual(b.bloco.prova, { saida: 'ok' });
  });

  it('segredo comparado em tempo constante e nunca vazio', () => {
    assert.ok(ag.mesmoSegredo('abc', 'abc'));
    assert.ok(!ag.mesmoSegredo('abc', 'abd') && !ag.mesmoSegredo('', '') && !ag.mesmoSegredo(undefined, 'a') && !ag.mesmoSegredo('abc', 'abcd'));
  });
});

/* ------------------------------------------------------------------ (b) ganchos sintéticos, Estações de verdade */
const UDP = 41411;
const T = new Estacao({ nome: 'theus-ag', porta: 4911, descoberta: UDP, ambiente: { BABEL_COOP_CLAUDE: '/usr/bin/true', BABEL_COOP_PERMISSAO_MS: '1500', BABEL_COOP_MODELO: 'haiku' } });
const R = new Estacao({ nome: 'rita-ag', porta: 4912, descoberta: UDP });

describe('agentes · ganchos sintéticos (sem modelo)', { timeout: 120000 }, () => {
  let nt, nr, segredo, pasta, cfgT;
  const MARCA = 'MARCA' + crypto.randomBytes(5).toString('hex').toUpperCase();

  before(async () => {
    await Promise.all([T.subir(), R.subir()]);
    const f = await T.api('POST', '/api/fundar', { nome: 'Theus' });
    assert.equal(f.status, 200, f.texto);
    const c = await T.api('POST', '/api/convite', { nome: 'Rita', papel: 'membro' });
    assert.equal((await R.api('POST', '/api/token', { token: c.json.token })).status, 200);
    await T.esperarPar('rita'); await R.esperarPar('theus');
    nt = await T.navegador();
    nr = await R.navegador();
    cfgT = await T.eu();
    pasta = cfgT.pasta;
  });
  after(async () => { await Promise.all([T.parar(), R.parar()]); });

  it('agente-iniciar: recusa sem terminal; com o shell parado digita o comando, cria os 3 arquivos em modo 600 e avisa', async () => {
    let n0 = nt.msgs.length;
    nt.enviar({ tipo: 'agente-iniciar', id: 's1', nome: 'Aurora' });
    const erro = await nt.esperar((m) => m.tipo === 'erro' && m.contexto === 'agente-iniciar', { desde: n0 });
    assert.match(erro.erro, /abra o terminal/);

    nt.enviar({ tipo: 'term-abrir', id: 's1', nome: 'Aurora', cols: 100, rows: 30 });
    await nt.esperar((m) => m.tipo === 'term-aberto' && m.info.id === 's1');
    await nt.esperarSaida('theus', 's1', (s) => / % $|% \u001b\[K|%\s*$/.test(s), { oque: 'prompt do zsh' });
    n0 = nt.msgs.length;
    nt.enviar({ tipo: 'agente-iniciar', id: 's1', nome: 'Aurora', instrucoes: "cuida do site 'babel' e do $HOME" });
    const ini = await nt.esperar((m) => m.tipo === 'agente-iniciado' && m.id === 's1', { desde: n0 });
    assert.deepEqual([ini.dono, ini.nome, ini.modelo], ['theus', 'Aurora', 'haiku']);
    const dir = path.join(T.raiz, '.coop', 'agentes', 's1');
    const arquivos = fs.readdirSync(dir).sort();
    assert.deepEqual(arquivos, ['coop-gancho.js', 'coop-ganchos.json', 'coop-mcp.json']);
    assert.ok(arquivos.every((f) => !/^settings.*\.json$/.test(f) && f !== '.mcp.json'));
    arquivos.forEach((f) => assert.equal(modo(path.join(dir, f)), '600', f + ' em modo 600'));
    assert.equal(modo(dir), '700');
    const g = lerJson(path.join(dir, 'coop-ganchos.json'));
    const eventos = Object.keys(g.hooks).sort();
    assert.deepEqual(eventos, ['Notification', 'PermissionRequest', 'PostToolUse', 'PostToolUseFailure', 'PreToolUse', 'SessionStart', 'Stop', 'StopFailure', 'SubagentStop', 'UserPromptSubmit']);
    const h = g.hooks.PreToolUse[0].hooks[0];
    assert.equal(h.type, 'http');
    assert.equal(h.url, 'http://127.0.0.1:4911/api/gancho/s1');
    segredo = h.headers['X-Coop-Segredo'];
    assert.match(segredo, /^[0-9a-f]{48}$/);
    assert.notEqual(segredo, lerJson(path.join(T.raiz, 'coop.json')).segredo, 'nunca o segredo da equipe');
    assert.equal(g.hooks.PermissionRequest[0].hooks[0].timeout, 600);
    const ss = g.hooks.SessionStart[0].hooks[0];
    assert.deepEqual([ss.type, ss.command, ss.args[0]], ['command', process.execPath, path.join(dir, 'coop-gancho.js')], 'SessionStart não aceita http: node + script, forma exec');
    const m = lerJson(path.join(dir, 'coop-mcp.json'));
    assert.deepEqual(m, { mcpServers: { coop: { type: 'http', url: 'http://127.0.0.1:4911/mcp/s1', headers: { 'X-Coop-Segredo': segredo } } } });
    /* o eco do zsh, lido como a tela mostra (linhas quebradas na margem juntadas), tem o comando inteiro */
    await esperar(800);
    const tela = await textoDaTela(nt.saida('theus', 's1'), 100);
    for (const s of ["'--settings'", "'--mcp-config'", "'--no-chrome'", "'-n' 'Aurora'", "'--append-system-prompt'", "'--model' 'haiku'", 'CLAUDE_CODE_ENABLE_TASKS=0', "'\\''babel'\\''"]) assert.ok(tela.includes(s), 'o comando no pty tem ' + s + '\n' + tela.slice(-1500));
    /* campo ❯ com o shell na frente: recusado (não digita texto solto no zsh) */
    n0 = nt.msgs.length;
    nt.enviar({ tipo: 'agente-pedido', id: 's1', texto: 'olá' });
    assert.match((await nt.esperar((x) => x.tipo === 'erro' && x.contexto === 'agente-pedido', { desde: n0 })).erro, /nenhum agente rodando/);
    /* daqui em diante um `cat` fica na frente, no lugar do claude (o agente "falso" já saiu: /usr/bin/true) */
    nt.enviar({ tipo: 'term-entrada', id: 's1', dados: 'cat\r' });
    await esperar(600);
    assert.ok(!tela.includes(segredo), 'o segredo nunca aparece no terminal');
    n0 = nt.msgs.length;
    nt.enviar({ tipo: 'agente-iniciar', id: 's1', nome: 'Outra' });
    assert.match((await nt.esperar((x) => x.tipo === 'erro' && x.contexto === 'agente-iniciar', { desde: n0 })).erro, /já tem um agente/);
  });

  it('/api/gancho: sem segredo, segredo errado, GET e de fora da máquina são recusados; o script do SessionStart funciona', async () => {
    assert.equal((await gancho(T, 's1', null, { hook_event_name: 'Stop' })).status, 403);
    assert.equal((await gancho(T, 's1', 'f'.repeat(48), { hook_event_name: 'Stop' })).status, 403);
    assert.equal((await gancho(T, 'nao-existe', segredo, { hook_event_name: 'Stop' })).status, 403);
    assert.equal((await pedirHttp({ porta: T.porta, caminho: '/api/gancho/s1', headers: { 'X-Coop-Segredo': segredo } })).status, 405);
    const ip = ipDaRede();
    if (ip) assert.equal((await gancho(T, 's1', segredo, { hook_event_name: 'Stop' }, { host: ip })).status, 403, 'de fora da máquina, mesmo com o segredo');
    /* SessionStart: o mesmo script que o claude roda, com o JSON no stdin */
    const n0 = nt.msgs.length;
    execFileSync(process.execPath, [path.join(T.raiz, '.coop', 'agentes', 's1', 'coop-gancho.js')], { input: JSON.stringify({ session_id: 'sess-1', hook_event_name: 'SessionStart', source: 'startup', model: 'claude-haiku-4-5' }) });
    const e = await nt.esperar((m) => m.tipo === 'agente-estado' && m.id === 's1', { desde: n0 });
    assert.deepEqual([e.dono, e.estado, e.modelo], ['theus', 'acordou', 'claude-haiku-4-5']);
  });

  it('um turno inteiro: pedido → plano → consulta agrupada → ação com prova → arquivo → falha → resultado; Rita assiste e recebe (sem caminho absoluto)', async (t) => {
    let r0 = nr.msgs.length;
    nr.enviar({ tipo: 'term-assistir', dono: 'theus', id: 's1' });
    const resumo = await nr.esperar((m) => m.tipo === 'agente-resumo' && m.dono === 'theus' && m.id === 's1', { desde: r0 });
    assert.equal(resumo.nome, 'Aurora');
    assert.equal(resumo.ativo, true);
    const n0 = nt.msgs.length; r0 = nr.msgs.length;
    const ola = path.join(pasta, 'ola.md');
    const seq = [
      { hook_event_name: 'UserPromptSubmit', prompt: 'Crie o arquivo ola.md' },
      { hook_event_name: 'PreToolUse', tool_name: 'TodoWrite', tool_use_id: 't1', tool_input: { todos: [{ content: 'Planejar', status: 'in_progress', activeForm: 'Planejando' }, { content: 'Escrever ola.md', status: 'pending', activeForm: 'Escrevendo' }] } },
      { hook_event_name: 'PostToolUse', tool_name: 'TodoWrite', tool_use_id: 't1', tool_input: { todos: [{ content: 'Planejar', status: 'in_progress' }, { content: 'Escrever ola.md', status: 'pending' }] }, tool_response: { oldTodos: [], newTodos: [{ content: 'Planejar', status: 'in_progress' }, { content: 'Escrever ola.md', status: 'pending' }] } },
      { hook_event_name: 'PreToolUse', tool_name: 'Read', tool_use_id: 't2', tool_input: { file_path: path.join(pasta, 'README.md') } },
      { hook_event_name: 'PostToolUse', tool_name: 'Read', tool_use_id: 't2', tool_input: { file_path: path.join(pasta, 'README.md') }, tool_response: { type: 'text' } },
      { hook_event_name: 'PreToolUse', tool_name: 'Grep', tool_use_id: 't3', tool_input: { pattern: 'babel' } },
      { hook_event_name: 'PreToolUse', tool_name: 'Write', tool_use_id: 't4', tool_input: { file_path: ola, content: 'a\nb\nc\n' } },
      { hook_event_name: 'PostToolUse', tool_name: 'Write', tool_use_id: 't4', tool_input: { file_path: ola, content: 'a\nb\nc\n' }, tool_response: { filePath: ola, type: 'create' } },
      { hook_event_name: 'PreToolUse', tool_name: 'Write', tool_use_id: 't4b', tool_input: { file_path: '/tmp/babel-fora-' + MARCA.slice(0, 4) + '.md', content: 'x' } },
      { hook_event_name: 'PostToolUse', tool_name: 'Write', tool_use_id: 't4b', tool_input: { file_path: '/tmp/babel-fora-' + MARCA.slice(0, 4) + '.md', content: 'x' }, tool_response: { filePath: '/tmp/babel-fora.md', type: 'create' } },
      { hook_event_name: 'PreToolUse', tool_name: 'TodoWrite', tool_use_id: 't5', tool_input: { todos: [{ content: 'Planejar', status: 'completed' }, { content: 'Escrever ola.md', status: 'completed' }] } },
      { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_use_id: 't6', tool_input: { command: 'wc -l ola.md', description: 'contar as linhas' } },
      { hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_use_id: 't6', tool_input: { command: 'wc -l ola.md' }, tool_response: { stdout: '3 ola.md', stderr: '', interrupted: false, isImage: false } },
      { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_use_id: 't7', tool_input: { command: 'false' } },
      { hook_event_name: 'PostToolUseFailure', tool_name: 'Bash', tool_use_id: 't7', tool_input: { command: 'false' }, error: 'Exit code 1' },
      { hook_event_name: 'Stop', last_assistant_message: 'Pronto: criei ola.md com três linhas.', stop_hook_active: false }
    ];
    const tempos = [];
    for (const corpo of seq) {
      const t0 = performance.now();
      const r = await gancho(T, 's1', segredo, Object.assign({ session_id: 'sess-1', cwd: pasta }, corpo));
      tempos.push(performance.now() - t0);
      assert.equal(r.status, 200, corpo.hook_event_name + ': ' + r.texto);
      assert.equal(r.texto, '', 'corpo vazio = sucesso sem decisão');
    }
    await nt.esperar((m) => m.tipo === 'agente-bloco' && m.bloco.tipo === 'resultado', { desde: n0 });
    const meus = nt.msgs.slice(n0).filter((m) => m.id === 's1' && /^agente-/.test(m.tipo));
    const estados = meus.filter((m) => m.tipo === 'agente-estado').map((m) => m.estado + (m.ferramenta ? ':' + m.ferramenta : ''));
    assert.deepEqual(estados, ['pensando', 'rodando:TodoWrite', 'pensando', 'rodando:Read', 'pensando', 'rodando:Grep', 'rodando:Write', 'pensando', 'rodando:Write', 'pensando', 'rodando:TodoWrite', 'rodando:Bash', 'pensando', 'rodando:Bash', 'pensando', 'terminou']);
    const blocos = new Map();
    meus.filter((m) => m.tipo === 'agente-bloco').forEach((m) => blocos.set(m.bloco.bid, m.bloco));
    const tipos = Array.from(blocos.values()).map((b) => b.tipo);
    assert.deepEqual(tipos, ['pedido', 'plano', 'consulta', 'acao', 'acao', 'acao', 'acao', 'falha', 'resultado']);
    const b = Array.from(blocos.values());
    assert.equal(b[0].texto, 'Crie o arquivo ola.md');
    assert.equal(b[1].texto, '2 de 2 feitos', 'o bloco do plano é o mesmo bid, atualizado');
    assert.equal(b[2].texto, 'README.md · "babel"', 'consultas seguidas viram um bloco: consultei a · b');
    assert.deepEqual([b[3].titulo, b[3].estado, b[3].prova], ['criei ola.md', 'feito', { arquivo: 'ola.md', acao: 'criado' }]);
    assert.deepEqual([b[5].comando, b[5].estado, b[5].prova.saida], ['wc -l ola.md', 'feito', '3 ola.md']);
    assert.deepEqual([b[6].comando, b[6].estado], ['false', 'falhou']);
    assert.deepEqual([b[7].titulo, b[7].texto], ['falhou: Bash', 'Exit code 1']);
    assert.equal(b[8].texto, 'Pronto: criei ola.md com três linhas.');
    assert.deepEqual(b[8].prova.arquivos.find((a) => a.caminho === 'ola.md'), { caminho: 'ola.md', acao: 'criado' });
    assert.equal(b[8].prova.comandos.length, 2);
    const planos = meus.filter((m) => m.tipo === 'agente-plano');
    assert.equal(planos.length, 2, 'TodoWrite repetido igual não repete a mensagem');
    assert.deepEqual(planos[1].itens, [{ texto: 'Planejar', estado: 'feito' }, { texto: 'Escrever ola.md', estado: 'feito' }]);
    assert.deepEqual(planos[1].concluidosAgora, [0, 1]);
    const arquivos = meus.filter((m) => m.tipo === 'agente-arquivo');
    assert.deepEqual(arquivos.map((a) => [a.caminho, a.acao, a.dentro]), [['ola.md', 'criado', true], ['/tmp/babel-fora-' + MARCA.slice(0, 4) + '.md', 'criado', false]]);
    assert.equal(arquivos[0].absoluto, ola);
    /* Rita (outra Estação, assistindo) recebe o mesmo com dono = theus, sem absoluto e sem o arquivo de fora da pasta */
    await nr.esperar((m) => m.tipo === 'agente-bloco' && m.dono === 'theus' && m.bloco.tipo === 'resultado', { desde: r0 });
    const dela = nr.msgs.slice(r0).filter((m) => /^agente-/.test(m.tipo));
    assert.ok(dela.every((m) => m.dono === 'theus'));
    const arqDela = dela.filter((m) => m.tipo === 'agente-arquivo');
    assert.deepEqual(arqDela.map((a) => Object.keys(a).sort().join(',')), ['acao,caminho,chegou,dono,id,nome,tipo']);
    assert.ok(dela.every((m) => m.nome === 'Aurora'), 'o nome do agente vai em todas as agente-*');
    assert.equal(dela.filter((m) => m.tipo === 'agente-bloco' && m.bloco.tipo === 'resultado').length, 1);
    assert.equal(dela.filter((m) => m.tipo === 'agente-espera').length, 0);
    tempos.sort((x, y) => x - y);
    const p95 = tempos[Math.ceil(tempos.length * 0.95) - 1];
    assert.ok(p95 < 100, 'resposta do gancho p95 ' + p95.toFixed(1) + ' ms');
    t.diagnostic('gancho → resposta: mediana ' + tempos[Math.floor(tempos.length / 2)].toFixed(1) + ' ms · p95 ' + p95.toFixed(1) + ' ms (' + tempos.length + ' ganchos)');
  });

  it('permissão: segura a resposta até a tela decidir (permitir, negar); sem decisão, solta vazio e o Claude pergunta no terminal', async (t) => {
    const pedir = (cmd) => gancho(T, 's1', segredo, { hook_event_name: 'PermissionRequest', session_id: 'sess-1', tool_name: 'Bash', tool_input: { command: cmd }, permission_suggestions: [] });
    /* permitir */
    let n0 = nt.msgs.length, r0 = nr.msgs.length;
    const t0 = performance.now();
    const p1 = pedir('node -e "console.log(6*7)"');
    const esp = await nt.esperar((m) => m.tipo === 'agente-espera' && m.id === 's1', { desde: n0 });
    assert.match(esp.pid, /^p-[0-9a-f]{12}$/);
    assert.deepEqual([esp.dono, esp.ferramenta, esp.comando], ['theus', 'Bash', 'node -e "console.log(6*7)"']);
    await esperar(300);
    let resolvido = false; p1.then(() => { resolvido = true; });
    await esperar(50);
    assert.equal(resolvido, false, 'a resposta HTTP fica segurada enquanto a pessoa decide');
    nt.enviar({ tipo: 'agente-ok', id: 's1', pid: esp.pid, decisao: 'permitir' });
    const r1 = await p1;
    const ms = performance.now() - t0;
    assert.equal(r1.status, 200);
    assert.deepEqual(r1.json, { hookSpecificOutput: { hookEventName: 'PermissionRequest', decision: { behavior: 'allow' } } });
    const fim = await nt.esperar((m) => m.tipo === 'agente-espera-fim' && m.pid === esp.pid, { desde: n0 });
    assert.equal(fim.decisao, 'permitir');
    const estadosEspera = nt.msgs.slice(n0).filter((m) => m.tipo === 'agente-estado').map((m) => m.estado);
    assert.deepEqual(estadosEspera, ['espera', 'rodando']);
    const blocoEspera = nt.msgs.slice(n0).filter((m) => m.tipo === 'agente-bloco' && m.bloco.pid === esp.pid).pop().bloco;
    assert.deepEqual([blocoEspera.tipo, blocoEspera.decisao], ['espera', 'permitir']);
    assert.equal(nr.msgs.slice(r0).filter((m) => m.tipo === 'agente-espera').length, 0, 'quem assiste de fora vê o bloco, nunca o pedido de permissão');
    t.diagnostic('permissão: pedido → OK da tela → resposta ao Claude em ' + ms.toFixed(0) + ' ms (300 ms de "pessoa pensando")');
    /* negar */
    n0 = nt.msgs.length;
    const p2 = pedir('rm -rf /tmp/nada');
    const esp2 = await nt.esperar((m) => m.tipo === 'agente-espera', { desde: n0 });
    nt.enviar({ tipo: 'agente-ok', id: 's1', pid: 'p-000000000000', decisao: 'permitir' }); /* pid errado: nada */
    nt.enviar({ tipo: 'agente-ok', id: 's1', pid: esp2.pid, decisao: 'talvez' });        /* decisão inválida: nada */
    await esperar(100);
    nt.enviar({ tipo: 'agente-ok', id: 's1', pid: esp2.pid, decisao: 'negar' });
    const r2 = await p2;
    assert.deepEqual(r2.json.hookSpecificOutput.decision.behavior, 'deny');
    assert.match(r2.json.hookSpecificOutput.decision.message, /negou/);
    assert.equal((await nt.esperar((m) => m.tipo === 'agente-espera-fim' && m.pid === esp2.pid, { desde: n0 })).decisao, 'negar');
    /* sem resposta (BABEL_COOP_PERMISSAO_MS=1500 nesta Estação; 590 s no app) */
    n0 = nt.msgs.length;
    const t3 = performance.now();
    const r3 = await pedir('ls');
    assert.equal(r3.status, 200);
    assert.equal(r3.texto, '', 'corpo vazio: o Claude segue e pergunta no terminal');
    assert.ok(performance.now() - t3 >= 1400);
    const esp3 = await nt.esperar((m) => m.tipo === 'agente-espera', { desde: n0 });
    const fim3 = await nt.esperar((m) => m.tipo === 'agente-espera-fim' && m.pid === esp3.pid, { desde: n0 });
    assert.equal(fim3.decisao, null);
    assert.match(fim3.motivo, /sem resposta/);
    /* o cliente desiste (a pessoa respondeu no terminal): a tela é avisada */
    n0 = nt.msgs.length;
    const http = require('http');
    const req = http.request({ host: '127.0.0.1', port: T.porta, method: 'POST', path: '/api/gancho/s1', headers: { 'Content-Type': 'application/json', 'X-Coop-Segredo': segredo } });
    req.on('error', () => {});
    req.end(JSON.stringify({ hook_event_name: 'PermissionRequest', tool_name: 'Bash', tool_input: { command: 'pwd' } }));
    await nt.esperar((m) => m.tipo === 'agente-espera', { desde: n0 });
    req.destroy();
    const fim4 = await nt.esperar((m) => m.tipo === 'agente-espera-fim', { desde: n0 });
    assert.match(fim4.motivo, /terminal/);
    /* a pessoa respondeu no diálogo do terminal (ele aparece enquanto o gancho segura) e o Claude não largou o gancho:
       o PostToolUse da mesma chamada solta o pedido da tela */
    n0 = nt.msgs.length;
    const entrada = { command: 'echo respondido-no-terminal', description: 'eco' };
    const p5 = gancho(T, 's1', segredo, { hook_event_name: 'PermissionRequest', tool_name: 'Bash', tool_input: entrada });
    const esp5 = await nt.esperar((m) => m.tipo === 'agente-espera', { desde: n0 });
    assert.equal((await gancho(T, 's1', segredo, { hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_use_id: 't9', tool_input: entrada, tool_response: { stdout: 'respondido-no-terminal', stderr: '', interrupted: false } })).status, 200);
    const r5 = await p5;
    assert.equal(r5.texto, '');
    const fim5 = await nt.esperar((m) => m.tipo === 'agente-espera-fim' && m.pid === esp5.pid, { desde: n0 });
    assert.deepEqual([fim5.decisao, fim5.motivo], [null, 'respondido no terminal']);
  });

  it('pausa: o que o agente faz durante a pausa chega à minha tela e nunca a quem assiste, nem depois (nem quando o bloco ou o plano mudam depois)', async () => {
    const n0 = nt.msgs.length, r0 = nr.msgs.length;
    const vai = async (corpo) => assert.equal((await gancho(T, 's1', segredo, corpo)).status, 200, corpo.hook_event_name);
    /* começa antes da pausa: Rita vê a ação rodando */
    await vai({ hook_event_name: 'UserPromptSubmit', prompt: 'antes da pausa' });
    await vai({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_use_id: 'tb1', tool_input: { command: 'sleep 1' } });
    await nr.esperar((m) => m.tipo === 'agente-bloco' && m.bloco.comando === 'sleep 1', { desde: r0 });
    nt.enviar({ tipo: 'term-pausar', id: 's1', sim: true });
    await nr.esperar((m) => m.tipo === 'term-pausa' && m.pausada, { desde: r0 });
    for (const corpo of [
      { hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_use_id: 'tb1', tool_input: { command: 'sleep 1' }, tool_response: { stdout: 'saída ' + MARCA, stderr: '' } },
      { hook_event_name: 'PreToolUse', tool_name: 'TodoWrite', tool_use_id: 'tt1', tool_input: { todos: [{ content: 'item ' + MARCA, status: 'in_progress' }] } },
      { hook_event_name: 'PreToolUse', tool_name: 'Read', tool_use_id: 'tr1', tool_input: { file_path: path.join(pasta, MARCA + '-lido.md') } },
      { hook_event_name: 'PreToolUse', tool_name: 'Write', tool_use_id: 'tp', tool_input: { file_path: path.join(pasta, MARCA + '.md'), content: MARCA } },
      { hook_event_name: 'PostToolUse', tool_name: 'Write', tool_use_id: 'tp', tool_input: { file_path: path.join(pasta, MARCA + '.md') }, tool_response: { type: 'create' } },
      { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_use_id: 'tb2', tool_input: { command: 'echo ' + MARCA } } /* nasce na pausa, termina depois */
    ]) await vai(corpo);
    await nt.esperar((m) => m.tipo === 'agente-bloco' && m.bloco.comando === 'echo ' + MARCA, { desde: n0 });
    await esperar(800);
    nt.enviar({ tipo: 'term-pausar', id: 's1', sim: false });
    await nr.esperar((m) => m.tipo === 'term-pausa' && !m.pausada, { desde: r0 });
    /* depois da pausa: o plano que nasceu na pausa anda, e uma consulta nova começa */
    await vai({ hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_use_id: 'tb2', tool_input: { command: 'echo ' + MARCA }, tool_response: { stdout: 'ok', stderr: '' } });
    await vai({ hook_event_name: 'Stop', last_assistant_message: 'fiz tudo' }); /* o resultado sai depois da pausa: sem o comando nem o arquivo da pausa na prova */
    await vai({ hook_event_name: 'UserPromptSubmit', prompt: 'depois da pausa' });
    await vai({ hook_event_name: 'PreToolUse', tool_name: 'TodoWrite', tool_use_id: 'tt2', tool_input: { todos: [{ content: 'item ' + MARCA, status: 'completed' }, { content: 'item depois', status: 'pending' }] } });
    await vai({ hook_event_name: 'PreToolUse', tool_name: 'Read', tool_use_id: 'tr2', tool_input: { file_path: path.join(pasta, 'depois.md') } });
    await vai({ hook_event_name: 'Stop', last_assistant_message: 'terminei depois' });
    await nr.esperar((m) => m.tipo === 'agente-bloco' && m.bloco.texto === 'terminei depois', { desde: r0 });
    const planoDela = nr.msgs.slice(r0).filter((m) => m.tipo === 'agente-plano').pop();
    assert.deepEqual(planoDela.itens, [{ texto: 'item depois', estado: 'pendente' }], 'o item nascido na pausa não aparece para quem assiste');
    const planoMeu = nt.msgs.slice(n0).filter((m) => m.tipo === 'agente-plano').pop();
    assert.equal(planoMeu.itens.length, 2, 'na minha tela o plano é inteiro');
    /* quem começa a assistir agora recebe o resumo: sem nada da pausa */
    const nr2 = await R.navegador();
    nr2.enviar({ tipo: 'term-assistir', dono: 'theus', id: 's1' });
    const resumo = await nr2.esperar((m) => m.tipo === 'agente-resumo' && m.id === 's1');
    assert.ok(resumo.blocos.some((b) => b.texto === 'depois da pausa'));
    assert.deepEqual(resumo.plano, [{ texto: 'item depois', estado: 'pendente' }]);
    await esperar(300);
    const tudoDaRita = JSON.stringify(nr.msgs.slice(r0)) + JSON.stringify(nr2.msgs);
    assert.ok(!tudoDaRita.includes(MARCA), 'o marcador da pausa vazou para quem assiste');
    const bash = nr.msgs.slice(r0).filter((m) => m.tipo === 'agente-bloco' && m.bloco.comando === 'sleep 1').pop();
    assert.equal(bash.bloco.estado, 'rodando', 'a prova que saiu na pausa nunca chega a quem assiste');
    assert.ok(JSON.stringify(nt.msgs.slice(n0)).includes(MARCA), 'a minha tela recebeu tudo');
  });

  it('/mcp/<sessao>: segredo da sessão, GET 405, de fora recusado; tools/call vai a UMA tela e volta ao Claude', async () => {
    const init = { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'teste', version: '1' } } };
    assert.equal((await mcp(T, 's1', null, init)).status, 403);
    assert.equal((await mcp(T, 's1', 'x'.repeat(48), init)).status, 403);
    assert.equal((await pedirHttp({ porta: T.porta, caminho: '/mcp/s1', headers: { 'X-Coop-Segredo': segredo } })).status, 405);
    const ip = ipDaRede();
    if (ip) assert.equal((await mcp(T, 's1', segredo, init, { host: ip })).status, 403);
    const r = await mcp(T, 's1', segredo, init);
    assert.equal(r.status, 200, r.texto);
    assert.equal(r.json.result.serverInfo.name, 'coop');
    /* a tela (este teste) responde a mcp-chamada como o coop-ui.js responderia */
    const nt2 = await T.navegador(); /* uma segunda tela local: a chamada vai só para a que chamou o agente */
    const responder = (m) => { if (m.tipo === 'mcp-chamada') nt.enviar({ tipo: 'mcp-resposta', cid: m.cid, ok: true, resultado: { texto: '3 pessoas: Theus, Rita, Zuleica', dados: { total: 3 } } }); };
    nt.ouvintes.add(responder);
    const n0 = nt.msgs.length;
    const call = await mcp(T, 's1', segredo, { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'coop_pessoas', arguments: {} } });
    nt.ouvintes.delete(responder);
    assert.equal(call.status, 200, call.texto);
    assert.equal(call.json.result.content[0].text, '3 pessoas: Theus, Rita, Zuleica');
    const chamada = nt.msgs.slice(n0).find((m) => m.tipo === 'mcp-chamada');
    assert.deepEqual([chamada.sessao, chamada.ferramenta, chamada.agente], ['s1', 'coop_pessoas', { id: 's1', nome: 'Aurora', dono: 'theus' }]);
    assert.equal(nt2.msgs.filter((m) => m.tipo === 'mcp-chamada').length, 0, 'a segunda tela não executa a mesma ação');
    nt2.fechar();
  });

  it('campo ❯ (agente-pedido): com um programa na frente escreve o texto e, separado, o Enter', async () => {
    const antes = nt.saida('theus', 's1').length;
    nt.enviar({ tipo: 'agente-pedido', id: 's1', texto: 'pedido do campo ❯' });
    const s = await nt.esperarSaida('theus', 's1', (x) => x.slice(antes).split('pedido do campo ❯').length >= 3, { oque: 'eco do cat' });
    assert.ok(s.slice(antes).split('pedido do campo ❯').length >= 3, 'o texto chegou e o Enter entregou a linha ao programa');
  });

  it('fechar o terminal encerra o agente: agente-fim, arquivos apagados e o segredo morre', async () => {
    const n0 = nt.msgs.length, r0 = nr.msgs.length;
    nt.enviar({ tipo: 'term-fechar', id: 's1' });
    const fim = await nt.esperar((m) => m.tipo === 'agente-fim' && m.id === 's1', { desde: n0 });
    assert.equal(fim.motivo, 'o terminal fechou');
    const fimDela = await nr.esperar((m) => m.tipo === 'agente-fim' && m.dono === 'theus', { desde: r0, ms: 3000 });
    assert.equal(fimDela.id, 's1', 'quem assistia fica sabendo que o agente acabou (mesmo depois do term-fim)');
    assert.ok(!fs.existsSync(path.join(T.raiz, '.coop', 'agentes', 's1')), 'a pasta da sessão sumiu');
    assert.equal((await gancho(T, 's1', segredo, { hook_event_name: 'Stop' })).status, 403);
    assert.equal((await mcp(T, 's1', segredo, { jsonrpc: '2.0', id: 9, method: 'tools/list' })).status, 403);
  });
});

/* ------------------------------------------------------------------ (c) Claude Code de verdade */
describe('agentes · Claude Code de verdade no pty (modelo barato)', { skip: process.env.BABEL_TESTE_CLAUDE ? false : 'só com BABEL_TESTE_CLAUDE=1 (custa 3 pedidos ao modelo barato)', timeout: 900000 }, () => {
  const C = new Estacao({ nome: 'claude-ag', porta: 4913, descoberta: 41413, ambiente: { BABEL_COOP_MODELO: 'haiku', BABEL_COOP_PERMISSAO: 'manual', BABEL_COOP_MCP_ESTRITO: '1' } });
  const ID = 'ag1';
  const ev = { quando: new Date().toISOString(), modelo: 'haiku', pedidos: [], telas: {}, mensagens: [], permissoes: [], mcp: [], medidas: {}, notas: [] };
  let n, tela, pasta;
  const snap = () => new Promise((ok) => tela.write('', () => {
    const b = tela.buffer.active, l = [];
    for (let i = 0; i < b.length; i++) { const x = b.getLine(i); if (x) l.push(x.translateToString(true)); }
    ok(l.filter((s) => s.trim() && !/Permission deny rule|ermission checks|only Edit\(path\)|file-editing tool/.test(s)).slice(-28).join('\n'));
  }));
  const guardar = () => { if (process.env.BABEL_TESTE_EVIDENCIAS) { fs.mkdirSync(process.env.BABEL_TESTE_EVIDENCIAS, { recursive: true }); fs.writeFileSync(path.join(process.env.BABEL_TESTE_EVIDENCIAS, 'claude-real.json'), JSON.stringify(ev, null, 2)); } };
  const doAgente = (desde) => n.msgs.slice(desde).filter((m) => m.id === ID && /^agente-|^mcp-/.test(m.tipo));

  before(async () => {
    await C.subir();
    pasta = (await C.eu()).pasta;
    n = await C.navegador();
    tela = new Tela({ cols: 120, rows: 40, allowProposedApi: true });
    n.ouvintes.add((m) => {
      if (m.tipo === 'term-saida' && m.id === ID) tela.write(m.dados);
      if (/^agente-|^mcp-/.test(m.tipo)) ev.mensagens.push(Object.assign({ t: Math.round(m.chegou) }, m.tipo === 'agente-bloco' ? { tipo: m.tipo, bloco: Object.assign({}, m.bloco, { texto: String(m.bloco.texto || '').slice(0, 300) }) } : m));
      /* a tela: pedido de permissão → a pessoa pensa 1,5 s (a tela do terminal é fotografada) e clica "permitir" */
      if (m.tipo === 'agente-espera') {
        setTimeout(async () => {
          const naTela = await snap();
          ev.permissoes.push({ pid: m.pid, ferramenta: m.ferramenta, resumo: m.resumo, comando: m.comando, arquivo: m.arquivo, dialogoNoTerminalEnquantoSegura: /Do you want|Yes|allow/i.test(naTela.split('\n').slice(-14).join('\n')), tela: naTela });
          n.enviar({ tipo: 'agente-ok', id: ID, pid: m.pid, decisao: 'permitir' });
        }, 1500);
      }
      /* a tela: coop-ui responde a chamada do conector com a equipe de exemplo */
      if (m.tipo === 'mcp-chamada') {
        ev.mcp.push({ ferramenta: m.ferramenta, sessao: m.sessao, agente: m.agente, args: m.args });
        const pessoas = [{ id: 'theus', nome: 'Theus', papel: 'gestão', online: true }, { id: 'carla', nome: 'Carla', papel: 'membro', online: false }, { id: 'zuleica', nome: 'Zuleica Brandão', papel: 'membro', online: true }];
        n.enviar({ tipo: 'mcp-resposta', cid: m.cid, ok: true, resultado: m.ferramenta === 'coop_pessoas' ? { texto: pessoas.length + ' pessoas na equipe:\n' + pessoas.map((p) => '- ' + p.nome + ' (' + p.id + ') · ' + p.papel).join('\n'), dados: { pessoas } } : { texto: 'feito: ' + m.ferramenta } });
      }
    });
  });
  after(async () => {
    try { n.enviar({ tipo: 'term-fechar', id: ID }); await esperar(500); } catch (e) { /* segue */ }
    guardar();
    await C.parar();
  });

  it('o claude abre no pty com os ganchos, a pasta nova pede confiança e o SessionStart chega (acordou)', async () => {
    n.enviar({ tipo: 'term-abrir', id: ID, nome: 'Aurora', cols: 120, rows: 40 });
    await n.esperar((m) => m.tipo === 'term-aberto');
    await esperar(1200);
    const t0 = Date.now();
    n.enviar({ tipo: 'agente-iniciar', id: ID, nome: 'Aurora', instrucoes: 'agente de teste do babel-coop; responda curto' });
    await n.esperar((m) => m.tipo === 'agente-iniciado');
    let confiou = false;
    for (let i = 0; i < 60 && !confiou; i++) {
      await esperar(500);
      const s = await snap();
      if (/trust this folder/i.test(s)) {
        ev.telas.confianca = s;
        n.enviar({ tipo: 'term-entrada', id: ID, dados: '\x1b[B' }); await esperar(250); /* "Yes, I trust this folder" */
        n.enviar({ tipo: 'term-entrada', id: ID, dados: '\r' });
        confiou = true;
      }
      if (n.ultima((m) => m.tipo === 'agente-estado' && m.estado === 'acordou')) break; /* pasta já confiável */
    }
    const acordou = await n.esperar((m) => m.tipo === 'agente-estado' && m.estado === 'acordou', { ms: 60000, oque: 'SessionStart (acordou)' });
    ev.medidas.ateAcordar_ms = Date.now() - t0;
    ev.modeloReal = acordou.modelo;
    for (let i = 0; i < 40; i++) { const s = await snap(); if (/^❯/m.test(s) && /Aurora/.test(s)) break; await esperar(250); }
    await esperar(1500);
    ev.telas.pronto = await snap();
    guardar();
    assert.match(acordou.modelo || '', /haiku/);
  });

  async function pedir(rotulo, texto, msMax = 240000) {
    const n0 = n.msgs.length, t0 = Date.now();
    n.enviar({ tipo: 'agente-pedido', id: ID, texto });
    const chegou = await n.esperar((m) => m.tipo === 'agente-bloco' && m.bloco.tipo === 'pedido', { desde: n0, ms: 20000 }).catch(() => null);
    if (!chegou) { ev.notas.push(rotulo + ': o pedido não chegou em 20 s; Enter extra'); n.enviar({ tipo: 'term-entrada', id: ID, dados: '\r' }); }
    const fim = await n.esperar((m) => m.tipo === 'agente-estado' && (m.estado === 'terminou' || m.estado === 'falhou'), { desde: n0, ms: msMax, oque: rotulo + ': Stop' });
    await esperar(800);
    const msgs = doAgente(n0);
    const blocos = new Map(); msgs.filter((m) => m.tipo === 'agente-bloco').forEach((m) => blocos.set(m.bloco.bid, m.bloco));
    const r = { rotulo, texto, ms: Date.now() - t0, fim: fim.estado, estados: msgs.filter((m) => m.tipo === 'agente-estado').map((m) => m.estado + (m.ferramenta ? ':' + m.ferramenta : '')), blocos: Array.from(blocos.values()), planos: msgs.filter((m) => m.tipo === 'agente-plano'), arquivos: msgs.filter((m) => m.tipo === 'agente-arquivo'), esperas: msgs.filter((m) => m.tipo === 'agente-espera'), chamadas: msgs.filter((m) => m.tipo === 'mcp-chamada') };
    ev.pedidos.push(Object.assign({}, r, { blocos: r.blocos.map((b) => Object.assign({}, b, { texto: String(b.texto || '').slice(0, 600) })) }));
    ev.telas[rotulo] = await snap();
    guardar();
    return r;
  }

  it('(a) arquivo com plano: agente-estado, blocos pedido/plano/ação/resultado, plano indo a feito e agente-arquivo de ola.md', async () => {
    const r = await pedir('a', 'Crie o arquivo ola.md com três linhas sobre o babel-coop. Antes, faça uma lista de tarefas com 2 itens e marque cada um ao terminar.');
    const tipos = new Set(r.blocos.map((b) => b.tipo));
    assert.equal(r.fim, 'terminou', JSON.stringify(r.estados));
    for (const t of ['pedido', 'plano', 'acao', 'resultado']) assert.ok(tipos.has(t), 'bloco ' + t + ' · veio: ' + Array.from(tipos).join(','));
    assert.ok(r.estados.includes('pensando') && r.estados.some((e) => e.startsWith('rodando:')), JSON.stringify(r.estados));
    assert.ok(r.planos.length >= 2, 'o plano mudou pelo menos 2 vezes');
    const ultimo = r.planos[r.planos.length - 1];
    assert.ok(ultimo.itens.length >= 2 && ultimo.itens.every((i) => i.estado === 'feito'), JSON.stringify(ultimo.itens));
    assert.ok(r.planos.some((p) => p.concluidosAgora.length > 0), 'algum item foi a feito agora');
    const arq = r.arquivos.find((a) => a.caminho === 'ola.md');
    assert.ok(arq, 'agente-arquivo de ola.md: ' + JSON.stringify(r.arquivos));
    assert.equal(arq.acao, 'criado');
    const conteudo = fs.readFileSync(path.join(pasta, 'ola.md'), 'utf8');
    ev.olaMd = conteudo;
    assert.ok(conteudo.trim().split('\n').filter((l) => l.trim()).length >= 3, conteudo);
    const acao = r.blocos.find((b) => b.tipo === 'acao' && (b.arquivos || []).includes('ola.md'));
    assert.ok(acao && acao.estado === 'feito', 'a ação do Write terminou com prova: ' + JSON.stringify(acao));
    const res = r.blocos.find((b) => b.tipo === 'resultado');
    assert.ok(res.texto.length > 0 && res.prova.arquivos.some((a) => a.caminho === 'ola.md'));
  });

  it('(b) um comando que pede permissão em modo manual: agente-espera chega, a tela permite e o Claude segue até o Stop', async () => {
    const r = await pedir('b', 'Rode no terminal exatamente este comando e me diga o número que ele imprime: node -e "console.log(6*7)"');
    assert.ok(r.esperas.length >= 1, 'agente-espera chegou: ' + JSON.stringify(r.estados));
    const e = r.esperas.find((x) => x.ferramenta === 'Bash');
    assert.ok(e && /node -e/.test(e.comando), JSON.stringify(r.esperas));
    assert.ok(ev.permissoes.some((p) => p.pid === e.pid));
    assert.equal(r.fim, 'terminou');
    const bash = r.blocos.find((b) => b.tipo === 'acao' && /node -e/.test(b.comando || ''));
    assert.ok(bash && bash.estado === 'feito' && /42/.test(bash.prova.saida), JSON.stringify(bash));
    assert.match(r.blocos.find((b) => b.tipo === 'resultado').texto, /42/);
    const i = r.estados.indexOf('espera:Bash');
    assert.ok(i >= 0 && r.estados.slice(i + 1).includes('rodando:Bash'), 'espera → rodando depois do OK: ' + JSON.stringify(r.estados));
  });

  it('(c) o claude chama o conector coop (POST /mcp) e usa a resposta da tela', async () => {
    const r = await pedir('c', 'Use a ferramenta coop_pessoas e me diga quantas pessoas tem na equipe.');
    assert.equal(r.fim, 'terminou');
    assert.ok(ev.mcp.some((c) => c.ferramenta === 'coop_pessoas' && c.sessao === ID && c.agente.nome === 'Aurora'), 'a mcp-chamada chegou à tela: ' + JSON.stringify(ev.mcp));
    assert.ok(r.blocos.some((b) => b.tipo === 'consulta' && /coop_pessoas/.test(b.texto)), 'coop_pessoas é consulta: ' + JSON.stringify(r.blocos.map((b) => [b.tipo, b.texto])));
    assert.match(r.blocos.find((b) => b.tipo === 'resultado').texto, /3|três/i);
  });

  it('sair do claude (Ctrl+C duas vezes) encerra o agente e apaga os arquivos da sessão', async () => {
    const n0 = n.msgs.length;
    const dir = path.join(C.raiz, '.coop', 'agentes', ID);
    assert.ok(fs.existsSync(dir), 'os arquivos existem enquanto o claude roda');
    n.enviar({ tipo: 'term-entrada', id: ID, dados: '\x03' }); await esperar(400);
    n.enviar({ tipo: 'term-entrada', id: ID, dados: '\x03' });
    const fim = await n.esperar((m) => m.tipo === 'agente-fim' && m.id === ID, { desde: n0, ms: 15000 });
    ev.fim = fim;
    ev.telas.depoisDeSair = await snap();
    assert.equal(fim.motivo, 'o claude saiu');
    assert.ok(!fs.existsSync(dir), 'a pasta da sessão sumiu');
    const lista = await new Promise((ok) => { const k = n.msgs.length; n.enviar({ tipo: 'agente-lista?' }); n.esperar((m) => m.tipo === 'agente-lista', { desde: k }).then(ok); });
    ev.ganchosRecebidos = lista.lista.find((a) => a.id === ID).ganchos;
    guardar();
  });
});
