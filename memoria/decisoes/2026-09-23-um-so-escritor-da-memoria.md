---
id: 2026-09-23-um-so-escritor-da-memoria
type: decision
title: "Um só escritor da memória: subagentes devolvem, o Ryan grava"
tags: [ryan, memoria, subagentes]
confidence: 0.8
status: active
source: ryan-inferiu
created: 2026-09-23
updated: 2026-09-23
supersedes:
superseded_by:
links: [2026-09-23-ryan-em-markdown-puro-sem-motor-nem-hooks]
---
**Contexto:** no babel-os o motor serializava as escritas (locks) e os subagentes gravavam pela linha de comando; sem motor, vários agentes editando `INDICE.md` ao mesmo tempo perderiam atualizações. **Alternativas:** cada subagente grava o próprio arquivo; um lock em Markdown. **Escolha:** subagentes e workflows só leem a memória e devolvem relatório; o Ryan principal grava memórias, índice e diário. **Consequências:** nenhuma escrita concorrente em `memoria/`; o relatório inteiro, quando vale guardar, vai para `memoria/relatorios/` pelo Ryan.
