# A mecânica por baixo da edição visual em HTML/CSS puro — notas completas

> Frente `tela-mecanica-da-edicao` da missão `babel-coop/design-2030`. Data: 23/09/2026.
> Pergunta: como fazer a Tela (o "super Lovable" do 5.18 do IDEIAS.md) em JS puro, sem build, de modo que mover, redimensionar, trocar texto, cor e imagem na prévia mude o código de verdade, e que "apontar e pedir" mande o elemento certo ao agente.
> Método (revisão 1, manhã): WebFetch nas fontes primárias; `curl` para o JSON oficial do Chrome DevTools Protocol (v1.3), a página de parsing do HTML Standard, o registro npm (versão e licença) e a CDN jsdelivr (peso bruto e gzip, medidos hoje). O orçamento de WebSearch da sessão já estava esgotado (200/200) e o bundlephobia devolveu 429; por isso os pesos vêm da jsdelivr.
> Revisão 2 (23/09/2026, segunda passada, seção 18): WebSearch continuou esgotado (200/200); tudo por WebFetch direto e `curl` (JSON oficial do CDP, browser-compat-data do MDN, registro npm, jsdelivr). Novos fatos, correções de peso, anterioridades que a rodada 1 não olhou (Pinegrow, Chrome DevTools Workspaces e AI assistance, Cursor Design Mode, Figma Make) e APIs novas (CSS Custom Highlight, View Transitions, EditContext, CSS Typed OM).
> Legenda: **[CONFIRMADO]** lido na fonte primária · **[PARCIAL]** a fonte confirma parte · **[NÃO LIDO]** a página não abriu (403/404/JS) · **[MÉTODO PRÓPRIO]** receita nossa, sem fonte externa, derivada dos fatos confirmados.

Contexto lido antes de pesquisar: `docs/MAQUINA.md`, `prototipo/editor.js` (o script `VISUAL` injetado no iframe: clique seleciona, pointer arrasta com marca antes/depois, duplo clique põe `contenteditable`, Delete apaga, `serializar()` clona o `documentElement`, tira os atributos `data-bc-*` e manda o HTML inteiro por `postMessage`), `prototipo/maquina.js`, `prototipo/explorador.js`, `IDEIAS.md` 5.17–5.19 e 15, `CHECKLIST.md` 11a ("mapeamento elemento → arquivo:linha por transformação nossa"), `docs/ESTUDO_DESIGN_2030.md` (régua de 10 pontos, M1–M8, "nada anima sem dado", ≤ 2 sinais vivos por tela) e `stack-video-scroll/PROMPT_AGENTICO_LP.md`.

---

## 0. O que muda em relação ao protótipo (resumo antes dos achados)

O protótipo v16 edita na tela **serializando o DOM vivo do iframe** e gravando o `outerHTML` inteiro. Funciona para demonstrar, mas no app real isso perde a formatação do arquivo, normaliza atributos, grava o que os scripts da página mudaram e não sabe dizer "esse `<h1>` está na linha 42". A pesquisa confirma três caminhos, do mais simples ao mais forte, e eles se somam:

1. **Posições de código no HTML puro** com um parser que dá `startOffset/endOffset` por nó e por atributo (parse5), injetadas na cópia servida como `data-loc`, e **patch textual por offset** (magic-string) para o arquivo mudar só onde a pessoa mexeu.
2. **Camada de edição de estilos por folha construída** (`adoptedStyleSheets`) e **tokens** (`--custom-properties`) durante a edição; só no salvar o CSS do arquivo recebe o patch (css-tree dá `loc` por nó, ou, no Electron, o CDP dá o `range` da regra de graça).
3. **No Electron, o Chrome DevTools Protocol** (`webContents.debugger`) entrega pronto o que Figma/Framer reconstroem à mão: overlay de box model com cores, modo "inspecionar" com evento de nó, `getMatchedStylesForNode` com `styleSheetId` + `range` (linha e coluna da regra no arquivo), `getBoxModel`, `setStyleTexts`, `setOuterHTML`, `moveTo`, `undo`.

---

## 1. Mapear elemento → arquivo:linha em HTML puro

### 1.1 parse5: posições por nó e por atributo [CONFIRMADO]

- Opção `sourceCodeLocationInfo`: "Enables source code location information. When enabled, each node (except the root node) will have a `sourceCodeLocation` property." "If the node is not an empty element, `sourceCodeLocation` will be a ElementLocation object, otherwise it will be Location." — https://parse5.js.org/interfaces/parse5.ParserOptions.html
- Campos de `ElementLocation` (herda `LocationWithAttributes`): `startLine` ("One-based line index of the first character"), `startCol`, `startOffset` ("Zero-based first character index"), `endLine`, `endCol` e `endOffset` ("Points directly _after_ the last character"), `attrs` ("Start tag attributes' location info"), `startTag` ("Element's start tag location info"), `endTag` ("Element's end tag location info. This property is undefined, if the element has no closing tag."). — https://parse5.js.org/interfaces/parse5.Token.ElementLocation.html
- É "WHATWG HTML Living Standard (aka HTML5)-compliant" e "parses HTML the way the latest version of your browser does"; usado por "jsdom, Angular, Lit, Cheerio, rehype and many more"; MIT. O README fala em "for Node.js" e não diz "browser". — https://github.com/inikulin/parse5
- **Verificação própria de que roda no navegador**: o bundle ESM da jsdelivr (`https://cdn.jsdelivr.net/npm/parse5/+esm`, parse5 8.0.1, 128.620 bytes brutos, 26.533 gzip) tem zero `require(`, zero `node:` e zero `process.env`; só importa `entities@8.0.0` (decode/escape). Ou seja: é JS puro, cabe num `<script type="module">` sem build.
- Consequência para a Tela: texto também tem posição ("each node (except the root node)"), então trocar o texto de um `<h1>` vira um patch no intervalo `[startOffset, endOffset)` do nó de texto, sem tocar em mais nada do arquivo; trocar `src` de uma imagem vira patch no intervalo do atributo (`attrs.src`).

### 1.2 htmlparser2: mais leve, menos fiel [CONFIRMADO]

- Opções do domhandler: `withStartIndices` ("Add `startIndex` to each node") e `withEndIndices` ("Add `endIndex` to each node"). MIT. Benchmark do próprio README: "htmlparser2 : 2.17215 ms/file"; ele "takes some shortcuts to get there" (não é spec-compliant). — https://github.com/fb55/htmlparser2
- Bundle ESM jsdelivr (12.0.0): 27.233 bytes / 6.766 gzip; importa domhandler, domutils, domelementtype e entities; o bundle contém `startIndex` (15 ocorrências). Sem `require`/`node:`.
- Uso: re-parse barato a cada patch para recalcular offsets (2 ms por arquivo no benchmark deles); para a árvore "de verdade" (como o navegador monta), parse5.

### 1.3 unist/hast: o formato de posição que o ecossistema rehype já usa [CONFIRMADO]

- "Position represents the location of a node in a source file." `Position { start: Point, end: Point }`, `Point { line >= 1, column >= 1, offset >= 0 }`; "The position field must not be present if a node is generated." — https://github.com/syntax-tree/unist
- rehype-parse (9.0.1, MIT) é parse5 por baixo; bundle de entrada de 655 bytes na jsdelivr (o peso real está em hast-util-from-html → parse5).

### 1.4 Como os inspetores de framework fazem (o `data-loc` injetado) [CONFIRMADO]

- vite-plugin-vue-inspector: "records source locations from Vue's compiled render output with Vite source maps" e usa "dev-only `data-v-inspector` DOM markers as a fallback"; `Command+Shift` liga o modo, clique abre o editor (`launchEditor`). — https://github.com/webfansplz/vite-plugin-vue-inspector
- react-dev-inspector: plugin que "records source path info into React components during development stage"; o `<Inspector/>` "reads the source info, and sends it to the dev-server"; o middleware "call your local IDE/Editor to open the source file". — https://github.com/zthxxx/react-dev-inspector
- **Onlook** (Apache 2.0, Next.js + Tailwind): "we inject an attribute into the DOM elements at build-time that points back to the code like a sourcemap. The attribute gives us the location of the code block, and the component scope." Edição: "we then find the code, parse it into an AST, inject the styles, then write it back." E: "All the changes made are stored as actions. This allows them to be serialized, stored, and reproduced." — https://docs.onlook.com/developers/architecture · https://github.com/onlook-dev/onlook ("We instrument the code in order to map elements to their place in code.")
- Tradução para HTML puro (sem build) [MÉTODO PRÓPRIO]: a Estação, ao abrir `tela.html`, faz `parse5.parse(texto, {sourceCodeLocationInfo:true})`, percorre a árvore e **serve uma cópia** em que cada elemento ganha `data-bc-loc="startOffset-endOffset"` (e, opcionalmente, `data-bc-ln="linha:coluna"` para o cartão da pessoa). O arquivo no disco não muda. Quando a pessoa mexe, a camada de edição conhece o intervalo exato do elemento, do texto ou do atributo, e gera um patch; o arquivo novo é re-parseado e a cópia servida é regenerada. O inspetor do Vite faz o mesmo, só que no build.

### 1.5 Patch textual por offset em vez de reescrever o arquivo [CONFIRMADO]

- magic-string (1.4.1, MIT): "a small, fast utility for manipulating strings and generating sourcemaps"; `update()/overwrite()/appendLeft()/prependRight()/remove()` "track changes by character offset in the original string"; motivação: "make some light modifications to it—replacing a few characters here and there". 29.087 bytes / 8.594 gzip na jsdelivr. — https://github.com/rich-harris/magic-string
- Para o Babel Coop isso é o que preserva a indentação, os comentários e o estilo de quem escreveu: o `<h1>` da linha 42 continua na linha 42 com o mesmo recuo; só o texto entre as tags muda. Um `String.prototype.slice` resolve o caso simples; magic-string vale quando há vários patches na mesma passada (ele recalcula os offsets).

### 1.6 O limite da serialização do DOM (o que o protótipo faz hoje) [CONFIRMADO]

- HTML Standard, "Serializing HTML fragments": "It is possible that the output of this algorithm, if parsed with an HTML parser, will not return the original tree structure. Tree structures that do not roundtrip a serialize and reparse step can also be produced". Atributos saem sempre entre aspas duplas, com o valor "escaped as described below in attribute mode". — https://html.spec.whatwg.org/multipage/parsing.html#serialising-html-fragments
- MDN `outerHTML`: "Getting the property returns a string containing an HTML serialization of the `element` and its descendants"; `&` vira `&amp;` e "Some browsers also serialize the `<` and `>` characters as `&lt;` and `&gt;` when they appear in attribute values… to prevent a potential security vulnerability (mutation XSS)". — https://developer.mozilla.org/en-US/docs/Web/API/Element/outerHTML
- O que isso significa para a Tela (análise própria sobre o `serializar()` do `editor.js`): (a) a indentação, as quebras de linha e as aspas simples do autor somem; (b) tudo que um `<script>` da própria página inseriu no DOM (um contador, um menu montado por JS) é gravado como se fosse HTML de origem e duplica na próxima abertura; (c) `<template>`, entidades e atributos booleanos são normalizados; (d) `git diff` mostra o arquivo inteiro mudado, e a "cor por pessoa" (5.18) perde a granularidade. Com posições (1.4) o diff é só a linha mexida.
- E o motivo de o protótipo precisar de `postMessage`: o iframe usa `srcdoc` + `sandbox="allow-scripts"`. MDN: sem `allow-same-origin` "the resource is treated as being from a special origin that always fails the same-origin policy"; e "it is strongly discouraged to use both `allow-scripts` and `allow-same-origin`, as that lets the embedded document remove the `sandbox` attribute". Ou seja: no navegador, ou a camada de edição roda dentro do iframe (como hoje) ou a página é servida da mesma origem sem sandbox. No Electron, o caminho é o CDP (1.7). — https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe

### 1.7 No Electron: o Chrome DevTools Protocol já mapeia CSS → arquivo:linha [CONFIRMADO]

Lido no JSON oficial `browser_protocol.json` (versão 1.3), https://raw.githubusercontent.com/ChromeDevTools/devtools-protocol/master/json/browser_protocol.json:

- `CSS.getMatchedStylesForNode(nodeId)`: "Returns requested styles for a DOM node identified by `nodeId`." Devolve `inlineStyle`, `attributesStyle`, `matchedCSSRules` ("CSS rules matching this node, from all applicable stylesheets", array de `RuleMatch`), `pseudoElements`, `inherited` ("A chain of inherited styles (from the immediate node parent up to the DOM tree root)"), `cssKeyframesRules`, `cssPropertyRules`, `cssPropertyRegistrations` (as `@property`), entre outros.
- `CSSRule`: `styleSheetId` ("absent for user agent stylesheet"), `selectorList`, `nestingSelectors`, `origin`, `style`, `media` ("The array enumerates media queries starting with the innermost one, going outwards"), `containerQueries`, `supports`.
- `CSSStyle`: `styleSheetId`, `cssProperties`, `shorthandEntries` ("Computed values for all shorthands found in the style"), `cssText`, `range` ("Style declaration range in the enclosing stylesheet (if available)").
- `SourceRange`: "Text range within a resource. All numbers are zero-based." `startLine`, `startColumn` ("inclusive"), `endLine`, `endColumn` ("exclusive").
- `StyleSheetOrigin`: enum `injected`, `user-agent`, `inspector`, `regular` ("regular" for regular stylesheets).
- `CSS.setStyleTexts(edits[])`: "Applies specified style edits one after another in the given order." Devolve `styles` ("The resulting styles after modification"). Há ainda `nodeForPropertySyntaxValidation` para validar `var()` contra as `@property` do nó.
- `DOM.getNodeForLocation(x, y, ignorePointerEventsNone?)`: "Returns node id at given location" → `backendNodeId` e `frameId`.
- `DOM.setOuterHTML(nodeId, outerHTML)`: "Sets node HTML markup, returns new node id." `DOM.moveTo(nodeId, targetNodeId, insertBeforeNodeId?)`: "Moves node into the new container, places it before the given anchor." `DOM.undo`: "Undoes the last performed action." `DOM.markUndoableState`: "Marks last undoable state."
- Electron: `webContents.debugger.attach([protocolVersion])` ("Attaches the debugger to the `webContents`."), `debugger.sendCommand(method[, commandParams, sessionId])` ("Send given command to the debugging target."), evento `'message'` com `method` e `params`. — https://www.electronjs.org/docs/latest/api/debugger
- Aviso importante: a doc do `<webview>` diz "We currently recommend to not use the `webview` tag and to consider alternatives, like `iframe`, a `WebContentsView`, or an architecture that avoids embedded content altogether" (o webview "is undergoing dramatic architectural changes"). O `<webview>` ainda expõe `getWebContentsId()`, `inspectElement(x, y)`, `executeJavaScript`, `sendInputEvent`, `capturePage([rect])`. — https://www.electronjs.org/docs/latest/api/webview-tag
- `WebContentsView` (a alternativa): "displays a WebContents"; `win.contentView.addChildView(view1)`; `view1.setBounds({ x, y, width, height })`; propriedade `webContents` ("Use this to interact with the `WebContents`"), logo com `.debugger`. — https://www.electronjs.org/docs/latest/api/web-contents-view
- Leitura para o Babel Coop: a prévia do site no app real deve ser um `WebContentsView` posicionado na coluna do meio (não `<webview>`), com o `debugger` ligado; o CDP responde "qual regra, em qual folha, em qual linha" para qualquer elemento clicado, sem parser de CSS nosso. Para o HTML (posições de nó no arquivo) o CDP não ajuda: aí entra o parse5 (1.1), porque o navegador descarta a posição de origem ao montar o DOM.

---

## 2. Editar estilos: tokens (custom properties) versus inline versus regra no arquivo

- MDN, custom properties: ler "from wherever" com `getComputedStyle(element).getPropertyValue("--my-var")`; escrever com `element.style.setProperty("--my-var", …)`; "A custom property defined using two dashes `--` instead of `@property` always inherits the value of its parent"; fallback `var(--my-var, red)`; "When the browser encounters an invalid `var()` substitution, then the initial or inherited value of the property is used" (o famoso "inválido no tempo de computação": `--text-color: 16px` em `color` vira preto, não erro). — https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties [CONFIRMADO]
- MDN, `adoptedStyleSheets`: "used for setting an array of constructed stylesheets"; `new CSSStyleSheet()` + `sheet.replaceSync("a { color: red; }")` + `document.adoptedStyleSheets.push(sheet)`; "available across browsers since March 2023". — https://developer.mozilla.org/en-US/docs/Web/API/Document/adoptedStyleSheets [CONFIRMADO]
- MDN, `getComputedStyle`: "returns a live read-only CSSStyleProperties object containing the resolved values of all CSS properties of an element"; "For properties that depend on layout, the used value may differ slightly from the computed value, and this is what is returned as the resolved value"; segundo parâmetro `pseudoElt` (`getComputedStyle(h3, "::after").content`). — https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle [CONFIRMADO]
- CSSOM: o getter `cssRules` "If the origin-clean flag is unset, throw a SecurityError exception"; a flag é "Set if response is CORS-same-origin, or unset otherwise". Ou seja: uma `<link>` para um CSS de outra origem (fonte do Google, CDN sem CORS) é ilegível por JS na página; as regras do próprio projeto (mesma origem) são legíveis. — https://drafts.csswg.org/cssom/#dom-cssstylesheet-cssrules [CONFIRMADO]
- `CSSConditionRule.conditionText`: devolve a condição de `@media/@supports/@container` (`"(width >= 500px)"`). — https://developer.mozilla.org/en-US/docs/Web/API/CSSConditionRule/conditionText [CONFIRMADO]
- css-tree (3.2.1, MIT): "fast detailed parser (CSS → AST), walker (AST traversal), generator (AST → CSS) and lexer (validation and matching) based on specs and browser implementations"; opção `positions`: "Specify to store locations of node content in original source. Location is storing as `loc` field of nodes" (cada `loc` tem `start`/`end` com `offset`, `line`, `column`); `context` (stylesheet, rule, declaration, value, selector…); `parseCustomProperty` para abrir `var()`; `onParseError` embrulha o problemático em `Raw` sem lançar exceção. 190.920 bytes / 53.096 gzip. — https://github.com/csstree/csstree · https://raw.githubusercontent.com/csstree/csstree/master/docs/parsing.md [CONFIRMADO]

Receita para a Tela [MÉTODO PRÓPRIO, apoiado nos fatos acima]:

1. **Durante a edição**, nada escreve no arquivo. A camada de edição aplica o valor novo numa folha construída (`adoptedStyleSheets`) com um seletor que mira só o elemento (`[data-bc-loc="120-388"] { padding: 24px }`). O site responde na hora e o CSS de origem fica intacto até o "Salvar".
2. **Se o valor mudado vem de um token** (a regra de origem tem `var(--espaco-3)`), a Tela pergunta em uma linha: "mudar só aqui ou mudar o token `--espaco-3` (usado em 14 lugares)?". Só aqui = escreve o valor no seletor do elemento. O token = patch no `:root`. Isso é o que faz a edição visual não destruir o sistema de design do ESTUDO_DESIGN_2030 (tokens em `docs/design/tokens.css`).
3. **No salvar**, o patch vai para a regra certa: no Electron, o `range` que o CDP devolveu (linha e coluna, zero-based) na folha `regular`; no navegador puro, o `loc` do css-tree na regra cujo seletor casa com o elemento (`el.matches(selectorText)`), escolhendo a de maior especificidade dentro do `@media` ativo (2.6 abaixo). Se nenhuma regra existe, cria uma com o seletor mais curto e único (`@medv/finder`, 1,8 KB gzip: "Generates shortest CSS selectors", "Unique CSS selectors per page") — https://github.com/antonmedv/finder [CONFIRMADO].
4. **Inline (`style=""`) só como última saída** e sempre avisando: é o que o v0 e o Lovable fazem por classes Tailwind; num projeto de HTML/CSS puro, inline quebra a cascata e não responde a breakpoint.

---

## 3. Medir e mostrar o box model (margin/padding/gap) com overlays

- Chrome DevTools, aba Styles: "In the **Box Model** diagram in the **Styles** tab, hover over **padding**. The element's padding is highlighted in the viewport." "Double-click the left margin in the **Box Model**… type a value"; "The **Box Model** defaults to pixels, but it also accepts other values, such as `25%`, or `10vw`." — https://developer.chrome.com/docs/devtools/css/ [CONFIRMADO]
- Flexbox no DevTools: badge `flex` na árvore; "A sobreposição aparece sobre o elemento, delineada com linhas pontilhadas para mostrar a posição de seu conteúdo e itens"; editor de flexbox com ícones para `justify-content`/`align-items` que "são rotacionados adequadamente" quando `flex-direction: column`. — https://developer.chrome.com/docs/devtools/css/flexbox [CONFIRMADO]
- CDP `Overlay.HighlightConfig` (JSON v1.3): `showInfo` ("Whether the node info tooltip should be shown"), `showStyles`, `showRulers`, `showAccessibilityInfo` (default true), `showExtensionLines`, `contentColor`, `paddingColor`, `borderColor`, `marginColor` (todos "default: transparent"), `gridHighlightConfig`, `flexContainerHighlightConfig`, `flexItemHighlightConfig`, `containerQueryContainerHighlightConfig`, `contrastAlgorithm` ("default: aa"). `Overlay.highlightNode`: "Highlights DOM node." `Overlay.setShowFlexOverlays`/`setShowGridOverlays`: "Highlight multiple elements with the CSS Grid overlay." `Overlay.setInspectMode`: "In this mode, elements that user is hovering over are highlighted. Backend then generates 'inspectNodeRequested' event upon element selection." `DOM.getBoxModel`: "Returns boxes for the given node" → `BoxModel { content, padding, border, margin (quads), width, height, shapeOutside }`. [CONFIRMADO]
- Leitura: no Electron, o overlay de margin/padding/gap/flex/grid **é o do próprio Chrome**, com as cores que a Tela escolher (as do tema: `--pessoa`, azul frio, âmbar), sem código de desenho nosso; as medidas vêm em quads absolutos. No navegador puro, o equivalente é uma camada `position: fixed; pointer-events: none` dentro da página que desenha quatro retângulos a partir de `getBoundingClientRect()` + `getComputedStyle()` (`marginTop`, `paddingLeft`, `gap`, `rowGap`, `columnGap`) e redesenha em `scroll`/`resize` (o próprio `VISUAL` do protótipo já injeta um `<style>`; injetar um `<div>` de overlay é o mesmo gesto) [MÉTODO PRÓPRIO].
- Regra de design (ESTUDO §2.4, DSKY): o overlay aparece só com o elemento selecionado ou com a tecla de medir apertada; nada aceso quando nada muda.

---

## 4. Smart guides e snapping (como Figma faz; como reproduzir)

- Figma, preferências de snap: "Snap to objects: Align the centers and outermost points of different objects"; "Snap to geometry: Used only in vector edit mode"; "Snap to pixel grid: Align objects to an underlying grid"; "A red guide appears on the canvas as a visual indicator"; "hold Control to temporarily disable them". — https://help.figma.com/hc/en-us/articles/360039956914-Adjust-alignment-rotation-position-and-dimensions [CONFIRMADO]
- Figma, medir distâncias: "Select the first object… Hold down the modifier key: Mac: ⌥ Option, Windows: Alt. Hover over the second object." "Figma will display a red line between the two objects, as well as horizontal and vertical measurements." "Figma will measure the distances between the _bounds_ of each object". — https://help.figma.com/hc/en-us/articles/360039956974-Measure-distances-between-objects [CONFIRMADO]
- interact.js, snapping: `interact.modifiers.snap({ targets: [{x:200,y:200}, …] })`; `targets` podem ser "funções que retornam alvos dinamicamente baseado em x, y e informações da interação"; `range` = "a distância que o pointer deve estar das coordenadas do alvo para um snap ser possível"; `relativePoints: [{x:0,y:0},{x:0.5,y:0.5},{x:1,y:1}]` (canto, centro, canto); `interact.snappers.grid({ x: 50, y: 50, range: 10 })`; para resize, `snapSize` e `snapEdges`. — https://interactjs.io/docs/snapping/ [CONFIRMADO]
- moveable (0.53.0, MIT, "A Vanilla Component"): "Snappable indicates whether to snap to the guideline", com `elementGuidelines`, `snapThreshold`, `snapDigit`; `groupable` ("targets can be moved in group"); `resizable` com `keepRatio`. — https://github.com/daybrush/moveable [CONFIRMADO]
- Algoritmo mínimo em JS puro [MÉTODO PRÓPRIO, é o que essas bibliotecas fazem por dentro]: para o elemento arrastado, calcular 6 linhas (esquerda, centro x, direita, topo, centro y, base); para cada irmão visível e para o pai, as mesmas 6; se `|Δ| ≤ 5 px` (o `range`), corrigir a posição e desenhar a guia de 1 px na cor de estado; para "espaçamento igual", comparar o vão entre o arrastado e o vizinho com o vão entre os dois vizinhos anteriores e mostrar o valor. Custo: dezenas de comparações por `pointermove`, nada. Guia e medida em `--frio` (sistema), não em vermelho do Figma, para caber na régua do estudo.

---

## 5. Arrastar em layouts flex/grid: reordenar versus mover livre ("auto layout")

- Figma, auto layout: direção "Vertical"/"Horizontal" (com "Wrap") e "Grid"; "Padding… the empty or white space between the edge of a parent auto layout frame and its objects"; "Gap… the distance between or distribution of objects"; "An object with **Ignore auto layout** enabled is excluded from an auto layout flow… Much like absolute position in CSS". — https://help.figma.com/hc/en-us/articles/360040451373-Explore-auto-layout-properties [CONFIRMADO]
- Framer, Stacks: "A Stack is a Frame with Stack layout applied, so its children follow a responsive row or column"; num Frame comum "child layers use absolute positioning by default"; "Stack layout changes its children to relative positioning and puts them in a shared row or column"; "Longer text pushes the next item forward". — https://www.framer.com/academy/lessons/stacks [CONFIRMADO]
- SortableJS (1.15.7, MIT, 45 KB / 15 KB gzip): "Reorderable drag-and-drop lists for modern browsers and touch devices. No jQuery or framework required"; `group` (entre listas), `animation`, `swapThreshold` ("Percentage of the target that the swap zone will take up"), `handle`, `ghostClass`; `onEnd` com `oldIndex`/`newIndex`. — https://github.com/SortableJS/Sortable [CONFIRMADO]
- FLIP (Paul Lewis): "First, Last, Invert, Play"; "Animations that can be remapped to transform and opacity changes are the perfect fit"; código: `first = el.getBoundingClientRect()` → muda o layout → `last = …` → `invert = first.top - last.top` → `el.animate([{transform: translateY(invert)}, {transform: 'translateY(0)'}], {duration: 300})`. — https://aerotwist.com/blog/flip-your-animations/ [CONFIRMADO]
- MDN `elementsFromPoint`: "An array of Element objects, ordered from the topmost to the bottommost box of the viewport" (serve para achar o alvo por baixo do fantasma arrastado sem `pointer-events: none`). — https://developer.mozilla.org/en-US/docs/Web/API/Document/elementsFromPoint [CONFIRMADO]
- Regra para a Tela [MÉTODO PRÓPRIO]: o gesto é o mesmo (arrastar), o resultado depende do pai, e a Tela diz qual é antes de soltar:
  - pai `display: flex`/`grid` ou fluxo normal → **reordenar**: marca "antes/depois" no irmão (como o protótipo já faz), `insertBefore` no DOM e, no arquivo, mover o trecho `[startOffset, endOffset)` do elemento para antes do irmão (dois patches); animar com FLIP; cartão "Moveu *Preço* para antes de *Depoimentos*";
  - elemento `position: absolute/fixed` (ou o pai é um "palco" livre) → **mover livre**: escreve `left/top` (ou `inset`) na regra do elemento, com smart guides (§4);
  - arrastar para dentro de outro contêiner → reparent: mesmo patch de mover trecho;
  - nunca virar `position: absolute` por conta própria para "obedecer" o arraste; oferecer "Soltar aqui (fora do fluxo)" como escolha explícita com aviso, igual ao "Ignore auto layout" do Figma.

---

## 6. Redimensionar com alças preservando proporção

- interact.js resizable: `edges: { top: true, left: false, bottom: '.resize-s', right: handleEl }`; `modifiers: [interact.modifiers.aspectRatio({ ratio: 'preserve' | número, modifiers: [restrictSize({ max: 'parent' })] })]`; evento `resizemove` com `event.rect` (novas dimensões) e `event.deltaRect`; `invert: 'none' | 'negate' | 'reposition'`. 98 KB / 29 KB gzip, MIT. — https://interactjs.io/docs/resizable/ [CONFIRMADO]
- moveable: `resizable` com `keepRatio: true`, `renderDirections`, `snappable` durante o resize. [CONFIRMADO]
- Para a Tela [MÉTODO PRÓPRIO]: 8 alças só no elemento selecionado; Shift trava a proporção (`aspectRatio 'preserve'`); o que se escreve no CSS depende do que existe: se a regra tem `width`, patch em `width`; se é imagem com `aspect-ratio`, patch em `width` e mantém `aspect-ratio`; se é um bloco em flex, oferece `flex-basis`/`max-width` em vez de `width` fixa (senão quebra no celular). Unidades: manter a unidade da regra original (`%`, `rem`, `px`), convertendo o delta em px pela largura do pai; é o que o DevTools faz no box model ("accepts other values, such as `25%`, or `10vw`").

---

## 7. Editar texto inline sem perder formatação

- MDN `contenteditable`: `plaintext-only` "indicates that the element's raw text is editable, but rich text formatting is disabled"; "If content is pasted into an element with `contenteditable="plaintext-only"`, all formatting is removed" (com `true`, "all formatting is retained"). — https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable [CONFIRMADO]
- Compatibilidade (BCD, `html/global_attributes.json`, chave `contenteditable.plaintext-only`): Chrome `51`, Safari `5`, Firefox `136`, Edge `12`, iOS/Android "mirror". Firefox 136: "The `plaintext-only` value… rich text formatting is disabled and any formatting in pasted text is automatically stripped" (bug 1922724). — https://raw.githubusercontent.com/mdn/browser-compat-data/main/html/global_attributes.json · https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/136 [CONFIRMADO]
- `beforeinput` + `InputEvent.getTargetRanges()`: "returns an array of StaticRange objects that will be affected by a change to the DOM if the input event is not canceled"; "Baseline – Widely available… since March 2021". — https://developer.mozilla.org/en-US/docs/Web/API/InputEvent/getTargetRanges [CONFIRMADO]
- `document.execCommand`: "Deprecated… not implemented consistently or fully by user agents"; ressalva: "modifications performed by `execCommand()` preserve the undo buffer (edit history)". — https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand [CONFIRMADO]
- ProseMirror: o documento "isn't a blob of HTML, but a custom data structure"; "every change causes a transaction to be created"; rebasing = "taking two steps that start with the same document, and transform one of them so that it can be applied to the document created by the other"; "selective undo". — https://prosemirror.net/docs/guide/ [CONFIRMADO]
- Lexical: "The core package of Lexical is only 22kb in file size (min+gzip)"; EditorState imutável com "a Lexical Node Tree" + "a Lexical Selection object"; "has its own DOM reconciler"; `createEditor()` em vanilla JS. Bundle jsdelivr `lexical/+esm` (0.51.0): 199.787 bytes / 65.598 gzip (bem acima dos 22 KB da doc: o bundle da CDN não é o build de produção enxuto; medir antes de adotar). — https://lexical.dev/docs/intro [CONFIRMADO, com a divergência anotada]
- Decisão para a Tela [MÉTODO PRÓPRIO]: os textos da Tela são curtos (título, parágrafo, rótulo de botão). Não precisa de Lexical/ProseMirror; eles resolvem documento longo com marcas. Regra em três degraus:
  1. elemento folha (só nós de texto) → `contenteditable="plaintext-only"`; ao sair, patch no intervalo do nó de texto (parse5 dá posição do texto);
  2. elemento com filhos inline (`<strong>`, `<a>`, `<em>`) → `contenteditable="true"` **com `beforeinput` filtrando `inputType`**: aceita `insertText`, `insertParagraph` (ou bloqueia), `deleteContent*`, `insertFromPaste` como texto puro; cancela `formatBold`, `insertFromDrop`, `formatSetBlockTextDirection` etc. Assim a estrutura de marcas não muda e cada nó de texto vira um patch no seu próprio intervalo;
  3. quem quiser mudar a estrutura ("põe esse trecho em negrito", "vira lista") fala com o agente (§13), que edita o arquivo.
  Esc cancela; Enter confirma (a Tela não é um editor de documento; parágrafos novos entram por "Duplicar").

---

## 8. Desfazer/refazer por comando e versões por snapshot

- Padrão Command (Refactoring Guru): "turns a request into a stand-alone object that contains all information about the request"; "The global command history is just a stack"; "Take the most recent command from the history and run its undo method"; "commands are responsible for performing various operations over a target object, while mementos save the state". — https://refactoring.guru/design-patterns/command [CONFIRMADO]
- Immer patches (11.1.18, MIT, 19 KB / 7 KB gzip): `produceWithPatches` devolve `[nextState, patches, inversePatches]`; patch `{op: "replace"|"add"|"remove", path: [...], value}` (RFC-6902-like); `applyPatches(state, inverseChanges)` desfaz. — https://immerjs.github.io/immer/patches [CONFIRMADO]
- Yjs UndoManager (13.6.32, MIT, 80 KB / 23 KB gzip): "If any of the specified types, or any of its children is modified, the UndoManager adds a reverse-operation on its stack"; "merges edits that are created within a certain `captureTimeout` (defaults to 500ms)"; `trackedOrigins` "selectively specify which changes should be tracked"; `stopCapturing()` separa a próxima operação. — https://docs.yjs.dev/api/undo-manager [CONFIRMADO]
- Figma multiplayer: "if you undo a lot, copy something, and redo back to the present (a common operation), the document should not change"; "in Figma an undo operation modifies redo history at the time of the undo, and likewise a redo operation modifies undo history at the time of the redo"; conflito na mesma propriedade = "last-writer-wins register except we don't need a timestamp because the server can define the order of events". — https://www.figma.com/blog/how-figmas-multiplayer-technology-works/ [CONFIRMADO]
- CDP: `DOM.undo` ("Undoes the last performed action") e `DOM.markUndoableState` existem para as edições feitas pelo protocolo (`setOuterHTML`, `moveTo`, `setAttributeValue`), mas cobrem só o DOM da prévia, não o arquivo. [CONFIRMADO]
- Desenho para a Tela [MÉTODO PRÓPRIO]: cada gesto vira um **comando com patch e patch inverso no arquivo** (`{arquivo, offsetInicio, offsetFim, textoAntes, textoDepois, quem, quando}`); desfazer aplica o inverso e recarrega a prévia; agrupar por 500 ms como o Yjs; em equipe, a pilha é **por pessoa** (`trackedOrigins` = eu), então Ctrl+Z nunca desfaz o que o Davi acabou de fazer, e o "Ver por pessoa" (5.18) nasce desse mesmo registro (`quem` em cada patch). Versões (a régua do 5.18) = snapshot do arquivo inteiro a cada salvar (o `versoes[]` do protótipo já faz) + miniatura; comparar duas versões = diff textual dos snapshots, e a Tela pinta os elementos cujos intervalos caem no diff.
- Miniatura de versão e de elemento: html-to-image (1.11.13, MIT, 16 KB / 6,6 KB gzip): "uses a feature of SVG that allows having arbitrary HTML content inside of the `<foreignObject>` tag"; `toPng/toSvg/toBlob/toCanvas/toJpeg`; limites: canvas "tainted… rendering will rather not succeed", "Rendering will failed on huge DOM due to the dataURI limit". No Electron, `capturePage([rect])` do webContents é mais fiel e não sofre desses limites. — https://github.com/bubkoo/html-to-image [CONFIRMADO]

---

## 9. Edição responsiva por breakpoint

- Framer: ao adicionar tablet/phone/custom, "Framer creates another layout that inherits from the primary breakpoint"; "The width shown on the canvas is also the minimum viewport width at which that breakpoint becomes active"; "Change only what the narrower layout needs, such as type size, Stack direction, gap, padding, width, or visibility"; "Add a breakpoint when the layout starts to fail, rather than adding one by habit." — https://www.framer.com/academy/lessons/breakpoints [CONFIRMADO]
- Webflow "Intro to breakpoints": [NÃO LIDO] (help.webflow.com devolveu 403). A regra de cascata do Webflow não entra como fato.
- MDN `matchMedia`: devolve `MediaQueryList` com `matches` e evento `change` (`window.matchMedia("(width <= 600px)")`). — https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia [CONFIRMADO]
- CDP `CSSRule.media`: "The array enumerates media queries starting with the innermost one, going outwards" — cada regra casada já diz em qual `@media` está. [CONFIRMADO]
- Mecânica para a Tela [MÉTODO PRÓPRIO]: a barra da prévia tem três larguras (as do projeto; padrão 1280 / 810 / 390, mesma família do Framer). Uma edição de estilo feita com a prévia a 390 px vai para o bloco `@media (max-width: 480px)` (ou o `conditionText` que já existe no arquivo para essa faixa); se o bloco não existe, é criado no fim do CSS com um comentário `/* celular · criado pela Tela */`. Edição na largura base vai para a regra base. A ficha do elemento mostra "esta cor vem da regra base · o padding foi mudado no celular" lendo `matchedCSSRules[].media`. Texto e ordem no HTML não têm breakpoint (são o documento); só estilo tem.

---

## 10. Seleção múltipla

- Figma: "Hold Shift and click on another object"; marquee: "Click and hold on an empty part of the canvas. Drag the cursor across any objects you'd like to select"; deep select: "Hold down the modifier key to select the top-level frame or a nested layer or object by clicking it"; Cmd/Ctrl+A. Aviso: "It's possible to select nested objects without selecting the parent object." — https://help.figma.com/hc/en-us/articles/360040449873-Select-layers-and-objects [CONFIRMADO]
- Lovable, Visual Edits: "Click the element you want to change. You can select multiple elements at once" (Cmd/Ctrl); "Each selected element attaches to the project chat input as a reference, and your prompt applies to all of them." — https://docs.lovable.dev/features/visual-edit [CONFIRMADO]
- moveable `groupable`: "Whether the targets can be moved in group with draggable, resizable, scalable, rotatable". [CONFIRMADO]
- Para a Tela [MÉTODO PRÓPRIO]: Shift+clique soma; marquee no vazio da página seleciona por interseção de `getBoundingClientRect()`; a barra flutuante mostra só as propriedades comuns; um comando por gesto aplica N patches (um por elemento) num único item de desfazer; Cmd+clique desce um nível (o protótipo hoje seleciona sempre o alvo do clique, que costuma ser o `<span>` mais interno: a regra "clique = bloco mais próximo com margem/padding; Cmd+clique = o alvo exato" resolve o aviso do Figma sobre selecionar o aninhado sem querer).

---

## 11. Componentes repetidos (editar um muda todos)

- Figma: "A main component defines the properties of the component. An instance is a copy of the component you can reuse"; "Instances are linked to the main component and receive any updates made to the component"; "Override properties of an instance"; "Detach instances from components"; "Reset instances to remove overrides". — https://help.figma.com/hc/en-us/articles/360038662654-Guide-to-components-in-Figma [CONFIRMADO]
- MDN `<template>` e slots: "This element and its contents are not rendered in the DOM, but it can still be referenced using JavaScript"; clonar com `template.content` + `importNode`; slots "allow you to define placeholders in your template that can be filled with any markup fragment". — https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots [CONFIRMADO]
- GrapesJS (0.23.6, BSD-3-Clause): "The **main purpose of the Component** is to keep track of its data"; a View "has nothing to do with the **final HTML data**"; ao importar HTML, "the editor iterates over all the defined components, called **Component Type Stack**, and checks via `isComponent`"; exporta com `toHTML()`/JSON. Peso: 1.151.347 bytes / 294.295 gzip (dist/grapes.min.js), 12,4 MB descompactado no npm. Serve de referência de modelo, não de dependência. — https://grapesjs.com/docs/modules/Components.html [CONFIRMADO]
- Onlook: "All the changes made are stored as actions… serialized, stored, and reproduced" (é o que permite repetir a mesma ação em N instâncias). [CONFIRMADO]
- Para HTML puro [MÉTODO PRÓPRIO]: sem sistema de componentes no arquivo, "repetido" é detectado por estrutura: irmãos com a mesma assinatura (tag + classes + forma da subárvore, ignorando texto e `src`) viram um "conjunto" (3 cartões de preço). Ao editar estilo em um, a Tela pergunta "aplicar aos 3?"; sim = o mesmo patch de CSS na regra compartilhada (que já vale para todos, se o seletor for a classe) ou, se a regra era só daquele, mover a declaração para a classe comum. Texto e imagem nunca se propagam (são o "override" do Figma). Quando o projeto tiver `<template>` + custom element, o conjunto é explícito e a Tela edita o template.

---

## 12. Imagem: trocar, cortar, gerar por IA

- Replicate `google/nano-banana-2` (schema lido): `prompt` obrigatório; `image_input` (array, "supports up to 14 images", "Input images to transform or use as reference"); `aspect_ratio`, `resolution`, `output_format`; "Edit existing images. Pass in one or more images along with a text prompt to transform them — change backgrounds, swap colors, adjust styles, or combine multiple images into one scene." Preço e contrato da API já estão em `geracao-replicate.md` (1K US$ 0,067; `output_format: png`; saída expira em 1 h; baixar na hora). — https://replicate.com/google/nano-banana-2/llms.txt [CONFIRMADO]
- Cropper.js v2 (2.2.0, MIT): custom elements `<cropper-canvas>`, `<cropper-image>`, `<cropper-selection>`, `<cropper-handle>`, `<cropper-shade>`; "For prototyping: `<script src="https://unpkg.com/cropperjs"></script>`"; `<cropper-selection aspect-ratio>` ("Indicates the aspect ratio of the selection, must a positive number"), `movable`, `resizable`, `keyboard`; `$toCanvas()` "Generates a real canvas element, with the image (selected area only) drawn into"; importação sob demanda (`@cropper/element-*` + `$define()`). Bundle de entrada `cropperjs/+esm` = 3.553 bytes / 1.553 gzip (os elementos vêm em pacotes separados, não medidos). — https://fengyuanchen.github.io/cropperjs/guide.html · https://fengyuanchen.github.io/cropperjs/api/cropper-selection.html [CONFIRMADO]
- Fluxo para a Tela [MÉTODO PRÓPRIO]: clicar na imagem abre três ações: **Trocar** (arquivo do computador → copia para a pasta do projeto → patch no atributo `src`, cujo intervalo o parse5 dá em `attrs`), **Cortar** (Cropper na proporção do espaço atual do elemento, `$toCanvas` → salva ao lado como `nome@cortada.webp` → patch no `src`), **Pedir à IA** ("tira o fundo", "deixa noturna": nano-banana-2 com `image_input: [a própria imagem]`, resultado baixado na hora e gravado como nova versão do arquivo de imagem; a original fica no histórico). Nunca `data:` URI no HTML (arquivo incha e o diff vira lixo).

---

## 13. "Apontar e pedir": o elemento selecionado como contexto do pedido ao agente

- Lovable: texto inline é a única edição sem prompt ("Fix a typo or change wording directly"; 100 grátis/dia); cor/tamanho/espaço exigem prompt ("Make this button the primary brand color and round the corners more") e "consumes credits"; "Each selected element attaches to the project chat input as a reference". — https://docs.lovable.dev/features/visual-edit [CONFIRMADO]
- v0 Design Mode: "Tweaks made in the panel are applied live in the preview"; "Design mode detects when your app is using Tailwind CSS and will surface Tailwind-compatible values"; para pedidos em linguagem natural "v0 automatically attaches a screenshot of the selected element along with your instructions"; ao aplicar, "serializa as edições… e gera uma nova versão… diffável e revertível". — https://v0.app/docs/design-mode [CONFIRMADO]
- Onlook: elemento → atributo tipo sourcemap → AST → escreve; mudanças como ações serializadas. [CONFIRMADO]
- stagewise: toolbar/IDE agêntica com "full access to your tab's console and debugger"; **AGPLv3** ("offered under the AGPLv3 license"): não copiar código de lá. — https://github.com/stagewise-io/stagewise [CONFIRMADO]
- Cursor browser: o agente "can identify and interact with page elements" e "actually sees the browser state as images"; não achei "selecionar elemento e mandar ao chat" na doc lida. — https://cursor.com/docs/agent/browser [PARCIAL]
- O pacote de contexto que a Tela monta ao apertar "Pedir" com um elemento selecionado [MÉTODO PRÓPRIO, somando o que Lovable, v0 e Onlook fazem e o que o CDP dá a mais]:
  1. `arquivo:linha:coluna` do elemento (parse5) e o trecho de HTML de origem exato (não o `outerHTML` normalizado), limitado a ~2 KB com "… (n filhos omitidos)";
  2. o seletor único curto (`@medv/finder`) e a cadeia de ancestrais com classes (`main > section.precos > .cartao:nth-child(2)`);
  3. as regras CSS que casam, com `arquivo:linha` de cada (CDP `matchedCSSRules[].style.range` no Electron; css-tree no navegador), e o `@media` de cada uma;
  4. o diff de estilos computados contra um elemento novo da mesma tag (só o que difere do padrão do navegador: 10–30 propriedades em vez de 300+);
  5. a caixa (`getBoxModel` ou `getBoundingClientRect`), a largura da prévia (o breakpoint) e um recorte de imagem do elemento (`capturePage(rect)` / html-to-image), como o v0;
  6. o pedido da pessoa em português e a regra de saída para o agente: "responda com patches por arquivo e intervalo, um por mudança, para a Tela aplicar e registrar como comandos desfazíveis com o seu nome" (a forma de ação do Onlook, que também é a do cartão do terminal no IDEIAS 5.7).
  O que se edita direto (texto, cor, espaço, tamanho, ordem, imagem) não passa pelo agente; o que muda estrutura ("duas colunas", "vira acordeão", "põe um depoimento aqui") passa. É a divisão do Lovable, com a diferença de que aqui cor e espaço também são diretos porque o CSS é nosso e legível.

---

## 14. Bibliotecas pequenas, sem build (peso medido na jsdelivr em 23/09/2026; licença e versão do registro npm)

| Biblioteca | Versão | Licença | Bruto | Gzip | Como medi | Serve para |
|---|---|---|---|---|---|---|
| parse5 | 8.0.1 | MIT | 128.620 | 26.533 | `/npm/parse5/+esm` (só `entities` à parte) | posições por nó/atributo no HTML de origem |
| htmlparser2 | 12.0.0 | MIT | 27.233 | 6.766 | `+esm` (domhandler/domutils/entities à parte) | re-parse rápido com `startIndex/endIndex` |
| rehype-parse | 9.0.1 | MIT | 655 | 485 | `+esm` (entrada; puxa parse5) | só se o projeto já usar unified |
| magic-string | 1.4.1 | MIT | 29.087 | 8.594 | `+esm` | vários patches por offset numa passada |
| css-tree | 3.2.1 | MIT | 190.920 | 53.096 | `+esm` | `loc` por nó do CSS no navegador puro (no Electron, o CDP dispensa) |
| @medv/finder | 4.0.2 | MIT | 3.816 | 1.828 | `+esm` | seletor único e curto para o elemento |
| @floating-ui/dom | 1.8.0 | MIT | 10.042 | 4.092 | `dist/floating-ui.dom.umd.min.js` (rev. 2, completo; o `+esm` da entrada dava 8.623 / 3.815 sem core/utils) | posicionar a barra flutuante da seleção (`computePosition`, `flip`, `shift`, `autoUpdate`) |
| interactjs | 1.10.28 | MIT | 98.203 | 28.982 | `dist/interact.min.js` | arrastar, redimensionar (`aspectRatio`, `restrictSize`), snap |
| moveable | 0.53.0 | MIT | 245.551 | 77.673 | `dist/moveable.min.js` | alças + guias + grupo prontos (pesado; usar só se não escrever o próprio) |
| sortablejs | 1.15.7 | MIT | 45.478 | 15.044 | `Sortable.min.js` | reordenar em listas/flex com toque |
| html-to-image | 1.11.13 | MIT | 16.337 | 6.594 | `+esm` | miniatura de versão/elemento (SVG foreignObject) |
| cropperjs | 2.2.0 | MIT | 3.553 | 1.553 | `+esm` (só a entrada; elementos à parte) | cortar imagem com custom elements |
| immer | 11.1.18 | MIT | 18.927 | 7.176 | `+esm` | patches e inversos para desfazer estado da Tela |
| yjs | 13.6.32 | MIT | 79.709 | 23.145 | `+esm` (lib0 à parte) | UndoManager por origem (pessoa) se o documento for compartilhado ao vivo |
| lexical | 0.51.0 | MIT | 136.658 | 43.719 | `Lexical.prod.mjs` (rev. 2; o `+esm` dava 199.787 / 65.598; a doc diz 22 KB) | só se a Tela virar editor de documento longo |
| prosemirror-view | 1.42.5 | MIT | 98.905 | 31.698 | `+esm` (só a view) | idem |
| grapesjs | 0.23.6 | BSD-3-Clause | 1.151.347 | 294.295 | `dist/grapes.min.js` | referência de modelo (Component/StyleManager); não entra no app |
| dom-to-image-more | 3.10.2 | MIT | 25.718 | 9.085 | `dist/dom-to-image-more.min.js` (rev. 2; `+esm` 26.113 / 9.751) | alternativa ao html-to-image (mais pesada que ele: 16 KB / 6,6 KB) |

Observações: `+esm` da jsdelivr é o módulo de entrada com as dependências em imports separados, então o peso total de parse5/htmlparser2/floating-ui/yjs é maior que o da linha; nenhum deles usa `require`/`node:`/`process.env` (verificado em parse5 e htmlparser2). O bundlephobia devolveu HTTP 429 hoje; por isso os pesos são da CDN e não do bundlephobia.

Conjunto mínimo recomendado para a Tela em JS puro [MÉTODO PRÓPRIO]: parse5 + magic-string + @medv/finder + @floating-ui/dom + html-to-image + cropperjs (≈ 50 KB gzip somando), e o resto escrito por nós (seleção, overlay de caixa, guias, arraste com `pointer*`, alças, comandos com patch inverso), porque o `VISUAL` do protótipo já tem 60 % disso e o que falta cabe em algumas centenas de linhas. interact.js entra se o arraste/resize com inércia e snap ficar caro de manter. No Electron, `WebContentsView` + `debugger` substituem css-tree e o overlay desenhado à mão.

---

## 15. Armadilhas (o que quebra se ignorar)

1. **Serializar o DOM vivo grava o que os scripts da página inseriram** e apaga a formatação do autor (WHATWG: o roundtrip não é garantido; MDN: atributos normalizados). Patches por offset resolvem.
2. **`srcdoc` + `sandbox="allow-scripts"` sem `allow-same-origin`** = origem opaca; o pai não lê o DOM; e juntar os dois tokens "lets the embedded document remove the sandbox". No app: `WebContentsView` + CDP.
3. **O `<webview>` do Electron está desaconselhado pela própria doc** ("recommend to not use"); o IDEIAS 5.18 e 15 falam em `<webview>`: trocar por `WebContentsView` na fase de produção.
4. **CSS de outra origem é ilegível por `cssRules`** (`SecurityError` sem CORS). Fontes do Google e CDNs não são editáveis; a Tela mostra "vem de fora" e oferece copiar para o projeto.
5. **`getComputedStyle` devolve valores resolvidos**, não o que está escrito (`1.5rem` aparece como `24px`; `auto` vira número). Para escrever de volta, ler a declaração da regra (CDP `cssText`/`range` ou css-tree), não o computado.
6. **Custom property com valor inválido não dá erro**: a propriedade cai no inicial/herdado. Validar o valor pelo tipo antes de gravar (`CSS.supports('color', v)` no navegador; `nodeForPropertySyntaxValidation` no CDP).
7. **`plaintext-only` no Firefox só a partir do 136** (Chrome 51, Safari 5); no Electron não é problema (Chromium), mas a Tela no navegador comum precisa do degrau 2 do §7.
8. **`execCommand` é deprecated**; a ressalva é que ele preserva o undo nativo. A Tela tem o próprio undo por comandos, então não depende dele.
9. **Escrever `position: absolute` para obedecer a um arraste livre** quebra o responsivo. Só reordenar em fluxo; mover livre só em elementos já absolutos.
10. **Inline `style=""` como resposta padrão** (o que serializar o DOM tende a produzir) enterra a cascata; sempre preferir a regra existente, o token, ou uma regra nova com seletor curto.
11. **Undo compartilhado**: sem `trackedOrigins` por pessoa, o Ctrl+Z de um desfaz o do outro (Figma teve de reescrever o histórico de redo para isso).
12. **html-to-image falha em canvas "tainted" e em DOM enorme**; no Electron, `capturePage(rect)`.
13. **Saídas da Replicate expiram em 1 h** (já anotado em `geracao-replicate.md`): a Tela baixa e grava no projeto no ato.
14. **Lexical na CDN pesa 66 KB gzip**, não os 22 KB da doc: medir o build antes de decidir; para a Tela, não é preciso.
15. **stagewise é AGPLv3**: inspirar, não copiar.
16. **Peso do moveable (78 KB gzip)** para o que são alças e guias: só se compensar o tempo; o protótipo já arrasta com `pointer*`.

---

## 16. O que ninguém fez (que a pesquisa deixou claro)

1. **Edição visual em HTML/CSS puro mapeada a `arquivo:linha` por posições do parser** (parse5 → `data-loc` → patch por offset), sem build: Lovable, v0 e Onlook trabalham em React/Next com Tailwind e instrumentam no build. **Correção da revisão 2 (§18.4):** o Pinegrow (desktop, pago) já edita HTML/CSS puro visualmente "sem abstração em cima do HTML e CSS", e o Chrome DevTools Workspaces grava CSS no arquivo; o que continua sem anterioridade lida é a combinação: no navegador/Electron sem build, em equipe, por patch de offset com autoria por bloco e agente no circuito.
2. **Usar o Chrome DevTools Protocol de dentro do Electron como motor da edição** (`getMatchedStylesForNode` com `range`, `setStyleTexts`, `highlightNode` com cores do tema, `setInspectMode`, `getBoxModel`, `moveTo`, `undo`): é o overlay e o mapa de CSS do próprio Chrome, de graça, e nenhuma das ferramentas lidas expõe isso ao usuário final.
3. **Cor de quem mexeu em volta de cada bloco, derivada do histórico de patches** (`quem` em cada comando), com o undo por pessoa vindo do mesmo registro: Figma tem cursores e último editor, não autoria por bloco na prévia.
4. **Token ou valor?** A pergunta de uma linha na hora de mudar uma cor que vem de `var(--…)`, com a contagem de usos: v0 mostra valores Tailwind; ninguém lido mostra o token do projeto e o impacto.
5. **Breakpoint automático pela largura da prévia**, escrevendo no `@media` certo do arquivo (ou criando com comentário): Framer faz no modelo dele; para CSS de arquivo, não encontrei.
6. **Pacote de contexto ao agente com `arquivo:linha` do HTML e das regras CSS + diff de estilos contra o padrão + recorte de imagem**: Lovable manda a referência, v0 manda a captura; juntar os dois com posições é o que deixa o agente responder em patches aplicáveis e desfazíveis.
7. **Texto inline por nó de texto com `beforeinput` filtrando `inputType`**, para editar dentro de `<strong>`/`<a>` sem editor de documento e sem perder marcas.

---

## 17. Fontes lidas (todas abertas hoje; as marcadas não abriram)

- https://parse5.js.org/interfaces/parse5.ParserOptions.html
- https://parse5.js.org/interfaces/parse5.Token.ElementLocation.html
- https://github.com/inikulin/parse5
- https://cdn.jsdelivr.net/npm/parse5/+esm (bundle verificado: sem require/node:)
- https://github.com/fb55/htmlparser2
- https://cdn.jsdelivr.net/npm/htmlparser2/+esm
- https://github.com/syntax-tree/unist
- https://github.com/webfansplz/vite-plugin-vue-inspector
- https://github.com/zthxxx/react-dev-inspector
- https://github.com/onlook-dev/onlook
- https://docs.onlook.com/developers/architecture
- https://github.com/rich-harris/magic-string
- https://github.com/antonmedv/finder
- https://html.spec.whatwg.org/multipage/parsing.html#serialising-html-fragments
- https://developer.mozilla.org/en-US/docs/Web/API/Element/outerHTML
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe
- https://raw.githubusercontent.com/ChromeDevTools/devtools-protocol/master/json/browser_protocol.json (v1.3)
- https://www.electronjs.org/docs/latest/api/debugger
- https://www.electronjs.org/docs/latest/api/webview-tag
- https://www.electronjs.org/docs/latest/api/web-contents-view
- https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties
- https://developer.mozilla.org/en-US/docs/Web/API/Document/adoptedStyleSheets
- https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle
- https://drafts.csswg.org/cssom/#dom-cssstylesheet-cssrules
- https://developer.mozilla.org/en-US/docs/Web/API/CSSConditionRule/conditionText
- https://github.com/csstree/csstree
- https://raw.githubusercontent.com/csstree/csstree/master/docs/parsing.md
- https://developer.chrome.com/docs/devtools/css/
- https://developer.chrome.com/docs/devtools/css/flexbox
- https://developer.chrome.com/docs/devtools/dom/
- https://help.figma.com/hc/en-us/articles/360039956914-Adjust-alignment-rotation-position-and-dimensions
- https://help.figma.com/hc/en-us/articles/360039956974-Measure-distances-between-objects
- https://help.figma.com/hc/en-us/articles/360040451373-Explore-auto-layout-properties
- https://help.figma.com/hc/en-us/articles/360040449873-Select-layers-and-objects
- https://help.figma.com/hc/en-us/articles/360038662654-Guide-to-components-in-Figma
- https://www.figma.com/blog/how-figmas-multiplayer-technology-works/
- https://www.framer.com/academy/lessons/breakpoints
- https://www.framer.com/academy/lessons/stacks
- https://interactjs.io/docs/snapping/
- https://interactjs.io/docs/resizable/
- https://github.com/daybrush/moveable
- https://github.com/SortableJS/Sortable
- https://aerotwist.com/blog/flip-your-animations/
- https://developer.mozilla.org/en-US/docs/Web/API/Document/elementsFromPoint
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/html/global_attributes.json
- https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/136
- https://developer.mozilla.org/en-US/docs/Web/API/InputEvent/getTargetRanges
- https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
- https://prosemirror.net/docs/guide/
- https://lexical.dev/docs/intro
- https://refactoring.guru/design-patterns/command
- https://immerjs.github.io/immer/patches
- https://docs.yjs.dev/api/undo-manager
- https://github.com/bubkoo/html-to-image
- https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia
- https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots
- https://grapesjs.com/docs/ · https://grapesjs.com/docs/modules/Components.html
- https://replicate.com/google/nano-banana-2/llms.txt
- https://fengyuanchen.github.io/cropperjs/guide.html · https://fengyuanchen.github.io/cropperjs/api/cropper-selection.html
- https://docs.lovable.dev/features/visual-edit
- https://v0.app/docs/design-mode
- https://cursor.com/docs/agent/browser
- https://github.com/stagewise-io/stagewise
- https://floating-ui.com/docs/getting-started
- https://registry.npmjs.org/<pacote>/latest (versão, licença, unpackedSize dos 18 pacotes)
- https://cdn.jsdelivr.net/npm/<pacote>/… (peso bruto e gzip)
- **Não lidos**: https://help.webflow.com/hc/en-us/articles/33961307580819-Intro-to-breakpoints (403); https://chromedevtools.github.io/devtools-protocol/tot/CSS/ e /Overlay/ e /DOM/ (renderizados por JS; substituídos pelo JSON oficial); https://vanilla.aslushnikov.com (JS); https://www.framer.com/help/articles/how-to-use-breakpoints/ e /how-to-use-stacks/ (404; substituídos pelas lições da Academy); https://bundlephobia.com/api (429); https://raw.githubusercontent.com/mdn/browser-compat-data/main/html/global_attributes/contenteditable.json (404; o JSON agregado abriu).

---

## 18. Revisão 2 (23/09/2026, segunda passada): o que entrou de novo, o que foi corrigido

> WebSearch seguiu esgotado nesta sessão (200/200); tudo abaixo foi lido por WebFetch direto ou `curl` (JSON oficial do CDP v1.3, `browser-compat-data` do MDN, registro npm, jsdelivr). Cada item aponta a seção original que complementa.

### 18.1 Novos fatos confirmados, por seção

**→ §1 (mapear elemento → arquivo:linha)**

- **Chrome DevTools Workspaces confirma a fronteira exata do problema** [CONFIRMADO]: "Save changes you make in DevTools back to source files on your computer by setting up a workspace." CSS: "You don't need to reload the page to apply and save CSS changes." HTML: "You can apply and save an HTML change from the **Sources** panel but not the **Elements** panel", porque "The tree of nodes that you see on the **Elements** panel represents the page's DOM… Therefore, the final state of the page that users see may be very different from the HTML that the browser fetched." Pastas automáticas: `/.well-known/appspecific/com.chrome.devtools.json` (UUID v4 + caminho do projeto). Pré-processadores: "A workspace folder connection is usually able to map the optimized code back to your original source code with the help of source maps". — https://developer.chrome.com/docs/devtools/workspaces
  - Leitura: **o próprio Chrome não consegue levar uma edição do DOM de volta ao HTML** e diz por quê (DOM ≠ HTML buscado). É exatamente o buraco que o `data-bc-loc` por parse5 (§1.4) fecha; para CSS, o Chrome já resolve por `range`, o que reforça usar o CDP no Electron (§1.7).
- **`DOM.getNodeStackTraces`** [CONFIRMADO, JSON do CDP]: "Gets stack traces associated with a Node. As of now, only provides stack trace for Node creation." Serve para separar o que está no arquivo do que um `<script>` da página criou (a armadilha 1 do §15): nó com stack trace de criação = nasceu de JS = não tem `data-bc-loc` e não vira patch no HTML; a Tela mostra "gerado pelo script X, linha Y".
- **`DOM.getContentQuads`**: "Returns quads that describe node position on the page. This method might return multiple quads for inline nodes." (um `<a>` quebrado em duas linhas tem dois retângulos; o overlay de seleção precisa disso, e `getBoundingClientRect` não dá; no navegador puro, `Range.getClientRects()`).
- **Pinegrow é a anterioridade de edição visual em HTML puro** [CONFIRMADO, página inicial em pt-BR]: "O Pinegrow é um construtor de sites que abre e grava arquivos HTML e CSS padrão." "Seu trabalho não ficará preso num formato de arquivo proprietário." "O Pinegrow não adiciona qualquer abstração em cima do HTML e CSS. Ele simplesmente ajuda você a trabalhar com HTML e CSS com mais eficiência, seja visualmente ou por meio de código." Suporte a "Bootstrap, TailwindCSS, Foundation e WordPress"; "Use variáveis e facilidades SASS e LESS"; venda por "pagamentos únicos" e "assinaturas anuais". — https://pinegrow.com/ · índice da doc com "How to edit your existing website with Pinegrow" ("As long as it is HTML, you can edit it in Pinegrow"), "Code editing", "Using External Code Editors & Tools (Visual Studio Code)", "Styling with CSS" — https://pinegrow.com/docs/ e https://pinegrow.com/docs/getting-started/ (as páginas internas devolveram 404 nas URLs tentadas; a preservação de formatação do autor **não foi confirmada** na doc, só a ausência de formato proprietário).

**→ §2 (estilos: tokens, inline, regra no arquivo)**

- **CSS Typed OM, `Element.computedStyleMap()`** [CONFIRMADO]: "returns a StylePropertyMapReadOnly interface which provides a read-only representation of a CSS declaration block"; "the return value contains computed values, not resolved values"; "For most properties, they are the same, except a few layout-related properties, where the resolved value is the used value instead of the computed value" (uma `width: 50%` volta como `50%` tipado, enquanto `getComputedStyle` devolve px após o layout). BCD: Chrome 66, Safari 16.4, Firefox só "preview" (bug 1278697); não Baseline. — https://developer.mozilla.org/en-US/docs/Web/API/Element/computedStyleMap · https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/Element.json
  - Leitura: no Electron (Chromium) ajuda a ler `%`, palavras-chave e custom properties com tipo; **não** resolve `rem`/`em` (o valor computado de comprimento já é absoluto). Para escrever de volta na unidade do autor continua valendo ler a declaração da regra (CDP `cssText`/`range` ou css-tree), como o §15.5 já dizia.
- **CDP, comandos de escrita e busca que a rodada 1 não listou** [CONFIRMADO, JSON v1.3]: `CSS.getLocationForSelector` ("Given a CSS selector text and a style sheet ID… returns an array of locations of the CSS selector in the style sheet"); `CSS.setEffectivePropertyValueForNode` ("Find a rule with the given active property for the given node and set the new value for this property": é o "muda a cor deste elemento" sem a Tela escolher a regra); `CSS.addRule` ("Inserts a new rule with the given `ruleText` in a stylesheet with given `styleSheetId`, at the position specified by `location`"); `CSS.setRuleSelector`, `CSS.setMediaText`; `CSS.startRuleUsageTracking` + `CSS.takeCoverageDelta` ("Obtain list of rules that became used since last call": diz quais regras a página usa de verdade, para a Tela avisar "esta regra não é usada por nenhum elemento"); `DOM.getNodesForSubtreeByStyle` ("Finds nodes with a given computed style in a subtree": para "mostrar tudo que usa esta cor"); `CSS.trackComputedStyleUpdates` + `takeComputedStyleUpdates` (quais nós tiveram a propriedade mudada, para redesenhar só o que mudou); `CSS.getAnimatedStylesForNode` ("styles coming from animations & transitions"). — https://raw.githubusercontent.com/ChromeDevTools/devtools-protocol/master/json/browser_protocol.json
- **`adoptedStyleSheets` por BCD**: Chrome 73, Firefox 101, Safari 16.4 (confirma o "since March 2023" do §2). — https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/Document.json

**→ §3 e §4 (box model, guias, snapping)**

- **`Overlay.highlightRect` e `Overlay.highlightQuad`** [CONFIRMADO]: "Highlights given rectangle." / "Highlights given quad. Coordinates are absolute with respect to the main frame viewport." São as **smart guides e as cotas desenhadas pelo próprio Chrome**, fora do DOM da página (nada injetado, nada que os scripts da página vejam), com a cor que a Tela mandar. `Overlay.highlightSourceOrder` ("Highlights the source order of the children of the DOM node") numera os filhos na ordem do HTML: é a prévia de "reordenar" antes de soltar. `Overlay.setShowViewportSizeOnResize` ("Paints viewport size upon main frame resize") dá o rótulo de largura quando a pessoa arrasta a borda da prévia entre breakpoints (§9).

**→ §7 (texto inline)**

- **EditContext API** [CONFIRMADO]: "can be used to build rich text editors on the web that support advanced text input experiences, such as Input Method Editor (IME) composition, emoji picker"; "you get the flexibility to render your own editable text region using any technology you want"; "you are responsible for providing the things that the browser would normally provide for you"; eventos `TextUpdateEvent`, `TextFormatUpdateEvent`, `CharacterBoundsUpdateEvent`; "Limited availability"; "This is an experimental technology". BCD: Chrome 121; Firefox `false` (bug 1904161); Safari `false` (WebKit bug 269922). — https://developer.mozilla.org/en-US/docs/Web/API/EditContext_API · https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/EditContext.json
  - Leitura: no Electron daria para editar texto **sem** `contenteditable` (a Tela recebe o texto e desenha), mas custa reimplementar seleção, cursor e acessibilidade. A decisão do §7 (três degraus com `plaintext-only` + `beforeinput`) fica; EditContext vira opção só se o `contenteditable` dentro de `<strong>/<a>` der problema real com IME/pt-BR.

**→ §8 (desfazer, versões, "cor por pessoa")**

- **CSS Custom Highlight API** [CONFIRMADO]: "provides a mechanism for styling arbitrary text ranges on a document by using JavaScript to create the ranges, and CSS to style them"; "you can programmatically create text ranges and highlight them without affecting the DOM structure in the page"; objetos `Range`, `Highlight` ("a collection of ranges to be styled"), `CSS.highlights` ("Map-like object… register highlights with custom identifiers"), `::highlight(nome)` (exemplo com `background-color` e `color`). "Baseline 2025 · Newly available · Since June 2025, this feature works across the latest devices and browser versions." BCD `Highlight`: Chrome 105, Safari 17.2, Firefox 140. — https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API · https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/Highlight.json
  - Leitura: é como pintar **"trechos do texto" por pessoa** (IDEIAS 5.18 pede "blocos do site, peças da Máquina, trechos do texto") e o diff entre duas versões **sem envolver nada em `<span>`**, ou seja, sem sujar o HTML que depois vira patch. O registro de patches (`quem`, `offsetInicio`, `offsetFim`) vira `Range`s → `Highlight` por pessoa → `::highlight(davi) { background: color-mix(in oklch, var(--pessoa-davi) 18%, transparent) }`.
- **View Transitions no mesmo documento** [CONFIRMADO]: `document.startViewTransition()` "Starts a new same-document (SPA) view transition and returns a ViewTransition object"; `view-transition-name` "Specifies the view transition snapshot that selected elements will participate in, which enables an element to be animated separately from the rest of the page during a view transition." BCD `startViewTransition`: Chrome 111, Safari 18, Firefox 144. — https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API · https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/Document.json
  - Leitura: **reordenar com animação sem FLIP à mão** (§5): dar `view-transition-name` ao elemento arrastado e aos irmãos, `startViewTransition(() => parent.insertBefore(el, alvo))`, e o navegador anima posição e tamanho. Mesmo gesto para "desfazer" (o bloco volta deslizando) e para trocar de versão na régua (o que mudou de lugar desliza; o que sumiu esmaece). Respeitar `prefers-reduced-motion` desligando a transição (a página do MDN lida não fala disso; a regra vem do ESTUDO e do PROMPT_AGENTICO).
- **`Element.setPointerCapture`** (BCD: Chrome 55, Firefox 59, Edge 12): o arraste do protótipo escuta `pointermove` no `document`; com captura no elemento, o arraste não se perde quando o ponteiro sai do iframe/da prévia. — https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/Element.json

**→ §13 ("apontar e pedir"): três anterioridades novas**

- **Cursor Design Mode** [CONFIRMADO]: "Design Mode lets you direct agents with visual prompts. From the browser in the Agents Window, you can click an element, draw on the page, or describe a change by voice." "Click any element in the running product to target it." Há multisseleção e desenho sobre a página; "the agent gets the element and its code"; atalho Cmd+Shift+D. A doc não diz como o elemento é mapeado ao arquivo nem exige framework. — https://cursor.com/docs/agent/design-mode · changelog de 27/08/2026: "Cursor now port-forwards your cloud agent's live environment straight to your browser, so you can preview it and use tools like design mode." — https://cursor.com/changelog
- **Chrome DevTools AI assistance (estilo)** [CONFIRMADO]: "Click the **Debug with AI** button next to an element" ou botão direito com prompts prontos; "Autonomously narrows down and selects specific context for you to chat about, such as DOM elements, network requests, performance trace events"; "The agent applies the changes inside DevTools"; "the conversation is paused before the code is executed" (Continue/Cancel); mudanças visíveis no painel **Changes**; e **"With a connected workspace folder, you can save style changes suggested by AI assistance back to CSS source files"** (Apply to workspace → diff → Save all). Requisitos: "experimental and subject to future changes", "at least 18 years old and in one of the supported locations". — https://developer.chrome.com/docs/devtools/ai-assistance/styling · https://developer.chrome.com/docs/devtools/ai-assistance
  - Leitura: é o circuito completo elemento → IA → CSS → arquivo, **dentro do Chrome**, o que confirma que o motor da Tela no Electron (CDP) é o mesmo que o Google usa; a diferença nossa está em HTML (posições por parser), em equipe (autoria por bloco, undo por pessoa) e em português.
- **Figma Make** [CONFIRMADO, página de produto]: "Refine your prototypes by clicking elements to style, swap, or prompt for changes directly in the preview." "Everything you build is code-backed and visually editable, so you can easily jump between code and canvas." Exemplo de prompt sobre elemento: "Make the button glow on hover". "Use Make locally to build in any codebase, then ship right to production. Coming soon." — https://www.figma.com/make/
- **Lovable, barra da prévia (estado de hoje)** [CONFIRMADO, doc relida]: modos "Select elements", "Edit text inline", "Draw annotation", "Add a comment"; "Edit text inline to change words on the page without writing a prompt"; multisseleção "Hold Cmd (Mac) or Ctrl (Windows) and click additional elements"; seleção e anotação consomem créditos; edições inline "100 gratuitas por conta (renovam em 24h)" com teto de 2.000 por workspace/dia; comentários não consomem. **Nenhuma menção a arrastar, redimensionar ou mudar espaçamento direto.** — https://docs.lovable.dev/features/visual-edit
  - Leitura: entre Lovable, v0, Cursor, Figma Make e DevTools AI, **nenhum lido faz arrastar/redimensionar/reordenar direto no preview com escrita no código**; todos param em "texto direto + o resto por prompt". É o espaço que a Tela ocupa (§5, §6) e a razão de ser dos smart guides e das alças.

### 18.2 Correções de peso (medidos hoje na jsdelivr; bruto / gzip)

- **dom-to-image-more 3.10.2 (MIT)**: `dist/dom-to-image-more.min.js` 25.718 / 9.085 (`+esm` 26.113 / 9.751). Mais pesado que o html-to-image (16.337 / 6.594); fica como alternativa, não como escolha.
- **Lexical 0.51.0 (MIT)**: o build de produção `Lexical.prod.mjs` mede 136.658 / 43.719 (o `+esm` da rodada 1 dava 199.787 / 65.598 por incluir o build de desenvolvimento). Ainda o dobro dos "22kb (min+gzip)" da doc; a decisão de não usar na Tela fica.
- **@floating-ui/dom 1.8.0 (MIT)**: UMD completo `dist/floating-ui.dom.umd.min.js` 10.042 / 4.092 (a rodada 1 mediu só a entrada `+esm`, 8.623 / 3.815, sem `core`/`utils`). Continua a menor peça para a barra flutuante.
- **interactjs 1.10.28**: `dist/interact.min.js` 98.203 / 29.027 (confere com a rodada 1).

### 18.3 Armadilhas novas

17. **`computedStyleMap()` não existe no Firefox estável** (só "preview"); no Electron é seguro. Não usar como único caminho no navegador comum.
18. **EditContext não existe em Firefox nem Safari**; Chrome 121+. Só como opção no Electron.
19. **Webstudio é AGPL-3.0-or-later** (com um pacote proprietário sob EULA): como o stagewise, inspirar e não copiar. — https://github.com/webstudio-is/webstudio
20. **O DevTools do Chrome não grava edições do painel Elements no HTML** (só CSS e o que passa pelo Sources): se a Tela usar o CDP para o DOM (`setOuterHTML`, `moveTo`), a gravação no arquivo continua sendo responsabilidade nossa, por offset (§1.4–1.5). Não existe atalho.
21. **`getContentQuads` pode devolver vários retângulos** para inline: um overlay que assume um retângulo por elemento erra em links e `<span>` quebrados em duas linhas.

### 18.4 "O que ninguém fez", corrigido pela revisão 2

- **Corrige o item 1 do §16**: editar HTML/CSS puro visualmente, gravando nos arquivos e sem formato proprietário, **existe** (Pinegrow, desktop pago; e o Dreamweaver antes dele, cuja doc não abriu: 403/404). O Chrome DevTools também grava CSS no arquivo via Workspaces. O que **continua sem anterioridade lida** é a soma: no navegador/Electron, sem build, em equipe (autoria por bloco e desfazer por pessoa vindos do mesmo registro de patches), com o agente no circuito ("apontar e pedir" devolvendo patches por `arquivo:intervalo`), o mapeamento HTML → posição por parser (o próprio Chrome declara não conseguir), e tudo em português.
- **Novo item 8**: **pintar autoria e diff de versões por `::highlight()`** (Custom Highlight API), sem envolver texto em `<span>`: nenhuma ferramenta lida mostra "quem escreveu este trecho" na prévia do site; Figma tem cursor e último editor, Lovable/v0/Cursor não têm autoria por bloco.
- **Novo item 9**: **smart guides e cotas desenhadas pelo próprio Chrome** (`Overlay.highlightRect/Quad`), fora do DOM da página, e **reordenar animado por View Transitions** com o mesmo gesto para desfazer e para andar na régua de versões: as bibliotecas lidas (moveable, interact.js) desenham guias dentro do DOM; Figma/Framer têm as guias, mas não num site real em HTML.
- **Novo item 10**: **arrastar, redimensionar e reordenar no preview com escrita no código**: entre Lovable, v0, Cursor Design Mode, Figma Make e DevTools AI, nenhum lido faz; todos param em texto direto + prompt. A Tela faz e mostra antes de soltar o que vai acontecer (reordenar vs. mover livre, §5).

### 18.5 Fontes da revisão 2

Lidas hoje:
- https://developer.chrome.com/docs/devtools/workspaces
- https://developer.chrome.com/docs/devtools/ai-assistance
- https://developer.chrome.com/docs/devtools/ai-assistance/styling
- https://cursor.com/docs/agent/design-mode
- https://cursor.com/docs/agent/browser (sem design mode; seções: Native integration, Browser capabilities, Session persistence, Use cases, Security…)
- https://cursor.com/changelog (entrada de 27/08/2026)
- https://www.figma.com/make/
- https://docs.lovable.dev/features/visual-edit (relida; barra com quatro modos)
- https://pinegrow.com/ · https://pinegrow.com/docs/ · https://pinegrow.com/docs/getting-started/
- https://github.com/webstudio-is/webstudio
- https://developer.mozilla.org/en-US/docs/Web/API/EditContext_API
- https://developer.mozilla.org/en-US/docs/Web/API/Element/computedStyleMap
- https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API
- https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/EditContext.json · …/api/Element.json (computedStyleMap, setPointerCapture) · …/api/Document.json (adoptedStyleSheets, startViewTransition) · …/api/Highlight.json
- https://raw.githubusercontent.com/ChromeDevTools/devtools-protocol/master/json/browser_protocol.json (relido: getNodeStackTraces, getLocationForSelector, getNodesForSubtreeByStyle, highlightRect, highlightQuad, highlightSourceOrder, startRuleUsageTracking, takeCoverageDelta, trackComputedStyleUpdates, getContentQuads, setEffectivePropertyValueForNode, addRule, setRuleSelector, setMediaText, getAnimatedStylesForNode, setShowViewportSizeOnResize)
- https://cdn.jsdelivr.net/npm/dom-to-image-more/dist/dom-to-image-more.min.js · …/npm/lexical/Lexical.prod.mjs · …/npm/@floating-ui/dom/dist/floating-ui.dom.umd.min.js · …/npm/interactjs/dist/interact.min.js (pesos) · https://registry.npmjs.org/dom-to-image-more/latest · https://registry.npmjs.org/lexical/latest

Não abriram (não viram fato):
- Webflow, cascata de breakpoints: https://university.webflow.com/lesson/intro-to-breakpoints (301 → https://help.webflow.com/hc/en-us/articles/33961300305811, 403) e https://webflow.com/glossary/breakpoints (301 → https://university.webflow.com/glossary/breakpoints, 404).
- Dreamweaver Live View: https://helpx.adobe.com/dreamweaver/using/live-view.html (403), https://helpx.adobe.com/dreamweaver/using/edit-content-live-view.html (404), https://www.adobe.com/products/dreamweaver/features.html (404).
- Pinegrow, páginas internas: /docs/panels-tools/ (404), /docs/panels-tools/code-editing/ (404), /docs/panels-tools/styling-with-css/ (404), /docs/how-to-guides/how-to-edit-your-existing-website-with-pinegrow/ (404); a página "Understanding Pinegrow – Not Just a Design Tool" abriu mas só diz "Pinegrow is not a design tool in the same vein as Figma or Adobe Muse was".
- "Claude Design" (Anthropic): https://www.anthropic.com/news/claude-design (404). **Não confirmado** que exista um produto com esse nome; não entra como fato.
- Figma Make, artigo de ajuda: https://help.figma.com/hc/en-us/articles/31304412302743 (404); ficou a página de produto.
