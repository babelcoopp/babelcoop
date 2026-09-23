---
id: 2026-09-23-um-unico-hook-claude-hooks-hook-py-atende-os-16-e
type: decision
title: Um único hook (.claude/hooks/hook.py) atende os 16 eventos
tags: [alternativa, babel-os, consequencia, contexto, decisao, decision, hooks]
confidence: 0.95
status: active
source: marcelo-said
session: 7f804fee
pinned: false
created: "2026-09-23T00:13:04-03:00"
updated: "2026-09-23T00:13:04-03:00"
version: 1
hash: f9e395742bbd73d46808faa188d54d9df219e275741fd2923bc8a0bf644e1253
---
**Contexto:** hooks têm regras de saída rígidas (stdout vazio ou um único JSON; Stop trava com additionalContext; SessionEnd tem 1,5 s). **Alternativas:** 11 scripts separados ou um despachante. **Escolha:** um gancho só, exec form com /usr/bin/python3, despacho por hook_event_name, toda exceção vira exit 0 + errors.jsonl, PAUSA desliga tudo. **Consequências:** um lugar para testar (selftest cobre os 16 eventos) e zero hook error para o Marcelo.
