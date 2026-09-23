/* Babel Coop · token de instalação
   O Theus gera um token na Estação dele; a pessoa instala o app, cola o token e pronto:
   o app já sabe quem ela é, qual é a equipe (o segredo) e onde achar o Theus na rede.
   Formato: "babel-" + base64url de JSON { v, equipe, segredo, id, nome, papel, encontro[], emitido }.
*/
'use strict';
const crypto = require('crypto');
const os = require('os');

function b64u(s) { return Buffer.from(s, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function deB64u(s) { return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'); }

/* os IPs desta máquina na rede local: é por eles que a Estação nova acha a do Theus */
function meusEnderecos(porta) {
  const ifs = os.networkInterfaces(), lista = [];
  Object.keys(ifs).forEach((k) => ifs[k].forEach((i) => { if (i.family === 'IPv4' && !i.internal) lista.push(i.address + ':' + porta); }));
  return lista;
}

function gerar(cfg, convidado) {
  if (!cfg.segredo) throw new Error('esta Estação ainda não fundou nem entrou numa equipe');
  if (cfg.papel !== 'gestao') throw new Error('só a gestão convida');
  const id = String(convidado.id || convidado.nome || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!id) throw new Error('faltou o nome');
  const corpo = { v: 1, equipe: cfg.equipe, segredo: cfg.segredo, id, nome: convidado.nome || id, papel: convidado.papel === 'gestao' ? 'gestao' : 'membro', encontro: meusEnderecos(cfg.porta), emitidoPor: cfg.id, emitido: Date.now() };
  return 'babel-' + b64u(JSON.stringify(corpo));
}

function ler(token) {
  token = String(token || '').trim();
  if (!/^babel-/.test(token)) throw new Error('isto não é um token do Babel Coop');
  let corpo;
  try { corpo = JSON.parse(deB64u(token.slice(6))); } catch (e) { throw new Error('token ilegível'); }
  if (corpo.v !== 1 || !corpo.segredo || !corpo.id || !corpo.equipe) throw new Error('token incompleto');
  return corpo;
}

/* prova de que conheço o segredo sem mandá-lo pela rede */
function prova(segredo, id) { return crypto.createHash('sha256').update(segredo + ':' + id).digest('hex'); }
function novoSegredo() { return crypto.randomBytes(24).toString('base64url'); }

module.exports = { gerar, ler, prova, novoSegredo, meusEnderecos };
