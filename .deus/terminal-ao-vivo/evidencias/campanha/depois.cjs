/* DEPOIS: a F3 funcionando por evento real, no Electron escondido (sem Chrome).
   Parte 1 · protótipo puro (sem organismo): pedido digitado no terminal, cliques, edição, OK, rito.
   Parte 2 · app (com organismo): BC.campanha.gerar como o conector coop vai chamar; conta pulsos, faíscas e sons;
   repouso sem laço; movimento reduzido. Uso: node depois.cjs [proto|app|tudo] */
'use strict';
const path = require('path');
const fs = require('fs');
const { estacao, prototipo, EVID, esperar } = require('./abrir.cjs');

const R = { quando: new Date().toISOString(), checagens: [] };
function ok(parte, nome, passou, achou) { R.checagens.push({ parte, nome, ok: !!passou, achou: passou ? undefined : String(JSON.stringify(achou)).slice(0, 300) }); }
const foto = (p, nome) => p.screenshot({ path: path.join(EVID, nome) });

async function vigiarEfeitos(p) {
  await p.evaluate(() => {
    window.__cp = { pulsos: 0, chegou: 0, nasce: 0, t0: performance.now() }; window.__cpChegou = new Set();
    new MutationObserver((ms) => ms.forEach((m) => {
      m.addedNodes.forEach((n) => { if (n.nodeType === 1 && n.classList.contains('cp-pulso')) window.__cp.pulsos++; if (n.nodeType === 1 && n.classList.contains('nasce')) window.__cp.nasce++; });
      if (m.type === 'attributes' && m.target.classList && m.target.classList.contains('cp-chegou')) { window.__cpChegou.add(m.target.dataset.peca); window.__cp.chegou = window.__cpChegou.size; }
    })).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  });
}
function hud() {
  const c = document.querySelector('.cp-palco:not([hidden]) .cp-peca[data-estado="gerando"]');
  if (!c) return null;
  const s = getComputedStyle(c), sc = getComputedStyle(c.querySelector('.cp-scan'));
  const alfas = (sc.backgroundImage.match(/rgba?\([^)]+\)/g) || []).map((x) => { const v = x.match(/[\d.]+/g).map(Number); return v.length > 3 ? v[3] : 1; });
  return { peca: c.dataset.peca, vidro: s.backdropFilter || s.webkitBackdropFilter, borda: s.borderTopColor, scanOpacidade: +sc.opacity, scanAlfaMax: Math.max(...alfas) };
}

async function parteProto() {
  const s = await prototipo({ porta: 5054, udp: 41554 });
  const p = s.page;
  try {
    await vigiarEfeitos(p);
    /* 1 · o pedido, digitado no terminal simulado (teclado de verdade) */
    await p.evaluate(() => BC.estacao.fecharTodas());
    await p.click('#term-entrada');
    await p.keyboard.type('gera a campanha Clínica Vida de 40 clientes para a Carla até 30/09', { delay: 4 });
    const t0 = Date.now();
    await p.keyboard.press('Enter');
    await esperar(350);
    const aberto = await p.evaluate(() => ({ tipo: BC.estacao.abaAtual().tipo, palco: !!document.querySelector('.cp-palco:not([hidden])'), conteudoEscondido: getComputedStyle(document.getElementById('e-conteudo')).display === 'none',
      cartoes: document.querySelectorAll('.cp-palco:not([hidden]) .cp-peca').length, donos: [...document.querySelectorAll('.cp-palco:not([hidden]) .cp-peca .cp-dono > span:last-child')].map((x) => x.textContent), itens: document.querySelectorAll('.cp-palco:not([hidden]) .cp-check li').length }));
    ok('proto', 'o pedido no terminal abre o palco da campanha no meio', aberto.tipo === 'campanha' && aberto.palco && aberto.conteudoEscondido, aberto);
    ok('proto', '6 peças (Tela, 3 anúncios, WhatsApp, calendário), cada uma com dono', aberto.cartoes === 6 && aberto.donos.length === 6 && aberto.donos.every(Boolean), aberto);
    const c0 = await p.evaluate(() => { const c = BC.campanha.lista()[0]; return { nome: c.nome, para: c.para, prazo: c.prazo, meta: c.meta, tipos: c.pecas.map((x) => x.tipo), donos: c.pecas.map((x) => x.dono) }; });
    ok('proto', 'o intérprete leu nome, meta, pessoa e prazo', c0.nome === 'Clínica Vida' && c0.para === 'carla' && /-09-30$/.test(c0.prazo) && c0.meta === '40 clientes', c0);
    R.proto = { aberto, campanha: c0 };
    /* 2 · durante: o plano aparece item a item, os anéis andam, a peça viva ganha o HUD */
    await esperar(2300);
    R.proto.hud = await p.evaluate(hud);
    R.proto.meio = await p.evaluate(() => BC.campanha.lista()[0].pecas.map((x) => x.id + ':' + x.estado + ':' + x.progresso));
    await foto(p, 'depois-01-prototipo-gerando.png');
    const h = R.proto.hud;
    ok('proto', 'peça viva com HUD: vidro, borda 1 px rgba(63,227,255,.22), scanlines ≤ 5 %', h && /blur/.test(h.vidro) && h.borda === 'rgba(63, 227, 255, 0.22)' && h.scanOpacidade === 1 && h.scanAlfaMax <= 0.05, h);
    ok('proto', 'anéis de progresso andando ao mesmo tempo', R.proto.meio.filter((x) => /gerando|pronta/.test(x)).length >= 4, R.proto.meio);
    /* 3 · pronta: o rito */
    await p.waitForFunction(() => BC.campanha.lista()[0].estado === 'pronta', null, { timeout: 15000 });
    R.proto.msAtePronta = Date.now() - t0;
    await esperar(1300);
    const fim = await p.evaluate(() => ({ efeitos: Object.assign({}, window.__cp, { nasce: (() => { const h = document.querySelector('.cp-palco:not([hidden]) .cp-tela-host'); return h && h.shadowRoot ? h.shadowRoot.querySelectorAll('.pagina > .nasce').length : -1; })() }), rito: (document.querySelector('.cp-palco:not([hidden]) .cp-rito') || {}).innerText, itensFeitos: document.querySelectorAll('.cp-palco:not([hidden]) .cp-check li.feito').length,
      arquivos: BC.loja.estado.arquivos.filter((a) => a.caminho.indexOf('equipe/Campanhas/Clínica Vida/') === 0).map((a) => a.caminho.split('/').pop() + ':' + a.tipo),
      terminal: [...document.querySelectorAll('.term-saida .term-linha')].map((l) => l.textContent).filter((t) => /Campanha/.test(t)).slice(-2),
      agente: BC.loja.pessoa('theus').agentes[0].estado, eventos: BC.loja.estado.eventos.filter((e) => /^campanha-/.test(e.tipo)).map((e) => e.tipo + (e.tv ? ':tv' : '')) }));
    R.proto.fim = fim;
    await foto(p, 'depois-02-prototipo-pronta.png');
    ok('proto', 'rito "Campanha pronta" e os 6 itens do plano com ✓', /Campanha pronta/.test(fim.rito) && fim.itensFeitos === 6, fim);
    ok('proto', 'sem o organismo: 6 pulsos em CSS, 6 peças acenderam ao chegar, a landing nasceu em 5 seções', fim.efeitos.pulsos === 6 && fim.efeitos.chegou === 6 && fim.efeitos.nasce >= 5, fim.efeitos);
    ok('proto', '6 arquivos no endereço equipe/Campanhas/Clínica Vida', fim.arquivos.length === 6 && fim.arquivos.includes('landing.html:html') && fim.arquivos.includes('anuncio-3.svg:imagem') && fim.arquivos.includes('calendario.csv:csv'), fim.arquivos);
    ok('proto', 'o agente volta a "parado" e avisa no terminal', fim.agente === 'parado' && fim.terminal.some((t) => /pronta: 6 peças/.test(t)), fim);
    ok('proto', 'a TV fica sabendo (eventos com tv)', fim.eventos.includes('campanha-gerando:tv') && fim.eventos.includes('campanha-pronta:tv'), fim.eventos);
    /* 4 · a Tela abre no alternador Site|Código */
    await p.click('.cp-palco:not([hidden]) .cp-peca[data-peca="tela"] .cp-abrir');
    await esperar(600);
    const tela = await p.evaluate(() => ({ tipo: BC.estacao.abaAtual().tipo, iframe: !!document.querySelector('.ed-site-iframe'), alternar: [...document.querySelectorAll('.ed-alternar button')].map((b) => b.textContent) }));
    await p.click('[data-acao="ed-vis"][data-v="codigo"]');
    await esperar(300);
    tela.codigo = await p.evaluate(() => /Clínica Vida: sua consulta marcada em 1 minuto/.test(document.getElementById('e-conteudo').innerText));
    await foto(p, 'depois-03-tela-no-codigo.png');
    await p.click('[data-acao="ed-vis"][data-v="site"]');
    ok('proto', 'a Tela abre como arquivo no Site|Código', tela.tipo === 'arquivo' && tela.iframe && tela.alternar.join('|').indexOf('Site|Código') === 0 && tela.codigo, tela);
    /* 5 · o anúncio abre como Imagem|Texto; o texto muda a arte ao vivo; salvar grava o .svg */
    await p.click('#e-abas .e-aba[data-id^="campanha:"]');
    await esperar(300);
    await p.click('.cp-palco:not([hidden]) .cp-peca[data-peca="anuncio-1"] .cp-previa');
    await esperar(400);
    const an = await p.evaluate(() => ({ tipo: BC.estacao.abaAtual().tipo + ':' + BC.estacao.abaAtual().peca, arte: !!document.querySelector('.cp-ed-arte svg'), modos: [...document.querySelectorAll('.cp-alternar button')].map((b) => b.textContent) }));
    an.endereco = await p.evaluate(() => { const b = document.querySelector('.e-endereco'); return b ? b.innerText.replace(/\s+/g, ' ').slice(0, 120) : null; });
    an.hook = await p.evaluate(() => BC.vistas.campanha.endereco(BC.estacao.abaAtual()).texto);
    await foto(p, 'depois-04-anuncio-imagem.png');
    await p.click('.cp-alternar [data-modo="texto"]');
    await esperar(250);
    await p.fill('#cpf-titulo', 'Consulta sem fila, marcada no celular.');
    an.aoVivo = await p.evaluate(() => /Consulta sem fila/.test(document.querySelector('[data-cp-arte]').innerHTML));
    an.antesDeSalvar = await p.evaluate(() => BC.campanha.lista()[0].pecas[1].estado && BC.loja.estado.campanhas.find((c) => c.tipo === 'gerada').pecas[1].conteudo.titulo);
    await foto(p, 'depois-05-anuncio-texto.png');
    await p.click('form[data-form="cp-peca"] button[type="submit"]');
    await esperar(300);
    an.depois = await p.evaluate(() => { const c = BC.loja.estado.campanhas.find((x) => x.tipo === 'gerada'), a = BC.loja.arquivo(c.pasta + '/anuncio-1.svg'); return { titulo: c.pecas[1].conteudo.titulo, svg: decodeURIComponent(a.conteudo).indexOf('Consulta sem fila') !== -1, versoes: a.versoes.length, modo: BC.estacao.abaAtual().modo }; });
    ok('proto', 'o anúncio abre como Imagem|Texto e a arte acompanha o que se digita', an.tipo === 'campanha:anuncio-1' && an.arte && an.modos.join('|') === 'Imagem|Texto' && an.aoVivo && an.antesDeSalvar !== 'Consulta sem fila, marcada no celular.', an);
    ok('proto', 'salvar o anúncio grava a arte (anuncio-1.svg ganha versão)', an.depois.titulo === 'Consulta sem fila, marcada no celular.' && an.depois.svg && an.depois.versoes === 1, an.depois);
    /* 6 · o OK de quem pediu fecha o Selo com nome e hora; editar depois rompe */
    await p.click('.cp-ed-cab .cp-ok');
    await esperar(300);
    const selo = { depoisDoOk: await p.evaluate(() => document.querySelector('.cp-ed-cab .cp-selo').textContent) };
    await p.click('.cp-alternar [data-modo="texto"]');
    await esperar(200);
    await p.fill('#cpf-chamada', 'Marque agora');
    await p.click('form[data-form="cp-peca"] button[type="submit"]');
    await esperar(300);
    selo.depoisDaEdicao = await p.evaluate(() => document.querySelector('.cp-ed-cab .cp-selo').textContent);
    selo.estado = await p.evaluate(() => { const x = BC.loja.estado.campanhas.find((c) => c.tipo === 'gerada').pecas[1]; return { ok: x.ok, rompido: !!x.rompido }; });
    ok('proto', 'OK fecha o Selo: "OK · Theus · hh:mm"; editar depois rompe: "Rompido por Theus"', /^OK · Theus · \d\d:\d\d$/.test(selo.depoisDoOk) && /^Rompido por Theus · \d\d:\d\d$/.test(selo.depoisDaEdicao) && selo.estado.ok === null && selo.estado.rompido, selo);
    /* 7 · o WhatsApp abre como mensagem sugerida (pela lateral) */
    await p.click('.cp-lat-peca[data-peca="whatsapp"]');
    await esperar(400);
    const wa = await p.evaluate(() => ({ tipo: BC.estacao.abaAtual().tipo + ':' + BC.estacao.abaAtual().peca, balao: !!document.querySelector('.cp-ed-wa .cp-wa-balao'), variavel: !!document.querySelector('.cp-ed-wa .cp-var') }));
    await p.fill('#cpf-texto', 'Oi, {{nome}}! Aqui é Carla, da Clínica Vida.\n\nTemos horário amanhã às 10h. Quer?\n\nResponda *SIM*.');
    await p.click('form[data-form="cp-peca"] button[type="submit"]');
    await esperar(300);
    wa.arquivo = await p.evaluate(() => BC.loja.arquivo(BC.loja.estado.campanhas.find((c) => c.tipo === 'gerada').pasta + '/whatsapp.txt').conteudo);
    wa.baloes = await p.evaluate(() => document.querySelectorAll('.cp-ed-wa .cp-wa-balao p').length);
    await foto(p, 'depois-06-whatsapp.png');
    ok('proto', 'o WhatsApp abre como mensagem sugerida e salvar grava whatsapp.txt', wa.tipo === 'campanha:whatsapp' && wa.balao && wa.variavel && /amanhã às 10h/.test(wa.arquivo) && wa.baloes === 3, wa);
    /* 8 · o calendário abre como lista de datas; mudar uma data grava o .csv */
    await p.click('#e-abas .e-aba[data-id^="campanha:"]');
    await esperar(300);
    await p.click('.cp-palco:not([hidden]) .cp-peca[data-peca="calendario"] .cp-abrir');
    await esperar(400);
    const cal = await p.evaluate(() => ({ tipo: BC.estacao.abaAtual().tipo + ':' + BC.estacao.abaAtual().peca, datas: document.querySelectorAll('.cp-datas input[type="date"]').length, primeira: document.getElementById('cpf-data-0').value, ultima: document.getElementById('cpf-data-6').value }));
    await p.fill('#cpf-oque-1', 'Anúncio 1 · feed (teste)');
    await p.click('form[data-form="cp-peca"] button[type="submit"]');
    await esperar(300);
    cal.csv = await p.evaluate(() => BC.loja.arquivo(BC.loja.estado.campanhas.find((c) => c.tipo === 'gerada').pasta + '/calendario.csv').conteudo);
    await foto(p, 'depois-07-calendario-lista.png');
    await p.click('.cp-alternar [data-modo="mes"]');
    await esperar(250);
    cal.mes = await p.evaluate(() => document.querySelectorAll('.cp-ed-mes .cp-cal-dia i b').length);
    await foto(p, 'depois-07b-calendario-mes.png');
    ok('proto', 'o calendário abre como lista de 7 datas até o prazo; salvar grava calendario.csv', cal.tipo === 'campanha:calendario' && cal.datas === 7 && /-09-30$/.test(cal.ultima) && /Anúncio 1 · feed \(teste\)/.test(cal.csv) && cal.mes === 7, cal);
    /* 9 · OK nas prontas: "Campanha no ar" */
    await p.click('#e-abas .e-aba[data-id^="campanha:"]');
    await esperar(300);
    const faltam = await p.evaluate(() => document.querySelector('.cp-palco:not([hidden]) .cp-ok-todas').textContent);
    await p.click('.cp-palco:not([hidden]) .cp-ok-todas');
    await esperar(1100);
    const noAr = await p.evaluate(() => ({ estado: BC.campanha.lista()[0].estado, rito: document.querySelector('.cp-palco:not([hidden]) .cp-rito').innerText, selos: [...document.querySelectorAll('.cp-palco:not([hidden]) .cp-selo.selado')].length, ev: BC.loja.estado.eventos.find((e) => e.tipo === 'campanha-no-ar') }));
    await foto(p, 'depois-08-prototipo-no-ar.png');
    ok('proto', '"OK nas N prontas" põe a campanha no ar, com 6 Selos e aviso para a TV', faltam && noAr.estado === 'no-ar' && /Campanha no ar/.test(noAr.rito) && noAr.selos === 6 && noAr.ev && noAr.ev.tv, { faltam, noAr });
    /* 10 · quem não pediu não dá OK */
    const outro = await p.evaluate(() => { BC.loja.verComo('carla'); const r = BC.loja.fazer('campanhaOk', BC.campanha.lista()[0].id, '*'); BC.loja.verComo('theus'); return r; });
    ok('proto', 'só quem pediu (ou a gestão) dá o OK', outro === false, outro);
    ok('proto', 'zero erros de página', s.erros.length === 0, s.erros);
    R.proto.erros = s.erros;
  } catch (e) { R.proto = Object.assign(R.proto || {}, { falha: String(e && e.stack || e).slice(0, 1500) }); ok('proto', 'sem exceção no teste', false, R.proto.falha); }
  await s.fechar();
}

async function parteApp() {
  const s = await estacao({ porta: 5056, udp: 41556 });
  const p = s.page;
  R.app = {};
  try {
    R.app.organismo = await p.evaluate(() => BC.organismo && BC.organismo.versao);
    await p.evaluate(() => { BC.organismo.zerar(); BC.estacao.fecharTodas(); });
    /* o conector coop do app chama assim */
    const g = await p.evaluate(() => BC.campanha.gerar({ nome: 'Clínica Vida', meta: 40, para: 'Carla', prazo: '2026-09-30', por: 'theus' }));
    R.app.gerar = { id: g.id, estado: g.estado, endereco: g.endereco, pecas: g.pecas.map((x) => x.id + '·' + x.dono) };
    ok('app', 'BC.campanha.gerar devolve id, endereço e 6 peças com dono', g.id && g.endereco === 'equipe/Campanhas/Clínica Vida' && g.pecas.length === 6 && g.pecas.every((x) => x.dono), R.app.gerar);
    await esperar(2500);
    R.app.hud = await p.evaluate(hud);
    await foto(p, 'depois-10-app-gerando.png');
    await p.waitForFunction((id) => BC.campanha.estado(id).estado === 'pronta', g.id, { timeout: 15000 });
    await esperar(1500);
    await foto(p, 'depois-11-app-pronta.png');
    R.app.pronta = await p.evaluate(() => ({ cont: BC.organismo.contagem(), pulsos: BC.organismo.registro().filter((x) => x.tipo === 'pulso').map((x) => x.ok === false ? x.motivo : 'ok'), rito: document.querySelector('.cp-palco:not([hidden]) .cp-rito').innerText, pres: (document.querySelector('.cp-palco:not([hidden]) .bc-presenca') || {}).dataset }));
    const cp = R.app.pronta.cont;
    ok('app', 'com o organismo: 6 pulsos, faíscas, o palco respira e soa tique ×6 + duas', cp.pulso >= 6 && cp.faiscas >= 6 && cp.respirar >= 1 && (cp.somTocado.tique || 0) >= 6 && (cp.somTocado.duas || 0) >= 1, cp);
    ok('app', 'a presença do organismo no plano espera o OK', R.app.pronta.pres && R.app.pronta.pres.estado === 'espera', R.app.pronta.pres);
    await p.click('.cp-palco:not([hidden]) .cp-ok-todas');
    await esperar(1400);
    await foto(p, 'depois-12-app-no-ar.png');
    R.app.noAr = await p.evaluate((id) => ({ estado: BC.campanha.estado(id).estado, tres: BC.organismo.contagem().somTocado.tres || 0, rito: document.querySelector('.cp-palco:not([hidden]) .cp-rito').innerText }), g.id);
    ok('app', 'OK de quem pediu em todas: "Campanha no ar" e soa tres', R.app.noAr.estado === 'no-ar' && R.app.noAr.tres >= 1 && /Campanha no ar/.test(R.app.noAr.rito), R.app.noAr);
    /* repouso: nada em laço; a luz do evento esfria sozinha (meia-vida) até parar de vez */
    const tRep = Date.now();
    const vivas = () => p.evaluate(() => { const pal = document.querySelector('.cp-palco:not([hidden])'); return document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.target && pal.contains(a.effect.target)).map((a) => ({ tipo: a.constructor.name, alvo: String(a.effect.target.getAttribute('class') || a.effect.target.tagName).split(' ')[0], laco: a.effect.getTiming().iterations === Infinity })); });
    R.app.repouso = { aos2s: null, lacos: 0 };
    await esperar(2000);
    R.app.repouso.aos2s = await vivas();
    R.app.repouso.lacos = R.app.repouso.aos2s.filter((x) => x.laco).length;
    await p.waitForFunction(() => { const pal = document.querySelector('.cp-palco:not([hidden])'); return document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.target && pal.contains(a.effect.target)).length === 0; }, null, { timeout: 60000, polling: 500 }).catch(() => null);
    R.app.repouso.esfriouEmMs = Date.now() - tRep;
    R.app.repouso.depois = await vivas();
    ok('app', 'em repouso: nenhum laço no palco, e a luz esfria sozinha até zerar', R.app.repouso.lacos === 0 && R.app.repouso.depois.length === 0, R.app.repouso);
    /* movimento reduzido: cor e texto, nada corre */
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await p.evaluate(() => BC.organismo.zerar());
    const g2 = await p.evaluate(() => BC.campanha.gerar({ nome: 'Loja Aurora Black Friday', para: 'ana', prazo: '2026-10-20' }));
    await esperar(2500);
    R.app.reduzido = await p.evaluate(() => { const pal = document.querySelector('.cp-palco:not([hidden])'); return { animando: document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.target && pal.contains(a.effect.target)).length, itensVisiveis: [...pal.querySelectorAll('.cp-check li')].filter((li) => getComputedStyle(li).opacity === '1').length }; });
    await p.waitForFunction((id) => BC.campanha.estado(id).estado === 'pronta', g2.id, { timeout: 15000 });
    await esperar(900);
    R.app.reduzido.pulsos = await p.evaluate(() => BC.organismo.registro().filter((x) => x.tipo === 'pulso').map((x) => x.ok === false ? x.motivo : 'ok'));
    R.app.reduzido.tom = await p.evaluate((id) => BC.loja.estado.campanhas.find((c) => c.id === id).pecas[0].conteudo.h1, g2.id);
    await foto(p, 'depois-13-app-movimento-reduzido.png');
    ok('app', 'prefers-reduced-motion: nada anima no palco, plano inteiro à vista, pulsos viram cor', R.app.reduzido.animando === 0 && R.app.reduzido.itensVisiveis === 6 && R.app.reduzido.pulsos.length >= 6 && R.app.reduzido.pulsos.every((x) => x === 'sem-movimento'), R.app.reduzido);
    await p.emulateMedia({ reducedMotion: 'no-preference' });
    ok('app', 'zero erros de página', s.erros.length === 0, s.erros);
    R.app.erros = s.erros;
  } catch (e) { R.app.falha = String(e && e.stack || e).slice(0, 1500); ok('app', 'sem exceção no teste', false, R.app.falha); }
  await s.fechar();
}

(async () => {
  const qual = process.argv[2] || 'tudo';
  if (qual === 'proto' || qual === 'tudo') await parteProto();
  if (qual === 'app' || qual === 'tudo') await parteApp();
  const n = R.checagens.length, bons = R.checagens.filter((c) => c.ok).length;
  R.resumo = bons + '/' + n + ' passaram';
  fs.writeFileSync(path.join(EVID, 'depois-' + qual + '.json'), JSON.stringify(R, null, 2));
  console.log(R.resumo);
  R.checagens.forEach((c) => console.log((c.ok ? '✓ ' : '✗ ') + c.parte + ' · ' + c.nome + (c.ok ? '' : ' → ' + c.achou)));
})();
