/* babel-coop — protótipo · mapa mental = o MindForge (clone do MindMeister feito pelo Theus), dentro da Estação.
   Design 2030 (PLANO §1 propriedade 5, R6): o mapa é a carta de observatório sobre o chão da Babel e VIRA MÁQUINA.
   - Cada galho pode ser materializado em Tela, campanha, demanda ou peça da Máquina: o objeto nasce de verdade (L.fazer)
     e o galho guarda a ligação com endereço (sala › bancada › peça). A ligação mora no próprio arquivo .mapa.
   - A luz anda pelos galhos quando o trabalho do objeto ligado acontece (evento real: demanda andou, tela salva,
     peça publicada, campanha subiu). O estado vivo fica em estado.mapaVivo (escrito só pela Estação) e todas as vistas
     (Estação, TV) acendem o mesmo galho. O galho fechado ganha luz de concluído (sem carimbo: é o organismo).
   - "Leva o mapa para a TV": a TV apresenta galho a galho (estado.projecao.mapa), a Estação controla.
   Cada mapa é um arquivo .mapa da pessoa (formato do MindForge: { title, nodes[] }); o agente do terminal cria e mexe
   no mapa por conversa (BC.mapaAgente). API para os outros: BC.mapaVivo (ver o fim do arquivo). */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc;
  var CORES = ['#31d5d3', '#2b8ef1', '#b26cff', '#ed46a7', '#ff715b', '#f0b53e', '#6bc86d', '#94a2a8'];
  /* a escala de tempo da marca (tokens.css): à direita o agora (ciano), à esquerda o antes (roxo), a raiz no meio */
  var LADO = { dir: '#2ad5e5', esq: '#a376e9', raiz: '#7ba4f0' };
  var RAIZ = { x: 2000, y: 1500 }, PASSO_X = 245, PASSO_Y = 62;
  var NOME_TIPO = { tela: 'Tela', campanha: 'campanha', demanda: 'demanda', peca: 'peça da Máquina' };
  var TIPOS_PECA = { gaveta: 'Gaveta', porta: 'Porta', robo: 'Robô', deposito: 'Depósito', cofre: 'Cofre', tela: 'Tela', portaria: 'Portaria', cano: 'Cano' };

  function L() { return BC.loja; }
  function clonar(o) { return JSON.parse(JSON.stringify(o)); }
  function no(id, pai, texto, extra) {
    return Object.assign({ id: id || U.id('n'), parent: pai, text: texto, x: RAIZ.x, y: RAIZ.y, color: CORES[0], shape: 'pill', size: pai ? 14 : 20, bold: !pai, collapsed: false, note: '' }, extra || {});
  }
  function conteudo(a) { return BC.editor && BC.editor.conteudo ? BC.editor.conteudo(a) : a.conteudo; }
  function nomeCurto(id) { var p = L().pessoa(id); return p ? String(p.nome).split(' ')[0] : (id === 'equipe' ? 'a equipe' : L().nome(id)); }
  function iniciais(nome) { return String(nome || '').split(/\s+/).map(function (p) { return p[0] || ''; }).slice(0, 2).join('').toUpperCase(); }
  function hora(ts) { return ts ? U.hora(ts) : ''; }

  /* ---------- formato: aceita o formato antigo { raiz } e devolve o do MindForge { title, nodes } ---------- */

  function normalizar(dados) {
    if (dados && Array.isArray(dados.nodes)) { if (!dados.title) dados.title = (dados.nodes.filter(function (n) { return !n.parent; })[0] || {}).text || 'Sem título'; return dados; }
    var raiz = (dados && dados.raiz) || { id: 'r', texto: 'Ideia central', filhos: [] }, nodes = [];
    (function andar(n, pai, i) {
      nodes.push(no(n.id, pai, n.texto || n.text || 'Tópico', { color: pai ? CORES[i % CORES.length] : LADO.raiz, size: !pai ? 20 : pai === (raiz.id || 'r') ? 16 : 14 }));
      (n.filhos || []).forEach(function (f, j) { andar(f, n.id || nodes[nodes.length - 1].id, pai ? i : j); });
    })(raiz, null, 0);
    return arrumar({ title: raiz.texto, nodes: nodes });
  }

  /* arruma a árvore como a carta do observatório: os galhos de primeiro nível alternam direita (ciano) e esquerda (roxo),
     os filhos saem para o mesmo lado do pai, centrados e sem se sobrepor */
  function arrumar(estado) {
    var filhos = function (id) { return estado.nodes.filter(function (n) { return n.parent === id; }); };
    var altura = function (n) { var f = filhos(n.id); return f.length ? f.reduce(function (s, x) { return s + altura(x); }, 0) : 1; };
    var raiz = estado.nodes.filter(function (n) { return !n.parent; })[0];
    if (!raiz) return estado;
    raiz.x = RAIZ.x; raiz.y = RAIZ.y; raiz.color = LADO.raiz;
    var lados = { dir: [], esq: [] };
    filhos(raiz.id).forEach(function (n, i) { lados[i % 2 === 0 ? 'dir' : 'esq'].push(n); });
    function colocar(pai, dir) {
      var f = filhos(pai.id), total = f.reduce(function (s, x) { return s + altura(x); }, 0), cursor = pai.y - (total * PASSO_Y) / 2;
      f.forEach(function (n) { var h = altura(n) * PASSO_Y; n.x = pai.x + dir * PASSO_X; n.y = cursor + h / 2; n.color = pai.color; cursor += h; colocar(n, dir); });
    }
    ['dir', 'esq'].forEach(function (lado) {
      var dir = lado === 'dir' ? 1 : -1, lista = lados[lado];
      var alt = function (n) { return Math.max(1.6, altura(n)); };
      var total = lista.reduce(function (s, x) { return s + alt(x); }, 0), cursor = raiz.y - (total * PASSO_Y) / 2;
      lista.forEach(function (n) { var h = alt(n) * PASSO_Y; n.x = raiz.x + dir * PASSO_X * 1.2; n.y = cursor + h / 2; n.color = LADO[lado]; cursor += h; colocar(n, dir); });
    });
    return estado;
  }

  /* de que lado da raiz um galho está (1 direita, -1 esquerda); a raiz escolhe o lado com menos galhos */
  function ladoDe(estado, pai) {
    var raiz = estado.nodes.filter(function (n) { return !n.parent; })[0];
    if (!raiz || pai.id !== raiz.id) return raiz && pai.x < raiz.x ? -1 : 1;
    var f = estado.nodes.filter(function (n) { return n.parent === raiz.id; });
    var dir = f.filter(function (n) { return n.x >= raiz.x; }).length, esq = f.length - dir;
    return esq < dir ? -1 : 1;
  }

  /* ---------- o componente: um iframe com o MindForge, ligado por postMessage ---------- */

  var montados = []; /* todos os mapas vivos nesta janela (Estação, TV, mesa da reunião) */

  function MapaMental(el, dados, opcoes) {
    var eu = this;
    this.el = el;
    this.op = opcoes || {};
    this.estado = normalizar(clonar(dados));
    this.ultimo = JSON.stringify(this.estado);
    this.pronto = false;
    this.nascido = Date.now();
    this.vistos = {};       /* noId → contador de eventos já acesos aqui */
    this.ultimaTv = null;
    this.ultimoVivo = '';
    this.arquivoId = this.op.arquivo || acharArquivo(dados);
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
        eu.sincronizar(true);
      }
      if (m.tipo === 'babel-mapa-mudou' && eu.op.editavel && m.estado) {
        var json = JSON.stringify(m.estado);
        if (json === eu.ultimo) return;
        eu.ultimo = json;
        eu.estado = m.estado;
        if (eu.op.aoMudar) eu.op.aoMudar(clonar(m.estado));
      }
      /* o observatorio.js do iframe pode terminar de carregar depois do pronto: ele avisa e o estado vivo vai de novo */
      if (m.tipo === 'babel-mapa-observatorio' && eu.pronto) { eu.ultimoVivo = ''; eu.ultimaTv = null; eu.sincronizar(true); }
      if (m.tipo === 'babel-mapa-acao') eu.acao(m);
      if (m.tipo === 'babel-mapa-faiscas') eu.faiscas(m);
    };
    window.addEventListener('message', this.ouvinte);
    montados.push(this);
  }

  MapaMental.prototype.enviar = function (m) { m.tipo = 'babel-mapa'; try { this.frame.contentWindow.postMessage(m, '*'); } catch (e) { /* iframe ainda não carregou */ } };
  MapaMental.prototype.vivo = function () { return !!(this.frame && this.frame.isConnected); };

  /* recebe dados novos (de outra pessoa ou do agente) sem atropelar quem está editando */
  MapaMental.prototype.atualizar = function (dados, extra) {
    var e = normalizar(clonar(dados)), json = JSON.stringify(e);
    if (json === this.ultimo) { this.sincronizar(); return; }
    this.ultimo = json;
    this.estado = e;
    if (this.pronto) { this.enviar(Object.assign({ op: 'carregar', estado: e }, extra || {})); this.sincronizar(); }
  };

  MapaMental.prototype.destruir = function () {
    window.removeEventListener('message', this.ouvinte);
    var i = montados.indexOf(this);
    if (i !== -1) montados.splice(i, 1);
    this.frame = null; this.el.innerHTML = '';
  };

  /* o estado vivo dos galhos ligados vai para o iframe; o que avançou desde a última vez acende (a luz anda pelo galho) */
  MapaMental.prototype.sincronizar = function (primeira) {
    if (!this.pronto || !this.vivo() || !L() || !L().estado) return;
    if (!this.arquivoId) this.arquivoId = acharArquivo(this.estado);
    var eu = this, viv = vivoDe(this.arquivoId), payload = {}, luzes = [];
    this.estado.nodes.forEach(function (n) {
      if (!n.liga && !n.fechado && !viv[n.id]) return;
      var v = viv[n.id] || derivar(n, eu.estado) || null;
      var item = v ? { p: v.p, fase: v.fase, fechado: !!v.fechado, rotulo: v.rotulo || '', ts: v.ts || (n.liga && n.liga.em) || 0, n: v.n || 0, quem: v.quem ? nomeCurto(v.quem) : '' } : { p: 0, fase: 'nasceu', n: 0 };
      item.extra = extraDe(n);
      payload[n.id] = item;
      if (!viv[n.id]) return;
      var visto = eu.vistos[n.id];
      var novo = visto === undefined ? (!primeira && viv[n.id].ts >= eu.nascido) : viv[n.id].n > visto;
      if (novo) { (medidas.acesas = medidas.acesas || []).push({ no: n.text, n: viv[n.id].n, rotulo: viv[n.id].rotulo }); if (medidas.acesas.length > 40) medidas.acesas.shift(); }
      if (novo) luzes.push({ no: n.id, forte: !!viv[n.id].fechado && (viv[n.id].fechouEm || 0) >= (viv[n.id].ts || 0) - 5, fechou: !!viv[n.id].fechado });
      eu.vistos[n.id] = viv[n.id].n;
    });
    var ctx = { organismo: !!(BC.organismo && BC.organismo.versao), editavel: !!this.op.editavel, apresentar: !!this.op.apresentar, eu: L().eu,
      pessoas: (L().estado.pessoas || []).map(function (p) { return { id: p.id, nome: String(p.nome).split(' ')[0], iniciais: iniciais(p.nome), cor: p.cor, online: p.status !== 'offline' }; }) };
    var chave = JSON.stringify([payload, ctx]);
    if (chave !== this.ultimoVivo) { this.ultimoVivo = chave; this.enviar({ op: 'vivo', vivo: payload, contexto: ctx }); }
    luzes.forEach(function (l) { eu.enviar({ op: 'luz', no: l.no, forte: l.forte, fechou: l.fechou }); medidas.luzes++; });
    this.enviarTv();
  };

  /* apresentação na TV: a TV foca o galho do passo; a Estação vê "na TV · galho N de M" e controla */
  MapaMental.prototype.enviarTv = function () {
    var p = L().estado.projecao, m = p && p.mapa, ativo = !!(m && this.arquivoId && m.caminho === chaveDe(this.arquivoId));
    var info = ativo ? { passo: m.passo, total: m.galhos.length, no: m.galhos[m.passo] || null, por: nomeCurto(p.por) } : null;
    var chave = JSON.stringify(info);
    if (chave === this.ultimaTv) return;
    this.ultimaTv = chave;
    if (this.op.apresentar) this.enviar({ op: 'foco', tv: info });
    else this.enviar({ op: 'tv', tv: info });
  };

  /* pedidos que vêm de dentro do mapa (ficha do galho, menu, barra) */
  MapaMental.prototype.acao = function (m) {
    var arq = this.arquivoId || (this.arquivoId = acharArquivo(this.estado)), r;
    if (!arq) { aviso('Salve o mapa antes: ele precisa ser um arquivo .mapa para ligar os galhos.'); return; }
    if (m.acao === 'materializar') {
      if (!this.op.editavel) { aviso('Este mapa é só para ver: quem materializa é o dono ou a gestão.'); return; }
      r = MV.materializar(arq, m.no, m.em, { para: m.para });
      if (r && r.erro) aviso(r.erro);
      else if (r && r.ja) aviso('Esse galho já virou ' + NOME_TIPO[r.liga.tipo] + ': ' + r.liga.endereco.texto);
      else if (r) aviso('O galho virou ' + NOME_TIPO[r.liga.tipo] + ' · ' + r.liga.endereco.texto + '. A luz anda por ele conforme o trabalho acontece.');
    }
    if (m.acao === 'fechar' || m.acao === 'reabrir') { if (this.op.editavel) MV.fechar(arq, m.no, m.acao === 'reabrir'); }
    if (m.acao === 'ir') MV.irAte(arq, m.no);
    if (m.acao === 'tv') {
      if (m.passo === 'comecar') MV.apresentar(arq, 0);
      else if (m.passo === 'proximo') MV.proximo();
      else if (m.passo === 'anterior') MV.anterior();
      else if (m.passo === 'encerrar') MV.encerrar();
      else if (typeof m.passo === 'number') MV.apresentar(arq, m.passo);
    }
  };

  /* faíscas e som do organismo (motor da Estação, BC.organismo), no ponto do galho dentro do iframe */
  MapaMental.prototype.faiscas = function (m) {
    var O = BC.organismo;
    if (!O || !this.vivo()) return;
    var r = this.frame.getBoundingClientRect(), pt = { x: r.left + (+m.x || 0), y: r.top + (+m.y || 0) };
    if (pt.x < r.left || pt.x > r.right || pt.y < r.top || pt.y > r.bottom) return; /* galho fora da tela: sem faísca */
    try {
      O.faiscas(pt, m.n || 6, !!m.forte, { cor: 'marca' });
      O.som(m.forte ? 'duas' : 'tique');
      if (m.forte && O.respirar) O.respirar(this.frame); /* galho fechado: o mapa inteiro respira uma vez (R6) */
      medidas.faiscas++;
    } catch (e) { /* o efeito nunca atrapalha o trabalho */ }
  };

  function aviso(t) { if (BC.estacao && BC.estacao.aviso) BC.estacao.aviso(t); }

  /* no app cada janela (e cada máquina) gera ids próprios (L._novoId): o que vai para o diário usa o CAMINHO do arquivo, que é o mesmo em todas */
  function chaveDe(ref) { var a = ref && L() && L().arquivo(ref); return a ? a.caminho : ref || null; }
  function vivoDe(ref) { return (L().estado.mapaVivo || {})[chaveDe(ref)] || {}; }

  /* qual arquivo .mapa este componente mostra (o editor não diz: descobre pela aba, pela projeção ou pelo conteúdo) */
  function acharArquivo(dados) {
    if (!L() || !L().estado) return null;
    var json = JSON.stringify(dados);
    function mesmo(a) {
      var c = conteudo(a);
      if (!c) return false;
      if (c === json) return true;
      try { return JSON.stringify(JSON.parse(c)) === json; } catch (e) { return false; }
    }
    var t = BC.estacao && BC.estacao.abaAtual && BC.estacao.abaAtual();
    if (t && t.tipo === 'arquivo') { var a = L().arquivo(t.ref); if (a && a.tipo === 'mapa' && mesmo(a)) return a.id; }
    var p = L().estado.projecao;
    if (p && p.tipo === 'mapa') { var ap = L().arquivo(p.caminho); if (ap && mesmo(ap)) return ap.id; }
    var lista = L().estado.arquivos.filter(function (x) { return x.tipo === 'mapa' && mesmo(x); });
    return lista.length ? lista[lista.length - 1].id : null;
  }

  BC.MapaMental = MapaMental;
  BC.MapaMental.normalizar = normalizar;
  BC.MapaMental.novo = function (titulo) { return { title: titulo || 'Ideia central', nodes: [no('root', null, titulo || 'Ideia central', { color: LADO.raiz })] }; };

  /* =====================================================================
     O MAPA VIRA MÁQUINA: materializar, derivar o estado vivo, acender
     ===================================================================== */

  /* BC.mapaVivo · API para as outras telas, o conector coop e os testes (arquivoId = id OU caminho do .mapa):
       materializar(arquivoId, noId, 'tela'|'campanha'|'demanda'|'peca', { para?: pessoaId, selecionar?: bool }) → { liga, no } | { ja, liga } | { erro }
       fechar(arquivoId, noId, reabrir?) → bool          OK à mão com nome e hora (o galho ganha luz de concluído)
       irAte(arquivoId, noId) → bool                      abre a Tela, a demanda, a campanha ou a peça na Máquina
       apresentar(arquivoId, passo?) · proximo() · anterior() · encerrar() · apresentacao() → { arquivo, passo, total, no } | null
       verificar() → n                                     relê os objetos ligados e grava o que mudou (a Estação chama sozinha)
       ligacoes(arquivoId) · vivo(arquivoId) · derivar(arquivoId, noId) · componentes() · medidas()
     Ações da loja (vão para o diário do app): mapaGalho(caminho, noId, dados, evento) e mapaApresentar(caminho, passo).
     Eventos: tipo 'mapa-galho' (materializou / fechou, com tv: true). */
  var MV = {};
  var medidas = { luzes: 0, faiscas: 0, verificacoes: 0, eventos: 0, materializados: 0, transicoes: [] }; /* transicoes: cada luz tem a sua origem (as 40 últimas) */

  function acharNo(est, id) { return est.nodes.filter(function (n) { return n.id === id; })[0] || null; }
  function filhosDe(est, id) { return est.nodes.filter(function (n) { return n.parent === id; }); }
  function cadeia(est, n) { var r = []; while (n) { r.unshift(n); n = n.parent ? acharNo(est, n.parent) : null; } return r; }
  function estadoDe(a) { try { return normalizar(JSON.parse(conteudo(a) || '{}')); } catch (e) { return null; } }
  function projetoDe(a) {
    var pjs = L().estado.projetos || [], m = a && a.caminho.match(/Projetos\/([^/]+)\//);
    if (m) { var alvo = U.normalizar(m[1]); var achado = pjs.filter(function (p) { return U.normalizar(p.pasta || '').indexOf(alvo) !== -1 || U.normalizar(p.nome).indexOf(alvo) === 0; })[0]; if (achado) return achado; }
    var ativo = BC.estacao && BC.estacao.ui && BC.estacao.ui.projetoAtivo;
    return pjs.filter(function (p) { return p.id === ativo; })[0] || null;
  }
  function contexto(est, n, a) {
    var raiz = est.nodes.filter(function (x) { return !x.parent; })[0] || n;
    return { arquivo: a.id, titulo: est.title || raiz.text, raiz: raiz.text, caminho: cadeia(est, n).map(function (x) { return x.text; }),
      filhos: filhosDe(est, n.id).map(function (x) { return x.text; }), netos: filhosDe(est, n.id).map(function (f) { return filhosDe(est, f.id).map(function (x) { return x.text; }); }),
      projeto: projetoDe(a) };
  }
  function nomeDeArquivo(t) { return String(t).replace(/[\\/:*?"<>|#]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 48) || 'Tela'; }

  /* endereço: sala (projeto ou a pasta da pessoa) › bancada (tipo) › peça (o objeto). Usa BC.endereco se existir. */
  function endereco(liga, ctx) {
    var sala = ctx.projeto ? ctx.projeto.nome : 'pasta de ' + nomeCurto(L().eu);
    var bancada = { tela: 'Telas', campanha: 'Campanhas', demanda: 'Demandas', peca: 'Máquina' }[liga.tipo];
    var e = { sala: sala, bancada: bancada, peca: liga.rotulo };
    /* a campanha gerada mora em equipe › Campanhas › <nome> (campanha.js) */
    if (liga.tipo === 'campanha' && liga.pasta) { var ps = String(liga.pasta).split('/'); e = { sala: ps[0] === 'equipe' ? 'equipe' : ps[0], bancada: ps[1] || bancada, peca: ps.slice(2).join(' › ') || liga.rotulo }; }
    /* o resto usa o endereço da sala (endereco.js: BC.endereco.de({ tipo, ref })) quando ele existe */
    var alvo = liga.tipo === 'tela' ? { tipo: 'arquivo', ref: liga.id } : liga.tipo === 'demanda' ? { tipo: 'demanda', ref: liga.id } : liga.tipo === 'peca' ? { tipo: 'maquina', ref: liga.projeto, peca: liga.rotulo } : null;
    if (alvo && BC.endereco && typeof BC.endereco.de === 'function') {
      try {
        var x = BC.endereco.de(alvo);
        if (x && Array.isArray(x.partes) && x.partes.length) {
          var r = x.partes.map(function (p) { return p.rotulo; });
          e = { sala: r[0], bancada: r.length > 2 ? r.slice(1, -1).join(' › ') : '', peca: r[r.length - 1], alvo: x.alvo || alvo };
          e.texto = x.texto;
          return e;
        }
      } catch (err) { /* o endereço próprio serve */ }
    }
    e.alvo = alvo;
    e.texto = [e.sala, e.bancada, e.peca].filter(Boolean).join(' › ');
    return e;
  }

  /* a Tela que nasce do galho: o galho é o título, os subgalhos viram as seções e os netos, os itens */
  function htmlTela(n, ctx) {
    var secoes = ctx.filhos.length ? ctx.filhos.map(function (f, i) {
      var itens = ctx.netos[i] || [];
      return '<section><h2>' + esc(f) + '</h2>' + (itens.length ? '<ul>' + itens.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '<p>Escreva aqui o que é "' + esc(f) + '".</p>') + '</section>';
    }).join('\n') : ['O que é', 'Para quem', 'Como funciona'].map(function (f) { return '<section><h2>' + f + '</h2><p>Escreva aqui.</p></section>'; }).join('\n');
    return '<!doctype html>\n<html lang="pt-BR">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(n.text) + ' · ' + esc(ctx.raiz) + '</title>\n<style>\n' +
      '  body{margin:0;font-family:"IBM Plex Sans",system-ui,sans-serif;color:#15202b;background:#f6f8fb}\n' +
      '  header{padding:56px 28px 44px;background:#0b1320;color:#eef4ff}\n  header small{letter-spacing:.12em;text-transform:uppercase;color:#7ba4f0;font-size:12px}\n' +
      '  h1{margin:10px 0 12px;font-size:40px;line-height:1.1}\n  header p{margin:0;max-width:560px;color:#c3cfe5}\n' +
      '  .cta{display:inline-block;margin-top:22px;padding:12px 20px;border-radius:8px;background:#2ad5e5;color:#06202a;font-weight:600;text-decoration:none}\n' +
      '  main{max-width:880px;margin:0 auto;padding:32px 24px;display:grid;gap:16px}\n  section{background:#fff;border:1px solid #dfe5ee;border-radius:10px;padding:20px}\n' +
      '  h2{margin:0 0 8px;font-size:20px}\n  ul,p{margin:0;color:#46566a}\n  ul{padding-left:18px}\n</style></head>\n<body>\n' +
      '<header><small>' + esc(ctx.raiz) + '</small><h1>' + esc(n.text) + '</h1><p>Rascunho que nasceu do mapa "' + esc(ctx.titulo) + '". Edite na tela ou no código.</p><a class="cta" href="#contato">Quero saber mais</a></header>\n<main>\n' + secoes + '\n</main>\n</body>\n</html>';
  }

  /* a Máquina do projeto (a MÁQUINA não expõe maquinaDe: usa o que houver) */
  function maquinaDe(pjId) {
    var M = BC.maquina;
    if (!M) return null;
    var f = typeof M.maquinaDe === 'function' ? M.maquinaDe : typeof M.maquina === 'function' ? M.maquina : null;
    if (f) { try { var mm = f(pjId); if (mm) return mm; } catch (e) { /* segue */ } }
    if (M.maquinas && M.maquinas[pjId]) return M.maquinas[pjId];
    if (BC.vistas && BC.vistas.maquina && BC.vistas.maquina.conteudo) { try { BC.vistas.maquina.conteudo({ tipo: 'maquina', ref: pjId }); } catch (e) { /* segue */ } }
    return (M.maquinas && M.maquinas[pjId]) || null;
  }
  function tipoPeca(texto) {
    var t = U.normalizar(texto);
    if (/\b(login|entrar|senha|portaria|acesso)\b/.test(t)) return 'portaria';
    if (/\b(robo|aviso|lembrete|lembrar|whatsapp|notifica|automac|dispara)\w*/.test(t)) return 'robo';
    if (/\b(porta|api|rota|webhook|integra)\w*/.test(t)) return 'porta';
    if (/\b(tela|pagina|landing|site|formulario)\w*/.test(t)) return 'tela';
    if (/\b(foto|arquivo|upload|deposito|video|imagem)\w*/.test(t)) return 'deposito';
    if (/\b(tempo real|ao vivo|cano)\b/.test(t)) return 'cano';
    return 'gaveta';
  }

  var CRIAR = {
    tela: function (n, ctx) {
      var pj = ctx.projeto, pasta = pj && pj.pasta ? pj.pasta.replace(/\/+$/, '') + '/' : 'Telas/';
      var caminho = L().eu + '/' + pasta + nomeDeArquivo(n.text) + '.html';
      if (!L().fazer('criarArquivo', caminho, 'html', htmlTela(n, ctx))) return null;
      var arq = L().estado.arquivos[L().estado.arquivos.length - 1];
      if (BC.estacao && BC.estacao.ui) { BC.estacao.ui.abertas[L().eu] = true; BC.estacao.ui.abertas[L().eu + '/' + pasta.replace(/\/$/, '')] = true; }
      return { id: arq.id, caminho: arq.caminho, rotulo: arq.caminho.split('/').pop(), projeto: pj && pj.id };
    },
    demanda: function (n, ctx, op) {
      var para = op.para && op.para !== 'livre' && L().pessoa(op.para) ? op.para : null, pj = ctx.projeto;
      var desc = 'Galho do mapa "' + ctx.titulo + '": ' + ctx.caminho.join(' › ') + (ctx.filhos.length ? '. Itens: ' + ctx.filhos.join(', ') + '.' : '.');
      if (!L().fazer('novaDemanda', { titulo: n.text, descricao: desc, para: para, projeto: pj && pj.id, prioridade: 'média' })) return null;
      var d = L().estado.demandas[0];
      return { id: d.id, rotulo: d.titulo, projeto: pj && pj.id, para: para };
    },
    campanha: function (n, ctx) {
      var pj = ctx.projeto, id = null;
      /* com a F3 (campanha.js) o galho vira a campanha gerada inteira: Tela, 3 anúncios, WhatsApp e calendário, cada peça com dono */
      if (BC.campanha && typeof BC.campanha.gerar === 'function') {
        try {
          var r = BC.campanha.gerar({ nome: n.text, por: L().eu, pedido: 'materializa o galho "' + n.text + '" do mapa "' + ctx.titulo + '" em campanha', abrir: false });
          if (r && !r.erro && r.id) return { id: r.id, rotulo: r.nome || n.text, projeto: pj && pj.id, pasta: r.endereco || '', gerada: true };
        } catch (e) { id = null; }
      }
      if (!L().fazer('novaCampanha', { titulo: n.text, alvo: Math.max(ctx.filhos.length, 1), unidade: ctx.filhos.length ? 'galhos fechados' : 'entrega', pessoa: L().eu })) return null;
      id = (L().estado.campanhas || [])[0].id;
      return { id: id, rotulo: n.text, projeto: pj && pj.id };
    },
    peca: function (n, ctx) {
      var pjs = L().estado.projetos || [], pj = ctx.projeto || pjs.filter(function (p) { return p.id === 'clinicas'; })[0] || pjs[0];
      var pjId = pj ? pj.id : 'clinicas', m = maquinaDe(pjId), M = BC.maquina;
      if (!m) return null;
      var tipo = tipoPeca(n.text + ' ' + ctx.filhos.join(' ')), p = null, mud = null;
      var frase = 'veio do galho "' + n.text + '" do mapa "' + ctx.titulo + '"', campos = ctx.filhos.slice(0, 6).map(function (f) { return U.normalizar(f) + ' (texto)'; });
      ouvirMaquina();
      /* a Máquina 2030 monta a peça do jeito dela (modelo, fios, nasce tracejada, encaixa, ganha corpo ao publicar) */
      if (M && typeof M.montarTipo === 'function') {
        var tipoM = tipo === 'portaria' ? 'porta' : tipo;
        try { p = M.montarTipo(m, tipoM); } catch (e) { p = null; }
        if (p) {
          var antes = p.nome;
          tipo = tipoM; p.nome = n.text; p.frase = frase; p.galho = { arquivo: ctx.arquivo, no: n.id };
          if (tipo === 'gaveta' && campos.length) p.campos = campos;
          mud = 'Galho "' + n.text + '" do mapa: cria ' + TIPOS_PECA[tipo] + ' ' + n.text;
          for (var i = m.mudancas.length - 1; i >= 0; i--) if (m.mudancas[i].indexOf('"' + antes + '"') !== -1) { m.mudancas[i] = mud; break; }
          for (var j = m.linha.length - 1; j >= 0; j--) if (m.linha[j].peca === p.id) { m.linha[j].texto = L().nome(L().eu) + ' materializou o galho "' + n.text + '" em ' + TIPOS_PECA[tipo]; break; }
          if (m.rev !== undefined) m.rev++;
        }
      }
      if (!p) {
        var q = m.pecas.length, id = 'gm' + Date.now().toString(36) + q;
        p = { id: id, tipo: tipo, nome: n.text, frase: frase, x: 8 + (q * 17) % 62, y: 40 + (q % 3) * 8, dom: 'novas', por: L().eu, pronta: false, nova: true, publicada: false, corpo: 0, galho: { arquivo: ctx.arquivo, no: n.id } };
        if (tipo === 'gaveta') { p.campos = campos.length ? campos : ['nome (texto)', 'quando (data e hora)']; p.chave = 'cada empresa vê só o seu'; p.linhas = 0; }
        if (tipo === 'porta' || tipo === 'portaria') p.login = true;
        if (tipo === 'robo') p.quando = 'quando entra';
        m.pecas.push(p);
        var viz = m.pecas.filter(function (x) { return x.tipo === 'gaveta' && x.id !== id; })[0];
        if (viz && m.fios) m.fios.push(tipo === 'porta' || tipo === 'tela' ? [id, viz.id] : [viz.id, id]);
        mud = 'Galho "' + n.text + '" do mapa: cria ' + TIPOS_PECA[tipo] + ' ' + n.text;
        if (m.linha) m.linha.push({ ts: Date.now(), texto: L().nome(L().eu) + ' materializou o galho "' + n.text + '" em ' + TIPOS_PECA[tipo], quem: L().eu, peca: id });
        if (m.mudancas) m.mudancas.push(mud);
        setTimeout(function () { p.pronta = true; p.nova = false; if (BC.estacao && BC.estacao.render) BC.estacao.render(); }, 1600);
      }
      /* quando a peça encaixa (1,6 s) a luz anda no galho */
      setTimeout(function () { MV.verificar(); }, 1750);
      return { id: p.id, projeto: pjId, rotulo: TIPOS_PECA[tipo] + ' ' + n.text, peca: tipo, mudanca: mud };
    }
  };

  /* a Máquina avisa quando encaixa, testa e publica (BC.maquina.ouvir): cada aviso reavalia os galhos ligados */
  var ouvindoMaquina = false;
  function ouvirMaquina() {
    if (ouvindoMaquina || !BC.maquina || typeof BC.maquina.ouvir !== 'function') return;
    ouvindoMaquina = true;
    BC.maquina.ouvir(function () { agendar(); });
  }

  /* ---------- o estado de cada ligação, lido do objeto de verdade (nada é inventado: sem objeto, sem luz) ---------- */

  var DERIVA = {
    tela: function (li) {
      var a = L().arquivo(li.id) || (li.caminho && L().arquivo(li.caminho));
      if (!a) return { p: 0, fase: 'sumiu', rotulo: 'a Tela saiu da pasta', sig: 'sumiu' };
      var pre = (L().estado.presets || []).filter(function (p) { return p.tipo === 'tela' && p.arquivo === a.caminho; })[0];
      if (pre) return { p: 1, fase: 'concluido', fechado: true, rotulo: 'virou preset da equipe', quem: pre.por, sig: 'preset' };
      if ((a.salvoEm || 0) > (li.em || 0) + 300) return { p: 0.6, fase: 'andando', rotulo: 'salva por ' + nomeCurto(a.salvoPor), quem: a.salvoPor, sig: String(a.salvoEm) };
      return { p: 0.25, fase: 'nasceu', rotulo: 'nasceu · espera a primeira edição', quem: li.por, sig: 'nasceu' };
    },
    demanda: function (li) {
      var d = L().demanda(li.id);
      if (!d) return { p: 0, fase: 'sumiu', rotulo: 'a demanda não existe mais', sig: 'sumiu' };
      var h = d.historico[d.historico.length - 1] || {}, quem = h.quem || d.de, ultimo = nomeCurto(quem) + ' ' + (h.acao || 'enviou');
      var tab = { livre: [0.12, 'nasceu', 'livre: pega quem puder'], enviada: [0.15, 'nasceu', 'enviada para ' + nomeCurto(d.para)], andamento: [0.45, 'andando', ultimo], pausada: [0.45, 'pausada', ultimo],
        pronta: [0.8, 'pronta', ultimo], concluida: [1, 'concluido', 'OK de ' + nomeCurto(d.de)], cancelada: [0, 'cancelada', 'cancelada por ' + nomeCurto(quem)] }[d.estado] || [0.1, 'nasceu', d.estado];
      return { p: tab[0], fase: tab[1], fechado: d.estado === 'concluida', rotulo: tab[2], quem: quem, sig: d.estado + '|' + d.historico.length };
    },
    campanha: function (li, n, est) {
      var c = (L().estado.campanhas || []).filter(function (x) { return x.id === li.id; })[0];
      /* campanha gerada (campanha.js): cada peça pronta anda meio caminho, cada OK de quem pediu anda o resto; no ar = galho fechado */
      var g = BC.campanha && typeof BC.campanha.estado === 'function' ? BC.campanha.estado(li.id) : null;
      if (g && Array.isArray(g.pecas)) {
        var tot = g.pecas.length || 1, prontas = g.pecas.filter(function (x) { return x.estado === 'pronta'; }).length, oks = g.pecas.filter(function (x) { return !!x.ok; }).length;
        var sigG = g.estado + '|' + prontas + '|' + oks, porG = c && (c.por || c.pessoa);
        if (g.estado === 'no-ar') return { p: 1, fase: 'concluido', fechado: true, rotulo: 'campanha no ar · ' + oks + ' de ' + tot + ' com OK', quem: porG, sig: sigG };
        if (g.estado === 'pronta') return { p: 0.5 + oks / (2 * tot), fase: 'pronta', rotulo: 'pronta · ' + oks + ' de ' + tot + ' com OK', quem: porG, sig: sigG };
        return { p: Math.max(0.05, prontas / (2 * tot)), fase: prontas ? 'andando' : 'nasceu', rotulo: prontas + ' de ' + tot + ' peças prontas', quem: c && c.pessoa, sig: sigG };
      }
      if (!c) return { p: 0, fase: 'sumiu', rotulo: 'a campanha não existe mais', sig: 'sumiu' };
      var total = 0, feitos = 0;
      if (Array.isArray(c.pecas) && c.pecas.length) { total = c.pecas.length; feitos = c.pecas.filter(function (x) { return x.feito || x.ok || /pront|no-ar|no ar|conclu|publica|aprovad/.test(String(x.estado || '')); }).length; }
      else if (n && est) { var fs = filhosDe(est, n.id); total = fs.length; feitos = fs.filter(function (f) { return !!f.fechado || (vivoDe(li.arquivo)[f.id] || {}).fechado; }).length; }
      var pc = c.alvo ? (c.atual || 0) / c.alvo : 0, pg = total ? feitos / total : 0, p = Math.max(pc, pg);
      var rot = total ? feitos + ' de ' + total + ' ' + (Array.isArray(c.pecas) && c.pecas.length ? 'peças prontas' : 'galhos fechados') : (c.atual || 0) + ' de ' + (c.alvo || 0) + (c.unidade ? ' ' + c.unidade : '');
      return { p: Math.min(1, p), fase: p >= 1 ? 'concluido' : p > 0 ? 'andando' : 'nasceu', fechado: p >= 1, rotulo: p >= 1 ? 'campanha no ar · ' + rot : rot, quem: c.pessoa || c.por, sig: feitos + '/' + total + '|' + (c.atual || 0) };
    },
    peca: function (li) {
      var m = BC.maquina && BC.maquina.maquinas ? BC.maquina.maquinas[li.projeto] : null;
      if (!m) return null; /* a Máquina mora na Estação que a abriu: aqui não dá para saber, vale o último estado vivo */
      var pc = m.pecas.filter(function (x) { return x.id === li.id; })[0];
      if (!pc) return { p: 0, fase: 'sumiu', rotulo: 'a peça saiu da Máquina', sig: 'sumiu' };
      var pendente = pc.publicada !== undefined ? !pc.publicada : (m.mudancas || []).indexOf(li.mudanca) !== -1;
      if (!pc.pronta) return { p: 0.2, fase: 'nasceu', rotulo: 'encaixando na Máquina', quem: pc.por, sig: 'nova' };
      if (pendente) return { p: 0.55, fase: 'andando', rotulo: 'encaixada · falta publicar', quem: pc.por, sig: 'pronta' };
      return { p: 1, fase: 'concluido', fechado: true, rotulo: 'publicada em produção', quem: L().eu, sig: 'publicada' };
    }
  };

  function derivar(n, est) {
    if (n.fechado) return { p: 1, fase: 'concluido', fechado: true, rotulo: 'fechado por ' + nomeCurto(n.fechado.por), quem: n.fechado.por, sig: 'ok|' + n.fechado.em, fechadoPor: n.fechado.por };
    if (!n.liga || !DERIVA[n.liga.tipo]) return null;
    try { return DERIVA[n.liga.tipo](Object.assign({ arquivo: est && est.arquivo }, n.liga), n, est); } catch (e) { return null; }
  }

  /* o que o cartão do galho mostra além do estado (mini-tela, anel da campanha, pessoa da demanda, glifo da peça) */
  function extraDe(n) {
    var li = n.liga;
    if (!li) return null;
    var x = { tipo: li.tipo, rotulo: li.rotulo, endereco: li.endereco ? li.endereco.texto : '' };
    /* o endereço de agora (a bancada da demanda muda com o estado dela); sem o objeto nesta janela, vale o guardado */
    try { var al = li.endereco && li.endereco.alvo, ok = al && (al.tipo !== 'demanda' || L().demanda(al.ref)) && (al.tipo !== 'arquivo' || L().arquivo(al.ref)); if (ok && BC.endereco && BC.endereco.texto) { var tx = BC.endereco.texto(al); if (tx) x.endereco = tx; } } catch (e) { /* segue com o guardado */ }
    try {
      if (li.tipo === 'tela') {
        var a = L().arquivo(li.id) || (li.caminho && L().arquivo(li.caminho)), c = a ? conteudo(a) || '' : '';
        var limpar = function (s) { return String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 60); };
        x.titulo = limpar((c.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]);
        x.secoes = (c.match(/<h2[^>]*>[\s\S]*?<\/h2>/gi) || []).slice(0, 3).map(limpar);
      }
      if (li.tipo === 'demanda') { var d = L().demanda(li.id), pid = (d && d.para) || li.para, p = pid && L().pessoa(pid); if (p) { x.pessoa = { nome: String(p.nome).split(' ')[0], iniciais: iniciais(p.nome), cor: p.cor }; } else x.pessoa = { nome: 'livre', iniciais: '·', cor: '#5d6b78' }; }
      if (li.tipo === 'campanha') {
        var g2 = BC.campanha && typeof BC.campanha.estado === 'function' ? BC.campanha.estado(li.id) : null;
        if (g2) { x.atual = g2.pecas.filter(function (k) { return k.estado === 'pronta'; }).length; x.alvo = g2.pecas.length; x.pecas = g2.pecas.map(function (k) { return { titulo: k.titulo, pronta: k.estado === 'pronta', ok: !!k.ok }; }); }
        else { var c2 = (L().estado.campanhas || []).filter(function (k) { return k.id === li.id; })[0]; if (c2) { x.atual = c2.atual || 0; x.alvo = c2.alvo || 0; } }
      }
      if (li.tipo === 'peca') x.peca = li.peca;
    } catch (e) { /* cartão sem detalhe */ }
    return x;
  }

  /* estado vivo (compartilhado entre as janelas) e o evento que ele gera */
  /* estado vivo (compartilhado entre as janelas e, no app, gravado no diário) e o evento que ele gera.
     Idempotente: no app a ponte reaplica o diário em quem chega (e outra Estação pode derivar a mesma mudança);
     o mesmo conteúdo aplicado de novo não conta como evento, e a hora é a do evento original (dados.ts). */
  function mesmoVivo(a, d) { return !!a && a.sig === (d.sig || '') && a.fase === d.fase && !!a.fechado === !!d.fechado && a.rotulo === (d.rotulo || '') && a.p === d.p; }
  L().A.mapaGalho = function (quem, arquivoRef, noId, dados, evento) {
    var e = L().estado, arquivoId = chaveDe(arquivoRef);
    if (!arquivoId || !noId || !dados) return;
    e.mapaVivo = e.mapaVivo || {};
    var m = e.mapaVivo[arquivoId] = e.mapaVivo[arquivoId] || {}, antes = m[noId] || null, ts = +dados.ts || Date.now();
    if (mesmoVivo(antes, dados)) return; /* réplica: nada muda, nada acende */
    medidas.transicoes.push({ no: noId, fase: dados.fase, rotulo: dados.rotulo, antes: antes ? antes.rotulo : null, ts: ts, papel: L().papel });
    if (medidas.transicoes.length > 40) medidas.transicoes.shift();
    m[noId] = { p: dados.p, fase: dados.fase, fechado: !!dados.fechado, rotulo: dados.rotulo || '', quem: dados.quem || quem, sig: dados.sig || '', n: (antes ? antes.n || 0 : 0) + 1, ts: ts, fechouEm: dados.fechado ? (antes && antes.fechado ? antes.fechouEm : ts) : 0 };
    if (!evento) return [];
    medidas.eventos++;
    return [L()._evento('mapa-galho', evento.pessoa || quem, evento.texto, Object.assign({ arquivo: arquivoId, no: noId }, evento.extra || {}))];
  };
  function gravarVivo(arquivoId, noId, d, evento) { d = Object.assign({}, d, { ts: Date.now() }); return L().fazer('mapaGalho', chaveDe(arquivoId), noId, d, evento); }

  /* a Estação lê os objetos ligados e grava o que mudou: cada mudança real é um evento e acende o galho em todas as vistas */
  var agendado = null;
  MV.verificar = function () {
    if (!L() || !L().estado || L().papel !== 'estacao') return 0;
    medidas.verificacoes++;
    var mudancas = [];
    L().estado.arquivos.forEach(function (a) {
      if (a.tipo !== 'mapa') return;
      var c = conteudo(a);
      if (!c || (c.indexOf('"liga"') === -1 && c.indexOf('"fechado"') === -1)) return;
      var est = estadoDe(a);
      if (!est) return;
      est.arquivo = a.id;
      var viv = vivoDe(a.caminho);
      est.nodes.forEach(function (n) {
        if (!n.liga && !n.fechado) return;
        var dono = n.liga ? n.liga.por : n.fechado.por;
        if (dono && dono !== L().eu) return; /* quem ligou (ou fechou) é quem lê o objeto e grava; os outros recebem pelo diário */
        var d = derivar(n, est), v = viv[n.id];
        if (!d || d.fase === 'sumiu') return; /* sem objeto, sem luz: fica o último estado vivo */
        if (v && v.p === d.p && v.fase === d.fase && !!v.fechado === !!d.fechado && v.rotulo === d.rotulo && v.sig === d.sig) return;
        mudancas.push({ a: a, n: n, d: d, v: v, est: est });
      });
    });
    mudancas.forEach(function (x) {
      var evento = null;
      if (x.d.fechado && !(x.v && x.v.fechado)) {
        var tipo = x.n.liga ? NOME_TIPO[x.n.liga.tipo] : 'galho';
        evento = { pessoa: x.d.quem, texto: 'O galho "' + x.n.text + '" do mapa "' + x.est.title + '" fechou: ' + x.d.rotulo + (x.n.liga ? ' (' + tipo + ')' : ''),
          extra: { tv: true, textoTv: 'Galho "' + x.n.text + '" fechado · ' + x.d.rotulo } };
      }
      gravarVivo(x.a.id, x.n.id, x.d, evento);
    });
    return mudancas.length;
  };
  function agendar() { if (agendado) return; agendado = setTimeout(function () { agendado = null; try { MV.verificar(); } catch (e) { console.error(e); } }, 0); }

  /* cada mudança do estado (de qualquer janela) reavalia as ligações e leva o estado vivo para os mapas abertos */
  var ligado = false;
  function ligar() {
    if (ligado || !L() || !L().aoMudar) return;
    ligado = true;
    L().aoMudar(function () {
      agendar();
      for (var i = montados.length - 1; i >= 0; i--) {
        var c = montados[i];
        if (!c.vivo()) { montados.splice(i, 1); continue; }
        try { c.sincronizar(); } catch (e) { console.error(e); }
      }
    });
  }
  ligar();

  function componentesDe(arquivoId) {
    var lista = montados.filter(function (c) { return c.vivo() && c.arquivoId === arquivoId; });
    var ed = BC.editor && BC.editor.componente && BC.editor.componente(arquivoId);
    if (ed && ed.mapa && lista.indexOf(ed.mapa) === -1) lista.push(ed.mapa);
    return lista;
  }
  function gravar(a, est, selecionar) {
    componentesDe(a.id).forEach(function (c) { c.arquivoId = a.id; c.atualizar(est, selecionar ? { selecionar: selecionar } : {}); }); /* primeiro a tela, depois o arquivo */
    L().fazer('salvarArquivo', a.caminho, JSON.stringify(est));
  }

  /* materializa o galho: cria o objeto de verdade e liga o galho a ele (o endereço fica no arquivo do mapa) */
  MV.materializar = function (arquivoId, noId, tipo, op) {
    op = op || {};
    var a = L().arquivo(arquivoId);
    if (!a || a.tipo !== 'mapa') return { erro: 'Mapa não encontrado.' };
    if (!L().podeEditar(a)) return { erro: 'Este mapa é de ' + nomeCurto(a.dono) + ': quem materializa é o dono ou a gestão.' };
    if (!CRIAR[tipo]) return { erro: 'Materializar em quê? Tela, campanha, demanda ou peça da Máquina.' };
    var est = estadoDe(a), n = est && acharNo(est, noId);
    if (!n) return { erro: 'Galho não encontrado no mapa.' };
    if (n.liga) return { ja: true, liga: n.liga };
    var ctx = contexto(est, n, a), liga = CRIAR[tipo](n, ctx, op);
    if (!liga) return { erro: 'Não deu para criar ' + NOME_TIPO[tipo] + ' agora.' };
    liga.tipo = tipo; liga.por = L().eu; liga.em = Date.now();
    liga.endereco = endereco(liga, ctx);
    n.liga = liga;
    gravar(a, est, op.selecionar ? n.id : null); /* pelo terminal a tela vai até o galho; pela ficha ela fica onde a pessoa está */
    medidas.materializados++;
    var d = derivar(n, Object.assign({ arquivo: a.id }, est)) || { p: 0.1, fase: 'nasceu', rotulo: 'nasceu' };
    gravarVivo(a.id, n.id, d, { texto: L().nome(L().eu) + ' materializou o galho "' + n.text + '" em ' + NOME_TIPO[tipo] + ' · ' + liga.endereco.texto,
      extra: { tv: true, textoTv: 'O galho "' + n.text + '" virou ' + NOME_TIPO[tipo] } });
    return { liga: liga, no: n.id };
  };

  /* fechar o galho à mão (OK com nome e hora, como função, sem cerimônia); reabrir desfaz */
  MV.fechar = function (arquivoId, noId, reabrir) {
    var a = L().arquivo(arquivoId), est = a && estadoDe(a), n = est && acharNo(est, noId);
    if (!n || !L().podeEditar(a)) return false;
    if (reabrir) { if (!n.fechado) return false; delete n.fechado; }
    else { if (n.fechado) return false; n.fechado = { por: L().eu, em: Date.now() }; }
    gravar(a, est, null);
    if (reabrir) {
      var d = derivar(n, Object.assign({ arquivo: a.id }, est)) || { p: 0, fase: 'aberto', rotulo: 'reaberto por ' + nomeCurto(L().eu), sig: 'reaberto' };
      gravarVivo(a.id, n.id, d, null);
    } else agendar();
    return true;
  };

  /* "ir até": abre o objeto ligado onde ele mora */
  MV.irAte = function (arquivoId, noId) {
    var a = L().arquivo(arquivoId), est = a && estadoDe(a), n = est && acharNo(est, noId), li = n && n.liga;
    if (!li) return false;
    if (li.tipo === 'tela') { var t = L().arquivo(li.id) || L().arquivo(li.caminho); if (t && BC.explorador) { BC.explorador.abrirArquivo(t.id); return true; } }
    if (li.tipo === 'demanda' && BC.acoes && BC.acoes['abrir-demanda']) { BC.acoes['abrir-demanda']({ dataset: { id: li.id } }); return true; }
    if (li.tipo === 'campanha') {
      if (BC.campanha && typeof BC.campanha.abrir === 'function') { try { BC.campanha.abrir(li.id); return true; } catch (e) { /* segue */ } }
      if (BC.estacao) { BC.estacao.abrir('metas'); return true; }
    }
    if (li.tipo === 'peca' && BC.maquina) {
      BC.maquina.abrir(li.projeto);
      var m = maquinaDe(li.projeto);
      if (m) { m.sel = li.id; if (BC.estacao) BC.estacao.render(); }
      return true;
    }
    aviso('O objeto ligado a este galho não está mais aqui.');
    return false;
  };

  /* ---------- a TV apresenta galho a galho ---------- */

  function galhosDe(est) { var raiz = est.nodes.filter(function (n) { return !n.parent; })[0]; return raiz ? filhosDe(est, raiz.id).map(function (n) { return n.id; }) : []; }
  L().A.mapaApresentar = function (quem, arquivoId, passo) {
    var e = L().estado, a = L().arquivo(arquivoId), est = a && estadoDe(a);
    if (!est) return;
    var galhos = galhosDe(est), p = e.projecao, novo = !p || p.caminho !== a.caminho || !p.mapa;
    if (!p || p.caminho !== a.caminho) e.projecao = { caminho: a.caminho, tipo: 'mapa', por: quem, pagina: 1, paginas: 1, desde: Date.now() };
    e.projecao.mapa = { arquivo: a.id, caminho: a.caminho, passo: Math.max(0, Math.min(galhos.length, passo | 0)), galhos: galhos, ts: Date.now() };
    return novo ? [L()._evento('projecao', quem, L().nome(quem) + ' levou o mapa "' + est.title + '" para a TV, galho a galho', { discreto: true })] : [];
  };
  MV.apresentar = function (arquivoId, passo) { return L().fazer('mapaApresentar', chaveDe(arquivoId), passo || 0); };
  MV.apresentacao = function () { var p = L().estado.projecao; return p && p.mapa ? { arquivo: p.mapa.arquivo, passo: p.mapa.passo, total: p.mapa.galhos.length, no: p.mapa.galhos[p.mapa.passo] || null } : null; };
  MV.proximo = function () { var x = MV.apresentacao(); return x ? MV.apresentar(x.arquivo, Math.min(x.total, x.passo + 1)) : false; };
  MV.anterior = function () { var x = MV.apresentacao(); return x ? MV.apresentar(x.arquivo, Math.max(0, x.passo - 1)) : false; };
  MV.encerrar = function () { return MV.apresentacao() ? L().fazer('encerrarProjecao') : false; };

  /* ---------- leitura para os outros e para os testes ---------- */

  MV.ligacoes = function (arquivoId) {
    var a = L().arquivo(arquivoId), est = a && estadoDe(a), viv = vivoDe(arquivoId);
    if (!est) return [];
    return est.nodes.filter(function (n) { return n.liga || n.fechado; }).map(function (n) { return { no: n.id, texto: n.text, liga: n.liga || null, fechado: n.fechado || null, vivo: viv[n.id] || null }; });
  };
  MV.vivo = function (arquivoId) { return clonar(vivoDe(arquivoId)); };
  MV.medidas = function () { return clonar(medidas); };
  MV.componentes = function () { return montados.filter(function (c) { return c.vivo(); }).map(function (c) { return { arquivo: c.arquivoId, apresentar: !!c.op.apresentar, editavel: !!c.op.editavel }; }); };
  MV.derivar = function (arquivoId, noId) { var a = L().arquivo(arquivoId), est = a && estadoDe(a), n = est && acharNo(est, noId); return n ? derivar(n, Object.assign({ arquivo: arquivoId }, est)) : null; };
  BC.mapaVivo = MV;

  /* ---------- o agente do terminal mexe no mapa por conversa ---------- */

  function itensDe(texto) {
    return texto.split(/\s*(?:,|;|\be\b|\/)\s*/).map(function (s) { return s.replace(/^["'“”]+|["'“”.]+$/g, '').trim(); }).filter(Boolean);
  }
  function achar(estado, texto) {
    var alvo = U.normalizar(texto || '').replace(/^["“']+|["”'.!]+$/g, '').trim();
    if (!alvo) return null;
    var exato = estado.nodes.filter(function (n) { return U.normalizar(n.text) === alvo; })[0];
    return exato || estado.nodes.filter(function (n) { return U.normalizar(n.text).indexOf(alvo) !== -1 || alvo.indexOf(U.normalizar(n.text)) !== -1; })[0] || null;
  }
  function adicionar(estado, pai, textos) {
    var criados = [], dir = ladoDe(estado, pai);
    textos.forEach(function (t) {
      var irmaos = estado.nodes.filter(function (n) { return n.parent === pai.id; }).length;
      var cor = pai.parent ? pai.color : (dir > 0 ? LADO.dir : LADO.esq);
      var n = no(null, pai.id, t, { x: pai.x + dir * 235, y: pai.y + (irmaos - 0.5) * PASSO_Y, color: cor, size: pai.parent ? 14 : 16 });
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
  function tipoDoPedido(t) {
    t = U.normalizar(t);
    if (/\btela|site|landing page|pagina\b/.test(t)) return 'tela';
    if (/\bcampanha/.test(t)) return 'campanha';
    if (/\bdemanda|tarefa/.test(t)) return 'demanda';
    if (/\bpeca|maquina|backend|gaveta/.test(t)) return 'peca';
    return null;
  }
  function pessoaDoPedido(t) {
    var m = U.normalizar(t).match(/\bpara\s+(?:o\s+|a\s+)?([a-z]+)/);
    if (!m) return null;
    return (L().estado.pessoas || []).filter(function (p) { return U.normalizar(String(p.nome).split(' ')[0]) === m[1]; })[0] || null;
  }
  var RE_MAT = /\b(?:materializ\w*|transform\w*|vir\w*)\s+(?:o\s+|a\s+)?(?:galho\s+|t[oó]pico\s+|ramo\s+)?(.+?)\s+(?:em|como|numa?)\s+(?:uma?\s+)?(tela|site|campanha|demanda|tarefa|pe[çc]a(?:\s+da\s+m[aá]quina)?|m[aá]quina)\b(.*)$/i;
  var RE_TV = /\b(leva|levar|leve|mostra|mostrar|mostre|apresenta|apresentar|apresente|projeta|projetar|projete|passa|passe)\b.*\bmapa\b.*\b(tv|televisao|parede)\b/;

  BC.mapaAgente = {
    abaAtiva: function () {
      var t = BC.estacao && BC.estacao.abaAtual && BC.estacao.abaAtual();
      var a = t && t.tipo === 'arquivo' && L().arquivo(t.ref);
      return a && a.tipo === 'mapa' ? a : null;
    },
    /* o pedido tem cara de mapa? (para o terminal decidir) */
    entende: function (n) {
      if (/\bmapa\b/.test(n) && /\b(cria|criar|crie|monta|montar|monte|faz|faca|gera|gere|abre|abra|novo)\b/.test(n)) return true;
      if (RE_TV.test(n)) return true;
      if (MV.apresentacao() && /\b(proximo galho|galho seguinte|galho anterior|volta um galho|(encerra|encerre|termina|termine|para|pare) a apresentacao)\b/.test(n)) return true;
      return !!BC.mapaAgente.abaAtiva() && /\b(adiciona|adicione|coloca|coloque|poe|inclui|inclua|expande|expanda|desenvolve|desenvolva|detalha|detalhe|apaga|apague|remove|remova|tira|tire|renomeia|renomeie|galho|galhos|topico|topicos|ramo|materializa|materialize|materializar)\b/.test(n);
    },
    pedido: function (pedido, ag, term) {
      var n = U.normalizar(pedido), eu = L().eu, aberto = BC.mapaAgente.abaAtiva(), estado, salvar, m;

      /* 0. apresentação na TV (vale com qualquer aba aberta) */
      if (MV.apresentacao() && /\b(proximo galho|galho seguinte)\b/.test(n)) { MV.proximo(); var x1 = MV.apresentacao(); term.cartao('A TV foi para ' + (x1.no ? 'o galho ' + (x1.passo + 1) + ' de ' + x1.total : 'a visão geral') + '.', null, ''); return; }
      if (MV.apresentacao() && /\b(galho anterior|volta um galho)\b/.test(n)) { MV.anterior(); var x2 = MV.apresentacao(); term.cartao('A TV voltou para o galho ' + (x2.passo + 1) + ' de ' + x2.total + '.', null, ''); return; }
      if (MV.apresentacao() && /\b(encerra|encerre|termina|termine|para|pare) a apresentacao\b/.test(n)) { MV.encerrar(); term.cartao('Apresentação encerrada: a TV voltou ao painel.', null, ''); return; }
      if (RE_TV.test(n)) {
        var alvoTv = aberto;
        if (!alvoTv) { var nome = (pedido.match(/\bmapa\s+(?:do |da |de )?["“]?(.+?)["”]?\s+(?:para|pra|na)\b/i) || [])[1]; alvoTv = nome ? L().estado.arquivos.filter(function (a) { return a.tipo === 'mapa' && U.normalizar(a.caminho).indexOf(U.normalizar(nome)) !== -1; })[0] : null; }
        if (!alvoTv) { term.escrever('Abra o mapa (ou diga qual: "leva o mapa Lançamento para a TV").', 'dica'); return; }
        MV.apresentar(alvoTv.id, 0);
        var x0 = MV.apresentacao(), est0 = estadoDe(alvoTv);
        term.cartao(esc(ag.nome) + ' levou <b>' + esc(est0.title) + '</b> para a TV: galho 1 de ' + x0.total + '. Diga "próximo galho", "galho anterior" ou "encerra a apresentação"; a barra "na TV" do mapa faz o mesmo.', null, '');
        return;
      }

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
        term.cartao(esc(ag.nome) + ' criou o mapa <b>' + esc(estado.title) + '</b> com ' + galhos.length + ' galhos: ' + esc(galhos.join(' · ')) + '. Continue falando: "adiciona X em ' + esc(galhos[0]) + '", "materializa o galho ' + esc(galhos[0]) + ' em tela", "leva o mapa para a TV".', null, novo ? '<button type="button" class="term-mini" data-term="abrir:' + novo.id + '">abrir</button>' : '');
        if (novo) BC.explorador.abrirArquivo(novo.id);
        return;
      }

      if (!aberto) { term.escrever('Nenhum mapa aberto. Diga "cria um mapa sobre X com A, B e C" ou abra um .mapa.', 'dica'); return; }
      estado = normalizar(JSON.parse(BC.editor.conteudo(aberto) || '{}'));
      salvar = function (msg, extra) {
        var comp = BC.editor && BC.editor.componente && BC.editor.componente(aberto.id);
        if (comp && comp.mapa) comp.mapa.atualizar(estado, extra || {}); /* primeiro a tela (com a seleção), depois o arquivo */
        L().fazer('salvarArquivo', aberto.caminho, JSON.stringify(estado));
        term.cartao(esc(ag.nome) + ' ' + msg + ' em <b>' + esc(estado.title) + '</b>.', null, '');
      };
      var raiz = estado.nodes.filter(function (x) { return !x.parent; })[0];

      /* 1b. materializar um galho: "materializa o galho Landing em tela" · "transforma Canais em campanha" · "… em demanda para o Davi" */
      if ((m = pedido.match(RE_MAT))) {
        var alvoM = achar(estado, m[1]), tipo = tipoDoPedido(m[2]), pessoa = pessoaDoPedido(m[3] || '');
        if (!alvoM) { term.escrever('Não achei o galho "' + esc(m[1]) + '" em ' + esc(estado.title) + '.', 'dica'); return; }
        var r = MV.materializar(aberto.id, alvoM.id, tipo, { para: pessoa && pessoa.id, selecionar: true });
        if (r.erro) { term.escrever(r.erro, 'dica'); return; }
        if (r.ja) { term.escrever('O galho "' + esc(alvoM.text) + '" já virou ' + NOME_TIPO[r.liga.tipo] + ': ' + esc(r.liga.endereco.texto) + '.', 'dica'); return; }
        term.cartao(esc(ag.nome) + ' materializou o galho <b>' + esc(alvoM.text) + '</b> em ' + NOME_TIPO[tipo] + ' · ' + esc(r.liga.endereco.texto) + '. A luz anda por ele conforme o trabalho acontece; fechado, ele acende de concluído.', null,
          '<button type="button" class="term-mini" data-acao="mapa-ir" data-arquivo="' + esc(aberto.id) + '" data-no="' + esc(alvoM.id) + '">ir até</button>');
        return;
      }
      /* 1c. fechar um galho à mão */
      if ((m = pedido.match(/\b(?:fecha|feche|fechar|conclui|conclua|concluir)\s+(?:o\s+)?galho\s+(.+?)\s*[.!]?$/i))) {
        var alvoF = achar(estado, m[1]);
        if (!alvoF) { term.escrever('Não achei o galho "' + esc(m[1]) + '".', 'dica'); return; }
        if (MV.fechar(aberto.id, alvoF.id)) term.cartao('Galho <b>' + esc(alvoF.text) + '</b> fechado por ' + esc(L().nome(eu)) + ' · ' + U.hora(Date.now()) + '.', null, '');
        else term.escrever('O galho "' + esc(alvoF.text) + '" já estava fechado.', 'dica');
        return;
      }

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
        var subs = ['O que é', 'Por que importa', 'Como fazer', 'Quem cuida'];
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
      term.escrever('Entendo: "cria um mapa sobre X com A, B e C", "adiciona X em Y", "expande Y", "renomeia Y para Z", "apaga Y", "materializa o galho Y em tela / campanha / demanda / peça", "fecha o galho Y", "leva o mapa para a TV".', 'dica');
    }
  };

  /* botão "ir até" do cartão do terminal */
  BC.acoes = BC.acoes || {};
  BC.acoes['mapa-ir'] = function (el) { MV.irAte(el.dataset.arquivo, el.dataset.no); };
})(window.BC);
