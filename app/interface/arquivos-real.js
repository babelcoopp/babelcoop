/* babel-coop · a árvore real: o explorador mostra a MINHA pasta compartilhada (~/BabelCoop/<id>) e a de quem está conectado
   Carregado pelo servidor (INJETAR) depois da ponte e do limpo, antes do app.js. Só no app real (window.COOP_REAL).
   - lista: GET /api/arquivos (minha) e GET /api/de/<id>/arquivos (dos outros); atualiza com as mensagens 'arquivos' do servidor
   - abrir: o conteúdo vem sob demanda (/api/arquivo?caminho= ou /api/de/<id>/arquivo?caminho=)
   - salvar e criar: PUT /api/arquivo (pedido local, cabeçalho x-coop-quem); nada disso vai para o diário: o disco é a verdade
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
      vistos[f.caminho] = true;
      delete recemCriados[f.caminho];
      var a = L.arquivo(f.caminho);
      if (!a) { e.arquivos.push(entrada(f)); return; }
      if (!real(a)) return;
      a.tamanho = f.tamanho; a.bytes = f.bytes; a.tipo = f.tipo;
      /* mudou no disco por fora (o claude, outro editor): recarrega o que estiver aberto; o resto recarrega quando abrir */
      var porFora = f.modificado > (a._gravado || 0) + 1500 && f.modificado > (a.modificado || 0) + 5;
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
  function carregar(a, depois) {
    if (carregando[a.id]) return;
    carregando[a.id] = true;
    var fim = function (ok, erro) {
      carregando[a.id] = false;
      /* o editor só redesenha a aba quando o arquivo muda de data: o conteúdo que acabou de chegar pede a aba montada de novo */
      if (ok && BC.editor && BC.editor.esquecer) BC.editor.esquecer('arq:' + a.id);
      if (!ok) aviso(erro || ('Não deu para abrir "' + a.caminho.split('/').pop() + '".'));
      if (depois) depois(ok);
      if (BC.estacao && BC.estacao.render) BC.estacao.render();
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

  var st = document.createElement('style');
  st.textContent = '.arv-pasta.raiz.arv-desligada{outline:1px dashed var(--linha,#2a3a5e);outline-offset:-2px;border-radius:6px;opacity:.72}' +
    '.arv-pasta.raiz.arv-desligada .arv-nome small{color:var(--fraco,#6c7b96)}';
  document.head.appendChild(st);

  BC.arquivosReal = { aplicarLista: aplicarLista, buscar: buscarLista, carregar: carregar, gravar: gravar };
})();
