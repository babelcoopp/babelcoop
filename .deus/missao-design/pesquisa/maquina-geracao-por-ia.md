# Gerar as peças da Máquina e do 3D por IA — notas completas

> Frente: **maquina-geracao-por-ia**. Como produzir as 12 peças da Máquina (Gaveta, Campo, Fio, Chave, Empresa, Portaria, Porta, Robô, Depósito, Cofre, Tela, Cano), o "b" volumétrico, os fios e o pulso, com IA onde compensa e à mão onde é melhor; qual o formato final de cada peça, o peso, e como manter as 12 coerentes (mesma luz, mesmo material, mesma lente).
> Data: 23/09/2026. Método: WebFetch nas páginas dos modelos da Replicate (página + `/llms.txt`, que devolve o schema em texto puro), no código-fonte do three.js no GitHub (comentários JSDoc), na MDN, na Wikipedia e na API pública do Bundlephobia (tamanhos reais de pacotes npm). A cota de WebSearch da sessão estava esgotada; tudo aqui veio de URLs lidas diretamente.
> Legenda: **[CONFIRMADO]** = lido na fonte primária nesta rodada. **[CONFIRMADO NA RODADA ANTERIOR]** = lido em `geracao-replicate.md` (23/09, via Playwright). **[NÃO CONFIRMADO]** = não consegui ler na fonte. **[ALVO]** = número que eu proponho, não um fato de fonte.
> Contexto lido antes: `docs/MAQUINA.md`, `prototipo/maquina.js`, `prototipo/visual3d.js`, `IDEIAS.md` 5.17–5.19, `stack-video-scroll/PROMPT_AGENTICO_LP.md`.

---

## 0. Resposta curta (a rota)

1. **A coerência das 12 peças vem por construção, não por prompt.** Uma peça só é "igual às outras" se as 12 passam pela **mesma câmera, mesma luz e mesmo material**. Isso é trivial num motor 3D (three.js: uma câmera, um material compartilhado) e quase impossível de garantir em 12 imagens geradas separadamente (nano-banana-2 não tem `seed`; Recraft SVG não tem `seed` nem `style`). Então: **as peças nascem como geometria (glTF ou primitivas), e a IA entra onde a geometria é orgânica demais para modelar à mão** (engrenagem do Robô, Cofre, Portaria), sempre seguida de `gltfpack` e de **troca do material pelo nosso**.
2. **Uma só fonte para os dois modos.** A mesma peça glTF serve o modo 3D (`visual3d.js`, câmera em perspectiva) e a Máquina 2D (`maquina.js`): renderizada com `OrthographicCamera` nos ângulos isométricos (35,264° de elevação, 45° de giro) ela vira "peça que parece 3D", ou é pré-renderizada uma vez em PNG/WebP com alpha para a tela HTML. Assim o 2D e o 3D nunca divergem.
3. **A cor da pessoa nunca é gerada.** Ela entra no motor (emissive/borda em three.js; `--pessoa` em CSS, como o protótipo já faz). O corpo da peça é neutro (ardósia escura fosca); a cor de quem criou fica na aresta luminosa. Se a cor fosse pintada na geração, cada peça exigiria N gerações (uma por pessoa) e o "Ver por pessoa" quebraria.
4. **O "b" volumétrico é feito à mão**: SVG da logo → `SVGLoader` → `toShapes()` → `ExtrudeGeometry` com chanfro. Determinístico, 0 KB além do SVG, exatamente a logo. IA (Hunyuan 3D 3.1 com PBR ou Trellis) só se um dia quiser uma versão "herói" esculpida.
5. **Fios e pulso são código, não mídia.** 2D: `<path>` + `stroke-dashoffset` (traço sendo desenhado) e `<animateMotion><mpath>` ou CSS `offset-path` (pulso). 3D: `Line2/LineMaterial` com `dashed` e `dashOffset` animado, ou o tubo + esfera + `PointLight` que já existe em `visual3d.js`.
6. **O que a IA faz melhor aqui**: (a) a **folha de estilo** (keyframes isométricos que decidem o look, com referências e seed), (b) **geometria orgânica** por imagem→3D (Trellis, US$0,035/execução, com `seed`), (c) o **matcap** (uma esfera iluminada que vira a luz de todas as peças), (d) **ícones SVG** dos rótulos (Recraft V4 SVG, uma leva só). Custo total previsto para o kit: **≈ US$4–6**, dentro dos US$20 da missão.

---

## 1. Por que "coerência por construção" (o argumento técnico)

- `google/nano-banana-2`: **não há campo `seed`** no schema; aceita até **14 imagens de referência** (`image_input`). [CONFIRMADO] https://replicate.com/google/nano-banana-2/llms.txt
- `black-forest-labs/flux-2-max`: **tem `seed`** ("Random seed. Set for reproducible generation") e até **8 imagens** em `input_images` ("Maximum 8 images"). [CONFIRMADO] https://replicate.com/black-forest-labs/flux-2-max/llms.txt
- `recraft-ai/recraft-v4-svg` e `recraft-v4-pro-svg`: **sem `style`, sem `seed`**; o estilo vai no prompt. [CONFIRMADO NA RODADA ANTERIOR] https://replicate.com/recraft-ai/recraft-v4-svg
- `recraft-ai/recraft-v3-svg`: tem `style`, mas as opções vistas são `any, engraving, line_art, line_circuit, linocut`; **nenhuma isométrica**; sem `seed`. [CONFIRMADO] https://replicate.com/recraft-ai/recraft-v3-svg/llms.txt
- Recraft, na API própria: estilos customizados "built from your own reference images — one is enough, no training required — and applied via `style_id`", com "from one to ten images" — mas a página do V4 diz que "Style creation" está entre as "features not yet supported in Recraft V4", e nada disso existe nos modelos da Replicate. Nas listas de estilos V3 e V3 Vector **não aparece "isometric", "3D" nem "lego"**. [CONFIRMADO] https://www.recraft.ai/docs/api-reference/styles · https://www.recraft.ai/docs/recraft-models/recraft-V4
- three.js `MeshMatcapMaterial`: "defined by a MatCap (or Lit Sphere) texture, which encodes the material color and shading" e "**does not respond to lights since the matcap image file encodes baked lighting**". Ou seja: uma única imagem de esfera dá a mesma luz e o mesmo material a todas as peças, independente da cena. [CONFIRMADO] https://raw.githubusercontent.com/mrdoob/three.js/dev/src/materials/MeshMatcapMaterial.js
- three.js `OrthographicCamera`: "an object's size in the rendered image stays constant regardless of its distance from the camera. This can be useful for rendering 2D scenes and UI elements". Construtor `left, right, top, bottom, near (0.1), far (2000)`, mais `zoom`. É a lente isométrica. [CONFIRMADO] https://raw.githubusercontent.com/mrdoob/three.js/dev/src/cameras/OrthographicCamera.js
- Ângulos isométricos: "the angle between any two of them is 120 degrees"; a rotação de elevação é "approximately 35.264° (precisely arcsin 1⁄√3 or arctan 1⁄√2)" após "rotated ±45° about the vertical axis". [CONFIRMADO] https://en.wikipedia.org/wiki/Isometric_projection
- Pixel-art usa o "2:1": "a 2:1 pixel pattern ratio would be used to draw the x and y axis lines, resulting in these axes following a ≈26.565° (arctan(1/2)) angle to the horizontal", porque as linhas a 30° "would not follow a neat pixel pattern". [CONFIRMADO] https://en.wikipedia.org/wiki/Isometric_video_game_graphics

**Conclusão**: se o look for gerado imagem a imagem, o máximo de determinismo possível é flux-2-max (seed + 8 refs) ou nano-banana-2 (14 refs, sem seed). Bom para **decidir** o estilo (folha de estilo), ruim para **produzir** 12 peças que precisam bater no pixel. Geometria + câmera ortográfica + matcap resolve isso de graça.

---

## 2. Catálogo Replicate — 3D (imagem→3D e texto→3D)

### 2.1 `firtoz/trellis` — [CONFIRMADO] o cavalo de batalha
- https://replicate.com/firtoz/trellis · https://replicate.com/firtoz/trellis/llms.txt
- Entrada: **`images` (array, obrigatório)** — "List of input images to generate 3D asset from"; `seed`, `randomize_seed`, `generate_color`, `generate_normal`, `generate_model`, `save_gaussian_ply`, `return_no_background`, `ss_guidance_strength` (7,5), `ss_sampling_steps` (12), `slat_guidance_strength` (3), `slat_sampling_steps` (12), `mesh_simplify` (0,95), `texture_size` (1024). Defaults conforme a página do modelo.
- Saída: `model_file` (GLB com textura), `color_video`, `normal_video`, `combined_video`, `gaussian_ply`, `no_background_images[]`.
- Preço: "approximately $0.035 to run on Replicate, or 28 runs per $1", A100 80 GB, "typically complete within 25 seconds". 901,6 mil execuções (coleção 3D).
- Repositório oficial: "TRELLIS models and the majority of the code are licensed under the MIT License"; multi-imagem é "tuning-free" e "may not give the best results for all input images"; `to_glb` com `simplify=0.95` e `texture_size=1024`. [CONFIRMADO] https://raw.githubusercontent.com/microsoft/TRELLIS/main/README.md
- **Uso na Máquina**: gerar a geometria das peças orgânicas (Robô, Cofre, Portaria, Depósito) a partir do keyframe isométrico aprovado, com `randomize_seed: false`, `seed` fixo e anotado, `mesh_simplify: 0.95`, `texture_size: 512` (peça pequena). Depois **descartar o material** (albedo do Trellis carrega sombra "assada") e aplicar o matcap/material nosso.

### 2.2 `fishwowater/trellis2` — [CONFIRMADO] TRELLIS.2, com PBR
- https://replicate.com/fishwowater/trellis2 · /llms.txt
- Entrada: `image` (obrigatório), `seed`, `randomize_seed`, `preprocess_image`, `return_no_background`, `generate_video`, `generate_model`, `pipeline_type`, os grupos `sparse_structure_*`, `shape_slat_*`, `tex_slat_*` (steps, guidance_strength, guidance_rescale, rescale_t), `decimation_target`, `texture_size`.
- Saída: `video` (mp4), `model_file` (GLB), `no_background_image`.
- Preço: "approximately $0.73 to run on Replicate, or 1 runs per $1", A100 80 GB, "typically complete within 9 minutes". "complex topologies, sharp features, and full PBR materials". Licença: "Usage of this service should also follow the license of DINOv3 and BRIA-AI (REMBG-2.0)". 2,7 mil execuções.
- **Uso**: só se uma peça exigir PBR de verdade (não é o caso: o material é nosso). 20× o preço e 20× o tempo do Trellis 1.

### 2.3 `tencent/hunyuan3d-2` — [CONFIRMADO]
- https://replicate.com/tencent/hunyuan3d-2 · /llms.txt
- Entrada: `image`, `steps`, `guidance_scale`, `seed`, `octree_resolution`, `remove_background` (sem defaults publicados no schema).
- Saída: `mesh` (URI; "The output mesh is a trimesh object, which you could save to glb/obj").
- Preço: "$0.13 to run on Replicate, or 7 runs per $1", L40S, "typically complete within 132 seconds". Criado em 21/01/2025.
- Repositório: "It takes 6 GB VRAM for shape generation and 16 GB for shape and texture generation in total"; variantes mini (0,6B), padrão (1,1–3,0B) e Turbo. [CONFIRMADO] https://raw.githubusercontent.com/Tencent-Hunyuan/Hunyuan3D-2/main/README.md · Termos de licença comercial: **NÃO CONFIRMADOS** nesta leitura.

### 2.4 `tencent/hunyuan3d-2mv` — [CONFIRMADO] multi-vista controlada
- https://replicate.com/tencent/hunyuan3d-2mv/llms.txt
- Entrada: `front_image` (obrigatório), `back_image`, `left_image`, `right_image`, `steps`, `guidance_scale`, `seed`, `octree_resolution`, `remove_background`, `num_chunks`, `randomize_seed`, `target_face_num`, `file_type`. Saída: URI (GLB nos exemplos). 24,8 mil execuções.
- **Uso**: quando uma peça precisa ficar certa de todos os lados (o Cofre visto por trás no modo 3D): gerar frente/lado/trás com nano-banana-2 a partir do mesmo keyframe e alimentar aqui.

### 2.5 `prunaai/hunyuan3d-2` — [CONFIRMADO]
- https://replicate.com/prunaai/hunyuan3d-2 · "approximately $0.22 to run on Replicate, or 4 runs per $1", A100 80 GB, "typically complete within 3 minutes". Sem README. Mais caro e mais lento que o `tencent/hunyuan3d-2` na data. Não usar.

### 2.6 `tencent/hunyuan-3d-3.1` — [CONFIRMADO schema; preço NÃO CONFIRMADO nesta rodada]
- https://replicate.com/tencent/hunyuan-3d-3.1 · /llms.txt
- Entrada: `prompt` (até 1024 caracteres) **ou** `image` ("Either prompt OR image must be provided, but not both"; jpg/png/webp, 128–5000 px por lado, ≤ 6 MB, "simple background, no text, single object, object occupies >50% of frame"), `enable_pbr`, `face_count`, `generate_type` (`Normal` = com textura, `Geometry` = "white model without textures"). Saída: GLB. 134,3 mil execuções (coleção 3D).
- Preço: a página em markdown não trouxe o bloco de custo. Na rodada anterior (Playwright) lia-se "US$0,50 per unit (or 20 units for $10)", sem definição de "unit". Mantém-se: **unidade não definida**.
- **Uso**: é o único **texto→3D** confirmado. Serve para uma versão "herói" do "b" (`prompt`, `enable_pbr: true`, `generate_type: Normal`) se a extrusão à mão não bastar. Para as peças, não.

### 2.7 `hyper3d/rodin` — [CONFIRMADO schema; preço NÃO CONFIRMADO]
- https://replicate.com/hyper3d/rodin/llms.txt · Entrada: `prompt` (obrigatório), `images` (até 5), `seed`, `tier`, `use_original_alpha`, `geometry_file_format`, `material`, `quality`, `quality_override`, `tapose`, `bbox_condition` ("[Width, Height, Length]"), `mesh_mode`, `addons`, `preview_render`. Saída: URI. Sem README; preço não exposto na leitura. 13,2 mil execuções.
- `bbox_condition` é interessante: dá para forçar as 12 peças na **mesma caixa** (mesma escala). Fica como opção B se o Trellis falhar na escala.

### 2.8 `stability-ai/stable-fast-3d` — [NÃO CONFIRMADO: não existe na Replicate hoje]
- https://replicate.com/stability-ai/stable-fast-3d → **HTTP 404**; `/llms.txt` → 404; a página do dono https://replicate.com/stability-ai lista `stable-audio-2.5`, `stable-diffusion-3.5-*`, `sdxl`, `stablelm-*`, `stable-diffusion-*` e **nenhum modelo 3D**. Não usar esse slug.

### 2.9 `camenduru/tripo-sr` e Tripo — [NÃO CONFIRMADO]
- https://replicate.com/camenduru/tripo-sr → **404**; `/llms.txt` → 404. Não há Tripo na coleção 3D da Replicate (https://replicate.com/collections/3d-models lista: hunyuan-3d-3.1, trellis2, rodin, trellis, prunaai/hunyuan3d-2, hunyuan3d-2mv, adirik/text2tex, adirik/wonder3d, lucataco/deep3d, adirik/imagedream, adirik/texture, adirik/mvdream, jd7h/zero123plusplus, cjwbw/shap-e). [CONFIRMADO a lista]
- A documentação da API própria do Tripo (https://platform.tripo3d.ai/docs, /docs/generation) só devolveu o título da página; https://www.tripo3d.ai/api devolveu 403. **Formatos e preços do Tripo: não confirmados.**

---

## 3. Catálogo Replicate — imagem, SVG e fundo (para keyframes e ícones)

| Modelo | O que confirmei | Preço | Fonte |
|---|---|---|---|
| `google/nano-banana-2` [CONFIRMADO] | `prompt`, `image_input` (até 14), `aspect_ratio` (`1:1 … 21:9, match_input_image`), `resolution` `512px/1K/2K/4K`, `output_format` `jpg` (padrão) ou `png`, `google_search`, `image_search`. **Sem `seed`.** | 1K US$0,067; 2K 0,101; 4K 0,151 [rodada anterior] | https://replicate.com/google/nano-banana-2/llms.txt |
| `black-forest-labs/flux-2-max` [CONFIRMADO] | `prompt`, `input_images` (≤ 8; jpeg/png/gif/webp), `aspect_ratio` (com `match_input_image` e `custom`), `resolution` em megapixels ("Up to 4 MP is possible, but 2 MP or below is recommended", máx. 2048×2048), `width`/`height` múltiplos de 16, `safety_tolerance` 1–5, **`seed`**, `output_format`, `output_quality`. | não lido nesta rodada | https://replicate.com/black-forest-labs/flux-2-max/llms.txt |
| `bria/remove-background` [CONFIRMADO] | `image` ou `image_url`, `preserve_alpha` ("When true, maintains original transparency"), `content_moderation`; `preserve_partial_alpha` deprecado. Saída PNG, "256 levels of transparency". | US$0,018/imagem [rodada anterior] | https://replicate.com/bria/remove-background/llms.txt |
| `recraft-ai/recraft-v4-svg` [rodada anterior] | `prompt`, `aspect_ratio`, `size`; sem `style`/`seed`; saída `.svg`; uso comercial permitido. | US$0,08/imagem | https://replicate.com/recraft-ai/recraft-v4-svg |
| `recraft-ai/recraft-v4-pro-svg` [rodada anterior] | idem, `size` até 3072×1536. | US$0,30/imagem | https://replicate.com/recraft-ai/recraft-v4-pro-svg |
| `recraft-ai/recraft-v3-svg` [CONFIRMADO] | `prompt`, `style` (`any, engraving, line_art, line_circuit, linocut`), `size`, `aspect_ratio`. Sem seed. | não lido | https://replicate.com/recraft-ai/recraft-v3-svg/llms.txt |

**Regra herdada do PROMPT_AGENTICO (mantida):** ícone nasce SVG, nunca PNG vetorizado; família inteira numa leva, mesmo bloco de estilo no prompt; outputs da Replicate expiram em 1 hora, baixar na hora e registrar em `MANIFESTO.json`; keyframe antes de qualquer coisa animada; `prefers-reduced-motion` desliga todo laço.

---

## 4. Fora da Replicate — o que cada tecnologia dá e quanto pesa

Tamanhos reais (minificado + gzip) pela API do Bundlephobia, lidos em 23/09/2026 [CONFIRMADO]:

| Pacote | Versão | min | gzip | Fonte |
|---|---|---|---|---|
| `three` | 0.186.0 | 719 KB | **181 KB** | https://bundlephobia.com/api/size?package=three |
| `@rive-app/webgl2` | 2.43.0 | 191 KB | **53 KB** | https://bundlephobia.com/api/size?package=@rive-app/webgl2 |
| `@rive-app/canvas` | 2.43.0 | 187 KB | 52 KB | https://bundlephobia.com/api/size?package=@rive-app/canvas |
| `@rive-app/canvas-lite` | 2.43.0 | 167 KB | 45 KB | https://bundlephobia.com/api/size?package=@rive-app/canvas-lite |
| `@lottiefiles/dotlottie-web` | 0.80.0 | 161 KB | **32 KB** | https://bundlephobia.com/api/size?package=@lottiefiles/dotlottie-web |
| `lottie-web` | 5.13.0 | 299 KB | 75 KB | https://bundlephobia.com/api/size?package=lottie-web |
| `@google/model-viewer` | 4.3.1 | 230 KB | 71 KB | https://bundlephobia.com/api/size?package=@google/model-viewer |
| `@splinetool/runtime` | 2.0.55 | 944 KB | **263 KB** | https://bundlephobia.com/api/size?package=@splinetool/runtime |

(O Bundlephobia mede o pacote npm; o WASM do Rive e do Spline pode carregar à parte em tempo de execução. Os números servem para comparar ordem de grandeza.)

### 4.1 three.js com glTF — a base (já é a escolha do protótipo)
- `GLTFLoader`: "A loader for the glTF 2.0 format", .gltf e .glb, "meshes, materials, textures, skins, skeletons, morph targets, animations, lights, and/or cameras". Extensões: `KHR_draco_mesh_compression`, `EXT_meshopt_compression`, `KHR_texture_basisu`, `KHR_materials_*`. `setDRACOLoader` "Required for decoding assets compressed with the KHR_draco_mesh_compression extension"; `setKTX2Loader` "Required for loading KTX2 compressed textures"; `setMeshoptDecoder` "Required for decoding assets compressed with the EXT_meshopt_compression extension". [CONFIRMADO] https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/loaders/GLTFLoader.js
- `gltfpack`: "a tool that can automatically optimize glTF files to reduce the download size and improve loading and rendering speed"; `-c` gera "compressed .glb/.gltf files that use meshoptimizer codecs"; `-cc` "applies additional compression"; `-tc` comprime texturas "using Basis Universal format stored in a KTX2 container"; "three.js supports it in r122+ (requires calling GLTFLoader.setMeshoptDecoder)"; o decoder "js/meshopt_decoder.mjs" pode ser "imported from three.js repository". Sem números de taxa de compressão no README. [CONFIRMADO] https://raw.githubusercontent.com/zeux/meshoptimizer/master/gltf/README.md
- `glTF-Transform` CLI: `optimize` ("Optimize model by all available methods"), `draco`, `meshopt`, `quantize` ("reducing precision and memory"), `simplify` ("reducing number of vertices"), `resize` (texturas PNG/JPEG), `etc1s`/`uastc` (KTX2). Sem números. [CONFIRMADO] https://gltf-transform.dev/cli
- Draco: "a library for compressing and decompressing 3D geometric meshes and point clouds"; tamanho do decoder WASM **não publicado em números absolutos** no README. [CONFIRMADO] https://raw.githubusercontent.com/google/draco/main/README.md
- `Line2` / `LineMaterial`: linhas com largura de verdade; `linewidth` "in CSS pixel units when worldUnits is false (default), or in world units when worldUnits is true"; `dashed`, `dashSize`, `gapSize`, **`dashOffset` "Where in the dash cycle the dash starts"**, `dashScale`, `resolution` (precisa ser atualizada com o viewport), `alphaToCoverage` ("can improve the anti-aliasing of line edges when using MSAA"). Animar `dashOffset` a cada quadro faz o fio "correr". [CONFIRMADO] https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/lines/LineMaterial.js
- `CSS3DRenderer`: "apply hierarchical 3D transformations to DOM elements via the CSS3 transform property"; "can also be used in order to combine DOM elements with WebGL content"; **"It's not possible to use the material system of three.js"**, "not possible to use geometries", "only supports 100% browser and display zoom". `CSS3DSprite` tem `rotation2D`. [CONFIRMADO] https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/renderers/CSS3DRenderer.js — é exatamente o que `visual3d.js` já faz com os iframes das Telas.
- `SVGLoader`: devolve `paths` (array de `ShapePath`, cada um com `userData.style`); `createShapes()` "is deprecated. Use shapePath.toShapes() instead"; **"Filters are not supported"** e **"Gradient strokes are not supported"** (só gradiente de preenchimento). [CONFIRMADO] https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/loaders/SVGLoader.js
- `ExtrudeGeometry`: "Creates extruded geometry from a path shape"; opções `curveSegments` (12), `steps` (1), `depth` (1), `bevelEnabled` (true), `bevelThickness` (0,2), `bevelSize` (bevelThickness − 0,1), `bevelOffset` (0), `bevelSegments` (3), `extrudePath` ("Bevels not supported for path extrusion"). [CONFIRMADO] https://raw.githubusercontent.com/mrdoob/three.js/dev/src/geometries/ExtrudeGeometry.js

### 4.2 CSS 3D puro
- `transform-style: preserve-3d`: "children of the element should be positioned in the 3D-space". Baseline "Widely available … since September 2015". **Forçam `flat`** (matam o 3D dos filhos): `overflow` ≠ visible/clip, `opacity` < 1, `filter` ≠ none, `clip-path`, `mask-image`, `mix-blend-mode` ≠ normal, `isolation: isolate`, `contain: paint`. [CONFIRMADO] https://developer.mozilla.org/en-US/docs/Web/CSS/transform-style
- Isométrico em CSS: `transform: rotateX(54.7356deg) rotateZ(45deg)` (90° − 35,264°), derivado dos ângulos da Wikipedia acima. Bom para a moldura Empresa, a Gaveta como caixa de 3 faces e a Tela; ruim para engrenagem, cofre, cadeado (formas curvas).
- Armadilha direta para o protótipo: o `glow` por `filter: drop-shadow` na peça **achata** o `preserve-3d` do pai. Glow em CSS 3D tem que ir no elemento folha, não no contêiner.

### 4.3 Spline
- Exporta: "Public URL", "Embed code" (Notion, Webflow, WordPress, Framer…), Spline Viewer, "Code export (Vanilla JS, React, Next.js, Vue)" e "Self-hosted project export". [CONFIRMADO] https://docs.spline.design/exporting-your-scene/web/exporting-as-public-ur-ls · Exportação para glTF/GLB: **NÃO CONFIRMADA** nesta leitura.
- Otimização: "Avoid using more than 3 subdivision levels"; "We recommend working with less than 3 lights per scene"; "Avoid adding images/textures to your materials if possible"; "Avoid using more than 3 embeds per page". [CONFIRMADO] https://docs.spline.design/exporting-your-scene/how-to-optimize-your-scene
- Runtime `@splinetool/runtime`: **263 KB gz** (Bundlephobia), 1,45× o three.js inteiro, e o conteúdo fica em `.splinecode` proprietário. Para o Babel Coop ("código nosso", `docs/MAQUINA.md` §3) não serve como base; serve, no máximo, como **bancada de modelagem** para exportar geometria, se a exportação glTF for confirmada.

### 4.4 Rive
- Pacotes web: `@rive-app/webgl2` ("Recommended… the same renderer as the Rive Editor"), `@rive-app/canvas`, `@rive-app/canvas-lite` (para quem não usa "Text, Layouts, Scripting, or Audio"). Só 2D vetorial; nada de 3D na documentação. [CONFIRMADO] https://rive.app/docs/runtimes/web/web-js · Tamanhos acima.
- Da rodada anterior: ao importar SVG no Rive, `filter` não é suportado e `stroke-dasharray` vira traço sólido — o glow tem que ser refeito lá dentro. https://rive.app/docs/editor/assets/svg
- **Uso**: só se a Máquina 2D quiser um cadeado que fecha com máquina de estados sem código. Como o protótipo já resolve estados em CSS/JS, Rive é custo sem ganho aqui.

### 4.5 Lottie / dotLottie
- dotLottie: "Package multiple animations, assets, themes, and interactive state machines into one open, compressed file"; "State machines handle click, hover, and completion events"; "Dark mode, brand swaps, and localization without re-exporting". [CONFIRMADO] https://dotlottie.io/ · runtime `@lottiefiles/dotlottie-web` 32 KB gz.
- Nenhum modelo da Replicate produz Lottie; o app do Recraft exporta "SVG, PNG, JPG, PDF, TIFF, and Lottie" (fora da API). [CONFIRMADO] https://www.recraft.ai/docs/recraft-models/recraft-V4
- **Uso**: nenhum na Máquina; ícones animados por `stroke-dashoffset` já dão o mesmo efeito com 0 KB.

### 4.6 `<model-viewer>` — 71 KB gz; só para mostrar um GLB solto (o "b" numa tela de espera), nunca para a Máquina, que precisa de cena com várias peças e fios.

---

## 5. Fios e pulso — quatro jeitos, do mais barato ao mais caro

| Jeito | Onde | Como | Suporte | Fonte |
|---|---|---|---|---|
| **SVG `stroke-dashoffset`** | Máquina 2D | `stroke-dasharray = L; stroke-dashoffset: L → 0` desenha o fio ao "encaixar"; laço contínuo = "dados andando" | "Animatable: Yes"; Baseline "Widely available… since March 2020" | https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/stroke-dashoffset |
| **SVG `<animateMotion>` + `<mpath>`** | Máquina 2D | `<circle>` que corre pelo `<path id="fio">`; "To reuse an existing path, it will be necessary to use an `<mpath>` element"; `keyPoints`/`keyTimes` controlam aceleração; `rotate="auto"` | Baseline "Widely available… since January 2020" | https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/animateMotion |
| **CSS `offset-path`** | Máquina 2D (pulso como `<div>`) | `offset-path: path("M…")` ou `url(#fio)`; `offset-distance: 0% → 100%`; `offset-rotate` | Baseline "Widely available… since March 2022" ("Some parts… varying levels of support") | https://developer.mozilla.org/en-US/docs/Web/CSS/offset-path |
| **three.js `Line2` + `dashOffset`** | 3D | fio largo em pixels (`linewidth`, `worldUnits: false`), `dashed: true`, `dashOffset -= dt` no laço = fluxo contínuo; pulso = trecho curto de `dashSize` | WebGL | LineMaterial.js (acima) |
| **Tubo + esfera + `PointLight`** (o que existe) | 3D | `TubeGeometry` na `CatmullRomCurve3`, esfera emissiva que percorre `curva.getPoint(t)`, luz pontual junto; verde `0x7fd6a6` / vermelho `0xff6b6b` | WebGL | `prototipo/visual3d.js` |

Regra: **um pulso é uma metáfora (dado andando), não um efeito**; entra só quando há evento (Enter, Testar). Com `prefers-reduced-motion`, o fio fica desenhado e o pulso vira mudança de cor instantânea na peça de chegada.

---

## 6. Peça a peça — forma, formato final, peso, quem faz

Convenções: unidade 3D = 1 "stud" (a Gaveta tem 3×2 studs); chanfro único de 0,06 stud em tudo; corpo em ardósia fosca (`roughness 0.6, metalness 0.2`, como já está em `visual3d.js`) ou matcap; **cor da pessoa só na aresta luminosa** (`emissive` em 3D, `--pessoa` em CSS). Pesos são [ALVO].

| Peça | Forma física | Formato final | Peso alvo | Quem faz | Notas |
|---|---|---|---|---|---|
| **Gaveta** (tabela) | caixa 3×2 com ranhuras horizontais (uma por campo) e um puxador | procedural (`BoxGeometry` + ranhuras) → 0 KB; ou glTF ≤ 40 KB | 0–40 KB | **mão** | é a peça mais repetida; tem que ser barata e paramétrica (n campos) |
| **Campo** (coluna) | linha gravada na face da gaveta + ícone do tipo | HTML/CSS no 2D; textura de canvas no 3D | 0 | **mão** | texto é texto; nunca gerar |
| **Fio** (FK) | cabo fino entre gavetas | SVG `<path>` (2D) · `Line2`/`TubeGeometry` (3D) | 0 | **mão** | ver §5 |
| **Chave** (RLS) | cadeado pequeno na quina da gaveta; aberto = vermelho | SVG 24 px (2D) · sprite ou glTF ≤ 20 KB (3D) | 2–20 KB | **IA (Recraft V4 SVG, na leva de ícones)** | dois estados: fechado/aberto |
| **Empresa** (tenant) | moldura/placa de base translúcida em volta das gavetas | CSS 3D (`preserve-3d`) · `PlaneGeometry` com borda | 0 | **mão** | é área, não objeto |
| **Portaria** (auth) | guarita/portão com cancela | glTF ≤ 120 KB | ≤ 120 KB | **IA (Trellis) → material nosso** | keyframe isométrico primeiro |
| **Porta** (rota/API) | batente com seta de entrada | glTF ≤ 60 KB (mão: 3 caixas + seta extrudada) | ≤ 60 KB | **mão** | seta = `ExtrudeGeometry` de um SVG |
| **Robô** (trigger/cron) | engrenagem com um olho/LED | **mão via SVG → `ExtrudeGeometry`** (engrenagem é um contorno 2D) | ≤ 30 KB | **mão** (IA só para a folha de estilo) | gira quando dispara |
| **Depósito** (bucket) | prateleira com caixas | glTF ≤ 80 KB | ≤ 80 KB | **IA (Trellis) ou mão** (prateleira = caixas) | mostra "1,2 GB" como etiqueta |
| **Cofre** (env) | cofre com maçaneta; chave faltando = fenda vermelha | glTF ≤ 120 KB | ≤ 120 KB | **IA (Trellis)** | nunca mostra valor |
| **Tela** (página) | painel plano sem moldura de monitor | `CSS3DObject` com `<iframe>` + `PlaneGeometry` de borda (já existe) | 0 | **mão** | só ela é interativa no 3D (IDEIAS 5.19) |
| **Cano** (Realtime) | tubo translúcido com bolinhas | `TubeGeometry` + `dashOffset`/esferas | 0 | **mão** | igual ao Fio, mais grosso e sempre em movimento leve |
| **"b" volumétrico** | logo extrudada com chanfro | SVG da logo → `SVGLoader` → `toShapes()` → `ExtrudeGeometry` (`depth`, `bevelEnabled`) | SVG ≈ 2 KB | **mão** | glow por bloom/emissive, **não** por `filter` no SVG (SVGLoader: "Filters are not supported") · versão herói opcional: `tencent/hunyuan-3d-3.1` com `prompt` + `enable_pbr` |
| **Pulso** | esfera de luz verde/vermelha | código (§5) | 0 | **mão** | |
| **Matcap** (a luz de todas) | esfera iluminada 256×256 | PNG/WebP | ≤ 20 KB | **IA (nano-banana-2/flux-2-max, 1 imagem) ou mão** | uma só; troca o look de todas as peças de uma vez |
| **Ícones dos rótulos** (14: 12 peças + estados) | traço 1,5 px, grade 24 px, `currentColor` | SVG | 2–6 KB cada | **IA (Recraft V4 SVG, uma leva, mesmo bloco de prompt)** | US$0,08 × 14 |

Peso total do kit [ALVO]: three.js 181 KB gz + glTFs ≤ 500 KB (após `gltfpack -cc -tc`) + matcap ≤ 20 KB + ícones ≤ 60 KB ≈ **≤ 800 KB**, carregado só quando a Máquina/3D abre (o protótipo já carrega o three.js sob demanda).

---

## 7. Como manter as 12 coerentes (mesma luz, mesmo material, mesma lente)

1. **Lente**: uma `OrthographicCamera` com elevação 35,264° e giro 45° (ou o 2:1 de 26,565° se quisermos arestas alinhadas ao pixel na tela HTML). A mesma câmera pré-renderiza as 12 em PNG/WebP para o 2D e enquadra a vista "máquina inteira" no 3D. No modo 3D interativo a perspectiva de `visual3d.js` continua, mas as peças são as mesmas.
2. **Luz**: **ou** um único rig (a `HemisphereLight` + `DirectionalLight` já em `visual3d.js`), **ou** um matcap único (`MeshMatcapMaterial`, "encodes baked lighting"). Nunca luz assada dentro da textura da IA: por isso o albedo do Trellis é descartado.
3. **Material**: um `MeshStandardMaterial` compartilhado (ou o matcap), chanfro de 0,06 stud em todas, sem textura por peça. Cor da pessoa = `emissive` da aresta. Alerta = emissive vermelho. Peça "em construção" = `wireframe` ou opacidade (no CSS 3D, cuidado: `opacity < 1` achata o `preserve-3d`).
4. **Escala**: caixa de referência de 1 stud gravada no prompt da folha de estilo e, no Rodin, `bbox_condition` se for preciso forçar.
5. **Pipeline de IA em ordem** (REGRA 1 do PROMPT_AGENTICO: keyframe antes de tudo):
   1. **Folha de estilo** (1 imagem): nano-banana-2 1K, `output_format: png`, `aspect_ratio: 1:1`, prompt-base abaixo, com 3 peças na mesma folha (Gaveta, Robô, Cofre). Aprovar o look.
   2. **Keyframe por peça** (≤ 12): flux-2-max com `input_images: [folha]`, `seed` fixo, mesmo prompt-base + a frase da peça; ou nano-banana-2 com `image_input: [folha, keyframe anterior…]` (até 14) para "puxar" a família. Fundo `#060b16` sólido, sem chão, sem sombra projetada, sem texto.
   3. **Recorte**: `bria/remove-background` (`preserve_alpha: true`) → PNG com alpha (se a peça for usada como sprite 2D) e entrada limpa para o 3D.
   4. **Geometria**: `firtoz/trellis` com `images: [keyframe]`, `randomize_seed: false`, `seed` anotado, `mesh_simplify: 0.95`, `texture_size: 512`, `generate_normal: false`, `save_gaussian_ply: false`. Para peças que serão vistas por trás: nano-banana-2 gera trás/lados da mesma peça e `tencent/hunyuan3d-2mv` monta.
   5. **Pós**: `gltfpack -cc -tc` (ou `gltf-transform optimize`), abrir no three.js, **trocar o material** pelo compartilhado, alinhar à caixa de 1 stud, salvar GLB final.
   6. **Registro**: `MANIFESTO.json` (modelo, versão, seed, prompt, custo, data). Baixar tudo dentro de 1 hora.
6. **Prompt-base (bloco idêntico em todas as gerações)**:
   `isometric orthographic view, elevation 35 degrees, rotated 45 degrees, single object centered, one small key light from upper-left, soft fill, no cast shadow on ground, matte dark slate body, uniform 2mm beveled edges, one thin cyan edge light, solid #060b16 background, no text, no labels, no people, clean product-render, same scale as reference sheet` + `[PEÇA] <frase da peça em uma linha>` + `[NEGATIVO] no perspective, no ground plane, no gradient background, no extra objects, no letters`.

---

## 8. Custo estimado do kit (ordem de grandeza)

| Item | Quantidade | Preço unitário | Total |
|---|---|---|---|
| Folha de estilo + iterações | 6 × nano-banana-2 1K | 0,067 | 0,40 |
| Keyframes por peça (com 1 repetição) | 16 × nano-banana-2 1K (ou flux-2-max, preço não lido) | 0,067 | 1,07 |
| Recorte | 12 × bria | 0,018 | 0,22 |
| Geometria | 8 peças × 2 seeds × trellis | 0,035 | 0,56 |
| Multi-vista (2 peças) | 2 × hunyuan3d-2mv | ≈ 0,13–0,22 (por análogo) | 0,44 |
| "b" herói (opcional) | 2 × hunyuan-3d-3.1 | 0,50/unidade (unidade não definida) | ≈ 1,00 |
| Ícones | 14 × recraft-v4-svg | 0,08 | 1,12 |
| Matcap | 2 × nano-banana-2 1K | 0,067 | 0,13 |
| **Total** | | | **≈ US$4,9** (≈ 25 % dos US$20) |

---

## 9. Armadilhas

1. `stability-ai/stable-fast-3d` e `camenduru/tripo-sr` **não existem** na Replicate hoje (404). Não gaste tempo procurando o Tripo lá: a coleção 3D não o lista.
2. `firtoz/trellis` recebe **`images` (array)**, não `image`; o `fishwowater/trellis2` recebe `image`. Confundir dá erro de validação.
3. `tencent/hunyuan-3d-3.1`: `prompt` **ou** `image`, "not both". E a unidade de preço não está definida na página.
4. `nano-banana-2` **não tem `seed`** e devolve `jpg` por padrão: pedir `png` sempre. Para reproduzir, use flux-2-max (`seed`) ou referências.
5. Recraft V4 SVG não tem `style` e nenhum estilo Recraft é isométrico: o isométrico inteiro vai no prompt, idêntico na leva toda. O estilo customizado por `style_id` é da API própria do Recraft (V3) e não está na Replicate, e "Style creation" não é suportado no V4.
6. Albedo de imagem→3D carrega **sombra assada**: se ficar, cada peça tem uma luz diferente. Descartar e usar material/matcap nosso.
7. `SVGLoader`: "Filters are not supported", "Gradient strokes are not supported" → o glow do "b" não vem do SVG; vem do material/bloom.
8. CSS 3D: `filter`, `opacity < 1`, `overflow` e `mix-blend-mode` **achatam** o `preserve-3d`. O `drop-shadow` do neon não pode ficar no contêiner 3D.
9. `CSS3DRenderer` "only supports 100% browser and display zoom" e não usa materiais: as Telas em iframe nunca vão receber a luz do pulso; a borda `PlaneGeometry` ao lado (já feita) é quem acende.
10. `LineMaterial.resolution` precisa ser atualizada no resize, senão a largura do fio muda.
11. Spline: runtime 263 KB gz e formato `.splinecode` proprietário; sem confirmação de exportar glTF. Contraria "código nosso".
12. Outputs da Replicate expiram em 1 hora; sem `MANIFESTO.json` você paga duas vezes.
13. `Line2`/`dashOffset` e `animateMotion` em laço infinito custam CPU/GPU parados: `IntersectionObserver` + `visibilitychange` cortam; `prefers-reduced-motion` entrega o estado final.

---

## 10. O que ninguém fez (nesta combinação)

- Um construtor de backend em que **a mesma peça glTF** alimenta o 2D (câmera ortográfica isométrica) e o 3D (perspectiva com as Telas em iframe), sem dois conjuntos de assets.
- Cor de autoria como **luz de aresta** da peça (emissive/`--pessoa`), não como pintura: o "Ver por pessoa" acende o mapa inteiro sem regenerar nada.
- Pulso de dados como **metáfora do request**: verde libera, vermelho barra na Portaria (RLS explicado sem o nome), com `animateMotion` no 2D e `PointLight` andando no 3D.
- Presets (o que funcionou) guardados como **grafo de peças + fios**, não como imagem: reusar é remontar, não colar.
- IA usada **só onde a geometria é orgânica** (cofre, guarita), com material descartado e trocado pelo da casa: a IA entrega forma, a casa entrega luz.

---

## 11. Fontes lidas

Replicate (modelos)
- https://replicate.com/firtoz/trellis · https://replicate.com/firtoz/trellis/llms.txt
- https://replicate.com/fishwowater/trellis2 · https://replicate.com/fishwowater/trellis2/llms.txt
- https://replicate.com/tencent/hunyuan3d-2 · https://replicate.com/tencent/hunyuan3d-2/llms.txt
- https://replicate.com/tencent/hunyuan3d-2mv/llms.txt
- https://replicate.com/tencent/hunyuan-3d-3.1 · https://replicate.com/tencent/hunyuan-3d-3.1/llms.txt
- https://replicate.com/prunaai/hunyuan3d-2
- https://replicate.com/hyper3d/rodin · https://replicate.com/hyper3d/rodin/llms.txt
- https://replicate.com/collections/3d-models
- https://replicate.com/stability-ai (dono; sem 3D) · https://replicate.com/stability-ai/stable-fast-3d (404) · /llms.txt (404)
- https://replicate.com/camenduru/tripo-sr (404) · /llms.txt (404)
- https://replicate.com/google/nano-banana-2 · https://replicate.com/google/nano-banana-2/llms.txt
- https://replicate.com/black-forest-labs/flux-2-max · https://replicate.com/black-forest-labs/flux-2-max/llms.txt
- https://replicate.com/bria/remove-background · https://replicate.com/bria/remove-background/llms.txt
- https://replicate.com/recraft-ai/recraft-v3-svg/llms.txt
- https://replicate.com/recraft-ai/recraft-v4-svg · https://replicate.com/recraft-ai/recraft-v4-pro-svg (rodada anterior)

Repositórios oficiais
- https://raw.githubusercontent.com/microsoft/TRELLIS/main/README.md
- https://raw.githubusercontent.com/Tencent-Hunyuan/Hunyuan3D-2/main/README.md
- https://raw.githubusercontent.com/zeux/meshoptimizer/master/gltf/README.md
- https://raw.githubusercontent.com/zeux/meshoptimizer/master/js/README.md
- https://raw.githubusercontent.com/google/draco/main/README.md

three.js (código-fonte com JSDoc)
- https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/lines/LineMaterial.js
- https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/renderers/CSS3DRenderer.js
- https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/loaders/SVGLoader.js
- https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/loaders/GLTFLoader.js
- https://raw.githubusercontent.com/mrdoob/three.js/dev/src/cameras/OrthographicCamera.js
- https://raw.githubusercontent.com/mrdoob/three.js/dev/src/geometries/ExtrudeGeometry.js
- https://raw.githubusercontent.com/mrdoob/three.js/dev/src/materials/MeshMatcapMaterial.js
- https://gltf-transform.dev/cli

MDN / Wikipedia
- https://developer.mozilla.org/en-US/docs/Web/CSS/offset-path
- https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/animateMotion
- https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/stroke-dashoffset
- https://developer.mozilla.org/en-US/docs/Web/CSS/transform-style
- https://en.wikipedia.org/wiki/Isometric_projection
- https://en.wikipedia.org/wiki/Isometric_video_game_graphics

Ferramentas fora da Replicate
- https://www.recraft.ai/docs/api-reference/styles · https://www.recraft.ai/docs/recraft-models/recraft-V4
- https://rive.app/docs/runtimes/web/web-js
- https://dotlottie.io/
- https://docs.spline.design/ · https://docs.spline.design/exporting-your-scene/web/exporting-as-public-ur-ls · https://docs.spline.design/exporting-your-scene/how-to-optimize-your-scene
- https://bundlephobia.com/api/size?package=three · …=@rive-app/webgl2 · …=@rive-app/canvas · …=@rive-app/canvas-lite · …=@lottiefiles/dotlottie-web · …=lottie-web · …=@google/model-viewer · …=@splinetool/runtime

Não lidas (falha de acesso): https://platform.tripo3d.ai/docs (só título) · https://www.tripo3d.ai/api (403) · https://www.npmjs.com/package/@splinetool/runtime (403) · https://developers.lottiefiles.com/docs/dotlottie-player/ (redirecionou sem conteúdo).
