---
name: pendencias
description: Lista projetos abertos, próximos passos e lembretes do Marcelo. Use quando ele perguntar "o que falta", "onde paramos" ou "o que tem pra hoje".
allowed-tools:
  - Bash(/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/*)
---
!`/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/report.py --pending`

Ordene por prazo e idade; proponha "a de hoje" (uma só) e ofereça começar. Lembretes vencidos primeiro, em uma linha cada.
