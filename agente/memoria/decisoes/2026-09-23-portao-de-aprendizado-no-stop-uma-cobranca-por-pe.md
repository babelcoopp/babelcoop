---
id: 2026-09-23-portao-de-aprendizado-no-stop-uma-cobranca-por-pe
type: decision
title: "Portão de aprendizado no Stop: uma cobrança por pedido, desligável"
tags: [babel-os, conversa, decisao, decision, entrega, esquece, memoria]
confidence: 0.9
status: active
source: marcelo-said
session: 7f804fee
pinned: false
created: "2026-09-23T00:13:04-03:00"
updated: "2026-09-23T00:13:04-03:00"
version: 1
hash: 717d9409b4641abea0ccb992c7b4f507a85e6af9890c9d252afc21616d6a6041
---
**Contexto:** o Marcelo pediu um organismo que evolui a cada pedido e não esquece nada. **Alternativas:** confiar só na persona; bloquear todo Stop; registrar por hook sem LLM. **Escolha:** os hooks registram tudo sozinhos (prompts, ferramentas, sessões, compactações, relatórios) e, se um pedido mudou arquivos de entrega sem nenhuma memória nova, o Stop cobra UMA vez (decision block), aceitando 'nada novo a registrar'; ligável em memoria/config.json (learning_gate). **Consequências:** evolução determinística sem prender a conversa.
