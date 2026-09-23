# Babel Coop · todas as funções, para teste de UX

> Gerado em 23/09/2026 a partir do código do protótipo (versão 18) e cruzado com `IDEIAS.md` (as seções entre colchetes são de lá).
> Para quem vai testar: abra https://claude.ai/artifact/KQZbUM13TjEt473zBQr1y4 (precisa de acesso ao link). É um protótipo no navegador: **tudo o que tem botão funciona**; o que é "simulado" está marcado, e é a parte que só existe no app instalado (terminal de verdade, rede, transcrição, WhatsApp real).
> Como testar: passe por cada linha, faça o que está em "como testar", confira "o que deve acontecer" e dê uma nota de UX de 0 a 10 por seção (clareza, quantidade de cliques, se a pessoa entende sem explicação, consistência visual, erros). No fim, uma nota geral e a lista do que mais atrapalha.

## Como se locomover no protótipo

- **Barra da esquerda (atividades), de cima para baixo:** Criar · Meu dia · Demandas · Chat · Reunião · Acervo · Inteligência da equipe · Terminais ao vivo · Tarefas com fluxo · Metas e campanhas · Equipe · Mapa da equipe · Projetos · WhatsApp · Loja da equipe · Oficina do app. Clicar troca a lateral; com o meio vazio, o meio só abre ao clicar num item da lateral.
- **"Ver como"** (canto superior direito): troca a pessoa logada (Theus é a gestão; os outros são membros). Use para testar o que cada papel vê.
- **"Tela da TV"** (canto superior direito): abre a TV numa janela própria. **F** na TV = tela cheia. A TV não tem botão nenhum: tudo é controlado da Estação.
- **Atalhos pelo link:** `…#tv` (TV), `…#ipad` (iPad), `…#cronometro` (só o cronômetro), `…#maquina`, `…#perfil`, `…#projeto`, `…#oficina`, `…#loja`, `…#whatsapp`, `…#projetos`, `…#terminais`.
- **Teclado:** Ctrl+K paleta de comandos · Ctrl+B lateral · Ctrl+` terminal · Ctrl+S salvar · Ctrl+Shift+W fechar todas as abas · Ctrl+Shift+E/I/T atividades · PageUp/PageDown rolam o que está projetado na TV · Esc fecha · setas na paleta.
- **Simulador:** a equipe de exemplo age sozinha (mensagens chegam, pessoas entram em terminais, WhatsApp recebe). É de propósito, para a tela parecer viva.

Legenda de estado: **faz** = funciona no protótipo · **simulado** = a tela funciona, mas o fundo é fingido (no app é real) · **só no app** = só no desenho.

---

## A. Estação: casca e navegação [IDEIAS 5, 5.10, 10]

| Função | Onde | Como testar | O que deve acontecer | Estado |
|---|---|---|---|---|
| Barra de atividades | esquerda | clicar em cada ícone | lateral troca; com meio vazio, meio não abre | faz |
| Lateral recolhe | Ctrl+B ou botão | apertar | lateral some/volta; borda arrasta a largura | faz |
| Terminal recolhe | Ctrl+` ou "mostrar terminal" na barra de baixo | apertar | painel da direita some/volta; borda arrasta | faz |
| Abas do meio | topo do meio | abrir vários itens, fechar no × | abas como VS Code; fechar todas (Ctrl+Shift+W ou ✕✕) deixa o meio vazio com marca-d'água; lateral continua | faz |
| Paleta de comandos | Ctrl+K | digitar "readme", "campanha", nome de pessoa | acha arquivos, comandos, acervo; Enter abre | faz |
| Barra de status | rodapé | observar | presença, caixa de entrada, cronômetro rodando, tarefas livres, reunião, gravação da sala, projeção na TV (com ▲▼ rolar e ✕), selos de controle de terminal, "Atualizar vN", TV conectada, terminal ao vivo, acervo, "Salvo na equipe" | faz |
| Trocar presença | botão de presença no rodapé | clicar, escolher | online/foco/ausente muda na Equipe e na TV | faz |
| Coluna de novidades | sino no topo | clicar | lista de eventos; contador zera | faz |
| Ver como | topo | trocar de pessoa | tudo muda para o ponto de vista dela; admin vê mais | faz |
| Tela da TV | botão no topo | clicar | abre janela `#tv` sem botões | faz |
| Celular | janela estreita (< 760 px) | redimensionar | abas embaixo: Meu dia, Demandas, Chat, Criar, Mais | faz |
| Identidade visual | tudo | observar | fundo `#060b16`, roxo → azul → ciano, fonte mono no terminal, logo "b" | faz |

## B. Criar (era "Explorar"): arquivos, telas, máquina, pesquisa [IDEIAS 5.5, 5.10, 5.11, 5.15, 5.18, 5.19]

| Função | Onde | Como testar | O que deve acontecer | Estado |
|---|---|---|---|---|
| Boas-vindas de Criar | meio, ao entrar em Criar sem aba | clicar em Criar | cartões Tela, Máquina, Pesquisa e "Ver um exemplo em 3D" | faz |
| Seletor de modo | topo da lateral | "Sozinho · minha pasta" ↔ um projeto | árvore muda: sozinho = minhas pastas + equipe; projeto = só as pastas do projeto, agrupadas por membro, a minha primeiro, "N pessoas com você agora", o que cada um está fazendo, quem vê meu arquivo | faz |
| Árvore de arquivos | lateral | abrir pastas, clicar em arquivos | ícone por tipo; foto de quem salvou por último; "recebido de X"; computador desligado = ficha pontilhada | faz |
| Filtrar arquivos | campo na lateral | digitar | árvore filtra | faz |
| Novo: Nota, Mapa, Quadro, Tela, Máquina, Pesquisa, arquivo, subir arquivo | botões na lateral | clicar em cada | cria na minha pasta (ou na do projeto) e abre; subir arquivo abre o seletor | faz |
| Arrastar arquivo para uma pessoa | árvore em modo projeto | arrastar um arquivo meu para o nome de um membro | copia para a pasta de projeto dele com selo "recebido de você"; ele é avisado | faz |
| Arquivo → Projetar / Levar para a reunião | menu do arquivo na árvore (▣ / ☰) | clicar | vai para a TV / mesa da reunião | faz |
| Abrir arquivo de outra pessoa | árvore | clicar num arquivo de outro | abre só leitura; "Sugerir mudança" vira demanda para o dono; gestão edita com aviso ao dono | faz |
| Editor: Markdown, código, CSV, PDF, imagem, vídeo, mapa, quadro | meio | abrir um de cada tipo | formatado/colorido/tabela/PDF com zoom/imagem/vídeo (vídeo grande: "pela rede") | faz (PDF pela lib) |
| Editar e salvar | botão Editar → Salvar (Ctrl+S) | mudar um README | salva; foto de quem salvou no cabeçalho e na árvore; versão anterior guardada | faz |
| Versões · Voltar como estava | botão Versões (n) | abrir, voltar | lista as anteriores; volta e guarda a desfeita | faz |
| Formatado / Texto (md) | alternador | clicar | md renderizado ↔ fonte | faz |
| HTML: Site \| Código \| 3D | alternador na aba de um `.html` | abrir `davi/Projetos/Clínicas/landing.html` | Site renderizado como no VS Code; Código com cores; 3D = a página como painel num ambiente 3D com os próximos itens ao lado (Enter no login: pulso verde/vermelho no fio; senha `babel`) | faz |
| Editar na tela (visual → código) | botão "✎ Editar na tela" na vista Site | clicar seleciona; arrastar e soltar move; duplo clique edita texto; Delete apaga; Texto/↑/↓/Duplicar/Apagar na barra | "Salvar (n)" grava; a vista Código mostra o HTML mudado; Descartar volta | faz (no app: mapeamento arquivo:linha) |
| Projetar na TV / Levar para a reunião / Pedir ajuda / Chamar para cá | barra do arquivo | clicar em cada | TV mostra o arquivo (rolar com PageUp/Down ou ▲▼); entra na mesa; demanda de ajuda para o Theus com o arquivo; convite para alguém ver comigo | faz |
| Mapa mental (MindForge) | abrir um `.mapa` ou "+ Mapa" | Tab filho, Enter irmão, duplo clique edita, arrastar move, roda dá zoom, ⌘ vista do mapa, buscar, tema, exportar, apresentar, minimapa, inspector de estilo (cor, forma, tamanho, negrito, nota), menu do botão direito | fundo na cor da Babel, resto igual ao MindForge; salva no arquivo; versiona; TV em modo apresentação | faz |
| Mapa pelo terminal | terminal | "cria um mapa sobre lançamento com galhos: preço, público, canais" · "adiciona Instagram e TikTok em canais" · "expande preço" · "renomeia público para público-alvo" · "apaga TikTok" | o mapa abre e muda na hora, com o galho novo selecionado | faz (simulado: no app o agente consulta o acervo) |
| Quadro (borda infinita) | abrir um `.quadro` ou "+ Quadro" | riscar, arrastar, zoom | salva sozinho; aparece na TV se projetado | faz |
| Máquina (backend visual) | cartão Máquina em Criar, ou `#maquina` | ver as peças (gavetas, campos, fios, chaves, empresa, portas, robôs, cofre); clicar numa peça abre a ficha "onde fica guardado"; Testar; "O que muda"; Publicar; "Ver o agente montando"; Pedir para alguém; ambiente (local/branch/produção); chave faltando no cofre | tudo em português simples; teste mostra a linha entrando na gaveta e o cadeado barrando a outra empresa | faz (simulado: no app lê o Supabase de verdade) |
| Máquina pelo terminal | terminal | "cria uma tabela de pacientes com nome e telefone" | a Máquina se monta com a peça nova tracejada | faz (simulado) |
| Presets (o que funcionou fica guardado) | Máquina → Testar → "✓ Funcionou · Salvar como preset"; lateral "Presets da equipe"; Criar → "Começar de um preset"; editor de `.html` → "★ Salvar como preset" | salvar um; "Usar em Clínicas"; "Começar desta tela"; terminal "usa o preset Login com empresa" / "salva como preset X" | preset com nome, quem fez, usos; peças encaixam na Máquina; tela copiada para a minha pasta | faz |

## C. Terminal e agentes [IDEIAS 5.7, 5.13, 8.3]

| Função | Onde | Como testar | O que deve acontecer | Estado |
|---|---|---|---|---|
| Painel do terminal à direita | direita | observar | visual Babel Terminal; nome@estacao · ~/BabelCoop · agente | faz |
| Abas de agentes com nome humano | topo do painel | "+", dar nome, o que faz | agente novo com foto de letra; renomear; apagar; "Neon" liga/desliga o neon | faz |
| Estado do agente | ponto ao lado do nome | pedir algo | pensando → parado | faz |
| Menção de pessoa | digitar o nome de alguém no pedido | "avisa a Carla…" | nome vira chip com a foto | faz |
| Pedidos em português (o agente mexe no app inteiro) | campo ❯ | "cria uma campanha de 50 clientes para a Carla até 30/09" · "manda um aviso para a TV: reunião às 16h" · "mostra o site babel-os.com na TV" · "projeta o README" · "cria uma demanda para o Davi…" · "cancela a campanha…" (pede confirmação s/N) · "entra no terminal da Carla" · "responde o WhatsApp" · "clona a landing de X" · "cria uma página sobre…" · "cria um mapa…" · "muda no app: …" · "cria uma tabela…" · "liga esta tela a…" (3D) | cada um faz de verdade no app e deixa um cartão com "desfazer" quando cabe; o que é criado aparece na TV | faz (resposta de texto simulada; ações reais) |
| Comandos `coop` | campo ❯ | `coop ajuda` · `coop status` · `coop buscar <termo>` · `coop ler <arquivo>` · `coop aprendi "…"` · `coop aprendizados` · `coop demandas` · `coop livres` · `coop pegar/comecar/pausar/retomar/pronta <id>` · `coop aviso "…"` · `coop mural` · `coop ideia "…"` · `coop momento` · `coop projetar <arquivo>` · `coop rolar` · `coop tv painel|reuniao|quadro|site <url>|visita` · `coop entrar <pessoa>` · `coop agentes` · `coop sonhar` · `coop abrir <arquivo>` | cada um responde e faz | faz |
| Comandos de shell | campo ❯ | `ls`, `cd`, `cat README.md`, `mkdir` | simulado sobre a pasta compartilhada | simulado (no app: shell real, node-pty) |
| Receitas | botões acima do campo | clicar em uma | preenche um pedido pronto (explicar arquivo, procurar no acervo, criar página, resumir reunião, erro, WhatsApp, navegar, clonar) | faz |
| Terminal ao vivo (transmissão) | rodapé "● terminal ao vivo" | clicar | pausa/retoma a transmissão do meu terminal para a equipe | faz |
| Terminais ao vivo (parede) | atividade Terminais | abrir | um cartão por agente de cada pessoa, ao vivo; "Entrar" (gestão e membros do projeto direto; os outros "Pedir"); Chamar; Falar; "Assumir" e digitar no terminal do outro; "Sair" | dono vê selo "X está no seu terminal" no rodapé com Encerrar; pedido chega com Aceitar / Agora não | faz (simulado: no app as teclas vão pela rede) |
| Navegador do agente | terminal: "entra em clinicavida.com.br e preenche o cadastro" / "clona a landing…" | observar a aba "Navegador · agente" | o agente navega, clica e preenche à vista; "Assumir"/"Devolver"; Raio-X (HTML, CSS, Copy, Rede, Console, Selecionar elemento); Clonar página; Clonar copy; Print | faz (simulado: no app é o webContents do Electron, sem Playwright) |
| Navegador da pessoa | aba Navegador → endereço → Abrir; ou "Assumir" numa sessão do agente | digitar um site e Ir | a pessoa navega como num navegador normal; o agente vê a mesma página e age por pedido | faz (páginas de exemplo; no app é o webview real) |
| Marca da pessoa nas peças | Máquina (toda peça) · edição na tela (bloco mexido) · árvore e cabeçalho do arquivo (quem salvou) | olhar as peças; mexer num bloco na edição na tela | cor e foto de quem criou em cada peça; borda com a cor e o nome de quem mexeu no bloco | faz |
| Terminal real | só no app (Ctrl+J) | — | xterm.js + node-pty, parede dos terminais reais | só no app |

## D. Meu dia, demandas, tarefas, metas [IDEIAS 5.1, 5.3, 5.4, 5.4.1, 9]

| Função | Onde | Como testar | O que deve acontecer | Estado |
|---|---|---|---|---|
| Meu dia | atividade | abrir | caixa de entrada, o que estou fazendo, tarefas livres, check-in do dia (o que vou fazer / bloqueio), "Estou bem", pedir uma mão, apoiar alguém, ideia falada | faz |
| Nova demanda | Demandas → "+ Nova" ou terminal | preencher título, para quem (ou livre), prazo, estimativa, prioridade, projeto | quem recebe vê na caixa; a TV mostra | faz |
| Cronômetro da demanda | ao começar uma demanda | Começar · Pausar (com motivo) · Retomar · Pronta (escreve o aprendizado) · quem pediu dá OK | só quem pediu encerra; aprendizado obrigatório; repetido soma +1 | faz |
| Cronômetro móvel | caixa flutuante | arrastar pela pega ⋮⋮; duplo clique volta ao canto; ▾ minimiza | posição lembrada; nunca fecha | faz |
| Cronômetro destacado | "⧉ destacar" | clicar | janelinha só com o cronômetro, por cima de tudo (PiP no Chrome; janela sempre-no-topo no app); Pausar/Continuar nela | faz |
| Cronômetro volta sozinho | pausar, depois mexer numa peça do trabalho (arquivo citado na demanda, arquivo/terminal usado enquanto rodava, a própria demanda) | fazer isso depois de 45 s | volta a contar, avisa, registra no histórico | faz |
| Tarefas livres | Demandas → "livre" | criar sem destinatário; outra pessoa "pega" | quem pega vira responsável e o cronômetro começa | faz |
| Pedir ajuda / Estou travado / Levar para a reunião | dentro da demanda | clicar | demanda para quem sabe; sinal de cuidado; vai para a mesa | faz |
| Tarefas com fluxo | atividade Tarefas | criar (fluxo: proposta, peça, chamado, funcionalidade, contratação); concluir etapa | passa para a próxima pessoa; visões lista/quadro/por pessoa/trilha; OK de quem passou | faz |
| Metas e campanhas | atividade Metas | "+1 cliente"; nova campanha pelo terminal | placar na TV; campanha = meta com prazo e dono; comemoração em 100 % | faz |
| Pausa automática fora do expediente | Equipe → Regras | ligar | demandas pausam sozinhas no fim do dia | faz |

## E. Chat, reunião, sala com memória [IDEIAS 5.2, 6.1, 8.7]

| Função | Onde | Como testar | O que deve acontecer | Estado |
|---|---|---|---|---|
| Chat estilo WhatsApp | atividade Chat | #geral, canais, conversas diretas (+ nova direta), mensagens, ✓✓, responder, reagir, emoji, anexar arquivo, "digitando…" | cara de WhatsApp com a identidade da Babel | faz |
| Mensagem vira demanda / vai para a TV | menu da mensagem | clicar | demanda criada com o texto; aviso na TV | faz |
| Reunião | atividade Reunião | iniciar; "Levar para a reunião" de arquivos, demandas, quadro; destacar; marcar decisão / próximo passo; encerrar | ata gerada ao encerrar; TV no modo reunião; quadro ao vivo | faz |
| Memória da sala (5 min) | bloco "Sala" em Reunião e Meu dia | ver a luz "◌ memória da sala" | rodapé e TV mostram o selo | faz (transcrição simulada) |
| Salvar ideia falada | botão | clicar | cartão de confirmação com o texto dos últimos 5 min; guarda em Ideias e no acervo com hora e quem apertou | faz (falas simuladas) |
| Começar a gravar / Parar | botão (segurar 600 ms = junta 10 min) | clicar | selo vermelho batendo na TV e no rodapé; transcreve até Parar | faz (simulado) |
| Conversa particular | botão | clicar | pausa a escuta | faz |
| A sala sugere | TV | esperar uma fala com cara de ideia | faixa "Parece que saiu uma ideia…" por 30 s | faz (simulado) |
| Ideia falada individual | Meu dia → "Falar ideia" | gravar | até 1 min, vira texto | faz (simulado) |

## F. Acervo, inteligência, aprendizados, sonho [IDEIAS 8.1, 8.2, 8.4, 8.5, 8.6]

| Função | Onde | Como testar | O que deve acontecer | Estado |
|---|---|---|---|---|
| Busca no acervo | atividade Acervo | "reembolso", "clínicas"; modo palavras / semelhança; filtro por tipo; sugestões | resultados com trecho e "abrir"; sem LLM | faz |
| Aprendizados | Inteligência → seção | ler; criar pelo terminal `coop aprendi` | `APRENDIZADOS.md` da equipe; repetido soma +1 | faz |
| Melhores prompts | Inteligência | estrela, usar | top 3 da semana; "usar" manda para o terminal | faz |
| Sonho noturno | Inteligência → "Sonhar" | clicar | resumo do dia: o que se repetiu, surpresas, top 3 prompts, aprendizados novos | faz (simulado) |
| Cuidando da gente | Equipe | observar | sinais: tempo acima da estimativa, "travado", muitas trocas, dias sem abrir, bloqueio; "Estou bem"; avisa a pessoa antes da TV | faz |

## G. Equipe, perfil, mapa, projetos, ajuda [IDEIAS 5.8, 5.9, 5.12, 5.15, 5.16]

| Função | Onde | Como testar | O que deve acontecer | Estado |
|---|---|---|---|---|
| Equipe | atividade | abrir como Theus | cartões por pessoa com carga, check-in, horas (só gestão); controle da TV (modo, tema, quadro, visita, cronômetro na TV); regras; foto (pôr/trocar/tirar) | faz |
| Convidar pessoa (token) | Equipe → lateral (só gestão) | nome → Gerar token → Copiar | token `babel-…` com explicação dos 3 passos | faz (no app: token de verdade) |
| Perfil como aba inteira | clicar na minha foto ou no nome de alguém | abrir | trabalhos feitos, tempo, dados e materiais, fatia do Babel Coop (%), gamificação pessoal (nível, selos, sequência), linha do tempo, agentes; sem ranking; filtro por período | faz |
| Mapa da equipe | atividade Mapa | abrir | grafo das pessoas e do que passa de mão em mão; pulso quando uma tarefa passa | faz |
| Projetos | atividade Projetos | criar (nome, membros); abrir um projeto | árvore com pastas de todos os membros, conversa com chips "com todos"/"com <pessoa>", demandas, próximos passos, quadro, mapa, Máquina, agentes no projeto; "Entrar" no projeto; "Falar"; projetar evolução na TV | faz |
| Ajuda par a par | Equipe / Terminais / arquivo | "Chamar para a minha tela"; "Falar com"; "Pedir ajuda a quem sabe"; "O que cada um está fazendo" | convite; voz (simulada); demanda com o arquivo; texto ao lado de cada pessoa | faz (voz só no app) |

## H. WhatsApp e Loja da equipe [IDEIAS 8.8, decisões 23/09]

| Função | Onde | Como testar | O que deve acontecer | Estado |
|---|---|---|---|---|
| WhatsApp na Estação | atividade WhatsApp | parear (QR), abrir conversa | só a própria pessoa vê; não vai para o acervo nem para a TV | faz (simulado: no app é o WhatsApp Web em webview) |
| Agente sugere resposta | conversa | esperar mensagem / "Sugerir" | sugestão no campo; Enter manda ou corrige; "automático" por contato com aviso de bloqueio | faz (simulado) |
| Loja da equipe | atividade Loja | Instalar uma skill/MCP/plugin/agente; "Versão nova" → Atualizar; publicar a minha | instala sem terminal; chave de API pede o cofre ("precisa da chave X"), nunca na pasta compartilhada | faz (simulado: no app escreve na config do Claude Code) |

## I. TV [IDEIAS 6, 6.1, 6.2]

| Função | Onde | Como testar | O que deve acontecer | Estado |
|---|---|---|---|---|
| Sem botão | janela `#tv` | procurar qualquer botão | nenhum; só F para tela cheia | faz |
| Modos | Equipe → Controle da TV, ou `coop tv …` | painel · reunião · quadro ao vivo · projeção · site · visita | a TV troca na hora; tema roxo/azul/claro | faz |
| Painel | modo painel | observar | zona que gira: avisos e mural, evolução da semana, pergunta da semana, sonho, tarefas livres, ideias, evolução dos projetos; placar de metas; cronômetros; relógio | faz |
| Projeção | "Projetar na TV" em qualquer arquivo | projetar um PDF/imagem/md/html/mapa/quadro | conteúdo real; quem projetou rola (PageUp/Down, ▲▼, `coop rolar`); luz de borda roxa; ✕ encerra | faz |
| Site na TV | `coop tv site babel-os.com` | comando | site em tela cheia | faz |
| Selos da sala | canto | gravar / memória | pílulas discretas: ponto vermelho batendo quando grava; "◌ memória da sala"; "áudio apagado" | faz |
| Sugestão de ideia | faixa fina | esperar | "Parece que saiu uma ideia: … salvar na Estação ou no celular · ou diga 'Babel, guarda isso'" | faz |
| Cuidando da gente na TV | painel | esperar 10 min sem resposta da pessoa | convite discreto, nunca ranking | faz |
| Comemoração | meta em 100 % | completar | animação | faz |

## J. iPad [IDEIAS 7.1]

| Função | Onde | Como testar | O que deve acontecer | Estado |
|---|---|---|---|---|
| App à parte | `#ipad` | abrir | só o quadro; não há botão de iPad na Estação | faz |
| Quadro de borda infinita | quadro | arrastar, zoom, caneta, marca-texto, borracha, post-it, texto | sem fim | faz |
| Risca no iPad, risca na TV | TV em modo quadro | riscar | traço aparece na TV | faz |
| Salvar = salvar no Babel Coop | "Salvar" / automático | riscar | `.quadro` na pasta Quadros da pessoa; abre na Estação; entra no acervo | faz |
| Projetar na TV | botão do iPad | clicar | TV vai para o quadro | faz |
| Estação ↔ iPad | botão | clicar | volta para a Estação | faz |

## K. Oficina do app [decisão 23/09 à tarde]

| Função | Onde | Como testar | O que deve acontecer | Estado |
|---|---|---|---|---|
| Quem pode mudar o app | Oficina (gestão) | Liberar / Tirar por pessoa | chip "pode mudar"/"só usa" | faz |
| Mudar o app pelo terminal | terminal, como alguém liberado | "muda no app: coloca o relógio maior na TV" | mudança entra em "Aguardando publicação" com quem, agente e arquivos; quem não está liberado é barrado | faz (simulado: no app o agente edita o código) |
| Publicar atualização | Oficina (gestão) | notas → "Publicar atualização vN" | versão sobe; histórico | faz |
| Atualizar | rodapé de todo mundo | "⬆ Atualizar para vN" | 1,5 s "atualizando…" e some; Oficina mostra quem ainda está na versão antiga | faz (no app: baixa da Estação de quem publicou e recarrega) |

## L. O que é só do app instalado (não testar no protótipo) [IDEIAS 11, 15]

Terminal real (node-pty) e teclas pela rede · cada computador servindo a própria pasta e o diário replicado · token de verdade e descoberta na rede · transcrição (ditado do Mac ou whisper.cpp) · WhatsApp Web em webview · navegador do agente sobre o Electron · Máquina lendo o Supabase · editar no visual com mapeamento arquivo:linha · voz WebRTC · atualização baixada da Estação de quem publicou · janela sempre-no-topo do cronômetro · acesso de fora do escritório.

---

## Como devolver a nota

1. Uma nota de 0 a 10 por seção (A–K) com uma frase do porquê.
2. Nota geral de UX.
3. As 10 coisas que mais atrapalham, em ordem, cada uma com: onde está, o que aconteceu, o que era esperado, sugestão.
4. O que quebrou (erro, botão morto, tela em branco), com o caminho exato para reproduzir e a pessoa em "Ver como".
5. O que está bom e não deve mudar.

Critérios: a pessoa entende sem explicação? quantos cliques até o que ela quer? o vocabulário é o da equipe (português simples, sem jargão)? a resposta do sistema aparece na hora e no lugar certo (aviso, TV, rodapé)? o visual é consistente (mesmas cores, mesmos botões)? erros e vazios são explicados?
