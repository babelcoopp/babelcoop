/* babel-coop · e2e do app EMPACOTADO (A19: abre nativo, instalado no Mac)
   Não testa o app de desenvolvimento: abre dist/mac-<arch>/babel-coop.app/Contents/MacOS/babel-coop, o mesmo executável que
   o Ryan copia para /Applications. Janela escondida (BABEL_COOP_OCULTO=1), raiz temporária, porta 4991 e descoberta 41491.
   Prova, em ordem:
   1. o pacote tem o que o app instalado precisa (Info.plist, ícone, node-pty fora do asar e executável, protótipo em Resources,
      nada de testes/scripts/dependências de desenvolvimento no asar, nenhum shell.openExternal no código do app);
   2. o .dmg confere e, montado sem aparecer no Finder, traz o app e o atalho para Aplicativos;
   3. o app abre a Estação servida de dentro do pacote, a pessoa funda a equipe pela tela de boas-vindas e um pty abre
      de dentro do app (o pai do zsh é o executável do pacote; o pty.node carregado é o de app.asar.unpacked).
   Uso: npm run empacotar && npm run teste:pacote     (evidências em .deus/terminal-ao-vivo/evidencias/pacote/)
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const WebSocket = require('ws');

const APP = path.join(__dirname, '..', '..');
const pkg = require(path.join(APP, 'package.json'));
const NOME = pkg.build.productName;
const ARCH = process.arch;
const APP_PATH = path.join(APP, 'dist', ARCH === 'x64' ? 'mac' : 'mac-' + ARCH, NOME + '.app');
const EXEC = path.join(APP_PATH, 'Contents', 'MacOS', NOME);
const RES = path.join(APP_PATH, 'Contents', 'Resources');
const DMG = path.join(APP, 'dist', NOME + '-' + pkg.version + '-' + ARCH + '.dmg');
const EVID = process.env.BABEL_TESTE_EVIDENCIAS ? path.join(process.env.BABEL_TESTE_EVIDENCIAS, 'pacote') : path.join(APP, '..', '.deus', 'terminal-ao-vivo', 'evidencias', 'pacote');
const PORTA = 4991, DESCOBERTA = 41491, ORIGEM = 'http://localhost:' + PORTA;

const SEM_PACOTE = process.platform !== 'darwin' ? 'só no Mac' : (fs.existsSync(EXEC) ? false : 'sem pacote: rode npm run empacotar');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const kb = (p) => +execFileSync('du', ['-sk', p]).toString().split('\t')[0];
const vivo = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
const evid = { quando: new Date().toISOString(), app: path.relative(APP, APP_PATH), arch: ARCH };
function gravarEvidencia() { fs.mkdirSync(EVID, { recursive: true }); fs.writeFileSync(path.join(EVID, 'pacote-e2e.json'), JSON.stringify(evid, null, 2) + '\n'); }

/* o ambiente do app: sem as variáveis da sessão de quem roda o teste (Claude Code, terminal) */
function ambienteLimpo() {
  const env = {};
  Object.keys(process.env).forEach((k) => { if (!/^(CLAUDE|TERM_SESSION|TERM_PROGRAM|TERM_FEATURES|ITERM|LC_TERMINAL|BABEL_COOP|ELECTRON_RUN_AS_NODE)/.test(k)) env[k] = process.env[k]; });
  return env;
}

describe('pacote do Mac (A19)', () => {
  after(gravarEvidencia);

  it('o .app tem o que o app instalado precisa', { skip: SEM_PACOTE }, () => {
    const plist = JSON.parse(execFileSync('plutil', ['-convert', 'json', '-o', '-', path.join(APP_PATH, 'Contents', 'Info.plist')]).toString());
    assert.equal(plist.CFBundleIdentifier, 'com.babel.coop');
    assert.equal(plist.CFBundleName, 'babel-coop');
    assert.equal(plist.CFBundleExecutable, 'babel-coop');
    assert.equal(plist.CFBundleShortVersionString, pkg.version);
    assert.equal(plist.CFBundleIconFile, 'icon.icns');
    assert.match(plist.NSLocalNetworkUsageDescription || '', /rede local/);
    /* ícone: contêiner icns válido, com a versão 1024 (ic10) dentro */
    const icns = fs.readFileSync(path.join(RES, 'icon.icns'));
    assert.equal(icns.toString('ascii', 0, 4), 'icns');
    assert.ok(icns.includes(Buffer.from('ic10')), 'icns sem a camada 1024');
    /* node-pty desempacotado: o binário e o spawn-helper executável (sem +x o pty falha com "posix_spawnp failed") */
    const pre = path.join(RES, 'app.asar.unpacked', 'node_modules', 'node-pty', 'prebuilds', 'darwin-' + ARCH);
    assert.ok(fs.existsSync(path.join(pre, 'pty.node')), 'pty.node fora do asar');
    const modo = fs.statSync(path.join(pre, 'spawn-helper')).mode;
    assert.ok(modo & 0o100, 'spawn-helper sem permissão de execução: ' + (modo & 0o777).toString(8));
    assert.ok(!fs.existsSync(path.join(pre, '..', 'win32-x64')), 'binários do Windows não entram no pacote do Mac');
    /* a interface do protótipo vai como recurso extra, fora do asar */
    assert.ok(fs.existsSync(path.join(RES, 'prototipo', 'index.html')), 'Resources/prototipo/index.html');
    assert.ok(!fs.existsSync(path.join(RES, 'default_app.asar')), 'o app padrão do Electron não fica no pacote');
    /* o asar: o app e as dependências de produção; nada de teste, script, build ou dependência de desenvolvimento */
    const asar = require('@electron/asar');
    const arquivo = path.join(RES, 'app.asar');
    const lista = asar.listPackage(arquivo, { isPack: false }).map((f) => f.replace(/\\/g, '/'));
    ['/main.js', '/preload.js', '/ponte.js', '/package.json', '/servidor/servidor.js', '/servidor/terminal.js', '/interface/organismo.js', '/node_modules/node-pty/lib/index.js', '/node_modules/@xterm/headless/package.json', '/node_modules/ws/package.json']
      .forEach((f) => assert.ok(lista.includes(f), 'falta no asar: ' + f));
    const proibidos = lista.filter((f) => /^\/(testes|scripts|build|dist)\/|^\/node_modules\/(electron|electron-builder|playwright|playwright-core|app-builder-lib|@electron)\/|\.map$|\.test\.js$/.test(f));
    assert.deepEqual(proibidos, [], 'o asar leva o que não devia');
    /* A26: nenhum link sai para o navegador do sistema (Chrome) — procura no código do próprio app */
    const doApp = lista.filter((f) => /^\/(main|preload|ponte)\.js$|^\/(servidor|interface|navegador)\/.*\.(js|html)$/.test(f));
    /* só o código: um comentário que diz "nada chama shell.openExternal" não conta */
    const semComentario = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
    const comExterno = doApp.filter((f) => /shell\s*\.\s*openExternal|openExternal\s*\(|channel\s*:\s*['"]chrome/.test(semComentario(asar.extractFile(arquivo, f.slice(1)).toString())));
    assert.deepEqual(comExterno, [], 'shell.openExternal ou canal chrome no código do app');
    const nav = lista.filter((f) => /^\/navegador\//.test(f));
    /* sem quarentena: o app construído aqui abre sem o aviso do Gatekeeper (o baixado da internet precisaria da assinatura) */
    const quarentena = spawnSync('xattr', ['-r', '-l', APP_PATH], { encoding: 'utf8' }).stdout.split('\n').filter((l) => /com\.apple\.quarantine/.test(l));
    assert.deepEqual(quarentena, [], 'atributo de quarentena no pacote');
    fs.mkdirSync(EVID, { recursive: true });
    fs.copyFileSync(path.join(APP, 'build', 'icon.png'), path.join(EVID, 'icone-1024.png'));
    evid.estatico = {
      infoPlist: { id: plist.CFBundleIdentifier, nome: plist.CFBundleName, versao: plist.CFBundleShortVersionString, sistemaMinimo: plist.LSMinimumSystemVersion },
      asarArquivos: lista.length, codigoDoAppVerificado: doApp.length, navegadorNoPacote: nav.length,
      spawnHelperModo: (modo & 0o777).toString(8), tamanhoAppMB: +(kb(APP_PATH) / 1024).toFixed(1),
      assinatura: (spawnSync('codesign', ['-dv', APP_PATH], { encoding: 'utf8' }).stderr || '').split('\n').filter((l) => /^(Signature|Format|CodeDirectory|Sealed Resources|TeamIdentifier)|not signed/.test(l)).join(' | ')
    };
  });

  it('o .dmg confere e monta com o app e o atalho para Aplicativos', { skip: SEM_PACOTE || (fs.existsSync(DMG) ? false : 'sem .dmg: rode npm run empacotar') }, () => {
    execFileSync('hdiutil', ['verify', DMG], { stdio: ['ignore', 'pipe', 'pipe'] });
    const ponto = fs.mkdtempSync(path.join(os.tmpdir(), 'babel-dmg-'));
    /* -nobrowse: não aparece no Finder nem na mesa; só leitura */
    execFileSync('hdiutil', ['attach', DMG, '-nobrowse', '-readonly', '-noautoopen', '-mountpoint', ponto], { stdio: ['ignore', 'pipe', 'pipe'] });
    try {
      const itens = fs.readdirSync(ponto).filter((n) => !n.startsWith('.')).sort();
      assert.deepEqual(itens, ['Applications', NOME + '.app']);
      assert.equal(fs.readlinkSync(path.join(ponto, 'Applications')), '/Applications');
      const exe = path.join(ponto, NOME + '.app', 'Contents', 'MacOS', NOME);
      assert.ok(fs.statSync(exe).mode & 0o100, 'executável dentro do dmg');
      const helper = path.join(ponto, NOME + '.app', 'Contents', 'Resources', 'app.asar.unpacked', 'node_modules', 'node-pty', 'prebuilds', 'darwin-' + ARCH, 'spawn-helper');
      assert.ok(fs.statSync(helper).mode & 0o100, 'spawn-helper executável dentro do dmg');
      evid.dmg = { arquivo: path.relative(APP, DMG), tamanhoMB: +(fs.statSync(DMG).size / 1048576).toFixed(1), conteudo: itens };
    } finally {
      try { execFileSync('hdiutil', ['detach', ponto], { stdio: 'ignore' }); } catch (e) { execFileSync('hdiutil', ['detach', ponto, '-force'], { stdio: 'ignore' }); }
    }
  });

  describe('o app empacotado rodando', { skip: SEM_PACOTE }, () => {
    let eapp = null, page = null, principal = null, ws = null;
    const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'babel-pacote-'));
    const msgs = [];

    before(async () => {
      fs.mkdirSync(EVID, { recursive: true });
      const { _electron } = require('playwright');
      /* zsh sem os arquivos do Theus: ZDOTDIR vazio dentro da raiz temporária (nada vai para o histórico dele) */
      const zdot = path.join(raiz, '.zdotdir'); fs.mkdirSync(zdot);
      const env = Object.assign(ambienteLimpo(), { BABEL_COOP_RAIZ: raiz, BABEL_COOP_PORTA: String(PORTA), BABEL_COOP_DESCOBERTA: String(DESCOBERTA), BABEL_COOP_OCULTO: '1', ZDOTDIR: zdot });
      const t0 = Date.now();
      eapp = await _electron.launch({ executablePath: EXEC, args: [], env, cwd: raiz, timeout: 60000 });
      page = await eapp.firstWindow();
      await page.waitForLoadState('load');
      evid.abrirMs = Date.now() - t0;
    });

    after(async () => {
      if (ws) try { ws.close(); } catch (e) { /* já fechado */ }
      if (eapp) {
        const pid = principal && principal.pid;
        await eapp.close().catch(() => {});
        if (pid) { for (let i = 0; i < 50 && vivo(pid); i++) await esperar(100); evid.fechou = { pidPrincipal: pid, vivoDepois: vivo(pid) }; }
      }
    });

    it('é o executável do pacote, servindo a Estação de dentro dele', async () => {
      principal = await eapp.evaluate(({ app }) => ({ empacotado: app.isPackaged, caminho: app.getAppPath(), recursos: process.resourcesPath, nome: app.getName(), versao: app.getVersion(), electron: process.versions.electron, pid: process.pid, exe: process.execPath }));
      assert.equal(principal.empacotado, true);
      assert.equal(fs.realpathSync(principal.caminho), fs.realpathSync(path.join(RES, 'app.asar')));
      assert.equal(fs.realpathSync(principal.exe), fs.realpathSync(EXEC));
      assert.equal(principal.nome, 'babel-coop');
      assert.equal(page.url(), ORIGEM + '/');
      /* a interface servida é a do Resources/prototipo do pacote, byte a byte */
      for (const f of ['tokens.css', 'casca-2030.css', 'babel-logo.png', 'estacao.js']) {
        const servido = Buffer.from(await (await fetch(ORIGEM + '/' + f)).arrayBuffer());
        assert.ok(servido.equals(fs.readFileSync(path.join(RES, 'prototipo', f))), f + ' servido difere do que está no pacote');
      }
      const eu = await (await fetch(ORIGEM + '/api/eu')).json();
      assert.equal(eu.motor.electron, principal.electron);
      assert.equal(eu.versao, pkg.version);
      assert.equal(eu.terminalReal, true, 'node-pty e @xterm/headless carregaram dentro do pacote');
      evid.principal = { empacotado: principal.empacotado, appPath: principal.caminho, execPath: principal.exe, electron: principal.electron, terminalReal: eu.terminalReal };
    });

    it('funda a equipe pela tela de boas-vindas', async () => {
      await page.waitForSelector('#coop-boasvindas', { timeout: 20000 });
      await page.screenshot({ path: path.join(EVID, 'pacote-boasvindas.png'), timeout: 15000 }).catch((e) => { evid.printBoasVindas = 'falhou: ' + e.message; });
      await page.click('#coop-boasvindas details summary');
      await page.fill('#cbv-nome', 'Theus');
      const recarregou = page.waitForEvent('load', { timeout: 20000 });
      await page.click('#cbv-fundar');
      await recarregou;
      await page.waitForFunction(() => !!(window.BC && BC.real && BC.real.bemvindo && BC.real.bemvindo.eu && BC.real.bemvindo.eu.pronto), null, { timeout: 20000 });
      const eu = await (await fetch(ORIGEM + '/api/eu')).json();
      assert.equal(eu.pronto, true);
      assert.equal(eu.papel, 'gestao');
      assert.equal(eu.nome, 'Theus');
      assert.equal(await page.locator('#coop-boasvindas').count(), 0, 'a tela de boas-vindas saiu');
      const cfg = path.join(raiz, 'coop.json');
      assert.ok(fs.existsSync(cfg), 'coop.json na raiz');
      assert.equal(fs.statSync(cfg).mode & 0o777, 0o600, 'coop.json só para o dono');
      assert.ok(fs.existsSync(eu.pasta) && fs.realpathSync(path.dirname(eu.pasta)) === fs.realpathSync(raiz), 'pasta compartilhada dentro da raiz');
      await esperar(800);
      await page.screenshot({ path: path.join(EVID, 'pacote-estacao.png'), timeout: 15000 }).catch((e) => { evid.printEstacao = 'falhou: ' + e.message; });
      evid.fundar = { id: eu.id, papel: eu.papel, pasta: eu.pasta };
      /* diagnóstico (sem assert): quais peças reais a página carregou dentro do pacote */
      evid.pecasNaPagina = await page.evaluate(() => ({
        coopReal: window.COOP_REAL || null,
        scriptsCoop: Array.from(document.scripts).map((s) => s.getAttribute('src') || '').filter((s) => /^\/(coop|vendor)\/|ponte\.js/.test(s)),
        organismo: !!(window.BC && BC.organismo), xterm: document.querySelectorAll('.xterm').length, real: !!(window.BC && BC.real)
      }));
    });

    it('abre um pty de dentro do pacote e roda echo pacote-ok', async () => {
      ws = new WebSocket('ws://localhost:' + PORTA + '/ws', { origin: ORIGEM });
      ws.on('message', (b) => { try { msgs.push(JSON.parse(b.toString())); } catch (e) { /* ignora */ } });
      await new Promise((ok, erro) => { ws.once('open', ok); ws.once('error', erro); });
      const achar = async (fn, ms, oque) => { const fim = Date.now() + ms; for (;;) { const m = msgs.find(fn); if (m) return m; if (Date.now() > fim) throw new Error('não chegou: ' + oque); await esperar(20); } };
      const bv = await achar((m) => m.tipo === 'bemvindo', 10000, 'bemvindo');
      assert.equal(bv.terminalReal, true);
      assert.equal(bv.eu.pronto, true);

      const tAbrir = Date.now();
      ws.send(JSON.stringify({ tipo: 'term-abrir', id: 'pacote1', nome: 'pacote', cols: 100, rows: 30 }));
      const aberto = await achar((m) => m.tipo === 'term-aberto' && m.info && m.info.id === 'pacote1', 15000, 'term-aberto');
      const abrirMs = Date.now() - tAbrir;
      const saida = () => msgs.filter((m) => m.tipo === 'term-saida' && m.id === 'pacote1').map((m) => m.dados).join('') + (aberto.tela || '');

      /* "pacote-$(printf ok)": o eco da digitação não contém "pacote-ok"; só a execução do comando produz */
      const tEco = Date.now();
      ws.send(JSON.stringify({ tipo: 'term-entrada', id: 'pacote1', dados: 'echo pacote-$(printf ok); echo "pwd=$(pwd)"; echo "eu=$$ pai=$PPID"; echo "exe=$(ps -o comm= -p $PPID)"; echo fim-$((6*7))\r' }));
      await achar(() => /fim-42/.test(saida()), 20000, 'fim-42 na saída do pty');
      const ecoMs = Date.now() - tEco;
      /* tira as sequências de controle (CSI e OSC) e casa só no começo de linha: o eco da digitação não conta */
      const texto = saida().replace(/\x1b\][^\x07\x1b]*(\x07|\x1b\\)/g, '').replace(/\x1b\[[0-9;?]*[ -\/]*[@-~]/g, '').replace(/\x1b[()][0-9A-Za-z]/g, '').replace(/\r/g, '');
      assert.match(texto, /(^|\n)pacote-ok\n/, 'pacote-ok na saída');
      const pwd = (texto.match(/(?:^|\n)pwd=(\/[^\n]*)\n/) || [])[1];
      assert.ok(pwd, 'pwd na saída');
      const eu = await (await fetch(ORIGEM + '/api/eu')).json();
      assert.equal(fs.realpathSync(pwd.trim()), fs.realpathSync(eu.pasta), 'o terminal abre na pasta compartilhada');
      const [, pidShell, pai] = texto.match(/(?:^|\n)eu=(\d+) pai=(\d+)\n/) || [];
      assert.equal(+pai, principal.pid, 'o pai do zsh é o processo principal do app empacotado');
      const exe = ((texto.match(/(?:^|\n)exe=(\/[^\n]*)\n/) || [])[1] || '').trim();
      assert.ok(exe.endsWith(NOME + '.app/Contents/MacOS/' + NOME), 'o pai é o executável do pacote: ' + exe);
      /* o pty.node que o processo carregou é o de app.asar.unpacked, dentro do pacote */
      const mapeados = execFileSync('lsof', ['-p', String(principal.pid), '-Fn']).toString().split('\n').filter((l) => /pty\.node$/.test(l)).map((l) => l.slice(1));
      assert.ok(mapeados.length >= 1, 'pty.node carregado');
      mapeados.forEach((m) => assert.equal(fs.realpathSync(m), fs.realpathSync(path.join(RES, 'app.asar.unpacked', 'node_modules', 'node-pty', 'prebuilds', 'darwin-' + ARCH, 'pty.node'))));

      ws.send(JSON.stringify({ tipo: 'term-fechar', id: 'pacote1' }));
      for (let i = 0; i < 50 && vivo(+pidShell); i++) await esperar(100);
      assert.equal(vivo(+pidShell), false, 'o zsh fecha com term-fechar');
      evid.pty = { abrirMs, ecoMs, pidShell: +pidShell, pai: +pai, paiExe: exe, ptyNode: mapeados[0], pwd: pwd.trim(), saida: texto.split('\n').filter((l) => /^(pacote-ok|pwd=|eu=|exe=|fim-42)/.test(l)) };
    });
  });
});
