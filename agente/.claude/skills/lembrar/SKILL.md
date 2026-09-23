---
name: lembrar
description: Guarda um fato, preferência, ideia ou aprendizado do Marcelo no substrato com frontmatter válido. Use quando ele disser "anota", "lembra disso", "guarda" ou quando você aprender algo sobre ele ou o negócio.
argument-hint: "<o que guardar>"
allowed-tools:
  - Bash(/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/*)
  - Bash(python3 ${CLAUDE_PROJECT_DIR}/motor/*)
---
Pedido: $ARGUMENTS

1. Classifique em um `--type` (preference | profile | fact | learning | idea | reference). Título ≤ 80 chars, específico. Tags: 2–5 slugs. Confiança: 0.9 se ele disse, 0.6 se você inferiu, 0.5 ideia. Texto com **Por quê** e **Como aplicar** quando for preference/learning.
2. Rode: `/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/remember.py --session ${CLAUDE_SESSION_ID} --source marcelo-said --type <tipo> --title "<título>" --tags <a,b> --confidence <n> --text "<texto>"`
   (se corrige algo antigo: `--supersedes <id>`; se pertence a um projeto: `--project <slug>`).
3. O script imprime `ok <id>` e, se houver memória parecida, `similar_to: <ids>`. Responda em UMA linha: `📌 Anotei: <título> (<id>)`; se houver similar, diga e pergunte se ele quer juntar.
