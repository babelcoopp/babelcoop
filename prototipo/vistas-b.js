/* Babel Coop — protótipo · vistas: Tarefas com fluxo, Metas, Equipe (fotos, cuidado, controle da TV) e Mapa */
window.BC = window.BC || {};
BC.acoes = BC.acoes || {};
BC.vistas = BC.vistas || {};
BC.formularios = BC.formularios || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc, A = BC.acoes, F = BC.formularios;
  function L() { return BC.loja; }
  function ui() { return BC.estacao.ui; }
  /* app real (a ponte existe): sem rótulo de demonstração; o protótipo puro continua mostrando */
  function real() { return !!BC.real; }
  function aberta(t) { return t.atual < L().fluxo(t.fluxo).etapas.length; }

  /* ======================= TAREFAS COM FLUXO ======================= */

  function trilha(t) {
    var f = L().fluxo(t.fluxo);
    return '<div class="trilha">' + t.donos.map(function (id, i) {
      var p = L().pessoa(id), cls = i < t.atual ? 'feito' : i === t.atual ? 'atual' : '';
      return (i ? '<span class="trilha-fio' + (i <= t.atual ? ' feito' : '') + '"></span>' : '') +
        '<div class="trilha-no ' + cls + '" style="--cor:' + p.cor + '"><span class="trilha-bola">' + (p.foto ? U.avatar(p, 30) : esc(p.nome.slice(0, 2).toUpperCase())) + '</span>' +
        '<small><b>' + esc(f.etapas[i]) + '</b><br>' + esc(p.nome) + '</small></div>';
    }).join('') + '</div>';
  }

  function cartao(t) {
    var f = L().fluxo(t.fluxo), p = U.prazo(t.prazo), com = aberta(t) ? L().pessoa(t.donos[t.atual]) : null;
    var parada = aberta(t) && Date.now() - t.paradaDesde > 2 * U.DIA;
    return '<button class="quadro-cartao" type="button" data-acao="abrir-tarefa" data-id="' + t.id + '">' +
      '<span class="item-titulo">' + esc(t.titulo) + '</span>' +
      '<span class="linha"><span class="item-meta">' + esc(f.etapas[t.atual] || 'concluída') + (com ? ' · com ' + esc(com.nome) : '') + '</span>' + (com ? U.avatar(com, 22) : '') + '</span>' +
      '<span class="barra" style="--v:' + L().pct(t) + '%"></span>' +
      '<span class="linha"><span class="chip ' + p.classe + '">' + p.texto + '</span>' + (parada ? '<span class="chip parada">parada há ' + Math.floor((Date.now() - t.paradaDesde) / U.DIA) + ' dias</span>' : '') +
      '<span class="num">' + L().pct(t) + '%</span></span></button>';
  }

  BC.vistas.tarefas = {
    lateral: function () {
      var e = L().estado, v = ui().visaoTarefas || 'todas', eu = L().eu;
      function it(id, nome, n) { return '<li><button class="lat-item" type="button" data-acao="tar-visao" data-visao="' + id + '" aria-current="' + (v === id) + '"><span class="rotulo-texto">' + nome + '</span><span class="conta">' + n + '</span></button></li>'; }
      return '<div class="lat-titulo"><span class="rotulo">Tarefas com fluxo</span><button class="botao discreto" type="button" data-acao="nova-tarefa">+ Nova</button></div><ul class="lat-lista">' +
        it('todas', 'Todas abertas', e.tarefas.filter(aberta).length) + it('minhas', 'Comigo agora', BC.comigo().length) +
        it('minha-trilha', 'Passam por mim', e.tarefas.filter(function (t) { return aberta(t) && t.donos.indexOf(eu) !== -1; }).length) +
        it('concluidas', 'Concluídas', e.tarefas.filter(function (t) { return !aberta(t); }).length) + '</ul>' +
        '<p class="lat-nota">Uma tarefa passa de mão em mão: cada etapa tem um responsável. A TV mostra a trilha e o pulso de luz quando ela muda de mão.</p>';
    },
    conteudo: function () {
      var e = L().estado, v = ui().visaoTarefas || 'todas', eu = L().eu;
      var lista = e.tarefas.filter(function (t) {
        if (v === 'concluidas') return !aberta(t);
        if (!aberta(t)) return false;
        if (v === 'minhas') return t.donos[t.atual] === eu;
        if (v === 'minha-trilha') return t.donos.indexOf(eu) !== -1;
        return true;
      });
      var html = '<div class="pagina-cab"><div><h1 class="pagina-titulo">Tarefas com fluxo</h1><p class="pagina-sub">' + lista.length + ' tarefa(s) · colunas por tipo de fluxo</p></div>' +
        '<button class="botao primario" type="button" data-acao="nova-tarefa">Nova tarefa com fluxo</button></div>';
      var cols = e.fluxos.map(function (f) {
        var ts = lista.filter(function (t) { return t.fluxo === f.id; });
        if (!ts.length) return '';
        return '<div class="quadro-coluna"><div class="secao-cab"><span class="rotulo">' + esc(f.nome) + '</span><span class="num">' + ts.length + '</span></div>' + ts.map(cartao).join('') + '</div>';
      }).join('');
      return html + (cols ? '<div class="kanban">' + cols + '</div>' : '<p class="vazio">Nenhuma tarefa aqui.</p>');
    },
    detalhe: function (tab) {
      var t = L().tarefa(tab.ref);
      if (!t) return '<p class="vazio">Esta tarefa não existe mais.</p>';
      var f = L().fluxo(t.fluxo), eu = L().eu, comigo = aberta(t) && t.donos[t.atual] === eu, prox = t.donos[t.atual + 1];
      var html = '<div class="pagina-cab"><div><h1 class="pagina-titulo">' + esc(t.titulo) + '</h1><p class="pagina-sub">' + esc(f.nome) + ' · prioridade ' + esc(t.prioridade) + ' · prazo ' + U.prazo(t.prazo).texto +
        (aberta(t) ? ' · nesta mão ' + U.relativo(t.paradaDesde) : ' · concluída') + '</p></div><span class="num dem-relogio" style="font-size:28px">' + L().pct(t) + '%</span></div>' +
        '<section class="secao"><span class="rotulo">A trilha</span>' + trilha(t) + '</section>';
      if (comigo) {
        html += '<div class="cartao destaque-acao"><p class="dem-desc">Esta etapa (<b>' + esc(f.etapas[t.atual]) + '</b>) está com você.</p><div class="dem-acoes">' +
          '<button class="botao primario" type="button" data-acao="concluir-etapa" data-id="' + t.id + '">' + (prox ? 'Concluir minha etapa e passar para ' + esc(L().nome(prox)) : 'Concluir a tarefa') + '</button></div></div>';
      } else if (aberta(t)) {
        html += '<p class="form-ajuda">Agora está com ' + esc(L().nome(t.donos[t.atual])) + ', na etapa "' + esc(f.etapas[t.atual]) + '".</p>';
      }
      var ck = t.checklist || [];
      html += '<section class="secao"><span class="rotulo">Checklist</span><ul class="lista-limpa">' + ck.map(function (c, i) {
        return '<li><label class="marcar passo"><input type="checkbox" data-acao="tar-check" data-id="' + t.id + '" data-i="' + i + '"' + (c.feito ? ' checked' : '') + '> ' + esc(c.texto) + '</label></li>';
      }).join('') + '</ul><form class="campo-inline" data-form="tar-check"><input type="text" id="tar-check-' + t.id + '" placeholder="Novo item do checklist"><input type="hidden" id="tar-check-id" value="' + t.id + '"><button class="botao" type="submit">+</button></form></section>';
      var evs = L().estado.eventos.filter(function (ev) { return ev.tarefa === t.id; });
      if (evs.length) html += '<section class="secao"><span class="rotulo">Passagens</span><ul class="lista-limpa">' + evs.map(function (ev) { return '<li class="form-ajuda">' + U.quando(ev.ts) + ' · ' + esc(ev.texto) + '</li>'; }).join('') + '</ul></section>';
      return html;
    },
    formulario: function () {
      var e = L().estado, fsel = ui().fluxoNovo || e.fluxos[0].id, f = L().fluxo(fsel);
      var pessoas = e.pessoas.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nome) + ' · ' + esc(e.areas[p.area]) + '</option>'; }).join('');
      return '<div class="pagina-cab"><div><h1 class="pagina-titulo">Nova tarefa com fluxo</h1><p class="pagina-sub">Escolha o fluxo e quem cuida de cada etapa. A tarefa começa com a primeira pessoa.</p></div></div>' +
        '<form class="form" data-form="nova-tarefa"><label><span class="rotulo">O que é</span><input type="text" id="nt-titulo" required placeholder="Ex.: Proposta Grupo Norte"></label>' +
        '<label><span class="rotulo">Fluxo</span><select id="nt-fluxo" data-acao-mudar="tar-fluxo">' + e.fluxos.map(function (x) { return '<option value="' + x.id + '"' + (x.id === fsel ? ' selected' : '') + '>' + esc(x.nome) + ' (' + x.etapas.length + ' etapas)</option>'; }).join('') + '</select></label>' +
        '<div class="form-linha">' + f.etapas.map(function (et, i) { return '<label><span class="rotulo">' + (i + 1) + '. ' + esc(et) + '</span><select id="nt-dono-' + i + '">' + pessoas + '</select></label>'; }).join('') + '</div>' +
        '<div class="form-linha"><label><span class="rotulo">Prazo</span><select id="nt-prazo"><option value="1">Amanhã</option><option value="3" selected>Em 3 dias</option><option value="7">Em uma semana</option><option value="">Sem prazo</option></select></label>' +
        '<label><span class="rotulo">Prioridade</span><select id="nt-prioridade"><option>urgente</option><option>alta</option><option selected>média</option><option>baixa</option></select></label></div>' +
        '<div class="dem-acoes"><button class="botao primario" type="submit">Criar tarefa</button><button class="botao" type="button" data-acao="fechar-aba" data-id="nova-tarefa">Cancelar</button></div></form>';
    }
  };

  A['abrir-tarefa'] = function (el) {
    var t = L().tarefa(el.dataset.id);
    if (t) BC.estacao.abrirAba({ id: 'tarefa:' + t.id, tipo: 'tarefa', ref: t.id, titulo: t.titulo, atividade: 'tarefas' });
  };
  A['nova-tarefa'] = function () { BC.estacao.abrirAba({ id: 'nova-tarefa', tipo: 'nova-tarefa', titulo: 'Nova tarefa', atividade: 'tarefas' }); };
  A['tar-visao'] = function (el) { ui().visaoTarefas = el.dataset.visao; BC.estacao.abrir('tarefas'); };
  A['tar-fluxo'] = function (el) { ui().fluxoNovo = el.value; BC.estacao.render(); };
  A['tar-check'] = function (el) { L().fazer('marcarChecklist', el.dataset.id, +el.dataset.i); };
  A['concluir-etapa'] = function (el) {
    var t = L().tarefa(el.dataset.id), prox = t && t.donos[t.atual + 1];
    if (L().fazer('concluirEtapa', el.dataset.id)) BC.estacao.aviso(prox ? 'Passou para ' + L().nome(prox) + '. A TV mostra o pulso de luz.' : 'Tarefa concluída!');
  };
  F['tar-check'] = function () {
    var id = document.getElementById('tar-check-id').value, c = document.getElementById('tar-check-' + id), t = c.value.trim();
    if (t && L().fazer('marcarChecklist', id, null, t)) c.value = '';
  };
  F['nova-tarefa'] = function () {
    var f = L().fluxo(document.getElementById('nt-fluxo').value), titulo = document.getElementById('nt-titulo').value.trim(), dias = document.getElementById('nt-prazo').value;
    if (!titulo) return;
    var donos = f.etapas.map(function (x, i) { return document.getElementById('nt-dono-' + i).value; });
    var ok = L().fazer('novaTarefa', { titulo: titulo, fluxo: f.id, donos: donos, prazo: dias ? Date.now() + (+dias) * U.DIA : null, prioridade: document.getElementById('nt-prioridade').value });
    if (ok) { BC.estacao.fecharAba('nova-tarefa'); A['abrir-tarefa']({ dataset: { id: L().estado.tarefas[0].id } }); BC.estacao.aviso('Tarefa criada: começa com ' + L().nome(donos[0]) + '.'); }
  };

  /* ======================= METAS E CAMPANHAS ======================= */

  var PRESETS = [[15, 'Reunião geral'], [25, 'Foco'], [10, 'Stand-up']];

  BC.vistas.metas = {
    lateral: function () {
      var e = L().estado;
      return '<div class="lat-titulo"><span class="rotulo">Metas do mês</span></div><ul class="lat-lista">' + e.metas.map(function (m) {
        var pc = BC.pctMeta(m);
        return '<li><span class="lat-item"><span class="rotulo-texto">' + esc(e.areas[m.area]) + '</span><span class="conta">' + (pc == null ? 'sem dado' : Math.round(pc * 100) + '%') + '</span></span></li>';
      }).join('') + '</ul><div class="lat-titulo"><span class="rotulo">Campanha</span></div><ul class="lat-lista"><li><span class="lat-item"><span class="rotulo-texto">' + esc(e.campanha.nome) + '</span><span class="conta">' + e.campanha.atual + '/' + e.campanha.alvo + '</span></span></li></ul>' +
        '<p class="lat-nota">Meta sem número aparece como "sem dado", nunca como zero.</p>';
    },
    conteudo: function () {
      var e = L().estado, c = e.campanha, ct = e.cronometroTv;
      var inst = e.metas.map(function (m) {
        var pc = BC.pctMeta(m);
        return '<div class="instrumento"><div class="instrumento-arco">' + BC.arco(pc, pc != null && pc >= 0.9 ? '#7fd6a6' : '#9160ec', pc == null) +
          '<b style="color:' + (pc == null ? 'var(--sem-dado)' : 'var(--e-texto)') + '">' + (pc == null ? '—' : Math.round(pc * 100) + '%') + '</b></div>' +
          '<small><b>' + esc(e.areas[m.area]) + '</b><br>' + esc(m.titulo) + '<br>' + esc(BC.valorMeta(m)) + '</small></div>';
      }).join('');
      var cron = ct && ct.fim > Date.now()
        ? '<p class="dem-desc">Na TV agora: <b>' + esc(ct.rotulo) + '</b> · faltam <span class="num" data-regressiva="' + ct.fim + '">' + U.regressiva(ct.fim).texto + '</span></p><div><button class="botao" type="button" data-acao="parar-cron-tv">Parar cronômetro</button></div>'
        : '<div class="dem-acoes">' + PRESETS.map(function (p) { return '<button class="botao" type="button" data-acao="cron-tv" data-min="' + p[0] + '" data-rotulo="' + p[1] + '">' + p[1] + ' · ' + p[0] + ' min</button>'; }).join('') + '</div>';
      return '<div class="pagina-cab"><div><h1 class="pagina-titulo">Metas e campanhas</h1><p class="pagina-sub">' + U.mes() + ' · o mesmo painel que aparece na TV</p></div></div>' +
        '<section class="secao"><span class="rotulo">Metas do mês</span><div class="instrumentos">' + inst + '</div></section>' +
        '<div class="grade-2"><section class="secao cartao"><span class="rotulo">' + esc(c.nome) + '</span>' +
        '<div class="campanha-linha"><div class="campanha-anel">' + BC.anel(c.atual / c.alvo, '#29ccec') + '<b class="num">' + c.atual + '/' + c.alvo + '</b></div>' +
        '<div><p class="dem-desc">' + c.atual + ' de ' + c.alvo + ' ' + esc(c.descricao) + '</p><p class="pagina-sub">termina em <span data-regressiva="' + c.fim + '">' + U.regressiva(c.fim).texto + '</span></p>' +
        '<button class="botao" type="button" data-acao="mais-cliente"' + (c.atual >= c.alvo ? ' disabled' : '') + '>+1 cliente' + (real() ? '' : ' (demonstração)') + '</button></div></div></section>' +
        '<section class="secao cartao"><span class="rotulo">Cronômetro na TV</span>' + cron + '</section></div>';
    }
  };

  A['mais-cliente'] = function () { L().fazer('maisUmCliente'); };
  A['cron-tv'] = function (el) { if (L().fazer('cronometroTv', +el.dataset.min, el.dataset.rotulo)) BC.estacao.aviso('Cronômetro "' + el.dataset.rotulo + '" rodando na TV.'); };
  A['parar-cron-tv'] = function () { L().fazer('pararCronometroTv'); };

  /* ======================= EQUIPE (gestão, fotos, cuidado, TV) ======================= */

  var MODOS_TV = [['painel', 'Painel geral'], ['reuniao', 'Reunião'], ['quadro', 'Quadro ao vivo']];

  /* quem pediu para entrar pelo Wi-Fi (app real, só na gestão): o mesmo código de 4 dígitos aparece na tela da pessoa; confere e aceita ali mesmo */
  function pedidosEntrada() {
    var lista = BC.real && BC.real.entrada ? BC.real.entrada.pedidos() : [];
    if (!lista.length) return '';
    return '<div class="lat-titulo"><span class="rotulo">Pedindo para entrar</span></div><div class="lat-convite">' + lista.map(function (p) {
      return '<div class="cartao convite-cartao" data-pedido="' + esc(p.id) + '"><b>' + esc(p.nome) + ' quer entrar na equipe</b><p class="form-ajuda">Código <b class="num">' + esc(p.codigo) + '</b>: confira se é o mesmo que aparece na tela de ' + esc(p.nome) + '.</p>' +
        '<div class="dem-acoes"><button class="botao primario" type="button" data-acao="eq-entrada-aceitar" data-id="' + esc(p.id) + '">Aceitar</button><button class="botao" type="button" data-acao="eq-entrada-recusar" data-id="' + esc(p.id) + '">Recusar</button></div></div>';
    }).join('') + '</div>';
  }
  A['eq-entrada-aceitar'] = function (el) { if (BC.real && BC.real.entrada) BC.real.entrada.aceitar(el.dataset.id); };
  A['eq-entrada-recusar'] = function (el) { if (BC.real && BC.real.entrada) BC.real.entrada.recusar(el.dataset.id); };

  /* convidar pessoa = gerar um token de instalação (plano B: no mesmo Wi-Fi a pessoa pede para entrar e o pedido aparece acima) */
  /* o link do instalador servido por esta Estação no Wi-Fi (app real: GET /api/instalar/info); pedido uma vez e guardado na tela */
  function linkInstalar() {
    if (!(BC.real && BC.real.eu)) return '';
    var ui = BC.estacao.ui, i = ui.instalarInfo;
    if (!i) {
      if (!ui.instalarPedido) { ui.instalarPedido = true; fetch('/api/instalar/info').then(function (r) { return r.json(); }).then(function (x) { ui.instalarInfo = x || { rede: false }; BC.estacao.render(); }, function () { ui.instalarInfo = { rede: false }; }); }
      return '';
    }
    if (!i.rede || !i.url) return '<p class="form-ajuda">Sem rede local agora: conecte ao Wi-Fi para gerar o link do instalador.</p>';
    return '<div class="cartao convite-cartao"><b>Instalar o babel-coop</b><code class="convite-token">' + esc(i.url) + '</code>' +
      '<div class="dem-acoes"><button class="botao" type="button" data-acao="eq-copiar-link">Copiar link</button></div>' +
      '<p class="form-ajuda">Quem está no mesmo Wi-Fi abre esse link, baixa o instalador (Mac ou Windows), abre o app e toca em "Pedir para entrar".</p></div>';
  }
  A['eq-copiar-link'] = function () {
    var i = BC.estacao.ui.instalarInfo, url = i && i.url;
    if (!url) return;
    var feito = function () { BC.estacao.aviso('Link copiado: ' + url); };
    if (window.coopElectron && window.coopElectron.copiar) window.coopElectron.copiar(url).then(feito, feito);
    else if (navigator.clipboard) navigator.clipboard.writeText(url).then(feito, feito);
  };

  function convite() {
    var c = BC.estacao.ui.convite;
    return '<div class="lat-titulo"><span class="rotulo">Convidar pessoa</span></div><div class="lat-convite">' + linkInstalar() +
      '<input type="text" id="convite-nome" placeholder="Nome da pessoa" value="' + esc(c && c.nome && !c.token ? c.nome : '') + '" aria-label="Nome da pessoa">' +
      '<button class="botao primario" type="button" data-acao="eq-convidar">Gerar token</button>' +
      (c && c.token ? '' : '<p class="form-ajuda">No mesmo Wi-Fi não precisa de token: a pessoa instala o app, escreve o nome e toca em "Pedir para entrar"; o pedido aparece aqui e no topo da Estação. O token é o plano B.</p>') +
      (c && c.token ? '<div class="cartao convite-cartao"><b>Token de ' + esc(c.nome) + '</b><code class="convite-token" id="convite-token">' + esc(c.token) + '</code>' +
        '<div class="dem-acoes"><button class="botao" type="button" data-acao="eq-copiar-token">Copiar</button><button class="botao discreto" type="button" data-acao="eq-convite-limpar">Fechar</button></div>' +
        '<p class="form-ajuda">Mande por WhatsApp. ' + esc(c.nome) + ' instala o app, cola o token e entra: vê você, você vê ' + esc(c.nome) + '. O token leva o nome, o papel, o segredo da equipe e o endereço desta Estação na rede.</p></div>' : '') +
      '</div>';
  }

  A['eq-convidar'] = function () {
    var campo = document.getElementById('convite-nome'), nome = campo && campo.value.trim();
    if (!nome) { BC.estacao.aviso('Escreva o nome da pessoa.'); return; }
    function mostrar(token) { BC.estacao.ui.convite = { nome: nome, token: token }; BC.estacao.render(); }
    if (BC.real && BC.real.convidar) { BC.real.convidar(nome).then(function (r) { if (r.erro) BC.estacao.aviso(r.erro); else mostrar(r.token); }); return; }
    /* protótipo: token simulado com o mesmo formato do app real */
    var id = U.normalizar(nome).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    var corpo = { v: 1, equipe: 'babel', segredo: 'demo-' + Math.random().toString(36).slice(2, 10), id: id, nome: nome, papel: 'membro', encontro: ['192.168.0.10:4711'], emitidoPor: L().eu, emitido: Date.now() };
    mostrar('babel-' + btoa(unescape(encodeURIComponent(JSON.stringify(corpo)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
  };
  A['eq-copiar-token'] = function () {
    var t = document.getElementById('convite-token');
    if (t && navigator.clipboard) navigator.clipboard.writeText(t.textContent).then(function () { BC.estacao.aviso('Token copiado. Mande para a pessoa.'); }, function () { BC.estacao.aviso('Selecione o token e copie.'); });
  };
  A['eq-convite-limpar'] = function () { BC.estacao.ui.convite = null; BC.estacao.render(); };
  /* o nome digitado sobrevive aos redesenhos da lateral */
  document.addEventListener('input', function (ev) { if (ev.target && ev.target.id === 'convite-nome') BC.estacao.ui.convite = { nome: ev.target.value }; });

  BC.vistas.equipe = {
    lateral: function () {
      var e = L().estado;
      var ck = Object.keys(e.checkins).filter(function (k) { return U.mesmoDia(e.checkins[k].ts); }).length;
      function it(alvo, nome, n) { return '<li><button class="lat-item" type="button" data-acao="rolar" data-alvo="' + alvo + '"><span class="rotulo-texto">' + nome + '</span><span class="conta">' + n + '</span></button></li>'; }
      return '<div class="lat-titulo"><span class="rotulo">Equipe</span></div><ul class="lat-lista">' +
        it('eq-cuidado', 'Cuidando da gente', L().cuidados().length) + it('eq-carga', 'Pessoas e carga', e.pessoas.length) +
        it('eq-carga', 'Check-ins de hoje', ck + '/' + e.pessoas.length) + it('eq-tv', 'Controle da TV', e.tvModo) + it('eq-regras', 'Regras', '') + '</ul>' +
        (L().eAdmin() ? pedidosEntrada() + convite() : '') +
        '<p class="lat-nota">Horas por pessoa aparecem só para a gestão. A TV mostra o total da equipe e os sinais de cuidado, nunca um ranking.</p>';
    },
    conteudo: function () {
      var e = L().estado, admin = L().eAdmin(), eu = L().eu;
      var online = e.pessoas.filter(function (p) { return p.status === 'online' || p.status === 'foco'; }).length;
      var cuidados = L().cuidados();
      var cuidado = '<section class="secao" id="eq-cuidado"><span class="rotulo">Cuidando da gente · o que o sistema notou</span>' + (cuidados.length ? '<div class="lista-limpa">' + cuidados.map(function (c) {
        var p = L().pessoa(c.pessoa);
        return '<div class="item cuidado-item" style="--cor:var(--atencao)">' + U.avatar(p, 30, true) + '<span class="item-corpo"><span class="item-titulo quebra"><b>' + esc(p.nome) + '</b> ' + esc(c.texto) + '</span>' +
          '<span class="item-meta">' + esc(c.detalhe || '') + ' · quem pode ajudar: ' + esc(L().nome(c.ajuda)) + (p.naoMostrarCuidado ? ' · não aparece na TV (escolha da pessoa)' : '') + '</span></span>' +
          '<button class="botao" type="button" data-acao="eq-mensagem" data-id="' + p.id + '">Mandar mensagem</button></div>';
      }).join('') + '</div>' : '<p class="vazio">Ninguém precisando de uma mão agora.</p>') +
        '<p class="form-ajuda">Contas simples, sem IA: tempo acima de 1,5× a estimativa, "estou travado", muitas trocas de tarefa, dias sem abrir a Estação, bloqueio no check-in. A pessoa pode apertar "Estou bem".</p></section>';

      var cartoes = e.pessoas.map(function (p) {
        var ds = e.demandas.filter(function (d) { return d.para === p.id; });
        function n(s) { return ds.filter(function (d) { return d.estado === s; }).length; }
        var tarefas = e.tarefas.filter(function (t) { return aberta(t) && t.donos[t.atual] === p.id; }).length;
        var ck = e.checkins[p.id], ckHoje = ck && U.mesmoDia(ck.ts), podeFoto = admin || p.id === eu;
        return '<div class="pessoa-cartao"><div class="pessoa-cab">' + U.avatar(p, 40, true) + '<div><b>' + esc(p.nome) + (p.papel === 'admin' ? ' · gestão' : '') + '</b><small>' + esc(e.areas[p.area]) + ' · ' + p.status + (p.status === 'offline' ? ' · visto ' + U.relativo(p.ultimaVez) : '') + '</small></div>' +
          (admin ? '<span class="num pessoa-horas" title="trabalho medido hoje">' + U.duracao(L().trabalhoHoje(p.id)) + '</span>' : '') + '</div>' +
          '<div class="contagens">' + (n('andamento') ? '<span class="chip ok">' + n('andamento') + ' rodando</span>' : '') +
          (n('pausada') ? '<span class="chip">' + n('pausada') + ' pausada</span>' : '') + (n('enviada') ? '<span class="chip">' + n('enviada') + ' para começar</span>' : '') +
          (n('pronta') ? '<span class="chip hoje">' + n('pronta') + ' aguardando OK</span>' : '') + (tarefas ? '<span class="chip">' + tarefas + ' etapa' + (tarefas > 1 ? 's' : '') + '</span>' : '') + '</div>' +
          (ckHoje ? '<p class="form-ajuda">Hoje: ' + esc(ck.hoje) + '</p>' + (ck.bloqueio ? '<p class="form-ajuda alarme">Bloqueio: ' + esc(ck.bloqueio) + '</p>' : '') : '<p class="form-ajuda">Sem check-in hoje.</p>') +
          (podeFoto ? '<div class="dem-acoes"><button class="botao discreto" type="button" data-acao="foto-escolher" data-id="' + p.id + '">' + (p.foto ? 'Trocar foto' : 'Pôr foto') + '</button>' +
            (p.foto ? '<button class="botao discreto" type="button" data-acao="foto-tirar" data-id="' + p.id + '">Tirar foto</button>' : '') + '</div>' : '') + '</div>';
      }).join('');

      var pr = e.projecao, quadros = e.arquivos.filter(function (a) { return a.tipo === 'quadro'; });
      var tv = admin ? '<section class="secao cartao" id="eq-tv"><span class="rotulo">Controle da TV</span>' +
        '<div class="alternar">' + MODOS_TV.map(function (m) { return '<button type="button" class="' + (e.tvModo === m[0] ? 'ativo' : '') + '" data-acao="tv-modo" data-modo="' + m[0] + '">' + m[1] + '</button>'; }).join('') + '</div>' +
        (e.tvModo === 'quadro' || quadros.length ? '<p class="form-ajuda">Quadro na TV: ' + quadros.map(function (q) { return '<button class="botao discreto' + (e.tvQuadro === q.id ? ' ativo-texto' : '') + '" type="button" data-acao="tv-quadro" data-id="' + q.id + '">▢ ' + esc(q.caminho.split('/').pop()) + '</button>'; }).join('') + '</p>' : '') +
        '<form class="campo-inline" data-form="aviso"><input type="text" id="tv-aviso" placeholder="Aviso oficial para a TV"><button class="botao primario" type="submit">Publicar aviso</button></form>' +
        '<div class="dem-acoes"><button class="botao" type="button" data-acao="visita">' + (e.visita ? 'Desligar modo visita' : 'Ligar modo visita') + '</button>' +
        '<button class="botao" type="button" data-acao="tema-tv" data-tema="roxo" aria-pressed="' + (e.temaTv === 'roxo') + '">Tema roxo (grafo v5)</button>' +
        '<button class="botao" type="button" data-acao="tema-tv" data-tema="azul" aria-pressed="' + (e.temaTv === 'azul') + '">Tema azul (Babel Terminal)</button></div>' +
        '<p class="form-ajuda">' + (pr ? 'Projetando "' + esc(pr.caminho.split('/').pop()) + '" (' + esc(L().nome(pr.por)) + '). <button class="botao discreto" type="button" data-acao="encerrar-projecao">Encerrar</button>' : 'Nada projetado agora. Em qualquer arquivo: "▣ Projetar na TV".') + '</p>' +
        '<p class="form-ajuda">' + (L().conectado('tv') ? 'TV conectada.' : 'TV não está aberta. Abra este protótipo em outra janela e clique em "Tela da TV".') + '</p></section>'
        : '<section class="secao cartao" id="eq-tv"><span class="rotulo">TV</span><p class="form-ajuda">Os controles da TV são da gestão. Qualquer um manda recado para o mural (coop mural "…" ou "▣ TV" numa mensagem do chat) e projeta os próprios arquivos.</p></section>';
      var regras = '<section class="secao cartao" id="eq-regras"><span class="rotulo">Regras</span>' +
        '<label class="marcar passo"><input type="checkbox" data-acao="regra-pausa"' + (e.regras.pausaAutomatica ? ' checked' : '') + (admin ? '' : ' disabled') + '> Pausar os cronômetros sozinho no almoço e depois das 18h</label>' +
        '<p class="form-ajuda">No protótipo começa desligada, para você poder testar a qualquer hora.</p>' +
        '<p class="form-ajuda">Sempre ligada: só uma demanda rodando por vez por pessoa. Começar outra pausa a atual com o motivo "trocou de demanda".</p>' +
        '<p class="form-ajuda">Terminais: cada um vê o selo "ao vivo" no próprio terminal e pode pausar a transmissão quando quiser.</p></section>';
      return '<div class="pagina-cab"><div><h1 class="pagina-titulo">Equipe</h1><p class="pagina-sub">' + e.pessoas.length + ' pessoas · ' + online + ' online · a equipe mediu ' + U.duracao(L().trabalhoHoje()) + ' hoje</p></div></div>' +
        cuidado + '<section class="secao" id="eq-carga"><span class="rotulo">Pessoas e carga</span><div class="carga">' + cartoes + '</div></section>' +
        '<div class="grade-2">' + tv + regras + '</div>';
    }
  };

  BC.formularios.aviso = function () {
    var c = document.getElementById('tv-aviso'), t = c.value.trim();
    if (t && L().fazer('aviso', t)) { c.value = ''; BC.estacao.aviso('Aviso publicado na TV.'); }
  };
  A.visita = function () { var ligar = !L().estado.visita; L().fazer('visita', ligar); BC.estacao.aviso(ligar ? 'Modo visita ligado: a TV esconde tudo o que é interno.' : 'Modo visita desligado.'); };
  A['tema-tv'] = function (el) { L().fazer('temaTv', el.dataset.tema); };
  A['regra-pausa'] = function (el) { L().fazer('regra', 'pausaAutomatica', el.checked); };
  A['tv-modo'] = function (el) {
    var modo = el.dataset.modo, e = L().estado;
    if (modo === 'reuniao' && !(e.reuniao && e.reuniao.ativa)) { BC.estacao.aviso('Abra uma reunião primeiro (atividade Reunião).'); return; }
    var q = modo === 'quadro' ? (e.tvQuadro || (e.arquivos.filter(function (a) { return a.tipo === 'quadro'; })[0] || {}).id) : undefined;
    L().fazer('tvModo', modo, q);
  };
  A['tv-quadro'] = function (el) { L().fazer('tvModo', 'quadro', el.dataset.id); BC.estacao.aviso('O quadro está ao vivo na TV.'); };
  A['encerrar-projecao'] = function () { if (L().fazer('encerrarProjecao')) BC.estacao.aviso('A TV voltou ao que estava.'); };
  A.pagina = function (el) { L().fazer('pagina', +el.dataset.delta); };
  A['eq-mensagem'] = function (el) {
    var id = el.dataset.id, eu = L().eu;
    if (id === eu || !L().fazer('abrirDireta', id)) return;
    BC.estacao.ui.canal = L().conversaDireta(eu, id);
    BC.estacao.abrirAba({ id: 'chat', tipo: 'chat', atividade: 'chat' });
    var c = document.getElementById('chat-texto');
    if (c) { c.value = 'Oi! Vi que ' + (L().cuidados().filter(function (x) { return x.pessoa === id; })[0] || { texto: 'você está numa correria' }).texto + '. Quer uma mão?'; c.focus(); }
  };

  /* fotos: a imagem é reduzida no próprio navegador (160 px) antes de ir para o estado */
  var fotoPara = null;
  A['foto-escolher'] = function (el) { fotoPara = el.dataset.id; var i = document.getElementById('foto-arquivo'); if (i) i.click(); };
  A['foto-tirar'] = function (el) { L().fazer('foto', el.dataset.id, null); };
  BC.reduzirFoto = function (arquivo, pronto) {
    var leitor = new FileReader();
    leitor.onload = function () {
      var img = new Image();
      img.onload = function () {
        var lado = 160, cv = document.createElement('canvas'), ctx = cv.getContext('2d'), m = Math.min(img.width, img.height);
        cv.width = cv.height = lado;
        ctx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, lado, lado);
        pronto(cv.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = function () { BC.estacao.aviso('Não consegui ler essa imagem.'); };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  };
  document.addEventListener('change', function (ev) {
    if (ev.target.id !== 'foto-arquivo' || !ev.target.files[0]) return;
    var alvo = fotoPara || L().eu;
    BC.reduzirFoto(ev.target.files[0], function (url) { if (L().fazer('foto', alvo, url)) BC.estacao.aviso('Foto nova de ' + L().nome(alvo) + '.'); });
    ev.target.value = '';
    fotoPara = null;
  });

  /* ======================= MAPA ======================= */

  function carta() {
    var sel = ui().mapaNo;
    if (!sel) return '<p class="lat-nota">Clique num ponto do mapa para ver a carta dele aqui.</p>';
    var id = sel.id.slice(2), tipo = sel.tipo, html = '';
    if (tipo === 'pessoa') {
      var p = L().pessoa(id), ds = p ? L().estado.demandas.filter(function (d) { return d.para === p.id && d.estado === 'andamento'; }) : [];
      html = p ? U.avatar(p, 34, true) + '<b>' + esc(p.nome) + '</b><p class="pagina-sub">' + esc(L().estado.areas[p.area]) + ' · ' + p.status + '</p>' + (ds.length ? '<p class="form-ajuda">Rodando: ' + esc(ds[0].titulo) + '</p>' : '') : '';
    } else if (tipo === 'tarefa') {
      var t = L().tarefa(id), f = t && L().fluxo(t.fluxo);
      html = t ? '<b>' + esc(t.titulo) + '</b><p class="pagina-sub">' + esc(f.etapas[t.atual] || 'concluída') + ' · ' + L().pct(t) + '% · com ' + esc(L().nome(t.donos[t.atual])) + '</p>' +
        '<button class="botao" type="button" data-acao="abrir-tarefa" data-id="' + t.id + '">Abrir tarefa</button>' : '';
    } else if (tipo === 'demanda') {
      var d = L().demanda(id);
      html = d ? '<b>' + esc(d.titulo) + '</b><p class="pagina-sub">' + esc(L().nome(d.de)) + ' → ' + (d.para ? esc(L().nome(d.para)) : 'livre') + ' · ' + BC.demandasUI.rotulo[d.estado] + '</p>' +
        '<button class="botao" type="button" data-acao="abrir-demanda" data-id="' + d.id + '">Abrir demanda</button>' : '';
    } else if (tipo === 'arquivo') {
      html = '<b>' + esc(sel.rotulo) + '</b><p class="pagina-sub">arquivo · ' + (sel.offline ? 'dono offline' : 'disponível') + '</p><button class="botao" type="button" data-acao="abrir-arquivo" data-id="' + esc(id) + '">Abrir</button>';
    } else {
      html = '<b>' + esc(sel.rotulo) + '</b><p class="pagina-sub">área</p>';
    }
    return '<div class="cartao mapa-carta">' + html + '</div>';
  }

  BC.vistas.mapa = {
    lateral: function () {
      return '<div class="lat-titulo"><span class="rotulo">Mapa da equipe</span></div>' +
        '<ul class="lat-lista"><li><span class="lat-item">● pessoa</span></li><li><span class="lat-item">○ área</span></li>' +
        '<li><span class="lat-item">◐ tarefa (enche com a %)</span></li><li><span class="lat-item">◆ demanda (pulsa rodando)</span></li>' +
        '<li><span class="lat-item">■ arquivo (pontilhado = dono offline)</span></li></ul>' +
        '<div class="lat-titulo"><span class="rotulo">Carta</span></div>' + carta();
    },
    conteudo: function () {
      return '<div class="mapa-palco"><canvas id="mapa-canvas" aria-label="Mapa da equipe em grafo"></canvas>' +
        '<div class="mapa-legenda"><span>passe o mouse para acender</span><span>clique para ver a carta</span><span>arraste para mover</span><span>pulso de luz = tarefa passando de mão</span></div></div>';
    }
  };
})(window.BC);
