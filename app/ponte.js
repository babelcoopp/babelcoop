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
  var pessoasReais = {}, ouvintes = [];

  /* sem equipe simulada no app real */
  BC.simulador = { iniciar: function () {}, parar: function () {} };

  /* no app real quem manda no estado é o diário do servidor: cada janela (Estação, TV, cronômetro) aplica os eventos dele.
     O canal entre janelas do protótipo também trocava o estado inteiro ('estado'/'pedir-estado'), e a TV aplicava cada ação
     duas vezes (a do diário por cima do estado adotado da Estação). Aqui o canal fica só com o resto (batidas, líder). */
  if (BC.canal && typeof BC.canal.enviar === 'function' && !BC.canal.__soDiario) {
    var enviarCanal = BC.canal.enviar;
    BC.canal.enviar = function (msg, soAoVivo) { if (msg && (msg.tipo === 'estado' || msg.tipo === 'pedir-estado')) return; return enviarCanal.call(BC.canal, msg, soAoVivo); };
    BC.canal.__soDiario = true;
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function enviar(msg) { if (WS && WS.readyState === 1) WS.send(JSON.stringify(msg)); }
  function pedir(caminho, corpo) { return fetch(caminho, corpo ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) } : undefined).then(function (r) { return r.json(); }); }

  /* ---------- pessoas: quem tem token ---------- */
  var CORES = ['#8670ff', '#29ccec', '#ff7ab8', '#7fd6a6', '#ffcf5c', '#f2a65a', '#c7a2ff', '#5ad1ff'];
  /* a mesma cor para a mesma pessoa em todas as Estações (antes dependia da ordem em que cada uma conheceu a equipe) */
  function corDe(id) { var h = 0; String(id).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) >>> 0; }); return CORES[h % CORES.length]; }
  function garantirPessoa(p) {
    if (!p || !p.id) return;
    pessoasReais[p.id] = true;
    var q = L.pessoa(p.id);
    if (q) {
      q.nome = p.nome || q.nome; if (p.papel === 'gestao') q.papel = 'admin';
      /* a pessoa de exemplo do protótipo com o mesmo id (ex.: theus) vinha com os agentes de exemplo (Rita, Dev): no app real os agentes são só os do diário */
      if (!q._real) { q._real = true; q.agentes = []; }
      return;
    }
    var areas = Object.keys(L.estado.areas || {});
    L.estado.pessoas.push({ id: p.id, nome: p.nome || p.id, papel: p.papel === 'gestao' ? 'admin' : 'membro', area: areas[0] || 'geral', status: 'offline', cor: corDe(p.id), ultimaVez: Date.now(), agentes: [], _real: true });
  }
  function marcarPresenca() {
    L.estado.pessoas.forEach(function (p) { if (!pessoasReais[p.id]) p.status = 'offline'; }); /* a equipe de exemplo do protótipo fica apagada até ter token */
    pares.forEach(function (p) { var q = L.pessoa(p.id); if (q) { q.status = p.ligado ? 'online' : 'offline'; if (!p.ligado) q.ultimaVez = Date.now(); } });
    var me = L.pessoa(eu.id); if (me) me.status = 'online';
    L._mudou([]);
  }

  /* ---------- eventos: o diário manda ---------- */
  /* ids iguais em todas as Estações: o que uma ação cria (demanda, tarefa, mensagem…) ganha o id da semente do evento.
     A janela que fez usa a semente que mandou em 'origem'; as outras refazem com a mesma; evento sem semente usa o id do diário. */
  var novoIdLoja = L._novoId;
  function comSemente(semente, fn) {
    var k = 0, limpa = String(semente).replace(/[^A-Za-z0-9-]/g, '-');
    var U = BC.util, idUtil = U && U.id;
    L._novoId = function (prefixo) { return prefixo + '-' + limpa + '-' + (++k); };
    if (idUtil) U.id = function (prefixo) { return (prefixo || 'x') + '-' + limpa + '-' + (++k); };
    try { return fn(); } finally { L._novoId = novoIdLoja; if (idUtil) U.id = idUtil; }
  }
  function minhaOrigem(o) { return typeof o === 'string' && (o === janelaId || o.indexOf(janelaId + '-') === 0); }

  function aplicar(ev, avisarAgora) {
    if (!ev || !ev.acao || minhaOrigem(ev.origem)) return; /* esta janela já aplicou o que ela mesma fez */
    var fn = L.A[ev.acao];
    if (!fn) return;
    if (ev.quem && !L.pessoa(ev.quem)) garantirPessoa({ id: ev.quem, nome: ev.quem }); /* o nome certo chega com os pares */
    aplicando = true;
    try {
      var r = comSemente(ev.origem && ev.origem.indexOf('-') > 0 ? ev.origem : ev.id, function () { return fn.apply(null, [ev.quem].concat(ev.args || [])); });
      if (r && r !== 'cedo' && avisarAgora) L._mudou(r);
    } catch (e) { console.warn('[ponte] evento ' + ev.id + ' (' + ev.acao + ') falhou:', e.message); }
    aplicando = false;
  }

  var fazerOriginal = L.fazer, sementes = 0;
  L.fazer = function (nome, a, b, c, d) {
    if (aplicando) return fazerOriginal.call(L, nome, a, b, c, d);
    var semente = janelaId + '-' + (++sementes).toString(36);
    var r = comSemente(semente, function () { return fazerOriginal.call(L, nome, a, b, c, d); });
    /* argumentos na posição certa: só os undefined do fim saem; um buraco no meio vira null (antes deslocava os seguintes) */
    var args = [a, b, c, d];
    while (args.length && args[args.length - 1] === undefined) args.pop();
    args = args.map(function (x) { return x === undefined ? null : x; });
    if (r === true) enviar({ tipo: 'fazer', acao: nome, args: args, origem: semente });
    return r;
  };

  /* ---------- ligação com o servidor ---------- */
  function conectar() {
    WS = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
    WS.onmessage = function (ev) { var m; try { m = JSON.parse(ev.data); } catch (e) { return; } receber(m); };
    WS.onclose = function () { setTimeout(conectar, 2000); };
  }

  /* cada mensagem passa primeiro pela ponte (equipe, diário) e depois pelas peças de interface/ (terminal real, parede) */
  function receber(m) {
    receberPonte(m);
    if (m.tipo === 'bemvindo') { if (!m.eu || !m.eu.pronto) return; BC.real.bemvindo = m; }
    ouvintes.forEach(function (fn) { try { fn(m); } catch (e) { console.warn('[ponte] ouvinte falhou:', e); } });
  }

  function receberPonte(m) {
    if (m.tipo === 'bemvindo') {
      eu = m.eu; pares = m.pares || [];
      if (!eu.pronto) { boasVindas(); return; }
      garantirPessoa(eu); pares.forEach(garantirPessoa);
      L.eu = eu.id;
      try { localStorage.setItem('babel-coop:eu', JSON.stringify(eu.id)); } catch (e) { /* sem armazenamento */ }
      (m.eventos || []).forEach(function (ev) { aplicar(ev, false); });
      marcarPresenca();
      var vc = document.getElementById('ver-como'); if (vc) vc.closest('label').hidden = true; /* no app real cada um é quem é */
      return;
    }
    if (m.tipo === 'pares') { pares = m.lista || []; pares.forEach(garantirPessoa); marcarPresenca(); return; }
    if (m.tipo === 'evento') { aplicar(m.evento, true); return; }
    if (m.tipo === 'erro') { if (BC.estacao && BC.estacao.aviso) BC.estacao.aviso(m.erro); return; }
  }

  /* ---------- primeira abertura: token ou fundar ---------- */
  function boasVindas() {
    var el = document.createElement('div');
    el.id = 'coop-boasvindas';
    el.innerHTML = '<div class="cbv-cartao"><img src="babel-logo.png" alt="" class="cbv-logo"><h1>babel-coop</h1>' +
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
    corDe: corDe,
    pares: function () { return pares; },
    convidar: function (nome, papel) { return pedir('/api/convite', { nome: nome, papel: papel || 'membro' }); },
    /* barramento com o servidor desta máquina: as peças de interface/ mandam e ouvem mensagens do WebSocket */
    enviar: enviar,
    ouvir: function (fn) { ouvintes.push(fn); if (BC.real.bemvindo) { try { fn(BC.real.bemvindo); } catch (e) { console.warn(e); } } },
    ligado: function () { return !!(WS && WS.readyState === 1); },
    /* testes: entrega uma mensagem à ponte e às peças como se viesse do servidor */
    simular: function (m) { receber(m); },
    bemvindo: null
  };

  /* estilos da ponte */
  var st = document.createElement('style');
  st.textContent = '#coop-boasvindas{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;background:#060b16;color:#d7e4fb;font-family:"IBM Plex Sans",system-ui,sans-serif}' +
    '.cbv-cartao{width:min(460px,92vw);display:grid;gap:12px;padding:28px;border:1px solid #1e2a44;border-radius:16px;background:#0b1224}.cbv-logo{width:64px;animation:cbv-pulsa 3.4s ease-in-out infinite alternate}@keyframes cbv-pulsa{from{filter:drop-shadow(0 0 3px rgba(163,118,233,.9)) drop-shadow(0 0 12px rgba(145,96,236,.5));transform:scale(1)}to{filter:drop-shadow(0 0 3px rgba(42,213,229,.95)) drop-shadow(0 0 20px rgba(41,204,236,.55));transform:scale(1.07)}}@media (prefers-reduced-motion:reduce){.cbv-logo{animation:none}}.cbv-cartao h1{margin:0;font-size:22px}.cbv-cartao p{margin:0;color:#8799bc;line-height:1.5}' +
    '.cbv-cartao textarea,.cbv-cartao input{width:100%;box-sizing:border-box;padding:10px;border:1px solid #2a3a5e;border-radius:9px;background:#060b16;color:#fff;font:13px "JetBrains Mono",monospace}.cbv-cartao details{color:#8799bc;font-size:13px}.cbv-cartao details label{display:grid;gap:6px;margin:10px 0}.cbv-erro{color:#ff7ab8}';
  document.head.appendChild(st);

  conectar();
})();
