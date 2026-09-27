/* Oficina local: consentimento da gestão preso à instalação que está aberta.
   Nenhuma rota da rede pode selecionar fonte, liberar edição ou produzir instalador. */
'use strict';
const fs = require('fs');
// No Electron, fs entende .asar como diretório virtual. O hash usa os bytes reais do arquivo.
const fsFisico = process.versions.electron ? require('original-fs') : fs;
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

function lerJson(arquivo) { try { return JSON.parse(fs.readFileSync(arquivo, 'utf8')); } catch (_) { return null; } }
function validarFonte(pasta) {
  const raiz = fs.realpathSync(String(pasta || ''));
  for (const rel of ['app/package.json', 'app/main.js', 'app/servidor/servidor.js', 'app/scripts/empacotar.js', 'prototipo/index.html']) {
    if (!fs.statSync(path.join(raiz, rel)).isFile()) throw new Error('A pasta não contém o código completo do Babel Coop: ' + rel);
  }
  const p = lerJson(path.join(raiz, 'app/package.json'));
  if (!p || p.name !== 'babel-coop' || !p.scripts || !p.scripts.empacotar) throw new Error('Escolha a pasta fonte do Babel Coop.');
  if (!fs.statSync(path.join(raiz, 'app/node_modules')).isDirectory()) throw new Error('A pasta precisa das dependências em app/node_modules.');
  if (raiz.includes('.app/Contents/') || raiz.includes('.asar')) throw new Error('Escolha os fontes editáveis, fora do aplicativo instalado.');
  return raiz;
}

class Oficina {
  constructor(cfg, opcoes = {}) {
    this.cfg = cfg;
    this.appDir = opcoes.appDir || path.join(__dirname, '..');
    this.versao = opcoes.versao || (lerJson(path.join(this.appDir, 'package.json')) || {}).version || '?';
    this.arquivo = path.join(cfg.raiz, '.coop', 'oficina-local.json');
    this.registro = lerJson(this.arquivo) || {};
    this.executando = false;
    this.log = '';
    const h = crypto.createHash('sha256');
    h.update(fsFisico.realpathSync(this.appDir));
    if (this.appDir.endsWith('.asar')) {
      const fd = fsFisico.openSync(this.appDir, 'r'), bloco = Buffer.allocUnsafe(1024 * 1024);
      try { let n; while ((n = fsFisico.readSync(fd, bloco, 0, bloco.length, null)) > 0) h.update(bloco.subarray(0, n)); }
      finally { fsFisico.closeSync(fd); }
      // O selo inclui também Resources/prototipo, que fica fora do asar.
      const selo = path.resolve(this.appDir, '..', '..', '_CodeSignature', 'CodeResources');
      if (fsFisico.existsSync(selo)) h.update(fsFisico.readFileSync(selo));
    } else for (const rel of ['package.json', 'main.js', 'preload.js', 'servidor/servidor.js']) h.update(fs.readFileSync(path.join(this.appDir, rel)));
    this.identidade = h.digest('hex');
  }
  _gestao() { if (this.cfg.papel !== 'gestao') throw new Error('Só a gestão desta Estação pode liberar a Oficina.'); }
  _autorizada() { return this.cfg.papel === 'gestao' && this.registro.liberada === true && this.registro.identidade === this.identidade; }
  _exigir() { this._gestao(); if (!this._autorizada()) throw new Error('Marque esta versão como editável na Oficina antes de continuar.'); }
  _salvar() {
    fs.mkdirSync(path.dirname(this.arquivo), { recursive: true });
    const tmp = this.arquivo + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.registro, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, this.arquivo);
  }
  estado() {
    return { gestao: this.cfg.papel === 'gestao', autorizada: this._autorizada(), versao: this.versao, identidade: this.identidade,
      pasta: this.registro.pasta || '', previa: this._autorizada() && !!this.registro.previa,
      executando: this.executando, log: this.log.slice(-5000), pacote: this.registro.pacote || null };
  }
  liberar(sim, identidade) {
    this._gestao();
    if (identidade !== this.identidade) throw new Error('A versão mudou. Atualize a Oficina e confira novamente.');
    if (this.executando) throw new Error('Aguarde o empacotamento terminar.');
    this.registro.identidade = this.identidade;
    this.registro.liberada = sim === true;
    if (!sim) this.registro.previa = false;
    this._salvar();
    return this.estado();
  }
  selecionar(pasta) {
    this._exigir();
    if (this.executando) throw new Error('Aguarde o empacotamento terminar.');
    this.registro.pasta = validarFonte(pasta);
    this.registro.previa = false;
    this.registro.pacote = null;
    this._salvar();
    return this.estado();
  }
  contextoAgente() {
    this._exigir();
    if (this.executando) throw new Error('Aguarde o empacotamento terminar antes de editar.');
    const pasta = validarFonte(this.registro.pasta);
    return { pasta, instrucoes: 'Você está na Oficina local do Babel Coop, autorizada pela gestão para esta instalação. Edite somente os fontes desta pasta: ' + pasta + '. Preserve os dados em ~/BabelCoop. Mudanças da interface podem ser vistas em Atualizar prévia; servidor exige Reiniciar prévia. Não empacote, não publique nem encerre o aplicativo por conta própria: a pessoa fará isso pelo botão Reempacotar e reiniciar da Oficina. Respeite as instruções do repositório.' };
  }
  ativarPrevia(sim) {
    this._exigir();
    if (this.executando) throw new Error('Aguarde o empacotamento terminar.');
    if (sim) validarFonte(this.registro.pasta);
    this.registro.previa = sim === true;
    this._salvar();
    return this.estado();
  }
  pastasPrevia() {
    if (!this._autorizada() || !this.registro.previa) return null;
    try {
      const pasta = validarFonte(this.registro.pasta);
      return { pasta, ui: path.join(pasta, 'prototipo'), ponte: path.join(pasta, 'app/ponte.js'), interface: path.join(pasta, 'app/interface'), servidor: path.join(pasta, 'app/servidor/servidor.js') };
    } catch (_) { return null; }
  }
  async empacotar() {
    const { pasta } = this.contextoAgente();
    if (process.platform !== 'darwin') throw new Error('O empacotamento pela Oficina está disponível no macOS.');
    const script = fs.readFileSync(path.join(pasta, 'app/scripts/empacotar.js'), 'utf8');
    if (!script.includes("args.indexOf('--saida')")) throw new Error('Atualize scripts/empacotar.js dos fontes: esta cópia ainda não oferece saída separada para preservar o app aberto.');
    const raizDist = path.join(pasta, 'app/dist');
    fs.mkdirSync(raizDist, { recursive: true });
    const dist = fs.mkdtempSync(path.join(raizDist, 'oficina-'));
    this.executando = true;
    this.log = 'Preparando o instalador desta pasta…\n';
    try {
      const env = { ...process.env, PATH: ['/opt/homebrew/bin', '/usr/local/bin', process.env.PATH || ''].join(path.delimiter) };
      // O Electron não deve fingir ser o Node durante o npm, nem herdar injeção do terminal.
      delete env.ELECTRON_RUN_AS_NODE;
      delete env.NODE_OPTIONS;
      const comando = process.platform === 'win32' ? 'npm.cmd' : ['/opt/homebrew/bin/npm', '/usr/local/bin/npm', '/usr/bin/npm'].find((p) => fs.existsSync(p)) || 'npm';
      await new Promise((resolve, reject) => {
        const filho = spawn(comando, ['run', 'empacotar', '--', '--saida', dist], { cwd: path.join(pasta, 'app'), env, stdio: ['ignore', 'pipe', 'pipe'], shell: false, windowsHide: true });
        const receber = (b) => { this.log = (this.log + b.toString()).slice(-12000); };
        filho.stdout.on('data', receber); filho.stderr.on('data', receber);
        filho.once('error', reject);
        filho.once('close', (codigo) => codigo === 0 ? resolve() : reject(new Error('O empacotamento terminou com código ' + codigo + '. ' + this.log.slice(-1000))));
      });
      this._exigir();
      const manifesto = lerJson(path.join(dist, 'pacote.json'));
      const destino = path.join(dist, process.arch === 'arm64' ? 'mac-arm64' : 'mac', 'babel-coop.app');
      if (process.platform !== 'darwin' || !fs.existsSync(destino) || !manifesto) throw new Error('O instalador foi gerado, mas não encontrei o aplicativo macOS para reiniciar.');
      const dmgs = fs.readdirSync(dist).filter((f) => f.endsWith('.dmg')).map((f) => path.join(dist, f));
      this.registro.pacote = { app: destino, dmg: dmgs[0] || null, ts: Date.now(), manifesto };
      this.registro.previa = false;
      this._salvar();
      this.log += '\nInstalador pronto. A nova versão abrirá em seguida.';
      return this.registro.pacote;
    } finally { this.executando = false; }
  }
}
module.exports = { Oficina, validarFonte };
