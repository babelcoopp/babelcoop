/* Babel Coop · configuração de cada computador
   Tudo fica em ~/BabelCoop:
     coop.json          quem eu sou nesta máquina (id, nome, porta, carteira e chaves; modo 600)
     <nome>/            a minha pasta compartilhada (o que a equipe vê)
     .coop/diario.jsonl o diário de eventos (o meu e o replicado dos outros)
*/
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

/* BABEL_COOP_RAIZ, BABEL_COOP_PORTA e BABEL_COOP_DESCOBERTA permitem duas Estações na mesma máquina (testes) */
const RAIZ = process.env.BABEL_COOP_RAIZ || path.join(os.homedir(), 'BabelCoop');
const ARQUIVO = path.join(RAIZ, 'coop.json');

function normalizar(nome) {
  return String(nome || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'eu';
}

function carregar() {
  fs.mkdirSync(path.join(RAIZ, '.coop'), { recursive: true });
  let cfg = {};
  try { cfg = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8')); } catch (e) { cfg = {}; }
  const usuario = (() => { try { return os.userInfo().username; } catch (e) { return 'eu'; } })();
  cfg.nome = cfg.nome || usuario;
  cfg.id = cfg.id || normalizar(cfg.nome);
  cfg.porta = +process.env.BABEL_COOP_PORTA || cfg.porta || 4711;
  cfg.descoberta = +process.env.BABEL_COOP_DESCOBERTA || cfg.descoberta || 41234;
  cfg.papel = cfg.papel || 'membro'; /* 'gestao' entra em terminais sem pedir (CHECKLIST 0) */
  cfg.encontro = cfg.encontro || []; /* endereços (ip:porta) de onde achar a equipe, vindos do token */
  /* equipe e segredo só existem depois do token (ou de fundar a equipe): até lá a Estação abre pedindo o token */
  return salvar(cfg);
}

function salvar(cfg) {
  cfg.pasta = path.join(RAIZ, cfg.id);
  fs.mkdirSync(cfg.pasta, { recursive: true });
  const readme = path.join(cfg.pasta, 'README.md');
  if (!fs.existsSync(readme)) fs.writeFileSync(readme, '# ' + cfg.nome + '\n\nEsta é a minha pasta compartilhada no Babel Coop. Tudo aqui a equipe vê; o resto do computador, não.\n');
  const guardar = { id: cfg.id, nome: cfg.nome, porta: cfg.porta, descoberta: cfg.descoberta, papel: cfg.papel, encontro: cfg.encontro };
  if (cfg.segredo) { guardar.equipe = cfg.equipe || 'babel'; guardar.segredo = cfg.segredo; }
  /* carteira assinada pela equipe + a minha chave privada (e a da equipe, só na gestão): ver token.js */
  if (cfg.carteira) { guardar.carteira = cfg.carteira; guardar.assinatura = cfg.assinatura; guardar.privada = cfg.privada; guardar.publicaEquipe = cfg.publicaEquipe; }
  if (cfg.privadaEquipe) guardar.privadaEquipe = cfg.privadaEquipe;
  fs.writeFileSync(ARQUIVO, JSON.stringify(guardar, null, 2), { mode: 0o600 });
  try { fs.chmodSync(ARQUIVO, 0o600); } catch (e) { /* Windows: sem modo de arquivo */ } /* o mode acima só vale na criação */
  cfg.raiz = RAIZ;
  cfg.diario = path.join(RAIZ, '.coop', 'diario.jsonl');
  cfg.instancia = cfg.instancia || crypto.randomBytes(4).toString('hex');
  return cfg;
}

module.exports = { carregar, salvar, RAIZ, normalizar };
