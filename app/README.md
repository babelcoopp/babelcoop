# Babel Coop · o app real (fase 1: rede local)

> Criado em 23/09/2026. Cada computador é um servidor. Nada de nuvem por enquanto: a equipe se acha no Wi-Fi do escritório.
> **Estado honesto:** os arquivos desta pasta foram escritos nesta sessão sem serem executados (o Node não pôde rodar aqui). O primeiro `npm install && npm start` vai mostrar o que precisa de ajuste. O desenho está fechado em `../IDEIAS.md` e o que conferir em `../CHECKLIST.md`.

## Como funciona

```
~/BabelCoop/
  coop.json          quem eu sou (id, nome, papel, equipe, segredo, porta)  ← vem do token
  <meu-id>/          a minha pasta compartilhada (a equipe vê só isto)
  .coop/diario.jsonl o diário de eventos: os meus numerados + os dos outros replicados
  .coop/versoes/     a versão anterior de cada arquivo salvo ("Voltar como estava")
```

- `servidor/servidor.js` sobe em `http://localhost:4711`: serve a interface (a mesma do `../prototipo`, com `ponte.js` por cima), o diário, a pasta compartilhada e os terminais (WebSocket em `/ws`).
- `servidor/rede.js` anuncia a Estação por UDP broadcast (porta 41234) e liga por WebSocket em quem responde. Só entra quem prova que tem o **segredo da equipe** (veio no token). Os endereços do token (`encontro`) são tentados direto, para o caso de o Wi-Fi bloquear broadcast.
- `servidor/diario.js`: evento = `{ id: autor:seq, quem, acao, args }`. Ao ligar, cada par diz até onde conhece cada autor e recebe o que falta. Máquina desligada não perde nada: recebe ao voltar.
- `servidor/terminal.js`: node-pty. Saída transmitida a quem assiste; teclas aceitas do dono, de quem tem controle e da gestão. Nada vai para o disco.
- `servidor/arquivos.js`: lista, lê e grava só dentro da pasta compartilhada; `..` nunca passa; `.env`, `.ssh`, `node_modules`, `.git` ficam de fora.
- `ponte.js` (no navegador): tira a equipe simulada, transforma cada `L.fazer` em evento do diário, aplica os eventos dos outros, mostra a tela do token na primeira abertura e monta o **Terminal real** (xterm.js, Ctrl+J) com a parede dos terminais da equipe.
- `main.js` (Electron): abre a interface servida pelo próprio servidor; "Tela da TV" abre numa janela própria.

## O token de instalação

1. O Theus, na Estação dele (a primeira máquina): **Fundar a equipe** na tela de boas-vindas. Isso cria o segredo da equipe e o marca como gestão.
2. Em Equipe → **Convidar pessoa** → nome → **Gerar token**. O token (`babel-…`) carrega: id e nome da pessoa, papel, segredo da equipe e os IPs da Estação do Theus na rede.
3. A pessoa instala o app, abre, cola o token, clica **Entrar na equipe**. Pronto: ela vê a equipe, a equipe vê ela. Sem cadastro, sem senha nesta fase (PIN entra na fatia de login do `CHECKLIST.md`).

Quem não tem o token não entra na rede: o `ola` entre Estações exige `sha256(segredo:id)`.

## Rodar na rede local (teste com 2 máquinas)

```bash
cd app
npm install          # compila o node-pty para o Electron (postinstall)
npm start            # abre a Estação; o servidor sobe em http://localhost:4711
```

Na segunda máquina, o mesmo; cole o token. Para o celular e a TV: `http://<ip-da-máquina>:4711/` (celular) e `http://<ip>:4711/#tv` (TV).

Sem Electron, só o servidor: `npm run servidor` e abra `http://localhost:4711` no Chrome (o terminal real precisa do node-pty compilado para o Node, não para o Electron: `npx electron-rebuild` não roda; use `npm rebuild node-pty`).

## Oficina do app (atualizar todo mundo pela rede)

1. Quem a gestão liberou pede ao agente no terminal: "muda no app: …". O agente edita o código (na fase real, a pasta `Oficina/app` da pessoa, que é uma cópia da interface) e a mudança fica aguardando na tela Oficina.
2. A gestão clica **Publicar atualização vN**: `POST /api/app/publicar` copia a interface que a Estação dela serve para `~/BabelCoop/.coop/app/vN/` com `manifesto.json` (sha256 por arquivo) e grava o evento `oficinaPublicar` no diário.
3. O evento chega a todas as Estações: aparece **⬆ Atualizar para vN**. Ao clicar, `POST /api/app/atualizar` baixa cada arquivo de `/api/app/arquivo` da Estação de quem publicou, confere o hash, marca `atual.json` e a página recarrega já na versão nova (o servidor passa a servir `vN/`).

Código: `servidor/atualizacao.js`. O Electron (`main.js`) não entra nesse fluxo; para ele, electron-updater depois.

## Instalador

`npm run dist:mac` / `npm run dist:win` (electron-builder). Assinatura e auto-update ficam para depois do teste na rede local. O design vive em `../prototipo` (HTML/CSS/JS puro): muda sem reempacotar nada, basta reiniciar o app; o instalador só embala.

## O que ainda é do protótipo (some por fatia)

- O conteúdo de exemplo de `dados.js` (pessoas, arquivos, demandas). As pessoas de exemplo ficam "offline" até alguém entrar com token; a árvore ainda mostra os arquivos de exemplo. A fatia seguinte troca a árvore pelos `GET /api/arquivos` e `GET /api/de/<id>/arquivos`.
- O terminal simulado do painel da direita continua (é onde o agente "entende" os pedidos); o terminal real fica no painel Ctrl+J até os dois virarem um só (Claude Code de verdade rodando no pty com o conector `coop`).
- Transcrição, WhatsApp Web em webview, navegador do agente, Máquina lendo o Supabase: ver `../CHECKLIST.md`.
