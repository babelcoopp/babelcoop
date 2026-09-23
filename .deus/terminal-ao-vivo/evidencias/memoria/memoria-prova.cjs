/* babel-coop · prova da MEMÓRIA COM NOME (missão babel-coop/terminal-ao-vivo, papel MEMÓRIA · PLANO §1 prop. 3, §3 F)
   Tudo no Electron do próprio app, janela escondida (BABEL_COOP_OCULTO); nenhum Google Chrome.
   Uso (de dentro de app/, para achar o playwright):
     node <este>.cjs prints <prefixo>      Estação real (equipe fundada): Acervo "reembolso", Inteligência, presença; prints + medidas
     node <este>.cjs evento <prefixo>      cliques de verdade: usar um aprendizado de outra pessoa → +1, luz de 6 s para o autor, +2, agente nasce sabendo
     node <este>.cjs roteiro <saida.json>  docs/testes/roteiro.js inteiro numa página do Electron (route em http://coop.local → prototipo/)
   Portas só deste papel: HTTP 5062–5069 (5060 e 5061 são portas "inseguras" para o Chromium e o fetch do Node: SIP), UDP 41560–41569. */
'use strict';
const fs = require('fs');
const path = require('path');
const { raizTemporaria, APP } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/testes/e2e/estacao.js');
const { _electron } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/node_modules/playwright');
/* como app/testes/e2e/estacao.js, com espera maior pela janela (a máquina roda vários Electrons ao mesmo tempo) e fechamento garantido */
const abertos = [];
async function abrirEstacao({ nome = 'a', raiz = raizTemporaria(nome), porta, descoberta, env = {} }) {
  const app = await _electron.launch({ args: [APP], cwd: APP, timeout: 120000,
    env: Object.assign({}, process.env, { BABEL_COOP_RAIZ: raiz, BABEL_COOP_PORTA: String(porta), BABEL_COOP_DESCOBERTA: String(descoberta), BABEL_COOP_OCULTO: '1' }, env) });
  abertos.push(app);
  const page = await app.firstWindow({ timeout: 120000 });
  const base = 'http://localhost:' + porta;
  const api = async (caminho, corpo) => { const r = await fetch(base + caminho, corpo ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) } : undefined); return r.json(); };
  return { app, page, raiz, porta, base, api, fechar: async () => { try { await app.close(); } catch (e) { try { app.process().kill(); } catch (x) { /* já saiu */ } } } };
}
async function fecharTudo() { for (const a of abertos) { try { await a.close(); } catch (e) { try { a.process().kill(); } catch (x) { /* já saiu */ } } } }

const EVID = '/Users/matheussilveirapro/Desktop/babel-coop/.deus/terminal-ao-vivo/evidencias/memoria';
const ROTEIRO = process.env.ROTEIRO || '/Users/matheussilveirapro/Desktop/babel-coop/docs/testes/roteiro.js';
const [modo, arg] = process.argv.slice(2);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const T0 = Date.now();
const log = (...a) => console.error('[' + ((Date.now() - T0) / 1000).toFixed(1) + 's]', ...a);

async function estacaoFundada(porta, udp, nome) {
  const raiz = raizTemporaria(nome || 'memoria');
  fs.mkdirSync(path.join(raiz, 'zdot'), { recursive: true });
  const E = await abrirEstacao({ nome: nome || 'memoria', raiz, porta, descoberta: udp, env: { ZDOTDIR: path.join(raiz, 'zdot') } });
  log('electron aberto');
  const erros = [];
  E.page.on('pageerror', (e) => erros.push(String(e && e.message || e).slice(0, 240)));
  let f = null;
  for (let i = 0; i < 60 && !f; i++) { try { f = await E.api('/api/fundar', { nome: 'Theus' }); } catch (e) { await espera(500); } }
  log('fundou', f && f.pronto);
  await E.page.reload();
  log('recarregou');
  await E.page.waitForFunction(() => window.BC && BC.estacao && document.getElementById('e-status') && document.getElementById('e-status').children.length, null, { timeout: 25000 });
  log('estacao pronta');
  await espera(1500);
  return Object.assign(E, { erros, fundou: f });
}

async function buscarNoAcervo(page, termo) {
  log('acervo:', termo);
  await page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.abrir('acervo'); });
  await espera(300);
  await page.fill('#busca-acervo', termo);
  await espera(600);
}

async function prints(prefixo) {
  const E = await estacaoFundada(5062, 41562, 'memoria-prints');
  const { page } = E;
  const out = (n) => path.join(EVID, prefixo + '-' + n + '.png');
  const m = { quando: new Date().toISOString(), fundou: E.fundou && E.fundou.id };
  try {
    m.eu = await page.evaluate(() => BC.loja.eu);
    m.temMemoria = await page.evaluate(() => !!(window.BC && BC.memoria));
    m.temOrganismo = await page.evaluate(() => !!(window.BC && BC.organismo));
    await buscarNoAcervo(page, 'reembolso');
    await page.screenshot({ path: out('acervo-reembolso') });
    m.acervoReembolso = await page.evaluate(() => Array.from(document.querySelectorAll('.resultado')).slice(0, 6).map((r) => r.innerText.replace(/\s+/g, ' ').slice(0, 200)));
    await buscarNoAcervo(page, 'sessão expirando');
    await page.screenshot({ path: out('acervo-sessao') });
    m.acervoSessao = await page.evaluate(() => Array.from(document.querySelectorAll('.resultado')).slice(0, 4).map((r) => r.innerText.replace(/\s+/g, ' ').slice(0, 200)));
    log('inteligencia');
    await page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.ui.secaoInt = 'aprendizados'; BC.estacao.abrir('inteligencia'); });
    await espera(500);
    await page.screenshot({ path: out('inteligencia') });
    m.aprendizados = await page.evaluate(() => Array.from(document.querySelectorAll('#e-conteudo .item')).slice(0, 5).map((r) => r.innerText.replace(/\s+/g, ' ').slice(0, 200)));
    /* a presença (o terminal do protótipo) consulta o acervo */
    await page.evaluate(() => { BC.estacao.alternarTerminal && BC.estacao.alternarTerminal(true); });
    await espera(300);
    await page.evaluate(() => { const i = document.getElementById('term-entrada'); if (i) { i.value = 'me ajuda com o chamado de login que não entra'; i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); } });
    await espera(900);
    const painel = await page.locator('#e-painel').boundingBox().catch(() => null);
    if (painel) await page.screenshot({ path: out('presenca-consulta'), clip: painel });
    m.presenca = await page.evaluate(() => { const s = document.querySelector('#e-painel .term-saida'); return s ? s.innerText.split('\n').slice(-10) : null; });
    m.erros = E.erros.slice();
  } finally {
    fs.writeFileSync(path.join(EVID, prefixo + '-medidas.json'), JSON.stringify(m, null, 2));
    await E.fechar();
  }
  console.log(JSON.stringify(m, null, 2).slice(0, 5000));
}

/* ---------- evento real: a memória tem nome, o uso soma, o autor vê a luz ---------- */
async function evento(prefixo) {
  const E = await estacaoFundada(5063, 41563, 'memoria-evento');
  const { page } = E;
  const out = (n) => path.join(EVID, prefixo + '-' + n + '.png');
  const m = { quando: new Date().toISOString() };
  const verComo = (id) => page.evaluate((id) => { BC.loja.verComo(id); BC.estacao.render(); }, id);
  try {
    m.eu = await page.evaluate(() => BC.loja.eu);
    m.api = await page.evaluate(() => Object.keys(BC.memoria || {}).sort());
    m.temOrganismo = await page.evaluate(() => !!(window.BC && BC.organismo));
    m.temPlacar = await page.evaluate(() => !!(window.BC && BC.placar));

    /* 1. a pessoa (Theus) procura "sessão expirando" e clica em Usar no aprendizado do Felipe */
    await buscarNoAcervo(page, 'sessão expirando');
    const alvo = await page.evaluate(() => { const b = document.querySelector('.resultado[data-autor="felipe"] [data-acao="mem-usar"]'); return b ? { doc: b.dataset.doc, antes: BC.memoria.usos(b.dataset.doc) } : null; });
    m.alvo = alvo;
    await page.screenshot({ path: out('1-acervo-antes-de-usar') });
    await page.click('.resultado[data-autor="felipe"] [data-acao="mem-usar"]');
    await espera(500);
    m.depoisDeUsar = await page.evaluate((doc) => ({ usos: BC.memoria.usos(doc), citacao: (document.querySelector('.resultado[data-doc="' + doc + '"] .mem-cita') || {}).textContent || null,
      luzesFelipe: BC.memoria.luzesPara('felipe').length, luzesTheusVe: document.querySelectorAll('.mem-luz').length }), alvo.doc);
    await page.screenshot({ path: out('2-acervo-depois-de-usar') });
    /* 2. clicar de novo na mesma hora não infla (uma vez por pessoa por hora) */
    await page.click('.resultado[data-autor="felipe"] [data-acao="mem-usar"]');
    await espera(300);
    m.repetido = await page.evaluate((doc) => BC.memoria.usos(doc), alvo.doc);

    /* 3. o Felipe abre a Estação ("ver como" felipe): a luz dirigida acende, esfria em 6 s, +2 com origem */
    const t0 = Date.now();
    await verComo('felipe');
    await espera(250);
    m.luzFelipe = await page.evaluate(() => { const c = document.querySelector('.mem-luz'); if (!c) return null; const cs = getComputedStyle(c); return { texto: c.innerText.replace(/\s+/g, ' '), luz: c.style.getPropertyValue('--luz') || cs.getPropertyValue('--luz'), vidro: cs.backdropFilter || cs.webkitBackdropFilter, borda: cs.borderTopColor, tAtividade: (document.querySelector('.e-atividades [data-id="inteligencia"]') || { style: { getPropertyValue: () => '' } }).style.getPropertyValue('--luz') }; });
    await page.screenshot({ path: out('3-felipe-ve-a-luz') });
    const cardBox = await page.locator('.mem-luz').boundingBox().catch(() => null);
    if (cardBox) await page.screenshot({ path: out('3b-cartao-luz'), clip: { x: Math.max(0, cardBox.x - 24), y: Math.max(0, cardBox.y - 24), width: cardBox.width + 48, height: cardBox.height + 48 } });
    await espera(3000);
    m.luzAos3s = await page.evaluate(() => { const c = document.querySelector('.mem-luz'); return c ? c.style.getPropertyValue('--luz') || getComputedStyle(c).getPropertyValue('--luz') : null; });
    await espera(4200);
    m.luzAos7s = await page.evaluate(() => { const c = document.querySelector('.mem-luz'); return c ? { luz: c.style.getPropertyValue('--luz'), visivel: getComputedStyle(c).opacity } : 'saiu'; });
    m.duracaoMs = Date.now() - t0;
    m.pontosFelipe = await page.evaluate(() => BC.memoria.meus('felipe'));
    m.luzesFelipeDepois = await page.evaluate(() => BC.memoria.luzesPara('felipe').length);

    /* 4. a Carla (outra pessoa) nunca vê quem consultou o quê */
    await verComo('carla');
    await espera(300);
    m.carlaVe = await page.evaluate(() => ({ cartoes: document.querySelectorAll('.mem-luz').length, novidades: BC.loja.estado.eventos.filter((e) => /usou o seu|usou a sua|usou o/.test(e.texto || '')).length, meus: BC.memoria.meus('carla').pontos.length }));

    /* 5. o agente consulta pelo conector (o que o coop_buscar do app chama): cita com nome, +1 para o Davi, e o Davi vê a luz */
    log('agente consulta (conector)');
    await verComo('theus');
    const antesDavi = await page.evaluate(() => BC.memoria.usos('ap:ap7'));
    m.conector = await page.evaluate(() => BC.memoria.consultar('como somo a planilha exportada do banco com datas dd/mm?', { quem: 'theus', agente: 'Rita', limite: 4 }));
    m.davi = { antes: antesDavi, depois: await page.evaluate(() => BC.memoria.usos('ap:ap7')) };
    await verComo('davi');
    await espera(350);
    m.luzDavi = await page.evaluate(() => { const c = document.querySelector('.mem-luz'); return c ? c.innerText.replace(/\s+/g, ' ') : null; });
    await page.screenshot({ path: out('4-davi-ve-a-luz-do-agente') });
    await espera(8600);
    await verComo('theus');

    /* 6. todo agente novo nasce sabendo (o que o app põe nas instruções do claude) */
    m.resumo = await page.evaluate(() => { const r = BC.memoria.resumoParaAgente(); return { total: r.total, porTipo: r.porTipo, texto: r.texto, itens: r.itens.length, primeiros: r.itens.slice(0, 3), instrucoes: r.instrucoes.slice(0, 700) }; });

    /* 7. consultar para o conector coop como outra pessoa (a Ana pelo agente Bia): quem ensinou o reembolso */
    m.consultarReembolso = await page.evaluate(() => BC.memoria.consultar('reembolso', { quem: 'ana', agente: 'Bia' }).slice(0, 3));
    m.semana = await page.evaluate(() => BC.memoria.semana());
    m.errosApp = E.erros.slice();

    /* 8. a presença do protótipo (mesmo index.html, sem a ponte): consulta com nome no painel e agente que nasce sabendo */
    log('protótipo puro');
    const base = '/Users/matheussilveirapro/Desktop/babel-coop/prototipo';
    const tipos = { html: 'text/html', js: 'text/javascript', css: 'text/css', png: 'image/png' };
    await page.context().route('http://coop.local/**', (route) => { let p = route.request().url().replace('http://coop.local', '').split('#')[0].split('?')[0]; if (p === '/' || p === '') p = '/index.html'; const ext = p.split('.').pop(); route.fulfill({ path: base + p, contentType: (tipos[ext] || 'text/plain') + '; charset=utf-8', headers: { 'Cache-Control': 'no-store' } }).catch(() => route.fulfill({ status: 404, body: 'x' })); });
    const errosProto = [];
    page.on('pageerror', (e) => errosProto.push(String(e && e.message || e).slice(0, 200)));
    await page.goto('http://coop.local/');
    await page.waitForFunction(() => window.BC && BC.estacao && BC.memoria && document.getElementById('term-entrada'), null, { timeout: 20000 });
    await espera(1200);
    await page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.alternarTerminal(true); });
    const antesP = await page.evaluate(() => BC.memoria.usos('ap:ap7'));
    await page.fill('#term-entrada', 'como somo a planilha exportada do banco com datas dd/mm?');
    await page.press('#term-entrada', 'Enter');
    await espera(900);
    m.presenca = await page.evaluate(() => { const b = Array.from(document.querySelectorAll('#e-painel .mem-consulta')).pop(); return b ? b.innerText.replace(/\s+/g, ' ') : null; });
    m.presencaUsos = { antes: antesP, depois: await page.evaluate(() => BC.memoria.usos('ap:ap7')) };
    const painel = await page.locator('#e-painel').boundingBox().catch(() => null);
    if (painel) await page.screenshot({ path: out('5-presenca-cita-com-nome'), clip: painel });
    await page.click('[data-term="nova"]');
    await page.fill('#ag-nome', 'Lia');
    await page.fill('#ag-faz', 'Atende clientes e consulta o acervo antes de responder');
    await page.click('[data-term="nova-criar"]');
    await espera(700);
    m.nasceu = await page.evaluate(() => { const b = Array.from(document.querySelectorAll('#e-painel .mem-nasce')).pop(); return b ? b.innerText.replace(/\s+/g, ' ') : null; });
    if (painel) await page.screenshot({ path: out('6-agente-nasce-sabendo'), clip: painel });
    await verComo('davi');
    await espera(400);
    m.luzDaviProto = await page.evaluate(() => { const c = document.querySelector('.mem-luz'); return c ? { texto: c.innerText.replace(/\s+/g, ' '), motor: c.dataset.motor || 'css', animacao: getComputedStyle(c).animationName } : null; });
    await page.screenshot({ path: out('7-prototipo-davi-ve-a-luz') });
    m.errosProto = errosProto;
    m.erros = E.erros.slice();
  } finally {
    fs.writeFileSync(path.join(EVID, prefixo + '-medidas.json'), JSON.stringify(m, null, 2));
    await E.fechar();
  }
  console.log(JSON.stringify(m, null, 2).slice(0, 9000));
}

/* movimento reduzido: a luz vira cor sem movimento (degraus), sem animação; nada de pulso nem faíscas */
async function reduzido(prefixo) {
  const E = await abrirEstacao({ nome: 'memoria-red', raiz: raizTemporaria('memoria-red'), porta: 5067, descoberta: 41567 });
  const m = {};
  try {
    const base = '/Users/matheussilveirapro/Desktop/babel-coop/prototipo';
    const tipos = { html: 'text/html', js: 'text/javascript', css: 'text/css', png: 'image/png' };
    const erros = []; E.page.on('pageerror', (e) => erros.push(String(e && e.message || e).slice(0, 200)));
    await E.page.context().route('http://coop.local/**', (route) => { let p = route.request().url().replace('http://coop.local', '').split('#')[0].split('?')[0]; if (p === '/' || p === '') p = '/index.html'; const ext = p.split('.').pop(); route.fulfill({ path: base + p, contentType: (tipos[ext] || 'text/plain') + '; charset=utf-8' }).catch(() => route.fulfill({ status: 404, body: 'x' })); });
    await E.page.emulateMedia({ reducedMotion: 'reduce' });
    await E.page.goto('http://coop.local/');
    await E.page.waitForFunction(() => window.BC && BC.estacao && BC.memoria, null, { timeout: 20000 });
    await espera(1000);
    m.usou = await E.page.evaluate(() => BC.memoria.usar('ap:ap6', { quem: 'theus' }));
    await E.page.evaluate(() => { BC.loja.verComo('davi'); BC.estacao.render(); });
    await espera(400);
    m.cartao = await E.page.evaluate(() => { const c = document.querySelector('.mem-luz'); const cs = c && getComputedStyle(c); return c ? { anim: cs.animationName, borda: cs.borderTopColor, reduz: matchMedia('(prefers-reduced-motion: reduce)').matches } : null; });
    m.luzIntel = await E.page.evaluate(() => (document.querySelector('.e-atividades [data-id="inteligencia"]') || { style: { getPropertyValue: () => '' } }).style.getPropertyValue('--luz'));
    await E.page.screenshot({ path: path.join(EVID, prefixo + '-cartao-reduzido.png') });
    m.erros = erros;
  } finally { fs.writeFileSync(path.join(EVID, prefixo + '-medidas.json'), JSON.stringify(m, null, 2)); await E.fechar(); }
  console.log(JSON.stringify(m, null, 2));
}

/* a página do Electron com context().newPage() trocado por uma janela escondida do próprio app (Electron não cria página solta) */
function adaptar(E) {
  const { app, page } = E;
  const ctx = page.context();
  const ctxProxy = new Proxy(ctx, {
    get(alvo, k) {
      if (k === 'newPage') {
        return async () => {
          const nova = app.waitForEvent('window');
          await app.evaluate(({ BrowserWindow }) => { const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { contextIsolation: true } }); w.loadURL('about:blank'); });
          const p = await nova;
          await p.waitForLoadState().catch(() => {});
          return p;
        };
      }
      const v = alvo[k];
      return typeof v === 'function' ? v.bind(alvo) : v;
    }
  });
  return new Proxy(page, {
    get(alvo, k) {
      if (k === 'context') return () => ctxProxy;
      const v = alvo[k];
      return typeof v === 'function' ? v.bind(alvo) : v;
    }
  });
}

async function roteiro(saida) {
  const E = await abrirEstacao({ nome: 'memoria-rot', raiz: raizTemporaria('memoria-rot'), porta: 5065, descoberta: 41565 });
  try {
    await E.page.waitForLoadState();
    /* SEM_MEMORIA=1: o protótipo sem memoria-nome.js (para isolar uma falha que não é desta parte) */
    if (process.env.SEM_MEMORIA) await E.page.route('**/memoria-nome.js', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '/* desligado no teste */' }));
    const src = fs.readFileSync(ROTEIRO, 'utf8');
    const fn = (0, eval)('(' + src + '\n)');
    const t0 = Date.now();
    const r = await fn(adaptar(E));
    r.segundos = Math.round((Date.now() - t0) / 1000);
    r.onde = 'Electron ' + (await E.app.evaluate(() => process.versions.electron)) + ' · janela escondida · route http://coop.local → prototipo/';
    fs.writeFileSync(saida, JSON.stringify(r, null, 2));
    console.log(r.resumo, '·', r.segundos, 's');
    r.falhas.forEach((f) => console.log('FALHA', JSON.stringify(f)));
    r.tudo.filter((x) => / F · | Z · /.test(x)).forEach((x) => console.log(x));
  } finally { await E.fechar(); }
}

(async () => {
  if (modo === 'prints') await prints(arg || 'antes');
  else if (modo === 'evento') await evento(arg || 'evento');
  else if (modo === 'reduzido') await reduzido(arg || 'reduzido');
  else if (modo === 'roteiro') await roteiro(arg || path.join(EVID, 'roteiro.json'));
  else console.log('uso: prints <prefixo> | evento <prefixo> | roteiro <saida.json>');
})().catch((e) => { console.error('ERRO', e && e.stack || e); process.exitCode = 1; }).finally(fecharTudo);
