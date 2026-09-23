---
name: pausar
description: Liga ou desliga a pausa do organismo (cria/remove o arquivo PAUSA na raiz). Com PAUSA, todos os hooks viram no-op e a status line avisa.
disable-model-invocation: true
allowed-tools:
  - Bash(/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/*)
---
!`/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/pause.py --toggle`

Confirme ao Marcelo em uma linha o estado novo (pausado ou ativo) e o que muda: pausado = nada é registrado nem recuperado até ele tirar a pausa; o Dominic continua respondendo normalmente.
