# Conceito FINAL v2 · VISADA revisada pelas quatro lentes (Excesso · Pastiche · Empresário · Viabilidade)

> 2026-09-23 · sintetizador de volta. Base: `conceito-final.md` (v1) + as quatro críticas. Regra desta passagem: **para cada problema, corrigir ou manter com motivo escrito; nada do que os críticos mandaram manter se perde; onde dois críticos mandam manter e um manda cortar, a decisão vai para "riscos" com o motivo.**
> Honestidade de fonte: esta passagem não abriu URL nova. Reli PROMPT_AGENTICO_LP.md, BRIEFING_IA.md, UX_PENEIRA.md, FUNCOES.md, base.css, v3.css e os preços registrados em `geracao-replicate.md` (recraft-v4-svg US$ 0,08/imagem; nano-banana-2 2K US$ 0,101; wan-2.7-i2v 720p US$ 0,10/s; seedance-2.0-fast 480p US$ 0,07/s; wan-2.2-i2v-fast 720p US$ 0,11/vídeo; stable-audio-2.5 US$ 0,20/arquivo). Nenhum outro número novo.

## 0. Onde as lentes concordam (aplicado sem discussão)

| Traço da v1 | Lentes | Decisão v2 |
|---|---|---|
| Apontar (1 px na aba ao rolar o Registro) | Excesso | **cortado** |
| Crossfade 180 ms ao trocar de aba | Excesso, Empresário (velocidade) | **troca instantânea**; crossfade só quando um evento substitui o conteúdo da MESMA aba |
| Campo "--s1 sempre" vs "coluna da última ação" | Excesso | **Campo sempre --s1, laterais sempre --s0**; foco só por `:focus-visible` |
| Mostrador "sobe para --s2" | Excesso | **sempre --s2**; agindo = anel em laço + borda tingida 12 % |
| Nomes de 13 px tingidos de roxo (escala longa) | Excesso | **só uma marca de 6 px** ao lado do nome; nome em --texto-90; na TV as 7 linhas tingem, o número não |
| Rótulo 10 px na barra | Excesso (piso 11) + Empresário (rótulo permanente) | **barra 56 px, ícone 20 + rótulo 11 px Plex Medium, ligado por padrão, some só por preferência** |
| Círculo ao redor do trecho (ideia salva) | Excesso | **anel de 14 px fecha no botão "Salvar ideia falada"**, nunca sobre o texto |
| Ícones que se desenham ao entrar | Excesso, Viabilidade | **ícones estáticos sempre**; dashoffset só no anel de estado, no Selo e no b da Entrada |
| Quatro coisas chamadas "selo" | Excesso | **Selo = só consentimento**; Perfil = **insígnia**; sala/controle = **luzes** (casas do rodapé) |
| "b" acende por três causas | Excesso, Pastiche (roxo = "antes") | **b estático por padrão**; preferência "luz da marca": nunca (padrão) · sempre · quando um agente meu age (uma causa só, --t0, 4 px, nunca roxo) |
| Disco do cronômetro | Excesso | **cortado**; rodando = dígitos --texto-90, pausado = --apagado |
| Coluna Wow! (1–9 A–Z) | Excesso, Pastiche, Empresário | **rodapé = ponto + palavra (ouvindo · gravando · particular) + os três botões**; **TV = 25 traços verticais de 1 px, altura 1–8 px = intensidade, um a cada 12 s**, sem letras; o nome Wow! sai da documentação |
| Ponto pálido + feixe + grade no vazio | Excesso, Pastiche | **vazio = --s1 liso + "Nada aberto · Ctrl K"**; grade de pontos só no palco da Máquina, no quadro e no iPad |
| Campo profundo (nebulosa) + loop da TV | Excesso, Pastiche, Viabilidade | **cortados** (elementos 5 e 6); TV em espera = chão --s0 + b em SVG estático; Visita = Latte |
| Loop da logo (splash 3 s) | Excesso, Pastiche | **cortado** (elemento 3); a Estação abre direto em Meu dia |
| Seis sons | Excesso | **um som só: "espera"** (ping ≤ 300 ms), desligado por padrão, primeiro como oscilador Web Audio (custo 0); stable-audio só se o oscilador soar barato no teste (reserva US$ 0,40) |
| Lupa duplicada; selar/romper/presença como ícones | Excesso | **43 ícones** (uma lupa; selar/romper/presença usam o próprio Selo) |
| ↑ 0,3 s / ↓ 2,4 s | Excesso, Pastiche, Empresário | **sem setas**; enquanto roda: "pensando há 4 s" (medido); ao parar: "terminou · 14:32"; o tempo de ida e volta fica na parede de Terminais e na preferência "mostrar tempos" (desligada por padrão) |
| Quartos no anel de 16 px / impalado | Excesso, Pastiche | **dois = dois anéis de 14 px sobrepostos −4 px** (padrão .pj-avatares que o protótipo já tem); 3+ = anel + "+N"; a palavra "impalado" sai |
| Rompido = corte diagonal | Pastiche, Empresário | **Rompido = anel volta a ABERTO + ponto 3 px à esquerda na cor de quem rompeu**; "Desfeito por · hora" quando desfaço a minha própria ação; "Rompido por Davi · 15:10 · voltou como estava" só quando alguém desfaz o OK de outro |
| Metais do Reino (aço/bronze/prata/ouro em 3 tons, laurel, fimbriação) | Pastiche | **saem**; nível = "03" mono + barra "6/10"; insígnia = anel 16 px com 1–4 arcos preenchidos em --texto-90; **um só --ouro #f5c76a chapado** para meta a 100 % e OK de quem pediu; --ametista sai (chip "pode mudar" = contorno --t1) |
| Vocabulário de spec na UI | Empresário | **lista fechada de termos proibidos na interface**: trava, travado, visada, meia-vida, puxar, espiar, rompido (fora do caso acima), impalado, Catálogo, Campo, Mesa, Mostrador, Registro; a primeira abertura mostra "Arquivos · Trabalho · Agentes" |
| Anel de 16 px como único alvo de OK | Empresário | **botão de texto sempre** (OK · Aceitar · Publicar v4 · Salvar preset) com o anel como ícone à esquerda; anel sozinho só na linha da árvore e no canto do cartão; anel que espera o MEU OK = --atencao; "OK · Carla · 14:32" escrito, sem hover |
| Tema escuro único, corpo 13 px | Empresário | **tema claro no escopo da v1** (mesma fórmula OKLCH, APCA nos dois); densidade **confortável por padrão** (linhas 24 px, corpo 14 px, nomes 13,5 px); compacta (20 px, 13 px) é escolha |
| Ctrl+→ para Puxar | Viabilidade | **Ctrl+Enter (ou Alt+Enter) com seleção**; arrasto continua o gesto primário; tabela de atalhos testada no Chrome/Electron do Mac antes de construir |
| Abas de agentes 28 px vs Campo 32 px | Viabilidade | **32 px nos dois painéis**; `--trilho-y: 32px` única |
| Aposta cega no Recraft com stroke | Viabilidade | **portão de US$ 0,24** (3 ícones); se vier preenchido, os 43 são desenhados à mão com `fill: currentColor`; dois tamanhos ópticos (20 e 16 px) |
| Foto do agente sumia | Viabilidade | ⋯ do agente tem **Pôr foto · Trocar · Tirar** |
| "mostrar terminal" sumia com a Mesa recolhida | Viabilidade | **oitava casa "agentes" no rodapé, acesa só enquanto a Mesa está recolhida** (FUNCOES.md A literal) |
| 8 receitas sem casa | Viabilidade | **paleta Ctrl K ganha o grupo "Receitas" com as 8**; sem objeto, as 3 padrão são as mais usadas pela pessoa (fallback: explicar arquivo · procurar no acervo · criar página) |
| Lacunas de reduced-motion | Viabilidade | **tabela completa** (gravando = ponto fixo + palavra; crossfade = troca imediata; heróis = estado final; anel da meta e Selo = estado final) |
| Plex 450 no Google Fonts | Viabilidade | **self-host** dos .woff2 de @ibm/plex-sans em /fontes/ com `@font-face` 450; fallback 400 |
| Webhook sem servidor | Viabilidade | **gera.mjs** em Node (fetch nativo): polling 2 s, Cancel-After 15 m, download imediato, MANIFESTO.json, parada automática em US$ 16, entradas por data URI |
| 46 ajudas sem substituto | Viabilidade | **"?" de 24×24 em --fraco no cabeçalho de cada atividade** (abre uma linha em --apagado, some com Esc; não conta no teto de sinais vivos) |
| Sons: -ss 0 -t 0.4 pode devolver silêncio | Viabilidade | se algum som for gerado: `silenceremove=start_periods=1:start_threshold=-50dB` antes do corte, `loudnorm` depois; aceite: pico ≥ −6 dBFS nos primeiros 30 ms |

## 1. Onde as lentes divergem (decisão + motivo; tudo isto também está em "riscos")

### 1.1 Visada do agente (linha tracejada)
- Excesso: cortar (quarta luz do mesmo evento; calha de recuo frágil em árvore aninhada, pasta fechada, linha rolada).
- Pastiche e Viabilidade: manter "a visada correndo só por trilhos do cromo (hairline sob as abas + calha da árvore)"; Viabilidade corrige os três casos sem fim (tique de 4 px na borda visível; pseudo-elemento por contêiner com `clip-path: inset()`).
- **Decisão:** manter **um segmento só**: a linha tracejada 2/3 na cor da pessoa corre pela hairline sob as abas, do canto do Mostrador até a aba do objeto tocado (ou até a borda visível da fila, com tique de 4 px, se a aba está fora da rolagem). **A descida pela calha da árvore sai** (todos os casos frágeis do Excesso vivem lá). Se o objeto não está aberto em aba, não há linha: a linha da árvore acende (uma das três luzes), o Mostrador escreve o caminho (pasta/arquivo) e o botão Seguir leva. A linha nasce em 240 ms uma vez e depois é cor estática esfriando com as três luzes (meia-vida 6 s): é o fio que liga as três luzes, não uma quarta; não conta como sinal vivo. Plano de retirada continua: se confundir no teste, some e sobra Mostrador + três luzes.
- **A linha sólida da trava é cortada** (Excesso): a Mesa está sempre travada na aba ativa, e a aba ativa já tem o segmento de 2 px --t0; nenhuma animação ao trocar de aba.

### 1.2 Avatar do agente
- Excesso e Viabilidade mandam manter o bitmap 7×11; Pastiche (identicon 2013, pixel borrado) e Empresário (ícone quebrado) mandam trocar.
- **Decisão:** na casca (abas de 32 px, cartões, chips) **agente = quadrado de 14 px (raio 2), contorno 1,5 px na cor da pessoa dona, inicial mono 10 px dentro; pessoa = círculo** com foto ou iniciais. Quadrado × círculo distingue sem legenda, sem hash, custo zero, e continua sendo a "foto de letra" do FUNCOES.md. Com foto, a foto vai dentro do quadrado (o formato continua distinguindo). O bitmap 7×11 sobrevive **só no Perfil do agente e na parede de Terminais, em ≥ 24 px com 2 px por célula (14×22) e `shape-rendering: crispEdges`**, como assinatura opcional quando não há foto; nunca em ícone de ação. Registrado como corte de um "manter" do Excesso/Viabilidade porque a função (distinguir agente de pessoa; foto do agente) está preservada por meio mais legível.

### 1.3 Rodapé: contorno das casas apagadas
- Excesso e Empresário mantêm "fileira de luzes apagadas (contorno 1 px sem texto)"; Pastiche: sete molduras vazias = painel da Apollo, contraria "mostra o que muda".
- **Decisão:** manter a substância (casa fixa por informação, posição estável, texto só quando há dado) e **tirar o contorno**: casa apagada = espaço reservado invisível com largura mínima fixa (o texto não pula de lugar); acesa = mono 11 px sem caixa; a única linha do rodapé é a hairline superior. O que os dois "manter" pedem (casas fixas, fala só quando há dado) continua inteiro; o contorno era o meio, não a função.

### 1.4 Luz de projetor da TV
- Excesso, Empresário e Viabilidade mantêm "degradê --t2 → --t0 de 24 px nas quatro bordas"; Pastiche: Ambilight, e roxo (= "antes" na lei 3) acendendo num evento ao vivo contradiz a escala de tempo ensinada no mesmo quadro.
- **Decisão:** manter a **função** (uma luz de borda diz "isto está projetado, por quem" e some ao encerrar) e corrigir o material: **linha de 0,3u (≈ 3 px a 3 m) em --t0 nas quatro bordas + rótulo mono "Projeção · Carla" no canto**, estáticos. O argumento da contradição interna (roxo = antes num evento de agora) é o que decide. O degradê roxo → azul → ciano sobrevive **só como escala de tempo** ("mudaram por último", evolução da semana, linha do tempo do Perfil), que é onde tem significado, e é isso que o FUNCOES.md A registra como identidade.

### 1.5 Tema Ametista da TV
- Excesso: cortar (segundo chão, paleta à parte, nomes [LLM]); Empresário e Viabilidade mantêm "Ametista como tema opcional"; FUNCOES.md I lista "tema roxo/azul/claro" e nada do FUNCOES.md sai.
- **Decisão:** o tema roxo fica **como derivação da fórmula OKLCH** (base --s0 deslocada de matiz para ~300°, mesmos --t*, mesmos textos), não como a paleta `--t-*` do "grafo v5", que sai. Nome humano "Ametista" na engrenagem. Um chão só, uma física: o roxo é preferência, não segundo sistema.

### 1.6 Clipe "Entrada" e os keyframes neon
- Pastiche: tubo de neon fotorrealista + "ruído que resolve" = clichê; Entrada = b em SVG por dashoffset, custo 0. Excesso e Viabilidade: manter o clipe como o único ritual de marca, com fallback SVG e no máximo 2 tentativas. Pedido do Theus: "logo animada … gerada por IA via Replicate".
- **Decisão:** o **SVG é a Entrada definitiva de base** (b em traço 1,5 px se desenha em 1,2 s, --ease-heroi, termina no mesmo b estático do topo; reduced-motion = b estático). O clipe gerado por IA continua **como candidato com portão**: keyframes refeitos no material da marca (traço chapado, sem tubo, sem halo, sem ruído): A = b chapado em --texto sobre #060b16; N = o mesmo b com só 15 % do traço, em --t0. Movimento = o traço se completa em --t0 e esfria para --texto no último segundo (a própria lei da meia-vida: o evento de entrar envelhece até o repouso). Rascunho seedance-2.0-fast 480p; final wan-2.7-i2v 720p só se o rascunho ganhar do SVG lado a lado com 3 pessoas; **teto de 2 tentativas (US$ 1,40)**; o vídeo é a própria tela de login em tela cheia sobre #060b16 (sem blend, sem alfa, sem caixa), termina em A e faz crossfade de 180 ms para Meu dia; qualquer tecla ou clique pula. Expectativa honesta registrada: o SVG deve ganhar.

### 1.7 Som
- Excesso: cortar os seis; Pastiche: "stable-audio continua"; Empresário: som desligado por padrão, só após gesto.
- **Decisão:** um só evento com som ("espera": o agente precisa de você e você olhou para outro lado). Primeiro um oscilador Web Audio de 3 linhas (custo 0); stable-audio-2.5 (2 variantes, US$ 0,40) só se o oscilador soar barato no teste. Desligado por padrão, liga na engrenagem, nunca na TV nem no iPad.

### 1.8 Ícones "que se desenham"
- Pastiche mantém "traço que se desenha"; Excesso e Viabilidade cortam (animação sem dado; centenas de dasharray numa árvore de 200 linhas).
- **Decisão:** ícones estáticos sempre. O "traço que se desenha" vive onde há dado: anel de estado, Selo e o b da Entrada.

## 2. Contagem de ufologia e Reino depois do corte
- Ufologia nomeada: **2 peças** — o anel de traço único como estado do agente; a coluna de intensidade da TV (25 traços, um a cada 12 s). Todo o resto virou padrão sem nome (ficha com rótulos e carimbo reto, escala de tempo, "sugestão só se persistir 2 janelas de 12 s", grafo radial).
- Reino: Perfil (nível "03" + barra "6/10", insígnias com arcos, sequência que só a pessoa vê), o Selo de consentimento como versão cotidiana do lacre, Cormorant para fala humana, o token como convocação (Entrada uma vez). Sem metal, sem laurel, sem coroa, sem guildas, sem títulos.

## 3. Kit de IA depois do corte (preços de geracao-replicate.md)
| Elemento | Modelo | US$ |
|---|---|---|
| Keyframes A e N do b (material chapado) | google/nano-banana-2, 2K, 4 gerações | 0,40 |
| Clipe Entrada (candidato com portão; SVG é a base) | seedance-2.0-fast 480p → wan-2.7-i2v 720p, ≤ 2 tentativas | 0,70 – 1,40 |
| 43 ícones SVG nativos (portão de 3 antes do lote) | recraft-ai/recraft-v4-svg, 43 × 0,08 + 30 % | 4,47 |
| Som "espera" (só se o oscilador reprovar) | stability-ai/stable-audio-2.5, 2 variantes | 0 – 0,40 |
| Tudo o mais à mão (anel, Selo, visada, meia-vida, luzes, chip, grade, b em SVG, coluna de intensidade, bitmap do Perfil) | CSS + SVG | 0 |
| **Total** | | **≈ 5,6 (base) a 6,7 (teto)** de 20; parada em 16 |

## 4. Tabela de aceite "animação → evento → equivalente estático" (completa)
| Animação | Evento que a dispara | prefers-reduced-motion |
|---|---|---|
| Visada do agente nasce (240 ms) | agente toca outro objeto | já no destino |
| Anel do agente em laço (1,2 s) | agente pensando | anel aberto estático + "pensando há N s" |
| Anel fecha (180 ms) | agente terminou | fechado |
| Meia-vida (rAF 4 Hz) | evento real e relevante | 3 degraus (aceso · morno · repouso) |
| Selo fecha (180 ms) | clique/Enter/tecla | estado final |
| Selo abre — herói (400 ms) | OK de quem pediu | estado final |
| Anel da meta fecha — herói (800 ms) | meta a 100 % | fechado |
| Anel no botão "Salvar ideia" — herói (400 ms) | ideia salva | fechado |
| b se desenha — herói (1,2 s) | primeiro login com token | b estático |
| Crossfade 180 ms na mesma aba | evento substitui o conteúdo | troca imediata |
| Peça pousa (180 ms) | 2 s sem tecla ou Enter | aparece |
| Ponto vermelho batendo (1,6 s) | gravando | ponto fixo + palavra "gravando" |
| "ao vivo" (ponto 6 px) | transmitindo | ponto fixo |
| Notificação esfria (6 s) | evento passageiro | some por passo |
| Zona da TV troca (400 ms) | mudança de dado | troca imediata |
| Coluna de intensidade da TV | nova amostra a cada 12 s | sem transição |
Zero animação: abrir/fechar pasta, filtrar, trocar de aba, trocar de atividade, hover na árvore, rolar o Registro, ícones.

## 5. Termos: no código/documentos vs na interface
| Código/docs | Interface |
|---|---|
| Catálogo · Campo · Mesa | Arquivos · Trabalho · Agentes |
| Mostrador | (cabeçalho do painel de agentes, sem nome) "→ README.md" |
| objeto travado | "→ README.md" |
| Registro | (sem nome) |
| Puxar | "Levar para o agente" (no ⋯) · Ctrl+Enter |
| Espiar | "Ver antes/depois (Espaço)" |
| Seguir | Seguir |
| Selo (consentimento) | OK · Aceitar · Publicar vN · Salvar preset (com o anel como ícone) |
| Rompido | "Desfeito por · hora" (minha ação) · "Rompido por X · hora · voltou como estava" (OK de outro) |
| insígnia (Perfil) | insígnia |
| luzes (rodapé/TV) | (sem nome) |
| meia-vida, visada, trava, impalado | nunca aparecem |
