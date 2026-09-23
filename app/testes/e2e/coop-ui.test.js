/* babel-coop · e2e do conector `coop` na página real (A21, PROTOCOLO §8): app/interface/coop-ui.js dentro de uma
   Estação Electron de verdade (janelas escondidas), com a equipe fundada e uma TV aberta como janela própria.
   Enquanto o servidor ainda não liga /mcp nem traz coop-ui.js na lista INJETAR, o teste injeta o arquivo com
   page.addScriptTag e entrega as `mcp-chamada` com BC.real.simular (como se viessem do servidor); a resposta
   é espiada em BC.real.enviar. Prova:
   - coop_aviso cria o aviso assinado "Rita · Theus", o diário do servidor guarda a ação `porAgente` e a TV mostra
     o aviso com a assinatura;
   - coop_campanha cria a campanha de 50 clientes para a Carla até 30/09, que vira a campanha da TV;
   - demanda, TV, meta, busca, pessoas; recusas (ação fora da lista, aviso sem ser gestão, pessoa inexistente);
   - a TV nunca executa uma chamada; a mesma chamada (cid) só executa uma vez.
   Porta 4925, descoberta 41425. Evidências: BABEL_TESTE_EVIDENCIAS=<pasta> (resultado.json + prints).
   Rodar: node --test testes/e2e/coop-ui.test.js
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { abrirEstacao } = require('./estacao');

const PORTA = 4925, DESCOBERTA = 41425;
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

/* põe coop-ui.js na página se o servidor ainda não trouxer, e espia o BC.real.enviar */
async function prepararPagina(page, base) {
  await ate(() => page.evaluate(() => !!(window.BC && BC.real && BC.loja && BC.loja.estado)), { oque: 'a ponte carregar' });
  const trazido = await page.evaluate(() => !!(BC.coop && BC.coop.versao));
  if (!trazido) await page.addScriptTag({ url: base + '/coop/coop-ui.js' });
  await ate(() => page.evaluate(() => !!(BC.coop && BC.coop.versao)), { oque: 'coop-ui carregar' });
  await page.evaluate(() => {
    window.__enviados = [];
    const original = BC.real.enviar;
    BC.real.enviar = function (m) { window.__enviados.push(JSON.parse(JSON.stringify(m))); return original(m); };
  });
  return trazido;
}

describe('coop-ui: o agente mexe no app pela tela real, assinado "agente · pessoa"', () => {
  let est, tv, eu, injetado, resultado = { casos: {} };
  const chamar = async (pagina, cid, ferramenta, args, agente) => {
    const inicio = Date.now();
    await pagina.evaluate((m) => BC.real.simular(m), { tipo: 'mcp-chamada', cid, sessao: 's-rita', ferramenta, args, agente: agente || { id: 'ag-rita', nome: 'Rita', dono: eu.id } });
    const r = await ate(() => pagina.evaluate((c) => window.__enviados.filter((m) => m.tipo === 'mcp-resposta' && m.cid === c)[0] || null, cid), { ms: 5000, oque: 'mcp-resposta ' + cid });
    resultado.casos[cid] = { ferramenta, args, ms: Date.now() - inicio, ok: r.ok, texto: r.ok ? r.resultado.texto : r.erro };
    return r;
  };

  before(async () => {
    /* a equipe de exemplo (Carla, Bruno…) é o elenco deste teste: o app limpo só a traz com BABEL_COOP_EXEMPLOS=1 */
    est = await abrirEstacao({ nome: 'coop', porta: PORTA, descoberta: DESCOBERTA, env: { BABEL_COOP_EXEMPLOS: '1' } });
    await est.page.waitForLoadState('load');
    const f = await est.api('/api/fundar', { nome: 'Theus' });
    assert.ok(f.pronto, 'fundou a equipe: ' + JSON.stringify(f));
    eu = f;
    await est.page.reload();
    await ate(() => est.page.evaluate(() => !!(window.BC && BC.real && BC.real.bemvindo && BC.real.eu() && BC.real.eu().pronto && BC.loja.eu === BC.real.eu().id)), { ms: 15000, oque: 'a Estação reconhecer o Theus' });
    injetado = !(await prepararPagina(est.page, est.base));
    /* a TV numa janela própria, escondida (como o botão "Tela da TV" faz, sem aparecer na tela de quem usa o Mac) */
    await est.app.evaluate(({ BrowserWindow }, url) => {
      const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { contextIsolation: true, backgroundThrottling: false } });
      w.loadURL(url);
    }, est.base + '/#tv');
    tv = await ate(() => est.app.windows().filter((p) => p.url().endsWith('#tv'))[0] || null, { oque: 'a janela da TV' });
    await tv.waitForLoadState('load');
    await prepararPagina(tv, est.base);
    await ate(() => tv.evaluate(() => !!(BC.real.bemvindo && BC.loja.papel === 'tv')), { oque: 'a TV receber o bemvindo' });
    resultado.eu = { id: eu.id, nome: eu.nome, papel: eu.papel };
    resultado.coopUiInjetadoPeloTeste = injetado;
  });

  after(async () => {
    if (EVID) {
      fs.mkdirSync(EVID, { recursive: true });
      try { await est.page.screenshot({ path: path.join(EVID, 'estacao-coop.png') }); } catch (e) { resultado.printEstacao = 'falhou: ' + e.message; }
      try { await tv.screenshot({ path: path.join(EVID, 'tv-coop.png') }); } catch (e) { resultado.printTv = 'falhou: ' + e.message; }
      fs.writeFileSync(path.join(EVID, 'coop-ui-resultado.json'), JSON.stringify(resultado, null, 2));
    }
    if (est) await est.fechar();
  });

  it('coop_aviso: cria o aviso assinado, vai para o diário e a TV mostra com a assinatura', async () => {
    const r = await chamar(est.page, 't-aviso', 'coop_aviso', { texto: 'Reunião geral às 16h' });
    assert.equal(r.ok, true, r.erro);
    assert.match(r.resultado.texto, /Aviso na TV: "Reunião geral às 16h" · assinado Rita · Theus/);
    const e = await est.page.evaluate(() => ({ aviso: BC.loja.estado.avisos[0], ev: BC.loja.estado.eventos[0], toast: (document.getElementById('e-toast') || {}).textContent || '' }));
    assert.equal(e.aviso.texto, 'Reunião geral às 16h');
    assert.equal(e.aviso.assinatura, 'Rita · Theus');
    assert.deepEqual(e.aviso.agente, { id: 'ag-rita', nome: 'Rita' });
    assert.equal(e.ev.tipo, 'aviso');
    assert.equal(e.ev.texto, 'Rita · Theus: Aviso: Reunião geral às 16h');
    assert.equal(e.ev.textoTv, 'Reunião geral às 16h · Rita · Theus');
    assert.equal(e.ev.tv, true);
    assert.equal(e.toast, 'Rita · Theus: aviso na TV', 'aviso visível na Estação');
    /* o diário do servidor guardou a ação assinada: é assim que as outras Estações aplicam a mesma coisa */
    const diario = await ate(async () => { const d = await est.api('/api/diario'); return d.filter((x) => x.acao === 'porAgente' && x.args[1] === 'aviso')[0] || null; }, { oque: 'o evento porAgente no diário' });
    assert.deepEqual(diario.args[0], { id: 'ag-rita', nome: 'Rita' });
    assert.deepEqual(diario.args[2], ['Reunião geral às 16h']);
    /* a TV (outra janela, outro WebSocket) aplicou o evento do diário e mostra a assinatura no rodapé de acontecimentos */
    const naTv = await ate(() => tv.evaluate(() => {
      const av = BC.loja.estado.avisos.filter((a) => a.texto === 'Reunião geral às 16h')[0];
      const rodape = (document.getElementById('tv-evento') || {}).textContent || '';
      return av && av.assinatura === 'Rita · Theus' && rodape.indexOf('Reunião geral às 16h · Rita · Theus') !== -1 ? { rodape, assinatura: av.assinatura } : null;
    }), { oque: 'a TV mostrar o aviso assinado' });
    resultado.casos['t-aviso'].tv = naTv;
    resultado.casos['t-aviso'].diario = { acao: diario.acao, args: diario.args };
  });

  it('coop_campanha: 50 clientes para a Carla até 30/09, vira a campanha da TV', async () => {
    /* com o "gera a campanha" do plano (prototipo/campanha.js, BC.campanha.gerar) a campanha nasce com as peças; sem ele, o caminho de antes */
    const gerada = await est.page.evaluate(() => !!(window.BC && BC.campanha && typeof BC.campanha.gerar === 'function'));
    const r = await chamar(est.page, 't-campanha', 'coop_campanha', { nome: '50 clientes', meta: 50, para: 'Carla', prazo: '30/09' });
    assert.equal(r.ok, true, r.erro);
    resultado.casos['t-campanha'].caminho = gerada ? 'BC.campanha.gerar' : 'novaCampanha';
    if (gerada) {
      assert.match(r.resultado.texto, /^Campanha "50 clientes" gerada para Carla · meta 50 · até 30\/09 .*pedida por Rita · Theus\.$/);
      const g = await est.page.evaluate(() => ({ c: BC.loja.estado.campanhas[0], principal: BC.loja.estado.campanha, hist: BC.coop.historico().slice(-1)[0] }));
      assert.equal(g.c.tipo, 'gerada');
      assert.equal(g.c.nome, '50 clientes');
      assert.equal(g.c.pessoa, 'carla');
      assert.equal(g.principal.alvo, 50, 'a campanha gerada vira a da TV');
      assert.ok(r.resultado.dados.pecas.length > 0, 'nasce com as peças');
      assert.deepEqual([g.hist.tipo, g.hist.ferramenta, g.hist.assinatura], ['acao', 'coop_campanha', 'Rita · Theus']);
      const naTvG = await ate(() => tv.evaluate(() => {
        const el = document.getElementById('tv-campanha');
        const t = el ? el.textContent : '';
        return t.toLowerCase().indexOf('50 clientes') !== -1 && t.indexOf('/50') !== -1 ? t.replace(/\s+/g, ' ').trim() : null; /* a TV escreve o nome da gerada em caixa alta */
      }), { oque: 'a TV mostrar a campanha gerada' });
      resultado.casos['t-campanha'].tv = naTvG;
      return;
    }
    assert.match(r.resultado.texto, /Campanha "50 clientes" criada para Carla · meta 50 · até 30\/09 · já está na TV · assinada Rita · Theus/);
    const e = await est.page.evaluate(() => ({ c: BC.loja.estado.campanhas[0], principal: BC.loja.estado.campanha, ev: BC.loja.estado.eventos[0] }));
    const prazo = new Date(new Date().getFullYear(), 8, 30, 18, 0, 0, 0).getTime();
    assert.equal(e.c.titulo, '50 clientes');
    assert.equal(e.c.alvo, 50);
    assert.equal(e.c.pessoa, 'carla');
    assert.equal(e.c.prazo, prazo);
    assert.equal(e.c.unidade, 'clientes');
    assert.equal(e.c.assinatura, 'Rita · Theus');
    assert.equal(e.principal.nome, '50 clientes');
    assert.equal(e.principal.alvo, 50);
    assert.equal(e.principal.fim, prazo);
    assert.equal(e.ev.texto, 'Rita · Theus: Theus criou a campanha "50 clientes" para Carla · até 30/09');
    const naTv = await ate(() => tv.evaluate(() => {
      const el = document.getElementById('tv-campanha');
      const t = el ? el.textContent : '';
      return t.indexOf('50 clientes') !== -1 && t.indexOf('/50') !== -1 ? t.replace(/\s+/g, ' ').trim() : null;
    }), { oque: 'a TV mostrar a campanha' });
    resultado.casos['t-campanha'].tv = naTv;
  });

  it('coop_demanda, coop_tv, coop_meta, coop_mural, coop_ideia, coop_aprendi: cada um muda o estado e fica assinado', async () => {
    let r = await chamar(est.page, 't-demanda', 'coop_demanda', { titulo: 'Revisar a proposta da Clínica Vida', para: 'Bruno', prazo: '2026-09-29', prioridade: 'alta' });
    assert.equal(r.ok, true, r.erro);
    let e = await est.page.evaluate(() => BC.loja.estado.demandas[0]);
    assert.equal(e.titulo, 'Revisar a proposta da Clínica Vida');
    assert.equal(e.para, 'bruno');
    assert.equal(e.prioridade, 'alta');
    assert.match(e.descricao, /Criada pelo agente Rita a pedido de Theus\./);
    assert.equal(e.assinatura, 'Rita · Theus');

    r = await chamar(est.page, 't-tv', 'coop_tv', { modo: 'reuniao' });
    assert.equal(r.ok, true, r.erro);
    e = await est.page.evaluate(() => ({ modo: BC.loja.estado.tvModo, ev: BC.loja.estado.eventos[0] }));
    assert.equal(e.modo, 'reuniao');
    assert.equal(e.ev.tipo, 'agente-fez', 'ação sem evento próprio ganha um evento assinado');
    assert.equal(e.ev.texto, 'Rita · Theus: TV no modo reuniao');
    await ate(() => tv.evaluate(() => BC.loja.estado.tvModo === 'reuniao'), { oque: 'a TV mudar de modo' });
    await chamar(est.page, 't-tv-painel', 'coop_tv', { modo: 'painel' });

    r = await chamar(est.page, 't-meta', 'coop_meta', { mais: 2 });
    assert.equal(r.ok, true, r.erro);
    assert.equal(r.resultado.dados.atual, 2);
    assert.equal(r.resultado.dados.alvo, 50);

    r = await chamar(est.page, 't-mural', 'coop_mural', { texto: 'Café novo na copa' });
    assert.equal(r.ok, true, r.erro);
    r = await chamar(est.page, 't-ideia', 'coop_ideia', { texto: 'Vídeo curto com depoimento de cliente' });
    assert.equal(r.ok, true, r.erro);
    r = await chamar(est.page, 't-aprendi', 'coop_aprendi', { texto: 'Zebra laranja no teste do conector coop confirma o registro de aprendizado' });
    assert.equal(r.ok, true, r.erro);
    e = await est.page.evaluate(() => ({ mural: BC.loja.estado.mural[0], ideia: BC.loja.estado.ideias[0], ap: BC.loja.estado.aprendizados[0] }));
    assert.equal(e.mural.assinatura, 'Rita · Theus');
    assert.equal(e.ideia.assinatura, 'Rita · Theus');
    assert.equal(e.ap.ia, true);
    assert.equal(e.ap.origem, 'agente Rita');
  });

  it('consultas: coop_pessoas, coop_projetos, coop_demandas, coop_buscar devolvem dado real do estado', async () => {
    let r = await chamar(est.page, 't-pessoas', 'coop_pessoas', {});
    assert.equal(r.ok, true, r.erro);
    const theus = r.resultado.dados.pessoas.filter((p) => p.id === eu.id)[0];
    assert.equal(theus.nome, 'Theus');
    assert.equal(theus.papel, 'gestão');
    assert.equal(theus.origem, 'token');
    assert.ok(r.resultado.dados.pessoas.some((p) => p.id === 'carla' && p.origem === 'exemplo'));
    assert.match(r.resultado.texto, /^\d+ pessoas na equipe:\n- /);
    r = await chamar(est.page, 't-projetos', 'coop_projetos', {});
    assert.equal(r.ok, true, r.erro);
    r = await chamar(est.page, 't-demandas', 'coop_demandas', { pessoa: 'Bruno' });
    assert.equal(r.ok, true, r.erro);
    assert.ok(r.resultado.dados.abertas.some((d) => d.titulo === 'Revisar a proposta da Clínica Vida'));
    r = await chamar(est.page, 't-buscar', 'coop_buscar', { termo: 'reembolso' });
    assert.equal(r.ok, true, r.erro);
    assert.ok(r.resultado.dados.resultados.length > 0, 'o acervo acha "reembolso"');
    const hist = await est.page.evaluate(() => BC.coop.historico().map((h) => h.tipo + ':' + h.ferramenta));
    assert.ok(hist.includes('consulta:coop_pessoas') && hist.includes('acao:coop_aviso'));
  });

  it('recusas: ação fora da lista, aviso sem ser gestão, pessoa inexistente, prazo inválido, ferramenta desconhecida', async () => {
    let r = await chamar(est.page, 't-proibida', 'coop_acao', { acao: 'transmissao', args: [false] });
    assert.equal(r.ok, false);
    assert.match(r.erro, /não está na lista permitida/);
    r = await chamar(est.page, 't-acao', 'coop_acao', { acao: 'pegar', args: ['d-que-nao-existe'] });
    assert.equal(r.ok, false, 'pegar demanda que não existe: o app recusa');
    assert.match(r.erro, /o app recusou/);
    await est.page.evaluate(() => { BC.loja.pessoa(BC.loja.eu).papel = 'membro'; });
    r = await chamar(est.page, 't-aviso-membro', 'coop_aviso', { texto: 'isso não pode' });
    await est.page.evaluate(() => { BC.loja.pessoa(BC.loja.eu).papel = 'admin'; });
    assert.equal(r.ok, false);
    assert.match(r.erro, /só a gestão manda aviso oficial/);
    r = await chamar(est.page, 't-ninguem', 'coop_campanha', { nome: '10 clientes', meta: 10, para: 'Fulano de Tal', prazo: '30/09' });
    assert.equal(r.ok, false);
    assert.match(r.erro, /não achei "Fulano de Tal" na equipe/);
    r = await chamar(est.page, 't-prazo', 'coop_demanda', { titulo: 'x', prazo: '31/02' });
    assert.equal(r.ok, false);
    assert.match(r.erro, /não existe/);
    r = await chamar(est.page, 't-desconhecida', 'coop_formatar_disco', {});
    assert.equal(r.ok, false);
    const avisos = await est.page.evaluate(() => BC.loja.estado.avisos.filter((a) => a.texto === 'isso não pode').length);
    assert.equal(avisos, 0);
  });

  it('a TV nunca executa; a mesma chamada só executa uma vez', async () => {
    const antes = await est.page.evaluate(() => BC.loja.estado.mural.length);
    await tv.evaluate((dono) => BC.real.simular({ tipo: 'mcp-chamada', cid: 't-na-tv', sessao: 's-rita', ferramenta: 'coop_mural', args: { texto: 'da TV' }, agente: { id: 'ag-rita', nome: 'Rita', dono } }), eu.id);
    await esperar(600);
    const tvRespondeu = await tv.evaluate(() => window.__enviados.filter((m) => m.tipo === 'mcp-resposta').length);
    assert.equal(tvRespondeu, 0, 'a TV não responde nem executa');
    const m = { tipo: 'mcp-chamada', cid: 't-duas-vezes', sessao: 's-rita', ferramenta: 'coop_mural', args: { texto: 'uma vez só' }, agente: { id: 'ag-rita', nome: 'Rita', dono: eu.id } };
    const logoApos = await est.page.evaluate((msg) => { BC.real.simular(msg); BC.real.simular(msg); return BC.loja.estado.mural.filter((x) => x.texto === 'uma vez só').length; }, m);
    await esperar(800);
    const e = await est.page.evaluate(() => ({ respostas: window.__enviados.filter((x) => x.cid === 't-duas-vezes').length, naTela: BC.loja.estado.mural.filter((x) => x.texto === 'uma vez só').length, daTv: BC.loja.estado.mural.filter((x) => x.texto === 'da TV').length }));
    /* o diário do servidor é a fonte da verdade: uma ação só para o cid repetido, nenhuma vinda da TV */
    const diario = await est.api('/api/diario');
    const noDiario = diario.filter((x) => x.acao === 'porAgente' && Array.isArray(x.args[2]) && x.args[2][0] === 'uma vez só').length;
    const daTvNoDiario = diario.filter((x) => x.acao === 'porAgente' && Array.isArray(x.args[2]) && x.args[2][0] === 'da TV').length;
    assert.equal(e.respostas, 1, 'uma resposta só');
    assert.equal(logoApos, 1, 'executou uma vez na Estação');
    assert.equal(noDiario, 1, 'uma ação só no diário');
    assert.equal(daTvNoDiario, 0);
    assert.equal(e.daTv, 0);
    /* antes, com a TV aberta, a ponte + o canal entre janelas aplicavam cada ação duas vezes; agora o canal não troca mais o
       estado inteiro (ponte.js) e cada janela aplica só o diário: uma vez na Estação e uma vez na TV */
    const naTv = await ate(() => tv.evaluate(() => BC.loja.estado.mural.filter((x) => x.texto === 'uma vez só').length), { oque: 'a TV aplicar o recado' });
    await esperar(600);
    const naTvDepois = await tv.evaluate(() => BC.loja.estado.mural.filter((x) => x.texto === 'uma vez só').length);
    const naTelaDepois = await est.page.evaluate(() => BC.loja.estado.mural.filter((x) => x.texto === 'uma vez só').length);
    resultado.casos.tvNaoExecuta = { tvRespondeu, muralAntes: antes, execucoesNaEstacao: logoApos, acoesNoDiario: noDiario, itensNaTelaDepoisDoCanal: e.naTela, naTv: naTvDepois };
    assert.equal(naTelaDepois, 1, 'a Estação aplica uma vez só');
    assert.equal(naTv, 1); assert.equal(naTvDepois, 1, 'a TV aplica uma vez só (a do diário)');
  });
});
