---
id: 2026-09-24-leveza-animacao-so-no-compositor
type: learning
title: "App leve: animação contínua só com escala e opacidade, e pausa sem foco"
tags: [babel-coop, desempenho, terminal-ao-vivo]
confidence: 0.9
status: active
source: repositorio
created: 2026-09-24
updated: 2026-09-24
supersedes: 2026-09-24-app-parado-gasta-60-por-cento-de-cpu
links: [2026-09-24-app-parado-gasta-60-por-cento-de-cpu]
---
Medido em 24/09/2026 com o app limpo e parado: só duas animações infinitas (o "b" do logo, que animava drop-shadow, e a borda das fotos, que animava box-shadow) custavam 22 dos 24% de CPU. Refeitas só com escala e opacidade (brilho desenhado uma vez, camada .av-luz) e pausadas com html.sem-foco, o app ficou em 1,7% sem foco e 16–18% com foco. A TV nunca pausa.
**Por quê:** animar sombra ou filtro redesenha a tela 60 vezes por segundo; escala e opacidade a placa de vídeo compõe sem redesenhar.
**Como aplicar:** efeito que fica rodando sempre anima só transform e opacity, e para quando a Estação perde o foco; medir antes e depois com a árvore de processos (gpu, renderer, main).
