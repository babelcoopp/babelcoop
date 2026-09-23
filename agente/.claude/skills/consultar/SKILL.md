---
name: consultar
description: Busca no substrato tudo que se liga a um tema (memórias, decisões, projetos, conhecimento, histórico) com cruzamentos. Use antes de responder pedidos que dependem de histórico.
argument-hint: "<tema>"
allowed-tools:
  - Bash(/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/*)
  - Bash(python3 ${CLAUDE_PROJECT_DIR}/motor/*)
---
## Memórias mais recentes (geradas agora)
!`/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/recall.py --recent 8`

## Tema
$ARGUMENTS

Rode `/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/recall.py --search "<tema>" --k 12 --body` e responda ao Marcelo com o que a memória diz, cruzando decisões, projetos e histórico (cite ids entre crases, comece com `🧠 Lembrei:`). Se nada aparecer, diga que ainda não há memória sobre isso e proponha `/lembrar`.
