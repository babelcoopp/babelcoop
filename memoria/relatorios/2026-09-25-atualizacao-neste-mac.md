# Atualização neste Mac — 2026-09-25 12:26 -0300

Responsável: [[Dominic]]. Pedido do Theus: atualizar a cópia correta e voltar às decisões do MD.

## Causa e mudança

A pasta inicialmente indicada, `Desktop/Dominic/sistemas/babel-coop`, era antiga. Reempacotá-la conservava a interface antiga. A versão com Tech/Vibe e as evoluções de 24–25/09 estava em `Desktop/Arquivo/babel-coop`, junto de `HISTORICO-2026-09-24-25.md` e `A-FAZER.md`.

A pasta antiga foi preservada integralmente em `/private/tmp/babel-coop-antes-atualizacao-20260925-1218`. A nova foi copiada inteira, incluindo arquivos ocultos, para o caminho original de trabalho. A origem em Arquivo permaneceu preservada. Os dados existentes em `~/BabelCoop` não foram substituídos.

## Entrega e evidência desta sessão

- `npm run empacotar`: concluído em 25,6 s, Electron 44.4.5, arm64. Primeira tentativa teve bloqueio de rede; repetição com autorização concluiu.
- App: `app/dist/mac-arm64/babel-coop.app` (281,6 MB).
- DMG: `app/dist/babel-coop-0.1.0-arm64.dmg` (129,3 MB).
- SHA256 do DMG: `c092a14de85a14909538eea394321ee14e969e966a0a7262e0a82b532e44a355`.
- Empacotador confirmou assinatura ad hoc com `codesign --verify --deep --strict`, ausência de quarentena local, conteúdo e fuse RunAsNode.
- Comparações `diff -rq` sem diferenças: protótipo da origem versus cópia de trabalho; protótipo de trabalho versus app; interface, servidor e navegador versus conteúdo extraído do app.asar (excluídos .DS_Store e mapas conforme o empacotamento).
- `cmp` de main.js, preload.js e ponte.js versus app.asar: todos código 0.
- App aberto pelo caminho completo acima. Árvore de acessibilidade da janela `babel-coop`, URL `localhost:4711/`, confirmou os botões Tech e Vibe, a Estação e a equipe de Theus.
- Não foi executada novamente a bateria de testes funcional descrita no MD original; seus números são históricos. O app gerado não tem notarização Apple e a ausência de quarentena neste Mac não garante ausência de aviso no destinatário.

## Próximo passo com Theus

Revisar D1–D9 do histórico e de A-FAZER.md. Depois: dois computadores, QR para celular/iPad, combinado da equipe; demonstrar Máquina e medir CPU; parte 2 da Máquina; Windows. Nenhuma dessas decisões foi resolvida automaticamente. Sem commit ou push nesta entrega.
