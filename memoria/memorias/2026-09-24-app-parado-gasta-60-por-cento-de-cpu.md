---
id: 2026-09-24-app-parado-gasta-60-por-cento-de-cpu
type: learning
title: "O babel-coop parado gasta ~60% de um núcleo e ~650 MB de memória"
tags: [babel-coop, desempenho, terminal-ao-vivo]
confidence: 0.9
status: superseded
source: repositorio
created: 2026-09-24
updated: 2026-09-24
superseded_by: 2026-09-24-leveza-animacao-so-no-compositor
links: []
---
Medido em 24/09/2026 num Mac16,13 com 16 GB: a Estação com a equipe fundada e sem uso fica em ~636 MB (6 processos) e ~57% de CPU de um núcleo; durante a geração de uma campanha, ~700 MB e média de 66% (pico de 84%). O `/Applications/babel-coop.app` aberto mostrou o mesmo padrão: GPU 32% e renderer 20%. O gasto vem das animações que nunca param (casca-b-vivo, pulsar, av-respira, bc-org-gira), que mantêm a GPU compondo a tela o tempo todo. Script da medida: scratchpad da sessão (medir-peso.js, pela árvore de processos do `ps`).
**Por quê:** memória na faixa do Slack e do Discord é aceitável, mas CPU alta com o app parado esquenta e drena a bateria dos notebooks da equipe.
**Como aplicar:** efeito novo, como os poderes da campanha, tem que ter começo e fim; baixar o CPU parado antes de somar brilho, e medir de novo depois de cada mudança.
