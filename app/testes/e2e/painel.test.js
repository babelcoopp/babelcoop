/* babel-coop · e2e do painel da direita (presença + terminal real), no Electron do app com a janela escondida
   Rodar: cd app && node --test testes/e2e/painel.test.js        (BABEL_COOP_VER=1 mostra a janela)
   Portas deste teste: HTTP 4950, descoberta UDP 41450. Prints e medidas: .deus/terminal-ao-vivo/evidencias/presenca/
   Aceites: A1 zsh · A2 duas abas vivas · A3 visual do Babel Terminal + neon · A4 pasta compartilhada · A13 claude no terminal do app
   (sem mandar prompt) · A15/A17 estados reais da presença pelo pty, sons contados e eco local medido · A20 face Presença com
   mensagens agente-* simuladas (BC.real.simular) e a espiã em BC.real.enviar.
   Nada de Google Chrome: é o Electron do próprio app (testes/e2e/estacao.js).
*/
'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { abrirEstacao } = require('./estacao');

const EV = process.env.BABEL_TESTE_EVIDENCIAS ? path.join(process.env.BABEL_TESTE_EVIDENCIAS, 'presenca') : path.join(__dirname, '..', '..', '..', '.deus', 'terminal-ao-vivo', 'evidencias', 'presenca');
fs.mkdirSync(EV, { recursive: true });
const resultado = { quando: new Date().toISOString(), aceites: {} };
let e = null, page = null, eu = null;
const erros = [];

const SIM = /Yes,? I trust|Yes, proceed/i;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
async function print(nome, soPainel) {
  const alvo = path.join(EV, nome + '.png');
  if (soPainel) await page.locator('#e-painel').screenshot({ path: alvo, timeout: 15000 });
  else await page.screenshot({ path: alvo, timeout: 15000 });
  return alvo;
}
const sessoes = () => page.evaluate(() => BC.terminalReal.sessoes());
const ler = (id, n) => page.evaluate(([i, k]) => BC.terminalReal.ler(i, k), [id, n || 200]);
async function esperarBuffer(id, re, ms = 20000) {
  const fim = Date.now() + ms;
  let txt = '';
  while (Date.now() < fim) { txt = await ler(id, 400); if (re.test(txt)) return txt; await esperar(150); }
  throw new Error('o buffer de ' + id + ' não mostrou ' + re + '. Últimas linhas:\n' + txt.split('\n').slice(-12).join('\n'));
}
async function esperarEstado(id, estados, ms = 15000) {
  const fim = Date.now() + ms;
  let s = null;
  while (Date.now() < fim) { s = (await sessoes()).find((x) => x.id === id); if (s && estados.includes(s.estado)) return s; await esperar(60); }
  throw new Error('a sessão ' + id + ' não chegou a ' + estados.join('/') + ' (está em ' + (s && s.estado) + ')');
}
/* digita com o teclado de verdade no xterm da aba ativa (keydown → xterm → onData → term-entrada → pty) */
async function digitarNoTerminal(texto, enter = true) {
  await page.evaluate(() => { BC.terminalReal.face('terminal'); document.querySelector('.tr-sessao:not([hidden]) .xterm-helper-textarea').focus(); });
  await page.keyboard.type(texto, { delay: 8 });
  if (enter) await page.keyboard.press('Enter');
}
const simular = (m) => page.evaluate((x) => BC.real.simular(Object.assign({ dono: BC.terminalReal.eu() }, x)), m);

before(async () => {
  e = await abrirEstacao({ nome: 'painel', porta: 4950, descoberta: 41450 });
  page = e.page;
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') erros.push({ tipo: m.type(), texto: m.text(), url: (m.location() || {}).url || '' }); });
  page.on('pageerror', (x) => erros.push({ tipo: 'pageerror', texto: x.message, url: x.stack || '' }));
  await page.waitForLoadState('domcontentloaded');
  /* fundar pela API e recarregar: a Estação vira a da pessoa "Teste Painel" */
  const f = await e.api('/api/fundar', { nome: 'Teste Painel' });
  assert.equal(f.pronto, true, 'fundar: ' + JSON.stringify(f));
  eu = f.id;
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => window.BC && BC.terminalReal && BC.terminalReal.pronto() && BC.terminalReal.sessoes().some((s) => s.aberta), null, { timeout: 30000 });
  /* painel mais largo para os prints (o padrão é 360 px) */
  await page.evaluate(() => { BC.estacao.ui.termW = 520; BC.estacao.alternarTerminal(true); });
  await esperarBuffer('assistente', /\S/, 20000); /* o prompt do zsh da pessoa */
  resultado.pasta = e.raiz;
});

after(async () => {
  resultado.errosDoConsole = erros.filter((x) => !/Electron Security Warning/.test(x.texto));
  try { resultado.medidasPainel = await page.evaluate(() => BC.terminalReal.medidas()); resultado.organismo = await page.evaluate(() => BC.organismo.contagem()); } catch (x) { /* a página já pode ter fechado */ }
  fs.writeFileSync(path.join(EV, 'resultado.json'), JSON.stringify(resultado, null, 2));
  if (e) await e.fechar();
});

test('sem terminal simulado: BC.Terminal é o painel real, a aba "Assistente" nasceu com o pty', async () => {
  const info = await page.evaluate(() => { const s = document.querySelector('.tr-sessao:not([hidden])'); return { real: BC.Terminal !== BC.TerminalSimulado, abas: BC.terminalReal.sessoes(), vivo: s.dataset.vivo, hud: getComputedStyle(s.querySelector('.tr-cab')).backdropFilter, heroi: s.dataset.vazio, agente: document.documentElement.dataset.agente || '' }; });
  resultado.repouso = info;
  assert.equal(info.vivo, 'nao', 'HUD ligado em repouso');
  assert.equal(info.hud, 'none');
  assert.equal(info.heroi, 'sim');
  assert.equal(info.agente, '');
  assert.ok(info.real);
  assert.equal(info.abas[0].id, 'assistente');
  assert.ok(info.abas[0].pid > 0);
  await print('00-presenca-heroi');
  await print('00-presenca-heroi-painel', true);
});

test('A1 · zsh de verdade no xterm do app (echo $SHELL; ps -p $$ -o comm=)', async () => {
  await digitarNoTerminal('echo SHELL=$SHELL; ps -p $$ -o comm=');
  const txt = await esperarBuffer('assistente', /^SHELL=\S+\n\s*-?[\w\/]*zsh\s*$/m);
  const linhas = txt.split('\n');
  const shell = linhas.map((l) => (l.match(/^SHELL=(\S+)/) || [])[1]).filter(Boolean).pop();
  const comm = linhas[linhas.findIndex((l) => /^SHELL=/.test(l)) + 1].trim();
  resultado.aceites.A1 = { shell, comm };
  assert.match(shell, /zsh$/);
  assert.match(comm, /^-?(\/bin\/)?zsh$/);
  await print('a1-zsh', true);
});

test('A4 · o terminal abre na pasta compartilhada (<raiz>/<id>)', async () => {
  await digitarNoTerminal('echo PWD=$(pwd)');
  const txt = await esperarBuffer('assistente', /^PWD=\//m);
  const pwd = txt.split('\n').map((l) => (l.match(/^PWD=(.+)$/) || [])[1]).filter(Boolean).pop().trim();
  const esperado = path.join(e.raiz, eu);
  resultado.aceites.A4 = { pwd, esperado };
  assert.equal(fs.realpathSync(pwd), fs.realpathSync(esperado));
});

test('A3 · visual do Babel Terminal: fundo #060b16, degradê no texto padrão, ANSI preservado, b em neon liga e desliga', async () => {
  await digitarNoTerminal("printf '\\033[31mVERMELHO\\033[0m texto-padrao\\n'");
  await esperarBuffer('assistente', /^VERMELHO texto-padrao$/m);
  await esperar(300);
  const est = await page.evaluate(() => {
    const s = document.querySelector('.tr-sessao:not([hidden])');
    const x = s.querySelector('.tr-xterm'), vp = s.querySelector('.xterm-viewport');
    const linha = Array.from(s.querySelectorAll('.xterm-rows > div')).find((d) => /^VERMELHO texto-padrao/.test(d.textContent));
    const spans = linha ? Array.from(linha.querySelectorAll('span')) : [];
    const verm = spans.find((sp) => sp.textContent.includes('VERMELHO'));
    const padrao = spans.find((sp) => sp.textContent.includes('texto-padrao'));
    const cs = (el) => el ? getComputedStyle(el) : null;
    const marca = s.querySelector('.bc-marca-b');
    return {
      fundoCorpo: cs(x).backgroundColor, fundoViewport: cs(vp).backgroundColor,
      padrao: padrao ? { cor: cs(padrao).color, fundo: cs(padrao).backgroundImage, clip: cs(padrao).backgroundClip || cs(padrao).webkitBackgroundClip, fixo: cs(padrao).backgroundAttachment } : null,
      vermelho: verm ? { classe: verm.className, cor: cs(verm).color } : null,
      paradas: [x.style.getPropertyValue('--tr-g0'), x.style.getPropertyValue('--tr-g1'), x.style.getPropertyValue('--tr-g2')],
      fonte: cs(s.querySelector('.xterm-rows')).fontFamily,
      neon: marca && marca.getAttribute('data-neon'), neonBotao: document.querySelector('[data-tr="neon"]').getAttribute('aria-pressed')
    };
  });
  resultado.aceites.A3 = { estilos: est };
  assert.equal(est.fundoCorpo, 'rgb(6, 11, 22)');
  assert.equal(est.fundoViewport, 'rgb(6, 11, 22)');
  assert.ok(est.padrao && /linear-gradient/.test(est.padrao.fundo), 'texto padrão sem degradê: ' + JSON.stringify(est.padrao));
  assert.equal(est.padrao.clip, 'text');
  assert.equal(est.padrao.cor, 'rgba(0, 0, 0, 0)');
  assert.ok(est.vermelho && /xterm-fg-1/.test(est.vermelho.classe), 'ANSI vermelho perdido: ' + JSON.stringify(est.vermelho));
  assert.equal(est.neon, 'sim');
  await print('a3-terminal-neon-ligado', true);
  /* desliga e liga o neon (preferência 'babel-coop:neon') */
  await page.click('[data-tr="neon"]');
  const desligado = await page.evaluate(() => ({ marca: document.querySelector('.tr-sessao:not([hidden]) .bc-marca-b').getAttribute('data-neon'), guardado: localStorage.getItem('babel-coop:neon'), botao: document.querySelector('[data-tr="neon"]').getAttribute('aria-pressed') }));
  await print('a3-terminal-neon-desligado', true);
  await page.click('[data-tr="neon"]');
  const religado = await page.evaluate(() => ({ marca: document.querySelector('.tr-sessao:not([hidden]) .bc-marca-b').getAttribute('data-neon'), guardado: localStorage.getItem('babel-coop:neon') }));
  resultado.aceites.A3.neon = { desligado, religado };
  assert.deepEqual([desligado.marca, desligado.guardado, desligado.botao], ['nao', '0', 'false']);
  assert.deepEqual([religado.marca, religado.guardado], ['sim', '1']);
});

test('A2 · duas abas (dois agentes) com shells diferentes, vivos ao mesmo tempo', async () => {
  await page.click('[data-tr="nova"]');
  await page.fill('#tr-ag-nome', 'Rita');
  await page.fill('#tr-ag-faz', 'revisa textos e testa páginas');
  await page.check('#tr-ag-so');
  await page.click('[data-tr="nova-criar"]');
  await page.waitForFunction(() => BC.terminalReal.sessoes().length === 2 && BC.terminalReal.sessoes().every((s) => s.aberta), null, { timeout: 20000 });
  const lista = await sessoes();
  const rita = lista.find((s) => s.nome === 'Rita');
  assert.ok(rita, 'aba Rita');
  assert.equal(await page.evaluate(() => BC.terminalReal.ativa()), rita.id);
  await esperarBuffer(rita.id, /\S/);
  await digitarNoTerminal('echo PID=$$');
  const tRita = await esperarBuffer(rita.id, /^PID=\d+/m);
  await page.evaluate(() => BC.terminalReal.abrirAba('assistente'));
  await digitarNoTerminal('echo PID=$$');
  const tAss = await esperarBuffer('assistente', /^PID=\d+/m);
  const pid = (t) => +t.split('\n').map((l) => (l.match(/^PID=(\d+)/) || [])[1]).filter(Boolean).pop();
  const pids = { assistente: pid(tAss), rita: pid(tRita) };
  const vivos = Object.values(pids).map((p) => { try { process.kill(p, 0); return true; } catch (x) { return false; } });
  resultado.aceites.A2 = { pids, vivos, servidor: lista.map((s) => ({ id: s.id, pid: s.pid })) };
  assert.notEqual(pids.assistente, pids.rita);
  assert.deepEqual(vivos, [true, true]);
  assert.ok(lista.every((s) => pids[s.id === 'assistente' ? 'assistente' : 'rita'] === s.pid), 'o pid do shell é o do servidor');
  await print('a2-duas-abas', true);
});

test('A15/A17 · estados reais pelo pty: rodando, terminou com pulso e tique, falhou, pausado, visitante; eco local com efeitos', async () => {
  const id = 'assistente';
  await page.evaluate(() => { BC.terminalReal.abrirAba('assistente'); BC.terminalReal.face('presenca'); BC.organismo.zerar(); });
  /* rodando: sleep 3 (Enter acorda a presença) */
  await page.evaluate(() => BC.terminalReal.digitar('assistente', 'sleep 3\r'));
  const rod = await esperarEstado(id, ['rodando']);
  await esperar(1300);
  const cabRodando = await page.evaluate(() => document.querySelector('.tr-sessao:not([hidden]) .tr-linha2').textContent);
  await print('a15-rodando', true);
  const antesSom = await page.evaluate(() => BC.organismo.contagem());
  /* terminou (≥ 2 s): pulso roxo → ciano até a aba + faíscas + tique */
  await esperarEstado(id, ['terminou'], 8000);
  await esperar(250);
  await print('a15-terminou-pulso', true);
  await esperar(1200);
  const depois = await page.evaluate(() => ({ c: BC.organismo.contagem(), reg: BC.organismo.registro().slice(-12), cab: document.querySelector('.tr-sessao:not([hidden]) .tr-linha2').textContent }));
  await print('a15-terminou', true);
  /* falhou: um comando de 2 s que termina com erro na saída → pulso vermelho + som 'erro' */
  await page.evaluate(() => BC.terminalReal.digitar('assistente', 'sleep 2.2; echo "Error: falhou de propósito"\r'));
  await esperarEstado(id, ['rodando']);
  await esperarEstado(id, ['falhou'], 8000);
  await esperar(1100); /* o som 'erro' toca quando o pulso vermelho chega na aba (≈ 600 ms) */
  await print('a15-falhou', true);
  const falhou = await page.evaluate(() => BC.organismo.contagem());
  /* pausa deste terminal: ⏸ no cabeçalho → term-pausar → a presença esfria e o b apaga */
  await page.click('.tr-sessao:not([hidden]) .tr-vivo');
  await esperarEstado(id, ['pausado']);
  await esperar(700);
  const pausa = await page.evaluate(() => ({ marca: document.querySelector('.tr-sessao:not([hidden]) .bc-marca-b').getAttribute('data-pausa'), botao: document.querySelector('.tr-sessao:not([hidden]) .tr-vivo').textContent, pres: document.querySelector('.tr-sessao:not([hidden]) .tr-pres .bc-presenca').getAttribute('data-estado') }));
  await print('a15-pausado', true);
  await page.click('.tr-sessao:not([hidden]) .tr-vivo');
  await page.waitForFunction(() => !BC.terminalReal.sessoes()[0].pausada, null, { timeout: 5000 });
  /* alguém entrou no meu terminal (lista de controles do servidor): arco na cor da pessoa, selo e 'duas' */
  const somAntesVisita = await page.evaluate(() => (BC.organismo.contagem().somPedido.duas || 0));
  await simular({ tipo: 'controles', lista: [{ id: 'ct-teste', dono: eu, quem: 'carla', sessao: 'assistente', estado: 'ativo', direto: true, ts: Date.now() }] });
  await esperar(500);
  const visita = await page.evaluate(() => ({ selo: document.querySelector('.tr-sessao:not([hidden]) .tr-selo').textContent, arcos: document.querySelectorAll('.tr-sessao:not([hidden]) .bc-p-visita').length, duas: BC.organismo.contagem().somPedido.duas || 0 }));
  await print('a15-visitante', true);
  await simular({ tipo: 'controles', lista: [] });
  await esperar(400);
  /* eco local: 50 teclas no xterm com os efeitos ligados (tecla → saída → dois quadros) */
  await page.evaluate(() => {
    BC.terminalReal.face('terminal');
    const ta = document.querySelector('.tr-sessao:not([hidden]) .xterm-helper-textarea');
    const M = window.__eco = { t0: [], t1: [], pend: false };
    ta.addEventListener('keydown', (ev) => { if (ev.key.length === 1) { M.t0.push(performance.now()); M.pend = true; } }, true);
    BC.real.ouvir((m) => {
      if (m.tipo !== 'term-saida' || m.id !== 'assistente' || !M.pend) return;
      M.pend = false;
      requestAnimationFrame(() => requestAnimationFrame(() => M.t1.push(performance.now())));
    });
    ta.focus();
  });
  const letras = 'abcdefghijklmnopqrstuvwxyz';
  for (let i = 0; i < 50; i++) {
    await page.keyboard.press(letras[i % 26]);
    await page.waitForFunction((n) => window.__eco.t1.length >= n, i + 1, { timeout: 5000, polling: 5 });
  }
  const eco = await page.evaluate(() => window.__eco.t1.map((t, i) => t - window.__eco.t0[i]));
  await page.keyboard.press('Control+U');
  const ord = eco.slice().sort((a, b) => a - b), q = (p) => +ord[Math.min(ord.length - 1, Math.floor(p * ord.length))].toFixed(1);
  const somFinal = await page.evaluate(() => BC.organismo.contagem());
  resultado.aceites.A15 = {
    rodando: { estado: rod.estado, cabecalho: cabRodando }, terminou: { cabecalho: depois.cab, registro: depois.reg },
    falhou: { somErro: falhou.somPedido.erro || 0 }, pausa, visita
  };
  resultado.aceites.A17 = { sonsPedidos: somFinal.somPedido, sonsTocados: somFinal.somTocado, sonsBloqueados: somFinal.somBloqueado, eco: { n: eco.length, p50: q(0.5), p95: q(0.95), max: q(0.999) }, maxEfeitosVivos: somFinal.maxVivos };
  assert.match(cabRodando, /rodando há \d+ s/);
  assert.ok(depois.c.pulso > antesSom.pulso, 'sem pulso no terminou');
  assert.ok((depois.c.somPedido.tique || 0) >= 1, 'sem tique no terminou');
  assert.match(depois.cab, /terminou · \d\d:\d\d · [34] s/);
  assert.equal(falhou.somPedido.erro || 0, 1, 'som de erro: ' + (falhou.somPedido.erro || 0));
  assert.equal(somFinal.somPedido.erro || 0, 1, 'o terminou repetido (bytes do eco) reacendeu o erro');
  assert.equal(pausa.marca, 'sim'); assert.equal(pausa.pres, 'pausado'); assert.match(pausa.botao, /pausado/);
  assert.match(visita.selo, /está no seu terminal Assistente/);
  assert.equal(visita.arcos, 1);
  assert.equal(visita.duas, somAntesVisita + 1);
  assert.equal(eco.length, 50);
  assert.ok(q(0.95) < 100, 'eco p95 ' + q(0.95) + ' ms');
  assert.ok(somFinal.maxVivos <= 2);
});

test('A13 · claude --version e o claude interativo dentro do terminal do app (sem mandar prompt)', { timeout: 90000 }, async () => {
  const id = 'assistente';
  await page.evaluate(() => { BC.terminalReal.abrirAba('assistente'); BC.terminalReal.face('terminal'); });
  await digitarNoTerminal('clear; claude --version');
  const v = await esperarBuffer(id, /\d+\.\d+\.\d+ \(Claude Code\)/, 30000);
  const versao = (v.match(/(\d+\.\d+\.\d+) \(Claude Code\)/) || [])[1];
  await digitarNoTerminal('clear');
  await esperarEstado(id, ['shell', 'terminou', 'falhou']);
  await page.evaluate(() => BC.terminalReal.face('presenca'));
  await page.waitForSelector('.tr-sessao:not([hidden]) .tr-iniciar:not([hidden]) [data-tr="iniciar"]', { timeout: 5000 });
  await page.click('.tr-sessao:not([hidden]) [data-tr="iniciar"]');
  await page.evaluate(() => BC.terminalReal.face('terminal'));
  /* a tela do Claude Code (a primeira coisa numa pasta nova é o pedido de confiança) */
  const tela = await esperarBuffer(id, /trust|Claude Code|Welcome|╭|│/i, 45000);
  await esperar(2500);
  const telaFinal = await ler(id, 60);
  const comando = (await ler(id, 400)).split('\n').find((l) => /claude -n 'Assistente'/.test(l)) || null;
  await print('a13-claude-no-terminal', true);
  await print('a13-claude-janela');
  const conf = await page.evaluate(() => BC.terminalReal.medidas().confianca);
  const planoConf = await page.evaluate(() => BC.terminalReal.planoConfianca('assistente'));
  const blocoConf = await page.evaluate(() => { const b = document.querySelector('.tr-sessao:not([hidden]) .tr-bloco[data-bid^="confianca-"]'); return b ? b.textContent : null; });
  let espera = null;
  try { espera = await esperarEstado(id, ['espera'], 6000); } catch (x) { espera = null; }
  await page.evaluate(() => BC.terminalReal.face('presenca'));
  await esperar(400);
  await print('a13-claude-presenca', true);
  /* sai com Ctrl+C duas vezes (nunca Enter: não confia na pasta nem manda prompt) */
  await page.evaluate(() => { BC.terminalReal.face('terminal'); document.querySelector('.tr-sessao:not([hidden]) .xterm-helper-textarea').focus(); });
  await page.keyboard.press('Control+C'); await esperar(500); await page.keyboard.press('Control+C');
  let saiu = false;
  for (let i = 0; i < 20 && !saiu; i++) {
    await esperar(500);
    const s = (await sessoes()).find((x) => x.id === id);
    saiu = s.estado === 'shell' || s.estado === 'terminou' || s.estado === 'falhou';
    if (!saiu && i === 8) { await page.keyboard.press('Control+C'); }
  }
  resultado.aceites.A13 = { versao, comandoDoBotao: comando, telaDoClaude: telaFinal.split('\n').filter((l) => l.trim()).slice(-25), confiancaDetectada: conf, planoConfianca: planoConf, blocoConfianca: blocoConf, esperaNaPresenca: !!espera, saiu };
  const vencida = await page.evaluate(() => { const b = document.querySelector('.tr-sessao:not([hidden]) .tr-bloco[data-bid^="confianca-"]'); return b ? { botoes: b.querySelectorAll('[data-tr="ok"]').length, texto: b.textContent } : null; });
  resultado.aceites.A13.confiancaDepoisDeSair = vencida;
  assert.ok(versao, 'claude --version');
  assert.ok(comando, 'o botão Iniciar não digitou claude -n');
  assert.match(tela, /trust|Claude Code|Welcome|╭|│/i);
  assert.ok(saiu, 'o claude não saiu com Ctrl+C');
  if (/trust/i.test(telaFinal)) {
    assert.ok(conf >= 1, 'a tela de confiança não virou bloco espera');
    assert.ok(planoConf && SIM.test(planoConf.sim), 'plano de confiança: ' + JSON.stringify(planoConf));
    assert.equal(vencida && vencida.botoes, 0, 'o bloco de confiança continuou com botão depois que o claude saiu');
  }
});

test('A20 · face Presença com agente-* simulados: b que se desenha uma vez, blocos tipados, plano pulsando item a item, Permitir → agente-ok, campo ❯ → agente-pedido', { timeout: 60000 }, async () => {
  const id = 'assistente';
  await page.evaluate(() => {
    BC.terminalReal.abrirAba('assistente'); BC.terminalReal.face('presenca');
    /* espiã: as mensagens agente-* ficam aqui e não vão ao servidor (os outros term-* seguem) */
    const original = BC.real.enviar; window.__enviados = [];
    BC.real.enviar = (m) => { window.__enviados.push(m); if (!/^agente-/.test(m.tipo)) original(m); };
  });
  await esperar(1500); /* o rito do claude que saiu no teste anterior termina antes de contar */
  await page.evaluate(() => BC.organismo.zerar());
  /* acordou: o b se desenha dentro do mostrador, uma vez */
  await simular({ tipo: 'agente-estado', id, estado: 'acordou', ts: Date.now() });
  await esperar(1400);
  const bDesenhando = await page.evaluate(() => ({ video: !!document.querySelector('.tr-sessao:not([hidden]) .tr-pres video.tr-b-entrada'), medidas: BC.terminalReal.medidas().bEntrada }));
  await print('a20-b-se-desenhando', true);
  await esperar(3500);
  await simular({ tipo: 'agente-estado', id, estado: 'acordou', ts: Date.now() });
  await esperar(300);
  const bDeNovo = await page.evaluate(() => ({ video: !!document.querySelector('.tr-sessao:not([hidden]) .tr-pres video.tr-b-entrada'), medidas: BC.terminalReal.medidas().bEntrada }));
  /* um turno: pedido → pensando → consulta → plano → ação → resultado → falha → espera */
  const t = Date.now();
  await simular({ tipo: 'agente-bloco', id, bloco: { bid: 'b1', tipo: 'pedido', texto: 'cria a proposta da Clínica Vida com agenda, prazo e preço', ts: t } });
  await simular({ tipo: 'agente-estado', id, estado: 'pensando', desde: t, ts: t });
  await simular({ tipo: 'agente-bloco', id, bloco: { bid: 'b2', tipo: 'consulta', titulo: 'o que consultei', arquivos: ['ata-22-09.md', 'precos.csv', 'EQUIPE/Aprendizados/reembolso.md'], ts: t + 1 } });
  const itens = ['Problema e contexto', 'Solução e o que já sabemos', 'Fases e prazo', 'Preço com garantia'];
  await simular({ tipo: 'agente-plano', id, itens: itens.map((x) => ({ texto: x, estado: 'pendente' })), concluidosAgora: [] });
  const pulsos = [];
  for (let i = 0; i < itens.length; i++) {
    await simular({ tipo: 'agente-plano', id, itens: itens.map((x, j) => ({ texto: x, estado: j <= i ? 'feito' : j === i + 1 ? 'andamento' : 'pendente' })), concluidosAgora: [i] });
    await esperar(260);
    if (i === 1) await print('a20-plano-pulso-em-voo', true);
    await esperar(900);
    pulsos.push(await page.evaluate(() => ({ plano: BC.terminalReal.medidas().pulsosPlano, pulso: BC.organismo.contagem().pulso, tique: BC.organismo.contagem().somPedido.tique || 0 })));
  }
  await esperar(900);
  const rito = await page.evaluate(() => ({ ritos: BC.terminalReal.medidas().ritos, duas: BC.organismo.contagem().somPedido.duas || 0, fim: (document.querySelector('.tr-sessao:not([hidden]) .tr-plano-fim') || {}).textContent || '' }));
  await simular({ tipo: 'agente-bloco', id, bloco: { bid: 'b3', tipo: 'acao', titulo: 'escrevi proposta-clinica-vida.md (5 seções)', comando: 'Write proposta-clinica-vida.md', arquivos: ['proposta-clinica-vida.md'], ts: t + 2 } });
  await simular({ tipo: 'agente-bloco', id, bloco: { bid: 'b4', tipo: 'resultado', texto: 'Proposta pronta: agenda com lembrete no WhatsApp, 2 fases, preço com garantia.', prova: { saida: '5 seções · 1.240 palavras · 0 erros', arquivos: ['proposta-clinica-vida.md'] }, ts: t + 3 } });
  await simular({ tipo: 'agente-bloco', id, bloco: { bid: 'b5', tipo: 'falha', titulo: 'o teste da página falhou', texto: 'npm test: 1 falhou (formulário sem rótulo)\n<img src=x onerror="window.__xss=1">', ts: t + 4 } });
  await simular({ tipo: 'agente-espera', id, pid: 'p-1', ferramenta: 'Bash', resumo: 'rm -rf build/ && npm run build', ts: t + 5 });
  await esperar(500);
  const blocos = await page.evaluate(() => BC.terminalReal.blocos('assistente'));
  const dom = await page.evaluate(() => {
    const s = document.querySelector('.tr-sessao:not([hidden])');
    return {
      tipos: Array.from(s.querySelectorAll('.tr-blocos .tr-bloco')).filter((b) => /^(s-|plano-|espera-p)/.test(b.dataset.bid || '')).map((b) => b.dataset.tipo),
      rotulos: Array.from(s.querySelectorAll('.tr-blocos .tr-bloco')).filter((b) => /^(s-|plano-|espera-p)/.test(b.dataset.bid || '')).map((b) => b.querySelector('.tr-rot span').textContent),
      verComando: !!s.querySelector('.tr-bloco[data-tipo="acao"] details summary'),
      xss: !!window.__xss || !!s.querySelector('.tr-blocos img[src="x"]'),
      vivo: s.dataset.vivo, hud: getComputedStyle(s.querySelector('.tr-cab')).backdropFilter, scan: getComputedStyle(s.querySelector('.tr-cab'), '::after').opacity,
      cab: s.querySelector('.tr-linha2').textContent, agenteHtml: document.documentElement.dataset.agente || ''
    };
  });
  await print('a20-blocos-e-espera', true);
  /* [Permitir] → agente-ok */
  await page.click('.tr-sessao:not([hidden]) .tr-bloco[data-bid="espera-p-1"] [data-d="permitir"]');
  await esperar(300);
  const ok = await page.evaluate(() => window.__enviados.filter((m) => m.tipo === 'agente-ok'));
  const decisao = await page.evaluate(() => document.querySelector('.tr-sessao:not([hidden]) .tr-bloco[data-bid="espera-p-1"] .tr-decisao').textContent);
  await print('a20-permitido', true);
  /* receita: preenche o campo e não manda nada */
  await page.click('.tr-sessao:not([hidden]) .tr-receitas button:first-child');
  const receita = await page.evaluate(() => ({ valor: document.querySelector('.tr-sessao:not([hidden]) .tr-entrada').value, n: document.querySelectorAll('.tr-sessao:not([hidden]) .tr-receitas button').length, enviados: window.__enviados.filter((m) => m.tipo === 'agente-pedido').length }));
  await page.fill('.tr-sessao:not([hidden]) .tr-entrada', '');
  /* campo ❯ endereçado → agente-pedido */
  await page.click('.tr-sessao:not([hidden]) .tr-entrada');
  await page.keyboard.type('agora gera a versão curta para o WhatsApp');
  await page.keyboard.press('Enter');
  await esperar(300);
  const pedidos = await page.evaluate(() => window.__enviados.filter((m) => m.tipo === 'agente-pedido'));
  await simular({ tipo: 'agente-estado', id, estado: 'terminou', ts: Date.now() });
  await esperar(900);
  await print('a20-terminou', true);
  const fim = await page.evaluate(() => ({ cab: document.querySelector('.tr-sessao:not([hidden]) .tr-linha2').textContent, c: BC.organismo.contagem() }));
  resultado.aceites.A20 = { receita, bDesenhando, bDeNovo, blocos, dom, pulsos, rito, ok, decisao, pedidos, fim };
  assert.ok(bDesenhando.video, 'o vídeo do b não apareceu no mostrador');
  assert.equal(bDesenhando.medidas, 1);
  assert.equal(bDeNovo.medidas, 1, 'o b se desenhou duas vezes');
  assert.deepEqual(dom.tipos, ['pedido', 'consulta', 'plano', 'acao', 'resultado', 'falha', 'espera']);
  assert.deepEqual(dom.rotulos, ['pedido', 'consulta', 'plano', 'ação', 'resultado', 'falha', 'espera']);
  assert.ok(dom.verComando);
  assert.equal(dom.xss, false, 'texto do servidor virou HTML');
  assert.equal(dom.vivo, 'sim');
  assert.match(dom.hud, /blur/);
  assert.equal(dom.agenteHtml, 'espera');
  assert.deepEqual(pulsos.map((p) => p.plano), [1, 2, 3, 4], 'um pulso por item feito');
  assert.deepEqual(pulsos.map((p) => p.tique), [1, 2, 3, 4], 'um tique por item feito');
  assert.equal(rito.ritos, 1); assert.ok(rito.duas >= 1); assert.match(rito.fim, /concluído · 4 de 4/);
  assert.equal(ok.length, 1);
  assert.deepEqual({ tipo: ok[0].tipo, id: ok[0].id, pid: ok[0].pid, decisao: ok[0].decisao }, { tipo: 'agente-ok', id: 'assistente', pid: 'p-1', decisao: 'permitir' });
  assert.match(decisao, /OK · Teste Painel · \d\d:\d\d/);
  assert.ok(receita.valor.length > 10 && receita.n <= 3 && receita.enviados === 0, 'receita: ' + JSON.stringify(receita));
  assert.equal(pedidos.length, 1);
  assert.equal(pedidos[0].id, 'assistente');
  assert.match(pedidos[0].texto, /^agora gera a versão curta para o WhatsApp/);
});

test('reduced motion: o b vira o pôster parado, o pulso chega sem animar', { timeout: 30000 }, async () => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const rita = (await sessoes()).find((s) => s.nome === 'Rita');
  await page.evaluate((id) => { BC.terminalReal.abrirAba(id); BC.terminalReal.face('presenca'); BC.organismo.zerar(); }, rita.id);
  await simular({ tipo: 'agente-estado', id: rita.id, estado: 'acordou', ts: Date.now() });
  await esperar(200);
  const b = await page.evaluate(() => ({ img: !!document.querySelector('.tr-sessao:not([hidden]) .tr-pres img.tr-b-entrada'), video: !!document.querySelector('.tr-sessao:not([hidden]) .tr-pres video') }));
  await simular({ tipo: 'agente-plano', id: rita.id, itens: [{ texto: 'um', estado: 'pendente' }] });
  await simular({ tipo: 'agente-plano', id: rita.id, itens: [{ texto: 'um', estado: 'feito' }] });
  await esperar(400);
  const reg = await page.evaluate(() => BC.organismo.registro().filter((r) => r.tipo === 'pulso' || r.tipo === 'faiscas'));
  await print('reduzido-rita', true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  resultado.reduzido = { b, reg };
  assert.equal(b.img, true); assert.equal(b.video, false);
  assert.ok(reg.some((r) => r.tipo === 'pulso' && r.motivo === 'sem-movimento'));
});

test('recarregar a página devolve a tela do terminal (term-aberto) sem abrir outro shell', { timeout: 40000 }, async () => {
  await page.evaluate(() => BC.terminalReal.digitar('assistente', 'echo MARCA-RECARGA-$$\r'));
  await esperarBuffer('assistente', /^MARCA-RECARGA-\d+/m);
  const antes = await sessoes();
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => window.BC && BC.terminalReal && BC.terminalReal.pronto() && BC.terminalReal.sessoes().length === 2 && BC.terminalReal.sessoes().every((s) => s.aberta), null, { timeout: 30000 });
  const depois = await sessoes();
  const tela = await ler('assistente', 400);
  resultado.recarregar = { antes: antes.map((s) => s.pid), depois: depois.map((s) => s.pid), telaVoltou: /^MARCA-RECARGA-\d+/m.test(tela) };
  assert.deepEqual(depois.map((s) => s.pid).sort(), antes.map((s) => s.pid).sort());
  assert.match(tela, /^MARCA-RECARGA-\d+/m);
  const meus = erros.filter((x) => /terminal-real/.test(x.url + ' ' + x.texto));
  assert.deepEqual(meus, [], 'erros do painel no console');
});

test('teclas: Ctrl+J alterna as faces fora do terminal; dentro do xterm Ctrl+J e Ctrl+K são do shell, Cmd+J e Cmd+K do app; Ctrl+` recolhe', { timeout: 30000 }, async () => {
  const face = () => page.evaluate(() => BC.terminalReal.sessoes().find((s) => s.id === BC.terminalReal.ativa()).face);
  await page.evaluate(() => { BC.terminalReal.abrirAba('assistente'); BC.terminalReal.face('presenca'); document.querySelector('.tr-sessao:not([hidden]) .tr-entrada').focus(); });
  await page.keyboard.press('Control+J');
  const f1 = await face();
  await page.evaluate(() => document.querySelector('.tr-sessao:not([hidden]) .xterm-helper-textarea').focus());
  await page.keyboard.press('Control+J');
  const f2 = await face();
  await page.keyboard.press('Control+K');
  const paletaCtrlK = await page.evaluate(() => document.getElementById('paleta').hidden);
  await page.keyboard.press('Meta+K');
  const paletaCmdK = await page.evaluate(() => document.getElementById('paleta').hidden);
  await page.keyboard.press('Escape');
  await page.evaluate(() => document.querySelector('.tr-sessao:not([hidden]) .xterm-helper-textarea').focus());
  await page.keyboard.press('Meta+J');
  const f3 = await face();
  await page.evaluate(() => { BC.terminalReal.face('terminal'); document.querySelector('.tr-sessao:not([hidden]) .xterm-helper-textarea').focus(); });
  await page.keyboard.press('Control+Backquote');
  const recolhido = await page.evaluate(() => BC.estacao.ui.term);
  await page.keyboard.press('Control+Backquote');
  const aberto = await page.evaluate(() => BC.estacao.ui.term);
  resultado.teclas = { ctrlJForaDoTerminal: f1, ctrlJNoTerminal: f2, paletaDepoisDeCtrlK: paletaCtrlK ? 'fechada' : 'aberta', paletaDepoisDeCmdK: paletaCmdK ? 'fechada' : 'aberta', cmdJNoTerminal: f3, painelDepoisDeCtrlCrase: recolhido, painelDepoisDeOutroCtrlCrase: aberto };
  assert.equal(f1, 'terminal');
  assert.equal(f2, 'terminal', 'Ctrl+J dentro do xterm é do shell');
  assert.equal(paletaCtrlK, true, 'Ctrl+K dentro do xterm abriu a paleta');
  assert.equal(paletaCmdK, false, 'Cmd+K não abriu a paleta');
  assert.equal(f3, 'presenca');
  assert.equal(recolhido, false); assert.equal(aberto, true);
});

test('agentes: renomear manda term-renomear; × (dois cliques) apaga e fecha o pty; com o servidor de agentes, a aba nova inicia sozinha (agente-iniciar)', { timeout: 40000 }, async () => {
  await page.evaluate(() => {
    const original = BC.real.enviar; window.__env2 = [];
    BC.real.enviar = (m) => { window.__env2.push(m); if (!/^agente-/.test(m.tipo)) original(m); };
  });
  const rita = (await sessoes()).find((s) => s.nome === 'Rita');
  await page.dblclick('.tr-aba[data-id="' + rita.id + '"] .tr-aba-nome');
  await page.fill('.tr-aba[data-id="' + rita.id + '"] .tr-renomear', 'Rita Revisora');
  await page.keyboard.press('Enter');
  await esperar(300);
  const ren = await page.evaluate((id) => ({ msg: window.__env2.filter((m) => m.tipo === 'term-renomear'), aba: document.querySelector('.tr-aba[data-id="' + id + '"] .tr-aba-nome').textContent, loja: (BC.loja.pessoa(BC.terminalReal.eu()).agentes.find((a) => a.id === id) || {}).nome }), rita.id);
  /* × duas vezes: "apagar?" e depois apaga */
  await page.click('.tr-aba[data-id="' + rita.id + '"] .tr-x');
  const confirmar = await page.evaluate((id) => document.querySelector('.tr-aba[data-id="' + id + '"] .tr-x').textContent, rita.id);
  await page.click('.tr-aba[data-id="' + rita.id + '"] .tr-x');
  let vivo = true;
  for (let i = 0; i < 20 && vivo; i++) { await esperar(200); try { process.kill(rita.pid, 0); } catch (x) { vivo = false; } }
  const depois = await sessoes();
  const fechar = await page.evaluate(() => window.__env2.filter((m) => m.tipo === 'term-fechar'));
  /* o servidor anuncia agentes (bemvindo.agentes): a aba nova manda agente-iniciar sozinha */
  await page.evaluate(() => { BC.real.bemvindo.agentes = true; });
  const lia = await page.evaluate(() => BC.terminalReal.novoAgente('Lia', { oQueFaz: 'cuida do WhatsApp da equipe' }));
  await page.waitForFunction(() => window.__env2.some((m) => m.tipo === 'agente-iniciar'), null, { timeout: 8000 });
  const iniciar = await page.evaluate(() => window.__env2.filter((m) => m.tipo === 'agente-iniciar'));
  await print('agentes-lia-iniciando', true);
  await page.evaluate(() => { delete BC.real.bemvindo.agentes; });
  /* selo do dono: Encerrar → controle-encerrar; pedido pendente: Aceitar → controle-aceitar */
  await page.evaluate(() => BC.terminalReal.abrirAba('assistente'));
  await simular({ tipo: 'controles', lista: [{ id: 'ct-a', dono: eu, quem: 'carla', sessao: 'assistente', estado: 'ativo', ts: Date.now() }, { id: 'ct-b', dono: eu, quem: 'davi', sessao: null, estado: 'pedido', ts: Date.now() }] });
  await esperar(300);
  await page.click('.tr-sessao:not([hidden]) [data-tr="encerrar"][data-c="ct-a"]');
  await page.click('.tr-sessao:not([hidden]) [data-tr="aceitar"][data-c="ct-b"]');
  const controles = await page.evaluate(() => window.__env2.filter((m) => /^controle-/.test(m.tipo)));
  await simular({ tipo: 'controles', lista: [] });
  /* fit: o painel muda de largura → term-tamanho → o pty sabe (stty size) */
  await page.evaluate(() => { BC.terminalReal.face('terminal'); BC.estacao.ui.termW = 440; BC.estacao.alternarTerminal(true); });
  /* o painel anima a largura e o fit acompanha: espera o tamanho parar (2 leituras iguais) e o term-tamanho dele já ter saído (sob carga 500 ms não bastam) */
  let dim = null;
  for (let i = 0, antes = ''; i < 40; i++) {
    await esperar(150);
    dim = (await sessoes()).find((s) => s.id === 'assistente');
    const agora = dim.cols + 'x' + dim.rows;
    const saiu = await page.evaluate(([c, r]) => window.__env2.filter((m) => m.tipo === 'term-tamanho' && m.id === 'assistente').slice(-1).some((m) => m.cols === c && m.rows === r), [dim.cols, dim.rows]);
    if (agora === antes && saiu) break;
    antes = agora;
  }
  await page.evaluate(() => BC.terminalReal.digitar('assistente', 'stty size\r'));
  const stty = await esperarBuffer('assistente', new RegExp('^' + dim.rows + ' ' + dim.cols + '$', 'm'), 8000).then(() => true, () => false);
  const tamanhos = await page.evaluate(() => window.__env2.filter((m) => m.tipo === 'term-tamanho' && m.id === 'assistente').slice(-1));
  await page.evaluate(() => { BC.estacao.ui.termW = 520; BC.estacao.alternarTerminal(true); });
  resultado.agentes = { controles, fit: { cols: dim.cols, rows: dim.rows, stty, termTamanho: tamanhos }, renomear: ren, confirmar, fechar, ritaPid: rita.pid, ritaVivo: vivo, abas: depois.map((s) => s.nome), iniciar };
  assert.deepEqual(ren.msg.map((m) => [m.id, m.nome]), [[rita.id, 'Rita Revisora']]);
  assert.equal(ren.aba, 'Rita Revisora'); assert.equal(ren.loja, 'Rita Revisora');
  assert.equal(confirmar, 'apagar?');
  assert.deepEqual(fechar.map((m) => m.id), [rita.id]);
  assert.equal(vivo, false, 'o shell da Rita continuou vivo');
  assert.ok(!depois.some((s) => s.id === rita.id));
  assert.deepEqual(controles.map((m) => [m.tipo, m.id]), [['controle-encerrar', 'ct-a'], ['controle-aceitar', 'ct-b']]);
  assert.ok(stty, 'stty size não bateu com o xterm ' + dim.rows + 'x' + dim.cols);
  assert.deepEqual(tamanhos.map((m) => [m.cols, m.rows]), [[dim.cols, dim.rows]]);
  const meus = erros.filter((x) => /terminal-real/.test(x.url + ' ' + x.texto));
  assert.deepEqual(meus, [], 'erros do painel no console');
  assert.equal(iniciar.length, 1);
  assert.deepEqual({ id: iniciar[0].id, nome: iniciar[0].nome, instrucoes: iniciar[0].instrucoes }, { id: lia, nome: 'Lia', instrucoes: 'cuida do WhatsApp da equipe' });
});
