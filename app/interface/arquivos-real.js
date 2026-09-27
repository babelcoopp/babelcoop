/* babel-coop · a árvore real: o explorador mostra a MINHA pasta compartilhada (~/BabelCoop/<id>) e a de quem está conectado
   Carregado pelo servidor (INJETAR) depois da ponte e do limpo, antes do app.js. Só no app real (window.COOP_REAL).
   - lista: GET /api/arquivos (minha) e GET /api/de/<id>/arquivos (dos outros); atualiza com as mensagens 'arquivos' do servidor
   - abrir: o conteúdo vem sob demanda (/api/arquivo?caminho= ou /api/de/<id>/arquivo?caminho=)
   - salvar e criar: PUT /api/arquivo (pedido local, cabeçalho x-coop-quem); nada disso vai para o diário: o disco é a verdade
   - editar e apagar (só na minha pasta): Editar abre o texto editável; Apagar confirma na própria linha (ou na barra da aba), a linha sai
     com movimento, e só então o arquivo sai da pasta compartilhada para a lixeira (~/BabelCoop/.coop/lixeira/<id>, DELETE /api/arquivo);
     "Desfazer" fica alguns segundos na tela (POST /api/arquivo/restaurar) e a linha volta com um brilho curto.
     Arquivo aberto com mudança não salva não se apaga: primeiro salva ou cancela.
   - a pasta de quem está desligado fica pontilhada; abrir dela avisa que o computador está desligado
   Aproveita o editor e a árvore do protótipo: cada arquivo real vira uma entrada de L.estado.arquivos (id = caminho). */
(function () {
  'use strict';
  var BC = window.BC;
  if (!window.COOP_REAL || !BC || !BC.loja || !BC.real || !BC.explorador) return;
  var L = BC.loja;

  var TEXTO = { md: 1, txt: 1, csv: 1, html: 1, js: 1, ts: 1, py: 1, sh: 1, css: 1, json: 1, quadro: 1, mapa: 1 };
  var URL_DIRETA = { imagem: 1, video: 1 };
  var recemCriados = {}; /* caminho → ts: criados por esta tela e ainda não listados pelo servidor */
  var recemApagados = {}; /* caminho → ts: apagados por esta tela; uma lista velha do servidor não traz de volta */
  var carregando = {}, listas = {}, pedindoLista = {};

  function eu() { return L.eu; }
  function real(a) { return !!(a && a._real); }
  function relDe(caminho) { return String(caminho).split('/').slice(1).join('/'); }
  function aviso(t) { if (BC.estacao && BC.estacao.aviso) BC.estacao.aviso(t); }
  function nome(id) { return L.nome ? L.nome(id) : id; }
  function urlDe(a) {
    var r = encodeURIComponent(relDe(a.caminho));
    return a.dono === eu() ? '/api/arquivo?caminho=' + r : '/api/de/' + encodeURIComponent(a.dono) + '/arquivo?caminho=' + r;
  }
  function mudou() { if (L.estado) L._mudou([]); }

  function entrada(f) {
    var a = { id: f.caminho, caminho: f.caminho, dono: f.dono, autor: f.dono, tipo: f.tipo, tamanho: f.tamanho, bytes: f.bytes, modificado: f.modificado,
      conteudo: '', versoes: [], consultas: 0, salvoPor: f.dono, _real: true, _carregado: false };
    if (URL_DIRETA[a.tipo]) { a.conteudo = urlDe(a); a._carregado = true; }
    return a;
  }

  /* ---------- a lista do disco vira a árvore ---------- */
  function aplicarLista(dono, lista) {
    var e = L.estado;
    if (!e || !dono || !Array.isArray(lista)) return;
    listas[dono] = true;
    var vistos = {}, agora = Date.now(), abertos = abertosAgora();
    lista.forEach(function (f) {
      if (!f || typeof f.caminho !== 'string' || f.caminho.split('/')[0] !== dono) return;
      if (recemApagados[f.caminho] && agora - recemApagados[f.caminho] < 8000) return;
      vistos[f.caminho] = true;
      delete recemCriados[f.caminho];
      var a = L.arquivo(f.caminho);
      if (!a) { e.arquivos.push(entrada(f)); return; }
      if (!real(a)) return;
      a.tamanho = f.tamanho; a.bytes = f.bytes; a.tipo = f.tipo;
      /* mudou no disco por fora (o claude, outro editor): recarrega o que estiver aberto; o resto recarrega quando abrir */
      var naTv = e.projecao && e.projecao.caminho === a.caminho;
      var porFora = naTv ? f.modificado > (a.modificado || 0) : f.modificado > (a._gravado || 0) + 1500 && f.modificado > (a.modificado || 0) + 5;
      a.modificado = Math.max(a.modificado || 0, f.modificado);
      if (porFora && a._carregado && !URL_DIRETA[a.tipo]) { a._carregado = false; if (abertos[a.id]) carregar(a); }
    });
    for (var i = e.arquivos.length - 1; i >= 0; i--) {
      var x = e.arquivos[i];
      if (real(x) && x.dono === dono && !vistos[x.caminho] && !(recemCriados[x.caminho] && agora - recemCriados[x.caminho] < 8000)) e.arquivos.splice(i, 1);
    }
    mudou();
  }
  function abertosAgora() {
    var r = {};
    ((BC.estacao && BC.estacao.ui && BC.estacao.ui.abas) || []).forEach(function (t) { if (t.tipo === 'arquivo') r[t.ref] = true; });
    var p = L.estado && L.estado.projecao;
    if (p) { var a = L.arquivo(p.caminho); if (a) r[a.id] = true; }
    return r;
  }
  function buscarLista(dono) {
    if (!dono || pedindoLista[dono]) return;
    pedindoLista[dono] = true;
    fetch(dono === eu() ? '/api/arquivos' : '/api/de/' + encodeURIComponent(dono) + '/arquivos', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (lista) { pedindoLista[dono] = false; if (Array.isArray(lista)) aplicarLista(dono, lista); })
      .catch(function () { pedindoLista[dono] = false; });
  }

  BC.real.ouvir(function (m) {
    if (!m) return;
    if (m.tipo === 'bemvindo' && m.eu && m.eu.pronto) {
      var ui = BC.estacao && BC.estacao.ui;
      if (ui && ui.abertas && ui.abertas[m.eu.id] === undefined) ui.abertas[m.eu.id] = true; /* a minha pasta já aberta */
      buscarLista(m.eu.id);
      (m.pares || []).forEach(function (p) { if (p.ligado) buscarLista(p.id); });
      return;
    }
    if (m.tipo === 'pares') { (m.lista || []).forEach(function (p) { if (p.ligado && !listas[p.id]) buscarLista(p.id); }); mudou(); return; }
    if (m.tipo === 'arquivos') aplicarLista(m.dono, m.lista);
  });

  /* ---------- abrir: o conteúdo real sob demanda ---------- */
  var esperando = {}; /* id → [fn(ok)]: quem pediu o conteúdo enquanto ele já vinha */
  function carregar(a, depois) {
    if (depois) (esperando[a.id] = esperando[a.id] || []).push(depois);
    if (carregando[a.id]) return;
    carregando[a.id] = true;
    var fim = function (ok, erro) {
      carregando[a.id] = false;
      /* o editor só redesenha a aba quando o arquivo muda de data: o conteúdo que acabou de chegar pede a aba montada de novo */
      if (ok && BC.editor && BC.editor.esquecer) BC.editor.esquecer('arq:' + a.id);
      if (ok && BC.tv && BC.tv.proj && L.estado && L.estado.projecao && L.estado.projecao.caminho === a.caminho) BC.tv.proj.chave = null;
      if (!ok) aviso(erro || ('Não deu para abrir "' + a.caminho.split('/').pop() + '".'));
      var fila = esperando[a.id] || []; delete esperando[a.id];
      fila.forEach(function (fn) { try { fn(ok); } catch (e) { /* segue */ } });
      if (BC.estacao && BC.estacao.render) BC.estacao.render();
      if (ok && BC.tv && document.getElementById('vista-tv') && !document.getElementById('vista-tv').hidden) BC.tv.render();
    };
    var r = fetch(urlDe(a), { cache: 'no-store' });
    if (a.tipo === 'pdf') {
      r.then(function (x) { if (!x.ok) throw new Error(x.status); return x.blob(); }).then(function (b) {
        var fr = new FileReader();
        fr.onload = function () { a.conteudo = String(fr.result).replace(/^data:[^;,]*/, 'data:application/pdf'); a._carregado = true; fim(true); };
        fr.onerror = function () { fim(false); };
        fr.readAsDataURL(b);
      }).catch(function () { fim(false, desligado(a)); });
      return;
    }
    r.then(function (x) { return x.json().then(function (j) { if (!x.ok) throw new Error(j.erro || x.status); return j; }); })
      .then(function (j) {
        if (typeof j.conteudo === 'string') { a.conteudo = j.conteudo; a._carregado = true; a._gravado = Date.now(); fim(true); }
        else fim(false);
      })
      .catch(function (e) { fim(false, desligado(a) || String(e.message || e)); });
  }
  function desligado(a) { return a.dono !== eu() && !L.online(a.dono) ? 'O computador de ' + nome(a.dono) + ' está desligado: a pasta dele volta quando ligar.' : ''; }

  var abrirAba = BC.estacao.abrirAba;
  BC.estacao.abrirAba = function (tab) {
    if (tab && tab.tipo === 'arquivo') { var a = L.arquivo(tab.ref); if (real(a) && !a._carregado) carregar(a); }
    return abrirAba.apply(this, arguments);
  };

  /* ---------- gravar de verdade ---------- */
  function gravar(caminho, conteudo) {
    return fetch('/api/arquivo?caminho=' + encodeURIComponent(relDe(caminho)), {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-coop-quem': eu() }, body: JSON.stringify({ conteudo: conteudo })
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.erro || ('HTTP ' + r.status)); return j; }); });
  }

  function salvar(a, conteudo) {
    if (a.dono !== eu()) { aviso('A pasta de ' + nome(a.dono) + ' é dela: aqui você só lê. Peça a mudança ou mande a sua versão.'); return false; }
    if (!a._carregado) { aviso('O arquivo ainda está abrindo: salve de novo em um instante.'); return false; }
    conteudo = conteudo == null ? '' : String(conteudo);
    if (a.conteudo === conteudo) return true;
    var agora = Date.now();
    a.versoes.unshift({ ts: agora, quem: eu(), conteudo: a.conteudo });
    if (a.versoes.length > 8) a.versoes.length = 8;
    a.conteudo = conteudo; a.modificado = agora; a._gravado = agora; a.salvoPor = eu(); a.salvoEm = agora;
    gravar(a.caminho, conteudo).then(function () { a._gravado = Date.now(); }).catch(function (e) { aviso('Não gravou "' + a.caminho.split('/').pop() + '" no disco: ' + e.message); });
    mudou();
    return true;
  }

  function limparCaminho(caminho) {
    var partes = String(caminho || '').split('/'), dono = partes.shift();
    if (dono === 'equipe') dono = eu(); /* não existe pasta "equipe" no disco: o que a tela mandaria para lá fica na minha */
    partes = partes.map(function (p) { return p.trim(); }).filter(function (p) { return p && p !== '.' && p !== '..'; });
    return partes.length ? dono + '/' + partes.join('/') : null;
  }

  function criar(caminho, tipo, conteudo, tamanho) {
    var cam = limparCaminho(caminho);
    if (!cam) return false;
    if (cam.split('/')[0] !== eu()) { aviso('Só dá para criar na sua pasta: a de ' + nome(cam.split('/')[0]) + ' é dela.'); return false; }
    if (L.arquivo(cam)) cam = cam.replace(/(\.[a-z0-9]+)?$/i, ' ' + Date.now().toString(36).slice(-3) + '$1');
    var agora = Date.now(), texto = conteudo == null ? '' : String(conteudo);
    var a = { id: cam, caminho: cam, dono: eu(), autor: eu(), tipo: tipo || BC.explorador.tipoDe(cam), tamanho: tamanho || (Math.max(1, Math.round(texto.length / 1024)) + ' KB'),
      modificado: agora, conteudo: texto, versoes: [], consultas: 0, salvoPor: eu(), salvoEm: agora, _real: true, _carregado: true, _gravado: agora };
    L.estado.arquivos.push(a);
    recemCriados[cam] = agora;
    var partes = cam.split('/'), ui = BC.estacao.ui;
    for (var i = 1; i < partes.length; i++) ui.abertas[partes.slice(0, i).join('/')] = true;
    gravar(cam, texto).then(function () { a._gravado = Date.now(); }).catch(function (e) {
      var k = L.estado.arquivos.indexOf(a); if (k !== -1) L.estado.arquivos.splice(k, 1);
      aviso('Não criou "' + partes[partes.length - 1] + '" no disco: ' + e.message); mudou();
    });
    mudou();
    return true;
  }

  /* as ações de arquivo da tela passam por aqui antes da ponte: arquivo real vai para o disco, o resto segue para o diário */
  var fazerAntes = L.fazer;
  L.fazer = function (nomeAcao, a, b, c, d) {
    if (nomeAcao === 'salvarArquivo') { var s = L.arquivo(a); if (real(s)) return salvar(s, b); }
    if (nomeAcao === 'voltarVersao') { var v = L.arquivo(a); if (real(v)) { var ver = v.versoes[b]; return ver ? salvar(v, ver.conteudo) : false; } }
    if (nomeAcao === 'criarArquivo') return criar(a, b, c, d);
    if (nomeAcao === 'enviarArquivo') { var en = L.arquivo(a); if (real(en)) { aviso('Mandar para a pasta de ' + nome(b) + ' ainda não grava no computador dela: anexe no chat.'); return false; } }
    return fazerAntes.apply(L, arguments);
  };

  /* arquivos do computador: texto entra na pasta real; imagem, PDF e vídeo vão direto na pasta pelo Finder */
  var receber = BC.explorador.receber;
  BC.explorador.receber = function (files) {
    var textos = [], outros = [];
    Array.prototype.slice.call(files || []).forEach(function (f) { (TEXTO[BC.explorador.tipoDe(f.name)] ? textos : outros).push(f); });
    if (outros.length) aviso('Imagem, PDF e vídeo: copie para a sua pasta ~/BabelCoop/' + eu() + ' pelo Finder (' + outros.map(function (f) { return f.name; }).join(', ') + '). A árvore mostra na hora.');
    if (textos.length) return receber.call(BC.explorador, textos);
  };

  /* ---------- a árvore: + Pasta, equipe só se existir, pasta desligada pontilhada ---------- */
  var ui = function () { return BC.estacao.ui; };
  var lateral = BC.explorador.lateral;
  BC.explorador.lateral = function () {
    var html = lateral.apply(this, arguments), t = document.createElement('template');
    t.innerHTML = html;
    var c = t.content, ferr = c.querySelector('.arv-ferr'), novo = ferr && ferr.querySelector('[data-acao="novo-arquivo"]');
    if (novo) { var b = document.createElement('button'); b.type = 'button'; b.dataset.acao = 'nova-pasta'; b.title = 'Nova pasta'; b.setAttribute('aria-label', 'Nova pasta'); b.textContent = '＋ Pasta'; ferr.insertBefore(b, novo); }
    if (!L.estado.arquivos.some(function (a) { return a.dono === 'equipe'; })) { var eq = c.querySelector('.arv-pasta.raiz[data-caminho="equipe"]'); if (eq) eq.remove(); }
    c.querySelectorAll('.arv-pasta.raiz[data-pessoa]').forEach(function (el) {
      var p = L.pessoa(el.dataset.pessoa);
      if (!p || p.status !== 'offline') return;
      el.classList.add('arv-desligada');
      el.title = 'Computador de ' + p.nome + ' desligado: a pasta volta quando ligar';
      var n = el.querySelector('.arv-nome'); if (n && !/desligado/.test(n.textContent)) n.insertAdjacentHTML('beforeend', ' <small>· desligado</small>');
    });
    var campo = c.querySelector('#novo-arq-nome');
    if (campo && ui().novaPasta) campo.setAttribute('placeholder', 'nome da pasta');
    var nota = c.querySelector('.arv + .lat-nota');
    if (nota && /11 pessoas/.test(nota.textContent)) nota.textContent = 'Sua pasta é ~/BabelCoop/' + eu() + ': o que está nela a equipe vê; o resto do computador, não. Arraste um arquivo de texto para cá ou crie pelo ＋.';
    decorarLinhas(c); /* um redesenho no meio de um movimento continua de onde estava */
    return t.innerHTML;
  };

  BC.acoes['nova-pasta'] = function () {
    var u = ui(); u.novaPasta = !(u.novoArquivo && u.novaPasta); u.novoArquivo = u.novaPasta;
    BC.estacao.render();
    var i = document.getElementById('novo-arq-nome'); if (i) i.focus();
  };
  var formNovo = BC.formularios['novo-arquivo'];
  BC.formularios['novo-arquivo'] = function () {
    var campo = document.getElementById('novo-arq-nome'), valor = campo ? campo.value.trim() : '', u = ui();
    if (!valor) return;
    if (!u.novaPasta && valor.indexOf('/') === -1) return formNovo.apply(this, arguments);
    /* com "/" (pasta/arquivo.md) ou pelo ＋ Pasta: cria a pasta de verdade, com um README.md dentro (pasta vazia não aparece na árvore) */
    var pasta = u.novaPasta || /\/$/.test(valor), limpo = valor.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    var arq = pasta ? limpo + '/README.md' : limpo;
    if (arq.split('/').pop().indexOf('.') === -1) arq += '.md';
    var tipo = BC.explorador.tipoDe(arq), inicial = tipo === 'md' ? '# ' + (pasta ? limpo.split('/').pop() : arq.split('/').pop().replace(/\.md$/, '')) + '\n' : '';
    u.novoArquivo = false; u.novaPasta = false;
    if (L.fazer('criarArquivo', eu() + '/' + arq, TEXTO[tipo] ? tipo : 'txt', inicial)) {
      var a = L.arquivo(limparCaminho(eu() + '/' + arq)) || L.estado.arquivos[L.estado.arquivos.length - 1];
      BC.explorador.abrirArquivo(a.id);
      if (!pasta) { BC.estacao.abaAtual().modo = 'editar'; BC.estacao.render(); }
      aviso(pasta ? 'Pasta "' + limpo + '" criada na sua pasta compartilhada.' : '"' + arq + '" criado na sua pasta compartilhada.');
    }
  };

  /* ---------- editar e apagar: só na minha pasta e só na Estação desta máquina (o celular e a pasta dos outros ficam só leitura) ---------- */
  var EDITAVEL = { md: 1, txt: 1, csv: 1, html: 1, js: 1, ts: 1, py: 1, sh: 1, css: 1, json: 1 }; /* os que o editor abre como texto (editor.js) */
  var GERADO = /^(ACERVO|APRENDIZADOS|CLAUDE)\.md$/i; /* na raiz, o acervo escreve: o servidor recusa apagar */
  var ICONE = function (miolo) { return '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + miolo + '</svg>'; };
  var LAPIS = ICONE('<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z"/><path d="M13.5 7l3 3"/>');
  var LIXO = ICONE('<path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v5.5M14 11v5.5"/>');
  var SAI_MS = 280, VOLTA_MS = 900; /* a saída e o brilho da volta: começo e fim, nada fica rodando */
  var pedido = null; /* confirmação aberta: { id, onde: 'arvore' | 'aba' } */
  var desfazer = null; /* o aviso com "Desfazer" que está na tela */
  var apagando = {}; /* id → true: da confirmação até o servidor responder (sem pedir de novo, sem ações na linha) */
  var saindoDesde = {}; /* id → { t, h }: a linha que está saindo agora */
  var voltouEm = {}; /* id → ts: a linha que voltou pelo Desfazer */

  function esc(s) { return BC.util && BC.util.esc ? BC.util.esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function remoto() { return !!(window.COOP_REAL && window.COOP_REAL.remoto); }
  function meu(a) { return real(a) && a.dono === eu() && !remoto(); }
  function nomeArq(a) { return String(a.caminho).split('/').pop(); }
  function gerado(a) { var r = relDe(a.caminho); return r.indexOf('/') === -1 && GERADO.test(r); }
  function podeApagar(a) { return meu(a) && !gerado(a) && !apagando[a.id]; }
  function podeEditarReal(a) { return meu(a) && !!EDITAVEL[a.tipo] && !apagando[a.id]; }
  function abasDe(id) { return ((BC.estacao.ui && BC.estacao.ui.abas) || []).filter(function (t) { return t.tipo === 'arquivo' && t.ref === id; }); }
  function resposta(r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.erro || ('HTTP ' + r.status)); return j; }); }
  function semMovimento() {
    var o = BC.organismo;
    if (o && o.semMovimento) { try { return !!o.semMovimento(); } catch (e) { /* segue */ } }
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function focar(sel) { var el = sel && document.querySelector(sel); if (el) el.focus(); }
  function sel(v) { return window.CSS && CSS.escape ? CSS.escape(v) : String(v).replace(/["\\]/g, '\\$&'); }
  function linhaNo(raiz, id) { return raiz.querySelector('.arv-arq[data-id="' + sel(id) + '"]'); }

  /* mudança que ainda não foi para o disco: texto digitado no modo editar (a aba à vista) ou mudança visual no HTML sem salvar */
  function igual(x) { return String(x == null ? '' : x).replace(/\r\n?/g, '\n').replace(/^\n/, ''); } /* o textarea troca \r\n e come o 1º \n */
  function pendente(a) {
    return abasDe(a.id).some(function (t) {
      if (t.rascunhoVisual != null) return true;
      if ((t.modo || 'ver') !== 'editar') return false;
      var campo = document.getElementById('ed-texto-' + a.id), salvo = BC.editor && BC.editor.conteudo ? BC.editor.conteudo(a) : a.conteudo;
      return !!campo && igual(campo.value) !== igual(salvo);
    });
  }
  function avisarPendente(a) {
    var t = abasDe(a.id)[0];
    if (t && BC.estacao.abaAtual && BC.estacao.abaAtual() !== t) BC.explorador.abrirArquivo(a.id);
    aviso('"' + nomeArq(a) + '" tem mudança que ainda não foi salva: salve ou cancele a edição antes de apagar.');
    var campo = document.getElementById('ed-texto-' + a.id);
    if (campo) campo.focus();
  }

  /* a linha da árvore: ✎ e 🗑 junto das outras ações (aparecem ao passar o mouse e com o foco, pelo teclado) */
  BC.explorador.acoesDoArquivo = function (a) {
    if (!meu(a) || apagando[a.id]) return '';
    var n = esc(nomeArq(a)), id = esc(a.id);
    return (podeEditarReal(a) ? '<button type="button" class="arq-acao" data-acao="arq-editar" data-id="' + id + '" title="Editar ' + n + '" aria-label="Editar ' + n + '">' + LAPIS + '</button>' : '') +
      (podeApagar(a) ? '<button type="button" class="arq-acao arq-acao-apagar" data-acao="arq-apagar" data-id="' + id + '" title="Apagar ' + n + ' (tecla Delete)" aria-label="Apagar ' + n + '">' + LIXO + '</button>' : '');
  };
  function confirmacao(a, suf) {
    return '<span class="arq-pergunta">Apagar <b>' + esc(nomeArq(a)) + '</b>?</span>' +
      '<button type="button" class="arq-sim" id="arq-conf-sim' + suf + '" data-acao="arq-apagar-sim" data-id="' + esc(a.id) + '">Apagar</button>' +
      '<span class="arq-ponto" aria-hidden="true">·</span>' +
      '<button type="button" class="arq-nao" id="arq-conf-nao' + suf + '" data-acao="arq-apagar-nao" data-id="' + esc(a.id) + '">Cancelar</button>';
  }
  BC.explorador.abaixoDoArquivo = function (a, nivel) {
    if (!pedido || pedido.onde !== 'arvore' || pedido.id !== a.id || !podeApagar(a)) return '';
    return '<div class="arv-confirma" role="group" aria-label="Confirmar: apagar ' + esc(nomeArq(a)) + '" style="--n:' + (+nivel || 0) + '">' + confirmacao(a, '') + '</div>';
  };

  /* a barra da aba do arquivo: o editor já tem "Editar" para texto; aqui entra "Apagar" (e a confirmação no lugar dele).
     Editando (texto ou mudança visual sem salvar), a barra não oferece Apagar: primeiro Salvar ou Cancelar */
  function barraReal(tab, el) {
    var a = tab && L.arquivo(tab.ref), bot = el && el.querySelector('.ed-barra .ed-botoes');
    if (!a || !bot || !meu(a) || gerado(a) || (tab.modo || 'ver') === 'editar' || tab.rascunhoVisual != null || bot.querySelector('.arq-barra-apagar, .arq-barra-confirma')) return;
    var h = apagando[a.id] ? '<span class="arq-barra-confirma" role="status"><span class="arq-pergunta">Indo para a lixeira…</span></span>'
      : pedido && pedido.onde === 'aba' && pedido.id === a.id
        ? '<span class="arq-barra-confirma" role="group" aria-label="Confirmar: apagar ' + esc(nomeArq(a)) + '">' + confirmacao(a, '-aba') + '</span>'
        : '<button class="botao discreto arq-barra-apagar" type="button" data-acao="arq-apagar" data-onde="aba" data-id="' + esc(a.id) + '" title="Tira da pasta compartilhada e manda para a lixeira; dá para desfazer">Apagar</button>';
    var sep = bot.querySelector('.ed-sep');
    if (sep) sep.insertAdjacentHTML('beforebegin', h); else bot.insertAdjacentHTML('beforeend', h);
  }
  if (BC.editor && BC.editor.desenhar) {
    var desenhar = BC.editor.desenhar;
    BC.editor.desenhar = function (tab, el) {
      var r = desenhar.apply(this, arguments);
      try { barraReal(tab, el); } catch (e) { /* a barra do editor segue como está */ }
      return r;
    };
  }

  /* Editar: abre o arquivo já no modo de edição do editor (texto editável; grava pelo PUT de sempre, com a versão anterior guardada) */
  BC.acoes['arq-editar'] = function (el, ev) {
    if (ev) ev.stopPropagation();
    var a = L.arquivo(el.dataset.id);
    if (!a || !podeEditarReal(a)) return;
    pedido = null;
    BC.explorador.abrirArquivo(a.id);
    var entrar = function (ok) {
      var t = abasDe(a.id)[0];
      if (ok === false || !t) return;
      var atual = BC.estacao.abaAtual && BC.estacao.abaAtual();
      if (atual === t && BC.acoes['ed-modo']) BC.acoes['ed-modo']({ dataset: { modo: 'editar' } }); /* pelo mesmo caminho do botão da barra */
      else { t.modo = 'editar'; BC.estacao.render(); }
      if (BC.estacao.abaAtual && BC.estacao.abaAtual() === t) { var campo = document.getElementById('ed-texto-' + a.id); if (campo) campo.focus(); }
    };
    if (a._carregado) entrar(true); else carregar(a, entrar); /* texto editável só com o conteúdo do disco na mão */
  };

  /* Apagar: primeiro pergunta ali mesmo; nada de janela do navegador. Com mudança não salva, nem pergunta: avisa */
  BC.acoes['arq-apagar'] = function (el, ev) {
    if (ev) ev.stopPropagation();
    var a = L.arquivo(el.dataset.id);
    if (!a || !podeApagar(a)) return;
    if (pendente(a)) { pedido = null; avisarPendente(a); return; }
    pedido = { id: a.id, onde: el.dataset.onde === 'aba' ? 'aba' : 'arvore' };
    BC.estacao.render();
    focar(pedido.onde === 'aba' ? '#arq-conf-nao-aba' : '#arq-conf-nao');
  };
  BC.acoes['arq-apagar-nao'] = function (el, ev) {
    if (ev) ev.stopPropagation();
    var p = pedido;
    pedido = null;
    BC.estacao.render();
    if (!p) return;
    if (p.onde === 'aba') focar('.arq-barra-apagar');
    else focar('.arv-arq[data-id="' + sel(p.id) + '"]');
  };
  BC.acoes['arq-apagar-sim'] = function (el, ev) {
    if (ev) ev.stopPropagation();
    var a = L.arquivo(el.dataset.id), onde = el.id === 'arq-conf-sim-aba' ? 'aba' : 'arvore';
    pedido = null;
    if (!a || !podeApagar(a)) { BC.estacao.render(); return; }
    if (pendente(a)) { BC.estacao.render(); avisarPendente(a); return; } /* digitou depois de abrir a pergunta */
    /* a pergunta dá lugar ao movimento: na árvore ela some; na barra vira "Indo para a lixeira…" */
    var caixa = el.closest && el.closest('.arv-confirma, .arq-barra-confirma');
    if (caixa && caixa.classList.contains('arv-confirma')) caixa.parentNode.removeChild(caixa);
    else if (caixa) { caixa.setAttribute('role', 'status'); caixa.innerHTML = '<span class="arq-pergunta">Indo para a lixeira…</span>'; }
    apagar(a, { onde: onde });
  };
  /* teclado: Delete numa linha da árvore pede a confirmação; Esc dentro dela cancela */
  document.addEventListener('keydown', function (ev) {
    var t = ev.target;
    if (!t || !t.closest) return;
    if (ev.key === 'Escape' && pedido && t.closest('.arv-confirma, .arq-barra-confirma')) { ev.preventDefault(); BC.acoes['arq-apagar-nao'](t); return; }
    if ((ev.key === 'Delete' || (ev.key === 'Backspace' && ev.metaKey)) && t.classList.contains('arv-arq')) {
      var a = L.arquivo(t.dataset.id);
      if (!a || !podeApagar(a)) return;
      ev.preventDefault();
      BC.acoes['arq-apagar']({ dataset: { id: a.id } });
    }
  });

  /* ---------- o movimento: a linha sai (tinge, desliza, some e fecha o espaço) e volta com brilho; tudo com começo e fim ---------- */
  function marcarSaindo(el, s) {
    el.classList.add('arq-saindo');
    el.style.setProperty('--h', s.h + 'px');
    el.style.animationDelay = -Math.min(SAI_MS, Date.now() - s.t) + 'ms'; /* redesenhada no meio: continua de onde estava */
    el.setAttribute('aria-hidden', 'true');
    el.removeAttribute('tabindex');
  }
  function decorarLinhas(raiz) {
    var agora = Date.now();
    Object.keys(saindoDesde).forEach(function (id) { var el = linhaNo(raiz, id); if (el) marcarSaindo(el, saindoDesde[id]); });
    Object.keys(voltouEm).forEach(function (id) {
      if (agora - voltouEm[id] >= VOLTA_MS) { delete voltouEm[id]; return; }
      var el = linhaNo(raiz, id);
      if (el) { el.classList.add('arq-voltou'); el.style.animationDelay = -(agora - voltouEm[id]) + 'ms'; }
    });
  }
  /* fim() roda quando a saída termina (na hora, sem movimento ou sem nada à vista) */
  function saindo(id, fim) {
    var linha = linhaNo(document, id), corpo = null, aba = document.querySelector('.e-aba[data-id="arq:' + sel(id) + '"]');
    var atual = BC.estacao.abaAtual && BC.estacao.abaAtual();
    if (atual && atual.tipo === 'arquivo' && atual.ref === id) corpo = document.querySelector('#e-conteudo .ed-corpo');
    if (semMovimento() || (!linha && !corpo)) { fim(); return; }
    if (linha) marcarSaindo(linha, saindoDesde[id] = { t: Date.now(), h: linha.offsetHeight || 24 });
    if (corpo) corpo.classList.add('arq-saindo-corpo');
    if (aba) aba.classList.add('arq-saindo-aba');
    setTimeout(function () { delete saindoDesde[id]; fim(); }, SAI_MS);
  }
  function brilharVolta(id) {
    if (semMovimento()) return;
    voltouEm[id] = Date.now();
    setTimeout(function () { delete voltouEm[id]; }, VOLTA_MS + 50);
  }

  /* a linha de baixo (ou a de cima) recebe o foco quando a apagada sai pela árvore */
  function vizinho(id) {
    var el = linhaNo(document, id);
    if (!el) return null;
    var todas = Array.prototype.slice.call(document.querySelectorAll('#e-lateral .arv-linha[tabindex]')), i = todas.indexOf(el);
    var de = function (v) { return !v ? null : v.dataset.id ? '.arv-arq[data-id="' + sel(v.dataset.id) + '"]' : v.dataset.caminho != null ? '.arv-pasta[data-caminho="' + sel(v.dataset.caminho) + '"]' : null; };
    return de(todas[i + 1]) || de(todas[i - 1]);
  }

  /* apagar: a linha sai primeiro e a aba fecha antes do pedido (o meio nunca mostra "não existe mais"); só então o arquivo vai
     para a lixeira. Se o servidor recusar, a linha e a aba voltam e o motivo aparece */
  function apagar(a, o) {
    o = o || {};
    var caminho = a.caminho, id = a.id, nomeA = nomeArq(a);
    apagando[id] = true;
    recemApagados[caminho] = Date.now();
    delete recemCriados[caminho];
    var proximo = o.onde === 'arvore' ? vizinho(id) : null;
    if (proximo) focar(proximo);
    saindo(id, function () {
      var tinhaAba = abasDe(id).length > 0;
      var k = L.estado.arquivos.indexOf(a);
      if (k !== -1) L.estado.arquivos.splice(k, 1);
      abasDe(id).forEach(function (t) { BC.estacao.fecharAba(t.id); });
      mudou();
      if (proximo) focar(proximo);
      fetch('/api/arquivo?caminho=' + encodeURIComponent(relDe(caminho)), { method: 'DELETE', headers: { 'x-coop-quem': eu() } })
        .then(resposta)
        .then(function (j) { delete apagando[id]; mostrarDesfazer(a, j.lixeira); })
        .catch(function (e) {
          delete apagando[id];
          delete recemApagados[caminho];
          if (!L.arquivo(caminho)) L.estado.arquivos.push(a);
          aviso('Não apagou "' + nomeA + '": ' + e.message);
          mudou();
          if (tinhaAba) BC.explorador.abrirArquivo(id);
        });
    });
  }

  /* o aviso com Desfazer: 8 s na tela, depois some sozinho (o arquivo continua na lixeira do babel-coop) */
  function fecharDesfazer(d) {
    d = d || desfazer;
    if (!d) return;
    clearTimeout(d.t);
    if (d.el.parentNode) d.el.parentNode.removeChild(d.el);
    if (desfazer === d) desfazer = null;
  }
  function mostrarDesfazer(a, lixeira) {
    fecharDesfazer();
    var toast = document.getElementById('e-toast'), pai = toast && toast.parentNode ? toast.parentNode : document.body;
    var el = document.createElement('div');
    el.className = 'e-toast arq-desfazer';
    el.id = 'arq-desfazer';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = '<span>"' + esc(nomeArq(a)) + '" foi para a lixeira (fora da pasta compartilhada).</span><button type="button" class="botao" id="arq-desfazer-botao">Desfazer</button>';
    pai.appendChild(el);
    var d = desfazer = { el: el, t: setTimeout(function () { fecharDesfazer(d); }, 8000) };
    var b = el.querySelector('button');
    b.addEventListener('click', function () {
      if (b.disabled) return;
      b.disabled = true;
      clearTimeout(d.t);
      restaurar(lixeira, a).then(function () { fecharDesfazer(d); }, function (e) {
        b.disabled = false;
        d.t = setTimeout(function () { fecharDesfazer(d); }, 8000);
        aviso('Não voltou "' + nomeArq(a) + '": ' + e.message);
      });
    });
  }

  function restaurar(lixeira, a) {
    return fetch('/api/arquivo/restaurar', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-coop-quem': eu() }, body: JSON.stringify({ lixeira: lixeira }) })
      .then(resposta)
      .then(function (j) {
        var cam = eu() + '/' + j.caminho, partes = cam.split('/'), u = BC.estacao.ui;
        delete recemApagados[a.caminho]; delete recemApagados[cam];
        if (!L.arquivo(cam)) {
          L.estado.arquivos.push(entrada({ caminho: cam, dono: eu(), tipo: a.tipo, tamanho: a.tamanho, bytes: a.bytes, modificado: Date.now() }));
          recemCriados[cam] = Date.now();
        }
        for (var i = 1; i < partes.length; i++) u.abertas[partes.slice(0, i).join('/')] = true;
        brilharVolta(cam);
        aviso(cam === a.caminho ? '"' + nomeArq(a) + '" voltou para a sua pasta.' : '"' + nomeArq(a) + '" voltou como "' + partes[partes.length - 1] + '": já havia outro arquivo com esse nome.');
        buscarLista(eu());
        mudou();
        return j;
      });
  }

  var st = document.createElement('style');
  var ALARME = 'var(--alarme,#ff6b6b)', OK = 'var(--ok,#7fd6a6)', EASE = 'var(--ease-saida,cubic-bezier(.2,0,0,1))';
  st.textContent = '.arv-pasta.raiz.arv-desligada{outline:1px dashed var(--linha,#2a3a5e);outline-offset:-2px;border-radius:6px;opacity:.72}' +
    '.arv-pasta.raiz.arv-desligada .arv-nome small{color:var(--fraco,#6c7b96)}' +
    /* editar e apagar na linha, confirmação inline e o aviso com Desfazer */
    '.arv-acoes .arq-acao{display:inline-grid;place-items:center;min-width:18px;height:18px}' +
    '.arv-acoes .arq-acao svg{display:block}' +
    '.arv-acoes .arq-acao-apagar:hover,.arv-acoes .arq-acao-apagar:focus-visible{color:' + ALARME + '}' +
    '.arv-confirma{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin:2px 4px 4px;padding:5px 8px 5px calc(8px + var(--n,0) * 14px);border:1px solid color-mix(in srgb,' + ALARME + ' 45%,transparent);border-radius:6px;background:color-mix(in srgb,' + ALARME + ' 8%,transparent);color:var(--texto,#eef1ff);font-size:12px;line-height:1.3}' +
    '.arv-confirma .arq-pergunta{flex:1 1 100%;min-width:0}' + /* a lateral é estreita: a pergunta numa linha, Apagar · Cancelar na outra */
    '.arv-confirma b,.arq-barra-confirma b{font-weight:600;overflow-wrap:anywhere}' +
    '.arq-barra-confirma{display:inline-flex;align-items:center;flex-wrap:wrap;gap:6px;font-size:12px}' +
    '.arq-sim,.arq-nao{padding:2px 9px;border:1px solid var(--linha,#2a3a5e);border-radius:5px;background:transparent;color:inherit;font:inherit;cursor:pointer}' +
    '.arq-sim{border-color:' + ALARME + ';color:' + ALARME + '}' +
    '.arq-sim:hover,.arq-sim:focus-visible{background:' + ALARME + ';color:#10131c}' +
    '.arq-nao:hover,.arq-nao:focus-visible{background:var(--s3,rgba(255,255,255,.08))}' +
    '.arq-ponto{color:var(--apagado,#8a97b3)}' +
    /* saída: tinge de alarme, desliza e apaga; depois fecha o espaço (a árvore não pula) */
    '@keyframes arq-sai{0%{opacity:1;transform:none;height:var(--h,24px);min-height:0;background-color:color-mix(in srgb,' + ALARME + ' 24%,transparent);box-shadow:inset 2px 0 ' + ALARME + '}' +
    '45%{opacity:0;transform:translateX(-14px);height:var(--h,24px);min-height:0;background-color:color-mix(in srgb,' + ALARME + ' 10%,transparent);box-shadow:inset 2px 0 transparent}' +
    '100%{opacity:0;transform:translateX(-14px);height:0;min-height:0;padding-top:0;padding-bottom:0;background-color:transparent;box-shadow:none}}' +
    '@keyframes arq-sai-ic{0%{transform:none}35%{transform:scale(1.25) rotate(-8deg)}100%{transform:scale(.4) rotate(12deg)}}' +
    '.arv-arq.arq-saindo{overflow:hidden;pointer-events:none;animation:arq-sai ' + SAI_MS + 'ms ' + EASE + ' forwards}' +
    '.arv-arq.arq-saindo .arv-ic{animation:arq-sai-ic ' + SAI_MS + 'ms ' + EASE + ' forwards}' +
    '.arv-arq.arq-saindo .arv-acoes{display:none}' +
    '@keyframes arq-sai-corpo{to{opacity:0;transform:translateY(8px) scale(.985);filter:saturate(.3)}}' +
    '.arq-saindo-corpo,.e-aba.arq-saindo-aba{pointer-events:none;animation:arq-sai-corpo ' + SAI_MS + 'ms ' + EASE + ' forwards}' +
    /* volta pelo Desfazer: entra deslizando e acende um brilho verde que se apaga sozinho */
    '@keyframes arq-volta{0%{opacity:0;transform:translateX(-10px);background-color:color-mix(in srgb,' + OK + ' 34%,transparent);box-shadow:inset 2px 0 ' + OK + ',0 0 0 transparent}' +
    '22%{opacity:1;transform:none;background-color:color-mix(in srgb,' + OK + ' 26%,transparent);box-shadow:inset 2px 0 ' + OK + ',0 0 16px color-mix(in srgb,' + OK + ' 40%,transparent)}' +
    '100%{background-color:transparent;box-shadow:inset 2px 0 transparent,0 0 0 transparent}}' +
    '.arv-arq.arq-voltou{animation:arq-volta ' + VOLTA_MS + 'ms ' + EASE + ' backwards}' +
    '.e-toast.arq-desfazer{display:flex;align-items:center;gap:12px;margin-bottom:56px}' +
    '.arq-desfazer .botao{flex:none}' +
    '@media (prefers-reduced-motion: reduce){.arv-arq.arq-saindo,.arv-arq.arq-saindo .arv-ic,.arq-saindo-corpo,.e-aba.arq-saindo-aba,.arv-arq.arq-voltou{animation:none}.e-toast.arq-desfazer{animation:none}}';
  document.head.appendChild(st);

  BC.arquivosReal = { aplicarLista: aplicarLista, buscar: buscarLista, carregar: carregar, gravar: gravar, apagar: apagar, restaurar: restaurar, pendente: pendente };
})();
