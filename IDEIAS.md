# Babel Coop — ideias

> Arquivo-mestre das ideias do babel-coop, para montar o protótipo.
> Versão 0.4 · 23/09/2026 · Theus + Claude · fase de projeto fechada
>
> Legenda: **[decidido]** = o Theus escolheu ou pediu · **[proposta]** = sugestão a validar · **[aberto]** = falta decidir

---

## 1. O que é

Um espaço de trabalho para as 11 pessoas da equipe trabalharem juntas no escritório.

- Cada pessoa tem a sua **Estação**: um app com cara de VS Code, com terminal próprio, chat, tarefas e arquivos.
- A **TV** é a tela principal da equipe: avisos, conclusões, metas, campanhas, cronômetro, avanço das tarefas e materiais projetados.
- O **celular** acompanha: chat, tarefas, avisos e notificações.
- Uma **pasta escolhida em cada computador** vira o HD da equipe: o que está lá fica visível para todos.
- A **reunião** acontece na TV: cada um, do próprio computador, joga materiais na mesa, e as decisões viram ata e demandas.
- Um **iPad** vira quadro branco da Babel (no estilo do Freeform): o que se desenha aparece na TV ao vivo.
- Tudo o que a equipe cria vai para o **acervo**, um catálogo com busca sem LLM que as IAs do terminal consultam.

## 2. Quem usa [decidido]

- 11 pessoas de áreas diversas: programação, vendas, comercial, marketing, suporte, financeiro, RH, gestão, atendimento e operação.
- Todos usam terminal.
- Os computadores têm Mac, Windows e Linux.
- Todos trabalham no mesmo escritório, por enquanto.
- As áreas não são fixas: o Theus cria e muda setores, fluxos, metas e campanhas quando quiser.

### Papéis [proposta]

| Papel | Quem | Pode |
|---|---|---|
| Admin | Theus | tudo: pessoas, áreas, fluxos, metas, campanhas e TV |
| Gestor | quem o admin escolher, por área | criar fluxos e metas da área, mandar aviso para a TV, iniciar cronômetro, projetar |
| Membro | todos | conversar, criar e passar tarefas, compartilhar arquivos, escrever documentos, mandar recado para o mural |

## 3. Princípios

1. **Liberdade de trabalho.** Qualquer pessoa conversa, cria tarefas, passa tarefas adiante, compartilha arquivos e escreve documentos junto com os outros.
2. **A TV é a tela principal.** O que importa para todos aparece lá.
3. **Tudo visível, cada computador sustenta o seu armazenamento [decidido em 23/09/2026].** Qualquer pessoa entra e vê o que as outras criaram, mas os arquivos de cada pessoa ficam no computador dela: a Estação de cada um serve os próprios arquivos e terminais para o resto da equipe. O acervo indexa o que cada computador serve. O que é de todos (chat, demandas, metas, aprendizados) é um **diário de eventos**: cada Estação guarda o que a própria pessoa fez e recebe uma cópia do que as outras fizeram. Não há máquina central; se uma pessoa desliga, o que ela já fez continua na cópia das outras.
4. **Rede local primeiro [decidido].** Funciona no Wi-Fi do escritório. Abrir para fora (pessoas de qualquer lugar vendo e mexendo nos terminais) fica para depois, e o desenho precisa deixar esse caminho aberto: transporte por WebSocket, login por pessoa e nada preso ao IP local.
5. **Um código só.** Estação, celular e TV saem da mesma base.
6. **Cara de Babel.** O visual segue o Babel Terminal: azul-marinho, degradê roxo → azul → ciano, neon e a logo "b".
7. **Calma em vez de barulho.** Notificações agrupadas e horário de trabalho respeitado. "A escrita consolida, o chat dissolve" (37signals).
8. **Dado honesto.** O que não foi medido aparece como "sem dado", nunca como zero (regra do painel-vivo).
9. **Todo mundo faz a empresa evoluir.** Cada contribuição aparece: quem criou, quem usou, quem agradeceu. A TV mostra a evolução da equipe, não um ranking.
10. **Fácil para quem está começando com IA.** Receitas prontas, desfazer fácil, pedido de ajuda a um clique e ninguém quebra o trabalho do outro sem querer.

## 4. As peças

```
 ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
 │ Estação (Mac)   │   │ Estação (Win)   │   │ Estação (Mac)   │
 │ • servidor      │◀─▶│ • servidor      │◀─▶│ • servidor      │  ... × 11
 │ • arquivos dela │   │ • arquivos dela │   │ • arquivos dela │
 │ • terminais     │   │ • terminais     │   │ • terminais     │
 └────────▲────────┘   └────────▲────────┘   └────────▲────────┘
          └──────────────────────┼──────────────────────┘
                     rede do escritório (Wi-Fi)
          ┌──────────────────────┼──────────────────────┐
 ┌────────┴────────┐   ┌─────────┴─────────┐   ┌────────┴────────┐
 │ Mac do Theus    │   │ iPad              │   │ Celular         │
 │ • janela da TV ─┼──▶│ • app do quadro   │   │ • navegador     │
 │   (HDMI)        │   │   (risca na TV)   │   │   (vira app)    │
 └─────────────────┘   └───────────────────┘   └─────────────────┘
```

| Peça | O que é | Onde roda |
|---|---|---|
| Servidor | **cada computador é um servidor [decidido em 23/09/2026]**: a Estação serve os arquivos e os terminais da pessoa para o resto da equipe e guarda a cópia do diário de eventos de todos | dentro de cada Estação |
| Estação | tela pessoal com cara de VS Code, terminais com nome de agente e pasta compartilhada | app instalado em cada computador (Mac e Windows) |
| TV | **espelho sem botão [decidido em 23/09/2026]**: uma tela da Estação do Theus, aberta por um botão e espelhada na TV. Tudo é controlado na Estação; a TV só mostra | janela da Estação do Theus, espelhada por HDMI ou AirPlay |
| Celular | chat, tarefas, avisos e controle da projeção | navegador, no Wi-Fi do escritório **[decidido]** |
| iPad | quadro branco da Babel com borda infinita, ao vivo na TV | **app à parte, instalado só no iPad [decidido em 23/09/2026]** |

## 5. A Estação (tela de cada pessoa)

**[decidido]** Cara de VS Code: a árvore de arquivos à esquerda, o arquivo aberto no meio e o terminal à direita. As laterais recolhem e mudam de largura, como no VS Code.

```
┌───┬──────────────┬──────────────────────────────┬───────────────────┐
│ ▤ │ CRIAR        │ README.md │ precos.html ×    │ TERMINAL  bash +  │
│ ⌂ │ ▾ EQUIPE     │ theus › README.md   [Prévia] │ ╭ ana@estacao     │
│ ◷ │   ▸ Reuniões │                              │ ❯ coop buscar     │
│ ◉ │   ▸ Mapas    │   # Como usamos o Babel Coop │   "reembolso"     │
│ ☰ │   ▸ Quadros  │                              │                   │
│ ⌕ │ ▾ THEUS      │   arquivo aberto: texto,     │ [Explicar] [Achar]│
│ ✓ │   README.md  │   código, PDF, mapa, quadro  │ receitas prontas  │
│ ◎ │ ▸ ANA        │                              │                   │
│ ☷ │ ▸ BRUNO      │                              │                   │
├───┴──────────────┴──────────────────────────────┴───────────────────┤
│ ● online · ◷ Reembolso 00:12:03 · reunião ao vivo · Salvo na equipe │
└─────────────────────────────────────────────────────────────────────┘
```

- **Barra de atividades** (esquerda): ▤ Explorador · ⌂ Meu dia · ◷ Demandas · ◉ Chat · ☰ Reunião · ⌕ Acervo · ✓ Tarefas · ◎ Metas · ☷ Equipe · ✱ Mapa. (Revisto em 25/09/2026: valem 12 atividades — Meu dia · Criar · Trabalho · Chat · WhatsApp · Reunião · Terminais · Projetos · Acervo · Equipe · Loja · Oficina, com a Máquina dentro de Criar; `docs/design/CONCEITO.md` §3.1, CHECK_DO_THEUS.md:71-72.) Embaixo ficam Tela da TV e perfil. Não há botão de iPad: o iPad é um app à parte e só ele tem o "Projetar na TV" **[Theus, 23/09/2026]**.
- **Lateral esquerda**: Criar, com a árvore do HD da equipe dentro, ou a lista da atividade escolhida. Recolhe com Ctrl+B ou clicando de novo no ícone, e a largura muda arrastando a borda.
- **Meio**: o arquivo ou a tela aberta, em abas, com o caminho em cima (theus › notas › ideias.md) e os botões do arquivo: Prévia, Editar, Levar para a reunião, Projetar na TV, Pedir ajuda e Versões.
- **Lateral direita: o terminal [decidido]**. Recolhe com Ctrl+` e a largura muda arrastando a borda.
- **Barra de status**: presença, tarefas de hoje, cronômetro ativo, estado da pasta, conexão com o servidor, avisos e o status de gravação sempre à vista ("Salvando…", "Salvo", "Conflito"), como no Reino + Babel.
- **Paleta de comandos** (Ctrl/Cmd + Shift + P, como no VS Code): "nova tarefa", "conversar com Ana", "projetar na TV", "iniciar cronômetro", "abrir terminal na pasta"...
- **Fica na bandeja** quando a janela fecha, para receber avisos e servir os arquivos da pessoa, e abre junto com o computador.
- **Uma caixa só [proposta]** (ideia do grafo v5): digitar filtra o que está na tela, Enter busca em tudo (sem internet), `/` põe o cursor na caixa e Esc fecha as coisas uma por vez.
- **Coluna em vez de janelas pulando [proposta]** (ideia do grafo v5): avisos, conclusões e cartas de tarefa se empilham numa coluna lateral, em vez de abrir janelas na frente do trabalho.

### 5.1 Meu dia [proposta]

É o padrão que Asana, Linear e Basecamp usam, segundo a pesquisa:

- **Caixa de entrada**: o que acabou de chegar (tarefa nova, etapa passada para mim, menção).
- **Hoje e atrasadas**, **próximos dias**, **depois** e **sem data**. A tarefa sobe de grupo sozinha conforme o prazo chega.
- **A seguir**: a pessoa escolhe o que vem depois.
- Minhas metas e campanhas com % de avanço, e os avisos ativos.

### 5.2 Chat no jeito do WhatsApp [decidido]

- **Visual e gestos do WhatsApp, com a cara da Babel**: lista de conversas com a última mensagem, a hora e as não lidas; balões, com os meus à direita; ✓✓ de lido; responder citando; reações; foto, arquivo e áudio; "digitando…".
- **#geral** para todos, canais criados livremente (por área, projeto ou cliente) e conversas diretas.
- Menções (@pessoa, @área, @todos), resposta em fio, reações e arquivos arrastados da pasta.
- **Mensagem vira tarefa** num clique, com link de volta para a conversa.
- Mensagem importante pode ir para a TV (quem pode fazer isso está nos papéis).
- Presença (online, ausente, em foco), só para quem aceitar.
- **Horário de trabalho**: fora do expediente, as notificações ficam em silêncio e chegam num resumo. Numa pesquisa de abril de 2026 (Zenvia/Opinion Box), metade dos profissionais brasileiros disse responder trabalho no WhatsApp pessoal fora do horário, e 39% disseram que isso leva a erros.

**WhatsApp dentro da Estação [decidido em 23/09/2026]**:

- **WhatsApp Web dentro da Estação**: a pessoa abre a tela WhatsApp, lê o QR code com o celular uma vez e o WhatsApp dela passa a viver ali (`<webview>` com sessão separada, como fazem o Ferdium e o Rambox). Encaixar o app nativo não é estável em Mac nem Windows; o Web dá o mesmo resultado.
- **Só a própria pessoa vê**: o WhatsApp não é compartilhado, não entra no acervo, não aparece para a equipe nem na TV.
- **O agente do terminal responde o WhatsApp [decidido em 23/09/2026]**: o agente lê as conversas abertas e escreve respostas. Dois jeitos, escolhidos por conversa:
  - **Sugere e eu mando** (padrão): o agente prepara a resposta no campo de texto; a pessoa lê e aperta Enter, ou corrige antes.
  - **Automático** (por contato, ligado à mão): o agente responde sozinho e a pessoa vê o que foi mandado. Serve para perguntas repetidas de cliente.
  - **Como fazer**: a Estação lê e escreve na tela do WhatsApp Web pelo `<webview>` (o mesmo caminho do whatsapp-web.js), e o agente recebe as mensagens pela ferramenta `whatsapp` do conector `coop`. **Risco**: automatizar o WhatsApp pessoal vai contra os termos da Meta e pode bloquear o número. O modo "sugere e eu mando" é o mais seguro; o automático fica por conta e risco de cada um.
- **Para depois, se um dia quiserem**: a API oficial do WhatsApp Business, para as conversas com clientes virarem demanda e entrarem no acervo. Custa por conversa e exige webhook público.

### 5.3 Tarefas que passam de mão em mão

**[decidido]** Tarefas passam pela mão de várias pessoas e mostram a % de avanço. **[proposta]** A forma abaixo.

**Anatomia mínima**: título, responsável agora, etapa, prazo, prioridade (4 níveis), descrição, checklist, anexos (arquivos do HD da equipe), comentários e % de avanço.

**Fluxo**: um modelo de etapas criado pelo admin ou gestor, em que cada etapa tem um responsável (pessoa ou área). Exemplo:

```
Proposta comercial
  Levantamento (Vendas) → Proposta (Comercial) → Revisão (Financeiro) → Envio (Vendas)
```

- **Passar adiante**: ao concluir a etapa, a tarefa vai para o próximo responsável, que a recebe na caixa de entrada. A TV mostra "Ana passou 'Proposta Acme' para Bruno".
- **% de avanço**: sempre calculada, nunca digitada: pelas etapas (3 de 4 = 75%) ou, sem fluxo, pelo checklist. Ao lado dela vai "parada há N dias", que diz mais do que um número digitado (argumento do Shape Up, no relatório).
- Há um responsável por vez, para ficar claro de quem é a vez, mas todos os envolvidos acompanham.
- **Visões**: lista, quadro (colunas = etapas), por pessoa (carga de cada um) e trilha (o caminho da tarefa pelas mãos).
- Tarefa parada chama atenção: "parada há 3 dias com Bruno".

### 5.4 Demandas com cronômetro [decidido]

Pedido do Theus: uma entrada de tarefas em que quem pede envia para uma pessoa e o tempo de trabalho é medido de verdade.

1. **Quem pede** (solicitante) cria a demanda: para quem, o quê, prazo e, se quiser, uma estimativa ("uns 30 min").
2. **Quem recebe** (executor) vê a demanda na caixa de entrada e clica em **Começar**. Um cronômetro aparece na tela dela e fica lá: dá para minimizar e **arrastar para qualquer lugar da tela [Theus, 23/09/2026]**, mas **não dá para fechar**.
3. O executor **só pode pausar e retomar**. Cada pausa pede um motivo rápido (almoço, reunião, aguardando informação, outra urgência, fim do expediente) e fica no histórico com início e fim.
4. Quando termina, o executor clica em **Está pronta** e escreve o que aprendeu (obrigatório; ver 8.2). O cronômetro pausa sozinho ("aguardando conferência") e o solicitante é avisado.
5. **Só o solicitante encerra.** Ele confere e dá **OK**, e o cronômetro acaba. Se faltar algo, ele **devolve para ajuste** com um comentário obrigatório, e o executor retoma.
6. **No fim**, a demanda mostra o tempo de trabalho, o tempo parado (por motivo), o número de pausas, as devoluções e a estimativa comparada com o real.

```
ENVIADA  ─ Começar ─▶  RODANDO  ⇄  PAUSADA        (Pausar / Retomar, com motivo)
                          │
                     Está pronta
                          ▼
                   AGUARDANDO OK  ─ OK (só quem pediu) ─▶  CONCLUÍDA
                          │
                      Devolver  ─▶  PAUSADA (devolvida, com comentário)
```

**Regras [proposta]**:

- Uma demanda rodando por vez por pessoa: começar outra pausa a atual ("trocou de demanda").
- A espera pela conferência não conta como trabalho.
- O solicitante pode cancelar uma demanda que ainda não começou.
- A TV mostra só os acontecimentos ("Ana começou 'X'", "Theus deu OK em 'X'") e o total da equipe no dia, nunca o tempo por pessoa. A pesquisa aponta horas por pessoa na TV como vigilância.

### 5.4.1 Tarefas livres: pega quem puder [decidido]

- Quem pede pode deixar a tarefa **sem responsável**. Ela entra na lista de **tarefas livres**, que todo mundo vê: no Meu dia, em Demandas → Livres, na TV e no terminal (`coop livres`).
- Quem puder clica em **"Pegar e começar"**: vira o responsável e o cronômetro liga na hora. Quem pediu é avisado.
- Daí em diante valem as regras das demandas: quem pegou só pausa e retoma, o aprendizado é obrigatório para concluir e quem pediu dá o OK.
- **[proposta]** A TV mostra quantas tarefas livres existem, sem apontar ninguém.

### 5.5 HD da equipe (arquivos) [decidido]

- Cada pessoa escolhe **uma pasta** no computador. Tudo o que está ali dentro fica visível para as 11 pessoas.
- **Todo mundo entra e vê [decidido]**: a pasta de cada um aparece para todos na árvore de arquivos de Criar.
- **Onde fica guardado [decidido em 23/09/2026]**: os arquivos ficam só no computador do dono, que os serve pela rede. Computador desligado = arquivo indisponível, e os outros veem a ficha no acervo. O acervo guarda o índice e o texto extraído para a busca, não o arquivo.
- **A gestão corrige [decidido]**: o Theus, e quem ele autorizar, pode abrir a pasta de qualquer pessoa, ver os erros e consertar. O dono é avisado ("Theus corrigiu 'X'") e a versão anterior fica guardada.
- **Versões**: toda gravação guarda a anterior, e "Voltar como estava" desfaz, inclusive o que a IA mudou.
- **Salvar é imediato e tem rosto [Theus, 23/09/2026]**: o que eu salvo aparece na hora para todos; o arquivo mostra a foto de quem salvou por último (a minha se fui eu, a da outra pessoa se foi ela), no cabeçalho e ao lado do nome na árvore. Dono, gestão e admin editam qualquer arquivo; os das pastas comuns (Reuniões, Ideias, Mapas, Quadros, Aprendizados, README da equipe) todo mundo edita.
- **A tela do meio pode ficar vazia [Theus]**: dá para fechar todas as abas; o meio fica liso, só com "Nada aberto · Ctrl K" (revisto em 25/09/2026: saiu a marca d'água — Theus, 23/09, `.deus/missao-design/MISSAO.md:9`: tirar as logos do meio e da lateral). **A lateral esquerda não some**: continua aberta na última atividade usada. Com o meio vazio, clicar num ícone da barra da esquerda só troca a lateral; o meio só abre quando se clica num item da lateral [Theus, 23/09/2026].
- **Árvore de arquivos de Criar igual ao Explorador do VS Code**: uma raiz por pessoa (bolinha verde = computador ligado), mais "Recentes" e busca em tudo.
- **Abrir**: visualizador no próprio app (PDF, imagem, vídeo, áudio, texto, código) ou "salvar uma cópia na minha pasta".
- **Quem colocou e quando** aparece sempre. Um arquivo novo pode avisar no chat ou na TV ("Carla compartilhou 'Apresentação Q4.pdf'").
- **Proteções** [proposta]:
  - aviso claro na hora de escolher a pasta: "tudo aqui fica visível para as 11 pessoas";
  - ignorados por padrão: `.DS_Store`, `Thumbs.db`, temporários do Office (`~$*`), `.env` (senhas e chaves), `node_modules` e `.git`;
  - nada de RH ou financeiro sensível nessa pasta.
- **Escrever junto no mesmo arquivo [decidido em 23/09/2026]**: sim, ao vivo, pela Estação do dono. O arquivo continua num computador só (o do dono), e quem foi convidado edita nele pela rede, com cursor colorido, como no VS Code Live Share. Dono desligado = arquivo indisponível, como qualquer outro. Para textos que não são de ninguém (atas, procedimentos), existem os Documentos.

### 5.6 Documentos a várias mãos

**[decidido]** Existir. **[proposta]** A forma abaixo.

- Textos vivos dentro do app, com o cursor colorido de cada pessoa, como no Google Docs: atas, roteiros, propostas, procedimentos.
- Ficam no diário de eventos (copiado em todas as Estações), com histórico, e dá para exportar para a pasta em PDF ou Markdown.

### 5.7 Terminal próprio [decidido]

- Todos têm terminal, e ele roda **no computador da própria pessoa**. A TV não tem terminal.
- **Fica à direita [decidido]**, e dá para abrir **mais de um** ao mesmo tempo (bash, zsh ou PowerShell).
- **Cada terminal é um agente com nome humano [decidido em 23/09/2026]**: a pessoa cria os próprios agentes (ex.: "Rita", "Bruno") e cada um vive numa aba de terminal. Um agente é uma sessão de Claude Code com nome, foto e instruções próprias.
- **Os agentes mexem no app inteiro [decidido em 23/09/2026]**: pelo terminal, o agente cria campanha, demanda, meta, aviso, projeta na TV e o que mais a Estação faz. Isso passa pelo conector `coop`/MCP (ver 11), nunca por clique simulado.
- **Nome de pessoa vira seleção [decidido em 23/09/2026]**: ao digitar o nome de alguém da equipe no terminal ("cria uma campanha para a Carla"), o nome fica marcado e aparece a foto da pessoa, como uma menção. Assim, o agente sabe de quem se trata e a pessoa vê que acertou.
- Abre por padrão **dentro da pasta compartilhada**: o que o terminal gerar ali aparece para todos.
- **Visual e jeito do Babel Terminal** (`~/Downloads/babel-terminal`):
  - fundo `#060b16` e texto em degradê roxo → azul → ciano (liga e desliga);
  - logo "b" em neon pulsando ao fundo (liga e desliga);
  - prompt de duas linhas, e a nova aba abre na mesma pasta (Ctrl+Shift+T);
  - confirmação antes de fechar uma aba com comando rodando;
  - barra de status "BASH • UTF-8 • 2 abas".
- **IA no terminal**: cada pessoa roda o Claude Code (ou outra IA) com a própria conta.
- **Receitas** em cima do terminal, para quem está começando (ver 5.13).
- **Ver e mexer no terminal dos outros**: o Theus vê o terminal de qualquer pessoa em tempo real e digita nele para ajudar (ver 8.3).
- **A IA consulta o acervo e registra aprendizados** (ver 8.1 e 8.2): `coop buscar`, `coop ler`, `coop aprendi` e `coop aprendizados`.
- **Comando `coop` [proposta]**: atalhos seguros no terminal, úteis também para quem não programa: `coop tarefa "..."`, `coop aviso "..."`, `coop mural "..."`, `coop projetar <arquivo>`, `coop concluir` e `coop cronometro 25`.
- **Ideia para depois**: um conector (MCP) do Babel Coop para a IA do terminal criar tarefas, postar no chat, atualizar a % de avanço e ler a caixa de entrada.
- **Segurança**: o terminal roda com as permissões da pessoa. Quem mexe no terminal de outro (ver 8.3) digita naquela sessão, com o dono vendo; ninguém abre uma sessão escondida no computador alheio.
- **Navegador do agente [Theus, 23/09/2026]**: o agente abre um navegador dele dentro da Estação e navega, clica e preenche enquanto a pessoa vê tudo, como a extensão "Claude in Chrome" faz, mas sem precisar do Chrome. Como **[Theus: sem Playwright, código nativo nosso]**: a Estação já é um Chromium (Electron); uma aba do meio "Navegador · Rita" é um `<webview>` com sessão própria, e o próprio conector `coop` (o MCP do Babel Coop, escrito por nós) entrega ao Claude as ferramentas do navegador feitas direto sobre o que o Electron já tem: `webContents.loadURL` (navegar), `executeJavaScript` (ler o DOM, a árvore de acessibilidade, os textos, o CSS calculado, clicar e preencher por seletor), `sendInputEvent` (mouse e teclado de verdade, com o cursor visível), `capturePage` (print), `savePage(…, "HTMLComplete")` (clonar página com CSS e imagens), `webContents.debugger` (o CDP embutido, para a rede e o console) e `session` (cookies e sessão separadas). Sem biblioteca de terceiros entre o Claude e a página: o poder completo do Claude, com as ferramentas que a gente decidir dar. Cada passo aparece na aba e no terminal. Botão "Assumir" pausa o agente e devolve o mouse à pessoa; "Devolver" retoma. Logins e senhas a pessoa digita; o agente não. A sessão desse navegador é separada do WhatsApp e do navegador pessoal.
- **Raio-X do site [Theus, 23/09/2026]**: esse navegador precisa ser poderoso em ver o código do que entra. Ao lado da página, o painel **Raio-X** com abas: **HTML** (o DOM vivo, com busca e "copiar este bloco"), **CSS** (estilos calculados do elemento apontado, fontes e cores da página), **Copy** (todos os textos da página em ordem: títulos, subtítulos, botões, depoimentos, exportáveis em Markdown), **Rede** (o que a página carrega: APIs, imagens, scripts, com resposta visível) e **Console**. Botões: **Clonar página** (salva HTML, CSS, imagens e fontes numa pasta `Clones/<site>/` da pessoa, abrindo como site na Estação e pronta para editar), **Clonar copy** (gera `copy.md` com os textos organizados por seção), **Print inteiro** (captura da página completa) e **Selecionar elemento** (aponta na página e o Raio-X vai até ele). Tudo isso o agente também faz sozinho por pedido ("Rita, clona a landing do concorrente e me traz a copy"), porque o CDP dá ao agente o DOM, o CSS, a rede e as capturas. Tudo vai para o acervo como qualquer arquivo.

### 5.8 Equipe (gestão) [proposta]

Para admin e gestores:

- **Quadro da equipe**: quem está com o quê, carga de cada pessoa, atrasos e etapas paradas.
- **Cadastros**: pessoas, áreas, fluxos, metas, campanhas e cronômetros.
- **Controle da TV**: o que aparece, aviso novo, cronômetro, projeção e modo visita. Também pelo terminal: `coop tv painel`, `coop tv reuniao`, `coop projetar <arquivo>`, `coop tv site <url>`.

### 5.9 Mapa da equipe [proposta]

Inspirado no grafo v5 da Vyra: a equipe vista como um organismo vivo.

- **Nós**: pessoas, áreas, tarefas, metas, arquivos e documentos. O tamanho cresce com o número de ligações.
- **Ligações**: "é responsável por", "passou para", "usa o arquivo", "o arquivo está no PC de" e "faz parte da área".
- **Estado no desenho**: a % de avanço enche o círculo de baixo para cima, a tarefa pronta fica sólida e o arquivo com o dono desligado fica pontilhado.
- **Passagem como pulso de luz**: quando alguém entrega uma etapa, um pulso corre da pessoa até a próxima.
- **Interação**: passar o mouse acende o nó e os vizinhos e apaga o resto. Clicar trava o nó e abre uma carta na coluna (responsável, etapa, prazo, % e ações). Digitar filtra e Enter busca.
- **Na TV**: pode ser o fundo vivo do painel, mostrando os pulsos de passagem ao longo do dia.
- **No celular**: precisa de pinça e arraste com o dedo, e a coluna vira um painel embaixo.

### 5.10 Criar (árvore de arquivos) e editor [decidido]

- **Árvore do HD da equipe, igual à do VS Code**: EQUIPE, com as pastas comuns (Reuniões, Ideias, Mapas, Quadros, Aprendizados), e uma pasta por pessoa. As pastas abrem e fecham. Arrastar um arquivo do computador para a árvore coloca ele na sua pasta.
- **O meio abre o arquivo conforme o tipo**:

| Tipo | Como abre |
|---|---|
| Markdown (.md) | formatado, com botão para ver o texto puro e editar |
| Texto (.txt, .csv) | texto; o CSV vira tabela |
| Código (.js, .ts, .py, .sh, .css, .json) | com cores de sintaxe e números de linha |
| HTML | o código, e o botão **Prévia** mostra o site funcionando |
| PDF | as páginas, com zoom |
| Imagem e vídeo | visualizador |
| Mapa mental (.mapa) | o mapa, editável |
| Quadro (.quadro) | o quadro branco, editável |

- **Botões do arquivo**: Prévia, Editar, Levar para a reunião, Projetar na TV, Pedir ajuda e Versões.
- **HTML abre como site [Theus, 23/09/2026]**: clicar num `.html` mostra o site renderizado, como o Live Preview do VS Code, com o alternador "Site | Código". Editar e salvar atualiza o site na hora. Projetar um HTML na TV mostra o site, com rolagem.
- **Quem edita**: o dono e a gestão. Os outros veem e podem sugerir mudanças. Quando a gestão corrige o arquivo de alguém, o dono é avisado e a versão anterior fica guardada.

### 5.11 Notas, mapas mentais e quadros [decidido]

- **Bloco de notas**: nota rápida em Markdown, com título e data, na pasta "notas" de cada um.
- **Mapa mental, melhor que o MindMeister [Theus, 23/09/2026]**: a ideia no centro e os galhos em volta. Tab cria um galho filho, Enter cria um irmão, duplo clique edita e arrastar move a tela. A base é o **M Master** que o Theus já construiu (`~/Desktop/M Master`, mind-elixir + IA), trazido para dentro da Estação. O que o faz superar o MindMeister:
  - **O agente da pessoa expande o mapa**: selecionar um galho e pedir "abre esse em 5 ideias" ou "resume esse ramo"; o agente lê o acervo antes de sugerir, então os galhos vêm com o que a Babel já sabe.
  - **Galho vira coisa do sistema**: um galho vira demanda, tarefa, meta ou ideia num clique, e continua ligado ao mapa (o mapa mostra o estado: cronômetro rodando, pronta, OK).
  - **Galho aponta para arquivo, pessoa ou projeto**: arrastar um arquivo da árvore ou digitar @Carla dentro do galho cria o vínculo, com a foto ou o ícone.
  - **A várias mãos, ao vivo**: os membros do projeto editam o mesmo mapa pela Estação do dono, com cursor colorido, sem cópia.
  - **Na TV**: modo apresentação que percorre os galhos um a um; "Levar para a reunião" põe o mapa na mesa.
  - **Busca dentro dos mapas**: o texto de todos os galhos está no acervo; `coop buscar` acha um galho e abre o mapa centrado nele.
  - **Sem limite e sem assinatura**: mapas ilimitados, tela infinita, versões com "Voltar como estava", exportação em Markdown, PNG e o formato do M Master; tema da Babel.
  - Fica na pasta Mapas de quem criou (`.mapa`), como qualquer arquivo.
- **Quadro branco** (no estilo do Freeform): caneta, marca-texto, borracha, post-it e texto, com zoom. No iPad, com a caneta. **Ao vivo na TV** num clique.
- Tudo entra no acervo: o texto dos post-its, dos galhos do mapa e das notas vira busca.

### 5.12 Fotos e perfil [decidido]

- Cada pessoa põe a própria foto, e a gestão também pode pôr. A foto aparece no chat, nas trilhas, no cuidado da TV e no mapa.
- No perfil ficam nome, área e status (online, em foco, ausente). Também a opção de não aparecer com o nome no "cuidando da gente" e de não mostrar "o que estou fazendo agora".
- **O perfil é uma tela inteira, não uma janela por cima [Theus, 23/09/2026]**: clicar no meu perfil (ou no nome de qualquer pessoa, em qualquer lugar) abre uma aba no meio, "Sobre a pessoa", com:
  - **Trabalhos feitos**: demandas concluídas com OK, tarefas entregues, ajudas dadas (vezes que entrou no terminal de alguém e resolveu), ideias, aprendizados, skills publicadas, quadros e mapas criados. Com filtro por mês.
  - **Tempo**: horas em demandas no mês, média por demanda, quanto ficou pausado, melhores horários de foco. É sobre a pessoa, para ela.
  - **Dados e materiais**: os arquivos, mapas, quadros, clones e documentos dela, com o que mais foi aberto pelos outros.
  - **Quanto do Babel Coop é dela**: a fatia dela no acervo (arquivos, aprendizados, ideias), nas demandas do mês, nos projetos em que está e nas ajudas dadas. Mostrado como "você é 14% do que a Babel sabe" e barras por tipo.
  - **Gamificação pessoal**: nível e selos que crescem com contribuição (primeiro aprendizado, 10 ajudas dadas, skill instalada por 5 pessoas, 30 dias seguidos com aprendizado, ideia que virou demanda, quadro projetado na TV), sequência de dias, e a próxima conquista a alcançar. **Regra**: gamificação é da pessoa contra ela mesma, visível no perfil dela; não existe ranking entre pessoas nem placar na TV (seção 13). Todos podem ver o perfil de todos, porque tudo é visível.
  - **Linha do tempo**: o que a pessoa fez nos últimos dias, com links.
  - Os agentes dela, com nome e foto, e o que cada um mais faz.

### 5.13 Para quem está começando com IA [decidido: precisa ser fácil]

- **Receitas** em cima do terminal: botões que já escrevem o pedido certo para a IA ("Explique este arquivo", "Crie uma página a partir desta nota", "Procure no acervo", "Resuma a reunião de hoje", "Me ajude com este erro").
- **Primeiros passos**: uma trilha curta no Meu dia (abrir um arquivo, rodar `coop ajuda`, pedir para a IA explicar algo, criar uma nota, levar algo para a reunião, registrar um aprendizado).
- **Desfazer sem medo**: toda gravação guarda a versão anterior, e "Voltar como estava" desfaz inclusive o que a IA mudou.
- **Pedir ajuda a quem sabe**: um botão manda o arquivo aberto como demanda para o Theus, ou para quem a pessoa escolher. Ele abre, vê o erro e conserta.
- **Ninguém quebra o trabalho do outro**: arquivos dos outros abrem só para leitura.
- **Biblioteca de prompts**: os prompts que funcionaram ficam guardados para qualquer um usar (ver 8.5).

### 5.14 Sentir-se parte da evolução [decidido: objetivo]

- **Minha contribuição**, no Meu dia: o que eu criei na semana, quantas vezes meus materiais foram consultados, os agradecimentos que recebi e os meus aprendizados que a IA usou.
- **Ideias**: qualquer pessoa manda uma ideia e os outros apoiam. A TV mostra as que ganham força e o caminho delas até virar tarefa.
- **Pergunta da semana**: uma pergunta aberta sobre a empresa. As respostas aparecem na TV e vão para o acervo.
- **Na TV, a evolução da Babel**: o que a equipe criou, aprendeu e agradeceu, com foto e nome de quem fez. Nunca um ranking de quem trabalhou mais.

### 5.15 Projetos: duas ou mais pessoas na mesma coisa [decidido em 23/09/2026]

Um **projeto** é o jeito de duas ou mais pessoas trabalharem juntas sem ninguém abrir mão do próprio computador.

- **O que é**: um nome, os membros, e as pastas que cada membro dedicou a ele (uma pasta dentro da pasta compartilhada de cada um, ex.: `carla/Projetos/Clínicas` e `theus/Projetos/Clínicas`). Cada computador continua sustentando o seu armazenamento; o projeto é o que junta as partes.
- **A tela do projeto** mostra tudo junto: os arquivos de todos os membros numa árvore só, o canal do projeto no chat, as demandas e tarefas do projeto, o quadro do projeto e os agentes de cada membro que estão trabalhando nele.
- **Criar tem dois modos [Theus, 23/09/2026]** (revisto em 25/09/2026: o Explorador virou Criar, uma das 12 atividades — Meu dia · Criar · Trabalho · Chat · WhatsApp · Reunião · Terminais · Projetos · Acervo · Equipe · Loja · Oficina, com a Máquina dentro de Criar; `docs/design/CONCEITO.md` §3.1, CHECK_DO_THEUS.md §9): **sozinho** (a minha pasta e o HD da equipe, como sempre) e **em projeto**. No alto de Criar a pessoa escolhe o projeto; a árvore passa a mostrar só as pastas daquele projeto, agrupadas pelo nome e a foto de cada membro, com a minha primeiro. Trabalhar sozinho é uma coisa; trabalhar em equipe é outra, e a tela precisa deixar isso claro.
- **Arrastar arquivo para uma pessoa [Theus]**: no modo projeto, arrasto um arquivo meu e solto no nome de outro membro; ele aparece na pasta de projeto dela com o selo "recebido de Theus". O contrário também: o que me mandarem aparece na minha árvore na hora, com aviso.
- **Conversar dentro do projeto [Theus]**: no canal do projeto, escolho "com todos" ou "com Carla", "com Bruno". A conversa direta fica no contexto do projeto, e qualquer mensagem pode apontar para um arquivo do projeto.
- **Parece que estamos juntos [Theus]**: no modo projeto, ao lado de cada membro aparece o que a pessoa está fazendo agora ("editando proposta.md", "no terminal Lu"), quem está vendo o meu arquivo aparece como uma foto pequena ao lado dele, e uma faixa diz "3 pessoas com você agora". O fluxo tem que parecer que as pessoas estão na mesma mesa.
- **Mexer no arquivo do outro**: abre pela rede e edita ao vivo na Estação do dono (5.5). Dois cursores no mesmo arquivo, sem cópia.
- **Terminal do projeto**: qualquer membro entra no terminal de outro membro do projeto sem pedir (a permissão vem de ser membro). Os agentes de um membro leem o projeto inteiro pelo `coop`.
- **Quem cria**: qualquer pessoa. Quem entra: convidado pelo criador ou por outro membro.
- **Na TV**: a evolução do projeto (o que foi criado e concluído na semana) entra na zona que gira.
- **Membro desligado**: a parte dele fica pontilhada na árvore, e o resto do projeto segue.
- **Projeto de código, como o Babel OS [Theus, 23/09/2026]**: um projeto pode ser um repositório (git) que já existe no computador, com o Supabase e a Vercel por trás. A Estação mostra branch, mudanças e histórico; as peças do trabalho viram demandas ligadas a pastas e arquivos; os MCPs do Supabase e da Vercel vêm da Loja da equipe; e os `.env` nunca entram na pasta compartilhada: cada pessoa tem as chaves no próprio cofre, com "Pedir ao Theus" para as que faltam, e o agente roda com elas injetadas na hora. A Máquina (5.17) desenha o backend desse projeto.

### 5.16 Ajuda par a par [decidido em 23/09/2026]

Todo mundo olha todo mundo, e todo mundo ajuda todo mundo. Não é só o Theus.

- **Ver**: qualquer pessoa vê a parede de terminais e os arquivos de qualquer pessoa. Isso já é o princípio 3.
- **Entrar no terminal de alguém**: qualquer pessoa pede ("Carla quer entrar no seu terminal Rita"); o dono aceita com um clique, e a partir daí os dois digitam na mesma sessão. O Theus e a gestão entram sem pedir, com o selo à vista. Num projeto, os membros entram sem pedir.
- **Chamar para a minha tela**: o contrário. Um botão no terminal ou no arquivo manda um convite: "Bruno te chamou para ver `precos.html`". Quem aceita cai direto lá, vendo o mesmo que o Bruno.
- **O que cada um está fazendo agora**: na Equipe e no Meu dia, ao lado de cada nome, o arquivo ou terminal em que a pessoa está há quanto tempo ("Carla · precos.html · 20 min"). Só para quem aceitou aparecer.
- **Voz rápida entre Estações**: um botão "Falar com" abre uma chamada de voz de um para um, ou para os membros de um projeto, pela rede local (WebRTC, que o Theus já usa no PABX). Sem vídeo. Serve para "vem cá ver isso" sem levantar.
- **Pedir ajuda a quem sabe** (5.13) continua: manda o arquivo como demanda para quem a pessoa escolher.

### 5.17 A Máquina: o backend visual, montado como Lego [Theus, 23/09/2026]

A equipe nova não entende de backend, e isso é uma dor da empresa. A Máquina é, para o backend, o que a prévia do site é para o HTML: uma projeção viva do código e do Supabase em peças com nome de gente (Gaveta, Campo, Fio, Chave, Empresa, Portaria, Porta, Robô, Depósito, Cofre, Tela, Cano), que se monta sozinha enquanto o agente constrói, dá para testar vendo os dados andarem e mostra onde cada coisa fica guardada. O código continua sendo a verdade; a Máquina só lê, e quando alguém arrasta uma peça, quem escreve é o agente. Nada mexe em produção pela Máquina: testa no local ou na branch, e "Publicar" vem depois de "O que muda", em português. O desenho completo, com as peças, a leitura da verdade, a tela, o montar, o testar, o dividir em peças e as seis fatias de construção, está em `docs/MAQUINA.md`.


### 5.18 A Bancada: a tela do meio como um super Lovable [Theus, 23/09/2026]

**Criar, não Explorar [Theus, 23/09/2026].** A primeira atividade da barra deixa de se chamar Explorador e passa a ser **Criar**: é lá que tudo acontece. Dependendo do que a pessoa cria, a tela do meio vira a coisa certa: fazer frontend é **Tela** (o site renderizado), fazer backend é **Máquina** (as peças), pesquisa é **Pesquisa** (MD, TXT ou PDF em leitura). A Máquina não é uma atividade à parte: vive dentro de Criar. E a tela HTML tem o modo **3D** (5.19).

A tela do meio mostra sempre a forma certa do que está sendo construído, sem a pessoa escolher: **visual** quando é site, tela ou imagem (o site renderizado, a imagem), **Máquina** quando é backend (5.17), **leitura** quando é arquivo (Markdown formatado, PDF, planilha), **mapa** ou **quadro** quando é isso. A aba troca de forma sozinha conforme o agente cria arquivos.

- **Editar no visual muda o código [Theus]**: na prévia do site dá para mover um bloco, mudar o tamanho, trocar um texto, uma cor ou uma imagem, e o código muda na hora. Como, com código nosso: a prévia é o site de verdade num `<webview>` com uma camada de seleção por cima; cada elemento sabe de onde veio no código (para HTML puro, a posição no arquivo; para React/Vite, uma transformação nossa que marca cada elemento com arquivo, linha e coluna, como o inspetor do Vite faz). Trocar texto reescreve o texto no arquivo; mover e redimensionar mudam o CSS ou as classes; o que não mapeia direto (ex.: "põe isso em duas colunas") vira um pedido ao agente com o elemento selecionado, e o agente escreve. Tudo salva como versão.
- **Versões [Theus]**: toda aba tem uma régua de versões em cima; arrastar mostra o visual (ou a Máquina, ou o texto) como estava, com a foto de quem salvou; "Voltar como estava" em qualquer ponto; comparar duas versões lado a lado.
- **Cores por pessoa [Theus]**: no trabalho em equipe, o botão "Ver por pessoa" pinta em volta de cada parte a cor de quem a criou ou mexeu por último: blocos do site, peças da Máquina, trechos do texto, galhos do mapa. Vem do histórico de salvamento e do git quando é código. Serve para ver o resultado de cada um e para saber com quem falar sobre cada parte.
- **Projetar o que está sendo criado [Theus]**: qualquer aba da Bancada, inclusive a Máquina e o site em construção, tem "Projetar na TV" e vai ao vivo: a TV acompanha cada mudança conforme o agente constrói. Serve para o brainstorm em grupo.
- **Terminal com o computador inteiro [Theus]**: o terminal é um shell de verdade com as permissões da pessoa, como o iTerm: abre na pasta compartilhada, mas `cd ~` vai a qualquer lugar, cria pastas, instala e roda o que quiser. Só o que está na pasta compartilhada é visível para a equipe.

### 5.19 O visualizador de site em 3D [Theus, 23/09/2026]

Não é um mundo à parte: é um **modo do visualizador de site**. Ao abrir uma tela HTML, além de "Site" e "Código" existe **"3D"**.

- **O que mostra**: a tela como um painel quadrado num ambiente 3D e, ao lado e atrás, os **próximos itens** ligados a ela: as outras telas (também painéis planos, sem moldura de monitor) e as peças do backend como placas simples (portaria, gaveta, porta, robô). Nada de peça para clicar e abrir caixa de edição: **só as telas HTML são interativas**.
- **Interagir na tela**: a página é real. Clica nas caixas, digita, aperta Enter. A informação sai da tela como um pulso de luz pelo fio até o próximo item: verde deu certo (a Portaria libera e o pulso segue até as gavetas e a próxima tela), vermelho barrou. As peças acendem quando o pulso chega.
- **Girar e aproximar** com o mouse. O agente cria a próxima tela ligada a esta pelo terminal ("cria a tela de cadastro ligada ao login").
- **Como fazer (código nosso)**: three.js puro. CSS3D para as telas (iframes de verdade no espaço), WebGL para o chão, as placas, os fios e os pulsos. A tela avisa por postMessage quando alguém aperta Enter. No app, os próximos itens vêm do código e do Supabase (a Máquina) e das telas do site.

## 6. A TV (tela principal)

**[decidido em 23/09/2026] A TV é um espelho, sem botão.** Ela não é um cliente do sistema: é uma **tela da Estação do Theus**, aberta por um botão ("Tela da TV") e espelhada na TV por HDMI ou AirPlay. Não tem terminal, não tem login, não tem nada para clicar. Tudo o que aparece nela é controlado na Estação (pelos botões e pelo terminal) e no celular. Ela mostra de tudo: painel, reunião, arquivos, vídeos, desenho do iPad, sites.

**Modos da TV [decidido]** (quem troca é quem tem permissão, pela Estação ou pelo terminal com `coop tv …`):

| Modo | O que mostra | Quando |
|---|---|---|
| Painel | metas, campanha, avisos, trilhas, cuidando da gente e acontecimentos | o dia todo |
| Reunião | pauta, material em destaque, o que cada um jogou na mesa, decisões e próximos passos | durante reuniões |
| Quadro ao vivo | o que alguém desenha no iPad ou na Estação, em tempo real | brainstorm e explicações |
| Projeção | um arquivo, vídeo ou documento em tela cheia | quando alguém projeta |
| Site | uma página da internet em tela cheia (`coop tv site <url>`) | mostrar referência, concorrente, painel externo |
| Visita | só a marca e o relógio | cliente na sala |

**Painel [proposta]**: layout fixo, com uma zona que gira a cada 25 s. A pesquisa desaconselha carrossel de página inteira.

```
┌──────────────────────────────────────────────────────────────────┐
│ BABEL COOP     ◷ CAMPANHA SETEMBRO · faltam 8d 04:12:33    14:32 │
│ NO RITMO · 12 concluídas · 2 precisam de uma mão · 9/11 online   │
├─────────────────────┬──────────────────────┬─────────────────────┤
│ METAS DO MÊS        │ CAMPANHA             │ (gira a cada 25 s)  │
│ ◠72% ◠59% ◠91% ◠64% │ 38 de 50 · 76%       │ Avisos e mural      │
│                     │                      │ Evolução da Babel   │
│                     │                      │ Pergunta da semana  │
├─────────────────────┴───────────┬──────────┴─────────────────────┤
│ TRILHAS                         │ CUIDANDO DA GENTE              │
│ Proposta Acme  AN ✓ BR ● CA ○   │ Carla · 2h em "Contrato Norte" │
│ Site novo      DA ✓ EV ✓ DA ●   │ Hugo · 3 dias sem abrir        │
├─────────────────────────────────┴────────────────────────────────┤
│ ✦ Bruno concluiu "Contrato Y"                        há 2 min    │
└──────────────────────────────────────────────────────────────────┘
```

- **Faixa de estado** (ideia do painel-vivo): uma palavra sobre a equipe e poucos números. Só o que sai da faixa ganha cor.
- **Zona que gira**: avisos e mural; evolução da Babel (o que a equipe criou, aprendeu e agradeceu na semana); pergunta da semana; o sonho de ontem (o que a Babel aprendeu e os 3 melhores prompts).
- **Cuidando da gente [decidido: existir]**: a TV percebe e mostra, com nome e foto, quem pode precisar de uma mão:
  - muito tempo na mesma demanda (mais de 1,5 vez a estimativa);
  - muitas trocas de tarefa numa hora;
  - dias sem abrir a Estação;
  - quem se marcou como travado ou registrou um bloqueio no check-in.

  O tom é de convite ("Carla pode precisar de uma mão"), com a sugestão de quem pode ajudar. **[proposta]** A pessoa é avisada antes na própria tela e pode responder "estou bem" ou "pedir ajuda".
- **Eventos ao vivo**: aviso passageiro, em fila. Se chegarem muitos juntos, viram um só. Meta ou campanha em 100% ganha uma comemoração maior.
- **Cronômetro**: contagem regressiva até o fim da campanha, ou cronômetro de reunião e foco.
- **Instrumentos** (ideia do grafo v5): a meta vira arco e a campanha vira anel. Vermelho só para prazo estourado.
- **Pulso de passagem**: a entrega de uma etapa aparece como um pulso de luz de uma pessoa para a próxima.
- **Fotos**: quem tiver foto aparece com ela, no lugar das iniciais.
- **Leitura a 3–5 metros**: numa TV de 55" em 1080p, o texto precisa de pelo menos 28–47 px e fica confortável com 56 px ou mais. Alto contraste, 5% de margem nas bordas, nada de pizza nem velocímetro, nada de animação contínua.
- **Privacidade**: nada de mensagem privada, dado de RH ou financeiro, nem horas por pessoa. O **modo visita** esconde tudo o que é interno.
- **Robustez**: reconecta sozinha, recarrega de madrugada e mostra "atualizado às HH:MM".

### 6.1 Reunião na TV [decidido]

```
┌──────────────────────────────────────────────────────────────────┐
│ REUNIÃO GERAL · 00:24:10                    participantes: 9     │
├──────────────┬──────────────────────────────┬────────────────────┤
│ PAUTA        │ EM DESTAQUE                  │ JOGADOS NA MESA    │
│ ✓ Campanha   │ (material aberto em grande:  │ Ana · proposta.pdf │
│ ● Site novo  │  texto, imagem, mapa ou o    │ Davi · mapa        │
│ ○ Contratação│  quadro do iPad ao vivo)     │ Eva · banner.png   │
├──────────────┴──────────────────────────────┴────────────────────┤
│ DECISÕES: ...                  PRÓXIMOS PASSOS: ...              │
└──────────────────────────────────────────────────────────────────┘
```

- Quem conduz abre a reunião pela Estação, com título, pauta e cronômetro.
- **Jogar na mesa**: em qualquer arquivo, nota, mapa, quadro ou mensagem, o botão "Levar para a reunião" põe o material na TV. Cada um contribui do próprio computador.
- O condutor escolhe o material **em destaque**, que pode ser o quadro do iPad ao vivo.
- Qualquer pessoa escreve decisões e próximos passos durante a reunião. Um próximo passo vira demanda num clique.
- **Encerrar** gera a ata sozinha, sem IA: junta pauta, materiais, decisões e próximos passos e guarda no acervo.

### 6.2 Projetar na TV [decidido]

- Na Estação ou no celular, a pessoa clica num arquivo (ou documento, tarefa ou meta) e escolhe **Projetar**.
- A TV troca o painel pelo material (PDF, imagem, vídeo, slides, documento), com "projetado por Ana" discreto no canto e **só uma luz de borda roxa** na identidade da Babel **[Theus, 23/09/2026]**, para ninguém confundir projeção com painel.
- Quem projetou controla da própria Estação: **rola o arquivo** quando ele tem mais partes para baixo **[Theus]**, passa página, pausa, dá zoom e encerra. Também pelo terminal: `coop rolar +`. O admin pode encerrar qualquer projeção.
- Ao encerrar, ou depois de um tempo sem uso, a TV volta ao painel.
- O arquivo vem do computador do dono pela rede, então o computador do dono precisa estar ligado.

## 7. O celular [decidido]

- Funciona só no Wi-Fi do escritório, por enquanto, e não tem terminal.
- Abre pelo navegador e pode ser "instalado" na tela inicial.
- Abas: Meu dia · Chat · Tarefas · Arquivos (ver e abrir) · Controle da TV (projeção e cronômetro, para quem pode).
- Recebe notificações. No iPhone, elas só funcionam com o app instalado na tela inicial.

### 7.1 iPad: o quadro da Babel [decidido]

- **Um app à parte, instalado só no iPad [decidido em 23/09/2026]**, com a cara do Freeform e da Babel: tela cheia, ferramentas grandes e caneta com pressão. Não é a Estação nem a tela do celular.
- **Borda infinita [decidido em 23/09/2026]**: o quadro não tem fim; arrasta e dá zoom em qualquer direção.
- **Risca no iPad, risca na TV [decidido]**: cada traço aparece na TV na hora, no modo Quadro ao vivo ou em destaque na reunião.
- **Salvar no iPad é salvar no Babel Coop [Theus, 23/09/2026]**: o quadro é um arquivo `.quadro` na pasta Quadros da pessoa (no computador dela, como qualquer arquivo), aparece na árvore de todos na hora, abre na Estação e entra no acervo. Salva sozinho a cada traço; não existe "exportar do iPad para o sistema".
- **Como fazer [proposta]**: primeiro como PWA (instala pelo Safari, exige HTTPS na rede local); se o Safari atrapalhar (socket caindo em segundo plano, sem tela cheia de verdade), vira app nativo na App Store, com a mesma tela dentro.

## 8. Inteligência da equipe

O pedido do Theus: a IA do terminal evolui com o que cada pessoa aprende, e tudo o que a equipe faz vira conhecimento consultável, inclusive pela IA que ele está programando.

### 8.1 Acervo: o banco de conhecimento [decidido]

- **Tudo entra no acervo**: arquivos de texto, notas, mapas, quadros, PDFs (o texto extraído), atas, demandas e seus históricos, aprendizados, respostas da pergunta da semana e históricos de terminal. **[aberto]** As mensagens do chat.
- **Busca sem LLM [decidido]**, de dois jeitos:
  - **por palavras** (BM25, o mesmo cálculo dos buscadores), que acha o termo exato;
  - **por semelhança**, com vetores calculados na própria máquina, sem modelo de linguagem, que acha textos parecidos mesmo com outras palavras.
- **Na prática, é um banco de dados [decidido]**: SQLite com índice de texto (FTS5) e uma tabela de vetores. Cada item guarda de onde veio, quem fez e quando.
- **A IA do terminal consulta** com `coop buscar "..."` e `coop ler caminho`, ou pelo conector MCP do Babel Coop. Antes de responder, ela procura no acervo o que a equipe já sabe.

### 8.2 Aprendizados [decidido]

- **Para concluir, escreve-se o que aprendeu.** Quem faz a demanda só consegue marcar "Está pronta" depois de escrever o aprendizado. A IA do terminal também registra os dela (`coop aprendi "..."`).
- **Repetido não é aprendizado.** O sistema compara o texto com os aprendizados que já existem, pela busca por semelhança. Se já existe algo parecido, não cria outro: mostra o que já se sabia e soma um "+1 confirmado". Se é novo, entra na lista, com autor e a tarefa de onde veio.
- **Volta para a IA.** Os aprendizados viram um arquivo que a IA de cada terminal lê ao começar (o `APRENDIZADOS.md` da equipe, ligado ao CLAUDE.md de cada pasta) e aparecem quando ela busca no acervo. Assim, o que uma pessoa aprende, a IA de todos passa a saber.

### 8.3 Ver e mexer no terminal dos outros [decidido em 23/09/2026]

- **O objetivo não é gravar, é ajudar.** O Theus é o técnico da equipe: ele precisa abrir o terminal de qualquer pessoa, ver o que está acontecendo e digitar ali para resolver, como quem senta ao lado. E a equipe faz o mesmo entre si (5.16). Primeiro na rede local; depois de qualquer lugar.
- **Ao vivo**: uma tela mostra os terminais da equipe em tempo real, como uma parede de monitores, cada terminal com o nome do agente e a foto da pessoa. Um clique amplia.
- **Controle**: com o terminal ampliado, quem tem permissão digita e o que digitou aparece na tela do dono, na mesma sessão. O dono vê um selo "Theus está no seu terminal Rita" e pode encerrar o controle quando quiser.
- **Quem vê e quem mexe [decidido]**: todos veem todos. Para mexer: o Theus e a gestão entram direto; os membros de um projeto entram direto nos terminais uns dos outros; qualquer outra pessoa pede e o dono aceita com um clique. O aceite vale até o dono encerrar.
- **Histórico [para depois]**: guardar as sessões (comandos, respostas e pedidos à IA, com hora) para busca e para o acervo. Se vier, grava só a saída, nunca a entrada, para não guardar senha digitada.
- **Regras**: todos sabem que é assim; um selo "ao vivo" aparece no terminal de quem está sendo visto; cada pessoa pode pausar a transmissão de um terminal (ex.: enquanto digita uma senha).

### 8.4 O sonho [decidido: existir · proposta: forma]

Toda madrugada o sistema "sonha": revisa tudo o que foi feito no dia e refina o conhecimento.

1. Junta o material do dia: terminais, prompts, aprendizados, reuniões e demandas.
2. Junta os repetidos e reforça o que se confirmou.
3. Agrupa por tema e encontra as perguntas que ficaram sem resposta.
4. Escolhe os 3 melhores prompts.
5. Atualiza o arquivo que a IA de cada terminal lê.
6. Deixa de manhã o **relatório do sonho** no Meu dia e na TV: o que a Babel aprendeu ontem.

Os passos 1 a 5 são contas, sem LLM. **[aberto]** Um resumo em texto corrido pode ser escrito pela IA do Theus.

### 8.5 Os 3 melhores prompts [decidido: existir]

- Todo pedido feito à IA no terminal fica no histórico.
- **Critérios [proposta]**, todos à vista: a demanda foi concluída com OK e sem devolução, outras pessoas reusaram o prompt, recebeu estrelas de quem viu e é diferente dos que já estão na biblioteca.
- Os 3 do dia aparecem na TV, com a foto de quem escreveu, e vão para a **biblioteca de prompts**, onde qualquer pessoa usa com um clique.

### 8.6 Alimentar a IA do Theus [decidido: objetivo]

- O acervo, os aprendizados, os históricos de terminal e os relatórios do sonho saem em formato aberto (SQLite e JSONL), com uma API local, para a IA que o Theus está programando aprender com o trabalho das 11 pessoas.
- **[proposta]** Um combinado escrito com a equipe: o que é gravado, para quê, quem vê e como pausar.

### 8.7 Ideias faladas: nada do que é dito se perde [decidido em 23/09/2026]

Muitas ideias nascem conversando e se perdem. A equipe conversa o dia inteiro, então a sala tem memória curta sempre ligada e dois botões.

- **Memória da sala**: um microfone de sala ligado ao Mac do Theus escuta sempre e guarda só os **últimos 5 minutos** em memória, sem gravar em disco. A transcrição desses 5 minutos roda sempre, em texto, e é descartada junto com o áudio quando o tempo passa.
- **Botão 1, "Salvar ideia falada"**: alguém disse algo bom. Qualquer pessoa aperta (Estação, celular, iPad, atalho de teclado, botão físico na mesa). Os últimos 5 minutos viram texto e vão para Ideias e para o acervo, com a hora e quem apertou. A frase mais parecida com ideia ("e se a gente…", "que tal…", "a gente podia…") vira o título.
- **Botão 2, "Começar a gravar"**: a conversa está boa e vai continuar. Ao apertar, o sistema **junta os 5 minutos anteriores** (até 10, se a pessoa segurar o botão) com o que vem depois, e transcreve sempre até alguém apertar "Parar". Vira uma ata ou uma ideia longa, com a hora de início real (antes do clique).
- **Gatilhos sem apertar nada [definido, da pesquisa]**:
  - **Palavra de ativação**: "Babel, guarda isso" salva os últimos 5 minutos; "Babel, começa a gravar" liga o botão 2. Roda local com openWakeWord (aberto e gratuito).
  - **A sala sugere**: como os 5 minutos já estão transcritos, o sistema marca as frases com cara de ideia ("e se a gente…", "que tal…", "a gente podia…") e a TV mostra por 30 segundos "parece que saiu uma ideia: salvar?". Quem quiser aperta ou fala "Babel, guarda".
  - **Botão físico na mesa**: um Stream Deck ou botão Bluetooth no meio da sala, para quem está longe do computador.
  - **Só transcreve fala**: um detector de voz (Silero VAD) deixa o whisper.cpp parado quando a sala está em silêncio, para não gastar o Mac o dia inteiro.
- **Ideia falada individual**: um botão de até 1 minuto no computador, no celular e no iPad, para a pessoa gravar a própria voz. Vira texto e entra em Ideias, com o autor.
- **Gravar a reunião**: é o botão 2 com nome de reunião. A transcrição entra na ata (6.1).
- **Transcrição na própria máquina**, com o whisper.cpp, que o Theus já usa no PABX. O áudio não sai do escritório.
- **Quem falou**: primeira versão sem saber quem falou (o texto vem "da sala"). Depois, cada computador pode gravar o próprio microfone e o sistema alinha pelo relógio, aí cada trilha já é uma pessoa. A diarização por voz (pyannote) é a alternativa, mas erra em sala cheia.
- **Microfone**: para 11 pessoas, um microfone de teto ou array (ex.: Shure MXA910), não um viva-voz de mesa. Cotar no Brasil antes da fatia 8.
- **Regras**: a luz de escuta sempre à vista na TV ("● sala com memória de 5 min"); qualquer um pausa a memória ("conversa particular"); o áudio é apagado depois de transcrito e fica só o texto; nunca em conversa de RH ou individual. Combinado escrito com a equipe antes de ligar.
- **Pesquisa**: o que existe pronto para captura retroativa, palavra de ativação e microfones de sala está em `docs/pesquisa/reports/Captura de ideias faladas.md`.

### 8.8 Loja da equipe: skills, MCPs, plugins e chaves [decidido em 23/09/2026]

O que uma pessoa monta para a IA dela serve para todas. A configuração da IA deixa de ser de cada um.

- **O que se compartilha**: skills (pastas `.claude/skills/*`), servidores MCP (`.mcp.json`), plugins do Claude Code, hooks, CLAUDE.md de referência e os agentes com nome (instruções e foto).
- **Como**: cada pessoa tem uma pasta `Loja/` dentro da própria pasta compartilhada. O que está ali aparece na tela **Loja da equipe** de todos, com nome, dono, descrição e o botão **Instalar**. Instalar copia para a configuração do Claude Code da pessoa (a Estação escreve nos arquivos certos, sem a pessoa abrir terminal). O Claude Code já aceita marketplace por pasta local, então a Loja é um marketplace da Babel.
- **Atualizar**: quando o dono muda a skill, quem instalou vê "versão nova" e atualiza com um clique.
- **Chaves de API**: nunca ficam na pasta compartilhada. Cada pessoa guarda as suas no cofre do próprio computador (Keychain no Mac, Credential Manager no Windows), e a Loja só diz "esta skill precisa da chave X". Chaves que a empresa paga (ex.: uma API de CNPJ) são entregues pelo Theus a cada pessoa uma vez, pelo chat direto, e guardadas no cofre.
- **Na TV**: "Bruno publicou a skill 'Proposta comercial'" entra na evolução da semana.

## 9. Recursos simples de gestão

Na mesma linha das demandas com cronômetro: coisas pequenas que dão controle sem virar burocracia. A maioria vem da pesquisa (Runrun.it, Basecamp, Linear, Asana, ClickUp, monday.com).

| Recurso | O que faz | De onde vem | No protótipo |
|---|---|---|---|
| Pausa com motivo | Cada pausa diz o porquê; no fim do mês dá para ver para onde foi o tempo (reunião, espera, retrabalho) | Runrun.it | sim |
| Uma demanda por vez | Começar outra pausa a atual, e o tempo medido fica honesto | Runrun.it | sim |
| Estimativa × real | Quem pede estima; no fim, compara. A equipe aprende a estimar | Runrun.it | sim |
| Devolver com comentário | O OK pode voltar com comentário obrigatório, que conta como retrabalho | ClickUp | sim |
| Perguntar antes de começar | Quem recebe tira a dúvida antes de dar o play, sem cronômetro rodando | Linear (triagem) | sim |
| Estou travado | Um clique pausa com "travado" e avisa quem pediu | — | sim |
| Cutucar | Quem pediu manda um lembrete, no máximo um por hora | — | sim |
| Valeu! | Depois do OK, um agradecimento que aparece na TV | — | sim |
| Resumo do dia | Cada um vê o que fez e quanto tempo levou; a TV mostra só o total da equipe | Runrun.it, Basecamp | sim |
| Carga da equipe | Uma coluna por pessoa com demandas abertas, rodando e atrasadas | monday.com | sim |
| Check-in do dia | Às 9h: "o que vai fazer hoje? tem algum bloqueio?". Substitui a reunião de status | Basecamp | sim |
| Aprendizado para concluir | Só marca "pronta" quem escreve o que aprendeu; o que é repetido não conta | pedido do Theus | sim |
| Cuidando da gente | A TV percebe quem pode precisar de uma mão e convida a ajudar | pedido do Theus | sim |
| Pergunta da semana | Uma pergunta aberta; as respostas vão para a TV e o acervo | Basecamp (check-ins) | sim |
| Ideias com apoio | Qualquer um propõe, os outros apoiam e a TV mostra | — | sim |
| Voltar como estava | Toda gravação guarda a versão anterior | VS Code, Google Docs | sim |
| Pedir ajuda a quem sabe | Manda o arquivo aberto como demanda para quem pode ajudar | — | sim |
| Receitas no terminal | Pedidos prontos para a IA, para quem está começando | — | sim |
| Tarefas livres | Demanda sem responsável: quem puder pega, e o cronômetro liga | pedido do Theus | sim |
| Guardar os últimos 5 minutos | O microfone da sala só guarda um trecho quando alguém aperta | pedido do Theus | sim (transcrição simulada) |
| Pausa automática fora do expediente | No almoço e depois das 18h, os cronômetros pausam sozinhos | Runrun.it | como regra |
| Captura rápida | Um atalho anota algo solto para organizar depois | Basecamp, Trello | não |
| Modelos de demanda | Pedidos que se repetem (reembolso, arte, proposta) já vêm preenchidos | — | não |
| Demandas recorrentes | Toda segunda, o relatório aparece sozinho | — | não |
| Registro de decisões | Lista do que foi decidido, por quem e quando | 37signals | não |
| Não perturbe | O status "em foco" silencia as notificações | 37signals | não |

**Cuidados**: as horas por pessoa ficam só para a própria pessoa e para a gestão, nunca na TV. E medir o tempo de uma tarefa não é registro de ponto, que tem regras próprias na lei.

## 10. Identidade visual

Duas referências do Theus, da mesma família escura com roxo.

**Babel Terminal** (`~/Downloads/babel-terminal/theme.css`): azul-marinho com degradê roxo → azul → ciano. **[proposta]** Base da Estação, que é tela de trabalho de muitas horas.

| Uso | Cor |
|---|---|
| Fundo | `#060b16` |
| Cabeçalho | degradê `#151027` → `#081827` |
| Linhas e bordas | `#30334c`, `#42597d` |
| Texto | `#d7e4fb` |
| Texto apagado | `#8799bc` |
| Aba ativa (sublinhado) | `#8670ff` |
| Destaque ciano | `#88d7ea` |
| Degradê da marca | `#9160ec` → `#29ccec` |
| Estado ok / alarme / sem dado | `#7fd6a6` / `#ff6b6b` / `#5d6b78` (do painel-vivo) |

**Grafo v5** (`Dominic/sistemas/vyra/alma/web/grafo/vyra-grafo-v5-original.html`): roxo profundo com uma única cor-assinatura. **[proposta]** Base da TV e do Mapa.

| Uso | Cor |
|---|---|
| Fundo | `#090413` |
| Painéis | `#120b1e` |
| Cor-assinatura | `#a040fd` |
| Texto | `#c7a2ff` |
| Rampa roxa (do escuro ao claro) | `#230a3c` → `#f2eaff` |
| Alarme (usado uma vez só) | `#ee343b` |
| Destaque de modo (ex.: projetando) | `#d98a00` (só da referência; revisto em 25/09/2026: no Babel Coop, projetando = só uma luz de borda roxa, sem aro âmbar — [Theus, 23/09] CHECKLIST.md:177, docs/CHECK_DO_THEUS.md:49) |

- **Layout**: o do VS Code (barra de atividades, painel lateral, abas, terminal à direita, barra de status e paleta de comandos).
- **Letras**: monoespaçada no terminal, nos números e nos rótulos técnicos; sem serifa no resto da interface. O grafo v5 usa monoespaçada em minúsculas, com 11 px: serve para a Estação, mas é pequena demais para a TV.
- **Movimento** (do grafo v5): o fundo respira devagar, nada pisca, o foco acende e o resto apaga. A animação pausa quando a tela não está à vista.
- **Logo "b"** em neon pulsando como marca d'água, no terminal e na TV. (Revisto em 25/09/2026: sem marca d'água; o meio vazio fica liso, só com "Nada aberto · Ctrl K"; o "b" fica pequeno no topo e, em neon que liga e desliga, no canto do terminal — Theus, 23/09, `.deus/missao-design/MISSAO.md:9`.)

### Referências do Theus

- **Babel Terminal** (`~/Downloads/babel-terminal`): paleta, neon, degradê, abas e prompt. É a base visual da Estação e do terminal.
- **Grafo v5** (`Dominic/sistemas/vyra/alma/web/grafo/`): mapa do organismo Vyra desenhado em Canvas, sem biblioteca. Tem nós que brilham, estado mostrado pelo preenchimento, uma coluna com instrumentos e cartas e uma caixa única de busca. É a base do Mapa da equipe e dos instrumentos da TV.
- **Reino + Babel** (o app da porta 4180; a pasta do código, `~/Desktop/YHWH/12-reino-rede-social/`, não existe mais, e o que funcionava ficou no cache do Chrome): rede de empresários com graus heráldicos, mais a Babel como sistema da empresa. Traz o status de gravação sempre à vista ("Salvando…", "Salvo", "Conflito"), um commandbar ⌘K único, o dock que sai da lateral e vai para baixo no celular, o terminal com gramática fechada (Reino/1, em que nenhum comando roda o shell) e, na TV, números com zero à esquerda ("03") e barras "6/10". Roda em Node 22 sem dependências e SQLite, o mesmo desenho do caminho A.
- **painel-vivo** (`Dominic/sistemas/vyra/alma/web/painel-vivo.html`): faixa de estado no topo, cartões com borda colorida pelo estado, "sem dado" diferente de zero e o rodapé "o que esta tela não sabe".
- **vyra-tela** (`Dominic/sistemas/vyra/alma/web/vyra-tela.html`): a fala mais nova grande e as anteriores esmaecidas. Boa ideia para o mural ou para destacar o chat na TV.

## 11. Arquitetura

- **Cada computador é um servidor [decidido em 23/09/2026]**: a Estação de cada pessoa traz dentro um servidor Node (com SQLite) que serve os arquivos da pasta dela e os terminais dela para o resto da equipe, por HTTP e WebSocket. As Estações se acham na rede local por mDNS/Bonjour. Não há máquina central para arquivos e terminais.
  - **[aberto]** O que é de todos (chat, demandas, metas, aprendizados, acervo) precisa de um lugar: ou um computador coordenador (o Mac do Theus, ou depois um mini PC), ou cada Estação guarda uma cópia e elas se sincronizam. A primeira opção é mais simples e é a proposta para a fatia 1.
- **Estação**: Electron (a mesma base do VS Code), com interface em React, terminais em xterm.js + node-pty (um por agente) e observador de pasta. Mac e Windows.
- **Celular**: a mesma interface React, no navegador. **TV**: uma janela da Estação do Theus, só de leitura, espelhada por HDMI ou AirPlay; não é um cliente e não tem login.
- **Diário de eventos [decidido em 23/09/2026]**: o que é de todos (chat, demandas, metas, aprendizados, documentos, projetos) é uma lista de eventos imutáveis. Cada Estação é dona dos eventos que a pessoa criou (numerados em sequência) e replica os das outras por WebSocket. O estado é a soma dos diários. Quando uma Estação volta, ela pede o que perdeu. Não há máquina central; o sonho noturno e a memória da sala rodam no Mac do Theus porque o microfone e a TV estão nele, não porque ele é servidor.
- **Editar ao vivo (Live Share) [decidido]**: quem edita o arquivo de outro manda as mudanças para a Estação do dono, que aplica e devolve a todos os que estão no arquivo (Yjs com a Estação do dono como servidor daquele documento).
- **Voz entre Estações**: WebRTC ponto a ponto na rede local, com sinalização pelo WebSocket das Estações.
- **Endereço e HTTPS [proposta]**: um domínio de verdade apontando para o IP do Mac no escritório (ex.: `coop.babel-os.com`), com certificado válido via Caddy. Sem HTTPS, o navegador desliga as notificações e o modo app no celular. Para isso:
  - reservar o IP do Mac no roteador;
  - conferir se o roteador bloqueia endereço de internet que aponta para IP interno (proteção contra "DNS rebinding").
- **Login [decidido]**: entrada sem cadastro — na rede local a pessoa acha a equipe, confere o código de 4 dígitos e a gestão aceita; o token colado fica como plano B (revisto em 25/09/2026: antes só o token; entrada pela rede local feita em 25/09). Depois, nome + PIN, com sessão longa e limite de tentativas. A TV não tem login (é a janela do Theus). O celular e o iPad entram com o mesmo nome + PIN.
- **Ponte de arquivos [proposta]**:
  1. a Estação de cada pessoa observa a pasta e publica a lista (nome, tamanho, data, tipo) para as outras;
  2. quando alguém abre um arquivo, pede direto à Estação do dono, que responde na hora;
  3. funciona igual no computador, no celular e na TV, e dá para avançar e voltar num vídeo;
  4. a Estação do dono nunca aceita caminho fora da pasta compartilhada (`../`), e a lista de ignorados cobre `.env`, `.pem`, `.ssh` e `credentials*`.
- **Backup**: cópia diária do banco de cada Estação e do que é de todos para outro disco.
- **Armazenamento [decidido em 23/09/2026]**: os arquivos ficam só com o dono. O acervo guarda o índice e o texto extraído; as versões ficam na Estação do dono.
- **Acervo [proposta]**: SQLite com FTS5 (busca por palavras) e uma tabela de vetores calculados na própria máquina, sem LLM (vetores de pedaços de palavras, ou um modelo de embeddings pequeno e local). Um processo reindexa o que muda.
- **Conector para os agentes do terminal [decidido em 23/09/2026]**: o comando `coop` e um servidor MCP do Babel Coop com todas as ações do app (buscar, ler, aprendi, aprendizados, demandas, campanha, meta, aviso, projetar, tv, pessoas, projetos, whatsapp, loja). É por aqui que um agente cria uma campanha para alguém. Cada pasta ganha um CLAUDE.md que manda a IA consultar o acervo e ler os aprendizados. A menção de pessoa no terminal usa a ferramenta `pessoas` para resolver o nome e mostrar a foto.
- **Terminal ao vivo com controle [decidido em 23/09/2026]**: a Estação manda a saída de cada terminal (mais os redimensionamentos) por WebSocket para quem estiver assistindo; quem tem permissão manda teclas de volta, e a Estação do dono escreve na mesma pty. É o desenho do tmate e do VS Code Live Share. Nada é gravado nesta fase.
- **Sonho [proposta]**: um trabalho agendado no computador coordenador, de madrugada.
- **iPad [decidido]**: app à parte só para o iPad, com o quadro de borda infinita. Começa como PWA (exige HTTPS na rede local); vira nativo se o Safari atrapalhar.

## 12. Comprar pronto ou construir

- A pesquisa não achou nada pronto que cubra o conjunto, nem no GitHub nem nas empresas. O mais perto é o Nextcloud (arquivos, chat e quadros), mas ele guarda os arquivos no servidor e não tem terminal nem painel de TV.
- Ferramentas pagas para 11 pessoas custam de R$ 280 a R$ 990 por mês (Trello, ClickUp, Asana, monday.com), e um painel de TV à parte (Geckoboard) custa uns R$ 405 por mês. Nenhuma tem terminal, pasta local ou projeção. Trello, Jira e Pipefy deixam de ser gratuitos justamente no 11º usuário.
- O que justifica construir é o encaixe (TV nativa, dados na rede local, chat no lugar do WhatsApp pessoal), não a economia.
- Relatório completo: `docs/pesquisa/reports/Referências de colaboração em equipe local.md`. Ele foi escrito a partir das notas da pesquisa, antes das decisões, e por isso recomenda PocketBase e Syncthing. Este arquivo segue o que foi decidido depois: caminho A e arquivo só com o dono.

## 13. Riscos e cuidados

- **Mac do Theus como TV e microfone**: se ele dormir, fechar a tampa ou sair do escritório, a TV apaga e a memória da sala para; o chat e as demandas continuam, porque cada Estação tem a cópia do diário. Dá para impedir o repouso quando estiver na tomada. O plano de saída é um mini PC atrás da TV (a partir de ~R$ 1.000) só para TV e microfone.
- **Escuta contínua da sala**: é o ponto mais sensível de todos. Sem combinado escrito, luz à vista e botão de pausa, vira vigilância. O texto dos últimos 5 minutos nunca é guardado sem alguém apertar.
- **Agente respondendo o WhatsApp pessoal**: pode bloquear o número. Modo "sugere e eu mando" por padrão.
- **Arquivo só com o dono [decidido]**: computador desligado = arquivo e terminal indisponíveis. É uma escolha consciente.
- **Mexer no terminal dos outros**: quem controla digita com as permissões do dono. Precisa de selo visível, do dono poder encerrar, e de um combinado com a equipe.
- **Agentes que mexem no app**: um agente pode criar demanda para a pessoa errada ou apagar algo. Toda ação do agente fica assinada com o nome do agente e da pessoa dona, e "Voltar como estava" vale também para elas.
- **Privacidade**: a pasta escolhida fica inteira visível, e a TV fica numa sala. Por isso existem o aviso, a lista de ignorados e o modo visita. Presença, aniversários e fotos na TV mexem com a LGPD e pedem consulta.
- **Terminal**: roda com as permissões da pessoa. Cada um usa a própria conta de IA, e o `.env` fica de fora da pasta compartilhada.
- **TV comum**: é feita para umas 8 horas de uso por dia. Desligar fora do expediente.
- **Instalação do app**: sem assinatura digital, Mac e Windows mostram um alerta ao instalar. Assinar custa (Apple: US$ 99 por ano; Windows: certificado pago).
- **Cuidado ou vigilância**: terminais ao vivo, nome na TV e uma IA aprendendo com o trabalho de todos pedem combinados claros com a equipe (o que é gravado, para quê, quem vê e como pausar). A LGPD exige transparência e finalidade no tratamento de dados de funcionários. Sem isso, a ferramenta de cuidado vira ferramenta de controle.
- **Segredos no histórico**: comandos com senhas e chaves precisam ser mascarados antes de gravar.
- **Aprendizado obrigatório vira burocracia**: se for exigido em toda tarefa pequena, as pessoas escrevem qualquer coisa. Sugestão: exigir em demandas acima de 15 minutos.
- **Ranking de prompts vira disputa**: critérios à vista e nenhuma pontuação acumulada por pessoa.
- **WhatsApp**: os caminhos não oficiais podem bloquear o número.
- **Corrigir o arquivo dos outros**: sempre com aviso ao dono e com a versão anterior guardada.
- **Gravação de voz**: exige aviso visível e regra clara de uso. O áudio deve ser apagado depois de transcrito.

## 14. Perguntas em aberto → decisões para fechar a fase

Em 23/09/2026 o Theus pediu para fechar a fase de projeto sem mais perguntas. O que ele decidiu está marcado **[Theus]**; o resto foi definido por inferência do que ele pediu, marcado **[definido]**, e muda se ele discordar.

1. **Servidor** [Theus]: cada computador é um servidor. O que é de todos é um diário de eventos copiado em todas as Estações (seção 11).
2. **Papéis** [definido]: todos mandam aviso para a TV e projetam; meta e campanha são do Theus e da gestão; cronômetro é de quem pede a demanda. Um papel "gestão" é dado pelo Theus na tela Equipe.
3. **Mural na TV** [definido]: entra direto, com nome e foto. O Theus e a gestão tiram com um clique. Se virar problema, liga a aprovação.
4. **Campanha** [definido]: uma meta com prazo e placar ("50 clientes até 30/09"), com dono e com o que conta um ponto.
5. **Números das metas** [definido]: digitados à mão ou pela conclusão de demandas ligadas à meta. Integração com o Babel OS fica para depois.
6. **Cronômetro** [definido]: os dois. Cronômetro de demanda (quem recebe pausa, quem pediu dá o OK) e contagem regressiva de campanha na TV.
7. **Online na TV** [definido]: mostra só de quem aceitou no perfil.
8. **Endereço** [definido]: `coop.babel-os.com` com certificado por desafio DNS no Caddy, para o iPad e o celular. As Estações se acham por mDNS sem depender disso.
9. **Tamanho da TV** [definido]: medir na primeira instalação; a TV tem três tamanhos de letra na configuração da Estação do Theus.
10. **Conta de IA** [definido]: cada pessoa usa a própria conta do Claude Code. Quem não tem, a Babel cria.
11. **Paleta** [definido]: uma só, a do Babel Terminal (azul-marinho, degradê roxo → azul → ciano). A TV usa a mesma, com letras maiores e mais contraste.
12. **Mapa da equipe** [definido]: fica para a fatia 10.
13. **Etapas com cronômetro** [definido]: cada etapa de uma tarefa com fluxo tem o próprio cronômetro, e quem dá o OK da etapa é quem passou a tarefa.
14. **Pausa fora do expediente** [definido]: ligada para todos, com horário por área.
15. **Onde fica o conhecimento** [Theus]: os arquivos ficam só com o dono; o acervo guarda o índice e o texto extraído.
16. **Aprendizado obrigatório** [Theus]: em toda demanda; o repetido soma +1.
17. **Terminais ao vivo** [Theus + definido]: todos veem todos. Mexem: o Theus e a gestão direto, membros de projeto direto, os outros com aceite do dono.
18. **Cuidando da gente** [definido]: avisa a pessoa primeiro; se em 10 minutos ela não responder "estou bem", vai para a TV como convite.
19. **Chat no acervo** [definido]: só as mensagens que alguém marcar como "guardar no acervo". Conversa comum não entra.
20. **WhatsApp** [Theus]: o da própria pessoa numa tela da Estação, com o agente respondendo ("sugere e eu mando" por padrão).
21. **Sonho** [definido]: contas e regras sem LLM para o resumo dos números; a IA do Theus escreve o texto quando ele quiser, a partir da exportação.
22. **Formato para a IA do Theus** [definido]: JSONL por dia (eventos, aprendizados, ideias, transcrições) mais o SQLite do acervo.
23. **Memória da sala** [Theus]: microfone de sala no Mac do Theus, 5 minutos em memória, dois botões (seção 8.7). Áudio apagado depois de transcrito.
24. **Agentes em nome de outro** [definido]: o agente age na conta de quem o criou, mas pode criar demanda, campanha e aviso para qualquer pessoa, como o dono faria. Ações que apagam ou encerram algo de outra pessoa pedem confirmação no terminal antes de valer.
25. **Agentes visíveis** [definido]: sim, os agentes de cada pessoa aparecem na parede de terminais e na Equipe, com nome e foto.
26. **Projetos** [definido]: existem como coisa no sistema (5.15); as pastas continuam com cada membro.
27. **TV** [Theus]: espelho sem botão, controlada pela Estação e pelo terminal.
28. **Ajuda par a par** [definido]: qualquer pessoa entra no terminal de outra com aceite, chama para a própria tela, e fala por voz entre Estações (5.16).
29. **Loja da equipe** [definido]: skills, MCPs, plugins e agentes compartilhados pela pasta `Loja/` de cada um (8.8); chaves só no cofre de cada computador.

## 15. Perguntas para descobrir o que não sabemos

Perguntas abertas, feitas para trazer à tona o que ninguém pensou ainda. Sugestão: usar uma por semana como "pergunta da semana".

1. Que trabalho acontece hoje fora de qualquer sistema (na cabeça, no WhatsApp pessoal, no papel) e ninguém vê?
2. Que comportamento o cronômetro vai incentivar sem querer? (ex.: não pausar, pegar só demanda fácil)
3. O que vale mais aqui: tempo gasto ou problema resolvido? Como o sistema mostra a diferença?
4. Quem da equipe vai resistir a usar isso, e o que faria essa pessoa usar sem ser obrigada?
5. Em que momento do dia o sistema atrapalha mais do que ajuda?
6. Que conhecimento da Babel não está escrito em lugar nenhum, e por isso a IA nunca vai achar?
7. O que o sistema precisa esquecer, em vez de guardar para sempre?
8. Quando um sinal de "precisa de ajuda" vira constrangimento? Quem decide o que vai para a TV?
9. O que acontece quando a IA do terminal erra no arquivo de outra pessoa?
10. De quem é o conhecimento que uma pessoa deixa quando sai da empresa?
11. O que muda quando forem 30 pessoas, ou dois escritórios?
12. Se o Mac do Theus sumir amanhã, o que se perde?
13. O que os clientes veriam de diferente na Babel se isso der certo?
14. Como cada pessoa vai saber que o trabalho dela fez a empresa evoluir?

**Como canalizar [proposta]**:

- a pergunta da semana aparece na TV e no Meu dia, e as respostas vão para o acervo;
- o sonho junta as respostas e aponta o que se repete e o que surpreendeu;
- a cada 15 dias, uma retrospectiva de 20 minutos com três perguntas: o que nos surpreendeu, o que ninguém falou e o que vamos parar de fazer.

## 16. Protótipo e ordem de construção

**Protótipo v3: telas clicáveis [feito em 23/09/2026].** HTML com dados de exemplo, para a equipe ver e opinar antes de construir de verdade. Fica em `prototipo/` e está publicado em https://claude.ai/artifact/KQZbUM13TjEt473zBQr1y4 (privado; versão 5). O v3 trouxe: TV sem botão em janela própria (aro roxo, rolagem pela Estação, modo site), agentes com nome e foto no terminal com menção de pessoa e pedidos em português que viram ações com desfazer, parede de terminais por agente com Entrar/aceitar/selo e digitação no terminal do outro, Explorador em modo projeto com arrastar arquivo para uma pessoa, telas Projetos, WhatsApp com agente, Loja da equipe, Navegador do agente com Raio-X e Clonar, Máquina (backend visual com Testar), perfil em tela inteira com gamificação, "Salvar ideia falada" e "Começar a gravar", HTML aberto como site, foto de quem salvou, fechar todas as abas e cronômetro arrastável.

O que dá para usar no protótipo:

- **Estação**: explorador (árvore do HD da equipe) à esquerda, arquivo aberto no meio e terminal à direita. As laterais recolhem com Ctrl+B e Ctrl+\` e as bordas arrastam. O editor mostra Markdown formatado, código com cores e números de linha, CSV em tabela e PDF de verdade (pdf.js). Também mostra imagem, vídeo local, a prévia do site para HTML, o mapa mental e o quadro. Tem ainda editar e salvar com versões, "Voltar como estava", o aviso quando a gestão corrige o arquivo de alguém, o botão "Pedir ajuda" e a opção "Levar para a reunião". O terminal cria arquivos que aparecem na árvore de todos: `touch`, `echo "…" > nota.md` e, quando o pedido é para criar algo, a IA simulada deixa um rascunho em `ia/`.
- **Telas da Estação**: Meu dia, Demandas com cronômetro e **tarefas livres**, Chat no jeito do WhatsApp (com a conversa de cliente simulada), Reunião com a voz da sala, Acervo (busca por palavras e por semelhança, sem LLM), Inteligência (aprendizados, sonho, top 3 de prompts, pergunta da semana, ideias), Terminais ao vivo (parede dos 11 e histórico), Tarefas com fluxo, Metas, Equipe (fotos, cuidado, controle da TV) e Mapa.
- **TV**: painel com uma zona que gira (avisos, evolução, pergunta, sonho, tarefas livres, ideias), a área "cuidando da gente", a reunião com a mesa, o quadro ao vivo e a projeção com o conteúdo real do arquivo.
- **iPad**: quadro no estilo Freeform (caneta, marca-texto, post-it, texto) com o botão "Mandar ao vivo para a TV".
- **Como ver tudo junto**: abra o link em duas ou três janelas; numa clique em **Tela da TV** (abre a TV numa janela própria) e, para ver o iPad, abra o link com `#ipad` no fim (no protótipo o iPad não tem botão na Estação, porque é um app à parte). As janelas conversam na hora.
- **Ver como** (no alto da Estação) troca a pessoa. O resto da equipe é simulado: a cada 11–18 s alguém começa, pausa, pega uma tarefa livre, passa uma etapa ou manda mensagem. Os terminais da equipe e as falas da sala também são simulados.

O que é só simulação no protótipo (não existe ainda de verdade):

- **Sem servidor e sem banco**: o estado vive na memória das janelas abertas e some ao fechar todas.
- **Terminal**: o bash e a IA são simulados. Os comandos `coop` funcionam sobre os dados de exemplo; o Claude Code de verdade entra no app.
- **Voz**: a fala e a transcrição são simuladas (o artifact recusa o microfone). No app, a transcrição usa o whisper.cpp local.
- **Arquivos**: não há pasta sincronizada de verdade. O "↥ Abrir do computador" lê o arquivo só na sua janela.
- **O resto também não existe**: WhatsApp real, login, fotos salvas, notificações no celular e PWA instalável no iPad.

Depois, o sistema em fatias, cada uma funcionando de ponta a ponta:

1. **Esqueleto**: Estação (Electron, Mac e Windows) com servidor embutido e diário de eventos replicado, explorador com as pastas de todos, editor, terminais de verdade à direita (xterm.js + node-pty, mais de um); as Estações se acham na rede local; login; a tela da TV abrindo numa janela do Theus; celular abrindo. Testar o node-pty no Windows antes de tudo.
2. **Terminal ao vivo com controle**: parede dos terminais, ampliar, digitar no terminal do outro, pedido e aceite, selo e botão de encerrar, pausa de transmissão.
3. **Agentes**: terminais com nome e foto, conector `coop`/MCP com as ações do app, menção de pessoa com foto no terminal, `coop tv …`.
4. **Chat**, **demandas com cronômetro** (com tarefas livres e aprendizado obrigatório) e **WhatsApp** com o agente sugerindo respostas. Os eventos aparecem na TV.
5. **Projetos e ajuda par a par**: tela do projeto, editar ao vivo na Estação do dono, chamar para a minha tela, "o que cada um está fazendo", voz entre Estações.
6. **Acervo** (SQLite FTS5 + vetores locais), **APRENDIZADOS.md** e a **Loja da equipe** (skills, MCPs, plugins, agentes).
7. **TV completa**: painel que gira, "cuidando da gente", reunião com a mesa, projeção, site e modo visita, tudo sem botão.
8. **Memória da sala**: 5 minutos em memória, "Salvar ideia falada", "Começar a gravar", palavra de ativação, a sala sugere; ata automática.
9. **iPad**: app à parte com o quadro de borda infinita ao vivo na TV.
10. **Sonho noturno** (resumo do dia, top 3 prompts, exportação para a IA do Theus).
11. **Tarefas com fluxo**, metas, mapa e celular com notificações.

Para depois: acesso de fora do escritório (ver e mexer nos terminais de qualquer lugar), histórico gravado dos terminais, WhatsApp Business pela API oficial, saber quem falou na sala, mini PC para TV e microfone.

A lista do que precisa existir em cada fatia, para conferir na entrega, está em `CHECKLIST.md`. O desenho das telas e dos fluxos está em `UX.md`.

## 15. Decisões de 23/09 à tarde (produção real)

- **Transcrição da sala sem LLM.** O whisper.cpp não é LLM: é um modelo de voz pequeno (~150 MB) que roda na CPU/Metal de um só computador, o que tem o microfone da sala; os outros recebem só texto pela rede. Ninguém mais instala nada. Para o primeiro teste, sem modelo nenhum: o ditado do próprio sistema (macOS `SFSpeechRecognizer` com pt-BR no aparelho; Windows `Windows.Media.SpeechRecognition`) ou o Vosk (modelo pt de ~50 MB). Ordem: começar pelo ditado do Mac do Theus; trocar pelo whisper.cpp quando a qualidade pedir.
- **Editar no visual → código já no protótipo:** "Editar na tela" na vista Site (arrastar e soltar, texto, duplicar, apagar; o código muda junto). O app real troca a serialização do DOM pelo mapeamento elemento → arquivo:linha (CHECKLIST 11a).
- **Primeiro o local, depois o online.** A estrutura real vive em `app/`; a rede local é o teste. O online entra trocando `rede.js` (broadcast) por um ponto de encontro numa VPS; nada mais muda.
- **Design antes de empacotar.** O instalador só embala; o design é HTML/CSS e muda sem reempacotar.
- **Mapa mental = MindForge**, o clone do MindMeister feito pelo Theus, dentro da Estação, com o fundo na cor da identidade e o resto igual (quem vai usar mais já está acostumado). Cada mapa é um `.mapa` na pasta da pessoa; o agente do terminal cria e mexe no mapa por conversa.
- **Entrada sem cadastro.** Na rede local, a pessoa instala o app, acha a equipe, confere o código de 4 dígitos e a gestão aceita: vê a equipe e a equipe vê ela. Plano B, o token: o Theus gera um token na Estação dele (Equipe → Convidar pessoa) e a pessoa cola; o token leva id, nome, papel, o segredo da equipe e o endereço da Estação do Theus na rede. Quem não tem o aceite nem o segredo não entra. (Revisto em 25/09/2026: antes só existia o token; a entrada pela rede local foi feita em 25/09.)
- **Oficina do app: o Babel Coop se muda por dentro.** O Theus, e quem ele liberar, pede ao agente no terminal ("muda no app: …"); o agente edita o código na pasta Oficina/app da pessoa e a mudança fica aguardando. O Theus publica: a Estação dele empacota a interface numa versão (manifesto com hash por arquivo) e o evento faz aparecer "⬆ Atualizar vN" em todas as Estações; quem clica baixa da Estação do Theus, confere e recarrega. O Electron em si atualiza por electron-updater, mais raro; a interface é 95% do app.
- **O navegador do app é da pessoa e do agente.** A pessoa usa como navegador normal (endereço, voltar, abas) dentro da Estação; o agente vê a mesma página e age nela por pedido (navegar, clicar, preencher, ler, Raio-X, clonar, print), com o cursor à vista; "Assumir" e "Devolver" trocam quem está no controle. No app é o `<webview>` do Electron com o conector `coop` (5.7); no protótipo as páginas são de exemplo.
- **Cada peça criada em equipe leva a marca de quem a criou.** Na Máquina, toda peça tem a cor e a foto de quem a criou, sempre ("Ver por pessoa" só acende mais). Na edição na tela, cada bloco mexido fica com `data-por` e a cor da pessoa na borda. Arquivos já mostram a foto de quem salvou. Mapas mentais mantêm o desenho do MindForge (a marca fica no histórico do arquivo).
- **A Máquina é o construtor de backend da equipe, com presets.** O babel-coop não guarda os próprios dados no Supabase: cada computador sustenta o próprio HD compartilhado e o diário replicado, e a Máquina desenha o backend do projeto que a equipe constrói. (Revisto em 25/09/2026: a Máquina constrói primeiro um banco local por projeto — Postgres local, PGlite, feito em 25/09 — e, depois, com o ok e as credenciais do Theus, sobe para o Supabase do projeto do cliente/equipe; a nuvem é a onda seguinte, rede local primeiro. Era "não há Supabase no Babel Coop".) Telas e backends são construídos em equipe; **toda vez que algo é construído e o teste passa, fica salvo como preset** (peças e fios, ou a tela), com nome, quem fez e quantas vezes foi usado. Presets entram em qualquer projeto com um clique ou por "usa o preset X" no terminal, e aparecem em Criar como "Começar de um preset". Corrige o que o 5.17 dizia sobre "ler o Supabase".
- **O cronômetro persegue a pessoa e volta sozinho da pausa.** Desliza pela tela; "⧉ destacar" abre uma janelinha só com ele que fica por cima de tudo, mesmo com o app minimizado ou em outra mesa (janela sempre-no-topo do Electron; Picture-in-Picture no Chrome). Enquanto a demanda roda, o app lembra as peças em que a pessoa mexeu; se ela pausar e, ao voltar, mexer numa delas (ou na demanda, ou num arquivo citado nela), o cronômetro sai da pausa sozinho, avisa e registra, para o tempo não se perder quando ela esquece de tirar a pausa. Graça de 45 s logo depois de pausar.
