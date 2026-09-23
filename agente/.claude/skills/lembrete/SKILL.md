---
name: lembrete
description: Guarda um lembrete com data (ex. "/lembrete 25/09 cobrar o Diego"); ele volta na abertura de cada sessão. Use quando o Marcelo pedir para lembrar de algo em uma data.
argument-hint: "<quando> <texto>"
allowed-tools:
  - Bash(/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/*)
  - Bash(python3 ${CLAUDE_PROJECT_DIR}/motor/*)
---
Pedido: $ARGUMENTS

1. Separe a data do texto: a primeira palavra é a data ("hoje", "amanhã", "sexta", "25/09", "2026-09-25"); o resto é o texto. Converta para `AAAA-MM-DD` (hoje é a data do sistema; dias da semana = o próximo).
2. Rode `/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/agenda.py new --session ${CLAUDE_SESSION_ID} --when <AAAA-MM-DD> --text "<texto>"`.
3. Responda: "✅ Anotado para <dd/mm>. Eu te lembro quando você abrir o Dominic naquele dia ou depois; alarme fora daqui eu não tenho (o /loop morre quando a sessão fecha)".
