# Babel Coop — UX: telas e fluxos

> Desenho da experiência, feito em 23/09/2026 a partir do `IDEIAS.md` v0.4. Vale como referência para construir e para conferir o `CHECKLIST.md`.
> Princípio que guia tudo: **o Theus é técnico e a maior parte da equipe não é.** Cada tela tem que servir aos dois sem virar duas telas.

---

## 1. O que a pessoa sente ao usar

- **Uma janela só.** A Estação é onde a pessoa passa o dia. Nada de abrir outro app para conversar, ver a tarefa ou usar a IA.
- **Tudo à vista, nada escondido.** Os arquivos de todos, os terminais de todos, quem está em quê. A transparência é a regra e o combinado com a equipe é o que a torna cuidado, não vigilância.
- **Ajuda a um clique, nos dois sentidos.** "Pedir ajuda" para quem precisa; "Entrar no terminal" e "Chamar para a minha tela" para quem ajuda.
- **A IA tem nome e cara.** Ninguém "abre o Claude"; a pessoa conversa com a Rita, com o Bruno-bot. Isso tira o medo de quem está começando.
- **Nada do que é dito ou feito se perde.** O acervo, os aprendizados, a memória da sala e o sonho garantem isso sem ninguém precisar "documentar".
- **A TV é o espelho da equipe.** Sem botão. O que importa aparece lá sozinho.

## 2. Anatomia da Estação

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ● ● ●  b Babel Coop     [ Buscar arquivo, comando ou acervo   Ctrl K ]        │
│                                        ver como ▾ · Tela da TV · 🔔 3         │
├───┬──────────────┬────────────────────────────────┬────────────────────────────┤
│ ▤ │ EXPLORADOR   │ README.md × │ precos.html      │ RITA · BRUNO-BOT · +       │
│ ⌂ │ ▾ EQUIPE     │                                │ ╭ theus@estacao ~/BabelCoop │
│ ◷ │   Reuniões   │  (arquivo, tela ou projeto)    │ ╰ ❯ cria uma campanha de   │
│ ◉ │   Quadros    │                                │   50 clientes para a       │
│ ☰ │ ▾ theus      │                                │   [◉ Carla] até 30/09      │
│ ⌕ │ ▸ carla      │                                │                            │
│ ✦ │ ▸ bruno ⋯    │                                │ receitas: Explicar · Buscar│
│ ▣ │              │                                │ [Entrar no terminal de…]   │
│ ◎ │              │                                │                            │
│ ☷ │              │                                │                            │
│ ✱ │              │                                │                            │
│ 💬│              │                                │                            │
│ 🛍│              │                                │                            │
├───┴──────────────┴────────────────────────────────┴────────────────────────────┤
│ ● online · ◷ Reembolso 00:12:03 · ◌ sala com memória de 5 min · Salvo · 11/11 │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Barra de atividades** (esquerda, de cima para baixo): Explorador · Meu dia · Demandas · Chat · Reunião · Acervo · Inteligência · Terminais ao vivo · Tarefas · Metas · Equipe · Mapa · **Projetos** · **WhatsApp** · **Loja da equipe**. Embaixo: Tela da TV e perfil. Sem botão de iPad: o iPad é um app à parte e só ele tem "Projetar na TV".
- **Lateral esquerda**: muda com a atividade (árvore, lista de conversas, lista de projetos…). Recolhe com Ctrl+B.
- **Meio**: abas. Um arquivo, uma tela (Meu dia, Projeto Clínicas, WhatsApp) ou um documento. Cada aba tem seus botões no topo: Prévia · Editar · Levar para a reunião · Projetar na TV · Pedir ajuda · Chamar para cá · Versões.
- **Direita: os agentes.** Cada aba é um terminal com nome humano. Recolhe com Ctrl+`. Largura arrasta.
- **Barra de status**: presença, cronômetro ativo, memória da sala, estado de gravação do arquivo, conexão com a equipe (quantas Estações estão visíveis), quem está no meu terminal.
- **Paleta Ctrl+K**: arquivos, comandos ("nova demanda", "projetar", "entrar no terminal da Carla", "salvar ideia falada"), acervo e pessoas.

## 3. Os agentes (terminal à direita)

**Primeira vez.** O terminal abre com um agente padrão com o nome da pessoa ("Rita" para a Carla é criado por ela; até lá, o agente se chama "Assistente"). Um cartão de 3 linhas explica: "Este é o seu agente. Dê um nome e uma foto. Ele mexe no app inteiro: peça uma demanda, uma campanha, um aviso."

**Aba de agente.** Nome + foto pequena + ponto de estado (parado, pensando, esperando você). O "+" abre "Novo agente": nome, foto (upload ou letra colorida), o que ele faz (texto livre que vira as instruções), e um toggle "aparece para a equipe" (ligado por padrão).

**Menção de pessoa.** Ao digitar um nome da equipe, ele fica sublinhado na cor da pessoa e a foto aparece ao lado, como no chat. Setas ↑↓ escolhem quando há dois "João". O agente recebe o id certo.

**Ações do agente no app.** Passam pelo `coop`. O terminal mostra o que foi feito como cartão dentro da saída: "✓ Campanha '50 clientes' criada para Carla · até 30/09 · [desfazer]". Ações que apagam ou encerram algo de outra pessoa mostram "Confirma? [s/N]".

**Receitas.** Uma linha de chips acima do prompt para quem está começando: Explicar este arquivo · Procurar no acervo · Criar página desta nota · Resumir a reunião · Me ajude com um erro · Responder o WhatsApp.

**Entrar no terminal de alguém.** Botão no topo do painel ("Entrar no terminal de…") abre a lista de pessoas e seus agentes. Também pela paleta e pela parede (seção 5).

**Navegador do agente.** "Rita, entra no site da clínica e preenche o cadastro de fornecedor" abre no meio a aba "Navegador · Rita": barra de endereço só de leitura, a página de verdade, um cursor que se move a cada passo e, embaixo, a lista do que ela está fazendo ("clicando em Cadastro…", "preenchendo E-mail…"). O mesmo aparece no terminal. "Assumir" pausa a Rita e devolve o mouse; "Devolver" retoma. Quando a página pede senha, a Rita para e escreve "sua vez: digite a senha"; a pessoa digita e clica "Devolver".

Ao lado da página fica o **Raio-X**, recolhível: abas HTML · CSS · Copy · Rede · Console. "Selecionar elemento" aponta na página e o HTML e o CSS daquele pedaço aparecem, com "copiar". Em cima, três botões grandes: **Clonar página** (vira a pasta `Clones/<site>/` na minha pasta, aberta como site), **Clonar copy** (`copy.md` com títulos, subtítulos, botões e depoimentos por seção) e **Print inteiro**. O que a Rita clona por pedido aparece do mesmo jeito, com o cartão "✓ Clonado em Clones/clinicavida/ · [abrir]".

## 4. Fluxo: pedir e receber ajuda

**Quem precisa (não técnico):**
1. Está com um erro no terminal ou um arquivo quebrado.
2. Clica "Pedir ajuda" (no arquivo ou no terminal). Escolhe para quem (padrão: Theus) e escreve uma linha.
3. Vira uma demanda para o Theus com link para o arquivo ou o terminal. Aparece na TV como acontecimento ("Carla pediu ajuda com precos.html").
4. Enquanto espera, continua trabalhando.

**Quem ajuda (Theus ou colega):**
1. Recebe a demanda no Meu dia e na coluna de novidades.
2. Clica "Entrar". Abre o terminal da Carla ampliado na Estação dele, com a foto dela no topo e o nome do agente. Se o arquivo estiver no pedido, abre ao lado, editando ao vivo na Estação dela.
3. Digita. Cada tecla aparece na tela da Carla. Ela vê o selo "Theus está no seu terminal Rita" com o botão "Encerrar".
4. Resolve, clica "Sair". A demanda pede um aprendizado de uma linha ("O erro era X, resolvi com Y"), que vai para o acervo e para o APRENDIZADOS.md.

**Sem pedido.** Qualquer pessoa entra na parede de terminais, vê que alguém está travado (o terminal mostra o mesmo erro há 10 minutos, ou a pessoa clicou "Estou travado") e clica "Entrar". Se não for gestão nem membro do projeto, a Carla vê "Bruno quer entrar no seu terminal Rita · [Aceitar] [Agora não]".

**Chamar para a minha tela.** O contrário: Bruno quer mostrar algo. Clica "Chamar para cá" no arquivo ou no terminal, escolhe a pessoa. Ela recebe "Bruno te chamou para ver precos.html · [Ir] [Depois]". Ir abre exatamente o que o Bruno vê. Um "Falar com" ao lado abre voz na hora.

## 5. Parede de terminais ao vivo

```
┌ Terminais ao vivo ──────────────────────────── 11 pessoas · 17 agentes ─┐
│ ┌ Carla · Rita ──────┐ ┌ Bruno · Bruno-bot ─┐ ┌ Davi · Dev ───────────┐ │
│ │ ❯ coop buscar "ref"│ │ ❯ claude "resuma…" │ │ npm test              │ │
│ │ ⌕ 3 resultados     │ │ ✓ 5 próximos passos│ │ ✗ 2 failing  ⚠ 12 min │ │
│ │ [Entrar] [Chamar]  │ │ [Entrar] [Chamar]  │ │ [Entrar] [Chamar]     │ │
│ └────────────────────┘ └────────────────────┘ └───────────────────────┘ │
│ ┌ Eva · Musa ────────┐ ┌ Felipe · Zé ───────┐ ┌ Hugo ─── desligado ───┐ │
```

- Cada cartão: foto da pessoa, nome do agente, últimas 3 linhas ao vivo, há quanto tempo a última mudança. Cartão âmbar quando o mesmo erro se repete ou está parado há mais de 10 minutos.
- Pessoa com vários agentes: os cartões dela ficam juntos.
- Terminal pausado pelo dono: cartão cinza "transmissão pausada".
- Clique amplia; o ampliado tem "Entrar" (ou "Pedir para entrar"), "Chamar para cá", "Falar com".
- Quem está sendo visto vê um olho pequeno na aba do agente com o número de pessoas assistindo.

## 6. Projetos

**Criar.** Projetos → "Novo projeto": nome, membros (com foto), e para cada membro a pasta dele dedicada ao projeto (o sistema sugere `Projetos/<nome>` na pasta compartilhada de cada um e cria se não existir).

**A tela do projeto** (aba no meio):

```
┌ Clínicas em Campinas · 3 membros · desde 10/09 ─────────────────────────┐
│ ARQUIVOS (de todos)      │ CANAL #clinicas         │ DEMANDAS · 4 abertas│
│ ▾ carla/Projetos/Clínicas│ Carla: subi a planilha  │ ◷ Proposta v2 · Bruno│
│     precos.xlsx  ● aberto│ Bruno: vou revisar      │ ○ Landing · Davi    │
│ ▾ bruno/Projetos/Clínicas│ …                       │ ○ livre: fotos      │
│     proposta.md          ├─────────────────────────┴─────────────────────┤
│ ▸ davi/…  ⋯ desligado    │ QUADRO DO PROJETO (iPad ou Estação)           │
│                          │ AGENTES NO PROJETO: Rita (Carla) · Dev (Davi) │
└──────────────────────────┴───────────────────────────────────────────────┘
```

**O Explorador em modo projeto.** No alto da lateral, o seletor "Sozinho · minha pasta ▾" lista os projetos de que sou membro. Escolhendo um:

```
┌ EXPLORADOR · Clínicas em Campinas ▾ ─────────────┐
│ ◉◉◉ 3 pessoas com você agora                     │
│ ▾ ◉ theus (eu)                                   │
│     precos.xlsx        ◉ Carla está vendo        │
│     proposta.md                                  │
│ ▾ ◉ carla · editando planilha.xlsx               │
│     planilha.xlsx                                │
│     fotos/                                       │
│ ▾ ◉ bruno · no terminal Bruno-bot                │
│     contrato.pdf   recebido de Theus · agora     │
│ ▸ ○ davi · desligado                             │
└──────────────────────────────────────────────────┘
```

- Sozinho é sozinho: a árvore de sempre. Em projeto, só o projeto, agrupado por pessoa, com o que cada um está fazendo agora.
- **Arrastar para uma pessoa**: arrasto `precos.xlsx` e solto em "bruno". O arquivo aparece na pasta de projeto do Bruno com "recebido de Theus"; ele vê um aviso na hora. O contrário também: o que me mandam aparece na minha árvore com o selo.
- **Conversa no projeto**: no canal, chips "com todos · com Carla · com Bruno". A conversa direta fica dentro do projeto. "Anexar do projeto" põe um chip clicável para o arquivo.
- Abrir um arquivo de outro membro abre ao vivo na Estação dele: dois cursores, nomes coloridos. Salvar é do dono; o outro vê "Salvo por Carla".
- Membros entram nos terminais uns dos outros sem pedir; o selo aparece do mesmo jeito.
- Ao lado do nome do projeto, "Falar com o projeto" abre voz para todos os membros online.
- "Levar o projeto para a TV" mostra a evolução dele (criado, concluído, próximos passos) no modo reunião.

## 7. WhatsApp com o agente

1. Atividade WhatsApp. Primeira vez: QR code do WhatsApp Web no meio, com a frase "Só você vê esta tela. Ela não entra no acervo nem na TV."
2. Depois, o WhatsApp Web ocupa o meio, com a cara de sempre. A lateral esquerda mostra o que o agente está fazendo: conversas com resposta sugerida, contatos em modo automático.
3. **Sugere e eu mando** (padrão). Chega mensagem. O agente lê e escreve a resposta no campo de texto do WhatsApp, com uma faixa fina em cima: "Rita sugeriu · Enter manda · Esc apaga". A pessoa lê, corrige se quiser, Enter.
4. **Automático por contato.** Na lateral, cada conversa tem um toggle "responder sozinho". Ao ligar, um aviso claro: "Automatizar o WhatsApp pode bloquear seu número. Use com contatos que já conhecem o atendimento." As mensagens mandadas pelo agente aparecem com um ponto colorido na lateral.
5. Pelo terminal: "Rita, responde o cliente da clínica dizendo que mando a proposta amanhã" → o agente escreve no campo daquela conversa. A receita "Responder o WhatsApp" faz isso com a conversa aberta.

## 8. Memória da sala e ideias faladas

**Estado normal.** Barra de status e TV mostram "◌ sala com memória de 5 min". Nada é guardado.

**Salvar ideia falada.** Alguém disse algo bom. Qualquer pessoa:
- clica o botão ⏺ na barra de status, no Meu dia, na Reunião ou no celular;
- ou aperta o botão físico na mesa;
- ou fala "Babel, guarda isso".

Aparece na TV por 5 segundos: "💡 Carla salvou uma ideia falada". Na Estação de quem salvou, abre um cartão com o texto dos 5 minutos, a frase que virou título (editável) e o botão "Confirmar" (padrão) ou "Descartar". Vai para Ideias e para o acervo com a hora e quem salvou.

**Começar a gravar.** A conversa está boa. Clica "Começar a gravar" (ou segura o botão físico, ou fala "Babel, começa a gravar"). O sistema junta os 5 minutos anteriores (até 10, se segurar) e continua até "Parar". A TV mostra "● gravando desde 14:32" com a hora real de início. Ao parar, vira uma ata ou uma ideia longa, com um resumo por regras (sem LLM): frases com cara de ideia, nomes citados, números ditos.

**A sala sugere.** Como os 5 minutos já estão em texto, quando aparece "e se a gente…" a TV mostra no rodapé, por 30 segundos: "parece que saiu uma ideia · salvar?". Qualquer botão ou a palavra de ativação salva.

**Pausa.** "Conversa particular" na barra de status, no celular e no botão físico (toque duplo). A TV mostra "○ sala sem memória" até alguém religar. Fora do expediente, desliga sozinha.

## 9. A TV, espelho sem botão

**Como abre.** Na Estação do Theus, o botão "Tela da TV" abre uma janela nova, limpa, sem barra. Ele arrasta para a tela da TV (HDMI ou AirPlay) e dá tela cheia. Pronto. Não existe nada para clicar nessa janela.

**Como se controla.** Da Estação de quem tem permissão (botão "Projetar", "Levar para a reunião", Equipe → Controle da TV), do celular (Controle da TV) e do terminal (`coop tv painel`, `coop tv site https://…`, `coop projetar proposta.pdf`, `coop tv visita`).

**O que mostra.** Painel (padrão), reunião, quadro do iPad ao vivo, projeção (PDF, imagem, vídeo, documento, com "projetado por Ana" e aro âmbar), site em tela cheia, visita. Acontecimentos passam no rodapé. Selos no topo: "◌ sala com memória de 5 min", "● gravando", "● Theus no terminal da Carla".

**Ritmo.** A zona que gira troca a cada 20 segundos. Evento grande (meta 100%, campanha batida) interrompe com comemoração de 8 segundos e volta.

## 10. Loja da equipe

```
┌ Loja da equipe ─────────────────── 14 itens · 3 novos esta semana ──┐
│ [Skills] [MCPs] [Plugins] [Agentes] [CLAUDE.md]                     │
│ ┌ Proposta comercial · skill ─── Bruno ───┐ ┌ CNPJ grátis · MCP · Theus ─┐ │
│ │ Escreve proposta no padrão Babel a     │ │ Consulta quadro societário  │ │
│ │ partir de uma nota.                    │ │ pela BrasilAPI. Sem chave.  │ │
│ │ 5 instalaram · v3 · [Instalar]         │ │ 9 instalaram · [Instalado ✓]│ │
```

- Instalar copia para a configuração do Claude Code da pessoa. Se precisa de chave: "Esta skill usa a chave X · [Guardar no cofre]" abre um campo que grava no Keychain ou Credential Manager. A chave nunca aparece de novo.
- Publicar: qualquer arquivo ou pasta dentro de `Loja/` na pasta compartilhada vira item. A Estação pede nome e descrição na primeira vez.
- "Versão nova" no item quando o dono muda; atualizar com um clique.

## 10b. Sobre a pessoa (perfil em tela inteira)

Clicar no meu avatar, ou no nome de alguém em qualquer lugar, abre a aba "Sobre Carla" no meio. Nada de janela por cima.

```
┌ ◉ Carla · Financeiro · online · agentes: Lu, Conta ──────── [Editar perfil] ─┐
│ NÍVEL 4 · Cuidadora   ▓▓▓▓▓▓▓░░░ 72% para o 5   🔥 12 dias com aprendizado │
│ selos: 🥇 1º aprendizado · 🤝 10 ajudas · 📚 skill usada por 5 · 💡 ideia virou demanda │
├─────────────────────┬───────────────────────┬───────────────────────────────┤
│ TRABALHOS · setembro│ TEMPO · setembro      │ VOCÊ NO BABEL COOP            │
│ 23 demandas com OK  │ 61 h em demandas      │ 14% do que a Babel sabe       │
│ 7 ajudas dadas      │ 2h39 por demanda      │ acervo      ▓▓▓▓░░░░ 14%      │
│ 5 ideias · 11 aprend│ 4h10 pausada          │ demandas    ▓▓▓▓▓░░░ 19%      │
│ 2 skills publicadas │ foco: 9h–11h          │ projetos    3 de 5            │
├─────────────────────┴───────────────────────┴───────────────────────────────┤
│ MATERIAIS: 48 arquivos · 6 mapas · 4 quadros · 2 clones   (mais abertos: precos.xlsx) │
│ LINHA DO TEMPO: hoje · concluiu "Reembolso" · ontem · publicou skill "Planilha…" │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Gamificação é da pessoa contra ela mesma: nível, selos, sequência e a próxima conquista. Sem ranking entre pessoas e sem placar na TV.
- Todos veem o perfil de todos. "Editar perfil" só o dono e a gestão: foto, área, o que aparece na TV.

## 10d. A Bancada (a tela do meio)

A aba do meio escolhe a forma sozinha: site renderizado, imagem, Máquina, leitura, mapa ou quadro. Em cima de toda aba, a régua de versões com as fotos de quem salvou. No visual, clicar num bloco seleciona (contorno na cor da Babel, alças de tamanho, texto editável no lugar); arrastar move; a barrinha do bloco tem cor, imagem e "Pedir à Rita" para o que não dá para fazer com a mão. Cada mudança salva uma versão e muda o código. "Ver por pessoa" pinta cada parte com a cor de quem fez. "Projetar na TV" leva a aba ao vivo, acompanhando a construção.

## 10b-2. Criar e o modo 3D da tela

A primeira atividade é **Criar**. Abre com os cartões Tela, Máquina e Pesquisa; embaixo, a árvore de arquivos de sempre. Numa tela HTML, o alternador tem **Site | Código | 3D**. No 3D, a página aparece como um painel plano num ambiente escuro com chão; atrás e ao lado, os próximos itens ligados a ela: outras telas como painéis e as peças do backend como placas simples. Só as telas são interativas: a pessoa clica no campo, digita a senha, aperta Enter, e o pulso corre pelo fio até a Portaria (verde ou vermelho) e daí às gavetas e à próxima tela. O terminal à direita conta o que aconteceu.

## 10c. A Máquina (backend visual)

Dentro de um projeto de código (o Babel OS), a atividade **Máquina** abre no meio o backend em peças com nome de gente: Gaveta, Campo, Fio, Chave, Empresa, Portaria, Porta, Robô, Depósito, Cofre, Tela, Cano. Três alturas de zoom (máquina inteira, domínio, peça). Enquanto o agente constrói no terminal à direita, as peças entram encaixando, na ordem, e a linha do tempo embaixo diz quem montou o quê. Clicar numa peça abre a ficha em português, com "onde fica guardado" e "Explicar com a Rita". Botões no topo: **Testar** (formulário por porta, "como quem", pedido animando pela máquina, linha entrando na gaveta, cadeado barrando a outra empresa), **O que muda** (diff em português) e **Publicar** (só quem pode, com confirmação escrita). Botão direito numa peça: "Pedir para o Davi". O desenho completo está em `docs/MAQUINA.md`.

## 11. Celular e iPad

**Celular** (navegador, Wi-Fi): abas Meu dia · Demandas · Chat · Arquivos · Mais. No Mais: Controle da TV, Salvar ideia falada, Conversa particular, Falar com. Sem terminal.

**iPad**: o quadro de borda infinita em tela cheia. Barra flutuante com caneta, marca-texto, borracha, post-it, texto, cores; pinça para zoom; dois dedos arrastam. Canto superior direito: "Projetar na TV" (vira "● na TV"). Canto inferior: "Salvar ideia falada" e o nome do quadro, com "Salvo" discreto: cada traço já está na pasta Quadros da pessoa e na árvore de todos. Nada mais.

**Mapa mental** (dentro da Estação, base M Master): abre como qualquer arquivo `.mapa`. Teclado primeiro (Tab, Enter, setas). Botão direito num galho: "Expandir com Rita", "Resumir", "Virar demanda", "Virar meta", "Ligar a arquivo", "Ligar a pessoa". Cada galho ligado a algo mostra o ícone ou a foto e o estado. "Apresentar na TV" percorre os galhos. Membros do projeto editam juntos com cursores coloridos.

## 12. Estados e detalhes que evitam frustração

- **Pessoa desligada**: pasta pontilhada na árvore com "desligado desde 17:40"; abrir arquivo dela mostra a ficha do acervo (texto extraído, se houver) com "o original está no computador da Carla".
- **Estação sozinha na rede**: barra de status "1/11 · procurando a equipe…"; tudo funciona com a cópia local do diário.
- **Conflito de edição** (dois salvando ao vivo): não existe; o dono aplica na ordem. "Conflito" na barra só aparece se a mesma pessoa editou em duas Estações.
- **Senha no terminal**: botão "pausar transmissão" ao lado do nome do agente; a parede mostra cinza por esse tempo.
- **Agente errou**: cada cartão de ação do agente tem "[desfazer]" por 5 minutos; depois, "Voltar como estava" no item.
- **Primeiro dia**: a Estação abre com o Meu dia, o README da equipe no meio e o agente padrão à direita com o cartão de boas-vindas.
- **Atalhos**: Ctrl+K paleta · Ctrl+B lateral · Ctrl+` agentes · Ctrl+Shift+I salvar ideia falada · Ctrl+Shift+T novo agente · Ctrl+Shift+E entrar no terminal de… · Esc sai de qualquer coisa.

## 13. O que o protótipo v3 mostra disso

O protótipo (`prototipo/`, publicado) simula: agentes com nome e foto no terminal, menção de pessoa com foto, entrar no terminal de outro com selo, a TV sem botão aberta em janela própria, a tela WhatsApp com o agente sugerindo resposta, a tela de Projetos com arquivos de vários membros, a Loja da equipe com Instalar, e "Salvar ideia falada" e "Começar a gravar" com transcrição simulada. O resto (voz entre Estações, editar ao vivo de verdade, palavra de ativação) está descrito aqui e fica para o sistema real.
