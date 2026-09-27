/* babel-coop · a Estação (Electron)
   Sobe o servidor desta máquina e abre a interface servida por ele em http://localhost:<porta>.
   O celular e a TV da rede local abrem o mesmo endereço pelo IP da máquina.
   O navegador dos agentes (PROTOCOLO §9) mora aqui: <webview> na tela + navegador/navegador.js (CDP do próprio app).
   Nenhum Google Chrome em lugar nenhum: link de fora abre numa janela do app; nada chama shell.openExternal.
*/
'use strict';
const { app, BrowserWindow, ipcMain, clipboard, screen, dialog } = require('electron');
const path = require('path');
const { Oficina } = require('./servidor/oficina');
const config = require('./servidor/config');
const { Navegadores } = require('./navegador/navegador');

/* duas Estações na mesma máquina (testes): cada uma com a sua pasta de dados do Electron */
if (process.env.BABEL_COOP_RAIZ) app.setPath('userData', path.join(process.env.BABEL_COOP_RAIZ, '.coop', 'electron'));
const instanciaPrincipal = app.requestSingleInstanceLock();
if (!instanciaPrincipal) app.quit();
app.on('second-instance', () => {
  if (janela && !janela.isDestroyed()) { if (janela.isMinimized()) janela.restore(); janela.show(); janela.focus(); }
});

/* testes automáticos: BABEL_COOP_OCULTO=1 abre as janelas escondidas, sem roubar a tela de quem está usando o Mac */
const OCULTO = !!process.env.BABEL_COOP_OCULTO;
/* ...e mudo: janela escondida tocava "acordar" + "espera" no alto-falante de quem usa o Mac (3 bips a cada teste) */
if (OCULTO) app.on('web-contents-created', (_e, wc) => wc.setAudioMuted(true));

let servidor = null;
let janela = null;
let tv = null;
let oficina = null;
let servidorPrevia = false;
function reiniciarEstacao(execPath) {
  setTimeout(() => { app.relaunch(execPath ? { execPath, args: [] } : {}); app.quit(); }, 500);
}

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

/* a TV vai para a outra tela: com a TV ligada como tela separada (HDMI, ou AirPlay em "Usar como tela separada"),
   a janela abre nela em tela cheia e a Estação fica onde está. Com uma tela só (ou no modo Espelhar, que o sistema
   mostra como uma tela), abre janela comum. Se a TV for ligada depois, a janela vai sozinha para ela. */
function telaDaTv() {
  const telas = screen.getAllDisplays();
  if (telas.length < 2) return null;
  const daEstacao = janela && !janela.isDestroyed() ? screen.getDisplayMatching(janela.getBounds()) : screen.getPrimaryDisplay();
  const area = (t) => t.size.width * t.size.height;
  const outras = telas.filter((t) => t.id !== daEstacao.id).sort((a, b) => (a.internal === b.internal ? area(b) - area(a) : a.internal ? 1 : -1));
  return outras[0] || null;
}
function nomeDaTela(t) { return (t && t.label) || 'tela externa'; }
function levarTvPara(t) {
  if (!tv || tv.isDestroyed() || !t) return;
  const ir = () => { tv.setBounds(t.bounds); tv.setFullScreen(true); };
  if (tv.isFullScreen()) { tv.once('leave-full-screen', ir); tv.setFullScreen(false); } else ir();
}
function abrirTv(url) {
  const t = telaDaTv();
  if (tv) { if (t && screen.getDisplayMatching(tv.getBounds()).id !== t.id) levarTvPara(t); tv.focus(); return { tela: t ? nomeDaTela(t) : null }; }
  const onde = t ? { x: t.bounds.x, y: t.bounds.y, width: t.bounds.width, height: t.bounds.height, fullscreen: true } : { width: 1280, height: 720 };
  tv = new BrowserWindow(Object.assign({ title: 'babel-coop · TV', backgroundColor: '#060b16', autoHideMenuBar: true, show: !OCULTO, webPreferences: { contextIsolation: true } }, onde));
  tv.loadURL(url || 'http://localhost:' + servidor.porta + '/#tv');
  tv.on('closed', () => { tv = null; });
  return { tela: t ? nomeDaTela(t) : null };
}
function vigiarTelas() {
  screen.on('display-added', () => setTimeout(() => { if (tv) levarTvPara(telaDaTv()); }, 500));
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

ipcMain.handle('coop:tv', () => abrirTv());
ipcMain.handle('coop:cronometro', () => { abrirCronometro(); return true; });
ipcMain.handle('coop:eu', () => servidor.cfg());

/* A autorização de edição pertence a esta instalação e só pode ser alterada
   na janela principal local; páginas da rede e webviews não recebem este IPC. */
ipcMain.handle('coop:oficina', async (e, acao, args) => {
  if (!telaDaEstacao(e) || !janela || e.sender !== janela.webContents || !oficina) return { ok: false, erro: 'Abra a Oficina na Estação deste computador.' };
  args = args && typeof args === 'object' ? args : {};
  try {
    oficina.cfg = servidor.cfg();
    let valor;
    switch (acao) {
      case 'estado': valor = oficina.estado(); break;
      case 'liberar':
        valor = oficina.liberar(args.sim, args.identidade);
        if (!valor.autorizada) {
          servidor.agentes.encerrarOficina();
          if (servidorPrevia) reiniciarEstacao();
        }
        break;
      case 'selecionar': {
        if (!oficina.estado().autorizada) throw new Error('Marque esta versão como editável primeiro.');
        const r = await dialog.showOpenDialog(janela, { title: 'Pasta fonte do Babel Coop', properties: ['openDirectory'] });
        valor = r.canceled ? null : oficina.selecionar(r.filePaths[0]);
        if (valor) servidor.agentes.encerrarOficina();
        break;
      }
      case 'previa':
        valor = oficina.ativarPrevia(args.sim);
        if (!args.sim && servidorPrevia) reiniciarEstacao();
        break;
      case 'reiniciarPrevia':
        oficina.ativarPrevia(true);
        reiniciarEstacao();
        valor = oficina.estado(); break;
      case 'empacotar': {
        oficina.contextoAgente();
        servidor.agentes.encerrarOficina();
        const pacote = await oficina.empacotar();
        const executavel = path.join(pacote.app, 'Contents', 'MacOS', 'babel-coop');
        reiniciarEstacao(executavel);
        valor = pacote; break;
      }
      default: throw new Error('Ação desconhecida na Oficina.');
    }
    return { ok: true, valor };
  } catch (erro) { return { ok: false, erro: erro.message }; }
});

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
  if (!instanciaPrincipal) return;
  if (OCULTO && app.dock) app.dock.hide(); /* testes escondidos não pulam no Dock do Theus */
  oficina = new Oficina(config.carregar(), { appDir: __dirname, versao: app.getVersion() });
  const previa = oficina.pastasPrevia();
  let iniciar;
  try {
    iniciar = require(previa ? previa.servidor : './servidor/servidor').iniciar;
    servidorPrevia = !!previa;
    if (typeof iniciar !== 'function') throw new Error('O servidor da prévia não oferece iniciar().');
  } catch (erro) {
    if (!previa) throw erro;
    oficina.ativarPrevia(false);
    servidorPrevia = false;
    if (!OCULTO) dialog.showErrorBox('A prévia precisa de correção', erro.message + '\nA versão instalada será aberta.');
    iniciar = require('./servidor/servidor').iniciar;
  }
  const opcoesServidor = { navegador: navegadores, oficina, aoErro: (erro) => {
    if (!OCULTO) dialog.showErrorBox('Babel Coop não iniciou', erro.code === 'EADDRINUSE' ? 'A porta desta Estação está ocupada. Feche a outra cópia do Babel Coop antes de abrir esta versão.' : erro.message);
    if (servidorPrevia) oficina.ativarPrevia(false);
    app.quit();
  } };
  try { servidor = iniciar(opcoesServidor); }
  catch (erro) {
    if (servidorPrevia) {
      oficina.ativarPrevia(false);
      if (!OCULTO) dialog.showErrorBox('A prévia precisa de correção', erro.message + '\nA versão instalada abrirá ao reiniciar.');
      reiniciarEstacao();
      return;
    }
    throw erro;
  }
  abrirEstacao();
  vigiarTelas();
  app.on('activate', () => { if (!janela) abrirEstacao(); });
}).catch((erro) => { if (!OCULTO) dialog.showErrorBox('Babel Coop não iniciou', erro.message); app.quit(); });

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { navegadores.fechar(); if (servidor) servidor.parar(); });
