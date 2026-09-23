---
name: lembrar
description: Guarda um fato, preferência, ideia, aprendizado ou referência em memoria/ seguindo o contrato. Use quando o Theus disser "anota", "lembra disso", "guarda", ou quando você aprender algo estável sobre ele, a equipe ou o projeto.
argument-hint: "<o que guardar>"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - Bash(date)
  - Bash(date *)
---
Pedido: $ARGUMENTS

Se o cabeçalho do índice diz `⏸ PAUSADO`, responda que a memória está pausada e pare.

1. Classifique o `type`: `preference` · `profile` · `fact` · `learning` · `idea` · `reference`. Decisão vai para `/decidir`, pesquisa para `/pesquisar`, projeto para `memoria/projetos/<slug>.md`. Título específico de até 80 caracteres, 2 a 5 tags, confiança (0.9 dito · 0.6 inferido · 0.5 ideia) e `source` (`theus-disse` quando veio dele).
2. Procure duplicata: Grep em `memoria/` por 2 ou 3 palavras do título. Achou fato ativo parecido? Mostre o id e pergunte se é correção (grava com `supersedes`) ou fato novo.
3. Grave `memoria/memorias/AAAA-MM-DD-<slug>.md` com o frontmatter de `.claude/rules/memoria.md` e o corpo em 1 a 3 frases (`preference` e `learning` com **Por quê** e **Como aplicar**). Se corrige outra, marque a antiga: `status: superseded`, `superseded_by: <id-novo>`, `updated`.
4. `profile` estável: acrescente também em `memoria/perfil/theus.md` (seção certa + linha em "Mudanças") e mantenha o `summary` do frontmatter atual.
5. Índice: a linha `- [tipo confiança] Título (id)` entra em "Memórias recentes" logo abaixo das fixadas (as fixadas e mais as 8 mais novas; o excedente sai do fim e conta em "Fora do índice"); ajuste as contagens do cabeçalho pelas definições do contrato. Diário, com a hora de `date '+%Y-%m-%d %H:%M'`: `- AAAA-MM-DD HH:MM · lembrou: <título> · <id>` em `memoria/diario/AAAA-MM.md`.
6. Responda em uma linha: `📌 Anotei: <título> (<id>)`.
