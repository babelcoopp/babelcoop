/* Babel Coop — protótipo · acervo: catálogo de tudo o que a equipe cria, com busca sem LLM
   - por palavras: BM25 (o cálculo dos buscadores)
   - por semelhança: vetores de pedaços de palavras (trigramas com hashing), calculados aqui mesmo */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var U = BC.util;
  var STOP = {};
  ('a o os as de da do das dos e em no na nos nas um uma uns umas para por com sem que se ao aos ser foi sao como mais menos ' +
   'muito ja nao sim ou mas quando onde porque pra pro isso este esta esse essa isto eu voce ele ela nos eles elas me te lhe seu sua ' +
   'seus suas meu minha nosso nossa tem ter vai vou era sobre ate the and of to in is it').split(' ').forEach(function (w) { STOP[w] = true; });

  function tokens(t) {
    return U.normalizar(t).split(/[^a-z0-9]+/).filter(function (w) { return w.length > 1 && !STOP[w]; });
  }
  function raiz(w) { return w.length > 4 && w.charAt(w.length - 1) === 's' ? w.slice(0, -1) : w; }

  var DIM = 512;
  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) % DIM;
  }

  var A = { tokens: tokens };

  /* vetor de semelhança: trigramas de letras + palavras, com peso sublinear e normalizado */
  A.vetor = function (texto) {
    var v = new Float32Array(DIM), norma = 0, i;
    tokens(texto).forEach(function (w) {
      var p = ' ' + w + ' ';
      for (i = 0; i < p.length - 2; i++) v[hash(p.substr(i, 3))] += 1;
      v[hash('w:' + raiz(w))] += 1.5;
    });
    for (i = 0; i < DIM; i++) { v[i] = Math.sqrt(v[i]); norma += v[i] * v[i]; }
    norma = Math.sqrt(norma) || 1;
    for (i = 0; i < DIM; i++) v[i] /= norma;
    return v;
  };
  A.cosseno = function (a, b) { var s = 0; for (var i = 0; i < DIM; i++) s += a[i] * b[i]; return s; };

  /* compara um texto com uma lista e devolve os mais parecidos */
  A.parecidos = function (texto, lista, campo) {
    var q = A.vetor(texto);
    return lista.map(function (item) { return { item: item, sim: A.cosseno(q, A.vetor(item[campo || 'texto'])) }; })
      .sort(function (a, b) { return b.sim - a.sim; });
  };

  function textosDoMapa(no) { return [no.texto].concat((no.filhos || []).map(textosDoMapa).join(' ')).join(' '); }

  A.textoDoArquivo = function (a) {
    if (!a.conteudo) return a.caminho;
    try {
      if (a.tipo === 'pdf') { var d = JSON.parse(a.conteudo); return d.titulo + '\n' + d.paginas.map(function (p) { return p.join('\n'); }).join('\n'); }
      if (a.tipo === 'mapa') return textosDoMapa(JSON.parse(a.conteudo).raiz);
      if (a.tipo === 'quadro') return JSON.parse(a.conteudo).itens.filter(function (i) { return i.texto; }).map(function (i) { return i.texto; }).join('\n');
    } catch (e) { return a.caminho; }
    if (a.tipo === 'imagem' || a.tipo === 'video' || a.tipo === 'binario') return a.caminho;
    if (a.tipo === 'html') return a.conteudo.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
    return a.conteudo;
  };

  var TIPO_ARQ = { md: 'nota', txt: 'nota', csv: 'planilha', pdf: 'pdf', mapa: 'mapa', quadro: 'quadro', imagem: 'imagem', video: 'vídeo', binario: 'arquivo' };

  /* tudo o que entra no acervo */
  A.documentos = function (e) {
    var L = BC.loja, docs = [];
    e.arquivos.forEach(function (a) {
      var pasta = a.caminho.split('/');
      docs.push({ id: 'arq:' + a.id, tipo: a.caminho.indexOf('equipe/Reuniões/') === 0 ? 'ata' : (TIPO_ARQ[a.tipo] || 'código'), titulo: pasta[pasta.length - 1],
        caminho: a.caminho, pessoa: a.autor, ts: a.modificado, texto: A.textoDoArquivo(a), abrir: { tipo: 'arquivo', ref: a.id } });
    });
    e.aprendizados.forEach(function (ap) {
      docs.push({ id: 'ap:' + ap.id, tipo: 'aprendizado', titulo: (ap.ia ? 'IA do terminal de ' : 'Aprendizado de ') + L.nome(ap.pessoa), pessoa: ap.pessoa, ts: ap.ts,
        texto: ap.texto + (ap.origem ? ' (' + ap.origem + ')' : ''), abrir: { tipo: 'aprendizados' } });
    });
    e.demandas.forEach(function (d) {
      docs.push({ id: 'dem:' + d.id, tipo: 'demanda', titulo: d.titulo, pessoa: d.para, ts: d.criada,
        texto: d.titulo + '. ' + (d.descricao || '') + ' ' + d.historico.map(function (h) { return h.nota; }).join(' ') + ' ' + (d.aprendizado || ''), abrir: { tipo: 'demanda', ref: d.id } });
    });
    e.prompts.forEach(function (p) {
      docs.push({ id: 'pr:' + p.id, tipo: 'prompt', titulo: 'Prompt de ' + L.nome(p.pessoa), pessoa: p.pessoa, ts: p.ts, texto: p.texto, abrir: { tipo: 'prompts' } });
    });
    e.ideias.forEach(function (i) {
      docs.push({ id: 'id:' + i.id, tipo: 'ideia', titulo: 'Ideia de ' + L.nome(i.pessoa), pessoa: i.pessoa, ts: i.ts, texto: i.texto, abrir: { tipo: 'ideias' } });
    });
    e.pergunta.respostas.forEach(function (r, n) {
      docs.push({ id: 'resp:' + n, tipo: 'resposta', titulo: 'Pergunta da semana · ' + L.nome(r.pessoa), pessoa: r.pessoa, ts: r.ts, texto: e.pergunta.texto + ' ' + r.texto, abrir: { tipo: 'pergunta' } });
    });
    e.sala.momentos.forEach(function (m) {
      docs.push({ id: 'fala:' + m.id, tipo: 'fala', titulo: 'Momento falado guardado por ' + L.nome(m.por), pessoa: m.por, ts: m.ts,
        texto: m.trechos.map(function (x) { return L.nome(x.quem) + ': ' + x.texto; }).join('\n'), abrir: { tipo: 'momento', ref: m.id } });
    });
    Object.keys(e.terminais).forEach(function (p) {
      var linhas = e.terminais[p];
      if (!linhas.length) return;
      docs.push({ id: 'term:' + p, tipo: 'terminal', titulo: 'Histórico do terminal de ' + L.nome(p), pessoa: p, ts: linhas[linhas.length - 1].ts,
        texto: linhas.map(function (l) { return l.texto; }).join('\n'), abrir: { tipo: 'terminal', ref: p } });
    });
    return docs;
  };

  var cache = { estado: null, v: -1 };

  function indice(e) {
    if (cache.estado === e && cache.v === e.v) return cache;
    var docs = A.documentos(e), df = {}, total = 0;
    docs.forEach(function (d) {
      d.toks = tokens(d.titulo + ' ' + d.texto).map(raiz);
      d.tf = {};
      d.toks.forEach(function (w) { d.tf[w] = (d.tf[w] || 0) + 1; });
      Object.keys(d.tf).forEach(function (w) { df[w] = (df[w] || 0) + 1; });
      total += d.toks.length;
    });
    cache = { estado: e, v: e.v, docs: docs, df: df, media: total / Math.max(1, docs.length) };
    return cache;
  }

  /* trecho com os termos marcados (já escapado para HTML) */
  A.trecho = function (texto, termos, largura) {
    largura = largura || 90;
    var plano = String(texto || '').replace(/\s+/g, ' ').trim(), norm = U.normalizar(plano), pos = -1, achado = '';
    termos.forEach(function (t) { var i = norm.indexOf(t); if (i !== -1 && (pos === -1 || i < pos)) { pos = i; achado = t; } });
    if (pos === -1) return U.esc(plano.slice(0, largura * 2)) + (plano.length > largura * 2 ? '…' : '');
    var ini = Math.max(0, pos - largura), fim = Math.min(plano.length, pos + achado.length + largura);
    var trecho = plano.slice(ini, fim), html = '', normT = U.normalizar(trecho), i = 0;
    while (i < trecho.length) {
      var melhor = -1, tam = 0;
      termos.forEach(function (t) { var j = normT.indexOf(t, i); if (j !== -1 && (melhor === -1 || j < melhor)) { melhor = j; tam = t.length; } });
      if (melhor === -1) { html += U.esc(trecho.slice(i)); break; }
      html += U.esc(trecho.slice(i, melhor)) + '<mark>' + U.esc(trecho.slice(melhor, melhor + tam)) + '</mark>';
      i = melhor + tam;
    }
    return (ini > 0 ? '…' : '') + html + (fim < plano.length ? '…' : '');
  };

  A.buscar = function (e, consulta, opcoes) {
    opcoes = opcoes || {};
    var ix = indice(e), q = tokens(consulta).map(raiz), N = ix.docs.length, k1 = 1.2, b = 0.75, res = [];
    if (!q.length) return [];
    if ((opcoes.modo || 'palavras') === 'palavras') {
      ix.docs.forEach(function (d) {
        if (opcoes.tipo && d.tipo !== opcoes.tipo) return;
        var s = 0;
        q.forEach(function (w) {
          var tf = d.tf[w];
          if (!tf) return;
          var idf = Math.log(1 + (N - ix.df[w] + 0.5) / (ix.df[w] + 0.5));
          s += idf * tf * (k1 + 1) / (tf + k1 * (1 - b + b * d.toks.length / ix.media));
        });
        if (s > 0) res.push({ doc: d, pontos: s });
      });
    } else {
      var qv = A.vetor(consulta);
      ix.docs.forEach(function (d) {
        if (opcoes.tipo && d.tipo !== opcoes.tipo) return;
        if (!d.vet) d.vet = A.vetor(d.titulo + ' ' + d.texto);
        var s = A.cosseno(qv, d.vet);
        if (s > 0.12) res.push({ doc: d, pontos: s });
      });
    }
    res.sort(function (x, y) { return y.pontos - x.pontos; });
    return res.slice(0, opcoes.limite || 12).map(function (r) { return { doc: r.doc, pontos: r.pontos, trecho: A.trecho(r.doc.texto, q) }; });
  };

  A.estatisticas = function (e) {
    var ix = indice(e), porTipo = {};
    ix.docs.forEach(function (d) { porTipo[d.tipo] = (porTipo[d.tipo] || 0) + 1; });
    return { docs: ix.docs.length, termos: Object.keys(ix.df).length, porTipo: porTipo };
  };

  /* palavras que mais aparecem num conjunto de textos (para os temas do sonho) */
  A.termosFrequentes = function (textos, n) {
    var cont = {};
    textos.forEach(function (t) { tokens(t).forEach(function (w) { if (w.length > 3) cont[raiz(w)] = (cont[raiz(w)] || 0) + 1; }); });
    return Object.keys(cont).filter(function (w) { return cont[w] > 1; }).sort(function (a, b) { return cont[b] - cont[a]; }).slice(0, n || 6)
      .map(function (w) { return { termo: w, vezes: cont[w] }; });
  };

  BC.acervo = A;
})(window.BC);
