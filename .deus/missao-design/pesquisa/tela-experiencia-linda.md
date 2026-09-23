# Frente: o que faz a edição visual ser LINDA (e não só funcional)

> Missão `babel-coop/design-2030` · 23/09/2026 · pesquisa por leitura direta de páginas (a cota de WebSearch da sessão estava esgotada em 200/200 quando esta frente começou; todo achado abaixo vem de uma URL aberta com WebFetch e lida de verdade; o que não abriu está na seção 9 como "não lido" e não vira fato).
> Pedido do Theus, literal: "PENSE como fazermos a tela que é o frontend, tipo LOVABLE gerar o site, e no preview poder mexer em todo ele, editar arrastar caixas etc.. mas só que sendo experiência LINDA".
> Serve a: `docs/MAQUINA.md` (peças, Testar, presets), `prototipo/editor.js` (a edição na tela que já existe), `IDEIAS.md` 5.17–5.19 e 15, `docs/ESTUDO_DESIGN_2030.md` (régua de 10 pontos, M1–M8, veredito da identidade) e `PROMPT_AGENTICO_LP.md` (regra 8: toda animação tem desligamento).

## 0. Resposta curta

"Linda" na manipulação direta não é enfeite: é **física crível + precisão visível + calma**. As ferramentas que dão essa sensação (Figma, Keynote, tldraw, Apple) convergem em números pequenos e regras simples:

- **latência**: entrada tratada em ≤ 50 ms, resposta visível em ≤ 100 ms, quadro em ≤ 16 ms (RAIL, Nielsen, INP ≤ 200 ms);
- **arranque do arraste**: 4 px com mouse, 6 px com dedo (tldraw), "cerca de 3 pontos" (Apple), 10 pt de histerese no gesto (WWDC 2018);
- **alças**: raio de 12 px de toque com mouse e 20 px no dedo (tldraw); 10 px de âncora e 5° de tolerância de rotação (Konva);
- **snap**: 8 px de tela dividido pelo zoom, contra bordas, centros e vãos, só do que está na viewport (tldraw); guias de centro, borda, tamanho e espaçamento que aparecem só enquanto arrasta (Keynote, Freeform);
- **peso**: representação translúcida ao levantar; destino acende só enquanto o item está sobre ele; se falha, volta ou "evapora" (Apple HIG);
- **assentar**: 150–400 ms para coisas que se movem, 50–150 ms para hover e press (Atlassian); < 300 ms e `ease-out` (Emil Kowalski); 320 ms é o "médio" do tldraw; só `transform` e `opacity`;
- **agente ao vivo**: presença com corpo e nome que some quando para (tldraw: etiqueta some após 3 s ocioso, presença some após 60 s), "seguir" que não sequestra o lugar da pessoa (Zed sequestra; Live Share para de seguir ao abrir outro arquivo);
- **quem mexeu**: cursor e seleção na cor de cada pessoa (Figma), etiqueta com nome que aparece na atividade (Live Share), calor por idade (GitLens: quente = recente, frio depois de 90 dias);
- **versões**: checkpoint automático a cada 30 min e restaurar sem destruir (Figma), rótulo automático por evento (JetBrains), linha do tempo com prévia ao passar o mouse (Recall);
- **reduced-motion**: não é "sem movimento"; é trocar escala por opacidade e manter o que é essencial (MDN, WCAG 2.3.3, Apple).

O que o protótipo já tem (`editor.js`, `VISUAL`) está no caminho certo, mas com quatro erros de física: o bloco arrastado fica a 35 % de opacidade (some, em vez de "levantar"), o encaixe da Máquina dura 700 ms com overshoot (`cubic-bezier(0.2, 1.4, 0.4, 1)`), o arranque é 6 px em distância Manhattan para mouse e dedo igualmente, e o `base.css` zera toda animação a 0,01 ms em reduced-motion (apaga feedback útil). A seção 7 traz o ajuste, número a número.

## 1. Latência: os números que fazem "parecer físico"

**1.1 RAIL (Google).** "Complete a transition initiated by user input within 100 ms"; "process user input events within 50 ms"; "Produce each frame in an animation in 10 ms or less" com orçamento máximo de "16 ms (1000 ms / 60 frames per second ≈ 16 ms)"; trabalho ocioso em blocos de "50 ms or less". [CONFIRMADO] https://web.dev/articles/rail

**1.2 Nielsen, três limites.** "0.1 second is about the limit for having the user feel that the system is reacting instantaneously"; "1.0 second is about the limit for the user's flow of thought to stay uninterrupted"; "10 seconds is about the limit for keeping the user's attention focused on the dialogue". [CONFIRMADO] https://www.nngroup.com/articles/response-times-3-important-limits/

**1.3 INP (Core Web Vitals).** "An INP below or at 200 milliseconds means a page has good responsiveness"; acima de 500 ms é "poor". A latência de uma interação = atraso de entrada + processamento + atraso de apresentação, "the time from the start of the interaction to the moment the next frame is fully presented". [CONFIRMADO] https://web.dev/articles/inp

**1.4 WWDC 2018, "Designing Fluid Interfaces".** "If you introduce any amount of lag, things all of a sudden just kind of fall off a cliff in terms of how they respond to you"; "Allow for constant redirection and interruption"; "thought and gesture happen in parallel"; molas afinadas por damping e "response" em vez de duração fixa; **10 points** de histerese antes de um swipe ser detectado; 60 fps como padrão. [CONFIRMADO] https://asciiwwdc.com/2018/sessions/803

**Aplicação no Babel Coop.** A camada de seleção roda **dentro do iframe do site**, sem `postMessage` no caminho do hover e do arraste; o `postMessage` só sai ao soltar, ao terminar de digitar e ao apagar (como já faz o `enviar()` do protótipo). Arraste move por `transform: translate()` no compositor, nunca por `top/left`. Orçamento por frame: ≤ 10 ms de trabalho nosso. A medida "↑ pessoa / ↓ agente / latência" da barra do terminal (ESTUDO 2.2, DSN Now) ganha uma irmã na Tela: "último toque → código: 38 ms", em mono, só quando passa de 100 ms fica visível em âmbar.

## 2. Arranque, alças e seleção

**2.1 tldraw, `options.ts` (código lido).** `dragDistanceSquared: 16` ("4 squared"), `coarseDragDistanceSquared: 36` ("6 squared"), `uiCoarseDragDistanceSquared: 625` ("it's really easy to accidentally drag from the toolbar on mobile, so we use a much larger threshold" = 25 px), `doubleClickDurationMs: 450`, `multiClickDurationMs: 200`, `longPressDurationMs: 500`, `snapThreshold: 8`, `hitTestMargin: 3`, `coarseHitTestMargin: 4`, `handleRadius: 12`, `coarseHandleRadius: 20`, `coarsePointerWidth: 12`, `adjacentShapeMargin: 10`, `animationMediumMs: 320`, `edgeScrollDelay: 200`, `edgeScrollDistance: 8`, `edgeScrollSpeed: 25`, `collaboratorIdleTimeoutMs: 3000`, `collaboratorInactiveTimeoutMs: 60000`, `collaboratorCheckIntervalMs: 1200`, `laserFadeoutMs: 500`, `textShadowLod: 0.35`, `followChaseViewportSnap: 2`, `cameraSlideFriction: 0.09`, `zoomToFitPadding: 128`. [CONFIRMADO] https://raw.githubusercontent.com/tldraw/tldraw/main/packages/editor/src/lib/options.ts · em `constants.ts`: `FRAME_MS_60HZ = 1000 / 60` ("Per-tick tuning constants assume a 60 Hz tick"), `DEFAULT_ANIMATION_OPTIONS = { duration: 0, easing: easeInOutCubic }`, `zoomSteps: [0.05, 0.1, 0.25, 0.5, 1, 2, 4, 8]`. [CONFIRMADO] https://raw.githubusercontent.com/tldraw/tldraw/main/packages/editor/src/lib/constants.ts

**2.2 Konva `Transformer` (API lida).** `anchorSize: 10`, `rotateAnchorOffset: 50`, `rotationSnaps: []`, `rotationSnapTolerance: 5`, `padding: 0`, `keepRatio: true`, `centeredScaling: false`, `flipEnabled: true`. [CONFIRMADO] https://konvajs.org/api/Konva.Transformer.html

**2.3 dnd-kit, sensor de ponteiro.** Restrições de ativação: `distance` ("the distance, in pixels, by which the pointer needs to be moved before a drag start event is emitted") ou `delay` + `tolerance` ("If the pointer is moved during the delay duration and the tolerance is set to zero, the drag operation will be immediately aborted"; "particularly useful for touch input... touch input is less precise than mouse input"); as duas são mutuamente exclusivas. [CONFIRMADO] https://dndkit.com/api-documentation/sensors/pointer

**2.4 Apple HIG, Drag and drop.** "Display a drag image as soon as people drag a selection about three points." [CONFIRMADO] https://developer.apple.com/tutorials/data/design/human-interface-guidelines/drag-and-drop.json

**2.5 Figma, seleção.** Hover na lista de camadas mostra "a blue box" no canvas; seleção = caixa azul com alças; seleção profunda com ⌘/Ctrl + clique; "Double-click on the object - or press the enter key - to select one level of nesting down"; Enter desce, Shift+Enter sobe, Tab/Shift+Tab percorrem irmãos; marquee seleciona o que toca. [CONFIRMADO] https://help.figma.com/hc/en-us/articles/360040449873-Select-layers-and-objects

**Aplicação no Babel Coop.**
- Arranque: **4 px** para ponteiro fino, **6 px** para dedo e caneta (`pointerType`), medido em distância euclidiana (hoje o protótipo usa `|dx|+|dy| < 6`, o que dispara com 3+3). Na barra de blocos (toolbar), 25 px no toque, como o tldraw.
- Alças: **8 px visíveis** (quadrado de 1 px de borda, preenchido com o chão), com **área de acerto de 12 px de raio** no mouse e **20 px** no toque; só aparecem na seleção, nunca no hover. Hover é só um contorno de 1 px. Isso casa com a régua 9 do ESTUDO (alvo ≥ 24 px) sem poluir o site.
- Rotação: alça a 50 px acima do bloco (Konva) só em imagens e cartões livres; no fluxo do documento não existe rotação. Snap de rotação a cada 15°, tolerância 5°.
- Hierarquia: Enter desce um nível, Shift+Enter sobe, Tab vai ao próximo irmão: é a forma de selecionar um `<section>` inteiro sem precisar de uma árvore de camadas na tela.
- Duplo clique com janela de 450 ms; toque longo de 500 ms abre o menu do bloco no iPad.

## 3. Snap, guias e medidas

**3.1 tldraw, `SnapManager` (código lido).** `getSnapThreshold() { return this.editor.options.snapThreshold / this.editor.getZoomLevel() }` (8 px de tela, constante em qualquer zoom); dois gerentes, `BoundsSnaps` e `HandleSnaps`; indicadores de tipo `points` e `gaps` (horizontal/vertical); "Only consider shapes if they're inside of the viewport page bounds". [CONFIRMADO] https://raw.githubusercontent.com/tldraw/tldraw/main/packages/editor/src/lib/editor/managers/SnapManager/SnapManager.ts

**3.2 Keynote, guias de alinhamento.** "Guides appear as you drag an object on a slide in alignment with, or equidistant to, another object." Quatro tipos: centro ("an object's center aligns with another object's center or the center of the slide"), borda, tamanho ("matches another object's size in a particular dimension") e espaçamento ("three or more objects are placed equally apart in a line"). A cor é configurável em Ajustes › Réguas ("click the color well next to Alignment Guides"); **a página não diz a cor padrão** (o "amarelo" do briefing fica como não confirmado). [CONFIRMADO] https://support.apple.com/guide/keynote/use-alignment-guides-tan738df74cb/mac

**3.3 Freeform, alinhar.** Os mesmos quatro tipos (Center, Edge, Relative Sizing, Relative Spacing) que "appear as you drag an item on a board in alignment with, or equidistant to, another item"; "View > Snap to Grid" para bordas e pontos irem ao ponto mais próximo da grade; "Arrange > Distribute Objects" para três ou mais. [CONFIRMADO] https://support.apple.com/guide/freeform/align-items-frfma75f5f63/mac

**3.4 Figma, medir distâncias.** Selecionar o primeiro objeto, segurar ⌥ Option (Mac) ou Alt (Windows) e passar sobre o segundo: "Figma will display a red line between the two objects, as well as horizontal and vertical measurements"; ⌘⌥ para camadas aninhadas; "It's not currently possible to change the weight or color of the red measurement line". A cor é **vermelha**, não rosa. [CONFIRMADO] https://help.figma.com/hc/en-us/articles/360039956974-Measure-distances-between-layers

**Aplicação no Babel Coop.** Guias de **1 px** nos quatro tipos do Keynote, tolerância de **8 px de tela** (independente do zoom da prévia), só contra blocos visíveis. No fluxo do documento, o que existe de verdade é "antes/depois do irmão" (a linha ciano de 3 px do protótipo continua) e "mesma largura/altura que o vizinho" (guia de tamanho). Segurar **Alt** mostra as distâncias em px (margem e vão) numa cor fixa de medida com Lc ≥ 60 sobre o chão (`#060b16` pede um vermelho-coral claro, não o vermelho do Figma sobre branco); solta, some. A grade de 8 px do ESTUDO (GMUNK) é a grade do "Snap to Grid", opcional e desligada por padrão.

## 4. Peso, levantar e assentar

**4.1 Apple HIG, Drag and drop.** "It works well to create a translucent representation of the content people are dragging. Translucency helps distinguish the representation from the original content and lets people see destinations as they pass over them." "Display highlighting or other visual cues only while the content is positioned above the destination, removing the visual feedback when people drag the content away." Falha: "the item can move back from its current location to its source... or it can scale up and fade out to give the impression of the item evaporating instead of landing successfully." Vários itens: "A badge is a small filled oval containing a number". Spring loading: ativar controles passando o item por cima. [CONFIRMADO] https://developer.apple.com/tutorials/data/design/human-interface-guidelines/drag-and-drop.json

**4.2 Apple HIG, Motion.** "Don't add motion for the sake of adding motion. Gratuitous or excessive animation can distract people and may make them feel disconnected or physically uncomfortable." "Strive for realistic feedback motion that follows people's gestures and expectations." "Aim for brevity and precision in feedback animations. When animated feedback is brief and precise, it tends to feel lightweight and unobtrusive." "In apps, generally avoid adding motion to UI interactions that occur frequently." "Let people cancel motion... don't make people wait for an animation to complete." "Make motion optional." [CONFIRMADO] https://developer.apple.com/tutorials/data/design/human-interface-guidelines/motion.json

**4.3 Emil Kowalski, "Great animations".** "Your animations should also usually be shorter than 300ms"; "The best type of easing for this purpose is ease-out. It starts fast and slows down at the end"; "you should try to animate with transform and opacity" (só compõem; padding/margin disparam layout, paint e composite); **nunca animar ações de teclado** ("users perform them hundreds of times daily"); animações interrompíveis; respeitar `prefers-reduced-motion`. [CONFIRMADO] https://emilkowal.ski/ui/great-animations

**4.4 Atlassian Design System, Motion.** "Interactions (50–150ms): Used for hover and press states"; "Transitions (150–400ms): Used for elements entering, exiting, or moving on screen"; curvas: ease-out bold `cubic-bezier(0, 0.4, 0, 1)` ("arrive quickly and decelerate to a stop"), ease-in-out bold `cubic-bezier(0.4, 0, 0, 1)` ("Gentle start and soft settle. Best for scaling Modals or repositioning elements"), ease-in practical `cubic-bezier(0.6, 0, 0.8, 0.6)` (saídas), ease-out practical `cubic-bezier(0.4, 1, 0.6, 1)` ("Subtle, everyday entrance curve... hover background fades"); "keep small elements (hover states, micro-interactions) fast and understated. Allow larger elements... more time". [CONFIRMADO] https://atlassian.design/foundations/motion

**4.5 Carbon (IBM), `_motion.scss` (código lido).** `$ease-in: cubic-bezier(0.25, 0, 1, 1)` ("removing elements from the screen"), `$ease-out: cubic-bezier(0, 0, 0.25, 1)` ("adding elements to the screen or changing on-screen states"), `$standard-easing: cubic-bezier(0.5, 0, 0.1, 1)` ("majority of animations"), `$transition-base: 250ms`, `$transition-expansion: 300ms`. Os tokens `duration-fast-01…slow-02` não apareceram no trecho lido (não confirmados). [CONFIRMADO parcial] https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/styles/scss/_motion.scss

**4.6 Motion (ex-Framer Motion), gestos.** Exemplos oficiais: `whileHover={{ scale: 1.2 }}`, `whileTap={{ scale: 0.9 }}`, `whileDrag={{ scale: 1.2, backgroundColor: "#f00" }}`. São exemplos de demonstração, não recomendação de calma. [CONFIRMADO] https://motion.dev/docs/react-gestures

**4.7 Motion, Reorder.** "Reorder.Group automatically detects whether its items are arranged horizontally, vertically, or across both dimensions" (`axis` "x", "y" ou "xy"); ao arrastar um item, a nova ordem é calculada e os outros itens animam para o lugar novo por layout animation; `onReorder` devolve a sequência. [CONFIRMADO] https://motion.dev/docs/react-reorder

**4.8 Keynote, Magic Move.** "A Magic Move is a transition that creates the effect of objects moving from their positions on one slide to new positions on the next slide"; "Any objects appearing on both slides become part of the transition"; os que só existem no primeiro "fade out", os que só existem no segundo "fade in"; opção "Fade Unmatched Objects"; casamento por "Object", "Word" ou "Character"; aceleração "None", "Ease in", "Ease Out", "Ease In & Ease Out". [CONFIRMADO] https://support.apple.com/guide/keynote/add-transitions-tanff5ae749e/mac

**Aplicação no Babel Coop (a física do bloco).**
- **Levantar** (ao passar os 4 px): 80 ms `ease-out`; `transform: scale(1.01)`; sombra de `0 1px 2px` para `0 6px 16px rgba(0,0,0,.35)`; opacidade **0,9** (translúcido, como a HIG; não 0,35 como hoje, que faz o bloco sumir e a pessoa perder o que está carregando). O contorno de seleção fica.
- **Durante**: só `transform` no compositor; as guias e a linha de inserção (3 px ciano) são os únicos sinais; o destino (o irmão que vai receber) ganha o contorno de 1 px **só enquanto o ponteiro está sobre ele**.
- **Assentar** (soltar): o bloco vai ao lugar em **160 ms** com `cubic-bezier(0, 0, 0.25, 1)` (Carbon ease-out), sombra e escala voltam em 120 ms; os irmãos deslizam por FLIP em **200 ms** (Reorder/Magic Move): nada "pula".
- **Cancelar** (Esc ou soltar fora): volta ao lugar de origem em 200 ms `ease-out`; nunca "evapora" (o bloco existe no código; evaporar mentiria).
- **Sem overshoot em lugar nenhum** (ESTUDO 2.4: `--mov-padrao` 100–200 ms sem overshoot; slop tell "easing elástico"). O `encaixa` da Máquina (700 ms, `cubic-bezier(0.2, 1.4, 0.4, 1)`) vira 220 ms `ease-out` de `scale(.96)` + `opacity 0`, e o "brilho" de chegada é o anel de 1 px na cor do agente por 800 ms, uma vez.
- **Teclado nunca anima**: ↑/↓ (subir/descer), Delete e Cmd+D (duplicar) trocam de posição sem transição (Emil).
- Vários blocos selecionados arrastando juntos: badge com o número (HIG), 12 px mono.

## 5. Texto: entrar em edição sem pulo

**5.1 Figma.** "Double-click on the object - or press the enter key - to select one level of nesting down" (o mesmo gesto desce na hierarquia até chegar no texto). [CONFIRMADO] https://help.figma.com/hc/en-us/articles/360040449873-Select-layers-and-objects

**5.2 tldraw.** `doubleClickDurationMs: 450`; `multiClickDurationMs: 200`. [CONFIRMADO] https://raw.githubusercontent.com/tldraw/tldraw/main/packages/editor/src/lib/options.ts

**5.3 Lovable, preview toolbar.** "The preview toolbar replaces the previous Visual edits experience"; modos: selecionar elementos e pedir por texto, **editar texto inline** ("100 free edits per account" por mês; além disso gasta crédito), desenhar anotações, comentar. Selecionar e anotar consomem crédito "as standard build usage". A documentação não diz como a mudança mapeia para o código. [CONFIRMADO] https://docs.lovable.dev/features/visual-edit

Não encontrei documentação que descreva o **caret** nem a regra "sem pulo" (a página de texto do Figma que abriu é só de propriedades tipográficas). A regra abaixo é nossa, derivada da física do protótipo.

**Aplicação no Babel Coop.** Duplo clique (≤ 450 ms) põe `contenteditable` **no próprio elemento**, com o caret no ponto do clique (`document.caretPositionFromPoint`), sem trocar fonte, tamanho, padding ou largura: o texto não "pula" porque não muda de caixa. O contorno troca de acento para verde (já é assim) e **as alças somem** (não se redimensiona enquanto se escreve). Esc sai e volta à seleção; clicar fora sai e salva; Enter em título faz o que o site faz (quebra), não sai. A barra flutuante do bloco vira uma barra de texto (negrito, link) só se o elemento aceitar. Cada digitação vai para o rascunho (`enviar()` já faz); o cartão no terminal só nasce ao sair da edição. Edição direta de texto e posição é **sem agente e sem crédito**, sempre; o agente entra no que não mapeia ("põe em duas colunas"), como o Lovable cobra, mas aqui a fronteira é explícita na tela: o que dá para mexer com a mão tem alça; o que não dá, tem o botão "Pedir ao agente" com o bloco já selecionado (Design Mode do Cursor, 6.2).

## 6. O agente edita ao vivo, na frente da pessoa

**6.1 Figma agent (blog oficial).** "available directly on the canvas and in the left rail"; "a dedicated design agent that works beside you on the canvas, inside the same file as your team"; "Make edits and iterate while the agent iterates, too"; "Start a prompt from any design layer"; "Parallel prompt to play out multiple ideas at once"; beta gradual, sem crédito durante o beta, só planos Professional/Organization/Enterprise. **O post não descreve um cursor com nome para o agente.** [CONFIRMADO] https://www.figma.com/blog/the-figma-agent-is-here/

**6.2 Cursor 3.0 (02/04/2026), Design Mode.** "In the Agents Window, you can use Design Mode to annotate and target UI elements directly in the browser"; ⌘⇧D alterna; "Shift + drag to select an area"; "⌘ + L to add element to chat"; "⌥ + click to add element to input"; "give more precise feedback and iterate faster by pointing the agent to exactly the part of the interface you're referring to". Não diz que escreve código direto: é apontar e falar. [CONFIRMADO] https://cursor.com/changelog/3-0 · Em 27/08/2026 o changelog geral cita de passagem: "Cursor now port-forwards your cloud agent's live environment straight to your browser, so you can preview it and use tools like design mode." [CONFIRMADO] https://cursor.com/changelog

**6.3 tldraw fairies (palestra, GitNation).** O que o agente faz se entende por "its animation and its state on the canvas", mais legível que log de texto; "its vision is always based on like where it is on the canvas"; a pessoa vê e pode interromper; "you can select a couple of different fairies and make a group chat"; agentes em tarefa "can't see anything outside of that task". [CONFIRMADO] https://gitnation.com/contents/agents-on-the-canvas-with-tldraw

**6.4 Zed, painel de agente.** "Follow the agent as it reads and edits files by clicking the crosshair icon at the bottom left of the panel. Your editor will jump to each file the agent touches"; segurar cmd/ctrl ao enviar já segue; revisar mudanças em multi-buffer com "accept or reject each individual change hunk"; "interrupt the agent immediately... by clicking on the stop button". [CONFIRMADO] https://zed.dev/docs/ai/agent-panel

**6.5 VS Live Share (pessoas, não agentes).** "By default, Visual Studio Live Share automatically displays a flag next to a participant's cursor on hover or when the participant makes edits, highlights something, or moves the cursor" (Name Tag Visibility: Never / **Activity** (padrão) / Always); "Participants can see cursors and edits. They can also see selections you make"; seguir sincroniza arquivo e rolagem e **para sozinho** se "You open a different file" ou fecha o arquivo; "Focus participants" manda uma notificação com o botão Follow. [CONFIRMADO] https://learn.microsoft.com/en-us/visualstudio/liveshare/use/coedit-follow-focus-visual-studio-code

**6.6 Figma, multiplayer (2016).** "We show the cursor and selection of all active participants because it provides important context"; avatares no canto superior direito; clicar no avatar entra num modo em que "they are presenting to you", opt-in, dá para sair e voltar "without interrupting anyone else". [CONFIRMADO] https://www.figma.com/blog/multiplayer-editing-in-figma/ · Por baixo: "Figma's multiplayer servers keep track of the latest value that any client has sent for a given property on a given object" (último a escrever vence, por propriedade). [CONFIRMADO] https://www.figma.com/blog/how-figmas-multiplayer-technology-works/

**Aplicação no Babel Coop (o mecanismo que ninguém mostra).**
- O agente tem **cursor próprio**: seta na cor do agente com o bitmap 7×11 (ESTUDO, Arecibo) e o nome em 11 px mono; a etiqueta segue a regra do Live Share ("Activity"): aparece quando ele age, some 3 s depois de parar (tldraw `collaboratorIdleTimeoutMs: 3000`); o cursor inteiro some após 60 s sem ação.
- **A mudança acontece com o cursor visível e com a mesma física da pessoa**: o cursor desliza até o bloco em 320 ms (tldraw `animationMediumMs`), o bloco ganha o contorno de 1 px na cor do agente, e o que muda (texto, posição, cor) muda com o mesmo levantar/assentar da seção 4. Nada aparece "do nada": se o agente cria um bloco, ele entra com o `encaixa` de 220 ms no lugar onde o cursor está. Nada anima sem dado (ESTUDO, Interstellar): o cursor só se move quando há um diff real chegando.
- **Seguir sem sequestrar** (M6 do ESTUDO): a pessoa mantém a própria seleção e a própria rolagem; um botão "seguir" opcional por agente rola a prévia para onde ele está; abrir outra aba desfaz (regra do Live Share). O Zed pula o editor; aqui não.
- **Apontar e pedir** (Design Mode do Cursor): com um bloco selecionado, ⌥ + clique ou o botão "Pedir ao agente" manda o bloco (arquivo:linha) para o terminal-instrumento (M1), que troca as receitas pelo tipo do bloco. Shift + arrastar seleciona uma área e manda tudo.
- **Parar**: um clique no anel do agente (o anel de traço único do ESTUDO) para na hora; o bloco em que ele estava fica com o contorno aberto (anel parado) e o cartão "parado no meio de: trocar o título" com desfazer.
- **Conflito**: último a escrever vence por propriedade (Figma), mas com a diferença de que toda escrita vira versão (seção 8); se a pessoa está com o bloco em `contenteditable`, o agente **espera** (não escreve no bloco que tem caret de gente).

## 7. "Quem mexeu" por cor de pessoa

**7.1 Figma.** Cursor e seleção de cada participante na cor dele (6.6). [CONFIRMADO]

**7.2 Google Docs.** "Select part of the document and right-click" → "Show editors" para ver quem escreveu aquele trecho; "You can add up to 40 named versions per document". A página não explica a cor por editor. [CONFIRMADO] https://support.google.com/docs/answer/190843

**7.3 GitLens (heatmap).** "Heatmap colors are customizable and reflect line age: Hot (bright) for recent changes, Cold (dim) for older changes", com linhas ficando "cold" **depois de 90 dias**; gutter blame com autor, data e mensagem por linha; "Current Line Blame" no fim da linha ativa. [CONFIRMADO] https://help.gitkraken.com/gitlens/gitlens-features/

**7.4 Protótipo hoje (`editor.js`).** Cada bloco mexido ganha `data-por` e, na edição, `box-shadow: inset 4px 0 0 <cor>` mais o nome em 10 px; na Máquina, `border-left: 3px solid var(--pessoa)` sempre e, em "Ver por pessoa", `box-shadow: 0 0 0 3px color-mix(<cor> 25 %)`.

**Aplicação no Babel Coop.**
- Cor de pessoa **nunca** nas alças nem no contorno de seleção (isso é o acento do sistema); cor de pessoa é só "quem mexeu" e "quem está aqui". Assim a pessoa nunca confunde "selecionado por mim" com "feito pela Rita".
- Fora do modo: a borda-esquerda de 3 px (como na Máquina) é a marca permanente e discreta; o nome em 11 px mono (piso da régua 8 do ESTUDO; 10 px está abaixo) aparece só no hover.
- **"Ver por pessoa"**: contorno de 2 px na cor de quem mexeu por último em volta de cada bloco, peça, trecho ou galho, com o nome no canto superior esquerdo, fora do bloco (não tapa conteúdo). A idade entra como **opacidade do contorno** (GitLens): 100 % hoje, decaindo até 30 % em 30 dias; também é a escala de tempo do ESTUDO (ciano = agora, azul = hoje, roxo = antigo) aplicada à moldura, não ao bloco.
- Passar o mouse num contorno abre a ficha: quem, quando, "ver a versão", "chamar", "pedir ajuda" (IDEIAS 5.18: serve para saber com quem falar).
- O agente é uma "pessoa" nessa gramática (cor do agente + bitmap), então o site mostra sem esforço o que foi feito à mão e o que foi feito pelo agente.

## 8. Versões como uma régua que a pessoa arrasta

**8.1 Figma, version history.** "Figma records a new checkpoint every 30 minutes and keeps the current version up to date with your file changes"; versões nomeadas ("Figma clips titles longer than 25 characters", descrição ≤ 140); restaurar é não-destrutivo: "Figma will add two autosave checkpoints to the file's version history" (o estado atual e o ponto restaurado); cada versão mostra "the name and avatar of the main contributor"; Starter só vê 30 dias. [CONFIRMADO] https://help.figma.com/hc/en-us/articles/360038006754-View-a-file-s-version-history

**8.2 JetBrains, Local History.** Grava sozinho "as you edit code, run tests, deploy applications"; rótulos automáticos "based on predefined events: running tests, deploying apps, committing changes"; diff por revisão; reverter o arquivo ou só um trecho; guarda "the last 5 working days (that is, days when the file was modified)". [CONFIRMADO] https://www.jetbrains.com/help/idea/local-history.html

**8.3 Microsoft Recall (linha do tempo).** "a snapshot of your active screen will be saved every few seconds and when the content of your active window changes"; "Your timeline in Recall is broken up into segments"; "You can hover over your timeline to review your activity in a preview window. Selecting the location on the timeline or selecting the preview window loads the snapshot". [CONFIRMADO] https://support.microsoft.com/en-us/windows/retrace-your-steps-with-recall-aa03f8a0-a78b-4b3e-b0a1-2eb8ac48701c

**8.4 Keynote, Magic Move** (4.8): o que existe nas duas versões se move; o que só existe numa some ou aparece. [CONFIRMADO]

**Aplicação no Babel Coop (a régua).**
- Uma linha de 1 px no topo da aba com **marcas** (tick de 1 × 6 px) por salvamento e por evento (rótulo automático como no JetBrains: "teste passou", "publicou", "preset salvo", "agente terminou"), cada marca com a foto (pessoa) ou o bitmap (agente) de quem salvou.
- **Hover = prévia** (Recall): a prévia do site troca para aquela versão enquanto o ponteiro está sobre a marca, sem animação (corte seco, ≤ 100 ms, para não enjoar em scrubbing); a marca mostra "14:32 · Rita · trocou o título".
- **Arrastar = scrubbing**: um cabo de 8 px de raio que a pessoa segura; enquanto arrasta, as versões passam em corte seco; ao soltar, a prévia fica na versão apontada em modo leitura, com um botão "Voltar como estava" (que **cria** uma versão nova, como o Figma, nunca apaga) e "Comparar com agora".
- **Comparar** = Magic Move entre duas versões: blocos comuns deslizam para a posição nova (200 ms), removidos somem em fade, adicionados entram em fade; casamento por bloco (`data-por` + caminho no DOM), com a opção de casar por palavra em textos. É a forma mais honesta de "ver o que mudou" sem diff de código para quem não programa.
- Mesma régua para Máquina (peças), texto (Markdown) e mapa; a escala de tempo do ESTUDO (ciano → roxo) colore a própria linha.
- Retenção: tudo, sem limite de 30 dias (o Babel Coop é nosso); marcas automáticas a cada salvamento, e um checkpoint de 30 min quando o agente trabalha muito tempo sem salvar.

## 9. Overlay que não tapa, ferramentas que somem

**9.1 Procreate.** "Tap 4 fingers on the screen to invoke Full Screen mode. The interface will slide away to give you a clean view of your canvas"; volta com "Tap with 4 fingers again, or tap the Full Screen indicator in the top left corner". [CONFIRMADO] https://help.procreate.com/procreate/handbook/interface-gestures/interface

**9.2 Apple HIG, translucência do item arrastado** (4.1): deixa ver os destinos por baixo. [CONFIRMADO]

**9.3 tldraw, `laserFadeoutMs: 500`** ("fade all laser scribbles after the session ends") e `textShadowLod: 0.35` (sombra de texto só até certo zoom). [CONFIRMADO]

**Aplicação no Babel Coop.** O overlay é **só traço**: contorno de 1 px no hover, 2 px + 8 alças na seleção, nunca preenchimento, nunca "tint" sobre o bloco (não confirmei o "tinted overlay" do Figma; e a régua 1 do ESTUDO exige que cada pixel carregue informação). A barra do bloco flutua **fora** do bloco (acima; abaixo se não couber), a 8 px. Ao começar o arraste, some tudo menos guias e a linha de inserção. **Cmd+\** (ou 4 dedos no iPad) esconde toda a camada de edição e mostra o site puro; o indicador de "editando" fica como um ponto de 3 px no canto (DSKY: nada aceso quando nada muda). Anotações feitas para o agente (área com Shift + arrastar) somem sozinhas 500 ms depois de enviadas, como o laser do tldraw.

## 10. prefers-reduced-motion: tabela de equivalentes, não zero

**10.1 MDN.** "The prefers-reduced-motion CSS media feature is used to detect if a user has enabled a setting on their device to minimize the amount of non-essential motion"; **não é "sem movimento"**: o exemplo troca uma animação de `scale` (pulse) por uma de `opacity` (dissolve) porque "Animations such as scaling or panning large objects can be vestibular motion triggers". [CONFIRMADO] https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

**10.2 WCAG 2.3.3.** "Motion animation triggered by interaction can be disabled, unless the animation is essential to the functionality or the information being conveyed"; exemplo de essencial: "A web application provides a feature to author animated sequences. As part of this tool the author needs to preview the animation"; rolagem controlada pela pessoa é permitida. [CONFIRMADO] https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html

**10.3 Apple HIG.** "Make motion optional. Not everyone can or wants to experience the motion in your app or game, so it's essential to avoid using it as the only way to communicate important information." [CONFIRMADO] (4.2)

**Aplicação no Babel Coop (a tabela).** O `base.css` hoje zera tudo a 0,01 ms; troca por:

| Efeito | Padrão | Com reduced-motion |
|---|---|---|
| Arrastar (o bloco segue o ponteiro) | segue | **segue igual** (é essencial, WCAG) |
| Levantar (escala 1,01 + sombra) | 80 ms | sombra aparece sem transição; sem escala |
| Assentar (160 ms) e irmãos (FLIP 200 ms) | deslizam | corte seco; a linha de inserção fica 300 ms a mais |
| Cancelar (volta 200 ms) | desliza | corte seco + contorno pisca 1 vez em opacidade |
| Encaixe de peça nova (220 ms) | escala + fade | só fade de opacidade 150 ms (MDN) |
| Cursor do agente (desliza 320 ms) | desliza | aparece no destino; a etiqueta com nome fica 3 s |
| Anel do agente (traço 1,2 s) | desenha | anel fixo aberto/fechado (tabela do ESTUDO) |
| Scrubbing de versões | corte seco | corte seco (já é) |
| Magic Move entre versões | 200 ms | antes/depois lado a lado, sem movimento |
| Guias e medidas | aparecem sem fade | igual |

## 11. Armadilhas (o que faz "bonito" virar cansativo)

1. **Overshoot e elástico**: o `encaixa` atual (`cubic-bezier(0.2, 1.4, 0.4, 1)`, 700 ms) é o tell nº 1 de "template de IA" (ESTUDO, impeccable) e viola Apple ("brevity and precision"). Nenhuma curva com valor acima de 1.
2. **Opacidade 0,35 no arraste** faz o bloco "sumir" da mão; a HIG pede translúcido para ver o destino, não invisível. 0,9.
3. **Animar teclado**: subir/descer com setas animado vira tortura na centésima vez (Emil).
4. **Seguir que sequestra** (Zed pula o editor): a pessoa perde o lugar dela. Seguir é opcional, por agente, e se desfaz ao trocar de aba.
5. **Cor de pessoa nas alças**: mistura "selecionado" com "de quem é". Alça é sempre acento do sistema.
6. **`postMessage` no hover**: cada evento cruzando o iframe custa latência; o overlay vive dentro do iframe e só manda o resultado.
7. **Medidas com cor fixa que não contrasta**: o Figma não deixa mudar a cor e a linha some em fundo escuro; aqui a cor de medida é token com Lc ≥ 60 sobre `#060b16`.
8. **Reduced-motion = 0,01 ms**: mata o feedback que a pessoa precisa (o "assentou" vira adivinhação). Tabela de equivalentes.
9. **Scrubbing com animação**: trocar versões deslizando enquanto a pessoa arrasta a régua causa enjoo (vestibular, MDN). Corte seco no scrubbing; Magic Move só no "Comparar", uma vez.
10. **Cobrar por apontar** (Lovable cobra por seleção; texto inline só 100 grátis): no Babel Coop a mão é grátis e local; o agente entra só onde a mão não alcança, com a fronteira visível.
11. **Toolbar que dispara arraste no toque**: o tldraw precisou de 25 px de arranque na barra em celular; a barra do bloco no iPad usa o mesmo.
12. **Guia "amarela", alça "de 8 px", overlay "tingido", box model "laranja/verde/azul" do briefing**: não confirmados em documentação lida (Keynote não cita cor padrão; Figma não documenta o tamanho da alça; Webflow e Canva devolveram 403). Usar como intuição, não como fato.

## 12. O que ninguém fez (com a busca de anterioridade desta frente)

1. **Agente com cursor, nome e a mesma física da mão.** O Figma agent "trabalha ao lado" mas o post não descreve cursor; as fairies do tldraw são personagens num canvas de desenho, não num site real que vira código; o Zed segue por arquivo, não por bloco; o Cursor Design Mode aponta, não edita. Ninguém mostra o agente **levantando e assentando um bloco de site de verdade** com o mesmo peso que a pessoa sente.
2. **Régua de versões com prévia por hover e scrubbing** num editor de site/backend: Figma e Docs são listas; Recall tem a régua mas não é editor; JetBrains tem rótulos por evento mas sem prévia visual.
3. **Magic Move entre versões** de um site (blocos comuns deslizam, removidos somem, novos aparecem) como "diff para quem não programa".
4. **"Ver por pessoa" com idade** (heatmap do GitLens) aplicado a blocos de site **e** a peças de backend na mesma tela, com o agente como uma das "pessoas".
5. **Uma só física para site e backend**: as mesmas alças, o mesmo arranque de 4/6 px, o mesmo snap de 8 px e o mesmo assentar de 160 ms para um `<section>` e para uma Gaveta da Máquina. Nenhum editor lido trata frontend e backend com o mesmo corpo.
6. **Fronteira explícita entre mão e agente**: o que tem alça a mão faz de graça e vira código na hora; o que não tem alça tem o botão de pedir, com o bloco já selecionado. Lovable e Cursor escondem essa fronteira atrás de crédito e de chat.
7. **Reduced-motion como tabela de equivalentes** por efeito (arraste segue, assentar corta, cursor teleporta), em vez de zerar tudo.

"Não vi" não é "não existe": a busca foi por leitura direta de páginas oficiais e código-fonte, sem WebSearch nesta frente.

## 13. Não lido (não vira fato)

- Webflow, box model (help.webflow.com/hc/en-us/articles/33961333856787): **403**.
- Canva, redimensionar e girar (canva.com/help/resize-rotate-elements/): **403**.
- Framer, stacks e fit/fill/fixed (framer.com/help/articles/how-to-use-stacks/): **404**; a página de aprendizado só lista aulas em vídeo.
- Spline, gizmos (docs.spline.design): só a página inicial, sem detalhe.
- Material 3, tokens de duração e easing (m3.material.io): página renderizada por JS, veio só o título.
- Apple, Time Machine (mh35862): redirecionou para a página de boas-vindas do guia do Mac.
- fabric.js, defaults de alça (raw GitHub): **404** no caminho tentado.
- tldraw, páginas de docs "handles" e "snapping" (tldraw.dev/docs/sdk-features/...): **404**; o código-fonte supriu.
- Figma, cursor chat (id 1500004414382): abriu um artigo de formas do FigJam (id errado); Figma, "handles de 8 px", "smart selection", "tinted overlays": sem página confirmando.
- Figma, edição de texto (Explore text properties): a página é só de propriedades tipográficas.
- Carbon, tokens `duration-fast-01…slow-02`: página truncada; só o `_motion.scss` com 3 easings e 2 durações.
- Rive (state machine) e Origami (patches, Viewer, Pop Animation, Transition): abriram, mas só o índice; sem números de duração/bounciness. [CONFIRMADO parcial] https://rive.app/docs/editor/state-machine/state-machine · https://origami.design/documentation/

## 14. Fontes lidas (URL aberta e conteúdo conferido)

1. https://web.dev/articles/rail
2. https://www.nngroup.com/articles/response-times-3-important-limits/
3. https://web.dev/articles/inp
4. https://asciiwwdc.com/2018/sessions/803
5. https://raw.githubusercontent.com/tldraw/tldraw/main/packages/editor/src/lib/options.ts
6. https://raw.githubusercontent.com/tldraw/tldraw/main/packages/editor/src/lib/constants.ts
7. https://raw.githubusercontent.com/tldraw/tldraw/main/packages/editor/src/lib/editor/managers/SnapManager/SnapManager.ts
8. https://konvajs.org/api/Konva.Transformer.html
9. https://dndkit.com/api-documentation/sensors/pointer
10. https://developer.apple.com/tutorials/data/design/human-interface-guidelines/drag-and-drop.json
11. https://developer.apple.com/tutorials/data/design/human-interface-guidelines/motion.json
12. https://help.figma.com/hc/en-us/articles/360040449873-Select-layers-and-objects
13. https://help.figma.com/hc/en-us/articles/360039956974-Measure-distances-between-layers
14. https://help.figma.com/hc/en-us/articles/360038006754-View-a-file-s-version-history
15. https://www.figma.com/blog/multiplayer-editing-in-figma/
16. https://www.figma.com/blog/how-figmas-multiplayer-technology-works/
17. https://www.figma.com/blog/the-figma-agent-is-here/
18. https://cursor.com/changelog/3-0
19. https://cursor.com/changelog
20. https://docs.lovable.dev/features/visual-edit
21. https://support.apple.com/guide/keynote/use-alignment-guides-tan738df74cb/mac
22. https://support.apple.com/guide/keynote/add-transitions-tanff5ae749e/mac
23. https://support.apple.com/guide/freeform/align-items-frfma75f5f63/mac
24. https://support.apple.com/guide/freeform/move-items-frfm220e044a/mac
25. https://help.procreate.com/procreate/handbook/interface-gestures/interface
26. https://emilkowal.ski/ui/great-animations
27. https://atlassian.design/foundations/motion
28. https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/styles/scss/_motion.scss
29. https://motion.dev/docs/react-gestures
30. https://motion.dev/docs/react-reorder
31. https://gitnation.com/contents/agents-on-the-canvas-with-tldraw
32. https://zed.dev/docs/ai/agent-panel
33. https://learn.microsoft.com/en-us/visualstudio/liveshare/use/coedit-follow-focus-visual-studio-code
34. https://support.google.com/docs/answer/190843
35. https://help.gitkraken.com/gitlens/gitlens-features/
36. https://www.jetbrains.com/help/idea/local-history.html
37. https://support.microsoft.com/en-us/windows/retrace-your-steps-with-recall-aa03f8a0-a78b-4b3e-b0a1-2eb8ac48701c
38. https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
39. https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html
40. https://rauno.me/craft/interaction-design (lido; ensaio observacional, sem números; não virou achado)
41. https://rive.app/docs/editor/state-machine/state-machine (parcial)
42. https://origami.design/documentation/ (parcial)
