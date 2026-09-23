---
name: sistema
description: Transforma uma ideia em desenho de sistema (problema, quem usa, fluxo, telas, dados, integrações, MVP, riscos, métricas) em entregas/sistemas/<slug>.md, com protótipo opcional, e registra o projeto. Use para "sistema", "app", "plataforma", "automação".
argument-hint: "<ideia em uma frase>"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - Bash(open entregas/*)
  - Bash(date)
  - Bash(date *)
---
Ideia: $ARGUMENTS

Se o cabeçalho do índice diz `⏸ PAUSADO`: faça o desenho sem consultar nem registrar memória e avise numa linha.

1. Consulte a memória (`/consultar` a ideia: projetos e ideias parecidas) e o que o Babel Coop já tem sobre ela (`IDEIAS.md`, `docs/FUNCOES.md`). Reformule como o problema de quem usa.
2. Escreva `entregas/sistemas/<slug>.md` no formato de `.claude/rules/entregas.md`. Ideia grande: desenho pelo `arquiteto-sistemas` e 3 riscos pelo `critico`.
3. Se couber, `entregas/sistemas/<slug>-prototipo.html` com 3 a 5 telas navegáveis na identidade do Babel Coop, e abra.
4. Registre o projeto (`memoria/projetos/<slug>.md`) e a decisão de escopo (`/decidir`). Ideia-mãe que abre outras portas: `/lembrar` como `idea`.
5. Responda: o MVP em 3 linhas, onde ele entra no Babel Coop e o próximo passo.
