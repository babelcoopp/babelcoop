# Visão · Mídia viva como DNA do produto, sem virar "AI slop" (Frente 4)

> Missão `babel-coop/design-2030` · 23/09/2026 · pesquisa para o artefato novo pedido pelo Theus ("efeitos visuais… gerar elementos… um app inédito, líder até o ano que vem"). Lido antes de pesquisar: `docs/design/CONCEITO.md`, `docs/design/GERACAO_REPLICATE.md`, `docs/FUNCOES.md` e `~/Desktop/stack-video-scroll/PROMPT_AGENTICO_LP.md`.
> Regra desta nota: **cada achado traz a URL efetivamente lida**; o que não foi lido está marcado **não confirmado**. O WebSearch da sessão estava esgotado (200/200) e o DuckDuckGo devolveu CAPTCHA; tudo veio de WebFetch direto em URLs conhecidas. As páginas do HIG da Apple são renderizadas por JavaScript e vieram vazias; foram lidas pelo JSON que as alimenta (`developer.apple.com/tutorials/data/design/human-interface-guidelines/*.json`).

---

## 0. Em dez linhas

1. Nenhuma marca séria que vive de visual "vivo" usa mídia gerada **em movimento** dentro da interface de trabalho. Elas usam mídia gerada como **material** (Vercel: 15 mil gerações viraram um shader), como **ferramenta** (Figma Config 2026: a IA gerou três texturas, a mão montou o resto) ou como **luz que informa** (Nothing Glyph, Apple Dynamic Island).
2. O que "parece vivo e calmo" nos produtos citados é sempre **dado** ganhando forma, nunca decoração ganhando movimento: a Dynamic Island "expande para transmitir atividades importantes", o Glyph acende para "entregas ao vivo", o Wrapped é "uma sequência de telas de informação".
3. O AI slop tem definição acadêmica (jan/2026): **competência superficial, esforço assimétrico, produção em massa**. Os sinais visuais documentados: texto ilegível, anatomia impossível, brilho "glossy" sem detalhe autêntico. A lista de rejeição dura da Vercel completa o quadro: degradês decorativos, texto em degradê, glows, blobs, grids de fundo, vidro, profundidade falsa, marquees, cursores que "digitam", indicadores pulsantes.
4. Vídeo dentro de UI só é aceitável com quatro atributos (`autoplay loop muted playsinline`), `poster`, parada sob `prefers-reduced-motion`, mecanismo de pausa se durar > 5 s ao lado de outro conteúdo (WCAG 2.2.2) e nunca atrás de texto (HIG: "não use Liquid Glass na camada de conteúdo"; Linear recusou a refração porque "torna interfaces densas mais difíceis de ler").
5. World models como interface (Genie 3, Project Genie, Odyssey) já rodam a 720p/24 fps por alguns minutos ou a um quadro a cada 40 ms, mas **não geram texto legível**, custam US$ 1–2 por usuário-hora e são protótipos para assinantes Ultra. Não servem para a interface de 2026; servem para o modo 3D e para a TV como **geometria gerada uma vez e renderizada ao vivo**.
6. A tese que sai dos casos: **o vivo é o dado; o gerado é o material; o material nunca se mexe sozinho.**
7. O manual (§5) tem sete lugares onde mídia gerada entra no Babel Coop, cada um com metáfora do serviço, modelo, portão e desligamento; e uma lista fechada de onde nunca entra.
8. A grande virada para "inédito": o **chão da TV é a Máquina real do projeto em 3D**, com peças de geometria gerada (Trellis) e pele da casa, que só muda quando o backend muda. Nenhum produto lido faz isso.
9. O portão de sete perguntas (§5.3) decide qualquer efeito novo; se falhar em uma, não entra.
10. Custo do kit inteiro continua dentro dos US$ 20 já previstos; a diferença entre "efeito" e "DNA" não é dinheiro, é a disciplina do material.

---

## 1. A tese: o que os casos ensinam juntos

Os produtos que "parecem vivos" e continuam sérios fazem quatro coisas que os produtos que viram slop não fazem:

| Eles fazem | Quem (fonte em §2) | O que isso vira no Babel |
|---|---|---|
| **Geram muito, publicam pouco, e o que publicam vira código** | Vercel Ship 2025: 15 mil imagens e vídeos de exploração; o herói final é um shader por ray-marching | Mídia gerada é pesquisa e material; o runtime é CSS/SVG/three.js (já é a regra da v2) |
| **A IA faz a textura, a mão faz o sistema** | Figma Config 2026: ferramentas no Figma Make geraram três texturas "com toques de imperfeição"; glifos, motion e esculturas de espuma vieram da equipe | Recraft dá a família de ícones; o traço e o portão são nossos; Trellis dá geometria, a matcap é da casa |
| **Vidro e luz ficam nos controles, nunca no conteúdo** | Apple HIG: "Don't use Liquid Glass in the content layer"; Linear tirou a refração para manter leitura | Fundo gerado nunca atrás de texto; a única sombra é a paleta Ctrl K (já no CONCEITO §4.5) |
| **O que se move é dado** | Dynamic Island "expande para transmitir atividades"; Glyph acende para entregas; Wrapped é uma sequência de telas de dado | Meia-vida, anel, Selo; a TV muda só com mudança de dado (crossfade 400 ms) |

E uma quinta, negativa: **novidade demais cobra imposto**. A Browser Company admitiu que o Arc era "simplesmente diferente demais, com coisas novas demais para aprender, para pouca recompensa" (5,52 % usavam várias Spaces). O Rabbit R1, desenhado pela Teenage Engineering, foi "barely reviewable" e tinha ~5 mil de ~100 mil compradores ativos nove meses depois. Forma bonita sem encaixe é o outro nome do slop, mesmo sem IA.

---

## 2. Casos lidos

### 2.1 Apple · Liquid Glass e Dynamic Island (o vidro é dos controles; a ilha é presença)
- **Fato**: Liquid Glass (9/6/2025) é "translúcido, reflete e refrata o entorno" e "reage dinamicamente ao movimento com brilhos especulares"; vive em controles, navegação, botões, barras, Dock, ícones e widgets, "essencialmente em tudo menos no conteúdo"; controles "dão lugar ao conteúdo" encolhendo; no Lock Screen "a hora se adapta para ficar atrás do sujeito da foto". Alan Dye: "combina as qualidades ópticas do vidro com uma fluidez… que se transforma dependendo do seu conteúdo ou contexto". Fonte: https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/
- **Fato (HIG Materials)**: "Don't use Liquid Glass in the content layer." · "Use Liquid Glass effects sparingly." · "Limit these effects to the most important functional elements in your app." · "Only use clear Liquid Glass for components that appear over visually rich backgrounds." · "Help ensure legibility by using vibrant colors on top of materials." Fonte: https://developer.apple.com/tutorials/data/design/human-interface-guidelines/materials.json
- **Fato (HIG Motion)**: "Add motion purposefully, supporting the experience without overshadowing it." · "Don't add motion for the sake of adding motion." · "Gratuitous or excessive animation can distract people and may make them feel disconnected or physically uncomfortable." · "Make motion optional." · "Aim for brevity and precision in feedback animations." · "In apps, generally avoid adding motion to UI interactions that occur frequently." · "Let people cancel motion." · "Don't make people wait for an animation to complete before they can do anything, especially if they have to experience the animation more than once." Fonte: https://developer.apple.com/tutorials/data/design/human-interface-guidelines/motion.json
- **Fato (Dynamic Island, 2022)**: "blends the line between hardware and software"; "fluidly expands into different shapes to clearly convey important activities"; mostra "alerts, notifications, and activities" e mantém visíveis atividades de fundo (Mapas, Música, timers). Fonte: https://www.apple.com/newsroom/2022/09/apple-debuts-iphone-14-pro-and-iphone-14-pro-max/
- **Fato (HIG Live Activities)**: "Focus on important information that people need to see at a glance." · "Your Live Activity doesn't need to display everything." · "Don't add elements to your app that draw attention to the Dynamic Island." · "Always end a Live Activity immediately when the task or event ends." Fonte: https://developer.apple.com/tutorials/data/design/human-interface-guidelines/live-activities.json
- **Lição para o Babel**: o cabeçalho de 56 px do painel de agentes (lei 1) é a nossa Dynamic Island: presença = informação essencial, expande por evento, termina quando o trabalho termina, e nada no app chama atenção para ele. "Wallpapers vivos" da Apple: **não confirmado** (só a hora atrás do sujeito da foto foi lida).

### 2.2 Vercel Ship 2025 · quinze mil gerações viraram um shader
- **Fato**: a equipe gerou "over 15,000 images and videos during the design exploration" com Flux, Veo 2, Runway e Ideogram; conceito de ferrofluido ("a black magnetic liquid developed by NASA", "motion, magnetism, and something complex under the surface (but simple above)"); a revisão interna apontou tripofobia e eles "pulled back" para "a near-metallic liquid system. Reflective and grounded."; coerência veio de um modelo treinado para "consistent lighting, form, and material"; o herói do site foi reescrito em código com "ray-marching rendering technique to create a smooth surface without any visible polygons". Autores Genny Dee, Daniel Linthwaite, Yav Punchev, James Clements, 11/6/2025. Fonte: https://vercel.com/blog/designing-and-building-the-vercel-ship-conference-platform
- **Fato**: o Ship 26 é em 15/10/2026 no Palace of Fine Arts, "Ship what's next". Fonte: https://vercel.com/ship · Recap do Ship 2026 (30/6/2026): "We are deploying software that can think." Fonte: https://vercel.com/blog/vercel-ship-2026-recap
- **Fato (regras de design da Vercel)**: "Design in monochrome. Use color only when it adds significant meaning to state, action, or data." · "Hard reject decorative gradients, gradient text, glows, blobs, stripes, textures, grid backgrounds, glass effects, paper simulations, colored side rails, ornamental shadows, and fake depth." · "Default to stillness. Never add auto-scrolling marquees, simulated typing cursors, or decorative pulsing status indicators." · "The page is normally one continuous canvas. Earn a surface or boundary only when it communicates selection, interaction, warning, contrast, or a real grouping that spacing cannot express." Fonte: https://vercel.com/design
- **Lição para o Babel**: a mídia gerada é **pesquisa de material**; o que entra no produto é a **tradução em código** (shader, SVG, geometria). É exatamente a regra "à mão, custo zero" da v2, agora com um precedente de mercado. A identidade visual do Ship 2026 em si: **não confirmado** (só o artigo de 2025 foi lido).

### 2.3 Figma Config 2026 · a ferramenta é a identidade
- **Fato**: tema "Digital tools, human expression"; três princípios: Evolution (remixar), Fluidity (looping entre design e código), Harmony (iterar com ferramentas generativas mantendo o ponto de vista humano); Chelsea White enfatizou "craft and keeping a very human point of view"; a equipe construiu ferramentas no Figma Make que geraram **três texturas**: "scribbly linework, blurred gradients, and oval-shaped particles", abraçando "touches of imperfection"; retângulos limpos = ideias resolvidas, partículas = ideias nascendo; viraram esculturas de espuma de 14 pés; Ben Hill deixou o motion "looser, more collage-y, and expressive". 27/7/2026. Fonte: https://www.figma.com/blog/the-visual-identity-behind-config-2026/
- **Fato**: Dylan Field, 24/6/2026: "While AI has lowered the floor, it has not raised the ceiling. Designers, creatives, builders: You will raise the ceiling." · "Code should be treated like any other design material." Fonte: https://www.figma.com/blog/config-2026-recap/
- **Fato**: Figma Motion (24/6/2026): "Motion now lives on the canvas—in the same file as your components, your variables, and your team."; exporta MP4/GIF/SVG/WEBM e código CSS/JSON/React; variáveis de easing com modos. Fonte: https://www.figma.com/blog/introducing-figma-motion/
- **Lição para o Babel**: uma identidade "gerada" séria é uma **gramática** (três texturas, dois estados de glifo) e não um banco de imagens. As "partículas" do Config só funcionam porque significam "ideia nascendo"; sem esse significado seriam slop. A abertura do evento em si: **não confirmado**.

### 2.4 Linear · mais calmo, sem refração, "output isn't design"
- **Fato** (12/3/2026, Charlie Aufmann e Maxime Heckel): "Software rarely gets worse all at once. More often, it contorts out of shape one useful feature at a time."; cinzas mais quentes; sidebar escurecida para o conteúdo ter precedência; menos separadores, menos ícones, sem fundos coloridos; entregue por feature flags. Fonte: https://linear.app/now/behind-the-latest-design-refresh
- **Fato** (21/10/2025, Robb Böhnke): Linear reconstruiu o Liquid Glass sem refração: "Refraction can make dense professional interfaces harder to read. By relying on precise blurs, masking, and lighting, we maintained a sense of depth without losing clarity."; filosofia "ProKit": "purpose-built, disciplined, and designed for sustained focus." Fonte: https://linear.app/now/linear-liquid-glass
- **Fato** (28/3/2024): tema por três variáveis (base, acento, contraste) em LCH; "A redesign should not completely disassemble the product to its atomic parts". Fonte: https://linear.app/blog/how-we-redesigned-the-linear-ui
- **Fato** (17/4/2026, Karri Saarinen): "The hard part of design is rarely generating the form." · "The form is there. The fit is not." · "The risk is mistaking generated form for solved problems." Fonte: https://linear.app/now/output-isn-t-design
- **Lição para o Babel**: o tema OKLCH de três variáveis do CONCEITO tem precedente; a regra "nada anima sem dado" e "zero vidro em painel de conteúdo" também. E a frase de Saarinen é o teste do artefato novo: gerar forma é barato; o encaixe é o trabalho.

### 2.5 Raycast · rápido, simples, encantador
- **Fato** (19/7/2022): princípios "fast, simple, and delightful"; toasts movidos para dentro da janela; modo compacto; família de ícones com "consistent stroke width and corner radii". Fonte: https://www.raycast.com/blog/a-fresh-look-and-feel
- **Lição**: o "encantador" do Raycast é velocidade e consistência de traço, não efeito. Design atual do Raycast (2025–26): **não confirmado**.

### 2.6 Arc · o imposto da novidade
- **Fato** (26/5/2025): "Arc was simply too different, with too many new things to learn, for too little reward."; 5,52 % dos usuários diários usavam várias Spaces, 4,17 % Live Folders; a ambição era "your home on the internet" com "taste, care, feeling". Fonte: https://browsercompany.substack.com/p/letter-to-arc-members-2025 · Hoje o Arc está em manutenção ("Arc receives Chromium updates only") e aponta para o Dia. Fonte: https://arc.net/
- **Lição**: o Babel já tem quatro leis novas; cada efeito gerado a mais é imposto. O CONCEITO §13 já prevê retirada por peça; a mídia gerada precisa do mesmo plano.

### 2.7 Nothing · luz como informação
- **Fato**: Glyph Interface = LEDs traseiros que sinalizam notificações, carga e timers; no Phone (3) virou "Glyph Matrix", "a circular dot-matrix LED interface"; parceria com a Teenage Engineering desde fev/2021. Fonte: https://en.wikipedia.org/wiki/Nothing_(company) · "Making tech fun. This means creating bold, beautiful and unusual designs for products and software that aid creativity, not distract you." · "Revealing what is beneath the surface, showing the decisions behind the engineering and making space for the human experience." · "There was a time when tech was exciting… But everything is the same now. We're bored." Fonte: https://intl.nothing.tech/about · Na loja: "Get live delivery updates with the new Glyph Bar", "Essential Notifications". Fonte: https://nothing.tech/
- **Lição**: a luz do Nothing é **canal de dado** (entrega chegando), não enfeite. A meia-vida (lei 3) é o nosso Glyph: luz = idade do evento.

### 2.8 Teenage Engineering e Rabbit R1 · forma sem encaixe
- **Fato**: o OP-1 foi premiado como "intuitive, easily accessible and incredibly inviting"; os Pocket Operators "inspire a desire to press the buttons"; colaborações: Playdate (2019), Nothing ear (1) (2021), Rabbit r1 (2024). Fonte: https://en.wikipedia.org/wiki/Teenage_Engineering · Site: estúdio em Estocolmo, catálogo EP/PO/Field. Fonte: https://teenage.engineering/
- **Fato**: Rabbit r1 lançado em 9/1/2024, corpo laranja, roda de rolagem, câmera giratória, tela de 2,88", animação do coelho na tela, promessa do "large action model"; Marques Brownlee: "barely reviewable"; The Verge (set/2024): ~5.000 de ~100.000 compradores ativos; rabbitOS 2 em set/2025 como "reset". Fonte: https://en.wikipedia.org/wiki/Rabbit_r1 · US$ 199, "retrofuture aesthetic", "one conversational interface". Fonte: https://www.rabbit.tech/rabbit-r1
- **Lição**: o objeto mais bonito do ano não segurou usuário porque a função não encaixou. Para o Babel: o "b que se desenha" e as peças em 3D só valem se a Máquina de verdade lê o Supabase (FUNCOES B).

### 2.9 Spotify Wrapped · dado virando rito
- **Fato**: estreou em dez/2016; em 2019 ganhou formato de "stories": "a series of sequential screens of information, with the last one containing the invitation to share"; > 1.200.000 posts no Twitter em dez/2019; 2024 trouxe podcast por IA (NotebookLM); 2025 saiu em 3/12 com "Listening Stats"; crítica: "a pretty box full of mined data". Fonte: https://en.wikipedia.org/wiki/Spotify_Wrapped · 2025: "more dynamic, personal, and unmistakably you", Wrapped Clubs, Wrapped Party. Fonte: https://newsroom.spotify.com/2025-12-03/2025-wrapped/ · Página BR 2026: "O resumão de tudo que você ouviu no ano". Fonte: https://www.spotify.com/wrapped/
- **Lição**: celebração séria é **dado real em sequência**, não confete. A "evolução da semana" na TV (7 linhas) e o Perfil já são isso; um "Wrapped da semana" na sexta é rito de graça. Spotify Jam: **não confirmado** (nada lido).

### 2.10 Runway · Luma · Pika · vídeo como prova do próprio produto
- **Fato**: Runway: "Building Real-World Intelligence"; Gen-4.5 "The world's best video model"; GWM-1; Creative/Dev/Robotics. Fonte: https://runway.com/ · Luma: "Luma is your creative partner"; Ray 3.2 "Direct Every Frame Finish Every Cut"; Uni-1 "brand intelligence at the model level"; "Ten directions before the morning standup. Fifty variants by end of day." Fonte: https://lumalabs.ai/ · Pika: "Comprehensive. Simple. With outputs that meet your standards."; o vídeo gerado é o elemento visual principal da página, como demonstração das ferramentas. Fonte: https://pika.art/
- **Lição**: nos labs, o vídeo é **prova do serviço** (é o produto). No Babel, o equivalente é o cartão de resultado com miniatura 96×54 (prova de que o agente fez), o navegador do agente à vista e "Ver o agente montando" a Máquina: mídia **real** gerada pelo trabalho, não pelo modelo.

### 2.11 Midjourney · Krea (parcialmente não confirmado)
- **Fato**: Midjourney nasceu no Discord (12/7/2022) e ganhou interface web em ago/2024 com a v6.1. Fonte: https://en.wikipedia.org/wiki/Midjourney · O site (home e Explore) devolveu 403: identidade do site **não confirmada**.
- **Krea**: a home falhou duas vezes (header overflow); só o snippet do Bing ("Start free with real-time tools") foi visto: **não confirmado**.

### 2.12 World models como interface · Genie 3, Project Genie, Odyssey
- **Fato**: Genie 3 gera "dynamic worlds that you can navigate in real time" a 24 fps e 720p, com consistência "a few minutes" e memória visual de ~1 minuto; "promptable world events" (clima, objetos); limitações: "Clear and legible text is often only generated when provided in the input world description", "a few minutes of continuous interaction, rather than extended hours". Fonte: https://deepmind.google/discover/blog/genie-3-a-new-frontier-for-world-models/ · Página do modelo: 20–24 fps, 720p, "grounded in Street View data from Google Maps". Fonte: https://deepmind.google/models/genie/ · Project Genie: "early research prototype", "available to Google AI Ultra subscribers (18+)", "As you move, Genie creates the world around you in real-time". Fonte: https://labs.google/projectgenie
- **Fato**: Odyssey (28/5/2025): o modelo "predicts one frame at a time", gera "new, realistic video frames every 40ms", "up to 30 FPS", custo "$1-$2 per user-hour". Fonte: https://odyssey.systems/introducing-interactive-video · Hoje: Agora-1, "multiple participants—human or AI—to share and interact within the same world simulation in real-time". Fonte: https://odyssey.systems/
- **Lição**: para 2026, world model como **interface de trabalho** está fora: sem texto legível, minutos de coerência, custo por hora, protótipo pago. O que cabe é o padrão "evento promptável" como metáfora: o ambiente do modo 3D muda com o dado (local · ramo · produção), renderizado localmente. Linha para 2027: acompanhar Genie no app Gemini e o Agora-1 multiagente para a "sala compartilhada" da TV.

### 2.13 Jogos · Journey, Monument Valley
- **Fato**: Journey foi construído "like a Japanese garden", removendo "all the elements that did not fit, so the emotions they wanted to evoke would come through"; sem texto, voz ou nomes; um só sinal sonoro (o chime); busca "a sense of smallness and wonder". Fonte: https://en.wikipedia.org/wiki/Journey_(2012_video_game)
- **Fato**: Monument Valley: Ken Wong queria cada quadro digno de ser exposto; "a cross between the wonder of a toy shop and… The Lion, the Witch, and the Wardrobe"; som de "deep rumbles" e "clicks" de mecanismo. Fonte: https://en.wikipedia.org/wiki/Monument_Valley_(video_game)
- **Lição**: calma vem de **subtração** e de **um só canal** por sentido (um chime; um ping "espera"). A Máquina com "gaveta abre, engrenagem gira 60°" já é o "click" do Monument Valley.

### 2.14 Cinema · Arrival, Her
- **Fato**: em Arrival, os logogramas são de Martine Bertrand; a sala da nave, de Patrice Vermette, inspirada em James Turrell: "I wanted the simplicity and the sensorial experience you feel in a room like that."; a grande tela branca da sala unifica com a janela da casa e a tela da aula. Fonte: https://en.wikipedia.org/wiki/Arrival_(film) · Artigo da Wired sobre os logogramas: **não confirmado** (domínio bloqueado).
- **Fato**: em Her, o fotógrafo Hoyte van Hoytema "sought to eliminate the color blue as much as possible, feeling it was too well associated with the sci-fi genre", para dar às outras cores "a specific identity"; referência Rinko Kawauchi. Fonte: https://en.wikipedia.org/wiki/Her_(2013_film) · Declarações de K.K. Barrett (design de produção): **não confirmado** (Wired e Architectural Digest bloqueados).
- **Lição**: "tecnologia que parece viva e calma" no cinema é **uma superfície só** (a tela branca de Turrell) e **uma cor a menos** (sem azul). No Babel: um chão só (`--s0`) e o roxo fora do texto.

### 2.15 Calm technology (Case, sobre Weiser e Brown)
- **Fato**: "Technology should require the smallest possible amount of attention" · "should inform and create calm" · "should make use of the periphery" · "can communicate, but doesn't need to speak" · "should work even when it fails" · "The right amount of technology is the minimum needed to solve the problem". Fonte: https://calmtech.com/
- **Lição**: a meia-vida e o rodapé de oito casas são periferia; a coluna de intensidade da TV "comunica sem falar".

---

## 3. AI slop · o que é e os sinais que denunciam

- **Definição**: "digital content made with generative artificial intelligence that is perceived as lacking in effort, quality, or meaning, and usually produced in high volume to gain advantage, to earn money, or to deceive people"; pesquisa de jan/2026 dá três propriedades prototípicas: **superficial competence, asymmetric effort, mass producibility**; defeitos recorrentes: texto ilegível ("Coca-Coola"), anatomia impossível, dedos soltos, "glossy, uncanny aesthetic lacking authentic detail"; "slop" foi palavra do ano de 2025 na Merriam-Webster e na American Dialect Society (a página da Merriam-Webster devolveu 403: **confirmado só via Wikipedia**). Fonte: https://en.wikipedia.org/wiki/AI_slop
- **Willison (8/5/2024)**: "Not all AI-generated content is slop. But if it's mindlessly generated and thrust upon someone who didn't ask for it, slop is the perfect term." Fonte: https://simonwillison.net/2024/May/8/slop/
- **Lista de rejeição dura (Vercel)**: "decorative gradients, gradient text, glows, blobs, stripes, textures, grid backgrounds, glass effects, paper simulations, colored side rails, ornamental shadows, and fake depth"; "auto-scrolling marquees, simulated typing cursors, or decorative pulsing status indicators". Fonte: https://vercel.com/design
- **Movimento sem propósito** (NN/g, 21/9/2014): "Movement in a person's peripheral vision triggers a stimulus-driven shift in visual attention"; usuários: "was nice the first time, but now it's getting annoying"; "just because you can implement an animation, it doesn't mean that you should". Fonte: https://www.nngroup.com/articles/animation-usability/ · (12/1/2020): animação serve a feedback, mudança de estado, orientação espacial e significantes; deve ser "subtle, unobtrusive, and brief"; usar animação para "hijack the users' attention or create a fear of loss is a dark pattern". Fonte: https://www.nngroup.com/articles/animation-purpose-ux/

**Os sinais que denunciam (lista de aceite, cada item com a fonte acima)**: (1) degradê roxo/azul como fundo ou em texto [Vercel]; (2) glow, halo, neon permanente [Vercel; HIG "sparingly"]; (3) partículas, grão, "campo de estrelas" sem significado [Vercel "blobs, textures"; Config só usa partícula porque significa "ideia nascendo"]; (4) rostos genéricos e anatomia errada [Wikipedia]; (5) texto ilegível dentro da imagem [Wikipedia; Genie 3 não gera texto legível]; (6) movimento sem dado (marquee, cursor que digita, ponto pulsante) [Vercel; HIG "Don't add motion for the sake of adding motion"]; (7) brilho "glossy" sem detalhe [Wikipedia]; (8) vidro/refração sobre conteúdo denso [HIG; Linear]; (9) loop em ferramenta de 8 horas ("nice the first time… annoying") [NN/g]; (10) mídia "thrust upon someone who didn't ask for it": imagem/ilustração gerada que ninguém pediu (cover do Sonhar, ilustração da semana) [Willison].

---

## 4. Craft de vídeo dentro de UI (regras com fonte)

| Regra | Fonte lida |
|---|---|
| Autoplay só sem áudio: "Autoplay blocking is not applied to `<video>` elements when the source media does not have an audio track, or if the audio track is muted"; `play()` devolve Promise e rejeita com `NotAllowedError`; `navigator.getAutoplayPolicy()` diz `allowed` / `allowed-muted` / `disallowed` (neste caso: `poster`). | https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay |
| iOS (25/7/2016): `<video muted>` autoplay sem gesto; `playsinline` não entra em tela cheia; "If a `<video>` element gains an audio track or becomes un-muted without a user gesture, playback will pause."; GIFs "up to twelve times as expensive in bandwidth and twice as expensive in energy use". | https://webkit.org/blog/6784/new-video-policies-for-ios/ |
| Os quatro atributos: `autoplay loop muted playsinline`; GIF 3,7 MB → MP4 551 KB → WebM 341 KB; vídeo sem `poster` não conta como LCP. | https://web.dev/articles/replace-gifs-with-videos |
| `poster` "so that viewers have an idea of the content as soon as the element loads"; `preload` none/metadata/auto; "Chrome buffers 25 seconds of video on desktop but none on iOS or Android." | https://web.dev/articles/video-and-source-tags |
| WCAG 2.2.2: "For any moving, blinking or scrolling information that (1) starts automatically, (2) lasts more than five seconds, and (3) is presented in parallel with other content, there is a mechanism for the user to pause, stop, or hide it". | https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html |
| WCAG 2.3.3: "Motion animation triggered by interaction can be disabled, unless the animation is essential"; parallax é o exemplo do dano. | https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html |
| `prefers-reduced-motion` é **reduzir, não remover**: feedback essencial fica, "parallax scrolling, zooming effects" saem; dano real: "dizziness, nausea, and migraine headaches". | https://web.dev/articles/prefers-reduced-motion |
| Loop sem emenda: método das duas metades (`GERACAO_REPLICATE.md` regra 6: nunca primeiro = último quadro) e, quando for emendar dois clipes, `xfade=transition=fade:duration=1:offset=5` do ffmpeg ("Apply cross fade from one input video stream to another"). | https://ffmpeg.org/ffmpeg-filters.html#xfade · `docs/design/GERACAO_REPLICATE.md` |
| Vídeo nunca atrás de texto: "Don't use Liquid Glass in the content layer"; Linear: "Refraction can make dense professional interfaces harder to read". | §2.1 e §2.4 |
| Motion cancelável e curto; nada frequente anima. | HIG Motion (§2.1) |

**Vídeo como material, não como cena**: nos casos lidos, o vídeo sério em UI é (a) **chão** que não compete com texto (Apple: o material está nos controles; o conteúdo fica limpo), (b) **luz** que informa (Glyph, Dynamic Island) ou (c) **presença** de algo real (o navegador do agente, a miniatura de prova). Nunca é "atmosfera".

---

## 5. O manual · mídia gerada num app sério (Babel Coop)

Base: `CONCEITO.md` §7 e `GERACAO_REPLICATE.md` §1 (o kit depois do corte). Este manual **não remove nada** de `FUNCOES.md`; ele diz onde a mídia gerada entra, o que ela significa, e onde nunca entra. Modelos citados são os slugs confirmados na Replicate em 23/9/2026.

### 5.1 Onde entra (sete lugares, cada um com metáfora)

| # | Lugar | O que é | Metáfora do serviço | Modelo / receita | Portão | `prefers-reduced-motion` | Custo (US$) |
|---|---|---|---|---|---|---|---|
| 1 | **Abertura (Entrada, 1º login com token)** | Base: o "b" em SVG que se desenha (1,2 s, custo 0). Candidato: clipe de 4 s N→A, 720p, sem áudio, é a própria tela de login sobre `#060b16` | O token convoca; a marca se escreve **uma vez** e vira o b estático do topo (HIG: não faça esperar; qualquer tecla pula) | keyframes A e N em `google/nano-banana-2` (referência `babel-logo.png`) → rascunho `bytedance/seedance-2.0-fast` (`image` = N, `last_frame_image` = A, 480p) → final `wan-video/wan-2.7-i2v` (`first_frame` = N, `last_frame` = A, seed 19770815, `enable_prompt_expansion false`, `-an`) | keyframes aprovados antes; quadro 0 e último indistinguíveis de N e A; **rejeitar se aparecer halo**; só entra se 3 pessoas o preferirem ao SVG lado a lado | b estático | 0,40 + 0,70 (teto 1,40) |
| 2 | **Ícones da casca e da Máquina (61)** | Família em SVG nativo, traço 1,5 px, `currentColor`, estáticos | "A mesma mão": o instrumento é um só objeto; cada ícone é rótulo de função, nunca enfeite | `recraft-ai/recraft-v4-svg`, bloco de prompt idêntico, um sujeito por chamada, `sed` → `currentColor`, `svgo`, sprite `<symbol>` | portão de 3 (`stroke` vs `fill`): se vier preenchido, os 61 são desenhados à mão | não anima | 0,24 + 6,34 |
| 3 | **Marca em material chapado (keyframes A e N)** | Dois PNG 2K: o b chapado em `--texto` e o começo do traço em `--t0` | O material da marca é **um só** (chapado, fosco); serve de `poster` do clipe e de imagem estática de compartilhamento | `google/nano-banana-2`, `aspect_ratio 1:1`, `resolution 2K`, `png` | sem glow, sem halo, sem degradê (prompt negativo); diferença ≤ 1 nível contra o SVG | é a imagem final | 0,40 |
| 4 | **Peças orgânicas da Máquina (Portaria, Cofre)** | Geometria `.glb` ≤ 120 KB; albedo descartado; pele = matcap da casa em canvas | O backend **tem forma física**: a IA dá a geometria, a casa dá o material (Vercel: exploração → código; Figma: textura da IA, sistema da mão) | folha de estilo `nano-banana-2` 1K → keyframe por peça `black-forest-labs/flux-2-max` (`input_images`, seed) → `bria/remove-background` → `firtoz/trellis` (`images` array, seed fixa, `mesh_simplify 0.95`) → `gltfpack -cc -tc`; traseira do Cofre em `tencent/hunyuan3d-2mv` | 3 seeds por peça; aceita a que fecha o cubo de 1 unidade sem furo; contraste WCAG conferido | só cor e texto (tabela §11 do CONCEITO) | ≈ 1,9 |
| 5 | **Chão da TV = a Máquina do projeto em 3D** | A zona "evolução dos projetos" do painel mostra a Máquina real do projeto (peças em DOM/three.js + as duas geometrias do item 4), câmera fixa, luz fixa; **muda só quando o backend muda** (crossfade 400 ms); em espera, chão liso + b (CONCEITO §3.5) | "O que a equipe construiu **existe e tem forma**"; o "evento promptável" do Genie 3 vira evento de dado: peça nova aparece, chave faltando acende `--atencao`, ambiente troca em local · ramo · produção | zero geração além do item 4; render local; leitura do Supabase real (FUNCOES B) | troca imediata, sem crossfade | 0 |
| 6 | **Retrato do agente (opcional, em "Pôr foto → Gerar")** | Uma imagem estática, isométrica, chapada, no bloco-base §3.4 do GERACAO: **um objeto que diz o que o agente faz** (uma lupa, uma chave inglesa, um telefone); nunca rosto, nunca pessoa; vai dentro do quadrado de 14 px (na casca) e em ≥ 24 px no Perfil e na parede | O agente é **ferramenta com dono** (quadrado × círculo, lei da casca): tem cara de instrumento, herda a cor da pessoa, não finge ser gente (sinais 4 e 7 do §3) | `google/nano-banana-2` 1K, bloco isométrico + `[PIECE] a <objeto>`, `bria/remove-background`, PNG com alfa; só a pedido da pessoa, um por agente | a pessoa aprova antes de salvar; rejeitar qualquer rosto, letra ou brilho | é estática | 0,10 + 0,018 cada |
| 7 | **Som "espera"** | Ping ≤ 300 ms, desligado por padrão, só após gesto, nunca na TV/iPad | O agente precisa de você e você olhou para outro lado: **um** canal sonoro, como o chime de Journey | oscilador Web Audio primeiro (custo 0); `stability-ai/stable-audio-2.5` (`duration 3`, `steps 8`, seed) só se o oscilador soar barato a 3 pessoas | pico ≥ −6 dBFS nos primeiros 30 ms; `silenceremove` + `loudnorm` | sem som (é preferência, não motion) | 0 – 0,40 |

Lugares que o pedido listou e **onde a resposta é "CSS, não mídia gerada"**, com o motivo:
- **Presença de agente**: anel de 14 px + "pensando há 4 s" medido + borda tingida 12 %. Dynamic Island: "Focus on the most important information", "Don't add elements… that draw attention". Vídeo de "pensando" é o sinal 6 do slop.
- **Transição de estado**: crossfade 180 ms na mesma aba, 400 ms na TV; a Máquina troca cor e faz o gesto físico (gaveta, engrenagem 60°, cadeado). HIG: "avoid adding motion to UI interactions that occur frequently".
- **Celebração (meta a 100 %)**: anel fecha em 800 ms, uma vez, `--ouro` chapado; e o rito de sexta: "Retrospectiva da semana" na TV = as 7 linhas da evolução + fala humana em Cormorant, em sequência de telas (Wrapped: dado em sequência com convite a compartilhar), sem imagem gerada.

### 5.2 Onde nunca entra (lista fechada)

Atrás de texto de trabalho (CONCEITO §3.2) · no Registro, na árvore, no rodapé, no campo ❯ · nos vazios ("Nada aberto · Ctrl K" liso) · como loop na TV ou na Estação (uma ferramenta de 8 h; NN/g "nice the first time… annoying"; CONCEITO cortou loop da logo, campo profundo e loop da TV) · como "fundo que respira" · como animação de "agente pensando" · como partículas, confete ou fogos na meta · como rosto de agente ou de pessoa · como ilustração do Sonhar, da pergunta da semana, da ideia falada ou do aviso (Willison: ninguém pediu) · atrás de Cormorant na TV · em insígnias e níveis · no chat e no WhatsApp · em cartões da Loja além do ícone · em qualquer lugar sem evento de dado que a dispare (CONCEITO §11) · vídeo com alfa, Lottie/Rive em runtime (CONCEITO §8) · texto dentro de imagem gerada (o modelo erra; Genie 3 não gera texto legível).

### 5.3 O portão (sete perguntas; uma resposta "não" barra)

1. É **metáfora do serviço** (diz algo sobre cooperar com agentes ou sobre o que a equipe construiu)?
2. Tem um **dado real que a dispara** e um estado final estático útil quando ela para?
3. Fica **fora do texto de trabalho** e fora do caminho da leitura (periferia, HIG/NN/g)?
4. Nasceu de **keyframe aprovado, com seed fixa e referência** (REGRA 1 do PROMPT_AGENTICO; `MANIFESTO.json`)?
5. Passa nos **dez sinais** do §3 (sem degradê roxo, glow, partículas, rostos, texto ilegível, movimento sem dado, glossy, vidro sobre conteúdo, loop, mídia não pedida)?
6. Tem **desligamento** (`prefers-reduced-motion`, pausa se > 5 s, `poster`, `muted playsinline`)?
7. **Ganha lado a lado da versão de custo zero** (CSS/SVG) com 3 pessoas da equipe medindo tempo de tarefa, não nota?

### 5.4 O que é possível gerar de sistema hoje (honesto, pelos schemas confirmados)

- **Vetor nativo**: ícones e glifos em `.svg` (`recraft-ai/recraft-v4-svg`, sem seed; coerência pelo prompt idêntico). Plano B com referências: `quiverai/arrow-1.1`.
- **Imagem com referência**: `google/nano-banana-2` (até 14 imagens de entrada, 1K/2K/4K, sem seed) e `black-forest-labs/flux-2-max` (seed, até 8 referências): keyframes da marca, folhas de estilo, retratos-objeto.
- **Vídeo curto dirigido**: `wan-video/wan-2.7-i2v` (primeiro e último quadro, 2–15 s, 720p/1080p, seed); rascunho barato `bytedance/seedance-2.0-fast` (480p); `google/veo-3.1` gera áudio (dobra o preço). Serve para **um** momento (Entrada), não para loops.
- **Recorte**: `bria/remove-background` (`preserve_alpha`).
- **Geometria 3D a partir de imagem**: `firtoz/trellis` (US$ 0,035, MIT), `tencent/hunyuan3d-2` e `-2mv` (4 vistas), `tencent/hunyuan-3d-3.1` (prompt ou imagem). Material sempre da casa.
- **Som**: `stability-ai/stable-audio-2.5` (passar `duration`; padrão é 190 s).
- **Mundos em tempo real** (fora do runtime de 2026): Genie 3 a 720p/20–24 fps por minutos, sem texto legível, só para assinantes Ultra como protótipo; Odyssey a um quadro por 40 ms e US$ 1–2 por usuário-hora. Uso hoje: inspiração para "evento de dado muda o ambiente"; linha de 2027: sala compartilhada da TV (Agora-1 é multiagente em tempo real).
- **Ferramenta de motion como material** (Figma Motion): exporta CSS/JSON; pode virar a fonte das variáveis de easing do `tokens.css` em vez de mídia.

---

## 6. O que ninguém fez (busca por função; "não vi" não é "não existe")

1. **O chão da TV é o backend real em 3D**, com geometria gerada uma vez e pele da casa, que só muda quando o backend muda. Vercel gerou 15 mil e publicou um shader de ferrofluido (bonito, sem dado); Figma pôs partículas que significam "ideia"; nenhum produto lido mostra **o sistema que a equipe construiu** como objeto físico no escritório.
2. **Retrato de agente como objeto, nunca rosto**, gerado a pedido no material da casa: os labs (Runway, Luma, Pika) mostram vídeo como prova do modelo; nenhum produto lido dá ao agente uma "cara de ferramenta" derivada do que ele faz, presa à cor do dono.
3. **Portão stroke/fill antes do lote de ícones** e "à mão se vier preenchido": a regra de SVG nativo existe no PROMPT_AGENTICO; o portão que decide entre IA e mão não vi em nenhum caso lido.
4. **Abertura que é a própria tela de login e termina no logo estático do cromo** (sem blend, sem splash, qualquer tecla pula), com a versão de custo zero como padrão e o clipe como candidato que precisa vencer 3 pessoas: o oposto do "loop da logo" que todo app de IA mostra.
5. **Manual de mídia gerada com metáfora obrigatória por uso** e lista fechada de "nunca": a Vercel tem a lista de rejeição, a Apple tem as regras de material, o CONCEITO tem "nada anima sem dado"; a junção (uso → metáfora → modelo → portão → desligamento → custo) numa tabela de aceite não vi publicada.
6. **Celebração como rito de dado semanal na TV** (Wrapped) sem imagem gerada, dentro de uma ferramenta de trabalho: o Wrapped é anual e de consumo; os produtos de equipe lidos (Linear, Raycast) não celebram na parede.

Não cobertos: Midjourney (site), Krea, Spotify Jam, Raycast pós-2022, abertura do Config 2026, identidade do Ship 2026, K.K. Barrett, Wired sobre Arrival, Merriam-Webster (403).

---

## 7. Armadilhas

- **Gerar antes de ter o dado**: tudo no §5.1 depende de FUNCOES B (Máquina lendo o Supabase) e do token de verdade; sem isso, o chão da TV em 3D é maquete e o clipe de Entrada é splash.
- **Confundir exploração com produto**: 15 mil gerações da Vercel não entraram no site; entrou um shader. Se o artefato novo mostrar as gerações como "o visual", já é slop.
- **Tripofobia e afins**: a Vercel derrubou o ferrofluido em revisão interna; geometria orgânica (Portaria, Cofre) precisa de revisão com 3 pessoas antes de virar `.glb`.
- **O modelo não escreve**: nenhum texto dentro de imagem ou vídeo gerado (Genie 3 e o "Coca-Coola" da Wikipedia).
- **Loop numa ferramenta de 8 horas**: o que encanta uma vez irrita na quinta (NN/g); o CONCEITO já cortou os loops e este manual não os traz de volta.
- **Refração e vidro em conteúdo denso**: Linear recusou; a paleta Ctrl K é o único vidro.
- **Imposto da novidade** (Arc, Rabbit): cada mídia nova precisa do plano de retirada por peça (CONCEITO §13); o §5.1 já lista a versão de custo zero de cada item.
- **Saídas da Replicate expiram em 1 h**; `MANIFESTO.json` sem token; trocar o token ao fim da missão.
- **Autoplay com áudio** bloqueia e pausa (WebKit); som só depois de gesto e nunca na TV/iPad.
- **`prefers-reduced-motion` global a 0,01 ms apaga feedback útil**: usar a tabela por peça (CONCEITO §11).
- **"Não vi" não é "não existe"**: a anterioridade do §6 vale para os produtos lidos; ferramentas de governança de agentes e labs de 2026 não foram cobertos.

---

## 8. Fontes

### Lidas (60)
- Apple: https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/ · https://www.apple.com/newsroom/2022/09/apple-debuts-iphone-14-pro-and-iphone-14-pro-max/ · https://developer.apple.com/tutorials/data/design/human-interface-guidelines/materials.json · https://developer.apple.com/tutorials/data/design/human-interface-guidelines/motion.json · https://developer.apple.com/tutorials/data/design/human-interface-guidelines/live-activities.json
- Vercel: https://vercel.com/blog/designing-and-building-the-vercel-ship-conference-platform · https://vercel.com/blog/vercel-ship-2026-recap · https://vercel.com/blog · https://vercel.com/ship · https://vercel.com/design · https://vercel.com/geist/introduction
- Figma: https://www.figma.com/blog/the-visual-identity-behind-config-2026/ · https://www.figma.com/blog/config-2026-recap/ · https://www.figma.com/blog/introducing-figma-motion/ · https://www.figma.com/blog/ · https://config.figma.com/
- Linear: https://linear.app/now · https://linear.app/now/behind-the-latest-design-refresh · https://linear.app/now/linear-liquid-glass · https://linear.app/now/output-isn-t-design · https://linear.app/blog/how-we-redesigned-the-linear-ui
- Raycast: https://www.raycast.com/blog · https://www.raycast.com/blog/a-fresh-look-and-feel
- Arc: https://browsercompany.substack.com/p/letter-to-arc-members-2025 · https://arc.net/
- Nothing: https://en.wikipedia.org/wiki/Nothing_(company) · https://intl.nothing.tech/about · https://nothing.tech/
- Teenage Engineering / Rabbit: https://en.wikipedia.org/wiki/Teenage_Engineering · https://teenage.engineering/ · https://en.wikipedia.org/wiki/Rabbit_r1 · https://www.rabbit.tech/rabbit-r1
- Spotify: https://en.wikipedia.org/wiki/Spotify_Wrapped · https://newsroom.spotify.com/2025-12-03/2025-wrapped/ · https://www.spotify.com/wrapped/
- Labs: https://runway.com/ · https://lumalabs.ai/ · https://pika.art/ · https://en.wikipedia.org/wiki/Midjourney
- World models: https://deepmind.google/discover/blog/genie-3-a-new-frontier-for-world-models/ · https://deepmind.google/models/genie/ · https://labs.google/projectgenie · https://odyssey.systems/ · https://odyssey.systems/introducing-interactive-video
- Jogos e cinema: https://en.wikipedia.org/wiki/Journey_(2012_video_game) · https://en.wikipedia.org/wiki/Monument_Valley_(video_game) · https://en.wikipedia.org/wiki/Arrival_(film) · https://en.wikipedia.org/wiki/Her_(2013_film)
- Calm tech: https://calmtech.com/
- AI slop: https://en.wikipedia.org/wiki/AI_slop · https://simonwillison.net/2024/May/8/slop/
- Motion e vídeo: https://www.nngroup.com/articles/animation-usability/ · https://www.nngroup.com/articles/animation-purpose-ux/ · https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html · https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html · https://web.dev/articles/prefers-reduced-motion · https://web.dev/articles/video-and-source-tags · https://web.dev/articles/replace-gifs-with-videos · https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay · https://webkit.org/blog/6784/new-video-policies-for-ios/ · https://ffmpeg.org/ffmpeg-filters.html#xfade
- Internas: `docs/design/CONCEITO.md` · `docs/design/GERACAO_REPLICATE.md` · `docs/FUNCOES.md` · `~/Desktop/stack-video-scroll/PROMPT_AGENTICO_LP.md`

### Tentadas e não lidas (não confirmado)
https://www.midjourney.com/home e /explore (403) · https://www.krea.ai/ (header overflow, 2×) · https://www.wired.com/2016/11/arrivals-designers-crafted-mesmerizing-alien-alphabet/ (bloqueado) · https://www.architecturaldigest.com/story/her-movie-set-design (bloqueado) · https://www.merriam-webster.com/wordplay/word-of-the-year (403) · https://spotify.design/ (redireciona para o player) · https://developer.apple.com/design/human-interface-guidelines/* (HTML vazio; lido pelo JSON) · https://trac.ffmpeg.org/wiki/Xfade (403; lido em ffmpeg.org) · https://blog.google/technology/google-labs/project-genie/ (404; lido em labs.google) · buscas no DuckDuckGo (CAPTCHA) e no Bing (resultados irrelevantes para consultas longas).
