# Juiz · diretor de criação — Organismo × Chão de Trabalho × Colegas

> Missão `babel-coop/design-2030` · 23/09/2026 · rodada "visão inédita" (aceite A12). Julgo os três conceitos (`visao-conceito-organismo.md`, `visao-conceito-lugar.md`, `visao-conceito-colega.md`) contra o contexto obrigatório (`docs/design/CONCEITO.md`, `docs/design/GERACAO_REPLICATE.md`, `docs/FUNCOES.md`, `~/Desktop/stack-video-scroll/PROMPT_AGENTICO_LP.md`) e contra o pedido literal do Theus: "efeitos visuais… gerar elementos… que tornem o app uma nova criação de apps no mundo, apps conversacionais de terminal mas sem cara de terminal, gestão equipe contexto compartilhado… eu não sei o que é possível de gerar de sistema, usando uma llm de vídeo como temos hoje… me mostre por meio de um artefato uma ideia que tem estrutura de ideia para ser líder do mercado até ano que vem".
> Lente: já vi todo o AI slop de 2024–2026. Pergunto de cada peça gerada: é metáfora do serviço ou cosmético? A ideia tem estrutura para virar categoria? Um vídeo de 60 s dela viralizaria entre times de empresa?
> Método: li os três conceitos inteiros e os quatro documentos. Conferi por conta própria o que decide nota: os arquivos gerados hoje em `docs/design/assets/` (vi as imagens), três páginas da Replicate, a página da Rovo e quatro buscas por WebFetch (a cota de WebSearch estava esgotada: 200/200). O que não li está marcado **não confirmado**.

---

## 0. Veredito em três linhas

**Vencedor: Babel Coop · Organismo (44/60)**, com seis cortes obrigatórios e cinco enxertos. É o único dos três em que a mídia gerada é o corpo do produto (o backend real com forma, na parede da sala) e não enfeite (Sala Conversacional v1) nem álibi (Chão). É também o único que responde ao que o Theus pediu de verdade: mostrar o que uma LLM de vídeo/imagem/3D faz **por um sistema**, com estrutura de líder.
**Chão de Trabalho (40/60)** tem o melhor mecanismo de produto (endereço → posição → rastro → planta) e a melhor disciplina anti-slop, mas quase não gera nada: reduz a Replicate a panoramas que viram 8 % de tinta numa hairline. É um v2.1 do CONCEITO, não o "outro artefato" que o Theus pediu.
**Colegas (38/60)** tem as melhores frases ("já li 76 coisas que a equipe aprendeu", "Lia usou o seu aprendizado") e o melhor momento de vídeo (a chegada do agente), mas nasce na categoria mais lotada de 2026 ("AI teammate"), com um nome que em português lê como anúncio de vaga, e pede para furar o orçamento da missão.

---

## 1. O que conferi por conta própria (evidência que pesa nas notas)

| Achado | Evidência | Efeito no julgamento |
|---|---|---|
| **Recraft devolve preenchido.** Os 8 SVG gerados hoje têm só `fill="rgb(…)"`, `viewBox="0 0 2048 2048"` e nenhum `stroke` | `docs/design/assets/raw/recraft-v4-svg/2026-09-23/{reuniao,maquina,tela-html,meu-dia,criar,terminais,gaveta,robo}.svg` + `MANIFESTO.jsonl` (8 × US$ 0,08); página lida: https://replicate.com/recraft-ai/recraft-v4-svg ("Generates actual editable vector files with clean paths and structured layers"; nada sobre stroke) | O Organismo ainda orça 65 ícones (US$ 6,76) e glifos de projeto no Recraft: **morto na chegada**; o Chão já sabia e desenha à mão; o Colegas também orça o lote (US$ 6,34) |
| **Vídeo sobre interface destrói o texto no quadro 0.** Vi `ui-primeiro.jpg`: o texto de 13 px do painel já está ilegível antes de qualquer movimento | `docs/design/assets/visao/ui-primeiro.jpg`, `ui-ultimo.jpg`, `raw/wan-video_wan-2.7-i2v/2026-09-23/ui-viva.mp4`; página lida: https://replicate.com/wan-video/wan-2.7-i2v ("Fine details like text or small patterns in the source image may not be perfectly preserved"; "Very long durations (10+ seconds) can show motion degradation toward the end"; `first_frame` obrigatório, `last_frame` opcional) | Confirma a regra dos três: casca é código. Pesa contra a "ata da mudança" por Wan (Organismo): interpolar dois renders que já tenho é pagar por uma versão pior de um tween |
| **Trellis funciona e é barato.** Cofre: keyframe isométrico limpo (vi `cofre.jpg`: ardósia fosca, aresta ciano, sem texto), recorte com alfa, glb de 1,1 MB em 31 s | `raw/google_nano-banana-2/2026-09-23/cofre-iso.png` → `raw/bria_remove-background/…/cofre-recorte.png` → `raw/firtoz_trellis/…/cofre-3d-model_file.glb`; página lida: https://replicate.com/firtoz/trellis ("$0.035 to run on Replicate, or 28 runs per $1"; "Predictions typically complete within 26 seconds"; A100 80 GB; MIT) | O "corpo do backend" do Organismo é viável hoje e já tem uma peça pronta |
| **O "b" gerado hoje viola o CONCEITO v2.** `b-marca.jpg` é fita de luz com halo e degradê roxo → ciano; o v2 diz "b nunca roxo", sem glow, material chapado | `docs/design/assets/visao/b-marca.jpg`; prompts em `raw/google_nano-banana-2/2026-09-23/MANIFESTO.jsonl` ("ribbon of light… gradient from deep violet… glows softly") | O Chão reaproveita esse `b-entrada.mp4` como rito de entrada: **reprova**. Organismo e Colegas pedem a versão chapada do GERACAO §3.2: correto |
| **O orbe é slop.** `orbe.jpg` = nebulosa roxa dentro de vidro | `docs/design/assets/visao/orbe.jpg` | Os três rejeitam; o artefato vencedor tem de tirar o orbe e o `chao-vivo.mp4` do `visao.html` v1 |
| **Nomes de categoria (sinal fraco).** Bing por WebFetch, aspas não respeitadas: "organismo de equipe" devolve só biologia; "chão de trabalho" devolve dicionário e piso; "trabalho à vista" devolve portais de vaga (≈ 276 mil resultados) | https://www.bing.com/search?q=%22organismo+de+equipe%22+software+agentes · https://www.bing.com/search?q=%22ch%C3%A3o+de+trabalho%22+app+equipe+agentes · https://www.bing.com/search?q=%22trabalho+%C3%A0+vista%22+software+equipe+agentes (DuckDuckGo devolveu CAPTCHA nas três) | Nenhum produto achado com esses nomes (**não confirmado** além disso). "Trabalho à vista" tem um terceiro sentido ativo em português (vaga de emprego) que o Colegas não previu |
| **"AI teammate" não é rótulo da Rovo** | https://www.atlassian.com/software/rovo ("Rovo works alongside your team wherever they work") | Não muda a nota do Colegas: a lotação da categoria vem de Notion 3.0, GitHub Agent HQ, Linear delegate, Devin, Cowork (lidos pelas frentes); Glean, Lindy, Relevance, Agentforce, Dust, Sana continuam **não lidos** |

---

## 2. Notas (0–10 × 6 critérios)

| Critério | Organismo | Chão de Trabalho | Colegas |
|---|---|---|---|
| Inédito | **8** | 7 | 5 |
| Sério para empresário | 6 | **8** | 7 |
| Líder em 12 meses | **7** | 6 | 6 |
| Uso real de mídia gerada | **8** | 4 | 6 |
| Viabilidade 2026 (HTML/CSS/JS + Replicate) | 6 | **9** | 6 |
| Preserva o pedido do Theus e o FUNCOES.md | **9** | 6 | 8 |
| **Total** | **44** | **40** | **38** |

### 2.1 Organismo · 44

- **Inédito 8.** Das sete "peças inéditas" que ele lista, três já são o CONCEITO v2 com outro nome (Selo = "reflexo", meia-vida = "respiração", terminal dobrado): não contam. As quatro que contam são fortes e ninguém lido combina: (1) o backend real como objeto físico gerado uma vez, cuja forma só muda com Selo, **na TV da sala**; (2) agente como órgão-instrumento com dono, sem rosto; (6) peça efêmera com Selo (UI gerada que pousa como aba com autor, hora e preset, em vez de viver num chat); (7) vídeo como registro de evento. A anterioridade é honesta (Pets, Buddy, Rabbit r1 como "o mais próximo") e o Bing não achou produto com esse nome.
- **Sério 6.** "Organismo de equipe", "corpo", "órgão", "pele" ficam fora da interface (entram na lista do §10), mas a linha de venda "o sistema da sua empresa com corpo" ainda pede explicação para dono de clínica. A reserva "sistema com corpo" é melhor que o principal. O que salva: a TV mostrando **o que ele pagou** com forma, e a governança no objeto ("OK · Carla · 14:32") que a Microsoft cobra por assento.
- **Líder 7.** É o único com uma imagem de marketing pronta: a foto da TV na parede com o corpo do projeto crescendo. Um vídeo de 60 s (Davi, que não programa, diz "cria uma tabela de pacientes" e a gaveta tracejada aparece na parede; Carla dá OK no celular; a peça ganha corpo) viraliza entre times de empresa porque mostra **poder sem terminal**. Desconto: tudo depende de FUNCOES B (a Máquina lendo o Supabase real, só no app); antes disso é maquete, e ele admite.
- **Mídia 8.** Pele (matcap), osso (peças 3D), órgão (retrato-objeto), despertar (Entrada): cada uma é material com metáfora, tem portão de 3 pessoas, versão a custo zero e preço lido hoje no `billingConfig` (13 páginas). É a disciplina Vercel/Figma aplicada a um produto. Perde 2 pontos por dois erros: a **ata da mudança** e o **filme do projeto** pedem a um modelo de vídeo que interpole dois renders que o three.js já tem em cena (um tween procedural faz melhor, de graça, sem alucinar); e os ícones/glifos no Recraft, que o portão de hoje reprovou.
- **Viabilidade 6.** three.js na TV a 3 m com 14 malhas do Trellis em escala consistente é o ponto frágil (ele mesmo lista "Trellis inconsistente em escala e material"); kit de US$ 13–17 mais US$ 10/mês por evento com uma conta de < US$ 5 de crédito; Hunyuan 2mv com quatro vistas é engenharia demais para uma câmera fixa. Tudo em HTML/JS, sim; mas o kit precisa dos cortes do §4 para caber.
- **Pedido 9.** Nada do FUNCOES sai (cruza A–L); as três colunas e as quatro leis ficam; e é o único que entrega o que o Theus escreveu: "quero que use gerar elementos e tudo mais… me mostre o que é possível gerar de sistema".

### 2.2 Chão de Trabalho · 40

- **Inédito 7.** Endereço → posição → rastro → planta é uma novidade **estrutural** (dado, não estilo), e a anterioridade é a melhor das três: leu Gather, Roam, Kumospace, Teamflow, Sococo, Generative Agents, AI Town, dois posts do tldraw e Gemba, com URL. Desconto: o mercado vai ouvir "escritório virtual com agentes" e essa categoria é um cemitério pós-2022; a diferença ("o lugar é feito do trabalho") é verdadeira mas precisa de um parágrafo.
- **Sério 8.** Gemba, "chão de fábrica", planta de hairlines, prova no objeto, limites de vigilância pensados (posição só em objeto compartilhado, rastro de pessoa privado, caminhos sem nome). É o que um empresário reconhece na hora. Desconto: o "aha" definido ("eu sei onde todo mundo está… sem perguntar") é o aha do chefe, não do Davi; para os 10 que não são gestão, a planta é uma câmera.
- **Líder 6.** Sem imagem viral: um vídeo de 60 s do Chão mostra uma planta de retângulos e anéis de 14 px; ninguém compartilha isso. "Caminhos novos" como número público é abstrato. O rito de entrada ("cai na sala onde a equipe está") é excelente e vai para o vencedor.
- **Mídia 4.** Aqui a disciplina virou abstinência com álibi. Três panoramas equiretangulares (US$ 0,30) para "computar a média e puxar `--linha` 8 % para `--t0`": não se precisa de um modelo de imagem para escolher três temperaturas de cor. A folha de materiais vira matcap em canvas "à mão", que o GERACAO já previa sem IA. O único vídeo dentro do app é uma luz que apaga (um `filter` CSS faz). A poeira como `--mv-longa` é a única ideia de material com metáfora própria, e é minúscula. O Theus perguntou "o que é possível gerar de sistema com uma LLM de vídeo": o Chão responde "quase nada", o que é honesto, mas não é a resposta pedida. Além disso reaproveita o `b-entrada.mp4` de hoje (fita roxa com halo), que o CONCEITO v2 proibiu.
- **Viabilidade 9.** O mais barato (US$ 3,7–6,3), tudo derivado de dados que já existem, sem coleta nova, planta em SVG dentro do teto de 200 elementos, retirada por peça definida, e usa o que foi gerado de verdade hoje (cofre, ícones reprovados). É o conceito que dá para construir amanhã.
- **Pedido 6.** FUNCOES inteiro, sim. Mas "efeitos visuais… gerar elementos… uma nova criação de apps no mundo" fica sem resposta; é um v2.1 do CONCEITO, e o Theus pediu "outro" artefato, "diferente de tudo".

### 2.3 Colegas · 38

- **Inédito 5.** "Agente como colega com nome, cara, história e reputação" é a narrativa de todos os labs em 2026 (Notion 3.0 "Anything you can do… your Agent can do too", GitHub Agent HQ "just like any other developer", Linear delegate, Devin, Cowork; a nota admite não ter lido Glean, Lindy, Relevance, Agentforce, Dust, Sana). O que é dele de verdade (dono com cor herdada, memória com autoria citada, rotina como concessão registrada) são refinamentos ótimos, não uma categoria.
- **Sério 7.** "Lia · agente da Carla", ficha como livro-razão, Carga com custo de agente: um chefe entende. Desconto: "Sou a Lia… O que faço primeiro?", voz opcional, história e "aceites" empurram para o Buddy que a nota diz evitar; e numa empresa de 11, "OK 46 · rompido 5" vira ranking em uma semana, por mais que o documento proíba. O nome "Trabalho à vista" lê como vaga de emprego (Bing) e "colega de máquina" colide com a peça Máquina (ele admite).
- **Líder 6.** Tem a melhor frase viral das três ("já li 76 coisas que a equipe aprendeu") e o melhor número público ("memória da equipe 76 → 81"). Perde por categoria lotada, por "@Lia no chat" como segunda porta (a lição Cowork/Codex que os três citam) e por depender de um colega online para o aha (ramo B é fraco).
- **Mídia 6.** O retrato-ferramenta e a **chegada do agente** (cubo de ardósia → instrumento, first/last frame, uma vez, na criação) são o melhor uso de vídeo generativo das três notas: metáfora exata ("o colega toma forma a partir do que você descreveu"), evento único, custo por evento. A voz em português foi pesquisada de verdade (5 páginas lidas) mas é a peça mais arriscada (pt-BR não confirmado, não determinística, antropomorfismo). Perde pelo filme de marca com Kling a 15 s (US$ 4,4, "character appearance can vary") e pelo lote de ícones no Recraft.
- **Viabilidade 6.** Kit de US$ 21–28 e uma "[decisão]" de subir o orçamento para 40 quando a missão fixou 20/16 e a conta tem < US$ 5. Nano Banana sem seed → retratos inconsistentes (ele prevê 2 tentativas). O resto é HTML/JS sem problema.
- **Pedido 8.** FUNCOES inteiro; a tradução do terminal ("ver o comando" dobrado, título humano por comando) é a mais limpa das três. Perde por "colega de máquina" × Máquina e por servir só medianamente o "me mostre o que é possível gerar".

---

## 3. Por que o Organismo vence (e por que não é unanimidade)

O pedido do Theus tem duas metades: (a) um app inédito, conversacional sem cara de terminal, com gestão de equipe e contexto compartilhado; (b) **mostrar, num artefato, o que dá para gerar de sistema com os modelos de hoje**, com estrutura de líder. Os três cumprem (a) porque herdam o CONCEITO v2. Só o Organismo cumpre (b) sem virar slop: a mídia gerada é o corpo do que a equipe construiu, muda só com dado e Selo, e a sala vê. O Chão cumpre (a) melhor que os outros no mecanismo e falha (b) por abstinência; o Colegas cumpre (a) com as melhores frases e falha (b) por gastar em site e voz e por nascer numa categoria que os labs já ocupam.

Teste do vídeo de 60 s entre times de empresa: Organismo, sim (a parede mostra o sistema ganhando forma quando alguém que não programa pede); Chão, não (uma planta de hairlines); Colegas, talvez (um agente que "nasce sabendo 76 coisas" é boa fala, mas a imagem é um ícone de chave inglesa num quadrado de 14 px).

Onde o Organismo perde para os outros e precisa deles: o Chão tem o rito de entrada e o modelo de endereço; o Colegas tem a reciprocidade da memória e o único vídeo generativo com metáfora exata dentro do app. Por isso os enxertos do §5.

---

## 4. O que cortar do vencedor (seis cortes, com motivo e substituto)

1. **Ata da mudança por Wan (elemento 6).** Motivo: os dois quadros são renders do three.js com câmera fixa; a cena tem os dois estados. Pedir a um modelo de vídeo que "faça a peça subir 1 unidade" é pagar US$ 0,40 por um tween que o three.js faz em 400 ms com fidelidade total, e ainda correr o risco que o próprio Organismo lista ("objects may disappear or appear"; Wan: "fine details… may not be perfectly preserved", provado hoje com `ui-viva.mp4`). **Substituto**: a mesma ata (peça sobe e assenta, 4 s, uma vez na TV, guardada em Versões como "filme da v4 · OK · Theus · 16:02") gravada do canvas (`MediaRecorder` sobre o three.js), custo 0, sem alucinação. A ideia "vídeo como registro de evento" fica; a Replicate sai dela.
2. **Filme do projeto por Seedance (elemento 7).** Mesmo motivo: 5–9 renders reais + tweens procedurais contam a evolução com exatidão. Seedance só se o dono pedir um "cinemático" para Visita/site, depois de o procedural existir, e nunca como substituto da ata.
3. **65 ícones e glifos de projeto no Recraft (elementos 4 e 9, ≈ US$ 7).** O portão rodou hoje e reprovou: 8/8 preenchidos, sem `stroke`, viewBox 2048. À mão, `fill: currentColor`, como o GERACAO §2 já previa. Glifo do projeto = inicial em mono (a versão a custo zero dele mesmo).
4. **14 peças 3D de uma vez + Hunyuan 2mv com quatro vistas.** Trellis gera a malha inteira de uma imagem; a câmera da TV é fixa; as quatro vistas são engenharia demais. Começar com as quatro peças que têm gesto físico (Portaria, Cofre, Gaveta, Robô) e extrudar as outras dez proceduralmente da forma em DOM/SVG que já existe; só passar as dez pelo Trellis se as quatro vencerem a 3 m na TV do escritório. Corta ≈ US$ 3 do kit.
5. **Cinco matcaps gerados.** Uma esfera gerada (referência de material) e quatro variantes por `material.color`/luz no three.js ou em canvas; o ambiente (local · ramo · produção) é uma cor de luz, não uma textura. Corta US$ 0,5 e uma fonte de inconsistência (Nano Banana sem seed).
6. **"Organismo de equipe" como nome principal.** Inverter com a reserva: **"sistema com corpo"** vai para o site e para a saudação; "organismo" fica como codinome de documento. Motivo: sério para empresário; o teste com 3 pessoas de fora decide, mas a aposta segura é a frase que não precisa de biologia. Junto: corpo 3D do agente na TV (`.glb` por agente) sai; o PNG do retrato nos nós do corpo da equipe basta e evita o mascote.

Também sai do artefato o que sobrou do `visao.html` v1: o orbe (`orbe.jpg`, nebulosa em vidro) e o `chao-vivo.mp4` (fundo que respira), e o `b-entrada.mp4` de hoje só volta se for regerado com o material chapado do GERACAO §3.2 (A e N chapados, sem halo, sem roxo).

**Kit depois dos cortes** (preços lidos hoje): pele 1 esfera (0,07–0,13) · folha + 4 peças (folha 0,20 + 4 keyframes ≈ 0,40 + recorte 4 × 0,018 + Trellis 4 × 3 × 0,035 = 0,42) ≈ 1,1 · corpo do agente a pedido (0,085 cada) · Entrada chapada A/N + clipe com portão (1,08, teto 1,80) · chegada do agente (enxerto 1, 3 testes ≈ 2,0) · som "espera" 0–0,40 ⇒ **≈ US$ 4–6**, dentro do crédito de hoje e longe da parada de 16. Por evento: **0**.

---

## 5. O que roubar dos outros dois (cinco enxertos)

1. **Do Colegas: a chegada do agente como o único vídeo generativo dentro do app.** Cubo de ardósia (keyframe) → instrumento aprovado (retrato), first/last frame no Wan 2.7, 4 s, uma vez, na criação, com portão de 3 pessoas contra o crossfade CSS. É o "o colega toma forma a partir do que você descreveu": metáfora exata, evento único, orçamento por evento. Substitui a ata como vitrine do que uma LLM de vídeo faz por um sistema.
2. **Do Colegas: memória com autoria e reciprocidade.** O bloco "o que consultei" cita "Aprendizado · Davi · reembolso · usado 7×" e o Davi vê a luz (meia-vida curta, dirigida a ele): "Lia usou o seu aprendizado". Todo agente novo abre com "já li 76 coisas que a equipe aprendeu"; "memória da equipe 76 → 81" é o número público de segunda; "Nada encontrado · 0 de N" deixa uma pergunta aberta no Acervo. É o efeito de rede interno mais concreto das três notas e custa zero.
3. **Do Chão: o rito de entrada sem tela vazia.** Depois do b, a pessoa nova cai na sala em que a equipe está agora ("Clínicas › landing.html · com Carla, Davi e Aurora aqui"), com o painel já apontado ("→ landing.html · Aurora · terminou · 14:02"). O organismo estava vivo antes de ela chegar, e ela vê isso em 5 s, não em 20.
4. **Do Chão: endereço, "Onde estão" e "por onde passou".** Endereço `sala › bancada › peça` em mono 11 px no cabeçalho do objeto; grupo "Onde estão" no Ctrl K (uma linha por pessoa e agente); "por onde passou" (rastro do agente com um Selo em cada parada) no Perfil do agente e no cabeçalho de 56 px. Vai junto com os limites dele: posição só em objeto compartilhado e só a atual, rastro de pessoa privado, caminhos agregados sem nome, nunca mapa de calor. Alimenta o "corpo da equipe" da TV sem inventar dado.
5. **Do Colegas: "ver o comando" dobrado e rotina como concessão.** Cada bloco de comando ganha título humano de uma linha ("Lia listou a pasta Clínicas · 12 arquivos") e o original (comando · saída · código · tempo) dobrado, imutável. A rotina do agente (o que faz sem OK) passa a ser concessão gravada no objeto ("rotina liberada por Carla · 14:00 · responder contatos marcados"), sem "aceites" e sem taxa por agente (ranking em potência).

Não roubar: a voz do agente (antropomorfismo, TV/iPad sem som, pt-BR não confirmado); "aceites" como número; "@Lia" no chat (segunda porta); os panoramas equiretangulares (álibi); o `b-entrada.mp4` de hoje (viola o v2).

---

## 6. O que os três acertaram juntos (e vale fixar como regra do artefato v2)

- Casca é código; vídeo e imagem são material; o material nunca se mexe sozinho ("nada anima sem dado"). Provado hoje com `ui-viva.mp4`.
- Rosto de agente nunca; pessoa = círculo com foto real; agente = quadrado com instrumento.
- Keyframe antes de vídeo; seed fixa onde há; `-an`; `enable_prompt_expansion false`; baixar em ≤ 1 h; `MANIFESTO` por lote; `prefers-reduced-motion` com estado final útil.
- Toda peça gerada vence lado a lado a versão a custo zero com 3 pessoas ou sai; custo visível na Carga; nenhuma função depende de nada gerado.
- A demo de 60 s é captura real do protótipo; o gerado só emoldura no site.
- "Não vi" não é "não existe".

---

## 7. Riscos que nenhum dos três resolve (para a síntese não fingir que resolveu)

1. **FUNCOES B só no app**: a Máquina lendo o Supabase real é pré-condição do corpo; no artefato HTML, o corpo é demonstração com dados de exemplo e tem de dizer isso na tela.
2. **Trellis em escala consistente**: uma folha de estilo comum e 3 seeds por peça reduzem, não eliminam; o aceite "fecha o cubo de 1 unidade" precisa de medição no glb (bounding box), não de olho.
3. **three.js na TV**: legibilidade a 3 m e CPU num Mac de entrada não foram medidas por ninguém; se pesar, a zona vira render estático que troca só em mudança de dado (o próprio Organismo prevê).
4. **Nomes**: nenhum dos três nomes foi testado com gente de fora; o meu sinal do Bing é fraco (aspas ignoradas). "Sistema com corpo" é a aposta com menos explicação.
5. **Token da Replicate** passou pelo chat: trocar ao fim (os três dizem; ninguém fez).

---

## 8. Fontes

**Lidas por mim nesta sessão**: https://replicate.com/firtoz/trellis · https://replicate.com/wan-video/wan-2.7-i2v · https://replicate.com/recraft-ai/recraft-v4-svg · https://www.atlassian.com/software/rovo · https://www.bing.com/search?q=%22organismo+de+equipe%22+software+agentes · https://www.bing.com/search?q=%22ch%C3%A3o+de+trabalho%22+app+equipe+agentes · https://www.bing.com/search?q=%22trabalho+%C3%A0+vista%22+software+equipe+agentes · https://www.bing.com/search?q=%22AI+teammate%22+agents+product (inconclusivo). DuckDuckGo (html.duckduckgo.com) devolveu CAPTCHA nas três buscas. WebSearch esgotado (200/200).

**Arquivos locais lidos**: `docs/design/CONCEITO.md` · `docs/design/GERACAO_REPLICATE.md` · `docs/FUNCOES.md` · `~/Desktop/stack-video-scroll/PROMPT_AGENTICO_LP.md` · `.deus/missao-design/{MISSAO,ENTREGA,RODADAS}.md`, `CAPSULA.json` · `pesquisa/visao-conceito-{organismo,lugar,colega}.md` (inteiros) · `docs/design/assets/raw/*/2026-09-23/MANIFESTO.jsonl` e os 8 SVG · imagens vistas: `assets/visao/{ui-primeiro,ui-ultimo,cofre,b-marca,orbe}.jpg` · cabeçalhos de `docs/design/visao.html` (v1 "Sala Conversacional").

**Não confirmado**: existência de produtos chamados "organismo de equipe", "chão de trabalho" ou "trabalho à vista" (buscas com aspas ignoradas); os "AI teammate" que o Colegas não leu; preço do `tencent/hunyuan3d-2mv` além do que a nota do Organismo diz ter lido; pt-BR no Chatterbox; tudo o que as frentes marcaram como não lido.
