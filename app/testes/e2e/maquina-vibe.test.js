/* babel-coop · e2e da Máquina no modo Vibe (claro, bege Latte #fff8e7), sem mudar o Tech.
   Estação Electron escondida, equipe fundada, um projeto com peças montadas pelo conector (coop_maquina_peca via
   BC.real.simular, como o maquina-real.test.js), metade publicada (corpo) e uma nova (tracejada). Prova:
   1. Tech de partida: palco 2D escuro; o 3D com as constantes de antes do Vibe (sem fundo próprio, sem grade, as mesmas luzes,
      base, borda, tracejo, fios e brilho ciano das peças);
   2. clica Vibe: 2D Inteira e Domínio com o palco claro, o nome das peças escuro, texto da Máquina com contraste ≥ 4,5:1
      e nenhum bloco grande quase preto; o 3D troca ao vivo (a mesma cena, o mesmo canvas) para o papel: a média dos pixels
      do canvas é clara e as peças aparecem (pixels mais escuros que o papel);
   3. volta para Tech: o palco, o texto e o 3D iguais ao de partida (material por material: cor, metal, rugosidade, textura, brilho);
   4. Vibe → a vista morre → Tech → vista nova: a nova nasce no Tech de verdade (as cores dos efeitos não ficam presas no Vibe).
   Prints: BABEL_TESTE_EVIDENCIAS/maquina-vibe (ou .deus/terminal-ao-vivo/evidencias/maquina-vibe).
   Rodar: cd app && node --test testes/e2e/maquina-vibe.test.js   ·   Porta 5499, descoberta 41999. */
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { abrirEstacao, APP } = require('./estacao');

const PORTA = 5499, DESCOBERTA = 41999;
const EVID = process.env.BABEL_TESTE_EVIDENCIAS ? path.join(process.env.BABEL_TESTE_EVIDENCIAS, 'maquina-vibe') : path.join(APP, '..', '.deus', 'terminal-ao-vivo', 'evidencias', 'maquina-vibe');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function ate(fn, { ms = 15000, passo = 150, oque = 'condição' } = {}) {
  const fim = Date.now() + ms;
  let ultimo;
  while (Date.now() < fim) {
    ultimo = await fn();
    if (ultimo) return ultimo;
    await esperar(passo);
  }
  throw new Error('tempo esgotado esperando ' + oque + (ultimo !== undefined ? ' (último: ' + JSON.stringify(ultimo) + ')' : ''));
}

/* roda na página: cor computada → sRGB 0..1, luminância e contraste WCAG, o fundo que se vê (camadas até a primeira opaca),
   texto da Máquina sem contraste e blocos grandes quase pretos (a mesma leitura do vibe.test.js, só dentro da Máquina) */
function medirNaPagina() {
  if (window.__mv) return;
  const V = window.__mv = {};
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
  const sobre = (cima, baixo) => [0, 1, 2].map((i) => cima[i] * cima[3] + baixo[i] * (1 - cima[3])).concat([1]);
  V.nome = (el) => (el.id ? '#' + el.id : el.tagName.toLowerCase()) + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
  V.fundo = (el) => {
    const camadas = [];
    let dono = null;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      if (e.ownerSVGElement) continue;
      const c = V.rgba(getComputedStyle(e).backgroundColor);
      if (c && c[3] > 0.01) { camadas.push(c); if (!dono && c[3] >= 0.6) dono = e; if (c[3] >= 0.99) break; }
    }
    let base = [1, 1, 1, 1];
    for (let i = camadas.length - 1; i >= 0; i--) base = sobre(camadas[i], base);
    const d = dono || document.documentElement;
    return { el: d, rgb: base, l: V.lum(base), cor: getComputedStyle(d).backgroundColor };
  };
  V.claro = (sel) => { const el = document.querySelector(sel); if (!el) return null; const f = V.fundo(el); return { l: +f.l.toFixed(3), cor: f.cor, el: V.nome(f.el) }; };
  /* blocos quase pretos à vista dentro da Máquina (um ponto a cada 20 px); o canvas do 3D desenha os próprios pixels e fica fora */
  V.escuros = (sel) => {
    const raiz = document.querySelector(sel), achados = new Map();
    if (!raiz) return [];
    const R = raiz.getBoundingClientRect();
    for (let y = R.top + 4; y < R.bottom; y += 20) for (let x = R.left + 4; x < R.right; x += 20) {
      const topo = document.elementFromPoint(x, y);
      if (!topo || !raiz.contains(topo) || topo.closest('canvas, img, video')) continue;
      const f = V.fundo(topo);
      if (f.l >= 0.05) continue;
      const r = f.el.getBoundingClientRect();
      const a = achados.get(f.el) || { el: V.nome(f.el), cor: f.cor, w: Math.round(r.width), h: Math.round(r.height), pontos: 0 };
      a.pontos++;
      achados.set(f.el, a);
    }
    return [...achados.values()].filter((a) => a.w > 120 && a.h > 120);
  };
  /* texto à vista sem contraste dentro da Máquina: ≥ 4,5:1 (texto grande, ≥ 24 px ou ≥ 18,66 px em negrito: ≥ 3:1).
     Fica fora o que a Máquina apaga de propósito: peça de outro domínio (.fora) e o rito que esfria */
  V.contraste = (sel) => {
    const raiz = document.querySelector(sel), ruins = [], vistos = new Set();
    if (!raiz) return ruins;
    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const t = n.nodeValue.trim(), el = n.parentElement;
      if (!t || !el || vistos.has(el) || el.closest('script, style, svg, [aria-hidden="true"], [disabled], [hidden], .fora')) continue;
      vistos.add(el);
      const rg = document.createRange(); rg.selectNodeContents(n);
      const r = rg.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) continue;
      const cx = Math.min(innerWidth - 1, Math.max(0, r.left + Math.min(r.width, 40) / 2)), cy = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
      const topo = document.elementFromPoint(cx, cy);
      if (!topo || !(topo === el || el.contains(topo) || topo.contains(el))) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden') continue;
      let op = 1;
      for (let e = el; e; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity || '1');
      if (op < 0.2) continue;
      const c = V.rgba(cs.color);
      if (!c || c[3] < 0.05) continue;
      const f = V.fundo(el);
      c[3] *= op;
      const lt = V.lum(sobre(c, f.rgb)), lf = f.l, razao = (Math.max(lt, lf) + 0.05) / (Math.min(lt, lf) + 0.05);
      const px = parseFloat(cs.fontSize), grande = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
      if (razao < (grande ? 3 : 4.5)) ruins.push({ texto: t.slice(0, 40), el: V.nome(el), razao: +razao.toFixed(2), cor: cs.color, fundo: f.cor, px });
    }
    return ruins;
  };
  /* o nome das peças: luminância da cor do texto e o contraste contra o corpo da peça (o Cofre é obsidiana nos dois modos: texto claro) */
  V.nomes = () => [...document.querySelectorAll('.mq2 .mq-peca[data-no]:not(.fora) .mq-nome, .mq2 .mq-dominio-nome')].slice(0, 12).map((el) => {
    const c = V.rgba(getComputedStyle(el).color), f = V.fundo(el), l = V.lum(c);
    return { texto: el.textContent.trim().slice(0, 24), cofre: !!el.closest('.mq-cofre'), cor: getComputedStyle(el).color, l: +l.toFixed(3), razao: +((Math.max(l, f.l) + 0.05) / (Math.min(l, f.l) + 0.05)).toFixed(2) };
  });
  /* os pixels do 3D como se veem: desenha o quadro agora e compõe o canvas WebGL sobre o fundo do palco (o que fica por trás) */
  V.pixels3d = () => {
    const v = BC.maquina.vista3d();
    if (!v || !v.gl) return null;
    const cv = v.canvas, palco = cv.closest('.mq-palco') || cv.parentElement;
    v.gl.render(v.cena, v.cam);
    const c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height;
    const ctx = c2.getContext('2d'), f = V.fundo(palco).rgb;
    ctx.fillStyle = 'rgb(' + f.slice(0, 3).map((x) => Math.round(x * 255)).join(',') + ')'; ctx.fillRect(0, 0, c2.width, c2.height);
    ctx.drawImage(cv, 0, 0);
    const px = ctx.getImageData(0, 0, c2.width, c2.height).data;
    let soma = 0, n = 0, escuros = 0, claros = 0;
    for (let i = 0; i < px.length; i += 16) { const l = (px[i] + px[i + 1] + px[i + 2]) / 3; soma += l; n++; if (l < 170) escuros++; if (l > 200) claros++; }
    /* o próprio canvas: quanto dele é opaco (o fundo desenhado pela cena) */
    const c3 = document.createElement('canvas'); c3.width = cv.width; c3.height = cv.height;
    const ct3 = c3.getContext('2d'); ct3.drawImage(cv, 0, 0);
    const p3 = ct3.getImageData(0, 0, c3.width, c3.height).data;
    let opacos = 0, m3 = 0;
    for (let i = 3; i < p3.length; i += 16) { m3++; if (p3[i] > 250) opacos++; }
    return { media: Math.round(soma / n), escuros: +(escuros / n).toFixed(3), claros: +(claros / n).toFixed(3), opacos: +(opacos / m3).toFixed(3), w: cv.width, h: cv.height, clearAlpha: v.gl.getClearAlpha() };
  };
  /* o estado do 3D, peça por peça e material por material (cor, metal, rugosidade, textura, brilho): o Tech tem de voltar igual */
  V.foto3d = (v) => {
    const hx = (c) => c.getHexString(), L = v.luzes, itens = {};
    v.ordem.forEach((id) => {
      const it = v.itens[id], mats = [];
      it.corpo.traverse((o) => { const m = o.material; if (!o.isMesh || !m || Array.isArray(m)) return; mats.push({ c: m.color ? hx(m.color) : null, me: m.metalness, ro: m.roughness, mapa: m.map ? m.map.uuid : null, em: m.emissive ? hx(m.emissive) : null }); });
      itens[it.p.nome] = { glb: it.glb, banco: !!it.p.banco, base: hx(it.base.material.color), borda: hx(it.bordaBase.material.color), tracejo: hx(it.tracejo.material.color), sombra: !!(it.sombra && it.sombra.visible), mats };
    });
    return { fundo: hx(v.gl.getClearColor(L.hemi.color.clone())), alfa: v.gl.getClearAlpha(), grade: !!(v.grade && v.grade.visible),
      luzes: { ceu: hx(L.hemi.color), terra: hx(L.hemi.groundColor), hemi: L.hemi.intensity, sol: hx(L.sol.color), solI: L.sol.intensity, contra: hx(L.contra.color), contraI: L.contra.intensity },
      fios: v.fiosObj.map((f) => hx(f.linha.material.color)), itens };
  };
}

describe('Máquina no modo Vibe: 2D e 3D claros e legíveis; o Tech igual', { timeout: 240000 }, () => {
  let est, eu, pj, page;
  const medidas = { casos: {} }, erros = [];
  const print = async (nome) => { await page.screenshot({ path: path.join(EVID, nome), timeout: 15000 }).catch(() => {}); return nome; };
  const chamar = async (cid, ferramenta, args) => {
    await page.evaluate((m) => BC.real.simular(m), { tipo: 'mcp-chamada', cid, sessao: 's-rita', ferramenta, args, agente: { id: 'ag-rita', nome: 'Rita', dono: eu.id } });
    const r = await ate(() => page.evaluate((c) => window.__enviados.filter((m) => m.tipo === 'mcp-resposta' && m.cid === c)[0] || null, cid), { ms: 5000, oque: 'mcp-resposta ' + cid });
    assert.equal(r.ok, true, cid + ': ' + r.erro);
    return r;
  };
  const zoom = async (z) => {
    await page.click('.mq2 .mq-zoom [data-z="' + z + '"]');
    await esperar(500);
  };
  const doisD = () => page.evaluate(() => ({ palco: __mv.claro('.mq2 .mq-palco'), nomes: __mv.nomes(), contraste: __mv.contraste('#e-conteudo .mq2'), escuros: __mv.escuros('#e-conteudo .mq2') }));
  const pronto3d = async () => {
    await ate(() => page.evaluate(() => { const m = BC.maquina.medidas3d(); return m && m.pronto && m.renders > 0 && m.emCena === 7 && m.animando === 0 ? m : null; }), { ms: 30000, oque: 'o 3D montar com as 7 peças' });
    /* os GLB chegam depois: espera o número parar de mudar (3 leituras iguais) */
    let antes = -1, iguais = 0;
    await ate(async () => { const n = await page.evaluate(() => BC.maquina.medidas3d().glb.length); iguais = n === antes ? iguais + 1 : 0; antes = n; return iguais >= 2; }, { ms: 15000, passo: 300, oque: 'os GLB do 3D' });
  };
  /* as constantes do 3D no Tech antes do Vibe existir (visual3d.js do último commit): luzes, fundo, base, borda, tracejo, fios, brilho */
  const TECH_ANTES = { fundo: '000000', alfa: 0, grade: false, luzes: { ceu: 'a9bbff', terra: '0a0f1e', hemi: 1.25, sol: 'ffffff', solI: 1.5, contra: '7ba4f0', contraI: 0.55 } };
  const conferirTech = (foto, onde) => {
    assert.deepEqual({ fundo: foto.fundo, alfa: foto.alfa, grade: foto.grade, luzes: foto.luzes }, TECH_ANTES, onde + ': fundo, grade ou luzes do Tech mudaram');
    assert.ok(foto.fios.length > 0 && foto.fios.every((c) => c === '506b94'), onde + ': fios do Tech ' + JSON.stringify(foto.fios));
    Object.entries(foto.itens).forEach(([nome, it]) => {
      assert.deepEqual([it.base, it.borda, it.tracejo, it.sombra], ['161e2d', it.banco ? '2ad5e5' : '506b94', '7ba4f0', false], onde + ': base/borda/tracejo de ' + nome);
      assert.ok(it.mats.length > 0 && it.mats.every((m) => m.em === '2ad5e5'), onde + ': brilho das peças no Tech devia ser o ciano de sempre (' + nome + '): ' + JSON.stringify(it.mats));
    });
  };

  before(async () => {
    fs.mkdirSync(EVID, { recursive: true });
    est = await abrirEstacao({ nome: 'maquina-vibe', porta: PORTA, descoberta: DESCOBERTA });
    page = est.page;
    page.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
    await page.waitForLoadState('load');
    const f = await est.api('/api/fundar', { nome: 'Theus' });
    assert.ok(f.pronto, 'fundou a equipe: ' + JSON.stringify(f));
    eu = f;
    await page.reload();
    await ate(() => page.evaluate(() => !!(window.BC && BC.real && BC.real.bemvindo && BC.real.eu() && BC.real.eu().pronto && BC.loja.eu === BC.real.eu().id && BC.estacao && BC.estacao.ui && BC.coop && BC.maquina)), { ms: 25000, oque: 'a Estação reconhecer o Theus' });
    await page.evaluate(() => {
      window.__enviados = [];
      const original = BC.real.enviar;
      BC.real.enviar = function (m) { window.__enviados.push(JSON.parse(JSON.stringify(m))); return original(m); };
    });
    await page.evaluate(medirNaPagina);
    /* o projeto e as peças, pelo conector: cinco publicadas (corpo) e duas novas (tracejadas) */
    await page.evaluate(() => BC.loja.fazer('novoProjeto', { nome: 'Agenda Vibe' }));
    pj = await page.evaluate(() => BC.loja.estado.projetos[0].id);
    await page.evaluate((id) => { BC.estacao.fecharTodas(); BC.maquina.abrir(id); }, pj);
    await esperar(600);
    await chamar('v-gaveta', 'coop_maquina_peca', { tipo: 'gaveta', nome: 'pacientes', frase: 'guarda os pacientes', campos: ['nome (texto)', 'nascimento (data)', 'telefone (texto)'], chave: 'só o dono' });
    await chamar('v-porta', 'coop_maquina_peca', { tipo: 'porta', nome: 'novo paciente', verbo: 'RECEBE', campos: ['nome', 'nascimento'], para: 'pacientes' });
    await chamar('v-tela', 'coop_maquina_peca', { tipo: 'tela', nome: 'Cadastro', para: 'novo paciente' });
    await chamar('v-robo', 'coop_maquina_peca', { tipo: 'robo', nome: 'boas-vindas', frase: 'quando entra um paciente, manda a mensagem de boas-vindas', quando: 'quando entra', de: 'pacientes' });
    await chamar('v-cofre', 'coop_maquina_peca', { tipo: 'cofre', nome: 'chaves do zap' });
    await chamar('v-ligar', 'coop_maquina_ligar', { de: 'boas-vindas', para: 'chaves do zap' });
    await ate(() => page.evaluate((id) => { const m = BC.maquina.maquinas[id]; return m && m.pecas.length === 5 && m.pecas.every((p) => p.pronta); }, pj), { oque: 'as 5 primeiras peças' });
    await page.click('.mq2 .mq-topo [data-acao="mq-publicar"]');
    await page.fill('#mq-confirma', 'Agenda Vibe');
    await page.click('form[data-form="mq-publicar"] button[type="submit"]');
    await ate(() => page.evaluate((id) => BC.loja.estado.maquinas[id].pecas.every((p) => p.publicada), pj), { oque: 'publicar' });
    await chamar('v-cano', 'coop_maquina_peca', { tipo: 'cano', nome: 'ao vivo' });
    await chamar('v-deposito', 'coop_maquina_peca', { tipo: 'deposito', nome: 'fotos' });
    await chamar('v-ligar-2', 'coop_maquina_ligar', { de: 'pacientes', para: 'ao vivo' });
    await ate(() => page.evaluate((id) => { const m = BC.maquina.maquinas[id]; return m && m.pecas.length === 7 && m.pecas.every((p) => p.pronta) && document.querySelectorAll('.mq2 .mq-peca[data-no]').length >= 1; }, pj), { oque: 'as 7 peças na tela' });
  });

  after(async () => {
    medidas.erros = erros;
    try { fs.writeFileSync(path.join(EVID, 'resultado.json'), JSON.stringify(medidas, null, 2)); } catch (e) { /* segue */ }
    if (est) await est.fechar();
  });

  it('1 · Tech de partida: palco 2D escuro, 3D sem fundo próprio (o palco escuro por trás)', async () => {
    assert.equal(await page.evaluate(() => document.documentElement.getAttribute('data-tema-estacao')), null);
    await zoom('inteira');
    const inteira = await doisD();
    await print('mv-00-tech-inteira.png');
    await zoom('dominio');
    const dominio = await doisD();
    await print('mv-01-tech-dominio.png');
    await zoom('3d');
    await pronto3d();
    await esperar(300);
    const px = await page.evaluate(() => __mv.pixels3d());
    const foto = await page.evaluate(() => __mv.foto3d(BC.maquina.vista3d()));
    await print('mv-02-tech-3d.png');
    medidas.casos.tech0 = { inteira, dominio, px, foto };
    conferirTech(foto, 'Tech de partida');
    assert.ok(inteira.palco.l < 0.05 && dominio.palco.l < 0.05, 'o palco do Tech devia ser escuro: ' + JSON.stringify([inteira.palco, dominio.palco]));
    assert.ok(inteira.nomes.length && inteira.nomes.every((n) => n.l > 0.5), 'nomes claros no Tech: ' + JSON.stringify(inteira.nomes));
    assert.equal(px.clearAlpha, 0, 'no Tech o 3D não pinta fundo: o palco aparece por trás');
    assert.ok(px.media < 60, 'o 3D do Tech é escuro: ' + JSON.stringify(px));
  });

  it('2 · Vibe: 2D Inteira e Domínio claros, nomes escuros, texto com contraste, nenhum bloco quase preto', async () => {
    await zoom('inteira');
    await page.click('#e-modo [data-modo="claro"]');
    assert.equal(await page.evaluate(() => document.documentElement.getAttribute('data-tema-estacao')), 'claro');
    await esperar(500);
    const inteira = await doisD();
    await print('mv-10-vibe-inteira.png');
    await zoom('dominio');
    const dominio = await doisD();
    await print('mv-11-vibe-dominio.png');
    await page.locator('#e-conteudo .mq2 .mq-palco').screenshot({ path: path.join(EVID, 'mv-12-vibe-dominio-palco.png') }).catch(() => {});
    /* a vitrine das 16 peças, na ficha */
    const vitrine = await page.evaluate(() => { const b = document.querySelector('.mq2 .mq-ficha-abas [data-p="vitrine"]'); if (b) b.click(); return !!b; });
    await esperar(400);
    const vit = vitrine ? await doisD() : null;
    if (vitrine) await print('mv-13-vibe-vitrine.png');
    medidas.casos.vibe2d = { inteira, dominio, vitrine: vit };
    const falhas = [];
    [['inteira', inteira], ['dominio', dominio], ['vitrine', vit]].forEach(([nome, r]) => {
      if (!r) return;
      if (!(r.palco.l > 0.6)) falhas.push(nome + ': palco escuro ' + JSON.stringify(r.palco));
      r.nomes.forEach((n) => { if (!((n.cofre || n.l < 0.1) && n.razao >= 4.5)) falhas.push(nome + ': nome "' + n.texto + '" ' + n.cor + ' ' + n.razao + ':1'); });
      r.escuros.forEach((a) => falhas.push(nome + ': bloco escuro ' + a.el + ' ' + a.w + '×' + a.h + ' ' + a.cor));
      r.contraste.forEach((c) => falhas.push(nome + ': texto "' + c.texto + '" ' + c.el + ' ' + c.razao + ':1 (' + c.cor + ' sobre ' + c.fundo + ')'));
    });
    assert.ok(inteira.nomes.length > 0 && dominio.nomes.length >= 5, 'os nomes das peças na tela: ' + JSON.stringify([inteira.nomes.length, dominio.nomes.length]));
    assert.deepEqual(falhas, []);
  });

  it('3 · Vibe no 3D: a mesma cena troca ao vivo para o papel, média clara, peças à vista', async () => {
    await page.click('#e-modo [data-modo="noite"]');
    await esperar(300);
    await zoom('3d');
    await pronto3d();
    await page.evaluate(() => { const v = BC.maquina.vista3d(); window.__cena = { v, cena: v.cena, canvas: v.canvas }; });
    /* troca com o 3D aberto: nada é recriado */
    await page.click('#e-modo [data-modo="claro"]');
    await esperar(600);
    const mesma = await page.evaluate(() => { const v = BC.maquina.vista3d(); return v === __cena.v && v.cena === __cena.cena && v.canvas === __cena.canvas && v.canvas.isConnected; });
    const px = await page.evaluate(() => __mv.pixels3d());
    const rot = await page.evaluate(() => [...document.querySelectorAll('.mq2 .v3c-rotulo')].map((el) => { const c = __mv.rgba(getComputedStyle(el).color), f = __mv.fundo(el), l = __mv.lum(c); return { texto: el.textContent.trim().slice(0, 30), razao: +((Math.max(l, f.l) + 0.05) / (Math.min(l, f.l) + 0.05)).toFixed(2) }; }));
    const legenda = await page.evaluate(() => ({ contraste: __mv.contraste('#e-conteudo .mq2'), escuros: __mv.escuros('#e-conteudo .mq2') }));
    await print('mv-20-vibe-3d.png');
    await page.locator('#e-conteudo .mq2 .mq-palco').screenshot({ path: path.join(EVID, 'mv-21-vibe-3d-palco.png') }).catch(() => {});
    medidas.casos.vibe3d = { mesma, px, rotulos: rot, legenda };
    assert.ok(mesma, 'o 3D foi recriado ao trocar o modo');
    assert.ok(px.media > 200, 'o 3D do Vibe devia ser claro (média dos pixels): ' + JSON.stringify(px));
    assert.ok(px.opacos > 0.95, 'no Vibe a cena pinta o papel: ' + JSON.stringify(px));
    assert.ok(px.escuros > 0.01, 'as peças à vista no papel (pixels mais escuros): ' + JSON.stringify(px));
    assert.deepEqual(rot.filter((r) => r.razao < 4.5), [], 'rótulos do 3D sem contraste');
    assert.deepEqual(legenda.contraste, [], 'texto sem contraste com o 3D aberto');
    assert.deepEqual(legenda.escuros, []);
    /* um efeito de montar no claro (o nascer), só para o print: começa e termina */
    await page.evaluate(() => { const v = BC.maquina.vista3d(); window.__fx = []; v.efeito({ tipo: 'nascer', peca: v.ordem[1] }, (r) => __fx.push(r)); v.efeito({ tipo: 'erro', peca: v.ordem[4], texto: 'a Portaria barrou: senha errada' }, (r) => __fx.push(r)); });
    await esperar(420);
    await page.locator('#e-conteudo .mq2 .mq-palco').screenshot({ path: path.join(EVID, 'mv-22-vibe-3d-efeitos.png') }).catch(() => {});
    const fx = await ate(() => page.evaluate(() => (__fx.length === 2 ? __fx : null)), { ms: 5000, oque: 'os efeitos terminarem' });
    medidas.casos.vibe3d.efeitos = fx;
    assert.ok(fx.every((r) => r.tocou), 'os efeitos tocaram no Vibe: ' + JSON.stringify(fx));
    assert.equal(await page.evaluate(() => BC.maquina.medidas3d().fxObjetos), 0, 'os efeitos limparam a cena');
  });

  it('4 · volta para Tech: palco, nomes e 3D iguais ao de partida', async () => {
    await page.click('#e-modo [data-modo="noite"]');
    await esperar(600);
    await pronto3d();
    const px = await page.evaluate(() => __mv.pixels3d());
    const foto = await page.evaluate(() => __mv.foto3d(BC.maquina.vista3d()));
    await print('mv-30-tech-3d-de-volta.png');
    await zoom('inteira');
    const inteira = await doisD();
    await print('mv-31-tech-inteira-de-volta.png');
    medidas.casos.techDeNovo = { px, inteira, foto };
    const t0 = medidas.casos.tech0;
    assert.equal(await page.evaluate(() => document.documentElement.getAttribute('data-tema-estacao')), null);
    assert.equal(inteira.palco.cor, t0.inteira.palco.cor, 'o palco do Tech mudou');
    assert.deepEqual(inteira.nomes.map((n) => n.cor), t0.inteira.nomes.map((n) => n.cor), 'a cor dos nomes no Tech mudou');
    assert.equal(px.clearAlpha, 0, 'o 3D do Tech voltou a não pintar fundo');
    assert.ok(Math.abs(px.media - t0.px.media) <= 3, 'o 3D do Tech mudou: ' + JSON.stringify([t0.px, px]));
    /* material por material: cor, metal, rugosidade, textura (a mesma do GLB) e brilho voltam ao de partida */
    assert.deepEqual(foto, t0.foto, 'o 3D do Tech não voltou igual ao de partida');
    conferirTech(foto, 'Tech de volta');
  });

  it('5 · Vibe → a vista morre → Tech → vista nova: a nova nasce no Tech de verdade', async () => {
    /* o caminho da troca de projeto: uma vista vive e morre no Vibe, o modo volta ao Tech sem nenhuma vista ouvindo, e só então
       nasce outra. A vista da Máquina fica surda ao modo nesse meio (é como se não existisse) e volta a ouvir no fim */
    const r = await page.evaluate(async () => {
      const A = BC.maquina.vista3d(), dorme = (ms) => new Promise((ok) => setTimeout(ok, ms));
      const modo = (m) => document.querySelector('#e-modo [data-modo="' + m + '"]').click();
      const nova = async () => {
        const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:0;top:0;width:480px;height:320px;z-index:-1'; document.body.appendChild(d);
        const v = BC.visual3d.corpo(d); v.atualizar(A.dados);
        for (let i = 0; i < 100 && !(v.pronto && v.ordem.length === A.ordem.length && v.medidas().glb.length === A.medidas().glb.length); i++) await dorme(100);
        return { v, d };
      };
      A._mo.disconnect();
      modo('claro');
      const x = await nova(), vibeX = x.v.vibe;
      x.v.destruir(); x.d.remove();
      modo('noite');
      const y = await nova(), foto = __mv.foto3d(y.v), vibeY = y.v.vibe;
      y.v.destruir(); y.d.remove();
      A._mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema-estacao', 'data-vista'] }); A._tema();
      return { vibeX, vibeY, foto, tema: document.documentElement.getAttribute('data-tema-estacao') };
    });
    medidas.casos.vistaNovaNoTech = r;
    assert.equal(r.vibeX, true, 'a primeira vista nasceu no Vibe');
    assert.equal(r.vibeY, false, 'a vista nova nasceu no Tech');
    assert.equal(r.tema, null);
    conferirTech(r.foto, 'vista nova no Tech');
    assert.deepEqual(r.foto, medidas.casos.tech0.foto, 'a vista nova no Tech devia ser igual à de partida');
    assert.deepEqual(erros, []);
  });
});
