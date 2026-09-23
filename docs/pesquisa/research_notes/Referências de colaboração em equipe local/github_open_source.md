# Software open-source auto-hospedável de colaboração em equipe no GitHub (chat, tarefas, arquivos, tudo-em-um, rede local e painéis de TV): estado em setembro de 2026

## 1. Chat (Mattermost, Rocket.Chat, Zulip, Element/Matrix, Campfire, Revolt/Stoat): quais são leves o bastante para 11 pessoas numa rede local e quais têm bons tópicos/threads, menções e envio de arquivos?

### Takeaway
Para 11 pessoas num único servidor de escritório, os mais leves e simples de operar são o **Campfire** (MIT, uma imagem Docker com tudo dentro, SQLite) e o **Mattermost Team Edition** (binário Linux único + PostgreSQL; 1 vCPU/2 GB atendem até 1.000 usuários). O **Zulip** tem o melhor modelo de conversa (tópicos dentro de canais) e pede 2 GB de RAM + swap. O Rocket.Chat é mais pesado (app + MongoDB). O Matrix só compensa se a equipe quiser federação e criptografia de ponta a ponta. Nesse caso, o caminho mais leve é o Tuwunel com o cliente Element. O conduwuit foi arquivado. Há três armadilhas de edição e licença. O Mattermost "Entry" tem teto de 10.000 mensagens visíveis, e o Team Edition não tem esse teto. O Campfire não tem pt-BR nem threads. O ESS Community (Element) é declaradamente voltado a uso não comercial.

### Cited Findings

**Nota de método (vale para todas as seções):** estrelas, licença SPDX e status "archived" vieram da API REST pública do GitHub (`api.github.com/repos/<owner>/<repo>`), consultada em 22/09/2026. "Último release" é a entrada mais recente do feed `releases.atom`, pela data de atualização. "Último commit" é a entrada mais recente do feed `commits/<branch padrão>.atom`. A coluna pt-BR indica a existência de arquivos de locale `pt-BR`/`pt_BR` na árvore do repositório, via lista de arquivos do GitHub, e não mede a completude da tradução. Cada linha da tabela cita o repositório como fonte desses metadados.

| Projeto | Repositório | ★ | Licença | Último release · último commit | Stack | Rodar numa máquina da LAN | pt-BR |
|---|---|---|---|---|---|---|---|
| Mattermost | [mattermost/mattermost](https://github.com/mattermost/mattermost) | 39.148 | Composta. Binários compilados pela Mattermost usam MIT. O código-fonte usa AGPL-3.0 ou licença comercial. Admin Tools e arquivos de configuração usam Apache-2.0 ([LICENSE.txt](https://github.com/mattermost/mattermost/blob/master/LICENSE.txt)). O GitHub mostra "NOASSERTION" | v12.0.0-rc1 (18/09/2026) · 22/09/2026 | Team Edition "deployed as a single Linux binary with PostgreSQL" ([docs](https://docs.mattermost.com/product-overview/editions-and-offerings.html)); webapp em TypeScript | **Fácil**: de 1 a 1.000 usuários bastam "1 vCPU/cores, 2 GB RAM" ([docs](https://docs.mattermost.com/deployment-guide/software-hardware-requirements.html)) | Sim ([pt-BR.json](https://github.com/mattermost/mattermost/blob/master/webapp/channels/src/i18n/pt-BR.json)) |
| Rocket.Chat | [RocketChat/Rocket.Chat](https://github.com/RocketChat/Rocket.Chat) | 46.152 | MIT, exceto `apps/meteor/ee/` e `ee/`, que têm licença própria ([LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE)) | 8.8.1 (09/09/2026) · 22/09/2026 | TypeScript; Node.js 22.22.3 + MongoDB 8.0+ na instalação manual ([docs](https://docs.rocket.chat/docs/system-requirements)) | **Médio**: para até 500 usuários simultâneos, o servidor pede 2 vCPU e 4 GiB, e o MongoDB mais 2 vCPU e 4 GiB. Um replica set de 3 membros é "strongly recommended" ([docs](https://docs.rocket.chat/docs/system-requirements)) | Sim, inclusive no livechat ([pt-BR.i18n.json](https://github.com/RocketChat/Rocket.Chat/blob/develop/packages/i18n/src/locales/pt-BR.i18n.json)) |
| Zulip | [zulip/zulip](https://github.com/zulip/zulip) | 25.934 | Apache-2.0 | Zulip Server 12.3 (21/09/2026) · 21/09/2026 | Python/Django (arquivos `django.po`) | **Fácil a médio**: "At least 2 GB RAM", swap de 2 GB se houver menos de 5 GB, 1 CPU e 10 GB livres. Suporta Ubuntu 22.04/24.04/26.04 e Debian 12/13 ([docs](https://zulip.readthedocs.io/en/stable/production/requirements.html)) | **Parcial**: locales `pt` ("Language-Team: Portuguese", via Weblate) e `pt_PT`, sem `pt_BR` explícito ([django.po](https://github.com/zulip/zulip/blob/main/locale/pt/LC_MESSAGES/django.po)) |
| Synapse + Element Web (Matrix) | [element-hq/synapse](https://github.com/element-hq/synapse) · [element-hq/element-web](https://github.com/element-hq/element-web) · [element-hq/ess-helm](https://github.com/element-hq/ess-helm) | 4.637 · 13.495 · 958 | AGPL-3.0. O repositório original [matrix-org/synapse](https://github.com/matrix-org/synapse) era Apache-2.0 e foi "archived by the owner on Apr 26, 2024" | Synapse v1.161.0 (15/09/2026); Element Web v1.12.29 (22/09/2026); ESS 26.9.3 (22/09/2026) | Python (Synapse), TypeScript (Element); ESS = charts Helm sobre K3s | **Médio**: a instalação rápida do ESS Community "relies on K3s. It requires at least 2 CPU cores and 2 GB of memory" ([README ESS](https://github.com/element-hq/ess-helm)) | Sim no cliente ([pt_BR.json](https://github.com/element-hq/element-web/blob/develop/apps/web/src/i18n/strings/pt_BR.json)) |
| Tuwunel (Matrix em Rust) | [matrix-construct/tuwunel](https://github.com/matrix-construct/tuwunel) | 2.547 | Apache-2.0 | v1.9.2 (21/09/2026) · 21/09/2026 | Rust + RocksDB | **Fácil**: "Most users deploy via docker or a distribution package". Há binário pré-compilado (AUR `tuwunel-bin`) ([README](https://github.com/matrix-construct/tuwunel)) | Não se aplica (servidor; usa clientes Matrix, como o Element) |
| conduwuit | [x86pup/conduwuit](https://github.com/x86pup/conduwuit) (o antigo girlbossceo/conduwuit redireciona para cá) | 25 | Apache-2.0 | **ARQUIVADO**. Último release v0.5.0-rc4 (10/04/2025) | Rust | Não usar | Não se aplica |
| Campfire (37signals) | [basecamp/once-campfire](https://github.com/basecamp/once-campfire) | 4.643 | MIT | v1.4.9 (04/08/2026) · 22/09/2026 | Rails (branch `main`), `sqlite3`, `redis`, `resque`, `puma`, `thruster`, `turbo-rails`/`stimulus-rails`/`importmap-rails`, `web-push` ([Gemfile](https://github.com/basecamp/once-campfire/blob/main/Gemfile)) | **Muito fácil**: a imagem Docker "contains everything needed for a fully-functional, single-machine deployment. This includes the web app, background jobs, caching, file serving, and SSL" ([README](https://github.com/basecamp/once-campfire)) | **Não** (só `config/locales/en.yml`) ([árvore](https://github.com/basecamp/once-campfire/tree/main/config/locales)) |
| Stoat (ex-Revolt) | [stoatchat/stoatchat](https://github.com/stoatchat/stoatchat) · [stoatchat/self-hosted](https://github.com/stoatchat/self-hosted) · [stoatchat/for-web](https://github.com/stoatchat/for-web) | 3.340 · 2.638 | AGPL-3.0, "with the exception of crates that specify their own LICENSE file" ([LICENSE](https://github.com/stoatchat/stoatchat/blob/main/LICENSE)). Por isso o GitHub mostra NOASSERTION | backend v0.15.5 (12/09/2026); `self-hosted` com commit em 21/09/2026 | Rust (backend); Docker Compose. O README tem seção "Mongo Compatibility" | **Médio**: "at least 2 vCPUs and 2 GB of memory". Exige abrir as portas 80, 443, 7881 e 50000-50100/udp para voz ([README](https://github.com/stoatchat/self-hosted)) | Sim no cliente web ([pt-BR/messages.po](https://github.com/stoatchat/for-web/tree/main/packages/client/components/i18n/catalogs/pt-BR)) |

**Mattermost**
- Edições em 2025–2026. O binário Enterprise sem licença roda num modo gratuito chamado **Entry**, com limites no servidor inteiro. O histórico é de "10,000 Channel messages history across all channels", e as mensagens mais antigas "remain in the database but aren't viewable or searchable". Os demais limites são 1.000 cards de Boards, 5 execuções de Playbooks por mês, 250 consultas a agentes por mês, chamadas de 40 minutos e 10.000 notificações push por mês. A documentação diz que "Limits will take effect in a future release" e recomenda o Entry para equipes com menos de 50 usuários ([docs de edições](https://docs.mattermost.com/product-overview/editions-and-offerings.html)).
- O **Team Edition** é "free-to-use, open source, self-hosted" e "intended for small teams, hobbyists, or personal use under 250 activated users where single sign-on (SSO) is not required". O SSO está sendo removido dele, e a partir da v11 ele deixou de incluir o GitLab SSO ([docs](https://docs.mattermost.com/product-overview/editions-and-offerings.html); [blog "Introducing Mattermost Entry"](https://mattermost.com/blog/introducing-mattermost-entry/)). O blog diz que o Team Edition "remains available with defined limits" e que o projeto segue sob AGPLv3, com o Team Edition sendo a distribuição "MIT-Compiled" ([blog](https://mattermost.com/blog/introducing-mattermost-entry/)).
- Threads: "Threaded discussions offers an enhanced experience for users communicating in threads … that includes a unified threads inbox to read all conversations in one view" ([docs](https://docs.mattermost.com/end-user-guide/collaborate/organize-conversations.html)).
- **Ideias a copiar:**
  1. Uma caixa de entrada unificada de threads, com uma tela "Threads" que junta tudo o que o usuário segue ([docs](https://docs.mattermost.com/end-user-guide/collaborate/organize-conversations.html)).
  2. Distribuição como binário único + PostgreSQL ([docs](https://docs.mattermost.com/product-overview/editions-and-offerings.html)).

**Rocket.Chat**
- A página de planos lista quatro opções ([docs "our plans"](https://docs.rocket.chat/docs/our-plans)):
  - **Starter**, gratuito, "Up to 50 users".
  - **Community**, gratuito (edição MIT), "Up to 100 concurrent users", com push limitado a 10.000 por mês e vídeo apenas via Jitsi/BigBlueButton.
  - O plano **Pro** é "legacy" desde 29/04/2026 e não está mais à venda.
  - Um resumo de busca da mesma página informa que "every workspace deployed on Rocket.Chat 6.5 or later is provisioned as a Starter workspace".
- **Ideia a copiar:** i18n com arquivo pt-BR separado também no widget de atendimento (`packages/livechat/src/i18n/pt-BR.json`) ([repo](https://github.com/RocketChat/Rocket.Chat/blob/develop/packages/livechat/src/i18n/pt-BR.json)).

**Zulip**
- A central de ajuda documenta o modelo de **tópicos**: iniciar um tópico, encontrar uma conversa para ler e ler conversas ([Introduction to topics](https://zulip.com/help/introduction-to-topics)).
- Para instalações pequenas, "1 CPU and 2 GB RAM with 2 GB of swap is sufficient" ([docs](https://zulip.readthedocs.io/en/stable/production/requirements.html)).
- **Ideias a copiar:**
  1. Todo canal subdividido em tópicos, com a leitura organizada por tópico ([help](https://zulip.com/help/introduction-to-topics)).
  2. Requisitos modestos, com instalação direta em Ubuntu/Debian ([docs](https://zulip.readthedocs.io/en/stable/production/requirements.html)).

**Element/Matrix (Synapse, ESS, conduwuit, Tuwunel)**
- O ESS Community é "tailored to small-/mid-scale, non-commercial community use cases with up to 100 users" e "provided for non-commercial community use cases", sob AGPLv3. O ESS Pro é voltado a "professional environments with more than 100 users" ([README ESS](https://github.com/element-hq/ess-helm)).
- Mudança de licença do Synapse: o repositório original matrix-org/synapse (Apache-2.0) foi arquivado em 26/04/2024 ([matrix-org/synapse](https://github.com/matrix-org/synapse)). O repositório ativo element-hq/synapse é AGPL-3.0 ([element-hq/synapse](https://github.com/element-hq/synapse)).
- **Tuwunel:**
  - É "the official successor to conduwuit", "primarily sponsored by the government of Switzerland 🇨🇭 where it is currently deployed for citizens".
  - Migra o banco RocksDB do Conduit "in place on first boot". A migração a partir do Synapse ainda não existe ("Not yet") ([README](https://github.com/matrix-construct/tuwunel)).
  - O repositório foi criado em 21/02/2025 (API do GitHub).
- O README arquivado do conduwuit diz que "Tuwunel is the **ONLY** official successor to conduwuit, no other project or fork is" ([README](https://github.com/x86pup/conduwuit)).
- **Ideias a copiar:**
  1. Servidor de binário único com banco embarcado (RocksDB) e zero serviços externos (Tuwunel) ([README](https://github.com/matrix-construct/tuwunel)).
  2. Um instalador de "nó único" que esconde a complexidade (ESS sobre K3s) ([README ESS](https://github.com/element-hq/ess-helm)).

**Campfire (37signals)**
- **Foi liberado:** "Is it really free and open source? Yes. … Campfire itself is entirely free and open source under the MIT License" ([once.com/campfire](https://once.com/campfire)). DHH escreve que a 37signals liberou "Campfire, Writebook, [and] Fizzy … by releasing them all as open source with a permissive license" ([ONCE (Again)](https://world.hey.com/dhh/once-again-3e99f755)). O repositório público foi criado em 15/08/2025 (API do GitHub).
- **Estado em 2026:** o repositório está ativo (v1.4.9 em 04/08/2026 e commits em 22/09/2026). A instalação recomendada usa o **ONCE**, um servidor de apps open-source ([basecamp/once](https://github.com/basecamp/once): 1.939★, v0.3.3 em 16/09/2026) descrito como "a console-like system that can run multiple applications on one machine" ([dev.37signals](https://dev.37signals.com/once-app-server/); [README](https://github.com/basecamp/once-campfire)).
- **Recursos:** "Multiple rooms, with access controls; Direct messages; File attachments with previews; Search; Notifications (via Web Push); @mentions; API, with support for bot integrations" ([README](https://github.com/basecamp/once-campfire)). Threads não aparecem na lista.
- **Ideias a copiar:**
  1. "Share a QR code on the big screen, people snap the QR with their phones, and instantly establish a chat room for all attendees" ([once.com/campfire](https://once.com/campfire)). Serve diretamente para a tela da TV.
  2. Monólito numa imagem só (web, jobs, cache, arquivos e SSL) com SQLite ([README](https://github.com/basecamp/once-campfire); [Gemfile](https://github.com/basecamp/once-campfire/blob/main/Gemfile)).
  3. API de bots para integrar avisos do sistema de tarefas ao chat ([README](https://github.com/basecamp/once-campfire)).

**Stoat (ex-Revolt)**
- O Revolt passou a se chamar Stoat após receber uma notificação de "cease and desist" sobre o nome, com efeito em 01/10/2025. Servidores, mensagens e dados foram mantidos. O projeto se posicionava como alternativa ao Discord focada em privacidade ([AlternativeTo](https://alternativeto.net/news/2025/10/chat-app-revolt-rebrands-to-stoat-keeps-all-services-features-and-core-values-unchanged/)). A organização antiga no GitHub diz "Moved to stoatchat (formerly Revolt)" ([github.com/revoltchat](https://github.com/revoltchat)).
- **Ideia a copiar:** separar o backend, o cliente web e o empacotamento em três repositórios, com um repositório `self-hosted` só de Compose e Caddy ([self-hosted](https://github.com/stoatchat/self-hosted)).

### Inferences
- Para 11 usuários na LAN, instalar o **binário Team Edition** do Mattermost, e não o Enterprise em modo Entry, evita o teto de 10.000 mensagens visíveis. O preço é ficar sem SSO e com Boards e Playbooks limitados, o que é aceitável para uma equipe pequena sem diretório corporativo. Isso deriva da leitura das docs; a Mattermost diz que os limites do Entry entram "in a future release".
- O **Zulip** é a melhor referência de UX para um chat "entre todos" que não vire bagunça, por causa dos tópicos. O custo é o pt-BR incerto: o locale `pt` é "Portuguese" genérico.
- O **Campfire** é a melhor referência de arquitetura para um sistema próprio simples (monólito Rails com SQLite numa imagem só, código aberto sob MIT). Para adotá-lo como está, faltariam pt-BR e threads, mas a licença MIT permite um fork traduzido.
- Web Push, PWA e service workers exigem contexto seguro (HTTPS). Numa LAN, isso pede um certificado válido para um nome de host interno. Vale para o Campfire e para qualquer sistema próprio que queira notificação no navegador. Isso é uma inferência técnica geral, não verificada em doc de projeto.
- O Rocket.Chat é superdimensionado para 11 pessoas por exigir MongoDB (idealmente em replica set). Os planos gratuitos cobrem 11 usuários, mas a política de planos mudou várias vezes.
- O Matrix só vale se federação ou criptografia de ponta a ponta forem requisitos. Tuwunel + Element é a combinação mais leve. O ESS Community é juridicamente AGPL, mas é posicionado para uso não comercial, o que merece atenção numa empresa.
- O Stoat é pensado para comunidades estilo Discord e é pesado de expor (voz em UDP). Não é o melhor ajuste para um escritório de 11 pessoas.

### Gaps
- Não encontrei medição real de RAM com cerca de 10 usuários para nenhum chat; usei apenas os requisitos oficiais.
- Não verifiquei nesta rodada, em fonte primária, os recursos de threads e discussões do Rocket.Chat, do Element e do Stoat.
- O Conduit original fica fora do GitHub (GitLab) e não foi verificado. O README do conduwuit sugere uma disputa entre forks, que não investiguei.
- Um resultado de busca secundário cita 21/08/2025 como data da abertura do Campfire sob MIT. Não confirmei em fonte primária; o repositório foi criado em 15/08/2025.
- Não está claro se os limites do Mattermost Entry já valem na v11/v12, porque a doc ainda diz "future release". Também não achei a lista exata dos "defined limits" do Team Edition além da faixa de menos de 250 usuários ativados sem SSO.
- A relação entre os planos Starter e Community do Rocket.Chat veio de um resumo automático da página de planos e pode ter nuances não capturadas.

## 2. Tarefas/projetos (Plane, Vikunja, Planka, Kanboard, Focalboard, Wekan, Leantime, OpenProject, Taiga, Huly): quais têm boa visão pessoal ("minhas tarefas"), visão de carga da equipe e kanban em tempo real?

### Takeaway
Os pontos fortes se dividem assim:
- **Visão pessoal:** o **Plane** ("Your work" + Home com stickies) e o **Leantime** ("My Work").
- **Carga da equipe:** a melhor referência é o **Team planner do OpenProject** (pessoas nas linhas, semanas nas colunas, arrastar e soltar), mas ele é recurso pago (Enterprise). O **Huly** oferece um Team Planner semelhante, porém é pesado.
- **Kanban em tempo real:** confirmado em documentação apenas para o **Planka** e o **Wekan**.
- **Mais leves para a LAN:** **Vikunja** (binário único) e **Planka** (app + Postgres).

Situações a sinalizar:
- O Focalboard avulso não é mais mantido.
- O Planka mudou para uma licença "Fair Use" (não é mais OSI) e passou o SSO para a versão Pro.
- O Taiga tem sucessor, o Tenzu.
- O Kanboard está em "maintenance mode", mas ainda sai release.
- O Vikunja virou open-core, com a Vikunja Pro.

### Cited Findings

| Projeto | Repositório | ★ | Licença | Último release · último commit | Stack | Rodar numa máquina da LAN | pt-BR |
|---|---|---|---|---|---|---|---|
| Plane | [makeplane/plane](https://github.com/makeplane/plane) | 59.755 | AGPL-3.0 (Community Edition) | v1.4.2 (23/08/2026) · 22/09/2026 | Monorepo TypeScript; Docker Compose ou Kubernetes ([README](https://github.com/makeplane/plane)) | **Médio**: "2 cores (x64/AMD64 or AArch64/ARM64)" e "4GB (8GB recommended for production)" ([docs](https://developers.plane.so/self-hosting/methods/docker-compose)) | Sim, 28 arquivos ([pt-BR](https://github.com/makeplane/plane/tree/preview/packages/i18n/src/locales/pt-BR)) |
| Vikunja | [go-vikunja/vikunja](https://github.com/go-vikunja/vikunja) | 5.478 | AGPL-3.0 (existe a "Vikunja Pro" à parte) | v2.6.0 (31/08/2026) · 22/09/2026 | Go; API e frontend "bundled into one single deployable binary (or docker container)"; banco SQLite/MySQL/MariaDB/Postgres ([docs](https://vikunja.io/docs/installing/)) | **Muito fácil**: binário único | Sim ([pt-BR.json](https://github.com/go-vikunja/vikunja/blob/main/frontend/src/i18n/lang/pt-BR.json)) |
| Planka | [plankanban/planka](https://github.com/plankanban/planka) | 12.575 | **PLANKA Community License v1.1 ("Fair Use License")**, atualizada em 20/05/2025; o GitHub mostra NOASSERTION ([LICENSE.md](https://github.com/plankanban/planka/blob/master/LICENSE.md)) | v2.2.1 (10/08/2026) · 17/09/2026 | Sails (Node.js) + knex/pg; React 18 + redux-saga; imagem `postgres:16-alpine` ([server/package.json](https://github.com/plankanban/planka/blob/master/server/package.json); [docker-compose.yml](https://github.com/plankanban/planka/blob/master/docker-compose.yml)) | **Fácil**: 2 containers (app + Postgres) | Sim ([pt-BR](https://github.com/plankanban/planka/tree/master/client/src/locales/pt-BR)) |
| Kanboard | [kanboard/kanboard](https://github.com/kanboard/kanboard) | 9.881 | MIT | 1.2.54 (29/08/2026) · 11/09/2026 | PHP ≥ 8.1; SQLite ≥ 3.7, MySQL ≥ 5.6, MariaDB ≥ 10 ou PostgreSQL ≥ 9.4 ([docs](https://docs.kanboard.org/v1/admin/requirements/)) | **Muito fácil**: PHP + SQLite | Sim ([pt_BR](https://github.com/kanboard/kanboard/tree/main/app/Locale/pt_BR)) |
| Focalboard (avulso) | [mattermost-community/focalboard](https://github.com/mattermost-community/focalboard) | 26.483 | Dual: AGPL-3.0 ou comercial; binários da Mattermost sob MIT ([LICENSE.txt](https://github.com/mattermost-community/focalboard/blob/main/LICENSE.txt)) | **NÃO MANTIDO**. v8.0.0 (17/06/2024) · 11/06/2025 | TypeScript (linguagem principal) | Não recomendado | Sim ([pt_BR.json](https://github.com/mattermost-community/focalboard/blob/main/webapp/i18n/pt_BR.json)) |
| Mattermost Boards (plugin) | [mattermost/mattermost-plugin-boards](https://github.com/mattermost/mattermost-plugin-boards) | 144 | Mesma licença dual do Focalboard ([LICENSE.txt](https://github.com/mattermost/mattermost-plugin-boards/blob/main/LICENSE.txt)) | v10.0.0-rc1 (21/09/2026) · 17/09/2026 | Plugin dentro do Mattermost | Depende do Mattermost | Sim ([pt_BR.json](https://github.com/mattermost/mattermost-plugin-boards/blob/main/webapp/i18n/pt_BR.json)) |
| Wekan | [wekan/wekan](https://github.com/wekan/wekan) | 21.094 | MIT | v11.90 (21/09/2026) · 22/09/2026 | Meteor `METEOR@3.6-beta.1` ([.meteor/release](https://github.com/wekan/wekan/blob/main/.meteor/release)); Docker/Snap | **Médio**: "1 GB RAM minimum free for WeKan. Production server should have minimum total 4 GB RAM" ([README](https://github.com/wekan/wekan)) | Sim ([pt-BR.i18n.json](https://github.com/wekan/wekan/blob/main/imports/i18n/data/pt-BR.i18n.json)) |
| Leantime | [Leantime/leantime](https://github.com/Leantime/leantime) | 11.636 | AGPL-3.0 | v3.9.8 (08/07/2026) · 07/09/2026 | PHP 8.2+; MySQL 8.0+ ou MariaDB 10.6+; Apache ou Nginx ([README](https://github.com/Leantime/leantime)) | **Fácil**: PHP + MySQL; imagem Docker oficial | Sim ([pt-BR.ini](https://github.com/Leantime/leantime/blob/master/app/Language/pt-BR.ini)) |
| OpenProject | [opf/openproject](https://github.com/opf/openproject) | 16.187 | GPL-3.0 | 17.8.0 (02/09/2026) · 22/09/2026 | Ruby (Rails); Docker recomendado; pacotes .deb/.rpm ([docs](https://www.openproject.org/docs/installation-and-operations/system-requirements/)) | **Médio a pesado**: instância pequena (≤ 200 usuários) pede "Quad Core CPU (>= 2ghz)", "4096 MB" de RAM e 20 GB de disco ([docs](https://www.openproject.org/docs/installation-and-operations/system-requirements/)) | Sim, via Crowdin, inclusive nos módulos `team_planner` e `my_page` ([pt-BR.yml](https://github.com/opf/openproject/blob/dev/config/locales/crowdin/pt-BR.yml)) |
| Taiga | [taigaio/taiga-back](https://github.com/taigaio/taiga-back) | 851 | MPL-2.0 | 6.10.2 (02/07/2026) · 09/09/2026 | Python/Django | Médio (vários serviços; não medi) | Sim no backend ([pt_BR](https://github.com/taigaio/taiga-back/tree/main/taiga/locale/pt_BR)) |
| Tenzu (sucessor do Taiga) | [BIRU-Scop/tenzu-back](https://github.com/BIRU-Scop/tenzu-back) | 87 | AGPLv3 ([LICENSE.md](https://github.com/BIRU-Scop/tenzu-back/blob/main/LICENSE.md)) | release e commit em 18/08/2026 | não verificado | não verificado | Não no frontend (sem locale pt-BR na árvore do [tenzu-front](https://github.com/BIRU-Scop/tenzu-front)) |
| Huly (ver seção 3) | [hcengineering/platform](https://github.com/hcengineering/platform) | 27.751 | EPL-2.0 | s0.7.437 (01/08/2026) · 22/09/2026 | TypeScript + vários serviços | **Pesado**: mínimo de 8 GB de RAM ([README selfhost](https://github.com/hcengineering/huly-selfhost)) | Sim, 66 arquivos `lang/pt-br.json` ([exemplo](https://github.com/hcengineering/platform/blob/develop/plugins/tracker-assets/lang/pt-br.json)) |

**Plane**
- A Community Edition "Is governed by the AGPL v3.0 license" e "is at par with the Free tier of the Cloud edition in its feature availability". Para acessar planos pagos é preciso migrar para a Commercial Edition ([docs de edições](https://developers.plane.so/self-hosting/editions-and-versions)).
- O plano Free (cloud) tem limite de "12 users".
- O Pro (US$ 8 por usuário/mês) adiciona time tracking, dashboards, wiki, tipos de item customizados e integrações.
- O Business (US$ 15) adiciona intake forms, templates, itens recorrentes e dashboards avançados ([pricing](https://plane.so/pricing)).
- "Your work" é "a centralized hub for managing your individual responsibilities … a clear, at-a-glance view of your current workload". A seção Overview mostra quantos itens o usuário criou, quantos estão atribuídos a ele e em quantos está inscrito. Os "Stickies" são notas pessoais fixadas no rodapé da Home, e as seções da Home são personalizáveis ([docs "Your work"](https://docs.plane.so/your-work)).
- Recursos centrais: Work Items, Cycles (com burn-down), Modules, Views ("Save and share these views"), Pages com IA ([README](https://github.com/makeplane/plane)).
- **Ideias a copiar:**
  1. "Your work" e Home personalizável com stickies como tela pessoal ([docs](https://docs.plane.so/your-work)).
  2. Views filtradas, salvas e compartilhadas ([README](https://github.com/makeplane/plane)).
  3. i18n organizado por namespaces (28 arquivos pt-BR) ([repo](https://github.com/makeplane/plane/tree/preview/packages/i18n/src/locales/pt-BR)).

**Vikunja**
- Tarefas organizadas em projetos e subprojetos. É possível compartilhar um projeto "with another user or a whole team". Visões: "list view – or in a Gantt Chart, or Table view, or Kanban". Na criação rápida, "use one of the special keywords to automatically add labels, assignees and more" ([features](https://vikunja.io/features/)).
- O README anuncia a **Vikunja Pro** para "admin panel, audit logs or time tracking". Também informa que o desenvolvimento usa "LLM-Assisted coding tools in various parts of the codebase" ([README](https://github.com/go-vikunja/vikunja)).
- **Ideias a copiar:**
  1. Binário único com o frontend embutido ([docs](https://vikunja.io/docs/installing/)).
  2. As mesmas tarefas em quatro visões (lista, Gantt, tabela e kanban) ([features](https://vikunja.io/features/)).
  3. Criação rápida com palavras-chave (datas, etiquetas e responsáveis) ([features](https://vikunja.io/features/)).

**Planka**
- A licença atual é a "PLANKA Community License, Version 1.1 – Last updated: May 20, 2025" ([LICENSE.md](https://github.com/plankanban/planka/blob/master/LICENSE.md)).
  - O guia permite usar ou modificar "internally within your own organization".
  - O guia proíbe operar o PLANKA "as a hosted service for third parties for any commercial gain", por exemplo "Hosting PLANKA and charging people money to access it" ([License Guide](https://github.com/plankanban/planka/blob/master/LICENSES/PLANKA%20License%20Guide%20EN.md)).
- Histórico de licença: MIT, depois AGPL-3.0 (2023) e, a partir do 2.0, a "PLANKA Community License". Isso vem de resumo de busca e de fontes secundárias ([ProHoster: "Planka project switches to non-free license"](https://prohoster.info/en/blog/novosti-interneta/proekt-planka-perehodit-na-nesvobodnuyu-liczenziyu)).
- "OIDC/SSO moves to PLANKA Pro with the next release" ([issue #1754](https://github.com/plankanban/planka/issues/1754)). Um resumo de busca indica que isso ocorreu na 2.2.0, em agosto de 2026.
- "Real-Time Updates: Instant syncing across all users, no refresh needed" e "Notifications through 100+ providers" ([README](https://github.com/plankanban/planka)).
- **Ideias a copiar:**
  1. Quadro Trello-like com sincronização em tempo real sem recarregar a página ([README](https://github.com/plankanban/planka)).
  2. Notificações plugáveis para mais de 100 provedores ([README](https://github.com/plankanban/planka)).

**Kanboard**
- "**This application is in maintenance mode**". O autor "is not actively developing any new major features (only small fixes)", e "New releases are published regularly depending on the contributions made by the community" ([README](https://github.com/kanboard/kanboard)).
- **Ideia a copiar:** escopo congelado e estável com stack mínima (PHP + SQLite) ([docs](https://docs.kanboard.org/v1/admin/requirements/)).

**Focalboard e Mattermost Boards/Playbooks**
- O README do Focalboard diz: "This repository is currently not maintained. … If you're looking for the Mattermost plugin please see mattermost/mattermost-plugin-boards" ([README](https://github.com/mattermost-community/focalboard)).
- O plugin Boards tem releases recentes (v10.0.0-rc1 em 21/09/2026) ([repo](https://github.com/mattermost/mattermost-plugin-boards)) e entra no Mattermost Entry com limite de 1.000 cards ([docs](https://docs.mattermost.com/product-overview/editions-and-offerings.html)).
- Playbooks: "a valid Mattermost Enterprise license is required to access all features if using this plugin in production". No Team Edition, só com os modos de teste e desenvolvedor, "not recommended in production" ([README](https://github.com/mattermost/mattermost-plugin-playbooks)).

**Wekan**
- "WeKan ® has real-time user interface" ([README](https://github.com/wekan/wekan)).
- O `docker-compose.yml` atual lista apenas as imagens `ghcr.io/wekan/wekan:latest` e `debian:bookworm-slim` ([docker-compose.yml](https://github.com/wekan/wekan/blob/main/docker-compose.yml)).
- **Ideia a copiar:** interface reativa em tempo real ([README](https://github.com/wekan/wekan)).

**Leantime**
- "Leantime is an open source project management system for non-project managers. Built with ADHD, dyslexia and autism in mind." O README mostra uma tela "my work dashboard" com métricas de "todos complete" e contribuição para metas ([README](https://github.com/Leantime/leantime)).
- **Ideias a copiar:**
  1. Uma tela "My Work" com metas e tarefas pessoais em números grandes ([README](https://github.com/Leantime/leantime)).
  2. Design pensado para pessoas neurodivergentes ([README](https://github.com/Leantime/leantime)).

**OpenProject**
- Team planner: "This feature is an Enterprise add-on and can only be used with Enterprise cloud or Enterprise on-premises in plans Basic, Professional, Premium, Corporate" ([docs](https://www.openproject.org/docs/user-guide/team-planner/)).
  - Os membros aparecem como linhas e a linha do tempo mostra 1, 2, 4 ou 8 semanas (ou semana útil).
  - Os pacotes de trabalho são cards arrastáveis entre pessoas e redimensionáveis ([docs](https://www.openproject.org/docs/user-guide/team-planner/)).
- Existe a "My page" com widgets ([docs](https://www.openproject.org/docs/user-guide/my-page/)); não confirmei a edição.
- **Ideias a copiar:**
  1. O Team planner como modelo exato da "tela de gestão de equipe", com pessoas × semanas e arrastar para reatribuir ([docs](https://www.openproject.org/docs/user-guide/team-planner/)).
  2. A "My page" com widgets como tela pessoal ([docs](https://www.openproject.org/docs/user-guide/my-page/)).

**Taiga e Tenzu**
- O Tenzu é o sucessor oficial do Taiga. A BIRU assumiu o "Taiga Next" em julho de 2024, e ele virou Tenzu ([BIRU: Introducing Tenzu](https://biru.sh/en/blog/introducing-tenzu/); [Tenzu: who are we](https://tenzu.net/en/who-are-we/)).
- A primeira versão estável saiu em setembro de 2025 (resumo de busca das páginas acima).
- A Kaleidos passou a desenvolver apenas o Penpot ([comunidade Taiga](https://community.taiga.io/t/state-of-taiga-as-a-whole/3831)).
- Há uma página do projeto Tenzu no site do NLnet ([NLnet](https://nlnet.nl/project/Tenzu/)), o que indica financiamento, mas não li o conteúdo.

### Inferences
- **Visão pessoal:** Plane ("Your work" + Home) e Leantime ("My Work") são as melhores referências. O OpenProject tem a "My page". Para o sistema próprio, a tela pessoal deve juntar três coisas: itens atribuídos, itens criados e itens seguidos (modelo do Plane), metas (modelo do Leantime) e notas rápidas (stickies do Plane).
- **Visão de carga da equipe:** o padrão a copiar é o Team planner do OpenProject (pessoas × semanas, arrastar e soltar), que no OpenProject é pago. O Huly oferece algo parecido de graça, mas exige servidor de 8 GB ou mais. No Plane, dashboards e time tracking são do plano Pro.
- **Kanban em tempo real:** só está confirmado em documentação para Planka e Wekan. Para um sistema próprio, websockets ou SSE no quadro são um requisito explícito, porque os projetos mais leves (Kanboard e, possivelmente, Vikunja) não anunciam isso.
- **Adoção rápida na LAN com 11 pessoas:** o Vikunja (binário único, AGPL, pt-BR) é o mais simples. O Planka é o mais "Trello" e tem tempo real, e a licença Fair Use permite uso interno, mas não é mais open source no sentido OSI. O Plane é o mais completo e cabe no limite de 12 usuários do Free, porém pede de 4 a 8 GB.
- **Evitar ou só estudar:** Focalboard avulso (parado), Taiga (legado, com sucessor pequeno e sem pt-BR) e Wekan (4 GB para produção e Meteor 3.6 em versão beta).

### Gaps
- O tempo real (websockets) em Plane, Vikunja, Leantime, OpenProject e Kanboard não foi verificado em fonte.
- Não confirmei se a Community Edition do Plane tem limite de usuários (o Free do cloud tem 12). Para 11 pessoas isso não bloqueia.
- Não achei consumo de RAM documentado para Vikunja, Planka, Kanboard e Leantime.
- O repositório do OpenProject tem um módulo `modules/resource_management`, e não verifiquei o que ele faz nem em qual edição está.
- Não verifiquei nesta rodada as visões de quadro do Focalboard/Boards (tabela, galeria, calendário).
- Não verifiquei a stack e os requisitos do Tenzu.

## 3. Tudo-em-um (Huly, Nextcloud Hub, AppFlowy, AFFiNE, Twake Workplace, Mattermost Boards/Playbooks): algum cobre chat + tarefas + arquivos + painel bem o suficiente para simplesmente adotar?

### Takeaway
Nenhum cobre as quatro frentes com leveza.
- O **Huly** é o mais completo (chat, tracker, documentos, planner de equipe e escritório virtual com voz e vídeo, com pt-BR), mas o self-host pede **no mínimo 8 GB de RAM** e cerca de 14 containers.
- O **Nextcloud Hub** é o mais maduro para arquivos, com pt-BR completo. O Hub 26 Summer (16/09/2026) trouxe o app **Teams**, boards do Deck pertencentes à equipe e canais de **Announcements** no Talk. O kanban do Deck, porém, é simples.
- O **AppFlowy** não serve para adoção gratuita: o servidor self-host virou comercial e o plano grátis tem 1 usuário.
- O **AFFiNE** tem o backend sob licença EE.
- O **Twake** não tem módulo de tarefas.
- O **Mattermost** depende de licença para ter Playbooks completo.

### Cited Findings

| Projeto | Repositório | ★ | Licença | Último release · último commit | Stack / serviços | Rodar numa máquina da LAN | pt-BR |
|---|---|---|---|---|---|---|---|
| Huly | [hcengineering/platform](https://github.com/hcengineering/platform) · [hcengineering/huly-selfhost](https://github.com/hcengineering/huly-selfhost) | 27.751 · 3.542 | EPL-2.0 | platform s0.7.437 (01/08/2026) · 22/09/2026. Selfhost: último release v0.7.242 (12/09/2025, mais de 12 meses), último commit 22/07/2026 | O `compose.yml` usa cockroachdb v24.2, redpanda v24.3.6, elasticsearch 7.14.2, minio e nginx, além de `hardcoreeng/` account, collaborator, front, fulltext, hulykvs, rekoni-service, stats, transactor e workspace ([compose.yml](https://github.com/hcengineering/huly-selfhost/blob/main/compose.yml)) | **Pesado**: "Minimum: 2 vCPUs and 8 GB RAM. Recommended: 4 vCPUs and 16 GB RAM or more" ([README](https://github.com/hcengineering/huly-selfhost)) | Sim, 66 arquivos, incluindo chat (`chunter`), tracker, drive, documentos e `love`, o escritório virtual ([exemplo](https://github.com/hcengineering/platform/blob/develop/plugins/chunter-assets/lang/pt-br.json)) |
| Nextcloud Hub (Files + Talk + Deck) | [nextcloud/server](https://github.com/nextcloud/server) · [nextcloud/spreed](https://github.com/nextcloud/spreed) (Talk) · [nextcloud/deck](https://github.com/nextcloud/deck) · [nextcloud/all-in-one](https://github.com/nextcloud/all-in-one) | 36.887 · 2.198 · 1.423 · 10.472 | AGPL-3.0 | server v35.0.1rc1 (20/09/2026); Talk v25.0.0 (16/09/2026); Deck v1.18.5 (17/09/2026); AIO v14.2.0 Beta (21/09/2026) | PHP; AIO = Docker | **Médio**: o mínimo é "128MB RAM per process" e o recomendado "512MB RAM per process" ([docs](https://docs.nextcloud.com/server/latest/admin_manual/installation/system_requirements.html)). O AIO usa por padrão "a max of 512 MB RAM per PHP process" ([AIO](https://github.com/nextcloud/all-in-one)) | Sim ([core pt_BR](https://github.com/nextcloud/server/blob/master/core/l10n/pt_BR.json), [Talk](https://github.com/nextcloud/spreed/blob/main/l10n/pt_BR.json), [Deck](https://github.com/nextcloud/deck/blob/main/l10n/pt_BR.json)) |
| AppFlowy | [AppFlowy-IO/AppFlowy](https://github.com/AppFlowy-IO/AppFlowy) · [AppFlowy-IO/AppFlowy-Cloud](https://github.com/AppFlowy-IO/AppFlowy-Cloud) | 76.891 · 2.003 | Cliente AGPL-3.0. **AppFlowy-Cloud ARQUIVADO**; o servidor atual vem de código comercial | Cliente v0.14.5 (feed atualizado em 22/09/2026), mas o último commit na `main` é de 26/06/2026. Cloud: 0.9.64 (04/07/2025), arquivado | Flutter/Dart (cliente), Rust (servidor antigo) | **Inviável de graça**: plano gratuito self-hosted "max_users: 1, max_guests: 3" ([issue #1570](https://github.com/AppFlowy-IO/AppFlowy-Cloud/issues/1570)) | Sim no cliente ([pt-BR.json](https://github.com/AppFlowy-IO/AppFlowy/blob/main/frontend/resources/translations/pt-BR.json)) |
| AFFiNE | [toeverything/AFFiNE](https://github.com/toeverything/AFFiNE) | 72.862 | Composta: MIT fora de `packages/backend` e `packages/common/native`. Esses dois usam a "AFFiNE Enterprise Edition (EE) license" ([LICENSE](https://github.com/toeverything/AFFiNE/blob/canary/LICENSE); [backend LICENSE](https://github.com/toeverything/AFFiNE/blob/canary/packages/backend/server/LICENSE)) | 2026.9.21-canary.912 · 22/09/2026 | TypeScript (+ código nativo) | Ver licença | Sim ([pt-BR.json](https://github.com/toeverything/AFFiNE/blob/canary/packages/frontend/i18n/src/resources/pt-BR.json)) |
| Twake Workplace (Linagora) | [linagora/twake-workplace](https://github.com/linagora/twake-workplace) · [twake-on-matrix](https://github.com/linagora/twake-on-matrix) (Chat) · [twake-drive](https://github.com/linagora/twake-drive) · [tmail-flutter](https://github.com/linagora/tmail-flutter) (Mail) | — · 166 · 983 · 654 | AGPL-3.0 | Chat v2.24.0 (18/09/2026); Drive 1.107.1-beta.2 (18/09/2026); Mail v0.37.2 (15/09/2026) | Chat sobre Matrix (Flutter); Mail em JMAP + Apache James; Drive com OnlyOffice ([Linagora](https://linagora.com/en/services/collaborative-suite-mail-chat-drive-calendar-contacts)) | Pesado ou complexo (inferência: vários produtos) | Chat e Mail sim ([Chat](https://github.com/linagora/twake-on-matrix/blob/main/assets/l10n/intl_pt_BR.arb), [Mail](https://github.com/linagora/tmail-flutter/blob/master/lib/l10n/intl_pt_BR.arb)); Drive não encontrado |
| Mattermost + Boards + Playbooks | ver seções 1 e 2 | | | | | Leve (Team Edition) | Sim (Playbooks: nenhum arquivo pt-BR encontrado) |

**Huly**
- "This repository includes several applications, such as Chat, Project Management, CRM, HRM, and ATS" ([README](https://github.com/hcengineering/platform)).
- Fontes secundárias descrevem os recursos ([elest.io](https://blog.elest.io/self-host-huly-one-open-source-app-to-replace-jira-linear-and-notion/); [OpenAlternative](https://openalternative.co/huly)):
  - tracker com sprints e kanban, com sincronização bidirecional com GitHub e GitLab;
  - "Team Planner consolidates individual tasks into a shared calendar so you can see workload across the whole team";
  - time-blocking no planner pessoal;
  - escritório virtual com salas de voz, vídeo e compartilhamento de tela;
  - chat com canais, DMs e threads;
  - documentos colaborativos com CRDT.
- O guia de self-host diz "I'm using a Basic Droplet on Digital Ocean with Ubuntu 24.04" e mostra o acesso em `http://localhost:8087` após cerca de 60 segundos ([README](https://github.com/hcengineering/huly-selfhost)).
- **Ideias a copiar:**
  1. O Team Planner, que junta as tarefas individuais num calendário compartilhado, combinado com time-blocking pessoal.
  2. Salas persistentes de "escritório virtual" (voz e vídeo).
  3. Chat ao lado do contexto do projeto (fontes secundárias acima).

**Nextcloud Hub**
- Hub 26 Summer, lançado em 16/09/2026 ([blog](https://nextcloud.com/blog/nextcloud-hub26-summer/)):
  - o novo app **Teams**, em que "each team has its own home section which connects files, tasks, knowledge";
  - no Deck, "Team ownership of boards";
  - no Talk, presets de "Channels and Announcements" (moderadores publicam para muitos com discussão restrita) e "Classified conversations".
- O AIO "values stability over new features" e espera o primeiro patch de cada versão principal antes de atualizar ([AIO](https://github.com/nextcloud/all-in-one)).
- **Ideias a copiar:**
  1. Uma "home da equipe" que conecta arquivos, tarefas e conhecimento.
  2. Canal de avisos (Announcements) com discussão restrita, que é uma boa fonte para a TV.
  3. Um container mestre (AIO) que orquestra os demais e cuida de atualizações e backup ([AIO](https://github.com/nextcloud/all-in-one)).

**AppFlowy**
- "This repository is archived and is no longer used to build or distribute the latest AppFlowy self-hosted server. For all self-hosted deployments and upgrades, please use the AppFlowy-SelfHost-Commercial repository". As imagens oficiais "are built from AppFlowy's actively maintained commercial server codebase" ([README AppFlowy-Cloud](https://github.com/AppFlowy-IO/AppFlowy-Cloud)).
- A issue de 26/09/2025 aponta um limite não documentado de 1 usuário no plano gratuito, visível nos logs como "max_users: 1, max_guests: 3" ([issue #1570](https://github.com/AppFlowy-IO/AppFlowy-Cloud/issues/1570)).

**AFFiNE**
- O backend "may only be used in production, if you … have agreed to … the AFFiNE Subscription Terms of Service … and otherwise have a valid AFFiNE Enterprise Edition subscription for the correct number of user seats". A cópia e a modificação são permitidas "for development and testing purposes, without requiring a subscription" ([backend LICENSE](https://github.com/toeverything/AFFiNE/blob/canary/packages/backend/server/LICENSE)).

**Twake Workplace**
- "The open-source alternative to Microsoft Teams". Oferece acesso a todos os produtos com uma única conta Twake ("single ID") ([README](https://github.com/linagora/twake-workplace)).
- Os componentes são Twake Chat (Matrix), Twake Mail (JMAP/James) e Twake Drive (OnlyOffice) ([Linagora](https://linagora.com/en/services/collaborative-suite-mail-chat-drive-calendar-contacts); [twake.app](https://twake.app/en/)).

### Inferences
- **Adotar um produto só:** o **Nextcloud Hub** (via AIO) é a aposta mais segura para 11 pessoas. Tem arquivos de primeira linha, Talk para o chat, Deck para kanban simples, o novo Teams como home da equipe e pt-BR completo. O ponto fraco é gestão de tarefas e carga da equipe mais rasa que a do Plane ou do OpenProject. O **Huly** é o mais próximo do "sistema desejado" completo, mas precisa de 8 a 16 GB de RAM, de um stack de cerca de 14 containers e de um guia de self-host com cara de tutorial. Serve para uma máquina dedicada robusta.
- **Não adotar** AppFlowy nem AFFiNE como servidor da equipe: licença ou modelo comercial no servidor e ausência de chat. Estudá-los só pela UX de documentos e blocos.
- O **Twake Workplace** substitui o Teams em chat, mail e drive, mas não tem kanban nem tela de gestão de equipe. Não vale a complexidade para 11 pessoas numa LAN.
- **Mattermost como tudo-em-um:** o Boards funciona (limitado no Entry) e o Playbooks exige licença Enterprise em produção. Na prática, é "chat + kanban básico".

### Gaps
- Não encontrei medição de RAM do Huly com cerca de 10 usuários; só os requisitos oficiais.
- Os recursos do Huly (Team Planner, escritório virtual) vêm de fontes secundárias e da lista de plugins traduzidos. Não li a documentação oficial do Huly.
- A página de preços do AFFiNE retornou HTTP 402. Não confirmei se existe plano self-hosted gratuito, com quantos membros, nem como a licença EE se aplica na prática às imagens oficiais.
- Não verifiquei se o Dashboard do Nextcloud tem widgets de equipe próprios para TV. O blog do Hub 26 Summer não detalha o Dashboard.
- Não verifiquei a complexidade real de instalar o Twake Workplace self-hosted, nem se ele tem algum módulo de tarefas.
- Não achei em fonte se o plugin Boards roda sem limites no Team Edition.

## 4. Ferramentas nativas de rede local (BeeBEEP, LocalSend, PairDrop/Snapdrop): o que aprender sobre descoberta automática na rede e transferência de arquivos?

### Takeaway
Os projetos resolvem as partes do problema de formas complementares:
- **Descoberta:** o **LocalSend** usa multicast UDP (224.0.0.167:53317) com um fallback de varredura HTTP.
- **Transferência:** o LocalSend usa HTTP(S) REST, e só um dos lados precisa rodar servidor.
- **Identidade:** o LocalSend identifica dispositivos por fingerprint.
- **Pareamento:** o **PairDrop** pareia dispositivos com um código de 6 dígitos ou QR e segredo persistente, oferece salas públicas por código de 5 letras e usa TURN quando há NAT.
- **Sem servidor:** o **BeeBEEP** é um mensageiro de escritório criptografado que guarda mensagens para quem está offline.

O Snapdrop foi comprado pela LimeWire e está parado. O PairDrop não publica release desde 02/2025.

### Cited Findings

| Projeto | Onde | ★ | Licença | Último release · último commit | Stack | pt-BR |
|---|---|---|---|---|---|---|
| LocalSend | [localsend/localsend](https://github.com/localsend/localsend) · [localsend/protocol](https://github.com/localsend/protocol) | 92.461 | Apache-2.0 | v1.18.2 (12/09/2026) · 14/09/2026 | Flutter/Dart | Sim ([pt-BR.json](https://github.com/localsend/localsend/blob/main/app/assets/i18n/pt-BR.json)) |
| PairDrop | [schlagmichdoch/PairDrop](https://github.com/schlagmichdoch/PairDrop) | 11.455 | GPL-3.0 | **v1.11.2 (24/02/2025), sem release há cerca de 19 meses** · último commit 22/04/2026 | JavaScript (web app) | Sim ([pt-BR.json](https://github.com/schlagmichdoch/PairDrop/blob/master/public/lang/pt-BR.json)) |
| Snapdrop | [SnapDrop/snapdrop](https://github.com/SnapDrop/snapdrop) | 19.735 | GPL-3.0 | **PARADO**: sem releases; último commit 10/02/2025 | JavaScript | Não |
| BeeBEEP | [SourceForge](https://sourceforge.net/projects/beebeep/) · [beebeep.net](https://www.beebeep.net/). No GitHub há só um fork: [Stkai/BeeBEEP](https://github.com/Stkai/BeeBEEP), 20★ | — | não verificada | 5.9.1: AppImage em 25/07/2026, Flatpak em 22/09/2026 ([RSS SourceForge](https://sourceforge.net/projects/beebeep/rss?path=/)) | desktop; a lista de arquivos inclui `linuxdeploy-plugin-qt` | não verificado |

**LocalSend (protocolo)**
- "LocalSend does not require a specific port or multicast address but instead provides a default configuration" ([protocol](https://github.com/localsend/protocol)):
  - multicast UDP na porta 53317, endereço 224.0.0.167;
  - HTTP (TCP) na porta 53317;
  - "The default multicast group is 224.0.0.0/24 because some Android devices reject any other multicast group".
- A spec tem seções de Fingerprint, Discovery (3.1 Multicast UDP, que é o padrão; 3.2 HTTP, "legacy mode") e File Transfer (upload API e reverse file transfer, que é a download API). "Some devices might not support multicast or might not be allowed to have an HTTP server running. The protocol only needs one party to set up an HTTP server" ([protocol](https://github.com/localsend/protocol)).

**PairDrop**
- "Send images, documents or text via peer-to-peer connection to devices on the same local network"; "Works on all devices with a modern web-browser" ([README](https://github.com/schlagmichdoch/PairDrop)).
- "Pair devices via a 6-digit code or a QR-Code. Paired devices always find each other via shared secrets independently of their local network. Pairing is persistent."
- "Enter a public room via a 5-letter code or a QR-code."
- "Devices outside of your local network that are behind a NAT are auto-connected via the PairDrop TURN server" ([README](https://github.com/schlagmichdoch/PairDrop)).

**Snapdrop**
- "Snapdrop has been acquired by LimeWire … The Github repository will stay as-is and you can still go ahead and download and run the classic Snapdrop on your own infrastructure" ([README](https://github.com/SnapDrop/snapdrop)).

**BeeBEEP**
- "the free office messenger that for 16 years has been helping people … keep messages safe and private"; "BeeBEEP does not need a server to work" ([beebeep.net](https://www.beebeep.net/)).
- "secure (encryption based on Rijndael Algorithm, AES) peer to peer office messenger … inside a local area network … without a server. BeeBEEP works also with VPNs" ([fork no GitHub](https://github.com/Stkai/BeeBEEP)).
- Guarda mensagens para entregar a usuários offline quando eles voltam. Roda em Windows, macOS, Linux, Raspberry e OS/2. Não tem versão móvel ([medevel](https://medevel.com/beebeep-free-office-messenger/)).

**Nome local via mDNS (referência vinda de outro projeto)**
- O FullPageOS é acessível em "`fullpageos.local` if your computer supports bonjour" ([README](https://github.com/guysoft/FullPageOS)).

### Inferences
- **Descoberta do servidor na LAN:** o sistema próprio pode anunciar o servidor por mDNS/Bonjour (`escritorio.local`, no padrão do FullPageOS). Assim os celulares e a TV acham o servidor sem configurar IP. Para descoberta entre pares, vale o desenho do LocalSend: anúncio multicast UDP com varredura HTTP de reserva, porque há Androids e redes que bloqueiam multicast.
- **Arquivos grandes dentro da LAN:** transferência direta P2P (WebRTC, como no PairDrop, ou HTTP entre pares, como no LocalSend) poupa o servidor. O servidor fica só com a sinalização e o histórico.
- **Identidade e pareamento:** fingerprint por dispositivo (LocalSend) e pareamento persistente por código de 6 dígitos ou QR (PairDrop) são padrões bons para "este celular é do fulano" e para a TV do escritório se autenticar sem teclado.
- **Resiliência sem servidor:** o store-and-forward do BeeBEEP (entregar quando o destinatário volta) é o comportamento esperado de qualquer chat de escritório. Num sistema cliente-servidor, isso vira fila de pendentes com push no reconectar.
- Para adotar diretamente, o **LocalSend** complementa bem qualquer escolha (transferência avulsa entre máquinas e celulares), está ativo e tem pt-BR. PairDrop e Snapdrop servem mais como estudo.

### Gaps
- Não verifiquei a licença do BeeBEEP, nem o mecanismo exato de descoberta (broadcast ou multicast, portas).
- Não verifiquei o mecanismo exato com que o PairDrop agrupa dispositivos "da rede local" no servidor de sinalização.
- Não medi desempenho nem compatibilidade de multicast na rede real do escritório (Wi-Fi com isolamento de clientes pode bloquear tudo isso).

## 5. Existe projeto open-source específico para painel de TV de escritório/wallboard de equipe (Dashy, Homepage, MagicMirror², Smashing/Dashing, Grafana em modo kiosk)? O que dá para aproveitar?

### Takeaway
Não existe um wallboard de equipe open-source mantido que integre chat e tarefas. O projeto feito explicitamente "para TVs", o **Smashing** (sucessor do Dashing), está parado desde 2023. O caminho é combinar três peças:
1. **Uma rota "modo TV" no próprio sistema.** Os padrões a copiar são a **rotação de playlists e o modo kiosk do Grafana**, o **sistema de módulos do MagicMirror²** e os widgets configurados por YAML com as chamadas de API feitas pelo servidor, como no **Glance** e no **Homepage**.
2. **Um aparelho na TV.** O **FullPageOS** transforma um Raspberry Pi numa tela que abre um site em tela cheia no boot. O **Anthias** agenda páginas, imagens e vídeos.
3. **Ideias de interação.** O QR code na tela grande para entrar numa sala (Campfire) e o canal de avisos (Nextcloud Talk Announcements).

### Cited Findings

| Projeto | Repositório | ★ | Licença | Último release · último commit | O que é / stack | pt-BR |
|---|---|---|---|---|---|---|
| Smashing (ex-Dashing) | [Smashing/smashing](https://github.com/Smashing/smashing) | 3.301 | MIT | **PARADO**: v1.3.6 (08/12/2022) · 10/03/2023 | "Sinatra based framework that lets you build excellent dashboards. It looks especially great on TVs" ([README](https://github.com/Smashing/smashing)) | Não |
| MagicMirror² | [MagicMirrorOrg/MagicMirror](https://github.com/MagicMirrorOrg/MagicMirror) | 23.881 | MIT | v2.37.0 (06/07/2026) · 01/07/2026 | "open source modular smart mirror platform"; "modular plugin system and uses Electron" ([README](https://github.com/MagicMirrorOrg/MagicMirror)) | Sim ([pt-br.json](https://github.com/MagicMirrorOrg/MagicMirror/blob/master/translations/pt-br.json)) |
| Grafana | [grafana/grafana](https://github.com/grafana/grafana) | 76.859 | AGPL-3.0 | 13.2.2 (15/09/2026) · 22/09/2026 | Playlists e modo kiosk ([docs](https://grafana.com/docs/grafana/latest/visualizations/dashboards/create-manage-playlists/)) | Sim ([pt-BR/grafana.json](https://github.com/grafana/grafana/blob/main/public/locales/pt-BR/grafana.json)) |
| Anthias (ex-Screenly OSE) | [Screenly/Anthias](https://github.com/Screenly/Anthias) | 3.676 | Dual: GPLv2 e licença comercial ([LICENSE](https://github.com/Screenly/Anthias/blob/master/LICENSE)) | 2026.09.0 (22/09/2026) · 22/09/2026 | "digital signage platform for Raspberry Pi devices and PCs" ([README](https://github.com/Screenly/Anthias)) | Não encontrado |
| FullPageOS | [guysoft/FullPageOS](https://github.com/guysoft/FullPageOS) | 4.480 | GPL-3.0 | 1.0.0 RC1 (04/06/2026) · 13/07/2026 | "A Raspberry Pi distribution to display one webpage in full screen. It includes Chromium … and the scripts necessary to load it at boot" ([README](https://github.com/guysoft/FullPageOS)) | Não se aplica |
| Glance | [glanceapp/glance](https://github.com/glanceapp/glance) | 37.162 | AGPL-3.0 | v0.8.6 (03/09/2026) · 05/09/2026 | Go; "Single <20mb binary"; "Low memory usage"; widgets Custom API, Extension, iframe e HTML ([README](https://github.com/glanceapp/glance); [configuration.md](https://github.com/glanceapp/glance/blob/main/docs/configuration.md)) | Não (sem i18n) |
| Homepage | [gethomepage/homepage](https://github.com/gethomepage/homepage) | 32.807 | GPL-3.0 | v2.4.0 (17/09/2026) · 17/09/2026 | "fully static, fast, secure fully proxied"; "Full i18n – Support for over 40 languages"; descoberta de serviços por rótulos Docker ([README](https://github.com/gethomepage/homepage)) | Sim ([pt-BR](https://github.com/gethomepage/homepage/tree/dev/public/locales/pt-BR)) |
| Dashy | [lissy93/dashy](https://github.com/lissy93/dashy) | 26.548 | MIT | v4.7.7 (22/09/2026) · 22/09/2026 | Vue; "Real-time status monitoring"; widgets; multipáginas; autenticação multiusuário; `docker run -p 8080:8080 lissy93/dashy` ([README](https://github.com/lissy93/dashy)) | Parcial: só `pt` ([pt.json](https://github.com/lissy93/dashy/blob/master/src/assets/locales/pt.json)) |
| Homarr | [homarr-labs/homarr](https://github.com/homarr-labs/homarr) | 4.767 | Apache-2.0 | v1.77.2 (18/09/2026) · 19/09/2026 | TypeScript | Sim ([pt-br.json](https://github.com/homarr-labs/homarr/blob/dev/packages/translation/src/lang/pt-br.json)) |

**Grafana (playlists e kiosk)**
- "A playlist is a list of dashboards that are displayed in a sequence. You might use a playlist to build situational awareness or to present your metrics to your team or visitors." "The playlist displays each dashboard for the time specified in the **Interval** field" ([docs](https://grafana.com/docs/grafana/latest/visualizations/dashboards/create-manage-playlists/)).
- "In kiosk mode, the main menu and top navigation bar of a dashboard are hidden. This can be useful if you want to display as much information as possible on the screen or use the dashboard to present information to a wider audience". Atalho: `d+k` ([docs](https://grafana.com/docs/grafana/latest/visualizations/dashboards/use-dashboards/)).

**Homepage e Glance**
- Homepage: "All API requests to backend services are proxied, keeping your API keys hidden" ([README](https://github.com/gethomepage/homepage)).
- Glance: "Uncached pages usually load within ~1s". A configuração tem widgets Custom API, iframe e HTML ([README](https://github.com/glanceapp/glance); [configuration.md](https://github.com/glanceapp/glance/blob/main/docs/configuration.md)).

**Anthias**
- "Formerly known as Screenly OSE, it was rebranded to clear up the confusion between Screenly (the paid version) and Anthias". Instala via balenaOS ou Raspberry Pi OS ([README](https://github.com/Screenly/Anthias)).

**Ideias de TV vindas de outros projetos**
- O QR code na tela grande para entrar numa sala de chat ([Campfire](https://once.com/campfire)) e os presets "Channels and Announcements" do Talk ([Nextcloud Hub 26 Summer](https://nextcloud.com/blog/nextcloud-hub26-summer/)).

### Inferences
- **Arquitetura da tela de TV no sistema próprio:**
  - uma rota somente leitura, `/tv`, com layout de "cenas" que rodam por intervalo (modelo de playlist do Grafana) e sem menus (modelo do kiosk);
  - cada cena é um módulo independente (modelo do MagicMirror²), por exemplo "quadro da equipe", "avisos", "aniversários/agenda" e "QR para entrar no chat";
  - os dados vêm do servidor, com as chaves protegidas (modelo de proxy do Homepage);
  - a configuração fica num arquivo YAML (modelo do Glance e do Homepage).
- **Aparelho da TV:** um Raspberry Pi com FullPageOS apontando para `http://servidor.local/tv` é a solução mais simples. O Anthias só compensa se quiserem agenda de conteúdos variados (vídeos, imagens, várias páginas). Um mini-PC com Chromium em kiosk também serve (inferência).
- **Adotar pronto para a TV:** o Grafana em kiosk + playlist é o mais robusto se os dados estiverem num banco SQL, como o Postgres do Plane ou do Mattermost. Isso é inferência: o Grafana lê SQL, mas não testei com esses esquemas. O Glance e o Homepage são leves, mas são painéis de links e status (homelab), não painéis de equipe.
- O Smashing deve ser tratado apenas como referência histórica de UX para TV (grade de widgets grandes), já que está parado desde 2023.

### Gaps
- Não encontrei nenhum projeto open-source ativo dedicado a "wallboard de equipe" que integre chat e tarefas. A busca foi limitada aos candidatos listados.
- Não medi o consumo de RAM de Grafana, Dashy, Homepage ou Homarr. Só o Glance declara "Low memory usage" e binário com menos de 20 MB.
- Não verifiquei o repositório antigo do Homarr. As 4.767 estrelas são só do `homarr-labs/homarr` (v1).
- Não verifiquei se o Anthias tem interface em pt-BR nem os termos da licença comercial.

## 6. Veredito: quais são melhores para adotar e quais são melhores para aprender?

### Takeaway
**Para adotar numa máquina da LAN com 11 pessoas**, há duas vias.
- **Combinação leve:** Mattermost Team Edition ou Zulip para o chat, Vikunja ou Plane CE para tarefas, Nextcloud para arquivos e LocalSend para transferências avulsas. Na TV, Grafana em kiosk ou uma página própria, num Raspberry com FullPageOS.
- **Um só produto:** Nextcloud Hub (Files + Talk + Deck + Teams) se a prioridade for arquivos e pt-BR. Huly se a prioridade for chat + tarefas + planner de equipe integrados e houver de 8 a 16 GB de RAM.

**Para aprender e construir um sistema próprio**, as melhores referências são:
- Campfire (arquitetura de monólito simples e QR na TV);
- Zulip (tópicos);
- Plane ("Your work", Home e i18n);
- Team planner do OpenProject e do Huly (tela de gestão de equipe);
- Vikunja (binário único e múltiplas visões);
- Planka (tempo real);
- protocolo do LocalSend e pareamento do PairDrop (rede local);
- Grafana, MagicMirror², Glance e Homepage (TV).

### Cited Findings
- Os limites do Mattermost Entry (10.000 mensagens visíveis, entre outros) versus o Team Edition (MIT, menos de 250 usuários ativados e sem SSO) estão nos [docs de edições](https://docs.mattermost.com/product-overview/editions-and-offerings.html). O requisito é de 1 vCPU e 2 GB para até 1.000 usuários ([docs](https://docs.mattermost.com/deployment-guide/software-hardware-requirements.html)).
- Zulip: 2 GB de RAM + 2 GB de swap e 1 CPU para instalações pequenas ([docs](https://zulip.readthedocs.io/en/stable/production/requirements.html)).
- Vikunja: binário único ([docs](https://vikunja.io/docs/installing/)). Plane: 2 cores e 4 GB, com 8 GB recomendados, e Free de 12 usuários ([docs](https://developers.plane.so/self-hosting/methods/docker-compose); [pricing](https://plane.so/pricing)).
- Nextcloud Hub 26 Summer: Teams, Deck de equipe e Talk Announcements ([blog](https://nextcloud.com/blog/nextcloud-hub26-summer/)). Huly: no mínimo 8 GB de RAM ([README](https://github.com/hcengineering/huly-selfhost)).
- Campfire: MIT e imagem única ([README](https://github.com/basecamp/once-campfire); [once.com](https://once.com/campfire)). Team planner do OpenProject: Enterprise ([docs](https://www.openproject.org/docs/user-guide/team-planner/)). Protocolo do LocalSend ([protocol](https://github.com/localsend/protocol)). Grafana: kiosk e playlists ([docs](https://grafana.com/docs/grafana/latest/visualizations/dashboards/create-manage-playlists/)).
- **Sinalizações (descontinuado, arquivado, licença alterada ou parado):**
  - **Focalboard** avulso: não mantido ([README](https://github.com/mattermost-community/focalboard)).
  - **conduwuit**: arquivado ([repo](https://github.com/x86pup/conduwuit)).
  - **AppFlowy-Cloud**: arquivado, e o servidor self-host agora é comercial ([README](https://github.com/AppFlowy-IO/AppFlowy-Cloud)).
  - **Snapdrop**: comprado pela LimeWire e parado ([README](https://github.com/SnapDrop/snapdrop)).
  - **Smashing**: parado desde 2023 ([repo](https://github.com/Smashing/smashing)).
  - **PairDrop**: sem release desde 02/2025 ([repo](https://github.com/schlagmichdoch/PairDrop)).
  - **Huly-selfhost**: último release no GitHub em 12/09/2025, mas com commits em 07/2026 ([repo](https://github.com/hcengineering/huly-selfhost)).
  - **Planka**: licença "Fair Use" e SSO passando para o Pro ([LICENSE.md](https://github.com/plankanban/planka/blob/master/LICENSE.md); [issue #1754](https://github.com/plankanban/planka/issues/1754)).
  - **Synapse**: de Apache-2.0 para AGPL-3.0 ([matrix-org/synapse](https://github.com/matrix-org/synapse); [element-hq/synapse](https://github.com/element-hq/synapse)).
  - **Mattermost**: edições reestruturadas ([blog](https://mattermost.com/blog/introducing-mattermost-entry/)).
  - **Rocket.Chat**: plano Pro legado desde 29/04/2026 ([docs](https://docs.rocket.chat/docs/our-plans)).
  - **AFFiNE**: backend sob licença EE ([LICENSE](https://github.com/toeverything/AFFiNE/blob/canary/packages/backend/server/LICENSE)).
  - **Revolt**: virou Stoat em 01/10/2025 ([AlternativeTo](https://alternativeto.net/news/2025/10/chat-app-revolt-rebrands-to-stoat-keeps-all-services-features-and-core-values-unchanged/)).
  - **Taiga**: sucedido pelo Tenzu ([BIRU](https://biru.sh/en/blog/introducing-tenzu/)).
  - **Kanboard**: em "maintenance mode" ([README](https://github.com/kanboard/kanboard)).
  - **Vikunja**: lançou a Vikunja Pro ([README](https://github.com/go-vikunja/vikunja)).
  - **ESS Community**: declarado para uso não comercial até 100 usuários ([README](https://github.com/element-hq/ess-helm)).

### Inferences
- **Melhores para ADOTAR (ordem sugerida para 11 pessoas numa LAN):**
  1. **Nextcloud Hub via AIO.** Um só produto maduro, com pt-BR, arquivos, chat (Talk), kanban (Deck) e home de equipe (Teams). Supre o requisito de "arquivos compartilhados" melhor que qualquer outro.
  2. **Mattermost Team Edition** (chat) com **Vikunja** ou **Plane CE** (tarefas). Os dois primeiros são leves e têm pt-BR. O Plane dá a melhor tela pessoal, e o Vikunja é o mais fácil de operar.
  3. **Huly**, se houver um servidor com 16 GB e a equipe quiser tudo integrado, incluindo o planner de carga da equipe e o escritório virtual.
  4. **LocalSend**, em qualquer cenário, para transferências avulsas.
  5. **Na TV:** Grafana em kiosk + playlist, ou a rota `/tv` do sistema escolhido, num Raspberry com FullPageOS.
- **Melhores para APRENDER (sistema próprio):**
  - **Campfire:** monólito Rails + SQLite numa imagem, com código de referência sob MIT, e a ideia do QR na TV.
  - **Zulip:** tópicos.
  - **Plane:** "Your work", Home com stickies e i18n por namespace.
  - **OpenProject e Huly:** Team planner, com pessoas × semanas e arrastar e soltar.
  - **Vikunja:** binário único, 4 visões e criação rápida com palavras-chave.
  - **Planka:** tempo real e notificações plugáveis.
  - **Leantime:** "My Work" acessível.
  - **LocalSend, PairDrop e BeeBEEP:** multicast mais fallback HTTP, pareamento por código e QR, e store-and-forward.
  - **Tuwunel:** servidor de binário único com banco embarcado.
  - **Grafana, MagicMirror², Glance e Homepage:** playlist e kiosk, módulos e YAML com proxy.
- **Não adotar:** AppFlowy (1 usuário grátis), AFFiNE (backend EE), Focalboard avulso, conduwuit, Snapdrop, Smashing, Twake (complexo e sem tarefas) e Rocket.Chat (pesado para 11 pessoas, com planos instáveis). Planka só se a equipe aceitar a licença não-OSI, que permite uso interno.

### Gaps
- Nenhum projeto foi instalado ou testado na prática. As avaliações de dificuldade vêm de requisitos oficiais e de READMEs.
- Não comparei custos de licenças pagas (Mattermost Professional, OpenProject Enterprise, Plane Pro) para o caso de a equipe querer o Team planner ou dashboards.
- Não avaliei a migração futura para a nuvem de cada opção, além do fato de a maioria oferecer versão cloud própria (Plane, Mattermost, Rocket.Chat, AppFlowy e AFFiNE citam planos cloud nas páginas consultadas).
