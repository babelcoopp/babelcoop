/* Babel Coop · o organismo vivo: motor de luz e som da Estação (window.BC.organismo)
   Contrato visual e de comportamento: docs/design/TERMINAL_2030.md · régua: docs/design/REGUA_ORGANISMO.md
   Carregado depois de ponte.js e antes de terminal-real.js e parede-real.js. JS puro, sem módulos.

   O que o motor garante sozinho, para quem chama não precisar lembrar:
   - R1  nada acende sem chamada (evento real). Em repouso não há rAF nem timer rodando.
   - teto de 2 efeitos vivos (pulso, faíscas, respirar, acordar). O terceiro é descartado, a não ser que tenha
         prioridade maior (pulso > faíscas = respirar > acordar): aí o de menor prioridade termina na hora.
   - faíscas: no máximo 24 partículas vivas na tela inteira.
   - R9  prefers-reduced-motion (ou "efeitos" desligado pela pessoa) = cor sem movimento. Nada atrasa a digitação:
         tudo em transform/opacity/canvas, nenhum laço síncrono longo, nenhum await no caminho da tecla.
   - som: Web Audio (osciladores), ganho ≤ 0,08, ligado por padrão na Estação (preferência em localStorage
         'babel-coop:som'), NUNCA na TV nem no iPad (janela com #tv / #ipad ou <html data-vista="tv|ipad">).
*/
(function () {
  'use strict';
  var BC = window.BC = window.BC || {};
  if (BC.organismo && BC.organismo.versao) return; /* já carregado nesta página */

  var VERSAO = '1.0.0';
  var TETO_EFEITOS = 2, TETO_FAISCAS = 24, TETO_LUZES = 200, GANHO_MAX = 0.08;
  var CHAVE_SOM = 'babel-coop:som', CHAVE_EFEITOS = 'babel-coop:efeitos';
  var NS = 'http://www.w3.org/2000/svg';
  var PADRAO = { t0: '#2ad5e5', t1: '#7ba4f0', t2: '#a376e9', ok: '#7fd6a6', atencao: '#f0b35a', alarme: '#ff6b6b', semDado: '#5d6b78', ouro: '#f5c76a', texto90: '#c3cfe5' };
  var ESTADOS = ['shell', 'rodando', 'terminou', 'espera', 'pausado', 'desligado', 'falhou'];

  /* ------------------------------------------------------------------ utilidades */
  function agora() { return performance.now(); }
  function ler(chave) { try { return localStorage.getItem(chave); } catch (e) { return null; } }
  function guardar(chave, v) { try { localStorage.setItem(chave, v); } catch (e) { /* sem armazenamento: vale só nesta página */ } }
  var mqReduz = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduzido() { return !!(mqReduz && mqReduz.matches); }
  var efeitosMemoria = null; /* quando o localStorage não existe */
  function efeitosLigados() { var v = ler(CHAVE_EFEITOS); if (v === null) return efeitosMemoria !== false; return v !== '0'; }
  function semMovimento() { return reduzido() || !efeitosLigados(); }
  function dois(n) { return (n < 10 ? '0' : '') + n; }
  function hora(ms) { var d = new Date(ms || Date.now()); return dois(d.getHours()) + ':' + dois(d.getMinutes()); }
  function limitar(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* cores: lidas dos tokens da página (tokens.css), com os valores do design como reserva */
  var cacheCor = {}, cacheT = -1e9;
  function token(nome, padrao) {
    var t = agora();
    if (t - cacheT > 2000) { cacheCor = {}; cacheT = t; }
    if (cacheCor[nome]) return cacheCor[nome];
    var v = '';
    try { v = getComputedStyle(document.documentElement).getPropertyValue(nome).trim(); } catch (e) { v = ''; }
    return (cacheCor[nome] = v || padrao);
  }
  function rgb(c) {
    c = String(c || '').trim();
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
    if (m) { var h = m[1]; if (h.length === 3) h = h.replace(/(.)/g, '$1$1'); var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    m = /^rgba?\(([^)]+)\)$/i.exec(c);
    if (m) { var p = m[1].split(/[\s,\/]+/).map(parseFloat); if (p.length >= 3 && !isNaN(p[2])) return [p[0], p[1], p[2]]; }
    return null;
  }
  function mix(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
  function rgba(c, a) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + a.toFixed(3) + ')'; }
  function corNomeada(nome) {
    switch (nome) {
      case 'marca': case 't2': return token('--t2', PADRAO.t2);
      case 't0': return token('--t0', PADRAO.t0);
      case 't1': return token('--t1', PADRAO.t1);
      case 'ok': return token('--ok', PADRAO.ok);
      case 'alarme': return token('--alarme', PADRAO.alarme);
      case 'atencao': return token('--atencao', PADRAO.atencao);
      case 'ouro': return token('--ouro', PADRAO.ouro);
      case 'sem-dado': return token('--sem-dado', PADRAO.semDado);
      default: return nome;
    }
  }
  /* par [inicio, fim] de cores do rastro: 'marca' vai do roxo ao ciano; as outras são chapadas */
  function parDeCores(cor) {
    var roxo = rgb(token('--t2', PADRAO.t2)) || rgb(PADRAO.t2), ciano = rgb(token('--t0', PADRAO.t0)) || rgb(PADRAO.t0);
    if (!cor || cor === 'marca') return [roxo, ciano];
    var c = rgb(corNomeada(cor)) || ciano;
    return [c, c];
  }
  function elementoDe(x) {
    if (!x) return null;
    if (x.nodeType === 1) return x;
    if (typeof x.origem === 'function') return x.origem();
    if (x.el && x.el.nodeType === 1) return x.el;
    return null;
  }
  /* ponto na janela: {x,y} passa direto; Element (ou Presenca) = centro do retângulo ('topo' = perto do topo) */
  function pontoDe(x, onde) {
    if (x && x.nodeType !== 1 && typeof x.x === 'number' && typeof x.y === 'number') return { x: x.x, y: x.y };
    var el = elementoDe(x);
    if (!el || !el.isConnected) return null;
    var r = el.getBoundingClientRect();
    if (!r.width && !r.height) return null;
    return { x: r.left + r.width / 2, y: onde === 'topo' ? r.top + Math.min(8, r.height / 2) : r.top + r.height / 2 };
  }
  /* o primeiro candidato que está na tela agora (desenhado, com tamanho): o pulso cai num alvo válido em vez de sumir */
  function primeiroNaTela(lista) {
    for (var i = 0; i < lista.length; i++) if (lista[i] && pontoDe(lista[i])) return lista[i];
    return null;
  }
  /* nome curto de um alvo para o registro ("sem-alvo" diz qual lado faltou e quem era) */
  function nomeAlvo(x) {
    if (!x) return 'nada';
    if (x.nodeType !== 1 && typeof x.x === 'number') return 'ponto';
    var el = elementoDe(x);
    if (!el) return 'sem-elemento';
    var c = (el.getAttribute && el.getAttribute('class')) || '';
    return (el.tagName || '').toLowerCase() + (c ? '.' + String(c).trim().split(/\s+/).slice(0, 2).join('.') : '') + (el.isConnected ? '' : ' (fora do DOM)');
  }

  /* ------------------------------------------------------------------ registro (instrumentação para testes e para a pessoa ver) */
  var cont, reg = [];
  function zerar() {
    cont = { somPedido: {}, somTocado: {}, somBloqueado: {}, pulso: 0, faiscas: 0, particulas: 0, respirar: 0, acordar: 0, acender: 0, descartados: 0, preemptados: 0, maxVivos: 0 };
    reg = [];
  }
  zerar();
  function anotar(o) { o.t = Math.round(agora()); reg.push(o); if (reg.length > 300) reg.shift(); }
  function mais(mapa, k) { mapa[k] = (mapa[k] || 0) + 1; }

  /* ------------------------------------------------------------------ teto de efeitos vivos */
  var PRIO = { acordar: 0, respirar: 1, faiscas: 1, pulso: 2 };
  var vivos = [], seqEf = 0;
  function reservar(tipo) {
    var prio = PRIO[tipo] || 0;
    if (vivos.length >= TETO_EFEITOS) {
      var menor = null;
      vivos.forEach(function (v) { if (!menor || v.prio < menor.prio || (v.prio === menor.prio && v.t0 < menor.t0)) menor = v; });
      if (menor && menor.prio < prio) {
        cont.preemptados++;
        anotar({ tipo: menor.tipo, ok: false, motivo: 'cedeu-a-' + tipo });
        try { if (menor.cancelar) menor.cancelar(); } catch (e) { /* segue */ }
        liberar(menor, true);
      } else {
        cont.descartados++;
        anotar({ tipo: tipo, ok: false, motivo: 'teto' });
        return null;
      }
    }
    var ef = { id: ++seqEf, tipo: tipo, prio: prio, t0: agora(), vivo: true, cancelar: null };
    vivos.push(ef);
    if (vivos.length > cont.maxVivos) cont.maxVivos = vivos.length;
    return ef;
  }
  function liberar(ef, cortado) {
    if (!ef || !ef.vivo) return false;
    ef.vivo = false;
    var i = vivos.indexOf(ef);
    if (i >= 0) vivos.splice(i, 1);
    if (!cortado) anotar({ tipo: ef.tipo, ok: true, ms: Math.round(agora() - ef.t0) });
    return true;
  }

  /* ------------------------------------------------------------------ estilos (injetados uma vez) */
  var CSS = [
    '.bc-org-tela{position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483000;visibility:hidden}',
    '.bc-org-camada{position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:2147482999}',
    '.bc-org-respira{position:fixed;box-sizing:border-box;overflow:hidden;pointer-events:none;border:1.5px solid var(--bc-cor,var(--t2,#a376e9));box-shadow:0 0 0 1px rgba(42,213,229,.28) inset,0 0 22px rgba(163,118,233,.30);opacity:0}',
    '.bc-org-respira>i{position:absolute;left:0;right:0;bottom:0;height:60%;transform:translateY(100%);background:linear-gradient(to top,rgba(163,118,233,0),rgba(163,118,233,.20) 45%,rgba(42,213,229,.18) 70%,rgba(42,213,229,0))}',
    '.bc-org-respira.parado>i{display:none}',
    /* respirar com cor pedida (ex.: 'alarme' na tecla recusada): o brilho e a faixa que sobe tomam a mesma cor */
    '.bc-org-respira.tinta{border-width:2px;box-shadow:0 0 0 1px color-mix(in srgb,var(--bc-cor) 55%,transparent) inset,0 0 18px color-mix(in srgb,var(--bc-cor) 32%,transparent) inset,0 0 26px color-mix(in srgb,var(--bc-cor) 45%,transparent)}',
    '.bc-org-respira.tinta>i{background:linear-gradient(to top,transparent,color-mix(in srgb,var(--bc-cor) 30%,transparent) 55%,transparent)}',
    /* a presença: anel-instrumento + coluna de luz */
    '.bc-presenca{--bc-tam:72px;--bc-escala:.28;--bc-brilho:0;position:relative;display:inline-block;flex:none;width:var(--bc-tam);height:var(--bc-tam);line-height:0;vertical-align:middle;color:var(--sem-dado,#5d6b78)}',
    '.bc-presenca--mini{--bc-tam:18px}',
    '.bc-presenca>svg{display:block;width:100%;height:100%;overflow:visible}',
    '.bc-p-marcas-c,.bc-p-marcas-l{fill:none;stroke:var(--texto-90,#c3cfe5);opacity:calc(.24 + var(--bc-brilho) * .45 + var(--luz,0) * .3);transition:opacity 240ms,stroke 600ms}',
    '.bc-p-marcas-c{stroke-width:.55}.bc-p-marcas-l{stroke-width:1.05}',
    '.bc-p-aro{fill:none;stroke:var(--texto-90,#c3cfe5);stroke-width:.5;opacity:.3}',
    '.bc-presenca--mini .bc-p-aro{stroke-width:6;opacity:.42}',
    '.bc-p-agulha{stroke:var(--t0,#2ad5e5);stroke-width:1.6;stroke-linecap:round;opacity:calc(.3 + var(--bc-brilho) * .7)}',
    '.bc-p-fecho,.bc-p-laco,.bc-p-visita{fill:none;stroke-linecap:round}',
    '.bc-p-fecho{stroke:var(--t0,#2ad5e5);stroke-width:1.5;stroke-dasharray:100;stroke-dashoffset:100;opacity:0;transition:stroke-dashoffset 180ms var(--ease-saida,cubic-bezier(.2,0,0,1)),opacity 240ms,stroke 600ms}',
    '.bc-p-laco{stroke-width:1.7;stroke-dasharray:24 76;opacity:0;transform-box:view-box;transform-origin:50% 50%;transition:opacity 240ms}',
    '.bc-presenca--mini .bc-p-fecho,.bc-presenca--mini .bc-p-laco{stroke-width:9}',
    '.bc-p-visita{stroke-width:2.4;stroke-dasharray:100;stroke-dashoffset:100;opacity:calc(.72 + var(--luz,0) * .28);transition:stroke-dashoffset 240ms var(--ease-saida,cubic-bezier(.2,0,0,1))}',
    '.bc-presenca--mini .bc-p-visita{stroke-width:11}',
    '.bc-p-visita.on{stroke-dashoffset:0}',
    '.bc-p-halo,.bc-p-col{transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(var(--bc-escala))}',
    '.bc-p-halo{opacity:calc(var(--bc-brilho) + var(--luz,0) * .55)}',
    '.bc-p-luz{opacity:calc(.55 + var(--bc-brilho) * .45 + var(--luz,0) * .4)}',
    '.bc-p-nucleo{fill:#f2fbff;opacity:calc(.08 + var(--bc-brilho) * .55 + var(--luz,0) * .35)}',
    '.bc-p-tinta{fill:currentColor;opacity:0;transition:opacity 600ms var(--ease-saida,cubic-bezier(.2,0,0,1))}',
    '.bc-p-contorno{fill:none;stroke:var(--sem-dado,#5d6b78);stroke-width:.9;stroke-dasharray:2 2.4;opacity:0}',
    '.bc-presenca--mini .bc-p-contorno{stroke-width:5;stroke-dasharray:9 9}',
    '.bc-presenca[data-estado="rodando"] .bc-p-laco{opacity:1;animation:bc-org-gira 1.2s linear infinite}',
    '.bc-presenca[data-estado="terminou"] .bc-p-fecho{stroke-dashoffset:0;opacity:calc(.3 + var(--luz,0) * .7)}',
    '.bc-presenca[data-estado="espera"]{color:var(--atencao,#f0b35a)}',
    '.bc-presenca[data-estado="espera"] .bc-p-fecho{stroke:var(--atencao,#f0b35a);stroke-dasharray:83.3 16.7;stroke-dashoffset:0;opacity:1}',
    '.bc-presenca[data-estado="espera"] .bc-p-tinta{opacity:.8}',
    '.bc-presenca[data-estado="espera"] .bc-p-agulha{stroke:var(--atencao,#f0b35a)}',
    '.bc-presenca[data-estado="falhou"]{color:var(--alarme,#ff6b6b)}',
    '.bc-presenca[data-estado="falhou"] .bc-p-fecho{stroke:var(--alarme,#ff6b6b);stroke-dasharray:83.3 16.7;stroke-dashoffset:0;opacity:1}',
    '.bc-presenca[data-estado="falhou"] .bc-p-tinta{opacity:.72}',
    '.bc-presenca[data-estado="falhou"] .bc-p-agulha{stroke:var(--alarme,#ff6b6b)}',
    '.bc-presenca[data-estado="pausado"] .bc-p-tinta{opacity:.94}',
    '.bc-presenca[data-estado="pausado"] .bc-p-halo,.bc-presenca[data-estado="pausado"] .bc-p-nucleo,.bc-presenca[data-estado="pausado"] .bc-p-agulha{opacity:0}',
    '.bc-presenca[data-estado="pausado"] .bc-p-marcas-c,.bc-presenca[data-estado="pausado"] .bc-p-marcas-l{stroke:var(--sem-dado,#5d6b78);opacity:.34}',
    '.bc-presenca[data-estado="desligado"] .bc-p-col,.bc-presenca[data-estado="desligado"] .bc-p-halo,.bc-presenca[data-estado="desligado"] .bc-p-agulha{opacity:0}',
    '.bc-presenca[data-estado="desligado"] .bc-p-contorno{opacity:.95}',
    '.bc-presenca[data-estado="desligado"] .bc-p-marcas-c,.bc-presenca[data-estado="desligado"] .bc-p-marcas-l,.bc-presenca[data-estado="desligado"] .bc-p-aro{stroke:var(--sem-dado,#5d6b78);opacity:.2}',
    '.bc-p-textura{opacity:calc(.34 + var(--bc-brilho) * .16 + var(--luz,0) * .1)}',
    '.bc-presenca.com-textura .bc-p-marcas-c{opacity:calc(.1 + var(--bc-brilho) * .35 + var(--luz,0) * .25)}',
    '.bc-presenca[data-estado="pausado"] .bc-p-textura,.bc-presenca[data-estado="desligado"] .bc-p-textura{opacity:.05}',
    '@keyframes bc-org-gira{to{transform:rotate(360deg)}}',
    /* a marca "b" em neon (liga e desliga) */
    '.bc-marca-b{--bc-tam:28px;--bc-nivel:0;display:inline-block;flex:none;width:var(--bc-tam);height:var(--bc-tam);line-height:0}',
    '.bc-marca-b>svg{display:block;width:100%;height:100%;overflow:visible}',
    '.bc-mb-tubo{fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;transition:opacity 180ms}',
    '.bc-mb-halo{fill:none;stroke-width:3.4;stroke-linecap:round;opacity:calc(.3 + var(--bc-nivel) * .6 + var(--luz,0) * .3);transition:opacity 240ms}',
    '.bc-mb-nucleo{fill:none;stroke:#f4fbff;stroke-width:.45;stroke-linecap:round;opacity:calc(.35 + var(--bc-nivel) * .4)}',
    '.bc-marca-b[data-neon="nao"] .bc-mb-halo,.bc-marca-b[data-neon="nao"] .bc-mb-nucleo,.bc-marca-b[data-pausa="sim"] .bc-mb-halo,.bc-marca-b[data-pausa="sim"] .bc-mb-nucleo{opacity:0}',
    '.bc-marca-b[data-neon="nao"] .bc-mb-tubo,.bc-marca-b[data-pausa="sim"] .bc-mb-tubo{opacity:.4}',
    '.bc-marca-b[data-pausa="sim"] .bc-mb-tubo{filter:saturate(0)}',
    /* a constelação da sala */
    '.bc-constelacao{display:block;width:100%;height:auto;overflow:visible}',
    '.bc-c-raio{stroke:rgba(42,213,229,.22);stroke-width:1;opacity:calc(.6 + var(--luz,0) * .4)}',
    '.bc-c-raio.aceso{stroke:var(--t0,#2ad5e5);stroke-width:calc(1px + var(--luz,0) * .8px)}',
    '.bc-c-laco{fill:none;stroke-width:1.6;stroke-dasharray:4 3;opacity:.9}',
    '.bc-c-centro circle{fill:#0e0f22;stroke:var(--t2,#a376e9);stroke-width:1.2}',
    '.bc-c-centro text{fill:var(--latte,#fff8e7);font:500 15px var(--fonte-fala,"Cormorant Garamond",Georgia,serif);text-anchor:middle}',
    '.bc-c-no .anel{fill:none;stroke:var(--bc-cor,var(--t0,#2ad5e5));stroke-width:1.3;opacity:calc(.45 + var(--luz,0) * .55)}',
    '.bc-c-no .miolo{fill:var(--s0,#060b16);stroke:var(--bc-cor,var(--t0,#2ad5e5));stroke-width:1.2}',
    '.bc-c-no .brilho{fill:var(--bc-cor,var(--t0,#2ad5e5));opacity:calc(var(--luz,0) * .9)}',
    '.bc-c-no text{fill:var(--apagado,#a8b8d5);font:500 11px var(--fonte-mono,ui-monospace,Menlo,monospace)}',
    '.bc-c-no[data-estado="rodando"] .anel{stroke-dasharray:6 4;animation:bc-org-gira 2.4s linear infinite;transform-box:fill-box;transform-origin:50% 50%}',
    '.bc-c-no[data-estado="espera"] .anel{stroke:var(--atencao,#f0b35a);opacity:1}',
    '.bc-c-no[data-estado="falhou"] .anel{stroke:var(--alarme,#ff6b6b);opacity:1}',
    '.bc-c-no[data-estado="pausado"] .anel,.bc-c-no[data-estado="pausado"] .miolo{stroke:var(--sem-dado,#5d6b78)}',
    '.bc-c-no[data-estado="desligado"] .anel,.bc-c-no[data-estado="desligado"] .miolo{stroke:var(--sem-dado,#5d6b78);stroke-dasharray:2 2.5}',
    '.bc-c-no[data-estado="desligado"] text,.bc-c-no[data-estado="pausado"] text{fill:var(--fraco,#6c7b96)}',
    /* sem movimento: cor, nada gira nem corre */
    '@media (prefers-reduced-motion: reduce){.bc-presenca .bc-p-laco,.bc-c-no .anel{animation:none!important}.bc-p-fecho,.bc-p-visita{transition:none!important}}',
    'html.bc-org-parado .bc-presenca .bc-p-laco,html.bc-org-parado .bc-c-no .anel{animation:none!important}',
    'html.bc-org-parado .bc-p-fecho,html.bc-org-parado .bc-p-visita{transition:none!important}'
  ].join('\n');
  function injetarEstilo() {
    if (document.getElementById('bc-organismo-estilo')) return;
    var st = document.createElement('style');
    st.id = 'bc-organismo-estilo';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }
  injetarEstilo();
  function marcarParado() { try { document.documentElement.classList.toggle('bc-org-parado', !efeitosLigados()); } catch (e) { /* segue */ } }
  marcarParado();

  /* ------------------------------------------------------------------ a tela única de efeitos (canvas em tela cheia) */
  var tela = null, g = null, dpr = 1, W = 0, H = 0, girando = false, ultimoQuadro = 0;
  var pulsos = [], parts = [];
  function garantirTela() {
    if (tela && tela.isConnected) return true;
    if (!document.body) return false;
    tela = document.createElement('canvas');
    tela.className = 'bc-org-tela';
    tela.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tela);
    g = tela.getContext('2d');
    medir();
    return !!g;
  }
  function medir() {
    if (!tela || !g) return;
    dpr = Math.min(1.5, window.devicePixelRatio || 1); /* teto 1,5 (skill motion-web-institucional): faísca não precisa de 2× */
    W = window.innerWidth; H = window.innerHeight;
    tela.width = Math.max(1, Math.round(W * dpr)); tela.height = Math.max(1, Math.round(H * dpr));
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', function () { if (tela) medir(); });
  function girar() {
    if (girando) return;
    girando = true;
    tela.style.visibility = 'visible';
    ultimoQuadro = agora();
    requestAnimationFrame(quadro);
  }
  function quadro(t) {
    var dt = limitar(t - ultimoQuadro, 0, 34) / 16.67;
    ultimoQuadro = t;
    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    for (var i = pulsos.length - 1; i >= 0; i--) {
      var p = pulsos[i], k = (t - p.t0) / p.dur;
      if (k >= 1) { pulsos.splice(i, 1); chegar(p); continue; }
      desenharPulso(p, limitar(k, 0, 1));
    }
    for (var j = parts.length - 1; j >= 0; j--) {
      var s = parts[j];
      s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 0.07 * dt; s.vx *= Math.pow(0.985, dt); s.vida -= 0.019 * dt;
      if (s.vida <= 0) { parts.splice(j, 1); if (--s.ef.resta <= 0) liberar(s.ef); continue; }
      g.fillStyle = rgba(s.cor, s.vida * 0.22); g.beginPath(); g.arc(s.x, s.y, s.s * 3.2, 0, 6.2832); g.fill();
      g.fillStyle = rgba(s.cor, Math.min(1, s.vida * 1.1)); g.beginPath(); g.arc(s.x, s.y, s.s, 0, 6.2832); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    if (pulsos.length || parts.length) requestAnimationFrame(quadro);
    else { girando = false; g.clearRect(0, 0, W, H); tela.style.visibility = 'hidden'; }
  }

  /* ------------------------------------------------------------------ pulso: a bolinha com rastro que corre de um lugar a outro */
  function posPulso(p, k) {
    var e = 1 - Math.pow(1 - k, 3);
    return [p.x0 + (p.x1 - p.x0) * e, p.y0 + (p.y1 - p.y0) * e - Math.sin(k * Math.PI) * p.arco];
  }
  function desenharPulso(p, k) {
    var e = 1 - Math.pow(1 - k, 3), cor = mix(p.c0, p.c1, e), n, pt, a;
    for (n = 9; n >= 1; n--) {
      var kk = k - n * 0.03;
      if (kk < 0) continue;
      pt = posPulso(p, kk); a = (1 - n / 10) * 0.5;
      g.fillStyle = rgba(mix(p.c0, p.c1, 1 - Math.pow(1 - kk, 3)), a);
      g.beginPath(); g.arc(pt[0], pt[1], p.r * (1 - n / 12), 0, 6.2832); g.fill();
    }
    pt = posPulso(p, k);
    var gr = g.createRadialGradient(pt[0], pt[1], 0, pt[0], pt[1], p.r * 3.4);
    gr.addColorStop(0, rgba(cor, 0.95)); gr.addColorStop(0.35, rgba(cor, 0.45)); gr.addColorStop(1, rgba(cor, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(pt[0], pt[1], p.r * 3.4, 0, 6.2832); g.fill();
    g.fillStyle = rgba(mix(cor, [255, 255, 255], 0.55), 1); g.beginPath(); g.arc(pt[0], pt[1], p.r * 0.55, 0, 6.2832); g.fill();
  }
  function chegar(p) {
    if (p.chegou) return;
    p.chegou = true;
    clearTimeout(p.seguranca);
    liberar(p.ef);
    try { if (p.aoChegar) p.aoChegar(); } catch (e) { console.warn('[organismo] aoChegar falhou:', e); }
    p.resolver();
  }
  function pulso(de, para, opcoes) {
    opcoes = opcoes || {};
    cont.pulso++;
    var resolver, prom = new Promise(function (r) { resolver = r; });
    function direto(motivo, extra) {
      var o = { tipo: 'pulso', ok: false, motivo: motivo };
      if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
      anotar(o);
      Promise.resolve().then(function () { try { if (opcoes.aoChegar) opcoes.aoChegar(); } catch (e) { console.warn('[organismo] aoChegar falhou:', e); } resolver(); });
      return prom;
    }
    if (semMovimento()) return direto('sem-movimento');
    var a = pontoDe(de), b = pontoDe(para);
    if (!a || !b) return direto('sem-alvo', { de: a ? 'ok' : nomeAlvo(de), para: b ? 'ok' : nomeAlvo(para) });
    if (!garantirTela()) return direto('sem-tela');
    var ef = reservar('pulso');
    if (!ef) return direto('teto');
    var forte = !!opcoes.forte, cores = parDeCores(opcoes.cor);
    var dist = Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y));
    var dur = +opcoes.duracao || (forte ? 520 : 600);
    var p = {
      x0: a.x, y0: a.y, x1: limitar(b.x, 0, W || b.x), y1: limitar(b.y, 0, H || b.y), arco: Math.min(48, dist * 0.22),
      r: forte ? 5.6 : 3.6, c0: cores[0], c1: cores[1], t0: agora(), dur: dur, aoChegar: opcoes.aoChegar, resolver: resolver, ef: ef, chegou: false
    };
    ef.cancelar = function () { var i = pulsos.indexOf(p); if (i >= 0) pulsos.splice(i, 1); chegar(p); };
    /* se a janela estiver escondida o rAF para: o pulso chega do mesmo jeito (a lógica de quem chamou não pode esperar a animação) */
    p.seguranca = setTimeout(function () { var i = pulsos.indexOf(p); if (i >= 0) pulsos.splice(i, 1); chegar(p); }, dur + 400);
    pulsos.push(p);
    girar();
    return prom;
  }

  /* ------------------------------------------------------------------ faíscas: 3 a 12 por evento, 24 no máximo na tela */
  function faiscas(alvo, n, forte, opcoes) {
    opcoes = opcoes || {};
    cont.faiscas++;
    if (semMovimento()) { anotar({ tipo: 'faiscas', ok: false, motivo: 'sem-movimento' }); return 0; }
    var pt = pontoDe(alvo, opcoes.onde || 'topo');
    if (!pt) { anotar({ tipo: 'faiscas', ok: false, motivo: 'sem-alvo' }); return 0; }
    var livre = TETO_FAISCAS - parts.length;
    n = Math.max(0, Math.min(Math.round(+n || 6), livre));
    if (!n) { cont.descartados++; anotar({ tipo: 'faiscas', ok: false, motivo: 'teto-faiscas' }); return 0; }
    if (!garantirTela()) return 0;
    var ef = reservar('faiscas');
    if (!ef) return 0;
    ef.resta = n;
    ef.cancelar = function () { parts = parts.filter(function (s) { return s.ef !== ef; }); };
    var cores = parDeCores(opcoes.cor);
    /* sobem 25–60 px e apagam; perto do topo da janela (abas a 32 px) elas caem, senão sairiam da tela */
    var base = pt.y < 90 ? Math.PI / 2 : -Math.PI / 2;
    for (var i = 0; i < n; i++) {
      var ang = base + (Math.random() - 0.5) * (forte ? 2.0 : 1.6), v = (forte ? 1.8 : 1.3) + Math.random() * (forte ? 1.2 : 1.0);
      parts.push({ x: pt.x, y: pt.y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, vida: 1, cor: i % 2 ? cores[1] : cores[0], s: 1 + Math.random() * 1.4, ef: ef });
    }
    cont.particulas += n;
    girar();
    return n;
  }

  /* ------------------------------------------------------------------ respirar: a borda de luz que sobe e esfria, uma vez (1,2 s) */
  var camada = null;
  function garantirCamada() {
    if (camada && camada.isConnected) return camada;
    if (!document.body) return null;
    camada = document.createElement('div');
    camada.className = 'bc-org-camada';
    camada.setAttribute('aria-hidden', 'true');
    document.body.appendChild(camada);
    return camada;
  }
  function respirar(el, opcoes) {
    opcoes = opcoes || {};
    cont.respirar++;
    el = elementoDe(el);
    if (!el || !el.isConnected) { anotar({ tipo: 'respirar', ok: false, motivo: 'sem-alvo' }); return false; }
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) { anotar({ tipo: 'respirar', ok: false, motivo: 'sem-alvo' }); return false; }
    var cam = garantirCamada();
    if (!cam) return false;
    var ef = reservar('respirar');
    if (!ef) return false;
    var d = document.createElement('div');
    d.className = 'bc-org-respira';
    var raio = '8px';
    try { raio = getComputedStyle(el).borderRadius || raio; } catch (e) { /* segue */ }
    d.style.cssText = 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;border-radius:' + raio + ';';
    if (opcoes.cor) { d.style.setProperty('--bc-cor', corNomeada(opcoes.cor)); d.classList.add('tinta'); }
    d.appendChild(document.createElement('i'));
    cam.appendChild(d);
    var dur = +opcoes.duracao || 1200, feito = false;
    function fim() { if (feito) return; feito = true; if (d.parentNode) d.parentNode.removeChild(d); liberar(ef); }
    ef.cancelar = function () { if (feito) return; feito = true; if (d.parentNode) d.parentNode.removeChild(d); };
    if (semMovimento() || !d.animate) { d.classList.add('parado'); d.style.opacity = '1'; setTimeout(fim, dur); return true; }
    var an = d.animate([{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 0 }], { duration: dur, easing: 'cubic-bezier(.2,0,0,1)' });
    d.firstChild.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(-170%)' }], { duration: dur, easing: 'cubic-bezier(.16,1,.3,1)' });
    an.onfinish = fim;
    an.oncancel = fim;
    return true;
  }

  /* ------------------------------------------------------------------ meia-vida: --luz de 1 a 0, escrita a 4 Hz (≤ 200 elementos) */
  var luzes = new Map(), relogio = null;
  function aplicarLuz(el, l) {
    if (reduzido()) l = l > 0.6 ? 1 : l > 0.2 ? 0.35 : 0; /* três degraus, sem transição */
    el.style.setProperty('--luz', l.toFixed(3));
  }
  function passoLuz() {
    var t = agora();
    luzes.forEach(function (v, el) {
      if (!el.isConnected) { luzes.delete(el); return; }
      var l = Math.pow(2, -(t - v.t) / v.mv);
      if (l < 0.02) { el.style.setProperty('--luz', '0'); luzes.delete(el); return; }
      aplicarLuz(el, l);
    });
    if (!luzes.size) { clearInterval(relogio); relogio = null; }
  }
  function acender(el, mvMs) {
    el = elementoDe(el);
    if (!el || !el.style) return false;
    cont.acender++;
    try { el.setAttribute('data-t', String(Date.now())); } catch (e) { /* segue */ }
    luzes.delete(el);
    luzes.set(el, { t: agora(), mv: Math.max(200, +mvMs || 6000) });
    if (luzes.size > TETO_LUZES) { var velho = luzes.keys().next().value; velho.style.setProperty('--luz', '0'); luzes.delete(velho); }
    aplicarLuz(el, 1);
    if (!relogio) relogio = setInterval(passoLuz, 250);
    return true;
  }
  function apagar(el) { el = elementoDe(el); if (!el) return; luzes.delete(el); el.style.setProperty('--luz', '0'); }

  /* ------------------------------------------------------------------ som (Web Audio, osciladores) */
  /* notas = [frequência Hz, duração s]; cada nota começa a 80 % da anterior. Todos ≤ 0,4 s; "espera" ≤ 0,3 s. */
  var SONS = {
    tique: { onda: 'sine', ganho: 0.07, notas: [[880, 0.08]] },
    duas: { onda: 'sine', ganho: 0.07, notas: [[660, 0.16], [880, 0.2]] },
    tres: { onda: 'sine', ganho: 0.07, notas: [[523, 0.12], [659, 0.12], [784, 0.2]] },
    espera: { onda: 'triangle', ganho: 0.06, notas: [[659, 0.1], [988, 0.18]] },
    erro: { onda: 'triangle', ganho: 0.06, notas: [[311, 0.12], [233, 0.2]] },
    acordar: { onda: 'sine', ganho: 0.035, notas: [[1175, 0.07]] }
  };
  var audio = null, mestre = null, ultimoSom = {}, janelaSons = [], ouvintes = [];
  /* TV e iPad nunca tocam: vale o endereço (#tv, #ipad) e a vista que o protótipo marca em <html data-vista> */
  function naTV() {
    var v = '';
    try { v = document.documentElement.getAttribute('data-vista') || ''; } catch (e) { v = ''; }
    var h = String(location.hash || '').replace('#', '');
    return v === 'tv' || v === 'ipad' || /^(tv|ipad)\b/.test(h);
  }
  function somLigado() { if (naTV()) return false; return ler(CHAVE_SOM) !== '0'; }
  function avisar() { var e = { som: somLigado(), efeitos: efeitosLigados() }; ouvintes.forEach(function (fn) { try { fn(e); } catch (x) { /* segue */ } }); }
  function podeCriarAudio() {
    if (/Electron\//.test(navigator.userAgent)) return true; /* no app, o Electron toca sem gesto */
    var ua = navigator.userActivation;
    return !ua || ua.hasBeenActive;
  }
  function destravarAudio() {
    if (!audio) {
      if (!podeCriarAudio()) return null;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { audio = new AC(); mestre = audio.createGain(); mestre.gain.value = 1; mestre.connect(audio.destination); } catch (e) { audio = null; return null; }
    }
    if (audio.state === 'suspended') { try { audio.resume(); } catch (e) { /* segue */ } }
    return audio;
  }
  /* o primeiro gesto da pessoa destrava o áudio (regra dos navegadores); não toca nada */
  ['pointerdown', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function () { if (!audio && somLigado()) destravarAudio(); else if (audio && audio.state === 'suspended') destravarAudio(); }, { capture: true, passive: true });
  });
  function foraDeFoco(el) {
    if (document.visibilityState && document.visibilityState !== 'visible') return true;
    if (document.hasFocus && !document.hasFocus()) return true;
    el = elementoDe(el);
    if (el) return !el.contains(document.activeElement);
    return false;
  }
  function marcarSom(nome, tocou, motivo) {
    if (tocou) mais(cont.somTocado, nome); else mais(cont.somBloqueado, nome + ':' + motivo);
    anotar({ tipo: 'som', nome: nome, ok: !!tocou, motivo: motivo });
    return !!tocou;
  }
  function som(nome, opcoes) {
    opcoes = opcoes || {};
    mais(cont.somPedido, nome);
    var def = SONS[nome];
    if (!def) return marcarSom(nome, false, 'desconhecido');
    if (naTV()) return marcarSom(nome, false, 'tv');
    if (!somLigado()) return marcarSom(nome, false, 'desligado');
    if (opcoes.seForaDeFoco !== undefined && !foraDeFoco(opcoes.seForaDeFoco)) return marcarSom(nome, false, 'em-foco');
    var t = agora();
    if (ultimoSom[nome] && t - ultimoSom[nome] < 120) return marcarSom(nome, false, 'limite');
    janelaSons = janelaSons.filter(function (x) { return t - x < 1000; });
    if (janelaSons.length >= 6) return marcarSom(nome, false, 'limite');
    var ac = destravarAudio();
    if (!ac) return marcarSom(nome, false, 'sem-gesto');
    if (ac.state === 'closed') return marcarSom(nome, false, 'sem-audio');
    ultimoSom[nome] = t; janelaSons.push(t);
    try {
      var t0 = ac.currentTime + 0.005, off = 0, pico = Math.min(GANHO_MAX, def.ganho || GANHO_MAX);
      def.notas.forEach(function (nota) {
        var o = ac.createOscillator(), gn = ac.createGain();
        o.type = def.onda; o.frequency.value = nota[0];
        gn.gain.setValueAtTime(0, t0 + off);
        gn.gain.linearRampToValueAtTime(pico, t0 + off + 0.01);
        gn.gain.exponentialRampToValueAtTime(0.0001, t0 + off + nota[1]);
        o.connect(gn); gn.connect(mestre);
        o.start(t0 + off); o.stop(t0 + off + nota[1] + 0.03);
        o.onended = function () { try { o.disconnect(); gn.disconnect(); } catch (e) { /* segue */ } };
        off += nota[1] * 0.8;
      });
    } catch (e) { return marcarSom(nome, false, 'erro-audio'); }
    return marcarSom(nome, true, ac.state === 'running' ? 'tocou' : 'agendado');
  }
  function ligarSom(v) {
    if (naTV()) { avisar(); return false; } /* na TV não liga nunca, e não mexe na preferência da Estação */
    guardar(CHAVE_SOM, v ? '1' : '0');
    if (v) destravarAudio();
    avisar();
    return somLigado();
  }
  function ligarEfeitos(v) {
    efeitosMemoria = !!v;
    guardar(CHAVE_EFEITOS, v ? '1' : '0');
    marcarParado();
    if (!v) { pulsos.slice().forEach(function (p) { p.ef.cancelar(); }); parts = []; vivos.slice().forEach(function (ef) { try { if (ef.cancelar) ef.cancelar(); } catch (e) { /* segue */ } liberar(ef, true); }); }
    avisar();
    return efeitosLigados();
  }

  /* ------------------------------------------------------------------ textura opcional do anel grande (gerada na Replicate: interface/midia/mostrador-anel.png) */
  var textura = { estado: null, espera: [] };
  function comTextura(fn) {
    var url = api.texturaAnel;
    if (!url) return;
    var real = window.COOP_REAL;
    if (real && Array.isArray(real.midia) && real.midia.indexOf(String(url).split('/').pop()) < 0) return; /* o servidor disse que não existe: nem pede */
    if (textura.estado === 'ok') { fn(textura.url); return; }
    if (textura.estado === 'falhou') return;
    textura.espera.push(fn);
    if (textura.estado === 'carregando') return;
    textura.estado = 'carregando';
    var img = new Image();
    img.decoding = 'async';
    img.onload = function () { textura.estado = 'ok'; textura.url = url; textura.espera.splice(0).forEach(function (f) { try { f(url); } catch (e) { /* segue */ } }); };
    img.onerror = function () { textura.estado = 'falhou'; textura.espera = []; };
    img.src = url;
  }

  /* ------------------------------------------------------------------ frases do cabeçalho ("→ <alvo> · <agente> · <estado> · <hora>") */
  function duracaoTexto(ms) {
    var s = Math.max(0, Math.round((+ms || 0) / 1000));
    if (s < 60) return s + ' s';
    var m = Math.floor(s / 60);
    if (m < 60) return m + ' min' + (s % 60 && m < 10 ? ' ' + (s % 60) + ' s' : '');
    return Math.floor(m / 60) + ' h ' + (m % 60) + ' min';
  }
  function frase(estado, dados, quando) {
    dados = dados || {};
    var t = quando || Date.now();
    switch (estado) {
      case 'rodando': return 'rodando há ' + duracaoTexto(t - (dados.desde || t));
      case 'terminou': return 'terminou · ' + hora(dados.fim || t) + (dados.duracao ? ' · ' + duracaoTexto(dados.duracao) : '');
      case 'espera': return 'espera você';
      case 'pausado': return 'transmissão pausada';
      case 'desligado': return 'desligado';
      case 'falhou': return 'falhou · ' + hora(dados.fim || t) + (dados.codigo != null ? ' · código ' + dados.codigo : '');
      default: return 'em repouso';
    }
  }
  /* bytes por segundo → nível 0..1 (escala logarítmica: eco de tecla ≈ 0,2 · 10 KB/s ≈ 0,8 · 100 KB/s = 1) */
  function nivelDeBytes(bps) { return limitar(Math.log(1 + Math.max(0, +bps || 0)) / Math.LN10 / 5, 0, 1); }

  /* ------------------------------------------------------------------ Presenca: o anel-instrumento com a coluna de luz */
  var nPres = 0;
  function caminhoMarcas(n, rFora, rDentro, filtro) {
    var d = '';
    for (var i = 0; i < n; i++) {
      if (!filtro(i)) continue;
      var a = (i / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      d += 'M' + (50 + c * rDentro).toFixed(2) + ' ' + (50 + s * rDentro).toFixed(2) + 'L' + (50 + c * rFora).toFixed(2) + ' ' + (50 + s * rFora).toFixed(2);
    }
    return d;
  }
  var MARCAS_C = caminhoMarcas(72, 46.2, 43.4, function (i) { return i % 6 !== 0; });
  var MARCAS_L = caminhoMarcas(72, 46.2, 40.6, function (i) { return i % 6 === 0; });
  function defsColuna(id) {
    return '<defs>' +
      '<linearGradient id="' + id + '-col" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--t2,#a376e9)"/><stop offset=".55" style="stop-color:var(--t1,#7ba4f0)"/><stop offset="1" style="stop-color:var(--t0,#2ad5e5)"/></linearGradient>' +
      '<linearGradient id="' + id + '-laco" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--t2,#a376e9)"/><stop offset="1" style="stop-color:var(--t0,#2ad5e5)"/></linearGradient>' +
      '<filter id="' + id + '-halo" x="-200%" y="-40%" width="500%" height="180%"><feGaussianBlur stdDeviation="4"/></filter>' +
      '<filter id="' + id + '-brilho" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<clipPath id="' + id + '-disco"><circle cx="50" cy="50" r="47"/></clipPath>' +
      '</defs>';
  }
  function svgGrande(id) {
    return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + defsColuna(id) +
      '<g class="bc-p-textura" clip-path="url(#' + id + '-disco)"></g>' +
      '<path class="bc-p-marcas-c" d="' + MARCAS_C + '"/><path class="bc-p-marcas-l" d="' + MARCAS_L + '"/>' +
      '<circle class="bc-p-aro" cx="50" cy="50" r="37"/>' +
      '<line class="bc-p-agulha" x1="91" y1="50" x2="97.5" y2="50" transform="rotate(60 50 50)"/>' +
      '<circle class="bc-p-fecho" cx="50" cy="50" r="49" pathLength="100"/>' +
      '<circle class="bc-p-laco" cx="50" cy="50" r="49" pathLength="100" stroke="url(#' + id + '-laco)" filter="url(#' + id + '-brilho)"/>' +
      '<g class="bc-p-visitas"></g>' +
      '<rect class="bc-p-halo" x="43" y="16" width="14" height="68" rx="7" fill="url(#' + id + '-col)" filter="url(#' + id + '-halo)"/>' +
      '<g class="bc-p-col"><rect class="bc-p-luz" x="45.5" y="18" width="9" height="64" rx="4.5" fill="url(#' + id + '-col)"/>' +
      '<rect class="bc-p-tinta" x="45.5" y="18" width="9" height="64" rx="4.5"/>' +
      '<rect class="bc-p-nucleo" x="48.7" y="21.5" width="2.6" height="57" rx="1.3"/></g>' +
      '<rect class="bc-p-contorno" x="45.5" y="18" width="9" height="64" rx="4.5"/>' +
      '</svg>';
  }
  function svgMini(id) {
    return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + defsColuna(id) +
      '<circle class="bc-p-aro" cx="50" cy="50" r="42"/>' +
      '<circle class="bc-p-fecho" cx="50" cy="50" r="45" pathLength="100"/>' +
      '<circle class="bc-p-laco" cx="50" cy="50" r="45" pathLength="100" stroke="url(#' + id + '-laco)"/>' +
      '<g class="bc-p-visitas"></g>' +
      '<g class="bc-p-col"><rect class="bc-p-luz" x="39" y="20" width="22" height="60" rx="11" fill="url(#' + id + '-col)"/>' +
      '<rect class="bc-p-tinta" x="39" y="20" width="22" height="60" rx="11"/></g>' +
      '<rect class="bc-p-contorno" x="39" y="20" width="22" height="60" rx="11"/>' +
      '</svg>';
  }
  /* altura de repouso da coluna e brilho de base de cada estado */
  var BASE = { shell: [0.28, 0], rodando: [0.46, 0.22], terminou: [0.34, 0.08], espera: [0.72, 0.3], pausado: [0.22, 0], desligado: [0.2, 0], falhou: [0.4, 0.2] };

  function Presenca(container, opcoes) {
    if (!(this instanceof Presenca)) return new Presenca(container, opcoes);
    opcoes = opcoes || {};
    this.tamanho = opcoes.tamanho === 'mini' ? 'mini' : 'grande';
    this.id = 'bcp' + (++nPres);
    var el = document.createElement('span');
    el.className = 'bc-presenca bc-presenca--' + this.tamanho;
    el.innerHTML = this.tamanho === 'mini' ? svgMini(this.id) : svgGrande(this.id);
    if (this.tamanho === 'mini') el.setAttribute('aria-hidden', 'true');
    else { el.setAttribute('role', 'img'); }
    this.el = el;
    this.svg = el.firstChild;
    this.coluna = el.querySelector('.bc-p-col');
    this.agulha = el.querySelector('.bc-p-agulha');
    this.visitas = el.querySelector('.bc-p-visitas');
    this._estado = null; this.dados = {};
    this._nivel = 0; this._tNivel = 0; this._bytes = []; this._atual = 0; this._impulso = 0; this._ef = null; this._raf = 0; this._timer = 0; this._ultimo = 0;
    this._visitantes = [];
    if (container) (container.nodeType === 1 ? container : document.querySelector(container)).appendChild(el);
    this.estado(opcoes.estado || 'shell', opcoes.dados);
    var eu = this;
    if (this.tamanho === 'grande') comTextura(function (url) { eu._textura(url); });
  }
  var P = Presenca.prototype;
  P.origem = function () { return this.coluna || this.el; };
  P._textura = function (url) {
    if (!this.el || !this.svg) return;
    var gT = this.svg.querySelector('.bc-p-textura');
    if (!gT || gT.firstChild) return;
    var im = document.createElementNS(NS, 'image');
    im.setAttribute('href', url); im.setAttribute('x', '0'); im.setAttribute('y', '0'); im.setAttribute('width', '100'); im.setAttribute('height', '100');
    im.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    gT.appendChild(im);
    this.el.classList.add('com-textura'); /* o anel gravado da imagem faz as marcas finas; o código fica com as longas e a luz */
  };
  P.estado = function (estado, dados) {
    if (ESTADOS.indexOf(estado) < 0) estado = 'shell';
    var antes = this._estado;
    this._estado = estado;
    this.dados = dados || {};
    if (!this.el) return this;
    this.el.setAttribute('data-estado', estado);
    if (this.tamanho === 'grande') this.el.setAttribute('aria-label', 'presença do terminal: ' + frase(estado, this.dados));
    if (estado !== antes && antes !== null) {
      /* a luz acompanha a mudança real e esfria sozinha (meia-vida curta) */
      if (estado === 'terminou' || estado === 'espera' || estado === 'falhou') acender(this.el, 6000);
      else if (estado === 'rodando') acender(this.el, 1500);
      else if (estado === 'pausado' || estado === 'desligado') apagar(this.el);
    }
    this._animar();
    return this;
  };
  P.estadoAtual = function () { return this._estado; };
  /* nível efetivo agora (0..1), já esfriado; serve para acender outras peças no mesmo compasso (ex.: o "b" em neon) */
  P.nivelAtual = function () {
    if (this._estado === 'pausado' || this._estado === 'desligado') return 0;
    return this._nivel * Math.pow(2, -Math.max(0, agora() - this._tNivel - 400) / 500);
  };
  P.nivel = function (v) {
    this._nivel = limitar(+v || 0, 0, 1);
    this._tNivel = agora();
    this._animar();
    return this;
  };
  /* atalho: conta bytes de saída e calcula o nível pela janela do último segundo */
  P.bytes = function (n) {
    var t = agora();
    this._bytes.push([t, +n || 0]);
    while (this._bytes.length && t - this._bytes[0][0] > 1000) this._bytes.shift();
    var soma = 0;
    for (var i = 0; i < this._bytes.length; i++) soma += this._bytes[i][1];
    return this.nivel(nivelDeBytes(soma));
  };
  P.acordar = function () {
    if (!this.el) return this;
    cont.acordar++;
    if (semMovimento()) { acender(this.el, 1500); anotar({ tipo: 'acordar', ok: false, motivo: 'sem-movimento' }); return this; }
    if (!this._ef || !this._ef.vivo) {
      var ef = reservar('acordar');
      if (!ef) { acender(this.el, 1500); return this; } /* sem vaga: só a cor */
      var eu = this;
      ef.cancelar = function () { eu._impulso = 0; };
      this._ef = ef;
    }
    this._impulso = agora();
    acender(this.el, 1500);
    this._animar();
    return this;
  };
  P._alvo = function (t) {
    var b = BASE[this._estado] || BASE.shell;
    if (reduzido()) return b[0]; /* sem movimento: a coluna fica na altura do estado; o nível vira só brilho */
    var n = this._nivel * Math.pow(2, -Math.max(0, t - this._tNivel - 400) / 500); /* o nível esfria se ninguém renovar */
    if (this._estado === 'pausado' || this._estado === 'desligado') n = 0;
    var alvo = Math.max(b[0], Math.min(1, b[0] + n * (1 - b[0])));
    if (this._impulso && t - this._impulso < 240) alvo = 1;
    return alvo;
  };
  P._pintar = function (t) {
    var b = BASE[this._estado] || BASE.shell;
    var n = this._nivel * Math.pow(2, -Math.max(0, t - this._tNivel - 400) / 500);
    if (this._estado === 'pausado' || this._estado === 'desligado') n = 0;
    var escala = reduzido() ? b[0] : this._atual;
    var brilho = Math.min(0.9, b[1] + (reduzido() ? n : Math.max(0, this._atual - b[0])) * 0.7);
    this.el.style.setProperty('--bc-escala', escala.toFixed(3));
    this.el.style.setProperty('--bc-brilho', brilho.toFixed(3));
    if (this.agulha) this.agulha.setAttribute('transform', 'rotate(' + (60 - limitar((escala - 0.2) / 0.8, 0, 1) * 120).toFixed(1) + ' 50 50)');
    return n;
  };
  /* a coluna persegue o alvo (sobe rápido, 60 ms; desce devagar, 380 ms). Só há rAF enquanto ela se mexe;
     com saída constante a coluna parada é conferida a 8 Hz por setTimeout, sem quadro nenhum. */
  P._animar = function () {
    if (!this.el) return;
    if (this._timer) { clearTimeout(this._timer); this._timer = 0; }
    if (this._raf) return;
    var eu = this;
    this._ultimo = agora();
    if (reduzido()) {
      /* sem movimento: altura do estado, brilho em passos de 250 ms */
      this._atual = this._alvo(this._ultimo);
      if (this._pintar(this._ultimo) > 0.01) this._timer = setTimeout(function () { eu._timer = 0; eu._animar(); }, 250);
      if (this._ef && this._ef.vivo) { liberar(this._ef); this._ef = null; }
      return;
    }
    function passo(t) {
      eu._raf = 0;
      if (!eu.el) return;
      var dt = limitar(t - eu._ultimo, 0, 50); eu._ultimo = t;
      var alvo = eu._alvo(t), tau = alvo > eu._atual ? 60 : 380;
      eu._atual += (alvo - eu._atual) * (1 - Math.exp(-dt / tau));
      var n = eu._pintar(t);
      var impulsoVivo = eu._impulso && t - eu._impulso < 240;
      if (!impulsoVivo && eu._ef && eu._ef.vivo) { liberar(eu._ef); eu._ef = null; eu._impulso = 0; } /* acordar dura 240 ms; o resto é a coluna assentando */
      if (impulsoVivo || Math.abs(alvo - eu._atual) > 0.003) eu._raf = requestAnimationFrame(passo);
      else if (n > 0.01) { eu._timer = setTimeout(function () { eu._timer = 0; eu._animar(); }, 120); }
      else { eu._atual = alvo; eu._pintar(t); }
    }
    this._raf = requestAnimationFrame(passo);
  };
  /* arco de luz na cor de quem está no meu terminal (uma cor, uma lista de cores, ou null) */
  var POS_VISITA = [-90, -150, -30, 150, 30];
  P.visitante = function (cor) {
    if (!this.el) return this;
    var lista = cor == null ? [] : Array.isArray(cor) ? cor.filter(Boolean) : [cor];
    var eu = this, r = this.tamanho === 'mini' ? 45 : 49, velhos = this._visitantes;
    this._visitantes = [];
    velhos.forEach(function (v) {
      if (lista.indexOf(v.cor) >= 0) return;
      v.el.classList.remove('on');
      setTimeout(function () { if (v.el.parentNode) v.el.parentNode.removeChild(v.el); }, semMovimento() ? 0 : 260);
    });
    lista.slice(0, POS_VISITA.length).forEach(function (c, i) {
      var existente = velhos.filter(function (v) { return v.cor === c; })[0];
      if (existente) { eu._visitantes.push(existente); return; }
      var ang = POS_VISITA[i] * Math.PI / 180, meio = 32 * Math.PI / 180;
      var x0 = 50 + Math.cos(ang - meio) * r, y0 = 50 + Math.sin(ang - meio) * r, x1 = 50 + Math.cos(ang + meio) * r, y1 = 50 + Math.sin(ang + meio) * r;
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('class', 'bc-p-visita');
      p.setAttribute('d', 'M' + x0.toFixed(2) + ' ' + y0.toFixed(2) + 'A' + r + ' ' + r + ' 0 0 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2));
      p.setAttribute('pathLength', '100');
      p.setAttribute('filter', 'url(#' + eu.id + '-brilho)');
      p.style.stroke = corNomeada(c);
      eu.visitas.appendChild(p);
      if (semMovimento()) p.classList.add('on');
      else requestAnimationFrame(function () { requestAnimationFrame(function () { p.classList.add('on'); }); });
      eu._visitantes.push({ cor: c, el: p });
    });
    if (lista.length && lista.some(function (c) { return !velhos.some(function (v) { return v.cor === c; }); })) acender(this.el, 6000);
    return this;
  };
  P.destruir = function () {
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._timer) clearTimeout(this._timer);
    this._raf = 0; this._timer = 0;
    if (this._ef && this._ef.vivo) liberar(this._ef, true);
    if (this.el) { luzes.delete(this.el); if (this.el.parentNode) this.el.parentNode.removeChild(this.el); }
    this.el = null; this.svg = null; this.coluna = null; this.agulha = null; this.visitas = null; this._visitantes = [];
  };

  /* ------------------------------------------------------------------ MarcaB: o "b" da Babel em neon, que liga e desliga */
  var nMarca = 0;
  var CAMINHO_B = 'M5 2v16M5 9c1.2-1.4 2.6-2.2 4.4-2.2 3 0 5.1 2.3 5.1 5.6S12.4 18 9.4 18C7.6 18 6.2 17.2 5 15.8';
  function MarcaB(container, opcoes) {
    if (!(this instanceof MarcaB)) return new MarcaB(container, opcoes);
    opcoes = opcoes || {};
    var id = 'bcm' + (++nMarca);
    var el = document.createElement('span');
    el.className = 'bc-marca-b';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<svg viewBox="0 0 20 20" focusable="false"><defs>' +
      '<linearGradient id="' + id + '-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--t2,#a376e9)"/><stop offset=".55" style="stop-color:var(--t1,#7ba4f0)"/><stop offset="1" style="stop-color:var(--t0,#2ad5e5)"/></linearGradient>' +
      '<filter id="' + id + '-f" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.5"/></filter></defs>' +
      '<path class="bc-mb-halo" d="' + CAMINHO_B + '" stroke="url(#' + id + '-g)" filter="url(#' + id + '-f)"/>' +
      '<path class="bc-mb-tubo" d="' + CAMINHO_B + '" stroke="url(#' + id + '-g)"/>' +
      '<path class="bc-mb-nucleo" d="' + CAMINHO_B + '"/></svg>';
    this.el = el;
    if (container) (container.nodeType === 1 ? container : document.querySelector(container)).appendChild(el);
    this._neon = null;
    this.ligar(opcoes.neon !== false, true);
  }
  MarcaB.prototype.ligar = function (v, inicio) {
    if (!this.el) return false;
    v = !!v;
    if (v === this._neon) return v;
    this._neon = v;
    this.el.setAttribute('data-neon', v ? 'sim' : 'nao');
    if (v && !inicio && !semMovimento() && this.el.animate) {
      /* o tubo de neon acende piscando, como gás ionizando: 450 ms, uma vez */
      this.el.animate([{ opacity: 0.15 }, { opacity: 0.9, offset: 0.18 }, { opacity: 0.25, offset: 0.3 }, { opacity: 1, offset: 0.5 }, { opacity: 0.55, offset: 0.62 }, { opacity: 1 }], { duration: 450, easing: 'linear' });
      acender(this.el, 3000);
    }
    return v;
  };
  MarcaB.prototype.ligado = function () { return !!this._neon; };
  /* pausa da transmissão: o tubo esfria (fica como desligado) sem mexer na preferência de neon da pessoa */
  MarcaB.prototype.pausa = function (v) { if (this.el) { this.el.setAttribute('data-pausa', v ? 'sim' : 'nao'); if (v) this.nivel(0); } return this; };
  MarcaB.prototype.nivel = function (v) { if (this.el) this.el.style.setProperty('--bc-nivel', limitar(+v || 0, 0, 1).toFixed(3)); return this; };
  MarcaB.prototype.destruir = function () { if (this.el) { luzes.delete(this.el); if (this.el.parentNode) this.el.parentNode.removeChild(this.el); } this.el = null; };

  /* ------------------------------------------------------------------ Constelacao: a sala como constelação (parede) */
  function svgEl(tag, attrs, pai) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    if (pai) pai.appendChild(e);
    return e;
  }
  function Constelacao(container, opcoes) {
    if (!(this instanceof Constelacao)) return new Constelacao(container, opcoes);
    opcoes = opcoes || {};
    this.rx = opcoes.rx || 225; this.ry = opcoes.ry || 105;
    var svg = svgEl('svg', { viewBox: '-300 -150 600 300', class: 'bc-constelacao', role: 'img', 'aria-label': opcoes.rotulo || 'constelação da sala' });
    this.gRaios = svgEl('g', {}, svg); this.gLacos = svgEl('g', {}, svg); this.gNos = svgEl('g', {}, svg);
    this.centro = svgEl('g', { class: 'bc-c-centro' }, svg);
    this.centroCirculo = svgEl('circle', { r: 36 }, this.centro);
    var tx = svgEl('text', { y: 5 }, this.centro); tx.textContent = opcoes.centro || 'Equipe';
    this.el = svg; this.nos = {}; this.ordem = []; this.lacos = {};
    if (container) (container.nodeType === 1 ? container : document.querySelector(container)).appendChild(svg);
  }
  var C = Constelacao.prototype;
  C.no = function (id, o) {
    o = o || {};
    var n = this.nos[id];
    if (!n) {
      n = { id: id, g: svgEl('g', { class: 'bc-c-no', 'data-estado': 'shell' }, this.gNos), raio: svgEl('line', { class: 'bc-c-raio', x1: 0, y1: 0, x2: 0, y2: 0 }, this.gRaios) };
      n.brilho = svgEl('circle', { class: 'brilho', r: 9 }, n.g);
      n.anel = svgEl('circle', { class: 'anel', r: 10 }, n.g);
      n.miolo = svgEl('circle', { class: 'miolo', r: 5 }, n.g);
      n.texto = svgEl('text', {}, n.g);
      this.nos[id] = n; this.ordem.push(id);
      this._dispor();
    }
    if (o.nome != null) n.texto.textContent = o.nome;
    if (o.cor) { n.cor = o.cor; n.g.style.setProperty('--bc-cor', corNomeada(o.cor)); }
    if (o.estado) this.estado(id, o.estado);
    return n.g;
  };
  C._dispor = function () {
    var eu = this, total = this.ordem.length;
    this.ordem.forEach(function (id, j) {
      var n = eu.nos[id], ang = -Math.PI / 2 + (j / total) * Math.PI * 2, x = Math.cos(ang) * eu.rx, y = Math.sin(ang) * eu.ry;
      n.x = x; n.y = y;
      n.g.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
      /* o raio sai da borda do centro (nunca cruza o nome da sala) e para antes do anel do nó */
      var dist = Math.sqrt(x * x + y * y) || 1, ux = x / dist, uy = y / dist;
      n.raio.setAttribute('x1', (ux * 38).toFixed(1)); n.raio.setAttribute('y1', (uy * 38).toFixed(1));
      n.raio.setAttribute('x2', (x - ux * 11).toFixed(1)); n.raio.setAttribute('y2', (y - uy * 11).toFixed(1));
      var esq = Math.cos(ang) < -0.2, dir = Math.cos(ang) > 0.2, vert = Math.abs(Math.cos(ang)) <= 0.2;
      n.texto.setAttribute('x', esq ? -15 : dir ? 15 : 0);
      n.texto.setAttribute('y', vert ? (y < 0 ? -16 : 24) : 4);
      n.texto.setAttribute('text-anchor', esq ? 'end' : dir ? 'start' : 'middle');
    });
    Object.keys(this.lacos).forEach(function (k) { eu._desenharLaco(k); });
  };
  C.estado = function (id, estado) { var n = this.nos[id]; if (!n) return; n.g.setAttribute('data-estado', ESTADOS.indexOf(estado) >= 0 ? estado : 'shell'); if (estado === 'pausado' || estado === 'desligado') { apagar(n.g); apagar(n.raio); n.raio.classList.remove('aceso'); } };
  /* um evento real no terminal desse nó: o nó acende, o raio acende e um pulso corre do nó ao centro */
  C.acender = function (id, opcoes) {
    opcoes = opcoes || {};
    var n = this.nos[id];
    if (!n) return;
    acender(n.g, 6000); acender(n.raio, 6000); n.raio.classList.add('aceso');
    /* o mapa fora da tela (a parede guarda a raiz fora do DOM quando outra atividade está aberta): fica só a luz,
       que continua esfriando e aparece quando a pessoa volta. Pulso para lugar nenhum era o "sem-alvo" (FALTAS F6.2) */
    if (opcoes.pulso !== false && pontoDe(n.miolo) && pontoDe(this.centroCirculo)) pulso(n.miolo, this.centroCirculo, { cor: opcoes.cor || n.cor || 'marca', forte: !!opcoes.forte });
  };
  C.laco = function (deId, paraId, cor) {
    var k = deId + '>' + paraId;
    if (!cor) { if (this.lacos[k]) { if (this.lacos[k].parentNode) this.lacos[k].parentNode.removeChild(this.lacos[k]); delete this.lacos[k]; } return; }
    if (!this.lacos[k]) this.lacos[k] = svgEl('path', { class: 'bc-c-laco' }, this.gLacos);
    this.lacos[k].style.stroke = corNomeada(cor);
    this._desenharLaco(k);
    acender(this.lacos[k], 6000);
  };
  C._desenharLaco = function (k) {
    var ids = k.split('>'), a = this.nos[ids[0]], b = this.nos[ids[1]], p = this.lacos[k];
    if (!a || !b || !p) return;
    var mx = (a.x + b.x) / 2 * 0.55, my = (a.y + b.y) / 2 * 0.55;
    p.setAttribute('d', 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + 'Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1));
  };
  C.remover = function (id) {
    var n = this.nos[id];
    if (!n) return;
    var eu = this;
    Object.keys(this.lacos).forEach(function (k) { if (k.split('>').indexOf(id) >= 0) eu.laco(k.split('>')[0], k.split('>')[1], null); });
    [n.g, n.raio].forEach(function (e) { luzes.delete(e); if (e.parentNode) e.parentNode.removeChild(e); });
    delete this.nos[id];
    this.ordem.splice(this.ordem.indexOf(id), 1);
    this._dispor();
  };
  C.destruir = function () { var eu = this; Object.keys(this.nos).forEach(function (id) { eu.remover(id); }); if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el); this.el = null; };

  /* ------------------------------------------------------------------ ritos prontos (as combinações da tabela evento → efeito → som) */
  /* terminou: pulso roxo → ciano da presença até a aba, 3–8 faíscas e 'tique'; > 10 s = forte (R2); > 60 s = a aba respira e soa 'duas' */
  function concluido(de, para, dados) {
    dados = dados || {};
    var dur = +dados.duracao || 0, forte = dur > 10000, longo = dur > 60000;
    var n = dados.faiscas || (forte ? 8 : 4);
    function chegou() {
      acender(para, 6000);
      if (pontoDe(para)) faiscas(para, limitar(n, 3, 12), forte);
      som(longo ? 'duas' : 'tique');
      if (longo && dados.respirar && pontoDe(dados.respirar)) respirar(dados.respirar);
    }
    /* um dos lados fora da tela (painel recolhido, outra face aberta): sem caminho para correr, o rito fica em luz e som */
    if (!pontoDe(de) || !pontoDe(para)) { chegou(); return Promise.resolve(); }
    return pulso(de, para, { cor: 'marca', forte: forte, aoChegar: chegou });
  }
  /* erro provável: pulso vermelho até o alvo e 'erro' (sem caminho na tela: só a luz e o som) */
  function falhou(de, para) {
    function chegou() { acender(para, 6000); som('erro'); }
    if (!pontoDe(de) || !pontoDe(para)) { chegou(); return Promise.resolve(); }
    return pulso(de, para, { cor: 'alarme', aoChegar: chegou });
  }

  /* ------------------------------------------------------------------ vincular: o maestro de UMA sessão de terminal
     Recebe as peças da tela e traduz as mensagens do PROTOCOLO (§3–§5) nos efeitos da tabela de TERMINAL_2030.md §6.
     o = { presenca: Presenca grande (ou null), mini: Presenca mini da aba (ou null), aba: Element (destino do pulso),
           corpo: Element do terminal (foco e respirar), marca: MarcaB (ou null), meu: true se o terminal é meu (sons só nos meus),
           erroProvavel: function () → bool (opcional: olha o fim da saída) }
  */
  function vincular(o) {
    o = o || {};
    var meu = o.meu !== false, estado = 'shell', dados = {}, antesDaPausa = 'shell', pausado = false, visitas = [];
    function cada(fn) { [o.presenca, o.mini].forEach(function (p) { if (p && p.el) fn(p); }); }
    function mostrar(e, d) { cada(function (p) { p.estado(e, d); }); }
    function destinoPulso() { return o.aba && o.aba.isConnected ? o.aba : (o.mini && o.mini.el) || null; }
    /* de onde o pulso sai: a presença grande se estiver na tela; senão a mini da aba; senão a presença (o rito vira luz e som) */
    function origemPulso() { return primeiroNaTela([o.presenca, o.mini]) || o.presenca || o.mini; }
    var v = {
      /* term-saida: cada pedaço de saída alimenta a coluna (bytes por segundo) e o "b" em neon */
      saida: function (pedaco) {
        var n = typeof pedaco === 'string' ? pedaco.length : (+pedaco || 0);
        if (!n || pausado && !meu) return v;
        cada(function (p) { p.bytes(n); });
        if (o.marca && o.presenca) o.marca.nivel(o.presenca.nivelAtual());
        return v;
      },
      /* Enter enviado (a tecla \r saiu no term-entrada): a presença acorda, 240 ms; a aba só ganha luz */
      enter: function () {
        if (o.presenca && o.presenca.el) o.presenca.acordar();
        if (o.mini && o.mini.el) acender(o.mini.el, 1500);
        return v;
      },
      /* term-atividade {estado, processo, desde, duracao?, fim?, bytes} */
      atividade: function (m) {
        m = m || {};
        var novo = m.estado;
        if (ESTADOS.indexOf(novo) < 0) return v;
        if (novo === 'pausado') { v.pausa(true); return v; }
        if (pausado) { pausado = false; if (o.marca) o.marca.pausa(false); } /* o servidor já mandou atividade fora da pausa */
        var d = { processo: m.processo || null, desde: m.desde || Date.now(), duracao: m.duracao || 0, fim: m.fim || Date.now(), codigo: m.codigo };
        var antes = estado;
        estado = novo; dados = d;
        /* 'terminou' repetido depois de um 'falhou' (o servidor reenvia a atividade) é o mesmo fim: fica falhou, sem refazer o pulso vermelho nem o som */
        if (novo === 'terminou' && antes === 'falhou') { estado = 'falhou'; return v; }
        if (novo === 'terminou' && antes !== 'terminou') {
          var erro = false;
          try { erro = !!(o.erroProvavel && o.erroProvavel(d)); } catch (e) { erro = false; }
          if (erro) { estado = 'falhou'; mostrar('falhou', d); if (meu) falhou(origemPulso(), destinoPulso()); else if (o.mini) acender(o.mini.el, 6000); return v; }
          mostrar('terminou', d);
          var dest = destinoPulso();
          if (d.duracao < 2000) { if (dest) acender(dest, 6000); } /* comando rápido era o esperado (R2): só a luz, sem pulso nem som */
          else if (meu) concluido(origemPulso(), dest, { duracao: d.duracao, respirar: o.corpo });
          else { if (dest) acender(dest, 6000); if (o.mini) acender(o.mini.el, 6000); } /* terminal dos outros: luz, sem som (relevância) */
          return v;
        }
        mostrar(novo, d);
        if (novo === 'espera' && antes !== 'espera') {
          var alvo = destinoPulso();
          if (alvo) acender(alvo, 6000);
          if (meu) som('espera', { seForaDeFoco: o.corpo || null }); /* só chama quem olhou para outro lado */
        }
        return v;
      },
      /* term-pausa {pausada}: esfria para --sem-dado; ao retomar volta ao estado de antes */
      pausa: function (sim) {
        sim = !!sim;
        if (sim === pausado) return v;
        pausado = sim;
        if (o.marca) o.marca.pausa(sim);
        if (sim) { antesDaPausa = estado; estado = 'pausado'; mostrar('pausado', dados); }
        else { estado = antesDaPausa === 'pausado' ? 'shell' : antesDaPausa; mostrar(estado, dados); if (o.presenca && o.presenca.el) acender(o.presenca.el, 1500); }
        return v;
      },
      /* controles ativos nesta sessão: lista de {id, nome, cor}. Quem chega = arco de luz na cor da pessoa + 'duas' (só no meu terminal) */
      visitantes: function (lista) {
        lista = (lista || []).filter(function (x) { return x && x.cor; });
        var novos = lista.filter(function (x) { return !visitas.some(function (y) { return y.id === x.id; }); });
        visitas = lista.slice();
        var cores = lista.map(function (x) { return x.cor; });
        cada(function (p) { p.visitante(cores.length ? cores : null); });
        if (novos.length) {
          if (o.aba) acender(o.aba, 6000);
          if (meu) som('duas');
        }
        return v;
      },
      /* term-fim {codigo}: o shell acabou; código ≠ 0 = falhou (pulso vermelho + 'erro' no meu) */
      fim: function (codigo) {
        var d = { codigo: codigo, fim: Date.now() };
        if (codigo) { estado = 'falhou'; mostrar('falhou', d); if (meu) falhou(origemPulso(), destinoPulso()); }
        else { estado = 'desligado'; mostrar('desligado', d); }
        return v;
      },
      /* term-aberto (a pessoa abriu uma aba nova): a presença nasce acordando, a aba acende e soa 'acordar' (bem baixo) */
      aberto: function () {
        if (o.aba) acender(o.aba, 6000);
        if (o.presenca && o.presenca.el) o.presenca.acordar(); else if (o.mini && o.mini.el) acender(o.mini.el, 1500);
        if (meu) som('acordar');
        return v;
      },
      /* term-recusado (na tela de quem tentou digitar no terminal de outro): o terminal respira em vermelho, sem som */
      recusado: function () { if (o.corpo) respirar(o.corpo, { cor: 'alarme', duracao: 700 }); return v; },
      estado: function () { return estado; },
      dados: function () { return dados; },
      frase: function (quando) { return frase(estado, dados, quando); },
      destruir: function () { visitas = []; }
    };
    return v;
  }

  /* ------------------------------------------------------------------ API pública */
  var api = {
    versao: VERSAO,
    limites: { efeitos: TETO_EFEITOS, faiscas: TETO_FAISCAS, luzes: TETO_LUZES, ganho: GANHO_MAX },
    estados: ESTADOS.slice(),
    sons: Object.keys(SONS),
    /* anel gerado na Replicate (midia/midia.json): a versão 512 serve até 256 px de CSS em tela Retina; false = sem textura */
    texturaAnel: '/coop/midia/mostrador-anel-512.png',
    /* som */
    som: som, somLigado: somLigado, ligarSom: ligarSom, foraDeFoco: foraDeFoco, naTV: naTV,
    /* efeitos */
    faiscas: faiscas, pulso: pulso, acender: acender, apagar: apagar, respirar: respirar, reduzido: reduzido,
    efeitosLigados: efeitosLigados, ligarEfeitos: ligarEfeitos, semMovimento: semMovimento,
    concluido: concluido, falhou: falhou, vincular: vincular,
    /* peças */
    Presenca: Presenca, MarcaB: MarcaB, Constelacao: Constelacao,
    /* textos e conversões */
    frase: frase, duracaoTexto: duracaoTexto, hora: hora, nivelDeBytes: nivelDeBytes,
    /* instrumentação */
    vivos: function () { return vivos.length; },
    contagem: function () { return JSON.parse(JSON.stringify(cont)); },
    registro: function () { return reg.slice(); },
    zerar: zerar,
    ouvir: function (fn) { ouvintes.push(fn); return function () { var i = ouvintes.indexOf(fn); if (i >= 0) ouvintes.splice(i, 1); }; }
  };
  BC.organismo = api;
})();
