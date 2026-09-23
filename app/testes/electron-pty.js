/* Babel Coop · prova do CHECKLIST §0: o node-pty roda dentro do processo do Electron (sem compilar nada)
   Uso: npx electron testes/electron-pty.js   → abre um pty com o shell de login e roda `claude --version` dentro dele.
*/
'use strict';
const { app } = require('electron');
const pty = require('node-pty');

app.whenReady().then(() => {
  const shell = process.platform === 'win32' ? 'powershell.exe' : (process.env.SHELL || '/bin/zsh');
  const args = process.platform === 'win32' ? ['-NoLogo', '-Command', 'claude --version; $PSVersionTable.PSVersion.ToString()'] : ['-l', '-c', 'claude --version; echo "shell=$0 tty=$(tty)"'];
  const t = pty.spawn(shell, args, { name: 'xterm-256color', cols: 100, rows: 20, cwd: require('os').homedir(), env: process.env });
  let saida = '';
  t.onData((d) => { saida += d; });
  t.onExit(({ exitCode }) => {
    console.log(JSON.stringify({ electron: process.versions.electron, node: process.versions.node, modules: process.versions.modules, plataforma: process.platform + '-' + process.arch, pid: t.pid, exitCode, saida: saida.trim() }, null, 1));
    app.exit(exitCode === 0 ? 0 : 1);
  });
  setTimeout(() => { console.log('TEMPO ESGOTADO', saida); app.exit(2); }, 30000);
});
