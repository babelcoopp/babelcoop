/* Babel Coop — protótipo · Explorador: a árvore do HD da equipe, igual à do VS Code.
   Dois modos: sozinho (a minha pasta e o HD de todos) e em projeto (só o projeto, agrupado por pessoa). */
window.BC = window.BC || {};
BC.acoes = BC.acoes || {};
BC.locais = BC.locais || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc, A = BC.acoes;
  function L() { return BC.loja; }
  function ui() { return BC.estacao.ui; }

  var ICONE = { md: 'MD', txt: 'TXT', csv: 'CSV', js: 'JS', ts: 'TS', py: 'PY', sh: 'SH', css: 'CSS', json: '{}', html: '<>', pdf: 'PDF', imagem: 'IMG', video: 'VÍD', mapa: '◉', quadro: '▢', binario: 'BIN' };
  var EXT = { md: 'md', markdown: 'md', txt: 'txt', csv: 'csv', js: 'js', mjs: 'js', ts: 'ts', py: 'py', sh: 'sh', css: 'css', json: 'json', html: 'html', htm: 'html',
    pdf: 'pdf', png: 'imagem', jpg: 'imagem', jpeg: 'imagem', gif: 'imagem', svg: 'imagem', webp: 'imagem', mp4: 'video', mov: 'video', webm: 'video' };
  var TEXTO = { md: 1, txt: 1, csv: 1, js: 1, ts: 1, py: 1, sh: 1, css: 1, json: 1, html: 1 };

  function arvore(arquivos, cortar) {
    var raiz = { filhos: {}, arquivos: [] };
    arquivos.forEach(function (a) {
      var partes = a.caminho.split('/'), no = raiz;
      if (cortar) partes = [partes[0]].concat(partes.slice(1 + cortar));
      for (var i = 0; i < partes.length - 1; i++) {
        var p = partes[i];
        no = no.filhos[p] || (no.filhos[p] = { nome: p, caminho: partes.slice(0, i + 1).join('/'), filhos: {}, arquivos: [] });
      }
      no.arquivos.push(a);
    });
    return raiz;
  }
  function projetoAtivo() { var id = ui().projetoAtivo; return id ? (L().estado.projetos || []).filter(function (p) { return p.id === id; })[0] : null; }

  function linhaArquivo(a, nivel) {
    var e = L().estado, r = e.reuniao, atual = BC.estacao.abaAtual(), aberto = atual && atual.ref === a.id;
    var off = (a.tipo === 'video' || a.tipo === 'binario') && a.dono !== 'equipe' && !L().online(a.dono);
    var salvou = a.salvoPor && a.salvoPor !== a.dono ? L().pessoa(a.salvoPor) : null;
    var vendo = Object.keys(e.vendo || {}).filter(function (id) { return id !== L().eu && e.vendo[id].arquivo === a.id && Date.now() - e.vendo[id].ts < 45000; }).map(function (id) { return L().pessoa(id); }).filter(Boolean);
    var recebido = a.recebidoDe && Date.now() - (a.recebidoEm || 0) < 10 * U.MIN;
    return '<div class="arv-linha arv-arq' + (aberto ? ' aberto' : '') + (off ? ' off' : '') + (recebido ? ' recebido' : '') + '" style="--n:' + nivel + '" role="treeitem" tabindex="0" draggable="true" data-acao="abrir-arquivo" data-id="' + esc(a.id) + '" title="' + esc(a.caminho) + (a.salvoPor ? ' · salvo por ' + esc(L().nome(a.salvoPor)) : '') + '">' +
      '<span class="arv-ic ic-' + esc(a.tipo) + '">' + esc(ICONE[a.tipo] || '·') + '</span><span class="arv-nome">' + esc(a.caminho.split('/').pop()) + '</span>' +
      (recebido ? '<span class="arv-selo">recebido de ' + esc(L().nome(a.recebidoDe)) + ' · ' + U.relativo(a.recebidoEm) + '</span>' : '') +
      (vendo.length ? '<span class="arv-vendo" title="' + esc(vendo.map(function (p) { return p.nome; }).join(', ')) + ' está vendo">' + vendo.map(function (p) { return U.avatar(p, 14); }).join('') + '</span>' : '') +
      (salvou ? '<span class="arv-salvou" title="salvo por ' + esc(salvou.nome) + '">' + U.avatar(salvou, 14) + '</span>' : '') +
      '<span class="arv-acoes">' + (r && r.ativa ? '<button type="button" data-acao="arq-reuniao" data-id="' + esc(a.id) + '" title="Levar para a reunião" aria-label="Levar para a reunião">☰</button>' : '') +
      '<button type="button" data-acao="arq-projetar" data-id="' + esc(a.id) + '" title="Projetar na TV" aria-label="Projetar na TV">▣</button></span></div>';
  }

  function pasta(no, nivel, rotulo, extra, alvoPessoa) {
    var aberta = ui().abertas[no.caminho] || !!ui().filtroArq;
    var h = '<div class="arv-linha arv-pasta' + (nivel === 0 ? ' raiz' : '') + (alvoPessoa ? ' arv-alvo' : '') + '" style="--n:' + nivel + '" role="treeitem" tabindex="0" aria-expanded="' + !!aberta + '" data-acao="arv-pasta" data-caminho="' + esc(no.caminho) + '"' + (alvoPessoa ? ' data-pessoa="' + alvoPessoa + '"' : '') + '>' +
      '<span class="arv-seta">' + (aberta ? '▾' : '▸') + '</span>' + (extra || '') + '<span class="arv-nome">' + (rotulo || esc(no.nome)) + '</span></div>';
    if (!aberta) return h;
    Object.keys(no.filhos).sort().forEach(function (k) { h += pasta(no.filhos[k], nivel + 1); });
    no.arquivos.slice().sort(function (a, b) { return a.caminho.localeCompare(b.caminho); }).forEach(function (a) { h += linhaArquivo(a, nivel + 1); });
    return h;
  }

  function seletorProjeto() {
    var pjs = (L().estado.projetos || []).filter(function (p) { return p.membros.indexOf(L().eu) !== -1; }), at = ui().projetoAtivo || '';
    return '<select id="sel-projeto" class="arv-projeto" data-acao-mudar="arv-projeto" aria-label="Sozinho ou em projeto"><option value=""' + (!at ? ' selected' : '') + '>Sozinho · minha pasta e o HD da equipe</option>' +
      pjs.map(function (p) { return '<option value="' + p.id + '"' + (p.id === at ? ' selected' : '') + '>Projeto · ' + esc(p.nome) + '</option>'; }).join('') + '</select>';
  }

  BC.explorador = {
    lateral: function () {
      var e = L().estado, eu = L().eu, f = U.normalizar(ui().filtroArq || ''), pj = projetoAtivo();
      var html = '<div class="lat-titulo"><span class="rotulo">Criar</span><span class="arv-ferr">' +
        '<button type="button" data-acao="novo-nota" title="Nova nota" aria-label="Nova nota">＋ Nota</button>' +
        '<button type="button" data-acao="novo-mapa" title="Novo mapa mental" aria-label="Novo mapa mental">＋ Mapa</button>' +
        '<button type="button" data-acao="novo-quadro" title="Novo quadro" aria-label="Novo quadro">＋ Quadro</button>' +
        '<button type="button" data-acao="novo-arquivo" title="Novo arquivo" aria-label="Novo arquivo">＋</button>' +
        '<button type="button" data-acao="subir-arquivo" title="Abrir arquivos do seu computador" aria-label="Abrir do computador">↥</button></span></div>' +
        '<div class="criar-atalhos"><button type="button" data-acao="criar-tela" title="Uma página: abre como site"><i style="--c:#29ccec">⬚</i>Tela</button><button type="button" data-acao="pj-maquina" data-id="clinicas" title="O backend em peças"><i style="--c:#8670ff">⚙</i>Máquina</button><button type="button" data-acao="criar-pesquisa" title="MD, TXT, PDF"><i style="--c:#ffcf5c">▤</i>Pesquisa</button></div>' +
        '<div class="arv-modo">' + seletorProjeto() + '</div>' +
        '<div class="arv-filtro"><input type="text" id="filtro-arq" placeholder="Filtrar arquivos (ex.: proposta)" autocomplete="off" value="' + esc(ui().filtroArq || '') + '"></div>' +
        (ui().novoArquivo ? '<form class="arv-novo" data-form="novo-arquivo"><input type="text" id="novo-arq-nome" placeholder="nome.md, pagina.html, script.py…" autocomplete="off"><button class="botao primario" type="submit">Criar</button></form>' : '');

      if (pj) {
        /* em projeto: só as pastas do projeto, agrupadas por membro, a minha primeiro */
        var membros = [eu].concat(pj.membros.filter(function (m) { return m !== eu; })), online = membros.filter(function (m) { return m !== eu && L().online(m); });
        var lista = e.arquivos.filter(function (a) { return pj.membros.indexOf(a.dono) !== -1 && a.caminho.indexOf(a.dono + '/' + pj.pasta + '/') === 0 && (!f || U.normalizar(a.caminho).indexOf(f) !== -1); });
        var raiz = arvore(lista, pj.pasta.split('/').length);
        html += '<div class="arv-juntos"><span class="arv-juntos-av">' + online.map(function (m) { return U.avatar(L().pessoa(m), 22, true); }).join('') + '</span><span>' + (online.length ? online.length + ' pessoa' + (online.length > 1 ? 's' : '') + ' com você agora' : 'ninguém do projeto online agora') + '</span></div>' +
          '<div class="arv" role="tree" aria-label="Projeto ' + esc(pj.nome) + '">';
        membros.forEach(function (id) {
          var no = raiz.filhos[id] || { nome: id, caminho: id, filhos: {}, arquivos: [] }, p = L().pessoa(id), off = !L().online(id);
          ui().abertas[id] = ui().abertas[id] !== false;
          var faz = e.fazendo && e.fazendo[id];
          var rotulo = esc(p.nome) + (id === eu ? ' <small>(eu)</small>' : off ? ' <small>· desligado</small>' : faz ? ' <small>· ' + esc(faz) + '</small>' : '');
          html += pasta(no, 0, rotulo, U.avatar(p, 18, true) + ' ', id !== eu ? id : null);
        });
        html += '</div><p class="lat-nota">Arraste um arquivo para o nome de uma pessoa: ele aparece na pasta de projeto dela com "recebido de você". Abrir o arquivo de outro membro edita ao vivo na Estação dele.</p>' +
          '<button class="botao" type="button" data-acao="abrir-projeto" data-id="' + pj.id + '">Abrir a tela do projeto</button>';
        return html;
      }

      var lista2 = f ? e.arquivos.filter(function (a) { return U.normalizar(a.caminho).indexOf(f) !== -1; }) : e.arquivos;
      var raiz2 = arvore(lista2);
      var ordem = ['equipe', eu].concat(e.pessoas.map(function (p) { return p.id; }).filter(function (id) { return id !== eu; }));
      html += '<div class="arv" role="tree" aria-label="HD da equipe">';
      ordem.forEach(function (id) {
        var no = raiz2.filhos[id];
        if (!no) { if (f) return; no = { nome: id, caminho: id, filhos: {}, arquivos: [] }; }
        var p = L().pessoa(id);
        var rotulo = id === 'equipe' ? 'EQUIPE' : esc(p ? p.nome.toUpperCase() : id) + (id === eu ? ' <small>(você)</small>' : '');
        var extra = p ? '<span class="ponto ' + (p.status === 'offline' ? 'offline' : 'online') + '"></span>' : '<span class="arv-equipe">★</span>';
        html += pasta(no, 0, rotulo, extra, p && id !== eu ? id : null);
      });
      html += '</div><p class="lat-nota">Tudo aqui é visível para as 11 pessoas. Arraste arquivos do seu computador para cá, ou um arquivo seu para o nome de alguém.</p>';
      return html;
    },

    sigla: function (tipo) { return ICONE[tipo] || '·'; },
    tipoDe: function (nomeArq) { var ext = (nomeArq.split('.').pop() || '').toLowerCase(); return EXT[ext] || 'binario'; },

    abrirArquivo: function (id) {
      var a = L().arquivo(id);
      if (!a) return;
      var partes = a.caminho.split('/'), pj = projetoAtivo();
      for (var i = 1; i < partes.length; i++) ui().abertas[partes.slice(0, i).join('/')] = true;
      BC.estacao.abrirAba({ id: 'arq:' + a.id, tipo: 'arquivo', ref: a.id, titulo: partes[partes.length - 1], atividade: 'explorador' });
      if (a.dono !== L().eu && a.dono !== 'equipe' && pj && pj.membros.indexOf(a.dono) !== -1) BC.estacao.aviso('Editando ao vivo na Estação de ' + L().nome(a.dono) + ' · ' + (L().online(a.dono) ? '2 cursores' : 'computador desligado, só leitura'));
    },

    /* arquivos de verdade vindos do computador */
    receber: function (files) {
      var eu = L().eu;
      Array.prototype.slice.call(files).forEach(function (f) {
        var tipo = BC.explorador.tipoDe(f.name), caminho = eu + '/do computador/' + f.name;
        var tam = f.size > 1048576 ? (f.size / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(f.size / 1024)) + ' KB';
        var grande = f.size > 1200000 || tipo === 'video' || tipo === 'binario';
        var leitor = new FileReader();
        leitor.onload = function () {
          var conteudo = tipo === 'video' ? URL.createObjectURL(f) : leitor.result;
          if (grande) {
            L().fazer('criarArquivo', caminho, tipo, null, tam);
            var a = L().arquivo(caminho) || L().estado.arquivos[L().estado.arquivos.length - 1];
            a.local = true;
            BC.locais[a.id] = conteudo;
            BC.explorador.abrirArquivo(a.id);
          } else {
            L().fazer('criarArquivo', caminho, tipo, conteudo, tam);
            var b = L().estado.arquivos[L().estado.arquivos.length - 1];
            BC.explorador.abrirArquivo(b.id);
          }
          BC.estacao.aviso('"' + f.name + '" está na sua pasta' + (grande ? ' (arquivo grande: fica só com você e abre pela rede para os outros).' : ' e entrou no acervo.'));
        };
        if (tipo === 'video' || tipo === 'binario') leitor.readAsArrayBuffer(f.slice(0, 1));
        else if (TEXTO[tipo]) leitor.readAsText(f);
        else leitor.readAsDataURL(f);
      });
    }
  };

  /* ---------- arrastar um arquivo da árvore para uma pessoa ---------- */

  var arrastando = null;
  document.addEventListener('dragstart', function (ev) {
    var el = ev.target.closest && ev.target.closest('.arv-arq');
    if (!el) return;
    arrastando = el.dataset.id;
    try { ev.dataTransfer.setData('text/plain', 'babel-arquivo:' + el.dataset.id); ev.dataTransfer.effectAllowed = 'copy'; } catch (e) { /* sem dataTransfer */ }
    el.classList.add('arrastando');
  });
  document.addEventListener('dragend', function () { arrastando = null; document.querySelectorAll('.arv-alvo.sobre, .arv-arq.arrastando').forEach(function (x) { x.classList.remove('sobre', 'arrastando'); }); });
  document.addEventListener('dragover', function (ev) {
    if (!arrastando) return;
    var alvo = ev.target.closest && ev.target.closest('.arv-alvo');
    if (!alvo) return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.dataTransfer.dropEffect = 'copy';
    alvo.classList.add('sobre');
  });
  document.addEventListener('dragleave', function (ev) { var alvo = ev.target.closest && ev.target.closest('.arv-alvo'); if (alvo) alvo.classList.remove('sobre'); });
  document.addEventListener('drop', function (ev) {
    if (!arrastando) return;
    var alvo = ev.target.closest && ev.target.closest('.arv-alvo');
    if (!alvo) return;
    ev.preventDefault();
    ev.stopPropagation();
    var para = alvo.dataset.pessoa, a = L().arquivo(arrastando), pj = projetoAtivo();
    arrastando = null;
    alvo.classList.remove('sobre');
    if (!a || !para) return;
    if (L().fazer('enviarArquivo', a.id, para, pj ? pj.id : null)) BC.estacao.aviso('"' + a.caminho.split('/').pop() + '" foi para a pasta ' + (pj ? 'do projeto ' : '') + 'de ' + L().nome(para) + ', com "recebido de você".');
  }, true);

  /* ---------- ações ---------- */

  A['abrir-arquivo'] = function (el, ev) { if (ev && ev.target.closest('.arv-acoes')) return; BC.explorador.abrirArquivo(el.dataset.id); };
  A['abrir-caminho'] = function (el) { var a = L().arquivo(el.dataset.caminho); if (a) BC.explorador.abrirArquivo(a.id); };
  A['arv-pasta'] = function (el) { var c = el.dataset.caminho; ui().abertas[c] = !ui().abertas[c]; BC.estacao.render(); };
  A['arv-projeto'] = function (el) { ui().projetoAtivo = el.value || null; BC.estacao.render(); };
  A['arq-reuniao'] = function (el, ev) {
    if (ev) ev.stopPropagation();
    var a = L().arquivo(el.dataset.id);
    if (a && L().fazer('jogarNaReuniao', a.caminho)) BC.estacao.aviso('"' + a.caminho.split('/').pop() + '" está na mesa da reunião.');
  };
  A['arq-projetar'] = function (el, ev) {
    if (ev) ev.stopPropagation();
    var a = L().arquivo(el.dataset.id);
    if (a && L().fazer('projetar', a.caminho)) BC.estacao.aviso('Projetando "' + a.caminho.split('/').pop() + '" na TV. Role com PageUp e PageDown.');
    else BC.estacao.aviso('Não dá para projetar agora: o dono do arquivo está offline.');
  };

  function criarEAbrir(caminho, tipo, conteudo, modo) {
    L().fazer('criarArquivo', caminho, tipo, conteudo);
    var a = L().estado.arquivos[L().estado.arquivos.length - 1];
    BC.explorador.abrirArquivo(a.id);
    if (modo) { BC.estacao.abaAtual().modo = modo; BC.estacao.render(); }
  }
  function base() { var pj = projetoAtivo(); return L().eu + '/' + (pj ? pj.pasta + '/' : ''); }

  A['novo-nota'] = function () {
    var agora = new Date();
    criarEAbrir(base() + (projetoAtivo() ? '' : 'notas/') + U.dataArquivo(agora) + ' ' + U.pad(agora.getHours()) + 'h' + U.pad(agora.getMinutes()) + '.md', 'md',
      '# Nota de ' + U.dataLonga(agora) + '\n\n- ', 'editar');
  };
  A['novo-mapa'] = function () {
    criarEAbrir(base() + (projetoAtivo() ? '' : 'mapas/') + 'Mapa ' + U.dataArquivo() + '.mapa', 'mapa', JSON.stringify(BC.MapaMental.novo('Ideia central')));
  };
  A['novo-quadro'] = function () {
    var pj = projetoAtivo();
    criarEAbrir(pj ? base() + 'Quadro ' + U.dataArquivo() + '.quadro' : 'equipe/Quadros/Quadro de ' + L().nome(L().eu) + ' ' + U.dataArquivo() + '.quadro', 'quadro', JSON.stringify({ itens: [] }));
  };
  A['novo-arquivo'] = function () { ui().novoArquivo = !ui().novoArquivo; BC.estacao.render(); var i = document.getElementById('novo-arq-nome'); if (i) i.focus(); };
  A['subir-arquivo'] = function () { var i = document.getElementById('arq-upload'); if (i) i.click(); };

  BC.formularios = BC.formularios || {};
  BC.formularios['novo-arquivo'] = function () {
    var campo = document.getElementById('novo-arq-nome'), nomeArq = campo.value.trim().replace(/[\/\\]/g, '-');
    if (!nomeArq) return;
    if (nomeArq.indexOf('.') === -1) nomeArq += '.md';
    var tipo = BC.explorador.tipoDe(nomeArq);
    var inicial = tipo === 'html' ? '<!doctype html>\n<html lang="pt-BR">\n<head><meta charset="utf-8"><title>Nova página</title>\n<style>body{font-family:system-ui,sans-serif;background:#060b16;color:#d7e4fb;padding:40px}h1{color:#c7a2ff}</style></head>\n<body>\n  <h1>Olá!</h1>\n  <p>Edite o código e o site muda na hora.</p>\n</body>\n</html>' : tipo === 'md' ? '# ' + nomeArq.replace(/\.md$/, '') + '\n' : '';
    ui().novoArquivo = false;
    criarEAbrir(base() + nomeArq, TEXTO[tipo] ? tipo : 'txt', inicial, 'editar');
  };
})(window.BC);
