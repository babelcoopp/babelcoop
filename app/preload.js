/* Babel Coop · o que a interface pode pedir ao Electron (pouco: o resto passa pelo servidor local) */
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('coopElectron', {
  abrirTv: () => ipcRenderer.invoke('coop:tv'),
  eu: () => ipcRenderer.invoke('coop:eu'),
  plataforma: process.platform
});
