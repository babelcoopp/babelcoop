---
name: evoluir
description: Refino completo do substrato (dedup, índice, grafo, versão, painel) com relatório do que mudou e 3 mutações sugeridas. "major" vira a versão maior (com confirmação); "reparar" refaz derivados.
argument-hint: "[major | reparar]"
disable-model-invocation: true
allowed-tools:
  - Bash(/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/*)
---
Refino completo executado agora:

!`/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/refine.py --full --report`

Sugestões determinísticas do motor:

!`/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/report.py --suggestions`

Modo pedido: "$0"
- vazio → apresente o diff (versão antes → depois, novas, alteradas, superadas, similares, órfãs, tamanho do índice) e as 3 mutações sugeridas; pergunte qual ele quer primeiro; execute só as que não mexem em `.claude/`.
- `major` → pergunte "Confirma virar a versão maior? (motivo em uma frase)". Só depois do "sim" rode `/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/refine.py --major "<motivo>"` e anuncie como marco.
- `reparar` → rode `/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/verify.py --repair` e `/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/rebuild.py`; mostre o que foi consertado.
Lembre que o índice novo só entra no contexto na próxima sessão, `/clear` ou `/compact`.
