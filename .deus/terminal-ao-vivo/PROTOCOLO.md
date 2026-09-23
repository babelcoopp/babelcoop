# Contrato do terminal ao vivo · servidor ↔ interface ↔ outras Estações

> Missão `babel-coop/terminal-ao-vivo`, 2026-09-23. É o contrato que o servidor (`app/servidor/`) e a interface (`app/interface/`) cumprem. Mudou algo aqui? Avise o Ryan no relatório: ele é o dono deste arquivo.

## 0. Onde cada coisa mora

| Peça | Arquivo | Dono no workflow |
|---|---|---|
| sessões de terminal (node-pty + tela em memória) | `app/servidor/terminal.js` | agente servidor |
| permissões de entrar no terminal | `app/servidor/controle.js` (novo) | agente servidor |
| identidade assinada (carteira Ed25519) | `app/servidor/token.js`, `app/servidor/rede.js` | agente servidor |
| roteamento WebSocket, origem, loopback | `app/servidor/servidor.js` | agente servidor |
| barramento da página | `app/ponte.js` → `BC.real.enviar(msg)`, `BC.real.ouvir(fn)`, `BC.real.bemvindo`, `BC.real.eu()`, `BC.real.pares()` | Ryan (pronto) |
| motor do organismo (pulsos, faíscas, luz que esfria, sons) | `app/interface/organismo.js` → `BC.organismo` | agente brief |
| painel da direita: presença + terminal real em abas | `app/interface/terminal-real.js` + `terminal-real.css` | agente painel |
| parede, ampliado, controle, selos | `app/interface/parede-real.js` + `parede-real.css` | agente parede |
| casca 2030 (tokens na interface inteira) | `prototipo/*.css` (+ `prototipo/tokens.css`) | agente casca |
| testes | `app/testes/servidor/*.test.js` (node:test) · `app/testes/e2e/*.test.js` (Playwright `_electron`) | cada agente, os seus |

O servidor injeta na página, antes do `app.js`: `/vendor/xterm.css`, `/coop/terminal-real.css`, `window.COOP_REAL = {terminal: bool}`, `/vendor/xterm.js`, `/vendor/addon-fit.js`, `ponte.js`, `/coop/terminal-real.js`, `/coop/parede-real.js`. Arquivos novos de `app/interface/` (ex.: `organismo.js`, `parede-real.css`) entram na lista `INJETAR` de `servidor.js`, na ordem: organismo antes de terminal-real e parede-real.

Várias Estações na mesma máquina: `BABEL_COOP_RAIZ` (pasta no lugar de `~/BabelCoop`), `BABEL_COOP_PORTA`, `BABEL_COOP_DESCOBERTA` (porta UDP). O Electron usa `<raiz>/.coop/electron` como userData quando `BABEL_COOP_RAIZ` existe.

## 1. Confiança

- **Navegador local** = WebSocket em `/ws` vindo de loopback (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`) **e** com `Origin` igual a `http://localhost:<porta>` ou `http://127.0.0.1:<porta>`. Só ele manda `term-*`, `controle-*` e `projetos`, e só ele recebe `term-*` e `controles`. É a própria Estação (e a janela da TV, que também é local).
- Navegador de outro aparelho (celular, iPad pela rede) continua recebendo diário e pares, mas **nenhuma** mensagem de terminal (UX: celular sem terminal). Sem `Origin` válida, a conexão de navegador é recusada (protege contra site malicioso abrindo `ws://localhost:4711`).
- **Par** = `/ws?par=1`. Nada é aceito do par antes do `ola` verificado. `id`, `nome` e `papel` do par vêm **da carteira assinada**, nunca do que ele declara. Mensagens de terminal que vêm de um par têm `dono` reescrito para `par.id` antes de chegar às telas.

## 2. Carteira (token v2)

- `POST /api/fundar {nome}`: cria o par de chaves da equipe (Ed25519; pública em base64 SPKI DER, privada em base64 PKCS8 DER, só em máquina da gestão), o par de chaves do fundador e a carteira dele `{v:1, equipe, id, nome, papel:'gestao', chave:<pública do membro>, emitido}`, assinada com a chave da equipe sobre o JSON canônico (chaves em ordem alfabética). Tudo em `coop.json` (modo 600).
- `POST /api/convite {nome, papel}` (só gestão, só navegador local): gera o par de chaves do convidado, a carteira dele assinada pela equipe e o token `babel-` + base64url de `{v:2, equipe, segredo, publicaEquipe, carteira, assinatura, privada, privadaEquipe?(só papel gestao), encontro[], emitidoPor, emitido}`.
- `POST /api/token {token}`: grava tudo em `coop.json`.
- Aperto de mão: ao abrir o WebSocket, **os dois lados** mandam `{tipo:'desafio', nonce}` (16 bytes hex). Ao receber `desafio`, cada lado responde `{tipo:'ola', carteira, assinatura, resposta: assinar(privada, nonce + ':' + carteira.id), porta, equipe, prova, cursores}`. Ao receber `ola`, confere: equipe igual; `prova` (sha256 `segredo:id`); assinatura da carteira pela chave pública da equipe; `carteira.equipe` igual; `resposta` com a chave da carteira sobre o **meu** nonce; `carteira.id` diferente do meu. Falhou qualquer uma: fecha. Passou: `par.verificado = true`, e só então troca de diário e o resto.

## 3. Sessões (servidor do dono)

- `abrir({id, nome, cols, rows})`: `id` casa `/^[A-Za-z0-9_-]{1,48}$/`; shell de login (`$SHELL -l`, zsh no Mac; `powershell.exe -NoLogo` no Windows) em `cfg.pasta`; env com `TERM=xterm-256color`, `COLORTERM=truecolor`, `LANG` (herda ou `pt_BR.UTF-8`), `BABEL_COOP=1`, `BABEL_AGENTE=<nome>`, `BABEL_EU=<id>`.
- Duas telas em memória por sessão (`@xterm/headless` + `@xterm/addon-serialize`, 1000 linhas de rolagem): **telaReal** recebe toda a saída (serve para a própria Estação recarregar); **telaPublica** recebe só a saída fora da pausa (serve para quem assiste de fora). **Nada vai para o disco.** Nenhum log com o conteúdo.
- **Pausa** (`term-pausar {id, sim}`, só o dono local): durante a pausa, nenhuma saída sai para pares, e **teclas de pares são recusadas**. Ao retomar, a telaPublica recebe `\x1b[2J\x1b[H` + a linha `— transmissão retomada —` e quem assiste recebe um `term-tela` novo dessa telaPublica. O que saiu durante a pausa nunca é transmitido, nem depois.
- **Atividade** (alimenta a presença): o servidor lê `pty.process` (processo em primeiro plano) a cada 300 ms e conta bytes de saída. Emite `term-atividade {dono, id, estado, processo, desde, duracao?, bytes}` com `estado`: `shell` (parado no prompt) · `rodando` (outro processo na frente) · `terminou` (voltou ao shell; traz `processo`, `duracao` em ms e `fim`) · `espera` (processo `claude` (ou nome contendo "claude") na frente, sem saída há 1,5 s) · `pausado`. Em pausa, pares só recebem `estado:'pausado'` (sem nome de processo).
- Redimensionar só pelo dono local; todos recebem `term-tamanho {dono, id, cols, rows}`.

## 4. Controle (servidor do dono, `controle.js`)

- Registro: `{id:'ct-…', dono, quem, sessao (id ou null = todas), estado:'pedido'|'ativo', direto, ts}`.
- `term-pedir {sessao}` vindo de um par verificado: já existe pedido/ativo desse par nessa sessão → devolve o mesmo. `direto` = papel da carteira é `gestao` **ou** dono e par estão no mesmo projeto. `estado` = `ativo` se direto, senão `pedido`.
- Projetos: o navegador local do dono manda `{tipo:'projetos', lista:[{id, membros:[ids]}]}` sempre que o estado muda (a ponte deriva de `L.estado.projetos`). Mesmo projeto = algum projeto com os dois ids.
- `controle-aceitar {id}`, `controle-recusar {id}`, `controle-encerrar {id}`: só o navegador local do dono. `controle-sair {id}` vindo do par que controla: encerra. Par desconectou: os controles dele somem.
- Teclas de par: aceitas só se existe controle `ativo` desse par para a sessão (ou para `null`) **e** a sessão não está em pausa. Recusou: responde `term-recusado {dono, id, motivo}`.
- O dono avisa quem pediu com `{tipo:'controle', c}` a cada mudança e `{tipo:'controle-fim', id, motivo}` ao terminar. Cada servidor manda às suas telas `{tipo:'controles', lista}` = os controles nos meus terminais + os meus nos terminais dos outros (espelho do que os donos avisaram).

## 5. Mensagens

**Tela local → servidor dela** (só navegador local):
`term-abrir {id,nome,cols,rows}` · `term-entrada {dono,id,dados}` (dono = eu: escreve; outro: repassa ao dono) · `term-tamanho {id,cols,rows}` · `term-pausar {id,sim}` · `term-fechar {id}` · `term-renomear {id,nome}` · `term-assistir {dono,id}` · `term-parar {dono,id}` · `term-lista?` · `term-pedir {dono,sessao}` · `controle-aceitar|controle-recusar|controle-encerrar {id}` · `controle-sair {id,dono}` · `projetos {lista}`.

**Servidor → tela local**: `bemvindo {eu, pares, eventos, terminais, terminalReal, controles}` · `term-aberto {info, tela}` · `term-tela {dono,id,cols,rows,pausada,dados}` · `term-saida {dono,id,dados}` · `term-tamanho` · `term-pausa {dono,id,pausada}` · `term-atividade` · `term-fim {dono,id,codigo}` · `term-lista {dono,lista}` · `term-recusado {dono,id,motivo}` · `controles {lista}` · `erro {erro}`.

`info` de sessão: `{id, nome, dono, pid, cols, rows, pausada, criada, estado, processo}` (sem `processo` para pares quando pausada).

**Par ↔ par**: `desafio`, `ola`, `eventos`, `evento`, `arquivos?`, `arquivos` (como antes) · `term-lista?` · `term-lista` · `term-assistir {id}` · `term-parar {id}` · `term-tela` · `term-saida` · `term-tamanho` · `term-pausa` · `term-atividade` · `term-fim` · `term-entrada {id,dados}` · `term-recusado` · `term-pedir {sessao}` · `controle {c}` · `controle-fim {id,motivo}` · `controle-sair {id}`.

Assinatura de quem assiste é por contagem: o servidor de quem assiste pede `term-assistir` ao dono uma vez por sessão remota, enquanto houver ao menos uma tela local assistindo; `term-parar` quando a última sai.

## 6. Metas medidas

- Tecla de quem controla → eco na tela dele: p95 < 100 ms (medir com 200 teclas).
- Efeito visual nunca atrasa a digitação: `term.write` não espera animação; efeitos em `transform`/`opacity`/canvas; no máximo 2 efeitos vivos por vez.

---

# Parte 2 · "faz tudo junto" (ordem do Theus, 2026-09-23): agente real, presença, conector `coop`, navegador próprio

> O Theus: "faz tudo JUNTO, eu quero no nível do que vi no plano, eu expliquei e cansei detalhando tudo o que eu queria, ative as skills, injete o contexto Gabriel e construa". Plano = `docs/design/PLANO.md` (§1 propriedades 1 e 6, F1) + CHECKLIST §3 (agentes com nome humano, conector coop, navegador do agente, raio-X, clonar).

## 7. O agente é uma sessão de Claude Code dentro do pty, observada por ganchos HTTP

- Cada aba do painel da direita = um agente (`L.estado` pessoa.agentes) = uma sessão do pty (§3) onde o app, a pedido da tela (`agente-iniciar`), digita e roda o `claude` com:
  - `--settings '<json>'` (JSON inline, nenhum arquivo `settings*.json` é escrito) com **ganchos do tipo `http`** para `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Notification`, `Stop`, `SubagentStop` e, se existir na versão instalada (confira em https://code.claude.com/docs/en/hooks), `PermissionRequest`; URL `http://127.0.0.1:<porta>/api/gancho/<sessao>` com um segredo por sessão (cabeçalho ou query; nunca o segredo da equipe).
  - `--mcp-config '<json>'` com o servidor MCP `coop` do tipo `http` em `http://127.0.0.1:<porta>/mcp/<sessao>` (mesmo segredo).
  - `--append-system-prompt` com nome do agente, dono, as instruções do agente (`oQueFaz`) e: "use as ferramentas coop para mexer no app e no navegador do babel-coop; nunca abra o Google Chrome; senhas só a pessoa digita".
  - `-n <nome do agente>`.
- `servidor/agentes.js` transforma cada gancho em mensagens para as telas (e para quem assiste, respeitando a pausa do §3):
  - `agente-estado {dono,id,estado:'acordou'|'pensando'|'rodando'|'espera'|'terminou'|'falhou',ferramenta?,desde,ts}`
  - `agente-bloco {dono,id,bloco:{bid,tipo:'pedido'|'consulta'|'plano'|'acao'|'resultado'|'espera'|'falha',titulo,texto,comando?,arquivos?,prova?,ts}}` — consulta = Read/Grep/Glob/WebFetch/coop_buscar ("consultei: a.md · b.csv"); ação = Write/Edit/Bash/ferramentas coop que mudam algo (com "ver o comando" = `comando`); resultado = texto final do Stop (`last_assistant_message`) com prova (arquivos, saída).
  - `agente-plano {dono,id,itens:[{texto,estado:'pendente'|'andamento'|'feito'}],concluidosAgora:[índices]}` a partir do TodoWrite (PreToolUse/PostToolUse).
  - `agente-arquivo {dono,id,caminho,absoluto,acao:'criado'|'editado'}` a partir de Write/Edit (PostToolUse).
  - `agente-espera {dono,id,pid,ferramenta,resumo}` quando o Claude pede permissão; a tela responde `agente-ok {id,pid,decisao:'permitir'|'negar'}` e o servidor devolve a decisão no corpo da resposta HTTP do gancho (segura a resposta até a decisão ou até 590 s; sem decisão, deixa o Claude perguntar no próprio terminal).
- Tela → servidor: `agente-iniciar {id,nome,instrucoes}` · `agente-pedido {id,texto}` (escreve o texto + Enter no pty: o campo ❯ endereçado) · `agente-ok {id,pid,decisao}`.

## 8. Conector `coop` (MCP por HTTP, dentro do servidor da Estação)

- `servidor/coop-mcp.js` exporta `criar({cfg, enviarUi, pedirUi, navegador, agentes})` → `{ tratar(req, res, sessao, agente), aoMensagemUi(m) }`. JSON-RPC 2.0 por POST (initialize, notifications/initialized, tools/list, tools/call), resposta `application/json` (transporte "streamable HTTP" no modo simples). O `servidor.js` liga `POST /mcp/<sessao>` a `tratar` depois de conferir o segredo da sessão.
- Ferramentas:
  - `navegador_abrir {url}` · `navegador_clicar {seletor?|texto?}` · `navegador_digitar {seletor, texto}` (recusa campo de senha: devolve "sua vez: a pessoa digita a senha") · `navegador_ler {}` (texto da página em Markdown) · `navegador_raio_x {seletor?}` (DOM resumido, estilos, fontes, cores, copy em ordem, rede, console) · `navegador_clonar {pasta?}` (HTML + CSS + imagens + fontes em `Clones/<site>/` da pasta compartilhada; abre como site) · `navegador_copy {}` (gera `copy.md` por seção) · `navegador_print {}` (página inteira → PNG na pasta).
  - Ações do app, executadas pela tela local com `L.fazer` e assinadas "<agente> · <pessoa>": `coop_tv {modo, url?}` · `coop_projetar {arquivo}` · `coop_aviso {texto}` · `coop_mural {texto}` · `coop_demanda {titulo,para,prazo?}` · `coop_campanha {nome,meta,para,prazo}` · `coop_meta {...}` · `coop_buscar {termo}` (acervo) · `coop_aprendi {texto}` · `coop_pessoas {}` · `coop_projetos {}` · `coop_acao {acao,args}` (qualquer ação de `L.A`, com lista de ações permitidas).
- Ida e volta com a tela: servidor → tela `mcp-chamada {cid,sessao,ferramenta,args,agente:{id,nome,dono}}`; tela → servidor `mcp-resposta {cid,ok,resultado|erro}` (30 s). Quem responde na tela: `app/interface/coop-ui.js`.

## 9. Navegador próprio (nada de Google Chrome)

- `app/navegador/navegador.js` (processo principal do Electron): cada agente tem um `<webview>` na aba do meio "Navegador · <agente>" (partição `persist:navegador-<pessoa>`). A tela avisa o principal quando o webview nasce (`coopElectron.navegador.registrar(webContentsId, agenteId)` pelo preload). O controle usa o `webContents` do webview + `webContents.debugger` (CDP: DOM, CSS, Network, Runtime/console, Page.captureScreenshot, Page.getResourceTree/getResourceContent). Nada de Playwright, nada de Chrome externo.
- API do módulo: `abrir(agente,url)`, `clicar(agente,{seletor|texto})`, `digitar(agente,seletor,texto)`, `ler(agente)`, `raioX(agente,{seletor})`, `clonar(agente,pastaDestino)`, `copy(agente,pastaDestino)`, `print(agente,pastaDestino)`, `assumir(agente)`, `devolver(agente)`, `estado(agente)`; eventos `passo {agente,texto,alvo?,ts}` para a lista de passos da aba e para os blocos da presença; o cursor do agente aparece na página a cada clique.
- `main.js` liga `webviewTag: true` na janela da Estação e passa o módulo ao servidor (`iniciar({navegador})`). Sem Electron (servidor sozinho), as ferramentas de navegador respondem "navegador disponível só no app".
- `app/interface/navegador-real.js`: a aba do meio (barra de endereço só leitura enquanto o agente controla, "controlado por <agente> · você vê tudo" / "você está no controle", Assumir e Devolver, lista de passos embaixo, cursor do agente) e o painel **Raio-X** ao lado (HTML com DOM vivo, busca e copiar bloco · CSS do elemento, fontes e cores · Copy em ordem com exportar Markdown · Rede · Console · "Selecionar elemento"). Clone aberto como site editável na Estação.

## 10. O meio vivo e o placar

- `app/interface/nascendo.js`: `agente-arquivo` abre a aba do arquivo real no meio (conteúdo de `GET /api/arquivo`) e o texto nasce linha a linha com o rastro de luz que esfria (régua §2 "arquivo nascendo"); `agente-plano` com tudo feito = rito "concluído" (respira uma vez, faíscas, duas notas, 1,2 s).
- `app/interface/placar.js`: pontos com origem (REGUA §3) só de eventos reais: item do plano feito (+1 a +4), plano concluído (+8 + itens), OK dado pela pessoa a um pedido de permissão (+2 para a segurança funcionando); casa no rodapé "pontos · hoje" que sobe contando; clique mostra a origem de cada ponto; guardado por pessoa em localStorage (nunca ranking, nunca por tempo).

## 11. HUD do Babel OS (contexto Gabriel) sobre os tokens 2030

Vidro (`backdrop-filter`, borda 1 px `rgba(63,227,255,.22)`), glow discreto e scanlines ≤ 5 % de opacidade, **só em superfície viva** (presença, cartão ao vivo da parede, navegador controlado pelo agente). Cores do HUD mapeadas para os tokens: ciano `--t0`, violeta `--t2`, ouro `--ouro`, verde `--ok`. Efeito só como metáfora do serviço (skill motion-web-institucional): `prefers-reduced-motion` desliga o laço, canvas com DPR ≤ 1,5, laço parado com a aba oculta ou o elemento fora da tela.

## 12. Divergências aceitas (relatório do agente servidor, 2026-09-23)

- §2: depois do `ola`, os pares trocam chave efêmera X25519 (no `desafio`) e tudo passa em frame binário AES-256-GCM (HKDF-SHA256, contador no IV). Frame alterado, repetido ou fora de ordem fecha a ligação. A `resposta` assina `nonceDoOutro:meuId:minhaEfemera:efemeraDoOutro`.
- §3: `terminou` continua até o próximo processo e traz `processo`, `duracao`, `fim` (e `desde = fim`). `shell` traz `processo` = nome do shell. `processo` = argv[0] do líder do grupo da frente (o `claude` instalado aparece como `claude`). No Windows o node-pty só dá o nome do shell: a atividade fica só pela contagem de bytes.
- §5: `term-aberto.tela` é texto. `term-tela` pode chegar de novo a qualquer momento (tratar como reset + write). `term-lista {dono, lista:[]}` quando o par cai. `controle-fim {dono,id,motivo}` também chega às telas. `bemvindo.terminaisPares`, `controles?` e `/api/rede` são extras. Motivos de `term-recusado`: `sem permissão` · `pausado` · `terminal não existe` · `fora da rede`.
- Ambiente do pty sem `CLAUDECODE`, `CLAUDE_CODE_*`, `TERM_PROGRAM*`, `ITERM_*`, `VSCODE_*`, `ELECTRON_RUN_AS_NODE`. Em compensação, `TERM_PROGRAM=BabelCoop`.
- Pendente de endurecer (para a Parte 3): chave local entregue só pelo preload do Electron para o WebSocket de navegador local, porque loopback + Origin podem ser forjados por outro processo do mesmo Mac. Revogação de carteira.

## 13. Divergências aceitas do §7 (relatório do agente AGENTES, 2026-09-23)

- `--settings` e `--mcp-config` apontam para arquivos em `<raiz>/.coop/agentes/<sessao>/`: `coop-ganchos.json`, `coop-mcp.json` e `coop-gancho.js`, em modo 600 dentro de pasta 700. Os arquivos são apagados quando a sessão fecha.
- **SessionStart não aceita `http`.** Ele usa `command` em forma exec com Node; no app, o Electron com `ELECTRON_RUN_AS_NODE=1`. O pacote não pode desligar o fuse RunAsNode. Os demais ganchos são `http`, com o cabeçalho `X-Coop-Segredo`: 10 s de espera, e 600 s no PermissionRequest. O servidor responde 403 ao segredo errado, não 401, porque o 401 abre o OAuth do Claude Code.
- **Linha de comando digitada:** Ctrl+U e depois ` CLAUDE_CODE_ENABLE_TODO_TOOLS=1 CLAUDE_CODE_ENABLE_TASKS=0 '<claude>' --settings … --mcp-config … --no-chrome -n <nome> --append-system-prompt '…'`, com `--model $BABEL_COOP_MODELO`, `--permission-mode $BABEL_COOP_PERMISSAO` e `--strict-mcp-config` opcionais. No 2.1.281 o TodoWrite vem desligado; TaskCreate e TaskUpdate também viram plano.
- **Mensagens extras:** `agente-iniciado`, `agente-espera-fim {pid,decisao,motivo,ms}`, `agente-fim`, `agente-resumo` (vai com o `term-assistir` e no `bemvindo.agentes`) e `agente-lista?`/`agente-lista`.
- **Blocos:** o mesmo `bid` substitui o bloco anterior. A prova varia: `{arquivo,acao}`, `{saida,erro?,interrompido}` no Bash, e `{arquivos,comandos,duracao}` no resultado. Consultas seguidas viram um bloco só. ToolSearch não vira bloco.
- **Permissão:** o diálogo também aparece no terminal. Quem responder primeiro vale. O pedido na tela se solta com PostToolUse, UserPromptSubmit, Stop ou queda do HTTP. A resposta segue o formato `{hookSpecificOutput:{hookEventName:'PermissionRequest',decision:{behavior:'allow'|'deny',message?}}}`.
- **mcp-chamada** vai só para a tela que iniciou o agente, para a Estação e a TV não fazerem a ação duas vezes.
- **Pausa:** bloco, item de plano, comando e arquivo nascidos durante a pausa nunca saem para os pares, nem depois. O par recebe `agente-arquivo` só com `{caminho,acao}` e só quando o arquivo está dentro da pasta compartilhada. `agente-espera` nunca sai para par.
