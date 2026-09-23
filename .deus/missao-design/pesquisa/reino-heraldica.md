# Frente: Reino, guildas e heráldica moderna

> Pesquisa para a missão de design do Babel Coop · 2026-09-23 · agente de pesquisa (Claude Code).
> Regra seguida: só entra achado cuja fonte foi efetivamente lida (WebFetch, Read de PDF ou arquivo local). O que não consegui ler está listado no fim como "bloqueado", sem citar conteúdo.
> Pergunta da frente: como marcas e produtos modernos usam nobreza, heráldica e guildas com sobriedade, e como representar **pessoa, guilda, papel e conquista** no Babel Coop com marca e cor por pessoa **sem ranking**.

## 0. O que o próprio Reino do Theus já define (fonte local)

Arquivo lido: `/Users/matheussilveirapro/Desktop/Dominic/LP-Reino.html` (1,4 MB; landing page do Reino).

- **Sete títulos**, cada um com **metal + pedra** já codificados na LP (array de materiais, linhas 1716–1722):
  - Visconde · aço `0xaeb6c2` + verde `0x2fd67a`
  - Conde · aço + azul `0x2f6bff`
  - Marquês · aço + vermelho `0xff2d55`
  - Duque · bronze `0xb8743a` (sem pedra)
  - Príncipe · prata `0xe6eaf0` (sem pedra)
  - Rei · ouro `0xf2c15a` (sem pedra)
  - Imperador · ouro `0xf5c76a` + ametista `0x8f3dff`
- Token de ouro da LP: `--ouro: #f5c76a`. Título em fonte de cerimônia (`--f-cerimonia`), cor ouro, `letter-spacing: .02em`.
- Regra de progressão: "Visconde R$ 300, Conde R$ 500 ou Marquês R$ 1.000. **A partir de Duque, o título é conquistado e não há mensalidade.**" Rei: "O líder do seu estado, com 5 Duques. Tem cadeira e voto no Conselho e define as novas Guildas." Imperador: "O líder da nação, com cinco Reis, um de cada região. Título vitalício."
- Código de honra: "Cada membro tem nome, empresa e reputação à vista. Quem quebra o código perde o título. Para sempre."
- **Guilda = segmento de mercado** ("No Reino, cada segmento é uma Guilda. Quem entra numa Guilda passa a circular entre todos os negócios dela.") com "constelação" de negócios conectados e "jornada" de um cliente entre eles.
- Já existe um **selo de cera dourado que abre** (`.carta-selo`: círculo 76 px, degradê radial `#ffe9b0 → #f5c76a → #a8741e → #6d4812`, sombra dourada; `.carta.abrindo .carta-selo { scale(1.3); opacity: 0 }`) e um selo maior de 128 px na seção de código, animado com GSAP (`scale: 1.8 → 1, rotate: -25`, `back.out`).
- A Babel aparece como "uma torre de cristal com 7 terraços (um por título do Reino)".

**Leitura:** o Reino já tem um sistema heráldico próprio, sóbrio (metal + pedra, sem brasão figurativo). O Babel Coop não precisa inventar outro; precisa **herdar o vocabulário** (metal, pedra, selo, guilda, título conquistado) e adaptá-lo a uma equipe de 11 sem ranking.

---

## 1. Achados com fonte lida

### A · Heráldica: regras que continuam valendo

**A1. Regra de tintura: metal nunca sobre metal, cor nunca sobre cor.**
- Fato: a heráldica divide as tinturas em **metais** (Or = ouro/amarelo; Argent = prata/branco) e **cores** (gules vermelho, azure azul, sable preto, vert verde, purpure roxo). A regra: "metal should not be put on metal, nor colour on colour". Função declarada: contraste e legibilidade à distância em bandeiras, escudos e selos. Documentada por volta de 1410; no período vitoriano virou "lei" na Inglaterra. Exceções: peles (arminho, vair), cargas "proper" (cor natural), garras/línguas, fimbriação (filete fino para evitar a violação).
- Fonte: https://en.wikipedia.org/wiki/Rule_of_tincture
- Por que importa: é a regra de contraste mais antiga em uso e bate exatamente com a pergunta "ouro e prata em interface escura sem cafonice": o fundo `#060b16` do Babel é "azure/sable" (cor); ouro e prata são metais; **metal sobre cor é a combinação certa**, metal sobre metal (ouro sobre prata, ouro sobre branco) é o erro.
- Aplicação no Babel Coop: virar **token de design system**: `--metal-ouro` e `--metal-prata` só podem aparecer sobre superfícies de cor (`--e-fundo`, `--e-casco`, `--e-sel-*`); nunca ouro sobre texto prata, nunca ouro sobre o degradê roxo→ciano sem um "filete" (fimbriação = 1 px de fundo escuro entre os dois). Documentar como regra de aceite do painel.

**A2. Heráldica moderna: sete categorias e a função de "respeitabilidade".**
- Fato: o livro *Modern Heraldry* (Counter-Print, 2 volumes, 350+ marcas) agrupa a heráldica contemporânea em **shields, crests, stamps, seals, laurels, flags e crowns**. Jon Dowling: "Five years on from the first volume, the popularity of heraldry, it seems, has not diminished." Designers usam heráldica para "capturar o romance visual e a história de uma marca ou transmitir craftsmanship"; hoje as marcas heráldicas "raramente derivam de brasões familiares" e servem para transmitir "respectabilidade ou autenticidade".
- Fonte: https://www.creativeboom.com/resources/modern-heraldry/
- Por que importa: dá o mapa das formas disponíveis (7 famílias) e nomeia o risco: heráldica sem história por trás vira "autenticidade emprestada".
- Aplicação no Babel Coop: escolher **uma só família** (recomendo **selo/laurel**, não escudo nem coroa: escudo é defesa, coroa é hierarquia; selo é "isto foi feito e conferido", laurel é constância). O Reino já usa selo. O Babel Coop tem história real (equipe, aprendizados, demandas concluídas) para ancorar o selo, então não é autenticidade falsa.

**A3. Chillon (Hymn): cores tiradas do brasão e nomeadas em heráldica; silhueta preservada; ícones "esculpidos".**
- Fato: no rebrand do Castelo de Chillon, a Hymn restaurou os pigmentos originais dos brasões nas paredes e **batizou as cores com nomes heráldicos** (Sinople = verde, Gules = vermelho, Carnation = rosa). Tipografia feita com a NewGlyph "bridges past and present without falling into nostalgia" (terminais angulares, qualidade de pedra entalhada, grade modular). Emojis redesenhados como se esculpidos na pedra. Manteve a silhueta do castelo como âncora de reconhecimento. Posição: "contemporary medieval".
- Fonte: https://abduzeedo.com/chillon-castle-brand-identity
- Por que importa: mostra o método sóbrio: heráldica entra pelo **nome das cores e pela textura da tipografia**, não por brasões desenhados. E que se mantém um único elemento de reconhecimento (a silhueta), o resto muda.
- Aplicação no Babel Coop: nomear os tokens de cor com vocabulário do Reino (por exemplo `--ametista`, `--aço`, `--bronze`, `--ouro`, `--prata`) em vez de `--roxo-2`; manter o "b" neon pequeno como a silhueta-âncora; ícones de UI com a mesma "mão" (traço único, cantos vivos), como os emojis de Chillon.

**A4. Burberry 2023: o cavaleiro heráldico e a serifa voltaram; o sans de 2018 durou 5 anos.**
- Fato: o Equestrian Knight Design (1901, vencedor de concurso público; estandarte com "Prorsum" = "adiante") foi retirado em 2018 no rebrand sem serifa de Peter Saville sob Riccardo Tisci (com monograma "TB"). Em fevereiro de 2023, sob Daniel Lee, a Burberry trouxe o cavaleiro e a serifa de volta: "The new Burberry logo is archive-inspired", com azul "Knight Blue". A Wikipedia registra o movimento como "a modern take on British luxury".
- Fontes: https://www.dezeen.com/2023/02/07/burberry-daniel-lee-logo-equestrian-knight-design/ e https://en.wikipedia.org/wiki/Burberry
- Por que importa: prova, no topo do luxo, que heráldica + serifa é lida como herança e autoridade, e que trocar por sans "para parecer moderno" custou reputação e foi revertido. É o caso mais recente de "luxo silencioso" com brasão.
- Aplicação no Babel Coop: **não** trocar a Cormorant (serifa) por uma sans de moda no redesign; a serifa fica como a voz "de cerimônia" (título de guilda, nome de selo, ata de reunião). A sans (IBM Plex) continua sendo a voz de trabalho. A oscilação sans↔serif é a armadilha; a decisão é por papel, não por tendência.

### B · Casas de ficção: como Dune e Foundation constroem identidade de Casa

**B1. Dune: Part Two (Territory Studio): a identidade da Casa vive na UI como língua, não como brasão.**
- Fato: a Territory desenhou os giroscópios dos ornitópteros (modelos Atreides e Harkonnen) e a mesa de guerra Harkonnen. A linguagem Harkonnen nasce de "strict formations of their armed forces contrasted with the curved H.R. Giger-style organic forms"; a tipografia foi "principally inspired by the insectoid language adorning Harkonnen ships and sets", com "soft edges and sharp points inspired by the Hunter Seeker", ligada a "elegance and hostility". A fonte "braille-esque" (gotas de óleo) virou o próprio sistema de leitura da UI; o volume de luz sugere projeção analógica.
- Fonte: https://territorystudio.com/project/dune-part-two/
- Por que importa: a Casa é reconhecida pelo **sistema** (forma das letras, ritmo, luz), não por um emblema estampado. É a forma mais sóbria de heráldica: o brasão vira gramática.
- Aplicação no Babel Coop: a "Casa Babel" se reconhece pelo traço dos ícones (uma só família SVG gerada numa leva), pelo ritmo da mono no terminal e pela luz do neon, e não por um brasão no meio da tela (que a peneira já tirou). Cada guilda/projeto pode ter **um glifo** dentro da mesma gramática, nunca um estilo próprio.

**B2. Patrice Vermette (Dune): "Design for design cannot exist"; cada Casa tem paleta ancorada no planeta.**
- Fato: na entrevista, Vermette ancora Caladan (Atreides) nos "grays of the sky, the yellows of the leaves, the green of the pine trees" do outono e em portais em forma de lua ("birth and renewal"); Giedi Prime (Harkonnen) é um "black molded plastic world", filmado em infravermelho preto e branco, com morfologia de inseto. Princípio: "Design for design cannot exist. Design needs to support storytelling"; "method designing" para tornar o fantástico crível.
- Fonte: https://www.pushing-pixels.org/2024/04/10/production-design-of-dune-interview-with-patrice-vermette.html
- Por que importa: é a versão de cinema da regra do Theus ("um efeito só entra se for metáfora do serviço"): a cor de cada Casa tem origem física, não decorativa.
- Aplicação no Babel Coop: a cor de cada pessoa e de cada guilda precisa de **motivo declarado** (por exemplo, guilda = segmento do Reino, pessoa = escolhida uma vez e fixa). Nenhuma cor "porque ficou bonita".

**B3. Foundation (Imaginary Forces): o Império se conta por monumentos e por um mural vivo; a lição é a hubris.**
- Fato: a abertura foi construída sobre o Mural of Souls ("made of vibrant particles—it's almost living when you get close to it", Brandon Savoy), com referência a "militaristic-style propaganda" (Ronnie Koff), vermelho "used to signify Soviet-era visuals", e o tema "iconic monuments of power, and the demise that comes from hubris and ego". Centenas de iterações em Cinema 4D + X-Particles. Créditos: Ronnie Koff (diretor criativo), Peter Frankfurt; "vivid 3D animated designscapes with bursts of radiant particles".
- Fontes: https://blog.frame.io/2022/09/12/made-in-frame-imaginary-forces-foundation/ e https://imaginaryforces.com/project/foundation
- Por que importa: é o melhor exemplo recente de "império" traduzido em motion sem coroas nem brasões: partículas, pigmento e registro (o mural é o arquivo do império). E o próprio conceito avisa: monumentalidade lê como hubris.
- Aplicação no Babel Coop: o "arquivo vivo" do Império é o **Acervo** do Babel Coop. Um fundo de partículas discretas (loop `Z = A`, gerado uma vez) pode existir só no Acervo/Sonho, como "mural de aprendizados"; jamais como monumento no meio vazio. A peneira já removeu o "b" gigante; não voltar com ele em outra forma.

### C · Ligas, ranks e conquistas: o que copiar e o que recusar

**C1. Duolingo, ligas: dez materiais/gemas em escada, com rebaixamento e aversão à perda.**
- Fato: dez ligas em ordem: Bronze, Silver, Gold, Sapphire, Ruby, Emerald, Amethyst, Pearl, Obsidian, Diamond. Semanal, 30 pessoas, ranking por XP. "No double-promotion"; rebaixamento dos últimos; "Demotion makes weekly engagement non-negotiable"; notificações do tipo "took your spot" e "You're out of the top 5". O site atribui às ligas "+25% Lesson Completion". No blog oficial: "We first tested Leaderboards in 2018 and we found that a little competition worked for a *lot* of learners!"; de 5 para 10 ligas para que "reaching the top … was an even bigger achievement"; e "Leaderboards aren't for everyone. You can disable Leaderboards".
- Fontes: https://duolingo.deconstructoroffun.com/mechanics/leagues e https://blog.duolingo.com/duolingo-leagues-leaderboards/
- Por que importa: é a referência de "liga" que todo mundo cita, e o mecanismo é o oposto do que o Babel Coop pede: ranking público, perda de lugar, pressão semanal. O que vale copiar é só a **escada de materiais como vocabulário** (bronze → prata → ouro → pedra), que coincide com o Reino.
- Aplicação no Babel Coop: usar a escada de materiais para **níveis pessoais** (Perfil já tem "nível, selos, sequência"), sem comparação entre pessoas, sem rebaixamento, sem semana. E manter o "desligar" como padrão de respeito: a pessoa pode ocultar seus selos.

**C2. Duolingo, badges: "troféus numa prateleira", divididos em prêmios e recordes pessoais.**
- Fato: as conquistas estavam "buried in the profile page. They're hard to find, and harder to celebrate!"; passaram a ficar "in one place, so your achievements and other milestones collect on your profile like trophies on a shelf". Dois tipos: **Awards** ("major milestones as well as other unique accomplishments") e **Personal Records** ("most XP earned in a day", "longest streak"). Há "simple ones for beginners" e "rare badges for dedicated learners".
- Fonte: https://blog.duolingo.com/achievement-badges
- Por que importa: separa conquista (fato) de recorde pessoal (comparação consigo mesmo). É a forma de gamificar sem ranking: a régua é a própria pessoa.
- Aplicação no Babel Coop: no Perfil, duas prateleiras: **Selos** (fatos: "10 demandas com OK", "primeiro aprendizado", "levou para a reunião") e **Recordes pessoais** (maior sequência de check-in, dia com mais aprendizados). Nada disso na TV.

**C3. GitHub Achievements: níveis base → bronze → prata → ouro por volume, sem placar, ocultáveis.**
- Fato: badges como Starstruck (16 → 128 → 512 → 4096 estrelas), Pull Shark (2 → 16 → 128 → 1024), Galaxy Brain, Pair Extraordinaire; alguns únicos (Quickdraw, YOLO, Public Sponsor). Aparecem na barra lateral do perfil; "hovering over a badge reveals details on how it was earned"; "you can hide the entire Achievements section or individual badges". Não há ranking global.
- Fonte: https://github.com/orgs/community/discussions/176080
- Por que importa: é o maior produto de trabalho com conquistas **sem leaderboard**, e usa exatamente a escala de metais. Ferramenta de trabalho séria, sem cafonice.
- Aplicação no Babel Coop: mesmo modelo: selo com 4 graus (base, bronze, prata, ouro) por volume acumulado, "como foi ganho" no hover, ocultável. O grau é lido pelo **metal do aro do selo**, não por número.

**C4. GitHub streaks (experimento natural, ICSE 2021): tirar o contador mudou o comportamento; gamificação "pode direcionar em direções indesejadas".**
- Fato: em 2016 o GitHub removeu, sem aviso, os contadores de streak dos perfis. Moldon, Strohmaier e Wachs observaram que sequências longas foram abandonadas, atividade de fim de semana caiu e quem perseguia publicamente "100 dias" parou. Conclusão: "gamification can steer the behavior of software developers in unexpected and unwanted directions".
- Fonte: https://arxiv.org/abs/2006.02371
- Por que importa: evidência causal (não opinião) de que sequência/streak muda o que a pessoa faz, inclusive trabalhar no fim de semana. O Babel Coop tem "Cuidando da gente" e pausa fora do expediente; um streak entraria em contradição direta.
- Aplicação no Babel Coop: **sem streak de dias**. A "sequência" do Perfil deve contar **dias úteis com check-in**, congelar em férias/fim de semana e nunca aparecer para os outros. Constância, não vício.

**C5. Strava Local Legends: reconhece constância ("regardless of pace or speed"), mostra só o líder, tem opt-out.**
- Fato: o Local Legend é "the athlete who completes a given segment the most over a rolling 90-day period", "regardless of pace or speed"; ganha um "Laurel crown icon" na atividade e no segmento. A contagem dos demais não é pública; só o líder aparece. "Only activities visible to 'Everyone' will count"; a pessoa pode desligar em Privacy Controls › Local Legends.
- Fonte: https://support.strava.com/hc/en-us/articles/360043099552-Local-Legends
- Por que importa: é a única mecânica de "reconhecimento" que premia presença, não desempenho, e que esconde a comparação. É o laurel (categoria heráldica) usado com sobriedade.
- Aplicação no Babel Coop: um **laurel de constância** por área (por exemplo "quem mais alimentou o Acervo em 90 dias"), visível só no Perfil da pessoa e opcional. Nunca uma lista. Combina com "Cuidando da gente": constância vira cuidado, não pressão.

**C6. Discord: cargo tem cor (agora com degradê e holográfico), ícone e posição; a cor exibida vem do cargo mais alto que tem cor; e "servidor" se chama guild na API.**
- Fato: o objeto Role tem `colors` com `primary_color`, `secondary_color` (gera degradê) e `tertiary_color` (estilo holográfico, com valores fixos impostos pela API), além de `icon` (hash), `unicode_emoji`, `position` e `hoist`. "Roles without colors (`colors.primary_color == 0`) do not count towards the final computed color in the user list." Na documentação de Guild: guilds "represent an isolated collection of users and channels, and are often referred to as 'servers' in the UI"; campos visuais `icon`, `splash`, `banner`, `premium_tier` (0–3), `vanity_url_code`.
- Fontes: https://docs.discord.com/developers/topics/permissions e https://docs.discord.com/developers/resources/guild
- Por que importa: é o sistema de "papel com cor e ícone" mais usado do mundo, e mostra o problema: a **cor do cargo substitui a identidade da pessoa** (o membro fica da cor do cargo). E o degradê/holográfico é a versão "loud" que a Babel deve evitar, porque a identidade já é um degradê.
- Aplicação no Babel Coop: inverter a precedência: **a cor da pessoa sempre vence**; o papel (gestão/membro/convidado) entra só como **ícone de cargo** (um glifo, 12–16 px, ao lado do nome, como no Discord), nunca como cor. Nada de degradê no cargo: degradê é reservado à marca Babel. O "guild" do Discord confirma que o termo é natural em produto de comunidade.

### D · Selos e "luxo silencioso" em fintech e cartões

**D1. Nubank Ultravioleta: premium por subtração (roxo mais escuro, metal, sem número).**
- Fato: o time descreve elegância sem ostentação, evitando o clichê de luxo do mercado brasileiro; cartão sem número (usa cartão virtual online); "We simplified the earning system, removing unnecessary currencies like US$ or Points". Pesquisa: "People don't want only to show off with a premium piece of plastic (metal in this case). Our customers are challengers by nature, they want to feel unique." Mais de um ano de pesquisa antes do desenvolvimento; "Being visually appealing (on and offline) would be a great differentiator". Benefícios crescem em vez de expirar; anuidade cai por regra transparente.
- Fonte: https://building.nu.com/nubank-ultravioleta/
- Por que importa: é o caso brasileiro de referência para o público do Theus (empresários): premium = **cor mais funda, material, menos informação**, e "sentir-se único" em vez de "mostrar". Coincide com a paleta roxa da Babel.
- Aplicação no Babel Coop: o "grau" de uma pessoa ou de um projeto se mostra por **profundidade de cor e material do aro**, não por estrelas ou números; e a regra do Reino ("a partir de Duque, o título é conquistado") tem a mesma lógica do "benefício que cresce e não expira".

**D2. Apple Card: titânio gravado a laser, "no card number, CVV security code, expiration date or signature".**
- Fato: "With no card number, CVV security code, expiration date or signature on the card, Apple Card is more secure than any other physical credit card." Só nome e logotipo, em titânio.
- Fonte: https://www.apple.com/newsroom/2019/08/apple-card-launches-today-for-all-us-customers/
- Por que importa: o selo de status mais copiado da década é feito de **ausência**: o que não está gravado é o luxo.
- Aplicação no Babel Coop: o cartão de pessoa (Equipe/Perfil) mostra **nome, sigilo e cor**; carga, horas e métricas ficam fora do cartão (só a gestão vê, e em outro lugar). O cartão "vazio" é o cartão premium.

**D3. American Express Centurion: titânio anodizado, preto, por convite (1999).**
- Fato: "anodized titanium, laser-engraved, and accented with stainless steel"; conhecido como "Black Card"; "invitation-only"; lançado em 1999; "considered a status symbol among the affluent"; critérios não divulgados.
- Fonte: https://en.wikipedia.org/wiki/Centurion_Card
- Por que importa: o selo de mais alto status do mercado financeiro é **preto e sem brilho**, não dourado. O ouro cafona é o que se evita; o material e o convite fazem o trabalho.
- Aplicação no Babel Coop: o nível mais alto (por exemplo, quem "pode mudar o app" na Oficina, ou o Imperador no Reino) não precisa ser o mais brilhante; pode ser o **mais escuro e mais fosco** (ametista sobre sable), com o ouro reservado ao selo de conquista. E "convite" = token de entrada, que o Babel Coop já tem.

### E · Tipografia serifada de luxo silencioso

**E1. Canela (Commercial Type, 2016): Caslon com as serifas removidas, "flares vestigiais", entalhe em pedra, entre sans e serif.**
- Fato: Miguel Reyes começou como "uma interpretação de Caslon" e redirecionou "removendo as serifas e deixando apenas flares vestigiais nas extremidades dos traços", influenciado "por sua experiência com entalhe em pedra", com "qualidade monumental"; "um espaço ambíguo entre sans e serif, suave e afiado". Nos pesos leves, "delicada … com traços suavemente flares"; nos negros, "calor com uma confiança tranquila". Estreou na *Document Journal* nº 5. Famílias: Canela, Condensed, Deck, Text. Em uso: Document Journal, Desértica Hotel, Bridge Theatre, Leman Jewelry, Paddywax + Pura; pareada com Graphik, Neue Haas Grotesk, Atlas Grotesk, Basel Grotesk, FF Mark.
- Fontes: https://commercialtype.com/catalog/canela e https://fontsinuse.com/typefaces/42363/canela
- Por que importa: é a fonte-síntese do luxo silencioso: serifa que quase não é serifa; e o pareamento padrão (Canela display + grotesca de texto) é a mesma estrutura Cormorant + IBM Plex do Babel.
- Aplicação no Babel Coop: manter a estrutura (serifa de cerimônia + sans de trabalho). Se um dia a Cormorant precisar de mais "pedra" (peso em tamanhos pequenos), a Canela é a candidata licenciada; até lá, usar Cormorant em pesos Medium/Semibold e tamanhos ≥ 20 px, porque o contraste alto some em 13 px.

**E2. GT Sectra (Grilli Type, 2013): pena larga + bisturi; curvas viram cantos; proporções de grotesca.**
- Fato: "a calligraphy of the broad nib pen with the sharpness of the scalpel knive"; feita para a revista de jornalismo longo *Reportagen*; três subfamílias (Sectra, Fine, Display), 30 estilos; latim, cirílico, grego, vietnamita. Na resenha da Typographica (Patch Hofweber, 2015): "The excess curves of calligraphy are simplified as curves are converted to corners, building a fantastic tension"; "a workhorse serif".
- Fontes: https://www.grillitype.com/typeface/gt-sectra e https://typographica.org/typeface-reviews/gt-sectra/
- Por que importa: é a serifa "de bisturi", que dá sensação de gume e precisão, e é a que mais combina com a mono de terminal por ter proporções de grotesca (altura-x maior, capitais menos pesadas). É o oposto da Cormorant (que é renascentista e delicada).
- Aplicação no Babel Coop: se o Theus quiser um tom mais "futurista e cortante" na serifa (ata, título de guilda), a GT Sectra é a alternativa; a Cormorant é o tom "reino e cerimônia". Não usar as duas. Decidir pela metáfora: bisturi (precisão) ou cerimônia (reino).

**E3. Cormorant (Christian Thalmann, OFL): inspirada em Garamond, 45 fontes, família de display.**
- Fato: "While this project was heavily inspired by Claude Garamont's immortal legacy, I did not use any specific font as a starting point"; 9 estilos (Roman, Italic, Infant, Garamond, Upright Cursive, Small Caps, Unicase…) × 5 pesos = 45 fontes; licença SIL OFL; "free display type family"; fontes-fonte em Glyphs no repositório.
- Fonte: https://github.com/CatharsisFonts/Cormorant
- Por que importa: é a fonte que o Babel já usa; o próprio autor a classifica como **display**, não texto. E tem **Small Caps** e **Unicase**, que são as variantes certas para sigilos e nomes de título (versaletes = heráldica tipográfica sem ornamento).
- Aplicação no Babel Coop: usar **Cormorant SC (versaletes)** para nomes de guilda, título e selo (por exemplo "DUQUE", "GUILDA SAÚDE") com tracking +0,06 em; nunca Cormorant em corpo de texto de UI. Regra do Reino já usa `letter-spacing: .02em` no título em ouro.

### F · Ouro e prata em interface escura, sem cafonice

**F1. Proporção e contraste do ouro: 60-30-10, #D4AF37 é o "ouro do metal", #FFE033 sobre #1D1A0C dá 13,24:1.**
- Fato: "Physical gold sits closer to #D4AF37, often labeled 'metallic gold'"; "Split the layout 60-30-10. Use 60% neutral background, 30% dark structural color, and 10% gold"; "#FFE033 on dark surface #1D1A0C measures 13.24:1, passing WCAG AAA"; "#FFD700 on white 1.4:1 Fails AA and AAA"; "Flat #FFD700 has no shine. A metallic effect needs a gradient across two or three of gold's shades"; "lean on neutrals: the near-black #1D1A0C, a charcoal, and an off-white give gold room to signal".
- Fonte: https://www.visily.ai/blog/gold-color
- Por que importa: dá números para a regra de tintura: ouro sobre escuro passa AAA; ouro sobre branco falha; e o "metálico" só existe como degradê de 2–3 tons, nunca como cor chapada nem como degradê arco-íris.
- Aplicação no Babel Coop: tokens `--ouro: #f5c76a` (do Reino) para aro/selo, `--ouro-fundo: #a8741e` e `--ouro-luz: #ffe9b0` (os três tons que a LP do Reino já usa no selo); ouro em **≤ 10 % da tela** e só em selo, título de guilda e comemoração de meta. Nunca ouro em botão primário (o primário é o degradê da marca).

**F2. Modo escuro: dessaturar ~20 pontos, sem preto puro, sem branco puro, elevação por luminosidade.**
- Fato: "Choose dark grays for your default surface color"; cores de destaque com "around 20 points lower saturation on dark mode than on light mode"; "bright white can glow too much in a dark UI … Use a slightly darker shade of white"; elevação comunicada por superfícies mais claras, não por sombra; foco de teclado visível; atenção a halation para astigmatismo.
- Fonte: https://atmos.style/blog/dark-mode-ui-best-practices
- Por que importa: define como a prata deve ser: **a prata é o off-white do texto** (`#d7e4fb` já é isso no base.css), e o ouro tem de ser o `#f5c76a` dessaturado, não `#FFD700`. Halation é o inimigo do neon em quem tem astigmatismo: o neon do "b" precisa ser fino.
- Aplicação no Babel Coop: os metais do Reino já estão dessaturados (aço `#aeb6c2`, prata `#e6eaf0`, bronze `#b8743a`, ouro `#f5c76a`); adotá-los como estão. Elevação (cartão de pessoa, selo) por luminosidade da superfície, não por brilho.

### G · Pessoa, cor e presença sem ranking

**G1. Figma: a cor da pessoa muda entre sessões, e os usuários pedem cor fixa.**
- Fato: no fórum, um usuário relata que "the cursor / user color of the team members are often changed. Sometimes my co-worker is yellow, sometimes gray, sometimes green", pedindo cor permanente por pessoa; resposta do Figma (2023): "We'll pass this along to our team for future consideration". 513 visualizações.
- Fonte: https://forum.figma.com/suggest-a-feature-11/define-own-user-color-for-collaboration-27624
- Por que importa: a maior ferramenta multiplayer não fixa a cor por pessoa, e isso é sentido como problema: a cor só vira identidade se for **estável**.
- Aplicação no Babel Coop: o `--pessoa` do v3.css deve ser **escolhido uma vez, guardado no perfil e nunca reatribuído**; conflitos de cor entre duas pessoas são resolvidos na entrada (token), com uma paleta de 11+ cores separadas em matiz e igualmente dessaturadas. Presença (cursor, borda de peça, foto de quem salvou) usa sempre essa cor.

**G2. Boring Avatars: sigilo SVG determinístico a partir do nome, com paleta própria, MIT.**
- Fato: "generates unique SVG-based user profile avatars from usernames, emails or any random strings"; mesmo nome → mesmo avatar; variantes marble, beam, pixel, sunset, ring, bauhaus; `colors`, `size`, `square`; licença MIT.
- Fonte: https://github.com/boringdesigners/boring-avatars
- Por que importa: é a prova de que "marca por pessoa" pode ser **gerada e determinística** (sem designer por pessoa) em SVG, respeitando a regra do Theus de SVG nativo; a variante `ring`/`bauhaus` é geométrica e sóbria.
- Aplicação no Babel Coop: gerar o **sigilo de pessoa** de forma determinística (hash do nome → forma geométrica) na paleta da Babel + cor da pessoa, com foto por cima quando houver; o sigilo aparece onde a foto não cabe (12–16 px: árvore, chip, peça da Máquina). Diferença em relação ao Boring Avatars: uma forma só, monolinha, `currentColor`.

**G3. Google Docs, animais anônimos (2012): identidade sem nome, "mais humana que uma sequência numérica".**
- Fato: "People you didn't invite individually will show as anonymous animals when they're in the file"; nomes só aparecem com permissão individual ou dentro do domínio. Origem (2012): a proposta inicial era mostrar visualizantes como sequências numéricas; a equipe quis "algo mais amigável e mais humano" e chegou à aliteração "Anonymous Animals"; 68 animais em 2016, 73 em 2018.
- Fontes: https://support.google.com/docs/answer/2494888?hl=en e https://www.mentalfloss.com/culture/internet/wild-things-why-google-docs-feature-anonymous-animals
- Por que importa: é o padrão canônico de **presença com identidade e sem hierarquia**: um símbolo + uma cor bastam para "quem está aqui", e ninguém fica acima de ninguém.
- Aplicação no Babel Coop: para **convidados** (quem entra pelo token mas ainda não tem perfil, ou pessoa de fora numa reunião), usar o mesmo esquema: sigilo neutro + cor temporária, sem nome. Para a equipe, o mesmo mecanismo com o sigilo pessoal.

**G4. Spotify (Kniberg & Ivarsson, 2012): Guild = "community of interest" que atravessa a organização; qualquer um pode entrar.**
- Fato: "A Guild is a more organic and wide-reaching 'community of interest', a group of people that want to share knowledge, tools, code, and practices. Chapters are always local to a Tribe, while a guild usually cuts across the whole organization." "Anybody who is interested can join any guild." "Each guild has a 'guild coordinator'." Chapters e guilds são "the glue that keeps the company together".
- Fonte: PDF lido: https://blog.crisp.se/wp-content/uploads/2012/11/SpotifyScaling.pdf (páginas 9–10)
- Por que importa: define guilda como **pertencimento voluntário e transversal**, diferente de "projeto" (squad, com missão) e de "cargo" (chapter, com chefe). É a distinção que o Babel Coop precisa: projeto ≠ guilda ≠ papel.
- Aplicação no Babel Coop: **Projeto** (já existe: pastas por membro, demandas) = squad; **Guilda** = segmento/interesse transversal (vendas, clínicas, IA) que a pessoa escolhe, aparece no Perfil e no Acervo (aprendizados filtrados por guilda); **Papel** = gestão/membro (chapter). Três coisas, três representações: cor (pessoa), glifo (guilda), ícone de cargo (papel).

---

## 2. Síntese: como representar pessoa, guilda, papel e conquista no Babel Coop, sem ranking

| Coisa | Como se mostra | Origem no achado | Onde aparece | Onde **não** aparece |
|---|---|---|---|---|
| **Pessoa** | **cor fixa** (`--pessoa`, escolhida uma vez) + **sigilo determinístico** monolinha em SVG (hash do nome) + foto quando cabe | G1, G2, G3, D2 | árvore, chip de menção, peça da Máquina, cursor, "quem salvou", cartão na Equipe | nunca trocada por cor de cargo (C6 invertido) |
| **Guilda** | **um glifo** dentro da família de ícones (mesmo traço), com nome em Cormorant SC | B1, A3, E3, G4 | Perfil, filtro do Acervo, cabeçalho de projeto | sem cor própria (cor é da pessoa); sem brasão figurativo |
| **Papel** | **ícone de cargo** 12–16 px ao lado do nome (gestão, membro, convidado, "pode mudar o app") | C6 | Equipe, Oficina, chip quando importa | nunca colore o nome; nunca na TV |
| **Conquista** | **selo** com aro em metal (base → bronze → prata → ouro) e "como foi ganho" no hover; **laurel de constância** em 90 dias; **recordes pessoais** | C2, C3, C5, A2, F1 | Perfil da pessoa (prateleira), cartão de "Pronta" (selo abre, ≤ 400 ms) | TV (já é regra: "nunca ranking"), Meu dia, Equipe |
| **Metais** | ouro só sobre cor (regra de tintura), ≤ 10 % da tela, 3 tons para o metálico; prata = off-white do texto | A1, F1, F2, D3 | selo, título de guilda, comemoração de meta | botão primário, fundo, degradê da marca |
| **Serifa** | Cormorant (SC para nomes de título/guilda/selo); sans para trabalho; mono para terminal | A4, E1, E3 | ata, título, selo, nome de guilda | corpo de UI, terminal |

Regras de motion e geração derivadas do material obrigatório do Theus:
- Sigilos e glifos de guilda: **SVG nativo** (`recraft-ai/recraft-v4-svg`), família inteira **numa leva só, com o mesmo prompt de estilo**, `stroke: currentColor`, traço desenhado com `stroke-dashoffset` na entrada, `prefers-reduced-motion` entrega o estado final. Nunca PNG vetorizado.
- Selo que abre (reaproveitar `.carta-selo` do Reino): escala 1,3 + fade em ≤ 400 ms, **um por seção**, som só depois de gesto. É metáfora do serviço ("demanda selada com OK de quem pediu"), então passa no teste.
- Fundo de partículas "mural" (Foundation) só se for loop `Z = A` gerado uma vez, keyframe aprovado antes, seed fixa, e só no Acervo/Sonho.

---

## 3. Armadilhas (o que a pesquisa manda evitar)

1. **Ranking e rebaixamento** (Duolingo): "took your spot", rebaixar os últimos, semana obrigatória. O Babel Coop não tem ranking; qualquer lista ordenada de pessoas por número é ranking, mesmo sem a palavra.
2. **Streak de dias** (GitHub, ICSE 2021): puxa trabalho de fim de semana e ansiedade; contradiz "Cuidando da gente" e a pausa fora do expediente.
3. **Cor de cargo sobrepondo cor de pessoa** (Discord): a pessoa deixa de ser ela e vira o cargo. Inverter a precedência.
4. **Degradê/holográfico em cargo ou selo** (Discord): a Babel já é um degradê; degradê sobre degradê é ruído.
5. **Metal sobre metal** (regra de tintura): ouro sobre prata/branco, ouro sobre o texto claro. Usar fimbriação (1 px de fundo) quando inevitável.
6. **Ouro chapado `#FFD700` e ouro em mais de 10 % da tela** (Visily): "stops feeling premium and starts feeling loud". Metálico só com 2–3 tons.
7. **Cor de pessoa instável** (Figma): se muda, não é identidade.
8. **Heráldica emprestada / autenticidade falsa** (Modern Heraldry): brasão sem história por trás. O Babel Coop só pode mostrar selo do que aconteceu de verdade (demanda com OK, aprendizado registrado).
9. **Monumentalidade** (Foundation: "hubris and ego"): logo gigante, mural no meio da tela, coroas. A peneira já tirou o "b" grande; não trazer de volta em outra roupa.
10. **Trocar serifa por sans "para modernizar"** (Burberry 2018 → 2023): custou cinco anos e voltou. Decidir tipografia por papel, não por tendência.
11. **Cormorant em corpo de texto**: o autor a define como display; em 13 px o contraste alto some. Versaletes em ≥ 20 px; texto de UI na sans.
12. **Halation do neon** (Atmos): neon largo sobre fundo escuro cansa quem tem astigmatismo; o neon do "b" fica fino e pequeno.
13. **Sigilo em PNG vetorizado** (regra do Theus): traço sujo e peso alto. SVG nativo, uma leva, `currentColor`.
14. **Metáfora forçada de reino**: coroa, trono, cetro. O Reino do Theus é sóbrio (metal + pedra + selo); manter esse nível.

## 4. O que ninguém fez (até onde a busca alcançou; não encontrei anterioridade)

- **Precedência invertida pessoa > cargo**: em Discord a cor do cargo vence; em Figma a cor da pessoa nem é fixa; não encontrei ferramenta de equipe onde a cor da pessoa é fixa por contrato e o papel é só um glifo.
- **Regra de tintura como token de design system** ("metal só sobre cor", com fimbriação de 1 px): não achei design system de software que a cite ou a implemente.
- **Laurel de constância (Strava) dentro de uma ferramenta de trabalho de equipe, sem placar e opcional**: só encontrei em app de esporte.
- **Selo que "abre" como confirmação de conclusão de demanda** (o Reino tem na LP; não achei em app de trabalho).
- **Guilda transversal (Spotify) + projeto + papel como três camadas visuais distintas** (cor / glifo / ícone) num app com terminal de agentes: não achei.
- **Sigilo determinístico monolinha gerado por IA em SVG por pessoa** (Boring Avatars é determinístico mas é abstrato/colorido; Discord tem ícone de cargo mas não de pessoa): combinação não encontrada.

## 5. Fontes efetivamente lidas

Locais:
- `/Users/matheussilveirapro/Desktop/Dominic/LP-Reino.html` (títulos, metais, selo, guildas)
- `/Users/matheussilveirapro/Desktop/babel-coop/docs/UX_PENEIRA.md`, `docs/FUNCOES.md`, `prototipo/base.css`, `prototipo/v3.css`, `.deus/missao-design/MISSAO.md`
- `/Users/matheussilveirapro/Desktop/stack-video-scroll/PROMPT_AGENTICO_LP.md`, `BRIEFING_IA.md`

Web (WebFetch com conteúdo devolvido, ou PDF baixado e lido):
- https://en.wikipedia.org/wiki/Rule_of_tincture
- https://www.creativeboom.com/resources/modern-heraldry/
- https://abduzeedo.com/chillon-castle-brand-identity
- https://www.dezeen.com/2023/02/07/burberry-daniel-lee-logo-equestrian-knight-design/
- https://en.wikipedia.org/wiki/Burberry
- https://territorystudio.com/project/dune-part-two/
- https://www.pushing-pixels.org/2024/04/10/production-design-of-dune-interview-with-patrice-vermette.html
- https://blog.frame.io/2022/09/12/made-in-frame-imaginary-forces-foundation/
- https://imaginaryforces.com/project/foundation
- https://duolingo.deconstructoroffun.com/mechanics/leagues
- https://blog.duolingo.com/duolingo-leagues-leaderboards/
- https://blog.duolingo.com/achievement-badges
- https://github.com/orgs/community/discussions/176080
- https://arxiv.org/abs/2006.02371
- https://support.strava.com/hc/en-us/articles/360043099552-Local-Legends
- https://docs.discord.com/developers/topics/permissions
- https://docs.discord.com/developers/resources/guild
- https://building.nu.com/nubank-ultravioleta/
- https://www.apple.com/newsroom/2019/08/apple-card-launches-today-for-all-us-customers/
- https://en.wikipedia.org/wiki/Centurion_Card
- https://commercialtype.com/catalog/canela
- https://fontsinuse.com/typefaces/42363/canela
- https://www.grillitype.com/typeface/gt-sectra
- https://typographica.org/typeface-reviews/gt-sectra/
- https://github.com/CatharsisFonts/Cormorant
- https://www.visily.ai/blog/gold-color
- https://atmos.style/blog/dark-mode-ui-best-practices
- https://forum.figma.com/suggest-a-feature-11/define-own-user-color-for-collaboration-27624
- https://github.com/boringdesigners/boring-avatars
- https://support.google.com/docs/answer/2494888?hl=en
- https://www.mentalfloss.com/culture/internet/wild-things-why-google-docs-feature-anonymous-animals
- https://blog.crisp.se/wp-content/uploads/2012/11/SpotifyScaling.pdf (PDF, páginas 1–10)

## 6. Bloqueadas ou vazias (não citadas como conteúdo)

- 403: https://www.creativereview.co.uk/dune-graphic-design/ (o artigo sobre os sigilos das Casas de Dune; **não sei** quem os desenhou nem a lógica oficial de cada símbolo); https://www.creativereview.co.uk/modern-heraldry-book/; https://www.designweek.co.uk/issues/20-26-april-2020/modern-heraldry-counter-print/; https://the-brandidentity.com/project/how-hymn-bridged-medieval-and-modern-for-chillon-castles-rebrand; https://support.discord.com/hc/en-us/articles/4409571023639-Custom-Role-Icons-FAQ e …/4408234878999-Role-Icons (os limites 64×64 px, 256 KB e Boost nível 2 apareceram só em trechos de busca, não em página lida); https://eliannamayer.medium.com/…; https://www.sciencedirect.com/… (Hanus & Fox 2015 sobre placar e motivação: **só trechos de busca, não lido; não citar como fato**); https://lbbonline.com/news/is-burberrys-new-identity-the-end-of-the-serif-wars
- Sem conteúdo útil (página renderizada por JavaScript): https://m2.material.io/design/color/dark-theme.html; https://developer.apple.com/design/human-interface-guidelines/dark-mode; https://www.creativebloq.com/news/foundation-concept-art; https://dribbble.com/shots/7059766-Duolingo-Leaderboard-League-Badges; https://www.fxguide.com/fxfeatured/foundational-visual-effects/ (lido, mas sem o Mural of Souls)
- 404/402: https://www.counter-print.co.uk/products/modern-heraldry-vol-2; https://discord.fandom.com/wiki/Role_Icons
