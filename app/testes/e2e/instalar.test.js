/* babel-coop · e2e: instalar em outra pessoa com o app EMPACOTADO (A29)
   Mac (precisa de npm run empacotar antes):
   1. copia o .app de dist/ para uma pasta temporária (clone APFS, como quem arrastou para Aplicativos) e confere a cópia:
      fuse RunAsNode ligado (o gancho SessionStart do claude roda o executável como Node), protótipo inteiro com GLBs e vídeos,
      interface/, navegador/, servidor/ no asar e interface/midia fora dele;
   2. abre DUAS instâncias escondidas da cópia (raízes, portas e pastas de dados próprias): o Theus funda pela tela de
      boas-vindas, gera o token da Rita pela API local (/api/convite, só a própria Estação), a Rita cola o token na tela de
      boas-vindas e entra, as duas se veem na rede, a Rita abre um terminal e a parede do Theus mostra a saída ao vivo;
   3. o vídeo e as peças 3D tocam/carregam de dentro do pacote.
   Windows (CI, depois de npm run dist:win): o babel-coop.exe de dist/win-unpacked abre escondido, serve a Estação e tem pty.
   Portas só deste arquivo: HTTP 5120 (Theus) e 5121 (Rita), UDP 41620. O token nunca vai para a evidência (só o tamanho).
   Uso: npm run empacotar && npm run teste:instalar      (evidências em .deus/terminal-ao-vivo/evidencias/instalar/)
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync, spawn } = require('child_process');

const APP = path.join(__dirname, '..', '..');
const pkg = require(path.join(APP, 'package.json'));
const NOME = pkg.build.productName;
const ARCH = process.arch;
const ORIGINAL = path.join(APP, 'dist', ARCH === 'x64' ? 'mac' : 'mac-' + ARCH, NOME + '.app');
const WIN_EXE = path.join(APP, 'dist', 'win-unpacked', NOME + '.exe');
const EVID = process.env.BABEL_TESTE_EVIDENCIAS ? path.join(process.env.BABEL_TESTE_EVIDENCIAS, 'instalar') : path.join(APP, '..', '.deus', 'terminal-ao-vivo', 'evidencias', 'instalar');
const PORTA_T = 5120, PORTA_R = 5121, DESCOBERTA = 41620;

const SEM_MAC = process.platform !== 'darwin' ? 'só no Mac' : (fs.existsSync(path.join(ORIGINAL, 'Contents', 'MacOS', NOME)) ? false : 'sem pacote: rode npm run empacotar');
const SEM_WIN = process.platform !== 'win32' ? 'só no Windows' : (fs.existsSync(WIN_EXE) ? false : 'sem pacote: rode npm run dist:win');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const evid = { quando: new Date().toISOString(), plataforma: process.platform + '-' + ARCH, versao: pkg.version };
function gravarEvidencia() { fs.mkdirSync(EVID, { recursive: true }); fs.writeFileSync(path.join(EVID, 'instalar-e2e.json'), JSON.stringify(evid, null, 2) + '\n'); }

/* o ambiente do app: sem as variáveis da sessão de quem roda o teste (Claude Code, terminal) */
function ambienteLimpo() {
  const env = {};
  Object.keys(process.env).forEach((k) => { if (!/^(CLAUDE|TERM_SESSION|TERM_PROGRAM|TERM_FEATURES|ITERM|LC_TERMINAL|BABEL_COOP|ELECTRON_RUN_AS_NODE)/.test(k)) env[k] = process.env[k]; });
  return env;
}

function arquivos(raiz, rel = '') {
  const saida = [];
  for (const d of fs.readdirSync(path.join(raiz, rel), { withFileTypes: true })) {
    if (d.name === '.DS_Store') continue;
    const r = rel ? rel + '/' + d.name : d.name;
    if (d.isDirectory()) saida.push(...arquivos(raiz, r)); else saida.push(r);
  }
  return saida;
}

async function ate(page, fn, arg, oque, ms = 20000) {
  try { return await page.waitForFunction(fn, arg, { timeout: ms, polling: 100 }); }
  catch (e) { throw new Error('tempo esgotado esperando ' + oque + ': ' + e.message.split('\n')[0]); }
}
async function prontaNaEquipe(page) {
  await page.waitForLoadState('domcontentloaded');
  await ate(page, () => window.BC && BC.real && BC.real.bemvindo && BC.real.bemvindo.eu && BC.real.bemvindo.eu.pronto && BC.parede && BC.estacao && BC.estacao.ui, null, 'a Estação pronta na equipe', 30000);
}
async function print(page, nome) {
  await page.screenshot({ path: path.join(EVID, nome), timeout: 15000 }).catch((e) => { evid['print ' + nome] = 'falhou: ' + e.message.split('\n')[0]; });
}

describe('instalar em outra pessoa · Mac, com o app empacotado (A29)', { skip: SEM_MAC, timeout: 400000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'babel-instalar-'));
  const COPIA = path.join(tmp, 'Aplicativos', NOME + '.app');
  const EXEC = path.join(COPIA, 'Contents', 'MacOS', NOME);
  const RES = path.join(COPIA, 'Contents', 'Resources');
  const abertos = [];
  let T = null, R = null, token = null;
  const erros = [];

  async function abrir(quem, porta) {
    const { _electron } = require('playwright');
    const raiz = path.join(tmp, 'raiz-' + quem); fs.mkdirSync(raiz);
    const zdot = path.join(raiz, '.zdot'); fs.mkdirSync(zdot);
    fs.writeFileSync(path.join(zdot, '.zshrc'), '# zsh do teste de instalação: sem configuração pessoal\n');
    const env = Object.assign(ambienteLimpo(), { BABEL_COOP_RAIZ: raiz, BABEL_COOP_PORTA: String(porta), BABEL_COOP_DESCOBERTA: String(DESCOBERTA), BABEL_COOP_OCULTO: '1', BABEL_COOP_AGENTES: '0', ZDOTDIR: zdot, SHELL: '/bin/zsh' });
    const t0 = Date.now();
    const app = await _electron.launch({ executablePath: EXEC, args: [], env, cwd: raiz, timeout: 60000 });
    abertos.push(app);
    const page = await app.firstWindow();
    page.on('pageerror', (e) => erros.push(quem + ' pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') erros.push(quem + ' console: ' + m.text()); });
    await page.waitForLoadState('load');
    const base = 'http://localhost:' + porta;
    return { app, page, raiz, base, abrirMs: Date.now() - t0, eu: async () => (await fetch(base + '/api/eu')).json() };
  }

  before(() => {
    fs.mkdirSync(EVID, { recursive: true });
    fs.mkdirSync(path.dirname(COPIA), { recursive: true });
    /* clone APFS (cp -c): a cópia inteira sem gastar disco; se o volume não clonar, ditto (cópia comum) */
    const t0 = Date.now();
    const clone = spawnSync('cp', ['-Rc', ORIGINAL, COPIA]);
    if (clone.status !== 0) execFileSync('ditto', [ORIGINAL, COPIA]);
    evid.copia = { como: clone.status === 0 ? 'cp -Rc (clone APFS)' : 'ditto', ms: Date.now() - t0, destino: 'pasta temporária/Aplicativos/' + NOME + '.app' };
  });

  after(async () => {
    evid.erros = erros;
    for (const a of abertos) await a.close().catch(() => {});
    gravarEvidencia();
    /* a cópia do app e as raízes são deste teste: saem do disco (as evidências ficam) */
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('a cópia instalada tem tudo: protótipo com GLBs e vídeos, interface, navegador, servidor e o fuse RunAsNode', async () => {
    const asar = require('@electron/asar');
    const noAsar = new Set(asar.listPackage(path.join(RES, 'app.asar'), { isPack: false }).map((f) => f.replace(/\\/g, '/').replace(/^\//, '')));
    const faltam = [];
    for (const pasta of ['interface', 'navegador', 'servidor']) for (const f of arquivos(path.join(APP, pasta))) if (!/\.(map|pdb)$/.test(f) && !noAsar.has(pasta + '/' + f)) faltam.push(pasta + '/' + f);
    const midiaUi = arquivos(path.join(APP, 'interface', 'midia'));
    for (const f of midiaUi) if (!fs.existsSync(path.join(RES, 'app.asar.unpacked', 'interface', 'midia', f))) faltam.push('app.asar.unpacked/interface/midia/' + f);
    const proto = arquivos(path.join(APP, '..', 'prototipo'));
    for (const f of proto) if (!fs.existsSync(path.join(RES, 'prototipo', f))) faltam.push('prototipo/' + f);
    assert.deepEqual(faltam, [], 'o pacote (mais antigo que o código?) não levou: rode npm run empacotar de novo');
    /* fuse RunAsNode e o executável virando Node, como o gancho SessionStart faz */
    const { getCurrentFuseWire, FuseV1Options } = require('@electron/fuses');
    const fio = await getCurrentFuseWire(EXEC);
    assert.equal(fio[FuseV1Options.RunAsNode], '1'.charCodeAt(0), 'fuse RunAsNode desligado');
    const node = spawnSync(EXEC, ['-e', 'process.stdout.write(JSON.stringify({node:process.versions.node,electron:process.versions.electron}))'], { env: Object.assign(ambienteLimpo(), { ELECTRON_RUN_AS_NODE: '1' }), encoding: 'utf8', timeout: 20000 });
    assert.equal(node.status, 0, node.stderr);
    evid.pacote = {
      arquivosPrototipo: proto.length, glb: proto.filter((f) => f.endsWith('.glb')).length, mp4: proto.filter((f) => f.endsWith('.mp4')).length + midiaUi.filter((f) => f.endsWith('.mp4')).length,
      asar: noAsar.size, midiaInterfaceForaDoAsar: midiaUi.length, runAsNode: JSON.parse(node.stdout)
    };
  });

  it('o Theus abre o app instalado e funda a equipe pela tela de boas-vindas', async () => {
    T = await abrir('theus', PORTA_T);
    const principal = await T.app.evaluate(({ app }) => ({ empacotado: app.isPackaged, exe: process.execPath, dados: app.getPath('userData') }));
    assert.equal(principal.empacotado, true);
    assert.equal(fs.realpathSync(principal.exe), fs.realpathSync(EXEC), 'é o executável da cópia instalada');
    await T.page.waitForSelector('#coop-boasvindas', { timeout: 30000 });
    await print(T.page, '1-theus-boasvindas.png');
    await T.page.click('#coop-boasvindas details summary');
    await T.page.fill('#cbv-nome', 'Theus');
    await T.page.click('#cbv-fundar');
    await prontaNaEquipe(T.page);
    const eu = await T.eu();
    assert.equal(eu.id, 'theus'); assert.equal(eu.papel, 'gestao'); assert.equal(eu.pronto, true);
    assert.equal(await T.page.locator('#coop-boasvindas').count(), 0, 'a tela de boas-vindas saiu');
    evid.theus = { abrirMs: T.abrirMs, id: eu.id, papel: eu.papel, terminalReal: eu.terminalReal, dadosDoElectronNaRaiz: principal.dados.startsWith(T.raiz) || fs.realpathSync(principal.dados).startsWith(fs.realpathSync(T.raiz)) };
  });

  it('o Theus gera o token da Rita pela API local (Equipe → Convidar pessoa faz o mesmo)', async () => {
    const conv = await T.page.evaluate(() => fetch('/api/convite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: 'Rita', papel: 'membro' }) }).then((r) => r.json()));
    assert.match(String(conv.token), /^babel-/, 'token: ' + JSON.stringify(Object.keys(conv)));
    token = conv.token;
    evid.convite = { tamanhoToken: token.length, prefixo: token.slice(0, 6) };
  });

  it('a Rita instala, cola o token na tela de boas-vindas e entra na equipe', async () => {
    R = await abrir('rita', PORTA_R);
    await R.page.waitForSelector('#coop-boasvindas #cbv-token', { timeout: 30000 });
    await print(R.page, '2-rita-boasvindas.png'); /* antes de colar: o token não aparece em print nenhum */
    const t0 = Date.now();
    await R.page.fill('#cbv-token', token);
    await R.page.click('#cbv-entrar');
    await prontaNaEquipe(R.page);
    const eu = await R.eu();
    assert.equal(eu.id, 'rita'); assert.equal(eu.papel, 'membro'); assert.equal(eu.pronto, true);
    evid.rita = { abrirMs: R.abrirMs, entrarMs: Date.now() - t0, id: eu.id, papel: eu.papel, equipe: eu.equipe || null };
  });

  it('as duas se veem na rede', async () => {
    const t0 = Date.now();
    await ate(T.page, () => BC.real.pares().some((p) => p.id === 'rita' && p.ligado), null, 'o Theus ver a Rita', 40000);
    const tT = Date.now() - t0;
    await ate(R.page, () => BC.real.pares().some((p) => p.id === 'theus' && p.ligado), null, 'a Rita ver o Theus', 40000);
    evid.rede = { theusVeRitaMs: tT, ritaVeTheusMs: Date.now() - t0 };
  });

  it('a Rita abre um terminal e a parede do Theus mostra a saída ao vivo', async () => {
    await R.page.evaluate(() => BC.real.enviar({ tipo: 'term-abrir', id: 'nina', nome: 'Nina', cols: 90, rows: 24 }));
    await T.page.evaluate(() => BC.estacao.abrir('terminais'));
    await R.page.evaluate(() => BC.estacao.abrir('terminais'));
    await ate(T.page, () => !!document.querySelector('[data-k="rita/nina"]'), null, 'o cartão rita/nina na parede do Theus', 30000);
    await T.page.$eval('[data-k="rita/nina"]', (c) => c.scrollIntoView({ block: 'center' }));
    await ate(T.page, () => { const s = BC.parede.sessao('rita/nina'); return s && s.assistindo && s.temTerm; }, null, 'o cartão assistindo');
    const t0 = Date.now();
    await R.page.evaluate(() => BC.real.enviar({ tipo: 'term-entrada', id: 'nina', dados: 'echo instalado-e-vivo-$((40+2))\r' }));
    await ate(T.page, () => BC.parede.texto('rita/nina').includes('instalado-e-vivo-42'), null, 'a saída da Rita na parede do Theus');
    evid.parede = { saidaMs: Date.now() - t0 };
    await T.page.waitForTimeout(400);
    await print(T.page, '3-theus-parede-com-rita.png');
    await print(R.page, '4-rita-estacao.png');
  });

  it('o vídeo toca e as peças 3D carregam de dentro do pacote', async () => {
    const r = await T.page.evaluate(async () => {
      async function tocar(src) {
        const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.src = src;
        document.body.appendChild(v);
        try {
          await Promise.race([v.play(), new Promise((_, n) => setTimeout(() => n(new Error('play demorou')), 10000))]);
          const t0 = performance.now();
          while (v.currentTime < 0.3 && performance.now() - t0 < 8000) await new Promise((ok) => setTimeout(ok, 100));
          return { src, tocou: v.currentTime >= 0.3, currentTime: +v.currentTime.toFixed(2), largura: v.videoWidth, duracao: +(v.duration || 0).toFixed(1) };
        } catch (e) { return { src, tocou: false, erro: String(e.message || e), codigo: v.error && v.error.code }; }
        finally { v.pause(); v.remove(); }
      }
      async function glb(src) { const b = new Uint8Array(await (await fetch(src)).arrayBuffer()); return { src, bytes: b.length, glTF: String.fromCharCode(b[0], b[1], b[2], b[3]) === 'glTF' }; }
      return { videos: [await tocar('/coop/midia/b-entrada.mp4'), await tocar('/midia/b-entrada.mp4'), await tocar('/midia/chao-vivo.mp4')], pecas: [await glb('/midia/pecas/robo.glb'), await glb('/midia/cofre.glb')] };
    });
    evid.midia = r;
    r.videos.forEach((v) => assert.ok(v.tocou, 'vídeo não tocou: ' + JSON.stringify(v)));
    r.pecas.forEach((p) => assert.ok(p.glTF && p.bytes > 1000, 'peça 3D: ' + JSON.stringify(p)));
  });
});

describe('instalar em outra pessoa · Windows, com o app empacotado (CI)', { skip: SEM_WIN, timeout: 180000 }, () => {
  it('o babel-coop.exe abre escondido, serve a Estação e tem terminal real', async () => {
    const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'babel-instalar-win-'));
    const env = Object.assign(ambienteLimpo(), { BABEL_COOP_RAIZ: raiz, BABEL_COOP_PORTA: String(PORTA_T), BABEL_COOP_DESCOBERTA: String(DESCOBERTA), BABEL_COOP_OCULTO: '1', BABEL_COOP_AGENTES: '0' });
    const node = spawnSync(WIN_EXE, ['-e', 'process.stdout.write(process.versions.node)'], { env: Object.assign({}, env, { ELECTRON_RUN_AS_NODE: '1' }), encoding: 'utf8', timeout: 30000 });
    assert.equal(node.status, 0, 'ELECTRON_RUN_AS_NODE: ' + node.stderr);
    const t0 = Date.now();
    const p = spawn(WIN_EXE, [], { env, stdio: 'ignore' });
    try {
      let eu = null;
      for (let i = 0; i < 120 && !eu; i++) { await esperar(500); try { eu = await (await fetch('http://localhost:' + PORTA_T + '/api/eu')).json(); } catch (e) { /* ainda abrindo */ } }
      assert.ok(eu, 'a Estação não respondeu em 60 s');
      const pagina = await (await fetch('http://localhost:' + PORTA_T + '/')).text();
      evid.windows = { abrirMs: Date.now() - t0, versao: eu.versao, terminalReal: eu.terminalReal, electron: eu.motor && eu.motor.electron, runAsNode: node.stdout, paginaBytes: pagina.length };
      assert.equal(eu.terminalReal, true, 'node-pty no pacote do Windows');
      assert.match(pagina, /<html/i);
    } finally {
      spawnSync('taskkill', ['/pid', String(p.pid), '/T', '/F']);
      gravarEvidencia();
    }
  });
});
