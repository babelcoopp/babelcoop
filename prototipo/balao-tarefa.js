/* Babel Coop — protótipo · a caixa que sai da frase, no Meu dia (camada profundidade, 26/09/2026)
   · Tarefa do Meu dia: a linha inclina para o ponteiro e a tarefa inteira sai do título, embaixo dele.
   · Frase da lista lateral (Caixa de entrada, Esperando meu OK…): a parte inteira sai da frase, ao lado.
   O clique continua fazendo o que fazia (abrir a tarefa, rolar até a parte). Teclado: Tab abre, Esc fecha.
   Só lê o estado (BC.loja) e a tela; não grava nada. Visual em profundidade.css. Retirada: tirar o <script> de index.html. */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var ESPERA_ABRIR = 110, ESPERA_FECHAR = 90, MAX_LISTA = 5;
  var balao = null, alvo = null, pendente = null, tAbrir = 0, tFechar = 0, laco = 0, ponteiro = null;
  var reduzir = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function L() { return BC.loja; }
  function U() { return BC.util; }
  function esc(s) { return U().esc(s == null ? '' : String(s)); }
  function ligado() { return document.documentElement.getAttribute('data-vista') === 'estacao'; }
  function seletorId(v) { return window.CSS && CSS.escape ? CSS.escape(v) : v; }

  /* só no Meu dia: é a única vista com a seção #sec-caixa */
  function meuDia() {
    var c = document.getElementById('e-conteudo');
    return c && c.querySelector('#sec-caixa') ? c : null;
  }

  /* o que está sob o elemento: uma frase da lista lateral, uma demanda ou uma tarefa de fluxo */
  function linhaDe(el) {
    var c = meuDia();
    if (!c || !el || !el.closest) return null;
    var lat = el.closest('.lat-item[data-acao="rolar"]'), lateral = document.getElementById('e-lateral');
    if (lat && lateral && lateral.contains(lat) && lat.dataset.alvo) return { item: lat, id: lat.dataset.alvo, tipo: 'secao' };
    var item = el.closest('.item');
    if (!item || !c.contains(item)) return null;
    var abre = item.matches('[data-acao="abrir-demanda"], [data-acao="abrir-tarefa"]') ? item
      : item.querySelector('[data-acao="abrir-demanda"], [data-acao="abrir-tarefa"]');
    if (!abre || !abre.dataset.id) return null;
    return { item: item, id: abre.dataset.id, tipo: abre.dataset.acao === 'abrir-tarefa' ? 'tarefa' : 'demanda' };
  }

  function acharDeNovo(l) {
    var sel = l.tipo === 'secao' ? '#e-lateral .lat-item[data-alvo="' + seletorId(l.id) + '"]' : '#e-conteudo [data-id="' + seletorId(l.id) + '"]';
    var el = document.querySelector(sel);
    return el && linhaDe(el);
  }

  /* ---------- conteúdo ---------- */

  function quem(id) { return id === L().eu ? 'você' : L().nome(id); }
  function avatar(id) { var p = L().pessoa(id); return p ? U().avatar(p, 22) : ''; }
  function prioridade(p) { return p ? '<span class="bt-prio ' + esc(p) + '">prioridade ' + esc(p) + '</span>' : ''; }
  function rodape(esquerda, direita) {
    return '<p class="bt-rodape"><span>' + (esquerda || '') + '</span><span>' + (direita || 'Clique para abrir') + '</span></p>';
  }
  function prazoTexto(ts) { var p = U().prazo(ts); return ts ? 'prazo ' + p.texto + (p.classe === 'hoje' ? ' ' + U().hora(ts) : '') : 'sem prazo'; }

  function conteudoDemanda(d) {
    var u = U(), pz = u.prazo(d.prazo), t = d.inicio ? L().tempo(d) : null;
    var pausas = (d.pausas || []).length, ultimo = (d.historico || [])[(d.historico || []).length - 1];
    var prazo = esc(pz.texto) + (d.prazo && pz.classe === 'hoje' ? ' ' + u.hora(d.prazo) : '');
    return '<div class="bt-topo">' + BC.demandasUI.pill(d) + prioridade(d.prioridade) + '</div>' +
      '<p class="bt-titulo">' + esc(d.titulo) + '</p>' +
      (d.descricao ? '<p class="bt-desc">' + esc(d.descricao) + '</p>' : '') +
      '<p class="bt-gente">' + avatar(d.de) + '<span>' + esc(quem(d.de)) + '</span><span class="bt-seta" aria-label="para">→</span>' +
        (d.para ? avatar(d.para) + '<span>' + esc(quem(d.para)) + '</span>' : '<span>quem puder pegar</span>') + '</p>' +
      '<dl class="bt-dados">' +
        '<div><dt>Prazo</dt><dd class="' + pz.classe + '">' + prazo + '</dd></div>' +
        '<div><dt>Estimativa</dt><dd>' + (d.estimativaMin ? esc(u.duracao(d.estimativaMin * u.MIN)) : 'sem') + '</dd></div>' +
        '<div><dt>Trabalhado</dt><dd>' + (t ? esc(u.duracao(t.trabalho)) + (pausas ? '<br>' + pausas + (pausas === 1 ? ' pausa' : ' pausas') : '') : 'não começou') + '</dd></div>' +
      '</dl>' +
      rodape(ultimo ? esc(quem(ultimo.quem)) + ' ' + esc(ultimo.acao) + ' ' + esc(u.relativo(ultimo.ts)) : '');
  }

  function conteudoTarefa(t) {
    var u = U(), f = L().fluxo(t.fluxo), pz = u.prazo(t.prazo);
    var etapas = f.etapas.map(function (nome, i) {
      var cls = i < t.atual ? 'feita' : i === t.atual ? 'agora' : '';
      return '<li class="' + cls + '"' + (i === t.atual ? ' aria-current="step"' : '') + '><b>' + esc(nome) + '</b>' + esc(quem(t.donos[i])) + '</li>';
    }).join('');
    var lista = (t.checklist || []).map(function (c) { return '<li class="' + (c.feito ? 'feito' : '') + '">' + esc(c.texto) + '</li>'; }).join('');
    return '<div class="bt-topo"><span class="chip">' + esc(f.nome) + '</span>' + prioridade(t.prioridade) + '</div>' +
      '<p class="bt-titulo">' + esc(t.titulo) + '</p>' +
      '<ol class="bt-etapas" aria-label="Etapas do fluxo">' + etapas + '</ol>' +
      (lista ? '<ul class="bt-check">' + lista + '</ul>' : '') +
      '<dl class="bt-dados">' +
        '<div><dt>Prazo</dt><dd class="' + pz.classe + '">' + esc(pz.texto) + '</dd></div>' +
        '<div><dt>Andamento</dt><dd>' + L().pct(t) + '%</dd></div>' +
        '<div><dt>Chegou</dt><dd>' + (t.paradaDesde ? esc(u.relativo(t.paradaDesde)) : 'agora') + '</dd></div>' +
      '</dl>' +
      rodape(t.atual > 0 ? 'Passada por ' + esc(quem(t.donos[t.atual - 1])) : 'Começa com você');
  }

  /* uma linha da lista dentro da caixa: título e, embaixo, de quem é e o prazo */
  function linhaDemanda(d) {
    var eu = L().eu;
    var dono = !d.para ? 'pedida por ' + quem(d.de) : d.para === eu ? 'de ' + quem(d.de) : 'para ' + quem(d.para);
    return '<li style="--c:' + (BC.demandasUI.cor[d.estado] || '#2ad5e5') + '"><b>' + esc(d.titulo) + '</b><small>' + esc(dono + ' · ' + prazoTexto(d.prazo)) + '</small></li>';
  }
  function linhaTarefa(t) {
    var f = L().fluxo(t.fluxo);
    return '<li style="--c:#8670ff"><b>' + esc(t.titulo) + '</b><small>' + esc(f.nome + ' · etapa ' + (f.etapas[t.atual] || 'fim') + ' · ' + prazoTexto(t.prazo)) + '</small></li>';
  }
  function lista(linhas, vazio) {
    if (!linhas.length) return '<p class="bt-vazio">' + vazio + '</p>';
    return '<ul class="bt-lista">' + linhas.slice(0, MAX_LISTA).join('') + '</ul>' +
      (linhas.length > MAX_LISTA ? '<p class="bt-mais">e mais ' + (linhas.length - MAX_LISTA) + '</p>' : '');
  }
  function contagem(n, um, varios) { return n === 1 ? um : n + ' ' + varios; }

  function conteudoSecao(l) {
    var e = L().estado, eu = L().eu, u = U(), nome = (l.item.querySelector('.rotulo-texto') || l.item).textContent.trim();
    var corpo = '', resumo = '';
    if (l.id === 'sec-caixa') {
      var novas = e.demandas.filter(function (d) { return d.para === eu && d.estado === 'enviada'; }), fluxo = BC.comigo ? BC.comigo() : [];
      var n = novas.length + fluxo.length;
      resumo = n ? contagem(n, '1 coisa chegou para você.', 'coisas chegaram para você.') : '';
      corpo = lista(novas.map(linhaDemanda).concat(fluxo.map(linhaTarefa)), 'Nada novo. Bom sinal.');
    } else if (l.id === 'sec-ok') {
      var prontas = e.demandas.filter(function (d) { return d.de === eu && d.estado === 'pronta'; });
      resumo = prontas.length ? contagem(prontas.length, '1 entrega espera o seu OK.', 'entregas esperam o seu OK.') : '';
      corpo = lista(prontas.map(linhaDemanda), 'Ninguém esperando você.');
    } else if (l.id === 'sec-livres') {
      var livres = e.demandas.filter(function (d) { return d.estado === 'livre'; });
      resumo = livres.length ? 'Quem puder, pega e começa.' : '';
      corpo = lista(livres.map(linhaDemanda), 'Nenhuma tarefa livre agora.');
    } else if (l.id === 'sec-passos') {
      var passos = [].slice.call(document.querySelectorAll('#sec-passos label.passo')).map(function (lb) {
        var c = lb.querySelector('input'); return { texto: lb.textContent.trim(), feito: !!(c && c.checked) };
      });
      var feitos = passos.filter(function (p) { return p.feito; }).length;
      resumo = feitos + ' de ' + passos.length + ' feitos.';
      corpo = '<div class="bt-barra" style="--v:' + (passos.length ? Math.round(feitos / passos.length * 100) : 0) + '%"><i></i></div>' +
        '<ul class="bt-check">' + passos.map(function (p) { return '<li class="' + (p.feito ? 'feito' : '') + '">' + esc(p.texto) + '</li>'; }).join('') + '</ul>';
    } else if (l.id === 'sec-contrib') {
      corpo = '<dl class="bt-dados dois">' + [].slice.call(document.querySelectorAll('#sec-contrib .numero')).map(function (nu) {
        var s = nu.querySelector('small'), b = nu.querySelector('b');
        return '<div><dt>' + esc(s ? s.textContent : '') + '</dt><dd>' + esc(b ? b.textContent : '') + '</dd></div>';
      }).join('') + '</dl>';
    } else if (l.id === 'sec-pergunta') {
      var p = e.pergunta, minha = p.respostas.filter(function (r) { return r.pessoa === eu; })[0];
      resumo = contagem(p.respostas.length, '1 resposta até agora.', 'respostas até agora.');
      corpo = '<p class="bt-pergunta">' + esc(p.texto) + '</p>' +
        (minha ? '<p class="bt-desc">Você respondeu: “' + esc(minha.texto) + '”</p>' : '<p class="bt-vazio">Você ainda não respondeu. A resposta vai para a TV e o acervo.</p>');
    } else if (l.id === 'sec-ideias') {
      var ideias = e.ideias.slice().sort(function (a, b) { return b.apoios.length - a.apoios.length; });
      resumo = ideias.length ? 'As mais apoiadas primeiro.' : '';
      corpo = lista(ideias.map(function (i) {
        return '<li style="--c:' + ((L().pessoa(i.pessoa) || {}).cor || '#2ad5e5') + '"><b>' + esc(i.texto) + '</b><small>' +
          esc(quem(i.pessoa) + ' · ' + contagem(i.apoios.length, '1 apoio', 'apoios')) + '</small></li>';
      }), 'Nenhuma ideia ainda. A primeira pode ser sua.');
    } else if (l.id === 'sec-checkin') {
      var ck = e.checkins[eu], hoje = ck && u.mesmoDia(ck.ts);
      corpo = hoje ? '<p class="bt-desc">' + esc(ck.hoje) + '</p>' + (ck.bloqueio ? '<p class="bt-bloqueio">Bloqueio: ' + esc(ck.bloqueio) + '</p>' : '')
        : '<p class="bt-vazio">Você ainda não fez o check-in de hoje: o que vai fazer e se tem algum bloqueio.</p>';
      resumo = hoje ? 'Feito às ' + u.hora(ck.ts) + '.' : '';
    } else {
      return null;
    }
    return '<p class="bt-titulo">' + esc(nome) + '</p>' + (resumo ? '<p class="bt-resumo">' + esc(resumo) + '</p>' : '') + corpo +
      rodape('', 'Clique para ir até lá');
  }

  function conteudo(l) {
    if (l.tipo === 'secao') return conteudoSecao(l);
    var d = l.tipo === 'tarefa' ? L().tarefa(l.id) : L().demanda(l.id);
    return d ? (l.tipo === 'tarefa' ? conteudoTarefa(d) : conteudoDemanda(d)) : null;
  }

  /* ---------- a caixa ---------- */

  function criarBalao() {
    if (balao) return balao;
    balao = document.createElement('div');
    balao.className = 'balao-tarefa';
    balao.id = 'balao-tarefa';
    balao.setAttribute('role', 'tooltip');
    balao.dataset.aberto = 'nao';
    document.body.appendChild(balao);
    return balao;
  }

  function posicionar() {
    if (!alvo || !balao) return;
    var larg = balao.offsetWidth, alt = balao.offsetHeight, m = 12, s = balao.style;
    if (alvo.tipo === 'secao') {
      /* a frase fica na lateral: a caixa sai dela para o lado, com o bico na altura do texto */
      var frase = (alvo.item.querySelector('.rotulo-texto') || alvo.item).getBoundingClientRect();
      var linha = alvo.item.getBoundingClientRect(), meio = frase.top + frase.height / 2;
      var esqL = Math.max(m, Math.min(window.innerWidth - larg - m, linha.right + 14));
      var topoL = Math.max(m, Math.min(window.innerHeight - alt - m, meio - 28));
      balao.dataset.lado = 'direita';
      s.left = Math.round(esqL) + 'px';
      s.top = Math.round(topoL) + 'px';
      s.setProperty('--rabo-x', '0px');
      s.setProperty('--rabo-y', Math.round(meio - topoL) + 'px');
      s.setProperty('--origem-y', Math.round(meio - topoL) + 'px');
      return;
    }
    /* título de tarefa: o bico aponta para o começo do texto; a caixa desce dele (ou sobe, se faltar espaço) */
    var tit = alvo.item.querySelector('.item-titulo') || alvo.item;
    var r = tit.getBoundingClientRect(), faixa = document.createRange();
    faixa.selectNodeContents(tit);
    var fimTexto = Math.min(r.right, faixa.getBoundingClientRect().right || r.right);
    var bico = r.left + Math.max(14, Math.min(40, (fimTexto - r.left) / 2));
    var esq = Math.max(m, Math.min(window.innerWidth - larg - m, bico - 40));
    var abaixo = r.bottom + 13, acima = r.top - 13 - alt;
    var lado = abaixo + alt <= window.innerHeight - m || acima < m ? 'abaixo' : 'acima';
    balao.dataset.lado = lado;
    s.left = Math.round(esq) + 'px';
    s.top = Math.round(lado === 'abaixo' ? abaixo : acima) + 'px';
    s.setProperty('--rabo-x', Math.round(bico - esq) + 'px');
    s.removeProperty('--rabo-y');
    s.setProperty('--origem-y', lado === 'abaixo' ? '0px' : alt + 'px');
  }

  function prender(l) {
    l.item.classList.add('bt-foco');
    l.item.setAttribute('aria-describedby', 'balao-tarefa');
  }
  function soltar(item) {
    item.classList.remove('bt-foco');
    ['--rx', '--ry', '--mx', '--my'].forEach(function (v) { item.style.removeProperty(v); });
    item.removeAttribute('aria-describedby');
  }

  function mostrar(l) {
    var html = conteudo(l);
    if (!html) return;
    criarBalao();
    if (alvo && alvo.item !== l.item) soltar(alvo.item);
    alvo = l;
    prender(l);
    balao.style.setProperty('--cor', l.item.style.getPropertyValue('--cor') || '#2ad5e5');
    balao.innerHTML = html;
    var jaAberto = balao.dataset.aberto === 'sim';
    posicionar();
    if (ponteiro && l.item.contains(document.elementFromPoint(ponteiro.clientX, ponteiro.clientY))) inclinar(ponteiro);
    if (!jaAberto) {
      void balao.offsetWidth; /* o navegador registra a posição fechada antes de animar */
      balao.dataset.aberto = 'sim';
    }
    vigiar();
  }

  function esconder() {
    clearTimeout(tAbrir);
    pendente = null;
    if (alvo) soltar(alvo.item);
    alvo = null;
    if (balao) balao.dataset.aberto = 'nao';
    cancelAnimationFrame(laco);
  }

  /* o Meu dia se redesenha sozinho: se a linha trocar de elemento, a caixa acompanha a nova */
  function vigiar() {
    cancelAnimationFrame(laco);
    (function passo() {
      if (!alvo) return;
      if (!alvo.item.isConnected) {
        var l = acharDeNovo(alvo);
        if (!l) return esconder();
        alvo = l;
        prender(l);
        posicionar();
      }
      laco = requestAnimationFrame(passo);
    })();
  }

  function inclinar(ev) {
    if (!alvo || reduzir) return;
    var r = alvo.item.getBoundingClientRect();
    var x = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
    var y = Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height));
    var s = alvo.item.style;
    s.setProperty('--ry', ((x - 0.5) * 5).toFixed(2) + 'deg');
    s.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
    s.setProperty('--mx', (x * 100).toFixed(1) + '%');
    s.setProperty('--my', (y * 100).toFixed(1) + '%');
  }

  /* ---------- eventos ---------- */

  document.addEventListener('pointerover', function (ev) {
    if (ev.pointerType === 'touch' || !ligado()) return;
    var l = linhaDe(ev.target);
    if (!l || (alvo && alvo.item === l.item) || (pendente && pendente.item === l.item)) return;
    clearTimeout(tFechar);
    clearTimeout(tAbrir);
    if (alvo) return mostrar(l); /* já aberta: troca na hora */
    pendente = l;
    tAbrir = setTimeout(function () { pendente = null; mostrar(l); }, ESPERA_ABRIR);
  });

  document.addEventListener('pointerout', function (ev) {
    var de = linhaDe(ev.target), para = linhaDe(ev.relatedTarget);
    if (!de || (para && para.item === de.item)) return;
    clearTimeout(tAbrir);
    pendente = null;
    if (!para) tFechar = setTimeout(esconder, ESPERA_FECHAR);
  });

  document.addEventListener('pointermove', function (ev) {
    ponteiro = { clientX: ev.clientX, clientY: ev.clientY };
    if (alvo && alvo.item.contains(ev.target)) inclinar(ev);
  }, { passive: true });

  document.addEventListener('focusin', function (ev) {
    var l = linhaDe(ev.target);
    if (l && ev.target.matches(':focus-visible')) { clearTimeout(tFechar); mostrar(l); }
  });
  document.addEventListener('focusout', function (ev) {
    if (alvo && alvo.item.contains(ev.target)) tFechar = setTimeout(esconder, ESPERA_FECHAR);
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && alvo) esconder(); });
  document.addEventListener('click', function () { if (alvo) esconder(); }, true);
  window.addEventListener('scroll', function () { if (alvo) posicionar(); }, true);
  window.addEventListener('resize', function () { if (alvo) posicionar(); });

  BC.balaoTarefa = { esconder: esconder };
})(window.BC);
