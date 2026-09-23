/* Babel Coop · roteiro de testes de comportamento do protótipo
   Roda no Playwright MCP: browser_run_code_unsafe com filename apontando para este arquivo.
   Cada verificação diz o que faz, o que esperava e o que achou. Serve os arquivos de prototipo/ por route.fulfill (file:// é bloqueado).
   Atualize este arquivo sempre que uma tela nova entrar: é ele que garante que o que o Theus pediu continua funcionando. */
async (page) => {
  const base = '/Users/matheussilveirapro/Desktop/babel-coop/prototipo';
  const tipos = { html: 'text/html', js: 'text/javascript', css: 'text/css', png: 'image/png' };
  const rota = route => { let p = route.request().url().replace('http://coop.local', '').split('#')[0].split('?')[0]; if (p === '/' || p === '') p = '/index.html'; const ext = p.split('.').pop(); route.fulfill({ path: base + p, contentType: (tipos[ext] || 'text/plain') + '; charset=utf-8', headers: { 'Cache-Control': 'no-store' } }).catch(() => route.fulfill({ status: 404, body: 'x' })); };
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await page.context().route('http://coop.local/**', rota);
  const erros = [];
  page.on('pageerror', e => erros.push(String(e).slice(0, 160)));
  await page.setViewportSize({ width: 1400, height: 860 });
  await page.goto('http://coop.local/'); await page.waitForTimeout(1500);

  const R = [];
  const ok = (secao, nome, passou, achou) => R.push({ secao, nome, ok: !!passou, achou: passou ? '' : String(achou).slice(0, 120) });
  const ev = (fn, ...args) => page.evaluate(fn, ...args);
  const espera = ms => page.waitForTimeout(ms);
  const abrir = id => ev((id) => { BC.estacao.fecharTodas(); BC.estacao.abrir(id); }, id);
  const terminal = t => ev((t) => BC.estacao.terminal.ia(t), t);
  const frameSite = () => page.frames().find(f => f.parentFrame() === page.mainFrame() && f.url().indexOf('mindforge') === -1);

  /* A. casca */
  await abrir('dia'); await ev(() => BC.estacao.fecharTodas());
  ok('A', 'fechar todas deixa o meio vazio e a lateral fica', await ev(() => BC.estacao.abaAtual().tipo === 'vazio' && document.getElementById('e-lateral').innerText.trim().length > 0), await ev(() => BC.estacao.abaAtual().tipo));
  await ev(() => { const b = document.querySelector('.e-atividades [data-acao="atividade"][data-id="equipe"]'); b.click(); });
  ok('A', 'com o meio vazio, clicar no ícone só troca a lateral', await ev(() => BC.estacao.abaAtual().tipo === 'vazio' && /equipe/i.test(document.getElementById('e-lateral').innerText)), await ev(() => BC.estacao.abaAtual().tipo));
  await ev(() => { BC.estacao.abrirPaleta(); const i = document.getElementById('paleta-entrada'); i.value = 'readme'; i.dispatchEvent(new Event('input', { bubbles: true })); });
  await espera(200);
  ok('A', 'paleta acha README', await ev(() => /README/i.test(document.getElementById('paleta-lista').innerText)), await ev(() => document.getElementById('paleta-lista').innerText.slice(0, 60)));
  await ev(() => { document.getElementById('paleta').hidden = true; });

  /* B. Criar, editor, edição na tela, mapa, máquina, presets */
  await ev(() => { const a = BC.loja.estado.arquivos.find(a => /README\.md$/.test(a.caminho) && a.dono === 'equipe') || BC.loja.estado.arquivos.find(a => /README\.md$/.test(a.caminho)); BC.explorador.abrirArquivo(a.id); });
  await espera(300);
  await ev(() => { BC.acoes['ed-modo']({ dataset: { modo: 'editar' } }); });
  await espera(200);
  const salvou = await ev(() => { const t = BC.estacao.abaAtual(); const c = document.getElementById('ed-texto-' + t.ref); if (!c) return 'sem campo'; c.value = c.value + '\nlinha do teste'; BC.editor.salvar(); const a = BC.loja.arquivo(t.ref); return a.conteudo.indexOf('linha do teste') !== -1 && a.salvoPor === BC.loja.eu && a.versoes.length > 0; });
  ok('B', 'editar e salvar README guarda versão e a foto de quem salvou', salvou === true, salvou);
  await ev(() => { const a = BC.loja.estado.arquivos.find(a => a.caminho.indexOf('landing.html') !== -1); BC.explorador.abrirArquivo(a.id); });
  await espera(500);
  ok('B', 'HTML abre como site (iframe)', await ev(() => !!document.querySelector('.ed-site-iframe')), 'sem iframe');
  await page.click('[data-acao="ed-visual"]'); await espera(700);
  { const fr = frameSite(); await fr.locator('h1').first().dblclick(); await page.keyboard.press('End'); await page.keyboard.type(' TESTE'); await espera(400); }
  ok('B', 'editar na tela: texto do h1 muda e vira rascunho', await ev(() => (BC.estacao.abaAtual().rascunhoVisual || '').indexOf('TESTE') !== -1), 'rascunho sem TESTE');
  await page.click('[data-acao="ed-visual-salvar"]'); await espera(400);
  ok('B', 'salvar da edição na tela grava no arquivo', await ev(() => BC.loja.arquivo(BC.estacao.abaAtual().ref).conteudo.indexOf('TESTE') !== -1), 'arquivo sem TESTE');
  await ev(() => BC.acoes['ed-vis']({ dataset: { v: '3d' } })); await espera(2500);
  ok('B', 'modo 3D monta a cena', await ev(() => !!document.querySelector('.ed-3d canvas')), 'sem canvas 3D');
  await ev(() => BC.acoes['ed-vis']({ dataset: { v: 'site' } })); await espera(300);
  await ev(() => BC.acoes['ed-preset']()); await espera(200);
  ok('B', 'tela salva como preset', await ev(() => BC.loja.estado.presets.some(p => p.tipo === 'tela' && /landing/i.test(p.nome))), 'preset da tela não entrou');
  await terminal('cria um mapa sobre roteiro de teste com galhos: um, dois, três'); await espera(1500);
  ok('B', 'terminal cria mapa e abre com o MindForge', await ev(() => { const t = BC.estacao.abaAtual(); const a = BC.loja.arquivo(t.ref); return a && a.tipo === 'mapa' && !!document.querySelector('.mm-frame') && JSON.parse(a.conteudo).nodes.length === 4; }), await ev(() => BC.estacao.abaAtual().tipo));
  await terminal('adiciona quatro em dois'); await espera(700);
  ok('B', 'terminal adiciona galho no mapa aberto', await ev(() => JSON.parse(BC.loja.arquivo(BC.estacao.abaAtual().ref).conteudo).nodes.some(n => n.text === 'quatro')), 'galho não entrou');
  await ev(() => { BC.estacao.fecharTodas(); BC.maquina.abrir('clinicas'); }); await espera(300);
  const antesP = await ev(() => BC.maquina.maquinas.clinicas.pecas.length);
  await ev(() => BC.acoes['mq-preset-usar']({ dataset: { id: 'pre2' } })); await espera(300);
  ok('B', 'usar preset monta as peças na Máquina', await ev((n) => BC.maquina.maquinas.clinicas.pecas.length === n + 3 && BC.loja.estado.presets.find(p => p.id === 'pre2').usos === 2, antesP), await ev(() => BC.maquina.maquinas.clinicas.pecas.length));
  await ev(() => BC.acoes['mq-testar']()); await espera(13000);
  ok('B', 'Testar termina e oferece "Salvar como preset"', await ev(() => !!document.querySelector('[data-acao="mq-preset-form"]')), 'botão de preset não apareceu');
  await ev(() => BC.acoes['mq-preset-form']()); await espera(200);
  await ev(() => { document.getElementById('mq-preset-nome').value = 'Preset do roteiro'; document.querySelector('form[data-form="mq-preset"]').requestSubmit(); }); await espera(300);
  ok('B', 'formulário guarda preset de backend com as peças', await ev(() => { const p = BC.loja.estado.presets.find(p => p.nome === 'Preset do roteiro'); return !!p && p.pecas.length > 3; }), 'preset não guardado');
  await terminal('usa o preset Login com empresa'); await espera(800);
  ok('B', 'terminal usa preset pelo nome', await ev(() => BC.maquina.maquinas.clinicas.pecas.some(p => p.nome === 'Usuários')), 'gaveta Usuários não entrou');
  ok('B', 'Máquina não cita Supabase', await ev(() => !/supabase/i.test(document.getElementById('e-conteudo').innerText + document.getElementById('e-lateral').innerText)), 'ainda cita');

  /* C. terminal e agentes */
  await terminal('cria uma campanha de 40 clientes para a Carla até 30/09'); await espera(600);
  ok('C', 'campanha pelo terminal', await ev(() => BC.loja.estado.campanhas.some(c => c.meta === 40 || /40/.test(c.titulo || ''))), await ev(() => JSON.stringify(BC.loja.estado.campanhas.slice(-1)[0] || {}).slice(0, 80)));
  await terminal('manda um aviso para a TV: teste do roteiro'); await espera(500);
  ok('C', 'aviso pelo terminal vai para o mural/TV', await ev(() => JSON.stringify(BC.loja.estado.avisos || BC.loja.estado.mural || BC.loja.estado.eventos.slice(-3)).indexOf('teste do roteiro') !== -1), 'aviso não achado');
  await terminal('entra em clinicavida.com.br e preenche o cadastro'); await espera(800);
  ok('C', 'navegador do agente abre aba', await ev(() => BC.estacao.abaAtual().tipo === 'navegador'), await ev(() => BC.estacao.abaAtual().tipo));
  await ev(() => { BC.acoes['nav-assumir']({ dataset: { id: Object.keys(BC.navegador.sessoes)[0] } }); }); await espera(300);
  await ev(() => { const f = document.querySelector('form[data-form="nav-ir"]'); f.querySelector('#nav-url-nova').value = 'exemplo.com.br'; f.requestSubmit(); }); await espera(400);
  ok('C', 'a pessoa usa o navegador: assume e digita um endereço', await ev(() => { const s = BC.navegador.sessoes[Object.keys(BC.navegador.sessoes)[0]]; return s.assumido && s.url === 'exemplo.com.br' && /exemplo\.com\.br/.test(document.getElementById('e-conteudo').innerText); }), await ev(() => JSON.stringify({ s: BC.navegador.sessoes[Object.keys(BC.navegador.sessoes)[0]].url })));
  await abrir('terminais'); await espera(300);
  ok('C', 'parede de terminais tem Entrar/Pedir', await ev(() => !!document.querySelector('[data-acao="term-entrar"]')), 'sem botão Entrar');
  await ev(() => { const b = document.querySelector('[data-acao="term-entrar"]'); b.click(); }); await espera(300);
  ok('C', 'gestão entra direto no terminal do outro', await ev(() => (BC.loja.estado.controles || []).some(c => c.quem === 'theus' && c.estado === 'ativo')), await ev(() => JSON.stringify(BC.loja.estado.controles.slice(-1)[0] || {})));

  /* D. demandas e cronômetro */
  await ev(() => { BC.estacao.fecharTodas(); BC.acoes['nova-demanda'](); }); await espera(250);
  await ev(() => { const f = document.querySelector('form[data-form="nova-demanda"]'); f.querySelector('#nd-titulo').value = 'Demanda do roteiro'; f.querySelector('#nd-para').value = 'davi'; f.requestSubmit(); }); await espera(400);
  ok('D', 'nova demanda criada sem erro e com aviso', await ev(() => BC.loja.estado.demandas.some(d => d.titulo === 'Demanda do roteiro' && d.para === 'davi')) && erros.length === 0, erros.join(' | '));
  ok('D', 'cronômetro visível e arrastável (pega por qualquer ponto)', await ev(() => { const b = document.getElementById('cronometro'); return !b.hidden; }), 'cronômetro escondido');
  await ev(() => { localStorage.setItem('babel-coop:cronometro-pos', JSON.stringify({ x: 700, y: 420 })); BC.estacao.render(); }); await espera(300);
  { const b = await page.locator('#cronometro').boundingBox(); await page.mouse.move(b.x + 40, b.y + 12); await page.mouse.down(); await page.mouse.move(b.x - 200, b.y - 150, { steps: 6 }); await espera(1200); await page.mouse.move(b.x - 300, b.y - 250, { steps: 6 }); await page.mouse.up(); await espera(1300);
    const r = await page.locator('#cronometro').boundingBox(); ok('D', 'cronômetro fica onde soltou depois de redesenhos', r.x <= b.x - 250 && r.y <= b.y - 150, JSON.stringify({ antes: b, depois: r })); }
  const d0 = await ev(() => { const d = BC.demandasUI.doCronometro(); if (d.estado === 'andamento') BC.loja.fazer('pausar', d.id, 'reunião'); const p = BC.loja.ultimaPausa(d); p.inicio = Date.now() - 120000; return d.id; });
  await ev(() => { const a = BC.loja.estado.arquivos.find(a => a.caminho.indexOf('roteiro-depoimento') !== -1); BC.explorador.abrirArquivo(a.id); }); await espera(400);
  ok('D', 'cronômetro volta sozinho ao mexer no arquivo citado na demanda', await ev((id) => BC.loja.demanda(id).estado === 'andamento', d0), await ev((id) => BC.loja.demanda(id).estado, d0));

  /* E. chat, reunião, sala */
  await abrir('chat'); await espera(300);
  await ev(() => { const f = document.querySelector('form[data-form="chat"]'); const i = f.querySelector('input, textarea'); i.value = 'mensagem do roteiro'; f.requestSubmit(); }); await espera(300);
  ok('E', 'mensagem no chat aparece', await ev(() => /mensagem do roteiro/.test(document.getElementById('e-conteudo').innerText)), 'não apareceu');
  await abrir('reuniao'); await espera(300);
  await ev(() => { BC.acoes['sala-guardar'] && BC.acoes['sala-guardar'](); }); await espera(300);
  ok('E', 'Salvar ideia falada abre a confirmação', await ev(() => !!document.querySelector('[data-acao="sala-confirmar"]')), 'sem confirmação');
  await ev(() => { const b = document.querySelector('[data-acao="sala-confirmar"]'); if (b) b.click(); }); await espera(300);
  ok('E', 'ideia falada entra em Ideias', await ev(() => BC.loja.estado.ideias.length > 0), 'sem ideias');

  /* F/G. acervo, equipe, perfil, projetos, token */
  await abrir('acervo'); await espera(200);
  await ev(() => { const i = document.querySelector('.acervo-busca input'); i.value = 'reembolso'; i.dispatchEvent(new Event('input', { bubbles: true })); }); await espera(400);
  ok('F', 'acervo acha "reembolso"', await ev(() => document.querySelectorAll('.resultado').length > 0), 'sem resultado');
  await ev(() => BC.estacao.abrirPerfil('theus')); await espera(300);
  ok('G', 'perfil abre como aba inteira com fatia e selos', await ev(() => BC.estacao.abaAtual().tipo === 'perfil' && /%/.test(document.getElementById('e-conteudo').innerText)), await ev(() => BC.estacao.abaAtual().tipo));
  await abrir('equipe'); await espera(200);
  await page.fill('#convite-nome', 'Pessoa do roteiro'); await page.click('[data-acao="eq-convidar"]'); await espera(300);
  ok('G', 'token de convite gerado', await ev(() => /^babel-/.test((document.getElementById('convite-token') || {}).textContent || '')), 'sem token');
  await ev(() => BC.estacao.abrirProjeto('clinicas')); await espera(300);
  ok('G', 'projeto abre com membros e conversa', await ev(() => BC.estacao.abaAtual().tipo === 'projeto' && !!document.querySelector('form[data-form="pj-msg"]')), await ev(() => BC.estacao.abaAtual().tipo));
  await abrir('explorador'); await espera(200);
  await ev(() => { const s = document.querySelector('#e-lateral select'); if (s) { s.value = 'clinicas'; s.dispatchEvent(new Event('change', { bubbles: true })); } }); await espera(300);
  ok('B', 'Criar em modo projeto mostra as pessoas com você', await ev(() => /com você agora/i.test(document.getElementById('e-lateral').innerText)), 'faixa não apareceu');

  /* H. WhatsApp, Loja */
  await abrir('whatsapp'); await ev(() => BC.acoes['wa-parear']()); await espera(300);
  await ev(() => { const c = document.querySelector('[data-acao="wa-conv"]'); if (c) c.click(); }); await espera(300);
  ok('H', 'WhatsApp pareia e abre conversa com campo de envio', await ev(() => !!document.querySelector('form[data-form="wa-enviar"]')), 'sem campo');
  await abrir('loja'); await espera(200);
  ok('H', 'Loja lista itens com Instalar', await ev(() => document.querySelectorAll('[data-acao="lj-instalar"]').length > 0), 'sem itens');

  /* K. Oficina */
  await abrir('oficina'); await espera(200);
  await terminal('muda no app: teste do roteiro na TV'); await espera(400);
  ok('K', 'mudança pelo terminal entra na Oficina', await ev(() => BC.loja.estado.app.mudancas.some(m => !m.versao && /roteiro/.test(m.texto))), 'não entrou');
  await ev(() => BC.loja.fazer('oficinaPublicar', 'versão do roteiro')); await espera(200);
  await ev(() => { BC.loja.verComo('carla'); BC.estacao.render(); }); await espera(300);
  ok('K', 'depois de publicar, a Carla vê "Atualizar"', await ev(() => !!document.querySelector('.st-atualizar')), 'sem botão');
  await ev(() => { BC.loja.verComo('theus'); BC.estacao.render(); });

  /* I. TV */
  const tv = await page.context().newPage();
  const errosTv = []; tv.on('pageerror', e => errosTv.push(String(e).slice(0, 120)));
  await tv.setViewportSize({ width: 1280, height: 720 }); await tv.goto('http://coop.local/#tv'); await tv.waitForTimeout(1500);
  ok('I', 'TV não tem nenhum botão', await tv.evaluate(() => document.querySelectorAll('#vista-tv button, #vista-tv input').length === 0), 'tem botão');
  await ev(() => { const a = BC.loja.estado.arquivos.find(a => /README\.md$/.test(a.caminho) && a.dono === 'equipe') || BC.loja.estado.arquivos.find(a => /README\.md$/.test(a.caminho)); BC.loja.fazer('projetar', a.caminho); }); await tv.waitForTimeout(800);
  ok('I', 'projetar arquivo aparece na TV', await tv.evaluate(() => !!BC.loja.estado.projecao && /README|linha do teste/i.test(document.body.innerText)), await tv.evaluate(() => document.body.innerText.slice(0, 80)));
  await ev(() => BC.loja.fazer('encerrarProjecao'));
  await tv.close();
  ok('I', 'TV sem erros nossos', errosTv.filter(e => !/randomUUID/.test(e)).length === 0, errosTv.join(' | '));

  ok('Z', 'nenhum erro de JavaScript na Estação durante o roteiro', erros.length === 0, erros.join(' | '));
  const total = R.length, passou = R.filter(r => r.ok).length;
  return { resumo: passou + '/' + total + ' passaram', falhas: R.filter(r => !r.ok), tudo: R.map(r => (r.ok ? '✓ ' : '✗ ') + r.secao + ' · ' + r.nome) };
}
