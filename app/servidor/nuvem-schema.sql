-- Babel Coop · schema da nuvem (Supabase)
-- Rodar uma vez no SQL Editor do projeto Supabase.
-- Schema próprio "coop" para não misturar com outros projetos.

CREATE SCHEMA IF NOT EXISTS coop;

-- Equipes
CREATE TABLE coop.equipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  chave_publica text NOT NULL,
  criada_em timestamptz NOT NULL DEFAULT now()
);

-- Membros (cada Estação = um membro)
CREATE TABLE coop.membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id uuid NOT NULL REFERENCES coop.equipes(id) ON DELETE CASCADE,
  nome text NOT NULL,
  slug text NOT NULL,
  papel text NOT NULL DEFAULT 'membro' CHECK (papel IN ('gestao', 'membro')),
  chave_publica text NOT NULL,
  ultimo_acesso timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (equipe_id, slug)
);

-- Diário de eventos (append-only, replicado entre Estações e nuvem)
CREATE TABLE coop.eventos (
  id text PRIMARY KEY,
  equipe_id uuid NOT NULL REFERENCES coop.equipes(id) ON DELETE CASCADE,
  autor_id text NOT NULL,
  seq integer NOT NULL,
  ts bigint NOT NULL,
  quem text NOT NULL,
  acao text NOT NULL,
  args jsonb DEFAULT '[]'::jsonb,
  assinatura text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Projetos
CREATE TABLE coop.projetos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id uuid NOT NULL REFERENCES coop.equipes(id) ON DELETE CASCADE,
  nome text NOT NULL,
  slug text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (equipe_id, slug)
);

-- Membros do projeto
CREATE TABLE coop.projeto_membros (
  projeto_id uuid NOT NULL REFERENCES coop.projetos(id) ON DELETE CASCADE,
  membro_id uuid NOT NULL REFERENCES coop.membros(id) ON DELETE CASCADE,
  papel text DEFAULT 'membro',
  entrou_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (projeto_id, membro_id)
);

-- Arquivos compartilhados (metadados; o conteúdo vai no Storage)
CREATE TABLE coop.arquivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id uuid NOT NULL REFERENCES coop.equipes(id) ON DELETE CASCADE,
  caminho text NOT NULL,
  tamanho bigint DEFAULT 0,
  hash_sha256 text,
  autor_id uuid REFERENCES coop.membros(id),
  versao integer NOT NULL DEFAULT 1,
  storage_path text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (equipe_id, caminho)
);

-- Acervo (base de conhecimento da equipe)
CREATE TABLE coop.acervo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id uuid NOT NULL REFERENCES coop.equipes(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  titulo text NOT NULL,
  texto text,
  autor_id uuid REFERENCES coop.membros(id),
  autor_nome text,
  tags text[] DEFAULT '{}',
  confirmacoes integer DEFAULT 0,
  usos integer DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Migrações do banco local (PGlite) sincronizadas
CREATE TABLE coop.migracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL REFERENCES coop.projetos(id) ON DELETE CASCADE,
  nome text,
  sql_texto text NOT NULL,
  estacao_id uuid REFERENCES coop.membros(id),
  aplicada_em timestamptz NOT NULL DEFAULT now()
);

-- Sessões de agente (histórico)
CREATE TABLE coop.sessoes_agente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_id uuid NOT NULL REFERENCES coop.membros(id) ON DELETE CASCADE,
  nome text NOT NULL,
  provedor text DEFAULT 'claude' CHECK (provedor IN ('claude', 'codex')),
  modelo text,
  inicio timestamptz NOT NULL DEFAULT now(),
  fim timestamptz,
  resultado text
);

-- ====== RLS em todas as tabelas ======
ALTER TABLE coop.equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coop.membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE coop.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE coop.projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE coop.projeto_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE coop.arquivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE coop.acervo ENABLE ROW LEVEL SECURITY;
ALTER TABLE coop.migracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coop.sessoes_agente ENABLE ROW LEVEL SECURITY;

-- Políticas básicas: service_role acessa tudo (o servidor da Estação usa service_role)
-- Depois se adicionam políticas por membro autenticado.
CREATE POLICY "service_role_all" ON coop.equipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON coop.membros FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON coop.eventos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON coop.projetos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON coop.projeto_membros FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON coop.arquivos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON coop.acervo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON coop.migracoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON coop.sessoes_agente FOR ALL USING (true) WITH CHECK (true);

-- ====== Índices ======
CREATE INDEX idx_eventos_equipe_ts ON coop.eventos(equipe_id, ts);
CREATE INDEX idx_eventos_autor_seq ON coop.eventos(autor_id, seq);
CREATE INDEX idx_arquivos_equipe_caminho ON coop.arquivos(equipe_id, caminho);
CREATE INDEX idx_acervo_equipe_tipo ON coop.acervo(equipe_id, tipo);
CREATE INDEX idx_acervo_tags ON coop.acervo USING gin(tags);
CREATE INDEX idx_acervo_titulo_fts ON coop.acervo USING gin(to_tsvector('portuguese', titulo));
CREATE INDEX idx_sessoes_membro ON coop.sessoes_agente(membro_id, inicio DESC);

-- ====== Storage bucket para arquivos compartilhados ======
-- (Rodar no SQL Editor ou criar pelo dashboard: Storage > New Bucket > "compartilhado", privado)
INSERT INTO storage.buckets (id, name, public) VALUES ('compartilhado', 'compartilhado', false) ON CONFLICT DO NOTHING;
