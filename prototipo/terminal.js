/* Babel Coop — protótipo · terminal (à direita, visual do Babel Terminal). Cada aba é um agente com nome humano;
   os agentes mexem no app inteiro (campanha, demanda, aviso, TV, navegador) e a equipe pode ver e entrar. */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc;
  function L() { return BC.loja; }

  var RECEITAS = [
    ['Explicar este arquivo', function (arq) { return 'Explique o arquivo ' + (arq || 'aberto') + ' em português simples, para quem está começando.'; }],
    ['Procurar no acervo', function () { return 'coop buscar "'; }],
    ['Criar página desta nota', function (arq) { return 'Crie uma página HTML simples a partir de ' + (arq || 'minha nota') + ', no visual da Babel.'; }],
    ['Resumir a reunião', function () { return 'Resuma a reunião de hoje em 5 próximos passos, com responsável.'; }],
    ['Me ajude com um erro', function () { return 'Rodei um comando e deu erro. Me explique o que aconteceu e como corrigir: '; }],
    ['Responder o WhatsApp', function () { return 'Responde a última mensagem do WhatsApp aberto.'; }],
    ['Navegar por mim', function () { return 'Entra em clinicavida.com.br e preenche o cadastro de fornecedor com os dados da Babel.'; }],
    ['Clonar uma página', function () { return 'Clona a landing clinicavida.com.br e me traz a copy.'; }]
  ];

  function Terminal(raiz) {
    this.raiz = raiz;
    this.dono = null;
    this.aba = null;
    this.linhas = {};
    this.historico = [];
    this.pos = 0;
    this.degrade = true;
    this.neon = true;
    this.pendente = null;
    this.montar();
    this.sincronizar();
    this.mostrar();
  }

  Terminal.prototype.agentes = function () { var p = L().pessoa(L().eu); return (p && p.agentes) || []; };
  Terminal.prototype.agente = function (id) { return this.agentes().filter(function (a) { return a.id === (id || this.aba); }, this)[0] || null; };

  /* quando a pessoa muda ("ver como") ou os agentes mudam, as abas acompanham */
  Terminal.prototype.sincronizar = function () {
    var eu = L().eu, ags = this.agentes(), t = this;
    if (this.dono !== eu) { this.dono = eu; this.aba = null; this.pendente = null; }
    if (!ags.length) { this.aba = null; return; }
    if (!this.aba || !ags.some(function (a) { return a.id === t.aba; })) this.aba = ags[0].id;
    ags.forEach(function (a) { if (!t.linhas[eu + '|' + a.id]) { t.linhas[eu + '|' + a.id] = []; t.boasVindas(a); } });
  };
  Terminal.prototype.chave = function () { return this.dono + '|' + this.aba; };

  Terminal.prototype.montar = function () {
    this.raiz.innerHTML =
      '<div class="term-topo"><span class="rotulo term-rotulo">Agentes</span><div class="term-abas" role="tablist"></div>' +
      '<button class="term-aba term-mais" type="button" data-term="nova" title="Novo agente (Ctrl+Shift+T)" aria-label="Novo agente">+</button>' +
      '<div class="term-acoes"><button class="term-vivo" type="button" data-term="vivo" title="Seu terminal aparece na parede de terminais ao vivo"></button>' +
      '<button class="term-toggle" type="button" data-term="entrar" title="Entrar no terminal de alguém (Ctrl+Shift+E)">Entrar em…</button>' +
      '<button class="term-toggle" type="button" data-term="neon" aria-pressed="true">Neon</button>' +
      '<button class="botao discreto" type="button" data-term="esconder" title="Esconder (Ctrl + `)" aria-label="Esconder o terminal">⟩</button></div></div>' +
      '<div class="term-novo" id="term-novo" hidden></div>' +
      '<div class="term-corpo" data-degrade="sim" data-neon="sim"><img class="term-marca" src="babel-logo.png" alt="">' +
      '<div class="term-saida"></div><div class="term-linha term-prompt1"></div>' +
      '<div class="term-mencao" id="term-mencao" hidden></div>' +
      '<label class="term-entrada"><span class="term-p2">❯</span><input type="text" id="term-entrada" autocomplete="off" spellcheck="false" aria-label="Pedido ao agente ou comando"></label></div>' +
      '<div class="term-receitas"><span class="rotulo">Receitas</span>' + RECEITAS.map(function (r, i) {
        return '<button type="button" class="chip" data-term="receita:' + i + '">' + r[0] + '</button>';
      }).join('') + '</div>';
    this.corpo = this.raiz.querySelector('.term-corpo');
    this.saida = this.raiz.querySelector('.term-saida');
    this.entrada = this.raiz.querySelector('#term-entrada');
    this.prompt1 = this.raiz.querySelector('.term-prompt1');
    this.mencao = this.raiz.querySelector('#term-mencao');
    var eu = this;

    this.raiz.addEventListener('click', function (e) {
      var b = e.target.closest('[data-term]');
      if (!b) { if (e.target.closest('.term-corpo')) eu.focar(); return; }
      var q = b.getAttribute('data-term');
      if (q === 'neon') { eu.neon = !eu.neon; b.setAttribute('aria-pressed', eu.neon); eu.corpo.dataset.neon = eu.neon ? 'sim' : 'nao'; }
      if (q === 'esconder') BC.estacao.alternarTerminal(false);
      if (q === 'vivo') { var on = L().estado.transmissao[L().eu] !== false; L().fazer('transmissao', !on); BC.estacao.aviso(on ? 'Transmissão pausada: ninguém vê seus terminais ao vivo.' : 'Transmissão ligada.'); }
      if (q === 'entrar') { BC.estacao.abrirPaleta(); var pe = document.getElementById('paleta-entrada'); pe.value = 'Entrar no terminal de'; pe.dispatchEvent(new Event('input')); }
      if (q === 'nova') eu.novoAgenteForm();
      if (q === 'nova-cancelar') { document.getElementById('term-novo').hidden = true; }
      if (q === 'nova-criar') eu.criarAgente();
      if (q.indexOf('aba:') === 0) { eu.aba = q.slice(4); eu.mostrar(); eu.focar(); }
      if (q.indexOf('apagar:') === 0) { var ag = eu.agente(q.slice(7)); if (ag && eu.agentes().length > 1) { L().fazer('apagarAgente', ag.id); eu.sincronizar(); eu.mostrar(); } else BC.estacao.aviso('Deixe pelo menos um agente.'); }
      if (q.indexOf('receita:') === 0) {
        var tab = BC.estacao.abaAtual(), arq = tab && tab.tipo === 'arquivo' && L().arquivo(tab.ref);
        eu.entrada.value = RECEITAS[+q.slice(8)][1](arq ? arq.caminho : null);
        eu.focar();
        eu.mencionar();
      }
      if (q.indexOf('desfazer:') === 0) {
        var partes = q.split(':');
        if (L().fazer(partes[1], partes[2])) { eu.escrever('↶ Desfeito.', 'dica', true); eu.mostrar(); }
        b.disabled = true;
      }
      if (q.indexOf('abrir:') === 0) { var a = L().arquivo(q.slice(6)); if (a) BC.explorador.abrirArquivo(a.id); }
      if (q === 'oficina') BC.estacao.abrir('oficina');
      if (q.indexOf('pessoa:') === 0) BC.estacao.abrirPerfil(q.slice(7));
    });

    this.entrada.addEventListener('input', function () { eu.mencionar(); });
    this.entrada.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var cmd = eu.entrada.value;
        eu.entrada.value = '';
        eu.mencionar();
        if (cmd.trim()) { eu.historico.push(cmd); eu.pos = eu.historico.length; }
        eu.rodar(cmd);
      } else if (e.key === 'ArrowUp') {
        if (eu.pos > 0) { eu.pos--; eu.entrada.value = eu.historico[eu.pos]; }
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        if (eu.pos < eu.historico.length) { eu.pos++; eu.entrada.value = eu.historico[eu.pos] || ''; }
        e.preventDefault();
      } else if (e.key === 'l' && e.ctrlKey) {
        eu.linhas[eu.chave()] = []; eu.mostrar(); e.preventDefault();
      } else if (e.key === 'Escape' && eu.pendente) {
        eu.pendente = null; eu.escrever('Cancelado.', 'dica'); eu.mostrar();
      }
    });
  };

  Terminal.prototype.focar = function () { this.entrada.focus(); };

  /* ---------- pessoas mencionadas no pedido: o nome vira chip com a foto ---------- */

  Terminal.prototype.pessoasNoTexto = function (texto) {
    var t = ' ' + U.normalizar(texto) + ' ', achadas = [];
    L().estado.pessoas.forEach(function (p) {
      var n = U.normalizar(p.nome);
      if (new RegExp('[^a-z0-9]' + n + '[^a-z0-9]').test(t)) achadas.push(p);
    });
    return achadas;
  };
  Terminal.prototype.mencionar = function () {
    var ps = this.pessoasNoTexto(this.entrada.value);
    this.mencao.hidden = !ps.length;
    this.mencao.innerHTML = ps.map(function (p) {
      return '<button type="button" class="term-chip-pessoa" data-term="pessoa:' + p.id + '" style="--cor:' + p.cor + '">' + U.avatar(p, 18) + '<span>' + esc(p.nome) + '</span><small>' + esc(L().estado.areas[p.area]) + '</small></button>';
    }).join('') + '<span class="term-mencao-dica">pessoa reconhecida · o agente sabe de quem se trata</span>';
  };

  /* ---------- escrever ---------- */

  Terminal.prototype.escrever = function (texto, classe, comHora) {
    var h = comHora ? '<span class="hora">[' + U.hora(Date.now()) + ']</span> ' : '';
    var k = this.chave();
    (this.linhas[k] = this.linhas[k] || []).push('<div class="term-linha ' + (classe || 'saida') + '">' + h + esc(texto) + '</div>');
    if (this.linhas[k].length > 300) this.linhas[k].shift();
    if (this.gravar && classe !== 'dica') this.gravar.push({ tipo: classe === 'ia' ? 'ia' : 'saida', texto: texto, agente: this.aba });
  };
  /* cartão de ação do agente: o que foi feito, com desfazer */
  Terminal.prototype.cartao = function (texto, desfazer, extras) {
    var k = this.chave();
    (this.linhas[k] = this.linhas[k] || []).push('<div class="term-linha term-cartao"><span>✓ ' + texto + '</span>' +
      (desfazer ? '<button type="button" class="term-mini" data-term="desfazer:' + desfazer + '">desfazer</button>' : '') + (extras || '') + '</div>');
    if (this.gravar) this.gravar.push({ tipo: 'ia', texto: '✓ ' + texto.replace(/<[^>]+>/g, ''), agente: this.aba });
  };

  Terminal.prototype.boasVindas = function (ag) {
    var antes = this.aba;
    this.aba = ag.id;
    var primeiro = this.agentes()[0] && this.agentes()[0].id === ag.id;
    this.escrever(ag.nome + ' · ' + (ag.oQueFaz || 'seu agente'), 'saida');
    if (primeiro) {
      this.escrever('Este é o seu agente. Dê um nome e uma foto no "+". Ele mexe no app inteiro: peça uma demanda, uma campanha, um aviso, um site na TV.', 'dica');
      this.escrever('Exemplos: "cria uma campanha de 50 clientes para a Carla até 30/09" · "manda um aviso para a TV: reunião às 16h" · "mostra o site babel-os.com na TV" · "entra em clinicavida.com.br e preenche o cadastro".', 'dica');
      this.escrever('No app de verdade, cada aba é uma sessão do Claude Code com a sua conta. Aqui a resposta é simulada; as ações são de verdade.', 'dica');
    } else {
      this.escrever('Agente pronto. Digite um pedido ou um comando (coop ajuda).', 'dica');
    }
    this.escrever(' ', 'dica');
    this.aba = antes;
  };

  Terminal.prototype.mostrar = function () {
    var eu = this, e = L().estado, cs = e.controles || [], meu = L().eu;
    this.sincronizar();
    this.raiz.querySelector('.term-abas').innerHTML = this.agentes().map(function (a) {
      var olhos = cs.filter(function (c) { return c.dono === meu && c.estado === 'ativo' && (!c.agenteId || c.agenteId === a.id); }).length;
      return '<button class="term-aba term-agente" type="button" role="tab" data-term="aba:' + a.id + '" aria-selected="' + (a.id === eu.aba) + '" title="' + esc(a.oQueFaz || '') + '">' +
        '<span class="term-av" style="--cor:' + a.cor + '">' + esc(a.nome.slice(0, 2).toUpperCase()) + '</span><span>' + esc(a.nome) + '</span><i class="term-estado ' + (a.estado || 'parado') + '"></i>' +
        (olhos ? '<span class="term-olho" title="' + olhos + ' pessoa(s) no seu terminal">👁 ' + olhos + '</span>' : '') +
        (a.id === eu.aba && eu.agentes().length > 1 ? '<span class="term-x" data-term="apagar:' + a.id + '" title="Apagar este agente">×</span>' : '') + '</button>';
    }).join('');
    this.saida.innerHTML = (this.linhas[this.chave()] || []).join('');
    this.atualizar();
    this.corpo.scrollTop = this.corpo.scrollHeight;
  };

  /* só o selo e o prompt (a Estação chama a cada mudança, sem mexer na rolagem) */
  Terminal.prototype.atualizar = function () {
    var e = L().estado, vivo = e.transmissao[L().eu] !== false, sv = this.raiz.querySelector('.term-vivo');
    if (this.dono !== L().eu) { this.mostrar(); return; }
    sv.textContent = vivo ? '● ao vivo' : '○ pausado';
    sv.classList.toggle('pausado', !vivo);
    var ag = this.agente(), ctrl = (e.controles || []).filter(function (c) { return c.dono === L().eu && c.estado === 'ativo'; })[0];
    this.prompt1.innerHTML = '<span class="term-p1">╭ ' + esc(L().eu) + '@estacao</span> · <span class="term-p2">~/BabelCoop</span>' + (ag ? ' · <span class="term-p3">' + esc(ag.nome) + '</span>' : '') +
      (ctrl ? ' · <span class="term-selo-controle">● ' + esc(L().nome(ctrl.quem)) + ' está no seu terminal</span>' : '') + (this.pendente ? ' · <span class="term-p3">confirma? [s/N]</span>' : '');
  };

  /* ---------- novo agente ---------- */

  Terminal.prototype.novoAgenteForm = function () {
    var box = document.getElementById('term-novo');
    box.hidden = false;
    box.innerHTML = '<div class="term-novo-cab"><span class="rotulo">Novo agente</span><button class="botao discreto" type="button" data-term="nova-cancelar">✕</button></div>' +
      '<div class="term-novo-campos"><input type="text" id="ag-nome" placeholder="Nome humano (ex.: Rita)" maxlength="18" autocomplete="off">' +
      '<input type="text" id="ag-faz" placeholder="O que ele faz (vira as instruções)" autocomplete="off">' +
      '<label class="marcar"><input type="checkbox" id="ag-visivel" checked> aparece para a equipe</label>' +
      '<button class="botao primario" type="button" data-term="nova-criar">Criar</button></div>' +
      '<p class="form-ajuda">A foto é a letra na cor do agente; no app dá para subir uma imagem. Cada agente é uma sessão de Claude Code com a sua conta.</p>';
    var n = document.getElementById('ag-nome');
    n.focus();
    var eu = this;
    n.addEventListener('keydown', function (e) { if (e.key === 'Enter') eu.criarAgente(); });
  };
  Terminal.prototype.criarAgente = function () {
    var nome = (document.getElementById('ag-nome') || {}).value || '', faz = (document.getElementById('ag-faz') || {}).value || '', vis = (document.getElementById('ag-visivel') || {}).checked;
    if (!nome.trim()) { document.getElementById('ag-nome').focus(); return; }
    L().fazer('novoAgente', { nome: nome, oQueFaz: faz, visivel: vis !== false });
    document.getElementById('term-novo').hidden = true;
    var ags = this.agentes();
    this.aba = ags[ags.length - 1].id;
    this.sincronizar();
    this.mostrar();
    this.focar();
    BC.estacao.aviso('Agente ' + nome.trim() + ' criado. Ele aparece na parede de terminais.');
  };

  /* ---------- rodar ---------- */

  function partes(cmd) {
    var r = [], m, re = /"([^"]*)"?|(\S+)/g;
    while ((m = re.exec(cmd))) r.push(m[1] !== undefined ? m[1] : m[2]);
    return r;
  }
  var COMANDOS = /^(clear|limpar|ajuda|help|coop|claude|ls|pwd|whoami|date|touch|echo|cat|cd|mkdir|npm|git|node|python|pytest|s|n|sim|nao|não)$/;

  Terminal.prototype.rodar = function (cmd) {
    if (!this.aba) { this.escrever('Crie um agente no "+".', 'erro'); this.mostrar(); return; }
    var ag = this.agente(), k = this.chave();
    (this.linhas[k] = this.linhas[k] || []).push('<div class="term-linha"><span class="term-p1">╭ ' + esc(L().eu) + '@estacao</span> · <span class="term-p2">~/BabelCoop</span> · <span class="term-p3">' + esc(ag.nome) + '</span></div>' +
      '<div class="term-linha"><span class="term-p2">❯</span> ' + esc(cmd) + '</div>');
    var p = partes(cmd.trim());
    if (!p.length) { this.mostrar(); return; }
    var c = U.normalizar(p[0]);
    this.gravar = [{ tipo: COMANDOS.test(c) && c !== 'claude' ? 'cmd' : 'prompt', texto: cmd, agente: this.aba }];
    try {
      if (this.pendente) {
        var fn = this.pendente; this.pendente = null;
        if (c === 's' || c === 'sim') fn(); else this.escrever('Não feito.', 'dica');
      }
      else if (c === 'clear' || c === 'limpar') { this.linhas[k] = []; }
      else if (c === 'claude') { if (p[1]) this.ia(p.slice(1).join(' ')); else this.escrever('Este terminal já é o ' + ag.nome + ': escreva o pedido direto.', 'dica'); }
      else if (c === 'ajuda' || c === 'help') this.coop(['ajuda']);
      else if (c === 'coop') this.coop(p.slice(1));
      else if (c === 'ls') this.escrever((L().estado.arquivos.filter(function (a) { return a.dono === L().eu; }).map(function (a) { return a.caminho.split('/').slice(1).join('/'); }).join('    ')) || '(pasta vazia)');
      else if (c === 'pwd') this.escrever('/Users/' + L().eu + '/BabelCoop');
      else if (c === 'cd') this.escrever(p[1] && p[1].indexOf('~') === 0 || (p[1] || '').indexOf('/') === 0 ? 'Fora da pasta compartilhada: o terminal é o seu computador inteiro, como no iTerm. Só a pasta BabelCoop é visível para a equipe.' : 'ok', 'dica');
      else if (c === 'mkdir') this.escrever('Pasta criada' + (p[1] ? ' (' + p[1] + ')' : '') + '. No app, é uma pasta de verdade no seu computador.', 'saida', true);
      else if (c === 'whoami') this.escrever(L().eu);
      else if (c === 'date') this.escrever(U.dataLonga() + ', ' + U.horaSeg(Date.now()));
      else if (c === 'touch') this.criar(p[1], '');
      else if (c === 'echo' && p.indexOf('>') !== -1) { var seta = p.indexOf('>'); this.criar(p[seta + 1], p.slice(1, seta).join(' ')); }
      else if (c === 'echo') this.escrever(p.slice(1).join(' '));
      else if (c === 'cat') this.coop(['ler'].concat(p.slice(1)));
      else if (/^(npm|git|node|python|pytest)$/.test(c)) this.escrever('(simulado) No app, é o seu shell de verdade: ' + cmd, 'dica');
      else this.ia(cmd);
    } catch (e) { this.escrever('erro: ' + e.message, 'erro'); }
    if (this.gravar.length) L().fazer('terminal', this.gravar);
    this.gravar = null;
    this.mostrar();
  };

  /* arquivo criado pelo terminal: vai para a pasta da pessoa, aparece no explorador de todos e entra no acervo */
  var TIPOS_TEXTO = /^(md|txt|csv|js|ts|py|sh|css|json|html)$/;
  Terminal.prototype.criar = function (nome, conteudo) {
    if (!nome) { this.escrever('Diga o nome do arquivo. Ex.: touch nota.md', 'erro'); return; }
    nome = nome.replace(/^~\/BabelCoop\//, '').replace(/^\/+/, '');
    var eu = L().eu, caminho = eu + '/' + nome, tipo = BC.explorador.tipoDe(nome), ja = L().arquivo(caminho);
    if (!TIPOS_TEXTO.test(tipo)) tipo = 'txt';
    if (ja) {
      if (!conteudo) { this.escrever(nome + ' já existe.', 'dica'); return; }
      L().fazer('salvarArquivo', ja.id, conteudo + '\n');
      this.escrever('Gravado em ' + nome + '. A versão anterior ficou guardada.', 'saida', true);
      return;
    }
    L().fazer('criarArquivo', caminho, tipo, conteudo ? conteudo + '\n' : '');
    if (BC.estacao && BC.estacao.ui) nome.split('/').slice(0, -1).forEach(function (x, i, arr) { BC.estacao.ui.abertas[eu + '/' + arr.slice(0, i + 1).join('/')] = true; });
    this.escrever('Criado ~/BabelCoop/' + nome + ': já aparece no explorador de todos e entrou no acervo.', 'saida', true);
  };

  /* ---------- o agente entende o pedido e age no app ---------- */

  function pessoaEm(texto) {
    var t = ' ' + U.normalizar(texto) + ' ', r = null;
    L().estado.pessoas.forEach(function (p) { if (!r && new RegExp('[^a-z0-9]' + U.normalizar(p.nome) + '[^a-z0-9]').test(t)) r = p; });
    return r;
  }
  function prazoEm(texto) {
    var m = texto.match(/at[ée]\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i);
    if (!m) return null;
    var d = new Date(), ano = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : d.getFullYear();
    return { ts: new Date(ano, +m[2] - 1, +m[1], 18, 0, 0).getTime(), texto: m[1] + '/' + m[2] };
  }
  function urlEm(texto) {
    var m = texto.match(/((?:https?:\/\/)?[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(?:\.[a-z]{2,})?(?:\/\S*)?)/i);
    return m ? m[1] : null;
  }

  Terminal.prototype.ia = function (pedido) {
    pedido = pedido.replace(/^"|"$/g, '');
    var t = this, n = U.normalizar(pedido), ag = this.agente(), pessoa = pessoaEm(pedido), prazo = prazoEm(pedido), url = urlEm(pedido);
    L().fazer('prompt', pedido);
    L().fazer('agenteEstado', ag.id, 'pensando');
    setTimeout(function () { L().fazer('agenteEstado', ag.id, 'parado'); }, 2500);
    var quemTxt = pessoa ? ' <b>◉ ' + esc(pessoa.nome) + '</b>' : '';
    /* mapa mental: o agente cria e mexe no mapa por conversa (antes dos outros, porque "apaga X" com um mapa aberto é do mapa) */
    if (BC.mapaAgente && BC.mapaAgente.entende(n) && BC.mapaAgente.pedido(pedido, ag, this) !== false) return;
    /* Oficina: mudar o próprio Babel Coop pelo terminal (quem o Theus liberou) */
    if (BC.oficina && BC.oficina.entende(n) && BC.oficina.pedido(pedido, ag, this) !== false) return;

    /* campanha */
    var mc = n.match(/campanha\s+(?:de\s+)?(\d+)?\s*([a-z0-9 ]*?)(?:\s+para\b|\s+ate\b|$)/);
    if (/\b(cria|criar|crie|monta|abre|abra|lanca|lance)\b/.test(n) && /campanha/.test(n)) {
      var alvo = mc && mc[1] ? +mc[1] : 10, unidade = mc && mc[2] ? mc[2].trim() : 'novos clientes';
      var titulo = (alvo + ' ' + unidade).trim();
      L().fazer('novaCampanha', { titulo: titulo, alvo: alvo, unidade: unidade, pessoa: pessoa ? pessoa.id : L().eu, prazo: prazo && prazo.ts, prazoTexto: prazo && prazo.texto, principal: true });
      var c = (L().estado.campanhas || [])[0];
      this.cartao('Campanha "' + esc(titulo) + '" criada para' + (quemTxt || ' você') + (prazo ? ' · até ' + prazo.texto : '') + ' · já está na TV', c ? 'desfazerCampanha:' + c.id : null);
      return;
    }
    /* demanda */
    if (/\b(cria|criar|crie|manda|mande|envia|envie|pede|peca)\b/.test(n) && /\b(demanda|tarefa)\b/.test(n)) {
      var desc = pedido.replace(/^.*?(demanda|tarefa)\s*(para\s+(a|o)?\s*[\wÀ-ú-]+)?[:,]?\s*/i, '').trim() || 'Demanda criada pelo agente ' + ag.nome;
      L().fazer('novaDemanda', { titulo: desc.slice(0, 80), para: pessoa ? pessoa.id : null, prazo: prazo && prazo.ts, estimativaMin: 30, prioridade: 'média', descricao: 'Criada pelo agente ' + ag.nome + ' a pedido de ' + L().nome(L().eu) + '.' });
      var d = L().estado.demandas[0];
      this.cartao('Demanda "' + esc(d.titulo) + '"' + (pessoa ? ' enviada para' + quemTxt : ' deixada livre: pega quem puder') + (prazo ? ' · até ' + prazo.texto : ''), null, '<button type="button" class="term-mini" data-term="abrir:' + d.id + '">ver</button>');
      return;
    }
    /* aviso ou recado para a TV */
    if (/\b(aviso|recado|mural)\b/.test(n) && /\b(manda|mande|poe|poe|coloca|coloque|publica|publique|envia|envie)\b/.test(n)) {
      var txt = pedido.replace(/^.*?(tv|mural|aviso|recado)\s*[:,-]?\s*/i, '').trim() || pedido;
      var oficial = /aviso/.test(n) && L().eAdmin();
      L().fazer(oficial ? 'aviso' : 'recado', txt);
      this.cartao((oficial ? 'Aviso' : 'Recado') + ' na TV: “' + esc(txt) + '”');
      return;
    }
    /* site na TV */
    if (/\btv\b/.test(n) && url && /\b(mostra|mostre|abre|abra|poe|coloca|projeta)\b/.test(n)) {
      L().fazer('tvSite', url);
      this.cartao('Site <b>' + esc(url) + '</b> na TV · a TV só mostra; para tirar: coop tv painel');
      return;
    }
    /* projetar arquivo na TV */
    if (/\btv\b/.test(n) && /\b(projeta|projete|mostra|mostre|coloca|poe)\b/.test(n)) {
      var alvoArq = L().estado.arquivos.filter(function (a) { return n.indexOf(U.normalizar(a.caminho.split('/').pop().replace(/\.[a-z0-9]+$/, ''))) !== -1; })[0];
      if (alvoArq && L().fazer('projetar', alvoArq.caminho)) { this.cartao('Projetando <b>' + esc(alvoArq.caminho.split('/').pop()) + '</b> na TV · role com PageUp/PageDown', null, '<button type="button" class="term-mini" data-term="abrir:' + alvoArq.id + '">abrir</button>'); return; }
    }
    /* mudar o modo da TV */
    if (/\btv\b/.test(n) && /\b(painel|reuniao|visita|quadro)\b/.test(n)) {
      var modo = n.match(/\b(painel|reuniao|visita|quadro)\b/)[1];
      if (modo === 'visita') L().fazer('visita', !/desliga|tira/.test(n)); else L().fazer('tvModo', modo);
      this.cartao('TV no modo <b>' + modo + '</b>');
      return;
    }
    /* cancelar ou encerrar algo de outra pessoa: confirma antes */
    if (/\b(cancela|cancele|apaga|apague|encerra|encerre|exclui|exclua)\b/.test(n)) {
      var dem = L().estado.demandas.filter(function (x) { return (x.estado === 'enviada' || x.estado === 'livre') && x.de === L().eu && (!pessoa || x.para === pessoa.id); })[0];
      if (dem) {
        this.escrever('Vou cancelar "' + dem.titulo + '"' + (pessoa ? ', que está com ' + pessoa.nome : '') + '. Confirma? [s/N]', 'ia', true);
        this.pendente = function () { if (L().fazer('cancelar', dem.id)) t.cartao('Demanda "' + esc(dem.titulo) + '" cancelada'); };
        return;
      }
      if (/projecao|tv/.test(n) && L().estado.projecao) { L().fazer('encerrarProjecao'); this.cartao('Projeção encerrada'); return; }
    }
    /* WhatsApp */
    if (/whatsapp|zap/.test(n) && /\b(responde|responda|resposta)\b/.test(n)) {
      if (BC.vistas.whatsapp && BC.vistas.whatsapp.sugerirAtual(ag.nome)) { this.cartao(esc(ag.nome) + ' escreveu a resposta no WhatsApp · confira e aperte Enter lá (sugere e você manda)'); BC.estacao.abrir('whatsapp'); }
      else this.escrever('Abra a tela WhatsApp e escolha uma conversa para o ' + ag.nome + ' ver a mensagem.', 'dica');
      return;
    }
    /* navegador do agente: clonar ou navegar */
    if (url && /\b(clona|clone|clonar|copia a copy|traz a copy)\b/.test(n)) {
      if (BC.navegador) BC.navegador.abrir(ag, url, 'clonar', this);
      return;
    }
    if (url && /\b(entra|entre|abre|abra|acessa|acesse|navega|navegue|preenche|preencha|cadastra|cadastre|clica|clique)\b/.test(n)) {
      if (BC.navegador) BC.navegador.abrir(ag, url, /preench|cadastr|clica|clique/.test(n) ? 'preencher' : 'navegar', this);
      return;
    }
    /* entrar no terminal de alguém */
    if (pessoa && /\b(entra|entre|entrar)\b/.test(n) && /terminal/.test(n)) { BC.acoes['term-entrar']({ dataset: { id: pessoa.id } }); this.cartao('Pedido para entrar no terminal de' + quemTxt); return; }
    /* fluxo 3D: a próxima tela ou peça ligada a esta, criada pelo agente */
    if (BC.visual3d && /\b(proximo item|proxima tela|liga esta tela|ligad[ao] (a|ao|na|no)|em 3d|no 3d)\b/.test(n) && /\b(cria|criar|crie|monta|adiciona|liga|ligue)\b/.test(n)) { BC.visual3d.pedido(pedido, ag, this); return; }
    /* backend: a Máquina se monta enquanto o agente constrói */
    if (BC.maquina && /\bpreset\b/.test(n)) { BC.maquina.pedido(pedido, ag, this); return; }
    if (BC.maquina && /\b(gaveta|tabela|backend|banco de dados|maquina|migracao|migration|politica|rls|tenant|multi.?tenan|edge function|supabase)\b/.test(n) && /\b(cria|criar|crie|monta|montar|monte|adiciona|adicione|faz|faca|gera|gere|liga|ligue)\b/.test(n)) { BC.maquina.pedido(pedido, ag, this); return; }
    /* pedido comum: consulta o acervo e, se for para criar algo, deixa um rascunho */
    var achados = BC.acervo.buscar(L().estado, pedido, { modo: 'semelhanca', limite: 3 });
    var aps = BC.acervo.parecidos(pedido, L().estado.aprendizados).slice(0, 2).filter(function (x) { return x.sim > 0.2; });
    this.escrever('⌕ consultando o acervo: ' + (achados.length ? achados.map(function (r) { return r.doc.caminho || r.doc.titulo; }).join(' · ') : 'nada parecido'), 'ia', true);
    this.escrever('📖 lendo APRENDIZADOS.md (' + L().estado.aprendizados.length + ' aprendizados)' + (aps.length ? ': "' + aps[0].item.texto + '"' : ''), 'ia');
    if (/\b(crie|cria|criar|gere|gera|gerar|escreva|escreve|monte|monta|faca|faz|transforme|resuma|resume)\b/.test(n)) {
      var eu = L().eu, slug = n.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 42) || 'resultado', ehHtml = /\b(pagina|site|landing|html)\b/.test(n), nomeArq = 'ia/' + slug + (ehHtml ? '.html' : '.md');
      var corpo = ehHtml
        ? '<!doctype html>\n<html lang="pt-BR">\n<head><meta charset="utf-8"><title>' + esc(pedido.slice(0, 60)) + '</title>\n<style>body{margin:0;font-family:system-ui,sans-serif;background:#060b16;color:#d7e4fb}header{padding:56px 32px;text-align:center;background:linear-gradient(135deg,#291c48,#12314a)}h1{font-size:36px;margin:0 0 10px;background:linear-gradient(90deg,#9160ec,#29ccec);-webkit-background-clip:text;color:transparent}p{color:#8799bc;max-width:560px;margin:0 auto 20px}a{display:inline-block;padding:12px 24px;border-radius:999px;background:#8670ff;color:#fff;text-decoration:none}section{padding:40px 32px;max-width:900px;margin:0 auto}</style></head>\n<body>\n<header><h1>' + esc(pedido.replace(/^.*?(pagina|site|landing)\s*(sobre|de|para|a partir de)?\s*/i, '').slice(0, 60) || 'Babel') + '</h1><p>Rascunho feito pelo agente ' + esc(ag.nome) + ' a partir do acervo. Edite o texto direto na prévia.</p><a href="#">Quero saber mais</a></header>\n<section><h2>O que a Babel faz</h2><p>Atende no WhatsApp 24h, agenda e lembra do retorno.</p></section>\n</body>\n</html>'
        : ['# ' + pedido, '', '> Rascunho criado por ' + ag.nome + ', agente de ' + L().nome(eu) + '. No protótipo o texto é simulado; no app, é o Claude Code que escreve aqui.', '',
          '## O que ' + ag.nome + ' consultou antes', ''].concat(
          achados.map(function (r) { return '- ' + (r.doc.caminho || r.doc.titulo); }),
          aps.map(function (x) { return '- aprendizado: ' + x.item.texto; }),
          ['', '## Próximo passo', '', '- Revise, ajuste e, se fizer sentido, leve para a reunião.']).join('\n');
      this.criar(nomeArq, corpo);
      var novo = L().arquivo(eu + '/' + nomeArq);
      this.cartao(esc(ag.nome) + ' deixou ' + (ehHtml ? 'a página' : 'o rascunho') + ' em <b>' + esc(nomeArq) + '</b>' + (ehHtml ? ' · abre já como site' : ''), null, novo ? '<button type="button" class="term-mini" data-term="abrir:' + novo.id + '">abrir</button>' : '');
      if (novo) BC.explorador.abrirArquivo(novo.id);
    } else {
      this.escrever('(simulação) No app de verdade, a resposta de ' + ag.nome + ' aparece aqui, já sabendo o que a equipe aprendeu.', 'dica');
    }
    this.escrever('Se aprender algo novo, registre:  coop aprendi "..."', 'dica');
  };

  /* ---------- comandos coop ---------- */

  Terminal.prototype.coop = function (a) {
    var e = L().estado, eu = L().eu, t = this, sub = a[0] || 'ajuda';
    function ok(r, texto) {
      if (r === 'cedo') t.escrever('Você já lembrou essa pessoa há menos de uma hora.', 'erro', true);
      else if (r) t.escrever(texto, 'saida', true);
      else t.escrever('Não deu: confira o estado.', 'erro', true);
    }
    function minhas() { return e.demandas.filter(function (d) { return d.para === eu && d.estado !== 'concluida' && d.estado !== 'cancelada'; }); }
    function rodando() { return L().rodando(eu)[0]; }

    if (sub === 'ajuda') {
      ['Pedidos em português: "cria uma campanha de 50 clientes para a Carla até 30/09" · "cria uma demanda para o Bruno: revisar a proposta"',
        '"manda um aviso para a TV: reunião às 16h" · "mostra o site babel-os.com na TV" · "projeta precos na TV" · "entra em clinicavida.com.br e preenche o cadastro"',
        'coop status · coop demandas · coop comecar 1 · pausar · retomar · coop pronta "o que aprendi"',
        'coop livres · coop pegar 1 · coop buscar "reembolso" · coop ler caminho · coop abrir caminho',
        'coop aprendi "..." · coop aprendizados [tema] · coop ideia "..." · coop mural "..." · coop momento (salva os últimos 5 min da sala)',
        'coop tv painel | reuniao | quadro | visita | site <url> · coop projetar nome · coop rolar + | - (rola o arquivo projetado)',
        'coop entrar <pessoa> (ver e mexer no terminal dela) · coop agentes · coop sonhar',
        'touch nota.md · echo "texto" > nota.md · cat arquivo · cd ~ (o computador inteiro, como no iTerm)'].forEach(function (l) { t.escrever(l, 'dica'); });
      return;
    }
    if (sub === 'tv') {
      var modo = a[1] || 'painel';
      if (modo === 'site') { ok(L().fazer('tvSite', a[2]), 'Site na TV: ' + a[2]); return; }
      if (modo === 'visita') { ok(L().fazer('visita', a[2] !== 'off'), 'Modo visita ' + (a[2] !== 'off' ? 'ligado' : 'desligado') + '.'); return; }
      ok(L().fazer('tvModo', modo), 'TV no modo ' + modo + '.');
      return;
    }
    if (sub === 'rolar') { ok(L().fazer('rolarProjecao', (a[1] || '+').indexOf('-') === 0 ? -0.25 : 0.25), 'Rolado na TV.'); return; }
    if (sub === 'entrar') {
      var alvoP = e.pessoas.filter(function (p) { return U.normalizar(p.nome) === U.normalizar(a[1] || '') || p.id === (a[1] || ''); })[0];
      if (!alvoP) { t.escrever('Diga quem: coop entrar carla', 'erro'); return; }
      BC.acoes['term-entrar']({ dataset: { id: alvoP.id } });
      return;
    }
    if (sub === 'agentes') {
      e.pessoas.forEach(function (p) { t.escrever(p.nome + ': ' + ((p.agentes || []).map(function (x) { return x.nome; }).join(', ') || 'nenhum')); });
      return;
    }
    if (sub === 'status') {
      var r = rodando();
      t.escrever(r ? 'Rodando: "' + r.titulo + '" · ' + U.relogio(L().tempo(r).trabalho) : 'Nenhuma demanda rodando agora.', 'saida', true);
      t.escrever('Para começar: ' + minhas().filter(function (d) { return d.estado === 'enviada'; }).length + ' · trabalho medido hoje: ' + U.duracao(L().trabalhoHoje(eu)));
      return;
    }
    if (sub === 'livres') {
      var lv = e.demandas.filter(function (d) { return d.estado === 'livre'; });
      lv.forEach(function (d, i) { t.escrever((i + 1) + '. ' + d.titulo + ' · pedida por ' + L().nome(d.de) + (d.estimativaMin ? ' · ~' + d.estimativaMin + ' min' : '')); });
      t.escrever(lv.length ? 'Para pegar: coop pegar 1' : 'Nenhuma tarefa livre agora.', 'dica');
      return;
    }
    if (sub === 'pegar') {
      var alvoL = e.demandas.filter(function (d) { return d.estado === 'livre'; })[(parseInt(a[1], 10) || 1) - 1];
      ok(alvoL && L().fazer('pegar', alvoL.id), alvoL ? 'É sua: "' + alvoL.titulo + '". O cronômetro começou.' : '');
      return;
    }
    if (sub === 'demandas') { minhas().forEach(function (d, i) { t.escrever((i + 1) + '. [' + d.estado + '] ' + d.titulo + ' · de ' + L().nome(d.de)); }); if (!minhas().length) t.escrever('Nenhuma demanda aberta para você.'); return; }
    if (sub === 'comecar' || sub === 'começar') { var d = minhas()[(parseInt(a[1], 10) || 1) - 1]; ok(d && L().fazer('comecar', d.id), d ? 'Cronômetro rodando: "' + d.titulo + '".' : ''); return; }
    if (sub === 'pausar') { var rd = rodando(); ok(rd && L().fazer('pausar', rd.id, a.slice(1).join(' ') || 'pausa'), 'Pausado.'); return; }
    if (sub === 'retomar') { var ps = minhas().filter(function (x) { return x.estado === 'pausada'; })[0]; ok(ps && L().fazer('retomar', ps.id), 'Retomado.'); return; }
    if (sub === 'pronta') {
      var alvo = rodando() || minhas().filter(function (x) { return x.estado === 'pausada'; })[0], aprendi = a.slice(1).join(' ');
      if (aprendi.length < 8) { t.escrever('Para concluir, escreva o que aprendeu: coop pronta "o que aprendi"', 'erro'); return; }
      var nov = alvo ? L().A.checarNovidade(aprendi) : null;
      ok(alvo && L().fazer('pronta', alvo.id, aprendi), alvo ? L().nome(alvo.de) + ' foi avisado(a). ' + (nov && nov.repetido ? 'Seu aprendizado já era conhecido: somou +1 em "' + nov.parecido.texto + '".' : 'Aprendizado novo registrado.') : '');
      return;
    }
    if (sub === 'buscar') {
      var q = a.slice(1).join(' ');
      var res = BC.acervo.buscar(e, q, { limite: 5 });
      if (!res.length) res = BC.acervo.buscar(e, q, { limite: 5, modo: 'semelhanca' });
      t.escrever(res.length + ' resultado(s) para "' + q + '" (busca sem LLM):', 'saida', true);
      res.forEach(function (x) { t.escrever('  ' + (x.doc.caminho || x.doc.titulo) + ' · ' + x.doc.tipo + ' · ' + x.trecho.replace(/<\/?mark>/g, '').replace(/&[a-z#0-9]+;/g, ' ').slice(0, 110)); });
      return;
    }
    if (sub === 'ler' || sub === 'abrir') {
      var arq = L().arquivo(a.slice(1).join(' ')) || e.arquivos.filter(function (x) { return x.caminho.indexOf(a.slice(1).join(' ')) !== -1; })[0];
      if (!arq) { t.escrever('Arquivo não encontrado.', 'erro'); return; }
      if (sub === 'abrir') { BC.explorador.abrirArquivo(arq.id); t.escrever('Aberto no editor: ' + arq.caminho, 'saida', true); return; }
      BC.acervo.textoDoArquivo(arq).split('\n').slice(0, 14).forEach(function (l) { t.escrever(l); });
      return;
    }
    if (sub === 'aprendi') {
      var texto = a.slice(1).join(' '), n = L().A.checarNovidade(texto);
      if (texto.length < 8) { t.escrever('Escreva uma frase: coop aprendi "..."', 'erro'); return; }
      ok(L().fazer('aprendizado', texto, 'terminal', true), n.repetido ? 'Isso a equipe já sabia: somou +1 em "' + n.parecido.texto + '".' : 'Aprendizado novo! A IA de todos vai ler isso.');
      return;
    }
    if (sub === 'aprendizados') {
      var tema = a.slice(1).join(' '), lista = tema ? BC.acervo.parecidos(tema, e.aprendizados).filter(function (x) { return x.sim > 0.15; }).map(function (x) { return x.item; }) : e.aprendizados;
      lista.slice(0, 8).forEach(function (ap) { t.escrever('• ' + ap.texto + ' (' + L().nome(ap.pessoa) + (ap.confirmacoes.length ? ', +' + ap.confirmacoes.length : '') + ')'); });
      if (!lista.length) t.escrever('Nada sobre isso ainda.');
      return;
    }
    if (sub === 'ideia') { ok(L().fazer('ideia', a.slice(1).join(' ')), 'Ideia registrada. Ela aparece na TV.'); return; }
    if (sub === 'mural') { ok(L().fazer('recado', a.slice(1).join(' ')), 'Recado no mural da TV.'); return; }
    if (sub === 'momento') { ok(L().fazer('guardarMomento'), 'Os últimos 5 minutos da sala foram guardados no acervo.'); return; }
    if (sub === 'sonhar') { ok(L().fazer('sonhar'), 'Sonho feito: veja em Inteligência → Sonho.'); return; }
    if (sub === 'projetar') { var pr = e.arquivos.filter(function (x) { return x.caminho.toLowerCase().indexOf((a[1] || '').toLowerCase()) !== -1; })[0]; ok(pr && L().fazer('projetar', pr.caminho), pr ? 'Projetando "' + pr.caminho + '". Role com coop rolar + ou PageDown.' : ''); return; }
    if (sub === 'aviso') { if (!L().eAdmin()) { t.escrever('Só a gestão manda aviso oficial. Use coop mural.', 'erro'); return; } ok(L().fazer('aviso', a.slice(1).join(' ')), 'Aviso na TV.'); return; }
    t.escrever('coop ' + sub + ': não conheço. Veja coop ajuda.', 'erro');
  };

  BC.Terminal = Terminal;
})(window.BC);
