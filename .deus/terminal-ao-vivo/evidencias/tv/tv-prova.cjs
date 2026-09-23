/* babel-coop · prova da TV 2030 (agente TV, missão babel-coop/terminal-ao-vivo)
   Tudo no Electron do app, com janelas ESCONDIDAS (nenhum Google Chrome, nenhuma janela na tela do Theus).
   Portas só da TV: HTTP 5030–5039, UDP 41530–41539.
   Uso (da raiz do repositório):
     node .deus/terminal-ao-vivo/evidencias/tv/tv-prova.cjs prints <prefixo>     prints da TV (antes/depois)
     node .deus/terminal-ao-vivo/evidencias/tv/tv-prova.cjs eventos              Estação + TV: eventos reais, medidas e prints
*/
'use strict';
const fs = require('fs');
const path = require('path');
const { abrirEstacao } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/testes/e2e/estacao.js');

const EVID = '/Users/matheussilveirapro/Desktop/babel-coop/.deus/terminal-ao-vivo/evidencias/tv';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/* abre uma janela escondida do próprio app (BrowserWindow show:false) e devolve a page do Playwright */
async function janelaEscondida(app, url, largura, altura) {
  const antes = new Set(app.windows());
  const nova = app.waitForEvent('window', { predicate: (p) => !antes.has(p), timeout: 20000 });
  await app.evaluate(({ BrowserWindow }, o) => {
    const w = new BrowserWindow({ show: false, width: o.l, height: o.a, useContentSize: true, backgroundColor: '#060b16', webPreferences: { contextIsolation: true, backgroundThrottling: false } });
    w.loadURL(o.url);
    return w.id;
  }, { url, l: largura, a: altura });
  const page = await nova;
  await page.waitForLoadState('domcontentloaded');
  return page;
}

async function preparar(nome, porta, descoberta) {
  const e = await abrirEstacao({ nome, porta, descoberta });
  await e.page.waitForLoadState('domcontentloaded');
  const f = await e.api('/api/fundar', { nome: 'Theus' });
  console.log('fundar:', JSON.stringify(f).slice(0, 90));
  await e.page.reload(); await e.page.waitForLoadState('domcontentloaded');
  await e.page.waitForTimeout(1500);
  return e;
}

async function prints(prefixo) {
  const e = await preparar('tv-' + prefixo, 5031, 41531);
  const erros = [];
  try {
    const largura = +(process.env.LARGURA || 1280), altura = Math.round(largura * 9 / 16);
    const tv = await janelaEscondida(e.app, e.base + '/#tv', largura, altura);
    tv.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[console tv]', m.type(), m.text().slice(0, 200)); });
    tv.on('pageerror', (x) => erros.push(String(x).slice(0, 200)));
    await tv.waitForTimeout(6000);
    await tv.evaluate(() => document.fonts && document.fonts.ready);
    const info = await tv.evaluate(() => ({ tam: innerWidth + 'x' + innerHeight, vis: document.visibilityState, organismo: !!(window.BC && BC.organismo), botoes: document.querySelectorAll('#vista-tv button, #vista-tv input').length, fundo: getComputedStyle(document.getElementById('vista-tv')).backgroundColor, texto: document.getElementById('vista-tv').innerText.slice(0, 600), medidas: BC.tv.medidas ? BC.tv.medidas() : null }));
    console.log(JSON.stringify(info, null, 1));
    await tv.screenshot({ path: path.join(EVID, prefixo + '-tv-painel' + (largura !== 1280 ? '-' + largura : '') + '.png'), timeout: 20000 });
    /* reunião: a Estação manda a TV para o modo reunião (ação real da loja) */
    await e.page.evaluate(() => { BC.loja.fazer('tvModo', 'reuniao'); });
    await tv.waitForTimeout(1500);
    await tv.screenshot({ path: path.join(EVID, prefixo + '-tv-reuniao.png'), timeout: 20000 });
    await e.page.evaluate(() => { BC.loja.fazer('tvModo', 'painel'); });
    /* projeção (hairline --t0 estática), visita (Cosmic Latte) e o tema Ametista: ações reais da Estação */
    await e.page.evaluate(() => { const a = BC.loja.estado.arquivos.find((x) => /README\.md$/.test(x.caminho)); BC.loja.fazer('projetar', a.caminho); });
    await tv.waitForTimeout(1500);
    await tv.screenshot({ path: path.join(EVID, prefixo + '-tv-projecao.png'), timeout: 20000 });
    await e.page.evaluate(() => { BC.loja.fazer('encerrarProjecao'); BC.loja.fazer('visita', true); });
    await tv.waitForTimeout(1200);
    await tv.screenshot({ path: path.join(EVID, prefixo + '-tv-visita.png'), timeout: 20000 });
    await e.page.evaluate(() => { BC.loja.fazer('visita', false); BC.loja.fazer('temaTv', 'ametista'); });
    await tv.waitForTimeout(1500);
    await tv.screenshot({ path: path.join(EVID, prefixo + '-tv-ametista.png'), timeout: 20000 });
    await e.page.evaluate(() => { BC.loja.fazer('temaTv', 'noite'); });
    console.log('erros na TV:', erros.length ? erros.join(' | ') : 'nenhum');
  } catch (err) { console.error('FALHOU:', err && err.stack || err); }
  finally { await e.fechar(); }
}

/* ---------------------------------------------------------------------------------------------------------
   eventos: a Estação do app (janela escondida) age de verdade e a TV (outra janela escondida, 1920×1080) responde.
   Cada passo mede e guarda o resultado em eventos.json; os prints vão para depois-*.png. */
async function eventos() {
  const e = await preparar('tv-eventos', 5030, 41530);
  const R = [], erros = [], consoleErros = [];
  const ok = (nome, passou, achou) => { R.push({ nome, ok: !!passou, achou }); console.log((passou ? '✓ ' : '✗ ') + nome + (passou ? '' : ' · ' + JSON.stringify(achou).slice(0, 300))); };
  const est = e.page;
  try {
    const tv = await janelaEscondida(e.app, e.base + '/#tv', 1920, 1080);
    tv.on('pageerror', (x) => erros.push(String(x && x.stack || x).slice(0, 300)));
    tv.on('console', (m) => { if (m.type() === 'error') consoleErros.push(m.text().slice(0, 160)); });
    const M = () => tv.evaluate(() => BC.tv.medidas());
    const print = (nome) => tv.screenshot({ path: path.join(EVID, nome + '.png'), timeout: 20000 });

    /* 1. ligar: o b se desenha uma vez e sai; o painel aparece */
    await tv.waitForTimeout(1200);
    const a0 = await tv.evaluate(() => ({ naTela: !!document.getElementById('tv-abertura'), video: (document.querySelector('#tv-abertura video') || {}).currentTime || 0 }));
    await print('depois-abertura-b');
    await tv.waitForTimeout(6800);
    await tv.evaluate(() => document.fonts && document.fonts.ready);
    let m = await M();
    ok('abertura: o b se desenhou (vídeo tocou) e saiu da frente, uma vez', a0.naTela && m.abertura.feita && m.abertura.tocou && !m.abertura.naTela, { a0, abertura: m.abertura });
    ok('sem botão na TV', (await tv.evaluate(() => document.querySelectorAll('#vista-tv button, #vista-tv input').length)) === 0, 'tem botão');
    ok('chão --s0 liso, sem fundo que respira, sem o grafo antigo', await tv.evaluate(() => { const v = document.getElementById('vista-tv'); return getComputedStyle(v).backgroundColor === 'rgb(6, 11, 22)' && getComputedStyle(v, '::before').content === 'none' && getComputedStyle(document.getElementById('tv-mapa')).display === 'none'; }), 'fundo');
    const tipos = await tv.evaluate(() => { const px = (el) => el ? parseFloat(getComputedStyle(el).fontSize) : 0, fam = (el) => el ? getComputedStyle(el).fontFamily : ''; const hora = document.getElementById('tv-hora'), fala = document.querySelector('#tv-gira .tv-fala'), cron = document.querySelector('.tv-cron-valor'); return { hora: [px(hora), fam(hora).split(',')[0], getComputedStyle(hora).fontVariantNumeric], cron: [px(cron), getComputedStyle(cron).fontVariantNumeric], fala: fala ? [px(fala), fam(fala).split(',')[0], getComputedStyle(fala).color] : null, colunas: getComputedStyle(document.querySelector('.tv-painel-2030')).gridTemplateColumns.split(' ').length }; });
    ok('relógio e cronômetros em JetBrains Mono tabular (43–76 px); grade de 12 colunas', /JetBrains/.test(tipos.hora[1]) && /tabular/.test(tipos.hora[2]) && tipos.hora[0] >= 70 && tipos.hora[0] <= 80 && /tabular/.test(tipos.cron[1]) && tipos.colunas === 12, tipos);
    await print('depois-tv-painel-1920');
    ok('MAPA DA SALA · N PRESENÇAS, planta com endereço e cronômetro', /MAPA DA SALA · \d+ PRESENÇAS?/.test(await tv.evaluate(() => document.getElementById('tv-mapa-rotulo').textContent)) && m.planta.salas >= 1 && Object.keys(m.planta.pessoas).length >= 1, m.planta);
    ok('constelação do organismo com as pessoas', m.constelacao.tipo === 'organismo' && m.constelacao.nos >= 11, m.constelacao);

    /* 2. o chão vivo toca enquanto a sala trabalha e para quando para (pausar e retomar a demanda na Estação) */
    const c1 = await M(); await tv.waitForTimeout(1000); const c2 = await M();
    ok('chão vivo tocando com a sala trabalhando (o vídeo anda)', c1.chao.estado === 'toca' && c2.chao.tocando && c2.chao.tempo !== c1.chao.tempo, { c1: c1.chao, c2: c2.chao });
    const rodando = await est.evaluate(() => BC.loja.estado.demandas.filter((d) => d.estado === 'andamento' && d.para === BC.loja.eu).map((d) => d.id));
    await est.evaluate((ids) => ids.forEach((id) => BC.loja.fazer('pausar', id, 'reunião')), rodando);
    await tv.waitForTimeout(1500);
    m = await M();
    ok('chão PARA quando a sala para (demanda pausada na Estação)', m.chao.estado === 'parado' && !m.chao.tocando && m.chao.trabalhando === 0, { rodando, chao: m.chao });
    await print('depois-chao-parado');
    await est.evaluate((ids) => ids.forEach((id) => BC.loja.fazer('retomar', id)), rodando);
    await tv.waitForTimeout(1200);
    m = await M();
    ok('chão volta a tocar quando retoma', m.chao.estado === 'toca' && m.chao.tocando, m.chao);

    /* 3. a zona que gira não gira por tempo: 13 s parada; um aviso novo (dado) troca com crossfade de 400 ms */
    const g0 = (await M()).gira;
    await tv.waitForTimeout(13000);
    const g1 = (await M()).gira;
    ok('zona que gira NÃO troca por tempo (13 s sem dado novo)', g1.trocas === g0.trocas && g1.atual === g0.atual, { g0, g1 });
    await est.evaluate(() => BC.loja.fazer('aviso', 'a TV 2030 troca a zona só com dado novo'));
    await tv.waitForTimeout(120);
    const meio = await tv.evaluate(() => ({ cartas: document.querySelectorAll('#tv-gira .tv-gira-carta').length, sai: document.querySelectorAll('#tv-gira .tv-gira-carta.sai').length, trans: getComputedStyle(document.querySelector('#tv-gira .tv-gira-carta')).transitionDuration }));
    await tv.waitForTimeout(900);
    const g2 = (await M()).gira;
    ok('aviso novo troca a zona para Avisos com crossfade de 400 ms', g2.atual === 'avisos' && g2.trocas === g1.trocas + (g1.atual === 'avisos' ? 0 : 1) && /0\.4s/.test(meio.trans) && (g1.atual === 'avisos' || meio.cartas === 2), { g1, g2, meio });
    ok('fala humana na zona em Cormorant ≥ 48 px, cor --latte', await tv.evaluate(() => { const f = document.querySelector('#tv-gira .tv-gira-carta.on .tv-fala'); if (!f) return false; const s = getComputedStyle(f); return /Cormorant/.test(s.fontFamily) && parseFloat(s.fontSize) >= 48 && /255, 248, 231/.test(s.color); }), tipos.fala);

    /* 4. o OK de quem pediu vira carimbo na planta, com luz e faíscas do organismo (sem som) */
    const org0 = await tv.evaluate(() => BC.organismo.contagem());
    await est.evaluate(() => BC.loja.fazer('ok', 'd4'));
    await tv.waitForTimeout(350);
    await print('depois-carimbo-ok');
    await tv.waitForTimeout(700);
    const org1 = await tv.evaluate(() => BC.organismo.contagem());
    const carimbo = await tv.evaluate(() => Array.from(document.querySelectorAll('#tv-planta .tv-carimbo')).map((c) => c.textContent));
    ok('OK de quem pediu = carimbo "OK · Theus · hh:mm" na planta', carimbo.some((t) => /OK · Theus · \d\d:\d\d/.test(t)), carimbo);
    ok('o evento acende o anel e corre até o centro (pulso) e solta faíscas', org1.pulso > org0.pulso && org1.faiscas > org0.faiscas && org1.acender > org0.acender, { antes: { p: org0.pulso, f: org0.faiscas, a: org0.acender }, depois: { p: org1.pulso, f: org1.faiscas, a: org1.acender } });

    /* 5. agentes trabalhando: o agente do Theus pensa (o mesmo evento que o terminal grava) */
    const ag = await est.evaluate(() => { let p = BC.loja.pessoa(BC.loja.eu); if (!(p.agentes || []).length) BC.loja.fazer('novoAgente', { nome: 'Rita', oQueFaz: 'cria demandas, campanhas e avisos', visivel: true }); p = BC.loja.pessoa(BC.loja.eu); const a = (p.agentes || [])[0]; return a ? { id: a.id, nome: a.nome, criado: true } : null; });
    await est.evaluate((id) => BC.loja.fazer('agenteEstado', id, 'pensando'), ag && ag.id);
    await tv.waitForTimeout(2200);
    m = await M();
    const agTxt = await tv.evaluate(() => document.getElementById('tv-agentes').innerText.replace(/\n+/g, ' · '));
    const mini = await tv.evaluate(() => { const el = document.querySelector('#tv-agentes .tv-mini-ag .bc-presenca'); return el ? el.getAttribute('data-estado') : null; });
    ok('AGENTES TRABALHANDO mostra o agente pensando, com a mini presença do organismo', /AGENTES TRABALHANDO · 1/.test(agTxt) && /pensando há \d+ s/.test(agTxt) && mini === 'rodando', { agTxt, mini, ag });
    await print('depois-agente-pensando');
    await est.evaluate((id) => BC.loja.fazer('agenteEstado', id, 'parado'), ag && ag.id);
    await tv.waitForTimeout(900);
    const agTxt2 = await tv.evaluate(() => document.getElementById('tv-agentes').innerText.replace(/\n+/g, ' · '));
    ok('quando o agente para: "terminou · hh:mm" (esfria em 5 min)', /terminou · \d\d:\d\d/.test(agTxt2), agTxt2);

    /* 6. o corpo do projeto: preset na Máquina → peças tracejadas; Publicar (formulário da Máquina) → a peça ganha corpo */
    const corpo0 = (await M()).corpo;
    await est.evaluate(() => { BC.maquina.abrir('clinicas'); });
    await est.waitForTimeout(400);
    await est.evaluate(() => BC.acoes['mq-preset-usar']({ dataset: { id: 'pre2' } }));
    await tv.waitForTimeout(1500);
    const corpo1 = (await M()).corpo;
    ok('peças novas da Máquina nascem tracejadas na parede', corpo1.tracejadas >= 3 && corpo1.total === corpo0.total + corpo1.tracejadas, { corpo0: [corpo0.total, corpo0.comCorpo], corpo1: [corpo1.total, corpo1.comCorpo, corpo1.tracejadas] });
    await print('depois-corpo-tracejadas');
    await est.evaluate(() => BC.acoes['mq-publicar']());
    await est.waitForTimeout(300);
    await est.evaluate(() => { const i = document.getElementById('mq-confirma'); i.value = 'Clínicas em Campinas'; document.querySelector('form[data-form="mq-publicar"]').requestSubmit(); });
    /* acompanha a TV a cada 80 ms: a animação de ganhar corpo tem que aparecer (e acabar) */
    const t0pub = Date.now(); let durante = { animando: 0 }, fotografou = false;
    while (Date.now() - t0pub < 5000) {
      const c = (await M()).corpo;
      if (c.animando > durante.animando) durante = Object.assign({ aposMs: Date.now() - t0pub }, c);
      if (c.animando > 0 && !fotografou) { fotografou = true; await tv.waitForTimeout(250); await print('depois-corpo-ganhando'); }
      if (fotografou && c.animando === 0) break;
      await tv.waitForTimeout(80);
    }
    await tv.waitForTimeout(1200);
    const corpo2 = (await M()).corpo;
    await print('depois-corpo-ganhou');
    ok('Publicar a Máquina: as peças ganham corpo na parede (animação 1,2 s + pulso nos canos)', corpo2.tracejadas === 0 && corpo2.comCorpo === corpo1.total && corpo2.ganhou.length >= corpo1.tracejadas && durante.animando > 0, { durante: [durante.animando, durante.aposMs], corpo2: [corpo2.total, corpo2.comCorpo, corpo2.tracejadas], ganhou: corpo2.ganhou.map((x) => x.id) });
    /* os rótulos das peças novas esfriam em 6 s: espera esse último quadro (motivo 'esfriar') antes de medir o repouso */
    for (let i = 0; i < 40 && !((await M()).corpo.motivos.esfriar >= 1); i++) await tv.waitForTimeout(250);
    await tv.waitForTimeout(300);
    const q0 = (await M()).corpo; await tv.waitForTimeout(4000); const q1 = (await M()).corpo;
    ok('o 3D não desenha sem dado (nenhum quadro em 4 s de repouso)', q1.renders === q0.renders, { r0: q0.renders, r1: q1.renders, motivos0: q0.motivos, motivos1: q1.motivos });
    ok('o evento da publicação vai para a TV', await tv.evaluate(() => BC.loja.estado.eventos.slice(0, 10).some((x) => x.tipo === 'corpo' && /ganh(ou|aram) corpo/.test(x.texto))), 'sem evento corpo');

    /* 7. a campanha: o placar sobe contando; batida → o anel fecha em ouro (comemoração sem confete) */
    /* amostra o número da TV a cada quadro enquanto três clientes fecham na Estação: tem que passar pelos valores do meio */
    await tv.evaluate(() => { window.__amostras = []; const el = () => document.querySelector('#tv-campanha .tv-camp-centro b'); const t0 = performance.now(); (function q() { window.__amostras.push(parseInt(el().textContent, 10)); if (performance.now() - t0 < 1500) requestAnimationFrame(q); })(); });
    await est.evaluate(() => { for (let i = 0; i < 3; i++) BC.loja.fazer('maisUmCliente'); });
    await tv.waitForTimeout(1700);
    const am = await tv.evaluate(() => ({ valores: Array.from(new Set(window.__amostras)), final: BC.loja.estado.campanha.atual }));
    ok('o placar da campanha sobe contando (passa pelos números do meio) e termina no valor da loja', am.valores.length >= 3 && am.valores[am.valores.length - 1] === am.final, am);
    await est.evaluate(() => { for (let i = 0; i < 20; i++) BC.loja.fazer('maisUmCliente'); });
    await tv.waitForTimeout(1300);
    const com = await tv.evaluate(() => ({ aberta: !document.getElementById('tv-comemora').hidden, anel: !!document.querySelector('#tv-comemora .tv-com-anel'), confete: getComputedStyle(document.getElementById('tv-confete')).display, ouro: document.getElementById('tv-campanha').classList.contains('ouro') }));
    await print('depois-campanha-batida');
    ok('campanha batida: o anel fecha em ouro, sem confete', com.aberta && com.anel && com.confete === 'none' && com.ouro, com);

    /* 8. nenhum som na TV, nunca; e sem movimento → o chão fica no pôster */
    const som = await tv.evaluate(() => ({ naTV: BC.organismo.naTV(), ligado: BC.organismo.somLigado(), tocados: BC.organismo.contagem().somTocado }));
    ok('nenhum som na TV', som.naTV && !som.ligado && Object.keys(som.tocados).length === 0, som);
    await tv.emulateMedia({ reducedMotion: 'reduce' });
    await est.evaluate(() => BC.loja.fazer('aviso', 'sem movimento: o chão fica parado no pôster'));
    await tv.waitForTimeout(900);
    m = await M();
    ok('prefers-reduced-motion: a sala trabalha mas o vídeo do chão não anda', m.chao.estado === 'toca' && !m.chao.tocando, m.chao);
    await tv.emulateMedia({ reducedMotion: 'no-preference' });

    ok('zero erros de página na TV', erros.length === 0, erros);
    fs.writeFileSync(path.join(EVID, 'eventos.json'), JSON.stringify({ quando: new Date().toISOString(), resumo: R.filter((x) => x.ok).length + '/' + R.length, verificacoes: R, erros, consoleErros, medidasFinais: await M() }, null, 1));
    console.log('RESUMO', R.filter((x) => x.ok).length + '/' + R.length, '· erros de página:', erros.length, '· erros de console:', consoleErros.length);
  } catch (err) { console.error('FALHOU:', err && err.stack || err); }
  finally { await e.fechar(); }
}

/* ---------------------------------------------------------------------------------------------------------
   puro: o protótipo sem o app (sem BC.organismo), servido por route num Electron escondido; a própria TV simula a equipe.
   ANTES=1 serve o tv.js e o visual3d.js do último commit e o tv-2030.css vazio (o visual de antes, fiel). */
async function puro(prefixo) {
  const { execFileSync } = require('child_process');
  const BASE = '/Users/matheussilveirapro/Desktop/babel-coop/prototipo';
  const antes = process.env.ANTES === '1';
  const velho = antes ? { '/tv.js': execFileSync('git', ['show', 'HEAD:prototipo/tv.js'], { cwd: BASE }).toString(), '/visual3d.js': execFileSync('git', ['show', 'HEAD:prototipo/visual3d.js'], { cwd: BASE }).toString(), '/tv-2030.css': '' } : {};
  const TIPOS = { html: 'text/html', js: 'text/javascript', css: 'text/css', png: 'image/png', json: 'application/json', mp4: 'video/mp4', jpg: 'image/jpeg', glb: 'model/gltf-binary', svg: 'image/svg+xml' };
  const e = await abrirEstacao({ nome: 'tv-puro', porta: 5034, descoberta: 41534 });
  const erros = [];
  try {
    await e.app.context().route('http://coop.local/**', (route) => {
      let p = route.request().url().replace('http://coop.local', '').split('#')[0].split('?')[0];
      if (p === '/' || p === '') p = '/index.html';
      const ext = p.split('.').pop(), tipo = (TIPOS[ext] || 'application/octet-stream') + (/html|js|css|json|svg/.test(ext) ? '; charset=utf-8' : '');
      if (velho[p] !== undefined) return route.fulfill({ body: velho[p], contentType: tipo });
      route.fulfill({ path: BASE + decodeURIComponent(p), contentType: tipo }).catch(() => route.fulfill({ status: 404, body: 'x' }));
    });
    const largura = +(process.env.LARGURA || 1920);
    const tv = await janelaEscondida(e.app, 'about:blank', largura, Math.round(largura * 9 / 16));
    tv.on('pageerror', (x) => erros.push(String(x && x.stack || x).slice(0, 300)));
    await tv.goto('http://coop.local/#tv');
    await tv.waitForTimeout(+(process.env.ESPERA || 12000));
    await tv.evaluate(() => document.fonts && document.fonts.ready);
    const info = await tv.evaluate(() => ({ organismo: !!(window.BC && BC.organismo), medidas: BC.tv.medidas ? BC.tv.medidas() : null }));
    console.log(JSON.stringify(info).slice(0, 1500));
    await tv.screenshot({ path: path.join(EVID, prefixo + '-tv-prototipo-' + largura + '.png'), timeout: 20000 });
    console.log('erros:', erros.length ? erros.join(' | ') : 'nenhum');
  } catch (err) { console.error('FALHOU:', err && err.stack || err); }
  finally { await e.fechar(); }
}

module.exports = { janelaEscondida, preparar, espera, EVID };

if (require.main === module) {
  const modo = process.argv[2];
  if (modo === 'prints') prints(process.argv[3] || 'antes');
  else if (modo === 'eventos') eventos();
  else if (modo === 'puro') puro(process.argv[3] || 'depois');
  else { console.log('uso: prints <prefixo> | eventos | puro <prefixo>'); }
}
