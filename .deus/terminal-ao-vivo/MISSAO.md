# Missão do CRIADOR

- Identificador exclusivo: `babel-coop/terminal-ao-vivo`
- Autoridade/pedido original do usuário, preservado (Theus, 2026-09-23 16:59, via `/deus`):

  > Missão: programar o terminal do app Babel Coop do início ao fim, rodando de verdade no meu Mac. Escopo: todos os itens de terminal do CHECKLIST.md — seção 0 (node-pty dentro do Electron), seção 1 (terminal real com xterm.js e node-pty, várias abas, visual do Babel Terminal, abrir na pasta compartilhada) e a seção 2 inteira (parede dos terminais da equipe, transmissão ao vivo, controle, permissões, selo, pausar, menos de 100 ms). Pronto quando: cada item marcado [x] no CHECKLIST.md com evidência e o claude rodando dentro do terminal do app. Use workflow com agentes em paralelo para ir rápido, teste tudo de verdade, faça commit a cada item fechado e push no fim. Só me pergunte o que for indispensável.

- Criação esperada e destinatário: o terminal real da Estação (Electron) do Babel Coop, no Mac do Theus: shell de verdade em abas no painel da direita, com o visual do Babel Terminal, e a parede ao vivo da equipe com controle remoto autorizado no servidor do dono.
- Pasta exclusiva e responsável pela escrita: `.deus/terminal-ao-vivo/` · Ryan (sessão Claude Code), modalidade somente prompt.
- Recursos autorizados e restrições do projeto: Node, npm, npx, JS/TS liberados; Python, `.sh`, `make`, `cc`, `clang`, `bun`, `pip` e `./script` proibidos (node-pty tem de vir com binário pronto, sem compilar). Commit a cada item fechado (autorizado no pedido); push no fim (autorizado no pedido). Não editar `settings*.json`, `.mcp.json`, `~/.claude/`.
- Orçamento informado pelo usuário/cliente, quando houver: nenhum; nada pago.
- Entregável utilizável: `app/` rodando com `npm start` no Mac; testes reproduzíveis em `app/testes/`; `CHECKLIST.md` com os itens marcados e a evidência; `ENTREGA.md` com comandos de reprodução.

## Aceites antes de começar

| # | Critério observável (item do CHECKLIST) | Evidência exigida | Como será verificado | Estado |
| --- | --- | --- | --- | --- |
| A0 | §0 node-pty compilado contra o Electron (Mac e Windows); `claude` roda dentro do terminal | `claude` abre no terminal do app no Mac; Windows: binário pronto + teste automatizado numa máquina Windows | teste e2e no Electron do Mac; Windows: CI (windows-latest) depois do push, ou pendência declarada | Aberto |
| A1 | §1 Terminal de verdade (xterm.js + node-pty): zsh no Mac, PowerShell no Windows | saída real de `echo $SHELL`/`ps` dentro do xterm do app | e2e Playwright-Electron lendo o buffer do xterm | Aberto |
| A2 | §1 Mais de um terminal ao mesmo tempo, em abas | 2+ abas com PIDs diferentes vivos ao mesmo tempo | e2e | Aberto |
| A3 | §1 Visual do Babel Terminal: fundo `#060b16`, degradê roxo→azul→ciano, logo "b" neon liga/desliga | captura de tela + estilos computados; alternar neon muda o estado | e2e + print | Aberto |
| A4 | §1 Terminal abre por padrão na pasta compartilhada | `pwd` = `~/BabelCoop/<id>` | e2e | Aberto |
| A5 | §2 Parede em tempo real, nome do agente + foto da pessoa, um clique amplia | parede com terminais de 2 Estações atualizando ao vivo; clique abre ampliado | e2e com 2 Estações | Aberto |
| A6 | §2 Transmissão da saída + redimensionamento por WebSocket | quem assiste recebe saída e cols/rows do dono | teste de integração | Aberto |
| A7 | §2 Quem tem permissão digita e as teclas chegam na sessão do dono | comando digitado pelo Theus roda na tela do outro | e2e 2 Estações | Aberto |
| A8 | §2 Theus/gestão e membros do mesmo projeto entram direto; os outros pedem e o dono aceita com um clique; autorizado no servidor do dono | matriz de permissões testada, incluindo tentativa sem permissão recusada | teste de integração + e2e | Aberto |
| A9 | §2 Selo "X está no seu terminal Y" na tela do dono; o dono encerra | selo visível; após encerrar, teclas do outro são recusadas | e2e | Aberto |
| A10 | §2 Pausar a transmissão de um terminal | durante a pausa nada chega a quem assiste (nem depois) | teste de integração com marcador | Aberto |
| A11 | §2 Nada é gravado nesta fase | marcador da saída não aparece em disco | busca do marcador nas pastas do app | Aberto |
| A12 | §2 Latência na rede local < 100 ms | p95 de tecla → eco na tela de quem assiste | medição com N amostras | Aberto |
| A13 | `claude` rodando dentro do terminal do app | tela do Claude Code dentro do xterm do app | e2e + print | Aberto |
| A14 | Casca da Estação no design 2030 (tokens de `docs/design/tokens.css`) sem quebrar o protótipo | print antes/depois; roteiro do protótipo passa | Playwright + `docs/testes/roteiro.js` | Aberto |
| A15 | Painel da direita = presença: anel-instrumento com coluna de luz ligada a eventos reais do pty (Enter acorda, saída acende, "rodando X há N s", "terminou · hh:mm" com pulso roxo→ciano + faíscas + tique, "espera" com o claude parado, controle = luz dirigida, pausa = esfria), abas com a mini presença | cada estado provocado por um comando real e visto na tela | e2e com prints por estado | Aberto |
| A16 | Parede e selos no design 2030 (organismo: luz só com evento, pausado esfria, controle com luz da pessoa) | print da parede com 2 Estações ao vivo | e2e | Aberto |
| A17 | Sons (Web Audio) ligados por padrão na Estação, botão para desligar, nunca na TV; `prefers-reduced-motion` respeitado; ≤ 2 efeitos vivos; efeito não atrasa a digitação | chamadas de som registradas por evento; latência medida com efeitos ligados | e2e + medição | Aberto |
| A18 | Replicate usada no que o código não faz bem (ex.: o mostrador), com MANIFESTO e custo | arquivos + MANIFESTO + custo | leitura do MANIFESTO | Aberto |
| A19 | Abre nativo, instalado no Mac (app Electron em janela própria, não no navegador) | `Babel Coop.app` gerado pelo electron-builder a partir de `app/`, instalado e aberto no Mac com o terminal funcionando | build local (.dmg sem assinatura Apple; assinatura exige o certificado do Theus) + abrir o .app | Aberto |
| A20 | Presença no nível do plano (PLANO §1.1, F1): blocos tipados vindos de eventos reais do claude (pedido · consulta com nome · plano com checklist · ação com "ver o comando" · resultado com prova · espera com OK · falha), mostrador apontado, campo ❯ endereçado, receitas, o b que se desenha na entrada | cada bloco nascendo de um gancho real numa sessão real do claude | e2e com prompt real (modelo barato) + prints | Aberto |
| A21 | Conector `coop` (MCP) com as ações do app, assinadas "agente · pessoa" (CHECKLIST §3) | pedido real ao claude cria algo no app (aviso/campanha que aparece na TV) | e2e com prompt real | Aberto |
| A22 | Navegador próprio (webview, sem Chrome): o agente navega, clica e preenche à vista; senha só a pessoa; Assumir/Devolver; cursor e passos (CHECKLIST §3) | pedido real: "entra no site X e preenche o cadastro" acontece na aba | e2e com página local de teste + prompt real | Aberto |
| A23 | Raio-X do site: HTML (DOM vivo, busca, copiar bloco), CSS, Copy (exportar Markdown), Rede, Console, Selecionar elemento | cada aba mostrando dado real da página aberta | e2e + prints | Aberto |
| A24 | Clonar página (Clones/<site>/ abre funcionando), clonar copy (copy.md), print da página inteira | arquivos gerados e a cópia aberta | e2e | Aberto |
| A25 | Meio vivo: arquivo nascendo linha a linha quando o claude escreve, rito "concluído", placar com origem | print/medida do arquivo nascendo a partir de Write real | e2e com prompt real | Aberto |
| A26 | HUD do contexto Gabriel (vidro, glow, scanlines ≤ 5 %) só em superfície viva; nenhum Google Chrome em lugar nenhum do app | prints + busca no código por shell.openExternal/Chrome | revisão + e2e | Aberto |
| A27 | App limpo: sem mockup, só a conta do Theus e quem entrar com token; árvore com as pastas reais; o que se cria persiste pelo diário | print da Estação recém-fundada sem nada de exemplo + arquivo criado/salvo no disco + demanda chegando à outra Estação | e2e limpo.test.js | Aberto |
| A28 | Backend visual em 3D: Máquina com 2D e 3D (peças geradas, fios, pulso do teste, peça que ganha corpo) e o claude montando a Máquina a partir do sistema real (ex.: Supabase) pelo coop | print do 3D + montagem por ferramenta coop | e2e + 1 pedido real | Aberto |
| A29 | Instalar em outras pessoas: .app/.dmg do Mac, .exe do Windows pelo CI, guia COMO-INSTALAR.md, convite por token testado com o app empacotado | artefatos + e2e de convite com o pacote | e2e + CI | Aberto |
| A30 | Barra com as 12 atividades do plano (CONCEITO §3.1), grupos com alternador | print + roteiro | roteiro | Aberto |

## Ponto inicial

- O que já existe, com fonte: `app/` esboçado e nunca executado (README do app); `servidor/terminal.js` com node-pty; `ponte.js` com painel Ctrl+J; protótipo v22 com a UX inteira simulada (terminal à direita, parede em `vistas-c.js`, pedir/aceitar/encerrar em `acoes.js`, selos em `estacao.js`).
- Diferença que a criação deve realizar: trocar o simulado pelo real sem perder a UX do protótipo; autorização no servidor do dono; nada em disco.
- Primeira pergunta por capacidade: o node-pty roda dentro do Electron do Mac sem compilar?
- Primeira ação que produzirá informação ou artefato: instalar Electron + node-pty 1.1.0 (binários N-API prontos) e abrir um pty dentro do Electron.
- Decisões realmente ausentes: nenhuma que bloqueie; segunda máquina física (Mac ou Windows) não está disponível nesta sessão.

## Revisões do pedido e dos aceites

- 2026-09-23 · aceites derivados do pedido e do CHECKLIST. Pedido original preservado acima.
- 2026-09-23 17:20 · ordem do Theus, preservada: "eu quero que vc faça no design escolhido, o 2030, aqueles ultimos cards, pegue a API REPLICA e se precisar gerar algo gere, mas agora faça, com os neons, com os brilhos, com os elementos, com os sons, o organismo vivo". Acrescentados A14–A18. Decisão: `memoria/decisoes/2026-09-23-terminal-nasce-no-design-2030.md`. Contrato técnico: `PROTOCOLO.md`.
- 2026-09-23 · pergunta do Theus: "o que estamos programando vai abrir nativo instalado na maquina ou navegador? ... e conclua no padrao". Resposta: nativo (Electron). Acrescentado A19 (o .app instalado no Mac).
- 2026-09-23 17:50 · ordem do Theus, preservada: "faz tudo JUNTO, eu quero no nivel do que vi no plano, eu expliquei e cansei detalhando tudo o que eu queria, tiva aas kills, ingete o contexto Gabriel e construa". Escopo ampliado: terminal + presença do plano + conector coop + navegador próprio com raio-X e clonar + meio vivo + HUD Gabriel (A20–A26). Contrato: PROTOCOLO.md parte 2 (§7–§11). Skills ativadas: motion-web-institucional (efeito = metáfora do serviço; reduced-motion desliga o laço). Contexto Gabriel lido: agente/CLAUDE.md (identidade visual HUD do Babel OS) e agente/memoria/conhecimento/claude-code/hooks.md (ganchos http, PostToolUse por ferramenta, Notification, Stop). Prompts reais ao claude nos testes: poucos, com modelo barato.
- 2026-09-23 · Theus: a barra lateral tem mais itens que o plano (16 × 12). E, literal: "complete e finalize a tarefa, tem o navegador tbm, eu quero criar o backend totalmente visual 3D, principalmente pq tenho que evoluir o meu sistema, e estamos chegando no limite dos meus tokens, eu preciso que vc agora realmente pegue todas as peças pra completar e eu começar a usar e também instalar em outras pessoas, tem que remover todo o mockup deixar o app limpo somente com a minha conta". Acrescentados A27–A30. Economia de tokens a partir daqui.
