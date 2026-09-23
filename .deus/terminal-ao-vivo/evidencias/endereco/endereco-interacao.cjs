/* babel-coop · prova do ENDEREÇO por evento real (cliques, teclado, outra pessoa chegando)
   Parte A · protótipo no Electron (route http://coop.local → prototipo/), simulador parado para a prova ser determinística:
     a pessoa abre pela paleta, clica em cada parte do endereço, outra pessoa chega (a mesma ação que o simulador usa),
     Ctrl K "onde está o Bruno" + Enter, planta da sala, "→" (Ir até), rastro do agente, rastro seu, celular, movimento reduzido.
   Parte B · app real com DUAS Estações Electron na rede (Theus funda, Rita entra com token): a Rita abre a landing.html
     na Estação dela e a Estação do Theus acende a chegada (diário → rede → posição → luz dirigida pelo BC.organismo).
   Portas: 5017 (protótipo), 5018 (Theus) e 5019 (Rita), UDP 41517 e 41518. */
'use strict';
const fs = require('fs');
const path = require('path');
const { abrirEstacao, raizTemporaria } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/testes/e2e/estacao.js');
const P = require('./endereco-prova.cjs');

const EVID = P.EVID;
const espera = P.espera;

function checador(res) {
  return (nome, passou, achou) => { res.push({ nome, ok: !!passou, achou: passou ? '' : String(achou === undefined ? '' : typeof achou === 'string' ? achou : JSON.stringify(achou)).slice(0, 300) }); console.log((passou ? '✓ ' : '✗ ') + nome + (passou ? '' : ' · achou: ' + String(typeof achou === 'string' ? achou : JSON.stringify(achou)).slice(0, 200))); };
}
async function ate(page, fn, arg, ms) {
  const fim = Date.now() + (ms || 8000);
  let v;
  while (Date.now() < fim) { v = await page.evaluate(fn, arg); if (v) return v; await espera(100); }
  return v;
}
async function paleta(page, texto) {
  await page.keyboard.press('Control+k');
  await espera(150);
  await page.keyboard.type(texto, { delay: 15 });
  await espera(250);
}
/* abre um arquivo pela paleta: digita e clica no item "Abrir: …" (o primeiro item é "Procurar no acervo") */
async function abrirPelaPaleta(page, texto, caminho) {
  await paleta(page, texto);
  await page.click('#paleta-lista li[data-i]:has-text("Abrir: ' + caminho + '")');
  await espera(700);
}
const cabecalho = () => { const n = document.getElementById('e-endereco'); return n && !n.hidden ? { partes: [...n.querySelectorAll('.end-parte')].map((b) => b.textContent), texto: n.innerText.replace(/\s+/g, ' ') } : null; };

async function parteA(ok, medidas) {
  const E = await P.estacaoProtótipo(5017, 41517, 1440, 900);
  const { page } = E;
  const foto = (n, opt) => page.screenshot({ path: path.join(EVID, 'depois-' + n + '.png'), ...(opt || {}) });
  try {
    await espera(4500); /* o simulador dá um passo "juntos" 5 s depois de ligar, fora do parar(): espera ele passar */
    await page.evaluate(() => { BC.simulador.parar(); BC.estacao.fecharTodas(); BC.loja.fazerComo('davi', 'fazendo', 'editando landing.html'); }); /* o Davi volta à landing pela ação que o app grava */
    medidas.organismoNoProtótipo = await page.evaluate(() => !!(window.BC && BC.organismo && BC.organismo.versao));

    /* 1. abrir pela paleta (teclado de verdade) */
    await abrirPelaPaleta(page, 'landing.html', 'davi/Projetos/Clínicas/landing.html');
    const c1 = await page.evaluate(cabecalho);
    ok('A1 · o cabeçalho do objeto mostra Sala › bancada › peça', c1 && c1.partes.join(' | ') === 'Clínicas em Campinas | Tela · Davi | landing.html', c1);
    ok('A1 · a trilha antiga do editor sai quando o endereço aparece', await page.evaluate(() => { const t = document.querySelector('.ed-trilha'); return !t || getComputedStyle(t).display === 'none'; }), 'trilha visível');
    ok('A1 · Davi está com o objeto (o que o app já grava em "fazendo")', await page.evaluate(() => !!document.querySelector('#e-endereco [data-end-pessoa="davi"]')), c1);
    await espera(900);
    const pos = await page.evaluate(() => (BC.loja.estado.posicoes || {}).theus || null);
    ok('A1 · a posição de quem abriu vira estado da equipe (ação posicao)', pos && pos.chave === 'arquivo:fp4' && pos.sala === 'Clínicas em Campinas', pos);
    await foto('cabecalho-arquivo');

    /* 2. clicar em cada parte */
    await page.click('#e-endereco .end-p-sala');
    await espera(400);
    ok('A2 · clicar na sala abre o projeto', await page.evaluate(() => { const t = BC.estacao.abaAtual(); return t.tipo === 'projeto' && t.ref === 'clinicas'; }), await page.evaluate(() => BC.estacao.abaAtual().tipo));
    ok('A2 · o endereço do projeto é a sala', await page.evaluate(() => /Clínicas em Campinas › visão do projeto|Clínicas em Campinas/.test(document.getElementById('e-endereco').innerText)), await page.evaluate(cabecalho));
    await page.click('.e-aba[data-id="arq:fp4"]');
    await espera(400);
    await page.click('#e-endereco .end-p-bancada');
    await espera(500);
    const banc = await page.evaluate(() => ({ projeto: BC.estacao.ui.projetoAtivo, linha: !!document.querySelector('#e-lateral .arv-arq[data-id="fp4"]'), luz: (() => { const l = document.querySelector('#e-lateral .arv-arq[data-id="fp4"]'); return l ? +(l.style.getPropertyValue('--luz') || 0) : -1; })() }));
    ok('A2 · clicar na bancada abre o Criar do projeto com a linha do arquivo acesa', banc.projeto === 'clinicas' && banc.linha && banc.luz > 0.3, banc);
    await foto('bancada-acesa');
    await page.click('#e-endereco .end-p-peca');
    await espera(250);
    const toast = await page.evaluate(() => document.getElementById('e-toast').textContent);
    ok('A2 · clicar na peça copia o endereço inteiro', /Endereço copiado: Clínicas em Campinas › Tela · Davi › landing\.html/.test(toast), toast);
    await page.evaluate(() => { BC.estacao.ui.projetoAtivo = null; BC.estacao.render(); });

    /* 3. alguém chega no mesmo objeto (a mesma ação que o simulador usa: vendoArquivo) */
    const t0 = Date.now();
    await page.evaluate(() => BC.loja.fazerComo('carla', 'vendoArquivo', 'fp4'));
    const chegada = await ate(page, () => { const a = document.querySelector('#e-endereco [data-end-pessoa="carla"]'); const n = document.getElementById('e-endereco'); return a && /Carla chegou/.test(n.innerText) ? { luz: +(a.style.getPropertyValue('--luz') || 0), classe: n.className, vivo: n.querySelector('.end-vivo').textContent, linhaArvore: !!document.querySelector('#e-lateral .arv-arq[data-id="fp4"] [data-end-pessoa="carla"]') } : null; }, null, 3000);
    medidas.chegadaMs = Date.now() - t0;
    ok('A3 · luz dirigida: o anel da Carla acende no cabeçalho e diz "Carla chegou"', chegada && chegada.luz > 0.5 && /end-chegada/.test(chegada.classe), chegada);
    ok('A3 · leitor de tela ouve a chegada (aria-live)', chegada && /Carla chegou em landing\.html/.test(chegada.vivo), chegada);
    ok('A3 · presença vira posição ao lado do arquivo na árvore', chegada && chegada.linhaArvore, chegada);
    await foto('chegada-acesa');
    const hd = await page.locator('#e-endereco').boundingBox();
    await page.screenshot({ path: path.join(EVID, 'depois-chegada-cabecalho.png'), clip: { x: hd.x, y: hd.y - 34, width: hd.width, height: hd.height + 40 } });
    await espera(7000);
    const esfriou = await page.evaluate(() => { const a = document.querySelector('#e-endereco [data-end-pessoa="carla"]'); return a ? +(a.style.getPropertyValue('--luz') || 0) : -1; });
    ok('A3 · a luz esfria sozinha (meia-vida de 6 s)', esfriou >= 0 && esfriou < 0.5 && esfriou < chegada.luz, { antes: chegada && chegada.luz, depois: esfriou });
    medidas.luzChegada = { acesa: chegada && chegada.luz, depois7s: esfriou };
    await page.screenshot({ path: path.join(EVID, 'depois-chegada-esfriou.png'), clip: { x: hd.x, y: hd.y - 34, width: hd.width, height: hd.height + 40 } });
    await page.click('#e-endereco .end-anel[data-end-pessoa="carla"]');
    await espera(350);
    const rc = await page.evaluate(() => { const p = document.getElementById('end-pop'); return p && !p.hidden ? { titulo: p.querySelector('.end-pop-tit b').textContent, sub: p.querySelector('.end-pop-tit small').textContent, paradas: p.querySelectorAll('.end-parada').length, agora: p.querySelector('.end-pop-agora').innerText } : null; });
    ok('A3 · clicar no anel de quem está aqui abre o rastro dela (só o que já é público)', rc && /Carla · por onde passou/.test(rc.titulo) && /público/.test(rc.sub) && rc.paradas >= 2 && /landing\.html/.test(rc.agora), rc);
    await foto('rastro-carla');
    await page.keyboard.press('Escape');
    await espera(150);

    /* 4. Ctrl K "onde está o Bruno" + Enter = Ir até */
    await paleta(page, 'onde está o bruno');
    const lista = await page.evaluate(() => document.getElementById('paleta-lista').innerText);
    ok('A4 · Ctrl K mostra o grupo "Onde estão" com a posição do Bruno', /ONDE ESTÃO|Onde estão/i.test(lista) && /Bruno/.test(lista) && /terminal Bruno-bot/.test(lista), lista.slice(0, 200));
    await foto('paleta-onde-bruno');
    await page.keyboard.press('Enter');
    await espera(600);
    const ir = await page.evaluate(() => ({ tab: BC.estacao.abaAtual().tipo, termPessoa: BC.estacao.ui.termPessoa, cab: document.getElementById('e-endereco').innerText.replace(/\s+/g, ' ') }));
    ok('A4 · Enter em "Ir até" abre o objeto onde o Bruno está (terminal dele)', ir.tab === 'terminais' && ir.termPessoa === 'bruno' && /terminal de Bruno/.test(ir.cab) && /você chegou onde Bruno está/.test(ir.cab), ir);
    await foto('ir-ate-bruno');
    await paleta(page, 'onde');
    const onde = await page.evaluate(() => [...document.querySelectorAll('#paleta-lista li[data-i]')].slice(0, 14).map((li) => li.innerText.replace(/\s+/g, ' ')));
    ok('A4 · "onde" lista pessoas e agentes com a posição e "Ir até"', onde.length >= 8 && onde.filter((t) => /Ir até/.test(t)).length >= 6, onde);
    await foto('paleta-onde');
    medidas.paletaOnde = onde;
    await page.keyboard.press('Escape');

    /* 5. planta da sala (clique no ícone Equipe) e → (Ir até) */
    await page.evaluate(() => { BC.loja.fazerComo('davi', 'fazendo', 'na Máquina do projeto'); });
    await page.click('.e-atividades [data-acao="atividade"][data-id="equipe"]');
    await espera(500);
    const planta = await page.evaluate(() => { const p = document.querySelector('#e-lateral .end-planta'); if (!p) return null; return { salas: [...p.querySelectorAll('.end-sala')].map((s) => s.querySelector('.end-sala-nome').textContent + ': ' + [...s.querySelectorAll('.end-gente-txt b')].map((b) => b.textContent).join(', ')), minha: (p.querySelector('.end-sala.minha .end-sala-nome') || {}).textContent, luzDavi: +((p.querySelector('[data-end-pessoa="davi"]') || { style: { getPropertyValue: () => 0 } }).style.getPropertyValue('--luz') || 0) }; });
    ok('A5 · a lateral de Equipe mostra a planta: pessoas por sala/projeto', planta && planta.salas.length >= 4 && planta.salas.some((s) => /^Clínicas em Campinas: .*Davi/.test(s)) && planta.salas.some((s) => /^Terminais: .*(você|Bruno)/.test(s)), planta);
    ok('A5 · a sala onde você está (Equipe, aberta pelo ícone) é a superfície viva (vidro)', planta && planta.minha === 'Equipe' && (await page.evaluate(() => { const s = document.querySelector('#e-lateral .end-sala.minha'); return s ? getComputedStyle(s).borderTopColor : ''; })) === 'rgba(63, 227, 255, 0.22)', planta);
    await foto('planta');
    const lat = await page.locator('#e-lateral').boundingBox();
    await page.screenshot({ path: path.join(EVID, 'depois-planta-lateral.png'), clip: lat });
    medidas.planta = planta;
    await page.click('#e-lateral .end-planta [data-acao="end-ir-ate"][data-id="davi"]');
    await espera(600);
    const foi = await page.evaluate(() => ({ tab: BC.estacao.abaAtual().tipo, ref: BC.estacao.abaAtual().ref, cab: document.getElementById('e-endereco').innerText.replace(/\s+/g, ' ') }));
    ok('A5 · → na planta leva até onde o Davi está (a Máquina do projeto)', foi.tab === 'maquina' && foi.ref === 'clinicas' && /Clínicas em Campinas › Máquina/.test(foi.cab) && /Davi/.test(foi.cab), foi);
    await foto('ir-ate-davi-maquina');

    /* 6. rastro do agente ("por onde passou"): cada parada com hora e o que fez, luz que esfria */
    await page.click('.e-atividades [data-acao="atividade"][data-id="equipe"]');
    await espera(400);
    await page.evaluate(() => { const ls = BC.loja.estado.terminais.bruno; const t = Date.now(); BC.loja.fazerComo('bruno', 'terminal', [{ tipo: 'prompt', texto: 'Resuma a proposta-clinicas.md em 5 linhas para o WhatsApp.', agente: 'bruno-ag1' }, { tipo: 'ia', texto: 'Pronto: 5 linhas com escopo, prazo e investimento.', agente: 'bruno-ag1' }]); return ls.length; });
    await espera(300);
    await page.click('#e-lateral .end-planta [data-acao="end-rastro"][data-id="ag:bruno-ag1"]');
    await espera(500);
    const r1 = await page.evaluate(() => { const p = document.getElementById('end-pop'); if (!p || p.hidden) return null; return { titulo: p.querySelector('.end-pop-tit b').textContent, paradas: [...p.querySelectorAll('.end-parada')].map((li) => ({ hora: li.querySelector('time').textContent, onde: li.querySelector('.end-parada-ir').textContent, oque: li.querySelector('small').textContent.slice(0, 60), luz: +li.style.getPropertyValue('--luz') })) }; });
    ok('A6 · rastro do agente abre com as paradas (hora, endereço, o que fez)', r1 && r1.paradas.length >= 2 && r1.paradas.every((x) => /^\d\d:\d\d$|^ontem$|^\d\d\/\d\d$/.test(x.hora) && x.onde && x.oque), r1);
    ok('A6 · a parada nova é a mais acesa (luz que esfria com o tempo)', r1 && r1.paradas[0].luz > 0.9 && r1.paradas[0].luz > r1.paradas[r1.paradas.length - 1].luz, r1 && r1.paradas.map((x) => x.luz));
    ok('A6 · a parada do pedido aponta para o arquivo citado (proposta-clinicas.md)', r1 && /proposta-clinicas\.md/.test(r1.paradas[0].onde), r1 && r1.paradas[0]);
    await foto('rastro-agente');
    const pop = await page.locator('#end-pop').boundingBox();
    if (pop) await page.screenshot({ path: path.join(EVID, 'depois-rastro-balao.png'), clip: { x: pop.x - 8, y: pop.y - 8, width: pop.width + 16, height: pop.height + 16 } });
    medidas.rastroBruno = r1;
    await page.click('#end-pop .end-parada-ir[data-i="0"]');
    await espera(600);
    const abriu = await page.evaluate(() => { const t = BC.estacao.abaAtual(), a = t.tipo === 'arquivo' ? BC.loja.arquivo(t.ref) : null; return { tipo: t.tipo, arq: a && a.caminho, pop: !!document.getElementById('end-pop') && !document.getElementById('end-pop').hidden }; });
    ok('A6 · clicar numa parada abre aquele objeto', abriu.tipo === 'arquivo' && /proposta-clinicas\.md$/.test(abriu.arq) && !abriu.pop, abriu);

    /* 7. o seu rastro: a paleta "por onde passou você" */
    await paleta(page, 'por onde passou você');
    await page.keyboard.press('Enter');
    await espera(500);
    const eu = await page.evaluate(() => { const p = document.getElementById('end-pop'); return p && !p.hidden ? [...p.querySelectorAll('.end-parada-ir')].map((b) => b.textContent) : null; });
    ok('A7 · o seu rastro mostra por onde você passou hoje (landing, Máquina, terminal do Bruno)', eu && eu.some((t) => /landing\.html/.test(t)) && eu.some((t) => /Máquina/.test(t)) && eu.some((t) => /terminal de Bruno/.test(t)), eu);
    await foto('rastro-seu');
    await page.keyboard.press('Escape');
    ok('A7 · Esc fecha o balão do rastro', await page.evaluate(() => document.getElementById('end-pop').hidden), 'aberto');

    /* 8. celular (400 px): o endereço cabe, sem rolagem lateral da página */
    await page.setViewportSize({ width: 400, height: 820 });
    await espera(500);
    const cel = await page.evaluate(() => ({ larg: document.documentElement.scrollWidth, janela: innerWidth, cab: (() => { const n = document.getElementById('e-endereco'); const r = n.getBoundingClientRect(); return { x: r.left, w: r.width, visivel: !n.hidden && r.height > 0 }; })() }));
    ok('A8 · celular: cabeçalho visível e nenhuma rolagem lateral', cel.cab.visivel && cel.larg <= cel.janela && cel.cab.x + cel.cab.w <= cel.janela + 1, cel);
    await foto('celular');
    await page.setViewportSize({ width: 1440, height: 900 });
    await espera(300);

    /* 9. movimento reduzido: a chegada vira cor (três degraus), sem animação */
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => { BC.loja.fazerComo('carla', 'vendoArquivo', null); });
    await espera(200);
    await page.evaluate(() => BC.loja.fazerComo('iara', 'vendoArquivo', BC.estacao.abaAtual().ref));
    await espera(300);
    const red = await page.evaluate(() => { const a = document.querySelector('#e-endereco [data-end-pessoa="iara"]'); const n = document.getElementById('e-endereco'); return { luz: a ? a.style.getPropertyValue('--luz') : null, animacoes: document.getAnimations().filter((x) => x.effect && x.effect.target && x.effect.target.closest && x.effect.target.closest('#e-endereco')).length, chegada: /end-chegada/.test(n.className) }; });
    ok('A9 · movimento reduzido: luz em degrau (1) e nenhuma animação no cabeçalho', red.luz === '1.000' && red.animacoes === 0 && !red.chegada, red);
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    /* 10. repouso: quando a última luz apaga (< 5 %), o laço de luz para sozinho */
    const tRep = Date.now();
    const rodando = await page.evaluate(() => BC.endereco._estado().ticker);
    const parou = await ate(page, () => BC.endereco._estado().ticker === false, null, 45000);
    medidas.laçoParouEm = Math.round((Date.now() - tRep) / 1000) + ' s depois da última chegada';
    ok('A10 · luz acesa tem laço; em repouso o laço para (nada pulsa sem evento)', rodando === true && parou === true, { rodando, parou });

    ok('A · zero erros de página', E.erros.length === 0, E.erros);
  } finally { await E.fechar(); }
}

async function parteB(ok, medidas) {
  const raizT = raizTemporaria('endereco-theus'), raizR = raizTemporaria('endereco-rita');
  const zsh = (raiz) => { const z = path.join(raiz, '.zdot'); fs.mkdirSync(z, { recursive: true }); fs.writeFileSync(path.join(z, '.zshrc'), '# zsh da prova do endereço\n'); return { ZDOTDIR: z, SHELL: '/bin/zsh' }; };
  let T = null, R = null;
  const erros = [];
  const vigiar = (page, quem) => page.on('pageerror', (e) => erros.push(quem + ': ' + String(e && e.message || e).slice(0, 200)));
  const pronta = (page) => page.waitForFunction(() => window.BC && BC.real && BC.real.eu() && BC.real.eu().pronto && BC.estacao && document.getElementById('e-status').children.length, null, { timeout: 30000 });
  try {
    T = await abrirEstacao({ nome: 'end-theus', raiz: raizT, porta: 5018, descoberta: 41518, env: zsh(raizT) });
    vigiar(T.page, 'theus');
    await T.page.waitForLoadState('domcontentloaded');
    const f = await T.page.evaluate(() => fetch('/api/fundar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: 'Theus' }) }).then((r) => r.json()));
    await T.page.reload();
    await pronta(T.page);
    const conv = await T.page.evaluate(() => fetch('/api/convite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: 'Rita', papel: 'membro' }) }).then((r) => r.json()));
    R = await abrirEstacao({ nome: 'end-rita', raiz: raizR, porta: 5019, descoberta: 41518, env: zsh(raizR) });
    vigiar(R.page, 'rita');
    await R.page.waitForLoadState('domcontentloaded');
    const tk = await R.page.evaluate((token) => fetch('/api/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }).then((r) => r.json()), conv.token);
    await R.page.reload();
    await pronta(R.page);
    const rede = await ate(T.page, () => BC.real.pares().some((p) => p.id === 'rita' && p.ligado), null, 30000);
    ok('B0 · duas Estações reais na rede (Theus fundou, Rita entrou com token)', f.papel === 'gestao' && tk.id === 'rita' && rede, { f: f.papel, tk: tk.id, rede });
    await T.page.setViewportSize({ width: 1440, height: 900 });
    await R.page.setViewportSize({ width: 1440, height: 900 });
    medidas.organismoNoApp = await T.page.evaluate(() => !!(BC.organismo && BC.organismo.versao));

    /* o Theus abre a landing pela paleta; a Rita, na Estação dela, também */
    await abrirPelaPaleta(T.page, 'landing.html', 'davi/Projetos/Clínicas/landing.html');
    const antes = await T.page.evaluate(() => { BC.organismo.zerar(); return document.getElementById('e-endereco').innerText.replace(/\s+/g, ' '); });
    ok('B1 · no app real o cabeçalho do Theus mostra o endereço da landing', /Clínicas em Campinas › Tela · Davi › landing\.html/.test(antes), antes);
    const t0 = Date.now();
    await abrirPelaPaleta(R.page, 'landing.html', 'davi/Projetos/Clínicas/landing.html');
    const chegou = await ate(T.page, () => { const a = document.querySelector('#e-endereco [data-end-pessoa="rita"]'); return a && /Rita chegou/.test(document.getElementById('e-endereco').innerText) ? { luz: +(a.style.getPropertyValue('--luz') || 0), cont: BC.organismo.contagem() } : null; }, null, 15000);
    medidas.chegadaEntreEstacoesMs = Date.now() - t0;
    ok('B2 · a Rita abre a landing na Estação dela e a do Theus acende "Rita chegou" (diário → rede → posição)', chegou && chegou.luz > 0.3, chegou);
    ok('B2 · a luz é dirigida pelo organismo: pulso + som suave', chegou && chegou.cont.pulso >= 1 && (chegou.cont.somPedido.acordar || 0) >= 1, chegou && chegou.cont);
    await espera(250);
    await T.page.screenshot({ path: path.join(EVID, 'depois-app-rita-chegou.png') });
    const posR = await T.page.evaluate(() => BC.endereco.posicao('rita'));
    ok('B3 · a posição da Rita no Theus veio do evento dela (fonte posicao)', posR && posR.fonte === 'posicao' && posR.chave === 'arquivo:fp4', posR && { fonte: posR.fonte, chave: posR.chave });
    await paleta(T.page, 'onde está a rita');
    const lp = await T.page.evaluate(() => document.getElementById('paleta-lista').innerText.replace(/\s+/g, ' '));
    ok('B3 · Ctrl K no Theus: "Rita · na landing.html"', /Rita/.test(lp) && /na landing\.html/.test(lp), lp.slice(0, 200));
    await T.page.screenshot({ path: path.join(EVID, 'depois-app-paleta-rita.png') });
    await T.page.keyboard.press('Escape');
    /* a Rita sai: vai para Demandas; o anel dela some do cabeçalho do Theus */
    await R.page.click('.e-atividades [data-acao="atividade"][data-id="demandas"]');
    const saiu = await ate(T.page, () => !document.querySelector('#e-endereco [data-end-pessoa="rita"]') && BC.endereco.posicao('rita').chave, null, 15000);
    ok('B4 · a Rita vai para Demandas e sai do objeto do Theus (posição acompanha)', saiu === 'atividade:demandas', saiu);
    ok('B · zero erros de página nas duas Estações', erros.length === 0, erros);
  } finally {
    if (R) await R.fechar().catch(() => {});
    if (T) await T.fechar().catch(() => {});
  }
}

async function prova(prefixo) {
  const res = [], medidas = { quando: new Date().toISOString() };
  const ok = checador(res);
  await parteA(ok, medidas).catch((e) => ok('A · rodou até o fim', false, e && e.stack || e));
  await parteB(ok, medidas).catch((e) => ok('B · rodou até o fim', false, e && e.stack || e));
  const passou = res.filter((r) => r.ok).length;
  const saida = { resumo: passou + '/' + res.length + ' passaram', falhas: res.filter((r) => !r.ok), tudo: res.map((r) => (r.ok ? '✓ ' : '✗ ') + r.nome), medidas };
  fs.writeFileSync(path.join(EVID, prefixo + '-resultado.json'), JSON.stringify(saida, null, 2));
  console.log('\n' + saida.resumo);
  return saida;
}

module.exports = { prova };
if (require.main === module) prova(process.argv[2] || 'prova').catch((e) => { console.error(e); process.exitCode = 1; });
