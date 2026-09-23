# Anterioridade do layout de 3 colunas e o mecanismo que ninguém usou

> Frente `anterioridade-3-colunas` da missão `babel-coop/design-2030` · 2026-09-23.
> Pergunta: o Babel Coop mantém **esquerda = arquivos e opções · meio = trabalho · direita = terminal com agentes**. Quem já organiza três painéis assim, como cada um mostra o agente agindo, e o que ninguém combinou ainda?
> Método: busca **por função** (onde o agente vive, como a pessoa vê o agente agir, como o painel lateral conversa com o meio), não por nome. Cada achado traz a URL **lida de verdade** (WebFetch). Páginas que não abriram estão listadas no fim e **não** são usadas como fonte.
> Material de base lido antes: `PROMPT_AGENTICO_LP.md`, `BRIEFING_IA.md`, `docs/UX_PENEIRA.md`, `docs/FUNCOES.md`, `prototipo/base.css`, `prototipo/v3.css`, `.deus/missao-design/MISSAO.md`.

---

## 1. Achados por função (o que cada ferramenta faz com os três painéis)

### 1.1 Onde o agente vive

| Ferramenta | Onde o agente fica | Fato lido | Fonte |
|---|---|---|---|
| Cursor 2.0 | barra lateral própria de agentes e planos; até 8 agentes em paralelo; navegador embutido no editor | "a sidebar for your agents and plans" · "run up to eight agents in parallel on a single prompt" · ferramentas de navegador "embedded in-editor, including powerful new tools to select elements and forward DOM information to the agent" | https://cursor.com/changelog/2-0 |
| Cursor 3 | o agente **saiu da lateral** e ganhou uma janela própria (Agents Window), separada do IDE; chats lado a lado ou em grade; "Design Mode" anota a interface no navegador | "view multiple chats at once, side-by-side or in a grid" · "switch back to the IDE anytime, or have both open simultaneously" · "plans are now included in shared chats alongside the transcript" | https://cursor.com/changelog/3-0 |
| Cursor 3.1 | Agents Window em **mosaico** (tiles) para vários agentes; persiste entre sessões | "Split your current view into panes to run and manage several agents in parallel" · "drag agents into tiles" · "Expand panes to focus on a conversation" · "Your setup also persists across sessions" | https://cursor.com/changelog/3-1 |
| Cursor (canvases) | o agente devolve **artefatos duráveis** (painéis, tabelas, diagramas) que vivem no painel lateral, ao lado do terminal, navegador e git | "canvases are durable artifacts that live in the side panel alongside the terminal, browser, and source control" | https://cursor.com/changelog/04-15-26 |
| Cursor (docs) | a Agents Window tem busca de arquivos, vista de diffs e worktrees isolados | "new diffs view" para "review and commit changes, and manage PRs" · agentes "run in isolated Git checkouts" | https://cursor.com/docs/agent/agents-window |
| Zed | painel do agente encaixável à esquerda, direita ou embaixo; menu "Panel Layout" alterna **clássico** (projeto à esquerda) e **agêntico** (agente à esquerda, resto à direita) | "allows to quickly toggle between the 'Classic' layout and the 'Agentic' layout" | https://github.com/zed-industries/zed/pull/54771 |
| Zed (comunidade) | pedido para o agente ir **para o centro** como aba do editor | "It would be awesome if the Agent panel could also be placed in the center editor area as a regular pane/tab" · "have the agent conversation front and center, with code open in a side split" | https://github.com/zed-industries/zed/discussions/50397 |
| Warp | o agente vive **no mesmo campo** do terminal: ⌘↩, `/agent`, `esc` volta; detecção automática de linguagem natural vs. comando | "Commands executed within an agent conversation (either by you or the agent) only appear within that specific conversation and don't appear in the terminal block list" | https://docs.warp.dev/agents/local-agents/interacting-with-agents/terminal-and-agent-modes/ |
| Devin | chat no centro; painel à direita com abas Progress · Shell · Browser (ou "Computer") · IDE | "all shell commands, code edits, and browser activity will be logged in one unified view" · "each side chat opens in a panel next to the worklog" · "stop the session to take over and start using the IDE yourself" | https://docs.devin.ai/work-with-devin/devin-session-tools |
| Windsurf / Cascade (hoje Devin Desktop) | painel por Cmd+L; lista de tarefas dentro da conversa; reverter até um passo; checkpoints com nome; "Send problems to the agent" | "Cascade will create a Todo list within the conversation to track progress" · "revert all code changes back to the state of your codebase at the desired step" · "create a named snapshot/checkpoint" | https://docs.devin.ai/desktop/cascade |
| VS Code (Agents window) | cinco áreas: lista de sessões · personalizações · chat · mudanças · arquivos; várias sessões abertas lado a lado | "By default, the Changes and Files views appear in a separate side panel" · "open multiple sessions at the same time to compare results or review work in parallel" | https://code.visualstudio.com/docs/agents/run/agents-window |
| VS Code (Agent Sessions) | barra lateral como **central** de todas as sessões, com contagem de arquivos mudados e selo no ícone do app | "central hub for managing all your chat sessions, regardless of where you started them or where they are running" · mostra "session name, workspace, harness, and file change stats" | https://code.visualstudio.com/docs/copilot/chat/chat-sessions |
| Claude Code (desktop) | lateral de sessões; **painéis livres** (chat, diff, navegador, terminal, arquivo, plano, tarefas, subagente) arrastáveis pelo cabeçalho; "side chat" que não entra na conversa principal; modos de vista Normal · Thinking · Verbose | "built around panes you can arrange in any layout" · "A side chat lets you ask Claude a question that uses your session's context but doesn't add anything back to the main conversation" · "The tasks pane shows the background work running inside the current session" | https://code.claude.com/docs/en/desktop |
| Google Antigravity | duas superfícies: **Editor** (síncrono) e **Manager** (assíncrono, vários agentes); o agente reporta por **Artefatos** e a pessoa comenta neles como num documento | "a dedicated interface where you can spawn, orchestrate, and observe multiple agents working asynchronously across different workspaces" · artefatos = "task lists, implementation plans, screenshots, and browser recordings" · "leave feedback directly on the Artifact—similar to commenting on a doc" | https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/ · https://antigravity.google/product/antigravity-ide/ |
| Conductor | cada tarefa = espaço próprio com branch, arquivos, terminal, diff e revisão | "Each task gets its own workspace, branch, files, terminal, diff, and review path" | https://www.conductor.build/docs |
| Replit (Splits) | painéis em árvore; 5 zonas de soltar; "Maximize" e "Float"; o preview **sempre nasce no canto superior direito** | "The header of every pane, and the top, right, bottom, and left 'quadrants' of the pane" · "a minimum drag radius of 50px to detach a pane" · "Whenever a webview or VNC viewer is created automatically, they'll get placed into the top-right corner of the workspace, no matter what" | https://replit.com/blog/splits |
| Lovable · Bolt · v0 | a página oficial lida **não descreve o layout**; só fala de Visual Edits (Lovable) e de que o v0 "não tem edição visual por clique". A comparação de terceiros (resultado de busca, não lida) diz chat à esquerda e preview à direita | "no integrated visual editing interface for point-and-click changes" (v0) | https://lovable.dev/guides/lovable-vs-bolt-vs-v0 |

### 1.2 Como a pessoa vê o agente agindo

| Mecanismo | Quem faz | Fato lido | Fonte |
|---|---|---|---|
| **Seguir o agente** (o editor pula para cada arquivo que ele toca) | Zed | "Follow the agent as it reads and edits files by clicking the crosshair icon at the bottom left of the panel. Your editor will jump to each file the agent touches" · segurar cmd ao enviar segue automaticamente | https://zed.dev/docs/ai/agent-panel |
| **Seguir uma pessoa** (o editor sincroniza arquivo e rolagem; para de seguir ao abrir outro arquivo; "Focus participants" chama todos) | VS Live Share | "your editor will stay in sync with that person's currently open file and scroll position" · "you'll automatically stop following if... You open a different file" · "Everyone in the collaboration session will get a notification that you've requested their attention" · um grupo de editor pode seguir enquanto outro fica livre | https://learn.microsoft.com/en-us/visualstudio/liveshare/use/coedit-follow-focus-visual-studio-code |
| **Agente com corpo no canvas** (você vê o que ele faz pelo movimento; agentes sabem onde os outros estão; colegas inspecionam porque é hospedado) | tldraw ("fairies") | "the animations are kind of silly, but you can actually tell what it's doing" · agentes "know where each of the other fairies are working" · "its vision is always based on like where it is on the canvas" | https://gitnation.com/contents/agents-on-the-canvas-with-tldraw · https://tldraw.dev/use-cases/ai-enabled-canvas |
| **Agente nativo do canvas e da barra esquerda**, não caixa de chat flutuante; prompt a partir de qualquer camada; prompts em paralelo | Figma | o agente está "directly on the canvas and in the left rail" · "start a prompt from any design layer" · "@mentioning specific tokens, variables, and components" | https://www.figma.com/blog/the-figma-agent-is-here/ |
| **Blocos** (comando + saída + código de saída + tempo como objeto clicável; o agente lê o bloco, não raspa texto) | Warp | "CommandBlock containing the command string, stdout/stderr, exit code, working directory, and execution timestamp" · "it doesn't scrape terminal text—it serializes the Block's structured data" | https://starlog.is/articles/ai-agents/warpdotdev-warp |
| **Compartilhar a sessão do agente por link** e entrar para pilotar | Warp Oz | "Agent Session Sharing links let you or your teammates watch the progress of the Oz agent and hop in and steer it" · artefatos (PRs, branches, planos) "available in the session view" | https://www.warp.dev/blog/oz-orchestration-platform-cloud-agents |
| **Nível de detalhe escolhido pela pessoa** (Normal esconde as chamadas de ferramenta; Verbose mostra tudo) | Claude Code | "View modes control how much detail appears in the chat transcript" · Normal = "Tool calls collapsed into summaries" | https://code.claude.com/docs/en/desktop |
| **Reverter até o passo** e **checkpoint com nome** | Cascade | "revert all code changes back to the state of your codebase at the desired step" | https://docs.devin.ai/desktop/cascade |
| **Aceitar/rejeitar por trecho** | Zed | "accept or reject each individual change hunk, or the whole set of changes" | https://zed.dev/docs/ai/agent-panel |

### 1.3 Como o painel lateral conversa com o meio (peek, split, contexto)

| Mecanismo | Quem faz | Fato lido | Fonte |
|---|---|---|---|
| **Peek segurando a tecla** (Espaço abre; segurar mostra só enquanto segura; setas passam pelos vizinhos) | Linear | "Press and release Space quickly to keep peek open, or hold Space to preview temporarily" · comparado ao Quicklook do macOS · descrito como recurso "semi-secret" | https://linear.app/docs/peek |
| **Side peek** (página abre à direita; a base de dados continua viva à esquerda; side/center/full por tipo de vista) | Notion | "you can keep your database items visible and interactive on the left side of your screen" · "Open pages as" com três opções | https://www.notion.com/releases/2022-07-20 |
| **Barra vertical, Espaços, barra de comando, janela leve** (com o porquê de cada um) | Arc | "Horizontal space is premium; vertical space is abundant" · "Mental contexts shouldn't leak" · "Finding should be faster than organizing" · "Match the interface to the task's weight" (Little Arc) | https://blakecrosley.com/guides/design/arc |
| **Texto selecionado no editor ou no terminal vira contexto** do agente | Zed | "select text in a buffer or terminal and add it as context" · colar código multilinha vira @-menção com o arquivo | https://zed.dev/docs/ai/agent-panel |
| **Comando que sabe onde o cursor está** (`.` completa código; `..` só ações; ações mudam com o contexto) | JetBrains | "extend this familiar experience beyond code – to the IDE itself" · "most developers can only confidently recall a few shortcuts, for example (often three or fewer)" | https://blog.jetbrains.com/idea/2025/11/universal-entry-point-a-single-entry-point-for-context-aware-coding-assistance/ |
| **Paleta de comandos consciente do contexto** | Sam Solomon | "Context awareness is key to building an effective command palette" · "If you're on a person record and you want to send the person an email, the command palette shouldn't expect a blank compose pane" | https://solomon.io/designing-command-palettes/ |
| **Duas vistas do mesmo conjunto** (Session e Arrangement compartilham as trilhas; Tab alterna; dá para arrastar um clipe e apertar Tab no meio do arrasto) | Ableton Live | "The beauty of Live's split brain is how the Session and Arrangement tracks are shared" · "click and hold on a clip... then hit Tab to switch to the Session view (still holding the mouse button)" · lançamentos "painted into the linear tracks in real time" | https://www.soundonsound.com/techniques/ableton-live-session-arrangement-views |

### 1.4 Profundidade, forma e sala (fora do mundo dos IDEs)

| Mecanismo | Quem faz | Fato lido | Fonte |
|---|---|---|---|
| **Janelas com eixo z**, inclinar para escolher, escrever no verso | Sun Project Looking Glass (2003–2006) | janelas como "thin slate-like 3D objects which can be set at any angle or turned completely around" · "tilting all the window to assist the user to pick up a desired window" · "write notes and comments on the windows' backs" · morreu por ameaça legal da Apple e falta de prioridade | https://en.wikipedia.org/wiki/Project_Looking_Glass |
| **Mesa com física** (documentos como caixas; empurrar, jogar, juntar em pilhas com gesto) | BumpTop (2006–2010) | "three-dimensional boxes lying on a virtual desk" · "physics effects like bumping and tossing" · comprado pelo Google em 2010, código aberto em 2012, sem manutenção | https://en.wikipedia.org/wiki/BumpTop |
| **Camada funcional flutuando sobre o conteúdo** (3 camadas: highlight, shadow, illumination) e a crítica de ruído visual | Apple Liquid Glass (2025) via CSS-Tricks | "highlight (light casting and movement), shadow (added depth for separation between foreground and background), and illumination" · crítica: "UI elements updating into others as the context changes" vira "visual noise" | https://css-tricks.com/getting-clarity-on-apples-liquid-glass/ |
| **Vidro, ornamentos e hierarquia rasa** (não empilhar camadas translúcidas; foco por escurecimento) | visionOS via think.design | "Ornaments (floating toolbars) should overlap the bottom edge of a window by 20pts" · "Stacking multiple translucent layers reduces legibility and contrast. Keep hierarchies flat and simple" · "Focus via Dimming" | https://think.design/blog/the-complete-guide-to-designing-for-visionos/ |
| **Faixa lateral + pilhas + palco** e o custo de reposicionar à mão | macOS Stage Manager via MacStories | "any app you open will launch onto its own stage with every other window you've got open tucked out of sight" · crítica: a "Stage Manager Dance" · "in desperate need of keyboard shortcuts, a right-click menu, and Shortcuts support" | https://www.macstories.net/stories/macos-ventura-the-macstories-review/2/ |
| **Elemento que muda de forma conforme o contexto** e o risco de cansar | iPhone Dynamic Island via Babich | "a new layer to the UI that helps users get timely updates without switching the context" · risco: alertas animados "annoying" | https://babich.biz/blog/apple-dynamic-island/ |
| **Mosaico de painéis, divisórias finas, densidade como recurso, códigos digitados, cor com significado fixo** | Bloomberg Terminal via Curio | "The screen is treated not as a canvas but as a tiled workspace" · "Dividing lines between panels are sharp and visible but carry no weight beyond functional separation" · "every color assignment carries a fixed meaning" · emprestado para dizer que o produto é "serious professional instrument" | https://designbycurio.com/learn/bloomberg-terminal-green |
| **Sala de controle**: todo operador vê o telão e o diretor de voo; consoles por função; consciência compartilhada | NASA/NORAD via Sustema | "every operator had a direct line of sight to the main data displays and the Flight Director" · "Each station was purpose-built for a specific function" | https://www.sustema.com/post/from-nasa-to-norad-what-we-can-learn-from-the-world-s-most-iconic-control-rooms |
| **Velocidade como produto**: 100 ms (50–60 ms internos), teclado primeiro, UI otimista com desfazer como rede, animação mínima | Superhuman via Blake Crosley | "50ms feels like the interface responds before you've finished the action" · "undo as the safety net, not loading spinners" | https://blakecrosley.com/en/guides/design/superhuman |
| **Efeito Genie** (janela se dobra até o ícone; câmera lenta com Shift, escondida desde o Mojave) | macOS via Daring Fireball | "the age-old trick of holding down the Shift key while minimizing a window (clicking the yellow button) to see the genie effect in slow motion" | https://daringfireball.net/linked/2024/09/28/hidden-pref-to-restore-slow-motion-dock-minimizing-on-macos |

---

## 2. O que emerge (síntese)

1. **O mercado está tirando o agente da lateral.** Cursor 3 moveu o agente para uma janela própria; Zed criou o layout "agêntico" (agente à esquerda) e a comunidade pede o agente no centro; Antigravity separou Editor de Manager; VS Code criou uma Agents window. Ou seja: **manter o terminal à direita é uma escolha contra a corrente e precisa de um motivo forte** — o motivo do Babel é que o meio é o *trabalho* (arquivo, Máquina, quadro, reunião), não a conversa; a conversa é instrumento.
2. **Todo mundo mostra o agente por log, diff ou artefato.** Ninguém das ferramentas de trabalho mostra o agente como presença contínua; só o tldraw (fairies) e o Figma (agente no canvas) e, para pessoas, o Live Share (seguir, cursores coloridos).
3. **Layout livre ganhou** (Claude Code, Replit Splits, Cursor tiles) e **layout que exige arrumar à mão perde** (Stage Manager Dance). Regra: o que muda de forma tem que mudar sozinho e por atalho.
4. **Profundidade (z) só sobreviveu como acento**, nunca como ambiente: Looking Glass e BumpTop morreram; Liquid Glass e visionOS usam camadas, mas mandam manter a hierarquia rasa e escurecer para focar.
5. **Peek e side peek são o padrão de "olhar sem abrir"** (Linear, Notion, Arc). Nenhum deles faz peek de uma *ação do agente*.
6. **Duas vistas do mesmo conteúdo** existe em música (Ableton) e em IDEs (Editor↔Manager), sempre no eixo "eu fazendo ↔ eu gerenciando". Não existe no eixo **"eu ↔ nós"**.
7. **Sala de controle de agentes é por desenvolvedor.** Cursor, VS Code, Antigravity, Warp Oz, Conductor: todas são "meus agentes". Compartilhar é por link (Warp, Conductor). Nenhuma tem um telão físico da equipe.

---

## 3. Oito ideias de mecanismo novo, cada uma com a busca de anterioridade

Formato: **o mecanismo · quem já faz parecido · qual é a diferença · guarda-corpo** (o que evita virar excesso).

### M1 · Terminal-instrumento: o painel da direita troca de "teclado" conforme o objeto que está no meio
- **Mecanismo.** O campo `❯` fica fixo, mas a linha acima dele (receitas, chips de pessoas, tokens de contexto) e o cabeçalho do agente **se moldam ao objeto central**: arquivo aberto → "Explicar · Projetar · Pedir ajuda"; Máquina → "Testar · Publicar · Ver montando"; WhatsApp → "Responder · Sugerir"; reunião → "Marcar decisão · Salvar ideia". O terminal vira o instrumento do que está na bancada, como o teclado de um sintetizador muda de função conforme o preset.
- **Quem chega perto.** JetBrains Universal Entry Point (ações mudam com a posição do cursor; `..` filtra ações) — https://blog.jetbrains.com/idea/2025/11/universal-entry-point-a-single-entry-point-for-context-aware-coding-assistance/ · paleta consciente do contexto (Solomon) — https://solomon.io/designing-command-palettes/ · Zed: seleção no buffer/terminal vira contexto — https://zed.dev/docs/ai/agent-panel · Cascade: "Send problems to the agent" — https://docs.devin.ai/desktop/cascade · Warp: blocos do terminal anexáveis como contexto e detecção automática de linguagem natural — https://docs.warp.dev/agents/local-agents/interacting-with-agents/terminal-and-agent-modes/ · Bloomberg: códigos digitados por função — https://designbycurio.com/learn/bloomberg-terminal-green
- **Diferença.** Todos mudam **sugestões dentro de um único campo de texto** ou anexam contexto. Nenhum remodela o painel do agente inteiro (receitas, chips, cabeçalho, botões de desfazer) em função do objeto central, e nenhum faz isso para objetos que não são código (Máquina, WhatsApp, reunião, quadro). No Babel, `UX_PENEIRA` já pede "receitas por contexto, 3 no máximo" — M1 é a forma visual disso.
- **Guarda-corpo.** O campo de texto e a posição do cursor nunca mudam (Superhuman: consistência espacial). Só a linha de receitas muda, com no máximo 3 itens, sem animação além de um fade de 120 ms.

### M2 · Arquivo que chega fisicamente: a trajetória entre computadores é o registro de autoria
- **Mecanismo.** Ao arrastar um arquivo meu para o nome de uma pessoa (função já pedida), o arquivo **sai da minha árvore e percorre** o caminho até o cartão da pessoa; **no computador dela**, a ficha do arquivo entra na árvore com a mesma trajetória invertida (vindo da borda da tela onde fica "a equipe") e fica com o selo "recebido de você" (já existe). A animação não é enfeite: é o *mesmo desenho* nas duas telas, então o que a pessoa vê chegar é o que eu vi sair.
- **Quem chega perto.** Genie (janela se dobra até o ícone: coerência espacial) — https://daringfireball.net/linked/2024/09/28/hidden-pref-to-restore-slow-motion-dock-minimizing-on-macos · BumpTop (física, jogar documentos) — https://en.wikipedia.org/wiki/BumpTop · Replit (arrastar arquivo da árvore para o painel) — https://replit.com/blog/splits · Live Share (edições ficam no host, "no need to synchronize, push, or send files around") — https://learn.microsoft.com/en-us/visualstudio/liveshare/use/coedit-follow-focus-visual-studio-code
- **Diferença.** Nenhuma ferramenta anima a **chegada na tela da outra pessoa**, nem usa a trajetória como registro de "quem mandou, de onde". Genie e BumpTop são de uma tela só; Live Share nem tem "mandar arquivo".
- **Guarda-corpo.** ≤ 400 ms, uma curva só (`power2.out`), e com `prefers-reduced-motion` a ficha simplesmente aparece com o selo (regra 8 do PROMPT_AGENTICO). Máximo de um voo por vez; o segundo enfileira.

### M3 · Painéis como camadas de profundidade **semântica**: o z diz quem tem a atenção
- **Mecanismo.** Só dois planos. O plano de trás é o **meio** (a bancada). O plano da frente é **quem está agindo**: quando o agente age (pensando, montando peça, navegando), o terminal **vem ~4 px para a frente** com sombra e o meio escurece 8 %; quando a pessoa digita no meio, o terminal **recua** e some a sombra. A lateral esquerda nunca vem para a frente: ela é parede (sempre atrás). O estado do agente ("pensando"), que hoje é um ponto pequeno demais (`UX_PENEIRA` 6c), vira o próprio deslocamento do painel.
- **Quem chega perto.** Looking Glass (eixo z, inclinar para escolher) — https://en.wikipedia.org/wiki/Project_Looking_Glass · Liquid Glass (controles como camada funcional flutuando sobre o conteúdo) — https://css-tricks.com/getting-clarity-on-apples-liquid-glass/ · visionOS (foco por escurecimento; "keep hierarchies flat") — https://think.design/blog/the-complete-guide-to-designing-for-visionos/ · Stage Manager (faixa recua, palco à frente) — https://www.macstories.net/stories/macos-ventura-the-macstories-review/2/
- **Diferença.** Em todos, a profundidade é decoração ou organização de janelas. Ninguém liga o z **ao estado de atenção entre três colunas** (quem age vem à frente). Looking Glass e BumpTop mostram que 3D como ambiente morre; aqui é 2 planos e 4 px.
- **Guarda-corpo.** Nunca empilhar vidro translúcido (visionOS e a crítica ao Liquid Glass). Deslocamento e sombra em tokens (`--z-frente`, `--z-atras`); transição 180 ms; reduced-motion → só a sombra, sem deslocamento.

### M4 · Terminal como sala de controle da equipe: fileiras de consoles e um telão que é a TV de verdade
- **Mecanismo.** A "parede" de Terminais ao vivo (já pedida) ganha a **geometria de sala de controle**: cada pessoa é uma fileira, cada agente com nome é um console; o que está "na frente da sala" é exatamente **o que a TV física mostra** (modo painel, projeção, reunião). "Chamar para a minha tela" e "Entrar/Assumir" viram os gestos de "levantar do console e ir até o outro". Quem projeta na TV é quem está "no telão"; todos veem quem é.
- **Quem chega perto.** VS Code Agent Sessions ("central hub", selos) — https://code.visualstudio.com/docs/copilot/chat/chat-sessions · Cursor Agents Window em mosaico — https://cursor.com/changelog/3-1 · Antigravity Manager ("spawn, orchestrate, and observe multiple agents") — https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/ · Warp Oz (painel de gestão + link para "watch the progress... and hop in and steer") — https://www.warp.dev/blog/oz-orchestration-platform-cloud-agents · Conductor (tarefa = espaço com terminal, diff, revisão) — https://www.conductor.build/docs · Live Share "Focus participants" — https://learn.microsoft.com/en-us/visualstudio/liveshare/use/coedit-follow-focus-visual-studio-code · NASA (linha de visão para o telão e o diretor) — https://www.sustema.com/post/from-nasa-to-norad-what-we-can-learn-from-the-world-s-most-iconic-control-rooms
- **Diferença.** Todas as salas de controle de agentes são **de um desenvolvedor** ("meus agentes"); compartilhar é por link. Nenhuma tem **pessoas e agentes com nome na mesma parede**, nem um **telão físico** (TV sem botão) que é a "frente da sala" para todos. O mais próximo de "entrar no terminal do outro" é o Warp Oz (steer via link) e o Live Share (follow/focus) — o Babel junta os dois e acrescenta a TV.
- **Guarda-corpo.** A parede não é a coluna da direita: a coluna da direita são **meus** agentes (Cursor aprendeu que gerenciar muitos agentes não cabe numa lateral de 300 px e criou uma janela); a parede é uma atividade. Sem ranking, sem "quem trabalha mais" (regra "Cuidando da gente").

### M5 · Meio como bancada que muda de forma: morph por tipo de objeto, com continuidade
- **Mecanismo.** O meio não é "abas + conteúdo"; é uma **bancada** que assume uma forma por tipo: arquivo = folha; Máquina = palco + ficha à direita; quadro = borda infinita; reunião = mesa com o que foi levado; WhatsApp = conversa. Ao trocar, a forma **morfa** (o palco da Máquina encolhe até virar a folha; a barra de abas e a barra de status não se movem). Os itens "que vêm depois" (próxima demanda, próximo arquivo do projeto) ficam **encostados na borda** da bancada, como já se faz na vista 3D do protótipo, e entram por arrasto.
- **Quem chega perto.** Dynamic Island (muda de forma por contexto, sem trocar de tela) — https://babich.biz/blog/apple-dynamic-island/ · Replit Splits (regra fixa: preview nasce no canto superior direito; Maximize e Float) — https://replit.com/blog/splits · Claude Code (painéis livres: "arrange in any layout") — https://code.claude.com/docs/en/desktop · Notion (side/center/full por tipo de vista) — https://www.notion.com/releases/2022-07-20 · Cursor canvases (artefatos duráveis no painel lateral) — https://cursor.com/changelog/04-15-26
- **Diferença.** Replit e Claude Code exigem **arrastar à mão**; Notion escolhe por tipo mas **sem continuidade de forma** (troca seca); a Dynamic Island morfa mas é um elemento, não a superfície de trabalho. Ninguém faz **a superfície inteira morfar por tipo de objeto, sozinha, mantendo fixos abas e status**.
- **Guarda-corpo.** Um morph por abertura, ≤ 300 ms, e nunca em resposta a evento externo (só a ação da pessoa) — a lição do "Stage Manager Dance" e do "annoying" da Dynamic Island. Reduced-motion → corte seco.

### M6 · O agente como uma presença que atravessa os três painéis
- **Mecanismo.** Cada agente com nome e foto (já pedido) tem **uma só presença**: quando lê um arquivo, a foto dele **aparece ao lado do arquivo na árvore** (esquerda); quando edita, o cursor com o nome dele está **no meio**; quando termina, volta para a aba dele no terminal. A pessoa sabe onde o agente está olhando para a tela, não lendo o log. "Parar" (falta apontada em `UX_PENEIRA` 6d) é clicar na presença.
- **Quem chega perto.** tldraw fairies ("you can actually tell what it's doing"; agentes sabem onde os outros trabalham; colegas inspecionam) — https://gitnation.com/contents/agents-on-the-canvas-with-tldraw · Figma agent (no canvas e na barra esquerda; prompt a partir de qualquer camada) — https://www.figma.com/blog/the-figma-agent-is-here/ · Zed follow mode (o editor pula para cada arquivo que o agente toca) — https://zed.dev/docs/ai/agent-panel · Live Share (cursores coloridos, etiqueta com nome que aparece na atividade, seguir alguém) — https://learn.microsoft.com/en-us/visualstudio/liveshare/use/coedit-follow-focus-visual-studio-code · Devin (ver o navegador e o shell do agente) — https://docs.devin.ai/work-with-devin/devin-session-tools
- **Diferença.** Zed faz o *editor* seguir o agente (a pessoa perde o lugar dela); Live Share é para pessoas; tldraw e Figma são de uma superfície só. Nenhum mostra **o mesmo agente como uma presença única que passa de árvore → meio → terminal**, com a pessoa mantendo o próprio lugar.
- **Guarda-corpo.** A presença é a foto de 16 px + um traço na cor da pessoa dona; nunca um personagem. Etiqueta com nome só na atividade (padrão "Activity" do Live Share).

### M7 · Peek transversal: segurar Espaço num cartão do terminal mostra o antes/depois no meio, sem abrir aba
- **Mecanismo.** Cada ação do agente já deixa um cartão com "desfazer". Com o foco no cartão, **segurar Espaço** mostra no meio o "antes → depois" (o arquivo com a mudança, a peça nova da Máquina tracejada, a demanda criada), **sem abrir aba**; soltar volta ao que estava. Setas ↑↓ passam pelos cartões vizinhos e o meio acompanha. É o Quicklook das ações do agente.
- **Quem chega perto.** Linear peek (segurar Espaço; setas; Quicklook) — https://linear.app/docs/peek · Notion side peek (a lista continua viva) — https://www.notion.com/releases/2022-07-20 · Arc (barra de comando e janela leve para "task's weight") — https://blakecrosley.com/guides/design/arc · Zed Review Changes (aceitar/rejeitar por trecho) — https://zed.dev/docs/ai/agent-panel · Cascade (reverter até o passo; checkpoints) — https://docs.devin.ai/desktop/cascade · Warp (ação como bloco estruturado) — https://starlog.is/articles/ai-agents/warpdotdev-warp
- **Diferença.** Peek existe de **lista → detalhe** dentro de um painel. Ninguém faz peek **de um painel para outro** (do cartão do agente para a superfície de trabalho), nem peek de uma *ação* com o antes/depois.
- **Guarda-corpo.** O peek nunca grava nada; aceitar é Enter, desfazer é o botão que já existe. Sem animação de entrada (Superhuman: "undo as the safety net, not loading spinners").

### M8 · Duas vistas do mesmo trabalho: Tab entre "bancada" (eu) e "sala" (nós)
- **Mecanismo.** O mesmo objeto (arquivo, demanda, quadro) tem duas vistas: **bancada** (eu editando, com meu terminal) e **sala** (o objeto na mesa da reunião, com quem está junto e o que a TV mostra). **Tab** alterna, e dá para **arrastar um item e apertar Tab no meio do arrasto** para "levar para a reunião" (função já pedida) sem menu. A Reunião deixa de ser uma atividade separada com a própria cópia das coisas: é o **outro lado** do mesmo objeto.
- **Quem chega perto.** Ableton ("split brain": Session e Arrangement compartilham as trilhas; Tab; arrastar clipe segurando e apertar Tab) — https://www.soundonsound.com/techniques/ableton-live-session-arrangement-views · Antigravity (Editor ↔ Manager) — https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/ · Cursor (IDE ↔ Agents Window, "both open simultaneously") — https://cursor.com/changelog/3-0 · Zed (layout clássico ↔ agêntico) — https://github.com/zed-industries/zed/pull/54771 · VS Code (Agents window vs editor) — https://code.visualstudio.com/docs/agents/run/agents-window
- **Diferença.** Nos IDEs o eixo é sempre **"eu fazendo ↔ eu gerenciando agentes"**. Aqui o eixo é **"eu ↔ nós"**: a mesma coisa vista como trabalho individual ou como mesa da equipe — e o material flui nos dois sentidos (levar para a reunião; trazer da reunião), como no Ableton. Isso também resolve a duplicação "Reunião × Meu dia × TV" apontada em `UX_PENEIRA` §3.
- **Guarda-corpo.** Tab só alterna vista; nunca muda o que está salvo ("does not switch modes or change what... is stored"). A vista "sala" não tem terminal próprio: os agentes continuam à direita.

### Combinações que ninguém fez (resumo)
- **M1 + M7**: o terminal que é instrumento **e** lente do meio (aciona e mostra o antes/depois).
- **M3 + M6**: o z conta quem age; a presença conta onde.
- **M4 + M8**: a sala de controle **é** a vista "nós" do mesmo trabalho, e a TV é o telão.
- **M2 + M5**: o arquivo chega fisicamente numa bancada que já tomou a forma dele.

---

## 4. Armadilhas (o que a pesquisa avisa)

1. **A corrente vai contra o terminal na lateral.** Cursor 3 tirou o agente da lateral; Zed criou o layout agêntico e há pedido de agente no centro. Manter "direita = terminal" exige que o meio seja **visivelmente** a bancada (M5) e que o terminal seja **visivelmente** instrumento (M1). Sem isso, parece VS Code de 2024. — https://cursor.com/changelog/3-0 · https://github.com/zed-industries/zed/discussions/50397
2. **Layout que exige arrumar à mão cansa** ("Stage Manager Dance"; "in desperate need of keyboard shortcuts"). Todo morph (M5) tem que ser automático e ter atalho. — https://www.macstories.net/stories/macos-ventura-the-macstories-review/2/
3. **Elemento que muda de forma vira ruído se muda por evento externo** (Dynamic Island "annoying"; Liquid Glass "visual noise"). Mudança de forma só por ação da pessoa. — https://babich.biz/blog/apple-dynamic-island/ · https://css-tricks.com/getting-clarity-on-apples-liquid-glass/
4. **Profundidade como ambiente morre** (Looking Glass, BumpTop). Profundidade como acento de 2 planos vive (Liquid Glass, visionOS). Não empilhar vidro. — https://en.wikipedia.org/wiki/Project_Looking_Glass · https://think.design/blog/the-complete-guide-to-designing-for-visionos/
5. **Gerenciar muitos agentes não cabe numa coluna de 300 px** (Cursor foi para janela própria; VS Code para Agents window). A coluna da direita é "meus agentes"; a parede/sala é outra vista (M4/M8). — https://cursor.com/changelog/3-1 · https://code.visualstudio.com/docs/agents/run/agents-window
6. **O que o agente roda não pode sujar o terminal da pessoa** (Warp separa blocos da conversa dos blocos do terminal). — https://docs.warp.dev/agents/local-agents/interacting-with-agents/terminal-and-agent-modes/
7. **Detalhe escondido por padrão** (Claude Code: Normal esconde as chamadas de ferramenta; Verbose mostra). Combina com "interface calma" da peneira. — https://code.claude.com/docs/en/desktop
8. **Seguir o agente à força rouba o lugar da pessoa** (Zed pula o editor; Live Share para de seguir quando você abre outro arquivo). M6 mostra a presença sem mover a pessoa. — https://zed.dev/docs/ai/agent-panel · https://learn.microsoft.com/en-us/visualstudio/liveshare/use/coedit-follow-focus-visual-studio-code
9. **Velocidade é parte do desenho** (Superhuman 100 ms; UI otimista com desfazer). Nenhuma animação pode bloquear a digitação. — https://blakecrosley.com/en/guides/design/superhuman
10. **Fontes não lidas** (abaixo) não entram em decisão nenhuma. Em especial, não sei como o Codex app, o Observable, o tldraw computer e o Superhuman Split View são organizados além do que a busca resumiu.

---

## 5. Fontes

### Lidas de verdade (WebFetch com conteúdo)
1. https://cursor.com/changelog/2-0
2. https://cursor.com/changelog/3-0
3. https://cursor.com/changelog/3-1
4. https://cursor.com/changelog/04-15-26
5. https://cursor.com/docs/agent/agents-window
6. https://zed.dev/docs/ai/agent-panel
7. https://github.com/zed-industries/zed/discussions/50397
8. https://github.com/zed-industries/zed/pull/54771
9. https://www.warp.dev/blog/oz-orchestration-platform-cloud-agents
10. https://docs.warp.dev/agents/local-agents/interacting-with-agents/terminal-and-agent-modes/
11. https://starlog.is/articles/ai-agents/warpdotdev-warp
12. https://docs.devin.ai/work-with-devin/devin-session-tools
13. https://docs.devin.ai/desktop/cascade (redirecionado de docs.windsurf.com/windsurf/cascade)
14. https://replit.com/blog/splits (redirecionado de blog.replit.com/splits)
15. https://code.visualstudio.com/docs/agents/run/agents-window
16. https://code.visualstudio.com/docs/copilot/chat/chat-sessions
17. https://code.claude.com/docs/en/desktop
18. https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/
19. https://antigravity.google/product/antigravity-ide/
20. https://www.conductor.build/docs
21. https://lovable.dev/guides/lovable-vs-bolt-vs-v0
22. https://linear.app/docs/peek
23. https://www.notion.com/releases/2022-07-20
24. https://blakecrosley.com/guides/design/arc
25. https://blakecrosley.com/en/guides/design/superhuman
26. https://think.design/blog/the-complete-guide-to-designing-for-visionos/
27. https://css-tricks.com/getting-clarity-on-apples-liquid-glass/
28. https://www.macstories.net/stories/macos-ventura-the-macstories-review/2/
29. https://babich.biz/blog/apple-dynamic-island/
30. https://en.wikipedia.org/wiki/Project_Looking_Glass
31. https://en.wikipedia.org/wiki/BumpTop
32. https://gitnation.com/contents/agents-on-the-canvas-with-tldraw
33. https://tldraw.dev/use-cases/ai-enabled-canvas
34. https://www.figma.com/blog/the-figma-agent-is-here/
35. https://solomon.io/designing-command-palettes/
36. https://blog.jetbrains.com/idea/2025/11/universal-entry-point-a-single-entry-point-for-context-aware-coding-assistance/
37. https://www.soundonsound.com/techniques/ableton-live-session-arrangement-views
38. https://designbycurio.com/learn/bloomberg-terminal-green
39. https://www.sustema.com/post/from-nasa-to-norad-what-we-can-learn-from-the-world-s-most-iconic-control-rooms
40. https://daringfireball.net/linked/2024/09/28/hidden-pref-to-restore-slow-motion-dock-minimizing-on-macos
41. https://learn.microsoft.com/en-us/visualstudio/liveshare/use/coedit-follow-focus-visual-studio-code

### Tentadas e NÃO lidas (não usadas como fonte)
- https://developer.apple.com/design/human-interface-guidelines/ornaments e /spatial-layout — página veio só com o título (renderização por JS).
- https://resources.arc.net/hc/en-us/articles/19335393146775-Split-View-View-Multiple-Tabs-at-Once — HTTP 403.
- https://help.superhuman.com/hc/en-us/articles/38449981831059-Splits-Inbox-2-0 — HTTP 403.
- https://www.bloomberg.com/company/stories/how-bloomberg-terminal-ux-designers-conceal-complexity/ — HTTP 403.
- https://openai.com/index/introducing-the-codex-app/ — HTTP 403.
- https://observablehq.com/@observablehq/reactive-dataflow — HTTP 429.
- https://computer.tldraw.com/ — página veio só com o título.

### Só em resultado de busca (não abertas; citadas apenas como pista)
- Lovable/Bolt = chat à esquerda, preview à direita; v0 = código à esquerda, preview à direita (techpoint.africa, betterstack).
- Codex app: "project thread list on the left, and a central panel for the active agent" (intuitionlabs).
- Superhuman: "Split View allows you to have your inbox and opened email side by side" (baker on tech).
