# Frente: peças que parecem 3D em interface 2D, com contenção · a gramática física da Máquina

> Missão `babel-coop/design-2030` · aceite A9 · 23/09/2026 · pesquisa com WebFetch (o orçamento de WebSearch da sessão acabou em 200 buscas; a partir daí toda fonte foi aberta por URL direta).
> Regra: cada achado tem a URL **efetivamente lida**. O que veio só de trecho de busca está marcado. Páginas que devolveram só o título, 403 ou 404 estão listadas no fim e **não** são usadas como fonte.
> Contexto lido antes: `docs/MAQUINA.md`, `prototipo/maquina.js`, `prototipo/visual3d.js`, `prototipo/v3.css` (linhas 241–295 e 337–341), `prototipo/base.css` (tokens e bloco `prefers-reduced-motion`), `IDEIAS.md` 5.17–5.19 e 10, `stack-video-scroll/PROMPT_AGENTICO_LP.md`, `.deus/missao-design/MISSAO.md`, e o fim de `pesquisa/apps-futuristas.md` (para não repetir o que a frente irmã já cobriu: Linear, Raycast, Nothing, TE, visionOS e Liquid Glass entraram lá pela ótica das três colunas; aqui entram pela ótica da **peça como objeto**).

## 0. Resumo em dez linhas

1. A resposta à pergunta "como uma peça parece 3D sem virar parque" já foi dada três vezes pela história: iOS 7 (2013) trocou textura por **camadas + movimento**; visionOS (2023) disse "**prefira profundidade sutil, é fácil exagerar**" e "**texto sempre plano**"; Liquid Glass (2025) reservou o vidro à **camada de navegação** e proibiu **vidro sobre vidro**. A Máquina segue as três.
2. O que deu errado nas duas tentativas anteriores de "objeto na tela": o skeuomorfismo do iOS 6 (metáforas obsoletas, inconsistência, ocupa espaço) e o neumorfismo (contraste 1:1 por construção, borda invisível, morto em 2021). A gramática abaixo evita os dois com uma regra: **a extrusão é de 2 px, a borda tem ≥ 3:1 e o estado nunca é só cor**.
3. Profundidade no escuro não vem de sombra: vem de **escada de superfície** (Raycast: quatro degraus, zero drop-shadow; Linear 2026: barra lateral "alguns tons mais escura" para o conteúdo vir à frente). Sombra entra só como assinatura de "tem corpo", em camadas e tingida do fundo (Comeau), com **uma fonte de luz** para todas as peças.
4. **Isometria de cena não serve à Máquina** (texto em ângulo é ilegível; remete a jogo). Isometria serve aos **glifos** das peças: um jogo de ícones em SVG nativo, mesmo ângulo (TrueISO ou frontal, como o 3dicons), mesma luz, gerado numa leva só com seed fixa. Substitui os emojis atuais (Nothing: "no emoji as UI").
5. **CSS 3D de verdade só onde há metáfora**: a frente da gaveta que "abre" 2 px, a Tela que é um painel emissor. `perspective` no pai (800 px é o valor moderado que a CSS-Tricks usa), `transform-style: preserve-3d` no filho, e a lista do que **achata** o 3D sem avisar (`overflow`, `opacity<1`, `filter`, `clip-path`, `mix-blend-mode`).
6. **three.js só no modo 3D da Tela** (que já existe): CSS3DRenderer para os iframes ("não dá para usar materiais nem geometrias do three.js; só zoom 100 %") + WebGL para chão, placas, fios e pulsos. As placas do backend usam a **mesma escada e o mesmo material** do 2D, para que o 3D pareça a mesma peça vista de outro ângulo, não outro mundo.
7. O **fio** é um cabo com pinos: pontos de 6 px nas bordas (handles, como o React Flow), curva em S por baixo das peças, e o pulso é **um ponto que corre pelo caminho** (`<animateMotion>`/`offset-path`), verde ou vermelho. O fio em si não acende em laço: só o ponto e a peça que o recebe.
8. **Lego é sistema, não estética**: "peças de 1958 ainda encaixam nas de hoje"; tolerância de 10 µm; "um sistema universal". Na Máquina isso vira: um passo de grade único (8 px), um pino único, um raio concêntrico (Apple: raio interno = raio do pai − padding), e presets que encaixam em qualquer projeto porque as peças são as mesmas.
9. Orçamento de desempenho num Mac comum: 10 ms úteis por quadro; só `transform` e `opacity` pulam layout e paint; `will-change` ligado e desligado por script, nunca no stylesheet; `backdrop-filter` "pode prejudicar o desempenho, teste antes" → **no máximo dois elementos com vidro** (a Ficha e o HUD do teste); Spline recomenda ≤ 3 luzes e 1–2 embeds por página; pixel ratio capado em 1,5 (regra do PROMPT_AGENTICO).
10. `prefers-reduced-motion` no protótipo hoje zera **todas** as animações com `!important`, o que apaga o pulso inteiro (a informação "verde passou / vermelho barrou" some). A regra certa é **reduzir, não remover**: o ponto não anda, mas o fio muda de cor por 1 s e a peça de destino acende.

---

## 1. O que existe hoje (diagnóstico do protótipo)

**`maquina.js` (269 linhas).** 12 tipos no vocabulário, 8 desenhados como `<button class="mq-peca mq-<tipo>">` posicionados por `%` num palco com grade de 24 px; Empresa é uma `div` tracejada; fios são `<path>` Bézier num único `<svg viewBox="0 0 100 100">`; o pulso do "Testar" é `stroke-dasharray` andando (`@keyframes anda`) no fio inteiro; peça ativa ganha `box-shadow` ciano de 24 px (glow); peça nova entra com `encaixa` (scale 0.4 → 1, overshoot `cubic-bezier(0.2, 1.4, 0.4, 1)`); ícones são emojis (🗄 🚪 ⚙ 📦 🔐 🖥 🛂 🧪); a marca da pessoa é `border-left: 3px` na cor + avatar de 16 px (bom: já é "fita", não pintura inteira); "Ver por pessoa" põe halo de 25 %.

**`visual3d.js` (256 linhas).** three.js 0.160 por CDN; `CSS3DRenderer` para os iframes das telas (painel 1024×640 escalado para 3,2 u), `WebGLRenderer` para chão, grade, placas (`BoxGeometry 2.4×1.3×0.12`, `MeshStandardMaterial` com emissivo 0,25), fios (`TubeGeometry` sobre `CatmullRomCurve3`), pulso (`SphereGeometry 0.15` + `PointLight` 8), etiquetas em `Sprite` de canvas; luz hemisférica + direcional; `pixelRatio ≤ 2`; loop `requestAnimationFrame` sem pausa por visibilidade; `OrbitControls` com damping.

**`base.css`.** `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; … } }`: zera tudo.

**O que a gramática precisa consertar:** (a) emoji como ícone; (b) glow ciano permanente na peça ativa; (c) fio inteiro piscando em laço; (d) overshoot de 1.4 no encaixe (bounce); (e) reduced-motion que apaga a informação; (f) 2D e 3D com vocabulários diferentes (placa emissiva 3D vs. cartão plano 2D); (g) `pixelRatio` 2 e loop sem pausa; (h) nenhum material declarado: todas as peças são o mesmo cartão com degradê de topo por cor.

---

## 2. Achados (cada um com fonte lida)

### 2.1 Profundidade sem skeuomorfismo

**A1 · iOS 7: a profundidade sobreviveu; a textura, não.**
Fato (lido). Na apresentação do iOS 7 (Dezeen, 10/06/2013), Jony Ive: "True simplicity is derived from so much more than just the absence of clutter and ornamentation; it's about bringing order to complexity." Sobre as camadas: "These planes combined with new approaches to animation and motion create a sense of depth and vitality." Sobre o recuo: "we tried to create an interface that is unobtrusive and deferential, one where the design recedes and in doing so actually elevates your content."
Fonte: https://www.dezeen.com/2013/06/10/new-apple-ios-software-flat-design-jonathan-ive-wwdc/
Por que importa. A profundidade certa é **ordem** (o que está sobre o quê), não **textura** (couro, madeira). A Máquina precisa de ordem: Empresa abaixo, gavetas sobre ela, Ficha e HUD acima de tudo.
Aplicação. Três planos declarados: **bandeja** (Empresa, rebaixada), **peças** (sobre a bandeja), **flutuante** (Ficha, HUD do teste, cartões "O que muda"). Cada plano tem um degrau da escada de superfície; movimento só entre planos (a peça sobe um degrau quando o pulso chega e desce depois).

**A2 · Por que o skeuomorfismo do iOS 6 caiu.**
Fato (lido). Wikipedia "Skeuomorph": sob Jobs a Apple usou "leather, wood, and felt"; a mudança veio com a saída de Scott Forstall, "the most vocal and high-ranking proponent of the visual design style favored by Mr. Jobs", e com Ive, que "made his distaste for the visual ornamentation in Apple's mobile software known within the company". Críticas: elementos skeuomórficos "harder to operate and take up more screen space", inconsistência entre apps, e "many users may have no experience with the original device being emulated". A favor (Don Norman): skeuomorfismo "gives comfort and makes learning easier" em transições, pela affordance.
Fonte: https://en.wikipedia.org/wiki/Skeuomorph
Por que importa. A Máquina é exatamente uma **transição** (gente que não sabe backend), então a affordance de Norman vale: gaveta, cadeado, cofre, porta são metáforas que a equipe conhece. O erro a evitar é o dos três pontos: peça que ocupa espaço só para parecer objeto, inconsistência entre peças e metáfora que ninguém viveu (a "catraca" de portaria serve; um "disquete" não).
Aplicação. Metáfora só nas **12 palavras** e no **glifo**; a forma da peça continua um cartão de trabalho (denso, alinhado). Nenhuma peça tem textura de material real (grão de madeira, couro): o "material" é só cor de superfície + 1 px de especular + 2 px de espessura.

**A3 · Neumorfismo: o contraste 1:1 por construção.**
Fato (lido). Wikipedia: o mockup de Alexander Plyuto no Dribbble "quickly blew up to 3,000 views"; o nome (Jason Kelly, 2019) junta "neo" e "skeuomorphism"; os elementos "are usually the same color as the background"; críticas: "lack of accessibility, difficulty in implementation, low contrast, and incompatibility with certain brands"; "takeup of neumorphism by designers had quickly declined by 2021". Axess Lab: a maioria dos exemplos é "cinza claro sobre branco", na simulação de baixa visão "botões, cartões e gráficos" somem; falta rótulo nos ícones; não se sabe o que é clicável; faltam bordas. Recomendação: texto ≥ 4,5:1, ícones/bordas/componentes ≥ 3:1 (1.4.11), rótulos visíveis, deixar explícito o que é clicável, e "usar dark mode quando possível (oferece melhores contrastes)".
Fontes: https://en.wikipedia.org/wiki/Neumorphism · https://axesslab.com/neumorphism/
Por que importa. A tentação de "extrudar do fundo" (peça da mesma cor do palco, só sombras) é a mais próxima do pedido "hardware virtual", e é exatamente a que falha.
Aplicação. Regra dura da gramática: **a peça nunca tem a cor do palco**; cada peça tem borda hairline com ≥ 3:1 contra o que a cerca; os estados (alerta, aberta, faltando) têm **texto**, não só cor; o palco escuro ajuda (Axess Lab).

**A4 · Rams: discreto, honesto, mínimo.**
Fato (lido). Vitsoe, os dez princípios: "Good design is unobtrusive: Products fulfilling a purpose are like tools. They are neither decorative objects nor works of art." "Good design is honest: It does not make a product more innovative, powerful or valuable than it really is." "Good design makes a product understandable: It clarifies the product's structure. Better still, it can make the product talk." "Good design is thorough down to the last detail: Nothing must be arbitrary or left to chance." "Good design is as little design as possible: Less, but better."
Fonte: https://www.vitsoe.com/us/about/good-design
Por que importa. "Fazer o produto falar" é literalmente a frase modelo de cada peça ("guarda os Pacientes"). "Honesto" proíbe uma peça parecer mais sólida do que o código é: por isso peça em construção **não tem corpo** (tracejada, sem espessura, sem sombra) até a migração aplicar.
Aplicação. A espessura de 2 px e a sombra são **conquistadas** pela peça quando ela existe de verdade no banco. Antes disso, é um contorno.

**A5 · Nothing: sem sombra, sem blur; percussivo, não fluido.**
Fato (lido). Skill de design da Nothing (repositório de dominikmartn): "No shadows. No blur. Flat surfaces, border separation."; vermelho `#D71921` "is not part of the hierarchy. It's an interrupt — 'look HERE, NOW.'"; dot matrix "only for hero moments"; "Percussive, not fluid. Imagine UI sounds: click not swoosh"; sem "bounce easing", "apenas ease-out sutil"; sem parallax; sem "emoji como UI"; diferenciar dados "por opacidade antes de cor".
Fonte: https://github.com/dominikmartn/nothing-design-skill/blob/main/nothing-design/SKILL.md
Por que importa. É o extremo oposto do vidro; mostra que "parecer objeto" pode vir de **borda e tipografia** sozinhas. E dá duas regras de motion que a Máquina precisa: encaixe percussivo (clique, não swoosh) e alarme como interrupção única.
Aplicação. O `encaixa` deixa de ter overshoot 1.4 (bounce) e vira 240 ms `ease-out` com assentamento de 1 px; o vermelho de alerta é o único vermelho da tela; emojis saem.

**A6 · Teenage Engineering: cor por função, mono para rótulo, nada de suavizar.**
Fato (lido). Blake Crosley: "Orange and black is not a color choice but a design manifesto: industrial, high-visibility, unapologetic."; "Monospaced type signals precision and engineering without explicit messaging."; OP-1: "four rotary encoders" sempre mapeados a quatro parâmetros visíveis; "Constraints breed invention"; o que não fazem: sem arredondar bordas, "sem skeumorfismo (disfarçar digital como físico)", "nenhuma suavização por sombra", parafusos e materiais aparentes.
Fonte: https://blakecrosley.com/guides/design/teenage-engineering
Por que importa. A TE é a referência mais próxima de "hardware virtual" que **não** é skeuomórfica: o objeto parece máquina porque é **rotulado como máquina** (mono, caps, cor de função), não porque imita.
Aplicação. Nome técnico da peça em mono caps 10 px apagado ("TABELA · pacientes"); cor de acento **por função** e não por peça: verde = passou, vermelho = barrou/alerta, âmbar = robô disparou/mudança não publicada, ciano = ao vivo (cano). As peças em si são neutras (alumínio); a cor mora nos estados e nos LEDs.

**A7 · Raycast: profundidade só pela escada de superfície.**
Fato (lido). DESIGN.md: "The system has no drop-shadow elevation at all. Depth is built entirely from the surface-color ladder: each notch lighter on the dark scale reads as one step closer to the viewer." Canvas `#07080a` → surface `#0d0d0d` → elevated `#101111` → card `#121212`; hairline `#242728` "the universal 1px card border"; keycap com degradê `#121212 → #0d0d0d`, "physical-key feel on a flat dark canvas"; raios "cluster tightly between 4 and 16px, with most chrome at 6–10px".
Fonte: https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/raycast/DESIGN.md
Por que importa. É a prova de que "mais perto do olho = um degrau mais claro" funciona como única regra de elevação no escuro, e que um objeto físico (a tecla) pode nascer de um degradê de 2 tons.
Aplicação. Escada da Máquina em 5 degraus (palco → bandeja → peça → frente/pino → flutuante). A "frente da gaveta" é o keycap: degradê de um degrau só.

**A8 · Linear 2026: "elementos não devem competir por atenção que não conquistaram".**
Fato (lido). "A calmer interface for a product in motion" (Charlie Aufmann, Maxime Heckel, 12/03/2026): paleta "de um matiz fresco e azulado" para "um cinza mais quente que ainda se sinta nítido, mas menos saturado"; "reduz o uso de ícones, redimensiona seus tamanhos e remove tratamentos visuais desnecessários como fundos de ícone de equipe coloridos"; "Arredondando as bordas e suavizando o contraste, a interface refinada oferece aos usuários estrutura na página sem desordenar"; barra lateral "alguns tons mais escura, permitindo que a área de conteúdo principal tomasse precedência"; "A maior parte do que torna o software bom é o que você provavelmente não verá."
Fonte: https://linear.app/now/behind-the-latest-design-refresh
Por que importa. Confirma a escada (lateral mais escura que o meio) e alerta contra "fundos coloridos por equipe": a **marca da pessoa** não pode ser a peça pintada.
Aplicação. Marca da pessoa = fita de 3 px + avatar (como já está); "Ver por pessoa" acende um halo de 25 % **só enquanto o botão está ligado**. O palco da Máquina é um degrau mais claro que a coluna da esquerda e que o terminal.

### 2.2 Vidro, luz e o que emite luz

**A9 · Liquid Glass: lente, nunca vidro sobre vidro, só na camada de navegação.**
Fato (lido). WWDC25 219 "Meet Liquid Glass": "The primary way Liquid Glass visually defines itself is through something called Lensing."; "avoid applying the material to both layers… always avoid glass on glass"; "it is best reserved for the navigation layer that floats above the content of your app"; sobre uma tabela: "making it Liquid Glass would make it compete with other elements and muddy the hierarchy. So keep it in the content layer"; ao crescer: "It casts deeper, richer shadows, has more pronounced lensing and refraction effects"; "They also flip from light to dark based on the background". WWDC25 356: "Instead of relying on decoration, hierarchy should be expressed through layout and grouping."; "Concentric shapes calculate their radius by subtracting padding from the parent's."; "Capsules… in dense desktop environments, they're best used for standout actions."; "When there's no clear shorthand, a text label is always the better choice."
Fontes: https://developer.apple.com/videos/play/wwdc2025/219/ · https://developer.apple.com/videos/play/wwdc2025/356/
Por que importa. As peças da Máquina são **conteúdo** (a tabela do exemplo da Apple). Vidro nelas "compete e embaça a hierarquia". Vidro cabe no que flutua: Ficha, HUD do teste, cartão "O que muda".
Aplicação. `backdrop-filter` em ≤ 2 elementos, sempre flutuantes; peças opacas. Raios concêntricos: bandeja Empresa 14 px, gaveta 10 px (14 − 4 de padding), frente da gaveta 6 px, pino 999. Cápsula só nos botões de ação do topo (Testar, Publicar), como a Apple manda para desktop denso.

**A10 · visionOS: profundidade sutil, texto plano, emissores tingem vizinhos.**
Fato (lido). WWDC23 10072: "In most cases, prefer subtle depth. It's easy to overdo, making things look distracting or unrealistic. Subtle depth between elements is often enough to direct people's attention."; "Text, for example, can be distracting and difficult to read when it's 3D, especially at an angle. Keep text flat when used as an interface element."; "Any object that appears to emit light should shine color onto nearby objects. And most other objects should cast a shadow… This grounds them"; "when a modal appears, the window pushes back slightly to bring attention to it. The depth is subtle, but effective."
Fonte: https://developer.apple.com/videos/play/wwdc2023/10072/
Por que importa. Dá a regra de quem é emissor e quem é sólido na Máquina: **Tela e Cano emitem** (são a informação viva); **Gaveta, Depósito, Cofre, Portaria, Porta, Robô são sólidos** (projetam sombra). E "a janela recua quando o modal aparece" é o gesto para o Testar: o palco recua um degrau quando o HUD abre.
Aplicação. Tela tem o único glow permanente da Máquina (box-shadow colorida de baixa opacidade que "tinge" o fio ao lado); ao abrir a Ficha, o palco ganha `opacity: .92` (não blur). Texto nunca rotacionado, nem no modo 3D (etiquetas como sprites viradas para a câmera já é o que o `visual3d.js` faz: manter).

**A11 · Linear + Liquid Glass: aceitar a fisicalidade, recusar a refração.**
Fato (lido). Robb Böhnke (21/10/2025): a Linear abraçou "translucidez, profundidade e fisicalidade", mas recriou o material com "blur Gaussiano, gradiente sutil e especular highlight" em shader; "A refração também não era a escolha certa porque pode dificultar a leitura de interfaces profissionais densas."; abordagem "ProKit"; e o material espelha a acessibilidade do iOS: "quando um usuário ativa essa configuração, iOS desenha contornos sólidos ao redor de elementos de vidro. Nosso material agora espelha exatamente esse comportamento."
Fonte: https://linear.app/now/linear-liquid-glass
Por que importa. É o precedente de **conter** a tendência: pegar luz e especular, largar refração. E dá a regra de acessibilidade do vidro: com contraste aumentado, o vidro ganha contorno sólido.
Aplicação. O "vidro" da Ficha é blur 8 px + degradê de 1 degrau + especular de 1 px; nada de refração/lente. `@media (prefers-contrast: more)` → vidro vira superfície opaca com hairline forte.

**A12 · "Physicality": comportamento, não laca.**
Fato (lido). Lux (03/06/2025): o skeuomorfismo antigo era "apenas um efeito; uma laca puramente visual"; a era plana trocou sombras estáticas por "camadas dinâmicas com parallax e blur"; a fisicalidade nova é "clara, gráfica e se comporta como coisas que conhecemos" (Dynamic Island "como um líquido viscoso interativo"; Siri "como um brilho corporificado fisicamente"); no visionOS "cada elemento foi elaborado para ter senso de fisicalidade: dimensão, resposta dinâmica à luz, e lançam sombras".
Fonte: https://www.lux.camera/physicality-the-new-age-of-ui/
Por que importa. A peça "parece objeto" mais pelo **como reage** do que pelo como é pintada: a gaveta que abre 2 px quando a linha entra, o cadeado que treme quando barra, a engrenagem que gira só quando dispara.
Aplicação. Cada peça tem **um** gesto físico próprio (tabela na seção 3), disparado por evento real, nunca em laço ocioso.

### 2.3 Isometria, axonometria e CSS 3D

**A13 · Isometria: sem ponto de fuga, 120° entre eixos.**
Fato (lido). Wikipedia: "the three coordinate axes appear equally foreshortened and the angle between any two of them is 120 degrees"; "objects drawn with isometric projection do not appear larger or smaller as they extend closer to or away from the viewer"; rotação de "approximately 35.264° (precisely arcsin 1⁄√3 or arctan 1⁄√2)"; três axonometrias: "isometric, dimetric and oblique"; nos jogos, "resurgence in recent years within the indie gaming scene".
Fonte: https://en.wikipedia.org/wiki/Isometric_projection
Por que importa. A vantagem (medidas preservadas, nada encolhe com a distância) é ótima para **ícone** e diagrama técnico; a desvantagem (todo texto fica a 30°) mata a Máquina, que é 80 % texto. E "indie gaming" é a conotação de parque que o Theus não quer.
Aplicação. **Isometria só nos glifos** (cubo da gaveta, prateleira do depósito, cofre, catraca, engrenagem, tubo, porta com seta), num jogo em SVG nativo gerado numa leva só (regra do PROMPT_AGENTICO: `recraft-ai/recraft-v4-svg`, mesmo prompt de estilo, seed fixa). A cena permanece frontal.

**A14 · 3dicons: uma câmera, uma luz, uma paleta, 120 ícones.**
Fato (lido). Smashing (2022): Blender; "dois cameras: um Normal camera e o segundo TrueISO camera"; "three points lighting setup" replicado em três conjuntos (ISO, Dynamic, Front); guias com cubos "para garantir que todos os ícones tivessem o mesmo tamanho e posicionamento"; 120 ícones × 4 estilos × 3 ângulos = 1 200+ renders; "high contrast is a better option in Blender when you work with vibrant colors".
Fonte: https://www.smashingmagazine.com/2022/05/3dicons-open-source-library-case-study-download/
Por que importa. É a receita de **consistência** que faz um jogo de peças parecer uma só família: câmera fixa, luz fixa, caixa-guia. É o que os emojis nunca darão.
Aplicação. Prompt único para os 12 glifos: "ícone isométrico, câmera TrueISO, luz principal a 45° superior esquerda, alumínio anodizado escuro, uma face iluminada, sem texto, fundo transparente, SVG"; caixa-guia 24×24 com o objeto ocupando 18×18. Um só glifo colorido por estado (o LED), o resto neutro.

**A15 · `perspective`: valor pequeno = efeito forte; cria stacking context.**
Fato (lido). MDN: "determines the distance between the z=0 plane and the user"; "Large values of perspective cause a small transformation; small values… a large transformation"; "creates a new stacking context" e "will act as a containing block for position: fixed". CSS-Tricks (Amit Sheen): usa `perspective: 800px` como padrão moderado; `preserve-3d` "copia a perspectiva… para seus filhos"; `perspective`/`perspective-origin` vão no **pai**.
Fontes: https://developer.mozilla.org/en-US/docs/Web/CSS/perspective · https://css-tricks.com/how-css-perspective-works/
Por que importa. Para uma "extrusão sutil" o valor tem que ser **grande** (1 200–1 600 px), senão a peça deforma e o texto entorta. E o stacking context novo explica bugs de z-index entre palco, fios e HUD.
Aplicação. `perspective: 1400px` no `.mq-palco`; nenhum `rotateX/rotateY` maior que 3° em peça com texto; o único uso de rotação real é a **frente da gaveta** (`rotateX(-4deg)` na abertura de 2 px) e a **Tela** no modo 3D.

**A16 · `transform-style: preserve-3d` é achatado por meia dúzia de propriedades.**
Fato (lido). MDN: forçam `flat` mesmo com `preserve-3d`: `overflow` diferente de `visible`/`clip`, `opacity < 1`, `filter`, `clip`, `clip-path`, `isolation: isolate`, `mask-image`, `mask-border-source`, `mix-blend-mode`, `contain: paint`.
Fonte: https://developer.mozilla.org/en-US/docs/Web/CSS/transform-style
Por que importa. A peça em construção com `opacity: .7` (como hoje) **perde o 3D**; a Ficha com `filter`/`backdrop-filter` idem. Ou se separa a opacidade em filhos, ou a peça tracejada é 2D mesmo (e é o que a gramática quer: sem corpo).
Aplicação. Peça nova = sem `preserve-3d` (é contorno). Peça pronta = `preserve-3d` com opacidade 1; `overflow: hidden` só nos filhos (lista de campos), nunca na peça.

### 2.4 Quando o three.js vale (e como)

**A17 · CSS3DRenderer: DOM de verdade no espaço, sem materiais nem geometrias.**
Fato (lido). JSDoc do three.js: "apply hierarchical 3D transformations to DOM elements via the CSS3 transform property"; "particularly interesting if you want to apply 3D effects to a website without canvas based rendering"; "It's not possible to use the material system of three.js"; "It's also not possible to use geometries"; "The renderer only supports 100% browser and display zoom"; pode ser usado "to combine DOM elements with WebGL content"; `CSS3DSprite` "represents DOM elements as sprites".
Fonte: https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/renderers/CSS3DRenderer.js
Por que importa. Confirma o desenho do `visual3d.js`: telas como iframes (CSS3D), o resto em WebGL. E dá a restrição que ninguém documentou no protótipo: **zoom do navegador ≠ 100 % desalinha** o painel CSS3D do WebGL.
Aplicação. Aviso na barra do modo 3D quando `window.devicePixelRatio`/zoom mudar; etiquetas em `CSS3DSprite` (texto DOM, selecionável, acessível) em vez de canvas-sprite, quando o custo permitir.

**A18 · Stripe Press: 3D só onde o objeto é o conteúdo.**
Fato (lido). webgpu.com: "Stripe Press built this nice 3D book showcase running on Three.js"; Yuin Chien (3D), Nick Jones e Philipp Antoni (Stripe); "a parallel scroll interaction where books rotate and show off their spine and cover"; cada livro "an actual three-dimensional object that rotates as you scroll"; o site privilegia "practical UI enhancement rather than just showing off what the tech can do". Sem dados de desempenho na fonte.
Fonte: https://www.webgpu.com/showcase/3d-books-by-stripe-press/
Por que importa. O 3D lá é justificado porque **o livro é o produto** (lombada e capa são o que se vende). Na Máquina, o equivalente é a **Tela**: a página real é o produto; girá-la e aproximar tem metáfora. Uma gaveta girando não tem.
Aplicação. No modo 3D, só a Tela é interativa e "gira"; as peças do backend são placas fixas, viradas para a câmera. Já é assim no `visual3d.js`; manter e não expandir.

**A19 · Spline: ≤ 3 luzes, 1–2 embeds por página, poucos polígonos.**
Fato (lido). Docs do Spline: "Quanto menos polígonos, mais rápido será renderizado/carregado"; subdivisões "no máximo 3 níveis"; "Evite adicionar imagens/texturas… (imagens, especialmente grandes, adicionam mais tempo de carregamento)"; "Recomendamos trabalhar com menos de 3 luzes por cena"; "Tente manter os materiais simples"; "usar apenas um ou dois embeds por página"; a ferramenta mostra "Estimativa de Tamanho de Exportação" e "Pontuação de Tempo de Carregamento".
Fonte: https://docs.spline.design/exporting-your-scene/how-to-optimize-your-scene
Por que importa. Mesmo o produto feito para 3D em site limita luzes e embeds: o modo 3D da Máquina tem que caber nisso (hoje: 2 luzes + 1 `PointLight` por pulso, que pode empilhar).
Aplicação. Máximo 2 luzes fixas + 1 luz de pulso reaproveitada (pool de 1); geometria das placas em `BoxGeometry` baixa; sem texturas de imagem nas placas (a cor vem do material); uma cena por aba.

**A20 · Vercel Ship: nenhum 3D; fotografia e grade.**
Fato (lido). A página do Ship 26 (15/10/2026, Palace of Fine Arts) é "centrada em fotografia e imagens de evento", "grade de layout limpo", logos em claro/escuro, contador regressivo; nenhum elemento 3D identificado. (Achado negativo, registrado para não citar "Vercel Ship 3D" sem base.)
Fonte: https://vercel.com/ship
Aplicação. Não usar Vercel Ship como referência de 3D. A referência Vercel válida para a Máquina é a Geist (grade, contraste alto), já coberta na frente irmã.

### 2.5 Fios e pulso

**A21 · React Flow: pulso como elemento que corre pelo caminho.**
Fato (lido). Docs: além da "simples animação built-in" (traço tracejado), dá para "animar um elemento SVG ao longo de um caminho usando o elemento `<animateMotion />`", ou animar um nó inteiro com `offsetPath` + `offsetDistance` (Web Animations API); "a animação continua tocando suavemente mesmo se o caminho da aresta for recalculado"; o nó animado fica `draggable: false` durante a animação.
Fonte: https://reactflow.dev/examples/edges/animating-edges
Por que importa. Troca o "fio inteiro piscando" (dasharray em laço, sem direção clara) por **um ponto com direção**: dá para ver de onde vem e para onde vai, e a cor do ponto (verde/vermelho) é o veredito.
Aplicação. `<circle r="3">` com `<animateMotion dur="0.8s" path="…">` por fio ativo, ou `offset-path: path()` em um `<span>` absoluto (isso permite `transform`-only e cai no compositor). Rastro: um segundo círculo com `opacity: .35` e `begin="+0.08s"`. O fio muda só de cor (`stroke`) por 1,2 s.

**A22 · Lego é um sistema com tolerância, não uma cor.**
Fato (lido). Wikipedia: "Six bricks of 2 × 4 studs can be combined in 915,103,765 ways"; "The machines that manufacture Lego bricks have tolerances as small as 10 micrometres"; "Lego bricks from 1958 still interlock with those made presently"; "Lego pieces of all varieties constitute a universal system"; Godtfred viu "the immense potential in Lego bricks to become a system for creative play". (As medidas em mm — pino 4,8, passo 8, altura 9,6 — não aparecem na página lida; ficam como memória, **não confirmadas**.)
Fonte: https://en.wikipedia.org/wiki/Lego
Por que importa. O que faz Lego ser Lego é **um pino só, um passo só, para sempre**. Os presets da Máquina ("o que funcionou") só encaixam em qualquer projeto se as peças tiverem exatamente a mesma interface: os mesmos pinos, no mesmo lugar, com a mesma grade.
Aplicação. Grade de 8 px; pinos sempre nas mesmas posições (entrada à esquerda, saída à direita, "quando" embaixo para robôs, "usa" em cima para telas); tamanhos das peças em múltiplos de 8; um preset é uma bolsa de peças + fios que encaixa porque os pinos batem. O glifo de pino (círculo de 6 px com anel de 1 px) é a assinatura Lego da Máquina, sem uma cor Lego sequer.

### 2.6 Sombra e luz consistentes

**A23 · Comeau: uma fonte de luz, sombras em camadas, tingidas do fundo.**
Fato (lido). "every shadow on the page should share the same ratio"; "By layering multiple shadows, we create a bit of the subtlety present in real-life shadows" (exemplo com 5 camadas 1/2/4/8/16 px); "As an element gets closer to the user, the offset should increase, the blur radius should increase, and the shadow's opacity should decrease."; "By matching the hue and lowering the saturation/lightness, we can create an authentic shadow" (exemplo `hsl(220deg 60% 50% / 0.2)`).
Fonte: https://www.joshwcomeau.com/css/designing-shadows/
Por que importa. Sombra sem regra é o que faz peças parecerem coladas de sites diferentes. Uma proporção única (x:y = 1:2, luz do alto-esquerda) e a cor do palco na sombra fazem as 12 peças parecerem no mesmo lugar, sob a mesma lâmpada.
Aplicação. Token único `--mq-luz: 1 2` e três sombras nomeadas: `--sombra-peca` (2 camadas), `--sombra-flutuante` (3 camadas), `--sombra-nenhuma` (peça em construção). Matiz 222° (o azul de `#060b16`), saturação baixa.

### 2.7 Acessibilidade em peças com profundidade

**A24 · WCAG 1.4.11: 3:1 para o que identifica o componente e o estado.**
Fato (lido). "The visual presentation of the following have a contrast ratio of at least 3:1 against adjacent color(s)": componentes de interface e objetos gráficos; vale para "visual information provided that is necessary for a user to identify that a control is present and how to operate it", incluindo estados; bordas podem ser ignoradas se "do not interfere with identifying the component"; "The visual focus indicator for a component must have sufficient contrast against the adjacent background"; exceções: componentes inativos, logos, apresentação essencial.
Fonte: https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html
Por que importa. Uma peça "extrudada" que só se distingue do palco pela sombra falha aqui. E o **cadeado**, o **LED do cofre** e o **pino** são informação de estado: têm que ter 3:1.
Aplicação. Medido nesta sessão (fórmula WCAG em awk): a hairline atual `#30334c` sobre o palco `#050a14` dá **1,61:1**; a `#42597d` do `IDEIAS.md` §10 dá **2,79:1**, ainda insuficiente; `#506b94` dá **3,65:1** sobre o palco, **3,42:1** sobre a peça `#0b1322` e **3,70:1** sobre a bandeja `#04080f` → é a hairline da gramática. Estados sobre a peça: vermelho `#ff6b6b` 6,69:1, verde `#7fd6a6` 10,68:1, âmbar `#f2a65a` 9,18:1 (todos ≥ 3:1 para glifo e ≥ 4,5:1 para texto). Foco `outline 2px` no acento (já em `base.css`). Reconferir no painel com o validador da skill `dataviz` quando os tokens finais fecharem.

**A25 · `prefers-reduced-motion`: reduzir, não remover; parallax e zoom são os vilões.**
Fato (lido). web.dev: "detects whether the user has requested the operating system to minimize the amount of animation or motion it uses"; "parallax scrolling animations can cause vestibular disorders because background elements move at a different rate than foreground elements"; "Vestibular (inner ear) disorder reactions include dizziness, nausea, and migraine headaches"; animações têm propósito legítimo (feedback, percepção de velocidade), então a recomendação é respeitar sem eliminar; padrão `window.matchMedia('(prefers-reduced-motion: reduce)')` com `change`.
Fonte: https://web.dev/articles/prefers-reduced-motion
Por que importa. O `base.css` atual zera tudo (`animation-duration: .01ms !important`): o pulso, que é **informação** ("passou"/"barrou"), some. E o modo 3D (OrbitControls com damping, câmera que se move) é a parte que mais pede cuidado.
Aplicação. Com `reduce`: o ponto do pulso não anda; o fio troca de cor e a peça de destino acende por 1,2 s, com um `aria-live` dizendo "passou pela Portaria"; encaixe vira fade; engrenagem não gira; no 3D, damping desligado, sem movimento automático de câmera, pulso aparece direto no destino. O bloco global de `base.css` deixa de usar `*` e passa a listar as animações decorativas.

### 2.8 Desempenho num Mac comum, a 60 fps

**A26 · 10 ms úteis por quadro; só `transform` e `opacity` pulam layout e paint.**
Fato (lido). web.dev "Rendering performance": "the browser has 16.66 milliseconds to produce each frame"; "all of your work needs to be completed inside 10 milliseconds"; pipeline JS → Style → Layout → Paint → Composite; `background-image`, `color`, `box-shadow` pulam layout mas **pintam**. "Stick to compositor-only properties": "Today there are only two properties for which that is true - transforms and opacity"; "every layer you create requires memory and management, and that's not free"; "Do not promote elements unnecessarily"; alvo de composição 4–5 ms.
Fontes: https://web.dev/articles/rendering-performance · https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count
Por que importa. O estado "ativa" hoje anima `box-shadow` (pinta a cada quadro) e `border-color`. Com 40 peças e 11 fios, é o que derruba o quadro.
Aplicação. Estado ativa = `transform: translateY(-1px)` + troca de classe que muda `background` uma vez (transição de 160 ms em `opacity` de um pseudo-elemento com a cor, não em `box-shadow`). Sombra fixa por plano; nunca animada.

**A27 · `will-change`: último recurso, ligar e desligar por script.**
Fato (lido). MDN: "Don't apply will-change to too many elements"; "it is a good practice to switch will-change on and off using script code before and after the change occurs"; "will-change is intended to be used as a last resort"; "Excessive use of will-change will result in excessive memory use".
Fonte: https://developer.mozilla.org/en-US/docs/Web/CSS/will-change
Aplicação. Só no início do "Testar": `will-change: transform` nas peças do caminho do pulso; removido no fim.

**A28 · `backdrop-filter` "pode prejudicar o desempenho: teste antes".**
Fato (lido). web.dev: "applies one or more filters to an element, changing the appearance of anything behind the element"; exemplo de vidro fosco `rgba(255,255,255,.3)` + `blur(.5rem)`; "Translucence, blurring, and other effects are useful ways of creating depth while keeping the context of the background content."; "Caution: backdrop-filter may harm performance. Test it before deploying."; suporte Chrome 76+, Firefox 103+, Safari 18+ (sem prefixo).
Fonte: https://web.dev/articles/backdrop-filter
Aplicação. Vidro em ≤ 2 elementos flutuantes, `blur(8px)` no máximo, e medido no Mac de referência com 40 peças. Se cair de 60 fps, a Ficha vira opaca (o fallback já é a escada de superfície).

### 2.9 Ícones e glifos

**A29 · Raycast: ícone 512 px, versão clara e escura, nunca o ícone padrão.**
Fato (lido). Docs da loja: "The published extension in the Store should have a 512x512px icon in png format"; ícones distintos para claro/escuro via `package.json`; extensões com o ícone padrão são rejeitadas; ferramenta `icon.ray.so` e modelo Figma da comunidade. No redesign de 2022 (Thomas Paul Mann): ícones outline "follow the same rules for stroke width and corner radii" (James McDonald); princípios "fast, simple, and delightful". (Sobre "ícones 3D" da Raycast e da Linear não há fonte primária lida; a página `/now` da Linear não lista post sobre ícones 3D → **não confirmado**.)
Fontes: https://developers.raycast.com/basics/prepare-an-extension-for-store · https://www.raycast.com/blog/a-fresh-look-and-feel · https://linear.app/now
Aplicação. Os 12 glifos nascem com **as mesmas regras de traço e raio** e em duas versões (sobre peça escura / sobre bandeja); nunca emoji.

---

## 3. A gramática física das 12 peças

### 3.1 Regras gerais (valem para todas)

| Regra | Valor | Fonte que sustenta |
|---|---|---|
| Vista | frontal, plano da tela; nunca isometria de cena | A10, A13 |
| Grade | 8 px; tamanhos em múltiplos de 8; pinos em posições fixas | A22 |
| Luz | uma, alto-esquerda; proporção de sombra 1:2 em toda peça | A23 |
| Escada de superfície (5 degraus) | palco `#050a14` → bandeja `#04080f` (rebaixada) → peça `#0b1322` → frente/pino `#111b2e` → flutuante `#14203a` | A7, A8 |
| Espessura ("extrusão") | `border-bottom: 2px` no tom do degrau abaixo + especular `inset 0 1px 0 rgb(255 255 255 / .06)` | A7 (keycap), A11 (especular sem refração) |
| Sombra | peça: `0 1px 2px hsl(222 40% 4% / .45), 0 4px 12px hsl(222 40% 4% / .35)`; flutuante: 3 camadas; em construção: nenhuma | A23 |
| Hairline | 1 px `#506b94` (3,65:1 sobre o palco, 3,42:1 sobre a peça, medidos) | A24 |
| Raios concêntricos | bandeja 14 → peça 10 → frente 6 → chip 4 → pino 999 | A9 |
| Texto | sempre plano; nome sans 13/600; frase 11,5 apagada; técnico mono 10 caps | A10, A6 |
| Cor | peças neutras; cor só em estado e LED: verde passou `#7fd6a6`, vermelho barrou/alerta `#ff6b6b`, âmbar disparou/não publicado `#f2a65a`, ciano ao vivo `#29ccec` | A6, A5 |
| Vidro | só em Ficha e HUD (flutuantes); nunca em peça; `prefers-contrast: more` → opaco com hairline forte | A9, A11, A28 |
| Materiais (4, e só) | **alumínio anodizado escuro** (o que guarda e o que controla), **papel** (etiquetas de campo), **obsidiana** (o Cofre, único polido), **emissor** (Tela, Cano, pulso) | A2, A10 |
| Motion | percussivo: 160–240 ms `ease-out`, sem bounce; só `transform`/`opacity`; um gesto físico por peça, só por evento real | A5, A12, A26 |
| `prefers-reduced-motion` | reduzir: sem deslocamento, mantém cor + texto + `aria-live` | A25 |
| Marca da pessoa | fita de 3 px na borda esquerda + avatar 16 px; "Ver por pessoa" = halo 25 % temporário; nunca a peça inteira pintada | A8 |

### 3.2 Os quatro estados (iguais para todas)

| Estado | Forma | Cor | Motion | Texto/ARIA |
|---|---|---|---|---|
| **Nova / em construção** (migração não aplicada) | contorno 1 px **tracejado** (`6 4`), preenchimento a 50 %, **sem espessura, sem sombra**, sem `preserve-3d` | hairline apagada | entra com "encaixe": `translateY(6px) scale(.98)` → `0 / 1`, 240 ms ease-out, assenta 1 px | "em construção · migração pendente" em mono |
| **Pronta** | sólida, espessura 2 px, sombra de peça, pinos visíveis | neutra | nenhum em repouso | — |
| **Ativa** (o pulso chegou) | sobe um degrau (fundo → `#111b2e`) e `translateY(-1px)` por 1,2 s; o gesto físico da peça acontece | borda na cor do veredito (verde/vermelho) | 160 ms entrada, 600 ms saída | `aria-live="polite"`: "a linha entrou na gaveta Agendamentos" |
| **Com alerta** | hairline 1,5 px vermelha + glifo de alerta + **frase** na peça | `#ff6b6b` | nenhum laço; entra uma vez com fade | "⚠ aberta para todos" / "⚠ chave faltando: ZAPI_TOKEN" |
| (+) **Selecionada** | anel 2 px no acento `#8670ff` | acento | — | foco de teclado igual |

Ativa ≠ selecionada: ativa é o dado passando; selecionada é a pessoa olhando. Nunca as duas usam a mesma cor.

### 3.3 Peça a peça

| Peça | Forma (grade 8) | Material | Glifo (SVG iso, 24 px) | Pinos | Gesto físico (só por evento) | Alerta possível |
|---|---|---|---|---|---|---|
| **Gaveta** (tabela) | 176×auto; **frente** de 24 px no topo com puxador (traço 16×2) e cadeado à direita; campos como linhas abaixo; rodapé mono "N linhas" | alumínio; frente = keycap (degradê de 1 degrau) | armário com uma gaveta meio aberta | entrada esq. (portas/telas), saída dir. (fios para outras gavetas), inferior (robôs/cano) | quando entra linha: a frente desliza 2 px para fora (`rotateX(-4deg)` em `preserve-3d`, `perspective 1400`) e a linha nova aparece com fade; volta em 600 ms | "aberta para todos"; "ligação sem índice" |
| **Campo** (coluna) | linha 24 px dentro da gaveta; nome + tipo em mono apagado | papel (1 degrau acima da peça, hairline suave) | glifo do tipo (texto ¶, número #, data ▭, sim/não ◐, ligação = pino) | campo "ligação" tem pino de saída próprio na borda direita | quando o pulso grava: a linha pisca uma vez em opacidade (.6 → 1) | "sem índice" |
| **Fio** (chave estrangeira) | cabo 2 px, curva em S, **por baixo** das peças; parte e chega em pinos | neutro `#3b4a7a`; ativo: cor do veredito por 1,2 s | — | círculo 6 px + anel 1 px; ao arrastar, o pino cresce para 10 px (alvo) | **pulso**: ponto 6 px + rastro (opacidade .35) correndo por `animateMotion`/`offset-path`, 0,8 s + 0,05 s/unidade; reduced-motion: só a cor | fio "solto" (FK sem tabela) tracejado vermelho |
| **Chave** (RLS) | cadeado 14 px na frente da gaveta; nunca peça solta | metal escuro; aberto = vermelho | cadeado fechado / aberto | — | quando barra outra empresa: treme 2 px (2 ciclos, 240 ms) e acende vermelho; reduced-motion: só acende; ao fechar pela Ficha: "clique" (scale .9 → 1, 120 ms) | "⚠ aberta para todos" |
| **Empresa** (tenant) | **bandeja rebaixada** (o único côncavo): raio 14, fundo 1 degrau abaixo do palco, hairline, etiqueta mono caps no canto superior esquerdo | — (é o chão) | prédio simples (só na etiqueta) | — | ao arrastar gaveta para dentro: a bandeja "aceita" (hairline acende no acento por 300 ms) | gaveta com `tenant_id` sem chave: alerta na gaveta, não na bandeja |
| **Portaria** (Auth) | 152×auto, mais alta que larga; uma **fresta** horizontal de 4 px (leitor) abaixo do nome; papéis como chips 4 px | alumínio | catraca / porta giratória | saída direita (para bandeja e telas) | ao receber pulso: a fresta acende verde ("entrou como Ana") ou vermelha ("senha errada") por 1,2 s | "sem papéis definidos" |
| **Porta** (rota / Edge Function) | 152×auto; **conector de entrada** grande (10 px) à esquerda, verbo em mono caps ("RECEBE"), frase | alumínio | porta com seta entrando | entrada esq. (telas), saída dir. (gavetas) | quando recebe: o conector acende e o pulso "entra" (some 4 px dentro da peça e sai pelo outro lado) | "⚠ sem checagem de login" |
| **Robô** (trigger / cron / webhook) | 96×96, quadrada; engrenagem 20 px; etiqueta "quando entra / quando muda / todo dia às…" em mono | alumínio; LED âmbar só ao disparar | engrenagem | entrada inferior (da gaveta/porta que o aciona); saída dir. | dispara: a engrenagem gira 60° (240 ms) e o LED acende âmbar; reduced-motion: só o LED; **nunca gira em repouso** | "sem alvo" |
| **Depósito** (bucket) | 176×64, baixa e larga: **prateleira** com 3 divisórias e régua de uso (1,2 GB) de 2 px | alumínio | prateleira com caixas | entrada superior (da gaveta que aponta arquivos) | ao receber arquivo: uma "caixa" a mais aparece com fade | "público sem querer" |
| **Cofre** (env / segredos) | 240×auto; **obsidiana**: fundo `#0a0713`, especular 1 px mais forte (`.10`), cantos 10; chaves como lista com LED 6 px | obsidiana (único polido) | cofre com maçaneta | — (não recebe pulso) | ao entregar chave ("pedir ao Theus"): o LED vai de vermelho a verde com "clique"; nunca mostra valor | "✗ ZAPI_TOKEN · pedir ao Theus" |
| **Tela** (página do frontend) | 176×112; **miniatura real** da página (iframe congelado ou captura) com moldura de 1 px; o **único emissor permanente**: `box-shadow 0 0 24px rgb(41 204 236 / .12)` que tinge o fio ao lado | emissor (vidro fino só na moldura, se o orçamento deixar; senão hairline ciano) | monitor / painel | saída dir. (portas que usa), entrada inferior (cano) | ao receber do cano: a miniatura "atualiza" (fade .7 → 1); no modo 3D é o painel CSS3D real | "usa porta que não existe" |
| **Cano** (Realtime / fila) | 128×24: **tubo** com duas hairlines e interior 1 degrau abaixo; vazio em repouso | emissor só quando há evento | tubo | entrada esq. (gaveta), saída dir. (tela) | evento: 1–3 bolinhas ciano 4 px atravessam em 600 ms; **vazio quando nada muda** (calm tech) | "sem assinante" |

### 3.4 O pulso do "Testar" (a animação que ensina RLS)

1. **Portaria**: fresta acende verde; `aria-live` "entrou como Ana, da Clínica Vida".
2. **Fio Portaria → Tela Agenda**: ponto verde corre (0,8 s).
3. **Tela**: miniatura pisca uma vez; ponto sai pelo pino direito.
4. **Porta "novo agendamento"**: conector acende; ponto entra e sai.
5. **Gaveta Agendamentos**: frente abre 2 px, linha nova aparece, rodapé "50 → 51 linhas"; sobe um degrau por 1,2 s.
6. **Fio inferior → Robô**: ponto verde; engrenagem gira 60°, LED âmbar; texto "mandou o WhatsApp · ver o que enviou".
7. **Cano**: três bolinhas ciano atravessam até a Tela; a miniatura atualiza.
8. **Segunda tentativa, "como a Clínica Sorriso"**: ponto **vermelho** sai da Portaria, chega na gaveta, o **cadeado treme e acende vermelho**, o ponto "morre" no pino (some com scale → 0); HUD: "barrado pela chave: cada empresa vê só o seu".

Orçamento: 1 pulso por fio por vez; máximo 3 pulsos simultâneos; `will-change: transform` ligado só nas peças do caminho, desligado no fim (A27). Tudo em `transform`/`opacity` (A26). Com `reduce`: sem passos 2, 6 e 7 em movimento; cores, textos e `aria-live` iguais.

### 3.5 Montar arrastando (o gesto Lego)

- Arrastar uma peça da paleta: ela vem **tracejada** (sem corpo) até o agente confirmar a migração; ao aplicar, ganha espessura e sombra com o "encaixe" percussivo.
- Puxar um fio: sai de um pino, o pino de destino cresce para 10 px quando o cursor chega a 24 px; solta → fio tracejado até o agente escrever a FK.
- Soltar gaveta na bandeja Empresa: a hairline da bandeja acende no acento por 300 ms ("aceitou"); o agente adiciona `tenant_id` + chave + índice; a gaveta ganha o cadeado.
- Cada gesto gera o cartão no terminal ("✓ Gaveta Pacientes fechada por empresa · [ver SQL] [desfazer]"), como o `MAQUINA.md` §5 já define.

### 3.6 O modo 3D (só a Tela; as peças como placas)

- **Mesma gramática**: as placas do backend no WebGL usam a escada (`0x0b1322` corpo, `0x111b2e` frente), especular baixo (`roughness .6`, `metalness .2` como hoje), **sem emissivo em repouso** (hoje é 0,25: baixar para 0). Só a Tela e o pulso emitem.
- **Texto plano**: etiquetas viradas para a câmera (sprites ou `CSS3DSprite`), nunca coladas em ângulo na placa (A10).
- **Luzes**: hemisférica + direcional + 1 `PointLight` de pulso reaproveitada (A19). `pixelRatio ≤ 1.5` (PROMPT_AGENTICO §8). Loop pausa em `visibilitychange` e fora da viewport (`IntersectionObserver`).
- **Câmera**: sem movimento automático; damping desligado com `reduce`; zoom do navegador ≠ 100 % mostra aviso (A17).
- **Fios**: `TubeGeometry` fina, cor neutra; pulso = esfera + luz; ao chegar, a placa sobe 0,05 u por 1,2 s (o mesmo "um degrau" do 2D).

### 3.7 Tokens propostos (rascunho para `docs/design/tokens.css`)

```css
:root {
  /* escada de superfície da Máquina (do fundo ao olho) */
  --mq-palco: #050a14;
  --mq-bandeja: #04080f;
  --mq-peca: #0b1322;
  --mq-frente: #111b2e;
  --mq-flutuante: #14203a;
  --mq-obsidiana: #0a0713;
  /* linhas */
  --mq-hairline: #506b94;          /* 3,65:1 sobre o palco, 3,42:1 sobre a peça (medido) */
  --mq-hairline-suave: rgb(255 255 255 / .08);
  --mq-fio: #3b4a7a;
  /* luz: uma, alto-esquerda, proporção 1:2 */
  --mq-especular: inset 0 1px 0 rgb(255 255 255 / .06);
  --mq-sombra-peca: 0 1px 2px hsl(222 40% 4% / .45), 0 4px 12px hsl(222 40% 4% / .35);
  --mq-sombra-flutuante: 0 1px 2px hsl(222 40% 4% / .5), 0 8px 24px hsl(222 40% 4% / .4), 0 24px 48px hsl(222 40% 4% / .3);
  /* estados (cor por função, não por peça) */
  --mq-passou: #7fd6a6;
  --mq-barrou: #ff6b6b;
  --mq-disparou: #f2a65a;
  --mq-ao-vivo: #29ccec;
  --mq-selecao: #8670ff;
  /* geometria */
  --mq-grade: 8px;
  --mq-raio-bandeja: 14px;  --mq-raio-peca: 10px;  --mq-raio-frente: 6px;  --mq-raio-chip: 4px;
  --mq-pino: 6px;  --mq-pino-alvo: 10px;
  --mq-espessura: 2px;
  /* motion percussivo */
  --mq-rapido: 160ms;  --mq-normal: 240ms;  --mq-decai: 600ms;
  --mq-curva: cubic-bezier(.2, .8, .2, 1);   /* ease-out, sem overshoot */
}
.mq-palco { perspective: 1400px; }
.mq-peca { background: var(--mq-peca); border: 1px solid var(--mq-hairline); border-bottom-width: var(--mq-espessura); border-radius: var(--mq-raio-peca); box-shadow: var(--mq-especular), var(--mq-sombra-peca); }
.mq-peca.construindo { border-style: dashed; border-bottom-width: 1px; box-shadow: none; }
.mq-peca.ativa { transform: translateY(-1px); background: var(--mq-frente); }
@media (prefers-reduced-motion: reduce) { .mq-pulso { animation: none; } .mq-fio.vivo { transition: stroke var(--mq-rapido); } }
@media (prefers-contrast: more) { .mq-ficha { backdrop-filter: none; background: var(--mq-flutuante); border-color: #8fa3c8; } }
```

### 3.8 Orçamento de desempenho (Mac comum, 60 fps)

| Item | Limite | Por quê |
|---|---|---|
| Peças visíveis por zoom | ≤ 40 (zoom "máquina inteira" agrupa por domínio) | camadas custam memória (A26) |
| Fios | 1 único `<svg>`; caminhos recalculados só ao mover peça | evita paint por quadro |
| Pulsos simultâneos | ≤ 3 | 1 elemento animado por pulso |
| Propriedades animadas | `transform`, `opacity`, `stroke` (fio) | compositor (A26) |
| `box-shadow` animada | nunca | pinta a cada quadro |
| `backdrop-filter` | ≤ 2 elementos, `blur(8px)` | A28 |
| `will-change` | só durante o Testar | A27 |
| 3D: luzes | 2 fixas + 1 de pulso | A19 |
| 3D: `pixelRatio` | ≤ 1,5 | PROMPT_AGENTICO §8 |
| 3D: loop | pausa em aba oculta / fora da viewport | PROMPT_AGENTICO §8 |
| Medição | no Mac de referência com 40 peças, DevTools Performance, 10 ms por quadro | A26 |

---

## 4. O que ninguém fez (com a anterioridade que esta frente conseguiu ver)

1. **Peça que "conquista corpo"**: tracejada e sem sombra enquanto é só intenção do agente; ganha espessura, sombra e pinos quando a migração aplica. Nenhum construtor lido (React Flow, n8n por trecho de busca, Spline, Stripe) representa "existe no banco" como fisicalidade da peça. (Rams: honesto.)
2. **Escada de superfície como altura de dado**: "um degrau mais claro = o pulso está aqui agora". Raycast usa a escada para hierarquia estática; usar a escada para **estado dinâmico** não apareceu em nenhuma fonte.
3. **O cadeado que treme**: RLS ensinada por um gesto físico único, sem texto técnico. Nenhuma ferramenta de banco lida explica RLS como objeto que barra.
4. **Mesmo material em 2D e 3D**: a placa WebGL e o cartão HTML compartilham escada, especular e espessura, então o modo 3D é "a mesma peça vista de lado", não outro produto. O `visual3d.js` já tem o esqueleto; falta a unificação de material.
5. **Cor por função, não por peça, num construtor visual**: n8n, Make e afins pintam cada nó pela categoria (trecho de busca, não lido). Aqui a peça é neutra e a cor só diz o que aconteceu (passou, barrou, disparou, ao vivo).
6. **Marca da pessoa como fita de pasta**: 3 px de cor na borda + avatar, com "Ver por pessoa" acendendo o halo só sob demanda. A Linear removeu fundos coloridos por equipe (A8); a fita é o meio-termo que mantém o pedido do Theus sem pintar a peça.
7. **Pulso que morre no pino**: o ponto vermelho que some com `scale → 0` ao ser barrado. Nenhuma fonte de edges animadas (React Flow) mostra um pulso com **fim negativo**.

## 5. Armadilhas

- **Isometria de cena** para "parecer 3D": texto a 30° (A10, A13) e conotação de jogo. Só nos glifos.
- **Vidro nas peças**: "compete e embaça a hierarquia" (A9). Só na Ficha e no HUD, e com fallback opaco.
- **Peça da cor do palco + sombra** (neumorfismo): contraste 1:1 por construção (A3). Sempre hairline ≥ 3:1.
- **Glow permanente na peça ativa** (hoje 24 px ciano): pinta a cada quadro (A26) e "se tudo brilha, nada é importante" (frente irmã, calm tech). Só a Tela tem glow, e baixo.
- **Fio inteiro em laço** (hoje `stroke-dasharray` infinito): sem direção e sem fim. Ponto com direção e veredito.
- **Bounce no encaixe** (hoje `cubic-bezier(.2, 1.4, …)`): Nothing proíbe; percussivo, ease-out, assenta 1 px.
- **`opacity < 1` na peça 3D**: achata o `preserve-3d` sem aviso (A16). Opacidade nos filhos, ou peça 2D mesmo.
- **`reduce` que apaga tudo** (hoje `* { animation-duration: .01ms !important }`): some a informação do pulso (A25). Reduzir, não remover; `aria-live`.
- **Emojis como glifo**: inconsistentes entre sistemas, sem controle de luz; Nothing: "no emoji as UI" (A5). SVG nativo, leva única, seed fixa.
- **`pixelRatio` 2 e loop sem pausa no 3D**: dobra o custo à toa; PROMPT_AGENTICO capa em 1,5 e exige pausa.
- **Zoom do navegador no modo 3D**: CSS3DRenderer só a 100 % (A17); avisar.
- **"Linear's 3D icons", "Raycast 3D icons", "Vercel Ship 3D"**: sem fonte primária lida; Vercel Ship é fotografia e grade (A20). Não citar como referência.
- **Medidas do Lego em mm**: de memória, não confirmadas na página lida (A22). Usar só o princípio (um pino, um passo, tolerância).
- **Material Design (elevação tonal no escuro) e HIG "Materials" da Apple**: páginas devolveram só o título; o mesmo princípio está confirmado pela Raycast (A7) e pelas transcrições da WWDC (A9, A10).

## 6. Fontes lidas (URL efetivamente aberta e com conteúdo)

1. https://www.dezeen.com/2013/06/10/new-apple-ios-software-flat-design-jonathan-ive-wwdc/
2. https://en.wikipedia.org/wiki/Skeuomorph
3. https://en.wikipedia.org/wiki/Neumorphism
4. https://axesslab.com/neumorphism/
5. https://www.vitsoe.com/us/about/good-design
6. https://github.com/dominikmartn/nothing-design-skill/blob/main/nothing-design/SKILL.md
7. https://blakecrosley.com/guides/design/teenage-engineering
8. https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/raycast/DESIGN.md
9. https://linear.app/now/behind-the-latest-design-refresh
10. https://developer.apple.com/videos/play/wwdc2025/219/
11. https://developer.apple.com/videos/play/wwdc2025/356/
12. https://developer.apple.com/videos/play/wwdc2023/10072/
13. https://linear.app/now/linear-liquid-glass
14. https://www.lux.camera/physicality-the-new-age-of-ui/
15. https://en.wikipedia.org/wiki/Isometric_projection
16. https://www.smashingmagazine.com/2022/05/3dicons-open-source-library-case-study-download/
17. https://developer.mozilla.org/en-US/docs/Web/CSS/perspective
18. https://css-tricks.com/how-css-perspective-works/
19. https://developer.mozilla.org/en-US/docs/Web/CSS/transform-style
20. https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/renderers/CSS3DRenderer.js
21. https://www.webgpu.com/showcase/3d-books-by-stripe-press/
22. https://docs.spline.design/exporting-your-scene/how-to-optimize-your-scene
23. https://vercel.com/ship
24. https://reactflow.dev/examples/edges/animating-edges
25. https://en.wikipedia.org/wiki/Lego
26. https://www.joshwcomeau.com/css/designing-shadows/
27. https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html
28. https://web.dev/articles/prefers-reduced-motion
29. https://web.dev/articles/rendering-performance
30. https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count
31. https://developer.mozilla.org/en-US/docs/Web/CSS/will-change
32. https://web.dev/articles/backdrop-filter
33. https://developers.raycast.com/basics/prepare-an-extension-for-store
34. https://www.raycast.com/blog/a-fresh-look-and-feel
35. https://linear.app/now
36. https://www.raycast.com/blog (lista; só confirmou o post de 2022)
37. https://docs.spline.design/ (índice; levou à página de otimização)

## 7. Páginas que não viraram fonte

- https://developer.apple.com/design/human-interface-guidelines/materials (só o título; página em JS)
- https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/MobileHIG/index.html (só o título)
- https://m3.material.io/styles/elevation/overview e https://m2.material.io/design/color/dark-theme.html (só o título)
- https://webflow.com/blog/neumorphism (erro de cabeçalho HTTP)
- https://www.fastcompany.com/1672780/why-jony-ive-is-flattening-ios-7 (403)
- https://www.theverge.com/2013/6/10/4416726/ios-7-design-jony-ive-flat (bloqueada)
- https://threejs.org/docs/examples/en/renderers/CSS3DRenderer.html e a versão raw da doc (404; substituída pelo JSDoc do código-fonte)
- https://polypane.app/blog/css-3d-transform-examples/ (404)
- https://ray.so/icon/ (só o título)
- Trechos de busca **não** usados como fonte: think.design (visionOS), createwithswift (Liquid Glass), Medium/UX Collective (neumorfismo), designstudiouiux, bighuman, platform.uno, applescoop, Forbes 2026 (iOS 7), gsmarena, techcrunch, linearity.io, vectary, 3dicons.co, x.com (three.js resources), gist (Stripe Press clone), designlabb, made-in-china, hyenathedesigner, crewtangle, grokipedia.
