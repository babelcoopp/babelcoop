# Entrega · babel-coop/terminal-ao-vivo

**Estado: entregue no Mac em 24/09/2026 (revisão 12).** O Windows (A0 e A29) depende do CI que roda no push.

## O que existe
- **App nativo instalado:** `/Applications/babel-coop.app`, aberto e servindo na porta 4711 com `terminalReal: true`. Na primeira abertura ele mostra a tela de boas-vindas, onde o Theus funda a equipe com o nome dele. O app começa limpo, só com essa conta.
- **Instaladores:** `app/dist/babel-coop-0.1.0-arm64.dmg` (120 MB) e `app/dist/mac-arm64/babel-coop.app` (260 MB), com assinatura ad hoc e sem quarentena. O `.exe` sai do job `instaladores` do `.github/workflows/terminal-pty.yml`. O guia está em `COMO-INSTALAR.md`.
- **Código:** `app/` (Electron, servidor, conector coop e navegador próprio) e `prototipo/` (a interface servida no app real).

## Como reproduzir
```
cd app
npm install                       # postinstall tira a quarentena do node-pty e do Electron (Mac)
npm start                         # a Estação em janela própria
npm run teste                     # servidor: 88 passam, 1 pulado (o que chama o claude pago)
npm run teste:e2e                 # Electron escondido: 108 testes
node testes/roteiro-prototipo.js  # roteiro do protótipo, headless: 109/109
node testes/e2e/auditar-faltas.js # mede as faltas no app limpo
npm run empacotar && npm run teste:pacote && npm run teste:instalar
BABEL_TESTE_CLAUDE=1 node --test testes/e2e/integracao-real.test.js   # claude real (haiku), custa pedidos
```

## Selo, critério por critério (prova de 24/09/2026)
| # | Estado | Prova atual |
|---|---|---|
| A0 | Mac ✔ · Windows no CI | pacote.test: o pty abre de dentro do .app; painel A13: `claude` roda no terminal. No Windows, `terminal-pty.yml` roda depois do push. |
| A1–A4 | ✔ | painel.test.js 12/12: zsh real, 2 abas com PIDs diferentes, fundo `#060b16` com degradê e b neon, `pwd` na pasta compartilhada. |
| A5–A12 | ✔ | equipe.test.js 10/10 e parede.test.js 8/8, com duas Estações: transmissão, controle, permissões no servidor do dono, selo, pausa, nada em disco. Latência p95 de 3,46 ms. |
| A13 | ✔ | painel A13: `claude --version` e o claude interativo dentro do xterm. |
| A14 | ✔ | Roteiro do protótipo 109/109 e casca 2030. |
| A15/A17 | ✔ | painel A15/A17: estados reais pelo pty, pulso, tique, sons e reduced-motion. |
| A16 | ✔ | Parede com glow na cor da pessoa e selo com anel pulsando (evidencias/w7/brilho). |
| A18 | ✔ | 5 manifestos em `docs/design/assets/raw/*/2026-09-23/`: 93 predições, ≈ US$ 2,88. |
| A19 | ✔ (sem assinatura Apple) | .app em /Applications, `codesign --verify` ok, aberto. pacote.test 5/5, que confere também o three.js servido de dentro do pacote. |
| A20 | ✔ | painel A20 (blocos tipados) e os agentes com o claude real em 23/09 (haiku). |
| A21 | ✔ | coop-ui.test.js 6/6: campanha e aviso na TV, assinados "agente · pessoa". |
| A22–A24 | ✔ | navegador, navegador-ui, osso e SSRF: webview + CDP, Assumir/Devolver, senha só pela pessoa, Raio-X completo, clone, copy.md e print. |
| A25 | ✔ | meio.test.js: meio vivo e placar. |
| A26 | ✔ | navegador-ui: HUD só com o agente no controle e nenhum Chrome no código. |
| A27 | ✔ | limpo.test.js 6/6. Auditoria: TV sem NaN e sem dados de exemplo, Máquina vazia de verdade. |
| A28 | ✔ | maquina-real.test.js 4/4 (vazio, montagem pelo coop, 3D com canvas, corpo ao publicar). Pedido real ao haiku: leu `schema.sql` e montou as gavetas pacientes e consultas com o fio, assinadas (evidencias/w7/maquina-real-claude). |
| A29 | Mac ✔ · Windows no CI | instalar.test.js 7/7: a Rita instala, entra com token e a parede do Theus a vê. O .exe vem do CI. |
| A30 | ✔ | limpo.test.js: as 12 atividades na ordem, foto de 22 px e grupos com alternador. |

**Tentativas de derrubar:**
- A suíte cheia sob carga derrubou o teste de agentes: o fit lia o tamanho no meio da animação. O teste foi corrigido e passou com o roteiro rodando junto.
- O pacote não levava o `three/examples` (o electron-builder corta essa pasta). Achado ao inspecionar o asar e corrigido com extraResources.
- O roteiro G fixava um dado. Agora compara com a parada real.

## Pendências
- **Windows:** ver o CI passar depois do push (A0 e A29).
- **Assinatura:** `.dmg` e `.exe` assinados exigem o certificado da Apple e o do Windows, que são do Theus. Sem eles, a primeira abertura pede botão direito → Abrir.
- **Três pontos para a equipe vigiar:**
  - No pedido real, o claude abriu por conta própria `localhost:3000` e o site externo babel.coop no navegador próprio (só leitura).
  - A execução de JS/CDP livre no navegador do agente foi negada 2× pelo classificador; a decisão é do Theus.
  - O arquivo solto `app/d1.png` foi criado por um agente e não entrou no commit. Apagar pede o ok do Theus.
