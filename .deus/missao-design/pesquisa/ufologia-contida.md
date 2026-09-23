# Frente: ufologia e espaço com contenção

> Missão `babel-coop/design-2030` · 2026-09-23 · notas completas da frente "ufologia-contida".
> Regra de leitura: cada achado tem a URL **efetivamente lida** nesta sessão (WebFetch). Onde a fonte primária não abriu, está dito qual substituta foi usada. Onde não sei, está escrito "não sei".
> Pergunta da frente: o que da linguagem visual da ufologia e da observação do espaço vira **elemento de interface discreto** no Babel Coop (Estação esquerda/meio/direita, TV espelho, iPad, celular), sem virar parque temático.

## 0. Material obrigatório lido antes (o que ele impõe a esta frente)

- `PROMPT_AGENTICO_LP.md` e `BRIEFING_IA.md`: keyframe antes de vídeo; SVG nativo para ícones (`recraft-ai/recraft-v4-svg`), leva única com mesmo prompt de estilo; seed fixa por sequência; loop com `last_frame = first_frame`; outputs da Replicate expiram em 1 h (baixar na hora); orçamento é limite duro (US$ 20 nesta missão, parar em 80 %); `prefers-reduced-motion` desliga todo laço; **"um efeito só entra se for metáfora do serviço"**; máximo 2 efeitos simultâneos na mesma dobra; "anime o traço, não a caixa" (`stroke-dasharray`/`stroke-dashoffset`, `currentColor`).
- `docs/UX_PENEIRA.md`: interface calma; um lugar por coisa; barra de status **fica com o que muda**; saem as logos grandes do meio e do terminal (fica só a pequena em cima); estado do agente "pensando" hoje é um ponto pequeno demais; falta "parar", "o que consultei" e próximo passo na falha.
- `docs/FUNCOES.md`: nada sai. Os candidatos naturais a receber um traço desta frente: presença · terminal ao vivo (parede, Entrar/Assumir/Devolver) · estado do agente · cronômetro da demanda · memória da sala (5 min) e gravação · projeção na TV (luz de borda) · metas e campanhas (placar, 100 %) · tarefas com fluxo (trilha) · mapa da equipe · Equipe (carga, cuidado) · paleta `Ctrl K` e comandos `coop <verbo> <objeto>` · meio vazio "Nada aberto · Ctrl K" · versões · acervo (busca sem resultado).
- `prototipo/base.css` e `v3.css`: fundo `#060b16`, acento `#8670ff`, ciano `#29ccec`, degradê roxo → azul → ciano, Cormorant Garamond (fala) + IBM Plex Sans (UI) + JetBrains Mono (instrumento); já existem `pulsa` (estado pensando), `anda` (fio vivo tracejado), grade de 24 px no palco da Máquina, luz de borda roxa na projeção.

Consequência: quase tudo desta frente é **CSS/SVG à mão, custo zero**. A Replicate entra só onde um traço precisa de imagem (logo animada, um fundo estático de espaço profundo) e sempre pelas regras acima.

---

## 1. Achados (cada um com o traço mínimo)

### A1. NASA Graphics Standards Manual (1975): "unidade, precisão técnica, impulso e orientação para o futuro"

- **Fato.** Richard Danne e Bruce Blackburn, dentro do Federal Design Improvement Program, escreveram um manual em fichário que padroniza logotipo ("worm"), tipografia, grades e aplicações "de papel timbrado a veículos, uniformes e espaçonaves". A frase de missão do manual: "a feeling of unity, technological precision, thrust and orientation toward the future". Helvetica como tipo principal; "sleek, spare standardization"; "all efforts to dilute or distract from the simplicity of the 'worm' were strictly prohibited"; publicações educativas podiam ser mais livres, mas sem "pretentious frills"; os *mission patches* deviam "occupy their own visual space, separated from official NASA identification". O worm foi aposentado em 1992.
- **Fontes lidas.** https://wearethemutants.com/2020/01/09/unity-precision-thrust-the-nasa-graphics-standards-manual-1975/ · https://standardsmanual.com/products/nasa-graphics-standards-manual
- **Por que importa.** É o único caso em que a estética do espaço foi escrita como *regra de contenção* para uma organização. É o vocabulário que um empresário respeita: sistema, não fantasia.
- **Traço mínimo.** Uma regra, não um desenho: **o "b" pequeno em cima é o único sinal de marca; nada compete com ele** (a peneira já tirou as duas logos grandes). Espaços de "patch" (selos de gamificação do perfil, cores por pessoa) ficam em área própria, nunca ao lado da marca. Tipografia neutra: Plex Sans faz o papel da Helvetica; nenhum tipo "futurista".
- **Aplicação.** Cabeçalho da Estação: logo 16–20 px, sem neon pulsando (o neon fica estático, identidade [Theus]); selos de perfil e cores por pessoa em coluna própria. Documentar como regra em `tokens.css` (uma classe `.marca` e proibição de segunda marca por tela).

### A2. Wow! signal (1977): intensidade escrita como coluna de caracteres, 12 s por amostra

- **Fato.** Big Ear (Ohio State), 15/08/1977, 72 s, ~1420,4556 MHz (linha do hidrogênio). O impresso mostra, em cada uma das 50 colunas (canais de 10 kHz), a intensidade em intervalos de 12 s, codificada para caber no papel: espaço = 0, `1`–`9`, depois `A` = 10,0–10,999 … `Z` = 35. "6EQUJ5" é a subida e descida do sinal (6 → 14 → 26 → 30 → 19 → 5 desvios-padrão), com a forma exata do feixe da antena (correlação > 0,99). Ehman circulou em vermelho e escreveu "Wow!". Nunca se repetiu.
- **Fontes lidas.** https://bigear.org/6equj5.htm · https://en.wikipedia.org/wiki/Wow!_signal
- **Por que importa.** É o exemplo mais forte de **sinal como texto**: uma coluna de caracteres monoespaçados carrega intensidade e tempo sem gráfico, sem cor. E a marca humana (círculo em vermelho, uma palavra) é o único destaque.
- **Traço mínimo.** **Memória da sala (5 min) = 25 caracteres, um a cada 12 s**, em JetBrains Mono, na barra de status: `·····3···7E····` — espaço quando há silêncio, dígito/letra quando há fala (intensidade do áudio, sem transcrever). Ao apertar "Salvar ideia falada", o trecho escolhido ganha um **círculo fino de uma cor só** (a cor da pessoa) — a marca do Ehman. Nada mais.
- **Aplicação.** Substitui o selo "◌ memória da sala" genérico por um indicador que mostra *que há memória e quanta*. Na TV, a mesma coluna, maior, sem círculo. Custo: CSS + JS, zero IA. `prefers-reduced-motion`: a coluna atualiza sem transição.

### A3. Voyager Golden Record: instruções sem idioma, unidade de tempo fundamental

- **Fato.** A capa explica o disco sem palavras: o desenho do disco e da agulha na posição de início ("from the outside in"); em binário, o tempo de uma rotação, "3.6 seconds, expressed in time units of 0.70 billionths of a second", unidade que vem "da transição fundamental do átomo de hidrogênio"; como montar a imagem (512 linhas verticais) e um círculo na primeira imagem para conferir a proporção; o mapa de 14 pulsares com seus períodos; o átomo de hidrogênio em dois estados com o dígito 1 marcando "the fundamental time scale".
- **Fonte lida.** https://science.nasa.gov/mission/voyager/golden-record-cover/ (a URL antiga do JPL redireciona para "missing").
- **Por que importa.** É o padrão de **onboarding sem texto**: um diagrama por instrução, uma unidade que se prova sozinha (o círculo de calibração), e tudo gravado em uma cor (metal).
- **Traço mínimo.** (a) **Primeira abertura = um passo, não uma página** (a peneira pede isso): uma linha e um diagrama de traço único mostrando esquerda/meio/direita. (b) **Círculo de calibração**: o anel de foco (`:focus-visible`) e o anel de "pensando" do agente são o mesmo círculo, mesma espessura, em todo o app — o círculo é a régua. (c) **Unidade de tempo**: todos os cronômetros do app contam na mesma base visível (segundos em mono tabular), sem "há 3 min" em um lugar e "00:03:12" em outro.
- **Aplicação.** Onboarding do token (`babel-…`, 3 passos): três diagramas de traço único em SVG, gerados numa leva só pelo `recraft-v4-svg` (ou desenhados à mão, se o traço bater). Cronômetro da demanda, cronômetro na TV, memória da sala e "tempo de ida e volta" do agente (A12) usam o mesmo formato numérico.

### A4. Mapa de pulsares (Pioneer/Voyager): linhas radiais cujo comprimento e traço codificam distância e período

- **Fato.** O canto inferior esquerdo da capa "shows the location of the solar system with respect to 14 pulsars, whose precise periods are given" — cada linha sai do centro (o Sol), o comprimento é a distância relativa e o período vai em binário ao longo da linha. É um mapa que diz *onde* e *quando* sem eixo, sem legenda.
- **Fonte lida.** https://science.nasa.gov/mission/voyager/golden-record-cover/
- **Por que importa.** O Babel Coop tem um "Mapa da equipe" (grafo de quem passa o quê, com pulso quando uma tarefa passa) que a peneira sugere encolher para dentro de Equipe. O mapa de pulsares é a forma mais contida possível de um grafo centrado na pessoa.
- **Traço mínimo.** **Mapa da equipe como estrela de linhas radiais**: eu no centro; uma linha fina por pessoa; comprimento = tempo desde a última troca comigo (curto = recente); marcas ao longo da linha = trocas (demandas, arquivos recebidos) como traços binários. Sem foto, sem bolha, sem seta; uma cor só (a da pessoa) no ponto da extremidade.
- **Aplicação.** Aba "Mapa" dentro de Equipe e no Perfil ("linha do tempo" vira radial). SVG à mão; o "pulso quando uma tarefa passa" é um traço que anda pela linha (`stroke-dashoffset`), 600 ms, sem brilho.

### A5. Territory Studio, *Blade Runner 2049*: "pequeno e sutil"; o poder é preto e branco geométrico

- **Fato.** Villeneuve "asked us to imagine a world where digital technology no longer exists and therefore conceive a new kind of tech. One that is more physical, organic and grounded". O estúdio experimentou "optical lenses, cine projectors, microfiche, card systems"; o scanner de base é macrofotografia de polpa de toranja; o Denabase é um arquivo mecânico de DNA. E a contraposição: as interfaces da Wallace Corp são "pure, minimal and geometric black and white user interfaces" representando riqueza e superioridade técnica. Mais de 100 assets em 15 sets.
- **Fonte lida.** https://territorystudio.com/project/blade-runner-2049/ (a matéria do Design Week com a frase "small and subtle" respondeu 403; a frase está só no resumo de busca, não a trato como lida).
- **Por que importa.** Dá a regra de registro: no filme, **quanto mais poder, menos interface**. Para um público de empresários, a Estação deve ficar no registro Wallace (geométrico, quase monocromático), nunca no registro degradado/glitch.
- **Traço mínimo.** **Zero glitch, zero scanline, zero ruído.** A projeção na TV ganha o único "físico" permitido: a luz de borda da projeção (já existe, roxa) vira a luz de um projetor de cinema — um gradiente fino nas quatro bordas, estático, que some quando a projeção termina.
- **Aplicação.** Regra em `tokens.css`: nenhuma textura, nenhum filtro `noise`, nenhuma animação de "interferência". A TV espelho sem botão já é a versão Wallace de uma TV.

### A6. *Arrival*: o logograma é um círculo de tinta, feito à mão, com incerteza deliberada

- **Fato.** Patrice Vermette e Martine Bertrand criaram "a bank of 100 symbols"; a direção era manter os símbolos "decipherable and look good"; Stephen e Christopher Wolfram analisaram os desenhos e "quickly identified 12 'interesting looking' sections that could be the basis for the language"; Vermette: "We wanted to ground the symbols in something that makes sense, in reality. It would be too easy otherwise."
- **Fonte lida.** https://archive.nerdist.com/arrival-logograms-science-nerdery-creation/ (a entrevista do filmdoctor.co.uk não resolveu DNS).
- **Por que importa.** É o único "alienígena" do cinema recente que um empresário respeita, porque é caligrafia, não efeito. E é um traço só: um anel.
- **Traço mínimo.** **Estado "pensando" do agente = um anel sendo desenhado por um traço único** (`stroke-dasharray` + `stroke-dashoffset`, 1,2 s, `ease-in-out`), 14–16 px, na cor do agente; ao terminar, o anel fecha e para; em falha, o anel fica aberto (a "incerteza") e ao lado aparece o próximo passo. Resolve o item (c) da peneira (estado pequeno demais) sem aumentar o ponto: troca ponto por anel.
- **Aplicação.** Aba do agente no terminal, cartão do agente na parede de terminais, chip do agente em Projetos. Mesmo anel para "Ver o agente montando" na Máquina. Sem IA: SVG inline. `prefers-reduced-motion`: anel estático aberto = pensando, fechado = parado.

### A7. GMUNK, *Oblivion*: grade de pontos, paleta unificada que funciona em fundo claro e escuro, "greeble sob controle"

- **Fato.** O briefing pedia "functionality and minimalism while utilizing a bright, unified color palette that would appear equally well on both a dark or bright backdrop"; os elementos foram pendurados em uma grade de pontos; a mesa de luz foi construída fisicamente e "most of the visuals were captured in-camera"; em tudo, "stressed functionality over excess, keeping the Greeble under control and communicating key story points".
- **Fonte lida.** https://gmunk.com/OBLIVION-GFX
- **Por que importa.** "Greeble" (detalhe decorativo sem função) é exatamente o que a peneira identificou como [LLM]. E a exigência de paleta que vale no claro e no escuro é o que a TV precisa (tema claro para visita).
- **Traço mínimo.** **Uma grade de pontos de 8 px como única textura do app**, visível só no palco da Máquina, no quadro e no meio vazio (já existe a 24 px na Máquina; unificar). **Orçamento de greeble: no máximo 2 sinais vivos por tela** (o mesmo teto de "2 efeitos por dobra" do PROMPT_AGENTICO).
- **Aplicação.** `tokens.css`: `--grade: 8px`, `--pontos: rgba(255,255,255,.025)`. Tema claro da TV (visita) usa a mesma paleta de acento; só o fundo troca.

### A8. *Interstellar* (Chris Kieffer): mais de 80 telas rodando ao vivo, na câmera, "funcionais e críveis"

- **Fato.** Ranger com mais de 24 telas integradas, Lander com mais de 15, Endurance com mais de 40; todas "built to run live and interactively in-camera, allowing actors to engage directly with interfaces in real time"; a linguagem visual buscou um "near-future rooted in science"; as telas de TARS eram iPads trocáveis sem atrapalhar o boneco.
- **Fonte lida.** https://www.chriskieffer.com/work/interstellar
- **Por que importa.** A credibilidade das telas vem de **estarem ligadas a dado real**, não da estética. É a regra que separa instrumento de enfeite.
- **Traço mínimo.** **Nada anima sem dado.** Todo movimento na Estação e na TV é resposta a um evento (mensagem chegou, cronômetro correu, alguém entrou). Nenhum laço ornamental (nem estrelas, nem partículas, nem "respiração" de fundo).
- **Aplicação.** Critério de aceite do painel: listar cada animação e o evento que a dispara; sem evento, sai. O iPad como "a cara do TARS": só o quadro, sem cromo (já é assim).

### A9. Ash Thorp, *Ender's Game*: "se a fonte não funciona, nada funciona"; NeXT e Dieter Rams como referência

- **Fato.** Thorp partiu do NeXT OS pela "clean, simple, beta-like quality" e cita Dieter Rams para "properly portray some of the more complex elements of the film in its simplest form". "If the font doesn't work, then nothing does." Propôs mais de 40 famílias e escolheu "a clean, modern, structured base font" para o registro militar e "more utilitarian fonts for the civilian world".
- **Fonte lida.** https://www.artofvfx.com/enders-game-ash-thorp-creative-director/
- **Por que importa.** Confirma que o "futurismo" de um HUD sério é tipografia com registro, não forma.
- **Traço mínimo.** **Três registros tipográficos, por natureza do conteúdo, não por tela**: Cormorant Garamond = fala humana (ideia falada, ata, pergunta da semana, sonho); IBM Plex Sans = sistema (rótulos, botões, árvore); JetBrains Mono = instrumento (números, cronômetros, sinais, prompt, tokens). Nunca um tipo "espacial" (Eurostile, Orbitron, etc.).
- **Aplicação.** Já são as fontes da identidade; o que muda é a regra de uso, escrita em `tokens.css` como `--fonte-fala`, `--fonte-ui`, `--fonte-instrumento`, e a proibição de misturar registros na mesma linha.

### A10. Radar PPI: varredura radial em sincronia com a antena e fósforo de longa persistência

- **Fato.** "As the radar antenna rotates, a radial trace on the PPI sweeps in unison with it about the center point"; o radar fica no centro, a distância em anéis concêntricos; norte para cima em instalações fixas; tubos de armazenamento guardavam a imagem "for milliseconds to minutes and even hours", deixando o operador ver o histórico do alvo durante cada rotação. Primeiro PPI de produção: TRE (Reino Unido), radar H2S.
- **Fonte lida.** https://en.wikipedia.org/wiki/Plan_position_indicator
- **Por que importa.** O radar é o clichê nº 1 da ufologia em interface. O que vale dele não é o círculo verde: é a **persistência** (o que aconteceu continua visível por um tempo, depois some sozinho).
- **Traço mínimo.** **Indicador "ao vivo" de 12 px**: um ponto com um traço radial que dá uma volta a cada 4 s (a rotação de uma antena marítima) e deixa um rastro que decai em uma volta. Só onde há transmissão de verdade: "● terminal ao vivo", "TV conectada", "X está no seu terminal". Nunca em tela cheia, nunca verde-fósforo: na cor do acento.
- **Aplicação.** Barra de status (item "terminal ao vivo" vai para o cabeçalho do terminal, como a peneira pede) e cartões da parede de terminais. CSS `conic-gradient` animado; `prefers-reduced-motion`: ponto fixo.

### A11. Fósforo que decai = presença que envelhece (regra derivada de A10)

- **Fato.** Ver A10: a persistência mantinha "target history" visível e a deixava sumir sozinha.
- **Fonte lida.** https://en.wikipedia.org/wiki/Plan_position_indicator
- **Por que importa.** A peneira pede que a barra de status "fique com o que muda" e que avisos "apareçam só ao salvar". Persistência é o mecanismo: aparece forte, esmaece, some.
- **Traço mínimo.** **Toda notificação passageira ("Salvo na equipe", "recebido de X", "Atualizar vN") nasce a 100 % e decai a 0 % em 6 s, sem botão de fechar.** Presença: ponto cheio = agora; ponto a 50 % = últimos 5 min; contorno = hoje.
- **Aplicação.** `--persistencia: 6s`; um único `@keyframes decai`. Coluna de novidades (sino) guarda o histórico; a barra só mostra o que ainda "brilha".

### A12. DSN Now (NASA/JPL): quem fala com quem, uplink/downlink e tempo de ida e volta, a cada 5 s

- **Fato.** O painel mostra "which dish is currently locked onto which spacecraft, what frequency is being used, the data rate, the uplink power level, and the round-trip light-time"; "Uplink (orange) means the antenna is transmitting commands or data TO a spacecraft. Downlink (green) means it is receiving data FROM a spacecraft"; três complexos a ~120° (Goldstone, Madrid, Canberra), uma antena de 70 m em cada; taxas de ~160 bps (Voyager) a 28 Mbps (JWST); atualização a cada ~5 s.
- **Fonte lida.** https://jasperbernaers.com/deep-space-comms/ (descrição secundária do app https://eyes.nasa.gov/apps/dsn-now/, que é uma aplicação JS e não pôde ser lida como texto — não afirmo nada além do que a descrição diz).
- **Por que importa.** É uma interface real de "terminais ao vivo": antenas (pessoas) travadas em sondas (agentes), com direção do fluxo e latência. A parede de terminais do Babel Coop é exatamente isso.
- **Traço mínimo.** **Cada cartão da parede de terminais mostra duas setas finas e um número**: `↑` quando a pessoa está mandando (digitando) e `↓` quando o agente devolve; o número é o **tempo de ida e volta** do último pedido (ex.: `2,4 s`). "Assumir" = uma segunda antena trava no mesmo alvo: o cartão mostra duas iniciais lado a lado, nada mais.
- **Aplicação.** Parede de terminais, selo "X está no seu terminal" no rodapé, e o cabeçalho do terminal da própria pessoa. Dado real (timestamp do pedido e da resposta). Sem IA.

### A13. Mensagem de Arecibo (1974): 1 679 bits = 23 × 73, enviada uma vez, em menos de 3 minutos

- **Fato.** "73 rows by 23 columns" (produto de dois primos, para que a grade se descubra sozinha); sete partes: números 1–10, números atômicos de H, C, N, O, P, nucleotídeos, DNA, figura humana com altura e população, sistema solar com a Terra destacada, o telescópio com o diâmetro; 2 380 MHz, deslocamento de 10 Hz, 450 kW, menos de três minutos, rumo a M13; "meant more as a demonstration of human technological achievement than a serious attempt to enter into a conversation".
- **Fonte lida.** https://en.wikipedia.org/wiki/Arecibo_message
- **Por que importa.** É a prova de que um **bitmap em grade de primos** comunica identidade com quase nada, e que uma marca pode ser "enviada uma vez" (o token de convite).
- **Traço mínimo.** **Avatar de agente ("foto de letra") como bitmap 7 × 11** (primos), gerado em SVG de retângulos, na cor do agente; distingue à primeira vista o agente (bitmap) da pessoa (foto). E o **token `babel-…`** aparece com a mesma grade como marca d'água de 1 linha ("enviado uma vez").
- **Aplicação.** Abas de agentes no terminal, chips em Projetos, parede de terminais. Família de bitmaps gerada numa leva única (à mão ou `recraft-v4-svg` com prompt de estilo fixo e seed fixa, custo < US$ 1). Nunca para ícones de ação (esses são traço, A6/A9).

### A14. Project Blue Book: fichas padronizadas, cronologia, e o estado "não identificado" como categoria honesta

- **Fato.** 1947–1969; "a total of 12,618 sightings were reported to Project BLUE BOOK. Of these 701 remain 'Unidentified.'"; 94 rolos de microfilme (T-1206), "37 cubic feet of case files in which individual sightings are arranged chronologically", índice "by date and location". Nos papéis pessoais dos oficiais (Black Vault): tudo datilografado, letterhead de Wright-Patterson, carimbo "ALL UNCLASSIFIED", e formulários fixos: "AFR 80-17, AFR 200-2 Reporting Form" e "Sighting of Unidentified Phenomena Questionnaire" (ago/1967).
- **Fontes lidas.** https://www.archives.gov/research/military/air-force/ufos · https://www.theblackvault.com/casefiles/desks-project-blue-book/
- **Por que importa.** A tipografia de documento desclassificado é **ficha de campos fixos + carimbo de estado + ordem cronológica**. Uma demanda no Babel Coop é uma ficha (título, para quem, prazo, estimativa, prioridade, projeto). E "não identificado" é o estado que falta nas buscas: dizer que não se sabe, com número.
- **Traço mínimo.** (a) **Demanda como ficha**: rótulos em mono caixa-alta pequena à esquerda (`PARA` · `PRAZO` · `ESTIMA` · `PRIOR.`), valores em Plex; **estado como carimbo reto** (retângulo de 1 px, texto mono: `LIVRE` · `EM CURSO` · `PAUSADA` · `PRONTA` · `OK`), sem rotação, sem vermelho de "top secret". (b) **Busca sem resultado no acervo: "Não identificado · 0 de 76"**, em vez de vazio mudo. (c) Versões e linha do tempo do perfil sempre em ordem cronológica com data à esquerda.
- **Aplicação.** Trabalho (Demandas + Tarefas), Acervo, Perfil, Versões. Zero IA.

### A15. Foguetes-fantasma da Escandinávia (1946): silenciosos, sem rastro, e os arquivos abertos em 1984

- **Fato.** "About 2,000 sightings were logged between May and December 1946", "Two hundred sightings were verified with radar returns"; picos em 9 e 11 de agosto; testemunhas descreveram objetos "leaving no exhaust trail, moving too slowly, flying horizontally, traveling and maneuvering in formation, and appearing to be silent"; a investigação militar sueca achou "nothing other than occasional craters in the lake bottom"; explicações: meteoros e testes soviéticos de V-1/V-2.
- **Fonte lida.** https://en.wikipedia.org/wiki/Ghost_rockets
- **Por que importa.** "Nordic UFO" na frente foi interpretado como esse caso (o mais documentado da ufologia nórdica). Não sei se o Theus quis dizer outra coisa (por exemplo os "nórdicos" da literatura de contato, ou uma estética escandinava aplicada ao tema); se for, é preciso perguntar. O que o caso dá ao design é uma regra de movimento: **o objeto sério se move sem rastro e em silêncio.**
- **Traço mínimo.** **Nenhuma transição deixa rastro**: sem partículas, sem *motion blur*, sem cauda luminosa; um elemento que entra em cena chega pronto (opacidade 0 → 1 em 180 ms) e para. **Som só depois de gesto** (regra 7 do PROMPT_AGENTICO). E o "1984": o histórico de versões é guardado sempre e aberto quando alguém pede (já existe "Versões (n)").
- **Aplicação.** `tokens.css`: `--entrada: 180ms ease-out`; proibição de `filter: blur` em animação; sem sons de interface por padrão.

### A16. JWST: cor por ordenação cromática — a cor é dado, não decoração

- **Fato.** O telescópio faz "up to 29 greyscale images, each through a different filter which only passes IR light of a certain wavelength"; "the separate images are then assigned a colour; the longest wavelength is 'red' and the shortest 'blue', with the others in between"; "the colours do represent something real — the variation in brightness with wavelength", o infravermelho "shifted up the electromagnetic spectrum" para a faixa visível.
- **Fonte lida.** https://www.sciencefocus.com/space/how-is-colour-added-to-the-jwst-images-an-astronomer-explains
- **Por que importa.** O degradê roxo → azul → ciano é identidade [Theus]. A ordenação cromática dá a ele uma **função**: uma escala ordenada em que cada cor é uma posição.
- **Traço mínimo.** **O degradê vira escala de tempo**: ciano = agora (ao vivo), azul = hoje, roxo = mais antigo. Presença, arquivos "mudaram por último", linha do tempo do perfil e a "evolução da semana" na TV usam a mesma escala. Nunca o degradê como fundo de botão ou de cabeçalho.
- **Aplicação.** `tokens.css`: `--t0: #29ccec; --t1: #4f8cff; --t2: #8670ff` com regra escrita. Já existe a base (`--e-ciano`, `--e-acento`).

### A17. Cosmic Latte (#FFF8E7): a luz média do universo é um bege quente, não azul

- **Fato.** Karl Glazebrook e Ivan Baldry (Johns Hopkins, 2002) mediram "the light from over 200,000 galaxies"; o primeiro resultado (turquesa) era erro de cálculo; a correção de 2003 deu "a whiteish beige", nomeado "cosmic latte" (latte = leite, a língua de Galileu; Via Láctea). Hex `#FFF8E7`.
- **Fonte lida.** https://en.wikipedia.org/wiki/Cosmic_latte
- **Por que importa.** A "luz do espaço profundo" que o pedido cita não é neon: é uma luz quente e fraca sobre fundo quase preto. Um texto de leitura longa em ciano cansa; em Cosmic Latte, descansa.
- **Traço mínimo.** **Cor de leitura = Cosmic Latte a 88 %** sobre `#060b16` para documentos, ata, notas, ideias faladas (o registro Cormorant). A UI continua em `--e-texto` frio. Duas temperaturas, cada uma com seu papel: quente = humano, frio = sistema.
- **Aplicação.** `--texto-leitura: #fff8e7` no editor de Markdown, na ata e nas ideias; o tema claro da TV (visita) usa Cosmic Latte como fundo em vez de branco puro.

### A18. Pale Blue Dot (1990): a presença é um ponto dentro de um feixe

- **Fato.** Foto de 14/02/1990, a cerca de 6 bilhões de km; a Terra "a bright speck within the sunbeam", que "appears softly blue"; reprocessada em 2020 "respeitando os dados originais"; Sagan: "Look again at that dot. That's here. That's home. That's us."
- **Fonte lida.** https://science.nasa.gov/resource/voyager-1s-pale-blue-dot/ (o valor "0,12 pixel" não está nessa página; não o afirmo).
- **Por que importa.** A peneira tirou a marca d'água do meio vazio e deixou "Nada aberto · Ctrl K". O Pale Blue Dot é a forma mais contida de dizer "há alguém aqui": um ponto num feixe fraco.
- **Traço mínimo.** **Meio vazio = um ponto de 3 px, azul-pálido, dentro de um feixe vertical de 1 px a 4 % de opacidade, e a linha "Nada aberto · Ctrl K"**. O ponto é a pessoa (cor dela). Nada anima. Na TV, o modo "sem nada a mostrar" usa o mesmo ponto no lugar do painel vazio.
- **Aplicação.** `.e-vazio` no CSS: substitui `.e-vazio-marca` (logo a 8 %). Zero IA.

### A19. CP 1919 (Harold Craft, 1970): pulsos empilhados com oclusão — o gráfico que virou ícone

- **Fato.** Tese de Craft em Arecibo ("Radio Observations of the Pulse Profiles and Dispersion Measures of Twelve Pulsars"); motivo: "we were looking at potentially drifting subpulses within the major pulse itself"; técnica: "I wrote the program so that I would block out when a hill here was high enough, then the stuff behind it would stay hidden"; uma desenhista passou a nanquim para impressão; reproduzido na Cambridge Encyclopaedia of Astronomy (1977); Saville inverteu para branco no preto.
- **Fonte lida.** https://www.scientificamerican.com/blog/sa-visual/pop-culture-pulsar-origin-story-of-joy-division-s-unknown-pleasures-album-cover-video/
- **Por que importa.** É o único gráfico de radioastronomia que o público reconhece — e é linha branca em fundo preto, sem cor, sem eixo. Um "sonho noturno" (o que se repetiu no dia) é literalmente uma busca por padrão repetido em pulsos.
- **Traço mínimo.** **"Evolução da semana" na TV e "Sonho" no Acervo como 7 linhas empilhadas (uma por dia), atividade da equipe como pulso, com oclusão** (linha da frente esconde a de trás). Uma cor, 1 px. Sem rótulo além do dia da semana à esquerda.
- **Aplicação.** SVG gerado do dado real (demandas concluídas, mensagens, arquivos salvos por hora). Zero IA. Cuidado com o clichê da capa: manter pequeno (≤ 120 px de altura) e sempre ao lado de um número.

### A20. Breakthrough Listen: cascata (frequência × tempo) e o teste liga/desliga que separa sinal de interferência

- **Fato.** "The top shows the first observation of the night, continuing downwards in time. From right to left, the radio frequency progresses from low to high. And the color of the plot indicates the strength of radio emission detected"; blc1 era "a few-Hz wide narrowband signal" com deriva; o teste: apontar para a estrela e para fora dela em cadência; sinais que "appear no matter where the telescope is pointed, including the off-target observations … are all radio frequency interference"; blc1 sumia fora do alvo, mas depois provou-se interferência.
- **Fonte lida.** https://communities.springernature.com/posts/the-blc1-signal-is-not-alien-but-it-is-a-huge-leap-forward-for-seti
- **Por que importa.** Dá dois traços: a **cascata** como linha do tempo densa e o **teste de cadência** como critério para o app só sugerir o que persiste ("A sala sugere: parece que saiu uma ideia" só quando o sinal continua, não a cada palavra).
- **Traço mínimo.** (a) **Parede de terminais em modo compacto = cascata**: uma coluna de 2 px por agente, o tempo desce, brilho = atividade; um olhar diz quem está trabalhando. (b) **Regra de sugestão**: a faixa "Parece que saiu uma ideia" só aparece se o padrão persistir por 2 janelas de 12 s (A2) e sumir no silêncio — senão é ruído.
- **Aplicação.** Terminais (visão "cascata" ao lado da visão "cartões"), TV (faixa de sugestão), "Cuidando da gente" (sinais só quando persistem por dias, nunca por um evento).

### A21. ALMA: 66 antenas agem como um só telescópio; a resolução vem das linhas de base, não do prato

- **Fato.** 66 antenas (54 de 12 m + 12 de 7 m) a 5 000 m no Chajnantor; "work together as though they were a single giant telescope"; resolução equivalente a um prato "with a diameter equal to the farthest distance between antennas (… up to 16 kilometers)"; "perfect synchronization … with a precision down to a millionth of a millionth of a second"; caminho do sinal medido com precisão "similar to the diameter of a human hair"; tudo vai ao Correlator por fibra.
- **Fonte lida.** https://www.almaobservatory.org/en/about-alma/how-alma-works/
- **Por que importa.** É a metáfora exata do Babel Coop: 11 computadores, cada um com o próprio armazenamento, que só valem como um quando estão correlacionados. O que dá "resolução" à equipe é a distância coberta entre pessoas trabalhando juntas, não o tamanho de cada uma.
- **Traço mínimo.** **Equipe como interferômetro**: 11 pontos em posições fixas (uma por pessoa); uma **linha de base** fina só aparece entre duas pessoas quando há correlação real agora (mesmo projeto aberto, arquivo compartilhado, terminal com "Entrar"). Sem linha = trabalho solo; muitas linhas = a equipe está "resolvendo" junto. Nenhum rótulo além da inicial.
- **Aplicação.** Cabeçalho da atividade Equipe e modo painel da TV (canto). SVG do dado real (presença + projeto + terminal). "Atualizar vN" (Oficina) é a sincronização: mostra quem ainda está fora de fase.

### A22. "Where Is Webb" (NASA): progresso como viagem — tempo ou distância, último passo pequeno, passo atual grande

- **Fato.** O rastreador mostra "L+ 01d:12h:45s", "progress in distance, speed, percentage of trip complete to L2"; uma linha graduada que "can be displayed in time view or as a percentage of the total distance travelled to reach L2 orbit"; "a thumbnail of Webb's MOST RECENTLY COMPLETED deployment step … followed by details of the current deployment step shown with a larger image"; temperaturas do lado quente e frio; diagrama da órbita em L2.
- **Fonte lida.** https://webb.nasa.gov/content/webbLaunch/whereIsWebb.html
- **Por que importa.** É "órbita como progresso" feito por uma agência para o público, sem fantasia: uma linha, ticks, o passo feito e o passo atual.
- **Traço mínimo.** **Trilha de "Tarefas com fluxo" e campanhas de Metas = uma linha graduada com o passo concluído em miniatura à esquerda e o passo atual grande**; alternador "tempo | %" (prazo vs. quantidade); um ponto (a cor do responsável) na posição. 100 % = o ponto chega ao fim e a linha se fecha em anel (a "órbita" só aparece na chegada: é a comemoração contida).
- **Aplicação.** Trabalho → Tarefas (visão trilha), Metas (placar), TV (placar de metas). A "animação de comemoração" [Theus] vira o fechamento do anel, 800 ms, uma vez.

### A23. Apollo DSKY: verbo + substantivo, uma fileira de luzes de estado, indicadores numéricos

- **Fato.** "The Display Keyboard (DSKY…) was the primary interface between Apollo astronauts and the computers"; "Astronauts instructed the computer by keying in numerical codes in a 'verb - noun' sequence; e.g. 'display velocity.'"; a interface era "a simple numerical keyboard, a row of status lights, and a set of lighted numerical indicators"; 20,3 × 16,5 × 20,3 cm; Raytheon.
- **Fonte lida.** https://airandspace.si.edu/collection-objects/keyboard-display-dsky-apollo-guidance-computer/nasm_A19760744000 (a página não descreve o eletroluminescente verde nem o número de teclas; não afirmo).
- **Por que importa.** O Babel Coop já tem a gramática `coop <verbo> <objeto>` e uma barra de status que a peneira quer "só com o que muda". O DSKY é o desenho dessas duas coisas: dois registros (VERBO · OBJETO) e uma fileira de luzes **apagadas por padrão**.
- **Traço mínimo.** (a) **Prompt do terminal em dois registros**: ao digitar, o verbo reconhecido ganha um sublinhado fino e o objeto outro (`projetar` · `README.md`); a paleta `Ctrl K` mostra as duas colunas. (b) **Barra de status = fileira de luzes**: cada item é um ponto apagado (contorno) que só acende quando há algo (presença, caixa, cronômetro, gravação, projeção, controle de terminal, atualização). Apagado = nada a dizer; nenhum texto fixo.
- **Aplicação.** Terminal (direita), paleta, rodapé. Sem IA. Números do cronômetro em mono tabular, **não** sete segmentos (seria fantasia).

---

## 2. Regras de contenção que saem desta frente (para o `tokens.css` e para os críticos)

1. **Um traço por ideia.** Cada achado acima virou um elemento de no máximo 16 px ou uma regra. Se precisar de mais de um elemento para carregar a metáfora, a metáfora está errada.
2. **Só onde há dado.** Varredura, persistência, cascata, anel, linhas de base: tudo lê um evento real. Sem evento, estático (A8).
3. **Sem rastro, sem ruído, sem som.** Nada de partículas, blur, scanline, grão, glitch, estrelas ao fundo, sons automáticos (A5, A15).
4. **Duas temperaturas.** Frio (`--e-texto`) para sistema; quente (Cosmic Latte) para o humano (A17).
5. **Degradê é escala, não fundo** (A16).
6. **Marca única** (A1): o "b" pequeno; nenhum segundo símbolo de marca em tela.
7. **Tipografia por registro** (A9): fala / sistema / instrumento. Nenhum tipo "espacial".
8. **Luz apagada = nada a dizer** (A23, A11): status e avisos nascem, decaem e somem.
9. **Teto de 2 sinais vivos por tela** (A7 + PROMPT_AGENTICO 6.2).
10. **`prefers-reduced-motion`**: cada elemento acima tem estado estático declarado (anel aberto/fechado, ponto fixo, coluna sem transição).

## 3. O que gerar por IA (Replicate) e o que não gerar

| Elemento | Como fazer | Custo | Regra |
|---|---|---|---|
| Anel do agente, varredura, persistência, ficha, luzes, cascata, linhas de base, trilha, mapa radial, ponto no feixe | CSS/SVG à mão | 0 | não cabe IA: são 1 px e dado real |
| Bitmaps 7 × 11 dos agentes (A13) | SVG à mão ou `recraft-ai/recraft-v4-svg` numa leva única, prompt de estilo fixo, seed fixa | < US$ 1 | SVG nativo, nunca PNG vetorizado |
| Diagramas de onboarding do token (A3), família de 3 | `recraft-ai/recraft-v4-svg` ou `quiverai/arrow-1.1`, mesma leva | ≈ US$ 1 | traço único, `currentColor`, animar o traço |
| Logo "b" animada | keyframe A (o "b" atual) → `wan-video/wan-2.7-i2v` com `first_frame = last_frame` (loop) · rascunho antes em `seedance-2.0-fast` · seed fixa · `Cancel-After: 900` · baixar em 1 h | US$ 3–8 | movimento = **uma** varredura de luz passando pela letra (A10), 3 s, sem partículas; `prefers-reduced-motion` → frame final estático |
| Fundo de "espaço profundo" (opcional, só para o tema visita da TV) | `black-forest-labs/flux-2-max` ou `google/nano-banana-2`, 1 imagem estática, sem estrelas cintilando, quase preto com um feixe fraco (A18) | US$ 0,1–0,5 | sem vídeo; sem parallax; se não passar no teste da metáfora, não entra |

Total desta frente, se tudo entrar: **≈ US$ 5–10** dos US$ 20 da missão. Conferir slug e schema (`GET /v1/models/{owner}/{name}`) antes de cada lote (regra 5). Registrar em `MANIFESTO.json`.

## 4. O que ninguém fez (até onde esta frente viu — anterioridade por função, não por palavra)

- Barra de status como **fileira de luzes apagadas** (DSKY): nada aceso quando nada muda. Linear/VS Code/Warp mantêm texto fixo no rodapé.
- **Memória da sala como coluna de 25 caracteres de intensidade** (Wow!): o app mostra *quanta* memória há sem transcrever nada.
- **Parede de terminais como DSN**: direção do fluxo (↑ pessoa / ↓ agente) + tempo de ida e volta como o único número do cartão.
- **Meio vazio como Pale Blue Dot**: um ponto num feixe, em vez de marca d'água ou "ilustração de vazio".
- **Equipe como interferômetro** (ALMA): linhas de base que só existem quando há correlação real entre duas pessoas agora.
- **Mapa da equipe como mapa de pulsares**: linhas radiais cujo comprimento é tempo desde a última troca.
- **Degradê da marca como escala cromática ordenada de tempo** (JWST), não como fundo.
- **Anel de traço único como estado do agente** (Arrival): aberto = pensando, fechado = parado, aberto e parado = falhou (com próximo passo).

Não sei se algum produto já combinou isso; a busca desta frente foi por referências de origem (espaço/ufologia), não por produtos concorrentes. A frente "anterioridade de layouts 3 colunas" deve cruzar com Linear, Cursor, Warp, Zed, Arc, visionOS.

## 5. Armadilhas (o que vira parque temático) e limites desta pesquisa

- Radar verde em tela cheia, círculos concêntricos girando, hexágonos, "HUD" com mira, scanlines/CRT, grão, glitch, partículas, estrelas cintilando ao fundo, parallax de galáxia, discos voadores e "alienígenas" como ícone, letras "alienígenas", carimbo "TOP SECRET" rotacionado em vermelho, fontes Eurostile/Orbitron, sete segmentos, neon pulsando, ruído de rádio como som de interface. Cada um destes destrói a seriedade que o público (empresários) exige.
- A capa do Unknown Pleasures (A19) é clichê de camiseta: usar pequeno, ligado a dado, sempre com número ao lado.
- "Nordic UFO": interpretei como os foguetes-fantasma de 1946; se o Theus quis outra coisa, perguntar.
- Fontes que não abriram: Design Week (403), filmdoctor.co.uk (DNS), radartutorial.eu (404), PBS NOVA (só título), pale blue dot antigo (404), pha.jhu.edu (certificado), Voyager mission status (404). Para cada uma há substituta lida acima; nenhuma afirmação vem de página não lida.
- eyes.nasa.gov/dsn-now é app JS: a descrição do que ele mostra veio de fonte secundária (A12); antes de citar números do DSN no painel, abrir o app no navegador.
- Regras da Replicate que se aplicam a qualquer geração daqui: keyframe antes de vídeo; SVG nativo; seed fixa; `Z = A` para loop; baixar em 1 h; orçamento (parar em 80 % de US$ 20); `prefers-reduced-motion`.

## 6. Fontes (todas lidas nesta sessão)

- https://wearethemutants.com/2020/01/09/unity-precision-thrust-the-nasa-graphics-standards-manual-1975/
- https://standardsmanual.com/products/nasa-graphics-standards-manual
- https://bigear.org/6equj5.htm
- https://en.wikipedia.org/wiki/Wow!_signal
- https://science.nasa.gov/mission/voyager/golden-record-cover/
- https://territorystudio.com/project/blade-runner-2049/
- https://archive.nerdist.com/arrival-logograms-science-nerdery-creation/
- https://gmunk.com/OBLIVION-GFX
- https://www.chriskieffer.com/work/interstellar
- https://www.artofvfx.com/enders-game-ash-thorp-creative-director/
- https://en.wikipedia.org/wiki/Plan_position_indicator
- https://jasperbernaers.com/deep-space-comms/
- https://en.wikipedia.org/wiki/Arecibo_message
- https://www.archives.gov/research/military/air-force/ufos
- https://www.theblackvault.com/casefiles/desks-project-blue-book/
- https://en.wikipedia.org/wiki/Ghost_rockets
- https://www.sciencefocus.com/space/how-is-colour-added-to-the-jwst-images-an-astronomer-explains
- https://en.wikipedia.org/wiki/Cosmic_latte
- https://science.nasa.gov/resource/voyager-1s-pale-blue-dot/
- https://www.scientificamerican.com/blog/sa-visual/pop-culture-pulsar-origin-story-of-joy-division-s-unknown-pleasures-album-cover-video/
- https://communities.springernature.com/posts/the-blc1-signal-is-not-alien-but-it-is-a-huge-leap-forward-for-seti
- https://www.almaobservatory.org/en/about-alma/how-alma-works/
- https://webb.nasa.gov/content/webbLaunch/whereIsWebb.html
- https://airandspace.si.edu/collection-objects/keyboard-display-dsky-apollo-guidance-computer/nasm_A19760744000
