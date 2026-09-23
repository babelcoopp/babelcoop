# Conceito · BANCADA VIVA (mecanismo "Trilho": empurrar · puxar · apontar)

> Missão `babel-coop/design-2030` · etapa Conceber · ângulo "Bancada Viva" · 2026-09-23.
> Base lida: `PROMPT_AGENTICO_LP.md`, `BRIEFING_IA.md`, `docs/UX_PENEIRA.md`, `docs/FUNCOES.md`, `prototipo/base.css`, `prototipo/v3.css`, `IDEIAS.md` (5.17–5.19, 6, 7, 10), `docs/MAQUINA.md`, e as sete frentes de `pesquisa/`. Nenhuma fonte nova foi aberta nesta etapa: tudo o que se afirma sobre terceiros vem das frentes de pesquisa (URLs lá).
> Regra que governa tudo: **é proibido remover o que o Theus pediu** (`FUNCOES.md`). A seção 9 cruza função por função.

---

## 0. Nome e tese

**Nome:** Bancada Viva · Trilho.

**Tese em uma frase:** a tela do meio é uma bancada de oficina que toma a forma da peça que está sendo feita (folha, tela, palco da Máquina, mapa, quadro, mesa, conversa, ficha, parede); a esquerda é a prateleira de onde as peças vêm e a direita é o braço que trabalha; as três são o mesmo tampo, e toda peça que muda de coluna anda por um trilho visível de 1 px, sempre porque a pessoa fez um gesto (arrastou, apertou Enter, rolou o histórico). O terminal **empurra** peças para a bancada, **puxa** peças da bancada para o pedido e **aponta** na bancada o que cada bloco do histórico fez. O futurismo é precisão (números tabulares, latência mostrada, uma só fonte de luz, raios concêntricos), não brilho; o reino é contenção (metal sobre cor, selo que abre, versaletes), não brasão; a ufologia é contato e linguagem (o terminal é a sala de contato com inteligências de nome humano), não disco voador.

**Por que este ângulo resolve o pedido:** o Theus quer esquerda/meio/direita "de uma maneira que ninguém usou". A corrente do mercado (Cursor 3, Zed agêntico) está tirando o agente da lateral; manter o terminal à direita só faz sentido se o meio for visivelmente uma bancada e o terminal visivelmente um braço que age sobre ela (armadilha 1 da frente de anterioridade). O Trilho é a costura física entre os três: sem ele, é VS Code de 2024 com neon.

---

## 1. O mecanismo novo: o Trilho

### 1.1 As peças do mecanismo

| Parte | O que é | Medida |
| --- | --- | --- |
| **Tampo** | Duas linhas de 1 px (abaixo das abas e acima da barra de status) que atravessam as três colunas sem interrupção. As divisórias verticais param 8 px antes delas. As três colunas leem como um só plano. | hairline 9 % sobre o chão |
| **Prateleira** (esquerda) | Barra de atividades + árvore. Alimenta a bancada. | 48 px + 264 px |
| **Bancada** (meio) | Superfície que muda de forma por tipo de peça (§1.3). É o degrau de superfície mais claro. | flexível, mínimo 520 px |
| **Junta** | Faixa de 24 px entre bancada e braço. É onde as peças esperam para pousar e onde mora o cursor de tempo do histórico. | 24 px, superfície s1 |
| **Braço** (direita) | O terminal: lista de blocos tipados em português + campo `❯` fixo. | 384 px (320–600) |
| **Trilho** | Linha de 1 px na cor de quem age (pessoa ou agente), desenhada só durante o movimento de uma peça entre colunas. Some ao pousar. | 1 px, ≤ 280 ms |

### 1.2 Os três verbos

**Empurrar (braço → bancada).** Todo bloco de *ação* do terminal que cria ou muda uma peça (arquivo, peça da Máquina, galho do mapa, demanda, bloco de tela) ganha, na sua borda esquerda, um glifo de 16 px da peça. Enter no bloco (ou clique no glifo) empurra a peça pelo trilho até a bancada: a bancada **primeiro toma a forma certa** (folha, palco, mapa…), depois a peça pousa nela (M2 + M5 da frente de anterioridade). Se a pessoa está digitando na bancada, a peça **não interrompe**: espera na junta como glifo com um traço de 2 px na cor do agente, e pousa sozinha quando a bancada fica livre por 2 s ou quando a pessoa aperta Enter nela. Isso preserva a regra do Theus (IDEIAS 5.18: "a aba troca de forma sozinha conforme o agente cria arquivos") sem cair na armadilha da Dynamic Island (forma que muda por evento externo enquanto se trabalha).

**Puxar (bancada → braço).** Qualquer peça da bancada (uma seleção de texto, uma peça da Máquina, um bloco do site em "Editar na tela", um galho do mapa, um cartão de demanda) e qualquer linha da prateleira pode ser arrastada até o campo `❯`, ou puxada com **Ctrl + →** quando está focada. A peça encolhe pelo trilho até virar um **chip** no campo (glifo + nome), e a linha de receitas acima do campo troca para os verbos daquela peça (arquivo: Explicar · Projetar · Pedir ajuda; Máquina: Testar · Publicar · Ver montando; WhatsApp: Responder · Sugerir; reunião: Marcar decisão · Salvar ideia). É o M1 (terminal-instrumento) com gesto físico. O campo e o cursor nunca mudam de lugar; só a linha de receitas muda, com fade de 120 ms e no máximo 3 itens.

**Apontar (histórico → bancada).** A lista de blocos do terminal é uma linha do tempo. Quando a pessoa **rola** o histórico, a junta mostra um traço horizontal de 1 px na altura do bloco que está sob a linha de leitura do terminal (o centro vertical do painel), na cor do agente daquele bloco, e a peça que aquele bloco criou ganha um contorno de 1 px da mesma cor na bancada. O contorno some 600 ms depois que a rolagem para. **Segurar Espaço** num bloco mostra a bancada como ficou depois daquele bloco (antes/depois, sem abrir aba); soltar volta (M7). Setas ↑↓ passam pelos blocos e a bancada acompanha. Nada é gravado pelo apontar; aceitar é Enter, desfazer é o botão que já existe no cartão.

### 1.3 As formas da bancada (morph por tipo de peça)

| Forma | Quando | Como é |
| --- | --- | --- |
| **Folha** | md, txt, csv, pdf, nota, ata, aprendizado | coluna de leitura de 72 ch centrada; texto em Cosmic Latte 88 %; barra de edição só aparece ao selecionar; menu `/` na nota |
| **Tela** | `.html` | site renderizado sangrando até as bordas da bancada; alternador Site · Código · 3D no canto superior esquerdo da bancada (não na aba); "Editar na tela" como camada por cima |
| **Palco** | Máquina | grade de pontos de 8 px; ficha da peça nasce sempre encostada na junta (regra fixa de lugar, como o Replit faz com o preview); zoom em três alturas |
| **Mapa** | `.mapa` | canvas MindForge sobre a grade de pontos |
| **Quadro** | `.quadro` | borda infinita, grade de pontos, sem cromo |
| **Mesa** | Reunião | material em destaque no centro; o que foi "jogado na mesa" enfileirado na borda de baixo; pauta à esquerda; decisões e próximos passos como ficha à direita |
| **Conversa** | Chat e WhatsApp | coluna de 640 px; balões com a cor da pessoa só na borda |
| **Ficha** | Demandas, Tarefas, Metas, Perfil | rótulos mono caixa-alta à esquerda, valores em Plex à direita; estado como carimbo reto de 1 px (LIVRE · EM CURSO · PAUSADA · PRONTA · OK) |
| **Parede** | Terminais ao vivo | grade de cartões; cada cartão = duas setas ↑↓ e o tempo de ida e volta do último pedido; modo compacto = cascata (coluna de 2 px por agente, tempo descendo) |
| **Papel** | Meu dia | folha com Hoje · Esta noite · Próximos; campos ocultos até o toque |
| **Vazio** | nenhuma aba | um ponto de 3 px na cor da pessoa dentro de um feixe vertical de 1 px a 4 %, e "Nada aberto · Ctrl K" |

Regras do morph: **um morph por abertura**, ≤ 280 ms, `cubic-bezier(0.32, 0, 0.12, 1)`, só a superfície da bancada se transforma (a moldura: inset, fundo, grade, coluna da ficha); abas, tampo, prateleira, junta e braço **não se movem**. Nunca por evento externo enquanto a pessoa digita (§1.2). `prefers-reduced-motion`: corte seco. Atalho: toda forma tem uma tecla (Ctrl + 1…9 troca a aba; a forma vem com a aba).

### 1.4 O agente como presença única (M6, dentro do Trilho)

Cada agente tem um só corpo visual: o **bitmap 7 × 11** (Arecibo) na cor do agente. Quando lê um arquivo, o bitmap aparece ao lado do arquivo na prateleira; quando edita, é a etiqueta do cursor na bancada; quando termina, volta para a aba dele no braço. **Parar** é clicar na presença, em qualquer coluna. O estado é o **anel de traço único** de 14 px ao lado do nome: aberto e girando = pensando (1,2 s, linear); fechado = parado; aberto e parado = falhou, com o próximo passo escrito ao lado. É o mesmo círculo do anel de foco de todo o app (o círculo é a régua).

### 1.5 Quem tem a palavra (M3, sem 3D e sem vidro)

Dois planos, nenhum deslocamento de layout. Quem age vem "à frente": a coluna ganha sombra `0 4px 16px rgba(0,0,0,.35)` e borda a 14 %; a bancada recebe um véu `rgba(6,11,22,.08)`. Quando a pessoa digita na bancada, o braço recua (perde sombra) e o véu sai. Transição 180 ms; em reduced-motion, instantânea. A prateleira nunca vem à frente: é parede.

---

## 2. Busca de anterioridade (quem faz parecido e a diferença)

| Quem | O que faz parecido | Diferença do Trilho |
| --- | --- | --- |
| Warp (blocos) | terminal como lista de blocos tipados; ações do agente como blocos de conteúdo rico; blocos fechados imutáveis | os blocos do Warp não têm corpo físico na superfície de trabalho: nada é empurrado do bloco para o editor, e rolar o histórico não aponta nada fora do terminal |
| Zed / Framer 3.0 ("seguir") | a viewport pula para onde o agente mexe | seguir sequestra o lugar da pessoa; o Trilho aponta (contorno de 1 px) e deixa a pessoa onde está; a peça só pousa quando a bancada está livre |
| Linear peek / Notion side peek | segurar Espaço mostra o detalhe sem abrir | peek de lista → detalhe dentro do mesmo painel; aqui é de um painel (bloco do agente) para outro (a bancada), com antes/depois de uma ação |
| Cursor 3 (canvases, Design Mode) | artefatos duráveis no painel lateral; anotar a UI no navegador | o artefato fica no painel; não há trajetória visível até o editor nem puxar uma seleção do editor para o agente como objeto com verbos próprios |
| Replit Splits | regra fixa de onde cada coisa nasce (preview no canto) | Replit exige arrastar painéis à mão; a bancada muda de forma sozinha por tipo, mantendo abas e status fixos |
| Dynamic Island | um elemento que muda de forma por contexto | é um elemento, não a superfície de trabalho, e muda por evento externo (o que a irrita); a bancada muda por gesto da pessoa e espera na junta quando ela digita |
| Ableton (Session/Arrangement, Tab) | duas vistas do mesmo objeto; arrastar + Tab | eixo "eu tocando / eu arranjando"; no Babel o eixo é "eu na bancada / nós na mesa" (Reunião como o outro lado do mesmo objeto), e o material vai e volta |
| tldraw fairies / Figma agent | agente com corpo na superfície | corpo em uma superfície só; aqui a mesma presença atravessa prateleira → bancada → braço |
| JetBrains Universal Entry Point / paleta contextual | ações mudam com o contexto do cursor | mudam sugestões dentro de um campo; aqui a peça é puxada fisicamente e a linha de receitas, os chips e o cabeçalho se moldam a ela (M1), inclusive para objetos que não são código |
| Devin / Antigravity (worklog + artefatos) | tudo o que o agente fez em uma vista | log e artefato ficam na área do agente; não há "apontar" na superfície de trabalho nem "empurrar" com causalidade visível |
| Ferramentas de scroll-driven (o material do Theus) | o scroll causa o movimento (scrub de frames) | aplicado a histórico de agente: rolar o histórico causa o apontamento na bancada; não encontrei ninguém que ligue rolagem do log do agente a destaque da peça resultante |

**Conclusão de anterioridade:** existem blocos (Warp), seguir (Zed/Framer), peek (Linear/Notion), morph por contexto (Dynamic Island), regra de lugar (Replit) e duas vistas (Ableton). Não encontrei quem junte **peça com corpo + trilho visível + junta de espera + apontar por rolagem + bancada que morfa por tipo** num app de equipe para não-programadores. Ressalva honesta: "não vi" não é "não existe"; fontes não lidas (Codex app, Superhuman Split View, Observable, tldraw computer) não entram na conclusão. Esta tabela é o ponto de partida para o aceite A4.

---

## 3. Layout

### 3.1 Esquerda · Prateleira (48 + 264 px)

- **Barra de atividades (48 px):** 12 ícones na ordem da peneira: Meu dia · Criar · Trabalho (Demandas + Tarefas) · Chat · WhatsApp · Reunião · Terminais · Projetos · Acervo (Buscar · Aprendizados · Ideias · Sonho · Prompts) · Equipe (pessoas · Metas · Mapa · Regras · Cuidando da gente) · Loja · Oficina. Ícone ativo = traço em `--texto`; inativo = `--apagado`; sem fundo colorido. Rótulos opcionais (ligados na primeira semana, engrenagem da pessoa). Foto da pessoa no pé da barra (abre o Perfil).
- **Painel (264 px, arrasta de 200 a 400):** seletor de modo no topo ("Sozinho · minha pasta" ↔ projeto) como alternador de 26 px; campo de filtro; árvore com **uma altura de linha (26 px)** e um tipo de linha só. Foto de quem salvou (16 px) à direita da linha; "recebido de X" = risco de 2 px à esquerda na cor de quem mandou; computador desligado = ficha pontilhada (já existe). Presença do agente lendo = bitmap 7 × 11 ao lado do arquivo. Cada linha tem, no hover ou em `⋯`, **o mesmo menu da paleta**: Abrir · Projetar · Levar para a reunião · Pedir ajuda · Enviar para pessoa · Sugerir mudança · Versões. Um só "+" (Nota · Mapa · Quadro · Tela · Máquina · Pesquisa · arquivo · subir) no rodapé do painel.
- **Arrastar arquivo para uma pessoa:** o arquivo sai da linha e voa até o nome (≤ 400 ms, `power2.out`); no computador dela, entra pela borda esquerda com o selo "recebido de você" — a mesma trajetória nas duas telas (M2). Um voo por vez; o segundo enfileira.
- **Zero animação** ao abrir pasta, trocar atividade ou filtrar.

### 3.2 Meio · Bancada (flexível, mínimo 520 px) + Junta (24 px)

- **Abas (32 px):** como VS Code, botão de fechar só no hover/foco; a aba ativa tem o único traço de marca da tela (1 px roxo → ciano na base). Rótulo do ambiente ("local · main") em mono 11 px no canto superior esquerdo da bancada, como o "main" do Framer.
- **Bancada:** as 11 formas da §1.3. Superfície s2 (a mais clara). Texto de trabalho ≥ Lc 75 (alvo 90). Nenhum fundo gerado por IA atrás de texto de trabalho; a grade de pontos e o véu de luz só atrás de vazio, palco, mapa e quadro.
- **Régua de versões:** linha de 1 px no topo da bancada, um ponto por versão com a foto de quem salvou; arrastar mostra como estava; "Voltar como estava"; comparar duas lado a lado (a bancada divide ao meio).
- **Ver por pessoa:** botão na barra do arquivo; pinta a borda (1 px, nunca o fundo) de cada bloco/peça/trecho/galho na cor de quem mexeu por último.
- **Junta (24 px):** peças à espera (glifos de 16 px empilhados do topo, traço de 2 px na cor do agente); cursor de tempo do histórico (traço horizontal de 1 px); luz de contato: quando o agente age, a hairline entre junta e bancada ganha um degradê de 120 px na cor do agente, a 60 %, na altura da peça (a luz vem de fora do quadro, Arrival). É o único "emissor de luz" da Estação além do "b".

### 3.3 Direita · Braço (384 px, 320–600)

- **Cabeçalho (36 px):** abas de agentes (bitmap 7 × 11 + nome em Plex 12,5 500 + anel de 14 px); "+" cria agente (nome, o que faz); renomear e apagar no menu da aba; o ponto-radar de 12 px "ao vivo" (varredura de 4 s) vem do rodapé para cá; "pausar transmissão" no clique. Ao entrar no terminal de outra pessoa, a aba dele aparece com borda na cor dela e um "Sair"; "Assumir/Devolver" = duas iniciais lado a lado (segunda antena travada no mesmo alvo). Uma linha mono 11 px no hover: "pode ver: minha pasta · projeto Clínicas".
- **Lista de blocos (rolável):** tipos em português: **pedido** (o que digitei; verbo e objeto com sublinhados diferentes, gramática `coop <verbo> <objeto>`), **consulta** ("o que consultei": arquivos e itens do acervo, fechado por padrão), **plano** (passos com progresso e "parar" sempre visível), **ação** (uma por ação, com glifo da peça, "desfazer" e Enter = empurrar, Espaço = espiar), **resultado** (cartão com prova: miniatura de 96 px, print ou prévia), **espera** ("Confirma? s/N": o bloco acende e o "b" do topo brilha), **shell** (comandos comuns, saída crua). Blocos fechados são imutáveis. O que o agente roda não aparece como shell da pessoa. Detalhe escondido por padrão; "ver tudo" por bloco.
- **Falha:** bloco de ação aberto (anel aberto e parado) com "próximo passo" escrito e os botões "tentar de novo" · "fazer eu mesmo" (abre a peça na bancada) · "pedir ajuda".
- **Linha de receitas (24 px):** no máximo 3, mudam com a peça puxada ou a aba ativa; sem peça: "Explicar este arquivo · Procurar no acervo · Criar página".
- **Chips:** peças puxadas e pessoas mencionadas (foto 16 px + nome), nunca preenchidos, borda na cor.
- **Campo `❯` (fixo, 40 px):** JetBrains Mono 13/1,5; ditado segurando Ctrl + M com forma de onda de 1 px; apresentação do agente uma vez só, na primeira abertura.
- **Sem** "b" gigante, sem botão Neon, sem receitas fixas.

### 3.4 Topo (36 px) e rodapé (24 px)

- **Topo:** à esquerda o **"b" de 18 px em SVG** (traço 1,5 px, `--texto` a 70 %), único sinal de marca; ao lado, o nome do modo/projeto (Plex 12,5). Centro vazio. À direita: sino (número em mono, sem ponto pulsante), botão **Tela da TV** desenhado como keycap, foto da pessoa (22 px). Nada de "ESTAÇÃO · PROTÓTIPO" nem "Ver como" (fica como `?como=` só para teste).
- **Rodapé = fileira de luzes (DSKY):** sete luzes, apagadas por padrão (contorno), acesas só quando há algo: **presença** (clicar troca: online · foco · ausente) · **caixa** (n) · **cronômetro** (pílula com anel de 12 px que completa uma volta por minuto; clique abre; "⧉ destacar" abre a janelinha) · **sala** (memória = coluna Wow! de 25 caracteres mono, um a cada 12 s; gravação = ponto vermelho batendo; conversa particular = coluna congelada) · **projeção** (▲▼ rolar e ✕, quem projeta) · **controle de terminal** ("Carla está no seu terminal · Encerrar") · **Atualizar vN** (quando houver; atualiza em fundo e avisa uma vez). "Salvo na equipe" aparece 2 s ao salvar e decai. Números em mono tabular. Toda notificação passageira nasce a 100 % e decai a 0 % em 6 s, sem botão de fechar. Uma por vez; rajada vira uma.

### 3.5 TV · celular · iPad

- **TV (espelho, sem botão, sempre escura com razão declarada: mídia imersiva lida a 3–5 m):** mesmo chão `#060b16` (o `#090413` sai: uma só física de mundo). Modos: **Painel** (faixa de estado + metas como anéis + campanha como linha graduada tipo "Where Is Webb" + zona que gira a cada 25 s + trilhas + Cuidando da gente + evento ao vivo), **Reunião** (pauta · destaque · jogados na mesa · decisões), **Quadro ao vivo**, **Projeção** (luz de borda de 1 px nas quatro bordas, roxo → ciano, estática, "projetado por Ana" em mono; some ao encerrar), **Site**, **Visita** ("b" de 96 px em SVG + relógio em mono 96 px + véu de luz em loop de 10 s; é o único lugar com fundo vivo). Texto ≥ 30 px, números ≥ 56 px tabulares. Selos da sala como pílulas no canto; sugestão de ideia em faixa fina de 30 s; "Cuidando da gente" como convite, nunca ranking; comemoração = anel da meta fecha em 800 ms, uma vez. "Sem nada a mostrar" = o mesmo ponto pálido da bancada vazia. Nunca som.
- **Celular (< 760 px):** dock de baixo com 5 abas (Meu dia · Trabalho · Chat · Arquivos · Mais → Controle da TV, cronômetro, ideia falada); cada aba é a forma da bancada em coluna única; a junta vira uma faixa de 32 px no topo ("chegou: 2 peças"); sem terminal; alvos ≥ 48 px, ação primária na zona do polegar; notificações uma por vez, rajada juntada; mesmo chão e mesmas fontes (corpo 14 px).
- **iPad (app à parte):** só o quadro de borda infinita sobre a grade de pontos, ferramentas grandes (56 px) no rodapé (caneta, marca-texto, borracha, post-it, texto), dois botões no topo (Projetar na TV · Estação ↔ iPad), salvamento automático em `.quadro`; risca no iPad, risca na TV.

---

## 4. Linguagem visual

### 4.1 Paleta (tokens, com hex)

Chão e superfícies (escada de 4 degraus, zero sombra colorida):
- `--chao: #060b16` (único, Estação + TV + celular + iPad)
- `--s1: #090f1d` prateleira, braço, junta (um degrau mais escuros que a bancada, como a Linear em 2026)
- `--s2: #0d1526` bancada
- `--s3: #121c31` elevado: ficha, paleta Ctrl K, cartões, keycaps
- `--fio: rgba(215,228,251,.09)` hairline; `--fio-2: rgba(215,228,251,.14)` hairline ativa

Texto:
- `--texto: rgba(215,228,251,.90)` (#d7e4fb a 90 %) · `--apagado: #8799bc` · `--fraco: #5a6a8c`
- `--leitura: rgba(255,248,231,.88)` (Cosmic Latte #FFF8E7) só para documentos, ata, notas, ideias faladas: quente = humano, frio = sistema

Acento (a única luz; um traço por tela):
- `--acento: #8670ff` (foco, aba ativa, seleção 1 px) · `--ciano: #29ccec`
- `--traco-marca: linear-gradient(90deg, #9160ec, #29ccec)` — só como linha de 1 px (base da aba ativa **ou** borda da projeção **ou** o "b" em estado); nunca fundo, texto ou botão

Escala de tempo (JWST: o degradê vira ordem, não decoração):
- `--t0: #29ccec` agora (ao vivo) · `--t1: #4d8ef5` hoje · `--t2: #9160ec` mais antigo — presença, "mudaram por último", linha do tempo, evolução da semana

Estados (do painel-vivo, fixos): `--ok: #7fd6a6` · `--atencao: #f0b35a` · `--alarme: #ff6b6b` · `--sem-dado: #5d6b78`

Reino (metais, só em selo, título de guilda e comemoração; ouro ≤ 10 % da tela; nunca em botão primário):
- `--aco: #aeb6c2` · `--bronze: #b8743a` · `--prata: #e6eaf0` · `--ouro: #f5c76a` · `--ouro-fundo: #a8741e` · `--ouro-luz: #ffe9b0` · `--ametista: #8f3dff`
- Regra de tintura: metal só sobre cor (`--chao`, `--s1…s3`); metal sobre metal ou sobre o degradê exige fimbriação de 1 px em `--chao`.

Pessoa e agente (três variáveis, luminância fixa):
- `--pessoa: oklch(72% 0.12 H)` com H escolhido uma vez entre 12 matizes separados por 30° (20 · 50 · 80 · 110 · 145 · 175 · 205 · 235 · 265 · 295 · 325 · 355), guardado no perfil e nunca reatribuído; convidado = matiz temporário + sigilo neutro
- `--agente: oklch(60% 0.12 H)` = a cor da pessoa dona, um degrau mais escuro (o agente é a sombra da pessoa)
- Uso: borda, traço, ponto, anel; nunca preenchimento de chip nem fundo; a cor da pessoa sempre vence a do cargo (o papel é um ícone de 12 px)

### 4.2 Tipografia (três famílias, papéis declarados, todas variáveis e auto-hospedadas)

- **IBM Plex Sans** (variável) = trabalho. Pesos: 430 corpo no escuro, 500 rótulos e abas, 600 títulos. Tamanhos da Estação (seis, não mais): 11 · 12,5 · 13,5 (corpo) · 16 · 22 · 34. Celular: 12 · 14 (corpo) · 16 · 20 · 28. TV: 30 · 40 · 56 · 96. Piso 11 px no Mac.
- **JetBrains Mono** 400/500 = máquina: terminal (13/1,5), números (`font-variant-numeric: tabular-nums`), cronômetro, IDs, versões, tokens, rótulos de ficha (11 px caixa-alta, tracking +0,08 em), kbd (11 px, keycap: gradiente `#121c31 → #0d1526`, borda inferior 2 px).
- **Cormorant Garamond** 500/600 = voz humana, **só ≥ 22 px**: saudação do Meu dia, ideia falada mostrada grande, título da ata, pergunta da semana, nome do projeto na TV; **Cormorant SC** ≥ 20 px com tracking +0,06 em para nome de guilda, título e nome de selo. Nunca em corpo de UI.
- Sem quarta família: a voz "dot" (Geist Pixel / Nothing) é feita pelos bitmaps 7 × 11 dos agentes, não por fonte.
- Proibido misturar registros na mesma linha.

### 4.3 Forma e traço

- Três primitivas: **círculo** (régua: anel de foco, anel do agente, ponto ao vivo, ponto pálido), **retângulo** (peça: bloco, cartão, ficha, carimbo), **linha** (trilho, tampo, hairline, feixe).
- Raios concêntricos (raio interno = raio do pai − padding): janela 12 → painel 8 (padding 4) → cartão 6 (2) → chip 4 (2) → keycap 3 (1). Carimbos de estado: raio 0.
- Hairlines de 1 px a 9 %; sem `box-shadow` colorida; elevação pela escada de superfície; a única sombra é a do plano "à frente" (§1.5) e da paleta Ctrl K.
- Ícones: grade de 24 px, área ótica 20 px, traço 1,5 px, terminais retos (butt), junções em ângulo (miter), sem preenchimento, `currentColor`; família inteira numa leva única (§6). Cantos vivos são a "mão" da casa (Chillon).
- Grade de pontos de 8 px (`radial-gradient` 1 px a 6 %) só no palco, mapa, quadro e bancada vazia.
- Cartões sem cartões dentro. Nada em degradê de texto. Nenhum halo radial.
- Alvos ≥ 24 × 24 px com 4 px de folga na Estação; ≥ 48 px no celular e iPad.
- Densidade: confortável por padrão; compacta (−4 px por passo) só global, na engrenagem da pessoa.

### 4.4 Motion (tokens com duração e easing)

- `--mov-toque: 120ms cubic-bezier(.2,0,0,1)` hover, foco, receitas, chips.
- `--mov-padrao: 180ms cubic-bezier(.2,0,0,1)` abrir/fechar painel, estado, plano à frente, opacidade 0 → 1 de qualquer elemento que entra (entra pronto, sem rastro).
- `--mov-trilho: 280ms cubic-bezier(.32,0,.12,1)` empurrar, puxar, morph da bancada. Sem overshoot.
- `--mov-voo: 400ms power2.out` arquivo voando para uma pessoa (M2), um por vez.
- `--mov-heroi: 800ms cubic-bezier(.16,1,.3,1)` só em três momentos: abertura da Estação (o "b" se desenha por `stroke-dashoffset`), meta a 100 % (o anel fecha), ideia salva (o círculo de Ehman fecha em volta do trecho da coluna Wow!).
- Anel do agente: `stroke-dashoffset` em laço de 1,2 s linear enquanto pensa; para fechado ao terminar; aberto e parado ao falhar.
- Ponto-radar "ao vivo": `conic-gradient` girando 4 s linear com rastro que decai em uma volta; só onde há transmissão real.
- Cronômetro: anel de 12 px que completa uma volta por minuto; para ao pausar.
- Regra "nada anima sem dado": cada animação tem um evento real que a dispara, listado no aceite. Teto de **2 sinais vivos por tela**. Zero laço ornamental (sem respiração de fundo, sem partículas, sem estrelas).
- Nenhuma animação bloqueia digitação; metas de latência: trocar atividade, abrir arquivo local, abrir paleta e ecoar pedido no terminal em < 100 ms; eco otimista com desfazer como rede.
- `prefers-reduced-motion`: tabela de equivalentes, não `0.01ms` global: anel → estático aberto/fechado; radar → ponto fixo; morph e trilho → corte seco com a peça já no lugar; voo → ficha aparece com o selo; "b" que se desenha → "b" pronto; véu em loop → poster; selo que abre → selo aberto; anel da meta → anel fechado.

### 4.5 Luz e material

- Material: fosco e opaco em toda superfície de conteúdo. Vidro só na paleta Ctrl K flutuante: opacidade ≥ 92 %, borda 1 px mais escura, blur ≤ 12 px, fallback opaco, respeita Reduce Transparency. Nunca vidro sobre vidro, nunca texto de trabalho sobre vidro.
- Uma só fonte de luz: o estado. O "b" do topo acende (drop-shadow `0 0 6px` em `--ciano`, fino por causa de halation) só quando a sala grava, o agente espera OK ou há projeção. A luz de contato da junta (§3.2) tinge a hairline vizinha na cor do agente enquanto ele age. Todo o resto fica apagado (Glyph: "se tudo brilha, nada importa").
- Profundidade: dois planos, sombra e véu de 8 % (§1.5); texto sempre plano.
- Tema claro: a Estação e o celular seguem a aparência do sistema com opção de fixar; sai de graça da fórmula de três variáveis (base, acento, contraste) em oklch; a TV é sempre escura (mídia imersiva) e no modo Visita pode usar Cosmic Latte como fundo. Contraste medido em APCA (bancada ≥ Lc 75, rótulos ≥ 60, placeholder ≥ 30, hairlines ≥ 15), não em WCAG 2 sobre fundo quase preto.

### 4.6 Som de interface

- Desligado por padrão; a pessoa liga na engrenagem; `AudioContext.resume()` só após gesto; `visibilitychange` pausa; a TV **nunca** tem som; o celular segue o sistema.
- Seis sons, todos ≤ 400 ms, −18 LUFS, sem cauda de reverb, gerados com a mesma seed e o mesmo prompt-base (§6): **pousar** (peça chegou à bancada) · **puxar** (chip entrou no campo) · **espera** (agente pede OK) · **selo** (ideia salva / demanda com OK) · **meta** (100 %, o único de 700 ms) · **contato** (alguém entrou no meu terminal).
- No máximo um som por evento; nunca em hover, nunca em abrir aba; som repetido em rajada vira um.

---

## 5. A mistura sem forçar (cada tema reduzido ao traço mínimo e a uma camada só)

Denominador comum dos cinco: **ordem clara que abre espaço para o desconhecido**. Um domina (instrumento calmo, empresarial); os outros entram pequenos, cada um numa camada, com motivo funcional declarado. Teste de pastiche para cada peça: "o que isso diz sobre cooperar com agentes?"

- **Reino (camada: cerimônia e conquista, só em Perfil, Equipe, Meu dia e no OK de demanda).** Regra de tintura como token de aceite (metal só sobre cor, fimbriação 1 px). O **selo que abre** (≤ 400 ms, herdado da LP do Reino) quando quem pediu dá OK numa demanda: é fato real, não heráldica de marketing. Metais como graus de selo no Perfil (aço → bronze → prata → ouro; ametista fosca para quem "pode mudar o app"), lidos pelo aro, "como foi ganho" no hover, ocultáveis, nunca na TV, nunca ranking. Guilda = segmento transversal escolhido pela pessoa, com glifo monolinha de 16 px ao lado do nome. Ritual de entrada: o token `babel-…` mostrado com a grade 7 × 11 como marca de uma linha ("enviado uma vez"). Numeração "03" e barras "6/10" na TV. Cormorant SC para nome de guilda e selo. **Nunca** coroa, brasão, castelo, cetro.
- **Ufologia (camada: contato e linguagem, só no braço, na junta, no rodapé e na Equipe).** O terminal é a sala de contato com inteligências de nome humano (Arrival): o anel de traço único é o estado do agente; o bitmap 7 × 11 (primos, Arecibo) é o rosto do agente e distingue à primeira vista agente (bitmap) de pessoa (foto); a coluna Wow! de 25 caracteres é a memória da sala (mostra quanta memória há sem transcrever); o círculo de Ehman marca a ideia salva; as setas ↑↓ com tempo de ida e volta (DSN) são o único número do cartão da parede; o ponto-radar é "ao vivo"; a ficha Blue Book é a demanda; o ponto pálido é a bancada vazia; o mapa de pulsares é o mapa da equipe (dentro de Equipe); as linhas de base do interferômetro só aparecem quando duas pessoas estão correlacionadas agora. **Nunca** disco, alienígena, radar verde, scanline, glitch, estrelas.
- **Futurismo (camada: precisão e material, em toda a casca).** Registro Wallace/Dune: geométrico, fosco, quase monocromático; números tabulares; latência mostrada (o tempo de ida e volta do pedido); uma fonte de luz; raios concêntricos; blocos tipados; o "b" como instrumento de estado, não como marca pulsante; a única metáfora física animada é o anel do cronômetro. **Nunca** cromo, glow permanente, vidro em conteúdo, parallax, 3D como ambiente.
- **Empreendedorismo (camada: placar e ficha, em Trabalho, Equipe e TV).** Demanda como ficha (rótulos mono caixa-alta, carimbo reto de estado); meta como linha graduada com passo concluído em miniatura e passo atual grande, alternador "tempo | %", anel que só fecha aos 100 %; campanha com contagem regressiva em mono; cartão de pessoa à Ultravioleta (só nome, sigilo e cor; carga e horas fora do cartão, só para gestão, em outro lugar); Cuidando da gente como convite; laurel de constância opcional no Perfil; espaço de trabalho em mosaico com divisórias sem peso e cores com significado fixo (Bloomberg). Copy em português simples é material de design; sem selo "IA" (o agente é membro). **Nunca** ranking, streak de dias corridos, ouro em botão.
- **Criatividade (camada: a bancada e os momentos-herói).** A bancada que muda de forma é a mesa do fazedor; palco, mapa e quadro sobre a grade de pontos; "Editar na tela"; presets ("o que funcionou fica guardado"); a junta com peças para experimentar; o iPad como quadro; a Máquina como brinquedo-instrumento (séria por precisão, lúdica por regra clara); Cormorant como a voz humana que atravessa o sistema; três momentos-herói (abertura, meta, ideia salva) e nenhum outro. **Nunca** partículas, mural monumental, "b" gigante em outra roupa.

---

## 6. Elementos gerados por IA na Replicate (slugs confirmados na frente `geracao-replicate`)

Regras gerais do material do Theus que valem para todos: REGRA 5 (conferir schema por `GET /v1/models/{owner}/{name}` antes do primeiro uso); REGRA 3 (baixar em até 1 h para `/assets/raw/<slug>/<seed>/` e registrar em `MANIFESTO.json` com modelo, versão, seed, prompt, custo, data); REGRA 6 (orçamento US$ 20, parar em US$ 16); `Prefer: wait` só para SVG e imagem; vídeo sempre assíncrono com `Cancel-After: 15m` e webhook `completed` + polling de reserva a cada 2 s; token só em variável de ambiente. Prompts em inglês porque os modelos respondem melhor; a documentação fica em português.

### 6.1 "b" vetorial (base do SVG do topo, do anel de estado e do modo Visita)
- **Modelo:** `recraft-ai/recraft-v4-svg` (US$ 0,08/imagem; sem `seed`, sem `style`: o estilo vai no prompt). 3 tentativas = US$ 0,24; limpeza à mão depois (viewBox, `currentColor`, um só `<path>`).
- **Entrada:** `{"prompt": "...", "aspect_ratio": "1:1", "size": "1024x1024"}`
- **Prompt:** `Single lowercase letter "b" drawn as one continuous uniform-width line, geometric sans-serif construction, stroke width equal to 1/16 of the letter height, square (butt) line ends, no serif, no fill, no shadow, no glow, no gradient, no background, pure black line on transparent background, perfectly centered, the stem is a straight vertical line and the bowl is a true circle tangent to the stem, minimal, industrial instrument register, flat vector logo mark`
- **Formato final:** `.svg` limpo, um `<path>` com `stroke="currentColor"` e `stroke-width="1.5"` na Estação (18 px), 96 px na TV; o "se desenhar" na abertura é `stroke-dasharray`/`stroke-dashoffset` com `getTotalLength()` (CSS, 0 KB).
- **Regra do material:** ícone/logo nasce SVG nativo, nunca PNG vetorizado; `prefers-reduced-motion` mostra o "b" pronto.

### 6.2 Família de ícones da Estação (40 ícones, leva única)
- **Modelo:** `recraft-ai/recraft-v4-svg`, 40 × US$ 0,08 = US$ 3,20 (+ até 10 repetições = US$ 0,80). Alternativa se o traço não bater: `quiverai/arrow-1.1` (US$ 0,20) com o primeiro ícone aprovado em `references` e `temperature: 0.2`.
- **Nomes (cada um é o rótulo de uma função do FUNCOES.md):** meu-dia · criar · trabalho · chat · whatsapp · reuniao · terminais · projetos · acervo · equipe · loja · oficina · abrir · projetar · levar-para-a-reuniao · pedir-ajuda · enviar-para-pessoa · sugerir-mudanca · versoes · editar · salvar · desfazer · parar · espiar · empurrar · puxar · gravar · memoria · ideia-falada · cronometro · pausar · retomar · pronta · ok · pegar · novo · subir · buscar · configurar · tela-da-tv.
- **Prompt (idêntico em toda a leva, trocando só `{NOME}` e `{DESCRICAO}`):** `Minimal monoline user-interface icon meaning "{NOME}" ({DESCRICAO}), one continuous stroke of uniform 1.5px weight on a 24px grid with a 20px optical area, square (butt) line caps, mitered sharp corners, no rounded corners, no fill, no shadow, no gradient, no text, no perspective, no 3D, only straight lines, circles and rectangles, generous negative space, pure black line on transparent background, centered, part of a consistent family of forty icons in an industrial instrument register, flat vector icon`
- **Formato final:** `.svg` normalizado (viewBox 0 0 24 24, `stroke="currentColor"`, `fill="none"`, metadados removidos), ~2 KB cada, inline ou sprite; entrada em viewport com `stroke-dashoffset`; hover escala 1,06 em 180 ms.
- **Regra do material:** família inteira numa só leva com o mesmo prompt de estilo; SVG nativo; ícone é rótulo de função, nunca enfeite.

### 6.3 Glifos de guilda (6, monolinha)
- **Modelo:** `recraft-ai/recraft-v4-svg`, 6 × US$ 0,08 = US$ 0,48 (+ 3 repetições = US$ 0,24).
- **Prompt:** `Abstract monoline emblem for a professional guild about "{SEGMENTO}", one continuous 1.5px stroke on a 24px grid, built only from one circle and straight lines, bilaterally symmetric, sharp mitered corners, square line caps, no letters, no crown, no shield, no animal, no fill, no gradient, pure black on transparent, centered, restrained and modern, flat vector mark, same family as a set of six emblems`
- **Formato final:** `.svg` em `currentColor`, 16 px ao lado do nome, 24 px no Perfil.
- **Regra do material:** SVG nativo, leva única; regra de tintura ao colorir (metal só sobre cor).

### 6.4 Diagrama de primeira abertura (um passo, traço único)
- **Modelo:** `recraft-ai/recraft-v4-svg`, 3 tentativas = US$ 0,24.
- **Prompt:** `Technical line diagram of a workbench seen from above: a wide horizontal slab divided into three parts by two thin vertical lines that stop short of the top and bottom edges, a narrow strip between the middle and right parts, one small circle resting in the middle part, one short arrow pointing from the right part into the middle part and one from the middle into the right part, single continuous 1px stroke, no text, no labels, no fill, no shadow, pure black on transparent, 2:1 aspect, minimal engraved-plate style like the cover of an interstellar record`
- **Formato final:** `.svg` de 480 × 240 em `currentColor`, mostrado uma vez, com a frase "Você entrou. A equipe te vê. Comece por…".
- **Regra do material:** SVG nativo; uma abertura = um passo.

### 6.5 Logo "b" animada em loop (momento-herói da abertura e modo Visita da TV)
- **Passo 1 · keyframe:** `google/nano-banana-2` (US$ 0,067 em 1K; sem `seed`; a consistência vem de `image_input` com a própria imagem anterior). Até 6 iterações = US$ 0,40.
  - **Entrada:** `{"prompt": "...", "image_input": ["<url de prototipo/babel-logo.png>"], "aspect_ratio": "1:1", "resolution": "1K", "output_format": "png"}`
  - **Prompt:** `Reproduce exactly the letterform of the lowercase "b" in the reference image as a single thin neon glass tube of light, centered in a square frame, occupying 55% of the frame height, on a pure black background (#000000). The tube glows violet (#9160ec) at the top of the stem and shifts smoothly to cyan (#29ccec) at the bottom of the bowl. Soft bloom only around the tube, no floor, no reflections, no other objects, no text, no grain, matte cinematic darkness, photographic, ultra clean.`
- **Passo 2 · rascunho de movimento:** `bytedance/seedance-2.0-fast` (480p US$ 0,07/s; 4 s = US$ 0,28; 3 tentativas = US$ 0,84).
  - **Entrada:** `{"prompt": "...", "image": "<keyframe>", "last_frame_image": "<keyframe>", "duration": 4, "resolution": "480p", "aspect_ratio": "1:1", "generate_audio": false, "seed": 4180}`
- **Passo 3 · plano final:** `wan-video/wan-2.7-i2v` (1080p US$ 0,15/s; 4 s = US$ 0,60; 2 tentativas = US$ 1,20).
  - **Entrada:** `{"first_frame": "<keyframe>", "last_frame": "<keyframe>", "prompt": "...", "negative_prompt": "camera motion, zoom, cut, text, extra letters, sparks, smoke, particles, reflections, floor, flicker, background color change", "duration": 4, "resolution": "1080p", "seed": 4180, "enable_prompt_expansion": false}` — como o modelo gera áudio sozinho quando `audio` está ausente, a saída passa por `ffmpeg -an`.
  - **Prompt (contrato de seis campos):** `[LENS] 50mm macro, f/2.8, focus on the neon tube. [MOTION] static camera, no camera movement at all. [SUBJECT] the same lowercase neon "b" as the first frame; a single brighter pulse of light travels once along the tube from the top of the stem around the bowl and back, returning to exactly the starting brightness at the last frame; one full breath of light over 4 seconds; the letter itself never moves. [LIGHT] the tube is the only light source, soft bloom, constant color mapping violet at top to cyan at bottom, no flicker. [ENVIRONMENT] pure black void, no floor, no particles, no reflections. [NEGATIVE] no camera movement, no zoom, no cut, no text, no extra letters, no sparks, no smoke, no change of background.`
- **Se ficar parado (armadilha "primeiro = último quadro gera pouco movimento"):** método em duas metades: clipe 1 livre; clipe 2 com `first_frame` = último quadro do 1 e `last_frame` = primeiro quadro do 1; cortar um quadro de cada e concatenar (`concat demuxer`, `-c copy`).
- **Formato final:** MP4 H.264 + WebM VP9, 1080 × 1080, 4 s, mudo, **sem alpha**: gerado sobre preto e composto com `mix-blend-mode: screen` sobre `#060b16` (preto = nenhuma mudança); `poster` = keyframe; `muted playsinline`; toca **uma vez** na abertura da Estação (herói 1) e em loop só no modo Visita da TV. Fora disso o "b" é o SVG de §6.1.
- **Regra do material:** REGRA 1 (keyframe aprovado antes do vídeo); rascunho em modelo fast antes do caro; `last_frame = first_frame` para loop; seed fixa; sem áudio automático; `prefers-reduced-motion` → poster; ≤ 2 efeitos por dobra.

### 6.6 Véu de luz (fundo estático + loop de 10 s, só no modo Visita da TV e atrás da bancada vazia)
- **Passo 1 · imagem:** `google/nano-banana-2` 2K png 21:9 (US$ 0,101; 4 iterações = US$ 0,40).
  - **Prompt:** `Extremely dark matte empty scene: a deep navy-black field (#060b16) with a single soft light entering from outside the frame at the upper left, like light through a doorway into a dark room, falling as one faint wide gradient across the frame and fading to black on the right, no stars, no particles, no objects, no text, no lens flare, no grain, no vignette ring, perfectly smooth, cinematic, 21:9`
- **Passo 2 · rascunho:** `wan-video/wan-2.2-i2v-fast` 720p (US$ 0,11 por vídeo; 3 tentativas = US$ 0,33) com `image` = `last_image` = o véu.
- **Passo 3 · final:** `wan-video/wan-2.7-i2v` 720p (US$ 0,10/s), dois clipes de 5 s = US$ 1,00, método em duas metades para o loop de 10 s sem emenda.
  - **Prompt:** `[LENS] wide 24mm, static. [MOTION] no camera movement. [SUBJECT] the soft light entering from outside the upper-left edge drifts very slowly to the right by about 5% of the frame width over 5 seconds, its brightness constant, its edge always soft. [LIGHT] one light source only, no flicker, no new highlights. [ENVIRONMENT] empty dark matte field, no stars, no particles, no dust, no objects. [NEGATIVE] no camera motion, no zoom, no cut, no text, no stars, no particles, no flicker, no color shift.`
- **Formato final:** MP4 H.264 + WebM VP9 1280 × 548, 10 s, mudo, `loop`, `poster` = a imagem do passo 1; na Estação só a imagem estática, a ≤ 40 % de opacidade, atrás da bancada vazia e do palco; nunca atrás de texto de trabalho; na TV, o loop só no modo Visita.
- **Regra do material:** keyframe antes; `Z = A` com duas metades; seed fixa; `prefers-reduced-motion` → poster; "um efeito só entra se for metáfora do serviço" (luz que vem de fora do quadro = a sala que recebe).

### 6.7 Seis sons de interface
- **Modelo:** `stability-ai/stable-audio-2.5` (US$ 0,20 por arquivo, qualquer duração; **definir `duration`**, o padrão é 190 s). 6 + 2 repetições = US$ 1,60.
- **Entrada comum:** `{"prompt": "...", "duration": 3, "steps": 8, "cfg_scale": 6, "seed": 4180}`; corte local a ≤ 400 ms, normalização a −18 LUFS, exportar `.ogg` + `.m4a`.
- **Prompts (prompt-base idêntico + a variação):** base = `single short dry user-interface sound, no music, no reverb tail, no background noise, one event then silence, recorded close, soft and matte` · **pousar:** `+ a small wooden block set down gently on a felt table` · **puxar:** `+ a tiny glass tick, very short` · **espera:** `+ two soft sine tones rising a fourth, 250 milliseconds total` · **selo:** `+ a round warm low thud like a wax seal pressed once, 400 milliseconds` · **meta:** `+ a gentle warm chord swell, 700 milliseconds, no tail` · **contato:** `+ a low soft hum fading in and out over 300 milliseconds, like a distant door opening`
- **Regra do material:** som só após gesto, botão visível, ≤ 400 ms, no máximo um por evento, `visibilitychange` pausa; seed fixa; TV sem som.

### 6.8 Apoio
- `bria/remove-background` (US$ 0,018) para limpar o keyframe do "b" se vier com fundo sujo: 5 × = US$ 0,09.
- Feitos em código, custo zero: bitmaps 7 × 11 dos agentes (hash do nome → 77 células), sigilo monolinha da pessoa (hash → forma geométrica), grade de pontos, anéis, radar, selo que abre, luz de projeção, coluna Wow!, linha graduada, todos os efeitos.

**Custo total estimado: ≈ US$ 11,30** (b vetorial 0,24 · ícones 4,00 · guildas 0,72 · diagrama 0,24 · logo 2,44 · véu 1,73 · sons 1,60 · apoio 0,09; margem para repetições incluída). Abaixo dos US$ 16 (80 % de US$ 20). Cada lote conferido no `MANIFESTO.json` com o total acumulado impresso.

---

## 7. O que NÃO tem (recusado de propósito)

- Nenhum degradê como fundo, texto ou botão: `.oficina-v`, `.cron-relogio`, `.term-linha.saida`, `.st-atualizar`, seleção `--e-sel-a → --e-sel-b` e chips em degradê saem; o degradê vive como um traço de 1 px por tela.
- Nenhum halo radial (palco da Máquina, cronômetro), nenhum neon permanente (`@keyframes neon` de 3,4 s), nenhum ponto pulsante quando nada muda (`.term-estado.pensando` vira o anel, que para).
- Nenhum vidro em painel de conteúdo; nenhum vidro sobre vidro; nenhum texto de trabalho sobre vidro ou sobre fundo gerado.
- Nenhum "b" gigante (meio, terminal, TV painel), nenhuma marca d'água, nenhum botão Neon, nenhum "ESTAÇÃO · PROTÓTIPO", nenhum "Ver como" na interface.
- Nenhum ícone literal de tema: disco voador, alienígena, coroa, brasão, escudo, castelo, foguete, estrelas, radar verde, HUD com mira, scanline, glitch, grão, partículas, letras "alienígenas", carimbo rotacionado vermelho, fontes Eurostile/Orbitron, sete segmentos.
- Nenhum "b" volumétrico 3D nem `<model-viewer>`: seria monumento.
- Nenhum mural de partículas no Acervo (a ideia Foundation foi descartada: contradiz "nada anima sem dado").
- Nenhuma quarta família tipográfica (pixel/dot): o bitmap 7 × 11 faz esse papel.
- Nenhum ranking, nenhum placar entre pessoas, nenhum streak de dias corridos, nenhuma cor de cargo, nenhum ouro em botão, nenhum chip preenchido de cor.
- Nenhum selo "IA", nenhum texto de ajuda fixo (os 46 saem; fica um "?" por seção e a apresentação do agente uma vez), nenhuma receita fixa no terminal, nenhum toast de progresso do agente.
- Nenhum morph por evento externo enquanto a pessoa digita; nenhum "seguir" que sequestre o editor; nenhum layout que precise ser arrumado à mão.
- Nenhum som na TV; nenhum leito sonoro; nenhum som em hover.
- Nenhum `prefers-reduced-motion` a `0.01ms` global.
- Nenhuma sombra colorida, nenhum cartão dentro de cartão, nenhum easing elástico, nenhum overshoot.
- Nenhum chão diferente entre Estação e TV (`#090413` sai).
- Nenhum PNG de logo (204 KB) nem ícone rasterizado.

---

## 8. Riscos e como medir

1. **O Trilho pode virar teatro** (movimento demais numa jornada de 8 h). Guarda-corpo: só por gesto, ≤ 280 ms, um movimento por vez, teto de 2 sinais vivos por tela; medir em teste tempo de tarefa e erro, não nota de 0 a 10 (efeito estético-usabilidade).
2. **Imposto da novidade** (Arc): o Trilho é o único mecanismo novo; árvore, abas, Ctrl K, blocos e "desfazer" ficam familiares; o gesto tem sempre um caminho antigo (clique e menu).
3. **Recraft SVG pode devolver contornos preenchidos** em vez de traço: pós-processo obrigatório; se a família não bater, `arrow-1.1` com referência. O custo de refazer 40 ícones no Arrow é US$ 8 (ainda dentro do teto).
4. **Vídeo com `first = last` pode sair parado**: o método em duas metades está previsto e custa o mesmo.
5. **Contraste sobre `#0d1526` não foi medido nesta etapa** (os tokens atuais tampouco): medir em apcacontrast.com antes de fixar; ajustar `--texto` para 92 % se a bancada ficar abaixo de Lc 75.
6. **Cormorant ≥ 22 px em telas pequenas** pode não caber na saudação do celular: cair para Plex 600 no celular quando a largura for < 400 px.
7. **Cor de pessoa por matiz fixo** pode colidir com daltonismo: o sigilo monolinha (forma) e a foto sempre acompanham a cor; nunca só cor.
8. **Densidade da junta (24 px)**: se acumular mais de 6 peças à espera, vira lista rolável com contador; testar com o simulador.
9. **A peneira ainda não foi executada**: este conceito assume a barra de 12 ícones e a fusão Acervo + Inteligência; se o Theus preferir outra ordem, o Trilho não muda.
10. **"Nordic UFO" e outras leituras** ambíguas do pedido não afetam este conceito; nada aqui depende delas.

---

## 9. Como cada função do FUNCOES.md continua (A–L)

**A · Casca e navegação.** Barra de atividades (12 ícones, todas as 16 atividades continuam existindo como atividade ou aba: Inteligência dentro de Acervo; Tarefas dentro de Trabalho; Metas e Mapa dentro de Equipe) · Lateral recolhe (Ctrl B; a bancada ocupa o espaço, a junta fica) · Terminal recolhe (Ctrl `; a junta encolhe para 8 px e mostra só as peças à espera) · Abas do meio (32 px, fechar no hover, Ctrl Shift W deixa o Vazio) · Paleta Ctrl K (duas colunas verbo · objeto; tudo o que existe está nela) · Barra de status (fileira de luzes, §3.4; "terminal ao vivo" vai para o cabeçalho do braço, "acervo: 76" some, "TV conectada" vai para o botão Tela da TV, "Salvo na equipe" aparece ao salvar) · Trocar presença (luz de presença) · Coluna de novidades (sino; uma por vez; ação ou nada) · Ver como (só `?como=` para teste) · Tela da TV (keycap no topo) · Celular (< 760 px, §3.5) · Identidade visual (chão `#060b16`, roxo → azul → ciano como traço e escala de tempo, mono no terminal, "b" pequeno em SVG).

**B · Criar.** Boas-vindas de Criar (o Vazio + "Começar de um preset" + "Mudaram por último" na escala de tempo; sem os quatro cartões repetidos e sem "Ver um exemplo em 3D") · Seletor de modo (alternador no topo da prateleira; em projeto: "N pessoas com você agora", o que cada um faz, quem vê meu arquivo) · Árvore (§3.1) · Filtrar · Novo (um "+") · Arrastar arquivo para pessoa (voo M2) · Arquivo → Projetar / Levar para a reunião (menu da linha) · Abrir arquivo de outro (só leitura; "Sugerir mudança" vira demanda; gestão edita com aviso; a bancada mostra "Revisar mudanças" com aceitar/rejeitar por trecho) · Editor md/código/csv/pdf/imagem/vídeo/mapa/quadro (formas Folha, Tela, Mapa, Quadro) · Editar e salvar (Ctrl S; foto no cabeçalho e na árvore) · Versões · Voltar como estava (régua de versões no topo da bancada) · Formatado/Texto · Site | Código | 3D (alternador no canto da bancada; o 3D continua como modo do visualizador, three.js) · Editar na tela (camada por cima da Tela; blocos com borda na cor de quem mexeu; Salvar (n) / Descartar) · Projetar / Levar para a reunião / Pedir ajuda / Chamar para cá (barra do arquivo, mesmos verbos da paleta) · Mapa mental MindForge (forma Mapa; TV em apresentação) · Mapa pelo terminal (o galho novo é empurrado pelo trilho e chega selecionado) · Quadro · Máquina (forma Palco: peças, ficha encostada na junta, Testar, O que muda, Publicar, Ver o agente montando com o anel, Pedir para alguém, ambiente como rótulo do topo, chave faltando no cofre como alerta na peça) · Máquina pelo terminal (peça tracejada empurrada) · Presets (lateral "Presets da equipe"; "✓ Funcionou · Salvar como preset"; "Começar de um preset" no Vazio; "usa o preset X" no terminal).

**C · Terminal e agentes.** Painel à direita (Braço, §3.3; `nome@estacao · ~/BabelCoop · agente` na primeira linha do bloco shell) · Abas de agentes com nome humano (bitmap 7 × 11 no lugar da "foto de letra"; renomear; apagar; o botão Neon sai porque o neon virou estado) · Estado do agente (anel de 14 px, visível) · Menção de pessoa (chip com foto) · Pedidos em português (cada um vira blocos pedido → consulta → plano → ação → resultado; "cancela…" vira bloco espera s/N; o que é criado é empurrado e aparece na TV quando projetado) · Comandos `coop` (todos, como blocos comuns; `coop tv…`, `coop entrar`, `coop projetar`, `coop rolar`, `coop sonhar` etc.) · Comandos de shell (blocos shell) · Receitas (3, por contexto da peça puxada) · Terminal ao vivo (ponto-radar no cabeçalho do braço) · Terminais ao vivo — parede (atividade Terminais, forma Parede: setas ↑↓ + tempo de ida e volta; Entrar / Pedir / Chamar / Falar / Assumir / Sair; o dono vê a luz "controle de terminal" no rodapé com Encerrar; pedido chega com Aceitar / Agora não) · Navegador do agente (aba da bancada "Navegador · agente": cursor à vista, Assumir / Devolver, Raio-X com HTML · CSS · Copy · Rede · Console · Selecionar elemento, Clonar página, Clonar copy, Print como prova no bloco resultado) · Navegador da pessoa (aba da bancada com barra de endereço) · Marca da pessoa nas peças (borda 1 px na cor) · Terminal real (só no app; mesmos blocos sobre node-pty).

**D · Meu dia, demandas, tarefas, metas.** Meu dia (forma Papel: resumo em 3 números apontando para Trabalho; o que estou fazendo; check-in; Estou bem; pedir uma mão; apoiar alguém; ideia falada; saudação em Cormorant; "Primeiros passos com IA" como aviso único) · Nova demanda (ficha Blue Book: PARA · PRAZO · ESTIMA · PRIOR. · PROJETO; ou pelo terminal) · Cronômetro da demanda (Começar · Pausar com motivo · Retomar · Pronta com aprendizado obrigatório · OK de quem pediu com o selo que abre; repetido soma +1) · Cronômetro móvel (pílula no rodapé por padrão; caixa flutuante arrastável só ao "destacar" pela pega ⋮⋮; posição lembrada; nunca fecha) · Cronômetro destacado (janelinha PiP / sempre-no-topo com Pausar/Continuar) · Cronômetro volta sozinho (ao mexer numa peça do trabalho depois de 45 s; avisa pela luz e registra) · Tarefas livres (carimbo LIVRE; quem pega vira responsável) · Pedir ajuda / Estou travado / Levar para a reunião (dentro da ficha) · Tarefas com fluxo (aba de Trabalho; visões lista / quadro / por pessoa / trilha como linha graduada; OK de quem passou) · Metas e campanhas (aba de Equipe; +1 cliente; campanha pelo terminal; placar na TV; comemoração = anel fecha) · Pausa automática fora do expediente (Equipe → Regras).

**E · Chat, reunião, sala.** Chat estilo WhatsApp (forma Conversa: #geral, canais, diretas, ✓✓, responder, reagir, emoji, anexar, "digitando…") · Mensagem vira demanda / vai para a TV (menu da mensagem) · Reunião (forma Mesa; iniciar; Levar para a reunião de qualquer peça, inclusive arrastar + Tab; destacar; decisão / próximo passo; encerrar gera ata na forma Folha; TV em modo reunião; quadro ao vivo) · Memória da sala 5 min (coluna Wow! no rodapé e na TV) · Salvar ideia falada (botão no rodapé e na Mesa; cartão de confirmação; círculo de Ehman; vai para Acervo → Ideias) · Começar a gravar / Parar (segurar 600 ms = 10 min; ponto vermelho batendo na TV e no rodapé) · Conversa particular (coluna congelada) · A sala sugere (faixa fina na TV por 30 s, só se o padrão persistir por duas janelas de 12 s) · Ideia falada individual (Meu dia → Falar ideia, até 1 min).

**F · Acervo, inteligência, aprendizados, sonho.** Busca no acervo (Acervo → Buscar; palavras / semelhança; 6 filtros + "mais"; "Não identificado · 0 de 76" quando vazio) · Aprendizados (Acervo → Aprendizados; `coop aprendi`; +1) · Melhores prompts (Acervo → Prompts; estrela; "usar" puxa para o terminal pelo trilho) · Sonho noturno (Acervo → Sonho; 7 linhas empilhadas da semana ≤ 120 px ao lado do número) · Cuidando da gente (Equipe; sinais; Estou bem; avisa a pessoa antes da TV).

**G · Equipe, perfil, mapa, projetos, ajuda.** Equipe (cartões à Ultravioleta: nome, sigilo, cor, glifo de guilda, ícone de cargo; carga, check-in e horas em painel de gestão à parte; Regras; foto pôr/trocar/tirar; a seção "Controle da TV" sai daqui e vira a engrenagem da janela Tela da TV com nomes humanos de tema) · Convidar pessoa (token `babel-…` com a grade 7 × 11, 3 passos, Copiar) · Perfil como aba inteira (forma Ficha: trabalhos, tempo, dados e materiais, fatia %, duas prateleiras — Selos com aro de metal e Recordes pessoais —, laurel opcional, sequência de dias úteis, linha do tempo na escala de tempo, agentes; sem ranking; filtro por período) · Mapa da equipe (aba de Equipe: mapa de pulsares; pulso = traço que anda pela linha quando uma tarefa passa) · Projetos (atividade: lista + criar; abrir leva a Criar no modo do projeto; conversa com chips "com todos" / "com pessoa"; demandas; próximos passos; quadro; mapa; Máquina; agentes; Entrar; Falar; projetar evolução na TV) · Ajuda par a par (Chamar para a minha tela = "focus" com convite; Falar com (voz no app); Pedir ajuda a quem sabe; O que cada um está fazendo ao lado do nome).

**H · WhatsApp e Loja.** WhatsApp na Estação (forma Conversa; parear por QR de verdade; só a pessoa vê; fora do acervo e da TV) · Agente sugere resposta (sugestão no campo; Enter manda; "automático" por contato com aviso de bloqueio) · Loja da equipe (Instalar; Versão nova → Atualizar; publicar a minha; chave pede o cofre).

**I · TV.** Sem botão (só F) · Modos painel · reunião · quadro · projeção · site · visita (engrenagem da janela Tela da TV e `coop tv …`) · Painel (§3.5) · Projeção (luz de borda de 1 px; rolar por PageUp/Down, ▲▼ do rodapé, `coop rolar`; ✕) · Site na TV · Selos da sala · Sugestão de ideia · Cuidando da gente na TV · Comemoração (anel fecha, 800 ms, uma vez).

**J · iPad.** App à parte (`#ipad`) · Quadro de borda infinita · Risca no iPad, risca na TV · Salvar = `.quadro` na pasta Quadros · Projetar na TV · Estação ↔ iPad.

**K · Oficina.** Quem pode mudar o app (chip "pode mudar" em ametista fosca / "só usa") · Mudar o app pelo terminal ("muda no app: …" vira blocos com "Aguardando publicação") · Publicar atualização vN (número em mono, sem degradê) · Atualizar (luz "Atualizar vN" no rodapé; atualiza em fundo, avisa uma vez; Oficina mostra quem está fora de fase, como sincronização do interferômetro).

**L · Só no app instalado.** Nada muda: terminal real, teclas pela rede, pastas servidas por cada computador, token de verdade, transcrição, WhatsApp Web, navegador do agente sobre Electron, Máquina lendo o Supabase, mapeamento arquivo:linha, voz WebRTC, atualização baixada da Estação de quem publicou, janela sempre-no-topo do cronômetro, acesso de fora.

**Contagem:** 0 funções removidas; 5 mudam de casa (Inteligência → Acervo; Tarefas → Trabalho; Metas e Mapa → Equipe; Controle da TV → engrenagem da Tela da TV); 3 itens da peneira marcados [LLM] saem (marcas grandes, botão Neon, rótulos de protótipo) e nenhum deles está no FUNCOES como pedido do Theus.
