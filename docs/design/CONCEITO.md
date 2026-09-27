# CONCEITO · o design novo do Babel Coop

> Missão `babel-coop/design-2030` · 23/09/2026 · versão final (v2, depois das quatro críticas). Nasceu de 7 frentes de pesquisa (`docs/ESTUDO_DESIGN_2030.md`), 4 conceitos concorrentes, 3 juízes, uma síntese e 4 críticos adversariais (excesso · pastiche · empresário sério · viabilidade). As notas completas estão em `.deus/missao-design/pesquisa/` (`conceito-*.md`, `conceito-final.md`, `conceito-final-v2.md`).
> Regra que governou tudo: **proibido remover o que o Theus pediu** (`docs/FUNCOES.md` A–L). Nada sai; muda só onde mora e como se vê.

---

## 0. Em uma frase

O Babel Coop é **um instrumento calmo**: à esquerda o que existe (Arquivos), no meio o que está sob trabalho (Trabalho), à direita quem lê e age sobre isso (Agentes). Ele diz sempre **sobre o que o agente está agindo**, **quem consentiu o quê, com nome e hora**, e **o que acabou de mudar**, e **esfria quando nada acontece**.

A identidade que o Theus pediu fica inteira (fundo `#060b16`, roxo → azul → ciano, o "b", Cormorant + IBM Plex + JetBrains Mono), mas muda de gramática: o degradê deixa de ser fundo e vira **escala de tempo**; o neon deixa de ser enfeite e vira **medidor de estado**; a serifa deixa de ser título e vira **voz humana**.

---

## 1. Como foi escolhido (aceite A2)

| Conceito (ângulo) | Mecanismo novo | Juiz 1 | Juiz 2 | Juiz 3 | Soma |
|---|---|---|---|---|---|
| **Observatório · Meia-vida** (silêncio) | luz de cada sinal = idade do último evento real; o degradê vira eixo do tempo; um evento acende os três lugares que tocou | 43 | 47 | 43,5 | **133,5** |
| **VISADA · Catálogo, Campo e Mesa** (instrumento) | o painel de agentes lê o objeto ativo (cabeçalho de 56 px com nome, quem está com ele, estado do agente) e as receitas mudam com o objeto | 45 | 44 | 43 | 132 |
| **Lacre · a corte silenciosa** (corte) | consentimento como anel de 16 px em três estados (aberto · selado por · rompido por), o mesmo objeto nas três colunas | 40 | 43 | 45 | 128 |
| **Bancada Viva · Trilho** (bancada) | o meio toma a forma da peça; Puxar (seleção → campo do agente vira chip com verbos); peça que espera antes de pousar | 37 | 40 | 37 | 114 |

A síntese partiu da soma dos quatro: **Meia-vida** (lei da luz) + **cabeçalho do painel de agentes** (VISADA) + **Selo em três estados sem "segurar"** (Lacre) + **Puxar e a espera** (Bancada). Os juízes mandaram cortar: a linha do agente por cima do texto, o catálogo de 12 metáforas de ufologia, guildas e vocabulário de corte, o hold de 400 ms, a bancada que morfa, repouso em Lc 60 e ações só no hover.

Depois, quatro críticos tentaram derrubar (§12). Todos refutaram a v1; nenhum tocou na espinha. A v2 é o que sobrou.

---

## 2. As quatro leis (e só quatro)

Os nomes abaixo são de **código e documento**. Na interface nenhum deles aparece (§10).

### Lei 1 · O painel de agentes diz sempre onde está apontado
Cabeçalho fixo de 56 px no topo do painel da direita (`--s2`):
- linha 1: `→ landing.html` (o objeto da aba ativa do meio; mono 12 px Medium) + tipo;
- linha 2: iniciais de quem está com o objeto (anéis de 14 px na cor de cada pessoa) + estado do agente em palavras: **"pensando há 4 s"** (medido, mono tabular) enquanto roda · **"terminou · 14:32"** quando parou · **"espera o seu OK"** quando espera;
- anel de estado de 14 px, traço 1,5 px: desenha-se em laço enquanto pensa (1,2 s), fecha em 180 ms ao terminar, fica aberto e parado na falha (com o próximo passo ao lado);
- botão **Seguir** (24×24) quando o agente está em outro objeto; **"1 peça esperando · Enter"** quando há peça na espera.
- As **receitas** (≤ 3 chips) mudam com o objeto: arquivo = Explicar · Projetar · Pedir ajuda; Máquina = Testar · Publicar · Ver montando; WhatsApp = Responder · Sugerir; Reunião = Marcar decisão · Salvar ideia. Sem objeto: as 3 mais usadas pela pessoa. As 8 receitas do FUNCOES.md ficam todas no grupo "Receitas" da paleta Ctrl K.

**Quando o agente toca outro objeto** (abre arquivo atrás, encaixa peça, navega): a aba do objeto ganha 1 px na cor da pessoa dona do agente, a linha do arquivo na árvore acende e o bloco do painel acende, **juntos** ("um evento, três luzes", lei 3), esfriando em 6 s. Uma linha tracejada 2/3 na cor da pessoa corre pela hairline que já existe sob a fila de abas (32 px nos dois painéis, `--trilho-y`), do canto do cabeçalho até a aba tocada; se a aba está fora da rolagem, termina na borda visível com um tique de 4 px. Ela nasce em 240 ms uma vez e depois é cor estática esfriando com as luzes. **Nunca desce pela árvore, nunca cruza texto de trabalho.** O meio da pessoa não se move, com uma exceção: o arquivo que o agente escreve nasce à vista no meio, descendo linha a linha; se a pessoa está digitando, a aba entra sem roubar o foco (revisto em 25/09/2026: vale o organismo vivo — Theus, 24/09: "quando pedir pro terminal gerar um arquivo, ai no meio da tela, aparece o arquivo e ai ele vai descendo"). Plano de retirada: se confundir no teste, a linha some e sobra cabeçalho + três luzes.

**Seguir** (botão ou tecla S com o painel em foco) faz o meio acompanhar o agente; abrir qualquer outra aba encerra. **Ver antes/depois (Espaço)**: segurar Espaço sobre um bloco de ação mostra no meio o antes/depois daquela ação; soltar devolve; nada é gravado.

### Lei 2 · Todo consentimento deixa nome e hora no objeto (o Selo)
Uma só primitiva para os seis consentimentos do FUNCOES.md (OK da demanda · "Confirma? s/N" · aceitar Sugerir mudança · aceitar entrar no terminal · Publicar vN e Atualizar · Salvar como preset · Voltar como estava): um **anel de 16 px, traço 1,5 px**, com três estados persistentes no objeto e no histórico:
- **ABERTO**: folga de 60° às 2 h, tracejado 2/2. Espera o **meu** OK = `--atencao` (a mesma cor do bloco "espera"); espera o OK de outro = cor dessa pessoa.
- **SELADO**: anel fechado + iniciais de quem selou; ao lado, escrito, sem hover: **"OK · Carla · 14:32"**.
- **ROMPIDO**: o anel volta a ABERTO + ponto de 3 px à esquerda na cor de quem rompeu. Quando desfaço a minha própria ação: **"Desfeito por Davi · 15:10"**. Quando alguém desfaz o OK de outro: **"Rompido por Davi · 15:10 · voltou como estava"**. O selo original fica no histórico.

O botão é **sempre texto** (OK · Aceitar · Publicar v4 · Salvar preset) com o anel como ícone à esquerda. O anel sozinho só na linha da árvore e no canto do cartão de resultado. Gesto = clique, Enter ou a tecla pedida (s/N); fecha em 180 ms; **sem segurar nada**. Só o OK de quem pediu a demanda ganha o momento-herói "selo abre" (400 ms). É um só objeto renderizado nas três colunas (linha do arquivo/ficha da demanda · cabeçalho do objeto · bloco de resultado); hover ou foco em qualquer um acende os outros dois (120 ms). Duas pessoas no mesmo objeto = dois anéis de 14 px sobrepostos −4 px; 3+ = anel + "+N". Rotina continua clique simples, sem selo.

### Lei 3 · Nada tem luz fixa (a Meia-vida)
Todo sinal da casca carrega `data-t` = instante do último evento real que importa **para mim**. Luz = 2^(−(agora − t)/meia-vida). Cor = `color-mix(in oklch, var(--texto-90), var(--t0) calc(var(--luz) * 100%))`.
- `--mv-curta` 6 s: tecla ecoada, bloco do agente, "salvo", "recebido de X", "Atualizar vN", validação inline, luz de evento na aba/árvore/bloco.
- `--mv-media` 300 s: presença (ponto cheio = agora · 50 % = 5 min · contorno = hoje), memória da sala, "X está no seu terminal".
- `--mv-longa` = um expediente (Equipe → Regras): só no cabeçalho "mudaram por último" dos Arquivos e na evolução da TV. Aqui o degradê vira eixo de tempo (`--t0` ciano = agora · `--t1` azul = hoje · `--t2` roxo = antes) **numa marca de 6 px ao lado do nome**, nunca no texto (roxo e azul reprovam em APCA abaixo de 18 px).
- **Relevância**: só acende o que tocou meus objetos, os do meu projeto ou algo dirigido a mim. Com 11 pessoas e agentes, a casca não vira mapa de calor.
- Repouso = `--texto-90` (Lc 77) para nomes; piso `--apagado` (Lc 63). Implementação: um `requestAnimationFrame` a 4 Hz sobre ≤ 200 elementos. `prefers-reduced-motion` = três degraus discretos (aceso · morno · repouso).
- Substitui badge, toast, ponto pulsante e selo "salvo" fixo. O mesmo evento acende os três lugares que tocou.

### Lei 4 · O que está na frente pode ser puxado para o agente (Puxar)
Arrastar qualquer seleção do meio (trecho, peça da Máquina, galho do mapa, bloco de tela, cartão) ou linha da árvore até o campo ❯, ou **Ctrl+Enter** com foco (Ctrl+→ é do macOS), vira um **chip** (glifo 14 px + nome, contorno, nunca cheio) no campo; as receitas trocam para os verbos daquela peça (fade 120 ms); campo e cursor não mudam de lugar; Backspace tira o chip. No ⋯ o gesto se chama **"Levar para o agente"**.
A volta: Enter num bloco de ação pousa a peça no meio; se a pessoa está digitando, a peça **espera** no cabeçalho ("O agente terminou uma tabela · Enter abre") e só pousa depois de 2 s sem tecla ou com Enter. Sem quarta coluna, sem morph.

Fecham-se assim os quatro buracos da régua agentic da peneira: estado visível (anel), o que consultou (bloco consulta), parar (■ no ❯ e Esc), próximo passo na falha (bloco falha).

---

## 3. Layout (aceite A4)

### 3.1 Esquerda · ARQUIVOS (56 + 264 px)
- **Barra de atividades 56 px**: 12 ícones de 20 px + **rótulo 11 px Plex Medium embaixo, ligado por padrão e permanente** (some só por preferência da pessoa). Ordem da peneira: Meu dia · Criar · Trabalho (Demandas + Tarefas) · Chat · WhatsApp · Reunião · Terminais · Projetos · Acervo (+ Inteligência) · Equipe (+ Metas + Mapa) · Loja · Oficina. Ativo = ícone em `--texto` + traço de 2 px `--t0` na borda esquerda, sem fundo colorido; número mono 11 px só quando > 0; foto 22 px no pé abre o Perfil.
- **Lateral 264 px** (208–424, passo 8, borda arrasta, Ctrl B recolhe): filtro 28 px; cabeçalho "mudaram por último" com a marca de 6 px na escala de tempo; grupos com rótulo 11 px caixa-alta tracking 0,08 em `--fraco`; linhas 24 px (compacta 20): ícone 14 px · nome 13,5 px Plex Medium `--texto-90` · à direita foto 14 px de quem salvou, presença como anel de 6 px (meia-vida média) e, quando houver, o Selo do objeto (12 px); "recebido de X" = selo aberto do remetente; computador desligado = ficha pontilhada.
- Ações no hover/foco **e** no ⋯ de 24×24 **e** na paleta (Projetar · Levar para a reunião · Pedir ajuda · Chamar para cá · Enviar para <pessoa> · Sugerir mudança · Versões): nada só no hover. Um só **+** (Nota · Mapa · Quadro · Tela · Máquina · Pesquisa · arquivo · subir). Seletor Sozinho ↔ projeto no topo; em projeto, árvore por membro (a minha primeiro), "N pessoas com você agora" (anéis sobrepostos quando duas estão no mesmo arquivo).
- Superfície `--s0` sempre. Divisória com o meio: 1 px `--linha` (Lc 16). Zero animação ao abrir pasta, filtrar ou passar o mouse; arrastar arquivo para pessoa não voa: a linha dela acende e o selo "recebido de você" aparece pronto.

### 3.2 Meio · TRABALHO
- **Abas 32 px** (ícone 14 + nome 12,5 px Medium; × só no hover/foco com alvo 24×24; ✕✕ fecha todas). A hairline sob as abas é o trilho da lei 1 e cruza meio e direita sem degrau (`--trilho-y: 32px`). Aba ativa = segmento de 2 px `--t0`; aba tocada por agente = 1 px na cor da pessoa esfriando em 6 s. Com Máquina ou `.html` aberto, rótulo `local · ramo · produção` em mono 11 px à direita da fila.
- **Troca de aba instantânea** (< 100 ms). Crossfade de 180 ms só quando um evento substitui o conteúdo da **mesma** aba (agente pousou peça, versão restaurada).
- Conteúdo em `--s1` **sempre** (um degrau acima das laterais: o trabalho tem precedência). Cabeçalho do objeto 40 px: nome Plex 14/500, iniciais de quem está com ele, o Selo do objeto, barra de verbos sempre visível (Projetar · Levar para a reunião · Pedir ajuda · Chamar para cá · Editar/Salvar · Versões (n) · Formatado/Texto · Site | Código | 3D).
- A bancada toma a forma do objeto **sem morph**: folha (md, código, csv, pdf, imagem, vídeo, ata) · palco + ficha (Máquina, `docs/design/MAQUINA_PECAS.md`) · borda infinita (quadro, mapa mental MindForge) · Site | Código | 3D (html, `docs/design/TELA_CONSTRUTOR.md`) · mesa (Reunião) · aba Navegador (agente/pessoa, com Raio-X) · aba Revisar mudanças (aceitar/rejeitar por trecho, cada aceite com Selo). Abas e status fixos.
- Bloco mexido por alguém = borda 1 px na cor + iniciais. Qualquer seleção pode ser puxada até o ❯.
- **Vazio** = `--s1` liso + "Nada aberto · Ctrl K" (13 px, `--fraco`). Sem ponto, feixe, grade ou marca-d'água. A grade de pontos de 8 px a 2,5 % existe só onde há encaixe: palco da Máquina, quadro, iPad.
- Modos que tomam a tela (Reunião, Projeção, Quadro): Ctrl Shift B esconde as laterais. Fundo gerado por IA nunca atrás de texto de trabalho; nenhuma linha, contorno ou véu por cima do trabalho. "?" de 24×24 em `--fraco` no cabeçalho de cada atividade abre uma linha de ajuda em `--apagado` (Esc fecha), no lugar dos 46 textos de ajuda.

### 3.3 Direita · AGENTES (360 px, 312–520, Ctrl ` recolhe)
- **Abas de agentes 32 px**: agente = **quadrado de 14 px (raio 2), contorno 1,5 px na cor da pessoa dona, inicial mono 10 px dentro** (com foto, a foto vai dentro do quadrado); pessoa = círculo. Quadrado × círculo distingue sem legenda. ⋯ do agente: renomear · apagar · **Pôr foto · Trocar · Tirar**. O bitmap 7×11 sobrevive só no Perfil do agente e na parede de Terminais, em ≥ 24 px (2 px por célula, `shape-rendering: crispEdges`), como assinatura opcional. À direita da fila: "ao vivo" = ponto 6 px `--t0` + palavra, só enquanto transmite (clique pausa/retoma).
- **Cabeçalho 56 px** (lei 1) em `--s2` sempre; agindo = anel em laço + borda tingida 12 % com a cor do agente.
- **Registro** (mono 12,5 px/1,5): blocos tipados em português, colapsados por padrão, fechados = imutáveis: **pedido** · **consulta** ("o que consultei", `--apagado`) · **plano** (numerado, editável antes de rodar) · **ação** (trilho 2 px `--ok` + desfazer 24 px = rompe o selo com nome e hora; Enter pousa a peça, Espaço vê antes/depois) · **resultado** (cartão com prova: miniatura 96×54 ou trecho; o Selo do objeto no canto; nunca cartão dentro de cartão) · **espera** (trilho `--atencao`, "Confirma? s/N" com botões e teclas; o Selo aberto) · **falha** (anel aberto + próximo passo em uma linha + "tentar de novo · fazer eu mesmo · pedir ajuda"). Comandos coop e shell como blocos comuns (comando, saída, código de saída, tempo). Apresentação do agente só na 1ª abertura. Progresso do agente vive aqui, nunca em toast.
- **Comando**: receitas 28 px (≤ 3 chips) + campo ❯ 36 px com verbo (sublinhado sólido 1 px) e objeto (pontilhado); chips de peças puxadas e pessoas mencionadas (contorno + glifo/foto 14 px); ■ parar 24×24 enquanto roda, Esc para.
- Recolhido: a oitava casa **"agentes"** do rodapé acende só enquanto o painel está recolhido (o "mostrar terminal" do FUNCOES.md A). A parede de Terminais ao vivo é outra vista (atividade Terminais), não cabe na coluna.

### 3.4 Topo e rodapé
- **Topo 32 px**: à esquerda o "b" em SVG 16 px, **estático** em `--texto` (único sinal de marca; preferência "luz da marca": nunca (padrão) · sempre · quando um agente meu age, em `--t0` a 4 px, nunca roxo); centro vazio; direita: sino 24×24 (número só quando > 0; abre a coluna de novidades), foto 22 px (Perfil), ícone Tela da TV. Saem "ESTAÇÃO · PROTÓTIPO" e "Ver como" (no protótipo, `#como=<pessoa>` e Ctrl Shift V continuam como ferramenta de teste).
- **Rodapé 24 px**: oito casas fixas com largura mínima (o texto não pula de lugar), **sem contorno**: presença · caixa ("3 esperando meu OK") · cronômetro (pílula 00:12:40, mono tabular; rodando = `--texto-90`, pausado = `--apagado`; sem disco; clique abre a caixa móvel/destacar) · sala ("ouvindo · 4 min" · ponto vermelho batendo só ao gravar · botões Salvar ideia falada · Gravar · Conversa particular) · projeção (▲ ▼ ✕) · controle ("Carla está no seu terminal · Encerrar") · atualizar (⬆ v23, baixa em fundo, avisa uma vez) · agentes (só com o painel recolhido). Casa apagada = espaço reservado invisível; acesa = mono 11 px Medium. A única linha do rodapé é a hairline superior. Nona casa transitória à direita: "Salvo na equipe" nasce a 100 % e esfria em 6 s. Uma notificação por vez. Saem do rodapé: "acervo: 76" (vai ao cabeçalho do Acervo), "TV não aberta" (ícone da TV), "terminal ao vivo" (painel de agentes).

### 3.5 TV, celular, iPad
- **TV** 16:9 sem botão (F = tela cheia): chão `--s0` (tema Noite); **Visita** = Cosmic Latte `#fff8e7` com texto `#060b16`; o roxo volta como tema **Ametista** derivado da fórmula OKLCH (base deslocada para ~300°), nunca como paleta à parte; escolha na Estação (ao lado de Tela da TV e no Ctrl K), no celular e por `coop tv`, nunca dentro da janela da TV (revisto em 25/09/2026: saiu a engrenagem da janela — CHECK_DO_THEUS.md:46, "A TV é um espelho… não tem botão"). Sem fundo que respira, sem loop; TV em espera = chão liso + b em SVG estático. Painel: grade de 12 colunas, hairlines 1 px, sem painel dentro de painel; zona que gira troca só em mudança de dado (crossfade 400 ms); placar de metas com anel que fecha aos 100 % (800 ms, uma vez); cronômetros e relógio em JetBrains Mono tabular 43–76 px; evolução da semana = 7 linhas empilhadas tingidas pela escala de tempo (o número não); fala humana (pergunta da semana, ideia, sugestão, ata) em Cormorant 500 ≥ 48 px em `--latte`; presença das 11 pessoas como anéis com meia-vida média. **Projeção**: hairline de 0,3u em `--t2` (roxo) nas quatro bordas + rótulo mono "Projeção · Carla" no canto, estáticos, somem ao encerrar; sem aro âmbar (revisto em 25/09/2026: era `--t0`; vale "só uma luz de borda roxa na identidade da Babel" — [Theus, 23/09] CHECKLIST.md:177, CHECK_DO_THEUS.md:49). Memória da sala = **25 traços verticais de 1 px, altura 1–8 px = intensidade, um a cada 12 s** (sem letras); ponto vermelho 1,2u ao gravar; "áudio apagado" em mono; sugestão de ideia = faixa fina que esfria em 30 s, só se persistir duas janelas de 12 s; Cuidando da gente = convite discreto, nunca ranking; nenhum som, nunca.
- **Celular** (< 760 px): abas embaixo de 56 px (Meu dia · Trabalho · Chat · Criar · Mais), alvos 48 px; o painel de agentes abre de Mais ou deslizando da borda direita como folha inteira; o cabeçalho vira "→ README.md · pensando há 4 s"; Puxar = segurar e arrastar até o ❯; o Selo tem 24 px dentro de alvo de 48 e fecha por toque; cronômetro como pílula fixa no topo; corpo 14 px.
- **iPad**: só o quadro, sem cromo; barra embaixo com alvos de 48 px (caneta, marca-texto, borracha, post-it, texto); Projetar na TV e Estação no canto; grade de pontos 8 px a 2,5 %; traço na cor da pessoa; salva sozinho no `.quadro` da pessoa; risca no iPad, risca na TV.

---

## 4. Linguagem visual (aceite A5 · `docs/design/tokens.css`)

### 4.1 Cor
| Token | Valor | Uso |
|---|---|---|
| `--s0` | `#060b16` | chão: laterais, topo, rodapé, TV (o DNA fica) |
| `--s1` | `#0b1320` | meio (Trabalho) e palco da Máquina |
| `--s2` | `#161e2d` | elevado: cabeçalho do painel de agentes, paleta Ctrl K, cartões, peças |
| `--s3` | `#212a3b` | hover, seleção, frente/pino da peça |
| `--linha` | `#4d5564` | divisórias entre colunas (Lc 15,8 sobre `--s0`) |
| `--linha-fraca` | `rgba(215,228,251,.09)` | separadores internos |
| `--texto` | `#d7e4fb` | corpo do meio (Lc 89) |
| `--texto-90` | `#c3cfe5` | corpo nas laterais e no Registro; repouso da meia-vida (Lc 77) |
| `--apagado` | `#a8b8d5` | rótulos, blocos consulta/plano, piso do repouso (Lc 63) |
| `--fraco` | `#6c7b96` | placeholder, desabilitado, "Nada aberto" (Lc 32) |
| `--latte` | `#fff8e7` a 88 % | tudo o que é fala humana em Cormorant; fundo do tema Visita |
| `--t0` `--t1` `--t2` | `#2ad5e5` · `#7ba4f0` · `#a376e9` | agora · hoje · antes: o degradê da marca como **escala de tempo** e nada mais; `--t1`/`--t2` nunca em texto < 18 px, com uma exceção: o degradê do texto padrão do terminal real, que desliga (revisto em 25/09/2026, ver §4.2) |
| `--ok` `--atencao` `--alarme` | `#7fd6a6` · `#f0b35a` · `#ff6b6b` | passou · espera/disparou · barrou (alarme sempre com ícone ou trilho) |
| `--ouro` | `#f5c76a` | chapado, só em dois momentos: meta a 100 % e OK de quem pediu (Lc 76) |
| Pessoa | 11 matizes `oklch(0.78 0.11 H)` | escolhida uma vez, nunca reatribuída, o agente herda; só em anel, inicial, fita, luz de evento e borda de aba; nunca chip cheio; sempre com iniciais ou foto |

Saem: aço, bronze, prata, ouro em três tons, laurel, fimbriação, ametista como token (o chip "pode mudar" da Oficina = contorno `--t1`). Dois modos com nome, escolhidos pela pessoa no seletor da barra de cima: **Tech** (escuro, padrão) e **Vibe** (claro bege Latte), pela mesma fórmula OKLCH de três variáveis (base, acento, contraste), com APCA nos dois; ametista fica como variação do Tech (revisto em 25/09/2026: era "tema claro (Latte) na v1" — `memoria/decisoes/2026-09-25-dois-modos-tech-e-vibe.md`; Theus, 25/09: "dois modo, tech e vibe o tech é o escuro e o vibe o claro"). Os tokens atuais `--e-apagado` (Lc 47), `--e-fraco` (Lc 24) e as hairlines a 9–14 % (Lc < 10) reprovam e saem.

### 4.2 Tipografia
Três famílias e só três. **IBM Plex Sans** (self-host dos `.woff2`, peso 450 Text para o corpo; fallback 400): corpo 14 px/1,45 na densidade confortável (padrão), 13 px na compacta; nomes 13,5 px Medium; títulos 15 · 17 · 20 SemiBold; rótulos 11 px Medium caixa-alta tracking 0,08 em; **piso 11 px**. **JetBrains Mono**: Registro 12,5 px/1,5 (ligaduras só em bloco de código); cabeçalho do painel, rodapé e ficha da demanda 11 px Medium tabular; cronômetro 20/34 px; TV 43–76 px. **Cormorant Garamond** 500/600, ≥ 24 px na Estação e ≥ 40 px na TV, só para fala humana (ideia falada, sugestão da sala, ata, pergunta da semana, saudação da primeira abertura); Cormorant SC 600 ≥ 20 px para nome de nível e de insígnia; nunca em corpo de UI. Escala da Estação: 11 · 12,5 · 13 · 14 · 15 · 20 · 34; TV: 27 · 32 · 43 · 54 · 76. Texto em degradê proibido, com uma exceção: o texto de cor padrão do terminal real leva o degradê roxo → azul → ciano, com opção de desligar (revisto em 25/09/2026: fala do Theus de 23/09 16:59, visual do Babel Terminal, `.deus/terminal-ao-vivo/MISSAO.md:6`; detalhe em `TERMINAL_2030.md` §2.4). Cormorant e Plex nunca na mesma linha.

### 4.3 Forma e traço
Raios concêntricos: janela 10 → painel 8 → cartão 6 → chip/kbd 4 → 2. Ícones: 20 px na barra, 16 px em árvore/abas/chips (tamanho óptico próprio), traço 1,5 px, cantos vivos, terminais retos, sem preenchimento, `currentColor`, **estáticos sempre**; família de **43 ícones da casca + 18 da Máquina numa leva única** (`docs/design/GERACAO_REPLICATE.md`). O anel é a régua: 14 px (estado do agente, foco, meta, ideia salva) e 16 px (Selo). Chip do Puxar: contorno 1 px `--linha`, glifo 14 px + nome mono 11 px, raio 4. Ficha da demanda: rótulos mono caixa-alta em coluna de 72 px, valores em Plex, estado como carimbo reto de 1 px (LIVRE · EM CURSO · PAUSADA · PRONTA · OK), sem rotação, sem vermelho. `kbd` 11 px mono em `--s2`, borda 1 px, borda inferior 2 px, raio 4. Sem cartão dentro de cartão. Espaçamento em múltiplos de 4; duas densidades globais (24 / 20 px), nunca por coluna. Alvo ≥ 24×24 na Estação, ≥ 48 no celular e iPad. Insígnias do Perfil = anel de 16 px com 1–4 arcos preenchidos em `--texto-90`; nível = "03" mono + barra "6/10".

### 4.4 Motion
Easings: `--ease-saida cubic-bezier(.2, 0, 0, 1)` sem overshoot; `--ease-heroi cubic-bezier(.16, 1, .3, 1)`. `--mov-toque` 120 ms (hover/foco: só opacidade e cor; acender o mesmo Selo nas outras colunas; troca de receitas). `--mov-padrao` 180 ms (entrada de bloco por opacidade; Selo fecha; chip aparece; crossfade na mesma aba; modos que tomam a tela). Meia-vida: decaimento por lei, sem keyframe. Anel do agente: 1,2 s linear em laço enquanto pensa. Gravando: ponto batendo a 1,6 s só enquanto grava. Peça esperando pousa após 2 s sem tecla ou com Enter. **Quatro momentos-herói e só**: b se desenha na primeira abertura com token (1,2 s, termina no b estático do topo; qualquer tecla pula), meta a 100 % (anel fecha, 800 ms), selo abre no OK de quem pediu (400 ms), ideia salva (anel fecha **no botão** "Salvar ideia falada", 400 ms). **Zero animação**: abrir/fechar pasta, filtrar, trocar de aba, trocar de atividade, hover na árvore, rolar o Registro, ícones. Teto: 2 sinais vivos por tela (gravação > anel do agente > ao vivo). Regra "nada anima sem dado" com a tabela de aceite (§11). Metas: trocar atividade, abrir arquivo, abrir paleta e ecoar comando em < 100 ms.

### 4.5 Luz e material
Elevação só pela escada `--s0 → --s3`; zero box-shadow colorida; a paleta Ctrl K é a única sombra e, fora o HUD do Babel OS em superfície viva, o único vidro (fallback opaco; `prefers-reduced-transparency` respeitado). Emissores de luz, e só: a meia-vida (luz de evento em texto, anel e traços de 1 px, com relevância); a borda do cabeçalho do painel a 12 % enquanto o agente age; o "b" em `--t0` só por preferência; a hairline de projeção na TV; e o organismo vivo: brilho, halo, faíscas, partículas e o HUD do Babel OS (vidro, borda ciano de 1 px, glow discreto, scanlines ≤ 5 %, só em superfície viva), **sempre presos a evento real e com fim; em repouso nada disso roda** (revisto em 25/09/2026: antes eram proibidos; valem as falas mais novas do Theus — 23/09 17:20, `.deus/terminal-ao-vivo/MISSAO.md:61`, "com os neons, com os brilhos, com os elementos, com os sons, o organismo vivo"; 24–25/09, poderes de jogo e micro-explosões; régua em `REGUA_ORGANISMO.md` e `TERMINAL_2030.md` §7). Continuam fora: neon permanente, glow em botão, grão, glitch, tilt/parallax. Um chão só para Estação, TV, iPad e celular.

### 4.6 Som
Sons curtos presos a evento, como osciladores Web Audio (custo 0; a tabela está em `TERMINAL_2030.md` §7.1); o principal é **"espera"** (o agente precisa de você e você olhou para outro lado), ping ≤ 300 ms. **Ligados por padrão na Estação, com botão para desligar**; no navegador tocam só depois do primeiro gesto; nunca na TV, no iPad nem na parede (revisto em 25/09/2026: era "um só som, desligado por padrão" — `memoria/decisoes/2026-09-23-terminal-nasce-no-design-2030.md`). `stable-audio-2.5` só se o oscilador soar barato no teste.

---

## 5. A mistura sem forçar

Um domina (o instrumento calmo, empresarial, ~70 % do que se vê); os outros entram pequenos, cada um numa camada só. Teste anti-pastiche em cada traço: "isto diz algo sobre cooperar com agentes?" Se não, sai.

- **Empreendedorismo** (a gramática dominante): divisórias sem peso, cor com significado fixo, trilha de auditoria de graça ("OK · Carla · 14:32", "voltou como estava") em demanda, versão, preset, publicação e acesso ao terminal; ficha da demanda; placar de metas; a Máquina como Lego de backend com ambiente e cofre; Loja e Oficina como poder de mudar o próprio instrumento; Cuidando da gente sem ranking.
- **Reino** (uma camada: Perfil e cerimônia): nível "03" + barra "6/10"; insígnias com arcos; sequência de dias úteis que só a pessoa vê; o Selo de consentimento como versão cotidiana e sóbria do lacre; Cormorant como voz cerimonial e humana; o token `babel-…` como convocação (a Entrada, uma vez). Sem metal, laurel, coroa, brasão, guildas, títulos ou nomes de corte.
- **Ufologia** (observação e sinal, **duas peças nomeadas e só**): o anel de traço único como estado do agente (aberto = pensando, fechado = parado, aberto e parado = falhou); a coluna de intensidade da TV (25 traços, um a cada 12 s). Todo o resto virou padrão sem nome (ficha com rótulos e carimbo reto, escala de tempo, "sugestão só se persistir 2 janelas de 12 s", grafo radial da equipe). Nada de disco, alienígena, radar, hexágono, estrelas, letras. (Revisto em 25/09/2026: o HUD do Babel OS entra, preso a evento real e só em superfície viva; ver §4.5.)
- **Futurismo** (transversal e invisível): precisão medida em vez de cromo ("pensando há 4 s" medido; tabular-nums em todo número; resposta < 100 ms com eco otimista e desfazer como rede); tokens derivados em OKLCH de três variáveis; raios concêntricos; a luz que esfria sozinha por uma lei. Quanto mais poder, menos interface.
- **Criatividade** (uma camada: o meio): a bancada toma a forma do objeto; qualquer coisa na frente vira verbo no agente; quadro de borda infinita que risca na TV; MindForge; Editar na tela; Cormorant e Latte para tudo o que a equipe fala; presets como "o que funcionou fica guardado".

---

## 6. O que ninguém usou (anterioridade por função)

Busca por função, não por palavra, nas frentes (`pesquisa/anterioridade-3-colunas.md`, `apps-futuristas.md`, `conceito-*.md`): Zed follow mode ("Your editor will jump to each file the agent touches": o editor pula; aqui o meio nunca é sequestrado e Seguir é opcional), Framer 3.0 Follow (só no canvas), VS Live Share (pessoas, não agentes), Warp blocos tipados (sem vínculo com o meio, sem espiar, sem autoria de aprovação), DSN Now (painel de leitura; aqui o cabeçalho também age), Linear peek (dentro do painel), JetBrains Universal Entry Point e Solomon (só o campo muda), Cursor 3 Design Mode / "Add to Chat" (objeto → agente em código; aqui a peça pode ser galho, cartão, peça da Máquina e as receitas trocam de verbo), Phosphor (Baudisch, UIST 2006) e Yellow Fade (37signals) como sementes da meia-vida, GitLens heatmap (idade → cor num arquivo; aqui no cromo de equipe), FigJam stamps (atribui, não muda estado), GitHub dismiss review (rastro obrigatório ao desfazer), Google Drive approvals (modal por arquivo), Dynamic Island / Replit Splits / tldraw fairies / Ableton.

Não visto em nenhum produto lido: (a) painel de agentes travado no objeto ativo com estado medido e receitas por objeto; (b) luz do agente tocando outro objeto que corre só por trilho do cromo e acende três lugares juntos, sem mover a pessoa; (c) ver antes/depois de um bloco no meio sem abrir aba nem gravar; (d) consentimento em três estados com autoria como um só objeto em três painéis, sem modal e sem segurar; (e) luz de sinal = idade do evento com filtro de relevância em três colunas; (f) qualquer objeto do meio (não só código) virando chip com verbos próprios no campo do agente. "Não vi" não é "não existe": DocuSign/Adobe Sign, Codex app, Superhuman Split View, Observable e ferramentas de governança de agentes de 2026 não foram cobertos.

---

## 7. Elementos gerados por IA (aceite A6 · `docs/design/GERACAO_REPLICATE.md`)

Depois do corte dos críticos, o kit é pequeno de propósito: **família de 61 ícones em SVG nativo** (43 da casca + 12 peças + 6 estados da Máquina) numa leva única no `recraft-ai/recraft-v4-svg`, com portão de 3 antes do lote; **keyframes A e N do "b" no material chapado da marca** (`google/nano-banana-2`) e o **clipe de Entrada como candidato com portão** (`bytedance/seedance-2.0-fast` → `wan-video/wan-2.7-i2v`, ≤ 2 tentativas): a Entrada definitiva de base é o **b em SVG que se desenha** (custo 0), e o clipe só entra se ganhar dele lado a lado com 3 pessoas; **folha de estilo e geometria** só para as duas peças orgânicas da Máquina (Portaria, Cofre) via `firtoz/trellis`; matcap à mão. Tudo o mais (anel, Selo, meia-vida, luzes, chip, grade, b estático, coluna de intensidade, peças da Máquina, fios, pulso) é CSS + SVG à mão. Cortados: loop da logo, campo profundo, loop da TV, seis sons (revisto em 25/09/2026: os sons voltaram como osciladores presos a evento, §4.6). Teto ≈ US$ 7–10 de 20; parada em 16.

---

## 8. O que não tem

Segurar para confirmar · guildas, sigilos, brasão, títulos, Chancelaria/Conselho · linha, contorno, véu ou sombra por cima do texto de trabalho · quarta coluna, bancada que morfa, arquivo que voa, hover com escala · meia-vida sem relevância, repouso abaixo de Lc 63, ações só no hover · vidro em painel de conteúdo (fora o HUD do Babel OS em superfície viva) · texto em degradê (fora o texto padrão do terminal, que desliga), degradê em botão/chip/fundo · halo, brilho, faíscas ou partículas em repouso ou sem evento real, neon permanente, ponto pulsante sem dado · grão, glitch, estrelas, parallax, fundo que respira; scanline fora do HUD vivo · disco voador, alienígena, radar, hexágono, sete segmentos, carimbo rotacionado, Eurostile · coroa, brasão, escudo, castelo, cetro, cera literal, metais · logo grande no meio ou no terminal, marca-d'água no vazio, splash · quarta família tipográfica, Cormorant abaixo de 20 px · ranking, streak de dias corridos, placar de pessoas na TV, chip cheio colorido · selo "IA", 46 textos de ajuda, apresentação do agente a cada aba, 8 receitas fixas no painel, 10 itens fixos no rodapé · toast de progresso, duas notificações ao mesmo tempo, badge fixo · som na TV/iPad, leito musical, som antes de gesto · easing elástico, animação em pasta/aba/filtro/atividade, `prefers-reduced-motion` a 0,01 ms global · fundo de IA atrás de texto · cartão dentro de cartão, box-shadow colorida · "Ver como", "Neon", "ESTAÇÃO · PROTÓTIPO", botões de demonstração no cromo do app (ficam só no protótipo) · Seguir à força, peça pousando ou aba roubando o foco enquanto a pessoa digita · Lottie/Rive em runtime, vídeo com alfa · vocabulário de spec na interface (§10). (Revisto em 25/09/2026: halo, faíscas, partículas e o HUD do Babel OS saíram desta lista quando presos a evento real e com fim, §4.5; o texto padrão do terminal leva degradê, §4.2; o arquivo que o agente escreve nasce à vista no meio sem roubar o foco, lei 1.)

---

## 9. Como cada função pedida continua (aceite A8 · cruzamento com `docs/FUNCOES.md`)

Nada sai. Cinco mudanças de casa, as da peneira: Inteligência → abas do Acervo; Tarefas com fluxo → aba de Trabalho; Metas e campanhas → aba de Equipe; Mapa da equipe → aba de Equipe; Controle da TV → na Estação, ao lado de Tela da TV e no Ctrl K, no celular e no terminal, nada dentro da janela da TV (revisto em 25/09/2026: era a engrenagem da janela — CHECK_DO_THEUS.md:46).

- **A. Casca**: 12 atividades com rótulo; lateral e painel recolhem (Ctrl B, Ctrl `, borda arrasta; "mostrar terminal" = casa "agentes" do rodapé); abas iguais, fechar todas → vazio liso; paleta Ctrl K com verbo · objeto, todas as ações do ⋯ e o grupo Receitas; rodapé de oito casas (presença, caixa com "3 esperando meu OK" e tarefas livres, cronômetro, sala com gravação/memória, projeção, controle, atualizar, agentes; "Salvo na equipe" transitório); coluna de novidades no sino; Ver como só no protótipo; Tela da TV no topo; celular com 5 abas; identidade preservada como escala de tempo e b pequeno.
- **B. Criar**: boas-vindas com cartões Tela, Máquina, Pesquisa ("Ver um exemplo em 3D" vira item da paleta); seletor Sozinho ↔ projeto; árvore com ícone por tipo, foto de quem salvou, "recebido de X" = selo aberto, ficha pontilhada, linhas acesas pela meia-vida; filtrar; um só +; arrastar arquivo para pessoa; Projetar/Levar para a reunião no ⋯, hover e paleta; arquivo de outro só leitura + Sugerir mudança (demanda com selo aberto; aba Revisar mudanças); editor de todo tipo; Editar e salvar com foto e versão; Versões e Voltar como estava (voltar = rompe o selo da versão, com nome e hora); Formatado/Texto; Site | Código | 3D; Editar na tela (§ `TELA_CONSTRUTOR.md`); barra do arquivo sempre visível; MindForge inteiro sobre o chão da Babel; mapa pelo terminal (abre atrás, a aba acende, galho novo selecionado, Seguir leva); quadro; Máquina (§ `MAQUINA_PECAS.md`, `SUPABASE_PECAS.md`); Máquina pelo terminal (peça tracejada; se a pessoa digita, espera); presets (Testar → "Funcionou · Salvar como preset" selado; Presets da equipe; Começar de um preset; ★ Salvar como preset; pelo terminal).
- **C. Terminal e agentes**: painel à direita = a presença com o terminal real dentro dela, duas faces por agente, **Presença** e **Terminal** (nome@estacao · ~/BabelCoop) (revisto em 25/09/2026 — `memoria/decisoes/2026-09-23-terminal-nasce-no-design-2030.md`); abas com nome humano e foto (quadrado com inicial ou foto); "Neon" vira preferência "luz da marca"; estado = anel de 14 px; menção vira chip; todos os pedidos em português de hoje, cada um deixando bloco ação com desfazer; o que é criado aparece na TV; comandos coop e shell como blocos; receitas ≤ 3 + as 8 na paleta; terminal ao vivo = "ao vivo" no painel; parede de Terminais como atividade (cartão por agente com estado e, por preferência, o tempo de ida e volta; Entrar, Pedir para os outros = selo aberto, Chamar, Falar, Assumir com anéis sobrepostos, Sair; dono vê "X está no seu terminal · Encerrar"); navegador do agente como aba do meio (cursor visível, Assumir/Devolver, Raio-X, Clonar página/copy, Print como prova); navegador da pessoa (endereço e Ir); marca da pessoa nas peças; terminal real sempre à vista na face Terminal (Ctrl J alterna), só no app.
- **D. Meu dia, demandas, tarefas, metas**: Meu dia com caixa como 3 números, o que estou fazendo, tarefas livres, check-in, "Estou bem", pedir uma mão, apoiar, ideia falada, pergunta da semana; "Primeiros passos com IA" some ao completar; nova demanda como ficha (título, PARA/livre, PRAZO, ESTIMA, PRIOR., PROJETO) com selo aberto de quem pediu; cronômetro da demanda (Começar · Pausar com motivo · Retomar · Pronta com aprendizado · OK só de quem pediu = selo fecha, herói 400 ms); cronômetro móvel (⋮⋮, duplo clique, ▾, posição lembrada, nunca fecha), destacado (⧉ PiP / sempre-no-topo), volta sozinho após 45 s ao mexer numa peça do trabalho (avisa por luz, registra); tarefas livres (pegar = responsável + selo + cronômetro); Pedir ajuda / Estou travado / Levar para a reunião na ficha; tarefas com fluxo (lista/quadro/por pessoa/trilha graduada; OK de quem passou = selo); metas e campanhas em Equipe (placar na TV, anel fecha aos 100 %); pausa automática fora do expediente (que também define `--mv-longa`).
- **E. Chat, reunião, sala**: chat com canais, diretas, ✓✓, responder, reagir, emoji, anexar, "digitando…" = anel aberto, cara de WhatsApp na identidade da Babel; mensagem vira demanda / vai para a TV pelo menu ou puxada; Reunião como modo que toma a tela (iniciar, levar, destacar, decisão, encerrar → ata em Cormorant + Latte, TV em modo reunião, quadro ao vivo); memória da sala (rodapé "ouvindo · 4 min"; TV coluna de intensidade); Salvar ideia falada (cartão com os últimos 5 min; anel fecha no botão; Acervo → Ideias com hora e quem apertou); gravar/parar (segurar 600 ms junta 10 min: a única tecla segurada, porque é gravação) com ponto vermelho; Conversa particular; A sala sugere; ideia falada individual.
- **F. Acervo, inteligência, aprendizados, sonho**: busca (palavras/semelhança, filtros, trecho + abrir, "Nada encontrado · 0 de N"); Aprendizados (+1); Melhores prompts (usar → puxa para o painel; top 3); Sonhar (7 linhas ao lado dos números); Cuidando da gente em Equipe (só sinais que persistem; avisa a pessoa antes da TV).
- **G. Equipe, perfil, mapa, projetos, ajuda**: cartões por pessoa (nome, iniciais, cor, check-in, presença por meia-vida), Carga (só gestão), regras, foto; Controle da TV na Estação (ao lado de Tela da TV e no Ctrl K), no celular e por `coop tv`, nada dentro da janela da TV (revisto em 25/09/2026 — CHECK_DO_THEUS.md:46); Convidar pessoa sem cadastro: na rede local a pessoa acha a equipe, confere o código de 4 dígitos e a gestão aceita; o token `babel-…` colado fica como plano B (revisto em 25/09/2026: antes só o token; entrada pela rede local feita em 25/09) (3 passos; primeira abertura = diagrama "Arquivos · Trabalho · Agentes"); Perfil (trabalhos, tempo, dados, fatia %, nível "03" + barra, insígnias com arcos e "como foi ganho", sequência que só a pessoa vê, linha do tempo na escala de tempo, agentes, histórico de selos dados e rompidos; sem ranking); Mapa da equipe = grafo radial; Projetos (lista + criar; abrir leva a Criar no modo do projeto com árvore de todos, conversa com chips, demandas, próximos passos, quadro, mapa, Máquina, agentes, Entrar, Falar, projetar evolução); ajuda par a par (Chamar para a minha tela, Falar com, Pedir ajuda a quem sabe, O que cada um está fazendo).
- **H. WhatsApp e Loja**: WhatsApp privado (QR real no app; só a pessoa vê); agente sugere resposta no campo; Loja (instalar skill/MCP/plugin/agente; "Versão nova → Atualizar"; publicar a minha; chave pede o cofre).
- **I. TV**: sem botão, F; modos painel/reunião/quadro/projeção/site/visita; temas Noite (padrão) · Ametista (derivado) · Visita (Latte); zona que gira, placar, cronômetros, relógio; projeção com rolagem e a hairline de projeção; site na TV; luzes da sala (ponto vermelho, coluna de intensidade, "áudio apagado"); sugestão de ideia; Cuidando da gente; comemoração (anel fecha).
- **J. iPad**: `#ipad`, só o quadro; caneta, marca-texto, borracha, post-it, texto; risca no iPad, risca na TV; salva no `.quadro`; Projetar na TV; Estação ↔ iPad.
- **K. Oficina**: quem pode mudar o app (Liberar/Tirar; chip "pode mudar" = contorno `--t1`); "muda no app: …" → Aguardando publicação com selo aberto da gestão; Publicar vN (notas → selo; histórico); Atualizar no rodapé; versão em mono 34 px sem degradê.
- **L. Só no app**: inalterado.

---

## 10. Termos: código/documentos vs interface

| Código e documentos | Interface (o que a equipe lê) |
|---|---|
| Catálogo · Campo · Mesa | Arquivos · Trabalho · Agentes |
| Mostrador / objeto travado | (cabeçalho do painel de agentes, sem nome) "→ README.md" |
| Registro | (sem nome) |
| Visada / trava | nunca aparecem |
| Puxar | "Levar para o agente" (no ⋯) · Ctrl+Enter |
| Espiar | "Ver antes/depois (Espaço)" |
| Seguir | Seguir |
| Selo (consentimento) | OK · Aceitar · Publicar vN · Salvar preset (com o anel como ícone); "OK · Carla · 14:32" |
| Rompido | "Desfeito por · hora" (minha ação) · "Rompido por X · hora · voltou como estava" (OK de outro) |
| Meia-vida | nunca aparece |
| insígnia (Perfil) | insígnia |
| luzes (rodapé/TV) | (sem nome) |
| impalado, quartos | não existem mais |

Lista fechada de termos **proibidos na interface**: trava, travado, visada, meia-vida, puxar, espiar, rompido (fora do caso acima), impalado, Catálogo, Campo, Mesa, Mostrador, Registro. ("Estou travado" continua existindo porque é função do FUNCOES.md com o sentido da pessoa.)

---

## 11. Tabela de aceite: animação → evento → `prefers-reduced-motion`

| Animação | Evento que a dispara | Equivalente estático |
|---|---|---|
| Linha do agente nasce (240 ms) | agente toca outro objeto | já no destino |
| Anel do agente em laço (1,2 s) | agente pensando | anel aberto + "pensando há N s" |
| Anel fecha (180 ms) | agente terminou | fechado |
| Meia-vida (rAF 4 Hz) | evento real e relevante | 3 degraus (aceso · morno · repouso) |
| Selo fecha (180 ms) | clique/Enter/tecla | estado final |
| Selo abre, herói (400 ms) | OK de quem pediu | estado final |
| Anel da meta fecha, herói (800 ms) | meta a 100 % | fechado |
| Anel no botão "Salvar ideia", herói (400 ms) | ideia salva | fechado |
| b se desenha, herói (1,2 s) | primeira entrada (rede local com código de 4 dígitos aceito pela gestão; token colado como plano B) | b estático |
| Crossfade 180 ms na mesma aba | evento substitui o conteúdo | troca imediata |
| Peça pousa (180 ms) | 2 s sem tecla ou Enter | aparece |
| Ponto vermelho batendo (1,6 s) | gravando | ponto fixo + palavra "gravando" |
| "ao vivo" (ponto 6 px) | transmitindo | ponto fixo |
| Notificação esfria (6 s) | evento passageiro | some por passo |
| Zona da TV troca (400 ms) | mudança de dado | troca imediata |
| Coluna de intensidade da TV | amostra a cada 12 s | sem transição |
| Pulso da Máquina (ponto no fio) | Testar / evento ao vivo | fio e peça trocam de cor + `aria-live` |
| Gesto físico da peça (gaveta abre, engrenagem gira 60°, cadeado treme) | pulso chega / dispara / barra | só a cor e o texto |
| Tela: levantar/assentar (80/160 ms), irmãos deslizam (200 ms) | arrastar e soltar | levantar sem escala; assentar em corte seco com a linha de inserção 300 ms a mais |

O bloco `@media (prefers-reduced-motion: reduce)` com equivalentes por peça **substitui** o `* { animation-duration: .01ms !important }` do `base.css`, que apaga feedback útil.

---

## 12. As críticas e o que mudou (aceite A3)

| Lente | Refutou | O que derrubou (aplicado na v2) |
|---|---|---|
| **Excesso** | sim | linha sólida da trava e Apontar cortados; troca de aba instantânea; Campo sempre `--s1`; cabeçalho sempre `--s2`; escala longa só numa marca de 6 px; piso 11 px na barra; ideia salva no botão, não sobre o texto; ícones estáticos; "selo" só para consentimento (Perfil = insígnia; sala/controle = luzes); "b" estático por padrão; disco do cronômetro cortado; coluna Wow! fora do rodapé; vazio liso; loop da logo, campo profundo e loop da TV cortados; seis sons → um (revisto em 25/09/2026: os sons curtos presos a evento voltaram, ligados por padrão na Estação com botão para desligar, nunca na TV, no iPad nem na parede — `memoria/decisoes/2026-09-23-terminal-nasce-no-design-2030.md`); 43 ícones; um só número de tempo; 3+ pessoas = "+N" |
| **Pastiche** | sim | coluna de intensidade em traços (sem letras, só na TV); avatar de agente sem bitmap na casca; sem ↑/↓ nem latência fabricada; Rompido sem corte diagonal (volta a aberto + ponto); sem metais/laurel/fimbriação (ouro chapado único); sem ponto pálido; rodapé sem contornos; Entrada em SVG (custo 0) com o clipe como candidato refeito no material chapado; projeção da TV como hairline `--t2` (roxo; revisto em 25/09/2026, era `--t0` — CHECKLIST.md:177), sem moldura em degradê; "b" nunca roxo |
| **Empresário sério** | sim | lista fechada de termos proibidos na interface; botão de texto sempre com o anel como ícone; "OK · Carla · 14:32" escrito, sem hover; anel que espera o meu OK em `--atencao`; estado do agente em palavras; agente = quadrado com inicial; rótulo da barra permanente e barra de 56 px; tema claro na v1 (hoje o modo Vibe, ao lado do Tech; §4.1); densidade confortável (corpo 14 px) por padrão; qualquer tecla pula a Entrada |
| **Viabilidade** | sim | Ctrl+Enter no lugar de Ctrl+→; abas de 32 px nos dois painéis (`--trilho-y` única); linha do agente por pseudo-elemento por contêiner, nunca SVG único por cima; portão de 3 ícones antes do lote e desenho à mão se vier preenchido; foto do agente preservada; casa "agentes" no rodapé; 8 receitas na paleta; tabela completa de reduced-motion; self-host da Plex 450; `gera.mjs` com polling (sem webhook); "?" por atividade; sons com `silenceremove`; sem blend screen em vídeo (o clipe é a própria tela) |

Onde as lentes divergiram, a decisão e o motivo estão em `pesquisa/conceito-final-v2.md` §1 (linha do agente, avatar, contorno do rodapé, luz de projetor, tema Ametista, clipe de Entrada, som, ícones que se desenham).

---

## 13. Riscos e plano de retirada

- **Imposto da novidade** (quatro coisas novas, mesmo sendo uma lei cada): testar com 3 pessoas da equipe medindo tempo de tarefa e erro, não nota de 0 a 10. Retirada por peça: a linha some → cabeçalho + três luzes; o Selo → os botões de hoje com "por · hora" no histórico; a meia-vida → três degraus fixos; o Puxar → só Ctrl+Enter, sem arrastar. Nenhuma função depende da novidade.
- **APCA** calculado por implementação própria (fórmula 0.0.98G): conferir em apcacontrast.com antes de fixar. Contrastes da Máquina calculados à mão pela fórmula do WCAG 2.x: conferir num verificador.
- **Meia-vida com 11 pessoas e agentes**: teto de 200 elementos, rAF a 4 Hz, medir CPU num Mac de entrada e no celular; se virar mapa de calor, meia-vida curta a 3 s e 3 luzes por coluna.
- **Recraft pode devolver preenchido**: o portão de 3 decide; à mão custa tempo, não dinheiro.
- **A corrente do mercado leva o agente para o centro** (Cursor 3, Zed): manter o painel à direita exige que ele pareça instrumento (cabeçalho + blocos + receitas + Selo), não chat. Se em teste parecer "VS Code de 2024", o problema é o cabeçalho, não a posição.
- **Cormorant ≥ 48 px e Latte 88 % na TV** foram calculados, não vistos a 3 m: medir na TV do escritório.
- **Token da Replicate** passou pelo chat: trocar ao fim da missão; nunca em arquivo do projeto.
- **Anterioridade**: "não vi" não é "não existe" (§6).
- **Ver como, Neon e botões de demonstração** saem do cromo do app mas continuam no protótipo como ferramentas de teste; o Neon volta como preferência "luz da marca".

---

## 14. Fontes

Estudo com fontes por achado: `docs/ESTUDO_DESIGN_2030.md`. Notas das frentes (200+ URLs lidas): `.deus/missao-design/pesquisa/apps-futuristas.md`, `ufologia-contida.md`, `reino-heraldica.md`, `minimalismo-empresarial.md`, `geracao-replicate.md`, `anterioridade-3-colunas.md`, `identidade-babel-e-mistura.md`. Conceitos e juízes: `conceito-instrumento.md`, `conceito-corte.md`, `conceito-silencio.md`, `bancada-viva.md`, `conceito-final.md` (síntese v1), `conceito-final-v2.md` (revisão pelas quatro lentes). Máquina: `docs/design/MAQUINA_PECAS.md`. Supabase: `docs/design/SUPABASE_PECAS.md`. Tela: `docs/design/TELA_CONSTRUTOR.md`. Geração: `docs/design/GERACAO_REPLICATE.md`. Painel visual: `docs/design/painel.html`.
