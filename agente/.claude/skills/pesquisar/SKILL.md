---
name: pesquisar
description: Pesquisa um tema na internet com fontes verificáveis e guarda o resultado em memoria/conhecimento/<tema>/. Use quando o Marcelo pedir "pesquisa", "descobre", "o que tem de mais atual sobre".
argument-hint: "<tema>"
allowed-tools:
  - WebSearch
  - WebFetch
  - Bash(/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/*)
  - Bash(python3 ${CLAUDE_PROJECT_DIR}/motor/*)
---
Tema: $ARGUMENTS

1. `/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/recall.py --search "<tema>" --k 5`: se já houver conhecimento recente (< 30 dias), diga e pergunte se quer atualizar.
2. Pesquisa: 3–6 buscas (pt e en), prioridade para fontes oficiais e datas recentes; abra as 5 fontes mais fortes. Tema grande → agente `pesquisador` ou `/pesquisa-profunda`.
3. Grave: `/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/remember.py --session ${CLAUDE_SESSION_ID} --type knowledge --topic <tema-slug> --title "<título>" --tags pesquisa,<tema> --sources "<url1>|<url2>" --text "<fatos numerados, cada um com a fonte>"`.
4. Responda com os 5 fatos que mais importam para o Marcelo, fontes no fim, e o que ele pode fazer com eles hoje.
