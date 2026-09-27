/* Babel Coop · ponte entre a interface (a mesma do protótipo) e o servidor desta máquina
   Carregada pelo servidor antes de app.js. O que ela troca:
   - a equipe simulada sai; quem existe é quem tem token e está na rede
   - toda ação (L.fazer) vira evento do diário e chega às outras Estações; eventos dos outros são aplicados aqui
   - a primeira abertura acha a equipe no Wi-Fi e pede para entrar (o token é o plano B), ou funda a equipe
   - na gestão, quem pediu para entrar aparece no topo com Aceitar e Recusar
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
    WS.onmessage = function (ev) { var m; try { m = JSON.parse(ev.data); } catch (e) { return; } chegou(m); };
    WS.onclose = function () { setTimeout(conectar, 2000); };
  }

  /* a ponte carrega antes do app.js: numa abertura lenta (a primeira da cópia instalada, com o macOS conferindo o pacote)
     o 'bemvindo' chegava antes de L.iniciar criar o estado, garantirPessoa lia L.estado null e a Estação ficava sem equipe.
     Até o estado existir, as mensagens esperam numa fila, na ordem em que chegaram. */
  var fila = [];
  function chegou(m) {
    if (L.estado && !fila.length) return receber(m);
    fila.push(m);
    if (fila.length === 1) (function esvaziar() {
      if (!L.estado) return setTimeout(esvaziar, 50);
      while (fila.length) { var p = fila.shift(); try { receber(p); } catch (e) { console.warn('[ponte] mensagem ' + p.tipo + ' falhou:', e); } }
    })();
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

  /* ---------- primeira abertura: achar a equipe no Wi-Fi e pedir para entrar (o token é o plano B) ou fundar ----------
     O servidor desta máquina escuta os anúncios da gestão (entrada.js). "Pedir para entrar" manda nome + chave efêmera;
     os dois lados mostram o mesmo código de 4 dígitos, e a pessoa confirma aqui que bateu com a tela da gestão (é o que prova que
     do outro lado está a gestão de verdade); quando a gestão aceita, o token chega cifrado e a tela recarrega já na equipe. */
  function boasVindas() {
    if (document.getElementById('coop-boasvindas')) return; /* o WebSocket religou: a tela já está aberta */
    var el = document.createElement('div');
    el.id = 'coop-boasvindas';
    el.innerHTML = '<div class="cbv-cartao"><img src="babel-logo.png" alt="" class="cbv-logo"><h1>babel-coop</h1>' +
      '<div id="cbv-achar"><p class="cbv-status" id="cbv-status" role="status">Procurando a equipe no Wi-Fi…</p>' +
      '<label class="cbv-campo" id="cbv-seu-nome-campo" hidden>Seu nome <input id="cbv-seu-nome" maxlength="40" placeholder="Como a equipe te chama" autocomplete="name"></label>' +
      '<div class="cbv-equipes" id="cbv-equipes"></div>' +
      '<p class="cbv-dica" id="cbv-dica" hidden>Ainda não achei a equipe. Confira se este computador está no mesmo Wi-Fi da gestão e, no Mac, se o babel-coop pode usar a rede local (Ajustes do Sistema → Privacidade e Segurança → Rede Local).</p></div>' +
      '<div class="cbv-pedido" id="cbv-pedido" hidden></div>' +
      '<p class="cbv-erro" id="cbv-erro" hidden></p>' +
      '<div class="cbv-planob"><p>Plano B: cole o token que a gestão mandou.</p>' +
      '<textarea id="cbv-token" rows="2" placeholder="babel-…" spellcheck="false"></textarea>' +
      '<button class="botao" id="cbv-entrar" type="button">Entrar com o token</button></div>' +
      '<details><summary>Sou o primeiro computador da equipe</summary><label>Seu nome <input id="cbv-nome" placeholder="Theus"></label><button class="botao" id="cbv-fundar" type="button">Fundar a equipe</button></details></div>';
    document.body.appendChild(el);
    var erro = el.querySelector('#cbv-erro');
    function mostrarErro(t) { erro.hidden = !t; erro.textContent = t || ''; }
    el.querySelector('#cbv-entrar').onclick = function () {
      pedir('/api/token', { token: el.querySelector('#cbv-token').value }).then(function (r) { if (r.erro) { mostrarErro(r.erro); return; } location.reload(); });
    };
    el.querySelector('#cbv-fundar').onclick = function () {
      pedir('/api/fundar', { nome: el.querySelector('#cbv-nome').value }).then(function (r) { if (r.erro) { mostrarErro(r.erro); return; } location.reload(); });
    };

    var inicio = Date.now(), ultimoAchado = '', ultimoPedido = '', relogio = null, saiu = false;
    var achar = el.querySelector('#cbv-achar'), caixaPedido = el.querySelector('#cbv-pedido');
    function desenharEquipes(lista) {
      var chave = JSON.stringify(lista);
      el.querySelector('#cbv-dica').hidden = !!lista.length || Date.now() - inicio < 8000;
      if (chave === ultimoAchado) return; /* redesenha só quando muda: o botão não pisca a cada pergunta */
      ultimoAchado = chave;
      el.querySelector('#cbv-status').textContent = lista.length ? 'Achei a sua equipe no Wi-Fi.' : 'Procurando a equipe no Wi-Fi…';
      el.querySelector('#cbv-seu-nome-campo').hidden = !lista.length;
      el.querySelector('#cbv-equipes').innerHTML = lista.map(function (e) {
        /* duas Estações dizendo ser a mesma gestão (uma forjada?): vão com o endereço, para a pessoa perguntar qual é */
        return '<div class="cbv-equipe"><span>Equipe <b>' + esc(e.equipe) + '</b> · ' + esc(e.gestao) + (e.repetida ? ' <small class="cbv-end">em ' + esc(e.endereco) + '</small>' : '') + '</span>' +
          '<button class="botao primario" type="button" data-entrar="' + esc(e.chave) + '">Pedir para entrar</button></div>';
      }).join('') + (lista.some(function (e) { return e.repetida; }) ? '<p class="cbv-dica">Mais de um computador diz ser a mesma gestão. Pergunte à gestão o endereço dela antes de pedir.</p>' : '');
    }
    function desenharPedido(pd) {
      var chave = pd ? pd.estado + ':' + pd.codigo + ':' + pd.confirmado + ':' + (pd.erro || '') : '';
      if (chave === ultimoPedido) return;
      ultimoPedido = chave;
      achar.hidden = !!pd;
      caixaPedido.hidden = !pd;
      if (!pd) { caixaPedido.innerHTML = ''; ultimoAchado = ''; return; }
      var g = esc(pd.gestao || 'a gestão');
      var html = '';
      if (pd.estado === 'enviando' || pd.estado === 'aberto' || pd.estado === 'aceito' || pd.estado === 'entrando') {
        var conferir = pd.confirmado || pd.estado === 'entrando' ? '' :
          '<p><b>Olhe a tela de ' + g + ':</b> o código lá é este mesmo? Só confirme se for igual, número por número.</p>' +
          '<div class="cbv-conferir"><button class="botao primario" type="button" data-confirmar="sim">O código bateu</button><button class="botao" type="button" data-confirmar="nao">Não bateu</button></div>';
        var espera = pd.estado === 'entrando' ? 'Entrando na equipe…'
          : pd.estado === 'aceito' ? g + ' aceitou. Falta você confirmar o código para entrar.'
          : pd.confirmado ? 'Código conferido. Esperando ' + g + ' aceitar…' : 'Esperando a resposta de ' + g + '…';
        html = '<p>Pedido enviado para <b>' + g + '</b> (equipe ' + esc(pd.equipe) + ').</p>' +
          '<p class="cbv-codigo" id="cbv-codigo" aria-label="código ' + esc(pd.codigo) + '">' + esc(pd.codigo) + '</p>' + conferir +
          '<p class="cbv-espera" id="cbv-espera">' + espera + '</p>' +
          '<button class="botao discreto" type="button" data-cancelar>Cancelar pedido</button>';
      } else if (pd.estado === 'nao-bateu') {
        html = '<p>Pedido cancelado: o código não bateu. Pode ter sido um engano de leitura, ou outro computador no Wi-Fi fingindo ser ' + g + '. Peça de novo ao lado de ' + g + ' e confira o código com calma.</p><button class="botao" type="button" data-cancelar>Pedir de novo</button>';
      } else if (pd.estado === 'recusado') {
        html = '<p>' + g + ' não aceitou o pedido agora. Tudo bem: fale com ' + g + ' e peça de novo quando quiser.</p><button class="botao" type="button" data-cancelar>Pedir de novo</button>';
      } else if (pd.estado === 'expirou') {
        html = '<p>O pedido ficou 10 minutos sem resposta e expirou. Peça de novo.</p><button class="botao" type="button" data-cancelar>Pedir de novo</button>';
      } else if (pd.estado === 'erro') {
        html = '<p>Não deu para entrar: ' + esc(pd.erro || 'erro desconhecido') + '.</p><button class="botao" type="button" data-cancelar>Tentar de novo</button>';
      } else if (pd.estado === 'dentro') {
        html = '<p>Pronto: você está na equipe.</p>';
      }
      caixaPedido.innerHTML = html;
    }
    function ciclo() {
      if (saiu || !document.body.contains(el)) return;
      pedir('/api/entrar/procurar').then(function (r) {
        if (r.pronto || (r.pedido && r.pedido.estado === 'dentro')) { saiu = true; location.reload(); return; }
        desenharPedido(r.pedido);
        if (!r.pedido) desenharEquipes(r.equipes || []);
      }, function () { /* servidor reiniciando: pergunta de novo */ }).then(function () { if (!saiu) relogio = setTimeout(ciclo, 1500); });
    }
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-entrar]');
      if (b) {
        var nome = el.querySelector('#cbv-seu-nome').value.trim();
        if (!nome) { mostrarErro('Escreva seu nome.'); el.querySelector('#cbv-seu-nome').focus(); return; }
        mostrarErro('');
        b.disabled = true;
        pedir('/api/entrar/pedir', { chave: b.getAttribute('data-entrar'), nome: nome }).then(function (r) {
          b.disabled = false;
          if (r.erro) { mostrarErro(r.erro); return; }
          desenharPedido(r);
        }, function () { b.disabled = false; mostrarErro('Não deu para falar com a Estação da gestão. Tente de novo.'); });
        return;
      }
      var c = ev.target.closest('[data-confirmar]');
      if (c) {
        c.disabled = true;
        pedir('/api/entrar/confirmar', { bateu: c.getAttribute('data-confirmar') === 'sim' }).then(function (r) {
          c.disabled = false;
          if (r.erro) { mostrarErro(r.erro); return; }
          if (r.estado === 'dentro') { saiu = true; clearTimeout(relogio); location.reload(); return; }
          desenharPedido(r);
        }, function () { c.disabled = false; mostrarErro('Não deu para falar com o app. Tente de novo.'); });
        return;
      }
      if (ev.target.closest('[data-cancelar]')) { pedir('/api/entrar/cancelar', {}).then(function () { mostrarErro(''); desenharPedido(null); }); }
    });
    ouvintes.push(function (m) { if (m.tipo === 'entrada-dentro' && !saiu) { saiu = true; clearTimeout(relogio); location.reload(); } });
    ciclo();
  }

  /* ---------- gestão: quem pediu para entrar aparece no topo da Estação (e na Equipe), com Aceitar e Recusar ali mesmo ---------- */
  var entrada = { lista: [], ocupado: {}, vistos: {} };
  /* o cartão é da Estação: a TV projetada na sala e a janelinha do cronômetro nunca mostram (o CSS também esconde se a vista mudar) */
  function naEstacao() {
    var v = document.documentElement.getAttribute('data-vista');
    if (v && v !== 'estacao') return false;
    return !/^#?(tv|ipad|cronometro)\b/.test(location.hash || '');
  }
  function desenharEntrada() {
    var box = document.getElementById('coop-entrada');
    if (!entrada.lista.length || !naEstacao()) { if (box) box.remove(); return; }
    if (!box) {
      box = document.createElement('div');
      box.id = 'coop-entrada';
      box.setAttribute('role', 'status');
      box.addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-entrada]');
        if (b) responderEntrada(b.getAttribute('data-id'), b.getAttribute('data-entrada') === 'aceitar');
      });
      document.body.appendChild(box);
    }
    box.innerHTML = entrada.lista.map(function (p) {
      var ocupado = entrada.ocupado[p.id] ? ' disabled' : '', novo = !entrada.vistos[p.id];
      entrada.vistos[p.id] = true; /* só o cartão novo chega com animação (uma vez) */
      return '<div class="cen-cartao' + (novo ? ' cen-novo' : '') + '" data-pedido="' + esc(p.id) + '"><span class="cen-texto"><b>' + esc(p.nome) + '</b> quer entrar na equipe · código <b class="cen-codigo">' + esc(p.codigo) + '</b><small class="cen-ajuda">Aceite só se a tela de ' + esc(p.nome) + ' mostra o mesmo código.</small></span>' +
        '<button class="botao primario" type="button" data-entrada="aceitar" data-id="' + esc(p.id) + '"' + ocupado + '>Aceitar</button>' +
        '<button class="botao" type="button" data-entrada="recusar" data-id="' + esc(p.id) + '"' + ocupado + '>Recusar</button></div>';
    }).join('');
  }
  function mudouEntrada(lista) {
    entrada.lista = Array.isArray(lista) ? lista : [];
    desenharEntrada();
    if (BC.estacao && BC.estacao.render && BC.estacao.ui) { try { BC.estacao.render(); } catch (e) { /* a Estação ainda montando */ } } /* a lateral da Equipe mostra os mesmos pedidos */
  }
  function responderEntrada(id, aceitar) {
    var p = entrada.lista.filter(function (x) { return x.id === id; })[0];
    if (!p || entrada.ocupado[id]) return Promise.resolve(null);
    entrada.ocupado[id] = true; desenharEntrada();
    return pedir('/api/entrar/' + (aceitar ? 'aceitar' : 'recusar'), { id: id }).then(function (r) {
      delete entrada.ocupado[id];
      var aviso = BC.estacao && BC.estacao.aviso ? BC.estacao.aviso : function () {};
      if (r.erro) aviso(r.erro);
      else aviso(aceitar ? 'Pedido de ' + p.nome + ' aceito. A Estação de ' + p.nome + ' entra sozinha em alguns segundos.' : 'Pedido de ' + p.nome + ' recusado.');
      mudouEntrada(entrada.lista.filter(function (x) { return x.id !== id; }));
      return r;
    }, function () { delete entrada.ocupado[id]; desenharEntrada(); return null; });
  }
  ouvintes.push(function (m) {
    if (m.tipo === 'entrada-pedidos') mudouEntrada(m.lista);
    if (m.tipo === 'bemvindo' && m.eu && m.eu.papel === 'gestao') pedir('/api/entrar/pedidos').then(function (r) { mudouEntrada(r.lista); }, function () {});
  });

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
    /* quem pediu para entrar pelo Wi-Fi (só na gestão): a lateral da Equipe usa a mesma lista e os mesmos botões do topo */
    entrada: { pedidos: function () { return entrada.lista; }, aceitar: function (id) { return responderEntrada(id, true); }, recusar: function (id) { return responderEntrada(id, false); } },
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
    '.cbv-cartao textarea,.cbv-cartao input{width:100%;box-sizing:border-box;padding:10px;border:1px solid #2a3a5e;border-radius:9px;background:#060b16;color:#fff;font:13px "JetBrains Mono",monospace}.cbv-cartao details{color:#8799bc;font-size:13px}.cbv-cartao details label{display:grid;gap:6px;margin:10px 0}.cbv-erro{color:#ff7ab8}' +
    '#cbv-achar,.cbv-pedido,.cbv-planob{display:grid;gap:10px}.cbv-status{color:#d7e4fb!important}.cbv-campo{display:grid;gap:6px;color:#8799bc;font-size:13px}.cbv-equipes{display:grid;gap:8px}.cbv-equipe{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:10px 12px;border:1px solid #2a3a5e;border-radius:10px;background:#0e1830}.cbv-equipe b{color:#fff}.cbv-dica{font-size:13px}' +
    '.cbv-codigo{margin:4px 0!important;font:600 34px "JetBrains Mono",monospace;letter-spacing:.24em;color:#29ccec!important;text-align:center}.cbv-espera{font-size:13px}.cbv-planob{padding-top:12px;border-top:1px solid #1e2a44}.cbv-planob p{font-size:13px}' +
    '#coop-entrada{position:fixed;top:52px;left:50%;transform:translateX(-50%);z-index:950;display:grid;gap:8px;width:min(580px,calc(100vw - 32px))}' +
    '.cen-cartao{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 14px;border:1px solid #3b3170;border-radius:12px;background:#0b1224;opacity:1;color:#d7e4fb;font:14px "IBM Plex Sans",system-ui,sans-serif;box-shadow:0 12px 32px rgba(0,0,0,.45)}.cen-novo{animation:cen-chega .32s ease-out both}' +
    '.cen-texto{flex:1;min-width:200px}.cen-ajuda{display:block;margin-top:2px;color:#8799bc;font-size:12px}' +
    /* o cartão é sempre escuro: o botão do tema (Vibe, claro) não pode herdar texto escuro aqui */
    '#coop-entrada .botao:not(.primario){color:#d7e4fb;background:#131d36;border-color:#2a3a5e}#coop-entrada .botao:not(.primario):hover:not(:disabled){color:#fff;background:#1b2848;border-color:#3b4f7a}' +
    'html[data-vista]:not([data-vista="estacao"]) #coop-entrada{display:none!important}' +
    '.cbv-conferir{display:flex;gap:8px;flex-wrap:wrap}.cbv-end{color:#8799bc;font-family:"JetBrains Mono",monospace}.cen-codigo{font-family:"JetBrains Mono",monospace;letter-spacing:.14em;color:#29ccec}@keyframes cen-chega{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){.cen-novo{animation:none}}';
  document.head.appendChild(st);

  conectar();
})();
