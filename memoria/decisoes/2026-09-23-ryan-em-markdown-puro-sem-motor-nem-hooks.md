---
id: 2026-09-23-ryan-em-markdown-puro-sem-motor-nem-hooks
type: decision
title: "Ryan em Markdown puro: sem motor, hooks, settings nem painel"
tags: [ryan, arquitetura, memoria]
confidence: 0.9
status: active
source: theus-disse
created: 2026-09-23
updated: 2026-09-23
supersedes:
superseded_by:
links: [2026-09-23-ryan-nasce-na-raiz-mesclando-deus-e-organismo]
---
**Contexto:** o organismo de origem roda sobre um motor Python (17 scripts), um hook único em 16 eventos, `settings.json`, workflows `.js` e um painel gerado; as regras globais do Theus negam ao agente ler e escrever `.py`, escrever `.js`, `.sh` e `settings*.json`, e rodar `python3` ou `node`. **Alternativas:** copiar só o Markdown e corrigir depois; o Theus copiar o motor por conta própria. **Escolha:** Markdown puro: o Ryan mantém a memória com Read, Write, Edit, Glob e Grep seguindo `.claude/rules/memoria.md`; os workflows viram receitas em skills; o motor Python de `agente/babel-os` é apagado ao completar a montagem (ordem do Theus). **Consequências:** nada é registrado sozinho, não há status line nem painel, o índice só entra no contexto em sessão nova, `/clear` ou `/compact`, e o histórico de versões fica no git.
