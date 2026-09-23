---
id: 2026-09-23-painel-gerado-do-template-com-dados-inline-e-snap
type: decision
title: Painel gerado do template com dados inline e snapshots em backups/ na raiz
tags: [babel-os, backup, backups, dashboard, decisao, decision, dentro, fora]
confidence: 0.9
status: active
source: marcelo-said
session: 7f804fee
pinned: false
created: "2026-09-23T00:13:05-03:00"
updated: "2026-09-23T00:13:05-03:00"
version: 1
hash: b0f374a4c6b3f37e97f262e754e58d1552c031676f4c85c79717693ed3f2a932
---
**Contexto:** o navegador integrado do VS Code recarrega file:// só quando o próprio index.html muda e bloqueia fetch() local; um rm -rf memoria levaria substrato e cópias juntos. **Alternativas:** data.js só com polling; snapshots dentro de memoria/. **Escolha:** panel.py regrava dashboard/index.html atomicamente com window.BABEL inline (mais polling de data.js como redundância); snapshots tar.gz em backups/ fora de memoria/, com rotação 60 dias + 1/mês. **Consequências:** o painel atualiza sozinho na lateral do VS Code e a memória sobrevive ao pior caso.
