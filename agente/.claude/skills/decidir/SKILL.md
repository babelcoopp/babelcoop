---
name: decidir
description: Registra uma decisão com contexto, alternativas, escolha e consequências. Use sempre que você ou o Marcelo escolherem um caminho.
argument-hint: "<decisão> — contexto; alternativas; por quê"
allowed-tools:
  - Bash(/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/*)
  - Bash(python3 ${CLAUDE_PROJECT_DIR}/motor/*)
---
Decisão: $ARGUMENTS

Escreva o corpo no formato **Contexto** / **Alternativas** / **Escolha** / **Consequências** (1 frase cada) e rode:
`/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/remember.py --session ${CLAUDE_SESSION_ID} --type decision --title "<frase da decisão>" --tags decisao,<projeto> --confidence 0.9 --text "<corpo>"`
Responda em uma linha: `📌 Anotei a decisão: <título> (<id>)`.
