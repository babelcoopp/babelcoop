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
  /* barra do plano (CONCEITO §3.1): 12 atividades com rótulo de 11 px; os grupos têm alternador no topo da lateral e as vistas antigas continuam abrindo */
  ok('A', 'barra do plano: 12 atividades na ordem, rótulo 11 px, foto no pé', await ev(() => { const b = [...document.querySelectorAll('#e-atividades > button[data-acao="atividade"]')]; return b.map(x => x.querySelector('.ativ-rotulo').textContent).join('·') === 'Meu dia·Criar·Trabalho·Chat·WhatsApp·Reunião·Terminais·Projetos·Acervo·Equipe·Loja·Oficina' && b.every(x => getComputedStyle(x.querySelector('.ativ-rotulo')).fontSize === '11px') && !!document.querySelector('#e-atividades .ativ-perfil .avatar'); }), await ev(() => [...document.querySelectorAll('#e-atividades > button')].map(x => x.dataset.id || x.className).join(',')));
  await abrir('metas'); await espera(150);
  ok('A', 'grupo Equipe: Metas abre com o alternador Equipe | Metas | Mapa e a barra acende Equipe', await ev(() => [...document.querySelectorAll('#e-lateral .ativ-grupo button')].map(x => x.textContent + (x.getAttribute('aria-selected') === 'true' ? '*' : '')).join('|') === 'Equipe|Metas*|Mapa' && document.querySelector('#e-atividades [aria-current="page"]').dataset.id === 'equipe'), await ev(() => (document.querySelector('#e-lateral .ativ-grupo') || {}).textContent || 'sem alternador'));
  await ev(() => BC.estacao.fecharTodas());
  await ev(() => { BC.estacao.abrirPaleta(); const i = document.getElementById('paleta-entrada'); i.value = 'readme'; i.dispatchEvent(new Event('input', { bubbles: true })); });
  await espera(200);
  ok('A', 'paleta acha README', await ev(() => /README/i.test(document.getElementById('paleta-lista').innerText)), await ev(() => document.getElementById('paleta-lista').innerText.slice(0, 60)));
  await ev(() => { document.getElementById('paleta').hidden = true; });
  /* A · ícones à mão (agente ÍCONES, PLANO §2 R10): a família inteira, a barra e o sino com o desenho novo, e a folha de conferência */
  ok('A', 'ícones à mão: 61 da casca + 16 peças + 6 estados, traço 1,5, sem preenchimento, todos dentro da margem de 2 px', await ev(() => {
    const I = BC.icones; if (!I || !I.svg) return 'sem BC.icones';
    const todos = [].concat(I.casca(), I.nomes('pecas'), I.nomes('estados')), falhas = [];
    if (I.casca().length !== 61 || I.nomes('pecas').length !== 16 || I.nomes('estados').length !== 6) falhas.push('contagem ' + [I.casca().length, I.nomes('pecas').length, I.nomes('estados').length]);
    const caixa = document.createElement('div'); caixa.style.cssText = 'position:fixed;left:-200px;top:0'; document.body.appendChild(caixa);
    todos.forEach((n) => { caixa.innerHTML = I.svg(n, 24); const s = caixa.firstChild, b = s.getBBox();
      if (s.getAttribute('stroke-width') !== '1.5' || s.getAttribute('fill') !== 'none') falhas.push(n + ' traço/fill');
      if (Array.from(s.querySelectorAll('*')).some((el) => el.getAttribute('fill') && el.getAttribute('fill') !== 'none')) falhas.push(n + ' preenchido');
      if (b.x - .75 < 2 || b.y - .75 < 2 || b.x + b.width + .75 > 22 || b.y + b.height + .75 > 22) falhas.push(n + ' fora da margem'); });
    caixa.remove();
    return falhas.length ? falhas.join(' | ') : true;
  }) === true, await ev(() => { try { return BC.icones.casca().length + '/' + BC.icones.nomes().length; } catch (e) { return String(e); } }));
  await page.click('.e-atividades [data-acao="atividade"][data-id="acervo"]'); await espera(200);
  await page.click('#abrir-coluna'); await espera(200);
  ok('A', 'clique de verdade no ícone Acervo acende o desenho novo na barra, e o sino do topo (desenho novo) abre as novidades', await ev(() => {
    const a = document.querySelector('.e-atividades [aria-current="page"]'), s = a && a.querySelector('svg'), sino = document.querySelector('#abrir-coluna > svg');
    return !!a && a.dataset.id === 'acervo' && s.getAttribute('data-icone') === 'acervo' && getComputedStyle(s).strokeWidth === '1.5px' &&
      !!sino && sino.getAttribute('data-icone') === 'sino' && document.getElementById('abrir-coluna').getAttribute('aria-expanded') === 'true';
  }), await ev(() => { const a = document.querySelector('.e-atividades [aria-current="page"]'); return JSON.stringify({ ativo: a && a.dataset.id, icone: a && a.querySelector('svg') && a.querySelector('svg').getAttribute('data-icone'), sino: (document.querySelector('#abrir-coluna > svg') || {}).outerHTML ? document.querySelector('#abrir-coluna > svg').getAttribute('data-icone') : null, aberto: document.getElementById('abrir-coluna').getAttribute('aria-expanded') }); }));
  await page.click('#abrir-coluna'); await espera(150);
  {
    const fl = await page.context().newPage(); const errosFl = []; fl.on('pageerror', (e) => errosFl.push(String(e).slice(0, 120)));
    await fl.goto('http://coop.local/icones-folha.html'); await fl.waitForTimeout(900);
    await fl.click('.fl-celula[data-nome="robo"]'); await fl.waitForTimeout(250);
    const m = await fl.evaluate(() => Object.assign(BC.folha.medir(), { lupa: document.getElementById('fl-lupa-nome').textContent }));
    ok('A', 'folha de conferência: 83 ícones a 16/20/32 px em --s0/--s1/--s2, nenhum fora da margem, clique abre a lupa', m.celulas === 83 && m.svgs === 747 && m.foraDaMargem.length === 0 && m.preenchidos.length === 0 && m.lupaAberta && m.lupa === 'robo' && errosFl.length === 0, JSON.stringify({ c: m.celulas, s: m.svgs, fora: m.foraDaMargem, lupa: m.lupa, erros: errosFl }));
    await fl.close();
  }

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
  /* B · peças com corpo (PLANO R5): as 16 peças em PNG isométrico recortado + GLB (midia/pecas/pecas.js e pecas.json) */
  await ev(() => new Promise((ok) => { if (window.BC.pecas) return ok(); const s = document.createElement('script'); s.src = 'midia/pecas/pecas.js'; s.onload = ok; s.onerror = ok; document.head.appendChild(s); }));
  const pcs = await ev(async () => { try { const c = await BC.pecas.carregar(); const r = { n: c.pecas.length, ruins: [] }; for (const p of c.pecas) { const b = await (await fetch(BC.pecas.url(p.id, 'glb'), { cache: 'no-store' })).arrayBuffer(); const v = new DataView(b); const im = new Image(); im.src = BC.pecas.url(p.id, 'png'); await im.decode().catch(() => {}); if (v.getUint32(0, true) !== 0x46546c67 || v.getUint32(4, true) !== 2 || v.getUint32(8, true) !== b.byteLength || im.naturalWidth < 256) r.ruins.push(p.id); } return r; } catch (e) { return { n: 0, ruins: [String(e)] }; } });
  ok('B', 'as 16 peças têm PNG recortado e GLB glTF 2 válido', pcs.n === 16 && pcs.ruins.length === 0, JSON.stringify(pcs));
  await ev(() => { const d = document.createElement('div'); d.id = 'roteiro-pecas'; d.style.cssText = 'position:fixed;inset:60px 40px 40px 40px;z-index:90'; document.body.appendChild(d); return BC.pecas.vitrine(d); }); await espera(300);
  await page.click('#roteiro-pecas [data-peca="gaveta"]');
  await page.waitForFunction(() => { const p = document.querySelector('#roteiro-pecas .pc-palco'); return p && (p.dataset.estado === 'corpo' || p.dataset.estado === 'falhou'); }, null, { timeout: 20000 }).catch(() => {});
  ok('B', 'clicar na Gaveta da vitrine abre o corpo 3D (GLB carregado)', await ev(() => { const u = BC.pecas.ultimo(); return document.querySelector('#roteiro-pecas .pc-palco').dataset.estado === 'corpo' && !!document.querySelector('#roteiro-pecas canvas') && !!u && u.id === 'gaveta' && u.malhas > 0 && u.pixelRatio <= 1.5; }), await ev(() => JSON.stringify([document.querySelector('#roteiro-pecas .pc-palco').dataset.estado, BC.pecas.ultimo()])));
  await ev(() => { BC.pecas.fechar3d(); const d = document.getElementById('roteiro-pecas'); d.innerHTML = ''; BC.pecas.peca(d, 'cofre', { estado: 'nova' }); });
  const pcAntes = await ev(() => document.querySelector('#roteiro-pecas .pc-peca').dataset.estado);
  await ev(() => BC.pecas.ganharCorpo('#roteiro-pecas .pc-peca')); await espera(200);
  ok('B', 'peça nova nasce tracejada e ganha corpo ao publicar', pcAntes === 'nova' && await ev(() => document.querySelector('#roteiro-pecas .pc-peca').dataset.estado === 'corpo'), pcAntes);
  await ev(() => document.getElementById('roteiro-pecas').remove());

  /* B · Máquina 2030 (agente MÁQUINA, PLANO §1.4, §3 "B · Criar · Máquina", F4): nós e fios pela posição real, Testar por porta e
     "como quem", pulso verde peça a peça, a outra empresa morre no cadeado, "Máquina funcionando" com corpo, três alturas de zoom,
     vitrine das 16 peças, peça nova tracejada que ganha corpo ao publicar, pontos com origem. Tudo por clique de verdade. */
  {
    const faltou = []; const mqClique = (sel, dbl) => (dbl ? page.dblclick(sel, { timeout: 4000 }) : page.click(sel, { timeout: 4000 })).catch(() => faltou.push(sel)); const mqMarcar = sel => page.check(sel, { timeout: 4000 }).catch(() => faltou.push(sel)); const mqPreencher = (sel, v) => page.fill(sel, v, { timeout: 4000 }).catch(() => faltou.push(sel)); const mqEv = (fn, a) => ev(fn, a).catch(e => ({ erro: String(e).slice(0, 120) }));
    await page.waitForFunction(() => !((BC.maquina.maquinas.clinicas || {}).teste || {}).rodando, null, { timeout: 15000, polling: 100 }).catch(() => {});
    await ev(() => { BC.estacao.fecharTodas(); BC.maquina.abrir('clinicas'); }); await espera(400);
    await ev(() => { const b = document.querySelector('.mq2 .mq-zoom [data-z="dominio"]'); if (b) b.click(); }); await espera(250);
    const geo = await mqEv(() => { const mesa = document.querySelector('.mq2 .mq-mesa'), svg = mesa.querySelector('.mq-fios'), rs = svg.getBoundingClientRect(), k = rs.width / svg.viewBox.baseVal.width; const d = (p, r) => Math.hypot(Math.max(r.left - p.x, 0, p.x - r.right), Math.max(r.top - p.y, 0, p.y - r.bottom)); const soltos = []; mesa.querySelectorAll('path.mq-fio[data-de]').forEach(p => { const L = p.getTotalLength(), ea = mesa.querySelector('[data-no="' + p.dataset.de + '"]'), eb = mesa.querySelector('[data-no="' + p.dataset.para + '"]'); if (!L || !ea || !eb) { soltos.push(p.dataset.k); return; } const a = p.getPointAtLength(0), b = p.getPointAtLength(L); if (d({ x: rs.left + a.x * k, y: rs.top + a.y * k }, ea.getBoundingClientRect()) > 2.5 || d({ x: rs.left + b.x * k, y: rs.top + b.y * k }, eb.getBoundingClientRect()) > 2.5) soltos.push(p.dataset.k); }); const ps = Array.from(mesa.querySelectorAll('.mq-peca')).map(e => e.getBoundingClientRect()); let sob = 0; ps.forEach((a, i) => ps.slice(i + 1).forEach(b => { if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) sob++; })); return { pecas: ps.length, fios: mesa.querySelectorAll('path.mq-fio').length, soltos, sob, emoji: /[\u{1F300}-\u{1FAFF}]/u.test(document.querySelector('.mq2').innerText) }; });
    ok('B', 'Máquina 2030: 2D com nós e fios presos às peças pela posição real, sem sobreposição e sem emoji', !geo.erro && geo.pecas >= 12 && geo.fios >= 12 && geo.soltos.length === 0 && geo.sob === 0 && !geo.emoji, JSON.stringify(geo));
    await mqClique('.mq2 [data-acao="mq-testar-abrir"]'); await espera(250);
    await mqMarcar('.mq-teste-form input[name="mq-t-como"][value="ana"]');
    await mqPreencher('.mq-teste-form input[data-campo="paciente"]', 'Paciente do roteiro');
    await mqClique('.mq-teste-form button[type="submit"]'); await espera(1200);
    const andando = await mqEv(() => document.querySelectorAll('.mq2 .mq-peca[data-luz-cor="ok"]').length);
    await page.waitForFunction(() => { const t = BC.maquina.maquinas.clinicas.teste; return t && t.passou && !t.rodando; }, null, { timeout: 15000, polling: 100 }).catch(() => {});
    const verde = await mqEv(() => { const t = BC.maquina.maquinas.clinicas.teste; return { passou: !!(t && t.passou), acesas: document.querySelectorAll('.mq2 .mq-peca[data-luz-cor="ok"]').length, linha: t && t.linhaNova ? t.linhaNova.texto : '', pts: t ? t.pontos.map(p => p.pts + (p.repetido ? 'r' : '')) : [] }; });
    ok('B', 'Máquina 2030: Testar pela porta como Ana: pulso verde peça a peça, todas brilham juntas e a linha entra na gaveta (+6 com origem)', andando >= 1 && verde.passou && verde.acesas >= 6 && /Paciente do roteiro/.test(verde.linha) && verde.pts.indexOf('6') !== -1, JSON.stringify({ andando, verde }));
    await mqClique('.mq2 [data-acao="mq-testar-outra"]');
    await page.waitForFunction(() => { const t = BC.maquina.maquinas.clinicas.teste; return t && (t.barrado || t.fim); }, null, { timeout: 12000, polling: 50 }).catch(() => {});
    const barr = await mqEv(() => { const t = BC.maquina.maquinas.clinicas.teste; return { barrado: !!t.barrado, treme: !!document.querySelector('.mq2 .mq-cadeado.treme'), bolha: (document.querySelector('.mq2 .mq-bolha.barrou') || {}).textContent || '', vermelha: !!document.querySelector('.mq2 .mq-peca[data-luz-cor="alarme"]'), pts: t.pontos.map(p => p.pts + (p.repetido ? 'r' : '')) }; });
    ok('B', 'Máquina 2030: como a outra empresa o pulso vermelho morre no cadeado, que treme ("0 passaram · 1 barrado pela chave", +2)', barr.barrado && barr.treme && barr.vermelha && /0 passaram · 1 barrado pela chave/.test(barr.bolha) && barr.pts.indexOf('2') !== -1, JSON.stringify(barr));
    await page.waitForFunction(() => BC.maquina.retrato('clinicas').funcionando, null, { timeout: 8000, polling: 100 }).catch(() => {});
    await espera(1600);
    const func = await mqEv(() => { const r = BC.maquina.retrato('clinicas'), t = document.querySelector('.mq2 .mq-rito-titulo'), p0 = BC.maquina.pontos('clinicas')[0] || {}; return { funcionando: r.funcionando, corpo: r.pecas.filter(p => p.corpo).length, cormorant: !!t && /Cormorant/.test(getComputedStyle(t).fontFamily) && t.textContent === 'Máquina funcionando', imgs: Array.from(document.querySelectorAll('.mq2 .mq-corpo-img')).filter(i => i.complete && i.naturalWidth > 0).length, ultimo: p0.pts + ' ' + (p0.origem || '') }; });
    ok('B', 'Máquina funcionando: título em Cormorant, as peças ganham corpo (imagens isométricas) e +12 com origem', func.funcionando && func.cormorant && func.corpo >= 10 && func.imgs >= 6 && /^12 Máquina funcionando/.test(func.ultimo), JSON.stringify(func));
    await mqClique('.mq2 .mq-zoom [data-z="inteira"]'); await espera(250);
    const nDom = await mqEv(() => document.querySelectorAll('.mq2 .mq-dominio').length);
    await mqClique('.mq2 .mq-dominio[data-d="agenda"]'); await espera(250);
    const fora = await mqEv(() => document.querySelectorAll('.mq2 .mq-peca.fora').length);
    await mqClique('.mq2 .mq-peca[data-no="agendamentos"]', true); await espera(350);
    const perto = await mqEv(() => { const g = document.querySelector('.mq2 .mq-peca.grande'); return { grande: g ? g.dataset.no : null, entram: document.querySelectorAll('.mq2 .mq-mesa-peca .mq-col[data-c="0"] [data-no]').length, saem: document.querySelectorAll('.mq2 .mq-mesa-peca .mq-col[data-c="2"] [data-no]').length, onde: /onde fica guardado/i.test(document.querySelector('.mq2 .mq-ficha').innerText) }; });
    ok('B', 'Máquina: três alturas de zoom por clique (inteira → domínio → peça) e a ficha em português diz onde fica guardado', nDom >= 3 && fora > 0 && perto.grande === 'agendamentos' && perto.entram >= 2 && perto.saem >= 1 && perto.onde, JSON.stringify({ nDom, fora, perto }));
    await mqClique('.mq2 .mq-zoom [data-z="dominio"]'); await espera(150); await mqClique('.mq2 .mq-zoom [data-z="dominio"]'); await espera(200);
    await mqClique('.mq2 [data-acao="mq-painel"][data-p="vitrine"]'); await espera(200);
    const n16 = await mqEv(() => document.querySelectorAll('.mq2 .mq-vitrine-item').length);
    await mqClique('.mq2 .mq-vitrine-item[data-t="cano"]'); await espera(200);
    await mqClique('.mq2 [data-acao="mq-montar-tipo"][data-t="cano"]'); await espera(250);
    const idNovo = await mqEv(() => { const m = BC.maquina.maquinas.clinicas; return m.pecas[m.pecas.length - 1].id; });
    const tracejada = await mqEv((id) => { const el = document.querySelector('.mq2 .mq-peca[data-no="' + id + '"]'); return !!el && getComputedStyle(el).borderTopStyle === 'dashed'; }, idNovo);
    await espera(1900);
    await mqClique('.mq2 .mq-topo [data-acao="mq-publicar"]'); await espera(200);
    await mqPreencher('#mq-confirma', String(await mqEv(() => BC.maquina.maquinas.clinicas.pj.nome))); await mqClique('form[data-form="mq-publicar"] button[type="submit"]');
    await page.waitForFunction((id) => { const p = BC.maquina.maquinas.clinicas.pecas.find(x => x.id === id); return p && p.corpo; }, idNovo, { timeout: 8000, polling: 100 }).catch(() => {});
    await espera(400);
    const pub = await mqEv((id) => { const el = document.querySelector('.mq2 .mq-peca[data-no="' + id + '"]'); return { corpo: !!el && /corpo/.test(el.className), borda: el ? getComputedStyle(el).borderTopStyle : '', evento: BC.loja.estado.eventos.slice(0, 8).some(e => e.tipo === 'maquina' && e.maquina === 'publicou') }; }, idNovo);
    ok('B', 'Máquina: vitrine das 16 peças; a peça montada nasce tracejada e ganha corpo ao Publicar (o evento vai para a equipe e a TV)', n16 === 16 && tracejada && pub.corpo && pub.borda === 'solid' && pub.evento, JSON.stringify({ n16, tracejada, pub, faltou }));
  }

  /* B · o mapa vira máquina (agente MAPA, PLANO §1 propriedade 5, §3 "B · Criar · Mapa", R6 mapa-observatório): a carta de observatório,
     cada galho materializa em Tela, demanda, campanha ou peça da Máquina (o objeto nasce de verdade e o galho guarda o endereço),
     a luz anda pelo galho a cada evento real do objeto ligado, o galho fechado acende de concluído e a TV apresenta galho a galho.
     Tudo por clique no mapa ou pelo terminal; as mudanças vêm das ações da loja (as mesmas da equipe). */
  {
    const galho = (f, t) => f.locator('.node', { has: f.locator('.label', { hasText: new RegExp('^' + t + '$') }) });
    const frMapa = () => page.frames().find(f => f.parentFrame() === page.mainFrame() && f.url().indexOf('mindforge') !== -1);
    const vivoDe = (txt) => ev((t) => { const a = BC.loja.arquivo(BC.estacao.abaAtual().ref), n = JSON.parse(a.conteudo).nodes.find(x => x.text === t); return { liga: n.liga || null, fechado: n.fechado || null, vivo: BC.mapaVivo.vivo(a.caminho)[n.id] || null, id: n.id }; }, txt);
    await ev(() => BC.estacao.fecharTodas());
    await terminal('cria um mapa sobre Lançamento do roteiro com Landing, WhatsApp, Canais e Preço'); await espera(1800);
    const fm = frMapa();
    await fm.waitForFunction(() => document.documentElement.classList.contains('observatorio') && document.querySelectorAll('.node').length === 5, null, { timeout: 8000 }).catch(() => {});
    const obs = await fm.evaluate(() => ({ aneis: document.querySelectorAll('#observatorio .mf-anel').length, hud: (document.querySelector('.mf-hud-sup') || {}).innerText || '', dir: document.querySelectorAll('.node.nivel-1:not(.esq)').length, esq: document.querySelectorAll('.node.nivel-1.esq').length, vidro: getComputedStyle(document.querySelector('.topbar')).backdropFilter, anima: document.getAnimations().filter(a => a.playState === 'running').length }));
    ok('B', 'Mapa vira máquina: carta de observatório (anéis, HUD com número real, galhos dos dois lados, vidro) e nada anima em repouso', obs.aneis >= 6 && /GALHOS 5 · MATERIALIZADOS 0/.test(obs.hud) && obs.dir === 2 && obs.esq === 2 && /blur/.test(obs.vidro) && obs.anima === 0, JSON.stringify(obs));
    await galho(fm, 'Landing').click(); await espera(250);
    await fm.locator('#mf-ficha [data-mat="tela"]').click(); await espera(1400);
    const tela = await vivoDe('Landing'), telaArq = await ev((c) => { const a = BC.loja.arquivo(c); return a ? { caminho: a.caminho, tipo: a.tipo } : null; }, tela.liga && tela.liga.caminho);
    const m1 = await fm.evaluate(() => window.mindforge.medidas());
    ok('B', 'Mapa vira máquina: clicar no galho → Tela: o .html nasce, o galho guarda o endereço e a luz corre da raiz até ele (faíscas em CSS sem o organismo)', !!telaArq && telaArq.tipo === 'html' && /Landing\.html$/.test(telaArq.caminho) && /›/.test(tela.liga.endereco.texto) && tela.vivo && tela.vivo.n === 1 && m1.luzes >= 1 && m1.pulsos >= 1 && m1.faiscasCss >= 1, JSON.stringify({ telaArq, end: tela.liga && tela.liga.endereco.texto, vivo: tela.vivo, m1 }));
    await ev((c) => { const a = BC.loja.arquivo(c); BC.loja.fazer('salvarArquivo', a.caminho, a.conteudo.replace('Quero saber mais', 'Quero para a minha clínica')); }, tela.liga.caminho); await espera(1200);
    const tela2 = await vivoDe('Landing'), m2 = await fm.evaluate(() => window.mindforge.medidas());
    ok('B', 'Mapa vira máquina: Tela salva (evento real) → o galho acende de novo e diz "salva por Theus"', tela2.vivo.n === 2 && /salva por Theus/.test(tela2.vivo.rotulo) && m2.luzes > m1.luzes, JSON.stringify({ vivo: tela2.vivo, luzes: [m1.luzes, m2.luzes] }));
    await terminal('materializa o galho WhatsApp em demanda para a Eva'); await espera(900);
    const dem = await vivoDe('WhatsApp');
    const demD = await ev((id) => { const d = BC.loja.demanda(id); return d ? { para: d.para, estado: d.estado } : null; }, dem.liga && dem.liga.id);
    const fases = [dem.vivo && dem.vivo.fase];
    await ev((id) => BC.loja.fazerComo('eva', 'comecar', id), dem.liga.id); await espera(700); fases.push((await vivoDe('WhatsApp')).vivo.fase);
    await ev((id) => BC.loja.fazerComo('eva', 'pronta', id, 'Mensagem com o link da agenda converte mais no roteiro.'), dem.liga.id); await espera(700); fases.push((await vivoDe('WhatsApp')).vivo.fase);
    await ev((id) => BC.loja.fazer('ok', id), dem.liga.id); await espera(1400);
    const demF = await vivoDe('WhatsApp'), demEl = await fm.evaluate((id) => { const el = document.querySelector('.node[data-id="' + id + '"]'); return { fechado: !!el && el.classList.contains('fechado'), selo: !!el && !!el.querySelector('.mf-selo') }; }, dem.id);
    fases.push(demF.vivo.fase);
    ok('B', 'Mapa vira máquina: pelo terminal o galho vira demanda para a Eva e a luz anda a cada passo (nasceu → andando → pronta → concluído)', !!demD && demD.para === 'eva' && fases.join('>') === 'nasceu>andando>pronta>concluido', JSON.stringify({ demD, fases }));
    ok('B', 'Mapa vira máquina: o OK de quem pediu fecha o galho com luz de concluído (✓ e fio verde, evento para a TV)', demF.vivo.fechado && demEl.fechado && demEl.selo && await ev(() => BC.loja.estado.eventos.slice(0, 6).some(e => e.tipo === 'mapa-galho' && e.tv && /fechou/.test(e.texto))), JSON.stringify({ vivo: demF.vivo, demEl }));
    await galho(fm, 'Canais').click(); await espera(250);
    await fm.locator('#mf-ficha [data-mat="campanha"]').click(); await espera(600);
    const camp = await vivoDe('Canais');
    await page.waitForFunction((id) => { const c = BC.campanha && BC.campanha.estado(id); return !c || c.estado === 'pronta'; }, camp.liga && camp.liga.id, { timeout: 20000 }).catch(() => {});
    await espera(700);
    const campP = await vivoDe('Canais');
    await ev((id) => { if (BC.campanha && BC.campanha.estado(id)) BC.campanha.ok(id); }, camp.liga && camp.liga.id); await espera(1300);
    const campF = await vivoDe('Canais');
    ok('B', 'Mapa vira máquina: galho → campanha gerada (6 peças com dono); a luz anda a cada peça pronta e o OK põe no ar e fecha o galho', !!camp.liga && campP.vivo && campP.vivo.n >= 3 && campF.vivo && campF.vivo.fechado && /no ar/.test(campF.vivo.rotulo), JSON.stringify({ liga: camp.liga && camp.liga.endereco, pronta: campP.vivo, fim: campF.vivo }));
    await galho(fm, 'Preço').click(); await espera(250);
    await fm.locator('#mf-ficha [data-mat="peca"]').click(); await espera(2200);
    const pc = await vivoDe('Preço');
    const pcM = await ev((l) => { const m = BC.maquina.maquinas[l.projeto], p = m && m.pecas.find(x => x.id === l.id); return p ? { pronta: !!p.pronta, publicada: !!p.publicada, galho: !!p.galho, pendente: m.mudancas.indexOf(l.mudanca) !== -1 } : null; }, pc.liga);
    const mapaId = await ev(() => BC.estacao.abaAtual().ref);
    await ev((pj) => { BC.estacao.fecharTodas(); BC.maquina.abrir(pj); }, pc.liga.projeto); await espera(500);
    await page.click('.mq2 .mq-topo [data-acao="mq-publicar"]'); await espera(200);
    await page.fill('#mq-confirma', await ev((pj) => BC.maquina.maquinas[pj].pj.nome, pc.liga.projeto)); await page.click('form[data-form="mq-publicar"] button[type="submit"]');
    await page.waitForFunction((l) => { const p = BC.maquina.maquinas[l.projeto].pecas.find(x => x.id === l.id); return p && p.publicada; }, pc.liga, { timeout: 8000, polling: 100 }).catch(() => {});
    await espera(600);
    await ev((id) => BC.explorador.abrirArquivo(id), mapaId); await espera(1500);
    const pcF = await vivoDe('Preço');
    ok('B', 'Mapa vira máquina: galho → peça da Máquina (encaixa esperando publicar); Publicar na Máquina fecha o galho', !!pcM && pcM.pronta && !pcM.publicada && pcM.galho && pcM.pendente && pc.vivo.fase === 'andando' && pcF.vivo && pcF.vivo.fechado && /publicada/.test(pcF.vivo.rotulo), JSON.stringify({ pcM, antes: pc.vivo, depois: pcF.vivo }));
    const fm2 = frMapa();
    await fm2.waitForFunction(() => /MATERIALIZADOS 4 · FECHADOS 3/.test((document.querySelector('.mf-hud-sup') || {}).innerText || ''), null, { timeout: 5000 }).catch(() => {});
    ok('B', 'Mapa vira máquina: o HUD conta o que é verdade (4 materializados, 3 fechados, último sinal com hora)', await fm2.evaluate(() => /MATERIALIZADOS 4 · FECHADOS 3/.test(document.querySelector('.mf-hud-sup').innerText) && /ÚLTIMO SINAL \d\d:\d\d/.test(document.querySelector('.mf-hud-sup').innerText)), await fm2.evaluate(() => document.querySelector('.mf-hud-sup').innerText));
    await galho(fm2, 'Landing').click(); await espera(250);
    await fm2.locator('#mf-ficha [data-f="ir"]').click(); await espera(500);
    ok('B', 'Mapa vira máquina: "Ir até" abre o objeto ligado (a Tela)', await ev(() => { const t = BC.estacao.abaAtual(), a = t.tipo === 'arquivo' && BC.loja.arquivo(t.ref); return !!a && /Landing\.html$/.test(a.caminho); }), await ev(() => BC.estacao.abaAtual().tipo));
    await ev((id) => BC.explorador.abrirArquivo(id), mapaId); await espera(1500);
    const tvM = await page.context().newPage();
    const errosTvM = []; tvM.on('pageerror', e => errosTvM.push(String(e).slice(0, 120)));
    await tvM.setViewportSize({ width: 1280, height: 720 }); await tvM.goto('http://coop.local/#tv'); await tvM.waitForTimeout(1500);
    const fm3 = frMapa();
    await fm3.locator('#mfTvBtn').click(); await espera(2600);
    const legenda = async () => { const f = tvM.frames().find(x => x.url().indexOf('mindforge') !== -1); return f ? f.evaluate(() => ({ leg: document.getElementById('mf-legenda').hidden ? '' : document.getElementById('mf-legenda').innerText, apres: document.body.classList.contains('presentation'), fora: document.querySelectorAll('.node.mf-fora').length })) : null; };
    const l1 = await legenda(), barraTv = await fm3.evaluate(() => document.getElementById('mf-barra-tv').hidden ? '' : document.getElementById('mf-barra-tv').innerText);
    await fm3.locator('#mf-barra-tv [data-tv="proximo"]').click(); await espera(1500);
    const l2 = await legenda();
    ok('B', 'Mapa vira máquina: "TV" leva o mapa para a TV galho a galho (legenda, resto apagado) e a Estação controla pela barra "na TV"', !!l1 && l1.apres && /GALHO 1 DE 4/.test(l1.leg) && /LANDING/i.test(l1.leg) && l1.fora > 0 && /NA TV/.test(barraTv) && !!l2 && /GALHO 2 DE 4/.test(l2.leg) && /WHATSAPP/i.test(l2.leg), JSON.stringify({ l1, l2, barraTv }));
    await fm3.locator('#mf-barra-tv [data-tv="encerrar"]').click(); await espera(500);
    ok('B', 'Mapa vira máquina: encerrar tira o mapa da TV; a TV sem erros', await ev(() => !BC.loja.estado.projecao) && errosTvM.length === 0, errosTvM.join(' | '));
    await tvM.close();
    await page.emulateMedia({ reducedMotion: 'reduce' }); await espera(200);
    const r0 = await fm3.evaluate(() => window.mindforge.medidas());
    await ev((c) => { const a = BC.loja.arquivo(c); BC.loja.fazer('salvarArquivo', a.caminho, a.conteudo + '\n<!-- revisão do roteiro -->'); }, tela.liga.caminho); await espera(900);
    const r1 = await fm3.evaluate(() => window.mindforge.medidas());
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    ok('B', 'Mapa vira máquina: com movimento reduzido a luz acende sem pulso e sem faísca', r1.luzes > r0.luzes && r1.pulsos === r0.pulsos && r1.faiscasCss === r0.faiscasCss, JSON.stringify({ r0, r1 }));
    await ev(() => BC.estacao.fecharTodas());
  }

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

  /* C · gera a campanha (agente CAMPANHA, PLANO §5 F3, campanha.js): o pedido transforma o meio no palco com a Tela, 3 anúncios,
     o WhatsApp e o calendário, cada peça com dono e anel; cada peça abre no editor certo; o OK de quem pediu põe no ar */
  await ev(() => BC.estacao.fecharTodas());
  await terminal('gera a campanha Roteiro Vida de 12 clientes para a Carla até 30/09'); await espera(400);
  ok('C', 'gera a campanha: o meio vira o palco com 6 peças, cada uma com dono', await ev(() => { const t = BC.estacao.abaAtual(), c = BC.campanha.lista()[0]; return t.tipo === 'campanha' && !t.peca && !!document.querySelector('.cp-palco:not([hidden])') && document.querySelectorAll('.cp-palco:not([hidden]) .cp-peca').length === 6 && c.nome === 'Roteiro Vida' && c.para === 'carla' && c.meta === '12 clientes' && c.pecas.every(p => p.dono); }), await ev(() => JSON.stringify({ aba: BC.estacao.abaAtual().tipo, c: (BC.campanha.lista()[0] || {}).nome })));
  await page.waitForFunction(() => BC.campanha.lista()[0].estado === 'pronta', null, { timeout: 15000 }).catch(() => null); await espera(900);
  ok('C', 'gera a campanha: anéis fecham, plano com 6 ✓, rito e 6 arquivos no endereço', await ev(() => { const c = BC.campanha.lista()[0], pal = document.querySelector('.cp-palco:not([hidden])'); return c.estado === 'pronta' && c.pecas.every(p => p.progresso === 1) && pal.querySelectorAll('.cp-check li.feito').length === 6 && /Campanha pronta/.test(pal.querySelector('.cp-rito').innerText) && BC.loja.estado.arquivos.filter(a => a.caminho.indexOf(c.endereco + '/') === 0).length === 6; }), await ev(() => JSON.stringify(BC.campanha.lista()[0].pecas.map(p => p.id + ':' + p.estado))));
  await page.click('.cp-palco:not([hidden]) .cp-peca[data-peca="tela"] .cp-abrir'); await espera(500);
  ok('C', 'gera a campanha: a Tela abre como arquivo no Site|Código', await ev(() => { const t = BC.estacao.abaAtual(), a = BC.loja.arquivo(t.ref); return t.tipo === 'arquivo' && /Roteiro Vida\/landing\.html$/.test(a.caminho) && /Site.*Código/.test((document.querySelector('.ed-alternar') || {}).textContent || ''); }), await ev(() => BC.estacao.abaAtual().tipo));
  await page.click('#e-abas .e-aba[data-id^="campanha:"]'); await espera(300);
  await page.click('.cp-palco:not([hidden]) .cp-peca[data-peca="anuncio-2"] .cp-previa'); await espera(300);
  const cpImagem = await ev(() => BC.estacao.abaAtual().peca === 'anuncio-2' && !!document.querySelector('.cp-ed-arte svg') && [...document.querySelectorAll('.cp-alternar button')].map(b => b.textContent).join('|') === 'Imagem|Texto');
  await page.click('.cp-alternar [data-modo="texto"]'); await espera(200);
  await page.fill('#cpf-titulo', 'Título do roteiro'); await page.click('form[data-form="cp-peca"] button[type="submit"]'); await espera(300);
  ok('C', 'gera a campanha: o anúncio abre como Imagem|Texto e salvar grava a arte .svg', cpImagem && await ev(() => decodeURIComponent(BC.loja.arquivo(BC.campanha.lista()[0].endereco + '/anuncio-2.svg').conteudo).indexOf('Título do roteiro') !== -1), cpImagem);
  await page.click('.cp-lat-peca[data-peca="whatsapp"]'); await espera(300);
  const cpWa = await ev(() => BC.estacao.abaAtual().peca === 'whatsapp' && !!document.querySelector('.cp-ed-wa .cp-wa-balao'));
  await page.click('.cp-lat-peca[data-peca="calendario"]'); await espera(300);
  ok('C', 'gera a campanha: WhatsApp como mensagem sugerida e calendário como lista de datas', cpWa && await ev(() => BC.estacao.abaAtual().peca === 'calendario' && document.querySelectorAll('.cp-datas input[type="date"]').length === 7), cpWa);
  await page.click('#e-abas .e-aba[data-id^="campanha:"]'); await espera(300);
  await page.click('.cp-palco:not([hidden]) .cp-ok-todas'); await espera(600);
  ok('C', 'gera a campanha: o OK de quem pediu põe no ar (6 Selos com nome e hora, aviso para a TV)', await ev(() => BC.campanha.lista()[0].estado === 'no-ar' && document.querySelectorAll('.cp-palco:not([hidden]) .cp-selo.selado').length === 6 && BC.loja.estado.eventos.some(e => e.tipo === 'campanha-no-ar' && e.tv)), await ev(() => BC.campanha.lista()[0].estado));
  const cpApi = await ev(() => { const r = BC.campanha.gerar({ nome: 'API do roteiro', para: 'davi', prazo: '2099-12-31', abrir: false }); const vivo = BC.campanha._motores().indexOf(r.id) !== -1; BC.loja.fazer('campanhaDesfazer', r.id); return { r: r, vivo: vivo, parou: BC.campanha._motores().indexOf(r.id) === -1, sumiu: !BC.campanha.estado(r.id) }; });
  ok('C', 'BC.campanha.gerar (para o conector coop) devolve id, endereço e 6 peças com dono; desfazer para o motor', cpApi.r.id && cpApi.r.endereco === 'equipe/Campanhas/API do roteiro' && cpApi.r.pecas.length === 6 && cpApi.r.pecas.every(p => p.dono && p.arquivo) && cpApi.vivo && cpApi.parou && cpApi.sumiu, cpApi);

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

  /* F. a memória tem nome (PLANO §1.3): cita quem ensinou e os usos; usar soma +1; a luz vai só para o autor (+2 com origem); o agente nasce sabendo */
  await abrir('acervo'); await espera(200);
  await ev(() => { const i = document.querySelector('.acervo-busca input'); i.value = 'sessão expirando'; i.dispatchEvent(new Event('input', { bubbles: true })); }); await espera(400);
  ok('F', 'acervo cita a memória com nome e usos ("Aprendizado · Felipe · … · usado N×")', await ev(() => { const c = document.querySelector('.resultado[data-autor="felipe"] .mem-cita'); return !!c && /^Aprendizado · Felipe · .+ · usado \d+×$/.test(c.textContent.trim()); }), await ev(() => (document.querySelector('.resultado .mem-cita') || {}).textContent || 'sem citação'));
  const usoMemF = await ev(() => BC.memoria.usos('ap:ap3'));
  await page.click('.resultado[data-autor="felipe"] [data-acao="mem-usar"]'); await espera(300);
  ok('F', '"Usar no agente" soma +1 e leva a memória para o campo do agente', await ev((n) => BC.memoria.usos('ap:ap3') === n + 1 && /Felipe ensinou/.test(document.getElementById('term-entrada').value), usoMemF), await ev(() => BC.memoria.usos('ap:ap3') + ' · ' + document.getElementById('term-entrada').value.slice(0, 60)));
  await page.click('.resultado[data-autor="felipe"] [data-acao="mem-usar"]'); await espera(200);
  ok('F', 'usar de novo na mesma hora não infla o contador', await ev((n) => BC.memoria.usos('ap:ap3') === n + 1, usoMemF), await ev(() => BC.memoria.usos('ap:ap3')));
  ok('F', 'quem usou não vê o cartão de luz (é só do autor)', await ev(() => !document.querySelector('.mem-luz')), 'o cartão apareceu para quem usou');
  await ev(() => { document.getElementById('term-entrada').value = ''; BC.loja.verComo('felipe'); BC.estacao.render(); }); await espera(400);
  ok('F', 'o autor vê a luz: "Theus usou o seu aprendizado" com +2 e a origem', await ev(() => { const c = document.querySelector('.mem-luz'); const p = BC.memoria.meus('felipe'); return !!c && /Theus usou o seu aprendizado/.test(c.textContent) && /\+2/.test(c.textContent) && p.pontos.some((x) => x.pts === 2 && /Theus usou/.test(x.origem)); }), await ev(() => (document.querySelector('.mem-luz') || {}).textContent || 'sem cartão'));
  await ev(() => { BC.loja.verComo('carla'); BC.estacao.render(); }); await espera(300);
  ok('F', 'ninguém mais vê quem consultou o quê (nem cartão, nem Novidades, nem os pontos do outro)', await ev(() => !document.querySelector('.mem-luz') && !BC.loja.estado.eventos.some((e) => /usou o seu|usou a sua/.test(e.texto || '')) && BC.memoria.meus('felipe') === null), await ev(() => document.querySelectorAll('.mem-luz').length + ' cartão(ões)'));
  await ev(() => { BC.loja.verComo('theus'); BC.estacao.render(); }); await espera(200);
  const usoMemD = await ev(() => BC.memoria.usos('ap:ap7'));
  await terminal('como somo a planilha exportada do banco com datas dd/mm?'); await espera(500);
  ok('F', 'a presença consulta e cita quem ensinou (+1 para o Davi)', await ev((n) => { BC.estacao.terminal.mostrar(); const b = [...document.querySelectorAll('#e-painel .mem-consulta')].pop(); return !!b && /Aprendizado · Davi · .+ · usado \d+×/.test(b.textContent) && BC.memoria.usos('ap:ap7') === n + 1; }, usoMemD), await ev(() => { const b = [...document.querySelectorAll('#e-painel .mem-consulta')].pop(); return b ? b.textContent : 'sem bloco consulta'; }));
  ok('F', 'agente nasce sabendo ("Já li N coisas que a equipe aprendeu") e o resumo traz os 20 mais usados', await ev(() => { const r = BC.memoria.resumoParaAgente(); const ags = BC.loja.pessoa('theus').agentes || []; const linhas = ags.length ? (BC.estacao.terminal.linhas['theus|' + ags[0].id] || []) : []; return r.total >= 20 && r.itens.length <= 20 && r.itens.every((x, i, a) => !i || a[i - 1].usos >= x.usos) && /já li \d+ coisas que a equipe aprendeu/.test(r.instrucoes) && linhas.some((l) => /mem-nasce/.test(l) && /Já li \d+ coisas/.test(l)); }), await ev(() => BC.memoria.resumoParaAgente().texto));
  ok('F', 'consultar (conector coop) devolve tipo, título, autor, usos, trecho e id', await ev(() => { const x = BC.memoria.consultar('reembolso', { quem: 'ana', agente: 'Bia' })[0]; return !!x && x.tipo === 'aprendizado' && x.autor === 'Carla' && typeof x.usos === 'number' && !!x.trecho && !!x.titulo && x.id === 'ap:ap9' && x.contou === true; }), await ev(() => JSON.stringify(BC.memoria.consultar('reembolso', { contar: false })[0] || null).slice(0, 120)));

  /* G · a sala (agente ENDEREÇO, PLANO §1.2 "tudo tem endereço" e F2): Sala › bancada › peça no cabeçalho do objeto, clicável por parte;
     presença vira posição; luz dirigida quando alguém chega no mesmo objeto; Ctrl K "Onde estão" + "Ir até"; planta da sala; rastro "por onde passou".
     O simulador para durante o bloco (as posições são postas pelas mesmas ações que ele usa) e volta no fim. */
  {
    const simEnd = await ev(() => { const r = !!BC.loja.lider; if (BC.simulador) BC.simulador.parar(); return r; });
    const landEnd = await ev(() => { const a = BC.loja.estado.arquivos.find(a => /Clínicas\/landing\.html$/.test(a.caminho)); BC.loja.fazerComo('davi', 'fazendo', 'no chat'); BC.loja.fazerComo('davi', 'fazendo', 'editando landing.html'); BC.loja.fazerComo('bruno', 'fazendo', 'no terminal Bruno-bot'); BC.estacao.fecharTodas(); BC.explorador.abrirArquivo(a.id); return a.id; }); await espera(400);
    ok('G', 'endereço no cabeçalho do objeto: Clínicas em Campinas › Tela · Davi › landing.html', await ev(() => { const n = document.getElementById('e-endereco'); return !!n && !n.hidden && [...n.querySelectorAll('.end-parte')].map(b => b.textContent).join(' | ') === 'Clínicas em Campinas | Tela · Davi | landing.html'; }), await ev(() => (document.getElementById('e-endereco') || {}).innerText));
    ok('G', 'presença vira posição: quem está com o objeto aparece no cabeçalho (Davi, pelo "fazendo")', await ev(() => !!document.querySelector('#e-endereco [data-end-pessoa="davi"]')), 'sem o anel do Davi');
    await page.click('#e-endereco .end-p-sala'); await espera(300);
    ok('G', 'clicar na sala do endereço abre o projeto', await ev(() => BC.estacao.abaAtual().tipo === 'projeto' && BC.estacao.abaAtual().ref === 'clinicas'), await ev(() => BC.estacao.abaAtual().tipo));
    await ev((id) => BC.explorador.abrirArquivo(id), landEnd); await espera(900);
    ok('G', 'a posição de quem abriu vira estado da equipe (ação posicao)', await ev((id) => ((BC.loja.estado.posicoes || {})[BC.loja.eu] || {}).chave === 'arquivo:' + id, landEnd), await ev(() => JSON.stringify((BC.loja.estado.posicoes || {})[BC.loja.eu] || null)));
    await ev((id) => BC.loja.fazerComo('carla', 'vendoArquivo', id), landEnd); await espera(400);
    ok('G', 'luz dirigida: a Carla chega no mesmo objeto e o anel dela acende no cabeçalho ("Carla chegou")', await ev(() => { const a = document.querySelector('#e-endereco [data-end-pessoa="carla"]'); return !!a && +a.style.getPropertyValue('--luz') > 0.5 && /Carla chegou/.test(document.getElementById('e-endereco').innerText); }), await ev(() => document.getElementById('e-endereco').innerText));
    ok('G', 'presença ao lado do arquivo na árvore (anel da Carla na linha da landing)', await ev((id) => !!document.querySelector('#e-lateral .arv-arq[data-id="' + id + '"] [data-end-pessoa="carla"]'), landEnd), 'sem anel na árvore');
    await ev(() => { BC.estacao.abrirPaleta(); const i = document.getElementById('paleta-entrada'); i.value = 'onde está o bruno'; i.dispatchEvent(new Event('input', { bubbles: true })); }); await espera(250);
    ok('G', 'Ctrl K "onde está o Bruno": grupo Onde estão com a posição e "Ir até"', await ev(() => { const t = document.getElementById('paleta-lista').innerText; return /onde estão/i.test(t) && /Bruno/.test(t) && /terminal Bruno-bot/.test(t) && /Ir até/.test(t); }), await ev(() => document.getElementById('paleta-lista').innerText.slice(0, 120)));
    await page.keyboard.press('Enter'); await espera(400);
    ok('G', '"Ir até" abre o objeto onde o Bruno está (o terminal dele)', await ev(() => BC.estacao.abaAtual().tipo === 'terminais' && BC.estacao.ui.termPessoa === 'bruno' && /terminal de Bruno/.test(document.getElementById('e-endereco').innerText)), await ev(() => BC.estacao.abaAtual().tipo + ' · ' + document.getElementById('e-endereco').innerText));
    await ev(() => BC.estacao.fecharTodas()); await page.click('.e-atividades [data-acao="atividade"][data-id="equipe"]'); await espera(300);
    ok('G', 'lateral de Equipe mostra a planta da sala (pessoas por projeto: Davi e Carla em Clínicas)', await ev(() => { const p = document.querySelector('#e-lateral .end-planta'); if (!p) return false; const c = p.querySelector('.end-sala[data-end-sala="pj:clinicas"]'); return p.querySelectorAll('.end-sala').length >= 3 && !!c && !!c.querySelector('[data-end-pessoa="davi"]') && !!c.querySelector('[data-end-pessoa="carla"]'); }), await ev(() => ((document.querySelector('#e-lateral .end-planta') || {}).innerText || 'sem planta').slice(0, 160)));
    await page.click('#e-lateral .end-planta [data-acao="end-rastro"][data-id="davi"]'); await espera(300);
    ok('G', 'por onde passou: o rastro do Davi com hora e o que fez em cada parada', await ev(() => { const p = document.getElementById('end-pop'); return !!p && !p.hidden && p.querySelectorAll('.end-parada').length >= 3 && [...p.querySelectorAll('.end-parada time')].every(t => /^\d\d:\d\d$|^ontem$|^\d\d\/\d\d$/.test(t.textContent)); }), await ev(() => ((document.getElementById('end-pop') || {}).innerText || 'sem balão').slice(0, 160)));
    /* a parada 0 é a mais nova: a posição de agora (a landing) ou uma demanda que o Davi mexeu depois dela no próprio roteiro */
    const parada0 = await ev(() => { const x = BC.endereco.rastro('davi', 12)[0]; return x && x.alvo ? { tipo: x.alvo.tipo, ref: x.alvo.ref } : null; });
    await page.click('#end-pop [data-acao="end-parada"][data-i="0"]'); await espera(400);
    ok('G', 'clicar numa parada do rastro abre aquele objeto (a parada 0 do Davi)', await ev((p) => !!p && String(BC.estacao.abaAtual().ref) === String(p.ref) && document.getElementById('end-pop').hidden, parada0), await ev(() => BC.estacao.abaAtual().tipo + ' ' + BC.estacao.abaAtual().ref) + ' · parada 0: ' + JSON.stringify(parada0));
    ok('G', 'o rastro do agente segue cada passo (Dev do Davi passou por calculo.py)', await ev(() => BC.endereco.rastro('ag:davi-ag1').some(x => /calculo\.py/.test(x.end.texto) && x.oque)), await ev(() => JSON.stringify(BC.endereco.rastro('ag:davi-ag1').map(x => x.end.texto)).slice(0, 160)));
    await ev((sim) => { BC.loja.fazerComo('carla', 'vendoArquivo', null); if (sim && BC.simulador) BC.simulador.iniciar(); }, simEnd);
  }

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

  /* I · TV 2030 (agente TV): chão --s0, planta da sala, constelação, corpo do projeto, zona que gira por dado, chão vivo, abertura do b, sem som.
     Tudo por evento real da Estação (ações da loja), olhando a TV numa página própria. */
  {
    const tv2 = await page.context().newPage();
    const errosTv2 = []; tv2.on('pageerror', e => errosTv2.push(String(e).slice(0, 120)));
    await tv2.setViewportSize({ width: 1280, height: 720 }); await tv2.goto('http://coop.local/#tv'); await tv2.waitForTimeout(7500);
    const m0 = await tv2.evaluate(() => BC.tv.medidas());
    ok('I', 'TV 2030: chão --s0 liso, sem fundo que respira', await tv2.evaluate(() => { const v = document.getElementById('vista-tv'); return getComputedStyle(v).backgroundColor === 'rgb(6, 11, 22)' && getComputedStyle(v, '::before').content === 'none'; }), await tv2.evaluate(() => getComputedStyle(document.getElementById('vista-tv')).backgroundColor));
    ok('I', 'TV: o b se desenhou ao ligar (uma vez) e saiu da frente', m0.abertura.feita && !m0.abertura.naTela, JSON.stringify(m0.abertura));
    ok('I', 'TV: MAPA DA SALA · N PRESENÇAS com as salas e o endereço de cada pessoa', await tv2.evaluate(() => /MAPA DA SALA · \d+ PRESENÇAS?/.test(document.getElementById('vista-tv').innerText) && document.querySelectorAll('#tv-planta .tv-sala').length >= 3 && document.querySelectorAll('#tv-planta .tv-pos[data-pessoa] .tv-onde').length >= 3), JSON.stringify(m0.planta).slice(0, 120));
    ok('I', 'TV: constelação da sala com todas as pessoas', m0.constelacao.nos >= 11 && !!(await tv2.evaluate(() => document.querySelector('#tv-const-svg svg'))), JSON.stringify(m0.constelacao));
    ok('I', 'TV: números em JetBrains Mono tabular e fala humana em Cormorant ≥ 48 px (1080p)', await tv2.evaluate(() => { const h = getComputedStyle(document.getElementById('tv-hora')), f = document.querySelector('#tv-gira .tv-fala') || document.querySelector('#tv-gira .tv-gira-carta'); const fs = f ? getComputedStyle(f) : null; return /JetBrains/.test(h.fontFamily) && /tabular-nums/.test(h.fontVariantNumeric) && (!fs || !/tv-fala/.test(f.className) || (/Cormorant/.test(fs.fontFamily) && parseFloat(fs.fontSize) / (innerHeight / 100) >= 4.44)); }), 'fonte fora da régua');
    ok('I', 'TV: o chão vivo toca enquanto a sala trabalha', m0.chao.estado === 'toca' && m0.chao.trabalhando > 0, JSON.stringify(m0.chao));
    const pausadas = await ev(() => { const ids = BC.loja.estado.demandas.filter(d => d.estado === 'andamento' && d.para).map(d => [d.para, d.id]); ids.forEach(x => BC.loja.fazerComo(x[0], 'pausar', x[1], 'travado')); return ids; });
    await tv2.waitForTimeout(900);
    const m1 = await tv2.evaluate(() => BC.tv.medidas());
    ok('I', 'TV: o chão vivo PARA quando a sala para (cronômetros pausados na Estação)', m1.chao.estado === 'parado' && !m1.chao.tocando, JSON.stringify(m1.chao) + ' · ' + pausadas.length);
    await ev((ids) => ids.forEach(x => BC.loja.fazerComo(x[0], 'retomar', x[1])), pausadas); await tv2.waitForTimeout(900);
    ok('I', 'TV: o chão volta a tocar quando retomam', (await tv2.evaluate(() => BC.tv.medidas().chao.estado)) === 'toca', await tv2.evaluate(() => JSON.stringify(BC.tv.medidas().chao)));
    const t0 = Date.now();
    await ev(() => BC.loja.fazer('aviso', 'aviso do roteiro na TV 2030')); await tv2.waitForTimeout(1200);
    ok('I', 'TV: a zona que gira troca porque o dado mudou (aviso novo aparece)', await tv2.evaluate((t0) => BC.tv.medidas().gira.historico.some(h => h.id === 'avisos' && h.ts >= t0 - 50) && /aviso do roteiro na TV 2030/.test(document.getElementById('tv-gira').innerText), t0), await tv2.evaluate(() => JSON.stringify(BC.tv.medidas().gira).slice(0, 120)));
    await ev(() => BC.loja.fazer('ok', 'd4')); await tv2.waitForTimeout(900);
    ok('I', 'TV: o OK de quem pediu vira carimbo com nome e hora na planta', await tv2.evaluate(() => Array.from(document.querySelectorAll('#tv-planta .tv-carimbo')).some(c => /OK · Theus · \d\d:\d\d/.test(c.textContent))), await tv2.evaluate(() => (document.querySelector('#tv-planta') || {}).innerText));
    const antesCorpo = await tv2.evaluate(() => BC.visual3d.corpoDoEstado().pecas.filter(p => p.estado === 'corpo').length);
    await ev(() => BC.loja.fazer('corpoPublicar', { projeto: 'clinicas', pecas: [{ id: 'roteiro-gaveta', tipo: 'gaveta', nome: 'Gaveta do roteiro' }] })); await tv2.waitForTimeout(900);
    ok('I', 'TV: publicar a Máquina faz a peça ganhar corpo na parede', await tv2.evaluate((n) => { const c = BC.visual3d.corpoDoEstado(); return c.pecas.some(p => p.id === 'roteiro-gaveta' && p.estado === 'corpo') && c.pecas.filter(p => p.estado === 'corpo').length > n && BC.loja.estado.eventos.slice(0, 8).some(e => e.tipo === 'corpo'); }, antesCorpo), antesCorpo);
    ok('I', 'TV: nenhum som, nunca', await tv2.evaluate(() => { const o = BC.organismo; return !o || (o.naTV() && Object.keys(o.contagem().somTocado || {}).length === 0); }), 'tocou som');
    await tv2.close();
    ok('I', 'TV 2030 sem erros de página', errosTv2.filter(e => !/randomUUID/.test(e)).length === 0, errosTv2.join(' | '));
  }

  ok('Z', 'nenhum erro de JavaScript na Estação durante o roteiro', erros.length === 0, erros.join(' | '));
  const total = R.length, passou = R.filter(r => r.ok).length;
  return { resumo: passou + '/' + total + ' passaram', falhas: R.filter(r => !r.ok), tudo: R.map(r => (r.ok ? '✓ ' : '✗ ') + r.secao + ' · ' + r.nome) };
}
