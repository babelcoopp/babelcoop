/* Babel Coop — protótipo · vistas: Projetos (gente junta na mesma coisa), WhatsApp com o agente e Loja da equipe */
window.BC = window.BC || {};
BC.acoes = BC.acoes || {};
BC.vistas = BC.vistas || {};
BC.formularios = BC.formularios || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc, A = BC.acoes, F = BC.formularios;
  function L() { return BC.loja; }
  function ui() { return BC.estacao.ui; }
  function projeto(id) { return (L().estado.projetos || []).filter(function (p) { return p.id === id; })[0]; }

  /* liga algumas demandas de exemplo aos projetos (uma vez por estado) */
  function semear() {
    var e = L().estado;
    if (!e || e.semeadoV3) return;
    e.semeadoV3 = true;
    var liga = { d5: 'clinicas', d1: 'clinicas', l2: 'site', d3: 'site', t7: 'site' };
    e.demandas.forEach(function (d) { if (liga[d.id]) d.projeto = liga[d.id]; });
    var pj = projeto('clinicas');
    if (pj && !pj.conversas.todos) {
      var t = Date.now();
      pj.conversas.todos = [{ id: 'pm1', pessoa: 'carla', texto: 'Subi a planilha com as 4 clínicas que já responderam.', ts: t - 50 * U.MIN, arquivo: 'fp1' }, { id: 'pm2', pessoa: 'bruno', texto: 'Vou revisar a proposta padrão hoje ainda.', ts: t - 40 * U.MIN, arquivo: null }, { id: 'pm3', pessoa: 'davi', texto: 'Landing no ar em rascunho, abram e me digam.', ts: t - 9 * U.MIN, arquivo: 'fp4' }];
      pj.conversas.bruno = [{ id: 'pm4', pessoa: 'bruno', texto: 'Theus, o desconto de 8% continua valendo nas clínicas?', ts: t - 20 * U.MIN, arquivo: null }];
    }
  }

  /* ======================= PROJETOS ======================= */

  function lateralProjetos() {
    semear();
    var e = L().estado, eu = L().eu, pjs = (e.projetos || []).slice().sort(function (a, b) { return (b.membros.indexOf(eu) !== -1) - (a.membros.indexOf(eu) !== -1); });
    var atual = BC.estacao.abaAtual(), id = atual.tipo === 'projeto' ? atual.ref : null;
    return '<div class="lat-titulo"><span class="rotulo">Projetos</span><button class="botao discreto" type="button" data-acao="pj-novo-form">＋ Novo</button></div>' +
      (ui().pjNovo ? '<form class="pj-novo" data-form="pj-novo"><input type="text" id="pj-nome" placeholder="Nome do projeto" autocomplete="off" required><input type="text" id="pj-desc" placeholder="Uma linha: o que é" autocomplete="off">' +
        '<div class="pj-membros">' + e.pessoas.filter(function (p) { return p.id !== eu; }).map(function (p) { return '<label class="marcar"><input type="checkbox" name="pj-m" value="' + p.id + '"> ' + esc(p.nome) + '</label>'; }).join('') + '</div>' +
        '<div class="dem-acoes"><button class="botao primario" type="submit">Criar projeto</button><button class="botao" type="button" data-acao="pj-novo-form">Cancelar</button></div><p class="form-ajuda">Cada membro guarda a própria pasta do projeto no seu computador: "Projetos/' + '<nome>' + '".</p></form>' : '') +
      '<ul class="lat-lista">' + pjs.map(function (p) {
        var sou = p.membros.indexOf(eu) !== -1, online = p.membros.filter(function (m) { return m !== eu && L().online(m); }).length;
        return '<li><button class="lat-item" type="button" data-acao="abrir-projeto" data-id="' + p.id + '" aria-current="' + (p.id === id) + '"><span class="rotulo-texto">' + esc(p.nome) + (sou ? '' : ' <small>· não sou membro</small>') + '</span><span class="conta">' + p.membros.length + ' · ' + online + ' on</span></button></li>';
      }).join('') + '</ul><p class="lat-nota">Trabalhar sozinho é uma coisa; em projeto é outra. No projeto, o Explorador mostra só o projeto, agrupado por pessoa, e dá para arrastar arquivos para alguém.</p>';
  }

  function arquivosDoProjeto(pj) {
    return L().estado.arquivos.filter(function (a) { return pj.membros.indexOf(a.dono) !== -1 && a.caminho.indexOf(a.dono + '/' + pj.pasta + '/') === 0; });
  }

  BC.vistas.projetos = {
    lateral: lateralProjetos,
    conteudo: function () {
      semear();
      var e = L().estado, eu = L().eu, pjs = e.projetos || [];
      return '<div class="pagina-cab"><div><h1 class="pagina-titulo">Projetos</h1><p class="pagina-sub">Duas ou mais pessoas na mesma coisa, sem ninguém abrir mão do próprio computador. Cada membro guarda a sua parte; o projeto é o que junta.</p></div>' +
        '<button class="botao primario" type="button" data-acao="pj-novo-form">＋ Novo projeto</button></div><div class="pj-grade">' + pjs.map(function (p) {
          var arqs = arquivosDoProjeto(p), dems = e.demandas.filter(function (d) { return d.projeto === p.id && d.estado !== 'concluida' && d.estado !== 'cancelada'; }).length;
          var online = p.membros.filter(function (m) { return L().online(m); });
          return '<button class="pj-cartao cartao" type="button" data-acao="abrir-projeto" data-id="' + p.id + '"><b>' + esc(p.nome) + '</b><p class="pagina-sub">' + esc(p.descricao || '') + '</p>' +
            '<span class="pj-avatares">' + p.membros.map(function (m) { return U.avatar(L().pessoa(m), 24, true); }).join('') + '</span>' +
            '<span class="item-meta">' + arqs.length + ' arquivos · ' + dems + ' demandas abertas · ' + online.length + ' online · desde ' + U.quando(p.desde) + (p.membros.indexOf(eu) !== -1 ? ' · você está nele' : '') + '</span></button>';
        }).join('') + '</div>';
    }
  };

  BC.vistas.projeto = {
    lateral: lateralProjetos,
    conteudo: function (tab) {
      semear();
      var e = L().estado, eu = L().eu, pj = projeto(tab.ref);
      if (!pj) return '<p class="vazio">Projeto não encontrado.</p>';
      var sou = pj.membros.indexOf(eu) !== -1, arqs = arquivosDoProjeto(pj), com = ui().pjCom || 'todos';
      var msgs = (pj.conversas[com] || []).slice(), dems = e.demandas.filter(function (d) { return d.projeto === pj.id; });
      var quadro = arqs.filter(function (a) { return a.tipo === 'quadro'; })[0], mapaM = arqs.filter(function (a) { return a.tipo === 'mapa'; })[0];
      var online = pj.membros.filter(function (m) { return m !== eu && L().online(m); });
      var porMembro = [eu].concat(pj.membros.filter(function (m) { return m !== eu; })).filter(function (m) { return pj.membros.indexOf(m) !== -1; });
      return '<div class="pj-tela"><header class="pagina-cab"><div><h1 class="pagina-titulo">' + esc(pj.nome) + '</h1><p class="pagina-sub">' + esc(pj.descricao || '') + ' · desde ' + U.quando(pj.desde) + ' · ' + pj.membros.length + ' membros' + (online.length ? ' · <b>' + online.length + ' com você agora</b>' : '') + '</p>' +
        '<span class="pj-avatares grande">' + pj.membros.map(function (m) { var p = L().pessoa(m); return '<button class="sem-estilo" type="button" data-acao="abrir-perfil" data-id="' + m + '" title="' + esc(p.nome) + (e.fazendo && e.fazendo[m] ? ' · ' + esc(e.fazendo[m]) : '') + '">' + U.avatar(p, 30, true) + '</button>'; }).join('') + '</span></div>' +
        '<div class="dem-acoes">' + (sou ? '<button class="botao primario" type="button" data-acao="pj-explorador" data-id="' + pj.id + '">Abrir no Explorador</button>' : '<button class="botao primario" type="button" data-acao="pj-entrar" data-id="' + pj.id + '">Entrar no projeto</button>') +
        '<button class="botao" type="button" data-acao="pj-maquina" data-id="' + pj.id + '">⚙ Máquina</button><button class="botao" type="button" data-acao="pj-falar" data-id="' + pj.id + '">Falar com o projeto</button><button class="botao" type="button" data-acao="pj-tv" data-id="' + pj.id + '">Levar para a TV</button></div></header>' +
        '<div class="pj-colunas"><section class="cartao pj-arquivos"><span class="rotulo">Arquivos · de todos os membros</span>' + porMembro.map(function (m) {
          var p = L().pessoa(m), meus = arqs.filter(function (a) { return a.dono === m; }), off = !L().online(m);
          return '<div class="pj-membro' + (off ? ' off' : '') + '"><div class="pj-membro-cab">' + U.avatar(p, 20, true) + '<b>' + esc(p.nome) + (m === eu ? ' (eu)' : '') + '</b><small>' + (off ? 'desligado' : e.fazendo && e.fazendo[m] ? esc(e.fazendo[m]) : 'online') + '</small></div>' +
            (meus.map(function (a) { var vendo = Object.keys(e.vendo || {}).filter(function (id) { return id !== eu && e.vendo[id].arquivo === a.id; }); return '<button class="pj-arq" type="button" data-acao="abrir-arquivo" data-id="' + a.id + '"><span class="arv-ic ic-' + esc(a.tipo) + '">' + esc(BC.explorador.sigla(a.tipo)) + '</span><span>' + esc(a.caminho.split('/').pop()) + '</span>' + (a.recebidoDe ? '<small>recebido de ' + esc(L().nome(a.recebidoDe)) + '</small>' : '') + (vendo.length ? '<span class="arv-vendo">' + vendo.map(function (id) { return U.avatar(L().pessoa(id), 14); }).join('') + '</span>' : '') + '</button>'; }).join('') || '<p class="form-ajuda">nada ainda em ' + esc(pj.pasta) + '</p>') + '</div>';
        }).join('') + '<p class="form-ajuda">Abrir o arquivo de outro membro edita ao vivo na Estação dele, com dois cursores. Arraste no Explorador para mandar um arquivo a alguém.</p></section>' +
        '<section class="cartao pj-canal"><div class="secao-cab"><span class="rotulo">Conversa do projeto</span></div><div class="pj-com">' + ['todos'].concat(pj.membros.filter(function (m) { return m !== eu; })).map(function (m) {
          var n = m === 'todos' ? 0 : (pj.conversas[m] || []).filter(function (x) { return x.pessoa !== eu; }).length;
          return '<button type="button" class="chip' + (com === m ? ' ativo' : '') + '" data-acao="pj-com" data-id="' + m + '">' + (m === 'todos' ? '# com todos' : U.avatar(L().pessoa(m), 16) + ' com ' + esc(L().nome(m))) + (n ? ' · ' + n : '') + '</button>';
        }).join('') + '</div><div class="pj-msgs">' + (msgs.map(function (m) {
          var a = m.arquivo && L().arquivo(m.arquivo), p = L().pessoa(m.pessoa);
          return '<div class="pj-msg' + (m.pessoa === eu ? ' minha' : '') + '">' + U.avatar(p, 22) + '<div><b>' + esc(p ? p.nome : m.pessoa) + '</b> <time>' + U.hora(m.ts) + '</time><p>' + esc(m.texto) + '</p>' + (a ? '<button class="chip" type="button" data-acao="abrir-arquivo" data-id="' + a.id + '">📎 ' + esc(a.caminho.split('/').pop()) + '</button>' : '') + '</div></div>';
        }).join('') || '<p class="vazio">Ninguém falou ainda por aqui.</p>') + '</div>' +
        '<form class="pj-form" data-form="pj-msg"><input type="text" id="pj-texto" placeholder="' + (com === 'todos' ? 'Falar com todos do projeto…' : 'Falar com ' + esc(L().nome(com)) + ', dentro do projeto…') + '" autocomplete="off">' +
        '<select id="pj-anexo" aria-label="Anexar do projeto"><option value="">📎 anexar do projeto</option>' + arqs.map(function (a) { return '<option value="' + a.id + '">' + esc(a.caminho.split('/').pop()) + ' · ' + esc(L().nome(a.dono)) + '</option>'; }).join('') + '</select><button class="botao primario" type="submit">Enviar</button></form></section></div>' +
        '<div class="pj-colunas"><section class="cartao"><div class="secao-cab"><span class="rotulo">Demandas do projeto · ' + dems.filter(function (d) { return d.estado !== 'concluida'; }).length + ' abertas</span><button class="botao discreto" type="button" data-acao="pj-demanda" data-id="' + pj.id + '">＋ Demanda</button></div><div class="lista-limpa">' +
        (dems.map(function (d) { var p = L().pessoa(d.para); return '<button class="item" type="button" data-acao="abrir-demanda" data-id="' + d.id + '" style="--cor:' + (p ? p.cor : '#8670ff') + '">' + (p ? U.avatar(p, 22) : '<span class="chip">livre</span>') + '<span class="item-corpo"><span class="item-titulo">' + esc(d.titulo) + '</span><span class="item-meta">' + d.estado + (p ? ' · ' + esc(p.nome) : ' · pega quem puder') + (d.prazo ? ' · ' + U.prazo(d.prazo).texto : '') + '</span></span></button>'; }).join('') || '<p class="vazio">Nenhuma demanda ligada ao projeto.</p>') + '</div></section>' +
        '<section class="cartao"><span class="rotulo">Quadro e mapa do projeto</span><div class="dem-acoes">' + (quadro ? '<button class="botao" type="button" data-acao="abrir-arquivo" data-id="' + quadro.id + '">▢ ' + esc(quadro.caminho.split('/').pop()) + '</button>' : '<button class="botao" type="button" data-acao="pj-quadro" data-id="' + pj.id + '">▢ Criar o quadro do projeto</button>') +
        (mapaM ? '<button class="botao" type="button" data-acao="abrir-arquivo" data-id="' + mapaM.id + '">◉ ' + esc(mapaM.caminho.split('/').pop()) + '</button>' : '<button class="botao" type="button" data-acao="pj-mapa" data-id="' + pj.id + '">◉ Criar o mapa mental</button>') + '</div>' +
        '<span class="rotulo">Agentes no projeto</span><div class="pj-agentes">' + pj.membros.map(function (m) { var p = L().pessoa(m); return (p.agentes || []).map(function (ag) { return '<button class="chip" type="button" data-acao="term-pessoa" data-id="' + m + '" data-agente="' + ag.id + '"><span class="term-av" style="--cor:' + ag.cor + '">' + esc(ag.nome.slice(0, 2).toUpperCase()) + '</span>' + esc(ag.nome) + ' <small>· ' + esc(p.nome) + '</small></button>'; }).join(''); }).join('') + '</div>' +
        '<span class="rotulo">Próximos passos</span><ul class="lista-limpa">' + (pj.proximos.map(function (x) { return '<li class="item" style="--cor:' + ((L().pessoa(x.quem) || {}).cor || '#8670ff') + '">' + U.avatar(L().pessoa(x.quem), 20) + '<span class="item-corpo"><span class="item-titulo">' + esc(x.texto) + '</span><span class="item-meta">' + esc(L().nome(x.quem)) + ' · ' + U.relativo(x.ts) + '</span></span></li>'; }).join('') || '<li class="vazio">Nenhum ainda.</li>') + '</ul>' +
        '<form class="campo-inline" data-form="pj-proximo"><input type="text" id="pj-prox" placeholder="Próximo passo"><select id="pj-prox-quem">' + pj.membros.map(function (m) { return '<option value="' + m + '"' + (m === eu ? ' selected' : '') + '>' + esc(L().nome(m)) + '</option>'; }).join('') + '</select><button class="botao" type="submit">+</button></form></section></div></div>';
    }
  };

  A['pj-novo-form'] = function () { ui().pjNovo = !ui().pjNovo; BC.estacao.abrir('projetos'); setTimeout(function () { var i = document.getElementById('pj-nome'); if (i) i.focus(); }, 30); };
  F['pj-novo'] = function (f) {
    var nome = document.getElementById('pj-nome').value.trim(), desc = document.getElementById('pj-desc').value.trim();
    var membros = Array.prototype.map.call(f.querySelectorAll('input[name="pj-m"]:checked'), function (i) { return i.value; });
    if (!nome) return;
    if (L().fazer('novoProjeto', { nome: nome, membros: membros, descricao: desc })) { ui().pjNovo = false; var pj = L().estado.projetos[0]; BC.estacao.abrirProjeto(pj.id); BC.estacao.aviso('Projeto criado. A pasta "' + pj.pasta + '" nasce no computador de cada membro.'); }
  };
  A['pj-explorador'] = function (el) { ui().projetoAtivo = el.dataset.id; BC.estacao.abrir('explorador'); BC.estacao.aviso('Explorador em modo projeto: só o projeto, agrupado por pessoa.'); };
  A['pj-entrar'] = function (el) { if (L().fazer('entrarProjeto', el.dataset.id)) BC.estacao.aviso('Você entrou no projeto.'); };
  A['pj-com'] = function (el) { ui().pjCom = el.dataset.id; BC.estacao.render(); };
  A['pj-falar'] = function (el) { var pj = projeto(el.dataset.id); BC.estacao.aviso('Voz com o projeto ' + (pj ? pj.nome : '') + ': no app, abre a chamada com os membros online (WebRTC na rede local).'); };
  A['pj-tv'] = function (el) { var pj = projeto(el.dataset.id); if (!pj) return; L().fazer('recado', 'Projeto ' + pj.nome + ': ' + arquivosDoProjeto(pj).length + ' arquivos, ' + pj.proximos.length + ' próximos passos'); L().fazer('tvModo', 'painel'); BC.estacao.aviso('A evolução do projeto entrou na zona que gira da TV.'); };
  A['pj-maquina'] = function (el) { if (BC.maquina) BC.maquina.abrir(el.dataset.id); };
  A['pj-demanda'] = function (el) { var pj = projeto(el.dataset.id); ui().rascunho = { titulo: '', para: '', descricao: 'Projeto: ' + (pj ? pj.nome : ''), projeto: el.dataset.id }; A['nova-demanda'](); };
  A['pj-quadro'] = function (el) { var pj = projeto(el.dataset.id); if (!pj) return; L().fazer('criarArquivo', L().eu + '/' + pj.pasta + '/Quadro do projeto.quadro', 'quadro', JSON.stringify({ itens: [] })); var a = L().estado.arquivos[L().estado.arquivos.length - 1]; BC.explorador.abrirArquivo(a.id); };
  A['pj-mapa'] = function (el) { var pj = projeto(el.dataset.id); if (!pj) return; L().fazer('criarArquivo', L().eu + '/' + pj.pasta + '/Mapa do projeto.mapa', 'mapa', JSON.stringify({ raiz: { id: 'r', texto: pj.nome, filhos: [] } })); var a = L().estado.arquivos[L().estado.arquivos.length - 1]; BC.explorador.abrirArquivo(a.id); };
  F['pj-msg'] = function () {
    var tab = BC.estacao.abaAtual(), t = document.getElementById('pj-texto'), an = document.getElementById('pj-anexo');
    if (tab.tipo !== 'projeto') return;
    if (L().fazer('mensagemProjeto', tab.ref, ui().pjCom || 'todos', t.value.trim(), an.value || null)) { t.value = ''; an.value = ''; }
  };
  F['pj-proximo'] = function () { var tab = BC.estacao.abaAtual(), t = document.getElementById('pj-prox'); if (L().fazer('proximoPasso', tab.ref, t.value.trim(), document.getElementById('pj-prox-quem').value)) t.value = ''; };

  /* ======================= WHATSAPP ======================= */

  function agentePadrao() { var p = L().pessoa(L().eu); return (p.agentes && p.agentes[0]) || { nome: 'Assistente', cor: '#c7a2ff' }; }
  function qrFalso() {
    var h = '', n = 21, seed = 7;
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; var canto = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13); var on = canto ? ((x % 6 === 0 || y % 6 === 0 || (x > 1 && x < 5 && y > 1 && y < 5)) && !(x === 6 && y === 6)) : (seed % 3 === 0); if (on) h += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>'; }
    return '<svg class="wa-qr" viewBox="0 0 21 21" width="200" height="200" aria-label="QR code de exemplo"><rect width="21" height="21" fill="#fff"/><g fill="#111">' + h + '</g></svg>';
  }
  var waTimer = null;
  function garantirChegadas() {
    if (waTimer) return;
    var FRASES = ['Oi! Vocês fazem para clínica veterinária também?', 'A proposta chegou, obrigada! Qual o prazo para começar?', 'Bom dia, qual o horário do suporte aos sábados?', 'Conseguem mandar a simulação do plano anual?'];
    waTimer = setInterval(function () {
      var e = L().estado, tab = BC.estacao.abaAtual();
      if (!L().lider || !e.whatsapp.pareado || tab.tipo !== 'whatsapp') return;
      var c = U.sorteia(e.whatsapp.conversas);
      L().fazer('waReceber', c.id, U.sorteia(FRASES), agentePadrao().nome);
    }, 28000);
  }

  BC.vistas.whatsapp = {
    lateral: function () {
      var w = L().estado.whatsapp, ag = agentePadrao();
      if (!w.pareado) return '<div class="lat-titulo"><span class="rotulo">WhatsApp</span></div><p class="lat-nota">Só você vê esta tela. Ela não entra no acervo, nem na TV, nem aparece para a equipe.</p>';
      var pend = w.conversas.filter(function (c) { return c.sugestao; }), auto = w.conversas.filter(function (c) { return c.automatico; });
      return '<div class="lat-titulo"><span class="rotulo">O que ' + esc(ag.nome) + ' está fazendo</span></div>' +
        '<ul class="lat-lista">' + (pend.map(function (c) { return '<li><button class="lat-item" type="button" data-acao="wa-conv" data-id="' + c.id + '"><span class="ponto foco"></span><span class="rotulo-texto">' + esc(c.nome) + '</span><span class="conta">sugeriu</span></button></li>'; }).join('') || '<li><span class="lat-item"><span class="rotulo-texto">nenhuma sugestão pendente</span></span></li>') + '</ul>' +
        '<div class="lat-titulo"><span class="rotulo">Respondendo sozinho</span></div><ul class="lat-lista">' + (auto.map(function (c) { return '<li><button class="lat-item" type="button" data-acao="wa-conv" data-id="' + c.id + '"><span class="ponto online"></span><span class="rotulo-texto">' + esc(c.nome) + '</span><span class="conta">auto</span></button></li>'; }).join('') || '<li><span class="lat-item"><span class="rotulo-texto">ninguém em modo automático</span></span></li>') + '</ul>' +
        '<p class="lat-nota"><b>Sugere e eu mando</b> (padrão): ' + esc(ag.nome) + ' escreve no campo; você lê e aperta Enter. <b>Automático</b> por contato: responde sozinho, por sua conta. Só você vê esta tela.</p>';
    },
    conteudo: function () {
      var w = L().estado.whatsapp, ag = agentePadrao();
      garantirChegadas();
      if (!w.pareado) {
        return '<div class="wa-parear"><h1 class="pagina-titulo">WhatsApp</h1><p class="pagina-sub">Leia o QR code com o seu celular, como no WhatsApp Web. O seu WhatsApp passa a viver aqui, e o ' + esc(ag.nome) + ' pode responder por você.</p>' + qrFalso() +
          '<p class="wa-aviso">Só você vê esta tela. Ela não entra no acervo nem na TV.</p><button class="botao primario" type="button" data-acao="wa-parear">Já escaneei (simulado)</button></div>';
      }
      var sel = ui().waConv || w.conversas[0].id, c = w.conversas.filter(function (x) { return x.id === sel; })[0] || w.conversas[0];
      return '<div class="wa"><aside class="wa-lista"><div class="wa-lista-cab"><b>Conversas</b><span class="chip">só você vê</span></div>' + w.conversas.map(function (x) {
        var ult = x.mensagens[x.mensagens.length - 1];
        return '<button type="button" class="wa-item' + (x.id === c.id ? ' ativo' : '') + '" data-acao="wa-conv" data-id="' + x.id + '"><span class="wa-av">' + esc(x.nome.slice(0, 1)) + '</span><span class="wa-item-corpo"><b>' + esc(x.nome) + '</b><small>' + (ult ? (ult.de === 'agente' ? '🤖 ' : ult.de === 'eu' ? '✓ ' : '') + esc(ult.texto.slice(0, 40)) : '') + '</small></span><span class="wa-item-fim"><time>' + (ult ? U.hora(ult.ts) : '') + '</time>' + (x.sugestao ? '<i class="wa-ponto sug" title="sugestão pronta"></i>' : '') + (x.automatico ? '<i class="wa-ponto auto" title="automático"></i>' : '') + '</span></button>';
      }).join('') + '</aside><section class="wa-conversa"><header class="wa-cab"><span class="wa-av">' + esc(c.nome.slice(0, 1)) + '</span><div><b>' + esc(c.nome) + '</b><small>' + esc(c.telefone) + '</small></div>' +
        '<label class="wa-auto marcar"><input type="checkbox" data-acao-mudar="wa-auto" data-id="' + c.id + '"' + (c.automatico ? ' checked' : '') + '> responder sozinho</label></header>' +
        '<div class="wa-msgs" id="wa-msgs">' + c.mensagens.map(function (m) { return '<div class="wa-msg ' + m.de + '"><p>' + esc(m.texto) + '</p><small>' + U.hora(m.ts) + (m.de === 'agente' ? ' · 🤖 ' + esc(m.agente || ag.nome) + ' respondeu sozinho' : m.de === 'eu' ? ' · ✓✓' : '') + '</small></div>'; }).join('') + '</div>' +
        (c.sugestao ? '<div class="wa-sugestao"><span class="term-av" style="--cor:' + ag.cor + '">' + esc(ag.nome.slice(0, 2).toUpperCase()) + '</span> ' + esc(c.sugestao.agente) + ' sugeriu · <b>Enter</b> manda · <b>Esc</b> apaga · edite se quiser</div>' : '') +
        '<form class="wa-form" data-form="wa-enviar"><input type="text" class="wa-texto" id="wa-texto-' + c.id + '-' + (c.sugestao ? c.sugestao.ts : 'x') + '" autocomplete="off" placeholder="Mensagem" value="' + esc(c.sugestao ? c.sugestao.texto : '') + '"><button class="botao primario" type="submit">Enviar</button>' +
        (c.sugestao ? '' : '<button class="botao" type="button" data-acao="wa-sugerir" data-id="' + c.id + '" title="Pede ao agente uma resposta">✦ ' + esc(ag.nome) + ', sugere</button>') + '</form></section></div>';
    },
    sugerirAtual: function (nomeAgente) {
      var w = L().estado.whatsapp;
      if (!w.pareado) return false;
      var sel = ui().waConv || (w.conversas.filter(function (c) { var u = c.mensagens[c.mensagens.length - 1]; return u && u.de === 'eles'; })[0] || w.conversas[0]).id;
      ui().waConv = sel;
      return !!L().fazer('waSugerir', sel, nomeAgente);
    }
  };

  A['wa-parear'] = function () { L().fazer('waParear'); BC.estacao.aviso('WhatsApp pareado. O agente já pode sugerir respostas.'); };
  A['wa-conv'] = function (el) { ui().waConv = el.dataset.id; BC.estacao.abrir('whatsapp'); };
  A['wa-sugerir'] = function (el) { L().fazer('waSugerir', el.dataset.id, agentePadrao().nome); setTimeout(function () { var i = document.querySelector('.wa-texto'); if (i) i.focus(); }, 40); };
  A['wa-auto'] = function (el) {
    L().fazer('waAutomatico', el.dataset.id, el.checked);
    if (el.checked) BC.estacao.aviso('Automatizar o WhatsApp pode bloquear seu número. Use com contatos que já conhecem o atendimento.');
  };
  F['wa-enviar'] = function () {
    var i = document.querySelector('.wa-texto'), t = i ? i.value.trim() : '', w = L().estado.whatsapp, id = ui().waConv || w.conversas[0].id, c = w.conversas.filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    var eraSugestao = c && c.sugestao, igual = eraSugestao && t === c.sugestao.texto;
    L().fazer('waEnviar', id, t, 'eu');
    if (eraSugestao) BC.estacao.aviso('Enviado. Você mandou a sugestão do agente' + (igual ? '' : ', corrigida') + '.');
    var box = document.getElementById('wa-msgs'); if (box) box.scrollTop = box.scrollHeight;
  };
  document.addEventListener('keydown', function (ev) {
    if (!ev.target.classList || !ev.target.classList.contains('wa-texto')) return;
    if (ev.key === 'Escape') { var w = L().estado.whatsapp, id = ui().waConv || w.conversas[0].id; ev.target.value = ''; L().fazer('waLimparSugestao', id); }
  });

  /* ======================= LOJA DA EQUIPE ======================= */

  var TIPOS = [['', 'Tudo'], ['skill', 'Skills'], ['mcp', 'MCPs'], ['plugin', 'Plugins'], ['agente', 'Agentes'], ['claudemd', 'CLAUDE.md']];
  var NOME_TIPO = { skill: 'skill', mcp: 'MCP', plugin: 'plugin', agente: 'agente', claudemd: 'CLAUDE.md' };

  BC.vistas.loja = {
    lateral: function () {
      var e = L().estado, meus = (e.lojaEquipe || []).filter(function (i) { return i.dono === L().eu; });
      return '<div class="lat-titulo"><span class="rotulo">Publicar na Loja</span></div>' +
        '<form class="lj-publicar" data-form="lj-publicar"><select id="lj-tipo">' + TIPOS.slice(1).map(function (t) { return '<option value="' + t[0] + '">' + t[1].replace(/s$/, '') + '</option>'; }).join('') + '</select>' +
        '<input type="text" id="lj-nome" placeholder="Nome" autocomplete="off" required><input type="text" id="lj-desc" placeholder="O que faz, em uma linha" autocomplete="off"><input type="text" id="lj-chave" placeholder="Precisa de chave? (ex.: SHEETS_API_KEY)" autocomplete="off">' +
        '<button class="botao primario" type="submit">Publicar</button></form>' +
        '<p class="lat-nota">Tudo o que estiver em <code>Loja/</code> na sua pasta compartilhada aparece aqui para a equipe. Chaves nunca vão para a pasta: ficam no cofre de cada computador.</p>' +
        '<div class="lat-titulo"><span class="rotulo">O que eu publiquei</span></div><ul class="lat-lista">' + (meus.map(function (i) { return '<li><button class="lat-item" type="button" data-acao="lj-nova-versao" data-id="' + i.id + '" title="Publicar versão nova"><span class="rotulo-texto">' + esc(i.nome) + ' <small>v' + i.versao + '</small></span><span class="conta">' + Object.keys(i.instaladoPor).length + ' inst.</span></button></li>'; }).join('') || '<li><span class="lat-item"><span class="rotulo-texto">nada ainda</span></span></li>') + '</ul>';
    },
    conteudo: function () {
      var e = L().estado, eu = L().eu, f = ui().lojaTipo || '', itens = (e.lojaEquipe || []).filter(function (i) { return !f || i.tipo === f; });
      var novos = (e.lojaEquipe || []).filter(function (i) { return Date.now() - i.atualizadoEm < 7 * U.DIA; }).length;
      return '<div class="pagina-cab"><div><h1 class="pagina-titulo">Loja da equipe</h1><p class="pagina-sub">' + (e.lojaEquipe || []).length + ' itens · ' + novos + ' novos esta semana. O que uma pessoa monta para a IA dela serve para todas: instala com um clique no seu Claude Code.</p></div></div>' +
        '<div class="alternar">' + TIPOS.map(function (t) { return '<button type="button" class="' + (f === t[0] ? 'ativo' : '') + '" data-acao="lj-tipo" data-tipo="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
        '<div class="lj-grade">' + itens.map(function (i) {
          var dono = L().pessoa(i.dono), inst = i.instaladoPor[eu], n = Object.keys(i.instaladoPor).length, temChave = !i.precisaChave || (e.chaves[eu] || {})[i.precisaChave];
          var botao = i.dono === eu ? '<span class="chip">seu</span>' : inst && inst < i.versao ? '<button class="botao primario" type="button" data-acao="lj-instalar" data-id="' + i.id + '">Atualizar · v' + i.versao + '</button>'
            : inst ? '<span class="chip ok">Instalado ✓</span>' : '<button class="botao primario" type="button" data-acao="lj-instalar" data-id="' + i.id + '">Instalar</button>';
          var chave = i.precisaChave ? (ui().lojaChave === i.id ? '<form class="lj-chave" data-form="lj-chave"><label class="form-rotulo">Esta ' + esc(NOME_TIPO[i.tipo]) + ' usa a chave <code>' + esc(i.precisaChave) + '</code> · guardar no cofre do seu computador</label><input type="password" id="lj-chave-valor" placeholder="cole a chave (não sai do seu computador)" autocomplete="off"><input type="hidden" id="lj-chave-item" value="' + i.id + '"><button class="botao primario" type="submit">Guardar no cofre e instalar</button></form>'
            : '<p class="lj-precisa">' + (temChave ? '🔐 chave ' + esc(i.precisaChave) + ' no seu cofre ✓' : '🔐 precisa da chave ' + esc(i.precisaChave) + ' · fica no seu Keychain, nunca na pasta') + '</p>') : '';
          return '<div class="lj-cartao cartao"><div class="lj-cab"><span class="chip">' + esc(NOME_TIPO[i.tipo]) + '</span><b>' + esc(i.nome) + '</b>' + (Date.now() - i.atualizadoEm < 7 * U.DIA ? '<span class="chip hoje">novo</span>' : '') + '</div>' +
            '<p class="lj-desc">' + esc(i.descricao) + '</p><div class="lj-rodape">' + U.avatar(dono, 20) + '<span>' + esc(dono ? dono.nome : i.dono) + ' · v' + i.versao + ' · ' + n + ' instalaram · ' + U.relativo(i.atualizadoEm) + '</span></div>' + chave + '<div class="dem-acoes">' + botao + '</div></div>';
        }).join('') + '</div>';
    }
  };
  A['lj-tipo'] = function (el) { ui().lojaTipo = el.dataset.tipo; BC.estacao.render(); };
  A['lj-instalar'] = function (el) {
    var item = (L().estado.lojaEquipe || []).filter(function (i) { return i.id === el.dataset.id; })[0];
    if (!item) return;
    if (item.precisaChave && !(L().estado.chaves[L().eu] || {})[item.precisaChave]) { ui().lojaChave = item.id; BC.estacao.render(); return; }
    if (L().fazer('lojaInstalar', item.id)) BC.estacao.aviso('Instalado no seu Claude Code. Já aparece no seu terminal.');
  };
  F['lj-chave'] = function () {
    var it = document.getElementById('lj-chave-item').value, v = document.getElementById('lj-chave-valor').value.trim();
    var item = (L().estado.lojaEquipe || []).filter(function (i) { return i.id === it; })[0];
    if (!item || !v) return;
    L().fazer('lojaChave', item.precisaChave);
    ui().lojaChave = null;
    if (L().fazer('lojaInstalar', it) === true) BC.estacao.aviso('Chave guardada no cofre do seu computador (nunca na pasta compartilhada) e item instalado.');
  };
  F['lj-publicar'] = function () {
    var nome = document.getElementById('lj-nome').value.trim(), desc = document.getElementById('lj-desc').value.trim(), chave = document.getElementById('lj-chave').value.trim(), tipo = document.getElementById('lj-tipo').value;
    if (!nome) return;
    if (L().fazer('lojaPublicar', { nome: nome, descricao: desc, tipo: tipo, precisaChave: chave || null })) { document.getElementById('lj-nome').value = ''; document.getElementById('lj-desc').value = ''; document.getElementById('lj-chave').value = ''; BC.estacao.aviso('Publicado na Loja da equipe. Entrou na evolução da semana na TV.'); }
  };
  A['lj-nova-versao'] = function (el) { if (L().fazer('lojaNovaVersao', el.dataset.id)) BC.estacao.aviso('Versão nova publicada: quem instalou vê "Atualizar".'); };
})(window.BC);
