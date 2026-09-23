/* babel-coop · O MAPA VIRA MÁQUINA · prova no app de verdade (Electron com a janela escondida, sem Chrome)
   Porta HTTP 5043, descoberta UDP 41543. Tudo por evento real: cliques no mapa, ações da equipe (L.fazer / L.fazerComo),
   publicar a Máquina pelo formulário, a TV numa segunda janela do Electron recebendo o estado pelo canal.
   Uso: cd app && node ../.deus/terminal-ao-vivo/evidencias/mapa/prova.cjs */
'use strict';
const fs = require('fs');
const path = require('path');
const { abrirEstacao } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/testes/e2e/estacao.js');
const EV = '/Users/matheussilveirapro/Desktop/babel-coop/.deus/terminal-ao-vivo/evidencias/mapa';
const PORTA = 5043;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const e = await abrirEstacao({ nome: 'mapa-prova', porta: PORTA, descoberta: 41543 });
  const R = { quando: new Date().toISOString(), passos: [], erros: [], errosTv: [] };
  const ok = (nome, passou, dado) => { R.passos.push({ nome, ok: !!passou, dado }); console.log((passou ? '✓ ' : '✗ ') + nome + (dado !== undefined ? ' · ' + JSON.stringify(dado).slice(0, 240) : '')); };
  let tvPage = null;
  try {
    const { app, page } = e;
    page.on('pageerror', (x) => R.erros.push(String(x.stack || x).slice(0, 300)));
    page.on('console', (m) => { if (m.type() === 'error') R.erros.push('console: ' + m.text().slice(0, 200)); });
    await page.waitForLoadState('domcontentloaded');
    await e.api('/api/fundar', { nome: 'Theus' });
    await page.reload(); await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.BC && BC.estacao && BC.loja && BC.loja.estado && BC.mapaVivo, null, { timeout: 30000 });
    await esperar(1500);
    const ev = (fn, ...a) => page.evaluate(fn, ...a);
    const frame = () => page.frames().find((f) => /mindforge/.test(f.url()) && f.parentFrame() === page.mainFrame());
    const galho = (f, txt) => f.locator('.node', { has: f.locator('.label', { hasText: new RegExp('^' + txt + '$') }) });
    const shot = (nome, alvo) => (alvo ? page.locator(alvo).screenshot({ path: path.join(EV, nome) }) : page.screenshot({ path: path.join(EV, nome) }));
    const termo = () => ({ escrever: () => {}, cartao: () => {}, mostrar: () => {} });

    /* 1. a presença cria o mapa (o mesmo código do terminal: BC.mapaAgente) e ele abre como carta de observatório */
    await ev(() => {
      const t = { escrever: () => {}, cartao: () => {}, mostrar: () => {} };
      BC.estacao.fecharTodas();
      BC.mapaAgente.pedido('cria um mapa sobre Lançamento com Preço, Público, WhatsApp, Canais, Landing e Instagram', { nome: 'Rita' }, t);
    });
    await esperar(1800);
    await ev(() => { const t = { escrever: () => {}, cartao: () => {}, mostrar: () => {} }; BC.mapaAgente.pedido('adiciona Reels e Stories em Canais', { nome: 'Rita' }, t); BC.mapaAgente.pedido('adiciona Planos e Depoimentos em Landing', { nome: 'Rita' }, t); });
    await esperar(1500);
    const mapa = await ev(() => { const t = BC.estacao.abaAtual(); const a = BC.loja.arquivo(t.ref); return { id: a.id, caminho: a.caminho, nos: JSON.parse(a.conteudo).nodes.length }; });
    ok('mapa criado pela presença e aberto (1 raiz + 6 galhos + 4 subgalhos)', mapa.nos === 11, mapa);
    const fr = frame();
    await fr.waitForFunction(() => document.documentElement.classList.contains('observatorio') && document.querySelectorAll('.node').length > 0);
    await fr.evaluate(() => window.mindforge.fitView()); await esperar(300);
    const obs = await fr.evaluate(() => ({ observatorio: document.documentElement.classList.contains('observatorio'), aneis: document.querySelectorAll('#observatorio .mf-anel').length, hud: document.querySelector('.mf-hud-sup').innerText, esq: document.querySelectorAll('.node.nivel-1.esq').length, dir: document.querySelectorAll('.node.nivel-1:not(.esq)').length, vidro: getComputedStyle(document.querySelector('.topbar')).backdropFilter, borda: getComputedStyle(document.querySelector('.topbar')).borderTopColor, ficha: !document.getElementById('mf-ficha').hidden }));
    ok('carta de observatório: anéis, HUD com número real, galhos dos dois lados, vidro com borda ciano', obs.observatorio && obs.aneis >= 6 && /GALHOS 11/.test(obs.hud) && obs.esq === 3 && obs.dir === 3 && /blur/.test(obs.vidro) && !obs.ficha, obs);
    const repouso = await fr.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
    ok('em repouso nada anima (luz só com evento)', repouso === 0, repouso);
    await shot('depois-1-estacao-mapa.png');
    await shot('depois-1b-mapa-perto.png', '.ed-mapa');

    /* 2. clicar no galho abre a ficha com "Materializar em…" */
    await galho(fr, 'Landing').click();
    await esperar(300);
    const fichaTxt = await fr.evaluate(() => document.getElementById('mf-ficha').hidden ? '' : document.getElementById('mf-ficha').innerText);
    ok('clique no galho abre a ficha com Materializar em Tela, Campanha, Demanda, Peça', /MATERIALIZAR EM/.test(fichaTxt) && /Tela/.test(fichaTxt) && /Peça da Máquina/.test(fichaTxt), fichaTxt.slice(0, 120));
    await shot('depois-2-ficha-materializar.png', '.ed-mapa');

    /* 3. Landing → Tela (clique real). O arquivo nasce, o galho guarda o endereço, a luz corre da raiz até o galho */
    const antesOrg = await ev(() => BC.organismo ? BC.organismo.contagem() : null);
    await fr.locator('#mf-ficha [data-mat="tela"]').click();
    await esperar(380);
    await shot('depois-3-pulso-correndo.png', '.ed-mapa');
    const pulsoVivo = await fr.evaluate(() => document.querySelectorAll('#mf-pulsos path.mf-pulso').length);
    await esperar(1400);
    const tela = await ev((id) => { const a = BC.loja.arquivo(id); const est = JSON.parse(a.conteudo); const n = est.nodes.find((x) => x.text === 'Landing'); const t = n.liga && BC.loja.arquivo(n.liga.id); return { liga: n.liga, arquivo: t && t.caminho, h2: t && (t.conteudo.match(/<h2>/g) || []).length, vivo: BC.mapaVivo.vivo(id)[n.id] }; }, mapa.id);
    ok('Landing virou Tela: arquivo .html nasceu com as seções dos subgalhos e o galho guarda o endereço', tela.arquivo && /Landing\.html$/.test(tela.arquivo) && tela.h2 === 2 && tela.liga.endereco && /›/.test(tela.liga.endereco.texto), { arquivo: tela.arquivo, endereco: tela.liga && tela.liga.endereco.texto, secoes: tela.h2 });
    const depoisOrg = await ev(() => BC.organismo ? BC.organismo.contagem() : null);
    const med1 = await fr.evaluate(() => window.mindforge.medidas());
    ok('a luz andou pelo galho (pulso no fio) e o organismo soltou faíscas e som', pulsoVivo > 0 && med1.pulsos >= 1 && (!depoisOrg || depoisOrg.faiscas > antesOrg.faiscas), { pulsoNoFio: pulsoVivo, medidas: med1, faiscasOrganismo: depoisOrg && [antesOrg.faiscas, depoisOrg.faiscas], som: depoisOrg && depoisOrg.somPedido });
    await shot('depois-4-tela-ligada.png', '.ed-mapa');

    /* 4. evento real: a Tela é editada e salva (a mesma ação do Salvar do editor) → o galho acende de novo e diz "salva por Theus" */
    const n0 = med1.luzes;
    await ev((id) => { const t = BC.loja.arquivo(id); BC.loja.fazer('salvarArquivo', t.id, t.conteudo.replace('Quero saber mais', 'Quero para a minha clínica')); }, tela.liga.id);
    await esperar(1500);
    const salvo = await ev((id) => { const v = BC.mapaVivo.vivo(id); return Object.values(v).find((x) => /salva por Theus/.test(x.rotulo)) || null; }, mapa.id);
    const med2 = await fr.evaluate(() => window.mindforge.medidas());
    ok('Tela salva (evento real) → o galho acende e mostra "salva por Theus"', !!salvo && med2.luzes > n0, { vivo: salvo, luzes: [n0, med2.luzes] });

    /* 5. WhatsApp → demanda para o Davi (ficha: Demanda → escolher pessoa). Davi começa, avisa pronta, o Theus dá OK → galho fechado */
    await galho(fr, 'WhatsApp').click();
    await esperar(250);
    await fr.locator('#mf-ficha [data-mat="demanda"]').click();
    await esperar(250);
    await shot('depois-5-demanda-para-quem.png', '.ed-mapa');
    await fr.locator('#mf-ficha [data-para="davi"]').click();
    await esperar(1500);
    const dem = await ev((id) => { const est = JSON.parse(BC.loja.arquivo(id).conteudo); const n = est.nodes.find((x) => x.text === 'WhatsApp'); const d = n.liga && BC.loja.demanda(n.liga.id); return { no: n.id, liga: n.liga, estado: d && d.estado, para: d && d.para, desc: d && d.descricao }; }, mapa.id);
    ok('WhatsApp virou demanda de verdade para o Davi, com o caminho do galho na descrição', dem.estado === 'enviada' && dem.para === 'davi' && /Lançamento › WhatsApp/.test(dem.desc), dem);
    const fases = [];
    const fase = () => ev((a) => { const v = BC.mapaVivo.vivo(a.m)[a.n]; return v && { fase: v.fase, rotulo: v.rotulo, n: v.n, fechado: v.fechado }; }, { m: mapa.id, n: dem.no });
    fases.push(await fase());
    await ev((id) => BC.loja.fazerComo('davi', 'comecar', id), dem.liga.id); await esperar(1200); fases.push(await fase());
    await shot('depois-6-demanda-andou.png', '.ed-mapa');
    await ev((id) => BC.loja.fazerComo('davi', 'pronta', id, 'Mensagem de boas-vindas com o link da agenda converte mais.'), dem.liga.id); await esperar(1200); fases.push(await fase());
    const orgAntesOk = await ev(() => BC.organismo ? BC.organismo.contagem() : null);
    await ev((id) => BC.loja.fazer('ok', id), dem.liga.id);
    await esperar(700);
    await shot('depois-7-galho-fechando.png', '.ed-mapa');
    await esperar(900); fases.push(await fase());
    const orgDepoisOk = await ev(() => BC.organismo ? BC.organismo.contagem() : null);
    const noFechado = await fr.evaluate((id) => { const el = document.querySelector('.node[data-id="' + id + '"]'); return { classe: el.className, selo: !!el.querySelector('.mf-selo'), linha: (el.querySelector('.mf-linha') || {}).innerText }; }, dem.no);
    ok('a luz anda a cada passo da demanda (enviada → andamento → pronta → OK)', fases.map((f) => f && f.fase).join('>') === 'nasceu>andando>pronta>concluido' && fases[3].n > fases[0].n, fases);
    ok('OK de quem pediu → galho fechado com luz de concluído (✓, fio verde, faíscas fortes, som "duas", o mapa respira)', noFechado.selo && /fechado/.test(noFechado.classe) && (!orgDepoisOk || (orgDepoisOk.respirar > orgAntesOk.respirar && (orgDepoisOk.somPedido.duas || 0) > (orgAntesOk.somPedido.duas || 0))), { no: noFechado, respirar: orgDepoisOk && [orgAntesOk.respirar, orgDepoisOk.respirar], duas: orgDepoisOk && orgDepoisOk.somPedido.duas });
    await esperar(2500);
    await shot('depois-8-demanda-fechada.png', '.ed-mapa');

    /* 6. Canais → campanha: a campanha anda quando os subgalhos (Reels, Stories) fecham */
    await galho(fr, 'Canais').click(); await esperar(250);
    await fr.locator('#mf-ficha [data-mat="campanha"]').click(); await esperar(1300);
    const camp = await ev((id) => { const est = JSON.parse(BC.loja.arquivo(id).conteudo); const n = est.nodes.find((x) => x.text === 'Canais'); const c = (BC.loja.estado.campanhas || []).find((x) => x.id === n.liga.id); return { no: n.id, liga: n.liga, campanha: c ? { titulo: c.titulo, alvo: c.alvo } : null, viaGerar: !!(BC.campanha && BC.campanha.gerar) }; }, mapa.id);
    ok('Canais virou campanha de verdade (estado.campanhas) ligada ao galho', !!camp.liga && (!!camp.campanha || camp.viaGerar), camp);
    const passosCamp = [];
    for (let i = 0; i < 40; i++) {
      const g = await ev((a) => { const r = BC.campanha && BC.campanha.estado(a.c); const v = BC.mapaVivo.vivo(a.m)[a.n]; return { estado: r && r.estado, prontas: r && r.pecas.filter((p) => p.estado === 'pronta').length, v: v && { fase: v.fase, rotulo: v.rotulo, n: v.n } }; }, { c: camp.liga.id, m: mapa.id, n: camp.no });
      if (!passosCamp.length || passosCamp[passosCamp.length - 1].v.n !== g.v.n) passosCamp.push(g);
      if (!camp.viaGerar || g.estado === 'pronta') break;
      await esperar(700);
    }
    ok('a campanha gerada anda peça a peça e a luz anda no galho Canais a cada peça pronta', passosCamp.length >= 3 && passosCamp[passosCamp.length - 1].estado === 'pronta', passosCamp.map((x) => x.v.rotulo + ' #' + x.v.n));
    await shot('depois-8b-campanha-andando.png', '.ed-mapa');
    if (camp.viaGerar) { await ev((c) => BC.campanha.ok(c), camp.liga.id); await esperar(1600); }
    const campV = await ev((a) => BC.mapaVivo.vivo(a.m)[a.n], { m: mapa.id, n: camp.no });
    ok('OK de quem pediu em todas as peças = campanha no ar = galho Canais fechado', campV && campV.fechado && /no ar/.test(campV.rotulo), campV);
    await galho(fr, 'Reels').click(); await esperar(200);
    await fr.locator('#mf-ficha [data-f="fechar"]').click(); await esperar(1200);
    const reels = await ev((id) => { const n = JSON.parse(BC.loja.arquivo(id).conteudo).nodes.find((x) => x.text === 'Reels'); return n.fechado || null; }, mapa.id);
    ok('fechar galho sem objeto grava nome e hora no mapa (função, sem cerimônia)', reels && reels.por === 'theus' && reels.em > 0, reels);

    /* 7. Preço → peça da Máquina: nasce tracejada no projeto, encaixa (luz), publicar pela Máquina fecha o galho */
    await galho(fr, 'Preço').click(); await esperar(250);
    await fr.locator('#mf-ficha [data-mat="peca"]').click(); await esperar(2400);
    const pc = await ev((id) => { const est = JSON.parse(BC.loja.arquivo(id).conteudo); const n = est.nodes.find((x) => x.text === 'Preço'); const m = BC.maquina.maquinas[n.liga.projeto]; const p = m.pecas.find((x) => x.id === n.liga.id); return { no: n.id, liga: n.liga, peca: p && { tipo: p.tipo, pronta: p.pronta, galho: p.galho }, pendente: m.mudancas.indexOf(n.liga.mudanca) !== -1, vivo: BC.mapaVivo.vivo(id)[n.id] }; }, mapa.id);
    ok('Preço virou peça da Máquina (encaixada, esperando publicar) e o galho sabe', pc.peca && pc.peca.pronta && pc.pendente && pc.vivo.fase === 'andando', pc);
    await ev((pj) => BC.maquina.abrir(pj), pc.liga.projeto); await esperar(900);
    await shot('depois-9-maquina-peca-do-galho.png');
    await ev(() => BC.acoes['mq-publicar']()); await esperar(300);
    await ev((pj) => { const nome = BC.loja.estado.projetos.find((p) => p.id === pj).nome; document.getElementById('mq-confirma').value = nome; document.querySelector('form[data-form="mq-publicar"]').requestSubmit(); }, pc.liga.projeto);
    await esperar(800);
    const pcV = await ev((a) => BC.mapaVivo.vivo(a.m)[a.n], { m: mapa.id, n: pc.no });
    ok('publicar a Máquina (formulário de verdade) fecha o galho Preço: "publicada em produção"', pcV && pcV.fechado && /publicada/.test(pcV.rotulo), pcV);
    await ev((id) => BC.explorador.abrirArquivo(id), mapa.id); await esperar(1800);

    /* 8. "Ir até" abre o objeto ligado */
    const fr2 = frame();
    await galho(fr2, 'Landing').click(); await esperar(250);
    await fr2.locator('#mf-ficha [data-f="ir"]').click(); await esperar(700);
    const ir = await ev(() => { const t = BC.estacao.abaAtual(); const a = t.tipo === 'arquivo' && BC.loja.arquivo(t.ref); return a ? a.caminho : t.tipo; });
    ok('"Ir até" abre a Tela ligada ao galho', /Landing\.html$/.test(ir), ir);
    await ev((id) => BC.explorador.abrirArquivo(id), mapa.id); await esperar(1800);
    const frV = frame();
    await frV.evaluate(() => window.mindforge.fitView()); await esperar(400);
    R.origemLogoAoReabrir = await frV.evaluate(() => window.mindforge.medidas().origem || []);
    await shot('depois-10-mapa-vivo-completo.png');
    await shot('depois-10b-mapa-vivo-perto.png', '.ed-mapa');

    /* 9. leva o mapa para a TV: uma segunda janela do Electron é a TV; a Estação passa galho a galho pela barra */
    await app.evaluate(({ BrowserWindow }, porta) => { const w = new BrowserWindow({ show: false, width: 1280, height: 720, backgroundColor: '#060b16' }); w.loadURL('http://localhost:' + porta + '/#tv'); }, PORTA);
    tvPage = await app.waitForEvent('window', { timeout: 20000 });
    tvPage.on('pageerror', (x) => R.errosTv.push(String(x.stack || x).slice(0, 300)));
    await tvPage.waitForLoadState('domcontentloaded');
    await tvPage.setViewportSize({ width: 1280, height: 720 }).catch(() => {});
    await esperar(3000);
    const fr3 = frame();
    await fr3.locator('#mfTvBtn').click();
    await esperar(3500);
    const tvFrame = () => tvPage.frames().find((f) => /mindforge/.test(f.url()));
    const tvInfo = async () => { const f = tvFrame(); if (!f) return null; return f.evaluate(() => ({ legenda: document.getElementById('mf-legenda').hidden ? '' : document.getElementById('mf-legenda').innerText, fora: document.querySelectorAll('.node.mf-fora').length, apresentando: document.body.classList.contains('presentation'), medidas: window.mindforge.medidas() })); };
    R.origemAntesDaTv = await fr3.evaluate(() => window.mindforge.medidas().origem || []);
    R.transicoesAteTv = await ev(() => BC.mapaVivo.medidas().transicoes.map((t) => t.fase + " · " + t.rotulo));
    const tv1 = await tvInfo();
    ok('TV apresenta o galho 1 com legenda e o resto apagado', tv1 && tv1.apresentando && /GALHO 1 DE 6/.test(tv1.legenda) && tv1.fora > 0, tv1);
    await tvPage.screenshot({ path: path.join(EV, 'depois-11-tv-galho-1.png') });
    const barra = await fr3.evaluate(() => document.getElementById('mf-barra-tv').innerText);
    ok('a Estação mostra "NA TV · galho 1 de 6" e controla', /NA TV/.test(barra) && /1 de 6/.test(barra), barra);
    await shot('depois-12-estacao-controla-tv.png', '.ed-mapa');
    for (let i = 0; i < 3; i++) { await fr3.locator('#mf-barra-tv [data-tv="proximo"]').click(); await esperar(1600); }
    const tv4 = await tvInfo();
    ok('"próximo" leva a TV galho a galho (galho 4 = Canais, com campanha e ✓)', tv4 && /GALHO 4 DE 6/.test(tv4.legenda) && /CANAIS/i.test(tv4.legenda) && /Campanha/.test(tv4.legenda), tv4 && tv4.legenda);
    await tvPage.screenshot({ path: path.join(EV, 'depois-13-tv-galho-4-canais.png') });
    R.origemLuzTv = await tvFrame().evaluate(() => window.mindforge.medidas().origem);
    const somTv = await tvPage.evaluate(() => window.BC && BC.organismo ? { tocado: BC.organismo.contagem().somTocado, bloqueado: BC.organismo.contagem().somBloqueado } : null);
    ok('a TV nunca toca som', !somTv || Object.keys(somTv.tocado || {}).length === 0, somTv);
    await fr3.locator('#mf-barra-tv [data-tv="encerrar"]').click(); await esperar(800);
    ok('encerrar tira o mapa da TV', await ev(() => !BC.loja.estado.projecao), null);

    R.origemLuzDepoisDeReabrir = await fr3.evaluate(() => window.mindforge.medidas().origem);
    /* 10. prefers-reduced-motion: cor sem movimento (a luz chega sem pulso nem faísca) */
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await esperar(300);
    const antesR = await fr3.evaluate(() => window.mindforge.medidas());
    await ev((id) => { const t = BC.loja.arquivo(id); BC.loja.fazer('salvarArquivo', t.id, t.conteudo + '\n<!-- revisão -->'); }, tela.liga.id);
    await esperar(1200);
    const depoisR = await fr3.evaluate(() => window.mindforge.medidas());
    ok('com movimento reduzido a luz acende sem pulso e sem faísca', depoisR.luzes > antesR.luzes && depoisR.pulsos === antesR.pulsos && depoisR.faiscasOrganismo === antesR.faiscasOrganismo, { antes: antesR, depois: depoisR });
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    R.organismo = await ev(() => BC.organismo ? BC.organismo.contagem() : null);
    R.mapaVivo = await ev(() => BC.mapaVivo.medidas());
    R.eventos = await ev(() => BC.loja.estado.eventos.filter((x) => x.tipo === 'mapa-galho').map((x) => x.texto).slice(0, 12));
  } catch (err) { R.falhou = String(err.stack || err); console.error('FALHOU:', err.stack || err); }
  finally {
    ok('zero erros de página na Estação', R.erros.filter((x) => !/Electron Security Warning|favicon/.test(x)).length === 0, R.erros);
    ok('zero erros de página na TV', R.errosTv.length === 0, R.errosTv);
    R.resumo = R.passos.filter((p) => p.ok).length + '/' + R.passos.length;
    console.log('RESUMO', R.resumo);
    fs.writeFileSync(path.join(EV, 'prova-resultado.json'), JSON.stringify(R, null, 2));
    await e.fechar();
  }
})();
