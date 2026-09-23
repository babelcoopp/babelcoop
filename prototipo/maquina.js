/* Babel Coop — protótipo · a Máquina: o backend visual, montado como Lego. Peças com nome de gente (Gaveta, Campo, Fio, Chave,
   Empresa, Portaria, Porta, Robô, Depósito, Cofre, Tela, Cano); se monta enquanto o agente constrói; Testar mostra os dados andando.
   O desenho completo está em docs/MAQUINA.md. Aqui tudo é simulado sobre um projeto de exemplo (Clínicas / Babel OS). */
window.BC = window.BC || {};
BC.acoes = BC.acoes || {};
BC.vistas = BC.vistas || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc, A = BC.acoes;
  function L() { return BC.loja; }
  function ui() { return BC.estacao.ui; }
  var M = { maquinas: {} };

  var TIPOS = { gaveta: 'Gaveta', porta: 'Porta', robo: 'Robô', deposito: 'Depósito', cofre: 'Cofre', tela: 'Tela', portaria: 'Portaria', cano: 'Cano' };
  var POR_BAIXO = { gaveta: 'tabela do banco no servidor do projeto', porta: 'rota de API no servidor do projeto', robo: 'gatilho, agendamento ou webhook', deposito: 'pasta de arquivos do projeto', cofre: 'variáveis de ambiente e segredos', tela: 'página do frontend', portaria: 'login e papéis', cano: 'aviso em tempo real quando uma gaveta muda' };

  function pecasIniciais(pj) {
    var dono = pj ? pj.membros[0] : 'theus', m2 = pj && pj.membros[1] || 'davi', m3 = pj && pj.membros[2] || 'bruno';
    return [
      { id: 'portaria', tipo: 'portaria', nome: 'Portaria', frase: 'entra com e-mail e senha · papéis: dono, atendente', x: 3, y: 34, por: dono, campos: ['e-mail', 'senha', 'papel (lista: dono, atendente)'], pronta: true },
      { id: 'empresa', tipo: 'empresa', nome: 'Empresa', frase: 'tudo aqui dentro é separado por empresa (cada uma vê só o seu)', x: 28, y: 8, w: 66, h: 52, por: dono, pronta: true },
      { id: 'clinicas', tipo: 'gaveta', nome: 'Clínicas', frase: 'guarda as clínicas', x: 32, y: 18, por: dono, campos: ['nome (texto)', 'cnpj (texto)', 'cidade (texto)', 'plano (lista)'], chave: 'cada empresa vê só o seu', linhas: 4, pronta: true },
      { id: 'pacientes', tipo: 'gaveta', nome: 'Pacientes', frase: 'guarda os pacientes de cada clínica', x: 54, y: 18, por: m2, campos: ['nome (texto)', 'nascimento (data)', 'telefone (texto)', 'clínica (ligação com Clínicas)', 'foto (arquivo no Depósito)'], chave: 'cada empresa vê só o seu', linhas: 20, pronta: true },
      { id: 'agendamentos', tipo: 'gaveta', nome: 'Agendamentos', frase: 'guarda as consultas marcadas', x: 76, y: 18, por: m3, campos: ['quando (data e hora)', 'paciente (ligação com Pacientes)', 'status (lista: marcado, feito, faltou)', 'obs (texto)'], chave: 'cada empresa vê só o seu', linhas: 50, pronta: true },
      { id: 'porta-novo', tipo: 'porta', nome: 'novo agendamento', frase: 'recebe paciente e horário e grava na gaveta Agendamentos', x: 3, y: 66, por: m2, campos: ['paciente', 'quando'], pronta: true, login: true },
      { id: 'porta-listar', tipo: 'porta', nome: 'listar agendamentos', frase: 'devolve os agendamentos do dia da clínica', x: 3, y: 84, por: m2, campos: ['dia'], pronta: true, login: true },
      { id: 'robo-zap', tipo: 'robo', nome: 'aviso no WhatsApp', frase: 'quando entra um Agendamento, manda a confirmação no WhatsApp', x: 60, y: 68, por: m3, pronta: true, quando: 'quando entra', alvo: 'agendamentos' },
      { id: 'deposito', tipo: 'deposito', nome: 'fotos', frase: 'guarda as fotos dos pacientes · 1,2 GB', x: 54, y: 45, por: m2, pronta: true },
      { id: 'tela-agenda', tipo: 'tela', nome: 'Agenda', frase: 'a tela Agenda usa as portas "novo" e "listar"', x: 30, y: 84, por: m3, pronta: true },
      { id: 'cano', tipo: 'cano', nome: 'ao vivo', frase: 'cada mudança em Agendamentos avisa a tela na hora', x: 82, y: 68, por: m3, pronta: true },
      { id: 'cofre', tipo: 'cofre', nome: 'Cofre', frase: 'BANCO_URL ✓ · BANCO_CHAVE ✓ · ZAPI_TOKEN ✗ pedir ao Theus', x: 30, y: 66, por: dono, pronta: true, faltando: ['ZAPI_TOKEN'] }
    ];
  }
  var FIOS = [['portaria', 'clinicas'], ['clinicas', 'pacientes'], ['pacientes', 'agendamentos'], ['porta-novo', 'agendamentos'], ['porta-listar', 'agendamentos'], ['tela-agenda', 'porta-novo'], ['tela-agenda', 'porta-listar'], ['agendamentos', 'robo-zap'], ['pacientes', 'deposito'], ['agendamentos', 'cano'], ['cano', 'tela-agenda']];

  function maquinaDe(pjId) {
    var m = M.maquinas[pjId];
    if (m) return m;
    var pj = (L().estado.projetos || []).filter(function (p) { return p.id === pjId; })[0];
    m = M.maquinas[pjId] = { pj: pj, pecas: pecasIniciais(pj), fios: FIOS.slice(), linha: [], sel: null, ambiente: 'local', teste: null, mudancas: [], porPessoa: false, modo: 'ver', zoom: 1 };
    var t = Date.now(), ag = pj ? ((L().pessoa(pj.membros[0]) || {}).agentes || [])[0] : null;
    m.linha = [{ ts: t - 3 * U.HORA, texto: (ag ? ag.nome : 'Rita') + ' criou a gaveta Pacientes', quem: pj ? pj.membros[0] : 'theus' }, { ts: t - 170 * U.MIN, texto: 'fechou Pacientes por empresa', quem: pj ? pj.membros[0] : 'theus' }, { ts: t - 2 * U.HORA, texto: 'Dev criou a porta "novo agendamento"', quem: pj ? pj.membros[1] || pj.membros[0] : 'davi' }, { ts: t - 40 * U.MIN, texto: 'Bruno-bot ligou o robô do WhatsApp', quem: pj ? pj.membros[2] || pj.membros[0] : 'bruno' }];
    return m;
  }
  function peca(m, id) { return m.pecas.filter(function (p) { return p.id === id; })[0]; }
  function centro(p) { return { x: p.x + (p.tipo === 'empresa' ? 0 : 9), y: p.y + (p.tipo === 'empresa' ? 0 : 6) }; }

  /* ---------- montar: o agente constrói e a máquina se monta ---------- */

  M.abrir = function (pjId) {
    var pj = (L().estado.projetos || []).filter(function (p) { return p.id === pjId; })[0];
    BC.estacao.abrirAba({ id: 'maquina', tipo: 'maquina', ref: pjId, titulo: 'Máquina · ' + (pj ? pj.nome : 'Babel OS'), atividade: 'maquina' });
  };
  M.pedido = function (texto, ag, terminal) {
    var pjId = (BC.estacao.abaAtual().tipo === 'maquina' ? BC.estacao.abaAtual().ref : null) || ui().projetoAtivo || ((L().estado.projetos || [])[0] || {}).id || 'clinicas';
    /* presets pelo terminal: "usa o preset Login com empresa" · "salva como preset Agendamento" */
    var mp;
    if ((mp = texto.match(/\b(?:usa|use|usar|aplica|aplique|monta|monte|coloca|coloque)\s+(?:o |a )?preset\s+(.+?)\s*[.!]?$/i))) {
      var alvoN = U.normalizar(mp[1]), pre = (L().estado.presets || []).filter(function (p) { return p.tipo !== 'tela' && (U.normalizar(p.nome) === alvoN || U.normalizar(p.nome).indexOf(alvoN) !== -1); })[0];
      if (!pre) { if (terminal) terminal.escrever('Não achei o preset "' + esc(mp[1]) + '". Os da equipe: ' + (L().estado.presets || []).map(function (p) { return p.nome; }).join(' · '), 'dica'); return; }
      M.abrir(pjId);
      setTimeout(function () { M.usarPreset(maquinaDe(pjId), pre, terminal); }, 200);
      return;
    }
    if ((mp = texto.match(/\b(?:salva|salve|salvar|guarda|guarde|guardar)\s+(?:isso |isto |esta máquina |essa máquina |a máquina )?(?:como )?preset\s*:?\s*(.+?)\s*[.!]?$/i))) {
      var m0 = maquinaDe(pjId), pf0 = pecasParaPreset(m0);
      if (L().fazer('presetSalvar', { tipo: 'backend', nome: mp[1].trim(), descricao: 'Guardado pelo terminal por ' + ag.nome, projeto: m0.pj ? m0.pj.nome : '', pecas: pf0.pecas, fios: pf0.fios })) {
        m0.linha.push({ ts: Date.now(), texto: ag.nome + ' guardou o preset "' + mp[1].trim() + '"', quem: L().eu });
        if (terminal) terminal.cartao('Preset <b>' + esc(mp[1].trim()) + '</b> guardado com ' + pf0.pecas.length + ' peça(s). Qualquer projeto usa com "usa o preset ' + esc(mp[1].trim()) + '".', null, '');
        M.abrir(pjId); BC.estacao.render();
      }
      return;
    }
    var m = maquinaDe(pjId), n = U.normalizar(texto), nomeM = (texto.match(/(?:gaveta|tabela)\s+(?:de\s+|para\s+|chamada\s+)?([A-Za-zÀ-ú]+)/i) || [])[1] || 'Retornos';
    nomeM = nomeM.charAt(0).toUpperCase() + nomeM.slice(1);
    M.abrir(pjId);
    var novas = [];
    var g = { id: 'g' + Date.now().toString(36), tipo: 'gaveta', nome: nomeM, frase: 'guarda ' + nomeM.toLowerCase(), x: 32 + Math.round(Math.random() * 40), y: 36, por: L().eu, campos: ['nome (texto)', 'quando (data e hora)', 'paciente (ligação com Pacientes)'], chave: /empresa|clinica|separad/.test(n) ? 'cada empresa vê só o seu' : '⚠ aberta para todos', linhas: 0, pronta: false, nova: true };
    novas.push(g);
    if (/\b(robo|robô|aviso|lembr|manda|whatsapp|quando)\b/.test(n)) novas.push({ id: 'r' + Date.now().toString(36), tipo: 'robo', nome: 'lembrete', frase: 'quando entra em ' + nomeM + ', manda o lembrete no WhatsApp', x: g.x + 18, y: 68, por: L().eu, pronta: false, nova: true, quando: 'quando entra', alvo: g.id });
    if (/\b(porta|api|rota|tela|recebe)\b/.test(n)) novas.push({ id: 'p' + Date.now().toString(36), tipo: 'porta', nome: 'novo ' + nomeM.toLowerCase().replace(/s$/, ''), frase: 'recebe os dados e grava na gaveta ' + nomeM, x: 3, y: 50, por: L().eu, pronta: false, nova: true, login: true });
    if (terminal) terminal.escrever('⚙ ' + ag.nome + ' está montando o backend: a Máquina abriu no meio e as peças entram encaixando.', 'ia', true);
    novas.forEach(function (p, i) {
      setTimeout(function () {
        m.pecas.push(p);
        if (p.tipo === 'gaveta') m.fios.push(['pacientes', p.id]);
        if (p.tipo === 'robo') m.fios.push([p.alvo, p.id]);
        if (p.tipo === 'porta') m.fios.push([p.id, g.id]);
        m.linha.push({ ts: Date.now(), texto: ag.nome + (p.tipo === 'gaveta' ? ' criou a gaveta ' + p.nome + (p.chave.indexOf('⚠') === 0 ? ' (aberta: falta a chave)' : ' e fechou por empresa') : p.tipo === 'robo' ? ' ligou o robô "' + p.nome + '"' : ' criou a porta "' + p.nome + '"'), quem: L().eu });
        m.mudancas.push((p.tipo === 'gaveta' ? 'Cria a gaveta ' + p.nome + (p.chave.indexOf('⚠') === 0 ? '' : ' fechada por empresa') : p.tipo === 'robo' ? 'Liga o robô "' + p.nome + '"' : 'Cria a porta "' + p.nome + '"'));
        setTimeout(function () { p.pronta = true; p.nova = false; BC.estacao.render(); }, 1600);
        BC.estacao.render();
        if (terminal && i === novas.length - 1) { terminal.cartao(esc(ag.nome) + ' montou ' + novas.length + ' peça(s) na Máquina: ' + esc(novas.map(function (x) { return TIPOS[x.tipo] + ' ' + x.nome; }).join(', ')) + ' · migração escrita na pasta do projeto', null, '<button type="button" class="term-mini" data-acao="pj-maquina" data-id="' + pjId + '">ver</button>'); terminal.mostrar(); }
      }, 700 + i * 1900);
    });
  };

  /* ---------- testar: o pedido anda pela máquina ---------- */

  M.testar = function (m) {
    var passos = [['portaria', 'entrou como Ana, da Clínica Vida'], ['tela-agenda', 'a tela Agenda envia o formulário'], ['porta-novo', 'a porta "novo agendamento" recebe paciente e horário'], ['agendamentos', 'uma linha nova entra na gaveta Agendamentos'], ['robo-zap', 'o robô manda o WhatsApp de confirmação'], ['cano', 'o cano avisa a tela na hora'], ['tela-agenda', '✓ a Agenda mostra a consulta nova']];
    m.teste = { i: -1, passos: passos, log: [], fim: false, linhaNova: null };
    function proximo() {
      m.teste.i++;
      var p = passos[m.teste.i];
      if (!p) { m.teste.fim = true; m.teste.log.push({ texto: 'Tentando como a Clínica Sorriso ver a gaveta Agendamentos da Clínica Vida…' }); BC.estacao.render(); setTimeout(function () { m.teste.barrado = true; m.teste.log.push({ texto: '🔒 barrado pela chave "cada empresa vê só o seu"' }); BC.estacao.render(); }, 1400); return; }
      m.teste.atual = p[0];
      m.teste.log.push({ texto: p[1] });
      if (p[0] === 'agendamentos' && !m.teste.linhaNova) { var g = peca(m, 'agendamentos'); g.linhas++; m.teste.linhaNova = { quando: 'amanhã 14:30', paciente: 'Maria Souza', status: 'marcado' }; }
      BC.estacao.render();
      setTimeout(proximo, 1300);
    }
    proximo();
  };

  /* ---------- desenho ---------- */

  function svgFios(m) {
    return '<svg class="mq-fios" viewBox="0 0 100 100" preserveAspectRatio="none">' + m.fios.map(function (f) {
      var a = peca(m, f[0]), b = peca(m, f[1]);
      if (!a || !b) return '';
      var ca = centro(a), cb = centro(b), vivo = m.teste && !m.teste.fim && (m.teste.atual === f[1] || m.teste.atual === f[0]);
      return '<path d="M' + ca.x + ' ' + ca.y + ' C ' + ((ca.x + cb.x) / 2) + ' ' + ca.y + ', ' + ((ca.x + cb.x) / 2) + ' ' + cb.y + ', ' + cb.x + ' ' + cb.y + '" class="mq-fio' + (vivo ? ' vivo' : '') + '"/>';
    }).join('') + '</svg>';
  }
  function pecaHtml(m, p) {
    /* cada peça leva a cor e a foto de quem a criou, sempre (o Theus pediu: no trabalho em equipe a peça fica com a marca da pessoa); "Ver por pessoa" só acende mais */
    var pessoa = L().pessoa(p.por), cor = pessoa ? pessoa.cor : null, ativo = m.teste && m.teste.atual === p.id && !m.teste.fim;
    var alerta = p.tipo === 'gaveta' && /⚠/.test(p.chave || '') ? '⚠ aberta para todos' : p.tipo === 'cofre' && p.faltando && p.faltando.length ? '⚠ chave faltando: ' + p.faltando.join(', ') : p.tipo === 'porta' && !p.login ? '⚠ sem checagem de login' : '';
    if (p.tipo === 'empresa') return '<div class="mq-empresa' + (m.sel === p.id ? ' sel' : '') + '" style="left:' + p.x + '%;top:' + p.y + '%;width:' + p.w + '%;height:' + p.h + '%" data-acao="mq-sel" data-id="' + p.id + '"><span>🏢 EMPRESA · ' + esc(p.frase) + '</span></div>';
    var ICON = { gaveta: '🗄', porta: '🚪', robo: '⚙', deposito: '📦', cofre: '🔐', tela: '🖥', portaria: '🛂', cano: '🧪' };
    return '<button type="button" class="mq-peca mq-' + p.tipo + (p.pronta ? '' : ' construindo') + (p.nova ? ' nova' : '') + (m.sel === p.id ? ' sel' : '') + (ativo ? ' ativa' : '') + (alerta ? ' alerta' : '') + '" style="left:' + p.x + '%;top:' + p.y + '%' + (cor ? ';--pessoa:' + cor : '') + '" data-acao="mq-sel" data-id="' + p.id + '">' +
      '<span class="mq-cab">' + ICON[p.tipo] + ' <b>' + esc(p.nome) + '</b>' + (p.tipo === 'gaveta' ? '<i class="mq-cadeado" title="' + esc(p.chave) + '">' + (/⚠/.test(p.chave) ? '🔓' : '🔒') + '</i>' : '') + (cor ? U.avatar(pessoa, 16) : '') + '</span>' +
      (p.campos && p.tipo === 'gaveta' ? '<span class="mq-campos">' + p.campos.slice(0, 4).map(function (c) { return '<em>' + esc(c) + '</em>'; }).join('') + (p.linhas != null ? '<small>' + p.linhas + ' linhas' + (m.teste && m.teste.linhaNova && p.id === 'agendamentos' ? ' · +1 agora' : '') + '</small>' : '') + '</span>' : '<span class="mq-frase">' + esc(p.frase) + '</span>') +
      (alerta ? '<span class="mq-alerta">' + esc(alerta) + '</span>' : '') + '</button>';
  }
  function ficha(m) {
    var p = m.sel && peca(m, m.sel);
    if (!p) return '<aside class="mq-ficha"><span class="rotulo">Ficha da peça</span><p class="form-ajuda">Clique numa peça para ver o que ela é, onde fica guardado e quem mexeu por último. Tudo em português; o nome técnico fica pequeno.</p></aside>';
    var pessoa = L().pessoa(p.por), ult = m.linha.slice().reverse().filter(function (l) { return l.texto.indexOf(p.nome) !== -1; })[0];
    return '<aside class="mq-ficha"><div class="secao-cab"><span class="rotulo">' + esc(TIPOS[p.tipo] || 'Empresa') + '</span><button class="botao discreto" type="button" data-acao="mq-sel" data-id="">✕</button></div><h2 class="mq-ficha-nome">' + esc(p.nome) + '</h2><p class="mq-ficha-frase">' + esc(p.frase) + '</p><p class="form-ajuda">por baixo: ' + esc(POR_BAIXO[p.tipo] || 'moldura de multi-tenancy (tenant_id + política)') + '</p>' +
      (p.campos ? '<span class="rotulo">Campos</span><ul class="mq-lista">' + p.campos.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul>' : '') +
      (p.tipo === 'gaveta' ? '<span class="rotulo">Chave</span><div class="alternar mq-chaves">' + ['cada empresa vê só o seu', 'só o dono', 'todos leem, só o dono muda', '⚠ aberta para todos'].map(function (c) { return '<button type="button" class="' + (p.chave === c ? 'ativo' : '') + '" data-acao="mq-chave" data-id="' + p.id + '" data-c="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>' : '') +
      (p.tipo === 'gaveta' ? '<span class="rotulo">Onde fica guardado</span><p class="mq-onde">Servidor do projeto (HD compartilhado de quem o sustenta) · ' + esc(m.pj ? m.pj.nome : 'Babel OS') + ' · ambiente ' + m.ambiente + ' · tabela <code>' + esc(p.nome.toLowerCase()) + '</code> · ' + p.linhas + ' linhas · backup diário 03h</p>' + (m.teste && m.teste.linhaNova && p.id === 'agendamentos' ? '<div class="mq-linha-nova"><b>linha que acabou de entrar</b><span>quando: amanhã 14:30 · paciente: Maria Souza · status: marcado · empresa: Clínica Vida</span></div>' : '') : '') +
      (p.tipo === 'robo' ? '<span class="rotulo">Quando</span><div class="alternar"><button type="button" class="ativo">quando entra</button><button type="button">quando muda</button><button type="button">todo dia às…</button></div>' : '') +
      '<span class="rotulo">Quem mexeu</span><p class="pagina-sub">' + (pessoa ? U.avatar(pessoa, 18) + ' ' + esc(pessoa.nome) : '') + (ult ? ' · ' + esc(ult.texto) + ' · ' + U.relativo(ult.ts) : '') + '</p>' +
      '<div class="dem-acoes"><button class="botao" type="button" data-acao="mq-explicar" data-id="' + p.id + '">Explicar com o agente</button><button class="botao" type="button" data-acao="mq-pedir" data-id="' + p.id + '">Pedir para alguém</button></div></aside>';
  }

  BC.vistas.maquina = {
    lateral: function () {
      var tab = BC.estacao.abaAtual(), m = tab.tipo === 'maquina' && tab.ref ? maquinaDe(tab.ref) : null;
      var pjs = L().estado.projetos || [];
      return '<div class="lat-titulo"><span class="rotulo">Máquina · backend visual</span></div><p class="lat-nota">O backend de cada projeto em peças de Lego, com nome de gente. Escolha o projeto:</p><ul class="lat-lista">' + pjs.map(function (p) { return '<li><button class="lat-item" type="button" data-acao="pj-maquina" data-id="' + p.id + '" aria-current="' + (m && m.pj && m.pj.id === p.id) + '"><span class="rotulo-texto">⚙ ' + esc(p.nome) + '</span></button></li>'; }).join('') + '</ul>' +
        (m ? '<div class="lat-titulo"><span class="rotulo">Linha do tempo</span></div><ul class="mq-linha">' + m.linha.slice().reverse().slice(0, 8).map(function (l) { return '<li>' + U.avatar(L().pessoa(l.quem), 16) + '<span>' + esc(l.texto) + '</span><time>' + U.relativo(l.ts) + '</time></li>'; }).join('') + '</ul>' : '') +
        M.presetsHtml(m) +
        '<p class="lat-nota">A Máquina é o construtor de backend da equipe: o código é a verdade, ela lê e desenha, quem escreve é o agente. Testa no local ou na branch; "Publicar" vem depois de "O que muda". Peça no terminal: "cria uma gaveta de retornos separada por clínica com um robô de lembrete".</p>';
    },
    conteudo: function (tab) {
      if (!tab.ref) { tab.ref = ((L().estado.projetos || [])[0] || {}).id || 'clinicas'; }
      var m = maquinaDe(tab.ref), pj = m.pj;
      var alertas = m.pecas.filter(function (p) { return (p.tipo === 'gaveta' && /⚠/.test(p.chave || '')) || (p.tipo === 'cofre' && p.faltando && p.faltando.length) || (p.tipo === 'porta' && !p.login); }).length;
      return '<div class="mq"><header class="mq-topo"><div><h1 class="pagina-titulo">⚙ Máquina · ' + esc(pj ? pj.nome : 'Babel OS') + '</h1><p class="pagina-sub">ambiente <b class="mq-amb ' + m.ambiente + '">' + m.ambiente + ' ●</b> · ' + m.pecas.length + ' peças · ' + alertas + ' alerta(s)' + (m.mudancas.length ? ' · <b>' + m.mudancas.length + ' mudança(s) não publicada(s)</b>' : '') + '</p></div>' +
        '<div class="dem-acoes"><span class="alternar"><button type="button" class="' + (m.ambiente === 'local' ? 'ativo' : '') + '" data-acao="mq-amb" data-a="local">local</button><button type="button" class="' + (m.ambiente === 'branch' ? 'ativo' : '') + '" data-acao="mq-amb" data-a="branch">branch</button><button type="button" class="' + (m.ambiente === 'produção' ? 'ativo' : '') + '" data-acao="mq-amb" data-a="produção">produção</button></span>' +
        '<button class="botao' + (m.porPessoa ? ' primario' : '') + '" type="button" data-acao="mq-pessoa">Ver por pessoa</button><button class="botao" type="button" data-acao="mq-montar">▶ Ver o agente montando</button>' +
        '<button class="botao primario" type="button" data-acao="mq-testar"' + (m.ambiente === 'produção' ? ' disabled title="Nunca em produção"' : '') + '>Testar</button><button class="botao" type="button" data-acao="mq-muda">O que muda</button><button class="botao" type="button" data-acao="mq-publicar">Publicar</button><button class="botao discreto" type="button" data-acao="mq-tv">Projetar na TV</button></div></header>' +
        '<div class="mq-corpo"><div class="mq-palco' + (m.porPessoa ? ' por-pessoa' : '') + '">' + svgFios(m) + m.pecas.map(function (p) { return pecaHtml(m, p); }).join('') +
        (m.teste ? '<div class="mq-teste"><span class="rotulo">Teste · como Ana, da Clínica Vida</span><ol>' + m.teste.log.map(function (l, i) { return '<li class="' + (i === m.teste.log.length - 1 ? 'atual' : '') + '">' + esc(l.texto) + '</li>'; }).join('') + '</ol>' + (m.teste.barrado ? '<p class="mq-barrado">É assim que a equipe entende RLS sem saber o nome.</p>' : '') + '<button class="botao discreto" type="button" data-acao="mq-teste-fechar">fechar</button>' + (m.teste.fim ? '<div class="mq-funcionou">✓ Funcionou: o pedido andou pela máquina e o cadeado barrou a outra empresa. <button class="botao primario" type="button" data-acao="mq-preset-form">Salvar como preset</button></div>' : '') + '</div>' : '') +
        (m.modo === 'muda' ? '<div class="mq-muda cartao"><div class="secao-cab"><span class="rotulo">O que muda · ' + m.ambiente + ' → produção</span><button class="botao discreto" type="button" data-acao="mq-modo" data-m="ver">✕</button></div>' + (m.mudancas.length ? '<ul class="mq-lista">' + m.mudancas.map(function (x) { return '<li>' + esc(x) + ' <button class="botao discreto" type="button" data-acao="mq-sql">ver SQL</button></li>'; }).join('') + '</ul>' : '<p class="vazio">Nada para publicar: produção igual ao ' + m.ambiente + '.</p>') + '</div>' : '') +
        (m.modo === 'publicar' ? '<div class="mq-muda cartao"><div class="secao-cab"><span class="rotulo">Publicar em produção</span><button class="botao discreto" type="button" data-acao="mq-modo" data-m="ver">✕</button></div><p class="pagina-sub">' + (m.mudancas.length ? m.mudancas.length + ' mudança(s): ' + esc(m.mudancas.join('; ')) : 'nada a publicar') + '. Aplica as migrações no banco do projeto e publica as portas no servidor.</p>' + (m.mudancas.length ? '<form class="campo-inline" data-form="mq-publicar"><input type="text" id="mq-confirma" placeholder="digite o nome do projeto para confirmar"><button class="botao primario" type="submit">Publicar</button></form>' : '') + '</div>' : '') + '</div>' + ficha(m) + '</div>' +
        (m.modo === 'preset' ? '<div class="mq-muda cartao"><div class="secao-cab"><span class="rotulo">Salvar como preset da equipe</span><button class="botao discreto" type="button" data-acao="mq-modo" data-m="ver">✕</button></div><form class="mq-preset-form" data-form="mq-preset"><input type="text" id="mq-preset-nome" placeholder="Nome do preset (ex.: Agendamento com lembrete)" required autocomplete="off"><input type="text" id="mq-preset-desc" placeholder="O que ele faz, em uma linha"><p class="form-ajuda">Guarda as ' + m.pecas.filter(function (p) { return p.tipo !== 'empresa' && p.tipo !== 'cofre'; }).length + ' peças desta Máquina e os fios entre elas. Qualquer pessoa usa em qualquer projeto.</p><div><button class="botao primario" type="submit">Guardar preset</button></div></form></div>' : '') +
        '<footer class="mq-rodape">' + m.linha.slice(-3).map(function (l) { return '<span>' + U.hora(l.ts) + ' ' + esc(l.texto) + '</span>'; }).join('') + '</footer></div>';
    }
  };

  function mAtual() { var t = BC.estacao.abaAtual(); return t.tipo === 'maquina' ? maquinaDe(t.ref) : null; }
  A['mq-sel'] = function (el) { var m = mAtual(); if (m) { m.sel = el.dataset.id || null; BC.estacao.render(); } };
  A['mq-amb'] = function (el) { var m = mAtual(); if (m) { m.ambiente = el.dataset.a; m.teste = null; BC.estacao.render(); } };
  A['mq-pessoa'] = function () { var m = mAtual(); if (m) { m.porPessoa = !m.porPessoa; BC.estacao.render(); } };
  A['mq-testar'] = function () { var m = mAtual(); if (!m || m.ambiente === 'produção') return; M.testar(m); BC.estacao.aviso('Teste em ' + m.ambiente + ': veja o pedido andar pela máquina.'); };
  A['mq-teste-fechar'] = function () { var m = mAtual(); if (m) { m.teste = null; BC.estacao.render(); } };

  /* ---------- presets: o que a equipe construiu e funcionou fica guardado para usar de novo ---------- */

  var LA = BC.loja.A;
  function presets() { var e = L().estado; if (!e.presets) e.presets = []; return e.presets; }
  LA.presetSalvar = function (quem, dados) {
    if (!dados || !dados.nome || !dados.tipo) return;
    var p = { id: U.id('pre'), tipo: dados.tipo, nome: dados.nome, descricao: dados.descricao || '', por: quem, projeto: dados.projeto || '', ts: Date.now(), testadoEm: dados.testadoEm || Date.now(), usos: 0, pecas: dados.pecas || [], fios: dados.fios || [], arquivo: dados.arquivo || null };
    presets().unshift(p);
    return [L()._evento('preset', quem, L().nome(quem) + ' guardou o preset "' + p.nome + '" (' + (p.tipo === 'tela' ? 'tela' : 'backend') + '): a equipe pode usar em qualquer projeto.', { tv: true })];
  };
  LA.presetUso = function (quem, id) { var p = presets().filter(function (x) { return x.id === id; })[0]; if (!p) return; p.usos = (p.usos || 0) + 1; return []; };

  function pecasParaPreset(m) {
    var minhas = m.pecas.filter(function (p) { return p.tipo !== 'empresa' && p.tipo !== 'cofre'; });
    var nomes = {}; minhas.forEach(function (p) { nomes[p.id] = p.nome; });
    return { pecas: minhas.map(function (p) { return { tipo: p.tipo, nome: p.nome, frase: p.frase, campos: p.campos, chave: p.chave, login: p.login }; }),
      fios: m.fios.filter(function (f) { return nomes[f[0]] && nomes[f[1]]; }).map(function (f) { return [nomes[f[0]], nomes[f[1]]]; }) };
  }
  M.usarPreset = function (m, p, terminal) {
    var ids = {}, base = 6 + Math.round(Math.random() * 30);
    p.pecas.forEach(function (x, i) {
      var id = 'pre' + Date.now().toString(36) + i, nova = Object.assign({}, x, { id: id, x: base + i * 16, y: 30 + (i % 2) * 34, por: L().eu, pronta: false, nova: true, linhas: 0 });
      if (x.tipo === 'gaveta' && !nova.chave) nova.chave = 'fechada por empresa';
      ids[x.nome] = id;
      m.pecas.push(nova);
      m.linha.push({ ts: Date.now(), texto: 'usou o preset "' + p.nome + '": ' + TIPOS[x.tipo] + ' ' + x.nome, quem: L().eu });
      m.mudancas.push('Preset "' + p.nome + '": ' + TIPOS[x.tipo] + ' ' + x.nome);
      setTimeout(function () { nova.pronta = true; nova.nova = false; BC.estacao.render(); }, 1400 + i * 500);
    });
    (p.fios || []).forEach(function (f) { if (ids[f[0]] && ids[f[1]]) m.fios.push([ids[f[0]], ids[f[1]]]); });
    L().fazer('presetUso', p.id);
    if (terminal) terminal.cartao('Preset <b>' + esc(p.nome) + '</b> entrou na Máquina de ' + esc(m.pj ? m.pj.nome : 'Babel OS') + ': ' + p.pecas.length + ' peça(s) encaixando.', null, '');
    BC.estacao.render();
  };
  A['mq-preset-usar'] = function (el) {
    var m = mAtual(), p = presets().filter(function (x) { return x.id === el.dataset.id; })[0];
    if (!m || !p) { BC.estacao.aviso('Abra a Máquina de um projeto para usar o preset.'); return; }
    M.usarPreset(m, p, BC.estacao.terminal);
    BC.estacao.aviso('Preset "' + p.nome + '" montado. Teste e, se funcionar, publique.');
  };
  A['mq-preset-form'] = function () { var m = mAtual(); if (m) { m.modo = 'preset'; BC.estacao.render(); } };
  BC.formularios['mq-preset'] = function () {
    var m = mAtual(), nome = (document.getElementById('mq-preset-nome') || {}).value || '', desc = (document.getElementById('mq-preset-desc') || {}).value || '';
    if (!m || !nome.trim()) { BC.estacao.aviso('Dê um nome ao preset.'); return; }
    var pf = pecasParaPreset(m);
    if (L().fazer('presetSalvar', { tipo: 'backend', nome: nome.trim(), descricao: desc.trim(), projeto: m.pj ? m.pj.nome : '', pecas: pf.pecas, fios: pf.fios, testadoEm: m.testeOkEm || Date.now() })) {
      m.modo = 'ver'; m.linha.push({ ts: Date.now(), texto: 'guardou o preset "' + nome.trim() + '"', quem: L().eu });
      BC.estacao.aviso('Preset "' + nome.trim() + '" guardado. Está na lista da equipe, em qualquer Máquina.');
      BC.estacao.render();
    }
  };
  M.presetsHtml = function (m) {
    var lista = presets();
    return '<div class="lat-titulo"><span class="rotulo">Presets da equipe</span><span class="conta">' + lista.length + '</span></div>' +
      (lista.length ? '<ul class="lat-lista mq-presets">' + lista.map(function (p) {
        var dono = L().pessoa(p.por);
        return '<li class="mq-preset"><span class="mq-preset-cab">' + (dono ? U.avatar(dono, 16) : '') + '<b>' + esc(p.nome) + '</b><span class="chip">' + (p.tipo === 'tela' ? 'tela' : (p.pecas || []).length + ' peças') + '</span></span><small>' + esc(p.descricao || '') + (p.usos ? ' · usado ' + p.usos + '×' : '') + (p.projeto ? ' · veio de ' + esc(p.projeto) : '') + '</small>' +
          (p.tipo === 'tela' ? '<button class="botao discreto" type="button" data-acao="preset-tela" data-id="' + p.id + '">Começar desta tela</button>' : '<button class="botao' + (m ? ' primario' : '') + '" type="button" data-acao="mq-preset-usar" data-id="' + p.id + '">Usar' + (m ? ' em ' + esc(m.pj ? m.pj.nome : 'Babel OS') : '') + '</button>') + '</li>';
      }).join('') + '</ul>' : '<p class="lat-nota">Nada guardado ainda. Quando algo for construído e o teste passar, clique "Salvar como preset".</p>') +
      '<p class="lat-nota">Presets são o que a equipe já construiu e funcionou: backends e telas. Entram em qualquer projeto com um clique ou por "usa o preset X" no terminal.</p>';
  };
  /* uma tela guardada como preset vira um arquivo novo na minha pasta */
  A['preset-tela'] = function (el) {
    var p = presets().filter(function (x) { return x.id === el.dataset.id; })[0], a = p && L().arquivo(p.arquivo);
    if (!a) { BC.estacao.aviso('O arquivo desta tela não está disponível.'); return; }
    var caminho = L().eu + '/' + (ui().projetoAtivo ? 'Projetos/' + (((L().estado.projetos || []).filter(function (x) { return x.id === ui().projetoAtivo; })[0] || {}).nome || 'Projeto') + '/' : '') + p.nome.replace(/[^\wÀ-ÿ ]+/g, '').trim() + '.html';
    L().fazer('criarArquivo', caminho, 'html', a.conteudo);
    L().fazer('presetUso', p.id);
    var novo = L().arquivo(caminho);
    if (novo) BC.explorador.abrirArquivo(novo.id);
    BC.estacao.aviso('Tela "' + p.nome + '" copiada para a sua pasta. Edite na tela ou no código.');
  };
  A['mq-modo'] = function (el) { var m = mAtual(); if (m) { m.modo = el.dataset.m; BC.estacao.render(); } };
  A['mq-muda'] = function () { var m = mAtual(); if (m) { m.modo = 'muda'; BC.estacao.render(); } };
  A['mq-publicar'] = function () { var m = mAtual(); if (m) { m.modo = 'publicar'; BC.estacao.render(); } };
  A['mq-sql'] = function () { BC.estacao.aviso('create table retornos (id uuid primary key default gen_random_uuid(), tenant_id uuid references tenants(id), …); alter table retornos enable row level security; …'); };
  A['mq-tv'] = function () { BC.estacao.aviso('No app, a Máquina vai ao vivo para a TV e acompanha o agente montando. No protótipo, a TV ainda não desenha a Máquina.'); };
  A['mq-chave'] = function (el) { var m = mAtual(), p = m && peca(m, el.dataset.id); if (!p) return; p.chave = el.dataset.c; m.linha.push({ ts: Date.now(), texto: 'chave de ' + p.nome + ' mudou para "' + p.chave + '"', quem: L().eu }); m.mudancas.push('Muda a chave de ' + p.nome + ' para "' + p.chave + '"'); BC.estacao.aviso('O agente escreve a política no código; a Máquina redesenha. [desfazer] no terminal.'); BC.estacao.render(); };
  A['mq-explicar'] = function (el) { var m = mAtual(), p = m && peca(m, el.dataset.id); if (!p) return; BC.estacao.alternarTerminal(true); var t = BC.estacao.terminal; if (t) { t.escrever('⚙ ' + TIPOS[p.tipo] + ' "' + p.nome + '": ' + p.frase + '. Por baixo é ' + (POR_BAIXO[p.tipo] || 'a moldura de multi-tenancy') + '.' + (p.chave ? ' Quem pode ver: ' + p.chave + '.' : ''), 'ia', true); t.mostrar(); } };
  A['mq-pedir'] = function (el) { var m = mAtual(), p = m && peca(m, el.dataset.id); if (!p) return; ui().rascunho = { titulo: 'Montar a peça "' + p.nome + '" (' + TIPOS[p.tipo] + ')', para: '', descricao: 'Peça da Máquina do projeto ' + (m.pj ? m.pj.nome : '') + ': ' + p.frase, projeto: m.pj ? m.pj.id : null }; A['nova-demanda'](); };
  A['mq-montar'] = function () { var m = mAtual(); if (!m) return; var ag = ((L().pessoa(L().eu) || {}).agentes || [])[0] || { nome: 'Rita' }; M.pedido('cria uma gaveta de retornos separada por clínica com um robô de lembrete e uma porta', ag, BC.estacao.terminal); };
  BC.formularios['mq-publicar'] = function () { var m = mAtual(), v = (document.getElementById('mq-confirma') || {}).value || ''; if (!m) return; if (U.normalizar(v) !== U.normalizar(m.pj ? m.pj.nome : 'babel os')) { BC.estacao.aviso('Digite o nome do projeto exatamente para confirmar.'); return; } m.linha.push({ ts: Date.now(), texto: L().nome(L().eu) + ' publicou ' + m.mudancas.length + ' mudança(s) em produção', quem: L().eu }); m.mudancas = []; m.modo = 'ver'; L().fazer('recado', 'Máquina: ' + (m.pj ? m.pj.nome : 'Babel OS') + ' publicado em produção'); BC.estacao.aviso('Publicado. As peças novas ficam verdes por um tempo.'); BC.estacao.render(); };

  BC.maquina = M;
})(window.BC);
