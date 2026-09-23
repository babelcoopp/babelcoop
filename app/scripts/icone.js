/* babel-coop · ícone do app (Node puro: zlib para o PNG, nada de Python, ImageMagick ou sips)
   Fonte: prototipo/babel-logo.png (o "b" em fita roxo → azul → ciano, fundo transparente).
   Saída em app/build/: icon.png (1024), icon.icns (Mac, 16 → 1024) e icon.ico (Windows, 16 → 256).
   Desenho (design 2030 + contexto Gabriel, só o que cabe num ícone):
   - corpo em superelipse 824 px no quadro de 1024 (grade de ícone do macOS), chão --s0/--s1 com sombra curta;
   - o "b" no centro com halo neon na própria cor (luz que sai da marca, não um brilho colado por cima);
   - atrás dele, o anel-instrumento da presença: 72 marcas finas e 12 longas, bem apagadas;
   - borda de vidro 1 px a rgba(63,227,255,.22), a mesma do HUD. Sem texto, sem scanline (vira moiré a 16 px).
   Uso: node scripts/icone.js [--forcar]   (sem --forcar, não refaz se os ícones forem mais novos que o logo)
*/
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const APP = path.join(__dirname, '..');
const LOGO = path.join(APP, '..', 'prototipo', 'babel-logo.png');
const SAIDA = path.join(APP, 'build');

/* ---------- PNG: ler (RGBA 8 bits, sem entrelaçamento) ---------- */
function lerPng(arquivo) {
  const b = fs.readFileSync(arquivo);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error('não é PNG: ' + arquivo);
  let pos = 8, w = 0, h = 0, prof = 0, tipo = 0, entrel = 0;
  const idat = [];
  while (pos < b.length) {
    const n = b.readUInt32BE(pos), t = b.toString('ascii', pos + 4, pos + 8), d = b.subarray(pos + 8, pos + 8 + n);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); prof = d[8]; tipo = d[9]; entrel = d[12]; }
    else if (t === 'IDAT') idat.push(d);
    else if (t === 'IEND') break;
    pos += 12 + n;
  }
  if (prof !== 8 || (tipo !== 6 && tipo !== 2) || entrel) throw new Error('PNG não suportado (preciso de RGB/RGBA 8 bits sem entrelaçamento)');
  const bpp = tipo === 6 ? 4 : 3, linha = w * bpp;
  const cru = zlib.inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(w * h * 4);
  let ant = Buffer.alloc(linha), atual = Buffer.alloc(linha);
  for (let y = 0; y < h; y++) {
    const f = cru[y * (linha + 1)], ini = y * (linha + 1) + 1;
    for (let i = 0; i < linha; i++) {
      const x = cru[ini + i], a = i >= bpp ? atual[i - bpp] : 0, c = ant[i], ac = i >= bpp ? ant[i - bpp] : 0;
      let v;
      if (f === 0) v = x;
      else if (f === 1) v = x + a;
      else if (f === 2) v = x + c;
      else if (f === 3) v = x + ((a + c) >> 1);
      else { const p = a + c - ac, pa = Math.abs(p - a), pb = Math.abs(p - c), pc = Math.abs(p - ac); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? c : ac); }
      atual[i] = v & 255;
    }
    for (let xx = 0; xx < w; xx++) {
      const o = (y * w + xx) * 4;
      px[o] = atual[xx * bpp]; px[o + 1] = atual[xx * bpp + 1]; px[o + 2] = atual[xx * bpp + 2]; px[o + 3] = bpp === 4 ? atual[xx * bpp + 3] : 255;
    }
    const tr = ant; ant = atual; atual = tr;
  }
  return { w, h, px };
}

/* ---------- PNG: escrever (RGBA 8 bits, filtro Paeth) ---------- */
function pedaco(tipo, dados) {
  const n = Buffer.alloc(4); n.writeUInt32BE(dados.length);
  const td = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0);
  return Buffer.concat([n, td, crc]);
}
function escreverPng({ w, h, px }) {
  const linha = w * 4, cru = Buffer.alloc(h * (linha + 1));
  for (let y = 0; y < h; y++) {
    cru[y * (linha + 1)] = 4;
    for (let i = 0; i < linha; i++) {
      const o = y * linha + i, x = px[o], a = i >= 4 ? px[o - 4] : 0, c = y ? px[o - linha] : 0, ac = i >= 4 && y ? px[o - linha - 4] : 0;
      const p = a + c - ac, pa = Math.abs(p - a), pb = Math.abs(p - c), pc = Math.abs(p - ac);
      cru[y * (linha + 1) + 1 + i] = (x - (pa <= pb && pa <= pc ? a : pb <= pc ? c : ac)) & 255;
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), pedaco('IHDR', ihdr), pedaco('IDAT', zlib.deflateSync(cru, { level: 9 })), pedaco('IEND', Buffer.alloc(0))]);
}

/* ---------- imagem em ponto flutuante, pré-multiplicada (sem franja escura ao reduzir e borrar) ---------- */
const nova = (w, h) => ({ w, h, d: new Float32Array(w * h * 4) });
function deBytes({ w, h, px }) {
  const im = nova(w, h);
  for (let i = 0; i < w * h; i++) { const a = px[i * 4 + 3] / 255; im.d[i * 4] = px[i * 4] / 255 * a; im.d[i * 4 + 1] = px[i * 4 + 1] / 255 * a; im.d[i * 4 + 2] = px[i * 4 + 2] / 255 * a; im.d[i * 4 + 3] = a; }
  return im;
}
function paraBytes(im) {
  const px = Buffer.alloc(im.w * im.h * 4);
  for (let i = 0; i < im.w * im.h; i++) {
    const a = Math.min(1, Math.max(0, im.d[i * 4 + 3]));
    px[i * 4 + 3] = Math.round(a * 255);
    for (let c = 0; c < 3; c++) px[i * 4 + c] = a > 0 ? Math.round(Math.min(1, Math.max(0, im.d[i * 4 + c] / a)) * 255) : 0;
  }
  return { w: im.w, h: im.h, px };
}

/* redução por média de área (cada pixel de saída = média ponderada da área que ele cobre) */
function reduzirEixo(im, nw, nh, horizontal) {
  const saida = nova(nw, nh), n = horizontal ? im.w : im.h, m = horizontal ? nw : nh, esc = n / m;
  const pesos = [];
  for (let k = 0; k < m; k++) {
    const a = k * esc, b = (k + 1) * esc, lista = [];
    for (let s = Math.floor(a); s < Math.min(n, Math.ceil(b)); s++) { const cob = Math.min(b, s + 1) - Math.max(a, s); if (cob > 0) lista.push([s, cob / esc]); }
    pesos.push(lista);
  }
  for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) {
    const o = (y * nw + x) * 4, lista = pesos[horizontal ? x : y];
    let r = 0, g = 0, bl = 0, al = 0;
    for (const [s, p] of lista) { const i = (horizontal ? y * im.w + s : s * im.w + x) * 4; r += im.d[i] * p; g += im.d[i + 1] * p; bl += im.d[i + 2] * p; al += im.d[i + 3] * p; }
    saida.d[o] = r; saida.d[o + 1] = g; saida.d[o + 2] = bl; saida.d[o + 3] = al;
  }
  return saida;
}
const reduzir = (im, nw, nh) => reduzirEixo(reduzirEixo(im, nw, im.h, true), nw, nh, false);

/* desfoque por caixa, 3 passadas (quase gaussiano), separável */
function borrar(im, raio) {
  let a = im;
  for (let passe = 0; passe < 3; passe++) for (const horiz of [true, false]) {
    const b = nova(a.w, a.h), n = horiz ? a.w : a.h, linhas = horiz ? a.h : a.w, jan = raio * 2 + 1;
    for (let l = 0; l < linhas; l++) {
      const idx = (k) => ((horiz ? l * a.w + k : k * a.w + l) * 4);
      const soma = [0, 0, 0, 0];
      for (let k = -raio; k <= raio; k++) { const kk = Math.min(n - 1, Math.max(0, k)); for (let c = 0; c < 4; c++) soma[c] += a.d[idx(kk) + c]; }
      for (let k = 0; k < n; k++) {
        const o = idx(k);
        for (let c = 0; c < 4; c++) b.d[o + c] = soma[c] / jan;
        const sai = idx(Math.max(0, k - raio)), entra = idx(Math.min(n - 1, k + raio + 1));
        for (let c = 0; c < 4; c++) soma[c] += a.d[entra + c] - a.d[sai + c];
      }
    }
    a = b;
  }
  return a;
}

/* cor 0..1 a partir de #rrggbb */
const cor = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
/* "por cima" pré-multiplicado: pinta (r,g,b) com opacidade a no pixel i */
function sobre(d, i, r, g, b, a) { const k = 1 - a; d[i] = r * a + d[i] * k; d[i + 1] = g * a + d[i + 1] * k; d[i + 2] = b * a + d[i + 2] * k; d[i + 3] = a + d[i + 3] * k; }

/* ---------- o ícone mestre, 1024 ---------- */
function desenhar(logo) {
  const T = 1024, C = T / 2, LADO = 824, SEMI = LADO / 2, N = 5; /* superelipse |x|^5 + |y|^5 = 1: o "squircle" do macOS */
  const S0 = cor('#060b16'), S1 = cor('#0e1628'), T0 = cor('#2ad5e5'), T2 = cor('#a376e9'), T1 = cor('#7ba4f0'), VIDRO = [63 / 255, 227 / 255, 1];

  /* máscara do corpo com antisserrilhado (4 × 4 amostras só perto da borda) */
  const f = (x, y) => Math.pow(Math.abs(x - C) / SEMI, N) + Math.pow(Math.abs(y - C) / SEMI, N);
  const mascara = new Float32Array(T * T);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const v = f(x + 0.5, y + 0.5);
    if (v < 0.97) { mascara[y * T + x] = 1; continue; }
    if (v > 1.03) continue;
    let dentro = 0;
    for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) if (f(x + (sx + 0.5) / 4, y + (sy + 0.5) / 4) <= 1) dentro++;
    mascara[y * T + x] = dentro / 16;
  }

  const im = nova(T, T), d = im.d;
  /* sombra curta do corpo (preta, 10 px abaixo, borrada) */
  const sombra = nova(T, T);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const m = mascara[Math.max(0, y - 10) * T + x]; sombra.d[(y * T + x) * 4 + 3] = m * 0.55; }
  const sb = borrar(sombra, 9);
  for (let i = 0; i < T * T; i++) d[i * 4 + 3] = sb.d[i * 4 + 3];

  /* camada do corpo: chão em degradê vertical --s1 → --s0, luz de fundo roxa (alto) e ciana (baixo), anel-instrumento, borda de vidro */
  const corpo = nova(T, T), cd = corpo.d;
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const i = (y * T + x) * 4, t = (y - (C - SEMI)) / LADO;
    let r = S1[0] + (S0[0] - S1[0]) * t, g = S1[1] + (S0[1] - S1[1]) * t, b = S1[2] + (S0[2] - S1[2]) * t;
    const dr = Math.hypot(x - C, y - (C - 150)) / 420, dc = Math.hypot(x - C, y - (C + 190)) / 380;
    const lr = 0.20 * Math.exp(-dr * dr * 2.2), lc = 0.16 * Math.exp(-dc * dc * 2.2);
    r += T2[0] * lr + T0[0] * lc; g += T2[1] * lr + T0[1] * lc; b += T2[2] * lr + T0[2] * lc;
    cd[i] = r; cd[i + 1] = g; cd[i + 2] = b; cd[i + 3] = 1;
  }
  /* anel-instrumento: 72 marcas a cada 5° (r 338 → 356), 12 longas a cada 30° (r 318 → 356) e um aro fino em r 300 */
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const dx = x + 0.5 - C, dy = y + 0.5 - C, r = Math.hypot(dx, dy);
    if (r < 296 || r > 360) continue;
    const i = (y * T + x) * 4;
    const aro = Math.max(0, 1 - Math.abs(r - 300) / 0.9) * 0.10;
    if (aro > 0) sobre(cd, i, 0.84, 0.89, 0.98, aro);
    const ang = Math.atan2(dy, dx), passo = Math.PI / 36, k = Math.round(ang / passo), longa = ((k % 6) + 6) % 6 === 0;
    const r0 = longa ? 318 : 338;
    if (r < r0 || r > 356) continue;
    const dist = Math.abs(r * Math.sin(ang - k * passo)), meia = longa ? 1.6 : 0.9;
    const cob = Math.min(1, Math.max(0, meia + 0.5 - dist));
    if (cob > 0) { const quente = (Math.sin(ang) + 1) / 2; /* roxo no alto, ciano embaixo: o eixo do tempo da marca */ const c = [T2[0] + (T0[0] - T2[0]) * quente, T2[1] + (T0[1] - T2[1]) * quente, T2[2] + (T0[2] - T2[2]) * quente]; sobre(cd, i, c[0], c[1], c[2], cob * (longa ? 0.42 : 0.24)); }
  }

  /* o "b": 640 px de altura, centrado pela caixa; halo neon largo (raio 44, 0,55) e curto (raio 12, 0,9) na própria cor */
  const alt = 640, larg = Math.round(logo.w * alt / logo.h);
  const b = reduzir(deBytes(logo), larg, alt);
  const camada = nova(T, T), ox = Math.round(C - larg / 2) + 6, oy = Math.round(C - alt / 2);
  for (let y = 0; y < alt; y++) for (let x = 0; x < larg; x++) { const s = (y * larg + x) * 4, o = ((y + oy) * T + x + ox) * 4; for (let c = 0; c < 4; c++) camada.d[o + c] = b.d[s + c]; }
  const haloLargo = borrar(camada, 44), haloCurto = borrar(camada, 12);
  for (let i = 0; i < T * T * 4; i += 4) {
    /* luz somada ao chão (modo "adição", como gás acendendo), depois a fita por cima */
    for (let c = 0; c < 3; c++) cd[i + c] += haloLargo.d[i + c] * 0.55 + haloCurto.d[i + c] * 0.9;
    const a = camada.d[i + 3];
    if (a > 0) { const k = 1 - a; for (let c = 0; c < 3; c++) cd[i + c] = camada.d[i + c] + cd[i + c] * k; }
  }
  /* borda de vidro: 1,5 px logo dentro do contorno, rgba(63,227,255,.22), um pouco mais viva no alto */
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const v = f(x + 0.5, y + 0.5);
    if (v < 0.955 || v > 1) continue;
    const perto = 1 - Math.min(1, Math.abs(v - 0.975) / 0.02);
    const alto = 1 - (y - (C - SEMI)) / LADO;
    sobre(cd, (y * T + x) * 4, VIDRO[0], VIDRO[1], VIDRO[2], perto * (0.14 + 0.14 * alto));
  }
  /* corpo por cima da sombra, recortado pela máscara */
  for (let p = 0; p < T * T; p++) {
    const m = mascara[p]; if (!m) continue;
    const i = p * 4, k = 1 - m;
    for (let c = 0; c < 3; c++) d[i + c] = Math.min(1, cd[i + c]) * m + d[i + c] * k;
    d[i + 3] = m + d[i + 3] * k;
  }
  return im;
}

/* ---------- contêineres: ICNS (Mac) e ICO (Windows), com PNG dentro ---------- */
function icns(pngs) {
  /* tipo → tamanho em pixels; todos aceitam PNG desde o macOS 10.7 */
  const tipos = [['icp4', 16], ['icp5', 32], ['ic11', 32], ['ic12', 64], ['ic07', 128], ['ic13', 256], ['ic08', 256], ['ic14', 512], ['ic09', 512], ['ic10', 1024]];
  const partes = tipos.map(([t, n]) => { const dado = pngs[n], cab = Buffer.alloc(8); cab.write(t, 0, 'ascii'); cab.writeUInt32BE(dado.length + 8, 4); return Buffer.concat([cab, dado]); });
  const corpo = Buffer.concat(partes), cab = Buffer.alloc(8);
  cab.write('icns', 0, 'ascii'); cab.writeUInt32BE(corpo.length + 8, 4);
  return Buffer.concat([cab, corpo]);
}
function ico(pngs) {
  const tamanhos = [16, 24, 32, 48, 64, 128, 256], cab = Buffer.alloc(6 + 16 * tamanhos.length);
  cab.writeUInt16LE(0, 0); cab.writeUInt16LE(1, 2); cab.writeUInt16LE(tamanhos.length, 4);
  let desloc = cab.length;
  tamanhos.forEach((n, k) => {
    const e = 6 + k * 16, dado = pngs[n];
    cab[e] = n >= 256 ? 0 : n; cab[e + 1] = n >= 256 ? 0 : n; cab[e + 2] = 0; cab[e + 3] = 0;
    cab.writeUInt16LE(1, e + 4); cab.writeUInt16LE(32, e + 6); cab.writeUInt32LE(dado.length, e + 8); cab.writeUInt32LE(desloc, e + 12);
    desloc += dado.length;
  });
  return Buffer.concat([cab].concat(tamanhos.map((n) => pngs[n])));
}

function gerar({ forcar = false } = {}) {
  const alvos = ['icon.png', 'icon.icns', 'icon.ico'].map((n) => path.join(SAIDA, n));
  const tLogo = fs.statSync(LOGO).mtimeMs, tEste = fs.statSync(__filename).mtimeMs;
  if (!forcar && alvos.every((a) => fs.existsSync(a) && fs.statSync(a).mtimeMs > Math.max(tLogo, tEste))) return { refeito: false, alvos };
  const t0 = Date.now();
  const mestre = desenhar(lerPng(LOGO));
  const pngs = {};
  [16, 24, 32, 48, 64, 128, 256, 512, 1024].forEach((n) => { pngs[n] = escreverPng(paraBytes(n === 1024 ? mestre : reduzir(mestre, n, n))); });
  fs.mkdirSync(SAIDA, { recursive: true });
  fs.writeFileSync(alvos[0], pngs[1024]);
  fs.writeFileSync(alvos[1], icns(pngs));
  fs.writeFileSync(alvos[2], ico(pngs));
  return { refeito: true, alvos, ms: Date.now() - t0 };
}

module.exports = { gerar, lerPng, escreverPng };

if (require.main === module) {
  const r = gerar({ forcar: process.argv.includes('--forcar') });
  r.alvos.forEach((a) => console.log('[icone] ' + (r.refeito ? 'gerado ' : 'em dia  ') + path.relative(APP, a) + ' · ' + fs.statSync(a).size + ' bytes'));
  if (r.refeito) console.log('[icone] ' + r.ms + ' ms');
}
