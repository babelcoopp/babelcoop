/* babel-coop · prova de ponta a ponta com o `claude` DE VERDADE dentro do app (integração da segunda leva)
   Custa pedidos ao modelo barato: só roda com BABEL_TESTE_CLAUDE=1 (sem isso, pula). Modelo: BABEL_COOP_MODELO (padrão haiku).
   Tudo pela TELA da Estação (Electron escondido, raiz temporária), nunca pelo WebSocket cru:
   1. a Estação abre, a presença chama o agente sozinha (agente-iniciar) e o botão "Confiar nesta pasta" responde a tela de
      confiança do Claude Code (desce até "Yes, I trust this folder" e confere antes do Enter);
   2. pedido 1 pelo campo ❯: plano com 2 itens + proposta.md → blocos pedido/plano/ação/resultado, pulso por item, o arquivo
      nascendo no meio e o placar subindo com origem (Permitir clicado na presença quando o claude pede);
   3. pedido 2: coop_aviso → o aviso aparece na Estação e na TV (janela #tv escondida), assinado "<agente> · <pessoa>";
   4. pedido 3: o navegador próprio abre o site de teste, preenche nome e e-mail e NÃO preenche a senha ("sua vez");
   5. pedido 4: clonar a página → Clones/<host>/index.html existe e abre por /pasta/; o cartão da presença abre o clone;
   6. /cost (o custo que o claude informa, se houver) e /exit.
   Prints e medidas: .deus/terminal-ao-vivo/evidencias/integracao/ (ou BABEL_TESTE_EVIDENCIAS).
   Rodar: cd app && BABEL_TESTE_CLAUDE=1 node --test testes/e2e/integracao-real.test.js
   Portas: HTTP 4945 (Estação), 4946 (site de teste), UDP 41445.
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { abrirEstacao, raizTemporaria, APP } = require('./estacao');

const REAL = process.env.BABEL_TESTE_CLAUDE ? false : 'só com BABEL_TESTE_CLAUDE=1 (custa pedidos ao modelo barato)';
const EVID = process.env.BABEL_TESTE_EVIDENCIAS || path.join(APP, '..', '.deus', 'terminal-ao-vivo', 'evidencias', 'integracao');
const PORTA = 4945, SITE = 4946, UDP = 41445;
const MODELO = process.env.BABEL_COOP_MODELO || 'haiku';
const TURNO_MS = 240000;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/* o site de teste: um cadastro com nome, e-mail e senha (e CSS e imagem, para o clone ter o que levar).
   O que o formulário manda fica em recebidos (a prova de que a senha foi em branco, se o agente enviar o cadastro). */
const recebidos = [];
function subirSite() {
  const html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Cadastro · Clínica Vida</title><link rel="stylesheet" href="/estilo.css"></head>' +
    '<body><header class="topo"><img class="logo" src="/logo.svg" alt="Clínica Vida" width="48" height="48"><h1>Clínica Vida</h1></header>' +
    '<main><h2>Cadastro de paciente</h2><form id="cadastro" action="/enviar" method="post">' +
    '<label for="nome">Nome</label><input id="nome" name="nome" autocomplete="off">' +
    '<label for="email">E-mail</label><input id="email" name="email" type="email" autocomplete="off">' +
    '<label for="senha">Senha</label><input id="senha" name="senha" type="password" autocomplete="off">' +
    '<button type="submit">Cadastrar</button></form><p class="nota">Seus dados ficam com a clínica.</p></main></body></html>';
  const css = 'body{margin:0;font:16px system-ui,sans-serif;background:#0f1a24;color:#e8f2fb}.topo{display:flex;gap:12px;align-items:center;padding:16px 24px;background:#132536}' +
    'h1{color:#2ad5e5;margin:0}main{padding:24px;max-width:420px}form{display:grid;gap:8px}input{padding:8px;border-radius:8px;border:1px solid #2a3a5e;background:#060b16;color:#fff}' +
    'button{padding:10px;border-radius:8px;border:0;background:#8670ff;color:#fff}.nota{color:#8799bc}';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#2ad5e5"/><path d="M14 25h20M24 15v20" stroke="#0f1a24" stroke-width="5"/></svg>';
  const srv = http.createServer((req, res) => {
    if (req.url === '/estilo.css') { res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' }); return res.end(css); }
    if (req.url === '/logo.svg') { res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); return res.end(svg); }
    if (req.method === 'POST') {
      let corpo = '';
      req.on('data', (c) => { corpo += c; });
      req.on('end', () => {
        const q = new URLSearchParams(corpo);
        recebidos.push({ nome: q.get('nome'), email: q.get('email'), senha: q.get('senha'), ts: Date.now() });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html.replace(/<main>[\s\S]*<\/main>/, '<main><h2>Cadastro recebido</h2><p>Obrigado, ' + String(q.get('nome') || '').replace(/[<&>"]/g, '') + '. A Clínica Vida vai falar com você.</p></main>'));
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html);
  });
  return new Promise((ok) => srv.listen(SITE, '127.0.0.1', () => ok({ fechar: () => new Promise((f) => srv.close(() => f())) })));
}

describe('integração com o claude real, pela tela da Estação', { skip: REAL, timeout: 1800000 }, () => {
  let E, page, site, raiz, eu, pasta, tv = null;
  const erros = [];
  const res = { quando: new Date().toISOString(), modelo: MODELO, passos: {}, prints: [] };

  async function print(nome, alvo) {
    const arq = path.join(EVID, nome + '.png');
    try { await (alvo || page).screenshot({ path: arq, timeout: 15000 }); res.prints.push(path.basename(arq)); } catch (e) { res.prints.push(nome + ' (falhou: ' + e.message.split('\n')[0] + ')'); }
    return arq;
  }
  async function ate(fn, arg, oque, ms = 30000, passo = 250) {
    const fim = Date.now() + ms;
    let ultimo;
    while (Date.now() < fim) {
      ultimo = await page.evaluate(fn, arg);
      if (ultimo) return ultimo;
      await esperar(passo);
    }
    throw new Error('tempo esgotado esperando ' + oque + ' (último: ' + JSON.stringify(ultimo) + ')');
  }
  const blocos = () => page.evaluate(() => BC.terminalReal.blocos('assistente').map((b) => ({ bid: b.bid, tipo: b.tipo, titulo: b.titulo || '', texto: String(b.texto || '').slice(0, 400), arquivos: b.arquivos || [], navegador: b.navegador || null, senha: !!b.senha })));
  const tela = (n) => page.evaluate((k) => BC.terminalReal.ler('assistente', k), n || 60);
  /* os agente-* que chegaram à tela, na ordem (espião no barramento da ponte) */
  const msgs = (desde) => page.evaluate((d) => window.__ag.slice(d), desde || 0);

  /* o campo ❯ da presença: escreve e aperta Enter, como a pessoa */
  async function pedir(texto) {
    const campo = page.locator('.tr-sessao[data-id="assistente"] .tr-entrada');
    await campo.click();
    await campo.fill(texto);
    await campo.press('Enter');
  }
  /* espera o turno acabar (agente-estado terminou depois do pedido); enquanto isso, clica Permitir no que o claude pedir */
  async function turno(desde, rotulo) {
    const t0 = Date.now(), permitidos = [];
    for (;;) {
      if (Date.now() - t0 > TURNO_MS) throw new Error('o turno "' + rotulo + '" não terminou em ' + TURNO_MS / 1000 + ' s. Tela:\n' + (await tela(40)));
      const botao = page.locator('.tr-sessao[data-id="assistente"] .tr-bloco[data-tipo="espera"] [data-tr="ok"][data-d="permitir"]').first();
      if (await botao.count()) {
        const qual = await botao.evaluate((b) => b.closest('.tr-bloco').querySelector('.tr-tit, .tr-txt') ? b.closest('.tr-bloco').textContent.replace(/\s+/g, ' ').slice(0, 160) : '');
        await botao.scrollIntoViewIfNeeded().catch(() => {});
        await botao.click().catch(() => {});
        permitidos.push(qual);
        await esperar(400);
        continue;
      }
      const m = await msgs(desde);
      const fim = m.find((x) => x.tipo === 'agente-estado' && (x.estado === 'terminou' || x.estado === 'falhou'));
      if (fim) return { ms: Date.now() - t0, estado: fim.estado, permitidos };
      await esperar(300);
    }
  }

  before(async () => {
    fs.mkdirSync(EVID, { recursive: true });
    site = await subirSite();
    raiz = raizTemporaria('integracao');
    const zdot = path.join(raiz, '.zdot');
    fs.mkdirSync(zdot, { recursive: true });
    fs.writeFileSync(path.join(zdot, '.zshrc'), '# zsh da prova de integração: sem configuração pessoal (o histórico não vai para o $HOME)\n');
    E = await abrirEstacao({ nome: 'integracao', raiz, porta: PORTA, descoberta: UDP, env: { BABEL_COOP_AGENTES: '1', BABEL_COOP_MODELO: MODELO, ZDOTDIR: zdot, SHELL: '/bin/zsh' } });
    page = E.page;
    page.on('pageerror', (x) => erros.push('pageerror: ' + x.message));
    page.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
    await page.waitForLoadState('domcontentloaded');
    const f = await E.api('/api/fundar', { nome: 'Theus' });
    assert.equal(f.pronto, true, 'fundar: ' + JSON.stringify(f));
    eu = f.id;
    pasta = (await E.api('/api/eu')).pasta;
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    /* espião: guarda cada agente-* e mcp-chamada que chega à tela (só tipo e o essencial) */
    await page.waitForFunction(() => !!(window.BC && BC.real && BC.terminalReal), null, { timeout: 30000 });
    await page.evaluate(() => {
      window.__ag = [];
      BC.real.ouvir((m) => {
        if (!m || typeof m.tipo !== 'string' || !/^(agente-|mcp-chamada|term-atividade)/.test(m.tipo)) return;
        if (m.tipo === 'term-atividade' && m.estado !== 'espera') return;
        window.__ag.push({ tipo: m.tipo, ts: Date.now(), estado: m.estado, nome: m.nome, pid: m.pid, ferramenta: m.ferramenta, bloco: m.bloco ? { bid: m.bloco.bid, tipo: m.bloco.tipo, titulo: m.bloco.titulo, navegador: m.bloco.navegador, ferramenta: m.bloco.ferramenta } : undefined, itens: m.itens, caminho: m.caminho, acao: m.acao });
      });
    });
    res.eu = eu; res.pasta = pasta; res.raiz = raiz;
  });

  after(async () => {
    res.erros = erros.slice(0, 50);
    try { res.blocosFinais = await blocos(); } catch (e) { /* janela fechada */ }
    try { fs.writeFileSync(path.join(EVID, 'integracao-real.json'), JSON.stringify(res, null, 2) + '\n'); } catch (e) { /* segue */ }
    if (E) await E.fechar().catch(() => {});
    if (site) await site.fechar().catch(() => {});
    /* o arquivo criado pelo claude e o clone vão junto com os prints (pequenos); a raiz temporária desta prova (criada aqui) sai */
    try { if (pasta) fs.copyFileSync(path.join(pasta, 'proposta.md'), path.join(EVID, 'proposta.md')); } catch (e) { /* não nasceu */ }
    try { if (pasta) fs.copyFileSync(path.join(pasta, 'Clones', 'localhost_' + SITE, 'index.html'), path.join(EVID, 'clone-index.html')); } catch (e) { /* não nasceu */ }
    try { fs.rmSync(raiz, { recursive: true, force: true }); } catch (e) { /* segue */ }
  });

  it('a Estação abre, a presença chama o agente sozinha e o botão confia na pasta (conferindo antes do Enter)', async () => {
    await page.waitForFunction(() => BC.terminalReal.pronto() && BC.terminalReal.sessoes().some((s) => s.id === 'assistente' && s.aberta), null, { timeout: 30000 });
    await page.evaluate(() => { if (BC.estacao && BC.estacao.ui) { BC.estacao.ui.termW = 560; if (BC.estacao.alternarTerminal) BC.estacao.alternarTerminal(true); } });
    const t0 = Date.now();
    await ate(() => window.__ag.some((m) => m.tipo === 'agente-iniciado'), null, 'agente-iniciado (a presença mandou agente-iniciar)', 20000);
    res.passos.inicio = { agenteIniciadoMs: Date.now() - t0, medidas: await page.evaluate(() => BC.terminalReal.medidas()) };
    /* a tela de confiança do Claude Code vira um bloco "confiar nesta pasta?" na presença */
    const confianca = await (async () => {
      const fim = Date.now() + 90000;
      while (Date.now() < fim) {
        const b = await page.$('.tr-sessao[data-id="assistente"] .tr-bloco[data-bid^="confianca-"] [data-tr="ok"]');
        if (b) return b;
        if (await page.evaluate(() => window.__ag.some((m) => m.tipo === 'agente-estado' && m.estado === 'acordou'))) return null; /* pasta já confiada */
        await esperar(300);
      }
      throw new Error('nem a tela de confiança nem o agente acordado. Tela:\n' + (await tela(40)));
    })();
    if (confianca) {
      const plano = await page.evaluate(() => BC.terminalReal.planoConfianca('assistente'));
      res.passos.inicio.confianca = { antes: plano };
      await print('01-confianca-na-presenca');
      await confianca.scrollIntoViewIfNeeded().catch(() => {});
      await confianca.click();
    }
    await ate(() => window.__ag.some((m) => m.tipo === 'agente-estado' && m.estado === 'acordou'), null, 'o agente acordar (SessionStart)', 90000);
    res.passos.inicio.acordouMs = Date.now() - t0;
    res.passos.inicio.nomeNasMensagens = await page.evaluate(() => window.__ag.filter((m) => /^agente-/.test(m.tipo)).every((m) => m.nome === 'Assistente'));
    await esperar(1500);
    await print('02-agente-acordado');
  });

  it('pedido 1: plano com 2 itens + proposta.md → blocos, pulso por item, o arquivo nascendo no meio e o placar com origem', async () => {
    const d = (await msgs()).length;
    const placarAntes = await page.evaluate(() => (BC.placar ? BC.placar.hoje() : null));
    const orgAntes = await page.evaluate(() => BC.organismo.contagem());
    await pedir('faça uma lista de tarefas com 2 itens e crie o arquivo proposta.md com 5 linhas sobre a Clínica Vida; marque os itens ao terminar');
    await ate(() => document.querySelector('.tr-sessao[data-id="assistente"] .tr-bloco[data-tipo="pedido"]'), null, 'o bloco do pedido', 30000);
    /* meio do turno: o plano e o arquivo nascendo (print quando aparecerem, sem travar o turno) */
    let printouPlano = false, printouNascendo = false;
    const vigia = setInterval(async () => {
      try {
        if (!printouPlano && await page.$('.tr-sessao[data-id="assistente"] .tr-bloco[data-tipo="plano"]')) { printouPlano = true; await print('03-plano-na-presenca'); }
        if (!printouNascendo && await page.evaluate(() => !!(BC.nascendo && BC.nascendo.contagem().nascimentos))) { printouNascendo = true; await esperar(600); await print('04-arquivo-nascendo-no-meio'); }
      } catch (e) { /* segue */ }
    }, 700);
    let t;
    try { t = await turno(d, 'pedido 1'); } finally { clearInterval(vigia); }
    await esperar(3500); /* pulsos, rito e placar contando */
    const m = await msgs(d);
    const b = await blocos();
    const arq = path.join(pasta, 'proposta.md');
    const existe = fs.existsSync(arq);
    const linhas = existe ? fs.readFileSync(arq, 'utf8').split('\n').filter((l) => l.trim()).length : 0;
    const med = await page.evaluate(() => BC.terminalReal.medidas());
    const org = await page.evaluate(() => BC.organismo.contagem());
    const nasc = await page.evaluate(() => (BC.nascendo ? { contagem: BC.nascendo.contagem(), docs: BC.nascendo.docs() } : null));
    const placar = await page.evaluate(() => (BC.placar ? { hoje: BC.placar.hoje(), eventos: BC.placar.eventos().slice(-12) } : null));
    const abas = await page.evaluate(() => BC.estacao.ui.abas.map((a) => a.id));
    const planos = m.filter((x) => x.tipo === 'agente-plano');
    const ultimoPlano = planos.length ? planos[planos.length - 1].itens : [];
    res.passos.pedido1 = {
      turno: t, tipos: [...new Set(b.map((x) => x.tipo))], blocos: b.length, plano: ultimoPlano, arquivo: { existe, linhas }, pulsosPlano: med.pulsosPlano, ritos: med.ritos,
      organismo: { pulsos: (org.pulsos || 0) - (orgAntes.pulsos || 0), contagem: org }, nascendo: nasc && nasc.contagem, abas, placar: { antes: placarAntes, depois: placar && placar.hoje, eventos: placar && placar.eventos },
      arquivoMsgs: m.filter((x) => x.tipo === 'agente-arquivo').map((x) => x.caminho + ' · ' + x.acao)
    };
    await print('05-pedido1-concluido');
    for (const tipo of ['pedido', 'plano', 'acao', 'resultado']) assert.ok(b.some((x) => x.tipo === tipo), 'bloco ' + tipo + ' na presença · tipos: ' + res.passos.pedido1.tipos.join(','));
    assert.ok(existe, 'proposta.md na pasta compartilhada');
    assert.ok(ultimoPlano.length >= 2 && ultimoPlano.every((i) => i.estado === 'feito'), 'plano com os itens feitos: ' + JSON.stringify(ultimoPlano));
    assert.ok(med.pulsosPlano >= 2, 'um pulso por item feito (pulsosPlano=' + med.pulsosPlano + ')');
    assert.ok(nasc && nasc.contagem.nascimentos >= 1, 'o arquivo nasceu no meio: ' + JSON.stringify(nasc && nasc.contagem));
    assert.ok(abas.some((a) => /^nascendo:.*proposta\.md$/.test(a)), 'a aba do arquivo no meio: ' + abas.join(','));
    assert.ok(placar && placar.hoje > (placarAntes || 0), 'o placar subiu: ' + JSON.stringify(res.passos.pedido1.placar));
    assert.ok(placar.eventos.length && placar.eventos.every((e) => typeof e.origem === 'string' && e.origem), 'cada ponto com origem');
  });

  it('pedido 2: coop_aviso → o aviso aparece na Estação e na TV, assinado "<agente> · <pessoa>"', async () => {
    /* a TV numa janela própria, escondida */
    await E.app.evaluate(({ BrowserWindow }, url) => { const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { contextIsolation: true, backgroundThrottling: false } }); w.loadURL(url); }, E.base + '/#tv');
    for (let i = 0; i < 100 && !tv; i++) { tv = E.app.windows().filter((p) => p.url().endsWith('#tv'))[0] || null; if (!tv) await esperar(100); }
    await tv.waitForLoadState('load');
    await tv.waitForFunction(() => !!(window.BC && BC.real && BC.real.bemvindo && BC.loja.papel === 'tv'), null, { timeout: 20000 });
    const d = (await msgs()).length;
    await pedir('use a ferramenta coop_aviso para mandar à TV o aviso: reunião às 16h');
    const t = await turno(d, 'pedido 2');
    const m = await msgs(d);
    const aviso = await ate(() => { const a = (BC.loja.estado.avisos || []).find((x) => /16\s*h/i.test(x.texto || '')); return a ? { texto: a.texto, assinatura: a.assinatura, agente: a.agente } : null; }, null, 'o aviso no estado da Estação', 15000);
    const naTv = await (async () => { const fim = Date.now() + 15000; while (Date.now() < fim) { const r = await tv.evaluate(() => { const a = (BC.loja.estado.avisos || []).find((x) => /16\s*h/i.test(x.texto || '')); return a ? { texto: a.texto, assinatura: a.assinatura, naTela: document.body.innerText.indexOf('16') !== -1, rodape: (document.body.innerText.match(/[^\n]*·\s*Theus[^\n]*/) || [''])[0].slice(0, 200) } : null; }); if (r) return r; await esperar(300); } return null; })();
    res.passos.pedido2 = { turno: t, mcp: m.filter((x) => x.tipo === 'mcp-chamada').map((x) => x.ferramenta), blocos: m.filter((x) => x.tipo === 'agente-bloco').map((x) => x.bloco.tipo + ':' + x.bloco.titulo), aviso, naTv };
    await print('06-aviso-na-estacao');
    await print('07-aviso-na-tv', tv);
    assert.ok(res.passos.pedido2.mcp.includes('coop_aviso'), 'o claude chamou coop_aviso: ' + JSON.stringify(res.passos.pedido2.mcp));
    assert.equal(aviso.assinatura, 'Assistente · Theus');
    assert.ok(naTv && naTv.assinatura === 'Assistente · Theus', 'a TV tem o aviso assinado: ' + JSON.stringify(naTv));
  });

  it('pedido 3: o navegador próprio abre o site, preenche nome e e-mail e a senha fica para a pessoa', async () => {
    const d = (await msgs()).length;
    await pedir('abra no navegador o site http://localhost:' + SITE + ' e preencha o cadastro com nome Rita e e-mail rita@teste.com; não preencha a senha');
    let printouNav = false;
    const vigia = setInterval(async () => {
      try { if (!printouNav && await page.evaluate(() => BC.estacao.ui.abas.some((a) => a.id === 'nav:assistente'))) { printouNav = true; await esperar(1500); await print('08-navegador-do-agente-abrindo'); } } catch (e) { /* segue */ }
    }, 700);
    let t;
    try { t = await turno(d, 'pedido 3'); } finally { clearInterval(vigia); }
    await esperar(800);
    const aba = await page.evaluate(() => { const a = BC.estacao.ui.abas.find((x) => x.id === 'nav:assistente'); return a ? a.titulo : null; });
    const campos = await E.app.evaluate(async ({ webContents }) => {
      const e = globalThis.babelCoop.navegadores.estado('assistente');
      if (!e.registrado) return { registrado: false };
      const v = await webContents.fromId(e.webContentsId).executeJavaScript('(function () { var n = document.getElementById("nome"); return n ? { form: true, nome: n.value, email: document.getElementById("email").value, senha: document.getElementById("senha").value, url: location.href } : { form: false, url: location.href }; })()');
      return Object.assign({ registrado: true, suaVez: e.suaVez, passos: (e.passos || []).map((p) => p.tipo + ' · ' + p.texto) }, v);
    });
    /* o agente pode ter enviado o cadastro (a página virou a confirmação): a prova vira o que o site recebeu */
    const enviado = recebidos[recebidos.length - 1] || null;
    const valores = campos.form ? campos : enviado || {};
    const b = await blocos();
    res.passos.pedido3 = { turno: t, aba, campos, enviado, blocosNavegador: b.filter((x) => x.navegador).map((x) => x.tipo + ':' + x.texto), senhaNaPresenca: b.some((x) => x.senha) };
    await page.evaluate(() => BC.estacao.abrirAba && BC.estacao.ui.abas.some((a) => a.id === 'nav:assistente') && BC.navegadorReal.abrir({ id: 'assistente', nome: 'Assistente' }));
    await esperar(1200);
    await print('09-navegador-preenchido');
    assert.equal(aba, 'Navegador · Assistente');
    assert.equal(campos.registrado, true);
    assert.equal(valores.nome, 'Rita', JSON.stringify({ campos, enviado }));
    assert.equal(valores.email, 'rita@teste.com');
    assert.equal(valores.senha, '', 'a senha nunca é preenchida pelo agente');
    assert.ok(campos.passos.some((p) => /^digitar · preencheu Nome/.test(p)) && campos.passos.some((p) => /^digitar · preencheu E-mail/.test(p)), 'os passos de digitar na aba: ' + campos.passos.join(' | '));
    assert.ok(!campos.passos.some((p) => /^digitar · preench.* Senha/i.test(p)), 'nenhum passo digitou na senha');
    assert.ok(res.passos.pedido3.blocosNavegador.length >= 2, 'passos do navegador viraram blocos na presença: ' + JSON.stringify(res.passos.pedido3.blocosNavegador));
  });

  it('complemento: a senha recusada pelo mesmo conector do claude ("sua vez" na aba e na presença), com o formulário de volta', async () => {
    /* o claude obedeceu "não preencha a senha" e nem tentou; para ver a recusa, a mesma rota /mcp/<sessão> que ele usa, com o segredo
       da sessão (arquivo da própria sessão, em modo 600), chama navegador_abrir e navegador_digitar no campo de senha */
    const cfgMcp = JSON.parse(fs.readFileSync(path.join(raiz, '.coop', 'agentes', 'assistente', 'coop-mcp.json'), 'utf8'));
    const segredo = cfgMcp.mcpServers.coop.headers['X-Coop-Segredo'];
    const chamar = (name, args, id) => new Promise((ok, falha) => {
      const corpo = Buffer.from(JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } }));
      const req = http.request({ host: '127.0.0.1', port: PORTA, method: 'POST', path: '/mcp/assistente', headers: { 'Content-Type': 'application/json', 'Content-Length': corpo.length, 'X-Coop-Segredo': segredo } }, (r) => { let x = ''; r.on('data', (c) => { x += c; }); r.on('end', () => { try { ok(JSON.parse(x).result); } catch (e) { falha(new Error(x)); } }); });
      req.on('error', falha); req.end(corpo);
    });
    const ab = await chamar('navegador_abrir', { url: 'http://localhost:' + SITE }, 1);
    const sen = await chamar('navegador_digitar', { seletor: '#senha', texto: 'nao-deveria' }, 2);
    await esperar(800);
    const est = await E.app.evaluate(async ({ webContents }) => { const e = globalThis.babelCoop.navegadores.estado('assistente'); const v = await webContents.fromId(e.webContentsId).executeJavaScript('document.getElementById("senha") ? document.getElementById("senha").value : null'); return { suaVez: e.suaVez, senha: v }; });
    const b = await blocos();
    const espera = b.filter((x) => x.senha).pop();
    res.passos.senha = { abrir: ab && ab.content && ab.content[0].text.slice(0, 120), recusa: sen && sen.content && sen.content[0].text, isError: !!(sen && sen.isError), estado: est, blocoNaPresenca: espera || null };
    await print('09b-senha-sua-vez-no-navegador');
    await page.evaluate(() => BC.terminalReal.abrirAba && BC.terminalReal.abrirAba('assistente'));
    await print('09c-senha-sua-vez-na-presenca');
    assert.equal(sen.isError, true);
    assert.match(sen.content[0].text, /sua vez/);
    assert.equal(est.senha, '', 'nada foi digitado na senha');
    assert.equal(est.suaVez, true, 'a aba marca "sua vez"');
    assert.ok(espera && espera.tipo === 'espera', 'bloco "sua vez" na presença: ' + JSON.stringify(b.slice(-3)));
  });

  it('pedido extra (pedido do Theus): "me mostre o CSS do botão de cadastro dessa página" → navegador_raio_x ou navegador_codigo', async () => {
    const d = (await msgs()).length;
    await pedir('me mostre o CSS do botão de cadastro dessa página');
    const t = await turno(d, 'pedido CSS');
    const m = await msgs(d);
    const b = await blocos();
    const nav = m.filter((x) => x.tipo === 'agente-bloco' && x.bloco && x.bloco.navegador).map((x) => x.bloco.tipo + ':' + x.bloco.titulo + ' [' + x.bloco.navegador + ']');
    const resultado = b.filter((x) => x.tipo === 'resultado').pop();
    /* só o que nasceu neste turno (os blocos da presença vêm pelas agente-bloco depois do pedido) */
    const ferramentas = [...new Set(m.filter((x) => x.tipo === 'agente-bloco' && x.bloco && x.bloco.navegador).map((x) => x.bloco.navegador))];
    res.passos.css = { turno: t, ferramentas, blocos: nav.slice(-8), resposta: resultado && resultado.texto };
    await print('09d-css-do-botao');
    assert.ok(ferramentas.some((x) => /^(raio_x|raiox|codigo)$/.test(x)), 'usou navegador_raio_x ou navegador_codigo: ' + JSON.stringify(ferramentas));
    assert.match(resultado ? resultado.texto : '', /8670ff|background|border-radius/i, 'a resposta traz o CSS do botão');
  });

  it('pedido 4: clonar a página → Clones/<host>/index.html existe, abre por /pasta/ e o cartão da presença abre o clone', async () => {
    const d = (await msgs()).length;
    await pedir('clone essa página e me diga onde salvou');
    const t = await turno(d, 'pedido 4');
    const index = path.join(pasta, 'Clones', 'localhost_' + SITE, 'index.html');
    const existe = fs.existsSync(index);
    const r = await new Promise((ok) => http.get({ host: '127.0.0.1', port: PORTA, path: '/pasta/Clones/localhost_' + SITE + '/index.html' }, (x) => { let s = ''; x.on('data', (c) => { s += c; }); x.on('end', () => ok({ status: x.statusCode, csp: x.headers['content-security-policy'], tipo: x.headers['content-type'], temTitulo: s.includes('Clínica Vida') })); }).on('error', (e) => ok({ erro: e.message })));
    const b = await blocos();
    const resultado = b.filter((x) => x.tipo === 'resultado').pop();
    res.passos.pedido4 = { turno: t, index: path.relative(pasta, index), existe, pasta: r, resposta: resultado && resultado.texto, cartao: null };
    await print('10-clone-na-presenca');
    const cartao = page.locator('.tr-sessao[data-id="assistente"] [data-tr="clone"]').last();
    if (await cartao.count()) {
      res.passos.pedido4.cartao = await cartao.textContent();
      await cartao.scrollIntoViewIfNeeded().catch(() => {});
      await cartao.click();
      await ate(() => BC.estacao.ui.abas.some((a) => /^clone:Clones\//.test(a.id)), null, 'a aba do clone', 15000);
      await esperar(1500);
      await print('11-clone-aberto-como-site');
    }
    assert.ok(existe, 'Clones/localhost_' + SITE + '/index.html na pasta');
    assert.equal(r.status, 200);
    assert.ok(r.temTitulo && !/allow-same-origin/.test(r.csp || ''), JSON.stringify(r));
    assert.ok(/Clones/.test(resultado ? resultado.texto : ''), 'o claude disse onde salvou: ' + (resultado && resultado.texto));
  });

  it('custo informado pelo claude (/cost) e saída (/exit)', async () => {
    await pedir('/cost');
    await esperar(3000);
    const t = await tela(40);
    const linhas = t.split('\n').filter((l) => /\$\s*\d|cost|custo|subscription|assinatura|usage|uso/i.test(l)).map((l) => l.trim()).slice(-8);
    res.custo = linhas.length ? linhas : 'sem dado';
    await print('12-cost');
    /* o /cost abre o painel de uso do Claude Code: Esc fecha, e então /exit */
    await page.evaluate(() => BC.terminalReal.digitar('assistente', '\x1b'));
    await esperar(1200);
    await pedir('/exit');
    await ate(() => window.__ag.some((m) => m.tipo === 'agente-fim'), null, 'o claude sair (agente-fim)', 30000).catch(async () => {
      /* sem /exit: Ctrl+C duas vezes, como a pessoa faria */
      await page.evaluate(() => { BC.terminalReal.digitar('assistente', '\x03'); setTimeout(() => BC.terminalReal.digitar('assistente', '\x03'), 400); });
      await ate(() => window.__ag.some((m) => m.tipo === 'agente-fim'), null, 'o claude sair depois de Ctrl+C', 15000);
    });
    res.fim = await page.evaluate(() => window.__ag.filter((m) => m.tipo === 'agente-fim').pop());
    await print('13-fim');
  });
});
