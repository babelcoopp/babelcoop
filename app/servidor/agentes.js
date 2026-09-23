/* Babel Coop · agentes: o `claude` de verdade dentro do pty de cada sessão, observado por ganchos (PROTOCOLO §7)
   - agente-iniciar {id,nome,instrucoes} (só a tela local): com o shell parado no prompt, digita no pty o comando que
     roda o `claude` com --settings e --mcp-config gerados em <raiz>/.coop/agentes/<sessao>/ (modo 600; nomes que não são
     settings*.json nem .mcp.json: coop-ganchos.json, coop-mcp.json, coop-gancho.js), --append-system-prompt, -n <nome>,
     --no-chrome e, quando existirem, --model $BABEL_COOP_MODELO e --permission-mode $BABEL_COOP_PERMISSAO.
     Os arquivos somem quando o claude sai, quando o terminal fecha e quando o servidor para. O segredo morre junto.
   - Ganchos (Claude Code 2.1.281, conferido em https://code.claude.com/docs/en/hooks em 23/09/2026):
       · tipo `http` em UserPromptSubmit, PreToolUse, PermissionRequest, PostToolUse, PostToolUseFailure, Notification,
         Stop, StopFailure e SubagentStop → POST http://127.0.0.1:<porta>/api/gancho/<sessao>, cabeçalho X-Coop-Segredo;
       · SessionStart não aceita `http` (só command e mcp_tool): um `command` em forma exec roda `node coop-gancho.js`
         (no app, o próprio Electron com ELECTRON_RUN_AS_NODE=1), que faz o mesmo POST. Nunca .sh.
   - Cada gancho vira mensagens para as telas locais e para os pares que assistem a sessão (sessão pausada: nada para
     os pares, nem depois): agente-estado, agente-bloco, agente-plano, agente-arquivo, agente-espera (só local), agente-fim.
   - Permissão: PermissionRequest segura a resposta HTTP até a tela mandar agente-ok {id,pid,decisao} (ou 590 s; sem
     decisão, responde vazio e o Claude pergunta no próprio terminal).
   Nada vai para o disco além dos três arquivos da sessão; o histórico de blocos fica só em memória.
*/
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { ehClaude } = require('./terminal');

const ID = /^[A-Za-z0-9_-]{1,48}$/;
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const MAX_CORPO = 16 * 1024 * 1024;      /* Write traz o arquivo inteiro no tool_input */
const MAX_BLOCOS = 80;                   /* histórico em memória por sessão */
const ARRANQUE = 90000;                  /* o claude não apareceu na frente em 90 s: desiste e apaga os arquivos */
const VIGIA = 700;                       /* de quanto em quanto tempo confere se o claude ainda está na frente */
const PAUSA_ENTER = 150;                 /* texto e Enter em escritas separadas: o Claude Code não trata como colagem */
const MODOS = ['acceptEdits', 'auto', 'bypassPermissions', 'manual', 'dontAsk', 'plan']; /* as escolhas de --permission-mode no 2.1.281 */
const ESTADOS = ['acordou', 'pensando', 'rodando', 'espera', 'terminou', 'falhou'];
const TIPOS_BLOCO = ['pedido', 'consulta', 'plano', 'acao', 'resultado', 'espera', 'falha'];
const ESTADOS_PLANO = ['pendente', 'andamento', 'feito'];
const CONSULTA = new Set(['Read', 'Grep', 'Glob', 'LS', 'WebFetch', 'WebSearch', 'NotebookRead', 'TaskGet', 'TaskList', 'ListMcpResourcesTool', 'ReadMcpResourceTool']);
const ARQUIVO = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);
const PLANO = new Set(['TodoWrite', 'TaskCreate', 'TaskUpdate']);
/* encanamento do próprio Claude Code (ToolSearch carrega ferramentas adiadas): muda o estado, não vira bloco */
const SEM_BLOCO = new Set(['TaskOutput', 'EnterPlanMode', 'ToolSearch']);
/* ferramentas só de leitura do conector coop (consulta), tiradas das anotações do próprio conector */
const COOP_CONSULTA = (() => {
  try { return new Set(require('./coop-mcp').FERRAMENTAS.filter((f) => f.annotations && f.annotations.readOnlyHint).map((f) => f.name)); } catch (e) { return new Set(['coop_buscar', 'coop_pessoas', 'coop_projetos', 'coop_demandas', 'navegador_ler', 'navegador_raio_x']); }
})();

/* o nome humano das ferramentas do conector coop ("Aviso oficial na TV"), tirado do próprio conector */
const TITULO_COOP = (() => { try { return new Map(require('./coop-mcp').FERRAMENTAS.map((f) => [f.name, f.title])); } catch (e) { return new Map(); } })();
/* passos do navegador próprio (§9, navegador.on('passo')) → blocos da presença: abrir/clicar/digitar = ação; ler/raio-X =
   consulta; senha = espera ("sua vez"); clonar/copy/print com arquivo pronto = resultado; erro = falha */
const PASSO_BLOCO = {
  abrir: 'acao', clicar: 'acao', digitar: 'acao', rolar: 'acao', esperar: 'acao', voltar: 'acao', avancar: 'acao', recarregar: 'acao', teclas: 'acao',
  ler: 'consulta', raiox: 'consulta', codigo: 'consulta', rede: 'consulta', console: 'consulta', armazenamento: 'consulta',
  senha: 'espera', clonar: 'resultado', copy: 'resultado', print: 'resultado', baixar: 'resultado', erro: 'falha'
};
const PASSO_TITULO = {
  abrir: 'navegador · abrir', clicar: 'navegador · clicar', digitar: 'navegador · preencher', rolar: 'navegador · rolar', esperar: 'navegador · esperar',
  voltar: 'navegador · voltar', avancar: 'navegador · avançar', recarregar: 'navegador · recarregar', teclas: 'navegador · teclas',
  ler: 'li a página', raiox: 'raio-X da página', codigo: 'código da página', rede: 'rede da página', console: 'console da página', armazenamento: 'cookies e armazenamento',
  senha: 'sua vez: a senha', clonar: 'clonei a página', copy: 'copiei os textos', print: 'print da página', baixar: 'baixei um arquivo', erro: 'o navegador não conseguiu'
};
const NAVEGADOR = /^mcp__coop__navegador_/;
const SUA_VEZ = /^sua vez\b/i;

/* ---------- utilidades puras (os testes de unidade usam) ---------- */
const agora = () => Date.now();
const str = (v, max) => (typeof v === 'string' ? v : v == null ? '' : String(v)).slice(0, max);
const linha = (v, max) => str(v, max * 2).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const cauda = (v, max) => { const s = typeof v === 'string' ? v : ''; return s.length > max ? '…' + s.slice(-max) : s; };
function aspasPosix(s) { return "'" + String(s).replace(/'/g, "'\\''") + "'"; }
function aspasPs(s) { return "'" + String(s).replace(/'/g, "''") + "'"; }
function mesmoSegredo(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
/* nome curto da ferramenta: mcp__coop__coop_aviso → coop_aviso; mcp__outro__x → outro · x */
function nomeCurto(t) {
  const m = /^mcp__([^_]+(?:_[^_]+)*?)__(.+)$/.exec(String(t || ''));
  if (!m) return str(t, 60);
  return m[1] === 'coop' ? str(m[2], 60) : str(m[1] + ' · ' + m[2], 60);
}
function ehConsulta(t) {
  if (CONSULTA.has(t)) return true;
  const m = /^mcp__coop__(.+)$/.exec(String(t || ''));
  return !!(m && COOP_CONSULTA.has(m[1]));
}
function estadoPlano(s) { return s === 'completed' ? 'feito' : s === 'in_progress' ? 'andamento' : 'pendente'; }
/* o bloco como sai daqui: sem os campos internos (itens_ da consulta, privado_ da pausa, pub_ do que vai para fora) */
function semInternos(x) {
  const o = Object.assign({}, x);
  delete o.itens_; delete o.privado_; delete o.pub_; delete o.passo_;
  Object.keys(o).forEach((k) => { if (o[k] === undefined) delete o[k]; });
  if (Array.isArray(o.arquivos)) o.arquivos = o.arquivos.slice(0, 50);
  return o;
}
/* a mesma chamada de ferramenta no PermissionRequest (sem tool_use_id) e no PostToolUse */
function chaveFerramenta(f, inp) { return String(f) + '|' + jsonCurto(inp && typeof inp === 'object' ? inp : {}, 1e6); }
function textoPlano(itens) { return itens.filter((i) => i.estado === 'feito').length + ' de ' + itens.length + ' feitos'; }
function jsonCurto(o, max) { let s = ''; try { s = JSON.stringify(o); } catch (e) { s = ''; } return s && s.length > max ? s.slice(0, max) + '…' : s || ''; }

/* texto do resultado de uma ferramenta MCP no PostToolUse (lista de {type:'text',text}) ou de qualquer outra */
function textoDaResposta(r) {
  if (r == null) return '';
  if (typeof r === 'string') return r;
  if (Array.isArray(r)) return r.map((c) => (c && typeof c.text === 'string' ? c.text : '')).filter(Boolean).join('\n');
  if (Array.isArray(r.content)) return textoDaResposta(r.content);
  if (typeof r.stdout === 'string') return r.stdout;
  if (typeof r.result === 'string') return r.result;
  return jsonCurto(r, 2000);
}

/* o que a pessoa lê no pedido de permissão e no bloco da ação */
function resumoDe(ferramenta, e, rel) {
  e = e || {};
  switch (ferramenta) {
    case 'Bash': case 'PowerShell': return linha(e.description || e.command, 300);
    case 'Write': return 'escrever ' + rel(e.file_path);
    case 'Edit': case 'MultiEdit': return 'editar ' + rel(e.file_path);
    case 'NotebookEdit': return 'editar ' + rel(e.notebook_path);
    case 'Read': return 'ler ' + rel(e.file_path);
    case 'WebFetch': return 'abrir ' + linha(e.url, 300);
    case 'WebSearch': return 'buscar na web: ' + linha(e.query, 200);
    case 'Grep': return 'procurar "' + linha(e.pattern, 120) + '"' + (e.path ? ' em ' + rel(e.path) : '');
    case 'Glob': return 'listar ' + linha(e.pattern, 200);
    default: {
      const args = jsonCurto(e, 240);
      return linha(nomeCurto(ferramenta) + (args && args !== '{}' ? ' ' + args : ''), 300);
    }
  }
}
/* o alvo de uma consulta, para "consultei: a.md · b.csv" */
function alvoConsulta(ferramenta, e, rel) {
  e = e || {};
  if (ferramenta === 'Read' || ferramenta === 'NotebookRead') return rel(e.file_path || e.notebook_path);
  if (ferramenta === 'Grep') return '"' + linha(e.pattern, 60) + '"';
  if (ferramenta === 'Glob') return linha(e.pattern, 80);
  if (ferramenta === 'WebFetch') { try { return new URL(e.url).host; } catch (err) { return linha(e.url, 80); } }
  if (ferramenta === 'WebSearch') return '"' + linha(e.query, 60) + '"';
  if (ferramenta === 'LS') return rel(e.path);
  if (/^mcp__coop__/.test(String(ferramenta))) {
    const n = nomeCurto(ferramenta);
    if (n === 'coop_buscar') return 'acervo: "' + linha(e.termo, 60) + '"';
    if (n === 'coop_demandas' && e.pessoa) return 'demandas de ' + linha(e.pessoa, 40);
    return (TITULO_COOP.get(n) || n).toLowerCase();
  }
  return nomeCurto(ferramenta);
}

/* o que o agente vai fazer no navegador, em português */
function resumoNavegador(n, e) {
  e = e || {};
  switch (n) {
    case 'navegador_abrir': return 'abrir ' + linha(e.url, 300);
    case 'navegador_clicar': return 'clicar em ' + (e.texto ? '"' + linha(e.texto, 120) + '"' : linha(e.seletor, 200));
    case 'navegador_digitar': return 'preencher ' + linha(e.seletor, 160) + ' com "' + linha(e.texto, 160) + '"';
    case 'navegador_ler': return 'ler a página aberta';
    case 'navegador_raio_x': return 'raio-X da página' + (e.seletor ? ' em ' + linha(e.seletor, 160) : '');
    case 'navegador_clonar': return 'clonar a página' + (e.pasta ? ' em ' + linha(e.pasta, 120) : '');
    case 'navegador_copy': return 'tirar a copy da página (copy.md)';
    case 'navegador_print': return 'print da página inteira';
    case 'navegador_codigo': return e.url ? 'ler o código de ' + linha(e.url, 300) : 'listar o código da página (recursos)';
    case 'navegador_rede': return 'ler a rede da página' + (e.filtro ? ' (filtro "' + linha(e.filtro, 80) + '")' : '') + (e.corpo ? ' com os corpos' : '');
    case 'navegador_console': return 'ler o console da página' + (e.nivel ? ' (' + linha(e.nivel, 20) + ')' : '');
    case 'navegador_armazenamento': return 'ler cookies, localStorage e sessionStorage';
    case 'navegador_rolar': return 'rolar ' + (e.pixels != null ? e.pixels + ' px' : 'até ' + linha(e.para, 160));
    case 'navegador_esperar': return 'esperar ' + (e.seletor ? linha(e.seletor, 160) : e.texto ? '"' + linha(e.texto, 120) + '"' : (e.ms || 1000) + ' ms');
    case 'navegador_voltar': return 'voltar para a página anterior';
    case 'navegador_avancar': return 'avançar para a página seguinte';
    case 'navegador_recarregar': return 'recarregar a página';
    case 'navegador_teclas': return 'apertar ' + linha(e.teclas, 160);
    case 'navegador_arquivo_baixar': return 'baixar ' + linha(e.url, 300) + ' em Downloads/';
    default: return linha(n, 60);
  }
}

/* itens do plano a partir do TodoWrite */
function itensTodo(todos) {
  return (Array.isArray(todos) ? todos : []).slice(0, 100).map((t) => ({ texto: linha(t && (t.content || t.subject || t.activeForm), 300), estado: estadoPlano(t && t.status) })).filter((i) => i.texto);
}
/* índices que viraram "feito" agora (casados pelo texto; o mesmo texto repetido conta pela ordem) */
function concluidosAgora(antes, depois) {
  const feitos = new Map();
  (antes || []).forEach((i) => { if (i.estado === 'feito') feitos.set(i.texto, (feitos.get(i.texto) || 0) + 1); });
  const r = [];
  depois.forEach((i, k) => {
    if (i.estado !== 'feito') return;
    const n = feitos.get(i.texto) || 0;
    if (n > 0) feitos.set(i.texto, n - 1); else r.push(k);
  });
  return r;
}

/* ---------- o comando que a tela "digita" ---------- */
function acharClaude() {
  if (process.env.BABEL_COOP_CLAUDE) return process.env.BABEL_COOP_CLAUDE;
  if (process.platform === 'win32') return 'claude';
  const casa = os.homedir();
  const pastas = String(process.env.PATH || '').split(path.delimiter).filter(Boolean)
    .concat([path.join(casa, '.local', 'bin'), path.join(casa, '.claude', 'local'), '/opt/homebrew/bin', '/usr/local/bin']);
  for (const d of pastas) {
    const f = path.join(d, 'claude');
    try { fs.accessSync(f, fs.constants.X_OK); if (fs.statSync(f).isFile()) return f; } catch (e) { /* próxima */ }
  }
  return 'claude'; /* o shell da pessoa acha pelo PATH dela */
}

/* argumentos do claude (sem o executável): função pura, os testes de unidade conferem */
function argumentos({ ganchos, mcp, nome, prompt, modelo, permissao, estrito }) {
  /* --allowedTools libera o conector coop sem pedido de permissão (as ações dele já são assinadas e a senha é sempre da pessoa) */
  const a = ['--settings', ganchos, '--mcp-config', mcp, '--no-chrome', '-n', nome, '--append-system-prompt', prompt, '--allowedTools', 'mcp__coop', 'mcp__coop__*'];
  if (modelo) a.push('--model', modelo);
  if (permissao) a.push('--permission-mode', permissao);
  if (estrito) a.push('--strict-mcp-config');
  return a;
}
/* a linha inteira para o shell do pty: zsh/bash (aspas simples) ou PowerShell */
function linhaDeComando({ shell, claude, args }) {
  /* sem as ferramentas de plano o agente não mostra checklist em modelos novos; TodoWrite é o que a presença lê */
  const env = { CLAUDE_CODE_ENABLE_TODO_TOOLS: '1', CLAUDE_CODE_ENABLE_TASKS: '0' };
  if (/powershell|pwsh/i.test(shell || '')) {
    return Object.keys(env).map((k) => '$env:' + k + '=' + aspasPs(env[k]) + ';').join(' ') + ' & ' + aspasPs(claude) + ' ' + args.map(aspasPs).join(' ');
  }
  return ' ' + Object.keys(env).map((k) => k + '=' + env[k]).join(' ') + ' ' + aspasPosix(claude) + ' ' + args.map(aspasPosix).join(' ');
}

function textoDoPrompt({ nome, dono, donoId, instrucoes, pasta, saber }) {
  const partes = [
    'Você é ' + nome + ', o agente de ' + dono + ' (' + donoId + ') no babel-coop, rodando no terminal da Estação dessa pessoa.',
    instrucoes ? 'Suas instruções: ' + instrucoes : '',
    'A pasta compartilhada é ' + pasta + ': o que você cria ali a equipe vê.',
    /* o agente nasce sabendo (acervo.js · resumoParaAgente): quantos aprendizados existem e os mais usados, curto */
    saber ? String(saber).slice(0, 3000) : '',
    'Use as ferramentas coop para mexer no app e no navegador do babel-coop; nunca abra o Google Chrome; senhas só a pessoa digita.',
    'O navegador do babel-coop (aba "Navegador · ' + nome + '", a pessoa vê tudo): navegador_abrir, navegador_clicar, navegador_digitar, navegador_teclas (Enter, Tab, setas, Esc), navegador_rolar, navegador_esperar, navegador_voltar, navegador_avancar, navegador_recarregar; para ver o site até o código: navegador_ler (texto), navegador_raio_x (DOM, CSS de um elemento, fontes, cores), navegador_codigo (recursos e código-fonte: JS, CSS, HTML original, DOM vivo com url "dom", source maps), navegador_rede (pedidos, cabeçalhos e corpos), navegador_console (logs e erros), navegador_armazenamento (cookies, localStorage, sessionStorage); para levar para a pasta: navegador_clonar, navegador_copy, navegador_print, navegador_arquivo_baixar (Downloads/).',
    'Fale em português do Brasil.'
  ];
  return linha(partes.filter(Boolean).join(' '), 6000);
}

/* o SessionStart não aceita gancho http: este script (Node puro, gerado por sessão) faz o POST no lugar dele */
function scriptInicio(url, segredo) {
  return "'use strict';\n" +
    '/* babel-coop · gerado para uma sessão de agente: repassa o gancho SessionStart ao servidor da Estação e sai. Apagado quando o claude sai. */\n' +
    "const http = require('http');\n" +
    'const URL_GANCHO = ' + JSON.stringify(url) + ';\n' +
    'const SEGREDO = ' + JSON.stringify(segredo) + ';\n' +
    "let dados = '';\n" +
    'const sair = () => process.exit(0);\n' +
    'setTimeout(sair, 4000).unref();\n' +
    "process.stdin.setEncoding('utf8');\n" +
    "process.stdin.on('data', (c) => { dados += c; });\n" +
    "process.stdin.on('end', () => {\n" +
    "  const corpo = Buffer.from(dados || '{}');\n" +
    "  const req = http.request(URL_GANCHO, { method: 'POST', timeout: 3000, headers: { 'Content-Type': 'application/json', 'Content-Length': corpo.length, 'X-Coop-Segredo': SEGREDO } }, (res) => { res.resume(); res.on('end', sair); });\n" +
    "  req.on('error', sair); req.on('timeout', () => { req.destroy(); sair(); });\n" +
    '  req.end(corpo);\n' +
    '});\n';
}

/* o gancho `command` do SessionStart: forma exec (sem shell); no Electron, o próprio binário como Node */
function comandoInicio(script) {
  const exe = process.execPath;
  if (!process.versions.electron) return { type: 'command', command: exe, args: [script], timeout: 10 };
  if (process.platform === 'win32') return { type: 'command', shell: 'powershell', command: "$env:ELECTRON_RUN_AS_NODE='1'; & " + aspasPs(exe) + ' ' + aspasPs(script), timeout: 10 };
  return { type: 'command', command: '/usr/bin/env', args: ['ELECTRON_RUN_AS_NODE=1', exe, script], timeout: 10 };
}

function configGanchos({ url, segredo, script }) {
  const h = (timeout) => ({ type: 'http', url, headers: { 'X-Coop-Segredo': segredo }, timeout });
  return {
    hooks: {
      SessionStart: [{ hooks: [comandoInicio(script)] }],
      UserPromptSubmit: [{ hooks: [h(10)] }],
      PreToolUse: [{ hooks: [h(10)] }],
      PermissionRequest: [{ hooks: [h(600)] }],
      PostToolUse: [{ hooks: [h(10)] }],
      PostToolUseFailure: [{ hooks: [h(10)] }],
      Notification: [{ hooks: [h(10)] }],
      Stop: [{ hooks: [h(10)] }],
      StopFailure: [{ hooks: [h(10)] }],
      SubagentStop: [{ hooks: [h(10)] }]
    }
  };
}
function configMcp({ url, segredo }) {
  return { mcpServers: { coop: { type: 'http', url, headers: { 'X-Coop-Segredo': segredo } } } };
}

/* ---------- o que chega de um par (outra Estação): só campos conhecidos, com tamanho limitado ---------- */
function limparItens(itens) {
  return (Array.isArray(itens) ? itens : []).slice(0, 100).map((i) => ({ texto: linha(i && i.texto, 300), estado: ESTADOS_PLANO.includes(i && i.estado) ? i.estado : 'pendente' })).filter((i) => i.texto);
}
function relSeguro(c) { c = str(c, 500); return c && !path.isAbsolute(c) && !/^[A-Za-z]:/.test(c) && !c.split(/[\\/]/).includes('..') ? c : null; }
function limparBloco(b) {
  if (!b || typeof b !== 'object' || typeof b.bid !== 'string' || !TIPOS_BLOCO.includes(b.tipo)) return null;
  const o = { bid: b.bid.slice(0, 60), tipo: b.tipo, titulo: linha(b.titulo, 200), texto: str(b.texto, 8000), ts: +b.ts || null };
  if (typeof b.comando === 'string') o.comando = b.comando.slice(0, 4000);
  if (Array.isArray(b.arquivos)) o.arquivos = b.arquivos.slice(0, 50).map((a) => (typeof a === 'string' ? relSeguro(a) || path.basename(a) : a && relSeguro(a.caminho) ? { caminho: relSeguro(a.caminho), acao: a.acao === 'criado' ? 'criado' : 'editado' } : null)).filter(Boolean);
  if (Array.isArray(b.itens)) o.itens = limparItens(b.itens);
  ['estado', 'ferramenta', 'subagente', 'decisao', 'pid', 'navegador'].forEach((k) => { if (typeof b[k] === 'string') o[k] = linha(b[k], 60); });
  if (b.senha === true) o.senha = true;
  if (b.prova && typeof b.prova === 'object') { const s = jsonCurto(b.prova, 9000); if (s.length <= 8000) { try { o.prova = JSON.parse(s); } catch (e) { /* fica sem prova */ } } }
  return o;
}
function limparDePar(m, dono) {
  if (!m || typeof m.tipo !== 'string' || typeof m.id !== 'string' || !ID.test(m.id)) return null;
  const base = { tipo: m.tipo, dono, id: m.id };
  if (typeof m.nome === 'string' && m.nome.trim()) base.nome = linha(m.nome, 60);
  switch (m.tipo) {
    case 'agente-estado':
      if (!ESTADOS.includes(m.estado)) return null;
      return Object.assign(base, { estado: m.estado, ferramenta: typeof m.ferramenta === 'string' ? linha(m.ferramenta, 60) : undefined, desde: +m.desde || null, ts: +m.ts || null });
    case 'agente-bloco': { const b = limparBloco(m.bloco); return b ? Object.assign(base, { bloco: b }) : null; }
    case 'agente-plano': return Object.assign(base, { itens: limparItens(m.itens), concluidosAgora: (Array.isArray(m.concluidosAgora) ? m.concluidosAgora : []).filter((n) => Number.isInteger(n) && n >= 0 && n < 100).slice(0, 100) });
    case 'agente-arquivo': { const c = relSeguro(m.caminho); return c ? Object.assign(base, { caminho: c, acao: m.acao === 'criado' ? 'criado' : 'editado' }) : null; }
    case 'agente-fim': return Object.assign(base, { motivo: linha(m.motivo, 120), ts: +m.ts || null });
    case 'agente-resumo':
      return Object.assign(base, {
        nome: linha(m.nome, 60), ativo: !!m.ativo, estado: ESTADOS.includes(m.estado) ? m.estado : null, ferramenta: typeof m.ferramenta === 'string' ? linha(m.ferramenta, 60) : undefined,
        desde: +m.desde || null, plano: limparItens(m.plano), blocos: (Array.isArray(m.blocos) ? m.blocos : []).slice(-30).map(limparBloco).filter(Boolean)
      });
    default: return null;
  }
}

/* ---------- os agentes desta Estação ---------- */
class Agentes {
  /* o = { cfg: () => cfg, terminais, paraLocais(msg) → quantas telas, publicar(id, msg) → para quem assiste de fora,
           porta: () => porta, tempoPermissao?: ms } */
  constructor(o) {
    this.o = o;
    this.t = o.terminais;
    this.sessoes = new Map();
    this.tempoPermissao = +o.tempoPermissao || +process.env.BABEL_COOP_PERMISSAO_MS || 590000;
    this.vigia = setInterval(() => this.vigiar(), VIGIA);
    if (this.vigia.unref) this.vigia.unref();
    this.t.aoFechar((id) => this.encerrar(id, 'o terminal fechou'));
  }

  cfg() { return this.o.cfg(); }
  /* o que a equipe já aprendeu, para o prompt (o = { saber: () => texto }); sem acervo, nada */
  saber() { try { return typeof this.o.saber === 'function' ? String(this.o.saber() || '') : ''; } catch (e) { return ''; } }
  dono() { return this.cfg().id; }

  /* ---------- a tela pede ---------- */
  iniciar(ws, m) {
    const id = typeof m.id === 'string' && ID.test(m.id) ? m.id : null;
    if (!id || !this.t.existe(id)) throw new Error('abra o terminal antes de chamar o agente');
    const velho = this.sessoes.get(id);
    if (velho && !velho.fim) throw new Error('já tem um agente rodando neste terminal');
    if (!this.t.parado(id)) throw new Error('o terminal está ocupado: espere o comando atual terminar para chamar o agente');
    const cfg = this.cfg();
    const info = this.t.info(id, false) || {};
    const nome = linha(m.nome, 40) || info.nome || id;
    const instrucoes = linha(m.instrucoes, 4000);
    const segredo = crypto.randomBytes(24).toString('hex');
    const porta = this.o.porta();
    const pasta = path.join(cfg.raiz, '.coop', 'agentes', id);
    fs.mkdirSync(pasta, { recursive: true, mode: 0o700 });
    try { fs.chmodSync(pasta, 0o700); } catch (e) { /* Windows */ }
    const arq = { ganchos: path.join(pasta, 'coop-ganchos.json'), mcp: path.join(pasta, 'coop-mcp.json'), script: path.join(pasta, 'coop-gancho.js') };
    const base = 'http://127.0.0.1:' + porta;
    const gravar = (f, s) => { fs.writeFileSync(f, s, { mode: 0o600 }); try { fs.chmodSync(f, 0o600); } catch (e) { /* Windows */ } };
    gravar(arq.script, scriptInicio(base + '/api/gancho/' + id, segredo));
    gravar(arq.ganchos, JSON.stringify(configGanchos({ url: base + '/api/gancho/' + id, segredo, script: arq.script }), null, 2));
    gravar(arq.mcp, JSON.stringify(configMcp({ url: base + '/mcp/' + id, segredo }), null, 2));
    const modelo = linha(process.env.BABEL_COOP_MODELO, 80);
    const permissao = MODOS.includes(process.env.BABEL_COOP_PERMISSAO) ? process.env.BABEL_COOP_PERMISSAO : '';
    const args = argumentos({ ganchos: arq.ganchos, mcp: arq.mcp, nome, prompt: textoDoPrompt({ nome, dono: cfg.nome, donoId: cfg.id, instrucoes, pasta: cfg.pasta, saber: this.saber() }), modelo, permissao, estrito: process.env.BABEL_COOP_MCP_ESTRITO === '1' });
    const shell = this.t.shell().cmd;
    const comando = linhaDeComando({ shell, claude: acharClaude(), args });
    const a = {
      id, nome, instrucoes, segredo, pasta, arq, tela: ws, inicio: agora(), fim: null, viu: false, sessaoClaude: null, modelo: modelo || null,
      est: null, blocos: [], blocosPub: [], plano: [], planoPub: [], planoBid: null, privados: new Set(), tarefas: new Map(), seq: 0,
      porFerramenta: new Map(), existia: new Map(), consultaAberta: null, turno: null, pendentes: new Map(), contagem: {}
    };
    this.sessoes.set(id, a);
    a.arranque = setTimeout(() => { if (!a.viu) this.encerrar(id, 'o claude não abriu no terminal'); }, ARRANQUE);
    if (a.arranque.unref) a.arranque.unref();
    /* Ctrl+U limpa o que estivesse meio digitado na linha do zsh/bash; o PowerShell usa Esc */
    this.t.escrever(id, (/powershell|pwsh/i.test(shell) ? '\x1b' : '\x15') + comando + '\r');
    this.o.paraLocais({ tipo: 'agente-iniciado', dono: this.dono(), id, nome, modelo: a.modelo, ts: a.inicio });
    return a;
  }

  /* o campo ❯ endereçado: texto + Enter no pty, com o claude na frente */
  pedido(m) {
    const id = typeof m.id === 'string' && ID.test(m.id) ? m.id : null;
    if (!id || !this.t.existe(id)) throw new Error('terminal não existe');
    const a = this.sessoes.get(id);
    const info = this.t.info(id, false) || {};
    const claudeNaFrente = !this.t.parado(id) && ((a && !a.fim) || ehClaude(info.processo));
    if (!claudeNaFrente) throw new Error('nenhum agente rodando neste terminal: chame o agente antes');
    let texto = str(m.texto, 100000).replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '');
    if (!texto.trim()) return false;
    /* várias linhas: colagem entre colchetes (o Claude Code junta num pedido só); uma linha: digitada */
    if (texto.includes('\n')) texto = '\x1b[200~' + texto + '\x1b[201~';
    this.t.escrever(id, texto);
    setTimeout(() => this.t.escrever(id, '\r'), PAUSA_ENTER);
    return true;
  }

  /* a pessoa respondeu o pedido de permissão na tela */
  ok(m) {
    const a = typeof m.id === 'string' && this.sessoes.get(m.id);
    const p = a && typeof m.pid === 'string' && a.pendentes.get(m.pid);
    if (!p) return false;
    const decisao = m.decisao === 'permitir' ? 'permitir' : m.decisao === 'negar' ? 'negar' : null;
    if (!decisao) return false;
    const corpo = decisao === 'permitir'
      ? { hookSpecificOutput: { hookEventName: 'PermissionRequest', decision: { behavior: 'allow' } } }
      : { hookSpecificOutput: { hookEventName: 'PermissionRequest', decision: { behavior: 'deny', message: 'A pessoa negou pelo babel-coop.' } } };
    this.fecharPendente(a, p, corpo, { decisao });
    this.estado(a, decisao === 'permitir' ? 'rodando' : 'pensando', decisao === 'permitir' ? p.ferramenta : undefined);
    return true;
  }

  /* ---------- quem o conector e o servidor consultam ---------- */
  agente(sessao) { const a = this.sessoes.get(sessao); return a ? { id: a.id, nome: a.nome, dono: this.dono() } : null; }
  tela(sessao) { const a = this.sessoes.get(sessao); return a ? a.tela : null; }
  autorizado(req, sessao) {
    const a = this.sessoes.get(sessao);
    return !!(a && !a.fim && LOOPBACK.has(String(req.socket.remoteAddress || '')) && mesmoSegredo(req.headers['x-coop-segredo'], a.segredo));
  }
  resumoDe(a, publico) {
    return {
      tipo: 'agente-resumo', dono: this.dono(), id: a.id, nome: a.nome, ativo: !a.fim, estado: a.est ? a.est.estado : null, ferramenta: a.est ? a.est.ferramenta : undefined,
      desde: a.est ? a.est.desde : null, plano: publico ? a.planoPub : a.plano, blocos: publico ? a.blocosPub.slice(-30) : a.blocos.slice(-30).map(semInternos),
      pendentes: publico ? undefined : Array.from(a.pendentes.values()).map((p) => ({ pid: p.pid, ferramenta: p.ferramenta, resumo: p.resumo })),
      ganchos: publico ? undefined : Object.assign({}, a.contagem) /* quantos ganchos de cada evento chegaram (diagnóstico) */
    };
  }
  lista() { return Array.from(this.sessoes.values()).map((a) => this.resumoDe(a, false)); }
  /* para um par que começou a assistir: só o que saiu fora da pausa */
  resumo(sessao, publico) { const a = this.sessoes.get(sessao); if (!a || (publico && this.t.pausada(sessao))) return null; return this.resumoDe(a, publico); }

  /* ---------- /api/gancho/<sessao> ---------- */
  gancho(req, res, sessao) {
    const responder = (status, corpo) => {
      if (res.writableEnded) return;
      const s = corpo === undefined ? '' : JSON.stringify(corpo);
      res.writeHead(status, Object.assign({ 'Cache-Control': 'no-store' }, s ? { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(s) } : { 'Content-Length': 0 }));
      res.end(s);
    };
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return responder(405, { erro: 'use POST' }); }
    if (!LOOPBACK.has(String(req.socket.remoteAddress || ''))) return responder(403, { erro: 'só nesta máquina' });
    if (!this.autorizado(req, sessao)) { req.resume(); return responder(403, { erro: 'segredo da sessão não confere' }); }
    const a = this.sessoes.get(sessao);
    let tam = 0; const partes = [];
    req.on('data', (c) => { tam += c.length; if (tam > MAX_CORPO) { responder(413, { erro: 'grande demais' }); req.destroy(); return; } partes.push(c); });
    req.on('end', () => {
      if (res.writableEnded) return;
      let e; try { e = JSON.parse(Buffer.concat(partes).toString('utf8') || '{}'); } catch (err) { return responder(400, { erro: 'JSON inválido' }); }
      if (!e || typeof e !== 'object') return responder(400, { erro: 'JSON inválido' });
      if (a.fim) return responder(200); /* o agente acabou enquanto o corpo chegava */
      const evento = str(e.hook_event_name, 40);
      a.contagem[evento] = (a.contagem[evento] || 0) + 1;
      if (e.session_id && !a.sessaoClaude) a.sessaoClaude = str(e.session_id, 80);
      if (evento === 'PermissionRequest') return this.permissao(a, e, req, res, responder);
      try { this.tratar(a, evento, e); } catch (err) { console.error('[agentes] gancho ' + evento + ':', err.message); }
      responder(200); /* corpo vazio = sucesso sem decisão */
    });
  }

  tratar(a, evento, e) {
    if (a.fim) return;
    const sub = e.agent_id && e.agent_type ? str(e.agent_type, 60) : null;
    switch (evento) {
      case 'SessionStart':
        a.viu = true;
        if (e.model) a.modelo = str(e.model, 80);
        return this.estado(a, 'acordou');
      case 'UserPromptSubmit':
        this.soltarPendentes(a, 'respondido no terminal');
        a.turno = { inicio: agora(), arquivos: new Map(), comandos: [], privados: new Set() };
        a.consultaAberta = null; a.planoBid = null; a.navBid = null; a.navPasso = null;
        this.estado(a, 'pensando');
        return this.bloco(a, { tipo: 'pedido', titulo: 'pedido', texto: str(e.prompt != null ? e.prompt : e.user_prompt, 8000) });
      case 'PreToolUse': return this.antes(a, e, sub);
      /* a pessoa respondeu a permissão no próprio terminal (o diálogo aparece lá enquanto o gancho segura): a ferramenta
         rodou (ou falhou/foi negada), então o pedido pendente dela na tela acabou */
      case 'PostToolUse': this.soltarPor(a, e); return this.depois(a, e, sub);
      case 'PostToolUseFailure': this.soltarPor(a, e); return this.falhou(a, e, sub);
      case 'Notification': {
        const tipo = str(e.notification_type, 40);
        if ((tipo === 'permission_prompt' || tipo === 'elicitation_dialog' || tipo === 'elicitation_url_dialog') && !a.pendentes.size) {
          this.estado(a, 'espera');
          if (tipo !== 'permission_prompt') this.bloco(a, { tipo: 'espera', titulo: linha(e.title, 120) || 'espera você', texto: str(e.message, 2000) });
        }
        return;
      }
      case 'Stop': {
        this.soltarPendentes(a, 'o Claude parou');
        a.consultaAberta = null; a.navBid = null; a.navPasso = null;
        this.estado(a, 'terminou');
        const t = a.turno || { inicio: a.inicio, arquivos: new Map(), comandos: [], privados: new Set() };
        const arquivos = Array.from(t.arquivos.entries()).map(([caminho, acao]) => ({ caminho, acao }));
        const comandos = t.comandos.slice(-5).map((c) => ({ comando: c.comando, ok: c.ok }));
        const prova = { arquivos, comandos, duracao: agora() - t.inicio };
        /* quem assiste de fora não fica sabendo dos arquivos mexidos durante a pausa */
        const pubArq = arquivos.filter((x) => !t.privados.has(x.caminho));
        const pubCmd = t.comandos.slice(-5).filter((c) => !c.privado).map((c) => ({ comando: c.comando, ok: c.ok }));
        const b = this.bloco(a, {
          tipo: 'resultado', titulo: 'pronto', texto: str(e.last_assistant_message, 8000), arquivos: arquivos.map((x) => x.caminho), prova,
          pub_: pubArq.length === arquivos.length && pubCmd.length === comandos.length ? undefined : { arquivos: pubArq.map((x) => x.caminho), prova: Object.assign({}, prova, { arquivos: pubArq, comandos: pubCmd }) }
        });
        a.turno = null;
        /* o acervo guarda o resultado como histórico de terminal: só a saída (texto final e arquivos fora da pausa), nunca o que foi digitado */
        if (typeof this.o.aoResultado === 'function') {
          try { this.o.aoResultado({ sessao: a.id, agente: a.nome, texto: str(e.last_assistant_message, 8000), arquivos: pubArq.map((x) => x.caminho), pausado: !!this.t.pausada(a.id), ts: agora() }); } catch (err) { /* o acervo nunca derruba o agente */ }
        }
        return b;
      }
      case 'StopFailure':
        this.soltarPendentes(a, 'o Claude parou com erro');
        this.estado(a, 'falhou');
        return this.bloco(a, { tipo: 'falha', titulo: 'o claude parou: ' + (linha(e.error, 40) || 'erro'), texto: str(e.last_assistant_message || e.error_details || e.error, 2000) });
      case 'SubagentStop':
        if (!e.agent_type) return; /* agentes internos (sugestões, /btw) não viram bloco */
        if (a.est && a.est.estado === 'rodando') this.estado(a, 'pensando');
        return this.bloco(a, { tipo: 'resultado', titulo: 'subagente ' + linha(e.agent_type, 60) + ' terminou', texto: str(e.last_assistant_message, 2000), subagente: linha(e.agent_type, 60) });
      default: return;
    }
  }

  /* PreToolUse: o que o agente vai fazer agora */
  antes(a, e, sub) {
    const f = str(e.tool_name, 120), inp = e.tool_input && typeof e.tool_input === 'object' ? e.tool_input : {}, tuid = str(e.tool_use_id, 120);
    const rel = (c) => this.rel(c);
    this.estado(a, 'rodando', nomeCurto(f));
    if (f === 'TodoWrite') return this.plano(a, itensTodo(inp.todos));
    if (PLANO.has(f) || SEM_BLOCO.has(f)) return;
    if (f === 'AskUserQuestion') {
      const q = Array.isArray(inp.questions) ? inp.questions.map((x) => x && x.question).filter(Boolean).join(' · ') : '';
      this.estado(a, 'espera', nomeCurto(f));
      return this.bloco(a, { tipo: 'espera', titulo: 'pergunta', texto: str(q, 2000), ferramenta: f });
    }
    if (f === 'ExitPlanMode') return this.bloco(a, { tipo: 'plano', titulo: 'plano', texto: str(inp.plan, 8000) });
    if (NAVEGADOR.test(f)) {
      /* um bloco por chamada: os passos do navegador (passoNavegador) o atualizam ao vivo ("abrindo…" → "abriu …") */
      a.consultaAberta = null;
      const n = nomeCurto(f), consulta = ehConsulta(f);
      const b = this.bloco(a, { tipo: consulta ? 'consulta' : 'acao', titulo: consulta ? 'consultei' : TITULO_COOP.get(n) || n, texto: resumoNavegador(n, inp), comando: jsonCurto(inp, 4000), estado: consulta ? undefined : 'rodando', ferramenta: n, navegador: n.replace(/^navegador_/, ''), subagente: sub || undefined });
      a.navBid = b.bid; a.navPasso = null;
      if (tuid) a.porFerramenta.set(tuid, b.bid);
      return b;
    }
    if (ehConsulta(f)) {
      const alvo = alvoConsulta(f, inp, rel);
      /* não junta o que nasceu fora da pausa com o que nasceu dentro dela (e vice-versa) */
      const aberta = a.consultaAberta && a.blocos.find((b) => b.bid === a.consultaAberta && !!b.privado_ === this.t.pausada(a.id));
      if (aberta) {
        /* consultas seguidas viram um bloco só: "consultei: a.md · b.csv" */
        if (!aberta.itens_.includes(alvo)) aberta.itens_.push(alvo);
        if (tuid) a.porFerramenta.set(tuid, aberta.bid);
        return this.atualizar(a, aberta.bid, { texto: aberta.itens_.slice(0, 20).join(' · ') + (aberta.itens_.length > 20 ? ' …' : ''), arquivos: aberta.itens_.slice(0, 50) });
      }
      const b = this.bloco(a, { tipo: 'consulta', titulo: 'consultei', texto: alvo, arquivos: [alvo], ferramenta: nomeCurto(f), subagente: sub || undefined });
      b.itens_ = [alvo];
      a.consultaAberta = b.bid;
      if (tuid) a.porFerramenta.set(tuid, b.bid);
      return b;
    }
    a.consultaAberta = null;
    const arquivo = ARQUIVO.has(f) ? (inp.file_path || inp.notebook_path) : null;
    if (arquivo && tuid) { let existia = false; try { existia = fs.existsSync(arquivo); } catch (err) { existia = false; } a.existia.set(tuid, existia); }
    const comando = f === 'Bash' || f === 'PowerShell' ? str(inp.command, 4000) : /^mcp__/.test(f) ? jsonCurto(inp, 4000) : undefined;
    const titulo = f === 'Bash' || f === 'PowerShell' ? 'rodando' : arquivo ? (f === 'Write' ? 'escrevendo ' : 'editando ') + path.basename(String(arquivo)) : (/^mcp__coop__/.test(f) && TITULO_COOP.get(nomeCurto(f))) || nomeCurto(f);
    const b = this.bloco(a, { tipo: 'acao', titulo, texto: resumoDe(f, inp, rel), comando, arquivos: arquivo ? [rel(arquivo)] : undefined, estado: 'rodando', ferramenta: nomeCurto(f), subagente: sub || undefined });
    if (tuid) a.porFerramenta.set(tuid, b.bid);
    return b;
  }

  /* PostToolUse: o que o agente fez (prova) */
  depois(a, e, sub) {
    const f = str(e.tool_name, 120), inp = e.tool_input && typeof e.tool_input === 'object' ? e.tool_input : {}, tuid = str(e.tool_use_id, 120);
    const r = e.tool_response;
    if (!sub) this.estado(a, 'pensando');
    if (f === 'TodoWrite') return this.plano(a, itensTodo((r && r.newTodos) || inp.todos));
    if (f === 'TaskCreate' || f === 'TaskUpdate') return this.tarefa(a, f, inp, r);
    const bid = tuid && a.porFerramenta.get(tuid);
    if (tuid) a.porFerramenta.delete(tuid);
    if (ARQUIVO.has(f)) {
      const abs = str(inp.file_path || inp.notebook_path || (r && r.filePath), 4000);
      if (abs) {
        const existia = a.existia.get(tuid);
        a.existia.delete(tuid);
        const acao = r && r.type === 'create' ? 'criado' : r && r.type === 'update' ? 'editado' : existia === false ? 'criado' : 'editado';
        const caminho = this.rel(abs);
        const dentro = this.dentro(abs);
        this.emitir(a, { tipo: 'agente-arquivo', dono: this.dono(), id: a.id, caminho, absoluto: abs, dentro, acao }, dentro ? (m) => { const p = Object.assign({}, m); delete p.absoluto; delete p.dentro; return p; } : null);
        if (a.turno && !(a.turno.arquivos.get(caminho) === 'criado')) a.turno.arquivos.set(caminho, acao);
        if (a.turno && this.t.pausada(a.id)) a.turno.privados.add(caminho);
        if (bid) this.atualizar(a, bid, { estado: 'feito', titulo: (acao === 'criado' ? 'criei ' : 'editei ') + path.basename(abs), prova: { arquivo: caminho, acao } });
      }
      return;
    }
    if (f === 'Bash' || f === 'PowerShell') {
      const cmd = str(inp.command, 400);
      if (a.turno) a.turno.comandos.push({ comando: cmd, ok: !(r && r.interrupted), privado: this.privado(a, bid) });
      if (bid) this.atualizar(a, bid, { estado: 'feito', titulo: 'rodei', prova: { saida: cauda(r && typeof r === 'object' ? r.stdout : textoDaResposta(r), 1500), erro: cauda(r && r.stderr, 600) || undefined, interrompido: !!(r && r.interrupted) } });
      return;
    }
    if (NAVEGADOR.test(f)) { if (bid === a.navBid) a.navBid = null; return this.fimNavegador(a, bid, textoDaResposta(r), false); }
    if (bid && !ehConsulta(f)) this.atualizar(a, bid, { estado: 'feito', prova: { saida: cauda(textoDaResposta(r), 1500) } });
  }

  /* a ferramenta do navegador voltou: o bloco que os passos já contaram só fecha; o que não teve passo (recusa antes do
     navegador, app sem Electron) ganha a resposta como prova; "sua vez: a senha" vira espera, nunca falha */
  /* devolve true quando a falha já está na tela (senha = espera; erro que o passo mostrou) e não precisa de outro bloco */
  fimNavegador(a, bid, resposta, falhou) {
    const b = bid && a.blocos.find((x) => x.bid === bid);
    if (!b) return false;
    if (SUA_VEZ.test(String(resposta || '').trim()) || b.senha) {
      this.atualizar(a, bid, { tipo: 'espera', titulo: PASSO_TITULO.senha, texto: b.senha ? b.texto : linha(resposta, 400), senha: true, estado: undefined });
      return true;
    }
    if (b.passo_) {
      if (b.tipo === 'acao') this.atualizar(a, bid, { estado: falhou ? 'falhou' : 'feito' });
      return b.tipo === 'falha';
    }
    if (b.tipo !== 'consulta') this.atualizar(a, bid, { estado: falhou ? 'falhou' : 'feito', prova: { saida: cauda(String(resposta || ''), 1500) } });
    return false;
  }

  /* navegador.on('passo') (servidor.js): o passo vira bloco na presença do agente dono da aba, respeitando a pausa
     (bloco/atualizar já seguram o que nasce na pausa). Dentro de uma chamada navegador_* o passo atualiza o bloco dela;
     fora (a pessoa mexendo, passo que chegou sem chamada), o "…" e o "feito" do mesmo tipo dividem um bloco. */
  passoNavegador(p) {
    if (!p || typeof p !== 'object' || typeof p.agente !== 'string') return null;
    const a = this.sessoes.get(p.agente);
    if (!a || a.fim) return null;
    const tp = str(p.tipo, 20);
    let tipo = PASSO_BLOCO[tp];
    if (!tipo) return null; /* navegador pronto, controle, aviso de diálogo, selecionar: ficam só na aba do navegador */
    const arquivo = typeof p.arquivo === 'string' ? relSeguro(p.arquivo.replace(/\\/g, '/')) : null;
    if (tipo === 'resultado' && !(p.feito && arquivo)) tipo = 'acao';
    const m = { tipo, titulo: PASSO_TITULO[tp], texto: linha(p.texto, 400), ferramenta: 'navegador', navegador: tp, passo_: true };
    if (tipo === 'acao') m.estado = p.feito ? 'feito' : 'rodando';
    else m.estado = undefined;
    if (arquivo) { m.arquivos = [arquivo]; m.prova = { arquivo, acao: 'criado' }; }
    if (tp === 'senha') { m.senha = true; this.estado(a, 'espera', 'navegador'); }
    const alvo = a.navBid && a.blocos.find((b) => b.bid === a.navBid);
    if (alvo) return this.atualizar(a, alvo.bid, m);
    const aberto = a.navPasso && a.navPasso.tipo === tp && a.blocos.find((b) => b.bid === a.navPasso.bid);
    if (aberto) { const b = this.atualizar(a, aberto.bid, m); if (p.feito) a.navPasso = null; return b; }
    const b = this.bloco(a, m);
    a.navPasso = p.feito || tipo !== 'acao' ? null : { tipo: tp, bid: b.bid };
    return b;
  }

  falhou(a, e, sub) {
    const f = str(e.tool_name, 120), inp = e.tool_input && typeof e.tool_input === 'object' ? e.tool_input : {}, tuid = str(e.tool_use_id, 120);
    if (!sub) this.estado(a, 'pensando');
    const bid = tuid && a.porFerramenta.get(tuid);
    if (tuid) { a.porFerramenta.delete(tuid); a.existia.delete(tuid); }
    const erro = str(e.error, 2000) || 'a ferramenta falhou';
    if (NAVEGADOR.test(f)) {
      if (bid === a.navBid) a.navBid = null;
      /* senha (sua vez) ou um erro que o passo já mostrou: nada de bloco de falha repetido */
      if (this.fimNavegador(a, bid, erro, true)) return;
      if (e.is_interrupt) return;
      return this.bloco(a, { tipo: 'falha', titulo: 'falhou: ' + nomeCurto(f), texto: erro, ferramenta: nomeCurto(f), subagente: sub || undefined });
    }
    if (bid) this.atualizar(a, bid, { estado: 'falhou' });
    if (a.turno && (f === 'Bash' || f === 'PowerShell')) a.turno.comandos.push({ comando: str(inp.command, 400), ok: false, privado: this.privado(a, bid) });
    if (e.is_interrupt) return;
    return this.bloco(a, { tipo: 'falha', titulo: 'falhou: ' + nomeCurto(f), texto: erro, comando: f === 'Bash' || f === 'PowerShell' ? str(inp.command, 4000) : undefined, ferramenta: nomeCurto(f), subagente: sub || undefined });
  }

  /* TaskCreate / TaskUpdate (as ferramentas de tarefas do Claude Code, quando o TodoWrite não está ligado) */
  tarefa(a, f, inp, r) {
    if (f === 'TaskCreate') {
      let tid = r && ((r.task && r.task.id) || r.id || r.taskId);
      if (tid == null) { const m = /#?(\d+)/.exec(textoDaResposta(r)); tid = m ? m[1] : String(a.tarefas.size + 1); }
      a.tarefas.set(String(tid), { texto: linha(inp.subject || inp.description, 300), estado: 'pendente' });
    } else {
      const t = a.tarefas.get(String(inp.taskId));
      if (!t) return;
      if (inp.status === 'deleted') a.tarefas.delete(String(inp.taskId));
      else { if (inp.status) t.estado = estadoPlano(inp.status); if (inp.subject) t.texto = linha(inp.subject, 300); }
    }
    return this.plano(a, Array.from(a.tarefas.values()).map((t) => ({ texto: t.texto, estado: t.estado })));
  }

  plano(a, itens) {
    if (jsonCurto(itens, 1e6) === jsonCurto(a.plano, 1e6)) return;
    const pausada = this.t.pausada(a.id);
    /* item que nasceu durante a pausa nunca vai para quem assiste, nem depois */
    if (pausada) itens.forEach((i) => { if (!a.planoPub.some((p) => p.texto === i.texto)) a.privados.add(i.texto); });
    this.o.paraLocais({ tipo: 'agente-plano', dono: this.dono(), id: a.id, nome: a.nome, itens, concluidosAgora: concluidosAgora(a.plano, itens) });
    a.plano = itens;
    if (!pausada) {
      const pub = itens.filter((i) => !a.privados.has(i.texto));
      this.o.publicar(a.id, { tipo: 'agente-plano', dono: this.dono(), id: a.id, nome: a.nome, itens: pub, concluidosAgora: concluidosAgora(a.planoPub, pub) });
      a.planoPub = pub;
    }
    const texto = textoPlano(itens);
    if (a.planoBid && a.blocos.some((b) => b.bid === a.planoBid)) this.atualizar(a, a.planoBid, { itens, texto });
    else a.planoBid = this.bloco(a, { tipo: 'plano', titulo: 'plano', texto, itens }).bid;
  }

  /* ---------- PermissionRequest: segura a resposta até a pessoa decidir na tela ---------- */
  permissao(a, e, req, res, responder) {
    const f = str(e.tool_name, 120), inp = e.tool_input && typeof e.tool_input === 'object' ? e.tool_input : {};
    const pid = 'p-' + crypto.randomBytes(6).toString('hex');
    const resumo = resumoDe(f, inp, (c) => this.rel(c));
    const comando = f === 'Bash' || f === 'PowerShell' ? str(inp.command, 4000) : undefined;
    const arquivo = ARQUIVO.has(f) ? this.rel(inp.file_path || inp.notebook_path) : undefined;
    const p = { pid, ferramenta: nomeCurto(f), resumo, res, responder, inicio: agora(), chave: chaveFerramenta(f, inp) };
    this.estado(a, 'espera', nomeCurto(f));
    p.bid = this.bloco(a, { tipo: 'espera', titulo: 'espera você', texto: resumo, comando, arquivos: arquivo ? [arquivo] : undefined, ferramenta: nomeCurto(f), pid }).bid;
    a.pendentes.set(pid, p);
    const telas = this.o.paraLocais({ tipo: 'agente-espera', dono: this.dono(), id: a.id, nome: a.nome, pid, ferramenta: nomeCurto(f), resumo, comando, arquivo, ts: p.inicio });
    /* ninguém na tela para responder: o Claude pergunta no terminal na hora */
    if (!telas) return this.fecharPendente(a, p, undefined, { motivo: 'nenhuma tela aberta: pergunta no terminal' });
    p.timer = setTimeout(() => this.fecharPendente(a, p, undefined, { motivo: 'sem resposta: pergunta no terminal' }), this.tempoPermissao);
    if (p.timer.unref) p.timer.unref();
    /* o Claude desistiu do gancho (a pessoa respondeu no terminal, Esc, o claude saiu) */
    res.on('close', () => { if (!res.writableFinished && a.pendentes.has(pid)) this.fecharPendente(a, p, null, { motivo: 'respondido no terminal' }); });
  }

  fecharPendente(a, p, corpo, { decisao, motivo } = {}) {
    if (!a.pendentes.has(p.pid)) return;
    a.pendentes.delete(p.pid);
    clearTimeout(p.timer);
    if (corpo !== null) p.responder(200, corpo); /* undefined = corpo vazio: o Claude segue o fluxo normal (pergunta no terminal) */
    this.o.paraLocais({ tipo: 'agente-espera-fim', dono: this.dono(), id: a.id, nome: a.nome, pid: p.pid, decisao: decisao || null, motivo: motivo || null, ms: agora() - p.inicio });
    this.atualizar(a, p.bid, { decisao: decisao || 'no terminal', texto: p.resumo + (decisao ? '' : ' · ' + (motivo || 'no terminal')) });
  }
  /* o comando/arquivo nasceu (ou terminou) durante a pausa? então nunca vai para fora */
  privado(a, bid) { if (this.t.pausada(a.id)) return true; const b = bid && a.blocos.find((x) => x.bid === bid); return !!(b && b.privado_); }
  soltarPor(a, e) {
    if (!a.pendentes.size) return;
    const k = chaveFerramenta(str(e.tool_name, 120), e.tool_input);
    Array.from(a.pendentes.values()).filter((p) => p.chave === k).forEach((p) => this.fecharPendente(a, p, undefined, { motivo: 'respondido no terminal' }));
  }
  soltarPendentes(a, motivo) { Array.from(a.pendentes.values()).forEach((p) => this.fecharPendente(a, p, undefined, { motivo })); }

  /* ---------- mensagens ---------- */
  /* para as telas locais sempre; para quem assiste de fora só fora da pausa (nunca depois) */
  emitir(a, msg, paraPar) {
    if (msg && msg.nome == null) msg.nome = a.nome; /* o nome do agente em toda agente-* (placar, meio vivo, parede) */
    this.o.paraLocais(msg);
    if (this.t.pausada(a.id)) return;
    if (paraPar === null) return; /* arquivo fora da pasta compartilhada: só aqui */
    this.o.publicar(a.id, paraPar ? paraPar(msg) : msg);
  }
  estado(a, estado, ferramenta) {
    if (a.est && a.est.estado === estado && a.est.ferramenta === ferramenta) return;
    const t = agora();
    a.est = { estado, ferramenta, desde: t };
    this.emitir(a, { tipo: 'agente-estado', dono: this.dono(), id: a.id, estado, ferramenta, desde: t, ts: t, modelo: estado === 'acordou' ? a.modelo : undefined });
  }
  bloco(a, b) {
    a.seq += 1;
    const bloco = Object.assign({ bid: a.id + '-' + a.seq, ts: agora() }, b);
    Object.keys(bloco).forEach((k) => { if (bloco[k] === undefined) delete bloco[k]; });
    if (this.t.pausada(a.id)) bloco.privado_ = true; /* nasceu na pausa: nunca sai daqui, nem quando for atualizado depois */
    a.blocos.push(bloco);
    if (a.blocos.length > MAX_BLOCOS) a.blocos.shift();
    this.mandarBloco(a, bloco);
    return bloco;
  }
  /* o mesmo bid de novo = o bloco mudou (a ação terminou, o plano andou, a pessoa decidiu) */
  atualizar(a, bid, mudancas) {
    const b = a.blocos.find((x) => x.bid === bid);
    if (!b) return null;
    Object.assign(b, mudancas);
    this.mandarBloco(a, b);
    return b;
  }
  mandarBloco(a, b) {
    this.o.paraLocais({ tipo: 'agente-bloco', dono: this.dono(), id: a.id, nome: a.nome, bloco: semInternos(b) });
    if (b.privado_ || this.t.pausada(a.id)) return;
    /* para quem assiste: sem o que nasceu na pausa (itens do plano, arquivos do turno) */
    const pub = semInternos(Object.assign({}, b, b.pub_ || {}));
    if (Array.isArray(pub.itens) && a.privados.size) { pub.itens = pub.itens.filter((i) => !a.privados.has(i.texto)); if (pub.tipo === 'plano') pub.texto = textoPlano(pub.itens); }
    this.o.publicar(a.id, { tipo: 'agente-bloco', dono: this.dono(), id: a.id, nome: a.nome, bloco: pub });
    const i = a.blocosPub.findIndex((x) => x.bid === pub.bid);
    if (i >= 0) a.blocosPub[i] = pub; else { a.blocosPub.push(pub); if (a.blocosPub.length > MAX_BLOCOS) a.blocosPub.shift(); }
  }

  /* ---------- caminhos ---------- */
  pastas() {
    const p = this.cfg().pasta;
    const r = [p];
    try { const real = fs.realpathSync(p); if (real !== p) r.push(real); } catch (e) { /* ainda não existe */ }
    return r;
  }
  relDe(abs) {
    if (typeof abs !== 'string' || !abs) return null;
    for (const base of this.pastas()) {
      const r = path.relative(base, abs);
      if (r && !r.startsWith('..') && !path.isAbsolute(r)) return r.split(path.sep).join('/');
    }
    return null;
  }
  dentro(abs) { return this.relDe(abs) != null; }
  /* relativo à pasta compartilhada quando está dentro dela; fora, o caminho absoluto */
  rel(abs) { if (typeof abs !== 'string' || !abs) return ''; return this.relDe(abs) || abs; }

  /* ---------- fim do agente ---------- */
  vigiar() {
    this.sessoes.forEach((a, id) => {
      if (a.fim) return;
      if (!this.t.existe(id)) return this.encerrar(id, 'o terminal fechou');
      const parado = this.t.parado(id);
      /* "viu" = o SessionStart chegou ou o processo da frente é o claude (outro programa na frente não conta) */
      if (!parado) { const i = this.t.info(id, false); if (i && ehClaude(i.processo)) a.viu = true; return; }
      if (a.viu) this.encerrar(id, 'o claude saiu');
    });
  }
  encerrar(id, motivo) {
    const a = this.sessoes.get(id);
    if (!a || a.fim) return;
    a.fim = agora();
    clearTimeout(a.arranque);
    this.soltarPendentes(a, motivo);
    a.segredo = null; /* ganchos e MCP desta sessão passam a receber 403 */
    this.apagar(a);
    this.emitir(a, { tipo: 'agente-fim', dono: this.dono(), id, motivo, ts: a.fim });
  }
  apagar(a) {
    Object.values(a.arq).forEach((f) => { try { fs.unlinkSync(f); } catch (e) { /* já foi */ } });
    try { fs.rmdirSync(a.pasta); } catch (e) { /* não vazia ou já foi */ }
  }
  parar() {
    clearInterval(this.vigia);
    this.sessoes.forEach((a, id) => this.encerrar(id, 'o servidor parou'));
  }
}

module.exports = { Agentes, limparDePar, argumentos, linhaDeComando, aspasPosix, configGanchos, configMcp, textoDoPrompt, itensTodo, concluidosAgora, nomeCurto, ehConsulta, resumoDe, mesmoSegredo };
