/* Babel Coop — protótipo · Oficina do app: o próprio Babel Coop é mudado pelo terminal
   Quem o Theus liberar (construtores) pede ao agente "muda no app …"; a mudança fica aguardando na Oficina.
   O Theus clica "Publicar atualização": sobe a versão e todo mundo vê o botão "Atualizar" na barra; ao clicar, o app da pessoa atualiza.
   No app real: a Estação de quem publica empacota a interface (manifesto com hash por arquivo); cada Estação baixa, confere e recarrega (app/servidor/atualizacao.js). */
window.BC = window.BC || {};
BC.acoes = BC.acoes || {};
BC.vistas = BC.vistas || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc, A = BC.acoes, LA = BC.loja.A;
  function L() { return BC.loja; }
  function app() { var e = L().estado; if (!e.app) e.app = { versao: 1, notas: '', publicadaEm: 0, por: 'theus', construtores: ['theus'], mudancas: [], instalada: {}, historico: [] }; return e.app; }
  function ev(tipo, quem, texto, extra) { return L()._evento(tipo, quem, texto, extra); }
  function admin(quem) { var p = L().pessoa(quem); return p && p.papel === 'admin'; }
  function construtor(quem) { return admin(quem) || app().construtores.indexOf(quem) !== -1; }
  function pendentes() { return app().mudancas.filter(function (m) { return !m.versao; }); }

  /* Esta autorização pertence ao computador e à instalação, nunca ao diário compartilhado. */
  var local = null, consultando = false, operando = false, erroLocal = '', ultimaConsulta = 0;
  function electronOficina() { return window.coopElectron && typeof window.coopElectron.oficina === 'function'; }
  async function consultarLocal() {
    if (!electronOficina() || consultando) return;
    consultando = true; ultimaConsulta = Date.now();
    try { local = await window.coopElectron.oficina('estado', {}); erroLocal = ''; }
    catch (e) { erroLocal = e.message; }
    finally { consultando = false; BC.estacao.render(); }
  }
  async function executarLocal(acao, args) {
    if (operando || !electronOficina()) return;
    operando = true; erroLocal = ''; BC.estacao.render();
    var intervalo = acao === 'empacotar' ? setInterval(consultarLocal, 1500) : null;
    try {
      await window.coopElectron.oficina(acao, args || {});
      await consultarLocal();
      if (acao === 'previa') window.location.reload();
    } catch (e) { erroLocal = e.message; }
    finally { if (intervalo) clearInterval(intervalo); operando = false; BC.estacao.render(); }
  }
  A['oficina-local-liberar'] = function () { executarLocal('liberar', { sim: !(local && local.autorizada), identidade: local && local.identidade }); };
  A['oficina-local-pasta'] = function () { executarLocal('selecionar'); };
  A['oficina-local-previa'] = function () { executarLocal('previa', { sim: true }); };
  A['oficina-local-voltar'] = function () { executarLocal('previa', { sim: false }); };
  A['oficina-local-reiniciar'] = function () { executarLocal('reiniciarPrevia'); };
  A['oficina-local-empacotar'] = function () { executarLocal('empacotar'); };
  A['oficina-local-editar'] = async function () {
    if (!local || !local.autorizada || !local.pasta || operando) return;
    try {
      // O servidor valida novamente a permissão ao iniciar o agente.
      if (!BC.terminalReal || typeof BC.terminalReal.editarOficina !== 'function') throw new Error('O terminal da Oficina ainda não está disponível nesta versão.');
      await BC.terminalReal.editarOficina(local.pasta);
    } catch (e) { erroLocal = e.message; BC.estacao.render(); }
  };
  function painelLocal() {
    if (!electronOficina()) return '<section class="secao cartao"><h2>Editar esta instalação</h2><p>Abra a Oficina no aplicativo deste computador para liberar uma versão e editar seus fontes.</p></section>';
    if (!consultando && Date.now() - ultimaConsulta > 10000) setTimeout(consultarLocal, 0);
    var s = local, ocupado = operando || (s && s.executando), des = ocupado ? ' disabled' : '';
    if (!s) return '<section class="secao cartao"><h2>Editar esta instalação</h2><p>' + esc(erroLocal || 'Consultando a permissão desta Estação…') + '</p></section>';
    var pronto = s.autorizada && !!s.pasta;
    return '<section class="secao cartao" id="of-local"><span class="rotulo">Oficina local · v' + esc(s.versao) + '</span><h2>Editar esta instalação</h2>' +
      '<p class="form-ajuda">Libere esta versão, escolha os fontes completos do Babel Coop e peça as mudanças ao agente. Veja a interface na prévia; finalize pelo botão de reempacotar.</p>' +
      '<p><span class="chip' + (s.autorizada ? ' ok' : '') + '">' + (s.autorizada ? 'Esta versão pode mudar' : 'Edição bloqueada nesta versão') + '</span> ' +
      (s.gestao ? '<button class="botao" type="button" data-acao="oficina-local-liberar"' + des + '>' + (s.autorizada ? 'Bloquear edição' : 'Permitir mudanças nesta versão') + '</button>' : '<span class="form-ajuda">A gestão libera a edição neste computador.</span>') + '</p>' +
      (s.autorizada ? '<p class="quebra">Fontes: <code>' + esc(s.pasta || 'nenhuma pasta selecionada') + '</code></p><button class="botao" type="button" data-acao="oficina-local-pasta"' + des + '>Escolher pasta fonte</button> ' : '') +
      (pronto ? '<button class="botao primario" type="button" data-acao="oficina-local-editar"' + des + '>Editar pelo terminal</button>' +
        '<hr><p class="form-ajuda">A prévia usa os arquivos da pasta escolhida. Salve no terminal e atualize a prévia para ver a interface. Mudanças no servidor pedem reinício; mudanças na abertura do aplicativo entram no pacote final.</p>' +
        '<button class="botao" type="button" data-acao="oficina-local-previa"' + des + '>' + (s.previa ? 'Atualizar prévia' : 'Abrir prévia') + '</button> ' +
        '<button class="botao" type="button" data-acao="oficina-local-reiniciar"' + des + '>Reiniciar prévia</button> ' +
        (s.previa ? '<button class="botao discreto" type="button" data-acao="oficina-local-voltar"' + des + '>Voltar à interface instalada</button>' : '') +
        '<hr><button class="botao primario" type="button" data-acao="oficina-local-empacotar"' + des + '>' + (ocupado ? 'Aguarde…' : 'Reempacotar e reiniciar') + '</button><p class="form-ajuda">Quando as mudanças estiverem prontas, este botão gera o app e o instalador, fecha esta janela e abre a nova versão. A equipe não recebe atualização automaticamente. A nova versão volta com edição bloqueada.</p>' : '') +
      (erroLocal ? '<p role="alert" class="form-ajuda">' + esc(erroLocal) + '</p>' : '') +
      (s.log ? '<details' + (ocupado ? ' open' : '') + '><summary>Empacotamento</summary><pre style="white-space:pre-wrap;max-height:220px;overflow:auto">' + esc(s.log) + '</pre></details>' : '') + '</section>';
  }

  /* ---------- ações (entram no diário como todas as outras) ---------- */

  LA.oficinaConstrutor = function (quem, pessoa, sim) {
    if (!admin(quem) || !L().pessoa(pessoa)) return;
    var c = app().construtores, i = c.indexOf(pessoa);
    if (sim && i === -1) c.push(pessoa); else if (!sim && i !== -1) c.splice(i, 1);
    return [ev('oficina', quem, L().nome(quem) + (sim ? ' liberou ' : ' tirou ') + L().nome(pessoa) + (sim ? ' para mudar o app na Oficina.' : ' da Oficina do app.'), { para: pessoa })];
  };

  LA.oficinaMudanca = function (quem, texto, arquivos, agente) {
    if (!construtor(quem) || !texto) return;
    app().mudancas.unshift({ id: U.id('m'), quem: quem, agente: agente || '', texto: texto, arquivos: arquivos || [], ts: Date.now(), versao: null });
    return [];
  };

  LA.oficinaPublicar = function (quem, notas) {
    if (!admin(quem)) return;
    var a = app(), v = a.versao + 1, ps = pendentes();
    if (!ps.length && !notas) return;
    ps.forEach(function (m) { m.versao = v; });
    a.versao = v; a.notas = notas || ('v' + v + ' · ' + ps.map(function (m) { return m.texto; }).join('; ').slice(0, 120)); a.publicadaEm = Date.now(); a.por = quem;
    a.historico.push({ versao: v, notas: a.notas, por: quem, ts: a.publicadaEm });
    a.instalada[quem] = v;
    return [ev('oficina', quem, 'Atualização v' + v + ' do Babel Coop publicada por ' + L().nome(quem) + ': ' + a.notas + ' · clique em Atualizar.', { todos: true, versao: v })];
  };

  LA.oficinaAtualizar = function (quem) {
    var a = app();
    if ((a.instalada[quem] || 0) >= a.versao) return;
    a.instalada[quem] = a.versao;
    return [ev('oficina', quem, L().nome(quem) + ' atualizou o Babel Coop para v' + a.versao + '.', {})];
  };

  /* ---------- barra de status: "Atualizar para vN" ---------- */

  BC.oficina = {
    seloAtualizar: function () {
      var a = app(), eu = L().eu, minha = a.instalada[eu] || 0, ui = BC.estacao.ui;
      if (ui.atualizando) return '<span class="st-item st-atualizar rodando">⬆ atualizando para v' + a.versao + '…</span>';
      if (minha >= a.versao) return '';
      return '<button class="st-item st-atualizar" type="button" data-acao="oficina-atualizar" title="' + esc(a.notas) + '">⬆ Atualizar para v' + a.versao + '</button>';
    },
    entende: function (n) {
      return /\b(no app|do app|o app|no babel coop|do babel coop|na estacao|da estacao|na oficina|na tv do app)\b/.test(n) && /\b(muda|mude|mudar|altera|altere|troca|troque|arruma|arrume|conserta|conserte|adiciona|adicione|coloca|coloque|tira|tire|melhora|melhore|cria|crie|poe|bota)\b/.test(n) || /^app:/.test(n);
    },
    /* o agente registra a mudança; no app real ele edita o código de verdade na pasta Oficina/app da pessoa */
    pedido: function (pedido, ag, term) {
      var eu = L().eu, n = U.normalizar(pedido);
      if (!construtor(eu)) { term.escrever('Você ainda não está liberado(a) na Oficina do app. Peça ao Theus: Oficina → "Quem pode mudar o app".', 'dica'); return; }
      var arquivos = [];
      if (/\btv\b/.test(n)) arquivos.push('tv.js', 'tv.css');
      if (/\bterminal|agente\b/.test(n)) arquivos.push('terminal.js');
      if (/\bmapa\b/.test(n)) arquivos.push('mapamental.js');
      if (/\beditor|tela do meio|site\b/.test(n)) arquivos.push('editor.js');
      if (/\bequipe|convite|token\b/.test(n)) arquivos.push('vistas-b.js');
      if (/\bwhatsapp|projeto|loja\b/.test(n)) arquivos.push('vistas-d.js');
      if (/\bcor|fundo|fonte|estilo|css|visual\b/.test(n)) arquivos.push('v3.css');
      if (!arquivos.length) arquivos.push('estacao.js');
      var texto = pedido.replace(/^app:\s*/i, '').replace(/^\s*(muda|mude|mudar|altera|altere|troca|troque|arruma|arrume|conserta|conserte|melhora|melhore)\s+(no|do|o|na|da|a)\s+(app|babel coop|estacao|estação|oficina)\s*:?\s*/i, '').replace(/\s*\b(no|do|o) (app|babel coop)\b\s*/i, ' ').trim();
      texto = texto.charAt(0).toUpperCase() + texto.slice(1);
      term.escrever('🔧 ' + esc(ag.nome) + ' está mudando o Babel Coop: ' + arquivos.join(', '), 'ia', true);
      term.escrever('(simulação) No app real, ' + esc(ag.nome) + ' edita esses arquivos na sua pasta Oficina/app, roda os testes e deixa a mudança pronta para o Theus publicar.', 'dica');
      L().fazer('oficinaMudanca', texto, arquivos, ag.nome);
      term.cartao('Mudança registrada na <b>Oficina do app</b>: ' + esc(texto) + '. Ela entra na próxima atualização quando o Theus publicar.', null, '<button type="button" class="term-mini" data-term="oficina">abrir a Oficina</button>');
      BC.estacao.render();
    }
  };

  A['oficina-atualizar'] = function () {
    var ui = BC.estacao.ui, a = app();
    ui.atualizando = true;
    BC.estacao.render();
    /* protótipo: 1,5 s "baixando"; no app real, a Estação baixa os arquivos da versão, confere os hashes e recarrega */
    setTimeout(function () { ui.atualizando = false; L().fazer('oficinaAtualizar'); BC.estacao.aviso('Babel Coop atualizado para v' + a.versao + '. ' + (a.notas || '')); }, 1500);
  };
  A['oficina-publicar'] = function () {
    var campo = document.getElementById('oficina-notas'), notas = campo ? campo.value.trim() : '';
    if (!pendentes().length && !notas) { BC.estacao.aviso('Nada para publicar: nenhuma mudança aguardando.'); return; }
    if (L().fazer('oficinaPublicar', notas)) { BC.estacao.ui.oficinaNotas = ''; BC.estacao.aviso('Atualização v' + app().versao + ' publicada. Todo mundo vê o botão Atualizar agora.'); }
  };
  A['oficina-construtor'] = function (el) { L().fazer('oficinaConstrutor', el.dataset.id, el.dataset.sim === '1'); };
  document.addEventListener('input', function (ev) { if (ev.target && ev.target.id === 'oficina-notas') BC.estacao.ui.oficinaNotas = ev.target.value; });

  /* ---------- a tela ---------- */

  BC.vistas.oficina = {
    lateral: function () {
      var a = app(), eu = L().eu, ps = pendentes(), atras = L().estado.pessoas.filter(function (p) { return (a.instalada[p.id] || 0) < a.versao; });
      return '<div class="lat-titulo"><span class="rotulo">Oficina do app</span></div>' +
        '<div class="oficina-versao"><b>v' + a.versao + '</b><span>' + esc(a.notas) + '</span><small>' + (a.publicadaEm ? 'publicada ' + U.relativo(a.publicadaEm) + ' por ' + esc(L().nome(a.por)) : '') + '</small></div>' +
        '<ul class="lat-lista">' +
        '<li><button class="lat-item" type="button" data-acao="rolar" data-alvo="of-mudancas"><span class="rotulo-texto">Aguardando publicação</span><span class="conta">' + ps.length + '</span></button></li>' +
        '<li><button class="lat-item" type="button" data-acao="rolar" data-alvo="of-quem"><span class="rotulo-texto">Quem pode mudar o app</span><span class="conta">' + a.construtores.length + '</span></button></li>' +
        '<li><button class="lat-item" type="button" data-acao="rolar" data-alvo="of-versoes"><span class="rotulo-texto">Versões</span><span class="conta">' + a.historico.length + '</span></button></li>' +
        '<li><button class="lat-item" type="button" data-acao="rolar" data-alvo="of-instalada"><span class="rotulo-texto">Ainda na versão antiga</span><span class="conta">' + atras.length + '</span></button></li></ul>' +
        '<p class="lat-nota">' + (construtor(eu) ? 'Você pode mudar o app: no terminal, diga "muda no app: …". A mudança fica aqui até o Theus publicar.' : 'Só quem o Theus liberar muda o app. Todo mundo recebe o botão Atualizar quando ele publica.') + '</p>';
    },
    conteudo: function () {
      var a = app(), eu = L().eu, e = L().estado, ps = pendentes(), ehAdmin = admin(eu), ui = BC.estacao.ui;
      var cab = '<section class="secao oficina-cab"><div><span class="rotulo">Babel Coop · versão atual</span><h1 class="oficina-v">v' + a.versao + '</h1><p class="form-ajuda">' + esc(a.notas) + '</p></div>' +
        (ehAdmin ? '<div class="oficina-publicar cartao"><label class="rotulo" for="oficina-notas">Notas da próxima versão (v' + (a.versao + 1) + ')</label><input type="text" id="oficina-notas" placeholder="ex.: edição na tela e mapa mental" value="' + esc(ui.oficinaNotas || '') + '">' +
          '<button class="botao primario" type="button" data-acao="oficina-publicar"' + (ps.length ? '' : ' disabled') + '>Publicar atualização v' + (a.versao + 1) + (ps.length ? ' · ' + ps.length + ' mudança' + (ps.length > 1 ? 's' : '') : '') + '</button>' +
          '<p class="form-ajuda">Ao publicar, todo mundo vê "⬆ Atualizar para v' + (a.versao + 1) + '" na barra de baixo. Quem clica recebe os arquivos da sua Estação e o app recarrega.</p></div>' : '') + '</section>';

      var mudancas = '<section class="secao" id="of-mudancas"><span class="rotulo">Aguardando publicação</span>' + (ps.length ? '<div class="lista-limpa">' + ps.map(function (m) {
        var p = L().pessoa(m.quem);
        return '<div class="item" style="--cor:' + (p ? p.cor : '#8670ff') + '">' + (p ? U.avatar(p, 30, true) : '') + '<span class="item-corpo"><span class="item-titulo quebra">' + esc(m.texto) + '</span><span class="item-meta">' + esc(p ? p.nome : m.quem) + (m.agente ? ' · agente ' + esc(m.agente) : '') + ' · ' + U.relativo(m.ts) + ' · ' + m.arquivos.map(function (f) { return '<code>' + esc(f) + '</code>'; }).join(' ') + '</span></span></div>';
      }).join('') + '</div>' : '<p class="vazio">Nenhuma mudança esperando. Quem está liberado pede ao agente no terminal: "muda no app: …".</p>') + '</section>';

      var quem = '<section class="secao" id="of-quem"><span class="rotulo">Quem pode mudar o app</span><div class="oficina-pessoas">' + e.pessoas.map(function (p) {
        var pode = construtor(p.id), fixo = p.papel === 'admin';
        return '<div class="oficina-pessoa' + (pode ? ' pode' : '') + '">' + U.avatar(p, 30, true) + '<span>' + esc(p.nome) + (fixo ? ' · gestão' : '') + '</span>' +
          (ehAdmin && !fixo ? '<button class="botao ' + (pode ? 'discreto' : '') + '" type="button" data-acao="oficina-construtor" data-id="' + p.id + '" data-sim="' + (pode ? '0' : '1') + '">' + (pode ? 'Tirar' : 'Liberar') + '</button>' : '<span class="chip' + (pode ? ' ok' : '') + '">' + (pode ? 'pode mudar' : 'só usa') + '</span>') + '</div>';
      }).join('') + '</div><p class="form-ajuda">Quem pode mudar recebe a pasta Oficina/app na Estação: o agente edita o código lá, roda os testes e a mudança fica aguardando aqui. Publicar é só da gestão.</p></section>';

      var instalada = '<section class="secao" id="of-instalada"><span class="rotulo">Versão instalada em cada Estação</span><div class="oficina-pessoas">' + e.pessoas.map(function (p) {
        var v = a.instalada[p.id] || 0, ok = v >= a.versao;
        return '<div class="oficina-pessoa">' + U.avatar(p, 30, true) + '<span>' + esc(p.nome) + '</span><span class="chip' + (ok ? ' ok' : ' hoje') + '">' + (ok ? 'v' + v + ' · em dia' : 'v' + v + ' · falta atualizar') + '</span></div>';
      }).join('') + '</div></section>';

      var versoes = '<section class="secao" id="of-versoes"><span class="rotulo">Versões publicadas</span><div class="lista-limpa">' + a.historico.slice().reverse().map(function (h) {
        var ms = a.mudancas.filter(function (m) { return m.versao === h.versao; });
        return '<div class="item" style="--cor:#29ccec"><span class="item-corpo"><span class="item-titulo">v' + h.versao + ' · ' + esc(h.notas) + '</span><span class="item-meta">' + U.quando(h.ts) + ' · ' + esc(L().nome(h.por)) + (ms.length ? ' · ' + ms.length + ' mudança' + (ms.length > 1 ? 's' : '') + ': ' + esc(ms.map(function (m) { return m.texto; }).join('; ')) : '') + '</span></span></div>';
      }).join('') + '</div></section>';

      return '<div class="pagina oficina">' + painelLocal() + cab + mudancas + quem + instalada + versoes + '</div>';
    }
  };
})(window.BC);
