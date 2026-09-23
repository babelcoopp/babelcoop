# CADERNO · Supabase → peças da Máquina

> Missão `babel-coop/design-2030` · 23/09/2026 · consolidação do aceite A10 ("TODOS os recursos do Supabase viram peças"). Este caderno junta a frente `supabase-catalogo-de-recursos.md` (duas rodadas, 95 páginas oficiais lidas por WebFetch + MCP oficial do Supabase em modo leitura no projeto real do Theus) com o `docs/MAQUINA.md`, o `prototipo/maquina.js` / `editor.js` / `explorador.js`, o `IDEIAS.md` (§5.17, 5.18, 5.19, 15), o `docs/ESTUDO_DESIGN_2030.md` (régua de 10 pontos, veredito da identidade, M1–M8) e o `maquina-caderno-de-pecas.md` (forma, material e estados das 12 peças). O `PROMPT_AGENTICO_LP.md` entra como regra de geração (nada sem fonte, marcos, "o que não fazer").
> Pedido do Theus, literal: "entre no supabase, tipo, eu imagino transformarmos TODOS os recursos do SUPABASE, peças pra fazermos essa montagem, de maneira totalmente simples e intuitiva".
> Regra: cada afirmação sobre o Supabase aponta a URL efetivamente lida (seção 10). O que não foi confirmado está na seção 9 e **não vira fato**.
> Verificação desta consolidação (23/09/2026, ~9h): `search_docs` do MCP para Queues e "Max rows"; WebFetch em `/docs/guides/api` e `/docs/guides/queues`. Resultado na seção 9.

---

## 0. Uma ressalva antes de tudo (IDEIAS §15)

O Babel Coop **não usa Supabase para si**: cada computador sustenta o próprio HD compartilhado e o diário replicado. A Máquina desenha o backend **do projeto que a equipe constrói** (o Babel OS / "Plataforma Limpa" é o primeiro, e ele mora no Supabase: projeto `pdamarjxcmkzbhqxtapl`, Postgres 17.6, 93 Edge Functions, 14 extensões). Então "todos os recursos do Supabase" viram peças **do projeto**, lidas pelo MCP oficial e pelo repositório, nunca do próprio Babel Coop. Isso não muda nada do dicionário; muda onde a verdade mora.

## 1. Resumo em dez linhas

1. O índice oficial lista **79 recursos em 8 grupos** (Auth 18, Database 21, Functions 3, Platform 16, Realtime 5, Storage 8, Studio 8, Vector 2), cada um com estágio. Queues não está no índice (tem guia próprio). [features]
2. **As 12 peças do `MAQUINA.md` absorvem a maioria.** Precisam de **4 peças novas** (Armário = schema, Ferramenta = extensão, Carteiro = SMTP/SMS, Casa de Máquinas = infraestrutura) e **2 verbos de tela** (Vistoria = Advisors + saúde, Diário = logs). Nada mais é inventado; recursos novos entram como **propriedade** de peça existente.
3. A frase que muda tudo para o empresário: **toda Gaveta no Armário da frente (`public`) já tem uma porta automática para a rua** (REST e GraphQL gerados sozinhos); a única coisa entre a rua e os dados é a Chave. [securing-your-api]
4. Os alertas "em vermelho na própria peça" que o `MAQUINA.md` §4 já previa **existem como 30 regras nomeadas** (7 ERROR, 16 WARN, 7 INFO) e, desde 18/09/2026, também como **taxa de erro por serviço**. Não inventamos: traduzimos e agrupamos por peça. [advisors; changelog]
5. No projeto real do Theus os Advisors apontam hoje 1 ERROR, ~490 WARN e ~290 INFO legítimos. Uma Vistoria que lista regra por regra vira ruído: agrupa por peça, lê a intenção gravada em `COMMENT ON` e mostra número no cabeçalho. [MCP]
6. **Portaria** é uma peça só para 18 recursos de Auth: a diferença entre eles é chip, não peça. O que quebra primeiro em produção não é a Portaria, é o **Carteiro** (2 e-mails/hora, só para a equipe) e o **endereço de volta** em `localhost`. [auth-smtp; redirect-urls]
7. **Cofre** ganha duas chaves desenhadas (porta da frente `sb_publishable_`, chave-mestra `sb_secret_`) e o prazo: as legadas acabam até o fim de 2026. [api-keys]
8. **Cano** vira quatro variantes com textura própria: ao vivo (postgres_changes), entre telas (broadcast/presença), fila (pgmq, com garantia) e para o armazém (Pipelines). O aviso duro: ao vivo faz uma checagem por assinante e não escala além de ~3.000. [postgres-changes]
9. **Depósito** vira três variantes (arquivos, analítico, vetorial) e carrega o alerta que ninguém conta: o backup diário não guarda os arquivos, só os metadados. [backups]
10. O que ninguém fez continua sendo o mesmo: peça com nome de gente cuja frase mora no banco; a máquina que se monta enquanto o agente escreve a migração; o pedido de teste animando e o cadeado barrando; a Vistoria por peça com intenção; Carteiro e Casa de Máquinas como peças; presets de backend inteiro que nascem do teste verde.

---

## 2. Regras do dicionário

1. **Uma peça representa uma função, não um produto do Supabase.** "Auth" não é peça; **Portaria** é. "Storage" não é peça; **Depósito** é. O nome técnico fica em mono, pequeno, no rodapé da peça (`TABELA · pacientes`).
2. **Peça nova só quando o recurso não guarda, não roda, não protege, não entra, não sai e não liga nada do que já existe.** Foi o teste que deixou passar só quatro: Armário (onde a gaveta fica), Ferramenta (habilidade), Carteiro (entrega de mensagem), Casa de Máquinas (chão).
3. **Recurso que muda o comportamento de uma peça vira propriedade (chip em português), não peça.** MFA é chip da Portaria; transformação de imagem é chip do Depósito; CASCADE é uma pergunta do Fio.
4. **Variante é a mesma peça com um adjetivo**: Gaveta-vitrine, Gaveta-janela, Gaveta-fila; Depósito analítico, Depósito vetorial; Cano-fila, Cano para o armazém; Robô-relógio. Mesma forma, mesmo lugar na paleta, um rótulo mono a mais.
5. **A frase em português mora no banco**: `COMMENT ON TABLE / POLICY / FUNCTION / TRIGGER`. A Máquina reconhece os padrões comuns; o que não reconhece, o agente traduz uma vez e grava. É isso que permite à Vistoria distinguir "cadeado sem chave por descuido" de "fechado de propósito" (no Babel OS, 6 tabelas assim, todas com comentário). [MAQUINA §2; MCP]
6. **O estágio oficial (GA · Beta · Public Alpha) aparece na ficha da peça**, em mono, para o empresário saber o que é sólido e o que é experimento. [features]
7. **A Máquina só lê pelo MCP oficial e pelo repositório; escreve só em local ou ramo** (`read_only=true` + `project_ref=`; a doc pede isso por causa de prompt injection). Combina com a regra 2 do `MAQUINA.md`. [mcp]
8. **Design segue a régua do estudo 2030**: nada aceso quando nada muda; luz só por evento e esfriando pela meia-vida (6 s); cor por função; pessoa como fita de 3 px; sem glow, sem vidro, sem emoji como glifo; hairline ≥ 3:1; `prefers-reduced-motion` reduz e não remove. (Formas e estados detalhados no `maquina-caderno-de-pecas.md`; aqui só o que o Supabase acrescenta.)

---

## 3. O mapa: 79 recursos → 16 peças + 2 verbos

| Grupo oficial | Recursos (estágio) | Peça |
|---|---|---|
| Database | Postgres database (GA) · Compute/Disk · Backups (GA) · PITR · Read Replicas (GA) · Poolers (Supavisor Beta, Dedicated GA) · OrioleDB (Alpha) | **Casa de Máquinas** |
| Database | Tables · Columns · Views/Materialized · Foreign tables (Wrappers GA) · pgmq tables | **Gaveta** (+ vitrine, janela, fila) · **Campo** |
| Database | Foreign keys (Foreign Key Selector GA) · cascatas | **Fio** |
| Database | RLS/Policies (GA) · Policy Templates (GA) · Column-level (não oferecido) | **Chave** |
| Database | Schemas · Exposed schemas · Data API on/off | **Armário** |
| Database | Extensions (GA) · pgvector (GA) · PostGIS · pg_graphql · pg_trgm · pgroonga · pgtap · index_advisor… | **Ferramenta** (+ Campo · vetor / lugar / busca) |
| Database | Functions/RPC · Triggers · Webhooks (Beta) · Cron (Beta) · pg_net · Automatic Embeddings (GA) · Auth Hooks (Beta) | **Robô** (Porta quando a Tela chama) |
| Database | Vault (índice: Public Alpha; página: beta) · Edge Function Secrets · API keys (GA) | **Cofre** |
| Database | Branching (Beta) · Migrations (GA) · Declarative Schemas (GA) · Terraform (Alpha) | **cabeçalho de ambiente** + **O que muda / Publicar** |
| Database | Security & Performance Advisor (GA) · Health Check Advisors (18/09/2026) | **Vistoria** (verbo) |
| Database | Queues (estágio não declarado) · Pipelines (Public Alpha) | **Cano** (fila · armazém) |
| Auth (18) | Email/senha · link mágico · OTP · telefone · 19 sociais · OAuth/OIDC · SAML (GA) · anônimo · Web3 (GA) · MFA (GA) · Captcha (GA) · Rate limits · Sessions · Password security · JWT Signing Keys (GA) · Third-Party (GA) · OAuth 2.1 Server (Public Beta) · Hooks (Beta) · User Impersonation (Public Beta) · Email Templates · Server-side Auth | **Portaria** (todos como chips) · Hooks = **Robô na Portaria** · Impersonation = "como quem" do Testar |
| Auth | Custom SMTP · Send Email/SMS hooks · provedores de SMS | **Carteiro** |
| Storage (8) | Files buckets · Analytics (Alpha) · Vector (Alpha) · público/privado · limites · Image transformations (GA) · Resumable (GA) · CDN/Smart CDN (GA) · S3 (GA) | **Depósito** (3 variantes + chips) |
| Functions (3) | Edge Functions (GA) · Regional invocation (GA) · Ephemeral/Persistent storage (GA) · Background tasks · WebSockets · Secrets · AI models | **Porta** · Robô atrás da Porta · Cano preso à Porta · Cofre |
| Realtime (5) | Postgres Changes (GA) · Broadcast (GA) · Broadcast from DB (Public Beta) · Presence (GA) · Authorization (Public Beta) · Replay (Alpha) | **Cano** (ao vivo · entre telas) · **Chave no Cano** |
| Platform (16) | Custom domains (GA) · Network restrictions (GA) · SSL enforcement (GA) · PrivateLink (Beta) · SOC 2 · HIPAA · RBAC (GA) · Logs (GA) · Reports (GA) · Log Drains (GA) · Management API · CLI · MCP (Alpha) · Terraform | **Casa de Máquinas** · **Diário** (verbo) · MCP = mãos do agente |
| Studio (8) | Table/SQL Editor · Visual Schema Designer (GA) · Policy Templates · FK Selector · User Impersonation · AI Assistant (Alpha) · Advisor · Log Drains | **sem peça** (anterioridade; ver §5) |
| Vector (2) | pgvector (GA) · Vector Buckets (Alpha) | Campo · vetor · Depósito vetorial |
| UI Library | Auth blocks, Realtime Cursor/Chat/Flow, Dropzone, Platform Kit | presets de **Tela** com Portaria e Cano já ligados |

Conferência: cada um dos 79 tem peça, verbo ou lugar declarado nesta tabela ou na seção 5.

---

## 4. As fichas

Formato: **recursos do Supabase** · **o que faz** (uma frase) · **precisa de** · **conecta com** · **alerta quando** (regra do Advisor entre parênteses) · **como se monta** · **forma visual** (o que o Supabase acrescenta à ficha do `maquina-caderno-de-pecas.md`).

### 4.1 Gaveta (tabela; variantes vitrine, janela, fila)

- **Recursos**: tabela (`create table`), view e materialized view (**vitrine**), foreign table via Wrappers (**janela**: Stripe, Airtable, BigQuery, ClickHouse, Firebase, MongoDB, MySQL, Redis, S3, SQL Server, Auth0, Cognito; WASM: Notion, HubSpot, Shopify, Slack, Snowflake, Clerk, Cal.com…), tabela `pgmq.q_*` (**fila**, quando exposta), publicação `supabase_realtime`, endpoint REST/GraphQL automático, Table Editor. [tables; wrappers; fdw.dev; graphql]
- **O que faz**: guarda as linhas de uma coisa (pacientes, pedidos) e, se estiver no Armário da frente, já atende pela rua.
- **Precisa de**: um Armário; uma **etiqueta** (chave primária `uuid`/`identity`); uma Chave se estiver no Armário da frente. Vitrine precisa das gavetas de origem; janela precisa da Ferramenta `wrappers` e de credencial no Cofre-do-banco.
- **Conecta com**: Fios (relação), Chave (cadeado na frente), Robôs (pino inferior), Cano (pino inferior), Porta (pino de entrada), Depósito (via Campo · arquivo), Tela (pela porta automática, sem Porta própria).
- **Alerta quando**: no Armário da frente sem RLS → "⚠ gaveta aberta para a rua" (0013 ERROR); vitrine com SECURITY DEFINER → "vitrine pula o cadeado" (0010 ERROR, 1 caso no Babel OS); vitrine expondo `auth.users` → "vitrine mostra a lista de usuários" (0002 ERROR); materializada na API → "vitrine congelada na rua" (0016); janela na API → "janela aberta para a rua" (0017); sem etiqueta → "gaveta sem etiqueta" (0004 INFO); visível no GraphQL para anônimo/logado (0026/0027); inchada (0020); sem faxina automática (0030); "por empresa, mas aberta" (regra própria do `MAQUINA.md` §3).
- **Como se monta**: arrastar da paleta para o palco (nasce no Armário da frente, tracejada, com etiqueta e sem Chave: a Vistoria acende na hora); arrastar para dentro da moldura Empresa (o agente põe `tenant_id`, chave e índice); pelo terminal ("cria uma gaveta de retornos separada por clínica"). Vitrine: botão-direito numa gaveta → "criar vitrine" → escolher campos (é assim que se esconde um campo; ver Campo). Janela: arrastar "Gaveta-janela" → escolher a origem numa lista em português ("Stripe · assinaturas") → escolher a credencial no Cofre. A migração é escrita pelo agente; a peça vira sólida quando aplica.
- **Forma visual**: caixa com frente (keycap), campos como linhas, cadeado à direita, rodapé mono `TABELA · pacientes · 50 linhas · GA`. Vitrine: mesma caixa com a frente em **contorno** e o rótulo `VITRINE · só mostra, não guarda`. Janela: caixa com a frente **tracejada** e rótulo `JANELA · os dados moram no Stripe`. Fila: caixa baixa com rótulo `FILA · 12 esperando`. **Porta automática**: um pequeno pino cinza na borda esquerda com o rótulo `rua`, presente em toda gaveta do Armário da frente (é o que diz "isto já é público por definição").

### 4.2 Campo (coluna)

- **Recursos**: coluna e tipo; enum; `vector(n)` (pgvector); `geography` (PostGIS); `jsonb`; `tsvector` gerado + índice GIN (busca por texto); pg_trgm/pgroonga (parecido); índices (B-Tree, parcial, `concurrently`), Index Advisor; column-level security (lido, **não oferecido**). [tables; enums; full-text-search; pgvector; postgis; indexes; column-level-security]
- **O que faz**: um dado da gaveta, com tipo em português.
- **Precisa de**: a gaveta. Vetor precisa da Ferramenta `vector`; lugar precisa de `postgis`; busca por palavra precisa do marcador GIN; "parecido" precisa de `pg_trgm` ou `pgroonga`.
- **Conecta com**: só o Campo "ligação com X" tem pino (de onde sai o Fio); o Campo "arquivo" aponta para um Depósito; o Campo "vetor" costuma ter um Robô de embeddings atrás.
- **Alerta quando**: sensível à vista na API → "campo sensível à vista" (0023 ERROR); tipo `reg*` → "tipo trava upgrade" (0018); marcador repetido (0009); marcador nunca usado (0005 INFO, **238 no Babel OS**); ligação sem marcador (0001 INFO, 46 no Babel OS); coluna de política sem índice (a doc de RLS manda indexar).
- **Como se monta**: dentro da gaveta, "+ campo" → nome em português → tipo numa lista: **texto, número, dinheiro, data, data e hora, sim/não, lista de opções, código, ligação com <gaveta>, arquivo, caixa livre, vetor, lugar**; chips opcionais: **obrigatório**, **único**, **marcador** (índice), **busca por palavra**. Lista de opções mostra "dá para acrescentar opção; tirar, não" e, se a lista muda todo dia, sugere "vira gaveta com fio". **Esconder um campo** = criar vitrine sem ele (a Máquina não oferece privilégio por coluna: a doc diz "we do not recommend… for most users" e `select *` falha).
- **Forma visual**: linha de 24 px com glifo do tipo (¶ # $ ▭ ◐ ≡ ⌗ = ▣ {} e dois novos: **∿** vetor, **⌖** lugar), nome em Plex, tipo em mono apagado; chip `marcador` em mono quando indexado; alerta em vermelho na própria linha.

### 4.3 Fio (chave estrangeira)

- **Recursos**: foreign key; comportamento ao apagar (CASCADE, RESTRICT, SET NULL, SET DEFAULT, NO ACTION = padrão); embed do PostgREST (`select('*, pacientes(*)')`) e navegação do GraphQL; Foreign Key Selector do Studio. [cascade-deletes; graphql; features]
- **O que faz**: diz que cada linha de uma gaveta pertence a uma linha de outra.
- **Precisa de**: as duas gavetas e um Campo · ligação; nasce **sempre com marcador** (índice), porque 0001 é o alerta mais comum.
- **Conecta com**: Gaveta → Gaveta (pino do Campo · ligação até a etiqueta da outra). Nunca liga a `auth.users` por coluna única (0021).
- **Alerta quando**: sem marcador → "fio sem marcador" (0001 INFO); preso em coluna única de `auth.users` → "fio preso na Portaria trava atualizações" (0021 ERROR); solto (gaveta apagada) → tracejado vermelho.
- **Como se monta**: puxar do pino do Campo · ligação até a outra gaveta; ao soltar, **uma pergunta em português**: "se apagar o Paciente, os Agendamentos: **travam** (padrão) · apagam junto · ficam sem paciente". Hover mostra a frase "cada Agendamento pertence a um Paciente" (do `COMMENT ON CONSTRAINT`).
- **Forma visual**: cabo fino 1,5 px com losango na ponta "muitos"; um pequeno rótulo mono na curva com o comportamento ao apagar quando não é o padrão (`apaga junto` em âmbar: é a decisão que mais surpreende leigo).

### 4.4 Chave (política RLS, no que for)

- **Recursos**: RLS e policies (`using` / `with check`, por comando), `auth.uid()`, `auth.jwt()`, `app_metadata`, `aal`; RLS em `storage.objects`, em `realtime.messages`, nas filas `pgmq.q_*`; Policy Templates do Studio; timeouts por papel. [row-level-security; access-control (storage); realtime/authorization; queues/quickstart; timeouts]
- **O que faz**: decide quem vê e quem muda cada linha, como um WHERE automático que o banco aplica sempre.
- **Precisa de**: RLS ligado na gaveta (a Máquina liga junto); para "cada empresa vê só o seu", o crachá com `tenant_id` em `app_metadata` (Robô na Portaria · Custom Access Token); para "só com segunda tranca", MFA ligado na Portaria.
- **Conecta com**: mora na Gaveta, no Depósito, no Cano e na Fila (mesmo cadeado); no Testar é o filtro no fio onde o pulso da outra empresa morre.
- **Alerta quando**: `true` → "⚠ chave aberta para todos" (0024); lê `user_metadata` → "chave confia em dado que o usuário edita" (0015 ERROR); `auth.uid()` sem `(select …)` → "chave lenta: confere pessoa por pessoa" (0003); várias permissivas para o mesmo papel/comando → "duas chaves abrem a mesma porta" (0006, **251 no Babel OS**); política existe mas RLS desligado (0007); RLS ligado sem política → "cadeado sem chave: ninguém entra" (0008) **silenciado quando o `COMMENT` diz "de propósito · só o sistema"**; coluna filtrada sem índice.
- **Como se monta**: clicar no cadeado → escolher na Mesa: **cada empresa vê só o seu · só o dono · todos leem, só o dono muda · só com segunda tranca · só o sistema (de propósito) · aberta ⚠**. Para o Depósito: **cada um vê a própria pasta · cada empresa vê a própria pasta · vitrine (qualquer um baixa)**. A Máquina gera sempre com `(select auth.uid())`, cria o índice da coluna filtrada e grava a frase em `COMMENT ON POLICY`. O que não cabe nas opções, o agente escreve e traduz.
- **Forma visual**: cadeado 14 px na frente da peça; preenchido = fechada, contorno = aberta + alerta; **treme e acende vermelho** só no Testar quando barra. Na ficha: a frase, o papel (visitante · pessoa logada · sistema) e o tempo-limite (3 s anon / 8 s authenticated).

### 4.5 Empresa (tenant)

- **Recursos**: não é um recurso do Supabase; é um **padrão**: `tenant_id` + Chave "cada empresa vê só o seu" + claim `tenant_id` no JWT via hook Custom Access Token + índice. [row-level-security; auth-hooks]
- **O que faz**: tudo dentro da moldura é separado por empresa.
- **Precisa de**: a gaveta Empresas (a etiqueta), o Robô na Portaria que monta o crachá, e cada gaveta dentro com `tenant_id` + Chave + marcador.
- **Conecta com**: Portaria (fio de referência "liberou"); todas as gavetas dentro.
- **Alerta quando**: gaveta dentro com `tenant_id` mas Chave diferente de "cada empresa vê só o seu" → "⚠ por empresa, mas aberta" (na gaveta); Portaria sem o Robô do crachá → "a moldura é só desenho: falta o crachá com a empresa".
- **Como se monta**: arrastar a moldura para o palco (o agente cria a gaveta Empresas e o hook); soltar gavetas dentro (a moldura "aceita" com a hairline ciano por 300 ms e o agente adiciona os três: campo, chave, índice).
- **Forma visual**: bandeja rebaixada (`--s0`), etiqueta mono `EMPRESA · cada uma vê só o seu`, e um pequeno contador no canto: `7 gavetas · 7 com chave`.

### 4.6 Portaria (Auth)

- **Recursos** (18 do índice): e-mail e senha, link mágico, OTP, telefone, 19 provedores sociais, OAuth/OIDC próprio, SSO SAML (Pro+), anônimo, Web3 (Solana/Ethereum), MFA (TOTP · telefone, add-on), Captcha (hCaptcha/Turnstile), rate limits, sessões, segurança de senha (mín. 8; senha vazada só Pro), JWT Signing Keys (P-256, rotação sem downtime), Third-Party Auth (Clerk, Firebase, Auth0, Cognito, WorkOS), OAuth 2.1 Server (ser porteiro de apps e agentes MCP), Auth Hooks (6 ganchos), User Impersonation, papéis do Postgres (anon · authenticated · service_role), Site URL e Redirect URLs. [auth; auth-mfa; auth-captcha; rate-limits; sessions; password-security; signing-keys; third-party; oauth-server; auth-hooks; auth-web3; auth-anonymous; redirect-urls; roles]
- **O que faz**: quem entra, como entra, com que crachá e por quanto tempo.
- **Precisa de**: pelo menos um jeito de entrar; um Carteiro se o jeito manda e-mail ou SMS; o **endereço de volta** apontando para o site de verdade.
- **Conecta com**: Telas (fio de fluxo "liberou"), Empresa (referência), Carteiro (fio curto), Robôs de gancho (pino inferior), Cofre (as duas chaves de API são desenhadas aqui e guardadas lá).
- **Alerta quando**: endereço de volta em `localhost` → **vermelho antes de Publicar** ("critical for email confirmations and password resets"); anônimo ou carteira ligados sem captcha e catraca → "entrada sem nome, sem teste de humano" (0012 INFO + aviso de abuso da doc); sessão "dura para sempre" em sistema de empresa → âmbar informativo ("sair sozinho depois de X só no Pro"); senha vazada não barrada → chip ✗ (Pro); taxa de erro do Auth alta → Vistoria de saúde (Health Check Advisors).
- **Como se monta**: arrastar a Portaria (só pode existir uma por Máquina); na Mesa, chips: **entra com** (e-mail e senha · link mágico · código · telefone · Google · Apple · … · empresa parceira SAML · sem se identificar · carteira), **segunda tranca** (app · SMS/WhatsApp), **teste de humano**, **catraca** (números visíveis: 30 por 5 min por IP, e-mail 2/h ou 30/h), **sessão** (para sempre · sai depois de X · um aparelho por vez), **senha** (mínimo 8 · barra vazada), **endereço de volta**, **carimbo** (trocar sem deslogar), **porteiro de fora** (Clerk…), **ser porteiro dos outros** (OAuth 2.1). Papéis do app (dono · atendente) viram chips e entram no crachá pelo Robô Custom Access Token.
- **Forma visual**: peça mais alta que larga com a **fresta** que acende verde/vermelho no Testar; chips de 4 px abaixo do nome; dois pequenos ícones de chave no rodapé (`porta da frente` · `mestra`) que apontam para o Cofre; estágio em mono (SAML GA · OAuth 2.1 Public Beta).

### 4.7 Porta (rota de API / Edge Function / função do banco chamada pela Tela)

- **Recursos**: Edge Functions (Deno, GA; 256 MB, 2 s de CPU, 150/400 s de parede, 15 regiões com São Paulo, `x-region`), `verify_jwt`, Ephemeral/Persistent storage (`/tmp`, montagem S3), WebSockets, AI models embutidos, Database Functions chamadas por `rpc()`, rota da Vercel, e a **porta automática** REST/GraphQL de cada gaveta exposta. [functions; functions/limits; regional-invocation; ephemeral-storage; websockets; database/functions]
- **O que faz**: recebe um pedido da Tela (ou de fora) e faz uma coisa com nome: "recebe paciente + quando e grava em Agendamentos".
- **Precisa de**: a frase de uma linha no topo do código (a Máquina a usa como rótulo); as chaves do Cofre que ela cita (`Deno.env.get('X')`); checagem de login quando a Tela chama.
- **Conecta com**: Tela (entrada), Gaveta (saída), Robô atrás (background task), Depósito (mão no bucket), Cano preso (WebSocket), Cofre (referência sem fio).
- **Alerta quando**: Tela chama e `verify_jwt: false` → "⚠ sem checagem de login" (vermelho; âmbar quando é webhook/cron, como os `cron-*` e `webhook*` do Babel OS); função SECURITY DEFINER executável por anon/authenticated → "porta do banco que qualquer um aciona" (0028/0029, **90 + 149 no Babel OS**); `search_path` mutável → "robô/porta sem caminho fixo" (0011); mais de 2 s de CPU → "demorou"; tenta SMTP direto (portas 25/587) → "porta não manda e-mail: use o Carteiro"; taxa de erro alta → Vistoria de saúde.
- **Como se monta**: arrastar a Porta → escrever a frase em português ("recebe X e faz Y") → o agente cria a função com o comentário; chips: **atende de** (perto do usuário · São Paulo, junto do banco), **exige login**, **responde e continua** (waitUntil), **mão no Depósito**. Uma Tela ligada direto numa Gaveta para **gravar** sugere criar a Porta no meio; para **ler** uma gaveta exposta, a porta automática basta.
- **Forma visual**: conector grande de entrada, verbo em mono (`RECEBE · GRAVA · LISTA`), forma da saída (círculo = um registro, três traços = muitos), rótulo mono do tipo por baixo (`EDGE · deno · São Paulo` ou `RPC · função do banco` ou `RUA · rest/graphql`), estágio.

### 4.8 Robô (trigger, cron, webhook, gancho, tarefa de fundo)

- **Recursos**: triggers (`before/after`, por linha/comando), Database Webhooks (Beta, trigger + pg_net), pg_cron (Beta; de cada segundo a uma vez por ano; 8 simultâneos, 10 min cada; `cron.job_run_details`), pg_net (assíncrono, timeout 2 s, 200 req/s, unlogged), Auth Hooks (Before User Created, Custom Access Token, Send Email/SMS, MFA/Password Verification), Automatic Embeddings (trigger + pgmq + cron a cada 10 s + pg_net → Edge Function), background tasks (`EdgeRuntime.waitUntil`), Broadcast from the Database (trigger → Cano), Observability on Auto-Pilot (prompts de vigia). [triggers; webhooks; cron; pg_net; auth-hooks; automatic-embeddings; background-tasks; broadcast; changelog]
- **O que faz**: quando acontece X, faz Y sozinho.
- **Precisa de**: um gatilho (gaveta + evento, ou relógio, ou a Portaria) e uma ação (função do banco, Porta, URL de fora, Cano); as Ferramentas que a ação exige (`pg_net`, `pg_cron`, `pgmq`); as chaves do Cofre-do-banco quando liga para fora.
- **Conecta com**: Gaveta (pino inferior), Portaria (pino inferior), Porta (atrás), Cano (saída), serviço externo (etiqueta `avisa: api.z-api.io`), Cofre (referência).
- **Alerta quando**: "avisa" por pg_net sem fila → "aviso sem garantia: se cair, perde" (a doc: unlogged, não sobrevive a crash) com botão "trocar por fila"; mais de 8 robôs-relógio simultâneos ou passo > 10 min; sem alvo; `search_path` mutável (0011); gancho passou de 2 s (Postgres) / 5 s (HTTP); última execução falhou (lido em `cron.job_run_details`).
- **Como se monta**: arrastar o Robô até uma Gaveta ou até a Portaria → escolher **quando** (quando entra · quando muda · quando sai · todo dia às… · a cada X · antes de criar a pessoa · ao montar o crachá) → dizer em português **o que faz** (manda WhatsApp · avisa <url> · tira a impressão digital do texto · chama a porta X · joga no cano) → o agente escreve trigger/cron/hook. Variante **Robô-vigia**: um Robô-relógio que roda os prompts de monitoramento pelo MCP e escreve no Diário.
- **Forma visual**: quadrado com engrenagem; etiqueta mono do gatilho; LED âmbar só ao disparar; um **segundo LED** pequeno com a última execução (verde/vermelho, do `cron.job_run_details`); rótulo mono por baixo (`TRIGGER` · `CRON · 08:00` · `WEBHOOK` · `GANCHO · crachá`); quando é "avisa sem garantia", a saída é um fio **pontilhado** em vez de sólido.

### 4.9 Depósito (bucket; variantes arquivos, analítico, vetorial)

- **Recursos** (8 do índice): Files bucket (CDN 285+ cidades, Smart CDN Pro+, image transformations Pro+, resumable TUS 6 MB, S3 compatibility), público × privado, limites (Free 50 MB, Pro/Team 500 GB), tipos MIME, RLS em `storage.objects`, Analytics bucket (Iceberg, Alpha), Vector bucket (S3 Vectors, Alpha: 10 × 10, 4.096 dims); backups **não incluem objetos**. [storage; buckets/fundamentals; file-limits; access-control; image-transformations; resumable-uploads; smart-cdn; s3/authentication; analytics; vector/limits; backups]
- **O que faz**: guarda arquivos (ou dados frios, ou vetores) fora das gavetas.
- **Precisa de**: uma Chave (por padrão "não permite upload sem política"); tamanho máximo e tipos aceitos; para analítico, um Cano para o armazém; para vetorial, a Ferramenta `wrappers` (`s3_vectors`) se for consultar por SQL.
- **Conecta com**: Campo · arquivo da Gaveta (entrada superior), Porta com mão no Depósito, Chave (cadeado na prateleira), Cofre (chaves S3), Cano para o armazém.
- **Alerta quando**: público com listagem aberta → "prateleira pública com lista à vista" (0025); "vitrine" (público) sem querer; sem Chave de upload → "ninguém consegue guardar aqui"; **"o backup não guarda o Depósito: arquivo apagado não volta"** (sempre visível na ficha); chaves S3 do painel citadas em Tela → vermelho (pulam a RLS); taxa de erro do Storage alta → Vistoria de saúde.
- **Como se monta**: arrastar o Depósito → nome → **prateleira trancada / na vitrine** → **até X MB** → **aceita: imagens · PDFs · vídeos · qualquer** → chips **redimensiona na hora** (Pro), **aceita arquivo grande (retoma se cair)**, **entrega pelo mundo** (padrão), **porta S3** → Chave (cada um vê a própria pasta · cada empresa · vitrine). Variantes: **analítico** (dados frios, chegam pelo Cano para o armazém) e **vetorial** (impressões digitais em volume).
- **Forma visual**: prateleira baixa com régua de uso (`1,2 GB · até 50 MB por arquivo`), cadeado, e um pequeno ícone de mundo quando entrega por CDN; analítico com a régua em **cinza frio** e rótulo `ARMAZÉM · iceberg · alpha`; vetorial com o glifo ∿ e rótulo `VETORES · 10 índices · alpha`.

### 4.10 Cofre (segredos; variantes da pessoa, das Portas, do banco)

- **Recursos**: API keys (`sb_publishable_` porta da frente; `sb_secret_` chave-mestra com BYPASSRLS, 401 no navegador; legadas `anon`/`service_role` até o fim de 2026), Edge Function Secrets (100 × 48 KiB, os `SUPABASE_*` já vêm), `.env` de cada pessoa (IDEIAS §7), **Vault** (cifra AEAD, chave nunca no banco, `vault.decrypted_secrets`), chaves S3, credenciais dos Wrappers, token do Cron → Edge Function. [api-keys; functions/secrets; vault; s3/authentication; wrappers; cron]
- **O que faz**: guarda o que nunca pode aparecer na tela, e mostra só o **nome** e se está lá.
- **Precisa de**: a lista de nomes que o código usa (`Deno.env.get`, `process.env`, `vault.secrets.name`).
- **Conecta com**: sem fio; as peças que usam uma chave mostram a etiqueta `usa: ZAPI_TOKEN`; hover na chave acende as peças que a usam.
- **Alerta quando**: chave que o código pede e ninguém tem → "✗ ZAPI_TOKEN · pedir ao Theus"; **chave-mestra citada em código de Tela → vermelho** ("pula toda RLS; o navegador barra, app desktop não"); código com `anon`/`service_role` legadas → âmbar "acaba no fim de 2026"; `vault.decrypted_secrets` com grant amplo → "quem lê a vitrine do cofre lê os segredos".
- **Como se monta**: não se arrasta; nasce sozinho do código. "Pedir ao Theus" manda a chave uma vez pelo chat direto para o cofre da pessoa. No Cofre-do-banco, "+ segredo" cria por `vault.create_secret()` (o valor é digitado uma vez e nunca mais aparece).
- **Forma visual**: obsidiana (o único polido); lista de nomes com LED; **duas chaves desenhadas** no topo (porta da frente · mestra) com "pode ir na Tela" / "nunca sai da Porta"; três abas em mono: `PESSOA · PORTAS · BANCO (vault)`.

### 4.11 Tela (página do frontend)

- **Recursos**: client libraries (JS, Flutter, Swift GA; Python Beta); a **porta automática** REST/GraphQL; assinaturas Realtime no código; Supabase UI Library (Password/Social Auth, Avatar, Dropzone, Realtime Cursor/Chat/Flow/Avatar Stack/Monaco, MCP Server com escopo de usuário, Platform Kit). [features; graphql; supabase.com/ui]
- **O que faz**: a página que a pessoa usa; a única peça cujo resultado é ela mesma.
- **Precisa de**: a chave da porta da frente (do Cofre); as Portas ou gavetas expostas que ela lê; um Cano se quer ver mudança na hora.
- **Conecta com**: Portaria (fio "liberou"), Porta (saída), Gaveta exposta (pela rua), Cano (entrada inferior). Clique abre a aba da tela (Site | Código | 3D) com a **edição na tela** do `editor.js` (clique seleciona, arraste move, duplo clique edita, Delete apaga, o código muda junto).
- **Alerta quando**: usa porta que não existe; cita chave-mestra; grava direto numa gaveta sem Porta (barrado ao ligar); usa `anon` legada.
- **Como se monta**: arrastar a Tela ou "Começar de um preset": os blocos da UI Library viram **presets de Tela com Portaria e Cano já ligados** (login com senha, login social, chat ao vivo, cursores ao vivo, arrastar arquivo para o Depósito). O agente gera o código com as chaves novas.
- **Forma visual**: miniatura real da página, sem moldura de monitor; marca da pessoa (a mesma fita do `data-por` da edição na tela); rótulo mono da biblioteca (`JS · supabase-js`).

### 4.12 Cano (ao vivo · entre telas · fila · para o armazém)

- **Recursos**: Postgres Changes (GA; uma checagem por assinante; thread única; > ~3.000 assinantes → Broadcast; RLS não vale para DELETE; gaveta precisa estar na publicação), Broadcast (GA) e Broadcast from the Database (Public Beta), Presence (GA; não para cursor), Realtime Authorization (Public Beta; RLS em `realtime.messages`; JWT expirado derruba), Replay (Alpha), limites por plano (Free 200 conexões / 100 msg/s), Queues (pgmq; entrega garantida; `pgmq_public`; RLS obrigatória se exposto), Pipelines (Public Alpha; CDC para BigQuery/ClickHouse/DuckLake/Snowflake), WebSocket em Edge Function; schema `realtime` travado desde 14/07/2026. [postgres-changes; broadcast; presence; realtime/authorization; realtime/limits; queues; queues/quickstart; replication; changelog]
- **O que faz**: leva o dado de um lugar a outro sem ninguém pedir: na hora (ao vivo), entre pessoas (entre telas), com garantia (fila) ou para longe (armazém).
- **Precisa de**: ao vivo: a gaveta na publicação + Chave; entre telas: canal privado + Chave em `realtime.messages`; fila: Ferramenta `pgmq` + Chave + um Robô que pega; armazém: publicação + slot de replicação + Depósito analítico ou destino externo.
- **Conecta com**: Gaveta → Tela (ao vivo), Tela ↔ Tela (entre telas), Robô → Fila → Robô (fila), Gaveta → Depósito analítico / fora (armazém), Porta (WebSocket).
- **Alerta quando**: fila exposta sem Chave → "cano-fila aberto na rua" (0019 ERROR); ao vivo com muitos assinantes → "não escala: trocar por transmissão do banco" (limiar ~3.000); presença usada para cursor → "inunda o canal"; sem assinante; JWT vencendo sem renovação → "o cano cai quando o crachá vence"; Robô "avisa" sem fila → sugestão "quer garantia? vira fila"; slot de replicação atrasado → "o armazém perdeu o fio (WAL)".
- **Como se monta**: puxar um Cano da Gaveta até a Tela (ao vivo; o agente adiciona a gaveta à publicação e a assinatura no código); entre duas Telas (entre telas; escolher **cursor · chat · quem está aqui**); de um Robô para outro (fila; a bolinha fica esperando até um Robô pegar); da Gaveta para fora do palco (armazém; escolher destino numa lista). A Máquina **nunca cria objetos no schema `realtime`**; só políticas em `realtime.messages`.
- **Forma visual**: tubo com hairlines, vazio em repouso; bolinhas só por evento; rótulos mono `AO VIVO · agendamentos`, `ENTRE TELAS · cursor`, `FILA · 12 esperando · garantido`, `ARMAZÉM → BigQuery · alpha`; a fila desenha bolinhas **paradas** dentro do tubo; o armazém é um tubo **longo que sai do palco**; número de conexões/mensagens do plano na ficha.

### 4.13 Armário (schema) · peça nova

- **Por que não cabia**: a Gaveta precisa estar em algum lugar, e esse lugar decide se ela tem porta na rua. Nenhuma das 12 dizia "onde".
- **Recursos**: schemas (`public`, `api`, `private`, `auth`, `storage`, `extensions`, `vault`, `pgmq`, `cron`, `net`, `realtime`), "Exposed schemas" + grants, Data API ligada/desligada, schema dedicado para auditar a superfície. [using-custom-schemas; securing-your-api]
- **O que faz**: agrupa gavetas e diz se o grupo atende pela rua.
- **Precisa de**: nada; existe `public` por padrão. Um Armário da frente extra (`api`) exige grants para `anon`/`authenticated`/`service_role`.
- **Conecta com**: contém Gavetas, Ferramentas (quando instaladas nele: alerta) e o Cofre-do-banco (`vault`); a Casa de Máquinas tem o botão "fechar a rua".
- **Alerta quando**: Ferramenta instalada no Armário da frente → "ferramenta guardada no armário da frente" (0014; PostGIS expõe `spatial_ref_sys`); contagem de gavetas expostas sem Chave no cabeçalho.
- **Como se monta**: a Máquina desenha dois por padrão: **Armário da frente** (`public`: tem porta na rua) e **Armário dos fundos** (`private`: só o sistema abre; o agente cria quando a primeira gaveta é arrastada para lá). Os armários do próprio Supabase (`auth`, `storage`, `realtime`, `vault`, `pgmq`, `cron`, `net`) aparecem **cinza, fechados**, e a Máquina não cria nada neles. "Fechar a rua" = desligar a Data API (Casa de Máquinas).
- **Forma visual**: moldura clara mais fina que a Empresa, etiqueta mono `ARMÁRIO DA FRENTE · 12 gavetas · 12 com chave · rua aberta` ou `DOS FUNDOS · só o sistema`; os do Supabase, uma fila de armários pequenos e cinza no rodapé do palco.

### 4.14 Ferramenta (extensão) · peça nova

- **Por que não cabia**: não guarda, não roda, não protege; dá uma **habilidade** à máquina (buscar por parecido, guardar lugar, agendar, ligar para fora).
- **Recursos**: extensões (78 disponíveis no projeto do Theus, 14 instaladas: `vector`, `pgmq`, `pg_cron`, `pg_net`, `supabase_vault`, `pg_trgm`, `hypopg`, `pgcrypto`, `citext`, `unaccent`, `moddatetime`, `uuid-ossp`, `pg_stat_statements`, `plpgsql`); disponíveis relevantes: `pg_graphql`, `wrappers`, `postgis`, `pgroonga`, `pgtap`, `pgaudit`, `pg_partman`, `index_advisor`, `wal2json`; "extension version pinning is deprecated" (22/07/2026). [extensions; MCP list_extensions; changelog]
- **O que faz**: liga uma habilidade para as peças usarem.
- **Precisa de**: um Armário dos fundos (`extensions`) para morar.
- **Conecta com**: sem fio; as peças que dependem dela mostram `precisa da ferramenta X` e ficam tracejadas até ela estar ligada.
- **Alerta quando**: em `public` (0014); versão padrão mudou (0022 "ferramenta desatualizada"); peça pede ferramenta desligada.
- **Como se monta**: não vai para o palco; fica na **barra da Máquina** como uma lista de chaves inglesas ligadas/desligadas com nome em português (`busca por parecido · pg_trgm`, `lugares no mapa · postgis`, `relógio · pg_cron`, `ligar para fora · pg_net`, `filas · pgmq`, `impressão digital · vector`, `janelas · wrappers`, `GraphQL · pg_graphql`, `testes do banco · pgtap`). Ligar uma = o agente escreve `create extension … with schema extensions`. Nada de "versão travada".
- **Forma visual**: ícone de traço 14 px na barra, ligado (`--s3`) / desligado (apagado); na ficha, a versão em mono e o estágio.

### 4.15 Carteiro (SMTP · SMS · WhatsApp) · peça nova

- **Por que não cabia**: é o recurso que **mais derruba um lançamento** e não é Portaria (quem entra) nem Cofre (segredo): é **quem entrega a mensagem**.
- **Recursos**: remetente padrão do Auth (2/h, só para membros da equipe, "not for production"), Custom SMTP (Resend, SES, Postmark, SendGrid, ZeptoMail, Brevo; começa em 30/h), Email Templates, provedores de SMS/WhatsApp (Twilio, MessageBird, Vonage; MFA por telefone é add-on), hooks Send Email / Send SMS, **Mailpit local** (`127.0.0.1:54324`) no `supabase start`, e a regra: Edge Functions não abrem 25/587. [auth-smtp; auth-hooks; auth-mfa; functions/limits; cli/getting-started; going-into-prod]
- **O que faz**: entrega o e-mail (link mágico, confirmação, troca de senha) e o SMS que a Portaria manda.
- **Precisa de**: um provedor com as credenciais no Cofre; o domínio remetente; o **endereço de volta** certo na Portaria.
- **Conecta com**: Portaria (fio curto), Cofre (referência), Robôs que mandam mensagem (gancho Send Email/SMS ou Porta que chama o provedor).
- **Alerta quando**: "⚠ Carteiro de teste: 2 por hora, só para a equipe" (âmbar sempre, **vermelho antes de Publicar**); SMTP próprio recém-ligado → "30 por hora até ajustar"; Porta tentando SMTP direto; link tracking do provedor ligado (o checklist manda desligar); taxa de erro do Auth alta.
- **Como se monta**: arrastar o Carteiro até a Portaria → escolher **provedor** numa lista (Resend · SES · Postmark · SendGrid · ZeptoMail · Brevo · outro) → credenciais pelo Cofre → **remetente** (nome e e-mail) → chips **SMS/WhatsApp por** (Twilio · MessageBird · Vonage). No Testar em local, a caixa de correio do Carteiro é o **Mailpit**: o e-mail aparece na Mesa e a pessoa vê "chegou" antes de publicar.
- **Forma visual**: peça pequena (96 × 48) com um envelope de traço e um contador mono `2/h · só equipe` (âmbar) ou `Resend ✓ · 30/h` (neutro); no Testar, o envelope "sai" pelo fio até a Mesa.

### 4.16 Casa de Máquinas (infraestrutura) · peça nova, painel e não peça sobre o palco

- **Por que não cabia**: é o **chão** da máquina: plano, tamanho, backup, réplica, muro, domínio, quem pode mexer. Uma peça sobre o chão para representar o chão seria mentira.
- **Recursos**: Compute (Nano grátis → Micro US$ 10 → Small US$ 15 → … → 2XL US$ 410; conexões 60/90/120…), disco (gp3/io2), poolers (Supavisor sessão 5432 / transação 6543; Dedicated), Read Replicas (GA; só SELECT; Auth/Storage/Realtime não usam), backups (Pro 7 / Team 14 / Enterprise 30 dias; Free não baixa), PITR (Small+, US$ 100/mês/7 dias, RPO 2 min), Free pausa após 1 semana, domínio próprio (US$ 10/mês, um por projeto), SSL enforcement, Network restrictions (só Postgres/pooler; Edge Functions perdem o cabo direto), PrivateLink (Team+), SOC 2, HIPAA, região, OrioleDB, RBAC da organização (Owner · Administrator · Developer · Read-Only), Data API on/off, planos. [compute-and-disk; connecting-to-postgres; read-replicas; backups; custom-domains; ssl-enforcement; network-restrictions; privatelink; soc-2; hipaa; access-control; pricing; orioledb]
- **O que faz**: mostra em uma linha o que o projeto paga e o que arrisca.
- **Precisa de**: o projeto (lido por `get_project` e pela Management API).
- **Conecta com**: tudo, por baixo. "Quem pode mexer no painel" (RBAC) é o que decide quem pode apertar **Publicar** (Developer monta peças, não muda configuração).
- **Alerta quando**: Free antes de Publicar → "Free pausa após 1 semana parado e não baixa backup"; banco > 4 GB sem PITR (checklist oficial); só um Owner; muro desligado; SSL não obrigatório; réplica ligada com a Tela achando que Auth/Storage/Realtime também vão para lá.
- **Como se monta**: não se arrasta. Cada item é um chip que abre uma escolha em português; toda mudança passa pelo agente (Management API) e aparece em "O que muda". Tem dois botões próprios: **"fechar a rua"** (desligar a Data API) e **"O que falta para publicar"** (o checklist oficial `going-into-prod`, item a item, cada um apontando para a peça responsável).
- **Forma visual**: uma linha mono fixa embaixo do palco: `Small · 2 GB · us-east-2 · backup diário 7 dias · sem PITR · 90 conexões · muro ligado · SSL ✓ · domínio próprio ✗ · Owners 1 ⚠ · Pro`. Clique abre a ficha do projeto na Mesa. Nunca seis páginas de Settings.

### 4.17 Vistoria · verbo de tela (não é peça)

- **Recursos**: Security & Performance Advisor (GA; 30 regras determinísticas; 7 ERROR, 16 WARN, 7 INFO; por Studio, MCP `get_advisors`, CLI, Management API), Health Check Advisors (18/09/2026: taxa de erro de Auth, Storage, Edge Functions e Data APIs com severidade e link). [advisors; changelog/50577]
- **O que faz**: roda as regras e acende o alerta **na peça certa**, com a frase em português (tabela completa em `supabase-catalogo-de-recursos.md` §4.1).
- **Como aparece**: botão na barra da Máquina; número no cabeçalho (`1 erro · 12 avisos · 40 dívidas`); ERROR **trava Publicar**; WARN âmbar; INFO como dívida na ficha. **Agrupa por peça, não por regra**; silencia quando o `COMMENT` diz "de propósito"; a saúde dos serviços acende Portaria, Depósito, Portas e a porta automática.
- **Ordem dos alertas antes de Publicar** (pela gravidade que a própria doc atribui): (1) ERROR dos Advisors; (2) Carteiro de teste; (3) endereço de volta em `localhost`; (4) chave-mestra em código de Tela; (5) Free pausa; (6) WARN; (7) INFO.

### 4.18 Diário · verbo de tela (não é peça)

- **Recursos**: Logs & Analytics (GA; retenção Free 1 dia / Pro 7 / Team 28 / Enterprise 90; `query_logs` no MCP), Reports (GA), Log Drains (GA; Datadog, Loki, S3, Sentry, Axiom, OTLP…), `cron.job_run_details`, `net._http_response`, Observability on Auto-Pilot (13/09/2026). [telemetry/logs; telemetry/reports; log-drains; cron; pg_net; changelog/50403]
- **O que faz**: na ficha de qualquer peça, "o que passou por aqui, quanto demorou, o que deu errado".
- **Como aparece**: aba `Diário` na ficha da peça (Porta: últimas chamadas e tempo; Robô: últimas execuções; Portaria: entradas e falhas; Cano: mensagens/s); o **Robô-vigia** roda os prompts oficiais pelo MCP no terminal com agentes e escreve aqui; "mandar o diário para" (drains) fica na Casa de Máquinas.

---

## 5. Recursos que ficam sem peça (e por que não precisam aparecer)

| Recurso | Por que não vira peça |
|---|---|
| Table Editor, SQL Editor, AI Assistant (Studio) | São **ferramentas de edição do painel**; a Máquina é a edição. O agente usa `execute_sql`/`apply_migration` no lugar. |
| Visual Schema Designer, Foreign Key Selector, Policy Templates | **Anterioridade**, não recurso do backend: são a versão do Supabase de Gaveta/Fio/Chave. Aparecem na seção "o que ninguém fez" como referência, não no palco. |
| User Impersonation | É o **"como quem"** do Testar (MAQUINA §6.2); não é peça, é um chip do modo teste. |
| Client libraries (JS, Flutter, Swift, Python) | São **como a Tela fala**; viram um rótulo mono na Tela (`JS · supabase-js`). |
| Management API, CLI, Terraform, MCP Server | São **as mãos do agente e de Publicar**; a pessoa nunca vê. O MCP aparece só como "lido pelo MCP oficial · só leitura" na ficha do projeto. |
| Migrations, Declarative Schemas, Branching | Viram **estado** (peça tracejada = migração pendente), **cabeçalho de ambiente** (local · ramo · produção) e os botões **O que muda / Publicar**; não são peça porque não fazem parte do backend, e sim do jeito de mudá-lo. |
| OrioleDB, Dedicated Pooler, PrivateLink, SOC 2, HIPAA, Read Replicas, compute, disco, domínio, SSL, muro, RBAC | Tudo **Casa de Máquinas** (uma linha); cada um é um chip, não uma peça. |
| Email Templates | Chip do **Carteiro** ("modelo do e-mail"); o texto é editado pelo agente. |
| Server-side Auth, Custom Identity Providers, Phone logins, Sessions, Password security, Signing Keys, Captcha, Rate limits, MFA, Web3, anônimo, SAML, Third-Party, OAuth 2.1 Server | Todos **chips da Portaria**. Peça nova aqui seria 18 peças para uma função só. |
| Image transformations, Resumable uploads, CDN/Smart CDN, S3 compatibility | **Chips do Depósito**. |
| Regional invocation, Background tasks, Ephemeral storage, WebSockets, AI models | **Chips da Porta** (ou Robô/Cano atrás dela). |
| Presence, Broadcast, Replay, Realtime Authorization, limites | **Variantes/chips do Cano** e Chave no Cano. |
| pg_net, pg_cron, pgmq, pgvector, PostGIS, pg_graphql, wrappers, pg_trgm, pgroonga, pgtap, pgaudit, pg_partman, index_advisor, hypopg… | **Ferramentas** na barra; cada uma dá uma habilidade a uma peça (Robô-relógio, Cano-fila, Campo · vetor, Gaveta-janela). |
| Column-level privileges | **Não oferecido de propósito**: a doc desaconselha para a maioria e `select *` falha; esconder campo é vitrine. |
| Vault | Não é peça à parte: é o **Cofre-do-banco** (aba do Cofre). |
| Automatic Embeddings | Não é peça: é um **preset de Robô** ("quando o texto muda, tira a impressão digital") que liga Robô + Cano-fila + Porta. |
| Logs, Reports, Log Drains, Advisors | **Verbos** (Diário, Vistoria), não peças: não fazem parte do backend, olham para ele. |
| Planos e preços | Aparecem na Casa de Máquinas e nos avisos ("só no Pro"), nunca como peça. |

---

## 6. Fluxo de montagem de um backend típico (sem código)

Exemplo: clínicas com pacientes e agendamentos, cada clínica vê só o seu, foto do paciente, aviso de WhatsApp, agenda ao vivo. Tudo em **local** ou **ramo**; produção só no fim.

1. **Abrir a Máquina no projeto** (Criar → Máquina). O cabeçalho mostra `ambiente: local ●`. Se for a primeira vez, "encher de exemplo" já fica oferecido (ramo e local nascem vazios).
2. **Casa de Máquinas**: olhar a linha embaixo. Se estiver `Free`, já aparece "Free pausa após 1 semana; e-mail 2/h". Não precisa mexer agora; é só saber.
3. **Portaria**: arrastar a Portaria para a esquerda do palco. Na Mesa, marcar **entra com: e-mail e senha** e **link mágico**; papéis **dono · atendente**; **teste de humano** ligado; **endereço de volta** = o site de verdade (vermelho enquanto for `localhost`). O agente escreve a configuração e o crachá.
4. **Carteiro**: a Portaria acende âmbar ("Carteiro de teste: 2/h, só equipe"). Arrastar o Carteiro até a Portaria, escolher o provedor, colar a credencial pelo Cofre ("pedir ao Theus" se não tiver). No local, o Mailpit é a caixa de correio: o link mágico vai aparecer na Mesa no Testar.
5. **Empresa**: arrastar a moldura Empresa para o meio. O agente cria a gaveta **Clínicas** (a etiqueta) e o Robô da Portaria que põe a clínica no crachá. A moldura mostra `0 gavetas`.
6. **Gavetas**: arrastar **Pacientes** para dentro da moldura → a moldura aceita, o cadeado aparece fechado ("cada empresa vê só o seu") e o rodapé mostra `TABELA · pacientes`. Campos: `nome · texto`, `nascimento · data`, `telefone · texto`, `foto · arquivo`. Repetir com **Agendamentos**: `quando · data e hora`, `status · lista de opções (marcado, feito, faltou)`, `obs · texto`. Toda gaveta já mostra o pino `rua` (porta automática) e o cadeado fechado.
7. **Fios**: puxar `paciente · ligação` de Agendamentos até Pacientes; responder "se apagar o Paciente, os Agendamentos: **travam**". Puxar `clínica · ligação` de Pacientes até Clínicas. Os fios nascem com marcador.
8. **Depósito**: arrastar o Depósito **fotos**, "prateleira trancada · até 5 MB · só imagens · redimensiona na hora"; Chave "cada empresa vê a própria pasta". Puxar o campo `foto` de Pacientes até ele. A ficha lembra: "o backup não guarda o Depósito".
9. **Portas**: arrastar a Porta **novo agendamento**: frase "recebe paciente e horário e grava em Agendamentos", **exige login**, **atende de São Paulo**. Ligar Tela → Porta → Agendamentos. Para **listar**, não precisa de Porta: a Tela lê Agendamentos pela rua, e a Chave filtra.
10. **Robô**: arrastar o Robô até Agendamentos: **quando entra** → "manda a confirmação no WhatsApp". O Cofre acusa `ZAPI_TOKEN ✗ · pedir ao Theus`. O Robô mostra "aviso sem garantia"; clicar "trocar por fila" se precisar de garantia (o agente liga `pgmq`, cria o Cano-fila e um Robô que pega).
11. **Cano**: puxar um Cano de Agendamentos até a Tela **Agenda** (ao vivo). O agente põe a gaveta na publicação e a assinatura no código; a Chave vale no cano.
12. **Tela**: "Começar de um preset" → **login com senha** (já vem com Portaria ligada) e **Agenda**. Ajustar na própria tela (arrastar, editar texto); o código muda junto.
13. **Ferramentas**: a barra mostra o que o agente ligou sozinho (`relógio`, `ligar para fora`, `filas`) e o que falta. Nada de versão travada.
14. **Vistoria**: apertar. O cabeçalho diz `0 erros · 2 avisos · 3 dívidas`. Cada aviso está na peça, com frase. Silenciar o que é de propósito grava o motivo no banco.
15. **Encher de exemplo** → **Testar**: escolher "novo agendamento", "como Ana, da Clínica Vida"; o pulso anda Portaria → Tela → Porta → Agendamentos (a linha `Maria Souza · amanhã 14:30` aparece) → Robô (LED âmbar, "WhatsApp enviado · ver") → Cano → Tela. Depois "como a Clínica Sorriso": o cadeado treme e o pulso morre: `barrado pela chave: cada empresa vê só o seu`. O e-mail do link mágico aparece na Mesa (Mailpit).
16. **Salvar como preset** ("Agendamento com lembrete"): só nasce do teste verde; leva peças, fios, autor e data.
17. **O que muda**: a lista em português com "ver SQL" em cada item.
18. **O que falta para publicar**: o checklist oficial, item a item, apontando a peça (Carteiro ✓, endereço de volta ✓, RLS ✓, SSL ✗ → Casa de Máquinas, Owners 1 ⚠ …). ERROR trava.
19. **Publicar**: só quem tem papel para isso; digitar o nome do projeto; migrações no projeto + portas publicadas; peças novas em verde por um tempo. A Máquina continua só lendo.

---

## 7. O que ninguém fez (com a anterioridade lida)

1. **Peça com nome de gente cuja frase mora no banco** (`COMMENT ON TABLE/POLICY/FUNCTION`), de modo que a Vistoria distingue "cadeado sem chave por descuido" de "fechado de propósito". O Supabase tem Visual Schema Designer e Policy Templates, mas nenhum lê intenção. [features]
2. **A máquina que se monta sozinha enquanto o agente escreve a migração**, lendo a verdade pelo MCP oficial (`list_tables`, `list_extensions`, `list_edge_functions`, `list_migrations`, `list_branches`, `get_advisors`, `query_logs`) em vez de catálogo próprio, com peças tracejadas → sólidas e linha do tempo por pessoa. [mcp]
3. **O pedido de teste animando** pela Portaria → Porta → Gaveta → Robô → Cano → Tela com o dado de verdade no pulso, o cadeado barrando a outra empresa ao vivo (User Impersonation existe, mas não como percurso visível) e o **Mailpit como caixa de correio do Carteiro** para ver o e-mail chegar antes de publicar. [cli/getting-started]
4. **Carteiro e "endereço de volta" como peça e chip**: os dois itens que mais quebram lançamento ficam escondidos em abas do painel. [auth-smtp; redirect-urls; going-into-prod]
5. **Casa de Máquinas em uma linha** (plano, compute, backup, PITR, réplica, muro, domínio, RBAC) + **"O que falta para publicar"** = o checklist oficial apontando para a peça responsável. [going-into-prod]
6. **Vistoria por peça, não por regra**: 30 Advisors + Health Check Advisors agrupados na peça, número no cabeçalho, ERROR travando Publicar, intenção do `COMMENT` silenciando. No Babel OS (239 + 251 WARN) é a diferença entre sinal e ruído. [advisors; changelog/50577; MCP]
7. **Presets de backend inteiro** (peças + fios que passaram no Testar), por pessoa, com contagem de uso; o Supabase tem templates de política e blocos de UI, não de máquina inteira. [supabase.com/ui]
8. **Diário com Robô-vigia** que roda os prompts do "Observability on Auto-Pilot" pelo MCP no terminal com agentes e escreve na ficha da peça. [changelog/50403]
9. **"Avisou" × "garantiu" desenhado no fio** (pg_net pontilhado × fila com bolinhas paradas): nenhum construtor lido mostra a garantia de entrega como textura. [pg_net; queues]
10. **A porta automática como pino `rua` em toda gaveta exposta**: torna visível a frase "criar gaveta é publicar porta", que o painel do Supabase não mostra. [securing-your-api]

---

## 8. O que não fazer

1. Uma peça por produto do Supabase ("Auth", "Storage", "Realtime"): peça é função, não marca.
2. Uma peça por jeito de entrar, por tipo de bucket ou por tipo de canal: são chips e variantes, senão a paleta vira o painel do Supabase de novo.
3. Vistoria que lista regra por regra (251 linhas de "políticas permissivas múltiplas"): agrupar por peça, número no cabeçalho, ler o `COMMENT`.
4. Oferecer privilégio por coluna como botão: a doc desaconselha; esconder campo é vitrine.
5. Gerar código com `anon`/`service_role` legadas: acabam até o fim de 2026; só `sb_publishable_`/`sb_secret_`.
6. Deixar a chave-mestra chegar em código de Tela porque "o navegador barra": app desktop/Electron passa.
7. Criar objetos no schema `realtime` (travado desde 14/07/2026) ou nos armários do Supabase (`auth`, `storage`, `vault`, `pgmq`, `cron`, `net`).
8. Instalar Ferramenta no Armário da frente (PostGIS expõe `spatial_ref_sys`); nunca mostrar "versão travada" (pinning descontinuado).
9. Robô que "avisa" por pg_net vendido como garantia; para garantia, fila.
10. Cano ao vivo com milhares de assinantes na mesma gaveta; presença para cursor.
11. Fio com CASCADE sem perguntar: o padrão é travar; "apaguei um e sumiram cinquenta" é a surpresa nº 1.
12. Testar em produção (o botão não existe lá) ou escrever em produção pelo MCP (a própria doc pede `read_only` e escopo por projeto).
13. Ramo sem "encher de exemplo": nasce vazio, sem dados e sem arquivos.
14. Publicar com ERROR dos Advisors, Carteiro de teste, endereço de volta em `localhost` ou Free sem aviso.
15. Prometer que o backup cobre o Depósito, que a réplica atende Auth/Storage/Realtime, ou que o muro protege PostgREST/Storage/Auth: a doc diz o contrário nos três casos.
16. Emoji como glifo, glow permanente, vidro, isometria, três cores na mesma peça (estudo 2030 e caderno de peças).
17. Inventar estágio: onde a página não diz (Queues) ou diverge do índice (Vault), a ficha mostra "não declarado".

---

## 9. Não confirmado (não inventar)

- **"Max rows" da Data API no hospedado**: `/docs/guides/api` e `/docs/guides/api/securing-your-api` não descrevem; a busca do MCP devolveu apenas o self-hosting (`PGRST_DB_MAX_ROWS: ${PGRST_DB_MAX_ROWS:-1000}` em https://supabase.com/docs/guides/self-hosting/docker). Fica: "1000 no self-hosted; hospedado não confirmado".
- **Estágio de Queues**: relido em 23/09/2026 (~9h) em https://supabase.com/docs/guides/queues: a página não declara Alpha/Beta/GA e o recurso não está no índice de features. A ficha mostra "estágio não declarado". Novo na releitura: três tipos de fila (**Basic** logged, **Unlogged** "may result in loss", **Partitioned** "coming soon"); "Queues, by default, are not exposed over Supabase Data API"; ao expor, RLS obrigatória em `pgmq.q_*` e grants por função em `pgmq_public` (https://supabase.com/docs/guides/queues/quickstart). Isso confirma a Gaveta-fila e o alerta 0019.
- **Vault**: índice diz Public Alpha, a página se descreve como beta. Ficha: "estágio divergente".
- **Busca por texto em português**: a página de full-text-search só exemplifica `'english'`; a configuração `portuguese` do Postgres não foi confirmada na doc do Supabase.
- **Custo de Branching** (US$ 0,01344/ramo/hora) vem da página de preços, não da página de Branching.
- **Números dos Advisors do Babel OS** são da chamada `get_advisors` da rodada 1 (~8h) e não foram repetidos.
- WebSearch esteve indisponível (cota 200/200) nas três rodadas; toda a verificação foi por WebFetch direto e MCP.

---

## 10. Fontes (URL efetivamente lida; a lista completa por rodada está em `supabase-catalogo-de-recursos.md` §8 e §9.4)

Índice, Advisors, changelog: https://supabase.com/docs/guides/getting-started/features · https://supabase.com/docs/guides/database/database-advisors · https://supabase.com/changelog · https://supabase.com/changelog/50577-health-check-advisors · https://supabase.com/changelog/50403-observability-autopilot · https://supabase.com/changelog/database-replication-renamed-pipelines

Database: https://supabase.com/docs/guides/api · https://supabase.com/docs/guides/api/securing-your-api · https://supabase.com/docs/guides/api/api-keys · https://supabase.com/docs/guides/api/using-custom-schemas · https://supabase.com/docs/guides/graphql · https://supabase.com/docs/guides/database/tables · https://supabase.com/docs/guides/database/postgres/row-level-security · https://supabase.com/docs/guides/database/functions · https://supabase.com/docs/guides/database/postgres/triggers · https://supabase.com/docs/guides/database/postgres/roles · https://supabase.com/docs/guides/database/postgres/indexes · https://supabase.com/docs/guides/database/postgres/timeouts · https://supabase.com/docs/guides/database/postgres/cascade-deletes · https://supabase.com/docs/guides/database/postgres/enums · https://supabase.com/docs/guides/database/postgres/column-level-security · https://supabase.com/docs/guides/database/full-text-search · https://supabase.com/docs/guides/database/extensions · https://supabase.com/docs/guides/database/extensions/pgvector · https://supabase.com/docs/guides/database/extensions/postgis · https://supabase.com/docs/guides/database/extensions/pg_net · https://supabase.com/docs/guides/database/extensions/wrappers/overview · http://fdw.dev/ · https://supabase.com/docs/guides/database/webhooks · https://supabase.com/docs/guides/cron · https://supabase.com/docs/guides/queues · https://supabase.com/docs/guides/queues/quickstart · https://supabase.com/docs/guides/queues/api · https://supabase.com/docs/guides/database/vault · https://supabase.com/docs/guides/database/replication · https://supabase.com/docs/guides/ai/automatic-embeddings · https://supabase.com/docs/guides/database/connecting-to-postgres · https://supabase.com/docs/guides/deployment/branching · https://supabase.com/docs/guides/deployment/database-migrations · https://supabase.com/docs/guides/local-development/cli/getting-started · https://supabase.com/docs/guides/self-hosting/docker

Auth: https://supabase.com/docs/guides/auth · https://supabase.com/docs/guides/auth/auth-smtp · https://supabase.com/docs/guides/auth/redirect-urls · https://supabase.com/docs/guides/auth/auth-hooks · https://supabase.com/docs/guides/auth/password-security · https://supabase.com/docs/guides/auth/sessions · https://supabase.com/docs/guides/auth/auth-mfa · https://supabase.com/docs/guides/auth/auth-captcha · https://supabase.com/docs/guides/auth/rate-limits · https://supabase.com/docs/guides/auth/auth-anonymous · https://supabase.com/docs/guides/auth/auth-web3 · https://supabase.com/docs/guides/auth/signing-keys · https://supabase.com/docs/guides/auth/third-party/overview · https://supabase.com/docs/guides/auth/oauth-server · https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml

Storage: https://supabase.com/docs/guides/storage · https://supabase.com/docs/guides/storage/buckets/fundamentals · https://supabase.com/docs/guides/storage/uploads/file-limits · https://supabase.com/docs/guides/storage/security/access-control · https://supabase.com/docs/guides/storage/serving/image-transformations · https://supabase.com/docs/guides/storage/uploads/resumable-uploads · https://supabase.com/docs/guides/storage/cdn/smart-cdn · https://supabase.com/docs/guides/storage/s3/authentication · https://supabase.com/docs/guides/storage/analytics/introduction · https://supabase.com/docs/guides/storage/vector/introduction · https://supabase.com/docs/guides/storage/vector/limits · https://supabase.com/docs/guides/platform/backups

Functions e Realtime: https://supabase.com/docs/guides/functions · https://supabase.com/docs/guides/functions/limits · https://supabase.com/docs/guides/functions/secrets · https://supabase.com/docs/guides/functions/regional-invocation · https://supabase.com/docs/guides/functions/background-tasks · https://supabase.com/docs/guides/functions/websockets · https://supabase.com/docs/guides/functions/ephemeral-storage · https://supabase.com/docs/guides/functions/schedule-functions · https://supabase.com/docs/guides/realtime/postgres-changes · https://supabase.com/docs/guides/realtime/broadcast · https://supabase.com/docs/guides/realtime/presence · https://supabase.com/docs/guides/realtime/authorization · https://supabase.com/docs/guides/realtime/limits

Plataforma: https://supabase.com/docs/guides/platform/compute-and-disk · https://supabase.com/docs/guides/platform/read-replicas · https://supabase.com/docs/guides/platform/custom-domains · https://supabase.com/docs/guides/platform/network-restrictions · https://supabase.com/docs/guides/platform/ssl-enforcement · https://supabase.com/docs/guides/platform/privatelink · https://supabase.com/docs/guides/platform/access-control · https://supabase.com/docs/guides/platform/log-drains · https://supabase.com/docs/guides/telemetry/logs · https://supabase.com/docs/guides/telemetry/reports · https://supabase.com/docs/guides/security/soc-2-compliance · https://supabase.com/docs/guides/security/hipaa-compliance · https://supabase.com/docs/guides/deployment/going-into-prod · https://supabase.com/docs/guides/deployment/terraform · https://supabase.com/docs/guides/getting-started/mcp · https://supabase.com/docs/reference/api/introduction · https://supabase.com/pricing · https://supabase.com/ui · https://supabase.com/ui/docs/getting-started/introduction

MCP oficial do Supabase (só leitura, 23/09/2026): `list_projects`, `list_extensions`, `list_tables`, `list_edge_functions`, `get_advisors`, `search_docs` — projeto `pdamarjxcmkzbhqxtapl`.

Material interno: `docs/MAQUINA.md` · `prototipo/maquina.js` · `prototipo/editor.js` · `prototipo/explorador.js` · `IDEIAS.md` §5.17–5.19, §15 · `docs/ESTUDO_DESIGN_2030.md` · `pesquisa/maquina-caderno-de-pecas.md` · `pesquisa/supabase-catalogo-de-recursos.md` · `~/Desktop/stack-video-scroll/PROMPT_AGENTICO_LP.md`.
