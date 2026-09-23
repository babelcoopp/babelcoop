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
    var base = 'https://cdn.jsdelivr.net/npm/three@0.160.0/';
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
})(window.BC);
