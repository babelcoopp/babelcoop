---
name: pesquisa-profunda
description: Varredura paralela de um tema em vários ângulos, verificação cruzada das fontes e síntese gravada em memoria/conhecimento/. Use quando o Theus pedir "pesquisar a fundo", "descobrir tudo sobre" ou comparar opções.
argument-hint: "<tema>"
disable-model-invocation: true
---
Tema: $ARGUMENTS

Se o cabeçalho do índice diz `⏸ PAUSADO`: rode a pesquisa, não grave nada em `memoria/` e avise numa linha que nada foi anotado.

O Theus pediu uma orquestração. Rode a ferramenta Workflow com um script escrito na hora (inline, nunca gravado em arquivo), passando a data de hoje em `args`, nesta receita:

1. **Ângulos:** um agente com saída estruturada `{angulos: string[]}` propõe de 4 a 6 ângulos distintos: fontes oficiais e números · prática e casos · críticas e riscos · concorrentes e referências · Brasil · onde isso entra no Babel Coop. Sem resposta válida, use os quatro primeiros.
2. **Varredura:** um agente `pesquisador` por ângulo, em paralelo: fatos numerados, cada um com URL e data.
3. **Verificação:** em pipeline, um agente por varredura marca cada fato como confirmado (2 ou mais fontes), único (1 fonte) ou contraditório, e corrige datas.
4. **Síntese:** um agente escreve 10 fatos que importam, 3 oportunidades, 3 riscos, as lacunas e as fontes.

Registre com `log()` o que for cortado (ângulos ou fontes descartados). Nenhum agente grava em `memoria/`. Com a síntese, você grava `memoria/conhecimento/<tema-slug>/AAAA-MM-DD-<slug>.md` (`type: knowledge`, `source: pesquisa`, `sources` com as URLs), atualiza índice e diário e responde com o essencial e `📌 Anotei`.
