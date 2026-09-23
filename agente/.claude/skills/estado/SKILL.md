---
name: estado
description: Mostra os sinais vitais do organismo Dominic (versão, geração, memórias, pendências, saúde, custo de contexto, avisos). Use quando o Marcelo perguntar como você está ou o que mudou.
allowed-tools:
  - Bash(/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/*)
---
Estado atual do organismo (gerado agora pelo motor):

!`/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/report.py --state`

Resuma para o Marcelo em até 8 linhas, estilo WhatsApp, com uma metáfora de crescimento (planta, time, cidade). Se houver avisos, explique cada um e o que fazer. Feche com um próximo degrau (pendência mais antiga ou projeto parado).
