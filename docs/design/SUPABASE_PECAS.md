# SUPABASE_PECAS · todos os recursos do Supabase como peças da Máquina (aceite A10)

> `docs/design/` · 23/09/2026 · o pedido: "entre no supabase… transformarmos TODOS os recursos do SUPABASE, peças pra fazermos essa montagem, de maneira totalmente simples e intuitiva". Fonte: catálogo oficial lido página a página (79 recursos do índice de features + sub-recursos + changelog de 2026, 92 + 31 URLs) e o **Supabase real do Theus** pelo MCP oficial, só leitura. Notas completas: `.deus/missao-design/pesquisa/supabase-catalogo-de-recursos.md` (reproduzido a partir do §0 abaixo). A gramática física de cada peça (forma, material, estados, gesto, fios, pulso) está em `docs/design/MAQUINA_PECAS.md`.

## A. Como fica na Máquina, em uma página

**Dezesseis peças cobrem o Supabase inteiro**: as 12 do vocabulário (`docs/MAQUINA.md` §2) + 4 novas que não cabiam em nenhuma. Mais duas variantes de Gaveta e dois verbos de tela.

| Peça | O que é por baixo | Forma na gramática do caderno | Frase modelo |
|---|---|---|---|
| **Gaveta** | tabela · **vitrine** = view/materialized view · **janela** = foreign table (Wrappers) · fila pgmq exposta | caixa 176 × auto com frente keycap, cadeado e rodapé mono `TABELA · pacientes · 50 linhas`; vitrine = mesma caixa com rodapé `SÓ MOSTRA · não guarda`; janela = frente com "moldura de janela" e rodapé `OS DADOS MORAM NO STRIPE` | "guarda os Pacientes" |
| **Campo** | coluna e tipo; **vetor** (pgvector), **lugar** (PostGIS), **caixa livre** (jsonb), **lista de opções** (enum, só cresce), **busca por palavra** (GIN); estados **etiqueta** (chave primária) e **marcador** (índice) | linha de 24 px com glifo do tipo; etiqueta = glifo de etiqueta à esquerda do nome; marcador = ponto de 3 px à direita | "nome (texto) · nascimento (data) · clínica (ligação)" |
| **Fio** | chave estrangeira; relação do embed REST/GraphQL; regra **ao apagar** (apagam junto · travam · ficam sem) | cabo fino 1,5 px com losango na ponta "muitos"; hover mostra a frase; a Ficha pergunta "se apagar o Paciente, os Agendamentos…" (padrão: travam) | "cada Agendamento pertence a um Paciente" |
| **Chave** | política RLS na gaveta, no depósito (`storage.objects`), no cano (`realtime.messages`), na fila | cadeado de 14 px na frente da peça; fechado = preenchido; aberto = contorno + alerta; treme ao barrar | "cada empresa vê só o seu" / "só o dono muda" / "⚠ aberta para todos" |
| **Empresa** | tenant: `tenant_id` + chave + crachá com `tenant_id` em `app_metadata` (hook Custom Access Token) | bandeja rebaixada `--s0`, raio 10, etiqueta mono que escala com o zoom | "tudo aqui dentro é separado por empresa" |
| **Portaria** | Auth inteiro: 8 jeitos de entrar, MFA, captcha, catraca (rate limits), crachá (JWT/claims), carimbo (signing keys), papéis, porteiro de fora (Clerk, Firebase, Auth0, Cognito, WorkOS), ser porteiro dos outros (OAuth 2.1), **endereço de volta** (Site URL), **senha**, **sessão**, **carteira** (Web3), anônimo | peça alta 152 × auto com fresta de 4 px que acende verde/vermelho; chips de contorno para papéis e jeitos de entrar; propriedades na Ficha | "entra com e-mail e senha; papéis: dono, atendente" |
| **Porta** | Edge Function, rota da Vercel, função SQL por RPC, e a **porta automática** que toda gaveta do armário da frente ganha (REST/GraphQL) | conector de entrada grande à esquerda; verbo mono caps; círculo = um registro, três traços = muitos; porta automática = pequena seta desenhada na própria Gaveta | "recebe 'novo agendamento' e grava na gaveta Agendamentos" |
| **Robô** | trigger, pg_cron, Database Webhook, função interna, Auth Hook, background task, Automatic Embeddings, pg_net (liga para fora) | quadrado 96 × 96 com engrenagem que gira 60° ao disparar; LED âmbar; fio vermelho separado para erro | "quando entra um Paciente, manda o WhatsApp" · "todo dia às 08:00" |
| **Depósito** | bucket de arquivos; **analítico** (Iceberg); **vetorial** (S3 Vectors); público/privado, tamanho, tipos, redimensiona, CDN, porta S3, upload retomável | prateleira baixa 176 × 64 com 3 divisórias e régua de uso | "guarda as fotos dos pacientes · 1,2 GB" |
| **Cofre** | secrets das Edge Functions, `.env` da pessoa, Vault do banco, chaves publicável e secreta | obsidiana, lista com LED por chave, nunca o valor; "sem-fio" (etiqueta `usa: X` nas peças) | "precisa de: SUPABASE_URL, ZAPI_TOKEN ○ pedir ao Theus" |
| **Tela** | página do frontend; blocos da Supabase UI Library viram presets de Tela | miniatura real 176 × 112 | "a tela Agenda usa a porta 'listar agendamentos'" |
| **Cano** | Realtime (mudanças, transmissão, presença, autorização), Queues (pgmq), Pipelines (para o armazém), WebSocket em Edge Function | tubo 128 × 24 vazio em repouso; bolinhas só em evento; fila = bolinhas que esperam; pipeline = cano longo que sai do palco | "cada mudança em Agendamentos avisa a tela na hora" |
| **Armário** (nova) | schema (`public` = da frente, com porta na rua; `private`, `auth`, `storage`, `vault`, `pgmq`, `cron`, `net` = dos fundos) | moldura clara com etiqueta "Armário da frente (tem porta na rua)" / "dos fundos (só o sistema abre)"; os do próprio Supabase em cinza, fechados; contagem de gavetas expostas | "esta gaveta tem porta na rua" |
| **Ferramenta** (nova) | extensão do Postgres (pgvector, PostGIS, pg_cron, pg_net, pgmq, pg_graphql, wrappers, pg_trgm, pgtap…) | chip de chave inglesa na barra da Máquina, ligada/desligada; a peça que depende mostra "precisa da ferramenta X"; sem versão travada (pinning descontinuado em 07/2026) | "a máquina sabe procurar por parecido" |
| **Carteiro** (nova) | SMTP próprio ou hook Send Email; provedor de SMS/WhatsApp ou hook Send SMS | peça pequena presa à Portaria, glifo de envelope, número da catraca | "⚠ Carteiro de teste: 2/h, só para a equipe" · "Resend ✓ 30/h" |
| **Casa de Máquinas** (nova) | compute, disco, backups, PITR, réplicas, pooler, SSL, restrições de rede, PrivateLink, domínio, região, plano, selos, **quem pode mexer no painel** (RBAC), **fechar a rua** (desligar a Data API) | painel fixo de uma linha embaixo do palco (não é peça sobre o palco) | "Small · 2 GB · São Paulo · backup diário 7 dias · sem PITR · 90 conexões" |

**Verbos de tela** (botões, não peças): **Vistoria** roda os Advisors (30 regras + saúde dos serviços) e acende os alertas **nas peças**, agrupados por peça, lendo a intenção gravada em `COMMENT ON` para silenciar o que é de propósito, separando ERROR (trava Publicar) de WARN (âmbar) e INFO (dívida); **Diário** abre logs e relatórios da peça ("o que passou por aqui", quanto custou, quanto demorou), com um Robô-vigia opcional que roda os prompts de observabilidade do Supabase pelo MCP.

**Ordem dos alertas antes de Publicar** (pela gravidade que a documentação atribui): (1) ERROR dos Advisors; (2) Carteiro de teste; (3) endereço de volta em `localhost`; (4) chave secreta citada em código de Tela; (5) plano Free pausa em 1 semana; (6) WARN; (7) INFO. É o botão **"O que falta para publicar"**, item por item, cada um apontando para a peça.

## B. O retrato real (o que a Máquina vai encontrar num backend de verdade)

Projeto **BABEL OS 2 / "Plataforma Limpa"** (`pdamarjxcmkzbhqxtapl`, Postgres 17.6, `us-east-2`), contado por SQL agregado e pelas ferramentas do MCP em 23/09/2026 (nunca lido tabela por tabela):

| Recurso | Quantidade | Peça |
|---|---|---|
| tabelas (todas com RLS ligado) | 292 | Gaveta |
| políticas RLS | 677 | Chave |
| funções | 425 | Porta / Robô |
| gatilhos | 202 | Robô |
| índices | 1.046 | Campo · marcador |
| jobs do pg_cron | 54 | Robô-relógio |
| buckets (15 públicos, 8 privados; 74 políticas; 20.892 objetos) | 23 | Depósito |
| filas pgmq | 5 | Cano-fila |
| segredos no Vault | 9 | Cofre |
| tabelas na publicação Realtime | 45 | Cano |
| Edge Functions ativas | 91 (91 por listagem; 93 na contagem manual da frente) | Porta |
| migrações | 1.106 | O que muda |
| extensões instaladas / disponíveis | 14 / 78 | Ferramenta |
| usuários no Auth | 91 | Portaria |

Advisors reais: **1 ERROR** (view com SECURITY DEFINER), 239 WARN de funções SECURITY DEFINER executáveis por `anon`/`authenticated`, 251 WARN de políticas permissivas múltiplas, 238 índices sem uso, 46 chaves estrangeiras sem índice, 6 tabelas com RLS ligado e sem política (todas com comentário "deny-all é proposital"). É por isso que a **Vistoria lê a intenção**: sem o `COMMENT ON`, a peça mentiria.

## C. O que ninguém fez (com a anterioridade lida)

O Supabase já tem Visual Schema Designer, Policy Templates, User Impersonation, AI Assistant, Advisors e um Platform Kit para embutir o painel em outro produto: desenhar tabelas e testar "como quem" **não** é novidade. O que não existe em lugar nenhum lido: (1) peças com nome de gente e a frase em português gravada no próprio banco; (2) a máquina que se monta enquanto o agente escreve a migração, com linha do tempo por pessoa; (3) o pedido de teste animando pela Portaria → Porta → Gaveta → Robô → Cano → Tela, e o cadeado acendendo em vermelho quando a outra empresa tenta; (4) a Vistoria que distingue "aberto por descuido" de "fechado de propósito"; (5) o Carteiro como peça (item nº 1 do checklist oficial de produção, escondido numa aba de configuração); (6) Casa de Máquinas como um painel de uma linha para o empresário; (7) presets de backend (peças + fios) que passaram no teste, por pessoa, com contagem de uso.

---

# O catálogo completo (notas da frente, reproduzidas)

## 0. Resumo em dez linhas

1. O índice oficial de features lista **79 recursos** em 8 grupos (Auth, Database, Functions, Platform, Realtime, Storage, Studio, Vector; contagem reconferida na rodada 2, seção 9), cada um com estágio (GA, Beta, Public Alpha). O catálogo abaixo cobre todos, mais os sub-recursos que as páginas de produto detalham. [features]
2. **O dicionário de 12 peças da Máquina cobre ~80 % do Supabase sem inventar nada.** Faltam quatro coisas que não cabem em peça nenhuma: o *schema* (onde as gavetas ficam), as *extensões* (o que a máquina sabe fazer), o *remetente de e-mail/SMS* (o que mais quebra em produção) e a *infraestrutura* (compute, disco, backup, réplica, domínio, muro). Proposta: **Armário**, **Ferramenta**, **Carteiro** e **Casa de Máquinas** (esta última é painel, não peça no palco). Mais duas variantes de Gaveta (**vitrine** = view; **janela** = tabela estrangeira) e dois verbos de tela (**Vistoria** = rodar os Advisors; **Diário** = logs e relatórios).
3. **A frase que muda tudo para o empresário: toda gaveta no armário da frente (`public`) já tem uma porta automática na rua** (REST e GraphQL gerados sozinhos), e a única coisa entre a rua e os dados é a Chave (RLS). "Tabela em schema exposto sem RLS é legível e gravável por qualquer role com grant." [RLS]
4. **Os Advisors do Supabase são 30 regras nomeadas** (7 ERROR, 16 WARN, 7 INFO; a página não as divide por cabeçalho em segurança × performance, ver seção 9.1) com níveis ERROR/WARN/INFO e URL de remediação. Eles são, literalmente, a lista de "alertas em vermelho na própria peça" que o `MAQUINA.md` §4 já previa. Não precisamos inventar: traduzimos. [advisors]
5. **No projeto real do Theus** (Plataforma Limpa, Postgres 17.6, 93 Edge Functions, centenas de tabelas todas com RLS ligado, 14 extensões instaladas de 78 disponíveis) os Advisors apontam hoje: 1 ERROR (view com SECURITY DEFINER), 239 WARN de funções SECURITY DEFINER executáveis por anon/authenticated, 251 WARN de políticas permissivas múltiplas, 238 índices sem uso, 46 chaves estrangeiras sem índice, 6 tabelas com RLS ligado e sem política (todas com comentário "deny-all é proposital"). [MCP]
6. Esse último caso prova a tese do `MAQUINA.md` §2: **a intenção precisa estar gravada no banco** (`COMMENT ON`) para a peça não mentir. O Supabase não distingue "cadeado sem chave por descuido" de "cadeado sem chave de propósito"; o comentário distingue.
7. **Auth é uma Portaria com 8 jeitos de entrar** (senha, link mágico, código, telefone, 19 redes sociais, SAML, anônimo, carteira Web3), mais "confiar em porteiro de fora" (Clerk, Firebase, Auth0, Cognito, WorkOS) e, novidade, **virar porteiro dos outros** (servidor OAuth 2.1 para apps e agentes MCP). O que quebra primeiro em produção: o remetente de e-mail padrão manda **2 e-mails por hora, só para membros da equipe**. [auth-smtp]
8. **Realtime tem três canos** (mudanças do banco, transmissão, presença) e um aviso duro: `postgres_changes` faz 100 checagens de autorização por mudança (uma por assinante); para escala, transmitir do banco por trigger. Presença não serve para cursor ("inunda o canal"). [postgres-changes; presence]
9. **Storage virou três tipos de depósito**: arquivos (CDN em 285 cidades, imagem redimensionada na hora, upload retomável em pedaços de 6 MB), analítico (Iceberg) e vetorial (S3 Vectors, alpha, 10 buckets × 10 índices, até 4.096 dimensões). [storage]
10. **A Máquina já tem concorrente dentro do próprio Supabase**: Visual Schema Designer (GA), Policy Templates, User Impersonation (testar como qualquer usuário), AI Assistant (alpha) e a **Supabase UI Library com "Platform Kit" para embutir o gerenciamento do projeto no seu produto**. O que ninguém fez continua sendo: peças com nome de gente, o pedido animando pela máquina, o cadeado barrando ao vivo, e o agente escrevendo a migração enquanto a tela se monta.

---

## 1. Método e o que foi lido

- **Índice oficial**: https://supabase.com/docs/guides/getting-started/features (todos os itens, com estágio).
- **Páginas de produto e guias** (92 URLs lidas; lista completa na seção 8).
- **MCP oficial do Supabase**: `search_docs` (GraphQL) para páginas que o WebFetch não achou (Vector Buckets); `list_projects`, `list_extensions`, `list_tables`, `list_edge_functions`, `get_advisors` no projeto do Theus. Nada foi escrito.
- **Não lido (404)**: `/auth/oauth-server/overview` (abriu em `/auth/oauth-server`), `/storage/vectors`, `/storage/vector-buckets` (abriu em `/storage/vector/introduction` via MCP), `/platform/reports` (abriu em `/telemetry/reports`), `/auth/user-impersonation` (não existe; o recurso está no índice de features como "User Impersonation · Public Beta").
- **Cotas**: a página de extensões (`/database/extensions`) não traz a lista em HTML estático; a lista real (78 nomes) veio do `list_extensions` do MCP.

---

## 2. O dicionário: o que já existe e o que falta

### 2.1 Peças existentes (`docs/MAQUINA.md` §2) e o que cada uma absorve do Supabase

| Peça | Recursos do Supabase que cabem nela |
|---|---|
| **Gaveta** | tabela; variantes: **vitrine** (view / materialized view), **janela** (foreign table via Wrappers), **fila** (tabela pgmq quando exposta) |
| **Campo** | coluna e tipo; ganha tipos novos em português: **vetor** (pgvector), **lugar** (PostGIS), **caixa livre** (jsonb); estados: **etiqueta** (chave primária), **marcador** (índice) |
| **Fio** | chave estrangeira; relação usada pelo embed do PostgREST e pelo GraphQL |
| **Chave** | política RLS na gaveta, no depósito (`storage.objects`), no cano (`realtime.messages`) e na fila (pgmq) |
| **Empresa** | tenant: `tenant_id` + chave "cada empresa vê só o seu" + o crachá com `tenant_id` em `app_metadata` (hook Custom Access Token) |
| **Portaria** | Auth inteiro: jeitos de entrar, MFA, captcha, catraca (rate limits), crachá (JWT e claims), carimbo (signing keys), papéis (anon / authenticated / service_role / custom roles), porteiros de fora (third-party), ser porteiro dos outros (OAuth 2.1 server) |
| **Porta** | Edge Function, rota da Vercel, função SQL chamada por RPC, e a **porta automática** que toda gaveta exposta ganha (REST/GraphQL) |
| **Robô** | trigger, pg_cron, Database Webhook, função interna, Auth Hook, background task, Automatic Embeddings |
| **Depósito** | bucket de arquivos; variantes: **analítico** (Iceberg), **vetorial** (S3 Vectors); propriedades: público/privado, tamanho máximo, tipos aceitos, redimensiona imagem, entrega por CDN, porta S3 |
| **Cofre** | secrets das Edge Functions, `.env` da pessoa e o **Vault** dentro do banco; as chaves de API (publicável e secreta) moram aqui |
| **Tela** | página do frontend; os blocos da Supabase UI Library viram presets de Tela |
| **Cano** | Realtime (mudanças, transmissão, presença), Queues (pgmq), Pipelines (replicação para BigQuery etc.), WebSocket em Edge Function |

### 2.2 Peças novas propostas (só o que não cabe)

| Peça nova | Por baixo | Por que não cabe nas 12 | Como aparece |
|---|---|---|---|
| **Armário** | schema (`public`, `private`, `auth`, `storage`, `extensions`, `vault`, `pgmq`, `cron`, `net`) | a Gaveta precisa estar **em algum lugar**, e esse lugar decide se ela tem porta na rua (schema exposto) ou não | uma moldura clara: "Armário da frente (tem porta na rua)" e "Armário dos fundos (só o sistema abre)"; os armários do próprio Supabase aparecem cinza, fechados |
| **Ferramenta** | extensão do Postgres (pgvector, PostGIS, pg_cron, pg_net, pgmq, pg_graphql, wrappers, pg_trgm, pgtap…) | não guarda, não roda, não protege: **dá uma habilidade** à máquina | ícone de chave inglesa na barra da Máquina, ligada/desligada; a peça que depende dela mostra "precisa da ferramenta X" |
| **Carteiro** | SMTP próprio ou hook Send Email; provedor de SMS/WhatsApp (Twilio, MessageBird, Vonage) ou hook Send SMS | é o recurso que **mais derruba um lançamento** (2 e-mails/hora no padrão) e não é Portaria nem Cofre | peça pequena ligada à Portaria: "Carteiro: padrão do Supabase ⚠ só teste" ou "Carteiro: Resend ✓ 30/h" |
| **Casa de Máquinas** | compute, disco, backups, PITR, read replicas, pooler, SSL, restrições de rede, PrivateLink, domínio próprio, região, selos de conformidade | é o **chão** da máquina, não uma peça sobre o chão | painel fixo embaixo do palco (ou a ficha do projeto): "Small · 2 GB · São Paulo · backup diário 7 dias · sem PITR · 90 conexões" |

Verbos de tela (não são peças): **Vistoria** = botão que roda os Advisors e acende os alertas nas peças; **Diário** = logs e relatórios (o que aconteceu, quanto custou, quanto demorou), abre pela ficha de qualquer peça.

---

## 3. Catálogo por produto

Formato de cada item: **Nome oficial** (estágio) · *o que faz, em uma frase* · **precisa de** · **liga com** · **dá errado quando** (regra do Advisor quando houver) · **Peça** · Fonte.

### 3.1 Database

**Postgres database** (GA) · Cada projeto é um banco Postgres completo; é o chão de tudo (Auth, Storage, Realtime e Functions vivem em cima dele). · precisa de: um projeto (Free pausa após 1 semana parado). · liga com: tudo. · dá errado: projeto Free pausado some do ar sem aviso na tela do cliente. · **Casa de Máquinas**. · https://supabase.com/docs/guides/database/overview ; https://supabase.com/pricing

**Tabela** · Guarda linhas de uma coisa (pacientes, pedidos); "tabelas são como planilhas, têm colunas e linhas". · precisa de: um armário (schema) e uma etiqueta (chave primária, `uuid` ou `identity`). · liga com: Fios (FK), Chaves (RLS), Robôs (triggers), Canos (Realtime). · dá errado: sem chave primária → Advisor `0004 no_primary_key` (INFO); sem RLS no armário da frente → `0013 rls_disabled_in_public` (ERROR). · **Gaveta**. · https://supabase.com/docs/guides/database/tables

**Coluna e tipo** · Cada campo tem um tipo; a doc recomenda `text` em vez de `varchar(n)`, `timestamptz` para instantes, `numeric` para dinheiro, `bigint` para identificadores ("integer estoura em 2,1 bilhões"), `jsonb` para caixa livre. · precisa de: a gaveta. · dá errado: tipo `reg*` bloqueia upgrade do Postgres → `0018 unsupported_reg_types` (WARN); coluna sensível exposta → `0023 sensitive_columns_exposed` (ERROR). · **Campo** com dicionário: texto, número, dinheiro (`numeric`), data, data e hora (`timestamptz`), sim/não, lista de opções (enum), código (`uuid`), ligação (FK), arquivo (caminho no Depósito), caixa livre (`jsonb`), **vetor** (`vector(n)`), **lugar** (`geography`). · https://supabase.com/docs/guides/database/tables

**Chave estrangeira** · "Tabelas se juntam por chaves estrangeiras"; a API embute a relação (`select('*, pacientes(*)')`) e o GraphQL segue o fio em profundidade arbitrária. · precisa de: as duas gavetas e um campo de ligação. · dá errado: fio sem índice → `0001 unindexed_foreign_keys` (INFO; no projeto do Theus: 46 casos); fio apontando para coluna única de `auth.users` bloqueia upgrades do Auth → `0021 fkey_to_auth_unique` (ERROR). · **Fio** (o Studio tem "Foreign Key Selector" GA para isso). · https://supabase.com/docs/guides/database/tables ; https://supabase.com/docs/guides/graphql ; https://supabase.com/docs/guides/database/database-advisors

**Índice** · "Sumário" da tabela; sem ele o Postgres lê tudo (sequential scan); B-Tree é o padrão; `create index concurrently` para não travar escrita; índices parciais e ordenados; o **Index Advisor** sugere índices no painel de Query Performance (extensão `index_advisor` + `hypopg`). · precisa de: gaveta e campo. · dá errado: índice nunca usado → `0005 unused_index` (INFO; Theus: 238); índice duplicado → `0009 duplicate_index` (WARN). · estado **marcador** no Campo. · https://supabase.com/docs/guides/database/postgres/indexes

**View e Materialized View** · Uma consulta salva que se comporta como tabela (a vitrine mostra o que está em outras gavetas); a materializada guarda a foto e precisa ser atualizada. · precisa de: as gavetas de origem. · dá errado: view com SECURITY DEFINER pula a RLS → `0010 security_definer_view` (ERROR; Theus: 1, `config_plataforma_publico`); view expondo `auth.users` → `0002 auth_users_exposed` (ERROR); materializada exposta na API → `0016 materialized_view_in_api` (WARN). · **Gaveta-vitrine** (com "só mostra, não guarda"). · https://supabase.com/docs/guides/database/database-advisors

**Database Functions / RPC** · Procedimento que mora no banco e pode ser chamado pela API (`supabase.rpc('nome')`) em SQL ou PL/pgSQL; por padrão roda "como quem chama" (invoker); `security definer` roda como o dono e exige `search_path = ''`; "use funções do banco para operações pesadas em dados; Edge Functions para baixa latência". · precisa de: linguagem, permissões de execução. · dá errado: `search_path` mutável → `0011 function_search_path_mutable` (WARN); função SECURITY DEFINER executável por `anon` → `0028` (WARN; Theus: 90) ou por `authenticated` → `0029` (WARN; Theus: 149). · **Porta** quando a Tela chama; **Robô** quando um trigger chama. · https://supabase.com/docs/guides/database/functions

**Triggers** · "Executa ações automaticamente em INSERT, UPDATE, DELETE ou TRUNCATE", antes ou depois, por linha ou por comando, com `NEW`/`OLD`/`TG_OP`; usos típicos: `updated_at`, auditoria. · precisa de: uma função de trigger e a gaveta. · dá errado: trigger lento trava a gravação (por isso Webhooks usam pg_net assíncrono). · **Robô** "quando entra / quando muda / quando sai". · https://supabase.com/docs/guides/database/postgres/triggers

**Row Level Security e Policies** (GA) · "Políticas são o motor de regras do Postgres; cada política é presa a uma tabela e executa toda vez que a tabela é acessada", como um WHERE automático; tipos SELECT (`using`), INSERT (`with check`), UPDATE (os dois), DELETE (`using`); ajudantes `auth.uid()` e `auth.jwt()`; "adicione um índice em toda coluna que a política filtra"; embrulhar em `(select auth.uid())` para cachear por consulta; **nunca** autorizar por `raw_user_meta_data` (o usuário edita). · precisa de: RLS ligado na gaveta. · dá errado: RLS ligado sem política = ninguém entra (`0008 rls_enabled_no_policy`, INFO; Theus: 6, todas propositais); política existe mas RLS desligado → `0007 policy_exists_rls_disabled` (INFO); política `true` → `0024 permissive_rls_policy` (WARN); política lê `user_metadata` → `0015 rls_references_user_metadata` (ERROR); `auth.uid()` sem `select` → `0003 auth_rls_initplan` (WARN; Theus: 4); várias políticas permissivas para o mesmo papel e comando → `0006 multiple_permissive_policies` (WARN; Theus: 251); políticas recursivas → erro `42P17`. · **Chave** (o Studio tem "Policy Templates" GA; a Máquina traduz os padrões e grava a tradução em `COMMENT ON POLICY`). · https://supabase.com/docs/guides/database/postgres/row-level-security ; https://supabase.com/docs/guides/database/database-advisors

**Postgres Roles** (GA) · Quem pode o quê no banco: `anon` ("acesso público, não logado"), `authenticated` ("logado"), `service_role` ("acesso elevado, a API usa para pular a RLS"), `authenticator` (valida o JWT e vira outro papel), `postgres` (admin), e papéis internos (`supabase_admin`, `supabase_auth_admin`, `supabase_storage_admin`, `supabase_etl_admin` que também pula RLS). Papéis próprios com `CREATE ROLE`. Timeouts padrão: `anon` 3 s, `authenticated` 8 s, `postgres` até 2 min; painel e client library limitados a 60 s. · **Portaria** ("quem chega: visitante · pessoa logada · o próprio sistema"). · https://supabase.com/docs/guides/database/postgres/roles ; https://supabase.com/docs/guides/database/postgres/timeouts

**Schemas e "Exposed schemas"** · `public` é exposto por padrão; outro schema só entra na API se for listado em "Exposed schemas" **e** receber grants para `anon`, `authenticated`, `service_role`; schema fora da lista fica invisível para a API. · dá errado: extensão instalada em `public` → `0014 extension_in_public` (WARN); PostGIS em `public` expõe `spatial_ref_sys` na API. · **Armário** (da frente = exposto; dos fundos = privado). · https://supabase.com/docs/guides/api/using-custom-schemas ; https://supabase.com/docs/guides/database/extensions/postgis

**Auto-generated REST API via PostgREST** (GA) e **GraphQL via pg_graphql** (GA) · Toda tabela, view e materialized view no armário exposto vira endpoint REST e, com a extensão, GraphQL em `/graphql/v1`, "respeitando RLS, roles e grants", "tudo em uma ida e volta". · precisa de: armário exposto + grants; para GraphQL, a Ferramenta `pg_graphql`. · dá errado: objeto visível no GraphQL para anônimo → `0026`; para logado → `0027` (WARN). · **Porta automática** desenhada em cada Gaveta do armário da frente (a Tela não precisa de Porta própria para ler uma gaveta). · https://supabase.com/docs/guides/getting-started/features ; https://supabase.com/docs/guides/graphql

**Postgres Extensions** (GA) · "Mais de 50 extensões pré-configuradas", ligadas pelo painel ou `create extension … with schema extensions`; **no projeto do Theus a lista real tem 78 disponíveis e 14 instaladas** (`unaccent`, `pgcrypto`, `moddatetime`, `citext`, `pg_stat_statements`, `supabase_vault`, `pg_net`, `pg_trgm`, `vector`, `uuid-ossp`, `pgmq`, `pg_cron`, `hypopg`, `plpgsql`). Disponíveis e relevantes para a Máquina: `postgis` (+ raster, topology, sfcgal, tiger_geocoder), `pg_graphql`, `wrappers`, `pgroonga` (busca em qualquer língua), `pg_jsonschema`, `pgsodium`, `pgjwt`, `pgaudit`, `pgtap` (testes), `plpgsql_check`, `index_advisor`, `pg_repack`, `pg_partman`, `pg_stat_monitor`, `http`, `dblink`, `postgres_fdw`, `file_fdw`, `ltree`, `hstore`, `fuzzystrmatch`, `earthdistance`, `wal2json`, `pg_tle`, `tcn`. · dá errado: versão desatualizada → `0022 extension_versions_outdated` (WARN). · **Ferramenta**. · https://supabase.com/docs/guides/database/extensions ; MCP `list_extensions` (pdamarjxcmkzbhqxtapl, 23/09/2026)

**Vector database / pgvector** (GA) · Coluna `vector(n)` guarda a "impressão digital" de um texto ou imagem; busca por parecido com `<->`; índices IVFFlat ou HNSW ("com filtro, o índice pode devolver menos linhas que o pedido"); base do RAG. Integrações: OpenAI, Hugging Face, LangChain, LlamaIndex, Bedrock; busca semântica, por palavra e híbrida. · precisa de: Ferramenta `vector`. · **Campo · vetor** + Robô de embeddings. · https://supabase.com/docs/guides/database/extensions/pgvector ; https://supabase.com/docs/guides/ai

**Automatic Embeddings** (GA) · Trigger enfileira (pgmq), pg_cron processa a cada 10 s, pg_net chama a Edge Function que gera o embedding e grava; ao editar o texto, limpa e refaz, "o embedding fica sempre em sincronia com título e conteúdo"; modelo trocável (exemplo: `text-embedding-3-small`, 1.536 dimensões). · precisa de: Ferramentas `vector`, `pgmq`, `pg_net`, `pg_cron`, `hstore` + uma Porta (Edge Function). · **Robô** "quando o texto muda, tira a impressão digital" ligado a Cano-fila e a uma Porta. · https://supabase.com/docs/guides/ai/automatic-embeddings

**PostGIS** · Tipos Point, Polygon, LineString; índice GiST; `ST_DWithin`/`ST_Distance`; "sempre instale em schema próprio, nunca em public". · **Campo · lugar** + Porta RPC "o que está perto". · https://supabase.com/docs/guides/database/extensions/postgis

**pg_net** · "Pedidos HTTP assíncronos em SQL" (`http_get`, `http_post`, `http_delete`), respostas em `net._http_response` guardadas 6 h, timeout padrão 2.000 ms, máximo 200 pedidos/s, sem PATCH/PUT, tabelas unlogged ("não sobrevivem a crash"); é o que Webhooks e Cron→Edge Function usam. · **Robô que liga para fora** (a engrenagem com um fio para a rua). · https://supabase.com/docs/guides/database/extensions/pg_net

**Database Webhooks** (Beta) · "Um embrulho de conveniência em cima de triggers usando pg_net": em INSERT/UPDATE/DELETE manda um POST/GET com JSON (`record`, `old_record`), sem travar o banco; histórico em `net`. · precisa de: Ferramenta `pg_net`. · dá errado: em local, `localhost` não funciona (usar `host.docker.internal`). · **Robô** "quando entra, avisa <url>". · https://supabase.com/docs/guides/database/webhooks

**Cron** (Beta) · pg_cron agenda jobs "de cada segundo a uma vez por ano"; um job roda SQL, chama função do banco ou faz HTTP (Edge Function via pg_net com o token guardado no Vault); tabelas `cron.job` e `cron.job_run_details`; "no máximo 8 jobs simultâneos, cada um até 10 minutos". · **Robô-relógio** "todo dia às…". · https://supabase.com/docs/guides/cron ; https://supabase.com/docs/guides/functions/schedule-functions

**Queues** (Public Alpha) · pgmq: "fila durável nativa do Postgres com entrega garantida"; `pgmq_public` expõe `send`, `send_batch`, `read` (com visibilidade), `pop`, `archive`, `delete` para o client-side "mas não expõe criar ou apagar filas"; RLS nas filas. · dá errado: fila exposta sem proteção → `0019 insecure_queue_exposed_in_api` (ERROR). · **Cano-fila** (bolinhas que esperam na fila até um Robô pegar). · https://supabase.com/docs/guides/queues ; https://supabase.com/docs/guides/queues/api

**Foreign Data Wrappers / Wrappers** (GA) · "Consultar dados externos como se fossem tabelas do Postgres"; padrões ETL, QETL (consulta remota ao vivo) e ETL em lote com pg_cron. Catálogo em fdw.dev: nativos **Airtable, Auth0, AWS Cognito, BigQuery, ClickHouse, DuckDB, DynamoDB, Firebase, Iceberg, Logflare, MongoDB, MySQL, Redis, S3 (CSV/JSON/Parquet), S3 Vectors, Stripe, SQL Server**; em WASM **Cal.com, Calendly, Clerk, Cloudflare D1, Gravatar, HubSpot, Infura, Notion, OpenAPI, Orb, Paddle, Shopify, Slack, Snowflake**. · precisa de: Ferramenta `wrappers` + credencial no Vault. · dá errado: tabela estrangeira exposta na API → `0017 foreign_table_in_api` (WARN). · **Gaveta-janela** ("os dados moram no Stripe; aqui é uma janela"). · https://supabase.com/docs/guides/database/extensions/wrappers/overview ; http://fdw.dev/

**Supabase Pipelines** (Public Alpha) · Copia tabelas para destinos analíticos: BigQuery (alpha público), ClickHouse, DuckLake e Snowflake (privado); "copia as linhas existentes e depois replica as mudanças (CDC)"; depende de publicação, replication slot e retenção de WAL ("se o Postgres apagar WAL antes do consumidor alcançar, o slot fica inutilizável"). · **Cano para o armazém** (longo, sai do palco). · https://supabase.com/docs/guides/database/replication

**Read Replicas** (GA) · Cópias só-leitura em outras regiões; "reduzem carga na primária" e latência; load balancer roteia `GET` da Data API para a mais perto; **só SELECT; Auth, Storage e Realtime não usam réplica**; há atraso de replicação. · **Casa de Máquinas** ("cópia de leitura em Frankfurt"). · https://supabase.com/docs/guides/platform/read-replicas

**Connection pooler (Supavisor / Dedicated Pooler)** (Supavisor Public Beta; Dedicated GA) · Quatro jeitos de ligar o cabo: direto (IPv6, porta 5432), Supavisor sessão (5432), Supavisor transação (6543, "para serverless e edge functions"), Dedicated PgBouncer (pago, só transação, na mesma máquina); "modo transação não suporta prepared statements". Conexões por compute: Nano/Micro 60 diretas/200 pooler, Small 90/400, Medium 120/600, Large 160/800, XL 240/1.000, 2XL 380/1.500. Regra: pool até 40 % do máximo se a Data API é muito usada, senão até 80 %. · **Casa de Máquinas** ("90 conversas ao mesmo tempo"). · https://supabase.com/docs/guides/database/connecting-to-postgres ; https://supabase.com/docs/guides/platform/compute-and-disk ; https://supabase.com/docs/guides/database/connection-management

**Branching** (Beta) · Ramo de prévia = cópia do projeto (Edge Functions e configuração incluídas; **sem dados nem objetos do Storage**, salvo seed), efêmero (some ao fechar o PR) ou persistente (staging/QA); criado por GitHub, painel ou MCP; ao mesclar roda saúde → migrações → seed → funções ("se um passo pai falha, os filhos são pulados"). Custo: US$ 0,01344 por ramo por hora. · **Ambiente da Máquina** (`local · ramo · produção` no cabeçalho, como o `MAQUINA.md` §4 já desenha). · https://supabase.com/docs/guides/deployment/branching ; https://supabase.com/pricing

**Migrations e Declarative Schemas** (GA) · `supabase migration new` → `supabase/migrations/*.sql`; `db push` aplica só o que falta segundo `supabase_migrations.schema_migrations`; `db diff` captura o que foi feito no painel; `db reset` + `seed.sql`; regra de ouro: "toda mudança de schema passa por migração". Declarativo: `supabase/schemas/*.sql` é a verdade e `db schema declarative sync` gera a migração; não captura DML nem objetos em `auth`/`storage`. · **"O que muda" e a linha do tempo** da Máquina (peças tracejadas = migração ainda não aplicada). · https://supabase.com/docs/guides/deployment/database-migrations ; https://supabase.com/docs/guides/local-development/declarative-database-schemas

**Database backups e PITR** (GA) · Backup diário: Pro 7 dias, Team 14, Enterprise 30; PITR (add-on, exige compute Small ou maior) = snapshot + WAL, "RPO de dois minutos", US$ 100/mês por 7 dias de retenção; **"backups não incluem os objetos do Storage, só os metadados"**; restaurar derruba o projeto durante o processo. · **Casa de Máquinas** ("cópia de segurança: diária, 7 dias · o Depósito não entra"). · https://supabase.com/docs/guides/platform/backups ; https://supabase.com/pricing

**OrioleDB** (Public Alpha) · Motor de armazenamento substituto do heap: tabelas organizadas por índice, sem vacuum, "3,3× no TPC-C"; escolhido ao criar projeto novo; índices além do B-tree são experimentais. · **Casa de Máquinas** (só informativo). · https://supabase.com/docs/guides/database/orioledb

**Dedicated Poolers, Declarative Schemas, Terraform provider, Supabase AI Assistant, MCP Server** aparecem no índice de features com estágio (GA, GA, Public Alpha, Public Alpha, Public Alpha). · https://supabase.com/docs/guides/getting-started/features

### 3.2 Auth (a Portaria)

**Métodos de entrada** (GA) · Senha, link mágico, código de uso único (OTP), telefone (Twilio, MessageBird, Vonage), social com **19 provedores** (Apple, Azure, Bitbucket, Discord, Facebook, Figma, GitHub, GitLab, Google, Kakao, Keycloak, LinkedIn, Notion, Slack, Spotify, Twitter, Twitch, WorkOS, Zoom), qualquer OAuth2/OIDC próprio, SSO SAML 2.0, Web3 (Ethereum, Solana). · **Portaria** com chips "entra com: e-mail e senha · link · código · Google". · https://supabase.com/docs/guides/auth ; https://supabase.com/docs/guides/getting-started/features

**Anonymous sign-ins** · "Cria um usuário anônimo que se comporta como permanente, mas perde a conta ao sair, limpar dados ou trocar de aparelho"; claim `is_anonymous` no JWT para a Chave distinguir; converte em permanente ligando e-mail ou OAuth; sem limpeza automática (apagar por SQL os com mais de 30 dias); "pode ser abusado para inflar o banco": ligar captcha; 30 pedidos/hora por IP. · dá errado: `0012 auth_allow_anonymous_sign_ins` (INFO). · **Portaria** "deixa entrar sem se identificar (visitante com pulseira)". · https://supabase.com/docs/guides/auth/auth-anonymous

**Multi-Factor Authentication** (GA) · TOTP (app) e telefone (SMS/WhatsApp; add-on US$ 75/mês no primeiro projeto); níveis `aal1` e `aal2`; a Chave pode exigir `(select auth.jwt()->>'aal') = 'aal2'` "como política restritiva". · **Portaria · segunda tranca** + Chave "só com segunda tranca". · https://supabase.com/docs/guides/auth/auth-mfa ; https://supabase.com/pricing

**Captcha protection** (GA) · hCaptcha ou Cloudflare Turnstile em cadastro, entrada e troca de senha. · **Portaria · teste de humano**. · https://supabase.com/docs/guides/auth/auth-captcha

**Rate limits** · Padrões: e-mail **2/hora** com o remetente embutido; SMS 30/hora; cadastro/entrada 30 por 5 min por IP; OTP/link mágico 60 s entre pedidos do mesmo usuário; refresh de token 150 por 5 min; anônimo 30/hora. · **Portaria · catraca** (número visível na peça). · https://supabase.com/docs/guides/auth/rate-limits

**Custom SMTP** · O remetente padrão "não é para produção": 2 mensagens/hora, **só para endereços de membros da equipe**, sem SLA; com SMTP próprio (Resend, SES, Postmark, SendGrid, ZeptoMail, Brevo) manda para todos, com limite inicial de 30/hora. · **Carteiro** (peça nova): "⚠ Carteiro de teste: 2/h, só para a equipe" vira o alerta mais útil da Máquina antes de publicar. · https://supabase.com/docs/guides/auth/auth-smtp

**Auth Hooks** (Beta) · Seis ganchos: Before User Created, Custom Access Token ("devolve as claims que você quer no JWT"), Send SMS, Send Email, MFA Verification Attempt, Password Verification Attempt (os dois últimos só Team/Enterprise); função Postgres (2 s) ou HTTP (5 s, 3 tentativas, cabeçalhos Standard Webhooks). · **Robô na Portaria** ("antes de criar a pessoa…", "monta o crachá com a empresa"). É por aqui que `tenant_id` entra no JWT para a moldura **Empresa** funcionar. · https://supabase.com/docs/guides/auth/auth-hooks

**JWT Signing Keys** (GA) · Chaves assimétricas (RSA 2048 ou P-256, recomendada) substituem o segredo compartilhado; rotação com chave em espera "sem downtime, cada passo reversível"; verificação local por JWKS (`/.well-known/jwks.json`, `getClaims()`) "sem falar com o servidor de Auth". · **Portaria · carimbo** (trocar o carimbo sem deslogar ninguém). · https://supabase.com/docs/guides/auth/signing-keys

**SSO with SAML** (GA) · "Pro e acima"; `supabase sso add --type saml`; `signInWithSSO({ domain })`; mapeamento de atributos; sem usuário sem e-mail; sem linking com outros métodos; US$ 0,015 por MAU SSO. · **Portaria · entrada de empresa parceira**. · https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml

**Third-Party Authentication** (GA) · Confia em JWT de Clerk, Firebase Auth, Auth0, AWS Cognito, WorkOS "como confia nos do Supabase Auth"; US$ 0,00325 por MAU de terceiro; "não dá para desligar o Supabase Auth". · **Portaria · porteiro de fora**. · https://supabase.com/docs/guides/auth/third-party/overview

**OAuth 2.1 Server** (Public Beta) · O projeto "vira um provedor de identidade OAuth 2.1 e OIDC" para outros apps e **agentes MCP** (registro dinâmico de cliente, PKCE, escopos `openid email profile phone`, tela de consentimento própria); "as políticas RLS se aplicam automaticamente aos tokens OAuth". · **Portaria · ser porteiro dos outros**. · https://supabase.com/docs/guides/auth/oauth-server

**Server-side Auth, Email Templates, Custom Identity Providers, Phone logins, User Impersonation (Auth + Studio, Public Beta: "viva seu app como qualquer usuário")** · estágios e frases no índice. O "como quem" do `MAQUINA.md` §6.2 é exatamente a impersonação. · https://supabase.com/docs/guides/getting-started/features

**API keys: publicável e secreta** (GA) · `sb_publishable_…` "seguro para expor: site, app, CLI"; `sb_secret_…` "só no backend", **"pula toda política RLS"** e "não funciona no navegador (401 por User-Agent)"; `anon`/`service_role` legados serão descontinuados "até o fim de 2026". · **Cofre** + desenho na Portaria: chave da porta da frente (pode ficar na Tela) × chave-mestra (nunca sai da Porta). Alerta da Máquina: chave-mestra citada em código de Tela = vermelho. · https://supabase.com/docs/guides/api/api-keys

### 3.3 Storage (o Depósito)

**Bucket types** · Três tipos: **Files** (imagens, vídeos, documentos; CDN; RLS; URL direta), **Analytics** (Apache Iceberg, "acessível por SQL via foreign tables", para logs e Pipelines), **Vector** (embeddings, HNSW/Flat, cosseno/euclidiana, filtro por metadados). · **Depósito** com três variantes. · https://supabase.com/docs/guides/storage

**Bucket público × privado; limites** · Privado é o padrão ("toda operação passa pela RLS"); público deixa qualquer um com a URL baixar, mas **upload, apagar, mover e copiar continuam controlados**; limite global de arquivo: Free 50 MB, Pro/Team 500 GB; limite por bucket não pode passar do global; tipos MIME permitidos por bucket. · dá errado: bucket público com listagem aberta → `0025 public_bucket_allows_listing` (WARN). · **Depósito** "prateleira na vitrine / prateleira trancada · até 50 MB · só imagens". · https://supabase.com/docs/guides/storage/buckets/fundamentals ; https://supabase.com/docs/guides/storage/uploads/file-limits

**Access control** · "Por padrão o Storage não permite upload sem política RLS"; políticas em `storage.objects` por operação (upload = INSERT; upsert = SELECT + UPDATE…); ajudantes `storage.foldername()`, `auth.jwt()->>'sub'`; a chave secreta pula tudo. · **Chave no Depósito** (o mesmo cadeado da gaveta, com frases "cada um vê a própria pasta"). · https://supabase.com/docs/guides/storage/security/access-control

**Image transformations** (GA) · Pro+; largura/altura 1–2.500 px; `cover`/`contain`/`fill`; qualidade 20–100 (80); WebP automático; até 25 MB e 50 MP; US$ 5 por 1.000 imagens de origem além da cota (100/mês); "as opções vão dentro do token da URL assinada e não podem ser alteradas". · **Depósito · redimensiona na hora**. · https://supabase.com/docs/guides/storage/serving/image-transformations

**Resumable uploads** (GA) · Protocolo TUS; "para arquivos acima de 6 MB, rede instável ou barra de progresso"; pedaço fixo de 6 MB; URL de upload vale 24 h; só um cliente por URL (409 se dois); `x-upsert`. · **Depósito · aceita arquivo grande (retoma se cair)**. · https://supabase.com/docs/guides/storage/uploads/resumable-uploads

**CDN e Smart CDN** (GA) · Cache na borda em "mais de 285 cidades"; Smart CDN (Pro+) revalida sozinho ao trocar ou apagar, "em até 60 segundos"; `cacheControl` controla o navegador; URL assinada nova a cada pedido perde o cache. · **Depósito · entrega pelo mundo**. · https://supabase.com/docs/guides/storage/cdn/smart-cdn ; https://supabase.com/docs/guides/storage

**S3 compatibility** (GA) · Endpoint `…storage.supabase.co/storage/v1/s3`; chaves S3 do painel "dão acesso total a todos os buckets e **pulam a RLS**, só no servidor"; alternativa com token de sessão (JWT do usuário) respeita a RLS. · **Depósito · porta S3** (chave no Cofre). · https://supabase.com/docs/guides/storage/s3/authentication

**Analytics Buckets (Iceberg)** (Public Alpha) · "Postgres é para transações; análise de histórico grande vai para Iceberg"; data lake, arquivamento, agregações pesadas. · **Depósito analítico** (ligado por Cano-para-o-armazém). · https://supabase.com/docs/guides/storage/analytics/introduction

**Vector Buckets** (Public Alpha) · S3 Vectors; bucket → índices (dimensão e métrica) → vetores com metadados; até 500 por requisição no guia, 1.000 no limite; máximo 10 buckets por projeto, 10 índices por bucket, 4.096 dimensões, topK 10.000 (hospedado) / 100 (local); "ideal para volume grande e processamento de fundo; pgvector para resposta rápida perto do usuário"; consultável por SQL via wrapper `s3_vectors` (`<==>`). · **Depósito vetorial**. · https://supabase.com/docs/guides/storage/vector/introduction ; https://supabase.com/docs/guides/storage/vector/querying-vectors ; https://supabase.com/docs/guides/storage/vector/limits

### 3.4 Edge Functions (Portas e Robôs)

**Deno Edge Functions** (GA) · "TypeScript distribuído globalmente para lógica própria"; deploy por painel, CLI ou MCP; "cold starts são possíveis: desenhe operações curtas e idempotentes"; o gateway valida JWT e roteia. · **Porta**. · https://supabase.com/docs/guides/functions

**Secrets** · Já vêm `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `SUPABASE_PUBLISHABLE_KEYS`, `SUPABASE_SECRET_KEYS`; `supabase secrets set` (sem redeploy); `.env` local em `supabase/functions/.env`; até 100 segredos por projeto, 48 KiB cada. · **Cofre** (a Máquina lê `Deno.env.get('X')` e cruza com o que existe, como o `MAQUINA.md` §3 já diz). · https://supabase.com/docs/guides/functions/secrets ; https://supabase.com/docs/guides/functions/limits

**Limits** · 256 MB de memória; **2 s de CPU por pedido**; parede de 150 s (Free) / 400 s (pago); 504 após 150 s ocioso; função de até 20 MB; 100/1.000/2.000 funções por projeto (Free/Pro/Team); portas 25 e 587 bloqueadas (não manda e-mail direto: usa o Carteiro). · alerta na Porta: "demorou mais de 2 s de CPU". · https://supabase.com/docs/guides/functions/limits

**Regional invocation** (GA) · Padrão: região mais perto do usuário; `x-region` força a região do banco (bom para operações pesadas); 15 regiões, **São Paulo incluída**; região fixa não faz failover. · **Porta · atende de: São Paulo**. · https://supabase.com/docs/guides/functions/regional-invocation

**Background tasks** · `EdgeRuntime.waitUntil()` "responde ao usuário enquanto o processamento continua"; `beforeunload` para salvar estado; local exige `policy = "per_worker"`. · **Robô atrás da Porta** (a porta responde e a engrenagem continua girando). · https://supabase.com/docs/guides/functions/background-tasks

**WebSockets** · Servidor (`Deno.upgradeWebSocket`) e cliente (relay para OpenAI Realtime, por exemplo); JWT vai em query string ou `Sec-WebSocket-Protocol`. · **Cano preso a uma Porta**. · https://supabase.com/docs/guides/functions/websockets

**Ephemeral e Persistent Storage** (GA) · `/tmp` reinicia a cada chamada (256 MB Free, 512 MB pago); monta qualquer bucket S3 (inclusive do Storage) em `/s3/<bucket>`; "97 % de cold start mais rápido" no índice. · **Porta com mão no Depósito**. · https://supabase.com/docs/guides/functions/ephemeral-storage ; https://supabase.com/docs/guides/getting-started/features

**AI models embutidos** · `Supabase.ai.Session`: embeddings `gte-small` (só inglês, 512 tokens) e LLM via Ollama/Llamafile próprio; "LLM hospedado vem depois". · **Porta com cérebro pequeno** (só embedding). · https://supabase.com/docs/guides/functions/ai-models

**`verify_jwt` por função** · No projeto do Theus, das 93 funções, a maioria dos `cron-*`, `webhook*` e `notificar-*` tem `verify_jwt: false` (esperado para webhooks e cron); as `admin-*`, `mentor-*`, `gerar-pdf-*` têm `true`. A Máquina mostra "porta sem checagem de login" só como **âmbar** quando é webhook/cron e **vermelho** quando a Tela chama. · MCP `list_edge_functions` (23/09/2026)

### 3.5 Realtime (os Canos)

**Postgres Changes** (GA) · A gaveta precisa estar na publicação `supabase_realtime`; eventos INSERT/UPDATE/DELETE ou `*`; filtros `eq, neq, lt, gt, in` avaliados no servidor; **respeita RLS** ("só recebe o que pode ver"); `REPLICA IDENTITY FULL` para ter o registro antigo, mas "RLS não se aplica a DELETE"; **"a cada mudança o Realtime faz 100 checagens de autorização, uma por usuário"**, throughput cai com o número de assinantes; para escala, Broadcast. · **Cano-ao-vivo** da Gaveta para a Tela (é o que a Máquina usa no Testar). · https://supabase.com/docs/guides/realtime/postgres-changes

**Broadcast** (GA) e **Broadcast from the Database** (Public Beta) · Mensagem de cliente para cliente, por REST sem WebSocket, ou **do banco por trigger** (`realtime.broadcast_changes()`, `realtime.send()`); `ack`; canais privados só para autenticados; **Replay** (Public Alpha): mensagens em partições diárias, "mais de 72 h são apagadas". · **Cano entre Telas** (cursor, chat) e **Robô + Cano** quando sai do banco. · https://supabase.com/docs/guides/realtime/broadcast

**Presence** (GA) · `track/untrack`, eventos `sync/join/leave`, chave por cliente; "chamar `track()` a cada movimento do mouse inunda o canal": para cursor use Broadcast. · **Cano · quem está aqui**. · https://supabase.com/docs/guides/realtime/presence

**Realtime Authorization** (Public Beta) · Canal `private: true` + política RLS em `realtime.messages` (coluna `extension` = broadcast/presence; `realtime.topic()`); checada ao entrar no canal e cacheada; "se nunca chegar um JWT novo, o cliente é desconectado quando o token expira"; desligar "Allow public access" para obrigar. · **Chave no Cano**. · https://supabase.com/docs/guides/realtime/authorization

**Limits** · Conexões simultâneas: Free 200, Pro 500, Pro sem teto/Team 10.000; mensagens/s: 100 / 500 / 2.500; presença: 10 chaves por objeto, 20–1.000 msg/s; payload broadcast 256 KB (Free) a 3.000 KB; payload de mudanças 1.024 KB. · número na peça Cano. · https://supabase.com/docs/guides/realtime/limits

### 3.6 Plataforma, Studio e o que cerca a máquina

**Vault** (Public Alpha) · "Extensão e UI para guardar segredos cifrados no banco"; cifra autenticada (não pode ser forjada); `vault.create_secret()`, view `vault.decrypted_secrets` (decifra na hora, nunca grava texto claro); "a chave de cifra nunca fica no banco"; quem acessa a view acessa os segredos: proteger com privilégios. Usado por Wrappers, pg_net, Cron→Edge Function. · **Cofre-do-banco** (o mesmo cofre, dentro do armário). · https://supabase.com/docs/guides/database/vault

**Logs & Analytics** (GA), **Reports & Metrics** (GA), **Log Drains** (GA) · Fontes: API Gateway, Postgres, Auth, Storage, PostgREST, Edge Functions, Realtime, pooler; consulta por SQL no Explorer, MCP ou API; retenção por plano: Free 1 dia, Pro 7, Team 28, Enterprise 90; relatórios por produto com janela de 10 min a 28 dias; drains (Pro+) para Custom HTTP, OTLP, Datadog, Loki, S3, Sentry, Axiom, Last9, Syslog, em lotes de 250 eventos ou 1 s. · **Diário** (verbo de tela: na ficha de qualquer peça, "o que passou por aqui"). · https://supabase.com/docs/guides/telemetry/logs ; https://supabase.com/docs/guides/telemetry/reports ; https://supabase.com/docs/guides/platform/log-drains ; https://supabase.com/pricing

**Security & Performance Advisor** (GA) · 30 regras (lista completa na seção 4), cada uma com nível e página de remediação; o MCP expõe `get_advisors(security|performance)`. · **Vistoria** (botão) → alertas nas peças. · https://supabase.com/docs/guides/database/database-advisors

**Custom domains** (GA) · Add-on US$ 10/domínio/mês; "um domínio por projeto"; CNAME + TXT `_acme-challenge`; certificado em até 30 min; cobre API e fluxos de Auth/OAuth. Vanity subdomain (experimental) em Pro+. · **Casa de Máquinas · endereço próprio**. · https://supabase.com/docs/guides/platform/custom-domains ; https://supabase.com/pricing

**Network restrictions** (GA) · Lista de IPs (CIDR) para Postgres e pooler; **não vale para PostgREST, Storage, Auth nem client libraries**; com restrição ligada, "Edge Functions perdem acesso direto ao banco" (usar supabase-js). · **Casa de Máquinas · muro**. · https://supabase.com/docs/guides/platform/network-restrictions

**SSL enforcement** (GA) · Obriga TLS em todas as conexões Postgres (as APIs HTTP já são sempre TLS); ligar "reinicia o banco rapidamente"; `verify-full` com o certificado CA do painel. · **Casa de Máquinas · cadeado do cabo**. · https://supabase.com/docs/guides/platform/ssl-enforcement

**PrivateLink** (Beta) · Team/Enterprise; AWS VPC Lattice; só banco (5432/6543); API, Storage, Auth e Realtime continuam pela internet. · **Casa de Máquinas**. · https://supabase.com/docs/guides/platform/privatelink

**Compliance** · SOC 2 Tipo 2 (relatório para Team/Enterprise no painel; "não se transfere para fora do produto"); HIPAA com BAA + add-on + seguir o Security Advisor ("compliance é contínuo, não auditoria pontual"); GDPR e residência de dados são responsabilidade do cliente ao escolher a região. · **Casa de Máquinas · selos**. · https://supabase.com/docs/guides/security/soc-2-compliance ; https://supabase.com/docs/guides/security/hipaa-compliance ; https://supabase.com/docs/guides/security/product-security

**Compute and Disk** · Nano (grátis, 0,5 GB) → Micro US$ 10 → Small US$ 15 (2 GB) → Medium US$ 60 → Large US$ 110 (2 vCPU dedicadas) → XL US$ 210 → 2XL US$ 410 → até 64 vCPU; disco gp3 8 GB inclusos, US$ 0,125/GB; io2 para IOPS alto; até 4 mudanças de disco por 24 h. · **Casa de Máquinas**. · https://supabase.com/docs/guides/platform/compute-and-disk

**Planos** · Free: 50k MAU, 500 MB, 1 GB de arquivos, 5 GB de egress, 500k invocações, 200 conexões Realtime, 1 dia de logs, pausa após 1 semana; Pro US$ 25: 100k MAU, 8 GB de disco, 100 GB de arquivos, 250 GB, 2 M invocações, 500 conexões, 7 dias de logs e de backup, spend cap ligado; Team US$ 599: 28 dias de logs, 14 de backup, SOC 2, PrivateLink; MAU extra US$ 0,00325. · a Máquina mostra o plano na Casa de Máquinas e avisa antes de Publicar ("Free pausa; e-mail 2/h"). · https://supabase.com/pricing ; https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users

**Management API, CLI, Terraform** · `api.supabase.com` com token pessoal ou OAuth2; gerencia projetos, migrações, backups, réplicas, PITR, domínio, SSL, rede, ramos, segredos, chaves, funções, Auth e Storage; 120 pedidos/min por usuário-projeto (logs 30/min). CLI para local (`supabase start`), migrações e funções. Terraform (`supabase_project`, `supabase_settings`) para versionar configuração. · é o que "Publicar" e "Casa de Máquinas" usam por baixo. · https://supabase.com/docs/reference/api/introduction ; https://supabase.com/docs/guides/deployment/terraform

**MCP Server oficial** (Public Alpha) · `https://mcp.supabase.com/mcp` (ou `localhost:54321/mcp` no local), login por OAuth sem token manual; oito grupos: **account, docs, database, debugging, development, functions, branching, storage** (storage desligado por padrão); `?project_ref=` limita a um projeto, `?read_only=true`, `?features=`; risco principal "prompt injection escondida nos dados"; recomenda read-only para monitorar, escopo por projeto, evitar produção. Ferramentas observadas na conexão desta sessão: `list_projects, get_project, create_project, pause_project, restore_project, list_organizations, get_organization, list_tables, list_extensions, list_migrations, apply_migration, execute_sql, get_advisors, query_logs, get_project_url, get_publishable_keys, generate_typescript_types, list_edge_functions, get_edge_function, deploy_edge_function, list_branches, create_branch, delete_branch, merge_branch, rebase_branch, reset_branch, search_docs`. · **as mãos do agente**: a Máquina pode ler a verdade por `list_tables`, `list_extensions`, `list_edge_functions`, `list_migrations`, `list_branches`, `get_advisors`, `query_logs` sem código próprio de catálogo. · https://supabase.com/docs/guides/getting-started/mcp ; lista de ferramentas do MCP conectado nesta sessão

**Studio** · Table Editor, SQL Editor (GA), **Visual Schema Designer** (GA), **Policy Templates** (GA), **Foreign Key Selector** (GA), **User Impersonation** (Public Beta), **Supabase AI Assistant** (Public Alpha), Security & Performance Advisor (GA), Log Drains (GA). · anterioridade direta da Máquina: o Supabase já desenha o schema visualmente e já testa "como quem". · https://supabase.com/docs/guides/getting-started/features

**Supabase UI Library** · Blocos prontos em shadcn para Next.js, React Router, TanStack Start e React SPA: Password-Based Auth, Social Auth, Current User Avatar, OAuth Consent, Infinite Query, Dropzone, **Realtime Cursor, Realtime Monaco, Realtime Flow, Realtime Avatar Stack, Realtime Chat**, MCP Server ("MCP com escopo de usuário no seu produto"), Headless App, Supabase Client, **Platform Kit ("embutir o gerenciamento do projeto Supabase na sua plataforma")**, starters (Next.js, SaaS com Stripe, AI Chat, Flutter). · presets de **Tela** com Cano e Portaria já ligados; o Platform Kit é anterioridade para "gerenciar Supabase de dentro do Babel Coop". · https://supabase.com/ui ; https://supabase.com/ui/docs/getting-started/introduction

**Client libraries** · JavaScript, Flutter, Swift (GA), Python (Beta); Kotlin, C# também aparecem nas páginas de referência. · a Tela fala com a Porta automática por elas. · https://supabase.com/docs/guides/getting-started/features

---

## 4. O que os Advisors apontam (as 30 regras) e o retrato real

### 4.1 Tradução das 30 regras para a Máquina

| Regra | Nível | Frase na peça (português) | Peça |
|---|---|---|---|
| 0013 rls_disabled_in_public | ERROR | "⚠ gaveta aberta para a rua" | Gaveta |
| 0002 auth_users_exposed | ERROR | "vitrine mostra a lista de usuários" | Gaveta-vitrine |
| 0010 security_definer_view | ERROR | "vitrine pula o cadeado" | Gaveta-vitrine |
| 0015 rls_references_user_metadata | ERROR | "chave confia em dado que o usuário edita" | Chave |
| 0019 insecure_queue_exposed_in_api | ERROR | "cano-fila aberto na rua" | Cano |
| 0021 fkey_to_auth_unique | ERROR | "fio preso na Portaria trava atualizações" | Fio |
| 0023 sensitive_columns_exposed | ERROR | "campo sensível à vista" | Campo |
| 0003 auth_rls_initplan | WARN | "chave lenta: confere pessoa por pessoa" | Chave |
| 0006 multiple_permissive_policies | WARN | "duas chaves abrem a mesma porta" | Chave |
| 0009 duplicate_index | WARN | "marcador repetido" | Campo |
| 0011 function_search_path_mutable | WARN | "robô sem caminho fixo" | Robô/Porta |
| 0014 extension_in_public | WARN | "ferramenta guardada no armário da frente" | Ferramenta |
| 0016 materialized_view_in_api | WARN | "vitrine congelada na rua" | Gaveta-vitrine |
| 0017 foreign_table_in_api | WARN | "janela aberta para a rua" | Gaveta-janela |
| 0018 unsupported_reg_types | WARN | "tipo de campo trava upgrade" | Campo |
| 0022 extension_versions_outdated | WARN | "ferramenta desatualizada" | Ferramenta |
| 0024 permissive_rls_policy | WARN | "⚠ chave aberta para todos" | Chave |
| 0025 public_bucket_allows_listing | WARN | "prateleira pública com lista à vista" | Depósito |
| 0026 / 0027 pg_graphql_*_table_exposed | WARN | "gaveta visível no GraphQL" | Gaveta |
| 0028 / 0029 *_security_definer_function_executable | WARN | "porta do banco que qualquer um / qualquer logado aciona" | Porta |
| 0012 auth_allow_anonymous_sign_ins | INFO | "portaria deixa entrar sem nome" | Portaria |
| 0007 policy_exists_rls_disabled | INFO | "chave existe, cadeado desligado" | Chave |
| 0008 rls_enabled_no_policy | INFO | "cadeado sem chave: ninguém entra" (+ intenção do `COMMENT`) | Chave |
| 0001 unindexed_foreign_keys | INFO | "fio sem marcador" | Fio |
| 0004 no_primary_key | INFO | "gaveta sem etiqueta" | Gaveta |
| 0005 unused_index | INFO | "marcador nunca usado" | Campo |
| 0020 table_bloat | WARN | "gaveta inchada" | Gaveta |
| 0030 autovacuum_disabled | INFO | "gaveta sem faxina automática" | Gaveta |

Fonte: https://supabase.com/docs/guides/database/database-advisors (30 regras: 23 de segurança, 7 de performance). Observado só no MCP, fora da lista lida: `auth_db_connections_absolute` (INFO, "Auth DB Connection Strategy is not Percentage").

### 4.2 Retrato real (Plataforma Limpa, 23/09/2026, pelo MCP)

- Postgres 17.6.1, região `us-east-2`, `ACTIVE_HEALTHY`.
- **Segurança**: `rls_enabled_no_policy` 6 (tabelas `_migration_rpc_backup`, `backup_malu_contrato_20260904`, `conexoes_google`, `google_oauth_estados_usados`, `mentor_tag_regras`, `registro_purge`; os comentários das tabelas dizem "RLS sem policy é proposital, exclusiva de service_role"); `security_definer_view` 1 (`config_plataforma_publico`, ERROR); `anon_security_definer_function_executable` 90; `authenticated_security_definer_function_executable` 149.
- **Performance**: `unindexed_foreign_keys` 46; `auth_rls_initplan` 4; `no_primary_key` 1; `unused_index` 238; `multiple_permissive_policies` 251; `table_bloat` 1; `auth_db_connections_absolute` 1.
- **Tabelas**: a listagem do schema `public` trouxe centenas de tabelas (não contei uma a uma), **todas com `rls_enabled: true`**, muitas com `comment` explicando a intenção (ex.: "Escrita: service_role no motor", "Cache 30s no edge function").
- **Edge Functions**: 93 ativas (contagem manual), 93 % com nome em português; padrões `cron-*` (robôs-relógio), `webhook*`, `notificar-*`, `admin-*`, `gerar-pdf-*`, `google-*` (OAuth próprio), `impersonate-user`.
- **Extensões**: 78 disponíveis, 14 instaladas (lista na seção 3.1).

Leitura para a Máquina: um backend real e grande tem **dezenas de alertas legítimos**. A Vistoria precisa de três coisas que o painel do Supabase não dá: (1) agrupar por peça, não por regra; (2) reconhecer intenção gravada em `COMMENT` e silenciar o alerta ("cadeado sem chave · de propósito · só o sistema"); (3) separar o que impede publicar (ERROR) do que é dívida (INFO), com o número no cabeçalho, não 251 linhas.

---

## 5. Armadilhas (o que dá errado que a Máquina tem de mostrar antes de "Publicar")

1. **E-mail de teste**: 2/hora e só para a equipe; o cliente do Theus nunca recebe o link mágico. Peça Carteiro em âmbar até ter SMTP. [auth-smtp]
2. **Chave secreta na Tela**: pula toda RLS; no navegador devolve 401, mas em app desktop/Electron passa. Cofre vermelho. [api-keys]
3. **Gaveta no armário da frente sem Chave**: pública por definição. Advisor 0013. [RLS]
4. **`user_metadata` na Chave**: o usuário edita; usar `app_metadata` via hook Custom Access Token. Advisor 0015. [RLS; auth-hooks]
5. **Chave sem `(select …)`**: RLS avaliada linha a linha, gaveta grande fica lenta. Advisor 0003. [RLS]
6. **Fio sem marcador** e **marcadores nunca usados**: os dois maiores volumes no projeto real (46 e 238). [MCP]
7. **`postgres_changes` em gaveta com muitos assinantes**: 100 checagens por mudança; trocar por Broadcast do banco. [postgres-changes]
8. **Presença para cursor**: inunda; usar Broadcast. [presence]
9. **Backup não guarda o Depósito**: só metadados; arquivo apagado não volta. [backups]
10. **Free pausa em 1 semana**; PITR exige Small e custa US$ 100/mês/7 dias. [pricing; backups]
11. **Porta demora**: 2 s de CPU por pedido, 150/400 s de parede; portas 25/587 fechadas (nada de SMTP direto da função). [functions/limits]
12. **Restrição de rede desliga o cabo direto das Edge Functions** (usar supabase-js). [network-restrictions]
13. **Ramo não traz dados nem arquivos**: "encher de exemplo" (`MAQUINA.md` §6) é obrigatório, não luxo. [branching]
14. **Extensão em `public`** expõe tabelas internas (PostGIS). [postgis; advisors 0014]
15. **`anon`/`service_role` legados acabam no fim de 2026**: a Máquina deve gerar código com `sb_publishable_`/`sb_secret_`. [api-keys]
16. **Timeouts por papel** (3 s anon, 8 s authenticated): uma Porta do banco que passa disso falha só para visitante. [timeouts]
17. **JWT expirado derruba o Cano**: canal privado desconecta se não chega token novo. [realtime/authorization]
18. **pg_net não sobrevive a crash** (tabelas unlogged): robô que "avisa" não é garantia de entrega; para garantia, Cano-fila. [pg_net]
19. **Limite de 8 robôs-relógio ao mesmo tempo, 10 min cada.** [cron]
20. **MCP em produção**: a própria doc pede read-only e escopo por projeto por causa de prompt injection; combina com a regra 2 do `MAQUINA.md` ("nada mexe em produção pela Máquina"). [mcp]

---

## 6. O que ninguém fez (com a anterioridade lida)

- O Supabase **já tem** Visual Schema Designer, Policy Templates, User Impersonation, AI Assistant, Advisors e um Platform Kit para embutir o painel em outro produto. Ou seja: desenhar tabelas visualmente e testar "como quem" **não** é novidade. [features; ui]
- O que **não** existe em lugar nenhum lido: (1) as peças com nome de gente e a frase em português gravada no próprio banco (`COMMENT ON`); (2) a máquina que **se monta enquanto o agente escreve a migração**, com linha do tempo por pessoa; (3) o **pedido de teste animando** pela Portaria → Porta → Gaveta → Robô → Cano → Tela, e o cadeado acendendo em vermelho quando a outra empresa tenta; (4) a **Vistoria que lê a intenção** e distingue "aberto por descuido" de "fechado de propósito"; (5) o **Carteiro** como peça (o Supabase esconde o SMTP em uma aba de configuração; é o item nº 1 do checklist de produção); (6) **Casa de Máquinas** como um painel em uma linha (plano, compute, backup, réplica, muro) para o empresário, em vez de seis páginas de Settings; (7) presets de backend (peças + fios) que passaram no teste, por pessoa, com contagem de uso (o Supabase tem templates de política e blocos de UI, não de máquina inteira).
- A UI Library do Supabase tem **Realtime Cursor, Avatar Stack, Monaco e Flow colaborativos**: são exatamente os canos que a Tela e a Máquina do Babel Coop precisam; podem entrar como presets de Tela sem reinventar, e o "Realtime Flow" (React Flow) é anterioridade do palco de peças com fios.

---

## 7. Como a Máquina lê e conecta cada peça (resumo operacional)

| Peça | De onde a Máquina lê | Pelo MCP oficial |
|---|---|---|
| Armário, Gaveta, Campo, Fio, vitrine, janela | `information_schema`, `pg_class`, `pg_constraint`, `pg_foreign_table` | `list_tables` (verbose) |
| Chave | `pg_policies` + `COMMENT ON POLICY` | `execute_sql` (read-only) |
| Robô | `pg_trigger`, `pg_proc`, `cron.job`, `supabase_functions.hooks`, Auth Hooks (config) | `execute_sql`, `list_edge_functions` |
| Porta | `supabase/functions/*`, `pg_proc` exposto, `verify_jwt` | `list_edge_functions`, `get_edge_function` |
| Portaria, Carteiro | config de Auth (Management API `/auth/config`) | (não há tool; Management API) |
| Depósito | `storage.buckets`, políticas em `storage.objects` | grupo `storage` (desligado por padrão) |
| Cofre | nomes em `Deno.env.get`, `process.env`; `vault.secrets` (só nomes) | `get_publishable_keys` |
| Cano | publicação `supabase_realtime`, `realtime.messages` políticas, `pgmq` filas, pipelines | `execute_sql` |
| Ferramenta | `pg_extension` | `list_extensions` |
| Casa de Máquinas | Management API (compute, disco, backups, réplicas, domínio, rede, SSL) | `get_project` |
| Vistoria | Advisors | `get_advisors` |
| Diário | Logs Explorer | `query_logs` |
| Ambiente (local · ramo · produção) | CLI `supabase start`, ramos | `list_branches`, `create_branch`, `merge_branch` |
| O que muda / Publicar | `supabase/migrations`, `schema_migrations` | `list_migrations`, `apply_migration` (nunca em produção pela Máquina) |

---

## 8. Fontes lidas (URL efetivamente aberta)

Índice e produtos: https://supabase.com/docs/guides/getting-started/features · https://supabase.com/docs/guides/database/overview · https://supabase.com/docs/guides/auth · https://supabase.com/docs/guides/storage · https://supabase.com/docs/guides/functions · https://supabase.com/docs/guides/realtime · https://supabase.com/docs/guides/ai

Database: https://supabase.com/docs/guides/database/tables · https://supabase.com/docs/guides/database/postgres/row-level-security · https://supabase.com/docs/guides/database/database-advisors · https://supabase.com/docs/guides/database/functions · https://supabase.com/docs/guides/database/postgres/triggers · https://supabase.com/docs/guides/database/postgres/roles · https://supabase.com/docs/guides/database/postgres/indexes · https://supabase.com/docs/guides/database/postgres/timeouts · https://supabase.com/docs/guides/api/using-custom-schemas · https://supabase.com/docs/guides/graphql · https://supabase.com/docs/guides/database/extensions · https://supabase.com/docs/guides/database/extensions/pgvector · https://supabase.com/docs/guides/database/extensions/postgis · https://supabase.com/docs/guides/database/extensions/pg_net · https://supabase.com/docs/guides/database/extensions/wrappers/overview · http://fdw.dev/ · https://supabase.com/docs/guides/database/webhooks · https://supabase.com/docs/guides/cron · https://supabase.com/docs/guides/queues · https://supabase.com/docs/guides/queues/api · https://supabase.com/docs/guides/database/vault · https://supabase.com/docs/guides/database/replication · https://supabase.com/docs/guides/platform/read-replicas · https://supabase.com/docs/guides/database/connecting-to-postgres · https://supabase.com/docs/guides/database/connection-management · https://supabase.com/docs/guides/deployment/branching · https://supabase.com/docs/guides/deployment/database-migrations · https://supabase.com/docs/guides/local-development/declarative-database-schemas · https://supabase.com/docs/guides/platform/backups · https://supabase.com/docs/guides/database/orioledb · https://supabase.com/docs/guides/ai/automatic-embeddings

Auth: https://supabase.com/docs/guides/auth/auth-anonymous · https://supabase.com/docs/guides/auth/auth-captcha · https://supabase.com/docs/guides/auth/rate-limits · https://supabase.com/docs/guides/auth/auth-smtp · https://supabase.com/docs/guides/auth/auth-hooks · https://supabase.com/docs/guides/auth/auth-mfa · https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml · https://supabase.com/docs/guides/auth/signing-keys · https://supabase.com/docs/guides/auth/third-party/overview · https://supabase.com/docs/guides/auth/oauth-server · https://supabase.com/docs/guides/api/api-keys

Storage: https://supabase.com/docs/guides/storage/buckets/fundamentals · https://supabase.com/docs/guides/storage/uploads/file-limits · https://supabase.com/docs/guides/storage/security/access-control · https://supabase.com/docs/guides/storage/serving/image-transformations · https://supabase.com/docs/guides/storage/uploads/resumable-uploads · https://supabase.com/docs/guides/storage/cdn/smart-cdn · https://supabase.com/docs/guides/storage/s3/authentication · https://supabase.com/docs/guides/storage/analytics/introduction · https://supabase.com/docs/guides/storage/vector/introduction · https://supabase.com/docs/guides/storage/vector/querying-vectors · https://supabase.com/docs/guides/storage/vector/limits

Edge Functions: https://supabase.com/docs/guides/functions/secrets · https://supabase.com/docs/guides/functions/limits · https://supabase.com/docs/guides/functions/regional-invocation · https://supabase.com/docs/guides/functions/background-tasks · https://supabase.com/docs/guides/functions/websockets · https://supabase.com/docs/guides/functions/ephemeral-storage · https://supabase.com/docs/guides/functions/schedule-functions · https://supabase.com/docs/guides/functions/ai-models

Realtime: https://supabase.com/docs/guides/realtime/postgres-changes · https://supabase.com/docs/guides/realtime/broadcast · https://supabase.com/docs/guides/realtime/presence · https://supabase.com/docs/guides/realtime/authorization · https://supabase.com/docs/guides/realtime/limits

Plataforma: https://supabase.com/docs/guides/getting-started/mcp · https://supabase.com/docs/guides/platform/custom-domains · https://supabase.com/docs/guides/platform/network-restrictions · https://supabase.com/docs/guides/platform/ssl-enforcement · https://supabase.com/docs/guides/platform/privatelink · https://supabase.com/docs/guides/security/product-security · https://supabase.com/docs/guides/security/soc-2-compliance · https://supabase.com/docs/guides/security/hipaa-compliance · https://supabase.com/docs/guides/telemetry/logs · https://supabase.com/docs/guides/telemetry/reports · https://supabase.com/docs/guides/platform/log-drains · https://supabase.com/docs/reference/api/introduction · https://supabase.com/docs/guides/deployment/terraform · https://supabase.com/docs/guides/platform/compute-and-disk · https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users · https://supabase.com/pricing · https://supabase.com/docs/guides/deployment/going-into-prod · https://supabase.com/ui · https://supabase.com/ui/docs/getting-started/introduction

MCP oficial do Supabase (sessão de 23/09/2026, projeto `pdamarjxcmkzbhqxtapl`): `list_projects`, `list_extensions`, `list_tables(public)`, `list_edge_functions`, `get_advisors(security)`, `get_advisors(performance)`, `search_docs`.

Não abriram (404, não usados como fonte): `/docs/guides/auth/oauth-server/overview`, `/docs/guides/storage/vectors`, `/docs/guides/storage/vector-buckets`, `/docs/guides/storage/vectors/introduction`, `/docs/guides/platform/reports`, `/docs/guides/auth/user-impersonation`.

---

## 9. Rodada 2 · verificação por WebFetch (23/09/2026, ~8h30) · correções e achados novos

### 9.1 O que foi reconferido (13 páginas relidas) e o que mudou

| Afirmação da rodada 1 | Resultado da releitura | Estado |
|---|---|---|
| Índice de features com "~75 recursos em 9 grupos" | A página lista **79 recursos em 8 grupos** (Auth 18, Database 21, Functions 3, Platform 16, Realtime 5, Storage 8, Studio 8, Vector 2); alguns aparecem em dois grupos (Foreign Key Selector, Log Drains, User Impersonation, Postgres Roles). **Queues não aparece no índice** (só tem guia próprio). | **CORREÇÃO** · https://supabase.com/docs/guides/getting-started/features |
| Advisors: "30 regras (23 de segurança, 7 de performance)" | 30 regras confirmadas, mas **a página não tem divisão Security/Performance por cabeçalho**: é uma lista única "Available checks". O que está explícito é o **nível**: **7 ERROR** (0002, 0010, 0013, 0015, 0019, 0021, 0023), **16 WARN** (0003, 0006, 0009, 0011, 0014, 0016, 0017, 0018, 0020, 0022, 0024–0029) e **7 INFO** (0001, 0004, 0005, 0007, 0008, 0012, 0030). Frase literal: os advisors "inspect the live schema and return deterministic findings, such as missing indexes or incorrectly configured RLS policies", acessíveis por Studio, MCP, CLI e Management API. Para a Máquina o que importa é o nível (ERROR trava Publicar; WARN é âmbar; INFO é dívida), não a categoria. | **CORREÇÃO** · https://supabase.com/docs/guides/database/database-advisors |
| E-mail padrão do Auth: 2/hora, só para a equipe; SMTP próprio começa em 30/h | Confirmado literalmente: "will refuse to deliver messages to addresses that are not part of the project's team", "Currently this value is set to 2 messages per hour", e após SMTP próprio "a low rate-limit of 30 messages per hour is imposed". Provedores citados: Resend, AWS SES, Postmark, Twilio SendGrid, ZeptoMail, Brevo. | confirmado · https://supabase.com/docs/guides/auth/auth-smtp |
| Chaves `sb_publishable_`/`sb_secret_`; legadas até o fim de 2026; secreta dá 401 no navegador | Confirmado: "Supabase is deprecating the `anon` and `service_role` keys by the end of 2026"; a publicável "only reaches what Row Level Security allows"; a secreta usa `service_role` com `BYPASSRLS` e devolve "HTTP 401 Unauthorized" quando enviada de navegador (valida o `User-Agent`). | confirmado · https://supabase.com/docs/guides/api/api-keys |
| Realtime `postgres_changes`: 100 checagens por mudança | Confirmado e ampliado: "Postgres Changes authorizes every event against each subscriber"; as mudanças são "processed on a single thread to preserve their order", o throughput escala com "the number of subscribers", não com a taxa de escrita; acima de **~3.000 assinantes** na mesma mudança a doc manda usar Broadcast ("sends each change once and fans it out"); "RLS policies are not applied to `DELETE` statements". | confirmado + novo · https://supabase.com/docs/guides/realtime/postgres-changes |
| Limites das Edge Functions | Confirmado: 256 MB, 2 s de CPU, 150 s (Free) / 400 s (pago) de parede, idle 150 s, 100/1.000/2.000/ilimitadas funções por plano, 100 segredos de até 48 KiB, portas 25 e 587 bloqueadas. Novo: tamanho máximo da função "20MB" (CLI) e "5MB" (painel, conforme a leitura), log de 10.000 caracteres, 100 eventos de log por 10 s, chamadas recursivas ~5.000/min. | confirmado + novo · https://supabase.com/docs/guides/functions/limits |
| Branching: clone com Edge Functions e config, sem dados/Storage | Confirmado: "Each new branch is created as a clone of your main project. It starts with that project's Edge Functions deployed and the configuration set" e "By default, new branches do not start with any data or storage objects". Mesclar: Clone → Pull → Health → Configure → Migrate → Seed → Deploy; "If a parent deployment step fails, all dependent child steps will be skipped". **A página não cita CLI, MCP nem custo**; a criação por MCP está evidenciada pela ferramenta `create_branch` do servidor conectado, e o custo (US$ 0,01344/ramo/hora) vem da página de preços lida na rodada 1. | confirmado (com ressalva de fonte) · https://supabase.com/docs/guides/deployment/branching |
| MCP oficial: "oito grupos" | A página fala em **sete grupos** (Database, Debugging, Development, Edge Functions, Account management, Docs, Branching) **mais Storage**, com "all groups except Storage enabled by default"; autenticação por "dynamic client registration" (login na conta, sem token manual; token pessoal só para CI); parâmetros `read_only=true`, `project_ref=`, `features=`; risco principal "prompt injection". | ajuste de contagem · https://supabase.com/docs/guides/getting-started/mcp |
| Depósito: privado padrão, público só libera download | Confirmado: em bucket público "anyone who possesses the asset URL can readily access the file", mas "Access control is still enforced for other types of operations including uploading, deleting, moving, and copying"; público "are cached differently" (mais rápido). Limites por plano: **Free 50 MB, Pro 500 GB, Team 500 GB, Enterprise personalizado**; limite por bucket "não pode ser superior a este limite global". | confirmado · https://supabase.com/docs/guides/storage/buckets/fundamentals ; https://supabase.com/docs/guides/storage/uploads/file-limits |
| Queues: entrega garantida | Confirmado: "Messages added to Queues are guaranteed to be delivered to your consumers" e "delivered exactly once to a consumer within a customizable visibility window"; RLS nas filas. **Estágio não exibido na página lida** (a rodada 1 anotou Public Alpha; fica como "não confirmado nesta rodada"). | confirmado / estágio não confirmado · https://supabase.com/docs/guides/queues |
| Cron: de cada segundo a uma vez por ano; 8 jobs / 10 min | Confirmado literalmente ("anywhere from every second to once a year", "no more than 8 Jobs run concurrently. Each Job should run no more than 10 minutes"); `cron.job` e `cron.job_run_details`. | confirmado · https://supabase.com/docs/guides/cron |
| Vault: Public Alpha | **Divergência**: o índice de features diz "Vault · Public Alpha"; a página do Vault, na leitura desta rodada, se descreve como beta. Fica registrado como "estágio divergente entre índice e página". Confirmado: AEAD com libsodium, "the encryption key is never stored in the database alongside the encrypted data", "anyone that has access to the view has access to decrypted secrets"; novo: a Management API devolve a chave-raiz de 64 hexadecimais. | divergência anotada · https://supabase.com/docs/guides/database/vault |
| Auth Hooks: 6 ganchos, 2 s / 5 s, 3 tentativas | Confirmado: Before User Created, Custom Access Token, Send SMS, Send Email (Free/Pro), MFA Verification Attempt e Password Verification Attempt (só Teams/Enterprise); "Postgres Hooks have 2 seconds… HTTP Hooks should complete in 5 seconds"; "up to three retries with a back-off of two seconds" (429/503). | confirmado · https://supabase.com/docs/guides/auth/auth-hooks |
| Restrições de rede | Confirmado: cobrem "Postgres and the database pooler", não "HTTPS APIs such as PostgREST, Storage, and Auth, or to Supabase client libraries"; "Edge functions lose direct access to the database. Use supabase-js…". | confirmado · https://supabase.com/docs/guides/platform/network-restrictions |

MCP nesta rodada: `list_projects` devolveu **1 projeto** ("Plataforma Limpa", `pdamarjxcmkzbhqxtapl`, `us-east-2`, Postgres `17.6.1.063`, canal `ga`, `ACTIVE_HEALTHY`, criado em 03/02/2026); `list_extensions` devolveu a mesma lista (14 instaladas: `unaccent`, `pgcrypto`, `moddatetime`, `citext`, `pg_stat_statements`, `supabase_vault 0.3.1`, `pg_net 0.19.5`, `pg_trgm`, `vector 0.8.0`, `uuid-ossp`, `pgmq 1.5.1`, `pg_cron 1.6.4`, `hypopg`, `plpgsql`; disponíveis e não instaladas incluem `pg_graphql 1.5.11`, `wrappers 0.5.7`, `postgis 3.3.7`, `pgroonga 3.2.5`, `pgtap`, `pgaudit`, `pg_partman 5.3.1`, `index_advisor`, `wal2json`). Os números dos Advisors (1 ERROR, 239 WARN de funções, 251 políticas múltiplas, 238 índices sem uso, 46 fios sem índice, 6 RLS sem política propositais) são os da chamada `get_advisors` da rodada 1 (mesmo dia, ~8h) e **não foram repetidos** nesta rodada.

### 9.2 Achados novos (18 páginas que a rodada 1 não tinha lido)

**Changelog de 2026** (https://supabase.com/changelog) · entradas visíveis, mais recentes primeiro: 21/09 "Database Replication is now Pipelines"; 18/09 "Health Check Advisors"; 13/09 "Observability on Auto-Pilot"; 21/08 réplicas de leitura movidas para Project Settings → Infrastructure; 12/08 e 30/07 e 29/07 correções (backups pulados, credenciais após restore, métricas); 23/07 migração do endpoint `logs.all` da Management API; **22/07 "Extension version pinning is deprecated in favor of default versions"**; 21/07 "[Public Alpha] Supabase Pipelines"; 17/07 Envoy vira gateway padrão no self-hosted (breaking); **14/07 "Realtime schema is now fully locked down against modifications"**; 10/07 supabase-js passará a exigir TypeScript 5.0+; 22/06 `log_connections` desligado por padrão.

- **Health Check Advisors** (18/09/2026) · "Supabase Advisors now include service health checks: error rates across Auth, Storage, Edge Functions, and Data APIs, each with a severity level and a direct link to investigate." · Para a Máquina: a **Vistoria** deixa de ser só schema; passa a acender a **Portaria, o Depósito, as Portas e a porta automática** com a taxa de erro de cada serviço. · https://supabase.com/changelog/50577-health-check-advisors
- **Observability on Auto-Pilot** (13/09/2026) · "Prepared prompts for four monitoring roles, ready to run in Claude Routines, Codex, Cursor Automations, or any environment you choose." · Para a Máquina: o **Diário** pode ter um Robô-vigia que roda esses prompts pelo MCP e escreve no diário da peça, sem código nosso de monitoramento. · https://supabase.com/changelog/50403-observability-autopilot
- **Pipelines** (renomeado no Studio em 21/09/2026; "No API or pipeline behavior has changed") · confirma o nome da peça **Cano para o armazém**. · https://supabase.com/changelog/database-replication-renamed-pipelines
- **Extension version pinning deprecated** (22/07/2026) · a **Ferramenta** não tem mais "versão travada": mostra só ligada/desligada e o alerta `0022` quando a versão padrão mudou. · https://supabase.com/changelog
- **Realtime schema locked down** (14/07/2026) · a Máquina **nunca cria objetos no schema `realtime`**; as Chaves do Cano ficam em `realtime.messages` por política, e só. · https://supabase.com/changelog

**Papéis da organização (RBAC, GA)** · Owner ("full access to everything in organization and project resources"), Administrator (tudo, "except updating organization settings, transferring projects outside of the organization, and adding new owners"), Developer ("read-only access to organization resources and content access to project resources but cannot change any project settings"), Read-Only ("Team and Enterprise plans"); papéis por projeto também só Team/Enterprise ("will only have access to the specific projects they've been assigned to"). · Peça: **Casa de Máquinas · quem pode mexer no painel** (é o que decide quem da equipe de 11 pode apertar Publicar; Developer não muda configuração). · https://supabase.com/docs/guides/platform/access-control

**Segurança de senha** · "Anything less than 8 characters is not recommended"; exigência de dígitos/maiúsculas/símbolos configurável; "Supabase Auth uses the open-source HaveIBeenPwned.org Pwned Passwords API to reject passwords that have been leaked", **"available on the Pro Plan and above"**; senhas guardadas com bcrypt + salt em `auth.users.encrypted_password`. · Peça: **Portaria · senha** com dois chips ("mínimo 8" · "barra senha vazada ✓/✗ Pro"). · https://supabase.com/docs/guides/auth/password-security

**Site URL e Redirect URLs** · Site URL é a "default redirect URL when no `redirectTo` is specified"; "The URL in `redirectTo` should match the Redirect URLs list configuration"; curingas `*`, `**`, `?`, `[!…]`; a doc manda trocar "from `http://localhost:3000` to your production URL… This setting is critical for email confirmations and password resets". · Peça: **Portaria · endereço de volta**; alerta vermelho antes de Publicar se ainda for `localhost`. É, com o Carteiro, a causa nº 1 de "o link do e-mail não funciona". · https://supabase.com/docs/guides/auth/redirect-urls

**Sessões** · "By default, it lasts indefinitely"; access token "between 5 minutes and 1 hour" (padrão 1 h), refresh tokens "never expire but can only be used once"; limites de **time-box, inatividade e sessão única por usuário** "only available on Pro Plans and up". · Peça: **Portaria · sessão** ("dura para sempre" por padrão; "sai sozinho depois de X" só no Pro). · https://supabase.com/docs/guides/auth/sessions

**Login Web3 (GA)** · "All Solana wallets" e "All Ethereum wallets", padrão EIP-4361 (Sign in with Ethereum); contas "will not have an email address or phone number", o que "can open your project to abuse as creating a Web3 wallet account is free and easy to automate": ligar captcha e rate limits, registrar as URLs do app. · Peça: **Portaria · carteira** (com o mesmo aviso de abuso do anônimo). · https://supabase.com/docs/guides/auth/auth-web3

**Segurança por coluna** · `revoke update on table … from authenticated; grant update (title, content) …`; complementa a RLS (linhas × colunas); "This is an advanced feature. We do not recommend using column-level privileges for most users"; "Restricted roles cannot use the wildcard operator (`*`)"; coluna sem privilégio faz `select *` falhar. · Peça: **Campo · escondido** só por Gaveta-vitrine (view sem a coluna); a Máquina **não** oferece privilégio por coluna como botão, porque a própria doc desaconselha. · https://supabase.com/docs/guides/database/postgres/column-level-security

**Ao apagar (cascatas do Fio)** · CASCADE ("all related rows in the child tables are deleted as well"), RESTRICT ("the delete operation is aborted if there are any related rows"), SET NULL, SET DEFAULT, NO ACTION ("similar to RESTRICT, but… 'deferred' to the end of a transaction"); **"NO ACTION is the default behavior"**. · Peça: **Fio** ganha a pergunta "se apagar o Paciente, os Agendamentos…: apagam junto · travam · ficam sem paciente", com "travam" como padrão. · https://supabase.com/docs/guides/database/postgres/cascade-deletes

**Lista de opções (enum)** · `create type mood as enum (…)`, `alter type mood add value 'content'`; "it is unsafe to remove enum values once they have been created"; mudar valores "requires modifying the database schema (i.e.: using migrations)". · Peça: **Campo · lista de opções** com "dá para acrescentar opção; tirar, não" na ficha; a alternativa "lista que muda todo dia" vira Gaveta de opções com Fio. · https://supabase.com/docs/guides/database/postgres/enums

**Busca por texto** · `to_tsvector()` + `to_tsquery()` + `@@`, coluna gerada + índice GIN, `textSearch()` no cliente; exemplos em `'english'`; **português não é citado na página** (o Postgres tem a configuração `portuguese`, mas isto não foi confirmado nesta leitura). · Peça: **Campo · busca por palavra** (marcador GIN) e, para "parecido", `pg_trgm` (instalado no projeto do Theus) ou `pgroonga` (disponível, "all languages supported"). · https://supabase.com/docs/guides/database/full-text-search

**Proteger a Data API** · "Tables and views exposed through the Data API without RLS can be accessed by any role with matching grants"; grants mínimos por papel (opt-in); schema dedicado (`api`) para "auditar a superfície exposta"; funções pré-requisição para limite por IP/quotas; desligar a Data API se não usar client, REST nem GraphQL. **"Max rows" não aparece na página: valor padrão não confirmado.** · Peça: **Armário da frente** com contagem de gavetas expostas na moldura; botão "fechar a rua" (desligar a Data API) na Casa de Máquinas. · https://supabase.com/docs/guides/api/securing-your-api

**Ambiente local (`supabase start`)** · sobe em Docker ("you need a container runtime installed first"; Rancher, Podman, OrbStack, colima servem): Studio `127.0.0.1:54323`, **Mailpit `127.0.0.1:54324`**, API `54321` (`/rest/v1`, `/graphql/v1`, `/functions/v1`), Postgres `54322`, chaves publicável e secreta locais; `supabase stop` "without resetting your local database". · Para o **Testar** da Máquina: o Mailpit é a **caixa de correio do Carteiro de teste**: o e-mail do link mágico aparece na tela, sem SMTP, e a pessoa vê "chegou" antes de publicar. · https://supabase.com/docs/guides/local-development/cli/getting-started

**Checklist oficial de produção** · Security: RLS em toda tabela, SSL Enforcement, Network Restrictions, MFA na conta Supabase, vários owners, confirmação de e-mail, expiração de OTP, "Use a custom SMTP server for auth emails so that your users can see that the mails are coming from a trusted domain"; Performance: índices, teste de carga, "If you expect your database size to be > 4 GB, enable the Point in Time Recovery (PITR) add-on"; Availability: SMTP próprio, pausa do Free, "Database backups are not available for download for Free Plan projects", réplicas, PITR; Deployment: GitHub + branching; Rate limiting: avisar 2 semanas antes de pico, captcha, desligar link tracking no SMTP. · Para a Máquina: é a lista do botão **"O que falta para publicar"**, item por item, cada um apontando para a peça (Chave, Casa de Máquinas, Portaria, Carteiro). · https://supabase.com/docs/guides/deployment/going-into-prod

### 9.3 Peças: o que muda no dicionário depois da rodada 2

- **Nenhuma peça nova** além das quatro da rodada 1 (Armário, Ferramenta, Carteiro, Casa de Máquinas). Os recursos novos entram como **propriedades** de peças existentes: Portaria ganha *endereço de volta*, *senha*, *sessão*, *carteira*; Fio ganha *ao apagar*; Campo ganha *lista de opções (só cresce)*, *busca por palavra*, *escondido (via vitrine)*; Casa de Máquinas ganha *quem pode mexer no painel* (RBAC) e *fechar a rua*; Vistoria ganha *saúde dos serviços* (Health Check Advisors); Diário ganha *vigia* (Observability on Auto-Pilot pelo MCP); Ferramenta perde *versão travada*.
- **Ordem dos alertas antes de Publicar**, pela gravidade que a doc atribui: (1) ERROR dos Advisors; (2) Carteiro de teste (2/h, só equipe); (3) endereço de volta em `localhost`; (4) chave secreta citada em código de Tela; (5) Free pausa em 1 semana; (6) WARN; (7) INFO.

### 9.4 Fontes desta rodada (URL efetivamente aberta)

Relidas: https://supabase.com/docs/guides/getting-started/features · https://supabase.com/docs/guides/database/database-advisors · https://supabase.com/docs/guides/auth/auth-smtp · https://supabase.com/docs/guides/api/api-keys · https://supabase.com/docs/guides/realtime/postgres-changes · https://supabase.com/docs/guides/functions/limits · https://supabase.com/docs/guides/deployment/branching · https://supabase.com/docs/guides/getting-started/mcp · https://supabase.com/docs/guides/storage/buckets/fundamentals · https://supabase.com/docs/guides/queues · https://supabase.com/docs/guides/cron · https://supabase.com/docs/guides/database/vault · https://supabase.com/docs/guides/auth/auth-hooks · https://supabase.com/docs/guides/platform/network-restrictions · https://supabase.com/docs/guides/storage/uploads/file-limits · https://supabase.com/docs/guides/deployment/going-into-prod

Novas: https://supabase.com/changelog · https://supabase.com/changelog/50577-health-check-advisors · https://supabase.com/changelog/50403-observability-autopilot · https://supabase.com/changelog/database-replication-renamed-pipelines · https://supabase.com/docs/guides/platform/access-control · https://supabase.com/docs/guides/auth/password-security · https://supabase.com/docs/guides/auth/redirect-urls · https://supabase.com/docs/guides/auth/sessions · https://supabase.com/docs/guides/auth/auth-web3 · https://supabase.com/docs/guides/database/postgres/column-level-security · https://supabase.com/docs/guides/database/postgres/cascade-deletes · https://supabase.com/docs/guides/database/postgres/enums · https://supabase.com/docs/guides/database/full-text-search · https://supabase.com/docs/guides/api/securing-your-api · https://supabase.com/docs/guides/local-development/cli/getting-started

Não confirmado nesta rodada (páginas que não trouxeram o dado): valor padrão de "Max rows" da Data API (https://supabase.com/docs/guides/api não descreve); estágio de Queues (página sem estágio; ausente do índice de features); o que `supabase start` sobe segundo https://supabase.com/docs/guides/local-development/overview (a página só remete ao guia do CLI, que foi o usado).

MCP (só leitura, 23/09/2026 ~8h30): `list_projects`, `list_extensions(pdamarjxcmkzbhqxtapl)`.
