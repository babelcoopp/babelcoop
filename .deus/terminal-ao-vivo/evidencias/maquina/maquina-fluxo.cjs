/* babel-coop · a Máquina 2030 por evento real, no Electron escondido (papel MÁQUINA).
   Cliques de verdade (page.click) em Testar, Enviar pelo fio, Testar como a outra empresa, zoom, vitrine, montar, publicar.
   Mede: fios presos às peças, nenhuma peça sobreposta, pontos com origem, peças com corpo, erros de página.
   Uso (de dentro de app/): node <pasta>/maquina-prova.cjs fluxo <prefixo> */
'use strict';
const fs = require('fs');
const path = require('path');
const { estacaoFundada, espera, EVID } = require('./maquina-prova.cjs');

/* geometria: cada fio começa e termina na borda de uma peça; peças não se sobrepõem */
function medirGeometria() {
  const mesa = document.querySelector('.mq2 .mq-mesa');
  if (!mesa) return { erro: 'sem mesa' };
  const svg = mesa.querySelector('.mq-fios');
  const rs = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, sx = rs.width / vb.width, sy = rs.height / vb.height;
  const noRect = (id) => { const el = mesa.querySelector('[data-no="' + id + '"]'); return el ? el.getBoundingClientRect() : null; };
  const dist = (p, r) => { const dx = Math.max(r.left - p.x, 0, p.x - r.right), dy = Math.max(r.top - p.y, 0, p.y - r.bottom); return Math.sqrt(dx * dx + dy * dy); };
  const fios = Array.from(svg.querySelectorAll('path.mq-fio[data-de]')).map((p) => {
    const L = p.getTotalLength(); if (!L) return { k: p.dataset.k, vazio: true };
    const a = p.getPointAtLength(0), b = p.getPointAtLength(L);
    const pa = { x: rs.left + a.x * sx, y: rs.top + a.y * sy }, pb = { x: rs.left + b.x * sx, y: rs.top + b.y * sy };
    const ra = noRect(p.dataset.de), rb = noRect(p.dataset.para);
    return { k: p.dataset.k, tipo: p.getAttribute('class'), inicio: ra ? Math.round(dist(pa, ra) * 10) / 10 : null, fim: rb ? Math.round(dist(pb, rb) * 10) / 10 : null };
  });
  const pecas = Array.from(mesa.querySelectorAll('.mq-peca')).map((el) => ({ id: el.dataset.no, r: el.getBoundingClientRect() }));
  const sobrepostas = [];
  for (let i = 0; i < pecas.length; i++) for (let j = i + 1; j < pecas.length; j++) {
    const a = pecas[i].r, b = pecas[j].r;
    if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) sobrepostas.push(pecas[i].id + '×' + pecas[j].id);
  }
  const escala = (mesa.style.transform.match(/scale\(([\d.]+)\)/) || [])[1];
  return {
    escala: +escala, pecas: pecas.length, fios: fios.length, fiosVazios: fios.filter((f) => f.vazio).length,
    fiosSoltos: fios.filter((f) => !f.vazio && (f.inicio > 2.5 || f.fim > 2.5)), sobrepostas,
    pinos: mesa.querySelectorAll('.mq-pinos circle').length,
    emojis: (document.querySelector('.mq2').innerText.match(/[\u{1F300}-\u{1FAFF}]/gu) || []).length,
    supabase: /supabase/i.test(document.getElementById('e-conteudo').innerText + document.getElementById('e-lateral').innerText)
  };
}

async function fluxo(prefixo) {
  const E = await estacaoFundada(5024, 41524, 'maquina-fluxo');
  const { page } = E;
  const out = (n) => path.join(EVID, prefixo + '-' + n + '.png');
  const R = { passos: [] };
  const ok = (nome, passou, achou) => { R.passos.push({ nome, ok: !!passou, achou: passou ? '' : String(achou).slice(0, 300) }); console.log((passou ? '✓ ' : '✗ ') + nome + (passou ? '' : ' · ' + String(achou).slice(0, 300))); };
  const ev = (fn, a) => page.evaluate(fn, a);
  try {
    R.organismo = await ev(() => !!(window.BC && BC.organismo && BC.organismo.versao));
    await ev(() => { BC.estacao.fecharTodas(); BC.maquina.abrir('clinicas'); });
    await espera(900);
    await page.screenshot({ path: out('1-maquina') });
    const g0 = await ev(medirGeometria);
    R.geometria = g0;
    ok('a Máquina abre em 2D com nós e fios (12+ peças, 12+ fios)', g0.pecas >= 12 && g0.fios >= 12, JSON.stringify(g0));
    ok('fios calculados pela posição real: começam e terminam na borda das peças', g0.fiosSoltos.length === 0 && g0.fiosVazios === 0, JSON.stringify(g0.fiosSoltos));
    ok('nenhuma peça por cima de outra', g0.sobrepostas.length === 0, g0.sobrepostas.join(', '));
    ok('glifos de traço, nenhum emoji na Máquina', g0.emojis === 0, g0.emojis);
    ok('a Máquina não cita o fornecedor', !g0.supabase, 'cita');

    /* Testar: formulário por porta e "como quem" */
    await page.click('.mq2 [data-acao="mq-testar-abrir"]');
    await espera(300);
    const form = await ev(() => ({ portas: document.querySelectorAll('#mq-t-porta option').length, campos: Array.from(document.querySelectorAll('.mq-teste-form input[data-campo]')).map((i) => i.dataset.campo + '=' + i.value), como: document.querySelectorAll('.mq-teste-form input[name="mq-t-como"]').length }));
    ok('Testar abre o formulário da porta com "como quem"', form.portas >= 2 && form.campos.length >= 2 && form.como === 3, JSON.stringify(form));
    await page.screenshot({ path: out('2-formulario') });
    await page.fill('.mq-teste-form input[data-campo="paciente"]', 'João Lima');
    await page.check('.mq-teste-form input[name="mq-t-como"][value="ana"]');
    await page.click('.mq-teste-form button[type="submit"]');
    await espera(1500);
    const meio = await ev(() => ({ pontos: document.querySelectorAll('.mq-fx .mq-ponto').length, ativas: Array.from(document.querySelectorAll('.mq2 .mq-peca.ativa')).map((e) => e.dataset.no), acesas: document.querySelectorAll('.mq2 .mq-peca[data-luz-cor="ok"]').length, log: document.querySelectorAll('.mq-teste-log ol li').length, legenda: (document.querySelector('.mq2 .mq-ficha-linha.teste span') || {}).textContent || '' }));
    await page.screenshot({ path: out('3-pulso-andando') });
    ok('o pulso verde anda peça a peça (peças acesas em verde, narração cresce)', meio.acesas >= 2 && meio.log >= 3, JSON.stringify(meio));
    await page.waitForFunction(() => { const m = BC.maquina.maquinas.clinicas; return m.teste && m.teste.passou; }, null, { timeout: 15000 });
    await espera(250);
    const verde = await ev(() => { const m = BC.maquina.maquinas.clinicas; return { passou: m.teste.passou, linha: m.teste.linhaNova && m.teste.linhaNova.texto, acesas: document.querySelectorAll('.mq2 .mq-peca[data-luz-cor="ok"]').length, caminho: Object.keys(m.teste.passaram), pontos: m.pontos.map((p) => '+' + p.pts + ' ' + p.origem), linhas: m.pecas.find((p) => p.id === 'agendamentos').linhas, faiscas: document.querySelectorAll('.mq-fx .mq-faisca').length, preset: !!document.querySelector('[data-acao="mq-preset-form"]') }; });
    await page.screenshot({ path: out('4-tudo-verde') });
    ok('no fim todas as peças do caminho brilham juntas (≥ 6) e a gaveta mostra a linha que entrou', verde.acesas >= 6 && /João Lima/.test(verde.linha || '') && verde.linhas === 51, JSON.stringify(verde));
    ok('teste passou dá +6 com origem', verde.pontos.some((p) => /^\+6 teste passou/.test(p)), JSON.stringify(verde.pontos));
    R.verde = verde;

    /* como a outra empresa: pulso vermelho morre no cadeado */
    await page.waitForFunction(() => !BC.maquina.maquinas.clinicas.teste.rodando, null, { timeout: 8000 });
    await page.click('.mq2 [data-acao="mq-testar-outra"]');
    await page.waitForFunction(() => { const t = BC.maquina.maquinas.clinicas.teste; return t && t.barrado; }, null, { timeout: 12000 });
    await espera(120);
    const barrado = await ev(() => { const m = BC.maquina.maquinas.clinicas; return { treme: !!document.querySelector('.mq2 .mq-cadeado.treme'), bolha: (document.querySelector('.mq2 .mq-bolha.barrou') || {}).textContent || '', gavetaVermelha: !!document.querySelector('.mq2 .mq-peca[data-no="agendamentos"][data-luz-cor="alarme"]'), pontos: m.pontos.map((p) => '+' + p.pts + ' ' + p.origem), chegouNaGaveta: m.teste.log.some((l) => /linha nova/.test(l.texto) && l.rodada === 'outra') }; });
    await page.screenshot({ path: out('5-barrado-no-cadeado') });
    ok('como a outra empresa: o cadeado treme e a bolha diz "0 passaram · 1 barrado pela chave"', barrado.treme && /0 passaram · 1 barrado pela chave/.test(barrado.bolha) && barrado.gavetaVermelha && !barrado.chegouNaGaveta, JSON.stringify(barrado));
    ok('barrado dá +2 com origem', barrado.pontos.some((p) => /^\+2 a segurança funcionou/.test(p)), JSON.stringify(barrado.pontos));

    /* Máquina funcionando: Cormorant, as peças ganham corpo, +12 */
    await page.waitForFunction(() => BC.maquina.maquinas.clinicas.funcionandoEm > 0, null, { timeout: 12000 });
    await espera(1400);
    const rito = await ev(() => { const m = BC.maquina.maquinas.clinicas, t = document.querySelector('.mq2 .mq-rito-titulo'); const imgs = Array.from(document.querySelectorAll('.mq2 .mq-corpo-img')); return { titulo: t ? t.textContent : null, fonte: t ? getComputedStyle(t).fontFamily : null, opacidade: document.querySelector('.mq2 .mq-rito') ? +getComputedStyle(document.querySelector('.mq2 .mq-rito')).opacity : 0, comCorpo: m.pecas.filter((p) => p.corpo).length, imgs: imgs.length, imgsCarregadas: imgs.filter((i) => i.complete && i.naturalWidth > 0).length, pontos: m.pontos.map((p) => '+' + p.pts + ' ' + p.origem) }; });
    await page.screenshot({ path: out('6-maquina-funcionando') });
    ok('"Máquina funcionando" em Cormorant, visível', rito.titulo === 'Máquina funcionando' && /Cormorant/.test(rito.fonte) && rito.opacidade > 0.5, JSON.stringify(rito));
    ok('as peças ganham corpo (imagens isométricas carregadas)', rito.comCorpo >= 10 && rito.imgsCarregadas >= 6, JSON.stringify(rito));
    ok('Máquina funcionando dá +12 com origem', rito.pontos.some((p) => /^\+12 Máquina funcionando/.test(p)), JSON.stringify(rito.pontos));
    const retestar = await ev(async () => { const m = BC.maquina.maquinas.clinicas, antes = m.pontos.length; await BC.maquina.testar(m, { como: 'ana' }); return { antes, depois: m.pontos.length, repetido: m.teste.pontos.some((p) => p.repetido) }; });
    ok('testar de novo sem mudar nada não dá ponto de novo (nunca por repetição)', retestar.antes === retestar.depois && retestar.repetido, JSON.stringify(retestar));

    /* três alturas de zoom por clique */
    await page.click('.mq2 .mq-zoom [data-z="inteira"]');
    await espera(400);
    const inteira = await ev(() => ({ dominios: Array.from(document.querySelectorAll('.mq2 .mq-dominio')).map((d) => d.querySelector('.mq-dominio-nome').textContent), fios: document.querySelectorAll('.mq2 .mq-fios path.mq-fio').length }));
    await page.screenshot({ path: out('7-zoom-maquina-inteira') });
    ok('zoom "Máquina inteira": um cartão por domínio com fios entre eles', inteira.dominios.length >= 3 && inteira.fios >= 2, JSON.stringify(inteira));
    await page.click('.mq2 .mq-dominio[data-d="agenda"]');
    await espera(400);
    const dom = await ev(() => ({ trilha: document.querySelector('.mq2 .mq-trilha').innerText, fora: document.querySelectorAll('.mq2 .mq-peca.fora').length, dentro: document.querySelectorAll('.mq2 .mq-peca:not(.fora)').length }));
    await page.screenshot({ path: out('8-zoom-dominio-agenda') });
    ok('clicar no domínio Agenda desce um nível (trilha e peças de fora apagadas)', /Agenda/.test(dom.trilha) && dom.fora > 0 && dom.dentro >= 5, JSON.stringify(dom));
    await page.dblclick('.mq2 .mq-peca[data-no="agendamentos"]');
    await espera(500);
    const perto = await ev(() => ({ trilha: document.querySelector('.mq2 .mq-trilha').innerText, grande: (document.querySelector('.mq2 .mq-peca.grande') || {}).dataset, entram: document.querySelectorAll('.mq2 .mq-mesa-peca .mq-col[data-c="0"] [data-no]').length, saem: document.querySelectorAll('.mq2 .mq-mesa-peca .mq-col[data-c="2"] [data-no]').length, fios: document.querySelectorAll('.mq2 .mq-fios path.mq-fio').length, onde: /onde fica guardado/i.test(document.querySelector('.mq2 .mq-ficha').innerText), ondeTxt: (document.querySelector('.mq2 .mq-onde') || {}).textContent }));
    await page.screenshot({ path: out('9-zoom-peca-agendamentos') });
    ok('duplo clique = zoom "Peça": a gaveta de perto, entradas à esquerda e saídas à direita, ficha com "onde fica guardado"', perto.grande && perto.grande.no === 'agendamentos' && perto.entram >= 3 && perto.saem >= 2 && perto.onde, JSON.stringify(perto));
    const g1 = await ev(medirGeometria);
    ok('no zoom "Peça" os fios também saem e chegam nas bordas', g1.fiosSoltos.length === 0, JSON.stringify(g1.fiosSoltos));
    await page.click('.mq2 .mq-trilha [data-z="inteira"]');
    await espera(200);
    await page.click('.mq2 .mq-zoom [data-z="dominio"]');
    await espera(200);
    await page.click('.mq2 .mq-zoom [data-z="dominio"]');
    await espera(300);

    /* a vitrine das 16 peças */
    await page.click('.mq2 [data-acao="mq-painel"][data-p="vitrine"]');
    await espera(300);
    const vit = await ev(() => ({ n: document.querySelectorAll('.mq2 .mq-vitrine-item').length, nomes: Array.from(document.querySelectorAll('.mq2 .mq-vitrine-item b')).map((b) => b.textContent) }));
    ok('vitrine com as 16 peças, nomes de gente', vit.n === 16 && vit.nomes.includes('Casa de Máquinas') && vit.nomes.includes('Carteiro'), JSON.stringify(vit));
    await page.click('.mq2 .mq-vitrine-item[data-t="deposito"]');
    await espera(250);
    await page.screenshot({ path: out('10-vitrine-16-pecas') });

    /* montar uma peça pela vitrine: entra tracejada; publicar dá corpo */
    await page.click('.mq2 [data-acao="mq-montar-tipo"][data-t="deposito"]');
    await espera(300);
    const nova = await ev(() => { const m = BC.maquina.maquinas.clinicas, p = m.pecas[m.pecas.length - 1], el = document.querySelector('.mq2 .mq-peca[data-no="' + p.id + '"]'); return { id: p.id, tipo: p.tipo, classes: el ? el.className : null, borda: el ? getComputedStyle(el).borderTopStyle : null, mudancas: m.mudancas.length }; });
    await page.screenshot({ path: out('11-peca-nova-tracejada') });
    ok('a peça nova entra tracejada (sem corpo)', nova.tipo === 'deposito' && /construindo/.test(nova.classes) && nova.borda === 'dashed', JSON.stringify(nova));
    await espera(2000);
    const pronta = await ev((id) => { const el = document.querySelector('.mq2 .mq-peca[data-no="' + id + '"]'); return { classes: el.className, borda: getComputedStyle(el).borderTopStyle, pontos: BC.maquina.maquinas.clinicas.pontos.map((p) => '+' + p.pts + ' ' + p.origem) }; }, nova.id);
    ok('migração aplicada no local: segue tracejada até publicar, e o nó encaixado dá +1', /local/.test(pronta.classes) && pronta.borda === 'dashed' && pronta.pontos.some((p) => /^\+1 nó encaixado/.test(p)), JSON.stringify(pronta));
    await page.click('.mq2 [data-acao="mq-publicar"]');
    await espera(250);
    await page.fill('#mq-confirma', await ev(() => { const m = BC.maquina.maquinas.clinicas; return m.pj ? m.pj.nome : 'Clínicas (exemplo)'; }));
    await page.click('form[data-form="mq-publicar"] button[type="submit"]');
    await espera(700);
    await page.screenshot({ path: out('12-publicando-ganha-corpo') });
    await espera(900);
    const pub = await ev((id) => { const m = BC.maquina.maquinas.clinicas, el = document.querySelector('.mq2 .mq-peca[data-no="' + id + '"]'); return { versao: m.versao, classes: el.className, borda: getComputedStyle(el).borderTopStyle, espessura: getComputedStyle(el).borderBottomWidth, mudancas: m.mudancas.length, eventos: BC.loja.estado.eventos.filter((e) => e.tipo === 'maquina').slice(0, 5).map((e) => e.texto) }; }, nova.id);
    await page.screenshot({ path: out('13-publicada-com-corpo') });
    ok('Publicar: a peça tracejada ganha corpo (sólida, espessura 2 px) e a versão sobe', /corpo/.test(pub.classes) && pub.borda === 'solid' && pub.espessura === '2px' && pub.versao === 2 && pub.mudancas === 0, JSON.stringify(pub));
    ok('os eventos da Máquina vão para a equipe e a TV (loja)', pub.eventos.length >= 3, JSON.stringify(pub.eventos));

    /* o agente montando: peças entram uma a uma */
    await page.click('.mq2 [data-acao="mq-montar"]');
    await espera(5200);
    const montou = await ev(() => { const m = BC.maquina.maquinas.clinicas; return { novas: m.pecas.filter((p) => !p.publicada).map((p) => p.tipo + ':' + p.nome), fiosNovos: Object.keys(m.fioNasce).length }; });
    await page.screenshot({ path: out('14-agente-montando') });
    ok('"Ver o agente montando": gaveta, robô e porta entram com fios novos', montou.novas.length >= 3 && montou.fiosNovos >= 3, JSON.stringify(montou));
    const g2 = await ev(medirGeometria);
    ok('com as peças novas, os fios continuam presos e nada se sobrepõe', g2.fiosSoltos.length === 0 && g2.sobrepostas.length === 0, JSON.stringify({ soltos: g2.fiosSoltos, sob: g2.sobrepostas }));

    /* a chave aberta: a gaveta sai da bandeja, ganha alerta, e a outra empresa PASSA (a Máquina mostra o vazamento) */
    await page.click('.mq2 .mq-peca[data-no="agendamentos"]');
    await espera(250);
    if (await page.$('.mq2 .mq-ficha.recolhida')) await page.click('.mq2 .mq-ficha-alternar');
    await espera(250);
    await page.click('.mq2 [data-acao="mq-chave"][data-id="agendamentos"][data-c="⚠ aberta para todos"]');
    await espera(300);
    const aberta = await ev(() => ({ naBandeja: !!document.querySelector('.mq2 .mq-bandeja [data-no="agendamentos"]'), alerta: /mq-peca[^"]*alerta/.test((document.querySelector('.mq2 .mq-peca[data-no="agendamentos"]') || {}).className || ''), cadeado: !!document.querySelector('.mq2 .mq-peca[data-no="agendamentos"] .mq-cadeado.aberto'), suja: !!document.querySelector('.mq2 .mq-peca[data-no="agendamentos"] .mq-suja') }));
    ok('chave "aberta para todos": a gaveta sai da bandeja Empresa, cadeado aberto em vermelho, alerta e "mudou depois do teste"', !aberta.naBandeja && aberta.alerta && aberta.cadeado && aberta.suja, JSON.stringify(aberta));
    const vazou = await ev(async () => { const m = BC.maquina.maquinas.clinicas; await BC.maquina.testar(m, { como: 'outra', porta: 'porta-novo' }); return { vazou: m.teste.vazouFim, barrado: m.teste.barrado, funcionando: BC.maquina.retrato('clinicas').funcionando, log: m.teste.log.slice(-2).map((l) => l.texto) }; });
    await page.screenshot({ path: out('14b-chave-aberta-vazou') });
    ok('com a chave aberta, a outra empresa passa: a Máquina avisa o vazamento e deixa de estar "funcionando"', vazou.vazou && !vazou.barrado && !vazou.funcionando, JSON.stringify(vazou));
    await page.click('.mq2 .mq-peca[data-no="agendamentos"]'); await espera(250);
    if (await page.$('.mq2 .mq-ficha.recolhida')) await page.click('.mq2 .mq-ficha-alternar');
    await espera(250);
    await page.click('.mq2 [data-acao="mq-chave"][data-id="agendamentos"][data-c="cada empresa vê só o seu"]');
    await espera(300);
    ok('fechar a chave de novo põe a gaveta de volta na bandeja', await ev(() => !!document.querySelector('.mq2 .mq-bandeja [data-no="agendamentos"]')), 'fora da bandeja');
    await page.click('.mq2 [data-acao="mq-pessoa"]');
    await espera(200);
    ok('"por pessoa" acende o halo na cor de quem fez cada peça', await ev(() => !!document.querySelector('.mq2 .mq-palco.por-pessoa') && getComputedStyle(document.querySelector('.mq2 .mq-peca[data-no="pacientes"]')).boxShadow.indexOf('0px 0px 0px 3px') !== -1), 'sem halo');
    await page.click('.mq2 [data-acao="mq-pessoa"]');
    await page.click('.mq2 [data-acao="mq-tv"]');
    await espera(300);
    ok('Projetar na TV manda o retrato da Máquina para a parede (evento da equipe)', await ev(() => BC.loja.estado.eventos.slice(0, 6).some((e) => e.maquina === 'tv' && e.maquinaRetrato && e.maquinaRetrato.pecas.length >= 12)), 'sem evento');

    /* API para os outros */
    const api = await ev(() => { const r = BC.maquina.retrato('clinicas'); return { pecas: r.pecas.length, funcionando: r.funcionando, corpo: r.pecas.filter((p) => p.corpo).length, fios: r.fios.length, imagem: r.pecas.find((p) => p.tipo === 'gaveta').imagem, ouvir: typeof BC.maquina.ouvir, testar: typeof BC.maquina.testar, publicar: typeof BC.maquina.publicar }; });
    ok('BC.maquina.retrato / ouvir / testar / publicar expostos', api.pecas >= 14 && api.ouvir === 'function' && api.testar === 'function', JSON.stringify(api));
    R.api = api;

    /* tamanho maior (sem a lateral): a ficha vai para a direita */
    await ev(() => { if (BC.estacao.alternarLateral) BC.estacao.alternarLateral(false); });
    await espera(500);
    await page.screenshot({ path: out('15-sem-lateral') });
    R.erros = E.erros.slice();
    ok('zero erros de página', E.erros.length === 0, E.erros.join(' | '));
  } catch (e) {
    R.falhou = String(e && e.stack || e);
    console.error('FALHOU', R.falhou);
    await page.screenshot({ path: out('erro') }).catch(() => {});
  } finally {
    R.erros = E.erros.slice();
    R.resumo = R.passos.filter((p) => p.ok).length + '/' + R.passos.length;
    fs.writeFileSync(path.join(EVID, prefixo + '-fluxo.json'), JSON.stringify(R, null, 2));
    await E.fechar();
  }
  console.log('RESUMO', R.resumo, '· erros', R.erros.length);
}

module.exports = { fluxo };
