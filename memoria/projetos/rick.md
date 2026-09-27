---
id: rick
type: project
title: "Rick: agente de LP e sistema WebGL em pacote, ligado à Replicate e à fal"
summary: "Agente de LP e LLM-as-OS em WebGL puro, com Replicate e fal.ai conectadas"
tags: [rick, agente, replicate, fal, webgl]
confidence: 0.9
status: active
source: repositorio
situation: in-progress
files: [~/Rick/, .claude/agents/rick.md]
created: 2026-09-27
updated: 2026-09-27
---
## Situação
Mora em `~/Rick/`, a casa própria dele, com `CLAUDE.md` de identidade, ferramentas, docs, tarefas, assets e entregas. Aqui no repositório fica só `.claude/agents/rick.md`, que aponta para lá.

Criado em 27/09/2026 a partir de `~/Rick/docs/PROMPT-AGENTICO.md` e `~/Rick/docs/DIFERENCA-FRAMES-E-WEBGL.md`. As chaves ficam em `~/.config/babel/replicate.env` e `~/.config/babel/fal.env` ([redigido]).

Conferência das conexões (grátis):
- Replicate: conta `theusveyra`, HTTP 200.
- fal.ai: chave válida (HTTP 200; chave falsa dá 401), com escopo API, sem leitura de saldo.

Testes: 14/14 sem rede. `claude -p --agent rick` carregou o agente e rodou a conexão. Nenhuma geração paga foi feita.

## Próximos passos
- [ ] primeira geração paga de teste, com ok de gasto (ex.: `~/Rick/exemplos/tarefa-fal.exemplo.json`, US$ 0,003)
- [ ] `prototipo/observatorio-webgl.html`, citado no prompt como runtime de referência, não existe no repositório: trazer ou construir

## Histórico
- 2026-09-27 12:07 — Rick criado: `.claude/agents/rick.md`, `rick/rick.mjs` (conexão, busca, schema, preço, fal pela fila, repasse à Replicate) e `rick/pacote.mjs` (validador do §6). `gera-replicate.mjs` ganhou `cancelar_apos` → `Cancel-After`.
- 2026-09-27 12:12 — casa própria em `~/Rick/` (pedido do usuário): `rick/` saiu do repositório (não tinha commit); `gera-replicate.mjs` copiado para lá; o agente daqui virou atalho.
