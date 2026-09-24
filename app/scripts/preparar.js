/* Babel Coop · depois do npm install (sem compilar nada: node-pty vem com binários N-API prontos)
   1. o spawn-helper do node-pty chega do npm sem permissão de execução no Mac → "posix_spawnp failed"
   2. o Electron 44 não baixa o binário sozinho no install → baixa aqui se faltar
   3. no Mac, pasta que chegou por AirDrop, e-mail ou navegador traz com.apple.quarantine nos binários: o pty.node falha no
      dlopen e o Electron não sobe ("Process failed to launch!"). Tira a quarentena do node-pty e do Electron (xattr do macOS).
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

/* sem quarentena nos binários que o app carrega (só no Mac; sem o xattr, segue) */
function semQuarentena(caminho) {
  if (process.platform !== 'darwin' || !fs.existsSync(caminho)) return;
  try {
    execFileSync('xattr', ['-dr', 'com.apple.quarantine', caminho], { stdio: ['ignore', 'ignore', 'pipe'] });
    console.log('[preparar] sem quarentena: ' + path.relative(raiz, caminho));
  } catch (e) { console.log('[preparar] xattr não tirou a quarentena de ' + path.relative(raiz, caminho) + ': ' + String(e.message || e).split('\n')[0]); }
}
semQuarentena(prebuilds);
semQuarentena(electron);
