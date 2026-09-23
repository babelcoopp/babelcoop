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

  it('nenhum erro de página vindo do meio vivo ou do placar', async () => {
    const meus = errosPagina.concat(errosConsole).filter((e) => /nascendo|placar|nasc-|pl-/.test(e));
    assert.deepEqual(meus, []);
  });
});
