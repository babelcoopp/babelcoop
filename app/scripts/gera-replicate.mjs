#!/usr/bin/env node
/* Babel Coop · gera mídia na Replicate em Node puro (fetch nativo, sem dependências)

   Regras de docs/design/GERACAO_REPLICATE.md que este script cumpre:
   - o token vem só de process.env.REPLICATE_API_TOKEN (carregado com `set -a && source … && set +a` no mesmo comando: o set -a exporta mesmo se o arquivo não tiver `export`);
     nunca é impresso, gravado nem mandado a outro domínio que não api.replicate.com;
   - baixa a saída na hora (as URLs da Replicate expiram em 1 h) e anota cada predição no
     MANIFESTO.jsonl de docs/design/assets/raw/<dono>_<modelo>/<data>/ (sem token, sem URL assinada);
   - lê o schema de entrada do modelo antes de criar a predição e recusa campo que não existe;
   - teto de gasto por rodada: soma o custo estimado já anotado nos manifestos com a mesma `rodada`;
   - conta com pouco crédito: 429 espera e tenta de novo; 402 (sem saldo) para e anota.

   Uso (da raiz do repositório):
     set -a && source ~/.config/babel/replicate.env && set +a && node app/scripts/gera-replicate.mjs <tarefa.json>
     node app/scripts/gera-replicate.mjs <tarefa.json> --seco        mostra o pedido, não chama a API
     set -a && source … && set +a && node app/scripts/gera-replicate.mjs --esquema google/nano-banana-2
     set -a && source … && set +a && node app/scripts/gera-replicate.mjs --recuperar <id> <tarefa.json>
     node app/scripts/gera-replicate.mjs --medir <arquivo.png>        mede alfa, centro e círculo (sem API)
     node app/scripts/gera-replicate.mjs --miolo <entrada.png> <saida.png> [fração]
                                                                      miolo transparente (sem API)
     node app/scripts/gera-replicate.mjs --reduzir <entrada.png> <saida.png> <lado>
                                                                      reduz por média de área (sem API)
     node app/scripts/gera-replicate.mjs --recodificar <entrada.png> <saida.png>
                                                                      mesmo desenho, arquivo menor (sem API)
     node app/scripts/gera-replicate.mjs --glb-peca <entrada.glb> <saida.glb> [fração]
                                                                      peça do Trellis pronta para o protótipo: gltfpack -si (npx),
                                                                      textura PNG → JPEG (ffmpeg), material sem metal (sem API)
     node app/scripts/gera-replicate.mjs --medir-glb <a.glb> [b.glb …]  malhas, triângulos, imagens, extensões (sem API)

   Tarefa (JSON):
     { "nome": "mostrador-anel-t1", "modelo": "google/nano-banana-2", "versao": null,
       "entrada": { "prompt": "…", "aspect_ratio": "1:1", "resolution": "1K", "output_format": "png" },
       "subir": { "image_input": ["docs/design/assets/visao/imag-estacao.jpg"] },
       "custo_usd": 0.067, "rodada": "terminal-ao-vivo", "teto_usd": 1.5 }
   `subir`: campo → caminho (texto) ou lista de caminhos; cada arquivo sobe pela files API e o campo
   recebe a URL dele (lista continua lista). Modelo da comunidade: passe `versao` (POST /v1/predictions).

   Saída: código 0 = feito · 2 = uso errado · 3 = sem saldo · 4 = teto da rodada · 1 = outro erro.
*/
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const API = 'https://api.replicate.com/v1';
const PASTA_RAW = path.join(RAIZ, 'docs', 'design', 'assets', 'raw');
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml', mp4: 'video/mp4', wav: 'audio/wav', mp3: 'audio/mpeg', glb: 'model/gltf-binary' };

class ErroSaldo extends Error {}
class ErroTeto extends Error {}
class ErroUso extends Error {}

/* ---------- segredo ---------- */
const TOKEN = process.env.REPLICATE_API_TOKEN || '';
/* tira o token (e qualquer "Bearer …") de todo texto que vai para tela, log ou arquivo */
export function redigir(texto, token = TOKEN) {
  let s = String(texto);
  if (token) s = s.split(token).join('[redigido]');
  return s.replace(/Bearer\s+[A-Za-z0-9._\-]+/g, 'Bearer [redigido]').replace(/r8_[A-Za-z0-9]{20,}/g, '[redigido]');
}
const diz = (...a) => console.log(redigir(a.join(' ')));
const avisa = (...a) => console.error(redigir(a.join(' ')));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

function exigeToken() {
  if (!TOKEN) throw new ErroUso('REPLICATE_API_TOKEN ausente: rode no mesmo comando `set -a && source ~/.config/babel/replicate.env && set +a && node app/scripts/gera-replicate.mjs …`');
}

/* uma chamada à API; o cabeçalho de autorização só vai para api.replicate.com */
async function api(metodo, url, { json, form, prefer } = {}) {
  if (!url.startsWith(API + '/')) throw new Error('recusado: o token só vai para ' + API);
  exigeToken();
  const cab = { Authorization: 'Bearer ' + TOKEN };
  let corpo;
  if (json !== undefined) { cab['Content-Type'] = 'application/json'; corpo = JSON.stringify(json); }
  if (form) corpo = form;
  if (prefer) cab.Prefer = prefer;
  for (let tentativa = 1; ; tentativa++) {
    let r;
    try { r = await fetch(url, { method: metodo, headers: cab, body: corpo }); }
    catch (e) { if (tentativa < 4) { avisa('[replicate] rede falhou (' + e.message + '), tentando de novo em 3 s'); await espera(3000); continue; } throw new Error('rede: ' + e.message); }
    const texto = await r.text();
    let dados; try { dados = texto ? JSON.parse(texto) : null; } catch { dados = { detalhe_bruto: texto.slice(0, 500) }; }
    if (r.status === 429 && tentativa < 9) {
      const s = Math.max(2, Number((dados && dados.retry_after) || r.headers.get('retry-after') || 12));
      avisa('[replicate] limitado (429): ' + ((dados && dados.detail) || '') + ' · esperando ' + s + ' s');
      await espera(s * 1000); continue;
    }
    if (r.status === 402) throw new ErroSaldo('a Replicate recusou por saldo (402): ' + redigir((dados && (dados.detail || dados.title)) || texto.slice(0, 300)));
    return { status: r.status, dados };
  }
}

/* ---------- caminhos, datas, manifesto ---------- */
const hoje = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };
const slugModelo = (modelo) => modelo.replace('/', '_');
const relativo = (c) => path.relative(RAIZ, path.resolve(RAIZ, c)).split(path.sep).join('/');

function pastaDestino(tarefa) {
  return tarefa.destino ? path.resolve(RAIZ, tarefa.destino) : path.join(PASTA_RAW, slugModelo(tarefa.modelo), hoje());
}

/* todas as linhas de todos os MANIFESTO.jsonl de docs/design/assets/raw */
export function lerManifestos(pasta = PASTA_RAW) {
  const linhas = [];
  const anda = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const c = path.join(d, e.name);
      if (e.isDirectory()) anda(c);
      else if (e.name === 'MANIFESTO.jsonl') {
        for (const l of fs.readFileSync(c, 'utf8').split('\n')) { if (l.trim()) { try { linhas.push(JSON.parse(l)); } catch { /* linha torta não conta */ } } }
      }
    }
  };
  anda(pasta);
  return linhas;
}

/* gasto já anotado na rodada: toda predição criada (com id) conta, por precaução, menos as canceladas antes de começar */
export function gastoDaRodada(rodada, linhas = lerManifestos()) {
  return linhas.filter((l) => l.rodada === rodada && l.id && l.status !== 'nao-criada')
    .reduce((s, l) => s + (Number(l.custo_usd) || 0), 0);
}

function anota(pasta, linha) {
  fs.mkdirSync(pasta, { recursive: true });
  fs.appendFileSync(path.join(pasta, 'MANIFESTO.jsonl'), redigir(JSON.stringify(linha)) + '\n');
}

/* ---------- schema ---------- */
async function esquemaDeEntrada(modelo, versao) {
  const url = versao ? API + '/models/' + modelo + '/versions/' + versao : API + '/models/' + modelo;
  const r = await api('GET', url);
  if (r.status !== 200) throw new Error('schema de ' + modelo + ' indisponível (HTTP ' + r.status + ')');
  const v = versao ? r.dados : r.dados.latest_version;
  const s = v && v.openapi_schema && v.openapi_schema.components && v.openapi_schema.components.schemas && v.openapi_schema.components.schemas.Input;
  if (!s) throw new Error('schema de ' + modelo + ' sem Input');
  return s;
}

/* ---------- files API ---------- */
async function subirArquivo(caminho) {
  const abs = path.resolve(RAIZ, caminho);
  const buf = fs.readFileSync(abs);
  const tipo = MIME[path.extname(abs).slice(1).toLowerCase()] || 'application/octet-stream';
  const fd = new FormData();
  fd.append('content', new Blob([buf], { type: tipo }), path.basename(abs));
  const r = await api('POST', API + '/files', { form: fd });
  if (r.status !== 201 && r.status !== 200) throw new Error('files API recusou ' + relativo(abs) + ' (HTTP ' + r.status + '): ' + JSON.stringify(r.dados).slice(0, 300));
  return { id: r.dados.id, url: r.dados.urls && r.dados.urls.get, arquivo: relativo(abs), bytes: buf.length };
}
async function apagarArquivo(id) {
  try { await api('DELETE', API + '/files/' + id); } catch { /* limpeza, não é fatal */ }
}

/* ---------- baixar a saída ---------- */
function urlsDaSaida(saida) {
  if (!saida) return [];
  if (typeof saida === 'string') return [saida];
  if (Array.isArray(saida)) return saida.flatMap(urlsDaSaida);
  if (typeof saida === 'object') return Object.values(saida).flatMap(urlsDaSaida);
  return [];
}
async function baixar(urls, pasta, nome) {
  const feitos = [];
  let i = 0;
  for (const u of urls) {
    if (!/^https:\/\//.test(u)) continue;
    const ext = (path.extname(new URL(u).pathname) || '.bin').toLowerCase();
    const arquivo = urls.length === 1 ? nome + ext : nome + '-' + (++i) + ext;
    const r = await fetch(u); /* sem token: a saída é pública até expirar */
    if (!r.ok) throw new Error('download falhou (HTTP ' + r.status + ') de ' + arquivo);
    const buf = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(path.join(pasta, arquivo), buf);
    feitos.push({ arquivo, bytes: buf.length });
  }
  return feitos;
}

/* ---------- a geração ---------- */
function lerTarefa(caminho) {
  const t = JSON.parse(fs.readFileSync(path.resolve(RAIZ, caminho), 'utf8'));
  for (const k of ['nome', 'modelo', 'entrada']) if (!t[k]) throw new ErroUso('tarefa sem "' + k + '"');
  if (!/^[a-z0-9-]{1,60}$/.test(t.nome)) throw new ErroUso('nome inválido (minúsculas, números e hífen): ' + t.nome);
  if (!/^[a-z0-9-]+\/[a-z0-9._-]+$/.test(t.modelo)) throw new ErroUso('modelo inválido: ' + t.modelo);
  return t;
}

/* a entrada como vai para o manifesto: arquivos subidos viram "arquivo:<caminho>" (nunca a URL) */
function entradaParaManifesto(entrada, subidos) {
  const e = { ...entrada };
  for (const [campo, lista] of Object.entries(subidos)) e[campo] = Array.isArray(lista) ? lista.map((s) => 'arquivo:' + s.arquivo) : 'arquivo:' + lista.arquivo;
  return e;
}

async function gerar(tarefa, { seco = false } = {}) {
  const pasta = pastaDestino(tarefa);
  const custo = Number(tarefa.custo_usd) || 0;
  if (tarefa.rodada && tarefa.teto_usd != null) {
    const ja = gastoDaRodada(tarefa.rodada);
    if (ja + custo > Number(tarefa.teto_usd) + 1e-9) throw new ErroTeto('teto da rodada ' + tarefa.rodada + ': já anotado US$ ' + ja.toFixed(3) + ' + ' + custo.toFixed(3) + ' passa de US$ ' + Number(tarefa.teto_usd).toFixed(2));
    diz('[gasto] rodada ' + tarefa.rodada + ': US$ ' + ja.toFixed(3) + ' anotado + US$ ' + custo.toFixed(3) + ' desta = US$ ' + (ja + custo).toFixed(3) + ' de ' + Number(tarefa.teto_usd).toFixed(2));
  }
  if (seco) {
    diz(JSON.stringify({ seco: true, modelo: tarefa.modelo, versao: tarefa.versao || null, entrada: entradaParaManifesto(tarefa.entrada, Object.fromEntries(Object.entries(tarefa.subir || {}).map(([c, v]) => [c, Array.isArray(v) ? v.map((a) => ({ arquivo: relativo(a) })) : { arquivo: relativo(v) }]))), destino: relativo(pasta) }, null, 2));
    return null;
  }
  exigeToken();

  /* 1. schema: nenhum campo inventado */
  const esquema = await esquemaDeEntrada(tarefa.modelo, tarefa.versao);
  const campos = Object.keys(esquema.properties || {});
  const pedidos = [...Object.keys(tarefa.entrada), ...Object.keys(tarefa.subir || {})];
  const estranhos = pedidos.filter((c) => !campos.includes(c));
  if (estranhos.length) throw new ErroUso('campos fora do schema de ' + tarefa.modelo + ': ' + estranhos.join(', ') + ' (existem: ' + campos.join(', ') + ')');

  /* 2. arquivos de entrada pela files API (apagados da Replicate no fim, dê certo ou não) */
  const subidos = {};
  const entrada = { ...tarefa.entrada };
  const idsSubidos = [];
  const base = { nome: tarefa.nome, modelo: tarefa.modelo, versao: tarefa.versao || 'hidden', rodada: tarefa.rodada || null, input: entradaParaManifesto(tarefa.entrada, {}), custo_usd: custo };
  let pred;
  try {
    for (const [campo, v] of Object.entries(tarefa.subir || {})) {
      if (Array.isArray(v)) { subidos[campo] = []; for (const c of v) { const s = await subirArquivo(c); idsSubidos.push(s.id); subidos[campo].push(s); } entrada[campo] = subidos[campo].map((s) => s.url); }
      else { subidos[campo] = await subirArquivo(v); idsSubidos.push(subidos[campo].id); entrada[campo] = subidos[campo].url; }
      diz('[files] ' + campo + ' ← ' + [].concat(subidos[campo]).map((s) => s.arquivo + ' (' + s.bytes + ' B)').join(', '));
    }
    base.input = entradaParaManifesto(tarefa.entrada, subidos);

    /* 3. cria a predição (oficial: /models/…/predictions; comunidade: /predictions com version) */
    const r = tarefa.versao
      ? await api('POST', API + '/predictions', { json: { version: tarefa.versao, input: entrada }, prefer: 'wait=60' })
      : await api('POST', API + '/models/' + tarefa.modelo + '/predictions', { json: { input: entrada }, prefer: 'wait=60' });
    /* 202 = aceita e ainda rodando (o `Prefer: wait` venceu antes do fim): a predição existe e custa; segue para o polling.
       Achado em 23/09/2026 (robo-3d no Trellis): tratar 202 como "não criada" apagava a entrada e zerava o custo anotado. */
    const criada = (r.status === 201 || r.status === 200 || r.status === 202) && r.dados && r.dados.id;
    if (!criada) {
      anota(pasta, { ...base, id: null, status: 'nao-criada', custo_usd: 0, erro: JSON.stringify(r.dados).slice(0, 400), data: new Date().toISOString() });
      throw new Error('predição não criada (HTTP ' + r.status + '): ' + JSON.stringify(r.dados).slice(0, 400));
    }
    pred = r.dados;
    diz('[predição] ' + pred.id + ' · ' + pred.status);

    /* 4. espera até terminar (polling de 2 s, até 10 min) */
    const limite = Date.now() + 10 * 60 * 1000;
    while (!['succeeded', 'failed', 'canceled'].includes(pred.status) && Date.now() < limite) {
      await espera(2000);
      const g = await api('GET', API + '/predictions/' + pred.id);
      if (g.status === 200) pred = g.dados;
    }
  } catch (e) {
    if (e instanceof ErroSaldo) anota(pasta, { ...base, id: null, status: 'sem-saldo', custo_usd: 0, erro: e.message, data: new Date().toISOString() });
    for (const id of idsSubidos) await apagarArquivo(id);
    throw e;
  }

  /* 5. baixa na hora e anota */
  fs.mkdirSync(pasta, { recursive: true });
  let arquivos = [];
  if (pred.status === 'succeeded') arquivos = await baixar(urlsDaSaida(pred.output), pasta, tarefa.nome);
  const resp = { ...pred, input: base.input }; /* a resposta guardada não leva as URLs dos arquivos subidos */
  fs.writeFileSync(path.join(pasta, tarefa.nome + '.resp.json'), redigir(JSON.stringify(resp, null, 1)));
  const linha = {
    ...base, id: pred.id, status: pred.status,
    arquivos: arquivos.map((a) => a.arquivo + ':' + a.bytes).join(','),
    predict_time_s: pred.metrics && pred.metrics.predict_time,
    erro: pred.error || undefined, data: new Date().toISOString(),
  };
  anota(pasta, linha);
  for (const id of idsSubidos) await apagarArquivo(id);
  const saida = { nome: tarefa.nome, id: pred.id, status: pred.status, arquivos: arquivos.map((a) => relativo(path.join(pasta, a.arquivo))), custo_usd: custo, gasto_rodada_usd: tarefa.rodada ? Number(gastoDaRodada(tarefa.rodada).toFixed(3)) : undefined, predict_time_s: linha.predict_time_s, erro: pred.error || undefined };
  diz(JSON.stringify(saida, null, 2));
  return saida;
}

/* recupera uma predição já criada (download perdido): baixa e anota sem criar outra */
async function recuperar(id, tarefa) {
  const pasta = pastaDestino(tarefa);
  const g = await api('GET', API + '/predictions/' + id);
  if (g.status !== 200) throw new Error('predição ' + id + ' não achada (HTTP ' + g.status + ')');
  const pred = g.dados;
  fs.mkdirSync(pasta, { recursive: true });
  const arquivos = pred.status === 'succeeded' ? await baixar(urlsDaSaida(pred.output), pasta, tarefa.nome) : [];
  anota(pasta, { nome: tarefa.nome, modelo: tarefa.modelo, versao: tarefa.versao || 'hidden', rodada: tarefa.rodada || null, input: entradaParaManifesto(tarefa.entrada, {}), custo_usd: Number(tarefa.custo_usd) || 0, id, status: pred.status, recuperada: true, arquivos: arquivos.map((a) => a.arquivo + ':' + a.bytes).join(','), predict_time_s: pred.metrics && pred.metrics.predict_time, data: new Date().toISOString() });
  diz(JSON.stringify({ id, status: pred.status, arquivos: arquivos.map((a) => a.arquivo) }));
}

/* ---------- PNG em Node puro (ler, medir, escrever) ---------- */
export function lerPng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('não é PNG');
  let p = 8, w, h, prof, tipo, entrelacado, paleta = null, trns = null; const idat = [];
  while (p < buf.length) {
    const n = buf.readUInt32BE(p); const t = buf.toString('latin1', p + 4, p + 8); const d = buf.subarray(p + 8, p + 8 + n);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); prof = d[8]; tipo = d[9]; entrelacado = d[12]; }
    else if (t === 'PLTE') paleta = d;
    else if (t === 'tRNS') trns = d;
    else if (t === 'IDAT') idat.push(d);
    else if (t === 'IEND') break;
    p += 12 + n;
  }
  if (prof !== 8 || entrelacado) throw new Error('PNG não suportado (profundidade ' + prof + ', entrelaçado ' + entrelacado + ')');
  const canais = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[tipo];
  if (!canais) throw new Error('tipo de cor PNG não suportado: ' + tipo);
  const cru = zlib.inflateSync(Buffer.concat(idat));
  const linha = w * canais; const px = Buffer.alloc(linha * h); let ant = Buffer.alloc(linha);
  for (let y = 0; y < h; y++) {
    const f = cru[y * (linha + 1)]; const src = cru.subarray(y * (linha + 1) + 1, (y + 1) * (linha + 1)); const out = px.subarray(y * linha, (y + 1) * linha);
    for (let x = 0; x < linha; x++) {
      const a = x >= canais ? out[x - canais] : 0, b = ant[x], c = x >= canais ? ant[x - canais] : 0;
      let v;
      if (f === 0) v = 0; else if (f === 1) v = a; else if (f === 2) v = b; else if (f === 3) v = (a + b) >> 1;
      else { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[x] = (src[x] + v) & 255;
    }
    ant = out;
  }
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    let r, g, b, al = 255;
    if (tipo === 6) { r = px[i * 4]; g = px[i * 4 + 1]; b = px[i * 4 + 2]; al = px[i * 4 + 3]; }
    else if (tipo === 2) { r = px[i * 3]; g = px[i * 3 + 1]; b = px[i * 3 + 2]; if (trns && trns.length >= 6 && r === trns.readUInt16BE(0) && g === trns.readUInt16BE(2) && b === trns.readUInt16BE(4)) al = 0; }
    else if (tipo === 0) { r = g = b = px[i]; }
    else if (tipo === 4) { r = g = b = px[i * 2]; al = px[i * 2 + 1]; }
    else { const k = px[i]; r = paleta[k * 3]; g = paleta[k * 3 + 1]; b = paleta[k * 3 + 2]; al = trns && k < trns.length ? trns[k] : 255; }
    rgba[i * 4] = r; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = b; rgba[i * 4 + 3] = al;
  }
  return { largura: w, altura: h, rgba, tipoOriginal: tipo };
}

/* pixel com alfa 0 não aparece: zera a cor dele para o arquivo comprimir melhor (o desenho não muda) */
export function limparTransparentes(img) {
  const rgba = Buffer.from(img.rgba);
  for (let i = 0; i < rgba.length; i += 4) if (rgba[i + 3] === 0) { rgba[i] = 0; rgba[i + 1] = 0; rgba[i + 2] = 0; }
  return { ...img, rgba };
}

export function escreverPng({ largura: w, altura: h, rgba }) {
  const linha = w * 4; const cru = Buffer.alloc((linha + 1) * h);
  for (let y = 0; y < h; y++) { /* filtro Sub (1) por linha: comprime bem imagem com alfa */
    cru[y * (linha + 1)] = 1;
    for (let x = 0; x < linha; x++) { const v = rgba[y * linha + x]; const a = x >= 4 ? rgba[y * linha + x - 4] : 0; cru[y * (linha + 1) + 1 + x] = (v - a) & 255; }
  }
  const pedaco = (tipo, dados) => { const t = Buffer.from(tipo, 'latin1'); const n = Buffer.alloc(4); n.writeUInt32BE(dados.length); const c = Buffer.alloc(4); c.writeUInt32BE(zlib.crc32(Buffer.concat([t, dados])) >>> 0); return Buffer.concat([n, t, dados, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), pedaco('IHDR', ihdr), pedaco('IDAT', zlib.deflateSync(cru, { level: 9 })), pedaco('IEND', Buffer.alloc(0))]);
}

/* mede o recorte: quanto é transparente, a caixa do que sobrou, o centro e se é redondo */
export function medirPng(img, limiarAlfa = 16) {
  const { largura: w, altura: h, rgba } = img;
  let x0 = w, y0 = h, x1 = -1, y1 = -1, transp = 0, sx = 0, sy = 0, sa = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = rgba[(y * w + x) * 4 + 3];
    if (a < limiarAlfa) { transp++; continue; }
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    sx += x * a; sy += y * a; sa += a;
  }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0 + 1) / 2, ry = (y1 - y0 + 1) / 2;
  /* miolo: alfa médio num disco de 30 % do raio no centro da caixa */
  let somaMiolo = 0, nMiolo = 0; const rm = Math.min(rx, ry) * 0.3;
  for (let y = Math.floor(cy - rm); y <= cy + rm; y++) for (let x = Math.floor(cx - rm); x <= cx + rm; x++) {
    if (x < 0 || y < 0 || x >= w || y >= h || (x - cx) ** 2 + (y - cy) ** 2 > rm * rm) continue;
    somaMiolo += rgba[(y * w + x) * 4 + 3]; nMiolo++;
  }
  /* redondeza: raio da borda externa em 72 direções (desvio relativo) */
  const raios = [];
  for (let k = 0; k < 72; k++) {
    const ang = (k / 72) * Math.PI * 2; let r = 0;
    for (let d = Math.max(rx, ry) * 1.05; d > 0; d -= 0.5) { const x = Math.round(cx + Math.cos(ang) * d), y = Math.round(cy + Math.sin(ang) * d); if (x >= 0 && y >= 0 && x < w && y < h && rgba[(y * w + x) * 4 + 3] >= 128) { r = d; break; } }
    raios.push(r);
  }
  const media = raios.reduce((s, r) => s + r, 0) / raios.length;
  const desvio = Math.sqrt(raios.reduce((s, r) => s + (r - media) ** 2, 0) / raios.length);
  return {
    largura: w, altura: h, transparente_pct: +(100 * transp / (w * h)).toFixed(1),
    caixa: [x0, y0, x1, y1], centro_caixa: [+cx.toFixed(1), +cy.toFixed(1)],
    desvio_do_centro_px: [+(cx - (w - 1) / 2).toFixed(1), +(cy - (h - 1) / 2).toFixed(1)],
    centroide_alfa: sa ? [+(sx / sa).toFixed(1), +(sy / sa).toFixed(1)] : null,
    raio_x: rx, raio_y: ry, proporcao_rx_ry: +(rx / ry).toFixed(4),
    raio_externo_medio: +media.toFixed(1), raio_externo_desvio_pct: +(100 * desvio / (media || 1)).toFixed(2),
    miolo_alfa_medio: nMiolo ? +(somaMiolo / nMiolo).toFixed(1) : null,
  };
}

/* torna transparente o miolo escuro: dentro de `fracao` do raio, pixel escuro vira alfa 0 (com transição suave) */
export function abrirMiolo(img, fracao = 0.62) {
  const m = medirPng(img); const { largura: w, altura: h } = img; const rgba = Buffer.from(img.rgba);
  const [cx, cy] = m.centro_caixa; const R = Math.min(m.raio_x, m.raio_y) * fracao;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.hypot(x - cx, y - cy); if (d > R) continue;
    const i = (y * w + x) * 4; const lum = 0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2];
    /* escuro some; claro (marca gravada que entrou no miolo) fica; perto da borda do disco, transição de 6 px */
    const escuro = Math.max(0, Math.min(1, (lum - 18) / 40));
    const borda = Math.max(0, Math.min(1, (d - (R - 6)) / 6));
    const fator = Math.max(escuro, borda);
    rgba[i + 3] = Math.round(rgba[i + 3] * fator);
  }
  return { ...img, rgba };
}

/* reduz por média de área com alfa pré-multiplicado (sem franja escura na borda) */
export function reduzir(img, lado) {
  const { largura: w, altura: h, rgba } = img; const nw = lado, nh = Math.round(h * lado / w);
  const out = Buffer.alloc(nw * nh * 4); const ex = w / nw, ey = h / nh;
  for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) {
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let yy = Math.floor(y * ey); yy < Math.min(h, Math.ceil((y + 1) * ey)); yy++) for (let xx = Math.floor(x * ex); xx < Math.min(w, Math.ceil((x + 1) * ex)); xx++) {
      const i = (yy * w + xx) * 4; const al = rgba[i + 3]; r += rgba[i] * al; g += rgba[i + 1] * al; b += rgba[i + 2] * al; a += al; n++;
    }
    const o = (y * nw + x) * 4;
    if (a) { out[o] = Math.round(r / a); out[o + 1] = Math.round(g / a); out[o + 2] = Math.round(b / a); }
    out[o + 3] = Math.round(a / n);
  }
  return { largura: nw, altura: nh, rgba: out };
}

/* ---------- GLB em Node puro (as peças 3D do Trellis) ---------- */
export function lerGlb(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('não é GLB (cabeçalho glTF ausente)');
  if (buf.readUInt32LE(4) !== 2) throw new Error('GLB de versão ' + buf.readUInt32LE(4) + ' (esperava 2)');
  if (buf.readUInt32LE(8) !== buf.length) throw new Error('GLB com tamanho declarado ' + buf.readUInt32LE(8) + ' ≠ ' + buf.length);
  let p = 12, json = null, bin = Buffer.alloc(0);
  while (p < buf.length) {
    const n = buf.readUInt32LE(p), tipo = buf.readUInt32LE(p + 4), d = buf.subarray(p + 8, p + 8 + n);
    if (tipo === 0x4e4f534a) json = JSON.parse(d.toString('utf8'));
    else if (tipo === 0x004e4942) bin = Buffer.from(d);
    p += 8 + n;
  }
  if (!json) throw new Error('GLB sem JSON');
  return { json, bin };
}

export function escreverGlb({ json, bin }) {
  const alinha = (b, enche) => { const r = (4 - (b.length % 4)) % 4; return r ? Buffer.concat([b, Buffer.alloc(r, enche)]) : b; };
  const j = alinha(Buffer.from(JSON.stringify(json), 'utf8'), 0x20);
  const b = alinha(bin, 0);
  const cab = Buffer.alloc(12); cab.writeUInt32LE(0x46546c67, 0); cab.writeUInt32LE(2, 4);
  const cj = Buffer.alloc(8); cj.writeUInt32LE(j.length, 0); cj.writeUInt32LE(0x4e4f534a, 4);
  const partes = [cab, cj, j];
  if (b.length) { const cb = Buffer.alloc(8); cb.writeUInt32LE(b.length, 0); cb.writeUInt32LE(0x004e4942, 4); partes.push(cb, b); }
  const out = Buffer.concat(partes); out.writeUInt32LE(out.length, 8);
  return out;
}

/* resumo de um GLB: malhas, triângulos, vértices, imagens, extensões (para conferir cada peça) */
export function medirGlb(buf) {
  const { json, bin } = lerGlb(buf); const acc = json.accessors || [];
  const prims = (json.meshes || []).flatMap((m) => m.primitives || []);
  return {
    bytes: buf.length, malhas: (json.meshes || []).length,
    triangulos: prims.reduce((s, q) => s + (q.indices != null ? acc[q.indices].count / 3 : 0), 0),
    vertices: prims.reduce((s, q) => s + (acc[q.attributes.POSITION] || { count: 0 }).count, 0),
    imagens: (json.images || []).map((i) => ({ tipo: i.mimeType, bytes: json.bufferViews[i.bufferView].byteLength })),
    extensoes: json.extensionsUsed || [], bin_bytes: bin.length,
  };
}

/* reconstrói o buffer binário com os bufferViews na ordem, trocando o conteúdo dos que `trocas` indica */
function remontarBin(json, bin, trocas) {
  const pedacos = []; let off = 0;
  json.bufferViews.forEach((bv, i) => {
    const dado = trocas[i] || bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
    const r = (4 - (off % 4)) % 4; if (r) { pedacos.push(Buffer.alloc(r)); off += r; }
    bv.byteOffset = off; bv.byteLength = dado.length; bv.buffer = 0; pedacos.push(dado); off += dado.length;
  });
  const novo = Buffer.concat(pedacos);
  json.buffers = [{ byteLength: novo.length }];
  return novo;
}

/* peça do Trellis pronta para o protótipo:
   1. gltfpack (npx, build wasm) simplifica para a fração `si` e quantiza (KHR_mesh_quantization, lido pelo GLTFLoader sem decodificador);
   2. a textura PNG vira JPEG (ffmpeg) e o material deixa de ser metal (o Trellis não escreve metallicFactor, e o padrão 1 deixa a peça preta sem mapa de ambiente). */
export async function prepararGlbDaPeca(entrada, saida, { si = 0.5, qualidadeJpeg = 4 } = {}) {
  const { spawnSync } = await import('node:child_process');
  const os = await import('node:os');
  const tmp = path.join(os.tmpdir(), 'peca-' + process.pid + '-' + Date.now() + '.glb');
  const r = spawnSync('npx', ['-y', 'gltfpack@1.2.0', '-i', entrada, '-o', tmp, '-si', String(si)], { encoding: 'utf8' });
  if (r.status !== 0 || !fs.existsSync(tmp)) throw new Error('gltfpack falhou: ' + (r.stderr || r.stdout || r.error).toString().slice(0, 400));
  const { json, bin } = lerGlb(fs.readFileSync(tmp)); fs.unlinkSync(tmp);
  const trocas = {};
  (json.images || []).forEach((img) => {
    if (img.bufferView == null || img.mimeType === 'image/jpeg') return;
    const bv = json.bufferViews[img.bufferView];
    const png = bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
    const f = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'png_pipe', '-i', '-', '-q:v', String(qualidadeJpeg), '-f', 'mjpeg', '-'], { input: png, maxBuffer: 64 * 1024 * 1024 });
    if (f.status !== 0 || !f.stdout || f.stdout.length < 100) throw new Error('ffmpeg não gerou o JPEG: ' + String(f.stderr).slice(0, 300));
    trocas[img.bufferView] = f.stdout; img.mimeType = 'image/jpeg';
  });
  (json.materials || []).forEach((m) => { m.pbrMetallicRoughness = Object.assign({}, m.pbrMetallicRoughness, { metallicFactor: 0, roughnessFactor: 0.85 }); });
  json.asset = Object.assign({}, json.asset, { generator: (json.asset && json.asset.generator ? json.asset.generator + ' · ' : '') + 'babel-coop prepararGlbDaPeca' });
  const novoBin = remontarBin(json, bin, trocas);
  const out = escreverGlb({ json, bin: novoBin });
  lerGlb(out); /* confere o que acabou de escrever */
  fs.writeFileSync(saida, out);
  return medirGlb(out);
}

/* ---------- linha de comando ---------- */
async function principal(argv) {
  const seco = argv.includes('--seco'); const args = argv.filter((a) => a !== '--seco');
  if (!args.length) throw new ErroUso('uso: node app/scripts/gera-replicate.mjs <tarefa.json> [--seco] | --esquema <dono/modelo> | --recuperar <id> <tarefa.json> | --medir <png> | --miolo <entrada> <saida> [fração] | --reduzir <entrada> <saida> <lado> | --recodificar <entrada> <saida> | --glb-peca <entrada.glb> <saida.glb> [fração] | --medir-glb <glb…>');
  if (args[0] === '--esquema') {
    const s = await esquemaDeEntrada(args[1], args[2]);
    diz(JSON.stringify(Object.fromEntries(Object.entries(s.properties || {}).map(([k, v]) => [k, { tipo: v.type || (v.allOf ? 'enum' : '?'), padrao: v.default, descricao: (v.description || '').slice(0, 140) }])), null, 2));
    return;
  }
  if (args[0] === '--recuperar') return recuperar(args[1], lerTarefa(args[2]));
  if (args[0] === '--medir') { diz(JSON.stringify(medirPng(lerPng(fs.readFileSync(path.resolve(RAIZ, args[1])))), null, 2)); return; }
  if (args[0] === '--miolo') {
    const img = abrirMiolo(lerPng(fs.readFileSync(path.resolve(RAIZ, args[1]))), args[3] ? Number(args[3]) : undefined);
    fs.writeFileSync(path.resolve(RAIZ, args[2]), escreverPng(img)); diz(JSON.stringify(medirPng(img), null, 2)); return;
  }
  if (args[0] === '--reduzir') {
    const img = reduzir(lerPng(fs.readFileSync(path.resolve(RAIZ, args[1]))), Number(args[3]));
    fs.writeFileSync(path.resolve(RAIZ, args[2]), escreverPng(img)); diz(JSON.stringify(medirPng(img), null, 2)); return;
  }
  if (args[0] === '--medir-glb') { for (const a of args.slice(1)) diz(JSON.stringify({ arquivo: a, ...medirGlb(fs.readFileSync(path.resolve(RAIZ, a))) })); return; }
  if (args[0] === '--glb-peca') {
    const r = await prepararGlbDaPeca(path.resolve(RAIZ, args[1]), path.resolve(RAIZ, args[2]), { si: args[3] ? Number(args[3]) : undefined });
    diz(JSON.stringify({ antes_bytes: fs.statSync(path.resolve(RAIZ, args[1])).size, depois: r })); return;
  }
  if (args[0] === '--recodificar') {
    const ent = path.resolve(RAIZ, args[1]); const img = limparTransparentes(lerPng(fs.readFileSync(ent))); const buf = escreverPng(img);
    fs.writeFileSync(path.resolve(RAIZ, args[2]), buf); diz(JSON.stringify({ antes_bytes: fs.statSync(ent).size, depois_bytes: buf.length })); return;
  }
  await gerar(lerTarefa(args[0]), { seco });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  principal(process.argv.slice(2)).catch((e) => {
    avisa('[gera-replicate] ' + (e && e.message ? e.message : e));
    process.exit(e instanceof ErroUso ? 2 : e instanceof ErroSaldo ? 3 : e instanceof ErroTeto ? 4 : 1);
  });
}
