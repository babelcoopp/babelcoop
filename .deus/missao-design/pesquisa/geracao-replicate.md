# Geração de elementos de app por IA na Replicate — notas completas

> Frente: geração de logo animada, ícones SVG, fundos em loop, efeitos, remoção de fundo, upscale, 3D e som de interface para o Babel Coop.
> Data: 23/09/2026. Pesquisa feita com WebFetch, WebSearch e Playwright (páginas da Replicate são renderizadas por JavaScript; o schema e o preço estão embutidos no HTML do servidor como JSON e foram extraídos de lá).
> Legenda: **[CONFIRMADO]** = lido na página do modelo/doc oficial. **[NÃO CONFIRMADO]** = não consegui ler na fonte primária. **[TERCEIRO]** = fonte externa à Replicate.

---

## 0. Como confirmei (método, para repetir depois)

1. `https://replicate.com/<owner>/<name>` responde com HTML que contém o `openapi_schema` da versão atual (`"Input": {...}`) e o `billingConfig` (faixas de preço com critérios). O WebFetch comum só devolve o README; extraí o JSON com `fetch()` dentro do Playwright. **[CONFIRMADO]**
2. `https://replicate.com/<owner>/<name>/llms.txt` existe para todos os modelos testados e devolve o schema em texto puro (sem preço). Rota barata para checar parâmetros antes de chamar. **[CONFIRMADO]**
3. `GET https://api.replicate.com/v1/models/wan-video/wan-2.7-i2v` sem token devolve `HTTP 401 {"title":"Unauthenticated"}`. Toda rota da API exige `Authorization: Bearer`. **[CONFIRMADO via curl]**
4. `quiverai/arrow` (sem sufixo) devolve **404**. O slug vivo é `quiverai/arrow-1.1` e `quiverai/arrow-1.1-max`. **[CONFIRMADO]**

---

## 1. Contrato operacional da API (docs oficiais)

| Item | Fato | Fonte |
|---|---|---|
| Criar predição em modelo oficial | `POST https://api.replicate.com/v1/models/{model_owner}/{model_name}/predictions` | https://replicate.com/docs/reference/http |
| Modelo da comunidade | `POST /v1/predictions` com `version` | https://replicate.com/docs/topics/predictions/create-a-prediction |
| Modo síncrono | Header `Prefer: wait` segura a conexão; padrão 60 s; `Prefer: wait=n` com n de 1 a 60. Se não terminar, devolve a predição incompleta com status `starting` ou `processing` | https://replicate.com/docs/topics/predictions/create-a-prediction · https://replicate.com/changelog/2024-10-09-synchronous-api |
| Prazo máximo | Header `Cancel-After`: de 5 s a 24 h; formatos `30`, `30s`, `5m`, `1h`, `2h30m`. Se vence antes de rodar → `aborted` (não cobra); se vence rodando → `canceled` (cobra o tempo rodado) | https://replicate.com/docs/topics/predictions/create-a-prediction · https://replicate.com/changelog/2025-10-16-prediction-deadlines |
| Duração máxima de uma predição | 30 minutos (mais que isso, só falando com o suporte) | https://replicate.com/docs/topics/predictions/lifecycle |
| Expiração de saída | "URLs for files will point to `replicate.delivery` and will expire after one hour." Inputs, outputs, arquivos e logs de predições via API são apagados após 1 hora por padrão; predições feitas na interface web ficam indefinidamente | https://replicate.com/docs/topics/predictions/output-files · https://replicate.com/docs/topics/predictions/data-retention |
| Webhook | Campo `webhook` (URL) + `webhook_events_filter` com `start`, `output`, `logs`, `completed`. Padrão: envia em novos outputs e ao terminar. `output`/`logs` no máximo 1 a cada 500 ms; `start`/`completed` sempre | https://replicate.com/docs/topics/webhooks/setup-webhook |
| Retry de webhook | Só o webhook terminal (`succeeded`/`failed`/`canceled`) é reenviado; várias tentativas em backoff exponencial; última ~1 min após a conclusão. Estados intermediários não são reenviados. Responder 2xx em poucos segundos; handler idempotente | https://replicate.com/docs/topics/webhooks/receive-webhook |
| Assinatura de webhook | Headers `webhook-id`, `webhook-timestamp`, `webhook-signature`; segredo em `GET /v1/webhooks/default/secret` (`whsec_...`); HMAC-SHA256 sobre `${webhook_id}.${webhook_timestamp}.${body}` | https://replicate.com/docs/topics/webhooks/verify-webhook |
| Deployments | `POST /v1/deployments` com `name`, `model`, `version`, `hardware` (ex.: `gpu-t4`), `min_instances`, `max_instances`; rodar em `POST /v1/deployments/{owner}/{name}/predictions` | https://replicate.com/docs/topics/deployments/create-a-deployment · https://replicate.com/docs/reference/http |
| Cobrança | Modelo público: só tempo ativo, "Setup and idle time for the model is free". Deployment: cobra setup + ocioso + ativo. Falha não cobra. Cancelar oficial pode cobrar o tempo rodado | https://replicate.com/docs/topics/billing |
| Limites de taxa | 600 criações de predição/min; 3000/min nas demais rotas | https://replicate.com/docs/reference/http |
| Hardware | T4 US$0,000225/s (US$0,81/h); L40S US$0,000975/s; A100 80 GB US$0,0014/s (US$5,04/h); H100 US$0,001525/s | https://replicate.com/pricing |

---

## 2. Catálogo por função — cada modelo lido na página

### 2.1 Vídeo (logo animada, fundos em loop, rascunhos)

**`wan-video/wan-2.7-i2v` [CONFIRMADO]** — https://replicate.com/wan-video/wan-2.7-i2v
- Entradas: `first_frame` (jpg/png/bmp/webp ≤ 20 MB), `last_frame` (requer `first_frame`), `first_clip` (mp4/mov 2–10 s, não combina com `first_frame`), `audio` (wav/mp3 3–30 s; **se ausente, o modelo gera áudio sozinho**), `prompt`, `negative_prompt`, `resolution` `720p|1080p` (padrão 1080p), `duration` 2–15 (padrão 5), `enable_prompt_expansion` (padrão true), `seed` 0–2147483647.
- Não tem `aspect_ratio`: segue a imagem de entrada.
- Preço: **US$0,10/s em 720p; US$0,15/s em 1080p** ("Priced by multiple properties").
- Só em 84,8 mil execuções na data; status "Warm", "Official".

**`google/veo-3.1` [CONFIRMADO]** — https://replicate.com/google/veo-3.1
- Entradas: `prompt` (obrigatório), `image`, `last_frame` ("Ending image for interpolation"), `reference_images` (1–3; só com 16:9 e 8 s; **`last_frame` é ignorado se houver referências**), `aspect_ratio` `16:9|9:16`, `duration` `4|6|8` (padrão 8), `resolution` `720p|1080p` (padrão 1080p), `generate_audio` (padrão **true**), `negative_prompt`, `seed`.
- Preço: **US$0,40/s com áudio; US$0,20/s sem áudio**. Desligar `generate_audio` corta o preço pela metade.

**`bytedance/seedance-2.0-fast` [CONFIRMADO]** — https://replicate.com/bytedance/seedance-2.0-fast
- Entradas: `prompt` (obrigatório), `image` (primeiro quadro), `last_frame_image` (requer `image`; incompatível com referências), `reference_images` (até 9, citáveis como [Image1]…), `reference_videos` (até 3, 15 s no total), `reference_audios` (até 3), `duration` −1…15 (padrão 5; −1 = duração inteligente), `resolution` `480p|720p` (padrão 720p), `aspect_ratio` `16:9, 4:3, 1:1, 3:4, 9:16, 21:9, 9:21, adaptive`, `generate_audio` (padrão true), `seed`.
- Preço: **480p US$0,07/s (sem vídeo de entrada) ou US$0,08/s (com vídeo); 720p US$0,15/s ou US$0,17/s**.
- Referência, `bytedance/seedance-2.0` (não-fast) [CONFIRMADO]: 480p 0,08/0,10; 720p 0,18/0,22; 1080p 0,45/0,55; 4k 1,00/1,25 US$/s.

**`vidu/q3-pro` [CONFIRMADO só chaves e preço]** — https://replicate.com/vidu/q3-pro
- Entradas: `start_image`, `end_image`, `prompt`, `duration`, `resolution`, `aspect_ratio`, `seed`, `audio`. Preço: 540p US$0,07/s; 720p US$0,15/s; 1080p US$0,16/s.

**`wan-video/wan-2.2-i2v-fast` [CONFIRMADO só chaves e preço]** — https://replicate.com/wan-video/wan-2.2-i2v-fast
- Entradas: `image`, `last_image`, `num_frames`, `frames_per_second`, `interpolate_output`, `resolution`, `seed`, `go_fast`, LoRA.
- Preço **por vídeo, não por segundo**: 480p US$0,05 (base) / US$0,065 (interpolado); 720p US$0,11 / US$0,145. É o rascunho mais barato do catálogo e tem `last_image`.

### 2.2 SVG nativo (ícones e logo vetorial)

**`recraft-ai/recraft-v4-svg` [CONFIRMADO]** — https://replicate.com/recraft-ai/recraft-v4-svg
- Entradas: `prompt` (até 10.000 caracteres), `aspect_ratio` (`Not set, 1:1, 4:3, 3:4, 3:2, 2:3, 16:9, 9:16, 1:2, 2:1, 14:10, 10:14, 4:5, 5:4, 6:10`), `size` (14 opções, padrão `1024x1024`; ignorado se houver `aspect_ratio`).
- **Não há parâmetro `style`, nem `seed`, nem `colors`.** O estilo vai inteiro no prompt.
- Saída: arquivo `.svg` em `replicate.delivery`. "Images generated on Replicate with Recraft V4 SVG can be used commercially."
- Preço: **US$0,08 por imagem** (roda em CPU).

**`recraft-ai/recraft-v4-pro-svg` [CONFIRMADO]** — https://replicate.com/recraft-ai/recraft-v4-pro-svg
- Mesmos parâmetros; `size` padrão `2048x2048` (até `3072x1536`). Preço **US$0,30 por imagem**.
- Blog da Replicate: "actual editable vector files", "opens directly in Illustrator, Figma, or Sketch". https://replicate.com/blog/recraft-v4

**`quiverai/arrow-1.1` [CONFIRMADO]** — https://replicate.com/quiverai/arrow-1.1
- Entradas: `prompt`, `instructions` (guia de estilo separado do prompt), `references` (até 4 imagens PNG/JPEG/WebP), `temperature` 0–2 (padrão 1), `top_p` 0–1, `presence_penalty` −2…2. **Sem `seed`.**
- Saída: "A single `.svg` file with raw SVG markup."
- Preço: **US$0,20 por imagem** ("pass-through of Quiver's 20 credits per generation at $0.01/credit").

**`quiverai/arrow-1.1-max` [CONFIRMADO]** — https://replicate.com/quiverai/arrow-1.1-max
- Até 16 `references`. Preço **US$0,25 por imagem**.

### 2.3 Imagem (keyframes da logo, texturas)

**`google/nano-banana-2` [CONFIRMADO]** — https://replicate.com/google/nano-banana-2
- Entradas: `prompt`, `image_input` (até 14), `aspect_ratio` (`match_input_image, 1:1, 1:4, 1:8, 2:3, 3:2, 3:4, 4:1, 4:3, 4:5, 5:4, 8:1, 9:16, 16:9, 21:9`), `resolution` `1K|2K|4K`, `output_format` `jpg|png` (padrão **jpg** — pedir `png`), `google_search`, `image_search`. **Sem `seed`.**
- Preço: **1K US$0,067; 2K US$0,101; 4K US$0,151** por imagem.

### 2.4 Remoção de fundo

| Modelo | Entradas | Preço / hardware | Fonte |
|---|---|---|---|
| `bria/remove-background` [CONFIRMADO] | `image` ou `image_url`, `preserve_alpha` (padrão true), `content_moderation`. RMBG 2.0, "non-binary masks allowing for 256 levels of transparency", dados licenciados | **US$0,018/imagem** (CPU) | https://replicate.com/bria/remove-background |
| `851-labs/background-remover` [CONFIRMADO] | `image` (obrig.), `threshold` 0–1 (0 = alpha suave), `reverse`, `background_type` (`rgba, map, green, white, [R,G,B], blur, overlay` ou imagem), `format` (padrão png). Usa o pacote `transparent-background` | ~US$0,00039/run (T4, ~2 s) | https://replicate.com/851-labs/background-remover |
| `men1scus/birefnet` [CONFIRMADO] | `image`, `resolution` "WxH". Saída: máscara PNG | ~US$0,0014/run (A100, ~1 s) | https://replicate.com/men1scus/birefnet |
| `arielreplicate/robust_video_matting` [CONFIRMADO] | `input_video`, `output_type` `green-screen|alpha-mask|foreground-mask` | ~US$0,045/run (L40S) | https://replicate.com/arielreplicate/robust_video_matting |
| `lucataco/rembg-video` [CONFIRMADO só chaves e preço] | `video`, `mode`, `background_color` | ~US$0,12/run | https://replicate.com/lucataco/rembg-video |

### 2.5 Upscale

**`topazlabs/image-upscale` [CONFIRMADO]** — https://replicate.com/topazlabs/image-upscale
- Entradas: `image`, `enhance_model` (`Standard V2, Low Resolution V2, CGI, High Fidelity V2, Text Refine`), `upscale_factor` (`None, 2x, 4x, 6x`), `output_format` `jpg|png`, `subject_detection` (`None, All, Foreground, Background`), `face_enhancement`, `face_enhancement_strength` (0,8), `face_enhancement_creativity` (0).
- Preço: por unidade ligada aos megapixels de saída. Tabela do README: 12 MP = 1 unidade = US$0,05; 36 MP = US$0,10; 96 MP = US$0,20; 512 MP = US$0,82. **Inconsistência na própria página:** o bloco de cobrança diz "$0.08 per unit (or around 12 units for $1)". Anotar as duas e conferir no extrato após o primeiro uso.

**`nightmareai/real-esrgan` [CONFIRMADO]** — https://replicate.com/nightmareai/real-esrgan
- Entradas: `image`, `scale` 0–10 (padrão 4), `face_enhance` (GFPGAN). "Max recommended input image resolution is 1440p."
- Preço: **US$2 por mil imagens (US$0,002/imagem)**.

### 2.6 3D (o "b" volumétrico)

**`firtoz/trellis` [CONFIRMADO]** — https://replicate.com/firtoz/trellis
- Entradas: `images[]`, `seed` (padrão 0), `randomize_seed`, `generate_color`, `generate_normal`, `generate_model` (GLB), `save_gaussian_ply`, `return_no_background`, `ss_guidance_strength` 0–10 (7,5), `ss_sampling_steps`, `slat_guidance_strength` 0–10 (3), `slat_sampling_steps`, `mesh_simplify` 0,9–0,98 (0,95), `texture_size` 512–2048 (1024).
- Saída: `model_file` (GLB com textura), `color_video`, `normal_video`, `gaussian_ply`, `combined_video`, `no_background_images`.
- Preço: ~US$0,035/run (A100, ~25 s).

**`tencent/hunyuan-3d-3.1` [CONFIRMADO schema; unidade de preço NÃO CONFIRMADA]** — https://replicate.com/tencent/hunyuan-3d-3.1
- Entradas: `prompt` **ou** `image` (não ambos; imagem 128–5000 px por lado, ≤ 6 MB), `enable_pbr` (padrão false), `face_count` 40.000–1.500.000 (padrão 500.000), `generate_type` `Normal|Geometry`. Saída: GLB.
- Preço: "US$0,50 per unit (or 20 units for $10)". A página não define o que é a "unidade"; presumo 1 geração, mas não está escrito.

**`camenduru/tripo-sr` [NÃO CONFIRMADO]** — só apareceu como página de versão (`/versions/e0d3fe8a…`) na busca; o `llms.txt` devolveu 404. Não encontrei slug oficial do Tripo (tripo3d) na Replicate. Alternativas confirmadas: Trellis e Hunyuan 3D 3.1.

**Exibição na web [TERCEIRO]** — `<model-viewer>` (Google): `src` GLB, `camera-controls`, `auto-rotate`, `poster` para carregar tarde; "uses Intersection Observer to conserve battery power and GPU cycles when a model isn't visible". https://web.dev/articles/model-viewer · Alvo prático: abaixo de 100 mil polígonos e carga < 3 s em celular médio. https://www.vntana.com/blog/how-to-embed-a-3d-model-viewer-in-a-website-2026-guide/

### 2.7 Som de interface

**`stability-ai/stable-audio-2.5` [CONFIRMADO]** — https://replicate.com/stability-ai/stable-audio-2.5
- Entradas: `prompt`, `duration` 1–190 s (**padrão 190** — definir sempre, senão gera 3 min), `steps` 4–8 (padrão 8), `cfg_scale` 1–25 (padrão 1), `seed`.
- **Na Replicate não há entrada de áudio** (audio-to-audio/continuação não está exposta; só texto).
- Preço: **US$0,20 por arquivo de áudio, independente da duração** (CPU).

**`andreasjansson/musicgen-looper` [CONFIRMADO]** — https://replicate.com/andreasjansson/musicgen-looper
- Entradas: `prompt`, `bpm` 40–300 (padrão 140), `variations` 1–20 (padrão 4), `max_duration` 2–20 s (padrão 8), `model_version` `medium|large`, `output_format` `wav|mp3`, `seed` (−1 = aleatório), `temperature`, `top_k`, `top_p`, `classifier_free_guidance`.
- Saída: `variation_01`…`variation_20`. Preço: ~US$0,78/run (A100, "typically complete within 10 minutes"). Limitações do README: "BeatNet often struggles to pick the right downbeat"; sem vocais.

---

## 3. Logo animada: caminhos e formatos de saída

### 3.1 Três rotas, da mais barata à mais cara

**Rota A — SVG + CSS/GSAP (sem vídeo).** O "b" vira `<svg>` (Recraft SVG ou desenhado à mão a partir do SVG gerado); glow por `filter: drop-shadow`/`feGaussianBlur`; traço "sendo desenhado" por `stroke-dasharray` + `stroke-dashoffset` com `getTotalLength()`; `animation-fill-mode: forwards`. 0 KB de runtime, `currentColor`, `prefers-reduced-motion` trivial. Fontes: https://css-tricks.com/svg-line-animation-works/ · https://www.carmenansio.com/articles/animated-icon-libraries/ ("SVG + CSS: 0kb bundle").

**Rota B — vídeo gerado (imagem → vídeo → arquivo).**
1. Keyframe do "b" em `google/nano-banana-2` (`output_format: png`, `resolution: 1K`, fundo **preto puro ou #060b16**).
2. Rascunho em `bytedance/seedance-2.0-fast` (480p, `generate_audio: false`, `image` = `last_frame_image` = keyframe, `seed` fixa, `duration: 5`). Custo ≈ US$0,35.
3. Final em `wan-video/wan-2.7-i2v` (`first_frame` = `last_frame`, 1080p, `seed` fixa; **sem `audio` ele gera áudio sozinho — descartar na saída com ffmpeg `-an`**). Custo ≈ US$0,75 por 5 s. Ou `google/veo-3.1` com `image` + `last_frame`, `generate_audio: false`, 8 s ≈ US$1,60.
4. **Saída sem alpha, por blend:** como o app é escuro (`--e-fundo: #060b16`), a logo neon gerada sobre preto é composta com `mix-blend-mode: screen` — "A black layer leads to no change" (MDN). Um MP4/WebM comum serve, sem canal alpha. https://developer.mozilla.org/en-US/docs/Web/CSS/blend-mode
5. **Se precisar de alpha de verdade** (sobre painel claro ou vidro): dois arquivos, HEVC com alpha (`hvc1`, `.mov`/`.mp4`) **primeiro** no `<video>` para o Safari, e VP9 em WebM (`libvpx-vp9`, `yuva420p`) para Chrome/Firefox. "Safari supports HEVC with alpha, and Chrome does not. Chrome supports VP9 with alpha, and Safari does not." https://rotato.app/blog/transparent-videos-for-the-web · Alternativa de um arquivo só: vídeo "empilhado" (cor em cima, alpha em cinza embaixo) composto por shader WebGL, componente `<stacked-alpha-video>`; no exemplo do artigo, AV1 empilhado 460 kB contra 3,4 MB do HEVC nativo. https://jakearchibald.com/2024/video-with-transparency/
6. Alpha a partir do vídeo gerado: `arielreplicate/robust_video_matting` com `output_type: alpha-mask` (ou `green-screen`), ~US$0,045.

**Rota C — Rive (interativo, estados).** O SVG importa no editor do Rive e "becomes editable shapes, paths, fills, strokes, and groups"; **`filter` não é suportado, `stroke-dasharray` vira traço sólido, imagens embutidas são ignoradas, skew não é suportado**. O glow tem que ser refeito dentro do Rive. Runtime web ~28 KB JS + ~250 KB WASM (unicornicons) — outra fonte fala em ~50 KB gz (carmenansio); os números divergem. https://rive.app/docs/editor/assets/svg · https://unicornicons.com/blog/lottie-vs-rive-performance

### 3.2 Lottie: o que é possível e o que não é
- Conversores "vídeo → Lottie" **não vetorizam**: "EasyLottie wraps raster frames inside a Lottie JSON" e "the Lottie ZIP is larger than a normal Lottie [because] it contains image frames instead of vector paths". https://www.easylottie.com/video-to-lottie (a ferramenta da LottieFiles devolveu 403 para mim; não a li).
- Lottie vetorial de verdade só nasce de vetor animado em ferramenta. O app do Recraft exporta "SVG, PNG, JPG, PDF, TIFF, and Lottie" — mas isso é no app, **não na Replicate**. https://www.recraft.ai/docs/recraft-models/recraft-V4 · https://www.recraft.ai/blog/generate-lottie-files-with-ai-for-free
- Runtime: lottie-web ~52–60 KB gz (fontes divergem: 52 KB unicornicons; 60–100 KB carmenansio), roda um `requestAnimationFrame` por instância mesmo parado; dotLottie ~40 KB gz.

### 3.3 Quando cada tecnologia (regra de bolso das fontes)
- CSS/SVG: microinterações, ícones, transições — "faster to ship and easier to maintain than any runtime". Bundle 0.
- Lottie: animação decorativa de 1–3 instâncias vinda de After Effects.
- Rive: interativo (hover, arrastar, scroll), 5+ ícones animados na mesma tela, estado.
- Vídeo: só textura fotográfica/partículas volumétricas que vetor não faz; nunca para o que pode ser vetor.
Fontes: https://unicornicons.com/blog/lottie-vs-rive-performance · https://www.carmenansio.com/articles/animated-icon-libraries/

---

## 4. Fundos e texturas em loop

- Modelos com primeiro-e-último quadro na Replicate: `wan-2.7-i2v` (`first_frame`/`last_frame`), `veo-3.1` (`image`/`last_frame`), `seedance-2.0-fast` (`image`/`last_frame_image`), `vidu/q3-pro` (`start_image`/`end_image`), `wan-2.2-i2v-fast` (`image`/`last_image`). Nenhuma página fala em "loop"; o loop é técnica nossa (Z = A).
- **Armadilha documentada [TERCEIRO]:** "most models respond to identical start and end frames by generating little or no motion at all". Método alternativo: gerar o clipe 1 livre; extrair o último quadro (`ffmpeg -sseof -3 … -update 1`) e o primeiro; gerar o clipe 2 com `first = último de 1` e `last = primeiro de 1`; cortar 1 quadro de cada e concatenar (concat demuxer, `-c copy`). https://ffmpeg.party/guides/ai-video-loop/
- Para fundo do Babel Coop (escuro, calmo, "interface calma" da peneira): 720p basta (é fundo desfocado); `wan-2.7-i2v` 720p 5 s = US$0,50; ou `wan-2.2-i2v-fast` 720p = US$0,11 por vídeo para testar movimento.
- Exportar como MP4 H.264 + WebM VP9 sem alpha, `muted playsinline loop`, `poster` = keyframe; `prefers-reduced-motion` → só o `poster`.

---

## 5. Ícones SVG — receita para o traço bater

1. `recraft-ai/recraft-v4-svg` não tem `style` nem `seed`: o estilo inteiro (peso do traço, cantos, grade 24 px, monocromático, sem preenchimento) vai no prompt, **idêntico** em toda a família; `aspect_ratio: 1:1`. US$0,08 × N.
2. `quiverai/arrow-1.1` aceita `references` (até 4): passar o primeiro ícone aprovado como referência dos seguintes e `instructions` com a regra de estilo; `temperature` baixa para determinismo (não há seed). US$0,20 × N.
3. Pós-processo local: normalizar `viewBox`, trocar cores por `currentColor`, remover metadados; animar `stroke-dashoffset` na entrada em viewport.
4. Nunca PNG → vetorizar (regra do Theus; confirmada pela natureza dos modelos: os dois devolvem `.svg` nativo).

---

## 6. Som de interface

- `stability-ai/stable-audio-2.5`: US$0,20 por arquivo, qualquer duração → gerar clipes de 2–4 s por prompt ("short UI click, soft synthetic, no reverb tail") com `seed` fixa e cortar localmente para ≤ 400 ms. `steps: 8`. Sempre definir `duration` (padrão é 190 s).
- `andreasjansson/musicgen-looper`: leito em BPM fixo, 4 variações por run (~US$0,78), `max_duration` até 20 s.
- Regra do Theus mantida: som só após gesto; `AudioContext.resume()`; `visibilitychange` pausa.

---

## 7. Orçamento estimado para o Babel Coop (preços lidos hoje)

| Item | Cálculo | US$ |
|---|---|---|
| Keyframes do "b" e texturas | 20 × nano-banana-2 1K (0,067) | 1,34 |
| Rascunhos da logo | 4 × seedance-2.0-fast 480p 5 s sem áudio (0,35) | 1,40 |
| Logo final | 2 × wan-2.7-i2v 1080p 5 s (0,75) | 1,50 |
| Fundo em loop | 2 × wan-2.7-i2v 720p 5 s (0,50) | 1,00 |
| Ícones | 40 × recraft-v4-svg (0,08) | 3,20 |
| Ícones (alternativa Arrow) | 40 × arrow-1.1 (0,20) | 8,00 |
| Remoção de fundo | 30 × bria (0,018) | 0,54 |
| 3D do "b" | 3 × trellis (0,035) + 2 × hunyuan (0,50) | 1,11 |
| Som | 8 × stable-audio-2.5 (0,20) + 1 × musicgen-looper (0,78) | 2,38 |
| **Total** | | **≈ 12–17** |

Bem abaixo do teto de US$20–60 do PROMPT_AGENTICO_LP.md.

---

## 8. Armadilhas

1. `replicate.delivery` expira em 1 h e os dados da predição somem: baixar no webhook `completed` e gravar em `/assets/raw/<slug>/<seed>/`.
2. `wan-2.7-i2v` gera áudio sozinho se `audio` não for enviado; `veo-3.1` e `seedance-2.0-fast` têm `generate_audio: true` por padrão. Fundo mudo = desligar e/ou `ffmpeg -an`; no Veo isso é metade do preço.
3. `stable-audio-2.5` com `duration` padrão 190 s: um esquecimento vira 3 min de áudio (mesmo preço, mas tempo perdido e arquivo grande).
4. Recraft SVG e Arrow **não têm seed**; nano-banana-2 também não. Determinismo na família de ícones vem do prompt idêntico (Recraft) ou de `references` + `temperature` baixa (Arrow).
5. `veo-3.1`: `reference_images` só com 16:9 e 8 s, e anulam `last_frame`. Não misturar referência com loop.
6. `seedance-2.0-fast`: `last_frame_image` é incompatível com `reference_images`.
7. Primeiro = último quadro pode gerar vídeo quase parado; usar o método em duas metades (seção 4).
8. `quiverai/arrow` não existe (404); `camenduru/tripo-sr` sem página estável; Tripo oficial não encontrado na Replicate.
9. Topaz: a página tem dois preços por unidade (US$0,05 na tabela, US$0,08 no bloco de cobrança). Conferir o extrato.
10. Hunyuan 3D 3.1: "US$0,50 por unidade" sem definição de unidade.
11. Rive descarta `filter` e `stroke-dasharray` do SVG: o neon do "b" não sobrevive à importação; refazer no editor.
12. Vídeo com alpha: Safari só HEVC alpha, Chrome/Firefox só VP9 alpha; ordem das `<source>` importa (HEVC primeiro). Evitar alpha usando `mix-blend-mode: screen` sobre o fundo escuro.
13. Deployment com `min_instances: 1` cobra ocioso; para lotes pequenos (dezenas de chamadas) o modelo público basta — setup e ocioso são grátis.
14. `Prefer: wait` só para SVG/imagem; vídeo sempre assíncrono com webhook e `Cancel-After: 15m`.
15. Webhook retenta só o evento terminal e por ~1 min; se o endpoint estiver fora nesse minuto, a saída se perde em 1 h. Ter polling de reserva.

---

## 9. O que ninguém fez ainda (ideias que caem naturalmente do que foi lido)

1. **Logo neon sem alpha:** gerar o "b" sobre preto e compor com `mix-blend-mode: screen` no `#060b16` — economiza HEVC/VP9 duplo e o shader empilhado.
2. **"b" volumétrico real:** Trellis (US$0,035) → GLB → `<model-viewer>` com `poster` e `auto-rotate` só na tela de espera/TV espelho; `prefers-reduced-motion` mostra o poster.
3. **Ícones que se desenham:** família em SVG nativo com `stroke-dashoffset` na entrada — cada ícone é o rótulo de uma função (peneira: "um lugar por coisa").
4. **Som de UI com seed:** biblioteca de 6–8 cliques/avisos gerados com a mesma seed e prompt-base, cortados a ≤ 400 ms, um por evento do agente (pensando/esperando/pedido).
5. **Fundo vivo em duas metades:** loop de 10 s sem seam pelo método clipe 1 + clipe 2, em 720p, para a TV espelho.
6. **Rascunho por vídeo inteiro:** `wan-2.2-i2v-fast` cobra por vídeo (US$0,05–0,145), não por segundo — ideal para aprovar movimento antes do Wan 2.7.

---

## 10. Fontes lidas (URLs efetivamente abertas)

Replicate — modelos
- https://replicate.com/wan-video/wan-2.7-i2v (+ /llms.txt)
- https://replicate.com/google/veo-3.1 (+ /llms.txt)
- https://replicate.com/bytedance/seedance-2.0-fast (+ /llms.txt)
- https://replicate.com/bytedance/seedance-2.0
- https://replicate.com/vidu/q3-pro
- https://replicate.com/wan-video/wan-2.2-i2v-fast
- https://replicate.com/recraft-ai/recraft-v4-svg (+ /llms.txt)
- https://replicate.com/recraft-ai/recraft-v4-pro-svg (+ /llms.txt)
- https://replicate.com/quiverai/arrow (404)
- https://replicate.com/quiverai/arrow-1.1 (+ /llms.txt)
- https://replicate.com/quiverai/arrow-1.1-max (+ /llms.txt)
- https://replicate.com/google/nano-banana-2 (+ /llms.txt)
- https://replicate.com/bria/remove-background (+ /llms.txt)
- https://replicate.com/851-labs/background-remover (+ /llms.txt)
- https://replicate.com/men1scus/birefnet (+ /llms.txt)
- https://replicate.com/arielreplicate/robust_video_matting (+ /llms.txt)
- https://replicate.com/lucataco/rembg-video
- https://replicate.com/topazlabs/image-upscale (+ /llms.txt)
- https://replicate.com/nightmareai/real-esrgan (+ /llms.txt)
- https://replicate.com/firtoz/trellis (+ /llms.txt)
- https://replicate.com/tencent/hunyuan-3d-3.1 (+ /llms.txt)
- https://replicate.com/camenduru/tripo-sr/llms.txt (404)
- https://replicate.com/stability-ai/stable-audio-2.5 (+ /llms.txt)
- https://replicate.com/andreasjansson/musicgen-looper (+ /llms.txt)
- https://replicate.com/blog/recraft-v4
- https://replicate.com/pricing

Replicate — docs
- https://replicate.com/docs/reference/http
- https://replicate.com/docs/topics/predictions/create-a-prediction
- https://replicate.com/docs/topics/predictions/lifecycle
- https://replicate.com/docs/topics/predictions/output-files
- https://replicate.com/docs/topics/predictions/data-retention
- https://replicate.com/docs/topics/webhooks
- https://replicate.com/docs/topics/webhooks/setup-webhook
- https://replicate.com/docs/topics/webhooks/receive-webhook
- https://replicate.com/docs/topics/webhooks/verify-webhook
- https://replicate.com/docs/topics/deployments
- https://replicate.com/docs/topics/deployments/create-a-deployment
- https://replicate.com/docs/topics/billing
- https://replicate.com/changelog/2025-10-16-prediction-deadlines
- https://replicate.com/changelog/2024-10-09-synchronous-api

Formatos, alpha, Lottie, Rive, 3D, CSS
- https://jakearchibald.com/2024/video-with-transparency/
- https://rotato.app/blog/transparent-videos-for-the-web
- https://www.easylottie.com/video-to-lottie
- https://www.recraft.ai/docs/recraft-models/recraft-V4
- https://www.recraft.ai/blog/generate-lottie-files-with-ai-for-free
- https://rive.app/docs/editor/fundamentals/importing-assets
- https://rive.app/docs/editor/assets/svg
- https://unicornicons.com/blog/lottie-vs-rive-performance
- https://www.carmenansio.com/articles/animated-icon-libraries/
- https://web.dev/articles/model-viewer
- https://www.vntana.com/blog/how-to-embed-a-3d-model-viewer-in-a-website-2026-guide/ (via busca)
- https://developer.mozilla.org/en-US/docs/Web/CSS/blend-mode
- https://developer.mozilla.org/en-US/docs/Web/CSS/mix-blend-mode
- https://css-tricks.com/svg-line-animation-works/
- https://ffmpeg.party/guides/ai-video-loop/

Não consegui ler (bloqueio): https://lottiefiles.com/tools/video-to-lottie (403); https://medium.com/@vacmultimedia/advanced-ui-animation-strategies-… (403); https://replicate.com/docs/topics/webhooks/setup (404, a rota certa é /setup-webhook).
