/* Babel Coop · a pasta compartilhada desta pessoa
   Só o que está em ~/BabelCoop/<id>/ é visível à equipe. Caminho com ".." nunca passa.
*/
'use strict';
const fs = require('fs');
const path = require('path');

const IGNORADOS = /^(\.DS_Store|Thumbs\.db|~\$.*|\.env.*|.*\.pem|\.ssh|credentials.*|node_modules|\.git|\.coop)$/i;
const TIPOS = { md: 'md', txt: 'txt', csv: 'csv', html: 'html', htm: 'html', js: 'js', ts: 'ts', py: 'py', sh: 'sh', css: 'css', json: 'json', pdf: 'pdf', png: 'imagem', jpg: 'imagem', jpeg: 'imagem', gif: 'imagem', webp: 'imagem', svg: 'imagem', mp4: 'video', mov: 'video', webm: 'video', quadro: 'quadro', mapa: 'mapa' };
const TEXTO = { md: 1, txt: 1, csv: 1, html: 1, js: 1, ts: 1, py: 1, sh: 1, css: 1, json: 1, quadro: 1, mapa: 1 };
/* apagar não apaga: o arquivo SAI da pasta compartilhada para <raiz>/.coop/lixeira/<id>/<carimbo>__<caminho com / trocado por __>
   (ao lado de .coop/versoes: fora do que a equipe, o acervo e a IA leem) e o Desfazer devolve */
const INDICE_LIXEIRA = 'itens.json'; /* id → caminho original ("__" no nome do arquivo não se confunde com a barra) */
/* na raiz da pasta, o acervo escreve estes (GERADOS e garantirClaudeMd em acervo.js): não se apagam pela tela */
const GERADOS = /^(ACERVO|APRENDIZADOS|CLAUDE)\.md$/i;
const ID_LIXEIRA = /^(\d{13})(-\d+)?__./;

/* mover sem apagar nada no caminho: a pasta pode ser um atalho para outro disco (rename entre discos dá EXDEV: copia e tira a origem) */
function mover(de, para) {
  try { fs.renameSync(de, para); }
  catch (e) { if (e.code !== 'EXDEV') throw e; fs.copyFileSync(de, para, fs.constants.COPYFILE_EXCL); fs.unlinkSync(de); }
}

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

  /* ---------- lixeira: apagar e restaurar ---------- */
  dirLixeira() { return path.join(this.pasta, '..', '.coop', 'lixeira', this.dono); }
  indiceLixeira() { try { const j = JSON.parse(fs.readFileSync(path.join(this.dirLixeira(), INDICE_LIXEIRA), 'utf8')); return j && typeof j === 'object' ? j : {}; } catch (e) { return {}; } }
  gravarIndiceLixeira(itens) { try { fs.writeFileSync(path.join(this.dirLixeira(), INDICE_LIXEIRA), JSON.stringify(itens, null, 1)); } catch (e) { /* o nome do arquivo ainda leva o caminho */ } }

  /* a pasta de verdade (sem atalho simbólico que leve para fora): nada de fora da pasta entra ou sai da lixeira */
  dentroDeVerdade(dir) {
    try { const r = fs.realpathSync(dir), raiz = fs.realpathSync(this.pasta); return r === raiz || r.startsWith(raiz + path.sep); } catch (e) { return false; }
  }

  /* devolve { ok, lixeira, caminho } ou { erro, status } */
  apagar(rel) {
    if (typeof rel !== 'string' || !rel.trim()) return { erro: 'faltou o caminho', status: 400 };
    if (rel.split(/[\\/]/).includes('..')) return { erro: 'caminho com ".." não passa', status: 400 };
    const alvo = this.seguro(rel);
    if (!alvo) return { erro: 'fora da pasta compartilhada', status: 400 };
    if (alvo === this.pasta) return { erro: 'a própria pasta não se apaga', status: 400 };
    const limpo = path.relative(this.pasta, alvo).split(path.sep).join('/');
    if (!limpo.includes('/') && GERADOS.test(limpo)) return { erro: '"' + limpo + '" é gerado pelo acervo do babel-coop: não se apaga', status: 403 };
    let st; try { st = fs.lstatSync(alvo); } catch (e) { return { erro: 'não existe', status: 404 }; }
    if (st.isDirectory()) return { erro: 'só arquivo: pasta não se apaga por aqui', status: 400 };
    if (!this.dentroDeVerdade(path.dirname(alvo))) return { erro: 'fora da pasta compartilhada', status: 400 };
    const dir = this.dirLixeira();
    fs.mkdirSync(dir, { recursive: true });
    const agora = Date.now();
    let plano = limpo.replace(/\//g, '__');
    if (Buffer.byteLength(plano) > 200) plano = path.basename(limpo); /* nome longo demais para o disco: o índice guarda o caminho */
    let id = agora + '__' + plano;
    for (let n = 2; fs.existsSync(path.join(dir, id)); n++) id = agora + '-' + n + '__' + plano;
    try { mover(alvo, path.join(dir, id)); } catch (e) { return { erro: 'não deu para mover para a lixeira (' + (e.code || e.message) + ')', status: 409 }; }
    const itens = this.indiceLixeira();
    itens[id] = { caminho: limpo, em: agora };
    this.gravarIndiceLixeira(itens);
    return { ok: true, lixeira: id, caminho: limpo };
  }

  /* volta ao caminho original; se já existe outro lá, volta como "nome (restaurado).ext" */
  restaurar(id) {
    if (typeof id !== 'string' || !ID_LIXEIRA.test(id) || /[\\/\0]/.test(id) || id === INDICE_LIXEIRA) return { erro: 'item da lixeira inválido', status: 400 };
    const dir = this.dirLixeira(), de = path.join(dir, id);
    if (path.dirname(de) !== dir) return { erro: 'item da lixeira inválido', status: 400 };
    let st; try { st = fs.lstatSync(de); } catch (e) { return { erro: 'não está mais na lixeira', status: 404 }; }
    if (st.isDirectory()) return { erro: 'item da lixeira inválido', status: 400 };
    const itens = this.indiceLixeira();
    const original = (itens[id] && typeof itens[id].caminho === 'string') ? itens[id].caminho : id.replace(/^\d{13}(-\d+)?__/, '').split('__').join('/');
    let alvo = this.seguro(original);
    if (!alvo || alvo === this.pasta) return { erro: 'o caminho original saiu da pasta compartilhada', status: 400 };
    if (fs.existsSync(alvo)) {
      const p = path.parse(alvo);
      alvo = path.join(p.dir, p.name + ' (restaurado)' + p.ext);
      for (let n = 2; fs.existsSync(alvo); n++) alvo = path.join(p.dir, p.name + ' (restaurado ' + n + ')' + p.ext);
    }
    let existe = path.dirname(alvo);
    while (existe !== this.pasta && !fs.existsSync(existe)) existe = path.dirname(existe);
    if (!this.dentroDeVerdade(existe)) return { erro: 'o caminho original saiu da pasta compartilhada', status: 400 };
    fs.mkdirSync(path.dirname(alvo), { recursive: true });
    try { mover(de, alvo); } catch (e) { return { erro: 'não deu para tirar da lixeira (' + (e.code || e.message) + ')', status: 409 }; }
    delete itens[id];
    this.gravarIndiceLixeira(itens);
    return { ok: true, caminho: path.relative(this.pasta, alvo).split(path.sep).join('/') };
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
