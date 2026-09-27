/* babel-coop · e2e do meio vivo e do placar (PROTOCOLO §10 · REGUA_ORGANISMO §2–§3)
   Uma Estação de verdade (Electron, janela escondida), raiz temporária, porta HTTP 4980 e UDP 41480 (só deste arquivo).
   O arquivo é escrito de verdade na pasta compartilhada; as mensagens do agente (agente-arquivo, agente-plano, agente-espera)
   ainda não existem no servidor (servidor/agentes.js vem depois): entram por BC.real.simular, como se viessem do servidor.
   O OK da pessoa sai por BC.real.enviar (WebSocket de verdade; o servidor de hoje ignora o tipo).
   Rodar: cd app && node --test testes/e2e/meio.test.js      (BABEL_COOP_VER=1 mostra a janela)
   Prints e medidas: .deus/terminal-ao-vivo/evidencias/meio/
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { abrirEstacao, raizTemporaria } = require('./estacao');

const PORTA = 4980, UDP = 41480;
const EVID = process.env.BABEL_TESTE_EVIDENCIAS ? path.join(process.env.BABEL_TESTE_EVIDENCIAS, 'meio') : path.join(__dirname, '..', '..', '..', '.deus', 'terminal-ao-vivo', 'evidencias', 'meio');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const medidas = { quando: new Date().toISOString(), porta: PORTA };

const PROPOSTA = [
  '# Proposta · Clínica Vida',
  '',
  'Agenda com confirmação automática pelo WhatsApp, lembretes 24 h antes e prontuário simples.',
  '',
  '## 1 · O problema',
  'A Clínica Vida perde cerca de 18 % dos horários por esquecimento.',
  '> "O que a gente mais perde é paciente que esquece." (reunião de 22/09)',
  '',
  '## 2 · A solução',
  '- agenda online ligada ao WhatsApp',
  '- confirmação e lembrete automáticos',
  '- painel da recepção com tudo do dia',
  '',
  '## 3 · Fases e prazo',
  '1. Fase 1 (2 semanas): agenda e lembretes',
  '2. Fase 2 (1 semana): prontuário e relatórios',
  '',
  '## 4 · Preço',
  'Fase 1: **R$ 4.800** · Fase 2: **R$ 2.400** · manutenção `R$ 390/mês`.',
  '',
  '## 5 · Próximo passo',
  'Aprovação da Dra. Ana até sexta; início na segunda seguinte.'
].join('\n') + '\n';

describe('meio vivo e placar na Estação (Electron)', { timeout: 240000 }, () => {
  let E = null, page = null, raiz = null, pasta = null;
  const errosPagina = [], errosConsole = [];

  async function injetar() {
    /* a lista INJETAR do servidor ainda pode não trazer as duas peças: entram por addScriptTag (o CSS elas pedem sozinhas) */
    const tem = await page.evaluate(() => ({ nasc: !!(window.BC && BC.nascendo), placar: !!(window.BC && BC.placar) }));
    if (!tem.nasc) await page.addScriptTag({ url: E.base + '/coop/nascendo.js' });
    if (!tem.placar) await page.addScriptTag({ url: E.base + '/coop/placar.js' });
    await page.waitForFunction(() => BC.nascendo && BC.placar && document.querySelector('.st-placar') &&
      [...document.styleSheets].some((s) => /\/coop\/nascendo\.css$/.test(s.href || '')) &&
      [...document.styleSheets].some((s) => /\/coop\/placar\.css$/.test(s.href || '')), null, { timeout: 10000 });
    medidas.injecao = tem;
  }
  /* cronômetro de fora: a hora em que cada linha entrou no documento (MutationObserver na página, sem depender do nascendo.js) */
  async function vigiarLinhas() {
    await page.evaluate(() => {
      window.__linhas = []; window.__foto = null;
      /* a foto do meio do nascimento é tirada aqui dentro, no instante em que a 12ª linha entra (não depende da latência do teste) */
      const foto = (el) => {
        const d = el.closest('.nasc-doc'), cab = d.querySelector('.nasc-cab'), scan = d.querySelector('.nasc-scan');
        const cs = getComputedStyle(cab), bg = getComputedStyle(scan).backgroundImage;
        return {
          vivo: d.dataset.vivo, nascidas: d.querySelectorAll('.nasc-l').length, cursor: !!d.querySelector('.nasc-cursor'), visivel: !d.hidden,
          vidro: cs.backdropFilter || cs.webkitBackdropFilter, borda: cs.borderBottomColor,
          scanOpacidadeMax: Math.max(...(bg.match(/rgba?\([^)]+\)/g) || []).map((c) => { const p = c.match(/[\d.]+/g).map(Number); return p.length > 3 ? p[3] : 1; })),
          status: d.querySelector('.nasc-st').textContent, conteudoEscondido: getComputedStyle(document.getElementById('e-conteudo')).display === 'none',
          aba: BC.estacao.abaAtual().id, tipo: BC.estacao.abaAtual().tipo
        };
      };
      if (window.__obsLinhas) window.__obsLinhas.disconnect();
      window.__obsLinhas = new MutationObserver((ms) => {
        const t = performance.now();
        ms.forEach((m) => m.addedNodes.forEach((n) => {
          if (n.nodeType === 1 && n.classList.contains('nasc-l') && n.dataset.n) { window.__linhas.push({ n: +n.dataset.n, t }); if (+n.dataset.n === 12 && !window.__foto) window.__foto = foto(n); }
        }));
      });
      window.__obsLinhas.observe(document.body, { childList: true, subtree: true });
      window.__longas = [];
      try { if (!window.__obsLongas) { window.__obsLongas = new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__longas.push(Math.round(e.duration)))); window.__obsLongas.observe({ type: 'longtask', buffered: false }); } } catch (e) { /* sem longtask */ }
    });
  }
  const simular = (m) => page.evaluate((mm) => BC.real.simular(mm), m);
  const print = (nome, opcoes) => page.screenshot(Object.assign({ path: path.join(EVID, nome) }, opcoes || {}));

  before(async () => {
    fs.mkdirSync(EVID, { recursive: true });
    raiz = raizTemporaria('meio');
    fs.mkdirSync(path.join(raiz, 'zdot'), { recursive: true }); /* o zsh do terminal real não escreve histórico no $HOME do Theus */
    E = await abrirEstacao({ nome: 'meio', raiz, porta: PORTA, descoberta: UDP, env: { ZDOTDIR: path.join(raiz, 'zdot') } });
    page = E.page;
    page.on('pageerror', (e) => errosPagina.push(String(e && e.message || e)));
    page.on('console', (m) => { if (m.type() === 'error') errosConsole.push(m.text()); });
    const f = await E.api('/api/fundar', { nome: 'Theus' });
    assert.equal(f.id, 'theus', JSON.stringify(f));
    pasta = path.join(raiz, 'theus');
    await page.reload();
    await page.waitForFunction(() => window.BC && BC.real && BC.real.bemvindo && BC.real.bemvindo.eu && BC.real.bemvindo.eu.pronto && BC.estacao && document.getElementById('e-status').children.length, null, { timeout: 20000 });
    await injetar();
  });

  after(async () => {
    medidas.errosPagina = errosPagina;
    medidas.errosConsole = errosConsole.slice(0, 40);
    fs.writeFileSync(path.join(EVID, 'resultado.json'), JSON.stringify(medidas, null, 2));
    if (E) await E.fechar();
    try { fs.rmSync(raiz, { recursive: true, force: true }); } catch (e) { /* a pasta temporária some com o sistema */ }
  });

  it('agente-arquivo abre no meio a aba com o arquivo real, e o texto nasce linha a linha', async () => {
    const rel = 'Propostas/proposta-clinica-vida.md';
    fs.mkdirSync(path.join(pasta, 'Propostas'), { recursive: true });
    fs.writeFileSync(path.join(pasta, rel), PROPOSTA);
    const n = PROPOSTA.split('\n').length - 1;
    await vigiarLinhas();
    const t0 = Date.now();
    await simular({ tipo: 'agente-arquivo', dono: 'theus', id: 'ag-aurora', nome: 'Aurora', caminho: rel, absoluto: path.join(pasta, rel), acao: 'criado' });

    /* no meio do nascimento: print + HUD vivo (vidro, borda ciano, scanlines ≤ 5 %) */
    await page.waitForFunction(() => window.__foto, null, { timeout: 8000 });
    const meio = await page.evaluate(() => window.__foto);
    await print('01-nascendo-no-meio.png');
    medidas.fotoDoMeio = meio;
    assert.equal(meio.vivo, 'sim');
    assert.ok(meio.visivel);
    assert.ok(meio.nascidas < n, 'no print do meio ainda falta nascer: ' + meio.nascidas + ' de ' + n);
    assert.ok(meio.cursor, 'o cursor da presença está na ponta');
    assert.match(meio.vidro, /blur/);
    assert.equal(meio.borda, 'rgba(63, 227, 255, 0.22)');
    assert.ok(meio.scanOpacidadeMax <= 0.05, 'scanlines ≤ 5 %: ' + meio.scanOpacidadeMax);
    assert.match(meio.status, /Aurora escreve · linha \d+ de 22/);
    assert.ok(meio.conteudoEscondido, 'o painel ocupa o lugar de #e-conteudo');
    assert.equal(meio.aba, 'nascendo:' + rel);
    assert.equal(meio.tipo, 'nascendo');

    await page.waitForFunction((r) => { const d = BC.nascendo.docs().find((x) => x.rel === r); return d && !d.nascendo; }, rel, { timeout: 10000 });
    const fim = await page.evaluate((r) => ({
      texto: BC.nascendo.texto(r), linhasDom: document.querySelectorAll('.nasc-doc:not([hidden]) .nasc-l').length,
      tempos: window.__linhas.slice(), longas: window.__longas.slice(), med: BC.nascendo.medidas(r),
      cursor: !!document.querySelector('.nasc-cursor'), abas: BC.estacao.ui.abas.map((t) => t.id),
      h1: getComputedStyle(document.querySelector('.nasc-doc:not([hidden]) .nasc-l.h1')).fontFamily,
      status: document.querySelector('.nasc-doc:not([hidden]) .nasc-st').textContent
    }), rel);
    medidas.nascimento = { linhas: n, span: 0, gaps: [], tarefasLongas: fim.longas, tempoInterno: fim.med, msAteAbrir: null };
    assert.equal(fim.texto, PROPOSTA.replace(/\n$/, ''), 'o conteúdo é o arquivo real, inteiro');
    assert.equal(fim.linhasDom, n);
    assert.equal(fim.cursor, false, 'o cursor sai quando termina');
    assert.ok(fim.abas.includes('nascendo:' + rel));
    assert.match(fim.h1, /Plex/);
    assert.match(fim.status, /criado por Aurora · \d\d:\d\d · 22 linhas/);
    const regNasc = await page.evaluate(() => BC.nascendo.registro().filter((x) => x.tipo === 'nascer' || x.tipo === 'nasceu').slice(-2));
    medidas.nascimento.registro = regNasc;
    assert.equal(regNasc[0].animar, true, 'o nascimento foi animado (visível, com movimento)');
    assert.equal(regNasc[1].motivo, 'completo', 'nasceu até o fim linha a linha, sem atalho');
    /* em sequência: cada linha entra depois da anterior, na ordem, com intervalo medido de fora */
    const ts = fim.tempos.filter((x) => x.n >= 1);
    assert.deepEqual(ts.map((x) => x.n), Array.from({ length: n }, (_, i) => i + 1), 'as linhas nascem na ordem 1..n');
    const gaps = ts.slice(1).map((x, i) => Math.round(x.t - ts[i].t));
    const span = Math.round(ts[ts.length - 1].t - ts[0].t);
    medidas.nascimento.span = span; medidas.nascimento.gaps = gaps;
    medidas.nascimento.gapMediano = gaps.slice().sort((a, b) => a - b)[Math.floor(gaps.length / 2)];
    medidas.nascimento.msDoPedidoAoFim = Date.now() - t0;
    assert.ok(gaps.every((g) => g > 0), 'nenhuma linha nasce junto com a anterior: ' + gaps.join(','));
    assert.ok(span >= 1200 && span <= 4000, 'nascimento de 22 linhas leva 1,2–4 s (≈ 90 ms por linha): ' + span + ' ms');
    assert.ok(fim.longas.every((d) => d < 100), 'nenhuma tarefa longa ≥ 100 ms durante o nascimento: ' + fim.longas.join(','));
    await print('02-nascido.png');
  });

  it('edição subsequente acende só as linhas mudadas', async () => {
    const rel = 'Propostas/proposta-clinica-vida.md';
    const ls = PROPOSTA.replace(/\n$/, '').split('\n');
    ls[4] = '## 1 · O problema (com números)';
    ls[11] = '- painel da recepção com os horários do dia e as faltas';
    ls.splice(16, 0, '3. Fase 3 (opcional): integração com o convênio');
    fs.writeFileSync(path.join(pasta, rel), ls.join('\n') + '\n');
    await simular({ tipo: 'agente-arquivo', dono: 'theus', id: 'ag-aurora', nome: 'Aurora', caminho: rel, absoluto: path.join(pasta, rel), acao: 'editado' });
    await page.waitForFunction(() => BC.nascendo.contagem().edicoes === 1, null, { timeout: 8000 });
    const r = await page.evaluate((rr) => {
      const linhas = [...document.querySelectorAll('.nasc-doc:not([hidden]) .nasc-l')];
      return {
        acesas: linhas.filter((l) => parseFloat(l.style.getPropertyValue('--luz') || '0') > 0).map((l) => +l.dataset.n),
        mudou: linhas.filter((l) => l.classList.contains('mudou')).map((l) => +l.dataset.n),
        total: linhas.length, texto: BC.nascendo.texto(rr), status: document.querySelector('.nasc-doc:not([hidden]) .nasc-st').textContent
      };
    }, rel);
    await print('03-editado-linhas-acesas.png');
    medidas.edicao = r;
    assert.deepEqual(r.mudou, [5, 12, 17]);
    assert.deepEqual(r.acesas, [5, 12, 17], 'só as 3 linhas mudadas têm luz');
    assert.equal(r.total, 23);
    assert.equal(r.texto, ls.join('\n'));
    assert.match(r.status, /editado por Aurora · \d\d:\d\d · 3 linhas mudaram/);
    /* a luz esfria sozinha (meia-vida de 6 s): 3 s depois está abaixo da metade e acima de zero */
    await esperar(3000);
    const luz = await page.evaluate(() => parseFloat(document.querySelector('.nasc-doc:not([hidden]) .nasc-l[data-n="5"]').style.getPropertyValue('--luz')));
    medidas.edicao.luzDepoisDe3s = luz;
    assert.ok(luz > 0.4 && luz < 0.85, 'meia-vida de 6 s: luz em 3 s ≈ 0,71 → ' + luz);
  });

  it('agente-plano de 0 a 3 itens feitos: o placar sobe contando com origem e o rito acontece uma vez', async () => {
    const itens = (estados) => ['Escrever o problema e o contexto', 'Montar fases, prazo e preço', 'Revisar e fechar a proposta'].map((texto, i) => ({ texto, estado: estados[i] }));
    const plano = (estados, agora) => ({ tipo: 'agente-plano', dono: 'theus', id: 'ag-aurora', nome: 'Aurora', itens: itens(estados), concluidosAgora: agora });
    const antes = await page.evaluate(() => ({ org: BC.organismo.contagem(), ritos: BC.nascendo.contagem().ritos }));
    await simular(plano(['pendente', 'pendente', 'pendente'], []));
    assert.equal(await page.evaluate(() => BC.placar.hoje()), 0, 'plano novo não dá ponto');
    await simular(plano(['feito', 'andamento', 'pendente'], [0]));
    assert.equal(await page.evaluate(() => BC.placar.hoje()), 1);
    await simular(plano(['feito', 'feito', 'andamento'], [1]));
    assert.equal(await page.evaluate(() => BC.placar.hoje()), 2);
    /* o último item: amostra o número da casa a cada quadro enquanto sobe (de 2 → 3 → 11) */
    await page.evaluate(() => {
      window.__amostras = [];
      const n = document.querySelector('.st-placar .pl-n'), t0 = performance.now();
      (function q() { const v = +n.textContent; if (window.__amostras[window.__amostras.length - 1] !== v) window.__amostras.push(v); if (performance.now() - t0 < 1200) requestAnimationFrame(q); })();
    });
    await simular(plano(['feito', 'feito', 'feito'], [2]));
    await page.waitForFunction(() => BC.nascendo.contagem().ritos >= 1 && document.querySelector('.nasc-concluido.on'), null, { timeout: 6000 });
    await esperar(350);
    await print('04-rito-concluido.png');
    await esperar(900);
    const r = await page.evaluate(() => {
      const fim = document.querySelector('.nasc-doc:not([hidden]) .nasc-concluido');
      return {
        hoje: BC.placar.hoje(), amostras: window.__amostras, numero: document.querySelector('.st-placar .pl-n').textContent,
        eventos: BC.placar.eventos().map((e) => ({ pts: e.pts, origem: e.origem, conta: e.conta, tipo: e.tipo })),
        titulo: fim.firstChild.textContent, fonte: getComputedStyle(fim).fontFamily, sub: fim.querySelector('small').textContent,
        ritos: BC.nascendo.contagem().ritos, org: BC.organismo.contagem(), registro: BC.nascendo.registro().filter((x) => x.tipo === 'rito')
      };
    });
    medidas.plano = { eventos: r.eventos, amostrasDoNumero: r.amostras, subtitulo: r.sub, registroRito: r.registro };
    assert.equal(r.hoje, 11, '3 itens × 1 + plano concluído 8');
    assert.equal(r.numero, '11');
    assert.deepEqual(r.eventos.map((e) => e.pts), [1, 1, 1, 8]);
    assert.match(r.eventos[0].origem, /item do plano feito · Escrever o problema e o contexto/);
    assert.match(r.eventos[3].origem, /plano concluído · 3 itens/);
    assert.match(r.eventos[3].conta, /8 × esforço 1 × surpresa 1/);
    const intermediarios = r.amostras.filter((v) => v > 3 && v < 11);
    assert.ok(intermediarios.length >= 2, 'o número sobe contando (valores entre 3 e 11 vistos na tela): ' + r.amostras.join(','));
    assert.equal(r.titulo, 'Documento concluído');
    assert.match(r.fonte, /Cormorant/);
    assert.match(r.sub, /3 itens · 11 pontos · Aurora · agente de Theus · \d\d:\d\d/);
    assert.equal(r.ritos - antes.ritos, 1);
    assert.equal((r.org.somPedido.duas || 0) - (antes.org.somPedido.duas || 0), 1, 'som "duas" uma vez');
    assert.ok(r.org.respirar - antes.org.respirar >= 1, 'o documento respirou');
    assert.ok(r.org.faiscas - antes.org.faiscas >= 1, 'faíscas pedidas');
    /* o gancho repete (PreToolUse e PostToolUse): nada de rito nem ponto de novo */
    await simular(plano(['feito', 'feito', 'feito'], [2]));
    await simular(plano(['feito', 'feito', 'feito'], []));
    await esperar(1300);
    const depois = await page.evaluate(() => ({ ritos: BC.nascendo.contagem().ritos, hoje: BC.placar.hoje(), titulos: document.querySelectorAll('.nasc-concluido.on').length, recusados: BC.placar.contagem().recusados, vivo: document.querySelector('.nasc-doc:not([hidden])').dataset.vivo }));
    medidas.plano.repeticao = depois;
    assert.equal(depois.ritos - antes.ritos, 1, 'o rito acontece uma vez');
    assert.equal(depois.hoje, 11);
    assert.equal(depois.titulos, 1);
    assert.equal(depois.vivo, 'nao', 'depois do rito o documento esfria (HUD sai)');
    /* os poderes (BC.poderes): o rito pediu o combo uma vez; o nascimento do teste 1 pediu faíscas e micro-explosões */
    const pdPlano = await page.evaluate(() => ({ tem: !!(window.BC && BC.poderes), pd: BC.nascendo.contagem().poderes, combos: BC.nascendo.registro().filter((x) => x.tipo === 'combo') }));
    medidas.plano.poderes = pdPlano;
    assert.ok(pdPlano.tem, 'BC.poderes carregado na Estação');
    assert.equal(pdPlano.pd.combo, 1, 'o rito virou combo uma vez');
    assert.ok(pdPlano.pd.faisca >= 1 && pdPlano.pd.explodir >= 6, 'faíscas e micro-explosões no nascimento: ' + JSON.stringify(pdPlano.pd));
    assert.match(pdPlano.combos[0].sub, /^23 linhas · 6 seções · 11 pontos$/);
  });

  it('OK dado a um pedido de permissão vale +2 só com pedido real; a meta escolhida fecha em ouro uma vez', async () => {
    /* a meta é da pessoa: escolhida na lista do placar */
    await page.click('.st-placar');
    await page.waitForSelector('.pl-pop');
    await page.fill('.pl-meta-form input', '13');
    await page.click('.pl-meta-form button[type="submit"]');
    assert.equal(await page.evaluate(() => BC.placar.meta()), 13);
    assert.equal(await page.evaluate(() => document.querySelector('.st-placar .pl-anel').classList.contains('ouro')), false);
    const antes = await page.evaluate(() => ({ org: BC.organismo.contagem(), pl: BC.placar.contagem() }));
    /* OK sem pedido de verdade: nada */
    await page.evaluate(() => BC.real.enviar({ tipo: 'agente-ok', id: 'ag-aurora', pid: 'inventado', decisao: 'permitir' }));
    assert.equal(await page.evaluate(() => BC.placar.hoje()), 11);
    /* pedido real do meu agente, e a pessoa permite (a mensagem sai pelo WebSocket de verdade) */
    await simular({ tipo: 'agente-espera', dono: 'theus', id: 'ag-aurora', nome: 'Aurora', pid: 'p-1', ferramenta: 'Bash', resumo: 'npm publish --dry-run' });
    await simular({ tipo: 'agente-espera', dono: 'carla', id: 'ag-lia', nome: 'Lia', pid: 'p-9', ferramenta: 'Bash', resumo: 'rm -rf build' });
    await page.evaluate(() => BC.real.enviar({ tipo: 'agente-ok', id: 'ag-aurora', pid: 'p-1', decisao: 'permitir' }));
    await page.evaluate(() => BC.real.enviar({ tipo: 'agente-ok', id: 'ag-aurora', pid: 'p-1', decisao: 'permitir' }));
    await page.evaluate(() => BC.real.enviar({ tipo: 'agente-ok', id: 'ag-lia', pid: 'p-9', decisao: 'permitir' }));
    await esperar(400);
    const r = await page.evaluate(() => ({
      hoje: BC.placar.hoje(), semana: BC.placar.semana(), ultimo: BC.placar.eventos().slice(-1)[0], org: BC.organismo.contagem(), pl: BC.placar.contagem(),
      ouro: document.querySelector('.st-placar .pl-anel').classList.contains('ouro'), ouroGrande: document.querySelector('.pl-pop .pl-anel-g').classList.contains('ouro'),
      lista: [...document.querySelectorAll('.pl-pop .pl-lista li')].map((li) => li.textContent), registro: BC.placar.registro().filter((x) => x.tipo === 'recusado').map((x) => x.motivo)
    }));
    await print('05-placar-origem.png');
    const casa = await page.$('.st-placar');
    const caixa = await casa.boundingBox();
    await page.screenshot({ path: path.join(EVID, '06-meta-ouro-rodape.png'), clip: { x: Math.max(0, caixa.x - 40), y: Math.max(0, caixa.y - 40), width: 420, height: caixa.height + 48 } });
    medidas.ok = { hoje: r.hoje, ultimo: r.ultimo, recusados: r.registro, lista: r.lista };
    assert.equal(r.hoje, 13, '11 + 2 do OK, uma vez só');
    assert.equal(r.ultimo.pts, 2);
    assert.match(r.ultimo.origem, /você decidiu um pedido de Aurora · permitiu/);
    assert.match(r.ultimo.prova, /Bash: npm publish --dry-run/);
    assert.ok(r.registro.includes('sem-pedido'), 'OK inventado recusado');
    assert.ok(r.registro.filter((x) => x === 'sem-pedido').length >= 2, 'o pedido do agente de outra pessoa não conta para mim');
    assert.ok(r.ouro && r.ouroGrande, 'o anel vira ouro com 13 / 13');
    assert.equal(r.pl.ouro - antes.pl.ouro, 1);
    assert.equal((r.org.somPedido.tres || 0) - (antes.org.somPedido.tres || 0), 1, 'três notas, uma vez');
    assert.equal(r.lista.length, 5, 'a lista mostra os 5 pontos de hoje');
    assert.match(r.lista[0], /\+2.*você decidiu/);
    assert.match(r.lista[1], /\+8.*plano concluído/);
    /* a meta muda e volta: o ouro desta semana não toca de novo */
    await page.evaluate(() => { BC.placar.definirMeta(40); BC.placar.definirMeta(13); });
    assert.equal(await page.evaluate(() => BC.placar.contagem().ouro), r.pl.ouro);
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => BC.placar.aberto()), false);
  });

  it('o placar fica guardado por pessoa neste computador (recarregar a Estação não perde nem duplica)', async () => {
    const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('babel-coop:placar:theus')));
    assert.equal(guardado.eventos.length, 5);
    assert.equal(guardado.meta, 13);
    await page.reload();
    await page.waitForFunction(() => window.BC && BC.real && BC.real.bemvindo && BC.real.bemvindo.eu && BC.real.bemvindo.eu.pronto && document.getElementById('e-status').children.length, null, { timeout: 20000 });
    await injetar();
    await page.waitForFunction(() => document.querySelector('.st-placar .pl-n').textContent === '13', null, { timeout: 5000 });
    const r = await page.evaluate(() => ({ hoje: BC.placar.hoje(), meta: BC.placar.meta(), sequencia: BC.placar.sequencia(), ouro: document.querySelector('.st-placar .pl-anel').classList.contains('ouro'), rotulo: document.querySelector('.st-placar').textContent }));
    medidas.guardado = r;
    assert.equal(r.hoje, 13);
    assert.equal(r.meta, 13);
    assert.equal(r.ouro, true);
    assert.match(r.rotulo, /13pontos · hoje/);
    /* o plano de antes chegando de novo (servidor reenviando) não dá ponto nem rito */
    await simular({ tipo: 'agente-plano', dono: 'theus', id: 'ag-aurora', itens: ['Escrever o problema e o contexto', 'Montar fases, prazo e preço', 'Revisar e fechar a proposta'].map((texto) => ({ texto, estado: 'feito' })), concluidosAgora: [0, 1, 2] });
    await esperar(1100);
    assert.equal(await page.evaluate(() => BC.placar.hoje()), 13);
    assert.equal(await page.evaluate(() => BC.nascendo.contagem().ritos + document.querySelectorAll('.nasc-cartao').length), 0);
  });

  it('bordas: plano sem arquivo vira cartão; arquivo fora da pasta não abre; aba fechada volta acendendo só o que mudou', async () => {
    /* plano concluído de uma sessão que não escreveu arquivo: cartão "Plano concluído" no pé do meio, uma vez */
    const hojeAntes = await page.evaluate(() => BC.placar.hoje());
    await simular({ tipo: 'agente-plano', dono: 'theus', id: 'ag-cris', nome: 'Cris', itens: [{ texto: 'Responder o WhatsApp da Dra. Ana', estado: 'feito' }], concluidosAgora: [0] });
    await page.waitForSelector('.nasc-cartao.on', { timeout: 4000 });
    await esperar(200);
    const cartao = await page.evaluate(() => ({ n: document.querySelectorAll('.nasc-cartao').length, texto: document.querySelector('.nasc-cartao').textContent, fonte: getComputedStyle(document.querySelector('.nasc-cartao')).fontFamily }));
    await print('09-plano-sem-arquivo-cartao.png');
    medidas.cartao = cartao;
    assert.equal(cartao.n, 1);
    assert.match(cartao.texto, /^Plano concluído1 item · 9 pontos · Cris · agente de Theus/);
    assert.match(cartao.fonte, /Cormorant/);
    assert.equal(await page.evaluate(() => BC.placar.hoje()), hojeAntes + 9);
    await page.waitForFunction(() => !document.querySelector('.nasc-cartao'), null, { timeout: 7000 });

    /* arquivo fora da pasta compartilhada: o meio não mostra, a Estação avisa, nenhuma aba nova */
    const abasAntes = await page.evaluate(() => BC.estacao.ui.abas.length);
    await simular({ tipo: 'agente-arquivo', dono: 'theus', id: 'ag-aurora', nome: 'Aurora', caminho: '/etc/hosts', absoluto: '/etc/hosts', acao: 'editado' });
    await simular({ tipo: 'agente-arquivo', dono: 'theus', id: 'ag-aurora', nome: 'Aurora', caminho: '../fora.md', acao: 'criado' });
    /* e o arquivo do agente de outra pessoa não abre no meu meio */
    await simular({ tipo: 'agente-arquivo', dono: 'carla', id: 'ag-lia', nome: 'Lia', caminho: 'README.md', acao: 'criado' });
    await esperar(500);
    const fora = await page.evaluate(() => ({ abas: BC.estacao.ui.abas.length, aviso: BC.estacao.ui.ultimoAviso || '', reg: BC.nascendo.registro().filter((x) => x.tipo === 'ignorado').map((x) => x.motivo) }));
    medidas.fora = fora;
    assert.equal(fora.abas, abasAntes);
    assert.deepEqual(fora.reg.slice(-3).sort(), ['fora-da-pasta', 'fora-da-pasta', 'outro-dono']);
    assert.match(fora.aviso, /fora da pasta compartilhada/);

    /* aba fechada pela pessoa e o agente edita de novo: volta com o texto de antes e só o que mudou acende */
    const rel = 'notas/lista.md', base = ['# Lista', '- um', '- dois', '- três', '- quatro'];
    fs.mkdirSync(path.join(pasta, 'notas'), { recursive: true });
    fs.writeFileSync(path.join(pasta, rel), base.join('\n') + '\n');
    await simular({ tipo: 'agente-arquivo', dono: 'theus', id: 'ag-aurora', nome: 'Aurora', caminho: rel, acao: 'criado' });
    await page.waitForFunction((r) => { const d = BC.nascendo.docs().find((x) => x.rel === r); return d && !d.nascendo; }, rel, { timeout: 6000 });
    await page.evaluate((r) => BC.estacao.fecharAba('nascendo:' + r), rel);
    assert.equal(await page.evaluate((r) => BC.nascendo.docs().some((x) => x.rel === r), rel), false, 'fechar a aba tira o painel');
    fs.writeFileSync(path.join(pasta, rel), ['# Lista', '- um', '- dois (feito)', '- três', '- quatro'].join('\n') + '\n');
    await simular({ tipo: 'agente-arquivo', dono: 'theus', id: 'ag-aurora', nome: 'Aurora', caminho: rel, acao: 'editado' });
    await page.waitForFunction((r) => BC.nascendo.docs().some((x) => x.rel === r) && BC.estacao.abaAtual().id === 'nascendo:' + r && BC.nascendo.texto(r).includes('dois (feito)'), rel, { timeout: 6000 });
    /* o formato cru do TodoWrite (content/status) também vale para o placar e o rito */
    const hojeCru = await page.evaluate(() => BC.placar.hoje());
    await simular({ tipo: 'agente-plano', dono: 'theus', id: 'ag-cru', nome: 'Cru', itens: [{ content: 'Item cru do TodoWrite', status: 'completed' }, { content: 'Outro item cru', status: 'completed' }], concluidosAgora: [0, 1] });
    assert.equal(await page.evaluate(() => BC.placar.hoje()), hojeCru + 1 + 1 + 8);
    await page.waitForSelector('.nasc-cartao.on', { timeout: 4000 });
    const volta = await page.evaluate(() => [...document.querySelectorAll('.nasc-doc:not([hidden]) .nasc-l')].filter((l) => parseFloat(l.style.getPropertyValue('--luz') || '0') > 0).map((l) => +l.dataset.n));
    medidas.reabrir = volta;
    assert.deepEqual(volta, [3]);
  });

  it('com o painel da presença de verdade: um rito só por plano (o painel faz o dele; o documento vem depois, sem segundo "duas")', async (t) => {
    const sessoes = await page.evaluate(() => (window.BC && BC.terminalReal && BC.terminalReal.sessoes ? BC.terminalReal.sessoes().map((x) => x.id) : []));
    if (!sessoes.length) { t.skip('o painel da presença (terminal-real.js) não abriu sessão nesta Estação'); return; }
    const id = sessoes[0], rel = 'notas/nota-do-painel.md';
    fs.writeFileSync(path.join(pasta, rel), ['# Nota do painel', '', '- o agente escreveu isto', '- e fechou o plano'].join('\n') + '\n');
    await simular({ tipo: 'agente-arquivo', dono: 'theus', id, caminho: rel, acao: 'criado' });
    await page.waitForFunction((r) => { const d = BC.nascendo.docs().find((x) => x.rel === r); return d && !d.nascendo; }, rel, { timeout: 6000 });
    await esperar(300);
    const antes = await page.evaluate(() => ({ org: BC.organismo.contagem(), nasc: BC.nascendo.contagem(), painel: BC.terminalReal.medidas() }));
    await simular({ tipo: 'agente-plano', dono: 'theus', id, itens: [{ texto: 'Escrever a nota do painel', estado: 'andamento' }], concluidosAgora: [] });
    await esperar(200);
    await simular({ tipo: 'agente-plano', dono: 'theus', id, itens: [{ texto: 'Escrever a nota do painel', estado: 'feito' }], concluidosAgora: [0] });
    await page.waitForFunction((n) => BC.nascendo.contagem().ritos > n, antes.nasc.ritos, { timeout: 8000 });
    await esperar(1500);
    const r = await page.evaluate(() => ({ org: BC.organismo.contagem(), nasc: BC.nascendo.contagem(), painel: BC.terminalReal.medidas(), ultimo: BC.nascendo.registro().filter((x) => x.tipo === 'rito').slice(-1)[0], titulo: !!document.querySelector('.nasc-doc:not([hidden]) .nasc-concluido.on'), eventos: BC.placar.eventos().slice(-2).map((e) => e.origem) }));
    await print('10-rito-com-o-painel.png');
    medidas.comPainel = { sessao: id, ritosPainel: (r.painel.ritos || 0) - (antes.painel.ritos || 0), duas: (r.org.somPedido.duas || 0) - (antes.org.somPedido.duas || 0), ultimo: r.ultimo, eventos: r.eventos };
    assert.equal(medidas.comPainel.ritosPainel, 1, 'o painel fez o rito dele');
    assert.equal(r.nasc.ritos - antes.nasc.ritos, 1, 'o documento fez o dele, uma vez');
    assert.equal(medidas.comPainel.duas, 1, 'uma nota "duas" só, na página inteira');
    assert.equal(r.ultimo.depoisDaPresenca, true);
    assert.equal(r.ultimo.som, false);
    assert.ok(r.titulo);
    assert.match(r.eventos.join(' | '), /item do plano feito · Escrever a nota do painel \| plano concluído · 1 item/);
  });

  it('prefers-reduced-motion: o arquivo aparece inteiro, sem movimento; o rito vira cor e texto', async () => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
    const rel = 'Propostas/ata-22-09.md';
    const ata = ['# Ata · 22/09', '', '- presentes: Theus, Carla, Davi', '- decisão: proposta curta para clínicas', '- próximo: Aurora escreve a proposta', '', '## Pendências', '1. preço da fase 2', '2. prazo da Dra. Ana'].join('\n') + '\n';
    fs.writeFileSync(path.join(pasta, rel), ata);
    await vigiarLinhas();
    const orgAntes = await page.evaluate(() => BC.organismo.contagem());
    const hojeReduzido = await page.evaluate(() => BC.placar.hoje());
    await simular({ tipo: 'agente-arquivo', dono: 'theus', id: 'ag-bento', nome: 'Bento', caminho: 'theus/' + rel, acao: 'criado' });
    await page.waitForFunction((r) => { const d = BC.nascendo.docs().find((x) => x.rel === r); return d && !d.nascendo && d.visivel; }, rel, { timeout: 8000 });
    const r = await page.evaluate(() => {
      const vista = document.querySelector('.nasc-vista');
      const anim = document.getAnimations().filter((a) => a.effect && a.effect.target && vista.contains(a.effect.target));
      return { tempos: window.__linhas.slice(), animacoes: anim.length, quais: anim.map((x) => x.constructor.name + ":" + (x.transitionProperty || x.animationName || "waapi") + "@" + (x.effect.target.getAttribute("class") || x.effect.target.tagName)), cursor: !!document.querySelector('.nasc-cursor'), linhas: document.querySelectorAll('.nasc-doc:not([hidden]) .nasc-l').length, registro: BC.nascendo.registro().filter((x) => x.tipo === 'nascer').slice(-1)[0] };
    });
    await print('07-reduzido-inteiro.png');
    const span = Math.round(r.tempos[r.tempos.length - 1].t - r.tempos[0].t);
    medidas.reduzido = { linhas: r.linhas, span, animacoes: r.animacoes, registro: r.registro };
    assert.equal(r.linhas, 9);
    assert.ok(span < 30, 'aparece inteiro de uma vez: ' + span + ' ms entre a primeira e a última linha');
    assert.equal(r.animacoes, 0, 'nenhuma animação no painel: ' + r.quais.join(' | '));
    assert.equal(r.cursor, false);
    assert.equal(r.registro.animar, false);
    /* o rito sem movimento: título sem transição, faíscas não saem, o som continua (som não é movimento) */
    await simular({ tipo: 'agente-plano', dono: 'theus', id: 'ag-bento', nome: 'Bento', itens: [{ texto: 'Passar a ata a limpo', estado: 'feito' }], concluidosAgora: [0] });
    await page.waitForFunction(() => document.querySelector('.nasc-doc:not([hidden]) .nasc-concluido.on'), null, { timeout: 5000 });
    const rito = await page.evaluate(() => {
      const fim = document.querySelector('.nasc-doc:not([hidden]) .nasc-concluido.on'), cs = getComputedStyle(fim);
      return { transicao: cs.transitionDuration, transform: cs.transform, opacidade: cs.opacity, org: BC.organismo.contagem(), reg: BC.organismo.registro().filter((x) => x.tipo === 'faiscas').slice(-1)[0], hoje: BC.placar.hoje() };
    });
    await print('08-reduzido-rito.png');
    medidas.reduzido.rito = { transicao: rito.transicao, opacidade: rito.opacidade, faiscas: rito.reg };
    assert.match(rito.transicao, /^0s/);
    assert.equal(rito.opacidade, '1');
    assert.equal(rito.transform, 'none');
    assert.equal(rito.reg.motivo, 'sem-movimento');
    assert.equal((rito.org.somPedido.duas || 0) - (orgAntes.somPedido.duas || 0), 1);
    assert.equal(rito.hoje, hojeReduzido + 1 + 8, 'item + plano do Bento');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });

  it('o arquivo que nasce vira jogo (BC.poderes): faísca na ponta, micro-explosão por título, bloco e check, contador vivo, combo no fim; o canvas some', async () => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    assert.equal(await page.evaluate(() => !!(window.BC && BC.poderes && typeof BC.poderes.explodir === 'function')), true, 'BC.poderes está na Estação (prototipo/poderes.js)');
    /* espião: cada chamada a BC.poderes é contada e a função de verdade continua rodando; e cada vez que o canvas .pd-tela nasce */
    await page.evaluate(() => {
      window.__pd = { faisca: 0, explodir: 0, flutuar: 0, combo: 0, som: 0, textos: [], sons: [], combos: [], alvos: [] };
      ['faisca', 'explodir', 'flutuar', 'combo', 'som'].forEach((k) => {
        const orig = BC.poderes[k].__orig || BC.poderes[k];
        const f = function () {
          const a = [...arguments];
          window.__pd[k]++;
          if (k === 'flutuar') window.__pd.textos.push(String(a[1]));
          if (k === 'som') window.__pd.sons.push(String(a[0]));
          if (k === 'combo') { const pr = a[0].getBoundingClientRect(); window.__pd.combos.push({ titulo: a[1], sub: a[2], palco: { top: Math.round(pr.top), bottom: Math.round(pr.bottom) } }); }
          if (k === 'explodir') { const l = a[0] && a[0].closest && a[0].closest('.nasc-l'); window.__pd.alvos.push(l ? 'linha ' + l.dataset.n + (a[0].classList.contains('nasc-caixa') ? ' (caixa)' : '') : String(a[0] && a[0].className)); }
          return orig.apply(this, arguments);
        };
        f.__orig = orig;
        BC.poderes[k] = f;
      });
      window.__telaNasceu = 0;
      if (window.__obsTela) window.__obsTela.disconnect();
      window.__obsTela = new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1 && n.classList.contains('pd-tela')) window.__telaNasceu++; })));
      window.__obsTela.observe(document.body, { childList: true });
    });
    const foto = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__pd)));
    const semTela = () => page.waitForFunction(() => !document.querySelector('.pd-tela') && !document.querySelector('.pd-bordas'), null, { timeout: 9000 });

    /* 1) nasce um arquivo com títulos e checks */
    const rel = 'Propostas/plano-da-semana.md';
    const texto = ['# Plano da semana', '', 'O que a Dora fecha até sexta.', '', '## Feito', '- [x] proposta da Clínica Vida', '- [x] ata de 22/09', '- [ ] revisar o preço da fase 2', '', '## Próximo', 'Mandar para a Dra. Ana na segunda.'];
    fs.writeFileSync(path.join(pasta, rel), texto.join('\n') + '\n');
    await semTela();
    await simular({ tipo: 'agente-arquivo', dono: 'theus', id: 'ag-dora', nome: 'Dora', caminho: rel, absoluto: path.join(pasta, rel), acao: 'criado' });
    await page.waitForFunction(() => window.__pd.explodir >= 3 && document.querySelector('.pd-tela'), null, { timeout: 8000 });
    await print('11-nascendo-com-poderes.png');
    await page.waitForFunction((r) => { const d = BC.nascendo.docs().find((x) => x.rel === r); return d && !d.nascendo; }, rel, { timeout: 10000 });
    await page.waitForFunction(() => window.__pd.sons.includes('poder'), null, { timeout: 5000 }); /* o fecho do arquivo */
    const nasc = await page.evaluate((r) => ({
      doc: BC.nascendo.docs().find((x) => x.rel === r), conta: [...document.querySelectorAll('.nasc-doc:not([hidden]) .nasc-conta:not([hidden]) .nasc-nc:not([hidden])')].map((e) => e.textContent).join(' · '),
      reg: BC.nascendo.registro().filter((x) => x.tipo === 'nascer' || x.tipo === 'nasceu').slice(-2), fecho: BC.nascendo.registro().filter((x) => x.tipo === 'fecho').slice(-1)[0]
    }), rel);
    const pd1 = await foto();
    await semTela();
    const telas1 = await page.evaluate(() => window.__telaNasceu);
    medidas.poderes = { nascimento: { pd: pd1, conta: nasc.conta, telas: telas1 } };
    assert.equal(nasc.reg[0].animar, true, 'nasceu animado');
    assert.equal(nasc.reg[1].motivo, 'completo');
    assert.ok(pd1.faisca >= 1, 'faísca na ponta do cursor: ' + pd1.faisca);
    assert.equal(pd1.textos.filter((t) => t === '+1 seção').length, 3, 'um "+1 seção" por título (#, ##, ##): ' + pd1.textos.join(' | '));
    assert.equal(pd1.textos.filter((t) => t === '+1 feito').length, 2, 'um "+1 feito" por item marcado');
    assert.ok(pd1.textos.includes('+1 parágrafo') && pd1.textos.includes('+1 lista'), 'o bloco que fecha também explode');
    assert.ok(pd1.alvos.includes('linha 6 (caixa)') && pd1.alvos.includes('linha 7 (caixa)'), 'a explosão do check sai da caixa marcada: ' + pd1.alvos.join(' | '));
    assert.ok(pd1.explodir >= 8, '7 marcos + o fecho: ' + pd1.explodir);
    assert.equal(pd1.textos[pd1.textos.length - 1], '11 linhas · 3 seções · 2 feitos', 'o fecho mostra o total real');
    assert.equal(nasc.fecho.resumo, '11 linhas · 3 seções · 2 feitos');
    assert.ok(pd1.sons.includes('poder-leve') && pd1.sons.includes('poder'));
    assert.equal(pd1.combo, 0, 'nascer não é concluir: combo só no rito');
    assert.deepEqual(nasc.doc.conta, { linhas: 11, secoes: 3, blocos: 3, feitos: 2 });
    assert.equal(nasc.conta, '11 linhas · 3 seções · 2 feitos', 'contador no cabeçalho');
    assert.ok(telas1 >= 1, 'o canvas dos poderes existiu durante o nascimento');
    assert.equal(await page.evaluate(() => document.querySelector('.pd-tela')), null, 'e sumiu no fim');

    /* 2) o plano do agente: cada check novo explode no contador; o gancho repetido não conta; tudo feito = combo */
    const hojeAntes = await page.evaluate(() => BC.placar.hoje());
    const sonsAntes = (await foto()).sons.length; /* o rito do teste anterior também soa 'combo' (380 ms depois): conta só daqui */
    const plano = (e, agora) => ({ tipo: 'agente-plano', dono: 'theus', id: 'ag-dora', nome: 'Dora', itens: [{ texto: 'Escrever o plano da semana', estado: e[0] }, { texto: 'Marcar o que já foi feito', estado: e[1] }], concluidosAgora: agora });
    await simular(plano(['feito', 'andamento'], [0]));
    await simular(plano(['feito', 'andamento'], [0]));
    await esperar(250);
    const chk = await page.evaluate(() => ({ textos: window.__pd.textos.slice(), p: document.querySelector('.nasc-doc:not([hidden]) .nasc-nc[data-k="p"]').textContent }));
    assert.equal(chk.textos.filter((t) => t === '+1 item feito').length, 1, 'um check, um poder (a repetição do gancho não conta)');
    assert.equal(chk.p, 'plano 1/2');
    await simular(plano(['feito', 'feito'], [1]));
    await page.waitForFunction(() => window.__pd.combo >= 1, null, { timeout: 8000 });
    await page.waitForFunction((n) => window.__pd.sons.slice(n).includes('combo'), sonsAntes, { timeout: 3000 }); /* o 'combo' vem 380 ms depois do "duas" */
    const fim = await page.evaluate(() => ({ pd: JSON.parse(JSON.stringify(window.__pd)), hoje: BC.placar.hoje(), bordas: !!document.querySelector('.pd-bordas'), titulo: document.querySelector('.nasc-doc:not([hidden]) .nasc-concluido.on') && document.querySelector('.nasc-doc:not([hidden]) .nasc-concluido.on').firstChild.textContent }));
    await print('12-combo-documento-concluido.png');
    medidas.poderes.plano = { combos: fim.pd.combos, sons: fim.pd.sons.slice(sonsAntes), hoje: fim.hoje - hojeAntes };
    assert.equal(fim.pd.textos.filter((t) => t === '+1 item feito').length, 2);
    assert.equal(fim.hoje - hojeAntes, 10, '2 itens × 1 + plano concluído 8 (placar.js)');
    assert.equal(fim.pd.combo, 1);
    assert.equal(fim.pd.combos[0].titulo, 'Documento concluído');
    assert.equal(fim.pd.combos[0].sub, '11 linhas · 3 seções · 2 feitos · 10 pontos', 'contagem real e os pontos que o placar deu');
    assert.deepEqual(fim.pd.sons.slice(sonsAntes), ['poder-leve', 'poder-leve', 'combo'], 'um "poder-leve" por check e o "combo" no rito');
    assert.ok(fim.bordas, 'as bordas da janela acendem');
    assert.equal(fim.titulo, 'Documento concluído');
    /* o letreiro do combo não cai em cima do título que fica; e o nome do arquivo cabe no cabeçalho mais cheio (contador + "concluído") */
    const lugar = await page.evaluate(() => {
      const d = document.querySelector('.nasc-doc:not([hidden])'), t = d.querySelector('.nasc-concluido').getBoundingClientRect();
      const n = d.querySelector('.nasc-nome').getBoundingClientRect(), c = d.querySelector('.nasc-caminho').getBoundingClientRect();
      return { titulo: { top: Math.round(t.top), bottom: Math.round(t.bottom) }, nome: Math.round(n.right), caminho: Math.round(c.right), cab: Math.round(d.querySelector('.nasc-cab').getBoundingClientRect().width) };
    });
    medidas.poderes.lugar = Object.assign({ palco: fim.pd.combos[0].palco }, lugar);
    assert.ok(fim.pd.combos[0].palco.bottom <= lugar.titulo.top || fim.pd.combos[0].palco.top >= lugar.titulo.bottom, 'palco do combo fora do título: ' + JSON.stringify(medidas.poderes.lugar));
    assert.ok(lugar.nome <= lugar.caminho + 1, 'o nome do arquivo cabe inteiro no cabeçalho: ' + JSON.stringify(lugar));
    await semTela();

    /* 3) edição: uma faísca por linha que muda; o item que passou a marcado é check novo (explode); nada de combo */
    const antesEd = await foto();
    const edEm = await page.evaluate(() => BC.nascendo.contagem().edicoes);
    const ed = texto.slice();
    ed[2] = 'O que a Dora fecha até sexta, com o preço revisado.';
    ed[7] = '- [x] revisar o preço da fase 2';
    fs.writeFileSync(path.join(pasta, rel), ed.join('\n') + '\n');
    await simular({ tipo: 'agente-arquivo', dono: 'theus', id: 'ag-dora', nome: 'Dora', caminho: rel, absoluto: path.join(pasta, rel), acao: 'editado' });
    await page.waitForFunction((n) => BC.nascendo.contagem().edicoes === n + 1, edEm, { timeout: 8000 });
    await esperar(400);
    const pdEd = await foto();
    const docEd = await page.evaluate((r) => BC.nascendo.docs().find((x) => x.rel === r), rel);
    medidas.poderes.edicao = { faisca: pdEd.faisca - antesEd.faisca, explodir: pdEd.explodir - antesEd.explodir, conta: docEd.conta };
    assert.equal(pdEd.faisca - antesEd.faisca, 1, 'a linha 3 mudou: uma faísca');
    assert.equal(pdEd.explodir - antesEd.explodir, 1, 'a linha 8 virou check: uma micro-explosão');
    assert.ok(pdEd.alvos.slice(antesEd.alvos.length).includes('linha 8 (caixa)'));
    assert.equal(pdEd.combo, antesEd.combo, 'edição não faz combo');
    assert.equal(docEd.conta.feitos, 3);
    await semTela();

    /* 4) sem movimento: o arquivo aparece inteiro, o contador fica certo e nenhum poder é pedido */
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const antesQ = await foto();
    const relQ = 'notas/quieto.md';
    fs.mkdirSync(path.join(pasta, 'notas'), { recursive: true });
    fs.writeFileSync(path.join(pasta, relQ), ['# Quieto', '- [x] nada se mexe', '- [ ] o texto continua certo'].join('\n') + '\n');
    await simular({ tipo: 'agente-arquivo', dono: 'theus', id: 'ag-dora', nome: 'Dora', caminho: relQ, acao: 'criado' });
    await page.waitForFunction((r) => { const d = BC.nascendo.docs().find((x) => x.rel === r); return d && !d.nascendo && d.visivel; }, relQ, { timeout: 8000 });
    await esperar(300);
    const q = await page.evaluate((r) => ({ pd: JSON.parse(JSON.stringify(window.__pd)), doc: BC.nascendo.docs().find((x) => x.rel === r), tela: !!document.querySelector('.pd-tela') }), relQ);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    medidas.poderes.semMovimento = { conta: q.doc.conta, pedidos: ['faisca', 'explodir', 'flutuar', 'combo'].map((k) => q.pd[k] - antesQ[k]) };
    assert.deepEqual(medidas.poderes.semMovimento.pedidos, [0, 0, 0, 0], 'sem movimento, nenhum poder');
    assert.equal(q.tela, false, 'nenhum canvas');
    assert.deepEqual(q.doc.conta, { linhas: 3, secoes: 1, blocos: 1, feitos: 1 });
  });

  it('apagado e recriado nasce de novo com os poderes; poder só dentro do rolo; janela oculta: rito sem combo', async () => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    /* espião novo: além de contar, anota todo poder pedido num alvo do rolo cujo centro está FORA da caixa do rolo */
    await page.evaluate(() => {
      window.__pd2 = { faisca: 0, explodir: 0, flutuar: 0, combo: 0, som: 0, textos: [], sons: [], fora: [] };
      const dentro = (el) => {
        const rolo = el && el.closest && el.closest('.nasc-rolo');
        if (!rolo) return true; /* cabeçalho, aba: fora do rolo por desenho */
        const r = el.getBoundingClientRect(), c = rolo.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
        return x >= c.left && x <= c.right && y >= c.top && y <= c.bottom;
      };
      ['faisca', 'explodir', 'flutuar', 'combo', 'som'].forEach((k) => {
        const orig = BC.poderes[k].__orig || BC.poderes[k];
        const f = function () {
          const a = [...arguments];
          window.__pd2[k]++;
          if (k === 'flutuar') window.__pd2.textos.push(String(a[1]));
          if (k === 'som') window.__pd2.sons.push(String(a[0]));
          if ((k === 'explodir' || k === 'flutuar' || k === 'faisca') && !dentro(a[0])) { const l = a[0].closest('.nasc-l'); window.__pd2.fora.push(k + ' na linha ' + (l ? l.dataset.n : '?')); }
          return orig.apply(this, arguments);
        };
        f.__orig = orig;
        BC.poderes[k] = f;
      });
    });
    const semTela = () => page.waitForFunction(() => !document.querySelector('.pd-tela') && !document.querySelector('.pd-bordas'), null, { timeout: 9000 });
    const pronto = (r) => page.waitForFunction((rr) => { const d = BC.nascendo.docs().find((x) => x.rel === rr); return d && !d.nascendo; }, r, { timeout: 10000 });
    const doReg = (tipo, r) => page.evaluate((a) => BC.nascendo.registro().filter((x) => x.tipo === a.tipo && x.rel === a.r), { tipo, r });
    const pd2 = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__pd2)));
    medidas.poderes2 = {};

    /* 1) apagado pelo botão Apagar (BC.arquivosReal.apagar → DELETE /api/arquivo) com a aba do meio aberta: a aba fecha */
    const rel = 'Propostas/recriar.md';
    fs.writeFileSync(path.join(pasta, rel), ['# Primeira versão', '', '## Antes', '- [x] item velho', 'Texto que vai sumir.'].join('\n') + '\n');
    await semTela();
    await simular({ tipo: 'agente-arquivo', dono: 'theus', id: 'ag-rui', nome: 'Rui', caminho: rel, absoluto: path.join(pasta, rel), acao: 'criado' });
    await pronto(rel);
    await semTela();
    await page.waitForFunction((c) => !!(BC.loja.arquivo && BC.loja.arquivo(c)), 'theus/' + rel, { timeout: 5000 }).catch(() => { /* sem a árvore real: vai o mesmo pedido direto */ });
    const via = await page.evaluate((r) => {
      const a = BC.loja.arquivo && BC.loja.arquivo('theus/' + r);
      if (a && BC.arquivosReal && BC.arquivosReal.apagar) { BC.arquivosReal.apagar(a, { onde: 'aba' }); return 'botão Apagar (arquivos-real.js)'; }
      fetch('/api/arquivo?caminho=' + encodeURIComponent(r), { method: 'DELETE', headers: { 'x-coop-quem': 'theus' } });
      return 'DELETE /api/arquivo direto';
    }, rel);
    await page.waitForFunction((r) => !BC.nascendo.docs().some((x) => x.rel === r) && !BC.estacao.ui.abas.some((t) => t.id === 'nascendo:' + r), rel, { timeout: 8000 });
    const ap1 = await doReg('apagado', rel);
    medidas.poderes2.apagar = { via, registro: ap1.slice(-1)[0] };
    assert.equal(fs.existsSync(path.join(pasta, rel)), false, 'o arquivo saiu da pasta compartilhada');
    assert.equal(ap1.length, 1, 'o meio esqueceu o arquivo apagado uma vez');
    assert.equal(ap1[0].aba, true, 'e fechou a aba do meio');

    /* recriado com acao 'criado': nasce de novo linha a linha, com micro-explosões e fecho (não vira edição contra o apagado) */
    const edAntes = await page.evaluate(() => BC.nascendo.contagem().edicoes);
    let antes = await pd2();
    const fechosAntes = (await doReg('fecho', rel)).length; /* a primeira versão já teve o fecho dela */
    const v2 = ['# Segunda versão', '', '## Feito', '- [x] recriado do zero', '- [x] com os poderes', '', '## Próximo', 'Mandar para o Theus.'];
    fs.writeFileSync(path.join(pasta, rel), v2.join('\n') + '\n');
    await simular({ tipo: 'agente-arquivo', dono: 'theus', id: 'ag-rui', nome: 'Rui', caminho: rel, absoluto: path.join(pasta, rel), acao: 'criado' });
    await pronto(rel);
    await page.waitForFunction((a) => BC.nascendo.registro().filter((x) => x.tipo === 'fecho' && x.rel === a.r).length > a.n, { r: rel, n: fechosAntes }, { timeout: 5000 });
    let depois = await pd2();
    const nasc2 = (await doReg('nascer', rel)).slice(-1)[0], fim2 = (await doReg('nasceu', rel)).slice(-1)[0];
    const texto2 = depois.textos.slice(antes.textos.length);
    await print('13-recriado-nasce-com-poderes.png');
    medidas.poderes2.recriado = { nascer: nasc2, nasceu: fim2, explodir: depois.explodir - antes.explodir, textos: texto2 };
    assert.equal(await page.evaluate(() => BC.nascendo.contagem().edicoes), edAntes, 'recriado não é edição');
    assert.equal(nasc2.animar, true, 'nasceu animado');
    assert.equal(fim2.motivo, 'completo');
    assert.equal(texto2.filter((t) => t === '+1 seção').length, 3, 'três títulos, três "+1 seção": ' + texto2.join(' | '));
    assert.equal(texto2.filter((t) => t === '+1 feito').length, 2, 'dois checks, dois "+1 feito"');
    assert.equal(texto2[texto2.length - 1], '8 linhas · 3 seções · 2 feitos', 'o fecho com o total real');
    assert.ok(depois.explodir - antes.explodir >= 6, '5 marcos + o fecho: ' + (depois.explodir - antes.explodir));
    await semTela();

    /* aba do meio fechada e o arquivo some do disco (o agente apagou): o texto guardado sai; recriado, nasce de novo */
    await page.evaluate((r) => BC.estacao.fecharAba('nascendo:' + r), rel);
    fs.unlinkSync(path.join(pasta, rel));
    await page.waitForFunction((r) => BC.nascendo.registro().filter((x) => x.tipo === 'apagado' && x.rel === r).length >= 2, rel, { timeout: 8000 });
    const ap2 = (await doReg('apagado', rel)).slice(-1)[0];
    assert.equal(ap2.aba, false, 'sem aba aberta: só o texto guardado sai');
    const nascAntes = (await doReg('nascer', rel)).length;
    fs.writeFileSync(path.join(pasta, rel), ['# Terceira versão', '- [x] de novo'].join('\n') + '\n');
    await simular({ tipo: 'agente-arquivo', dono: 'theus', id: 'ag-rui', nome: 'Rui', caminho: rel, acao: 'criado' });
    await pronto(rel);
    const nasc3 = await doReg('nascer', rel);
    assert.equal(nasc3.length, nascAntes + 1, 'a aba fechada não guarda o apagado: nasce');
    assert.equal(await page.evaluate(() => BC.nascendo.contagem().edicoes), edAntes);
    await semTela();

    /* 2) rolo longo (60 linhas, 60 ms cada, título e parágrafo alternados): no meio a pessoa rola para o topo. Nenhum poder é
       desenhado com o alvo fora da caixa do rolo (cabeçalho, abas, barra de status); o que nasceu fora da vista não explode */
    const relL = 'Propostas/longo.md';
    const longo = [];
    for (let i = 1; i <= 30; i++) longo.push('## Seção ' + i, 'Parágrafo ' + i + ' com texto de verdade para ocupar a linha inteira do documento.');
    fs.writeFileSync(path.join(pasta, relL), longo.join('\n') + '\n');
    antes = await pd2();
    const marcosForaAntes = await page.evaluate(() => BC.nascendo.contagem().marcosFora);
    await simular({ tipo: 'agente-arquivo', dono: 'theus', id: 'ag-rui', nome: 'Rui', caminho: relL, acao: 'criado' });
    await page.waitForFunction((r) => { const d = BC.nascendo.docs().find((x) => x.rel === r); return d && d.nascidas >= 36; }, relL, { timeout: 8000 });
    const meioL = await page.evaluate(() => { const r = document.querySelector('.nasc-doc:not([hidden]) .nasc-rolo'); return { altura: r.clientHeight, total: r.scrollHeight, topo: r.scrollTop }; });
    await page.evaluate(async () => { const r = document.querySelector('.nasc-doc:not([hidden]) .nasc-rolo'); for (let k = 0; k < 6; k++) { r.scrollTop = 0; await new Promise((ok) => setTimeout(ok, 70)); } });
    await pronto(relL);
    await esperar(900); /* a fila de micro-explosões esvazia */
    depois = await pd2();
    const fimL = await page.evaluate(() => { const r = document.querySelector('.nasc-doc:not([hidden]) .nasc-rolo'); return { topo: r.scrollTop, total: r.scrollHeight, marcosFora: BC.nascendo.contagem().marcosFora }; });
    medidas.poderes2.roloLongo = { rolo: meioL, topoNoFim: fimL.topo, totalNoFim: fimL.total, explodir: depois.explodir - antes.explodir, faisca: depois.faisca - antes.faisca, marcosFora: fimL.marcosFora - marcosForaAntes, fora: depois.fora.slice(antes.fora.length) };
    assert.ok(fimL.total > meioL.altura * 1.5, 'o documento é maior que o rolo: ' + fimL.total + ' × ' + meioL.altura);
    assert.ok(meioL.topo > 0, 'enquanto seguia, o rolo acompanhou o cursor');
    assert.deepEqual(depois.fora.slice(antes.fora.length), [], 'nenhum poder com o alvo fora do rolo');
    assert.ok(depois.explodir - antes.explodir >= 3, 'explodiu no que estava à vista: ' + (depois.explodir - antes.explodir));
    assert.ok(fimL.marcosFora > marcosForaAntes, 'com a pessoa no topo, o que nasceu embaixo não explodiu solto');
    assert.ok(fimL.topo < meioL.altura, 'a pessoa ficou lá em cima (o rolo parou de seguir)');
    await semTela();

    /* 3) janela oculta: o plano fecha e o rito fica no texto, sem canvas, sem combo e sem fogos guardados para a volta */
    const relH = 'notas/escondido.md';
    fs.mkdirSync(path.join(pasta, 'notas'), { recursive: true });
    fs.writeFileSync(path.join(pasta, relH), ['# Escondido', '- [x] escrito com a janela aberta'].join('\n') + '\n');
    await simular({ tipo: 'agente-arquivo', dono: 'theus', id: 'ag-eva', nome: 'Eva', caminho: relH, acao: 'criado' });
    await pronto(relH);
    await semTela();
    antes = await pd2();
    const antesH = await page.evaluate(() => ({ ritos: BC.nascendo.contagem().ritos, telas: window.__telaNasceu || 0 }));
    await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
    await simular({ tipo: 'agente-plano', dono: 'theus', id: 'ag-eva', nome: 'Eva', itens: [{ texto: 'Escrever com a janela oculta', estado: 'feito' }], concluidosAgora: [0] });
    await page.waitForFunction((n) => BC.nascendo.contagem().ritos > n, antesH.ritos, { timeout: 8000 });
    await esperar(500);
    const oculto = await page.evaluate(() => ({
      tela: !!document.querySelector('.pd-tela'), telas: window.__telaNasceu || 0, rito: BC.nascendo.registro().filter((x) => x.tipo === 'rito').slice(-1)[0],
      evitado: BC.nascendo.registro().filter((x) => x.tipo === 'combo-evitado').slice(-1)[0], titulo: !!document.querySelector('.nasc-doc:not([hidden]) .nasc-concluido.on')
    }));
    const pdOculto = await pd2();
    await page.evaluate(() => { delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); });
    await esperar(1600);
    const volta = await page.evaluate(() => ({ tela: !!document.querySelector('.pd-tela'), telas: window.__telaNasceu || 0, visivel: document.visibilityState }));
    depois = await pd2();
    medidas.poderes2.janelaOculta = { rito: oculto.rito, evitado: oculto.evitado, combos: depois.combo - antes.combo, explodir: depois.explodir - antes.explodir, telasNovas: volta.telas - antesH.telas };
    assert.equal(oculto.rito.rel, relH);
    assert.equal(oculto.rito.naTela, false, 'janela oculta não é "na tela"');
    assert.equal(oculto.evitado && oculto.evitado.motivo, 'janela-oculta');
    assert.ok(oculto.titulo, 'o título "Documento concluído" fica no documento');
    assert.equal(oculto.tela, false, 'nenhum canvas dos poderes com a janela oculta');
    assert.equal(pdOculto.combo - antes.combo, 0, 'nenhum combo pedido');
    assert.equal(pdOculto.explodir - antes.explodir, 0, 'nenhuma explosão pedida');
    assert.equal(volta.visivel, 'visible');
    assert.equal(volta.tela, false, 'na volta, nenhum fogo guardado toca');
    assert.equal(volta.telas, antesH.telas, 'o canvas não nasceu em momento nenhum');
    assert.equal(depois.combo - antes.combo, 0);
  });

  it('nenhum erro de página vindo do meio vivo ou do placar', async () => {
    const meus = errosPagina.concat(errosConsole).filter((e) => /nascendo|placar|nasc-|pl-/.test(e));
    assert.deepEqual(meus, []);
  });
});
