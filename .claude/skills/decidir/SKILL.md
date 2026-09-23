---
name: decidir
description: Registra uma decisão com contexto, alternativas, escolha e consequências em memoria/decisoes/. Use sempre que você ou o Theus escolherem um caminho que vale daqui para frente.
argument-hint: "<decisão> — contexto; alternativas; por quê"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - Bash(date)
  - Bash(date *)
---
Decisão: $ARGUMENTS

Se o cabeçalho do índice diz `⏸ PAUSADO`, responda que a memória está pausada e pare.

1. Corpo em quatro partes, uma frase cada: **Contexto:** · **Alternativas:** (as descartadas) · **Escolha:** · **Consequências:**. Se falta uma parte que mudaria a decisão, pergunte uma vez; senão, derive do contexto e marque no corpo "(derivado pelo Ryan)" ao lado da parte derivada. Escolha dita pelo Theus: `source: theus-disse`, `confidence: 0.9`. Escolha que você inferiu: `source: ryan-inferiu`, `confidence: 0.6`.
2. Grep em `memoria/decisoes/` por 2 ou 3 palavras: se esta substitui uma decisão ativa, use `supersedes` e marque a antiga como superada.
3. Grave `memoria/decisoes/AAAA-MM-DD-<slug>.md` (`type: decision`, frontmatter de `.claude/rules/memoria.md`).
4. Decisão de um projeto: acrescente uma linha no `## Histórico` de `memoria/projetos/<slug>.md`.
5. Índice: "Decisões que valem" logo abaixo das fixadas (as fixadas e mais as 5 mais novas) e contagens. Diário, com a hora de `date '+%Y-%m-%d %H:%M'`: `- AAAA-MM-DD HH:MM · decidiu: <título> · <id>`.
6. Responda: `📌 Anotei a decisão: <título> (<id>)`.
