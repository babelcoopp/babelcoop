/* babel-coop · o painel da direita real: a presença + o terminal de verdade, em abas (uma aba por agente)
   Substitui BC.Terminal (prototipo/terminal.js) quando window.COOP_REAL.terminal é true; sem isso fica a classe simulada.
   Contratos: .deus/terminal-ao-vivo/PROTOCOLO.md §3–§7 (mensagens term-* e agente-*) · docs/design/TERMINAL_2030.md §2–§8
   (visual e a tabela evento → efeito → som) · docs/design/PLANO.md §1, propriedades 1 e 6, fase F1.

   Cada aba = um agente da pessoa (L.estado pessoa.agentes) = uma sessão do pty no servidor desta Estação (term-abrir com id = id do agente).
   Duas faces por aba, alternadas por "Presença | Terminal" e por Ctrl+J (dentro do terminal, Cmd+J ou Ctrl+Shift+J: Ctrl+J é do shell):
     Presença: o mostrador (BC.organismo.Presenca com o anel gerado na Replicate) + "→ alvo · agente · estado", os blocos tipados
               (agente-bloco), o plano como checklist (agente-plano: pulso da presença até cada item feito, faíscas, 'tique'; tudo feito = rito, 'duas'),
               a espera com Permitir/Negar (agente-espera → agente-ok), o campo ❯ endereçado (agente-pedido) e até 3 receitas por objeto aberto no meio;
               na primeira vez que o agente acorda, o b que se desenha (b-entrada.mp4) dentro do mostrador.
     Terminal: xterm.js 6 com o visual do Babel Terminal (fundo #060b16, degradê roxo → azul → ciano no texto de cor padrão, b em neon).
   Organismo: BC.organismo.vincular por sessão. Nada pulsa sem mensagem real; term.write nunca espera efeito.
   Teclas: dentro do xterm tudo vai para o shell (Ctrl+B/K/L…); só Cmd+… e Ctrl+` sobem para o app.
   API para testes e para as outras peças: BC.terminalReal (fim do arquivo). Eventos no document: 'babel-coop:agente-ok', 'babel-coop:plano-concluido'.
*/
(function () {
  'use strict';
  var BC = window.BC = window.BC || {};
  var REAL = window.COOP_REAL || {};
  if (!REAL.terminal) return; /* servidor sem node-pty: fica o terminal simulado do protótipo */
  if (typeof window.Terminal !== 'function' || !window.FitAddon || !BC.real || !BC.organismo || !BC.loja) {
    console.warn('[terminal-real] faltou xterm, ponte ou organismo: fica o terminal simulado');
    return;
  }
  var O = BC.organismo;
  function L() { return BC.loja; }
  function E() { return BC.estacao; }
  /* sempre pela ponte, na hora (os testes espiam BC.real.enviar) */
  function enviar(m) { BC.real.enviar(m); }

  /* ------------------------------------------------------------------ constantes */
  var ID_OK = /^[A-Za-z0-9_-]{1,48}$/;
  var FONTE = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  /* TERMINAL_2030 §2.4: nenhuma cor fora dos tokens */
  var TEMA = {
    background: '#060b16', foreground: '#c3cfe5', cursor: '#2ad5e5', cursorAccent: '#060b16', selectionBackground: 'rgba(163,118,233,.28)',
    black: '#0b1320', red: '#ff6b6b', green: '#7fd6a6', yellow: '#f0b35a', blue: '#7ba4f0', magenta: '#a376e9', cyan: '#2ad5e5', white: '#d7e4fb',
    brightBlack: '#6c7b96', brightRed: '#ff8f8f', brightGreen: '#a3e6c1', brightYellow: '#f5c76a', brightBlue: '#9dbcf5', brightMagenta: '#c7a2ff', brightCyan: '#6fe3ff', brightWhite: '#fff8e7'
  };
  /* modo Vibe (claro, casca-2030.css §20): papel Latte, texto escuro; cada cor ANSI com contraste ≥ 4,5:1 sobre #fff8e7.
     "white" vira grafite: programa que pinta de branco espera fundo escuro. minimumContrastRatio segura o truecolor dos programas. */
  var TEMA_VIBE = {
    background: '#fff8e7', foreground: '#1c2331', cursor: '#08707f', cursorAccent: '#fff8e7', selectionBackground: 'rgba(109,63,184,.18)',
    black: '#2a2f3a', red: '#b3261e', green: '#17774b', yellow: '#8a5f00', blue: '#2f5bb7', magenta: '#6d3fb8', cyan: '#08707f', white: '#4a5568',
    brightBlack: '#5d6675', brightRed: '#c8323a', brightGreen: '#1a7f50', brightYellow: '#9a5b00', brightBlue: '#3a63c2', brightMagenta: '#8a3fb8', brightCyan: '#0a7383', brightWhite: '#060b16'
  };
  function vibe() { var h = document.documentElement; return h.getAttribute('data-tema-estacao') === 'claro' && h.getAttribute('data-vista') === 'estacao'; }
  function temaAgora() { return vibe() ? TEMA_VIBE : TEMA; }
  var ERRO_PROVAVEL = /error|erro|failed|falhou|✖|not found|Traceback/i;
  var TIPOS = ['nota', 'pedido', 'consulta', 'plano', 'acao', 'resultado', 'espera', 'falha'];
  var ROTULO = { nota: '', pedido: 'pedido', consulta: 'consulta', plano: 'plano', acao: 'ação', resultado: 'resultado', espera: 'espera', falha: 'falha' };
  var CHAVE = { neon: 'babel-coop:neon', face: 'babel-coop:face:', so: 'babel-coop:so-terminal:', b: 'babel-coop:b-entrada:', aba: 'babel-coop:aba-agente' };
  var MAX_BLOCOS = 200;
  CHAVE.provedor = 'babel-coop:provedor:';
  CHAVE.oficina = 'babel-coop:oficina:';
  var SVG_SOM = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6h2.5l3.5-3v10l-3.5-3H2.5z"/><path class="tr-onda" d="M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.8a6 6 0 0 1 0 8.4"/></svg>';

  /* ------------------------------------------------------------------ utilidades */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function guardar(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento: vale nesta página */ } }
  function normalizar(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function hora(ms) { return O.hora(ms || Date.now()); }
  function inteiro(n) { return Number.isFinite(+n) ? new Intl.NumberFormat('pt-BR').format(Math.max(0, Math.round(+n))) : '—'; }
  function duracaoJanela(min) { return min == null ? 'Janela' : min < 60 ? 'Janela de ' + min + ' min' : min % 60 ? 'Janela de ' + Math.floor(min / 60) + ' h ' + min % 60 + ' min' : 'Janela de ' + (min / 60) + ' h'; }
  function faltaPara(ts) { if (!Number.isFinite(+ts)) return 'renovação não informada'; var ms = Math.max(0, +ts * 1000 - Date.now()); return ms ? 'renova em ' + O.duracaoTexto(ms) : 'renovação prevista agora'; }
  function dinheiroUSD(micros) { return Number.isFinite(+micros) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(+micros / 1000000) : '—'; }
  function usoCodexHTML(uso) {
    uso = uso || {};
    var r = uso.rateLimits || {}, janelas = [r.primary, r.secondary].filter(Boolean), h = '<div class="tr-uso-cab"><div><b>Uso do Codex</b><small>Dados da conta conectada</small></div>' + (uso.atualizadoEm ? '<time>atualizado ' + esc(hora(uso.atualizadoEm)) + '</time>' : '') + '</div>';
    if (janelas.length) {
      h += '<div class="tr-uso-grupo"><span class="tr-uso-titulo">JANELAS DE USO</span>';
      janelas.forEach(function (j) { var pct = Math.max(0, Math.min(100, +j.usedPercent || 0)); h += '<div class="tr-uso-janela"><div><span>' + esc(duracaoJanela(j.windowDurationMins)) + '</span><b>' + pct + '% usado</b></div><div class="tr-uso-trilho" role="progressbar" aria-label="' + esc(duracaoJanela(j.windowDurationMins)) + ' consumida" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="--uso:' + pct + '%"></i></div><small>' + esc(faltaPara(j.resetsAt)) + '</small></div>'; });
      h += '</div>';
    } else h += '<div class="tr-uso-vazio">A janela de uso ainda não chegou do Codex.</div>';
    var tu = uso.tokenUsage || {}, total = tu.total || {}, last = tu.last || {}, ctx = +tu.modelContextWindow || 0;
    if (total.totalTokens != null || uso.threadUsage) {
      h += '<div class="tr-uso-grupo"><span class="tr-uso-titulo">ESTA CONVERSA</span>';
      if (total.totalTokens != null) h += '<div class="tr-uso-linha"><span>Tokens acumulados</span><b>' + inteiro(total.totalTokens) + '</b></div><div class="tr-uso-linha"><span>Entrada · saída</span><b>' + inteiro(total.inputTokens) + ' · ' + inteiro(total.outputTokens) + '</b></div><div class="tr-uso-linha"><span>Cache · raciocínio</span><b>' + inteiro(total.cachedInputTokens) + ' · ' + inteiro(total.reasoningOutputTokens) + '</b></div>';
      if (ctx && last.totalTokens != null) { var cp = Math.max(0, Math.min(100, Math.round(+last.totalTokens / ctx * 100))); h += '<div class="tr-uso-linha"><span>Contexto do último turno</span><b>' + inteiro(last.totalTokens) + ' / ' + inteiro(ctx) + ' · ' + cp + '%</b></div>'; }
      if (uso.threadUsage) {
        if (uso.threadUsage.estimatedUsageUsdMicros != null) h += '<div class="tr-uso-linha"><span>Custo estimado desta conversa</span><b>' + esc(dinheiroUSD(uso.threadUsage.estimatedUsageUsdMicros)) + '</b></div>';
        (uso.threadUsage.groups || []).forEach(function (g) { if (g.model) h += '<div class="tr-uso-modelo">' + esc(g.model) + (g.reasoningEffort ? ' · ' + esc(g.reasoningEffort) : '') + '</div>'; });
      }
      h += '</div>';
    }
    return h;
  }
  function sid(agId) { var s = String(agId || ''); return ID_OK.test(s) ? s : (s.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 48) || 'agente'); }
  function temMidia(n) { return !Array.isArray(REAL.midia) || REAL.midia.indexOf(n) >= 0; }
  function neonLigado() { return ler(CHAVE.neon) !== '0'; }
  function corDe(id) { var p = L().pessoa(id); return (p && p.cor) || '#8670ff'; }
  function primeiroNome(id) { return String(L().nome(id) || id || '').split(' ')[0]; }
  function iniciais(nome) { return String(nome || '?').trim().slice(0, 2).toUpperCase(); }
  function visivel(el) { if (!el || !el.isConnected) return false; var r = el.getBoundingClientRect(); if (!r.width || !r.height) return false; return getComputedStyle(el).visibility !== 'hidden'; }
  /* texto de um trecho de saída sem sequências de controle (só para procurar palavras) */
  function semControle(s) { return String(s || '').replace(/\x1b\][^\x07\x1b]*(\x07|\x1b\\)/g, '').replace(/\x1b\[[0-9;?]*C/g, ' ').replace(/\x1b\[[0-9;?]*[ -\/]*[@-~]/g, '').replace(/\x1b[()][A-Za-z0-9]/g, ''); }
  function lerBuffer(term, n) {
    /* até a última linha com conteúdo (programas de tela cheia, como o claude, desenham abaixo do cursor); as vazias de baixo não contam */
    var b = term.buffer.active, fim = b.length, cursor = b.baseY + b.cursorY + 1, fora = [], ini;
    while (fim > cursor) { var u = b.getLine(fim - 1); if (u && u.translateToString(true).trim()) break; fim--; }
    ini = Math.max(0, fim - (n || fim));
    /* linha quebrada pela largura do terminal volta a ser uma linha só */
    for (var i = ini; i < fim; i++) { var l = b.getLine(i), t = l ? l.translateToString(true) : ''; if (l && l.isWrapped && fora.length) fora[fora.length - 1] += t; else fora.push(t); }
    return fora.join('\n').replace(/\s+$/, '');
  }
  /* aspas simples para o zsh/bash (o nome do agente e o pedido viram argumentos do claude) */
  function aspas(s) { return "'" + String(s).replace(/'/g, "'\\''") + "'"; }

  /* id estável para agente novo: a ação do protótipo gera id aleatório a cada recarga (o diário reaplica a ação), e a sessão do pty
     precisa do mesmo id sempre. Quem cria pelo painel manda dados.id; a ação passa a respeitar (o diário guarda o id junto). */
  (function () {
    var A = L().A, original = A && A.novoAgente;
    if (!original || original.__comId) return;
    A.novoAgente = function (quem, dados) {
      var p = L().pessoa(quem);
      if (dados && dados.id && p && (p.agentes || []).some(function (a) { return a.id === dados.id; })) return; /* já existe: nada a fazer */
      var r = original.apply(this, arguments);
      if (r && dados && typeof dados.id === 'string' && ID_OK.test(dados.id) && p && p.agentes && p.agentes.length) p.agentes[p.agentes.length - 1].id = dados.id;
      return r;
    };
    A.novoAgente.__comId = true;
  })();

  /* o objeto aberto no meio (é para ele que o campo ❯ aponta e dele vêm as receitas) */
  var NOMES_ABA = { dia: 'Meu dia', chat: 'Chat', demandas: 'Demandas', explorador: 'Criar', equipe: 'Equipe', acervo: 'Acervo', terminais: 'Terminais', projetos: 'Projetos', loja: 'Loja', oficina: 'Oficina' };
  function objetoAberto() {
    var e = E();
    if (!e || !e.abaAtual) return null;
    var tab = e.abaAtual();
    if (!tab || tab.tipo === 'vazio') return null;
    if (tab.tipo === 'arquivo') {
      var a = L().arquivo(tab.ref);
      if (a) return { chave: 'arq:' + a.id, tipo: 'arquivo', ext: (a.caminho.split('.').pop() || '').toLowerCase(), nome: a.caminho.split('/').pop(), caminho: a.caminho, dono: a.dono };
    }
    if (tab.tipo === 'demanda') { var d = L().demanda(tab.ref); if (d) return { chave: 'dem:' + d.id, tipo: 'demanda', nome: d.titulo }; }
    if (tab.tipo === 'perfil') return { chave: 'perfil:' + tab.ref, tipo: 'perfil', nome: 'perfil de ' + L().nome(tab.ref) };
    return { chave: 'tab:' + tab.id, tipo: tab.tipo, nome: tab.titulo || NOMES_ABA[tab.tipo] || tab.tipo };
  }
  /* até 3 receitas por objeto (PLANO F1): chips que preenchem o campo, nunca mandam sozinhos */
  function receitasDe(obj) {
    if (!obj) return [['Procurar no acervo', 'Procure no acervo da equipe o que já sabemos sobre '], ['Me ajude com um erro', 'Rodei um comando e deu erro. Me explique o que aconteceu e como corrigir: '], ['Navegar por mim', 'Entre no site  e me traga o que importa (use o navegador do babel-coop)']];
    var c = obj.caminho || obj.nome;
    if (obj.tipo === 'arquivo') {
      if (/^(md|txt|markdown)$/.test(obj.ext)) return [['Explicar este arquivo', 'Explique ' + c + ' em português simples.'], ['Resumir em 5 pontos', 'Resuma ' + c + ' em 5 pontos, com o próximo passo.'], ['Criar página desta nota', 'Crie uma página HTML simples a partir de ' + c + ', no visual da Babel.']];
      if (/^html?$/.test(obj.ext)) return [['Melhorar o visual', 'Melhore o visual de ' + c + ' sem mudar o conteúdo.'], ['Revisar o texto', 'Revise a copy de ' + c + ' e aponte o que está fraco.'], ['Mostrar na TV', 'Mostre ' + c + ' na TV.']];
      if (/^(csv|tsv|xlsx?)$/.test(obj.ext)) return [['Resumir a planilha', 'Resuma a planilha ' + c + ': totais, destaques e o que chama atenção.'], ['Achar erros', 'Procure linhas erradas ou duplicadas em ' + c + '.'], ['Gerar um gráfico', 'Gere um gráfico simples a partir de ' + c + '.']];
      if (/^(js|ts|mjs|cjs|jsx|tsx|json|css|sh|sql|go|rs|rb|php|java|kt|swift)$/.test(obj.ext)) return [['Explicar este código', 'Explique o que ' + c + ' faz, em português simples.'], ['Achar bugs', 'Procure bugs em ' + c + ' e proponha a correção.'], ['Escrever testes', 'Escreva testes para ' + c + '.']];
      return [['Explicar este arquivo', 'Explique ' + c + '.'], ['Resumir', 'Resuma ' + c + '.'], ['Procurar no acervo', 'Procure no acervo o que se liga a ' + c + '.']];
    }
    if (obj.tipo === 'demanda') return [['Planejar a demanda', 'Monte um plano curto para a demanda "' + obj.nome + '".'], ['Rascunhar a entrega', 'Faça um primeiro rascunho da entrega da demanda "' + obj.nome + '".'], ['O que falta', 'O que falta para fechar a demanda "' + obj.nome + '"?']];
    return [['Procurar no acervo', 'Procure no acervo da equipe o que já sabemos sobre '], ['Resumir o dia', 'Resuma o que a equipe fez hoje em 5 pontos.'], ['Me ajude com um erro', 'Rodei um comando e deu erro. Me explique o que aconteceu e como corrigir: ']];
  }

  /* xterm: só Cmd+… e Ctrl+` são do app; o resto (Ctrl+B, Ctrl+K, Ctrl+L, Ctrl+J…) é do shell */
  function teclaDoApp(ev) { return !!(ev.metaKey || (ev.ctrlKey && (ev.code === 'Backquote' || ev.key === '`'))); }

  var painelAtual = null;

  /* ================================================================== o painel */
  function Painel(raiz) {
    this.raiz = raiz;
    this.eu = null; this.nomeEu = ''; this.pasta = null; this.pronto = false;
    this.sessoes = {}; this.ordem = []; this.aba = null; this.abaDesejada = null;
    this.controles = []; this.assinatura = ''; this.criouPadrao = false; this.viuAgente = false;
    this.dims = { cols: 100, rows: 30 }; this.usoAberto = false;
    this.relogio = 0; this.tAgente = 0; this.objetoChave = null; this.objeto = null;
    this.med = { termAberto: 0, saidas: 0, bytes: 0, pulsosPlano: 0, ritos: 0, bEntrada: 0, iniciar: 0, pedidos: 0, oks: 0, confianca: 0, blocos: 0 };
    painelAtual = this;
    this.montar();
    var eu = this;
    BC.real.ouvir(function (m) { eu.receber(m); });
  }
  var P = Painel.prototype;

  P.montar = function () {
    this.raiz.innerHTML = '<div class="tr" data-pronto="nao">' +
      '<div class="tr-topo term-topo"><div class="tr-abas term-abas" role="tablist" aria-label="Agentes"></div>' +
      '<button class="tr-mais term-mais" type="button" data-tr="nova" title="Novo agente (Ctrl+Shift+T)" aria-label="Novo agente">+</button></div>' +
      '<div class="tr-barra">' +
      '<div class="tr-sel" role="group" aria-label="Face do painel"><button type="button" data-tr="face" data-face="presenca" aria-pressed="true">Presença</button><button type="button" data-tr="face" data-face="terminal" aria-pressed="false">Terminal</button></div>' +
      '<span class="tr-kbd" title="Ctrl+J alterna as faces; dentro do terminal, Cmd+J ou Ctrl+Shift+J (Ctrl+J é do shell)">Ctrl J</span>' +
      '<div class="tr-acoes">' +
      '<button class="term-toggle" type="button" data-tr="codex" title="Criar uma Presença com Codex">Codex</button>' +
      '<button class="term-toggle" type="button" data-tr="entrar" title="Entrar no terminal de alguém (Ctrl+Shift+E)"><span class="tr-rot-entrar">Entrar em…</span></button>' +
      '<button class="term-toggle tr-uso-botao" type="button" data-tr="uso" aria-expanded="false" hidden title="Ver janelas de uso e contexto do Codex">Uso</button>' +
      '<button class="term-toggle" type="button" data-tr="neon" aria-pressed="true" title="O b em neon no canto do terminal">Neon</button>' +
      '<button class="term-toggle" type="button" data-tr="som" aria-pressed="true" title="Sons do organismo (nunca na TV)">' + SVG_SOM + 'Som</button>' +
      '<button class="tr-esconder" type="button" data-tr="esconder" title="Esconder (Ctrl + `)" aria-label="Esconder o painel">⟩</button>' +
      '</div></div>' +
      '<section class="tr-uso" hidden aria-label="Métricas de uso do Codex"></section>' +
      '<div class="tr-novo" hidden></div>' +
      '<div class="tr-sessoes"><div class="tr-espera-servidor">ligando ao servidor desta Estação…</div></div>' +
      '</div>';
    this.el = this.raiz.firstChild;
    this.abasEl = this.el.querySelector('.tr-abas');
    this.novoEl = this.el.querySelector('.tr-novo');
    this.usoEl = this.el.querySelector('.tr-uso');
    this.sessoesEl = this.el.querySelector('.tr-sessoes');
    this.esperaEl = this.el.querySelector('.tr-espera-servidor');
    var eu = this;
    this.el.addEventListener('click', function (ev) { eu.clique(ev); });
    this.el.addEventListener('dblclick', function (ev) { var n = ev.target.closest('.tr-aba-nome'); if (n) eu.renomearForm(n.closest('.tr-aba').dataset.id); });
    this.el.addEventListener('keydown', function (ev) { eu.teclaPainel(ev); });
    this.el.addEventListener('input', function (ev) { if (ev.target.classList.contains('tr-entrada')) eu.mencionar(); });
    this.el.addEventListener('submit', function (ev) { var f = ev.target.closest('.tr-campo'); if (!f) return; ev.preventDefault(); var s = eu.sessoes[f.closest('.tr-sessao').dataset.id]; if (s) s.enviarPedido(); });
    /* Ctrl+J (fora do terminal), Cmd+J e Ctrl+Shift+J (em qualquer lugar) alternam Presença | Terminal */
    document.addEventListener('keydown', function (ev) {
      if (ev.altKey || !(ev.key === 'j' || ev.key === 'J' || ev.code === 'KeyJ')) return;
      var vista = document.getElementById('vista-estacao');
      if (vista && vista.hidden) return;
      var noTerminal = !!(ev.target && ev.target.closest && ev.target.closest('.tr-xterm'));
      if (ev.metaKey || (ev.ctrlKey && ev.shiftKey) || (ev.ctrlKey && !noTerminal)) {
        ev.preventDefault(); ev.stopPropagation();
        eu.alternarFace(true);
      }
    }, true);
    window.addEventListener('resize', function () { var s = eu.ativa(); if (s) s.degradeVars(); });
    if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', function () { eu.remedir(); });
    this.pintarBarra();
  };

  /* ---------- quem sou e quais agentes ---------- */
  P.agentes = function () { var p = this.eu && L().pessoa(this.eu); return (p && p.agentes) || []; };
  function assinaturaDe(ags) { return ags.map(function (a) { return a.id + ':' + a.nome + ':' + (a.oQueFaz || ''); }).join('|'); }
  P.ativa = function () { return this.aba ? this.sessoes[this.aba] || null : null; };
  P.servidorComAgentes = function () { var b = BC.real.bemvindo; return !!(b && b.agentes === true); };
  P.pedidoPeloServidor = function () { return this.servidorComAgentes() || this.viuAgente; };

  P.aoBemvindo = function (m) {
    /* tela de outro aparelho (celular, iPad, navegador pela rede): o terminal de verdade só existe na Estação desta máquina */
    if (m.terminalReal === false) { if (this.esperaEl) this.esperaEl.textContent = 'O terminal de verdade fica na Estação desta máquina. Daqui dá para ver a equipe e os terminais dela na parede.'; return; }
    this.eu = m.eu.id; this.nomeEu = m.eu.nome || m.eu.id; this.pronto = true;
    this.controles = Array.isArray(m.controles) ? m.controles : [];
    this.el.dataset.pronto = 'sim';
    if (this.esperaEl && this.esperaEl.parentNode) this.esperaEl.parentNode.removeChild(this.esperaEl);
    /* reconexão: a tela de cada sessão volta pelo term-aberto (o que saiu enquanto estava fora já está na tela do servidor) */
    var eu = this;
    Object.keys(this.sessoes).forEach(function (id) { var s = eu.sessoes[id]; s.aberta = false; s.esperandoTela = false; });
    if (!this.pasta) fetch('/api/eu').then(function (r) { return r.json(); }).then(function (i) { eu.pasta = i && i.pasta || null; Object.keys(eu.sessoes).forEach(function (id) { eu.sessoes[id].bocaVazia(); eu.sessoes[id].pintar(); }); }).catch(function () { /* fica o nome curto */ });
    this.sincronizar();
    this.mostrar();
  };

  P.pastaCurta = function () {
    var p = this.pasta || '';
    var m = /[\\/]BabelCoop[\\/]([^\\/]+)$/.exec(p);
    if (m) return '~/BabelCoop/' + m[1];
    if (p) return p.split(/[\\/]/).slice(-2).join('/');
    return '~/BabelCoop/' + (this.eu || '');
  };

  /* as abas acompanham os agentes da pessoa; sem nenhum, nasce o "Assistente" (uma vez) */
  P.sincronizar = function () {
    if (!this.pronto) return;
    var ags = this.agentes();
    if (!ags.length && !this.criouPadrao && L().pessoa(this.eu)) {
      this.criouPadrao = true;
      this.abaDesejada = 'assistente';
      L().fazer('novoAgente', { id: 'assistente', nome: 'Assistente', oQueFaz: 'Seu agente: pesquisa, escreve, organiza e mexe no babel-coop por você.', visivel: true });
      ags = this.agentes();
    }
    var eu = this, ids = ags.map(function (a) { return sid(a.id); });
    /* agente que sumiu da lista: sai a aba; a sessão do pty só fecha pelo × (a lista pode vir incompleta de outra janela) */
    Object.keys(this.sessoes).forEach(function (id) { if (ids.indexOf(id) < 0) { eu.sessoes[id].destruir(); delete eu.sessoes[id]; } });
    ags.forEach(function (a) { var id = sid(a.id), s = eu.sessoes[id]; if (!s) eu.sessoes[id] = new Sessao(eu, a); else s.atualizarAgente(a); });
    this.ordem = ids;
    this.assinatura = assinaturaDe(ags);
    var guardada = ler(CHAVE.aba);
    if (this.abaDesejada && ids.indexOf(this.abaDesejada) >= 0) { this.aba = this.abaDesejada; this.abaDesejada = null; }
    if (!this.aba || ids.indexOf(this.aba) < 0) this.aba = guardada && ids.indexOf(guardada) >= 0 ? guardada : ids[0] || null;
    this.renderAbas();
    this.ativar(this.aba, false);
    /* primeiro a aba ativa (mede o tamanho do corpo), depois as outras: term-abrir uma vez por sessão */
    var ativa = this.ativa();
    if (ativa && !ativa.aberta && !ativa.esperandoTela) ativa.abrir();
    ids.forEach(function (id) { var s = eu.sessoes[id]; if (s && !s.aberta && !s.esperandoTela) s.abrir(); });
  };

  P.renderAbas = function () {
    var eu = this;
    this.ordem.forEach(function (id) { var s = eu.sessoes[id]; if (s) eu.abasEl.appendChild(s.abaEl); });
    Array.prototype.slice.call(this.abasEl.children).forEach(function (el) { if (eu.ordem.indexOf(el.dataset.id) < 0) el.parentNode.removeChild(el); });
  };

  P.ativar = function (id, focar) {
    var s = this.sessoes[id];
    if (!s) return;
    this.aba = id;
    guardar(CHAVE.aba, id);
    var eu = this;
    Object.keys(this.sessoes).forEach(function (k) { var x = eu.sessoes[k], on = k === id; x.el.hidden = !on; x.abaEl.setAttribute('aria-selected', on ? 'true' : 'false'); x.abaEl.tabIndex = on ? 0 : -1; });
    s.mostrado();
    s.pintarObjeto(this.objeto);
    this.pintarBarra();
    if (focar) s.focar();
  };

  P.mostrar = function () { if (!this.pronto) return; this.renderAbas(); if (this.aba) this.ativar(this.aba, false); };

  P.pintarBarra = function () {
    var s = this.ativa(), face = s ? s.face : 'presenca';
    Array.prototype.forEach.call(this.el.querySelectorAll('[data-tr="face"]'), function (b) { b.setAttribute('aria-pressed', b.dataset.face === face ? 'true' : 'false'); });
    var neon = this.el.querySelector('[data-tr="neon"]'); if (neon) neon.setAttribute('aria-pressed', neonLigado() ? 'true' : 'false');
    var som = this.el.querySelector('[data-tr="som"]'); if (som) { var on = O.somLigado(); som.setAttribute('aria-pressed', on ? 'true' : 'false'); som.title = on ? 'Sons do organismo ligados (clique para desligar; nunca na TV)' : 'Sons desligados (clique para ligar)'; }
    var uso = this.el.querySelector('[data-tr="uso"]'); if (uso) { uso.hidden = !s || s.provedor !== 'codex'; uso.setAttribute('aria-expanded', this.usoAberto ? 'true' : 'false'); }
    this.pintarUso();
  };
  P.pintarUso = function () {
    if (!this.usoEl) return;
    var s = this.ativa(), visivel = this.usoAberto && s && s.provedor === 'codex';
    this.usoEl.hidden = !visivel;
    if (visivel) this.usoEl.innerHTML = usoCodexHTML(s.usoCodex);
  };

  P.face = function (f, id) { var s = id ? this.sessoes[id] : this.ativa(); if (!s) return; s.definirFace(f === 'terminal' ? 'terminal' : 'presenca'); if (s === this.ativa()) this.pintarBarra(); };
  P.alternarFace = function (focar) { var s = this.ativa(); if (!s) return; s.definirFace(s.face === 'presenca' ? 'terminal' : 'presenca'); this.pintarBarra(); if (focar) s.focar(); };

  P.dimensoes = function () {
    var s = this.ativa();
    if (s && s.xtermAberto) { var d = s.proporcao(); if (d) this.dims = d; }
    return this.dims;
  };

  P.remedir = function () {
    var eu = this;
    Object.keys(this.sessoes).forEach(function (id) {
      var s = eu.sessoes[id];
      if (!s.xtermAberto) return;
      /* a fonte chegou depois de o xterm medir: troca a família e volta, e ele mede de novo */
      s.term.options.fontFamily = FONTE + ', monospace';
      s.term.options.fontFamily = FONTE;
      s.ajustar();
    });
  };

  /* ---------- mensagens do servidor (e as simuladas pelos testes) ---------- */
  P.receber = function (m) {
    if (!m || typeof m.tipo !== 'string') return;
    if (m.tipo === 'bemvindo') { if (m.eu && m.eu.pronto) this.aoBemvindo(m); return; }
    if (!this.pronto) return;
    if (m.tipo === 'controles') { this.controles = Array.isArray(m.lista) ? m.lista : []; this.pintarSelos(); return; }
    if (m.tipo === 'erro') { var esperando = m.id ? this.sessoes[m.id] : this.sessaoEsperando(); if (esperando) { esperando.iniciandoAgente = false; esperando.pedidoPendente = null; if (esperando.esperandoTela) esperando.falhaAbrir(m.erro); else esperando.bloco({ tipo: 'falha', titulo: 'Não foi possível continuar', texto: String(m.erro || 'erro do servidor'), local: true, ts: Date.now() }); } return; }
    if (m.tipo === 'agente-lista') {
      if (m.dono && m.dono !== this.eu) return;
      var painel = this;
      (m.lista || []).forEach(function (a) { var s = a && painel.sessoes[a.id]; if (s) s.resumoAgente(a); });
      return;
    }
    if (m.tipo === 'term-lista') {
      if (m.dono && m.dono !== this.eu) return;
      var eu = this;
      (m.lista || []).forEach(function (i) { var s = i && eu.sessoes[i.id]; if (s) s.infoLista(i); });
      return;
    }
    if (m.tipo.indexOf('term-') !== 0 && m.tipo.indexOf('agente-') !== 0) return;
    if (m.dono && m.dono !== this.eu) return; /* terminais dos outros: é a parede que mostra */
    var id = m.tipo === 'term-aberto' ? m.info && m.info.id : m.id;
    var s = this.sessoes[id];
    if (!s) return;
    if (m.tipo.indexOf('agente-') === 0) this.viuAgente = true;
    s.receber(m);
  };
  P.sessaoEsperando = function () { var eu = this; var k = Object.keys(this.sessoes).filter(function (id) { return eu.sessoes[id].esperandoTela; })[0]; return k ? this.sessoes[k] : null; };

  P.pintarSelos = function () { var eu = this; Object.keys(this.sessoes).forEach(function (id) { eu.sessoes[id].pintarSelo(eu.controles); }); };

  /* o b do topo da Estação acompanha o agente (gancho da casca: html[data-agente]) */
  P.agenteGlobal = function () {
    var prio = { espera: 4, pensando: 3, rodando: 2, terminou: 1 }, melhor = '', eu = this;
    Object.keys(this.sessoes).forEach(function (id) { var e = eu.sessoes[id].estadoGlobal(); if ((prio[e] || 0) > (prio[melhor] || 0)) melhor = e; });
    var html = document.documentElement;
    if ((html.dataset.agente || '') !== melhor) { if (melhor) html.dataset.agente = melhor; else delete html.dataset.agente; }
    clearTimeout(this.tAgente);
    if (melhor === 'terminou') this.tAgente = setTimeout(function () { eu.agenteGlobal(); }, 2100);
    this.relogioTalvez();
  };

  /* "rodando há N s": relógio de 1 s só enquanto alguma sessão roda (e só pinta com a janela à vista) */
  P.relogioTalvez = function () {
    var eu = this, precisa = Object.keys(this.sessoes).some(function (id) { return eu.sessoes[id].correndo(); });
    if (precisa && !this.relogio) this.relogio = setInterval(function () {
      if (!document.hidden) { var s = eu.ativa(); if (s) s.pintarCab(); }
      var ainda = Object.keys(eu.sessoes).some(function (id) { return eu.sessoes[id].correndo(); });
      if (!ainda) { clearInterval(eu.relogio); eu.relogio = 0; }
    }, 1000);
    if (!precisa && this.relogio) { clearInterval(this.relogio); this.relogio = 0; }
  };

  /* ---------- cliques ---------- */
  P.clique = function (ev) {
    var b = ev.target.closest('[data-tr],[data-term]');
    if (!b || !this.el.contains(b)) return;
    var q = b.getAttribute('data-tr'), sEl = b.closest('.tr-sessao'), s = sEl ? this.sessoes[sEl.dataset.id] : this.ativa();
    if (!q) { this.cliqueCompat(b.getAttribute('data-term')); return; }
    switch (q) {
      case 'aba': this.ativar(b.dataset.id, true); return;
      case 'apagar': ev.stopPropagation(); this.apagar(b.closest('.tr-aba').dataset.id, b); return;
      case 'nova': this.novoAgenteForm(); return;
      case 'codex': BC.terminalReal.novoAgente('Codex', { provedor: 'codex' }); return;
      case 'nova-cancelar': this.novoEl.hidden = true; return;
      case 'nova-criar': this.criarAgente(); return;
      case 'face': this.face(b.dataset.face); var at = this.ativa(); if (at) at.focar(); return;
      case 'entrar': if (E()) { E().abrirPaleta(); var pe = document.getElementById('paleta-entrada'); if (pe) { pe.value = 'Entrar no terminal de'; pe.dispatchEvent(new Event('input')); } } return;
      case 'neon': this.ligarNeon(!neonLigado()); return;
      case 'som': O.ligarSom(!O.somLigado()); this.pintarBarra(); return;
      case 'uso': this.usoAberto = !this.usoAberto; this.pintarBarra(); return;
      case 'esconder': if (E()) E().alternarTerminal(false); return;
      case 'pausar': if (s) enviar({ tipo: 'term-pausar', id: s.id, sim: !s.pausada }); return;
      /* parar o agente no meio da ação: Esc no pty, pelo mesmo caminho das teclas do xterm (só no terminal do próprio dono) */
      case 'parar': if (s) s.parar(); return;
      case 'encerrar': enviar({ tipo: 'controle-encerrar', id: b.dataset.c }); return;
      case 'aceitar': enviar({ tipo: 'controle-aceitar', id: b.dataset.c }); return;
      case 'recusar': enviar({ tipo: 'controle-recusar', id: b.dataset.c }); return;
      default: if (s) s.clique(q, b, ev);
    }
  };
  /* cartões que os módulos do protótipo escrevem (Máquina, navegador simulado): mesmos data-term de antes */
  P.cliqueCompat = function (q) {
    if (!q) return;
    if (q.indexOf('aba:') === 0) { var id = sid(q.slice(4)); if (this.sessoes[id]) this.ativar(id, true); }
    else if (q.indexOf('abrir:') === 0) { var a = L().arquivo(q.slice(6)); if (a && BC.explorador) BC.explorador.abrirArquivo(a.id); }
    else if (q.indexOf('pessoa:') === 0) { if (E()) E().abrirPerfil(q.slice(7)); }
    else if (q.indexOf('desfazer:') === 0) { var p = q.split(':'); if (L().fazer(p[1], p[2]) && E()) E().aviso('Desfeito.'); }
    else if (q === 'oficina' && E()) E().abrir('oficina');
  };

  P.teclaPainel = function (ev) {
    var t = ev.target;
    if (t.classList && t.classList.contains('tr-entrada')) {
      var s = this.sessoes[t.closest('.tr-sessao').dataset.id];
      if (!s) return;
      if (ev.key === 'ArrowUp' && s.pos > 0) { s.pos--; t.value = s.historico[s.pos]; ev.preventDefault(); }
      else if (ev.key === 'ArrowDown' && s.pos < s.historico.length) { s.pos++; t.value = s.historico[s.pos] || ''; ev.preventDefault(); }
      else if (ev.key === 'Escape' && t.value) { t.value = ''; this.mencionar(); ev.stopPropagation(); }
      return;
    }
    if (t.classList && t.classList.contains('tr-renomear')) {
      if (ev.key === 'Enter') { ev.preventDefault(); this.renomear(t.closest('.tr-aba').dataset.id, t.value); }
      else if (ev.key === 'Escape') { ev.preventDefault(); this.renomear(t.closest('.tr-aba').dataset.id, null); }
      ev.stopPropagation();
      return;
    }
    if (t.id === 'tr-ag-nome' && ev.key === 'Enter') { ev.preventDefault(); this.criarAgente(); }
    if (t.id === 'tr-ag-faz' && ev.key === 'Enter') { ev.preventDefault(); this.criarAgente(); }
    /* espera focada: s = permitir, n = negar (CONCEITO: "Confirma? s/N" com botões e teclas) */
    var blocoEspera = t.closest && t.closest('.tr-bloco[data-tipo="espera"]');
    if (blocoEspera && (ev.key === 's' || ev.key === 'n')) {
      var b = blocoEspera.querySelector('[data-tr="ok"][data-d="' + (ev.key === 's' ? 'permitir' : 'negar') + '"]');
      if (b) { ev.preventDefault(); b.click(); }
    }
  };

  /* ---------- neon ---------- */
  P.ligarNeon = function (v) {
    guardar(CHAVE.neon, v ? '1' : '0');
    var eu = this;
    Object.keys(this.sessoes).forEach(function (id) { var s = eu.sessoes[id]; if (s.marca) s.marca.ligar(v); });
    this.pintarBarra();
  };

  /* ---------- agentes: criar, renomear, apagar ---------- */
  P.novoAgenteForm = function () {
    var box = this.novoEl;
    box.hidden = false;
    box.innerHTML = '<div class="tr-novo-cab"><span>Novo agente</span><button type="button" class="tr-esconder" data-tr="nova-cancelar" aria-label="Cancelar">✕</button></div>' +
      '<input type="text" id="tr-ag-nome" placeholder="Nome humano (ex.: Rita)" maxlength="18" autocomplete="off" spellcheck="false">' +
      '<input type="text" id="tr-ag-faz" placeholder="O que ele faz (vira as instruções)" autocomplete="off">' +
      '<label>Agente <select id="tr-ag-provedor"><option value="claude">Claude Code</option><option value="codex">Codex</option></select></label>' +
      '<label><input type="checkbox" id="tr-ag-so"> só terminal (não inicia o agente sozinho)</label>' +
      '<div class="tr-novo-acoes"><button type="button" class="tr-botao primario" data-tr="nova-criar">Criar</button><span class="tr-kbd">cada agente é uma sessão do seu terminal, na sua pasta</span></div>';
    var n = box.querySelector('#tr-ag-nome');
    if (n) n.focus();
  };
  P.criarAgente = function () {
    var nomeEl = this.novoEl.querySelector('#tr-ag-nome');
    if (!nomeEl) return;
    var nome = nomeEl.value.trim(), faz = (this.novoEl.querySelector('#tr-ag-faz') || {}).value || '', so = !!(this.novoEl.querySelector('#tr-ag-so') || {}).checked;
    if (!nome) { nomeEl.focus(); return; }
    var id = 'ag-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    if (so) guardar(CHAVE.so + id, '1');
    guardar(CHAVE.provedor + id, this.novoEl.querySelector('#tr-ag-provedor').value === 'codex' ? 'codex' : 'claude');
    this.abaDesejada = id;
    this.novoEl.hidden = true;
    L().fazer('novoAgente', { id: id, nome: nome, oQueFaz: faz.trim(), visivel: true });
    this.sincronizar();
    var s = this.sessoes[id];
    if (s) s.focar();
    if (E()) E().aviso('Agente ' + nome + ' criado: é um terminal de verdade, na sua pasta. Ele aparece na parede de terminais.');
  };
  P.renomearForm = function (id) {
    var s = this.sessoes[id];
    if (!s) return;
    var n = s.abaEl.querySelector('.tr-aba-nome');
    n.hidden = true;
    var inp = document.createElement('input');
    inp.className = 'tr-renomear'; inp.value = s.nome; inp.maxLength = 18; inp.setAttribute('aria-label', 'Novo nome do agente');
    n.parentNode.insertBefore(inp, n.nextSibling);
    inp.focus(); inp.select();
    var eu = this;
    inp.addEventListener('blur', function () { if (!inp._fim && inp.isConnected) eu.renomear(id, inp.value); });
  };
  P.renomear = function (id, nome) {
    var s = this.sessoes[id];
    if (!s) return;
    var inp = s.abaEl.querySelector('.tr-renomear');
    if (inp) { inp._fim = true; if (inp.parentNode) inp.parentNode.removeChild(inp); } /* tirar o campo focado dispara blur: _fim evita renomear duas vezes */
    s.abaEl.querySelector('.tr-aba-nome').hidden = false;
    nome = String(nome || '').trim().slice(0, 18);
    if (!nome || nome === s.nome) return;
    L().fazer('renomearAgente', s.agId, nome);
    enviar({ tipo: 'term-renomear', id: s.id, nome: nome });
    s.nome = nome; s.pintar();
  };
  P.apagar = function (id, botao) {
    var s = this.sessoes[id];
    if (!s) return;
    if (this.ordem.length <= 1) { if (E()) E().aviso('Deixe pelo menos um agente.'); return; }
    /* dois passos: × vira "apagar?" por 3 s; o segundo clique apaga o agente e fecha o terminal dele */
    if (!botao.classList.contains('confirmar')) {
      botao.classList.add('confirmar'); botao.textContent = 'apagar?';
      clearTimeout(botao._t);
      botao._t = setTimeout(function () { botao.classList.remove('confirmar'); botao.textContent = '×'; }, 3000);
      return;
    }
    enviar({ tipo: 'term-fechar', id: s.id });
    s.destruir();
    delete this.sessoes[id];
    L().fazer('apagarAgente', s.agId);
    this.sincronizar();
  };

  /* ---------- o que a Estação (estacao.js) e os outros módulos do protótipo chamam ---------- */
  P.focar = function () { var s = this.ativa(); if (s) s.focar(); };
  P.atualizar = function () {
    if (!this.pronto) return;
    if (assinaturaDe(this.agentes()) !== this.assinatura) this.sincronizar();
    var obj = objetoAberto(), k = obj ? obj.chave : '';
    if (k !== this.objetoChave) { this.objetoChave = k; this.objeto = obj; var s = this.ativa(); if (s) s.pintarObjeto(obj); }
    var at = this.ativa();
    if (at) at.degradeVars();
    this.pintarBarra();
  };
  P.mencionar = function () { var s = this.ativa(); if (s) s.mencionar(); };
  /* texto do protótipo (Máquina, navegador simulado, 3D): vira bloco local na presença da aba ativa */
  P.escrever = function (texto, classe) {
    var s = this.ativa();
    if (!s) return;
    s.bloco({ tipo: classe === 'erro' ? 'falha' : classe === 'ia' ? 'acao' : 'nota', texto: String(texto || ''), ts: Date.now(), local: true });
  };
  P.cartao = function (html, desfazer, extras) {
    var s = this.ativa();
    if (!s) return;
    s.bloco({ tipo: 'resultado', html: '✓ ' + html + (desfazer ? '<button type="button" class="term-mini" data-term="desfazer:' + esc(desfazer) + '">desfazer</button>' : '') + (extras || ''), ts: Date.now(), local: true });
  };

  /* ================================================================== uma sessão (uma aba = um agente = um pty) */
  function Sessao(p, ag) {
    this.p = p; this.agId = ag.id; this.id = sid(ag.id); this.nome = ag.nome || 'Agente'; this.oQueFaz = ag.oQueFaz || ''; this.cor = ag.cor;
    this.aberta = false; this.esperandoTela = false; this.tAbrir = 0; this.info = null; this.fim = false; this.codigoFim = null;
    this.pausada = false; this.estadoTerm = 'shell'; this.processo = null; this.claudeNaFrente = false;
    this.modoAgente = false; this.agente = { estado: null, ferramenta: null, desde: 0, ts: 0 }; this.usoCodex = null; this.turnoAtivo = false; this.turnoDesde = 0; this.forcarErro = false; this.parouEm = 0;
    this.fimDaSaida = ''; this.blocos = []; this.porBid = {}; this.nBlocos = 0; this.seq = 0; this.planoItens = null; this.planoEl = null; this.nPlanos = 0; this.cadeia = Promise.resolve();
    this.tempo = []; this.confiancaVista = false; this.tConf = 0; this.historico = []; this.pos = 0; this.enderecoTirado = null;
    this.estadoVisto = null; this.tEstado = 0; this.visitas = ''; this.bPendente = false;
    this.soTerminal = ler(CHAVE.so + ag.id) === '1';
    this.provedor = ler(CHAVE.provedor + ag.id) === 'codex' || ag.provedor === 'codex' ? 'codex' : 'claude';
    this.oficina = ler(CHAVE.oficina + ag.id) === '1';
    this.iniciandoAgente = false; this.pedidoPendente = null;
    this.face = ler(CHAVE.face + ag.id) || (this.soTerminal ? 'terminal' : 'presenca');
    this.xtermAberto = false; this.enviado = { cols: 0, rows: 0 };
    this.montar();
  }
  var S = Sessao.prototype;

  S.montar = function () {
    var eu = this;
    /* a aba (fica viva enquanto o agente existir: a mini presença e o destino do pulso não mudam de elemento) */
    var aba = this.abaEl = document.createElement('div');
    aba.className = 'term-aba tr-aba';
    aba.setAttribute('role', 'tab'); aba.setAttribute('data-tr', 'aba'); aba.dataset.id = this.id; aba.tabIndex = -1;
    aba.innerHTML = '<span class="tr-ic"><i class="tr-ic-anel"></i></span><span class="tr-aba-nome"></span><span class="tr-olho" hidden></span>' +
      '<button type="button" class="tr-x" data-tr="apagar" title="Apagar este agente e fechar o terminal dele">×</button>';
    this.mini = new O.Presenca(aba.querySelector('.tr-ic'), { tamanho: 'mini' });

    /* o corpo da sessão */
    var el = this.el = document.createElement('section');
    el.className = 'tr-sessao'; el.dataset.id = this.id; el.dataset.face = this.face; el.dataset.vazio = 'sim'; el.dataset.estado = 'shell'; el.hidden = true;
    el.setAttribute('aria-label', 'Agente ' + this.nome);
    el.innerHTML =
      '<header class="tr-cab"><div class="tr-cab-linha"><span class="tr-pres"></span>' +
      '<div class="tr-cab-txt"><div class="tr-alvo"><span class="tr-seta">→</span> <span class="tr-alvo-txt"></span></div>' +
      '<div class="tr-linha2"><span class="tr-nome"></span> · <span class="tr-est"></span></div><ol class="tr-tempo" aria-label="O que aconteceu"></ol></div></div>' +
      '<button type="button" class="tr-vivo" data-tr="pausar"></button>' +
      '<button type="button" class="tr-botao tr-parar" data-tr="parar" hidden title="Parar o agente agora (manda Esc, como no Claude Code)">■ Parar</button></header>' +
      '<div class="tr-selo" hidden></div>' +
      '<div class="tr-faces">' +
      '<div class="tr-face tr-face-presenca"><div class="tr-blocos" role="log" aria-live="polite"></div>' +
      '<div class="tr-rodape"><div class="tr-iniciar" hidden><button type="button" class="tr-botao primario" data-tr="iniciar"></button><button type="button" class="tr-so" data-tr="so-terminal" aria-pressed="false">só terminal</button></div>' +
      '<div class="tr-receitas"></div><div class="tr-mencao" hidden></div>' +
      '<form class="tr-campo" autocomplete="off"><span class="tr-p" aria-hidden="true">❯</span><span class="tr-end" hidden><span></span><button type="button" data-tr="end-tirar" aria-label="Não mandar o endereço">×</button></span>' +
      '<input class="tr-entrada" type="text" spellcheck="false" aria-label="Pedido ao agente"><button type="submit" class="tr-enviar">enviar</button></form></div></div>' +
      '<div class="tr-face tr-face-terminal"><i class="tr-hair" aria-hidden="true"></i><div class="tr-xterm" data-degrade="sim"></div><span class="tr-marca"></span>' +
      '<div class="tr-desligado" hidden><span>o shell saiu.</span><button type="button" class="tr-botao" data-tr="reabrir">Abrir de novo</button></div></div>' +
      '</div>';
    this.cabEl = el.querySelector('.tr-cab');
    this.presEl = el.querySelector('.tr-pres');
    this.seloEl = el.querySelector('.tr-selo');
    this.blocosEl = el.querySelector('.tr-blocos');
    this.facePresEl = el.querySelector('.tr-face-presenca');
    this.iniciarEl = el.querySelector('.tr-iniciar');
    this.receitasEl = el.querySelector('.tr-receitas');
    this.mencaoEl = el.querySelector('.tr-mencao');
    this.endEl = el.querySelector('.tr-end');
    this.inputEl = el.querySelector('.tr-entrada');
    this.xtermEl = el.querySelector('.tr-xterm');
    this.hairEl = el.querySelector('.tr-hair');
    this.desligadoEl = el.querySelector('.tr-desligado');
    this.presenca = new O.Presenca(this.presEl, { tamanho: 'grande' });
    this.marca = new O.MarcaB(el.querySelector('.tr-marca'), { neon: neonLigado() });
    this.p.sessoesEl.appendChild(el);

    /* o organismo desta sessão (TERMINAL_2030 §8.1): o objeto o é lido a cada chamada */
    this.vo = { presenca: this.presenca, mini: this.mini, aba: aba, corpo: el, marca: this.marca, meu: true,
      erroProvavel: function () { if (eu.forcarErro) return true; if (eu.modoAgente) return false; return ERRO_PROVAVEL.test(eu.fimDaSaida.slice(-2048)); } };
    this.v = O.vincular(this.vo);

    /* o terminal de verdade: xterm (aberto quando a aba aparece pela primeira vez; a tela funciona antes disso) */
    var t = this.term = new window.Terminal({ fontFamily: FONTE, fontSize: 12.5, lineHeight: 1.35, cursorBlink: true, cursorStyle: 'block', scrollback: 5000, theme: temaAgora(), minimumContrastRatio: vibe() ? 4.5 : 1, drawBoldTextInBrightColors: true, macOptionIsMeta: false, allowProposedApi: false });
    this.fit = new window.FitAddon.FitAddon();
    t.loadAddon(this.fit);
    t.attachCustomKeyEventHandler(function (ev) { return !teclaDoApp(ev); });
    t.onData(function (d) { eu.tecla(d); });
    t.onBinary(function (d) { eu.tecla(d); });
    this.bocaVazia();
    this.pintar();
  };

  S.atualizarAgente = function (ag) {
    var mudou = ag.nome !== this.nome || (ag.oQueFaz || '') !== this.oQueFaz;
    this.nome = ag.nome || this.nome; this.oQueFaz = ag.oQueFaz || ''; this.cor = ag.cor;
    if (mudou) { this.bocaVazia(); this.pintar(); }
  };

  S.destruir = function () {
    clearTimeout(this.tmConf);
    try { if (this.ro) this.ro.disconnect(); } catch (e) { /* segue */ }
    try { this.term.dispose(); } catch (e) { /* segue */ }
    try { this.presenca.destruir(); this.mini.destruir(); this.marca.destruir(); this.v.destruir(); } catch (e) { /* segue */ }
    if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
    if (this.abaEl.parentNode) this.abaEl.parentNode.removeChild(this.abaEl);
    this.destruida = true;
  };

  /* ---------- o pty ---------- */
  S.abrir = function () {
    var d = this.p.dimensoes();
    this.esperandoTela = true; this.fim = false; this.codigoFim = null; this.tAbrir = Date.now();
    this.desligadoEl.hidden = true;
    enviar({ tipo: 'term-abrir', id: this.id, nome: this.nome, cols: d.cols, rows: d.rows });
  };
  S.falhaAbrir = function (texto) {
    this.esperandoTela = false;
    this.bloco({ tipo: 'falha', titulo: 'não abriu o terminal', texto: String(texto || 'erro do servidor'), ts: Date.now(), local: true });
  };
  S.tecla = function (d) {
    if (!this.aberta || !d) return;
    enviar({ tipo: 'term-entrada', dono: this.p.eu, id: this.id, dados: d });
    if (d.indexOf('\r') >= 0) { this.v.enter(); O.acender(this.cabEl, 1500); }
  };

  S.receber = function (m) {
    switch (m.tipo) {
      case 'term-aberto': this.aoAberto(m); return;
      case 'term-saida': this.saida(m.dados); return;
      case 'term-tela': if (typeof m.dados === 'string') { this.term.reset(); this.term.write(m.dados); } return;
      case 'term-atividade': this.atividade(m); return;
      case 'term-pausa': this.pausar(!!m.pausada); return;
      case 'term-fim': this.aoFim(m.codigo); return;
      case 'agente-iniciado':
        this.modoAgente = true; this.resumoAgente(m); this.iniciandoAgente = this.provedor === 'codex';
        if (!this.iniciandoAgente && this.pedidoPendente) { var pedido = this.pedidoPendente; this.pedidoPendente = null; enviar({ tipo: 'agente-pedido', id: this.id, texto: pedido }); }
        this.pintar(); return;
      case 'agente-resumo': this.resumoAgente(m); return;
      case 'agente-fim': this.iniciandoAgente = false; this.pedidoPendente = null; this.modoAgente = false; this.turnoAtivo = false; this.agente.estado = null; this.v.atividade({ estado: 'shell', processo: this.provedor, desde: Date.now() }); this.fecharEsperasAbertas(); this.marcarTempo(m.motivo || 'agente encerrado'); this.pintar(); return;
      case 'agente-estado': this.agenteEstado(m); return;
      case 'agente-uso': this.usoCodex = m.uso || null; this.p.pintarUso(); return;
      case 'agente-bloco': if (m.bloco && typeof m.bloco === 'object') { this.modoAgente = true; this.blocoServidor(blocoDoServidor(m.bloco)); this.pedidoDepoisDeParar(m.bloco); } return;
      case 'agente-plano': this.modoAgente = true; this.plano(m); return;
      case 'agente-espera': this.espera(m); return;
      default: return;
    }
  };

  S.aoAberto = function (m) {
    var info = m.info || {}, eu = this;
    var nova = !!(info.criada && info.criada >= this.tAbrir - 1500);
    this.info = info; this.aberta = true; this.esperandoTela = false; this.fim = false;
    this.p.med.termAberto++;
    if (info.cols && info.rows && (info.cols !== this.term.cols || info.rows !== this.term.rows)) this.term.resize(info.cols, info.rows);
    this.enviado = { cols: info.cols || 0, rows: info.rows || 0 };
    this.term.reset();
    this.term.write(m.tela || '', function () { eu.ajustar(); });
    if (!!info.pausada !== this.pausada) this.pausar(!!info.pausada);
    if (info.processo) this.processo = info.processo;
    if (nova) {
      if (!(this.provedor === 'codex' && this.modoAgente)) this.v.aberto();
      this.marcarTempo('nasceu na sua pasta');
      /* primeira abertura da aba: o agente inicia sozinho (só com o servidor pronto para agentes e sem "só terminal") */
      if (this.p.servidorComAgentes() && !this.soTerminal) setTimeout(function () { if (eu.aberta && !eu.claudeNaFrente && !eu.modoAgente && !eu.iniciandoAgente) eu.iniciarAgente(true); }, 400);
    }
    this.pintar();
  };

  /* term-lista do meu servidor: pausa, processo e nome atualizados (sem efeito: a luz vem do term-atividade) */
  S.infoLista = function (i) {
    this.info = Object.assign({}, this.info || {}, i);
    if (i.processo) this.processo = i.processo;
    if (typeof i.pausada === 'boolean' && i.pausada !== this.pausada && this.aberta) this.pausar(i.pausada);
  };

  S.saida = function (dados) {
    if (this.esperandoTela || typeof dados !== 'string') return; /* o term-aberto que vem traz esta saída na tela inteira */
    this.term.write(dados); /* primeiro a tela; o efeito vem depois e nunca atrasa */
    if (!(this.provedor === 'codex' && this.modoAgente)) this.v.saida(dados);
    this.p.med.saidas++; this.p.med.bytes += dados.length;
    this.fimDaSaida = (this.fimDaSaida + dados).slice(-4096);
    var t = performance.now();
    if (!this.tHair || t - this.tHair > 200) { this.tHair = t; O.acender(this.hairEl, 6000); }
    if (!this.confiancaVista) { var eu = this; clearTimeout(this.tmConf); this.tmConf = setTimeout(function () { eu.checarConfianca(); }, 160); }
  };

  /* pedido de confiança do Claude Code ("Do you trust the files in this folder?"): vira um bloco espera com o botão que manda Enter */
  S.checarConfianca = function () {
    if (this.confiancaVista || this.destruida) return;
    var tela = lerBuffer(this.term, 40);
    if (!/trust/i.test(tela) || !/(folder|files|project|pasta)/i.test(tela)) return;
    if (!/claude/i.test(tela) && !/claude/i.test(this.processo || '')) return;
    this.confiancaVista = true;
    this.p.med.confianca++;
    this.bloco({ bid: 'confianca-' + Date.now().toString(36), tipo: 'espera', titulo: 'confiar nesta pasta?', confianca: true,
      texto: 'O Claude Code pergunta se você confia nos arquivos de ' + this.p.pastaCurta() + '. Confiar deixa o agente ler e rodar comandos aqui.', ts: Date.now() });
    this.marcarTempo('pede confiança na pasta');
  };

  /* a tela de confiança do Claude Code (2.1.x) abre com o cursor em "No, exit": Enter sozinho sairia.
     Lê a tela, conta quantas linhas separam o cursor ❯ de "Yes, I trust…" e diz as setas que faltam. */
  var SIM_CONFIO = /Yes,? I trust|Yes, proceed|Sim, confio/i;
  S.planoConfianca = function () {
    var linhas = lerBuffer(this.term, 40).split('\n'), sel = -1, sim = -1;
    linhas.forEach(function (l, i) { if (/^\s*❯\s*\S/.test(l)) sel = i; if (SIM_CONFIO.test(l)) sim = i; });
    if (sel < 0 || sim < 0 || Math.abs(sim - sel) > 6) return null;
    return { selecionada: linhas[sel].trim(), sim: linhas[sim].trim(), passos: sim - sel };
  };
  S.confiar = function () {
    if (!this.aberta || !this.claudeNaFrente) return false;
    var plano = this.planoConfianca(), eu = this;
    if (!plano) { this.definirFace('terminal'); this.p.pintarBarra(); this.focar(); if (E()) E().aviso('Não achei a opção de confiar na tela: responda no terminal.'); return false; }
    var seta = plano.passos > 0 ? '\x1b[B' : '\x1b[A', n = Math.abs(plano.passos), i = 0;
    function passo() {
      if (i < n) { i++; enviar({ tipo: 'term-entrada', dono: eu.p.eu, id: eu.id, dados: seta }); setTimeout(passo, 90); return; }
      /* confere na tela que o cursor está em "Yes, I trust…" antes do Enter; se não estiver, a pessoa responde no terminal */
      setTimeout(function () {
        var agora = eu.planoConfianca();
        if (agora && agora.passos === 0 && SIM_CONFIO.test(agora.selecionada)) enviar({ tipo: 'term-entrada', dono: eu.p.eu, id: eu.id, dados: '\r' });
        else { eu.definirFace('terminal'); eu.p.pintarBarra(); eu.focar(); }
      }, 250);
    }
    passo();
    return true;
  };

  S.atividade = function (m) {
    var e = m.estado;
    if (e === 'pausado') { this.pausar(true); return; }
    this.estadoTerm = e;
    this.processo = m.processo || this.processo;
    if (this.provedor === 'codex' && (this.modoAgente || this.iniciandoAgente)) { this.pintar(); return; }
    var claude = /claude/i.test(m.processo || '');
    this.claudeNaFrente = claude && (e === 'rodando' || e === 'espera');
    if (e === 'shell' || (e === 'terminou' && !this.claudeNaFrente)) { this.confiancaVista = false; this.vencerConfianca(); }
    if (this.modoAgente) {
      /* com o agente vivo quem manda na presença são os ganchos (agente-estado); o pty só avisa quando o claude sai */
      if (e === 'shell' || e === 'terminou') { this.modoAgente = false; this.turnoAtivo = false; this.agente.estado = null; }
      else { this.pintar(); return; }
    }
    if (e === 'terminou') {
      var chave = (m.processo || '') + '|' + (m.fim || m.desde || '');
      if (chave === this.ultimoFim) { this.pintar(); return; }
      this.ultimoFim = chave;
    }
    var antes = this.v.estado();
    if (e === 'rodando' && antes !== 'rodando') { this.fimDaSaida = ''; this.marcarTempo('rodando ' + (m.processo || '')); }
    this.v.atividade(m);
    var depois = this.v.estado();
    if (depois !== antes) {
      if (depois === 'terminou') this.marcarTempo('terminou ' + (m.processo || '') + (m.duracao ? ' · ' + O.duracaoTexto(m.duracao) : ''));
      else if (depois === 'falhou') this.marcarTempo('falhou ' + (m.processo || ''));
      else if (depois === 'espera') this.marcarTempo('espera você');
      if (depois === 'terminou' || depois === 'falhou' || depois === 'espera') { O.acender(this.cabEl, 6000); if (this.p.aba !== this.id) O.acender(this.abaEl, 6000); }
    }
    this.pintar();
  };

  S.pausar = function (sim) {
    if (sim === this.pausada) return;
    this.pausada = sim;
    this.v.pausa(sim);
    this.marcarTempo(sim ? 'transmissão pausada' : 'transmissão retomada');
    this.pintar();
  };

  S.aoFim = function (codigo) {
    this.aberta = false; this.fim = true; this.codigoFim = codigo || null; this.modoAgente = false; this.claudeNaFrente = false;
    this.v.fim(codigo);
    this.term.write('\r\n\x1b[90m[o shell saiu' + (codigo ? ' · código ' + codigo : '') + ']\x1b[0m\r\n');
    this.desligadoEl.hidden = false;
    this.marcarTempo(codigo ? 'o shell caiu · código ' + codigo : 'o shell saiu');
    this.pintar();
  };

  /* ---------- o agente (ganchos do Claude Code, PROTOCOLO §7) ---------- */
  S.resumoAgente = function (m) {
    if (m.provedor === 'codex' || m.provedor === 'claude') { this.provedor = m.provedor; guardar(CHAVE.provedor + this.agId, m.provedor); }
    if (typeof m.ativo === 'boolean') this.modoAgente = m.ativo;
    var eu = this;
    (m.blocos || []).forEach(function (b) { eu.blocoServidor(blocoDoServidor(b)); });
    if (m.plano) this.plano(Array.isArray(m.plano) ? { itens: m.plano } : m.plano);
    if (m.estado && m.ativo !== false) this.agenteEstado(m);
    if (m.ativo !== false) (m.pendentes || []).forEach(function (p) { eu.espera(p); });
    this.pintar();
  };
  S.agenteEstado = function (m) {
    if (m.provedor === 'codex' || m.provedor === 'claude') this.provedor = m.provedor;
    var e = m.estado, ts = +m.ts || Date.now();
    if (['acordou', 'pensando', 'rodando', 'espera', 'terminou', 'falhou'].indexOf(e) < 0) return;
    if (this.provedor === 'codex' && e === 'acordou') {
      this.iniciandoAgente = false;
      if (this.pedidoPendente) { var pedido = this.pedidoPendente; this.pedidoPendente = null; enviar({ tipo: 'agente-pedido', id: this.id, texto: pedido }); }
    }
    if ((e === 'pensando' || e === 'rodando') && this.parouEm && ts <= this.parouEm) return; /* gancho que já vinha antes do Parar não religa o turno */
    this.modoAgente = true;
    this.agente = { estado: e, ferramenta: m.ferramenta || null, desde: +m.desde || ts, ts: ts };
    if (e === 'acordou') { this.bEntrada(false); this.v.enter(); this.marcarTempo('acordou'); }
    else if (e === 'pensando' || e === 'rodando') {
      if (!this.turnoAtivo) { this.turnoAtivo = true; this.turnoDesde = +m.desde || ts; this.marcarTempo('pensando'); }
      this.v.atividade({ estado: 'rodando', processo: m.ferramenta || this.provedor, desde: this.turnoDesde });
    } else if (e === 'espera') {
      this.v.atividade({ estado: 'espera', processo: this.provedor, desde: ts });
      this.marcarTempo('espera o seu OK');
    } else {
      var dur = this.turnoAtivo ? Math.max(0, ts - this.turnoDesde) : 0;
      this.turnoAtivo = false;
      this.forcarErro = e === 'falhou';
      this.v.atividade({ estado: 'terminou', processo: this.provedor, duracao: dur, fim: ts });
      this.forcarErro = false;
      this.marcarTempo((e === 'falhou' ? 'falhou' : 'terminou') + (dur ? ' · ' + O.duracaoTexto(dur) : ''));
      this.fecharEsperasAbertas();
    }
    O.acender(this.cabEl, e === 'pensando' || e === 'rodando' ? 1500 : 6000);
    if (this.p.aba !== this.id && e !== 'pensando' && e !== 'rodando') O.acender(this.abaEl, 6000);
    this.pintar();
  };

  S.espera = function (m) {
    var pid = String(m.pid == null ? '' : m.pid);
    if (!pid) return;
    this.modoAgente = true;
    var ja = this.porBid['espera-' + pid];
    this.bloco(Object.assign({}, ja ? ja.b : {}, { bid: 'espera-' + pid, tipo: 'espera', pid: pid, titulo: m.perguntas && m.perguntas.length ? 'precisa da sua resposta' : m.ferramenta ? 'quer usar ' + m.ferramenta : 'pede o seu OK', texto: m.resumo || '', perguntas: m.perguntas || [], ts: +m.ts || Date.now() }, m.comando ? { comando: m.comando } : {}));
    this.agente.estado = 'espera'; this.agente.ts = Date.now();
    this.v.atividade({ estado: 'espera', processo: this.provedor, desde: Date.now() });
    this.marcarTempo('espera o seu OK');
    this.pintar();
  };
  /* o turno acabou e a espera não foi respondida aqui: foi respondida no próprio terminal (ou passou do prazo) */
  S.vencerConfianca = function () {
    var eu = this;
    Object.keys(this.porBid).forEach(function (bid) { var r = eu.porBid[bid]; if (r.b.confianca && !r.decidido) { r.decidido = { decisao: 'terminal', quem: '', ts: Date.now() }; eu.bloco(r.b); } });
  };
  S.fecharEsperasAbertas = function () {
    var eu = this;
    Object.keys(this.porBid).forEach(function (bid) {
      var r = eu.porBid[bid];
      if (r.b.tipo !== 'espera' || r.decidido || r.b.confianca || r.b.senha) return; /* a senha é da pessoa no navegador, não do terminal */
      r.decidido = { decisao: 'terminal', quem: '', ts: Date.now() };
      eu.bloco(r.b);
    });
  };

  S.decidir = function (bid, decisao) {
    var r = this.porBid[bid];
    if (!r || r.decidido) return;
    if (r.b.confianca) { if (!this.confiar()) return; }
    else {
      var respostas;
      if (decisao !== 'negar' && Array.isArray(r.b.perguntas) && r.b.perguntas.length) {
        respostas = Object.create(null);
        var campos = r.el.querySelectorAll('[data-pergunta]');
        for (var i = 0; i < campos.length; i++) {
          var campo = campos[i], livre = campo.querySelector('input'), selecao = campo.querySelector('select');
          var valor = livre && livre.value.trim() || selecao && selecao.value || '';
          if (!valor) { (livre || selecao).focus(); return; }
          respostas[campo.dataset.pergunta] = [valor];
        }
      }
      enviar({ tipo: 'agente-ok', id: this.id, pid: r.b.pid, decisao: decisao, respostas: respostas });
    }
    r.decidido = { decisao: decisao, quem: this.p.nomeEu, ts: Date.now() };
    this.bloco(r.b);
    O.acender(r.el, 6000);
    this.p.med.oks++;
    this.marcarTempo((decisao === 'negar' ? 'negado · ' : 'OK · ') + String(this.p.nomeEu).split(' ')[0]);
    try { document.dispatchEvent(new CustomEvent('babel-coop:agente-ok', { detail: { id: this.id, pid: r.b.pid || null, decisao: decisao, confianca: !!r.b.confianca } })); } catch (e) { /* segue */ }
  };

  S.iniciarAgente = function () {
    if (!this.aberta || this.iniciandoAgente || this.modoAgente) return;
    this.p.med.iniciar++;
    if (this.p.servidorComAgentes()) { this.iniciandoAgente = true; enviar({ tipo: 'agente-iniciar', id: this.id, nome: this.nome, instrucoes: this.oQueFaz || '', provedor: this.provedor, oficina: this.oficina }); }
    else if (this.provedor === 'codex') { this.bloco({ tipo: 'falha', texto: 'Atualize o app para usar Codex na Presença.', local: true }); return; }
    else if (!this.claudeNaFrente) {
      /* servidor ainda sem ganchos: abre o claude no terminal (sem blocos na presença; o terminal mostra tudo) */
      var eu = this;
      enviar({ tipo: 'term-entrada', dono: this.p.eu, id: this.id, dados: 'claude -n ' + aspas(this.nome) });
      setTimeout(function () { enviar({ tipo: 'term-entrada', dono: eu.p.eu, id: eu.id, dados: '\r' }); }, 40);
    }
    this.v.enter();
    this.marcarTempo('iniciando ' + this.nome);
    this.pintar();
  };

  /* o b que se desenha (R1 do PLANO): dentro do mostrador, mudo, uma vez por agente; reduced motion = o b parado */
  S.bEntrada = function (forcar) {
    var chave = CHAVE.b + (this.p.eu || '') + ':' + this.agId;
    if (!forcar && ler(chave) === '1') return false;
    if (!visivel(this.presEl)) { this.bPendente = true; return false; }
    guardar(chave, '1');
    this.bPendente = false;
    this.p.med.bEntrada++;
    var pres = this.presEl, eu = this, feito = false, midia;
    if (O.semMovimento() || !temMidia('b-entrada.mp4')) {
      if (!temMidia('b-entrada-poster.jpg')) return true;
      midia = new Image(); midia.className = 'tr-b-entrada'; midia.alt = ''; midia.src = '/coop/midia/b-entrada-poster.jpg';
      pres.appendChild(midia);
      setTimeout(function () { if (midia.parentNode) midia.parentNode.removeChild(midia); }, 1200);
      return true;
    }
    midia = document.createElement('video');
    midia.className = 'tr-b-entrada'; midia.muted = true; midia.playsInline = true; midia.preload = 'auto';
    midia.setAttribute('aria-hidden', 'true'); midia.setAttribute('muted', '');
    midia.src = '/coop/midia/b-entrada.mp4';
    pres.classList.add('desenhando');
    pres.appendChild(midia);
    function fim() {
      if (feito) return; feito = true;
      midia.classList.add('saindo'); pres.classList.remove('desenhando');
      O.acender(eu.presenca.el, 1500);
      setTimeout(function () { if (midia.parentNode) midia.parentNode.removeChild(midia); }, 220);
    }
    midia.addEventListener('ended', fim);
    midia.addEventListener('error', fim);
    setTimeout(fim, 5200);
    var pr = midia.play();
    if (pr && pr.catch) pr.catch(fim);
    return true;
  };

  /* ---------- blocos tipados ---------- */
  S.bocaVazia = function () {
    /* a apresentação do agente (CONCEITO §3.3: só enquanto não há nada) */
    var txt = (this.oQueFaz ? this.oQueFaz + '\n' : '') + (this.oficina ? 'Peça em português: eu trabalho na cópia autorizada pela Oficina. Cada passo aparece aqui com prova.' : 'Peça em português: eu trabalho no seu terminal de verdade, em ' + this.p.pastaCurta() + '. Cada passo aparece aqui com prova.');
    if (!this.saudacaoEl) { this.saudacaoEl = document.createElement('div'); this.saudacaoEl.className = 'tr-bloco tr-saudacao'; this.saudacaoEl.dataset.tipo = 'nota'; this.blocosEl.insertBefore(this.saudacaoEl, this.blocosEl.firstChild); }
    this.saudacaoEl.innerHTML = '<div class="tr-rot"><span>' + esc(this.nome) + '</span></div><div class="tr-txt">' + esc(txt) + '</div>';
  };

  /* bloco vindo do servidor (texto do modelo): nunca HTML, nunca as marcas locais (confiança manda Enter ao pty) */
  function blocoDoServidor(b) {
    var c = {};
    ['bid', 'tipo', 'titulo', 'texto', 'comando', 'arquivos', 'prova', 'ts', 'pid', 'decisao', 'navegador', 'perguntas'].forEach(function (k) { if (b[k] != null) c[k] = b[k]; });
    if (b.senha === true) c.senha = true;
    if (Array.isArray(b.itens)) c.comItens = true; /* plano do TodoWrite: o checklist vem pelo agente-plano */
    if (c.bid != null) c.bid = 's-' + String(c.bid).slice(0, 80);
    /* o pedido de permissão chega duas vezes (agente-bloco e agente-espera, o mesmo pid): um bloco só */
    if (c.tipo === 'espera' && typeof c.pid === 'string' && c.pid) c.bid = 'espera-' + c.pid;
    return c;
  }
  function provaTexto(p) {
    if (p == null) return '';
    if (typeof p === 'string') return p;
    if (typeof p === 'object') return String(p.saida || p.texto || p.trecho || '') + (p.codigo != null ? '\n(código ' + p.codigo + ')' : '');
    return String(p);
  }
  function arquivosDe(b) {
    var lista = Array.isArray(b.arquivos) ? b.arquivos : [];
    if (b.prova && typeof b.prova === 'object' && Array.isArray(b.prova.arquivos)) lista = lista.concat(b.prova.arquivos);
    return lista.map(function (a) { return typeof a === 'string' ? a : a && (a.caminho || a.nome) || ''; }).filter(Boolean).slice(0, 12);
  }

  S.bloco = function (b) {
    b = b || {};
    var tipo = TIPOS.indexOf(b.tipo) >= 0 ? b.tipo : 'nota';
    var bid = String(b.bid || ('l' + (++this.seq)));
    b.bid = bid;
    var r = this.porBid[bid], novo = !r;
    if (novo) {
      r = this.porBid[bid] = { el: document.createElement('div'), b: b, decidido: null };
      this.blocos.push(r);
      this.p.med.blocos++;
    } else r.b = b;
    var el = r.el, arqs = arquivosDe(b), texto = String(b.texto || '');
    el.className = 'tr-bloco'; el.dataset.tipo = tipo; el.dataset.bid = bid;
    var h = '<div class="tr-rot"><span>' + esc(ROTULO[tipo] || '') + '</span><time>' + hora(+b.ts || Date.now()) + '</time></div>';
    if (tipo === 'consulta') {
      h += '<div class="tr-txt">' + esc(b.titulo || 'o que consultei') + (arqs.length ? ': ' + arqs.map(esc).join(' · ') : '') + (texto ? '\n' + esc(texto) : '') + '</div>';
    } else {
      if (b.titulo) h += '<div class="tr-tit">' + esc(b.titulo) + '</div>';
      if (b.html) h += tipo === 'resultado' ? '<div class="tr-cartao">' + b.html + '</div>' : '<div class="tr-txt">' + b.html + '</div>';
      else if (texto) {
        var longo = texto.length > 520 || texto.split('\n').length > 8;
        h += '<div class="tr-txt' + (longo && !r.aberto ? ' dobrado' : '') + '">' + esc(texto) + '</div>' + (longo && !r.aberto ? '<button type="button" class="tr-mais-txt" data-tr="mais-txt">mostrar tudo</button>' : '');
      }
      if (arqs.length) {
        var eu = this.p.eu, clones = {};
        h += '<div class="tr-arqs">' + arqs.map(function (a) {
          var mc = /^(?:[^\/]+\/)?(Clones\/[^\/]+)\/index\.html?$/i.exec(a);
          if (mc && BC.navegadorReal && typeof BC.navegadorReal.abrirClone === 'function') {
            if (clones[mc[1]]) return '';
            clones[mc[1]] = true;
            return '<button type="button" class="tr-clone" data-tr="clone" data-rel="' + esc(mc[1]) + '">Clonado em ' + esc(mc[1]) + '/ · abrir</button>';
          }
          var achado = L().arquivo(a) || (eu && L().arquivo(eu + '/' + a));
          return achado ? '<button type="button" data-tr="arq" data-caminho="' + esc(achado.caminho || a) + '">' + esc(a) + '</button>' : '<span>' + esc(a) + '</span>';
        }).join('') + '</div>';
      }
    }
    if (b.comando) h += '<details><summary>ver o comando</summary><pre>' + esc(b.comando) + '</pre></details>';
    var prova = provaTexto(b.prova);
    if (prova) h += '<details' + (tipo === 'resultado' ? ' open' : '') + '><summary>prova</summary><pre class="tr-prova">' + esc(prova.slice(0, 6000)) + '</pre></details>';
    if (tipo === 'espera') {
      if (r.decidido) {
        var d = r.decidido;
        h += d.decisao === 'terminal' ? '<div class="tr-decisao">respondido no terminal · ' + hora(d.ts) + '</div>'
          : '<div class="tr-decisao' + (d.decisao === 'negar' ? ' negado' : '') + '"><b>' + (d.decisao === 'negar' ? 'negado' : b.confianca ? 'confiou' : 'OK') + '</b> · ' + esc(d.quem) + ' · ' + hora(d.ts) + '</div>';
      } else if (b.confianca) {
        h += '<div class="tr-bloco-acoes"><button type="button" class="tr-botao primario" data-tr="ok" data-d="permitir">Confiar nesta pasta</button><button type="button" class="tr-botao" data-tr="ver-terminal">responder no terminal</button></div>';
      } else if (b.senha) {
        /* o agente parou no campo de senha do navegador: a pessoa digita lá, na aba "Navegador · <agente>" */
        h += '<div class="tr-bloco-acoes"><button type="button" class="tr-botao primario" data-tr="nav-ver">ir ao navegador · sua vez</button></div>';
      } else if (Array.isArray(b.perguntas) && b.perguntas.length) {
        h += b.perguntas.map(function (q) {
          var opcoes = Array.isArray(q.options) ? q.options : [];
          return '<fieldset class="tr-pergunta" data-pergunta="' + esc(String(q.id)) + '"><legend>' + esc(q.header || q.question || 'Resposta') + '</legend><p>' + esc(q.question || '') + '</p>' +
            (opcoes.length ? '<select aria-label="' + esc(q.question || 'Escolha') + '"><option value="">Escolha uma opção</option>' + opcoes.map(function (op) { var label = typeof op === 'string' ? op : op.label; return '<option value="' + esc(label || '') + '">' + esc(label || '') + (op.description ? ' — ' + esc(op.description) : '') + '</option>'; }).join('') + '</select>' : '') +
            '<input type="' + (q.isSecret ? 'password' : 'text') + '" autocomplete="off" aria-label="Sua resposta" placeholder="' + (opcoes.length ? 'Ou escreva sua resposta' : 'Sua resposta') + '"></fieldset>';
        }).join('') + '<div class="tr-bloco-acoes"><button type="button" class="tr-botao primario" data-tr="ok" data-d="permitir">Responder</button><button type="button" class="tr-botao" data-tr="ok" data-d="negar">Cancelar</button></div>';
      } else if (!b.pid && !b.local) {
        h += '<div class="tr-bloco-acoes"><button type="button" class="tr-botao" data-tr="ver-terminal">responder no terminal</button></div>';
      } else {
        h += '<div class="tr-bloco-acoes"><button type="button" class="tr-botao primario" data-tr="ok" data-d="permitir">Permitir</button><button type="button" class="tr-botao" data-tr="ok" data-d="negar">Negar</button></div>';
      }
    }
    if (tipo === 'falha' && !b.local) h += '<div class="tr-bloco-acoes"><button type="button" class="tr-botao" data-tr="tentar">tentar de novo</button><button type="button" class="tr-botao" data-tr="eu-mesmo">fazer eu mesmo</button><button type="button" class="tr-botao" data-tr="ajuda">pedir ajuda</button></div>';
    el.innerHTML = h;
    if (novo) {
      var perto = this.blocosEl.scrollHeight - this.blocosEl.scrollTop - this.blocosEl.clientHeight < 60;
      this.blocosEl.appendChild(el);
      this.nBlocos++;
      while (this.blocos.length > MAX_BLOCOS) { var velho = this.blocos.shift(); if (velho.el.parentNode) velho.el.parentNode.removeChild(velho.el); delete this.porBid[velho.b.bid]; }
      if (perto || this.el.dataset.vazio === 'sim') this.blocosEl.scrollTop = this.blocosEl.scrollHeight;
      O.acender(el, 6000);
      if (this.p.aba !== this.id) O.acender(this.abaEl, 6000);
      if (tipo !== 'nota') O.acender(this.cabEl, 6000);
      this.pintarVazio();
    }
    return el;
  };
  S.blocoServidor = function (b) {
    /* o plano do TodoWrite já vira o checklist que pulsa (agente-plano): o bloco "N de M feitos" do servidor seria um segundo plano */
    if (b.tipo === 'plano' && b.comItens) return null;
    var ja = this.porBid[b.bid];
    if (ja && b.tipo === 'espera' && ja.b && ja.b.titulo && /^quer usar /.test(ja.b.titulo)) b.titulo = ja.b.titulo; /* o título do agente-espera fica */
    var el = this.bloco(b), r = this.porBid[b.bid];
    if (r && b.tipo === 'espera' && b.decisao && !r.decidido) {
      r.decidido = { decisao: b.decisao === 'permitir' || b.decisao === 'negar' ? b.decisao : 'terminal', quem: '', ts: Date.now() };
      this.bloco(r.b);
    }
    return el;
  };
  S.pintarVazio = function () { this.el.dataset.vazio = this.nBlocos ? 'nao' : 'sim'; };

  /* ---------- o plano: checklist com o pulso da presença até cada item feito ---------- */
  S.plano = function (m) {
    var itens = (Array.isArray(m.itens) ? m.itens : []).slice(0, 50).map(function (x) {
      var e = x && (x.estado || x.status); /* o formato do PROTOCOLO (estado) e o cru do TodoWrite (status) */
      return { texto: String(x && (x.texto || x.content) || '').slice(0, 300), estado: e === 'feito' || e === 'completed' ? 'feito' : e === 'andamento' || e === 'in_progress' ? 'andamento' : 'pendente' };
    });
    if (!itens.length) return;
    var antes = this.planoItens;
    var mesmo = !!(antes && this.planoEl && this.planoEl.isConnected && antes.length === itens.length && antes.every(function (a, i) { return a.texto === itens[i].texto; }));
    if (!mesmo) {
      this.planoEl = this.bloco({ bid: 'plano-' + (++this.nPlanos), tipo: 'plano', ts: +m.ts || Date.now() });
      var ol = document.createElement('ol'); ol.className = 'tr-check';
      itens.forEach(function (it, i) { var li = document.createElement('li'); li.innerHTML = '<i aria-hidden="true"></i><span class="tr-n">' + (i + 1) + '.</span><span></span>'; li.lastChild.textContent = it.texto; ol.appendChild(li); });
      this.planoEl.appendChild(ol);
    }
    var lis = this.planoEl.querySelectorAll('.tr-check li');
    itens.forEach(function (it, i) { if (lis[i]) lis[i].dataset.estado = it.estado; });
    var novos = [];
    if (mesmo) itens.forEach(function (it, i) { if (it.estado === 'feito' && antes[i].estado !== 'feito') novos.push(i); });
    else (Array.isArray(m.concluidosAgora) ? m.concluidosAgora : []).forEach(function (i) { if (itens[i] && itens[i].estado === 'feito') novos.push(i); });
    var todos = itens.every(function (x) { return x.estado === 'feito'; }), eraTodos = mesmo && antes.every(function (x) { return x.estado === 'feito'; });
    this.planoItens = itens;
    var feitos = itens.filter(function (x) { return x.estado === 'feito'; }).length;
    this.marcarTempo('plano · ' + feitos + ' de ' + itens.length);
    this.animarPlano(novos, todos && !eraTodos, lis, itens.length);
  };
  S.animarPlano = function (novos, rito, lis, total) {
    var eu = this, planoEl = this.planoEl;
    novos.forEach(function (i) {
      eu.cadeia = eu.cadeia.then(function () {
        var li = lis[i];
        if (!li || !li.isConnected) return null;
        var aVista = eu.p.aba === eu.id && eu.face === 'presenca' && visivel(li);
        var origem = eu.p.aba === eu.id ? eu.presenca : eu.mini, alvo = aVista ? li : eu.abaEl;
        eu.p.med.pulsosPlano++;
        return O.pulso(origem, alvo, { cor: 'marca', aoChegar: function () {
          O.acender(li, 6000); O.acender(eu.abaEl, 6000);
          /* cada check do plano é um poder (ordem do Theus: "cada check que da pulsa poderes"): explosão verde + "+1"; sem poderes.js, as faíscas de antes */
          var P = window.BC && BC.poderes;
          if (P && aVista) { P.explodir(li, { cor: 'ok', forca: 0.6 }); P.flutuar(li, '+1', { cor: 'ok', tam: 15, topo: true }); }
          else O.faiscas(alvo, 4, false);
          O.som('tique'); /* o som do check continua um só: o tique */
        } });
      }).catch(function () { /* efeito nunca derruba a lógica */ });
    });
    if (rito) this.cadeia = this.cadeia.then(function () { eu.rito(planoEl, total); }).catch(function () { /* segue */ });
  };
  /* tudo feito = rito "concluído": a presença respira uma vez, faíscas fortes e duas notas (1,2 s) */
  S.rito = function (planoEl, total) {
    this.p.med.ritos++;
    var aVista = this.p.aba === this.id && this.face === 'presenca' && visivel(planoEl);
    O.respirar(aVista ? this.facePresEl : this.abaEl);
    O.faiscas(aVista ? planoEl : this.abaEl, 8, true);
    O.som('duas');
    O.acender(planoEl, 9000); O.acender(this.cabEl, 6000);
    if (planoEl && !planoEl.querySelector('.tr-plano-fim')) { var f = document.createElement('div'); f.className = 'tr-plano-fim'; f.textContent = 'concluído · ' + total + ' de ' + total + ' · ' + hora(); planoEl.appendChild(f); }
    this.marcarTempo('plano concluído');
    try { document.dispatchEvent(new CustomEvent('babel-coop:plano-concluido', { detail: { id: this.id, itens: total } })); } catch (e) { /* segue */ }
  };

  /* ---------- o campo ❯ endereçado ---------- */
  S.pintarObjeto = function (obj) {
    this.objeto = obj;
    if (this.enderecoTirado && (!obj || obj.chave !== this.enderecoTirado)) this.enderecoTirado = null;
    var comEnd = !!(obj && this.enderecoTirado !== obj.chave);
    this.endEl.hidden = !comEnd;
    if (comEnd) { this.endEl.firstChild.textContent = '→ ' + obj.nome; this.endEl.title = 'o pedido vai com o endereço: ' + (obj.caminho || obj.nome); }
    this.inputEl.placeholder = 'pedido para ' + this.nome + (obj ? ' → ' + obj.nome : '');
    this.receitasEl.innerHTML = receitasDe(obj).slice(0, 3).map(function (r, i) { return '<button type="button" data-tr="receita" data-i="' + i + '" title="' + esc(r[1]) + '">' + esc(r[0]) + '</button>'; }).join('');
    this.receitas = receitasDe(obj).slice(0, 3);
  };
  S.endereco = function () {
    var obj = this.objeto;
    if (!obj || this.enderecoTirado === obj.chave) return '';
    if (obj.tipo === 'arquivo') {
      var meu = obj.dono === this.p.eu, rel = obj.caminho.indexOf(this.p.eu + '/') === 0 ? obj.caminho.slice(this.p.eu.length + 1) : obj.caminho;
      return meu ? 'arquivo aberto no meio: ' + rel : 'arquivo de ' + L().nome(obj.dono) + ' aberto no meio: ' + obj.caminho;
    }
    return 'aberto no meio: ' + obj.nome;
  };
  S.enviarPedido = function () {
    var texto = this.inputEl.value.trim();
    if (!texto || !this.aberta) return;
    var end = this.endereco(), final = texto + (end ? ' (' + end + ')' : '');
    this.historico.push(texto); this.pos = this.historico.length;
    this.inputEl.value = '';
    this.mencionar();
    this.p.med.pedidos++;
    var eu = this;
    if (this.p.pedidoPeloServidor()) {
      if (!this.modoAgente || this.iniciandoAgente) { this.pedidoPendente = final; this.iniciarAgente(); }
      else enviar({ tipo: 'agente-pedido', id: this.id, texto: final });
    }
    else {
      /* servidor ainda sem ganchos: o pedido vai direto ao claude do terminal (ou abre o claude com ele); o Enter vai separado da colagem */
      this.bloco({ tipo: 'pedido', texto: final, ts: Date.now(), local: true });
      var dados = this.claudeNaFrente ? final : 'claude -n ' + aspas(this.nome) + ' ' + aspas(final);
      enviar({ tipo: 'term-entrada', dono: this.p.eu, id: this.id, dados: dados });
      setTimeout(function () { enviar({ tipo: 'term-entrada', dono: eu.p.eu, id: eu.id, dados: '\r' }); }, 40);
    }
    this.v.enter();
    O.acender(this.cabEl, 1500);
    this.marcarTempo('pedido enviado');
    this.pintar();
  };
  S.mencionar = function () {
    var t = ' ' + normalizar(this.inputEl.value) + ' ', achadas = [];
    (L().estado.pessoas || []).forEach(function (p) {
      var n = normalizar(p.nome);
      if (n && p.id !== undefined && new RegExp('[^a-z0-9]' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^a-z0-9]').test(t)) achadas.push(p);
    });
    this.mencaoEl.hidden = !achadas.length;
    var U = BC.util || {};
    this.mencaoEl.innerHTML = achadas.map(function (p) {
      var area = L().estado.areas && L().estado.areas[p.area];
      return '<button type="button" class="term-chip-pessoa" data-term="pessoa:' + esc(p.id) + '" style="--cor:' + esc(p.cor) + '">' + (U.avatar ? U.avatar(p, 16) : '') + '<span>' + esc(p.nome) + '</span>' + (area ? '<small>' + esc(area) + '</small>' : '') + '</button>';
    }).join('') + (achadas.length ? '<span>pessoa reconhecida · o agente sabe de quem se trata</span>' : '');
  };

  /* ---------- cliques da sessão ---------- */
  S.clique = function (q, b) {
    var bl = b.closest('.tr-bloco');
    switch (q) {
      case 'iniciar': this.iniciarAgente(false); return;
      case 'so-terminal': this.soTerminal = !this.soTerminal; guardar(CHAVE.so + this.agId, this.soTerminal ? '1' : '0'); if (this.soTerminal) this.definirFace('terminal'); this.pintar(); this.p.pintarBarra(); if (this.soTerminal) this.focar(); return;
      case 'receita': { var r = (this.receitas || [])[+b.dataset.i]; if (r) { this.inputEl.value = r[1]; this.mencionar(); this.inputEl.focus(); this.inputEl.setSelectionRange(r[1].length, r[1].length); } return; }
      case 'end-tirar': if (this.objeto) { this.enderecoTirado = this.objeto.chave; this.pintarObjeto(this.objeto); this.inputEl.focus(); } return;
      case 'reabrir': this.term.reset(); this.abrir(); return;
      case 'ok': if (bl) this.decidir(bl.dataset.bid, b.dataset.d === 'negar' ? 'negar' : 'permitir'); return;
      case 'ver-terminal': case 'eu-mesmo': this.definirFace('terminal'); this.p.pintarBarra(); this.focar(); return;
      case 'tentar': if (this.p.pedidoPeloServidor()) { enviar({ tipo: 'agente-pedido', id: this.id, texto: 'Tente de novo o último passo que falhou.' }); this.v.enter(); } else { this.inputEl.value = 'Tente de novo o último passo que falhou.'; this.inputEl.focus(); } return;
      case 'ajuda': if (E()) { E().abrir('chat'); E().aviso('Conte no chat o que travou: a equipe vê o bloco de falha no seu terminal.'); } return;
      case 'mais-txt': if (bl && this.porBid[bl.dataset.bid]) { this.porBid[bl.dataset.bid].aberto = true; this.bloco(this.porBid[bl.dataset.bid].b); } return;
      case 'arq': { var a = L().arquivo(b.dataset.caminho); if (a && BC.explorador) BC.explorador.abrirArquivo(a.id); return; }
      case 'clone': if (BC.navegadorReal && BC.navegadorReal.abrirClone) BC.navegadorReal.abrirClone(b.dataset.rel); return;
      case 'nav-ver': if (BC.navegadorReal && BC.navegadorReal.abrir) BC.navegadorReal.abrir({ id: this.id, nome: this.nome, cor: this.cor || null }); return;
      default: return;
    }
  };

  /* ---------- faces, foco e o xterm ---------- */
  S.definirFace = function (f) {
    if (f !== 'terminal' && f !== 'presenca') return;
    this.face = f;
    this.el.dataset.face = f;
    guardar(CHAVE.face + this.agId, f);
    if (f === 'terminal') { this.garantirXterm(); this.ajustar(); }
    if (f === 'presenca' && this.bPendente) this.bEntrada(false);
    this.pintarCab();
  };
  S.focar = function () {
    if (this.face === 'terminal') { this.garantirXterm(); if (this.xtermAberto) this.term.focus(); }
    else this.inputEl.focus();
  };
  S.mostrado = function () {
    this.garantirXterm();
    this.ajustar();
    this.pintarSelo(this.p.controles);
    this.pintar();
    if (this.bPendente && this.face === 'presenca') this.bEntrada(false);
  };
  S.garantirXterm = function () {
    if (this.xtermAberto || this.destruida || this.el.hidden || !this.xtermEl.isConnected) return;
    var r = this.xtermEl.getBoundingClientRect();
    if (!r.width || !r.height) return; /* painel recolhido: abre quando aparecer */
    this.term.open(this.xtermEl);
    this.xtermAberto = true;
    var eu = this, raf = 0;
    /* dentro do terminal, as teclas não sobem para os atalhos da Estação (só Cmd+… e Ctrl+`) */
    this.xtermEl.addEventListener('keydown', function (ev) { if (!teclaDoApp(ev)) ev.stopPropagation(); });
    if (window.ResizeObserver) {
      this.ro = new ResizeObserver(function () { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; eu.ajustar(); }); });
      this.ro.observe(this.xtermEl);
    }
    this.degradeVars();
  };
  S.proporcao = function () {
    if (!this.xtermAberto) return null;
    var d = null;
    try { d = this.fit.proposeDimensions(); } catch (e) { d = null; }
    if (!d || !isFinite(d.cols) || !isFinite(d.rows) || d.cols < 2 || d.rows < 1) return null;
    return { cols: Math.min(500, d.cols), rows: Math.min(200, d.rows) };
  };
  /* fit + term-tamanho (só o dono redimensiona; o shell redesenha) */
  S.ajustar = function () {
    if (this.el.hidden) return;
    if (!this.xtermAberto) { this.garantirXterm(); if (!this.xtermAberto) return; }
    var d = this.proporcao();
    if (!d) return;
    if (d.cols !== this.term.cols || d.rows !== this.term.rows) this.term.resize(d.cols, d.rows);
    this.p.dims = d;
    if (this.aberta && (d.cols !== this.enviado.cols || d.rows !== this.enviado.rows)) {
      this.enviado = { cols: d.cols, rows: d.rows };
      enviar({ tipo: 'term-tamanho', id: this.id, cols: d.cols, rows: d.rows });
    }
    this.degradeVars();
  };
  /* o degradê do texto é "fixed": as bordas do corpo na janela viram as paradas do degradê */
  S.degradeVars = function () {
    if (!this.xtermAberto || this.el.hidden) return;
    var r = this.xtermEl.getBoundingClientRect();
    if (!r.width) return;
    var a = Math.round(r.left + 14), z = Math.round(r.right - 14), chave = a + ':' + z;
    if (chave === this.degradeChave) return;
    this.degradeChave = chave;
    this.xtermEl.style.setProperty('--tr-g0', a + 'px');
    this.xtermEl.style.setProperty('--tr-g1', Math.round(a + (z - a) * 0.55) + 'px');
    this.xtermEl.style.setProperty('--tr-g2', z + 'px');
  };

  /* ---------- pintura: cabeçalho, aba, selo, linha do tempo ---------- */
  S.correndo = function () { if (this.pausada || this.fim) return false; if (this.modoAgente) return this.agente.estado === 'pensando' || this.agente.estado === 'rodando'; return this.v.estado() === 'rodando'; };
  S.estadoGlobal = function () {
    if (this.pausada || this.fim) return '';
    if (this.modoAgente && this.agente.estado) {
      var a = this.agente.estado;
      if (a === 'pensando' || a === 'rodando' || a === 'espera') return a;
      return a === 'terminou' && Date.now() - this.agente.ts < 2000 ? 'terminou' : '';
    }
    var e = this.v.estado();
    if (e === 'rodando' || e === 'espera') return e;
    return e === 'terminou' && Date.now() - this.tEstado < 2000 ? 'terminou' : '';
  };
  S.frase = function () {
    if (this.fim) return this.codigoFim ? 'o shell caiu · código ' + this.codigoFim : 'desligado';
    if (this.pausada) return 'transmissão pausada';
    if (this.esperandoTela && !this.aberta) return 'abrindo…';
    if (this.modoAgente && this.agente.estado) {
      var a = this.agente, agora = Date.now();
      switch (a.estado) {
        case 'acordou': return 'acordou · ' + hora(a.ts);
        case 'pensando': return 'pensando há ' + O.duracaoTexto(agora - (this.turnoDesde || agora));
        case 'rodando': return (a.ferramenta ? a.ferramenta + ' · ' : '') + 'rodando há ' + O.duracaoTexto(agora - (a.desde || agora));
        case 'espera': return 'espera o seu OK';
        case 'parado': return 'parado por você · ' + hora(a.ts);
        default: return this.v.frase();
      }
    }
    return this.v.frase();
  };
  S.alvo = function () {
    if (this.modoAgente) {
      for (var i = this.blocos.length - 1; i >= 0 && i >= this.blocos.length - 8; i--) { var arqs = arquivosDe(this.blocos[i].b); if (arqs.length) return arqs[0]; }
      return this.agente.ferramenta || this.provedor;
    }
    var e = this.v.estado(), shell = !this.processo || this.estadoTerm === 'shell';
    if (!shell && (e === 'rodando' || e === 'espera' || e === 'terminou' || e === 'falhou')) return this.processo;
    return this.p.pastaCurta();
  };
  S.pintar = function () {
    if (this.destruida) return;
    var e = this.v.estado();
    if (e !== this.estadoVisto) { this.estadoVisto = e; this.tEstado = Date.now(); }
    this.el.dataset.estado = e;
    this.el.dataset.vivo = this.modoAgente || e === 'rodando' || e === 'espera' ? 'sim' : 'nao';
    this.abaEl.dataset.estado = e;
    this.abaEl.querySelector('.tr-aba-nome').textContent = this.nome;
    this.abaEl.title = this.nome + ' · ' + this.frase() + ' · duplo clique renomeia';
    var x = this.abaEl.querySelector('.tr-x'); if (x && !x.classList.contains('confirmar')) x.setAttribute('aria-label', 'Apagar o agente ' + this.nome);
    this.el.setAttribute('aria-label', 'Agente ' + this.nome);
    /* iniciar: só com o shell livre (nunca digita "claude" dentro de um programa rodando) */
    var livre = this.aberta && !this.fim && !this.modoAgente && !this.claudeNaFrente && (this.estadoTerm === 'shell' || this.estadoTerm === 'terminou');
    this.iniciarEl.hidden = !livre;
    var bi = this.iniciarEl.querySelector('[data-tr="iniciar"]'); bi.textContent = (this.iniciandoAgente ? 'Iniciando ' : '▶ Iniciar ') + (this.provedor === 'codex' ? 'Codex' : this.nome); bi.disabled = this.iniciandoAgente;
    var so = this.iniciarEl.querySelector('[data-tr="so-terminal"]'); so.setAttribute('aria-pressed', this.soTerminal ? 'true' : 'false'); so.title = this.soTerminal ? 'este agente abre só o terminal (clique para iniciar sozinho de novo)' : 'abrir este agente só como terminal, sem iniciar o agente';
    this.pintarCab();
    this.pintarVazio();
    this.p.agenteGlobal();
  };
  S.pintarCab = function () {
    var q = function (s) { return this.el.querySelector(s); }.bind(this);
    q('.tr-alvo-txt').textContent = this.alvo();
    q('.tr-nome').textContent = this.nome + ' · ' + (this.provedor === 'codex' ? 'Codex' : 'Claude Code') + (this.oficina ? ' · Oficina' : '');
    q('.tr-est').textContent = this.frase();
    var vivo = q('.tr-vivo');
    vivo.textContent = this.pausada ? '⏸ pausado' : '● ao vivo';
    vivo.dataset.pausada = this.pausada ? 'sim' : 'nao';
    vivo.title = this.pausada ? 'Transmissão deste terminal pausada: ninguém vê (clique para retomar)' : 'Quem assiste vê este terminal ao vivo (clique para pausar a transmissão deste terminal)';
    vivo.hidden = !this.aberta;
    q('.tr-parar').hidden = !this.podeParar();
    q('.tr-parar').title = this.provedor === 'codex' ? 'Interromper o turno do Codex' : 'Parar o agente agora (Esc)';
  };
  /* o botão Parar só existe enquanto o agente pensa ou roda, no terminal aberto de quem é dono
     (a pausa é só da transmissão: o claude segue rodando e o servidor aceita as teclas do dono, então o Parar fica) */
  S.podeParar = function () {
    if (!this.aberta || this.fim || !this.modoAgente) return false;
    return this.agente.estado === 'pensando' || this.agente.estado === 'rodando';
  };
  /* Esc é como o Claude Code interrompe. Interrupção não dispara o gancho Stop, então o turno fecha aqui:
     o botão some e um segundo clique não manda outro Esc (Esc duplo abre o rewind do Claude Code) */
  S.parar = function () {
    if (!this.podeParar()) return;
    if (this.provedor === 'codex') enviar({ tipo: 'agente-interromper', id: this.id });
    else this.tecla('\x1b');
    var agora = Date.now(), dur = this.turnoAtivo ? Math.max(0, agora - this.turnoDesde) : 0;
    this.turnoAtivo = false; this.parouEm = agora;
    this.agente = { estado: 'parado', ferramenta: null, desde: agora, ts: agora };
    if (!this.pausada) this.v.atividade({ estado: 'shell', processo: this.provedor, desde: agora }); /* calmo, sem som de concluído */
    this.fecharEsperasAbertas();
    this.marcarTempo('você pediu para parar' + (dur ? ' · ' + O.duracaoTexto(dur) : ''));
    this.pintar();
  };
  /* o servidor não soube do Esc e ainda guarda 'pensando': o próximo pedido não repete o estado, só chega o bloco do pedido */
  S.pedidoDepoisDeParar = function (b) {
    var ts = +b.ts || 0;
    if (b.tipo !== 'pedido' || this.agente.estado !== 'parado' || ts <= this.parouEm) return;
    this.agenteEstado({ estado: 'pensando', desde: ts, ts: ts });
  };
  S.marcarTempo = function (texto) {
    this.tempo.unshift({ t: Date.now(), texto: String(texto || '').trim() });
    if (this.tempo.length > 4) this.tempo.length = 4;
    var ol = this.el.querySelector('.tr-tempo');
    ol.innerHTML = this.tempo.map(function (x) { return '<li>' + esc(x.texto) + ' · ' + hora(x.t) + '</li>'; }).join('');
  };
  S.pintarSelo = function (controles) {
    var eu = this.p.eu, id = this.id;
    var meus = (controles || []).filter(function (c) { return c && c.dono === eu && (c.sessao == null || c.sessao === id) && (c.estado === 'ativo' || c.estado === 'pedido'); });
    var ativos = meus.filter(function (c) { return c.estado === 'ativo'; });
    var sig = meus.map(function (c) { return c.id + c.estado; }).join('|');
    var olho = this.abaEl.querySelector('.tr-olho');
    olho.hidden = !ativos.length; olho.textContent = ativos.length ? '◉ ' + ativos.length : '';
    if (sig === this.visitas) return;
    var antes = this.visitas;
    this.visitas = sig;
    var lista = [];
    ativos.forEach(function (c) { if (!lista.some(function (x) { return x.id === c.quem; })) lista.push({ id: c.quem, nome: L().nome(c.quem), cor: corDe(c.quem) }); });
    var novos = ativos.filter(function (c) { return antes.indexOf(c.id + 'ativo') < 0; });
    this.v.visitantes(lista);
    var nome = this.nome;
    this.seloEl.hidden = !meus.length;
    this.seloEl.innerHTML = meus.map(function (c) {
      var n = L().nome(c.quem), cor = corDe(c.quem);
      if (c.estado === 'ativo') return '<div class="tr-selo-linha" data-c="' + esc(c.id) + '" style="--cor:' + esc(cor) + '"><span class="tr-selo-anel">' + esc(iniciais(n)) + '</span><span class="tr-selo-txt">● <b>' + esc(n) + '</b> está no seu terminal <b>' + esc(nome) + '</b></span><button type="button" data-tr="encerrar" data-c="' + esc(c.id) + '">Encerrar</button></div>';
      return '<div class="tr-selo-linha pedido" data-c="' + esc(c.id) + '" style="--cor:' + esc(cor) + '"><span class="tr-selo-anel">' + esc(iniciais(n)) + '</span><span class="tr-selo-txt"><b>' + esc(n) + '</b> pede para entrar no seu terminal <b>' + esc(nome) + '</b></span><button type="button" data-tr="aceitar" data-c="' + esc(c.id) + '">Aceitar</button><button type="button" data-tr="recusar" data-c="' + esc(c.id) + '">Recusar</button></div>';
    }).join('');
    var eu2 = this;
    Array.prototype.forEach.call(this.seloEl.querySelectorAll('.tr-selo-linha'), function (l) { O.acender(l, 300000); });
    novos.forEach(function (c) { eu2.marcarTempo(primeiroNome(c.quem) + ' entrou'); });
    if (novos.length) O.acender(this.cabEl, 6000);
  };

  /* ================================================================== troca a classe simulada pela real */
  Object.defineProperty(P, 'entrada', {
    get: function () { var s = this.ativa(); if (s) return s.inputEl; if (!this._entradaVazia) this._entradaVazia = document.createElement('input'); return this._entradaVazia; }
  });
  BC.TerminalSimulado = BC.Terminal;
  BC.Terminal = Painel;

  /* ================================================================== API (testes e as outras peças da interface) */
  function sessaoDe(id) { return painelAtual && (id ? painelAtual.sessoes[id] : painelAtual.ativa()) || null; }
  /* troca de modo (Tech | Vibe na barra de cima, estacao.js E.tema): cada xterm troca de tema na hora, sem recriar nada */
  var temaUsado = temaAgora();
  new MutationObserver(function () {
    var t = temaAgora();
    if (t === temaUsado) return;
    temaUsado = t;
    if (!painelAtual) return;
    Object.keys(painelAtual.sessoes).forEach(function (id) {
      var s = painelAtual.sessoes[id];
      if (s && s.term) { s.term.options.theme = t; s.term.options.minimumContrastRatio = t === TEMA_VIBE ? 4.5 : 1; }
    });
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema-estacao', 'data-vista'] });

  BC.terminalReal = {
    versao: '1.0.0',
    pronto: function () { return !!(painelAtual && painelAtual.pronto); },
    editarOficina: function (pasta) {
      if (!painelAtual || !painelAtual.pronto) return null;
      var s = painelAtual.ativa();
      var id = BC.terminalReal.novoAgente('Oficina', { provedor: s ? s.provedor : 'codex', oficina: true, oQueFaz: 'Evoluir Babel Coop na cópia autorizada pela Oficina' + (pasta ? ': ' + pasta : '') + '. Aplicar as mudanças para revisão; empacotar somente quando a pessoa pedir.' });
      if (E()) E().alternarTerminal(true);
      painelAtual.face('presenca', id);
      return id;
    },
    eu: function () { return painelAtual ? painelAtual.eu : null; },
    ativa: function () { return painelAtual ? painelAtual.aba : null; },
    sessoes: function () {
      if (!painelAtual) return [];
      return painelAtual.ordem.map(function (id) {
        var s = painelAtual.sessoes[id];
        return s ? { id: s.id, agente: s.agId, nome: s.nome, aberta: s.aberta, pid: s.info ? s.info.pid : null, estado: s.v.estado(), face: s.face, pausada: s.pausada, modoAgente: s.modoAgente, agenteEstado: s.agente.estado, blocos: s.nBlocos, cols: s.term.cols, rows: s.term.rows, frase: s.frase(), alvo: s.alvo() } : null;
      }).filter(Boolean);
    },
    abrirAba: function (id) { if (painelAtual) painelAtual.ativar(id, true); },
    face: function (f, id) { if (painelAtual) painelAtual.face(f, id); },
    /* leitura só-leitura do que o xterm mostra (as últimas n linhas do buffer) */
    ler: function (id, n) { var s = sessaoDe(id); return s ? lerBuffer(s.term, n) : ''; },
    blocos: function (id) { var s = sessaoDe(id); return s ? s.blocos.map(function (r) { return { bid: r.b.bid, tipo: r.b.tipo, titulo: r.b.titulo || '', texto: r.b.texto || '', decidido: r.decidido ? r.decidido.decisao : null, arquivos: Array.isArray(r.b.arquivos) ? r.b.arquivos.slice() : [], navegador: r.b.navegador || null, senha: !!r.b.senha, pid: r.b.pid || null }; }) : []; },
    plano: function (id) { var s = sessaoDe(id); return s && s.planoItens ? s.planoItens.map(function (x) { return { texto: x.texto, estado: x.estado }; }) : []; },
    medidas: function () { return painelAtual ? JSON.parse(JSON.stringify(painelAtual.med)) : {}; },
    /* as teclas de verdade chegam pelo xterm; isto é para os testes e para receitas de outras peças (mesmo caminho: term-entrada) */
    digitar: function (id, dados) { var s = sessaoDe(id); if (s) s.tecla(String(dados || '')); },
    presenca: function (id) { var s = sessaoDe(id); return s ? s.presenca : null; },
    planoConfianca: function (id) { var s = sessaoDe(id); return s ? s.planoConfianca() : null; },
    novoAgente: function (nome, opcoes) {
      if (!painelAtual) return null;
      opcoes = opcoes || {};
      var id = opcoes.id || 'ag-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      if (opcoes.soTerminal) guardar(CHAVE.so + id, '1');
      guardar(CHAVE.provedor + id, opcoes.provedor === 'codex' ? 'codex' : 'claude');
      if (opcoes.oficina) guardar(CHAVE.oficina + id, '1');
      painelAtual.abaDesejada = id;
      L().fazer('novoAgente', { id: id, nome: String(nome || 'Agente').slice(0, 18), oQueFaz: opcoes.oQueFaz || '', visivel: true });
      painelAtual.sincronizar();
      return id;
    }
  };
})();
