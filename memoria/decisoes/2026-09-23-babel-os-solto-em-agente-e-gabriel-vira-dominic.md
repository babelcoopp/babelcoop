---
id: 2026-09-23-babel-os-solto-em-agente-e-gabriel-vira-dominic
type: decision
title: "Arquivos do babel-os soltos em agente/ e o Gabriel vira Dominic"
tags: [ryan, origem, agente]
confidence: 0.9
status: active
source: theus-disse
created: 2026-09-23
updated: 2026-09-23
supersedes:
superseded_by:
links: [2026-09-23-origem-do-ryan-solta-em-agente, 2026-09-23-memoria-do-ryan-comeca-limpa]
---
**Contexto:** a verificação mostrou que o Gabriel continuava ativo em `agente/babel-os` (CLAUDE.md e 16 skills carregam sozinhos quando alguém trabalha lá). **Alternativas:** renomear para nomes de arquivo que o Claude Code não carrega; apagar a pasta; deixar como estava. **Escolha:** o Theus mandou "renomear para Dominic", "não precisa ter essa pasta, só os arquivos dela" e "deixe solto na pasta": a pasta `babel-os` deixou de existir, os arquivos ficaram soltos em `agente/` e "Gabriel" virou "Dominic" nos arquivos de identidade (CLAUDE.md, LEIA-ME, skills, rules, agentes, painel, índices). **Consequências:** `agente/CLAUDE.md` e as skills `agente:*` seguem carregando para quem trabalhar em `agente/`, e o Ryan não as usa; `settings.json`, `serve.sh` e `data.js` ainda dizem Gabriel, porque o Ryan não edita esses tipos; a memória histórica do Marcelo não foi reescrita.
