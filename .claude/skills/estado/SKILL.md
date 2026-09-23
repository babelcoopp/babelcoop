---
name: estado
description: Mostra os sinais vitais do Ryan (versão, geração, memórias, decisões, projetos, pendências, lembretes, missão DEUS, tamanho do índice) e avisa o que está fora do contrato. Use quando o Theus perguntar como o Ryan está ou o que mudou.
allowed-tools:
  - Read
  - Grep
  - Glob
---
Leia só o necessário, com Glob, Grep e Read:

1. Cabeçalho de `memoria/INDICE.md`: versão, geração, estado (ativo ou pausado) e número de linhas (teto 150).
2. Conte: memórias ativas (`^status: active` em `memoria/memorias/`, `memoria/decisoes/` e `memoria/conhecimento/`), superadas, projetos por `situation`, pendências `- [ ]` nos projetos abertos, lembretes abertos em `memoria/agenda.md` e os vencidos (data anterior a hoje).
3. Missão DEUS: a do índice; confira em `.deus/*/CAPSULA.json` se o estado bate.
4. Avisos, só os que existirem: contagem do cabeçalho diferente da real; arquivo sem frontmatter ou com `id` diferente do nome; `supersedes`, `superseded_by`, `[[id]]` ou linha do índice que apontam para um id que não existe; projeto aberto sem próximo passo; lembrete vencido; índice acima de 150 linhas; última linha do diário com mais de 7 dias.
5. Responda em até 8 linhas: os números, a missão, cada aviso com o que fazer (`/evoluir reparar` refaz o índice) e a pendência mais antiga como próximo passo.

Não grave nada.
