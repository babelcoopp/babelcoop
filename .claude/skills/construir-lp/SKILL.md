---
name: construir-lp
description: Três propostas de landing page em paralelo, dois juízes, construção da vencedora e crítica final. Use para LP de campanha ou evento importante, quando vale gastar mais para acertar de primeira.
argument-hint: "<briefing> [slug]"
disable-model-invocation: true
---
Briefing: $ARGUMENTS

Se o cabeçalho do índice diz `⏸ PAUSADO`: construa a LP, diga aos agentes "não leia `memoria/`", não registre o projeto e avise numa linha que nada foi anotado.

O Theus pediu uma orquestração. Rode a ferramenta Workflow com um script escrito na hora (inline, nunca gravado em arquivo), nesta receita:

1. **Propostas:** 3 agentes em paralelo, com ângulos diferentes (conversão, história, prova): estrutura, títulos, CTA e promessa central. Só texto. Prova só com o que o briefing trouxer; o resto vira `[depoimento a coletar]`.
2. **Julgamento:** 2 juízes em paralelo, saída `{notas: number[], melhor: integer, motivo: string}`, nota de 0 a 10 para cada proposta pensando no público do briefing. Vence a maior soma; empate fica com a proposta de menor número. `log()` da vencedora e de quantos juízes responderam.
3. **Construção:** agente `construtor-web` escreve `entregas/sites/<slug>.html` a partir da vencedora, seguindo `.claude/rules/entregas.md` e a identidade de `docs/design/`.
4. **Crítica:** agente `critico` aponta até 5 problemas por gravidade, com a correção.

Slug: a última palavra do pedido se ela já estiver no formato `minusculas-com-hifen`; senão, derive do briefing. Depois do workflow: aplique as correções de gravidade alta, abra a página em 390 e 1280, registre o projeto em `memoria/projetos/<slug>.md` e responda com o caminho, a nota e `📌 Anotei`.
