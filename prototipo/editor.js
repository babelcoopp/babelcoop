/* Babel Coop — protótipo · editor do meio (como o do VS Code): abre cada tipo de arquivo do jeito certo */
window.BC = window.BC || {};
BC.acoes = BC.acoes || {};
BC.locais = BC.locais || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc, A = BC.acoes;
  function L() { return BC.loja; }
  var LING = { js: 'javascript', ts: 'typescript', py: 'python', sh: 'bash', css: 'css', json: 'json', html: 'xml', md: 'markdown', txt: 'plaintext', csv: 'plaintext' };
  var TEXTO = { md: 1, txt: 1, csv: 1, js: 1, ts: 1, py: 1, sh: 1, css: 1, json: 1, html: 1 };
  var comps = {};

  function conteudo(a) { return a.local ? BC.locais[a.id] : a.conteudo; }
  function nome(a) { return a.caminho.split('/').pop(); }
  function dono(a) { return a.dono === 'equipe' ? 'a equipe' : L().nome(a.dono); }

  /* ---------- pedaços de HTML ---------- */

  function realce(codigo, lingua) {
    if (window.hljs && lingua && lingua !== 'plaintext') {
      try { return window.hljs.highlight(codigo, { language: lingua, ignoreIllegals: true }).value; } catch (e) { /* cai no texto puro */ }
    }
    return esc(codigo);
  }

  function blocoCodigo(codigo, lingua) {
    var linhas = String(codigo).split('\n'), nums = '';
    for (var i = 1; i <= linhas.length; i++) nums += i + '\n';
    return '<div class="codigo"><pre class="codigo-nums" aria-hidden="true">' + nums + '</pre><pre class="codigo-texto"><code class="hljs">' + realce(codigo, lingua) + '</code></pre></div>';
  }

  function mdSimples(md) {
    return md.split(/\n{2,}/).map(function (b) {
      if (/^#{1,3} /.test(b)) { var n = b.match(/^#+/)[0].length; return '<h' + n + '>' + esc(b.replace(/^#+ /, '')) + '</h' + n + '>'; }
      if (/^- /.test(b)) return '<ul>' + b.split('\n').map(function (l) { return '<li>' + esc(l.replace(/^- /, '')) + '</li>'; }).join('') + '</ul>';
      return '<p>' + esc(b).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }

  function markdown(md) {
    if (window.marked && window.DOMPurify) {
      try { return window.DOMPurify.sanitize(window.marked.parse(md)); } catch (e) { /* cai no simples */ }
    }
    return mdSimples(md);
  }

  function tabelaCsv(csv) {
    var linhas = csv.trim().split('\n').map(function (l) { return l.split(','); });
    return '<div class="tabela-rolagem"><table class="tabela csv"><thead><tr>' + linhas[0].map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      linhas.slice(1).map(function (l) { return '<tr>' + l.map(function (c) { return '<td class="' + (/^[\d.,]+$/.test(c) ? 'num' : '') + '">' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }

  function trilhaDoCaminho(a) {
    var partes = a.caminho.split('/');
    partes[0] = partes[0] === 'equipe' ? 'EQUIPE' : L().nome(partes[0]);
    return partes.map(function (p, i) { return '<span' + (i === partes.length - 1 ? ' class="atual"' : '') + '>' + esc(p) + '</span>'; }).join('<span class="sep">›</span>');
  }

  function barra(tab, a) {
    var r = L().estado.reuniao, pode = L().podeEditar(a), txt = TEXTO[a.tipo], modo = tab.modo || 'ver', b = '';
    function botao(acao, texto, extra, primario) { return '<button class="botao' + (primario ? ' primario' : ' discreto') + '" type="button" data-acao="' + acao + '"' + (extra || '') + '>' + texto + '</button>'; }
    if (modo === 'editar') {
      b += botao('ed-salvar', 'Salvar', ' title="Ctrl+S"', true) + botao('ed-modo', 'Cancelar', ' data-modo="ver"');
    } else {
      if (a.tipo === 'md') b += botao('ed-modo', modo === 'texto' ? 'Formatado' : 'Texto', ' data-modo="' + (modo === 'texto' ? 'ver' : 'texto') + '"');
      if (a.tipo === 'html') {
        var vis = tab.vis || 'site';
        b += '<span class="alternar ed-alternar"><button type="button" class="' + (vis === 'site' ? 'ativo' : '') + '" data-acao="ed-vis" data-v="site">Site</button><button type="button" class="' + (vis === 'codigo' ? 'ativo' : '') + '" data-acao="ed-vis" data-v="codigo">Código</button><button type="button" class="' + (vis === '3d' ? 'ativo' : '') + '" data-acao="ed-vis" data-v="3d" title="A tela num ambiente 3D, com os próximos itens ao lado">3D</button></span>';
        if (vis === 'site' && pode) b += botao('ed-visual', tab.visual ? '✓ Pronto' : '✎ Editar na tela', ' title="Clique seleciona, arraste move, duplo clique edita o texto"', !!tab.visual);
        if (vis === 'site' && tab.visual && tab.selVisual) {
          b += '<span class="ed-vsel"><code>' + esc(tab.selVisual.tag) + '</code>' + (tab.selVisual.texto ? '<span>' + esc(tab.selVisual.texto) + '</span>' : '') + '</span>' +
            botao('ed-visual-cmd', 'Texto', ' data-cmd="texto" title="Editar o texto"') + botao('ed-visual-cmd', '↑', ' data-cmd="subir" title="Subir"') + botao('ed-visual-cmd', '↓', ' data-cmd="descer" title="Descer"') + botao('ed-visual-cmd', 'Duplicar', ' data-cmd="duplicar"') + botao('ed-visual-cmd', 'Apagar', ' data-cmd="apagar"');
        }
        if (tab.rascunhoVisual != null) b += botao('ed-visual-salvar', 'Salvar (' + (tab.mudancasVisual || 1) + ')', ' title="Ctrl+S"', true) + botao('ed-visual-descartar', 'Descartar');
        if (vis === 'site' && tab.rascunhoVisual == null) b += botao('ed-preset', '★ Salvar como preset', ' title="Guarda esta tela para a equipe começar dela em qualquer projeto"');
      }
      if (a.tipo === 'pdf') b += botao('ed-zoom', '−', ' data-d="-1" aria-label="Diminuir"') + botao('ed-zoom', '+', ' data-d="1" aria-label="Aumentar"');
      if (txt && pode) b += botao('ed-modo', 'Editar', ' data-modo="editar"');
      if (!pode && txt) b += botao('ed-sugerir', 'Sugerir mudança');
    }
    b += '<span class="ed-sep"></span>';
    if (r && r.ativa) b += botao('ed-reuniao', '☰ Levar para a reunião');
    b += botao('ed-projetar', '▣ Projetar na TV') + botao('ed-ajuda', 'Pedir ajuda') + botao('ed-chamar', 'Chamar para cá') + botao('ed-versoes', 'Versões (' + a.versoes.length + ')');
    var quem = a.salvoPor ? L().pessoa(a.salvoPor) : null;
    var salvo = quem ? '<span class="ed-salvo" title="' + esc(quem.nome) + ' salvou por último">' + U.avatar(quem, 20) + '<span>salvo por ' + esc(quem.id === L().eu ? 'você' : quem.nome) + ' · ' + U.relativo(a.salvoEm || a.modificado) + '</span></span>' : '';
    return '<div class="ed-barra"><nav class="ed-trilha" aria-label="Caminho">' + trilhaDoCaminho(a) + '</nav>' + salvo + '<div class="ed-botoes">' + b + '</div></div>';
  }

  function avisos(tab, a) {
    var h = '';
    if (!L().podeEditar(a) && a.dono !== L().eu) h += '<div class="ed-aviso">Arquivo de ' + esc(dono(a)) + '. Você pode ver e sugerir mudanças; quem edita é o dono ou a gestão.</div>';
    else if (a.dono !== L().eu && a.dono !== 'equipe' && (tab.modo === 'editar')) h += '<div class="ed-aviso gestao">Você está corrigindo o arquivo de ' + esc(dono(a)) + ' como gestão. Ao salvar, ' + esc(dono(a)) + ' é avisado(a) e a versão anterior fica guardada.</div>';
    if (tab.versoes) {
      h += '<div class="ed-versoes cartao"><div class="secao-cab"><span class="rotulo">Versões anteriores</span><button class="botao discreto" type="button" data-acao="ed-versoes">Fechar</button></div>' +
        (a.versoes.length ? '<ul class="lista-limpa">' + a.versoes.map(function (v, i) {
          return '<li class="item" style="--cor:#42597d"><span class="item-corpo"><span class="item-titulo">' + U.quando(v.ts) + ' · antes da mudança de ' + esc(L().nome(v.quem)) + '</span>' +
            '<span class="item-meta">' + esc(String(v.conteudo || '').slice(0, 90)) + '</span></span>' +
            (L().podeEditar(a) ? '<button class="botao" type="button" data-acao="ed-voltar" data-i="' + i + '">Voltar como estava</button>' : '') + '</li>';
        }).join('') + '</ul>' : '<p class="form-ajuda">Ainda não há versões anteriores. Toda gravação guarda a anterior aqui, inclusive o que a IA mudar.</p>') + '</div>';
    }
    return h;
  }

  function corpo(tab, a) {
    var c = conteudo(a), modo = tab.modo || 'ver';
    if (a.local && c == null) return '<div class="ed-vazio">Arquivo grande: fica só no computador de ' + esc(dono(a)) + '. No app, abre pela rede.</div>';
    if ((a.tipo === 'video' || a.tipo === 'binario') && !L().online(a.dono) && a.dono !== 'equipe') {
      return '<div class="ed-vazio">' + esc(dono(a)) + ' está offline. Este arquivo fica só no computador dele(a) e volta quando o computador ligar.</div>';
    }
    if (modo === 'editar') return '<textarea class="ed-texto" id="ed-texto-' + esc(a.id) + '" spellcheck="false" aria-label="Conteúdo do arquivo">' + esc(c || '') + '</textarea>';
    switch (a.tipo) {
      case 'md': return modo === 'texto' ? blocoCodigo(c, 'markdown') : '<article class="md-corpo">' + markdown(c) + '</article>';
      case 'csv': return tabelaCsv(c);
      case 'html':
        if ((tab.vis || 'site') === 'codigo') return (tab.rascunhoVisual != null ? '<div class="ed-previa-barra visual">Código com as mudanças feitas na tela · ainda não salvo · Salvar grava no arquivo</div>' : '') + blocoCodigo(tab.rascunhoVisual != null ? tab.rascunhoVisual : c, 'xml');
        if (tab.vis === '3d') return '<div class="ed-site"><div class="ed-previa-barra">3D · a tela num ambiente com os próximos itens · clique na tela, digite, Enter: o pulso corre pelo fio · arraste para girar, roda aproxima</div><div class="ed-3d"></div></div>';
        return '<div class="ed-site"><div class="ed-previa-barra' + (tab.visual ? ' visual' : '') + '">' + (tab.visual ? 'Editando na tela · clique seleciona · arraste e solte para mover · duplo clique edita o texto · Delete apaga · o código muda junto' : 'Site · como fica de verdade · edite e salve: muda na hora') + '</div><iframe class="ed-iframe ed-site-iframe" sandbox="allow-scripts" title="Site renderizado"></iframe></div>';
      case 'pdf': return '<div class="pdf-paginas"><p class="form-ajuda">Abrindo o PDF…</p></div>';
      case 'imagem': return '<div class="ed-imagem"><img src="' + esc(c) + '" alt="' + esc(nome(a)) + '"></div>';
      case 'video':
        if (a.local && c) return '<div class="ed-imagem"><video class="ed-video-real" controls src="' + esc(c) + '"></video></div>';
        return '<div class="ed-imagem"><div class="ed-video"><div class="proj-play-mini"></div><span>' + esc(nome(a)) + ' · ' + esc(a.tamanho) + ' · toca pela rede, do computador de ' + esc(dono(a)) + '</span></div></div>';
      case 'binario': return '<div class="ed-vazio">Sem prévia para este tipo de arquivo. Ele abre no programa do computador de ' + esc(dono(a)) + '.</div>';
      case 'mapa': return '<div class="ed-mapa"></div>';
      case 'quadro': return '<div class="ed-quadro"></div>';
      default: return blocoCodigo(c, LING[a.tipo] || 'plaintext');
    }
  }

  /* ---------- partes vivas (PDF, mapa, quadro, prévia) ---------- */

  function bytesDe(a) {
    var c = conteudo(a);
    if (c && c.indexOf('data:application/pdf') === 0) {
      var bin = atob(c.split(',')[1]), bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return bytes;
    }
    return BC.pdf.gerar(JSON.parse(c));
  }

  function pdfSimples(a) {
    try {
      var d = JSON.parse(conteudo(a));
      return d.paginas.map(function (p) { return '<div class="pdf-simples"><h3>' + esc(d.titulo) + '</h3>' + p.map(function (l) { return l.indexOf('# ') === 0 ? '<h4>' + esc(l.slice(2)) + '</h4>' : '<p>' + esc(l) + '</p>'; }).join('') + '</div>'; }).join('');
    } catch (e) { return '<div class="ed-vazio">Não foi possível abrir este PDF aqui.</div>'; }
  }

  function renderPdf(a, el, zoom) {
    var alvo = el.querySelector('.pdf-paginas');
    if (!window.pdfjsLib) { alvo.innerHTML = pdfSimples(a); return; }
    try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; } catch (e) { /* sem worker */ }
    window.pdfjsLib.getDocument({ data: bytesDe(a) }).promise.then(function (pdf) {
      alvo.innerHTML = '';
      for (var n = 1; n <= pdf.numPages; n++) {
        (function (n) {
          var cv = document.createElement('canvas');
          cv.className = 'pdf-pagina';
          alvo.appendChild(cv);
          pdf.getPage(n).then(function (pg) {
            var vp = pg.getViewport({ scale: 1.3 * zoom }), dpr = Math.min(2, window.devicePixelRatio || 1);
            cv.width = vp.width * dpr; cv.height = vp.height * dpr; cv.style.width = vp.width + 'px';
            var ctx = cv.getContext('2d');
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            pg.render({ canvasContext: ctx, viewport: vp });
          });
        })(n);
      }
    }).catch(function () { alvo.innerHTML = pdfSimples(a); });
  }

  function montarVivos(tab, a, el) {
    var c = { modificado: a.modificado };
    if (a.tipo === 'pdf' && (tab.modo || 'ver') !== 'editar') renderPdf(a, el, tab.zoom || 1);
    if (a.tipo === 'html' && (tab.vis || 'site') === 'site') {
      var f = el.querySelector('.ed-iframe'), html = tab.rascunhoVisual != null ? tab.rascunhoVisual : (conteudo(a) || '');
      /* na edição na tela, cada bloco mexido fica com a marca (data-por) e a cor de quem mexeu */
      var cores = L().estado.pessoas.map(function (p) { return '[data-por="' + p.id + '"]{box-shadow:inset 4px 0 0 ' + p.cor + ' !important}[data-por="' + p.id + '"]::after{content:"' + (p.nome || '').replace(/"/g, '') + '";position:absolute;margin:-14px 0 0 4px;font:10px system-ui;color:' + p.cor + ';pointer-events:none}'; }).join('');
      if (f) f.srcdoc = tab.visual ? html + '<style data-bc-visual>' + cores + '</style><script data-bc-visual>' + VISUAL.replace('__ID__', a.id).replace('__EU__', L().eu) + '</script>' : html;
    }
    if (a.tipo === 'html' && tab.vis === '3d' && BC.visual3d) { var t3 = el.querySelector('.ed-3d'); if (t3) { BC.visual3d.montar(t3, a.id); c.v3d = a.id; } }
    if (a.tipo === 'mapa') {
      var alvoM = el.querySelector('.ed-mapa');
      try {
        c.mapa = new BC.MapaMental(alvoM, JSON.parse(conteudo(a)), {
          editavel: L().podeEditar(a),
          aoMudar: function (dados) { L().fazer('salvarArquivo', a.id, JSON.stringify(dados)); }
        });
      } catch (e) { alvoM.innerHTML = '<div class="ed-vazio">Mapa ilegível.</div>'; }
    }
    if (a.tipo === 'quadro') c.quadro = new BC.Quadro(el.querySelector('.ed-quadro'), a.id, { editavel: a.dono === 'equipe' || L().podeEditar(a), aoVivo: true });
    return c;
  }

  function destruir(c) { if (c && c.quadro) c.quadro.destruir(); if (c && c.mapa && c.mapa.destruir) c.mapa.destruir(); if (c && c.v3d && BC.visual3d) BC.visual3d.destruir(c.v3d); }

  /* desenha a aba de arquivo; se nada relevante mudou, só atualiza as partes vivas */
  BC.editor = {
    /* peças que a TV também usa para mostrar um arquivo */
    markdown: markdown, tabelaCsv: tabelaCsv, blocoCodigo: blocoCodigo, bytesDe: bytesDe, pdfSimples: pdfSimples, conteudo: conteudo, lingua: function (tipo) { return LING[tipo] || 'plaintext'; },
    desenhar: function (tab, el) {
      var a = L().arquivo(tab.ref);
      if (!a) { el.innerHTML = '<p class="vazio">Este arquivo não existe mais.</p>'; el.dataset.chave = ''; return; }
      var chave = [tab.id, tab.modo || 'ver', tab.vis || 'site', tab.visual ? 1 : 0, tab.vis === 'codigo' && tab.rascunhoVisual != null ? tab.mudancasVisual : 0, tab.versoes ? 1 : 0, tab.zoom || 1, L().eu, L().estado.reuniao && L().estado.reuniao.ativa ? 1 : 0].join('|'); /* salvar não remonta a aba: a barra é atualizada à parte e as partes vivas recebem o conteúdo novo */
      var c = comps[tab.id];
      if (c && el.dataset.chave === chave) {
        if (c.quadro) c.quadro.atualizar();
        else if (c.mapa) { if (a.modificado !== c.modificado) c.mapa.atualizar(JSON.parse(conteudo(a))); }
        else if ((tab.modo || 'ver') !== 'editar' && a.modificado !== c.modificado) { el.dataset.chave = ''; BC.editor.desenhar(tab, el); return; }
        c.modificado = a.modificado;
        var nb = el.querySelector('.ed-barra');
        if (nb) nb.outerHTML = barra(tab, a);
        return;
      }
      destruir(c);
      el.innerHTML = barra(tab, a) + avisos(tab, a) + '<div class="ed-corpo ed-' + a.tipo + '">' + corpo(tab, a) + '</div>';
      el.dataset.chave = chave;
      comps[tab.id] = montarVivos(tab, a, el);
      if (!tab.contou) { tab.contou = true; a.consultas = (a.consultas || 0) + 1; }
      el.querySelectorAll('.md-corpo pre code').forEach(function (b) { if (window.hljs) try { window.hljs.highlightElement(b); } catch (e) { /* sem realce */ } });
    },
    esquecer: function (tabId) { destruir(comps[tabId]); delete comps[tabId]; },
    /* a parte viva da aba de um arquivo (o agente do mapa usa para atualizar sem redesenhar) */
    componente: function (arquivoId) { return comps['arq:' + arquivoId] || null; },
    salvar: function () {
      var tab = BC.estacao.abaAtual(), a = tab && L().arquivo(tab.ref), campo = a && document.getElementById('ed-texto-' + a.id);
      if (a && tab.rascunhoVisual != null && !campo) return salvarVisual(tab, a);
      if (!campo) return false;
      if (a.local) { BC.locais[a.id] = campo.value; tab.modo = 'ver'; BC.estacao.render(); return true; }
      L().fazer('salvarArquivo', a.id, campo.value);
      tab.modo = 'ver';
      BC.estacao.aviso(a.dono !== L().eu && a.dono !== 'equipe' ? 'Salvo. ' + dono(a) + ' foi avisado(a) da correção.' : 'Salvo. A versão anterior ficou guardada.');
      BC.estacao.render();
      return true;
    }
  };

  /* ---------- edição na tela (arrastar, soltar, trocar texto) ----------
     Roda dentro do iframe do site. Cada mudança manda o HTML inteiro de volta para a aba,
     que mostra em Código e grava no arquivo ao Salvar. No app real, o mapeamento
     elemento → arquivo:linha é feito por transformação nossa (CHECKLIST 11a). */

  var VISUAL = "(function(){var ID='__ID__',sel=null,arr=null,marca=null;" +
    "var st=document.createElement('style');st.setAttribute('data-bc-visual','');st.textContent='[data-bc-hover]{outline:1px dashed #8b5cf6!important;outline-offset:-1px}[data-bc-sel]{outline:2px solid #8b5cf6!important;outline-offset:-2px;cursor:move}[data-bc-sel][contenteditable]{outline-color:#22c55e!important;cursor:text}[data-bc-antes]{box-shadow:0 -3px 0 0 #22d3ee!important}[data-bc-depois]{box-shadow:0 3px 0 0 #22d3ee!important}[data-bc-drag]{opacity:.35}';document.head.appendChild(st);" +
    "function ok(el){return el&&el.nodeType===1&&el!==document.body&&el!==document.documentElement&&!el.closest('script,style,[data-bc-visual]');}" +
    "function limpar(a){document.querySelectorAll('['+a+']').forEach(function(e){e.removeAttribute(a);});}" +
    "function serializar(){var c=document.documentElement.cloneNode(true);c.querySelectorAll('[data-bc-visual]').forEach(function(e){e.remove();});c.querySelectorAll('*').forEach(function(e){['data-bc-hover','data-bc-sel','data-bc-antes','data-bc-depois','data-bc-drag','draggable','contenteditable'].forEach(function(a){e.removeAttribute(a);});});return (document.doctype?'<!DOCTYPE html>\\n':'')+c.outerHTML;}" +
    "function enviar(){if(sel)sel.setAttribute('data-por','__EU__');parent.postMessage({tipo:'babel-visual',id:ID,html:serializar()},'*');}" +
    "function selecionar(el){if(sel){sel.removeAttribute('data-bc-sel');if(sel.hasAttribute('contenteditable')){sel.removeAttribute('contenteditable');sel.setAttribute('draggable','true');}}sel=el;if(el)el.setAttribute('data-bc-sel','');parent.postMessage({tipo:'babel-visual-sel',id:ID,tag:el?el.tagName.toLowerCase():'',texto:el?(el.textContent||'').trim().slice(0,40):''},'*');}" +
    "function editarTexto(){if(!sel)return;sel.setAttribute('contenteditable','true');sel.removeAttribute('draggable');sel.focus();}" +
    "document.querySelectorAll('body *').forEach(function(e){if(ok(e))e.setAttribute('draggable','false');});" +
    "document.addEventListener('mouseover',function(ev){limpar('data-bc-hover');if(ok(ev.target)&&ev.target!==sel)ev.target.setAttribute('data-bc-hover','');});" +
    "var arrastou=false;" +
    "document.addEventListener('click',function(ev){if(arrastou){arrastou=false;ev.preventDefault();ev.stopPropagation();return;}if(sel&&sel.hasAttribute('contenteditable')&&sel.contains(ev.target))return;ev.preventDefault();selecionar(ok(ev.target)?ev.target:null);},true);" +
    "document.addEventListener('dblclick',function(ev){if(!ok(ev.target))return;ev.preventDefault();selecionar(ev.target);editarTexto();});" +
    "document.addEventListener('input',function(){if(sel&&sel.hasAttribute('contenteditable'))enviar();});" +
    "document.addEventListener('keydown',function(ev){if(!sel)return;if(sel.hasAttribute('contenteditable')){if(ev.key==='Escape'){sel.blur();selecionar(sel);}return;}if(ev.key==='Delete'||ev.key==='Backspace'){ev.preventDefault();var p=sel;selecionar(null);p.remove();enviar();}else if(ev.key==='Escape')selecionar(null);});" +
    /* arrastar com o ponteiro (mouse, caneta e dedo), sem o drag nativo do navegador: funciona igual em todo lugar */
    "var ini=null;" +
    "document.addEventListener('pointerdown',function(ev){if(ev.button!==0||!ok(ev.target)||(sel&&sel.hasAttribute('contenteditable')&&sel.contains(ev.target)))return;ini={el:ev.target,x:ev.clientX,y:ev.clientY};},true);" +
    "document.addEventListener('pointermove',function(ev){if(!ini)return;if(!arr){if(Math.abs(ev.clientX-ini.x)+Math.abs(ev.clientY-ini.y)<6)return;arr=ini.el;arr.setAttribute('data-bc-drag','');arr.style.pointerEvents='none';selecionar(arr);document.body.style.userSelect='none';}ev.preventDefault();var alvo=document.elementFromPoint(ev.clientX,ev.clientY);limpar('data-bc-antes');limpar('data-bc-depois');marca=null;if(!ok(alvo)||alvo===arr||arr.contains(alvo))return;var r=alvo.getBoundingClientRect();alvo.setAttribute(ev.clientY<r.top+r.height/2?'data-bc-antes':'data-bc-depois','');marca=alvo;},true);" +
    "function soltar(){if(arr){var a=arr;a.removeAttribute('data-bc-drag');a.style.pointerEvents='';if(!a.getAttribute('style'))a.removeAttribute('style');if(marca){marca.parentNode.insertBefore(a,marca.hasAttribute('data-bc-antes')?marca:marca.nextSibling);}limpar('data-bc-antes');limpar('data-bc-depois');document.body.style.userSelect='';if(!document.body.getAttribute('style'))document.body.removeAttribute('style');var mudou=!!marca;arr=null;marca=null;arrastou=true;setTimeout(function(){arrastou=false;},50);selecionar(a);if(mudou)enviar();}ini=null;}" +
    "document.addEventListener('pointerup',soltar,true);document.addEventListener('pointercancel',soltar,true);" +
    "document.addEventListener('dragstart',function(ev){ev.preventDefault();});" +
    "window.addEventListener('message',function(ev){var d=ev.data||{};if(d.tipo!=='babel-visual-cmd'||!sel)return;if(d.cmd==='apagar'){var p=sel;selecionar(null);p.remove();enviar();}else if(d.cmd==='duplicar'){var c=sel.cloneNode(true);c.removeAttribute('data-bc-sel');sel.parentNode.insertBefore(c,sel.nextSibling);selecionar(c);enviar();}else if(d.cmd==='texto')editarTexto();else if(d.cmd==='subir'&&sel.previousElementSibling){sel.parentNode.insertBefore(sel,sel.previousElementSibling);enviar();}else if(d.cmd==='descer'&&sel.nextElementSibling){sel.parentNode.insertBefore(sel.nextElementSibling,sel);enviar();}});" +
    "})();";

  function abaVisual(id) { return (BC.estacao.ui.abas || []).filter(function (t) { return t.tipo === 'arquivo' && t.ref === id && t.visual; })[0]; }

  window.addEventListener('message', function (ev) {
    var d = ev.data || {};
    if (d.tipo !== 'babel-visual' && d.tipo !== 'babel-visual-sel') return;
    var tab = abaVisual(d.id);
    if (!tab) return;
    if (d.tipo === 'babel-visual-sel') tab.selVisual = d.tag ? { tag: d.tag, texto: d.texto } : null;
    else {
      var a = L().arquivo(d.id);
      if (a && d.html === (conteudo(a) || '')) { tab.rascunhoVisual = null; tab.mudancasVisual = 0; }
      else { tab.rascunhoVisual = d.html; tab.mudancasVisual = (tab.mudancasVisual || 0) + 1; }
    }
    BC.estacao.render();
  });

  function salvarVisual(tab, a) {
    if (a.local) BC.locais[a.id] = tab.rascunhoVisual; else L().fazer('salvarArquivo', a.id, tab.rascunhoVisual);
    tab.rascunhoVisual = null; tab.mudancasVisual = 0;
    BC.estacao.aviso('Salvo. O que você mexeu na tela já está no código' + (a.dono !== L().eu && a.dono !== 'equipe' ? ', e ' + dono(a) + ' foi avisado(a).' : '.'));
    BC.estacao.render();
    return true;
  }

  function iframeDe(el) { var c = el.closest('[data-chave]') || document; return c.querySelector('.ed-site-iframe'); }

  /* ---------- ações da barra do arquivo ---------- */

  function tabAtual() { return BC.estacao.abaAtual(); }
  function arqAtual() { var t = tabAtual(); return t && L().arquivo(t.ref); }

  A['ed-visual'] = function () { var t = tabAtual(); t.visual = !t.visual; t.selVisual = null; BC.estacao.render(); };
  /* uma tela que funcionou vira preset da equipe (fica na lista de Criar e da Máquina) */
  A['ed-preset'] = function () {
    var a = arqAtual();
    if (!a) return;
    var nomeP = nome(a).replace(/\.html?$/i, ''), pj = (a.caminho.match(/Projetos\/([^/]+)\//) || [])[1] || '';
    if (L().fazer('presetSalvar', { tipo: 'tela', nome: nomeP.charAt(0).toUpperCase() + nomeP.slice(1), descricao: 'Tela de ' + dono(a) + (pj ? ' no projeto ' + pj : ''), projeto: pj, arquivo: a.caminho })) BC.estacao.aviso('Tela guardada como preset. Aparece em Criar, "Começar de um preset", para toda a equipe.');
  };
  A['ed-visual-cmd'] = function (el) { var f = iframeDe(el); if (f && f.contentWindow) f.contentWindow.postMessage({ tipo: 'babel-visual-cmd', cmd: el.dataset.cmd }, '*'); };
  A['ed-visual-salvar'] = function () { var t = tabAtual(), a = arqAtual(); if (a && t.rascunhoVisual != null) salvarVisual(t, a); };
  A['ed-visual-descartar'] = function () { var t = tabAtual(); t.rascunhoVisual = null; t.mudancasVisual = 0; t.selVisual = null; BC.estacao.render(); };

  A['ed-modo'] = function (el) { tabAtual().modo = el.dataset.modo; BC.estacao.render(); };
  A['ed-salvar'] = function () { BC.editor.salvar(); };
  A['ed-vis'] = function (el) { var t = tabAtual(); t.vis = el.dataset.v; BC.estacao.render(); };
  A['ed-chamar'] = function () {
    var a = arqAtual();
    if (!a) return;
    BC.estacao.abrirPaleta();
    var pe = document.getElementById('paleta-entrada');
    pe.placeholder = 'Chamar quem para ver ' + nome(a) + '?';
    var outros = L().estado.pessoas.filter(function (p) { return p.id !== L().eu && p.status !== 'offline'; });
    document.getElementById('paleta-lista').innerHTML = outros.map(function (p) { return '<li role="option" data-chamar="' + p.id + '"><span>' + esc(p.nome) + '</span><span>chamar</span></li>'; }).join('');
    document.getElementById('paleta-lista').onclick = function (ev) {
      var li = ev.target.closest('li[data-chamar]');
      if (!li) return;
      document.getElementById('paleta').hidden = true;
      document.getElementById('paleta-lista').onclick = null;
      if (L().fazer('chamarParaTela', li.dataset.chamar, nome(a))) BC.estacao.aviso('Convite enviado para ' + L().nome(li.dataset.chamar) + ': "vem ver ' + nome(a) + '".');
    };
  };
  A['ed-versoes'] = function () { var t = tabAtual(); t.versoes = !t.versoes; BC.estacao.render(); };
  A['ed-zoom'] = function (el) { var t = tabAtual(); t.zoom = Math.max(0.6, Math.min(2, (t.zoom || 1) + (+el.dataset.d) * 0.2)); BC.estacao.render(); };
  A['ed-voltar'] = function (el) { var a = arqAtual(); if (a && L().fazer('voltarVersao', a.id, +el.dataset.i)) BC.estacao.aviso('Voltou como estava. A versão desfeita também ficou guardada.'); };
  A['ed-reuniao'] = function () { var a = arqAtual(); if (a && L().fazer('jogarNaReuniao', a.caminho)) BC.estacao.aviso('"' + nome(a) + '" está na mesa da reunião.'); };
  A['ed-projetar'] = function () { var a = arqAtual(); if (a && L().fazer('projetar', a.caminho)) BC.estacao.aviso('Projetando na TV.'); else BC.estacao.aviso('Não dá para projetar: o dono está offline.'); };
  A['ed-ajuda'] = function () {
    var a = arqAtual();
    if (a && L().fazer('pedirAjuda', 'com "' + nome(a) + '"', a.caminho)) BC.estacao.aviso('Pedido de ajuda enviado ao Theus, com o arquivo junto.');
  };
  A['ed-sugerir'] = function () {
    var a = arqAtual();
    if (!a) return;
    BC.estacao.ui.rascunho = { titulo: 'Sugestão em "' + nome(a) + '"', para: a.dono === 'equipe' ? 'theus' : a.dono, descricao: 'Arquivo: ' + a.caminho + '. O que eu mudaria: ' };
    A['nova-demanda']();
  };
})(window.BC);
