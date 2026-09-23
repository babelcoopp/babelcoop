/* Prova do PEÇAS (missão babel-coop/terminal-ao-vivo · R5 "as 16 peças em 3D").
   Tudo no Electron do app com janela escondida (BABEL_COOP_OCULTO), nenhum Chrome.
   Uso (da raiz do repositório):
     node .deus/terminal-ao-vivo/evidencias/pecas/pecas-prova.cjs antes
     node .deus/terminal-ao-vivo/evidencias/pecas/pecas-prova.cjs depois
     node .deus/terminal-ao-vivo/evidencias/pecas/pecas-prova.cjs roteiro <saida.json>
   Porta 4961 / descoberta 41961 (livres na hora do teste). Fecha tudo no fim. */
'use strict';
const fs = require('fs');
const path = require('path');
const { abrirEstacao } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/testes/e2e/estacao.js');

const RAIZ = '/Users/matheussilveirapro/Desktop/babel-coop';
const EVID = path.join(RAIZ, '.deus/terminal-ao-vivo/evidencias/pecas');
const PORTA = Number(process.env.PORTA || 4961);
const DESC = Number(process.env.DESC || 41961);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function abrir() {
  const e = await abrirEstacao({ nome: 'pecas', porta: PORTA, descoberta: DESC });
  const erros = [];
  e.page.on('pageerror', (x) => erros.push(String(x).slice(0, 200)));
  await e.page.waitForLoadState('domcontentloaded');
  const f = await e.api('/api/fundar', { nome: 'Theus' });
  await e.page.reload(); await e.page.waitForLoadState('domcontentloaded');
  await espera(1800);
  await e.page.setViewportSize({ width: 1440, height: 900 }).catch(() => {});
  return { e, erros, fundar: f };
}

async function antes() {
  const { e, erros, fundar } = await abrir();
  const page = e.page;
  try {
    const info = {};
    info.fundar = JSON.stringify(fundar).slice(0, 80);
    info.pecas_json = await page.evaluate(async () => { const r = await fetch('midia/pecas/pecas.json', { cache: 'no-store' }); return r.status; });
    info.pecas_js = await page.evaluate(async () => { const r = await fetch('midia/pecas/pecas.js', { cache: 'no-store' }); return r.status; });
    info.bc_pecas = await page.evaluate(() => !!(window.BC && BC.pecas));
    await page.evaluate(() => { BC.estacao.fecharTodas(); BC.maquina.abrir('clinicas'); });
    await espera(900);
    info.maquina_imgs_de_peca = await page.evaluate(() => document.querySelectorAll('#e-conteudo img[src*="pecas"]').length);
    await page.screenshot({ path: path.join(EVID, 'antes-maquina.png'), timeout: 15000 });
    info.erros = erros;
    fs.writeFileSync(path.join(EVID, 'antes.json'), JSON.stringify(info, null, 2));
    console.log(JSON.stringify(info));
  } finally { await e.fechar(); }
}

/* carrega midia/pecas/pecas.js como qualquer outro agente carregaria (script injetado) */
async function carregarPecas(page) {
  await page.evaluate(() => new Promise((ok, nao) => {
    if (window.BC && BC.pecas) return ok();
    const s = document.createElement('script'); s.src = 'midia/pecas/pecas.js'; s.onload = ok; s.onerror = () => nao(new Error('pecas.js não carregou')); document.head.appendChild(s);
  }));
}

async function depois() {
  const { e, erros } = await abrir();
  const page = e.page;
  const R = [];
  const ok = (nome, passou, achou) => { R.push({ nome, ok: !!passou, achou: passou ? '' : String(achou).slice(0, 200) }); };
  try {
    /* 1. o fluxo real da Estação: a Máquina carrega midia/pecas/pecas.js sozinha, mostra os PNG nas peças,
          e o botão "Ver em 3D" da ficha abre a vitrine com o corpo da peça (clique de verdade) */
    await page.evaluate(() => { BC.estacao.fecharTodas(); BC.maquina.abrir('clinicas'); });
    await page.waitForFunction(() => !!(window.BC && BC.pecas && BC.pecas.lista().length), null, { timeout: 15000 }).catch(() => {});
    await page.evaluate(() => BC.estacao.render()); await espera(900);
    const naMaquina = await page.evaluate(() => ({ bcPecas: !!(window.BC && BC.pecas), imagens: ['gaveta', 'portaria', 'cofre', 'deposito', 'tela', 'empresa'].map((t) => (BC.maquina.imagem ? String(BC.maquina.imagem(t)) : '')), imgsNaTela: Array.from(document.querySelectorAll('#e-conteudo img')).map((i) => i.getAttribute('src')).filter((s) => /midia\/pecas\//.test(s || '')).length }));
    ok('a Máquina carrega BC.pecas sozinha e pega a imagem de cada peça em midia/pecas (<id>.png de 512 px)', naMaquina.bcPecas && naMaquina.imagens.every((u, i) => u.indexOf('midia/pecas/' + ['gaveta', 'portaria', 'cofre', 'deposito', 'tela', 'empresa'][i] + '.png') !== -1), JSON.stringify(naMaquina));
    await page.screenshot({ path: path.join(EVID, 'depois-maquina.png'), timeout: 15000 });
    /* a peça que dá para clicar de verdade (o ponto do meio dela não está coberto por outra) */
    const sel = await page.evaluate(() => {
      const cands = Array.from(document.querySelectorAll('#e-conteudo [data-acao="mq-sel"][data-id]'));
      for (const el of cands) { const r = el.getBoundingClientRect(); if (!r.width) continue; const x = r.left + Math.min(24, r.width / 2), y = r.top + Math.min(14, r.height / 2); const h = document.elementFromPoint(x, y); if (h && el.contains(h)) return { x, y, id: el.dataset.id }; }
      return null;
    });
    if (sel) { await page.mouse.click(sel.x, sel.y); await espera(600); }
    const botao3d = await page.$('[data-acao="mq-3d"]');
    ok('a ficha da peça tem o botão "Ver em 3D"', !!botao3d, sel ? 'sem botão mq-3d na ficha' : 'sem peça clicável (mq-sel)');
    if (botao3d) {
      await botao3d.click();
      await page.waitForFunction(() => { const p = document.querySelector('#mq-3d .pc-palco'); return p && (p.dataset.estado === 'corpo' || p.dataset.estado === 'falhou'); }, null, { timeout: 30000 }).catch(() => {});
      await espera(1900);
      const r3 = await page.evaluate(() => { const p = document.querySelector('#mq-3d .pc-palco'); return { estado: p && p.dataset.estado, peca: p && p.dataset.peca, cartoes: document.querySelectorAll('#mq-3d [data-peca]').length, u: BC.pecas.ultimo() }; });
      ok('clicar em "Ver em 3D" na Máquina abre a vitrine e o corpo 3D da peça', r3.estado === 'corpo' && r3.cartoes >= 16 && r3.u && r3.u.malhas > 0, JSON.stringify(r3));
      fs.writeFileSync(path.join(EVID, 'depois-maquina-ver-em-3d.json'), JSON.stringify(Object.assign({ clicou_em: sel }, r3), null, 1));
      /* a camada #mq-3d é da Máquina; enquanto maquina-2030.css não a posiciona, o print é do próprio elemento */
      const pos = await page.evaluate(() => getComputedStyle(document.getElementById('mq-3d')).position);
      if (pos === 'static') await page.locator('#mq-3d').screenshot({ path: path.join(EVID, 'depois-maquina-ver-em-3d.png'), timeout: 15000 }).catch(() => {});
      else await page.screenshot({ path: path.join(EVID, 'depois-maquina-ver-em-3d.png'), timeout: 15000 });
      r3.posicaoDaCamada = pos;
      await page.evaluate(() => { const d = document.getElementById('mq-3d'); if (d) d.remove(); BC.pecas.fechar3d(); });
    }
    await carregarPecas(page);
    const cat = await page.evaluate(async () => { const c = await BC.pecas.carregar(); return { n: c.pecas.length, ids: c.pecas.map((p) => p.id), custo: c.custo_total_usd }; });
    ok('pecas.json tem as 16 peças', cat.n === 16, JSON.stringify(cat));
    /* cada PNG carrega de verdade e tem alfa (recorte) */
    const imgs = await page.evaluate(async () => {
      const c = await BC.pecas.carregar(); const out = [];
      for (const p of c.pecas) {
        const im = new Image(); im.src = BC.pecas.url(p.id, 'png');
        await im.decode().catch(() => {});
        const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const x = cv.getContext('2d'); x.drawImage(im, 0, 0, 64, 64);
        const d = x.getImageData(0, 0, 64, 64).data; let transp = 0; for (let i = 3; i < d.length; i += 4) if (d[i] < 16) transp++;
        out.push({ id: p.id, w: im.naturalWidth, h: im.naturalHeight, transp_pct: Math.round(100 * transp / 4096) });
      }
      return out;
    });
    ok('os 16 PNG abrem com recorte (canto transparente, peça no meio)', imgs.every((i) => i.w >= 256 && i.transp_pct >= 30 && i.transp_pct <= 95), JSON.stringify(imgs.filter((i) => !(i.w >= 256 && i.transp_pct >= 30 && i.transp_pct <= 95))));
    /* cada GLB: cabeçalho glTF v2 e JSON com malha */
    const glbs = await page.evaluate(async () => {
      const c = await BC.pecas.carregar(); const out = [];
      for (const p of c.pecas) {
        const r = await fetch(BC.pecas.url(p.id, 'glb'), { cache: 'no-store' }); const b = await r.arrayBuffer(); const v = new DataView(b);
        const magic = v.getUint32(0, true), ver = v.getUint32(4, true), len = v.getUint32(8, true), jl = v.getUint32(12, true);
        const js = JSON.parse(new TextDecoder().decode(new Uint8Array(b, 20, jl)));
        out.push({ id: p.id, bytes: b.byteLength, glTF: magic === 0x46546c67, versao: ver, len_ok: len === b.byteLength, malhas: (js.meshes || []).length, ext: js.extensionsUsed || [] });
      }
      return out;
    });
    ok('os 16 GLB têm cabeçalho glTF 2 válido e malha', glbs.every((g) => g.glTF && g.versao === 2 && g.len_ok && g.malhas > 0), JSON.stringify(glbs.filter((g) => !(g.glTF && g.versao === 2 && g.len_ok && g.malhas > 0))));

    /* evento real: a vitrine abre num painel, a pessoa clica numa peça e ela ganha corpo em 3D */
    await page.evaluate(() => { BC.estacao.fecharTodas(); BC.maquina.abrir('clinicas'); });
    await espera(600);
    await page.evaluate(() => { const alvo = document.getElementById('e-conteudo'); const d = document.createElement('div'); d.id = 'prova-vitrine'; d.style.cssText = 'position:fixed;inset:60px 40px 40px 40px;z-index:50'; document.body.appendChild(d); BC.pecas.vitrine(d); });
    await espera(900);
    const nCartoes = await page.evaluate(() => document.querySelectorAll('#prova-vitrine [data-peca]').length);
    ok('vitrine mostra 16 cartões de peça', nCartoes === 16, nCartoes);
    await page.screenshot({ path: path.join(EVID, 'depois-vitrine.png'), timeout: 15000 });
    await page.click('#prova-vitrine [data-peca="gaveta"]');
    await page.waitForFunction(() => { const v = document.querySelector('#prova-vitrine .pc-palco'); return v && v.dataset.estado === 'corpo'; }, null, { timeout: 30000 }).catch(() => {});
    await espera(1400);
    const tresD = await page.evaluate(() => { const v = document.querySelector('#prova-vitrine .pc-palco'); const cv = v && v.querySelector('canvas'); return { estado: v && v.dataset.estado, canvas: !!cv, w: cv && cv.width, h: cv && cv.height, info: BC.pecas.ultimo && BC.pecas.ultimo() }; });
    ok('clique na Gaveta abre o 3D e o GLB carrega (malhas > 0)', tresD.canvas && tresD.estado === 'corpo' && tresD.info && tresD.info.malhas > 0, JSON.stringify(tresD));
    ok('canvas respeita devicePixelRatio ≤ 1,5', tresD.info && tresD.info.pixelRatio <= 1.5, JSON.stringify(tresD.info));
    await page.screenshot({ path: path.join(EVID, 'depois-gaveta-3d.png'), timeout: 15000 });
    /* pixel no meio do canvas não é o fundo: a peça foi desenhada */
    const desenhou = await page.evaluate(() => BC.pecas.ultimo().pixelsAcesos);
    ok('a peça aparece desenhada no canvas (pixels acesos > 2 %)', desenhou > 2, desenhou);
    await page.click('#prova-vitrine [data-peca="portaria"]');
    await page.waitForFunction(() => BC.pecas.ultimo() && BC.pecas.ultimo().id === 'portaria' && document.querySelector('#prova-vitrine .pc-palco').dataset.estado === 'corpo', null, { timeout: 30000 }).catch(() => {});
    await espera(1200);
    ok('trocar para a Portaria troca o modelo', await page.evaluate(() => BC.pecas.ultimo().id === 'portaria' && BC.pecas.ultimo().malhas > 0), await page.evaluate(() => JSON.stringify(BC.pecas.ultimo())));
    await page.screenshot({ path: path.join(EVID, 'depois-portaria-3d.png'), timeout: 15000 });
    /* laço parado quando o palco sai da tela / some */
    const parado = await page.evaluate(async () => { document.getElementById('prova-vitrine').style.display = 'none'; await new Promise((r) => setTimeout(r, 600)); const a = BC.pecas.ultimo().quadros; await new Promise((r) => setTimeout(r, 800)); const b = BC.pecas.ultimo().quadros; document.getElementById('prova-vitrine').style.display = ''; return { a, b }; });
    ok('o laço do 3D para quando o palco some', parado.a === parado.b, JSON.stringify(parado));
    /* movimento reduzido: sem giro */
    const reduzido = await page.evaluate(() => BC.pecas.reduzido());
    ok('BC.pecas.reduzido() responde (prefers-reduced-motion)', typeof reduzido === 'boolean', reduzido);
    /* ganhar corpo: a peça nasce tracejada e ganha corpo por evento (publicar) */
    await page.evaluate(() => { const d = document.createElement('div'); d.id = 'prova-nasce'; d.style.cssText = 'position:fixed;left:60px;bottom:60px;width:180px;height:180px;z-index:60'; document.body.appendChild(d); BC.pecas.peca(d, 'cofre', { estado: 'nova' }); });
    await espera(400);
    const antesCorpo = await page.evaluate(() => document.querySelector('#prova-nasce .pc-peca').dataset.estado);
    await page.evaluate(() => BC.pecas.ganharCorpo(document.querySelector('#prova-nasce .pc-peca')));
    await espera(1500);
    const depoisCorpo = await page.evaluate(() => document.querySelector('#prova-nasce .pc-peca').dataset.estado);
    ok('peça nova tracejada ganha corpo ao publicar', antesCorpo === 'nova' && depoisCorpo === 'corpo', antesCorpo + ' → ' + depoisCorpo);
    await page.screenshot({ path: path.join(EVID, 'depois-ganha-corpo.png'), timeout: 15000 });
    /* a Gaveta tem o clipe "a peça ganha corpo" (cubo de ardósia → gaveta): toca uma vez, só no evento */
    await page.evaluate(() => { const d = document.getElementById('prova-nasce'); d.style.width = '260px'; d.style.height = '260px'; d.style.background = 'var(--s0,#060b16)'; BC.pecas.peca(d, 'gaveta', { estado: 'nova' }); });
    await espera(400);
    await page.locator('#prova-nasce').screenshot({ path: path.join(EVID, 'ganha-corpo-1-tracejada.png') });
    const promCorpo = page.evaluate(() => BC.pecas.ganharCorpo('#prova-nasce .pc-peca').then(() => document.querySelector('#prova-nasce .pc-peca').dataset.estado));
    await espera(1600);
    const meio = await page.evaluate(() => { const v = document.querySelector('#prova-nasce video'); return v ? { tocando: !v.paused, t: +v.currentTime.toFixed(2), src: v.getAttribute('src') } : null; });
    await page.locator('#prova-nasce').screenshot({ path: path.join(EVID, 'ganha-corpo-2-clipe.png') });
    const fimCorpo = await promCorpo; await espera(700);
    await page.locator('#prova-nasce').screenshot({ path: path.join(EVID, 'ganha-corpo-3-corpo.png') });
    const semVideo = await page.evaluate(() => !document.querySelector('#prova-nasce video'));
    ok('Gaveta nova: o clipe cubo → gaveta toca uma vez no evento e ela fica com corpo', !!meio && meio.tocando && meio.t > 0.3 && fimCorpo === 'corpo' && semVideo, JSON.stringify({ meio, fimCorpo, semVideo }));
    ok('zero erros de página', erros.length === 0, erros.join(' | '));
    const res = { resumo: R.filter((r) => r.ok).length + '/' + R.length, tudo: R, glbs, imgs };
    fs.writeFileSync(path.join(EVID, 'depois.json'), JSON.stringify(res, null, 2));
    console.log(JSON.stringify({ resumo: res.resumo, falhas: R.filter((r) => !r.ok) }, null, 1));
  } finally { await e.fechar(); }
}

/* roda docs/testes/roteiro.js numa page do Electron (mesma função; route em http://coop.local) */
async function roteiro(saida) {
  const { e } = await abrir();
  try {
    const fonte = fs.readFileSync(path.join(RAIZ, 'docs/testes/roteiro.js'), 'utf8');
    const corpo = fonte.slice(fonte.indexOf('async (page)'));
    // eslint-disable-next-line no-eval
    const fn = eval('(' + corpo.trim().replace(/;?\s*$/, '') + ')');
    const page = e.page;
    /* o Electron não abre página nova pelo contexto: a TV do roteiro vira uma janela do próprio app */
    const ctx = page.context();
    const novaOriginal = ctx.newPage.bind(ctx);
    ctx.newPage = async () => {
      try { return await novaOriginal(); } catch (x) {
        const antes = e.app.windows().length;
        await e.app.evaluate(({ BrowserWindow }) => { const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { backgroundThrottling: false } }); w.loadURL('about:blank'); });
        for (let i = 0; i < 50 && e.app.windows().length <= antes; i++) await espera(100);
        return e.app.windows()[e.app.windows().length - 1];
      }
    };
    const t0 = Date.now();
    const r = await fn(page);
    r.segundos = Math.round((Date.now() - t0) / 1000);
    fs.writeFileSync(saida, JSON.stringify(r, null, 2));
    console.log(JSON.stringify({ resumo: r.resumo, falhas: r.falhas, segundos: r.segundos }, null, 1));
  } finally { await e.fechar(); }
}

const modo = process.argv[2];
(modo === 'antes' ? antes() : modo === 'depois' ? depois() : modo === 'roteiro' ? roteiro(process.argv[3] || path.join(EVID, 'roteiro.json')) : Promise.reject(new Error('modo: antes | depois | roteiro')))
  .catch((x) => { console.error('FALHOU:', x && x.stack || x); process.exitCode = 1; });
