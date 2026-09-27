# Auditoria de UX · estado encontrado

Data: 25/09/2026. Executor: [[Dominic]]. Pasta: `sistemas/babel-coop`.

## 1. O que foi efetivamente examinado

| Evidência | Cobertura | Limite |
|---|---|---|
| Captura enviada por Theus | Meu dia, navegação, Presença, textos e proporções | Uma imagem não demonstra os fluxos |
| App nativo aberto no Mac | Meu dia; Criar em Tech/Vibe; Demandas em Trabalho; árvore de acessibilidade e capturas | Não houve uma passagem visual completa por todas as telas |
| Processo do app | Cópia executada em `app/dist/mac-arm64/babel-coop.app` | Não foi comparado todo o pacote instalado com a árvore de trabalho nesta missão |
| Leitura estática automática | 50 arquivos `.js`/`.html` em `prototipo/` e `app/interface/`; 726 declarações de controles localizadas | Inclui protótipo, demos, variantes, controles invisíveis e repetições; não são 726 botões visíveis ou testados |
| Revisão dirigida de código | Casca, explorador, editores, demandas, tarefas, projetos, chat, reuniões, mapa, Máquina/3D, iPad, navegador, agentes, MCP e composição do servidor | Análise de código indica contratos e lacunas; não prova funcionamento em três computadores |
| Documentação | AGENTS local/pai, contrato aplicável, memória, A-FAZER, UX, FUNCOES, peneira e conceito | Declarações antigas de “faz” não foram aceitas como prova de recurso atual |
| Pesquisa externa | Fontes primárias de UX e dos produtos de referência | Interpretações para Babel estão identificadas em REFERENCIAS.md |

O controle nativo teve respostas lentas/inconsistentes. O navegador interno de inspeção estava indisponível. A tentativa de abrir `http://localhost:4711/` no Chrome foi rejeitada pela revisão automática porque a permissão foi negada. Não se tentou contornar por CDP, Playwright, outro navegador ou acesso indireto. O restante do levantamento foi feito no código; a conferência visual completa permanece como UX-076.

Não foram executados testes funcionais, alterações no app, empacotamento, atualização do app aberto, commit, push ou envio de mensagens. O inventário executa apenas leitura de fonte e grava os documentos desta análise. As numerosas modificações preexistentes no Git foram preservadas.

## 2. Achados prioritários

| # | Achado e consequência | Evidência concreta | Direção proposta |
|---|---|---|---|
| A01 | O mesmo trabalho fica espalhado entre Criar, Projetos, Trabalho e Terminais | `prototipo/estacao.js:65` organiza 12 atividades; `vistas-d.js:68` abre resumo separado de projeto | Contexto único de projeto com Construir, Tarefas, Conversa e Visão geral |
| A02 | O espaço útil fica menor que os painéis que o cercam | Captura nativa de 1223 px: área central aproximadamente 578 px; laterais abertas | Recolhimento por espaço disponível; foco integral para mapa/Máquina |
| A03 | A entrada da Presença é inadequada para pedidos longos | `app/interface/terminal-real.css:223`: `input` de 34 px; chip de contexto disputa a mesma linha | Campo multilinha, contexto acima, anexos e expansão |
| A04 | Criar repete opções em posições distantes | Tela nativa: botões pequenos no explorador, cartões Tela/Máquina/Pesquisa, ações e modelos repetidos no meio | Uma entrada Criar; resultado e destino claros |
| A05 | A árvore pede que se pense primeiro em quem guardou, não no projeto | `prototipo/explorador.js:83` e `vistas-d.js:49`; grupos por pessoa; `.claude` na árvore observada | Árvore por projeto/artefato; autoria como metadado; técnicos recolhidos |
| A06 | “Projeto ativo” não organiza todos os módulos | `explorador.js:32,198`; `vistas-d.js:114` altera contexto do explorador | Identidade de projeto em artefato, tarefa, conversa, terminal e agente |
| A07 | Demandas e tarefas de fluxo são conceitos separados na interface e nos dados | `vistas-b.js:40` e criação `nova-tarefa`; `demandas.js`; tarefa de fluxo não recebe projeto explicitamente no formulário lido | Uma experiência Tarefas, com tarefa simples ou com etapas; migração dos históricos |
| A08 | Retomar ainda não significa recuperar o posto de trabalho inteiro | `estacao.js:79,172,831`: grava dimensões/painéis; reinicia abas em Meu dia | Snapshot por pessoa/projeto: abas, câmera, seleção, rascunhos, tarefa e contexto de agente |
| A09 | O mapa já existe; está encaixado na casca estreita | `mapamental.js:95`: iframe MindForge; `pecas.css:313` e `314` | Abrir em modo de construção integral, mantendo ferramentas e atalho de retorno |
| A10 | Existe 3D, mas o corpo atual não é um editor espacial livre | `visual3d.js:537–642`: câmera ortográfica, posições em grade calculadas por índice, reenquadramento ao alterar peças | Coordenadas persistidas, navegação livre, seleção e montagem espacial real |
| A11 | A Máquina ainda divide a própria área já estreita | `maquina-2030.css:36`: coluna adicional de 304 px | Mundo ocupa a janela; biblioteca de peças e inspector contextuais |
| A12 | O navegador existe, mas é pouco encontrável | `app/interface/navegador-real.js:1730`; entrada por ações/receitas/Terminais; controles reais em `:565` | Botão Navegador visível e aba normal, utilizável sem iniciar agente |
| A13 | O WhatsApp real está ausente | `prototipo/vistas-d.js:165` informa que o pareamento real ainda virá; QR fictício pertence ao protótipo | Spike de compatibilidade + sessão real do WhatsApp Web; nunca apresentar QR desenhado como pareamento |
| A14 | O quadro do iPad tem rota, mas falta a jornada de instalação e conexão | `prototipo/ipad.js` usa `#ipad`; `docs/FUNCOES.md:159` registra ausência de entrada na Estação | Quadro → Conectar iPad → instalar → parear → desenhar |
| A15 | A identidade do iPad remoto exige contrato antes da instalação utilizável | `app/servidor/servidor.js`, bloco de autorização das rotas remotas de quadro/TV | Dispositivo pareado a uma pessoa, escopo de projeto/quadro e revogação |
| A16 | Reunião ainda se apresenta como formulário/listas | `vistas-a.js:179`; abrir reunião altera o modo TV no fluxo atual | Sala com palco, fila de cenas, direção pelo terminal, prévia e transmissão explícita |
| A17 | Modelo/esforço não têm controles adequados para o usuário | `terminal-real.js:426`: provedor/nome/papel; `agentes.js:375`: modelo por ambiente; `codex.js:88`: thread efêmera | Configuração por agente, capacidades reais, continuidade e cooperação com responsabilidades |
| A18 | A promessa de comando universal precisa de cobertura verificável | `app/servidor/coop-mcp.js` tem muitas ferramentas, mas isso não prova paridade com todas as ações | Registro tipado único de ações, matriz UI/agente e resultado observável |
| A19 | Textos descritivos e estados vazios disputam o espaço do trabalho | Meu dia e Demandas nativos; parágrafo da captura sobre caixa/TV/horas; onboarding 0/6 | Ajuda contextual; estado vazio curto com próxima ação pertinente |
| A20 | A documentação mistura comportamentos reais e simulados | `docs/FUNCOES.md` descreve voz, QR, loja e “faz” a partir de protótipo | Cada recurso ganha estado real; não prometer sucesso, chamada ou instalação sem resultado |
| A21 | Cronômetro existe no código, mas depende de demanda da pessoa | `demandas.js:21,283`; `estacao.js:403`; `index.html:58` | Reproduzir no pacote; unificar tarefa/demanda e apresentar tempo durante execução; hipótese, não causa confirmada |
| A22 | A pesquisa de backend encontrada tem outra contagem | `docs/design/SUPABASE_PECAS.md`: 79 recursos, 16 famílias e duas ações | Reutilizar mapa histórico; distinguir família, recurso e capacidade executável; não exigir tudo em cada backend |
| A23 | O Criador possui fonte, distribuições e Espelho reaproveitáveis | Downloads/criador: `CLAUDE.md`, `corpo/instalar.mjs`, `corpo/espelho.html`, `espelho/index.html` | Núcleo/adaptadores versionados e página modular; snapshot não indica estado atual |
| A24 | Espelho tenta executar Python em uma sonda de instrumentos | `corpo/espelho.mjs:62–63` da pasta recebida | Retirar chamada antes de executar qualquer integração; arquivo apenas lido nesta missão |
| A25 | Perfil Gemma‑Vyra não comprova autonomia nem autoria de programas Dominic | `teste/criador/gemma-vyra/Modelfile.gemma-vyra` e `GEMMA-VYRA.md` | Ativação explícita e avaliação por capacidade; separar memória, habilidade e treinamento de pesos |
| A26 | Substrato completo exige cobrir ações fora da UI tipada | Terminal arbitrário/escrita externa e módulos de diferentes domínios | Eventos com origem, observação de pasta e reconciliação; matriz por categoria e distinção entre registro e treino |

## 3. Pente fino por família de controles

O CSV identifica arquivo, linha, elemento, ação quando literal, rótulo/trecho, forma de construção e tarefa de revisão. A classificação por módulo é uma triagem; os módulos `vistas-*` misturam telas. Não se atribuiu nota visual a controles não observados.

| Família atual | Problema a resolver | Regra de revisão de cada instância |
|---|---|---|
| 12 ícones globais e subatividades | Semântica e hierarquia difusas | Reduzir a cinco destinos; nome visível, tooltip e nome acessível; aliases para rotas antigas |
| Criação na lateral e no centro | Duplicação, alvo pequeno, falta de destino | Menu único; tipo + nome + local; foco no novo objeto; desfazer criação vazia |
| Árvore e menu de arquivo | Extensão/sigla vira linguagem principal | Ícone de tipo, nome, estado de sincronização; ações secundárias no menu; técnico opcional |
| Editor e visualização | Barras extensas, operações dispersas | Salvar/estado, modo do artefato, compartilhar e menu; arquivo aberto conserva identidade |
| Cards de Meu dia | Vazios e explicação ocupando prioridade | Continuar, Pendências e Atividade relevante; esconder seções vazias dispensáveis |
| Demanda e tarefa de fluxo | Vocabulário duplicado, passagem pouco evidente | Tarefa → etapa → responsável → evidência → próximo; tempo pessoal em detalhe |
| Chat e ajuda | Conversa perde vínculo com o trabalho | Contexto clicável de tarefa/arquivo; responder, anexar, pedir ajuda e converter em tarefa |
| Projeto | Resumo duplicando a estação | Abrir posto de trabalho; resumo fica em Visão geral |
| Presença | Grande ornamento em repouso; campo pequeno | Estado compacto; conversa e comando crescem; presença expressiva ligada à ação |
| Agentes e terminal | Provedor/identidade/capacidade confundidos | Nome do agente, provedor, modelo, esforço e acesso são campos distintos |
| Terminais da equipe | Entrar/Assumir pouco precisos | Ver, pedir controle, controlando, devolver; pessoa e escopo sempre visíveis |
| Navegador e Raio-X | Entrada escondida, inspetor pode dominar | Navegação normal primeiro; ferramentas num painel contextual; rótulos em português |
| WhatsApp | Aparência de função disponível sem integração | Conectar ou estado de indisponibilidade real; pessoa/conta/contato identificados |
| Mapa | Editor dentro de outro editor | Janela inteira; barra flutuante; teclado; propriedades só da seleção |
| Máquina | Visualização e execução podem parecer equivalentes | Cada peça mostra projetada/criada/executada/erro com fonte; nenhuma animação inventa dado |
| Quadro e iPad | Recurso praticamente oculto | Entrada desktop para conectar/abrir; desenho dedicado no iPad; sincronização visível |
| Reunião e transmissão | Confunde preparar, compartilhar e estar ao vivo | Preparar cena; prévia; iniciar transmissão; trocar cena; encerrar |
| Acervo/inteligência/presets | Conteúdo distribuído em termos internos | Biblioteca com Materiais, Modelos, Prompts e Aprendizados; origem e permissões |
| Escola/perfil/placar | Checklist ocupa trabalho; progresso pouco explicativo | Aprender com o projeto; provas do que se construiu; progresso pessoal |
| Loja/Oficina/configuração | Administração pesa igual ao trabalho | Extensões na Biblioteca; Oficina e conexões em Preferências com capacidades reais |
| Toasts, diálogos, atalhos, erros | Mensagem pode dizer sucesso antes da ação | Estado na origem, erro recuperável, desfazer quando possível, feedback coerente entre UI e agente |

## 4. Leitura correta da evidência

- O gargalo espacial e o campo da Presença foram observados e confirmados na fonte.
- Navegador, mapa e iPad têm implementação a aproveitar. Sua existência não demonstra a jornada completa pedida.
- O corpo 3D usa uma grade gerada; liberdade espacial exige trabalho de interação e persistência, além do visual.
- A ausência de pareamento real do WhatsApp é explícita no código. Integrá-lo requer avaliar o comportamento do serviço dentro do Electron.
- As tarefas de implementação incluem uma passagem visual por cada estado e controle; esse aceite ainda não foi executado.
