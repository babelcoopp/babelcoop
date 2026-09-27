# Pipeline de implementação e pesquisa · 133 tarefas auditadas + 6 propostas complementares

**Todas as tarefas estão abertas. Implementar somente após a concordância do Theus.** Este é o plano solicitado, não um registro de funcionalidades implementadas. Executor desta análise: [[Dominic]], sem subagentes. O trabalho futuro segue as dependências; uma etapa termina por evidência, sem estimativas inventadas de dias/semanas. O complemento de pets, Replicate, navegador e terminais está integrado pelas tarefas UX-083 em diante; IDs anteriores foram preservados.

`A-FAZER.md` continua sendo a fila histórica. Esta lista especializa o redesenho de UX com IDs próprios; antes de executar, relacionar tarefas antigas equivalentes e evitar dupla contagem. Não apagar nem marcar uma tarefa antiga como feita somente porque recebeu novo destino.

## Ordem e saídas

| Fase | Resultado que se consegue usar | Porta de saída |
|---|---|---|
| F0 · Base e viabilidade | Contratos de contexto, evidência e migração; riscos de integração conhecidos | Nenhuma solução depende de QR, sessão ou capacidade fictícia |
| F1 · Espaço e linguagem | Navegação clara, Criar único, campo/área com espaço, retomada estrutural | Encontrar e continuar trabalho sem se perder |
| F2 · Equipe no projeto | Arquivos, tarefas, conversa e três terminais no mesmo contexto | Uma passagem de trabalho completa entre pessoas |
| F3 · Construção integral | Mapa fluido e Máquina espacial ligada a recursos reais | Construir, salvar, reabrir e explicar a origem de cada peça |
| F4 · Potência dos agentes | Configuração real, sessões duráveis e dois agentes cooperando | Entrega integrada com responsabilidade e prova |
| F5 · Web e WhatsApp | Navegador encontrável; pareamento e uso reais do WhatsApp | Sessão persistente e comandos no contexto correto |
| F6 · Palco e iPad | Reunião comandada pelo terminal e desenho sincronizado | Demonstração física em iPad e tela transmitida |
| F7 · Escola e identidade sensorial | Aprender construindo, biblioteca e efeitos/som coerentes | Experiência expressiva, compreensível e responsiva |
| F8 · Jornada completa e distribuição | Produto conferido em todos os estados e dispositivos previstos | Evidência por requisito, pacote revisável e recuperação possível |
| F9 · Coleção completa | Ampliar cinco pets funcionais para 30 personagens distintos | Cada personagem tem corpo, gestos e aceites próprios |
| F10 · Última integração | Vyra, quarta IA já definida pelo Theus | Repetir os aceites com o último adaptador e fechar a entrega total |

O [Criador e laboratório Vyra](CRIADOR-E-VYRA.md) acrescenta uma trilha secundária L0–L4. Espelho, inicialização e relatos entram nas fases F indicadas; captura/avaliação entram no laboratório. Independência de Gemma (UX-123) é um marco de pesquisa separado, sem impedir a entrega do app de equipe.

## F0 · Base e viabilidade

| ID / estado | Entrega | Depende de | Alvos principais | Evidência exigida |
|---|---|---|---|---|
| [ ] UX-001 | Fixar baseline da fonte, pacote aberto, pedido e alterações preexistentes | — | Git, pacote, PEDIDO-INTEGRAL, A-FAZER | Manifesto identifica versão/caminho; diferenças locais preservadas; relaciona tarefas antigas |
| [ ] UX-002 | Ampliar inventário estático para cobertura visual por tela/estado | UX-001 | INVENTARIO-CONTROLES, estacao, vistas, overrides reais | Cada declaração recebe uso real/demo/invisível/duplicada, destino e evidência; sem declarar clique não realizado |
| [ ] UX-003 | Definir IDs e contexto comum de projeto, artefato, tarefa, sessão e agente | UX-001 | servidor, dados, estacao, explorador | Abrir o mesmo objeto por URL/busca/chat mantém identidade; contrato versionado |
| [ ] UX-004 | Preparar migração reversível de caminhos/objetos/históricos | UX-003 | arquivos, dados, persistência | Cópia de segurança legível; amostra legada abre; rollback conserva dados novos segundo regra documentada |
| [ ] UX-005 | Spike de WhatsApp Web no Electron atual | UX-001 | main, preload, vistas-d, webview isolada | Parear conta autorizada, persistir sessão, reabrir e desconectar; registrar bloqueios reais do serviço |
| [ ] UX-006 | Spike do app iPad, rede local segura, instalação e Pencil | UX-001 | ipad, quadro, servidor, instalador | iPad real instala/abre; identidade/pairing definidos; limitações PWA versus invólucro nativo documentadas |
| [ ] UX-007 | Inventariar capacidades dos provedores instalados e contas conectadas | UX-001 | agentes, codex, terminal-real | Lista real de modelos/esforços/retomada/limites suportados; sem valores de UI não aplicados |
| [ ] UX-008 | Contrato de eventos e prova de ação | UX-003 | acoes, coop-mcp, eventos de servidor | Evento contém autor, objeto, ação, estado e origem verificável; sucesso só após confirmação real |

## F1 · Navegação, espaço e palavras

| ID / estado | Entrega | Depende de | Alvos principais | Evidência exigida |
|---|---|---|---|---|
| [ ] UX-009 | Cinco destinos globais e contexto Livre/Projeto persistente | UX-003 | estacao, casca, vistas | Meu dia primeiro; projeto identificado ao mudar módulo; todos os recursos têm caminho |
| [ ] UX-010 | Layout adaptativo, modo integral e restauração das laterais | UX-009 | casca, estacao, editores | Em 1223×768 e janela maior, centro utilizável; mapa/Máquina usam área integral; Escape restaura estado |
| [ ] UX-011 | Catálogo de microtexto com remoção de explicações fixas e termos ambíguos | UX-002 | todas as vistas e mensagens | Revisão dos 726 registros iniciais e novos; busca encontra zero ocorrências indevidas dos termos substituídos |
| [ ] UX-012 | Família SVG de navegação, tipos e estados | UX-002 | icones, util, casca, árvore | Trabalho/Tarefas e tipos reconhecíveis; alvo 40–44 px, nome acessível e estados Tech/Vibe conferidos |
| [ ] UX-013 | Menu Criar único com destino e tipos coerentes | UX-009, UX-012 | explorador, acoes, editor | Criar cada tipo em Livre/projeto abre o objeto correto; sem duplicar botões ou perder nome/destino |
| [ ] UX-014 | Persistir espaço por pessoa/projeto: abas, seleção, layout e rascunhos | UX-003, UX-010 | estacao, armazenamento de sessão | Fechar/reabrir recupera estado; versão incompatível degrada com recuperação legível |
| [ ] UX-015 | Busca/paleta com ações, objetos, atalhos e desfazer contextual | UX-008, UX-009 | estacao, coop-ui, comandos | Mesmo objeto abre por diferentes entradas; teclado/foco funcionam sem conflito de editor |
| [ ] UX-016 | Tokens de tema, tipografia, contraste, densidade e movimento | UX-010, UX-012 | CSS da casca e componentes | Mesma hierarquia nos dois temas e zoom 200%; preferência de movimento respeitada |
| [ ] UX-017 | Meu dia centrado em Continuar e Precisa de você | UX-014 | vistas-a, notificações, perfil | Primeira entrada e retorno distintos; frase da captura removida; vazios não ocupam a tela inteira |
| [ ] UX-018 | Redirecionar rotas legadas e eliminar entradas duplicadas | UX-009, UX-013, UX-015 | estacao, índice, roteamento | Links antigos de projeto, tarefa, iPad, Máquina e TV continuam chegando ao destino certo |

## F2 · Trabalho de três pessoas no projeto

| ID / estado | Entrega | Depende de | Alvos principais | Evidência exigida |
|---|---|---|---|---|
| [ ] UX-019 | Árvore de projeto, favoritos, busca e arquivos técnicos recolhíveis | UX-004, UX-013 | explorador, arquivos-real, arquivos | Todos os arquivos antigos encontrados; autoria/metadados não multiplicam a árvore |
| [ ] UX-020 | Criar/renomear/mover/excluir com versões e conflito explícito | UX-019 | arquivos, editor, árvores | Operações mantêm referências; edição concorrente não sobrescreve silenciosamente; lixeira/restauração quando aplicável |
| [ ] UX-021 | Importar/exportar e promover criação Livre a projeto | UX-020 | explorador, projetos, arquivos | Documento/mapa/quadro/página/Máquina mantém ID, conteúdo, anexos e histórico após promoção |
| [ ] UX-022 | Criar projeto, convidar e abrir em três Estações | UX-003, UX-004 | projetos, entrada, rede, instalação | Três pessoas reais veem o mesmo projeto com identidades e permissões corretas |
| [ ] UX-023 | Vincular terminal a pessoa, máquina, projeto e diretório | UX-022 | terminal-real, servidor PTY, agentes | Cada pessoa usa seu terminal; troca de projeto não altera processo em execução silenciosamente |
| [ ] UX-024 | Unificar UX de demandas e tarefas, preservando dados | UX-004, UX-009 | demandas, vistas-b, acoes | Registros antigos mantêm IDs, donos, histórico, pausa, aprovação e vínculos; criação nova sempre tem contexto |
| [ ] UX-025 | Etapas, dependências, responsáveis e passagem com contexto | UX-024, UX-008 | tarefas, fluxos, notificações | Entrega aceita libera próxima etapa e abre artefatos para quem recebe; bloqueio tem causa visível |
| [ ] UX-026 | Entregar/revisar com evidência e aprendizado útil | UX-025 | tarefa, editor, acervo | Autor entrega; revisor aprova ou devolve; evidência abre; nenhuma conclusão só por animação |
| [ ] UX-027 | Checkpoint e próxima ação por projeto/tarefa | UX-014, UX-023, UX-026 | sessões, histórico, projeto | Outra sessão retoma contexto público, arquivos e pendências; processos encerrados marcados corretamente |
| [ ] UX-028 | Conversa única por projeto, diretas e vínculos de objetos | UX-003, UX-022 | chat, projetos, vistas-d | Mensagem abre mesmo objeto; conversa global/projeto compartilha histórico; envio/falha/rascunho distinguíveis |
| [ ] UX-029 | Ajuda e terminal compartilhado: observar/pedir/controlar/devolver | UX-023, UX-028 | parede-real, servidor de terminais | Dono vê quem observa/controla, pode revogar; ajudante não atua na máquina errada |
| [ ] UX-030 | Contrato de coedição/sincronização e resolução de conflito | UX-020, UX-022 | arquivos, mapa, quadro, rede | Duas alterações simultâneas e reconexão preservam trabalho; histórico identifica autoria e resolução |
| [ ] UX-031 | Resultados, metas, campanhas e tempo pessoal nos novos destinos | UX-024, UX-009 | campanha, cronometro, perfil, placar | Valores legados preservados; horas e pontos privados não vazam na transmissão; resultado tem origem |
| [ ] UX-032 | Pessoas presentes, disponibilidade e pedido de ajuda contextual | UX-028, UX-029 | equipe, perfil, presença | Online/ausente/desconectado verdadeiros; convidar pessoa chega com projeto/tarefa/arquivo |

## F3 · Mapa e universo de construção

| ID / estado | Entrega | Depende de | Alvos principais | Evidência exigida |
|---|---|---|---|---|
| [ ] UX-033 | Mapa integral com edição/teclado/zoom/estilos/anexos/exportação | UX-010, UX-020 | mapamental, mindforge, pecas.css | Mapa representativo editado sem confinamento; atalhos não roubam texto; seleção e zoom persistem |
| [ ] UX-034 | Operações de mapa compartilhadas por UI/agente e coedição | UX-033, UX-030, UX-008 | mindforge, servidor, coop-mcp | Nó criado/movido por humano/agente aparece nos dois clientes; tarefa vinculada mantém referência |
| [ ] UX-035 | Enquadramentos e apresentação do mapa | UX-033 | mindforge, projeção | Cenas salvas/reordenadas apresentam ramos sem modificar estrutura; Escape recupera edição |
| [ ] UX-036 | Mundo 3D livre com coordenadas e câmera persistidas | UX-010, UX-003 | visual3d, maquina, CSS | Mover peça em XYZ, orbitar/pan/zoom, salvar e reabrir conserva posição; resize não reorganiza arbitrariamente |
| [ ] UX-037 | Paleta de peças, portas, conexões, grupos e undo de layout | UX-036 | maquina, visual3d, catálogo | Montar um fluxo com seleção múltipla e conexões tipadas; desfazer restaura layout correto |
| [ ] UX-038 | Vincular peça a código, definição e banco real existente | UX-037, UX-008 | maquina, banco, coop-mcp | Peça aponta recurso/consulta/arquivo; planejada e criada se distinguem; editar posição não executa migração |
| [ ] UX-039 | Execução real, inspector, traces e mudanças de ambiente | UX-038, UX-026 | banco, maquina, eventos, publicação | Trajeto/erro derivados de execução; prévia de operação e destino; reversibilidade declarada por operação |
| [ ] UX-040 | Grafo/lista equivalentes e limites de renderização | UX-036, UX-038 | visual3d, maquina, acessibilidade | Projeto operável sem WebGL; seleção por teclado; recursos liberados ao fechar; medir cena representativa |

## F4 · Agentes configuráveis e cooperativos

| ID / estado | Entrega | Depende de | Alvos principais | Evidência exigida |
|---|---|---|---|---|
| [ ] UX-041 | Compositor multilinha, expansão, contexto e presença proporcional | UX-010, UX-014 | terminal-real.js/css, organismo | Pedido longo/anexo cabe; rascunho sobrevive às abas; contexto em linha própria; Parar encontrável |
| [ ] UX-042 | Configuração por agente: identidade, provedor, modelo e esforço | UX-007, UX-041 | terminal-real, agentes, codex | Seleção aparece na requisição efetiva e na sessão; modelo não disponível informa motivo |
| [ ] UX-043 | Perfis de potência e limites transparentes | UX-042 | agentes, preferências | Perfil mostra modelo/esforço aplicado; acesso independente; consumo exibido apenas quando medido/disponível |
| [ ] UX-044 | Sessões duráveis, autenticação e retomada de agente | UX-027, UX-042 | agentes, codex, persistência | Reabrir recupera histórico/contexto e retoma thread quando suportado; sessão inválida tem recuperação clara |
| [ ] UX-045 | Duas instâncias cooperando em tarefas delimitadas | UX-025, UX-044 | agentes, tarefas, isolamento de mudanças | Cada agente tem função/arquivos/dependência, terminal e cancelamento próprios; nenhuma sobrescrita silenciosa |
| [ ] UX-046 | Revisão e integração de entregas entre agentes/pessoas | UX-045, UX-026, UX-030 | tarefas, mudanças, arquivos | Revisão aponta diffs/provas; integração preserva autoria; conflito explicitamente resolvido |
| [ ] UX-047 | Registro único de ações tipadas para UI/paleta/coop/MCP | UX-008, UX-015 | acoes, coop-mcp, módulos | Matriz cobre cada capacidade do plano; agente executa por contrato de objeto, sem depender de coordenadas frágeis |
| [ ] UX-048 | Progresso, sucesso, erro e desfazer iguais entre canais | UX-047 | eventos, toasts, histórico, agentes | Mesma ação por botão/agente gera mesmo resultado/estado; falha não dispara celebração de sucesso |
| [ ] UX-049 | Revisão de ação externa quando contexto é insuficiente | UX-047 | chat, transmissão, navegação, Oficina | Destinatário/destino/conteúdo claros; comandos já autorizados não ganham confirmação repetitiva; dúvida preserva rascunho |
| [ ] UX-050 | Conhecimento público com fonte, evidência e limites | UX-044, UX-048 | acervo, diario, agentes | Resposta pública íntegra e arquivos vinculados; excluir segredos e raciocínio interno; correções ficam rastreáveis |
| [ ] UX-051 | Receitas de construção e explicação contextual | UX-047, UX-041 | coop-ui, terminal, biblioteca | Receita usa objeto ativo e pode ser editada; explica recurso/erro sem substituir a área de trabalho |

## F5 · Navegador e WhatsApp reais

| ID / estado | Entrega | Depende de | Alvos principais | Evidência exigida |
|---|---|---|---|---|
| [ ] UX-052 | Navegador visível no cabeçalho e em nova aba | UX-009, UX-010 | navegador-real, estacao | Navegar sem agente; endereço, histórico e abas corretos; entrada encontrada na jornada de primeiro uso |
| [ ] UX-053 | Alternar controle humano/agente no navegador | UX-052, UX-047 | navegador-real, ponte, main | Assumir interrompe automação; controlador e tarefa visíveis; sessão continua no mesmo contexto |
| [ ] UX-054 | Inspector, clonar/exportar e captura com destino claro | UX-052, UX-021 | navegador-real, arquivos | HTML/CSS/Textos/Rede/Console acessíveis; resultado salvo no projeto e abre; erros não anunciam sucesso |
| [ ] UX-055 | WhatsApp Web: QR real, conta e persistência isolada | UX-005, UX-028 | vistas-d, main, preload, sessão | Conta autorizada pareia, carrega e reabre; logout encerra sessão; QR expirado se renova pelo serviço |
| [ ] UX-056 | Agente na conversa escolhida: sugerir/revisar/enviar sob comando | UX-055, UX-049 | WhatsApp, agentes, ações | Contato/anexos conferíveis; envio só conforme instrução; conversa privada não entra no projeto automaticamente |
| [ ] UX-057 | Estados de conexão, autenticação, serviço indisponível e reconexão | UX-052, UX-055 | navegador, WhatsApp, conexões | Falhas reais reproduzidas e recuperáveis; cookies/sessões de pessoas não se misturam |
| [ ] UX-058 | Downloads, links, capturas e anexos ligados ao projeto | UX-054, UX-020 | arquivos, navegador, chat | Abrir/revelar arquivo salvo; origem identificada; cancelamento e nomes duplicados tratados |

## F6 · Reunião viva, transmissão e iPad

| ID / estado | Entrega | Depende de | Alvos principais | Evidência exigida |
|---|---|---|---|---|
| [ ] UX-059 | Sala de reunião com palco, fila de cenas e prévia privada | UX-028, UX-010 | vistas-a, tv, reunião | Preparar reunião não inicia transmissão; apresentador e plateia têm superfícies diferentes |
| [ ] UX-060 | Controlar palco por terminal/agente com ações tipadas | UX-059, UX-047 | coop-mcp, tv, projeção | Abrir/focar/avançar/montar/parar chegam à cena correta; confirmação baseada no receptor |
| [ ] UX-061 | Conectar iPad com pessoa, projeto e revogação de dispositivo | UX-006, UX-022 | ipad, servidor, instalação | Pareamento abre só escopo permitido; sair/revogar interrompe acesso; desktop reencontra o quadro |
| [ ] UX-062 | App de desenho dedicado: Pencil, gestos, autosave e offline | UX-061, UX-030 | quadro, ipad, app instalável | Caneta/palma/zoom/undo avaliados no iPad; perda de rede não perde traços; reinício recupera trabalho |
| [ ] UX-063 | Cenas de mapa, Máquina, quadro, página e resultado | UX-035, UX-039, UX-060, UX-062 | tv, visualizadores, reunião | Conteúdo atualiza de verdade; transição não altera documento; traço do iPad chega ao palco |
| [ ] UX-064 | Decisões, próximos passos e ata vinculados ao projeto | UX-059, UX-025 | reunião, tarefas, biblioteca | Encerrar gera ata revisável com fontes; decisão vira tarefa sem reescrever contexto |
| [ ] UX-065 | Transmitir: destino, prévia, estado, troca de cena e Parar | UX-059, UX-011 | header, tv, dispositivos | Termo antigo removido nos pontos apropriados; monitor/TV mostra só conteúdo escolhido; parar confirmado |
| [ ] UX-066 | Voz/transcrição e memória da sala com estado real | UX-059, UX-050 | reunião, captura/transcrição | Dispositivo/permissão/atividade verdadeiros; pausar/encerrar respeitados; texto revisável; sem chamada simulada |

## F7 · Escola, repertório e efeitos memoráveis

| ID / estado | Entrega | Depende de | Alvos principais | Evidência exigida |
|---|---|---|---|---|
| [ ] UX-067 | Preferências, Equipe e Oficina nos novos destinos | UX-009, UX-049 | oficina, perfil, equipe, atualização | Todos os controles antigos têm destino; prévia/publicação/atualização refletem resultado real |
| [ ] UX-068 | Biblioteca única de materiais, modelos, prompts e aprendizados | UX-050, UX-021 | acervo, inteligencia, presets | Fonte abre; usar modelo cria objetos vinculados ao projeto com dependências e versão |
| [ ] UX-069 | Aprender com missões em projetos e níveis de ajuda | UX-051, UX-026, UX-068 | Meu dia, Aprender, perfil | Pessoa constrói/explica/confere um artefato; progresso tem prova; ajuda pode ser dispensada e reaberta |
| [ ] UX-070 | Extensões, skills e agentes com instalação/configuração verificável | UX-067, UX-007 | loja, integrações, preferências | Disponível/configurado/instalado distinguidos; permissões e falha reais; sem instalar só por visitar catálogo |
| [ ] UX-071 | Gramática visual de montar/conectar/ajudar/concluir/apresentar | UX-008, UX-039, UX-048, UX-063 | maquina-efeitos, poderes, organismo, tv | Cada efeito aponta evento real; interruptível; estado final persiste sem depender da animação |
| [ ] UX-072 | Identidade sonora e mixagem por acontecimento | UX-071 | áudio, preferências, apresentação | Amostra acionada pelo usuário; volume/perfis/categorias; sem sons por tecla; rajadas agrupadas; mudo conserva informação |
| [ ] UX-073 | Teclado, leitor de tela, zoom, contraste e movimento reduzido | UX-016, UX-040, UX-071 | componentes, canvas/listas, temas | Jornadas principais possíveis por teclado; foco retorna; cor/som não são única informação |
| [ ] UX-074 | Estados vazios, erros, ajuda e mensagens em todas as telas | UX-011, UX-018, UX-057, UX-064 | todos os módulos | Revisão por tela/estado: instrução útil, ação correta, rascunhos preservados e zero sucesso fictício |
| [ ] UX-075 | Medir e ajustar desempenho da experiência completa | UX-071, UX-072, UX-073 | render, eventos, assets | Medições em repouso/ação/cena grande/segundo plano; qualidade adaptativa; sem teto numérico apresentado como medição não feita |

## F8 · Conferência integral e entrega

| ID / estado | Entrega | Depende de | Alvos principais | Evidência exigida |
|---|---|---|---|---|
| [ ] UX-076 | Passagem visual por toda tela, botão, palavra, ícone e estado | UX-002, UX-074, UX-075 | inventário atualizado, capturas por estado | Cada registro tem destino/justificativa e conferência; demos excluídas da contagem produtiva; lacunas explícitas |
| [ ] UX-077 | Jornada Theus + duas pessoas no mesmo projeto | UX-032, UX-046, UX-074 | três Estações reais | Criar/entrar/dividir/ajudar/revisar/concluir com três terminais; relatório de pontos de confusão |
| [ ] UX-078 | Sair/reabrir, falha, offline e conflito em artefatos/sessões | UX-027, UX-030, UX-044, UX-062 | persistência, rede, arquivos | Conteúdo e rascunhos recuperados; câmera/seleção voltam; processo encerrado não parece vivo |
| [ ] UX-079 | Apresentar no destino físico e desenhar em iPad real | UX-063, UX-065, UX-066 | iPad, Mac, TV/monitor | Terminal dirige a cena; desenho chega; tela pessoal não vaza; parar/desconectar/reconectar avaliados |
| [ ] UX-080 | Agentes, modelos, esforço e paridade de comandos reais | UX-046, UX-048, UX-051 | provedores conectados e matriz de ações | Dois agentes completam tarefa com revisão; configuração efetiva demonstrada; capacidades ausentes identificadas |
| [ ] UX-081 | Navegador/WhatsApp em conta autorizada e jornada real | UX-056, UX-057, UX-058 | sessão de serviço | Parear/reabrir/navegar/rascunhar/desconectar; envio de prova somente com autorização específica |
| [ ] UX-082 | Pacote revisável da base, migração, recuperação e documentação | UX-076, UX-077, UX-078, UX-079, UX-080, UX-081, UX-098, UX-112, UX-115, UX-116, UX-117 | empacotamento, memória, A-FAZER | Manifesto e provas correspondem ao pacote com cinco pets; dados preservados; limitações conhecidas; publicação/commit conforme autorização |

## Complemento integrado · terminais, navegador, palco e cinco pets

Estas tarefas entram **nas fases indicadas**, antes dos aceites finais, mesmo tendo IDs acrescentados depois. Especificação: [PETS-3D-E-TERMINAIS.md](PETS-3D-E-TERMINAIS.md).

| ID / estado | Fase e entrega | Depende de | Alvos principais | Evidência exigida |
|---|---|---|---|---|
| [ ] UX-083 | F4 · Adaptadores de Claude Code, Codex e OpenCode; contrato extensível | UX-007, UX-023, UX-047 | agentes, codex, novo adaptador OpenCode | Versões detectadas; sessões/eventos/perguntas/cancelamento/MCP reais; ferramenta separada do modelo; quarto adaptador reservado sem falsa disponibilidade |
| [ ] UX-084 | F4 · Experiência completa de terminal: abas, dividir, ampliar, buscar e atalhos | UX-023, UX-041, UX-083 | terminal-real, xterm, PTY, parede | TUI/ANSI/Unicode/resize/cópia/colagem/foco corretos; sessão local/remota identificada; histórico e retorno de comando legíveis |
| [ ] UX-085 | F5 · Bancada de navegador do agente com missão, abas e instrumentos | UX-052, UX-053, UX-047 | navegador-real, ponte, ferramentas | Agente usa estrutura/acessibilidade e captura visual conforme necessidade; ações apontam aba/objeto correto e produzem evidência |
| [ ] UX-086 | F5 · Pesquisa, construção e verificação web por tarefa | UX-085, UX-054, UX-058 | navegador, agentes, biblioteca | Pesquisar/comparar/salvar/construir/conferir; sessões não disputam controle; assumir/parar/login/desafio/erro têm tratamento real |
| [ ] UX-087 | F6 · Direção visual própria da projeção e cenários de construção | UX-059, UX-063, UX-065, UX-088 | palco, tv, enquadramentos, assets | Cenas explicar/demonstrar/construir/decidir legíveis à distância; prévia corresponde à saída; privado não aparece |
| [ ] UX-088 | F0/F7 · Inventariar e classificar peças 3D existentes e necessidades novas | UX-001, UX-036 | midia/pecas, catálogos, GERACAO_REPLICATE | Manifesto de reutilizar/adaptar/substituir/falta; licença, escala, materiais e peso conferidos |
| [ ] UX-089 | F7 · Pipeline Replicate com limite de lote, download e manifesto | UX-088 | gera-replicate.mjs, armazenamento de assets | Schema/versão/preço/licença atuais; credencial protegida; saída baixada, hash e custo documentados; nenhuma URL temporária como dependência de runtime |
| [ ] UX-090 | F7 · Direção dos cinco pets: silhuetas, materiais, locomoção e gestos | UX-088 | design, folhas de referência, S16 | Fio/Casca/Dobra/Brasa/Maré distinguíveis em silhueta e tamanho pequeno; repertórios diferentes, não recolorações |
| [ ] UX-091 | F7 · Um pet piloto completo: malha, rig, estados e interação | UX-089, UX-090, UX-008 | asset GLB, animação, presença | Alegria/tristeza/ação/sono e recuperação demonstrados; rig/material/LOD adequados; geração de malha não encerra tarefa |
| [ ] UX-092 | F7 · Produzir os cinco pets com animação e assinatura próprias | UX-091 | personagens, animações, sons | Cinco modelos completos, com estados, transições e poses estáticas; qualidade consistente nos dois temas |
| [ ] UX-093 | F7 · Comportamento por evento e interação entre pets | UX-092, UX-045, UX-071 | estado de agentes, presença, palco | Troca de contexto/entrega real dispara gesto correto; dormir difere de desconectar; nada exige LLM contínuo para animar |
| [ ] UX-094 | F7 · Escolher, nomear, recolher e persistir companheiro por pessoa/agente | UX-092, UX-042, UX-014 | S16, perfil, configurações, presença | Escolha e preferências retomam; mudar pet não altera ferramenta/modelo/acesso; modo compacto sem personagem disponível |
| [ ] UX-096 | F7 · Desempenho, acessibilidade e ritmo dos pets | UX-093, UX-094, UX-072, UX-075 | renderer, áudio, catálogo | Poucos ativos, carregamento sob demanda, pausa fora de foco, teclado/estado textual, mudo e movimento reduzido; não punir ausência |
| [ ] UX-097 | F2/F8 · Resolver disponibilidade do anfitrião e continuidade entre máquinas | UX-003, UX-030, UX-027 | rede, persistência, sessões, estado de sincronização | Anfitrião dorme/sai e volta; trabalho local preservado, fonte de verdade e conflitos explícitos; estado publicado não se confunde com salvo |
| [ ] UX-098 | F8 · Aceite conjunto do complemento inicial | UX-083, UX-084, UX-086, UX-087, UX-096, UX-097, UX-077 | três ferramentas, navegador, cinco pets, palco | Jornada real integra comandos, interação entre dois pets, navegador do agente e projeção; evidência correspondente à versão |

## Complemento integrado · concluir projetos, cronômetro, navegador e inicialização

Estas tarefas entram nas fases indicadas. A numeração adicional preserva referências existentes. Especificação: [PROJETOS-E-CONCLUSAO.md](PROJETOS-E-CONCLUSAO.md). As cinco categorias iniciais são Site, Frontend, Backend, Landing page e Agente de IA.

| ID / estado | Fase e entrega | Depende de | Alvos principais | Evidência exigida |
|---|---|---|---|---|
| [ ] UX-101 | F5 · Navegador integrado ao terminal, com sessão comum para pessoa/agente | UX-085, UX-083 | navegador-real, webview, terminal, registro de ações | Cliques e comandos agem na mesma aba; vínculo de pessoa/projeto/tarefa; disputa de controle e estado desatualizado tratados; nenhuma dependência de Chrome externo |
| [ ] UX-102 | F7 · Explorar ponteiros com Replicate e escolher direção | UX-089, UX-071 | direção visual, referências vetoriais | Comparar Ponta viva, Encaixe, Fio condutor, Traço de ideia, Companheiro próximo e Ponteiro de palco; distinguir ilustração gerada de cursor pronto; lote/custo antes da geração |
| [ ] UX-103 | F7 · Ponteiro reativo com precisão e significado | UX-102, UX-010, UX-085 | eventos, cursor, canvas, palco, preferências | Hotspot preciso, estados de texto/resize preservados, autoria do agente visível, sem atraso; teclado/movimento reduzido/cursor de sistema funcionam |
| [ ] UX-104 | F2 · Reproduzir ausência do cronômetro e ligar tarefas ao registro legado | UX-001, UX-024 | demandas.js, cronometro.js, estacao.js | Identificar causa no app em uso; tarefa iniciada apresenta cronômetro em todas as áreas; tarefa parada não mostra execução fictícia; dados antigos preservados |
| [ ] UX-105 | F2/F4 · Cronômetro persistente, foco pessoal e execuções de agentes | UX-104, UX-023, UX-045, UX-027 | intervalos, eventos, tarefa, terminal, retomada | Pausar/retomar/trocar tarefa/sair/reabrir sem duplicar duração; duas execuções distinguíveis; tempo humano separado do agente; política de saída explícita |
| [ ] UX-106 | F2 · Cinco modelos de projeto com caminho completo até a entrega | UX-003, UX-024, UX-025 | Projetos, modelos, tarefas, Biblioteca | Site/Frontend/Backend/LP/Agente de IA criam objetivo, etapas, primeira entrega e critérios editáveis; caminhos específicos descritos no complemento |
| [ ] UX-107 | F2 · Conclusão de projeto, bloqueios, revisão e passagem de trabalho | UX-106, UX-026, UX-027 | Visão geral, tarefas, artefatos, notificações | A pessoa seguinte recebe contexto/prova; bloqueio tem dono/próxima ação; entrega final revisável e reabertura preservam histórico; progresso mede entregas aceitas |
| [ ] UX-108 | F0/F4 · Delimitar importação do Criador e suas distribuições | UX-001, UX-007, UX-113 | fonte recebida em Downloads/criador, instruções existentes | Manifesto e diferença da integração preservam original/variantes; mapa de entradas/saídas e contratos; leitura documental já feita não encerra adaptação |
| [ ] UX-109 | F4 · Inicialização comum dos agentes com adaptadores por ferramenta | UX-108, UX-083, UX-047 | gerador, instruções de projeto, adaptadores CLI | Claude Code/Codex/OpenCode recebem identidade, projeto, tarefa, critérios e ferramentas suportadas; diferença por versão e precedência visíveis; não sobrescrever configuração global |
| [ ] UX-110 | F3 · Relacionar pesquisa de backend a peças e capacidades reais | UX-038, UX-088 | SUPABASE_PECAS, catálogo, Máquina, provedores | Auditar pesquisa histórica de 79 recursos → 16 famílias + 2 ações; indicar local/nuvem/parcial/planejado por capacidade; modelo não exige todas as peças |
| [ ] UX-111 | F2 · Restringir modelos iniciais e preservar quatro categorias para depois | UX-106, UX-018 | Projetos, Criar, Biblioteca, backlog separado | Só cinco tipos de projeto ativos; mídia social/vídeo/foto/tráfego no documento separado; arquivos e visualizadores existentes preservados |
| [ ] UX-112 | F8 · Aceite do fluxo de conclusão e do último complemento | UX-101, UX-103, UX-105, UX-107, UX-109, UX-110, UX-111, UX-098 | cinco modelos, tarefa/tempo, navegador, ponteiro, inicialização | Três pessoas levam projeto à entrega; cronômetro acompanha execução/retomada; controle manual/agente compartilha navegador; gerador e capacidades demonstrados |

## Complemento integrado · Espelho do Criador e laboratório Vyra

O material de origem foi lido em 25/09/2026, sem executar o corpo, hooks, instalador, Gemma ou treinamento. Detalhes e limites: [CRIADOR-E-VYRA.md](CRIADOR-E-VYRA.md).

| ID / estado | Fase e entrega | Depende de | Alvos principais | Evidência exigida |
|---|---|---|---|---|
| [ ] UX-113 | F0 · Manifesto de integração do Criador e correção das incompatibilidades | UX-001, UX-007, UX-128 | fonte/template/instalador do Criador, contratos Babel | Arquivos selecionados com origem/hash; invocação de Python excluída antes de executar; hooks por versão; sem copiar memória pessoal ou ativar agendamento implicitamente |
| [ ] UX-114 | F7 · Direção do corpo do Criador e cenas de apresentação | UX-089, UX-087, UX-113 | assets, S17, palco | Anatomia visual explica perceber/lembrar/agir/conferir/evoluir; variante estática e assets preparados; evento visual aponta resultado real |
| [ ] UX-115 | F4/F7 · Espelho modular que cresce por contratos de capacidade | UX-109, UX-114, UX-048 | S17, registro de módulos, dados/ações | Inserir módulo sem reescrever página; retrato datado separado de ao vivo; declarado/configurado/observado/comprovado; apresentação pública sem dados privados |
| [ ] UX-116 | F2/F4 · Relatar erro, reproduzir, corrigir e publicar versão com prova | UX-107, UX-113 | relatos, tarefas, versões, Espelho | Relato preserva esperado/observado/versão; anexos revisáveis; funciona sem agente; correção ligada à evidência e versão recuperável |
| [ ] UX-117 | F4 · Versionar núcleo do Criador, distribuições e migrações | UX-109, UX-113 | pacotes de instrução, adaptadores, memória | Alteração na fonte produz diferença por ferramenta; identidade/contrato do destino preservados; atualização e restauração não perdem dados; quatro opções são Claude Code, Codex, OpenCode e Vyra |
| [ ] UX-118 | L0 · Ativação assistida pela Gemma‑Vyra local | UX-117, UX-007 | adaptador do modelo, saúde, sessão Vyra | Perfil/digest reais; início/parada e primeira tarefa com saída conferida; contrato Dominic respeitado onde aplicável; contexto e geração de dados não confundidos com autoria de programa |
| [ ] UX-119 | L1 · Exemplos de trabalho elegíveis para desenvolvimento da Vyra | UX-008, UX-026, UX-118 | eventos, artefatos, correções, permissões por projeto | Entrada/ação pública/resultado/aceite e origem preservados; amostra revisável; segredos e conversas privadas excluídos; correção/invalidação propagada |
| [ ] UX-120 | L2 · Conjuntos versionados de treino, desenvolvimento e avaliação | UX-119 | dataset, manifestos, separação e deduplicação | Separação por tarefa/projeto/tempo; origem/qualidade/motivo de exclusão; conjunto reservado sem vazamento; exportação conforme escopo aprovado |
| [ ] UX-121 | L2/L3 · Linha de base e avaliação por capacidade | UX-120, UX-118 | casos dos cinco projetos, terminal, memória, Dominic | Conclusão, intervenção, falha, latência, consumo e chamadas Gemma medidos; condições/versionamento; evidência externa à opinião do próprio modelo |
| [ ] UX-122 | L3 · Candidatos de memória, habilidades e modelo, com retorno de versão | UX-121, UX-117 | experimentos, adaptadores, linhagem | Hipótese e comparação antes/depois; memória distinta de pesos; execução compatível sem Python; formato/custo/licença conferidos; candidato reversível |
| [ ] UX-123 | L4 · Demonstrar capacidades da Vyra sem Gemma em runtime | UX-122 | motor candidato, ambiente de avaliação, tarefas reservadas | Gemma indisponível e zero fallback; motor/substituto identificado; capacidades e limites publicados; só promover independência que foi demonstrada; sem data prometida |
| [ ] UX-124 | L3 · Entregar laboratório secundário com ciclo completo de melhoria | UX-115, UX-116, UX-119, UX-120, UX-121, UX-122, UX-125, UX-129 | S18, revisão, versões, pacote | Um caso autorizado vira exemplo/candidato avaliado; resultado visível e restauração demonstrada; trabalho da equipe continua independente do laboratório |

## Complemento integrado · quatro IAs, substrato integral e Vyra solo

Definição final do catálogo pelo Theus no [quarto adendo](ADENDO-4-INTEGRAL.md). O plano anterior de quarta ferramenta a nomear fica substituído por **Vyra**.

| ID / estado | Fase e entrega | Depende de | Alvos principais | Evidência exigida |
|---|---|---|---|---|
| [ ] UX-125 | F0/L1 · Todas as categorias de atividade produzem substrato com origem | UX-008, UX-019, UX-047 | eventos UI/CLI/MCP, terminal, arquivos, banco, reuniões | Matriz por módulo/ação; exemplos reais de registro/artefato/resultado/correção; reconciliação de escrita externa; replay sem perda/duplicação; público integral por referência, segredos redigidos |
| [ ] UX-126 | L1/L3 · Motor leve: receitas, busca incremental e inferência sob demanda | UX-047, UX-050, UX-125 | workers Node, SQLite/FTS, runtime compatível, cache | Mesmo trabalho resolvido por menor mecanismo suficiente; renderer não bloqueia; modelos só quando necessários; contexto certo; nenhuma dependência Python |
| [ ] UX-127 | L0/L3 · Vyra executa sozinha, sem outras IAs abertas | UX-118, UX-126 | sessão Vyra, terminal, navegador, ações Babel | Projeto percorrido em modo Solo sem contas/sessões Claude/Codex/OpenCode; uso de Gemma explícito nesta fase; nenhum fallback silencioso; independência de Gemma tratada em UX-123 |
| [ ] UX-128 | F0 · Retirar Python dos caminhos de produto e integração | UX-001, UX-007 | probes, hooks, adaptadores, receitas, dependências | Referências classificadas; nenhum processo Python acionado nem wrapper usado como contorno; alternativas definidas; documentos históricos preservados; nenhum software do Mac desinstalado por inferência |
| [ ] UX-129 | L3/F8 · Comparar leveza e potência das rotas sem Python | UX-075, UX-121, UX-126, UX-127 | mesma cesta de tarefas, hardware e versões | Acerto/prova, intervenção, latência, RAM, CPU/GPU, tamanho e custo medidos; melhora ou regressão explícita; melhor rota escolhida por evidência |

## F9 · De cinco para 30 companheiros

| ID / estado | Entrega | Depende de | Alvos principais | Evidência exigida |
|---|---|---|---|---|
| [ ] UX-095 | Ampliar coleção por lotes até 30 personagens distintos | UX-082, UX-092, UX-096 | catálogo e produção 3D | Trinta corpos/locomoções/gestos diferentes; cada lote passa rig, interação, som, LOD, acessibilidade e origem; não carregar 30 simultaneamente |

## F10 · Quarta ferramenta por último e encerramento total

| ID / estado | Entrega | Depende de | Alvos principais | Evidência exigida |
|---|---|---|---|---|
| [ ] UX-099 | Integrar Vyra como quarta IA no catálogo final do Babel | UX-083, UX-095, UX-098, UX-124, UX-127 | adaptadores, terminal, capacidades | Claude Code/Codex/OpenCode/Vyra selecionáveis; Vyra solo e cooperação comprovadas; modelo interno identificado; mesmo aceite de controle/retomada; entrada final conforme pedido |
| [ ] UX-100 | Repetir jornada final e entregar produto e laboratório | UX-082, UX-095, UX-099, UX-112, UX-124 | pacote, provas, documentação e memória | Matriz de 79 requisitos revista, 30 pets/quatro IAs/laboratório nos estados reais; UX-123 permanece marco de pesquisa separado até comprovação; aprovação/publicação conforme autorização vigente |

## Como executar uma fatia

## Complemento final · música e seleção

Contrato e régua: [Música, seleção e aceite](MUSICA-SELECAO-E-ACEITE.md). Integra F1, F7 e F8; a posição destas linhas não adia a seleção até depois da integração final.

| ID / estado | Entrega | Depende de | Alvos principais | Evidência exigida |
|---|---|---|---|---|
| [ ] UX-130 | F7 · Playlist persistente com MP3 inicial e candidata leve | UX-001, UX-008 | player, biblioteca local, preferências | Faixa indicada primeiro; tocar/pausar/fila/posição/volume; mudar tela e retomar; original intacto, comparação de tamanho/duração/audição; erro de arquivo ausente |
| [ ] UX-131 | F7 · Bordas pela energia suavizada da música | UX-130 | analisador do áudio, compositor visual | Áudio varia intensidade; silêncio/pausa zeram; intensidade e desligamento; movimento reduzido/aba oculta param ciclo; medir CPU/RAM/frame time, sem microfone |
| [ ] UX-132 | F1 · Selecionar copia; colar conserva tipo e conteúdo | UX-003, UX-008, UX-013 | editor, terminal, navegador, explorer, canvas, clipboard | Mouse/teclado, Unicode/multilinha, objetos e seleção múltipla; app externo e canvas; preferência desligada, erro real, vazio/arrasto/segredo não copiam |
| [ ] UX-133 | F8 · Fechar a régua de 79 requisitos com música e seleção | UX-100, UX-130, UX-131, UX-132 | jornada completa, pacote e evidência | Cada requisito aponta resultado observado; três pessoas retomam e concluem projeto; nenhuma tarefa fecha por aparência; limitações de dispositivo e pesquisa explicitadas |
| [ ] UX-134 | S06 · Terminal ao lado no layout preferido + painel completo de métricas Codex | UX-007, UX-023, UX-041, UX-084 | painel de terminal, adaptador Codex/app-server, privacidade local | Maquete mostra área de trabalho e terminal lado a lado, divisão redimensionável e retorno ao mesmo contexto; inventário separa conta, sessão e turno; cada campo indica fonte/escopo/atualização; indisponível/erro não vira zero; estimativa marcada; nenhum dado privado transmitido à equipe |
| [ ] UX-135 | S20 · Laboratório de Agentes com teste humano e IA × IA antes do piloto | UX-007, UX-045, UX-048, UX-084, UX-116, UX-121 | sandbox, sessões, fixtures, avaliadores, versões e evidências | Candidata isolada da versão ativa; cenário repetível; conversa humana e rodada candidata/desafiante/revisora; permissões mostradas; interrupção/retomada; transcript/diff/medições vinculados à versão; falhas preservadas; IA não aprova sozinha; aceite humano limita piloto por agente, tarefa e grupo |
| [ ] UX-136 | V3 · Matriz de intenção e ações do terminal para todas as capacidades V1/V2 | UX-047, UX-007, UX-134 | ações tipadas, paleta, comandos naturais, shell e adaptadores | Cada botão/atalho/MCP/agente tem equivalente e ID; intenção resolve projeto/objeto/pessoa; ambiguidade, permissões, prévia, falha, parada, prova e undo definidos; shell bruto separado de comandos Babel |
| [ ] UX-137 | V3 · Terminal universal fixo à direita em todas as telas e modos | UX-010, UX-084, UX-136 | casca, painéis, abas/sessões, modo imersivo, layouts responsivos | Terminal permanece aberto em mapa/Máquina/navegador/reunião/lab; largura regulável; foco central não o oculta; telefone mantém comando acessível; contexto/rascunho/sessão persistem ao navegar |
| [ ] UX-138 | V3 · Gramática imersiva do jogo de telas, ligada a eventos reais | UX-033, UX-039, UX-048, UX-071 | mapa, Máquina, presença, efeitos, som, TV | Ciclo intenção→construção→prova→próxima etapa aparece com autoria; efeito acompanha evento real; erro não comemora; acessibilidade/redução de movimento/silêncio conservam estado |
| [ ] UX-139 | V3 · Fechar crosswalk completo entre V1, V2 e capacidades finais | UX-001, UX-004, UX-047, UX-136, UX-137, UX-138 | telas, navegação, requisitos, maquete, documentação | Toda capacidade e requisito de origem aponta para destino/estado/aceite ou razão explícita de retirada aprovada; nenhuma função desaparece por fusão de menu; V3 revista antes de fases de execução |

### Procedimento por fatia

1. Ler requisito, tela e tarefa; registrar estado atual e dados a preservar.
2. Construir o caminho completo da intenção ao resultado observável.
3. Conferir os cenários de aceite quando a execução/validação estiver autorizada; registrar exatamente o que foi feito e o que falta.
4. Atualizar inventário, memória, vínculos com A-FAZER e evidência do pacote correspondente.
5. Marcar somente a tarefa concluída; comportamento parcial continua aberto.

**Primeira fatia recomendada:** contratos mínimos UX-001/UX-003/UX-008, seguidos de espaço/navegação UX-009/UX-010, Criar UX-013, compositor UX-041, limpeza textual UX-011 e ícones UX-012. Em seguida, consolidar os cinco modelos, projeto/equipe, tarefa, cronômetro e retomada (F2 + UX-104/UX-106/UX-107/UX-111). Os spikes UX-005/UX-006/UX-007 precisam ocorrer antes de prometer as integrações nas telas finais. O Criador recebido entra pelo manifesto UX-113. O Laboratório de Agentes valida versões antes do piloto da equipe; o laboratório de pesquisa da Vyra continua secundário à jornada principal. São etapas do mesmo executor; não autorizam criação de subagentes.
