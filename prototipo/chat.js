/* Babel Coop — protótipo · chat no jeito do WhatsApp (com a cara da Babel) */
window.BC = window.BC || {};
BC.acoes = BC.acoes || {};
BC.formularios = BC.formularios || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc, A = BC.acoes;
  function L() { return BC.loja; }
  function ui() { return BC.estacao.ui; }
  var EMOJIS = ['👍', '❤️', '😂', '🎉', '🙏', '🔥'];

  function comMencoes(texto) { return esc(texto).replace(/@([A-Za-zÀ-ú]+)/g, '<span class="mencao">@$1</span>'); }

  function avatarConversa(c) {
    var eu = L().eu;
    if (c.tipo === 'direta') return U.avatar(L().pessoa(c.membros.filter(function (m) { return m !== eu; })[0]), 40);
    if (c.tipo === 'cliente') return '<span class="avatar zap-cliente" style="--tam:40px">CV</span>';
    return '<span class="avatar zap-grupo" style="--tam:40px">' + esc(c.nome.slice(0, 1)) + '</span>';
  }

  function ultima(c) { var ms = L().estado.mensagens[c.id] || []; return ms[ms.length - 1]; }

  BC.chat = {
    digitando: function (convId, pessoa, ms) {
      ui().digitando = ui().digitando || {};
      ui().digitando[convId] = { pessoa: pessoa, ate: Date.now() + ms };
      if (BC.estacao.abaAtual().tipo === 'chat' && ui().canal === convId) BC.estacao.render();
      setTimeout(function () { if (BC.estacao.abaAtual().tipo === 'chat') BC.estacao.render(); }, ms + 50);
    },

    lateral: function () {
      var eu = L().eu, f = U.normalizar(ui().buscaChat || '');
      var conv = L().minhasConversas(eu).filter(function (c) { return !f || U.normalizar(L().nomeConversa(c, eu)).indexOf(f) !== -1; });
      function ts(c) { var m = ultima(c); return (c.fixada ? 1e14 : 0) + (m ? m.ts : 0); }
      function linha(c) {
        var m = ultima(c), n = L().naoLidas(eu, c.id), nome = L().nomeConversa(c, eu);
        var previa = m ? (m.pessoa === eu ? 'Você: ' : c.tipo === 'grupo' ? L().nome(m.pessoa) + ': ' : '') + (m.texto || 'arquivo') : 'Sem mensagens';
        return '<li><button class="zap-conv" type="button" data-acao="abrir-conversa" data-conv="' + esc(c.id) + '" aria-current="' + (ui().canal === c.id) + '">' +
          avatarConversa(c) + '<span class="zap-conv-corpo"><span class="zap-conv-linha"><b>' + esc(nome) + (c.fixada ? ' 📌' : '') + '</b><time>' + (m ? U.quando(m.ts) : '') + '</time></span>' +
          '<span class="zap-conv-linha"><span class="zap-previa">' + esc(previa) + '</span>' + (n ? '<span class="zap-badge">' + n + '</span>' : '') + '</span></span></button></li>';
      }
      var internas = conv.filter(function (c) { return c.tipo !== 'cliente'; }).sort(function (a, b) { return ts(b) - ts(a); });
      var clientes = conv.filter(function (c) { return c.tipo === 'cliente'; });
      var semConversa = L().estado.pessoas.filter(function (p) { return p.id !== eu && !L().conversa(L().conversaDireta(eu, p.id)) && (!f || U.normalizar(p.nome).indexOf(f) !== -1); });
      return '<div class="lat-titulo"><span class="rotulo">Conversas</span></div>' +
        '<div class="arv-filtro"><input type="text" id="busca-chat" placeholder="Pesquisar conversa ou pessoa" autocomplete="off" value="' + esc(ui().buscaChat || '') + '"></div>' +
        '<ul class="lat-lista zap-lista">' + internas.map(linha).join('') + '</ul>' +
        (clientes.length ? '<div class="lat-titulo"><span class="rotulo">Clientes · WhatsApp Business</span></div><ul class="lat-lista zap-lista">' + clientes.map(linha).join('') + '</ul>' : '') +
        (semConversa.length ? '<div class="lat-titulo"><span class="rotulo">Começar conversa</span></div><div class="zap-pessoas">' + semConversa.map(function (p) {
          return '<button type="button" class="zap-pessoa" data-acao="nova-direta" data-id="' + p.id + '" title="Conversar com ' + esc(p.nome) + '">' + U.avatar(p, 30, true) + '<span>' + esc(p.nome) + '</span></button>';
        }).join('') + '</div>' : '');
    },

    conteudo: function () {
      var e = L().estado, eu = L().eu, c = L().conversa(ui().canal) || e.conversas[0], ms = e.mensagens[c.id] || [];
      if (L().naoLidas(eu, c.id)) setTimeout(function () { L().fazer('lida', c.id); }, 0);
      var dig = ui().digitando && ui().digitando[c.id], status;
      if (dig && dig.ate > Date.now()) status = '<span class="zap-digitando">' + esc(L().nome(dig.pessoa)) + ' está digitando…</span>';
      else if (c.tipo === 'direta') { var o = L().pessoa(c.membros.filter(function (m) { return m !== eu; })[0]); status = o.status === 'offline' ? 'visto ' + U.relativo(o.ultimaVez) : o.status; }
      else if (c.tipo === 'cliente') status = 'WhatsApp Business · simulação da API oficial';
      else status = c.membros ? c.membros.map(L().nome).join(', ') : 'todos da Babel';

      var html = '<div class="zap"><header class="zap-cab">' + avatarConversa(c) + '<div><b>' + esc(L().nomeConversa(c, eu)) + '</b><small>' + status + '</small></div></header><div class="zap-msgs" id="chat-msgs">';
      var dia = '';
      ms.forEach(function (m) {
        var d = U.mesmoDia(m.ts) ? 'Hoje' : U.mesmoDia(m.ts, Date.now() - U.DIA) ? 'Ontem' : new Date(m.ts).toLocaleDateString('pt-BR');
        if (d !== dia) { dia = d; html += '<div class="zap-dia"><span>' + d + '</span></div>'; }
        var minha = m.pessoa === eu, p = L().pessoa(m.pessoa);
        var citada = m.respondeA ? ms.filter(function (x) { return x.id === m.respondeA; })[0] : null;
        var reacoes = Object.keys(m.reacoes || {});
        html += '<div class="bolha-linha' + (minha ? ' minha' : '') + '"><div class="bolha' + (minha ? ' minha' : '') + '">' +
          (!minha && c.tipo !== 'direta' ? '<b class="bolha-nome" style="color:' + (p ? p.cor : '#88d7ea') + '">' + esc(m.pessoa === 'cliente' ? L().nomeConversa(c, eu) : L().nome(m.pessoa)) + '</b>' : '') +
          (citada ? '<div class="bolha-citacao"><b>' + esc(L().nome(citada.pessoa)) + '</b><span>' + esc(citada.texto.slice(0, 120)) + '</span></div>' : '') +
          (m.arquivo ? '<button class="arq-chip" type="button" data-acao="abrir-caminho" data-caminho="' + esc(m.arquivo) + '">▤ ' + esc(m.arquivo.split('/').pop()) + '</button>' : '') +
          (m.texto ? '<span class="bolha-texto">' + comMencoes(m.texto) + '</span>' : '') +
          '<span class="bolha-meta">' + U.hora(m.ts) + (minha ? ' <span class="ticks' + (Date.now() - m.ts > 60000 ? ' lido' : '') + '">✓✓</span>' : '') + '</span>' +
          (reacoes.length ? '<div class="bolha-reacoes">' + reacoes.map(function (r) { return '<span>' + r + ' ' + m.reacoes[r].length + '</span>'; }).join('') + '</div>' : '') +
          '<div class="bolha-acoes"><button type="button" data-acao="msg-responder" data-id="' + esc(m.id) + '" title="Responder">↩</button>' +
          EMOJIS.slice(0, 4).map(function (em) { return '<button type="button" data-acao="msg-reagir" data-id="' + esc(m.id) + '" data-emoji="' + em + '">' + em + '</button>'; }).join('') +
          '<button type="button" data-acao="msg-demanda" data-id="' + esc(m.id) + '" title="Virar demanda">➜ demanda</button>' +
          '<button type="button" data-acao="msg-tv" data-id="' + esc(m.id) + '" title="Mandar para o mural da TV">▣ TV</button></div>' +
          '</div></div>';
      });
      if (!ms.length) html += '<p class="vazio">Nenhuma mensagem ainda. Diga oi.</p>';
      html += '</div>';
      var resp = ui().respondendo && ms.filter(function (x) { return x.id === ui().respondendo; })[0];
      if (resp) html += '<div class="zap-respondendo"><div><b>Respondendo a ' + esc(L().nome(resp.pessoa)) + '</b><span>' + esc(resp.texto.slice(0, 100)) + '</span></div><button type="button" class="botao discreto" data-acao="msg-responder" data-id="">×</button></div>';
      if (ui().emojis) html += '<div class="zap-emojis">' + EMOJIS.map(function (em) { return '<button type="button" data-acao="emoji" data-emoji="' + em + '">' + em + '</button>'; }).join('') + '</div>';
      if (ui().anexar) {
        html += '<div class="zap-anexar"><span class="rotulo">Anexar do seu HD</span>' + L().estado.arquivos.filter(function (a) { return a.dono === eu; }).slice(0, 8).map(function (a) {
          return '<button type="button" class="botao discreto" data-acao="anexar" data-caminho="' + esc(a.caminho) + '">▤ ' + esc(a.caminho.split('/').pop()) + '</button>';
        }).join('') + '</div>';
      }
      html += '<form class="zap-compor" data-form="chat"><button type="button" class="zap-ic" data-acao="emojis" aria-label="Emojis">😊</button>' +
        '<button type="button" class="zap-ic" data-acao="anexar-abrir" aria-label="Anexar">📎</button>' +
        '<textarea id="chat-texto" rows="1" placeholder="Mensagem"></textarea>' +
        '<button type="submit" class="zap-enviar" aria-label="Enviar">➤</button></form>' +
        (c.tipo === 'cliente' ? '<p class="form-ajuda">No app de verdade, esta conversa chega pela API oficial do WhatsApp Business; a resposta sai pelo número da Babel.</p>' : '') + '</div>';
      return html;
    }
  };

  function msg(id) { return (L().estado.mensagens[ui().canal] || []).filter(function (m) { return m.id === id; })[0]; }

  BC.formularios.chat = function () {
    var campo = document.getElementById('chat-texto'), texto = campo.value.trim();
    if (!texto) return;
    campo.value = '';
    L().fazer('mensagem', ui().canal, texto, { respondeA: ui().respondendo || null });
    ui().respondendo = null;
    ui().emojis = false;
    BC.estacao.render();
  };

  A['abrir-conversa'] = function (el) {
    ui().canal = el.dataset.conv;
    ui().respondendo = null;
    BC.estacao.abrirAba({ id: 'chat', tipo: 'chat', atividade: 'chat' });
    L().fazer('lida', el.dataset.conv);
  };
  A['nova-direta'] = function (el) {
    if (!L().fazer('abrirDireta', el.dataset.id)) return;
    ui().canal = L().conversaDireta(L().eu, el.dataset.id);
    ui().respondendo = null;
    BC.estacao.abrirAba({ id: 'chat', tipo: 'chat', atividade: 'chat' });
    var c = document.getElementById('chat-texto');
    if (c) c.focus();
  };
  A['msg-responder'] = function (el) { ui().respondendo = el.dataset.id || null; BC.estacao.render(); var c = document.getElementById('chat-texto'); if (c) c.focus(); };
  A['msg-reagir'] = function (el) { L().fazer('reagir', ui().canal, el.dataset.id, el.dataset.emoji); };
  A.emojis = function () { ui().emojis = !ui().emojis; ui().anexar = false; BC.estacao.render(); };
  A.emoji = function (el) { var c = document.getElementById('chat-texto'); if (c) { c.value += el.dataset.emoji; c.focus(); } };
  A['anexar-abrir'] = function () { ui().anexar = !ui().anexar; ui().emojis = false; BC.estacao.render(); };
  A.anexar = function (el) { ui().anexar = false; L().fazer('mensagem', ui().canal, '', { arquivo: el.dataset.caminho }); };
  A['msg-demanda'] = function (el) {
    var m = msg(el.dataset.id);
    if (!m) return;
    ui().rascunho = { titulo: m.texto.slice(0, 110), para: m.pessoa !== L().eu && m.pessoa !== 'cliente' ? m.pessoa : null, descricao: 'Veio de uma mensagem no chat.' };
    A['nova-demanda']();
  };
  A['msg-tv'] = function (el) {
    var m = msg(el.dataset.id);
    if (m && L().fazer('recado', (m.pessoa !== L().eu ? L().nome(m.pessoa) + ': ' : '') + m.texto)) BC.estacao.aviso('Mensagem no mural da TV.');
  };
})(window.BC);
