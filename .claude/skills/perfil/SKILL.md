---
name: perfil
description: Mostra o que o Ryan sabe sobre o Theus (perfil e preferências registradas) e até 3 perguntas do que ainda quer aprender. Use quando ele perguntar "o que você sabe de mim" ou para calibrar como trabalhar com ele.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write
  - Edit
---
Se o cabeçalho do índice diz `⏸ PAUSADO`, responda que a memória está pausada e pare.

1. Leia `memoria/perfil/theus.md` e as memórias ativas `type: preference` e `type: profile` (Grep em `memoria/memorias/`).
2. Apresente em três blocos curtos: **Quem você é para mim** · **Como você gosta de trabalhar** (cada item com o id ou a fonte) · **O que ainda quero aprender** (as até 3 perguntas da seção do perfil).
3. Se o Theus responder uma pergunta: grave com `/lembrar` (`type: profile` ou `preference`, `source: theus-disse`), atualize a seção certa de `memoria/perfil/theus.md`, tire a pergunta respondida, acrescente uma linha em "Mudanças" e ajuste o `summary`.

Nunca invente traço de personalidade: só o que tem fonte.
