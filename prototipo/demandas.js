/* Babel Coop — protótipo · demandas com cronômetro (lista, detalhe, formulário e cronômetro fixo) */
window.BC = window.BC || {};
BC.acoes = BC.acoes || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc;
  var ROTULO = { livre: 'livre', enviada: 'para começar', andamento: 'rodando', pausada: 'pausada', pronta: 'aguardando OK', concluida: 'concluída', cancelada: 'cancelada' };
  var COR = { livre: '#c7a2ff', enviada: '#42597d', andamento: '#7fd6a6', pausada: '#f0b35a', pronta: '#29ccec', concluida: '#3a4a6a', cancelada: '#30334c' };
  var ESPERA = { 'aguardando conferência': true, 'devolvida para ajuste': true };

  function L() { return BC.loja; }
  function ui() { return BC.estacao.ui; }
  function aberta(d) { return d.estado !== 'concluida' && d.estado !== 'cancelada'; }
  function pill(d) { return '<span class="estado-pill est-' + d.estado + '">' + ROTULO[d.estado] + '</span>'; }

  var D = { rotulo: ROTULO, cor: COR, pill: pill };

  /* o que o cronômetro fixo mostra: a demanda rodando, senão a última pausada, senão a que espera OK */
  D.doCronometro = function () {
    var meu = L().estado.demandas.filter(function (d) { return d.para === L().eu; });
    function ult(d) { var p = L().ultimaPausa(d); return p.inicio || 0; }
    return meu.filter(function (d) { return d.estado === 'andamento'; })[0] ||
      meu.filter(function (d) { return d.estado === 'pausada'; }).sort(function (a, b) { return ult(b) - ult(a); })[0] ||
      meu.filter(function (d) { return d.estado === 'pronta'; })[0] || null;
  };

  function relogio(d) {
    if (!d.inicio) return '<span class="num">--:--:--</span>';
    return '<span class="num" data-relogio="' + d.id + '">' + U.relogio(L().tempo(d).trabalho) + '</span>';
  }

  function metaLinha(d) {
    var eu = L().eu, partes = [];
    if (!d.para) partes.push('livre · pedida por ' + (d.de === eu ? 'você' : L().nome(d.de)));
    else partes.push(d.para === eu ? 'de ' + L().nome(d.de) : d.de === eu ? 'para ' + L().nome(d.para) : L().nome(d.de) + ' → ' + L().nome(d.para));
    if (d.prazo && aberta(d)) partes.push('prazo ' + U.prazo(d.prazo).texto);
    if (d.estimativaMin) partes.push('estimativa ' + U.duracao(d.estimativaMin * U.MIN));
    return partes.join(' · ');
  }

  /* tarefa livre: cartão com o botão de pegar */
  D.itemLivre = function (d) {
    return '<div class="item livre" style="--cor:' + COR.livre + '">' + U.avatar(L().pessoa(d.de), 26) +
      '<span class="item-corpo"><button class="item-titulo link" type="button" data-acao="abrir-demanda" data-id="' + d.id + '">' + esc(d.titulo) + '</button>' +
      '<span class="item-meta">' + esc(metaLinha(d)) + '</span></span>' +
      '<span class="item-fim"><button class="botao primario" type="button" data-acao="dem-pegar" data-id="' + d.id + '">Pegar e começar</button></span></div>';
  };

  D.item = function (d) {
    if (d.estado === 'livre') return D.itemLivre(d);
    var outro = d.para === L().eu ? L().pessoa(d.de) : L().pessoa(d.para);
    return '<button class="item" type="button" style="--cor:' + COR[d.estado] + '" data-acao="abrir-demanda" data-id="' + d.id + '">' +
      U.avatar(outro, 26) +
      '<span class="item-corpo"><span class="item-titulo">' + esc(d.titulo) + '</span><span class="item-meta">' + esc(metaLinha(d)) + '</span></span>' +
      '<span class="item-fim">' + (d.inicio ? relogio(d) : '') + pill(d) + '</span></button>';
  };

  /* ---------- painel lateral ---------- */

  D.lateral = function () {
    var e = L().estado, eu = L().eu, f = ui().filtroDem;
    var rec = e.demandas.filter(function (d) { return d.para === eu && aberta(d); }).length;
    var env = e.demandas.filter(function (d) { return d.de === eu && aberta(d); }).length;
    var fim = e.demandas.filter(function (d) { return (d.para === eu || d.de === eu) && d.estado === 'concluida'; }).length;
    function it(id, nome, n) {
      return '<li><button class="lat-item" type="button" data-acao="dem-filtro" data-filtro="' + id + '" aria-current="' + (f === id) + '">' +
        '<span class="rotulo-texto">' + nome + '</span><span class="conta">' + n + '</span></button></li>';
    }
    return '<div class="lat-titulo"><span class="rotulo">Demandas</span>' +
      '<button class="botao discreto" type="button" data-acao="nova-demanda">+ Nova</button></div>' +
      '<ul class="lat-lista">' + it('recebidas', 'Recebidas', rec) + it('livres', 'Livres: pega quem puder', e.demandas.filter(function (d) { return d.estado === 'livre'; }).length) +
      it('enviadas', 'Enviadas por mim', env) + it('concluidas', 'Concluídas', fim) + '</ul>' +
      '<p class="lat-nota">Quem recebe só pausa e retoma. Só quem pediu dá o OK e encerra o cronômetro. Cada pausa fica no histórico.</p>';
  };

  /* ---------- lista ---------- */

  function grupo(titulo, lista) {
    if (!lista.length) return '';
    return '<section class="secao"><div class="secao-cab"><span class="rotulo">' + titulo + ' · ' + lista.length + '</span></div>' +
      '<div class="lista-limpa">' + lista.map(D.item).join('') + '</div></section>';
  }

  D.lista = function () {
    var e = L().estado, eu = L().eu, f = ui().filtroDem, html = '';
    var minhas = e.demandas.filter(function (d) { return f === 'enviadas' ? d.de === eu : f === 'concluidas' ? (d.para === eu || d.de === eu) : d.para === eu; });
    function est(s) { return minhas.filter(function (d) { return d.estado === s; }); }
    var hoje = U.duracao(L().trabalhoHoje(eu));
    var titulo = f === 'enviadas' ? 'Demandas que você enviou' : f === 'concluidas' ? 'Demandas concluídas' : 'Demandas para você';
    html += '<div class="pagina-cab"><div><h1 class="pagina-titulo">' + titulo + '</h1>' +
      '<p class="pagina-sub">Trabalho medido hoje: ' + hoje + ' · ' + est('pronta').length + ' aguardando OK · ' + est('enviada').length + ' para começar</p></div>' +
      '<button class="botao primario" type="button" data-acao="nova-demanda">Nova demanda</button></div>';
    if (f === 'livres') {
      var livres = e.demandas.filter(function (d) { return d.estado === 'livre'; });
      return '<div class="pagina-cab"><div><h1 class="pagina-titulo">Tarefas livres</h1><p class="pagina-sub">Ninguém pegou ainda. Quem puder, pega: vira o responsável e o cronômetro começa na hora.</p></div>' +
        '<button class="botao primario" type="button" data-acao="nova-demanda">Deixar uma tarefa livre</button></div>' +
        (livres.length ? '<div class="lista-limpa">' + livres.map(D.itemLivre).join('') + '</div>' : '<p class="vazio">Nenhuma tarefa livre agora.</p>');
    }
    if (f === 'concluidas') {
      html += grupo('Concluídas', minhas.filter(function (d) { return d.estado === 'concluida'; }));
    } else if (f === 'enviadas') {
      html += grupo('Esperando o seu OK', est('pronta')) + grupo('Rodando', est('andamento')) + grupo('Pausadas', est('pausada')) + grupo('Ainda não começaram', est('enviada'));
    } else {
      html += grupo('Rodando', est('andamento')) + grupo('Pausadas', est('pausada')) + grupo('Para começar', est('enviada')) + grupo('Esperando OK de quem pediu', est('pronta'));
    }
    if (!minhas.filter(f === 'concluidas' ? function () { return true; } : aberta).length) html += '<p class="vazio">Nada por aqui agora.</p>';
    return html;
  };

  /* ---------- detalhe ---------- */

  function faixa(d) {
    if (!d.inicio) return '';
    var fim = d.fim || Date.now(), cursor = d.inicio, partes = [];
    d.pausas.slice().sort(function (a, b) { return a.inicio - b.inicio; }).forEach(function (p) {
      if (p.inicio > cursor) partes.push(['trab', p.inicio - cursor, 'trabalho']);
      var pf = p.fim || fim, ini = Math.max(cursor, p.inicio);
      if (pf > ini) partes.push([ESPERA[p.motivo] ? 'espera' : 'parado', pf - ini, p.motivo]);
      cursor = Math.max(cursor, pf);
    });
    if (cursor < fim) partes.push(['trab', fim - cursor, 'trabalho']);
    return '<div class="fita" role="img" aria-label="Linha do tempo de trabalho e pausas">' + partes.map(function (p) {
      return '<span class="' + p[0] + '" style="flex-grow:' + Math.max(1, Math.round(p[1] / 1000)) + '" title="' + esc(p[2]) + ' · ' + U.duracao(p[1]) + '"></span>';
    }).join('') + '</div>' +
      '<div class="legenda-fita"><span><i style="background:linear-gradient(90deg,#9160ec,#29ccec)"></i>trabalho</span>' +
      '<span><i style="background:#2b3450"></i>pausa</span><span><i style="background:#1d4a5c"></i>esperando conferência ou ajuste</span></div>';
  }

  function numeros(d) {
    if (!d.inicio) return '';
    var t = L().tempo(d), pausas = d.pausas.filter(function (p) { return !ESPERA[p.motivo]; }).length;
    var est = '—', estSub = 'sem estimativa';
    if (d.estimativaMin) {
      var dif = t.trabalho - d.estimativaMin * U.MIN;
      est = U.duracao(d.estimativaMin * U.MIN);
      estSub = (d.fim ? 'real ' : 'até agora ') + U.duracao(t.trabalho) + ' (' + (dif >= 0 ? '+' : '−') + U.duracao(Math.abs(dif)) + ')';
    }
    return '<div class="numeros">' +
      '<div class="numero"><small>Trabalho</small><b data-relogio="' + d.id + '">' + U.relogio(t.trabalho) + '</b></div>' +
      '<div class="numero"><small>Parado</small><b>' + U.duracao(t.parado) + '</b></div>' +
      '<div class="numero"><small>Pausas · devoluções</small><b>' + pausas + ' · ' + d.devolucoes + '</b></div>' +
      '<div class="numero"><small>Estimativa · ' + esc(estSub) + '</small><b>' + est + '</b></div></div>';
  }

  function porMotivo(d) {
    var pm = L().tempo(d).porMotivo, chaves = Object.keys(pm);
    if (!chaves.length) return '';
    return '<p class="pagina-sub">Parado por motivo: ' + chaves.map(function (k) { return esc(k) + ' ' + U.duracao(pm[k]); }).join(' · ') + '</p>';
  }

  var MARCO = { 'deu OK': 'ok', agradeceu: 'ok', pausou: 'pausa', travou: 'alerta', devolveu: 'alerta', cutucou: 'pausa' };

  function quando(ts) {
    var d = new Date(ts), hoje = new Date();
    if (d.toDateString() === hoje.toDateString()) return U.hora(ts);
    return 'ontem ' + U.hora(ts);
  }

  function historico(d) {
    return '<ol class="linha-tempo">' + d.historico.slice().reverse().map(function (h) {
      return '<li><time>' + quando(h.ts) + '</time><span class="marco ' + (MARCO[h.acao] || '') + '"></span>' +
        '<p><b>' + esc(L().nome(h.quem)) + '</b> ' + esc(h.acao) + (h.nota ? ' <span>· ' + esc(h.nota) + '</span>' : '') + '</p></li>';
    }).join('') + '</ol>';
  }

  function inline(d, tipo, rotulo, placeholder) {
    return '<div class="campo-inline"><input type="text" id="inline-' + d.id + '" placeholder="' + esc(placeholder) + '" aria-label="' + esc(rotulo) + '">' +
      '<button class="botao primario" type="button" data-acao="dem-enviar-inline" data-id="' + d.id + '" data-tipo="' + tipo + '">' + rotulo + '</button>' +
      '<button class="botao discreto" type="button" data-acao="dem-inline-fechar">Cancelar</button></div>';
  }

  function motivos(d) {
    return '<div class="cron-motivos">' + BC.MOTIVOS.map(function (m) {
      return '<button type="button" data-acao="dem-motivo" data-id="' + d.id + '" data-motivo="' + esc(m) + '">' + esc(m) + '</button>';
    }).join('') + '</div>';
  }

  function acoes(d, lugar) {
    var eu = L().eu, inl = ui().inline, html = '', solicitante = L().nome(d.de);
    var aberto = inl && inl.id === d.id && inl.lugar === lugar ? inl.tipo : null;
    function b(acao, texto, primario) { return '<button class="botao' + (primario ? ' primario' : '') + '" type="button" data-acao="' + acao + '" data-id="' + d.id + '" data-lugar="' + lugar + '">' + texto + '</button>'; }

    if (d.estado === 'livre') {
      html = b('dem-pegar', 'Pegar e começar', true) + (d.de === eu ? b('dem-cancelar', 'Cancelar') : '');
    } else if (d.para === eu) {
      if (d.estado === 'enviada') html = b('dem-comecar', 'Começar', true) + b('dem-perguntar', 'Perguntar antes de começar');
      if (d.estado === 'andamento') html = b('dem-pausar', 'Pausar', true) + b('dem-pronta', 'Está pronta') + b('dem-travado', 'Estou travado');
      if (d.estado === 'pausada') html = b('dem-retomar', 'Retomar', true) + b('dem-pronta', 'Está pronta');
      if (d.estado === 'pronta') html = '<span class="cron-nota">Aguardando o OK de <strong>' + esc(solicitante) + '</strong>. Só quem pediu encerra.</span>';
    } else if (d.de === eu) {
      if (d.estado === 'enviada') html = b('dem-cutucar', 'Lembrar') + b('dem-cancelar', 'Cancelar demanda');
      if (d.estado === 'andamento' || d.estado === 'pausada') html = b('dem-ok', 'Dar OK e encerrar') + b('dem-cutucar', 'Lembrar');
      if (d.estado === 'pronta') html = b('dem-ok', 'Dar OK e encerrar', true) + b('dem-devolver', 'Devolver para ajuste');
      if (d.estado === 'concluida' && !d.kudos) html = b('dem-valeu', 'Valeu!', true);
    }
    if (aberto === 'motivos') html += motivos(d);
    if (aberto === 'pronta') {
      html += '<div class="aprender"><label class="form-ajuda" for="inline-' + d.id + '">O que você aprendeu nesta demanda? <b>Obrigatório para concluir.</b></label>' +
        '<textarea id="inline-' + d.id + '" class="inline-aprendizado" rows="2" data-demanda="' + d.id + '" placeholder="Ex.: cliente de clínica prefere proposta curta"></textarea>' +
        '<p class="aprender-novidade" id="novidade-' + d.id + '">Escreva uma frase. Se a equipe já souber isso, soma +1 em vez de repetir.</p>' +
        '<div class="dem-acoes"><button class="botao primario" type="button" data-acao="dem-enviar-inline" data-id="' + d.id + '" data-tipo="pronta">Registrar e avisar ' + esc(solicitante) + '</button>' +
        '<button class="botao discreto" type="button" data-acao="dem-inline-fechar">Cancelar</button></div></div>';
    }
    if (aberto === 'travado') html += inline(d, 'travado', 'Avisar', 'O que está travando? (opcional)');
    if (aberto === 'pergunta') html += inline(d, 'pergunta', 'Enviar pergunta', 'Sua dúvida para ' + solicitante);
    if (aberto === 'devolver') html += inline(d, 'devolver', 'Devolver', 'O que falta? (obrigatório)');
    return html;
  }

  D.detalhe = function (tab) {
    var d = L().demanda(tab.ref);
    if (!d) return '<p class="vazio">Esta demanda não existe mais.</p>';
    var eu = L().eu, de = L().pessoa(d.de), para = L().pessoa(d.para), devolvida = d.estado === 'pausada' && L().ultimaPausa(d).motivo === 'devolvida para ajuste';
    var ultimaDev = d.historico.filter(function (h) { return h.acao === 'devolveu'; }).pop();
    var html = '<div class="dem-cab">' +
      '<div class="pagina-cab"><div><h1 class="pagina-titulo">' + esc(d.titulo) + '</h1>' +
      '<p class="pagina-sub">' + esc(metaLinha(d)) + ' · prioridade ' + esc(d.prioridade) + ' · criada ' + U.relativo(d.criada) + '</p></div>' + pill(d) + '</div>' +
      '<div class="dem-pessoas">' + U.avatar(de, 28) + ' <span>' + esc(de.nome) + ' pediu</span> <span aria-hidden="true">→</span> ' + U.avatar(para, 28) + ' <span>' + (para ? esc(para.nome) + ' faz' : 'ninguém ainda: tarefa livre, pega quem puder') + '</span></div>';
    if (d.inicio) html += '<div><div class="dem-relogio" data-relogio="' + d.id + '">' + U.relogio(L().tempo(d).trabalho) + '</div><p class="pagina-sub">de trabalho medido' + (d.fim ? ', encerrado por ' + esc(de.nome) : '') + '</p></div>';
    if (devolvida && ultimaDev) html += '<p class="cartao" style="border-color:#5a2430">Devolvida por ' + esc(de.nome) + ': "' + esc(ultimaDev.nota) + '"</p>';
    html += '<div class="dem-acoes">' + acoes(d, 'detalhe') + '</div>';
    if (d.para === eu && aberta(d)) html += '<p class="form-ajuda">Você não consegue encerrar este cronômetro: só ' + esc(de.nome) + ', que pediu, dá o OK.</p>';
    html += '</div>';
    if (d.descricao) html += '<section class="secao"><span class="rotulo">Detalhes</span><p class="dem-desc">' + esc(d.descricao) + '</p></section>';
    if (d.inicio) html += '<section class="secao"><span class="rotulo">Tempo</span>' + numeros(d) + faixa(d) + porMotivo(d) + '</section>';
    html += '<section class="secao"><span class="rotulo">Histórico</span>' + historico(d) + '</section>';
    return html;
  };

  /* ---------- formulário ---------- */

  D.formulario = function () {
    var e = L().estado, eu = L().eu, r = ui().rascunho || {};
    var opcoes = e.pessoas.filter(function (p) { return p.id !== eu; }).map(function (p) {
      return '<option value="' + p.id + '"' + (r.para === p.id ? ' selected' : '') + '>' + esc(p.nome) + ' · ' + esc(e.areas[p.area]) + (p.status === 'offline' ? ' (offline)' : '') + '</option>';
    }).join('');
    return '<div class="pagina-cab"><div><h1 class="pagina-titulo">Nova demanda</h1>' +
      '<p class="pagina-sub">Quem recebe liga o cronômetro ao começar. Quem encerra é você, dando o OK.</p></div></div>' +
      '<form class="form" data-form="nova-demanda">' +
      '<label><span class="rotulo">Para quem</span><select id="nd-para">' + opcoes + '<option value=""' + (r.para === '' ? ' selected' : '') + '>Ninguém ainda: fica livre para quem puder pegar</option></select></label>' +
      '<label><span class="rotulo">O que precisa ser feito</span><input type="text" id="nd-titulo" required maxlength="120" placeholder="Ex.: Revisar a proposta da Acme" value="' + esc(r.titulo || '') + '"></label>' +
      '<label><span class="rotulo">Detalhes</span><textarea id="nd-desc" placeholder="Onde estão os arquivos, o que é mais importante…">' + esc(r.descricao || '') + '</textarea></label>' +
      '<div class="form-linha">' +
      '<label><span class="rotulo">Prazo</span><select id="nd-prazo"><option value="hoje">Hoje</option><option value="amanha">Amanhã</option><option value="semana">Esta semana</option><option value="">Sem prazo</option></select></label>' +
      '<label><span class="rotulo">Estimativa</span><select id="nd-estimativa"><option value="">Sem estimativa</option><option value="15">15 min</option><option value="30" selected>30 min</option><option value="60">1 hora</option><option value="120">2 horas</option><option value="240">4 horas</option></select></label>' +
      '<label><span class="rotulo">Prioridade</span><select id="nd-prioridade"><option value="urgente">Urgente</option><option value="alta">Alta</option><option value="média" selected>Média</option><option value="baixa">Baixa</option></select></label>' +
      '</div>' +
      '<div class="dem-acoes"><button class="botao primario" type="submit">Enviar demanda</button>' +
      '<button class="botao" type="button" data-acao="fechar-aba" data-id="nova-demanda">Cancelar</button></div></form>';
  };

  function prazoDe(v) {
    var d = new Date();
    if (v === 'hoje') { d.setHours(18, 0, 0, 0); return d.getTime(); }
    if (v === 'amanha') { d.setDate(d.getDate() + 1); d.setHours(18, 0, 0, 0); return d.getTime(); }
    if (v === 'semana') { d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7)); d.setHours(18, 0, 0, 0); return d.getTime(); }
    return null;
  }

  BC.formularios = BC.formularios || {};
  BC.formularios['nova-demanda'] = function () {
    var v = function (id) { return document.getElementById(id).value; };
    var titulo = v('nd-titulo').trim(), para = v('nd-para'); /* lê tudo antes de fechar a aba: depois os campos não existem mais */
    if (!titulo) return;
    var ok = L().fazer('novaDemanda', {
      para: para, titulo: titulo, descricao: v('nd-desc').trim(), prazo: prazoDe(v('nd-prazo')),
      estimativaMin: parseInt(v('nd-estimativa'), 10) || null, prioridade: v('nd-prioridade'), projeto: (ui().rascunho || {}).projeto || null
    });
    if (ok) {
      var livre = !para;
      ui().rascunho = null;
      ui().filtroDem = livre ? 'livres' : 'enviadas';
      BC.estacao.fecharAba('nova-demanda');
      BC.estacao.abrir('demandas');
      BC.estacao.aviso(livre ? 'Tarefa livre publicada: quem puder, pega.' : 'Demanda enviada para ' + L().nome(para) + '.');
    }
  };

  /* ---------- cronômetro fixo (minimiza, não fecha) ---------- */

  D.cronometro = function () {
    var d = D.doCronometro();
    if (!d) return '';
    var t = L().tempo(d), solicitante = L().nome(d.de), min = ui().cronMin;
    var estado = d.estado === 'andamento' ? ['rodando', 'Rodando'] :
      d.estado === 'pronta' ? ['aguardando', 'Aguardando OK de ' + solicitante] :
      ['pausado', 'Pausado · ' + (t.pausaAberta ? t.pausaAberta.motivo : 'pausa')];
    var outras = BC.loja.estado.demandas.filter(function (x) { return x.para === BC.loja.eu && x.id !== d.id && (x.estado === 'pausada' || x.estado === 'enviada'); }).length;
    if (min) {
      return '<span class="cron-relogio" data-relogio="' + d.id + '">' + U.relogio(t.trabalho) + '</span>' +
        '<span class="cron-estado ' + estado[0] + '"><span class="luz"></span>' + esc(estado[1]) + '</span>' +
        '<button class="cron-min" type="button" data-acao="cron-min" title="Mostrar o cronômetro inteiro">▴</button>';
    }
    return '<div class="cron-topo"><span class="rotulo">Cronômetro da demanda</span>' +
      '<button class="cron-min" type="button" data-acao="cron-min" title="Minimizar (não dá para fechar)">▾ minimizar</button></div>' +
      '<p class="cron-titulo"><a href="#" data-acao="abrir-demanda" data-id="' + d.id + '" style="color:inherit;text-decoration:none">' + esc(d.titulo) + '</a></p>' +
      '<p class="cron-de">pedida por ' + esc(solicitante) + (d.estimativaMin ? ' · estimativa ' + U.duracao(d.estimativaMin * U.MIN) : '') + '</p>' +
      '<span class="cron-relogio" data-relogio="' + d.id + '">' + U.relogio(t.trabalho) + '</span>' +
      '<span class="cron-estado ' + estado[0] + '"><span class="luz"></span>' + esc(estado[1]) + '</span>' +
      '<div class="cron-acoes">' + acoes(d, 'cron') + '</div>' +
      '<p class="cron-nota">Só <strong>' + esc(solicitante) + '</strong> pode encerrar este cronômetro.' + (outras ? ' Você tem mais ' + outras + ' na fila.' : '') + '</p>';
  };

  /* ---------- ações ---------- */

  var A = BC.acoes;
  function feito(r, texto) {
    if (r === 'cedo') BC.estacao.aviso('Você já lembrou essa pessoa há menos de uma hora.');
    else if (r && texto) BC.estacao.aviso(texto);
    ui().inline = null;
    BC.estacao.render();
  }
  function abrirInline(el, tipo) { ui().inline = { id: el.dataset.id, tipo: tipo, lugar: el.dataset.lugar }; BC.estacao.render(); var i = document.getElementById('inline-' + el.dataset.id); if (i) i.focus(); }

  A['abrir-demanda'] = function (el, ev) {
    if (ev) ev.preventDefault();
    var d = L().demanda(el.dataset.id);
    if (d) BC.estacao.abrirAba({ id: 'demanda:' + d.id, tipo: 'demanda', ref: d.id, titulo: d.titulo, atividade: 'demandas' });
  };
  A['nova-demanda'] = function () { BC.estacao.abrirAba({ id: 'nova-demanda', tipo: 'nova-demanda', titulo: 'Nova demanda', atividade: 'demandas' }); };
  A['dem-filtro'] = function (el) { ui().filtroDem = el.dataset.filtro; BC.estacao.abrir('demandas'); };
  A['dem-pegar'] = function (el) { ui().cronMin = false; feito(L().fazer('pegar', el.dataset.id), 'É sua! O cronômetro começou e quem pediu foi avisado.'); };
  A['dem-comecar'] = function (el) { ui().cronMin = false; feito(L().fazer('comecar', el.dataset.id), 'Cronômetro rodando. Ele fica na sua tela até quem pediu dar o OK.'); };
  A['dem-pausar'] = function (el) { abrirInline(el, 'motivos'); };
  A['dem-motivo'] = function (el) { feito(L().fazer('pausar', el.dataset.id, el.dataset.motivo), 'Pausado: ' + el.dataset.motivo + '.'); };
  A['dem-retomar'] = function (el) { feito(L().fazer('retomar', el.dataset.id), 'Retomado.'); };
  A['dem-pronta'] = function (el) { abrirInline(el, 'pronta'); };

  /* enquanto a pessoa escreve o aprendizado, o sistema diz se é novo ou repetido (sem LLM) */
  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (!t.classList || !t.classList.contains('inline-aprendizado')) return;
    var aviso = document.getElementById('novidade-' + t.dataset.demanda), v = t.value.trim();
    if (!aviso) return;
    if (v.length < 8) { aviso.className = 'aprender-novidade'; aviso.textContent = 'Escreva uma frase. Se a equipe já souber isso, soma +1 em vez de repetir.'; return; }
    var n = BC.loja.A.checarNovidade(v);
    aviso.className = 'aprender-novidade ' + (n.repetido ? 'repetido' : 'novo');
    aviso.textContent = n.repetido ? '≈ A equipe já sabe algo parecido: "' + n.parecido.texto + '" (' + BC.loja.nome(n.parecido.pessoa) + '). Vai contar +1 confirmado.'
      : '✓ Parece novo: entra nos aprendizados e a IA do terminal de todos passa a saber.';
  });
  A['dem-travado'] = function (el) { abrirInline(el, 'travado'); };
  A['dem-perguntar'] = function (el) { abrirInline(el, 'pergunta'); };
  A['dem-devolver'] = function (el) { abrirInline(el, 'devolver'); };
  A['dem-inline-fechar'] = function () { ui().inline = null; BC.estacao.render(); };
  A['dem-ok'] = function (el) { feito(L().fazer('ok', el.dataset.id), 'OK dado. Cronômetro encerrado.'); };
  A['dem-cutucar'] = function (el) { feito(L().fazer('cutucar', el.dataset.id), 'Lembrete enviado.'); };
  A['dem-cancelar'] = function (el) { feito(L().fazer('cancelar', el.dataset.id), 'Demanda cancelada.'); };
  A['dem-valeu'] = function (el) { feito(L().fazer('valeu', el.dataset.id), 'Agradecimento enviado. Ele aparece na TV.'); };
  A['cron-min'] = function () { ui().cronMin = !ui().cronMin; BC.estacao.render(); };
  A['dem-enviar-inline'] = function (el) {
    var id = el.dataset.id, tipo = el.dataset.tipo, campo = document.getElementById('inline-' + id), txt = campo ? campo.value.trim() : '';
    if (tipo === 'devolver' && !txt) { if (campo) { campo.focus(); campo.placeholder = 'Escreva o que falta para devolver'; } return; }
    if (tipo === 'pergunta' && !txt) { if (campo) campo.focus(); return; }
    if (tipo === 'pronta' && txt.length < 8) { if (campo) { campo.focus(); campo.placeholder = 'Escreva o que aprendeu (uma frase) para poder concluir'; } return; }
    var nomes = { travado: 'travado', pergunta: 'perguntar', devolver: 'devolver', pronta: 'pronta' };
    var textos = { travado: 'Quem pediu foi avisado de que você está travado.', pergunta: 'Pergunta enviada. O cronômetro não começou.', devolver: 'Devolvida para ajuste.' };
    if (tipo === 'pronta') {
      var n = BC.loja.A.checarNovidade(txt), dd = L().demanda(id);
      textos.pronta = L().nome(dd.de) + ' foi avisado(a). ' + (n.repetido ? 'Seu aprendizado já era conhecido: somou +1.' : 'Aprendizado novo registrado para a equipe e para a IA.');
    }
    feito(L().fazer(nomes[tipo], id, txt), textos[tipo]);
  };

  BC.demandasUI = D;
})(window.BC);
