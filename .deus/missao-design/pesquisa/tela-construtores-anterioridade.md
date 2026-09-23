# Frente: anterioridade dos construtores de frontend com edição no preview

> Missão `babel-coop/design-2030` · 23/09/2026 · frente `tela-construtores-anterioridade` · **duas passadas**.
> Pergunta do Theus: "PENSE como fazermos a tela que é o frontend, tipo LOVABLE gerar o site, e no preview poder mexer em todo ele, editar, arrastar caixas etc., mas sendo experiência LINDA."
> Método: o orçamento de WebSearch da sessão estava esgotado (200/200) nas duas passadas. **1ª passada (08:00)**: WebFetch nas páginas de documentação, índices `llms.txt`, APIs dos centros de ajuda (Zendesk), código-fonte no GitHub (raw), API do Hacker News (Algolia) e fórum do Cursor (Discourse `search.json`). **2ª passada (08:40)**: `curl` direto nas versões `.md`/JSON das mesmas documentações para **verificar** cada afirmação central e fechar lacunas (Lovable, v0, Cursor, Bolt, Replit, Figma Make e Sites, Claude Design, Stitch/DESIGN.md, Builder, Webflow AI, Anima, Grapes Studio, Squarespace, pacote `lovable-tagger` no npm). Cada achado leva a URL lida. O que não abriu (403, 404, página só em JS) está marcado **não lido** e não vira fato. Frases entre aspas em inglês são literais da fonte. Marcação: **[2ª]** = verificado hoje na segunda passada; sem marca = lido na primeira.

---

## 0. Resumo em doze linhas

1. Em 2026 todo construtor grande convergiu para o mesmo gesto: **apontar no preview + descrever em português**. Lovable, v0, Bolt, Replit, Cursor, Figma Make, Claude Design, Anima e Builder têm isso. O que os diferencia é **quanto dá para mexer sem pedir à IA** (painel de propriedades) e **se a edição direta custa crédito**.
2. Há agora **cinco famílias técnicas** para ligar o pixel ao código: (a) **marcar no build** (Onlook `data-oid` via AST; code-inspector `data-insp-path`); (b) **substituir o runtime de JSX em desenvolvimento** (o `lovable-tagger` de 2026 troca o `jsxDEV`, injeta um `ref` e guarda `arquivo:linha:coluna` num `Map` com `WeakRef` para cada nó do DOM, sem atributo nenhum) **[2ª]**; (c) **inspecionar em tempo de execução e entregar ao agente** (Cursor: xpath + estilos computados + "props from the fiber tree" + captura) **[2ª]**; (d) **simular no iframe e editar o código ao mesmo tempo** (Onlook); (e) **renderizar o próprio app dentro do editor** (Plasmic). Ler `_debugSource` do fiber do React **morreu no React 19** (PR #28265).
3. Quem oferece painel de propriedades de verdade sem gastar crédito: **Replit** ("Deterministic edits… don't consume AI credits") **[2ª]**, **Bolt** ("Making visual edits in the preview is free. Bolt uses tokens only when you save your changes") **[2ª]**, **Lovable** só para texto inline (100 edições grátis por 24 h) **[2ª]**. **Figma Make cobra crédito** até para mexer no painel ("Changes made with the properties panel use AI credits") **[2ª]**, mas o novo **Make no código local** "won't consume credits during beta" **[2ª]**. **v0** não diz **[2ª]**.
4. Ninguém dos "IA-first" tem alças de margem/padding arrastáveis no canvas como o **Webflow** (Option = lados opostos, Shift = todos) nem "de onde vem este estilo" como o **Webstudio** e o painel laranja/azul/rosa do Webflow. Os IA-first têm painel de números, não régua física.
5. Responsivo: os IA-first **não têm breakpoints na edição visual** (v0 "not available… on mobile viewports" **[2ª]**; Replit Visual Editor "currently available only on web browsers" **[2ª]**; Onlook sem mobile). Webflow (cascata bidirecional a partir do desktop), Framer (breakpoint herda do primário) e **Figma Sites** (breakpoint primário "cascade to the other breakpoints", secundário só a ele) **[2ª]** são a anterioridade séria.
6. "O que mudou": **v0** trata cada edição visual como **versão diffável** com Before/After antes de aplicar **[2ª]**. **Anima** mostra, antes de aplicar uma edição de texto, "the file and what will change" **[2ª]**. **Figma Make local** guarda cada mudança como **commit local** até abrir o PR e "the commit history helps you compare the before and after" **[2ª]**. **Replit** reverte também memória do agente, tarefas e banco (opcional). **Lovable** e **Bolt** avisam que reverter **não** volta o banco.
7. O **Cursor 3 tirou o painel de propriedades** do Design Mode e virou "clique + Cmd+L + descreva" (a doc de hoje não tem painel nenhum) **[2ª]**; o fórum reagiu com "cancel subscription territory. Bring back the tools." (cinco threads entre abr e ago/2026, confirmadas hoje) **[2ª]**. Lição: apontar-e-pedir **não substitui** manipulação direta; complementa.
8. **Claude Design** (Anthropic Labs, 17/04/2026, 1.235 pontos no HN) entrou no jogo com um mecanismo que ninguém tinha: **"custom sliders (made by Claude)"**, botões de ajuste que a própria IA fabrica para aquele design ("adjustment knobs to tweak spacing, color, and layout live"), mais comentário inline, edição de texto direta e "handoff bundle" para o Claude Code **[2ª]**. Reclamação forte: "lost access to my projects after unsubscribing" (302 pontos) **[2ª]**.
9. **Onlook** continua a anterioridade mais próxima do que o Theus quer (canvas infinito, arrastar div, camadas, chat com acesso ao código, código é a verdade), mas é **só Next.js + Tailwind**, sem mobile. O comentário mais votado do Show HN resume o desejo: "that Webflow-like ability to just click, edit, and see things getting updated in real-time, while always knowing I can drop into the code for more complex stuff" **[2ª]**.
10. **Bolt** tem o mecanismo mais elegante de custo: edições visuais entram num **lote** acima do chat, cada elemento mexido ganha um **marcador**, e só o "Save changes" gasta tokens e escreve o código; **um lote por página** **[2ª]**.
11. **Builder Code** e **Figma Make local** convergiram em 2026 para "o designer edita visualmente e sai um **pull request**": Builder com extensão Chrome que seleciona qualquer elemento "on your running site, localhost, and auth-walled pages", cursores ao vivo e permissões por arquivo (glob) **[2ª]**; Figma Make com branch, commits locais e link da branch para o colega **[2ª]**.
12. Ninguém combina: HTML puro como verdade + alças físicas + painel sem crédito + versão por gesto com antes/depois + **cor de quem mexeu em cada bloco** + projetar ao vivo para a sala + peça de backend ligada ao bloco da tela. Isso é a Bancada.

---

## 1. Lovable

**Fontes lidas**: https://docs.lovable.dev/features/preview-toolbar.md **[2ª]** · https://docs.lovable.dev/features/visual-edit · https://docs.lovable.dev/features/projects/history.md · https://docs.lovable.dev/features/projects/chat.md · https://docs.lovable.dev/features/drafts.md · https://docs.lovable.dev/features/code-mode.md · https://lovable.dev/blog/visual-edits · https://registry.npmjs.org/lovable-tagger **[2ª]** · https://unpkg.com/lovable-tagger/dist/index.js **[2ª]** · https://www.trustpilot.com/review/lovable.dev · HN via Algolia.

- **Nome mudou**: "The preview toolbar replaces the previous **Visual edits** experience. Instead of using a separate editing panel, choose a toolbar mode, point at what you want to change, and describe the update in plain language." **[2ª]** O "Dev Mode" hoje chama **Code mode**. "Point and ask" **não existe como nome na doc**; o equivalente é **Select elements**.
- **Quatro modos** da barra do preview, cada um com tecla **[2ª]**:
  - **Select elements** (`S`): clica no elemento, descreve a mudança; Cmd/Ctrl+clique seleciona vários; "Each selected element attaches to the project chat input as a reference, and your prompt applies to all of them". **Consome crédito.**
  - **Edit text inline** (`T`): "Click into any text on the page. Edit the text directly in place. Click **Send** and Lovable applies the change." (ainda passa pelo Lovable, mas sem prompt). **"Your account includes 100 free inline text edits… Each free edit becomes available again 24 hours after you use it. Your workspace also has a shared limit of 2,000 free inline text edits per 24 hours."**
  - **Draw annotation** (`D`): "sketch on top of your app preview and send the sketch as an image alongside a message"; freehand, linhas, setas, retângulos, círculos; "Rough shapes are recognized and cleaned up automatically". **Consome crédito.**
  - **Add a comment** (`C`): pino num elemento, thread, badge vermelho de não lidas; não gasta; mandar a thread ao Lovable gasta.
  - Um modo com trabalho inacabado **trava os outros**: "If you have unfinished work in the current mode, such as an unsent drawing or an unsaved text change, the other modes are not available until you send or discard your change." **[2ª]**
- **A barra é um objeto com corpo** **[2ª]**: começa "docked at the bottom center of the preview"; arrasta para qualquer lugar e "snaps to the corners"; minimiza a uma aba na borda; esconde; **"The toolbar remembers its state and position"**; tema **Auto**: "the toolbar adapts to what's behind it as you scroll, so it stays readable against any background". (Anterioridade direta para uma barra de edição sobre um site de qualquer cor.)
- **Fila sem espera** **[2ª]**: "You do not have to wait for one change to finish before starting the next." Pedidos com Select/Draw entram no trabalho atual; texto inline e comentários viram pedido próprio marcado **"Runs after the current task"**.
- **Dicas literais** **[2ª]**: "Point first, then describe."; "Keep prompts short when you've selected an element… 'Make this the primary color' is enough."; "Use Draw annotation for spatial changes."; imagens: "select it, attach a new image, or add an image URL, then describe the update".
- **Por baixo, em 2025** (blog, 13/03/2025): "each JSX component generated by our AI receives a unique, stable ID through our custom Vite plugin"; "We synchronize the project's code entirely into the browser, representing it as an Abstract Syntax Tree (AST)"; HMR ao salvar.
- **Por baixo, em 2026, confirmado no pacote npm `lovable-tagger` v1.3.3 (modificado em 15/07/2026, repositório `lovablelabs/lovable`, pasta `npm-packages/tagger`, descrição "Vite plugins for component tagging and virtual file overrides with HMR support")** **[2ª]**. O `dist/index.js` embute um runtime que **substitui o `react/jsx-dev-runtime`**: exporta um `jsxDEV(type, props, key, isStatic, source, self)` que, no navegador, injeta um **`ref`** em cada elemento; quando o nó monta, grava `node[Symbol.for("__jsxSource__")] = {fileName, lineNumber, columnNumber}` e registra o nó em `window.sourceElementMap`, um `Map` cuja chave é `"arquivo:linha:coluna"` e o valor um `Set` de **`WeakRef`** ao nó DOM. Comentário literal no código: "Only tag if this element doesn't already have source info (library components won't have it, user components will)". "During SSR, skip all tagging and pass through to React's jsxDEV". **Não escreve atributo `data-*` no DOM** (zero ocorrências no dist) e **não lê o fiber**: usa o `source` que o próprio JSX de desenvolvimento já passa. É a família (b) da seção 20.
- **Versões**: "There is no save button: version history is always complete and up to date"; clicar numa versão abre em modo snapshot, dá para ver **quais arquivos mudaram (diff)**; **Revert** com confirmação; **"Reverting restores your project's code only... It does not restore or roll back your database data"**; bookmarks; muito antigo: "Cannot revert this far back in history".
- **Chat**: cartões de atividade → Details view com "the full timeline of steps and file changes"; **"Undo latest edit: Reverse Lovable's most recent change in one click, with no confirmation"**; **Try to fix** (10 grátis); Build mode × Chat mode.
- **Drafts**: cópia isolada com chat e preview próprios; "Nothing you build in a draft reaches your project until you accept it"; **"A draft uses your project's real data"**.
- **Code mode**: "Editing and saving code yourself doesn't use credits"; plano grátis é "Read only"; "Each save becomes a version"; Git sync nos dois sentidos.
- **Reclamações**: Trustpilot 4,2/5 em 1.716 avaliações; "I ended up using like 70 credits making this website" (14/09/2026). HN: "Everyone non-technical I know who vibe coded either ran into a bug they couldn't fix or abandoned their project" (https://news.ycombinator.com/item?id=45190425); "generates React SPA's with no true backend" (…46357540); "caused huge problems for GitHub" (…47933162); "Excellent for front-end tweaks; click to edit anything. No real back-end story beyond Supabase." (…44367278).

## 2. v0 (Vercel)

**Fontes lidas**: https://v0.app/docs/design-mode.md **[2ª]** · https://v0.app/docs/design-mode · https://v0.app/docs/code-editing · https://v0.app/docs/llms.txt · HN via Algolia.

- **Ativar**: aba **Design** na barra do preview. "Design mode opens beside your running app and provides **layers, selection controls, and an editing panel**." **[2ª]** "Design mode is only available on chats that use the latest preview runtime, and only on the latest version of the chat. It is not available on read-only chats or **on mobile viewports**." **[2ª]**
- **Selecionar**: cursor vira ferramenta de seleção; hover destaca; clique mostra **alças de seleção** e o painel; **Inspect** / Cmd+I alterna entre selecionar e usar o app; Esc desmarca. **[2ª]**
- **Painel** (literal) **[2ª]**: "Typography: Font family, size, weight, line height, letter spacing, alignment, and text decoration. Color: Text color. Background: Background color. Layout: Margin and padding on all sides. Border: Border color, style, and width. Appearance: Opacity and corner radius. Shadow: Add or customize box shadows. Content: Directly edit the text content of an element." "Tweaks made in the panel are applied live in the preview… They're held as **pending edits** until you apply them."
- **Linguagem natural**: "For anything structural or hard to express in the panel — 'add a button next to this text', 'make this a three-column grid', 'match the style of the card above' — type a natural-language instruction into the text box in the design panel. **v0 automatically attaches a screenshot of the selected element**." **[2ª]** Dá para **combinar painel + instrução no mesmo elemento** antes de aplicar.
- **Iteração** **[2ª]**: Undo / Redo / Reset e **Before / after preview** ("Temporarily toggle off all pending edits so you can compare your changes with the original"). "If you try to navigate away while there are unapplied edits, v0 will warn you."
- **Aplicar** **[2ª]**: "v0 serializes your edits (and any instructions / screenshots), sends them to the chat, and generates an updated version… Because Apply produces a new chat version, you can review the diff, keep iterating, or revert"; **"every design-mode change is diffable, reviewable, and revertable"**. **Tailwind-aware**: "surfaces Tailwind-compatible values where possible. Class and token coverage depends on what's defined in your project."
- **Créditos**: a doc não diz se o Design Mode gasta → **não confirmado** **[2ª]**.
- **Editor de código**: "Toggle Diff View"; "Split Layout"; salvar/reset com Cmd+S.
- **Reclamações/uso**: frustra quando a IA reescreve código que não pediu (https://news.ycombinator.com/item?id=43960321); LLMs têm dificuldade com a "vibe" visual, não com a lógica (…47080578).

## 3. Bolt.new

**Fontes lidas**: https://support.bolt.new/building/visual-edits.md **[2ª]** · https://support.bolt.new/building/using-bolt/rollback-backup.md · https://support.bolt.new/llms.txt · HN via Algolia.

- **Fluxo em quatro passos, literal** **[2ª]**: "1: Click the Select tool to turn it on. 2: Click an element in the preview and make your edits… Click Add changes when you're done. 3: **A marker appears on each element you've added changes to.** 4: Your edits also collect in a batch above the chatbox. When you're ready, click Save changes."
- **Custo** **[2ª]**: **"Making visual edits in the preview is free. Bolt uses tokens only when you save your changes."** "We recommend saving edits in a batch, since it uses fewer tokens than sending each edit separately." "You can create and save **one batch of edits for each page**." Lote ≠ fila de prompts.
- **Seleção** **[2ª]**: "Bolt highlights each element as you hover"; **"use the arrow keys while hovering to move between elements. The up arrow moves to the element containing the one you're pointing at, and the down arrow moves back"**; Esc troca; **Cmd+clique seleciona um elemento dentro da seleção**.
- **Texto** **[2ª]**: duplo clique edita no preview; Cmd+B negrito; "Add changes" manda ao lote.
- **Barra de propriedades** **[2ª]**: aparece **embaixo do elemento**, tem alça (grip) para arrastar, e "shows only properties you can edit on that specific element". Propriedades: alt text (imagens), background color (todos), font size 8–96 px (texto), link (texto), list (texto), object fit cover/contain/fill/none (mídia), opacity 0–100 % (todos), poster (vídeo), text alignment (texto e containers), text style negrito/itálico/sublinhado/tachado, type color. Cores: **"The preset swatches show colors already used in your project"**, mais conta-gotas e HEX/RGB.
- **Aviso literal** **[2ª]**: "Toolbar properties don't cover every possible edit you could make to an element, and in some cases, editing a property doesn't make any visible change. For example, setting a background color on an icon changes the area behind the icon rather than the icon itself." Solução: "describe what you want in a prompt".
- **Versões**: backups automáticos ou manuais; "Version history is a timeline of changes"; renomear, favoritar, pré-visualizar antes de restaurar; **"Restoring to an earlier project version will not change your current Bolt or Supabase databases"**; sem diff visual na doc.
- **Reclamação**: prototipagem rápida mas "stalled" quando forçou o limite (https://news.ycombinator.com/item?id=47989460).

## 4. Replit (Design + Agent)

**Fontes lidas**: https://docs.replit.com/design/visual-editor.md **[2ª]** · https://docs.replit.com/design/refine.md · https://docs.replit.com/design/elements.md · https://docs.replit.com/design/design-vs-build.md · https://docs.replit.com/replitai/design-mode · https://docs.replit.com/learn/build-with-agent.md · https://docs.replit.com/core-concepts/agent/task-system.md.

- **Conceitos-chave, literais** **[2ª]**: "**Deterministic edits**: Simple changes (text, colors, spacing) apply directly to source code without an Agent loop"; "**No credit cost**: Direct edits don't consume AI credits — only complex changes route through Agent"; "**Dual context**: Works identically on canvas frames and in the Preview"; "**Source code sync**: Every edit updates the underlying source code instantly". Limite: "currently available only on **web browsers**. It is not supported on Mobile App or Desktop App."
- **Seleção** **[2ª]**: "The element gets a highlight with **a chip naming it**, and the Visual Editor panel opens on the right"; **Save edits** / **Discard**. "The properties shown match the element you select: text elements expose font controls, images expose the source and upload, and containers expose layout controls."
- **Layout, o painel mais completo lido entre os IA-first** **[2ª]**: seções **Text, Layout, Color, Border** (+ **Image**); Layout: "**Alignment**: A 3×3 dot picker"; "**Direction**: Two arrow buttons that stack children in a row or a column"; "**Gap**… The icon next to the gap input changes to match the current direction"; "**Distribute space between items**"; "**Outer space**: Per-side inputs… with a link toggle to lock all four sides"; "**Inner space**… with a link toggle for both axes". "The Layout section only appears when at least one layout control applies… so the editor stays compact."
- **Repetições** **[2ª]**: "Selecting an element rendered in a loop or reused across components highlights and updates **all instances at once**."
- **Ir ao código** **[2ª]**: "Click the top-left label on a selected element to jump to its location in the source code." Compostos: "Composite elements made up of multiple sub-elements can't be text-edited directly… Ask Agent in chat."
- **Cor** **[2ª]**: "Type a color name like 'purple' in the input field, or use the eyedropper".
- **Replit Design** (canvas): "infinite pan-and-zoom surface" com frames; "Design mockups look and feel like real pages, but they don't store data or connect to external services yet"; **Build…** entrega ao Agent "while keeping your design intact"; **Refine**: "Brief Agent like you'd brief a designer mid-review".
- **Checkpoints**: "Each checkpoint shows what changed, with 'Rollback here' and 'Changes' controls"; volta **"files, Agent memory, tasks, and a Database checkbox"**; tarefas em "isolated copies of your project" com Apply/Dismiss.
- Reclamações específicas de Design/Agent no HN: busca vazia → **não confirmado**.

## 5. Cursor Design Mode

**Fontes lidas**: https://cursor.com/docs/agent/design-mode.md **[2ª]** · https://cursor.com/docs/agent/design-mode · https://cursor.com/docs/llms.txt · https://cursor.com/changelog · https://forum.cursor.com/search.json?q="design mode" properties panel **[2ª]**.

- **Doc de hoje** **[2ª]**: "Design Mode lets you direct agents with visual prompts. From the browser in the Agents Window, you can click an element, draw on the page, or describe a change by voice." Toggle **Cmd+Shift+D**. Quatro jeitos: **Select an element** ("The agent gets the element and its code"), **Select multiple elements** ("make one match the other, remove repeated content, or adjust a group together"), **Draw on the page** ("The annotation sits over a **frozen frame of the viewport**, so the agent sees the exact page state you were responding to"), **Narrate by voice** ("The mic stays available while agents run"). Atalhos: Shift+arrastar = área; **Cmd+L = elemento ao chat**; Option+clique = elemento ao input.
- **O que o agente recebe** **[2ª]**: "**Element identity**: the xpath, the component, attributes, computed styles, and **props from the fiber tree**"; "**A screenshot**: the layout, surrounding elements, and the exact page state." (Nota: o fiber ainda carrega `props`; o que o React 19 tirou foi `_debugSource`, arquivo:linha. Por isso o Cursor entrega ao agente achar o arquivo.)
- **Fluxo** **[2ª]**: "Point at one element, describe the change, move to another part of the page, and send another edit before the first one finishes. This makes it easy to multitask and **manage several subagents at once**. As agents finish, the app hot reloads." Recomenda Composer 2.5.
- **A doc não tem painel de propriedades, undo nem diff** **[2ª]** → o que edita direto: **nada**; tudo passa pelo agente.
- **Fórum (Discourse), confirmado hoje pela busca `search.json`** **[2ª]**: "Removed the object selection properties panel in Cursor 3 agent window" (08/04/2026, …/157074); "Bring back the Design Sidebar, Why 'Design Mode' feels like a step backward" (23/04/2026, …/158818: "cancel subscription territory. Bring back the tools."); "New Design mode way of referencing is very cumbersome" (26/05/2026, …/161631: "you have to click on the html object, then do cmd+L"); "Please bring back the CSS Inspector+panel it was the best feature any designer needed" (17/07/2026, …/165970); "Bring back the Design Sidebar — visual HTML/CSS editing was a core part of Design Mode" (03/08/2026, …/167292); "Design Mode has stopped working!" (14/08/2026, …/168352). Pedidos: fixar comentários em vários elementos e mandar de uma vez (…/165284); bug de retângulo de hover impreciso com zoom (…/156586).
- **Lição**: apontar + descrever sem painel de manipulação direta foi sentido como regressão pelos designers; o pedido "vários comentários fixados, um envio só" foi atendido primeiro pelo **Figma Make local** ("Annotations… can reference many elements at once") **[2ª]**, não pelo Cursor.

## 6. Onlook ("the Cursor for designers")

**Fontes lidas**: https://github.com/onlook-dev/onlook · README raw · https://docs.onlook.com · …/getting-started/core-features · …/ui-overview · código: `packages/parser/src/ids.ts`, `packages/constants/src/editor.ts`, `packages/constants/src/dom.ts` (raw) · https://news.ycombinator.com/item?id=44127653 (Show HN, 408 pontos, 81 comentários) · https://hn.algolia.com/api/v1/items/44128635 **[2ª]**.

- **O que é**: "The design tool for AI-native designers"; open source; **só Next.js + TailwindCSS**; era Electron, virou web (CodeSandbox SDK, Freestyle, Supabase, Bun).
- **Pipeline (README)**: web container → serve → iframe → "Our editor reads and indexes the code from the container" → **"We instrument the code in order to map elements to their place in code"** → edita no iframe, depois no código.
- **Como mapeia, no código-fonte**: `ids.ts` percorre o AST (Babel) e injeta o atributo JSX `EditorAttributes.DATA_ONLOOK_ID` = **`'data-oid'`**, com id único (`generateUniqueOid` repete até não colidir). Outros atributos: `data-oiid`, `data-odid`, `data-ocname`, `data-onlook-inserted`, `data-onlook-dragging`, `data-onlook-drag-saved-style`, `data-onlook-drag-direction`, `data-onlook-drag-start-position`, `data-onlook-new-index`, `data-onlook-editing-text`, `data-onlook-dynamic-type`, `data-onlook-core-element-type`, `data-onlook-ignore`. `dom.ts` lista tags ignoradas (`SCRIPT, STYLE, LINK, META, NOSCRIPT`) e 60 containers só-inline.
- **Fundador no HN**: **"We map the HTML element in the iframe to the location in code. Then, when an edit is made, we simulate the change on the iframe and edit the code at the same time."**; foco em "infinite canvas and Figma-like experience".
- **Edição**: clique direito → "open up the exact location of the element in code"; **"Draw-in new divs and re-arrange them within their parent containers by dragging-and-dropping"**; Layers Panel; Style Editor (Tailwind visual); branches; colaboração em tempo real; Cmd+S, Cmd+Z.
- **Comentário mais citado do Show HN (itsNintu, 29/05/2025)** **[2ª]**: "I've tried other visual AI dev tools like Bolt or Lovable, but I feel like the walled-garden approach they've taken is a bit limiting… I've very much been missing that **Webflow-like ability to just click, edit, and see things getting updated in real-time, while always knowing I can drop into the code for more complex stuff**… a visual layer on top of the code, plus the inclusion of the in-browser code editor… feels like it could really cover some of that gap I want between design and dev." Fundador em resposta: "The visual layer has a lot of polish left to do to be a perfect design tool experience."
- **Críticas**: sem mobile; "why couple to Next/React and not HTML/CSS"; "all these ai apps use tailwind and react...so bloated"; "If I'm going to be impressed I need to see the hard things".

## 7. Claude Design (Anthropic Labs) — novo em 2026

**Fontes lidas** **[2ª]**: https://www.anthropic.com/news/claude-design-anthropic-labs (17/04/2026) · https://news.ycombinator.com/item?id=47806725 (1.235 pontos, 762 comentários) · https://samhenri.gold/blog/20260418-claude-design/ (HN …47818700, 387 pontos) · https://martinalderson.com/posts/figmas-woes-compound-with-claude-design/ (19/04/2026, HN …47832366) · https://news.ycombinator.com/item?id=48128003 ("Tell HN: Dont use Claude Design, lost access to my projects after unsubscribing", 302 pontos, 13/05/2026).

- **O que é**: "a new Anthropic Labs product that lets you collaborate with Claude to create polished visual work like designs, prototypes, slides, one-pagers, and more"; research preview para Pro, Max, Team e Enterprise.
- **Como edita** (literal): "you refine through **conversation, inline comments, direct edits, or custom sliders (made by Claude)** until it's right." "**Comment inline on specific elements, edit text directly, or use adjustment knobs to tweak spacing, color, and layout live.**" → o mecanismo inédito: a IA **fabrica os controles** para aquele design, em vez de um painel fixo.
- **Sistema de design**: "During onboarding, Claude builds a design system for your team by reading your codebase and design files"; "apply your team's design system to every project automatically".
- **Entrada e saída**: prompt, imagens, DOCX/PPTX/XLSX, "or point Claude at your codebase"; exporta Canva, PDF, PPTX, "standalone HTML files"; **"Handoff to Claude Code… Claude packages everything into a handoff bundle that you can pass to Claude Code with a single instruction."**
- **Colaboração**: link de leitura na organização ou "grant edit access so colleagues can modify the design and chat with Claude together in a group conversation".
- **Depoimento**: "Our most complex pages, which took 20+ prompts to recreate in other tools, only required 2 prompts in Claude Design."
- **Reclamações**: "I went back to my previous projects on claude design only to realize I don't have access to them anymore. This is a first. I never lost access to any of my past sessions because I unsubscribed in any of the LLM apps." (HN 48128003); comentário: "The bot decides the issue is solved and closes the ticket."
- **Leitura de designer (samhenri.gold)**: "LLMs were trained on code, not Figma primitives, so models never learned them."; "**Why fuss around in a lossy approximation of the thing when you can work directly in the medium where it will actually live?**"; Figma Make é "the only tool in this new landscape still pretending the design file is canonical"; previsão: ferramentas de design "forks into two distinct shapes" (exploração livre × trabalhar no código).
- **Leitura de mercado (Alderson)**: "Figma's reliance on non-designer seats made it uniquely exposed to AI"; LLMs "started to get fairly 'good' at design… not everything requires a great designer."

## 8. Figma Make, Figma Make no código local e Figma Sites

**Fontes lidas**: https://help.figma.com/hc/en-us/articles/31304412302231-Guide-to-Figma-Make · https://help.figma.com/api/v2/help_center/articles/42009840449175.json (Edit a Figma Make file) **[2ª]** · https://www.figma.com/blog/figma-make-now-on-your-local-code/ (28/05/2026) **[2ª]** · https://help.figma.com/api/v2/help_center/articles/35895705647127.json (Sites: breakpoints, blocks, preview; atualizado 12/09/2026) **[2ª]** · https://help.figma.com/api/v2/help_center/articles/31242824165143.json (code layers; atualizado 18/09/2026) **[2ª]** · https://www.figma.com/make/ · https://www.figma.com/sites/ · https://news.ycombinator.com/item?id=46728659 **[2ª]**.

- **Make, edição no preview** **[2ª]**: "Use the **edit tool** to point to specific parts of the preview in Make and make adjustments with a Figma Design-style properties panel"; "Use the **draw tool** to mark up the preview and add those areas to your prompts"; "Add **annotations**… to give the agent instructions for specific elements"; "Use the version history to edit earlier versions". "Drag your cursor or hold Shift while clicking to select multiple elements." "**The changes you make aren't committed until you click Apply.**" **"Changes made with the properties panel use AI credits." "Changes made with annotations use AI credits."** "The edit tool, properties panel, and annotations are only available in new Make files."
- **Make no código local (28/05/2026, beta limitado)** **[2ª]**: "the ability to work in your production codebase without leaving Figma"; "**Select elements, adjust properties, change layouts, colors, fonts, or sizing—the agent finds the relevant code and edits it** so the UI reflects what you designed"; "Use direct edits for changes you know you want to make"; "**Annotations give the agent contextual information, and can reference many elements at once.**"; "**Until you open a PR, your changes are stored as local commits.**"; "creating branches, reverting commits… your engineering team reviews your changes like any other pull request"; "Send a link, and once your teammate has access to your branch, they can check out your branch"; "**the commit history helps you compare the before and after**"; "won't consume credits during beta"; "designers who already have access to their company's codebase are best suited". Auto-crítica no texto: "We're still stuck in 2016 when it comes to collaboration."
- **Sites, breakpoints** **[2ª]**: "two types of breakpoints: Primary and secondary. **Primary breakpoint: Any changes you make to objects in the primary breakpoint cascade to the other breakpoints.** The Desktop breakpoint is the primary breakpoint by default. Secondary breakpoints: Changes made in a secondary breakpoint affect only that specific breakpoint."; "Set as primary breakpoint" no clique direito; "it's best to create all your breakpoints first before adding your designs"; blocos prontos.
- **Sites, code layers** **[2ª]**: "When you edit a code layer, you can either describe what you'd like to create with AI, or write React code yourself. Or both!"; "roll back to previous versions" no code composer; "**With code layers, you're accessing the power of Figma Make inside of Figma Sites.**"; "API keys should never be added to code layers".
- **Reclamação de aprisionamento** **[2ª]**: "Figma's API returns 400 for .make files, so I dug into the binary. Turns out it's a ZIP with a custom format: Deflate for the schema chunk, Zstandard for the data, then Kiwi binary decoding." (Show HN, 23/01/2026, 55 pontos). Comentário no HN sobre Claude Design: "I just feel forced to use Figma Make which stays in their walled garden without practical utility and connections to my actual codebases".

## 9. Builder.io (Visual Copilot → Builder Code)

**Fontes lidas**: https://www.builder.io/llms.txt **[2ª]** · https://www.builder.io/c/docs/fusion-projects-overview **[2ª]** · https://www.builder.io/blog/figma-to-code-visual-copilot. (`/c/docs/visual-copilot`, "Visual Editor Mode overview": link não achado → **não lido**.)

- **Builder Code / Projects** **[2ª]**: "Projects let anyone on your team—designers, PMs, developers—**create Pull Requests directly to your codebase using a visual editor that turns design changes into code**. Your code stays in your infrastructure with changes delivered through standard pull requests."
- **Extensão Chrome** **[2ª]**: "Connect directly to your running site, localhost, and auth-walled pages - **Select any element and make changes visually** - Push updates straight to your codebase - Capture any layout from the web and bring it into Builder with responsive structure intact".
- **Do editor local para o coletivo** **[2ª]**: "Start hard engineering work locally in Claude Code, Cursor, or VS Code, then push your branch to Builder… Designer opens the branch and sees live visual preview, makes pixel-level adjustments or prompts AI for changes… Everyone iterates on the branch while the engineer reviews the final diff".
- **Colaboração e permissões** **[2ª]**: "live cursors showing who's working where"; "Granular role-based access control (**designers can edit UI, not backend logic**)"; "**File-level permissions using glob patterns** for sensitive code"; "Design System Enforcement - Every generated change respects your component library and design tokens".
- **Visual Copilot** (Figma → código): modelo "trained with over 2 million data points" → compilador open source **Mitosis** → LLM para o framework/estilo do time; React, Vue, Svelte, Angular, Qwik, Solid, HTML.

## 10. Webflow: Designer e Webflow AI

**Fontes lidas**: https://help.webflow.com/hc/en-us/articles/33961243177875-Spacing-margin-and-padding · …/33961311094419-Classes · …/33961300305811 (breakpoints) · …/33961333856787 (box model) · https://help.webflow.com/api/v2/help_center/articles/38840145286035.json (AI site builder) **[2ª]** · …/34205154436243.json (AI Assistant) **[2ª]** · …/46332369065875.json (full-stack apps) **[2ª]** · HN via Algolia.

- **Alças físicas no canvas**: "Click and drag the padding or margin control on the side you want to adjust"; **Option/Alt** = lados opostos; **Shift** = quatro lados; PX, %, EM, VW, VH; Option+clique zera.
- **Classes**: "The moment you begin styling an element, a class is automatically created and applied"; combo class; **"The Affected elements indicator… displays a count of how many times the class has been used on the current page and across the site."**
- **De onde vem o estilo**: **laranja** = herdado; **azul** = da classe/tag/breakpoint atual; **rosa** = aplicado ao elemento selecionado no breakpoint atual.
- **Breakpoints**: 1920/1440/1280, Desktop base, Tablet ≤ 991, Mobile landscape ≤ 767, Mobile portrait ≤ 479. **"Styles cascade bidirectionally from the desktop breakpoint."**
- **AI site builder** **[2ª]**: "does not consume Webflow AI credits"; "can only be used when creating a brand-new site or editing an existing AI-generated site"; gera estrutura (páginas e seções) editável antes de gerar; "up to five pages initially"; "Edit prompt" regenera a estrutura; seções podem ser reordenadas, apagadas, duplicadas.
- **AI Assistant (gera seções no site existente)** **[2ª]**: "generate new page sections using your site's existing design system"; "**your site's classes and variables are automatically applied to the design**"; "**Classes created** and **Classes used** buttons"; "**can add classes and reuse existing ones, but it cannot update your existing classes**"; **Cmd+Z remove a geração e as classes dela**; limites: "doesn't include components, images, or dynamic data… can't generate individual elements".
- **Full-stack** **[2ª]**: apps geradas pelo Assistant com "Code / Preview toggle" e deploy no Webflow Cloud, sem crédito.
- **Reclamação**: Webflow "tends to fall apart with complexity"; classes quebram quando o designer mexe sem entender o CSS (https://news.ycombinator.com/item?id=41840353).

## 11. Framer

**Fontes lidas**: https://www.framer.com/academy/lessons/stacks · https://www.framer.com/academy/lessons/breakpoints · https://www.framer.com/features/ai/. (`/help/articles/how-to-use-stacks/`, `/help/llms.txt`: 404, **não lidos**.)

- **Stacks**: filhos em **posicionamento relativo**; "the longer text pushes the next item"; Fill/Fit. Atalho e reordenar arrastando: **não confirmado**.
- **Breakpoints**: "Framer creates another layout that inherits from the primary breakpoint."; **"Change only what the narrower layout needs, such as type size, Stack direction, gap, padding"**.
- **IA**: "creates editable pages, sections, copy, and visuals directly in your project"; **"Keep refining in the conversation, or take over on the canvas at any point."** A IA produz peças nativas do canvas, não HTML opaco.

## 12. Plasmic

**Fontes lidas**: https://docs.plasmic.app/learn/intro/ · …/technical-overview/ · …/app-hosting/. (`/learn/how-plasmic-works/`: 404 **[2ª]**, não lido.)

- **O Studio roda dentro do app do usuário**: "render a special `<PlasmicCanvasHost/>` component, which will bootstrap and run Plasmic Studio from within this page"; registra componentes de código com fidelidade total.
- **Duas saídas**: Headless API ou **codegen**; "Plasmic não hospeda seu site"; multiplayer, branching.

## 13. Google Stitch e o DESIGN.md

**Fontes lidas**: https://developers.googleblog.com/en/stitch-a-new-way-to-design-uis/ · https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-design-md/ **[2ª]** · https://raw.githubusercontent.com/google-labs-code/design.md/main/README.md **[2ª]** · https://news.ycombinator.com/item?id=47882713 (23/04/2026) **[2ª]** · https://stitch.withgoogle.com/ (só meta: "Stitch generates UIs for mobile and web applications, making design ideation fast and easy.") **[2ª]**.

- **Stitch**: prompt ou imagem (esboço, captura, wireframe); Gemini; "Your generated design can be seamlessly pasted to Figma"; código front-end; variantes. Edição de elemento no preview: **não confirmado** (app só em JS).
- **DESIGN.md (abr/2026)** **[2ª]**: "DESIGN.md in Stitch lets you export or import your design rules from project to project… Stitch understands the reasoning behind your design system"; "we're open-sourcing the draft specification for DESIGN.md, so it can be used across any single tool or platform." README: "A format specification for describing a visual identity to coding agents"; **"YAML front matter — Machine-readable design tokens"** + **"markdown prose… Prose tells them why those values exist"**; `npx @google/design.md lint` (valida tokens, **checa contraste WCAG**, devolve JSON) e `npx @google/design.md diff` (regressão token a token: added/removed/modified). Anterioridade direta para os tokens do Babel Coop conversarem com qualquer agente.

## 14. tldraw "make real"

**Fonte lida**: https://tldraw.substack.com/p/make-real-the-story-so-far.

- Desenho → imagem → modelo de visão → HTML num iframe no canvas; **iterar anotando por cima**: "marking up the website with notes and revisions, then sending it back as a new prompt"; **"We give it back the previous result's HTML, together with a note to 'fill in' the white box"**. Anterioridade do gesto "desenhar em cima do resultado" que Lovable, Cursor, Figma Make e Claude Design adotaram.

## 15. Relume

**Fonte lida**: https://www.relume.ai/.

- Brief → sitemap → wireframes → site; **"selects from components our designers built and maintain, then assembles them into your site"** (1.000+ componentes React); exporta para Figma, Webflow ("clean client-first classes") ou React (Tailwind + shadcn/ui); editar wireframe arrastando seções.

## 16. Wix Studio

**Fonte lida**: https://www.wix.com/studio/features. (**Não lidos** **[2ª]**: `support.wix.com/en/article/studio-editor-adding-and-managing-breakpoints`, `…-about-responsive-behaviors`, `…-about-breakpoints` e `wix.com/studio/responsive-design`, todos só em JS mesmo por proxy de leitura → dock/scale/breakpoints seguem **não confirmados**.)

- "Make sites instantly responsive in just a click of a button"; **"Design with pixels that are automatically converted to responsive units"**; IDE baseado em VS Code; "Edit your image on canvas by selecting the area and describing what you'd like instead"; multiplayer.

## 17. Squarespace Blueprint

**Fontes lidas**: https://support.squarespace.com/api/v2/help_center/articles/16282290976013.json ("Using Squarespace AI", atualizado 23/09/2026) **[2ª]** · https://support.squarespace.com/hc/en-us/articles/206545337-Choosing-the-right-template. (`squarespace.com/blueprint-ai`, `/ai-website-builder`: 404; `/websites/ai-website-builder` via proxy só devolveu navegação → **não lidos**.)

- **[2ª]** "There are three ways to create a site: **Blueprint AI Builder** - On the templates page, click Try Blueprint AI Builder to build a custom site template step-by-step. **Blueprint AI Templates** - select your site's topic… It then passes this information to our Blueprint AI Builder, and displays an example of what your site may look like." **Design Intelligence** = geração de texto em blocos, posts, produtos; ferramenta de alt text. Fluxo guiado: título, personalidade da marca, homepage, seções, paleta e par de fontes, imagens. Depois, edição no Fluid Engine.

## 18. Anima

**Fontes lidas**: https://docs.animaapp.com/llms.txt **[2ª]** · https://docs.animaapp.com/docs/preview.md **[2ª]** · …/version-history.md **[2ª]** · …/capture-elements.md **[2ª]** · https://www.animaapp.com/.

- **Barra do preview** **[2ª]**: Refresh; **Desktop / Mobile toggle**; Fullscreen; Pages dropdown; **Element Selector** ("Select any element in the preview to use it as context for your next chat prompt. Hold Shift and click to select multiple elements."); **Visual text edit** ("edit text content directly in the preview by clicking on any text element. **After making changes, a confirmation appears in the chat showing the file and what will change. Click Apply Changes to update the code, or Discard**").
- **Versões** **[2ª]**: "Anima creates a new version every time the AI makes changes… No manual saving needed."; preview de versão com banner "Viewing version:"; **"Your current state is saved automatically before restoring. The restored version appears at the top of the list marked with '(Restored)'. The original version stays in history, so nothing is lost."**; duplicar a partir de uma versão.
- **Capture Elements** **[2ª]**: "Capture any UI element from any website as real HTML"; "Unlike screenshots, captures include real HTML structure, CSS properties, and element hierarchy"; "Works on any site — login-protected pages, internal tools, localhost."
- Site: "Your best starting point isn't a plain prompt"; React/HTML com CSS, Tailwind ou inline.

## 19. Locofy

**Fonte lida**: https://www.locofy.ai/ (docs.locofy.ai não resolve DNS → **não lido**).

- "Built on Locofy's proprietary Large Design Models"; o usuário **marca (tag) elementos interativos** no Figma/Penpot; responsivo automático; React, Next, Vue, Angular, HTML/CSS; React Native, Flutter, SwiftUI, Compose.

## 20. Anterioridades de HTML puro: GrapesJS / Grapes Studio e Webstudio

**Fontes lidas**: https://grapesjs.com/docs/ · https://docs.webstudio.is/university/foundations.md · …/design-tokens.md · https://hn.algolia.com/api/v1/items/45449958 ("Show HN: Grapes Studio – HTML-first WYSIWYG website editor with LLM assistant", 02/10/2025) **[2ª]**.

- **GrapesJS**: Block Manager, Style Manager, Layer Manager, Device Manager, Trait Manager; exporta HTML/CSS.
- **Grapes Studio (autor do GrapesJS, artf)** **[2ª]**: "Instead of generating a full React app, **the editor outputs HTML/CSS and gives you both visual editing and AI assistance, so you're not stuck relying only on prompts for small changes.**" Cofundador: "What makes a big difference is **giving the model context about what the user is actually looking at (current page, selected section, etc.)**, so it doesn't have to guess." "we've taken the best parts of what folks like Lovable have created (one click deployment and chat to do anything), but built the drag and drop functionality into it".
- **Webstudio**: Token = "reusable style source that can contain multiple declarations and states"; "the rightmost token wins"; **passar o mouse no rótulo da propriedade mostra "which breakpoint and style source provides its current value"**.

## 21. Camada transversal: como o pixel vira código (cinco famílias)

**Fontes lidas**: `lovable-tagger` dist **[2ª]** · https://raw.githubusercontent.com/zh-lx/code-inspector/main/packages/core/src/shared/constant.ts · https://github.com/zh-lx/code-inspector · https://inspector.fe-dev.cn/en/guide/start.html · click-to-component `getReactInstancesForElement.js` e `getSourceForInstance.js` (raw) · https://github.com/ericclemmons/click-to-component/issues?q=react+19 · https://github.com/facebook/react/pull/28265 · https://www.locatorjs.com/ · Onlook `ids.ts` · Cursor design-mode.md **[2ª]** · Plasmic app-hosting.

| Família | Quem usa | Como | Estado em 2026 |
|---|---|---|---|
| **(a) Marcar no build (AST → atributo)** | Onlook (`data-oid` por Babel), code-inspector (`data-insp-path/row/col/node`), LocatorJS "Data-ID", Lovable em 2025 (plugin Vite com id por JSX) | o transformador escreve arquivo:linha:coluna (ou id) no elemento; o preview lê o atributo | viva; qualquer bundler; só em dev |
| **(b) Substituir o runtime de JSX em dev** **[2ª]** | **Lovable em 2026** (`lovable-tagger` 1.3.3) | exporta um `jsxDEV` próprio que injeta `ref`; no mount grava `node[Symbol("__jsxSource__")] = {fileName, lineNumber, columnNumber}` e `window.sourceElementMap` (`"arquivo:linha:coluna"` → `Set<WeakRef<nó>>`); SSR passa direto; não toca o DOM | viva; independe de `_debugSource`; exige React + jsx-dev-runtime |
| **(c) Inspecionar em runtime e deixar o agente achar** | Cursor (xpath + componente + atributos + estilos computados + **props do fiber** + captura) **[2ª]**, v0 (edições serializadas + captura do elemento → chat → versão), Lovable Select elements, Anima Element Selector, Grapes Studio ("current page, selected section") | sem instrumentação; a IA resolve onde está | viva; depende do modelo; foi sentida como regressão no Cursor |
| **(d) Simular no iframe e editar o código ao mesmo tempo** | Onlook | "we simulate the change on the iframe and edit the code at the same time" | viva; exige serializar cada gesto em Tailwind/JSX |
| **(e) Renderizar o próprio app dentro do editor** | Plasmic (`<PlasmicCanvasHost/>`) | o editor carrega o app real numa rota-host e registra componentes | viva; componentes de código com fidelidade total |
| **(morta) Ler `_debugSource` do fiber** | click-to-component, LocatorJS "DevTools" | `__reactFiber$…` → `_debugOwner` → `_debugSource` | **morta no React 19**: PR #28265 (07/02/2024) tirou `__self`/`__source`; issue #99 "React 19 unsuported"; issue #104 "use code-inspector instead" |

**Para HTML puro** (o protótipo do Babel Coop, `prototipo/editor.js`): nenhuma família é necessária; a posição no arquivo pode ser gravada por transformador nosso (princípio `data-insp-path`), e hoje o protótipo serializa o DOM inteiro (`serializar()` remove `data-bc-*` e devolve o `outerHTML`). O `CHECKLIST 11a` já prevê trocar por elemento → arquivo:linha. Para projetos React/Vite da equipe, o caminho (b) do `lovable-tagger` é o mais limpo: sem atributo no DOM, mapa em memória, `WeakRef` evita vazamento.

---

## 22. Tabela mental (o que cada um combina)

Legenda: ● tem · ◐ parcial · ○ não tem · ? não confirmado

| | Seleção → código | Painel direto (sem IA) | Custa crédito editar direto | Alças físicas no canvas | Arrastar/reordenar | Responsivo na edição visual | Pedido em português sobre o elemento | Desenhar por cima | Diff / antes-depois por edição | Desfazer | Reverte banco | Cor de quem mexeu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Lovable | ● (jsxDEV + WeakRef map) | ◐ só texto inline | ● (texto: 100 grátis/dia) | ○ | ◐ via prompt/desenho | ○ | ● | ● | ● diff por versão | ● 1 clique | ○ | ○ |
| v0 | ● (runtime + captura) | ● tipografia, cor, fundo, margem/padding, borda, opacidade, raio, sombra, texto | ? | ◐ alças de seleção | ○ | ○ (não roda em viewport móvel) | ● com captura automática | ○ | ● Before/After + versão diffável | ● Undo/Redo/Reset | ○ | ○ |
| Bolt | ● | ● cor, fonte 8–96, alinhamento, mídia, links, listas, opacidade | ○ (grátis até "Save changes"; um lote por página) | ○ | ○ | ○ | ● | ○ | ◐ marcador por elemento mexido, sem diff | ◐ versões | ○ (não volta Supabase) | ○ |
| Replit Design | ● (rótulo pula ao código) | ● texto, layout 3×3, direção, gap, distribuir, espaço interno/externo, cor, borda, imagem; todas as instâncias de um loop | ○ (determinístico, grátis) | ○ | ○ | ○ (só navegador web) | ● scoped ao elemento | ○ | ● "Changes" por checkpoint | ● Rollback here | ● (caixa Database) | ○ |
| Cursor | ◐ (xpath + estilos + props do fiber → agente) | ○ (removido no Cursor 3) | n/a | ○ | ○ | ○ | ● Cmd+L, voz | ● sobre frame congelado | ◐ diff do agente | ◐ | ○ | ○ |
| Onlook | ● (`data-oid` no AST) | ● Tailwind visual, layers | ○ (open source) | ◐ redimensiona/posiciona | ● arrasta div dentro do pai | ○ (sem mobile) | ● chat com código | ○ | ◐ código lado a lado | ● Cmd+Z | n/a | ○ |
| Claude Design | ◐ (HTML/prototipo próprio; handoff bundle) | ◐ texto direto + **knobs feitos pela IA** | ? | ○ | ○ | ? | ● comentário inline no elemento | ? | ◐ | ? | n/a | ○ |
| Figma Make (nuvem) | ● | ● cores, padding, margem, texto | ● (cobra até no painel) | ◐ | ○ | ○ | ● + anotações | ● | ◐ versões | ● | n/a | ○ |
| Figma Make (código local) | ● (agente acha o código) | ● propriedades, layout, cor, fonte, tamanho | ○ (grátis no beta) | ◐ | ○ | ○ | ● anotações em vários elementos, um envio | ● | ● commits locais, "before and after" | ● reverter commit | n/a | ○ |
| Builder Code | ● (extensão em qualquer site rodando) | ● | ? | ◐ | ● | ◐ | ● | ○ | ● PR com diff | ● | n/a | ◐ cursores ao vivo (não autoria por bloco) |
| Webflow | n/a (é a fonte) | ● tudo | n/a (IA grátis) | ● margin/padding com Option/Shift | ● | ● 7 breakpoints, cascata bidirecional, laranja/azul/rosa | ◐ IA gera seções com as classes do site | ○ | ◐ "Classes created/used" | ● Cmd+Z tira geração + classes | n/a | ○ |
| Framer | n/a | ● | n/a | ◐ | ● stacks | ● breakpoint herda do primário | ● (IA gera peças do canvas) | ○ | ○ | ● | n/a | ○ |
| Figma Sites | n/a | ● | n/a | ◐ | ● | ● primário cascateia, secundário local | ● code layers | ○ | ◐ rollback no code layer | ● | n/a | ○ |
| Webstudio | n/a | ● tokens | n/a | ◐ | ● | ● tokens valem em todos | ○ | ○ | ○ | ● | n/a | ○ |
| Plasmic | ● (app host) | ● | n/a | ◐ | ● | ● variantes por tela | ○ | ○ | ◐ branches | ● | n/a | ○ |
| Anima | ● (seleção como contexto) | ◐ texto direto | ? | ○ | ○ | ◐ toggle desktop/mobile | ● | ○ | ● "showing the file and what will change" antes de aplicar | ● versão por mudança da IA, "(Restored)" | n/a | ○ |
| Grapes Studio | ● (HTML é a fonte) | ● | ? | ○ | ● | ● | ● com "current page, selected section" | ○ | ○ | ● | n/a | ○ |
| tldraw make real | ○ (HTML opaco) | ○ | n/a | ○ | ○ | ○ | ● (anotação vira prompt) | ● | ○ | ○ | n/a | ○ |

**Coluna "cor de quem mexeu": ninguém.** Nenhum construtor lido pinta, na prévia, cada bloco com a cor de quem o criou ou mexeu por último; colaboração aparece como cursores (Onlook, Wix, Builder) ou comentários (Lovable, Claude Design), nunca como autoria por bloco. O protótipo do Babel Coop já faz isso (`data-por` + `box-shadow` na cor da pessoa em `editor.js`).

---

## 23. O que ninguém combinou (lista para a Bancada)

1. **Alças físicas de margem/padding (Webflow) dentro de um preview gerado por IA.** Os IA-first têm painel de números; o Webflow tem régua no canvas; ninguém tem os dois no site gerado.
2. **Edição direta grátis (Replit, Bolt) + lote com marcador por elemento (Bolt) + versão diffável com antes/depois por edição (v0) + "o arquivo e o que vai mudar" antes de aplicar (Anima).** Cada um tem um pedaço; ninguém junta os quatro.
3. **"De onde vem este estilo" (Webstudio; laranja/azul/rosa do Webflow) num site que a IA gerou.** Nenhum IA-first explica por que o botão está azul.
4. **Autoria por bloco na prévia (cor da pessoa)**: zero anterioridade. Combinar com a régua de versões (5.18) é inédito.
5. **Desfazer que também reverte banco, memória do agente e tarefas (Replit)** com aviso claro de que reverter código não reverte dados (Lovable, Bolt). A Máquina ao lado da Tela permite mostrar isso **visualmente**: a gaveta não volta, a tela volta.
6. **Vários comentários/anotações fixados em elementos, um envio só para o agente** (pedido nº 165284 no fórum do Cursor, atendido pelo Figma Make local) + **desenhar por cima de um frame congelado** (Cursor) + **fila "Runs after the current task"** (Lovable). Ninguém tem os três na mesma barra.
7. **Preview responsivo com breakpoint primário que cascateia (Figma Sites, Webflow, Framer) num site gerado por IA.** Lovable, v0 e Replit nem abrem o modo de edição em viewport móvel.
8. **Projetar o preview ao vivo para a sala (TV)** enquanto o agente edita: nenhum construtor tem "frente da sala"; colaboração é sempre entre janelas iguais.
9. **Peça de backend ligada ao bloco da tela** (a Tela do MAQUINA.md que "usa a porta X"): Replit separa Design de Build; Lovable/Bolt escondem o Supabase atrás do chat; Builder dá "designers can edit UI, not backend logic" como permissão, não como desenho; ninguém desenha o fio entre o formulário e a gaveta.
10. **HTML puro como formato-verdade** (GrapesJS/Grapes Studio, Webstudio, o protótipo do Babel Coop) com o gesto de "apontar e pedir" dos IA-first, sem exigir Next + Tailwind (a crítica ao Onlook: "so bloated").
11. **Controles fabricados pela IA para aquele design (Claude Design "custom sliders")** aplicados a um HTML de verdade com escrita no arquivo e versão: o Claude Design faz os knobs, mas o resultado é um protótipo exportado, não o site em produção.
12. **Tokens da identidade num arquivo que qualquer agente lê (DESIGN.md com lint de contraste e diff)** ligados à barra de edição: hoje o DESIGN.md serve à geração; ninguém o usa como "de onde vem este estilo" na hora de editar.

---

## 24. Armadilhas lidas nas fontes

- **Tirar o painel de manipulação direta para deixar só "apontar e pedir"** (Cursor 3): "cancel subscription territory"; "you have to click on the html object, then do cmd+L".
- **Cobrar crédito por mexer num slider** (Figma Make na nuvem): o usuário sente que paga para ajustar 4 px. Replit ("Deterministic edits") e Bolt (grátis até salvar) provam que dá para escrever no código sem IA; a própria Figma zerou o crédito no Make local.
- **Prometer que reverter volta tudo**: Lovable e Bolt precisaram escrever em negrito que o banco não volta. Replit resolve com uma caixa "Database" explícita.
- **Modo travando os outros** (Lovable): desenho inacabado impede trocar de ferramenta; precisa de saída óbvia (Esc = descarta).
- **Preview que não funciona no celular/viewport estreito** (v0, Replit, Onlook): a régua do ESTUDO_DESIGN_2030 exige alvo de 48 px no iPad; o modo de edição precisa nascer responsivo.
- **Acoplar a um framework** (Onlook só Next + Tailwind; `lovable-tagger` só React com jsx-dev-runtime): "why couple to Next/React instead of HTML/CSS?"; o Babel Coop já escolheu HTML como verdade da tela.
- **Ler o fiber do React para achar o arquivo**: morreu no React 19; mapeamento tem de ser por atributo no build, por runtime de JSX próprio, ou por HTML puro.
- **Serializar o DOM inteiro a cada gesto** (protótipo atual): funciona para HTML pequeno, mas perde comentários, formatação e a autoria por linha do git; o CHECKLIST 11a (elemento → arquivo:linha) é o caminho.
- **Editar uma propriedade que "não faz nada visível"** (Bolt: fundo de ícone pinta a área atrás): o painel deve mostrar só o que aquele elemento aceita (Bolt e Replit fazem: "shows only properties you can edit on that specific element"; "The Layout section only appears when at least one layout control applies").
- **Demos só com mudanças fáceis**: "If I'm going to be impressed I need to see the hard things" (HN sobre o Onlook). Mostrar "põe em duas colunas" e "troca o herói de lugar", não só "muda a cor".
- **Rascunho usa o banco de verdade** (Lovable drafts): testar numa cópia da tela mas gravar em produção é o erro que a regra 2 do MAQUINA.md já proíbe.
- **Retângulo de seleção errado com zoom** (bug 156586 do Cursor): a camada de seleção precisa usar `getBoundingClientRect` no frame certo e recalcular no zoom, principalmente no modo 3D (5.19).
- **Perder o trabalho ao sair do plano** (Claude Design: "lost access to my projects after unsubscribing") e **formato fechado** (Figma Make: ".make files… ZIP with a custom format"): o Babel Coop guarda HTML e código na pasta da pessoa; nada disso pode existir aqui.
- **IA que cria classes mas não pode mexer nas existentes** (Webflow AI Assistant): honesto, mas gera acúmulo; a Bancada precisa de "Classes created / used" ou equivalente para HTML puro (quais regras CSS a mudança tocou).

---

## 25. O que isso diz para a Bancada (sem antecipar o conceito)

- O gesto **já é linguagem comum** (apontar + português; desenhar por cima; anotar vários e mandar de uma vez): não gastar novidade nele (régua 7 do estudo: imposto da novidade). A novidade fica em **como a Bancada mostra o que mudou** (versão por gesto, antes/depois no peek M7, cor da pessoa no bloco, "o arquivo e o que vai mudar" antes de aplicar) e em **como a Tela e a Máquina se olham** (o fio entre formulário e gaveta).
- Três degraus que a anterioridade sustenta e que cabem na régua: **1)** manipulação direta sem agente (texto, mover, duplicar, apagar, margem/padding com alças, cor por token), grátis e instantânea, escrevendo no HTML, com marcador no bloco mexido (Bolt) e lote que vira uma versão (v0); **2)** o que não mapeia direto vira **pedido em português com o elemento anexado** (várias anotações num envio só, fila que não espera o agente terminar); **3)** tudo vira **versão com antes/depois** e a **cor de quem fez**, e "Projetar na TV" leva a mesma prévia à sala.
- Formato: HTML puro é a verdade (GrapesJS/Grapes Studio, Webstudio), com a posição no arquivo gravada por transformador nosso (princípio `data-insp-path`); para projetos React/Vite da equipe, o princípio do `lovable-tagger` (runtime de JSX próprio + mapa em memória com `WeakRef`), sem atributo no DOM.
- A barra de edição pode ser um **objeto com corpo** (Lovable: encaixa nos cantos, lembra a posição, tema Auto que lê o fundo) — cabe na régua de "materialidade" do estudo sem virar enfeite.
- Os **tokens da identidade** podem viver num DESIGN.md (formato aberto do Google, com lint de contraste e diff) que o agente lê ao gerar e a Bancada lê ao explicar "de onde vem este estilo".

---

## 26. Fontes

### Lidas na segunda passada (23/09/2026, ~08:40, curl direto) **[2ª]**
- https://docs.lovable.dev/features/preview-toolbar.md
- https://registry.npmjs.org/lovable-tagger
- https://unpkg.com/lovable-tagger/dist/index.js
- https://v0.app/docs/design-mode.md
- https://cursor.com/docs/agent/design-mode.md
- https://forum.cursor.com/search.json?q=%22design%20mode%22%20properties%20panel%20order%3Alatest
- https://support.bolt.new/building/visual-edits.md
- https://docs.replit.com/design/visual-editor.md
- https://help.figma.com/api/v2/help_center/articles/42009840449175.json
- https://help.figma.com/api/v2/help_center/articles/35895705647127.json
- https://help.figma.com/api/v2/help_center/articles/31242824165143.json
- https://www.figma.com/blog/figma-make-now-on-your-local-code/
- https://www.anthropic.com/news/claude-design-anthropic-labs
- https://samhenri.gold/blog/20260418-claude-design/
- https://martinalderson.com/posts/figmas-woes-compound-with-claude-design/
- https://hn.algolia.com/api/v1/items/47806725 · …/47818700 · …/48128003 · …/47832366 · …/47882713 · …/48309217 · …/46728659 · …/45450183 · …/45449958 · …/44128635
- https://hn.algolia.com/api/v1/search?query=Claude%20Design&tags=story (e "Figma Make", "Replit design mode", "Google Stitch", "Onlook")
- https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-design-md/
- https://raw.githubusercontent.com/google-labs-code/design.md/main/README.md
- https://stitch.withgoogle.com/ (só meta)
- https://www.builder.io/llms.txt
- https://www.builder.io/c/docs/fusion-projects-overview
- https://help.webflow.com/api/v2/help_center/articles/38840145286035.json
- https://help.webflow.com/api/v2/help_center/articles/34205154436243.json
- https://help.webflow.com/api/v2/help_center/articles/46332369065875.json
- https://support.squarespace.com/api/v2/help_center/articles/16282290976013.json
- https://docs.animaapp.com/llms.txt
- https://docs.animaapp.com/docs/preview.md
- https://docs.animaapp.com/docs/version-history.md
- https://docs.animaapp.com/docs/capture-elements.md

### Lidas na primeira passada (23/09/2026, 08:00, WebFetch)
- https://docs.lovable.dev/features/visual-edit · …/projects/history.md · …/projects/chat.md · …/drafts.md · …/code-mode.md · https://docs.lovable.dev/llms.txt · https://lovable.dev/blog/visual-edits · https://www.trustpilot.com/review/lovable.dev
- https://news.ycombinator.com/item?id=45190425 · …46357540 · …47933162 · …44367278 · …43960321 · …47080578 · …47989460 · …44127653 · …41840353
- https://v0.app/docs/design-mode · https://v0.app/docs/code-editing · https://v0.app/docs/llms.txt · https://v0.app/docs
- https://support.bolt.new/building/using-bolt/rollback-backup.md · https://support.bolt.new/llms.txt
- https://docs.replit.com/design/refine.md · …/design/elements.md · …/design/design-vs-build.md · https://docs.replit.com/replitai/design-mode · https://docs.replit.com/learn/build-with-agent.md · https://docs.replit.com/core-concepts/agent/task-system.md · https://docs.replit.com/llms.txt
- https://cursor.com/docs/agent/design-mode · https://cursor.com/docs/llms.txt · https://cursor.com/changelog
- https://forum.cursor.com/t/removed-the-object-selection-properties-panel-in-cursor-3-agent-window/157074 · …/bring-back-the-design-sidebar-why-design-mode-feels-like-a-step-backward/158818 · …/new-design-mode-way-of-referencing-is-very-cumbersome/161631 · …/please-bring-back-the-css-inspector-panel-it-was-the-best-feature-any-designer-needed/165970 · …/bring-back-the-design-sidebar-visual-html-css-editing-was-a-core-part-of-design-mode/167292 · …/design-mode-pin-comments-on-many-elements-then-submit-once-into-plan-mode/165284 · …/design-mode-inaccurate-rectangle-of-mouse-hover-over-elements/156586 · …/design-mode-has-stopped-working/168352 · …/when-you-submit-a-design-mode-comment-design-mode-breaks/169733
- https://github.com/onlook-dev/onlook · https://raw.githubusercontent.com/onlook-dev/onlook/main/README.md · https://docs.onlook.com · …/getting-started/core-features · …/getting-started/ui-overview · https://raw.githubusercontent.com/onlook-dev/onlook/main/packages/parser/src/ids.ts · …/packages/parser/src/helpers.ts · …/packages/constants/src/editor.ts · …/packages/constants/src/dom.ts
- https://help.webflow.com/hc/en-us/articles/33961243177875-Spacing-margin-and-padding · …/33961311094419-Classes · …/33961300305811 · …/33961333856787
- https://www.framer.com/academy/lessons/stacks · …/breakpoints · https://www.framer.com/features/ai/
- https://docs.plasmic.app/learn/intro/ · …/technical-overview/ · …/app-hosting/
- https://www.builder.io/blog/figma-to-code-visual-copilot
- https://help.figma.com/hc/en-us/articles/31304412302231-Guide-to-Figma-Make · https://help.figma.com/hc/en-us/articles/42009840449175-Edit-a-Figma-Make-file · https://www.figma.com/make/ · https://www.figma.com/sites/
- https://developers.googleblog.com/en/stitch-a-new-way-to-design-uis/
- https://tldraw.substack.com/p/make-real-the-story-so-far
- https://www.relume.ai/ · https://www.wix.com/studio/features · https://support.squarespace.com/hc/en-us/articles/206545337-Choosing-the-right-template · https://www.animaapp.com/ · https://www.locofy.ai/
- https://grapesjs.com/docs/ · https://docs.webstudio.is/university/foundations.md · …/foundations/design-tokens.md
- https://raw.githubusercontent.com/zh-lx/code-inspector/main/packages/core/src/shared/constant.ts · https://github.com/zh-lx/code-inspector · https://inspector.fe-dev.cn/en/guide/start.html · https://raw.githubusercontent.com/ericclemmons/click-to-component/main/packages/click-to-react-component/src/getReactInstancesForElement.js · …/getSourceForInstance.js · https://github.com/ericclemmons/click-to-component/issues?q=react+19 · https://github.com/facebook/react/pull/28265 · https://www.locatorjs.com/

### Não lidas (403/404/JS/CAPTCHA/DNS)
https://cursor.com/docs/design-mode · https://docs.lovable.dev/features/dev-mode (renomeado) · https://support.bolt.new/building/visual-editor · https://docs.onlook.com/llms.txt (devolve o shell HTML do app) · https://www.framer.com/help/articles/how-to-use-stacks/ · https://www.framer.com/help/llms.txt · https://docs.plasmic.app/learn/how-plasmic-works/ (404) · https://www.builder.io/blog/introducing-visual-copilot · https://www.builder.io/c/docs/visual-copilot · https://www.builder.io/c/docs/fusion-overview (404) · "Visual Editor Mode overview" do Builder (link não achado) · https://help.figma.com/hc/en-us/articles/31304519006999 (RecordNotFound; os artigos de Sites lidos estão acima) · https://stitch.withgoogle.com/ (app só em JS) · https://www.squarespace.com/blueprint-ai · https://www.squarespace.com/ai-website-builder · https://www.squarespace.com/websites/ai-website-builder (só navegação) · https://docs.locofy.ai/ (DNS) · https://raw.githubusercontent.com/tldraw/make-real/main/README.md (só aponta para o blog) · support.wix.com (breakpoints, responsive behaviors, about breakpoints: só JS mesmo via proxy) · https://www.wix.com/studio/responsive-design · G2 (CAPTCHA) · Reddit (403) · DuckDuckGo (CAPTCHA) · WebSearch (orçamento 200/200 esgotado nas duas passadas).
