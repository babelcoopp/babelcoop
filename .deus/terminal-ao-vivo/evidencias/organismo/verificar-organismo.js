/* Verificação do motor BC.organismo (missão babel-coop/terminal-ao-vivo, aceites A15–A17)
   Abre /coop/organismo-demo.html num Chrome sem janela (Playwright, channel 'chrome', headless), provoca cada estado,
   tira prints, conta sons (pelo motor e por fora, contando osciladores do Web Audio), mede a duração de cada efeito,
   confere o teto de 2 efeitos e de 24 faíscas, o prefers-reduced-motion, a TV sem som e o eco da digitação com efeitos rodando.
   Uso:  node verificar-organismo.js [--url http://localhost:4861] [--servir]
         --servir sobe um servidor estático mínimo que reproduz a rota /coop/ do app (app/interface) na porta 4862.
   Saída: prints *.png e resultado.json nesta pasta.
*/
'use strict';
const path = require('path');
const fs = require('fs');
const http = require('http');
const RAIZ = path.resolve(__dirname, '..', '..', '..', '..');
const { chromium } = require(path.join(RAIZ, 'app', 'node_modules', 'playwright'));
const SAIDA = __dirname;
const INTERFACE = path.join(RAIZ, 'app', 'interface');

const args = process.argv.slice(2);
const iUrl = args.indexOf('--url');
let BASE = iUrl >= 0 && args[iUrl + 1] ? args[iUrl + 1] : 'http://localhost:4861';
const SERVIR = args.includes('--servir');

function servirEstatico(porta) {
  const MIME = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml', json: 'application/json' };
  const s = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (!rel.startsWith('/coop/')) { res.writeHead(404); return res.end('não achei'); }
    const f = path.normalize(path.join(INTERFACE, rel.slice(6)));
    if (!f.startsWith(INTERFACE + path.sep) || !fs.existsSync(f)) { res.writeHead(404); return res.end('não achei'); }
    res.writeHead(200, { 'Content-Type': MIME[f.split('.').pop()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((ok) => s.listen(porta, '127.0.0.1', () => ok(s)));
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
function estat(xs) {
  if (!xs || !xs.length) return null;
  const o = xs.slice().sort((a, b) => a - b), q = (p) => o[Math.min(o.length - 1, Math.floor(p * o.length))];
  return { n: o.length, min: +o[0].toFixed(1), p50: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1), max: +o[o.length - 1].toFixed(1) };
}

/* conta osciladores por fora do motor: prova independente de que o som foi agendado no Web Audio */
const CONTADOR_AUDIO = () => {
  window.__osc = { criados: 0, iniciados: 0, freq: [], ganhoMax: 0 };
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const co = AC.prototype.createOscillator;
  AC.prototype.createOscillator = function () {
    const o = co.call(this); window.__osc.criados++;
    const st = o.start.bind(o);
    o.start = function (t) { window.__osc.iniciados++; window.__osc.freq.push(Math.round(o.frequency.value)); return st(t); };
    return o;
  };
  const lr = AudioParam.prototype.linearRampToValueAtTime;
  AudioParam.prototype.linearRampToValueAtTime = function (v, t) { if (v > window.__osc.ganhoMax) window.__osc.ganhoMax = v; return lr.call(this, v, t); };
};

(async () => {
  let estatico = null;
  if (SERVIR) { estatico = await servirEstatico(4862); BASE = 'http://127.0.0.1:4862'; }
  const URL_DEMO = BASE + '/coop/organismo-demo.html';
  const resultado = { url: URL_DEMO, quando: new Date().toISOString(), servidor: SERVIR ? 'estático mínimo (rota /coop/ do app)' : 'servidor do app', console: [], falhasDeRede: [], erros: [], prints: [], cenarios: {}, checagens: {} };
  const registroTotal = [];
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  resultado.navegador = 'Google Chrome ' + browser.version() + ' (headless, Playwright ' + require(path.join(RAIZ, 'app', 'node_modules', 'playwright', 'package.json')).version + ')';
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(CONTADOR_AUDIO);
  const vigiar = (pg, rotulo) => {
    pg.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') resultado.console.push({ pagina: rotulo, tipo: m.type(), texto: m.text() }); });
    pg.on('pageerror', (e) => resultado.erros.push(rotulo + ': ' + String(e && e.message || e)));
    pg.on('response', (r) => { if (r.status() >= 400) resultado.falhasDeRede.push({ pagina: rotulo, status: r.status(), url: r.url() }); });
    pg.on('requestfailed', (r) => resultado.falhasDeRede.push({ pagina: rotulo, status: 'falhou', url: r.url() }));
  };
  const page = await ctx.newPage();
  vigiar(page, 'estacao');
  const print = async (nome, seletor, clip) => {
    const f = path.join(SAIDA, nome);
    if (clip) await page.screenshot({ path: f, clip }); else if (seletor) await page.locator(seletor).screenshot({ path: f }); else await page.screenshot({ path: f, fullPage: true });
    resultado.prints.push(nome);
  };
  const clicar = (sel) => page.click(sel);
  const ev = (nome) => page.click('[data-ev="' + nome + '"]');
  const estadoSess = () => page.evaluate(() => window.DEMO.sess.estado());
  const esperarEstado = async (e, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ([].concat(e).includes(await estadoSess())) return true; await esperar(30); } return false; };
  /* abre um cenário limpo: o que o motor contar daqui em diante é deste cenário */
  const cenario = async (nome) => { await page.evaluate(() => window.BC.organismo.zerar()); return nome; };
  const fechar = async (nome) => {
    const c = await page.evaluate(() => ({ contagem: window.BC.organismo.contagem(), registro: window.BC.organismo.registro() }));
    c.registro.forEach((r) => registroTotal.push(Object.assign({ cenario: nome }, r)));
    resultado.cenarios[nome] = { sonsTocados: c.contagem.somTocado, sonsSegurados: c.contagem.somBloqueado, efeitos: c.registro.filter((r) => r.tipo !== 'som').map((r) => r.tipo + (r.ok ? ' ' + r.ms + ' ms' : ' · ' + r.motivo)), maxVivos: c.contagem.maxVivos, descartados: c.contagem.descartados, particulas: c.contagem.particulas };
    return c;
  };
  /* roda um comando da demonstração e espera o fim de verdade: primeiro 'rodando', depois o estado final */
  const rodarComando = async (nome, fim = ['terminou', 'falhou']) => { await ev(nome); await esperarEstado('rodando', 4000); return esperarEstado(fim, 8000); };

  await page.goto(URL_DEMO, { waitUntil: 'load' });
  await page.waitForFunction(() => window.DEMO && window.BC && window.BC.organismo);
  resultado.versao = await page.evaluate(() => window.BC.organismo.versao);
  resultado.api = await page.evaluate(() => Object.keys(window.BC.organismo).sort());
  resultado.checagens.somPadraoLigado = await page.evaluate(() => window.BC.organismo.somLigado());
  await esperar(700);
  resultado.checagens.textura = await page.evaluate(() => ({ url: window.BC.organismo.texturaAnel, carregou: !!document.querySelector('.bc-p-textura image'), presencasComTextura: document.querySelectorAll('.bc-presenca.com-textura').length }));

  /* 1 · repouso: nada vivo (R1) */
  resultado.checagens.repousoInicial = await page.evaluate(() => ({ vivos: window.BC.organismo.vivos(), tela: document.querySelector('.bc-org-tela') ? getComputedStyle(document.querySelector('.bc-org-tela')).visibility : 'sem canvas (nenhum efeito pedido ainda)' }));
  await print('00-pagina-inteira.png');
  await print('01-estados.png', '#estados');
  await print('10-painel-shell.png', '#painel');
  const caixa = await page.locator('#painel').boundingBox();
  const clipTopo = { x: caixa.x - 12, y: Math.max(0, caixa.y - 96), width: caixa.width + 24, height: 400 };

  /* 2 · o primeiro gesto destrava o áudio (tique pelo botão) */
  let n = await cenario('gesto-tique');
  await clicar('[data-som="tique"]'); await esperar(150);
  await fechar(n);

  /* 3 · build (14 s, acelerado): Enter acorda · rodando · terminou forte (> 10 s) = pulso + 8 faíscas + tique */
  n = await cenario('build-14s');
  await ev('build');
  await esperarEstado('rodando', 4000);
  await esperar(900);
  await print('11-painel-rodando.png', '#painel');
  await esperarEstado('terminou', 6000);
  await esperar(200);
  await print('12-painel-pulso-em-voo.png', null, clipTopo);
  await esperar(420);
  await print('13-painel-faiscas.png', null, clipTopo);
  await esperar(1000);
  await print('13b-painel-terminou.png', '#painel');
  resultado.checagens.fraseTerminou = await page.evaluate(() => document.querySelector('#cab-estado').textContent);
  await fechar(n);

  /* 4 · npm test (3 s): pulso normal + 4 faíscas + tique */
  await esperar(300);
  n = await cenario('npm-3s');
  await rodarComando('npm');
  await esperar(1600);
  await fechar(n);

  /* 5 · espera do claude: foco fora do terminal = toca; foco no terminal = segura */
  n = await cenario('espera-foco-fora');
  await ev('espera'); await esperar(350);
  await print('14-painel-espera.png', '#painel');
  await fechar(n);
  await ev('reset'); await esperar(200);
  n = await cenario('espera-foco-no-terminal');
  await page.focus('#corpo');
  await page.evaluate(() => window.DEMO.EV.espera());
  await esperar(150);
  await fechar(n);

  /* 6 · Carla entra no meu terminal: arco na cor dela + 'duas' + selo */
  await ev('reset'); await esperar(300);
  n = await cenario('visitante-entra');
  await ev('entra'); await esperar(450);
  await print('15-painel-visitante.png', '#painel');
  resultado.checagens.visitante = await page.evaluate(() => ({ arcos: document.querySelectorAll('#pres-grande .bc-p-visita').length, cor: document.querySelector('#pres-grande .bc-p-visita') ? document.querySelector('#pres-grande .bc-p-visita').style.stroke : null, selo: document.querySelector('#selo').classList.contains('on') }));
  await fechar(n);

  /* 7 · pausa: esfria para --sem-dado */
  n = await cenario('pausa');
  await ev('pausar'); await esperar(800);
  await print('16-painel-pausado.png', '#painel');
  resultado.checagens.pausa = await page.evaluate(() => ({ estado: window.DEMO.pres.estadoAtual(), cor: getComputedStyle(document.querySelector('#pres-grande .bc-presenca')).color, tinta: getComputedStyle(document.querySelector('#pres-grande .bc-p-tinta')).opacity, marcaPausada: document.querySelector('#marca-corpo .bc-marca-b').getAttribute('data-pausa'), haloDoB: getComputedStyle(document.querySelector('#marca-corpo .bc-mb-halo')).opacity }));
  await fechar(n);
  await ev('retomar'); await ev('sai'); await esperar(300);

  /* 8 · erro provável: pulso vermelho + 'erro' */
  n = await cenario('erro-provavel');
  await rodarComando('erro');
  await esperar(260);
  await print('17-painel-falhou.png', null, clipTopo);
  await esperar(700);
  await print('17b-painel-falhou.png', '#painel');
  await fechar(n);

  /* 9 · o shell saiu (term-fim 0): desligado; caiu (term-fim 1): falhou */
  n = await cenario('fim-do-shell');
  await ev('fim0'); await esperar(400);
  await print('18-painel-desligado.png', '#painel');
  await fechar(n);

  /* 9b · aba nova (term-aberto) = acordar + som 'acordar'; tecla recusada (term-recusado) = o terminal respira em vermelho */
  await ev('reset'); await esperar(300);
  n = await cenario('aberto-e-recusado');
  await page.evaluate(() => window.DEMO.sess.aberto());
  await esperar(400);
  await page.evaluate(() => window.DEMO.sess.recusado());
  await esperar(200);
  await print('18b-recusado.png', '#painel');
  await esperar(700);
  await fechar(n);

  /* 10 · instalação longa (75 s): forte + o terminal respira + 'duas' */
  await ev('reset'); await esperar(300);
  n = await cenario('instalacao-75s');
  await rodarComando('longo');
  await esperar(700);
  await print('19-painel-rito-longo.png', null, Object.assign({}, clipTopo, { height: 620 }));
  await esperar(1700);
  await fechar(n);

  /* 11 · teto: 3 efeitos de uma vez (≤ 2 vivos, o terceiro descartado) e 30 faíscas num pedido só (≤ 24) */
  await esperar(1200);
  n = await cenario('teto-tres-efeitos');
  await clicar('[data-fx="tres"]');
  const vivosLogo = await page.evaluate(() => window.BC.organismo.vivos());
  await esperar(90);
  await print('20-teto-tres-efeitos.png', '#painel');
  await esperar(1500);
  const cTres = await fechar(n);
  n = await cenario('teto-trinta-faiscas');
  const faiscasLancadas = await page.evaluate(() => window.DEMO.FX.trinta());
  await esperar(160);
  await print('20b-faiscas-24.png', '#painel');
  await esperar(1300);
  const cTrinta = await fechar(n);
  resultado.checagens.teto = { vivosLogoDepoisDeTresPedidos: vivosLogo, maxVivosTres: cTres.contagem.maxVivos, descartadosTres: cTres.contagem.descartados, faiscasPedidas: 30, faiscasLancadas, maxVivosTrinta: cTrinta.contagem.maxVivos };

  /* 12 · a parede e a constelação da sala */
  await page.locator('#sala').scrollIntoViewIfNeeded();
  n = await cenario('sala');
  await clicar('#bt-sala');
  await esperar(1350);
  await print('21-sala-constelacao.png', '#sala');
  await esperar(1500);
  await print('22-parede.png', '#parede');
  await print('23-sala-depois.png', '#sala');
  await fechar(n);

  /* 13 · eco da digitação com efeitos rodando (R9: efeito nunca atrasa a tecla) */
  await page.locator('#painel').scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    window.__longas = [];
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__longas.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: false }); } catch (e) { window.__longas = null; }
    window.DEMO.atrasos.length = 0; window.DEMO.ateQuadro.length = 0;
    window.__efeitosPedidos = 0;
    window.__fxLaco = setInterval(() => { window.DEMO.FX.tres(); window.DEMO.sess.saida(4000); window.__efeitosPedidos += 3; }, 250);
  });
  await page.focus('#campo');
  const t0 = Date.now();
  await page.keyboard.type('npm run teste:e2e -- --grep organismo && echo pronto!', { delay: 25 });
  const digitou = Date.now() - t0;
  const eco = await page.evaluate(() => { clearInterval(window.__fxLaco); return { atrasos: window.DEMO.atrasos.slice(), ateQuadro: window.DEMO.ateQuadro.slice(), longas: window.__longas, valor: document.querySelector('#campo').value.length, efeitosPedidos: window.__efeitosPedidos, maxVivos: window.BC.organismo.contagem().maxVivos }; });
  resultado.checagens.ecoComEfeitos = { teclas: eco.valor, msDigitando: digitou, efeitosPedidosDuranteADigitacao: eco.efeitosPedidos, maxVivos: eco.maxVivos, teclaAteTratamentoMs: estat(eco.atrasos), teclaAteProximoQuadroMs: estat(eco.ateQuadro), tarefasLongas: eco.longas };

  /* 14 · repouso depois de tudo: nada vivo, canvas escondido (R1) */
  await esperar(2500);
  resultado.checagens.repousoFinal = await page.evaluate(() => ({ vivos: window.BC.organismo.vivos(), tela: getComputedStyle(document.querySelector('.bc-org-tela')).visibility }));
  resultado.somAudio = await page.evaluate(() => window.__osc);

  /* 15 · desligar o som: nada toca, a preferência fica guardada */
  await clicar('#bt-som');
  resultado.checagens.somDesligado = await page.evaluate(() => { window.BC.organismo.zerar(); const o0 = window.__osc.iniciados; window.BC.organismo.som('tique'); window.BC.organismo.som('espera'); return { ligado: window.BC.organismo.somLigado(), guardado: localStorage.getItem('babel-coop:som'), bloqueados: window.BC.organismo.contagem().somBloqueado, osciladoresNovos: window.__osc.iniciados - o0 }; });
  await clicar('#bt-som');
  resultado.checagens.somReligado = await page.evaluate(() => ({ ligado: window.BC.organismo.somLigado(), guardado: localStorage.getItem('babel-coop:som') }));

  /* 16 · TV: som nunca, e a TV não mexe na preferência da Estação */
  const tv = await ctx.newPage();
  vigiar(tv, 'tv');
  await tv.goto(URL_DEMO + '#tv', { waitUntil: 'load' });
  await tv.waitForFunction(() => window.DEMO);
  await tv.click('[data-som="tique"]');
  await tv.click('[data-som="espera"]');
  await tv.click('[data-ev="npm"]');
  await esperar(2600);
  resultado.checagens.tv = await tv.evaluate(() => ({ somLigado: window.BC.organismo.somLigado(), ligarSomTrue: window.BC.organismo.ligarSom(true), contagem: window.BC.organismo.contagem(), osciladoresIniciados: window.__osc.iniciados, preferenciaDaEstacao: localStorage.getItem('babel-coop:som') }));
  await tv.close();

  /* 17 · prefers-reduced-motion: cor sem movimento */
  const rm = await ctx.newPage();
  await rm.emulateMedia({ reducedMotion: 'reduce' });
  vigiar(rm, 'reduzido');
  await rm.goto(URL_DEMO, { waitUntil: 'load' });
  await rm.waitForFunction(() => window.DEMO);
  await rm.click('[data-ev="npm"]');
  const t1 = Date.now(); while (Date.now() - t1 < 6000) { if (await rm.evaluate(() => window.DEMO.sess.estado()) === 'rodando') break; await esperar(30); }
  while (Date.now() - t1 < 9000) { if (await rm.evaluate(() => window.DEMO.sess.estado()) === 'terminou') break; await esperar(30); }
  await esperar(120);
  await rm.locator('#painel').screenshot({ path: path.join(SAIDA, '24-reduzido-terminou.png') }); resultado.prints.push('24-reduzido-terminou.png');
  await rm.click('[data-fx="respirar"]');
  await esperar(100);
  await rm.locator('#painel').screenshot({ path: path.join(SAIDA, '25-reduzido-respirar.png') }); resultado.prints.push('25-reduzido-respirar.png');
  resultado.checagens.reduzido = await rm.evaluate(() => ({ reduzido: window.BC.organismo.reduzido(), contagem: window.BC.organismo.contagem(), registro: window.BC.organismo.registro().filter((r) => r.tipo !== 'som'), lacoAnimado: getComputedStyle(document.querySelector('#estado-rodando .bc-p-laco')).animationName, canvasVisivel: document.querySelector('.bc-org-tela') ? getComputedStyle(document.querySelector('.bc-org-tela')).visibility : 'nunca criado' }));
  await rm.close();

  /* durações medidas de cada efeito, em todos os cenários */
  const porTipo = {};
  registroTotal.filter((r) => r.ok && r.ms != null).forEach((r) => { (porTipo[r.tipo] = porTipo[r.tipo] || []).push(r.ms); });
  resultado.duracoesMs = {};
  Object.keys(porTipo).forEach((k) => { resultado.duracoesMs[k] = estat(porTipo[k]); });
  resultado.registroTotal = registroTotal;

  await browser.close();
  if (estatico) estatico.close();
  fs.writeFileSync(path.join(SAIDA, 'resultado.json'), JSON.stringify(resultado, null, 2));
  console.log(JSON.stringify({ prints: resultado.prints.length, console: resultado.console, falhasDeRede: resultado.falhasDeRede, erros: resultado.erros, duracoesMs: resultado.duracoesMs }, null, 2));
})().catch((e) => { console.error('FALHOU:', e); process.exit(1); });
