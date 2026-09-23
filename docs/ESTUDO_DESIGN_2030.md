# Estudo de design 2026–2030 para o Babel Coop

> Missão `babel-coop/design-2030`, protocolo DEUS — CRIADOR · 23/09/2026 · sete frentes de pesquisa na web, cada achado com a fonte lida; as anotações completas (24–55 KB por frente, 200+ fontes) estão em `.deus/missao-design/pesquisa/*.md`. O que não abriu (403, JS) está marcado lá como "não lido" e não vira fato aqui.
> Serve a: o conceito escolhido (`docs/design/CONCEITO.md`), os tokens (`docs/design/tokens.css`), o pipeline de geração (`docs/design/GERACAO_REPLICATE.md`) e o painel (`docs/design/painel.html`).

## 0. O que o estudo responde

O Theus pediu: futurista, minimalista, sem excesso, para empresários e times de empresa; esquerda = arquivos e opções, meio = trabalho, direita = terminal com agentes, **de um jeito que ninguém usou**; misturar reino, empreendedorismo, ufologia, futurismo e criatividade **sem forçar**; elementos gerados por IA na Replicate; a Máquina (peças que parecem 3D, fios, montar backend e frontend) incluída.

Resposta curta, sustentada abaixo: o que 2026 chama de futurista **não é** neon, vidro nem degradê roxo, e sim **precisão, materialidade, calma e prestação de contas do agente**. A identidade atual da Babel (fundo `#060b16`, roxo → azul → ciano, "b" neon, Cormorant + Plex + JetBrains) **fica como DNA e muda de gramática**: o degradê vira luz e escala de tempo, o neon vira medidor de estado, a serifa vira a voz do que é humano. O mecanismo novo está em como as três colunas se comportam, não em como brilham.

## 1. A régua (o que julga cada traço)

1. **Menos, mas melhor** (Rams, princípio 10) e **"nada arbitrário"** (princípio 8): todo elemento entra com uma linha dizendo que informação carrega. Sem linha, sai. [Vitsœ]
2. **Cada unidade extra compete com as relevantes** (Nielsen, heurística 8, revisada em 2024). Minimalismo é razão sinal/ruído, não "flat". [NN/g]
3. **Calma**: exigir o mínimo de atenção; usar a periferia; comunicar sem falar; continuar funcionando quando falha. [Calm Tech Institute; Amber Case]
4. **Agente presente, opcional, interrompível, rotulado e responsável**: "Zero UI won't succeed because it's invisible. It will succeed because it's accountable." [DMEXCO 2025; Microsoft 2025]
5. **Motion só com metáfora e só com dado**: "Don't add motion for the sake of adding motion"; evitar motion em interação frequente; deixar cancelar. [Apple HIG Motion] + a regra do próprio Theus ("um efeito só entra se for metáfora do serviço").
6. **Velocidade é design**: 100 ms público, 50–60 ms interno; desfazer como rede, não spinner. [Superhuman]
7. **Imposto da novidade**: o Arc era "too different… for too little reward"; só 5,52 % usavam Spaces. Gastar a novidade em **um** mecanismo; o resto, familiar. [The Browser Company, 2025]
8. **Contraste medido com APCA, não WCAG 2**, porque perto do preto o WCAG aprova cinza ilegível; corpo ≥ Lc 75 (ideal 90), rótulos ≥ Lc 60, placeholder ≥ Lc 30. [APCA]
9. **Alvo ≥ 24 px na Estação, 48 px no celular e iPad.** [WCAG 2.5.8; PROMPT_AGENTICO]
10. **Tema segue o sistema**: só-escuro é exceção para mídia imersiva (a TV); a Estação precisa de claro. [NN/g 2020; Apple HIG Dark Mode]

## 2. Sete frentes, o que ficou provado

### 2.1 Apps futuristas 2026–2030

- **A Linear tirou cor.** Redesign de 2024: menos ruído, alinhamento, hierarquia; cor em LCH; tema inteiro nasce de três variáveis (base, acento, contraste). Em 2026 a sidebar ficou "a few notches dimmer" para o conteúdo mandar; princípios "Don't compete for attention you haven't earned" e "Structure should be felt not seen"; a paleta foi de azulada para **cinza quente, menos saturada**. [linear.app/now]
- **O pacote "linear design" virou genérico.** Escuro + degradê + vidro deixou "almost every SaaS website look the same"; a Raycast largou degradês. [LogRocket, 2025]
- **Raycast: profundidade só por escada de superfície**, "nenhuma sombra suspensa no sistema", hairlines de 1 px, teclas como keycap; a paleta é "agir sobre qualquer coisa". [DESIGN.md da Raycast; XDA 2026]
- **Warp: o terminal virou lista de blocos tipados** (comando, saída, plano, raciocínio, chamadas de ferramenta, diffs), blocos fechados imutáveis; "take agent work from 80 % to 100 %". É o mecanismo mais forte lido para um terminal com agentes. [warp.dev, 04/2026]
- **Cursor 2.0/3/3.1 e Zed**: painel de agentes com nome e status **já é padrão desde out/2025**; o raro ainda é o agente **provar** o que fez (print/preview) e a pessoa **apontar** na tela. "Seguir o agente" (Zed, Framer 3.0) convergiu como gesto. [cursor.com; zed.dev; Framer 3.0]
- **Apple visionOS e Liquid Glass**: "prefer subtle depth… it's easy to overdo"; "keep text flat"; vidro só na camada de navegação, "nunca vidro sobre vidro"; em 2026 a Apple pôs um controle de transparência por legibilidade; raios concêntricos como regra matemática. [WWDC23/25; CSS-Tricks; MacRumors 06/2026]
- **Teenage Engineering**: "quatro parâmetros sempre visíveis", "cada modo toma a tela", animação com significado (as bobinas giram), "honestidade brutalista com cuidado obsessivo". O modelo de futurista sem excesso. [jdsimcoe; Blake Crosley]
- **Nothing**: sem cor de acento; três vozes tipográficas (dot-matrix só para nomes, ultraleve editorial, mono para rótulos); a Glyph é "um filtro de atenção": "if everything is shiny, nothing is important". [shadcn.io/design/nothing; Carl Pei]
- **Humane e Rabbit r1**: interface "invisível" sem estado visível, sem lista e sem comparação falhou mesmo com hardware bonito; latência sem feedback mata confiança. [Digital Applied, 03/2026]
- **Sinais de "AI slop" 2026**: degradê roxo → ciano, texto em degradê, glassmorphism, halo radial, neon, ponto pulsante quando nada muda, easing elástico, cartões dentro de cartões. **A identidade atual do protótipo bate em cinco.** [impeccable.style/slop]

O que ninguém fez (desta frente): agentes de todos numa parede compartilhada com presença; as três colunas como um instrumento (arquivo → quem está com isto → bloco do agente, com o meio "seguindo"); terminal de blocos com desfazer, "o que consultei" e prova, em português para não-programadores; cor do conteúdo tingindo a moldura (Dia) aplicada a pessoa/projeto; TV espelho como periferia coletiva.

### 2.2 Ufologia e espaço com contenção

- **NASA Graphics Standards Manual (1975)**: a estética do espaço virou regra de sistema: "unity, technological precision"; proibido diluir o worm; patches de missão em espaço próprio, separados da marca. → O "b" pequeno em cima é o único sinal; selos e cores por pessoa em área própria. [standardsmanual.com]
- **Wow! signal (1977)**: intensidade como coluna de caracteres mono, um a cada 12 s (espaço = 0, dígitos, letras); o único destaque é a marca humana (o círculo do Ehman). → Memória da sala como 25 caracteres na barra, sem transcrever; a ideia salva ganha um círculo fino na cor da pessoa. [bigear.org]
- **Golden Record**: onboarding sem idioma; o círculo é a régua. → Primeira abertura em um passo com diagrama de traço único; o anel de foco e o de "pensando" são o mesmo círculo. [science.nasa.gov]
- **Arrival**: logogramas em anel de tinta, "decifráveis", um traço só. → Estado do agente = anel que se desenha (stroke-dashoffset, 1,2 s), fecha ao terminar, fica aberto e parado na falha com o próximo passo ao lado. [Nerdist]
- **Blade Runner 2049 (Territory)**: as interfaces da Wallace são "pure, minimal and geometric black and white" = poder; quanto mais poder, menos interface. → Estação no registro Wallace; zero glitch, scanline, grão. [territorystudio.com]
- **GMUNK, Oblivion**: grade de pontos como única textura, "keeping the Greeble under control". → Grade de 8 px só no palco da Máquina, no quadro e no vazio; no máximo 2 sinais vivos por tela. [gmunk.com]
- **Interstellar (Kieffer)**: telas "built to run live"; credibilidade vem de estar ligada a dado. → **Nada anima sem dado.** [chriskieffer.com]
- **Radar PPI**: o que vale não é o círculo verde, é a **persistência** (o rastro decai sozinho). → Indicador "ao vivo" de 12 px com varredura de 4 s e rastro; notificações nascem a 100 % e decaem a 0 % em 6 s sem botão. [Wikipedia PPI]
- **DSN Now**: antenas travadas em sondas, uplink/downlink e tempo de ida e volta. → Cada cartão da parede de terminais: ↑ pessoa, ↓ agente e a latência do último pedido; "Assumir" = segunda antena no mesmo alvo. [jasperbernaers.com sobre eyes.nasa.gov]
- **Arecibo (1974)**: bitmap em grade de primos (23 × 73). → Avatar de agente como bitmap 7 × 11 em SVG na cor do agente: distingue agente (bitmap) de pessoa (foto) à primeira vista. [Wikipedia]
- **Project Blue Book**: ficha de campos fixos, carimbo reto de estado, cronologia; a categoria honesta "não identificado". → Demanda como ficha (PARA · PRAZO · ESTIMA · PRIOR.), estado como carimbo de 1 px sem rotação; busca sem resultado: "Não identificado · 0 de 76". [archives.gov]
- **JWST**: cor como dado ordenado por comprimento de onda. → O degradê roxo → azul → ciano vira **escala de tempo**: ciano = agora, azul = hoje, roxo = antigo; nunca fundo de botão. [Science Focus]
- **Cosmic Latte `#FFF8E7`**: a luz média do universo é bege quente, não neon. → Texto de leitura (ata, nota, ideia) em Cosmic Latte a 88 %; UI em texto frio. Duas temperaturas: quente = humano, frio = sistema. [Wikipedia]
- **Pale Blue Dot**: "a bright speck within the sunbeam". → Meio vazio = um ponto de 3 px na cor da pessoa dentro de um feixe de 1 px a 4 %, em vez de marca-d'água. [science.nasa.gov]
- **CP 1919 / Unknown Pleasures**: pulsos empilhados com oclusão. → "Evolução da semana" na TV como 7 linhas, ≤ 120 px, sempre ao lado de um número. [Scientific American]
- **Breakthrough Listen, blc1**: sinal só é sinal se persiste com o telescópio no alvo e some fora dele. → A faixa "parece que saiu uma ideia" só aparece se o padrão persistir por 2 janelas de 12 s; "Cuidando da gente" só sinaliza o que persiste por dias. [Springer Nature]
- **ALMA**: 66 antenas "como um só telescópio". → Equipe como interferômetro: linhas de base só quando há correlação real agora (mesmo projeto, arquivo compartilhado, Entrar no terminal). [almaobservatory.org]
- **Where Is Webb**: linha graduada, passo concluído em miniatura, passo atual grande, alternador tempo | %, a "órbita" só na chegada. → Trilha de tarefas e campanhas; comemoração de 100 % = o anel se fecha, 800 ms, uma vez. [webb.nasa.gov]
- **Apollo DSKY**: verbo · substantivo; fileira de luzes apagadas por padrão. → Prompt com verbo e objeto sublinhados; barra de status como luzes apagadas: **nada aceso quando nada muda**. [Smithsonian]

Proibido (parque temático): radar verde em tela cheia, hexágonos, HUD com mira, scanlines, grão, glitch, partículas, estrelas cintilando, disco voador, coroa, letra "alienígena", Eurostile/Orbitron, sete segmentos, neon pulsando, ruído de rádio como som.

### 2.3 Reino, guildas e heráldica moderna

- **O Reino do Theus já tem heráldica sóbria codificada** (LP-Reino.html): sete títulos com metal + pedra (aço, bronze, prata, ouro `#f5c76a`, ametista `#8f3dff`), guilda = segmento, "a partir de Duque o título é conquistado", e um selo de cera que abre. → Herdar o vocabulário, não inventar outro: metais como tokens, o "selo que abre" como micro-momento (≤ 400 ms) quando a demanda recebe o OK.
- **Regra de tintura** (heráldica): metal sobre cor, nunca metal sobre metal; fimbriação de 1 px quando inevitável. → Vira token e regra de aceite: ouro e prata só sobre superfícies de cor; nunca ouro sobre o degradê. [Wikipedia]
- **Modern Heraldry (Counter-Print)**: sete famílias; heráldica sem história real vira "autenticidade emprestada". → Uma família só: **selo** (feito e conferido) e **laurel** (constância); nem escudo nem coroa. Todo selo ancorado num fato (demanda com OK, aprendizado registrado). [Creative Boom]
- **Chillon (Hymn)**: heráldica entra pelo **nome das cores** e pela textura da tipografia; uma silhueta-âncora fica. → Tokens com nomes do Reino (`--ametista`, `--aço`, `--bronze`, `--ouro`, `--prata`); o "b" como silhueta-âncora. [Abduzeedo]
- **Burberry** tirou o cavaleiro e a serifa em 2018 e trouxe de volta em 2023. → Não trocar a Cormorant por sans "para modernizar"; tipografia por papel. [Dezeen]
- **Dune (Territory)**: a Casa se reconhece pelo sistema (forma das letras, ritmo, luz), não por emblema estampado; Vermette: "Design for design cannot exist." → A "Casa Babel" se reconhece pelo traço dos ícones, pelo ritmo da mono e pela luz, sem brasão. [territorystudio.com; Pushing Pixels]
- **Duolingo**: ligas por materiais, ranking semanal com rebaixamento, "leaderboards aren't for everyone". **GitHub**: badges com 4 graus por metal, sem ranking; o experimento de 2016 provou que streaks puxam trabalho de fim de semana (ICSE 2021). **Strava Local Legends**: premia constância, esconde comparação, laurel. → No Perfil, duas prateleiras (Selos = fatos; Recordes pessoais = comigo mesmo), metal no aro, sem ranking, sem streak de dias corridos (só dias úteis, congela em folga, nunca aparece para os outros), laurel de constância opcional. [deconstructoroffun; blog.duolingo; github community; arxiv 2006.02371; Strava]
- **Discord**: a cor do cargo vence a da pessoa; degradê/holográfico "loud". → **Inverter**: a cor da pessoa sempre vence; papel é só um glifo de 12–16 px. [docs.discord.com]
- **Nubank Ultravioleta, Apple Card, Centurion**: luxo por subtração, metal fosco, o nível mais alto é o mais escuro. → Cartão de pessoa só com nome, sigilo e cor; o nível mais alto (pode mudar o app) em ametista fosca; ouro reservado a selo. [building.nu.com; Apple; Wikipedia]
- **Canela / GT Sectra / Cormorant**: serifa de display + grotesca de texto é a estrutura do luxo silencioso; Cormorant é display (some em 13 px), tem versaletes. → Cormorant SC ≥ 20 px, tracking +0,06 em, para nomes de guilda, título e selo; nunca em corpo. [Commercial Type; Grilli Type; GitHub Cormorant]
- **Ouro em UI**: `#D4AF37`-ish, ≤ 10 % da tela, 2–3 tons para metálico, AAA sobre escuro, falha sobre branco; dessaturar 20 pontos no escuro; cuidado com halation. → `--ouro #f5c76a`, `--ouro-fundo #a8741e`, `--ouro-luz #ffe9b0`; nunca em botão primário. [visily; atmos.style]
- **Figma não fixa a cor da pessoa; Boring Avatars é determinístico; Google Docs usa animal + cor.** → `--pessoa` escolhido uma vez e nunca reatribuído; sigilo determinístico monolinha (hash do nome) em SVG para 12–16 px. [forum.figma; boring-avatars; Google]
- **Modelo Spotify**: guilda = pertencimento voluntário e transversal; squad = projeto; chapter = papel. → Três camadas, três representações: cor (pessoa), glifo (guilda), ícone de cargo (papel). [Crisp, PDF]

### 2.4 Minimalismo para times de empresa

- **Densidade** = valor ÷ (tempo × espaço) (Ström, Tufte). Coluna densa e lenta é pouco densa. [mattstromawn.com]
- **Cloudscape (AWS)**: confortável por padrão, escala em múltiplos de 4, compacto por escolha global, nunca por componente. [cloudscape.design]
- **Stripe Dashboard**: hierarquia por tipografia e espaço, **cor reservada a estado**; 6 tamanhos; navegação por trabalho a fazer. → Cor semântica só ok/atenção/alarme/sem-dado; identidade só em superfícies de marca; pessoa só em avatar/chip/borda. [925studios]
- **Material dark theme**: base `#121212`, texto 87/60/38 %; cores saturadas "vibram" no escuro. `#060b16` é bem mais escuro e o ciano `#29ccec` é saturado: a combinação que vibra. → Considerar subir o chão da Estação; ciano/roxo só em áreas pequenas. [codelabs Google; APCA]
- **Apple HIG Tipografia**: mínimo 10 pt no Mac, 11 pt no iOS, 23 pt no tvOS; evitar pesos finos. Rótulos do protótipo a 10,5 px estão abaixo. → Piso 11 px na Estação, 14 no celular, 30 na TV. [HIG]
- **Cormorant é display** ("for a title page… not a printed novel"); par ideal é sans de baixo contraste. → Tríade com papéis: Cormorant = voz (≥ 24 px, Medium+), Plex = trabalho, JetBrains Mono = máquina; mono **só** em terminal, comandos, atalhos, versões, cronômetro, IDs. [bonfx; JetBrains]
- **Material 3 Expressive**: acha elementos até 4× mais rápido, preferido por 87 % dos jovens, mas "might not be suitable for… banking", e tirar rótulo derrubou usabilidade; o próprio Google indica o esquema calmo para utilitário. → Dois esquemas: `--mov-padrao` (100–200 ms, sem overshoot) em tudo; `--mov-heroi` só em três momentos (abertura, meta a 100 %, ideia salva). [design.google]
- **prefers-reduced-motion**: o base.css atual zera tudo a 0,01 ms, apagando feedback útil. → Tabela de equivalente estático por efeito (anel aberto/fechado, ponto fixo, último frame). [MDN; WCAG 2.3.3]
- **VS Code (regra oficial de notificações)**: uma por vez, só quando necessário, progresso no contexto; **NN/g**: indicador ≠ validação ≠ notificação. → Indicadores na esquerda, validações no meio, notificações só TV e celular, progresso do agente na coluna direita. [code.visualstudio.com; NN/g]
- **Notion, Craft, Things 3**: revelação progressiva; campos escondidos até o toque; "each animation is purposeful". → O editor começa "papel"; Meu dia como papel; os 46 textos de ajuda saem. [raw.studio; hackdesign; culturedcode]
- **Azul de startup**: 70 % das marcas SaaS; "keep an anchor, move the accent"; acento é pontuação, não parágrafo. → Um acento de identidade visível por tela. [Tentackles]

### 2.5 Geração de elementos por IA na Replicate (confirmado nas páginas e no schema pela API)

Preços lidos nas páginas hoje; confirmar no painel antes de cada lote.

| Trabalho | Modelo (slug confirmado) | Parâmetros que importam | Preço lido |
|---|---|---|---|
| Logo "b" em loop, fundo em loop | `wan-video/wan-2.7-i2v` | `first_frame`, `last_frame` (exige first), `seed`, `duration` 2–15, `resolution` 720p/1080p, `audio` (gera sozinho se ausente; descartar com `ffmpeg -an`) | US$ 0,10/s 720p · 0,15/s 1080p |
| Segunda opção de loop | `google/veo-3.1` | só 16:9/9:16 (não serve para logo quadrada), `generate_audio: false` corta o preço pela metade | US$ 0,40/s com áudio · 0,20/s sem |
| Rascunho de movimento | `bytedance/seedance-2.0-fast` · `wan-video/wan-2.2-i2v-fast` | seedance: `image` + `last_frame_image` (incompatível com refs), 480p/720p, `seed`; wan-fast cobra **por vídeo** | seedance 480p US$ 0,07/s · wan-fast US$ 0,05–0,145/vídeo |
| Ícones em SVG nativo | `recraft-ai/recraft-v4-svg` (pro: `-pro-svg`) | `prompt` até 10 000 caracteres, `size`, `aspect_ratio`; **sem seed nem style**: coerência da família por prompt idêntico numa leva | US$ 0,08/imagem · pro 0,30 |
| SVG com imagem de referência | `quiverai/arrow-1.1` (`arrow` sem sufixo é 404) | `references` até 4, `temperature`; devolve um .svg | US$ 0,20 |
| Keyframes e texturas | `google/nano-banana-2` | `image_input` até 14 refs, `aspect_ratio` (21:9 inclusive), `resolution` 1K/2K/4K, `output_format: png` (jpg destrói o preto) | 1K US$ 0,067 · 2K 0,101 · 4K 0,151 |
| Keyframe com seed | `black-forest-labs/flux-2-max` | `seed`, `input_images`, até 4 MP | (mediana lida ≈ US$ 0,0025 por segundo de GPU; conferir) |
| Remoção de fundo | `bria/remove-background` · `851-labs/background-remover` · `men1scus/birefnet` | `preserve_alpha` | US$ 0,018 · ~0,0004 · ~0,0014 |
| Upscale | `nightmareai/real-esrgan` · `topazlabs/image-upscale` | Topaz mostra dois preços na mesma página | US$ 0,002 · 0,05–0,08/MP |
| 3D leve ("b" volumétrico) | `firtoz/trellis` | `images[]`, `seed`, GLB, `texture_size` | ~US$ 0,035/run |
| Som de interface | `stability-ai/stable-audio-2.5` | `duration` obrigatório (padrão 190 s!), `seed`, `steps` 4–8 | US$ 0,20/arquivo |
| Leito em loop | `andreasjansson/musicgen-looper` | `bpm`, `max_duration` 2–20 s, `seed` | ~US$ 0,78/run |

Contrato da API (confirmado): `POST /v1/models/{owner}/{name}/predictions`; `Prefer: wait` só para SVG e imagem; vídeo assíncrono com `Cancel-After: 15m`; outputs em `replicate.delivery` **expiram em 1 h**; webhook `completed` + polling de reserva; Deployments só para centenas de chamadas e sempre com `min_instances` de volta a 0. Regras próprias que a pesquisa acrescentou: **primeiro = último quadro tende a gerar vídeo quase parado** → método em duas metades (clipe 1 livre; clipe 2 com first = último de 1 e last = primeiro de 1; concatenar); **logo neon sem alpha**: gerar sobre preto e compor com `mix-blend-mode: screen` no `#060b16`; **vídeo → Lottie não vetoriza** (é GIF disfarçado); ícones e microinterações em CSS/SVG (bundle zero), vídeo só para textura fotográfica e para o hero da logo; **orçamento total estimado para todos os elementos: US$ 12–17**.

### 2.6 Anterioridade do layout de 3 colunas e o mecanismo que ninguém usou

Corrente do mercado: **o agente está saindo da lateral** (Cursor 3 criou a Agents Window; Zed tem layout "agêntico"; pedidos de agente no centro). Manter direita = terminal exige que o meio seja visivelmente **bancada** e o terminal visivelmente **instrumento**; senão parece VS Code de 2024. Anterioridades lidas: Warp (blocos; Oz compartilha sessão), Devin (log unificado, "stop the session to take over"), Cascade (reverter até o passo), Replit Splits (regras fixas de onde cada coisa nasce), VS Code Agents Window, Claude Code desktop (detalhe escondido por padrão), Antigravity (Editor/Manager, feedback no artefato), Linear peek (segurar Espaço), Notion side peek, Arc ("horizontal space is premium"), visionOS (2 planos, "focus via dimming"), Looking Glass/BumpTop/Stage Manager (profundidade como ambiente **morreu** porque exige arrumar à mão), tldraw fairies e Figma (agente com corpo numa superfície só), Live Share (seguir e "focus participants"), JetBrains Universal Entry Point (contexto muda sugestões, não o painel), Ableton (Session/Arrangement com Tab), Bloomberg e salas de controle NASA/NORAD (tiles, cor com significado fixo, linha de visão comum).

Oito mecanismos com busca de anterioridade feita:

- **M1 · Terminal-instrumento**: o painel inteiro do agente (receitas, chips, cabeçalho) se remodela pelo objeto do meio; ninguém remodela o painel, só o campo, e só para código.
- **M2 · Arquivo que chega fisicamente** na tela da outra pessoa, com a mesma trajetória vista por quem mandou, como registro de "recebido de X".
- **M3 · Profundidade semântica**: o eixo z entre as colunas diz quem age (quem age vem 4 px à frente, o resto escurece 8 %); ninguém usa z para "o agente está agindo agora".
- **M4 · Sala de controle da equipe com telão físico**: 11 pessoas e seus agentes na mesma parede, a "frente da sala" é a TV sem botão.
- **M5 · Meio como bancada que morfa** por tipo de objeto (folha, palco + ficha, borda infinita, mesa), mantendo abas e status fixos; ninguém faz a superfície inteira mudar sozinha.
- **M6 · Agente como presença única** que atravessa árvore → meio → terminal enquanto a pessoa mantém o próprio lugar.
- **M7 · Peek transversal**: segurar Espaço num cartão de ação do agente mostra o antes/depois no meio sem abrir aba.
- **M8 · Duas vistas no eixo eu/nós** sobre o mesmo objeto (bancada/sala), com fluxo nos dois sentidos (arrastar + Tab = levar para a reunião).

Combinações inéditas: M1+M7, M3+M6, M4+M8, M2+M5. Guarda-corpos: todo morph automático e com atalho; forma só muda por ação da pessoa, nunca por evento externo; ≤ 300–400 ms; nunca bloquear digitação; reduced-motion corta.

### 2.7 A mistura sem forçar e o veredito sobre a identidade atual

Seis regras, com precedente:

- **R1 · Misturar gramáticas, não ícones.** Dune põe o feudal em escala, material e cerimônia, nunca em coroa. Reino = hierarquia tipográfica, ritual de entrada (o token como convocação), numeração "03" e barras "6/10".
- **R2 · Uma gramática dominante por camada, uma física por sistema.** Estação, TV, iPad e celular = a mesma Casa em escalas diferentes; um só chão.
- **R3 · Toda cor e todo efeito "vêm de algum lugar"** (Teenage Engineering: o laranja industrial diz "importante"; Rams 5 e 6).
- **R4 · Compartilhar valores antes de formas** (Apple × Braun copiou o método, não o objeto; Japandi funciona porque as tradições já convergiam). O denominador dos cinco temas do Theus: **ordem clara que abre espaço para o desconhecido.**
- **R5 · Um domina, os outros entram pequenos e cada um numa camada só.** Instrumento calmo domina; reino na tipografia e nos selos; ufologia no contato com os agentes (Arrival = linguagem; a direita é a "sala de contato"); futurismo na precisão e na latência mostrada; criatividade na Máquina e no quadro (brinquedo + instrumento, à TE).
- **R6 · Subtrair até restar o traço** (Arrival: "a wide and empty space… we pay more attention to the main characters"). O vazio bem dirigido é o efeito.

Pastiche (Jameson: "blank parody") e parque temático são notados por qualquer pessoa quando "os climas não convivem". Proibições: disco voador, alienígena, coroa, brasão, castelo, foguete, estrelas, glow permanente.

Veredito, peça a peça:

| Peça atual | Veredito | Motivo |
|---|---|---|
| Fundo `#060b16` | **Fica**, vira chão único (TV inclusa; hoje a TV tem `#090413`) | uma física por sistema (Dune, Aesop) |
| Degradê roxo → azul → ciano | **Evolui**: sai de texto, botão e fundo; vira luz (borda de projeção, traço ativo, cursor do agente) e escala de tempo (JWST) | tell nº 1 de "template de IA" |
| "b" neon pulsando | **Evolui**: SVG pequeno no topo; o brilho vira **medidor de estado** (acende só quando a sala grava, o agente age ou há projeção) | Rams 5/6; Nothing (filtro de atenção); regra do próprio IDEIAS ("nada pisca") |
| Cormorant Garamond | **Fica** com regra: só ≥ 24 px, só o que é humano/cerimonial (saudação, pergunta, ideia falada, ata, nome de guilda em versaletes) | display type; Burberry |
| IBM Plex Sans | **Fica** (menos gasta que Inter/Geist); avaliar depois | voz corporativa de outra empresa, não urgente |
| JetBrains Mono | **Fica** e ganha papel: só instrumento (terminal, números, latência, versões) | TE: mono = precisão |
| Logo PNG 204 KB | **Sai**; vira SVG | regra do próprio Theus |
| Vidro, halo radial, cartão dentro de cartão, ponto pulsante permanente | **Saem** | impeccable; Apple 2026 |

## 3. Os quatro conceitos e as notas dos juízes

Quatro agentes conceberam, cada um por um ângulo, com a pesquisa inteira na mão. Três juízes independentes (um empresário exigente, um diretor de arte de produto, um engenheiro de front-end) pontuaram de 0 a 10 em seis critérios: minimalismo sem excesso, credibilidade empresarial, novidade real, mistura sem forçar, viabilidade em HTML/CSS/JS + Replicate, preservação de tudo o que foi pedido. Notas completas em `.deus/missao-design/pesquisa/conceito-*.md` e nos resultados do workflow.

| Conceito (ângulo) | Mecanismo novo | Juiz 1 | Juiz 2 | Juiz 3 | Soma |
|---|---|---|---|---|---|
| **Observatório · Meia-vida** (silêncio) | Toda peça da casca carrega o instante do último evento real; luz = 2^(−idade/meia-vida) em três escalas (6 s · 5 min · expediente); o degradê roxo → azul → ciano vira eixo do tempo; um evento acende os três lugares que tocou; nada aceso quando nada mudou | 43 | **47** | 43,5 | **133,5** |
| **VISADA · Catálogo, Campo e Mesa** (instrumento) | Uma linha de 1 px da Mesa (terminal) ao objeto travado; o Mostrador de 56 px lê o objeto: nome, quem está com ele, ↑/↓ e tempo de ida e volta, anel de estado do agente; receitas re-sintonizam ao objeto | **45** | 44 | 43 | 132 |
| **Lacre · a corte silenciosa** (corte) | O anel de 16 px com o sigilo da pessoa é ao mesmo tempo autoria e consentimento: ABERTO · LACRADO por Carla 14:32 · ROMPIDO por Davi 15:10, o mesmo objeto nas três colunas | 40 | 43 | **45** | 128 |
| **Bancada Viva · Trilho** (bancada) | O meio toma a forma da peça; peças andam por um trilho visível entre colunas; EMPURRAR (terminal → bancada), PUXAR (seleção → ❯ vira chip com verbos), APONTAR (rolar o histórico contorna a peça); Junta de espera | 37 | 40 | 37 | 114 |

O que cada juiz mandou roubar: o **Mostrador** com ↑/↓ e ida e volta (de VISADA, os três juízes); os **três estados do lacre** como trilha de consentimento sem o "segurar 400 ms" (de Lacre, juízes 2 e 3); o **PUXAR** e a **Junta** (de Bancada, os três). O que mandaram cortar: a visada tracejada do agente por cima do texto; o catálogo de 12 metáforas de ufologia ("cada uma é discreta, mas a soma vira museu"); guildas e vocabulário de corte (Chancelaria, Conselho) num app de empresa; o hold de 400 ms no OK; a bancada que morfa a cada tipo e o arquivo que voa ("em jornada de 8 h isso é enfeite"); repouso em Lc 60 e ações só no hover ("para quem paga, parece tela apagada").

Decisão de método: o vencedor por soma é o Meia-vida, o conceito que **nasce do DNA que já existe** (o degradê vira tempo) em vez de importar um mecanismo de fora, com custo quase zero (um atributo `data-t`, um `requestAnimationFrame` a 4 Hz, `color-mix` em oklch). A síntese parte dele e enxerta o Mostrador, os três estados do lacre e o PUXAR; depois quatro críticos adversariais (excesso, pastiche, empresário sério, viabilidade) tentam derrubar, e a revisão fecha. O resultado está em `docs/design/CONCEITO.md`.

**Fechamento (23/09/2026, fim da tarde):** os quatro críticos refutaram a síntese v1 sem tocar na espinha; a v2 (`docs/design/CONCEITO.md` §12 e `.deus/missao-design/pesquisa/conceito-final-v2.md`) cortou 19 traços de excesso (linha sólida da trava, Apontar, crossfade de aba, disco do cronômetro, coluna Wow! no rodapé, ponto pálido, loop da logo, campo profundo, loop da TV, seis sons, metais do Reino, bitmap na casca, ↑/↓ de latência…), fixou a lista de termos proibidos na interface (a equipe lê Arquivos · Trabalho · Agentes, nunca Catálogo · Campo · Mesa), pôs o tema claro e a densidade confortável no escopo da v1 e reduziu a ufologia nomeada a duas peças (o anel de estado e a coluna de intensidade da TV). O kit de IA caiu de US$ 11 para ≈ US$ 6–10 (`docs/design/GERACAO_REPLICATE.md`). Os demais entregáveis: `docs/design/tokens.css`, `MAQUINA_PECAS.md`, `SUPABASE_PECAS.md`, `TELA_CONSTRUTOR.md` e o painel `docs/design/painel.html`.

## 3b. Onde a pesquisa aponta, antes dos juízes

Sem antecipar o conceito (que sai de 4 propostas, 3 juízes, síntese e 4 críticos), as convergências entre as sete frentes:

1. **Escada de luminância nas três colunas** (Linear 2026 + visionOS): laterais um degrau mais escuras que o meio; o meio pode ser claro (papel) com as laterais escuras (máquina), o que também resolve o "tema segue o sistema".
2. **Terminal de blocos tipados em português** (Warp) com desfazer, "o que consultei" e prova; estado do agente como anel de traço único (Arrival) que vira "parar".
3. **Barra de status como luzes apagadas** (DSKY): nada aceso quando nada muda; presença · caixa · cronômetro · sala como os "quatro parâmetros sempre visíveis" (TE).
4. **Cor por pessoa fixa por contrato**, derivada em LCH com luminância fixa; papel como glifo; o degradê como escala de tempo.
5. **Selo que abre** (do Reino) no OK da demanda; selos e laurel no Perfil, sem ranking; metais do Reino como tokens; regra de tintura como aceite.
6. **Um mecanismo novo, o resto familiar** (imposto da novidade do Arc): a novidade concentrada em M5 + M1 + M6 (bancada que morfa, terminal-instrumento, presença que atravessa).
7. **Geração por IA só onde é textura ou marca**: logo em loop (Wan 2.7, duas metades, screen sobre o chão), família de ícones em SVG nativo numa leva, bitmaps de agente, som com seed; tudo o mais em CSS/SVG à mão, custo total US$ 12–17.

## 4. Fontes principais (as 200+ estão nos arquivos de notas)

Linear (how-we-redesigned, behind-the-latest-design-refresh) · LogRocket "linear design" · Raycast DESIGN.md · Warp block model · Cursor changelogs 2.0/3.0/3.1 · Zed agent panel · The Browser Company (letter to Arc members; Dia strategy) · Apple WWDC23 spatial principles, WWDC25 Liquid Glass, HIG Motion/Typography/Dark Mode · CSS-Tricks Liquid Glass · Figma UI3 · Framer 3.0 · Teenage Engineering (jdsimcoe, Blake Crosley, SFMOMA) · Nothing (shadcn design, Carl Pei) · Digital Applied (Humane/Rabbit) · Notion Calendar (Crosley) · Calm Tech Institute · DMEXCO Zero UI · impeccable.style/slop · NASA Graphics Standards Manual · bigear.org Wow! · Golden Record · Territory Studio (BR2049, Dune Part Two) · Nerdist (Arrival) · GMUNK Oblivion · Chris Kieffer (Interstellar) · Ash Thorp (Ender's Game) · Wikipedia PPI, Arecibo, Ghost rockets, Cosmic latte, Rule of tincture · archives.gov Blue Book · Science Focus JWST · Scientific American CP 1919 · Springer blc1 · ALMA · Where Is Webb · Smithsonian DSKY · LP-Reino.html · Creative Boom Modern Heraldry · Abduzeedo Chillon · Dezeen Burberry · Pushing Pixels (Vermette) · Duolingo · GitHub Achievements · arXiv 2006.02371 · Strava · Discord docs · Nubank Ultravioleta · Commercial Type Canela · Grilli GT Sectra · visily gold · atmos dark mode · boring-avatars · Spotify model (Crisp) · Vitsœ Rams · NN/g (heurísticas, minimalismo, aesthetic-usability, dark mode, notifications) · Ström UI density · Cloudscape · Stripe breakdown · Material dark theme · APCA · Vercel Geist · JetBrains Mono · Superhuman · VS Code UX guidelines · Replicate (páginas dos modelos, docs de predictions, webhooks, deployments, billing) · Jake Archibald (vídeo com alpha) · MDN blend modes · ffmpeg.party (loop) · Devin docs · Replit Splits · Claude Code desktop · Antigravity · Linear peek · Notion side peek · visionOS guide · Looking Glass, BumpTop · tldraw fairies · Live Share · JetBrains Universal Entry Point · Ableton (SOS) · Bloomberg (Curio) · salas de controle (Sustema).
