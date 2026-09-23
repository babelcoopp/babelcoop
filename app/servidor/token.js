/* Babel Coop · identidade da equipe (carteira Ed25519) e token de instalação v2
   - Fundar: a primeira Estação cria o par de chaves da equipe e o do fundador, e assina a carteira dele.
   - Convite: a gestão gera o par de chaves do convidado, assina a carteira dele e entrega tudo num token
     "babel-" + base64url de { v:2, equipe, segredo, publicaEquipe, carteira, assinatura, privada, privadaEquipe?, encontro[], emitidoPor, emitido }.
   - Carteira: { v:1, equipe, id, nome, papel, chave, emitido }, assinada pela chave da equipe sobre o JSON canônico.
     É dela (e só dela) que saem id, nome e papel de quem chega pela rede.
   - Aperto de mão entre Estações: desafio (nonce + chave efêmera X25519) → ola (carteira + resposta assinada) →
     depois do ola conferido, tudo vai selado (AES-256-GCM com chaves derivadas da troca efêmera).
   Chaves: pública em base64 SPKI DER, privada em base64 PKCS8 DER. Só node:crypto.
*/
'use strict';
const crypto = require('crypto');
const os = require('os');

const ID = /^[a-z0-9][a-z0-9-]{0,47}$/;

function b64u(texto) { return Buffer.from(texto, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function deB64u(s) { return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'); }

/* o mesmo nome vira o mesmo id em todas as Estações (igual ao config.normalizar, sem depender dele) */
function normalizar(nome) {
  return String(nome || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48).replace(/-$/, '');
}

/* JSON canônico: chaves em ordem alfabética, em todos os níveis (é sobre ele que se assina) */
function canonico(v) {
  if (Array.isArray(v)) return '[' + v.map(canonico).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => JSON.stringify(k) + ':' + canonico(v[k])).join(',') + '}';
  return JSON.stringify(v);
}

/* ---------- chaves e assinaturas ---------- */
function novasChaves() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  return { publica: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'), privada: privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64') };
}
const chavePrivada = (b64) => crypto.createPrivateKey({ key: Buffer.from(String(b64), 'base64'), format: 'der', type: 'pkcs8' });
const chavePublica = (b64) => crypto.createPublicKey({ key: Buffer.from(String(b64), 'base64'), format: 'der', type: 'spki' });
function publicaDe(privada) { return crypto.createPublicKey(chavePrivada(privada)).export({ type: 'spki', format: 'der' }).toString('base64'); }
function assinar(privada, texto) { return crypto.sign(null, Buffer.from(String(texto), 'utf8'), chavePrivada(privada)).toString('base64'); }
function conferir(publica, texto, assinatura) {
  try { return crypto.verify(null, Buffer.from(String(texto), 'utf8'), chavePublica(publica), Buffer.from(String(assinatura), 'base64')); } catch (e) { return false; }
}
function iguais(a, b) { a = Buffer.from(String(a)); b = Buffer.from(String(b)); return a.length === b.length && crypto.timingSafeEqual(a, b); }

/* prova de que conheço o segredo da equipe sem mandá-lo pela rede */
function prova(segredo, id) { return crypto.createHash('sha256').update(segredo + ':' + id).digest('hex'); }
function novoSegredo() { return crypto.randomBytes(24).toString('base64url'); }

/* ---------- carteira ---------- */
function emitirCarteira(gestao, { id, nome, papel, chave }) {
  if (!gestao.privadaEquipe) throw new Error('só quem tem a chave da equipe emite carteira');
  const carteira = { v: 1, equipe: gestao.equipe, id, nome, papel: papel === 'gestao' ? 'gestao' : 'membro', chave, emitido: Date.now() };
  return { carteira, assinatura: assinar(gestao.privadaEquipe, canonico(carteira)) };
}

/* devolve null se a carteira vale, ou o motivo de não valer */
function motivoCarteira(publicaEquipe, equipe, carteira, assinatura) {
  if (!carteira || typeof carteira !== 'object' || Array.isArray(carteira)) return 'sem carteira';
  if (carteira.v !== 1 || typeof carteira.id !== 'string' || !ID.test(carteira.id) || typeof carteira.chave !== 'string' || typeof carteira.nome !== 'string') return 'carteira incompleta';
  if (carteira.papel !== 'gestao' && carteira.papel !== 'membro') return 'carteira com papel desconhecido';
  if (carteira.equipe !== equipe) return 'carteira de outra equipe';
  if (typeof assinatura !== 'string' || !conferir(publicaEquipe, canonico(carteira), assinatura)) return 'carteira não assinada pela chave da equipe';
  return null;
}

/* ---------- fundar e convidar ---------- */
function fundar(nome, equipe) {
  nome = String(nome || '').trim().slice(0, 60);
  const id = normalizar(nome);
  if (!nome || !id) throw new Error('faltou o nome');
  const daEquipe = novasChaves(), minhas = novasChaves();
  const base = { equipe: String(equipe || 'babel').slice(0, 60), privadaEquipe: daEquipe.privada };
  const { carteira, assinatura } = emitirCarteira(base, { id, nome, papel: 'gestao', chave: minhas.publica });
  return { id, nome, papel: 'gestao', equipe: base.equipe, segredo: novoSegredo(), publicaEquipe: daEquipe.publica, privadaEquipe: daEquipe.privada, privada: minhas.privada, carteira, assinatura };
}

/* Estação fundada antes da carteira (token v1, só segredo): a gestão ganha chaves novas; membro precisa de token novo */
function completarGestao(cfg) {
  const daEquipe = novasChaves(), minhas = novasChaves();
  const base = { equipe: cfg.equipe || 'babel', privadaEquipe: daEquipe.privada };
  const { carteira, assinatura } = emitirCarteira(base, { id: cfg.id, nome: cfg.nome, papel: 'gestao', chave: minhas.publica });
  return { equipe: base.equipe, publicaEquipe: daEquipe.publica, privadaEquipe: daEquipe.privada, privada: minhas.privada, carteira, assinatura };
}

/* os IPs desta máquina na rede local: é por eles que a Estação nova acha a de quem convidou */
function meusEnderecos(porta) {
  const ifs = os.networkInterfaces(), lista = [];
  Object.keys(ifs).forEach((k) => (ifs[k] || []).forEach((i) => { if (i.family === 'IPv4' && !i.internal) lista.push(i.address + ':' + porta); }));
  return lista;
}
/* sem rede nenhuma (só o loopback), o encontro é esta mesma máquina */
function enderecosDeEncontro(porta) { const l = meusEnderecos(porta); return l.length ? l : ['127.0.0.1:' + porta]; }

function gerar(cfg, convidado) {
  convidado = convidado || {};
  if (!cfg.segredo || !cfg.carteira) throw new Error('esta Estação ainda não fundou nem entrou numa equipe');
  if (cfg.papel !== 'gestao' || !cfg.privadaEquipe) throw new Error('só a gestão convida');
  const nome = String(convidado.nome || '').trim().slice(0, 60);
  const id = normalizar(convidado.id || nome);
  if (!nome || !id) throw new Error('faltou o nome');
  if (id === cfg.id) throw new Error('esse nome já é o desta Estação');
  const papel = convidado.papel === 'gestao' ? 'gestao' : 'membro';
  const chaves = novasChaves();
  const { carteira, assinatura } = emitirCarteira(cfg, { id, nome, papel, chave: chaves.publica });
  const corpo = { v: 2, equipe: cfg.equipe, segredo: cfg.segredo, publicaEquipe: cfg.publicaEquipe, carteira, assinatura, privada: chaves.privada, encontro: enderecosDeEncontro(cfg.porta), emitidoPor: cfg.id, emitido: Date.now() };
  if (papel === 'gestao') corpo.privadaEquipe = cfg.privadaEquipe;
  return 'babel-' + b64u(JSON.stringify(corpo));
}

function ler(texto) {
  texto = String(texto || '').replace(/\s+/g, '');
  if (!/^babel-/.test(texto)) throw new Error('isto não é um token do Babel Coop');
  let corpo;
  try { corpo = JSON.parse(deB64u(texto.slice(6))); } catch (e) { throw new Error('token ilegível'); }
  if (!corpo || typeof corpo !== 'object') throw new Error('token ilegível');
  if (corpo.v === 1) throw new Error('token antigo (v1, sem carteira): peça um token novo à gestão');
  if (corpo.v !== 2 || !corpo.segredo || !corpo.equipe || !corpo.publicaEquipe || !corpo.carteira || !corpo.assinatura || !corpo.privada) throw new Error('token incompleto');
  const motivo = motivoCarteira(corpo.publicaEquipe, corpo.equipe, corpo.carteira, corpo.assinatura);
  if (motivo) throw new Error('token inválido: ' + motivo);
  let minha;
  try { minha = publicaDe(corpo.privada); } catch (e) { throw new Error('token inválido: chave ilegível'); }
  if (minha !== corpo.carteira.chave) throw new Error('token inválido: a chave não é a da carteira');
  if (corpo.carteira.papel === 'gestao') {
    let daEquipe = null;
    try { daEquipe = corpo.privadaEquipe && publicaDe(corpo.privadaEquipe); } catch (e) { daEquipe = null; }
    if (daEquipe !== corpo.publicaEquipe) throw new Error('token inválido: a gestão precisa da chave da equipe');
  } else delete corpo.privadaEquipe;
  corpo.encontro = Array.isArray(corpo.encontro) ? corpo.encontro.filter((e) => typeof e === 'string' && /^[0-9A-Za-z.:[\]-]{1,80}:\d{1,5}$/.test(e)).slice(0, 16) : [];
  return corpo;
}

/* ---------- aperto de mão entre Estações ---------- */
function novoDesafio() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519');
  return { nonce: crypto.randomBytes(16).toString('hex'), efemera: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'), efemeraPrivada: privateKey };
}

/* o que cada lado assina: o nonce de quem desafiou, o próprio id e as duas chaves efêmeras (quem troca uma delas no meio do caminho quebra a assinatura) */
function textoResposta(nonceDoOutro, meuId, minhaEfemera, efemeraDoOutro) { return nonceDoOutro + ':' + meuId + ':' + minhaEfemera + ':' + efemeraDoOutro; }

function ola(cfg, desafioDele, meuDesafio, cursores) {
  return {
    tipo: 'ola', carteira: cfg.carteira, assinatura: cfg.assinatura,
    resposta: assinar(cfg.privada, textoResposta(desafioDele.nonce, cfg.carteira.id, meuDesafio.efemera, desafioDele.efemera)),
    porta: cfg.porta, equipe: cfg.equipe, prova: prova(cfg.segredo, cfg.carteira.id), cursores: cursores || {}
  };
}

/* as cinco conferências do ola (mais: não sou eu mesmo). Devolve { carteira } ou { erro } */
function conferirOla(cfg, m, meuDesafio, efemeraDele) {
  if (!m || m.equipe !== cfg.equipe) return { erro: 'outra equipe' };
  const c = m.carteira;
  const motivo = motivoCarteira(cfg.publicaEquipe, cfg.equipe, c, m.assinatura);
  if (motivo) return { erro: motivo };
  if (typeof m.prova !== 'string' || !iguais(m.prova, prova(cfg.segredo, c.id))) return { erro: 'não conhece o segredo da equipe' };
  if (typeof m.resposta !== 'string' || !conferir(c.chave, textoResposta(meuDesafio.nonce, c.id, efemeraDele, meuDesafio.efemera), m.resposta)) return { erro: 'resposta ao desafio não confere' };
  if (c.id === cfg.carteira.id) return { erro: 'sou eu mesmo' };
  return { carteira: c };
}

/* ---------- canal selado depois do aperto de mão ---------- */
function canal(meuDesafio, desafioDele) {
  const segredo = crypto.diffieHellman({ privateKey: meuDesafio.efemeraPrivada, publicKey: chavePublica(desafioDele.efemera) });
  const sal = Buffer.from([meuDesafio.nonce, desafioDele.nonce].sort().join(':'));
  const material = Buffer.from(crypto.hkdfSync('sha256', segredo, sal, Buffer.from('babel-coop/par/v1'), 64));
  const euPrimeiro = meuDesafio.efemera < desafioDele.efemera;
  const a = material.subarray(0, 32), b = material.subarray(32, 64);
  return { envio: euPrimeiro ? a : b, recebe: euPrimeiro ? b : a, nEnvio: 0n, nRecebe: 0n };
}
function iv(n) { const b = Buffer.alloc(12); b.writeBigUInt64BE(n, 4); return b; }
/* cada mensagem leva o número dela implícito no IV: repetir, trocar a ordem ou alterar um byte fecha a ligação */
function selar(c, texto) {
  const ci = crypto.createCipheriv('aes-256-gcm', c.envio, iv(c.nEnvio));
  c.nEnvio += 1n;
  return Buffer.concat([ci.update(texto, 'utf8'), ci.final(), ci.getAuthTag()]);
}
function abrir(c, buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 16) throw new Error('mensagem selada curta demais');
  const de = crypto.createDecipheriv('aes-256-gcm', c.recebe, iv(c.nRecebe));
  c.nRecebe += 1n;
  de.setAuthTag(buf.subarray(buf.length - 16));
  return Buffer.concat([de.update(buf.subarray(0, buf.length - 16)), de.final()]).toString('utf8');
}

module.exports = {
  ID, normalizar, canonico, novasChaves, publicaDe, assinar, conferir, prova, novoSegredo,
  emitirCarteira, motivoCarteira, fundar, completarGestao, gerar, ler, meusEnderecos, enderecosDeEncontro,
  novoDesafio, textoResposta, ola, conferirOla, canal, selar, abrir
};
