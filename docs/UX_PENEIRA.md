# Peneira de UX do Babel Coop · análise, sem executar

> 23/09/2026 · protótipo v22 · base: `docs/FUNCOES.md`, inventário automático de todas as telas (títulos, botões, notas, logos), capturas, e as referências de 2026–2030 abaixo.
> Regra do Theus: **é proibido remover o que foi pedido.** Cada linha diz de onde veio: **[Theus]** pedido dele · **[definido]** inferido por mim na fase de projeto · **[LLM]** entrou sem pedido, por inércia de geração.

## 1. Régua usada (o que 2026–2030 cobra de um sistema como este)

Do que li, o que vale para o Babel Coop:

1. **Interface calma.** Menos coisas soltando a atenção; sem "teatro visual"; texto explicativo some quando a pessoa já entendeu. A tela mostra o que muda, não o que é fixo. (envato, cwstechnology)
2. **Agente presente, opcional, interrompível e rotulado.** O agente age, mas a pessoa vê o que ele está fazendo, pode parar, assumir e desfazer em qualquer passo. (Salesforce, Tippins, mindinventory)
3. **Transparência do agente.** O que ele considerou, o que fez, o que vai fazer. Cartão com "desfazer" é o padrão certo. (Tippins, ADEPTS)
4. **Um lugar por coisa.** A mesma informação em três telas é custo de atenção e de manutenção. Cada dado tem uma casa; os outros lugares apontam para ela.
5. **Menos cliques até o que a pessoa quer**; abandono vem de "muito clique, muito pensar". (riseuplabs)
6. **Avaliação pelo caminho da falha**, não só do sucesso: o que acontece quando o agente erra? (arxiv 2605.05600)
7. **As heurísticas clássicas continuam** (visibilidade do estado, consistência, controle, prevenção de erro, reconhecer em vez de lembrar, minimalismo). Nielsen ainda vale; o agentic soma, não substitui.

## 2. O diagnóstico em uma frase

O protótipo tem todas as telas pedidas e funciona, mas **fala demais e repete**: a mesma coisa aparece em 2 a 4 lugares, cada tela explica a si mesma como se fosse a primeira vez, e há marcas, botões de demonstração e rótulos de protótipo que não existem no app de verdade.

Contagem do inventário: 16 atividades, 3 logos grandes (topo, marca d'água do meio vazio, fundo do terminal), 10 itens na barra de status, 8 receitas fixas no terminal, 46 textos de ajuda/nota nas telas (20 só na Equipe), 18 filtros na lateral do Acervo.

## 3. Redundâncias e duplicações (o que aparece em mais de um lugar)

| O que | Onde aparece | Proposta | Origem |
|---|---|---|---|
| Caixa de entrada, "esperando meu OK", tarefas livres | Meu dia (lateral + meio) **e** Demandas (lateral + meio) **e** barra de status | Meu dia mostra só o resumo (3 números) e aponta; a lista completa vive em Demandas | [definido] |
| Ideias | Meu dia, Inteligência da equipe, Reunião ("momentos falados"), TV | Uma casa: Acervo → Ideias. Meu dia e Reunião só apontam | [definido] |
| Pergunta da semana | Meu dia **e** Inteligência | Uma casa: Meu dia (é onde a pessoa responde). Inteligência mostra o resultado | [definido] |
| Bloco "Sala" (Salvar ideia falada · Começar a gravar · Conversa particular) | Meu dia **e** Reunião **e** barra de status (memória) | Uma casa: barra de status (sempre à vista) com os dois botões; Reunião mantém porque é o lugar de gravar | [Theus] os botões; a duplicação é [LLM] |
| Cronômetro | Caixa flutuante **e** barra de status **e** cartão em Meu dia **e** TV | Padrão: pílula na barra de status; a caixa flutuante só quando a pessoa "destaca". Meu dia não repete | [Theus] cronômetro; a caixa sempre aberta é [definido] |
| "＋ Nota · ＋ Mapa · ＋ Quadro · ↥ subir" | Lateral de Criar (linha de ícones) **e** meio de Criar (botões) **e** cartões Tela/Máquina/Pesquisa na lateral **e** no meio | Uma vez: só na lateral (é a árvore). O meio vazio de Criar vira só "Começar de um preset" + "Mudaram por último" | [Theus] Criar com Tela/Máquina/Pesquisa; a repetição é [LLM] |
| Presets | Criar (meio) **e** Máquina (lateral) | Manter os dois: são contextos diferentes (começar vs. encaixar). Só a lista curta na Máquina | [Theus] |
| Controle da TV | Equipe (seção inteira com modos e temas) **e** terminal `coop tv` **e** botões "Projetar" espalhados | Tirar a seção da Equipe. A TV se controla de onde a coisa está (projetar no arquivo, reunião na Reunião, quadro no iPad) e por `coop tv`. Modo visita, tema e controle da TV ficam na Estação (ao lado de Tela da TV e no Ctrl K), no celular e no terminal; nada dentro da janela da TV (revisto em 25/09/2026: saiu a engrenagem na janela "Tela da TV" — CHECK_DO_THEUS.md:46, "A TV é um espelho… não tem botão") | [Theus] TV controlada pela Estação; a seção dentro de Equipe é [definido] |
| Projetos (atividade) **e** Criar em modo projeto | A árvore por membro e a conversa existem nos dois | Manter os dois papéis, mas a atividade Projetos vira a lista + criar; abrir um projeto leva para Criar no modo daquele projeto (mesma tela, sem duplicar árvore) | [Theus] |
| Acervo **e** Inteligência da equipe | Duas atividades sobre "o que a equipe sabe" | Fundir em **Acervo**, com abas: Buscar · Aprendizados · Ideias · Sonho · Prompts. Um ícone a menos | [Theus] acervo e aprendizados; duas atividades separadas é [definido] |
| Demandas **e** Tarefas com fluxo | Duas atividades de "trabalho a fazer" | Manter as duas (foram pedidas com lógicas diferentes), mas juntar num ícone **Trabalho** com duas abas | [Theus] |
| Receitas do terminal ("Resumir a reunião", "Responder o WhatsApp"…) | Terminal, fixas em toda aba | Receitas só quando fazem sentido: aparecem conforme a tela aberta (arquivo aberto → "Explicar este arquivo"; WhatsApp aberto → "Responder"). Sem tela, 3 no máximo | [Theus] receitas para quem começa; 8 fixas é [LLM] |
| Texto de apresentação do agente ("Este é o seu agente… No app de verdade…") | Toda aba de terminal, toda vez | Só na primeira abertura, uma vez. Depois, só o prompt | [LLM] |

## 4. O que entrou sem pedido (candidatos a remover)

| Item | Onde | Por que sai | Origem |
|---|---|---|---|
| Marca d'água grande do "b" no meio vazio | Meio, quando não há aba | Você pediu: só a logo pequena em cima. O vazio fica limpo com "Nada aberto · Ctrl K" | [LLM] |
| "b" gigante no fundo do terminal | Painel da direita | Mesma regra. O terminal fica só com o degradê da identidade | [LLM] (o degradê e o neon são [Theus]) |
| Botão "Neon" liga/desliga | Cabeçalho do terminal | Decoração com botão. O neon é identidade fixa, não opção | [LLM] |
| "ESTAÇÃO · PROTÓTIPO" | Topo | Rótulo de protótipo | [LLM] |
| Seletor "Ver como" | Topo | Ferramenta de demonstração. No app cada um é quem é | [LLM] (útil só no protótipo) |
| "+1 cliente (demonstração)" | Metas | Botão de demo | [LLM] |
| "Já escaneei (simulado)" | WhatsApp | Botão de demo; no app é o QR de verdade | [LLM] |
| "Ver um exemplo em 3D" | Criar, meio | Atalho de demonstração | [LLM] |
| "Tema roxo (grafo v5)" / "Tema azul (Babel Terminal)" | Estação (ao lado de Tela da TV e no Ctrl K), celular e terminal | Nomes internos de versão de design; o tema da TV se escolhe fora da janela da TV, com nomes humanos: Noite, Ametista, Visita (revisto em 25/09/2026: era a engrenagem da TV; nada dentro da janela da TV) | [LLM] nos nomes |
| Mapa da equipe (grafo de quem passa o quê) | Atividade própria | Nunca foi pedido; entrou como [proposta] na seção 5.9. Bonito, mas ninguém precisa dele todo dia. Vira uma aba dentro de Equipe ou sai | [definido] |
| "Primeiros passos com IA" como cartão fixo em Meu dia | Meu dia | O objetivo (5.13) é real; a forma, um checklist permanente, cansa. Vira um aviso único que some ao completar | [Theus] objetivo · [LLM] forma |
| "Minha contribuição" em Meu dia | Meu dia | Já é o Perfil inteiro. Meu dia só aponta | [LLM] duplicação |
| Cronômetros prontos "Reunião geral 15 min · Foco 25 · Stand-up 10" em Metas | Metas | Cronômetro de reunião pertence à Reunião; "foco" pertence ao cronômetro da pessoa. Em Metas não faz sentido | [definido] lugar errado |
| 18 filtros por tipo na lateral do Acervo (vídeo 1, arquivo 1, fala guardada 1…) | Acervo | 6 principais + "mais" | [LLM] |
| 46 textos de ajuda que explicam o protótipo ("(simulado)", "No app de verdade…", "Contas simples, sem IA…") | Toda parte | Somem no app. Ajuda vira um "?" discreto por seção, ou a primeira vez só | [LLM] |
| Barra de status com 10 itens | Rodapé | Fica com o que muda: presença · caixa · cronômetro · gravação/memória da sala · projeção · controle de terminal · "Atualizar" quando houver. Somem: "acervo: 76", "terminal ao vivo" (vai para o cabeçalho do terminal), "TV não aberta" (vai para o botão Tela da TV), "Salvo na equipe" (aparece só ao salvar) | [Theus] barra de status; os 10 itens fixos são [LLM] |

## 5. Sequência das telas (faz sentido?)

- **Ordem da barra hoje:** Criar (com a árvore de arquivos dentro) · Meu dia · Demandas · Chat · Reunião · Acervo · Inteligência · Terminais · Tarefas · Metas · Equipe · Mapa · Projetos · WhatsApp · Loja · Oficina. É a ordem em que foram criadas, não a ordem de uso.
- **Proposta, por frequência e por papel:** Meu dia · Criar · Trabalho (Demandas + Tarefas) · Chat · WhatsApp · Reunião · Terminais · Projetos · Acervo · Equipe (com Metas dentro) · Loja · Oficina. De 16 para 12 ícones, sem tirar nenhuma função pedida.
- **Criar como primeira** foi pedido [Theus]. Mantenho Criar no topo do grupo de "fazer"; Meu dia fica em cima porque é onde a pessoa começa o dia. Se você preferir Criar em primeiro absoluto, é uma troca de posição.
- **Primeira abertura:** hoje cai em Criar (a atividade que era o Explorador) com uma tela de boas-vindas e três cartões. Com o token, a primeira tela deveria ser Meu dia com uma linha: "Você entrou. A equipe te vê. Comece por…". Um passo, não uma página.
- **Perfil** abre pela foto no topo: certo. **TV** abre por botão: certo. **iPad** não tem botão: certo.

## 6. Onde o agente está bem e onde falta transparência (régua agentic)

- **Bem:** cartão com "desfazer" em cada ação do terminal; cursor visível no navegador; "Assumir/Devolver"; "Confirma? [s/N]" nas ações que apagam; peças tracejadas enquanto o agente constrói; marca da pessoa nas peças.
- **Falta:** (a) quando o agente falha ou não entende, a resposta é uma "dica" no terminal, sem próximo passo; (b) o agente não diz o que consultou antes de agir, exceto no acervo; (c) o estado do agente ("pensando") é um ponto colorido pequeno demais para ser visto; (d) não há "parar" no meio de uma ação de vários passos (montar Máquina, navegar).

## 7. O que NÃO sai (pedido do Theus, fica onde está)

Estação estilo VS Code · terminal à direita com vários agentes com nome e foto · terminal ao vivo com Entrar e controle · navegador do agente e da pessoa com Raio-X · Criar com Tela, Máquina, Pesquisa · Site | Código | 3D · editar na tela · mapa mental MindForge · presets · projetos com arrastar arquivo e pessoas juntas · WhatsApp com agente · Loja · demandas com cronômetro (pausa/OK, arrastável, destacado, volta sozinho) · tarefas com fluxo · metas e campanhas · chat WhatsApp · reunião com sala e ata · memória da sala e ideias faladas · acervo e aprendizados · sonho · perfil com gamificação · equipe com cuidado · token · Oficina · TV sem botão · iPad à parte · cores por pessoa · foto de quem salvou.

## 8. Ordem sugerida de execução (quando você der o OK)

1. **Marcas e rótulos de protótipo:** tirar o "b" do meio e do terminal, "ESTAÇÃO · PROTÓTIPO", "Ver como", botões de demonstração, botão Neon. Meio dia de trabalho, zero risco.
2. **Uma casa por coisa:** cronômetro na barra por padrão; Sala na barra; Meu dia vira resumo; Ideias e pergunta com uma casa; Criar sem repetição.
3. **Fundir e reordenar a barra:** Acervo + Inteligência; Demandas + Tarefas em Trabalho; Metas dentro de Equipe; Mapa da equipe para dentro de Equipe; nova ordem.
4. **Texto:** tirar as 46 explicações; ajuda por "?"; apresentação do agente uma vez só; receitas por contexto.
5. **Barra de status enxuta.**
6. **Transparência do agente:** "parar", "o que consultei", estado visível, próximo passo quando falha.

Depois de cada passo, o roteiro de testes roda (`docs/testes/roteiro.js`) e o `FUNCOES.md` é ajustado.

## Fontes

- [The New Rules of UX (for AI Agents)](https://atippins.substack.com/p/the-new-rules-of-ux-for-ai-agents)
- [ADEPTS: a capability framework for human-centered agent design](https://arxiv.org/pdf/2507.15885)
- [UX in the Age of AI: rethinking evaluation metrics](https://arxiv.org/pdf/2605.05600)
- [Salesforce · shift to agentic experience design](https://www.salesforce.com/blog/ux-shift-to-agentic-experience-design/)
- [Agentic UX & design patterns](https://manialabs.substack.com/p/agentic-ux-and-design-patterns)
- [Agent UX: UI design for AI agents in 2026](https://fuselabcreative.com/ui-design-for-ai-agents/)
- [UX/UI trends 2026: calm interfaces, transparent AI](https://elements.envato.com/learn/ux-ui-design-trends)
- [UX trends 2026: invisible user experience](https://www.cwstechnology.com/ux-trends-2026-invisible-user-experience/)
- [Top UX design trends 2026](https://riseuplabs.com/top-ux-design-trends/)
- [Mobile app UI/UX trends 2026 (agentic UX)](https://www.mindinventory.com/blog/mobile-app-ui-ux-design-trends/)
