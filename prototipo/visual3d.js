/* Babel Coop — protótipo · visualizador 3D do site. É um modo da tela HTML (Site | Código | 3D):
   a página aparece como um painel plano num ambiente 3D e, ao lado, os próximos itens ligados a ela (outras telas,
   e as peças do backend como placas simples). Só as telas HTML são interativas: clica, digita, aperta Enter,
   e um pulso de luz corre pelo fio até o próximo item (verde deu certo, vermelho barrou). three.js, código nosso. */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc, LA = BC.loja.A;
  function L() { return BC.loja; }
  var V = { cenas: {}, log: [] };

  var CORHEX = { tela: '#29ccec', gaveta: '#8670ff', porta: '#7fd6a6', robo: '#f2a65a', pesquisa: '#ffcf5c', portaria: '#c7a2ff', cofre: '#ff7ab8', deposito: '#6fd1c1' };
  var COR = { tela: 0x29ccec, gaveta: 0x8670ff, porta: 0x7fd6a6, robo: 0xf2a65a, pesquisa: 0xffcf5c, portaria: 0xc7a2ff, cofre: 0xff7ab8, deposito: 0x6fd1c1 };
  var NOME = { tela: 'Tela', gaveta: 'Gaveta', porta: 'Porta', robo: 'Robô', pesquisa: 'Pesquisa', portaria: 'Portaria', cofre: 'Cofre', deposito: 'Depósito' };
  var ICONE = { gaveta: '🗄', porta: '🚪', robo: '⚙', pesquisa: '▤', portaria: '🛂', cofre: '🔐', deposito: '📦' };

  /* ---------- o fluxo: que item vem depois de cada tela ---------- */

  function semear() {
    var e = L().estado;
    if (e.fluxo3d) return e.fluxo3d;
    var lp = L().arquivo('davi/Projetos/Clínicas/landing.html');
    e.fluxo3d = {
      nos: [
        { id: 'lp', tipo: 'tela', nome: 'Landing · Clínicas', arquivo: lp ? lp.id : null },
        { id: 'login', tipo: 'tela', nome: 'Tela de login', html: telaLogin() },
        { id: 'agenda', tipo: 'tela', nome: 'Tela Agenda', html: telaAgenda() },
        { id: 'portaria', tipo: 'portaria', nome: 'Portaria (login)' },
        { id: 'clinicas', tipo: 'gaveta', nome: 'Gaveta Clínicas' },
        { id: 'pacientes', tipo: 'gaveta', nome: 'Gaveta Pacientes' },
        { id: 'agendamentos', tipo: 'gaveta', nome: 'Gaveta Agendamentos' },
        { id: 'porta-novo', tipo: 'porta', nome: 'Porta: novo agendamento' },
        { id: 'robo-zap', tipo: 'robo', nome: 'Robô: aviso no WhatsApp' }
      ],
      fios: [['lp', 'login'], ['login', 'portaria'], ['portaria', 'clinicas'], ['portaria', 'pacientes'], ['portaria', 'agenda'], ['agenda', 'porta-novo'], ['porta-novo', 'agendamentos'], ['agendamentos', 'robo-zap']]
    };
    return e.fluxo3d;
  }
  function telaLogin() {
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Login</title><style>body{margin:0;font-family:system-ui,sans-serif;background:linear-gradient(160deg,#0a1221,#060b16);color:#d7e4fb;display:grid;place-items:center;height:100vh}form{display:grid;gap:12px;width:340px;padding:30px;border:1px solid #30334c;border-radius:16px;background:#0a1221}h1{margin:0 0 4px;font-size:24px;color:#c7a2ff}p{margin:0;color:#8799bc;font-size:13px}input{padding:12px 14px;border:1px solid #30334c;border-radius:10px;background:#060b16;color:#fff;font-size:15px}input:focus{outline:2px solid #29ccec}button{padding:13px;border:0;border-radius:999px;background:#8670ff;color:#fff;font-weight:600;font-size:15px}small{color:#5a6a8c}</style></head><body><form><h1>Entrar na Babel</h1><p>Clínica Vida · atendimento</p><input name="email" placeholder="e-mail" value="ana@clinicavida.com.br"><input name="senha" type="password" placeholder="senha"><button type="submit">Entrar ⏎</button><small>a senha certa é: babel</small></form></body></html>';
  }
  function telaAgenda() {
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Agenda</title><style>body{margin:0;font-family:system-ui,sans-serif;background:#060b16;color:#d7e4fb;padding:24px}h1{margin:0 0 12px;color:#c7a2ff;font-size:22px}table{width:100%;border-collapse:collapse;font-size:14px}td,th{padding:8px 10px;border-bottom:1px solid #1b2640;text-align:left}th{color:#8799bc;font-weight:500}form{display:flex;gap:8px;margin-top:14px}input{flex:1;padding:10px 12px;border:1px solid #30334c;border-radius:8px;background:#0a1221;color:#fff}button{padding:10px 16px;border:0;border-radius:999px;background:#7fd6a6;color:#062;font-weight:600}</style></head><body><h1>Agenda · hoje</h1><table><tr><th>Hora</th><th>Paciente</th><th>Status</th></tr><tr><td>09:00</td><td>Maria Souza</td><td>marcado</td></tr><tr><td>10:30</td><td>João Lima</td><td>feito</td></tr><tr><td>14:00</td><td>Ana Prado</td><td>marcado</td></tr></table><form><input name="paciente" placeholder="novo agendamento: paciente"><input name="quando" placeholder="quando" value="amanhã 14:30"><button type="submit">Marcar ⏎</button></form></body></html>';
  }
  function injetar(html, id) {
    var s = '<script>(function(){function dados(){var o={};document.querySelectorAll("input,select,textarea").forEach(function(i){o[i.name||i.id||i.placeholder||"campo"]=i.value});return o}' +
      'document.addEventListener("submit",function(e){e.preventDefault();parent.postMessage({t:"babel-enter",no:"' + id + '",dados:dados()},"*")});' +
      'document.addEventListener("keydown",function(e){if(e.key==="Enter"&&!(e.target.form)){parent.postMessage({t:"babel-enter",no:"' + id + '",dados:dados()},"*")}});' +
      'document.addEventListener("click",function(e){var b=e.target.closest("button,a");if(b&&!b.form){parent.postMessage({t:"babel-clique",no:"' + id + '",texto:b.textContent.trim()},"*")}});})();</script>';
    return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, s + '</body>') : html + s;
  }
  function noDoArquivo(arquivoId) {
    var m = semear(), no = m.nos.filter(function (n) { return n.arquivo === arquivoId; })[0];
    if (no) return no;
    var a = L().arquivo(arquivoId);
    no = { id: 'arq-' + arquivoId, tipo: 'tela', nome: a ? a.caminho.split('/').pop() : 'Tela', arquivo: arquivoId };
    m.nos.push(no);
    return no;
  }
  function htmlDoNo(no) {
    if (no.html) return no.html;
    var a = no.arquivo && L().arquivo(no.arquivo);
    if (a && a.tipo === 'html') return BC.editor.conteudo(a) || '';
    return '<!doctype html><html><body style="margin:0;background:#0a1221;color:#8799bc;font-family:system-ui;display:grid;place-items:center;height:100vh"><div style="text-align:center"><b style="color:#c7a2ff;font-size:22px">' + esc(no.nome) + '</b><br>tela ainda sem conteúdo · peça ao agente</div></body></html>';
  }

  LA.fluxoNo = function (quem, dados) {
    var m = semear();
    if (!dados || !dados.nome) return;
    var no = { id: dados.id || L()._novoId('no'), tipo: dados.tipo || 'tela', nome: dados.nome, arquivo: dados.arquivo || null, html: dados.html || null };
    m.nos.push(no);
    if (dados.de && m.nos.some(function (x) { return x.id === dados.de; })) m.fios.push([dados.de, no.id]);
    return [L()._evento('fluxo', quem, L().nome(quem) + ' criou ' + NOME[no.tipo].toLowerCase() + ' "' + no.nome + '" no fluxo', { discreto: true })];
  };
  LA.fluxoFio = function (quem, a, b) { var m = semear(); if (!a || !b || a === b || m.fios.some(function (f) { return f[0] === a && f[1] === b; })) return; m.fios.push([a, b]); return []; };

  /* ---------- three.js só quando o modo 3D abre ---------- */

  function carregar(fn) {
    if (V.T) { fn(); return; }
    if (V.carregando) { V.carregando.push(fn); return; }
    V.carregando = [fn];
    var base = window.COOP_REAL ? '/vendor/three/' : 'https://cdn.jsdelivr.net/npm/three@0.160.0/'; /* no app o three vem de dentro dele (funciona sem internet) */
    Promise.all([import(base + 'build/three.module.js'), import(base + 'examples/jsm/controls/OrbitControls.js'), import(base + 'examples/jsm/renderers/CSS3DRenderer.js')])
      .then(function (m) { V.T = m[0]; V.OrbitControls = m[1].OrbitControls; V.CSS3DRenderer = m[2].CSS3DRenderer; V.CSS3DObject = m[2].CSS3DObject; var fila = V.carregando; V.carregando = null; fila.forEach(function (f) { f(); }); })
      .catch(function (e) { V.carregando = null; console.error(e); });
  }

  function etiqueta(T, texto, cor, largura) {
    var cv = document.createElement('canvas'), ctx = cv.getContext('2d');
    cv.width = 512; cv.height = 96;
    ctx.font = '600 34px IBM Plex Sans, system-ui, sans-serif';
    var w = Math.min(500, ctx.measureText(texto).width + 44);
    ctx.fillStyle = 'rgba(5,10,20,0.85)'; ctx.strokeStyle = cor; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect((512 - w) / 2, 14, w, 68, 34); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e6ecff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(texto, 256, 49);
    var tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
    var sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sp.scale.set(largura || 4.2, (largura || 4.2) * 96 / 512, 1);
    return sp;
  }
  function mat(T, cor, extra) { var o = { color: cor, roughness: 0.6, metalness: 0.2, emissive: cor, emissiveIntensity: 0.1 }; if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; }); return new T.MeshStandardMaterial(o); }

  /* o que vem depois desta tela: até três passos pelos fios */
  function subgrafo(m, origem) {
    var niveis = [[origem.id]], visto = {}; visto[origem.id] = true;
    for (var n = 0; n < 3; n++) {
      var prox = [];
      niveis[n].forEach(function (id) { m.fios.forEach(function (f) { if (f[0] === id && !visto[f[1]]) { visto[f[1]] = true; prox.push(f[1]); } }); });
      if (!prox.length) break;
      niveis.push(prox);
    }
    return niveis;
  }

  function montar(el, arquivoId) {
    var T = V.T, r = el.getBoundingClientRect(), w = r.width || 800, h = r.height || 500, m = semear(), origem = noDoArquivo(arquivoId);
    var cena = new T.Scene(); cena.background = new T.Color(0x050a14); cena.fog = new T.Fog(0x050a14, 24, 60);
    var cam = new T.PerspectiveCamera(48, w / h, 0.1, 200); cam.position.set(0, 3.2, 8.5);
    var gl = new T.WebGLRenderer({ antialias: true }); gl.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); gl.setSize(w, h); gl.domElement.className = 'v3d-gl'; el.appendChild(gl.domElement);
    var css = new V.CSS3DRenderer(); css.setSize(w, h); css.domElement.className = 'v3d-css3d'; el.appendChild(css.domElement);
    var controles = new V.OrbitControls(cam, gl.domElement); controles.target.set(0, 2, 0); controles.maxPolarAngle = Math.PI / 2 - 0.05; controles.minDistance = 2.5; controles.maxDistance = 40; controles.enableDamping = true;
    cena.add(new T.HemisphereLight(0x8fa3ff, 0x0a0f1e, 0.9));
    var sol = new T.DirectionalLight(0xffffff, 1.2); sol.position.set(8, 16, 10); cena.add(sol);
    var chao = new T.Mesh(new T.PlaneGeometry(80, 80), new T.MeshStandardMaterial({ color: 0x070d1a, roughness: 0.9 })); chao.rotation.x = -Math.PI / 2; cena.add(chao);
    var grade = new T.GridHelper(80, 40, 0x1b2640, 0x121a2e); grade.position.y = 0.01; cena.add(grade);

    var S = { cena: cena, cam: cam, gl: gl, css: css, controles: controles, el: el, pecas: {}, fios: [], pulsos: [], arquivo: arquivoId, origem: origem, relogio: new T.Clock() };
    V.cenas[arquivoId] = S;
    V.atual = S;

    /* posições: a tela desta página na frente; os próximos itens atrás, em fileiras */
    var niveis = subgrafo(m, origem), pos = {};
    /* a tela desta página na frente, à esquerda; os próximos itens sobem em diagonal para a direita, sem esconder uns aos outros */
    niveis.forEach(function (ids, n) { ids.forEach(function (id, i) { pos[id] = { x: -3 + n * 4.6 + (i - (ids.length - 1) / 2) * 5.4, z: -n * 5.2 }; }); });
    cam.position.set(1, 4.5, 11); controles.target.set(1.5, 1.8, -3);
    Object.keys(pos).forEach(function (id) {
      var no = m.nos.filter(function (x) { return x.id === id; })[0]; if (!no) return;
      var p = pos[id], g = new T.Group(); g.position.set(p.x, 0, p.z);
      var cor = COR[no.tipo] || 0x8799bc;
      if (no.tipo === 'tela') {
        var borda = new T.Mesh(new T.PlaneGeometry(3.4, 2.2), mat(T, cor, { emissiveIntensity: 0.6, side: T.DoubleSide })); borda.position.y = 2.05; borda.position.z = -0.03; g.add(borda);
        var fundo = new T.Mesh(new T.PlaneGeometry(3.28, 2.08), new T.MeshBasicMaterial({ color: 0x0a1221 })); fundo.position.y = 2.05; fundo.position.z = -0.01; g.add(fundo);
        var dom = new V.CSS3DObject(painelDom(no)); dom.scale.set(3.2 / 1024, 3.2 / 1024, 1); dom.position.set(p.x, 2.05, p.z + 0.02); cena.add(dom);
        S.pecas[id] = { no: no, grupo: g, dom: dom, borda: borda };
      } else {
        var placa = new T.Mesh(new T.BoxGeometry(2.4, 1.3, 0.12), mat(T, cor, { emissiveIntensity: 0.25 })); placa.position.y = 1.4; g.add(placa);
        var ic = etiqueta(T, (ICONE[no.tipo] || '') + ' ' + NOME[no.tipo], CORHEX[no.tipo], 2.2); ic.position.set(0, 1.4, 0.1); g.add(ic);
        S.pecas[id] = { no: no, grupo: g, borda: placa };
      }
      var et = etiqueta(T, no.nome, CORHEX[no.tipo] || '#8799bc'); et.position.set(0, no.tipo === 'tela' ? 3.45 : 2.4, 0); g.add(et);
      g.traverse(function (o) { if (o.material && o.material.emissive) { o.userData.base = o.material.emissiveIntensity; o.userData.corBase = o.material.emissive.getHex(); } });
      cena.add(g);
    });
    m.fios.forEach(function (f) {
      var a = S.pecas[f[0]], b = S.pecas[f[1]]; if (!a || !b) return;
      var pa = a.grupo.position.clone().setY(0.2), pb = b.grupo.position.clone().setY(0.2), meio = pa.clone().lerp(pb, 0.5); meio.y = 0.2 + pa.distanceTo(pb) * 0.1;
      var curva = new T.CatmullRomCurve3([pa, meio, pb]);
      var mesh = new T.Mesh(new T.TubeGeometry(curva, 24, 0.04, 8, false), new T.MeshStandardMaterial({ color: 0x3b4a7a, emissive: 0x3b4a7a, emissiveIntensity: 0.5 }));
      cena.add(mesh); S.fios.push({ de: f[0], para: f[1], curva: curva, mesh: mesh });
    });
    if (!S.fios.length) { var av = etiqueta(T, 'sem próximos itens · peça ao agente: "liga esta tela a …"', '#5a6a8c', 6); av.position.set(0, 0.6, -3); cena.add(av); }

    (function quadro() {
      if (V.cenas[arquivoId] !== S || !document.body.contains(el)) return;
      var dt = Math.min(0.05, S.relogio.getDelta());
      controles.update();
      Object.keys(S.pecas).forEach(function (id) { var p = S.pecas[id]; if (p.brilho > 0) { p.brilho -= dt; p.grupo.traverse(function (o) { if (o.material && o.material.emissive) o.material.emissiveIntensity = Math.max(o.userData.base || 0.1, p.brilho * 1.4); }); } });
      S.pulsos = S.pulsos.filter(function (p) { p.t += dt / p.dur; if (p.t >= 1) { chegou(S, p); cena.remove(p.mesh); cena.remove(p.luz); return false; } var pt = p.curva.getPoint(p.t); p.mesh.position.copy(pt); p.luz.position.copy(pt); return true; });
      gl.render(cena, cam); css.render(cena, cam);
      requestAnimationFrame(quadro);
    })();
  }
  function painelDom(no) {
    var div = document.createElement('div'); div.className = 'v3d-painel';
    var f = document.createElement('iframe'); f.setAttribute('sandbox', 'allow-scripts allow-forms'); f.srcdoc = injetar(htmlDoNo(no), no.id); div.appendChild(f);
    return div;
  }

  /* ---------- o pulso ---------- */

  function dispararDe(S, id, ok, prof, dados) {
    var T = V.T, saidas = S.fios.filter(function (f) { return f.de === id; });
    saidas.forEach(function (f) {
      var cor = ok ? 0x7fd6a6 : 0xff6b6b;
      var mesh = new T.Mesh(new T.SphereGeometry(0.15, 14, 14), new T.MeshStandardMaterial({ color: cor, emissive: cor, emissiveIntensity: 2.5 })), luz = new T.PointLight(cor, 8, 6);
      S.cena.add(mesh); S.cena.add(luz);
      f.mesh.material.emissive.setHex(cor); f.mesh.material.emissiveIntensity = 1.2;
      setTimeout(function () { f.mesh.material.emissive.setHex(0x3b4a7a); f.mesh.material.emissiveIntensity = 0.5; }, 2500);
      S.pulsos.push({ curva: f.curva, t: 0, dur: 0.8 + f.curva.getLength() * 0.05, mesh: mesh, luz: luz, para: f.para, ok: ok, prof: prof || 0, dados: dados });
    });
    return saidas.length;
  }
  function chegou(S, p) {
    var peca = S.pecas[p.para]; if (!peca) return;
    peca.brilho = 1.4;
    peca.grupo.traverse(function (o) { if (o.material && o.material.emissive) o.material.emissive.setHex(p.ok ? 0x7fd6a6 : 0xff6b6b); });
    setTimeout(function () { peca.grupo.traverse(function (o) { if (o.material && o.material.emissive && o.userData.corBase != null) o.material.emissive.setHex(o.userData.corBase); }); }, 2600);
    var no = peca.no;
    if (no.tipo === 'portaria') { registrar(p.ok ? 'a Portaria liberou: segue para as gavetas e a próxima tela' : 'a Portaria barrou: senha errada, nada passa'); if (!p.ok) return; }
    else if (no.tipo === 'gaveta') registrar('a linha entrou na ' + no.nome.replace('Gaveta ', 'gaveta ') + (p.dados && p.dados.paciente ? ': ' + p.dados.paciente : ''));
    else if (no.tipo === 'robo') registrar('o robô ' + no.nome.replace('Robô: ', '') + ' disparou');
    else if (no.tipo === 'tela') registrar('a ' + no.nome + ' recebeu o dado e abriu');
    else registrar(no.nome + ' recebeu o pulso');
    if (p.prof < 4) dispararDe(S, no.id, p.ok, p.prof + 1, p.dados);
  }
  function registrar(texto) { V.log.push({ texto: texto, ts: Date.now() }); if (V.log.length > 30) V.log.shift(); var T = BC.estacao.terminal; if (T) { T.escrever('⚡ ' + texto, 'ia', true); T.mostrar(); } }

  window.addEventListener('message', function (ev) {
    var m = ev.data || {}, S = V.atual;
    if (!S || (m.t !== 'babel-enter' && m.t !== 'babel-clique')) return;
    var no = semear().nos.filter(function (n) { return n.id === m.no; })[0]; if (!no) return;
    if (m.t === 'babel-clique') { registrar('clique em "' + m.texto + '" na ' + no.nome); return; }
    var dados = m.dados || {}, ok = true, motivo = '';
    if (/login/i.test(no.nome) || dados.senha !== undefined) { ok = U.normalizar(dados.senha || '') === 'babel'; motivo = ok ? 'senha certa' : 'senha errada'; }
    var campos = Object.keys(dados).filter(function (k) { return dados[k]; }).map(function (k) { return k + '=' + (k === 'senha' ? '•••' : dados[k]); }).join(', ');
    registrar('Enter na ' + no.nome + (campos ? ' (' + campos + ')' : '') + ' → pulso ' + (ok ? 'verde' : 'vermelho') + (motivo ? ' · ' + motivo : ''));
    var n = dispararDe(S, no.id, ok, 0, dados);
    BC.estacao.aviso(ok ? (n ? 'Verde: a informação saiu da tela e correu pelo fio.' : 'Enter recebido, mas esta tela não tem próximo item.') : 'Vermelho: barrado.');
  });

  /* ---------- ligação com o editor ---------- */

  BC.visual3d = {
    montar: function (el, arquivoId) {
      el.innerHTML = '<div class="v3d-carregando">carregando o 3D…</div>';
      carregar(function () { if (!document.body.contains(el)) return; el.innerHTML = ''; montar(el, arquivoId); });
    },
    destruir: function (arquivoId) { var S = V.cenas[arquivoId]; if (!S) return; try { S.gl.dispose(); } catch (e) { /* já */ } delete V.cenas[arquivoId]; if (V.atual === S) V.atual = null; },
    redimensionar: function () { var S = V.atual; if (!S || !S.el) return; var r = S.el.getBoundingClientRect(); if (!r.width) return; S.cam.aspect = r.width / r.height; S.cam.updateProjectionMatrix(); S.gl.setSize(r.width, r.height); S.css.setSize(r.width, r.height); },
    /* o agente cria a próxima tela e liga: "cria a tela de cadastro ligada ao login" */
    pedido: function (texto, ag, terminal) {
      var n = U.normalizar(texto), tipo = /\b(gaveta|tabela)\b/.test(n) ? 'gaveta' : /\bporta|api|rota\b/.test(n) ? 'porta' : /\brobo|robô\b/.test(n) ? 'robo' : 'tela';
      var nome = (texto.match(/(?:tela|pagina|página|gaveta|porta|robô|robo)\s+(?:de\s+|do\s+|da\s+|sobre\s+|chamada\s+)?([A-Za-zÀ-ú][\wÀ-ú ]{1,30})/i) || [])[1] || 'Nova tela';
      nome = nome.trim().replace(/\s+(e|com|ligad[ao]|para|puxa|puxando|no|na|a|ao)\b.*$/i, '');
      var m = semear(), de = null, tab = BC.estacao.abaAtual();
      m.nos.forEach(function (x) { var ult = U.normalizar(x.nome.split(' ').pop()); if (ult.length > 2 && n.indexOf(ult) !== -1 && U.normalizar(x.nome).indexOf(U.normalizar(nome)) === -1) de = x.id; });
      if (!de && tab.tipo === 'arquivo') de = noDoArquivo(tab.ref).id;
      var arquivo = null, html = null;
      if (tipo === 'tela') {
        var slug = U.normalizar(nome).replace(/[^a-z0-9]+/g, '-'), login = /login|entrar|senha/i.test(nome);
        html = '<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8"><title>' + esc(nome) + '</title>\n<style>body{margin:0;font-family:system-ui,sans-serif;background:linear-gradient(160deg,#0a1221,#060b16);color:#d7e4fb;display:grid;place-items:center;min-height:100vh}form{display:grid;gap:12px;width:340px;padding:28px;border:1px solid #30334c;border-radius:16px;background:#0a1221}h1{margin:0 0 6px;font-size:22px;color:#c7a2ff}p{margin:0;color:#8799bc;font-size:13px}input{padding:11px 13px;border:1px solid #30334c;border-radius:10px;background:#060b16;color:#fff;font-size:15px}button{padding:12px;border:0;border-radius:999px;background:#8670ff;color:#fff;font-weight:600}</style></head>\n<body><form><h1>' + esc(nome) + '</h1><p>criada por ' + esc(ag.nome) + '</p>' + (login ? '<input name="email" placeholder="e-mail"><input name="senha" type="password" placeholder="senha">' : '<input name="nome" placeholder="nome"><input name="email" placeholder="e-mail"><input name="telefone" placeholder="telefone">') + '<button type="submit">' + (login ? 'Entrar' : 'Enviar') + ' ⏎</button></form></body></html>';
        L().fazer('criarArquivo', L().eu + '/Projetos/Clínicas/' + slug + '.html', 'html', html, '1 KB');
        arquivo = L().estado.arquivos[L().estado.arquivos.length - 1].id;
      }
      L().fazer('fluxoNo', { tipo: tipo, nome: (tipo === 'tela' ? 'Tela ' : tipo === 'gaveta' ? 'Gaveta ' : tipo === 'porta' ? 'Porta: ' : 'Robô: ') + nome, arquivo: arquivo, de: de });
      var novo = m.nos[m.nos.length - 1];
      if (terminal) { terminal.cartao(esc(ag.nome) + ' criou <b>' + esc(novo.nome) + '</b>' + (de ? ' como próximo item de "' + esc((m.nos.filter(function (x) { return x.id === de; })[0] || {}).nome || de) + '"' : '') + (arquivo ? ' · abra em 3D para ver o fluxo' : ''), null, arquivo ? '<button type="button" class="term-mini" data-term="abrir:' + arquivo + '">abrir</button>' : ''); terminal.mostrar(); }
      /* se um 3D está aberto, remonta com o item novo */
      if (tab.tipo === 'arquivo' && tab.vis === '3d') { var c = document.getElementById('e-conteudo'); c.dataset.chave = ''; BC.estacao.render(); }
    }
  };
  window.addEventListener('resize', function () { BC.visual3d.redimensionar(); });

  /* =====================================================================================
     O CORPO DO PROJETO (TV · fase F4 do PLANO): as peças da Máquina em 3D, na parede da sala.
     "A peça nova nasce tracejada e ganha corpo ao publicar." Nada gira nem respira sem dado:
     o quadro só é desenhado quando algo muda (peça nova, peça que ganha corpo, pulso no cano, tamanho).

     Estado compartilhado (vai para todas as janelas pela loja):
       estado.corpo = { atual: <projeto>, projetos: { <projeto>: { nome, pecas: [{ id, tipo, nome, estado: 'corpo'|'tracejada', ts, por }],
                        fios: [[de, para]], publicacoes: [{ ts, por, ids, versao }] } } }
     Ações (BC.loja.fazer): 'corpoPeca' {projeto, nome?, pecas:[{id,tipo,nome}]} → peças tracejadas (ainda não publicadas)
                            'corpoPublicar' {projeto, nome?, pecas?, fios?, tudo?} → as peças ganham corpo (evento 'corpo', vai para a TV)
     As peças em GLB vêm de midia/pecas/pecas.json (geradas pelo pipeline da Replicate); sem GLB, uma forma simples do mesmo tipo.
     ===================================================================================== */

  var CORPO_TIPOS = { portaria: 'Portaria', gaveta: 'Gaveta', porta: 'Porta', robo: 'Robô', deposito: 'Depósito', cofre: 'Cofre', tela: 'Tela', cano: 'Cano',
    campo: 'Campo', fio: 'Fio', chave: 'Chave', armario: 'Armário', ferramenta: 'Ferramenta', carteiro: 'Carteiro', casa: 'Casa de Máquinas', empresa: 'Empresa', vitrine: 'Vitrine', janela: 'Janela' };
  var CORPO_FIOS = [['portaria', 'carteiro'], ['portaria', 'clinicas'], ['clinicas', 'pacientes'], ['pacientes', 'agendamentos'], ['porta-novo', 'agendamentos'], ['porta-listar', 'agendamentos'], ['tela-agenda', 'porta-novo'], ['tela-agenda', 'porta-listar'], ['agendamentos', 'robo-zap'], ['pacientes', 'deposito'], ['agendamentos', 'cano'], ['cano', 'tela-agenda']];

  function tipoCorpo(t) {
    var n = U.normalizar(t || '').replace(/[^a-z]+/g, '');
    if (!n) return 'gaveta';
    if (CORPO_TIPOS[n]) return n;
    if (/^casa/.test(n)) return 'casa';
    if (/tabela|gaveta/.test(n)) return 'gaveta';
    if (/robo|gatilho|cron/.test(n)) return 'robo';
    if (/api|rota|porta|funcao/.test(n)) return 'porta';
    if (/login|auth|portaria/.test(n)) return 'portaria';
    if (/bucket|deposito|arquivo/.test(n)) return 'deposito';
    if (/segredo|cofre|vault/.test(n)) return 'cofre';
    if (/realtime|cano|fila/.test(n)) return 'cano';
    if (/tela|pagina/.test(n)) return 'tela';
    return n;
  }

  function semearCorpo() {
    var e = L().estado;
    if (e.corpo && e.corpo.projetos) return e.corpo;
    /* app real (COOP_REAL sem exemplos): nada de projeto de exemplo na parede; o corpo nasce do que a equipe publicar */
    if (window.COOP_REAL && !window.COOP_REAL.exemplos) { e.corpo = { atual: null, projetos: {} }; return e.corpo; }
    var t = Date.now(), H = U.HORA, D = U.DIA;
    var pecas = [
      ['carteiro', 'carteiro', 'Carteiro', 'carla', 6 * D], ['portaria', 'portaria', 'Portaria', 'carla', 6 * D], ['clinicas', 'gaveta', 'Clínicas', 'carla', 6 * D], ['pacientes', 'gaveta', 'Pacientes', 'bruno', 5 * D],
      ['agendamentos', 'gaveta', 'Agendamentos', 'davi', 5 * D], ['porta-novo', 'porta', 'novo agendamento', 'bruno', 4 * D], ['porta-listar', 'porta', 'listar agendamentos', 'bruno', 4 * D],
      ['robo-zap', 'robo', 'aviso no WhatsApp', 'davi', 3 * D], ['deposito', 'deposito', 'fotos', 'bruno', 3 * D], ['tela-agenda', 'tela', 'Agenda', 'davi', 2 * D],
      ['cano', 'cano', 'ao vivo', 'davi', 2 * D], ['cofre', 'cofre', 'Cofre', 'carla', 2 * H]
    ].map(function (p) { return { id: p[0], tipo: p[1], nome: p[2], estado: 'corpo', ts: t - p[4], por: p[3] }; });
    e.corpo = { atual: 'clinicas', projetos: { clinicas: { nome: 'Clínicas em Campinas', pecas: pecas, fios: CORPO_FIOS.map(function (f) { return f.slice(); }),
      publicacoes: [{ ts: t - 2 * H, por: 'carla', ids: ['cofre'], versao: 6 }] } } };
    return e.corpo;
  }
  function corpoProjeto(pjId, nome) {
    var c = semearCorpo(), pj = c.projetos[pjId];
    if (!pj) {
      var info = (L().estado.projetos || []).filter(function (p) { return p.id === pjId; })[0];
      pj = c.projetos[pjId] = { nome: nome || (info ? info.nome : pjId), pecas: [], fios: [], publicacoes: [] };
    }
    return pj;
  }
  function pecaDoCorpo(pj, id) { for (var i = 0; i < pj.pecas.length; i++) if (pj.pecas[i].id === id) return pj.pecas[i]; return null; }
  function juntarFios(pj, fios) {
    (fios || []).forEach(function (f) {
      if (!Array.isArray(f) || !f[0] || !f[1] || f[0] === f[1]) return;
      var a = String(f[0]), b = String(f[1]);
      if (!pj.fios.some(function (x) { return x[0] === a && x[1] === b; })) pj.fios.push([a, b]);
    });
  }

  /* peças novas que ainda não foram publicadas: nascem tracejadas na parede */
  LA.corpoPeca = function (quem, dados) {
    if (!dados || !dados.projeto || !Array.isArray(dados.pecas)) return;
    var pj = corpoProjeto(String(dados.projeto), dados.nome), novas = 0, agora = Date.now();
    dados.pecas.forEach(function (p) {
      if (!p || !p.id || pecaDoCorpo(pj, String(p.id))) return;
      pj.pecas.push({ id: String(p.id), tipo: tipoCorpo(p.tipo), nome: String(p.nome || p.id).slice(0, 40), estado: p.publicada ? 'corpo' : 'tracejada', ts: agora, por: quem });
      novas++;
    });
    juntarFios(pj, dados.fios);
    if (!novas) return;
    return [];
  };

  /* publicar: as peças tracejadas (e as que vierem na lista) ganham corpo. O evento vai para a TV. */
  LA.corpoPublicar = function (quem, dados) {
    if (!dados || !dados.projeto) return;
    var pjId = String(dados.projeto), pj = corpoProjeto(pjId, dados.nome), agora = Date.now(), ganharam = [];
    var idPub = String(dados.id || (quem + ':' + (dados.pecas || []).map(function (p) { return p && p.id; }).join(',') + ':' + Math.floor(agora / 5000)));
    if (pj.publicacoes.some(function (x) { return x.id === idPub; })) return; /* a mesma publicação chegando de novo (outra janela, o diário) */
    (dados.pecas || []).forEach(function (p) {
      if (!p || !p.id) return;
      var x = pecaDoCorpo(pj, String(p.id));
      if (!x) { x = { id: String(p.id), tipo: tipoCorpo(p.tipo), nome: String(p.nome || p.id).slice(0, 40), estado: 'tracejada', ts: agora, por: quem }; pj.pecas.push(x); }
      if (p.publicada === false) return; /* ainda no local: continua tracejada */
      if (x.estado !== 'corpo') { x.estado = 'corpo'; x.ts = agora; x.por = quem; ganharam.push(x.id); }
    });
    if (dados.tudo !== false) pj.pecas.forEach(function (x) { if (x.estado === 'tracejada') { x.estado = 'corpo'; x.ts = agora; x.por = quem; ganharam.push(x.id); } });
    juntarFios(pj, dados.fios);
    var versao = ((pj.publicacoes[0] || {}).versao || 0) + 1;
    pj.publicacoes.unshift({ id: idPub, ts: agora, por: quem, ids: ganharam.slice(), versao: dados.versao || versao });
    if (dados.versao) versao = dados.versao;
    if (pj.publicacoes.length > 12) pj.publicacoes.length = 12;
    semearCorpo().atual = pjId;
    var n = ganharam.length, nomes = ganharam.map(function (id) { return pecaDoCorpo(pj, id).nome; });
    var texto = L().nome(quem) + ' publicou a Máquina de ' + pj.nome + ' (v' + versao + ')' + (n ? ': ' + (n === 1 ? 'a peça ' + nomes[0] + ' ganhou corpo' : n + ' peças ganharam corpo') : ', sem peça nova');
    var textoTv = n ? (n === 1 ? 'A peça ' + nomes[0] + ' ganhou corpo na parede' : n + ' peças ganharam corpo na parede: ' + nomes.slice(0, 3).join(', ') + (n > 3 ? '…' : '')) : L().nome(quem) + ' publicou a Máquina de ' + pj.nome;
    return [L()._evento('corpo', quem, texto, { tv: true, projeto: pjId, pecas: ganharam, versao: versao, textoTv: textoTv })];
  };

  /* ponte com a Máquina desta Estação (maquina.js guarda as peças só nesta janela):
     - peça que existe na Máquina e não está no corpo → nasce tracejada na parede;
     - "publicado em produção" (o formulário Publicar da Máquina) → as peças ganham corpo.
     Só a Estação que publicou faz a ponte (os eventos dos outros chegam prontos). */
  function maquinasLocais() { return (BC.maquina && BC.maquina.maquinas) || {}; }
  /* as peças da Máquina desta Estação: pelo retrato (API da Máquina) quando existe, senão pelas peças cruas */
  function pecasDaMaquina(pjId) {
    var ms = maquinasLocais(), m = ms[pjId], r = null;
    if (!m) return [];
    try { r = BC.maquina.retrato ? BC.maquina.retrato(pjId) : null; } catch (e) { r = null; }
    var lista = r && Array.isArray(r.pecas) ? r.pecas : (Array.isArray(m.pecas) ? m.pecas : []);
    return lista.filter(function (p) { return p && p.id && p.tipo !== 'empresa'; })
      .map(function (p) { return { id: String(p.id), tipo: p.tipo, nome: p.nome || p.id, publicada: p.publicada !== false && p.pronta !== false }; });
  }
  function fiosDaMaquina(pjId) {
    var m = maquinasLocais()[pjId];
    return (m && Array.isArray(m.fios) ? m.fios : []).map(function (f) { return Array.isArray(f) ? f : f && [f.de, f.para]; })
      .filter(function (f) { return f && f[0] && f[1]; }).map(function (f) { return [String(f[0]), String(f[1])]; });
  }
  function nomeDoProjeto(pjId) { var m = maquinasLocais()[pjId]; return m && m.pj ? m.pj.nome : null; }
  var ponteAgendada = false, ultimaPublicacao = {}, ultimaSinc = 0, sincPendente = null;
  /* no máximo duas vezes por segundo (o retrato da Máquina não é de graça e a loja muda muito com a equipe trabalhando) */
  function sincronizarTracejadas() {
    if (ponteAgendada || L().papel !== 'estacao' || !L().estado) return;
    var falta = 500 - (Date.now() - ultimaSinc);
    if (falta > 0) { if (!sincPendente) sincPendente = setTimeout(function () { sincPendente = null; sincronizarTracejadas(); }, falta); return; }
    ultimaSinc = Date.now();
    var ms = maquinasLocais(), c = L().estado.corpo;
    Object.keys(ms).forEach(function (pjId) {
      var pecas = pecasDaMaquina(pjId);
      if (!pecas.length) return;
      var pj = c && c.projetos && c.projetos[pjId];
      var novas = pecas.filter(function (p) { return !pj || !pecaDoCorpo(pj, p.id); });
      if (!novas.length || ponteAgendada) return;
      ponteAgendada = true;
      setTimeout(function () { ponteAgendada = false; L().fazer('corpoPeca', { projeto: pjId, nome: nomeDoProjeto(pjId), pecas: novas, fios: fiosDaMaquina(pjId) }); }, 0);
    });
  }
  L().aoMudar(function (estado, novos) {
    if (L().papel !== 'estacao') return;
    (novos || []).forEach(function (ev) {
      if (!ev || ev.pessoa !== L().eu) return;
      var pjId = null, m = null, versao = null;
      if (ev.tipo === 'maquina' && ev.maquina === 'publicou' && ev.pj) pjId = ev.pj;
      else if (ev.tipo === 'maquina-publicada' && ev.projeto) pjId = ev.projeto;
      else if (ev.tipo === 'recado' && (m = /^Máquina: (.+?) publicad[oa] em produção(?: \(v(\d+)\))?/.exec(ev.texto || ''))) {
        var pj = (estado.projetos || []).filter(function (p) { return p.nome === m[1]; })[0];
        pjId = pj ? pj.id : null; versao = m[2] ? +m[2] : null;
      }
      if (!pjId || !maquinasLocais()[pjId]) return;
      if (ultimaPublicacao[pjId] && Date.now() - ultimaPublicacao[pjId] < 4000) return; /* o recado e o evento da Máquina são a mesma publicação */
      ultimaPublicacao[pjId] = Date.now();
      setTimeout(function () { L().fazer('corpoPublicar', { id: 'pub-' + ev.id, projeto: pjId, nome: nomeDoProjeto(pjId), pecas: pecasDaMaquina(pjId), fios: fiosDaMaquina(pjId), tudo: false, versao: versao }); }, 0);
    });
    sincronizarTracejadas();
  });

  /* ---------- o catálogo das peças em GLB ---------- */
  var catalogo = null, catalogoEspera = [];
  function urlDaPeca(x) {
    var u = x && (x.glb || x.arquivo || x.modelo || x.src || x.caminho || x.url);
    if (!u || typeof u !== 'string' || !/\.glb(\?|$)/i.test(u)) return null;
    if (/^(https?:|\/|midia\/)/.test(u)) return u;
    return 'midia/pecas/' + u.replace(/^\.\//, '');
  }
  function carregarCatalogo(fn) {
    if (catalogo) { fn(catalogo); return; }
    catalogoEspera.push(fn);
    if (catalogoEspera.length > 1) return;
    var base = { cofre: 'midia/cofre.glb' };
    function pronto(c) { catalogo = c; var f = catalogoEspera.splice(0); f.forEach(function (x) { try { x(c); } catch (e) { console.warn('[corpo]', e); } }); }
    if (!window.fetch) { pronto(base); return; }
    fetch('midia/pecas/pecas.json', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('sem pecas.json'); return r.json(); }).then(function (j) {
      var lista = Array.isArray(j) ? j : (j && (j.pecas || j.lista || j.itens)) || (j && typeof j === 'object' ? Object.keys(j).map(function (k) { var v = j[k]; return typeof v === 'string' ? { id: k, glb: v } : Object.assign({ id: k }, v); }) : []);
      var c = Object.assign({}, base);
      (lista || []).forEach(function (x) { var u = urlDaPeca(x); if (!u) return; var t = tipoCorpo(x.tipo_maquina || x.tipo || x.id || x.slug || x.nome); c[t] = u; });
      pronto(c);
    }).catch(function () { pronto(base); });
  }

  /* ---------- three.js para o corpo (o mesmo three do modo 3D) ---------- */
  var T3 = { T: null, GLTFLoader: null, meshopt: null, carregando: null, falhou: false, cache: {} };
  function carregarTres(ok, erro) {
    if (T3.T) { ok(); return; }
    if (T3.falhou) { erro(); return; }
    if (T3.carregando) { T3.carregando.push([ok, erro]); return; }
    T3.carregando = [[ok, erro]];
    var base = window.COOP_REAL ? '/vendor/three/' : 'https://cdn.jsdelivr.net/npm/three@0.160.0/'; /* no app o three vem de dentro dele (funciona sem internet) */
    Promise.all([import(base + 'build/three.module.js'), import(base + 'examples/jsm/loaders/GLTFLoader.js'), import(base + 'examples/jsm/libs/meshopt_decoder.module.js').catch(function () { return {}; })])
      .then(function (m) { T3.T = m[0]; T3.GLTFLoader = m[1].GLTFLoader; T3.meshopt = m[2].MeshoptDecoder || null; var f = T3.carregando; T3.carregando = null; f.forEach(function (x) { x[0](); }); })
      .catch(function (e) { console.warn('[corpo] three.js não carregou:', e && e.message); T3.falhou = true; var f = T3.carregando; T3.carregando = null; f.forEach(function (x) { x[1](); }); });
  }
  function carregarGlb(url, fn) {
    var c = T3.cache[url];
    if (c && c.cena) { fn(c.cena); return; }
    if (c && c.falhou) { fn(null); return; }
    if (c) { c.espera.push(fn); return; }
    c = T3.cache[url] = { espera: [fn], cena: null, falhou: false };
    var ld = new T3.GLTFLoader();
    if (T3.meshopt && ld.setMeshoptDecoder) ld.setMeshoptDecoder(T3.meshopt);
    ld.load(url, function (g) { c.cena = g.scene; c.espera.splice(0).forEach(function (f) { f(c.cena); }); },
      undefined, function (e) { console.warn('[corpo] peça não carregou:', url, e && e.message); c.falhou = true; c.espera.splice(0).forEach(function (f) { f(null); }); });
  }

  /* forma simples de cada tipo (enquanto não há GLB): contorno fino, sem enfeite */
  function formaSimples(T, tipo) {
    var g = new T.Group(), mat = new T.MeshStandardMaterial({ color: 0x28324a, roughness: 0.62, metalness: 0.28, emissive: 0x2ad5e5, emissiveIntensity: 0 });
    function caixa(w, h, d, x, y, z) { var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x || 0, (y || 0) + h / 2, z || 0); g.add(m); return m; }
    function cil(r, h, x, y, z, deitado) { var m = new T.Mesh(new T.CylinderGeometry(r, r, h, 28), mat); m.position.set(x || 0, y || 0, z || 0); if (deitado) m.rotation.z = Math.PI / 2; g.add(m); return m; }
    switch (tipo) {
      case 'gaveta': caixa(0.62, 1.0, 0.6); [0.22, 0.52, 0.82].forEach(function (y) { caixa(0.5, 0.04, 0.02, 0, y, 0.31); }); break;
      case 'porta': caixa(0.08, 1.0, 0.1, -0.34); caixa(0.08, 1.0, 0.1, 0.34); caixa(0.76, 0.08, 0.1, 0, 1.0); var f = caixa(0.56, 0.9, 0.04, 0, 0.02, 0.1); f.rotation.y = -0.5; break;
      case 'robo': caixa(0.72, 0.42, 0.72); cil(0.26, 0.08, 0, 0.72, 0, false).rotation.x = Math.PI / 2; cil(0.18, 0.08, 0.28, 0.6, 0.1, false).rotation.x = Math.PI / 2; break;
      case 'deposito': caixa(0.96, 0.08, 0.5); caixa(0.96, 0.08, 0.5, 0, 0.36); [-0.46, -0.15, 0.15, 0.46].forEach(function (x) { caixa(0.04, 0.36, 0.5, x, 0.04); }); break;
      case 'tela': caixa(0.06, 0.3, 0.06); caixa(0.9, 0.56, 0.05, 0, 0.3); break;
      case 'portaria': caixa(0.56, 0.9, 0.56, -0.12); caixa(0.62, 0.05, 0.05, 0.34, 0.5); break;
      case 'cano': cil(0.12, 1.0, 0, 0.32, 0, true); cil(0.15, 0.06, -0.3, 0.32, 0, true); cil(0.15, 0.06, 0.3, 0.32, 0, true); break;
      case 'cofre': caixa(0.72, 0.72, 0.72); cil(0.14, 0.05, 0, 0.36, 0.37).rotation.x = Math.PI / 2; break;
      default: caixa(0.7, 0.7, 0.7);
    }
    g.userData.mat = mat;
    return g;
  }

  var CORPO_ESPACO = 1.55;
  function VistaCorpo(el, opcoes) {
    this.el = el; this.op = opcoes || {}; this.itens = {}; this.ordem = []; this.anims = []; this.pulsos = []; this.fiosObj = [];
    this.dados = null; this.pronto = false; this.falhou = false; this.renders = 0; this.motivos = {}; this.ganhou = []; this.raf = 0; this.catalogo = null;
    el.classList.add('v3c');
    el.innerHTML = '<canvas class="v3c-gl" aria-hidden="true"></canvas><div class="v3c-rotulos" aria-hidden="true"></div><p class="v3c-aviso">carregando o corpo…</p>';
    this.canvas = el.querySelector('canvas'); this.rotulosEl = el.querySelector('.v3c-rotulos'); this.aviso = el.querySelector('.v3c-aviso');
    var eu = this;
    carregarCatalogo(function (c) { eu.catalogo = c; carregarTres(function () { if (!eu.el) return; eu._montar(); }, function () { if (!eu.el) return; eu.falhou = true; eu._semTres(); }); });
  }
  var VC = VistaCorpo.prototype;
  VC._montar = function () {
    var T = T3.T, eu = this;
    try { this.gl = new T.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true }); }
    catch (e) { this.falhou = true; this._semTres(); return; }
    this.gl.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    this.gl.setClearColor(0x000000, 0);
    this.gl.outputColorSpace = T.SRGBColorSpace;
    this.cena = new T.Scene();
    this.cam = new T.OrthographicCamera(-5, 5, 3, -3, 0.1, 100);
    this.cam.position.set(9, 8.2, 9); this.cam.lookAt(0, 0.35, 0);
    this.cena.add(new T.HemisphereLight(0xa9bbff, 0x0a0f1e, 1.25));
    var sol = new T.DirectionalLight(0xffffff, 1.5); sol.position.set(5, 11, 7); this.cena.add(sol);
    var contra = new T.DirectionalLight(0x7ba4f0, 0.55); contra.position.set(-7, 4, -6); this.cena.add(contra);
    this.raiz = new T.Group(); this.cena.add(this.raiz);
    this.pronto = true;
    this.aviso.hidden = true;
    if (window.ResizeObserver) { this.ro = new ResizeObserver(function () { eu._medir(); eu.pedir('tamanho'); }); this.ro.observe(this.el); }
    this._visivel = function () { if (!document.hidden) eu.pedir('visivel'); };
    document.addEventListener('visibilitychange', this._visivel);
    this._medir();
    if (this.dados) this._sincronizar(false);
    this.pedir('montar');
  };
  VC._semTres = function () {
    /* sem three.js (sem internet): a lista das peças, em texto, no mesmo lugar */
    if (this.aviso) { this.aviso.hidden = false; this.aviso.textContent = 'o corpo em 3D precisa do three.js · ' + this._resumo(); }
  };
  VC._resumo = function () {
    var d = this.dados; if (!d) return '';
    var c = d.pecas.filter(function (p) { return p.estado === 'corpo'; }).length;
    return c + ' peças com corpo' + (d.pecas.length > c ? ' · ' + (d.pecas.length - c) + ' tracejadas' : '');
  };
  VC._medir = function () {
    if (!this.gl) return;
    var r = this.el.getBoundingClientRect(), w = Math.max(10, Math.round(r.width)), h = Math.max(10, Math.round(r.height));
    this.gl.setSize(w, h, false);
    this.w = w; this.h = h;
    this._enquadrar();
  };
  VC._posicao = function (i, n) {
    var cols = Math.max(2, Math.ceil(Math.sqrt(n * 1.4))), rows = Math.ceil(n / cols);
    return { x: (i % cols - (cols - 1) / 2) * CORPO_ESPACO, z: (Math.floor(i / cols) - (rows - 1) / 2) * CORPO_ESPACO };
  };
  VC._enquadrar = function () {
    if (!this.cam || !this.w) return;
    var T = T3.T, n = Math.max(1, this.ordem.length), a = this.w / this.h, eu = this;
    this.cam.left = -a; this.cam.right = a; this.cam.top = 1; this.cam.bottom = -1; this.cam.zoom = 1; this.cam.updateProjectionMatrix();
    this.cam.updateMatrixWorld();
    var mx = 0.01, my = 0.01, v = new T.Vector3();
    for (var i = 0; i < n; i++) {
      var p = this._posicao(i, n);
      [[-0.6, 0, -0.6], [0.6, 0, 0.6], [-0.6, 1.25, 0.6], [0.6, 1.25, -0.6], [0.6, 0, -0.6], [-0.6, 0, 0.6]].forEach(function (c) {
        v.set(p.x + c[0], c[1], p.z + c[2]).project(eu.cam);
        mx = Math.max(mx, Math.abs(v.x)); my = Math.max(my, Math.abs(v.y));
      });
    }
    this.cam.zoom = 0.92 / Math.max(mx, my);
    this.cam.updateProjectionMatrix();
  };
  VC.atualizar = function (dados) {
    this.dados = dados ? { nome: dados.nome, pecas: (dados.pecas || []).map(function (p) { return { id: p.id, tipo: p.tipo, nome: p.nome, estado: p.estado, ts: p.ts, por: p.por }; }), fios: (dados.fios || []).slice() } : null;
    if (this.pronto) this._sincronizar(true);
    else if (this.falhou) this._semTres();
    return this;
  };
  VC._sincronizar = function (animar) {
    if (!this.dados) return;
    animar = animar && !!this.sincronizado; this.sincronizado = true;
    var eu = this, T = T3.T, vistos = {}, mudouLayout = false, reduz = BC.util.movimentoReduzido() || document.hidden;
    this.dados.pecas.forEach(function (p) {
      vistos[p.id] = true;
      var it = eu.itens[p.id];
      if (!it) { it = eu._criar(p); eu.itens[p.id] = it; eu.ordem.push(p.id); mudouLayout = true; if (p.estado === 'corpo' && animar) eu._ganhar(it, reduz); else eu._estadoDireto(it, p.estado); }
      else if (it.estado !== p.estado) { if (p.estado === 'corpo') eu._ganhar(it, reduz || !animar); else eu._estadoDireto(it, p.estado); }
      it.p = p;
    });
    Object.keys(this.itens).forEach(function (id) { if (!vistos[id]) { eu.raiz.remove(eu.itens[id].g); delete eu.itens[id]; eu.ordem.splice(eu.ordem.indexOf(id), 1); mudouLayout = true; } });
    if (mudouLayout) { this.ordem.forEach(function (id, i) { var pos = eu._posicao(i, eu.ordem.length); eu.itens[id].g.position.set(pos.x, 0, pos.z); }); this._enquadrar(); }
    this._fios();
    this.pedir('dados');
  };
  VC._criar = function (p) {
    var T = T3.T, g = new T.Group(), tipo = tipoCorpo(p.tipo);
    var base = new T.Mesh(new T.BoxGeometry(1.2, 0.05, 1.2), new T.MeshStandardMaterial({ color: 0x161e2d, roughness: 0.9, metalness: 0.1 }));
    base.position.y = 0.025; g.add(base);
    var bordaBase = new T.LineSegments(new T.EdgesGeometry(base.geometry), new T.LineBasicMaterial({ color: 0x506b94, transparent: true, opacity: 0.55 }));
    bordaBase.position.copy(base.position); g.add(bordaBase);
    /* o contorno tracejado: a peça ainda não publicada */
    var caixa = new T.BoxGeometry(0.9, 0.95, 0.9); caixa.translate(0, 0.525, 0);
    var tracejo = new T.LineSegments(new T.EdgesGeometry(caixa), new T.LineDashedMaterial({ color: 0x7ba4f0, dashSize: 0.07, gapSize: 0.06, transparent: true, opacity: 0.95 }));
    tracejo.computeLineDistances(); g.add(tracejo);
    var corpo = new T.Group(); corpo.position.y = 0.05; g.add(corpo);
    var forma = formaSimples(T, tipo); corpo.add(forma);
    var it = { id: p.id, tipo: tipo, g: g, corpo: corpo, forma: forma, tracejo: tracejo, bordaBase: bordaBase, estado: null, luz: 0, glb: false, p: p };
    this.raiz.add(g);
    this._trocarPorGlb(it);
    return it;
  };
  VC._trocarPorGlb = function (it) {
    var url = this.catalogo && this.catalogo[it.tipo], eu = this;
    if (!url) return;
    carregarGlb(url, function (cena) {
      if (!cena || !eu.itens[it.id] || !eu.gl) return;
      var T = T3.T, c = cena.clone(true), box = new T.Box3().setFromObject(c), tam = new T.Vector3(), centro = new T.Vector3();
      box.getSize(tam); box.getCenter(centro);
      var k = 1.0 / Math.max(tam.x, tam.y, tam.z, 0.001);
      c.scale.setScalar(k); c.position.set(-centro.x * k, -box.min.y * k, -centro.z * k);
      c.traverse(function (o) { if (o.isMesh && o.material) { o.material = o.material.clone(); if (o.material.emissive) { o.material.emissive.setHex(0x2ad5e5); o.material.emissiveIntensity = 0; } } });
      it.corpo.remove(it.forma); it.forma = c; it.corpo.add(c); it.glb = true;
      eu.pedir('glb');
    });
  };
  VC._estadoDireto = function (it, estado) {
    it.estado = estado;
    it.corpo.visible = estado === 'corpo'; it.corpo.scale.setScalar(1);
    it.tracejo.visible = estado !== 'corpo'; it.tracejo.material.opacity = 0.95;
  };
  /* a peça ganha corpo: sobe do chão dentro do contorno tracejado, acende e esfria (1,2 s); o pulso corre pelos canos */
  VC._ganhar = function (it, direto) {
    it.estado = 'corpo';
    this.ganhou.push({ id: it.id, ts: Date.now() });
    if (this.ganhou.length > 20) this.ganhou.shift();
    it.luzAte = Date.now() + 6000;
    if (direto) { this._estadoDireto(it, 'corpo'); this.pedir('corpo'); return; }
    it.corpo.visible = true; it.corpo.scale.set(0.001, 0.001, 0.001); it.tracejo.visible = true;
    this.anims.push({ it: it, t0: performance.now(), dur: 1200 });
    var eu = this;
    setTimeout(function () { eu._pulsarDe(it.id); }, 700);
    this.pedir('corpo');
  };
  VC._fios = function () {
    var T = T3.T, eu = this;
    this.fiosObj.forEach(function (f) { eu.raiz.remove(f.linha); });
    this.fiosObj = [];
    (this.dados.fios || []).forEach(function (f) {
      var a = eu.itens[f[0]], b = eu.itens[f[1]];
      if (!a || !b) return;
      var pa = a.g.position.clone().setY(0.06), pb = b.g.position.clone().setY(0.06), meio = new T.Vector3(pa.x, 0.06, pb.z);
      var curva = new T.CatmullRomCurve3([pa, pa.clone().lerp(meio, 0.85), meio, meio.clone().lerp(pb, 0.15), pb], false, 'centripetal');
      var linha = new T.Line(new T.BufferGeometry().setFromPoints(curva.getPoints(40)), new T.LineBasicMaterial({ color: 0x506b94, transparent: true, opacity: 0.7 }));
      eu.raiz.add(linha);
      eu.fiosObj.push({ de: f[0], para: f[1], curva: curva, linha: linha });
    });
  };
  VC._pulsarDe = function (id) {
    if (!this.gl || BC.util.movimentoReduzido() || document.hidden) return;
    var T = T3.T, eu = this;
    this.fiosObj.filter(function (f) { return f.de === id || f.para === id; }).slice(0, 4).forEach(function (f) {
      var bola = new T.Mesh(new T.SphereGeometry(0.07, 12, 12), new T.MeshBasicMaterial({ color: 0x2ad5e5 }));
      eu.raiz.add(bola);
      f.linha.material.color.setHex(0x2ad5e5);
      eu.pulsos.push({ f: f, bola: bola, t0: performance.now(), dur: 900, volta: f.para === id });
    });
    this.pedir('pulso');
  };
  VC.pedir = function (motivo) {
    if (!this.gl) return;
    this.motivos[motivo || 'outro'] = (this.motivos[motivo || 'outro'] || 0) + 1; /* por que desenhou: só por dado, tamanho, peça que chegou ou animação de evento */
    if (this.raf) return;
    var eu = this;
    this.raf = requestAnimationFrame(function (t) { eu.raf = 0; eu._quadro(t); });
  };
  VC._quadro = function (t) {
    if (!this.gl || !this.el || !this.el.isConnected) return;
    var eu = this, vivo = false;
    this.anims = this.anims.filter(function (a) {
      var k = Math.max(0, Math.min(1, (t - a.t0) / a.dur)), e = 1 - Math.pow(1 - k, 4), it = a.it;
      it.corpo.scale.setScalar(Math.max(0.001, e));
      it.tracejo.material.opacity = 0.95 * (1 - k);
      it.corpo.traverse(function (o) { if (o.material && o.material.emissive) o.material.emissiveIntensity = 0.9 * (1 - k); });
      if (k >= 1) { eu._estadoDireto(it, 'corpo'); return false; }
      vivo = true; return true;
    });
    this.pulsos = this.pulsos.filter(function (p) {
      var k = Math.max(0, Math.min(1, (t - p.t0) / p.dur));
      p.bola.position.copy(p.f.curva.getPoint(p.volta ? 1 - k : k)).setY(0.12);
      if (k >= 1) { eu.raiz.remove(p.bola); p.f.linha.material.color.setHex(0x506b94); return false; }
      vivo = true; return true;
    });
    this.gl.render(this.cena, this.cam);
    this.renders++;
    this._rotulos();
    if (vivo) this.pedir('animacao');
  };
  /* rótulos em HTML (nítidos): só das peças tracejadas e das que ganharam corpo há pouco (esfriam em 6 s) */
  VC._rotulos = function () {
    var T = T3.T, eu = this, agora = Date.now(), v = new T.Vector3(), h = '';
    this.ordem.forEach(function (id) {
      var it = eu.itens[id], recente = it.luzAte && it.luzAte > agora;
      if (it.estado === 'corpo' && !recente) return;
      v.set(it.g.position.x, 1.25, it.g.position.z).project(eu.cam);
      var x = (v.x + 1) / 2 * 100, y = (1 - v.y) / 2 * 100;
      h += '<span class="v3c-rotulo' + (it.estado === 'corpo' ? ' ganhou' : ' tracejada') + '" style="left:' + x.toFixed(2) + '%;top:' + y.toFixed(2) + '%">' + esc(it.p.nome) + '</span>';
    });
    if (this.rotulosEl.innerHTML !== h) this.rotulosEl.innerHTML = h;
    if (h && !this._esfriar) this._esfriar = setTimeout(function () { eu._esfriar = null; eu.pedir('esfriar'); }, 6200);
  };
  VC.medidas = function () {
    var d = this.dados || { pecas: [] }, eu = this;
    return { pronto: this.pronto, semTres: this.falhou, total: d.pecas.length, comCorpo: d.pecas.filter(function (p) { return p.estado === 'corpo'; }).length,
      tracejadas: d.pecas.filter(function (p) { return p.estado === 'tracejada'; }).length,
      emCena: this.ordem.length, glb: this.ordem.filter(function (id) { return eu.itens[id].glb; }), renders: this.renders,
      ganhou: this.ganhou.slice(), animando: this.anims.length + this.pulsos.length, motivos: JSON.parse(JSON.stringify(this.motivos)) };
  };
  VC.destruir = function () {
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.ro) this.ro.disconnect();
    if (this._visivel) document.removeEventListener('visibilitychange', this._visivel);
    clearTimeout(this._esfriar);
    try { if (this.gl) this.gl.dispose(); } catch (e) { /* já */ }
    this.gl = null; this.el = null; this.itens = {}; this.ordem = [];
  };

  BC.visual3d.corpo = function (el, opcoes) { return new VistaCorpo(el, opcoes); };
  BC.visual3d.corpoDoEstado = function (pjId) { var c = semearCorpo(); return c.projetos[pjId || c.atual] || null; };
  BC.visual3d.catalogo = function (fn) { carregarCatalogo(fn || function () {}); return catalogo; };
  BC.visual3d.tipoCorpo = tipoCorpo;
})(window.BC);
