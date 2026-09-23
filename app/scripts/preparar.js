/* Babel Coop · depois do npm install (sem compilar nada: node-pty vem com binários N-API prontos)
   1. o spawn-helper do node-pty chega do npm sem permissão de execução no Mac → "posix_spawnp failed"
   2. o Electron 44 não baixa o binário sozinho no install → baixa aqui se faltar
*/
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const raiz = path.join(__dirname, '..');
const prebuilds = path.join(raiz, 'node_modules', 'node-pty', 'prebuilds');
if (fs.existsSync(prebuilds)) {
  fs.readdirSync(prebuilds).filter((d) => d.startsWith('darwin')).forEach((d) => {
    const h = path.join(prebuilds, d, 'spawn-helper');
    if (fs.existsSync(h)) { fs.chmodSync(h, 0o755); console.log('[preparar] spawn-helper executável: ' + d); }
  });
}
const electron = path.join(raiz, 'node_modules', 'electron');
if (fs.existsSync(electron) && !fs.existsSync(path.join(electron, 'path.txt'))) {
  console.log('[preparar] baixando o Electron…');
  execFileSync(process.execPath, [path.join(electron, 'install.js')], { stdio: 'inherit' });
}
