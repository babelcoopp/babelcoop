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
     o quadro só é desenhado quando algo muda (peça nova, peça que ganha corpo, pulso no cano, efeito de montar, tamanho).

     Estado compartilhado (vai para todas as janelas pela loja):
       estado.corpo = { atual: <projeto>, projetos: { <projeto>: { nome, pecas: [{ id, tipo, nome, estado: 'corpo'|'tracejada', ts, por, banco?, bancoEm? }],
                        fios: [[de, para]], publicacoes: [{ ts, por, ids, versao }] } } }
     Ações (BC.loja.fazer): 'corpoPeca' {projeto, nome?, pecas:[{id,tipo,nome,banco?,bancoEm?}], sai?:[ids], fiosSai?:[[de,para]]} → peças tracejadas
                            (ainda não publicadas); a do banco local já tem corpo; sai/fiosSai tiram da parede só o que é do banco e saiu dele
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

  /* peças novas que ainda não foram publicadas: nascem tracejadas na parede. A do banco local existe de verdade: entra com corpo
     e com o dono do banco (a TV mostra "no banco local"); peça que já estava tracejada e é do banco ganha corpo; o que saiu do
     banco (sai, fiosSai) sai da parede. Peça só de desenho nunca sai por aqui. */
  LA.corpoPeca = function (quem, dados) {
    if (!dados || !dados.projeto || !Array.isArray(dados.pecas)) return;
    var pj = corpoProjeto(String(dados.projeto), dados.nome), mudou = 0, agora = Date.now();
    dados.pecas.forEach(function (p) {
      if (!p || !p.id) return;
      var x = pecaDoCorpo(pj, String(p.id)), bd = p.banco === true, dono = bd && p.bancoEm ? String(p.bancoEm).slice(0, 64) : null;
      if (!x) {
        x = { id: String(p.id), tipo: tipoCorpo(p.tipo), nome: String(p.nome || p.id).slice(0, 40), estado: p.publicada || bd ? 'corpo' : 'tracejada', ts: agora, por: quem };
        if (bd) { x.banco = true; if (dono) x.bancoEm = dono; }
        pj.pecas.push(x); mudou++;
        return;
      }
      if (bd && (!x.banco || x.estado !== 'corpo' || (dono && x.bancoEm !== dono))) { x.banco = true; x.estado = 'corpo'; if (dono) x.bancoEm = dono; x.ts = agora; mudou++; }
    });
    var sai = {};
    (Array.isArray(dados.sai) ? dados.sai : []).forEach(function (id) { var x = pecaDoCorpo(pj, String(id)); if (x && x.banco) sai[x.id] = true; });
    if (Object.keys(sai).length) {
      pj.pecas = pj.pecas.filter(function (x) { return !sai[x.id]; });
      pj.fios = pj.fios.filter(function (f) { return !sai[f[0]] && !sai[f[1]]; });
      mudou++;
    }
    (Array.isArray(dados.fiosSai) ? dados.fiosSai : []).forEach(function (f) {
      if (!Array.isArray(f)) return;
      var a = pecaDoCorpo(pj, String(f[0])), b = pecaDoCorpo(pj, String(f[1])), n = pj.fios.length;
      if (!a || !b || !a.banco || !b.banco) return;
      pj.fios = pj.fios.filter(function (x) { return !((x[0] === a.id && x[1] === b.id) || (x[0] === b.id && x[1] === a.id)); });
      if (pj.fios.length !== n) mudou++;
    });
    var nFios = pj.fios.length;
    juntarFios(pj, dados.fios);
    if (!mudou && pj.fios.length === nFios) return;
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
      .map(function (p) { return { id: String(p.id), tipo: p.tipo, nome: p.nome || p.id, publicada: p.publicada !== false && p.pronta !== false, banco: p.banco === true, bancoEm: p.banco ? p.bancoEm || p.estacao || p.por || null : null }; });
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
      var pj = c && c.projetos && c.projetos[pjId], naMaquina = {}, fiosM = {};
      pecas.forEach(function (p) { naMaquina[p.id] = true; });
      /* nova na parede, ou do banco e ainda tracejada (ou com outro dono) na parede */
      var novas = pecas.filter(function (p) { var x = pj && pecaDoCorpo(pj, p.id); return !x || (p.banco && (!x.banco || x.estado !== 'corpo' || (p.bancoEm && x.bancoEm !== p.bancoEm))); });
      /* do banco na parede e fora da Máquina desta janela (a Máquina só tira peça do banco quando ela sai do banco) */
      var sai = pj ? pj.pecas.filter(function (x) { return x.banco && !naMaquina[x.id]; }).map(function (x) { return x.id; }) : [];
      fiosDaMaquina(pjId).forEach(function (f) { fiosM[f[0] + '>' + f[1]] = fiosM[f[1] + '>' + f[0]] = true; });
      var fiosSai = pj ? pj.fios.filter(function (f) { var a = pecaDoCorpo(pj, f[0]), b = pecaDoCorpo(pj, f[1]); return a && b && a.banco && b.banco && naMaquina[a.id] && naMaquina[b.id] && !fiosM[f[0] + '>' + f[1]]; }) : [];
      if ((!novas.length && !sai.length && !fiosSai.length) || ponteAgendada) return;
      ponteAgendada = true;
      setTimeout(function () { ponteAgendada = false; L().fazer('corpoPeca', { projeto: pjId, nome: nomeDoProjeto(pjId), pecas: novas, fios: fiosDaMaquina(pjId), sai: sai, fiosSai: fiosSai }); }, 0);
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

  /* os dois modos da Estação na cena: Tech (escuro, o de sempre: o palco aparece por trás) e Vibe (papel Latte, alumínio claro
     com sombra suave, fios na cor da marca mais escura). Troca ao vivo pelo atributo data-tema-estacao, sem recriar a cena */
  var PALETA = {
    tech: { fundo: null, base: 0x161e2d, borda: 0x506b94, tracejo: 0x7ba4f0, fio: 0x506b94, ceu: 0xa9bbff, terra: 0x0a0f1e, hemi: 1.25, sol: 1.5, contra: 0x7ba4f0, contraI: 0.55, aluminio: 0 },
    vibe: { fundo: 0xfff8e7, base: 0xece3cc, borda: 0x7d7a85, tracejo: 0x3a63c2, fio: 0x5a44a8, ceu: 0xfffaf0, terra: 0x9c907a, hemi: 1.05, sol: 1.7, contra: 0xffe2b8, contraI: 0.22, aluminio: 0.8, grade: [0xe6dcc2, 0xefe7d2] }
  };
  var ALUMINIO = 0xcdd2da, ORIGINAL = new WeakMap(); /* material → cor, metal, rugosidade e textura do Tech */
  function modoVibe() { var h = document.documentElement; return h.getAttribute('data-tema-estacao') === 'claro' && (h.getAttribute('data-vista') || 'estacao') === 'estacao'; }
  var texSombra = null;
  function sombraTex(T) {
    if (texSombra) return texSombra;
    var cv = document.createElement('canvas'), ctx = cv.getContext('2d'); cv.width = cv.height = 128;
    var g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
    g.addColorStop(0, 'rgba(70,55,30,0.30)'); g.addColorStop(0.55, 'rgba(70,55,30,0.14)'); g.addColorStop(1, 'rgba(70,55,30,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    texSombra = new T.CanvasTexture(cv); texSombra.colorSpace = T.SRGBColorSpace;
    return texSombra;
  }

  var CORPO_ESPACO = 1.55;
  function VistaCorpo(el, opcoes) {
    this.el = el; this.op = opcoes || {}; this.itens = {}; this.ordem = []; this.anims = []; this.pulsos = []; this.fiosObj = [];
    this.dados = null; this.pronto = false; this.falhou = false; this.renders = 0; this.motivos = {}; this.ganhou = []; this.raf = 0; this.catalogo = null;
    this.efeitos = []; this.fxObj = 0; this.fxRotulos = []; this.reservas = {}; /* efeitos de montar (maquina-efeitos.js) */
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
    this.camBase = this.cam.position.clone(); /* o foco do efeito "nascer" desloca a câmera e volta para cá */
    var hemi = new T.HemisphereLight(0xa9bbff, 0x0a0f1e, 1.25); this.cena.add(hemi);
    var sol = new T.DirectionalLight(0xffffff, 1.5); sol.position.set(5, 11, 7); this.cena.add(sol);
    var contra = new T.DirectionalLight(0x7ba4f0, 0.55); contra.position.set(-7, 4, -6); this.cena.add(contra);
    this.luzes = { hemi: hemi, sol: sol, contra: contra };
    this.raiz = new T.Group(); this.cena.add(this.raiz);
    this.pronto = true;
    this.aviso.hidden = true;
    this.pal = null; this.vibe = false; /* pal nulo: o primeiro _tema aplica tudo, inclusive as cores globais dos efeitos */
    this._tema();
    this._mo = new MutationObserver(function () { eu._tema(); });
    this._mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema-estacao', 'data-vista'] });
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
    if (this.camBase) this.cam.position.copy(this.camBase); /* mede sempre da câmera parada, mesmo no meio de um foco */
    this.cam.updateMatrixWorld();
    var mx = 0.01, my = 0.01, v = new T.Vector3();
    for (var i = 0; i < n; i++) {
      var p = this._posicao(i, n);
      [[-0.6, 0, -0.6], [0.6, 0, 0.6], [-0.6, 1.25, 0.6], [0.6, 1.25, -0.6], [0.6, 0, -0.6], [-0.6, 0, 0.6]].forEach(function (c) {
        v.set(p.x + c[0], c[1], p.z + c[2]).project(eu.cam);
        mx = Math.max(mx, Math.abs(v.x)); my = Math.max(my, Math.abs(v.y));
      });
    }
    /* o rótulo (nome da peça) fica acima do topo da peça e centrado nela: reserva ~26 px em cima e ~70 px de cada lado,
       senão o de cima corta quando o painel de baixo abre e o palco encolhe */
    var zy = (0.96 - 52 / this.h) / my, zx = (0.96 - 140 / this.w) / mx;
    this.cam.zoom = Math.max(0.05, Math.min(0.92 / Math.max(mx, my), zy, zx));
    this.zoomBase = this.cam.zoom;
    this.cam.updateProjectionMatrix();
  };
  VC.atualizar = function (dados) {
    /* banco:true = a peça existe num banco local: tem corpo (nunca tracejada) e leva o selo "no banco local"; de outra Estação,
       "no banco local de <nome>" (bancoDe, da Máquina; ou bancoEm, o id do dono, da parede da TV) */
    this.dados = dados ? { nome: dados.nome, pecas: (dados.pecas || []).map(function (p) {
      var de = p.bancoDe || (p.banco && p.bancoEm && p.bancoEm !== L().eu ? L().nome(p.bancoEm) : null);
      return { id: p.id, tipo: p.tipo, nome: p.nome, estado: p.banco ? 'corpo' : p.estado, ts: p.ts, por: p.por,
        banco: !!p.banco, bancoDe: p.banco && de ? String(de) : null, linhas: typeof p.linhas === 'number' && isFinite(p.linhas) ? p.linhas : null }; }), fios: (dados.fios || []).slice() } : null;
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
      it.bordaBase.material.color.setHex(p.banco ? FX.ciano : eu.pal.borda);
    });
    Object.keys(this.itens).forEach(function (id) { if (!vistos[id]) { eu.raiz.remove(eu.itens[id].g); delete eu.itens[id]; eu.ordem.splice(eu.ordem.indexOf(id), 1); mudouLayout = true; } });
    if (mudouLayout) { this.ordem.forEach(function (id, i) { var pos = eu._posicao(i, eu.ordem.length); eu.itens[id].g.position.set(pos.x, 0, pos.z); }); this._enquadrar(); }
    this._fios();
    if (Object.keys(this.reservas).length) this._aplicarReservas();
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
    /* a sombra suave no papel (só no Vibe): um borrão sob a base, puxado para longe do sol */
    var sombra = new T.Mesh(new T.PlaneGeometry(1.75, 1.75), new T.MeshBasicMaterial({ map: sombraTex(T), transparent: true, depthWrite: false }));
    sombra.rotation.x = -Math.PI / 2; sombra.position.set(-0.1, 0.002, -0.12); sombra.visible = false; g.add(sombra);
    var it = { id: p.id, tipo: tipo, g: g, corpo: corpo, forma: forma, base: base, tracejo: tracejo, bordaBase: bordaBase, sombra: sombra, estado: null, luz: 0, glb: false, p: p };
    this.raiz.add(g);
    this._pintar(it);
    this.itens[p.id] = it; /* antes do GLB: vindo do cache ele chega na hora e confere se a peça está na cena */
    this._trocarPorGlb(it);
    return it;
  };
  /* o modo (Tech ou Vibe) na cena já montada: fundo, grade, luzes, as peças, os fios e as cores dos efeitos */
  VC._tema = function () {
    if (!this.gl) return;
    var vibe = modoVibe(), T = T3.T, eu = this;
    Object.assign(FX, vibe ? FX_VIBE : FX_TECH); /* FX é do módulo: sempre no modo de agora, mesmo sem mudança nesta vista */
    if (vibe === this.vibe && this.pal) return;
    var P = this.pal = vibe ? PALETA.vibe : PALETA.tech; this.vibe = vibe;
    if (P.fundo != null) this.gl.setClearColor(P.fundo, 1); else this.gl.setClearColor(0x000000, 0);
    var L = this.luzes; L.hemi.color.setHex(P.ceu); L.hemi.groundColor.setHex(P.terra); L.hemi.intensity = P.hemi;
    L.sol.intensity = P.sol; L.contra.color.setHex(P.contra); L.contra.intensity = P.contraI;
    if (P.grade && !this.grade) { this.grade = new T.GridHelper(80, 160, P.grade[0], P.grade[1]); this.grade.position.y = -0.001; this.cena.add(this.grade); }
    if (this.grade) this.grade.visible = !!P.grade;
    this.ordem.forEach(function (id) { eu._pintar(eu.itens[id]); });
    this.fiosObj.forEach(function (f) { f.linha.material.color.setHex(P.fio); });
    if (this.el) this.el.classList.toggle('v3c-vibe', vibe);
    this.pedir('tema');
  };
  /* uma peça no modo atual. O original de cada material fica guardado: o Tech volta exatamente ao que era.
     No Vibe a textura escura dos GLB sai (alumínio liso, as luzes desenham a forma) e volta no Tech */
  VC._pintar = function (it) {
    var P = this.pal || PALETA.tech, T = T3.T, alu = new T.Color(ALUMINIO);
    it.base.material.color.setHex(P.base);
    it.bordaBase.material.color.setHex(it.p && it.p.banco ? FX.ciano : P.borda);
    it.tracejo.material.color.setHex(P.tracejo);
    it.sombra.visible = !!P.aluminio;
    it.corpo.traverse(function (o) {
      var m = o.material;
      if (!o.isMesh || !m || Array.isArray(m)) return;
      var u = ORIGINAL.get(m);
      if (!u) { u = { c: m.color ? m.color.getHex() : null, me: m.metalness, ro: m.roughness, mapa: m.map || null }; ORIGINAL.set(m, u); }
      var mapa = P.aluminio ? null : u.mapa;
      if ((m.map || null) !== mapa) { m.map = mapa; m.needsUpdate = true; }
      if (m.color && u.c != null) { m.color.setHex(u.c); if (P.aluminio) m.color.lerp(alu, P.aluminio); }
      if (typeof u.me === 'number') m.metalness = P.aluminio ? Math.min(u.me, 0.3) : u.me;
      if (typeof u.ro === 'number') m.roughness = P.aluminio ? Math.max(u.ro, 0.45) : u.ro;
      if (m.emissive && !m.userData.fxRepouso) m.emissive.setHex(FX.ciano);
    });
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
      eu._pintar(it);
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
    /* reservada = vai nascer caindo pelo efeito "nascer": aqui só ganha o corpo, sem subir do chão nem pulso */
    if (direto || this._reservada(it.id)) { this._estadoDireto(it, 'corpo'); this.pedir('corpo'); return; }
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
      var linha = new T.Line(new T.BufferGeometry().setFromPoints(curva.getPoints(40)), new T.LineBasicMaterial({ color: eu.pal.fio, transparent: true, opacity: 0.7 }));
      eu.raiz.add(linha);
      eu.fiosObj.push({ de: f[0], para: f[1], curva: curva, linha: linha });
    });
  };
  VC._pulsarDe = function (id) {
    if (!this.gl || BC.util.movimentoReduzido() || document.hidden) return;
    var T = T3.T, eu = this;
    this.fiosObj.filter(function (f) { return (f.de === id || f.para === id) && !eu._reservada(f.de) && !eu._reservada(f.para); }).slice(0, 4).forEach(function (f) {
      var bola = new T.Mesh(new T.SphereGeometry(0.07, 12, 12), new T.MeshBasicMaterial({ color: FX.ciano }));
      eu.raiz.add(bola);
      f.linha.material.color.setHex(FX.ciano);
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
      if (k >= 1) { eu.raiz.remove(p.bola); p.f.linha.material.color.setHex(eu.pal.fio); return false; }
      vivo = true; return true;
    });
    /* efeitos de montar: cada um anda pelo seu relógio; o que acabou limpa a cena antes deste quadro (nada fica) */
    var acabados = [];
    this.efeitos = this.efeitos.filter(function (fx) {
      if (fx.parado) return true; /* só cor: quem encerra é o relógio dele, sem quadro por quadro */
      var k = Math.max(0, Math.min(1, (t - fx.t0) / fx.dur));
      try { fx.passo(k); } catch (e) { console.warn('[efeito]', e); k = 1; }
      if (k >= 1) { acabados.push(fx); return false; }
      vivo = true; return true;
    });
    acabados.forEach(function (fx) { fx.fim(); });
    this.gl.render(this.cena, this.cam);
    this.renders++;
    this._rotulos();
    if (vivo) this.pedir('animacao');
  };
  /* rótulos em HTML (nítidos): das peças tracejadas, das que ganharam corpo há pouco (esfriam em 6 s), das que vieram do banco
     (fixo, com o selo "no banco local") e o texto de um efeito de erro enquanto ele dura. Só o que esfria arma o relógio. */
  VC._rotulos = function () {
    var T = T3.T, eu = this, agora = Date.now(), v = new T.Vector3(), h = '', esfria = false;
    function lugar() { return 'left:' + ((v.x + 1) / 2 * 100).toFixed(2) + '%;top:' + ((1 - v.y) / 2 * 100).toFixed(2) + '%'; }
    this.ordem.forEach(function (id) {
      var it = eu.itens[id], recente = it.luzAte && it.luzAte > agora, banco = !!(it.p && it.p.banco), acende = it.acendeAte && it.acendeAte > agora;
      if (!it.g.visible || (it.estado === 'corpo' && !recente && !banco)) return;
      if (recente) esfria = true;
      v.set(it.g.position.x, 1.25 + it.g.position.y, it.g.position.z).project(eu.cam);
      var selo = banco ? '<small>no banco local' + (it.p.bancoDe ? ' de ' + esc(it.p.bancoDe) : '') + (it.p.linhas != null ? ' · ' + it.p.linhas + (it.p.linhas === 1 ? ' linha' : ' linhas') : '') + '</small>' : '';
      h += '<span class="v3c-rotulo' + (it.estado === 'corpo' ? (recente ? ' ganhou' : '') : ' tracejada') + (banco ? ' banco' + (it.p.bancoDe ? ' outra' : '') : '') + (acende ? ' acende' : '') + '" style="' + lugar() + '">' + esc(it.p.nome) + selo + '</span>';
    });
    this.fxRotulos.forEach(function (r) { v.copy(r.pos).project(eu.cam); h += '<span class="v3c-rotulo ' + r.classe + '" style="' + lugar() + '">' + esc(r.texto) + '</span>'; });
    if (this.rotulosEl.innerHTML !== h) this.rotulosEl.innerHTML = h;
    if (esfria && !this._esfriar) this._esfriar = setTimeout(function () { eu._esfriar = null; eu.pedir('esfriar'); }, 6200);
  };
  VC.medidas = function () {
    var d = this.dados || { pecas: [] }, eu = this;
    return { pronto: this.pronto, semTres: this.falhou, total: d.pecas.length, comCorpo: d.pecas.filter(function (p) { return p.estado === 'corpo'; }).length,
      tracejadas: d.pecas.filter(function (p) { return p.estado === 'tracejada'; }).length,
      emCena: this.ordem.length, glb: this.ordem.filter(function (id) { return eu.itens[id].glb; }), renders: this.renders,
      ganhou: this.ganhou.slice(), animando: this.anims.length + this.pulsos.length + this.efeitos.length, motivos: JSON.parse(JSON.stringify(this.motivos)),
      efeitos: this.efeitos.map(function (fx) { return fx.tipo; }), fxObjetos: this.fxObj, reservadas: Object.keys(this.reservas).length };
  };
  VC.destruir = function () {
    var fxs = this.efeitos; this.efeitos = [];
    fxs.forEach(function (fx) { try { fx.fim('a vista fechou no meio'); } catch (e) { /* já */ } });
    clearTimeout(this._reservaTimer);
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.ro) this.ro.disconnect();
    if (this._visivel) document.removeEventListener('visibilitychange', this._visivel);
    clearTimeout(this._esfriar);
    if (this._mo) this._mo.disconnect();
    try { if (this.gl) this.gl.dispose(); } catch (e) { /* já */ }
    this.gl = null; this.el = null; this.itens = {}; this.ordem = [];
  };

  /* =====================================================================================
     EFEITOS DE MONTAR (quem chama é prototipo/maquina-efeitos.js, peça por peça, um de cada vez).
     "Pensa lego, pensa minecraft": a peça do banco cai e encaixa, o fio se desenha e um pulso corre até o pino,
     o cadeado fecha em volta da gaveta, as linhas entram voando, o erro treme em vermelho.
     Leis: cada efeito dura ≤ ~1 s e chama pronto() no fim; o laço de quadros é o mesmo pedir/_quadro e só vive
     enquanto há efeito; no fim tudo o que ele criou sai da cena (geometria e material liberados).
     Sem movimento (prefers-reduced-motion ou efeitos desligados no organismo): só um clarão de cor, sem deslocamento.
     ===================================================================================== */
  /* Tech = a luz somada no escuro; Vibe (papel claro) = tinta: cores um degrau mais escuras e mistura normal (somar luz some no bege) */
  var FX_TECH = { roxo: 0xa376e9, ciano: 0x2ad5e5, erro: 0xff6b6b, fio: 0x506b94, ambar: 0xf2a65a, branco: 0xffffff, pulso: 0xe8fdff, soma: true };
  var FX_VIBE = { roxo: 0x6d3fb8, ciano: 0x08707f, erro: 0xc8323a, fio: 0x5a44a8, ambar: 0x9a5a00, branco: 0x1c2331, pulso: 0x0b5563, soma: false };
  var FX = Object.assign({}, FX_TECH);
  function mistura(T) { return FX.soma ? T.AdditiveBlending : T.NormalBlending; }
  function semMovimento() {
    var o = BC.organismo;
    if (o && o.versao && typeof o.semMovimento === 'function') { try { return !!o.semMovimento(); } catch (e) { /* segue */ } }
    return U.movimentoReduzido();
  }
  function suave(k) { return k * k * (3 - 2 * k); }
  function saida(k) { return 1 - Math.pow(1 - k, 3); }
  function entre(k, a, b) { return Math.max(0, Math.min(1, (k - a) / (b - a))); }
  /* o que o efeito cria: entra na raiz e sai no fim, com geometria e material liberados */
  function kitFx(eu) {
    var objs = [], recursos = [];
    return {
      por: function (o) { eu.raiz.add(o); objs.push(o); eu.fxObj++; return o; },
      rec: function (r) { recursos.push(r); return r; },
      limpar: function () {
        objs.forEach(function (o) { if (o.parent) o.parent.remove(o); eu.fxObj--; });
        recursos.forEach(function (r) { try { r.dispose(); } catch (e) { /* já */ } });
        objs = []; recursos = [];
      }
    };
  }
  /* o brilho de uma peça: o repouso fica anotado no próprio material, então dois efeitos na mesma peça voltam ao mesmo lugar */
  function emissivos(raiz) {
    var lista = [];
    raiz.traverse(function (o) {
      var m = o.material;
      if (!m || Array.isArray(m) || !m.emissive || lista.some(function (x) { return x.m === m; })) return;
      var r = m.userData.fxRepouso || (m.userData.fxRepouso = { c: m.emissive.getHex(), i: m.emissiveIntensity });
      lista.push({ m: m, c: r.c, i: r.i });
    });
    return lista;
  }
  function brilhar(lista, cor, i) { lista.forEach(function (x) { x.m.emissive.copy(cor); x.m.emissiveIntensity = i; }); }
  function repousar(lista) { lista.forEach(function (x) { x.m.emissive.setHex(x.c); x.m.emissiveIntensity = x.i; delete x.m.userData.fxRepouso; }); }

  /* anima UMA coisa e chama pronto({tocou, motivo}) no fim. ef: {tipo:'nascer'|'fio'|'cadeado'|'dados'|'erro', peca?, de?, para?, n?, texto?,
     abre? (cadeado que abre), ritmo? (0,3–1: fração da duração, quando a fila está longa)}. Devolve false (e chama pronto na hora)
     quando não há o que animar. */
  VC.efeito = function (ef, pronto) {
    var eu = this, feito = false;
    function acabar(tocou, motivo) { if (feito) return; feito = true; if (typeof pronto === 'function') { try { pronto({ tocou: tocou, motivo: motivo || '' }); } catch (e) { console.warn('[efeito]', e); } } }
    if (!ef || !this.gl || !this.raiz) { acabar(false, 'sem 3D'); return false; }
    Object.assign(FX, this.vibe ? FX_VIBE : FX_TECH); /* as cores do efeito seguem o modo desta vista */
    var it = ef.peca != null ? this.itens[ef.peca] : null, parado = semMovimento() || document.hidden, fx = null;
    if (ef.tipo === 'fio') { if (this.itens[ef.de] && this.itens[ef.para]) fx = this._fxFio(ef, parado); }
    else if (ef.tipo === 'erro') fx = this._fxErro(ef, it, parado);
    else if (it && ef.tipo === 'nascer') fx = this._fxNascer(ef, it, parado);
    else if (it && ef.tipo === 'cadeado') fx = this._fxCadeado(ef, it, parado);
    else if (it && ef.tipo === 'dados') fx = this._fxDados(ef, it, parado);
    if (!fx) { acabar(false, /^(nascer|fio|cadeado|dados)$/.test(ef.tipo) ? 'peça fora da cena' : 'tipo desconhecido'); return false; }
    var ritmo = +ef.ritmo;
    if (!parado && ritmo > 0 && ritmo < 1) fx.dur = Math.max(180, Math.round(fx.dur * ritmo)); /* o passo anda por k (0..1): só fica mais curto */
    fx.tipo = ef.tipo; fx.t0 = performance.now(); fx.parado = parado;
    fx.fim = function (motivo) { clearTimeout(fx.guarda); try { fx.limpar(); } catch (e) { console.warn('[efeito]', e); } acabar(true, motivo || (parado ? 'sem movimento: só cor' : '')); };
    this.efeitos.push(fx);
    /* o relógio de guarda: aba escondida ou quadro parado (sem rAF) não prendem a fila nem deixam objeto na cena */
    fx.guarda = setTimeout(function () {
      var i = eu.efeitos.indexOf(fx); if (i < 0) return;
      eu.efeitos.splice(i, 1); fx.fim(parado ? '' : 'terminou pelo relógio'); eu.pedir('efeito');
    }, fx.dur + (parado ? 0 : 1500));
    fx.passo(parado ? 1 : 0);
    this.pedir('efeito');
    return true;
  };
  /* a peça que estava subindo do chão (_ganhar) termina já: o efeito toma conta dela */
  VC._encerrarGanho = function (it) {
    var tinha = false;
    this.anims = this.anims.filter(function (a) { if (a.it !== it) return true; tinha = true; return false; });
    if (!tinha) return;
    it.corpo.traverse(function (o) { if (o.material && o.material.emissive) o.material.emissiveIntensity = 0; });
    this._estadoDireto(it, 'corpo');
  };
  /* o foco: a câmera anda um pouco na direção da peça e aproxima (env 0..1); env 0 = de volta ao lugar */
  VC._focar = function (x, z, env) {
    if (!this.cam || !this.camBase) return;
    this.cam.position.set(this.camBase.x + x * 0.35 * env, this.camBase.y, this.camBase.z + z * 0.35 * env);
    this.cam.zoom = (this.zoomBase || this.cam.zoom) * (1 + 0.14 * env);
    this.cam.updateProjectionMatrix();
  };

  /* nascer: cai do alto e ENCAIXA (queda, quique, achatada de lego), anel de luz no chão, faíscas subindo, rótulo aceso, foco da câmera */
  VC._fxNascer = function (ef, it, parado) {
    var T = T3.T, eu = this, kit = kitFx(this), cor = new T.Color(), roxo = new T.Color(FX.roxo), ciano = new T.Color(FX.ciano);
    this._encerrarGanho(it);
    this.liberar([it.id]);
    var em = emissivos(it.corpo), agora = Date.now();
    it.luzAte = agora + 6000; it.acendeAte = agora + (parado ? 420 : 1100);
    if (parado) return { dur: 420, passo: function () { brilhar(em, ciano, 1.1); }, limpar: function () { repousar(em); it.acendeAte = 0; } };
    var ALTO = 2.6, IMP = 0.5, dur = 900;
    var anel = kit.por(new T.Mesh(kit.rec(new T.RingGeometry(0.52, 0.64, 48)), kit.rec(new T.MeshBasicMaterial({ color: FX.roxo, transparent: true, opacity: 0, blending: mistura(T), depthWrite: false, side: T.DoubleSide }))));
    anel.rotation.x = -Math.PI / 2; anel.visible = false;
    var N = 28, pos = new Float32Array(N * 3), cores = new Float32Array(N * 3), ini = [];
    for (var i = 0; i < N; i++) {
      var a = (i / N) * Math.PI * 2 + (i % 3) * 0.4, r = 0.42 + (i % 4) * 0.05, fora = 0.45 + (i % 5) * 0.12;
      ini.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, vx: Math.cos(a) * fora, vz: Math.sin(a) * fora, vy: 2.1 + ((i * 37) % 10) * 0.16 });
      cor.copy(roxo).lerp(ciano, (i % 4) / 3); if (i % 7 === 0) cor.lerp(new T.Color(FX.branco), 0.6);
      cores[i * 3] = cor.r; cores[i * 3 + 1] = cor.g; cores[i * 3 + 2] = cor.b;
    }
    var geo = kit.rec(new T.BufferGeometry()); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(cores, 3));
    var pm = kit.rec(new T.PointsMaterial({ size: 5, sizeAttenuation: false, vertexColors: true, transparent: true, blending: mistura(T), depthWrite: false }));
    var faiscas = kit.por(new T.Points(geo, pm)); faiscas.visible = false; faiscas.frustumCulled = false;
    return {
      dur: dur,
      passo: function (k) {
        var x = it.g.position.x, z = it.g.position.z, y = 0, sq = 0, r = k < IMP ? 0 : (k - IMP) / (1 - IMP);
        if (k < IMP) { var q = k / IMP; y = ALTO * (1 - q * q); } /* cai acelerando */
        else {
          if (k < 0.74) y = 0.2 * Math.sin(Math.PI * (k - IMP) / 0.24); /* quica */
          else if (k < 0.86) y = 0.05 * Math.sin(Math.PI * (k - 0.74) / 0.12);
          sq = Math.exp(-(k - IMP) * 16) * Math.cos((k - IMP) * 30); /* achata no encaixe e volta */
        }
        it.g.position.y = y;
        it.g.scale.set(1 + 0.07 * sq, 1 - 0.13 * sq, 1 + 0.07 * sq);
        brilhar(em, cor.copy(ciano).lerp(roxo, r), k < IMP ? 0.35 : 1.4 * Math.pow(1 - r, 1.6));
        anel.visible = faiscas.visible = k >= IMP;
        if (anel.visible) {
          anel.position.set(x, 0.04, z); anel.scale.setScalar(1 + 2.3 * saida(r));
          anel.material.opacity = 0.95 * (1 - r); anel.material.color.copy(roxo).lerp(ciano, r);
          var s = (k - IMP) * dur / 1000;
          for (var i = 0; i < N; i++) { var p = ini[i]; pos[i * 3] = x + p.x + p.vx * s; pos[i * 3 + 1] = 0.08 + p.vy * s - 3 * s * s; pos[i * 3 + 2] = z + p.z + p.vz * s; }
          geo.attributes.position.needsUpdate = true; pm.opacity = 1 - r;
        }
        eu._focar(x, z, Math.sin(Math.PI * k));
      },
      limpar: function () { it.g.position.y = 0; it.g.scale.set(1, 1, 1); repousar(em); it.acendeAte = 0; eu._focar(0, 0, 0); kit.limpar(); }
    };
  };

  /* fio: o fio entre as duas peças se desenha do começo ao fim e um pulso de luz corre por ele até o pino */
  VC._fxFio = function (ef, parado) {
    var T = T3.T, eu = this, kit = kitFx(this), a = String(ef.de), b = String(ef.para), temp = null;
    function achar() {
      if (temp) return temp;
      for (var i = 0; i < eu.fiosObj.length; i++) { var f = eu.fiosObj[i]; if (f.de === a && f.para === b) return { f: f, volta: false }; if (f.de === b && f.para === a) return { f: f, volta: true }; }
      return null;
    }
    if (!achar()) {
      /* a Máquina ainda não tem este fio: um fio de luz provisório com o mesmo desenho de _fios, que sai no fim */
      var pa = this.itens[a].g.position.clone().setY(0.06), pb = this.itens[b].g.position.clone().setY(0.06), meio = new T.Vector3(pa.x, 0.06, pb.z);
      var curva = new T.CatmullRomCurve3([pa, pa.clone().lerp(meio, 0.85), meio, meio.clone().lerp(pb, 0.15), pb], false, 'centripetal');
      temp = { f: { curva: curva, linha: kit.por(new T.Line(kit.rec(new T.BufferGeometry().setFromPoints(curva.getPoints(40))), kit.rec(new T.LineBasicMaterial({ color: FX.fio, transparent: true, opacity: 0.7 })))) }, volta: false };
    }
    this.liberar([[a, b], [b, a]]);
    var roxo = new T.Color(FX.roxo), ciano = new T.Color(FX.ciano), cor = new T.Color(), pt = new T.Vector3();
    function soltar() { var x = achar(); if (x && x !== temp) { x.f.linha.material.color.setHex(FX.fio); x.f.linha.geometry.setDrawRange(0, Infinity); } kit.limpar(); eu._aplicarReservas(); }
    if (parado) return { dur: 420, passo: function () { var x = achar(); if (x) x.f.linha.material.color.copy(ciano); }, limpar: soltar };
    var esfera = kit.rec(new T.SphereGeometry(1, 14, 10));
    function luz(c, op) { return kit.rec(new T.MeshBasicMaterial({ color: c, transparent: true, opacity: op, blending: mistura(T), depthWrite: false })); }
    var ponta = kit.por(new T.Mesh(esfera, luz(FX.ciano, 1))); ponta.scale.setScalar(0.055);
    var pulso = kit.por(new T.Mesh(esfera, kit.rec(new T.MeshBasicMaterial({ color: FX.pulso })))); pulso.scale.setScalar(0.075); pulso.visible = false;
    var halo = kit.por(new T.Mesh(esfera, luz(FX.ciano, 0.35))); halo.scale.setScalar(0.17); halo.visible = false;
    var pino = kit.por(new T.Mesh(kit.rec(new T.RingGeometry(0.07, 0.11, 32)), kit.rec(new T.MeshBasicMaterial({ color: FX.ciano, transparent: true, opacity: 0, blending: mistura(T), depthWrite: false, side: T.DoubleSide }))));
    pino.rotation.x = -Math.PI / 2; pino.visible = false;
    return {
      dur: 720,
      passo: function (k) {
        var x = achar(); if (!x) return;
        var f = x.f, n = f.linha.geometry.attributes.position.count, g = saida(Math.min(1, k / 0.5)), m = Math.max(2, Math.ceil(n * g));
        f.linha.geometry.setDrawRange(x.volta ? n - m : 0, m); /* cresce a partir da peça "de" */
        f.linha.material.color.copy(cor.copy(roxo).lerp(ciano, g));
        ponta.visible = k < 0.5;
        if (ponta.visible) { f.curva.getPoint(x.volta ? 1 - g : g, pt); ponta.position.copy(pt).setY(0.1); }
        var p = (k - 0.45) / 0.42; pulso.visible = halo.visible = p >= 0 && p <= 1;
        if (pulso.visible) { f.curva.getPoint(x.volta ? 1 - suave(p) : suave(p), pt); pulso.position.copy(pt).setY(0.12); halo.position.copy(pulso.position); }
        var q = (k - 0.84) / 0.16; pino.visible = q >= 0;
        if (pino.visible) { f.curva.getPoint(x.volta ? 0 : 1, pt); pino.position.copy(pt).setY(0.07); pino.scale.setScalar(1 + 2.4 * saida(q)); pino.material.opacity = 0.9 * (1 - q); }
      },
      limpar: soltar
    };
  };

  /* cadeado: um aro de luz fecha em volta da gaveta, o cadeado da frente trava (a alça desce) e dá um clarão curto.
     ef.abre (a gaveta ficou mais aberta: RLS desligado, regra "true"): o contrário, em âmbar: o aro se abre e a alça sobe e gira */
  VC._fxCadeado = function (ef, it, parado) {
    var T = T3.T, kit = kitFx(this), roxo = new T.Color(FX.roxo), ciano = new T.Color(FX.ciano), branco = new T.Color(FX.branco), cor = new T.Color(), flash = new T.Color();
    var abre = !!ef.abre, ambar = new T.Color(FX.ambar);
    this._encerrarGanho(it);
    var em = emissivos(it.corpo);
    if (parado) return { dur: 420, passo: function () { brilhar(em, abre ? ambar : roxo, 1.1); }, limpar: function () { repousar(em); } };
    function luz() { return kit.rec(new T.MeshBasicMaterial({ color: FX.roxo, transparent: true, opacity: 0, blending: mistura(T), depthWrite: false })); }
    var aroGeo = kit.rec(new T.TorusGeometry(0.66, 0.026, 8, 64));
    var aro = kit.por(new T.Mesh(aroGeo, luz())), aro2 = kit.por(new T.Mesh(aroGeo, luz()));
    aro.rotation.x = aro2.rotation.x = Math.PI / 2;
    var cad = new T.Group(), corpoMat = luz(), alcaMat = luz();
    cad.add(new T.Mesh(kit.rec(new T.BoxGeometry(0.26, 0.2, 0.07)), corpoMat));
    var alca = new T.Mesh(kit.rec(new T.TorusGeometry(0.075, 0.022, 8, 20, Math.PI)), alcaMat); cad.add(alca);
    cad.rotation.y = Math.PI / 4; /* de frente para a câmera */
    kit.por(cad);
    var clarao = kit.por(new T.Mesh(kit.rec(new T.RingGeometry(0.6, 0.72, 48)), kit.rec(new T.MeshBasicMaterial({ color: FX.ciano, transparent: true, opacity: 0, blending: mistura(T), depthWrite: false, side: T.DoubleSide }))));
    clarao.rotation.x = -Math.PI / 2; clarao.visible = false;
    var FECHA = 0.45;
    if (abre) return {
      dur: 860,
      passo: function (k) {
        var x = it.g.position.x, z = it.g.position.z, a1 = suave(entre(k, 0, 0.55)), a2 = suave(entre(k, 0.08, 0.6)), some = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
        cor.copy(ciano).lerp(ambar, a1);
        aro.position.set(x, 0.3, z); aro.scale.setScalar(1 + 1.4 * a1); aro.material.opacity = (1 - 0.6 * a1) * some; aro.material.color.copy(cor);
        aro2.position.set(x, 0.85, z); aro2.scale.setScalar(1 + 1.8 * a2); aro2.material.opacity = (0.9 - 0.6 * a2) * some; aro2.material.color.copy(cor);
        cad.position.set(x + 0.47, 0.5, z + 0.47);
        cad.scale.setScalar(Math.max(0.001, saida(entre(k, 0, 0.2))));
        alca.position.y = 0.1 + 0.12 * suave(entre(k, 0.2, 0.55)); /* a alça sobe e solta */
        alca.rotation.y = 0.9 * suave(entre(k, 0.4, 0.65));
        corpoMat.opacity = alcaMat.opacity = 0.95 * some; corpoMat.color.copy(cor); alcaMat.color.copy(cor);
        brilhar(em, ambar, 1.1 * Math.sin(Math.PI * k));
      },
      limpar: function () { repousar(em); kit.limpar(); }
    };
    return {
      dur: 860,
      passo: function (k) {
        var x = it.g.position.x, z = it.g.position.z, c1 = suave(entre(k, 0, FECHA)), c2 = suave(entre(k, 0.08, FECHA)), some = k > 0.72 ? 1 - (k - 0.72) / 0.28 : 1;
        cor.copy(roxo).lerp(ciano, c1);
        aro.position.set(x, 0.3, z); aro.scale.setScalar(2.3 - 1.3 * c1); aro.material.opacity = (0.3 + 0.7 * c1) * some; aro.material.color.copy(cor);
        aro2.position.set(x, 0.85, z); aro2.scale.setScalar(2.7 - 1.7 * c2); aro2.material.opacity = (0.2 + 0.8 * c2) * some; aro2.material.color.copy(cor);
        var ap = entre(k, 0, 0.22), trava = k >= FECHA && k < FECHA + 0.08;
        cad.position.set(x + 0.47, 0.5, z + 0.47);
        cad.scale.setScalar(Math.max(0.001, saida(ap) * (1 + 0.25 * Math.sin(Math.PI * ap))) * (trava ? 1.12 : 1));
        alca.position.y = 0.1 + 0.1 * (1 - suave(entre(k, 0.22, FECHA))); /* a alça desce e trava */
        corpoMat.opacity = alcaMat.opacity = 0.95 * some; corpoMat.color.copy(cor); alcaMat.color.copy(cor);
        var f = (k - FECHA) / 0.3, fl = f >= 0 && f <= 1 ? 1 - f : 0;
        if (f >= 0) brilhar(em, flash.copy(ciano).lerp(branco, 0.3 * fl), 1.5 * fl);
        else brilhar(em, roxo, 0.25 * c1);
        clarao.visible = f >= 0 && f <= 1;
        if (clarao.visible) { clarao.position.set(x, 0.05, z); clarao.scale.setScalar(1 + 1.2 * saida(f)); clarao.material.opacity = 0.9 * (1 - f); }
      },
      limpar: function () { repousar(em); kit.limpar(); }
    };
  };

  /* dados: n cubinhos de luz (até 8) voam de fora da cena e entram na gaveta, um a um; a gaveta pula a cada um.
     n < 0 (linhas que saíram): os cubinhos saem da gaveta para fora. ef.aoImpacto(i) avisa cada batida (o som). */
  VC._fxDados = function (ef, it, parado) {
    var T = T3.T, eu = this, kit = kitFx(this), n = Math.round(Number(ef.n) || 0), qtd = Math.min(8, Math.abs(n)), sai = n < 0;
    var roxo = new T.Color(FX.roxo), ciano = new T.Color(FX.ciano);
    this._encerrarGanho(it);
    var em = emissivos(it.corpo);
    if (parado) return { dur: 420, passo: function () { brilhar(em, ciano, 0.9); }, limpar: function () { repousar(em); } };
    if (!qtd) return { dur: 500, passo: function (k) { brilhar(em, ciano, 0.9 * Math.sin(Math.PI * k)); }, limpar: function () { repousar(em); } };
    var VOO = 400, gap = qtd > 1 ? Math.min(100, 460 / (qtd - 1)) : 0, dur = Math.round((qtd - 1) * gap + VOO + 150); /* 8 cubos: ~1 s */
    var geo = kit.rec(new T.BoxGeometry(0.12, 0.12, 0.12)), cubos = [], v = new T.Vector3(), alvo = new T.Vector3(), ctrl = new T.Vector3();
    eu.cam.updateMatrixWorld();
    var zTela = v.set(it.g.position.x, 0.8, it.g.position.z).project(eu.cam).z; /* nasce fora da tela, na mesma profundidade da gaveta */
    for (var i = 0; i < qtd; i++) {
      var c = kit.por(new T.Mesh(geo, kit.rec(new T.MeshBasicMaterial({ color: FX.ciano, transparent: true, blending: mistura(T), depthWrite: false, depthTest: false }))));
      c.visible = false; c.renderOrder = 10;
      cubos.push({ m: c, fora: new T.Vector3((i % 2 ? 1 : -1) * 1.2, 0.35 + 0.5 * ((i * 0.37) % 1), zTela).unproject(eu.cam), t: i * gap, giro: (i % 3 + 1) * 3.1, bateu: false });
    }
    return {
      dur: dur,
      passo: function (k) {
        var ms = k * dur, hop = 0, luz = 0;
        alvo.set(it.g.position.x, 0.8, it.g.position.z);
        cubos.forEach(function (c, i) {
          var s = (ms - c.t) / VOO, marco = sai ? c.t : c.t + VOO;
          if (!c.bateu && ms >= marco) { c.bateu = true; if (typeof ef.aoImpacto === 'function') { try { ef.aoImpacto(i); } catch (e) { /* segue */ } } }
          c.m.visible = s > 0 && s < 1;
          if (c.m.visible) {
            var de = sai ? alvo : c.fora, para = sai ? c.fora : alvo, e = sai ? s * s : suave(s), u = 1 - e;
            ctrl.copy(de).lerp(para, 0.5); ctrl.y += 1.4;
            c.m.position.set(u * u * de.x + 2 * u * e * ctrl.x + e * e * para.x, u * u * de.y + 2 * u * e * ctrl.y + e * e * para.y, u * u * de.z + 2 * u * e * ctrl.z + e * e * para.z);
            c.m.rotation.set(s * c.giro, s * c.giro * 0.7, 0);
            c.m.scale.setScalar(sai ? Math.min(1, s / 0.15) : (s > 0.8 ? Math.max(0.05, (1 - s) / 0.2) : 1));
            c.m.material.color.copy(roxo).lerp(ciano, sai ? 1 - s : s);
          }
          var d = (ms - marco) / 150;
          if (d >= 0 && d < 1) { hop = Math.max(hop, 0.1 * Math.sin(Math.PI * d)); luz = Math.max(luz, 1 - d); }
        });
        it.corpo.position.y = 0.05 + hop; /* o pulo da gaveta a cada linha */
        brilhar(em, ciano, 1.2 * luz);
      },
      limpar: function () { it.corpo.position.y = 0.05; repousar(em); kit.limpar(); }
    };
  };

  /* erro: clarão vermelho e tremida curta na peça (ou na cena inteira, sem peça); o texto aparece enquanto dura */
  VC._fxErro = function (ef, it, parado) {
    var T = T3.T, eu = this, kit = kitFx(this), alvo = it ? it.corpo : this.raiz, vermelho = new T.Color(FX.erro);
    if (it) this._encerrarGanho(it);
    var em = emissivos(it ? it.g : this.raiz), texto = String(ef.texto || '').replace(/\s+/g, ' ').trim();
    if (texto.length > 90) texto = texto.slice(0, 88) + '…';
    var rot = texto ? { pos: it ? new T.Vector3(it.g.position.x, 1.25, it.g.position.z) : new T.Vector3(0, 1.4, 0), texto: texto, classe: 'erro' } : null;
    if (rot) this.fxRotulos.push(rot);
    if (this.el) this.el.classList.add('v3c-fx-erro');
    function fim() {
      alvo.position.x = 0; alvo.position.z = 0; repousar(em);
      var i = eu.fxRotulos.indexOf(rot); if (i >= 0) eu.fxRotulos.splice(i, 1);
      if (eu.el) eu.el.classList.remove('v3c-fx-erro');
      kit.limpar();
    }
    if (parado) return { dur: 900, passo: function () { brilhar(em, vermelho, 1.2); }, limpar: fim };
    var anel = it ? kit.por(new T.Mesh(kit.rec(new T.RingGeometry(0.5, 0.6, 48)), kit.rec(new T.MeshBasicMaterial({ color: FX.erro, transparent: true, opacity: 0, blending: mistura(T), depthWrite: false, side: T.DoubleSide })))) : null;
    if (anel) anel.rotation.x = -Math.PI / 2;
    var amp = it ? 0.075 : 0.05, dur = 760;
    return {
      dur: dur,
      passo: function (k) {
        var dec = Math.pow(1 - k, 2), ms = k * dur;
        alvo.position.x = amp * dec * Math.sin(ms * 0.075);
        alvo.position.z = -0.6 * amp * dec * Math.sin(ms * 0.075 + 1.1);
        brilhar(em, vermelho, 1.6 * Math.pow(1 - k, 1.3));
        if (anel) { anel.position.set(it.g.position.x, 0.04, it.g.position.z); anel.scale.setScalar(1 + 1.8 * saida(k)); anel.material.opacity = 0.9 * (1 - k); }
      },
      limpar: fim
    };
  };

  /* reservar: as peças (ids) e os fios ([de, para]) que ainda vão nascer pelos efeitos ficam escondidos até a vez deles,
     senão a peça aparece parada e depois "pula" para cair. Some sozinho em ms (no máximo 30 s): nada fica escondido para sempre. */
  function chaveReserva(x) { return Array.isArray(x) ? (x[0] && x[1] ? 'f:' + x[0] + '>' + x[1] : null) : x != null && x !== '' ? 'p:' + x : null; }
  VC.reservar = function (lista, ms) {
    var eu = this;
    (lista || []).forEach(function (x) { var c = chaveReserva(x); if (c) eu.reservas[c] = true; });
    clearTimeout(this._reservaTimer);
    this._reservaTimer = setTimeout(function () { eu._reservaTimer = null; eu.liberar(); }, Math.max(800, Math.min(30000, ms || 8000)));
    this._aplicarReservas(); this.pedir('reserva');
    return this;
  };
  VC.liberar = function (lista) {
    var eu = this, antes = Object.keys(this.reservas).length;
    if (!antes) return this;
    if (!lista) { this.reservas = {}; clearTimeout(this._reservaTimer); this._reservaTimer = null; }
    else lista.forEach(function (x) { var c = chaveReserva(x); if (c) delete eu.reservas[c]; });
    if (Object.keys(this.reservas).length !== antes) { this._aplicarReservas(); this.pedir('reserva'); }
    return this;
  };
  VC._reservada = function (id) { return !!this.reservas['p:' + id]; };
  VC._aplicarReservas = function () {
    var r = this.reservas, eu = this;
    this.ordem.forEach(function (id) { eu.itens[id].g.visible = !r['p:' + id]; });
    this.fiosObj.forEach(function (f) {
      var fora = r['p:' + f.de] || r['p:' + f.para] || r['f:' + f.de + '>' + f.para] || r['f:' + f.para + '>' + f.de];
      f.linha.geometry.setDrawRange(0, fora ? 0 : Infinity);
    });
  };

  BC.visual3d.corpo = function (el, opcoes) { return new VistaCorpo(el, opcoes); };
  BC.visual3d.corpoDoEstado = function (pjId) { var c = semearCorpo(); return c.projetos[pjId || c.atual] || null; };
  BC.visual3d.catalogo = function (fn) { carregarCatalogo(fn || function () {}); return catalogo; };
  BC.visual3d.tipoCorpo = tipoCorpo;
})(window.BC);
