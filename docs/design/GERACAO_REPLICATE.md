# GERACAO_REPLICATE · elementos do app gerados por IA (aceite A6)

> `docs/design/` · 23/09/2026 · regras herdadas de `~/Desktop/stack-video-scroll/PROMPT_AGENTICO_LP.md` e `BRIEFING_IA.md`; catálogo e schemas confirmados pela API (`GET /v1/models/{owner}/{name}`, 17 slugs, HTTP 200, schemas salvos em `scratchpad/replicate/*.json`; notas em `.deus/missao-design/pesquisa/geracao-replicate.md` e `maquina-geracao-por-ia.md`). Conta: `theusveyra`. **Token só em variável de ambiente da sessão (`REPLICATE_API_TOKEN`), nunca em arquivo do projeto; trocar ao fim da missão.**

---

## 0. As regras (não negociáveis)

1. **Keyframe antes de vídeo**: nenhum vídeo nasce sem a imagem de partida aprovada.
2. **SVG nativo para ícone**: `recraft-ai/recraft-v4-svg`; ícone nunca nasce PNG para vetorizar; família inteira numa **leva única** com o mesmo bloco de prompt; ícone fora do traço é regerado, nunca retocado.
3. **Baixar em ≤ 1 h**: as saídas da Replicate expiram; download imediato + `MANIFESTO.json`.
4. **Seed fixa** onde o modelo tem (`19770815`); onde não tem (nano-banana-2, recraft), a coerência vem do prompt idêntico e da referência.
5. **Schema lido** antes da primeira chamada de cada modelo.
6. **Loop nunca com primeiro = último quadro** (tende a gerar vídeo parado): método das duas metades. (Sem uso na v2: os loops foram cortados.)
7. **Sem áudio automático**: `wan-2.7-i2v` gera áudio se `audio` faltar (descartar com `-an`); `stable-audio-2.5` tem `duration` padrão de 190 s (sempre passar 3). `enable_prompt_expansion: false` sempre.
8. **Toda animação tem desligamento** (`prefers-reduced-motion` com estado final útil).
9. **Orçamento como limite duro**: US$ 20 nesta missão; parar e reportar em US$ 16; `MANIFESTO.json` com custo por predição e total acumulado.
10. **Vídeo assíncrono** com `Cancel-After: 15m` e polling de 2 s (não há servidor público para webhook); `Prefer: wait` só para SVG e imagem.
11. **Um efeito só entra se for metáfora do serviço**; "nada anima sem dado"; teto de 2 sinais vivos por tela.

---

## 1. O kit depois do corte dos críticos

| # | Elemento | Modelo (slug confirmado) | Entrada | Saída | Custo est. (US$) |
|---|---|---|---|---|---|
| 1 | **61 ícones em SVG nativo** (43 da casca + 12 peças + 6 estados da Máquina), **portão de 3 antes do lote** | `recraft-ai/recraft-v4-svg` (`prompt`, `size "1024x1024"`; sem `seed`/`style`; US$ 0,08) | prompt idêntico + sujeito | `.svg`, viewBox 20, `currentColor`, sprite `<symbol>` | 3 × 0,08 = **0,24** (portão) · 61 × 0,08 + 30 % = **6,34** (lote) |
| 2 | **Keyframes A e N do "b"** no material chapado da marca (A = b chapado em `--texto` sobre `#060b16`; N = o mesmo b com só 15 % do traço, em `--t0`) | `google/nano-banana-2` (`image_input: [babel-logo.png]`, `aspect_ratio 1:1`, `resolution 2K`, `output_format png`; sem `seed`; US$ 0,101) | `prototipo/babel-logo.png` como referência | 2 png 2K | 4 × 0,101 = **0,40** |
| 3 | **Clipe "Entrada"** (candidato com portão; a Entrada definitiva de base é o b em SVG que se desenha, custo 0) | rascunho `bytedance/seedance-2.0-fast` (`image` = N, `last_frame_image` = A, 480p, `duration 4`, `generate_audio false`, `seed`) → final `wan-video/wan-2.7-i2v` (`first_frame` = N, `last_frame` = A, 720p, `duration 4`, `seed`, `enable_prompt_expansion false`, sem `audio` → `-an`) | data URI dos keyframes | mp4 720p 4 s sem áudio; é a própria tela de login sobre `#060b16` (sem blend, sem alfa); termina em A e cruza para Meu dia; qualquer tecla pula | 0,28 (rascunho) + 0,40 (final) = **0,70**; teto 2 tentativas = 1,40 |
| 4 | **Folha de estilo + keyframes das 2 peças orgânicas do 3D** (Portaria, Cofre) | `google/nano-banana-2` 1K (folha) → `black-forest-labs/flux-2-max` (`seed`, `input_images ≤ 8`; preço não lido) ou nano-banana-2 | bloco-base isométrico (§3) | png 1:1 | ≈ **1,3** |
| 5 | **Recorte** dos keyframes | `bria/remove-background` (`preserve_alpha`; US$ 0,018) | png | png com alfa | 8 × 0,018 = **0,14** |
| 6 | **Geometria** de Portaria e Cofre | `firtoz/trellis` (`images` **array**, `seed`, `randomize_seed false`; US$ 0,035, ~25 s, MIT) → `gltfpack -cc -tc` → material da casa (albedo descartado) | png recortado | glb ≤ 120 KB cada | 2 × 3 seeds × 0,035 = **0,21** |
| 7 | Cofre visto por trás (modo 3D) | `tencent/hunyuan3d-2mv` (`front/back/left/right_image`; preço não confirmado, ≈ 0,13) | 4 vistas | glb | ≈ **0,26** |
| 8 | Som "espera" (só se o oscilador Web Audio soar barato no teste) | `stability-ai/stable-audio-2.5` (`duration 3`, `steps 8`, `cfg_scale 7`, `seed`; US$ 0,20) | prompt | wav → mp3/ogg ≤ 300 ms (`silenceremove` antes do corte, `loudnorm` depois; aceite: pico ≥ −6 dBFS nos primeiros 30 ms) | 0 – **0,40** |
| — | **À mão, custo zero** (recusado gerar por IA de propósito): anel de estado, Selo, linha do agente, meia-vida, luzes do rodapé, hairline de projeção, coluna de intensidade, chip do Puxar, grade de pontos, b estático em SVG, b que se desenha, matcap (canvas), todas as 12 peças em DOM/SVG, fios, pulso, pinos, cadeado (gesto), frente keycap | CSS + SVG + three.js procedural | — | 0 KB de runtime; Lottie/Rive recusados | **0** |
| | **Total** | | | | **≈ 9,6 (base) a 11,3 (com o teto do clipe e o som)** de 20; parada em 16 |

**Cortados na v2** (e por quê): loop da logo na abertura (splash de 3 s numa ferramenta de 8 h; `--mov-heroi` toca uma vez, nunca em laço); campo profundo (nebulosa a 6 % é invisível numa TV real; wallpaper de espaço); loop da TV (efeito sem metáfora); seis sons (nenhuma linha do FUNCOES.md pede som; só "espera" tem função); tubo de neon fotorrealista e "ruído que resolve" (clichê 2019–2022; dois materiais para a mesma marca); `stability-ai/stable-fast-3d` e `camenduru/tripo-sr` (404 na Replicate).

---

## 2. O portão dos ícones (feito primeiro, sempre)

**Por que**: o Recraft entrega vetor editável, mas pode devolver **forma preenchida** (contorno do traço vetorizado como `fill`) em vez de `<path stroke>`. Se vier preenchido, `currentColor` vai no `fill`, o `stroke-width` não existe, e a política "rejeitar preenchido e regerar" nunca converge. Então: **3 ícones, abrir o SVG, checar `stroke` vs `fill`**. Se `stroke`: lote de 61. Se `fill`: os 61 são desenhados à mão (cada um já está descrito numa linha geométrica; a mesma mão garante a coerência que o prompt idêntico só promete) com `fill: currentColor`, e a Replicate não entra nos ícones.

**Portão**: `reuniao` (a round table seen from above with four seats) · `maquina` (three blocks connected by one line) · `tela-html` (a browser window with a top bar). Custo US$ 0,24.

**Estado nesta sessão**: o script do portão está pronto (`scratchpad/gera_svg.sh`, reproduzido em §5), o diretório de destino existe (`docs/design/assets/raw/recraft-v4-svg/2026-09-23/`), **mas a execução foi negada pela permissão do Bash desta sessão**; nenhuma predição foi criada, custo US$ 0,00. O portão roda no próximo terminal com o token no ambiente:

```zsh
source /caminho/fora/do/projeto/replicate.env   # REPLICATE_API_TOKEN=...
./gera_svg.sh reuniao "a round table seen from above with four seats"
./gera_svg.sh maquina "three blocks connected by one line"
./gera_svg.sh tela-html "a browser window with a top bar"
grep -c '<path' docs/design/assets/raw/recraft-v4-svg/2026-09-23/*.svg
grep -o 'stroke="[^"]*"\|fill="[^"]*"' docs/design/assets/raw/recraft-v4-svg/2026-09-23/reuniao.svg | sort | uniq -c
```

Aceite do portão: cada SVG tem `stroke` (não só `fill`), um grupo só, sem `<image>`, sem gradiente, sem texto; dois tamanhos ópticos (20 px barra; 16 px árvore/abas/chips) saem do mesmo desenho com glifo simplificado no menor.

---

## 3. Prompts prontos

### 3.1 Ícones (bloco idêntico em todas as 61 chamadas; um sujeito por chamada)
```
Single UI icon, vector line art. Monoline stroke of exactly 1.5 px on a 20x20 grid with a 2 px inner margin, square miter corners, butt line caps, no fill, no shadow, no gradient, no texture, no background, no text. Pure black (#000000) stroke on transparent. Geometric, sober, precise, the register of an instrument panel in a control room: every line has a function, nothing decorative. Consistent optical weight with a family of 61 icons drawn in the same hand. Subject: <sujeito>
```
Pós-processo: `sed 's/#000000/currentColor/g'`, `svgo`, `viewBox="0 0 20 20"`, sprite `<symbol id="i-<nome>">`.

**43 da casca** · atividades (12): meu-dia (a sun disc half above a horizon line) · criar (a blank sheet with one folded corner) · trabalho (a rectangle with a short baseline underneath, a ticket) · chat (two overlapping speech rectangles) · whatsapp (a single speech rectangle with a small handset inside) · reuniao (a round table seen from above with four seats) · terminais (a rectangle with a chevron prompt inside) · projetos (three nested rectangles offset like a stack) · acervo (an open book seen from above) · equipe (three small circles in a row on a baseline) · loja (a simple box with a slot on top) · oficina (a wrench and a slash crossing). Tipos (12): pasta (a folder outline) · nota-md (a sheet with two horizontal lines) · codigo (angle brackets) · tabela-csv (a 3x2 grid) · pdf (a sheet with a bottom band) · imagem (a rectangle with a small circle and a mountain line) · video (a rectangle with a triangle) · mapa-mental (a circle with three branches) · quadro (a rectangle with a free curve inside) · tela-html (a browser window with a top bar) · maquina (three blocks connected by one line) · pesquisa (a magnifier). Ações (19): projetar (a screen rectangle with an upward arrow) · levar-reuniao (a round table with an arrow entering) · pedir-ajuda (a raised hand outline) · chamar (a person circle with a radio wave) · seguir (an eye with a line to a small square) · parar (a square) · desfazer (a counter-clockwise arrow) · versoes (a clock with a counter-clockwise arrow) · editar-na-tela (a cursor arrow over a rectangle) · salvar (a downward arrow into a tray) · subir-arquivo (an upward arrow out of a tray) · gravar (a circle with a small dot) · memoria-sala (a horizontal line of five short vertical ticks) · ideia-falada (a speech rectangle with a small lightbulb) · cronometro (a stopwatch) · sino (a bell) · tv (a wide rectangle on a short stand) · engrenagem (a gear) · puxar (a chevron with an arrow entering it from the left). (Selar, romper e presença usam o próprio Selo e o anel; uma só lupa.)

**18 da Máquina** · peças (12): gaveta (a filing cabinet with one drawer half open) · campo (a single horizontal list row with a small tag) · fio (a curved cable joining two small circles) · chave (a closed padlock) · empresa (a simple two-story building outline) · portaria (a gate booth with a barrier arm) · porta (a door frame with an arrow entering from the left) · robo (a six-tooth gear) · deposito (a shelf with three boxes) · cofre (a safe with a round handle) · tela (a plain rectangular screen without stand) · cano (a horizontal pipe with three small dots inside). Estados (6): alerta (a triangle with an exclamation mark) · sujo (a triangle with a small clock) · nao-publicado (a small circle above a rectangle) · fixado (a push pin) · barrado (a circle with a diagonal bar) · preset (three interlocking bricks). (As 4 peças novas do Supabase, armário · ferramenta · carteiro · casa-de-maquinas, entram na mesma leva quando forem construídas: 65.)

### 3.2 Keyframes do "b" (`google/nano-banana-2`, `image_input: [babel-logo.png]`, 1:1, 2K, png)
- **A**: `Use the attached logo as the exact reference for shape and proportions. Render the lowercase "b" mark exactly as in the reference, centered, occupying 42% of the frame height, as a flat, matte, single-color stroke of uniform 1.5% frame-height thickness in light blue-white (#d7e4fb) on a solid dark background (#060b16). No glow, no halo, no gradient, no neon, no glass, no reflections, no floor, no texture, no text. Perfectly sharp, square 1:1, flat everywhere except the stroke.`
- **N** (com A como referência): `Same framing, background and stroke thickness as the attached image. Show only the first 15% of the stroke length of the "b" (the start of its stem, at the bottom), in cyan (#2ad5e5); the rest of the mark is absent. Solid #060b16 elsewhere. No glow, no gradient, no text. 1:1.`

### 3.3 Clipe "Entrada" (`seedance-2.0-fast` → `wan-2.7-i2v`; `first_frame` = N, `last_frame` = A; 4 s; seed 19770815)
`[LENS] fixed 50mm, locked-off camera, no movement. [MOTION] over 4 seconds the cyan stroke draws itself along the path of the lowercase "b", from the bottom of the stem to the end of the bowl, at constant speed, like a pen with a single stroke; in the last second the finished stroke cools from cyan (#2ad5e5) to light blue-white (#d7e4fb) and holds perfectly still. [SUBJECT] a single flat lowercase "b" stroke exactly as in the last frame. [LIGHT] flat; the stroke is the only bright element; the background stays solid #060b16. [NEGATIVE] no camera motion, no zoom, no cut, no flicker, no glow, no halo, no gradient background, no text, no extra shapes, no sound.` · `negative_prompt: camera shake, zoom, cut, flicker, text, watermark, lens flare, bloom, glow, extra objects, color banding`. Pós: `ffmpeg -an -pix_fmt yuv420p -color_range pc -crf 18`; aceite: quadro 0 e último indistinguíveis de N e A (diferença ≤ 1 nível); rejeitar se aparecer halo. **Expectativa honesta**: o b em SVG (custo 0) deve ganhar; o clipe só entra se 3 pessoas o preferirem lado a lado.

### 3.4 Peças orgânicas do 3D (bloco-base isométrico, só para geometria)
`isometric orthographic view, elevation 35 degrees, rotated 45 degrees, single object centered, one small key light from upper-left, soft fill, no cast shadow on ground, matte dark slate body, uniform 2mm beveled edges, one thin cyan edge light, solid #060b16 background, no text, no labels, no people, clean product render, same scale as reference sheet, the object fits a 1-unit cube. [NEGATIVE] no perspective, no ground plane, no gradient background, no extra objects, no letters, no reflections of environment` · Folha (nano-banana-2, 1K): `Style sheet with three objects in one row at identical scale, each inside an invisible 1-unit cube: (1) a small filing cabinet with one drawer half open, (2) a compact safe with a round handle, (3) a small security gate booth with a horizontal reader slot and a lowered barrier arm.` + bloco-base. Keyframe por peça (flux-2-max, `input_images: [folha.png]`, `seed`): `Same style, light and scale as the reference sheet. [PIECE] a small security gate booth with a horizontal reader slot and a lowered barrier arm` / `a compact safe with a round handle and a thin door seam`; vistas: `rear view / left side view / right side view, same object, same light`. Trellis: `{ "images": ["<recortado.png>"], "seed": 19770815, "randomize_seed": false, "mesh_simplify": 0.95, "texture_size": 512, "generate_color": true, "generate_normal": false, "generate_model": true }` → `gltfpack -cc -tc`; albedo descartado; material da casa.

### 3.5 Som "espera" (só se o oscilador reprovar)
`Minimal user-interface sound, dry studio recording, no reverb tail longer than 200 ms, no music, mono-compatible, quiet, precise, like a well-made instrument. One gentle glass ping, 300 ms, low volume.` · `duration 3`, `steps 8`, `cfg_scale 7`, `seed 19770815`.

---

## 4. `MANIFESTO.json`

Um por lote, em `docs/design/assets/raw/<slug>/<data>/MANIFESTO.json`:
```json
{
  "lote": "icones-portao", "data": "2026-09-23", "modelo": "recraft-ai/recraft-v4-svg", "versao": "<hash>",
  "seed": null, "prompt_base": "<bloco 3.1>", "orcamento_missao_usd": 20, "parada_usd": 16,
  "itens": [ { "nome": "reuniao", "id": "<prediction id>", "status": "succeeded", "sujeito": "...", "custo_usd": 0.08, "arquivo": "reuniao.svg", "bytes": 0, "baixado_em": "<iso>" } ],
  "custo_lote_usd": 0.24, "custo_acumulado_usd": 0.24
}
```
Regra: nada fica só na Replicate; o que não foi baixado em 1 h não existe. Nunca gravar o token, o cabeçalho de autorização ou a URL assinada no manifesto.

---

## 5. O script (`gera_svg.sh`, zsh + curl + jq; `gera.mjs` em Node fica para o app)

```zsh
#!/bin/zsh
# uso: gera_svg.sh <nome> "<sujeito>" · 1 SVG no recraft-ai/recraft-v4-svg, baixa na hora, anota no MANIFESTO.jsonl
set -e
source "$HOME/.config/babel/replicate.env"     # fora do projeto; REPLICATE_API_TOKEN=...
NOME="$1"; SUJ="$2"; OUT=docs/design/assets/raw/recraft-v4-svg/$(date +%F); mkdir -p "$OUT"
BASE="Single UI icon, vector line art. Monoline stroke of exactly 1.5 px on a 20x20 grid with a 2 px inner margin, square miter corners, butt line caps, no fill, no shadow, no gradient, no texture, no background, no text. Pure black (#000000) stroke on transparent. Geometric, sober, precise, the register of an instrument panel in a control room: every line has a function, nothing decorative. Consistent optical weight with a family of 61 icons drawn in the same hand. Subject: $SUJ"
BODY=$(jq -cn --arg p "$BASE" '{input:{prompt:$p,size:"1024x1024"}}')
RESP=$(curl -s -X POST https://api.replicate.com/v1/models/recraft-ai/recraft-v4-svg/predictions \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" -H "Content-Type: application/json" -H "Prefer: wait=60" -d "$BODY")
ID=$(echo "$RESP" | jq -r .id); STATUS=$(echo "$RESP" | jq -r .status); URL=$(echo "$RESP" | jq -r '.output // empty')
n=0; while [[ "$STATUS" != succeeded && "$STATUS" != failed && "$STATUS" != canceled && $n -lt 45 ]]; do
  sleep 2; n=$((n+1)); RESP=$(curl -s https://api.replicate.com/v1/predictions/$ID -H "Authorization: Bearer $REPLICATE_API_TOKEN")
  STATUS=$(echo "$RESP" | jq -r .status); URL=$(echo "$RESP" | jq -r '.output // empty'); done
if [[ "$STATUS" == succeeded && -n "$URL" ]]; then curl -s "$URL" -o "$OUT/$NOME.svg"
  jq -cn --arg n "$NOME" --arg id "$ID" --arg s "$SUJ" --arg f "$NOME.svg" --argjson b "$(stat -f%z "$OUT/$NOME.svg")" \
    '{nome:$n,modelo:"recraft-ai/recraft-v4-svg",id:$id,status:"succeeded",sujeito:$s,custo_usd:0.08,arquivo:$f,bytes:$b,data:(now|todate)}' >> "$OUT/MANIFESTO.jsonl"
else jq -cn --arg n "$NOME" --arg id "$ID" --arg st "$STATUS" --argjson e "$(echo "$RESP" | jq -c .error)" \
    '{nome:$n,modelo:"recraft-ai/recraft-v4-svg",id:$id,status:$st,erro:$e,data:(now|todate)}' >> "$OUT/MANIFESTO.jsonl"; fi
```
Para vídeo: mesmo esqueleto com `POST /v1/models/wan-video/wan-2.7-i2v/predictions`, sem `Prefer: wait`, cabeçalho `Cancel-After: 15m`, polling de 2 s até 15 min, entradas por data URI (`first_frame`, `last_frame`), download imediato e `ffmpeg -an`.

---

## 6. O que a Replicate confirmou (schemas, 23/09/2026)

`wan-video/wan-2.7-i2v` (`first_frame`, `last_frame`, `seed`, `duration 2–15`, 720p/1080p, `audio`) · `google/veo-3.1` (16:9/9:16; `generate_audio` dobra o preço) · `bytedance/seedance-2.0-fast` (`image`, `last_frame_image`, 480p) · `recraft-ai/recraft-v4-svg` (`prompt`, `size`, `aspect_ratio`; sem `seed`/`style`; saída = URI de um `.svg`) · `google/nano-banana-2` (`image_input` ≤ 14, 1K/2K/4K, `png`; sem `seed`; padrão `jpg`) · `black-forest-labs/flux-2-max` (`seed`, `input_images` ≤ 8) · `bria/remove-background` (`preserve_alpha`) · `stability-ai/stable-audio-2.5` (`duration` padrão 190 s) · `firtoz/trellis` (`images` array, `seed`, `randomize_seed`; US$ 0,035) · `tencent/hunyuan3d-2` (`image`; US$ 0,13) · `tencent/hunyuan3d-2mv` (`front/back/left/right_image`) · `tencent/hunyuan-3d-3.1` (`prompt` **ou** `image`; preço sem unidade) · `quiverai/arrow-1.1` (plano B para ícones com `references`, US$ 0,20). **Não existem**: `stability-ai/stable-fast-3d`, `camenduru/tripo-sr` (404).

---

## 7. Estado ao fechar a missão

- Predições criadas nesta missão: **0**. Custo: **US$ 0,00** de 20.
- Motivo: a ordem de execução (REGRA 1: keyframe antes de vídeo; conceito escolhido antes de qualquer geração) foi cumprida, o portão dos ícones ficou pronto e o comando foi negado pela permissão do Bash da sessão. Nada foi gerado sem o conceito fechado.
- Próximo passo, em ordem: (1) portão de 3 ícones (US$ 0,24) → decisão stroke/fill; (2) lote de 61 (US$ 6,34) ou desenho à mão; (3) keyframes A e N (US$ 0,40); (4) rascunho do clipe (US$ 0,28) só se o SVG da Entrada, já construído, parecer pobre a 3 pessoas; (5) folha + Trellis das duas peças orgânicas quando o modo 3D for construído. (6) **Trocar o token da Replicate** (passou pelo chat).
