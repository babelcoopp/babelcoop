# CADERNO DE PEÇAS · a Máquina do Babel Coop

> Missão `babel-coop/design-2030` · 23/09/2026 · consolidação das três frentes da Máquina: `maquina-construtores-e-fios.md` (14 construtores de nós, 85 páginas oficiais), `maquina-pecas-3d-contidas.md` (profundidade contida, acessibilidade, desempenho) e `maquina-geracao-por-ia.md` (catálogo Replicate 3D/imagem/SVG, three.js, pesos medidos). Cada regra abaixo aponta o achado e a URL que a sustenta (as URLs completas estão nos três arquivos; aqui vai a principal). O que não foi lido está marcado **não confirmado**.
> Material de base lido antes: `docs/MAQUINA.md`, `prototipo/maquina.js`, `prototipo/visual3d.js`, `prototipo/v3.css` (l. 241–295, 337–342, 405–421), `IDEIAS.md` §5.17–5.19, §10 e §15, `stack-video-scroll/PROMPT_AGENTICO_LP.md`, e `pesquisa/conceito-final.md` (a casca em que a Máquina vive).
> Pedido do Theus: "precisa estudar as peças que parecem 3D, que são as de montar o backend e o frontend, conectar os fios etc." Este caderno é a resposta: **a peça representa a própria função; parece objeto pelo corpo e pelo gesto, não pela pintura; um efeito só entra se for metáfora de um fato do backend.**

---

## 0. Como ler

1. §1 fecha as **sete decisões** que conciliam as três frentes com o conceito final (onde elas discordavam).
2. §2 e §3 são as regras que valem para todas as peças e os quatro estados.
3. §4 é o caderno propriamente dito: **uma ficha por peça** (12 peças).
4. §5 a §8: fios e pulso, montar e testar em equipe, como o preset aparece, o modo 3D.
5. §9 tokens; §10 o que ninguém fez; §11 o que não fazer; §12 pipeline de IA com slugs confirmados e prompts prontos; §13 orçamento de desempenho; §14 fontes; §15 não confirmado.

---

## 1. Sete decisões de conciliação (com motivo)

As três frentes foram escritas em paralelo e o conceito final (`conceito-final.md`) fixou a casca depois. Onde havia conflito, vale o seguinte:

| # | Conflito | Decisão | Motivo (fonte) |
|---|---|---|---|
| 1 | A frente 3D propôs uma escada própria (`#050a14 → #14203a`); o conceito final fixou `--s0 #060b16 · --s1 #0b1320 · --s2 #161e2d · --s3 #212a3b`. | **A Máquina usa a escada da casca.** Palco = `--s1` (é o Campo); bandeja Empresa = `--s0` (um degrau abaixo, o único côncavo); peça = `--s2`; frente/pino = `--s3`; peça ativa sobe para `--s3`. | Raycast: "depth is built entirely from the surface-color ladder: each notch lighter … reads as one step closer" (raw.githubusercontent.com/VoltAgent/awesome-design-md/…/raycast/DESIGN.md). Uma escada só evita que a Máquina pareça outro produto dentro da Estação (Linear 2026: barra lateral "alguns tons mais escura" para o conteúdo vir à frente, linear.app/now/behind-the-latest-design-refresh). |
| 2 | Frente 3D: vidro na Ficha e no HUD do teste (≤ 2 elementos). Conceito final: "a paleta Ctrl K é o único vidro e a única sombra". | **Nada flutua sobre a Máquina.** A Ficha da peça e o HUD do teste vivem na **Mesa** (coluna direita), opacos em `--s2`. Selecionar peça = a Mesa trava nela (lei 1 da casca: "a Mesa diz sempre onde está apontada"). Zero `backdrop-filter`, zero sombra flutuante. | Apple WWDC25 219: "always avoid glass on glass"; vidro sobre conteúdo "muddy the hierarchy" (developer.apple.com/videos/play/wwdc2025/219/). web.dev: backdrop-filter "may harm performance" (web.dev/articles/backdrop-filter). E a Mesa já existe para isso. |
| 3 | Frente 3D: sombra de peça em 2 camadas (Comeau). Conceito final: "elevação só pela escada; zero box-shadow colorida". | **Peça sem drop-shadow.** O corpo vem de quatro coisas: degrau da escada, hairline ≥ 3:1, **espessura** (`border-bottom: 2px` em `--s0`) e **especular** (`inset 0 1px 0 rgb(255 255 255 / .06)`). | Raycast keycap: "physical-key feel on a flat dark canvas" com degradê de 2 tons e sem sombra. Comeau só entra como princípio (uma luz, alto-esquerda) para o especular e a espessura. 40 peças com sombra são 40 paints por quadro (web.dev/articles/rendering-performance). |
| 4 | Frente 3D: Tela é "emissor permanente" (glow ciano 24 px). Conceito final, lei 3: "nada tem luz fixa; a luz é a idade do último evento" (meia-vida). | **Nenhuma peça emite em repouso.** A Tela é mais clara porque mostra uma miniatura real (a página é mais clara que o alumínio), não por glow. Toda luz de estado (verde passou, vermelho barrou, âmbar disparou, ciano ao vivo) **esfria pela meia-vida curta (6 s)** em vez de "voltar em 1,2 s" por timer. | Conceito final §2.6 (Meia-vida) e §5.5 ("sem neon permanente"). visionOS: "prefer subtle depth. It's easy to overdo" (developer.apple.com/videos/play/wwdc2023/10072/). TouchDesigner só anima "which nodes … are cooking" (docs.derivative.ca/Wire). |
| 5 | Frente 3D: 12 glifos isométricos em SVG (3dicons). Conceito final: família de 47 ícones de traço 1,5 px, sem preenchimento, leva única no recraft-v4-svg. | **Uma família só de ícones.** O glifo da peça (14 px no cabeçalho, 20 px na paleta) é o ícone de traço da casca; os 12 glifos da Máquina + 6 de estado entram **na mesma leva** dos 47, com o mesmo bloco de prompt. O "parece 3D" vem do corpo e do gesto da peça, nunca do ícone. Emojis (🗄 🚪 ⚙ 📦 🔐 🖥 🛂 🧪) saem. | Nothing: "no emoji as UI" (github.com/dominikmartn/nothing-design-skill). Raycast: ícones "follow the same rules for stroke width and corner radii" (raycast.com/blog/a-fresh-look-and-feel). Duas famílias de ícone na mesma tela é inconsistência do tipo que derrubou o iOS 6 (en.wikipedia.org/wiki/Skeuomorph). |
| 6 | Frente IA: pré-renderizar os glTF com câmera ortográfica em sprites para a Máquina 2D ("uma fonte para os dois modos"). | **A Máquina 2D é DOM (HTML/CSS/SVG); o glTF serve só ao modo 3D.** O que se compartilha entre 2D e 3D é a **gramática** (escada, espessura, pinos, estados, gestos), não o asset. | A peça 2D carrega texto vivo (campos, "50 → 51 linhas", alerta, avatar): sprite não faz isso, DOM faz de graça e é acessível (`aria-live`). E o 3D atual já desenha placas com `BoxGeometry` (visual3d.js). |
| 7 | Frente fios: cor da família na peça (roxo/verde/laranja/ciano) + cor da pessoa na borda + cor do tipo na porta. Frente 3D: peças neutras, cor só por função. | **Duas camadas de cor e só duas: pessoa (fita 3 px + iniciais) e estado (LED/veredito).** Família = **forma + glifo + rótulo mono** (Gaveta é caixa com frente; Robô é quadrado com engrenagem; Cano é tubo). Tipo do campo = glifo na linha, não cor. Natureza do fio = **textura** (sólido / fino com losango / tracejado cinza), não cor. | Armadilha registrada nas duas frentes: "três cores na mesma peça viram ruído". Teenage Engineering: cor por função, mono para rótulo (blakecrosley.com/guides/design/teenage-engineering). Blender: textura do fio diz a natureza (tracejado = campo) (blender-manual …/parts.rst, fields.rst). |

---

## 2. Regras gerais (valem para as 12)

| Regra | Valor | Fonte |
|---|---|---|
| Vista | frontal, no plano da tela; **nunca isometria de cena** (texto a 30° é ilegível e remete a jogo) | en.wikipedia.org/wiki/Isometric_projection · WWDC23 10072 "Keep text flat" |
| Grade | 8 px; tamanhos múltiplos de 8; pinos em posições fixas na borda; espaço interno em múltiplos de 4 (casca) | Lego: "bricks from 1958 still interlock"; "a universal system" (en.wikipedia.org/wiki/Lego) |
| Luz | uma, alto-esquerda; especular 1 px em cima; espessura 2 px embaixo | joshwcomeau.com/css/designing-shadows/ (mesma luz para tudo) |
| Escada | palco `--s1` → bandeja `--s0` → peça `--s2` → frente/pino/ativa `--s3` | decisão 1 |
| Hairline | 1 px `#506b94`: **3,43:1 sobre `--s1`, 3,08:1 sobre `--s2`** (calculado nesta sessão pela fórmula do WCAG, à mão; conferir no verificador). A `--linha #4d5564` da casca dá 2,48:1 sobre `--s1` e serve só a divisórias, não a peças. | w3.org/WAI/WCAG21/Understanding/non-text-contrast.html (1.4.11: ≥ 3:1 para componente) |
| Fio em repouso | `#506b94` (mesmo token da hairline; o `#3b4a7a` atual dá 2,17:1 sobre `--s1` e reprova) | idem |
| Raios concêntricos | bandeja 10 → peça 8 → frente 6 → chip 4 → pino 999 (a escala da casca: janela 10 → painel 8 → cartão 6 → chip 4) | WWDC25 356: "Concentric shapes calculate their radius by subtracting padding from the parent's" |
| Texto | sempre plano; nome Plex 13/Medium; frase 11,5 `--apagado #a8b8d5`; técnico JetBrains Mono 11 caps tracking .08 em (`TABELA · pacientes`) | conceito final §5.2 · TE: "Monospaced type signals precision" |
| Cor (duas camadas) | pessoa: 11 matizes `oklch(0.78 0.11 H)` da casca, só na fita, nas iniciais e no halo de "Ver por pessoa"; estado: `--ok #7fd6a6` passou · `--alarme #ff6b6b` barrou/alerta · `--atencao #f0b35a` disparou/não publicado · `--t0 #2ad5e5` ao vivo (todos ≥ 6:1 sobre `--s2`) | decisão 7 |
| Materiais (quatro, e só) | **alumínio anodizado escuro** (`--s2`, especular .06): tudo que guarda e controla · **papel** (linha de campo, `--linha-fraca`) · **obsidiana** (`#0a0713`, especular .10): só o Cofre · **emissor**: só o pulso e as bolinhas do Cano, por evento | Rams "honest" (vitsoe.com/us/about/good-design) · WWDC23 10072 (emissor × sólido) |
| Motion | percussivo: `--mov-toque 120 ms` (hover/foco: só cor e opacidade), `--mov-padrao 180 ms` `--ease-saida cubic-bezier(.2,0,0,1)` (encaixe, gesto físico), sem bounce; só `transform`/`opacity`/`stroke`; **um gesto físico por peça, só por evento real** | Nothing "click not swoosh" · lux.camera/physicality-the-new-age-of-ui/ · web.dev compositor-only |
| Luz de estado | decai pela meia-vida curta (6 s), sem timer nem keyframe; `prefers-reduced-motion` → três degraus (aceso · morno · repouso) | conceito final §2.6 |
| `prefers-reduced-motion` | **reduzir, não remover**: o ponto do pulso não anda, mas o fio troca de cor, a peça de chegada acende e `aria-live` narra ("passou pela Portaria"); substitui o `* { animation-duration: .01ms !important }` do base.css | web.dev/articles/prefers-reduced-motion |
| `prefers-contrast: more` | hairline `#8fa3c8`, estados com texto sempre (já são) | axesslab.com/neumorphism/ |
| Marca da pessoa | fita 3 px na borda esquerda + iniciais/foto 16 px no cabeçalho, **sempre** (IDEIAS §15); agente = bitmap 7×11 na cor de quem o dirige; "Ver por pessoa" = halo 25 % enquanto ligado; nunca a peça pintada inteira | Linear 2026: "elementos não devem competir por atenção que não conquistaram" · nenhum construtor tem autoria permanente por peça (ver §10) |
| Metáfora | só nas 12 palavras, no glifo e no gesto; nenhuma textura de material real | Skeuomorph (Wikipedia): elementos "harder to operate and take up more screen space" |

---

## 3. Os quatro estados (iguais para todas) + selecionada

| Estado | Forma | Cor | Motion | Texto / ARIA |
|---|---|---|---|---|
| **Nova / em construção** (o agente escreveu, a migração não aplicou) | contorno 1 px **tracejado 6/4**, fundo `--s1` a 50 %, **sem espessura, sem especular, sem pinos** (não tem corpo) | hairline apagada | entra com "encaixe": opacidade 0 → 1 + `translateY(4px) → 0`, 180 ms `--ease-saida`; assenta | mono: `em construção · migração pendente` |
| **Pronta** (existe no banco / no repositório) | sólida: `--s2`, hairline, espessura 2 px, especular, pinos visíveis | neutra | ao virar pronta: o contorno tracejado vira sólido em 180 ms e a espessura "aparece" (o corpo é **conquistado**) | — |
| **Ativa** (o pulso está aqui) | sobe um degrau (`--s3`) + `translateY(-1px)`; o **gesto físico** da peça acontece | borda 1,5 px na cor do veredito (verde/vermelho) que **esfria em 6 s** | 120 ms entrada; decaimento por meia-vida | `aria-live="polite"`: "a linha entrou na gaveta Agendamentos" |
| **Com alerta** | hairline 1,5 px vermelha + glifo de alerta + **frase** dentro da peça | `--alarme` | nenhum laço; entra uma vez por opacidade | `⚠ aberta para todos` · `⚠ chave faltando: ZAPI_TOKEN` · `⚠ sem checagem de login` |
| **Suja** (mudou depois do último teste verde) | triângulo âmbar no lugar do ✓ verde do teste | `--atencao` | — | `mudou depois do teste · testar de novo` |
| **Não publicada** (está no local/branch, não em produção) | ponto azul 6 px no canto superior direito | `--t1 #7ba4f0` | — | conta em "O que muda" |
| (+) **Selecionada** (a pessoa está olhando) | anel 2 px `--t0` offset 2 (o foco da casca) | `--t0` | — | a Mesa trava na peça (Ficha) |

Ativa ≠ selecionada: ativa é o dado passando (verde/vermelho), selecionada é a pessoa olhando (ciano). Nunca a mesma cor. Sujo e não-publicado vêm do n8n ("dirty node": "a different-colored border and a yellow triangle in place of the previous green tick") e do Node-RED ("blue circle above it" para "undeployed changes").

---

## 4. As 12 peças, uma ficha por peça

Formato de cada ficha: **forma · material e luz · estados · marca da pessoa · como se conecta · formato final (2D / 3D) · rota de produção · por quê**.

### 4.1 Gaveta (tabela)
- **Forma**: 176 × auto (grade 8). **Frente** de 24 px no topo, o keycap: degradê de um degrau (`--s3 → --s2`), puxador (traço 16 × 2 em `--apagado`) centralizado, glifo à esquerda, **cadeado** (a Chave) à direita, iniciais da pessoa no canto. Abaixo, os Campos como linhas de 24 px. Rodapé mono: `TABELA · pacientes · 50 linhas`.
- **Material e luz**: alumínio; frente = keycap. Sem glow.
- **Estados**: nova (tracejada, sem frente em relevo) · pronta · ativa (frente abre: `rotateX(-4deg)` com `perspective: 1400px` no palco e `transform-style: preserve-3d` só na frente; a linha nova aparece por opacidade; rodapé `50 → 51 linhas`) · alerta (`⚠ aberta para todos`, `⚠ ligação sem índice`) · suja · não publicada.
- **Marca da pessoa**: fita 3 px + iniciais na frente; quem fechou o cadeado aparece na Ficha ("fechada por empresa · Rita · 14:33").
- **Como se conecta**: pino de **entrada à esquerda** (Portas e Telas que gravam), pino de **saída à direita** (Fios de relação para outras Gavetas; o Campo "ligação" tem pino próprio na sua linha), pino **inferior** (Robôs e Cano que ela aciona). Direção pela geografia: entra pela esquerda, sai pela direita, sempre.
- **Formato final**: 2D = `<button class="mq-peca mq-gaveta">` (DOM); 3D = `BoxGeometry` 3 × 2 × 0,5 studs com ranhuras (uma por campo) procedurais, material compartilhado, 0 KB.
- **Rota**: **à mão** (é a peça mais repetida; tem que ser paramétrica em n campos).
- **Por quê**: Unity/Blender mostram o resultado na própria peça (prévia); a gaveta que "abre 2 px quando entra a linha" é a fisicalidade do Lux ("se comporta como coisas que conhecemos") aplicada ao fato "INSERT".

### 4.2 Campo (coluna)
- **Forma**: linha de 24 px dentro da Gaveta; glifo do tipo 14 px (texto ¶ · número # · dinheiro $ · data ▭ · sim/não ◐ · lista ≡ · código ⌗ · ligação = pino · arquivo ▣ · JSON {}), nome em Plex 12,5, tipo em mono apagado. Borda esquerda 2 px `--linha-fraca` (papel).
- **Material e luz**: papel (1 degrau acima da peça, `--linha-fraca`).
- **Estados**: novo (tracejado só na linha) · pronto · ativo (a linha pisca uma vez por opacidade .6 → 1 quando o pulso grava nela) · alerta (`sem índice`).
- **Marca da pessoa**: não tem fita (ruído); em "Ver por pessoa" a borda esquerda da linha toma a cor de quem adicionou o campo.
- **Como se conecta**: só o Campo "ligação com X" tem pino (círculo 6 px na borda direita da linha) de onde sai o Fio de relação; os demais não conectam.
- **Formato final**: 2D = DOM; 3D = textura de canvas na face da placa (texto é texto, nunca gerado).
- **Rota**: **à mão**.
- **Por quê**: Blender e Unity põem a forma do tipo na porta; aqui o tipo mora no glifo da linha (decisão 7) e a "ligação" é a única linha que vira porta.

### 4.3 Fio (chave estrangeira; e os outros dois fios)
Há **três fios** com textura própria (lei 3 dos construtores):
- **Fio de relação** (FK, o "Fio" do vocabulário): cabo **1,5 px** fino, curva em S, com **losango 6 px** na ponta da gaveta "muitos" (Blender: forma = estrutura). Não pulsa. Hover: destaque `--t0` e etiqueta em português "cada Agendamento pertence a um Paciente".
- **Fio de fluxo** (o pedido anda: Tela → Porta → Gaveta → Robô → Cano → Tela): cabo **2 px** sólido; é o único que **pulsa** no Testar.
- **Fio de referência** (Tela usa Porta; Robô usa Cofre; Portaria libera): **tracejado 2/3 cinza**, sem pulso, nunca animado (TouchDesigner Links). Cofre e Portaria são "sem-fio" por padrão: etiqueta na peça ("usa: ZAPI_TOKEN") em vez de fio até cada Robô (Max send/receive; Origami Wireless).
- **Forma**: parte e chega em **pinos** (6 px + anel 1 px), passa **por baixo** das peças, num único `<svg>` no palco. Ao arrastar, o pino de destino cresce para 10 px a 24 px do cursor (snap do React Flow).
- **Material e luz**: neutro `#506b94`; ativo: cor do veredito por meia-vida.
- **Estados**: solto (FK sem tabela: tracejado vermelho) · inválido ao arrastar (vermelho sólido antes de soltar, Blender) · pronto · vivo (só o ponto do pulso, §5).
- **Marca da pessoa**: sem fita; hover mostra "ligado por Davi · 14:32"; em "Ver por pessoa" o fio toma a cor de quem ligou.
- **Como se conecta**: `isValidConnection` em português: Tela → Gaveta direto é barrado e sugere a Porta no meio ("uma Tela não grava direto numa Gaveta; passa por uma Porta · criar Porta?"), como o auto-cast do Unreal. Soltar no vazio abre "o que dá para ligar aqui". Soltar uma peça sobre um fio a insere (Node-RED, Blender). Duplo clique no fio cria um ponto de desvio (Unity Redirect). Opacidade dos fios ajustável por pessoa (VCV "Cable opacity"), guardada no navegador.
- **Formato final**: 2D = `<path>` + `<circle>` (pino); 3D = `TubeGeometry` fina (relação) / `Line2` + `LineMaterial` com `dashed` para referência; `resolution` atualizada no resize.
- **Rota**: **à mão** (código, 0 KB).
- **Por quê**: Pd: "signal connections are thicker than control connections"; Unreal separa fio de execução (pulsa) de fio de dado; sem pino não há como validar nem dizer o que o fio carrega (armadilha 12 da frente de fios).

### 4.4 Chave (política RLS)
- **Forma**: cadeado 14 px **na frente da Gaveta**, nunca peça solta; é uma **flag** (Houdini): preenchido = fechada ("cada empresa vê só o seu" / "só o dono"), contorno cinza = aberta + alerta vermelho.
- **Material e luz**: metal escuro; aberto = `--alarme`.
- **Estados**: fechada · aberta (alerta `⚠ aberta para todos`) · **barrando** (no Testar, como a outra empresa: treme 2 px, 2 ciclos de 120 ms, e acende vermelho; `reduce` → só acende) · ao fechar pela Ficha: "clique" (`scale .9 → 1`, 120 ms).
- **Marca da pessoa**: quem fechou fica na Ficha (blame da peça) e na linha do tempo.
- **Como se conecta**: não tem pino. No Testar ela é o **filtro no fio** (Make): o pulso da outra empresa **morre no cadeado** e a bolha do fio diz `0 passaram · 1 barrado pela chave: cada empresa vê só o seu`.
- **Formato final**: 2D = SVG 14 px (dois estados) na leva de ícones; 3D = sprite 2 estados na placa.
- **Rota**: **leva única de ícones (recraft-v4-svg)**; se o traço não bater, à mão (é um contorno simples).
- **Por quê**: Houdini flags: "When a flag is on it is filled with color. When it's off it shows the node's background color". É a única peça cuja função é **barrar**, então o gesto é o único negativo do sistema (o pulso que morre).

### 4.5 Empresa (tenant)
- **Forma**: **bandeja rebaixada**, o único côncavo: raio 10, fundo `--s0` (um degrau abaixo do palco), hairline `#506b94`, etiqueta mono caps no canto superior esquerdo (`EMPRESA · cada uma vê só o seu`), que **escala com o zoom** para ler de longe na TV (Unreal comment box). Arrastar a bandeja arrasta as gavetas dentro (React Flow `group` + `extent: 'parent'`).
- **Material e luz**: é o chão, não objeto; sem especular, sem espessura.
- **Estados**: nova (tracejada) · pronta · **aceitou** (ao soltar uma gaveta dentro: a hairline acende `--t0` por 300 ms; o agente adiciona `tenant_id` + chave + índice) · alerta: mora na gaveta (`⚠ por empresa, mas aberta`), não na bandeja.
- **Marca da pessoa**: fita 3 px na etiqueta.
- **Como se conecta**: não tem pino; a Portaria liga à bandeja por fio de referência tracejado ("liberou").
- **Formato final**: 2D = `div` posicionada; 3D = `PlaneGeometry` rebaixada com borda.
- **Rota**: **à mão**.
- **Por quê**: iOS 7: profundidade é ordem entre planos; a bandeja é o plano de baixo. Multi-tenancy é "estar dentro de", então a peça é uma área, como a moldura colorida que todos os construtores maduros têm (Unreal, Houdini, Node-RED, n8n).

### 4.6 Portaria (Auth)
- **Forma**: 152 × auto, mais alta que larga; uma **fresta horizontal de 4 px** (o leitor) logo abaixo do nome; papéis como chips 4 px de contorno (`dono` `atendente`). Tom um degrau **mais escuro** no cabeçalho (é gerador, TouchDesigner: geradores escuros, filtros claros).
- **Material e luz**: alumínio.
- **Estados**: nova · pronta · **ativa**: a fresta acende verde (`entrou como Ana, da Clínica Vida`) ou vermelha (`senha errada`) e esfria em 6 s · alerta (`sem papéis definidos`).
- **Marca da pessoa**: fita + iniciais.
- **Como se conecta**: pino de **saída à direita** ("liberou"), de onde sai o fio de fluxo para as Telas e o fio de referência para a bandeja. Não recebe fio de Gaveta.
- **Formato final**: 2D = DOM; 3D = glTF ≤ 120 KB (guarita com cancela) gerado por IA a partir do keyframe, material trocado pelo compartilhado; ou, se o Trellis não convencer, 3 caixas + cancela extrudada à mão.
- **Rota**: **IA (firtoz/trellis) → gltfpack → material nosso**; 2D à mão.
- **Por quê**: é a única peça em que uma geometria "orgânica" (guarita) vale o custo (US$ 0,035 × seeds); a fresta que acende é a metáfora do "login passou" sem palavra técnica.

### 4.7 Porta (rota de API / Edge Function)
- **Forma**: 152 × auto; **conector de entrada grande** (10 px) na borda esquerda; verbo em mono caps (`RECEBE paciente + quando`), frase do comentário de uma linha do código; cabeçalho um degrau **mais claro** (filtro).
- **Material e luz**: alumínio.
- **Estados**: nova · pronta · **ativa**: o conector acende e o ponto do pulso "entra" (some 4 px dentro da peça e sai pelo pino direito) · alerta (`⚠ sem checagem de login`) · suja · **fixada** (o pedido de exemplo está pinado: faixa mono `dados fixos para teste`, n8n pin data).
- **Marca da pessoa**: fita + iniciais.
- **Como se conecta**: entrada à esquerda (Telas), saída à direita (Gaveta que grava). Forma da porta: **círculo** = um registro (`novo`), **três traços** = muitos (`listar`), como Blender (Single × List).
- **Formato final**: 2D = DOM; 3D = 3 caixas (batente) + seta de SVG → `SVGLoader.toShapes()` → `ExtrudeGeometry` com chanfro; ≤ 60 KB.
- **Rota**: **à mão**.
- **Por quê**: a Porta é o "filtro" na gramática do TouchDesigner; o conector grande diz "aqui entra" sem seta (lei 1: direção pela geografia).

### 4.8 Robô (trigger, pg_cron, webhook, função)
- **Forma**: 96 × 96, quadrada; engrenagem 20 px (glifo) no centro; etiqueta mono embaixo: `quando entra` · `quando muda` · `todo dia às 08:00`; LED 6 px no canto.
- **Material e luz**: alumínio; LED âmbar só ao disparar.
- **Estados**: novo · pronto · **disparou**: a engrenagem gira 60° (180 ms) e o LED acende `--atencao`, esfriando em 6 s; `reduce` → só o LED; **nunca gira em repouso** · alerta (`sem alvo`) · **erro** (fio vermelho de saída separado: `se o WhatsApp falhar → tenta de novo`, Make/Retool "On Error").
- **Marca da pessoa**: fita + iniciais.
- **Como se conecta**: entrada **inferior** (da Gaveta/Porta que o aciona); saída à direita (o que ele faz: Cano, outra Porta, serviço externo como etiqueta). Referência tracejada ao Cofre ("usa: ZAPI_TOKEN").
- **Formato final**: 2D = DOM + SVG da engrenagem; 3D = engrenagem de SVG → `ExtrudeGeometry` (contorno 2D extrudado), ≤ 30 KB.
- **Rota**: **à mão** (IA só para a folha de estilo).
- **Por quê**: "gira quando dispara" é a única animação de rotação do sistema e é metáfora literal; tudo o mais parado (Nothing: "percussive").

### 4.9 Depósito (bucket do Storage)
- **Forma**: 176 × 64, baixa e larga: **prateleira** com 3 divisórias; régua de uso de 2 px no rodapé (`1,2 GB`); glifo à esquerda.
- **Material e luz**: alumínio.
- **Estados**: novo · pronto · **recebeu** (uma "caixa" a mais aparece por opacidade na prateleira) · alerta (`público sem querer`).
- **Marca da pessoa**: fita + iniciais.
- **Como se conecta**: entrada **superior** (do Campo "arquivo" da Gaveta que aponta para ele).
- **Formato final**: 2D = DOM; 3D = prateleira = 4 caixas procedurais, 0 KB.
- **Rota**: **à mão** (a frente de IA cogitou Trellis; caixas empilhadas não precisam).
- **Por quê**: a prateleira é a metáfora que a equipe viveu; a régua de uso é o dado que importa (quanto ocupa).

### 4.10 Cofre (variáveis de ambiente e segredos)
- **Forma**: 240 × auto; chaves como lista com **LED 6 px** cada (`SUPABASE_URL ●` verde · `ZAPI_TOKEN ○` vermelho + botão `pedir ao Theus`); nunca o valor.
- **Material e luz**: **obsidiana**, o único polido: fundo `#0a0713`, especular `.10`, raio 8.
- **Estados**: novo · pronto · **entregue** (o LED vai de vermelho a verde com "clique" `scale .9 → 1`) · alerta (`✗ ZAPI_TOKEN · pedir ao Theus`).
- **Marca da pessoa**: fita + iniciais; **por pessoa**: cada um vê o próprio cofre (o que falta para mim).
- **Como se conecta**: não recebe pulso; **sem-fio**: as peças que usam uma chave mostram a etiqueta (`usa: ZAPI_TOKEN`); hover na chave acende as peças que a usam (um evento, várias luzes, lei 3 da casca).
- **Formato final**: 2D = DOM; 3D = glTF ≤ 120 KB (cofre com maçaneta), material trocado, visto por trás via multi-vista.
- **Rota**: **IA (firtoz/trellis + tencent/hunyuan3d-2mv para trás/lados) → gltfpack → material nosso**; 2D à mão.
- **Por quê**: o único polido porque é o único que guarda segredo (material diz função, Rams "understandable"); sem-fio porque todo robô usaria fio até ele e viraria espaguete (Max: send/receive ligam "without using patch cords").

### 4.11 Tela (página do frontend)
- **Forma**: 176 × 112; **miniatura real** da página (iframe congelado ou captura) com moldura hairline; nome embaixo; nenhuma moldura de monitor.
- **Material e luz**: é a única peça "clara" porque a miniatura é clara; sem glow (decisão 4).
- **Estados**: nova (tracejada, miniatura cinza `tela ainda sem conteúdo`) · pronta · **ativa** (a miniatura atualiza: opacidade .7 → 1 quando o Cano avisa) · alerta (`usa porta que não existe`).
- **Marca da pessoa**: fita + iniciais (a mesma marca do bloco `data-por` da edição na tela).
- **Como se conecta**: saída à direita (Portas que ela chama) e entrada **inferior** (Cano). Clique = abre a aba da tela no Campo (Site | Código | 3D).
- **Formato final**: 2D = DOM com `<iframe sandbox>` congelado ou `<img>`; 3D = `CSS3DObject` com iframe real + `PlaneGeometry` de borda (já existe em visual3d.js): **só ela é interativa no 3D** (IDEIAS 5.19).
- **Rota**: **à mão**.
- **Por quê**: Unity/Blender mostram o resultado na peça; a Tela é a peça cujo resultado é a própria página. E o embrião de "iframe vivo ligado ao backend na mesma cena" já é nosso.

### 4.12 Cano (Realtime / fila)
- **Forma**: 128 × 24: **tubo** com duas hairlines e interior um degrau abaixo (`--s1`); vazio em repouso; etiqueta mono `AO VIVO · agendamentos`.
- **Material e luz**: emissor **só quando há evento**.
- **Estados**: novo · pronto (vazio) · **evento**: 1–3 bolinhas `--t0` de 4 px atravessam em 600 ms (`animateMotion`), depois nada · alerta (`sem assinante`).
- **Marca da pessoa**: fita na etiqueta.
- **Como se conecta**: entrada à esquerda (Gaveta), saída à direita (Tela). Fio de fluxo, mais **grosso** (3 px): é dado, não comando (Pd).
- **Formato final**: 2D = SVG (tubo + `<circle>` com `<animateMotion><mpath>`); 3D = `TubeGeometry` translúcida + esferas ou `Line2` com `dashOffset` animado só durante o evento.
- **Rota**: **à mão**.
- **Por quê**: "vazio quando nada muda" é calm tech e a lei 3 da casca; o único laço permitido no sistema é este, e só enquanto há evento.

---

## 5. A linguagem dos fios e do pulso

**Verde libera, vermelho barra.** O pulso é a metáfora do request andando (Origami: "pulses are On ✓ only for a single frame"; a Gaveta é o estado que persiste).

1. **O que pulsa**: só o fio de fluxo, só durante Testar ou ao vivo (Enter numa Tela no 3D). Fio de relação e de referência nunca pulsam.
2. **Como pulsa**: um **ponto de 6 px com rastro** (opacidade .35, 24 px) corre pelo caminho: 2D com `<circle><animateMotion dur="…"><mpath href="#fio-x"/></animateMotion></circle>` (Baseline 2020) ou `offset-path: url(#fio-x)` (Baseline 2022); 3D com esfera + `PointLight` reaproveitada (já existe). Duração 0,8 s + 0,05 s por unidade de comprimento. Nunca o fio inteiro piscando em laço (`stroke-dasharray` infinito sai).
3. **O fio muda de cor** para o veredito e esfria pela meia-vida (6 s). Só o ponto e a peça de chegada acendem.
4. **Ao chegar**: a peça vira "ativa" (sobe um degrau) e faz **o seu gesto** (§4). `aria-live` narra em português.
5. **Vermelho morre no pino**: barrado pela Chave ou pela Portaria, o ponto some com `scale → 0` no pino de chegada; o cadeado treme; a bolha do fio diz `0 passaram · 1 barrado pela chave: …` (Make: filtro na linha).
6. **Depois do teste**: bolha com número acima de cada peça do caminho (`1 operação` · `+1 linha` · `WhatsApp enviado`), clicável, abre entrada/saída (Make bundles); status curto de ≤ 20 caracteres embaixo da peça (Node-RED status).
7. **Textura = natureza** (Blender/TouchDesigner/Pd): sólido 2 px = fluxo; fino 1,5 px + losango = relação; tracejado 2/3 cinza = referência; 3 px = dado ao vivo (Cano). **Borda** tracejada = peça que ainda não existe; **fio** tracejado parado = referência; tracejado **andando** = só o Cano em evento. Nunca o mesmo tracejado para coisas opostas (armadilha 1 da frente de fios).
8. **Rastrear × aprender**: cor por textura ensina; para rastrear, hover destaca o fio inteiro em `--t0` e os dois pinos (TouchDesigner: amarelo no hover; VCV: "easier to spot if the cables it's close to are different colours").
9. **Orçamento**: ≤ 3 pulsos simultâneos; 1 `<svg>` de fios; `will-change: transform` ligado só nas peças do caminho durante o teste e desligado no fim; `IntersectionObserver` + `visibilitychange` cortam qualquer laço.
10. **`prefers-reduced-motion`**: o ponto não anda; fio e peça trocam de cor, texto e `aria-live` iguais. A informação (passou/barrou) nunca some.

---

## 6. Como se monta e testa em equipe

**Montar** (o gesto Lego; MAQUINA.md §5 + leis 4 e 5 dos construtores):
- Peça arrastada da paleta (esquerda, Catálogo → "Peças") entra **tracejada, sem corpo**; o agente escreve a migração; quando aplica, ela **conquista corpo** (sólida, espessura, pinos) com o encaixe percussivo. Peça que o agente cria pelo terminal entra do mesmo jeito, na ordem em que ele fez.
- Fio: sai de um pino; pino alvo cresce a 24 px; inválido fica vermelho antes de soltar; soltar no vazio pergunta "o que ligar aqui?"; Tela → Gaveta sugere criar a Porta no meio; Shift ao soltar encadeia (Max).
- "Puxar do nó inteiro" para leigo: modo **Ligar** na barra da Máquina; arrastar de qualquer ponto da peça; o fio flutua até a borda mais próxima e a porta certa é escolhida pela família (React Flow easy-connect).
- Gaveta solta na bandeja Empresa: bandeja "aceita" (hairline `--t0` 300 ms); o agente adiciona `tenant_id`, chave e índice; o cadeado aparece fechado.
- Cadeado: clique abre na Mesa as quatro escolhas em português ("cada empresa vê só o seu", "só o dono", "todos leem, só o dono muda", "aberta ⚠").
- Cada gesto vira cartão no terminal (`✓ Gaveta Pacientes fechada por empresa · [ver SQL] [desfazer]`) e migração no repositório; a Máquina nunca escreve no banco.
- **Em equipe**: autoria permanente (fita + iniciais) em toda peça; **presença** separada: halo fino + cursor na cor da pessoa **só na peça em que ela está agora** (Figma/tldraw); "Seguir o Davi" na TV é o observation mode; peça pedida a alguém mostra a foto dele enquanto ele está nela (MAQUINA.md §7). Estado **pessoal** (zoom, colapso de domínio, opacidade dos fios) fica no navegador de cada um; estado **da equipe** (peças, fios, testes, presets) no diário replicado (n8n: "collapse state is a personal browser preference").
- **Anti-espaguete**: junção no fio (duplo clique), sem-fio para Cofre e Portaria, colapsar um domínio ("Agenda") numa peça só com breadcrumb ao entrar (Blender Tab), moldura Empresa com título que escala, "arrumar" automático, regra de equipe: "peças repetidas duas vezes viram preset" (Unreal best practices).
- **Linha do tempo** (rodapé, 24 px): quem/agente montou o quê, quando, clicável; **com teto e filtro** por pessoa e por peça (Node-RED corta em 100 mensagens).

**Testar** (MAQUINA.md §6; a Mesa é o HUD):
1. Botão **Testar** (cápsula, a única ação em destaque; produção não tem teste). A Mesa mostra: porta escolhida, formulário montado a partir do que a porta recebe, "como quem" (uma pessoa de teste de cada empresa).
2. Enviar: o pulso verde percorre Portaria → Tela → Porta → Gaveta → Robô → Cano → Tela, com os gestos de cada peça (§4) e a narração na Mesa e em `aria-live`. A Gaveta mostra **a linha que entrou** (`Maria Souza · amanhã 14:30`), não só o verde (Retool: "A workflow cannot determine if its actions produced the results you expected").
3. **Como a outra empresa**: pulso vermelho, cadeado treme, ponto morre no pino, `barrado pela chave: cada empresa vê só o seu`. É assim que a equipe aprende RLS sem o nome.
4. **Parar em qualquer peça** (breakpoint do Unreal): clique na peça durante o teste → "ver o que chegou" na Mesa; seta vermelha sobre a peça atual.
5. **Fixar** o pedido de exemplo numa Porta para retestar só o Robô (n8n pin data, "development only"); a peça ganha a faixa `dados fixos para teste`.
6. Teste por Porta, profundidade máxima 4 (visual3d.js já limita); máquina grande não testa inteira de uma vez (n8n: "execution data is too large").
7. Ao terminar tudo verde: aparece **"Salvar como preset"** (já é assim no protótipo) e cada peça do caminho ganha o ✓ verde; mexer numa delas depois troca o ✓ por triângulo âmbar (suja).

---

## 7. Como um preset aparece

Preset = **grafo de peças + fios** (nunca imagem), com **portas publicadas** (lei 9: Blender Group Input/Output, Unity Sub Graph, Houdini HDA, Origami Publish Port).

- **Na lista** (Criar → "Começar de um preset" e na Máquina, painel Presets): cartão em `--s2` com: glifo de preset (peças encaixadas), **nome**, chip `4 peças` ou `tela`, iniciais/foto de quem fez (fita na cor dele), `usado 3×` (campo `usos` já existe), **✓ testou e passou em 23/09 14:41** (`testadoEm` já existe), selo `verificado` quando o Theus sela (o Selo da casca, anel 16 px), e a **versão** (`v2`). Um botão: `Usar neste projeto` (primário só quando há Máquina aberta).
- **Portas publicadas**, em português: `precisa de: uma Gaveta Pacientes` (entrada) · `entrega: Porta "novo agendamento", Robô "aviso no WhatsApp", Cano` (saída). Ao usar, o que falta aparece tracejado com `⚠ falta a Gaveta Pacientes · ligar a uma existente?`.
- **Ao usar**: as peças entram uma a uma com o encaixe, na ordem, com a marca de quem **usou** na fita e o crédito do autor do preset na Ficha (`do preset "Agendamento" · por Rita · v2`).
- **Envelhece com honestidade**: se uma peça do preset mudou depois do teste, o cartão mostra o triângulo âmbar `mudou depois do teste`; quando o preset ganha versão nova, os projetos que o usam mostram `atualizar preset v3` (Origami upgrade prompt); o preset guarda `versao`, `autor`, `testadoEm`, `usos`, `portas.entrada[]`, `portas.saida[]`.
- **Na paleta**: presets aparecem como peças compostas arrastáveis (TouchDesigner Palette, Node-RED subflow com cor/ícone/categoria). Um preset não pode conter a si mesmo (Node-RED).
- Regra de equipe: **só nasce do teste verde**; nenhum construtor lido liga preset a "teste passou" (§10).

---

## 8. O modo 3D (visual3d.js), na mesma gramática

- **Mesma peça vista de lado**: placas em WebGL com `0x161e2d` corpo, `0x212a3b` frente/pino, `roughness .6`, `metalness .2`, **emissive 0 em repouso** (hoje .25 → 0); só pulso emite. Especular baixo. Chanfro único de 0,06 stud em tudo.
- **Uma luz, um material**: `HemisphereLight` + `DirectionalLight` (já existem) + 1 `PointLight` de pulso reaproveitada; **ou** um matcap único (`MeshMatcapMaterial`: "encodes baked lighting") para todas as placas. Nunca o albedo do Trellis (sombra assada = 12 luzes diferentes).
- **Texto plano**: etiquetas como sprites viradas para a câmera (já é assim), nunca coladas em ângulo.
- **Jacks no painel** (VCV): pinos como pequenos cilindros na borda da placa; fios como tubos com tensão saindo dos jacks; tracejado só enquanto anda.
- **Flags e badges como luzes**: cadeado = luz preenchida/cinza; alerta = badge grande atrás da placa para a TV (Houdini "Large").
- **Telas**: `CSS3DObject` com iframe real, `sandbox="allow-scripts allow-forms"`, postMessage `babel-enter`/`babel-clique` (já existe). Elas **nunca recebem luz** (CSS3DRenderer: "not possible to use the material system"); quem acende é a `PlaneGeometry` de borda ao lado.
- **Limites**: `pixelRatio ≤ 1,5`; loop pausa em `visibilitychange` e fora da viewport (`IntersectionObserver`); ≤ 3 luzes; damping desligado com `reduce`; câmera sem movimento automático; aviso quando o zoom do navegador ≠ 100 % (CSS3DRenderer "only supports 100% browser and display zoom").
- **glTF**: só Portaria e Cofre vêm de IA; passam por `gltfpack -cc -tc` (three.js r122+ com `setMeshoptDecoder`) ou `gltf-transform optimize`; alvo ≤ 120 KB por peça e ≤ 300 KB o kit; carregado só quando o modo 3D abre (three 0.186 = 181 KB min+gzip, Bundlephobia).
- **O que o 3D não é**: espetáculo. Todos os construtores maduros são 2D; cada efeito 3D é a metáfora de um fato do backend (luz acende = chegou; tubo pulsa = andando; cadeado fecha = barrou). Sem partículas, sem chão infinito animado, sem câmera passeando.

---

## 9. Tokens (rascunho para `docs/design/tokens.css`, herdando os da casca)

```css
:root {
  /* escada: a da casca (conceito-final §5.1) */
  --mq-palco: var(--s1);        /* #0b1320 · o Campo */
  --mq-bandeja: var(--s0);      /* #060b16 · Empresa, rebaixada */
  --mq-peca: var(--s2);         /* #161e2d */
  --mq-frente: var(--s3);       /* #212a3b · frente da gaveta, pino, peça ativa */
  --mq-obsidiana: #0a0713;      /* só o Cofre */
  /* linhas (WCAG 1.4.11, calculado à mão nesta sessão; conferir) */
  --mq-hairline: #506b94;       /* 3,43:1 sobre --s1 · 3,08:1 sobre --s2 */
  --mq-hairline-forte: #8fa3c8; /* prefers-contrast: more */
  --mq-fio: var(--mq-hairline);
  --mq-papel: var(--linha-fraca);
  /* corpo: uma luz, alto-esquerda; sem drop-shadow */
  --mq-especular: inset 0 1px 0 rgb(255 255 255 / .06);
  --mq-especular-polido: inset 0 1px 0 rgb(255 255 255 / .10);
  --mq-espessura: 2px;
  /* estados: cor por função, não por peça (os da casca) */
  --mq-passou: var(--ok);       /* #7fd6a6 */
  --mq-barrou: var(--alarme);   /* #ff6b6b */
  --mq-disparou: var(--atencao);/* #f0b35a · também "sujo" e "não publicado" usa --t1 */
  --mq-ao-vivo: var(--t0);      /* #2ad5e5 */
  --mq-selecao: var(--t0);
  /* geometria */
  --mq-grade: 8px;
  --mq-raio-bandeja: 10px; --mq-raio-peca: 8px; --mq-raio-frente: 6px; --mq-raio-chip: 4px;
  --mq-pino: 6px; --mq-pino-alvo: 10px;
  --mq-fio-fluxo: 2px; --mq-fio-relacao: 1.5px; --mq-fio-dado: 3px;
  /* motion: os da casca */
  --mq-toque: var(--mov-toque);   /* 120ms */
  --mq-padrao: var(--mov-padrao); /* 180ms */
  --mq-curva: var(--ease-saida);  /* cubic-bezier(.2,0,0,1), sem overshoot */
  --mq-meia-vida: var(--mv-curta);/* 6s */
}
.mq-palco { background: var(--mq-palco); perspective: 1400px; }
.mq-peca { background: var(--mq-peca); border: 1px solid var(--mq-hairline); border-bottom-width: var(--mq-espessura); border-bottom-color: var(--mq-bandeja); border-left: 3px solid var(--pessoa); border-radius: var(--mq-raio-peca); box-shadow: var(--mq-especular); transition: transform var(--mq-toque) var(--mq-curva), background var(--mq-toque); }
.mq-peca.construindo { border-style: dashed; border-bottom-width: 1px; box-shadow: none; background: color-mix(in oklch, var(--mq-palco), var(--mq-peca) 50%); }
.mq-peca.ativa { transform: translateY(-1px); background: var(--mq-frente); }
.mq-peca.alerta { border-color: var(--mq-barrou); border-width: 1.5px; }
.mq-peca.sel { outline: 2px solid var(--mq-selecao); outline-offset: 2px; }
.mq-gaveta .mq-frente { background: linear-gradient(180deg, var(--mq-frente), var(--mq-peca)); border-radius: var(--mq-raio-frente); transform-style: preserve-3d; }
.mq-gaveta.ativa .mq-frente { transform: rotateX(-4deg); }
.mq-cofre { background: var(--mq-obsidiana); box-shadow: var(--mq-especular-polido); }
.mq-fio { stroke: var(--mq-fio); stroke-width: var(--mq-fio-fluxo); fill: none; }
.mq-fio.relacao { stroke-width: var(--mq-fio-relacao); }
.mq-fio.referencia { stroke-dasharray: 2 3; }
.mq-fio.dado { stroke-width: var(--mq-fio-dado); }
.mq-fio:hover, .mq-fio.rastrear { stroke: var(--mq-ao-vivo); }
.mq-pulso { r: 3px; fill: var(--mq-passou); } .mq-pulso.barrou { fill: var(--mq-barrou); }
@media (prefers-reduced-motion: reduce) { .mq-pulso animateMotion { display: none; } .mq-gaveta.ativa .mq-frente { transform: none; } .mq-robo.ativa .mq-engrenagem { transform: none; } }
@media (prefers-contrast: more) { .mq-peca, .mq-fio { border-color: var(--mq-hairline-forte); stroke: var(--mq-hairline-forte); } }
```

Regras: `opacity < 1`, `filter`, `overflow ≠ visible`, `clip-path` e `mix-blend-mode` **achatam** o `preserve-3d` (MDN transform-style): por isso a peça em construção usa `color-mix` no fundo, não `opacity`, e o `overflow` fica nos filhos.

---

## 10. O que ninguém fez (espaço do Babel Coop)

1. **Autoria permanente por peça** (fita + iniciais/foto de quem criou, sempre) somada a **presença** ao vivo sem confundir as duas: os construtores só têm presença (Figma, tldraw) ou blame por linha (GitHub).
2. **Preset que nasce do teste verde e fica "sujo"** quando uma peça dele muda, com versão, autor, usos e portas publicadas: n8n tem dirty node e template com autor; Houdini/Origami têm versão/upgrade; ninguém junta tudo nem liga a "teste passou".
3. **A regra de acesso (RLS) como peça física e testável**: o cadeado que treme e mata o pulso da outra empresa, com "como quem" no teste. Make/Retool têm rota de erro; nenhum tem "barrado por regra" desenhado no fio.
4. **Pulso que carrega o dado de verdade** (`Maria Souza · amanhã 14:30`) pelo fio e o deixa na gaveta: Make mostra bundles ao clicar, ninguém anima o registro andando.
5. **Tela HTML real e interativa ligada às peças do backend na mesma cena 3D** (CSS3D + postMessage, já embrionário em visual3d.js).
6. **Linha do tempo de construção por agente e pessoa** (quem montou o quê, quando, clicável): os construtores registram execuções, não a montagem.
7. **Peça que fala português por baixo do nome técnico**, com a tradução gravada na verdade (`COMMENT ON POLICY`).
8. **Peça que conquista corpo**: tracejada e sem espessura enquanto é intenção do agente; ganha espessura, especular e pinos quando a migração aplica. Nenhum construtor representa "existe no banco" como fisicalidade.
9. **Escada de superfície como altura de dado**: "um degrau mais claro = o pulso está aqui agora", esfriando pela meia-vida. Raycast usa a escada para hierarquia estática.
10. **Cor por função num construtor visual** (peças neutras em alumínio; a cor só diz o que aconteceu) com a cor de pessoa como fita e nunca como pintura.
11. **A mesma gramática em 2D e 3D** (escada, espessura, pinos, gestos), com IA só onde a geometria é orgânica e o material sempre trocado pelo da casa: a IA entrega forma, a casa entrega luz.
12. **Pulso que morre no pino** (`scale → 0`): nenhuma fonte de edges animadas mostra um pulso com fim negativo.

---

## 11. O que não fazer

1. Isometria de cena para "parecer 3D" (texto a 30°, conotação de jogo). O 3D de verdade é um modo da Tela; a Máquina é frontal.
2. Vidro nas peças ou flutuando sobre o palco. Ficha e HUD moram na Mesa, opacos.
3. Peça da cor do palco + sombra (neumorfismo): contraste 1:1 por construção. Hairline ≥ 3:1 sempre; estado sempre com texto.
4. As duas hairlines em uso hoje (`#30334c` 1,61:1; `#42597d` 2,79:1) e o fio `#3b4a7a` (2,17:1) reprovam no 1.4.11: usar `#506b94`.
5. Glow permanente (o ciano de 24 px na peça ativa e o neon da Tela): pinta a cada quadro e "se tudo brilha, nada é importante". Luz só por evento, esfriando.
6. Fio inteiro em laço (`stroke-dasharray` infinito): sem direção nem fim. Ponto com direção e veredito.
7. Bounce no encaixe (`cubic-bezier(.2,1.4,…)`): percussivo, `--ease-saida`, assenta 1 px.
8. Tracejado com dois sentidos (`.construindo` × `.mq-fio.vivo`): borda tracejada = não existe; fio tracejado parado = referência; andando = só Cano em evento.
9. Emojis como glifo: leva única de SVG de traço, a mesma da casca.
10. Três cores na mesma peça (pessoa + família + estado): família é forma, não cor.
11. Pulso permanente ou decorativo; partículas; câmera passeando; chão animado no 3D.
12. `opacity < 1` ou `filter` num contêiner com `preserve-3d` (achata sem aviso).
13. `prefers-reduced-motion` que zera tudo com `!important` (apaga a informação). Reduzir, não remover; `aria-live`.
14. "Qualquer saída em qualquer entrada" (VCV): barrar na hora e sugerir a peça do meio.
15. "Sucesso" técnico como resultado: mostrar a linha que entrou, não só o verde.
16. Log/linha do tempo sem teto e sem filtro.
17. Preset sem versão, sem "sujo" e sem aviso de upgrade: mente em um mês.
18. `pixelRatio` 2, loop sem pausa, `LineMaterial.resolution` sem atualizar no resize.
19. Sprites de peça no 2D (perde texto vivo e acessibilidade); Spline como base (263 KB gz, `.splinecode` proprietário, glTF não confirmado); Rive/Lottie (nada que `stroke-dashoffset` não dê com 0 KB).
20. Slugs mortos: `stability-ai/stable-fast-3d` e `camenduru/tripo-sr` dão 404 na Replicate; `firtoz/trellis` recebe `images` (array), `hunyuan3d-2` recebe `image`; `hunyuan-3d-3.1` é `prompt` **ou** `image`; `nano-banana-2` não tem `seed` e devolve `jpg` por padrão (pedir `png`).
21. Albedo de imagem→3D no produto (sombra assada = 12 luzes). Descartar; material da casa.
22. Deixar output da Replicate sem baixar (expira em 1 hora) ou sem `MANIFESTO.json`.

---

## 12. Pipeline de IA (slugs confirmados; prompts prontos)

Regras herdadas do PROMPT_AGENTICO_LP.md: keyframe antes de qualquer 3D; SVG nativo para ícone; seed fixa quando o modelo tem; orçamento duro (parar em 80 %); `GET /v1/models/{owner}/{name}` antes da primeira chamada; baixar em ≤ 1 h; `MANIFESTO.json` (modelo, versão, seed, prompt, custo, data). Seed da casa: `19770815` (a mesma dos sons do conceito final).

**Bloco-base** (idêntico em toda geração de imagem de peça):
`isometric orthographic view, elevation 35 degrees, rotated 45 degrees, single object centered, one small key light from upper-left, soft fill, no cast shadow on ground, matte dark slate body, uniform 2mm beveled edges, one thin cyan edge light, solid #060b16 background, no text, no labels, no people, clean product render, same scale as reference sheet, the object fits a 1-unit cube. [NEGATIVE] no perspective, no ground plane, no gradient background, no extra objects, no letters, no reflections of environment`

| # | Elemento | Modelo (slug) | Confirmado | Formato | Custo est. |
|---|---|---|---|---|---|
| 1 | Folha de estilo (3 peças na mesma folha: gaveta, cofre, guarita) | `google/nano-banana-2` | sim (schema lido; sem `seed`; `image_input` ≤ 14) | png, 1:1, 1K | 6 × 0,067 = US$ 0,40 |
| 2 | Keyframes das 2 peças orgânicas (Portaria, Cofre) + vistas trás/esq/dir do Cofre | `black-forest-labs/flux-2-max` (`seed` + `input_images` ≤ 8) | sim (schema); **preço não lido** | png, 1:1, 1 MP | ≈ US$ 0,6–0,9 (com nano-banana-2 como alternativa: 13 × 0,067 = 0,87) |
| 3 | Recorte dos keyframes | `bria/remove-background` | sim (`preserve_alpha`) | png com alpha | 8 × 0,018 = US$ 0,14 |
| 4 | Geometria (Portaria, Cofre) | `firtoz/trellis` (`images` array, `seed`, `randomize_seed: false`) | sim (US$ 0,035, ~25 s, MIT) | glb → `gltfpack -cc -tc` | 2 × 3 seeds × 0,035 = US$ 0,21 |
| 5 | Cofre visto por trás (modo 3D) | `tencent/hunyuan3d-2mv` (`front/back/left/right_image`, `seed`, `target_face_num`, `file_type`) | sim (schema); **preço não confirmado** (≈ 0,13 por análogo `tencent/hunyuan3d-2`) | glb | ≈ US$ 0,13–0,26 |
| 6 | Glifos: 12 peças + 6 estados (alerta, sujo, não publicado, fixado, barrado, preset), na leva dos 47 da casca | `recraft-ai/recraft-v4-svg` (sem `style`/`seed`; estilo no prompt) | sim (US$ 0,08) | svg, 24 px, traço 1,5, `currentColor` | 18 × 0,08 = US$ 1,44 |
| 7 | Matcap (a luz de todas as placas do 3D) | à mão (canvas: esfera com degradê radial) · opcional `google/nano-banana-2` | sim | png 512 × 512, ≤ 20 KB | 0 (ou 0,07) |
| 8 | Gaveta, Campo, Fio, Empresa, Porta, Robô, Depósito, Tela, Cano, pulso, cadeado (gesto), frente keycap, tokens | nenhum: CSS/SVG/three.js à mão | — | DOM + SVG + geometria procedural | 0 |
| 9 | **Não usar** | `stability-ai/stable-fast-3d`, `camenduru/tripo-sr` | **não** (404) | — | 0 |
| | **Total** | | | | **≈ US$ 2,9–3,4** (≈ 15–17 % dos US$ 20); parar e reportar em US$ 16 acumulados da missão |

**Prompts prontos**

- **#1 folha de estilo** (`google/nano-banana-2`, `output_format: "png"`, `aspect_ratio: "1:1"`, `resolution: "1K"`):
  `Style sheet with three objects in one row at identical scale, each inside an invisible 1-unit cube: (1) a small filing cabinet with one drawer half open, (2) a compact safe with a round handle, (3) a small security gate booth with a horizontal reader slot and a lowered barrier arm. ` + bloco-base.
- **#2 keyframe por peça** (`black-forest-labs/flux-2-max`, `input_images: [folha.png]`, `seed: 19770815`, `aspect_ratio: "1:1"`, `output_format: "png"`):
  `Same style, light and scale as the reference sheet. [PIECE] a small security gate booth with a horizontal reader slot and a lowered barrier arm, single object centered. ` + bloco-base. Para o Cofre: `[PIECE] a compact safe with a round handle and a thin door seam`. Vistas: acrescentar `rear view, same object, same light` / `left side view` / `right side view` com `input_images: [folha.png, cofre-frente.png]`.
- **#3 recorte** (`bria/remove-background`): `{ "image": "<url>", "preserve_alpha": true }`.
- **#4 geometria** (`firtoz/trellis`): `{ "images": ["<keyframe-recortado.png>"], "seed": 19770815, "randomize_seed": false, "mesh_simplify": 0.95, "texture_size": 512, "generate_color": true, "generate_normal": false, "generate_model": true, "save_gaussian_ply": false }` → descartar o albedo, aplicar o material compartilhado, alinhar à caixa de 1 stud, `gltfpack -cc -tc -i in.glb -o out.glb`.
- **#5 multi-vista** (`tencent/hunyuan3d-2mv`): `{ "front_image": "...", "back_image": "...", "left_image": "...", "right_image": "...", "seed": 19770815, "randomize_seed": false, "target_face_num": 20000, "file_type": "glb", "remove_background": true }`.
- **#6 glifos** (`recraft-ai/recraft-v4-svg`, um por chamada, `size: "1024x1024"`), bloco idêntico ao dos 47 ícones da casca:
  `Minimal line icon, single black stroke of uniform 1.5px on a 24px grid, square miter joins, butt caps, no fill, no shadow, no gradient, no text, centered on white, [ICON]`. Lista dos 18 `[ICON]`: `a filing cabinet with one drawer half open` (Gaveta) · `a single horizontal list row with a small tag` (Campo) · `a curved cable joining two small circles` (Fio) · `a closed padlock` (Chave) · `a simple two-story building outline` (Empresa) · `a gate booth with a barrier arm` (Portaria) · `a door frame with an arrow entering from the left` (Porta) · `a six-tooth gear` (Robô) · `a shelf with three boxes` (Depósito) · `a safe with a round handle` (Cofre) · `a plain rectangular screen without stand` (Tela) · `a horizontal pipe with three small dots inside` (Cano) · `a triangle with an exclamation mark` (alerta) · `a triangle with a small clock` (sujo) · `a small circle above a rectangle` (não publicado) · `a push pin` (fixado) · `a circle with a diagonal bar` (barrado) · `three interlocking bricks` (preset).
- **#7 matcap** (opcional, `google/nano-banana-2`, 1:1, png): `A perfectly centered matte dark slate sphere filling the square frame, lit by one key light from the upper-left with soft fill, a thin cyan rim light on the upper-right edge, solid black background, no environment reflections, no text.` Recorte com #3.

---

## 13. Orçamento de desempenho (Mac comum, 60 fps)

| Item | Limite | Por quê |
|---|---|---|
| Peças visíveis por zoom | ≤ 40 (zoom "máquina inteira" agrupa por domínio) | camadas custam memória (web.dev layer count) |
| Fios | 1 `<svg>`; caminhos recalculados só ao mover peça | evita paint por quadro |
| Pulsos simultâneos | ≤ 3 | 1 elemento animado por pulso |
| Propriedades animadas | `transform`, `opacity`, `stroke` | compositor (web.dev rendering-performance) |
| `box-shadow` / `backdrop-filter` | nunca na Máquina | decisões 2 e 3 |
| `will-change` | só durante o Testar, ligado/desligado por script | MDN: "last resort" |
| Meia-vida | 1 `requestAnimationFrame` a 4 Hz sobre ≤ 200 elementos (o da casca) | conceito final §2.6 |
| 3D: luzes | 2 fixas + 1 de pulso | Spline: "< 3 luzes por cena" |
| 3D: `pixelRatio` | ≤ 1,5 | PROMPT_AGENTICO §8 |
| 3D: loop | pausa em aba oculta / fora da viewport | PROMPT_AGENTICO §8 |
| 3D: peso | three 181 KB gz sob demanda + glTF ≤ 300 KB + matcap ≤ 20 KB | Bundlephobia; gltfpack |
| Medição | 40 peças + 12 fios + 3 pulsos no Mac de referência, DevTools Performance, ≤ 10 ms por quadro | web.dev |

---

## 14. Fontes principais (URL lida; a lista completa por frente está nos três arquivos)

Construtores e fios: vcvrack.com/manual/GettingStarted · community.vcvrack.com/t/cable-management-suggestion/19739 · dev.epicgames.com/documentation/en-us/unreal-engine/blueprint-variables-in-unreal-engine · …/blueprint-debugger-in-unreal-engine · …/blueprint-best-practices-in-unreal-engine · docs.unity3d.com/Packages/com.unity.shadergraph@17.0/manual/Port.html · …/Sub-graph.html · projects.blender.org/blender/blender-manual/raw/branch/main/manual/interface/controls/nodes/parts.rst · …/modeling/geometry_nodes/fields.rst · www.sidefx.com/docs/houdini/network/flags.html · …/badges.html · docs.derivative.ca/Wire · docs.derivative.ca/Operator · docs.cycling74.com/userguide/patch_cords/ · docs.cycling74.com/reference/send/ · msp.ucsd.edu/Pd_documentation/2.theory.of.operation.htm · nodered.org/docs/creating-nodes/status · nodered.org/docs/user-guide/editor/workspace/nodes · docs.n8n.io/build/understand-workflows/understand-executions/understand-dirty-nodes.md · docs.n8n.io/build/work-with-data/pin-and-mock-data.md · help.make.com/filtering · help.make.com/scenario-execution-flow · docs.retool.com/workflows/concepts/logs · www.figma.com/blog/multiplayer-editing-in-figma/ · tldraw.dev/sdk-features/bindings · reactflow.dev/api-reference/components/handle · reactflow.dev/examples/edges/animating-edges · reactflow.dev/examples/nodes/easy-connect · reactflow.dev/learn/layouting/sub-flows · origami.design/documentation/concepts/pulsesignal · origami.design/documentation/workflow/components · docs.github.com/en/repositories/working-with-files/using-files/viewing-and-understanding-files

Peças contidas: www.dezeen.com/2013/06/10/new-apple-ios-software-flat-design-jonathan-ive-wwdc/ · en.wikipedia.org/wiki/Skeuomorph · en.wikipedia.org/wiki/Neumorphism · axesslab.com/neumorphism/ · www.vitsoe.com/us/about/good-design · github.com/dominikmartn/nothing-design-skill/blob/main/nothing-design/SKILL.md · blakecrosley.com/guides/design/teenage-engineering · raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/raycast/DESIGN.md · linear.app/now/behind-the-latest-design-refresh · developer.apple.com/videos/play/wwdc2025/219/ · developer.apple.com/videos/play/wwdc2025/356/ · developer.apple.com/videos/play/wwdc2023/10072/ · linear.app/now/linear-liquid-glass · www.lux.camera/physicality-the-new-age-of-ui/ · en.wikipedia.org/wiki/Isometric_projection · developer.mozilla.org/en-US/docs/Web/CSS/transform-style · developer.mozilla.org/en-US/docs/Web/CSS/perspective · www.joshwcomeau.com/css/designing-shadows/ · www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html · web.dev/articles/prefers-reduced-motion · web.dev/articles/rendering-performance · web.dev/articles/backdrop-filter · developer.mozilla.org/en-US/docs/Web/CSS/will-change · en.wikipedia.org/wiki/Lego

Geração por IA e 3D: replicate.com/firtoz/trellis/llms.txt · replicate.com/tencent/hunyuan3d-2mv/llms.txt · replicate.com/tencent/hunyuan3d-2/llms.txt · replicate.com/tencent/hunyuan-3d-3.1/llms.txt · replicate.com/google/nano-banana-2/llms.txt · replicate.com/black-forest-labs/flux-2-max/llms.txt · replicate.com/bria/remove-background/llms.txt · replicate.com/recraft-ai/recraft-v4-svg · replicate.com/recraft-ai/recraft-v3-svg/llms.txt · www.recraft.ai/docs/api-reference/styles · replicate.com/collections/3d-models · replicate.com/stability-ai/stable-fast-3d (404) · replicate.com/camenduru/tripo-sr (404) · raw.githubusercontent.com/microsoft/TRELLIS/main/README.md · raw.githubusercontent.com/mrdoob/three.js/dev/src/materials/MeshMatcapMaterial.js · …/src/cameras/OrthographicCamera.js · …/examples/jsm/loaders/SVGLoader.js · …/src/geometries/ExtrudeGeometry.js · …/examples/jsm/lines/LineMaterial.js · …/examples/jsm/renderers/CSS3DRenderer.js · …/examples/jsm/loaders/GLTFLoader.js · raw.githubusercontent.com/zeux/meshoptimizer/master/gltf/README.md · gltf-transform.dev/cli · developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/animateMotion · developer.mozilla.org/en-US/docs/Web/CSS/offset-path · developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/stroke-dashoffset · bundlephobia.com/api/size?package=three · bundlephobia.com/api/size?package=@splinetool/runtime · docs.spline.design/exporting-your-scene/how-to-optimize-your-scene

Internos: `docs/MAQUINA.md` · `prototipo/maquina.js` · `prototipo/visual3d.js` · `prototipo/v3.css` · `IDEIAS.md` §5.17–5.19, §10, §15 · `stack-video-scroll/PROMPT_AGENTICO_LP.md` · `pesquisa/conceito-final.md` · `pesquisa/maquina-construtores-e-fios.md` · `pesquisa/maquina-pecas-3d-contidas.md` · `pesquisa/maquina-geracao-por-ia.md`.

---

## 15. Não confirmado (não inventar)

- Preço do `black-forest-labs/flux-2-max` e do `tencent/hunyuan3d-2mv` (não lidos); `tencent/hunyuan-3d-3.1` "US$ 0,50 per unit" sem unidade definida; `hyper3d/rodin` sem preço exposto.
- Tripo (API própria) devolveu 403; não existe na Replicate.
- Exportação glTF do Spline.
- Unreal: fios pulsando durante Play (a doc lida só descreve breakpoint, seta vermelha, watch, trace).
- TouchDesigner: as cores exatas de cada família.
- "Linear 3D icons", "Raycast 3D icons", "Vercel Ship 3D": sem fonte primária lida; não citar.
- Medidas do Lego em mm (só o princípio foi lido).
- Os contrastes deste caderno foram calculados à mão pela fórmula do WCAG 2.x (o `node` da sessão foi barrado): conferir em um verificador antes de fixar os tokens. Os valores medidos na frente 3D (`#506b94` 3,65:1 sobre `#050a14`) batem com a ordem de grandeza.
- A cota de WebSearch da sessão estava esgotada nas três frentes; tudo veio de WebFetch por URL direta.
