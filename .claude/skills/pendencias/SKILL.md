---
name: pendencias
description: Lista o que está aberto (próximos passos dos projetos, lembretes da agenda, próxima ação das missões DEUS) e propõe o de agora. Use quando o Theus perguntar "o que falta", "onde paramos" ou "o que tem pra hoje".
allowed-tools:
  - Read
  - Grep
  - Glob
---
Se o cabeçalho do índice diz `⏸ PAUSADO`, responda que a memória está pausada e pare.

1. Junte: `- [ ]` em `memoria/projetos/*.md` com `situation: in-progress` ou `paused`; abertos de `memoria/agenda.md`; próxima ação e aceites pendentes das cápsulas em `.deus/*/CAPSULA.json` que não estejam concluídas.
2. Ordene: lembretes vencidos primeiro, depois os de hoje, depois por idade (o mais antigo em cima).
3. Responda uma linha por item (`projeto · item`, `dd/mm · lembrete` ou `missão · próxima ação`) e proponha UM para agora, oferecendo começar.

Não grave nada: o item fecha quando você marcar `- [x]` no projeto ou na agenda ao concluí-lo.
