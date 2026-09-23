/* babel-coop · vitrine: UMA janela visível do app para o Theus acompanhar a obra ao vivo.
   Uso: cd app && node scripts/vitrine.js
   - abre o app de verdade (Electron) numa raiz própria da vitrine (não mexe na ~/BabelCoop);
   - funda a equipe "Theus" na primeira vez;
   - quando a interface muda (prototipo/ ou app/interface/ ou ponte.js), recarrega a página;
   - quando o servidor, o main.js, o preload.js ou o navegador mudam, reinicia o app (no máximo 1 vez por minuto).
   Os testes dos agentes continuam escondidos; só esta janela aparece. */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { _electron } = require('playwright');

const APP = path.join(__dirname, '..');
const RAIZ_REPO = path.join(APP, '..');
const RAIZ = process.env.BABEL_COOP_VITRINE || path.join(os.tmpdir(), 'babel-coop-vitrine');
const PORTA = 4700, DESCOBERTA = 41200;
let app = null, page = null, reiniciando = false, ultimoReinicio = 0;

async function abrir() {
  fs.mkdirSync(RAIZ, { recursive: true });
  const env = Object.assign({}, process.env, { BABEL_COOP_RAIZ: RAIZ, BABEL_COOP_PORTA: String(PORTA), BABEL_COOP_DESCOBERTA: String(DESCOBERTA) });
  delete env.BABEL_COOP_OCULTO;
  app = await _electron.launch({ args: [APP], cwd: APP, env });
  page = await app.firstWindow();
  await page.waitForTimeout(1500);
  const eu = await (await fetch('http://localhost:' + PORTA + '/api/eu')).json().catch(() => ({}));
  if (!eu.pronto) {
    await fetch('http://localhost:' + PORTA + '/api/fundar', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:' + PORTA }, body: JSON.stringify({ nome: 'Theus' }) }).catch(() => {});
    await page.reload();
  }
  app.on('close', () => { if (!reiniciando) { console.log('[vitrine] janela fechada pelo Theus; encerrando'); process.exit(0); } });
  console.log('[vitrine] aberta em http://localhost:' + PORTA + ' · raiz ' + RAIZ);
}

async function reiniciar(motivo) {
  const agora = Date.now();
  if (reiniciando || agora - ultimoReinicio < 60000) return;
  reiniciando = true; ultimoReinicio = agora;
  console.log('[vitrine] reiniciando o app: ' + motivo);
  try { await app.close(); } catch (e) { /* já fechado */ }
  try { await abrir(); } catch (e) { console.log('[vitrine] falhou ao reabrir: ' + e.message); }
  reiniciando = false;
}

let tRecarga = null;
function recarregar(motivo) {
  clearTimeout(tRecarga);
  tRecarga = setTimeout(async () => { try { await page.reload(); console.log('[vitrine] recarregada: ' + motivo); } catch (e) { /* app reiniciando */ } }, 1500);
}

function vigiar(pasta, fn) {
  try { fs.watch(pasta, { recursive: true }, (ev, nome) => { if (nome && !/node_modules|\.DS_Store|dist\//.test(nome)) fn(nome); }); } catch (e) { console.log('[vitrine] não vigio ' + pasta + ': ' + e.message); }
}

(async () => {
  await abrir();
  vigiar(path.join(RAIZ_REPO, 'prototipo'), (n) => recarregar('prototipo/' + n));
  vigiar(path.join(APP, 'interface'), (n) => recarregar('interface/' + n));
  vigiar(path.join(APP, 'servidor'), (n) => reiniciar('servidor/' + n));
  vigiar(path.join(APP, 'navegador'), (n) => reiniciar('navegador/' + n));
  fs.watchFile(path.join(APP, 'ponte.js'), { interval: 2000 }, () => recarregar('ponte.js'));
  fs.watchFile(path.join(APP, 'main.js'), { interval: 2000 }, () => reiniciar('main.js'));
  fs.watchFile(path.join(APP, 'preload.js'), { interval: 2000 }, () => reiniciar('preload.js'));
})().catch((e) => { console.error('[vitrine] erro: ' + e.message); process.exit(1); });
