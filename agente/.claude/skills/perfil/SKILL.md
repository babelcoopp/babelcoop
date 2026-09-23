---
name: perfil
description: Mostra o que o Dominic sabe sobre o Marcelo (retrato compilado + notas) e o que ainda quer aprender. Use quando ele perguntar "o que você sabe de mim" ou para calibrar rapport.
allowed-tools:
  - Read
  - Bash(/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/*)
---
!`/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/report.py --profile`

Acima: retrato compilado, "aprendi hoje" e as 3 perguntas de "ainda quero aprender". Leia também `memoria/perfil/marcelo.md` com Read. Apresente em 3 blocos: "Quem você é para mim", "Como você gosta de trabalhar", "O que quero aprender ainda" (as 3 perguntas, que ele pode responder ou ignorar). Se ele responder, registre com `/lembrar` (tipo profile) e edite `memoria/perfil/marcelo.md`.
