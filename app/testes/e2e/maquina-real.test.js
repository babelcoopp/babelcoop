/* babel-coop · e2e da Máquina no app real (F3.1, F3.2, F3.3 e A28 do .deus/terminal-ao-vivo): Estação Electron escondida,
   app limpo (sem BABEL_COOP_EXEMPLOS), equipe fundada pelo Theus. Prova:
   - sem projeto, a Máquina mostra o estado vazio (uma frase + criar projeto / pedir ao agente), sem "Clínicas (exemplo)",
     Bruno-bot, Dev nem Rita; com o primeiro projeto, a máquina nasce vazia (zero peças inventadas);
   - o agente monta a Máquina pelo conector coop (coop_maquina_peca, coop_maquina_ligar, coop_maquina): cada peça entra
     tracejada na tela, assinada "Rita · Theus", vai para o diário e sobrevive a um recarregar;
   - o modo 3D da Máquina inteira renderiza (canvas com tamanho e pixels desenhados, as peças e os fios em cena);
   - Publicar dá corpo 3D às peças dentro da Máquina (tracejada → corpo) e a publicação também vai para o diário.
   As chamadas chegam como viriam do servidor (BC.real.simular, o mesmo caminho do coop-ui.test.js).
   Porta 5393, descoberta 41893. Evidências: BABEL_TESTE_EVIDENCIAS=<pasta> (resultado.json + prints).
   Rodar: node --test testes/e2e/maquina-real.test.js
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { abrirEstacao } = require('./estacao');

const PORTA = 5393, DESCOBERTA = 41893;
const EVID = process.env.BABEL_TESTE_EVIDENCIAS || null;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const INVENTADOS = /Clínicas \(exemplo\)|Bruno-bot|\bDev\b|\bRita criou|Clínica Vida|Clínica Sorriso/;

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

/* o que a Máquina mostra agora (a mesma medida do auditar-faltas.js) */
const medirTela = (page) => page.evaluate(() => ({
  lateral: document.getElementById('e-lateral').textContent.replace(/\s+/g, ' ').trim().slice(0, 1500),
  conteudo: document.getElementById('e-conteudo').textContent.replace(/\s+/g, ' ').trim().slice(0, 500),
  canvas: document.querySelectorAll('#e-conteudo canvas').length
}));

/* pixels do 3D: desenha o quadro agora e copia o canvas WebGL para um 2D no mesmo passo (sem preserveDrawingBuffer) */
const medir3d = (page) => page.evaluate(() => {
  const v = BC.maquina.vista3d(), med = BC.maquina.medidas3d();
  if (!v || !v.gl) return { med, canvas: null };
  const cv = v.canvas, r = cv.getBoundingClientRect();
  v.gl.render(v.cena, v.cam);
  const c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height;
  const ctx = c2.getContext('2d'); ctx.drawImage(cv, 0, 0);
  const px = ctx.getImageData(0, 0, c2.width, c2.height).data;
  let cheios = 0, claros = 0;
  for (let i = 3; i < px.length; i += 4) { if (px[i] > 8) { cheios++; if (px[i - 3] + px[i - 2] + px[i - 1] > 180) claros++; } }
  return { med, canvas: { w: cv.width, h: cv.height, cssW: Math.round(r.width), cssH: Math.round(r.height), visivel: cv.isConnected && r.width > 0 && r.height > 0, dentroDoConteudo: !!cv.closest('#e-conteudo') }, pixels: cheios, claros, total: cv.width * cv.height };
});

describe('Máquina no app real: vazia de verdade, montada pelo agente, 3D e corpo ao publicar', () => {
  let est, eu, pj, resultado = { casos: {} };
  const chamar = async (cid, ferramenta, args) => {
    await est.page.evaluate((m) => BC.real.simular(m), { tipo: 'mcp-chamada', cid, sessao: 's-rita', ferramenta, args, agente: { id: 'ag-rita', nome: 'Rita', dono: eu.id } });
    const r = await ate(() => est.page.evaluate((c) => window.__enviados.filter((m) => m.tipo === 'mcp-resposta' && m.cid === c)[0] || null, cid), { ms: 5000, oque: 'mcp-resposta ' + cid });
    resultado.casos[cid] = { ferramenta, args, ok: r.ok, texto: r.ok ? r.resultado.texto : r.erro };
    return r;
  };
  const print = async (nome) => { if (EVID) { fs.mkdirSync(EVID, { recursive: true }); await est.page.screenshot({ path: path.join(EVID, nome) }).catch(() => {}); } };

  before(async () => {
    est = await abrirEstacao({ nome: 'maquina', porta: PORTA, descoberta: DESCOBERTA });
    await est.page.waitForLoadState('load');
    const f = await est.api('/api/fundar', { nome: 'Theus' });
    assert.ok(f.pronto, 'fundou a equipe: ' + JSON.stringify(f));
    eu = f;
    await est.page.reload();
    await ate(() => est.page.evaluate(() => !!(window.BC && BC.real && BC.real.bemvindo && BC.real.eu() && BC.real.eu().pronto && BC.loja.eu === BC.real.eu().id && BC.estacao && BC.estacao.ui && BC.coop)), { ms: 25000, oque: 'a Estação reconhecer o Theus' });
    await est.page.evaluate(() => {
      window.__enviados = [];
      const original = BC.real.enviar;
      BC.real.enviar = function (m) { window.__enviados.push(JSON.parse(JSON.stringify(m))); return original(m); };
    });
    resultado.eu = { id: eu.id, nome: eu.nome };
  });

  after(async () => {
    if (EVID) { fs.mkdirSync(EVID, { recursive: true }); fs.writeFileSync(path.join(EVID, 'maquina-real-resultado.json'), JSON.stringify(resultado, null, 2)); }
    if (est) await est.fechar();
  });

  it('F3.1 · sem projeto: estado vazio com o que fazer, nada inventado; o primeiro projeto nasce com a máquina vazia', async () => {
    await est.page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.abrir('maquina'); });
    await esperar(800);
    const vazio = await medirTela(est.page);
    resultado.casos.semProjeto = vazio;
    await print('maquina-sem-projeto.png');
    assert.doesNotMatch(vazio.lateral + ' ' + vazio.conteudo, INVENTADOS);
    assert.match(vazio.conteudo, /Ainda não há projeto na equipe/);
    assert.ok(await est.page.evaluate(() => !!document.querySelector('#e-conteudo [data-acao="pj-novo-form"]') && !!document.querySelector('#e-conteudo [data-acao="mq-terminal"]')), 'botões criar projeto e pedir ao agente');
    /* o atalho de Criar ainda aponta para "clinicas": no app real ele cai no estado vazio, nunca no exemplo */
    await est.page.evaluate(() => BC.maquina.abrir('clinicas'));
    await esperar(400);
    assert.doesNotMatch((await medirTela(est.page)).conteudo, INVENTADOS);
    const semProjeto = await chamar('m-sem-projeto', 'coop_maquina_peca', { tipo: 'gaveta', nome: 'pacientes' });
    assert.equal(semProjeto.ok, false);
    assert.match(semProjeto.erro, /ainda não tem projeto/);

    await est.page.evaluate(() => BC.loja.fazer('novoProjeto', { nome: 'Agenda Real' }));
    pj = await est.page.evaluate(() => BC.loja.estado.projetos[0].id);
    await est.page.evaluate((id) => { BC.estacao.fecharTodas(); BC.maquina.abrir(id); }, pj);
    await esperar(800);
    const primeira = await medirTela(est.page);
    resultado.casos.primeiroProjeto = primeira;
    await print('maquina-vazia.png');
    assert.doesNotMatch(primeira.lateral + ' ' + primeira.conteudo, INVENTADOS);
    assert.match(primeira.conteudo, /Máquina · Agenda Real/);
    assert.match(primeira.conteudo, /0 peças · 0 alertas/);
    assert.match(primeira.conteudo, /A Máquina de Agenda Real ainda está vazia/);
    assert.equal(await est.page.evaluate((id) => BC.maquina.maquinas[id].pecas.length, pj), 0, 'zero peças inventadas');
  });

  it('A28 · o agente monta a Máquina pelo conector coop: peças tracejadas, fios, assinatura, diário', async () => {
    let r = await chamar('m-gaveta', 'coop_maquina_peca', { tipo: 'gaveta', nome: 'pacientes', frase: 'guarda os pacientes', campos: ['nome (texto)', 'nascimento (data)', 'telefone (texto)'], chave: 'só o dono' });
    assert.equal(r.ok, true, r.erro);
    assert.match(r.resultado.texto, /^Gaveta "pacientes" montada na Máquina de Agenda Real: entra tracejada .* assinada Rita · Theus\.$/);
    r = await chamar('m-porta', 'coop_maquina_peca', { tipo: 'porta', nome: 'novo paciente', verbo: 'RECEBE', campos: ['nome', 'nascimento'], para: 'pacientes' });
    assert.equal(r.ok, true, r.erro);
    r = await chamar('m-tela', 'coop_maquina_peca', { tipo: 'tela', nome: 'Cadastro', para: 'novo paciente' });
    assert.equal(r.ok, true, r.erro);
    r = await chamar('m-robo', 'coop_maquina_peca', { tipo: 'robo', nome: 'boas-vindas', frase: 'quando entra um paciente, manda a mensagem de boas-vindas', quando: 'quando entra', de: 'pacientes' });
    assert.equal(r.ok, true, r.erro);
    r = await chamar('m-cano', 'coop_maquina_peca', { tipo: 'cano', nome: 'ao vivo' });
    assert.equal(r.ok, true, r.erro);
    /* recusas: tela direto na gaveta, peça repetida, peça que não existe */
    r = await chamar('m-tela-gaveta', 'coop_maquina_ligar', { de: 'Cadastro', para: 'pacientes' });
    assert.equal(r.ok, false); assert.match(r.erro, /uma Tela não grava direto numa Gaveta/);
    r = await chamar('m-repetida', 'coop_maquina_peca', { tipo: 'gaveta', nome: 'Pacientes' });
    assert.equal(r.ok, false); assert.match(r.erro, /já está na Máquina/);
    r = await chamar('m-fantasma', 'coop_maquina_ligar', { de: 'pacientes', para: 'agenda fantasma' });
    assert.equal(r.ok, false); assert.match(r.erro, /não achei a peça "agenda fantasma"/);
    r = await chamar('m-ligar', 'coop_maquina_ligar', { de: 'pacientes', para: 'ao vivo' });
    assert.equal(r.ok, true, r.erro);
    r = await chamar('m-ligar-2', 'coop_maquina_ligar', { de: 'ao vivo', para: 'Cadastro' });
    assert.equal(r.ok, true, r.erro);

    r = await chamar('m-ler', 'coop_maquina', { projeto: 'agenda' });
    assert.equal(r.ok, true, r.erro);
    assert.equal(r.resultado.dados.pecas.length, 5);
    assert.equal(r.resultado.dados.fios.length, 5);
    assert.ok(r.resultado.dados.pecas.every((p) => !p.publicada && p.assinatura === 'Rita · Theus'));
    assert.match(r.resultado.texto, /^Máquina de Agenda Real · v1 · 5 peça\(s\) \(0 publicada\(s\), 5 no local\) · 5 fio\(s\):/);

    /* a tela aplicou: as peças estão no palco (tracejadas até publicar), a linha do tempo assinada, nada inventado */
    await ate(() => est.page.evaluate((id) => { const m = BC.maquina.maquinas[id]; return m && m.pecas.length === 5 && m.pecas.every((p) => p.pronta) && document.querySelectorAll('.mq2 .mq-peca[data-no]').length === 5; }, pj), { oque: 'as 5 peças encaixarem na tela' });
    const tela = await medirTela(est.page);
    resultado.casos.montada = tela;
    await print('maquina-montada-pelo-agente.png');
    assert.doesNotMatch(tela.lateral + ' ' + tela.conteudo, INVENTADOS);
    assert.match(tela.lateral, /Rita · Theus montou Gaveta "pacientes"/);
    assert.match(tela.lateral, /Rita · Theus ligou Gaveta "pacientes" a Cano "ao vivo"/);
    assert.match(tela.conteudo, /5 peças/);
    const tracejadas = await est.page.evaluate(() => [...document.querySelectorAll('.mq2 .mq-peca[data-no]')].filter((el) => el.classList.contains('local') && getComputedStyle(el).borderTopStyle === 'dashed').length);
    assert.equal(tracejadas, 5, 'no local = tracejada');
    const fiosNaTela = await est.page.evaluate(() => [...document.querySelectorAll('.mq2 path.mq-fio[data-de]')].filter((p) => (p.getAttribute('d') || '').length > 5).length);
    assert.equal(fiosNaTela, 5, 'os 5 fios desenhados no 2D');
    const diario = await est.api('/api/diario');
    const doAgente = diario.filter((x) => x.acao === 'porAgente' && (x.args[1] === 'maquinaPeca' || x.args[1] === 'maquinaLigar'));
    assert.equal(doAgente.length, 7, '5 peças + 2 fios no diário, assinados pelo agente');
    assert.deepEqual(doAgente[0].args[0], { id: 'ag-rita', nome: 'Rita' });
    const ev = await est.page.evaluate(() => BC.loja.estado.eventos.filter((e) => e.tipo === 'maquina')[0]);
    assert.match(ev.texto, /^Rita · Theus: Theus ligou Cano "ao vivo" a Tela "Cadastro"/);
  });

  it('F3.2 · o 3D da Máquina inteira renderiza: canvas com tamanho, pixels desenhados, as 5 peças e os 5 fios em cena', async () => {
    await est.page.click('.mq2 .mq-zoom [data-z="3d"]');
    const pronto = await ate(() => est.page.evaluate(() => { const m = BC.maquina.medidas3d(); return m && m.pronto && m.renders > 0 && m.emCena === 5 ? m : null; }), { ms: 30000, oque: 'o 3D montar (three.js)' });
    await esperar(500);
    const m = await medir3d(est.page);
    resultado.casos.tresD = m;
    await print('maquina-3d-tracejada.png');
    assert.ok(m.canvas.visivel && m.canvas.dentroDoConteudo, 'canvas visível dentro do conteúdo');
    assert.ok(m.canvas.w > 200 && m.canvas.h > 150, 'canvas com tamanho: ' + JSON.stringify(m.canvas));
    assert.ok(m.pixels > 2000, 'pixels desenhados: ' + m.pixels);
    assert.equal(pronto.total, 5);
    assert.equal(pronto.tracejadas, 5, 'tudo no local: tracejado');
    assert.equal(pronto.comCorpo, 0);
    assert.equal(await est.page.evaluate(() => document.querySelectorAll('#e-conteudo canvas').length), 1);
    assert.equal(await est.page.evaluate(() => BC.maquina.vista3d().fiosObj.length), 5, 'os fios em cena');
    resultado.casos.tresDAntes = { pixels: m.pixels, claros: m.claros };
  });

  it('F3.3 · Publicar dá corpo 3D às peças dentro da Máquina e vai para o diário; recarregar mantém tudo', async () => {
    await est.page.click('.mq2 .mq-topo [data-acao="mq-publicar"]');
    await est.page.fill('#mq-confirma', 'Agenda Real');
    await est.page.click('form[data-form="mq-publicar"] button[type="submit"]');
    const med = await ate(() => est.page.evaluate(() => { const m = BC.maquina.medidas3d(); return m && m.comCorpo === 5 && m.animando === 0 ? m : null; }), { ms: 20000, oque: 'as peças ganharem corpo no 3D' });
    await esperar(400);
    const m = await medir3d(est.page);
    resultado.casos.tresDDepois = m;
    await print('maquina-3d-corpo.png');
    assert.equal(med.tracejadas, 0);
    assert.equal(med.ganhou.length, 5, 'as 5 ganharam corpo (animação de ganhar corpo)');
    /* a ficha abre ao publicar e o palco muda de tamanho: compara a fração de pixels acesos (corpo iluminado), não o total */
    const antes = resultado.casos.tresDAntes, fr = (x) => x.claros / x.total;
    assert.ok(m.pixels > 2000 && fr(m) > fr(Object.assign({ total: resultado.casos.tresD.total }, antes)), 'com corpo acende mais que tracejado: ' + JSON.stringify({ antes: antes.claros + '/' + resultado.casos.tresD.total, depois: m.claros + '/' + m.total }));
    const est0 = await est.page.evaluate((id) => BC.loja.estado.maquinas[id].pecas.map((p) => p.publicada), pj);
    assert.deepEqual(est0, [true, true, true, true, true]);
    const diario = await est.api('/api/diario');
    assert.ok(diario.some((x) => x.acao === 'maquinaPublicar' && x.args[0].projeto === pj), 'publicação no diário');

    /* recarregar: a máquina volta do diário, publicada, com a linha do tempo assinada */
    await est.page.reload();
    await ate(() => est.page.evaluate(() => !!(window.BC && BC.real && BC.real.bemvindo && BC.estacao && BC.estacao.ui && BC.maquina)), { ms: 25000, oque: 'a Estação voltar' });
    await esperar(800);
    await est.page.evaluate((id) => { BC.estacao.fecharTodas(); BC.maquina.abrir(id); }, pj);
    await esperar(800);
    const volta = await est.page.evaluate((id) => { const m = BC.maquina.maquinas[id]; return { n: m.pecas.length, publicadas: m.pecas.filter((p) => p.publicada && p.corpo).length, fios: m.fios.length, versao: m.versao, corpo2d: document.querySelectorAll('.mq2 .mq-peca.corpo').length }; }, pj);
    const tela = await medirTela(est.page);
    resultado.casos.depoisDeRecarregar = Object.assign({ tela }, volta);
    await print('maquina-depois-de-recarregar.png');
    assert.deepEqual([volta.n, volta.publicadas, volta.fios, volta.versao], [5, 5, 5, 2]);
    assert.equal(volta.corpo2d, 5, 'no 2D as peças publicadas também têm corpo');
    assert.match(tela.lateral, /Rita · Theus montou Gaveta "pacientes"/);
    assert.doesNotMatch(tela.lateral + ' ' + tela.conteudo, INVENTADOS);
  });
});
