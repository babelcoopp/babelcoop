# TERMINAL 2030 · o painel da direita como presença, a parede e o organismo vivo

> 23/09/2026 · missão DEUS `babel-coop/terminal-ao-vivo` (aceites A3, A15, A16, A17) · escrito pelo agente brief + organismo.
> Ordem do Theus desta rodada: "faça no design escolhido, o 2030, aqueles últimos cards, pegue a API da Replicate e, se precisar gerar algo, gere, mas agora faça, com os neons, com os brilhos, com os elementos, com os sons, o organismo vivo".
> Base: `PLANO.md` (propriedade 1, a presença; propriedade 6, o organismo), `REGUA_ORGANISMO.md` (R1–R10, tabela de efeitos), `CONCEITO.md` §3.3, §4, §4.6 e §11, `tokens.css`, `organismo.html`, as imagens `assets/visao/imag-estacao.jpg`, `organismo-1.jpg`, `organismo-2.jpg` e `imag-parede.jpg`, o protocolo `.deus/terminal-ao-vivo/PROTOCOLO.md` §3–§5 e o `CHECKLIST.md` §1–§2.
> Código: o motor é `app/interface/organismo.js` (`window.BC.organismo`); a demonstração que prova cada estado é `app/interface/organismo-demo.html` (servida em `/coop/organismo-demo.html`). Evidências em `.deus/terminal-ao-vivo/evidencias/organismo/`.

---

## 0. Em uma frase

À direita não há uma caixa preta com prompt: há **uma presença**, uma coluna de luz roxo → ciano dentro de um anel-instrumento com marcas finas, que acende com a saída do terminal real, diz em palavras o que está rodando ("→ npm · Aurora · rodando há 4 s"), solta um pulso com faíscas até a aba quando o comando termina, fica âmbar quando o `claude` espera você, ganha um arco na cor de quem entrou no seu terminal e esfria quando a transmissão pausa. Embaixo dela, o terminal de verdade (xterm + node-pty) com o visual do Babel Terminal. **Toda luz, faísca e som sai de uma mensagem real do servidor; em repouso, nada se mexe.**

---

## 1. O que esta rodada decide (e o que muda em relação ao CONCEITO v2)

O CONCEITO v2 cortou neon, brilho e som por excesso. A régua do organismo (revisão 7) e a ordem do Theus desta rodada trazem de volta, **presos a evento**. Onde os dois documentos divergem, vale esta tabela:

| Tema | CONCEITO v2 dizia | Agora (ordem do Theus + REGUA_ORGANISMO) | Por quê |
|---|---|---|---|
| Neon | "sem neon permanente"; o "Neon" vira preferência "luz da marca" | o **"b" em neon** volta no canto do terminal (CHECKLIST §1, pedido do Theus), **liga e desliga**, acende piscando como gás ionizando (450 ms) e o brilho dele **acompanha a saída** do terminal; em pausa, apaga | é o item "logo b em neon (liga e desliga)" do CHECKLIST; o brilho ligado à saída mantém R1 |
| Brilho | "zero box-shadow colorida, sem halo" | halo e glow **só enquanto o evento vive**: coluna da presença, pulso, faíscas, borda que respira, arco do visitante, raios da constelação; tudo esfria sozinho pela meia-vida | "com os brilhos" (Theus); R1: luz = evento real |
| Som | um som só ("espera"), **desligado** por padrão | **seis sons** (`tique`, `duas`, `tres`, `espera`, `erro`, `acordar`), **ligados por padrão na Estação**, botão para desligar (guardado em `localStorage['babel-coop:som']`), **nunca na TV nem no iPad** | ordem do Theus: som ligado por padrão; a TV continua muda (CONCEITO §3.5, R8) |
| Anel do agente | anel de 14 px, traço único | o anel vira **anel-instrumento** com 72 marcas (como `imag-estacao.jpg`, sem os números: nada de texto em pixel) e a coluna de luz no meio; o mesmo desenho em 18 px nas abas | PLANO propriedade 1; imagem aprovada |
| Material do anel | "à mão, custo zero" | o traço é código (SVG); por baixo, **opcional**, a textura gerada na Replicate (`app/interface/midia/mostrador-anel-512.png`, anel escuro com marcas gravadas) a 34 % | A18: Replicate no que o código não faz bem (o material); o organismo nunca depende dela |

O resto do CONCEITO continua: tokens, tipografia (Plex, JetBrains Mono, Cormorant só para fala humana), meia-vida (lei 3), selo com nome e hora (lei 2), nenhuma animação em troca de aba, pasta ou filtro, `prefers-reduced-motion` com equivalente útil.

---

## 2. O painel da direita (360 px, 312–520; Ctrl ` recolhe)

De cima para baixo, na mesma coluna. Medidas na densidade confortável.

### 2.1 Fila de abas · 32 px (`--abas`)
- Uma aba por sessão de terminal (`term-aberto`). Aba = **mini presença de 18 px** (o mesmo anel com a coluna, §3.3) + nome do agente em Plex 12,5 px Medium (`--texto` na ativa, `--apagado` nas outras) + × de 24×24 só no hover/foco.
- Aba ativa: segmento de 2 px `--t0` na borda de baixo. Aba **tocada por evento** (terminou, espera, alguém entrou): 1 px em degradê `--t2 → --t0` na borda de baixo e fundo roxo a 16 % × `--luz`, esfriando pela meia-vida curta (6 s). Nada pisca.
- A mini presença mostra o estado de **cada** sessão sem abrir a aba: laço girando = rodando; âmbar aberto = o `claude` espera você; cinza = pausada; pontilhada = o shell saiu.
- À direita da fila: **"● ao vivo"** (ponto 6 px `--t0` + mono 11 px) enquanto transmite; **"● pausado"** em `--fraco` quando a transmissão está pausada (clique alterna, manda `term-pausar`). Depois dele, **+** (nova aba, Ctrl+Shift+T).

### 2.2 Cabeçalho da presença · 96 px, `--s2` (o "mostrador")
- À esquerda, a **presença grande de 72 px** (`BC.organismo.Presenca`, `tamanho: 'grande'`), a 12 px da borda.
- À direita, duas linhas em JetBrains Mono:
  - linha 1, 12 px Medium `--texto`: **`→ <alvo>`**. Alvo = o processo em primeiro plano quando há um (`npm`, `claude`, `node`), senão a pasta (`~/BabelCoop/theus`).
  - linha 2, 11 px `--apagado`: **`<agente> · <estado>`**, com o estado em Medium na cor do estado (`--t0` normal, `--atencao` na espera, `--alarme` na falha, `--fraco` pausado/desligado). O texto vem de `BC.organismo.frase(estado, dados)`:

| estado (`term-atividade.estado`) | frase | exemplo completo do cabeçalho |
|---|---|---|
| `shell` | em repouso | `→ ~/BabelCoop/theus` · `Aurora · em repouso` |
| `rodando` | rodando há N s (medido, relógio de 1 s só enquanto roda) | `→ npm` · `Aurora · rodando há 4 s` |
| `terminou` | terminou · hh:mm · duração | `→ npm` · `Aurora · terminou · 14:32 · 14 s` |
| `espera` | espera você | `→ claude` · `Aurora · espera você` |
| `pausado` | transmissão pausada | `→ ~/BabelCoop/theus` · `Aurora · transmissão pausada` |
| `desligado` | desligado | `→ ~/BabelCoop/theus` · `Aurora · desligado` |
| `falhou` | falhou · hh:mm · código N | `→ node` · `Aurora · falhou · 14:40 · código 1` |

- Enquanto a presença está acesa (evento recente), o cabeçalho ganha um contorno interno de 1 px `--t0` a 12 % × `--luz` (CONCEITO: "agindo = borda tingida 12 %"). Esfria junto.

### 2.3 Linha do selo · 32 px, só enquanto alguém está no meu terminal
- **"Carla está no seu terminal Aurora"** (mono 11 px `--texto-90`), à esquerda um **anel de 16 px** na cor da pessoa com as iniciais dentro (mono 7,5 px), à direita o botão de texto **Encerrar** (manda `controle-encerrar {id}`).
- Fundo: degradê da cor da pessoa, de 8 % + 14 % × `--luz` até transparente em 70 % da largura; `--luz` com meia-vida média (300 s, CONCEITO lei 3). **Enquanto o controle existe, a linha nunca some**; só a intensidade esfria.
- O mesmo selo aparece na casa "controle" do rodapé (CONCEITO §3.4) quando o painel está recolhido.
- Várias pessoas: um anel por pessoa, sobrepostos −4 px; 3+ = anel + "+N".

### 2.4 O corpo: o terminal de verdade com o visual do Babel Terminal
- **xterm.js** (addon fit) ligado ao node-pty do servidor; ocupa todo o resto do painel. Fundo **`#060b16`** (`--s0`), padding 10 px 14 px, JetBrains Mono 12,5 px, `lineHeight` 1,35, cursor em bloco `--t0` piscando no padrão do terminal.
- Tema do xterm (nenhuma cor fora dos tokens):

| papel xterm | cor | papel xterm | cor |
|---|---|---|---|
| `background` | `#060b16` | `foreground` | `#c3cfe5` (`--texto-90`) |
| `cursor` | `#2ad5e5` | `selectionBackground` | `rgba(163,118,233,.28)` |
| `black` / `brightBlack` | `#0b1320` / `#6c7b96` | `red` / `brightRed` | `#ff6b6b` / `#ff8f8f` |
| `green` / `brightGreen` | `#7fd6a6` / `#a3e6c1` | `yellow` / `brightYellow` | `#f0b35a` / `#f5c76a` |
| `blue` / `brightBlue` | `#7ba4f0` / `#9dbcf5` | `magenta` / `brightMagenta` | `#a376e9` / `#c7a2ff` |
| `cyan` / `brightCyan` | `#2ad5e5` / `#6fe3ff` | `white` / `brightWhite` | `#d7e4fb` / `#fff8e7` |

- **O degradê roxo → azul → ciano** (CHECKLIST: "degradê roxo → azul → ciano") mora em quatro lugares que não quebram as cores ANSI nem custam latência:
  1. **o texto de cor padrão** do xterm: no renderizador DOM, os `span` sem classe `xterm-fg-*` recebem `background-image: linear-gradient(90deg,#b9a8ff,#7ab8ff 55%,#6fe3ff)` com `background-clip: text` e `color: transparent`, com o degradê medido na largura do corpo (`background-size` e `background-position` a partir do retângulo do terminal, recalculados no `fit`), para ele ser contínuo de ponta a ponta da linha. Texto com cor ANSI (erros vermelhos, verdes do teste) fica com a própria cor. Se um dia usar o renderizador WebGL, cai para `foreground #c3cfe5` e o degradê fica só nos itens 2–4;
  2. **a hairline de 1 px** no topo do corpo, `--t2 → --t0`, com opacidade `--luz` (acende com a saída, esfria em 6 s);
  3. a **coluna da presença** (roxo no topo, ciano na base);
  4. o **"b" em neon**.
- **O "b" em neon** (`BC.organismo.MarcaB`): 34 px no canto superior direito do corpo, sem capturar clique. Tubo em degradê `--t2 → --t1 → --t0` com núcleo branco de 0,45 px e halo desfocado. **Liga e desliga** pelo botão da barra do painel (preferência `localStorage['babel-coop:neon']`, padrão ligado); ao ligar, pisca como tubo de gás (450 ms, uma vez); desligado = contorno `--linha` a 40 %. O brilho segue a saída (`marca.nivel`) e **apaga na pausa** (`marca.pausa(true)`), sem mudar a preferência. Nunca marca-d'água grande (CONCEITO §8).
- O terminal abre na pasta compartilhada (`~/BabelCoop/<id>`); o prompt do zsh é o da pessoa (o app não troca o PS1).

### 2.5 O que o painel nunca faz
Animar ao trocar de aba; mover o texto do terminal; esperar animação para escrever (`term.write` é imediato); tocar som por tecla; mostrar badge fixo; brilhar em repouso.

---

## 3. A presença (o anel-instrumento com a coluna de luz)

Desenhada em SVG pelo motor (`viewBox 0 0 100 100`), escalável; **nenhum texto dentro dela**. Referência: `imag-estacao.jpg` (a coluna de luz roxo → ciano dentro do anel com marcas) sem os números do mostrador.

### 3.1 Geometria da grande (72 px no cabeçalho; 88 px na demonstração)
- **Textura** (opcional): `midia/mostrador-anel-512.png` (Replicate, `midia/midia.json`), recortada no disco r 47, opacidade 0,34 + 0,16 × brilho. Com textura, as marcas curtas do código baixam para 10 % (as gravadas na imagem fazem esse papel). Sem a imagem, o anel é todo código e nada muda de comportamento.
- **72 marcas** a cada 5°, de r 43,4 a 46,2 (traço 0,55); **12 longas** a cada 30°, de r 40,6 a 46,2 (traço 1,05); aro interno r 37 (0,5, a 30 %). Cor `--texto-90`, opacidade 0,24 + 0,45 × brilho + 0,3 × luz: o anel acende junto com a coluna.
- **Agulha**: traço de 6,5 px `--t0` na direita, girando de +60° (vazio) a −60° (cheio) com o nível da coluna.
- **Anel de estado** r 49 (traço 1,5): laço de 90° em degradê que gira a 1,2 s (rodando); anel que **fecha em 180 ms** (terminou) e esfria; **aberto com folga de 60° às 2 h** (a folga do Selo) em `--atencao` (espera) ou `--alarme` (falhou).
- **Coluna**: cápsula 9 × 64 (r 4,5) com degradê `--t2` (topo) → `--t1` → `--t0` (base); **núcleo branco** de 2,6 px (o tubo de neon); **halo** = a mesma cápsula com desfoque 4, opacidade = brilho + 0,55 × luz. A coluna cresce de baixo para cima (`scaleY`, origem na base).
- **Arcos de visitante** r 49, 64° cada, na cor da pessoa com brilho (desfoque 1,3); o primeiro no topo (−90°), depois −150°, −30°, 150°, 30°.

### 3.2 Os sete estados

| estado | anel de estado | coluna (altura de repouso · cor) | brilho | movimento | `prefers-reduced-motion` |
|---|---|---|---|---|---|
| `shell` | nenhum | 28 % · degradê | 0 (só o nível) | a coluna respira com a saída (eco de tecla ≈ 20 %) | altura fixa; o nível vira só brilho |
| `rodando` | laço 90° girando 1,2 s | 46 % → sobe com o nível | 0,22 + nível | laço + coluna seguindo bytes/s | laço parado (arco estático) + "rodando há N s" |
| `terminou` | fecha em 180 ms, `--t0`, esfria em 6 s | 34 % · degradê | 0,08 + luz | pulso + faíscas (§6) | anel já fechado, aba acesa, sem pulso nem faísca |
| `espera` | aberto (folga às 2 h), `--atencao` | 72 % · âmbar 80 % | 0,3 | nenhum (é estado, não evento) | igual |
| `pausado` | nenhum | 22 % · `--sem-dado` 94 % | 0 | esfria em 600 ms (cor) | troca direta |
| `desligado` | nenhum | contorno pontilhado `--sem-dado` | 0 | nenhum | igual |
| `falhou` | aberto (folga às 2 h), `--alarme` | 40 % · vermelho 72 % | 0,2 | pulso vermelho até a aba | anel aberto vermelho, sem pulso |

O nível vem dos **bytes de saída por segundo** (janela de 1 s, escala logarítmica: eco de tecla ≈ 0,2 · 10 KB/s ≈ 0,8 · 100 KB/s = 1), sobe em 60 ms, desce em 380 ms e **esfria sozinho** (meia-vida de 500 ms depois de 400 ms sem saída). Sem saída, a coluna volta à altura do estado: nada pulsa em repouso (R1).

### 3.3 A mini (18 px, 14–22 px aceitos)
Aro r 42 (traço 6 no viewBox ≈ 1 px), anel de estado r 45 (traço 9), coluna 22 × 60 (≈ 4 × 11 px) com o mesmo degradê; mesmos sete estados e mesmos arcos de visitante. Sem textura, sem agulha, sem marcas (a 18 px viram borrão; o anel da imagem vira "rosca escura", `midia.json`). Nas abas, na parede e no rodapé.

---

## 4. A parede de terminais (atividade Terminais)

A parede é outra vista (não cabe no painel). Três camadas, de cima para baixo:

### 4.1 A constelação da sala (`BC.organismo.Constelacao`)
- Faixa de até 250 px de altura, fundo `--s0`, sem moldura. Centro: círculo de 36 (preenchido `#0e0f22`, traço `--t2`) com o nome da sala em Cormorant 15 (`--latte`), a voz humana. Em volta, numa elipse 225 × 105, **um nó por terminal da equipe** (agente · pessoa, mono 11 `--apagado`): miolo de 5 com traço na cor da pessoa, anel de 10 que mostra o estado (tracejado girando = rodando; âmbar = espera; vermelho = falhou; cinza = pausado; pontilhado = desligado).
- **Raios** do centro a cada nó, 1 px `rgba(42,213,229,.22)`, saindo da borda do centro (nunca cruzam o nome da sala).
- **Evento**: saída num terminal acende o nó e o raio (meia-vida 6 s); **terminou** acende e manda um **pulso do nó até o centro** (600 ms; forte se passou de 10 s); controle ativo = **laço tracejado** na cor de quem entrou, do nó dele ao nó do terminal que ele controla. É a `imag-parede.jpg` feita de dados reais, sem texto em pixel.
- Quando alguma coisa conclui na sala, o chão da faixa acende em degradê roxo → ciano a 10 % × `--luz` (9 s) e esfria.

### 4.2 Os cartões-instrumento (um por terminal)
- Grade `auto-fit, minmax(300px, 1fr)`, gap 12. Cartão `--s1`, borda 1 px `--linha-fraca`, **fita de 3 px à esquerda na cor da pessoa** (vira `--sem-dado` pausado/desligado), raio 8, sem cartão dentro de cartão.
- **Topo 44 px**: anel de 22 px na cor da pessoa com iniciais (ou foto dentro) · **mini presença 18 px** · nome do agente (Plex 12,5 Medium) · "· pessoa" (mono 11 `--apagado`) · à direita o selo de estado: **"● ao vivo"** `--t0` · **"● pausado por Rita"** `--fraco` · **"● Theus aqui"** na cor de quem controla.
- **Tela 118 px** (12 linhas): o xterm de quem assiste, só leitura, 11 px, mesmo tema e mesmo degradê; pausado = "transmissão pausada por X" e a tela dessatura (o que saiu durante a pausa nunca chega, PROTOCOLO §3).
- **Hairline de 1 px no topo do cartão** (`--t2 → --t0`, opacidade `--luz`): acende a cada pedaço de saída e esfria em 6 s. É a única luz do cartão além da mini presença.
- **Pé**: frase do estado (`npm · terminou · 14:32 · 42 s`) e os botões de texto **Entrar** / **Pedir para entrar** (conforme a permissão; CHECKLIST §2), **Chamar**, **Falar**. Um clique no cartão **amplia** (a tela vai para o meio, com o campo de digitar quando há controle).
- Cartão controlado por alguém: borda 1 px na cor de quem controla a 55 %; a mini presença ganha o arco dessa cor.

### 4.3 Relevância (R7, CONCEITO lei 3)
**A parede nunca toca som.** Os terminais dos outros acendem, mudam de estado e pulsam para o centro; o som é só do que é meu (o meu terminal terminou, o meu `claude` me espera, alguém entrou no meu terminal), e ele sai do painel.

---

## 5. O selo "X está no seu terminal Y"

| Onde | O que aparece | Entrada | Saída |
|---|---|---|---|
| Painel do dono (§2.3) | linha "Carla está no seu terminal Aurora · Encerrar" | 180 ms por opacidade + arco na presença (240 ms) + 'duas' | Encerrar (`controle-encerrar`) ou `controle-fim`: arco recolhe 240 ms, a linha some; sem som |
| Aba do dono | arco na cor da pessoa na mini presença | junto | junto |
| Rodapé do dono | casa "controle": "Carla está no seu terminal · Encerrar" | junto | junto |
| Parede (todos) | selo "● Carla aqui" no cartão + borda na cor dela + laço na constelação | luz 6 s | some |
| Tela de quem entrou | cabeçalho do ampliado: "você está no terminal de Rita · Sair" (`controle-sair`) | — | — |
| Pedido pendente (sem permissão direta) | na tela do dono: "Carla pede para entrar no seu terminal Aurora · Aceitar · Recusar" com o Selo aberto (anel tracejado na cor dela, CONCEITO lei 2); aceitar = selo fecha, "OK · Theus · 14:32" | aba acende, sem som | — |
| Tecla recusada (`term-recusado`) | na tela de quem tentou: o terminal respira em vermelho (700 ms) + o motivo em texto | — | — |

---

## 6. A tabela: evento real → chamada → efeito → som → duração

Cada linha é uma mensagem do PROTOCOLO (§3–§5) chegando à tela local pelo `BC.real.ouvir`. A coluna "chamada" é o que `BC.organismo.vincular(...)` já faz (a tabela é código, §8). Durações medidas na demonstração servida pelo servidor do app (porta 4861), no Google Chrome 154 sem janela (`resultado.json`).

| # | Evento real (mensagem) | Chamada | Efeito | Som | Duração medida |
|---|---|---|---|---|---|
| 1 | aba nova aberta pela pessoa (`term-aberto`) | `v.aberto()` | a presença nasce acordando; a aba acende (6 s) | `acordar` (1175 Hz, 70 ms, ganho 0,035) | acordar 245–248 ms |
| 2 | **Enter enviado** (`term-entrada` com `\r` do dono) | `v.enter()` → `presenca.acordar()` | a coluna sobe até o topo e assenta; a mini da aba acende | — (pedido enviado não soa, REGUA §2) | 245–248 ms (n = 5) |
| 3 | **bytes de saída** (`term-saida`, `dados.length`) | `v.saida(dados)` → `presenca.bytes(n)` · `marca.nivel()` | coluna, agulha, halo e marcas seguem bytes/s; o "b" brilha junto; hairline do corpo acende | — | contínuo; esfria 0,5 s após 0,4 s sem saída |
| 4 | **rodando** (`term-atividade {estado:'rodando', processo, desde}`) | `v.atividade(m)` | laço 1,2 s; cabeçalho "→ npm · Aurora · rodando há 4 s" (relógio de 1 s só enquanto roda) | — | enquanto roda |
| 5 | **terminou, < 2 s** | `v.atividade(m)` | anel fecha (180 ms) e esfria; a aba acende (6 s) | — (era o esperado, R2) | 180 ms + 6 s de meia-vida |
| 6 | **terminou, 2–10 s** | `concluido(presenca, aba, {duracao})` | **pulso roxo → ciano** da coluna até a aba, com rastro; ao chegar, a aba acende e **4 faíscas** | `tique` (880 Hz, 80 ms) | pulso 603 ms · faíscas 866 ms |
| 7 | **terminou, > 10 s** (R2: mais esforço, mais luz) | idem, `forte` | pulso forte (bolinha 1,6×, 520 ms) + **8 faíscas** | `tique` | pulso 523–536 ms · faíscas 866 ms |
| 8 | **terminou, > 60 s** | idem + `respirar(corpo)` | + o terminal inteiro **respira** (borda de luz que sobe e esfria) | `duas` (660 → 880 Hz, 0,33 s) no lugar do tique | respirar 1215 ms |
| 9 | **erro provável** (terminou e o fim da saída casa `/error\|erro\|failed\|falhou\|✖\|not found\|Traceback/i`; ou `term-fim` com código ≠ 0) | `v.atividade(m)` com `erroProvavel` · `falhou(presenca, aba)` | anel aberto vermelho, coluna vermelha; **pulso vermelho** até a aba | `erro` (311 → 233 Hz, triângulo, 0,3 s) | pulso 610 ms |
| 10 | **o `claude` espera** (`term-atividade {estado:'espera'}`: processo claude na frente, 1,5 s sem saída) | `v.atividade(m)` | anel **âmbar** aberto, coluna âmbar, aba acende; mini âmbar na aba | `espera` (659 → 988 Hz, triângulo, 0,26 s) **só se a janela está sem foco ou o foco está fora do terminal** (`foraDeFoco(corpo)`) | estado (sem prazo) |
| 11 | **alguém entrou no meu terminal** (`controles`: controle `ativo` novo numa sessão minha) | `v.visitantes([{id, nome, cor}])` | **arco de luz na cor da pessoa** na presença e na mini (desenha em 240 ms, brilha e esfria para 72 %); selo do §2.3; aba acende | `duas` | arco 240 ms · selo 300 s de meia-vida |
| 12 | saiu / encerrado (`controle-fim`, lista sem ele) | `v.visitantes(lista)` | arco recolhe (240 ms); o selo some | — | 240 ms |
| 13 | **pausa** (`term-pausa {pausada:true}` ou `estado:'pausado'`) | `v.pausa(true)` | **esfria para `--sem-dado`** (600 ms): coluna cinza, halo e agulha apagam, textura a 5 %, o "b" apaga; "● pausado" | — | 600 ms |
| 14 | retomar (`term-pausa {pausada:false}`) | `v.pausa(false)` | volta ao estado anterior, a presença acende 1,5 s | — | 1,5 s |
| 15 | o shell saiu (`term-fim {codigo:0}`) | `v.fim(0)` | presença **desligada** (contorno pontilhado) | — | imediato |
| 16 | o shell caiu (`term-fim {codigo≠0}`) | `v.fim(codigo)` | falhou + pulso vermelho | `erro` | ≈ 610 ms (o mesmo pulso da linha 9) |
| 17 | tecla minha recusada no terminal de outro (`term-recusado`) | `v.recusado()` | o terminal ampliado respira em vermelho | — | 726–738 ms (700 pedidos) |
| 18 | parede: saída num terminal de outro | `v.saida` (meu: false) · `con.acender(id,{pulso:false})` | hairline do cartão + nó e raio acendem | — (a parede nunca soa) | 6 s de meia-vida |
| 19 | parede: terminou num terminal de outro | `v.atividade` (meu: false) · `con.acender(id)` | anel da mini fecha; **pulso do nó ao centro** da constelação; chão da sala acende | — | pulso 522 ms |
| 20 | parede: controle entre dois terminais | `con.laco(de, para, cor)` | laço tracejado na cor de quem controla | — | enquanto durar |
| — | meta semanal a 100 % (fora do terminal; REGUA §2) | `som('tres')` | anel da meta fecha em ouro | `tres` (523 → 659 → 784 Hz, 0,39 s) | 800 ms |

Nenhum efeito atrasa a digitação: `term.write` nunca espera animação; efeitos em canvas, `transform` e `opacity`; o motor não tem laço síncrono (medido: 53 teclas com 15 efeitos pedidos durante a digitação, tecla → próximo quadro p95 14,4 ms, nenhuma tarefa longa, §9).

---

## 7. A régua dentro do motor (o que `organismo.js` garante sozinho)

- **R1 · luz só com evento**: sem chamada, nada roda. O canvas de efeitos fica escondido e sem `requestAnimationFrame`; a meia-vida para o relógio quando o último elemento esfria; a coluna só tem quadro enquanto se mexe (em saída constante ela é conferida a 8 Hz por `setTimeout`, sem quadro).
- **Teto de 2 efeitos vivos** (pulso, faíscas, respirar, acordar). O terceiro é **descartado**, a não ser que tenha prioridade maior (pulso > faíscas = respirar > acordar): aí o de menor prioridade termina na hora (um pulso cancelado chega na hora, então quem esperava por ele segue).
- **Faíscas ≤ 24** partículas vivas na tela inteira (medido: pedido de 30 → 24). Elas sobem de 10 a 65 px e apagam; perto do topo da janela (y < 90 px, as abas), elas caem, para não saírem da tela.
- **R9 · tudo desligável**: som (`babel-coop:som`), efeitos (`babel-coop:efeitos`: desligado = cor sem movimento, como o reduced motion), neon (`babel-coop:neon`, do painel). Nenhum efeito bloqueia: a lógica de quem chama nunca espera a animação (um pulso chega em `duracao + 400 ms` mesmo com a janela escondida).
- **`prefers-reduced-motion` = cor sem movimento**: pulso e faíscas não acontecem (quem chamou recebe o `aoChegar` na hora); respirar vira borda parada por 1,2 s; laço parado; a meia-vida vira três degraus (aceso · morno · repouso); a coluna fica na altura do estado e o nível vira só brilho.
- **Som**: Web Audio, osciladores, ganho de pico ≤ 0,08 (medido: 0,07), ligado por padrão na Estação, nunca na TV nem no iPad (`#tv`, `#ipad` ou `<html data-vista="tv|ipad">`; na TV `ligarSom(true)` não liga e não mexe na preferência da Estação). O mesmo som no máximo a cada 120 ms; no máximo 6 sons por segundo. No navegador o áudio destrava no primeiro gesto da pessoa; no Electron toca sem gesto.

### 7.1 Os sons

| nome | notas | onda | ganho | duração | quando |
|---|---|---|---|---|---|
| `tique` | 880 Hz · 80 ms | seno | 0,07 | 0,08 s | comando terminou (2 s – 60 s) |
| `duas` | 660 → 880 Hz | seno | 0,07 | 0,33 s | alguém entrou no meu terminal · comando longo (> 60 s) terminou |
| `tres` | 523 → 659 → 784 Hz | seno | 0,07 | 0,39 s | meta semanal a 100 % (reservado) |
| `espera` | 659 → 988 Hz | triângulo | 0,06 | 0,26 s (≤ 0,3) | o `claude` espera e eu olhei para outro lado |
| `erro` | 311 → 233 Hz | triângulo | 0,06 | 0,30 s | erro provável · shell caiu |
| `acordar` | 1175 Hz · 70 ms | seno | 0,035 | 0,07 s | aba de terminal nova |

---

## 8. A API `BC.organismo` (o que os outros módulos usam)

Carregar **depois de `ponte.js` e antes de `terminal-real.js` e `parede-real.js`** (lista `INJETAR` do servidor: `/coop/organismo.js`).

```text
BC.organismo.versao · limites {efeitos:2, faiscas:24, luzes:200, ganho:0.08} · estados [7] · sons [6] · texturaAnel (url | false)
som(nome, {seForaDeFoco: Element}?) → bool      nomes: 'tique' | 'duas' | 'tres' | 'espera' | 'erro' | 'acordar'
somLigado() → bool · ligarSom(bool) → bool · foraDeFoco(el) → bool · naTV() → bool
faiscas(alvo: Element | {x,y}, n, forte, {cor, onde}?) → número lançado
pulso(de, para, {cor: 'marca'|'ok'|'alarme'|'atencao'|'#hex', forte, duracao, aoChegar}) → Promise
acender(el, mvMs) · apagar(el) · respirar(el, {cor, duracao}?) → bool · reduzido() → bool
efeitosLigados() · ligarEfeitos(bool) · semMovimento()
concluido(de, para, {duracao, faiscas, respirar: Element}) → Promise    (linhas 6–8 da tabela)
falhou(de, para) → Promise                                              (linha 9)
new Presenca(container, {tamanho: 'grande'|'mini', estado, dados})
   .estado(estado, dados) · .estadoAtual() · .nivel(0..1) · .bytes(n) · .nivelAtual() · .acordar()
   .visitante(cor | [cores] | null) · .origem() · .destruir() · .el
new MarcaB(container, {neon}) .ligar(bool) · .ligado() · .nivel(0..1) · .pausa(bool) · .destruir()
new Constelacao(container, {centro, rotulo, rx, ry}) .no(id, {nome, cor, estado}) · .estado(id, e) · .acender(id, {cor, forte, pulso})
   · .laco(deId, paraId, cor | null) · .remover(id) · .destruir()
vincular({presenca, mini, aba, corpo, marca, meu, erroProvavel}) → sessão:
   .saida(dados) · .enter() · .atividade(msg) · .pausa(bool) · .visitantes([{id,nome,cor}]) · .fim(codigo)
   · .aberto() · .recusado() · .estado() · .dados() · .frase() · .destruir()
frase(estado, dados) · duracaoTexto(ms) · hora(ms) · nivelDeBytes(bps)
vivos() · contagem() · registro() · zerar() · ouvir(fn)      (instrumentação: os testes contam sons e efeitos por aqui)
```

### 8.1 Como o painel liga uma sessão (esboço para `terminal-real.js`)

```js
var O = BC.organismo;
var grande = new O.Presenca(cabecalhoEl.querySelector('.presenca'), { tamanho: 'grande' });
var mini = new O.Presenca(abaEl.querySelector('.ic'), { tamanho: 'mini' });
var marca = new O.MarcaB(corpoEl.querySelector('.marca'), { neon: neonLigado });
var fimDaSaida = '';
var s = O.vincular({ presenca: grande, mini: mini, aba: abaEl, corpo: corpoEl, marca: marca, meu: true,
  erroProvavel: function () { return /error|erro|failed|falhou|✖|not found|Traceback/i.test(fimDaSaida.slice(-2048)); } });
term.onData(function (d) { BC.real.enviar({ tipo: 'term-entrada', dono: eu, id: id, dados: d }); if (d.indexOf('\r') >= 0) s.enter(); });
BC.real.ouvir(function (m) {
  if (m.id !== id || (m.dono && m.dono !== eu)) return;
  if (m.tipo === 'term-saida') { term.write(m.dados); s.saida(m.dados); fimDaSaida = (fimDaSaida + m.dados).slice(-4096); }
  else if (m.tipo === 'term-atividade') { s.atividade(m); pintarCabecalho(s.frase()); if (m.estado === 'rodando') fimDaSaida = ''; }
  else if (m.tipo === 'term-pausa') s.pausa(m.pausada);
  else if (m.tipo === 'term-fim') s.fim(m.codigo);
});
/* controles: a cada {tipo:'controles', lista}, os ativos nesta sessão viram visitantes */
s.visitantes(lista.filter(ativoNestaSessao).map(function (c) { return { id: c.quem, nome: nomeDe(c.quem), cor: corDe(c.quem) }; }));
```
Só a presença da aba **ativa** vai no cabeçalho; as outras sessões usam `vincular({ mini, aba, meu: true })` sem `presenca` (o pulso sai da mini).

---

## 9. Evidência (o que foi medido de verdade)

Roteiro: `.deus/terminal-ao-vivo/evidencias/organismo/verificar-organismo.js` (Playwright 1.63, Google Chrome 154 do sistema sem janela, `http://localhost:4861/coop/organismo-demo.html` servido pelo servidor do app numa raiz temporária). Resultado inteiro em `resultado.json` da mesma pasta.

- Console: **0 erros, 0 avisos, 0 falhas de rede, 0 erros de página** (Estação, TV e reduced motion).
- Sons (contados pelo motor e, por fora, pelos osciladores iniciados no Web Audio): build 14 s = 1 `tique`; npm 3 s = 1 `tique`; espera com foco fora = 1 `espera`; espera com foco no terminal = 0 (segurado, `em-foco`); Carla entra = 1 `duas`; erro provável = 1 `erro`; aba nova = 1 `acordar`; instalação 75 s = 1 `duas`; pausa, shell saiu, parede = 0. Osciladores iniciados na sessão inteira: 14, frequências 880 · 880 · 880 · 659/988 · 660/880 · 311/233 · 1175 · 660/880 · 660/880. Ganho de pico medido 0,07. TV: 3 pedidos, 0 osciladores, `ligarSom(true)` recusado, preferência da Estação intacta. Som desligado: 0 osciladores, preferência `'0'` guardada.
- Durações: acordar 245–248 ms (n = 5) · pulso 522–614 ms (n = 6) · faíscas 866–890 ms (n = 5) · respirar 1215 ms (e 726 ms no pedido de 700).
- Teto: 3 efeitos pedidos juntos → 2 vivos, o terceiro descartado; 30 faíscas pedidas → 24.
- Digitação com efeitos: 53 teclas a 25 ms com 15 efeitos pedidos no meio e saída de 16 KB/s: tecla → tratamento p95 0,2 ms; tecla → próximo quadro p50 7,6 ms e p95 14,4 ms; 0 tarefas longas; no máximo 2 efeitos vivos.
- Repouso: depois de tudo, 0 efeitos vivos e canvas escondido.
- `prefers-reduced-motion`: pulso, faíscas e acordar registrados como "sem movimento", o canvas nem foi criado, laço sem animação; o `tique` continua (som não é movimento).
- Prints: `00` página, `01` os sete estados, `10–19` o painel em cada estado (shell, rodando, pulso em voo, faíscas, terminou, espera, visitante, pausado com o "b" apagado, falhou, desligado, tecla recusada, rito longo), `20` teto, `20b` 24 faíscas, `21–23` constelação e parede, `24–25` reduced motion.

---

## 10. O que não entra

Luz, pulso ou som sem mensagem do servidor · loop decorativo · brilho em repouso (fora o "b" em neon ligado, que só brilha com saída, e o ponto "ao vivo", que é estado) · som na TV, no iPad ou na parede · som por tecla · som antes do primeiro gesto (no navegador) · recompensa aleatória, pontos por tempo, ranking (R3, R4) · texto em pixel nas imagens · o anel com os números do mostrador · animação ao trocar de aba ou abrir pasta · qualquer efeito que faça `term.write` esperar.
