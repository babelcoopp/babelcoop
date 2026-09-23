/* Babel Coop — protótipo · mapa mental = o MindForge (clone do MindMeister feito pelo Theus), dentro da Estação.
   O desenho do MindForge fica igual; só o fundo é da identidade do Babel Coop.
   Cada mapa é um arquivo .mapa da pessoa (formato do MindForge: { title, nodes[] }); a Estação grava,
   versiona e espelha na TV. O agente do terminal cria e mexe no mapa por conversa (BC.mapaAgente). */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc;
  var CORES = ['#31d5d3', '#2b8ef1', '#b26cff', '#ed46a7', '#ff715b', '#f0b53e', '#6bc86d', '#94a2a8'];
  var RAIZ = { x: 2000, y: 1500 }, PASSO_X = 245, PASSO_Y = 62;

  function L() { return BC.loja; }
  function clonar(o) { return JSON.parse(JSON.stringify(o)); }
  function no(id, pai, texto, extra) {
    return Object.assign({ id: id || U.id('n'), parent: pai, text: texto, x: RAIZ.x, y: RAIZ.y, color: CORES[0], shape: 'pill', size: pai ? 14 : 16, bold: !pai, collapsed: false, note: '' }, extra || {});
  }

  /* ---------- formato: aceita o formato antigo { raiz } e devolve o do MindForge { title, nodes } ---------- */

  function normalizar(dados) {
    if (dados && Array.isArray(dados.nodes)) { if (!dados.title) dados.title = (dados.nodes.filter(function (n) { return !n.parent; })[0] || {}).text || 'Sem título'; return dados; }
    var raiz = (dados && dados.raiz) || { id: 'r', texto: 'Ideia central', filhos: [] }, nodes = [];
    (function andar(n, pai, i) {
      nodes.push(no(n.id, pai, n.texto || n.text || 'Tópico', { color: pai ? CORES[i % CORES.length] : '#2b8ef1' }));
      (n.filhos || []).forEach(function (f, j) { andar(f, n.id || nodes[nodes.length - 1].id, pai ? i : j); });
    })(raiz, null, 0);
    return arrumar({ title: raiz.texto, nodes: nodes });
  }

  /* arruma a árvore: filhos ao lado do pai, centrados, sem se sobrepor */
  function arrumar(estado) {
    var filhos = function (id) { return estado.nodes.filter(function (n) { return n.parent === id; }); };
    var altura = function (n) { var f = filhos(n.id); return f.length ? f.reduce(function (s, x) { return s + altura(x); }, 0) : 1; };
    var raiz = estado.nodes.filter(function (n) { return !n.parent; })[0];
    if (!raiz) return estado;
    raiz.x = RAIZ.x; raiz.y = RAIZ.y;
    (function colocar(pai) {
      var f = filhos(pai.id), total = f.reduce(function (s, x) { return s + altura(x); }, 0), cursor = pai.y - (total * PASSO_Y) / 2;
      f.forEach(function (n) { var h = altura(n) * PASSO_Y; n.x = pai.x + PASSO_X; n.y = cursor + h / 2; cursor += h; colocar(n); });
    })(raiz);
    return estado;
  }

  function iniciais(nome) { return String(nome || '').split(/\s+/).map(function (p) { return p[0] || ''; }).slice(0, 2).join('').toUpperCase(); }

  /* ---------- o componente: um iframe com o MindForge, ligado por postMessage ---------- */

  function MapaMental(el, dados, opcoes) {
    var eu = this;
    this.el = el;
    this.op = opcoes || {};
    this.estado = normalizar(clonar(dados));
    this.ultimo = JSON.stringify(this.estado);
    this.pronto = false;
    el.classList.add('mm');
    el.innerHTML = '<iframe class="mm-frame" src="mindforge/index.html?embutido=1" title="Mapa mental"></iframe>';
    this.frame = el.querySelector('iframe');
    this.ouvinte = function (ev) {
      if (!eu.frame || ev.source !== eu.frame.contentWindow) return;
      var m = ev.data || {};
      if (m.tipo === 'babel-mapa-pronto') {
        eu.pronto = true;
        eu.enviar({ op: 'carregar', estado: eu.estado, ajustar: true });
        if (!eu.op.editavel) eu.enviar({ op: 'somente-ver', ligado: true });
        if (eu.op.apresentar) eu.enviar({ op: 'apresentar', ligado: true });
        var p = L() && L().pessoa && L().pessoa(L().eu);
        if (p) eu.enviar({ op: 'avatar', iniciais: iniciais(p.nome), nome: p.nome });
      }
      if (m.tipo === 'babel-mapa-mudou' && eu.op.editavel && m.estado) {
        var json = JSON.stringify(m.estado);
        if (json === eu.ultimo) return;
        eu.ultimo = json;
        eu.estado = m.estado;
        if (eu.op.aoMudar) eu.op.aoMudar(clonar(m.estado));
      }
    };
    window.addEventListener('message', this.ouvinte);
  }

  MapaMental.prototype.enviar = function (m) { m.tipo = 'babel-mapa'; try { this.frame.contentWindow.postMessage(m, '*'); } catch (e) { /* iframe ainda não carregou */ } };

  /* recebe dados novos (de outra pessoa ou do agente) sem atropelar quem está editando */
  MapaMental.prototype.atualizar = function (dados, extra) {
    var e = normalizar(clonar(dados)), json = JSON.stringify(e);
    if (json === this.ultimo) return;
    this.ultimo = json;
    this.estado = e;
    if (this.pronto) this.enviar(Object.assign({ op: 'carregar', estado: e }, extra || {}));
  };

  MapaMental.prototype.destruir = function () { window.removeEventListener('message', this.ouvinte); this.frame = null; this.el.innerHTML = ''; };

  BC.MapaMental = MapaMental;
  BC.MapaMental.normalizar = normalizar;
  BC.MapaMental.novo = function (titulo) { return { title: titulo || 'Ideia central', nodes: [no('root', null, titulo || 'Ideia central', { color: '#2b8ef1' })] }; };

  /* ---------- o agente do terminal mexe no mapa por conversa ---------- */

  function itensDe(texto) {
    return texto.split(/\s*(?:,|;|\be\b|\/)\s*/).map(function (s) { return s.replace(/^["'“”]+|["'“”.]+$/g, '').trim(); }).filter(Boolean);
  }
  function achar(estado, texto) {
    var alvo = U.normalizar(texto || '');
    if (!alvo) return null;
    var exato = estado.nodes.filter(function (n) { return U.normalizar(n.text) === alvo; })[0];
    return exato || estado.nodes.filter(function (n) { return U.normalizar(n.text).indexOf(alvo) !== -1 || alvo.indexOf(U.normalizar(n.text)) !== -1; })[0] || null;
  }
  function adicionar(estado, pai, textos) {
    var criados = [];
    textos.forEach(function (t) {
      var irmaos = estado.nodes.filter(function (n) { return n.parent === pai.id; }).length;
      var n = no(null, pai.id, t, { x: pai.x + 235, y: pai.y + (irmaos - 0.5) * PASSO_Y, color: pai.parent ? pai.color : CORES[irmaos % CORES.length] });
      estado.nodes.push(n);
      criados.push(n);
    });
    return criados;
  }
  function apagar(estado, alvo) {
    var mortos = {}; mortos[alvo.id] = true;
    var mudou = true;
    while (mudou) { mudou = false; estado.nodes.forEach(function (n) { if (mortos[n.parent] && !mortos[n.id]) { mortos[n.id] = true; mudou = true; } }); }
    estado.nodes = estado.nodes.filter(function (n) { return !mortos[n.id]; });
    return Object.keys(mortos).length;
  }

  BC.mapaAgente = {
    abaAtiva: function () {
      var t = BC.estacao && BC.estacao.abaAtual && BC.estacao.abaAtual();
      var a = t && t.tipo === 'arquivo' && L().arquivo(t.ref);
      return a && a.tipo === 'mapa' ? a : null;
    },
    /* o pedido tem cara de mapa? (para o terminal decidir) */
    entende: function (n) {
      if (/\bmapa\b/.test(n) && /\b(cria|criar|crie|monta|montar|monte|faz|faca|gera|gere|abre|abra|novo)\b/.test(n)) return true;
      return !!BC.mapaAgente.abaAtiva() && /\b(adiciona|adicione|coloca|coloque|poe|inclui|inclua|expande|expanda|desenvolve|desenvolva|detalha|detalhe|apaga|apague|remove|remova|tira|tire|renomeia|renomeie|galho|galhos|topico|topicos|ramo)\b/.test(n);
    },
    pedido: function (pedido, ag, term) {
      var n = U.normalizar(pedido), eu = L().eu, aberto = BC.mapaAgente.abaAtiva(), estado, salvar, m;
      if (!/\bmapa\b/.test(n) && !aberto) return false;

      /* 1. criar um mapa novo */
      if (/\bmapa\b/.test(n) && /\b(cria|criar|crie|monta|montar|monte|faz|faca|gera|gere|novo)\b/.test(n)) {
        var tema = (pedido.match(/\b(?:sobre|de|do|da|para|pra)\s+(.+?)(?:\s+(?:com|contendo|tendo)\b|\s*:|$)/i) || [])[1] || 'Ideia central';
        tema = tema.replace(/\b(os |as |o |a )?galhos?\b.*$/i, '').replace(/[.:]+$/, '').trim() || 'Ideia central';
        var listaTxt = (pedido.match(/(?:\bcom\b|\bcontendo\b|\btendo\b|:)\s*(?:os |as )?(?:galhos?|topicos?|tópicos?|ramos?|itens?)?\s*:?\s*(.+)$/i) || [])[1] || '';
        var galhos = itensDe(listaTxt);
        if (!galhos.length) galhos = ['O que é', 'Para quem', 'Como fazer', 'Próximos passos'];
        estado = BC.MapaMental.novo(tema.charAt(0).toUpperCase() + tema.slice(1));
        adicionar(estado, estado.nodes[0], galhos);
        arrumar(estado);
        var nomeArq = 'mapas/' + tema.replace(/[^\wÀ-ÿ ]+/g, '').trim().slice(0, 40) + '.mapa';
        L().fazer('criarArquivo', eu + '/' + nomeArq, 'mapa', JSON.stringify(estado));
        if (BC.estacao && BC.estacao.ui) BC.estacao.ui.abertas[eu + '/mapas'] = true;
        term.escrever('Criado ~/BabelCoop/' + nomeArq + ': já aparece no explorador de todos e entrou no acervo.', 'saida', true);
        var novo = L().arquivo(eu + '/' + nomeArq);
        term.cartao(esc(ag.nome) + ' criou o mapa <b>' + esc(estado.title) + '</b> com ' + galhos.length + ' galhos: ' + esc(galhos.join(' · ')) + '. Continue falando: "adiciona X em ' + esc(galhos[0]) + '", "expande ' + esc(galhos[1] || galhos[0]) + '", "apaga …".', null, novo ? '<button type="button" class="term-mini" data-term="abrir:' + novo.id + '">abrir</button>' : '');
        if (novo) BC.explorador.abrirArquivo(novo.id);
        return;
      }

      if (!aberto) { term.escrever('Nenhum mapa aberto. Diga "cria um mapa sobre X com A, B e C" ou abra um .mapa.', 'dica'); return; }
      estado = normalizar(JSON.parse(BC.editor.conteudo(aberto) || '{}'));
      salvar = function (msg, extra) {
        var comp = BC.editor && BC.editor.componente && BC.editor.componente(aberto.id);
        if (comp && comp.mapa) comp.mapa.atualizar(estado, extra || {}); /* primeiro a tela (com a seleção), depois o arquivo */
        L().fazer('salvarArquivo', aberto.id, JSON.stringify(estado));
        term.cartao(esc(ag.nome) + ' ' + msg + ' em <b>' + esc(estado.title) + '</b>.', null, '');
      };
      var raiz = estado.nodes.filter(function (x) { return !x.parent; })[0];

      /* 2. apagar */
      if ((m = pedido.match(/\b(?:apaga|apague|remove|remova|tira|tire)\s+(?:o |a |os |as )?(?:galho |tópico |topico |ramo )?(.+?)(?:\s+do mapa)?\s*[.!]?$/i))) {
        var alvoA = achar(estado, m[1]);
        if (!alvoA || !alvoA.parent) return false; /* não é do mapa: o terminal segue com os outros tratadores */
        var q = apagar(estado, alvoA);
        salvar('apagou "' + esc(alvoA.text) + '" (' + q + ' tópico' + (q > 1 ? 's' : '') + ')');
        return;
      }
      /* 3. renomear */
      if ((m = pedido.match(/\b(?:renomeia|renomeie|troca|troque|muda|mude)\s+(?:o |a )?(?:galho |tópico |topico |nome de )?(.+?)\s+(?:para|por)\s+(.+?)\s*[.!]?$/i))) {
        var alvoR = achar(estado, m[1]);
        if (!alvoR) return false;
        var antes = alvoR.text; alvoR.text = m[2].replace(/^["“]|["”]$/g, '');
        if (!alvoR.parent) estado.title = alvoR.text;
        salvar('renomeou "' + esc(antes) + '" para "' + esc(alvoR.text) + '"', { selecionar: alvoR.id });
        return;
      }
      /* 4. expandir um galho (no app real, o Claude Code do agente expande com o acervo) */
      if ((m = pedido.match(/\b(?:expande|expanda|desenvolve|desenvolva|detalha|detalhe)\s+(?:o |a )?(?:galho |tópico |topico |ramo )?(.+?)\s*[.!]?$/i))) {
        var alvoE = achar(estado, m[1]) || raiz;
        var subs = ['O que é', 'Por que importa', 'Como fazer', 'Quem cuida'].map(function (s) { return s; });
        var feitos = adicionar(estado, alvoE, subs);
        salvar('expandiu "' + esc(alvoE.text) + '" com ' + feitos.length + ' galhos (simulado; no app o agente consulta o acervo antes)', { selecionar: feitos[0].id });
        return;
      }
      /* 5. adicionar galhos em algum lugar */
      if ((m = pedido.match(/\b(?:adiciona|adicione|coloca|coloque|põe|poe|inclui|inclua|cria|crie)\s+(?:os |as |o |a |um |uma )?(?:galhos? |tópicos? |topicos? |ramos? |itens? )?(.+?)(?:\s+(?:em|no|na|dentro de|embaixo de|abaixo de|sob)\s+(?:o |a |galho |tópico |topico )?(.+?))?\s*[.!]?$/i))) {
        var pai = m[2] ? achar(estado, m[2]) : raiz;
        if (!pai) { term.escrever('Não achei "' + esc(m[2]) + '" no mapa; coloquei na raiz.', 'dica'); pai = raiz; }
        var textos = itensDe(m[1]);
        if (!textos.length) { term.escrever('O que eu adiciono? Ex.: "adiciona Instagram e TikTok em Canais".', 'dica'); return; }
        var novos = adicionar(estado, pai, textos);
        salvar('adicionou ' + esc(textos.join(', ')) + ' em "' + esc(pai.text) + '"', { selecionar: novos[0].id });
        return;
      }
      term.escrever('Entendo: "cria um mapa sobre X com A, B e C", "adiciona X em Y", "expande Y", "renomeia Y para Z", "apaga Y".', 'dica');
    }
  };
})(window.BC);
