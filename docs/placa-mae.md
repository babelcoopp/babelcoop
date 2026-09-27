# Placa-mãe do Meu dia

Pedido do Dominic (26/09/2026): "todas as informações que ficam abaixo no rodapé agora são widgets que fixam na tela
inicial igual circuitos e peças em uma placa mãe. E ela corre alguns fios entre ela como se fosse uma corrida em um
circuito."

Código: `prototipo/placa-mae.js` e `prototipo/placa-mae.css` (camada separada, ligada no `index.html` depois de
`criar-icones`). Nenhum arquivo do app foi alterado para isso.

## A ideia

"Circuito" nos dois sentidos: o circuito elétrico da placa e o circuito de corrida. Cada informação do rodapé vira a
peça que uma placa-mãe de verdade usa para aquela função. A trilha principal é uma pista fechada; duas luzes (o azul e
o roxo da Babel) correm nela. Quando uma informação muda de verdade, sai uma faísca do processador pela trilha até a
peça.

## Peça por peça

| Rodapé | Peça | Por que essa peça | Clique |
|---|---|---|---|
| presença (online, foco…) | SW1 · chave táctil com anel de LED na cor da presença | é o botão de ligar | troca a presença (`presenca`) |
| N na caixa | DS1 · visor de depuração de dois dígitos (o "Q-Code" das placas) | o visor que diz em que pé a placa está | rola até a Caixa de entrada |
| relógio da demanda | Y1 · cristal de quartzo (lata HC-49) com brilho correndo enquanto roda | o cristal é o relógio da placa | abre a demanda (`abrir-demanda`) |
| memória da sala / gravando | RAM1 · pente de memória no slot; gravando: chips em vermelho e LED piscando | memória | gravando: abre a reunião |
| pontos · hoje (placar) | BT1 · bateria CR2032 no suporte, com o anel da meta da semana | a bateria guarda o que vale | abre a lista de pontos, embaixo da bateria |
| TV conectada / não aberta, projeção | J1 · porta HDMI na borda; projetando: cabo plugado e os botões ◀ ▶ ▲ ▼ ✕ | saída de vídeo | abre a coluna da TV (`coluna`) |
| terminal ao vivo / pausado | U1 · processador no soquete, com a marca da Babel no espalhador de calor | o terminal é o coração da Estação | liga/pausa a transmissão |
| acervo: N | M.2 · SSD com dedos dourados, controlador, NAND e etiqueta com o número | armazenamento | abre o Acervo |
| Salvo na equipe / Salvando… | J2 · conector RJ45 com LED de link (verde) e de atividade (âmbar piscando ao salvar) | rede | — |
| N livres | J3 · barra de pinos 2×5; cada pino aceso é uma tarefa livre | pinos livres | filtra as livres |
| reunião acontecendo | U5 · CI de áudio (QFN) com o tempo da reunião | — | abre a reunião |
| alguém no seu terminal / pedido | U6 · CI de interrupção com o texto do selo e Encerrar / Aceitar / Recusar | interrupção | os mesmos botões do selo |
| atualizar o app (Oficina) | U7 · chip da BIOS | atualização de firmware | `oficina-atualizar` |
| mostrar terminal | SW2 · chave táctil | — | `terminal-alternar` |

Pegada vazia (DNP, "do not populate"): quando a informação não existe (sem reunião, ninguém no terminal, app em dia,
painel aberto, sem placar no protótipo), a peça aparece como a pegada dela na placa: pads dourados, contorno de
serigrafia e "DNP". Quando a informação aparece, a peça "é soldada" (desce como na máquina de montagem e assenta).

## A corrida

- Pista anti-horária, como Interlagos, com um "S do Senna" (chicane) logo depois da largada. A largada é o xadrez na
  reta de cima; o S fica no maior vão sem tocos da reta de cima.
- Dois carros: azul (freia menos, mais lento na reta) e roxo (mais rápido na reta, freia mais nas curvas). Os dois
  freiam perto das quinas e do S e aceleram nas retas, então se ultrapassam. Cada volta ganha um fôlego um pouco
  diferente. As voltas contam na serigrafia do rodapé da placa.
- Quando um carro passa pela entrada de uma peça, o pad brilha e a peça acende por um instante.
- Faíscas: presença mudou, chegou coisa na caixa, relógio começou, gravação, atualização, pontos subiram (com o "+N"
  subindo da bateria), TV conectou ou projetou, acervo cresceu, cada salvamento na equipe, livres mudaram, reunião
  começou, alguém entrou no seu terminal (faísca âmbar), painel fechou.

## Como funciona por dentro

- Os dados vêm do próprio rodapé (`#e-status`), que continua sendo desenhado pela Estação e pelas peças do app real
  (placar, selos de controle, Oficina). A placa espelha o rodapé com um MutationObserver; os botões usam as mesmas
  `data-acao`, então o clique cai no mesmo lugar que caía no rodapé.
- No Meu dia (desktop) o rodapé some e a linha dele na grade da Estação vai a 0; nas outras abas ele volta. No
  celular a Estação já não tem rodapé.
- A lista de pontos do placar nasce presa à casa do rodapé; no Meu dia ela é reposicionada embaixo da bateria.
- A Estação redesenha o Meu dia com `innerHTML` e devolve o scroll antes de a placa voltar. Por isso: sem ancoragem de
  rolagem em `#e-conteudo` no Meu dia, e a placa devolve o scroll exato de antes quando é recolocada na mesma aba.
- As trilhas são calculadas pela posição de layout das peças (sem as transformações do hover) e só são redesenhadas
  quando alguma peça muda de tamanho ou de lugar. A pista é uma polilinha com quinas a 45°; a posição dos carros é
  calculada nessa polilinha; os rastros são a própria pista com `stroke-dasharray`/`stroke-dashoffset`.
- A corrida para quando a placa sai da tela, quando a aba do navegador fica escondida, quando a janela perde o foco
  (`html.sem-foco`) e com movimento reduzido (aí os carros ficam parados e a faísca vira só o acender da peça).
- Placa estreita (menos de 600 px): tudo entra na pista, em duas colunas, com o processador em cima.

## Testes feitos (26/09/2026)

Estação de testes (4712) e protótipo puro, com Playwright: leitura de todas as informações do rodapé; carros andando;
faísca indo e chegando; hover acendendo a trilha; clique na caixa (rola até a seção), na bateria (abre e fecha a lista
embaixo dela), na presença (troca), no M.2 (abre o Acervo; rodapé volta e a placa sai); volta ao Meu dia; scroll
mantido em redesenhos (300, 900 e fim da página); zero redesenhos das trilhas em 6 s parado; larguras 1180
(compacta), 1500 e 1920; modo Vibe; movimento reduzido; pausa fora da tela; estados raros simulados só na memória da
página (controle do terminal, projeção, gravação, atualização, painel fechado). Nenhum erro no console.

## Referências e fontes

Lidas por inteiro:
- Wikipedia, *Printed circuit board* (máscara de solda, serigrafia, vias, FR-4): https://en.wikipedia.org/wiki/Printed_circuit_board
- FreeFrontend, *Animated CPU Circuit Loader* (trilha dupla: cobre + fluxo com dasharray): https://freefrontend.com/code/animated-cpu-circuit-loader-2026-02-06/

Consultadas pela busca (resumo dos resultados):
- Roteamento a 45°, vias e serigrafia: JLCPCB https://jlcpcb.com/blog/pcb-routing-rules-best-practices ·
  ALLPCB https://www.allpcb.com/allelectrohub/pcb-trace-routing-design-rules-best-practices-for-manufacturability ·
  ALLPCB (serigrafia) https://www.allpcb.com/blog/pcb-design/beyond-reference-designators-advanced-silkscreen-annotation-techniques.html ·
  UGPCB https://www.ugpcb.com/news/pcb-tech/electronic-design/pcb-design-rules/
- Fiduciais: JLCPCB https://jlcpcb.com/blog/fiducial-marks · AtlasPCB https://www.atlaspcb.com/blog/pcb-fiducial-mark-design-placement-pick-and-place/
- Preto fosco com ENIG: Seeed Studio https://www.seeedstudio.com/blog/2020/02/21/osp-is-the-new-enig-matte-black-is-the-new-black/ ·
  Wikipedia (ENIG) https://en.wikipedia.org/wiki/Electroless_nickel_immersion_gold ·
  MOD WIGGLER https://www.modwiggler.com/forum/viewtopic.php?t=157778
- Anatomia da placa-mãe (bateria CR2032, cristal, DIMM, M.2): TechSpot https://www.techspot.com/article/1965-anatomy-motherboard/
  (a página recusou a leitura direta, HTTP 403) · Scientech Easy https://www.scientecheasy.com/2023/07/components-of-motherboard.html/ ·
  MiniTool https://www.partitionwizard.com/partitionmanager/motherboard-components.html
- Visor Q-Code: NZXT https://nzxt.com/blogs/news/motherboard-debug-leds-post-codes · ASUS ROG https://rog-forum.asus.com/t5/4-heart-of-the-build/understanding-debug-codes/td-p/1139925
- DNP: Maker Pro https://maker.pro/pcb/tutorial/how-to-use-do-not-populate-dnp-components-in-your-pcb-design · South Electronic https://southelectronicpcb.com/dnp-components-in-pcb-design/
- LEDs do RJ45: MikroE https://www.mikroe.com/blog/rj45-ethernet-jack-with-leds · LINK-PP https://resources.l-p.com/knowledge-center/rj45-connector-with-led-functions
- Animação em SVG: CSS-Tricks https://css-tricks.com/svg-line-animation-works/ · MDN stroke-dasharray https://developer.mozilla.org/en-US/docs/Web/CSS/stroke-dasharray ·
  MDN offset-path (considerado; no fim a posição é calculada em JS) https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/offset-path ·
  MDN getPointAtLength https://developer.mozilla.org/en-US/docs/Web/API/SVGPathElement/getPointAtLength
- Inspiração visual: Dribbble (tag PCB design) https://dribbble.com/tags/pcb-design
- Interlagos (anti-horária, S do Senna logo depois da largada): Motor Sport Magazine https://www.motorsportmagazine.com/database/circuits/interlagos/ ·
  Total Motorsport https://www.total-motorsport.com/brazilian-gp-interlagos-corner-names-stories-behind-iconic-turns/ ·
  Wikipedia https://en.wikipedia.org/wiki/Brazilian_Grand_Prix
