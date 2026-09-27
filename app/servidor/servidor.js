/* Babel Coop · o servidor de cada computador
   - serve a Estação (a mesma interface do protótipo, com ponte.js por cima) para esta máquina, o celular e a TV na rede local
   - guarda o diário de eventos e replica com os outros computadores (rede.js)
   - serve a pasta compartilhada desta pessoa e busca as dos outros direto na Estação deles
   - transmite os terminais (terminal.js) para quem assiste e aceita teclas de quem tem controle (controle.js)
   - roda o `claude` no pty de cada agente e o observa por ganchos http em /api/gancho/<sessao> (agentes.js, PROTOCOLO §7);
     o conector coop (MCP) responde em /mcp/<sessao> (coop-mcp.js, §8); os dois só com o segredo da sessão e só de loopback
   Confiança (PROTOCOLO §1):
   - navegador local = WebSocket de loopback com Origin http://localhost:<porta> (ou 127.0.0.1): só ele manda e recebe term-*, controle-*, projetos;
   - navegador de outro aparelho (celular, iPad): diário e pares, nunca terminal; das ações, só as do quadro e da TV (REMOTO_PODE); Origin tem de ser a do próprio endereço;
   - par (/ws?par=1): nada antes do aperto de mão; id e papel vêm da carteira; o que chega dele leva dono = par.id.
   Sobe junto com o app (main.js) ou sozinho: `node servidor/servidor.js`.
*/
'use strict';
const http = require('http');
const fs = require('fs');
const net = require('net');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');
const config = require('./config');
const token = require('./token');
const { Diario, assinarEvento, motivoEvento } = require('./diario');
const { Arquivos } = require('./arquivos');
const { Terminais } = require('./terminal');
const { Controle } = require('./controle');
const { Rede } = require('./rede');
const { Atualizacao } = require('./atualizacao');
const { Agentes, limparDePar: limparAgente } = require('./agentes');
const { Acervo } = require('./acervo');
const { Bancos } = require('./banco');
const { Entrada } = require('./entrada');

const PASTA_UI_PADRAO = fs.existsSync(path.join(__dirname, '..', '..', 'prototipo')) ? path.join(__dirname, '..', '..', 'prototipo') : path.join(process.resourcesPath || '', 'prototipo');
const PASTA_INTERFACE = path.join(__dirname, '..', 'interface'); /* o que o app real acrescenta à interface do protótipo (terminal real, parede, organismo) */
/* xterm.js vem do node_modules, servido pela própria Estação: funciona sem internet */
const VENDOR = {
  'xterm.js': require.resolve('@xterm/xterm/lib/xterm.js'),
  'xterm.css': require.resolve('@xterm/xterm/css/xterm.css'),
  'addon-fit.js': require.resolve('@xterm/addon-fit/lib/addon-fit.js')
};
/* three.js: no app empacotado vem em Resources/three (extraResources: o electron-builder não põe pastas examples/ no asar); no repositório, de node_modules */
const PASTA_THREE = (() => {
  const empacotado = process.resourcesPath ? path.join(process.resourcesPath, 'three') : '';
  if (empacotado && fs.existsSync(path.join(empacotado, 'build', 'three.module.js'))) return empacotado;
  try { return path.dirname(path.dirname(require.resolve('three'))); } catch (e) { return path.join(__dirname, '..', 'node_modules', 'three'); }
})();
/* sem internet: marked, DOMPurify, highlight.js, pdf.js e as três fontes também vêm de dentro do app (o protótipo puro usa a CDN
   e o Google Fonts; semInternet troca esses endereços no HTML servido). Pacote que faltar: a página cai no que faz sem a biblioteca */
[['marked.min.js', 'marked/marked.min.js'], ['purify.min.js', 'dompurify/dist/purify.min.js'], ['highlight.min.js', '@highlightjs/cdn-assets/highlight.min.js'], ['pdf.min.js', 'pdfjs-dist/build/pdf.min.js'], ['pdf.worker.min.js', 'pdfjs-dist/build/pdf.worker.min.js']]
  .forEach(([nome, arquivo]) => { try { VENDOR[nome] = require.resolve(arquivo); } catch (e) { /* sem o pacote */ } });
/* os mesmos pesos que o protótipo pede ao Google Fonts (e o 600 do JetBrains Mono, que o mapa mental pede); @fontsource traz cada peso em woff2 por alfabeto (unicode-range) */
const FONTES = { 'ibm-plex-sans': ['400', '500', '600'], 'jetbrains-mono': ['400', '500', '600', '700'], 'cormorant-garamond': ['500', '600', '500-italic'] };
const pastaFonte = (familia) => { try { return path.dirname(require.resolve('@fontsource/' + familia + '/package.json')); } catch (e) { return null; } };
let cssFontes = null;
function fontesCss() {
  if (cssFontes === null) {
    cssFontes = Object.keys(FONTES).map((f) => FONTES[f].map((peso) => {
      try { return fs.readFileSync(path.join(pastaFonte(f), peso + '.css'), 'utf8').split('url(./files/').join('url(/vendor/fontes/' + f + '/'); } catch (e) { return ''; }
    }).join('\n')).join('\n');
  }
  return cssFontes;
}
function semInternet(html) {
  return html
    .replace(/<link rel="preconnect" href="https:\/\/fonts\.(?:googleapis|gstatic)\.com"[^>]*>\s*/g, '')
    .replace(/https:\/\/fonts\.googleapis\.com\/css2\?[^"']*/g, '/vendor/fontes.css')
    .replace(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/[a-z0-9.-]+\/[0-9.]+\/([a-z0-9.-]+\.js)/g, (tudo, nome) => (VENDOR[nome] ? '/vendor/' + nome : tudo));
}
const MIME = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json; charset=utf-8', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', ico: 'image/x-icon', md: 'text/markdown; charset=utf-8', txt: 'text/plain; charset=utf-8', pdf: 'application/pdf', mp4: 'video/mp4', webp: 'image/webp', gif: 'image/gif', woff2: 'font/woff2', woff: 'font/woff', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4', webm: 'video/webm', mov: 'video/quicktime', htm: 'text/html; charset=utf-8', ttf: 'font/ttf', otf: 'font/otf', eot: 'application/vnd.ms-fontobject', avif: 'image/avif', xml: 'application/xml; charset=utf-8', csv: 'text/csv; charset=utf-8', mjs: 'text/javascript; charset=utf-8', bmp: 'image/bmp', map: 'application/json; charset=utf-8' };
/* a pasta compartilhada servida como site (/pasta/…): a página nunca ganha a origem da Estação (sandbox sem allow-same-origin =
   origem opaca "null"): o servidor recusa o Origin dela no /api/convite, /api/evento, /api/fundar e no WebSocket, e ela não lê
   resposta de /api/* (sem CORS). allow-scripts fica: sem ele o Chromium não roda nem o JavaScript do navegador do agente
   (ler, clicar, raio-X) na cópia aberta; o clone em si já sai sem scripts. Medido no e2e do navegador (23/09/2026). */
const CSP_PASTA = 'sandbox allow-scripts allow-forms allow-popups';

/* o que entra na página antes do app.js (PROTOCOLO §0 e parte 2): estilos, COOP_REAL, xterm, a ponte e as peças reais da interface.
   Ordem: organismo antes de tudo que acende; terminal-real, parede-real, navegador-real, coop-ui, nascendo, placar. */
const ESTILOS = ['/vendor/xterm.css', '/coop/terminal-real.css', '/coop/parede-real.css', '/coop/navegador-real.css', '/coop/nascendo.css', '/coop/placar.css'];
const SCRIPTS = ['/vendor/xterm.js', '/vendor/addon-fit.js', 'ponte.js', '/coop/limpo.js', '/coop/arquivos-real.js', '/coop/organismo.js', '/coop/terminal-real.js', '/coop/parede-real.js', '/coop/navegador-real.js', '/coop/coop-ui.js', '/coop/nascendo.js', '/coop/placar.js'];
/* os arquivos de app/interface/midia (a textura do anel, o vídeo do b): a interface só pede o que existe */
function listarMidia() {
  try { return fs.readdirSync(path.join(PASTA_INTERFACE, 'midia')).filter((n) => !n.startsWith('.') && fs.statSync(path.join(PASTA_INTERFACE, 'midia', n)).isFile()).sort(); } catch (e) { return []; }
}
/* remoto (celular, iPad, TV pelo IP): a página recebe a lista do que o servidor aceita dela (REMOTO_PODE, abaixo) e acoes.js
   nem aplica o resto, senão a tela mostraria uma ação que o diário nunca guarda */
function INJETAR(terminalReal, midia, remoto) {
  return ESTILOS.map((h) => '<link rel="stylesheet" href="' + h + '">').join('\n') + '\n' +
    '<script>window.COOP_REAL = ' + JSON.stringify(Object.assign({ terminal: !!terminalReal, midia: Array.isArray(midia) ? midia : listarMidia() }, remoto ? { remoto: [...REMOTO_PODE.keys()] } : {}, process.env.BABEL_COOP_EXEMPLOS === '1' ? { exemplos: true } : {})).replace(/</g, '\\u003c') + ';</script>\n' +
    SCRIPTS.map((s) => '<script src="' + s + '"></script>').join('\n');
}

/* ---------- confiança ---------- */
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const ehLoopback = (endereco) => LOOPBACK.has(String(endereco || ''));
function hostnameDe(host) {
  host = String(host || '').toLowerCase();
  const v6 = host.match(/^\[([^\]]+)\](?::\d+)?$/);
  if (v6) return v6[1];
  return host.replace(/:\d+$/, '');
}
/* anti "DNS rebinding": só atende nome que não dá para apontar para cá de fora (IP, localhost, nome .local da rede) */
function hostAceito(host) { const h = hostnameDe(host); return !!h && (h === 'localhost' || net.isIP(h) !== 0 || /\.local$/.test(h)); }
const origensLocais = (porta) => ['http://localhost:' + porta, 'http://127.0.0.1:' + porta, 'http://[::1]:' + porta];
/* celular, iPad e TV pela rede ainda não têm login (CHECKLIST: nome + PIN): o que mandam sai assinado como o dono desta Estação.
   Por isso só passa o que o iPad usa de verdade (ipad.js, quadro.js): desenhar no quadro, criar quadro vazio e pô-lo ao vivo na TV.
   A TV não faz ação nenhuma; o resto fica para a própria Estação. Map (e não objeto): 'toString' não vira ação permitida. */
const QUADRO_VAZIO = JSON.stringify({ itens: [] });
const eTexto = (v, max) => typeof v === 'string' && v.length > 0 && v.length <= max;
const eObjeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const REMOTO_PODE = new Map([
  ['quadroItem', (a) => a.length === 2 && eTexto(a[0], 120) && eObjeto(a[1])],
  ['quadroMudar', (a) => a.length === 3 && eTexto(a[0], 120) && eTexto(a[1], 120) && eObjeto(a[2])],
  ['quadroApagar', (a) => a.length === 2 && eTexto(a[0], 120) && eTexto(a[1], 120)],
  ['criarArquivo', (a) => a.length === 3 && eTexto(a[0], 200) && /^equipe\/Quadros\/[^/\\]+\.quadro$/.test(a[0]) && !a[0].includes('..') && a[1] === 'quadro' && a[2] === QUADRO_VAZIO],
  ['tvModo', (a) => (a[0] === 'quadro' && a.length === 2 && eTexto(a[1], 120)) || (a[0] === 'painel' && a.length <= 2 && a[1] == null)]
]);
function remotoPode(acao, args) { const f = REMOTO_PODE.get(acao); return !!f && f(args); }
/* navegador desta máquina: loopback + Origin (ou, sem Origin, um Host local: curl, testes, o próprio app) */
function pedidoLocal(req, porta) {
  if (!ehLoopback(req.socket.remoteAddress)) return false;
  const origem = req.headers.origin;
  if (origem) return origensLocais(porta).includes(origem);
  return ['localhost', '127.0.0.1', '::1'].includes(hostnameDe(req.headers.host));
}

function iniciar(opcoes) {
  opcoes = opcoes || {};
  /* bemvindo.agentes = true libera a presença a chamar o agente sozinha (agente-iniciar) e o campo ❯ endereçado.
     BABEL_COOP_AGENTES=0 desliga (os e2e que não querem um claude de verdade rodando); o servidor continua aceitando agente-iniciar */
  const agentesLigados = process.env.BABEL_COOP_AGENTES !== '0';
  const navegador = opcoes.navegador || null;
  const oficina = opcoes.oficina || null;
  let cfg = config.carregar();
  /* Estação de antes da carteira (token v1): a gestão ganha chaves; membro volta a pedir token */
  if (cfg.segredo && !cfg.carteira) {
    if (cfg.papel === 'gestao') cfg = config.salvar(Object.assign(cfg, token.completarGestao(cfg)));
    else { delete cfg.segredo; cfg = config.salvar(cfg); }
  }
  const diario = new Diario(cfg.diario, cfg.id);
  /* cada evento meu sai assinado pela minha carteira; evento de fora (ao vivo ou repassado) só entra com a assinatura do autor */
  diario.assinar = (ev) => { if (cfg.carteira && cfg.privada && cfg.carteira.id === ev.autor) assinarEvento(ev, cfg); };
  diario.conferir = (ev) => !motivoEvento(ev, cfg);
  const arquivos = new Arquivos(cfg.pasta, cfg.id);
  let vigiada = cfg.pasta; /* a pasta que o fs.watch acompanha */
  /* ---------- acervo (IDEIAS §8.1–8.2, servidor/acervo.js): SQLite derivado do histórico cru (diário, saída dos terminais, pasta).
     Sem node:sqlite neste runtime, a Estação segue sem acervo (as ferramentas coop_buscar/coop_aprendi voltam a ir para a tela). */
  let acervo = null;
  const perguntasAcervo = new Map(); /* pid → {par, ok}: busca federada pelo canal de pares */
  try {
    acervo = new Acervo({
      raiz: cfg.raiz, pasta: () => cfg.pasta, eu: () => cfg.id,
      nomeDe: (id) => (id === cfg.id ? cfg.nome : ((rede && rede.par(id)) || {}).nome || id),
      anexar: (quem, acao, args) => diario.anexar(quem, acao, args),
      eventos: () => diario.todos(),
      pares: () => (rede ? rede.lista().map((p) => ({ id: p.id, nome: p.nome, ligado: p.ligado, perguntar: (q, o) => perguntarAcervo(p.id, q, o) })) : [])
    });
  } catch (e) { console.error('[babel-coop] acervo indisponível: ' + e.message); acervo = null; }
  function perguntarAcervo(parId, q, o) {
    return new Promise((ok, erro) => {
      const pid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const t = setTimeout(() => { perguntasAcervo.delete(pid); erro(new Error('sem resposta')); }, 2500);
      perguntasAcervo.set(pid, { par: parId, ok: (lista) => { clearTimeout(t); ok(lista); } });
      if (!rede || !rede.enviar(parId, { tipo: 'acervo-buscar', pid, q: String(q || '').slice(0, 300), modo: (o && o.modo) || 'tudo', limite: (o && o.limite) || 10 })) { clearTimeout(t); perguntasAcervo.delete(pid); erro(new Error('fora da rede')); }
    });
  }
  /* ---------- banco real de cada projeto (servidor/banco.js, PGlite): dados em <raiz>/.coop/bancos, migrações na pasta ----------
     o banco é deste computador e a pasta é da equipe: o cabeçalho de cada migração diz de qual Estação é o banco */
  const bancos = new Bancos({ raiz: () => cfg.raiz, pasta: () => cfg.pasta, eu: () => ({ id: cfg.id, nome: cfg.nome }) });
  const terminais = new Terminais(cfg);
  const controle = new Controle(cfg);
  const atualizacao = new Atualizacao(cfg, PASTA_UI_PADRAO, path.join(__dirname, '..', 'ponte.js'));
  const locais = new Set();    /* telas desta máquina (Estação, TV): recebem terminal */
  const remotos = new Set();   /* celular, iPad pela rede: diário e pares, nunca terminal */
  const assinantes = new Map();  /* sessão minha → Set de ids de pares que assistem */
  const assistindo = new Map();  /* 'dono/id' de terminal de outro → Set de telas locais que assistem */
  const listasPares = new Map(); /* dono → lista pública dos terminais dele */
  const publicosPares = new Map(); /* dono → controles ativos nos terminais dele (resumo público, para a parede de todos) */
  let rede = null;

  /* ---------- utilidades ---------- */
  const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': MIME.json, 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
  const corpo = (req) => new Promise((ok) => { let s = ''; req.on('data', (c) => { s += c; if (s.length > 20e6) req.destroy(); }); req.on('end', () => { try { ok(JSON.parse(s || '{}')); } catch (e) { ok({}); } }); });
  const mandar = (ws, msg) => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg)); };
  /* devolve para quantas telas foi (0 = nenhuma tela desta máquina aberta) */
  const paraLocais = (msg) => { if (!locais.size) return 0; const t = JSON.stringify(msg); let n = 0; locais.forEach((ws) => { if (ws.readyState === WebSocket.OPEN) { ws.send(t); n += 1; } }); return n; };
  const paraTodos = (msg) => { const t = JSON.stringify(msg); [locais, remotos].forEach((c) => c.forEach((ws) => { if (ws.readyState === WebSocket.OPEN) ws.send(t); })); };
  const pronto = () => !!(cfg.segredo && cfg.carteira);
  const quem = () => ({ id: cfg.id, nome: cfg.nome, papel: cfg.papel, equipe: cfg.equipe || null, pronto: pronto() });
  const texto = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
  const idSessao = (v) => (typeof v === 'string' && /^[A-Za-z0-9_-]{1,48}$/.test(v) ? v : null);
  const idPessoa = (v) => (typeof v === 'string' && token.ID.test(v) ? v : null);
  const mandarControles = () => paraLocais({ tipo: 'controles', lista: controle.lista() });
  /* resumo público dos controles ATIVOS nos meus terminais: quem está no terminal de quem ("● Carla aqui" na parede de todos) */
  const controlesPublico = () => controle.lista().filter((c) => c.dono === cfg.id && c.estado === 'ativo').map((c) => ({ dono: cfg.id, quem: c.quem, sessao: c.sessao == null ? null : c.sessao }));
  let ultimoPublico = '';
  const espalharPublico = (forcar) => { if (!rede) return; const lista = controlesPublico(); const t = JSON.stringify(lista); if (!forcar && t === ultimoPublico) return; ultimoPublico = t; rede.espalhar({ tipo: 'controles-publico', lista }); };

  /* ---------- agentes (o claude no pty, observado por ganchos: PROTOCOLO §7) e o conector coop (MCP: §8) ---------- */
  const agentes = new Agentes({
    cfg: () => cfg, terminais, paraLocais, porta: () => cfg.porta,
    contexto: (m) => {
      if (!m.oficina) return null;
      if (!oficina) throw new Error('Abra a Oficina no aplicativo desta Estação.');
      oficina.cfg = cfg;
      return oficina.contextoAgente();
    },
    /* o agente nasce sabendo o que a equipe aprendeu; o resultado dele (só a saída, fora da pausa) vira histórico de terminal */
    saber: () => (acervo ? acervo.resumoParaAgente(20) : ''),
    aoResultado: (r) => { if (acervo && !r.pausado) acervo.terminal(Object.assign({ autor: cfg.id, dono: cfg.id }, r)); },
    /* para quem assiste a sessão de fora (a pausa já foi conferida em agentes.js) */
    publicar: (id, msg) => { if (!rede) return; const quemAssiste = assinantes.get(id); if (quemAssiste) quemAssiste.forEach((pid) => rede.enviar(pid, msg)); }
  });
  /* mcp-chamada vai para UMA tela (senão a Estação e a TV fariam a ação duas vezes): a que chamou o agente, ou a mais recente */
  const pedirUi = (msg) => {
    let alvo = agentes.tela(msg && msg.sessao);
    if (!alvo || !locais.has(alvo) || alvo.readyState !== WebSocket.OPEN) alvo = Array.from(locais).reverse().find((ws) => ws.readyState === WebSocket.OPEN);
    if (!alvo) return 0;
    mandar(alvo, msg);
    return 1;
  };
  let coop;
  try {
    coop = require('./coop-mcp').criar({ cfg: () => cfg, enviarUi: paraLocais, pedirUi, navegador, agentes, acervo: () => acervo });
  } catch (e) {
    console.error('[babel-coop] conector coop indisponível: ' + e.message);
    coop = { tratar: (req, res) => json(res, 503, { erro: 'conector coop indisponível nesta versão' }), aoMensagemUi: () => false, ferramentas: () => [], parar: () => {} };
  }

  /* navegador próprio (§9): cada passo do agente na aba do navegador vira bloco na presença dele (abrir/clicar/digitar = ação,
     ler/raio-X = consulta, senha = espera, clonar/copy/print pronto = resultado), com a mesma regra de pausa dos ganchos */
  const aoPassoNavegador = (p) => { try { agentes.passoNavegador(p); } catch (e) { console.error('[babel-coop] passo do navegador:', e.message); } };
  if (navegador && typeof navegador.on === 'function') navegador.on('passo', aoPassoNavegador);

  /* a identidade mudou (fundou ou colou o token): diário e pasta passam a ser da pessoa nova */
  function novaIdentidade() {
    diario.autor = cfg.id;
    diario.seq = diario.eventos.reduce((m, ev) => (ev.autor === cfg.id && ev.seq > m ? ev.seq : m), 0);
    arquivos.pasta = cfg.pasta; arquivos.dono = cfg.id;
    if (acervo) acervo.arquivoMudou(); /* a pasta nova entra no acervo */
    if (vigiada !== cfg.pasta) { vigiada = cfg.pasta; arquivos.vigiar(aoMudarPasta); }
    arquivos.revigiar(); /* sem isto a árvore não via o que muda na pasta nova até reabrir o app */
  }

  /* ---------- rede entre computadores ---------- */
  function ligarRede() {
    if (rede) rede.parar();
    rede = null;
    if (!pronto()) return entrada.escutar(); /* sem equipe: escuta os anúncios da gestão para pedir para entrar (entrada.js) */
    entrada.calar();
    diario.assinarMeus(); /* o histórico de antes da assinatura vai aos pares assinado */
    rede = new Rede(cfg, diario, aoMensagemDePar);
    rede.aoMudar((pares) => paraTodos({ tipo: 'pares', lista: pares }));
    rede.aoLigar((par) => {
      rede.enviarPar(par, { tipo: 'term-lista', dono: cfg.id, lista: terminais.lista(true) });
      rede.enviarPar(par, { tipo: 'controles-publico', lista: controlesPublico() });
      /* voltou: as minhas telas que assistiam algo dele pedem de novo */
      assistindo.forEach((telas, chave) => { const [dono, id] = chave.split('/'); if (dono === par.id && telas.size) rede.enviarPar(par, { tipo: 'term-assistir', id }); });
    });
    rede.aoCair((par) => {
      controle.parCaiu(par.id);
      assinantes.forEach((s) => s.delete(par.id));
      if (listasPares.delete(par.id)) paraLocais({ tipo: 'term-lista', dono: par.id, lista: [] });
      if (publicosPares.delete(par.id)) paraLocais({ tipo: 'controles-publico', dono: par.id, lista: [] });
    });
    rede.iniciar();
  }

  /* o que chega de outra Estação (já verificada pela rede.js; par.id e par.papel vêm da carteira) */
  function aoMensagemDePar(par, m) {
    const id = idSessao(m.id);
    const recusar = (motivo) => rede.enviarPar(par, { tipo: 'term-recusado', dono: cfg.id, id, motivo });
    switch (m.tipo) {
      /* --- sou o dono do terminal --- */
      case 'term-lista?': rede.enviarPar(par, { tipo: 'term-lista', dono: cfg.id, lista: terminais.lista(true) }); return;
      case 'term-assistir':
        if (!id || !terminais.existe(id)) return recusar('terminal não existe');
        /* entra na lista de quem assiste só no callback da tela: não perde nem repete pedaço de saída */
        terminais.tela(id, true, (tela) => {
          if (!tela || !rede.ligado(par)) return;
          rede.enviarPar(par, tela);
          /* o agente desta sessão até aqui (só o que saiu fora da pausa) */
          const resumo = agentes.resumo(id, true);
          if (resumo) rede.enviarPar(par, resumo);
          if (!assinantes.has(id)) assinantes.set(id, new Set());
          assinantes.get(id).add(par.id);
        });
        return;
      case 'term-parar': if (id && assinantes.has(id)) assinantes.get(id).delete(par.id); return;
      case 'term-entrada':
        if (!id || !terminais.existe(id)) return recusar('terminal não existe');
        if (typeof m.dados !== 'string' || !m.dados) return;
        if (terminais.pausada(id)) return recusar('pausado');
        if (!controle.podeDigitar(par.id, id)) return recusar('sem permissão');
        terminais.escrever(id, m.dados);
        return;
      case 'term-pedir': {
        const sessao = m.sessao == null ? null : idSessao(m.sessao);
        if (m.sessao != null && (!sessao || !terminais.existe(sessao))) return rede.enviarPar(par, { tipo: 'term-recusado', dono: cfg.id, id: sessao, motivo: 'terminal não existe' });
        controle.pedir({ id: par.id, papel: par.papel }, sessao);
        return;
      }
      case 'controle-sair': if (typeof m.id === 'string') controle.sair(m.id, par.id); return;

      /* --- assisto o terminal dele: repasso às minhas telas com dono = par.id --- */
      case 'term-lista': {
        const lista = (Array.isArray(m.lista) ? m.lista : []).slice(0, 64).map((i) => infoLimpa(i, par.id)).filter(Boolean);
        listasPares.set(par.id, lista);
        paraLocais({ tipo: 'term-lista', dono: par.id, lista });
        return;
      }
      case 'term-saida': if (id && typeof m.dados === 'string') paraAssistentes(par.id, id, { tipo: 'term-saida', dono: par.id, id, dados: m.dados }); return;
      case 'term-tela':
        if (id) paraAssistentes(par.id, id, { tipo: 'term-tela', dono: par.id, id, cols: +m.cols || 0, rows: +m.rows || 0, pausada: !!m.pausada, dados: texto(m.dados, 16e6) });
        return;
      case 'term-tamanho': if (id) paraLocais({ tipo: 'term-tamanho', dono: par.id, id, cols: +m.cols || 0, rows: +m.rows || 0 }); return;
      case 'term-pausa': if (id) paraLocais({ tipo: 'term-pausa', dono: par.id, id, pausada: !!m.pausada }); return;
      case 'term-atividade': if (id) paraLocais(atividadeLimpa(m, par.id, id)); return;
      case 'term-fim': if (id) { paraLocais({ tipo: 'term-fim', dono: par.id, id, codigo: m.codigo == null ? null : +m.codigo }); assistindo.delete(par.id + '/' + id); } return;
      case 'term-recusado': paraLocais({ tipo: 'term-recusado', dono: par.id, id, motivo: texto(m.motivo, 80) }); return;
      /* o agente de uma sessão dele que eu assisto: só campos conhecidos, dono = par.id */
      case 'agente-estado': case 'agente-bloco': case 'agente-plano': case 'agente-arquivo': case 'agente-fim': case 'agente-resumo': {
        const limpo = id && limparAgente(m, par.id);
        /* agente-fim não tem conteúdo e pode chegar depois do term-fim (que já desfez quem assistia): vai a todas as minhas telas */
        if (limpo) { if (limpo.tipo === 'agente-fim') paraLocais(limpo); else paraAssistentes(par.id, id, limpo); }
        return;
      }
      case 'controle': controle.espelhar(par.id, m.c); return;
      /* resumo público do dono: só campos conhecidos; o dono é sempre quem mandou (par.id), nunca o que ele declara */
      case 'controles-publico': {
        const lista = (Array.isArray(m.lista) ? m.lista : []).slice(0, 64).map((c) => (c && idPessoa(c.quem) && c.quem !== par.id && (c.sessao == null || idSessao(c.sessao)) ? { dono: par.id, quem: c.quem, sessao: c.sessao == null ? null : c.sessao } : null)).filter(Boolean);
        publicosPares.set(par.id, lista);
        paraLocais({ tipo: 'controles-publico', dono: par.id, lista });
        return;
      }
      case 'controle-fim':
        if (typeof m.id === 'string') { controle.fimEspelho(par.id, m.id); paraLocais({ tipo: 'controle-fim', dono: par.id, id: m.id.slice(0, 40), motivo: texto(m.motivo, 40) }); }
        return;

      /* --- arquivos (como antes) --- */
      /* --- acervo federado (§8.1): outra Estação busca no meu acervo; quem consulta é o par (da carteira) --- */
      case 'acervo-buscar': {
        let lista = [];
        try { if (acervo) lista = acervo.buscar(texto(m.q, 300), { modo: texto(m.modo, 12), quem: par.id, limite: Math.min(20, +m.limite || 10) }); } catch (e) { lista = []; }
        rede.enviarPar(par, { tipo: 'acervo-achados', pid: texto(m.pid, 24), lista });
        return;
      }
      case 'acervo-achados': { const pa = perguntasAcervo.get(texto(m.pid, 24)); if (pa && pa.par === par.id) { perguntasAcervo.delete(m.pid); pa.ok(Array.isArray(m.lista) ? m.lista.slice(0, 20) : []); } return; }
      case 'arquivos?': rede.enviarPar(par, { tipo: 'arquivos', dono: cfg.id, lista: arquivos.listar() }); return;
      case 'arquivos': paraTodos({ tipo: 'arquivos', dono: par.id, lista: Array.isArray(m.lista) ? m.lista : [] }); return;
      default: return;
    }
  }

  function infoLimpa(i, dono) {
    if (!i || !idSessao(i.id)) return null;
    const o = { id: i.id, nome: texto(i.nome, 60) || i.id, dono, pid: +i.pid || null, cols: +i.cols || 0, rows: +i.rows || 0, pausada: !!i.pausada, criada: +i.criada || null, estado: texto(i.estado, 12) };
    if (!i.pausada && typeof i.processo === 'string') o.processo = i.processo.slice(0, 60);
    return o;
  }
  function atividadeLimpa(m, dono, id) {
    const a = { tipo: 'term-atividade', dono, id, estado: texto(m.estado, 12), desde: +m.desde || null };
    if (a.estado === 'pausado') return a;
    if (typeof m.processo === 'string') a.processo = m.processo.slice(0, 60);
    if (m.bytes != null) a.bytes = +m.bytes || 0;
    if (m.duracao != null) a.duracao = +m.duracao || 0;
    if (m.fim != null) a.fim = +m.fim || null;
    return a;
  }
  function paraAssistentes(dono, id, msg) {
    const telas = assistindo.get(dono + '/' + id);
    if (!telas) return;
    const t = JSON.stringify(msg);
    telas.forEach((ws) => { if (ws.readyState === WebSocket.OPEN) ws.send(t); });
  }

  /* ---------- os meus terminais: para as minhas telas e para quem assiste de fora ---------- */
  terminais.aoLocal((msg) => paraLocais(msg));
  terminais.aoPublico((msg) => {
    if (!rede) return;
    if (msg.tipo === 'term-saida' || msg.tipo === 'term-tela') {
      const quemAssiste = assinantes.get(msg.id);
      if (quemAssiste) quemAssiste.forEach((pid) => rede.enviar(pid, msg));
      return;
    }
    rede.espalhar(msg);
  });
  terminais.aoFechar((id) => { assinantes.delete(id); controle.sessaoFechou(id); });

  /* ---------- controle: avisa quem pediu e as minhas telas ---------- */
  controle.aoMudar((ev) => {
    if (ev.c && rede && !ev.semAviso) {
      if (ev.fim) rede.enviar(ev.c.quem, { tipo: 'controle-fim', id: ev.c.id, motivo: ev.motivo });
      else rede.enviar(ev.c.quem, { tipo: 'controle', c: ev.c });
    }
    mandarControles();
    espalharPublico(false);
  });

  /* ---------- eventos do diário: os meus vão para os pares; todos vão para as minhas telas ---------- */
  diario.aoNovo((ev, meu) => {
    paraTodos({ tipo: 'evento', evento: ev });
    if (meu && rede) rede.espalhar({ tipo: 'evento', evento: ev });
    if (acervo) { try { acervo.evento(ev); } catch (e) { console.error('[babel-coop] acervo (evento): ' + e.message); } } /* tudo o que acontece vira dado */
  });

  /* a pasta muda de nome quando a identidade muda (fundar, token): novaIdentidade vigia a nova com o mesmo aviso */
  function aoMudarPasta() { if (acervo) acervo.arquivoMudou(); paraTodos({ tipo: 'arquivos', dono: cfg.id, lista: arquivos.listar() }); if (rede) rede.espalhar({ tipo: 'arquivos', dono: cfg.id, lista: arquivos.listar() }); }
  arquivos.vigiar(aoMudarPasta);

  /* ---------- /pasta/<caminho>: a pasta compartilhada como site estático (clone aberto "como site" pelo servidor) ----------
     Mesma regra do /api/arquivo (arquivos.seguro: nada fora da pasta, nada de .env/.ssh/.git/.coop) e, além disso, o caminho
     real (sem atalho simbólico que saia da pasta). Pasta sem barra final → 301 com a barra (os caminhos relativos do clone
     funcionam); pasta com barra → index.html. Cabeçalho CSP sandbox sem allow-same-origin: a página nunca vira a Estação. */
  function servirPasta(req, res, p, url) {
    const falta = () => { res.writeHead(404, { 'Content-Type': MIME.txt, 'Cache-Control': 'no-store' }); res.end('não achei'); };
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
    let rel;
    try { rel = p.replace(/^\/pasta\/?/, '').split('/').map(decodeURIComponent).join('/'); } catch (e) { return falta(); }
    if (rel.includes('\0') || rel.split('/').includes('..')) return falta();
    const base = cfg.pasta;
    let alvo = rel ? arquivos.seguro(rel.replace(/\/+$/, '')) : base;
    if (!alvo) return falta();
    let st; try { st = fs.statSync(alvo); } catch (e) { return falta(); }
    if (st.isDirectory()) {
      if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' + url.search, 'Cache-Control': 'no-store' }); return res.end(); }
      alvo = path.join(alvo, 'index.html');
      try { st = fs.statSync(alvo); } catch (e) { return falta(); }
    }
    if (!st.isFile()) return falta();
    try {
      const real = fs.realpathSync(alvo), raiz = fs.realpathSync(base);
      if (real !== raiz && !real.startsWith(raiz + path.sep)) return falta();
    } catch (e) { return falta(); }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(alvo).slice(1).toLowerCase()] || 'application/octet-stream', 'Content-Length': st.size,
      'Content-Security-Policy': CSP_PASTA, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store',
      /* fonte sempre vem por CORS e a página (origem opaca) não é a Estação: só a fonte ganha o cabeçalho; o resto da pasta não se lê por fetch de fora */
      ...(/^\.(woff2?|ttf|otf|eot)$/i.test(path.extname(alvo)) ? { 'Access-Control-Allow-Origin': '*' } : {})
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(alvo).on('error', () => res.destroy()).pipe(res);
  }

  /* ---------- entrar na equipe pelo Wi-Fi (entrada.js): a Estação nova pede, a gestão aceita, o token chega cifrado ----------
     usarToken é o mesmo caminho do /api/token, com o token que só a chave efêmera do pedido abriu */
  function usarToken(texto) {
    if (pronto()) throw new Error('esta Estação já está numa equipe');
    const t = token.ler(texto);
    const c = t.carteira;
    cfg = config.salvar(Object.assign(cfg, { id: c.id, nome: c.nome, papel: c.papel, equipe: t.equipe, segredo: t.segredo, encontro: t.encontro, carteira: c, assinatura: t.assinatura, privada: t.privada, publicaEquipe: t.publicaEquipe, privadaEquipe: t.privadaEquipe || undefined }));
    if (!t.privadaEquipe) delete cfg.privadaEquipe;
    novaIdentidade();
    ligarRede();
    paraLocais({ tipo: 'entrada-dentro', eu: quem() });
    return quem();
  }
  /* quem já está na equipe (a gestão, os pares, os autores do diário): pedido com o nome de alguém daqui é recusado */
  const conhecidos = () => [cfg.id].concat(rede ? rede.lista().map((p) => p.id) : [], diario.todos().map((ev) => ev.autor)).filter(Boolean);
  const entrada = new Entrada({ cfg: () => cfg, pronto, json, usarToken, conhecidos, paraLocais: (msg) => paraLocais(msg) });

  /* ---------- HTTP ---------- */
  const servidor = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const p = url.pathname;
    try {
      if (!hostAceito(req.headers.host)) return json(res, 403, { erro: 'endereço não aceito' });
      /* o claude do terminal desta máquina: ganchos http e o conector coop, com o segredo da sessão (nunca o da equipe) */
      const rotaAgente = p.match(/^\/(api\/gancho|mcp)\/([A-Za-z0-9_-]{1,48})$/);
      if (rotaAgente) {
        const sessao = rotaAgente[2];
        if (rotaAgente[1] === 'api/gancho') return agentes.gancho(req, res, sessao);
        /* segredo no cabeçalho X-Coop-Segredo (nunca na URL: o log do claude imprime a URL). Errado = 403, nunca 401:
           o transporte http do Claude Code tem OAuth e um 401 abriria um fluxo de login. GET e DELETE: o conector responde 405 (Allow: POST) */
        if (!ehLoopback(req.socket.remoteAddress)) return json(res, 403, { erro: 'só nesta máquina' });
        if (!agentes.autorizado(req, sessao)) { req.resume(); return json(res, 403, { erro: 'segredo da sessão não confere' }); }
        if (!['POST', 'GET', 'DELETE'].includes(req.method)) { req.resume(); res.setHeader('Allow', 'POST'); return json(res, 405, { erro: 'use POST' }); }
        return coop.tratar(req, res, sessao, agentes.agente(sessao));
      }
      const local = pedidoLocal(req, cfg.porta);
      const soLocal = () => { json(res, 403, { erro: 'só a própria Estação faz isto' }); return false; };
      /* instalador pela rede (instalador.js): a página /instalar e os babel-coop-*.dmg/.exe da lista, para qualquer aparelho da
         rede local, sem carteira; /api/instalar/info dá à tela Convidar o link com o IP da rede (só a própria Estação) */
      if (p === '/instalar' || p.startsWith('/instalar/')) return require('./instalador').tratar(req, res, p, { raiz: cfg.raiz });
      if (p === '/api/instalar/info') { if (!local) return soLocal(); return json(res, 200, require('./instalador').info({ raiz: cfg.raiz, porta: cfg.porta })); }
      if (p.startsWith('/api/entrar/')) return await entrada.tratar(req, res, p, local); /* o pedido de entrada é a única rota aberta a quem não tem carteira */
      if (p === '/api/eu') return json(res, 200, Object.assign(quem(), { pares: rede ? rede.lista() : [], terminalReal: terminais.disponivel(), pasta: cfg.pasta, versao: require('../package.json').version, app: atualizacao.atual(), motor: { node: process.versions.node, electron: process.versions.electron || null } }));
      if (p === '/api/fundar' && req.method === 'POST') {
        if (!local) return soLocal();
        if (pronto()) return json(res, 400, { erro: 'esta Estação já está numa equipe' });
        const b = await corpo(req);
        let f; try { f = token.fundar(b.nome || cfg.nome, b.equipe); } catch (e) { return json(res, 400, { erro: e.message }); }
        cfg = config.salvar(Object.assign(cfg, f, { encontro: [] }));
        novaIdentidade();
        ligarRede();
        return json(res, 200, quem());
      }
      if (p === '/api/token' && req.method === 'POST') {
        if (!local) return soLocal();
        if (pronto()) return json(res, 400, { erro: 'esta Estação já está numa equipe' });
        const b = await corpo(req);
        let t; try { t = token.ler(b.token); } catch (e) { return json(res, 400, { erro: e.message }); }
        const c = t.carteira;
        cfg = config.salvar(Object.assign(cfg, { id: c.id, nome: c.nome, papel: c.papel, equipe: t.equipe, segredo: t.segredo, encontro: t.encontro, carteira: c, assinatura: t.assinatura, privada: t.privada, publicaEquipe: t.publicaEquipe, privadaEquipe: t.privadaEquipe || undefined }));
        if (!t.privadaEquipe) delete cfg.privadaEquipe;
        novaIdentidade();
        ligarRede();
        return json(res, 200, quem());
      }
      if (p === '/api/convite' && req.method === 'POST') {
        if (!local) return soLocal();
        if (cfg.papel !== 'gestao') return json(res, 403, { erro: 'só a gestão convida' });
        const b = await corpo(req);
        try { return json(res, 200, { token: token.gerar(cfg, b) }); } catch (e) { return json(res, 400, { erro: e.message }); }
      }
      /* Oficina do app: publicar e atualizar pela rede local */
      if (p === '/api/app/manifesto') { const m = atualizacao.manifesto(atualizacao.ultima()); return m ? json(res, 200, m) : json(res, 404, { erro: 'nenhuma versão publicada aqui' }); }
      if (p === '/api/app/arquivo') {
        const alvo = atualizacao.arquivo(+url.searchParams.get('versao'), url.searchParams.get('caminho') || '');
        if (!alvo) { res.writeHead(404); return res.end('não achei'); }
        res.writeHead(200, { 'Content-Type': MIME[alvo.split('.').pop().toLowerCase()] || 'application/octet-stream' });
        return fs.createReadStream(alvo).pipe(res);
      }
      if (p === '/api/app/publicar' && req.method === 'POST') {
        if (!local) return soLocal();
        /* o papel vem da carteira (cfg.papel): membro não publica versão do app para a equipe */
        if (cfg.papel !== 'gestao') { req.resume(); return json(res, 403, { erro: 'só a gestão publica atualização do app' }); }
        const b = await corpo(req);
        try {
          const m = atualizacao.publicar(b.notas, b.versaoBase);
          diario.anexar(cfg.id, 'oficinaPublicar', [m.notas], b.origem); /* o evento é o que faz "Atualizar" aparecer em todas as Estações */
          return json(res, 200, m);
        } catch (e) { return json(res, 400, { erro: e.message }); }
      }
      if (p === '/api/app/atualizar' && req.method === 'POST') {
        if (!local) return soLocal();
        const b = await corpo(req);
        const par = rede && rede.par(b.de);
        if (!par || !rede.ligado(par)) return json(res, 502, { erro: 'a Estação de ' + b.de + ' não está na rede agora' });
        try { const m = await atualizacao.atualizar(par.host, par.porta, b.versao); return json(res, 200, m); } catch (e) { return json(res, 500, { erro: e.message }); }
      }
      if (p === '/api/rede') { if (!local) return soLocal(); return json(res, 200, rede ? rede.estado() : { serie: 0, pares: [], conexoes: [] }); }
      /* acervo: a API local (IDEIAS §8.1 e linha 524: para a IA do Theus e para a tela) · só o navegador desta máquina */
      if (p.startsWith('/api/acervo/')) {
        if (!local) return soLocal();
        if (!acervo) return json(res, 503, { erro: 'acervo indisponível nesta versão' });
        const sp = url.searchParams;
        if (p === '/api/acervo/buscar') return json(res, 200, await acervo.buscarEquipe(sp.get('q') || '', { modo: sp.get('modo') || 'tudo', quem: cfg.id, limite: +sp.get('limite') || 10 }));
        if (p === '/api/acervo/item') { const it = acervo.ler(sp.get('id') || sp.get('caminho') || '', { quem: cfg.id }); return it ? json(res, 200, it) : json(res, 404, { erro: 'não achei no acervo' }); }
        if (p === '/api/acervo/aprendi' && req.method === 'POST') { const b = await corpo(req); try { return json(res, 200, acervo.aprendi(b.texto, cfg.id, texto(b.origem, 120) || 'Estação', texto(b.corrige, 60) || null)); } catch (e) { return json(res, 400, { erro: e.message }); } }
        if (p === '/api/acervo/aprendizados') return json(res, 200, acervo.aprendizados(+sp.get('limite') || 20));
        if (p === '/api/acervo/exportar') { const x = acervo.exportar(sp.get('dia')); res.writeHead(200, { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Content-Disposition': 'inline; filename="babel-coop-' + x.dia + '.jsonl"', 'Cache-Control': 'no-store' }); return res.end(x.jsonl); }
        if (p === '/api/acervo/estatisticas') return json(res, 200, acervo.estatisticas());
        if (p === '/api/acervo/reconstruir' && req.method === 'POST') return json(res, 200, acervo.reconstruir());
        return json(res, 404, { erro: 'rota do acervo desconhecida' });
      }
      /* banco real do projeto (a Máquina): só o navegador desta máquina. Erro de SQL volta 200 com ok:false e nada gravado */
      if (p.startsWith('/api/banco/')) {
        if (!local) { req.resume(); return soLocal(); }
        try {
          if (p === '/api/banco/estado' && req.method === 'GET') return json(res, 200, await bancos.estado(url.searchParams.get('projeto')));
          if (p === '/api/banco/aplicar' && req.method === 'POST') { const b = await corpo(req); return json(res, 200, await bancos.aplicar(b.projeto, b.sql, b.nome)); }
          if (p === '/api/banco/consulta' && req.method === 'POST') { const b = await corpo(req); return json(res, 200, await bancos.consulta(b.projeto, b.sql)); }
        } catch (e) { return json(res, e.pedido ? 400 : 500, { ok: false, erro: { mensagem: e.message } }); }
        req.resume();
        return json(res, 404, { ok: false, erro: { mensagem: 'rota do banco desconhecida' } });
      }
      if (p === '/api/diario') return json(res, 200, diario.todos());
      if (p === '/api/evento' && req.method === 'POST') {
        if (!local) return soLocal();
        const b = await corpo(req); if (!b.acao) return json(res, 400, { erro: 'faltou a ação' }); return json(res, 200, diario.anexar(cfg.id, b.acao, b.args));
      }
      if (p === '/api/arquivos') return json(res, 200, arquivos.listar());
      if (p === '/pasta' || p.startsWith('/pasta/')) return servirPasta(req, res, p, url);
      if (p === '/api/arquivo') {
        const rel = url.searchParams.get('caminho') || '';
        if (req.method === 'PUT') {
          /* gravar na minha pasta: só a própria Estação (o cabeçalho de "quem" dava para forjar de qualquer lugar da rede) */
          if (!local) return json(res, 403, { erro: 'só o dono grava aqui' });
          const b = await corpo(req);
          const gravou = arquivos.escrever(rel, String(b.conteudo || ''));
          if (gravou && acervo) acervo.arquivoMudou(); /* não depende do fs.watch */
          return json(res, gravou ? 200 : 400, { ok: true });
        }
        if (req.method === 'DELETE') {
          /* apagar = tirar da pasta compartilhada para <raiz>/.coop/lixeira/<id> (o Desfazer devolve): só a própria Estação, só na minha pasta, nunca os gerados do acervo */
          if (!local) return json(res, 403, { erro: 'só o dono apaga aqui' });
          const r = arquivos.apagar(rel);
          if (r.ok) aoMudarPasta(); /* árvore e acervo na hora, sem depender do fs.watch */
          return json(res, r.ok ? 200 : r.status || 400, r.ok ? { ok: true, lixeira: r.lixeira, caminho: r.caminho } : { erro: r.erro });
        }
        const a = arquivos.ler(rel);
        if (!a) return json(res, 404, { erro: 'não existe ou fora da pasta compartilhada' });
        if (a.caminhoReal) { res.writeHead(200, { 'Content-Type': MIME[a.caminhoReal.split('.').pop().toLowerCase()] || 'application/octet-stream' }); return fs.createReadStream(a.caminhoReal).pipe(res); }
        return json(res, 200, a);
      }
      if (p === '/api/arquivo/restaurar' && req.method === 'POST') {
        if (!local) { req.resume(); return json(res, 403, { erro: 'só o dono restaura aqui' }); }
        const b = await corpo(req);
        const r = arquivos.restaurar(b.lixeira);
        if (r.ok) aoMudarPasta();
        return json(res, r.ok ? 200 : r.status || 400, r.ok ? { ok: true, caminho: r.caminho } : { erro: r.erro });
      }
      /* a pasta de outra pessoa: pergunta direto à Estação dela (computador desligado = 502, a Estação mostra a ficha pontilhada) */
      const outro = p.match(/^\/api\/de\/([a-z0-9-]+)(\/.*)$/);
      if (outro) {
        const par = rede && rede.par(outro[1]);
        if (!par || !rede.ligado(par)) return json(res, 502, { erro: 'computador de ' + outro[1] + ' desligado' });
        const alvo = 'http://' + (net.isIPv6(par.host) ? '[' + par.host + ']' : par.host) + ':' + par.porta + '/api' + outro[2] + url.search;
        return http.get(alvo, (r2) => { res.writeHead(r2.statusCode, { 'Content-Type': r2.headers['content-type'] || MIME.json }); r2.pipe(res); }).on('error', () => json(res, 502, { erro: 'sem resposta de ' + outro[1] }));
      }
      /* a interface */
      const rel = p === '/' ? '/index.html' : p;
      if (oficina) oficina.cfg = cfg;
      const previa = local && oficina ? oficina.pastasPrevia() : null;
      const PASTA_UI = previa ? previa.ui : atualizacao.pastaUi();
      const pastaInterface = previa ? previa.interface : PASTA_INTERFACE;
      /* three.js de dentro do app (o protótipo puro usa a CDN): só build/ e examples/jsm/ do pacote three */
      const tres = rel.match(/^\/vendor\/three\/((?:build|examples\/jsm)\/[A-Za-z0-9_./-]+\.js)$/);
      if (tres) {
        const f = path.normalize(path.join(PASTA_THREE, tres[1]));
        if (!f.startsWith(PASTA_THREE + path.sep) || !fs.existsSync(f)) { res.writeHead(404); return res.end('não achei'); }
        res.writeHead(200, { 'Content-Type': MIME.js, 'Cache-Control': 'no-store' });
        return fs.createReadStream(f).pipe(res);
      }
      /* as fontes de dentro do app (semInternet aponta o HTML para cá): o CSS junto e os woff2 de cada família */
      if (rel === '/vendor/fontes.css') { res.writeHead(200, { 'Content-Type': MIME.css, 'Cache-Control': 'no-store' }); return res.end(fontesCss()); }
      const fonte = rel.match(/^\/vendor\/fontes\/([a-z-]+)\/([a-z0-9-]+\.woff2?)$/);
      if (fonte) {
        const pasta = Object.prototype.hasOwnProperty.call(FONTES, fonte[1]) && pastaFonte(fonte[1]);
        const f = pasta && path.join(pasta, 'files', fonte[2]);
        if (!f || !fs.existsSync(f)) { res.writeHead(404); return res.end('não achei'); }
        res.writeHead(200, { 'Content-Type': MIME[fonte[2].split('.').pop()], 'Cache-Control': 'max-age=3600' });
        return fs.createReadStream(f).pipe(res);
      }
      const vendor = rel.match(/^\/vendor\/([a-z0-9.-]+)$/);
      if (vendor) { const f = VENDOR[vendor[1]]; if (!f) { res.writeHead(404); return res.end('não achei'); } res.writeHead(200, { 'Content-Type': MIME[f.split('.').pop()], 'Cache-Control': 'no-store' }); return fs.createReadStream(f).pipe(res); }
      if (rel.startsWith('/coop/')) {
        const f = path.normalize(path.join(pastaInterface, decodeURIComponent(rel.slice(6))));
        if (!f.startsWith(pastaInterface + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('não achei'); }
        res.writeHead(200, { 'Content-Type': MIME[f.split('.').pop().toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        return fs.createReadStream(f).pipe(res);
      }
      if (rel === '/ponte.js') { res.writeHead(200, { 'Content-Type': MIME.js, 'Cache-Control': 'no-store' }); return fs.createReadStream(previa ? previa.ponte : atualizacao.pontePath()).pipe(res); }
      const alvo = path.normalize(path.join(PASTA_UI, decodeURIComponent(rel)));
      if (!alvo.startsWith(PASTA_UI + path.sep) || !fs.existsSync(alvo) || fs.statSync(alvo).isDirectory()) { res.writeHead(404); return res.end('não achei'); }
      if (rel === '/index.html') {
        /* injeta a ponte no fim da página: é ela que troca o simulado pelo real */
        const html = fs.readFileSync(alvo, 'utf8').replace('<script src="app.js"></script>', INJETAR(terminais.disponivel(), listarMidia(), !pedidoLocal(req, cfg.porta)) + '\n<script src="app.js"></script>')
          .split('https://cdn.jsdelivr.net/npm/three@0.160.0/').join('/vendor/three/');
        res.writeHead(200, { 'Content-Type': MIME.html, 'Cache-Control': 'no-store' });
        return res.end(semInternet(html));
      }
      /* as outras páginas da interface (o mapa mental no iframe) também pegam as fontes de dentro do app */
      if (/\.html$/.test(rel)) { res.writeHead(200, { 'Content-Type': MIME.html, 'Cache-Control': 'no-store' }); return res.end(semInternet(fs.readFileSync(alvo, 'utf8'))); }
      res.writeHead(200, { 'Content-Type': MIME[rel.split('.').pop().toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(alvo).pipe(res);
    } catch (e) { json(res, 500, { erro: e.message }); }
  });

  /* ---------- WebSocket: telas desta máquina, de outros aparelhos e pares ---------- */
  function classificar(req) {
    if (!hostAceito(req.headers.host)) return null;
    const url = new URL(req.url, 'http://x');
    const origem = req.headers.origin;
    if (url.searchParams.get('par') === '1') return origem ? null : 'par'; /* navegador nunca é par */
    if (!origem) return null;                                             /* navegador sem Origin: recusado */
    if (ehLoopback(req.socket.remoteAddress)) return origensLocais(cfg.porta).includes(origem) ? 'local' : null;
    return origem === 'http://' + String(req.headers.host).toLowerCase() ? 'remoto' : null;
  }
  const wss = new WebSocketServer({
    server: servidor, path: '/ws', maxPayload: 32 * 1024 * 1024,
    verifyClient: (info, cb) => { const tipo = classificar(info.req); if (!tipo) return cb(false, 403, 'origem recusada'); info.req.coopTipo = tipo; cb(true); }
  });
  wss.on('connection', (ws, req) => {
    const tipo = req.coopTipo;
    ws.on('error', () => { /* o close vem em seguida */ });
    if (tipo === 'par') { if (rede) rede.aceitar(ws, String(req.socket.remoteAddress || '').replace('::ffff:', '')); else ws.close(1013, 'sem equipe'); return; }
    const ehLocal = tipo === 'local';
    (ehLocal ? locais : remotos).add(ws);
    mandar(ws, ehLocal
      ? { tipo: 'bemvindo', eu: quem(), pares: rede ? rede.lista() : [], eventos: diario.todos(), terminais: terminais.lista(false), terminalReal: terminais.disponivel(), controles: controle.lista(), controlesPublicos: Object.fromEntries(publicosPares), terminaisPares: Object.fromEntries(listasPares), agentes: agentesLigados && terminais.disponivel(), agentesLista: agentes.lista() }
      : { tipo: 'bemvindo', eu: quem(), pares: rede ? rede.lista() : [], eventos: diario.todos(), terminais: [], terminalReal: false, controles: [], agentes: false, agentesLista: [] });
    ws.on('close', () => {
      locais.delete(ws); remotos.delete(ws);
      /* assinatura por contagem: a última tela que assistia um terminal de fora saiu → term-parar ao dono */
      assistindo.forEach((telas, chave) => {
        if (!telas.delete(ws) || telas.size) return;
        assistindo.delete(chave);
        const [dono, id] = chave.split('/');
        if (rede) rede.enviar(dono, { tipo: 'term-parar', id });
      });
    });
    ws.on('message', (buf) => {
      let m; try { m = JSON.parse(buf.toString()); } catch (e) { return; }
      if (!m || typeof m.tipo !== 'string') return;
      if (m.tipo === 'fazer') {
        if (!m.acao || !pronto()) return;
        const acao = String(m.acao), args = Array.isArray(m.args) ? m.args : [];
        if (ehLocal) { diario.anexar(cfg.id, acao, args, m.origem); return; }
        /* celular, iPad, TV: só a lista acima; o resto volta como erro (a ponte mostra o aviso) */
        if (!remotoPode(acao, args)) { mandar(ws, { tipo: 'erro', erro: 'Pela rede só o quadro e a TV. "' + acao.slice(0, 40) + '" fica para a Estação.', contexto: 'fazer' }); return; }
        diario.anexar(cfg.id, acao, args, typeof m.origem === 'string' ? m.origem.slice(0, 80) : undefined);
        return;
      }
      if (!ehLocal) return; /* celular e iPad: nada de terminal, controle nem projetos */
      aoMensagemLocal(ws, m);
    });
  });

  /* o que a própria Estação (navegador local) pede */
  function aoMensagemLocal(ws, m) {
    const id = idSessao(m.id);
    const dono = m.dono == null || m.dono === '' ? cfg.id : idPessoa(m.dono);
    const meu = dono === cfg.id;
    const foraDaRede = () => mandar(ws, { tipo: 'term-recusado', dono, id, motivo: 'fora da rede' });
    switch (m.tipo) {
      case 'term-abrir':
        try {
          const info = terminais.abrir({ id: m.id, nome: m.nome, cols: m.cols, rows: m.rows });
          terminais.tela(info.id, false, (tela) => mandar(ws, { tipo: 'term-aberto', info: terminais.info(info.id, false) || info, tela: tela ? tela.dados : '' }));
        } catch (e) { mandar(ws, { tipo: 'erro', erro: e.message }); }
        return;
      case 'term-entrada':
        if (!id || !dono || typeof m.dados !== 'string') return;
        if (meu) { terminais.escrever(id, m.dados); return; } /* o dono digita no próprio terminal, com ou sem pausa */
        if (!rede || !rede.enviar(dono, { tipo: 'term-entrada', id, dados: m.dados })) foraDaRede(); /* teclas para o terminal de outra pessoa: o dono decide */
        return;
      /* só nos meus: redimensionar, pausar, fechar e renomear são do dono */
      case 'term-tamanho': if (id && meu) terminais.redimensionar(id, m.cols, m.rows); return;
      case 'term-pausar': if (id && meu) terminais.pausar(id, !!m.sim); return;
      case 'term-fechar': if (id && meu) terminais.fechar(id); return;
      case 'term-renomear': if (id && meu) terminais.renomear(id, m.nome); return;
      case 'term-assistir':
        if (!id || !dono) return;
        if (meu) { terminais.tela(id, false, (tela) => { if (tela) mandar(ws, tela); }); return; }
        {
          const chave = dono + '/' + id;
          if (!assistindo.has(chave)) assistindo.set(chave, new Set());
          assistindo.get(chave).add(ws);
          /* o dono manda a tela a cada term-assistir; para ele quem assiste é esta Estação, uma vez só */
          if (!rede || !rede.enviar(dono, { tipo: 'term-assistir', id })) foraDaRede();
        }
        return;
      case 'term-parar': {
        if (!id || !dono || meu) return;
        const chave = dono + '/' + id, telas = assistindo.get(chave);
        if (!telas) return;
        telas.delete(ws);
        if (!telas.size) { assistindo.delete(chave); if (rede) rede.enviar(dono, { tipo: 'term-parar', id }); }
        return;
      }
      case 'term-lista?':
        mandar(ws, { tipo: 'term-lista', dono: cfg.id, lista: terminais.lista(false) });
        listasPares.forEach((lista, d) => mandar(ws, { tipo: 'term-lista', dono: d, lista }));
        if (rede) rede.espalhar({ tipo: 'term-lista?' });
        return;
      case 'term-pedir': {
        if (!dono || meu) return;
        const sessao = m.sessao == null ? null : idSessao(m.sessao);
        if (m.sessao != null && !sessao) return;
        if (!rede || !rede.enviar(dono, { tipo: 'term-pedir', sessao })) mandar(ws, { tipo: 'term-recusado', dono, id: sessao, motivo: 'fora da rede' });
        return;
      }
      case 'controle-aceitar': if (typeof m.id === 'string') controle.aceitar(m.id); return;
      case 'controle-recusar': if (typeof m.id === 'string') controle.recusar(m.id); return;
      case 'controle-encerrar': if (typeof m.id === 'string') controle.encerrar(m.id); return;
      case 'controle-sair': if (typeof m.id === 'string' && dono && !meu && rede) rede.enviar(dono, { tipo: 'controle-sair', id: m.id }); return;
      case 'controles?': mandarControles(); return;
      case 'projetos': controle.definirProjetos(m.lista); return;
      /* agentes (§7): só nos meus terminais, só a tela local */
      case 'agente-iniciar': try { agentes.iniciar(ws, m); } catch (e) { mandar(ws, { tipo: 'erro', erro: e.message, id, contexto: 'agente-iniciar' }); } return;
      case 'agente-pedido': Promise.resolve().then(() => agentes.pedido(m)).catch((e) => mandar(ws, { tipo: 'erro', erro: e.message, id, contexto: 'agente-pedido' })); return;
      case 'agente-interromper': Promise.resolve().then(() => agentes.interromper(m)).catch((e) => mandar(ws, { tipo: 'erro', erro: e.message, id, contexto: 'agente-interromper' })); return;
      case 'agente-ok': Promise.resolve().then(() => agentes.ok(m)).catch((e) => mandar(ws, { tipo: 'erro', erro: e.message, id, contexto: 'agente-ok' })); return;
      case 'agente-lista?': mandar(ws, { tipo: 'agente-lista', lista: agentes.lista() }); return;
      /* conector coop (§8): a tela respondeu uma mcp-chamada */
      case 'mcp-resposta': coop.aoMensagemUi(m); return;
      default: return;
    }
  }

  servidor.on('error', (e) => { console.error('[babel-coop] servidor: ' + e.message); if (opcoes.aoErro) opcoes.aoErro(e); });
  servidor.listen(cfg.porta, '0.0.0.0', () => {
    console.log('[babel-coop] ' + cfg.nome + ' (' + cfg.id + ') em http://localhost:' + cfg.porta + '  · pasta ' + cfg.pasta + (pronto() ? '' : '  · aguardando token'));
    ligarRede();
    /* o acervo alcança o histórico cru (diário, terminais, pasta) logo depois de subir, sem atrasar o listen */
    if (acervo) setImmediate(() => { try { acervo.sincronizar(); } catch (e) { console.error('[babel-coop] acervo (sincronizar): ' + e.message); } });
  });

  return {
    porta: cfg.porta, cfg: () => cfg,
    agentes, coop, acervo, bancos,
    parar: () => {
      if (navegador && typeof navegador.off === 'function') navegador.off('passo', aoPassoNavegador);
      agentes.parar(); /* apaga os arquivos de ganchos e solta os pedidos de permissão antes de matar os terminais */
      coop.parar();
      entrada.parar();
      if (acervo) acervo.fechar();
      bancos.fechar().catch((e) => console.error('[babel-coop] banco (fechar): ' + e.message)); /* espera a operação em curso de cada projeto */
      terminais.fecharTodos();
      if (rede) rede.parar();
      wss.clients.forEach((ws) => { try { ws.terminate(); } catch (e) { /* ok */ } });
      wss.close();
      servidor.close();
    }
  };
}

module.exports = { iniciar, INJETAR, listarMidia };
if (require.main === module) {
  const srv = iniciar({ aoErro: () => process.exit(1) });
  const sair = () => { srv.parar(); setTimeout(() => process.exit(0), 200).unref(); };
  process.on('SIGTERM', sair);
  process.on('SIGINT', sair);
}
