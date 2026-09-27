/* babel-coop · entrar na equipe sem copiar nada (o token vira plano B)
   - A Estação nova (sem equipe) escuta os anúncios UDP da rede (rede.js): a gestão anuncia { equipe, nome, porta, entrada: 1 }, nunca segredo.
     Anúncio não prova nada (qualquer um no Wi-Fi forja): quem prova é o código de 4 dígitos que as DUAS pessoas conferem.
   - Pedido em duas voltas (compromisso e revelação, como no pareamento por comparação numérica do Bluetooth):
     1. a nova gera um par X25519 efêmero e um sorteio nN, e manda POST /api/entrar/pedido { nome, chavePublica, compromisso = H(chave, nN) };
        a gestão responde { id, segredo, nonce nG, publicaEquipe } sem ter visto nN;
     2. a nova revela nN (POST /api/entrar/pedido/<id>/revelar); a gestão confere o compromisso.
     Código = H(id, chave do pedido em DER, publicaEquipe, nG, nN) → 4 dígitos. Quem estiver no meio fixa o lado dele antes de ver o sorteio
     do outro: não dá para moer um código igual (acerta 1 em 10.000 por tentativa, e cada tentativa aparece na tela das pessoas).
   - É a única rota que aceita quem ainda não tem carteira: limite de 5 pedidos abertos, 1 por endereço a cada 10 s, validade 10 min, nome até 40,
     nome de quem já está na equipe recusado.
   - Aceitar gera o token como o Convidar (papel membro) e o guarda cifrado para a chave do pedido (ECDH X25519 + HKDF + AES-256-GCM).
   - A nova pergunta GET /api/entrar/pedido/<id> (segredo no cabeçalho X-Coop-Pedido) até vir aceito ou recusado. Só usa o token
     (o mesmo caminho do /api/token) depois que a pessoa tocou em "O código bateu" e se o token é da equipe cuja chave entrou no código.
   Só node:crypto.
*/
'use strict';
const crypto = require('crypto');
const dgram = require('dgram');
const http = require('http');
const net = require('net');
const token = require('./token');

const VALIDADE = 10 * 60 * 1000;   /* pedido aberto (ou aceito e ainda não buscado) vale 10 min */
const MAX_ABERTOS = 5;
const INTERVALO = 10 * 1000;       /* 1 pedido por endereço a cada 10 s */
const NOME_MAX = 40;
const CORPO_MAX = 4096;             /* rota aberta à rede: corpo pequeno */
const VISTO = 60 * 1000;            /* anúncio da gestão ouvido há até 60 s ainda vale para pedir */
const RECENTE = 7000;               /* e há até 7 s aparece na tela como "achei" */
const MAX_OUVIDAS = 16;             /* anúncios guardados (um vizinho que inunda a rede não enche a memória) */
const PERGUNTA = 1500;              /* a Estação nova pergunta à gestão a cada 1,5 s */
const INFO = Buffer.from('babel-coop/entrada/v2');
const NONCE = /^[A-Za-z0-9_-]{22}$/; /* 16 bytes em base64url */
const HASH = /^[A-Za-z0-9_-]{43}$/;  /* sha256 em base64url */

/* ---------- chaves, compromisso, código e selo ---------- */
function novaChave() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519');
  return { publica: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'), privada: privateKey };
}
/* chave pública do pedido: base64 canônico de um DER SPKI X25519 canônico. Outra grafia da mesma chave (quebra de linha, espaço) é recusada */
function derX(b64) {
  if (typeof b64 !== 'string' || !b64 || b64.length > 200) throw falha(400, 'chave pública inválida');
  const der = Buffer.from(b64, 'base64');
  if (der.toString('base64') !== b64) throw falha(400, 'chave pública inválida');
  let k;
  try { k = crypto.createPublicKey({ key: der, format: 'der', type: 'spki' }); } catch (e) { throw falha(400, 'chave pública inválida'); }
  if (k.asymmetricKeyType !== 'x25519' || !k.export({ type: 'spki', format: 'der' }).equals(der)) throw falha(400, 'chave pública inválida');
  return { der, k };
}
const chaveX = (b64) => derX(b64).k;
function nonceOk(n) { return typeof n === 'string' && NONCE.test(n) && Buffer.from(n, 'base64url').toString('base64url') === n; }
const novoNonce = () => crypto.randomBytes(16).toString('base64url');
/* resumo com cada parte prefixada pelo tamanho: nenhuma parte "vaza" para a vizinha */
function resumo(rotulo, partes) {
  const h = crypto.createHash('sha256').update(rotulo);
  partes.forEach((p) => { const b = Buffer.isBuffer(p) ? p : Buffer.from(String(p), 'utf8'); const n = Buffer.alloc(4); n.writeUInt32BE(b.length); h.update(n).update(b); });
  return h.digest();
}
/* o compromisso da nova com o sorteio dela, feito antes de ver o sorteio da gestão */
function compromisso(publica, nonceNova) {
  if (!nonceOk(nonceNova)) throw falha(400, 'sorteio inválido');
  return resumo('babel-coop/entrada/v2/compromisso', [derX(publica).der, Buffer.from(nonceNova, 'base64url')]).toString('base64url');
}
/* o código que os dois lados mostram: depende das duas partes (a chave do pedido, a chave da equipe e os dois sorteios) */
function codigo({ id, publica, publicaEquipe, nonceGestao, nonceNova }) {
  if (!nonceOk(nonceGestao) || !nonceOk(nonceNova)) throw falha(400, 'sorteio inválido');
  if (typeof publicaEquipe !== 'string' || !publicaEquipe) throw falha(400, 'faltou a chave da equipe');
  const h = resumo('babel-coop/entrada/v2/codigo', [String(id), derX(publica).der, publicaEquipe, Buffer.from(nonceGestao, 'base64url'), Buffer.from(nonceNova, 'base64url')]);
  return String(h.readUInt32BE(0) % 10000).padStart(4, '0');
}
function chaveDeSelo(privada, publicaOutro, id) {
  const s = crypto.diffieHellman({ privateKey: privada, publicKey: chaveX(publicaOutro) });
  return Buffer.from(crypto.hkdfSync('sha256', s, Buffer.from(String(id)), INFO, 32));
}
/* cifra para a chave do pedido: só quem tem a privada efêmera do pedido abre */
function cifrar(texto, publicaPedido, id) {
  const minha = novaChave();
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', chaveDeSelo(minha.privada, publicaPedido, id), iv);
  c.setAAD(Buffer.from(String(id)));
  const dados = Buffer.concat([c.update(String(texto), 'utf8'), c.final()]);
  return { efemera: minha.publica, iv: iv.toString('base64'), dados: dados.toString('base64'), tag: c.getAuthTag().toString('base64') };
}
function decifrar(cif, privada, id) {
  if (!cif || typeof cif !== 'object') throw new Error('nada cifrado');
  const d = crypto.createDecipheriv('aes-256-gcm', chaveDeSelo(privada, cif.efemera, id), Buffer.from(String(cif.iv), 'base64'));
  d.setAAD(Buffer.from(String(id)));
  d.setAuthTag(Buffer.from(String(cif.tag), 'base64'));
  return Buffer.concat([d.update(Buffer.from(String(cif.dados), 'base64')), d.final()]).toString('utf8');
}
const hash = (s) => crypto.createHash('sha256').update(String(s)).digest();
function falha(status, msg) { return Object.assign(new Error(msg), { status }); }
const comoLista = (c) => new Set(typeof c === 'function' ? c() : (c || []));

/* ---------- lado da gestão: os pedidos ---------- */
class Pedidos {
  constructor({ agora = Date.now, validade = VALIDADE, maxAbertos = MAX_ABERTOS, intervalo = INTERVALO } = {}) {
    this.agora = agora; this.validade = validade; this.maxAbertos = maxAbertos; this.intervalo = intervalo;
    this.lista = new Map();      /* id → pedido */
    this.porEndereco = new Map(); /* endereço → último pedido (ms) */
  }

  /* tira o que passou da validade; devolve true se algum pedido aberto saiu */
  limpar() {
    const t = this.agora();
    let mudou = false;
    this.lista.forEach((p, id) => { if (t >= p.expira) { if (p.estado === 'aberto') mudou = true; this.lista.delete(id); } });
    this.porEndereco.forEach((ts, end) => { if (t - ts >= this.intervalo) this.porEndereco.delete(end); });
    return mudou;
  }

  /* volta 1: nome, chave e compromisso. ctx = { meuId, publicaEquipe, conhecidos (ids de quem já está na equipe) } */
  pedir({ nome, chavePublica, compromisso: comp, endereco }, ctx) {
    ctx = ctx || {};
    this.limpar();
    nome = typeof nome === 'string' ? nome.trim().replace(/\s+/g, ' ') : '';
    if (!nome) throw falha(400, 'faltou o nome');
    if (nome.length > NOME_MAX) throw falha(400, 'nome com mais de ' + NOME_MAX + ' caracteres');
    const pessoa = token.normalizar(nome);
    if (!pessoa) throw falha(400, 'nome sem letra ou número');
    if (ctx.meuId && pessoa === ctx.meuId) throw falha(400, 'esse nome já é o da gestão');
    if (comoLista(ctx.conhecidos).has(pessoa)) throw falha(409, 'já tem alguém com o nome ' + nome + ' na equipe: peça com o nome completo');
    derX(chavePublica);
    if (typeof comp !== 'string' || !HASH.test(comp)) throw falha(400, 'faltou o compromisso do pedido');
    if (typeof ctx.publicaEquipe !== 'string' || !ctx.publicaEquipe) throw falha(403, 'esta Estação não é da gestão');
    const end = String(endereco || '?');
    const t = this.agora();
    if (this.porEndereco.has(end) && t - this.porEndereco.get(end) < this.intervalo) throw falha(429, 'espere 10 s para pedir de novo');
    const vivos = [...this.lista.values()].filter((p) => p.estado === 'aberto' || p.estado === 'aceito');
    if (vivos.filter((p) => p.estado === 'aberto').length >= this.maxAbertos) throw falha(429, 'muitos pedidos abertos: espere a gestão responder');
    if (vivos.some((p) => p.chavePublica === chavePublica)) throw falha(409, 'este pedido já foi feito');
    if (vivos.some((p) => p.pessoa === pessoa)) throw falha(409, 'já tem um pedido com o nome ' + nome + ' esperando a gestão');
    this.porEndereco.set(end, t);
    const segredo = crypto.randomBytes(24).toString('base64url');
    const pedido = { id: crypto.randomBytes(9).toString('base64url'), nome, pessoa, chavePublica, compromisso: comp, nonce: novoNonce(), publicaEquipe: ctx.publicaEquipe, nonceNova: null, codigo: null, endereco: end, criado: t, expira: t + this.validade, estado: 'aberto', cifrado: null, segredo: hash(segredo) };
    this.lista.set(pedido.id, pedido);
    return { id: pedido.id, segredo, nonce: pedido.nonce, publicaEquipe: pedido.publicaEquipe, expira: pedido.expira };
  }

  /* só com o segredo do pedido; sem ele, o pedido "não existe" */
  meu(id, segredo) {
    this.limpar();
    const p = typeof id === 'string' ? this.lista.get(id) : null;
    if (!p || typeof segredo !== 'string' || !segredo || !crypto.timingSafeEqual(p.segredo, hash(segredo))) return null;
    return p;
  }

  /* volta 2: a nova revela o sorteio; o compromisso tem de bater. Só então o pedido tem código e aparece para a gestão */
  revelar(id, segredo, nonceNova) {
    const p = this.meu(id, segredo);
    if (!p) throw falha(404, 'pedido não existe');
    if (p.codigo) { if (p.nonceNova === nonceNova) return { codigo: p.codigo }; throw falha(409, 'o sorteio deste pedido já foi revelado'); }
    if (!nonceOk(nonceNova)) throw falha(400, 'sorteio inválido');
    if (!crypto.timingSafeEqual(Buffer.from(compromisso(p.chavePublica, nonceNova)), Buffer.from(p.compromisso))) {
      this.lista.delete(p.id); /* compromisso quebrado: o pedido morre */
      throw falha(400, 'o sorteio não confere com o compromisso do pedido');
    }
    p.nonceNova = nonceNova;
    p.codigo = codigo({ id: p.id, publica: p.chavePublica, publicaEquipe: p.publicaEquipe, nonceGestao: p.nonce, nonceNova });
    return { codigo: p.codigo };
  }

  /* o que a Estação nova vê do próprio pedido */
  ver(id, segredo) {
    const p = this.meu(id, segredo);
    if (!p) return null;
    const r = { estado: p.estado, codigo: p.codigo, expira: p.expira };
    if (p.estado === 'aceito') r.cifrado = p.cifrado;
    return r;
  }

  /* a nova desistiu (cancelou ou o código não bateu): o cartão some da gestão */
  desistir(id, segredo) {
    const p = this.meu(id, segredo);
    if (!p || p.estado !== 'aberto') return null;
    p.estado = 'desistiu';
    return p;
  }

  /* aceitar: gerarToken(nome) devolve o token (como o Convidar); aqui ele só existe cifrado para a chave do pedido */
  aceitar(id, gerarToken, conhecidos) {
    this.limpar();
    const p = this.lista.get(id);
    if (!p || p.estado !== 'aberto') throw falha(404, 'pedido não existe mais');
    if (!p.codigo) throw falha(409, 'o pedido ainda não mostrou o código');
    if (comoLista(conhecidos).has(p.pessoa)) throw falha(409, 'já tem alguém com o nome ' + p.nome + ' na equipe: recuse e peça que peça com o nome completo');
    p.cifrado = cifrar(gerarToken(p.nome), p.chavePublica, p.id);
    p.estado = 'aceito';
    p.expira = this.agora() + this.validade; /* a Estação nova tem 10 min para buscar */
    return p;
  }

  recusar(id) {
    this.limpar();
    const p = this.lista.get(id);
    if (!p || p.estado !== 'aberto') throw falha(404, 'pedido não existe mais');
    p.estado = 'recusado';
    return p;
  }

  /* o que a gestão vê: só pedidos com código (revelados) */
  abertos() {
    this.limpar();
    return [...this.lista.values()].filter((p) => p.estado === 'aberto' && p.codigo).sort((a, b) => a.criado - b.criado).map((p) => ({ id: p.id, nome: p.nome, codigo: p.codigo, criado: p.criado, expira: p.expira }));
  }
}

/* ---------- HTTP entre Estações (a nova fala com a gestão) ---------- */
function pedirHttp(host, porta, metodo, caminho, corpo, cabecalhos) {
  return new Promise((ok, erro) => {
    const dados = corpo == null ? null : Buffer.from(JSON.stringify(corpo));
    const req = http.request({ host, port: porta, method: metodo, path: caminho, timeout: 4000, headers: Object.assign({}, dados ? { 'Content-Type': 'application/json', 'Content-Length': dados.length } : {}, cabecalhos || {}) }, (res) => {
      let s = '';
      res.on('data', (c) => { s += c; if (s.length > 64 * 1024) req.destroy(); });
      res.on('end', () => { let j = null; try { j = JSON.parse(s); } catch (e) { j = null; } ok({ status: res.statusCode, json: j || {} }); });
    });
    req.on('timeout', () => req.destroy(new Error('a Estação da gestão não respondeu')));
    req.on('error', erro);
    if (dados) req.write(dados);
    req.end();
  });
}
function lerCorpo(req) {
  return new Promise((ok) => {
    let s = '', grande = false;
    req.on('data', (c) => { if (grande) return; s += c; if (s.length > CORPO_MAX) { grande = true; s = ''; } });
    req.on('end', () => { if (grande) return ok(null); try { const j = JSON.parse(s || '{}'); ok(j && typeof j === 'object' && !Array.isArray(j) ? j : {}); } catch (e) { ok({}); } });
    req.on('error', () => ok(null));
  });
}

/* ---------- a peça que o servidor liga ----------
   opcoes: cfg() · pronto() · json(res, code, obj) · usarToken(texto) (o caminho do /api/token) · paraLocais(msg) · conhecidos() (ids da equipe) */
class Entrada {
  constructor(o) {
    this.o = o;
    this.pedidos = new Pedidos(o.limites || {});
    this.ouvidas = new Map(); /* host:porta → { id, equipe, gestao, host, porta, ts } · anúncios UDP (por endereço: um anúncio forjado não troca o da gestão) */
    this.meu = null;          /* o meu pedido, na Estação nova */
    this.relogios = new Map();
  }

  podeAceitar() { const c = this.o.cfg(); return !!(this.o.pronto() && c.papel === 'gestao' && c.privadaEquipe && c.publicaEquipe); }
  conhecidos() { return comoLista(this.o.conhecidos); }

  /* ---- Estação nova: escutar a rede antes de ter equipe ---- */
  ouvir(m, rinfo) {
    if (!m || m.coop !== 1 || m.entrada !== 1 || typeof m.id !== 'string' || !token.ID.test(m.id)) return;
    if (!(m.porta > 0 && m.porta < 65536) || typeof m.equipe !== 'string' || !rinfo || !net.isIPv4(rinfo.address)) return;
    const chave = rinfo.address + ':' + (+m.porta);
    const t = Date.now();
    if (!this.ouvidas.has(chave) && this.ouvidas.size >= MAX_OUVIDAS) {
      this.ouvidas.forEach((e, k) => { if (t - e.ts >= VISTO) this.ouvidas.delete(k); });
      if (this.ouvidas.size >= MAX_OUVIDAS) return;
    }
    this.ouvidas.set(chave, { id: m.id, equipe: String(m.equipe).slice(0, 60), gestao: typeof m.nome === 'string' ? m.nome.slice(0, 60) : m.id, host: rinfo.address, porta: +m.porta, ts: t });
  }
  escutar() {
    if (this.udp || this.o.pronto()) return;
    const cfg = this.o.cfg();
    const udp = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    this.udp = udp;
    udp.on('message', (buf, rinfo) => {
      if (buf.length > 2048) return;
      let m; try { m = JSON.parse(buf.toString()); } catch (e) { return; }
      this.ouvir(m, rinfo);
    });
    udp.on('error', (e) => { console.error('[entrada] udp ' + e.message); });
    try { udp.bind(cfg.descoberta, () => { try { udp.unref(); } catch (e) { /* ok */ } }); } catch (e) { console.error('[entrada] escuta: ' + e.message); }
  }
  calar() { if (this.udp) { try { this.udp.close(); } catch (e) { /* já fechado */ } } this.udp = null; }

  /* a tela mostra cada Estação que se diz gestão; se duas dizem ser a mesma, vão com o endereço para a pessoa perguntar */
  equipes() {
    const t = Date.now();
    const l = [...this.ouvidas.values()].filter((e) => t - e.ts < RECENTE);
    const vezes = {};
    l.forEach((e) => { const k = e.equipe + '\n' + e.gestao; vezes[k] = (vezes[k] || 0) + 1; });
    return l.map((e) => ({ chave: e.host + ':' + e.porta, equipe: e.equipe, gestao: e.gestao, endereco: e.host, repetida: vezes[e.equipe + '\n' + e.gestao] > 1 }));
  }

  estadoMeu() {
    const m = this.meu;
    if (!m) return null;
    return { estado: m.estado, codigo: m.codigo || null, nome: m.nome, equipe: m.equipe, gestao: m.gestao, confirmado: !!m.confirmado, erro: m.erro || null, expira: m.expira || null };
  }

  async pedir(b) {
    if (this.o.pronto()) throw falha(400, 'esta Estação já está numa equipe');
    if (this.meu && ['enviando', 'aberto', 'aceito', 'entrando'].includes(this.meu.estado)) throw falha(409, 'já tem um pedido esperando resposta');
    const alvo = this.ouvidas.get(String(b.chave || ''));
    if (!alvo || Date.now() - alvo.ts >= VISTO) throw falha(404, 'não acho mais essa equipe no Wi-Fi');
    const nome = typeof b.nome === 'string' ? b.nome.trim().replace(/\s+/g, ' ') : '';
    if (!nome) throw falha(400, 'Escreva seu nome.');
    if (nome.length > NOME_MAX) throw falha(400, 'Nome com até ' + NOME_MAX + ' caracteres.');
    const chave = novaChave();
    const nonceNova = novoNonce();
    const meu = { host: alvo.host, porta: alvo.porta, nome, equipe: alvo.equipe, gestao: alvo.gestao, privada: chave.privada, publica: chave.publica, estado: 'enviando', confirmado: false };
    this.meu = meu;
    const desfazer = (status, msg) => { if (this.meu === meu) this.meu = null; return falha(status, msg); };
    let r;
    try { r = await pedirHttp(alvo.host, alvo.porta, 'POST', '/api/entrar/pedido', { nome, chavePublica: chave.publica, compromisso: compromisso(chave.publica, nonceNova) }); } catch (e) { throw desfazer(502, 'a Estação de ' + alvo.gestao + ' não respondeu: ' + e.message); }
    if (r.status !== 200) throw desfazer(r.status >= 400 ? r.status : 502, r.json.erro || 'a gestão não aceitou o pedido');
    const j = r.json;
    if (typeof j.id !== 'string' || !/^[A-Za-z0-9_-]{1,32}$/.test(j.id) || typeof j.segredo !== 'string' || !nonceOk(j.nonce) || typeof j.publicaEquipe !== 'string' || !j.publicaEquipe) throw desfazer(502, 'a resposta da gestão veio incompleta');
    if (this.meu !== meu) throw falha(409, 'pedido cancelado');
    Object.assign(meu, { id: j.id, segredo: j.segredo, publicaEquipe: j.publicaEquipe, expira: +j.expira || null });
    meu.codigo = codigo({ id: j.id, publica: chave.publica, publicaEquipe: j.publicaEquipe, nonceGestao: j.nonce, nonceNova });
    /* volta 2: só agora, com o sorteio da gestão na mão, revelo o meu */
    try { r = await pedirHttp(alvo.host, alvo.porta, 'POST', '/api/entrar/pedido/' + encodeURIComponent(j.id) + '/revelar', { nonce: nonceNova }, { 'X-Coop-Pedido': j.segredo }); } catch (e) { throw desfazer(502, 'a Estação de ' + alvo.gestao + ' não respondeu: ' + e.message); }
    if (r.status !== 200) throw desfazer(r.status >= 400 ? r.status : 502, r.json.erro || 'a gestão não aceitou o pedido');
    /* o código da gestão tem de ser o calculado aqui (erro de versão ou de rede aparece já; quem prova a gestão é a pessoa conferindo) */
    if (r.json.codigo !== meu.codigo) throw desfazer(502, 'o código da gestão não bate com o deste computador: peça de novo');
    if (this.meu !== meu) throw falha(409, 'pedido cancelado');
    meu.estado = 'aberto';
    this.perguntar();
    return this.estadoMeu();
  }

  /* pergunta à gestão até vir aceito, recusado ou expirado (e para: nada roda em repouso) */
  perguntar() {
    clearTimeout(this.relogioMeu);
    const meu = this.meu;
    if (!meu || meu.estado !== 'aberto') return;
    this.relogioMeu = setTimeout(async () => {
      if (this.meu !== meu) return;
      let r = null;
      try { r = await pedirHttp(meu.host, meu.porta, 'GET', '/api/entrar/pedido/' + encodeURIComponent(meu.id), null, { 'X-Coop-Pedido': meu.segredo }); } catch (e) { r = null; /* sem resposta: tenta de novo */ }
      if (this.meu !== meu || meu.estado !== 'aberto') return;
      if (r && r.status === 404) { meu.estado = 'expirou'; return; }
      if (r && r.status === 200 && r.json.estado === 'recusado') { meu.estado = 'recusado'; return; }
      if (r && r.status === 200 && r.json.estado === 'aceito') { this.aceitoChegou(r.json.cifrado); return; }
      if (meu.expira && Date.now() > meu.expira + 5000) { meu.estado = 'expirou'; return; }
      this.perguntar();
    }, PERGUNTA);
    if (this.relogioMeu.unref) this.relogioMeu.unref();
  }

  /* o token chegou: abre, confere que é da equipe cuja chave entrou no código, e espera a pessoa confirmar o código */
  aceitoChegou(cifrado) {
    const meu = this.meu;
    if (!meu) return;
    try {
      const texto = decifrar(cifrado, meu.privada, meu.id);
      const t = token.ler(texto);
      if (t.publicaEquipe !== meu.publicaEquipe || t.equipe !== meu.equipe) throw new Error('o convite não é da equipe conferida pelo código');
      meu.texto = texto;
      meu.privada = null; meu.segredo = null;
      meu.estado = 'aceito';
      this.entrarSeConfirmado();
    } catch (e) { meu.estado = 'erro'; meu.erro = 'não consegui abrir o convite: ' + e.message; meu.privada = null; meu.segredo = null; meu.texto = null; }
  }
  entrarSeConfirmado() {
    const meu = this.meu;
    if (!meu || meu.estado !== 'aceito' || !meu.confirmado || !meu.texto) return;
    meu.estado = 'entrando';
    try { this.o.usarToken(meu.texto); meu.estado = 'dentro'; } catch (e) { meu.estado = 'erro'; meu.erro = 'não consegui entrar: ' + e.message; }
    meu.texto = null;
  }

  /* a pessoa conferiu o código com a gestão: bateu → pode entrar quando a gestão aceitar; não bateu → desiste do pedido */
  confirmar(bateu) {
    const meu = this.meu;
    if (!meu || !['aberto', 'aceito'].includes(meu.estado)) throw falha(409, 'nenhum pedido esperando a conferência do código');
    if (bateu) { meu.confirmado = true; this.entrarSeConfirmado(); return this.estadoMeu(); }
    this.desistir(meu);
    clearTimeout(this.relogioMeu);
    Object.assign(meu, { estado: 'nao-bateu', privada: null, segredo: null, texto: null });
    return this.estadoMeu();
  }
  /* avisa a gestão (se ainda der) que este pedido não vale mais */
  desistir(meu) {
    if (!meu || !meu.id || !meu.segredo || meu.estado !== 'aberto') return;
    pedirHttp(meu.host, meu.porta, 'POST', '/api/entrar/pedido/' + encodeURIComponent(meu.id) + '/desistir', {}, { 'X-Coop-Pedido': meu.segredo }).catch(() => { /* a gestão tira sozinha em 10 min */ });
  }
  cancelar() { clearTimeout(this.relogioMeu); this.desistir(this.meu); this.meu = null; }

  /* ---- gestão: avisar as telas desta máquina e tirar o pedido vencido na hora ---- */
  avisar() { this.o.paraLocais({ tipo: 'entrada-pedidos', lista: this.pedidos.abertos() }); }
  relogio(p) {
    clearTimeout(this.relogios.get(p.id));
    const t = setTimeout(() => { this.relogios.delete(p.id); if (this.pedidos.limpar()) this.avisar(); }, Math.max(0, p.expira - Date.now()) + 50);
    if (t.unref) t.unref();
    this.relogios.set(p.id, t);
  }

  /* ---- rotas /api/entrar/* ---- */
  async tratar(req, res, p, local) {
    const json = this.o.json;
    const soLocal = () => { req.resume(); return json(res, 403, { erro: 'só a própria Estação faz isto' }); };
    const erro = (e) => json(res, e.status || 400, { erro: e.message });
    const cfg = this.o.cfg();

    /* abertas à rede local: o pedido de quem ainda não tem carteira (página de navegador nunca pede por alguém: só Estação, servidor a servidor) */
    if ((p === '/api/entrar/pedido' || p.startsWith('/api/entrar/pedido/')) && req.headers.origin) { req.resume(); return json(res, 403, { erro: 'pedido de navegador recusado' }); }
    if (p === '/api/entrar/pedido' && req.method === 'POST') {
      if (!this.podeAceitar()) { req.resume(); return json(res, 403, { erro: 'esta Estação não é da gestão' }); }
      const b = await lerCorpo(req);
      if (!b) return json(res, 413, { erro: 'pedido grande demais' });
      let r;
      try { r = this.pedidos.pedir({ nome: b.nome, chavePublica: b.chavePublica, compromisso: b.compromisso, endereco: String(req.socket.remoteAddress || '').replace('::ffff:', '') }, { meuId: cfg.id, publicaEquipe: cfg.publicaEquipe, conhecidos: this.conhecidos() }); } catch (e) { return erro(e); }
      this.relogio(this.pedidos.lista.get(r.id));
      return json(res, 200, Object.assign(r, { equipe: cfg.equipe, gestao: cfg.nome }));
    }
    const doPedido = p.match(/^\/api\/entrar\/pedido\/([A-Za-z0-9_-]{1,32})(\/revelar|\/desistir)?$/);
    if (doPedido) {
      const [, id, acao] = doPedido;
      const segredo = req.headers['x-coop-pedido'];
      if (!acao && req.method === 'GET') { const r = this.pedidos.ver(id, segredo); return r ? json(res, 200, r) : json(res, 404, { erro: 'pedido não existe' }); }
      if (acao && req.method === 'POST') {
        const b = await lerCorpo(req);
        if (!b) return json(res, 413, { erro: 'pedido grande demais' });
        if (acao === '/desistir') { if (this.pedidos.desistir(id, segredo)) this.avisar(); return json(res, 200, { ok: true }); }
        try { const r = this.pedidos.revelar(id, segredo, b.nonce); this.avisar(); return json(res, 200, r); } catch (e) { return erro(e); }
      }
      req.resume();
      return json(res, 405, { erro: 'método não aceito' });
    }

    /* daqui para baixo, só a tela desta máquina */
    if (!local) return soLocal();

    /* gestão: ver, aceitar, recusar */
    if (p === '/api/entrar/pedidos' && req.method === 'GET') return json(res, 200, { lista: this.podeAceitar() ? this.pedidos.abertos() : [] });
    if ((p === '/api/entrar/aceitar' || p === '/api/entrar/recusar') && req.method === 'POST') {
      if (!this.podeAceitar()) { req.resume(); return json(res, 403, { erro: 'só a gestão aceita quem pede para entrar' }); }
      const b = await lerCorpo(req);
      const id = b && typeof b.id === 'string' ? b.id : '';
      try {
        const pedido = p === '/api/entrar/aceitar'
          ? this.pedidos.aceitar(id, (nome) => token.gerar(this.o.cfg(), { nome, papel: 'membro' }), this.conhecidos())
          : this.pedidos.recusar(id);
        this.relogio(pedido);
        this.avisar();
        return json(res, 200, { ok: true, id: pedido.id, nome: pedido.nome, estado: pedido.estado });
      } catch (e) { return erro(e); }
    }

    /* Estação nova: procurar a equipe, pedir, conferir o código, cancelar */
    if (p === '/api/entrar/procurar' && req.method === 'GET') {
      if (!this.o.pronto()) this.escutar();
      return json(res, 200, { pronto: this.o.pronto(), escutando: !!this.udp, equipes: this.o.pronto() ? [] : this.equipes(), pedido: this.estadoMeu() });
    }
    if (p === '/api/entrar/pedir' && req.method === 'POST') {
      const b = await lerCorpo(req);
      try { return json(res, 200, await this.pedir(b || {})); } catch (e) { return erro(e); }
    }
    if (p === '/api/entrar/confirmar' && req.method === 'POST') {
      const b = await lerCorpo(req);
      try { return json(res, 200, this.confirmar(!!(b && b.bateu === true))); } catch (e) { return erro(e); }
    }
    if (p === '/api/entrar/cancelar' && req.method === 'POST') { req.resume(); this.cancelar(); return json(res, 200, { ok: true }); }
    req.resume();
    return json(res, 404, { erro: 'rota de entrada desconhecida' });
  }

  parar() {
    this.calar();
    clearTimeout(this.relogioMeu);
    this.relogios.forEach((t) => clearTimeout(t));
    this.relogios.clear();
  }
}

module.exports = { Entrada, Pedidos, novaChave, novoNonce, compromisso, codigo, cifrar, decifrar, VALIDADE, MAX_ABERTOS, INTERVALO, NOME_MAX };
