# Frente: minimalismo para times de empresa

> Missão de design do Babel Coop · 23/09/2026 · pesquisa com WebSearch + WebFetch; cada achado traz a URL efetivamente lida.
> Regra: o que não consegui ler está marcado como **não lido** e não vira afirmação. "Não sei" vale mais que inventar.
> Material obrigatório lido antes de pesquisar: `PROMPT_AGENTICO_LP.md`, `BRIEFING_IA.md`, `docs/UX_PENEIRA.md`, `docs/FUNCOES.md`, `prototipo/base.css`, `prototipo/v3.css`.

## 0. Ponto de partida (o que o design novo tem de respeitar)

- **Não sai nada pedido** (`UX_PENEIRA.md` §7 e `FUNCOES.md`): Estação estilo VS Code, terminal à direita com agentes de nome humano, navegador com Raio-X, Criar (Tela/Máquina/Pesquisa), mapa mental, quadro, projetos, WhatsApp, Loja, demandas com cronômetro, tarefas com fluxo, metas, chat, reunião com memória da sala, acervo, sonho, perfil com gamificação, equipe com cuidado, token, Oficina, TV sem botão, iPad à parte, cores por pessoa, foto de quem salvou.
- **A peneira já decidiu** (§3–§5): uma casa por coisa; barra de 16 para 12 ícones; 46 textos de ajuda somem; barra de status só com o que muda; marca d'água e "b" gigante saem; neon é identidade fixa, não botão; receitas do terminal por contexto; apresentação do agente uma vez só.
- **Identidade atual** (`base.css`): fundo `#060b16`, casco `#0a1221`, elevado `#101a2c`, texto `#d7e4fb`, apagado `#8799bc`, fraco `#5a6a8c`, acento `#8670ff`, violeta `#9160ec`, ciano `#29ccec`; degradê roxo→azul→ciano; IBM Plex Sans (UI, 13px/1.45), JetBrains Mono (terminal, chips, rótulos 10.5px), Cormorant Garamond (`--fonte-fala`); `prefers-reduced-motion` já zera toda animação (0.01ms).
- **Regras do Theus para geração por IA** (`PROMPT_AGENTICO_LP.md`): keyframe antes de vídeo; ícone nasce SVG nativo (`recraft-v4-svg`), família inteira numa leva, `currentColor` no traço; seed fixa; loop com `last_frame = first_frame`; outputs da Replicate expiram em 1 h; orçamento é limite duro; `prefers-reduced-motion` entrega estado final estático; **"um efeito só entra se for metáfora do serviço"**; no máximo 2 efeitos simultâneos por dobra.

O que segue é a régua externa: o que 2024–2026 diz sobre densidade, legibilidade, hierarquia, silêncio, motion, tipografia, paleta e acessibilidade em ferramenta de uso diário, e o que cada ponto implica para **esquerda (arquivos e opções) · meio (trabalho) · direita (terminal com agentes)**, mais TV e celular quando muda algo.

---

## 1. Fundamentos que não envelhecem

### Achado 1 · Dieter Rams: "Nada pode ser arbitrário" é literalmente o pedido do Theus
**Fato.** Os dez princípios, no texto da Vitsœ: bom design é inovador, torna o produto útil, é estético, torna o produto compreensível ("It clarifies the product's structure. Better still, it can make the product talk"), é discreto ("Products fulfilling a purpose are like tools. They are neither decorative objects nor works of art"), é honesto, é duradouro ("It avoids being fashionable and therefore never appears antiquated"), é minucioso até o último detalhe ("Nothing must be arbitrary or left to chance. Care and accuracy in the design process show respect towards the user"), é ecologicamente responsável, é o mínimo design possível ("Less, but better – because it concentrates on the essential aspects").
**Fonte.** https://www.vitsoe.com/gb/about/good-design
**Por que importa.** "Cada traço milimetricamente pensado" (Theus) = princípio 8. "Futurista sem forçar" = princípios 5 e 7: o futurismo que envelhece é o decorativo; o que dura é o que explica a estrutura.
**Aplicação.** Esquerda: a árvore e as opções são "ferramenta", sem enfeite; cada linha, cada ícone tem função declarada. Meio: o produto "fala" pela estrutura, não por texto de ajuda (bate com a peneira, 46 textos fora). Direita: o terminal é honesto sobre o que o agente fez e vai fazer (não promete "inteligência" que não tem). Teste de aceite: para cada elemento visual gerado por IA (fundo, ícone, logo), uma linha dizendo qual função ele cumpre; sem linha, não entra.

### Achado 2 · Nielsen: as 10 heurísticas continuam iguais desde 1994 e foram revisadas em 30/01/2024
**Fato.** "the 10 heuristics themselves have remained relevant and unchanged since 1994. When something has remained true for 26 years, it will likely apply to future generations of user interfaces as well." Página com "Last reviewed Jan. 30, 2024". Heurística 8: "Interfaces should not contain information that is irrelevant or rarely needed." Heurística 6: "Minimize the user's memory load by making elements, actions, and options visible." Heurística 7: atalhos escondidos do novato aceleram o expert.
**Fonte.** https://www.nngroup.com/articles/ten-usability-heuristics/
**Por que importa.** A peneira já usa Nielsen como régua (§1.7). O design novo não pode trocar reconhecimento por "mistério futurista": ícone sem rótulo, estado invisível, saída de emergência escondida.
**Aplicação.** Esquerda: barra de atividades com rótulo ao passar o mouse e nome sempre visível no celular (reconhecer, não lembrar). Meio: estado do sistema visível (salvo/não salvo, quem está vendo, versão). Direita: "desfazer" em todo cartão (controle e liberdade), "parar" no meio de ação longa (falta apontada na peneira §6). Atalhos (Ctrl+K, Ctrl+B, Ctrl+`) continuam como caminho do expert, mostrados na paleta para o novato aprender.

### Achado 3 · Heurística 8 em detalhe: cada unidade extra de informação compete com a relevante
**Fato.** "a minimalist design, according to this heuristic, is one that limits the amount of 'noise' an interface has in order to emphasize necessary information"; "Every extra unit of information in an interface competes with the relevant units of information and diminishes their relative visibility"; recomenda "progressively disclosing features or information as it is needed, rather than showing it all at once". (24/01/2021)
**Fonte.** https://www.nngroup.com/articles/aesthetic-minimalist-design/
**Por que importa.** Minimalismo não é flat nem "pouca cor": é razão sinal/ruído. O fundo gerado por IA, a logo animada e os efeitos são **ruído** por definição, a menos que carreguem informação (estado, lugar, identidade de quem fez).
**Aplicação.** Esquerda: só o que muda ganha cor (foto de quem salvou, "recebido de", ponto de presença); o resto é cinza. Meio: fundo neutro absoluto no editor; qualquer textura gerada por IA fica atrás de conteúdo vazio, nunca atrás de texto. Direita: o terminal mostra o pedido, o cartão do resultado e o "desfazer"; a "apresentação do agente" some depois da primeira vez (peneira §3, última linha).

### Achado 4 · Efeito estético-usabilidade: bonito perdoa erro pequeno, não erro grande
**Fato.** "The aesthetic-usability effect refers to users' tendency to perceive attractive products as more usable." Limite: "A pretty design can make users forgiving of minor usability problems, but not of large ones." (03/02/2024, revisado 01/09/2026)
**Fonte.** https://www.nngroup.com/articles/aesthetic-usability-effect/
**Por que importa.** Um design "futurista, reino, ufologia" bem feito vai mascarar nos testes os problemas pequenos, e não vai salvar os grandes (cronômetro que some, demanda sem dono, agente que falha sem próximo passo). Ordem: primeiro a peneira (funções e redundâncias), depois a pele.
**Aplicação.** Nos testes de UX (roteiro em `docs/testes/roteiro.js`), medir tarefa e tempo, não só nota de 0 a 10: a nota vai subir com a estética independentemente do que melhorou.

---

## 2. Densidade

### Achado 5 · Densidade = valor dividido por tempo e espaço, não "quantidade de coisa na tela"
**Fato.** Matthew Ström separa densidade visual ("puts a lot of stuff on the screen"), informacional (Tufte: "Every bit of ink on a graphic requires reason. And nearly always that reason should be that the ink presents new information"), de design (proporção de decisões estritamente necessárias), temporal ("The amount of things a user can do in a given amount of time") e de valor: "UI density is the value a user gets from the interface divided by the time and space the interface occupies."
**Fonte.** https://mattstromawn.com/writing/ui-density/ (redirecionado de matthewstrom.com; o ensaio não traz data no corpo)
**Por que importa.** Dá o critério para julgar as três colunas sem cair em "mais compacto = melhor" nem "mais ar = melhor". Uma coluna densa e lenta é pouco densa em valor; uma coluna vazia e instantânea também.
**Aplicação.** Esquerda: alta densidade informacional (árvore, pessoas, presença) com decisões de design mínimas (um tipo de linha, uma altura). Meio: densidade de valor vem de abrir em <100 ms e de não repetir o que a esquerda já diz. Direita: cada linha do terminal precisa "apresentar informação nova" (Tufte); eco do que a pessoa digitou + cartão de resultado; sem banner, sem receita fixa (peneira §3).

### Achado 6 · Cloudscape (AWS): "comfortable" por padrão, "compact" como opção, e a pessoa escolhe
**Fato.** "Comfortable is the standard density level of the system, active by default. It optimizes content consumption and readability"; "Compact is an additional density level for data intensive views... reducing the space between elements"; "the spacing scale is reduced in increments of 4"; "Ensure users can always switch between comfortable and compact mode"; "Always set comfortable mode as default... Compact mode can hinder readability, overwhelm, and prolong content consumption"; "Don't apply compact mode to individual pages or standalone components".
**Fonte.** https://cloudscape.design/foundation/visual-foundation/content-density/
**Por que importa.** Um time de 11 tem gente de terminal e gente de WhatsApp. Densidade é preferência de pessoa, não decisão do designer, e precisa ser um sistema (escala de 4px), não ajuste por tela.
**Aplicação.** Uma escala de espaçamento em múltiplos de 4 (o `PROMPT_AGENTICO` pede múltiplos de 8 para LP; para app, 4). Duas densidades globais na Estação, trocadas na engrenagem da pessoa. Cuidado (armadilha): a tentação de "esquerda compacta, meio confortável, direita compacta" viola o "não aplicar por componente"; se for feito, que seja uma regra de sistema declarada (densidade por região), não exceção por tela.

### Achado 7 · Linear, 12/03/2026: a lateral ficou mais escura para o meio prevalecer; "estrutura se sente, não se vê"
**Fato.** "The navigation sidebar used to appear bright enough that it remained visually prominent even after a user had reached their destination"; agora "a few notches dimmer, allowing the main content area—where users work—to take precedence". Dois princípios: "Don't compete for attention you haven't earned" (elementos de apoio devem "recede") e "Structure should be felt not seen" ("By rounding out their edges and softening the contrast"). Paleta foi "from a cool, blue-ish hue" para "a warmer gray that still feels crisp, but less saturated". Reduziram "icon usage, scales their sizes down, and removes unnecessary visual treatments like colored team icon backgrounds"; abas "more compact rather than spanning the full width of the screen".
**Fonte.** https://linear.app/now/behind-the-latest-design-refresh
**Por que importa.** É a melhor referência de 2026 para exatamente o layout do Babel Coop: uma lateral que informa sem competir com o trabalho. E é a evidência de que o "azul frio" de fundo (o `#060b16` do Babel é azul-marinho) tende a ser trocado por cinza quente nos produtos mais copiados hoje.
**Aplicação.** Esquerda: um degrau mais escura que o meio (hoje é o contrário: casco `#0a1221` sobre fundo `#060b16`, a lateral é mais clara que o chão). Meio: a superfície mais clara da Estação; é onde a luz está. Direita: idem à esquerda, mas com a identidade do terminal (degradê) contida no cabeçalho, não no fundo inteiro. Testar uma variante do fundo puxada para cinza quente mantendo o roxo→ciano como acento; medir com APCA (achado 11) antes de decidir.

### Achado 8 · Linear, redesign (parte II): tema inteiro com 3 variáveis (base, acento, contraste) em LCH
**Fato.** "we returned to a more neutral and timeless appearance... by limiting how much chrome (blue in our case) was used"; migraram para "LCH color space" por ser perceptualmente uniforme; um "contrast variable which defines how contrasty a theme should be" que permite "automatically include super high-contrast themes for accessibility"; de "98 specific variables for each theme" para "three: base color, accent color, and contrast"; "Inter Display to add more expression to our headings while maintaining their readability".
**Fonte.** https://linear.app/now/how-we-redesigned-the-linear-ui
**Por que importa.** Resolve de uma vez: tema escuro, tema claro, alto contraste e **cor por pessoa** (função que não sai) com uma só regra em vez de 98 tokens. A "cor da pessoa" vira o parâmetro de acento em LCH com luminância fixa, e o contraste é um número.
**Aplicação.** Reescrever `base.css` com `oklch()`: base (o `#060b16` ou o cinza quente), acento (roxo→ciano) e contraste. Esquerda: chips e avatares por pessoa derivados por LCH com mesma luminância (hoje cada cor por pessoa é um hex solto). Meio: tema claro sai de graça. Direita: o terminal usa o mesmo sistema, com acento = agente.

### Achado 9 · Stripe Dashboard (análise externa; o Sail é privado): hierarquia por tipografia e espaço, cor só para estado
**Fato.** "Visual hierarchy is enforced through typography and whitespace, not colour"; "Colour is reserved for status signals: green for succeeded, red for failed, yellow for pending"; "keep the colour palette narrow so that a red indicator always means attention required"; "restrained type scale with 6 distinct sizes and weights"; navegação "maps to jobs-to-be-done, not to Stripe's internal data model"; "show exactly what you need to act, not everything they could show". O portfólio do ex-líder do Sail confirma só o escopo: "Creating a customizable design system for Stripe products, internal tools, and embedded surfaces" (2020–2024), sem tokens públicos.
**Fonte.** https://www.925studios.co/blog/stripe-dashboard-design-breakdown (análise de terceiros) · https://portfolio.chsmc.org/sail
**Por que importa.** O Babel Coop tem quatro cores de estado (`--ok`, `--atencao`, `--alarme`, `--sem-dado`) e mais roxo, ciano, violeta, cor por pessoa e cor por agente. Se tudo tem cor, nada é alarme.
**Aplicação.** Regra: **cor semântica só para estado** (ok/atenção/alarme/sem-dado); identidade (roxo→ciano) só em superfícies de marca (cabeçalho do terminal, logo, TV); cor de pessoa só em avatar, chip e borda de "quem mexeu". Esquerda: a árvore em cinza, ícones por tipo em um só tom. Meio: a escala tipográfica com no máximo 6 tamanhos. Direita: os agentes se distinguem por nome + foto de letra, não por seis cores de aba.

---

## 3. Legibilidade em tela escura e clara

### Achado 10 · NN/g: modo claro lê melhor; escuro por escolha, nunca por imposição
**Fato.** "light mode leads to better performance most of the time"; "we don't recommend switching to dark mode by default if your target audience includes the general population"; "some people with visual impairments will do better with dark mode"; "designers allow users to switch to dark mode if they want to"; "applications meant for long-form reading... should offer a dark-mode feature". (02/02/2020)
**Fonte.** https://www.nngroup.com/articles/dark-mode/
**Por que importa.** O Babel Coop é escuro por identidade (`color-scheme: dark` fixo). Para empresários lendo README, ata, PDF e planilha o dia inteiro, o meio precisa de um modo claro, senão o desempenho de leitura cai e ninguém percebe (a NN/g nota que as pessoas não reportam a diferença que medem).
**Aplicação.** Tema claro completo (sai de graça com o achado 8) e, como possibilidade nova, **meio claro com esquerda e direita escuras** (ver "o que ninguém fez"). A TV continua escura: é distância, não leitura longa.

### Achado 11 · Apple HIG, Dark Mode: não crie ajuste próprio de aparência; teste nos dois modos; 4.5:1 mínimo, 7:1 alvo
**Fato.** "Avoid offering an app-specific appearance setting" ("they may think your app is broken because it doesn't respond to their systemwide appearance choice"); "Ensure that your app looks good in both appearance modes"; "Test your content to make sure that it remains comfortably legible in both appearance modes... with Increase Contrast and Reduce Transparency turned on"; "In rare cases, consider using only a dark appearance in the interface. For example... immersive media viewing... lets the UI recede"; "make sure the contrast ratio between colors is no lower than 4.5:1. For custom foreground and background colors, strive for a contrast ratio of 7:1."
**Fonte.** https://developer.apple.com/tutorials/data/design/human-interface-guidelines/dark-mode.json (endpoint de dados da própria HIG; a página HTML é renderizada por JS)
**Por que importa.** A Estação é Electron no Mac: seguir a aparência do sistema é o esperado. E a única exceção que a Apple admite para "só escuro" é mídia imersiva, que é o caso da **TV**, não da Estação.
**Aplicação.** Estação e celular: seguem o sistema (`prefers-color-scheme`), com possibilidade de fixar. TV: sempre escura, com razão declarada. Alvo de contraste 7:1 para texto do meio; 4.5:1 para o resto.

### Achado 12 · Material (codelab oficial): superfície `#121212`, texto a 87 % / 60 % / 38 %, saturadas "vibram" no escuro
**Fato.** "the bottom-most layer of the interface is typically a dark gray with the hex value #121212"; "High-emphasis text has an opacity of 87%, while medium emphasis text is applied at 60%, and disabled text uses an opacity of 38%"; "More saturated colors tend to visually 'vibrate' against darker backgrounds, making them harder to read"; variantes mais claras "so that your color system can remain expressive and maintain appropriate contrast without causing eye strain". O artigo do Google Design confirma a razão dos cinzas: reduzir "eye strain and pixel-bleed" e usar cores "desaturated, but still expressive".
**Fontes.** https://codelabs.developers.google.com/codelabs/design-material-darktheme · https://design.google/library/material-design-dark-theme
**Por que importa.** O fundo do Babel (`#060b16`) é bem mais escuro que `#121212` e o ciano `#29ccec` é saturado: exatamente a combinação que "vibra". O texto `#d7e4fb` já não é branco puro (certo).
**Aplicação.** Esquerda e direita: ciano e roxo saturados só em áreas pequenas (ponto, borda, traço de ícone), nunca em texto corrido nem bloco. Meio: três níveis de ênfase de texto (alto/médio/desabilitado) mapeados para `--e-texto`, `--e-apagado`, `--e-fraco`, com valores medidos (achado 13). Considerar subir o chão de `#060b16` para algo perto de `#0e1219`–`#121212` para reduzir "pixel bleed" e ganhar espaço para elevação; testar na TV separadamente (lá o preto profundo funciona).

### Achado 13 · APCA: WCAG 2 superestima contraste perto do preto; níveis Lc para texto em fundo escuro
**Fato.** "WCAG 2.x contrast cannot be used for guidance designing 'dark mode'" porque "4.5:1 can be functionally unreadable when one of the colors in a pair is near black". Níveis: Lc 90 "Preferred level for fluent text and columns of body text"; Lc 75 "The minimum level for columns of body text"; Lc 60 "minimum... for content text that is not body"; Lc 45 "minimum for larger, heavier text (36px normal weight or 24px bold) such as headlines"; Lc 30 "absolute minimum for any text... placeholder text and disabled element text"; Lc 15 "absolute minimum for any non-semantic non-text... anything below this level as invisible". Recomenda que "the user is able to choose at least one light mode or one dark mode color scheme".
**Fonte.** https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html
**Por que importa.** Com fundo `#060b16` (quase preto), a razão 4.5:1 do WCAG 2 pode dar "passa" para um cinza ilegível. É o caso de `--e-fraco #5a6a8c` em rótulos de 10.5px. **Não medi**: a execução do script de contraste foi negada nesta sessão; os valores precisam ser conferidos em https://apcacontrast.com/ antes de fixar tokens.
**Aplicação.** Tabela de aceite por coluna: corpo do meio ≥ Lc 75 (ideal 90); rótulos da esquerda e linhas do terminal ≥ Lc 60; placeholder e desabilitado ≥ Lc 30; linhas divisórias (`--e-linha #1b2640` sobre `#060b16`) ≥ Lc 15 ou são invisíveis (hoje provavelmente estão perto disso; medir).

### Achado 14 · Apple HIG, Tipografia: mínimo 10 pt no Mac / 11 pt no iPhone; evitar pesos Light/Thin; poucas famílias
**Fato.** Tabela de tamanhos: iOS/iPadOS padrão 17 pt, mínimo 11 pt; macOS padrão 13 pt, mínimo 10 pt; tvOS padrão 29 pt, mínimo 23 pt. "Prefer Regular, Medium, Semibold, or Bold font weights, and avoid Ultralight, Thin, and Light"; "Minimize the number of typefaces you use, even in a highly customized interface"; "Adjust font weight, size, and color as needed to emphasize important information and help people visualize hierarchy"; "Test legibility in different contexts."
**Fonte.** https://developer.apple.com/tutorials/data/design/human-interface-guidelines/typography.json
**Por que importa.** Os rótulos do protótipo estão em 10.5px (≈ 7.9 pt) e `kbd` em 10.5px: **abaixo do mínimo do Mac**. No celular, 11 pt = ~14.7px. Na TV (tvOS: mínimo 23 pt) o painel precisa de outra escala, não a da Estação reduzida.
**Aplicação.** Escala única em px com piso: Estação 11px (rótulo mono em caixa alta pode ficar em 11px por causa do tracking), corpo 13–14px; celular piso 14px; TV piso 30px. Três famílias é o teto (Plex Sans, JetBrains Mono, Cormorant), e a Cormorant só em display (achado 17).

---

## 4. Hierarquia e tipografia

### Achado 15 · Vercel/Geist: "simplicidade, minimalismo e velocidade" vindos do design suíço; a mono nasceu primeiro
**Fato.** "Geist embodies our design principles of simplicity, minimalism, and speed, drawing inspiration from the renowned Swiss design movement"; a família começou pela Mono, "a monospace version that prioritized readability and seamlessly integrated into coding environments", e depois veio a Sans. O sistema é "Typeset with Geist Sans and Geist Mono" e tem "A high contrast, accessible color system".
**Fontes.** https://vercel.com/font · https://vercel.com/geist/introduction
**Por que importa.** Mostra o padrão dominante de ferramenta para dev/empresa em 2026: uma sans neutra + uma mono com papel fixo (código, IDs, versões, atalhos, terminal). O Babel já tem isso (Plex Sans + JetBrains Mono); o que falta é a **regra de quando usar mono**, hoje usada também para rótulos, chips, números e nível de perfil.
**Aplicação.** Mono só para: terminal, comandos `coop`, atalhos (`kbd`), versões ("v22"), tempos do cronômetro, IDs de demanda, nomes de arquivo. Rótulos de seção (`.rotulo`) e chips voltam para a sans em caixa alta com tracking, para a mono manter significado ("isto é máquina").

### Achado 16 · JetBrains Mono: altura de x maximizada, ovais quase retangulares, ligaduras, OFL
**Fato.** "Characters remain standard in width, but the height of the lowercase is maximized"; "The shape of ovals approaches that of rectangular symbols. This makes the whole pattern of the text more clear-cut"; ligaduras para reduzir ruído em operadores; "5 weights with matching italics"; "JetBrains Mono is free & open source".
**Fonte.** https://www.jetbrains.com/lp/mono/
**Por que importa.** Confirma que a escolha atual para a coluna direita é adequada para leitura longa de terminal em tamanho pequeno (a altura de x alta é o que permite 12–13px legíveis).
**Aplicação.** Direita: JetBrains Mono 12.5–13px, entrelinha 1.5, ligaduras ligadas só no terminal real (podem confundir em nomes de arquivo). Esquerda/meio: não usar mono abaixo de 11px.

### Achado 17 · Cormorant Garamond é família de display: hairlines "luminosas em display viram quebradiças em corpo"
**Fato.** README oficial: "Cormorant is a free display type family developed by Christian Thalmann", 45 arquivos, 9 estilos, 5 pesos, SIL OFL. Análise de pareamento: "extreme thick-thin contrast, tall ascenders and calligraphic swash alternates"; "hairlines that look luminous at display sizes turn brittle at body sizes on screen"; feita "for a title page or a wedding invitation, not a printed novel"; par ideal é "low-contrast, even-toned sans-serifs" que fiquem legíveis "at 16–19 pixels"; "The two fonts are never fighting for the same job".
**Fontes.** https://github.com/catharsisfonts/cormorant · https://bonfx.com/what-fonts-go-with-cormorant-garamond/ (terceiros)
**Por que importa.** A Cormorant é a "voz" do Babel (`--fonte-fala`) e é o elo natural com REINO (guildas, duques, reis: serifa clássica). Mas só funciona grande. Usada pequena em tela escura, os traços finos somem e viram exatamente o "futurista que não se lê".
**Aplicação.** Cormorant só ≥ 24px e peso Medium/Semibold (a Apple manda evitar Light): título do dia em Meu dia, nome do projeto, frases da TV (ideia falada, sugestão da sala, comemoração), o "b" da logo. Nunca em botão, chip, árvore, terminal. É o par serifa+mono de 2026 (a Creative Boom registra a tendência de famílias com serifa expressiva e variantes mono, achado 18): Cormorant fala, JetBrains executa, Plex trabalha.

### Achado 18 · Fontes variáveis como princípio e pesos intermediários (Linear usa Inter Variable em 400/510/590/680)
**Fato.** Creative Boom (18/09/2025) apresenta "variable font technology" com eixos "Weight, Width, and Italic" como "fundamental principle" das famílias de 2026 (GT Flexa), e famílias com larguras "Mono, Standard and Extended" (GT Pressura). Observação de terceiros sobre o produto Linear: "Inter Variable — weights 400, 510, 590, 680"; motion "100ms ease-out" (rápido) e "250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)" (padrão).
**Fontes.** https://www.creativeboom.com/tools/top-50-fonts-in-2026/ · https://www.designsystems.one/design-systems/linear (terceiros; valores lidos do produto). **Não lido:** Kittl "Why variable fonts are winning in 2026" (403).
**Por que importa.** Fonte variável = um arquivo, pesos fracionários (510 em vez de 500) para acertar o peso ótico em tela escura (texto claro sobre escuro parece mais grosso; um peso intermediário compensa). Cormorant e JetBrains Mono existem em versão variável no Google Fonts; **não verifiquei** se a IBM Plex Sans do Google Fonts é variável, conferir antes de fixar.
**Aplicação.** Carregar as três famílias como variáveis, self-hosted, com `font-display: swap` e `preload` (regra do `PROMPT_AGENTICO`). Peso do corpo em tema escuro ~ 420–450; em tema claro 400. Esperar `document.fonts.ready` antes de qualquer máscara de linha (regra já existente).

---

## 5. Motion: Material 3 Expressive × Apple HIG (2025–2026)

### Achado 19 · Apple HIG, Motion: sete regras, todas na direção "menos e opcional"
**Fato.** "Add motion purposefully, supporting the experience without overshadowing it. Don't add motion for the sake of adding motion. Gratuitous or excessive animation can distract people and may make them feel disconnected or physically uncomfortable"; "Make motion optional... avoid using it as the only way to communicate important information"; "Aim for brevity and precision in feedback animations... it can often convey information more effectively than prominent animation"; "In apps, generally avoid adding motion to UI interactions that occur frequently"; "Let people cancel motion... don't make people wait for an animation to complete"; "Consider using animated symbols where it makes sense."
**Fonte.** https://developer.apple.com/tutorials/data/design/human-interface-guidelines/motion.json
**Por que importa.** É a tradução, em norma de plataforma, da regra do Theus: "um efeito só entra se for metáfora do serviço". A regra "evitar motion em interação frequente" mata a maior parte do que uma IA geradora vai propor (hover brilhando, abas deslizando, terminal "digitando").
**Aplicação.** Esquerda: zero animação em abrir pasta, trocar atividade, filtrar (frequentes). Meio: transição de aba instantânea; animação só no "pin + troca de camada" quando muda de projeto (raro). Direita: o estado "pensando" do agente vira **símbolo animado** discreto (ícone SVG com traço se desenhando, `stroke-dashoffset`, como o `PROMPT_AGENTICO` §6.3 já prescreve), grande o suficiente para ser visto (falta apontada na peneira §6c), e cancelável ("parar").

### Achado 20 · Material 3 Expressive: 46 estudos, 18.000 pessoas, até 4× mais rápido para achar o elemento, mas com ressalvas claras
**Fato.** "46 separate research studies with hundreds of designs, and more than 18,000 participants from around the world"; "Participants were able to spot key UI elements up to four times faster in the M3 Expressive designs"; preferência de "up to 87% — among 18-to-24-year-olds". Ressalvas do próprio Google: "What works in a media player or email app might not be suitable for something like a banking interface"; álbuns "arranged helter-skelter" pareciam modernos mas "usability scores suffered"; "removing text labels from email actions resulted in decreased usability"; "it was impacted by users' lack of familiarity". Sobre o sistema de springs, só consegui trechos indexados de m3.material.io (a página é renderizada por JS): esquema **Expressive** com "lower damping, resulting in noticeable overshoot and bounce... well-suited for hero moments"; esquema **Standard** com "higher damping for a more subdued motion with minimal bounce... appropriate for utilitarian applications where a calmer feel is preferred".
**Fontes.** https://design.google/library/expressive-material-design-google-research (lida) · https://m3.material.io/blog/m3-expressive-motion-theming e https://m3.material.io/styles/motion/overview/how-it-works (**não lidas**; só trechos do índice de busca)
**Por que importa.** Expressivo funciona para **achar** coisas (hierarquia por forma, tamanho e cor) e para público jovem; falha quando tira rótulo ou embaralha. Para uma ferramenta diária de empresa, o próprio Material aponta o esquema "Standard, calmo, utilitário". O "Expressive" fica para momentos-herói.
**Aplicação.** Motion do Babel Coop em dois esquemas nomeados nos tokens: `--mov-padrao` (mola amortecida, 100–200 ms, sem overshoot) para tudo; `--mov-heroi` (com overshoot leve) só em três momentos: abertura da Estação (logo), meta a 100 % (comemoração, já pedida) e "ideia salva". Nunca tirar rótulo de ação em nome do expressivo. Na TV, o expressivo cabe mais (distância, leitura de relance): o painel que gira pode usar transição com forma.

### Achado 21 · Liquid Glass 2025→2026: o vidro custou legibilidade e a Apple recuou (transparência menor, borda escura, controle)
**Fato.** Críticas em 2025: "a transparência em certos elementos de interface tornava o texto mais difícil de ler", em especial "sob luz solar direta". Na WWDC 2026 (10/06/2026), para iOS 27 / macOS 27: "A new transparency slider in Settings, which allows the look of Liquid Glass to be adjusted anywhere from ultra clear to fully tinted"; "Apple has adjusted Liquid Glass so it more effectively diffuses complex content, improving readability throughout the system"; "a darkened edge around Liquid Glass elements, along with brighter specular highlights"; "A uniform toolbar now appears across the top... keeping text legible while improving contrast".
**Fontes.** https://www.macrumors.com/2026/06/10/how-liquid-glass-is-changing-in-ios-27/ · https://en.wikipedia.org/wiki/Liquid_Glass
**Por que importa.** "Futurista" em 2025 virou sinônimo de vidro; um ano depois a maior empresa de design do mundo reduziu o vidro por legibilidade. Se o Babel Coop usar translucidez (paleta de comandos, cronômetro flutuante, cartões sobre fundo gerado por IA), precisa nascer com a correção de 2026: opacidade alta, borda escura, `backdrop-filter` só com fallback opaco, e respeitar Reduce Transparency.
**Aplicação.** Paleta Ctrl+K e cronômetro flutuante: fundo ≥ 92 % opaco, borda 1px mais escura que o fundo, blur ≤ 12px. Fundos gerados por IA nunca atrás de texto de trabalho. Na TV, vidro pode (não há leitura longa).

### Achado 22 · `prefers-reduced-motion`: reduzir e trocar, não apagar; WCAG 2.3.3 pede desligar o que é acionado por interação (parallax)
**Fato.** MDN: a media feature detecta "a setting on their device to minimize the amount of non-essential motion"; animações de "scaling or panning large objects can be vestibular motion triggers"; o exemplo oficial troca um `pulse` de escala por um `dissolve` de opacidade, e a recomendação é "Tone down the animation to avoid vestibular motion triggers". WCAG 2.3.3 (AAA): "Motion animation triggered by interaction can be disabled, unless the animation is essential"; "The impact of animation on people with vestibular disorders can be quite severe... nausea, migraine headaches, and potentially needing bed rest"; exemplo: "Parallax scrolling".
**Fontes.** https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion · https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
**Por que importa.** O `base.css` atual zera **tudo** a 0.01ms no modo reduzido. Isso apaga também o feedback útil (o ponto do agente deixa de indicar "pensando"). O padrão certo é substituir movimento por opacidade e manter o estado final legível (é o que o `PROMPT_AGENTICO` §8 já pede: "entrega o frame final").
**Aplicação.** Uma tabela de "equivalente sem movimento" por efeito: pulso do agente → alternância de opacidade lenta; traço do ícone se desenhando → ícone pronto; logo animada → último frame; parallax de fundo (se existir) → estático. Nada de fundo em movimento atrás da coluna do meio em nenhum modo.

---

## 6. Silêncio de notificação

### Achado 23 · Calm Technology (Amber Case): o mínimo de atenção; informar pela periferia; funcionar quando falha
**Fato.** Princípios, no texto da autora: "Technology should require the smallest possible amount of attention"; "Technology can communicate, but doesn't need to speak"; "A calm technology will move easily from the periphery of our attention, to the center, and back"; "A person's primary task should not be computing, but being human"; "Think about what happens if your technology fails"; "Slim the feature set down so that the product does what it needs to do and no more"; "Slowly introduce features so that people have time to get accustomed to the product".
**Fonte.** https://caseorganic.com/post/principles-of-calm-technology/
**Por que importa.** Dá o modelo de três colunas como **três anéis de atenção**: meio = centro; esquerda e direita = periferia; TV = periferia da equipe; celular = só o que precisa chegar. E "funcionar quando falha" cobre a falta que a peneira §6a apontou (o agente falha e não dá próximo passo).
**Aplicação.** Esquerda: presença e "quem está no meu terminal" como luz de periferia (ponto, cor), sem texto piscando. Direita: o agente "comunica sem falar": estado por símbolo, resultado por cartão, voz de texto só quando a pessoa pediu. TV: nunca alarme sonoro; a "sugestão de ideia" é faixa fina que some em 30 s (já é assim). Regra de falha: toda ação do agente tem "se falhar, mostra X e oferece Y".

### Achado 24 · VS Code (regra oficial de extensões): notificar "só quando absolutamente necessário", uma por vez, progresso na barra de status
**Fato.** "Respect the user's attention by only sending notifications when absolutely necessary"; "Show one notification at a time"; não "Send repeated notifications", não "Use for promotion", não "Ask for feedback on the first install"; "progress is best kept within context (within a view or editor)"; notificação global de progresso "should be used as a last resort"; progresso de baixa prioridade vai para a status bar. Áreas oficiais: Activity Bar, Primary Sidebar, Secondary Sidebar, Editor, Panel, Status Bar; para a Activity Bar: não "Duplicate an existing icon", usar "a clear, obvious name for the View Container".
**Fontes.** https://code.visualstudio.com/api/ux-guidelines/notifications · https://code.visualstudio.com/api/ux-guidelines/overview · https://code.visualstudio.com/api/ux-guidelines/activity-bar
**Por que importa.** O Babel Coop copia a gramática do VS Code; então herda a regra de silêncio dele, que é mais dura que a maioria dos SaaS. E a barra de status enxuta da peneira (§4, última linha) é exatamente "progresso na status bar".
**Aplicação.** Uma notificação por vez, no canto, com ação ou nada. Coluna de novidades (sino) é a casa de tudo que não é urgente. Progresso do agente (montando Máquina, navegando) fica **dentro** da coluna direita, não em toast. Celular: só demanda para mim, menção e "ideia da sala"; o resto espera a Estação.

### Achado 25 · NN/g: indicador ≠ validação ≠ notificação (2024) e os cinco erros de push (2018)
**Fato.** Indicador: pista visual "para atrair a atenção dos usuários para um conteúdo ou elemento de interface dinâmico", passiva, sem ação exigida; validação: erro de entrada, exige ação; notificação: "mensagens informativas que alertam o usuário sobre ocorrências gerais em um sistema", podem não estar ligadas ao que a pessoa fez; "Escolher o método errado prejudica a experiência". Push: "Sending burst notifications" e "Making it difficult to turn off notifications" estão entre os cinco erros; recomenda "send fewer notifications in a meaningful way" e permitir configurar dentro do app.
**Fontes.** https://www.nngroup.com/articles/indicators-validations-notifications/ · https://www.nngroup.com/articles/push-notification/
**Por que importa.** Hoje o protótipo mistura os três: contadores (indicador), "Confirma? [s/N]" (validação) e avisos na TV (notificação) usam formas parecidas. Separar as formas é o que deixa o sistema calmo sem esconder nada.
**Aplicação.** Esquerda: só indicadores (badge numérico no ícone, ponto de presença). Meio: validações inline (no campo), nunca em toast. Direita: o "Confirma? [s/N]" é validação e fica no fluxo do terminal. TV e celular: só notificações, com regra de rajada (juntar em uma) e configuração por pessoa em Equipe → Regras.

---

## 7. Velocidade como forma de minimalismo

### Achado 26 · Superhuman: regra dos 100 ms, alvo interno < 50 ms, "animações mínimas para não perder tempo"
**Fato.** "The 100ms rule states that every digital interaction should be faster than 100ms" (Paul Buchheit: "the threshold where interactions feel instantaneous"); "Superhuman Mail treats the 100ms rule as the maximum, and actually aims for latency less than 50ms"; renderizador "can show emails in 1-2 Chrome frames! (<32 ms)"; "preloads and prerenders the email threads that you're most likely to view soon"; "Gestures are also made easier or avoided altogether in favor of keyboard shortcuts"; "Superhuman Mail uses minimal animations, so no time is wasted on loading them".
**Fonte.** https://blog.superhuman.com/superhuman-is-built-for-speed/
**Por que importa.** Densidade temporal (achado 5): o minimalismo que o empresário sente é o de não esperar. E dá o argumento contra animação de entrada em tudo: cada 200 ms de transição é 200 ms de espera, dez mil vezes por dia.
**Aplicação.** Metas: trocar de atividade, abrir arquivo do disco local, abrir a paleta e ecoar o comando no terminal em < 100 ms; pré-renderizar a próxima aba provável. Direita: eco otimista do pedido (aparece antes de o agente responder) com "desfazer" como rede. Esquerda: árvore sem animação de expandir.

---

## 8. Exemplos: o que cada um faz de específico

### Achado 27 · Notion (análise de terceiros, 13/05/2026): "complexidade progressiva", tela calma
**Fato.** "One of Notion's greatest UX strengths is progressive complexity. The product begins simple. Then complexity appears gradually as users gain confidence"; "users encounter whitespace, simple typography, and a calm editing experience"; "A cluttered interface increases cognitive load".
**Fonte.** https://raw.studio/blog/how-notion-ux-converts-100-million-users (terceiros)
**Aplicação.** Meio: o editor começa "papel" (só o texto); barra de ferramentas aparece ao selecionar; "Site | Código | 3D" e "Editar na tela" ficam num só alternador, discreto até o mouse chegar. Primeira abertura = uma linha ("Você entrou. A equipe te vê. Comece por…"), como a peneira §5 já propõe.

### Achado 28 · Craft: "a interface fica mínima até você precisar"; nativo e rápido
**Fato.** "The interface stays minimal until you need it"; "Use `/` to bring up the slash menu"; "It's fast, offline-capable, and beautiful in a way that makes you want to open it"; "Craft doesn't have plugins. It's intentionally simple." Reconhecimento: Mac App of the Year 2021 (Apple) e German Design Award em UX interativa aparecem nos resultados de busca, mas **as duas páginas não abriram** (403 e 404), então fica como indicação, não como fato lido.
**Fonte.** https://www.hackdesign.org/toolkit/craft/ (terceiros)
**Aplicação.** Meio: menu de barra ("/") no editor de nota e no quadro, em vez de barra de ferramentas fixa. Esquerda: o "+ Nota · + Mapa · + Quadro" (que a peneira já tirou do meio) vira um só "+" com menu.

### Achado 29 · Things 3: "cada animação tem propósito", campos "guardados no canto até você precisar", ícones vetoriais que escalam juntos
**Fato.** Página oficial: "those fields are neatly tucked away in the corner until you need them. There are no distractions here"; "each animation is purposeful"; "it smoothly transforms into a clear white piece of paper, ready for your thoughts"; "Design Is Not an Afterthought. It's a way of building apps". Blog (06/09/2023): "The app now uses vector graphics for all icons, and we've fine-tuned the layout so that everything scales together beautifully."
**Fontes.** https://culturedcode.com/things/features/ · https://culturedcode.com/things/blog/2023/09/things-big-and-small/
**Aplicação.** Meu dia: um "papel" com Hoje / Esta noite (o Babel tem expediente com pausa automática) / Próximos; campos de prazo, estimativa e prioridade escondidos até o toque. Ícones da barra em SVG nativo gerados numa só leva (regra do `PROMPT_AGENTICO`), com traço em `currentColor`, para escalar da Estação ao celular sem redesenhar.

---

## 9. Acessibilidade de alvo e toque

### Achado 30 · WCAG 2.5.8 (AA): 24×24 px é o piso, com cinco exceções
**Fato.** "The size of the target for pointer inputs is at least 24 by 24 CSS pixels, except when:" spacing (círculo de 24px sem interseção), equivalent, inline ("in a sentence or its size is otherwise constrained by the line-height"), user agent control, essential. Nível AA. Os 44 pt (Apple) e 48 dp (Material) apareceram só em resumos de terceiros na busca; **não li** as páginas de origem sobre isso, então trato 44/48 como prática de mercado, não como citação.
**Fonte.** https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
**Por que importa.** Uma barra de atividades densa e um terminal com "×" de 14px (o `.term-x` atual) falham no piso. O `PROMPT_AGENTICO` §8 já exige ≥ 48px no celular e ação primária na zona do polegar.
**Aplicação.** Estação (mouse): nada abaixo de 24×24 clicável, com espaçamento de 4px entre alvos (regra do círculo); fechar aba e fechar agente ≥ 24px. Celular e iPad: 48px. TV: não tem alvo (sem botão).

---

## 10. Paleta que não é "azul de startup"

### Achado 31 · "Mais de 70 % das SaaS usam azul"; manter a âncora e mover o acento; acento é "pontuação, não parágrafo"
**Fato.** "Over 70% of the SaaS brands still use blue as their primary brand color"; "the color that once helped brands stand out now helps them disappear"; regra "Keep an anchor, move the accent"; acentos vibrantes funcionam como "punctuation, not paragraphs". Uma das quatro paletas propostas para "agentic AI platforms" é "Digital Twilight": `#2C2A72`, `#8C7AE6`, `#D9DCE3`.
**Fonte.** https://tentackles.com/blog/b2b-saas-color-palettes-2026-that-stand-out (blog de agência; opinião de mercado, não pesquisa)
**Por que importa.** O Babel já está fora do azul de startup pelo roxo→ciano; o risco agora é o oposto: o degradê virar "parágrafo" (fundo inteiro do terminal, cronômetro, botões, títulos), como já aconteceu no protótipo (v3.css tem o degradê em texto de versão, cronômetro, botão de atualizar, cartões). Linear (achado 7) e Stripe (achado 9) mostram o mesmo movimento: neutro quente + um acento.
**Aplicação.** Âncora = superfícies neutras (testar cinza quente vs. azul-marinho atual, com APCA); acento = roxo→ciano em traços finos (borda de projeção na TV, traço do ícone ativo, o "b" da logo, o cursor do agente); cor por pessoa em LCH com luminância fixa; cor por estado só ok/atenção/alarme. Orçamento de cor por tela: no máximo um acento de identidade visível de cada vez na Estação.

---

## 11. Síntese por coluna

| | Esquerda (arquivos e opções) | Meio (trabalho) | Direita (terminal com agentes) |
|---|---|---|---|
| Papel de atenção (23) | periferia: presença, o que mudou | centro | periferia ativa: o que o agente está fazendo |
| Luminância (7, 12) | um degrau mais escura que o meio | superfície mais clara; tema claro disponível | igual à esquerda; identidade no cabeçalho, não no fundo |
| Densidade (5, 6) | alta em informação, mínima em decisões; escala de 4px | confortável por padrão; compacta por escolha da pessoa | linhas de terminal 12.5–13px mono, entrelinha 1.5 |
| Tipografia (14–18) | Plex Sans 12–13px; rótulos sans caixa alta ≥ 11px | Plex Sans 13–14px; Cormorant ≥ 24px só em título/voz | JetBrains Mono; nomes de agente em sans |
| Cor (8, 9, 31) | cinza + cor de pessoa em avatar/ponto | neutro; estado só ok/atenção/alarme | acento do agente em traço; cartão de resultado verde discreto |
| Motion (19–22) | nenhuma em ações frequentes | troca de aba instantânea; herói só em abrir projeto | símbolo animado "pensando", cancelável; reduzido = opacidade |
| Silêncio (24, 25) | indicadores (badge, ponto) | validações inline | progresso dentro da coluna; "Confirma? [s/N]" no fluxo |
| Alvo (30) | ≥ 24px + 4px de folga | idem | fechar aba/agente ≥ 24px |
| Velocidade (26) | árvore sem animação; filtro instantâneo | abrir arquivo < 100 ms | eco otimista + desfazer |

---

## 12. Armadilhas

1. **Vidro e translucidez** como sinônimo de futurismo: a Apple recuou em 2026 por legibilidade (21). Se entrar, entra com opacidade alta, borda escura e fallback opaco.
2. **Degradê como parágrafo**: o roxo→ciano em fundo, texto, botão e cronômetro ao mesmo tempo (31). Acento é pontuação.
3. **Cormorant pequena** em tela escura: hairlines somem (17). Só ≥ 24px, peso Medium+.
4. **Mono para tudo**: perde o significado "isto é máquina" (15).
5. **`prefers-reduced-motion` a 0.01ms em tudo**: apaga o feedback útil; trocar por opacidade (22).
6. **Medir contraste com WCAG 2 no fundo `#060b16`**: superestima; usar APCA (13). Os números dos tokens atuais **não foram medidos** nesta sessão (execução negada); medir em apcacontrast.com antes de fixar.
7. **Rótulos a 10.5px** no Mac: abaixo do mínimo da HIG (14).
8. **Expressivo sem rótulo**: o próprio Google mediu queda de usabilidade ao tirar rótulos (20).
9. **Estética escondendo problema**: notas de UX vão subir com a pele nova mesmo sem melhorar tarefa (4); medir tempo e erro.
10. **Densidade "compacta" por coluna** sem regra de sistema: Cloudscape proíbe aplicar por componente (6); se for por região, declarar como regra do sistema.
11. **Só escuro por identidade**: a única exceção que a Apple admite é mídia imersiva (11), que é a TV; a Estação precisa do tema claro.
12. **Ícone gerado como PNG e vetorizado**: proibido pelo `PROMPT_AGENTICO` §4.3; SVG nativo numa leva só, traço em `currentColor`.
13. **Notificação em toast para progresso do agente**: VS Code e NN/g mandam para o contexto/status bar (24, 25).
14. **Fundo gerado por IA atrás de texto de trabalho**: fere heurística 8 (3) e Material (12); só atrás de vazio.

## 13. O que ninguém fez (oportunidades que a pesquisa abre, sem forçar)

- **Três anéis de atenção com luminância**: esquerda e direita um degrau mais escuras que o meio (Linear, 7), e o meio podendo virar **claro** enquanto as laterais ficam escuras ("janela de luz": o trabalho é papel, a máquina é noite). Não encontrei produto que faça tema por coluna; é coerente com NN/g (10) e Apple (11), e com a TV escura como mídia imersiva.
- **Tema de três variáveis em LCH** (8) com a **cor da pessoa** como acento derivado: uma regra gera avatar, chip, borda de "quem mexeu" e cor do agente daquela pessoa, sempre na mesma luminância; alto contraste sai de graça.
- **Tríade tipográfica com papéis declarados**: Cormorant = voz (o que a equipe diz: ideia falada, sugestão da sala, nome do projeto, reino); Plex = trabalho; JetBrains Mono = máquina. Ninguém das referências usa serifa de display como "voz da equipe" numa ferramenta de trabalho; é onde REINO entra sem cosplay.
- **Estado do agente como símbolo animado que se desenha** (19 + `PROMPT_AGENTICO` §6.3): o ícone SVG do agente traça o contorno enquanto pensa, fecha quando termina, e vira "parar" ao clicar. Legível de longe, cancelável, com equivalente estático no modo reduzido.
- **Dois esquemas de motion nomeados nos tokens** (20): `--mov-padrao` em tudo; `--mov-heroi` só em abertura, meta 100 % e ideia salva. É a forma de ter "futurista" sem pagar em espera (26).
- **Silêncio por anel** (23–25): indicador na esquerda, validação no meio, notificação só na TV e no celular, uma por vez, com rajada juntada.
- **Orçamento de identidade por tela**: um acento de marca visível por vez na Estação (a TV pode mais). Vira regra de aceite, não gosto.

## 14. Fontes

### Lidas de verdade (WebFetch), com data quando a página informa
- https://www.vitsoe.com/gb/about/good-design
- https://www.nngroup.com/articles/ten-usability-heuristics/ (revisado 30/01/2024)
- https://www.nngroup.com/articles/aesthetic-minimalist-design/ (24/01/2021)
- https://www.nngroup.com/articles/aesthetic-usability-effect/ (03/02/2024; revisado 01/09/2026)
- https://www.nngroup.com/articles/dark-mode/ (02/02/2020)
- https://www.nngroup.com/articles/indicators-validations-notifications/ (17/01/2024)
- https://www.nngroup.com/articles/push-notification/ (18/11/2018)
- https://mattstromawn.com/writing/ui-density/
- https://cloudscape.design/foundation/visual-foundation/content-density/
- https://linear.app/now/behind-the-latest-design-refresh (12/03/2026)
- https://linear.app/now/how-we-redesigned-the-linear-ui
- https://www.designsystems.one/design-systems/linear (terceiros)
- https://www.925studios.co/blog/stripe-dashboard-design-breakdown (terceiros)
- https://portfolio.chsmc.org/sail
- https://developer.apple.com/tutorials/data/design/human-interface-guidelines/dark-mode.json
- https://developer.apple.com/tutorials/data/design/human-interface-guidelines/typography.json
- https://developer.apple.com/tutorials/data/design/human-interface-guidelines/motion.json
- https://codelabs.developers.google.com/codelabs/design-material-darktheme
- https://design.google/library/material-design-dark-theme
- https://design.google/library/expressive-material-design-google-research
- https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html
- https://vercel.com/font
- https://vercel.com/geist/introduction
- https://www.jetbrains.com/lp/mono/
- https://github.com/catharsisfonts/cormorant
- https://bonfx.com/what-fonts-go-with-cormorant-garamond/ (terceiros)
- https://www.creativeboom.com/tools/top-50-fonts-in-2026/ (18/09/2025)
- https://www.macrumors.com/2026/06/10/how-liquid-glass-is-changing-in-ios-27/ (10/06/2026)
- https://en.wikipedia.org/wiki/Liquid_Glass
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- https://caseorganic.com/post/principles-of-calm-technology/
- https://code.visualstudio.com/api/ux-guidelines/notifications
- https://code.visualstudio.com/api/ux-guidelines/overview
- https://code.visualstudio.com/api/ux-guidelines/activity-bar
- https://blog.superhuman.com/superhuman-is-built-for-speed/
- https://raw.studio/blog/how-notion-ux-converts-100-million-users (terceiros, 13/05/2026)
- https://www.hackdesign.org/toolkit/craft/ (terceiros)
- https://culturedcode.com/things/features/
- https://culturedcode.com/things/blog/2023/09/things-big-and-small/ (06/09/2023)
- https://tentackles.com/blog/b2b-saas-color-palettes-2026-that-stand-out (agência)

### Não lidas (falharam ou só título), citadas apenas como pista
- https://m3.material.io/styles/motion/overview/how-it-works e https://m3.material.io/blog/m3-expressive-motion-theming (JS; só trechos do índice de busca)
- https://m2.material.io/design/color/dark-theme.html (JS)
- https://www.kittl.com/blogs/why-variable-fonts-are-winning-fnt/ (403)
- https://madegooddesigns.com/garamond-font-pairing/ (403)
- https://www.businesswire.com/news/home/20211202005370/en/... (403)
- https://www.german-design-award.com/en/gallery/detail/interactive-user-experience/craft-docs-1 (404)
- https://fonts.google.com/specimen/Cormorant+Garamond (JS)
- https://www.ibm.com/plex/ (abriu, mas sem os textos de conceito; a seção /plex/concept/ não foi lida)
- https://developer.android.com/reference/kotlin/androidx/compose/material3/MotionScheme (devolveu a home da referência)

### O que não fiz e precisa ser feito antes de fixar tokens
- Medir APCA e WCAG 2 dos pares atuais (`#d7e4fb`, `#8799bc`, `#5a6a8c`, `#29ccec`, `#8670ff` sobre `#060b16` e `#101a2c`; TV `#c7a2ff`, `#7b6899` sobre `#090413`): a execução local foi negada; usar https://apcacontrast.com/.
- Confirmar se IBM Plex Sans no Google Fonts é variável.
- Ler a página oficial de motion do Material 3 num navegador com JS para confirmar os parâmetros de spring.
