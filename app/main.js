/* Babel Coop · a Estação (Electron)
   Sobe o servidor desta máquina e abre a interface servida por ele em http://localhost:<porta>.
   O celular e a TV da rede local abrem o mesmo endereço pelo IP da máquina.
*/
'use strict';
const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { iniciar } = require('./servidor/servidor');

let servidor = null;
let janela = null;
let tv = null;

function abrirEstacao() {
  janela = new BrowserWindow({
    width: 1440, height: 900, minWidth: 980, minHeight: 640,
    title: 'Babel Coop', backgroundColor: '#060b16',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: false }
  });
  janela.loadURL('http://localhost:' + servidor.porta + '/');
  janela.webContents.setWindowOpenHandler(({ url }) => {
    /* "Tela da TV" abre numa janela própria, sem botões, para espelhar na TV */
    if (url.indexOf('#tv') !== -1) { abrirTv(url); return { action: 'deny' }; }
    if (url.indexOf('#cronometro') !== -1) { abrirCronometro(url); return { action: 'deny' }; }
    if (/^https?:/.test(url) && url.indexOf('localhost:' + servidor.porta) === -1) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow' };
  });
  janela.on('closed', () => { janela = null; });
}

function abrirTv(url) {
  if (tv) { tv.focus(); return; }
  tv = new BrowserWindow({ width: 1280, height: 720, title: 'Babel Coop · TV', backgroundColor: '#060b16', autoHideMenuBar: true, webPreferences: { contextIsolation: true } });
  tv.loadURL(url || 'http://localhost:' + servidor.porta + '/#tv');
  tv.on('closed', () => { tv = null; });
}

/* o cronômetro que persegue a pessoa: janelinha sem moldura, sempre por cima, em todas as mesas (Spaces) e por cima de apps em tela cheia */
let cronometro = null;
function abrirCronometro(url) {
  if (cronometro) { cronometro.focus(); return; }
  cronometro = new BrowserWindow({
    width: 300, height: 170, minWidth: 220, minHeight: 120, frame: false, transparent: false, resizable: true, minimizable: false, maximizable: false, fullscreenable: false,
    alwaysOnTop: true, skipTaskbar: true, hasShadow: true, backgroundColor: '#060b16', title: 'Cronômetro · Babel Coop',
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

app.whenReady().then(() => {
  servidor = iniciar();
  abrirEstacao();
  app.on('activate', () => { if (!janela) abrirEstacao(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { if (servidor) servidor.parar(); });
