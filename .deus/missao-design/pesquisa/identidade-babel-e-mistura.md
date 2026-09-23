# Frente: identidade da Babel e a mistura sem forçar

> Missão `babel-coop/design-2030` · frente "identidade-babel-e-mistura" · 2026-09-23
> Método: leitura do material do Theus e da identidade atual; pesquisa na web com WebSearch e WebFetch; só entra achado com a URL efetivamente lida. Onde a página bloqueou (403/451/paywall), a fonte está listada em "não lidas" e nada dela foi usado como fato.

## 0. O que foi lido antes de pesquisar

- `~/Desktop/stack-video-scroll/PROMPT_AGENTICO_LP.md` e `BRIEFING_IA.md`: regras de geração (keyframe antes de vídeo; SVG nativo para ícones; seed fixa; loop com `last_frame = first_frame`; orçamento é limite duro; outputs da Replicate expiram em 1 h; `prefers-reduced-motion`; "um efeito só entra se for metáfora do serviço"; "o teste é a metáfora, não o catálogo").
- `~/Desktop/babel-coop/docs/UX_PENEIRA.md`: a peneira já propôs tirar as marcas d'água do "b" (meio e terminal), o botão "Neon", os rótulos de protótipo, e reduzir a barra de status. Regra: "o neon é identidade fixa, não opção".
- `~/Desktop/babel-coop/docs/FUNCOES.md`: tudo o que não pode sair (inclui, em A, "Identidade visual: fundo `#060b16`, roxo → azul → ciano, fonte mono no terminal, logo b").
- `~/Desktop/babel-coop/IDEIAS.md` seção 10: duas referências do Theus (Babel Terminal: azul-marinho com degradê roxo → azul → ciano, base da Estação; Grafo v5: roxo profundo com **uma única cor-assinatura** `#a040fd`, base da TV). "Movimento: o fundo respira devagar, nada pisca, o foco acende e o resto apaga." "Logo b em neon pulsando como marca d'água."
- `prototipo/base.css`: tokens (`--e-fundo #060b16`, `--e-acento #8670ff`, `--e-violeta #9160ec`, `--e-ciano #29ccec`, TV `--t-fundo #090413`, `--t-assinatura #a040fd`, `--t-ambar #d98a00`); fontes `IBM Plex Sans` (UI), `JetBrains Mono` (mono), `Cormorant Garamond` (fala).
- `prototipo/estacao.css` 257–275: `.term-marca` (o "b" a 62 % da largura do terminal, opacidade 0,12) com `@keyframes neon` alternando `drop-shadow` roxo → ciano a cada 3,4 s; `.term-linha.saida` com **texto em degradê** (`background-clip: text`).
- `prototipo/v3.css`: texto em degradê também em `.oficina-versao b`, `.oficina-v`, `.cron-mini .cron-relogio`; aro roxo pulsante na projeção (`aro-roxo`).
- `prototipo/tv.css` 1–45: a TV tem **dois chãos** (`#090413` roxo por padrão; `#060b16` no tema "azul") e um fundo que "respira" em 28 s com dois halos (roxo e ciano).
- `prototipo/babel-logo.png`: a logo é **PNG 574×1360, 204 KB** (não é SVG).
- Cormorant Garamond é usada só em tamanhos grandes: saudação 34 px, pergunta da semana 21 px itálico, e na TV (mural, citação, pergunta, comemoração).

## 1. Precedentes lidos (misturas que deram certo) e o que cada um ensina

### 1.1 Dune (2021/2024) · feudal + espacial + brutalismo + Egito + Japão
- Vermette: **"For Denis and I, design for design cannot exist. Design needs to support storytelling, inform us of the past as well as the future."** e **"Our approach is always to make things believable. You need to take it out of the fantasy and anchor it to reality."** (Pushing Pixels)
- A lista de referências é longa ("Ziggurat, Egyptian, Brazilian brutalism, Mayan, Aztec as well as Carlos Scarpa for the intricacies"), mas cada uma tem função: **"The idea to use brutalism was also to underline the show of force of the colonizer towards the local population."** (Pushing Pixels). O feudal aparece em escala, material e cerimônia, não em coroas.
- Cada Casa tem uma física própria e única: Caladan "the grays of the sky, the yellows of the leaves, the green of the pine trees"; Giedi Prime "a black molded plastic world"; Fremen "a culture that is in survival mode daily". (Pushing Pixels, Dezeen: "black and plastic")
- Villeneuve: **"if we've seen it before, it's not interesting for him"** (Dezeen). Vermette: **"After 2001: A Space Odyssey, the aesthetic of almost every sci-fi was derived from that film… Let's try to do something original, we may not succeed but at least let's try."** e "our approach is to be as physical as possible" (Science Focus). Referências de Arrakeen: "bunkers from WWII; ziggurat architecture from Mesopotamia; brutalist architecture from the ex-Soviet bloc… a sense of imposing yourself on a place."
- Vermette se coloca **"in the position of the architect or the founder of that place"** (Dezeen): a mistura nasce de perguntar quem construiu e por quê, não de colar estilos.

### 1.2 Arrival (2016) · ufologia sem disco voador
- Vermette: **"we wanted to do something very alien-looking, very different from what had been done before, to surprise"**; a nave "it's like cement rocks, which is supposed to represent for me the layers of wisdom and history of the ancient civilization"; **"sometimes danger… there's a certain attraction? We needed to convey that as an idea."** (Global News)
- Concept art (Meinert Hansen): "Spheres were in the first script I read. The sphere shape was abandoned quickly"; **"I loved the idea and simplicity of a wide and empty space – the exact opposite of typical cluttered movie spaceships. With less to distract, we pay more attention to the main characters."**
- A "língua" dos heptápodes é a peça central: "all of these ink blots have a meaning… We created a dictionary". Arrival é um filme sobre **linguagem como ponte com uma inteligência outra**. Para uma empresa chamada Babel, com terminal de agentes de IA, é o precedente de ufologia mais pertinente que existe.

### 1.3 Nope (2022) · o OVNI clássico que "vira outra coisa"
- Rocheron: **"Jordan had in his head that he wanted a creature that looks like a classic UFO but evolves into something else"**; **"Early on in the process, we connected on a minimalistic design. Very simple, very clean."**; consultaram um biólogo de água-viva porque "it's one of the most efficient animals in the world"; **"Jean Jacket hides in the clouds shaped in a saucer form as a way not to be exposed."** (motionpictures.org)
- Lição: o clichê (disco) é usado **uma vez, como disfarce**, e a forma real é orgânica e eficiente.

### 1.4 Foundation (Apple TV+) · império + colônia
- Cheyne: **"I was after the 'space' between what I feel is classic sci-fi and contemporary sci-fi films from the past 30 years."** (Wider Lens). A entrevista com o detalhe de Terminus construída com containers da nave dos colonos aparece só em resumo de busca (BTL News, não lida: 403); não uso como fato.

### 1.5 Teenage Engineering · brinquedo + instrumento
- Kouthoofd: **"When I design a product, it's like making a film. You tell a story."**; **"I stick to rules and try to understand them, because then I can become free again."**; RAL "has only two blues — light blue and dark blue. It's about efficiency in the process and the expression"; minúsculas "It's democratic"; filosofia "mix between German and Italian" (SFMOMA).
- **"Limitations are OP-1's biggest feature"**; inspiração no Casio VL-1 ("toy sound"); críticas por "assemelhar-se a um brinquedo", e ao mesmo tempo peça do acervo do SFMOMA e instrumento de Beck e Depeche Mode (Wikipedia OP-1).
- Blake Crosley: TE é **"brutalist honesty about what a thing is, combined with obsessive care about how it looks being that thing"**; o laranja vem de equipamento de segurança industrial e "says 'important,' 'engineered,' 'not to be ignored'"; monoespaçada "signal[s] precision and engineering without explicit messaging"; **"Teenage Engineering never hides what their products are"**; evita pastiche por recusar a narrativa de estilo de vida.

### 1.6 Aesop · farmácia + luxo
- Recusa "ouro, acabamentos brilhantes ou sinalização de status"; frascos "de farmácia em vez de recipientes cosméticos"; **"quando todos competem por atenção, a contenção visual se torna uma vantagem competitiva"**; "em um mundo barulhento, a calma pode ser revolucionária" (Offnormal).
- Nenhuma loja é igual à outra (tijolo em Roma, tijolo recuperado em Seul, cobogó em São Paulo); o que une é um princípio abstrato: Paphitis pediu a Guadagnino **"um sentido de ordem monástica e tranquilidade"** (Azure).

### 1.7 Apple × Braun · princípios, não superfícies
- Rams: 10 princípios; nº 5 **"Products fulfilling a purpose are like tools. They are neither decorative objects nor works of art."**; nº 6 honesto: "It does not make a product appear more innovative, powerful or valuable than it really is."; nº 10 **"Less, but better"**. Apple herdou pela via dos princípios; os ecos de forma (iPod/T3, calculadora/ET66) são poucos e citados (Wikipedia Dieter Rams).

### 1.8 Nothing · transparência + retrô
- Howard: **"we really wanted to bring the inside out, and that meant working with the engineers to start from first principles"**; **"We wanted to celebrate the 'good ones', the things we thought were really interesting to emphasise"** (transparência só onde há componente que merece); mapa do metrô de NY 1972 como referência de "organising a very, very complex system… in a beautiful way"; **"products should be simple at a glance, but the more time you spend with them, the more they give back."** Pei: "nobody had a consistent way of designing products. Apart from Apple". (Wallpaper*)

### 1.9 Blade Runner 2049 (Territory Studio) · futuro sem tela digital
- "Denis asked us to imagine a world where digital technology no longer exists and therefore conceive a new kind of tech. One that is more physical, organic and grounded"; usaram "optical lenses, cine projectors, microfiche, card systems" (territorystudio.com). Sheldon-Hicks: **"technology is a lens through which story unfolds. This means that our technology interfaces must always support the story"**; tecnologias obsoletas "establish an emotional and intellectual connection" (Design Museum).

### 1.10 Japandi · por que uma fusão de culturas distantes funciona
- "blends Japanese aesthetics and Scandinavian design"; convergem em minimalismo, materiais naturais, artesanato e função; o intercâmbio Dinamarca–Japão precede o termo (2016) em mais de um século (Wikipedia Japandi). A fusão só existe porque os **valores** já eram comuns; as formas vieram depois.

## 2. O que faz uma mistura parecer forçada (fontes lidas)

- **Pastiche**: Jameson chama de **"blank parody"**, "neutral practice" de imitação — copiar um estilo sem transformá-lo (Georgetown, resumo do texto de Jameson).
- **Ícone literal do tema**: "casa para construção, dente para dentista" é clichê nº 3; excesso de componentes é o nº 7; efeito 3D e fontes "exuberantes" são moda dos anos 2000 (FreeLogoDesign). Coroa, disco voador, foguete e castelo são a versão temática do mesmo erro.
- **Tema de parque**: a lógica de parque é pastiche deliberado — Frontierland "successfully conveys the overall period in question, as seen in a thousand and one genre films"; o objetivo é o visitante reconhecer em segundos. E quando os climas não convivem, "You don't have to be an expert… to register the disharmony" (Disneyland Dilettante). Um sistema de 8 h/dia é o oposto de um parque: não pode ser reconhecido em segundos, tem que sumir.
- **Heráldica inteira**: "a complete heraldic achievement would be a bit too much"; os melhores exemplos guardam um só elemento (o peixe de Aš) de "shield, supporters, crest, and motto" (Oliver Cowan).
- **Roxo → ciano + glow + vidro = "AI slop"**: a IA devolve "a média estatística de cada interface"; os sinais catalogados incluem **"Degradê roxo → azul (ou roxo → ciano)"**, "Glassmorphism com brilho neon", "texto gradiente", "easing elástico", "mesmo raio de canto em tudo"; saída: `DESIGN.md` explícito, direção estética comprometida, cor **semântica** ("as cores devem significar algo"), "bom design vem de algum lugar" (dev.to). Origem: "Purple gradients dominated 'modern' web design in 2015–2020 (Instagram's rebrand… Stripe/Twitch-style tech branding)" e os modelos foram treinados nesse material (Jack Pearce).
- **Copiar a superfície e não o princípio**: a lição Apple × Braun é os 10 princípios; copiar o T3 seria pastiche (Wikipedia Rams).
- **Vender estilo de vida em vez de mostrar o trabalho** (Blake Crosley sobre TE).

## 3. As 6 regras de "mistura sem forçar"

**R1 · Misture gramáticas, não ícones.**
Feudal em Dune é escala, material e cerimônia (brutalismo "show of force"), não coroa. Alien em Arrival é uma pedra em camadas, não um disco. Em Nope o disco é só o disfarce. Clichê é o ícone literal (FreeLogoDesign).
→ Babel Coop: **Reino** = hierarquia tipográfica, títulos, ritual de entrada (o token de convite como convocação), ordem de leitura; nunca coroa, brasão ou escudo. **Ufologia** = luz que vem de fora do quadro, vazio com uma forma, silêncio, escala; nunca disco, alienígena ou "estrelinhas". **Futurismo** = precisão (mono, números tabulares, latência mostrada), não cromo nem glow.

**R2 · Uma gramática manda; as outras servem em proporção pequena e em camada própria.**
Aesop: apotecário manda, luxo está na contenção. Nothing: transparência só nos "good ones". Dune: cada Casa tem uma física só.
→ Dominante: **instrumento de trabalho calmo** (empresarial, Rams). Reino entra na tipografia e nos rituais; ufologia entra na luz e no vazio; criatividade entra no jogo da Máquina/quadro; empreendedorismo nas metas e números. Nenhum dos quatro aparece em mais de uma camada ao mesmo tempo.

**R3 · Todo traço da mistura precisa de motivo funcional (a metáfora do serviço).**
TE: laranja de segurança "says important, engineered"; monoespaçada = precisão. Nothing: mostrar o que há dentro. Territory: "interfaces must always support the story". Regra do Theus: "um efeito só entra se for metáfora do serviço".
→ A ufologia tem um motivo real aqui e só aqui: **o terminal da direita é a sala de contato com inteligências não humanas** (agentes com nome). Arrival é sobre linguagem como ponte; Babel é linguagem. O Reino tem motivo em **gestão × membros, guildas = projetos, cuidado com a equipe**. Onde não há motivo (ex.: ufologia no editor de texto), não entra.

**R4 · Compartilhe valores antes de compartilhar formas.**
Japandi só existe porque as duas tradições já valorizavam o mesmo (minimalismo, natureza, artesanato, função). Apple herdou de Braun princípios, não peças. Kouthoofd: "mix between German and Italian" (disciplina + narrativa).
→ O denominador comum dos cinco temas do Theus: **ordem clara que abre espaço para o desconhecido** (Reino = ordem e pertencimento; empreendedorismo = ação medida; ufologia = contato com o outro; futurismo = antecipação e precisão; criatividade = jogo dentro de regras). O que não cabe nesse denominador (ufologia conspiratória, reino como ostentação, futurismo como cromo) fica fora.

**R5 · Uma só física de mundo: mesma luz, mesmo material, mesma escala em todas as telas.**
Vermette: "anchor it to reality"; Aesop: lojas diferentes, "ordem monástica" igual; Disneyland Dilettante: climas que não convivem denunciam a disharmonia na hora; Cheyne: o "espaço entre" o clássico e o contemporâneo.
→ Estação, TV, iPad e celular com **um só chão** e **uma só fonte de luz** por tela. Hoje a TV tem chão roxo (`#090413`) e a Estação azul-marinho (`#060b16`): duas físicas. Decidir se o material do Babel Coop **emite** luz (neon) ou **reflete** luz (superfície fosca); não pode ser os dois.

**R6 · Subtraia até restar o traço; se ainda se reconhece, está pronto.**
Nope: "minimalistic… very simple, very clean"; Arrival: "with less to distract, we pay more attention to the main characters"; Rams nº 10; heráldica reduzida a um elemento (Oliver Cowan); Aesop: contenção como vantagem.
→ Cada elemento gerado por IA passa por três subtrações antes de entrar. Se o Reino se lê só com Cormorant + ritmo + numeração ("03", "6/10", ideia já registrada em IDEIAS 10 vinda do app Reino), não precisa de brasão. Se a ufologia se lê só com o vazio e a luz de fora, não precisa de forma.

## 4. Veredito sobre a identidade atual

| Peça | Veredito | Motivo (com fonte) |
|---|---|---|
| Fundo `#060b16` (azul-marinho quase preto) | **Fica** | É chão calmo, não é o roxo de IA; serve a muitas horas e à TV (Rams nº 5, "tools… not decorative"). É o céu noturno sem estrela desenhada: a única ufologia que o fundo precisa. Vira o chão único de Estação, TV, iPad e celular (R5). |
| Degradê roxo → azul → ciano | **Evolui** | É literalmente o "tell" nº 1 de interface gerada por IA ("purple → blue (or purple → cyan)", dev.to; Jack Pearce). Fica como **fenômeno de luz** (halo, respiração da TV) e sai de **preenchimento de texto e botão** (`.oficina-v`, `.cron-relogio`, `.term-linha.saida`: "texto gradiente" é tell). Reduzir a **uma cor-assinatura** (o grafo v5 já tem esse princípio) + **uma cor de estado** semântica (ciano só quando algo está vivo: agente pensando, terminal ao vivo, gravação). Hipótese a testar na frente de cor: roxo → âmbar (`--t-ambar` já existe) como temperatura humano/agente, porque roxo → ciano é o par mais gasto. |
| Logo "b" em neon pulsando | **Evolui / contém** | A peneira já tirou as marcas d'água (meio e terminal) e o botão Neon. O `@keyframes neon` (roxo → ciano em 3,4 s, sempre) é decoração que viola Rams nº 5 e nº 7 e é tell de AI slop ("glassmorphism com brilho neon"). O "b" fica **pequeno no topo**; o brilho vira **instrumento de estado**: acende só quando algo real acontece (sala gravando, agente agindo, projeção na TV) e apaga quando não há nada, como o grafo v5 ("o foco acende e o resto apaga"). Além disso: a logo é PNG de 204 KB; pela regra do próprio Theus (SVG nativo), vira SVG. |
| Cormorant Garamond (voz/fala) | **Fica, com regra** | É o carro do Reino sem coroa: "heavily inspired by Claude Garamont's immortal legacy" (GitHub Cormorant), herança do século XVI. É "display type family": só em tamanhos grandes (já é assim: saudação 34 px, TV), nunca em corpo de UI. Papel fixo: **o que é humano e cerimonial** (saudação, pergunta da semana, comemoração, ata, o que a pessoa disse). |
| IBM Plex Sans (UI) | **Evolui (avaliar troca)** | É "IBM's corporate typeface… distinctly IBM" (GitHub IBM Plex). Para quem quer "linguagem de design própria" (Pei/Nothing), carregar a voz de outra empresa de tecnologia é a peça mais substituível. Não é Inter (o tell), então não é urgente; a frente de tipografia decide. Se ficar, fica por função, não por identidade. |
| JetBrains Mono (terminal, números, rótulos) | **Fica** | Monoespaçada "signal[s] precision and engineering without explicit messaging" (Blake Crosley sobre TE); é a língua do instrumento. Pode ganhar papel: numeração com zero à esquerda ("03"), barras "6/10" (herança do app Reino, IDEIAS 10), latência e estado do agente. |
| Chão roxo da TV (`#090413`, `#a040fd`) | **Evolui** | Duas físicas (R5). Chão único `#060b16`; a diferença da TV fica na escala e na luz, não na cor de fundo. A **cor-assinatura única** do grafo v5 é o princípio certo; o tom exato é decisão da frente de cor. |
| Movimento "o fundo respira, nada pisca, o foco acende e o resto apaga" (IDEIAS 10) | **Fica** | É a única regra de motion já escrita que coincide com Rams e com a régua do Theus; vira a lei do sistema. Tirar o `aro-roxo` pulsante permanente da projeção; pulso só na transição. |
| Texto explicativo, três logos, 10 itens de status | **Sai** (já decidido na peneira) | Não é identidade, é ruído. |

## 5. O que ninguém fez (com o que li)

1. Ufologia lida como **contato e linguagem** (Arrival) aplicada ao terminal de agentes: a coluna da direita como "sala de contato" com inteligências de nome humano. Nenhuma fonte de UI lida faz isso; os painéis "cyberpunk" fazem o oposto (neon como decoração).
2. Reino sem brasão: hierarquia por **tipografia de herança (Garamond) + ritual + numeração**, num app de equipe. Heráldica moderna reduzida existe para cidades e institutos (Oliver Cowan), não para software de cooperação.
3. Neon como **instrumento de estado** (acende só quando algo real acontece) em vez de identidade fixa.
4. Um só chão e uma só luz atravessando Estação, TV, iPad e celular, com a diferença toda na escala (a TV como a "Casa" grande de Dune: mesma física, outra escala).

## 6. Não sei / não confirmado

- Não li fonte de design sobre os sigilos das Casas em Dune 2021 (só lojas e fãs); não afirmo como foram desenhados.
- A entrevista de Rory Cheyne sobre Terminus feita com containers (BTL News) devolveu 403; o detalhe aparece só em resumo de busca.
- A definição de clichê "a symbol stripped of its power by overexposure" (Inkbot) apareceu no resumo de busca; a página lida era outra. Não uso.
- Regra dos "20 % de neon" (Medium) bloqueou (403). Não uso como número.
- Jameson: li só a citação de segunda mão ("blank parody", "neutral practice") na página da Georgetown; o PDF de Jameson não extraiu texto.

## 7. Fontes efetivamente lidas

1. https://www.pushing-pixels.org/2024/04/10/production-design-of-dune-interview-with-patrice-vermette.html
2. https://www.dezeen.com/2024/03/19/dune-part-two-production-design-patrice-vermette-interview/
3. https://www.sciencefocus.com/future-technology/dune-patrice-vermette
4. https://globalnews.ca/news/3267612/arrival-film-production-designer-on-creating-circular-smoky-alien-language/
5. https://meinerthansen.com/2016/11/13/arrival-concept-art-part-1-the-shell/
6. https://www.motionpictures.org/2022/08/nope-vfx-supervisor-guillaume-rocheron-on-creating-that-spectacular-alien-creature/
7. https://thewiderlens.ca/series/creative-spotlight/rory-cheyne-on-designing-foundation-around-the-world/
8. https://www.sfmoma.org/read/stay-curious-stay-naive-an-interview-with-teenage-engineering-jesper-kouthoofd/
9. https://blakecrosley.com/guides/design/teenage-engineering
10. https://en.wikipedia.org/wiki/Teenage_Engineering_OP-1
11. https://www.offnormal.co/blog/the-quiet-power-of-restraint-a-branding-strategy-analysis-of-aesop
12. https://www.azuremagazine.com/article/7-aesop-stores-that-elevate-the-urban-apothecary/
13. https://en.wikipedia.org/wiki/Dieter_Rams
14. https://www.wallpaper.com/technology/nothing-phone-1-what-to-expect
15. https://territorystudio.com/project/blade-runner-2049/
16. https://designmuseum.org/exhibitions/past-exhibitions/beazley-designs-of-the-year-2018/qa-with-david-sheldon-hicks-founder-of-territory-studio
17. https://en.wikipedia.org/wiki/Japandi
18. https://faculty.georgetown.edu/bassr/lynn/postmod.htm
19. https://www.freelogodesign.org/blog/2023/09/19/7-logos-cliches-and-how-to-avoid-them
20. https://olivercowan.co.uk/graphic-design/examples-of-minimal-heraldic-logo-design/
21. http://disneylanddilettante.blogspot.com/2017/08/imagineering-theory-art-of-placemaking.html
22. https://dev.to/james_anderson_h/the-purple-gradient-problem-why-ai-ui-all-looks-alike-and-how-to-fix-it-3j65
23. https://www.jackpearce.co.uk/notes/purple-gradient-ai-aesthetics/
24. https://github.com/CatharsisFonts/Cormorant
25. https://github.com/IBM/plex

### Fontes bloqueadas (não lidas; nada delas foi usado como fato)
- https://www.btlnews.com/awards/foundation-production-designer-rory-cheyne-interview/ (301 → 403)
- https://www.hollywoodreporter.com/movies/movie-news/arrival-production-designer-reveals-how-create-an-new-type-flying-saucer-945155/ (paywall)
- https://prelectur.stanford.edu/lecturers/jameson/excerpts/postmod.html (403)
- https://inkbotdesign.com/logo-design-cliches/ (página devolvida era outra)
- https://www.cnn.com/style/article/dieter-rams-film-exhibition-style-intl (451)
- https://www.trustedreviews.com/news/dieter-rams-3293727 (530)
- https://www.designweek.co.uk/issues/30-april-6-may-2018/graphic-design-blade-runner-2049-film-dad-festival/ (403)
- https://www.indiewire.com/craft-considerations/nope-jean-jacket-making-of-1234773941/ (paywall)
- https://medium.com/@developer_89726/dark-glassmorphism-the-aesthetic-that-will-define-ui-in-2026-93aa4153088f (403)
- https://robbreport.com/gear/personal-technology/dieter-rams-vs-jony-ive-2870027/ (paywall)
- https://www.creativebloq.com/features/foundation e https://www.creativebloq.com/news/best-logos-with-crowns (só a navegação carregou)
- https://designshack.net/articles/graphics/5-cliche-logo-design-trends-to-avoid/ (403)
