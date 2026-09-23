/* babel-coop · clonar uma página: HTML vivo + CSS + imagens + fontes num Clones/<site>/ que abre como site
   Recebe o que a página serializou (pagina.js → serializar: HTML com marcas __BCRES_n__ e a lista de recursos)
   e uma função obter(url) → {buf, mime} (o navegador tenta a cópia em memória do próprio webview e, se não tiver, a rede).
   Tudo vai para <pasta>/assets/ com nome curto e único; dentro do CSS as referências viram o nome do arquivo vizinho.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EXT_MIME = {
  'text/css': 'css', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'image/svg+xml': 'svg', 'image/avif': 'avif',
  'image/x-icon': 'ico', 'image/vnd.microsoft.icon': 'ico', 'font/woff2': 'woff2', 'font/woff': 'woff', 'font/ttf': 'ttf', 'font/otf': 'otf',
  'application/font-woff2': 'woff2', 'application/font-woff': 'woff', 'application/x-font-ttf': 'ttf', 'application/vnd.ms-fontobject': 'eot',
  'video/mp4': 'mp4', 'video/webm': 'webm', 'audio/mpeg': 'mp3', 'application/manifest+json': 'json', 'application/json': 'json'
};

/* nome de pasta seguro a partir do host (localhost:4931 → localhost_4931) */
function nomeDoSite(url) {
  let host = '';
  try { const u = new URL(url); host = u.protocol === 'file:' ? 'arquivo-local' : u.host; } catch (e) { host = ''; }
  return (host || 'pagina').toLowerCase().replace(/[^a-z0-9.-]+/g, '_').replace(/^[._]+|[._]+$/g, '').slice(0, 80) || 'pagina';
}

function nomeLocal(url, mime, usados) {
  let base = 'recurso', ext = '';
  try {
    const u = new URL(url);
    const ultimo = decodeURIComponent(u.pathname.split('/').filter(Boolean).pop() || '');
    const m = ultimo.match(/^(.*?)(?:\.([a-z0-9]{1,6}))?$/i);
    if (m) { base = m[1] || base; ext = (m[2] || '').toLowerCase(); }
  } catch (e) { /* url esquisita: fica o nome genérico */ }
  const doMime = EXT_MIME[String(mime || '').split(';')[0].trim().toLowerCase()];
  if (!ext && doMime) ext = doMime;
  base = base.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'recurso';
  const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 6);
  let nome = base + '-' + hash + (ext ? '.' + ext : '');
  let n = 2;
  while (usados.has(nome)) nome = base + '-' + hash + '-' + (n++) + (ext ? '.' + ext : '');
  usados.add(nome);
  return nome;
}

const ehCss = (tipo, mime, url) => tipo === 'css' || /text\/css/i.test(mime || '') || /\.css(\?|#|$)/i.test(url);

/* troca url(...) e @import "..." de um CSS, resolvendo relativo ao endereço do próprio CSS */
async function reescreverCss(texto, baseUrl, trocar) {
  const re = /url\(\s*(['"]?)([^'")]+?)\1\s*\)|@import\s+(['"])([^'"]+)\3/g;
  const pedacos = [];
  let ultimo = 0;
  let m;
  while ((m = re.exec(texto))) {
    pedacos.push(texto.slice(ultimo, m.index));
    ultimo = re.lastIndex;
    const bruto = (m[2] || m[4] || '').trim();
    const ehImport = !!m[4] || /@import\s*$/i.test(texto.slice(Math.max(0, m.index - 20), m.index));
    if (!bruto || /^(data:|#|about:|blob:)/i.test(bruto)) { pedacos.push(m[0]); continue; }
    let abs = null;
    try { abs = new URL(bruto, baseUrl).href.split('#')[0]; } catch (e) { abs = null; }
    if (!abs) { pedacos.push(m[0]); continue; }
    const formaImport = !!m[4]; /* o laço reaproveita m: guarda antes da promessa */
    pedacos.push(trocar(abs, ehImport || /\.css(\?|$)/i.test(abs) ? 'css' : 'css-url').then((novo) => (formaImport ? '@import url("' + novo + '")' : 'url("' + novo + '")')));
  }
  pedacos.push(texto.slice(ultimo));
  return (await Promise.all(pedacos)).join('');
}

/* fila com no máximo N downloads ao mesmo tempo */
function limitador(n) {
  let ativos = 0;
  const espera = [];
  const proximo = () => { if (ativos >= n || !espera.length) return; ativos++; const { fn, ok, falha } = espera.shift(); fn().then(ok, falha).finally(() => { ativos--; proximo(); }); };
  return (fn) => new Promise((ok, falha) => { espera.push({ fn, ok, falha }); proximo(); });
}

/**
 * @param {object} o
 * @param {{html:string, recursos:{url:string,tipo:string}[], url:string, titulo:string}} o.pagina
 * @param {(url:string)=>Promise<{buf:Buffer, mime?:string}>} o.obter
 * @param {string} o.dir pasta de destino (Clones/<site>)
 */
async function clonarPagina({ pagina, obter, dir, limiteArquivo = 25 * 1024 * 1024, limiteTotal = 200 * 1024 * 1024, maxRecursos = 600 }) {
  fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
  const usados = new Set();
  const promessas = new Map(); /* url → Promise<nome local | null> */
  const lista = [];
  const faltaram = [];
  let total = 0;
  const vez = limitador(6);

  function baixar(url, tipo, profundidade) {
    if (promessas.has(url)) return promessas.get(url);
    const p = (async () => {
      if (promessas.size > maxRecursos) { faltaram.push({ url, motivo: 'limite de ' + maxRecursos + ' recursos' }); return null; }
      let r;
      try { r = await vez(() => obter(url)); } catch (e) { faltaram.push({ url, motivo: e.message }); return null; }
      if (!r || !r.buf) { faltaram.push({ url, motivo: 'vazio' }); return null; }
      if (r.buf.length > limiteArquivo || total + r.buf.length > limiteTotal) { faltaram.push({ url, motivo: 'grande demais (' + r.buf.length + ' bytes)' }); return null; }
      const nome = nomeLocal(url, r.mime, usados);
      let buf = r.buf;
      if (ehCss(tipo, r.mime, url)) {
        if (profundidade < 4) {
          const texto = await reescreverCss(buf.toString('utf8'), url, async (abs, t) => { const n = await baixar(abs, t, profundidade + 1); return n ? n : abs; });
          buf = Buffer.from(texto, 'utf8');
        }
      }
      total += buf.length;
      fs.writeFileSync(path.join(dir, 'assets', nome), buf);
      lista.push({ url, arquivo: 'assets/' + nome, bytes: buf.length, tipo: ehCss(tipo, r.mime, url) ? 'css' : tipo, deCache: !!r.deCache });
      return nome;
    })();
    promessas.set(url, p);
    return p;
  }

  const nomes = await Promise.all(pagina.recursos.map((r) => baixar(r.url, r.tipo, 0)));
  const carimbo = new Date().toISOString();
  let html = pagina.html.replace(/__BCRES_(\d+)__/g, (m, i) => {
    const rec = pagina.recursos[+i];
    if (!rec) return '';
    return nomes[+i] ? 'assets/' + nomes[+i] : rec.url;
  });
  /* de onde veio (sem expor nada da pessoa) */
  const origem = '<!-- clonado pelo babel-coop de ' + String(pagina.url).replace(/--/g, '- -') + ' em ' + carimbo + ' -->';
  html = html.replace(/^(<!DOCTYPE[^>]*>)/i, '$1\n' + origem);
  if (html.indexOf(origem) === -1) html = origem + '\n' + html;
  const index = path.join(dir, 'index.html');
  fs.writeFileSync(index, html);
  const porTipo = {};
  lista.forEach((x) => { porTipo[x.tipo] = (porTipo[x.tipo] || 0) + 1; });
  return { pasta: dir, index, arquivos: lista.length + 1, bytes: total + Buffer.byteLength(html), porTipo, faltaram, lista, url: pagina.url, titulo: pagina.titulo };
}

module.exports = { clonarPagina, nomeDoSite, reescreverCss, nomeLocal };
