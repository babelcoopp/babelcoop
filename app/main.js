/* babel-coop · a Estação (Electron)
   Sobe o servidor desta máquina e abre a interface servida por ele em http://localhost:<porta>.
   O celular e a TV da rede local abrem o mesmo endereço pelo IP da máquina.
   O navegador dos agentes (PROTOCOLO §9) mora aqui: <webview> na tela + navegador/navegador.js (CDP do próprio app).
   Nenhum Google Chrome em lugar nenhum: link de fora abre numa janela do app; nada chama shell.openExternal.
*/
'use strict';
const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
const path = require('path');
const { iniciar } = require('./servidor/servidor');
const { Navegadores } = require('./navegador/navegador');

/* duas Estações na mesma máquina (testes): cada uma com a sua pasta de dados do Electron */
if (process.env.BABEL_COOP_RAIZ) app.setPath('userData', path.join(process.env.BABEL_COOP_RAIZ, '.coop', 'electron'));

/* testes automáticos: BABEL_COOP_OCULTO=1 abre as janelas escondidas, sem roubar a tela de quem está usando o Mac */
const OCULTO = !!process.env.BABEL_COOP_OCULTO;

let servidor = null;
let janela = null;
let tv = null;

/* ---------- navegador dos agentes ---------- */
const navegadores = new Navegadores({
  pasta: () => (servidor ? servidor.cfg().pasta : null),
  porta: () => (servidor ? servidor.porta : null)
});
const telasDoNavegador = new Set(); /* telas que registraram webviews (a Estação); a TV nunca recebe */
function avisarTelas(canal, dados) {
  const alvos = new Set(telasDoNavegador);
  if (janela && !janela.isDestroyed()) alvos.add(janela.webContents);
  alvos.forEach((wc) => { if (!wc.isDestroyed()) wc.send(canal, dados); });
}
navegadores.on('passo', (p) => avisarTelas('navegador:passo', p));
navegadores.on('estado', (e) => avisarTelas('navegador:estado', e));
navegadores.on('aba', (a) => avisarTelas('navegador:aba', a)); /* uma ferramenta chegou antes da aba: a tela abre "Navegador · <agente>" */
/* para os testes (Playwright _electron.evaluate) e para depurar: o global do processo principal não chega a página nenhuma */
global.babelCoop = { navegadores, servidor: () => servidor };

/* o que o navegador do agente e as janelas de link podem pedir ao sistema: quase nada (sem abrir app externo, sem câmera, sem aviso) */
const PERMITIDAS = new Set(['clipboard-sanitized-write', 'fullscreen', 'pointerLock']);
const sessoesGuardadas = new WeakSet();
function guardarSessao(sessao) {
  if (sessoesGuardadas.has(sessao)) return;
  sessoesGuardadas.add(sessao);
  sessao.setPermissionRequestHandler((_wc, permissao, responder) => responder(PERMITIDAS.has(permissao)));
}

/* cada <webview> nasce sem Node, sem preload, em sandbox e numa partição persist:navegador-*; só a janela da Estação tem webview */
app.on('web-contents-created', (_e, contents) => {
  contents.on('will-attach-webview', (ev, prefs, params) => {
    if (!janela || janela.isDestroyed() || contents !== janela.webContents) { ev.preventDefault(); return; }
    delete prefs.preload;
    delete prefs.preloadURL;
    prefs.nodeIntegration = false;
    prefs.nodeIntegrationInSubFrames = false;
    prefs.contextIsolation = true;
    prefs.sandbox = true;
    prefs.webSecurity = true;
    prefs.allowRunningInsecureContent = false;
    /* alert/confirm/prompt da página nunca abrem caixa nativa por cima do trabalho da pessoa nem travam o agente:
       alert segue, confirm e prompt voltam cancelados (confirmar algo é com a pessoa); o texto vira passo (navegador.js) */
    prefs.disableDialogs = true;
    if (!/^persist:navegador(-[A-Za-z0-9_.-]{1,60})?$/.test(params.partition || '')) params.partition = 'persist:navegador';
    if (params.src && !navegadores.navegacaoPermitida(params.src)) params.src = 'about:blank';
  });
  contents.on('did-attach-webview', (_ev, convidado) => prepararConvidado(convidado));
});

function prepararConvidado(convidado) {
  guardarSessao(convidado.session);
  convidado.setBackgroundThrottling(false); /* o agente continua trabalhando com a aba escondida */
  /* janela nova (target=_blank, window.open) abre no mesmo webview: o agente e a pessoa continuam vendo tudo */
  /* com o webContents: se o agente está no controle, link ou redirecionamento para endereço interno também não passa (SSRF) */
  convidado.setWindowOpenHandler(({ url }) => { if (navegadores.navegacaoPermitida(url, convidado.id)) convidado.loadURL(url); return { action: 'deny' }; });
  const vigiar = (ev, urlAntiga) => { const url = (ev && ev.url) || urlAntiga; if (url && !navegadores.navegacaoPermitida(url, convidado.id)) ev.preventDefault(); };
  convidado.on('will-navigate', vigiar);
  convidado.on('will-redirect', vigiar);
}

function abrirEstacao() {
  janela = new BrowserWindow({
    width: 1440, height: 900, minWidth: 980, minHeight: 640,
    title: 'babel-coop', backgroundColor: '#060b16', show: !OCULTO,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: false, backgroundThrottling: !OCULTO, webviewTag: true }
  });
  janela.loadURL('http://localhost:' + servidor.porta + '/');
  janela.webContents.setWindowOpenHandler(({ url }) => {
    /* "Tela da TV" abre numa janela própria, sem botões, para espelhar na TV */
    if (url.indexOf('#tv') !== -1) { abrirTv(url); return { action: 'deny' }; }
    if (url.indexOf('#cronometro') !== -1) { abrirCronometro(url); return { action: 'deny' }; }
    if (/^https?:/.test(url) && url.indexOf('localhost:' + servidor.porta) === -1) { abrirNavegador(url); return { action: 'deny' }; }
    return { action: 'allow' };
  });
  janela.on('closed', () => { janela = null; });
}

/* link de fora abre no navegador do próprio app, nunca no Chrome do sistema (ordem do Theus: nenhum Google Chrome no babel-coop).
   Sessão própria, sem Node, sem acesso ao disco. */
function abrirNavegador(url) {
  const nav = new BrowserWindow({
    width: 1200, height: 820, title: 'navegador · babel-coop', backgroundColor: '#060b16', show: !OCULTO,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, partition: 'persist:navegador' }
  });
  guardarSessao(nav.webContents.session);
  nav.webContents.setWindowOpenHandler(({ url: outra }) => { if (/^https?:/.test(outra)) nav.loadURL(outra); return { action: 'deny' }; });
  nav.loadURL(url);
  return nav;
}

function abrirTv(url) {
  if (tv) { tv.focus(); return; }
  tv = new BrowserWindow({ width: 1280, height: 720, title: 'babel-coop · TV', backgroundColor: '#060b16', autoHideMenuBar: true, webPreferences: { contextIsolation: true } });
  tv.loadURL(url || 'http://localhost:' + servidor.porta + '/#tv');
  tv.on('closed', () => { tv = null; });
}

/* o cronômetro que persegue a pessoa: janelinha sem moldura, sempre por cima, em todas as mesas (Spaces) e por cima de apps em tela cheia */
let cronometro = null;
function abrirCronometro(url) {
  if (cronometro) { cronometro.focus(); return; }
  cronometro = new BrowserWindow({
    width: 300, height: 170, minWidth: 220, minHeight: 120, frame: false, transparent: false, resizable: true, minimizable: false, maximizable: false, fullscreenable: false,
    alwaysOnTop: true, skipTaskbar: true, hasShadow: true, backgroundColor: '#060b16', title: 'Cronômetro · babel-coop',
    webPreferences: { contextIsolation: true }
  });
  cronometro.setAlwaysOnTop(true, 'floating', 1);
  cronometro.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  cronometro.loadURL(url || 'http://localhost:' + servidor.porta + '/#cronometro');
  cronometro.on('closed', () => { cronometro = null; });
}

ipcMain.handle('coop:tv', () => { abrirTv(); return true; });
ipcMain.handle('coop:cronometro', () => { abrirCronometro(); return true; });
ipcMain.handle('coop:eu', () => servidor.cfg());

/* só a página principal da Estação (http://localhost:<porta>) comanda o navegador; a TV e os webviews não têm preload */
function telaDaEstacao(e) {
  try {
    const u = new URL(e.senderFrame.url);
    return !!servidor && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname) && +u.port === servidor.porta && e.senderFrame === e.sender.mainFrame;
  } catch (x) { return false; }
}

/* coopElectron.copiar(texto): só a página principal da Estação escreve na área de transferência (texto puro, até 5 MB) */
ipcMain.handle('coop:copiar', (e, texto) => {
  if (!telaDaEstacao(e) || typeof texto !== 'string') return false;
  clipboard.writeText(texto.slice(0, 5 * 1024 * 1024));
  return true;
});

/* coopElectron.navegador.* (preload.js) → aqui. A pasta de clonar/copy/print é sempre a da pessoa: nenhum caminho vem da página. */
ipcMain.handle('coop:navegador', async (e, acao, agente, args) => {
  if (!telaDaEstacao(e)) return { ok: false, erro: 'só a tela da Estação comanda o navegador', codigo: 'origem' };
  args = args && typeof args === 'object' ? args : {};
  try {
    if (acao === 'lista') return { ok: true, valor: navegadores.lista() };
    if (acao === 'estado') return { ok: true, valor: navegadores.estado(agente) };
    if (acao === 'registrar') {
      const valor = await navegadores.registrar(args.webContentsId, agente, { nome: args.nome, cor: args.cor, pessoa: args.pessoa, host: e.sender });
      if (!telasDoNavegador.has(e.sender)) { telasDoNavegador.add(e.sender); const tela = e.sender; tela.once('destroyed', () => telasDoNavegador.delete(tela)); }
      return { ok: true, valor };
    }
    if (!navegadores.estado(agente).registrado) return { ok: false, erro: 'o navegador deste agente não está aberto', codigo: 'sem-aba' };
    let valor;
    switch (acao) {
      case 'assumir': valor = await navegadores.assumir(agente); break;
      case 'devolver': valor = await navegadores.devolver(agente); break;
      case 'selecionar': valor = await navegadores.selecionar(agente, args.ligar !== false); break;
      case 'raioX': valor = await navegadores.raioX(agente, { seletor: args.seletor, busca: args.busca, dom: args.dom, partes: args.partes, silencioso: true }); break;
      case 'ler': valor = await navegadores.ler(agente, { silencioso: true }); break;
      case 'copy': valor = await navegadores.copy(agente); break;
      case 'clonar': valor = await navegadores.clonar(agente); break;
      case 'print': valor = await navegadores.print(agente); break;
      case 'abrir': valor = await navegadores.abrir(agente, args.url, { pessoa: true }); break;
      default: return { ok: false, erro: 'ação desconhecida: ' + acao, codigo: 'acao' };
    }
    return { ok: true, valor };
  } catch (x) { return { ok: false, erro: x.message, codigo: x.codigo }; }
});

app.whenReady().then(() => {
  if (OCULTO && app.dock) app.dock.hide(); /* testes escondidos não pulam no Dock do Theus */
  servidor = iniciar({ navegador: navegadores });
  abrirEstacao();
  app.on('activate', () => { if (!janela) abrirEstacao(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { navegadores.fechar(); if (servidor) servidor.parar(); });
