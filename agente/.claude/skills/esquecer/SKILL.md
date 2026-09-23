---
name: esquecer
description: Marca uma memória como superada (nunca apaga) e, se houver correção, cria a versão nova ligada à antiga.
argument-hint: "<id ou trecho do título> [correção]"
disable-model-invocation: true
allowed-tools:
  - Bash(/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/*)
---
Pedido: $ARGUMENTS

1. Se "$0" não for um id existente, rode `/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/recall.py --search "$0" --k 3 --ids` e confirme com o Marcelo qual é.
2. Sem correção: `/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/correct.py --session ${CLAUDE_SESSION_ID} --forget <id> --reason "pedido do Marcelo"`.
   Com correção: `/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/correct.py --session ${CLAUDE_SESSION_ID} --supersede <id> --text "<correção>"`.
3. Responda: "🧠 Marquei como superada; a versão nova é <id-novo>" (ou só a primeira parte).
