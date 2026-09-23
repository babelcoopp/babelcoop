---
id: 2026-09-23-node-e-javascript-liberados-para-construir
type: decision
title: "Node e JavaScript liberados para construir o Babel Coop; Python segue proibido"
tags: [ryan, permissoes, babel-coop]
confidence: 0.9
status: active
source: theus-disse
created: 2026-09-23
updated: 2026-09-23
supersedes:
superseded_by:
links: [2026-09-23-ryan-em-markdown-puro-sem-motor-nem-hooks]
---
**Contexto:** o app do Babel Coop é Electron + Node, e as regras globais do Theus negavam `node`, `npm`, `npx` e escrever `.js`/`.ts`, então o código de `app/` nunca tinha rodado. **Alternativas:** app 100% no navegador com um servidor só; peças prontas (tmux/ttyd); cortar o escopo; construir na nuvem (Claude Code na web ou Cowork). **Escolha:** seguir o plano normal; o Theus rodou ele mesmo o comando que tirou 6 regras do `deny` (`Bash(node*)`, `Bash(*/bin/node*)`, `Bash(npx*)`, `Bash(npm*)`, `Write(**/*.js)`, `Write(**/*.ts)`), deixando 53; cópia em `~/.claude/settings.json.antes-ryan`. **Consequências:** o Ryan pode programar e rodar o app; Python, `.sh`, `bun`, `pip`, `make`/`cc`/`clang` e `./script` continuam bloqueados, e compilar pacote nativo só com ok do Theus; a memória continua em Markdown.
