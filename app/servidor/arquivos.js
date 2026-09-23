/* Babel Coop · a pasta compartilhada desta pessoa
   Só o que está em ~/BabelCoop/<id>/ é visível à equipe. Caminho com ".." nunca passa.
*/
'use strict';
const fs = require('fs');
const path = require('path');

const IGNORADOS = /^(\.DS_Store|Thumbs\.db|~\$.*|\.env.*|.*\.pem|\.ssh|credentials.*|node_modules|\.git|\.coop)$/i;
const TIPOS = { md: 'md', txt: 'txt', csv: 'csv', html: 'html', htm: 'html', js: 'js', ts: 'ts', py: 'py', sh: 'sh', css: 'css', json: 'json', pdf: 'pdf', png: 'imagem', jpg: 'imagem', jpeg: 'imagem', gif: 'imagem', webp: 'imagem', svg: 'imagem', mp4: 'video', mov: 'video', webm: 'video', quadro: 'quadro', mapa: 'mapa' };
const TEXTO = { md: 1, txt: 1, csv: 1, html: 1, js: 1, ts: 1, py: 1, sh: 1, css: 1, json: 1, quadro: 1, mapa: 1 };

class Arquivos {
  constructor(pasta, dono) { this.pasta = pasta; this.dono = dono; }

  seguro(rel) {
    if (typeof rel !== 'string' || !rel || path.isAbsolute(rel)) return null;
    const alvo = path.resolve(this.pasta, rel);
    if (alvo !== this.pasta && !alvo.startsWith(this.pasta + path.sep)) return null;
    if (rel.split(/[\\/]/).some((p) => IGNORADOS.test(p))) return null;
    return alvo;
  }

  tipoDe(nome) { return TIPOS[nome.split('.').pop().toLowerCase()] || 'binario'; }

  tamanho(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  listar() {
    const saida = [];
    const andar = (dir, rel) => {
      let itens = [];
      try { itens = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
      itens.forEach((it) => {
        if (IGNORADOS.test(it.name)) return;
        const r = rel ? rel + '/' + it.name : it.name;
        if (it.isDirectory()) { andar(path.join(dir, it.name), r); return; }
        let st; try { st = fs.statSync(path.join(dir, it.name)); } catch (e) { return; }
        saida.push({ id: this.dono + '/' + r, caminho: this.dono + '/' + r, dono: this.dono, tipo: this.tipoDe(it.name), tamanho: this.tamanho(st.size), bytes: st.size, modificado: st.mtimeMs, local: st.size > 2 * 1024 * 1024 });
      });
    };
    andar(this.pasta, '');
    return saida;
  }

  ler(rel) {
    const alvo = this.seguro(rel);
    if (!alvo || !fs.existsSync(alvo)) return null;
    const tipo = this.tipoDe(alvo);
    if (TEXTO[tipo]) return { tipo, conteudo: fs.readFileSync(alvo, 'utf8') };
    return { tipo, caminhoReal: alvo };
  }

  escrever(rel, conteudo) {
    const alvo = this.seguro(rel);
    if (!alvo) return false;
    fs.mkdirSync(path.dirname(alvo), { recursive: true });
    /* versão anterior guardada (CHECKLIST 1 · "Voltar como estava") */
    if (fs.existsSync(alvo)) {
      const versoes = path.join(this.pasta, '..', '.coop', 'versoes', this.dono);
      fs.mkdirSync(versoes, { recursive: true });
      fs.copyFileSync(alvo, path.join(versoes, rel.replace(/[\\/]/g, '__') + '.' + Date.now()));
    }
    fs.writeFileSync(alvo, conteudo);
    return true;
  }

  vigiar(fn) {
    this._aviso = fn;
    try { if (this._vigia) this._vigia.close(); } catch (e) { /* já fechado */ }
    this._vigia = null;
    try { this._vigia = fs.watch(this.pasta, { recursive: true }, (tipo, nome) => { if (nome && !IGNORADOS.test(path.basename(nome))) fn(nome.replace(/\\/g, '/')); }); } catch (e) { /* sem recursivo nesta plataforma: sem aviso ao vivo */ }
  }

  /* a pasta mudou (fundar a equipe ou entrar com o token trocam o id): o vigia passa para a pasta nova */
  revigiar() { if (this._aviso) this.vigiar(this._aviso); }
}

module.exports = { Arquivos };
