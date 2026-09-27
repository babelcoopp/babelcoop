/* Babel Coop · atualização do app pela rede local
   Quem publica (a gestão) empacota a interface da própria Estação numa versão: pasta com todos os arquivos + manifesto com hash.
   Cada Estação, ao clicar "Atualizar", baixa os arquivos da Estação de quem publicou, confere os hashes e passa a servir a versão nova.
   O Electron (main.js) não muda por aqui: para ele, electron-updater depois. A interface é 95% do app.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

const IGNORAR = /(^|\/)(\.DS_Store|Thumbs\.db|.*\.map)$/;

function hash(caminho) { return crypto.createHash('sha256').update(fs.readFileSync(caminho)).digest('hex'); }

function listar(pasta, rel) {
  rel = rel || '';
  let saida = [];
  fs.readdirSync(path.join(pasta, rel), { withFileTypes: true }).forEach((it) => {
    const r = rel ? rel + '/' + it.name : it.name;
    if (IGNORAR.test(r)) return;
    if (it.isDirectory()) saida = saida.concat(listar(pasta, r));
    else saida.push(r);
  });
  return saida;
}

class Atualizacao {
  constructor(cfg, pastaUiPadrao, pontePath) {
    this.cfg = cfg;
    this.padrao = pastaUiPadrao;
    this.ponte = pontePath;
    this.raiz = path.join(cfg.raiz, '.coop', 'app');
    fs.mkdirSync(this.raiz, { recursive: true });
  }

  atual() { try { return JSON.parse(fs.readFileSync(path.join(this.raiz, 'atual.json'), 'utf8')); } catch (e) { return null; } }
  pastaAtual() { const a = this.atual(); const p = a && path.join(this.raiz, 'v' + a.versao); return p && fs.existsSync(path.join(p, 'index.html')) ? p : null; }
  pastaUi() { return this.pastaAtual() || this.padrao; }
  pontePath() { const p = this.pastaAtual(); return p && fs.existsSync(path.join(p, 'ponte.js')) ? path.join(p, 'ponte.js') : this.ponte; }

  manifesto(versao) { try { return JSON.parse(fs.readFileSync(path.join(this.raiz, 'v' + versao, 'manifesto.json'), 'utf8')); } catch (e) { return null; } }
  ultima() { const vs = fs.readdirSync(this.raiz).map((n) => (n.match(/^v(\d+)$/) || [])[1]).filter(Boolean).map(Number); return vs.length ? Math.max(...vs) : 0; }

  /* a gestão publica: copia a interface que esta Estação está servindo para v<N> e escreve o manifesto */
  publicar(notas, versaoBase) {
    if (this.cfg.papel !== 'gestao') throw new Error('só a gestão publica atualização do app');
    const versao = Math.max(this.ultima(), versaoBase || 0) + 1;
    const origem = this.pastaUi(), destino = path.join(this.raiz, 'v' + versao);
    fs.mkdirSync(destino, { recursive: true });
    const arquivos = [];
    listar(origem).forEach((r) => {
      const de = path.join(origem, r), para = path.join(destino, r);
      fs.mkdirSync(path.dirname(para), { recursive: true });
      fs.copyFileSync(de, para);
      arquivos.push({ caminho: r, sha256: hash(para), bytes: fs.statSync(para).size });
    });
    fs.copyFileSync(this.pontePath(), path.join(destino, 'ponte.js'));
    arquivos.push({ caminho: 'ponte.js', sha256: hash(path.join(destino, 'ponte.js')), bytes: fs.statSync(path.join(destino, 'ponte.js')).size });
    const manifesto = { versao, notas: notas || '', por: this.cfg.id, ts: Date.now(), arquivos };
    fs.writeFileSync(path.join(destino, 'manifesto.json'), JSON.stringify(manifesto, null, 2));
    fs.writeFileSync(path.join(this.raiz, 'atual.json'), JSON.stringify({ versao, de: this.cfg.id, ts: Date.now() }));
    return manifesto;
  }

  arquivo(versao, rel) {
    const base = path.join(this.raiz, 'v' + versao), alvo = path.normalize(path.join(base, rel));
    if (!alvo.startsWith(base + path.sep) || !fs.existsSync(alvo)) return null;
    return alvo;
  }

  /* esta Estação baixa a versão da Estação de quem publicou e confere cada hash */
  atualizar(host, porta, versaoEsperada) {
    const baixarJson = (caminho) => new Promise((ok, erro) => http.get('http://' + host + ':' + porta + caminho, (r) => { let s = ''; r.on('data', (c) => { s += c; }); r.on('end', () => { try { ok(JSON.parse(s)); } catch (e) { erro(new Error('resposta ilegível de ' + host)); } }); }).on('error', erro));
    const baixarArquivo = (caminho, para) => new Promise((ok, erro) => { fs.mkdirSync(path.dirname(para), { recursive: true }); http.get('http://' + host + ':' + porta + caminho, (r) => { if (r.statusCode !== 200) return erro(new Error('não achei ' + caminho)); const w = fs.createWriteStream(para); r.pipe(w); w.on('finish', ok); w.on('error', erro); }).on('error', erro); });
    return baixarJson('/api/app/manifesto').then(async (m) => {
      if (!m || !m.versao) throw new Error('quem publicou não tem versão pronta');
      if (versaoEsperada && m.versao !== versaoEsperada) throw new Error('versão diferente da anunciada (v' + m.versao + ')');
      const destino = path.join(this.raiz, 'v' + m.versao);
      for (const a of m.arquivos) {
        const para = path.join(destino, a.caminho);
        await baixarArquivo('/api/app/arquivo?versao=' + m.versao + '&caminho=' + encodeURIComponent(a.caminho), para);
        if (hash(para) !== a.sha256) throw new Error('arquivo corrompido: ' + a.caminho);
      }
      fs.writeFileSync(path.join(destino, 'manifesto.json'), JSON.stringify(m, null, 2));
      fs.writeFileSync(path.join(this.raiz, 'atual.json'), JSON.stringify({ versao: m.versao, de: m.por, ts: Date.now() }));
      return m;
    });
  }
}

module.exports = { Atualizacao };
