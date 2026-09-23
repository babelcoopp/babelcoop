---
name: origem
description: Mostra o pedido original do Marcelo (o CLAUDE.md de nascimento) e a linha do tempo de como o organismo evoluiu desde então.
disable-model-invocation: true
allowed-tools:
  - Bash(/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/*)
---
!`/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/report.py --origin`

Conte a história em tom de quem lembra do primeiro dia: o que ele pediu, o que virou, a versão de hoje, quantas memórias nasceram, e o que ainda falta do pedido original (compare item por item).
