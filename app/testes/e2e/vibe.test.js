/* babel-coop · e2e do modo Vibe (claro, bege Latte #fff8e7) — ordem do Theus: "dois modo, tech e vibe: o tech é o escuro e o vibe o claro"
   Uma Estação de verdade (Electron escondido, raiz temporária), equipe fundada:
   1. clica Vibe na barra de cima → html[data-tema-estacao="claro"]; abre cada atividade da barra (menos a Máquina) e as vistas
      dos grupos, tira print e confere: fundo do meio e da lateral claros, nenhum elemento grande (> 120 × 120 px) com fundo quase
      preto à vista (varredura por pontos: o fundo que se vê em cada ponto da janela), e o círculo "a sala" do mapa claro
   2. o terminal (xterm) com fundo claro e texto escuro, trocando ao vivo; presença, paleta Ctrl+K, aviso, navegador (moldura)
      e o arquivo nascendo também no claro
   2b. as 12 cores de pessoa no papel (mesmo matiz, ≥ 4.5:1), a bola da trilha feita, o raio aceso e o Quadro (texto e caneta clara)
   3. voltar para Tech restaura o fundo escuro (meio, lateral e xterm)
   Prints: BABEL_TESTE_EVIDENCIAS/vibe (ou .deus/terminal-ao-vivo/evidencias/vibe).
   Rodar: cd app && node --test testes/e2e/vibe.test.js   ·   Portas: HTTP 5466, UDP 41966, site de teste 5467. */
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { abrirEstacao, raizTemporaria, APP } = require('./estacao');

const EVID = process.env.BABEL_TESTE_EVIDENCIAS ? path.join(process.env.BABEL_TESTE_EVIDENCIAS, 'vibe') : path.join(APP, '..', '.deus', 'terminal-ao-vivo', 'evidencias', 'vibe');
const PORTA = 5466, UDP = 41966, SITE = 5467;
/* a barra (estacao.js BARRA) sem a Máquina, e as vistas dos grupos */
const VISTAS = ['dia', 'explorador', 'demandas', 'tarefas', 'chat', 'whatsapp', 'reuniao', 'terminais', 'projetos', 'acervo', 'inteligencia', 'equipe', 'metas', 'mapa', 'loja', 'oficina'];
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/* roda na página: cor computada → [r, g, b, a] em sRGB 0..1 (rgb(), color(srgb …), oklab/oklch); fundo que se vê (compondo as
   camadas até a primeira opaca); luminância e contraste WCAG; varredura de blocos quase pretos e de texto sem contraste */
function medirNaPagina() {
  if (window.__vibe) return;
  const V = window.__vibe = {};
  const num = (x, max) => (x === 'none' ? 0 : /%$/.test(x) ? parseFloat(x) / 100 * max : parseFloat(x));
  const deOklab = (L, a, b) => {
    const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3), m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3), s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
    const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
    return lin.map((c) => { c = Math.min(1, Math.max(0, c)); return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; });
  };
  V.rgba = (s) => {
    s = String(s || '').trim();
    if (!s || s === 'none' || s === 'transparent') return null;
    let m = s.match(/^rgba?\(([^)]+)\)/);
    if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean); return [num(p[0], 255) / 255, num(p[1], 255) / 255, num(p[2], 255) / 255, p.length > 3 ? num(p[3], 1) : 1]; }
    m = s.match(/^color\(srgb ([^)]+)\)/);
    if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean); return [num(p[0], 1), num(p[1], 1), num(p[2], 1), p.length > 3 ? num(p[3], 1) : 1]; }
    m = s.match(/^(oklab|oklch)\(([^)]+)\)/);
    if (m) {
      const p = m[2].split(/[\s/]+/).filter(Boolean), L = num(p[0], 1), al = p.length > 3 ? num(p[3], 1) : 1;
      let a = num(p[1], 0.4), b = num(p[2], 0.4);
      if (m[1] === 'oklch') { const h = num(p[2], 360) * Math.PI / 180; a = num(p[1], 0.4) * Math.cos(h); b = num(p[1], 0.4) * Math.sin(h); }
      return deOklab(L, a, b).concat([al]);
    }
    return null;
  };
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  V.lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  V.cor = (s) => { const c = V.rgba(s); return c ? { a: c[3], l: V.lum(c) } : null; };
  const sobre = (cima, baixo) => [0, 1, 2].map((i) => cima[i] * cima[3] + baixo[i] * (1 - cima[3])).concat([1]);
  V.nome = (el) => (el.id ? '#' + el.id : el.tagName.toLowerCase()) + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : (el.className && el.className.baseVal ? '.' + el.className.baseVal.trim().split(/\s+/).slice(0, 2).join('.') : ''));
  const FORMAS = { circle: 1, rect: 1, ellipse: 1, path: 1, polygon: 1 };
  /* o fundo que se vê: as camadas de baixo para cima até a primeira opaca; el = a camada mais alta com cor de peso (≥ .6) */
  V.fundo = (el) => {
    const camadas = [];
    let dono = null;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const cs = getComputedStyle(e);
      let c = null;
      if (FORMAS[e.tagName.toLowerCase()] && e.ownerSVGElement) { c = V.rgba(cs.fill); if (c) c[3] *= parseFloat(cs.fillOpacity || '1') * parseFloat(cs.opacity || '1'); }
      else if (!e.ownerSVGElement) c = V.rgba(cs.backgroundColor);
      if (c && c[3] > 0.01) { camadas.push(c); if (!dono && c[3] >= 0.6) dono = e; if (c[3] >= 0.99) break; }
    }
    let base = [1, 1, 1, 1];
    for (let i = camadas.length - 1; i >= 0; i--) base = sobre(camadas[i], base);
    const d = dono || document.documentElement;
    return { el: d, rgb: base, l: V.lum(base), cor: dono ? (getComputedStyle(d).backgroundColor !== 'rgba(0, 0, 0, 0)' ? getComputedStyle(d).backgroundColor : getComputedStyle(d).fill) : 'nada', svg: !!(dono && dono.ownerSVGElement) };
  };
  const midia = (el) => /^(IMG|VIDEO|CANVAS|WEBVIEW|IFRAME)$/.test(el.tagName) || el.closest('webview, .navr-lugar, video, canvas, iframe');
  /* blocos quase pretos: um ponto a cada 24 px; o que é mídia desenha os próprios pixels e fica fora */
  V.escuros = () => {
    const achados = new Map();
    for (let y = 6; y < innerHeight; y += 24) for (let x = 6; x < innerWidth; x += 24) {
      const topo = document.elementFromPoint(x, y);
      if (!topo || midia(topo)) continue;
      const f = V.fundo(topo);
      if (f.l >= 0.05) continue;
      const r = f.el.getBoundingClientRect();
      const a = achados.get(f.el) || { el: V.nome(f.el), cor: f.cor, svg: f.svg, w: Math.round(r.width), h: Math.round(r.height), pontos: 0 };
      a.pontos++;
      achados.set(f.el, a);
    }
    return [...achados.values()].sort((a, b) => b.pontos - a.pontos);
  };
  /* texto à vista sem contraste: ≥ 4.5:1 (texto grande, ≥ 24 px ou ≥ 18,66 px em negrito: ≥ 3:1) */
  V.contraste = () => {
    const ruins = [], vistos = new Set();
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const t = n.nodeValue.trim();
      const el = n.parentElement;
      /* texto dentro de SVG é arte (o anúncio, a constelação: o centro da sala tem teste próprio) e o fundo dele é desenhado pelo SVG */
      if (!t || !el || vistos.has(el) || el.closest('script, style, noscript, .xterm, svg, [aria-hidden="true"], [disabled], [hidden]')) continue;
      vistos.add(el);
      const rg = document.createRange(); rg.selectNodeContents(n);
      const r = rg.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) continue;
      const cx = Math.min(innerWidth - 1, Math.max(0, r.left + Math.min(r.width, 40) / 2)), cy = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
      const topo = document.elementFromPoint(cx, cy);
      if (!topo || !(topo === el || el.contains(topo) || topo.contains(el))) continue; /* coberto por outra coisa */
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden') continue;
      let op = 1;
      for (let e = el; e; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity || '1');
      if (op < 0.2) continue; /* o que está saindo de cena */
      const c = V.rgba(el.ownerSVGElement ? cs.fill : cs.color);
      if (!c || c[3] < 0.05) continue; /* texto transparente (degradê recortado) */
      const f = V.fundo(el.ownerSVGElement ? el.parentElement : el);
      c[3] *= op;
      const tx = sobre(c, f.rgb), lt = V.lum(tx), lf = f.l;
      const razao = (Math.max(lt, lf) + 0.05) / (Math.min(lt, lf) + 0.05);
      const px = parseFloat(cs.fontSize), grande = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
      if (razao < (grande ? 3 : 4.5)) ruins.push({ texto: t.slice(0, 40), el: V.nome(el), razao: +razao.toFixed(2), cor: cs.color, fundo: f.cor, px });
    }
    return ruins;
  };
  V.claro = (sel) => { const el = document.querySelector(sel); if (!el) return null; const f = V.fundo(el); return { l: +f.l.toFixed(3), cor: f.cor, el: V.nome(f.el) }; };
}

describe('modo Vibe · claro e legível em todas as telas, sem mudar o Tech', { timeout: 300000 }, () => {
  let E = null, page = null, raiz = null, site = null;
  const erros = [], medidas = { vistas: {} };
  const print = async (nome) => { await page.screenshot({ path: path.join(EVID, nome), timeout: 15000 }); return nome; };
  const medir = () => page.evaluate(medirNaPagina);
  const grandes = (lista) => lista.filter((a) => (a.w > 120 && a.h > 120) || (a.svg && a.w >= 40 && a.h >= 40));

  before(async () => {
    fs.mkdirSync(EVID, { recursive: true });
    raiz = raizTemporaria('vibe');
    fs.mkdirSync(path.join(raiz, 'zdot'), { recursive: true }); /* o zsh do terminal real não escreve histórico no $HOME de ninguém */
    /* um site local mínimo para a moldura do navegador próprio */
    site = http.createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end('<!doctype html><title>Site de teste</title><h1>Site de teste</h1><p>O site é do site; a moldura é do babel-coop.</p>'); });
    await new Promise((r) => site.listen(SITE, '127.0.0.1', r));
    E = await abrirEstacao({ nome: 'vibe', raiz, porta: PORTA, descoberta: UDP, env: { ZDOTDIR: path.join(raiz, 'zdot') } });
    page = E.page;
    page.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon|ERR_|502|Failed to load resource/.test(m.text())) erros.push('console: ' + m.text()); });
    await page.waitForLoadState('domcontentloaded');
    const f = await E.api('/api/fundar', { nome: 'Theus' });
    assert.equal(f.pronto, true, 'fundar: ' + JSON.stringify(f));
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.BC && BC.estacao && BC.estacao.ui && BC.terminalReal && BC.terminalReal.pronto() && BC.terminalReal.sessoes().some((s) => s.aberta), null, { timeout: 30000, polling: 100 });
    await page.evaluate(() => { BC.estacao.alternarTerminal(true); });
    await medir();
  });

  after(async () => {
    medidas.erros = erros;
    try { fs.writeFileSync(path.join(EVID, 'resultado.json'), JSON.stringify(medidas, null, 2)); } catch (e) { /* segue */ }
    if (E) await E.fechar().catch(() => {});
    if (site) site.close();
    try { if (raiz) fs.rmSync(raiz, { recursive: true, force: true }); } catch (e) { /* a pasta temporária some com o sistema */ }
  });

  it('1 · Tech de partida: meio, lateral e xterm escuros', async () => {
    const r = await page.evaluate(() => ({ tema: document.documentElement.getAttribute('data-tema-estacao'), meio: __vibe.claro('#e-conteudo'), lateral: __vibe.claro('#e-lateral'), xterm: __vibe.claro('.tr-sessao:not([hidden]) .xterm-viewport') }));
    medidas.tech0 = r;
    assert.equal(r.tema, null);
    assert.ok(r.meio.l < 0.05 && r.lateral.l < 0.05, 'Tech devia ser escuro: ' + JSON.stringify(r));
    assert.ok(r.xterm && r.xterm.l < 0.05, 'xterm do Tech devia ser escuro: ' + JSON.stringify(r.xterm));
    await print('vibe-00-tech-de-partida.png');
  });

  it('2 · clica Vibe → cada atividade da barra (menos a Máquina) clara, sem bloco quase preto à vista', async () => {
    await page.click('#e-modo [data-modo="claro"]');
    assert.equal(await page.evaluate(() => document.documentElement.getAttribute('data-tema-estacao')), 'claro');
    await esperar(300);
    const falhas = [];
    for (const v of VISTAS) {
      await page.evaluate((id) => { BC.estacao.fecharTodas(); BC.estacao.abrir(id); }, v);
      await esperar(450);
      const r = await page.evaluate(() => ({ meio: __vibe.claro('#e-conteudo'), lateral: __vibe.claro('#e-lateral'), escuros: __vibe.escuros(), contraste: __vibe.contraste() }));
      r.print = await print('vibe-' + String(VISTAS.indexOf(v) + 1).padStart(2, '0') + '-' + v + '.png');
      medidas.vistas[v] = r;
      if (!(r.meio.l > 0.6)) falhas.push(v + ': meio escuro ' + JSON.stringify(r.meio));
      if (!(r.lateral.l > 0.6)) falhas.push(v + ': lateral escura ' + JSON.stringify(r.lateral));
      grandes(r.escuros).forEach((a) => falhas.push(v + ': ' + a.el + ' ' + a.w + '×' + a.h + ' fundo ' + a.cor));
      r.contraste.forEach((c) => falhas.push(v + ': texto "' + c.texto + '" ' + c.el + ' ' + c.razao + ':1 (' + c.cor + ' sobre ' + c.fundo + ')'));
    }
    assert.deepEqual(falhas, []);
  });

  it('3 · mapa da sala: o centro "a sala" claro no Vibe', async () => {
    await page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.abrir('terminais'); });
    await esperar(400);
    const c = await page.evaluate(() => { const el = document.querySelector('.bc-c-centro circle'); if (!el) return null; const r = el.getBoundingClientRect(); return { fill: getComputedStyle(el).fill, l: __vibe.cor(getComputedStyle(el).fill).l, w: r.width, texto: __vibe.cor(getComputedStyle(document.querySelector('.bc-c-centro text')).fill).l }; });
    medidas.salaCentro = c;
    if (c) {
      assert.ok(c.l > 0.6, 'o círculo "a sala" continua escuro: ' + JSON.stringify(c));
      assert.ok((c.l + 0.05) / (c.texto + 0.05) >= 4.5, 'o nome da sala sem contraste: ' + JSON.stringify(c));
    }
  });

  it('4 · terminal no Vibe: xterm claro, texto escuro, e troca ao vivo', async () => {
    await page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.abrir('dia'); BC.terminalReal.face('terminal'); });
    await esperar(400);
    await page.evaluate(() => BC.terminalReal.digitar('assistente', 'echo "vibe: texto padrão, \\033[31mvermelho\\033[0m, \\033[32mverde\\033[0m, \\033[33mamarelo\\033[0m, \\033[34mazul\\033[0m, \\033[35mroxo\\033[0m, \\033[36mciano\\033[0m"\r'));
    await esperar(900);
    const r = await page.evaluate(() => {
      const s = document.querySelector('.tr-sessao:not([hidden])');
      const vp = s.querySelector('.xterm-viewport'), tx = s.querySelector('.tr-xterm'), fr = s.querySelector('.tr-face-terminal');
      const spans = [...s.querySelectorAll('.xterm-rows span')].filter((x) => x.textContent.trim());
      const cores = spans.slice(-12).map((x) => ({ t: x.textContent.slice(0, 20), c: getComputedStyle(x).color, cls: x.className, bg: getComputedStyle(x).backgroundImage.slice(0, 60) }));
      /* o degradê do texto padrão: cada cor dele contra o papel */
      const dg = spans.find((x) => getComputedStyle(x).color === 'rgba(0, 0, 0, 0)' && /gradient/.test(getComputedStyle(x).backgroundImage));
      const papel = __vibe.fundo(vp).l;
      const degradeRazoes = dg ? (getComputedStyle(dg).backgroundImage.match(/rgba?\([^)]+\)/g) || []).map((c) => +((papel + 0.05) / (__vibe.cor(c).l + 0.05)).toFixed(2)) : [];
      return { degradeRazoes, viewport: __vibe.claro('.tr-sessao:not([hidden]) .xterm-viewport'), caixa: __vibe.cor(getComputedStyle(tx).backgroundColor).l, face: __vibe.cor(getComputedStyle(fr).backgroundColor).l, degrade: tx.dataset.degrade, cores, escuros: __vibe.escuros() };
    });
    medidas.terminalVibe = r;
    await print('vibe-20-terminal.png');
    await page.locator('#e-painel').screenshot({ path: path.join(EVID, 'vibe-21-terminal-painel.png') });
    assert.ok(r.viewport.l > 0.6, 'xterm escuro no Vibe: ' + JSON.stringify(r.viewport));
    assert.ok(r.caixa > 0.6 && r.face > 0.6, 'caixa do terminal escura: ' + r.caixa + ' / ' + r.face);
    const letras = r.cores.map((x) => __cor(x.c)).filter((c) => c && c.a > 0.5);
    assert.deepEqual(grandes(r.escuros), []);
    /* texto com cor: contraste ≥ 4.5:1 contra o papel */
    const papel = r.viewport.l;
    const fracos = r.cores.filter((x) => { const c = __cor(x.c); return c && c.a > 0.5 && (papel + 0.05) / (c.l + 0.05) < 4.5; });
    assert.deepEqual(fracos, [], 'cores ANSI sem contraste no claro');
    assert.ok(r.degradeRazoes.length >= 3 && r.degradeRazoes.every((x) => x >= 4.5), 'o degradê do texto sem contraste no claro: ' + JSON.stringify(r.degradeRazoes));
    assert.ok(letras.length > 0 || r.degrade === 'sim', 'nenhum texto lido no xterm');
  });

  it('5 · presença, paleta Ctrl+K, aviso, navegador (moldura) e arquivo nascendo no claro', async () => {
    await page.evaluate(() => { BC.terminalReal.face('presenca'); });
    await esperar(300);
    await page.locator('#e-painel').screenshot({ path: path.join(EVID, 'vibe-22-presenca-painel.png') });
    const pres = await page.evaluate(() => ({ cab: __vibe.claro('.tr-sessao:not([hidden]) .tr-cab'), rodape: __vibe.claro('.tr-sessao:not([hidden]) .tr-rodape'), escuros: __vibe.escuros(), contraste: __vibe.contraste() }));
    medidas.presenca = pres;
    assert.ok(pres.cab.l > 0.5 && pres.rodape.l > 0.5, 'presença escura: ' + JSON.stringify(pres));
    assert.deepEqual(grandes(pres.escuros), []);
    assert.deepEqual(pres.contraste, [], 'texto sem contraste na presença');

    await page.evaluate(() => { BC.estacao.abrirPaleta(); });
    await esperar(300);
    const pal = await page.evaluate(() => ({ escuros: __vibe.escuros(), contraste: __vibe.contraste() }));
    medidas.paleta = pal;
    await print('vibe-23-paleta.png');
    await page.keyboard.press('Escape');
    assert.deepEqual(grandes(pal.escuros), []);
    assert.deepEqual(pal.contraste, [], 'texto sem contraste na paleta');

    await page.evaluate(() => BC.estacao.aviso('Aviso no modo Vibe: legível no claro.'));
    await esperar(250);
    const av = await page.evaluate(() => { const t = document.getElementById('e-toast'); const f = __vibe.fundo(t); const c = __vibe.cor(getComputedStyle(t).color); return { fundo: f.l, texto: c && c.l, cor: getComputedStyle(t).color, bg: f.cor }; });
    medidas.aviso = av;
    await print('vibe-24-aviso.png');
    assert.ok(av.fundo > 0.5, 'aviso escuro: ' + JSON.stringify(av));
    assert.ok((av.fundo + 0.05) / (av.texto + 0.05) >= 4.5, 'aviso sem contraste: ' + JSON.stringify(av));

    /* campanha: o palco com a Tela, os anúncios, o WhatsApp e o calendário */
    const camp = await page.evaluate(() => { BC.estacao.fecharTodas(); const r = BC.campanha.gerar({ nome: 'Vibe de teste', meta: 'mostrar o claro', por: 'theus' }); return r && (r.erro || r.id); });
    await page.waitForFunction(() => (BC.campanha.lista()[0] || {}).estado === 'pronta', null, { timeout: 30000, polling: 250 }).catch(() => {});
    await esperar(800);
    const cp = await page.evaluate(() => ({ estado: (BC.campanha.lista()[0] || {}).estado, escuros: __vibe.escuros(), contraste: __vibe.contraste() }));
    medidas.campanha = Object.assign({ gerar: camp }, cp);
    await print('vibe-27-campanha.png');
    assert.deepEqual(grandes(cp.escuros), []);
    assert.deepEqual(cp.contraste, [], 'texto sem contraste na campanha');

    /* navegador próprio: a moldura (barra, endereço, abas) no claro; o site é do site */
    await page.evaluate((u) => BC.navegador.abrir({ id: 'assistente', nome: 'Assistente' }, u), 'http://127.0.0.1:' + SITE + '/');
    await esperar(1500);
    const nav = await page.evaluate(() => ({ aba: BC.estacao.abaAtual() && BC.estacao.abaAtual().tipo, escuros: __vibe.escuros(), contraste: __vibe.contraste() }));
    medidas.navegador = nav;
    await print('vibe-25-navegador.png');
    assert.deepEqual(grandes(nav.escuros), []);
    assert.deepEqual(nav.contraste, [], 'texto sem contraste na moldura do navegador');

    /* arquivo nascendo: o agente escreve na pasta real e o meio mostra */
    const rel = 'vibe-nota.md';
    fs.writeFileSync(path.join(raiz, 'theus', rel), '# Nota do Vibe\n\nO modo claro também vale para o arquivo que nasce.\n\n- [x] fundo papel\n- [x] texto escuro\n- [ ] print conferido\n');
    await page.evaluate((m) => BC.real.simular(m), { tipo: 'agente-arquivo', dono: 'theus', id: 'assistente', nome: 'Assistente', caminho: rel, absoluto: path.join(raiz, 'theus', rel), acao: 'criado' });
    await page.waitForFunction(() => BC.nascendo && BC.nascendo.docs().some((d) => d.rel === 'vibe-nota.md' && d.concluido), null, { timeout: 15000 }).catch(() => {});
    await esperar(600);
    const nasc = await page.evaluate(() => ({ doc: __vibe.claro('.nasc-doc'), escuros: __vibe.escuros(), contraste: __vibe.contraste() }));
    medidas.nascendo = nasc;
    await print('vibe-26-nascendo.png');
    assert.ok(!nasc.doc || nasc.doc.l > 0.6, 'arquivo nascendo escuro: ' + JSON.stringify(nasc.doc));
    assert.deepEqual(grandes(nasc.escuros), []);
    assert.deepEqual(nasc.contraste, [], 'texto sem contraste no arquivo nascendo');
  });

  it('5b · cor de cada pessoa no papel: mesmo matiz, ≥ 4.5:1; trilha feita; raio aceso; Quadro legível', async () => {
    await page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.abrir('dia'); });
    await esperar(300);
    /* as 12 cores de dados.js num avatar, numa bola de trilha (pendente e feita) e no raio aceso do mapa; o palco é o papel real */
    const r = await page.evaluate(() => {
      const CORES = ['#29ccec', '#5b8cff', '#6fd1c1', '#7fd6a6', '#8670ff', '#9fb4ff', '#c3e36b', '#c7a2ff', '#e0a3ff', '#f2a65a', '#ff7ab8', '#ffcf5c'];
      const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
      const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
      const matiz = (c) => { const [r, g, b] = c.slice(0, 3).map(lin); const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b); return Math.atan2(0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s) * 180 / Math.PI; };
      const giro = (a, b) => { const d = Math.abs(a - b) % 360; return Math.round(d > 180 ? 360 - d : d); };
      const razao = (a, b) => +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2);
      const caixa = document.createElement('div');
      caixa.style.cssText = 'position:fixed;left:0;top:0;display:flex;gap:6px;z-index:99;background:var(--s0);padding:6px';
      caixa.innerHTML = CORES.map((c) => '<span class="avatar" style="--cor:' + c + ';--tam:32px;width:32px;height:32px">AB</span><div class="trilha-no feito"><span class="trilha-bola" style="--cor:' + c + '">CD</span></div>').join('');
      document.getElementById('e-conteudo').appendChild(caixa);
      const papel = __vibe.fundo(caixa).l;
      const pessoas = CORES.map((c, i) => {
        const av = caixa.querySelectorAll('.avatar')[i], bola = caixa.querySelectorAll('.trilha-bola')[i];
        const ca = __vibe.rgba(getComputedStyle(av).color), cb = __vibe.rgba(getComputedStyle(bola).color), fb = __vibe.rgba(getComputedStyle(bola).backgroundColor);
        return { cor: c, avatar: getComputedStyle(av).color, giro: giro(matiz(ca), matiz(hex(c))), contraste: razao(__vibe.lum(ca), papel), feito: razao(__vibe.lum(cb), __vibe.lum(fb)) };
      });
      caixa.remove();
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), linha = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      linha.setAttribute('class', 'bc-c-raio aceso'); svg.appendChild(linha); document.body.appendChild(svg);
      const raio = { aceso: getComputedStyle(linha).stroke, t0: getComputedStyle(document.documentElement).getPropertyValue('--t0').trim() };
      svg.remove();
      return { pessoas, raio };
    });
    medidas.pessoasNoPapel = r;
    const ruins = r.pessoas.filter((p) => p.giro > 12 || p.contraste < 4.5 || p.feito < 4.5);
    assert.deepEqual(ruins, [], 'cor da pessoa girou de matiz ou perdeu contraste no Vibe');
    const t0 = __cor(r.raio.aceso), cheio = await page.evaluate((c) => { const d = document.createElement('i'); d.style.color = c; document.body.appendChild(d); const v = getComputedStyle(d).color; d.remove(); return v; }, r.raio.t0);
    assert.equal(r.raio.aceso, cheio, 'o raio aceso não ficou com a cor cheia no Vibe: ' + JSON.stringify(r.raio));
    assert.ok(t0 && t0.a > 0.9, 'raio aceso transparente: ' + r.raio.aceso);

    /* Quadro de verdade: Explorador → ＋ Quadro → Texto e um traço na primeira cor (a quase branca) */
    await page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.abrir('explorador'); });
    await esperar(350);
    await page.locator('[data-acao="novo-quadro"]:visible').first().click();
    await page.waitForSelector('.q-palco', { timeout: 10000 });
    await esperar(300);
    const palco = await page.locator('.q-palco').first().boundingBox();
    await page.click('.q-ferr[data-q="ferr:texto"]');
    await page.mouse.click(palco.x + 80, palco.y + 70);
    await page.waitForSelector('.q-nota.q-texto', { timeout: 5000 });
    await page.click('.q-cor[data-q="cor:#f2eaff"]');
    await page.click('.q-ferr[data-q="ferr:caneta"]');
    await page.mouse.move(palco.x + 80, palco.y + 150);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++) await page.mouse.move(palco.x + 80 + i * 25, palco.y + 150 + (i % 2) * 12);
    await page.mouse.up();
    await esperar(400);
    const q = await page.evaluate(() => {
      const t = document.querySelector('.q-nota.q-texto .q-nota-texto') || document.querySelector('.q-nota.q-texto');
      const tr = document.querySelector('.q-svg [stroke="#f2eaff"]'), sw = document.querySelector('.q-cor[data-q="cor:#f2eaff"]');
      const fundo = __vibe.fundo(document.querySelector('.q-palco')).l;
      const lt = __vibe.cor(getComputedStyle(t).color).l, ls = tr ? __vibe.cor(getComputedStyle(tr).stroke).l : null, lw = __vibe.cor(getComputedStyle(sw).backgroundColor).l;
      const rz = (x) => (x == null ? null : +((Math.max(x, fundo) + 0.05) / (Math.min(x, fundo) + 0.05)).toFixed(2));
      return { fundo: +fundo.toFixed(3), texto: rz(lt), traco: rz(ls), amostra: rz(lw), escuros: __vibe.escuros() };
    });
    medidas.quadro = q;
    await print('vibe-28-quadro.png');
    assert.ok(q.fundo > 0.6, 'palco do Quadro escuro no Vibe');
    assert.ok(q.texto >= 4.5, 'texto do Quadro sem contraste no Vibe: ' + JSON.stringify(q));
    assert.ok(q.traco != null && q.traco >= 3, 'traço da primeira caneta some no Vibe: ' + JSON.stringify(q));
    assert.ok(q.amostra >= 3, 'amostra da primeira caneta some no Vibe: ' + JSON.stringify(q));
    assert.deepEqual(grandes(q.escuros), []);
  });

  it('6 · volta para Tech → meio, lateral e xterm escuros de novo', async () => {
    await page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.abrir('dia'); BC.terminalReal.face('terminal'); });
    await page.click('#e-modo [data-modo="noite"]');
    await esperar(400);
    const r = await page.evaluate(() => ({ tema: document.documentElement.getAttribute('data-tema-estacao'), meio: __vibe.claro('#e-conteudo'), lateral: __vibe.claro('#e-lateral'), xterm: __vibe.claro('.tr-sessao:not([hidden]) .xterm-viewport') }));
    medidas.techDeNovo = r;
    await print('vibe-30-tech-de-volta.png');
    assert.equal(r.tema, null);
    assert.ok(r.meio.l < 0.05 && r.lateral.l < 0.05, 'Tech não voltou escuro: ' + JSON.stringify(r));
    assert.ok(r.xterm.l < 0.05, 'xterm não voltou escuro: ' + JSON.stringify(r.xterm));
    assert.equal(r.xterm.cor, medidas.tech0.xterm.cor, 'o fundo do xterm no Tech mudou');
  });
});

/* a mesma leitura de cor, do lado do teste */
function __cor(s) {
  const m = String(s || '').match(/^rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return { a: p.length > 3 ? p[3] : 1, l: 0.2126 * lin(p[0] / 255) + 0.7152 * lin(p[1] / 255) + 0.0722 * lin(p[2] / 255) };
}
