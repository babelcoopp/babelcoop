---
name: painel
description: Atualiza o painel de evolução do Dominic e explica como abri-lo na lateral do VS Code, com fallback por servidor local.
disable-model-invocation: true
allowed-tools:
  - Bash(/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/*)
  - Bash(bash ${CLAUDE_PROJECT_DIR}/dashboard/serve.sh)
  - Bash(bash ${CLAUDE_PROJECT_DIR}/dashboard/serve.sh *)
---
!`/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/report.py --panel`

Acima: o caminho `file://` do painel, a idade dos dados e se o servidor 8765 está de pé. Explique em 4 passos: (1) `Cmd+Shift+P` → "Browser: Open Integrated Browser"; (2) colar o caminho `file://`; (3) a aba abre ao lado (o VS Code dele já tem `newTabPlacement: sideGroup`); (4) atualiza sozinho a cada refino. Se der "Forbidden" (403): o VS Code está em Modo restrito — clique em "Confiar" na faixa (ou `Cmd+Shift+P` → "Workspaces: Gerenciar Workspace Trust"); esse trust é do VS Code, diferente do do Claude Code. Se continuar em branco: `bash ${CLAUDE_PROJECT_DIR}/dashboard/serve.sh` e mande abrir a URL `http://127.0.0.1:8765/dashboard/` que o script imprime.
