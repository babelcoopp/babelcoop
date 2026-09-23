-- Pré-cadastro da LP do Reino (rodar no SQL Editor do Supabase, com aprovação do Marcelo).
-- A tabela fica fechada (RLS sem políticas): o público NÃO lê nem escreve direto.
-- O único acesso é a função reino_pre_cadastro, que valida, grava e devolve matrícula + código.

create table if not exists public.pre_cadastros (
  id          uuid primary key default gen_random_uuid(),
  matricula   bigint generated always as identity unique,
  codigo      text unique not null default substr(md5(random()::text || clock_timestamp()::text), 1, 8),
  nome        text not null,
  whatsapp    text not null unique,
  empresa     text, cidade text, nicho text,
  ref         text,          -- código de quem indicou (?ref=)
  origem      text, pagina text,
  criado_em   timestamptz not null default now()
);
alter table public.pre_cadastros enable row level security;

create or replace function public.reino_pre_cadastro(dados jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r record; fone text := regexp_replace(coalesce(dados->>'whatsapp', ''), '\D', '', 'g');
begin
  if length(trim(coalesce(dados->>'nome', ''))) < 2 or length(fone) < 10 or length(fone) > 13 then
    raise exception 'dados inválidos';
  end if;
  insert into pre_cadastros (nome, whatsapp, empresa, cidade, nicho, ref, origem, pagina)
  values (left(trim(dados->>'nome'), 120), fone, left(dados->>'empresa', 160), left(dados->>'cidade', 120),
          left(dados->>'nicho', 120), left(dados->>'ref', 64), left(dados->>'origem', 64), left(dados->>'pagina', 500))
  on conflict (whatsapp) do update set nome = excluded.nome, empresa = excluded.empresa, cidade = excluded.cidade, nicho = excluded.nicho
  returning matricula, codigo into r;
  return jsonb_build_object('matricula', r.matricula, 'codigo', r.codigo);
end $$;

revoke all on function public.reino_pre_cadastro(jsonb) from public;
grant execute on function public.reino_pre_cadastro(jsonb) to anon, authenticated;

-- Consultas úteis (só no painel, com a chave de serviço):
-- select matricula, nome, whatsapp, empresa, cidade, nicho, ref, criado_em from pre_cadastros order by matricula;
-- select ref, count(*) from pre_cadastros where ref is not null group by ref order by 2 desc;  -- ranking de indicações
