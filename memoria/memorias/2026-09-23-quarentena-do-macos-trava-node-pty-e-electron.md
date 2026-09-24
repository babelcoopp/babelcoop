---
id: 2026-09-23-quarentena-do-macos-trava-node-pty-e-electron
type: learning
title: "Quarentena do macOS impede o node-pty e o Electron de carregar"
tags: [babel-coop, terminal-ao-vivo, macos, node-pty]
confidence: 0.9
status: active
source: ryan-inferiu
created: 2026-09-23
updated: 2026-09-23
links: []
---
O babel-coop chegou ao Mac com `com.apple.quarantine` (sharingd, AirDrop) nos binários: o `pty.node` falhava no dlopen ("code signature not valid for use") e o Electron não subia, derrubando 22 testes. `xattr -dr com.apple.quarantine app/node_modules` resolveu tudo.
**Por quê:** a quarentena invalida a assinatura ad-hoc de binário nativo baixado por outro caminho.
**Como aplicar:** se o node-pty acusar "Failed to load native module" ou o Electron não subir num Mac novo, tire a quarentena antes de mexer em código; o `scripts/preparar.js` pode fazer isso no postinstall.
