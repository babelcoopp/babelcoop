/* babel-coop · e2e: o terminal comanda a Estação (coop_abrir, coop_fechar, coop_onde, coop_tela) na página real.
   Uma Estação Electron de verdade (janela escondida), com a equipe fundada e a equipe de exemplo (Carla, Bruno…).
   As `mcp-chamada` chegam por BC.real.simular (como se viessem do servidor, igual a coop-ui.test.js) e a resposta é
   espiada em BC.real.enviar. Prova:
   - coop_abrir abre cada atividade da barra (nome sem acento e com maiúscula também), a barra marca a atividade, o aviso
     "Rita · Theus: abriu …" aparece e a luz de chegada corre (pulso do organismo ou a varredura do cabeçalho);
   - abre um arquivo gravado pela API /api/arquivo logo antes (pelo caminho relativo e pelo nome), o projeto, o perfil de
     uma pessoa e a Máquina do projeto em 3D e em 2D;
   - coop_tela e coop_onde devolvem o que está na tela (aba ativa, abas, atividade, endereço de cada um e o rastro);
   - coop_fechar fecha uma aba pelo título e depois tudo; recusas em português;
   - edição não salva não se perde: com texto digitado no modo Editar, coop_abrir recusa e coop_fechar deixa a aba aberta
     (o texto continua no campo); a mudança visual pendente sobrevive à troca de aba e segura o fechar;
   - o diário, medido desde antes do primeiro coop_abrir: nada assinado pelo agente; só o que as telas mandam num clique da
     pessoa: a posição ("posicao"), o "vendoArquivo" do arquivo de outra pessoa, o Chat lido ("lida") e o corpo das peças da
     Máquina 3D ("corpoPeca"). É isso que as descrições das ferramentas dizem.
   Porta 5488, descoberta 41988. Evidências: BABEL_TESTE_EVIDENCIAS=<pasta> (coop-telas-resultado.json + print).
   Rodar: node --test testes/e2e/coop-telas.test.js
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { abrirEstacao } = require('./estacao');

const PORTA = 5488, DESCOBERTA = 41988;
const EVID = process.env.BABEL_TESTE_EVIDENCIAS || null;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function ate(fn, { ms = 10000, passo = 100, oque = 'condição' } = {}) {
  const fim = Date.now() + ms;
  let ultimo;
  while (Date.now() < fim) {
    ultimo = await fn();
    if (ultimo) return ultimo;
    await esperar(passo);
  }
  throw new Error('tempo esgotado esperando ' + oque + (ultimo !== undefined ? ' (último: ' + JSON.stringify(ultimo) + ')' : ''));
}

describe('coop-telas: o que se pede no terminal abre e troca a tela da Estação', { timeout: 240000 }, () => {
  let est, eu, projeto, resultado = { casos: {} };
  const erros = [];
  const tela = () => est.page.evaluate(() => {
    const t = BC.estacao.abaAtual(), barra = document.querySelector('#e-atividades button[aria-current="page"]');
    return { tipo: t.tipo, ref: t.ref == null ? null : t.ref, abas: BC.estacao.ui.abas.length, barra: barra ? barra.getAttribute('data-id') : null, toast: (document.getElementById('e-toast') || {}).textContent || '' };
  });
  let n = 0;
  const chamar = async (ferramenta, args) => {
    const cid = 'tt-' + (++n) + '-' + ferramenta, inicio = Date.now();
    await est.page.evaluate((m) => BC.real.simular(m), { tipo: 'mcp-chamada', cid, sessao: 's-rita', ferramenta, args, agente: { id: 'ag-rita', nome: 'Rita', dono: eu.id } });
    const r = await ate(() => est.page.evaluate((c) => window.__enviados.filter((m) => m.tipo === 'mcp-resposta' && m.cid === c)[0] || null, cid), { ms: 8000, oque: 'mcp-resposta ' + cid });
    resultado.casos[cid] = { ferramenta, args, ms: Date.now() - inicio, ok: r.ok, texto: r.ok ? r.resultado.texto : r.erro };
    return r;
  };
  const diario = () => est.api('/api/diario');
  let idsAntes = null;

  before(async () => {
    est = await abrirEstacao({ nome: 'coop-telas', porta: PORTA, descoberta: DESCOBERTA, env: { BABEL_COOP_EXEMPLOS: '1' } });
    est.page.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
    est.page.on('dialog', (d) => { erros.push('janela do navegador: ' + d.type() + ' ' + d.message()); d.dismiss().catch(() => {}); });
    await est.page.waitForLoadState('load');
    const f = await est.api('/api/fundar', { nome: 'Theus' });
    assert.ok(f.pronto, 'fundou a equipe: ' + JSON.stringify(f));
    eu = f;
    await est.page.reload();
    await ate(() => est.page.evaluate(() => !!(window.BC && BC.real && BC.real.bemvindo && BC.real.eu() && BC.real.eu().pronto && BC.loja.eu === BC.real.eu().id && BC.estacao && BC.estacao.ui)), { ms: 20000, oque: 'a Estação reconhecer o Theus' });
    const trazido = await est.page.evaluate(() => !!(BC.coop && BC.coop.versao));
    if (!trazido) await est.page.addScriptTag({ url: est.base + '/coop/coop-ui.js' });
    await ate(() => est.page.evaluate(() => !!(BC.coop && BC.coop.versao && BC.coop.ferramentas.indexOf('coop_abrir') !== -1)), { oque: 'coop-ui com coop_abrir' });
    await est.page.evaluate(() => {
      window.__enviados = [];
      const original = BC.real.enviar;
      BC.real.enviar = function (m) { window.__enviados.push(JSON.parse(JSON.stringify(m))); return original(m); };
    });
    resultado.coopUiInjetadoPeloTeste = !trazido;
    /* um projeto só deste teste (pelo mesmo caminho assinado que o agente usa) */
    const r = await chamar('coop_acao', { acao: 'novoProjeto', args: [{ nome: 'Loja Aurora' }] });
    assert.equal(r.ok, true, r.erro);
    projeto = await est.page.evaluate(() => BC.loja.estado.projetos.filter((p) => p.nome === 'Loja Aurora')[0]);
    assert.ok(projeto && projeto.id, 'o projeto nasceu');
    /* o diário antes do primeiro coop_abrir (depois do projeto assinado acima já ter entrado) */
    await ate(async () => (await diario()).some((x) => x.acao === 'porAgente' && x.args[1] === 'novoProjeto'), { oque: 'o novoProjeto assinado no diário' });
    await esperar(900);
    idsAntes = new Set((await diario()).map((x) => x.id));
    resultado.diarioAntes = idsAntes.size;
    resultado.eu = { id: eu.id, nome: eu.nome };
    resultado.projeto = { id: projeto.id, nome: projeto.nome };
  });

  after(async () => {
    resultado.erros = erros;
    if (EVID) {
      fs.mkdirSync(EVID, { recursive: true });
      try { await est.page.screenshot({ path: path.join(EVID, 'estacao-coop-telas.png') }); } catch (e) { resultado.print = 'falhou: ' + e.message; }
      fs.writeFileSync(path.join(EVID, 'coop-telas-resultado.json'), JSON.stringify(resultado, null, 2));
    }
    if (est) await est.fechar();
  });

  it('coop_abrir atividade: as 12 da barra abrem no meio (sem acento e com maiúscula), a barra marca e a luz de chegada corre', async () => {
    const pulsosAntes = await est.page.evaluate(() => (BC.organismo && BC.organismo.contagem ? BC.organismo.contagem().pulso || 0 : null));
    const casos = [['Meu dia', 'dia', 'dia', 'Meu dia'], ['criar', 'explorador', 'explorador', 'Criar'], ['TRABALHO', 'demandas', 'demandas', 'Trabalho'], ['chat', 'chat', 'chat', 'Chat'],
      ['whatsapp', 'whatsapp', 'whatsapp', 'WhatsApp'], ['reuniao', 'reuniao', 'reuniao', 'Reunião'], ['Terminais', 'terminais', 'terminais', 'Terminais'], ['projetos', 'projetos', 'projetos', 'Projetos'],
      ['Acervo', 'acervo', 'acervo', 'Acervo'], ['a equipe', 'equipe', 'equipe', 'Equipe'], ['loja', 'loja', 'loja', 'Loja'], ['OFICINA', 'oficina', 'oficina', 'Oficina']];
    const vistos = [];
    for (const [ref, tipo, barra, nome] of casos) {
      const r = await chamar('coop_abrir', { o: 'atividade', ref });
      assert.equal(r.ok, true, ref + ': ' + r.erro);
      assert.match(r.resultado.texto, new RegExp('^Abri ' + nome + ' na Estação de Theus'), ref);
      assert.equal(r.resultado.dados.atividade.nome, nome);
      const t = await tela();
      assert.equal(t.tipo, tipo, ref + ' abriu no meio');
      assert.equal(t.barra, barra, ref + ' marcada na barra');
      assert.equal(t.toast, 'Rita · Theus: abriu ' + nome, 'o aviso diz que foi o agente');
      vistos.push({ ref, tipo: t.tipo, barra: t.barra });
    }
    resultado.casos.atividades = vistos;
    /* a luz de chegada: o pulso do organismo (quando carregado) e a varredura do cabeçalho do endereço, que tem fim */
    const luz = await ate(() => est.page.evaluate(([antes, total]) => {
      const O = BC.organismo, nav = document.getElementById('e-endereco');
      const pulsos = O && O.contagem ? O.contagem().pulso || 0 : null;
      return (antes == null || pulsos >= antes + total) ? { pulsos, varrendo: !!(nav && nav.classList.contains('end-chegada')), organismo: !!O } : null;
    }, [pulsosAntes, casos.length]), { oque: 'um pulso de chegada por abertura' });
    resultado.casos.luz = Object.assign({ antes: pulsosAntes }, luz);
    await esperar(1600);
    const acabou = await est.page.evaluate(() => { const nav = document.getElementById('e-endereco'); return !nav || !nav.classList.contains('end-chegada'); });
    assert.ok(acabou, 'a varredura do cabeçalho tem fim');
    /* "Máquina" como atividade abre a Máquina do primeiro projeto; nome desconhecido é recusado com a lista */
    const r = await chamar('coop_abrir', { o: 'atividade', ref: 'Cozinha' });
    assert.equal(r.ok, false);
    assert.match(r.erro, /não conheço a atividade "Cozinha"\. As da barra: Meu dia, Criar, Trabalho/);
  });

  it('coop_abrir arquivo: abre o que a API acabou de gravar, pelo caminho e pelo nome; o inexistente é recusado', async () => {
    const put = await fetch(est.base + '/api/arquivo?caminho=' + encodeURIComponent('propostas/aurora.md'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conteudo: '# Proposta Aurora\n\nTexto de teste do coop_abrir.\n' }) });
    assert.equal(put.status, 200, 'PUT do arquivo');
    /* sem esperar a árvore: coop_abrir pede a lista e espera o arquivo aparecer */
    let r = await chamar('coop_abrir', { o: 'arquivo', ref: 'propostas/aurora.md' });
    assert.equal(r.ok, true, r.erro);
    const caminho = eu.id + '/propostas/aurora.md';
    assert.match(r.resultado.texto, new RegExp('^Abri ' + caminho.replace(/\//g, '\\/') + ' na Estação de Theus · '));
    let t = await tela();
    const arq = await est.page.evaluate((c) => BC.loja.arquivo(c), caminho);
    assert.ok(arq, 'o arquivo está na árvore');
    assert.deepEqual([t.tipo, t.ref], ['arquivo', arq.id], 'o arquivo abriu no meio');
    assert.equal(r.resultado.dados.aberto.caminho, caminho);
    assert.equal(t.barra, 'explorador', 'Criar marcada na barra');
    /* pelo nome, depois de outra tela */
    await chamar('coop_abrir', { o: 'atividade', ref: 'chat' });
    r = await chamar('coop_abrir', { o: 'arquivo', ref: 'aurora.md' });
    assert.equal(r.ok, true, r.erro);
    t = await tela();
    assert.deepEqual([t.tipo, t.ref], ['arquivo', arq.id]);
    r = await chamar('coop_abrir', { o: 'arquivo', ref: 'nao-existe-zzz.md' });
    assert.equal(r.ok, false);
    assert.match(r.erro, /não achei o arquivo "nao-existe-zzz\.md" na pasta compartilhada/);
    resultado.casos.arquivo = { caminho, id: arq.id };
  });

  it('coop_abrir projeto, pessoa e a Máquina do projeto em 3D e em 2D', async () => {
    let r = await chamar('coop_abrir', { o: 'projeto', ref: 'aurora' });
    assert.equal(r.ok, true, r.erro);
    assert.match(r.resultado.texto, /^Abri o projeto Loja Aurora na Estação de Theus/);
    let t = await tela();
    assert.deepEqual([t.tipo, t.ref, t.barra], ['projeto', projeto.id, 'projetos']);

    r = await chamar('coop_abrir', { o: 'pessoa', ref: 'carla' });
    assert.equal(r.ok, true, r.erro);
    assert.match(r.resultado.texto, /^Abri o perfil de Carla/);
    t = await tela();
    assert.deepEqual([t.tipo, t.ref, t.barra], ['perfil', 'carla', 'equipe']);
    r = await chamar('coop_abrir', { o: 'pessoa', ref: 'Fulano de Tal' });
    assert.equal(r.ok, false);
    assert.match(r.erro, /não achei "Fulano de Tal" na equipe/);

    r = await chamar('coop_abrir', { o: 'maquina', ref: 'Loja Aurora', modo: '3d' });
    assert.equal(r.ok, true, r.erro);
    assert.match(r.resultado.texto, /^Abri a Máquina de Loja Aurora em 3D/);
    t = await tela();
    assert.deepEqual([t.tipo, t.ref], ['maquina', projeto.id]);
    let zoom = await est.page.evaluate((id) => BC.maquina.maquinas[id] && BC.maquina.maquinas[id].zoom, projeto.id);
    assert.equal(zoom, '3d', 'a Máquina está em 3D');
    assert.equal(r.resultado.dados.aberto.modo, '3d');
    const no3d = await ate(() => est.page.evaluate(() => { const c = document.getElementById('e-conteudo'); return c && c.querySelector('canvas') ? true : null; }), { ms: 8000, oque: 'o 3D desenhar na tela' }).catch(() => false);
    resultado.casos.maquina3dCanvas = no3d;

    r = await chamar('coop_abrir', { o: 'maquina', ref: 'loja aurora' });
    assert.equal(r.ok, true, r.erro);
    assert.match(r.resultado.texto, /em 2D/);
    zoom = await est.page.evaluate((id) => BC.maquina.maquinas[id] && BC.maquina.maquinas[id].zoom, projeto.id);
    assert.notEqual(zoom, '3d', 'voltou para o 2D');
    r = await chamar('coop_abrir', { o: 'maquina', ref: 'Projeto Fantasma' });
    assert.equal(r.ok, false);
    assert.match(r.erro, /não achei o projeto "Projeto Fantasma"/);
    resultado.casos.maquina = { projeto: projeto.id, zoomDepois2d: zoom };
  });

  it('coop_tela e coop_onde devolvem o que está na tela e onde cada um está', async () => {
    await chamar('coop_abrir', { o: 'arquivo', ref: 'propostas/aurora.md' });
    let r = await chamar('coop_tela', {});
    assert.equal(r.ok, true, r.erro);
    const d = r.resultado.dados;
    assert.equal(d.ativa.tipo, 'arquivo');
    assert.equal(d.ativa.titulo, 'aurora.md');
    assert.equal(d.ativa.caminho, eu.id + '/propostas/aurora.md');
    assert.match(d.ativa.endereco, /aurora\.md$/);
    assert.equal(d.atividade.nome, 'Criar');
    const abasNaTela = await est.page.evaluate(() => BC.estacao.ui.abas.length);
    assert.equal(d.abas.length, abasNaTela, 'todas as abas abertas');
    assert.ok(d.abas.some((x) => x.tipo === 'maquina' && x.modo === '2d'), 'a Máquina aberta (2D) está na lista');
    assert.ok(d.abas.some((x) => x.tipo === 'perfil' && x.titulo === 'Sobre Carla'));
    assert.match(r.resultado.texto, /^Na Estação de Theus agora:\n- aba ativa: aurora\.md \(arquivo\) · .*arquivo .*propostas\/aurora\.md\n- abas abertas \(\d+\): .*\n- atividade da barra: Criar$/);

    r = await chamar('coop_onde', {});
    assert.equal(r.ok, true, r.erro);
    const theus = r.resultado.dados.posicoes.filter((p) => p.id === eu.id)[0];
    assert.ok(theus, 'o Theus está na lista');
    assert.equal(theus.eu, true);
    assert.match(theus.endereco, /aurora\.md$/, 'o endereço do Theus é o arquivo aberto');
    assert.ok(r.resultado.dados.posicoes.some((p) => p.id === 'carla'), 'a Carla (exemplo) está na lista');
    assert.match(r.resultado.texto, /^Onde cada um está \(Sala › bancada › peça\):\n- /);
    assert.match(r.resultado.texto, /Theus \(esta Estação\): .*aurora\.md · agora/);

    /* o rastro: a posição que a Estação grava (700 ms parada no objeto) entra por onde o Theus passou */
    await esperar(900);
    r = await chamar('coop_onde', { pessoa: 'theus' });
    assert.equal(r.ok, true, r.erro);
    assert.match(r.resultado.dados.posicao.endereco, /aurora\.md$/);
    assert.ok(r.resultado.dados.rastro.length >= 1, 'há rastro');
    assert.match(r.resultado.texto, /\nPor onde passou:\n- \d\d:\d\d · /);
    r = await chamar('coop_onde', { pessoa: 'Ninguém Zzz' });
    assert.equal(r.ok, false);
    assert.match(r.erro, /não achei "Ninguém Zzz" na equipe nem entre os agentes/);
    resultado.casos.tela = d;
  });

  it('coop_fechar fecha uma aba pelo título e depois tudo', async () => {
    let r = await chamar('coop_fechar', { o: 'aba', ref: 'aurora' });
    assert.equal(r.ok, true, r.erro);
    assert.match(r.resultado.texto, /^Fechei a aba "aurora\.md"\./);
    const ficou = await est.page.evaluate(() => BC.estacao.ui.abas.map((t) => t.id));
    assert.ok(!ficou.includes('arq:' + resultado.casos.arquivo.id), 'a aba do arquivo saiu: ' + ficou.join(', '));
    assert.ok(ficou.includes('projeto:' + projeto.id), 'a aba "Loja Aurora" (também tem "aurora") ficou');
    r = await chamar('coop_fechar', { o: 'aba', ref: 'planilha-que-nao-esta-aberta' });
    assert.equal(r.ok, false);
    assert.match(r.erro, /não há aba "planilha-que-nao-esta-aberta" aberta\. Abertas: /);
    const abertas = await est.page.evaluate(() => BC.estacao.ui.abas.length);
    assert.ok(abertas > 1, 'ainda há abas para fechar');
    r = await chamar('coop_fechar', { o: 'tudo' });
    assert.equal(r.ok, true, r.erro);
    assert.match(r.resultado.texto, new RegExp('^Fechei ' + abertas + ' abas \\(.*\\): o meio da Estação ficou vazio\\.$'));
    const t = await tela();
    assert.deepEqual([t.abas, t.tipo], [0, 'vazio']);
    assert.equal(t.toast, 'Rita · Theus: fechou todas as abas');
    r = await chamar('coop_tela', {});
    assert.equal(r.ok, true, r.erro);
    assert.equal(r.resultado.dados.ativa, null);
    assert.match(r.resultado.texto, /- aba ativa: nenhuma: o meio está vazio\n- abas abertas \(0\): nenhuma/);
    r = await chamar('coop_fechar', { o: 'aba' });
    assert.equal(r.ok, false);
    assert.match(r.erro, /não há aba aberta para fechar/);
    const hist = await est.page.evaluate(() => BC.coop.historico().map((h) => h.tipo + ':' + h.ferramenta));
    assert.ok(hist.includes('tela:coop_abrir') && hist.includes('tela:coop_fechar') && hist.includes('consulta:coop_tela') && hist.includes('consulta:coop_onde'));
  });

  it('edição não salva: coop_abrir recusa e coop_fechar deixa a aba aberta; o texto digitado continua no campo', async () => {
    await chamar('coop_abrir', { o: 'projeto', ref: 'Loja Aurora' });
    await chamar('coop_abrir', { o: 'atividade', ref: 'chat' });
    let r = await chamar('coop_abrir', { o: 'arquivo', ref: 'propostas/aurora.md' });
    assert.equal(r.ok, true, r.erro);
    const id = resultado.casos.arquivo.id, sel = '[id="ed-texto-' + id + '"]';
    await est.page.click('#e-conteudo button[data-acao="ed-modo"][data-modo="editar"]');
    await est.page.waitForSelector(sel);
    const digitado = '# Proposta Aurora\n\nTexto que a pessoa digitou e ainda não salvou.\n';
    await est.page.fill(sel, digitado);
    const campo = () => est.page.evaluate((i) => { const c = document.getElementById('ed-texto-' + i); return c ? c.value : null; }, id);

    for (const args of [{ o: 'atividade', ref: 'chat' }, { o: 'pessoa', ref: 'carla' }, { o: 'maquina', ref: 'Loja Aurora', modo: '3d' }]) {
      r = await chamar('coop_abrir', args);
      assert.equal(r.ok, false, JSON.stringify(args) + ' devia recusar');
      assert.match(r.erro, /Theus está editando aurora\.md e ainda não salvou: abrir outra coisa agora jogaria fora o texto digitado\. Peça para salvar \(Ctrl\+S\) ou cancelar/);
    }
    let t = await tela();
    assert.deepEqual([t.tipo, t.ref], ['arquivo', id], 'a aba em edição continua na tela');
    assert.equal(await campo(), digitado, 'o texto digitado continua no campo');
    /* o mesmo arquivo não troca de aba: abre (não perde nada) */
    r = await chamar('coop_abrir', { o: 'arquivo', ref: 'aurora.md' });
    assert.equal(r.ok, true, r.erro);
    assert.equal(await campo(), digitado, 'reabrir o mesmo arquivo não apaga o texto');

    r = await chamar('coop_fechar', { o: 'aba', ref: 'aurora' });
    assert.equal(r.ok, false);
    assert.match(r.erro, /a aba "aurora\.md" tem edição não salva \(texto digitado no modo Editar\): não fechei\. Peça para Theus salvar ou descartar antes\./);
    r = await chamar('coop_fechar', { o: 'aba', ref: 'Chat' });
    assert.equal(r.ok, true, r.erro);
    assert.equal(await campo(), digitado, 'fechar outra aba não apaga o texto');
    const antes = await est.page.evaluate(() => BC.estacao.ui.abas.length);
    assert.ok(antes > 1, 'há outras abas para fechar');
    r = await chamar('coop_fechar', { o: 'tudo' });
    assert.equal(r.ok, true, r.erro);
    assert.match(r.resultado.texto, new RegExp('^Fechei ' + (antes - 1) + ' abas? \\(.*\\)\\. Deixei aberta aurora\\.md \\(edição não salva: texto digitado no modo Editar\\): peça para Theus salvar ou descartar antes de fechar\\.$'));
    assert.deepEqual(r.resultado.dados.mantidas, [{ titulo: 'aurora.md', oque: 'texto digitado no modo Editar' }]);
    t = await tela();
    assert.deepEqual([t.abas, t.tipo, t.ref], [1, 'arquivo', id]);
    assert.equal(await campo(), digitado, 'fechar tudo não apaga o texto');
    r = await chamar('coop_fechar', { o: 'tudo' });
    assert.equal(r.ok, false);
    assert.match(r.erro, /não fechei nada: aurora\.md \(edição não salva: texto digitado no modo Editar\)\. Peça para Theus salvar ou descartar antes\./);

    /* a pessoa cancela a edição; uma mudança visual pendente sobrevive à troca de aba, mas segura o fechar */
    await est.page.click('#e-conteudo button[data-acao="ed-modo"][data-modo="ver"]');
    assert.equal(await campo(), null, 'saiu do modo Editar');
    await est.page.evaluate(() => { BC.estacao.abaAtual().rascunhoVisual = '<p>mudança feita na tela</p>'; });
    r = await chamar('coop_abrir', { o: 'atividade', ref: 'chat' });
    assert.equal(r.ok, true, 'sem texto digitado, abrir troca de aba: ' + r.erro);
    const visual = await est.page.evaluate((i) => (BC.estacao.ui.abas.filter((x) => x.id === 'arq:' + i)[0] || {}).rascunhoVisual, id);
    assert.equal(visual, '<p>mudança feita na tela</p>', 'a mudança visual continua na aba');
    r = await chamar('coop_fechar', { o: 'aba', ref: 'aurora' });
    assert.equal(r.ok, false);
    assert.match(r.erro, /tem edição não salva \(mudança visual pendente\): não fechei/);
    r = await chamar('coop_fechar', { o: 'tudo' });
    assert.equal(r.ok, true, r.erro);
    assert.match(r.resultado.texto, /^Fechei 1 aba \(Chat\)\. Deixei aberta aurora\.md \(edição não salva: mudança visual pendente\)/);
    await est.page.evaluate((i) => { BC.estacao.ui.abas.forEach((x) => { if (x.id === 'arq:' + i) x.rascunhoVisual = null; }); }, id);
    r = await chamar('coop_fechar', { o: 'tudo' });
    assert.equal(r.ok, true, r.erro);
    t = await tela();
    assert.deepEqual([t.abas, t.tipo], [0, 'vazio']);
    resultado.casos.edicaoNaoSalva = { recusouAbrir: 3, fecharTudoDeixou: 'aurora.md', textoIntacto: true };
  });

  it('o diário desde antes do primeiro coop_abrir: nada assinado pelo agente; só o que as telas mandam num clique da pessoa', async () => {
    /* arquivo de outra pessoa (a equipe de exemplo), quando houver: abrir avisa o dono ("vendoArquivo") */
    const alheio = await est.page.evaluate((eu) => { const a = (BC.loja.estado.arquivos || []).filter((x) => x.dono !== eu && x.dono !== 'equipe' && !x.local)[0]; return a ? { id: a.id, caminho: a.caminho, dono: a.dono } : null; }, eu.id);
    if (alheio) {
      const r = await chamar('coop_abrir', { o: 'arquivo', ref: alheio.caminho });
      assert.equal(r.ok, true, r.erro);
    }
    await esperar(1200);
    const novos = (await diario()).filter((x) => !idsAntes.has(x.id));
    resultado.casos.diario = { novos: novos.map((x) => ({ quem: x.quem, acao: x.acao, tipo: x.args[0] && x.args[0].tipo, ref: x.args[0] && typeof x.args[0] === 'object' ? x.args[0].ref : x.args[0] })), alheio };
    assert.ok(novos.length > 0, 'a presença da pessoa foi para o diário');
    assert.deepEqual(novos.filter((x) => x.acao === 'porAgente'), [], 'nada assinado pelo agente');
    const doClique = ['posicao', 'vendoArquivo', 'lida', 'corpoPeca'];
    assert.deepEqual([...new Set(novos.map((x) => x.acao))].filter((a) => !doClique.includes(a)), [], 'só o que as telas mandam num clique: ' + doClique.join(', '));
    assert.ok(novos.every((x) => x.quem === eu.id), 'em nome da própria pessoa');
    assert.ok(novos.some((x) => x.acao === 'posicao' && x.args[0].tipo === 'arquivo'), 'o arquivo que o agente abriu virou a posição da pessoa');
    if (alheio) assert.ok(novos.some((x) => x.acao === 'vendoArquivo' && x.args[0] === alheio.id), 'o dono do arquivo é avisado');
  });

  it('a página não deu erro', () => {
    assert.deepEqual(erros, []);
  });
});
