# TELA_CONSTRUTOR · a Tela como construtor de frontend (aceite A11)

> `docs/design/` · 23/09/2026 · o pedido: "PENSE como fazermos a tela que é o frontend, tipo LOVABLE gerar o site, e no preview poder mexer em todo ele, editar arrastar caixas etc.. mas só que sendo experiência LINDA". Três frentes: `.deus/missao-design/pesquisa/tela-construtores-anterioridade.md` (18 construtores lidos), `tela-experiencia-linda.md` (números de alça, latência, easing, com fonte) e `tela-mecanica-da-edicao.md` (como o pixel vira código em HTML/CSS puro, sem build; 2 rodadas). A casca em que a Tela vive: `docs/design/CONCEITO.md`. Tokens: `docs/design/tokens.css` §13.

---

## 0. Em uma frase

A pessoa pede em português ("faz a landing da clínica com agenda e depoimentos"), o agente escreve **HTML/CSS puro** na pasta dela (a verdade do site é o arquivo, nunca um formato nosso), a aba **Site | Código | 3D** abre no meio e, no **Site**, tudo se mexe com a mão: texto, posição, tamanho, espaço, cor, imagem. O que a mão faz é **grátis, local e instantâneo** e vira código na hora; o que a mão não alcança tem o botão **"Pedir ao agente"** com o bloco já selecionado. Cada bloco leva a **cor de quem mexeu**, toda mudança vira **versão** numa régua que a pessoa arrasta, e "Projetar na TV" leva a mesma prévia para a sala.

O que ninguém lido faz (§10): arrastar, redimensionar e reordenar **direto no preview com escrita no código**. Lovable, v0, Cursor Design Mode, Figma Make e o DevTools AI param em "texto direto + o resto por prompt".

---

## 1. Como o agente gera (o "tipo Lovable")

1. No painel de agentes: "cria a tela Agenda com lista de horários e botão de marcar". O agente escreve `davi/Projetos/Clínicas/agenda.html` (+ `agenda.css` se quiser), com **comentários de uma linha** por seção (`<!-- herói -->`, `<!-- depoimentos -->`), tokens em `:root` (`--cor-marca`, `--espaco`) e sem build.
2. A aba abre atrás; a linha da árvore, a aba e o bloco do painel acendem juntos (lei 3 da casca). Se a pessoa está digitando, a Tela espera ("O agente terminou a tela Agenda · Enter abre").
3. **O agente edita ao vivo com a mesma física da mão** (§4): a pessoa vê o cursor dele levantar e assentar o bloco; nada muda por teletransporte.
4. Cada geração e cada edição do agente vira **bloco ação** no painel (com desfazer = rompe com nome e hora) e **marca na régua de versões** (§6).
5. A Tela sabe qual **Porta** da Máquina cada formulário chama: o fio formulário → Porta → Gaveta aparece no modo 3D e na Ficha (`docs/design/MAQUINA_PECAS.md` §4.11). "Testar" na Máquina faz o pulso sair da própria Tela.

Fronteira explícita, sempre visível: **o que tem alça a mão faz** (texto, ordem, posição, tamanho, margem/padding, cor, imagem); **o que não tem alça, pede** ("põe em duas colunas", "vira acordeão", "um depoimento aqui"). Nenhum gesto de mão gasta crédito nem passa pelo agente (Lovable cobra por apontar e limita o texto inline a 100/dia; Replit e Bolt provam que dá para escrever no código sem IA).

---

## 2. A física da edição (os números, com fonte)

| O quê | Valor | Fonte |
|---|---|---|
| Latência toque → mudança visível | ≤ 100 ms (transição iniciada pela pessoa); evento processado ≤ 50 ms; ≤ 10 ms por quadro | RAIL (web.dev/articles/rail); Nielsen 0,1 s = instantâneo; INP bom ≤ 200 ms |
| Arranque do arraste | **4 px** com mouse · **6 px** com dedo e caneta (distância euclidiana) · **25 px** na barra do bloco no iPad | tldraw `options.ts` (dragDistanceSquared 16/36; coarseDragDistanceSquared) · Apple HIG "about three points" |
| Duplo clique | janela de **450 ms** → entra no texto com o caret **no ponto do clique** (`caretPositionFromPoint`), sem trocar fonte, tamanho, padding ou largura: não pula porque não muda de caixa | tldraw `doubleClickDurationMs` 450; Figma "Double-click… or press the enter key" |
| Toque longo | 500 ms | tldraw `longPressDurationMs` |
| Hover | contorno **1 px** `--t0`; nada mais | Figma "a blue box" |
| Seleção | contorno **2 px** + **8 alças de 8 px** visíveis, área de acerto **12 px** (mouse) / **20 px** (toque); nunca preenchimento nem tint | tldraw `handleRadius` 12 · `coarseHandleRadius` 20; Konva `anchorSize` 10 |
| Barra do bloco | flutua **8 px** fora do bloco (Texto · ↑ · ↓ · Duplicar · Apagar · Cor · Imagem · Pedir ao agente); posicionada por `computePosition` + `flip` + `shift` | @floating-ui/dom 4 KB gz |
| Navegar pela árvore sem painel de camadas | **Enter** desce um nível · **Shift+Enter** sobe · **Tab / Shift+Tab** irmão · ⌘/Ctrl+clique seleciona por dentro | Figma "Select layers and objects" |
| Medir | segurar **Alt** com um bloco selecionado e passar sobre outro: linha de medida + px de vão e margem, em `--tela-medida` (Lc ≥ 60 sobre `--s0`); solta, some | Figma (linha vermelha; não configurável, some em fundo escuro) |
| Snap | guias de 1 px em quatro tipos (centro · borda · tamanho igual · espaçamento igual entre 3+), tolerância **8 px de tela** em qualquer zoom, só contra blocos visíveis; Snap to Grid (8 px) desligado por padrão | tldraw `snapThreshold / zoomLevel`; Keynote e Freeform "as you drag" |
| Rotação | só em imagens e cartões livres; alça 50 px acima; passos de 15° com 5° de tolerância | Konva `rotateAnchorOffset` 50, `rotationSnapTolerance` 5 |
| Levantar | **80 ms** ease-out, `scale(1.01)`, sombra `0 1px 2px → 0 6px 16px`, opacidade **0,9** (o 0,35 de hoje faz o bloco sumir da mão) | Apple HIG drag and drop: "translucent representation" |
| Destino | acende **só enquanto o ponteiro está sobre ele**; no fluxo = linha de inserção ciano de 3 px antes/depois do irmão | Apple HIG |
| Assentar | **160 ms** `cubic-bezier(0, 0, .25, 1)`; irmãos deslizam (FLIP ou View Transitions) em **200 ms**; sem overshoot em lugar nenhum | Carbon ease-out; Atlassian 150–400 ms; Emil Kowalski "shorter than 300 ms, ease-out" |
| Cancelar | volta ao lugar em **200 ms**; nunca "evapora" (o bloco existe no código) | Apple HIG |
| Teclado | setas ↑/↓, Delete, ⌘D trocam **sem transição** | Emil Kowalski "never animate keyboard actions" |
| Multi-seleção | Shift+clique; arrastar em lote com badge de número; Shift+arrastar seleciona por área | Apple HIG (badge oval); Cursor (Shift+drag) |
| Camada de edição | vive **dentro** do iframe do site; `postMessage` só ao soltar, ao sair do texto e ao apagar (nunca no hover/arraste); arraste por `transform` no compositor; `setPointerCapture` para não perder o arraste ao sair do iframe | RAIL; BCD |
| Medidor honesto | "toque → código: 38 ms" em mono, visível **só quando passa de 100 ms** | futurismo = precisão medida (CONCEITO §5) |
| Esconder a camada | ⌘\ (4 dedos no iPad) deixa o site puro, com um ponto de 3 px como único sinal | Procreate (4 dedos) |
| Anotação para o agente | desenhar por cima; some 500 ms depois de enviada; vários comentários fixados em elementos, **um envio só** | tldraw `laserFadeoutMs` 500; pedido nº 165284 do fórum do Cursor, não atendido |

**Reordenar vs mover livre**: no fluxo do documento (flex/grid/blocos), arrastar **reordena** e mostra antes de soltar onde vai cair; mover livre (escrever `position: absolute`) **só** em elementos que já são absolutos, porque o absoluto quebra o responsivo. A Tela diz qual dos dois vai acontecer antes de soltar.

**Texto inline**: `contenteditable="plaintext-only"` no próprio nó (degrau 1; Firefox só a partir do 136), com `beforeinput` filtrando `inputType` para editar dentro de `<strong>`/`<a>` sem perder marcas (degrau 2); EditContext (Chrome 121+, só Electron) como degrau 3 se o IME em pt-BR der problema. Esc volta à seleção; clique fora salva; contorno vira `--ok` enquanto edita.

**Estilos**: durante a edição, uma folha construída (`adoptedStyleSheets`) e tokens; ao salvar, a regra existente recebe o patch (nunca `style=""` inline como resposta padrão). Ao mudar uma cor que vem de `var(--cor-marca)`, a Tela pergunta em uma linha: **"o token (usado em 14 lugares) ou só aqui?"**. Valor validado pelo tipo antes de gravar (`CSS.supports`). CSS de outra origem (Google Fonts, CDN) aparece como "vem de fora" com "copiar para o projeto".

**Responsivo**: a largura da prévia escolhe o breakpoint; a mudança vai para o `@media` certo do arquivo (ou cria um, com comentário); rótulo de largura enquanto se arrasta a borda da prévia; o modo de edição **nasce** responsivo (Lovable e v0 nem abrem em viewport móvel).

**Imagem**: trocar (arquivo da pasta ou upload), cortar (cropperjs, 1,5 KB gz), gerar por IA pelo agente (`docs/design/GERACAO_REPLICATE.md`; a saída expira em 1 h, a Tela baixa e grava no projeto no ato).

---

## 3. Mão × agente: o pacote de contexto do "Pedir ao agente"

Ao apertar "Pedir ao agente" (ou ⌥+clique) com um bloco selecionado, a Tela monta e manda ao painel de agentes, como chip de Puxar (lei 4 da casca):
1. `arquivo:linha:coluna` do elemento e o **trecho de HTML de origem exato** (não o `outerHTML` normalizado), ≤ 2 KB com "… (n filhos omitidos)";
2. o seletor único curto (`@medv/finder`, 1,8 KB gz) e a cadeia de ancestrais (`main > section.precos > .cartao:nth-child(2)`);
3. as regras CSS que casam, com `arquivo:linha` de cada (CDP no Electron; css-tree no navegador) e o `@media` de cada uma;
4. o diff de estilos computados contra um elemento novo da mesma tag (10–30 propriedades, não 300);
5. a caixa (`getBoxModel`/`getBoundingClientRect`), a largura da prévia e um recorte de imagem do elemento (como o v0);
6. o pedido da pessoa em português e a regra de saída: **"responda com patches por arquivo e intervalo, um por mudança, para a Tela aplicar e registrar como comandos desfazíveis com o seu nome"**.

O agente responde em patches; a Tela aplica com a física da mão (§4), cada um vira comando com inverso (desfazer por pessoa) e marca na régua.

---

## 4. O agente editando ao vivo

- **Cursor próprio**: seta na cor do agente (a cor da pessoa dona) + quadrado de 14 px com a inicial + nome em mono 11 px. A etiqueta aparece na ação e some **3 s** depois; o cursor some após **60 s** parado (tldraw: `collaboratorIdleTimeoutMs` 3000, `collaboratorInactiveTimeoutMs` 60000).
- **Mesma física da mão**: o cursor desliza **320 ms** até o bloco (tldraw `animationMediumMs`), contorno na cor do agente, texto/posição mudam com levantar (80 ms) e assentar (160 ms). Nada muda por teletransporte.
- **Seguir** é opcional, por agente, não move a seleção da pessoa e se desfaz ao trocar de aba (Zed pula para cada arquivo; Live Share para ao abrir outro arquivo).
- **Parar**: clique no anel do agente ou Esc para na hora. Se a pessoa está com o caret num bloco, o agente **espera** (nunca escreve em bloco com caret de gente).
- **Prova**: cada edição do agente deixa bloco ação no painel com "Ver antes/depois (Espaço)".

Anterioridade: Figma agent "trabalha ao lado" mas o post não descreve cursor; tldraw fairies são personagens num canvas de desenho; Cursor Design Mode aponta, não edita. **Ninguém lido mostra o agente levantando e assentando um bloco de site real com a física da pessoa.**

---

## 5. Cor de quem mexeu

- **Alça e contorno de seleção são sempre acento do sistema** (`--t0`): cor de pessoa nunca nas alças, para não misturar "selecionado por mim" com "feito pela Rita".
- Fora do modo: **borda esquerda de 3 px** na cor de quem mexeu por último (a mesma fita das peças da Máquina) + nome 11 px no hover. Derivada do histórico de patches (`quem` em cada comando), não de um atributo solto: é o mesmo registro que dá o desfazer por pessoa.
- **"Ver por pessoa"** (alternador no cabeçalho): contorno de 2 px na cor de quem mexeu por último, nome fora do bloco, **idade como opacidade** do contorno (100 % hoje → 30 % em 30 dias, na escala de tempo da casca). O agente é uma "pessoa" nessa gramática.
- **Trechos de texto por pessoa** e diff entre versões pintados por `::highlight()` (CSS Custom Highlight API, Baseline 2025), **sem envolver nada em `<span>`**: o HTML que depois vira patch não fica sujo.
- Conflito: último vence por propriedade, mas toda escrita vira versão; undo por pessoa (`trackedOrigins`, como o Yjs) para o Ctrl+Z de um não desfazer o do outro.

---

## 6. A régua de versões

- **Régua de 1 px** no topo da aba, com marcas de 1 × 6 px por salvamento e por evento (teste passou, publicou, preset salvo, agente terminou), cada marca com a foto ou o quadrado de quem salvou.
- **Hover** = prévia em corte seco (≤ 100 ms); **arrastar o cabo de 8 px** = scrubbing em corte seco (animação entre quadros causa enjoo: MDN); soltar = versão em leitura com **"Voltar como estava"** (cria versão nova, nunca apaga; o Selo da versão desfeita fica rompido com nome e hora) e **"Comparar com agora"**.
- **Comparar** = Magic Move entre duas versões (View Transitions com `view-transition-name` por bloco): blocos comuns deslizam, removidos somem, novos aparecem; casamento por `data-por` + caminho no DOM, com opção por palavra em textos. É o diff para quem não programa.
- **Reverter a tela não reverte o banco**: a Máquina ao lado mostra isso visualmente (a gaveta não volta, a tela volta), o aviso que Lovable e Bolt tiveram de escrever em negrito.
- Mesma régua para Máquina, texto e mapa; retenção total. Precedentes: Figma (checkpoint a cada 30 min, restaurar não destrutivo), JetBrains Local History (rótulos por evento), Windows Recall (régua com prévia por hover).

---

## 7. A mecânica por baixo (HTML/CSS puro, sem build)

O protótipo edita serializando o DOM vivo e gravando o `outerHTML` inteiro; funciona para demonstrar, mas perde a formatação do autor, grava o que os scripts inseriram e não sabe dizer "esse `<h1>` está na linha 42" (o próprio Chrome declara que não consegue levar uma edição do painel Elements de volta ao HTML). Três caminhos que se somam:

1. **Posições no HTML** com `parse5` (`startOffset/endOffset` por nó e por atributo; 26 KB gz), injetadas na cópia servida como `data-bc-loc`, e **patch textual por offset** com `magic-string` (8,6 KB gz) para o arquivo mudar só onde a pessoa mexeu. Nó criado por script (`DOM.getNodeStackTraces`) não tem `data-bc-loc` e aparece como "gerado pelo script X, linha Y".
2. **Estilos** por folha construída + tokens durante a edição; ao salvar, patch na regra (`css-tree` 53 KB gz no navegador; no Electron o CDP dispensa).
3. **No Electron, o Chrome DevTools Protocol** (`webContents.debugger`) entrega pronto o que Figma/Framer reconstroem à mão: overlay de box model (`Overlay.highlightRect/Quad`, fora do DOM da página), modo inspecionar, `CSS.getMatchedStylesForNode` com `range` (arquivo:linha da regra), `CSS.setEffectivePropertyValueForNode`, `CSS.addRule`, `DOM.getBoxModel`, `DOM.getContentQuads` (inline quebrado em duas linhas = dois retângulos), `DOM.moveTo`, `DOM.undo`, `CSS.startRuleUsageTracking` ("esta regra não é usada por nenhum elemento"), `DOM.getNodesForSubtreeByStyle` ("mostrar tudo que usa esta cor"). É o mesmo motor que o DevTools AI do Google usa; a diferença nossa é HTML por posições, equipe e português. `<webview>` do Electron é desaconselhado pela própria doc: `WebContentsView` + `debugger`.

**Conjunto mínimo em JS puro** (≈ 50 KB gz): parse5 + magic-string + @medv/finder + @floating-ui/dom + html-to-image (miniatura de versão, 6,6 KB) + cropperjs; o resto (seleção, overlay, guias, arraste com `pointer*`, alças, comandos com patch inverso) é nosso, porque o `VISUAL` do protótipo já tem 60 % e o que falta cabe em algumas centenas de linhas. `interact.js` (29 KB) só se o arraste com snap ficar caro de manter; `moveable` (78 KB) não. Não copiar: stagewise e Webstudio são AGPL.

---

## 8. `prefers-reduced-motion` (reduzir, não remover)

| Efeito | Equivalente |
|---|---|
| arraste segue o ponteiro | continua (essencial) |
| levantar | sem escala, só a sombra |
| assentar e irmãos | corte seco, com a linha de inserção visível 300 ms a mais |
| encaixe de peça (Máquina) | fade 150 ms |
| cursor do agente | teleporta; etiqueta fica 3 s |
| anel do agente | fixo aberto/fechado |
| Comparar (Magic Move) | antes/depois lado a lado |
| scrubbing | já é corte seco |
| guias e medidas | iguais (não são movimento) |

Substitui o `* { animation-duration: .01ms !important }` do `base.css`, que apaga o feedback de "assentou".

---

## 9. Ligação com a Máquina e com a sala

- O formulário da Tela **sabe** qual Porta chama (`data-porta` ou o `fetch` lido no código): no 3D o fio sai do formulário e, no Testar, o pulso nasce na própria Tela (Enter no login → verde/vermelho no fio, já no protótipo).
- Presets de Tela: os blocos da Supabase UI Library (Realtime Cursor, Avatar Stack, Chat, Dropzone, Auth) entram como presets com Cano e Portaria já ligados.
- **Projetar na TV**: a mesma prévia vai para a sala enquanto o agente edita; a TV mostra a hairline de projeção `--t0` e "Projeção · Davi". Nenhum construtor lido tem "frente da sala".
- **Editar na tela → preset**: "★ Salvar como preset" grava o HTML como preset de Tela (já existe no protótipo), com quem fez e usos.

---

## 10. Anterioridade e o que ninguém combinou

Lidos: Lovable (id por JSX no build; texto inline 100/dia; seleção e anotação consomem crédito; **nenhuma menção a arrastar/redimensionar**), v0 (Design Mode com painel de propriedades; "every design-mode change is diffable, reviewable, and revertable"; não roda em viewport móvel), Bolt (edições visuais grátis, lote que só escreve ao "Save changes"), Replit Design (painel sem crédito; rollback reverte também banco com caixa explícita), Cursor 3 Design Mode (tirou o painel de propriedades; "cancel subscription territory. Bring back the tools."), Onlook (`data-oid` no AST; só Next + Tailwind; "I need to see the hard things"), Webflow (alças de margem/padding com Option/Shift; 7 breakpoints em cascata), Framer (breakpoint herda), Webstudio (tokens em todos os breakpoints; "de onde vem este estilo"; AGPL), Figma Make (cobra crédito até para mexer no painel), Plasmic, Builder.io, Google Stitch, tldraw make real, Relume, Wix Studio, Squarespace, Anima, Locofy, Pinegrow (HTML/CSS puro visual, desktop pago), Chrome DevTools Workspaces e AI assistance, GrapesJS. Fibra do React (`_debugSource`) morreu no React 19.

**Ninguém combina**: (1) alças físicas de margem/padding (Webflow) dentro de um preview gerado por IA; (2) edição direta grátis + versão diffável com antes/depois por edição; (3) "de onde vem este estilo" num site que a IA gerou; (4) **autoria por bloco na prévia (cor da pessoa): zero anterioridade**; (5) desfazer que mostra visualmente que o banco não volta; (6) vários comentários fixados + desenhar por cima, um envio só; (7) breakpoints herdando num site gerado por IA; (8) projetar o preview ao vivo para a sala; (9) peça de backend ligada ao bloco da tela (o fio formulário → gaveta); (10) HTML puro como formato-verdade com o gesto de apontar e pedir, sem exigir Next + Tailwind; (11) edição visual mapeada a `arquivo:linha` por posições do parser, no navegador/Electron, sem build, em equipe, com o agente no circuito devolvendo patches por intervalo; (12) autoria e diff por `::highlight()` sem `<span>`; (13) guias e cotas desenhadas pelo próprio Chrome fora do DOM, e reordenar por View Transitions com o mesmo gesto para desfazer e para andar na régua; (14) o agente com cursor e a física da mão.

---

## 11. Armadilhas (o que quebra se ignorar)

Overshoot e elástico (o "encaixa" atual da Máquina, 700 ms com `cubic-bezier(.2, 1.4, …)`, é o tell nº 1 de template de IA) · opacidade 0,35 no bloco arrastado · animar ações de teclado · Seguir que sequestra · cor de pessoa nas alças · `postMessage` no hover/arraste · cor de medida que some no escuro · reduced-motion zerando tudo · scrubbing animado (enjoo) · cobrar por apontar · barra que dispara arraste no toque · serializar o DOM vivo · `srcdoc` + `allow-scripts` sem `allow-same-origin` (origem opaca) e com os dois (a página remove o sandbox) · `<webview>` do Electron · CSS de outra origem ilegível · `getComputedStyle` devolve resolvido (`1.5rem` vira `24px`) · custom property inválida cai silenciosa · `position: absolute` para obedecer a arraste livre · `style=""` inline como padrão · undo compartilhado sem origem · html-to-image em canvas tainted · Lexical 44 KB gz reais (não 22) · Cursor bug 156586 (retângulo de seleção errado com zoom: recalcular no frame certo, principalmente no 3D) · rascunho usando o banco de verdade (regra 2 do `MAQUINA.md`).

---

## 12. Como testar (para o roteiro)

Playwright, dentro do iframe da prévia: (a) arraste de 3 px não move, de 5 px move (mouse); (b) duplo clique dentro de 450 ms entra no texto com o caret no ponto; (c) soltar um bloco entre dois irmãos reordena o HTML de origem **só** naquele intervalo (diff do arquivo tem uma mudança); (d) Alt + hover mostra a medida; (e) "Ver por pessoa" pinta bordas com a cor de `quem` do último patch; (f) a régua ganha uma marca por salvamento; "Voltar como estava" cria versão nova e não apaga; (g) com `prefers-reduced-motion`, assentar é corte seco e a linha de inserção fica 300 ms a mais; (h) `postMessage` não é enviado durante `pointermove`; (i) o agente editando mostra cursor com nome e a etiqueta some em 3 s.
