/* Babel Coop · o acervo da equipe (IDEIAS §8.1 e §8.2, CHECKLIST §6): tudo o que acontece no app vira dado para a LLM.

   Substrato (o mesmo desenho da base do Dominic, saber/base):
   (a) HISTÓRICO CRU = a única fonte da verdade: o diário de eventos (.coop/diario.jsonl), a saída dos terminais
       (.coop/historico/terminal.jsonl: só o texto final do agente e os arquivos que ele mexeu, nunca o que foi digitado),
       os usos (.coop/historico/usos.jsonl) e os arquivos da pasta compartilhada. Todo o resto é cache derivado:
       `node servidor/acervo.js --reconstruir` (ou POST /api/acervo/reconstruir) apaga o SQLite e refaz do zero.
   (b) INVENTÁRIO de todo arquivo servido (caminho, ext, bytes, mtime, hash); reindexa só o que mudou (hash).
   (c) CARTÕES: um fato por cartão {id:'<tipo>-NNN', afirmacao, prova, data, autor, tags (2–5), fontes}, nascidos de
       aprendizados, decisões de demanda, atas, resultados de agente e respostas.
   (d) FUNDIDOS: aprendizado repetido (semelhança ≥ limiar) não vira cartão novo: soma "+1 confirmado" no que já existia
       e fica registrado em fundidos (fundido_em, fundido_data).
   (e) ÍNDICE gerado para a LLM ler de uma vez: <pasta>/ACERVO.md (linha do tempo por data, temas por tag) e
       <pasta>/APRENDIZADOS.md; e um CLAUDE.md na pasta (bloco marcado; o resto do arquivo é da pessoa).
   (f) LIGAÇÕES entre itens (mesma fonte, mesma tag, citação de cartão): a busca traz os vizinhos.
   Exportações em JSONL (a IA do Theus lê): <raiz>/.coop/acervo/{cartoes,fundidos,inventario}.jsonl e exportar(dia).

   Busca sem LLM: palavras (SQLite FTS5, BM25, unicode61 remove_diacritics 2, prefixo) + semelhança (vetores de pedaços
   de palavras: trigramas de caracteres com hashing em 512 dimensões, normalizados; cosseno em JS), juntas por RRF.
   Usos: +1 por pessoa por hora por item; o próprio autor não conta.
   Só node:sqlite (embutido no Node 24 e no Electron 44): nenhuma dependência nova.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/* node:sqlite ainda avisa "experimental" no Node 24: o aviso sai só uma vez e não diz nada útil para quem usa o app */
const avisar = process.emitWarning;
process.emitWarning = function (w, ...resto) { if (/SQLite/i.test(String((w && w.message) || w))) return; return avisar.call(process, w, ...resto); };
let DatabaseSync;
try { ({ DatabaseSync } = require('node:sqlite')); } catch (e) { DatabaseSync = null; } finally { process.emitWarning = avisar; }

const DIMS = 512;
const LIMIAR = 0.82;              /* aprendizado com semelhança ≥ isto é o mesmo: +1 confirmado */
const MAX_TEXTO = 200000;         /* caracteres de texto guardados por item */
const MAX_ARQUIVO = 2 * 1024 * 1024;
const MAX_CODIGO = 200 * 1024;    /* .js/.css maiores que isto (código minificado) entram só pelo nome */
const TEXTO_EXT = { md: 1, txt: 1, html: 1, htm: 1, css: 1, js: 1, json: 1, csv: 1, mapa: 1, quadro: 1 };
const GERADOS = new Set(['ACERVO.md', 'APRENDIZADOS.md']);
const IGNORADOS = /^(\.DS_Store|Thumbs\.db|~\$.*|\.env.*|.*\.pem|.*\.key|\.ssh|credentials.*|node_modules|\.git|\.coop)$/i;
const TIPOS = ['arquivo', 'nota', 'mapa', 'quadro', 'ata', 'demanda', 'aprendizado', 'ideia', 'resposta', 'terminal', 'mensagem', 'clone', 'campanha'];
/* prefixo do cartão de cada tipo que vira cartão (c): aprendizado, decisão de demanda, ata, resultado de agente, resposta */
const CARTAO = { aprendizado: 'apr', demanda: 'dem', ata: 'ata', terminal: 'res', resposta: 'resp' };
const BLOCO_INI = '<!-- coop:acervo início (gerado pelo babel-coop; o resto deste arquivo é seu) -->';
const BLOCO_FIM = '<!-- coop:acervo fim -->';
const PARADAS = new Set(('a o as os um uma uns umas de da do das dos e em no na nos nas ao aos para pra pro por com sem que se ou ' +
  'mais muito como mas foi ser tem ter era sao esta este esse essa isso isto aquilo ele ela eles elas eu voce nos seu sua seus suas ' +
  'meu minha ja so nao sim quando onde qual quem ate sobre entre depois antes tambem ainda cada todo toda todos todas the and of to in is it for on with').split(' '));

/* ---------- texto ---------- */
const normalizar = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const palavras = (s) => normalizar(s).match(/[a-z0-9]+/g) || [];
const termos = (s) => palavras(s).filter((w) => w.length >= 2 && !PARADAS.has(w));
const umaLinha = (s, max) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max || 300);
/* raiz leve do português (plural, gênero, fim de verbo): 'clínicas' e 'clínica', 'preferem' e 'prefere' viram o mesmo pedaço */
function raiz(w) {
  if (w.length <= 3) return w;
  w = w.replace(/coes$/, 'cao').replace(/s$/, '');
  if (w.length > 4) w = w.replace(/(iam|ava|am|em|ar|er|ir|ou|ia)$/, '');
  if (w.length > 4) w = w.replace(/[aeo]$/, '');
  return w;
}
function fnv(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; }

/* vetor de pedaços de palavras: trigramas de caracteres de cada palavra (com borda) + a palavra inteira, por hashing
   com sinal em DIMS dimensões, normalizado (cosseno = produto escalar). Sem modelo, sem download. */
function vetor(texto) {
  const v = new Float32Array(DIMS);
  const ws = termos(String(texto || '').slice(0, 60000));
  for (const w0 of ws.slice(0, 6000)) {
    const w = raiz(w0), p = ' ' + w + ' ';
    for (let i = 0; i + 3 <= p.length; i++) { const h = fnv(p.slice(i, i + 3)); v[h % DIMS] += (h & 0x80000000) ? -1 : 1; }
    const h = fnv('#' + w); v[h % DIMS] += (h & 0x80000000) ? -1.5 : 1.5;
  }
  let n = 0; for (let i = 0; i < DIMS; i++) n += v[i] * v[i];
  n = Math.sqrt(n);
  if (n > 0) for (let i = 0; i < DIMS; i++) v[i] /= n;
  return v;
}
function cosseno(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }
const vetorDeBlob = (b) => new Float32Array(new Uint8Array(b).buffer);

/* 2 a 5 tags: o tipo + os termos mais frequentes (4 letras ou mais) */
function tagsDe(tipo, titulo, texto) {
  const conta = new Map();
  termos(titulo + ' ' + titulo + ' ' + String(texto || '').slice(0, 20000)).forEach((w) => { if (w.length >= 4 && !/^\d+$/.test(w)) conta.set(w, (conta.get(w) || 0) + 1); });
  const top = Array.from(conta.entries()).sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1)).slice(0, 4).map((x) => x[0]);
  const tags = [tipo].concat(top.filter((t) => t !== tipo));
  if (tags.length < 2) tags.push('geral');
  return tags.slice(0, 5);
}

/* trecho de ~200 caracteres em volta do primeiro termo achado (prefixo, sem acento) */
function trechoDe(texto, qs, largura) {
  largura = largura || 90;
  const plano = umaLinha(texto, MAX_TEXTO), norm = normalizar(plano);
  let pos = -1;
  (qs || []).forEach((t) => { const i = norm.indexOf(t); if (i !== -1 && (pos === -1 || i < pos)) pos = i; });
  if (pos === -1) return plano.slice(0, largura * 2) + (plano.length > largura * 2 ? '…' : '');
  const ini = Math.max(0, pos - largura), fim = Math.min(plano.length, pos + largura * 1.3);
  return (ini > 0 ? '…' : '') + plano.slice(ini, fim) + (fim < plano.length ? '…' : '');
}
const primeiraFrase = (s) => { const t = umaLinha(s, 2000); const m = t.match(/^.{12,}?[.!?](\s|$)/); return (m ? m[0] : t).trim().slice(0, 280); };

function textoDeHtml(html) {
  return String(html).replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ').trim();
}
/* texto curto de qualquer objeto dos argumentos de um evento (strings até 2 níveis) */
function textoDe(o, fundo) {
  if (o == null) return '';
  if (typeof o === 'string') return o;
  if (typeof o === 'number' || typeof o === 'boolean') return '';
  if ((fundo || 0) > 2) return '';
  if (Array.isArray(o)) return o.map((x) => textoDe(x, (fundo || 0) + 1)).filter(Boolean).join(' · ');
  return Object.keys(o).filter((k) => !/^(id|ts|cor|icone|url|foto|x|y)$/i.test(k)).map((k) => textoDe(o[k], (fundo || 0) + 1)).filter(Boolean).join(' · ');
}
function dia(ts) { const d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function hora(ts) { const d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
const sha1 = (b) => crypto.createHash('sha1').update(b).digest('hex');
const json = (s, padrao) => { try { return s ? JSON.parse(s) : padrao; } catch (e) { return padrao; } };

/* ações do diário que viram história de uma demanda (args[0] = id da demanda no app) */
const DEMANDA_ACOES = { pegar: 'pegou', comecar: 'começou', pausar: 'pausou', retomar: 'retomou', pronta: 'avisou que está pronta', perguntar: 'perguntou',
  responder: 'respondeu', travado: 'travou', valeu: 'agradeceu', devolver: 'devolveu', cancelar: 'cancelou', confirmar: 'conferiu e aprovou', cutucar: 'cutucou', ok: 'deu ok' };

class Acervo {
  /* o = { raiz, pasta: () => caminho, eu: () => id, nomeDe?: (id) => nome, anexar?: (quem, acao, args) => evento do diário,
           eventos?: () => [eventos do diário], pares?: () => [{id, nome, ligado, perguntar(q, o) → Promise<lista>}],
           limiar?, arquivo?, tempoGerar? } */
  constructor(o) {
    if (!DatabaseSync) throw new Error('node:sqlite indisponível neste runtime');
    this.o = o || {};
    this.raiz = this.o.raiz;
    this.limiar = +this.o.limiar || LIMIAR;
    this.dirCoop = path.join(this.raiz, '.coop');
    this.dirHist = path.join(this.dirCoop, 'historico');
    this.dirExport = path.join(this.dirCoop, 'acervo');
    this.arquivo = this.o.arquivo || path.join(this.dirCoop, 'acervo.sqlite');
    fs.mkdirSync(this.dirHist, { recursive: true });
    fs.mkdirSync(this.dirExport, { recursive: true });
    this.vetores = null;       /* n → Float32Array (carregado na primeira busca por semelhança) */
    this.tGerar = null; this.tVarrer = null;
    this.repetindo = false;    /* reconstruindo: não regrava o histórico cru */
    this.abrir();
  }

  /* ---------- banco ---------- */
  abrir() {
    this.db = new DatabaseSync(this.arquivo);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;
      CREATE TABLE IF NOT EXISTS meta (chave TEXT PRIMARY KEY, valor TEXT);
      CREATE TABLE IF NOT EXISTS itens (n INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL, tipo TEXT NOT NULL, titulo TEXT, texto TEXT,
        origem TEXT, autor TEXT, dono TEXT, criado INTEGER, atualizado INTEGER, usos INTEGER NOT NULL DEFAULT 0, confirmacoes INTEGER NOT NULL DEFAULT 0,
        confirmadores TEXT, hash TEXT, tags TEXT, cartao TEXT, prova TEXT);
      CREATE INDEX IF NOT EXISTS itens_tipo ON itens(tipo);
      CREATE INDEX IF NOT EXISTS itens_criado ON itens(criado);
      CREATE VIRTUAL TABLE IF NOT EXISTS busca USING fts5(titulo, texto, tokenize='unicode61 remove_diacritics 2');
      CREATE TABLE IF NOT EXISTS vetores (n INTEGER PRIMARY KEY, v BLOB NOT NULL);
      CREATE TABLE IF NOT EXISTS marcas (item TEXT NOT NULL, tag TEXT NOT NULL, PRIMARY KEY (item, tag));
      CREATE INDEX IF NOT EXISTS marcas_tag ON marcas(tag);
      CREATE TABLE IF NOT EXISTS ligacoes (de TEXT NOT NULL, para TEXT NOT NULL, tipo TEXT NOT NULL, peso REAL, PRIMARY KEY (de, para, tipo));
      CREATE INDEX IF NOT EXISTS ligacoes_para ON ligacoes(para);
      CREATE TABLE IF NOT EXISTS fundidos (id TEXT PRIMARY KEY, afirmacao TEXT, prova TEXT, data TEXT, autor TEXT, tags TEXT, fontes TEXT,
        fundido_em TEXT, fundido_data TEXT, item TEXT, ts INTEGER);
      CREATE TABLE IF NOT EXISTS inventario (caminho TEXT PRIMARY KEY, ext TEXT, bytes INTEGER, mtime INTEGER, hash TEXT, item TEXT);
      CREATE TABLE IF NOT EXISTS aplicados (ev TEXT PRIMARY KEY, item TEXT, novo INTEGER);
      CREATE TABLE IF NOT EXISTS usos (item TEXT NOT NULL, quem TEXT NOT NULL, hora INTEGER NOT NULL, PRIMARY KEY (item, quem, hora));
      CREATE TABLE IF NOT EXISTS superados (item TEXT PRIMARY KEY, por TEXT NOT NULL, quem TEXT, ts INTEGER);`);
    const p = (sql) => this.db.prepare(sql);
    this.q = {
      item: p('SELECT * FROM itens WHERE id = ?'),
      itemN: p('SELECT * FROM itens WHERE n = ?'),
      inserir: p('INSERT INTO itens (id, tipo, titulo, texto, origem, autor, dono, criado, atualizado, hash, tags, cartao, prova) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'),
      atualizar: p('UPDATE itens SET tipo=?, titulo=?, texto=?, origem=?, autor=?, dono=?, atualizado=?, hash=?, tags=?, prova=? WHERE n=?'),
      apagar: p('DELETE FROM itens WHERE n = ?'),
      ftsIns: p('INSERT INTO busca (rowid, titulo, texto) VALUES (?,?,?)'),
      ftsDel: p('DELETE FROM busca WHERE rowid = ?'),
      vetIns: p('INSERT OR REPLACE INTO vetores (n, v) VALUES (?,?)'),
      vetDel: p('DELETE FROM vetores WHERE n = ?'),
      marcaIns: p('INSERT OR IGNORE INTO marcas (item, tag) VALUES (?,?)'),
      marcaDel: p('DELETE FROM marcas WHERE item = ?'),
      ligIns: p('INSERT OR REPLACE INTO ligacoes (de, para, tipo, peso) VALUES (?,?,?,?)'),
      ligDelDe: p('DELETE FROM ligacoes WHERE de = ? AND tipo = ?'),
      ligDelTudo: p('DELETE FROM ligacoes WHERE de = ? OR para = ?'),
      meta: p('SELECT valor FROM meta WHERE chave = ?'),
      metaSet: p('INSERT OR REPLACE INTO meta (chave, valor) VALUES (?,?)'),
      aplicado: p('SELECT * FROM aplicados WHERE ev = ?'),
      aplicar: p('INSERT OR REPLACE INTO aplicados (ev, item, novo) VALUES (?,?,?)'),
      inv: p('SELECT * FROM inventario WHERE caminho = ?'),
      invSet: p('INSERT OR REPLACE INTO inventario (caminho, ext, bytes, mtime, hash, item) VALUES (?,?,?,?,?,?)'),
      invDel: p('DELETE FROM inventario WHERE caminho = ?'),
      invTodos: p('SELECT * FROM inventario ORDER BY caminho'),
      uso: p('INSERT OR IGNORE INTO usos (item, quem, hora) VALUES (?,?,?)'),
      usoMais: p('UPDATE itens SET usos = usos + 1 WHERE id = ?'),
      fts: p("SELECT rowid AS n, bm25(busca, 3.0, 1.0) AS s FROM busca WHERE busca MATCH ? ORDER BY s LIMIT ?"),
      aprendizadosVet: p("SELECT i.n, i.id, v.v FROM itens i JOIN vetores v ON v.n = i.n WHERE i.tipo = 'aprendizado' AND i.id NOT IN (SELECT item FROM superados)"),
      superar: p('INSERT OR REPLACE INTO superados (item, por, quem, ts) VALUES (?,?,?,?)'),
      confirmar: p('UPDATE itens SET confirmacoes = confirmacoes + 1, confirmadores = ?, atualizado = ? WHERE id = ?'),
      fundir: p('INSERT OR REPLACE INTO fundidos (id, afirmacao, prova, data, autor, tags, fontes, fundido_em, fundido_data, item, ts) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    };
  }

  fechar() {
    clearTimeout(this.tGerar); clearTimeout(this.tVarrer);
    if (this.pendenteGerar) { try { this.gerarArquivos(); } catch (e) { /* ok */ } }
    try { this.db.close(); } catch (e) { /* já fechado */ }
  }

  tx(fn) {
    if (this.emTx) return fn();
    this.emTx = true; this.db.exec('BEGIN');
    try { const r = fn(); this.db.exec('COMMIT'); return r; } catch (e) { try { this.db.exec('ROLLBACK'); } catch (e2) { /* ok */ } throw e; } finally { this.emTx = false; }
  }

  pasta() { return typeof this.o.pasta === 'function' ? this.o.pasta() : this.o.pasta; }
  eu() { return typeof this.o.eu === 'function' ? this.o.eu() : this.o.eu; }
  nome(id) { if (!id) return ''; try { return (this.o.nomeDe && this.o.nomeDe(id)) || id; } catch (e) { return id; } }

  /* ---------- gravar um item (derivado) ---------- */
  gravar(it) {
    const tipo = TIPOS.includes(it.tipo) ? it.tipo : 'nota';
    const titulo = umaLinha(it.titulo, 200) || tipo;
    const completo = String(it.texto == null ? '' : it.texto);
    const texto = tipo === 'terminal' ? completo : completo.slice(0, MAX_TEXTO);
    const origem = JSON.stringify(it.origem || {});
    const autor = it.autor || this.eu() || '';
    const dono = it.dono || this.eu() || '';
    const hash = sha1(tipo + '\n' + titulo + '\n' + autor + '\n' + origem + '\n' + texto);
    const tags = it.tags || tagsDe(tipo, titulo, texto);
    const prova = umaLinha(it.prova, 400);
    const agora = it.atualizado || it.criado || Date.now();
    const velho = this.q.item.get(it.id);
    if (velho && velho.hash === hash) return { n: velho.n, mudou: false, novo: false };
    return this.tx(() => {
      let n;
      if (velho) {
        n = velho.n;
        this.q.atualizar.run(tipo, titulo, texto, origem, autor, dono, agora, hash, JSON.stringify(tags), prova, n);
        this.q.ftsDel.run(n);
      } else {
        const pref = it.cartao === false ? null : CARTAO[tipo];
        const cartao = pref ? this.proximoCartao(pref) : null;
        n = Number(this.q.inserir.run(it.id, tipo, titulo, texto, origem, autor, dono, it.criado || agora, agora, hash, JSON.stringify(tags), cartao, prova).lastInsertRowid);
      }
      this.q.ftsIns.run(n, titulo, texto);
      const v = vetor(titulo + ' ' + texto);
      this.q.vetIns.run(n, Buffer.from(v.buffer));
      if (this.vetores) this.vetores.set(n, v);
      this.q.marcaDel.run(it.id);
      tags.forEach((t) => this.q.marcaIns.run(it.id, t));
      /* ligações: mesma fonte (dada por quem grava) e citação de cartão no texto */
      this.q.ligDelDe.run(it.id, 'citacao');
      (texto.match(/\b(apr|dem|ata|res|resp)-\d{3,}\b/g) || []).slice(0, 20).forEach((c) => {
        const alvo = this.db.prepare('SELECT id FROM itens WHERE cartao = ?').get(c);
        if (alvo && alvo.id !== it.id) this.q.ligIns.run(it.id, alvo.id, 'citacao', 1);
      });
      (it.fontes || []).forEach((f) => { if (f && f !== it.id) this.q.ligIns.run(it.id, f, 'fonte', 1); });
      this.agendarGerar();
      return { n, mudou: true, novo: !velho };
    });
  }

  proximoCartao(pref) {
    const k = 'cartao:' + pref;
    const n = (+((this.q.meta.get(k) || {}).valor) || 0) + 1;
    this.q.metaSet.run(k, String(n));
    return pref + '-' + String(n).padStart(3, '0');
  }

  apagar(id) {
    const velho = this.q.item.get(id);
    if (!velho) return false;
    this.tx(() => {
      this.q.apagar.run(velho.n); this.q.ftsDel.run(velho.n); this.q.vetDel.run(velho.n);
      this.q.marcaDel.run(id); this.q.ligDelTudo.run(id, id);
    });
    if (this.vetores) this.vetores.delete(velho.n);
    this.agendarGerar();
    return true;
  }

  /* ---------- histórico cru → itens ---------- */
  /* tudo de uma vez (ao subir): diário + saída dos terminais + pasta + usos. Idempotente: só o que mudou grava. */
  sincronizar(eventos) {
    const t0 = Date.now();
    const evs = (eventos || (this.o.eventos ? this.o.eventos() : []) || []).slice().sort((a, b) => (a.ts || 0) - (b.ts || 0));
    const terms = this.lerJsonl(path.join(this.dirHist, 'terminal.jsonl'));
    const linha = evs.map((e) => ({ ts: e.ts || 0, ev: e })).concat(terms.map((r) => ({ ts: r.ts || 0, ter: r }))).sort((a, b) => a.ts - b.ts);
    this.tx(() => { linha.forEach((x) => { try { if (x.ev) this.evento(x.ev); else this.terminal(x.ter, { cru: false }); } catch (e) { /* um registro ruim não para os outros */ } }); });
    const arquivos = this.varrer();
    return { eventos: evs.length, terminais: terms.length, arquivos, ms: Date.now() - t0 };
  }

  /* do zero: o SQLite é cache; o histórico cru refaz tudo (inclusive os usos) */
  reconstruir(eventos) {
    try { this.db.close(); } catch (e) { /* ok */ }
    ['', '-wal', '-shm'].forEach((s) => { try { fs.unlinkSync(this.arquivo + s); } catch (e) { /* não existia */ } });
    this.vetores = null;
    this.abrir();
    this.repetindo = true;
    try {
      const r = this.sincronizar(eventos);
      let usos = 0;
      this.tx(() => { this.lerJsonl(path.join(this.dirHist, 'usos.jsonl')).forEach((u) => { if (this.usar(u.item, u.quem, u.ts)) usos++; }); });
      r.usos = usos;
      this.gerarArquivos();
      return r;
    } finally { this.repetindo = false; }
  }

  lerJsonl(f) {
    let s = ''; try { s = fs.readFileSync(f, 'utf8'); } catch (e) { return []; }
    return s.split('\n').filter((l) => l.trim()).map((l) => json(l, null)).filter(Boolean);
  }
  anexarCru(nome, reg) { if (!this.repetindo) fs.appendFileSync(path.join(this.dirHist, nome), JSON.stringify(reg) + '\n'); }

  /* um evento do diário (meu ou replicado de outra Estação) */
  evento(ev) {
    if (!ev || typeof ev.id !== 'string' || typeof ev.acao !== 'string') return null;
    const feito = this.q.aplicado.get(ev.id);
    if (feito) return { item: feito.item, novo: !!feito.novo, repetido: true };
    const a = Array.isArray(ev.args) ? ev.args : [];
    const base = { autor: ev.quem || ev.autor, dono: ev.autor, criado: ev.ts || Date.now(), origem: { evento: ev.id, acao: ev.acao } };
    const str = (v, m) => (typeof v === 'string' ? v.slice(0, m || 20000) : '');
    let r = null;
    const item = (id, tipo, titulo, texto, extra) => { const g = this.gravar(Object.assign({}, base, { id, tipo, titulo, texto }, extra || {})); return { item: id, novo: g.novo }; };
    switch (ev.acao) {
      case 'aprendizado': r = this.aprender(ev, str(a[0], 2000), str(a[1], 200), str(a[3], 60)); break;
      case 'novaDemanda': {
        const d = a[0] && typeof a[0] === 'object' ? a[0] : {};
        if (!d.titulo) break;
        r = item('dem:' + ev.id, 'demanda', 'Demanda: ' + str(d.titulo, 160), [str(d.titulo, 300), str(d.descricao, 4000), d.para ? 'para ' + this.nome(d.para) : 'livre', d.prazo ? 'prazo ' + str(String(d.prazo), 40) : '', d.prioridade ? 'prioridade ' + str(d.prioridade, 20) : ''].filter(Boolean).join(' · '), { cartao: false, prova: 'enviada por ' + this.nome(base.autor) + ' (evento ' + ev.id + ')' });
        break;
      }
      case 'ideia': case 'ideiaFalada': case 'ideiaSugerida': {
        const t = str(a[0], 2000); if (!t) break;
        r = item('ideia:' + ev.id, 'ideia', (ev.acao === 'ideiaFalada' || a[1] === true ? 'Ideia falada' : 'Ideia') + ' de ' + this.nome(base.autor), t);
        break;
      }
      case 'responderPergunta': { const t = str(a[0], 4000); if (t) r = item('resp:' + ev.id, 'resposta', 'Resposta à pergunta da semana · ' + this.nome(base.autor), t, { prova: 'respondida por ' + this.nome(base.autor) }); break; }
      case 'decisao': { const t = str(a[0], 2000); if (t) r = item('ata:' + ev.id, 'ata', 'Decisão: ' + umaLinha(t, 120), t, { prova: 'decidido em reunião, registrado por ' + this.nome(base.autor) }); break; }
      case 'criarArquivo': {
        const caminho = str(a[0], 300), conteudo = str(a[2], MAX_TEXTO);
        if (!caminho || !conteudo) break;
        const ata = /(^|\/)Reuni(õ|o)es\//i.test(caminho) || /^#\s*Ata\b/.test(conteudo);
        r = item((ata ? 'ata:' : 'nota:') + ev.id, ata ? 'ata' : 'nota', caminho.split('/').pop().replace(/\.[a-z0-9]+$/i, ''), conteudo, { origem: Object.assign({}, base.origem, { caminho }), prova: ata ? 'ata salva por ' + this.nome(base.autor) : '' });
        break;
      }
      case 'mensagem': {
        const extra = a[2] && typeof a[2] === 'object' ? a[2] : {};
        const t = str(a[1], 8000);
        /* só as mensagens marcadas "guardar no acervo": conversa é da equipe, não do acervo */
        if (t && (extra.acervo || extra.guardar || extra.guardarNoAcervo)) r = item('msg:' + ev.id, 'mensagem', 'Mensagem de ' + this.nome(base.autor), t, { origem: Object.assign({}, base.origem, { conversa: str(a[0], 80) }) });
        break;
      }
      case 'novaCampanha': case 'campanhaGerar': {
        const d = a[0] && typeof a[0] === 'object' ? a[0] : {};
        const nome = str(d.titulo || d.nome, 160); if (!nome) break;
        r = item('cam:' + ev.id, 'campanha', 'Campanha: ' + nome, textoDe(d).slice(0, 8000));
        break;
      }
      case 'quadroItem': { const t = textoDe(a[1]); if (t) r = item('quadro:' + ev.id, 'quadro', 'Quadro · ' + umaLinha(t, 80), t); break; }
      case 'mapaGalho': { const t = textoDe(a[2]); if (t) r = item('mapa:' + ev.id, 'mapa', 'Mapa · ' + umaLinha(t, 80), t); break; }
      case 'maquinaEvento': { const t = textoDe(a[0]); if (t) r = item('maq:' + ev.id, 'nota', 'Máquina · ' + umaLinha(t, 80), t); break; }
      case 'novoProjeto': { const d = a[0] || {}; const t = textoDe(d); if (t) r = item('proj:' + ev.id, 'nota', 'Projeto: ' + umaLinha(d.nome || d.titulo || t, 100), t); break; }
      case 'aviso': case 'recado': case 'oficinaPublicar': { const t = str(a[0], 4000); if (t) r = item('nota:' + ev.id, 'nota', (ev.acao === 'aviso' ? 'Aviso' : ev.acao === 'recado' ? 'Recado' : 'Oficina') + ' de ' + this.nome(base.autor), t); break; }
      default: break;
    }
    /* a história de cada demanda (decisões de demanda viram cartão dem-NNN) */
    if (DEMANDA_ACOES[ev.acao] && typeof a[0] === 'string' && a[0]) {
      const idD = a[0].slice(0, 80);
      const nota = ev.acao === 'pronta' ? str(a[1], 1000) : ev.acao === 'responder' || ev.acao === 'perguntar' || ev.acao === 'travado' || ev.acao === 'devolver' || ev.acao === 'pausar' ? str(a[1], 1000) : '';
      const hid = 'demh:' + idD;
      const velho = this.q.item.get(hid);
      const linhaH = hora(base.criado) + ' ' + dia(base.criado) + ' · ' + this.nome(base.autor) + ' ' + DEMANDA_ACOES[ev.acao] + (nota ? ': ' + nota : '');
      const g = this.gravar(Object.assign({}, base, { id: hid, tipo: 'demanda', titulo: 'Histórico da demanda ' + idD, texto: (velho ? velho.texto + '\n' : '') + linhaH,
        autor: velho ? velho.autor : base.autor, criado: velho ? velho.criado : base.criado, atualizado: base.criado, origem: { demanda: idD, evento: ev.id },
        prova: 'história de ' + (velho ? (velho.texto.split('\n').length + 1) : 1) + ' passo(s) no diário' }));
      if (!r) r = { item: hid, novo: g.novo };
      if (ev.acao === 'pronta' && str(a[1]).trim().length >= 8) r = this.aprender(ev, str(a[1], 2000), 'demanda ' + idD);
    }
    if (r) this.q.aplicar.run(ev.id, r.item, r.novo ? 1 : 0);
    return r;
  }

  /* aprendizado (§8.2): parecido ≥ limiar → +1 confirmado e fundido; abaixo → cartão novo */
  /* corrige (cartão apr-NNN ou id): o aprendizado antigo estava errado; sai de APRENDIZADOS.md, da lista e da fusão, mas fica guardado */
  aprender(ev, texto, origem, corrige) {
    texto = umaLinha(texto, 2000);
    if (texto.length < 8) return null;
    const autor = ev.quem || ev.autor;
    const velhoErrado = corrige ? this.db.prepare("SELECT id FROM itens WHERE tipo = 'aprendizado' AND (cartao = ? OR id = ?)").get(corrige, corrige) : null;
    if (velhoErrado) this.q.superar.run(velhoErrado.id, 'apr:' + ev.id, autor, ev.ts || Date.now());
    const par = this.parecido(texto);
    const data = dia(ev.ts || Date.now());
    if (par && par.s >= this.limiar && !velhoErrado) {
      const velho = this.q.item.get(par.id);
      const quem = json(velho.confirmadores, []);
      quem.push({ quem: autor, ts: ev.ts || Date.now(), evento: ev.id });
      this.q.confirmar.run(JSON.stringify(quem.slice(-200)), ev.ts || Date.now(), par.id);
      this.q.fundir.run('apr:' + ev.id, texto, 'semelhança ' + par.s.toFixed(3) + ' com ' + (velho.cartao || par.id) + ' (' + (origem || 'sem origem') + ')', data, autor,
        velho.tags, JSON.stringify([ev.id]), velho.cartao || par.id, data, par.id, ev.ts || Date.now());
      this.agendarGerar();
      return { item: par.id, novo: false, semelhanca: par.s };
    }
    const id = 'apr:' + ev.id;
    this.gravar({ id, tipo: 'aprendizado', titulo: umaLinha(texto, 120), texto, autor, dono: ev.autor, criado: ev.ts || Date.now(),
      origem: { evento: ev.id, de: origem || '' }, prova: 'aprendido por ' + this.nome(autor) + (origem ? ' (' + origem + ')' : '') + ' em ' + data });
    if (velhoErrado) { this.q.superar.run(velhoErrado.id, id, autor, ev.ts || Date.now()); this.agendarGerar(); }
    return { item: id, novo: true, semelhanca: par ? par.s : 0, corrigiu: velhoErrado ? velhoErrado.id : null };
  }

  parecido(texto) {
    const v = vetor(texto);
    let melhor = null;
    for (const r of this.q.aprendizadosVet.all()) {
      const s = cosseno(v, vetorDeBlob(r.v));
      if (!melhor || s > melhor.s) melhor = { id: r.id, s };
    }
    return melhor;
  }

  /* API do aprendizado (MCP coop_aprendi, POST /api/acervo/aprendi): vai para o diário (histórico cru, replica para a equipe
     e a tela mostra) e o acervo aplica o mesmo evento. Devolve {novo, item, confirmacoes, texto, cartao}. */
  aprendi(texto, autor, origem, corrige) {
    texto = umaLinha(texto, 2000);
    if (texto.length < 8) throw new Error('escreva o aprendizado numa frase (8 letras ou mais)');
    let ev;
    const args = corrige ? [texto, origem || '', true, String(corrige).slice(0, 60)] : [texto, origem || '', true];
    if (typeof this.o.anexar === 'function') ev = this.o.anexar(autor || this.eu(), 'aprendizado', args);
    if (!ev || !ev.id) ev = { id: 'local:' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex'), autor: this.eu(), quem: autor || this.eu(), ts: Date.now(), acao: 'aprendizado', args };
    const r = this.evento(ev) || {};
    const it = r.item ? this.q.item.get(r.item) : null;
    /* o evento já pode ter sido aplicado pelo diário (anexar avisa o acervo): quem foi corrigido está em superados */
    const sup = r.item ? this.db.prepare('SELECT item FROM superados WHERE por = ?').get(r.item) : null;
    return { novo: !!r.novo, corrigiu: r.corrigiu || (sup && sup.item) || null, item: r.item || null, cartao: it ? it.cartao : null, texto: it ? it.texto : texto, autor: it ? this.nome(it.autor) : this.nome(autor), confirmacoes: it ? it.confirmacoes : 0, usos: it ? it.usos : 0, evento: ev.id };
  }

  /* resultado de um agente (Stop): só a SAÍDA (texto final e arquivos mexidos), nunca o que a pessoa digitou */
  terminal(r, opcoes) {
    if (!r) return null;
    const ts = +r.ts || Date.now();
    const texto = String(r.texto || '');
    const arquivos = (Array.isArray(r.arquivos) ? r.arquivos : []).filter((c) => typeof c === 'string').slice(0, 50);
    if (!texto.trim() && !arquivos.length) return null;
    const reg = { id: r.id || ('ter:' + String(r.sessao || 'sessao').slice(0, 48) + ':' + ts), sessao: String(r.sessao || '').slice(0, 48), agente: umaLinha(r.agente, 60), autor: r.autor || this.eu(), dono: r.dono || this.eu(), texto, arquivos, ts };
    if (!opcoes || opcoes.cru !== false) this.anexarCru('terminal.jsonl', reg);
    const pasta = this.pasta();
    const rels = arquivos.map((c) => (path.isAbsolute(c) ? (pasta && c.startsWith(pasta + path.sep) ? path.relative(pasta, c) : null) : c)).filter(Boolean).map((c) => c.replace(/\\/g, '/'));
    this.gravar({ id: reg.id, tipo: 'terminal', titulo: 'Resultado · ' + (reg.agente || 'agente') + ' · ' + dia(ts) + ' ' + hora(ts), texto: texto + (arquivos.length ? '\nArquivos: ' + arquivos.join(', ') : ''),
      autor: reg.autor, dono: reg.dono, criado: ts, origem: { terminal: reg.sessao, agente: reg.agente }, fontes: rels.map((c) => 'arq:' + reg.dono + '/' + c),
      prova: 'saída do agente ' + (reg.agente || '') + ' na sessão ' + reg.sessao + (arquivos.length ? ' · ' + arquivos.length + ' arquivo(s)' : '') });
    return reg;
  }

  /* ---------- a pasta compartilhada: inventário + texto ---------- */
  arquivoMudou() {
    clearTimeout(this.tVarrer);
    this.tVarrer = setTimeout(() => { try { this.varrer(); } catch (e) { /* a pasta pode sumir no meio */ } }, +this.o.tempoVarrer || 400);
    if (this.tVarrer.unref) this.tVarrer.unref();
  }

  varrer() {
    const pasta = this.pasta(), dono = this.eu();
    if (!pasta || !fs.existsSync(pasta)) return { vistos: 0, mudaram: 0, sairam: 0 };
    const vistos = new Set();
    let mudaram = 0, sairam = 0;
    const andar = (dir, rel) => {
      let its = []; try { its = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
      for (const it of its) {
        if (IGNORADOS.test(it.name) || it.isSymbolicLink()) continue;
        const r = rel ? rel + '/' + it.name : it.name;
        if (it.isDirectory()) { andar(path.join(dir, it.name), r); continue; }
        if (!it.isFile() || (!rel && GERADOS.has(it.name))) continue;
        const caminho = dono + '/' + r;
        vistos.add(caminho);
        try { if (this.indexarArquivo(path.join(dir, it.name), r, caminho)) mudaram++; } catch (e) { /* arquivo sumiu no meio */ }
      }
    };
    this.tx(() => {
      andar(pasta, '');
      this.db.prepare('SELECT caminho, item FROM inventario').all().forEach((x) => {
        if (vistos.has(x.caminho) || !x.caminho.startsWith(dono + '/')) return;
        this.q.invDel.run(x.caminho); if (x.item) this.apagar(x.item); sairam++;
      });
    });
    if (mudaram || sairam) this.agendarGerar();
    return { vistos: vistos.size, mudaram, sairam };
  }

  indexarArquivo(abs, rel, caminho) {
    const st = fs.statSync(abs);
    const ext = (path.extname(rel).slice(1) || '').toLowerCase();
    const velho = this.q.inv.get(caminho);
    const mtime = Math.round(st.mtimeMs);
    if (velho && velho.bytes === st.size && velho.mtime === mtime) return false;
    const buf = st.size <= 20 * 1024 * 1024 ? fs.readFileSync(abs) : null;
    const hash = buf ? sha1(buf) : sha1(st.size + ':' + mtime);
    if (velho && velho.hash === hash) { this.q.invSet.run(caminho, ext, st.size, mtime, hash, velho.item); return false; }
    const nome = path.basename(rel);
    const clone = /(^|\/)Clones\//i.test(rel);
    let tipo = ext === 'mapa' ? 'mapa' : ext === 'quadro' ? 'quadro' : clone ? 'clone' : /(^|\/)Reuni(õ|o)es\//i.test(rel) ? 'ata' : 'arquivo';
    let texto = null, titulo = nome;
    const codigo = ext === 'js' || ext === 'css';
    if (buf && TEXTO_EXT[ext] && st.size <= MAX_ARQUIVO && !(codigo && (st.size > MAX_CODIGO || clone))) {
      texto = buf.toString('utf8');
      if (ext === 'html' || ext === 'htm') { const t = texto.match(/<title[^>]*>([\s\S]*?)<\/title>/i); if (t) titulo = umaLinha(textoDeHtml(t[1]), 120) || nome; texto = textoDeHtml(texto); }
      if (ext === 'md') { const h = texto.match(/^#\s+(.+)$/m); if (h) titulo = umaLinha(h[1], 120); }
    } else if (ext === 'pdf' || (TEXTO_EXT[ext] && !clone)) {
      texto = nome.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' '); /* PDFs (e texto grande demais) por ora: só o nome */
    }
    let itemId = null;
    if (texto != null) {
      itemId = 'arq:' + caminho;
      /* um arquivo de agente (resultado de terminal) já liga a ele pela fonte; o autor do arquivo é o dono da pasta */
      this.gravar({ id: itemId, tipo, titulo, texto: rel + '\n' + texto, autor: this.eu(), dono: this.eu(), criado: velho ? undefined : mtime, atualizado: mtime,
        origem: { caminho }, cartao: tipo === 'ata' ? undefined : false, prova: 'arquivo ' + caminho + ' · ' + st.size + ' bytes · sha1 ' + hash.slice(0, 12) });
    } else if (velho && velho.item) { this.apagar(velho.item); }
    this.q.invSet.run(caminho, ext, st.size, mtime, hash, itemId);
    return true;
  }

  /* ---------- busca ---------- */
  carregarVetores() {
    if (this.vetores) return this.vetores;
    this.vetores = new Map();
    this.db.prepare('SELECT n, v FROM vetores').all().forEach((r) => this.vetores.set(r.n, vetorDeBlob(r.v)));
    return this.vetores;
  }

  /* [{id, tipo, titulo, autor, autorId, dono, usos, confirmacoes, trecho, origem, quando, pontuacao, cartao, tags, vizinhos, rotulo}] */
  buscar(consulta, o) {
    o = o || {};
    const q = umaLinha(consulta, 300);
    if (!q) return [];
    const modo = ['palavras', 'semelhanca', 'tudo'].includes(o.modo) ? o.modo : 'tudo';
    const limite = Math.max(1, Math.min(50, +o.limite || 10));
    const qs = Array.from(new Set(termos(q))).slice(0, 12);
    const achados = new Map();
    const junta = (n, rank, campo, s) => { const x = achados.get(n) || { n, rrf: 0 }; x.rrf += 1 / (60 + rank); x[campo] = s; achados.set(n, x); };
    if (modo !== 'semelhanca' && qs.length) {
      const expr = qs.map((t) => '"' + t.replace(/"/g, '') + '"*').join(' OR ');
      try { this.q.fts.all(expr, 80).forEach((r, i) => junta(r.n, i, 'bm25', -r.s)); } catch (e) { /* expressão estranha: segue só por semelhança */ }
    }
    if (modo !== 'palavras') {
      const v = vetor(q), minimo = o.minimo == null ? 0.2 : +o.minimo;
      const lista = [];
      this.carregarVetores().forEach((vv, n) => { const s = cosseno(v, vv); if (s >= minimo) lista.push({ n, s }); });
      lista.sort((a, b) => b.s - a.s).slice(0, 80).forEach((r, i) => junta(r.n, i, 'cos', r.s));
    }
    const ordem = Array.from(achados.values()).map((x) => Object.assign(x, { it: this.q.itemN.get(x.n) })).filter((x) => x.it && (!o.tipo || x.it.tipo === o.tipo));
    ordem.sort((a, b) => b.rrf - a.rrf || (b.it.usos + b.it.confirmacoes) - (a.it.usos + a.it.confirmacoes));
    const topo = ordem.slice(0, limite);
    let contadas = 0;
    return topo.map((x) => {
      const it = x.it;
      /* conta o uso de quem consultou nos 3 primeiros que casaram de verdade (palavra, ou semelhança ≥ 0,25) */
      if (o.quem && o.contar !== false && contadas < 3 && (x.bm25 != null || (x.cos || 0) >= 0.25)) { contadas++; this.usar(it.id, o.quem); }
      const atual = this.q.item.get(it.id) || it;
      return this.publico(atual, { trecho: trechoDe(atual.texto, qs.length ? qs : termos(q)), pontuacao: Math.round(x.rrf * 100000) / 1000,
        palavras: x.bm25 != null ? +x.bm25.toPrecision(4) : null, semelhanca: x.cos != null ? Math.round(x.cos * 1000) / 1000 : null, vizinhos: this.vizinhos(it.id, 3) });
    });
  }

  publico(it, extra) {
    const origem = json(it.origem, {});
    const rotulo = ({ aprendizado: 'Aprendizado', arquivo: 'Arquivo', terminal: 'Histórico de terminal', clone: 'Clone', ata: 'Ata', demanda: 'Demanda', ideia: 'Ideia', resposta: 'Resposta', mensagem: 'Mensagem', campanha: 'Campanha', nota: 'Nota', mapa: 'Mapa', quadro: 'Quadro' }[it.tipo] || it.tipo);
    const tags = json(it.tags, []);
    const tema = tags.filter((t) => t !== it.tipo)[0] || '';
    return Object.assign({
      id: it.id, tipo: it.tipo, cartao: it.cartao || null, titulo: it.titulo, autor: this.nome(it.autor), autorId: it.autor, dono: it.dono, usos: it.usos, confirmacoes: it.confirmacoes,
      origem, quando: new Date(it.criado || 0).toISOString(), tags,
      rotulo: rotulo + ' · ' + this.nome(it.autor) + (tema ? ' · ' + tema : '') + ' · usado ' + it.usos + '×' + (it.confirmacoes ? ' · +' + it.confirmacoes + ' confirmado' : '')
    }, extra || {});
  }

  /* vizinhos no grafo: ligações explícitas (fonte, citação) primeiro, depois quem divide tags (sem contar a tag do tipo) */
  vizinhos(id, n) {
    const it = this.q.item.get(id);
    if (!it) return [];
    const fora = new Set([id]); const out = [];
    const por = (vid, tipo) => { if (fora.has(vid) || out.length >= n) return; const v = this.q.item.get(vid); if (!v) return; fora.add(vid); out.push({ id: v.id, tipo: v.tipo, titulo: v.titulo, ligacao: tipo }); };
    this.db.prepare('SELECT para AS v, tipo FROM ligacoes WHERE de = ? UNION SELECT de AS v, tipo FROM ligacoes WHERE para = ?').all(id, id).forEach((r) => por(r.v, r.tipo));
    const tags = json(it.tags, []).filter((t) => t !== it.tipo && t !== 'geral');
    if (tags.length && out.length < n) {
      const marcas = tags.map(() => '?').join(',');
      this.db.prepare('SELECT m.item AS v, COUNT(*) AS c FROM marcas m JOIN itens i ON i.id = m.item WHERE m.tag IN (' + marcas + ') AND m.item != ? GROUP BY m.item ORDER BY c DESC, i.usos DESC LIMIT ?')
        .all(...tags, id, n * 3).forEach((r) => por(r.v, 'tag'));
    }
    return out;
  }

  /* a equipe inteira: a minha busca + a das Estações ligadas (canal de pares). Dono caiu = ficha "computador desligado". */
  async buscarEquipe(consulta, o) {
    o = o || {};
    const locais = this.buscar(consulta, o);
    const pares = (typeof this.o.pares === 'function' ? this.o.pares() : []) || [];
    const fichas = [];
    const tempo = +o.tempo || 2500;
    const remotos = await Promise.all(pares.map(async (p) => {
      if (!p || !p.id) return [];
      const ficha = (motivo) => fichas.push({ ficha: true, dono: p.id, nome: p.nome || p.id, desligado: true, texto: 'computador de ' + (p.nome || p.id) + ' ' + motivo + ': o que está lá não entrou nesta busca' });
      if (!p.ligado || typeof p.perguntar !== 'function') { ficha('desligado'); return []; }
      try {
        const lista = await Promise.race([p.perguntar(consulta, { modo: o.modo, limite: o.limite }), new Promise((ok, erro) => { const t = setTimeout(() => erro(new Error('tempo')), tempo); if (t.unref) t.unref(); })]);
        return (Array.isArray(lista) ? lista : []).slice(0, 20).map((x) => limparRemoto(x, p)).filter(Boolean);
      } catch (e) { ficha('não respondeu'); return []; }
    }));
    const todos = locais.map((x) => Object.assign(x, { remoto: false })).concat(...remotos);
    todos.sort((a, b) => (b.pontuacao || 0) - (a.pontuacao || 0));
    return { termo: umaLinha(consulta, 300), modo: o.modo || 'tudo', resultados: todos.slice(0, Math.max(1, Math.min(50, +o.limite || 10) * (1 + pares.length))), fichas };
  }

  /* um item inteiro (coop_ler, GET /api/acervo/item): pelo id ou pelo caminho de arquivo; arquivo lê do disco (texto inteiro) */
  ler(ref, o) {
    o = o || {};
    ref = String(ref || '').trim();
    if (!ref) return null;
    const eu = this.eu();
    let it = this.q.item.get(ref) || this.q.item.get('arq:' + ref) || this.q.item.get('arq:' + eu + '/' + ref.replace(/^\/+/, ''));
    if (!it) it = this.db.prepare('SELECT * FROM itens WHERE cartao = ?').get(ref);
    if (!it) return null;
    if (o.quem) this.usar(it.id, o.quem);
    it = this.q.item.get(it.id);
    let texto = it.texto;
    const origem = json(it.origem, {});
    if (origem.caminho && origem.caminho.startsWith(eu + '/')) {
      const abs = path.join(this.pasta() || '', origem.caminho.slice(eu.length + 1));
      try { const st = fs.statSync(abs); if (st.size <= MAX_ARQUIVO && TEXTO_EXT[path.extname(abs).slice(1).toLowerCase()]) texto = fs.readFileSync(abs, 'utf8'); } catch (e) { /* ficou o do índice */ }
    }
    return this.publico(it, { texto, prova: it.prova, vizinhos: this.vizinhos(it.id, 5) });
  }

  /* +1 uso: uma vez por pessoa por hora por item; o autor não infla o próprio */
  usar(id, quem, ts) {
    ts = +ts || Date.now();
    const it = this.q.item.get(id);
    if (!it || !quem || quem === it.autor) return false;
    const r = this.q.uso.run(id, String(quem).slice(0, 64), Math.floor(ts / 3600000));
    if (!r.changes) return false;
    this.q.usoMais.run(id);
    this.anexarCru('usos.jsonl', { item: id, quem, ts });
    if (it.tipo === 'aprendizado') this.agendarGerar();
    return true;
  }

  aprendizados(limite, ordem) {
    const sql = ordem === 'confirmados' ? 'confirmacoes DESC, usos DESC' : 'usos DESC, confirmacoes DESC';
    return this.db.prepare("SELECT * FROM itens WHERE tipo = 'aprendizado' AND id NOT IN (SELECT item FROM superados) ORDER BY " + sql + ', criado DESC LIMIT ?').all(Math.max(1, Math.min(500, +limite || 20))).map((it) => this.publico(it, { texto: it.texto }));
  }

  /* o agente nasce sabendo (agentes.js): uma linha curta com os mais usados */
  resumoParaAgente(n) {
    const total = this.db.prepare("SELECT COUNT(*) AS c FROM itens WHERE tipo = 'aprendizado' AND id NOT IN (SELECT item FROM superados)").get().c;
    const itens = this.db.prepare('SELECT COUNT(*) AS c FROM itens').get().c;
    const top = this.aprendizados(n || 20);
    const partes = ['Já li ' + total + ' coisa' + (total === 1 ? '' : 's') + ' que a equipe aprendeu (o acervo tem ' + itens + ' itens).'];
    if (top.length) partes.push('Os mais usados: ' + top.map((a, i) => (i + 1) + ') ' + umaLinha(a.texto, 150) + ' (' + a.autor + ', usado ' + a.usos + '×' + (a.confirmacoes ? ', +' + a.confirmacoes + ' confirmado' : '') + ')').join('; ') + '.');
    partes.unshift('Antes de finalizar, registre cada conhecimento novo e reutilizável com coop_aprendi, incluindo a evidência e os limites. Consulte coop_buscar para evitar duplicação; hipóteses devem ser identificadas como hipóteses. A resposta final pública fica integralmente no acervo para consulta pela IA futura.');
    partes.push('Antes de responder, consulte o acervo com a ferramenta coop_buscar e leia APRENDIZADOS.md; ao aprender algo, registre com coop_aprendi (e cite quem ensinou ao usar); se um aprendizado estiver errado, registre o certo com coop_aprendi e corrige: <cartão>.');
    return umaLinha(partes.join(' '), 3000);
  }

  estatisticas() {
    const g = (sql) => this.db.prepare(sql).get();
    const porTipo = {};
    this.db.prepare('SELECT tipo, COUNT(*) AS c FROM itens GROUP BY tipo').all().forEach((r) => { porTipo[r.tipo] = r.c; });
    let bytes = 0; try { bytes = fs.statSync(this.arquivo).size; } catch (e) { /* ok */ }
    return {
      itens: g('SELECT COUNT(*) AS c FROM itens').c, porTipo, cartoes: g('SELECT COUNT(*) AS c FROM itens WHERE cartao IS NOT NULL').c,
      fundidos: g('SELECT COUNT(*) AS c FROM fundidos').c, confirmacoes: g('SELECT COALESCE(SUM(confirmacoes),0) AS c FROM itens').c,
      usos: g('SELECT COALESCE(SUM(usos),0) AS c FROM itens').c, ligacoes: g('SELECT COUNT(*) AS c FROM ligacoes').c, tags: g('SELECT COUNT(DISTINCT tag) AS c FROM marcas').c,
      inventario: Object.assign({}, g('SELECT COUNT(*) AS arquivos, COALESCE(SUM(bytes),0) AS bytes FROM inventario')),
      vetores: { dimensoes: DIMS, total: g('SELECT COUNT(*) AS c FROM vetores').c }, limiar: this.limiar, sqlite: { caminho: this.arquivo, bytes }
    };
  }

  /* JSONL de um dia (a IA do Theus lê): eventos do diário, itens criados no dia (aprendizados, ideias, histórico de terminal…) e fundidos */
  exportar(diaPedido) {
    const d = /^\d{4}-\d{2}-\d{2}$/.test(String(diaPedido || '')) ? diaPedido : dia(Date.now());
    const [a, m, dd] = d.split('-').map(Number);
    const ini = new Date(a, m - 1, dd).getTime(), fim = new Date(a, m - 1, dd + 1).getTime();
    const linhas = [];
    ((this.o.eventos ? this.o.eventos() : []) || []).filter((e) => e.ts >= ini && e.ts < fim).forEach((e) => linhas.push(Object.assign({ registro: 'evento' }, e)));
    this.db.prepare("SELECT * FROM itens WHERE criado >= ? AND criado < ? AND tipo NOT IN ('arquivo', 'clone') ORDER BY criado").all(ini, fim).forEach((it) => linhas.push({
      registro: it.tipo, id: it.id, cartao: it.cartao, titulo: it.titulo, texto: it.texto, autor: it.autor, autorNome: this.nome(it.autor), dono: it.dono, origem: json(it.origem, {}),
      criado: new Date(it.criado).toISOString(), usos: it.usos, confirmacoes: it.confirmacoes, tags: json(it.tags, [])
    }));
    this.db.prepare('SELECT * FROM fundidos WHERE ts >= ? AND ts < ? ORDER BY ts').all(ini, fim).forEach((f) => linhas.push(Object.assign({ registro: 'fundido' }, this.fundidoPublico(f))));
    return { dia: d, linhas: linhas.length, jsonl: linhas.map((l) => JSON.stringify(l)).join('\n') + (linhas.length ? '\n' : '') };
  }

  cartoes() {
    return this.db.prepare('SELECT * FROM itens WHERE cartao IS NOT NULL ORDER BY criado').all().map((it) => ({
      id: it.cartao, afirmacao: primeiraFrase(it.texto) || it.titulo, prova: it.prova || '', data: dia(it.criado), autor: this.nome(it.autor), tags: json(it.tags, []),
      fontes: fontesDe(json(it.origem, {})), item: it.id, tipo: it.tipo, usos: it.usos, confirmacoes: it.confirmacoes
    }));
  }
  fundidoPublico(f) { return { id: f.id, afirmacao: f.afirmacao, prova: f.prova, data: f.data, autor: this.nome(f.autor), tags: json(f.tags, []), fontes: json(f.fontes, []), fundido_em: f.fundido_em, fundido_data: f.fundido_data }; }

  /* ---------- o que a LLM lê de uma vez (e): ACERVO.md, APRENDIZADOS.md, CLAUDE.md e os JSONL ---------- */
  agendarGerar() {
    this.pendenteGerar = true;
    if (this.tGerar) return;
    this.tGerar = setTimeout(() => { this.tGerar = null; try { this.gerarArquivos(); } catch (e) { /* a pasta pode estar sumindo */ } }, +this.o.tempoGerar || 800);
    if (this.tGerar.unref) this.tGerar.unref();
  }

  escrever(f, conteudo) {
    let atual = null; try { atual = fs.readFileSync(f, 'utf8'); } catch (e) { atual = null; }
    if (atual === conteudo) return false;
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, conteudo);
    return true;
  }

  gerarArquivos() {
    this.pendenteGerar = false;
    const pasta = this.pasta();
    const hoje = dia(Date.now());
    const eu = this.eu();
    const escritos = [];
    /* APRENDIZADOS.md: os da equipe, mais confirmados e mais usados primeiro */
    const aps = this.aprendizados(500, 'confirmados');
    const apMd = ['# Aprendizados da equipe', '',
      '<!-- gerado pelo babel-coop a partir do acervo (' + hoje + '); não edite: registre com coop_aprendi ou pelo app -->', '',
      aps.length + ' aprendizado' + (aps.length === 1 ? '' : 's') + ', os mais confirmados e mais usados primeiro. Ao usar um, cite quem ensinou.', ''];
    aps.forEach((a) => apMd.push('- **' + umaLinha(a.texto, 400) + '** — ' + a.autor + (a.origem && a.origem.de ? ' · ' + umaLinha(a.origem.de, 60) : '') + ' · ' + a.quando.slice(0, 10) +
      ' · confirmado ' + (a.confirmacoes + 1) + '× · usado ' + a.usos + '×' + (a.cartao ? ' · `' + a.cartao + '`' : '')));
    if (pasta) { if (this.escrever(path.join(pasta, 'APRENDIZADOS.md'), apMd.join('\n') + '\n')) escritos.push('APRENDIZADOS.md'); }
    /* ACERVO.md: linha do tempo por data + temas por tag */
    const st = this.estatisticas();
    const recentes = this.db.prepare('SELECT * FROM itens ORDER BY criado DESC LIMIT 150').all();
    const md = ['# Acervo de ' + this.nome(eu) + ' · índice para a IA', '',
      '<!-- gerado pelo babel-coop do histórico cru (diário, saída dos terminais, arquivos); cache refeito com `node servidor/acervo.js --reconstruir` -->', '',
      st.itens + ' itens · ' + st.cartoes + ' cartões · ' + st.fundidos + ' fundidos (+1 confirmado) · ' + st.inventario.arquivos + ' arquivos no inventário · atualizado em ' + hoje + '.',
      'Busque com a ferramenta `coop_buscar` (palavras + semelhança, a equipe inteira); leia um item com `coop_ler`. Aprendizados: `APRENDIZADOS.md`.',
      'Em JSONL (para outra IA): `../.coop/acervo/cartoes.jsonl`, `fundidos.jsonl`, `inventario.jsonl`; por dia: GET /api/acervo/exportar?dia=AAAA-MM-DD.', '', '## Linha do tempo'];
    let diaAtual = null;
    recentes.forEach((it) => {
      const d = dia(it.criado);
      if (d !== diaAtual) { md.push('', '### ' + d); diaAtual = d; }
      md.push('- ' + hora(it.criado) + ' · ' + (it.cartao ? '`' + it.cartao + '` · ' : '') + it.tipo + ' · ' + umaLinha(it.titulo, 120) + ' — ' + this.nome(it.autor) + (it.usos ? ' · usado ' + it.usos + '×' : ''));
    });
    md.push('', '## Temas');
    this.db.prepare("SELECT m.tag, COUNT(*) AS c FROM marcas m WHERE m.tag NOT IN ('" + TIPOS.join("','") + "', 'geral') GROUP BY m.tag HAVING c >= 2 ORDER BY c DESC, m.tag LIMIT 40").all().forEach((t) => {
      const refs = this.db.prepare('SELECT i.cartao, i.titulo FROM marcas m JOIN itens i ON i.id = m.item WHERE m.tag = ? ORDER BY i.usos DESC, i.criado DESC LIMIT 6').all(t.tag)
        .map((i) => i.cartao ? '`' + i.cartao + '`' : umaLinha(i.titulo, 50));
      md.push('- **' + t.tag + '** (' + t.c + '): ' + refs.join(', '));
    });
    if (pasta) { if (this.escrever(path.join(pasta, 'ACERVO.md'), md.join('\n') + '\n')) escritos.push('ACERVO.md'); }
    if (pasta && this.garantirClaudeMd()) escritos.push('CLAUDE.md');
    /* JSONL (substrato para a IA do Theus) */
    const jsonl = (lista) => lista.map((x) => JSON.stringify(x)).join('\n') + (lista.length ? '\n' : '');
    if (this.escrever(path.join(this.dirExport, 'cartoes.jsonl'), jsonl(this.cartoes()))) escritos.push('cartoes.jsonl');
    if (this.escrever(path.join(this.dirExport, 'fundidos.jsonl'), jsonl(this.db.prepare('SELECT * FROM fundidos ORDER BY ts').all().map((f) => this.fundidoPublico(f))))) escritos.push('fundidos.jsonl');
    if (this.escrever(path.join(this.dirExport, 'inventario.jsonl'), jsonl(this.q.invTodos.all().map((i) => ({ caminho: i.caminho, ext: i.ext, bytes: i.bytes, mtime: new Date(i.mtime).toISOString(), hash: i.hash, tem_texto: !!i.item, item: i.item }))))) escritos.push('inventario.jsonl');
    return escritos;
  }

  /* CLAUDE.md da pasta: cria se não existe; se existe, mantém só o bloco marcado (o resto é da pessoa) */
  garantirClaudeMd() {
    const f = path.join(this.pasta(), 'CLAUDE.md');
    const bloco = [BLOCO_INI, '## Acervo da equipe (babel-coop)',
      '- Antes de responder, consulte o acervo com a ferramenta `coop_buscar` e leia `APRENDIZADOS.md` (nesta pasta).',
      '- Ao aprender algo, registre com `coop_aprendi` (se a equipe já sabia, vira "+1 confirmado"). Ao usar o que alguém ensinou, cite quem.',
      '- Antes de finalizar, registre cada conhecimento novo e reutilizável com sua evidência e seus limites; identifique hipóteses. A resposta final pública fica integralmente no acervo para a IA futura, consultável por `coop_buscar` e `coop_ler`.',
      '- Um item inteiro: `coop_ler`. Os mais usados: `coop_aprendizados`. O índice do acervo (linha do tempo e temas): `ACERVO.md`.', BLOCO_FIM].join('\n');
    let atual = null; try { atual = fs.readFileSync(f, 'utf8'); } catch (e) { atual = null; }
    let novo;
    if (atual == null) novo = '# ' + this.nome(this.eu()) + ' · instruções para o agente\n\n' + bloco + '\n';
    else {
      const i = atual.indexOf(BLOCO_INI), j = atual.indexOf(BLOCO_FIM);
      novo = i !== -1 && j > i ? atual.slice(0, i) + bloco + atual.slice(j + BLOCO_FIM.length) : atual.replace(/\s*$/, '') + '\n\n' + bloco + '\n';
    }
    if (novo === atual) return false;
    fs.writeFileSync(f, novo);
    return true;
  }
}

function fontesDe(origem) {
  const f = [];
  if (origem.caminho) f.push(origem.caminho);
  if (origem.evento) f.push('evento:' + origem.evento);
  if (origem.terminal) f.push('terminal:' + origem.terminal);
  if (origem.demanda) f.push('demanda:' + origem.demanda);
  return f;
}

/* o que vem de outra Estação: só campos conhecidos; o dono é sempre o par que respondeu */
function limparRemoto(x, par) {
  if (!x || typeof x !== 'object') return null;
  const s = (v, m) => (typeof v === 'string' ? v.slice(0, m) : '');
  return {
    id: s(x.id, 300), tipo: TIPOS.includes(x.tipo) ? x.tipo : 'nota', cartao: s(x.cartao, 20) || null, titulo: s(x.titulo, 200), autor: s(x.autor, 80), autorId: s(x.autorId, 64),
    dono: par.id, donoNome: par.nome || par.id, usos: +x.usos || 0, confirmacoes: +x.confirmacoes || 0, trecho: s(x.trecho, 400), quando: s(x.quando, 40),
    pontuacao: +x.pontuacao || 0, rotulo: s(x.rotulo, 200), tags: Array.isArray(x.tags) ? x.tags.slice(0, 5).map((t) => s(t, 40)) : [], remoto: true
  };
}

module.exports = { Acervo, vetor, cosseno, normalizar, termos, tagsDe, trechoDe, limparRemoto, DIMS, LIMIAR, BLOCO_INI, BLOCO_FIM };

/* `node servidor/acervo.js --reconstruir` (ou --estatisticas): refaz o cache do zero a partir do histórico cru */
if (require.main === module) {
  const config = require('./config');
  const { Diario } = require('./diario');
  const cfg = config.carregar();
  const diario = new Diario(cfg.diario, cfg.id);
  const ac = new Acervo({ raiz: cfg.raiz, pasta: cfg.pasta, eu: cfg.id, nomeDe: (id) => (id === cfg.id ? cfg.nome : id), eventos: () => diario.todos() });
  const r = process.argv.includes('--reconstruir') ? ac.reconstruir() : null;
  console.log(JSON.stringify({ reconstruido: r, estatisticas: ac.estatisticas() }, null, 2));
  ac.fechar();
}
