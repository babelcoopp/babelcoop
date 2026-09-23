---
id: 2026-09-23-app-sem-google-chrome-navegador-proprio
type: preference
title: "O babel-coop não mostra nem abre o Google Chrome: tem navegador próprio"
tags: [babel-coop, navegador, terminal]
confidence: 0.9
status: active
source: theus-disse
created: 2026-09-23
updated: 2026-09-23
supersedes:
superseded_by:
links: [2026-09-23-o-nome-e-babel-coop-minusculo, 2026-09-23-terminal-nasce-no-design-2030]
---
O Theus viu o Chrome dos testes do Playwright e disse que não quer "nenhum aviso de navegador google chrome" no app. O app tem navegador próprio, que a IA do terminal comanda inteiro: navega, clona e vai "até o osso do código" (CHECKLIST §3, Navegador do agente: `<webview>` + conector `coop` sobre webContents/CDP, sem Playwright).

**Por quê:** o produto é um app nativo com navegador dentro. Chrome aparecendo passa a ideia de coisa emprestada ou de teste.

**Como aplicar:** o app nunca chama o Chrome. Link externo abre numa janela de navegador do próprio app, não em `shell.openExternal`. Os testes rodam em janelas escondidas do Electron e não usam o Chrome do Playwright MCP. O navegador do agente fica no próprio app, e as ferramentas dele passam pelo `coop`.
