# Frente: apps futuristas 2026–2030 · como os produtos mais admirados desenham "o futuro" sem excesso

> Missão `babel-coop/design-2030` · 23/09/2026 · pesquisa com WebSearch + WebFetch.
> Regra: cada achado tem a URL **efetivamente lida**. O que veio só de trecho de busca está marcado como tal. Páginas que devolveram 403 estão listadas no fim e **não** são usadas como fonte.
> Contexto lido antes: `PROMPT_AGENTICO_LP.md`, `BRIEFING_IA.md`, `docs/UX_PENEIRA.md`, `docs/FUNCOES.md`, `prototipo/base.css` e `v3.css`, `.deus/missao-design/MISSAO.md`.

## 0. Resumo em dez linhas

1. Os produtos admirados de 2024–2026 convergiram para o mesmo pacote (escuro, degradê, vidro, glow, Inter). O próprio mercado já chama isso de "todo SaaS igual" e de "AI slop". A identidade atual da Babel (roxo → azul → ciano em `#060b16`, neon, texto em degradê, ponto pulsante) bate em cinco sinais dessa lista.
2. A saída não é trocar a paleta: é trocar a **gramática**. Linear tirou cor; Raycast tirou degradê e pôs textura própria; Nothing tirou o acento e deixou a tipografia carregar a hierarquia; Apple mandou expressar hierarquia "por layout e agrupamento, não por decoração".
3. Painel de agentes à direita com status por agente **já é padrão** (Cursor 2.0 out/2025, Cursor 3 abr/2026, Zed abr/2026, Framer 3.0 jun/2026, Warp). Não conta como "o que ninguém usou".
4. Os mecanismos que se repetem nos melhores: terminal em **blocos tipados** (Warp), **seguir o agente** (Zed, Framer), **revisar mudanças** como aba com aceitar/rejeitar (Zed, Cursor, Warp), **paleta de comandos** como afordância universal (Raycast, Notion Calendar, Linear), **painéis flutuantes que somem** (Figma UI3).
5. Interface "invisível"/Zero UI só funciona se for **prestadora de contas** ("Zero UI won't succeed because it's invisible. It will succeed because it's accountable"). Rabbit r1 e Humane morreram por latência sem feedback e por não conseguirem mostrar lista nem comparação.
6. Calm technology (Case; Nothing): a tecnologia usa a **periferia** da atenção; "se tudo brilha, nada é importante". A TV espelho sem botão é periferia por definição; a Estação deve acender só o que exige a pessoa.
7. visionOS: "prefira profundidade sutil; é fácil exagerar"; texto sempre plano; o que emite luz "ilumina o vizinho". Vale como metáfora para as três colunas, não como 3D.
8. Liquid Glass: vidro só na camada de navegação, "nunca vidro sobre vidro", legibilidade dita 13 vezes num vídeo de 19 minutos, e a comunidade reagiu ao contraste. Vidro em painel de conteúdo é o que envelhece pior.
9. Teenage Engineering e Nothing mostram como ter **personalidade sem ornamento**: restrição como estética, cor por função, mono/dot só onde nomeia, humor leve, "não fazemos enfeite".
10. Custo da novidade (Arc): "too different, with too many new things to learn, for too little reward". Gastar a novidade num só mecanismo e manter o resto familiar.

---

## 1. Produto a produto

### 1.1 Linear

**Fato (lido).** No redesign da UI (parte II, 28/03/2024, Karri Saarinen, Yann-Edern Gillet, Andreas Eldh, Romain Cascino): "We've adjusted the sidebar, tabs, headers, and panels to reduce visual noise, maintain visual alignment, and increase the hierarchy". Testaram densidade "from very condensed to more spacious". Adotaram Inter Display nos títulos. Trocaram HSL por **LCH** por ser perceptualmente uniforme; um tema inteiro nasce de **três variáveis** (cor base, acento, contraste). Limitaram o chroma para "a more neutral and timeless appearance"; texto e ícones neutros ficaram mais claros no escuro para subir contraste.
Fonte: https://linear.app/now/how-we-redesigned-the-linear-ui

**Fato (lido).** LogRocket (Daniel Schwarz, 07/06/2025) descreve "linear design" como tendência: modo escuro, degradês ("more impact but not more clutter"), glassmorphism ("very difficult to do differently, so using this effect can make your designs lack originality"), rolagem unidimensional, poucos CTAs. Crítica: "almost every SaaS website looks the same". O site da Linear cortou cor entre 2024 e 2025 (de azul monocromático para preto/branco); a Raycast largou os degradês e pôs "abstract visuals with noisy overlays"; o GitHub aumentou cor e vidro e ficou "worse for it in 2025".
Fonte: https://blog.logrocket.com/ux-design/linear-design/

**Por que importa.** O padrão que a Babel adotou em 2025 (escuro + degradê + neon) é exatamente o que os líderes estão desmontando. A hierarquia da Linear vem de alinhamento e densidade, não de cor.

**Aplicação no Babel Coop.** Tokens em OKLCH/LCH gerados de três variáveis (base `#060b16`, acento, contraste) para que escuro, TV e celular saiam da mesma fórmula; degradê roxo → ciano sobrevive como **um traço** (linha de 1 px, horizonte, borda ativa), nunca como fundo de painel nem como texto. Testar a densidade das colunas em três níveis (condensada/normal/espaçosa) como a Linear fez.

### 1.2 Vercel (Geist, Geist Pixel)

**Fato (lido).** Geist: "A high contrast, accessible color system"; grid "a core part of the Vercel aesthetic"; Geist Sans + Geist Mono; fundações = cor, tipografia, materiais (raios, preenchimentos, sombras) e grid.
Fonte: https://vercel.com/geist/introduction

**Fato (lido).** Geist Pixel (06/02/2026, Evil Rabbit): família bitmap com cinco variantes (Square, Grid, Circle, Triangle, Line), 480 glifos; feita "para uma era onde interfaces são cada vez mais moldadas por workflows orientados por IA"; cada glifo refinado à mão "para evitar ruído visual"; uso em "banners, dashboards, experimental layouts, product moments"; "clareza em tamanhos pequenos e personalidade em escalas maiores".
Fonte: https://vercel.com/blog/introducing-geist-pixel

**Por que importa.** A Vercel separa a voz de trabalho (sans/mono) da voz de marca (pixel) dentro do mesmo sistema. É a forma de ter "futurismo" sem contaminar a UI de trabalho.

**Aplicação no Babel Coop.** Uma fonte de display própria (pixel/dot/geométrica, gerada ou escolhida) só para "momentos de produto": nome do agente, versão `vN` da Oficina, placar da TV. IBM Plex Sans continua na UI (e é menos batida que Inter/Geist, ver 2.4). Cormorant Garamond fica como voz da "fala" (ideias faladas, ata) — é a assinatura menos copiável da Babel.

### 1.3 Raycast

**Fato (lido).** DESIGN.md (VoltAgent): canvas `#07080a`, superfícies `#0d0d0d` → `#121212`; **"a elevação é construída inteiramente da escada de cor de superfície; não há nenhuma sombra suspensa no sistema"**; bordas hairline 1 px `#242728`; CTA primário branco puro; Inter com `ss03`; tratamento "keycap" (tecla de teclado com gradiente `#121212 → #0d0d0d`, 20 px de altura); raios 6/8/10/16; motion não documentado.
Fonte: https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/raycast/DESIGN.md

**Fato (lido).** XDA (Abhishek Kumar Mishra, 15/07/2026): o diferencial da paleta do Raycast é a **ação contextual em cada item** (renomear, quicklink, ações de IA, compartilhar, duplicar, apagar) sem sair do teclado, mais extensões, snippets, clipboard.
Fonte: https://www.xda-developers.com/raycast-showed-me-what-command-palette-can-become/

**Por que importa.** Profundidade sem sombra e sem glow, e a tecla desenhada como afordância honesta. A paleta não é "buscar": é "agir sobre qualquer coisa".

**Aplicação no Babel Coop.** Escada de superfície de 4 degraus (fundo, casco, elevado, flutuante) e hairlines; zero `box-shadow` colorida. Teclas visíveis (`Ctrl K`, `Ctrl \``) desenhadas como keycap. Cada item da árvore da esquerda tem o mesmo menu de ações da paleta (Projetar · Levar para a reunião · Pedir ajuda · Enviar para pessoa) — uma lista de ações, não botões espalhados (resolve a repetição apontada na peneira).

### 1.4 Warp

**Fato (lido).** "The Block Model" (David Stern e Oz, 29/04/2026): o terminal deixa de ser "uma única grade bidimensional de células" e vira "uma lista ordenada de blocos tipados e auto-contidos que se empilham verticalmente". Bloco = comando + saída; navegável, selecionável, compartilhável como link. Agentes aparecem como **"blocos de conteúdo rico"**: plano, raciocínio, chamadas de ferramenta e diffs entram na **mesma** lista dos blocos de terminal. Blocos fechados são imutáveis. Virtualização em dois níveis (só blocos na viewport, só linhas visíveis).
Fonte: https://www.warp.dev/blog/block-model-behind-warps-agentic-development-environment

**Fato (lido).** Página do produto: "Build, review, and ship in one surface"; abas verticais com metadados (branch, worktrees, PRs); "Take agent work from 80% to 100%. Review changes, leave comments, and send to agents for refinement"; agentes na nuvem tratados "just like you would locally".
Fonte: https://www.warp.dev/terminal

**Por que importa.** É o mecanismo mais forte que li para um terminal com agentes: cada coisa que o agente faz é um bloco com tipo, e o bloco é a unidade de "desfazer", "parar", "o que consultei".

**Aplicação no Babel Coop.** O terminal da direita vira **lista de blocos tipados**: pedido (da pessoa) · consulta ("o que consultei": acervo, arquivos) · plano · ação (com "desfazer") · resultado (cartão) · espera ("Confirma? s/N"). Corrige de uma vez os quatro buracos da régua agentic da peneira (parar, o que consultei, estado visível, próximo passo quando falha). Comandos `coop …` e shell continuam sendo blocos comuns.

### 1.5 Cursor

**Fato (lido).** Changelog 2.0 (29/10/2025): interface "organizada em torno de um sidebar dedicado a agentes e planos"; até oito agentes em paralelo com worktrees; revisão de mudanças multi-arquivo sem pular entre arquivos; arquivos como "pills" no prompt; Plan Mode (planejar com um modelo, construir com outro).
Fonte: https://cursor.com/changelog/2-0

**Fato (lido).** Changelog 3.0 (02/04/2026): "run many agents in parallel across repos and environments"; Agents Window; Design Mode para anotar elementos de UI no navegador (`⌘⇧D`); abas de agente lado a lado ou em grade; editor clássico continua disponível.
Fonte: https://cursor.com/changelog/3-0

**Fato (lido).** Changelog 3.1 (13/04/2026): **tiled layout** — "Split your current view into panes to run and manage several agents in parallel"; arrastar agentes entre painéis; configuração persiste; ditado por voz com `Ctrl+M` segurando, com forma de onda e cronômetro.
Fonte: https://cursor.com/changelog/3-1

**Fato (lido).** The Decoder (03/04/2026): Cursor 3 "reconstruiu a interface do zero em torno de agentes"; agentes na nuvem "criam automaticamente demos e capturas de tela de seu trabalho para que desenvolvedores possam verificar os resultados"; "terceira era" de "frotas" de agentes.
Fonte: https://the-decoder.com/new-cursor-3-ditches-the-classic-ide-layout-for-an-agent-first-interface-built-around-parallel-ai-fleets/

**Por que importa.** Confirma que "agentes com nome à direita, com status" é a norma de 2026. O que ainda é raro: o agente **provar** o que fez (demo/print) e a pessoa **anotar na tela** o que quer mudado.

**Aplicação no Babel Coop.** Manter os agentes à direita (pedido do Theus), mas fazer o que o Cursor não faz: agentes como **membros da equipe** (cor, foto, presença) e visíveis na parede de Terminais ao vivo de todos. "Editar na tela" (que a Babel já tem) ganha o papel do Design Mode: apontar na tela e falar com o agente. Resultado de agente sempre com prova (print/preview) no cartão do bloco. Ditado segurando tecla casa com "ideia falada".

### 1.6 Zed

**Fato (lido).** Docs do Agent Panel: threads múltiplas por projeto (sidebar `cmd-alt-j`); "respostas fluem com indicadores mostrando quais ferramentas o modelo está usando"; depois das edições mostra "quais arquivos, quantos deles e quantas linhas foram editados"; **"Review Changes"** abre aba com todas as mudanças para aceitar/rejeitar; **seguir o agente** pelo ícone de mira (ou segurar `cmd` ao enviar); botão de parar a qualquer momento; notificações do sistema quando o agente espera ou termina; controles aparecem progressivamente (restaurar checkpoint).
Fonte: https://zed.dev/docs/ai/agent-panel

**Fato (lido).** "Introducing Parallel Agents" (Mikayla Maki e Richard Feldman, 22/04/2026): controlar "exatamente quais pastas e repositórios os agentes podem acessar"; worktrees por thread; parar/arquivar/iniciar; "engenharia agnóstica" — nem "entregar-se às vibes" nem desligar a IA.
Fonte: https://zed.dev/blog/parallel-agents

**Fato (lido).** Recap 2025: "A complete overhaul of Zed's agent panel, including bespoke features like multibuffer review and agent following"; ACP: "the editor for all agents".
Fonte: https://zed.dev/2025

**Por que importa.** "Seguir o agente" e "revisar mudanças" são os dois gestos que fazem a pessoa confiar sem ler tudo. "Quais pastas o agente pode ver" é permissão visível.

**Aplicação no Babel Coop.** Botão "seguir" no meio: a aba do meio acompanha onde o agente está mexendo (arquivo, peça da Máquina, bloco da tela). "Revisar mudanças" como aba do meio com aceitar/rejeitar por trecho (vale para "Sugerir mudança" em arquivo de outra pessoa). A permissão do agente (que pastas/projetos ele enxerga) exibida no cabeçalho do agente, como a Zed faz por thread.

### 1.7 Arc → Dia (The Browser Company)

**Fato (lido).** Carta aos membros do Arc (Josh Miller, 26/05/2025): Arc "too different, with too many new things to learn, for too little reward" ("novelty tax"); só 5,52 % dos usuários diários usavam vários Spaces e 4,17 % Live Folders; no Dia, 40 % conversam com abas e 37 % usam personalização; Scott Forstall: fazer do navegador "a piano"; Arc era "bloated".
Fonte: https://browsercompany.substack.com/p/letter-to-arc-members-2025

**Fato (lido).** "The strategy behind Dia's design" (Charlie Deets): meta "permitir qualquer um mudar para Dia às 10 da manhã de uma terça"; "single obvious way to accomplish any task"; **invisibilidade estratégica** (botões de favorito/ajustes só no hover, sem banner de atualização, seletor de perfil escondido se não usado); **cores da página se estendem para a UI da aba ativa**; "orçamento de novidade" gasto no chat de IA; menções `@` de abas por familiaridade.
Fonte: https://browsercompany.substack.com/p/the-strategy-behind-dias-design

**Por que importa.** É a prova numérica de que "de um jeito que ninguém usou" custa adoção se for em tudo ao mesmo tempo. E "cor do conteúdo tinge a moldura" é um mecanismo elegante e pouco usado em apps de equipe.

**Aplicação no Babel Coop.** Orçamento de novidade: **um** mecanismo novo (o terminal de blocos ligado ao meio por "seguir"), o resto familiar (árvore, abas, Cmd+K). Invisibilidade estratégica: botões de aba e ações de arquivo aparecem no hover/foco; "Atualizar vN" some (atualiza em fundo e avisa uma vez). Cor por pessoa/projeto **tinge a moldura** da aba/coluna ativa, em vez de chips coloridos espalhados.

### 1.8 Apple visionOS (princípios espaciais) e Liquid Glass

**Fato (lido).** WWDC23 "Principles of spatial design": cinco princípios (familiar, centrado no humano, dimensional, imersivo, autêntico). "Common elements like sidebars, tabs, and search fields help people find…"; "In most cases, prefer subtle depth. It's easy to overdo"; "Keep text flat when used as an interface element"; "Any object that appears to emit light should shine color onto nearby objects"; "guide people's focus toward parts of your experience that matter the most"; evitar "anchoring content to people's view"; "Multiple windows can quickly become a lot for people to manage"; bordas suaves nas transições.
Fonte: https://developer.apple.com/videos/play/wwdc2023/10072/

**Fato (lido).** WWDC25 "Get to know the new design system": Liquid Glass é "a new functional layer in the UI, floating above your content… without ever stealing focus"; "Elements using Liquid Glass require clear separation from content to maintain legibility"; **formas concêntricas** ("By aligning radii and margins around a shared center, shapes can comfortably nest"; raio interno = raio do pai − padding); "Instead of relying on decoration, hierarchy should be expressed through layout and grouping"; "scroll edge effects are not decorative"; um efeito por vista; "playing in the same music key".
Fonte: https://developer.apple.com/videos/play/wwdc2025/356/

**Fato (lido).** CSS-Tricks (Geoff Graham, 17/07/2025): três camadas (iluminação, refração/lensing, sombra); críticas: "proporções de contraste variáveis que funcionam bem sobre um fundo, mas falham sobre uma foto brilhante"; usuários com baixa visão, dislexia e TDAH sofrem mais; Apple recomenda vidro **só na camada de navegação** e "evitar vidro sobre vidro".
Fonte: https://css-tricks.com/getting-clarity-on-apples-liquid-glass/

**Fato (lido).** Roger Wong (11/06/2025): "legibilidade" aparece 13 vezes no vídeo de 19 minutos da Apple; cada redesign (iOS 7, Yosemite, Big Sur) prometeu unificação e não entregou; recomenda vidro só em navegação/controles, tonalização só em ação primária, "nunca empilhar vidro sobre vidro".
Fonte: https://rogerwong.me/2025/06/breaking-down-apples-liquid-glass

**(Trecho de busca, página não lida)** Resultados de busca indicam que a Apple testou uma opção "Tinted" no iOS 26.1 beta 4 para reduzir o brilho após críticas. Não li a página; fica como indício, não como fato.

**Por que importa.** A maior empresa de design do mundo passou 2025 defendendo legibilidade do próprio vidro. Vidro em conteúdo é o que envelhece pior; profundidade sutil e formas concêntricas são o que fica.

**Aplicação no Babel Coop.** Nenhum vidro em painel de conteúdo. Se houver translucidez, só na paleta Cmd+K flutuante, sobre material opaco do sistema. **Raios concêntricos** em toda a casca (aba dentro de painel dentro de janela) = o "milimetricamente pensado" com regra matemática. A coluna "com a palavra" fica um passo à frente (sombra/superfície um degrau acima), texto sempre plano; o único emissor de luz é o estado do agente, que tinge de leve a borda da coluna vizinha.

### 1.9 Figma UI3

**Fato (lido).** (26/06/2024, Ryhan Hassan, Joel Miller, KC Oh) Princípio 1: **"Center your ideas, not Figma's UI"**; painéis flutuantes e redimensionáveis, com opção de esconder a UI inteira; reverteram mudanças na grade do Auto Layout para "preservar muscle memory"; 200 ícones desenhados à mão por Tim Van Damme **com rótulos opcionais**, alternando entre modo com ícones e modo mínimo para veteranos.
Fonte: https://www.figma.com/blog/behind-our-redesign-ui3/

**Por que importa.** A ferramenta desaparece diante do trabalho, mas sem punir quem já sabe o caminho. Rótulos opcionais resolvem novato vs. veterano sem duas interfaces.

**Aplicação no Babel Coop.** Barra de atividades com rótulos opcionais (ligados na primeira semana, desligáveis); Ctrl+B/Ctrl+` já existem — acrescentar "esconder tudo" (só o meio) para projetar/apresentar. Família de ícones numa leva única em SVG nativo (regra do Theus) com o mesmo traço.

### 1.10 Framer 3.0

**Fato (lido).** (16/06/2026) Painel direito dividido em abas **Style** e **Agent**; "The Agent tab lives in the right panel alongside the existing Style tab"; rótulo "main" no topo do canvas abre branches; durante o trabalho do agente a interface destaca as camadas em edição e um botão **"Follow"** leva a viewport até onde o agente está; co-edição paralela sem pausar um ao outro.
Fonte: https://www.oma-kase.com/blog/framer-3-launch

**Por que importa.** Segundo produto (com o Zed) a convergir em "seguir o agente". E "branch" virou palavra de interface para não-programadores.

**Aplicação no Babel Coop.** "Seguir" como gesto padrão do meio; ambiente (local/branch/produção), que a Máquina já tem, exposto como um rótulo discreto no topo do meio, como o "main" do Framer.

### 1.11 Teenage Engineering (OP-1, TP-7)

**Fato (lido).** Entrevista com David Möllerstedt (Jonathan Simcoe, 12/07/2024): "the end result when things go well is not a compromise between different points of views but rather a selection of what's most important for each aspect"; a tela pequena do OP-1 usa **cor para sinalizar inputs**; "a large part of what we are providing is a creative workflow system"; prototipar muito "to test, touch, feel, look and listen"; "brinquedo" aceito como elogio.
Fonte: https://jdsimcoe.com/writing/inside-design-at-teenage-engineering

**Fato (lido).** Blake Crosley, "Constraints as Aesthetic": "Se não parece bom, não soa bom" (Jesper Kouthoofd); OP-1 com uma tela e quatro knobs "forçou interfaces que superam DAWs"; **quatro parâmetros sempre visíveis, mapeados aos knobs**; "cada modo toma completamente a tela"; feedback animado com significado ("bobinas de fita giram, o mixer mostra níveis pulsando"); monoespaçada em todas as superfícies; "honestidade brutalista sobre o que algo é, combinada com cuidado obsessivo sobre aparência"; lições: modular, priorização por superfície limitada, "mostrar o trabalho aumenta credibilidade".
Fonte: https://blakecrosley.com/guides/design/teenage-engineering

**Fato (lido).** CDM sobre o TP-7 (Andreas Roman, 27/12/2023): disco motorizado que simula carretel e serve para rebobinar/avançar/performar; display monocromático 64×32; botão de memo; prioridade a "conveniência e fluxo" sobre especificação; "a unidade é um pouco complicada de operar" (a compacidade cobra preço).
Fonte: https://cdm.link/tp-7-field-recorder-review/

**Por que importa.** É o modelo de "futurista sem excesso": restrição visível, cor com função, animação que é metáfora do que a máquina faz (a regra do Theus: "um efeito só entra se for metáfora do serviço").

**Aplicação no Babel Coop.** Barra de status como "quatro parâmetros sempre visíveis" (presença · caixa · cronômetro · sala) — exatamente a peneira. Modo que toma a tela (Reunião, Projeção, Quadro) em vez de painel dentro de painel. Uma animação com metáfora: o cronômetro da demanda como disco/carretel que gira enquanto conta e para quando pausa (é a única metáfora física que o app já tem). Humor curto na copy dos vazios.

### 1.12 Nothing (Nothing OS, Glyph)

**Fato (lido).** Sistema inspirado na Nothing (shadcn.io/design): **monocromo, sem cor de acento** ("there is no accent, no brand color, no interactive highlight"); três vozes tipográficas: Ndot dot-matrix **só para nome de produto**, NType82 ultraleve para editorial, mono para todo rótulo de UI; "visual hierarchy runs entirely on typeface differentiation and scale"; raios 6/8 px; 4 cores, 14 componentes.
Fonte: https://www.shadcn.io/design/nothing

**Fato (lido).** TechTimes (13/02/2026): Nothing OS "tries to walk a line between feeling like 'clean Android' and having a recognizably different style"; mantém "signature dot elements in places where they add character"; Glyph = "the signature nothing phone feature", tiras de LED na traseira como notificação visual; "Flip to Glyph" deixa o telefone virado e silencioso com alertas visuais; abordagem "deliberately restrained".
Fonte: https://www.techtimes.com/articles/313989/20260213/nothing-phone-features-nothing-os-design-how-this-android-smartphone-trends-ahead-competition.htm

**Fato (lido).** NothingTec (ruudhesp, 27/01/2026): a Glyph Matrix "is designed to be an attention filter", não um always-on; "the value of the Glyph Matrix comes from the reduction, not from maximization"; "If everything is shiny, nothing is important. If only what is essential shines, you regain control over your time"; "calm instead of addiction".
Fonte: https://nothingtec.com/en/2026/01/27/estas-usando-mal-glyph-matrix-nothing/

**Fato (lido).** TechNode (12/05/2023, Carl Pei): calm technology — "You don't have to actively engage with the phone, but it still gives you important information"; padrões de luz por contato para decidir se atende.
Fonte: https://technode.com/2023/05/12/nothing-founder-carl-pei-on-making-innovation-fun-and-the-importance-of-calm-technology/

**(Trecho de busca, página não lida — Forbes 18/04/2026 devolveu 403)** "We don't do ornaments… they always have to be functional". Fica como indício.

**Por que importa.** A Nothing é o caso mais claro de identidade forte **sem** cor de acento e sem glow: tipografia e luz com função. "Filtro de atenção" é o conceito certo para o neon da Babel.

**Aplicação no Babel Coop.** O "neon" vira **filtro de atenção**: só acende o que exige a pessoa (agente esperando OK, pedido de entrar no terminal, gravação da sala). Tudo o mais fica apagado. A fonte dot/pixel só nomeia (agente, projeto, versão); a UI é Plex + mono. A TV espelho é a "Glyph" da equipe: sinal visual, calmo, sem som.

### 1.13 Rabbit r1 e Humane AI Pin (o que morreu)

**Fato (lido).** Digital Applied (31/03/2026): Humane — projeção a laser inutilizável à luz do dia, respostas por voz lentas e imprecisas, "impossibilidade de exibir listas, comparar opções ou rolar conteúdo"; < 10.000 unidades, US$ 230 mi levantados, vendida à HP por US$ 116 mi, desligada em 28/02/2025. Rabbit r1 — latência de voz de até 10 s, "muitos recursos demonstrados simplesmente não funcionavam", 100.000 vendidos e devoluções em massa; Jony Ive criticou ambos publicamente. Lição: "Nunca lance um produto baseado no que planeja construir. Lance baseado no que funciona hoje."
Fonte: https://www.digitalapplied.com/blog/ai-product-failures-2026-sora-humane-rabbit-lessons

**(Trecho de busca, página não lida)** Reviews citam a roda de rolagem como única entrada "sem rima nem razão" para quanto rolar; tela pouco usada. Não li a página do TechRadar (conteúdo veio truncado).

**Por que importa.** Interface "invisível" sem estado visível e sem lista/comparação falha mesmo com hardware bonito (o r1 é da Teenage Engineering). Latência sem feedback mata a confiança.

**Aplicação no Babel Coop.** O meio nunca vira "só chat": lista, comparação e revisão continuam sendo tela. Todo pedido ao agente mostra em até 1 s o que está fazendo (bloco "consultando acervo…") e quanto falta quando há passos. Prometer só o que o protótipo já faz ("faz" vs. "só no app" da `FUNCOES.md`).

### 1.14 Notion Calendar (ex-Cron)

**Fato (lido).** Blake Crosley: teclado como modelo primário ("The entire calendar is operable without a mouse. This is not an accessibility afterthought — it is the primary interaction model"); contraste de escala 5,3:1 (64 px / 12 px) sem elemento decorativo; grade com hairlines `rgba(0,0,0,0.09)`; numerais monoespaçados na calha; texto `rgba(0,0,0,0.9)` em vez de preto puro; "Information is accessible on demand, not on permanent display"; minimalismo = disciplina de revelação progressiva, não ausência de recursos.
Fonte: https://blakecrosley.com/guides/design/notion-calendar

**Por que importa.** Mostra "quiet luxury" em ato: hierarquia só por escala e espaço, linhas quase invisíveis, números alinhados.

**Aplicação no Babel Coop.** Hairlines a ~9–12 % de opacidade sobre `#060b16`; numerais tabulares (`font-variant-numeric: tabular-nums`) no cronômetro, na barra e no placar da TV; texto principal a 90 % de branco, não branco puro; escala com uma diferença grande entre display e rótulo em vez de cinco tamanhos intermediários.

---

## 2. Tendências 2026 (com fonte)

### 2.1 Calm technology

**Fato (lido).** Calm Tech Institute — 8 princípios: "Require the smallest possible amount of attention"; "Inform and create calm"; "Make use of the periphery"; "Amplify the best of technology and the best of humanity"; "Communicate without speaking"; "Still work when it fails"; "The minimum tech needed to solve the problem"; "Respect social norms". Certificação Calm Tech Certified (2024) avalia "engajamento periférico, tátil, harmonia material e durabilidade".
Fonte: https://www.calmtech.institute/calm-tech-principles

**Aplicação.** A TV é periferia; a Estação "ainda funciona quando falha" (sem rede, computador do colega desligado = ficha pontilhada, já existe); "comunicar sem falar" = luz/estado, não toast.

### 2.2 Interface invisível / Zero UI — com prestação de contas

**Fato (lido).** Microsoft Advertising (Jennifer Kattula, 16/06/2025): Zero UI = "a interface desaparece de vista"; princípios: projetar para agentes e pessoas, sistemas em vez de táticas, "valor invisível", otimizar presença e não visualizações; riscos: dados, ética, perda de descoberta.
Fonte: https://about.ads.microsoft.com/en/blog/post/june-2025/zero-ui-the-invisible-interface-revolution

**Fato (lido).** DMEXCO (30/10/2025): "Zero UI won't succeed because it's invisible. It will succeed because it's accountable"; confiança como "requisito técnico"; a pessoa precisa saber quando o agente age em seu nome.
Fonte: https://dmexco.com/stories/zero-ui-and-ai-agents-a-future-without-interfaces/

**Aplicação.** Invisível ≠ sem rastro. Cada ação do agente deixa bloco com "desfazer" e "o que consultei" (reforça a peneira, item 6).

### 2.3 Agentic UX (o que os produtos fazem, não o que os artigos dizem)

Padrões observados nos produtos lidos (Cursor, Zed, Warp, Framer): agentes nomeados com status individual; permissões visíveis (pastas/repos); "seguir o agente"; "revisar mudanças" com aceitar/rejeitar por trecho; parar a qualquer momento; notificação quando o agente espera; prova do trabalho (print/demo); vários agentes em painéis lado a lado. Fontes: 1.4, 1.5, 1.6, 1.10.

### 2.4 "Quiet, not simpler" / minimalismo estratégico (o mais próximo de "quiet luxury" em B2B)

**Fato (lido).** Entrepreneur (Goran Paun, 21/01/2026): "UI has become quieter, not simpler. The best UI today doesn't draw attention to itself"; "UX is infrastructure"; "Consistency is the new differentiator"; risco de "follow prompts without confidence" quando o sistema automatiza demais.
Fonte: https://www.entrepreneur.com/science-technology/what-you-need-to-know-about-uiux-design-in-2026/501546

**Fato (lido).** SaaS UI Design (Rakesh Mondal, 08/03/2026), 7 tendências: "Less on screen. More in focus" (Linear, Calendly); "The AI badge has disappeared. The intelligence hasn't" (Notion, Intercom); "If you can't Cmd+K to it, it doesn't exist" (Linear, Slack); interfaces por papel; revelação progressiva; design emocional entra no B2B; "Everything earns its place or gets cut" (Vercel, Linear).
Fonte: https://www.saasui.design/blog/7-saas-ui-design-trends-2026

**Fato (lido).** Studio Maydit (Siddarth Ponangi, 23/09/2026), 10 tendências B2B: fluxos em vez de telas; "Advanced options, secondary actions, and edge cases are increasingly hidden until they are relevant"; "Teams are treating language as a core design material"; feedback e reasseguramento; personalização implícita; "less about standing out visually and more about staying understandable as products grow".
Fonte: https://studiomaydit.com/blog/b2b-saas-design-trends-2026

**Fato (lido).** Web Designer Depot (Alex Harper, 12/12/2025): "the best interfaces are the ones that think less, not more"; clareza acima de tudo; corpo ≥ 16 px na web; micro-interações para "Provide Feedback… Mask Latency".
Fonte: https://webdesignerdepot.com/the-ultimate-guide-to-ui-design-in-2026/

**Nota honesta.** O termo "quiet luxury" aplicado a software B2B **não apareceu em fonte primária lida**; as fontes usam "calm design", "spotlight UX", "quieter, not simpler", "staying understandable". Uso o conceito, não o rótulo.

**Aplicação.** Sem selo "IA" na interface (o agente é membro, não recurso); tudo o que é função pedida existe também na paleta; papel (gestão/membro) muda o que aparece sem seletor "Ver como"; a copy em português simples é material de design (já é regra); os 46 textos de ajuda saem, os estados de confirmação ficam.

### 2.5 O que envelheceu mal: neon, vidro e o "AI slop"

**Fato (lido).** impeccable.style/slop lista sinais de design gerado sem critério: "Purple-to-blue gradients compete across buttons, text, and backgrounds"; "Purple gradients and bright cyan on dark backgrounds"; "Gradient text" (alternativa: "one solid color and use size or weight for emphasis"); "Glassmorphism everywhere… used as decoration"; "Radial-gradient background halo… Remove the glow when it competes with the content"; "Dark mode with glowing accents… wall of neon"; **"Pulsing status dot… draws attention even when nothing changes"** (alternativa: "Keep static status still, and use motion to signal activity that matters"); "Bounce or elastic easing"; "Nested cards"/"Cardocalypse"; "Overused font… Inter and Geist"; "Icon tile stacked above heading".
Fonte: https://impeccable.style/slop/

**Fato (lido).** LogRocket: vidro "difícil de fazer diferente"; GitHub piorou ao abusar de vidro em 2025 (ver 1.1). Apple: "hierarchy should be expressed through layout and grouping" em vez de decoração (ver 1.8).

**Contraponto (lido).** TesterYou (Emir Varlı, 29/04/2026) defende "estética cyberpunk em telas B2B" (grades finas, indicadores luminosos, mono, roxo/neon) e gamificação de produtividade como tendências empresariais.
Fonte: https://testeryou.com/ui-ux-in-2026-4-major-trends-shaping-enterprise-software-and-interfaces/
Leitura: fontes de tendência se contradizem; o critério de desempate é função (Nothing, TE, Apple), e as três apontam contra o glow decorativo.

**Cruzamento com o CSS atual da Babel (`base.css`, `v3.css`).** Sinais presentes hoje: (a) `linear-gradient(90deg, #9160ec, #29ccec)` com `background-clip: text` no cronômetro destacado e na versão da Oficina = "gradient text"; (b) degradê roxo → ciano em seleção, chips e botão "Atualizar" = "purple-to-blue gradients compete across buttons"; (c) `.term-estado.pensando` com `animation: pulsa` = "pulsing status dot" (aqui é aceitável **só** porque indica atividade real; deve parar quando o agente para — e já para); (d) `radial-gradient` roxo no fundo do cronômetro mini e do palco da Máquina = "background halo"; (e) fundo escuro + neon (pedido do Theus, identidade). A peneira já tirou o "b" gigante e o botão "Neon".

**Aplicação.** Manter a paleta como DNA (é pedido) e mudar a gramática: degradê só em **um traço** por tela (linha de 1 px no topo da coluna ativa ou horizonte da TV); nenhum texto em degradê; nenhum halo; estado estático quando nada muda; easing `ease-out` curto (≤ 180 ms), sem overshoot; cartões sem cartões dentro; hierarquia por espaço e tipo.

---

## 3. O que os líderes fazem de novo em painéis laterais e terminais (síntese comparativa)

| Produto | Esquerda | Meio | Direita / terminal | Mecanismo que se destaca |
|---|---|---|---|---|
| Linear | sidebar densa, alinhamento estrito, 3 variáveis de tema | listas/boards/timeline com densidade ajustada | — | hierarquia por alinhamento e LCH |
| Vercel | grid como estética | — | — | voz de marca (Pixel) separada da voz de trabalho |
| Raycast | — | paleta = ação em qualquer item | — | elevação só por superfície, keycaps |
| Warp | abas verticais com metadados | blocos tipados (comando, saída, plano, diff) | é o próprio terminal | **blocos tipados** com agente na mesma lista |
| Cursor 2/3 | árvore (modo clássico) ou lista de agentes | editor / Agents Window em grade | agentes com status à direita (2.0) | tiled layout, Design Mode, prova por print |
| Zed | threads por projeto | editor + aba "Review Changes" | Agent Panel | **seguir o agente**, permissões por thread |
| Dia | — | página; cor da página tinge a aba | chat de IA na lateral | invisibilidade estratégica, "novelty budget" |
| Figma UI3 | painel flutuante que some | canvas central ("center your ideas") | painel flutuante | rótulos opcionais nos ícones |
| Framer 3 | camadas | canvas com "main"/branches | Style · Agent | **Follow**, co-edição paralela |
| visionOS | sidebars/abas familiares | janela de vidro voltada para a pessoa | — | profundidade sutil como hierarquia; luz que tinge o vizinho |
| TE OP-1 | — | um modo toma a tela | — | 4 parâmetros sempre visíveis, cor por função |
| Nothing | — | monocromo, tipo carrega hierarquia | — | luz como filtro de atenção (Glyph) |
| Notion Calendar | — | grade com hairlines 9 %, numerais tabulares | — | teclado como modelo primário |

## 4. O que ninguém (dos lidos) fez — candidatos a "de um jeito que ninguém usou"

Anterioridade pesquisada por função nos 13 produtos acima. "Não vi" não é "não existe"; vale como ponto de partida para a busca de anterioridade do aceite A4.

1. **Agente como membro da equipe, visível para os outros.** Cursor/Zed/Warp/Framer têm agentes por pessoa, em sessão privada. Nenhum mostra os agentes de todos numa parede compartilhada com presença, cor e foto, nem deixa outra pessoa entrar/assumir o terminal de um colega (a Babel já tem "Entrar/Assumir/Devolver").
2. **As três colunas como um só instrumento: arquivo (esquerda) → "quem está com isto" → bloco do terminal (direita), com o meio "seguindo".** Zed e Framer têm "seguir"; Warp tem blocos; ninguém liga a árvore de arquivos ao bloco do agente por presença (foto de quem salvou + agente que está lendo aquele arquivo agora).
3. **Terminal de blocos com "desfazer", "o que consultei" e "prova" por bloco, em português, para não-programadores.** Warp tem blocos; Cursor tem prova por print; nenhum junta os três num terminal feito para empresários.
4. **Cor do conteúdo tinge a moldura (Dia) aplicada a pessoa/projeto em app de equipe.** A cor por pessoa da Babel pode tingir a borda da coluna/aba em vez de virar chips.
5. **Periferia física de equipe (TV espelho sem botão) controlada da estação.** Nothing tem Glyph pessoal; nenhum app de trabalho lido tem uma superfície periférica coletiva.
6. **Profundidade sutil (visionOS) como "quem tem a palavra" entre as três colunas**, com a luz do agente tingindo a borda vizinha — sem 3D, sem vidro.
7. **Uma única metáfora física animada (disco/carretel do cronômetro, à TE)** num app de gestão, em vez de motion decorativo.

## 5. Armadilhas

- **Imposto da novidade** (Arc: "too different… for too little reward"). Novidade num só mecanismo.
- **Painel de agentes à direita não é novo** (Cursor 2.0, out/2025). Não vender como inédito.
- **A identidade atual bate em 5 sinais de "AI slop"** (degradê roxo → ciano, texto em degradê, halo, glow, ponto pulsante). Mudar a gramática, não a paleta.
- **Vidro sobre vidro / texto sobre vidro** (Apple, CSS-Tricks, Wong). Vidro só na paleta flutuante, se tanto.
- **Ponto pulsante quando nada muda** (impeccable). Motion só para atividade real.
- **Interface "invisível" sem estado** (Rabbit/Humane). Latência precisa de feedback em ≤ 1 s; lista e comparação continuam sendo tela.
- **Fontes de tendência se contradizem** (TesterYou defende cyberpunk B2B; impeccable/LogRocket/Apple condenam glow e vidro). Desempatar por função.
- **"Quiet luxury" em B2B não tem fonte primária lida**; usar os conceitos com nome próprio (calm design, spotlight UX, "quieter, not simpler").
- **Inter e Geist estão gastas** (impeccable); IBM Plex Sans é menos batida, e Cormorant é assinatura — manter.
- **Compacidade cobra preço** (TP-7 "um pouco complicada de operar"). Densidade alta exige rótulos opcionais e paleta.
- **Páginas com 403 não viraram fonte**: prototypr (Liquid Glass), uxdesign.cc (heurísticas Apple), Medium (State of Design 2026; Dark Glassmorphism), Forbes (Carl Pei 2026), TechRadar (Rabbit r1, truncada), Apple HIG visionOS (só título; substituída pela transcrição da WWDC23).

## 6. Fontes lidas (URL efetivamente aberta)

1. https://linear.app/now/how-we-redesigned-the-linear-ui
2. https://blog.logrocket.com/ux-design/linear-design/
3. https://vercel.com/geist/introduction
4. https://vercel.com/blog/introducing-geist-pixel
5. https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/raycast/DESIGN.md
6. https://www.xda-developers.com/raycast-showed-me-what-command-palette-can-become/
7. https://www.warp.dev/blog/block-model-behind-warps-agentic-development-environment
8. https://www.warp.dev/terminal
9. https://cursor.com/changelog/2-0
10. https://cursor.com/changelog/3-0
11. https://cursor.com/changelog/3-1
12. https://the-decoder.com/new-cursor-3-ditches-the-classic-ide-layout-for-an-agent-first-interface-built-around-parallel-ai-fleets/
13. https://zed.dev/docs/ai/agent-panel
14. https://zed.dev/blog/parallel-agents
15. https://zed.dev/2025
16. https://browsercompany.substack.com/p/letter-to-arc-members-2025
17. https://browsercompany.substack.com/p/the-strategy-behind-dias-design
18. https://developer.apple.com/videos/play/wwdc2023/10072/
19. https://developer.apple.com/videos/play/wwdc2025/356/
20. https://css-tricks.com/getting-clarity-on-apples-liquid-glass/
21. https://rogerwong.me/2025/06/breaking-down-apples-liquid-glass
22. https://www.figma.com/blog/behind-our-redesign-ui3/
23. https://www.oma-kase.com/blog/framer-3-launch
24. https://jdsimcoe.com/writing/inside-design-at-teenage-engineering
25. https://blakecrosley.com/guides/design/teenage-engineering
26. https://cdm.link/tp-7-field-recorder-review/
27. https://www.shadcn.io/design/nothing
28. https://www.techtimes.com/articles/313989/20260213/nothing-phone-features-nothing-os-design-how-this-android-smartphone-trends-ahead-competition.htm
29. https://nothingtec.com/en/2026/01/27/estas-usando-mal-glyph-matrix-nothing/
30. https://technode.com/2023/05/12/nothing-founder-carl-pei-on-making-innovation-fun-and-the-importance-of-calm-technology/
31. https://www.digitalapplied.com/blog/ai-product-failures-2026-sora-humane-rabbit-lessons
32. https://blakecrosley.com/guides/design/notion-calendar
33. https://www.calmtech.institute/calm-tech-principles
34. https://about.ads.microsoft.com/en/blog/post/june-2025/zero-ui-the-invisible-interface-revolution
35. https://dmexco.com/stories/zero-ui-and-ai-agents-a-future-without-interfaces/
36. https://www.saasui.design/blog/7-saas-ui-design-trends-2026
37. https://studiomaydit.com/blog/b2b-saas-design-trends-2026
38. https://www.entrepreneur.com/science-technology/what-you-need-to-know-about-uiux-design-in-2026/501546
39. https://webdesignerdepot.com/the-ultimate-guide-to-ui-design-in-2026/
40. https://testeryou.com/ui-ux-in-2026-4-major-trends-shaping-enterprise-software-and-interfaces/
41. https://impeccable.style/slop/
