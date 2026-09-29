/* Babel Coop · nuvem: conexão com o Supabase do projeto
   O babel-coop roda local primeiro (PGlite, diário, acervo, arquivos).
   Este módulo é a ponte para a nuvem: sincroniza eventos, arquivos e o banco do projeto.

   Credenciais vêm de variáveis de ambiente (nunca do código):
     BABEL_COOP_SUPABASE_URL   — https://<ref>.supabase.co
     BABEL_COOP_SUPABASE_KEY   — a publishable key (sb_publishable_...)
   Sem elas, o módulo exporta null e o app funciona só na rede local.
*/
'use strict';
const { createClient } = require('@supabase/supabase-js');

const URL = process.env.BABEL_COOP_SUPABASE_URL;
const KEY = process.env.BABEL_COOP_SUPABASE_KEY;

let cliente = null;

function conectar(url, key) {
  url = url || URL;
  key = key || KEY;
  if (!url || !key) return null;
  cliente = createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: 'coop' }
  });
  return cliente;
}

function supabase() { return cliente; }

/* ---------- equipe ---------- */

async function registrarEquipe({ id, nome, slug, chavePublica }) {
  const s = supabase();
  if (!s) return null;
  const { data, error } = await s.from('equipes').upsert({ id, nome, slug, chave_publica: chavePublica }, { onConflict: 'slug' }).select().single();
  if (error) throw new Error('nuvem · equipe: ' + error.message);
  return data;
}

async function registrarMembro({ id, equipeId, nome, slug, papel, chavePublica }) {
  const s = supabase();
  if (!s) return null;
  const { data, error } = await s.from('membros').upsert({ id, equipe_id: equipeId, nome, slug, papel, chave_publica: chavePublica }, { onConflict: 'equipe_id,slug' }).select().single();
  if (error) throw new Error('nuvem · membro: ' + error.message);
  return data;
}

/* ---------- diário (eventos) ---------- */

async function enviarEventos(equipeId, eventos) {
  const s = supabase();
  if (!s || !eventos.length) return 0;
  const linhas = eventos.map((ev) => ({
    id: ev.id,
    equipe_id: equipeId,
    autor_id: ev.autor,
    seq: ev.seq,
    ts: ev.ts,
    quem: ev.quem,
    acao: ev.acao,
    args: ev.args || [],
    assinatura: ev.ass || null
  }));
  const { error, count } = await s.from('eventos').upsert(linhas, { onConflict: 'id', ignoreDuplicates: true, count: 'exact' });
  if (error) throw new Error('nuvem · eventos: ' + error.message);
  return count || linhas.length;
}

async function buscarEventos(equipeId, cursores) {
  const s = supabase();
  if (!s) return [];
  let q = s.from('eventos').select('*').eq('equipe_id', equipeId).order('ts', { ascending: true }).limit(500);
  if (cursores && Object.keys(cursores).length) {
    const filtros = Object.entries(cursores).map(([autor, seq]) => `and(autor_id.eq.${autor},seq.gt.${seq})`);
    q = q.or(filtros.join(','));
  }
  const { data, error } = await q;
  if (error) throw new Error('nuvem · buscar eventos: ' + error.message);
  return data || [];
}

/* ---------- arquivos ---------- */

async function registrarArquivo({ equipeId, caminho, tamanho, hash, autorId, storagePath }) {
  const s = supabase();
  if (!s) return null;
  const { data, error } = await s.from('arquivos').upsert({
    equipe_id: equipeId, caminho, tamanho, hash_sha256: hash, autor_id: autorId, storage_path: storagePath, atualizado_em: new Date().toISOString()
  }, { onConflict: 'equipe_id,caminho' }).select().single();
  if (error) throw new Error('nuvem · arquivo: ' + error.message);
  return data;
}

async function subirArquivo(equipeId, caminho, buffer, tipo) {
  const s = supabase();
  if (!s) return null;
  const dest = equipeId + '/' + caminho;
  const { data, error } = await s.storage.from('compartilhado').upload(dest, buffer, { contentType: tipo || 'application/octet-stream', upsert: true });
  if (error) throw new Error('nuvem · upload: ' + error.message);
  return data.path;
}

/* ---------- acervo ---------- */

async function enviarAprendizado({ equipeId, titulo, texto, autorId, autorNome, tags }) {
  const s = supabase();
  if (!s) return null;
  const { data, error } = await s.from('acervo').insert({
    equipe_id: equipeId, tipo: 'aprendizado', titulo, texto, autor_id: autorId, autor_nome: autorNome, tags: tags || []
  }).select().single();
  if (error) throw new Error('nuvem · aprendizado: ' + error.message);
  return data;
}

async function buscarAcervo(equipeId, termo, limite) {
  const s = supabase();
  if (!s) return [];
  const { data, error } = await s.from('acervo').select('*').eq('equipe_id', equipeId).textSearch('titulo', termo, { type: 'websearch' }).limit(limite || 20);
  if (error) throw new Error('nuvem · buscar acervo: ' + error.message);
  return data || [];
}

/* ---------- projetos ---------- */

async function registrarProjeto({ id, equipeId, nome, slug }) {
  const s = supabase();
  if (!s) return null;
  const { data, error } = await s.from('projetos').upsert({ id, equipe_id: equipeId, nome, slug }, { onConflict: 'equipe_id,slug' }).select().single();
  if (error) throw new Error('nuvem · projeto: ' + error.message);
  return data;
}

async function enviarMigracao({ projetoId, nome, sql, estacaoId }) {
  const s = supabase();
  if (!s) return null;
  const { data, error } = await s.from('migracoes').insert({ projeto_id: projetoId, nome, sql_texto: sql, estacao_id: estacaoId }).select().single();
  if (error) throw new Error('nuvem · migração: ' + error.message);
  return data;
}

/* ---------- estado ---------- */

function ligado() { return !!cliente; }

function estado() {
  return {
    ligado: !!cliente,
    url: URL ? URL.replace(/^https?:\/\//, '').replace(/\.supabase\.co$/, '') : null
  };
}

module.exports = {
  conectar, supabase, ligado, estado,
  registrarEquipe, registrarMembro,
  enviarEventos, buscarEventos,
  registrarArquivo, subirArquivo,
  enviarAprendizado, buscarAcervo,
  registrarProjeto, enviarMigracao
};
