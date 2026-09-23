<!-- NOTAS DE ADAPTAÇÃO AO REINO (Claude, 22/09/2026). Leia antes da especificação.
- Especificação fornecida pelo Marcelo; vale para a construção da LP do Reino.
- Token da Replicate: em `reino/.env` (REPLICATE_API_TOKEN, chmod 600, fora do git). Carregar com `set -a; . ./.env; set +a`. NUNCA copiar para arquivos, código cliente ou docs.
- Catálogo verificado via API em 22/09/2026: 39 de 40 slugs existem. `bytedance/seedream-5` NÃO existe → usar `bytedance/seedream-5-pro` (ou `-lite`).
- Seção 2 pede Vite: não há Node nesta máquina. Até instalar Node, a LP é HTML/CSS/JS estático com as libs em `libs/` (GSAP 3.13 + ScrollTrigger + SplitText, Lenis). Registrar em DECISOES.md.
- Fatiamento: usar `tools/fatiar-video.sh` (já alinhado à seção 8: DPR 1.5, 12 primeiros frames com prioridade).
- Custos: gerar mídia SOMENTE com aprovação explícita do Marcelo para cada fase (orçamento da seção 9: US$ 20–60).
- Conteúdo, copy e identidade: `conhecimento/reino.md` e `conhecimento/copy-lp-v1.md` prevalecem sobre qualquer exemplo genérico daqui.
-->

# PROMPT AGÊNTICO — Landing Page imersiva de captação, construída com Replicate

> **Como usar:** cole este arquivo inteiro para a IA construtora, como primeira mensagem do
> projeto. Ele é a especificação completa: missão, contrato de qualidade, API, catálogo de
> modelos, pipeline de mídia, arquitetura de motion e critérios de aceite.
> Nada aqui é sugestão. O que está marcado **REGRA** é obrigatório.
> Versão: set/2026. Base de pesquisa: documentação da Replicate + estado da arte de LP 2026/2027.

---

## 0. MISSÃO

Você vai construir **uma landing page de captação de leads** que funciona como experiência,
não como página. O visitante deve sentir que entrou em algo — e sair com o formulário
preenchido. O material visual (vídeo, imagem, ícone, som) é **gerado por você** via API da
Replicate, não licenciado de banco de imagem.

**Definição de pronto:**
1. A página abre em menos de 2,5s de LCP em 4G real e roda a 60fps no scroll.
2. Toda mídia é própria, coerente entre si (mesma luz, mesma paleta, mesma lente).
3. O formulário converte: um objetivo por tela, um CTA dominante, atrito mínimo.
4. Nada quebra sem JavaScript, sem WebGL, com `prefers-reduced-motion`, ou no iOS Safari.
5. O custo total de geração fica dentro do orçamento declarado na seção 9.

**Você tem discernimento.** Quando duas rotas servirem, escolha a mais barata que passa no
critério de qualidade — e **registre a escolha** em `DECISOES.md`, com o porquê em uma linha.

---

## 1. REGRAS DE OURO (violar qualquer uma reprova a entrega)

**REGRA 1 — Nunca gere vídeo antes de aprovar a imagem.**
O modelo de vídeo não inventa o visual. Você gera *keyframes* (imagem estática), trava
enquadramento, luz e paleta, e só então anima. Vídeo gerado de prompt puro é loteria cara.

**REGRA 2 — Nunca amarre `<video>.currentTime` ao scroll.**
O iOS Safari não faz *seek* suave: trava, pula keyframe e some em modo economia. O efeito de
scroll usa **sequência de frames em `<canvas>`**. Sem exceção.

**REGRA 3 — Os arquivos de saída da Replicate expiram em 1 hora.**
`replicate.delivery` apaga o output após 60 minutos. **Baixe e persista imediatamente** em
`/assets/raw/` no ato da conclusão da predição. Perder isso = pagar de novo.

**REGRA 4 — Seed fixa dentro de uma mesma sequência.**
Seed solta entre gerações irmãs = flicker entre frames. Flicker mata o efeito inteiro.

**REGRA 5 — Confirme o slug e o schema antes de chamar.**
Modelos mudam de versão. Antes do primeiro uso de cada modelo:
`GET /v1/models/{owner}/{name}` e leia o campo de schema de input. Nunca chute parâmetro.

**REGRA 6 — Orçamento é limite duro.**
Antes de cada lote, estime o custo. Ao atingir 80% do orçamento da seção 9, pare e reporte.

**REGRA 7 — Nada de áudio automático.**
Autoplay com som é bloqueado pelos navegadores e detona a experiência. Som só depois de
gesto do usuário, com botão de ativar visível. Detalhe na seção 7.

**REGRA 8 — Toda animação tem desligamento.**
`@media (prefers-reduced-motion: reduce)` corta o laço de animação e entrega o estado final
estático. Acessibilidade não é opcional.

---

## 2. STACK DA PÁGINA

| Camada | Escolha | Porquê |
|---|---|---|
| Base | **HTML + CSS + JS (Vite)** | LP não precisa de framework; menos JS = mais conversão |
| Motion | **GSAP + ScrollTrigger** (gratuito desde 2025, inclusive SplitText) | controle de *scrub* que CSS puro ainda não dá |
| Complemento | **CSS scroll-driven animations** (`animation-timeline: scroll()` / `view()`) | roda fora da main thread; use para revelações simples |
| 3D (opcional) | **WebGL via Three.js**, só no herói | WebGPU ainda não é base segura em 2026 |
| Imagem | WebP q≈72 (AVIF só se medir ganho) | 40–80 KB por frame |
| Fonte | self-hospedada, `preload` + `font-display: swap` | evita FOUT no SplitText |
| Formulário | nativo + `fetch` para o endpoint do cliente | sem dependência de widget de terceiro |

**Suporte de scroll-driven CSS (mid-2026):** Chrome/Edge 115+, Firefox 132+, Safari 18+,
~84–90% global. **REGRA:** sempre dentro de `@supports (animation-timeline: scroll())`, com
fallback estático. Efeito principal (frame-sequence) continua no GSAP.

---

## 3. REPLICATE — CONTRATO OPERACIONAL DA API

Base: `https://api.replicate.com`. Header: `Authorization: Bearer $REPLICATE_API_TOKEN`.
**REGRA:** token só em variável de ambiente no servidor. Nunca no cliente, nunca no repositório.

### 3.1 Endpoints que você vai usar

| Método | Rota | Uso |
|---|---|---|
| POST | `/v1/models/{owner}/{name}/predictions` | rodar modelo oficial (o caminho padrão) |
| POST | `/v1/predictions` | rodar versão específica de modelo da comunidade |
| GET | `/v1/predictions/{id}` | consultar status |
| POST | `/v1/predictions/{id}/cancel` | abortar |
| GET | `/v1/models/{owner}/{name}` | **schema de input — leia antes de chamar** |
| GET | `/v1/collections/{slug}` | catálogo por categoria |
| GET | `/v1/search?query=` | achar modelo por termo |
| POST | `/v1/deployments` | endpoint dedicado com instância quente |
| POST | `/v1/deployments/{owner}/{name}/predictions` | rodar nesse endpoint |
| GET | `/v1/account` · `/v1/hardware` | conta e SKUs de hardware |

**Limites:** 600 predições/min; demais rotas 3000/min; acima disso, HTTP 429 → backoff exponencial.

### 3.2 Modos de execução

**Assíncrono (padrão).** Responde na hora com `id` e status. Use para **tudo que é vídeo**.
Combine com `webhook` + `webhook_events_filter: ["completed"]`. Se não tiver endpoint público
de webhook, faça *polling* no `GET /v1/predictions/{id}` com intervalo de 2s e teto de 15min.

**Síncrono.** Header `Prefer: wait` (ou `Prefer: wait=5`, de 1 a 60s). Segura a conexão e
devolve o resultado direto. Use só para **imagem rápida e SVG**. Se estourar o tempo, volta
prediction incompleta com a URL de acompanhamento — trate esse caso, não assuma sucesso.

**Prazo máximo.** Header `Cancel-After` (5s a 24h) mata a predição sozinha. **REGRA:** todo
job de vídeo leva `Cancel-After: 900` para não haver conta fantasma.

### 3.3 Entrada e saída de arquivo

- Entrada aceita **URL pública** ou **data URI base64**. Prefira URL: base64 grande engorda o
  payload e aumenta a chance de timeout.
- Saída: URL em `replicate.delivery`, **válida por 1 hora** (ver REGRA 3).
- Fluxo obrigatório: `predição concluída` → `download imediato` → `/assets/raw/<slug>/<seed>/`
  → registrar em `MANIFESTO.json` (modelo, versão, seed, prompt, custo, data).

### 3.4 Cold start e Deployments

Modelo frio leva **20–60s** para subir. Fatiar 8 seções de vídeo com cold start a cada chamada
transforma o dia em espera.
**REGRA:** para qualquer modelo que você vá chamar **mais de 10 vezes** (tipicamente o de
imagem, o de upscale e o de remoção de fundo), crie um **Deployment** com `min_instances: 1`
durante a produção e **`min_instances: 0` ao terminar** — instância quente cobra parada.
Use `max_instances` como trava de gasto.

---

## 4. CATÁLOGO DE MODELOS (slugs verificados no catálogo da Replicate, set/2026)

> Confira o schema de cada um antes de usar (REGRA 5). Nomes de parâmetro variam entre famílias.

### 4.1 Vídeo — escolha por trabalho

| Trabalho | Modelo | Por quê |
|---|---|---|
| **Loop perfeito / controle de início e fim** | `wan-video/wan-2.7-i2v` · `vidu/q3-pro` · `google/veo-3.1` | os únicos com **first-and-last-frame**; `Z = A` fecha o ciclo |
| **Aderência ao briefing** (o rótulo tem que continuar legível na órbita) | `bytedance/seedance-2.0` | melhor obediência a prompt; aceita até 9 refs de imagem |
| **Áudio nativo em sincronia** | `google/veo-3.1` · `bytedance/seedance-2.0` · `kwaivgi/kling-v3-video` | som gerado junto com a imagem, não dublado |
| **Cinemático longo / multi-cena** | `kwaivgi/kling-v3-video` (até 15s, até 6 cenas) | plano-sequência sem emendar |
| **Movimento humano realista** | `minimax/hailuo-2.3` | corpo e rosto em movimento sem derreter |
| **Rascunho barato de enquadramento** | `bytedance/seedance-2.0-fast` · `wan-video/wan-2.2-i2v-fast` · `minimax/hailuo-2.3-fast` | **aprove a composição aqui antes de gastar no caro** |
| **HDR / pós agressivo** | `luma/ray-3.2` | exporta HDR e EXR |

**REGRA:** todo plano final da página nasce de um rascunho aprovado em modelo *fast*. Aprovar
no caro é queimar orçamento.

### 4.2 Imagem — keyframes e arte

| Trabalho | Modelo |
|---|---|
| Keyframe fotográfico principal | `google/nano-banana-2` (rápido, funde múltiplas refs, edita por conversa) |
| Máxima fidelidade / hero estático | `black-forest-labs/flux-2-max` · `google/imagen-4-ultra` |
| **Texto legível dentro da imagem** | `black-forest-labs/flux-2-flex` · `ideogram-ai/ideogram-v3-quality` |
| Composição de design / layout intencional | `recraft-ai/recraft-v4.1` |
| Visual de cinema, leitura espacial | `bytedance/seedream-5` |
| Iteração barata | `google/imagen-4-fast` · `prunaai/p-image` (sub-1s) |

### 4.3 Ícones e vetor — **o segredo da camada de UI**

| Modelo | Uso |
|---|---|
| `recraft-ai/recraft-v4-svg` | **SVG nativo**, produção |
| `recraft-ai/recraft-v4-pro-svg` | SVG detalhado e editável |
| `quiverai/arrow-1.1` | ícones, logos, ilustração editável |
| `quiverai/arrow-1.1-max` | vetor denso, diagrama técnico |

**REGRA:** ícone **nunca** nasce PNG para ser vetorizado depois — o traço sai sujo e o peso
explode. Gere SVG direto. Um conjunto inteiro de ícones fica em ~100 KB, contra ~3 MB em PNG.
Gere a família toda **numa só leva, com o mesmo prompt de estilo**, para o traço bater.

### 4.4 Áudio e sound design — **sim, a Replicate tem**

| Trabalho | Modelo |
|---|---|
| Trilha de fundo / leito sonoro | `stability-ai/stable-audio-2.5` (música **e** efeitos a partir de texto) |
| Música com estrutura e vocal | `minimax/music-2.5` (14+ marcadores de seção: intro, verso, drop…) · `elevenlabs/music` |
| Estéreo 48kHz com prompt negativo | `google/lyria-2` |
| Loop de BPM fixo (leito infinito) | `andreasjansson/musicgen-looper` |
| Base genérica | `meta/musicgen` |
| Som ambiente colado no vídeo | gerar direto no `google/veo-3.1` / `bytedance/seedance-2.0` (áudio nativo) |

**Regra do leito:** a trilha da LP é **loop curto de 20–30s em BPM fixo**, não música com
começo e fim. Gere com `musicgen-looper` ou `stable-audio-2.5` pedindo *seamless loop*.

### 4.5 Pós-produção

| Trabalho | Modelo |
|---|---|
| Upscale de imagem topo de linha | `topazlabs/image-upscale` |
| Upscale preservando identidade | `philz1337x/clarity-pro-upscaler` |
| Upscale barato e rápido | `google/upscaler` · `nightmareai/real-esrgan` · `prunaai/p-image-upscale` |
| Restauro de vídeo | `zsxkib/seedvr2` |
| Remoção de fundo (imagem) | `851-labs/background-remover` · `bria/remove-background` · `men1scus/birefnet` |
| Remoção de fundo (vídeo) | `arielreplicate/robust_video_matting` · `lucataco/rembg-video` |

**Interpolação de frames:** `pollinations/rife-video-interpolation` está **quebrado na Replicate**
(Cog/Python fora de suporte). **REGRA:** faça a interpolação **local**, com `ffmpeg minterpolate`
ou RIFE local (grátis), fora da API. Não desperdice tempo procurando substituto pago.

```bash
# 24fps -> 60fps localmente, sem custo de API
ffmpeg -i clipe.mp4 -vf "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:vsbmc=1" clipe60.mp4
```

---

## 5. TÉCNICA DE GERAÇÃO — como aumentar a taxa de acerto

Vídeo é o item caro. Cada regeneração é dinheiro. Estas são as alavancas que mais reduzem erro:

### 5.1 Contrato de prompt de câmera — seis campos, sempre nesta ordem

Preset é escolha. Isto é **direção**.

```
[LENTE]      35mm anamórfico, f/2.0, foco no plano médio
[MOVIMENTO]  dolly-in lento e constante, 0,4 m no clipe inteiro, sem tremor
[SUJEITO]    <o que é, material, escala, o que faz — em uma frase>
[LUZ]        key a 45° à esquerda, contraluz fria, sem estouro em alta-luz
[AMBIENTE]   <espaço, profundidade, partículas, atmosfera>
[NEGATIVO]   sem corte de plano, sem zoom brusco, sem texto na imagem, sem deformação de mão
```

### 5.2 Alavancas de determinismo

1. **`first_frame` = keyframe A aprovado.** Sempre. O modelo interpola, não inventa.
2. **`last_frame` = keyframe Z.** Para loop cíclico: **`Z = A`**.
3. **Reference images (até 3, até 9 no Seedance 2.0).** Travam identidade de produto entre cenas.
4. **Seed fixa** por sequência (REGRA 4). Anote a seed no `MANIFESTO.json`.
5. **Duração curta.** 5s bem dirigido vale mais que 10s frouxo — e custa metade.
6. **Gere em 24fps e interpole localmente** para 48/60. Pedir 60fps ao modelo custa múltiplo
   do preço por um ganho que o RIFE/ffmpeg entrega de graça.

### 5.3 Pipeline completo, em ordem

```
1. keyframe A e Z        → nano-banana-2 / flux-2-max      (imagem, barato, itere à vontade)
2. rascunho de movimento → seedance-2.0-fast               (aprove enquadramento)
3. plano final           → wan-2.7-i2v | veo-3.1 | seedance-2.0  (first+last frame, seed fixa)
4. correção pontual      → upscale / matting               (só o que precisa)
5. interpolação local    → ffmpeg minterpolate 24→60fps    (grátis)
6. fatiamento em frames  → ffmpeg → WebP
7. validação             → variação de bytes entre frames ≤ ±30%
```

```bash
# fatiar para a sequência de scroll
ffmpeg -i clipe60.mp4 -vf "fps=30,scale=1600:-1" -q:v 3 frames/%04d.webp
```

**Validação obrigatória:** todos os frames com tamanho em bytes dentro de ±30% da mediana.
Um frame fora da curva é um salto visível no scroll.

---

## 6. ARQUITETURA DA PÁGINA — o que prende e o que converte

### 6.1 Sequência de seções (ordem de leitura emocional)

| # | Seção | Função | Mídia |
|---|---|---|---|
| 1 | **Herói** | recusar a categoria errada onde o mercado já encaixa o cliente | frame-sequence 1 (ou vídeo em loop mudo, `poster` obrigatório) |
| 2 | **Dor nomeada** | o visitante se reconhece em uma frase | tipografia + máscara de linha |
| 3 | **Mecanismo** | *como* funciona, em 3 passos com ícone SVG | frame-sequence 2 (objeto girando/montando) |
| 4 | **Prova** | números, logos, depoimento curto | contador com scrub + logos em cinza |
| 5 | **Oferta** | o que o lead recebe ao preencher | card em destaque |
| 6 | **Objeção** | 4 perguntas, acordeão | microinteração de abertura |
| 7 | **Captura** | formulário, CTA dominante | fundo calmo — **aqui o motion baixa** |
| 8 | **Rodapé** | segurança, contato, política | estático |

**REGRA:** o motion **desacelera** ao chegar na captura. Página que continua espetacular em
cima do formulário compete com o formulário e derruba a conversão.

### 6.2 Motion — as transições que viciam

O que prende não é quantidade de efeito, é **causalidade**: o scroll precisa parecer que
*causa* o que acontece. Cada efeito abaixo passa no teste da metáfora (existe motivo físico
para ele acontecer).

1. **Frame-sequence com scrub** — o núcleo. `ScrollTrigger` com `scrub: 1` (suavização de 1s),
   `pin: true` na seção, altura `300vh`–`400vh`, 96–180 frames, `canvas.drawImage`.
2. **Revelação por máscara de linha** — `SplitText` por linha dentro de `overflow: hidden`,
   subindo com `stagger: 0.06`. **Espere `document.fonts.ready`** ou o recorte come acento.
3. **Pin + troca de camada** — o fundo trava, o conteúdo troca por cima. Dá sensação de
   profundidade sem 3D.
4. **Parallax de 3 planos** — fundo 0.2×, meio 0.6×, frente 1×. Sutil. Passar disso enjoa.
5. **Contador com scrub** — número sobe conforme o scroll, não no tempo. O usuário sente que
   está puxando o dado.
6. **Cursor magnético no CTA** — botão atrai o cursor num raio de ~80px, com `quickTo` do GSAP.
   Só em ponteiro fino (`@media (hover: hover)`).
7. **Véu do herói** — gradiente sobre a mídia para o texto ter contraste. **Precisa de versão
   vertical para tela estreita**, ou o título some no vídeo.
8. **Transição entre seções por `view-timeline`** — entrada de cartões em CSS puro, fora da
   main thread, dentro de `@supports`.

**Orçamento de motion:** no máximo **2 efeitos simultâneos** na mesma dobra. Três ou mais
viram ruído e derrubam o frame rate.

### 6.3 Ícones imersivos — camada que quase todo mundo erra

- Conjunto gerado em **SVG nativo** (`recraft-v4-svg`), traço e peso idênticos entre todos.
- **Anime o traço, não a caixa:** `stroke-dasharray` + `stroke-dashoffset` animados revelam o
  ícone sendo *desenhado* quando entra na viewport. É o detalhe que faz o olho voltar.
- `currentColor` no `stroke`, para o ícone herdar cor do estado (hover, foco, ativo).
- Micro-resposta no hover: escala 1.06, duração 180ms, `ease: power2.out`. Mais que isso vira
  desenho animado.
- **Não use ícone como enfeite.** Cada um é o rótulo visual de um passo do mecanismo.

### 6.4 Tipografia e ritmo

- Duas escalas modulares (uma para display, uma para texto), espaçamento em múltiplos de 8.
- Medida de linha entre 60 e 75 caracteres (cai para ~40ch no celular).
- Máscara de linha com folga para acentos e descidas (ç, ã, g, p) — testar com texto real em
  português, não com *lorem ipsum*.
- Menu com no máximo 5 itens. **Um** CTA primário dominante por tela.

### 6.5 Copy

Estrutura: **impacto → desejo → segurança**, com enquadramento de perda no CTA
("continuar perdendo X" pesa mais que "ganhe Y").
CTA nunca genérico: nada de "Enviar" ou "Saiba mais" — use o benefício
("Quero o diagnóstico gratuito"). Ajuste o texto do botão por origem de campanha quando houver
parâmetro de URL.

---

## 7. SOM — usar sem ser expulso

A política de autoplay dos navegadores exige **gesto do usuário** para criar ou retomar o
`AudioContext`. Contexto criado antes do gesto nasce `suspended`.

**Implementação obrigatória:**
1. Página abre **em silêncio**, sempre. Vídeo de fundo com `muted playsinline` e `poster`.
2. Botão de som fixo, canto inferior, visível desde o primeiro scroll — ícone de onda com
   dois estados claros. Nada de descobrir por acaso.
3. No clique: `audioContext.resume()` e só então tocar. Salve a preferência em `localStorage`.
4. Camadas do som: **leito em loop** (20–30s, BPM fixo, −18 LUFS) + **efeitos pontuais**
   (entrada de seção, envio do formulário) em volume mais baixo que o leito.
5. Efeito de interface curto (≤400ms) e **no máximo um por seção**. Som repetido irrita rápido.
6. `visibilitychange` → pausa tudo em aba oculta.

---

## 8. PERFORMANCE, ACESSIBILIDADE E REDE DE SEGURANÇA

| Item | Valor obrigatório |
|---|---|
| Frames por sequência | 96–180 (abaixo de 96 lê como stop-motion) |
| Peso por sequência | **≤ 8 MB** (acima disso o LCP morre no 4G) |
| Resolução de frame | 1600×900 (ou 1440×1440 quadrado) |
| `devicePixelRatio` | **capado em 1.5** |
| Carga dos frames | 12 primeiros com `fetchpriority="high"`; resto por `requestIdleCallback` |
| Fora da viewport | `IntersectionObserver` pausa o laço |
| Aba oculta | `visibilitychange` mata o `requestAnimationFrame` |
| Alvo de toque | ≥ 48×48px, 8–16px entre alvos |
| Ação primária no celular | zona do polegar (parte de baixo) |
| Sem JS | classe `sem-js` removida por script inline; conteúdo aparece mesmo assim |
| Acima da dobra | abre no `load`, **nunca** depende de scroll |
| `prefers-reduced-motion` | desliga o laço e entrega o frame final |

**Gaveta mobile:** existe. Não é opcional. Menu completo em tela estreita, 56px por item.

---

## 9. ORÇAMENTO E CONTROLE DE GASTO

**Estimativa de referência (ordem de grandeza — confirme o preço atual de cada modelo em
`GET /v1/models/{owner}/{name}` e na página do modelo antes do primeiro lote):**

| Item | Quantidade | Faixa |
|---|---|---|
| Keyframes (imagem) | ~40 gerações com iteração | US$ 1–4 |
| Rascunhos de vídeo (*fast*) | 12 clipes de 5s | US$ 5–15 |
| Planos finais de vídeo | 4–6 clipes de 5–8s | US$ 8–30 |
| Ícones SVG | 1–2 levas | US$ 1–3 |
| Áudio (leito + efeitos) | 3–5 gerações | US$ 1–4 |
| Upscale / matting | pontual | US$ 1–5 |
| **Total alvo** | | **US$ 20–60** |

**Controles obrigatórios:**
- `max_instances` em todo Deployment.
- `Cancel-After: 900` em todo job de vídeo.
- `MANIFESTO.json` com custo por predição; total acumulado impresso ao fim de cada lote.
- Em 80% do orçamento: **parar e reportar**, não continuar.

---

## 10. ORDEM DE EXECUÇÃO

```
FASE 0 — Fundação (sem custo de API)
  0.1  Ler o briefing do cliente; escrever DIRECAO.md: categoria recusada, promessa,
       paleta, lente, vocabulário visual. Uma página. Aprovar antes de gastar.
  0.2  Scaffold Vite + GSAP; grade, escalas tipográficas, tokens de cor.
  0.3  Página inteira com placeholders cinza, copy real e formulário funcionando.
       ► Marco: a LP já converte sem nenhuma mídia gerada.

FASE 1 — Arte estática
  1.1  Keyframes A e Z de cada sequência (imagem). Iterar até aprovar.
  1.2  Família de ícones em SVG nativo, leva única.
       ► Marco: a página já é bonita parada.

FASE 2 — Movimento
  2.1  Rascunhos em modelo fast; aprovar enquadramento.
  2.2  Planos finais com first+last frame e seed fixa.
  2.3  Interpolação local, fatiamento, validação de bytes.
  2.4  Ligar ScrollTrigger; medir fps num aparelho real.
       ► Marco: 60fps no celular do cliente, não no desktop do dev.

FASE 3 — Som e acabamento
  3.1  Leito em loop + efeitos; botão de som.
  3.2  prefers-reduced-motion, sem-js, gaveta mobile, véu vertical.
  3.3  Core Web Vitals em rede móvel real.
       ► Marco: checklist da seção 11 inteiro marcado.
```

**Ao fim de cada fase, pare e reporte** com: o que foi feito, custo acumulado, o que decidiu
diferente do previsto e por quê. Não emende fases sem reportar.

---

## 11. CHECKLIST DE ACEITE

**Estratégia**
- [ ] Qual é a categoria errada onde o mercado já encaixa este cliente? A primeira tela recusa essa categoria?
- [ ] Copy em impacto → desejo → segurança, com enquadramento de perda?
- [ ] Um objetivo por tela e um CTA primário dominante?
- [ ] O motion **desacelera** na seção de captura?

**Mídia**
- [ ] Todo vídeo nasceu de keyframe aprovado (REGRA 1)?
- [ ] Sequências cíclicas com `last_frame = first_frame`?
- [ ] Seed fixa registrada no `MANIFESTO.json`?
- [ ] Todos os outputs baixados dentro da janela de 1 hora?
- [ ] Variação de bytes entre frames ≤ ±30%?
- [ ] Ícones em SVG nativo, traço animado, `currentColor`?

**Técnica**
- [ ] Nenhum `<video>.currentTime` amarrado ao scroll?
- [ ] ≤ 8 MB por sequência, DPR capado em 1.5?
- [ ] 12 primeiros frames com `fetchpriority="high"`?
- [ ] `IntersectionObserver` e `visibilitychange` cortando o laço?
- [ ] `SplitText` esperando `document.fonts.ready`?
- [ ] `@supports` em torno de todo scroll-driven CSS?
- [ ] Fallback `sem-js` funcionando?
- [ ] Máximo de 2 efeitos simultâneos por dobra?

**Experiência**
- [ ] Página abre em silêncio, com botão de som visível?
- [ ] `prefers-reduced-motion` entrega versão estática íntegra?
- [ ] Alvos de toque ≥ 48px, ação primária na zona do polegar?
- [ ] Gaveta mobile existe?
- [ ] Véu do herói tem versão vertical?
- [ ] Máscaras de linha acomodam acentos e descidas em português?
- [ ] Core Web Vitals medidos em conexão móvel real (não no Lighthouse do desktop)?

**Processo**
- [ ] `DECISOES.md` com cada escolha de modelo e o porquê?
- [ ] Custo total dentro do orçamento da seção 9?
- [ ] Token fora do repositório?

---

## 12. O QUE NÃO FAZER

- Não peça 60fps ao modelo de vídeo — interpole de graça no local.
- Não gere ícone em PNG para vetorizar depois.
- Não use `pollinations/rife-video-interpolation` (quebrado na plataforma).
- Não deixe Deployment com `min_instances: 1` após a produção.
- Não coloque animação de entrada em elemento acima da dobra dependente de scroll.
- Não empilhe efeito só porque é possível: o teste é a metáfora, não o catálogo.
- Não confie em preço de memória — leia o preço vigente antes do lote.
- Não entregue sem medir em aparelho real.
