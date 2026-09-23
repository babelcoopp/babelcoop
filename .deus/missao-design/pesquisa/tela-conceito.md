# Conceito da Tela · o construtor de frontend do Babel Coop

> 23/09/2026 · consolidação (sintetizador) das três frentes `tela-construtores-anterioridade.md`, `tela-mecanica-da-edicao.md` e `tela-experiencia-linda.md`, lidas por inteiro, sobre o material obrigatório: `docs/MAQUINA.md`, `docs/ESTUDO_DESIGN_2030.md`, `IDEIAS.md` 5.17–5.19 e 15, `prototipo/editor.js` (o `VISUAL`), `prototipo/maquina.js`, `prototipo/explorador.js`, `stack-video-scroll/PROMPT_AGENTICO_LP.md`, e os tokens fechados em `conceito-final.md` / `conceito-final-v2.md`.
> Honestidade de fonte: esta passagem não abriu URL nova. Todo número vem de uma das três frentes (cada uma com a URL lida) ou dos tokens já decididos no conceito; o que é regra própria está marcado **[derivado]**. O que ficou sem confirmação está na seção 18 e não virou fato.
> Pedido literal do Theus: "PENSE como fazermos a tela que é o frontend, tipo LOVABLE gerar o site, e no preview poder mexer em todo ele, editar arrastar caixas etc.. mas só que sendo experiência LINDA".

---

## 0. Resumo em dez linhas

1. **A Tela é a aba do meio quando o que se cria é site.** O agente gera no terminal; a aba vira `Site | Código | 3D` sozinha; "Editar na tela" liga uma camada de traço fino por cima do site real. O nome na interface é **Tela**; "Bancada" (IDEIAS 5.18) fica só nos documentos.
2. **O HTML na pasta da pessoa é a verdade.** Nada de formato próprio, nada de framework obrigatório, nada de build: cada elemento sabe o intervalo de bytes de onde veio (`parse5` → `data-bc-loc`) e cada gesto vira um patch nesse intervalo (`magic-string`). O protótipo v16 serializa o DOM; o app troca por isto.
3. **A mão faz de graça e na hora; o agente entra onde a mão não alcança.** Texto, ordem, tamanho, espaço, cor, imagem: alça, sem IA, ≤ 100 ms até o arquivo. Estrutura ("põe em duas colunas"): ⌥+clique ou "Pedir", com o bloco anexado como `arquivo:linha`. A fronteira é visível: o que tem alça é da mão.
4. **Uma física só, com números:** arranque 4 px (mouse) / 6 px (dedo), duplo clique 450 ms, alça 8 px visível com 12/20 px de acerto, snap 8 px, assentar 160 ms `--ease-saida`, levantar 80 ms, hover 120 ms, sem overshoot em lugar nenhum, teclado sem transição. A mesma física serve a um `<section>` e a uma Gaveta da Máquina.
5. **O overlay é só traço.** Hover 1 px, seleção 1,5 px `--t0` + 8 alças, texto em edição `--ok`, linha de inserção 2 px `--t0`, guias 1 px, cotas em `--texto-90`. Nunca preenchimento, nunca tint, nunca cor de pessoa na alça.
6. **Cada lote de gestos é uma versão** com miniatura, quem fez (círculo = pessoa, quadrado = agente) e antes/depois. A régua de versões abre sob o cabeçalho da aba; hover = prévia em corte seco; arrastar o cabo = scrubbing; "Voltar como estava" cria versão, nunca apaga; "Comparar com agora" anima uma vez. Desfazer é por pessoa (Ctrl+Z nunca desfaz o do Davi) e diz o que volta e o que não volta (a tela volta; a gaveta da Máquina não).
7. **Quem mexeu fica no bloco:** sempre uma borda esquerda de 1 px na cor da pessoa + iniciais no hover; "Ver por pessoa" acende o contorno de 1,5 px na cor de quem mexeu por último, com a idade como opacidade e trechos de texto pintados pela Custom Highlight API (sem `<span>`). O agente é uma pessoa nessa gramática.
8. **O agente edita ao vivo com corpo:** cursor na cor da pessoa dona + quadrado de 14 px com a inicial; desliza 320 ms até o bloco, levanta e assenta com a física da mão, etiqueta some em 3 s, cursor some em 60 s; "Seguir" é opcional e não move a minha seleção; se meu caret está no bloco, o agente espera; clique no anel para.
9. **Responsivo nasce dentro da edição:** três larguras (1280 · 810 · 390); o que se muda a 390 vai para o `@media` certo (ou cria um, com comentário); a ficha diz de onde vem cada propriedade. Os IA-first (v0, Replit, Onlook) nem abrem em viewport móvel.
10. **Anterioridade honesta:** cada peça existe em alguém (Lovable, v0, Bolt, Replit, Cursor, Onlook, Claude Design, Figma Make/Sites, Webflow, Framer, Anima, Pinegrow, GrapesJS, DevTools). A soma (HTML puro sem build + alças físicas + grátis + versão por gesto com antes/depois + autoria por bloco + undo por pessoa + agente com corpo + breakpoint dentro da edição + fio tela → gaveta + projetar na TV) não tem anterioridade lida.

---

## 1. Tese

**A Tela é a prévia do site que devolve cada gesto ao arquivo, com a mesma física para a mão e para o agente.** Ela não é um editor de sites com IA acoplada (Webflow + chat) nem um chat que mostra uma prévia (Lovable): é uma camada de traço fino sobre o site real da pasta da pessoa, em que selecionar, arrastar, redimensionar, trocar texto, cor e imagem gravam um patch de bytes no HTML/CSS na hora, de graça, e em que apontar e pedir manda ao agente o bloco com `arquivo:linha`, o CSS que o veste e a largura da prévia, para ele devolver patches que entram na mesma pilha de desfazer, com o nome dele, na mesma régua de versões e com a mesma marca de autoria que a pessoa deixa.

"Linda" aqui é o que o ESTUDO chama de futurista em 2026: **precisão, materialidade, calma e prestação de contas**. Nada brilha; tudo responde em ≤ 100 ms, assenta em 160 ms sem elástico, mostra a medida quando a pessoa segura Alt e some quando ela solta, e diz em uma linha de onde veio cada estilo e quem mexeu por último.

---

## 2. A cena (do gerar ao publicar)

1. **Criar → Tela.** Rita escreve no terminal: "faz a landing da clínica: herói, três planos, formulário de agendamento". O agente gera `index.html`, `estilo.css`, `tokens.css` (HTML/CSS/JS puro, regras da seção 3). A aba do meio abre em `Site` sozinha (IDEIAS 5.18: a aba troca de forma conforme o agente cria). Cada `<section>` pousa em 180 ms por opacidade, na ordem em que o agente escreveu, com o cursor do agente à vista.
2. **Editar na tela.** Rita aperta `E` (ou o botão "Editar na tela" na barra de verbos). O site não muda de lugar; aparece uma barra de 32 px flutuando sobre o site e o cursor vira seta de seleção. Hover = contorno 1 px. Clique no título = contorno 1,5 px ciano com 8 alças e o chip `h1 · herói`.
3. **Mão.** Duplo clique no título, o caret cai exatamente onde ela clicou, ela troca "Agende online" por "Agende em 30 segundos", clica fora: o arquivo muda (patch de 17 bytes na linha 42), a borda esquerda do `<h1>` ganha 1 px na cor da Rita. Ela arrasta o cartão "Plano Premium" para antes do "Básico": arranque a 4 px, o cartão levanta (sombra, 0,9 de opacidade), a linha de inserção de 2 px aparece entre os irmãos, ela solta, os três cartões deslizam 200 ms, o HTML recebe dois patches (remover trecho, inserir trecho).
4. **Estilo.** Com o botão selecionado ela puxa a alça de padding com Option: os dois lados mudam juntos, a cota `16 → 24` aparece em mono, e a Tela pergunta em uma linha: "mudar só aqui ou o token `--espaco-3` (usado em 14 lugares)?". Ela escolhe "só aqui": a regra `.botao` no `estilo.css` recebe `padding-inline: 24px` na linha certa.
5. **Agente.** Ela seleciona a seção de planos, ⌥+clique, digita "põe os três em duas colunas no celular", Ctrl+Enter. O terminal-instrumento mostra "pensando há 2 s"; o cursor do agente desliza até a seção, a seção recebe o contorno na cor do agente, o CSS ganha um `@media (max-width: 480px)` e o cartão no terminal diz "1 regra criada · 2 reutilizadas · desfazer". Enquanto isso Rita já está editando o rodapé: nada bloqueia.
6. **Versão.** Tudo o que aconteceu desde que ela abriu virou marcas na régua: 4 lotes da Rita (círculo), 1 do agente (quadrado), 1 "teste passou" (do Testar da Máquina, quando o formulário mandou uma linha para a gaveta Agendamentos). Ela arrasta o cabo para trás, vê a tela como estava em corte seco, aperta "Comparar com agora": os blocos comuns deslizam uma vez, o que sumiu some, o que nasceu aparece.
7. **Equipe e sala.** "Ver por pessoa" mostra o herói da Rita, os planos do Davi (ontem, contorno a 70 %) e o rodapé do agente. "Projetar na TV" leva a mesma prévia à sala, ao vivo, enquanto o agente ainda edita. "Salvar como preset" guarda a tela testada com nome e quem fez (IDEIAS 15).
8. **Máquina.** No `3D` ou na Máquina, a Tela é a peça "Tela" do MAQUINA.md: "a tela Agenda usa a porta 'novo agendamento'". O `<form>` selecionado mostra o fio até a Porta e a Gaveta; "Testar" manda um pedido de verdade pela máquina (verde passa, vermelho barra). Nada disso escreve em produção (regra 2 do MAQUINA.md).

---

## 3. Gerar (o que o agente produz e como aparece)

- **Formato de saída fechado**: HTML + CSS + JS puro, sem build, sem framework (PROMPT_AGENTICO seção 2: "LP não precisa de framework"; HN sobre o Onlook: "why couple to Next/React instead of HTML/CSS?"). Um arquivo por página, `estilo.css` por projeto, `tokens.css` com as custom properties (cores, espaços, raios, tipografia). Os tokens vivem também num `DESIGN.md` aberto (formato do Google, com `lint` de contraste e `diff` token a token) que o agente lê antes de gerar e a Tela lê para explicar "de onde vem este estilo".
- **Peças nativas, não HTML opaco** (critério de Framer/Plasmic: "o que a IA gera continua manipulável"): cada bloco de primeiro nível é um `<section>` com classe própria e comentário de uma linha em português (`<!-- herói: promessa + CTA -->`); estilos em regras com seletor curto, nunca inline; imagens como arquivo na pasta (Replicate baixado na hora, nunca `data:` URI, seed no `MANIFESTO.json`); `prefers-reduced-motion` com equivalente estático; alvos ≥ 48 px no celular; gaveta mobile existe (PROMPT_AGENTICO seção 8).
- **Prestação de contas da geração** (Webflow AI Assistant é a única anterioridade): o cartão no terminal lista "regras criadas · regras reutilizadas · tokens usados · imagens geradas (custo)", e o desfazer remove tudo junto. A Tela pinta 6 s (meia-vida curta) o que acabou de nascer, na cor do agente.
- **Montagem à vista**: os blocos pousam na ordem em que o agente os escreveu, 180 ms por opacidade, `--ease-saida`, sem escala e sem overshoot (a mesma "peça pousa" da Máquina na tabela de aceite do conceito v2); o cursor do agente está sobre o bloco que acabou de nascer. Em `prefers-reduced-motion`: aparecem.
- **Contexto que a geração recebe** (Grapes Studio: "giving the model context about what the user is actually looking at" é o que mais muda o resultado): a página atual, a seção selecionada (se houver), o `DESIGN.md`, os presets da equipe e as portas da Máquina que a tela pode usar.
- **Preset**: tela cujo teste passou → "Salvar como preset" (nome, quem fez, quantas vezes usado); entra em Criar como "Começar de um preset" e no terminal como "usa o preset X" (IDEIAS 15).

## 4. Selecionar

| Gesto | Resultado | Número |
|---|---|---|
| passar o mouse | contorno 1 px `color-mix(in oklch, var(--t0) 55%, transparent)`, sem preenchimento | mesmo quadro (≤ 16 ms) |
| clique | seleciona o **bloco** mais próximo com margem ou padding (nunca o `<span>` mais interno; corrige o protótipo) | ≤ 50 ms até o contorno |
| ⌘/Ctrl + clique | alvo exato (o `<span>`, o `<a>`) | |
| Enter · Shift+Enter | desce um nível · sobe um nível (Figma) | sem animação |
| Tab · Shift+Tab | próximo irmão · anterior | sem animação |
| Shift + clique | soma à seleção; a barra mostra só as propriedades comuns; um comando aplica N patches num item de desfazer | |
| arrastar no vazio | marquee por interseção de `getBoundingClientRect()` | arranque 4 px |
| Esc | sai da seleção; segundo Esc sai do modo | |
| Alt (segurar) | cotas: margem, padding e vão até o irmão sob o ponteiro, em mono 11 px `--texto-90`, linha 1 px; solta, some (Figma "measure") | |
| `⌘\` (4 dedos no iPad) | esconde a camada; sobra um ponto de 3 px no canto (DSKY: nada aceso) | |

- **Seleção**: contorno 1,5 px `--t0` (`outline-offset: -1.5px`, o mesmo traço do anel de foco do sistema), 8 alças de 8×8 px (fundo `--s0`, traço 1,5 px `--t0`, raio 2), área de acerto 12 px com mouse e 20 px no toque (tldraw `handleRadius 12` / `coarseHandleRadius 20`). Elementos inline quebrados em duas linhas recebem um retângulo por `getClientRects()`, não um só.
- **Chip do nome**: `h1 · herói` em mono 11 px, `--s2`, borda 1 px `--linha`, 8 px acima e à esquerda do bloco (abaixo se não couber); clique no chip = sobe um nível; clique com Alt = abre o `Código` na linha (Replit: "click the top-left label… to jump to its location in the source code").
- **Barra do bloco** (a "preview toolbar" do Lovable como objeto com corpo): 32 px de altura, `--s2`, borda 1 px `--linha`, raio 6, sem sombra (elevação só pela escada de superfície), 8 px fora do bloco (`@floating-ui/dom`), ícones 14 px em alvos de 24×24 (48 no iPad, com arranque de 25 px para não virar arraste), lembra a posição; mostra **só o que aquele elemento aceita** (Replit/Bolt): Texto · Cor · Espaço · Tamanho · Imagem · Ordem · Pedir. Modo com teclas: `S` selecionar, `T` texto, `D` desenhar área, `C` comentar (as quatro do Lovable, já linguagem comum); nenhum modo trava os outros; Esc sempre descarta.
- **Repetidos**: irmãos com a mesma assinatura (tag + classes + forma da subárvore, ignorando texto e `src`) formam um conjunto; mudar estilo num deles pergunta "aplicar aos 3?" (vai para a classe comum); texto e imagem nunca se propagam (o override do Figma).
- **Nós criados por script** (sem `data-bc-loc`) aparecem com contorno tracejado e o aviso "vem de um script · não dá para editar aqui"; CSS de outra origem (Google Fonts, CDN) = "vem de fora · copiar para o projeto".

## 5. Editar direto (a mão)

### 5.1 Texto
- Duplo clique (janela de 450 ms) põe `contenteditable` **no próprio elemento**, caret no ponto do clique (`caretPositionFromPoint`), sem trocar fonte, tamanho, padding ou largura: não pula porque não muda de caixa **[derivado]**. Contorno vira `--ok`, alças somem, a barra vira Negrito · Link · Pedir.
- Três degraus: folha → `plaintext-only`, patch no nó de texto; com `<strong>/<a>/<em>` → `contenteditable="true"` com `beforeinput` aceitando `insertText`, `deleteContent*` e colagem como texto puro, cancelando `formatBold`, `insertFromDrop` etc., cada nó de texto vira um patch; mudar estrutura (lista, novo parágrafo) → pedido ao agente. Sem Lexical/ProseMirror (43,7 / 31,7 KB gzip para textos curtos).
- Esc cancela (volta ao texto de antes), clique fora ou Ctrl+Enter salva; o patch chega ao arquivo em ≤ 100 ms ao sair; o `postMessage` vai só ao sair, nunca por tecla.

### 5.2 Mover
- Arranque 4 px com mouse, 6 px com dedo ou caneta, distância euclidiana (tldraw; o protótipo usa |dx|+|dy| < 6 igual para todos). iPad: 150 ms + 8 px de tolerância para não confundir com rolagem (dnd-kit).
- Levantar: 80 ms, sombra `0 1px 2px` → `0 8px 20px rgba(0,0,0,.45)`, opacidade 0,9 (o 0,35 do protótipo faz o bloco sumir; a HIG pede translúcido para ver o destino), sem escala. Esta sombra é a única sombra além da paleta Ctrl K e existe só enquanto o bloco está na mão, dentro do conteúdo, nunca na casca **[derivado, com motivo: carrega a informação "levantado"]**.
- Durante o arraste some tudo menos a **linha de inserção** (2 px `--t0`, na largura do irmão, antes/depois pelo meio do irmão, como o protótipo já faz) e as guias. O destino acende só enquanto o ponteiro está sobre ele.
- O que acontece ao soltar depende do **pai**, e a Tela diz antes de soltar: pai em fluxo/flex/grid → **reordenar** (`insertBefore`, dois patches de mover trecho, irmãos deslizam por FLIP em 200 ms `--ease-saida`); elemento já `absolute/fixed` → mover livre com guias (`left/top` na regra); soltar noutro contêiner → reparent com aviso "vai para dentro de `<section> planos`". **Nunca** escreve `position: absolute` por conta própria; "Soltar aqui, fora do fluxo" é opção explícita com aviso (o Ignore auto layout do Figma).
- Guias (Keynote/Freeform/tldraw): 1 px `--t0`, tolerância 8 px de tela, quatro tipos (centro, borda, tamanho igual, espaçamento igual entre 3+), só contra blocos visíveis; grade de 8 px desligada por padrão.
- Assentar: 160 ms `--ease-saida cubic-bezier(.2,0,0,1)`, só `transform` e `opacity`; cancelar (Esc ou soltar fora) volta ao lugar em 200 ms; nunca "evapora" (o bloco existe no código). Setas ↑/↓ reordenam, Delete apaga, ⌘D duplica: sem transição (Emil Kowalski: nunca animar teclado).
- Captura de ponteiro no elemento (`setPointerCapture`) para não perder o gesto ao sair da prévia.

### 5.3 Redimensionar
- 8 alças só no selecionado; Shift trava a proporção; cota ao vivo em mono (`412 × 180`).
- O que se escreve depende do que existe: `width` se a regra tem `width`; imagem com `aspect-ratio` mantém a proporção; bloco em flex recebe `flex-basis`/`max-width`, nunca `width: 412px` (o erro que quebra o celular). Unidade = a da regra original (`%`, `rem`, `px`), convertendo o delta pela largura do pai.

### 5.4 Espaço, cor, tipo
- **Alças de margem e padding no próprio bloco** (Webflow): puxar a borda interna = padding, a externa = margem; Option = lados opostos juntos, Shift = quatro lados; cota em mono. Nenhum IA-first tem isso no canvas.
- **Cor**: paleta = tokens do projeto + cores já usadas no site (Bolt); valor livre só com `CSS.supports` validando.
- **Tipo**: tamanho, peso e fonte dentro da escala do `tokens.css`; fora dela, aviso "fora da escala do projeto".
- **A pergunta do token** (ninguém lido faz): quando o valor vem de `var(--espaco-3)`, uma linha: "mudar só aqui ou o token `--espaco-3` (usado em 14 lugares)?". "Só aqui" = patch na regra do elemento; "o token" = patch no `tokens.css`.
- Durante a edição nada escreve no arquivo: folha construída (`adoptedStyleSheets`) com seletor `[data-bc-loc="…"]`; ao salvar, patch na regra certa (CDP `range` no Electron; `css-tree` `loc` no navegador); se não há regra, cria uma com seletor curto (`@medv/finder`); inline `style=""` só como última saída e com aviso.
- **"De onde vem este estilo"** (Webstudio, painel laranja/azul/rosa do Webflow): a ficha do bloco lista cada propriedade com a origem em uma linha: `cor · .botao · estilo.css:88` · `padding · mudado no celular · @media 480` · `fonte · token --fonte-titulo`.

### 5.5 Imagem
- Clique na imagem: **Trocar** (arquivo → pasta do projeto → patch no `src`, intervalo do atributo), **Cortar** (Cropper.js na proporção do espaço atual → `nome@cortada.webp`), **Pedir à IA** ("tira o fundo", "deixa noturna": `google/nano-banana-2` com `image_input: [a própria imagem]`, baixada na hora como nova versão do arquivo; a original fica no histórico). Nunca `data:` URI. Custo mostrado antes (US$ 0,067 a 1K).

### 5.6 Marcador e lote
- Cada bloco mexido ganha um ponto de 4 px `--t0` no canto do chip enquanto a mudança ainda não virou versão (Bolt); a versão fecha ao apertar Salvar, ao sair do modo ou depois de 2 s sem gesto **[derivado do "Peça pousa: 2 s sem tecla" do conceito v2]**, e a Tela mostra "o arquivo e o que vai mudar" (Anima) numa linha do cartão, não num modal.

## 6. Apontar e pedir (o agente)

- **Gestos**: ⌥+clique no bloco ou botão "Pedir" na barra = anexa o bloco ao campo ❯ do terminal como chip (`h1 · herói · index.html:42`); Shift+arrastar = área desenhada sobre um **frame congelado** da prévia (Cursor); `C` = comentário fixado no elemento; várias anotações num envio só (pedido nº 165284 do fórum do Cursor; Figma Make local); Ctrl+Enter envia; pedidos entram na fila "depois do atual" sem esperar o agente terminar (Lovable). Anotações somem 500 ms depois de enviadas.
- **Pacote de contexto** (o que faz a resposta ser aplicável): (1) `arquivo:linha:coluna` e o trecho de HTML de origem exato (não o `outerHTML` normalizado); (2) seletor curto + cadeia de ancestrais; (3) as regras CSS que casam, cada uma com `arquivo:linha` e `@media`; (4) diff de estilos computados contra um elemento novo da mesma tag (10–30 propriedades, não 300); (5) caixa, largura da prévia ativa e recorte de imagem do bloco; (6) o pedido em português e a regra de saída: **"responda com patches por arquivo e intervalo, um por mudança"**.
- **Resposta**: cada patch vira um comando desfazível com o nome do agente, entra na pilha e na régua como quadrado; o cartão no terminal mostra "1 regra criada · 2 reutilizadas · desfazer" e a prova (miniatura 96×54, peek M7 com Espaço para antes/depois).
- **Fronteira visível**: a barra do bloco só tem "Pedir" onde não há alça; o que tem alça é da mão, na hora, de graça (Replit "deterministic edits… don't consume AI credits"; Bolt "visual edits… free"). O Cursor 3 tirou o painel e ficou só com apontar: "cancel subscription territory. Bring back the tools." Os dois convivem sempre.
- **Custo**: o Babel Coop não tem crédito; o agente roda com as chaves da pessoa. Mesmo assim a diferença é sentida como tempo: a mão é ≤ 100 ms; o agente é "pensando há 4 s" no terminal-instrumento (conceito v2).

## 7. Versões e desfazer

- **Comando** por gesto: `{arquivo, offsetInicio, offsetFim, textoAntes, textoDepois, quem, quando}` com inverso; gestos dentro de 500 ms se agrupam (Yjs `captureTimeout`); **pilha por pessoa** (`trackedOrigins` = eu): Ctrl+Z nunca desfaz o que o Davi ou o agente fez; desfazer o de outro é "Rompido por X · hora · voltou como estava" (vocabulário do conceito v2), sempre como versão nova.
- **Versão** = snapshot dos arquivos + miniatura (`html-to-image` no navegador; `capturePage(rect)` no Electron) + quem + evento. Marcas por: lote de gestos fechado, Salvar, teste passou (Máquina), publicado, preset salvo, agente terminou.
- **Régua**: o botão "Versões (n)" do cabeçalho de 40 px abre, abaixo dele, uma faixa de 24 px: linha 1 px `--linha`, marcas de 1×6 px (círculo 14 px de foto = pessoa; quadrado 14 px com inicial = agente, no hover), cabo de 8 px. Hover numa marca = prévia em **corte seco** (≤ 100 ms); arrastar o cabo = scrubbing em corte seco (animar entre quadros é gatilho vestibular); soltar = versão em leitura com dois botões de texto: **Voltar como estava** (cria versão nova no fim; nada é apagado; Anima marca "(Restored)") e **Comparar com agora** (Magic Move uma vez: blocos comuns deslizam 400 ms `--ease-saida`, removidos somem, novos aparecem; casamento por caminho no DOM + `data-por`; em reduced-motion, lado a lado). A mesma régua serve à Máquina, ao texto e ao mapa. Retenção total.
- **O que volta e o que não volta**: ao restaurar, uma linha diz "volta: index.html, estilo.css · não volta: a gaveta Agendamentos (3 linhas de teste)"; o banco só volta na branch/local, nunca em produção (Replit tem a caixa "Database"; Lovable e Bolt tiveram de avisar em negrito que o banco não volta).

## 8. Responsivo

- Barra da prévia com três larguras: **1280 · 810 · 390** (`Ctrl 1/2/3`), troca em corte seco; a largura ativa vai no chip (`390 · celular`).
- 1280 é o breakpoint **primário** e cascateia (Figma Sites, Framer, Webflow); edição feita a 390 vai para o `@media (max-width: 480px)` que já existe (pelo `conditionText`) ou cria um no fim do CSS com `/* celular · criado pela Tela */`. Texto e ordem no HTML não têm breakpoint; só estilo tem. A ficha diz "esta cor vem da regra base · o padding foi mudado no celular".
- A camada de edição funciona no iPad e no celular: alvos 48 px, alças com 20 px de acerto, barra do bloco com arranque de 25 px. v0 ("not available on mobile viewports"), Replit ("only on web browsers") e Onlook (sem mobile) não fazem.
- Cada geração e cada lote passam pelo `lint` do DESIGN.md (contraste APCA da régua 8) e a Tela marca em `--atencao` o texto que reprova.

## 9. Quem mexeu (cor por pessoa)

- **Sempre**: bloco mexido por alguém = borda esquerda 1 px na cor da pessoa (conceito: "Bloco mexido por alguém = borda 1 px na cor + iniciais"), iniciais mono 11 px no hover; agente herda a cor da pessoa dona e leva o quadrado. Vem do registro de patches (`quem`) e do git quando é código.
- **Ver por pessoa** (botão na barra de verbos): contorno 1,5 px na cor de quem mexeu por último, nome 11 px fora do bloco, **idade como opacidade** (100 % hoje → 30 % em 30 dias, calor do GitLens); trechos de texto por pessoa pela **CSS Custom Highlight API** (`::highlight(davi) { background: color-mix(in oklch, var(--pessoa-davi) 18%, transparent) }`, Baseline 2025), sem `<span>` no HTML. É o único preenchimento do overlay e só existe neste modo.
- **Regra de tintura**: cor de pessoa nunca em alça nem no contorno de seleção (alça e seleção são acento do sistema, `--t0`); cor de pessoa é só "quem mexeu" e "quem está aqui". Conflito na mesma propriedade: último vence (Figma), mas toda escrita vira versão.
- Zero anterioridade em 19 construtores: colaboração é cursor (Onlook, Wix, Builder) ou comentário (Lovable, Claude Design). O protótipo v16 já faz (`data-por` + `box-shadow`).

## 10. Agente ao vivo

- **Corpo**: cursor-seta na cor da pessoa dona + quadrado 14 px (raio 2, contorno 1,5 px, inicial mono 10 px) ao lado, nome em mono 11 px que aparece na ação e some 3 s depois; cursor some 60 s depois de parar (tldraw). Sem bitmap na Tela (conceito v2: bitmap só no Perfil e na parede).
- **Mesma física**: o cursor desliza 320 ms `--ease-saida` até o bloco; o bloco recebe contorno 1,5 px na cor do agente (não `--t0`, que é a minha seleção); texto e posição mudam com levantar/assentar iguais aos da mão; blocos novos pousam em 180 ms.
- **Seguir**: botão de 24×24 no cabeçalho do painel de agentes; opcional, por agente, rola a prévia até o bloco sem mover a minha seleção (M6), desfaz ao trocar de aba (Live Share; o Zed sequestra).
- **Cortesia**: se o meu caret está no bloco, o agente espera e escreve "esperando você sair de `h1 · herói`"; clique no anel de estado para na hora; o que já foi escrito fica como versão e pode ser rompido.
- **Prova**: cada ação do agente na Tela vira cartão com miniatura no terminal (Warp/M7); "Projetar na TV" mostra a prévia com o cursor do agente para a sala.

## 11. O que faz ser linda (números fechados)

| Item | Valor | Fonte |
|---|---|---|
| entrada tratada · resposta visível · quadro | ≤ 50 ms · ≤ 100 ms · ≤ 10 ms de trabalho nosso | RAIL, Nielsen, INP |
| hover → contorno | mesmo quadro (dentro do iframe, sem `postMessage`) | RAIL |
| soltar / sair do texto → patch no arquivo | ≤ 100 ms; medidor "toque → código: 38 ms" em mono só quando passa de 100 ms | Nielsen 0,1 s |
| arranque do arraste | 4 px mouse · 6 px dedo/caneta, euclidiano; iPad 150 ms + 8 px | tldraw `options.ts`, dnd-kit |
| arranque na barra do bloco (iPad) | 25 px | tldraw |
| duplo clique · toque longo | 450 ms · 500 ms | tldraw |
| hover | contorno 1 px `--t0` a 55 % | régua 1 (só traço) |
| seleção | contorno 1,5 px `--t0` + 8 alças 8×8 (acerto 12 / 20 px) | conceito (foco 1,5 px), tldraw |
| texto em edição | contorno 1,5 px `--ok #7fd6a6` | conceito |
| linha de inserção | 2 px `--t0` | protótipo (3 px ciano) ajustado |
| guias | 1 px `--t0`, tolerância 8 px, 4 tipos, só visíveis | tldraw `snapThreshold 8`, Keynote |
| cotas (Alt) | linha 1 px + mono 11 px em `--texto-90` (Lc 77) | Figma measure (vermelho fixo é a armadilha) |
| levantar | 80 ms, sombra `0 8px 20px rgba(0,0,0,.45)`, opacidade 0,9, sem escala | Apple HIG drag |
| assentar · irmãos · cancelar | 160 ms · 200 ms FLIP · 200 ms, `--ease-saida cubic-bezier(.2,0,0,1)` | Atlassian 150–400, Kowalski < 300 ease-out |
| bloco novo pousa (geração e Máquina) | 180 ms opacidade; substitui o `encaixa` de 700 ms `cubic-bezier(0.2,1.4,0.4,1)` do `v3.css` | conceito v2 "Peça pousa" |
| hover/press | `--mov-toque 120 ms` | conceito |
| cursor do agente desliza | 320 ms `--ease-saida` | tldraw `animationMediumMs` |
| etiqueta do agente · presença | some 3 s · 60 s | tldraw |
| anotação enviada some | 500 ms | tldraw laser |
| Comparar com agora (Magic Move) | 400 ms uma vez | Keynote; conceito `--mov-padrao` ampliado ao herói do diff |
| prévia de versão | corte seco ≤ 100 ms; scrubbing corte seco | Recall; MDN vestibular |
| barra do bloco | 32 px, `--s2`, borda 1 px `--linha`, raio 6, 8 px fora do bloco, alvos 24 (48 iPad) | conceito (escada de superfície) |
| chip do nome | mono 11 px, `--s2`, 8 px acima | piso 11 px (HIG) |
| régua de versões | faixa 24 px, marcas 1×6 px, cabo 8 px, avatar 14 px | Figma history, JetBrains, Recall |
| autoria | sempre borda esq. 1 px; Ver por pessoa contorno 1,5 px, opacidade 100 % → 30 % em 30 dias | conceito; GitLens |
| overshoot | nunca (nenhum valor de bezier acima de 1) | Apple "brevity and precision"; impeccable slop |
| teclado (↑/↓, Delete, ⌘D) | sem transição | Kowalski |
| sinais vivos por tela | ≤ 2 (cursor do agente > marcador de lote) | conceito |
| reduced-motion | tabela: arraste segue o ponteiro; levantar só sombra; assentar e irmãos em corte seco com a linha de inserção 300 ms a mais; pousar = aparece; cursor do agente teleporta, etiqueta 3 s; Magic Move = lado a lado; scrubbing já é corte | MDN, WCAG 2.3.3, Apple |

## 12. Mecânica em JS puro (sem build)

1. **Elemento → arquivo:linha**: ao abrir `index.html`, a Estação parseia com `parse5` (`sourceCodeLocationInfo: true`, 26,5 KB gzip, ESM sem `require`), serve uma cópia com `data-bc-loc="inicio-fim"` em cada elemento e o intervalo de cada atributo; o arquivo no disco não muda. É o CHECKLIST 11a. Para React/Vite da equipe, o princípio do `lovable-tagger` (runtime de JSX próprio + `Map` com `WeakRef`, sem atributo no DOM); nunca o fiber (morreu no React 19, PR #28265).
2. **Patch por offset**: `magic-string` (8,6 KB gzip) aplica `overwrite/appendLeft/remove` por intervalo; mover bloco = remover + inserir; texto = patch no nó de texto; `src` = patch no atributo. Preserva indentação, aspas e comentários; o `<h1>` da linha 42 continua na linha 42. **Nunca** `outerHTML` (o WHATWG não garante roundtrip; o Chrome declara que "the final state of the page… may be very different from the HTML that the browser fetched").
3. **Estilos**: durante a edição, folha construída (`adoptedStyleSheets`) + custom properties; ao salvar, patch na regra (`css-tree` `loc` no navegador, 53 KB gzip; no Electron o CDP `CSS.getMatchedStylesForNode` devolve `styleSheetId` + `range` de graça, mais `CSS.setStyleTexts`, `getLocationForSelector`, `setEffectivePropertyValueForNode`); `CSSRule.media`/`conditionText` diz o `@media`; CSS de outra origem lança `SecurityError` e vira "vem de fora".
4. **Prévia**: no navegador, `iframe` com `sandbox="allow-scripts"` (origem opaca) e a camada de edição **dentro** do iframe, `position: fixed; pointer-events: none`, `getBoundingClientRect` + `getClientRects` + `getComputedStyle`, `postMessage` só ao soltar, ao sair do texto e ao apagar; no app, `WebContentsView` + `webContents.debugger` (a doc do Electron desaconselha o `<webview>` que o IDEIAS 5.18 e 15 citam): `Overlay.highlightRect/Quad` e `DOM.getBoxModel` desenham guias e cotas fora do DOM da página; `Overlay.setInspectMode` dá o hover; `DOM.getNodeStackTraces` separa nós criados por script.
5. **Arraste/alças/guias**: código nosso com `pointer*` + `setPointerCapture`; 6 linhas do arrastado contra 6 de cada irmão visível e do pai, `|Δ| ≤ 8 px`; `elementsFromPoint` acha o alvo sob o fantasma; reordenação animada por FLIP (ou `document.startViewTransition` quando houver). `interact.js` (29 KB) só se o snap ficar caro de manter; `moveable` (78 KB) não.
6. **Texto**: `contenteditable` (`plaintext-only` em folha; `beforeinput` + `getTargetRanges` filtrando `inputType` quando há marcas). Sem editor de documento.
7. **Comandos e versões**: comando com inverso, agrupamento 500 ms, pilha por pessoa; snapshot por lote + miniatura (`html-to-image` 6,6 KB; `capturePage` no Electron); diff entre snapshots pinta os elementos cujos intervalos caem no diff; trechos por pessoa e diff de texto pela **CSS Custom Highlight API**.
8. **Imagem**: Cropper.js v2 (1,6 KB de entrada); `nano-banana-2` por `image_input`, download no ato (saídas expiram em 1 h), `MANIFESTO.json`.
9. **Peso do conjunto mínimo**: parse5 26,5 + magic-string 8,6 + @medv/finder 1,8 + @floating-ui/dom 4,1 + html-to-image 6,6 + cropperjs 1,6 ≈ **49 KB gzip**; css-tree (53 KB) só no navegador puro; tudo MIT; nada AGPL (stagewise e Webstudio são; inspiram, não entram).
10. **Rede**: cada patch já carrega `quem` e `quando`; é o mesmo evento que a equipe replica (diário replicado do IDEIAS 15) e que a TV projeta.

## 13. Coerência com o ESTUDO_DESIGN_2030 (régua de 10 pontos e veredito)

| Régua | Como a Tela cumpre |
|---|---|
| 1 · Menos, mas melhor; nada arbitrário | cada traço do overlay carrega informação (hover = "isto é selecionável"; alça = "isto redimensiona"; ponto de 4 px = "ainda não é versão"); sem preenchimento, sem tint, sem painel de camadas permanente (Enter/Shift+Enter/Tab o substituem); barra só com o que o elemento aceita |
| 2 · Sinal/ruído | ≤ 2 sinais vivos; ao arrastar some tudo menos linha de inserção e guias; `⌘\` deixa o site puro com um ponto de 3 px |
| 3 · Calma | nada bloqueia a digitação; fila do agente; modo não trava outros; cotas só com Alt; medidor de latência só quando estoura |
| 4 · Agente presente, opcional, interrompível, rotulado, responsável | cursor com nome e cor do dono; Seguir opcional; clique no anel para; espera se meu caret está no bloco; cartão com "regras criadas/reutilizadas", prova e desfazer; patches com o nome do agente |
| 5 · Motion só com metáfora e dado | levantar/assentar (peso), pousar (a peça chega), deslizar dos irmãos (abrir espaço), Magic Move (o que mudou); zero animação em teclado, troca de largura, troca de aba; sem overshoot |
| 6 · Velocidade é design | ≤ 100 ms da mão ao arquivo; desfazer como rede (pilha por pessoa, versão nunca apagada); "pensando há N s" em vez de spinner |
| 7 · Imposto da novidade | os gestos são os que o mercado já usa (S/T/D/C do Lovable, ⌥+clique do Cursor, alças do Figma, alças de espaço do Webflow, régua do Recall); a novidade fica em como a Tela mostra o que mudou e quem mudou, e no fio tela → gaveta |
| 8 · APCA | `--t0` Lc 70, `--ok` Lc 71, `--texto-90` Lc 77 para cotas; texto gerado passa pelo lint do DESIGN.md; reprovado em `--atencao` |
| 9 · Alvo ≥ 24 px / 48 no iPad | barra do bloco 24×24 (48 no iPad), alças 12/20 px de acerto, arranque 25 px na barra |
| 10 · Tema segue o sistema | o overlay usa só tokens (`--s2`, `--linha`, `--t0`, `--ok`, `--texto-90`); tema claro sai da mesma fórmula |

Veredito sobre a identidade, aplicado: o roxo `#8b5cf6` do `VISUAL` (hover/seleção) **sai**, seleção é `--t0` (o acento); o ciano de inserção continua como `--t0`; nenhum degradê, halo ou glow no overlay; a única sombra é a do bloco levantado, preta e temporária; mono só em cotas, chips, latência e versões; Cormorant nunca no overlay. O overlay não é casca nem conteúdo: é instrumento, e obedece às regras da casca (escada de superfície, sem vidro, sem cartão dentro de cartão).

## 14. Anterioridade (quem faz o quê e a diferença)

| Quem | O que faz | Onde a Tela difere |
|---|---|---|
| **Lovable** (preview toolbar: S/T/D/C; barra que encaixa nos cantos e lê o fundo; fila "runs after the current task"; texto inline 100 grátis/24 h; Select e Draw gastam crédito; `lovable-tagger` mapeia por `jsxDEV` + `WeakRef`) | apontar + pedir, texto direto | mão faz cor, espaço, ordem, tamanho e imagem direto e de graça; HTML puro como verdade; autoria por bloco; versões por gesto |
| **v0 Design Mode** (painel completo, Cmd+I, edições pendentes, Apply = "new chat version… diffable, reviewable, revertable", antes/depois; não abre em mobile) | versão por edição visual | edição no iPad; alças de espaço; undo por pessoa; autoria |
| **Bolt** (edição grátis, tokens só ao salvar, marcador por elemento, lote por página, barra só com o que o elemento aceita, paleta = cores do projeto) | modelo de custo e marcador | os quatro juntos: grátis + marcador + versão com antes/depois + "o arquivo e o que vai mudar" |
| **Replit Visual Editor** (edições determinísticas sem crédito, chip com nome, seções que somem, todas as instâncias, pular ao código; só web) | painel sem IA | mobile; HTML puro; agente com corpo; fio ao backend (Replit separa Design de Build) |
| **Cursor Design Mode** (⌘⇧D, frame congelado, voz, xpath + fiber + captura, várias edições em paralelo; **tirou o painel** no Cursor 3) | apontar ao agente | mantém a manipulação direta; copia frame congelado e paralelismo |
| **Onlook** (`data-oid` por AST, "simulate the change on the iframe and edit the code at the same time", camadas; só Next + Tailwind, sem mobile) | anterioridade mais próxima | sem framework, sem build; responsivo; autoria; agente com corpo |
| **Claude Design** (comentário inline, texto direto, "custom sliders (made by Claude)", handoff; projetos presos ao plano) | knobs fabricados pela IA | knobs aplicados ao HTML real com patch e versão (fase 2); arquivos na pasta da pessoa |
| **Figma Make** (painel Figma, draw, anotações múltiplas, Apply; **crédito por slider**; `.make` fechado) e **Make local** (commits locais, branch, antes/depois, sem crédito no beta) | edição visual que sai como commit | grátis por definição; HTML aberto |
| **Figma Sites / Webflow / Framer** (breakpoint primário cascateia; painel laranja/azul/rosa de origem do estilo; alças de margem/padding com Option/Shift; Webflow AI lista "Classes created/used") | breakpoints e alças físicas | os mesmos mecanismos dentro de um site gerado por IA e escrito em arquivo CSS |
| **Builder Code** (extensão no site rodando, cursores ao vivo, permissões por arquivo, PR) | colaboração como cursor | autoria por bloco, não só cursor |
| **Anima** ("the file and what will change" antes de aplicar; restaurar salva o atual como "(Restored)") | prestação de contas por gesto | integrado à régua e ao undo por pessoa |
| **Plasmic / GrapesJS / Grapes Studio / Webstudio** (HTML-first; "which breakpoint and style source provides its current value") | HTML como verdade; origem do estilo | sem trazer 294 KB de construtor; com agente |
| **Pinegrow** (desktop, abre e grava HTML/CSS padrão, sem formato próprio) | edição visual de HTML puro em arquivo | sem build, dentro da Estação, em equipe, com agente, patch por offset, português |
| **Chrome DevTools** (Workspaces grava CSS, não o DOM do painel Elements; AI assistance; CDP com `range` por regra) | o motor no Electron | exposto a um time de empresa, em português |
| **tldraw / Figma agent / Zed / Live Share** (agente com corpo; seguir; etiqueta na ação) | presença de agente | agente com a física da mão num site real que vira código |
| **Recall / JetBrains Local History / Figma history** (régua com prévia; rótulo por evento; checkpoint não destrutivo) | régua de versões | régua com scrubbing num editor de site e de backend, com Magic Move |
| **Protótipo v16** (`VISUAL`: clique/arraste/duplo clique/Delete, `data-por` + `box-shadow`, serialização do DOM) | já faz a metade | troca a serialização por patch por offset; corrige física (0,35 → 0,9; 700 ms overshoot → 180 ms; arranque 4/6 px; reduced-motion por tabela) |

**O que não tem anterioridade lida (a soma):** HTML puro sem build como verdade + alças físicas de espaço + tudo direto e grátis + versão por gesto com antes/depois e "o que vai mudar" + autoria por bloco e por trecho na prévia + undo por pessoa + agente com corpo e a mesma física + breakpoint dentro da edição + "de onde vem este estilo" com a pergunta do token + peça de backend ligada ao bloco (fio `<form>` → Porta → Gaveta) + projetar ao vivo para a sala + restaurar que diz o que volta e o que não volta.

## 15. O que NÃO tem

- Crédito ou cobrança por gesto; painel que some em favor de "apontar e pedir" (Cursor 3); modo que trava os outros até enviar.
- Serialização do DOM (`outerHTML`) como gravação; `position: absolute` escrito por arraste; `style=""` inline como padrão; `width: 412px` em bloco flex.
- Framework obrigatório, build, Tailwind, formato de arquivo próprio, projeto preso a plano; leitura do fiber do React; `<webview>` do Electron.
- Preenchimento, tint, halo, glow, degradê, vidro ou sombra colorida no overlay; cor de pessoa em alça ou seleção; overshoot/elástico; animação em teclado; crossfade ao trocar largura ou aba; morph; painel de camadas permanente; rotação (v1); grade obrigatória.
- Seguir que sequestra a seleção; agente que escreve onde há caret de gente; toast; spinner; medidor de latência permanente.
- Rascunho gravando no banco de produção (regra 2 do MAQUINA.md); restaurar que promete voltar o banco; versão apagada ao restaurar.
- Editor de documento (Lexical/ProseMirror) para textos curtos; `moveable` (78 KB); GrapesJS inteiro (294 KB); qualquer AGPL.
- Edição só no desktop: a camada nasce no iPad e no celular.
- Vocabulário de spec na interface (Bancada, Campo, Mesa, visada, trava, meia-vida): na tela é "Tela", "Editar na tela", "Versões", "Ver por pessoa", "Pedir", "Projetar na TV".

## 16. O que muda no protótipo v16 (lista curta)

1. `serializar()` → patch por offset (`parse5` + `magic-string`), `data-bc-loc` na cópia servida.
2. `ok(ev.target)` → "bloco mais próximo com margem/padding"; ⌘+clique = exato; Enter/Shift+Enter/Tab.
3. Hover/seleção `#8b5cf6` → `--t0`; texto `#22c55e` → `--ok`; inserção 3 px `#22d3ee` → 2 px `--t0`; alças 8 px.
4. Arranque `|dx|+|dy| < 6` → euclidiano 4 (mouse) / 6 (toque), `pointerType`.
5. `[data-bc-drag]{opacity:.35}` → opacidade 0,9 + sombra; assentar 160 ms; irmãos por FLIP.
6. `.mq-peca.nova { animation: encaixa .7s cubic-bezier(.2,1.4,.4,1) }` (v3.css:259) → 180 ms opacidade `--ease-saida`.
7. `base.css` reduced-motion 0,01 ms global → tabela de equivalentes (seção 11).
8. `data-por` + `box-shadow: inset 4px` → borda esquerda 1 px + iniciais no hover; "Ver por pessoa" com contorno 1,5 px + opacidade por idade + Custom Highlight.
9. `postMessage` no `input` → só ao sair do bloco; comandos com inverso e `quem`; régua de versões.
10. Barra da prévia com 1280/810/390 e escrita no `@media`.

## 17. Fatias de construção (ordem que prova cedo)

1. **Mapear e gravar**: `parse5` → `data-bc-loc` → patch de texto e de `src`. Evidência: trocar o título e ver só a linha 42 mudar no git.
2. **Seleção e física**: hover, seleção, alças, arranque, levantar/assentar, reordenar com FLIP, teclado sem transição. Evidência: mover o cartão e o HTML receber dois patches.
3. **Estilo com origem**: folha construída, patch na regra, pergunta do token, alças de espaço, ficha "de onde vem". Evidência: padding só aqui vs. no token.
4. **Versões e undo por pessoa**: comandos, régua, prévia, Voltar, Comparar. Evidência: Ctrl+Z da Rita não desfaz o do Davi.
5. **Apontar e pedir**: chip, área, anotações múltiplas, pacote de contexto, patches de volta com nome do agente, cursor do agente. Evidência: "põe em duas colunas" vira `@media` e cartão com desfazer.
6. **Responsivo e equipe**: três larguras, `@media`, Ver por pessoa, Projetar na TV, fio tela → gaveta com Testar da Máquina.

## 18. Não confirmado (não virou fato)

- Regra de cascata de breakpoints do Webflow (403/404), Live View do Dreamweaver, preservação de formatação do Pinegrow (páginas internas 404), Canva, Framer fit/fill/fixed, Spline gizmos, tokens do Material 3, guias "amarelas" do Keynote (a página não cita cor), "handles de 8 px" e "tinted overlays" do Figma (sem página), "medidas em rosa" (o Figma documenta vermelho), box model laranja/verde/azul do Webflow.
- Regras marcadas **[derivado]** nesta consolidação: caret sem pulo por `contenteditable` no próprio elemento; sombra do bloco levantado como exceção; fechamento do lote em 2 s; chip com clique = sobe um nível.
- A cota de WebSearch estava esgotada nas frentes 2 e 3; tudo foi por leitura direta de URL. "Não vi" não é "não existe".

## 19. Fontes principais (as ~200 estão nos três cadernos)

Lovable preview-toolbar.md · registry/unpkg lovable-tagger · v0 design-mode.md · Bolt visual-edits.md e rollback · Replit visual-editor.md e task-system.md · Cursor design-mode.md, changelog 3.0 e fórum (search.json, threads 157074/158818/165284/165970/167292/156586) · Onlook README, `parser/src/ids.ts`, HN 44127653/44128635 · Anthropic Claude Design + HN 47806725/48128003 · Figma help (42009840449175, 35895705647127, 31242824165143, 360040449873, 360039956974, 360038006754, 360040451373, 360038662654) · Figma blog (make-now-on-your-local-code, multiplayer, how-multiplayer-works, figma-agent) · Webflow help (33961243177875, 33961300305811, 34205154436243, 38840145286035) · Framer academy (breakpoints, stacks) e features/ai · Plasmic app-hosting · Builder llms.txt · Google DESIGN.md (blog + README) · tldraw make-real, `options.ts`, `SnapManager.ts`, fairies (gitnation) · Anima preview/version-history/capture-elements · Grapes Studio HN 45449958 · Webstudio design-tokens.md · React PR 28265 · click-to-component issues · code-inspector `constant.ts` · Pinegrow · parse5 (ParserOptions, ElementLocation, +esm) · htmlparser2 · magic-string · css-tree · @medv/finder · @floating-ui/dom · html-to-image · cropperjs v2 · immer patches · Yjs UndoManager · MDN (outerHTML, iframe, adoptedStyleSheets, computedStyleMap, contenteditable, getTargetRanges, EditContext, View Transitions, elementsFromPoint, Custom Highlight API, conditionText, matchMedia, prefers-reduced-motion) e browser-compat-data · WHATWG serialising · CSSOM cssRules · Chrome DevTools (workspaces, css, flexbox, ai-assistance/styling) · devtools-protocol `browser_protocol.json` · Electron (debugger, web-contents-view, webview-tag) · Replicate nano-banana-2 llms.txt · web.dev RAIL/INP · NN/g response times · Apple HIG (drag-and-drop.json, motion.json), WWDC 2018 803 · Konva Transformer · dnd-kit sensors · Keynote/Freeform guias · Procreate interface · Emil Kowalski · Atlassian motion · Carbon `_motion.scss` · Motion Reorder · Keynote Magic Move · Zed agent-panel · Live Share follow · Google Docs show editors · GitLens heatmap · JetBrains Local History · Windows Recall · WCAG 2.3.3 · interact.js (snapping, resizable) · SortableJS · FLIP (aerotwist) · ProseMirror guide · Lexical intro.
