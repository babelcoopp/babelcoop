---
id: 2026-09-23-substrato-motor-painel-e-entregas-ficam-fora-de-c
type: decision
title: "Substrato, motor, painel e entregas ficam fora de .claude/"
tags: [arquitetura, babel-os, dashboard, decisao, decision, evolui, painel]
confidence: 0.95
status: active
source: marcelo-said
session: 7f804fee
pinned: false
created: "2026-09-23T00:13:04-03:00"
updated: "2026-09-23T00:13:04-03:00"
version: 1
hash: 83a42950c54984cc4d23fa53b27c66f00b19306c53507be40540084370014483
---
**Contexto:** a pasta .claude/ é caminho protegido no Claude Code 2.1.280 (toda escrita passa pelo classificador ou por prompt). **Alternativas:** guardar a memória em .claude/memoria (proposta descartada) ou fora. **Escolha:** memoria/, motor/, dashboard/, entregas/, planos/ e backups/ na raiz; em .claude/ só settings, hook, rules, skills, agentes e workflows. **Consequências:** o organismo evolui todo dia sem pedir permissão; mexer no sistema nervoso (.claude/) continua sendo cerimônia.
