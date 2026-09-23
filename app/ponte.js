/* Babel Coop · ponte entre a interface (a mesma do protótipo) e o servidor desta máquina
   Carregada pelo servidor antes de app.js. O que ela troca:
   - a equipe simulada sai; quem existe é quem tem token e está na rede
   - toda ação (L.fazer) vira evento do diário e chega às outras Estações; eventos dos outros são aplicados aqui
   - a primeira abertura pede o token (ou funda a equipe)
   - terminal de verdade (xterm.js + node-pty) num painel próprio, com a parede dos terminais dos outros
*/
(function () {
  'use strict';
  var BC = window.BC;
  if (!BC || !BC.loja) return;
  var L = BC.loja, WS = null, eu = null, pares = [], aplicando = false, janelaId = BC.canal ? BC.canal.id : String(Math.random());
  var pessoasReais = {};

  /* sem equipe simulada no app real */
  BC.simulador = { iniciar: function () {}, parar: function () {} };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function enviar(msg) { if (WS && WS.readyState === 1) WS.send(JSON.stringify(msg)); }
  function pedir(caminho, corpo) { return fetch(caminho, corpo ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) } : undefined).then(function (r) { return r.json(); }); }

  /* ---------- pessoas: quem tem token ---------- */
  var CORES = ['#8670ff', '#29ccec', '#ff7ab8', '#7fd6a6', '#ffcf5c', '#f2a65a', '#c7a2ff', '#5ad1ff'];
  function garantirPessoa(p) {
    if (!p || !p.id) return;
    pessoasReais[p.id] = true;
    var q = L.pessoa(p.id);
    if (q) { q.nome = p.nome || q.nome; if (p.papel === 'gestao') q.papel = 'admin'; return; }
    var areas = Object.keys(L.estado.areas || {});
    L.estado.pessoas.push({ id: p.id, nome: p.nome || p.id, papel: p.papel === 'gestao' ? 'admin' : 'membro', area: areas[0] || 'geral', status: 'offline', cor: CORES[L.estado.pessoas.length % CORES.length], ultimaVez: Date.now(), agentes: [] });
  }
  function marcarPresenca() {
    L.estado.pessoas.forEach(function (p) { if (!pessoasReais[p.id]) p.status = 'offline'; }); /* a equipe de exemplo do protótipo fica apagada até ter token */
    pares.forEach(function (p) { var q = L.pessoa(p.id); if (q) { q.status = p.ligado ? 'online' : 'offline'; if (!p.ligado) q.ultimaVez = Date.now(); } });
    var me = L.pessoa(eu.id); if (me) me.status = 'online';
    L._mudou([]);
  }

  /* ---------- eventos: o diário manda ---------- */
  function aplicar(ev, avisarAgora) {
    if (!ev || !ev.acao || ev.origem === janelaId) return; /* esta janela já aplicou o que ela mesma fez */
    var fn = L.A[ev.acao];
    if (!fn) return;
    aplicando = true;
    try {
      var r = fn.apply(null, [ev.quem].concat(ev.args || []));
      if (r && r !== 'cedo' && avisarAgora) L._mudou(r);
    } catch (e) { console.warn('[ponte] evento ' + ev.id + ' (' + ev.acao + ') falhou:', e.message); }
    aplicando = false;
  }

  var fazerOriginal = L.fazer;
  L.fazer = function (nome, a, b, c, d) {
    var r = fazerOriginal.call(L, nome, a, b, c, d);
    if (r === true && !aplicando) enviar({ tipo: 'fazer', acao: nome, args: [a, b, c, d].filter(function (x) { return x !== undefined; }), origem: janelaId });
    return r;
  };

  /* ---------- ligação com o servidor ---------- */
  function conectar() {
    WS = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
    WS.onmessage = function (ev) { var m; try { m = JSON.parse(ev.data); } catch (e) { return; } receber(m); };
    WS.onclose = function () { setTimeout(conectar, 2000); };
  }

  function receber(m) {
    if (m.tipo === 'bemvindo') {
      eu = m.eu; pares = m.pares || [];
      if (!eu.pronto) { boasVindas(); return; }
      garantirPessoa(eu); pares.forEach(garantirPessoa);
      L.eu = eu.id;
      try { localStorage.setItem('babel-coop:eu', JSON.stringify(eu.id)); } catch (e) { /* sem armazenamento */ }
      (m.eventos || []).forEach(function (ev) { aplicar(ev, false); });
      marcarPresenca();
      terminalReal.iniciar(m.terminais || [], m.terminalReal);
      var vc = document.getElementById('ver-como'); if (vc) vc.closest('label').hidden = true; /* no app real cada um é quem é */
      return;
    }
    if (m.tipo === 'pares') { pares = m.lista || []; pares.forEach(garantirPessoa); marcarPresenca(); return; }
    if (m.tipo === 'evento') { aplicar(m.evento, true); return; }
    if (m.tipo === 'erro') { if (BC.estacao && BC.estacao.aviso) BC.estacao.aviso(m.erro); return; }
    if (/^term-/.test(m.tipo)) terminalReal.receber(m);
  }

  /* ---------- primeira abertura: token ou fundar ---------- */
  function boasVindas() {
    var el = document.createElement('div');
    el.id = 'coop-boasvindas';
    el.innerHTML = '<div class="cbv-cartao"><img src="babel-logo.png" alt="" class="cbv-logo"><h1>Babel Coop</h1>' +
      '<p>Cole o token que o Theus mandou. Com ele o app já sabe quem você é e acha a equipe na rede.</p>' +
      '<textarea id="cbv-token" rows="3" placeholder="babel-…" spellcheck="false"></textarea>' +
      '<button class="botao primario" id="cbv-entrar" type="button">Entrar na equipe</button><p class="cbv-erro" id="cbv-erro" hidden></p>' +
      '<details><summary>Sou o primeiro computador da equipe</summary><label>Seu nome <input id="cbv-nome" placeholder="Theus"></label><button class="botao" id="cbv-fundar" type="button">Fundar a equipe e gerar tokens</button></details></div>';
    document.body.appendChild(el);
    var erro = el.querySelector('#cbv-erro');
    el.querySelector('#cbv-entrar').onclick = function () {
      pedir('/api/token', { token: el.querySelector('#cbv-token').value }).then(function (r) { if (r.erro) { erro.hidden = false; erro.textContent = r.erro; return; } location.reload(); });
    };
    el.querySelector('#cbv-fundar').onclick = function () {
      pedir('/api/fundar', { nome: el.querySelector('#cbv-nome').value }).then(function (r) { if (r.erro) { erro.hidden = false; erro.textContent = r.erro; return; } location.reload(); });
    };
  }

  /* ---------- terminal de verdade ---------- */
  var terminalReal = {
    disponivel: false, sessoes: {}, parede: {}, painel: null, ativo: null, xterm: null,
    iniciar: function (lista, disponivel) {
      this.disponivel = disponivel;
      var eu2 = this;
      this.carregarXterm().then(function () { eu2.montarPainel(); lista.forEach(function (s) { eu2.parede[s.dono + '/' + s.id] = s; }); enviar({ tipo: 'term-lista?' }); });
      document.addEventListener('keydown', function (ev) { if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'j') { ev.preventDefault(); eu2.alternar(); } });
    },
    carregarXterm: function () {
      if (window.Terminal && window.FitAddon) return Promise.resolve();
      function css(h) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = h; document.head.appendChild(l); }
      function js(s) { return new Promise(function (ok, erro) { var e = document.createElement('script'); e.src = s; e.onload = ok; e.onerror = erro; document.head.appendChild(e); }); }
      css('https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.min.css');
      return js('https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/lib/xterm.min.js').then(function () { return js('https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0.10.0/lib/addon-fit.min.js'); });
    },
    montarPainel: function () {
      var p = document.createElement('section');
      p.id = 'term-real';
      p.hidden = true;
      p.innerHTML = '<header><strong>Terminal real</strong><span id="tr-abas"></span><button type="button" id="tr-novo" class="botao discreto">+ Terminal</button><button type="button" id="tr-parede" class="botao discreto">Parede</button><span class="tr-dica">Ctrl+J esconde</span></header><div id="tr-corpo"></div><div id="tr-lista" hidden></div>';
      document.body.appendChild(p);
      this.painel = p;
      var eu2 = this;
      p.querySelector('#tr-novo').onclick = function () { eu2.abrir(); };
      p.querySelector('#tr-parede').onclick = function () { var l = p.querySelector('#tr-lista'); l.hidden = !l.hidden; eu2.desenharParede(); enviar({ tipo: 'term-lista?' }); };
      p.querySelector('#tr-abas').onclick = function (ev) { var b = ev.target.closest('[data-chave]'); if (b) eu2.mostrar(b.dataset.chave); };
      p.querySelector('#tr-lista').onclick = function (ev) { var b = ev.target.closest('[data-assistir]'); if (b) eu2.assistir(b.dataset.dono, b.dataset.id, b.dataset.nome); };
      window.addEventListener('resize', function () { eu2.ajustar(); });
      var btn = document.getElementById('ir-tv');
      if (btn && !document.getElementById('ir-term-real')) { var b2 = document.createElement('button'); b2.className = 'botao'; b2.id = 'ir-term-real'; b2.type = 'button'; b2.textContent = 'Terminal real'; b2.title = 'Ctrl+J'; b2.onclick = function () { eu2.alternar(); }; btn.parentNode.insertBefore(b2, btn); }
    },
    alternar: function () { this.painel.hidden = !this.painel.hidden; if (!this.painel.hidden) { if (!this.ativo) this.abrir(); this.ajustar(); } },
    sessao: function (dono, id, nome, minha) {
      var chave = dono + '/' + id, s = this.sessoes[chave];
      if (s) return s;
      var el = document.createElement('div'); el.className = 'tr-term'; el.hidden = true;
      this.painel.querySelector('#tr-corpo').appendChild(el);
      var term = new window.Terminal({ cursorBlink: true, fontFamily: 'JetBrains Mono, Menlo, monospace', fontSize: 13, theme: { background: '#060b16', foreground: '#d7e4fb', cursor: '#29ccec' } });
      var fit = new window.FitAddon.FitAddon();
      term.loadAddon(fit); term.open(el);
      term.onData(function (d) { enviar({ tipo: 'term-entrada', dono: dono, id: id, dados: d }); });
      s = this.sessoes[chave] = { dono: dono, id: id, nome: nome, minha: minha, term: term, fit: fit, el: el };
      var aba = document.createElement('button'); aba.type = 'button'; aba.dataset.chave = chave; aba.textContent = (minha ? '' : (L.nome(dono) || dono) + ' · ') + nome;
      this.painel.querySelector('#tr-abas').appendChild(aba);
      this.mostrar(chave);
      return s;
    },
    abrir: function (nome) {
      if (!this.disponivel) { if (BC.estacao && BC.estacao.aviso) BC.estacao.aviso('node-pty não compilou nesta máquina: rode npm install na pasta app.'); return; }
      var id = 't' + Date.now().toString(36);
      nome = nome || ('Terminal ' + (Object.keys(this.sessoes).length + 1));
      enviar({ tipo: 'term-abrir', id: id, nome: nome, cols: 100, rows: 30 });
      this.sessao(eu.id, id, nome, true);
      this.ajustar();
    },
    assistir: function (dono, id, nome) { this.sessao(dono, id, nome || id, dono === eu.id); enviar({ tipo: 'term-assistir', dono: dono, id: id }); this.painel.hidden = false; this.ajustar(); },
    mostrar: function (chave) {
      var eu2 = this;
      Object.keys(this.sessoes).forEach(function (k) { eu2.sessoes[k].el.hidden = k !== chave; });
      this.painel.querySelectorAll('#tr-abas button').forEach(function (b) { b.classList.toggle('ativo', b.dataset.chave === chave); });
      this.ativo = chave;
      this.ajustar();
      if (this.sessoes[chave]) this.sessoes[chave].term.focus();
    },
    ajustar: function () {
      var s = this.ativo && this.sessoes[this.ativo];
      if (!s || this.painel.hidden) return;
      try { s.fit.fit(); } catch (e) { return; }
      if (s.minha) enviar({ tipo: 'term-tamanho', id: s.id, cols: s.term.cols, rows: s.term.rows });
    },
    desenharParede: function () {
      var eu2 = this, l = this.painel.querySelector('#tr-lista'), itens = Object.keys(this.parede).map(function (k) { return eu2.parede[k]; });
      l.innerHTML = itens.length ? itens.map(function (s) { return '<button type="button" data-assistir data-dono="' + esc(s.dono) + '" data-id="' + esc(s.id) + '" data-nome="' + esc(s.nome) + '"><b>' + esc(L.nome(s.dono) || s.dono) + '</b> · ' + esc(s.nome) + (s.pausada ? ' · pausado' : '') + (s.controles && s.controles.length ? ' · ' + s.controles.map(function (c) { return L.nome(c) || c; }).join(', ') + ' no controle' : '') + '</button>'; }).join('') : '<p>Nenhum terminal aberto na equipe agora.</p>';
    },
    receber: function (m) {
      var chave = m.dono + '/' + m.id, s = this.sessoes[chave];
      if (m.tipo === 'term-lista') { var eu2 = this; Object.keys(this.parede).forEach(function (k) { if (eu2.parede[k].dono === m.dono) delete eu2.parede[k]; }); (m.lista || []).forEach(function (x) { eu2.parede[x.dono + '/' + x.id] = x; }); if (!this.painel.querySelector('#tr-lista').hidden) this.desenharParede(); return; }
      if (m.tipo === 'term-aberto') { s = this.sessoes[eu.id + '/' + m.info.id]; if (s && m.tela) s.term.write(m.tela); return; }
      if (m.tipo === 'term-tela') { if (s) { s.term.reset(); s.term.write(m.dados || ''); } return; }
      if (m.tipo === 'term-saida') { if (s) s.term.write(m.dados); return; }
      if (m.tipo === 'term-fim') { if (s) s.term.write('\r\n[sessão encerrada]\r\n'); return; }
    }
  };

  /* ---------- Oficina do app: publicar e atualizar de verdade ---------- */
  if (BC.acoes) {
    /* "Publicar atualização": a Estação da gestão empacota a interface e o evento faz "Atualizar" aparecer em todas */
    BC.acoes['oficina-publicar'] = function () {
      var campo = document.getElementById('oficina-notas'), notas = campo ? campo.value.trim() : '';
      var a = L.estado.app || { versao: 0 };
      pedir('/api/app/publicar', { notas: notas, versaoBase: a.versao, origem: janelaId }).then(function (r) {
        if (r.erro) { BC.estacao.aviso(r.erro); return; }
        aplicando = true; try { var ev = L.A.oficinaPublicar(eu.id, r.notas); if (ev) L._mudou(ev); } finally { aplicando = false; }
        BC.estacao.aviso('Atualização v' + r.versao + ' publicada: ' + r.arquivos.length + ' arquivos. Todo mundo vê o botão Atualizar.');
      });
    };
    /* "Atualizar": baixa da Estação de quem publicou, confere os hashes e recarrega */
    BC.acoes['oficina-atualizar'] = function () {
      var a = L.estado.app || {};
      BC.estacao.ui.atualizando = true; BC.estacao.render();
      pedir('/api/app/atualizar', { de: a.por, versao: null }).then(function (r) {
        BC.estacao.ui.atualizando = false;
        if (r.erro) { BC.estacao.render(); BC.estacao.aviso('Não deu para atualizar: ' + r.erro); return; }
        L.fazer('oficinaAtualizar');
        setTimeout(function () { location.reload(); }, 600);
      });
    };
  }

  /* ---------- convite (token) para a tela Equipe ---------- */
  BC.real = {
    eu: function () { return eu; },
    pares: function () { return pares; },
    convidar: function (nome, papel) { return pedir('/api/convite', { nome: nome, papel: papel || 'membro' }); },
    terminal: terminalReal
  };

  /* estilos da ponte */
  var st = document.createElement('style');
  st.textContent = '#coop-boasvindas{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;background:#060b16;color:#d7e4fb;font-family:"IBM Plex Sans",system-ui,sans-serif}' +
    '.cbv-cartao{width:min(460px,92vw);display:grid;gap:12px;padding:28px;border:1px solid #1e2a44;border-radius:16px;background:#0b1224}.cbv-logo{width:44px}.cbv-cartao h1{margin:0;font-size:22px}.cbv-cartao p{margin:0;color:#8799bc;line-height:1.5}' +
    '.cbv-cartao textarea,.cbv-cartao input{width:100%;box-sizing:border-box;padding:10px;border:1px solid #2a3a5e;border-radius:9px;background:#060b16;color:#fff;font:13px "JetBrains Mono",monospace}.cbv-cartao details{color:#8799bc;font-size:13px}.cbv-cartao details label{display:grid;gap:6px;margin:10px 0}.cbv-erro{color:#ff7ab8}' +
    '#term-real{position:fixed;right:16px;bottom:44px;z-index:900;width:min(760px,calc(100vw - 32px));height:min(420px,60vh);display:flex;flex-direction:column;border:1px solid #2a3a5e;border-radius:12px;background:#060b16;box-shadow:0 20px 50px rgba(0,0,0,.5);overflow:hidden}' +
    '#term-real header{display:flex;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid #1e2a44;color:#d7e4fb;font:12px "JetBrains Mono",monospace}#tr-abas{display:flex;gap:4px;flex:1;overflow:auto}#tr-abas button{border:1px solid transparent;background:transparent;color:#8799bc;border-radius:6px;padding:3px 8px;font:inherit;cursor:pointer}#tr-abas button.ativo{color:#fff;border-color:#8670ff}' +
    '.tr-dica{color:#5a6a8c}#tr-corpo{flex:1;min-height:0;padding:6px}.tr-term{height:100%}#tr-lista{position:absolute;top:36px;right:8px;width:300px;display:grid;gap:4px;padding:8px;border:1px solid #2a3a5e;border-radius:10px;background:#0b1224;color:#d7e4fb;font-size:12px}#tr-lista button{text-align:left;border:1px solid #1e2a44;background:#060b16;color:inherit;border-radius:8px;padding:8px;cursor:pointer}#tr-lista p{margin:0;color:#8799bc}';
  document.head.appendChild(st);

  conectar();
})();
