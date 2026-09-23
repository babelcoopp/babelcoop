# Conceito "VISADA" · o Babel Coop pelo ângulo INSTRUMENTO

> Missão `babel-coop/design-2030` · 2026-09-23 · anotações completas do conceito pelo ângulo "instrumento de observação" (sala de controle / observatório).
> Material obrigatório lido nesta sessão: `PROMPT_AGENTICO_LP.md`, `BRIEFING_IA.md`, `docs/UX_PENEIRA.md`, `docs/FUNCOES.md`, `prototipo/base.css`, `prototipo/v3.css` (mais `estacao.css` e `tv.css` para medidas atuais) e as sete frentes em `pesquisa/*.md`. As fontes externas citadas abaixo são as que as frentes leram (URL em cada frente) mais as que **esta sessão** leu, marcadas [lida aqui].
> Regra de escrita: cada traço tem uma função declarada e uma origem. "Não sei" vale mais que inventar.

## 0. Verificações feitas nesta sessão (novas, com fonte)

| O que | Resultado | Fonte |
|---|---|---|
| Pesos reais da IBM Plex Sans | `@font-face` do pacote declara 100 Thin · 200 ExtraLight · 300 Light · 400 Regular · **450 Text** · 500 Medium · 600 SemiBold · 700 Bold, romano e itálico; OFL-1.1 | [lida aqui] https://unpkg.com/@ibm/plex-sans/css/ibm-plex-sans-all.css · https://github.com/IBM/plex (só a licença e "Sans, Serif, Mono, and Sans Condensed, all with Roman and true italics") |
| Pesos da JetBrains Mono | "8 font styles … from Thin to ExtraBold, each coming with its own italic"; variável (woff2 gerado por script); ligaduras por padrão e versão NL sem ligaduras; OFL-1.1 | [lida aqui] https://github.com/JetBrains/JetBrainsMono |
| Pesos e estilos da Cormorant | "45 font files spanning 9 different styles (Roman, Italic, Infant, Infant Italic, Garamond, Garamond Italic, Upright Cursive, Small Caps, Unicase) and 5 weights" (Light, Regular, Medium, Semibold, Bold); o autor a chama de "free display type family"; OFL | [lida aqui] https://github.com/CatharsisFonts/Cormorant |
| "Linha de visada" (o nome do mecanismo) | "uma linha imaginária que une dois objetos sem interceptar obstáculos"; usada em tiro (alça, massa, alvo), rádio VHF e enlace entre antenas | [lida aqui] https://pt.wikipedia.org/wiki/Linha_de_visada |
| Anterioridade extra: painel que mostra onde o agente está sem mover o editor | Busca de 23/09/2026 devolveu só guias do painel de agente do Cursor (faros.ai, analyticsvidhya, petronellatech, eastondev, nxcode, aimec, tech-insider, cowork.ink, Wikipedia); nenhuma descreve uma linha desenhada entre painel e objeto. "Não vi" ≠ "não existe". | WebSearch (resultados listados; nenhum lido em profundidade) |
| Contraste APCA dos tokens | Calculado com implementação própria da fórmula APCA 0.1.9 em Perl (scratchpad `cores.pl`/`ajuste.pl`); **conferir em apcacontrast.com antes de fixar**. Resultados na seção 4. | cálculo local |
| Slugs da Replicate | 17 slugs confirmados com `GET /v1/models` (todos 200) na rodada 2 desta missão; schemas lidos lá. Não repetido aqui para não gastar. | `RODADAS.md` rodada 2 |

## 1. Nome e tese

**VISADA.** Catálogo · Campo · Mesa.

O Babel Coop é um instrumento de observação: uma equipe de 11 pessoas observa o próprio trabalho e age sobre ele. As três colunas são as três partes de todo observatório: o **Catálogo** (esquerda: o que existe e onde está — arquivos, pessoas, demandas, acervo), o **Campo** (meio: o que está sob observação agora — o campo de visão do instrumento) e a **Mesa** (direita: os instrumentos que leem o objeto e agem sobre ele, operados por agentes com nome humano). A ufologia entra como disciplina de observação e sinal — o impresso do Wow!, o painel do DSN, o radar PPI, o bitmap de Arecibo, a ficha do Blue Book — nunca como objeto. O futurismo é precisão, não cromo: latência exibida, números tabulares, um chão só, nenhum brilho permanente. O Reino é cerimônia sóbria: metal e pedra, um selo que abre, Garamond como voz humana, o token como convocação. O empreendedorismo é o rito do OK de quem pediu, a ficha, o placar. A criatividade é o Campo tomando a forma do objeto (folha, palco com ficha, borda infinita, mesa de reunião).

Uma frase: **um instrumento calmo que diz sempre onde está apontado.**

## 2. O mecanismo novo: a visada

### 2.1 Definição operacional

**Visada** = uma linha de 1 px desenhada da Mesa até o objeto em que o instrumento está travado, atravessando as colunas. Três usos, um só traço:

1. **Trava (padrão).** A Mesa está sempre travada na aba ativa do Campo. O **Mostrador** (cabeçalho fixo da Mesa, 56 px) lê esse objeto: nome em mono, tipo, quem está com ele (até 3 iniciais nas cores das pessoas), a direção do último fluxo (↑ pessoa mandou · ↓ agente devolveu) e o tempo de ida e volta do último pedido (ex.: `↓ 2,4 s`), mais o anel de estado do agente. A visada sai do canto inferior esquerdo do Mostrador e termina no ponto central da borda inferior da aba ativa. Quando a pessoa troca de aba, a visada anda (240 ms) e as receitas acima do campo ❯ mudam (máximo 3, conforme o objeto). A Mesa inteira se re-sintoniza ao objeto; nada mais muda de forma.
2. **Visada do agente.** Quando um agente age sobre outro objeto (abre um arquivo em segundo plano, encaixa uma peça na Máquina, navega numa página), uma segunda linha — tracejada 2/3, na cor da pessoa dona do agente — sai da aba desse agente na Mesa e aponta para o objeto: a aba dele no Campo (aberta atrás, sem roubar o foco) ou, se não está aberto, a linha dele no Catálogo. **O Campo da pessoa não se move.** A visada do agente é leitura, não sequestro.
3. **Seguir e espiar.** `Seguir` (botão de 24×24 no Mostrador ou tecla `S` com a Mesa em foco) faz o Campo acompanhar a visada do agente; abrir qualquer outra aba encerra o seguir (regra do Live Share). **Espiar**: segurar `Espaço` sobre um bloco de ação no Registro faz a visada apontar temporariamente para o antes/depois daquela ação no Campo; soltar devolve. Não abre aba.

Orçamento de novidade gasto aqui e só aqui. Árvore, abas, `Ctrl K`, `Ctrl B`, `` Ctrl ` `` continuam iguais ao VS Code.

### 2.2 Por que é mecanismo, não estilo

Ele muda o que a pessoa **sabe** a cada segundo (onde o instrumento está apontado, onde o agente está, quanto demorou) e o que pode **fazer** sem sair do lugar (seguir, espiar, parar). E fecha os quatro buracos da régua agentic da peneira: estado visível (anel de 14 px, não ponto de 6), "o que consultei" (bloco `consulta`), "parar" (botão no campo ❯ e `Esc` enquanto roda) e próximo passo na falha (bloco `falha` com anel aberto).

### 2.3 Anterioridade (quem faz parecido e a diferença)

| Quem | O que faz | Diferença da visada | Fonte (frente) |
|---|---|---|---|
| Zed, follow mode | "Your editor will jump to each file the agent touches" (o editor da pessoa pula) | A visada mostra sem mover; seguir é opcional, por agente, e se desfaz ao abrir outra aba | anterioridade-3-colunas · apps-futuristas (https://zed.dev/docs/ai/agent-panel) |
| Framer 3.0 | destaca as camadas que o agente edita e tem botão "Follow" | Só na tela de design; sem indicador persistente atravessando painéis; sem leitura de ida e volta | apps-futuristas (https://www.oma-kase.com/blog/framer-3-launch) |
| VS Live Share | seguir pessoa sincroniza arquivo e rolagem; para ao abrir outro arquivo; etiqueta só na atividade | É para pessoas, não agentes; não há linha desenhada, nem leitura do objeto | anterioridade-3-colunas (https://learn.microsoft.com/en-us/visualstudio/liveshare/use/coedit-follow-focus-visual-studio-code) |
| tldraw "fairies" | agentes com corpo no canvas, sabem onde os outros estão | Uma superfície só; personagem, não instrumento | anterioridade-3-colunas (https://gitnation.com/contents/agents-on-the-canvas-with-tldraw) |
| Warp | blocos tipados; comandos do agente não sujam o terminal | Blocos sem vínculo com o meio; sem espiar antes/depois; para programadores | apps-futuristas (https://www.warp.dev/blog/block-model-behind-warps-agentic-development-environment) |
| DSN Now (NASA/JPL) | "which dish is currently locked onto which spacecraft", uplink/downlink, round-trip light-time | É painel de leitura; a visada é o cabeçalho de uma mesa que também age (❯, receitas, parar) | ufologia-contida (https://jasperbernaers.com/deep-space-comms/, descrição secundária) |
| Linear peek | segurar Espaço abre prévia dentro do painel | Espiar aqui é transversal: bloco na direita → superfície de trabalho no meio | anterioridade-3-colunas (https://linear.app/docs/peek) |
| JetBrains Universal Entry Point · Solomon | campo que muda sugestões conforme o cursor/contexto | A visada re-sintoniza a mesa inteira (mostrador, receitas, chips) por objeto, para não-programadores | anterioridade-3-colunas (https://blog.jetbrains.com/idea/2025/11/universal-entry-point-a-single-entry-point-for-context-aware-coding-assistance/ · https://solomon.io/designing-command-palettes/) |
| Cursor 3, Design Mode | a pessoa aponta na tela e pede ao agente | Sentido inverso: objeto → agente. A visada é instrumento → objeto | apps-futuristas (https://cursor.com/changelog/3-0) |
| Radar PPI | traço radial gira com a antena e deixa rastro | Vira o indicador "ao vivo" de 12 px (só onde há transmissão real), não a visada | ufologia-contida (https://en.wikipedia.org/wiki/Plan_position_indicator) |

Alcance da busca: produtos lidos pelas frentes (Linear, Cursor, Warp, Zed, Arc/Dia, visionOS/Liquid Glass, Figma, Framer, Devin, Windsurf, Replit, VS Code, Claude Code desktop, Antigravity, tldraw, Live Share, JetBrains, Ableton, Bloomberg, Superhuman) + uma busca de 23/09/2026. Não vi em nenhum: (a) linha desenhada entre o painel do agente e o objeto atravessando colunas; (b) seguir opcional que não sequestra; (c) espiar do bloco do agente para o antes/depois no meio; (d) leitura ↑/↓ + tempo de ida e volta no cabeçalho de um terminal de equipe. "Não vi" não é "não existe".

## 3. Layout (esquerda · meio · direita · topo · rodapé · TV · celular · iPad)

Grade da Estação: `44px | Catálogo 264px (208–424, passo 8) | Campo 1fr | Mesa 360px (312–520, passo 8)`, com `topo 32px` e `rodapé 24px`. Chão `--s0`; Campo em `--s1` (um degrau mais claro: o trabalho tem precedência, Linear 03/2026); a coluna onde a pessoa agiu por último sobe para `--s1`, as outras ficam em `--s0` (profundidade de 2 planos, sem vidro, sem 3D).

### Topo (32 px)
- Esquerda: o "b" em SVG, 16 px, estático, `--texto`; **acende** (drop-shadow 0 0 6 px `--t2`) só quando a sala grava, há projeção ou um agente age. É o único sinal de marca (regra do manual da NASA).
- Centro: vazio. Nada compete com o trabalho.
- Direita: sino 24×24 (novidades, contador zera ao abrir) · foto 22 px (abre o Perfil) · ícone "Tela da TV" 24×24.
- Saem do topo: "ESTAÇÃO · PROTÓTIPO" e o seletor "Ver como" (fica no protótipo como ferramenta de teste por `#como=<pessoa>` e `Ctrl Shift V`; não existe no app).

### Esquerda: Catálogo
- **Barra de atividades** 44 px: 12 ícones de 20 px (Meu dia · Criar · Trabalho · Chat · WhatsApp · Reunião · Terminais · Projetos · Acervo · Equipe · Loja · Oficina), alvo 32×32 com 6 px de folga, rótulo opcional de 10 px Plex Medium abaixo (ligado na primeira semana; Figma UI3). Ativo = ícone em `--texto` + traço de 2 px `--t0` na borda esquerda; sem fundo colorido.
- **Lateral** 264 px: campo de filtro 28 px no topo; grupos com rótulo 11 px Plex Medium caixa-alta tracking 0.08 em em `--fraco`; linhas de 24 px (compacta: 20) com ícone 14 px + nome 13 px Plex Medium; à direita, foto de 14 px de quem salvou por último e/ou presença (anel de 6 px: cheio = agora, 50 % = últimos 5 min, contorno = hoje). Hover/foco revela `…` de 24×24 com o mesmo menu de ações da paleta (Projetar · Levar para a reunião · Pedir ajuda · Chamar para cá · Enviar para <pessoa> · Sugerir mudança). Um só "+" (nota, mapa, quadro, tela, máquina, pesquisa, arquivo, subir). Computador desligado = ficha pontilhada (já existe). Sem animação de abrir/fechar pasta.
- Modo "Sozinho · minha pasta" ↔ projeto continua no topo da lateral; em projeto, a árvore agrupa por membro (a minha primeiro) e mostra "N pessoas com você agora" como linha de base do interferômetro (ver 5.2).

### Meio: Campo
- Abas 32 px: ícone 14 + nome 12,5 px Plex Medium; × só no hover/foco, alvo 24×24; `✕✕` fecha todas. Âncora da visada: ponto central da borda inferior da aba ativa. À direita da fila de abas, quando há Máquina ou `.html` aberto: rótulo de ambiente `local · branch · produção` em mono 11 px (o "main" do Framer).
- Conteúdo: a bancada toma a forma do objeto — folha (md, código, csv, pdf, imagem, vídeo, ata), palco + ficha (Máquina), borda infinita (quadro, mapa mental), Site | Código | 3D (html), mesa (Reunião). Abas e status ficam fixos; só o conteúdo muda (crossfade 180 ms).
- Vazio = Pale Blue Dot: um ponto de 3 px na cor da pessoa dentro de um feixe vertical de 1 px a 4 %, e a linha "Nada aberto · Ctrl K" (13 px, `--fraco`). Nada anima. Substitui a marca-d'água.
- Modos que tomam a tela (Reunião, Projeção/prévia da TV, Quadro) escondem Catálogo e Mesa com `Ctrl Shift B` ("só o Campo"); `Ctrl B` e `` Ctrl ` `` continuam.
- "Revisar mudanças" (aceitar/rejeitar por trecho) é uma aba do Campo: serve ao "Sugerir mudança" em arquivo de colega e ao que o agente editou.
- Grade de pontos de 8 px a 2,5 % só no palco da Máquina, no quadro e no vazio.

### Direita: Mesa
- **Abas de agentes** 28 px: avatar bitmap 7×11 (11×17 px) na cor da pessoa + nome em mono 12 px + anel de estado 14 px; `+` 24×24 (nome, o que faz); renomear/apagar no menu `…`. No canto direito da fila: indicador "ao vivo" de 12 px (ponto + traço radial que dá uma volta a cada 4 s, rastro decai em uma volta) — só quando o terminal está transmitindo; clicar pausa/retoma (era o item do rodapé). "X está no seu terminal" = segunda inicial ao lado do agente (segunda antena travada no mesmo alvo).
- **Mostrador** 56 px, superfície `--s2`, borda 1 px `--linha` tingida 12 % com a cor do agente enquanto ele age (`#1d3343` para a pessoa H=215): linha 1 = objeto travado (mono 12 px Medium) + tipo; linha 2 = iniciais de quem está com ele · `↑ 0,3 s` / `↓ 2,4 s` (mono tabular) · botão `Seguir` 24×24 (aparece quando um agente está em outro objeto).
- **Registro** (flex, mono 12,5 px/1,5 Regular): lista de blocos tipados, fechados = imutáveis, colapsados por padrão (modo "Normal" do Claude Code): `pedido` (texto da pessoa; menção vira chip com foto) · `consulta` ("o que consultei": lista de arquivos/acervo, `--apagado`) · `plano` (passos numerados; a pessoa pode editar antes de rodar) · `ação` (trilho de 2 px `--ok` + "desfazer" 24 px) · `resultado` (cartão com prova: miniatura 96×54 ou trecho; nunca cartão dentro de cartão) · `espera` (trilho `--atencao`, "Confirma? s/N" com dois botões e teclas) · `falha` (anel aberto + "próximo passo" em uma linha). Comandos `coop` e shell continuam blocos comuns com comando, saída, código de saída e tempo (Warp). O que o agente roda por conta própria não vira bloco de shell da pessoa.
- **Comando**: fila de receitas 28 px (≤ 3 chips, mudam com o objeto travado; sem objeto, "Explicar · Procurar no acervo · Resumir a reunião") e campo ❯ 36 px. Gramática `coop <verbo> <objeto>` em dois registros (DSKY): o verbo reconhecido ganha sublinhado sólido de 1 px e o objeto sublinhado pontilhado. Enquanto uma ação de vários passos roda, aparece `■ parar` (24×24) à direita do campo e `Esc` para. Apresentação do agente só na primeira abertura.
- Densidade: mesma escala global de 4 px; nunca densidade por coluna sem regra (Cloudscape).

### Rodapé (24 px): fileira de luzes (DSKY)
Sete casas fixas, da esquerda para a direita: `presença · caixa · cronômetro · sala · projeção · controle · atualizar`. Apagada = contorno de 1 px `--linha` sem texto (nada a dizer). Acesa = texto em mono 11 px Medium tabular: presença (ponto + palavra), caixa (`3 esperando meu OK`), cronômetro (pílula `00:12:40` + disco de 12 px que gira 1 volta/60 s enquanto conta; clique destaca/abre a caixa móvel), sala (memória dos 5 min como coluna Wow!: 25 caracteres, um a cada 12 s, espaço = silêncio, `1–9 A–Z` = intensidade; gravando = ponto vermelho de 6 px batendo a 1,6 s), projeção (`▲ ▼ ✕` de 24 px), controle (`Carla está no seu terminal · Encerrar`), atualizar (`⬆ v23`, atualiza em fundo e avisa uma vez). Oitava casa transitória à direita: `Salvo na equipe` nasce a 100 % e decai a 0 % em 6 s. Saem do rodapé: "acervo: 76", "TV não aberta", "terminal ao vivo" (foi para a Mesa).

### TV (16:9, sem botão)
- Chão `--s0` por padrão (tema "Noite"). O tema roxo atual continua como opção "Ametista" (chão `#090413`), e "Visita" usa Cosmic Latte `#fff8e7` de fundo com texto `#060b16` (Lc 101,8). Escolha na engrenagem da janela "Tela da TV" e por `coop tv`. Sem fundo que respira; o único movimento ornamental permitido é o loop de espera/visita (seção 7, opcional), e ele para em `prefers-reduced-motion`.
- Modos: painel · reunião · quadro ao vivo · projeção · site · visita. Painel: grade de 12 colunas, calha 2,6u, hairlines 1 px; zona que gira só troca em mudança de dado (crossfade 400 ms); placar de metas com anel que fecha aos 100 % (800 ms, uma vez); cronômetros e relógio em mono tabular 43–76 px; "evolução da semana" = 7 linhas empilhadas (CP 1919) ≤ 120 px ao lado do número; pergunta da semana, ideia e sugestão da sala em Cormorant Garamond 500 ≥ 48 px em `--latte`.
- Projeção: conteúdo real; luz de projetor = degradê `--t2 → --t0` de 24 px nas quatro bordas, estático, some ao encerrar (o único lugar da TV onde o degradê da marca sobrevive inteiro).
- Selos da sala no canto: coluna Wow! em 2u; gravando = ponto 1,2u batendo; "áudio apagado" em mono. Sugestão de ideia = faixa fina de 30 s que decai. Cuidando da gente = convite discreto, nunca ranking. Nenhum som, nunca.

### Celular (< 760 px)
- Abas embaixo (56 px): Meu dia · Demandas · Chat · Criar · Mais. Alvos 48 px; ação primária na zona do polegar.
- A Mesa abre de "Mais → Mesa" ou deslizando da borda direita, como folha de tela inteira; o Mostrador vira o cabeçalho (`→ README.md · ↓ 2,4 s`); sem linha (não há colunas): a visada vira o chip do objeto. Registro e ❯ iguais.
- Cronômetro como pílula fixa no topo; notificações uma por vez, rajada juntada; TV controlada por `coop tv` na Mesa.

### iPad
- Só o quadro, sem cromo. Barra de ferramentas embaixo com alvos de 48 px (caneta, marca-texto, borracha, post-it, texto); "Projetar na TV" e "Estação" no canto superior direito; grade de pontos 8 px a 2,5 %; salva sozinho no `.quadro` da pessoa; não há visada nem Mesa.

## 4. Linguagem visual

### 4.1 Paleta (hex; APCA calculado localmente, conferir em apcacontrast.com)

**Superfícies (mesmo matiz do chão, L crescente, escada de 4 degraus; zero sombra colorida)**
- `--s0 #060b16` chão: laterais, topo, rodapé, TV
- `--s1 #0b1320` Campo e coluna "com a palavra"
- `--s2 #161e2d` elevado: Mostrador, paleta Ctrl K, cartões
- `--s3 #212a3b` hover / seleção
- `--linha #4d5564` divisórias estruturais de 1 px (Lc 15,8 sobre `--s0`; a 9–14 % a linha some: Lc < 10)
- `--linha-fraca rgba(215,228,251,.09)` separadores internos (decorativos, abaixo do limiar de fronteira, de propósito)
- `--pontos rgba(255,255,255,.025)` grade de 8 px

**Texto (frio = sistema)**
- `--texto #d7e4fb` corpo do Campo (Lc 89 sobre `--s1`)
- `--texto-90 #c3cfe5` corpo nas laterais e no Registro (Lc 76)
- `--apagado #a8b8d5` rótulos, blocos `consulta`/`plano` (Lc 63; o atual `#8799bc` dá Lc 47 e reprova)
- `--fraco #6c7b96` placeholder, desabilitado, "Nada aberto" (Lc 31; o atual `#5a6a8c` dá Lc 24 e reprova)

**Leitura humana (quente = pessoa)**
- `--latte #fff8e7` a 88 % (`#e2ddcf` sobre `--s1`, Lc 85) para tudo que é fala: ata, ideia falada, sugestão da sala, pergunta da semana, saudação. Fundo do tema Visita da TV.

**Escala de tempo (JWST): o degradê roxo → azul → ciano vira escala ordenada, nunca fundo, nunca texto pequeno**
- `--t0 #2ad5e5` agora / ao vivo (Lc 70)
- `--t1 #7ba4f0` hoje (Lc 53)
- `--t2 #a376e9` mais antigo (Lc 41)
- Uso: anel de presença, "mudaram por último", linha do tempo do perfil, evolução da semana, luz de projetor, o brilho do "b" quando aceso. `--t1` e `--t2` nunca como texto abaixo de 18 px.

**Estado (significado fixo)**
- `--ok #7fd6a6` (Lc 71) · `--atencao #f0b35a` (Lc 68) · `--alarme #ff6b6b` (Lc 49: sempre com ícone ou trilho, nunca texto sozinho) · `--sem-dado #5d6b78`

**Reino (metal + pedra, herdados da LP do Reino; ≤ 10 % da tela; só no Perfil, no selo e na comemoração; nunca em botão primário)**
- `--aco #aeb6c2` · `--bronze #b8743a` · `--prata #e6eaf0` · `--ouro #f5c76a` (Lc 76) · `--ouro-fundo #a8741e` · `--ouro-luz #ffe9b0` · `--ametista #8f3dff` (Lc 29: só preenchimento, nunca texto)
- Regra de tintura como aceite: metal só sobre `--s0…--s3`; ouro sobre prata mede Lc 13,7 (ilegível) → fimbriação obrigatória de 1 px em `--s0` quando dois metais se tocam.

**Pessoa (11 matizes, `oklch(0.78 0.11 H)`, Lc 61–66 sobre `--s0`; escolhida uma vez, gravada no perfil, nunca reatribuída; o agente herda a cor da pessoa)**
- H20 `#f69a9a` · H52 `#efa374` · H85 `#d8b260` · H118 `#b1c16d` · H150 `#82cb92` · H183 `#57cebe` · H215 `#54c9e3` · H248 `#7dbdfa` · H280 `#a9b0fd` · H313 `#d0a3ea` · H345 `#ea9bc7`
- Onde aparece: anel do avatar, inicial, visada do agente, ponto da extremidade no mapa de pulsares, borda da aba/coluna ativa quando é de outra pessoa. Nunca chip cheio, nunca fundo.

**Fórmula (Linear):** todo tema nasce de três variáveis em OKLCH — base (`--s0`), acento de tempo (`--t0`) e contraste (`--texto`); tema claro e alto contraste saem da mesma fórmula.

### 4.2 Tipografia (três famílias, teto)
- **IBM Plex Sans** (OFL; 100–700 + Text 450): corpo 13 px/1,45 **Text 450** na Estação (o 450 compensa o escuro), 14 px no celular; nomes na árvore e abas 12,5–13 px **Medium 500**; títulos 15 · 17 · 20 px **SemiBold 600**; rótulos de seção 11 px Medium caixa-alta tracking 0,08 em. Piso 11 px.
- **JetBrains Mono** (OFL; Thin–ExtraBold, variável): Registro 12,5 px/1,5 **Regular 400** (ligaduras ligadas só em bloco de código; `font-variant-ligatures: none` em leituras, IDs e tokens); Mostrador, rodapé e ficha 11 px **Medium 500** `tabular-nums`; cronômetro 20/34 px Medium; TV 43–76 px Medium; rótulos da ficha da demanda (`PARA · PRAZO · ESTIMA · PRIOR.`) 11 px Medium caixa-alta.
- **Cormorant Garamond** (OFL; display; 5 pesos): só **Medium 500** e **SemiBold 600**; ≥ 24 px na Estação (ideia falada, sugestão da sala, saudação da primeira abertura, nome do projeto na capa), ≥ 40 px na TV; **Cormorant SC** 600 ≥ 20 px tracking 0,06 em para nome de nível e de selo. Nunca abaixo de 20 px; nunca em corpo de UI.
- Escala da Estação (6 tamanhos, Stripe): 11 · 12,5 · 13 · 15 · 20 · 34. TV: 27 · 32 · 43 · 54 · 76.
- Sem quarta família (nada de pixel/dot): o bitmap 7×11 já é o registro "sinal".

### 4.3 Forma e traço
- Raios concêntricos: janela 10 → painel 8 → cartão 6 → chip/kbd 4 → 2 (raio interno = raio externo − padding real).
- Ícones: 20 px na barra, 14 px em árvore/abas; traço 1,5 px; cantos vivos (miter), terminais retos (butt); sem preenchimento, sem sombra; `currentColor`; grade 20 com margem 2; família inteira numa leva única (seção 7).
- O anel é a régua (Golden Record): 14 px, traço 1,5 px, o mesmo círculo em `:focus-visible` (contorno 1,5 px `--t0`, offset 2), estado do agente, disco do cronômetro, meta a 100 % e ideia salva.
- Avatar de agente: bitmap 7×11 (primos de Arecibo) em `<rect>` SVG na cor da pessoa, simétrico no eixo vertical (4 colunas únicas → 44 bits do hash do nome); distingue agente (bitmap) de pessoa (foto) à primeira vista. Nunca para ícones de ação.
- Ficha da demanda (Blue Book): rótulos mono caixa-alta na coluna de 72 px à esquerda, valores em Plex; estado como carimbo reto de 1 px em mono (`LIVRE · EM CURSO · PAUSADA · PRONTA · OK`), sem rotação, sem vermelho. Busca vazia: `Não identificado · 0 de 76`.
- Keycap: `kbd` 11 px mono Medium, `--s2`, borda 1 px `--linha`, borda inferior 2 px, raio 4.
- Sem cartão dentro de cartão; listas dentro de cartões usam `--linha-fraca`.
- Espaçamento em múltiplos de 4; duas densidades globais (confortável 24 px / compacta 20 px) na engrenagem da pessoa.

### 4.4 Motion (durações e easings)
- `--ease-saida: cubic-bezier(.2, 0, 0, 1)` (sem overshoot) · `--ease-heroi: cubic-bezier(.16, 1, .3, 1)`.
- `--mov-padrao`: hover/foco 120 ms (opacidade e cor, só); entrada de bloco/painel 180 ms opacidade 0 → 1 **sem deslocamento** (regra dos foguetes-fantasma: nada deixa rastro).
- Visada: 240 ms `--ease-saida` (`stroke-dashoffset`); anda por ação da pessoa (aba, espiar) ou do agente (a linha dele); o Campo nunca anda sozinho.
- Anel do agente: 1,2 s linear em laço enquanto pensa; fecha em 180 ms ao terminar; fica aberto na falha.
- "Ao vivo": 4 s linear por volta, rastro decai em uma volta; só com transmissão real.
- Cronômetro: disco de 12 px, 1 volta/60 s linear enquanto conta; para ao pausar (a única metáfora física, Teenage Engineering).
- Notificação passageira: 100 % → 0 % em 6 s linear, sem botão de fechar; com ação exigida: fica até a ação.
- `--mov-heroi` (`--ease-heroi`), quatro momentos e só: entrada pela primeira vez (clipe de 4 s, uma vez; termina no "b" estático), meta a 100 % (anel fecha, 800 ms), selo abre no OK de quem pediu (400 ms), ideia salva (círculo fino fecha ao redor do trecho, 400 ms).
- Zero animação: abrir/fechar pasta, filtrar, trocar de aba, trocar de atividade. Modos que tomam a tela: crossfade 180 ms.
- Teto: 2 sinais vivos por tela. Regra "nada anima sem dado": lista de aceite com cada animação e o evento que a dispara.
- `prefers-reduced-motion`: visada aparece já no destino; anel estático (aberto = pensando, fechado = parado); "ao vivo" = ponto fixo; disco parado; clipe de entrada = último quadro; loop da TV = pôster; coluna Wow! troca sem transição; notificação some por passo (não decai). Substitui o `0.01ms !important` atual, que apaga o feedback útil.

### 4.5 Luz e material
- Elevação só pela escada de superfície; zero `box-shadow` colorida; a paleta `Ctrl K` é a única sombra (`0 24px 60px rgba(0,0,0,.55)`) e o único vidro (`--s2` a 92 % + blur 12 px, borda 1 px `--s0`, fallback opaco, `prefers-reduced-transparency` respeitado). Nunca vidro em painel de conteúdo; nunca vidro sobre vidro; texto sempre plano.
- Três emissores de luz, nada mais: (1) o estado do agente tinge a borda do Mostrador a 12 %; (2) o "b" acende com drop-shadow de 6 px `--t2` só quando a sala grava, há projeção ou um agente age; (3) a luz de projetor da TV (24 px nas quatro bordas). Sem halo radial, sem neon permanente, sem texto em degradê (`.oficina-v`, `.cron-relogio`, `.term-linha.saida` saem).
- Profundidade semântica: 2 planos. A coluna com a última ação da pessoa em `--s1`; ao agir, o Mostrador do agente sobe para `--s2`. Sem tilt, sem parallax, sem ambiente 3D (a vista "3D" do `.html` continua como conteúdo, não como casca).
- Textura: só a grade de pontos de 8 px a 2,5 %. Sem grão, glitch, scanline, ruído.

### 4.6 Som de interface
- Desligado por padrão; liga na engrenagem da pessoa; só depois de gesto; `visibilitychange` pausa; TV nunca tem som.
- Seis sons, ≤ 400 ms, −18 LUFS, um por evento: `pedido` (tique curto), `resultado` (duas notas descendo), `espera` (um ping suave, o agente precisa de você), `ideia salva` (bloom de seno curto), `selo` (toque surdo de cera), `meta` (três notas subindo). Nenhum leito musical.

## 5. A mistura, cada uma reduzida ao traço mínimo

- **Reino** (uma camada: Perfil, selo, cerimônia): tokens de metal + pedra herdados do Reino (`--aco --bronze --prata --ouro --ametista`); nível por material sem comparação entre pessoas; selo com aro de metal em 4 graus, "como foi ganho" no hover, ocultável; o "selo que abre" (400 ms) quando quem pediu dá OK na demanda; Cormorant Garamond como voz cerimonial e humana; o token `babel-…` como convocação (clipe de entrada, uma vez); numeração `03` e barras `6/10` do app Reino. Nada de coroa, brasão, escudo, castelo, trono, guilda (não existe no FUNCOES.md; não se inventa função).
- **Ufologia** (uma camada: observação e sinal): a visada; a coluna Wow! da memória da sala; o bitmap 7×11 de Arecibo nos agentes; o indicador "ao vivo" de radar PPI; ↑/↓ + tempo de ida e volta do DSN; a ficha e o carimbo do Blue Book nas demandas; o Pale Blue Dot no vazio; a escala de tempo do JWST; o anel de traço único (Arrival) como estado do agente; o mapa de pulsares como mapa da equipe; o interferômetro (ALMA) como "N pessoas com você agora". Nada de disco, alienígena, radar verde, hexágono, HUD, estrelas.
- **Futurismo** (transversal, invisível): precisão medida — latência exibida, `tabular-nums`, 100 ms de resposta, tokens derivados em OKLCH de três variáveis, raios concêntricos, um chão só para Estação, TV, iPad e celular (mesma física, outra escala). Sem cromo, sem glow, sem vidro.
- **Empreendedorismo** (a gramática dominante): registro de instrumento sério (Bloomberg/Aesop: contenção como vantagem); o OK de quem pediu como rito; a ficha da demanda; o placar de metas e a trilha "Where Is Webb" das campanhas e tarefas com fluxo (passo concluído em miniatura, atual grande, alternador tempo | %); a Máquina como Lego de backend com ambiente e cofre; Loja e Oficina como poder de mudar o próprio instrumento.
- **Criatividade** (uma camada: o Campo): a bancada toma a forma do objeto; quadro de borda infinita no iPad; mapa mental MindForge; "Editar na tela"; Cormorant e Cosmic Latte para o que a equipe fala; o Sonho como 7 linhas empilhadas ao lado de um número.
- Denominador comum (Japandi): ordem clara que abre espaço para o desconhecido. Um domina (instrumento calmo, empresarial); os outros entram pequenos, cada um numa camada só.

## 6. O que NÃO tem (recusado de propósito)
Vidro em painel de conteúdo · vidro sobre vidro · texto em degradê · degradê em botão, cabeçalho ou fundo · halo radial · neon permanente (o `@keyframes neon` de 3,4 s) · ponto pulsante quando nada muda · brilho que não seja estado · grão, glitch, scanline, ruído, partículas, estrelas cintilando, parallax de galáxia · disco voador, alienígena, letras "alienígenas", carimbo vermelho rotacionado, radar verde em tela cheia, hexágonos, HUD com mira, sete segmentos, Eurostile/Orbitron · coroa, brasão, escudo, castelo, foguete, trono, cetro, guildas · logo grande no meio ou no terminal · logo em PNG · "b" volumétrico em 3D · quarta família tipográfica (pixel/dot) · Inter, Geist · Cormorant abaixo de 20 px · mono em rótulo de seção · ranking, rebaixamento, streak de dias corridos · cor de cargo sobrepondo cor de pessoa · chip cheio colorido · degradê/holográfico em cargo ou selo · ouro em botão primário · sigilo heráldico por pessoa (iniciais + cor bastam) · selo "IA" · 46 textos de ajuda · toast de progresso do agente · som na TV · leito musical · easing elástico · animação em hover, pasta, aba, filtro · fundo em movimento atrás de texto de trabalho · fundo gerado por IA atrás de texto · cartão dentro de cartão · box-shadow colorida · densidade por coluna sem regra · "Ver como", "Neon", "ESTAÇÃO · PROTÓTIPO" e botões de demonstração no cromo · Lottie/Rive em runtime · vídeo com canal alfa · Deployment com `min_instances: 1` · TV com chão roxo por padrão (fica como tema opcional "Ametista").

## 7. Elementos gerados por IA na Replicate (slugs confirmados na rodada 2; preços da frente geracao-replicate)

Regras do material do Theus que valem para todos: REGRA 1 keyframe antes de vídeo · REGRA 3 baixar em 1 h para `/assets/raw/<slug>/<seed>/` + `MANIFESTO.json` · REGRA 4 seed fixa por sequência (`19770815`, a data do Wow!) · REGRA 5 conferir schema antes de chamar · REGRA 6 orçamento duro (US$ 20; parar em US$ 16) · REGRA 7 sem áudio automático · REGRA 8 `prefers-reduced-motion` · "um efeito só entra se for metáfora do serviço" · ícone nunca PNG vetorizado · vídeo assíncrono com `Cancel-After: 15m` e webhook `completed` + polling de reserva · `Prefer: wait` só para SVG/imagem.

| # | Elemento | Modelo | Formato final | Custo |
|---|---|---|---|---|
| 1 | Keyframes do "b" (A = resolvido; N = ruído) | `google/nano-banana-2` (`image_input` = `babel-logo.png`, `aspect_ratio` 1:1, `resolution` 2K, `output_format` png) | 2 png 2K, sobre preto puro | 4 × US$ 0,101 ≈ US$ 0,40 |
| 2 | Clipe "Entrada" (o sinal resolve no "b"; toca uma vez no primeiro login) | rascunho `bytedance/seedance-2.0-fast` (480p, 1:1, `generate_audio: false`) → final `wan-video/wan-2.7-i2v` (`first_frame` = N, `last_frame` = A, `duration` 4, `resolution` 720p, `seed` 19770815) | mp4 H.264 sem áudio (`ffmpeg -an`), composto com `mix-blend-mode: screen` sobre `--s0` (sem alfa) | 0,30 + 0,40 ≈ US$ 0,70 |
| 3 | Loop da logo (abertura da Estação 3 s e espera da TV) | rascunho `wan-video/wan-2.2-i2v-fast` (720p, cobrado por vídeo) → final `wan-video/wan-2.7-i2v` em duas metades (clipe 1 livre de A; clipe 2 com first = último quadro de 1 e last = primeiro de 1; concat demuxer) | mp4 + webm, 6 s, pôster = A | 2 × 0,11 + 2 × 0,50 ≈ US$ 1,22 |
| 4 | Família de ícones (44) | `recraft-ai/recraft-v4-svg` (`size` 1024x1024; sem seed: mesmo prompt de estilo em toda a leva; `Prefer: wait`) | svg nativo, pós-processado: `stroke="currentColor"`, viewBox 20, svgo | 44 × 0,08 + 30 % de repetição ≈ US$ 4,60 |
| 5 | "Campo profundo" (fundo estático da TV em Visita/espera) | `google/nano-banana-2` (16:9, 4K, png), 2 tentativas | png 4K → webp; opacidade ≤ 6 % sobre `--s0` | 2 × 0,151 ≈ US$ 0,30 |
| 6 | Fundo em loop da TV (Visita/espera; opcional) | rascunho `wan-2.2-i2v-fast` → `wan-2.7-i2v` duas metades, `first_frame` = campo profundo, 10 s 720p | mp4 10 s sem seam; pôster = #5 | 0,22 + 1,00 ≈ US$ 1,22 |
| 7 | Seis sons de interface | `stability-ai/stable-audio-2.5` (`duration` **3**, `steps` 8, `cfg_scale` 7, `seed` 19770815; sem áudio de entrada) | 6 × wav → mp3/ogg ≤ 400 ms, cortados no ffmpeg, −18 LUFS | 6 × 2 variantes × 0,20 ≈ US$ 2,40 |
| | **Total** | | | **≈ US$ 10,84** (54 % de US$ 20; aviso em US$ 16) |

Sem IA (custo zero, à mão): o "b" em SVG do topo (traçado à mão a partir do PNG aprovado, com o keyframe A como referência de luz); bitmaps 7×11 dos agentes (hash do nome); visada, anel, radar, disco, coluna Wow!, selo que abre, Pale Blue Dot, grade de pontos, luz de projetor (CSS/SVG).

### Prompts prontos (em inglês, como os modelos respondem melhor; um por elemento)

**#1 keyframe A (nano-banana-2)**
```
Use the attached logo as the exact reference for shape and proportions. Render the lowercase letter "b" mark exactly as in the reference, centered, occupying 42% of the frame height, on a pure black background (#000000). The mark is a thin neon tube of glass, 3 px apparent thickness, glowing with a smooth ordered gradient from violet (#a376e9) at the bottom to cyan (#2ad5e5) at the top, soft halo no wider than the tube itself, no bloom, no lens flare, no reflections, no floor, no text, no other objects. Studio-still, perfectly sharp, square 1:1, photographic realism, flat black everywhere except the tube.
```
**#1 keyframe N (nano-banana-2, com A como `image_input`)**
```
Same framing, camera and black background as the attached image. Replace the neon "b" with faint monochrome radio noise: a barely visible field of tiny grey grains (2–3% brightness) evenly scattered, with a single dim vertical hairline of light 1 px wide at the exact center where the mark will appear. No shapes, no letters, no color, no vignette. Pure black elsewhere. 1:1.
```
**#2 clipe Entrada (seedance-2.0-fast para rascunho; wan-2.7-i2v final, first = N, last = A)**
```
[LENS] fixed 50mm, f/4, everything in focus, locked-off camera, no movement.
[MOTION] over 4 seconds the scattered grains drift toward the center at constant speed and condense into the thin neon "b" tube; the tube lights from bottom (violet) to top (cyan) in the last second and holds perfectly still at the end.
[SUBJECT] a single lowercase "b" made of a thin glass neon tube, exactly as in the last frame.
[LIGHT] the tube is the only light source; black background stays pure black.
[ENVIRONMENT] empty black void, no floor, no particles other than the grains that become the mark.
[NEGATIVE] no camera motion, no zoom, no cut, no flicker, no text, no lens flare, no bloom, no color shift, no extra shapes, no sound.
```
`negative_prompt`: `camera shake, zoom, cut, flicker, text, watermark, lens flare, bloom, glow spread, extra objects, color banding`. `audio` omitido → descartar com `ffmpeg -an`.

**#3 loop da logo (wan-2.7-i2v, duas metades, first = A)**
```
[LENS] fixed 50mm, locked-off, no movement.
[MOTION] the neon tube stays perfectly still; only its light breathes once, very slowly: brightness rises 8% over 3 seconds and returns over 3 seconds, like a lamp in a quiet room. Nothing else moves.
[SUBJECT] the thin neon "b" exactly as in the first frame.
[LIGHT] the tube is the only light; pure black background.
[NEGATIVE] no camera motion, no zoom, no cut, no flicker, no pulsing faster than 3 seconds, no halo growth beyond the tube, no text, no particles, no sound.
```
Metade 2: `first_frame` = último quadro da metade 1, `last_frame` = primeiro quadro da metade 1; cortar um quadro de cada ponta e concatenar (`-c copy`).

**#4 família de ícones (recraft-v4-svg; prompt idêntico, só muda a última linha)**
```
Single UI icon, vector line art. Monoline stroke of exactly 1.5 px on a 20×20 grid with a 2 px inner margin, square miter corners, butt line caps, no fill, no shadow, no gradient, no texture, no background, no text. Pure black (#000000) stroke on transparent. Geometric, sober, precise, the register of an instrument panel in a control room: every line has a function, nothing decorative. Consistent optical weight with a family of 44 icons drawn in the same hand. Subject: <ícone>.
```
Lista (44) com o sujeito em uma frase: **atividades** meu-dia (a sun disc half above a horizon line) · criar (a blank sheet with one folded corner) · trabalho (a rectangle with a short baseline underneath, a ticket) · chat (two overlapping speech rectangles) · whatsapp (a single speech rectangle with a small handset inside) · reuniao (a round table seen from above with four seats) · terminais (a rectangle with a chevron prompt inside) · projetos (three nested rectangles offset like a stack) · acervo (an open book seen from above) · equipe (three small circles in a row on a baseline) · loja (a simple box with a slot on top) · oficina (a wrench and a slash crossing) — **tipos** pasta (a folder outline) · nota-md (a sheet with two horizontal lines) · codigo (angle brackets) · tabela-csv (a 3×2 grid) · pdf (a sheet with a bottom band) · imagem (a rectangle with a small circle and a mountain line) · video (a rectangle with a triangle) · mapa-mental (a circle with three branches) · quadro (a rectangle with a free curve inside) · tela-html (a browser window with a top bar) · maquina (three blocks connected by one line) · pesquisa (a magnifier) — **ações** projetar (a screen rectangle with an upward arrow) · levar-reuniao (a round table with an arrow entering) · pedir-ajuda (a raised hand outline) · chamar (a person circle with a radio wave) · seguir (an eye with a line to a small square) · parar (a square) · desfazer (a counter-clockwise arrow) · versoes (a clock with a counter-clockwise arrow) · editar-na-tela (a cursor arrow over a rectangle) · salvar (a downward arrow into a tray) · subir-arquivo (an upward arrow out of a tray) · gravar (a circle with a small dot) · memoria-sala (a horizontal line of five short vertical ticks) · ideia-falada (a speech rectangle with a small lightbulb) · cronometro (a stopwatch) · presenca (a small circle inside a larger ring) · sino (a bell) · tv (a wide rectangle on a short stand) · engrenagem (a gear) · buscar (a magnifier with a short line).
Pós-processamento: `sed -i '' 's/#000000/currentColor/g; s/stroke-width="[^"]*"/stroke-width="1.5"/g'` + svgo; rejeitar qualquer ícone com `<path>` preenchido ou mais de um grupo.

**#5 campo profundo (nano-banana-2, 16:9, 4K)**
```
Ultra-dark deep-field background, 16:9. Near-black (#060b16) everywhere with an extremely faint, smooth nebulosity that drifts from violet (#a376e9) in the lower-left to cyan (#2ad5e5) in the upper-right, never exceeding 6% brightness above the base. No stars, no points of light, no lens flare, no vignette, no texture, no grain, no text. Continuous, out of focus, calm. Suitable as a static wall behind a TV dashboard.
```
**#6 loop da TV (wan-2.7-i2v, duas metades, first = #5, 10 s)**
```
[LENS] fixed wide, locked-off. [MOTION] the faint nebulosity drifts 1% to the upper-right over the full 10 seconds at constant speed; nothing else changes. [SUBJECT] the deep-field background exactly as in the first frame. [LIGHT] no light sources; brightness never exceeds the first frame. [NEGATIVE] no stars, no sparkles, no flicker, no camera motion, no zoom, no cut, no text, no new shapes, no sound.
```
**#7 sons (stable-audio-2.5; mesmo prompt-base, seed 19770815, `duration: 3`)**
```
Base: Minimal user-interface sound, dry studio recording, no reverb tail longer than 200 ms, no music, no melody beyond the notes described, mono-compatible, quiet, precise, like a well-made instrument. 
pedido: a single soft wooden tick, 80 ms.
resultado: two soft sine notes descending a fifth, 250 ms total.
espera: one gentle glass ping, 300 ms, low volume.
ideia salva: a short sine bloom rising then settling, 350 ms.
selo: a muted thud of wax on paper, 200 ms.
meta: three soft notes ascending, 400 ms total.
```
Corte local: `ffmpeg -i in.wav -ss 0 -t 0.4 -af "loudnorm=I=-18" out.wav`; a TV nunca recebe estes arquivos.

## 8. Como cada função de `docs/FUNCOES.md` continua (nada sai)

**A. Casca** — Barra de atividades: 12 ícones (Meu dia · Criar · Trabalho[Demandas+Tarefas] · Chat · WhatsApp · Reunião · Terminais · Projetos · Acervo[+Inteligência] · Equipe[+Metas+Mapa] · Loja · Oficina), nenhuma função some, só o agrupamento. Lateral recolhe (`Ctrl B`, borda arrasta). Terminal recolhe (`` Ctrl ` ``, borda arrasta) = a Mesa. Abas do meio iguais; fechar todas → Pale Blue Dot. Paleta `Ctrl K` igual, com verbo · objeto em duas colunas. Barra de status = fileira DSKY (presença, caixa, cronômetro, sala/gravação/memória, projeção com ▲▼✕, controle de terminal, Atualizar vN, "Salvo na equipe" transitório); "terminal ao vivo" vai para a Mesa; "acervo: 76" vai para o cabeçalho do Acervo; "TV conectada/não aberta" vai para o ícone Tela da TV. Trocar presença no rodapé. Sino igual. "Ver como" fica no protótipo por `#como=` (não é do app). "Tela da TV" no topo. Celular < 760 px com as 5 abas. Identidade: chão `#060b16`, roxo → azul → ciano como escala de tempo e luz, mono no terminal, "b" pequeno em SVG.

**B. Criar** — Boas-vindas de Criar: os cartões Tela, Máquina, Pesquisa ficam; "Ver um exemplo em 3D" sai do meio (demo) e vira item da paleta. Seletor de modo sozinho/projeto no topo da lateral, com árvore por membro, "N pessoas com você agora" (interferômetro), o que cada um está fazendo e quem vê meu arquivo. Árvore com ícone por tipo (família SVG), foto de quem salvou, "recebido de X", ficha pontilhada. Filtrar. Um só "+" com Nota, Mapa, Quadro, Tela, Máquina, Pesquisa, arquivo, subir. Arrastar arquivo para pessoa (selo "recebido de você", aviso). Menu do arquivo (Projetar / Levar para a reunião) no `…` de hover, igual ao da paleta. Abrir arquivo de outro só leitura + "Sugerir mudança" (aba Revisar mudanças) + gestão edita com aviso. Editor de md/código/csv/pdf/imagem/vídeo/mapa/quadro na bancada. Editar e salvar (`Ctrl S`, foto no cabeçalho e na árvore, versão guardada). Versões (n) e Voltar como estava (ordem cronológica, data à esquerda). Formatado/Texto. Site | Código | 3D no `.html` (o 3D fica como conteúdo). Editar na tela com a barra Texto/↑/↓/Duplicar/Apagar e "Salvar (n)". Barra do arquivo: Projetar na TV, Levar para a reunião, Pedir ajuda, Chamar para cá. Mapa mental MindForge inteiro (Tab/Enter/zoom/⌘/buscar/tema/exportar/apresentar/minimapa/inspector/menu) sobre o chão da Babel. Mapa pelo terminal (o mapa abre atrás e a visada do agente aponta para ele; "Seguir" leva). Quadro de borda infinita. Máquina (peças, ficha "onde fica guardado", Testar, O que muda, Publicar, Ver o agente montando com anel, Pedir para alguém, ambiente como rótulo no topo do Campo, chave faltando no cofre). Máquina pelo terminal (peça tracejada + visada). Presets (salvar de Testar, lateral "Presets da equipe", "Começar de um preset", "★ Salvar como preset", pelo terminal).

**C. Terminal e agentes** — Painel à direita = Mesa (`nome@estacao · ~/BabelCoop · agente` na primeira linha do Registro). Abas com nome humano, "+", renomear, apagar; "Neon" deixa de ser botão e vira preferência "luz da marca: por estado / sempre / nunca" na engrenagem (a função de ligar/desligar continua). Estado do agente = anel de 14 px (pensando/parado/esperando/falhou). Menção vira chip com foto. Pedidos em português fazem tudo o que fazem hoje e deixam bloco `ação` com desfazer; o que é criado aparece na TV. Comandos `coop …` iguais, cada um como bloco. Shell simulado/real como bloco com código de saída. Receitas: ≤ 3, contextuais ao objeto travado. Terminal ao vivo: indicador de radar na Mesa (clique pausa/retoma). Parede de Terminais (atividade): um cartão DSN por agente de cada pessoa (↑/↓, ida e volta, anel), Entrar/Pedir (Aceitar / Agora não), Chamar, Falar, Assumir (segunda inicial), Sair; dono vê "X está no seu terminal · Encerrar" na casa `controle` do rodapé; modo compacto = cascata de colunas de 2 px. Navegador do agente: aba do Campo com cursor visível, Assumir/Devolver, Raio-X (HTML, CSS, Copy, Rede, Console, Selecionar), Clonar página, Clonar copy, Print (vira prova no bloco `resultado`). Navegador da pessoa: aba Navegador, endereço, Ir; o agente vê a mesma página. Marca da pessoa nas peças (cor + foto na Máquina, borda com cor e nome no bloco editado, quem salvou na árvore). Terminal real `Ctrl J` (só no app).

**D. Meu dia, demandas, tarefas, metas** — Meu dia = resumo com 3 números que apontam para Trabalho, o que estou fazendo, check-in (o que vou fazer / bloqueio), "Estou bem", pedir uma mão, apoiar alguém, ideia falada (botão), pergunta da semana (a casa dela). Nova demanda em Trabalho → Demandas ou pelo terminal, como ficha (PARA · PRAZO · ESTIMA · PRIOR. · PROJETO); quem recebe vê na caixa e a TV mostra. Cronômetro da demanda: Começar · Pausar (motivo) · Retomar · Pronta (aprendizado obrigatório, repetido soma +1) · OK só de quem pediu (selo abre). Cronômetro móvel (pega ⋮⋮, duplo clique volta, ▾ minimiza, posição lembrada, nunca fecha) — por padrão pílula no rodapé, caixa ao "destacar" ou clicar. Cronômetro destacado (janela PiP / sempre-no-topo) com Pausar/Continuar. Volta sozinho após 45 s ao mexer numa peça do trabalho (avisa e registra). Tarefas livres ("pegar" vira responsável, cronômetro começa). Pedir ajuda / Estou travado / Levar para a reunião dentro da ficha. Tarefas com fluxo (5 fluxos; lista/quadro/por pessoa/trilha "Where Is Webb"; OK de quem passou). Metas e campanhas dentro de Equipe → Metas: placar na TV, campanha pelo terminal, comemoração = anel fecha aos 100 % (800 ms, uma vez); "+1 cliente (demonstração)" sai do app e fica só no protótipo. Pausa automática fora do expediente em Equipe → Regras.

**E. Chat, reunião, sala** — Chat com #geral, canais, diretas, ✓✓, responder, reagir, emoji, anexar, "digitando…", na identidade da Babel (bolhas em `--s2`/`--s3`, sem degradê). Mensagem vira demanda / vai para a TV pelo menu da mensagem. Reunião como modo que toma a tela: iniciar, Levar para a reunião (arquivos, demandas, quadro), destacar, decisão / próximo passo, encerrar → ata em Cormorant + Latte; TV em modo reunião; quadro ao vivo. Memória da sala (5 min) = coluna Wow! na casa `sala` do rodapé e na TV (sem transcrever). Salvar ideia falada (botão na casa `sala` e em Reunião): cartão de confirmação com o texto, círculo fino na cor da pessoa fecha ao redor do trecho, guarda em Acervo → Ideias com hora e quem apertou. Começar a gravar / Parar (segurar 600 ms junta 10 min): ponto vermelho batendo no rodapé e na TV. Conversa particular pausa a escuta. A sala sugere (faixa fina na TV por 30 s, só se o padrão persistir 2 janelas de 12 s). Ideia falada individual em Meu dia (até 1 min).

**F. Acervo, inteligência, aprendizados, sonho** — Acervo com abas Buscar · Aprendizados · Ideias · Sonho · Prompts (Inteligência da equipe fundida; nenhuma função some). Busca palavras/semelhança, 6 filtros + "mais", sugestões, resultado com trecho e abrir, vazio = "Não identificado · 0 de N". Aprendizados (`APRENDIZADOS.md`, `coop aprendi`, +1). Melhores prompts (estrela, usar → Mesa). Sonhar (resumo do dia; 7 linhas empilhadas ao lado dos números). Cuidando da gente em Equipe (sinais que persistem por dias; "Estou bem"; avisa a pessoa antes da TV).

**G. Equipe, perfil, mapa, projetos, ajuda** — Equipe: cartões por pessoa só com nome, iniciais e cor; carga, check-in e horas (só gestão) numa aba "Carga" ao lado; regras; foto (pôr/trocar/tirar); Metas e Mapa como abas. Controle da TV sai da Equipe e vive na engrenagem da janela "Tela da TV" (modo, tema Noite/Ametista/Visita, quadro, visita, cronômetro na TV) e em `coop tv`. Convidar (token `babel-…` com os 3 passos; primeira abertura em um passo com diagrama de traço único Catálogo · Campo · Mesa). Perfil como aba inteira: trabalhos, tempo, dados e materiais, fatia (%), gamificação pessoal (nível por metal, selos com aro em 4 graus, sequência de dias úteis com check-in, congela em folga, só a pessoa vê), linha do tempo radial, agentes; sem ranking; filtro por período. Mapa da equipe = aba em Equipe como mapa de pulsares (linhas radiais, comprimento = tempo desde a última troca, marcas = trocas; o pulso de tarefa é um traço que anda pela linha). Projetos: lista + criar; abrir leva a Criar no modo do projeto (árvore por membro, conversa com chips "com todos"/"com <pessoa>", demandas, próximos passos, quadro, mapa, Máquina, agentes, Entrar, Falar, projetar evolução na TV). Ajuda par a par: Chamar para a minha tela, Falar com, Pedir ajuda a quem sabe, O que cada um está fazendo.

**H. WhatsApp e Loja** — WhatsApp como atividade privada (QR real no app; "Já escaneei (simulado)" só no protótipo), conversa, agente sugere resposta no campo (Enter manda; automático por contato com aviso de bloqueio); não vai para acervo nem TV. Loja: instalar skill/MCP/plugin/agente sem terminal, "Versão nova → Atualizar", publicar a minha, chave pede o cofre.

**I. TV** — Sem botão, `F` tela cheia. Modos painel/reunião/quadro/projeção/site/visita por `coop tv` e pela engrenagem da janela; três temas (Noite = `#060b16` padrão, Ametista = o roxo atual, Visita = Latte). Painel com zona que gira (avisos e mural, evolução da semana, pergunta, sonho, tarefas livres, ideias, evolução dos projetos), placar, cronômetros, relógio. Projeção com rolagem (PageUp/Down, ▲▼, `coop rolar`), luz de projetor, ✕ encerra. Site na TV. Selos da sala (ponto vermelho batendo, coluna Wow!, "áudio apagado"). Sugestão de ideia (faixa fina). Cuidando da gente (convite discreto, nunca ranking). Comemoração (anel fecha).

**J. iPad** — App à parte `#ipad`, só o quadro; ferramentas de 48 px; risca no iPad, risca na TV; salva no `.quadro` da pessoa (abre na Estação, entra no acervo); Projetar na TV; Estação ↔ iPad.

**K. Oficina** — Quem pode mudar o app (Liberar/Tirar; chip "pode mudar"/"só usa" em ametista fosca). Mudar o app pelo terminal ("muda no app: …" → Aguardando publicação com quem, agente e arquivos; barrado se não liberado). Publicar atualização vN (notas, histórico). Atualizar no rodapé (casa `atualizar`: baixa em fundo, avisa uma vez; Oficina mostra quem está fora de fase = sincronização do interferômetro). A versão em mono 34 px em `--texto`, sem degradê.

**L. Só no app** — inalterado (node-pty, rede, token real, transcrição, WhatsApp Web, webview, Supabase da Máquina, arquivo:linha, voz, atualização, sempre-no-topo, acesso de fora).

## 9. Riscos e "não sei"
- Imposto da novidade (Arc): a visada é um mecanismo novo; testar com 3 pessoas da equipe medindo tempo de tarefa e erro, não nota. Se confundir, a linha some e fica só o Mostrador (leitura), sem perder função.
- APCA calculado por implementação própria da fórmula 0.1.9; conferir em apcacontrast.com antes de fixar os tokens. Os tokens atuais `--e-apagado`, `--e-fraco` e as hairlines reprovam pela medição.
- `first_frame = last_frame` tende a gerar vídeo parado (ffmpeg.party): usar sempre as duas metades. Recraft SVG e nano-banana-2 não têm seed: a coerência vem do prompt idêntico e da leva única; qualquer ícone fora do traço é regerado com o mesmo prompt, não retocado à mão.
- O clipe de "Entrada" pode sair com bloom: rascunhar em seedance-2.0-fast 480p antes do Wan; rejeitar se o halo passar da espessura do tubo.
- Token da Replicate passou pelo chat (rodada 2): trocar ao fim da missão.
- Corrente do mercado leva o agente para o centro (Cursor 3, Zed agêntico); manter a Mesa à direita exige que ela pareça instrumento (Mostrador + blocos + receitas), não chat. Se em teste ela parecer "VS Code de 2024", o problema é o Mostrador, não a posição.
- A TV a 3 m: Cormorant 500 ≥ 48 px e Latte 88 % sobre `--s0` (Lc 85) foram calculados, não vistos numa TV real; medir na TV do escritório.
- Não sei: se a `IBM Plex Sans` do Google Fonts entrega o peso 450 (o pacote npm entrega; self-host resolve); a "unidade" de cobrança do Hunyuan 3D (não usado); o comportamento do `mix-blend-mode: screen` sobre o clipe no Safari do app Electron (testar).
- "Nordic UFO" continua ambíguo (frente ufologia); nada deste conceito depende disso.
