/* babel-coop · mede o "design 2030 vivo nas pessoas" no app limpo (Electron escondido, raiz temporária nova)
   F1.1 fotos brilhando (barra, parede, presença) e a luz nas laterais no evento · F5.1 cartão da parede com glow da pessoa
   · F5.2 selo "X está no seu terminal" com pulso · F6.2 pulso sem alvo · F7.1 temas na paleta (Ctrl+K "tema").
   Rodar: cd app && node testes/e2e/brilho-medir.js [saida.json]   ·   Portas: HTTP 5491, UDP 41991 (AUDITAR_PORTA/AUDITAR_DESCOBERTA).
   Prints em .deus/terminal-ao-vivo/evidencias/w7/brilho/ (ou BRILHO_PRINTS). */
'use strict';
const fs = require('fs');
const path = require('path');
const { abrirEstacao, raizTemporaria } = require('./estacao');

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const PRINTS = process.env.BRILHO_PRINTS || path.join(__dirname, '..', '..', '..', '.deus', 'terminal-ao-vivo', 'evidencias', 'w7', 'brilho');

/* estilo de uma foto: sombra, animação, borda e as luzes das laterais (::before/::after) */
const medirAvatar = (a) => {
  if (!a) return null;
  const s = getComputedStyle(a), b = getComputedStyle(a, '::before'), d = getComputedStyle(a, '::after');
  return { cls: a.className, w: a.offsetWidth, texto: a.textContent.trim(), sh: s.boxShadow, anim: s.animationName, borda: s.borderColor,
    lateralAnim: b.animationName + ' / ' + d.animationName, lateralOpac: b.opacity + ' / ' + d.opacity, pai: (a.parentElement || {}).className };
};

(async () => {
  fs.mkdirSync(PRINTS, { recursive: true });
  const raiz = raizTemporaria('brilho');
  const T = await abrirEstacao({ nome: 'brilho', raiz, porta: Number(process.env.AUDITAR_PORTA || 5491), descoberta: Number(process.env.AUDITAR_DESCOBERTA || 41991) });
  const { page } = T;
  const erros = [];
  page.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
  page.on('response', (x) => { if (x.status() >= 500) erros.push('http ' + x.status() + ' ' + x.url()); });
  const r = {};
  const print = (nome) => page.screenshot({ path: path.join(PRINTS, nome) }).catch((e) => erros.push('print ' + nome + ': ' + e.message));
  try {
    await page.waitForLoadState('domcontentloaded');
    const f = await T.api('/api/fundar', { nome: 'Theus' });
    r.fundar = { id: f.id, papel: f.papel };
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.BC && BC.terminalReal && BC.terminalReal.pronto() && BC.terminalReal.sessoes().some((s) => s.aberta) && BC.estacao && BC.estacao.ui, null, { timeout: 30000 });
    await page.evaluate((fn) => { window.__medirAvatar = new Function('return ' + fn)(); }, medirAvatar.toString());
    await esperar(1500);

    /* F1.1: a foto 22 px no pé da barra */
    r.barra = await page.evaluate(() => __medirAvatar(document.querySelector('.ativ-perfil .avatar')));
    await page.evaluate(() => BC.estacao.abrir('dia'));
    await esperar(400);

    /* F6.2 + F1.1 evento: comando de 2,5 s no meu terminal com a parede FORA da tela (Meu dia aberto) */
    await page.evaluate(() => { BC.terminalReal.abrirAba('assistente'); BC.terminalReal.face('presenca'); BC.organismo.zerar(); window.__av0 = BC.util.avatarContagem ? BC.util.avatarContagem() : null; });
    await page.evaluate(() => BC.terminalReal.digitar('assistente', 'sleep 2.5\r'));
    await page.waitForFunction(() => BC.terminalReal.sessoes().some((s) => s.id === 'assistente' && s.estado === 'rodando'), null, { timeout: 10000 });
    await esperar(120);
    r.eventoRodando = await page.evaluate(() => ({ barra: __medirAvatar(document.querySelector('.ativ-perfil .avatar')), contagem: BC.util.avatarContagem ? BC.util.avatarContagem() : 'sem avatarContagem' }));
    await print('01-barra-evento-rodando.png');
    await page.waitForFunction(() => BC.terminalReal.sessoes().some((s) => s.id === 'assistente' && s.estado === 'terminou'), null, { timeout: 15000 });
    await esperar(1500);
    r.organismoFim = await page.evaluate(() => ({ semAlvo: BC.organismo.registro().filter((x) => x.motivo === 'sem-alvo'), pulsos: BC.organismo.registro().filter((x) => x.tipo === 'pulso'), contagem: BC.organismo.contagem(), avatar: BC.util.avatarContagem ? BC.util.avatarContagem() : null }));

    /* F5.1: a parede (Terminais) com o cartão do meu terminal */
    await page.evaluate(() => BC.estacao.abrir('terminais'));
    await page.waitForFunction(() => document.querySelector('.pr-cartao .pr-av .avatar'), null, { timeout: 10000 }).catch(() => {});
    await esperar(800);
    r.parede = await page.evaluate(() => {
      const c = document.querySelector('.pr-cartao');
      if (!c) return 'sem cartão';
      const s = getComputedStyle(c);
      return { avatar: __medirAvatar(c.querySelector('.pr-av .avatar')), cartaoSombra: s.boxShadow, bordaTopo: s.borderTopColor, bordaEsq: s.borderLeftColor, vivo: c.dataset.vivo };
    });
    /* o mesmo comando com a parede NA tela: o pulso corre do anel ao centro (sem "sem-alvo") */
    await page.evaluate(() => BC.organismo.zerar());
    await page.evaluate(() => BC.terminalReal.digitar('assistente', 'sleep 2.2\r'));
    await page.waitForFunction(() => BC.terminalReal.sessoes().some((s) => s.id === 'assistente' && s.estado === 'rodando'), null, { timeout: 10000 });
    await esperar(150);
    r.paredeEvento = await page.evaluate(() => __medirAvatar(document.querySelector('.pr-cartao .pr-av .avatar')));
    await print('02-parede-evento-rodando.png');
    await page.waitForFunction(() => BC.terminalReal.sessoes().some((s) => s.id === 'assistente' && s.estado === 'terminou'), null, { timeout: 15000 });
    await esperar(1500);
    r.organismoParede = await page.evaluate(() => ({ semAlvo: BC.organismo.registro().filter((x) => x.motivo === 'sem-alvo'), pulsos: BC.organismo.registro().filter((x) => x.tipo === 'pulso') }));
    await print('03-parede-repouso.png');

    /* F1.1 online: a Rita aparece na rede (pares simulados) → a luz pisca nas laterais da foto dela */
    await page.evaluate(() => { BC.real.simular({ tipo: 'pares', lista: [{ id: 'rita', nome: 'Rita', ligado: true }] }); });
    await esperar(300);
    r.online = await page.evaluate(() => ({ contagem: BC.util.avatarContagem ? BC.util.avatarContagem() : null, rita: (BC.loja.pessoa('rita') || {}).status }));

    /* F5.2: alguém no meu terminal (controles simulados, como o painel.test) */
    const eu = await page.evaluate(() => BC.terminalReal.eu());
    await page.evaluate((dono) => BC.real.simular({ tipo: 'controles', dono, lista: [{ id: 'ct-brilho', dono, quem: 'rita', sessao: 'assistente', estado: 'ativo', direto: true, ts: Date.now() }] }), eu);
    await esperar(700);
    r.selo = await page.evaluate(() => {
      const l = document.querySelector('.tr-sessao:not([hidden]) .tr-selo-linha'), anel = l && l.querySelector('.tr-selo-anel');
      const st = document.querySelector('#e-status .st-controle');
      const pul = st && st.querySelector('.pr-selo-pulso');
      const card = document.querySelector('.pr-cartao .pr-selo');
      const ci = card && card.querySelector('i');
      return {
        painel: l ? { texto: l.textContent.trim(), fundo: getComputedStyle(l).backgroundImage.slice(0, 120), anelSombra: getComputedStyle(anel).boxShadow, anelPulso: getComputedStyle(anel, '::after').animationName, luz: l.style.getPropertyValue('--luz') } : 'sem selo no painel',
        rodape: st ? { texto: st.textContent.trim(), classe: st.className, pulso: pul ? getComputedStyle(pul).animationName + ' / ' + getComputedStyle(pul, '::after').animationName : 'sem pulso', sombra: pul ? getComputedStyle(pul).boxShadow : '' } : 'sem selo no rodapé',
        cartao: card ? { texto: card.textContent.trim(), classe: card.className, ponto: ci ? getComputedStyle(ci).animationName + ' / ' + getComputedStyle(ci, '::after').animationName : '' } : 'sem cartão'
      };
    });
    await page.evaluate(() => { BC.estacao.ui.termW = 440; BC.estacao.alternarTerminal(true); });
    await esperar(400);
    await print('04-selo-rita-no-meu-terminal.png');

    /* reduced motion: brilho parado, sem laço */
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await esperar(300);
    r.reduzido = await page.evaluate(async () => {
      BC.util.avatarEvento && BC.util.avatarEvento(BC.loja.eu);
      await new Promise((ok) => setTimeout(ok, 80));
      const a = document.querySelector('.ativ-perfil .avatar');
      const st = document.querySelector('#e-status .st-controle .pr-selo-pulso'), anel = document.querySelector('.tr-selo-anel');
      return { barra: __medirAvatar(a), rodapePulso: st ? getComputedStyle(st, '::after').animationName : null, anelPulso: anel ? getComputedStyle(anel, '::after').animationName : null };
    });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate((dono) => BC.real.simular({ tipo: 'controles', dono, lista: [] }), eu);

    /* F7.1: paleta "tema" */
    r.paleta = await page.evaluate(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
      await new Promise((ok) => setTimeout(ok, 300));
      const inp = document.getElementById('paleta-entrada'); if (!inp) return 'sem paleta';
      inp.value = 'tema'; inp.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((ok) => setTimeout(ok, 200));
      return [...document.querySelectorAll('#paleta-lista li')].map((l) => l.textContent.trim());
    });
    await print('05-paleta-tema.png');
    const escolher = async (rotulo) => page.evaluate(async (rot) => {
      const inp = document.getElementById('paleta-entrada');
      if (document.getElementById('paleta').hidden) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })); await new Promise((ok) => setTimeout(ok, 200)); }
      inp.value = rot; inp.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((ok) => setTimeout(ok, 150));
      const li = [...document.querySelectorAll('#paleta-lista li[data-i]')].find((x) => x.firstChild.textContent.indexOf(rot) === 0); /* não o "Procurar … no acervo" */
      if (!li) return 'não achou ' + rot;
      li.click();
      await new Promise((ok) => setTimeout(ok, 300));
      const cs = getComputedStyle(document.documentElement);
      return { tema: document.documentElement.dataset.temaEstacao || '', s0: cs.getPropertyValue('--s0').trim(), texto: cs.getPropertyValue('--texto').trim(), fundo: getComputedStyle(document.body).backgroundColor, temaTv: BC.loja.estado.temaTv };
    }, rotulo);
    r.temas = {};
    r.temas.ametista = await escolher('Tema ametista na Estação');
    await print('06-tema-ametista.png');
    r.temas.claro = await escolher('Tema claro na Estação');
    await print('07-tema-claro.png');
    r.temas.noite = await escolher('Tema noite na Estação');
    r.temas.tvAzul = await escolher('Tema azul na TV');
    r.temas.tvRoxo = await escolher('Tema roxo na TV');
    await print('08-tema-noite.png');
  } catch (e) { r.erro = e.stack || e.message; }
  r.erros = erros;
  r.prints = PRINTS;
  const saida = process.argv[2];
  if (saida) fs.writeFileSync(saida, JSON.stringify(r, null, 2));
  console.log(JSON.stringify(r, null, 2));
  await T.fechar().catch(() => {});
})();
