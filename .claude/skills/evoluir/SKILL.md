---
name: evoluir
description: Refino completo da memória. Reconstrói o índice a partir dos arquivos, acha duplicatas, órfãs e o que está fora do contrato, sobe a geração e sugere 3 mutações. "major" sobe a versão (com confirmação); "reparar" só conserta o índice e os campos quebrados.
argument-hint: "[major | reparar]"
disable-model-invocation: true
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - Bash(date)
  - Bash(date *)
---
Modo: "$ARGUMENTS" (vazio = refino normal)

Se o cabeçalho do índice diz `⏸ PAUSADO`, responda que a memória está pausada e pare.

1. Varra `memoria/` com Glob e leia o frontmatter de cada arquivo (Grep por `^(id|type|title|status|confidence|created|situation|supersedes|superseded_by|pinned):`).
2. Diagnóstico: `id` diferente do nome do arquivo; campo obrigatório faltando; `supersedes`, `superseded_by` ou `[[id]]` que apontam para o nada; pares com título ou tags quase iguais (candidatos a juntar); memória ativa sem ligação e sem projeto (órfã); projeto aberto sem próximo passo; lembrete vencido.
3. Reconstrua `memoria/INDICE.md` do zero pela tabela de `.claude/rules/memoria.md`: cada seção a partir da sua fonte (Theus do `summary` do perfil; Missão DEUS das cápsulas em `.deus/*/`; Pendências dos projetos abertos e da agenda), na ordem, nos limites e com as contagens reais. Preserve a linha `Estado:`.
4. Modo vazio: suba a geração em 1. Mostre o antes e o depois (contagens, linhas do índice, o que entrou e saiu), o diagnóstico e 3 mutações sugeridas (o quê, por quê, esforço). Aplique só as que não mexem em `.claude/`, e juntar ou superar memórias só com o ok do Theus.
5. `major`: rode os passos 1 a 4 e pergunte "Confirma virar a versão maior? Motivo em uma frase." Só com o sim: suba o número do meio da versão (v0.1.x → v0.2.0), registre com `/decidir` e anuncie como marco. A geração sobe 1, como no modo vazio.
6. `reparar`: os passos 1 a 3, a correção de campos quebrados e o passo 7, sem mudar corpos nem apagar nada, e sem mexer na geração nem na versão; diga o que foi consertado.
7. Diário, com a hora de `date '+%Y-%m-%d %H:%M'`: `- AAAA-MM-DD HH:MM · evoluiu: geração N (ou vX.Y.Z, ou reparo) · resumo`.

O índice novo só entra no contexto em sessão nova, `/clear` ou `/compact`.
