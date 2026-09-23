# Pasta sincronizada por pessoa, visível para a equipe e para o app web (11 pessoas, rede local)

Notas de pesquisa de 22/09/2026. A central de ajuda da Resilio (help.resilio.com) devolveu HTTP 403 para leitura automatizada; os dados vindos dela saíram de trechos de resultados de busca e estão marcados como "(trecho de busca)".

## Pergunta do objetivo: como as sete opções se comparam no cenário "cada pessoa tem uma pasta; o que ela coloca ali aparece para todos e no app web, com quem compartilhou e quando"?

### Takeaway
Só três opções dão "quem adicionou/alterou" de forma nativa e consultável por API: o Syncthing (campo `modifiedBy` com o ID do dispositivo, lido pela REST/Events API de um nó servidor), o Nextcloud (Activity API e webhooks trazem o `user`) e o Seafile (a listagem de diretório traz `modifier_email`/`modifier_name`). SMB e WebDAV só dizem "quem" se o servidor auditar, e o agente próprio dá controle total ao custo de construir e manter o software. O Resilio Sync saiu do páreo para uso empresarial barato: o Sync Business foi descontinuado, a versão 3.x gratuita é para uso não comercial e não achei API pública documentada para o Sync.

### Cited Findings

#### Syncthing (detalhes na seção própria abaixo)
- Sincronização P2P com TLS entre dispositivos. Cada dispositivo é identificado pelo Device ID, que é o hash SHA-256 do certificado, comparado com uma lista de dispositivos aceitos na conexão — [Syncthing Security](https://docs.syncthing.net/users/security.html)
- Detecta mudanças por observador de sistema de arquivos e por varredura completa, que por padrão roda de hora em hora. O observador acumula mudanças por 10 s (`fsWatcherDelayS`), e as exclusões esperam mais 1 min — [Understanding Synchronization](https://docs.syncthing.net/users/syncing.html)
- Tipos de pasta: Send & Receive, Send Only, Receive Only e Receive Encrypted (dispositivo não confiável) — [Folder Types](https://docs.syncthing.net/users/foldertypes.html); [Untrusted Devices](https://docs.syncthing.net/users/untrusted.html)
- Não tem arquivos sob demanda (placeholders): o recurso é um pedido aberto no GitHub — [Issue #10250](https://github.com/syncthing/syncthing/issues/10250); [Issue #8845](https://github.com/syncthing/syncthing/issues/8845)
- As versões antigas (`.stversions`) só guardam mudanças recebidas de outros dispositivos, não as locais — [File Versioning](https://docs.syncthing.net/users/versioning.html)
- A REST API expõe `/rest/db/browse`, `/rest/db/file` (com `modifiedBy`), `/rest/events` e `/rest/events/disk`, e o evento `RemoteChangeDetected` traz `modifiedBy` — [REST API](https://docs.syncthing.net/dev/rest.html); [RemoteChangeDetected](https://docs.syncthing.net/events/remotechangedetected.html)

#### Resilio Sync
- O produto se apresenta como "Personal file sync and share powered by P2P" — [Resilio Sync](https://www.resilio.com/sync/)
- O Resilio Sync 3.0 liberou para todos os recursos que eram do Pro: sincronizar cada pasta automaticamente com os dispositivos vinculados, gestão de permissões, "Download only the files you need without replicating entire folders" e limite de banda — [Blog Resilio Sync 3.0](https://www.resilio.com/blog/resilio-sync-3-0)
- Licença do 3.0: quem se registra e declara uso não comercial recebe licença gratuita. O Sync v3.x não aceita licenças do Sync Business, e a Resilio indica o Active Everywhere para uso comercial — [FAQ Resilio Sync 3.0.0](https://help.resilio.com/hc/en-us/articles/32109883606035-FAQ-Resilio-Sync-3-0-0) (trecho de busca); [Licensing in Resilio Sync 3.0](https://help.resilio.com/hc/en-us/articles/31116248751123-Licensing-in-Resilio-Sync-3-0) (trecho de busca)
- Sync Business: "Beginning August 7, 2024, Sync Business 2.8 will be the final upgrade available". A empresa recomenda o Resilio Active Everywhere, com preço sob consulta ("Request Pricing") e uma "Centralized Automation API" REST para "Manage agents, create groups, control jobs, or report on data transfers" — [Sync Business Transition](https://www.resilio.com/sync-business/)
- Selective Sync cria arquivos-placeholder `.rsls` de 0 byte; o conteúdo baixa com duplo clique ou com "Sync to this device" — [Selective Sync](https://help.resilio.com/hc/en-us/articles/205458095-Selective-Sync) (trecho de busca); [What Is an RSLS File](https://help.resilio.com/hc/en-us/articles/206115384-What-Is-an-RSLS-File) (trecho de busca)
- Conflitos geram arquivos com ".Conflict" no nome (ex.: `filename.Conflict.jpg`). A pasta Archive guarda versões apagadas ou modificadas por outros dispositivos, por padrão 30 dias no desktop e 1 dia no celular — [Conflict files in Sync](https://help.resilio.com/hc/en-us/articles/204753629-Conflict-files-in-Sync) (trecho de busca); [Using Archive for file versioning](https://help.resilio.com/hc/en-us/articles/204754239-Using-Archive-for-file-versioning-and-restoring-deleted-files) (trecho de busca); [Understanding the Archive folder (Active Everywhere)](https://www.resilio.com/documentation/content/reference-information/understanding_the_archive_folder/)
- A pasta `.sync` de cada compartilhamento guarda `IgnoreList`, `StreamsList` e `Archive` — [What is '.sync' folder](https://help.resilio.com/hc/en-us/articles/206217185-What-is-sync-folder-and-StreamsList-IgnoreList-and-Archive-inside) (título do artigo)
- API: houve uma "BitTorrent Sync API" para desenvolvedores. Hoje existe um wrapper não oficial feito por engenharia reversa (resilio-sync-cli), e a página `resilio.com/api/sync/` veio sem conteúdo na leitura — [Blog BitTorrent Sync API](https://www.resilio.com/blog/bittorrent-sync-beta-api-now-available-to-developers-2); [resilio-sync-cli](https://github.com/PythonNut/resilio-sync-cli); [Resilio Platform API](https://www.resilio.com/api/connect/documentation/)

#### Nextcloud (cliente desktop e arquivos virtuais)
- Arquivos virtuais no Windows desde o cliente 3.2 — [Nextcloud desktop client 3.2](https://nextcloud.com/blog/nextcloud-desktop-client-3-2-with-status-feature-and-virtual-files-available-now/)
- No Windows, os arquivos virtuais usam a Windows Cloud Files API (`virtualFilesMode=wincfapi`). Um bug aberto em 18/09/2026, no Nextcloud Desktop 34.0.4 com Windows 11, mostra pastas remotas vazias até alguém criar uma subpasta — [Issue #10871](https://github.com/nextcloud/desktop/issues/10871)
- No macOS, os arquivos virtuais usam File Provider. A documentação diz que, "unlike on Windows, virtual files support on macOS is provided by a separate client version", e recomenda o app `notify_push` no servidor para detectar mais rápido as mudanças remotas — [macOS Virtual Files client](https://docs.nextcloud.com/server/latest/user_manual/sv/desktop/macosvfs.html) (trecho de busca; a página veio vazia na leitura)
- Há relatos de 2025 de arquivos virtuais indisponíveis no macOS 15.6 com o cliente 3.16.6 e de bug no 3.17.0: o Finder mostra "Nextcloud is signed out" no domínio de arquivos virtuais — [Fórum Nextcloud](https://help.nextcloud.com/t/virtual-file-support-not-available-in-nextcloud-desktop-client-on-macos-15-6-despite-being-enabled/230239); [Issue #8599](https://github.com/nextcloud/desktop/issues/8599)
- Conflitos: o cliente renomeia a versão local para algo como `test (conflicted copy 2022-02-03 084856).txt`, baixa a versão do servidor e, por padrão, não envia a cópia em conflito. O aviso aparece por notificação, ícone de bandeja e selo amarelo — [conflicts.rst](https://github.com/nextcloud/documentation/blob/master/user_manual/desktop/conflicts.rst)
- Lixeira: o padrão `auto` guarda os itens por 30 dias e depois apaga quando precisa de espaço. Um job em segundo plano faz a exclusão definitiva — [Deleted Items (trash bin)](https://docs.nextcloud.com/server/stable/admin_manual/configuration_files/trashbin_configuration.html)
- Integração pelo WebDAV: o PROPFIND devolve `d:getlastmodified`, `oc:fileid`, `oc:owner-id`, `oc:owner-display-name`, `nc:creation_time` e `nc:upload_time`, entre outros, e existem endpoints para Trashbin e Versions — [WebDAV Basic](https://docs.nextcloud.com/server/latest/developer_manual/client_apis/WebDAV/basic.html)
- Activity API v2: `GET /ocs/v2.php/apps/activity/api/v2/activity`, com filtros `all`/`self`/`by`/`files`/`filter` (por `object_type`/`object_id`) e parâmetros `since`, `limit` (padrão 50), `sort`, `search`, `actor`, `from`/`to`. Cada item traz `activity_id`, `app`, `type` (ex.: `file_created`), `user`, `subject`, `object_name` e `datetime` — [Activity endpoint v2](https://github.com/nextcloud/activity/blob/master/docs/endpoint-v2.md)
- Webhook Listeners vem embutido e entrou no Nextcloud 30 (30.0.1). Os eventos incluem `NodeCreatedEvent`, `NodeWrittenEvent`, `NodeDeletedEvent`, `NodeRenamedEvent`, `NodeCopiedEvent` e `NodeRestoredEvent`. O payload traz `user` com `uid` e `displayName`. O disparo roda em jobs de segundo plano, "by default, webhooks are triggered every 5 minutes"; workers dedicados reduzem o atraso — [Webhook Listeners](https://docs.nextcloud.com/server/latest/admin_manual/webhook_listeners/index.html); [PR #45475](https://github.com/nextcloud/server/pull/45475); [Docs NC 30](https://docs.nextcloud.com/server/30/admin_manual/webhook_listeners/index.html)
- O `notify_push` manda por WebSocket as mensagens `notify_file`, `notify_activity` e `notify_notification`. Funciona em regime de "best effort" (pode faltar ou sobrar notificação), e há um DEVELOPING.md para apps de terceiros — [notify_push](https://github.com/nextcloud/notify_push)

#### Seafile (cliente de sincronização e SeaDrive)
- O modelo de dados é parecido com o do Git (Repo, Commit, FS, Block): os arquivos viram blocos, e não arquivos comuns no disco do servidor. O `seaf-fuse` monta os arquivos no servidor só para leitura — [Data Model](https://manual.seafile.com/latest/develop/data_model/); [FUSE extension](https://manual.seafile.com/11.0/extension/fuse/)
- O SeaDrive 3 no macOS usa a File Provider API (macOS 12.1 ou posterior) e não instala extensão de kernel. No Windows, o SeaDrive 3 pede Windows 10 1709 ou posterior — [Drive Client changelog](https://manual.seafile.com/latest/changelog/drive-client-changelog/); [Drive Client for Windows 10](https://haiwen.github.io/seafile-user-manual/drive_client/drive_client_for_win10/)
- A Cloud Files API do Windows "is already used by ... OneDrive, Synology Drive, and Seafile" — [Nextcloud desktop issue #2637](https://github.com/nextcloud/desktop/issues/2637) (trecho de busca)
- Conflitos: o Seafile mantém a primeira versão que chegou à nuvem e renomeia a outra, por exemplo `test.txt (SFConflict name@example.com 2015-03-07-11-30-28)` — [File conflicts](https://help.seafile.com/syncing_client/file_conflicts/)
- O histórico tem retenção configurável por biblioteca, e a limpeza automática da lixeira é de 30 dias por padrão — [Setting history retention](https://help.seafile.com/file_folder_managing/setting_library_history/); [seafile.conf](https://haiwen.github.io/seafile-admin-docs/12.0/config/seafile-conf/) (trecho de busca)
- A listagem de diretório da API v2.1 traz `modifier_email` e `modifier_name` para arquivos, como em `"modifier_email": "imwhatiam123@gmail.com", "modifier_name": "lian"` — [Directories web-api v2.1](https://plus.seafile.com/published/web-api/v2.1/directories.md) (trecho de busca; a página lida mostrou só o exemplo antigo `api2/.../dir/`, sem esses campos); [python-seafile](https://github.com/haiwen/python-seafile)
- Atividades: `GET /api/v2.1/activities/` devolve `op_type`, `obj_type`, `path`, `name`, `author_email`, `author_name` e `time` — [Get file activities](https://seafile-api.readme.io/reference/get_api-v2-1-activities). Em 2016 a Community Edition devolvia `"Events not enabled."` — [Issue #1587](https://github.com/haiwen/seafile/issues/1587)
- Notification Server (desde a 10.0): conexão WebSocket de mão dupla com clientes e interface web. Avisa biblioteca atualizada, mudança de lock e mudança de permissão de diretório. Não funciona com SQLite (exige MySQL/MariaDB) e usa a porta 8083 — [Notification Server](https://haiwen.github.io/seafile-admin-docs/11.0/deploy/notification-server/)
- Webhooks nativos: só achei pedidos de recurso — [Fórum Seafile](https://forum.seafile.com/t/trigger-webhook-for-notifications/12923); [Issue #2239](https://github.com/haiwen/seafile/issues/2239)
- Seafile 13.0 anunciado em 05/01/2026. A Community Edition não aceita mais implantação por pacote binário e recomenda Docker — [Seafile 13.0 is ready](https://forum.seafile.com/t/seafile-13-0-is-ready/24876); [Upgrade notes 13.0](https://manual.seafile.com/latest/upgrade/upgrade_notes_for_13.0.x/)

#### Unidade de rede SMB (detalhes na seção própria)
- Windows 10/11 cliente: 20 conexões simultâneas de entrada para serviços de arquivo, pela EULA — [Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/1668518/windows-11-connection-limit-exists)
- Offline Files (Sync Center) não existe no Windows Home, só no Pro, Enterprise e Education — [Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/4038017/cant-enable-offline-files-on-windows-11-home)
- O Samba `vfs_full_audit` registra cada operação com prefixo configurável, como `%u` (usuário), `%I` (IP) e `%S` (compartilhamento) — [vfs_full_audit](https://www.samba.org/samba/docs/current/man-html/vfs_full_audit.8.html); [std.rocks](https://std.rocks/gnulinux_samba_logs.html)

#### Montagem WebDAV
- A Microsoft marcou o WebClient (WebDAV) como descontinuado em novembro de 2023. O serviço não inicia por padrão e pode ser removido numa versão futura — [Neowin](https://www.neowin.net/news/microsoft-deprecates-three-more-windows-features/); [Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/2187205/regarding-deprecated-of-webclient-(webdav)-service)
- O limite padrão de arquivo no Windows é 50 MB (`FileSizeLimitInBytes`, erro 0x800700DF), com máximo de `FFFFFFFF` (4 GB) e reinício obrigatório — [MyWorkDrive](https://www.myworkdrive.com/blog/webdav-file-size-limit)
- O Explorer só manda Basic Auth por HTTPS. Aceitar HTTP exige `BasicAuthLevel=2`, o que não se recomenda — [SFTPGo docs](https://docs.sftpgo.com/enterprise/webdav/)
- No macOS, o Finder por WebDAV fica lento porque dispara muitos PROPFIND por arquivo, lê `.DS_Store` em cada pasta e testa o arquivo AppleDouble de quase todo arquivo. A recomendação é usar clientes de terceiros (Cyberduck, Transmit, Mountain Duck) — [QNAP FAQ](https://www.qnap.com/en/how-to/faq/article/why-is-mac-finder-slow-when-accessing-nas-shared-folders-via-webdav); [AnyStorage](https://anystorage.dev/webdav-slow-on-mac)

#### Agente próprio leve (detalhes na seção própria)
- chokidar v5 (nov/2025) é só ESM e exige Node 20 ou superior. A v4 (set/2024) cortou o suporte a glob. A opção `awaitWriteFinish` segura os eventos até o tamanho do arquivo parar de mudar (`stabilityThreshold` padrão de 2000 ms, `pollInterval` de 100 ms) — [chokidar](https://github.com/paulmillr/chokidar)
- @parcel/watcher usa FSEvents (macOS), ReadDirectoryChangesW (Windows), inotify (Linux) e Watchman. Tem `writeSnapshot`/`getEventsSince` para descobrir o que mudou enquanto o app estava fechado e é usado pelo VS Code, Nx, Nuxt e Tailwind IntelliSense — [@parcel/watcher](https://github.com/parcel-bundler/watcher)
- fsnotify (Go) não observa pastas recursivamente e usa kqueue no macOS, que pede um descritor por arquivo — [fsnotify](https://github.com/fsnotify/fsnotify)
- notify (Rust) 8.x usa FSEvents por padrão no macOS, ReadDirectoryChangesW no Windows e inotify no Linux. O `notify-debouncer-full` rastreia renomeações por file ID — [notify](https://docs.rs/notify/latest/notify/)
- Tauri v2: a bandeja vem da feature `tray-icon` (`TrayIconBuilder`), e o plugin de autostart usa `MacosLauncher::LaunchAgent` no macOS — [Tauri System Tray](https://v2.tauri.app/learn/system-tray/); [Guia DEV Community](https://dev.to/hiyoyok/complete-guide-to-building-a-macos-menu-bar-app-with-tauri-v2-aji)
- Go: `fyne-io/systray` roda em Windows, macOS, Linux e BSDs e exige cgo — [fyne-io/systray](https://github.com/fyne-io/systray)

### Inferences
- Síntese dos achados acima, para decisão. "Inferência" marca o que deduzi sem fonte direta.

| Opção | Onde ficam os arquivos | "Quem adicionou" nativo | Eventos em tempo real para o app web | Conflitos | Versões e lixeira | Instalação por máquina | Máquina ou servidor desligado |
|---|---|---|---|---|---|---|---|
| Syncthing em malha (pasta única com todos) | Cópia completa nas 11 máquinas (sem sob demanda) | Sim: `modifiedBy` (ID curto do dispositivo) | Long-poll `/rest/events/disk` num nó servidor | `.sync-conflict-<data>-<hora>-<ID>`; as cópias se propagam para todos | `.stversions`, só para mudanças vindas de outros | App + troca de Device IDs (introducer automatiza) | Quem está ligado sincroniza entre si; arquivo novo de quem está desligado espera |
| Syncthing "caixa de saída" (cada pessoa: send-only para o hub) | Máquina do dono + hub | Sim: `modifiedBy`, e a própria pasta já identifica a pessoa | Idem, no hub | Quase nulos: um escritor por pasta (inferência) | No hub, que recebe tudo como mudança remota | App + 1 pareamento com o hub | Mudanças ficam na fila até o hub voltar (inferência) |
| Resilio Sync 3.x | Cópia completa ou placeholders `.rsls` | Não documentado | Sem API pública documentada para o Sync | `.Conflict` | Archive, 30 dias | App + chave ou link | P2P; licença gratuita só para uso não comercial |
| Nextcloud | Servidor + cliente (sync completo ou arquivos virtuais) | Sim: Activity API e webhooks com `user` | Webhooks (atraso padrão de até ~5 min, menor com workers) e `notify_push` (best effort) | `(conflicted copy …)` fica só local | Versões + lixeira de 30 dias | Cliente + login | Servidor fora = ninguém publica; cliente enfileira (inferência) |
| Seafile | Servidor em blocos + cliente sync ou SeaDrive | Sim: `modifier_email`/`modifier_name` na listagem | Notification Server (WebSocket); activities talvez só no Pro | `(SFConflict email data)` | Histórico por biblioteca + lixeira de 30 dias | Cliente + login | Igual ao Nextcloud |
| SMB (servidor central) | Só no servidor | Não, a menos que o servidor audite (Samba `full_audit` com `%u`) | Observador local no servidor; não pelo cliente SMB | Não há sync; há edição simultânea e locks | Depende de snapshot no servidor (não pesquisado) | Nenhuma (mapear a unidade) | Sem servidor, sem acesso; offline só no Windows Pro+ |
| WebDAV montado | Só no servidor | O servidor vê o usuário autenticado em cada PUT/MOVE/DELETE (inferência) | O próprio servidor emite (inferência) | Depende do servidor | Depende do servidor | Nativo no Finder e no Explorer, mas WebClient descontinuado e limite de 50 MB | Sem servidor, sem acesso |
| Agente próprio | Máquina do dono + servidor da equipe | Sim: token por pessoa | O servidor emite por WebSocket/SSE | Você define; a caixa de saída evita conflito | Você define (ex.: versão a cada upload) | App assinado + Gatekeeper/TCC no macOS | Fila local até o servidor voltar |

- Para "com quem compartilhou e quando", o fator decisivo é ter um ponto central sempre ligado que veja tudo e registre autor e hora. Todas as opções boas acabam com um "servidor da equipe": o hub Syncthing, o servidor Nextcloud/Seafile ou o backend do agente.
- O Resilio fica em desvantagem por dois motivos documentados: licença (uso comercial exige o Active Everywhere, com preço sob consulta) e falta de API pública documentada para o Sync.
- O Seafile guarda os arquivos em blocos, então o app web próprio não consegue ler o disco do servidor diretamente: precisa passar pela API ou pelo `seaf-fuse`, que só lê. No hub Syncthing, os arquivos ficam em pastas comuns e o app web pode servi-los direto do disco.
- O Nextcloud tem a integração mais rica para app de terceiros (WebDAV + Activity + webhooks com usuário), mas o atraso padrão dos webhooks (cron de 5 min) pede workers dedicados se "tempo real" for requisito. Também é o servidor mais pesado de operar (inferência; não medi).
- O agente próprio é a única opção em que "quem" vem de uma identidade de pessoa, e não de dispositivo, sem servidor de terceiros. Em troca, você passa a manter um software de sincronização, com todas as armadilhas de observadores de arquivos descritas abaixo.

### Gaps
- Não achei documentação oficial atual do Resilio Sync 3.x sobre plataformas suportadas, API e regras de conflito; a central de ajuda bloqueou leitura automatizada (HTTP 403).
- Não confirmei se o cliente de arquivos virtuais do Nextcloud para macOS ainda é uma build separada em 2026. A documentação diz "separate client version", mas os bugs do 3.17.0 sugerem integração ao cliente normal. O suporte a arquivos virtuais no Linux não foi pesquisado.
- Não confirmei se `/api/v2.1/activities/` funciona na Community Edition atual do Seafile; a única evidência de bloqueio é de 2016.
- Não pesquisei versionamento e snapshots de servidores SMB (ex.: Btrfs/ZFS, Cópias de Sombra do Windows).

## Syncthing: como funcionam a REST API e a Events API, um nó servidor pode ser hub, como são os conflitos, quais são os clientes recomendados para macOS e Windows em 2026 e há problemas com 11 dispositivos?

### Takeaway
A Events API é um long-poll em `GET /rest/events` (ou `/rest/events/disk`, só com `LocalChangeDetected` e `RemoteChangeDetected`), com IDs sequenciais e buffer limitado. `RemoteChangeDetected` traz `modifiedBy` (ID curto do dispositivo autor) e `ItemFinished` confirma a gravação. Um nó servidor funciona bem como hub com pastas receive-only e versionamento, mas não como "receive encrypted", porque aí nem ele consegue ler os arquivos. Em 2026 o app oficial do macOS segue ativo mas atrasa releases, e no Windows o SyncTrayzor original foi arquivado: use o fork SyncTrayzor v2 (GermanCoding) ou o Syncthing Windows Setup.

### Cited Findings
**Events API**
- Eventos saem de `GET /rest/events` por "a simple long polling interface". Cada evento tem `id`, `globalID`, `time`, `type` e `data`. O `id` "always increases by 1", e um salto maior indica que eventos foram pulados — [Event API](https://docs.syncthing.net/dev/events.html)
- Os tipos listados incluem `LocalChangeDetected`, `RemoteChangeDetected`, `ItemStarted`, `ItemFinished`, `LocalIndexUpdated`, `RemoteIndexUpdated`, `FolderCompletion`, `FolderSummary`, `DeviceConnected`/`DeviceDisconnected`, `DownloadProgress`, `StateChanged` e `PendingDevicesChanged`, entre outros — [Event API](https://docs.syncthing.net/dev/events.html)
- Parâmetros: `since=<lastSeenID>`, `limit=<n>`, `timeout=<segundos>` (padrão 60 s, que devolve array vazio) e `events=TipoA,TipoB`. Sem filtro, vêm todos os eventos "except LocalChangeDetected and RemoteChangeDetected". `/rest/events/disk` já vem filtrado só com esses dois — [GET /rest/events](https://docs.syncthing.net/rest/events-get.html)
- Buffer: "There is a limit to the number of events buffered, so if the rate of events is high or the time between polling calls is long some events might be missed. This can be detected by noting a discontinuity in the event IDs." — [GET /rest/events](https://docs.syncthing.net/rest/events-get.html)
- `RemoteChangeDetected`: "Generated upon scan whenever a file is locally updated due to a remote change." Exemplo de `data`: `{"type":"file","action":"deleted","folder":"Dokumente","folderID":"Dokumente","path":"testfile","label":"Dokumente","modifiedBy":"BPDFDTU"}`. O campo `folderID` está obsoleto desde a v1.1.2 (use `folder`) — [RemoteChangeDetected](https://docs.syncthing.net/events/remotechangedetected.html)
- `LocalChangeDetected`: "Generated upon scan whenever the local disk has discovered an updated file from the previous scan. This does not include events that are discovered and copied from other devices". Traz `action`, `folder`, `label`, `path` e `type`, sem `modifiedBy` — [LocalChangeDetected](https://docs.syncthing.net/events/localchangedetected.html)
- `ItemFinished`: "Generated when Syncthing ends synchronizing a file to a newer version". Traz `item`, `folder`, `error` (null ou mensagem), `type` e `action`, que pode ser `update`, `metadata` ou `delete` — [ItemFinished](https://docs.syncthing.net/events/itemfinished.html)

**REST API**
- Autenticação pelo cabeçalho `X-API-Key` ou por `Authorization: Bearer <api-key>`. A chave é gerada na GUI ou fica em `configuration/gui/apikey` — [REST API](https://docs.syncthing.net/dev/rest.html)
- Endpoints úteis ao app web: `/rest/db/browse` (árvore), `/rest/db/file` (um arquivo), `/rest/db/status`, `/rest/db/completion`, `/rest/db/need`, `/rest/db/localchanged`, `/rest/folder/versions` (versões guardadas), `/rest/folder/errors`, `/rest/stats/device` e `/rest/config/*` — [REST API](https://docs.syncthing.net/dev/rest.html)
- `GET /rest/db/file` devolve `local` e `global`, cada um com `modified`, `modifiedBy` (ex.: `"523ITIE"`), `size`, `deleted`, `sequence` e `version` (ex.: `["523ITIE:1664345275"]`). Também devolve `availability` com o ID completo de quem tem o arquivo — [GET /rest/db/file](https://docs.syncthing.net/rest/db-file-get.html)
- A GUI e a API escutam por padrão em `127.0.0.1:8384`; acesso externo "is not necessary for a typical installation" e o túnel SSH é a alternativa sugerida — [Firewall Setup](https://docs.syncthing.net/users/firewall.html)

**Hub: introducer, send-only, receive-only, receive encrypted**
- Send Only: "all changes from other devices in the cluster are ignored". O botão "Override Changes" impõe o estado local ao cluster — [Folder Types](https://docs.syncthing.net/users/foldertypes.html)
- Receive Only: as mudanças do cluster são aplicadas, e as locais não se distribuem. "Revert Local Changes" apaga os arquivos adicionados localmente e ressincroniza os modificados. Em conflito, "the cluster version as the winner" — [Folder Types](https://docs.syncthing.net/users/foldertypes.html)
- Receive Encrypted (dispositivo não confiável): os dados são cifrados com senha + ID da pasta (XChaCha20-Poly1305 e AES-SIV, chave via scrypt). O dispositivo não vê conteúdo, nomes nem metadados, e "Your directory structure is not replicated". Vazam o ID/rótulo da pasta e os tamanhos. O recurso "should still be considered beta / testing only", e renomear sai caro (reenvio de dados) — [Untrusted Devices](https://docs.syncthing.net/users/untrusted.html)
- Introducer: configura automaticamente IDs, rótulos e endereços de dispositivos que têm pastas em comum com o introducer; mudanças valem na próxima conexão. Cuidados: um dispositivo removido à mão "will be automatically re-added" enquanto o introducer estiver marcado; dois introducers um do outro ficam "re-introducing" o removido; e o introducer do seu introducer também vira seu — [Introducer Configuration](https://docs.syncthing.net/users/introducer.html)
- Para topologia em estrela, uma pessoa desligou Global Discovery, Local Discovery e relays para os clientes só falarem com o servidor. calmh (desenvolvedor líder) sugeriu endereço vazio ou remover os endereços de escuta do outro lado — [Running Syncthing in a star topology](https://forum.syncthing.net/t/running-syncthing-in-a-star-topology/18096)
- Em 2023, com 5 notebooks, a resposta do fórum foi que "a mesh ... layout is more resilient than a hub-and-spoke model". O receio registrado é que, com o hub desligado, os outros não recebem os arquivos novos. Introducer e REST API foram citados para automatizar a malha — [Sync All Users to All Users or central hub](https://forum.syncthing.net/t/sync-all-users-to-all-users-or-central-hub-to-clients/20917)
- Um guia comunitário de 2026 (fonte secundária) diz que a estrela com um nó sempre ligado "is usually better" com muitos dispositivos, porque novos dispositivos só pareiam com o hub — [knightli.com](https://knightli.com/en/2026/05/31/syncthing-multi-device-folder-management/)

**Conflitos**
- Nome: "`<filename>.sync-conflict-<date>-<time>-<modifiedBy>.<ext>`". Quem tem o mtime mais antigo vira a cópia de conflito; em empate, perde o dispositivo com "the larger value of the first 63 bits" do ID. Se o conflito for modificação contra exclusão e a exclusão vencer, o arquivo vira cópia de conflito. As cópias de conflito "are treated as normal files ... so they are propagated between devices" — [Understanding Synchronization](https://docs.syncthing.net/users/syncing.html)
- Na v2.0.0, a resolução de conflitos passou a aceitar arquivos excluídos como vencedores — [Release v2.0.0](https://github.com/syncthing/syncthing/releases/tag/v2.0.0)
- O Syncthing nunca grava direto no arquivo final: usa temporários `.syncthing.<nome>.tmp` (no Windows, `~syncthing~<nome>.tmp`) e depois move por cima. Em erro, o temporário fica até um dia — [Understanding Synchronization](https://docs.syncthing.net/users/syncing.html)

**Versionamento**
- Tipos: Trash Can (`cleanoutDays`), Simple (`keep`, `cleanoutDays`), Staggered (`maxAge`, intervalos de 1 h, 1 dia e 30 dias) e External (comando próprio). Tudo fica em `.stversions`. "Versioning applies to changes received from other devices ... If Alice changes a file locally on her own computer Syncthing will not and can not archive the old version." — [File Versioning](https://docs.syncthing.net/users/versioning.html)

**Versão 2.x e clientes em 2026**
- Syncthing 2.0 (agosto de 2025): o banco trocou LevelDB por SQLite, com migração no primeiro início que "can be lengthy". Itens excluídos são esquecidos após seis meses (`--db-delete-retention-interval`). As opções de linha de comando com hífen único caíram (`-home` virou `--home`). O padrão passou a ser três conexões por dispositivo, não se cria mais pasta padrão e não há mais binário oficial para windows/arm e algumas outras plataformas — [Release v2.0.0](https://github.com/syncthing/syncthing/releases/tag/v2.0.0); [AlternativeTo](https://alternativeto.net/news/2025/8/syncthing-2-0-debuts-with-sqlite-migration-new-logs-platform-changes-and-much-more); [Neowin](https://www.neowin.net/news/syncthing-20-released-with-major-changes-switching-from-leveldb-to-sqlite/)
- macOS oficial: `syncthing-macos`, "A native macOS Syncthing tray application bundle", que embute e envolve o Syncthing — [Community Contributions](https://docs.syncthing.net/users/contrib.html). Em 23/02/2026 saiu a v2.0.14-1 com Syncthing v2 embutido. O mantenedor (@xor-gate) faz os passos finais de release à mão, e a comunidade reclama que o app não acompanha todas as versões — [Syncthing for macOS the road to v2](https://forum.syncthing.net/t/syncthing-for-macos-the-road-to-v2-official-application/26060)
- Outras opções para macOS: Synctrain (iOS/iPadOS/macOS, na App Store, UI centrada em arquivos, com sincronização seletiva segundo o fórum), `syncthing-menu` (app de barra de menus) e Syncthing Tray (multiplataforma) — [Community Contributions](https://docs.syncthing.net/users/contrib.html); [Fórum](https://forum.syncthing.net/t/syncthing-for-macos-the-road-to-v2-official-application/26060)
- Windows: o SyncTrayzor original (canton7) foi arquivado. O GitHub mostra 24/08/2025 e a página de contribuições registra "2025-04-03". O autor escreveu "I stopped using Syncthing some years ago, and I'm afraid I don't have the time to maintain it" e aponta o fork SyncTrayzor v2 (GermanCoding), "Updated for Syncthing v2" e endossado pela documentação — [canton7/SyncTrayzor](https://github.com/canton7/SyncTrayzor); [Community Contributions](https://docs.syncthing.net/users/contrib.html); [Reviving SyncTrayzor](https://forum.syncthing.net/t/reviving-synctrayzor/24198)
- O pacote Chocolatey do SyncTrayzor passou para o GermanCoding — [Chocolatey](https://community.chocolatey.org/packages/synctrayzor) (trecho de busca)
- Syncthing Windows Setup (Bill-Stewart): "A lightweight yet full-featured Windows installer built using Inno Setup" — [Community Contributions](https://docs.syncthing.net/users/contrib.html)
- O app oficial para Android foi arquivado em 03/12/2024, com forks mantidos pela comunidade. Não afeta desktop, mas mostra o risco dos wrappers — [Community Contributions](https://docs.syncthing.net/users/contrib.html)

### Inferences
- Receita para o app web com Syncthing: rodar o backend na mesma máquina do hub, porque a API escuta em 127.0.0.1. O backend faz long-poll em `/rest/events/disk?since=<último id>`, grava cada `RemoteChangeDetected` (pasta, caminho, ação, `modifiedBy`, `time`) num banco e publica por WebSocket/SSE para o navegador. O `modifiedBy` vira nome de pessoa pelo cadastro de dispositivos (`/rest/config/*`, nome do dispositivo).
- O `modifiedBy` parece ser o primeiro bloco de 7 caracteres do Device ID (ex.: `523ITIE`), mas isso é inferência pelo formato do exemplo. Com uma máquina por pessoa, dispositivo equivale a pessoa; quem tiver duas máquinas precisa de mapeamento N:1.
- Como o buffer pode perder eventos e o observador pode deixar passar mudanças (há varredura completa de hora em hora), o backend precisa de reconciliação periódica: comparar o disco do hub ou `/rest/db/browse` com o banco. Buracos na sequência de `id` disparam uma ressincronização.
- `ItemFinished` não traz `modifiedBy`, então é melhor usá-lo como "arquivo pronto no disco do hub" e casar com o `RemoteChangeDetected` (ou consultar `/rest/db/file`) para saber o autor.
- O hub deve ser receive-only nas pastas de entrada (o que alguém mexer nele não se propaga, e dá para reverter) e ter versionamento Staggered ou Trash Can. Como o versionamento só vale para mudanças remotas, o hub acaba arquivando tudo o que os membros mudam ou apagam.
- "Receive encrypted" não serve para o hub do app web, porque o hub não enxerga nomes nem conteúdo. Só faz sentido para um backup externo não confiável.
- Com a retenção de exclusões de seis meses do Syncthing 2.x, um dispositivo desligado por mais tempo que isso poderia, em tese, reintroduzir arquivos já excluídos. É inferência a partir da nota de release; vale testar.
- Para 11 máquinas: no macOS, o app oficial funciona mas atrasa em relação às releases do Syncthing; alternativas são o Syncthing Tray, o Synctrain ou o binário como serviço (não pesquisei a instalação via Homebrew). No Windows, use o Syncthing Windows Setup (instalação leve, serviço) ou o SyncTrayzor v2. Evite o SyncTrayzor original, que não foi atualizado para o Syncthing 2.

### Gaps
- Não achei relato, benchmark ou issue sobre problemas específicos com cerca de 11 dispositivos. O que achei foram discussões de topologia (malha x estrela) e as armadilhas do introducer.
- A documentação não diz o tamanho exato do buffer de eventos.
- A extração automática da página de release do GitHub devolveu "August 12, 2024" como data da v2.0.0, o que contradiz a imprensa (agosto de 2025). Tomei agosto de 2025 como correto.
- A data de arquivamento do SyncTrayzor diverge entre as fontes (24/08/2025 no GitHub e 03/04/2025 na documentação).

## Replicar a pasta inteira nas 11 máquinas ou usar "caixa de saída" (a pasta de cada pessoa publica para o servidor e todos veem pelo app web)?

### Takeaway
Para o requisito "aparece para todos e no app web, com autor e data", a caixa de saída (um escritor por pasta → servidor sempre ligado → app web) é mais simples, praticamente sem conflitos, centraliza versões e auditoria e não espalha arquivos sensíveis por 11 discos. A replicação completa só compensa se as pessoas precisarem dos arquivos dos colegas offline no próprio disco. Um meio-termo documentável: cada pasta pessoal é send-only no dono e receive-only no hub e, opcionalmente, nos colegas que quiserem cópia local.

### Cited Findings
- Na malha, um arquivo novo circula entre quaisquer dois dispositivos ligados, sem exigir todos online ao mesmo tempo. Na estrela, se o hub estiver desligado, os outros não recebem os arquivos novos — [Fórum Syncthing, 2023](https://forum.syncthing.net/t/sync-all-users-to-all-users-or-central-hub-to-clients/20917)
- Na estrela, os novos dispositivos "only need to pair" com o hub, e as relações de pasta ficam centralizadas (fonte secundária) — [knightli.com](https://knightli.com/en/2026/05/31/syncthing-multi-device-folder-management/)
- As cópias de conflito do Syncthing se propagam como arquivos normais para todos os dispositivos — [Understanding Synchronization](https://docs.syncthing.net/users/syncing.html)
- O versionamento do Syncthing só arquiva mudanças que chegam de outros dispositivos, nunca as feitas na própria máquina — [File Versioning](https://docs.syncthing.net/users/versioning.html)
- Send Only ignora mudanças vindas dos outros; Receive Only aplica as do cluster e não distribui as locais, com "Revert Local Changes" — [Folder Types](https://docs.syncthing.net/users/foldertypes.html)
- O Syncthing não tem arquivos sob demanda, então replicar é sempre cópia completa — [Issue #10250](https://github.com/syncthing/syncthing/issues/10250)
- O Resilio (placeholders `.rsls`), o Nextcloud (arquivos virtuais via Cloud Files API ou File Provider) e o SeaDrive (File Provider no macOS 12.1+, Windows 10 1709+) oferecem sob demanda — [Selective Sync](https://help.resilio.com/hc/en-us/articles/205458095-Selective-Sync) (trecho de busca); [Issue #10871](https://github.com/nextcloud/desktop/issues/10871); [Drive Client changelog](https://manual.seafile.com/latest/changelog/drive-client-changelog/)
- O Syncthing 2.x esquece exclusões após seis meses por padrão — [Release v2.0.0](https://github.com/syncthing/syncthing/releases/tag/v2.0.0)

### Inferences
- **Réplica completa (malha, pasta única com todos escrevendo)**
  - Prós: todos têm tudo localmente e offline; não depende de servidor para o acesso local; LAN rápida.
  - Contras: 11 vezes o disco; uma exclusão feita por qualquer pessoa apaga de todos (com versionamento, a cópia antiga só fica nas máquinas que receberam a exclusão); conflitos quando duas pessoas mexem no mesmo arquivo, e as cópias `.sync-conflict` se espalham; um arquivo sensível posto por engano cai em 11 discos em segundos; "quem" é por dispositivo, e o app web ainda precisa de um nó observador sempre ligado.
- **Caixa de saída (cada pessoa: pasta própria send-only → hub receive-only; os outros veem pelo app web)**
  - Prós: um escritor por pasta, então não há conflito entre pessoas (inferência pela semântica de send-only e receive-only); autoria trivial, porque a pasta de origem já identifica a pessoa, e o `modifiedBy` confirma; versionamento e lixeira centralizados no hub; o disco de cada máquina só guarda o que a pessoa publicou; é fácil apagar um arquivo sensível do hub, que é a única cópia fora da máquina de origem.
  - Contras: ninguém tem os arquivos dos colegas localmente (baixa pelo app web); o hub precisa ficar ligado para as publicações aparecerem, embora nada se perca porque o Syncthing ou o agente reenviam quando o hub volta; editar o arquivo de um colega vira baixar, editar e publicar na própria pasta (versão nova com outro autor).
- **Meio-termo:** cada pasta pessoal fica send-only no dono e receive-only no hub e nos colegas que quiserem cópia local. Isso dá réplica sem conflito (um escritor por pasta) e o hub segue como fonte do app web. O custo é de disco só para quem optar.
- A caixa de saída casa melhor com "com quem compartilhou": a unidade de publicação é a pessoa, e o app web pode ter permissões e visibilidade por pessoa sem depender das semânticas de sincronização.

### Gaps
- Não achei estudo ou relato comparando as duas topologias em equipes de ~10 pessoas com app web acoplado. Os prós e contras acima são de raciocínio sobre a documentação.

## Agente próprio: quão confiáveis são os observadores de arquivos no macOS (FSEvents) e no Windows (ReadDirectoryChangesW) com arquivos grandes, arquivos ainda sendo gravados, renomeações e pastas em nuvem (iCloud/OneDrive)? Como as ferramentas detectam que o arquivo terminou de ser gravado?

### Takeaway
Nenhum dos dois é fonte completa e ordenada de verdade. Ambos coalescem ou descartam eventos em sobrecarga e mandam "reenumerar a árvore", então um agente confiável combina observador + varredura periódica ou snapshot + checagem de estabilidade (tamanho e mtime parados por N segundos, como os 2 s do chokidar ou os 10 s do Syncthing) antes de enviar. Arquivos-placeholder de iCloud e OneDrive devem ser detectados e ignorados, porque lê-los dispara download.

### Cited Findings
**macOS (FSEvents)**
- Coalescência: "If an event in a directory occurs at about the same time as one or more events in a subdirectory ..., the events may be coalesced into a single event". Com `kFSEventStreamEventFlagMustScanSubDirs`, "you must recursively rescan the path" — [FSEvents Programming Guide](https://developer.apple.com/library/archive/documentation/Darwin/Conceptual/FSEvents_ProgGuide/UsingtheFSEventsFramework/UsingtheFSEventsFramework.html)
- Perda: com `kFSEventStreamEventFlagKernelDropped` ou `UserDropped`, "you must do a full scan ... because there is no way to determine what may have changed" — [FSEvents Programming Guide](https://developer.apple.com/library/archive/documentation/Darwin/Conceptual/FSEvents_ProgGuide/UsingtheFSEventsFramework/UsingtheFSEventsFramework.html)
- Os eventos são "advisory". Mesmo backups devem fazer "a full sweep" periódico. Os IDs de evento persistem entre reinicializações (`sinceWhen`). O evento não informa processo nem usuário — [FSEvents Programming Guide](https://developer.apple.com/library/archive/documentation/Darwin/Conceptual/FSEvents_ProgGuide/UsingtheFSEventsFramework/UsingtheFSEventsFramework.html)
- Se a raiz observada é movida ou renomeada, chega `kFSEventStreamEventFlagRootChanged` (com `kFSEventStreamCreateFlagWatchRoot`) — [FSEvents Programming Guide](https://developer.apple.com/library/archive/documentation/Darwin/Conceptual/FSEvents_ProgGuide/UsingtheFSEventsFramework/UsingtheFSEventsFramework.html)

**Windows (ReadDirectoryChangesW)**
- "If the buffer overflows, ReadDirectoryChangesW will still return true, but the entire contents of the buffer are discarded and the lpBytesReturned parameter will be zero". Nesse caso, e com `ERROR_NOTIFY_ENUM_DIR`, "you should compute the changes by enumerating the directory or subtree" — [ReadDirectoryChangesW](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-readdirectorychangesw)
- `FILE_NOTIFY_CHANGE_SIZE` e `LAST_WRITE`: "The operating system detects a change ... only when the file is written to the disk", e com cache extensivo só quando o cache é descarregado — [ReadDirectoryChangesW](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-readdirectorychangesw)
- Em diretório de rede, o buffer acima de 64 KB dá `ERROR_INVALID_PARAMETER`. A função é suportada em SMB 3.0 e ReFS, e existe a alternativa dos "change journals" para volumes — [ReadDirectoryChangesW](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-readdirectorychangesw)

**Bibliotecas**
- chokidar: `awaitWriteFinish` "will poll file size, holding its add and change events until the size does not change" (2000 ms / 100 ms). `atomic` trata editores que salvam por substituição ("re-added within 100 ms of being deleted" vira `change`). `usePolling` "is typically necessary ... to successfully watch files over a network" — [chokidar](https://github.com/paulmillr/chokidar)
- @parcel/watcher: "Only one notification will be emitted per file"; criar e apagar no mesmo lote não gera nada; renomear gera delete + create; `getEventsSince` compara com um snapshot salvo — [@parcel/watcher](https://github.com/parcel-bundler/watcher)
- fsnotify (Go): sem recursão ("you must add watches for any directory"); no macOS, "kqueue requires opening a file descriptor for every file"; FSEvents está só no roadmap; recomenda observar diretórios, não arquivos, por causa dos salvamentos atômicos dos editores — [fsnotify](https://github.com/fsnotify/fsnotify)
- notify (Rust): problemas conhecidos incluem filesystems de rede que "may not emit any events", comportamento variado dos editores, a necessidade de observar o pai para detectar a exclusão da pasta, limites do inotify e degradação em diretórios grandes. `notify-debouncer-full` rastreia renomeações e file IDs — [notify](https://docs.rs/notify/latest/notify/)

**Como o Syncthing lida com arquivo ainda sendo gravado**
- Ele acumula eventos por 10 s (`fsWatcherDelayS`) e reprocessa o hash quando mtime, tamanho ou permissões mudam — [Understanding Synchronization](https://docs.syncthing.net/users/syncing.html)
- Arquivo grande sendo copiado gera "file changed during hashing". imsodin: "It gets scanned whenever another scan occurs, be that due to the watcher, a periodic or a manual scan". calmh: "the copy might be done and we're not getting any more events on it. So it'll get picked up at the next full scan" (fev/2022) — [Fórum Syncthing](https://forum.syncthing.net/t/file-changed-during-hashing/18046)

**Placeholders de nuvem**
- Windows: `FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS` (0x00400000) indica que o arquivo "is not fully present locally", e ler "will cause at least some of the file/directory content to be fetched from a remote store". `FILE_ATTRIBUTE_RECALL_ON_OPEN` (0x00040000) indica item virtual, que abrir "will cause at least some of it to be fetched" — [File Attribute Constants](https://learn.microsoft.com/en-us/windows/win32/fileio/file-attribute-constants)
- macOS Sonoma+: o iCloud Drive passou para FileProvider. Com "Otimizar Armazenamento", os arquivos despejados ficam "dataless": mantêm atributos, e o tamanho reportado é o do arquivo completo, mas não há dados locais; ler dispara o download — [Eclectic Light](https://eclecticlight.co/2023/11/21/icloud-drive-in-sonoma-fileprovider-and-eviction/); [Michael Tsai](https://mjtsai.com/blog/2023/10/27/icloud-drive-switches-to-dataless-files/)
- Syncthing e OneDrive Files On-Demand: pastas com reparse points dão erro "folder path missing" (issue antiga, de 2017–2018) — [Issue #4542](https://github.com/syncthing/syncthing/issues/4542) (trecho de busca)

**Empacotamento e distribuição**
- Tauri v2: bandeja via `tray-icon`/`TrayIconBuilder` e plugin de autostart (LaunchAgent no macOS) — [Tauri](https://v2.tauri.app/learn/system-tray/); [DEV Community](https://dev.to/hiyoyok/complete-guide-to-building-a-macos-menu-bar-app-with-tauri-v2-aji)
- Go: `fyne-io/systray` (Windows, macOS, Linux; cgo obrigatório) — [fyne-io/systray](https://github.com/fyne-io/systray)
- macOS Sequoia tirou o atalho Control-clique para abrir app não autenticado. Agora é preciso liberar em Ajustes do Sistema > Privacidade e Segurança, com senha de administrador, só na primeira execução — [AppleInsider](https://appleinsider.com/articles/24/08/06/apple-removes-control-click-option-for-skipping-gatekeeper-in-macos-sequoia). Houve relato de que o macOS 15.1 impediria de vez apps não assinados — [OSnews](https://www.osnews.com/story/141055/bug-or-intentional-macos-15-1-completely-removes-ability-to-launch-unsigned-applications/) (não confirmado)
- O TCC protege Mesa, Documentos, Transferências e mídia removível, inclusive contra apps em segundo plano. Acesso amplo exige Full Disk Access — [Eclectic Light 2025](https://eclecticlight.co/2025/11/08/explainer-permissions-privacy-and-tcc/); [Eclectic Light](https://eclecticlight.co/2025/02/20/permissions-privacy-and-security-whos-in-control/)

### Inferences
- Desenho robusto do agente:
  1. Observador (FSEvents via @parcel/watcher ou notify; ReadDirectoryChangesW no Windows) só como gatilho.
  2. Varredura completa periódica ou snapshot (`getEventsSince` do @parcel/watcher; `sinceWhen` do FSEvents) ao iniciar e a cada N minutos.
  3. Reenumeração obrigatória ao receber `MustScanSubDirs`, `KernelDropped`/`UserDropped`, `lpBytesReturned == 0` ou `ERROR_NOTIFY_ENUM_DIR`.
  4. Checagem de estabilidade antes de enviar: tamanho e mtime iguais em duas leituras separadas por 2 a 10 s, repetida depois do hash (se mudou durante o hash, volta para a fila).
  5. Envio a um arquivo temporário no servidor e renomeação atômica ao final, com hash conferido, como o Syncthing faz no destino.
- A renomeação é o ponto fraco. O @parcel/watcher entrega delete + create; o notify-debouncer-full tenta casar por file ID. Na prática, o servidor deve identificar o arquivo por hash de conteúdo e tratar delete + create com mesmo hash, dentro de poucos segundos, como "renomeado/movido", preservando autor e histórico.
- Para Go, o fsnotify é fraco no macOS (kqueue, sem recursão). O próprio Syncthing usa outra biblioteca (não verifiquei qual nesta pesquisa). Para Node, o @parcel/watcher é mais sólido que o chokidar em árvores grandes (FSEvents nativo + snapshot). O `awaitWriteFinish` do chokidar resolve o "terminou de gravar", mas por polling.
- Uma técnica comum no Windows, não verificada nesta pesquisa, é tentar abrir o arquivo com compartilhamento exclusivo: se outro processo ainda escreve, dá violação de compartilhamento. No macOS não há lock obrigatório, então vale a estabilidade de tamanho e mtime.
- Pasta da equipe: fora de Mesa, Documentos e Transferências, para evitar o prompt do TCC (ex.: `~/Equipe`), e fora do iCloud Drive e do OneDrive, para evitar placeholders e dupla sincronização. O agente deve checar os atributos `RECALL_ON_*` no Windows e ignorar arquivos dataless no macOS.
- O custo real do agente próprio fica fora do código de observação: assinatura e notarização no macOS (Gatekeeper), atualização automática, fila offline, retentativas e observabilidade. Para 11 máquinas, dá para liberar à mão, mas cada atualização repete o atrito se o app não for assinado.

### Gaps
- Não achei documentação oficial de como o FSEvents se comporta com arquivos dataless do iCloud (se a materialização ou o despejo geram eventos).
- Não verifiquei custos e requisitos atuais de assinatura de código no Windows (SmartScreen) nem detalhes do Electron (bandeja, autostart, tamanho).
- Não confirmei qual biblioteca de observação o Syncthing usa hoje.

## Compartilhamento SMB no macOS/Windows para 11 usuários: quais são as limitações (permissões, uso offline, desempenho no Finder, `.DS_Store`) e como um app web observa esse compartilhamento?

### Takeaway
SMB funciona para 11 pessoas se o compartilhamento morar num servidor ou NAS de verdade, e não na máquina de um membro: o Windows cliente limita a 20 conexões de entrada, e o limite do macOS cliente não tem número oficial. Não há uso offline no macOS nem no Windows Home. O app web deve observar o disco do lado do servidor, não pelo SMB, e só sabe "quem" com auditoria (ex.: Samba `vfs_full_audit` com `%u`).

### Cited Findings
- Windows 10/11 cliente: "Up to 20 other devices can remotely access ... file services"; acima disso aparece "No more connections can be made to this remote computer at this time" — [Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/1668518/windows-11-connection-limit-exists); [Windows OS Hub](https://woshub.com/max-concurrent-connections-limit-windows/)
- macOS cliente como servidor SMB: um tópico de 2021 afirma que "in older macOS, the SMB connection limit was 10" e cita "500-600" nas versões 10.15/11, sem fonte oficial. Um blog de fornecedor fala em cerca de 10 — [Apple Community](https://discussions.apple.com/thread/252939180); [Redcort](https://www.redcort.com/timeclock/support/blog/concurrent-connection-limits-on-windows-and-mac)
- Offline Files não existe no Windows Home, só no Pro, Enterprise e Education — [Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/4038017/cant-enable-offline-files-on-windows-11-home)
- Finder: `defaults write com.apple.desktopservices DSDontWriteNetworkStores -bool TRUE` impede o macOS de ler `.DS_Store` em compartilhamentos SMB, e o Finder passa a listar a pasta rapidamente em ordem alfanumérica, com menos opções de ordenação. Exige logout/login; o artigo é voltado a administradores — [Apple Support 102064](https://support.apple.com/en-us/102064)
- Notificação pela rede: a Microsoft documenta ReadDirectoryChangesW sobre SMB 3.0 (buffer de até 64 KB). O fsnotify diz que "The current NFS and SMB protocols does not provide network level support for file notifications". O chokidar recomenda polling em rede — [ReadDirectoryChangesW](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-readdirectorychangesw); [fsnotify](https://github.com/fsnotify/fsnotify); [chokidar](https://github.com/paulmillr/chokidar)
- Samba: o `vfs_full_audit` passa cada operação pelo módulo VFS e manda para o syslog. Exemplo: `full_audit:prefix = %u|%I|%S` e `full_audit:success = mkdirat renameat unlinkat pwrite` (Samba < 4.17) — [vfs_full_audit](https://www.samba.org/samba/docs/current/man-html/vfs_full_audit.8.html); [std.rocks](https://std.rocks/gnulinux_samba_logs.html)
- FSEvents e ReadDirectoryChangesW não informam usuário nem processo — [FSEvents Programming Guide](https://developer.apple.com/library/archive/documentation/Darwin/Conceptual/FSEvents_ProgGuide/UsingtheFSEventsFramework/UsingtheFSEventsFramework.html); [ReadDirectoryChangesW](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-readdirectorychangesw)

### Inferences
- "Cada pessoa tem uma pasta no próprio computador" não combina com SMB puro: seriam 11 compartilhamentos hospedados em 11 máquinas, cada um sumindo quando a máquina desliga, e o app web teria de montar os 11. O desenho viável é um compartilhamento central (Samba em Linux ou NAS) com uma subpasta por pessoa. Aí a "pasta" do usuário é uma unidade de rede, não uma pasta local.
- Permissões: com contas individuais no servidor, dá para ter a subpasta de cada um gravável só pelo dono e legível por todos, o que reproduz a caixa de saída sem conflitos. Com conta compartilhada, perde-se o "quem".
- App web: rodar no servidor do compartilhamento, com observador local (inotify, @parcel/watcher) no disco, mais o log do `full_audit` para atribuir usuário e IP. Sem auditoria, só a pasta de destino indica o autor, e só se as permissões forem por pessoa.
- Offline: no macOS e no Windows Home, sem rede não há acesso. Para quem precisa trabalhar desconectado, SMB é a pior opção.
- `.DS_Store`, `._*` (AppleDouble) e `Thumbs.db` aparecem no compartilhamento. O app web deve filtrar esses nomes, e o `DSDontWriteNetworkStores` ajuda do lado do Mac.

### Gaps
- Não achei documentação oficial da Apple com o limite atual de conexões SMB simultâneas num Mac comum. As fontes se contradizem (10 contra 500–600).
- Não pesquisei a auditoria de acesso a objetos no Windows (servidor de arquivos Windows) nem logs de NAS (Synology/QNAP), nem detalhes de assinatura e criptografia do SMB3.

## Segurança e privacidade: como deixar exposto só na rede local, autenticar e evitar compartilhar arquivos sensíveis por engano (padrões de ignorar `.DS_Store`, `Thumbs.db`, temporários)?

### Takeaway
Para ficar só na LAN, desligue no Syncthing a descoberta global e os relays (que vazam o Device ID para terceiros), mantenha a GUI/API em localhost com chave de API e defina padrões de ignorar comuns a todos. Contra vazamento acidental, a arquitetura pesa mais que qualquer filtro: na caixa de saída, um arquivo sensível chega a uma única cópia central, que dá para apagar. Na réplica completa, ele cai em 11 discos.

### Cited Findings
- Syncthing: autenticação mútua por certificado TLS (Device ID = SHA-256 do certificado), TLS 1.2/1.3 no transporte. Quem acessa as chaves TLS e a configuração "can impersonate your device" — [Syncthing Security](https://docs.syncthing.net/users/security.html)
- A descoberta global publica o Device ID e as portas a cada 30 min, e "An eavesdropper on the Internet can deduce which machines are running Syncthing". O relay "will learn the connecting device's device ID", e relays "can be run by anyone". Para operar só na LAN, a recomendação é desligar a descoberta global e os relays. A GUI "defaults to being reachable from the local host only" — [Syncthing Security](https://docs.syncthing.net/users/security.html)
- Portas: 22000/TCP (sync), 22000/UDP (QUIC), 21027/UDP (descoberta local por broadcast/multicast, que pode ser bloqueada entre sub-redes) e 8384 (GUI) — [Firewall Setup](https://docs.syncthing.net/users/firewall.html)
- `.stignore`: fica na raiz da pasta, e o primeiro padrão que casa decide. O prefixo `(?d)` permite apagar os arquivos ignorados que impedem a exclusão de um diretório (ideal para `.DS_Store` e `Thumbs.db`), e `(?i)` ignora maiúsculas e minúsculas. O `.stignore` não se sincroniza, mas pode fazer `#include` de um arquivo sincronizado. Padrões default para pastas aceitas automaticamente existem desde a 1.19.0 — [Ignoring Files](https://docs.syncthing.net/users/ignoring.html)
- O Resilio guarda a `IgnoreList` na pasta `.sync` de cada compartilhamento — [What is '.sync' folder](https://help.resilio.com/hc/en-us/articles/206217185-What-is-sync-folder-and-StreamsList-IgnoreList-and-Archive-inside) (título do artigo)
- WebDAV no Windows: o Explorer só manda Basic Auth por HTTPS — [SFTPGo docs](https://docs.sftpgo.com/enterprise/webdav/)
- Os webhooks do Nextcloud trazem `user.uid` e `user.displayName` — [Webhook Listeners](https://docs.nextcloud.com/server/latest/admin_manual/webhook_listeners/index.html)
- O Seafile renomeia conflitos com o e-mail do autor, e a listagem traz `modifier_email`, o que expõe e-mails a quem vê a pasta — [File conflicts](https://help.seafile.com/syncing_client/file_conflicts/); [Directories web-api v2.1](https://plus.seafile.com/published/web-api/v2.1/directories.md) (trecho de busca)
- macOS: o TCC protege Mesa, Documentos e Transferências — [Eclectic Light 2025](https://eclecticlight.co/2025/11/08/explainer-permissions-privacy-and-tcc/)
- Syncthing "Receive Encrypted" para guardar em dispositivo não confiável (beta), com vazamento de tamanhos — [Untrusted Devices](https://docs.syncthing.net/users/untrusted.html)

### Inferences
- Lista de ignorar sugerida, comum a todas as opções, no `.stignore` ou nos filtros do agente e do app web:
  - `(?d).DS_Store`, `(?d)._*`, `(?d)Thumbs.db`, `(?d)desktop.ini`, `.Spotlight-V100`, `.Trashes`, `.fseventsd`
  - `~$*` (lock do Office), `.~lock.*#` (LibreOffice), `*.tmp`, `*.part`, `*.partial`, `*.crdownload`, `*.download`
  - `.syncthing.*.tmp` e `~syncthing~*.tmp`
  - Os nomes Office e LibreOffice seguem convenções conhecidas, não verificadas em fonte nesta pesquisa.
- Barreira contra vazamento no agente próprio ou no app web: bloquear por padrão extensões e nomes sensíveis (`.env`, `*.pem`, `*.key`, `id_rsa*`, `*.kdbx`, `*.p12`) e limitar tamanho. Opcionalmente, "publicar" em dois tempos: o arquivo aparece como pendente para o dono por alguns minutos antes de ficar visível para todos, o que dá tempo de desfazer. É proposta de desenho, sem fonte.
- Exposição só na LAN: servidor com IP interno e firewall restringindo 22000/21027 (Syncthing) ou 443 (Nextcloud, Seafile, WebDAV, agente) à sub-rede. HTTPS com certificado de CA interna mesmo na LAN, porque o WebDAV do Windows exige HTTPS para Basic Auth. Chave de API do Syncthing só no backend, nunca no navegador.
- Autenticação por pessoa, não por máquina: no Syncthing a identidade é o dispositivo, então o app web precisa de login próprio para os leitores e de um mapa dispositivo → pessoa para os autores. No Nextcloud e no Seafile a identidade já é o usuário. No agente próprio, emitir um token por pessoa e máquina, revogável.

### Gaps
- Não pesquisei a lista de exclusão padrão do cliente Nextcloud (`sync-exclude.lst`) nem a do Seafile (`seafile-ignore.txt`).
- Não pesquisei boas práticas de SMB3 (assinatura, criptografia, desligar SMB1) nem a gestão de certificados internos para HTTPS na LAN.
