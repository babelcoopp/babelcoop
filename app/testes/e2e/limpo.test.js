/* babel-coop · e2e do app limpo: a Estação real nasce vazia, só com as pessoas de verdade, e a árvore é a pasta real
   Duas Estações de verdade (Electron escondido, raízes temporárias novas):
   1. o Theus funda a equipe pela tela de boas-vindas → zero pessoas, arquivos, demandas, chat e projetos de exemplo; só o Theus
   2. a árvore mostra a pasta real (~/BabelCoop/theus) com o README.md que o servidor criou; abrir lê o disco
   3. criar arquivo e pasta pela tela → existem no disco; editar e salvar → o conteúdo está gravado; arquivo que nasce no disco aparece
   4. a Rita entra com o token de /api/convite → aparece na equipe do Theus e a pasta dela aparece na árvore dele
   5. o Theus cria uma demanda para a Rita pela tela → chega na Rita pelo diário real, com o mesmo id
   6. a barra do plano: 12 atividades na ordem, rótulo 11 px, foto 22 px; grupos com alternador
   Prints e medidas: .deus/terminal-ao-vivo/evidencias/limpo/ (ou BABEL_TESTE_EVIDENCIAS).
   Rodar: cd app && node --test testes/e2e/limpo.test.js   ·   Portas: HTTP 5111 (Theus), 5112 (Rita), UDP 41611. */
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { abrirEstacao, raizTemporaria, APP } = require('./estacao');

const EVID = process.env.BABEL_TESTE_EVIDENCIAS || path.join(APP, '..', '.deus', 'terminal-ao-vivo', 'evidencias', 'limpo');
const BARRA = ['dia', 'explorador', 'demandas', 'chat', 'whatsapp', 'reuniao', 'terminais', 'projetos', 'acervo', 'equipe', 'loja', 'oficina'];
const ROTULOS = ['Meu dia', 'Criar', 'Trabalho', 'Chat', 'WhatsApp', 'Reunião', 'Terminais', 'Projetos', 'Acervo', 'Equipe', 'Loja', 'Oficina'];
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function ate(page, fn, arg, oque, ms = 15000) {
  try { return await page.waitForFunction(fn, arg, { timeout: ms, polling: 100 }); }
  catch (e) { throw new Error('tempo esgotado esperando ' + oque + ': ' + e.message.split('\n')[0]); }
}
async function print(page, nome) { await page.screenshot({ path: path.join(EVID, nome), timeout: 15000 }); return nome; }
async function prontaNaEquipe(page) {
  await page.waitForLoadState('domcontentloaded');
  await ate(page, () => window.BC && BC.real && BC.real.bemvindo && BC.real.bemvindo.eu && BC.real.bemvindo.eu.pronto && BC.estacao && BC.estacao.ui && BC.loja.estado, null, 'a Estação pronta na equipe', 25000);
}
function vigiarErros(page, quem, lista) {
  page.on('pageerror', (e) => lista.push(quem + ' pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|ERR_|502|Failed to load resource/.test(m.text())) lista.push(quem + ' console: ' + m.text()); });
}
/* o que o estado mostra (contagens de tudo o que o protótipo trazia de exemplo) */
const retrato = () => {
  const e = BC.loja.estado;
  return {
    eu: BC.loja.eu, pessoas: e.pessoas.map((p) => p.id).sort(), demandas: e.demandas.length, tarefas: e.tarefas.length, projetos: e.projetos.length,
    arquivosExemplo: e.arquivos.filter((a) => !a._real).map((a) => a.caminho), arquivosReais: e.arquivos.filter((a) => a._real).map((a) => a.caminho).sort(),
    conversas: e.conversas.map((c) => c.id), mensagens: Object.keys(e.mensagens).reduce((s, k) => s + e.mensagens[k].length, 0),
    metas: e.metas.length, avisos: e.avisos.length, mural: e.mural.length, whatsapp: e.whatsapp.conversas.length, loja: e.lojaEquipe.length,
    acervoExemplo: e.aprendizados.length + e.prompts.length + e.ideias.length + e.pergunta.respostas.length, reuniao: !!(e.reuniao && e.reuniao.ativa),
    rodando: e.demandas.filter((d) => d.estado === 'andamento').length, presets: e.presets.length, campanhas: e.campanhas.length,
    novidades: e.eventos.length, agentes: e.pessoas.reduce((s, p) => s.concat((p.agentes || []).map((a) => p.id + '/' + a.nome)), []),
    /* o único agente que pode existir é o Assistente do próprio terminal real (terminal-real.js cria na primeira abertura) */
    agentesExemplo: e.pessoas.reduce((s, p) => s + (p.agentes || []).filter((a) => a.id !== 'assistente').length, 0),
    marcaProtótipo: /protótipo/i.test((document.querySelector('.e-marca') || {}).textContent || ''),
    verComoVisivel: !!(document.getElementById('ver-como') && document.getElementById('ver-como').offsetParent)
  };
};

describe('app limpo · só a minha conta, a pasta real e a barra do plano', { timeout: 300000 }, () => {
  let T = null, R = null, raizT = null, raizR = null;
  const erros = [], medidas = {};

  before(async () => {
    fs.mkdirSync(EVID, { recursive: true });
    raizT = raizTemporaria('limpo-theus'); raizR = raizTemporaria('limpo-rita');
    T = await abrirEstacao({ nome: 'limpo-theus', raiz: raizT, porta: 5111, descoberta: 41611 });
    vigiarErros(T.page, 'theus', erros);
    await T.page.waitForLoadState('domcontentloaded');
    /* fundar pela tela de boas-vindas, como o Theus faz no primeiro computador */
    await ate(T.page, () => !!document.getElementById('cbv-fundar'), null, 'a tela de boas-vindas');
    await T.page.evaluate(() => { document.querySelector('#coop-boasvindas details').open = true; });
    await T.page.fill('#cbv-nome', 'Theus');
    await Promise.all([T.page.waitForEvent('load', { timeout: 20000 }), T.page.click('#cbv-fundar')]);
    await prontaNaEquipe(T.page);
  });

  after(async () => {
    try { fs.writeFileSync(path.join(EVID, 'resultado.json'), JSON.stringify({ quando: new Date().toISOString(), erros, medidas }, null, 2)); } catch (e) { /* segue */ }
    if (T) await T.fechar().catch(() => {});
    if (R) await R.fechar().catch(() => {});
    for (const r of [raizT, raizR]) { try { if (r) fs.rmSync(r, { recursive: true, force: true }); } catch (e) { /* segue */ } }
  });

  it('1 · fundar "Theus" → nada de exemplo: só o Theus, sem arquivos, demandas, chat, projetos, loja, reunião nem "protótipo"', async () => {
    const r = await T.page.evaluate(retrato);
    medidas.vazio = r;
    assert.equal(r.eu, 'theus');
    assert.deepEqual(r.pessoas, ['theus']);
    assert.deepEqual(r.arquivosExemplo, []);
    for (const k of ['demandas', 'tarefas', 'projetos', 'mensagens', 'metas', 'avisos', 'mural', 'whatsapp', 'loja', 'acervoExemplo', 'rodando', 'presets', 'campanhas', 'agentesExemplo']) assert.equal(r[k], 0, k + ' = ' + r[k]);
    assert.deepEqual(r.conversas, ['geral']);
    assert.equal(r.reuniao, false);
    assert.equal(r.marcaProtótipo, false);
    assert.equal(r.verComoVisivel, false);
    await T.page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.abrir('dia'); });
    await esperar(400);
    medidas.print_meu_dia = await print(T.page, 'limpo-1-meu-dia-vazio.png');
    await T.page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.abrir('demandas'); });
    await esperar(300);
    medidas.print_demandas = await print(T.page, 'limpo-1-demandas-vazio.png');
    await T.page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.abrir('equipe'); });
    await esperar(300);
    const equipe = await T.page.evaluate(() => document.getElementById('e-lateral').textContent + ' ' + document.getElementById('e-conteudo').textContent);
    assert.ok(!/\b(Ana|Bruno|Carla|Davi|Eva|Felipe|Gabi|Hugo|Iara|João)\b/.test(equipe), 'nome de exemplo na Equipe: ' + equipe.slice(0, 200));
    medidas.print_equipe = await print(T.page, 'limpo-1-equipe-so-theus.png');
  });

  it('2 · a árvore mostra a pasta real com o README.md do servidor, e abrir lê o disco', async () => {
    const { page } = T;
    await page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.abrir('explorador'); });
    await ate(page, () => !!document.querySelector('.arv-arq[data-id="theus/README.md"]'), null, 'README.md na árvore');
    await page.click('.arv-arq[data-id="theus/README.md"]');
    await ate(page, () => { const a = BC.loja.arquivo('theus/README.md'); return a && a._carregado && /pasta compartilhada/.test(a.conteudo); }, null, 'o conteúdo real do README.md');
    await ate(page, () => /pasta compartilhada/.test(document.getElementById('e-conteudo').textContent), null, 'o README.md desenhado no meio');
    const noDisco = fs.readFileSync(path.join(raizT, 'theus', 'README.md'), 'utf8');
    assert.equal(await page.evaluate(() => BC.loja.arquivo('theus/README.md').conteudo), noDisco);
    medidas.print_arvore = await print(page, 'limpo-2-arvore-readme.png');
  });

  it('3 · criar arquivo e pasta pela tela → no disco; editar e salvar → gravado; arquivo que nasce no disco aparece', async () => {
    const { page } = T;
    await page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.abrir('explorador'); });
    await page.click('.arv-ferr [data-acao="novo-arquivo"]');
    await page.fill('#novo-arq-nome', 'ideia.md');
    await page.$eval('form[data-form="novo-arquivo"]', (f) => f.requestSubmit());
    const arq = path.join(raizT, 'theus', 'ideia.md');
    for (let i = 0; i < 50 && !fs.existsSync(arq); i++) await esperar(100);
    assert.ok(fs.existsSync(arq), 'ideia.md não apareceu no disco');
    assert.equal(fs.readFileSync(arq, 'utf8'), '# ideia\n');
    /* editar e salvar pelo editor do protótipo (a aba abriu em modo editar) */
    const campo = page.locator('textarea[id="ed-texto-theus/ideia.md"]');
    await campo.waitFor({ timeout: 8000 });
    const texto = '# ideia\n\nSalvo pela Estação limpa em ' + new Date().toISOString() + '\n';
    await campo.fill(texto);
    await page.click('[data-acao="ed-salvar"]');
    for (let i = 0; i < 50 && fs.readFileSync(arq, 'utf8') !== texto; i++) await esperar(100);
    assert.equal(fs.readFileSync(arq, 'utf8'), texto);
    medidas.print_salvo = await print(page, 'limpo-3-arquivo-salvo.png');
    /* ＋ Pasta: cria a pasta de verdade (com README.md dentro) */
    await page.click('.arv-ferr [data-acao="nova-pasta"]');
    await page.fill('#novo-arq-nome', 'Projetos');
    await page.$eval('form[data-form="novo-arquivo"]', (f) => f.requestSubmit());
    const pasta = path.join(raizT, 'theus', 'Projetos', 'README.md');
    for (let i = 0; i < 50 && !fs.existsSync(pasta); i++) await esperar(100);
    assert.ok(fs.existsSync(pasta), 'a pasta Projetos não apareceu no disco');
    /* o disco manda: um arquivo que nasce por fora (o claude, o Finder) entra na árvore pela mensagem "arquivos" */
    const t0 = Date.now();
    fs.writeFileSync(path.join(raizT, 'theus', 'do-disco.md'), '# veio do disco\n');
    await ate(page, () => !!BC.loja.arquivo('theus/do-disco.md'), null, 'do-disco.md na árvore', 10000);
    medidas.disco_para_arvore_ms = Date.now() - t0;
    const r = await page.evaluate(retrato);
    assert.deepEqual(r.arquivosExemplo, []);
    medidas.arquivos_reais = r.arquivosReais;
    medidas.print_pasta = await print(page, 'limpo-3-pasta-e-disco.png');
  });

  it('4 · a Rita entra com o token → aparece na equipe do Theus e a pasta dela na árvore dele', async () => {
    const conv = await T.page.evaluate(() => fetch('/api/convite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: 'Rita', papel: 'membro' }) }).then((r) => r.json()));
    assert.match(String(conv.token), /^babel-/);
    R = await abrirEstacao({ nome: 'limpo-rita', raiz: raizR, porta: 5112, descoberta: 41611 });
    vigiarErros(R.page, 'rita', erros);
    await R.page.waitForLoadState('domcontentloaded');
    await ate(R.page, () => !!document.getElementById('cbv-token'), null, 'a tela do token na Rita');
    await R.page.fill('#cbv-token', conv.token);
    await Promise.all([R.page.waitForEvent('load', { timeout: 20000 }), R.page.click('#cbv-entrar')]);
    await prontaNaEquipe(R.page);
    const t0 = Date.now();
    await ate(T.page, () => !!BC.loja.pessoa('rita') && BC.real.pares().some((p) => p.id === 'rita' && p.ligado), null, 'o Theus ver a Rita', 30000);
    await ate(T.page, () => !!BC.loja.arquivo('rita/README.md'), null, 'a pasta da Rita na árvore do Theus', 20000);
    medidas.rita_na_arvore_ms = Date.now() - t0;
    const pessoasT = await T.page.evaluate(() => BC.loja.estado.pessoas.map((p) => p.id + ':' + p.status).sort());
    assert.deepEqual(pessoasT, ['rita:online', 'theus:online']);
    await T.page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.ui.abertas.rita = true; BC.estacao.abrir('explorador'); });
    await ate(T.page, () => !!document.querySelector('.arv-pasta.raiz[data-caminho="rita"]') && !!document.querySelector('.arv-arq[data-id="rita/README.md"]'), null, 'a pasta da Rita desenhada');
    await T.page.click('.arv-arq[data-id="rita/README.md"]');
    await ate(T.page, () => { const a = BC.loja.arquivo('rita/README.md'); return a && a._carregado && /# Rita/.test(a.conteudo); }, null, 'o README da Rita lido do computador dela');
    await ate(T.page, () => /pasta compartilhada/.test(document.getElementById('e-conteudo').textContent), null, 'o README da Rita desenhado no meio');
    const r = await R.page.evaluate(retrato);
    medidas.rita = r;
    assert.deepEqual(r.pessoas, ['rita', 'theus']);
    assert.deepEqual(r.arquivosExemplo, []);
    medidas.print_arvore_rita = await print(T.page, 'limpo-4-arvore-com-a-rita.png');
  });

  it('5 · demanda do Theus para a Rita pela tela → chega na Rita pelo diário real, com o mesmo id', async () => {
    const { page } = T;
    const titulo = 'Revisar o README da pasta ' + Date.now().toString(36);
    await page.evaluate(() => { BC.estacao.fecharTodas(); BC.acoes['nova-demanda'](); });
    await page.waitForSelector('#nd-titulo');
    await page.fill('#nd-titulo', titulo);
    await page.selectOption('#nd-para', 'rita');
    const t0 = Date.now();
    await page.$eval('form[data-form="nova-demanda"]', (f) => f.requestSubmit());
    const idT = await page.evaluate((t) => { const d = BC.loja.estado.demandas.find((x) => x.titulo === t); return d && d.id; }, titulo);
    assert.ok(idT, 'a demanda não nasceu no Theus');
    await ate(R.page, (t) => BC.loja.estado.demandas.some((d) => d.titulo === t && d.de === 'theus' && d.para === 'rita'), titulo, 'a demanda na Rita', 20000);
    medidas.demanda_theus_para_rita_ms = Date.now() - t0;
    const idR = await R.page.evaluate((t) => BC.loja.estado.demandas.find((x) => x.titulo === t).id, titulo);
    assert.equal(idR, idT, 'ids diferentes entre as Estações');
    medidas.demanda_id = idT;
    await R.page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.abrir('demandas'); });
    await esperar(400);
    medidas.print_rita = await print(R.page, 'limpo-5-demanda-na-rita.png');
    /* a Rita começa e o Theus vê o cronômetro dela andar (a ação volta pelo diário com o mesmo id) */
    await R.page.evaluate((id) => BC.loja.fazer('comecar', id), idR);
    await ate(page, (id) => { const d = BC.loja.demanda(id); return d && d.estado === 'andamento'; }, idT, 'a demanda em andamento no Theus', 15000);
  });

  it('6 · a barra do plano: 12 atividades na ordem, rótulo 11 px, foto 22 px no pé; grupos com alternador', async () => {
    for (const [quem, page] of [['theus', T.page], ['rita', R.page]]) {
      const b = await page.evaluate(() => {
        const bts = Array.from(document.querySelectorAll('#e-atividades > button[data-acao="atividade"]'));
        const rot = bts.map((x) => x.querySelector('.ativ-rotulo'));
        const foto = document.querySelector('#e-atividades .ativ-perfil .avatar');
        return { ids: bts.map((x) => x.dataset.id), rotulos: rot.map((r) => r && r.textContent), px: rot.map((r) => r && getComputedStyle(r).fontSize), foto: foto ? Math.round(foto.getBoundingClientRect().width) : 0, outros: document.querySelectorAll('#e-atividades > button:not([data-acao="atividade"]):not(.ativ-perfil)').length };
      });
      medidas['barra_' + quem] = b;
      assert.deepEqual(b.ids, BARRA);
      assert.deepEqual(b.rotulos, ROTULOS);
      assert.ok(b.px.every((p) => p === '11px'), b.px.join(','));
      assert.equal(b.foto, 22);
      assert.equal(b.outros, 0);
    }
    const g = await T.page.evaluate(() => {
      const r = {};
      for (const v of ['tarefas', 'inteligencia', 'metas', 'mapa']) {
        BC.estacao.fecharTodas(); BC.estacao.abrir(v);
        const atual = document.querySelector('#e-atividades [aria-current="page"]');
        const alt = Array.from(document.querySelectorAll('#e-lateral .ativ-grupo button')).map((x) => x.textContent + (x.getAttribute('aria-selected') === 'true' ? '*' : ''));
        r[v] = { barra: atual && atual.dataset.id, alternador: alt.join(' | ') };
      }
      return r;
    });
    medidas.grupos = g;
    assert.deepEqual(g.tarefas, { barra: 'demandas', alternador: 'Demandas | Tarefas*' });
    assert.deepEqual(g.inteligencia, { barra: 'acervo', alternador: 'Acervo | Inteligência*' });
    assert.deepEqual(g.metas, { barra: 'equipe', alternador: 'Equipe | Metas* | Mapa' });
    assert.deepEqual(g.mapa, { barra: 'equipe', alternador: 'Equipe | Metas | Mapa*' });
    await T.page.evaluate(() => { BC.estacao.fecharTodas(); BC.estacao.abrir('tarefas'); });
    await T.page.click('#e-lateral .ativ-grupo [data-id="demandas"]');
    assert.equal(await T.page.evaluate(() => BC.estacao.abaAtual().tipo), 'demandas');
    medidas.print_barra = await print(T.page, 'limpo-6-barra-do-plano.png');
    assert.deepEqual(erros, []);
  });
});
