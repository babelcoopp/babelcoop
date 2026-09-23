/* babel-coop · empacota a Estação como app nativo do Mac (A19)
   1. ícone: build/icon.{png,icns,ico} a partir de prototipo/babel-logo.png (scripts/icone.js, Node puro)
   2. electron-builder, alvo "dir": dist/mac-<arch>/babel-coop.app, sem compilar nada (npmRebuild false) e sem baixar o
      Electron (electronDist = node_modules/electron/dist); node-pty fora do asar (app.asar.unpacked)
   3. confere o que o app instalado precisa para abrir um pty: pty.node e spawn-helper desempacotados, spawn-helper executável;
      que o pacote levou tudo (interface/, navegador/, servidor/, interface/midia fora do asar, protótipo inteiro com GLBs e
      vídeos) e que o fuse RunAsNode segue ligado (o gancho SessionStart do claude usa ELECTRON_RUN_AS_NODE=1)
   4. .dmg pelo hdiutil do próprio macOS (app + atalho para Aplicativos).
      Por que não o alvo "dmg" do electron-builder: a versão 26 baixa e roda o "dmgbuild", que é Python empacotado,
      e Python é proibido neste projeto (node_modules/dmg-builder/out/dmgUtil.js).
   Sem assinatura Apple (identity null): o pacote leva só a assinatura ad hoc ("-", sem certificado), para o macOS não dizer
   "danificado" no app baixado; Developer ID + notarização dependem do certificado do Theus.
   Uso: node scripts/empacotar.js [--sem-dmg] [--arch arm64|x64]
   Saída: dist/mac-<arch>/babel-coop.app, dist/babel-coop-<versão>-<arch>.dmg e dist/pacote.json (resumo com tamanhos).
*/
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');

const APP = path.join(__dirname, '..');
const DIST = path.join(APP, 'dist');
const pkg = require(path.join(APP, 'package.json'));
const NOME = pkg.build.productName;

const args = process.argv.slice(2);
const semDmg = args.includes('--sem-dmg');
const iArch = args.indexOf('--arch');
const arch = iArch >= 0 && args[iArch + 1] ? args[iArch + 1] : process.arch;
if (!['arm64', 'x64'].includes(arch)) throw new Error('arch inválida: ' + arch);

const log = (m) => console.log('[empacotar] ' + m);
const kb = (caminho) => +execFileSync('du', ['-sk', caminho]).toString().split('\t')[0];
const mb = (k) => (k / 1024).toFixed(1) + ' MB';
const sha256 = (arquivo) => crypto.createHash('sha256').update(fs.readFileSync(arquivo)).digest('hex');

/* onde o electron-builder põe o .app: mac-arm64 no Apple Silicon, mac no Intel */
function pastaDoApp() { return path.join(DIST, arch === 'x64' ? 'mac' : 'mac-' + arch); }

/* o que o node-pty precisa, dentro do app instalado */
function conferirPty(appPath) {
  const base = path.join(appPath, 'Contents', 'Resources', 'app.asar.unpacked', 'node_modules', 'node-pty', 'prebuilds', 'darwin-' + arch);
  const pty = path.join(base, 'pty.node'), helper = path.join(base, 'spawn-helper');
  const faltam = [pty, helper].filter((f) => !fs.existsSync(f));
  if (faltam.length) throw new Error('node-pty não foi desempacotado: falta ' + faltam.map((f) => path.relative(appPath, f)).join(', '));
  /* o npm entrega o spawn-helper sem +x (scripts/preparar.js corrige no node_modules); garante também no pacote */
  if (!(fs.statSync(helper).mode & 0o111)) { fs.chmodSync(helper, 0o755); log('spawn-helper sem permissão de execução no pacote: corrigido'); }
  return { pty: path.relative(appPath, pty), spawnHelper: path.relative(appPath, helper), modoSpawnHelper: (fs.statSync(helper).mode & 0o777).toString(8) };
}

/* todos os arquivos de uma pasta (relativos, com /), sem .DS_Store */
function arquivos(raiz, rel = '') {
  const saida = [];
  for (const d of fs.readdirSync(path.join(raiz, rel), { withFileTypes: true })) {
    if (d.name === '.DS_Store') continue;
    const r = rel ? rel + '/' + d.name : d.name;
    if (d.isDirectory()) saida.push(...arquivos(raiz, r)); else saida.push(r);
  }
  return saida;
}

/* o pacote leva TUDO o que o app usa hoje: interface/, navegador/, servidor/ (no asar), as mídias da interface fora do asar
   (o vídeo toca direto do disco) e o protótipo inteiro em Resources/prototipo (midia/pecas, GLBs, vídeos) */
function conferirConteudo(appPath) {
  const res = path.join(appPath, 'Contents', 'Resources');
  const asar = require('@electron/asar');
  const noAsar = new Set(asar.listPackage(path.join(res, 'app.asar'), { isPack: false }).map((f) => f.replace(/\\/g, '/').replace(/^\//, '')));
  const faltam = [];
  for (const pasta of ['interface', 'navegador', 'servidor']) {
    for (const f of arquivos(path.join(APP, pasta))) if (!/\.(map|pdb)$/.test(f) && !noAsar.has(pasta + '/' + f)) faltam.push(pasta + '/' + f);
  }
  const midiaUi = fs.existsSync(path.join(APP, 'interface', 'midia')) ? arquivos(path.join(APP, 'interface', 'midia')) : [];
  for (const f of midiaUi) if (!fs.existsSync(path.join(res, 'app.asar.unpacked', 'interface', 'midia', f))) faltam.push('app.asar.unpacked/interface/midia/' + f);
  const proto = arquivos(path.join(APP, '..', 'prototipo'));
  for (const f of proto) if (!fs.existsSync(path.join(res, 'prototipo', f))) faltam.push('prototipo/' + f);
  if (faltam.length) throw new Error('o pacote não levou ' + faltam.length + ' arquivo(s): ' + faltam.slice(0, 12).join(', '));
  return {
    interface: arquivos(path.join(APP, 'interface')).length, navegador: arquivos(path.join(APP, 'navegador')).length, servidor: arquivos(path.join(APP, 'servidor')).length,
    midiaInterfaceForaDoAsar: midiaUi.length, prototipo: proto.length,
    glb: proto.filter((f) => f.endsWith('.glb')).length, mp4: proto.filter((f) => f.endsWith('.mp4')).length + midiaUi.filter((f) => f.endsWith('.mp4')).length
  };
}

/* assinatura ad hoc do pacote inteiro (sem certificado, "-"). Sem ela, o electron-builder entrega o executável com a
   assinatura do linker e o pacote sem selo ("code has no resources but signature indicates they must be present"): baixado
   da internet, o macOS diria "está danificado" e não ofereceria "Abrir assim mesmo". Com o selo válido, o aviso vira o de
   desenvolvedor não verificado, que a pessoa libera uma vez. Não substitui o Developer ID + notarização (depende do Theus). */
function assinarAdHoc(appPath) {
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', '--timestamp=none', appPath], { stdio: ['ignore', 'pipe', 'pipe'] });
  const v = spawnSync('codesign', ['--verify', '--deep', '--strict', appPath], { encoding: 'utf8' });
  if (v.status !== 0) throw new Error('assinatura ad hoc não confere: ' + v.stderr.trim());
}

/* fuse RunAsNode ligado: o gancho SessionStart do claude roda o próprio executável do app como Node (ELECTRON_RUN_AS_NODE=1) */
async function conferirFuses(executavel) {
  const { getCurrentFuseWire, FuseV1Options } = require('@electron/fuses');
  const fio = await getCurrentFuseWire(executavel);
  const ligado = (op) => fio[op] === '1'.charCodeAt(0);
  if (!ligado(FuseV1Options.RunAsNode)) throw new Error('o fuse RunAsNode está desligado: o gancho SessionStart do claude não roda');
  const node = spawnSync(executavel, ['-e', 'process.stdout.write(process.versions.node)'], { env: Object.assign({}, process.env, { ELECTRON_RUN_AS_NODE: '1' }), encoding: 'utf8', timeout: 20000 });
  if (node.status !== 0 || !/^\d+\.\d+/.test(node.stdout)) throw new Error('ELECTRON_RUN_AS_NODE=1 não virou Node: ' + (node.stderr || node.stdout || node.error));
  return { runAsNode: true, nodeOptions: ligado(FuseV1Options.EnableNodeOptionsEnvironmentVariable), onlyLoadAppFromAsar: ligado(FuseV1Options.OnlyLoadAppFromAsar), nodeDoApp: node.stdout };
}

/* .dmg com o app e o atalho para /Applications, montado pelo hdiutil (nativo do macOS) */
function fazerDmg(appPath) {
  const pasta = path.dirname(appPath);
  const dmg = path.join(DIST, NOME + '-' + pkg.version + '-' + arch + '.dmg');
  const atalho = path.join(pasta, 'Applications');
  /* a pasta do electron-builder só tem o .app; o atalho entra ali durante a criação e sai logo depois (é só um link) */
  if (!fs.existsSync(atalho)) fs.symlinkSync('/Applications', atalho);
  try {
    /* no runner do GitHub o hdiutil às vezes responde "Resource busy" na primeira vez: até 3 tentativas */
    for (let tentativa = 1; ; tentativa++) {
      try { execFileSync('hdiutil', ['create', '-volname', NOME, '-srcfolder', pasta, '-ov', '-format', 'UDZO', '-imagekey', 'zlib-level=9', '-fs', 'HFS+', dmg], { stdio: ['ignore', 'pipe', 'inherit'] }); break; }
      catch (e) { if (tentativa >= 3) throw e; log('hdiutil falhou (tentativa ' + tentativa + '), repetindo em 5 s'); Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5000); }
    }
  } finally {
    if (fs.lstatSync(atalho, { throwIfNoEntry: false })?.isSymbolicLink()) fs.unlinkSync(atalho);
  }
  execFileSync('hdiutil', ['verify', dmg], { stdio: ['ignore', 'pipe', 'pipe'] });
  return dmg;
}

async function main() {
  if (process.platform !== 'darwin') throw new Error('este empacotamento é o do Mac; no Windows use npm run dist:win');
  const t0 = Date.now();

  const icone = require('./icone').gerar();
  log('ícone ' + (icone.refeito ? 'gerado' : 'em dia') + ': build/icon.png, icon.icns, icon.ico');

  /* spawn-helper executável já no node_modules (o electron-builder copia o modo do arquivo) */
  const helperDev = path.join(APP, 'node_modules', 'node-pty', 'prebuilds', 'darwin-' + arch, 'spawn-helper');
  if (fs.existsSync(helperDev)) fs.chmodSync(helperDev, 0o755);

  const builder = require('electron-builder');
  process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false'; /* nunca pegar um certificado do chaveiro por engano */
  log('electron-builder --mac dir (' + arch + ')…');
  await builder.build({ projectDir: APP, targets: builder.Platform.MAC.createTarget(['dir'], builder.Arch[arch]), publish: 'never' });

  const appPath = path.join(pastaDoApp(), NOME + '.app');
  if (!fs.existsSync(appPath)) throw new Error('o electron-builder não gerou ' + appPath);
  const pty = conferirPty(appPath);
  const executavel = path.join(appPath, 'Contents', 'MacOS', NOME);
  if (!fs.existsSync(executavel)) throw new Error('executável não encontrado: ' + executavel);
  assinarAdHoc(appPath);
  log('assinatura ad hoc do pacote inteiro: codesign --verify --deep --strict confere');
  const conteudo = conferirConteudo(appPath);
  log('conteúdo: ' + JSON.stringify(conteudo));
  const fuses = await conferirFuses(executavel);
  log('fuse RunAsNode ligado · ELECTRON_RUN_AS_NODE=1 → Node ' + fuses.nodeDoApp);
  const resumo = {
    conteudo, fuses,
    nome: NOME, versao: pkg.version, arch, electron: require(path.join(APP, 'node_modules', 'electron', 'package.json')).version,
    app: path.relative(APP, appPath), executavel: path.relative(APP, executavel), tamanhoAppKB: kb(appPath), pty,
    prototipo: fs.existsSync(path.join(appPath, 'Contents', 'Resources', 'prototipo', 'index.html')),
    /* sem Developer ID: o executável do Electron vem com assinatura ad hoc do linker; o pacote em si fica sem selo */
    assinatura: (spawnSync('codesign', ['-dv', appPath], { encoding: 'utf8' }).stderr || '').split('\n').filter((l) => /^(Signature|Format|CodeDirectory|Sealed Resources|TeamIdentifier)|not signed/.test(l)).join(' | ')
  };
  log('app: ' + resumo.app + ' · ' + mb(resumo.tamanhoAppKB));

  if (!semDmg) {
    log('hdiutil: montando o .dmg…');
    const dmg = fazerDmg(appPath);
    resumo.dmg = path.relative(APP, dmg);
    resumo.tamanhoDmgKB = Math.round(fs.statSync(dmg).size / 1024);
    resumo.sha256Dmg = sha256(dmg);
    log('dmg: ' + resumo.dmg + ' · ' + mb(resumo.tamanhoDmgKB));
  }
  resumo.segundos = Math.round((Date.now() - t0) / 100) / 10;
  resumo.quando = new Date().toISOString();
  fs.writeFileSync(path.join(DIST, 'pacote.json'), JSON.stringify(resumo, null, 2) + '\n');
  log('pronto em ' + resumo.segundos + ' s · resumo em dist/pacote.json');
  log('instalar: ditto "' + appPath + '" "/Applications/' + NOME + '.app" && open -a "/Applications/' + NOME + '.app"');
}

main().catch((e) => { console.error('[empacotar] falhou: ' + (e && e.stack || e)); process.exit(1); });
