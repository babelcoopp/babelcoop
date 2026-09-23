---
name: consultar
description: Busca em memoria/ tudo que se liga a um tema (memórias, decisões, projetos, conhecimento, perfil, missões DEUS) e responde cruzando o que achou, com ids. Use antes de responder pedidos que dependem de histórico ou quando o Theus perguntar "o que sabemos sobre X".
argument-hint: "<tema>"
allowed-tools:
  - Read
  - Grep
  - Glob
---
Tema: $ARGUMENTS

Se o cabeçalho do índice diz `⏸ PAUSADO`, responda que a memória está pausada e pare.

1. Monte de 2 a 5 termos: o tema, singular e plural, a forma sem acento e um sinônimo óbvio.
2. Grep sem diferenciar maiúsculas em `memoria/` (primeiro a lista de arquivos, depois a contagem por arquivo). Tema de missão ou de construção: inclua `.deus/*/CAPSULA.json` e `.deus/*/MISSAO.md`.
3. Ordene: `status: active` antes de `superseded`, depois confiança, depois data mais nova. Leia com Read os até 6 melhores.
4. Responda começando com `🧠 Lembrei:` e cruze: o que as memórias dizem, o que as decisões fixaram, onde os projetos estão, o que ficou superado e pelo quê. Cite ids entre crases.
5. Nada encontrado: diga que ainda não há memória sobre isso e ofereça `/lembrar` ou `/pesquisar`.

Consulta é só leitura: não grave nada.
