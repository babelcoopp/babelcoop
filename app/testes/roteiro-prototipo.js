/* babel-coop · roda docs/testes/roteiro.js (o roteiro do protótipo) num Chromium headless, sem janela e sem MCP
   O roteiro aponta para a pasta prototipo/ de outra máquina: aqui a base é trocada pela deste repositório.
   Rodar: cd app && node testes/roteiro-prototipo.js [saida.json] */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const REPO = path.join(__dirname, '..', '..');
const fonte = fs.readFileSync(path.join(REPO, 'docs', 'testes', 'roteiro.js'), 'utf8')
  .replace(/const base = '[^']*';/, 'const base = ' + JSON.stringify(path.join(REPO, 'prototipo')) + ';');

(async () => {
  const velho = path.join(require('os').homedir(), 'Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell');
  const navegador = await chromium.launch(Object.assign({ headless: true }, fs.existsSync(velho) ? { executablePath: velho } : {}));
  const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await contexto.newPage();
  let r;
  try {
    const roteiro = eval('(' + fonte.replace(/^\s*\/\*[\s\S]*?\*\/\s*/, '') + ')');
    r = await roteiro(page);
  } catch (e) { r = { erro: String(e && e.stack || e) }; }
  await navegador.close();
  if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(r, null, 2));
  console.log(r.resumo || r.erro);
  (r.falhas || []).forEach((f) => console.log('✗ ' + f.secao + ' · ' + f.nome + ' → ' + String(f.achou || f.detalhe || '').slice(0, 200)));
  process.exitCode = r.falhas && r.falhas.length === 0 ? 0 : 1;
})();
