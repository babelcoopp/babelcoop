/* Acha, para cada peça, o giro (0°, 45°, … 315°) em que o GLB do Trellis fica igual ao PNG isométrico
   (mesma câmera ortográfica de BC.pecas.abrir3d: elevação 35°, azimute 45°). Compara silhueta (alfa) e tom
   em 96×96. Grava giro_graus em prototipo/midia/pecas/pecas.json. Electron escondido, porta 4961. */
'use strict';
const fs = require('fs');
const path = require('path');
const { abrirEstacao } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/testes/e2e/estacao.js');
const JSONP = '/Users/matheussilveirapro/Desktop/babel-coop/prototipo/midia/pecas/pecas.json';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const e = await abrirEstacao({ nome: 'pecas-giro', porta: 4961, descoberta: 41961 });
  try {
    const page = e.page; await page.waitForLoadState('domcontentloaded');
    await e.api('/api/fundar', { nome: 'Theus' }); await page.reload(); await espera(1500);
    await page.evaluate(() => new Promise((ok, nao) => { const s = document.createElement('script'); s.src = 'midia/pecas/pecas.js'; s.onload = ok; s.onerror = nao; document.head.appendChild(s); }));
    const res = await page.evaluate(async () => {
      const N = 96, out = {};
      const cat = await BC.pecas.carregar();
      function amostra(src) { const k = document.createElement('canvas'); k.width = N; k.height = N; const x = k.getContext('2d'); x.drawImage(src, 0, 0, N, N); return x.getImageData(0, 0, N, N).data; }
      /* recorta a caixa do que não é transparente e centraliza (a escala do PNG e do 3D não precisam bater) */
      function normal(d) {
        let x0 = N, y0 = N, x1 = -1, y1 = -1;
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (d[(y * N + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        const k = document.createElement('canvas'); k.width = N; k.height = N; const x = k.getContext('2d');
        const src = document.createElement('canvas'); src.width = N; src.height = N; src.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(d), N, N), 0, 0);
        const w = x1 - x0 + 1, h = y1 - y0 + 1, s = (N - 8) / Math.max(w, h);
        x.drawImage(src, x0, y0, w, h, (N - w * s) / 2, (N - h * s) / 2, w * s, h * s);
        return x.getImageData(0, 0, N, N).data;
      }
      for (const p of cat.pecas) {
        const im = new Image(); im.src = BC.pecas.url(p.id, 'png'); await im.decode();
        const ref = normal(amostra(im));
        const m = await BC.pecas.carregarModelo(p.id); const THREE = m.THREE;
        const gl = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); gl.setSize(N * 2, N * 2, false); gl.outputColorSpace = THREE.SRGBColorSpace;
        const cena = new THREE.Scene(); cena.add(m.objeto);
        const R = m.objeto.userData.raio * 1.1; const cam = new THREE.OrthographicCamera(-R, R, R, -R, 0.01, 50);
        const el = 35 * Math.PI / 180; cam.position.set(Math.cos(el) * Math.sin(Math.PI / 4) * 6, Math.sin(el) * 6, Math.cos(el) * Math.cos(Math.PI / 4) * 6); cam.lookAt(0, 0, 0);
        const notas = [];
        for (let k = 0; k < 8; k++) {
          m.objeto.rotation.y = k * Math.PI / 4; gl.render(cena, cam);
          const d = normal(amostra(gl.domElement));
          let s = 0; for (let i = 0; i < N * N; i++) { const a1 = ref[i * 4 + 3] / 255, a2 = d[i * 4 + 3] / 255; const l1 = (ref[i * 4] + ref[i * 4 + 1] + ref[i * 4 + 2]) / 765, l2 = (d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2]) / 765; s += Math.abs(a1 - a2) + 0.5 * Math.abs(l1 * a1 - l2 * a2); }
          notas.push(+(s / (N * N)).toFixed(4));
        }
        gl.dispose();
        const melhor = notas.indexOf(Math.min.apply(null, notas));
        out[p.id] = { giro_graus: melhor * 45, notas };
      }
      return out;
    });
    const cat = JSON.parse(fs.readFileSync(JSONP, 'utf8'));
    cat.pecas.forEach((p) => { if (res[p.id]) p.giro_graus = res[p.id].giro_graus; });
    fs.writeFileSync(JSONP, JSON.stringify(cat, null, 1) + '\n');
    fs.writeFileSync(path.join(__dirname, 'giro.json'), JSON.stringify(res, null, 1));
    for (const [id, r] of Object.entries(res)) console.log(id.padEnd(18), String(r.giro_graus).padStart(3) + '°', r.notas.join(' '));
  } finally { await e.fechar(); }
})().catch((x) => { console.error('FALHOU', x); process.exitCode = 1; });
