---
name: sistema
description: Transforma uma ideia em desenho de sistema (problema, quem usa, fluxo, telas, dados, MVP de 1 semana, riscos) em entregas/sistemas/<slug>.md, com protótipo opcional, e registra o projeto. Use para "sistema", "app", "plataforma", "automação".
argument-hint: "<ideia em uma frase>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash(/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/*)
  - Bash(python3 ${CLAUDE_PROJECT_DIR}/motor/*)
  - Bash(open ${CLAUDE_PROJECT_DIR}/entregas/*)
  - Bash(open entregas/*)
---
Ideia: $ARGUMENTS

1. Cruze com o índice (projetos e ideias parecidas) e com o perfil. Reformule a ideia como o problema de quem usa.
2. Escreva `entregas/sistemas/<slug>.md` no formato da regra `entregas-web.md` (leia com Read). Ideia grande → delegue o desenho ao `arquiteto-sistemas` e 3 riscos ao `critico`.
3. Se couber, `entregas/sistemas/<slug>-prototipo.html` com 3–5 telas navegáveis (identidade Babel OS) e `open` nele.
4. Registre o projeto (`remember.py --type project --id <slug> …`) e a decisão de escopo (`/decidir`). Ideia-mãe vira `--type idea` se abrir outras portas.
5. Responda em tom WhatsApp: a metáfora do sistema, o MVP em 3 linhas, o próximo passo e a pergunta de escala ("isso serve para o Reino inteiro ou para um grupo?").
