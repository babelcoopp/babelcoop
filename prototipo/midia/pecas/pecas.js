/* babel-coop · as 16 peças do Supabase com corpo (PLANO §2 R5 · MAQUINA_PECAS §12 · SUPABASE_PECAS §A)
   Carregue com <script src="midia/pecas/pecas.js"> (ou injetado). JS puro, sem módulos; three.js só quando um 3D abre.

   window.BC.pecas
     carregar()                 → Promise<catálogo> (lê pecas.json uma vez; catálogo.pecas = 16 peças)
     lista() · info(id)         → o catálogo já lido (síncrono depois de carregar)
     url(id, 'png'|'glb'|'clipe') → endereço do arquivo da peça
     peca(el, id, {estado})     → desenha a peça (PNG isométrico recortado) em el; estado 'nova' = tracejada, 'corpo' = pronta
     ganharCorpo(elOuPeca)      → evento real (publicar, encaixar): a peça tracejada ganha corpo (clipe da Gaveta, luz, faíscas, som)
     abrir3d(el, id, {girar})   → Promise<info>: o GLB num canvas; gira uma volta só quando a pessoa abre (evento) e depois para
     carregarModelo(id)         → Promise<{ THREE, objeto }> para quem monta a própria cena (TV, 3D da Tela)
     vitrine(el)                → os 16 cartões; clicar num cartão abre o 3D da peça no palco
     ultimo()                   → { id, malhas, triangulos, pixelRatio, quadros, pixelsAcesos } do último 3D aberto
     reduzido()                 → prefers-reduced-motion (ou efeitos desligados no organismo)
   Régua: luz só com evento real; nada gira em repouso; laço parado com aba oculta ou palco fora da tela;
   canvas com devicePixelRatio ≤ 1,5; sem BC.organismo (protótipo puro) cai para CSS simples. */
(function () {
  'use strict';
  var BC = window.BC = window.BC || {};
  if (BC.pecas && BC.pecas.versao) return;

  var BASE = (function () {
    var s = document.currentScript && document.currentScript.src;
    if (s) return s.replace(/[^/]*$/, '');
    return 'midia/pecas/';
  })();
  var THREE_CDN = window.COOP_REAL ? '/vendor/three/' : 'https://cdn.jsdelivr.net/npm/three@0.160.0/'; /* no app, de dentro dele */
  var catalogo = null, promCatalogo = null, promThree = null, ultimoInfo = null;

  /* ------------------------------------------------------------------ estilo (injetado uma vez; tokens da casca 2030 com recuo) */
  var CSS = [
    '.pc-vitrine{--pc-borda:rgba(63,227,255,.22);display:grid;grid-template-columns:minmax(260px,1fr) minmax(0,2fr);gap:14px;height:100%;min-height:0;font-family:var(--fonte-ui,system-ui);color:var(--texto,#d7e4fb)}',
    '.pc-vidro{background:rgba(11,19,32,.72);-webkit-backdrop-filter:blur(14px) saturate(1.1);backdrop-filter:blur(14px) saturate(1.1);border:1px solid var(--pc-borda,rgba(63,227,255,.22));border-radius:var(--r-janela,10px)}',
    '.pc-grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:10px;align-content:start;overflow:auto;padding:12px;min-height:0}',
    '.pc-cartao{all:unset;box-sizing:border-box;cursor:pointer;display:grid;grid-template-rows:auto auto auto;gap:4px;padding:8px 8px 10px;border-radius:8px;border:1px solid var(--linha-fraca,rgba(215,228,251,.09));background:rgba(22,30,45,.55);transition:border-color var(--mov-padrao,180ms) var(--ease-saida,ease),background var(--mov-padrao,180ms)}',
    '.pc-cartao:hover,.pc-cartao:focus-visible{border-color:var(--pc-borda,rgba(63,227,255,.22));background:rgba(33,42,59,.7)}',
    '.pc-cartao:focus-visible{outline:2px solid var(--t0,#2ad5e5);outline-offset:2px}',
    '.pc-cartao[aria-pressed="true"]{border-color:var(--t0,#2ad5e5);box-shadow:inset 0 0 0 1px rgba(42,213,229,.35)}',
    '.pc-cartao img{width:100%;aspect-ratio:1;object-fit:contain;display:block;pointer-events:none}',
    '.pc-cartao b{font-weight:600;font-size:13px}',
    '.pc-cartao small{font-size:11.5px;color:var(--apagado,#a8b8d5);line-height:1.35}',
    '.pc-palco{position:relative;display:grid;grid-template-rows:minmax(0,1fr) auto;min-height:0;overflow:hidden}',
    '.pc-cena{position:relative;min-height:220px}',
    '.pc-cena canvas,.pc-cena img.pc-previa{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}',
    '.pc-cena img.pc-previa{transition:opacity 420ms var(--ease-saida,ease)}',
    '.pc-cena canvas{opacity:0;transition:opacity 420ms var(--ease-saida,ease);cursor:grab}',
    '.pc-palco[data-estado="corpo"] .pc-cena canvas{opacity:1}',
    '.pc-palco[data-estado="corpo"] .pc-cena img.pc-previa{opacity:0}',
    /* scanlines só na superfície viva (carregando ou girando), ≤ 5 % */
    '.pc-palco[data-vivo="1"] .pc-cena::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(42,213,229,.045) 0 1px,transparent 1px 3px)}',
    '.pc-legenda{padding:10px 14px 12px;border-top:1px solid var(--linha-fraca,rgba(215,228,251,.09));display:grid;gap:3px}',
    '.pc-legenda h3{margin:0;font-size:16px;font-weight:600}',
    '.pc-legenda p{margin:0;font-size:13px;color:var(--texto-90,#c3cfe5)}',
    '.pc-legenda .pc-origem{font-family:var(--fonte-mono,monospace);font-size:11.5px;color:var(--apagado,#a8b8d5)}',
    '.pc-vazio{display:grid;place-items:center;height:100%;color:var(--apagado,#a8b8d5);font-size:13px;padding:20px;text-align:center}',
    /* a peça sozinha: nova (tracejada) → corpo */
    '.pc-peca{position:relative;display:grid;place-items:center;width:100%;height:100%;border-radius:10px;box-sizing:border-box}',
    '.pc-peca img,.pc-peca video{width:100%;height:100%;object-fit:contain;display:block}',
    '.pc-peca video{position:absolute;inset:0;border-radius:10px;background:var(--s0,#060b16)}',
    '.pc-peca[data-estado="nova"]{border:1.5px dashed var(--hairline-peca,#506b94)}',
    '.pc-peca[data-estado="nova"] img{opacity:.26;filter:grayscale(1) brightness(1.4)}',
    '.pc-peca[data-estado="corpo"] img{opacity:1;filter:none;transition:opacity 520ms var(--ease-heroi,ease),filter 520ms var(--ease-heroi,ease),transform 520ms var(--ease-heroi,ease)}',
    '.pc-peca.pc-assenta img{animation:pc-assenta 520ms var(--ease-heroi,cubic-bezier(.16,1,.3,1)) both}',
    '@keyframes pc-assenta{0%{transform:translateY(6px) scale(.94)}100%{transform:none}}',
    /* luz de evento (meia-vida escrita pelo organismo em --luz; sem organismo, uma vez por CSS) */
    '.pc-peca{box-shadow:0 0 0 1px rgba(42,213,229,calc(var(--luz,0)*.55)),0 0 calc(var(--luz,0)*22px) rgba(123,164,240,calc(var(--luz,0)*.35))}',
    '.pc-peca.pc-luz-css{animation:pc-luz 1.2s var(--ease-saida,ease) both}',
    '@keyframes pc-luz{0%{box-shadow:0 0 0 1px rgba(163,118,233,.7),0 0 22px rgba(163,118,233,.45)}40%{box-shadow:0 0 0 1px rgba(42,213,229,.7),0 0 22px rgba(42,213,229,.4)}100%{box-shadow:0 0 0 1px rgba(42,213,229,0),0 0 0 rgba(42,213,229,0)}}',
    '@media (prefers-reduced-motion: reduce){.pc-cena img.pc-previa,.pc-cena canvas,.pc-peca img{transition:none!important}.pc-peca.pc-assenta img{animation:none}.pc-peca.pc-luz-css{animation:none;box-shadow:0 0 0 1px rgba(42,213,229,.6)}}',
    /* quem hospeda a vitrine decide a largura (a camada da Máquina, a TV, um painel): a vitrine se ajeita pelo contêiner, não pela janela */
    '.pc-casca{container-type:inline-size;height:100%;min-height:0}',
    '@container (max-width:720px){.pc-vitrine{grid-template-columns:1fr;grid-template-rows:minmax(240px,48%) minmax(0,1fr)}.pc-grade{grid-template-columns:repeat(auto-fill,minmax(112px,1fr))}}',
    '@media (max-width:760px){.pc-vitrine{grid-template-columns:1fr;grid-template-rows:minmax(260px,45%) 1fr}}'
  ].join('\n');
  function estilo() {
    if (document.getElementById('pc-estilo')) return;
    var s = document.createElement('style'); s.id = 'pc-estilo'; s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  /* ------------------------------------------------------------------ utilidades */
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function org() { return BC.organismo && BC.organismo.versao ? BC.organismo : null; }
  function reduzido() {
    var o = org();
    if (o && o.semMovimento) { try { return !!o.semMovimento(); } catch (e) { /* segue */ } }
    return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function el$(x) { return typeof x === 'string' ? document.querySelector(x) : x; }
  function moeda(v) { return 'US$ ' + Number(v || 0).toFixed(3).replace('.', ','); }

  function carregar() {
    if (catalogo) return Promise.resolve(catalogo);
    if (promCatalogo) return promCatalogo;
    promCatalogo = fetch(BASE + 'pecas.json', { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('pecas.json respondeu ' + r.status);
      return r.json();
    }).then(function (c) { catalogo = c; return c; }, function (e) { promCatalogo = null; throw e; });
    return promCatalogo;
  }
  function lista() { return catalogo ? catalogo.pecas.slice() : []; }
  function info(id) { return lista().filter(function (p) { return p.id === id; })[0] || null; }
  function url(id, tipo) {
    var p = info(id);
    var arq = p ? (tipo === 'glb' ? p.glb : tipo === 'clipe' ? p.clipe : p.png) : (id + '.' + (tipo === 'glb' ? 'glb' : 'png'));
    return arq ? BASE + arq : null;
  }

  /* ------------------------------------------------------------------ three.js, só quando um 3D abre */
  function three() {
    if (promThree) return promThree;
    promThree = Promise.all([
      import(THREE_CDN + 'build/three.module.js'),
      import(THREE_CDN + 'examples/jsm/loaders/GLTFLoader.js'),
      import(THREE_CDN + 'examples/jsm/controls/OrbitControls.js')
    ]).then(function (m) { return { THREE: m[0], GLTFLoader: m[1].GLTFLoader, OrbitControls: m[2].OrbitControls }; }, function (e) { promThree = null; throw e; });
    return promThree;
  }

  /* o GLB do Trellis já vem centrado numa caixa de 1 unidade; a textura traz a luz da folha de estilo (mesma luz nas 16),
     então o material vira sem sombreamento: a peça em 3D fica igual ao PNG isométrico */
  function carregarModelo(id) {
    return Promise.all([carregar(), three()]).then(function (r) {
      var T = r[1], THREE = T.THREE;
      return new Promise(function (ok, nao) {
        new T.GLTFLoader().load(url(id, 'glb'), function (g) {
          var malhas = 0, tri = 0;
          g.scene.traverse(function (o) {
            if (!o.isMesh) return;
            malhas++;
            var geo = o.geometry; tri += geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3;
            var mapa = o.material && o.material.map;
            if (mapa) mapa.colorSpace = THREE.SRGBColorSpace;
            /* a textura do Trellis sai um degrau mais escura que o keyframe: 1,18 devolve o tom da folha de estilo */
            o.material = new THREE.MeshBasicMaterial({ map: mapa || null, color: mapa ? new THREE.Color(1.18, 1.18, 1.18) : 0x3a4658 });
          });
          var caixa = new THREE.Box3().setFromObject(g.scene), centro = caixa.getCenter(new THREE.Vector3()), tam = caixa.getSize(new THREE.Vector3());
          /* pivô no centro da peça, girado para a mesma vista do PNG (giro_graus medido por calibrar-giro.cjs) */
          var pivo = new THREE.Group(); g.scene.position.sub(centro); pivo.add(g.scene);
          pivo.rotation.y = ((info(id) || {}).giro_graus || 0) * Math.PI / 180;
          var grupo = new THREE.Group(); grupo.add(pivo);
          var escala = 1 / Math.max(tam.x, tam.y, tam.z || 1); grupo.scale.setScalar(escala);
          /* raio da esfera que envolve a peça já escalada: é o que a câmera precisa enquadrar em qualquer ângulo */
          var raio = 0.5 * Math.sqrt(tam.x * tam.x + tam.y * tam.y + tam.z * tam.z) * escala;
          grupo.userData = { id: id, malhas: malhas, triangulos: Math.round(tri), raio: raio };
          ok({ THREE: THREE, objeto: grupo, T: T });
        }, undefined, function (e) { nao(e instanceof Error ? e : new Error('GLB de ' + id + ' não abriu')); });
      });
    });
  }

  /* ------------------------------------------------------------------ o 3D de uma peça: renderiza só por evento */
  var cenaAtual = null;
  function destruirCena() {
    var c = cenaAtual; cenaAtual = null;
    if (!c) return;
    c.vivo = false;
    if (c.raf) cancelAnimationFrame(c.raf);
    try { c.io && c.io.disconnect(); } catch (e) { /* segue */ }
    try { c.ro && c.ro.disconnect(); } catch (e) { /* segue */ }
    document.removeEventListener('visibilitychange', c.aoVisibilidade);
    try { c.controles && c.controles.dispose(); } catch (e) { /* segue */ }
    try { c.gl.dispose(); } catch (e) { /* segue */ }
    if (c.gl && c.gl.domElement && c.gl.domElement.parentNode) c.gl.domElement.parentNode.removeChild(c.gl.domElement);
  }

  function abrir3d(el, id, opcoes) {
    opcoes = opcoes || {};
    el = el$(el);
    if (!el) return Promise.reject(new Error('abrir3d: sem elemento'));
    destruirCena();
    var pedido = {};
    cenaAtual = pedido; /* se outra peça for aberta antes de carregar, esta desiste */
    return carregarModelo(id).then(function (m) {
      if (cenaAtual !== pedido || !el.isConnected) return null;
      var THREE = m.THREE, T = m.T;
      var r = el.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height);
      var gl = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      var pr = Math.min(window.devicePixelRatio || 1, 1.5);
      gl.setPixelRatio(pr); gl.setSize(w, h, false);
      gl.outputColorSpace = THREE.SRGBColorSpace;
      gl.domElement.setAttribute('aria-label', 'Peça ' + ((info(id) || {}).nome || id) + ' em 3D · arraste para girar');
      gl.domElement.setAttribute('role', 'img');
      el.appendChild(gl.domElement);
      var cena = new THREE.Scene();
      /* a mesma vista da folha de estilo: ortográfica, elevação 35°, girada 45° */
      /* enquadra a esfera da peça com 10 % de folga, no lado mais curto do palco */
      var R = (m.objeto.userData.raio || 0.87) * 1.1;
      function enquadrar(cw, ch) { var a = cw / ch; if (a >= 1) { cam.left = -R * a; cam.right = R * a; cam.top = R; cam.bottom = -R; } else { cam.left = -R; cam.right = R; cam.top = R / a; cam.bottom = -R / a; } cam.updateProjectionMatrix(); }
      var cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 50);
      enquadrar(w, h);
      var el35 = 35 * Math.PI / 180, dist = 6;
      cam.position.set(Math.cos(el35) * Math.sin(Math.PI / 4) * dist, Math.sin(el35) * dist, Math.cos(el35) * Math.cos(Math.PI / 4) * dist);
      cam.lookAt(0, 0, 0);
      cena.add(m.objeto);
      var c = {
        id: id, gl: gl, cena: cena, cam: cam, objeto: m.objeto, el: el, vivo: true, raf: 0, quadros: 0, visivel: true, pixelsAcesos: 0,
        malhas: m.objeto.userData.malhas, triangulos: m.objeto.userData.triangulos, pixelRatio: pr
      };
      cenaAtual = c;
      function desenhar() {
        if (!c.vivo) return;
        gl.render(cena, cam); c.quadros++;
        if (c.quadros === 1) c.pixelsAcesos = medirAcesos(gl.domElement);
      }
      c.desenhar = desenhar;
      /* a pessoa gira arrastando: um quadro por movimento, nenhum laço */
      var ctl = new T.OrbitControls(cam, gl.domElement);
      ctl.enableDamping = false; ctl.enablePan = false; ctl.enableZoom = true; ctl.minZoom = 0.6; ctl.maxZoom = 2.2;
      ctl.addEventListener('change', desenhar);
      c.controles = ctl;
      /* fora da tela ou aba oculta: nada roda (a volta de entrada para onde estiver) */
      c.aoVisibilidade = function () { if (document.hidden) pararVolta(c); };
      document.addEventListener('visibilitychange', c.aoVisibilidade);
      if (window.IntersectionObserver) {
        c.io = new IntersectionObserver(function (es) { c.visivel = es.some(function (x) { return x.isIntersecting; }); if (!c.visivel) pararVolta(c); });
        c.io.observe(el);
      }
      if (window.ResizeObserver) {
        c.ro = new ResizeObserver(function () {
          var b = el.getBoundingClientRect(); if (!b.width || !b.height) return;
          enquadrar(b.width, b.height);
          gl.setSize(b.width, b.height, false); desenhar();
        });
        c.ro.observe(el);
      }
      desenhar();
      /* uma volta, uma vez, porque a pessoa abriu a peça (evento); com movimento reduzido, parada */
      if (opcoes.girar !== false && !reduzido()) volta(c, opcoes.aoParar); else if (opcoes.aoParar) opcoes.aoParar();
      ultimoInfo = resumo(c);
      return ultimoInfo;
    });
  }
  function medirAcesos(canvas) {
    try {
      var k = document.createElement('canvas'); k.width = 64; k.height = 64;
      var x = k.getContext('2d'); x.drawImage(canvas, 0, 0, 64, 64);
      var d = x.getImageData(0, 0, 64, 64).data, n = 0;
      for (var i = 3; i < d.length; i += 4) if (d[i] > 24) n++;
      return Math.round(1000 * n / 4096) / 10;
    } catch (e) { return -1; }
  }
  function pararVolta(c) {
    if (!c || !c.raf) return;
    cancelAnimationFrame(c.raf); c.raf = 0;
    if (c.rot0 != null) { c.objeto.rotation.y = c.rot0; c.desenhar(); } /* volta à vista do PNG num quadro só */
    var palco = c.el && c.el.closest('.pc-palco'); if (palco) palco.removeAttribute('data-vivo');
    if (c.aoParar) { var f = c.aoParar; c.aoParar = null; f(); }
  }
  function volta(c, aoParar) {
    var ini = performance.now(), dur = 1600, rot0 = c.objeto.rotation.y; c.rot0 = rot0;
    var palco = c.el.closest('.pc-palco'); if (palco) palco.setAttribute('data-vivo', '1');
    c.aoParar = aoParar || null;
    function passo(t) {
      if (!c.vivo || document.hidden || !c.visivel) { pararVolta(c); return; }
      var k = Math.min(1, (t - ini) / dur), e = 1 - Math.pow(1 - k, 3);
      c.objeto.rotation.y = rot0 + e * Math.PI * 2;
      c.desenhar();
      if (k < 1) c.raf = requestAnimationFrame(passo);
      else { c.raf = 0; c.objeto.rotation.y = rot0; c.desenhar(); if (palco) palco.removeAttribute('data-vivo'); if (c.aoParar) { var f = c.aoParar; c.aoParar = null; f(); } }
    }
    c.raf = requestAnimationFrame(passo);
  }
  function resumo(c) { return c ? { id: c.id, malhas: c.malhas, triangulos: c.triangulos, pixelRatio: c.pixelRatio, quadros: c.quadros, pixelsAcesos: c.pixelsAcesos } : null; }

  /* ------------------------------------------------------------------ a peça sozinha e o "ganha corpo" */
  function peca(el, id, opcoes) {
    opcoes = opcoes || {};
    el = el$(el); estilo();
    var d = document.createElement('div');
    d.className = 'pc-peca'; d.dataset.peca = id; d.dataset.estado = opcoes.estado === 'nova' ? 'nova' : 'corpo';
    var p = info(id);
    d.innerHTML = '<img alt="' + esc(p ? p.nome : id) + '" src="' + esc(url(id, 'png')) + '" draggable="false">';
    el.innerHTML = ''; el.appendChild(d);
    if (!catalogo) carregar().then(function () { var im = d.querySelector('img'); var q = info(id); if (q) { im.src = url(id, 'png'); im.alt = q.nome; } }).catch(function () { /* fica com o nome padrão */ });
    return d;
  }
  function ganharCorpo(alvo, opcoes) {
    opcoes = opcoes || {};
    var d = el$(alvo);
    if (d && !d.classList.contains('pc-peca')) d = d.querySelector('.pc-peca');
    if (!d) return Promise.resolve(false);
    var id = d.dataset.peca, o = org(), red = reduzido();
    function assentar() {
      d.dataset.estado = 'corpo';
      if (!red) { d.classList.remove('pc-assenta'); void d.offsetWidth; d.classList.add('pc-assenta'); }
      if (o) {
        o.acender(d, 6000);
        o.respirar(d, { cor: opcoes.cor || 't0' });
        o.faiscas(d, 8, false, { onde: 'topo' });
        o.som(opcoes.som || 'duas');
      } else { d.classList.remove('pc-luz-css'); void d.offsetWidth; d.classList.add('pc-luz-css'); }
      d.dispatchEvent(new CustomEvent('pc:corpo', { bubbles: true, detail: { id: id } }));
      return true;
    }
    /* a Gaveta tem o clipe "a peça ganha corpo" (cubo de ardósia → gaveta): toca uma vez, só no evento */
    var clipe = url(id, 'clipe');
    if (!clipe || red || opcoes.semClipe) return Promise.resolve(assentar());
    return new Promise(function (ok) {
      var v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = clipe; v.setAttribute('aria-hidden', 'true');
      var feito = false;
      function fim() { if (feito) return; feito = true; if (v.parentNode) v.parentNode.removeChild(v); ok(assentar()); }
      v.addEventListener('ended', fim); v.addEventListener('error', fim);
      setTimeout(fim, 6000); /* aba oculta ou vídeo travado: o estado muda do mesmo jeito */
      d.appendChild(v);
      var pr = v.play(); if (pr && pr.catch) pr.catch(fim);
    });
  }

  /* ------------------------------------------------------------------ a vitrine: 16 cartões + palco 3D */
  function vitrine(el, opcoes) {
    opcoes = opcoes || {};
    el = el$(el); estilo();
    el.classList.add('pc-casca');
    el.innerHTML = '<div class="pc-vitrine"><section class="pc-palco pc-vidro" data-estado="vazio" aria-live="polite"><div class="pc-cena"><div class="pc-vazio">Escolha uma peça para ver o corpo dela em 3D.</div></div><div class="pc-legenda"><h3>As 16 peças</h3><p>O motor do backend inteiro, em peças com nome de gente.</p></div></section><div class="pc-grade pc-vidro" role="group" aria-label="As 16 peças da Máquina"></div></div>';
    var grade = el.querySelector('.pc-grade'), palco = el.querySelector('.pc-palco');
    return carregar().then(function (c) {
      grade.innerHTML = c.pecas.map(function (p) {
        return '<button type="button" class="pc-cartao" data-peca="' + esc(p.id) + '" aria-pressed="false" title="' + esc(p.nome + ': ' + p.o_que_e) + '"><img alt="" src="' + esc(BASE + p.png) + '" loading="lazy"><b>' + esc(p.nome) + '</b><small>' + esc(p.curto || p.o_que_e) + '</small></button>';
      }).join('');
      grade.addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-peca]'); if (!b) return;
        mostrar(palco, b.dataset.peca, grade);
      });
      if (opcoes.abrir) mostrar(palco, opcoes.abrir, grade);
      return c;
    });
  }
  function mostrar(palco, id, grade) {
    var p = info(id); if (!p) return;
    if (grade) grade.querySelectorAll('[data-peca]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.peca === id ? 'true' : 'false'); });
    var cena = palco.querySelector('.pc-cena');
    destruirCena();
    palco.dataset.estado = 'carregando'; palco.dataset.peca = id; palco.setAttribute('data-vivo', '1');
    cena.innerHTML = '<img class="pc-previa" alt="" src="' + esc(BASE + p.png) + '">';
    var etapas = (p.predicoes || []).map(function (x) { return x.etapa; }).join(' → ');
    palco.querySelector('.pc-legenda').innerHTML = '<h3>' + esc(p.nome) + '</h3><p>' + esc(p.o_que_e) + (p.frase ? ' · “' + esc(p.frase) + '”' : '') + '</p>' +
      '<span class="pc-origem">' + esc(etapas || 'gerada') + ' · ' + esc(moeda(p.custo_usd)) + ' · ' + esc(String(p.triangulos || '?')) + ' triângulos · arraste para girar</span>';
    var o = org(); if (o) o.som('tique');
    abrir3d(cena, id, {
      aoParar: function () { /* a volta acabou: a luz esfria */ }
    }).then(function (i) {
      if (!i || palco.dataset.peca !== id) return;
      palco.dataset.estado = 'corpo';
      if (o) { o.acender(palco, 6000); o.respirar(palco, { cor: 't0' }); }
      if (reduzido()) palco.removeAttribute('data-vivo');
    }).catch(function (e) {
      palco.dataset.estado = 'falhou'; palco.removeAttribute('data-vivo');
      var s = palco.querySelector('.pc-origem'); if (s) s.textContent = 'o 3D não abriu (' + (e && e.message || e) + '); a imagem continua valendo';
      if (o) o.respirar(palco, { cor: 'alarme', duracao: 700 });
    });
  }

  BC.pecas = {
    versao: '1.0.0',
    base: BASE,
    carregar: carregar, lista: lista, info: info, url: url,
    peca: peca, ganharCorpo: ganharCorpo,
    abrir3d: abrir3d, carregarModelo: carregarModelo, fechar3d: destruirCena,
    vitrine: vitrine, mostrar: mostrar,
    ultimo: function () { if (cenaAtual && cenaAtual.gl) ultimoInfo = resumo(cenaAtual); return ultimoInfo; },
    reduzido: reduzido
  };
})();
