/* Prova da casca 2030 (missão babel-coop/terminal-ao-vivo, aceite A14).
   Prints: Estação 1440×900 com arquivo aberto e na vista Terminais, evento real (salvar → aviso),
   agente pensando, paleta, TV 1280×720 e celular 400 px. Auditoria: texto em --t1/--t2 < 18 px,
   contraste do texto e sombras externas. Roteiro: docs/testes/roteiro.js num Chrome isolado.
   SEM_CASCA=1 serve o index.html sem as duas linhas <link> novas (= o visual de antes, fiel).
   Uso: node casca-prova.cjs prints <prefixo>  |  node casca-prova.cjs roteiro <saida.json> */
const fs = require('fs');
const path = require('path');
const { chromium } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/node_modules/playwright');

const BASE = '/Users/matheussilveirapro/Desktop/babel-coop/prototipo';
const EVID = process.env.EVID || '/Users/matheussilveirapro/Desktop/babel-coop/.deus/terminal-ao-vivo/evidencias/casca';
const SEM_CASCA = process.env.SEM_CASCA === '1';
const TIPOS = { html: 'text/html', js: 'text/javascript', css: 'text/css', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml' };

async function servir(ctx) {
  await ctx.route('http://coop.local/**', (route) => {
    let p = route.request().url().replace('http://coop.local', '').split('#')[0].split('?')[0];
    if (p === '/' || p === '') p = '/index.html';
    const ext = p.split('.').pop();
    const tipo = (TIPOS[ext] || 'text/plain') + '; charset=utf-8';
    if (SEM_CASCA && p === '/index.html') {
      const html = fs.readFileSync(BASE + '/index.html', 'utf8')
        .replace('<link rel="stylesheet" href="tokens.css">\n', '')
        .replace('<link rel="stylesheet" href="casca-2030.css">\n', '');
      return route.fulfill({ body: html, contentType: tipo, headers: { 'Cache-Control': 'no-store' } });
    }
    route.fulfill({ path: BASE + decodeURIComponent(p), contentType: tipo, headers: { 'Cache-Control': 'no-store' } })
      .catch(() => route.fulfill({ status: 404, body: 'x' }));
  });
}

async function abrirPagina(browser, largura, altura, hash, extra) {
  const ctx = await browser.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1, ...(extra || {}) });
  await servir(ctx);
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(String(e).slice(0, 200)));
  await page.goto('http://coop.local/' + (hash || ''));
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.fonts && document.fonts.ready);
  return { ctx, page, erros };
}

/* roda dentro da página: mede o que a régua proíbe e o contraste do texto da casca */
function auditar() {
  const rgb = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const razao = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
  const fundo = (el) => { let pilha = []; for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { pilha.push(c); if (c.a >= 1) break; } } let base = { r: 6, g: 11, b: 22 }; for (let i = pilha.length - 1; i >= 0; i--) { const c = pilha[i]; base = { r: c.r * c.a + base.r * (1 - c.a), g: c.g * c.a + base.g * (1 - c.a), b: c.b * c.a + base.b * (1 - c.a) }; } return base; };
  const visivel = (el) => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return false; const s = getComputedStyle(el); return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05; };
  const regiao = (el) => { const q = el.closest('.e-topo,.e-atividades,.e-lateral,.e-abas,.e-conteudo,.e-painel,.e-status,.cronometro,.paleta,.e-abas-celular,.e-toast'); return q ? q.className.split(' ')[0] : 'outro'; };
  const T1 = '123,164,240', T2 = '163,118,233';
  const textos = [];
  document.querySelectorAll('#vista-estacao *, #paleta *').forEach((el) => {
    if (el.closest('.term-corpo')) return; /* corpo do terminal é do agente painel (visual do Babel Terminal) */
    const temTexto = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
    if (!temTexto || !visivel(el)) return;
    const s = getComputedStyle(el), c = rgb(s.color);
    if (!c || c.a === 0) return;
    textos.push({ el, s, c, tam: parseFloat(s.fontSize) });
  });
  const tempo = textos.filter((t) => [T1, T2].includes([t.c.r, t.c.g, t.c.b].join(',')) && t.tam < 18).map((t) => regiao(t.el) + ' · ' + t.el.textContent.trim().slice(0, 30) + ' · ' + t.tam + 'px');
  const porRegiao = {};
  const baixos = [];
  textos.forEach((t) => {
    const k = regiao(t.el), bg = fundo(t.el), cor = { r: t.c.r * t.c.a + bg.r * (1 - t.c.a), g: t.c.g * t.c.a + bg.g * (1 - t.c.a), b: t.c.b * t.c.a + bg.b * (1 - t.c.a) };
    const r = razao(cor, bg);
    const pr = porRegiao[k] || (porRegiao[k] = { n: 0, min: 99, soma: 0 });
    pr.n++; pr.soma += r; if (r < pr.min) pr.min = r;
    if (r < 4.5 && t.tam < 18 && !t.el.closest('button:disabled,[disabled]')) baixos.push(k + ' · "' + t.el.textContent.trim().slice(0, 28) + '" · ' + r.toFixed(2) + ':1 · ' + t.tam + 'px');
  });
  Object.keys(porRegiao).forEach((k) => { const p = porRegiao[k]; porRegiao[k] = { textos: p.n, contraste_min: +p.min.toFixed(2), contraste_medio: +(p.soma / p.n).toFixed(2) }; });
  const sombras = [];
  document.querySelectorAll('#vista-estacao *').forEach((el) => {
    if (!visivel(el) || el.closest('.term-corpo')) return;
    const bs = getComputedStyle(el).boxShadow;
    if (bs && bs !== 'none' && bs.split(/,(?![^(]*\))/).some((p) => !/inset/.test(p))) sombras.push((el.className && el.className.baseVal === undefined ? el.className : el.tagName) + ' → ' + bs.slice(0, 60));
  });
  const corpo = document.querySelector('.md-corpo p') || document.querySelector('.e-conteudo p');
  const corpoInfo = corpo ? (() => { const s = getComputedStyle(corpo), c = rgb(s.color), bg = fundo(corpo); return { cor: s.color, fundo: 'rgb(' + [bg.r, bg.g, bg.b].map(Math.round).join(', ') + ')', tamanho: s.fontSize, fonte: s.fontFamily.split(',')[0], contraste: +razao(c, bg).toFixed(2) }; })() : null;
  return { textos_medidos: textos.length, texto_t1_t2_menor_que_18px: tempo, contraste_por_regiao: porRegiao, texto_abaixo_de_4_5: baixos.slice(0, 40), total_abaixo_de_4_5: baixos.length, sombras_externas: sombras, corpo_do_meio: corpoInfo };
}

async function prints(prefixo) {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const saida = [];
  const relatorio = { prefixo, sem_casca: SEM_CASCA, quando: new Date().toISOString() };
  const foto = async (page, nome, opt) => { const f = path.join(EVID, prefixo + '-' + nome + '.png'); await page.screenshot({ path: f, scale: "css", ...(opt || {}) }); saida.push(f); return f; };
  const logo = (page) => page.evaluate(() => { const s = getComputedStyle(document.querySelector('.e-logo')); return { filter: s.filter.slice(0, 140), animacao: s.animationName, opacidade: s.opacity }; });
  try {
    {
      const { ctx, page, erros } = await abrirPagina(browser, 1440, 900, '', { deviceScaleFactor: 2 });
      /* 1. arquivo aberto */
      await page.evaluate(() => { const a = BC.loja.estado.arquivos.find((a) => /README\.md$/.test(a.caminho) && a.dono === 'equipe') || BC.loja.estado.arquivos.find((a) => /README\.md$/.test(a.caminho)); BC.estacao.fecharTodas(); BC.explorador.abrirArquivo(a.id); });
      await page.waitForTimeout(700);
      await foto(page, 'estacao-arquivo');
      relatorio.auditoria_arquivo = await page.evaluate(auditar);
      relatorio.logo_repouso = await logo(page);
      relatorio.animacoes_em_repouso = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").map((a) => (a.animationName || a.constructor.name) + " em " + ((a.effect && a.effect.target && (a.effect.target.className.baseVal === undefined ? a.effect.target.className : a.effect.target.tagName)) || "?") + (a.effect && a.effect.getTiming().iterations === Infinity ? " (laço)" : "")));
      relatorio.gancho_luz = await page.evaluate(() => {
        const l = document.querySelector(".arv-linha.aberto"), a = document.querySelector(".e-aba"), s = document.querySelector(".st-item");
        const antes = { linha: getComputedStyle(l, "::before").opacity, aba: getComputedStyle(a, "::after").opacity, rodape: getComputedStyle(s).color };
        l.style.setProperty("--luz", "1"); a.style.setProperty("--luz", "0.5"); s.style.setProperty("--luz", "1");
        const aceso = { linha: getComputedStyle(l, "::before").opacity, aba: getComputedStyle(a, "::after").opacity, rodape: getComputedStyle(s).color };
        l.style.removeProperty("--luz"); a.style.removeProperty("--luz"); s.style.removeProperty("--luz");
        return { antes, com_luz: aceso, nota: "gancho para o motor do organismo; valores escritos pelo teste, não por evento" };
      });
      /* 2. Terminais */
      await page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.abrir('terminais'); });
      await page.waitForTimeout(600);
      await foto(page, 'estacao-terminais');
      relatorio.auditoria_terminais = await page.evaluate(auditar);
      /* 3. evento real: editar e salvar o README → aviso "Salvo…" (acende e esfria) */
      await page.evaluate(() => { const a = BC.loja.estado.arquivos.find((a) => /README\.md$/.test(a.caminho) && a.dono === 'equipe') || BC.loja.estado.arquivos.find((a) => /README\.md$/.test(a.caminho)); BC.estacao.fecharTodas(); BC.explorador.abrirArquivo(a.id); });
      await page.waitForTimeout(400);
      await page.evaluate(() => { BC.acoes['ed-modo']({ dataset: { modo: 'editar' } }); });
      await page.waitForTimeout(300);
      const t0 = Date.now();
      await page.evaluate(() => { const t = BC.estacao.abaAtual(); const c = document.getElementById('ed-texto-' + t.ref); c.value += '\nlinha da prova da casca'; BC.editor.salvar(); });
      await page.waitForTimeout(300);
      relatorio.evento_0s3 = { ...(await logo(page)), aviso: await page.evaluate(() => { const t = document.getElementById('e-toast'); return { visivel: !t.hidden, texto: t.textContent.slice(0, 60), borda: getComputedStyle(t).borderLeftColor }; }) };
      await foto(page, 'evento-aceso');
      await foto(page, 'evento-aceso-topo', { clip: { x: 0, y: 0, width: 360, height: 40 }, scale: 'device' });
      await page.waitForTimeout(Math.max(0, 5600 - (Date.now() - t0)));
      relatorio.evento_5s6 = { ...(await logo(page)), aviso_visivel: await page.evaluate(() => !document.getElementById('e-toast').hidden) };
      await page.waitForTimeout(Math.max(0, 9600 - (Date.now() - t0)));
      relatorio.evento_9s6 = { ...(await logo(page)), aviso_visivel: await page.evaluate(() => !document.getElementById('e-toast').hidden) };
      await foto(page, 'evento-esfriou-topo', { clip: { x: 0, y: 0, width: 360, height: 40 }, scale: 'device' });
      /* 4. agente pensando (estado real do simulador; mostrar() redesenha as abas do agente) */
      await page.evaluate(() => { BC.estacao.terminal.ia('cria uma campanha de 12 clientes para a Carla até 30/09'); BC.estacao.terminal.mostrar(); });
      await page.waitForTimeout(700);
      relatorio.pensando = { ...(await logo(page)), abas: await page.evaluate(() => [...document.querySelectorAll('.term-estado')].map((e) => e.className).join(' | ')) };
      await foto(page, 'agente-pensando');
      await foto(page, 'agente-pensando-topo', { clip: { x: 0, y: 0, width: 360, height: 40 }, scale: 'device' });
      await page.waitForTimeout(2600);
      await page.evaluate(() => BC.estacao.terminal.mostrar());
      await page.waitForTimeout(300);
      relatorio.pensando_depois = { ...(await logo(page)), abas: await page.evaluate(() => [...document.querySelectorAll('.term-estado')].map((e) => e.className).join(' | ')) };
      /* 5. paleta */
      await page.evaluate(() => { BC.estacao.abrirPaleta(); const i = document.getElementById('paleta-entrada'); i.value = 'read'; i.dispatchEvent(new Event('input', { bubbles: true })); });
      await page.waitForTimeout(300);
      await foto(page, 'estacao-paleta');
      relatorio.erros_estacao = erros;
      await ctx.close();
    }
    {
      const { ctx, page } = await abrirPagina(browser, 1440, 900, "", { reducedMotion: "reduce" });
      await page.evaluate(() => BC.estacao.aviso("Salvo. A versão anterior ficou guardada."));
      await page.waitForTimeout(400);
      relatorio.movimento_reduzido = await page.evaluate(() => { const lg = getComputedStyle(document.querySelector(".e-logo")), t = getComputedStyle(document.getElementById("e-toast")); return { logo_filtro: lg.filter.slice(0, 90), logo_animacao: lg.animationName, logo_transicao: lg.transitionDuration, aviso_animacao: t.animationName, aviso_borda: t.borderLeftColor }; });
      await ctx.close();
    }
    {
      const { ctx, page, erros } = await abrirPagina(browser, 1280, 720, '#tv');
      await page.waitForTimeout(500);
      await foto(page, 'tv');
      relatorio.erros_tv = erros;
      await ctx.close();
    }
    {
      const { ctx, page, erros } = await abrirPagina(browser, 400, 860, '', { hasTouch: true });
      await foto(page, 'celular');
      await page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.abrir('dia'); });
      await page.waitForTimeout(500);
      await foto(page, 'celular-meu-dia');
      relatorio.celular = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, janela: innerWidth, abas_celular: getComputedStyle(document.getElementById('e-abas-celular')).display, barra_atividades: getComputedStyle(document.getElementById('e-atividades')).display }));
      relatorio.auditoria_celular = await page.evaluate(auditar);
      relatorio.erros_celular = erros;
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  const f = path.join(EVID, prefixo + '-medidas.json');
  fs.writeFileSync(f, JSON.stringify(relatorio, null, 2));
  saida.push(f);
  console.log(saida.join('\n'));
}

async function roteiro(arquivoSaida) {
  const src = fs.readFileSync('/Users/matheussilveirapro/Desktop/babel-coop/docs/testes/roteiro.js', 'utf8');
  /* o roteiro é um arquivo do próprio repositório, escrito como função async (page) => {...}
     (o mesmo texto que o Playwright MCP executa); avaliá-lo aqui é o jeito de rodar o mesmo código */
  const fn = eval('(' + src + ')');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const t0 = Date.now();
    const r = await fn(page);
    r.duracao_s = Math.round((Date.now() - t0) / 1000);
    r.navegador = 'Google Chrome (canal chrome) via playwright ' + require('/Users/matheussilveirapro/Desktop/babel-coop/app/node_modules/playwright/package.json').version + ', contexto novo';
    const txt = JSON.stringify(r, null, 2);
    if (arquivoSaida) fs.writeFileSync(arquivoSaida, txt);
    console.log(txt);
    await ctx.close();
  } finally {
    await browser.close();
  }
}

const [modo, arg] = process.argv.slice(2);
(modo === 'prints' ? prints(arg || 'x') : roteiro(arg)).catch((e) => { console.error('FALHOU:', e); process.exit(1); });
