# Plano das telas · um lugar para construir juntos

**Fechamento recuperado:** [Música, seleção e régua de aceite](MUSICA-SELECAO-E-ACEITE.md) incorpora o MP3 como primeira faixa, bordas pela música e selecionar → copiar → colar. A versão V2 conferida contém **79 requisitos, 133 tarefas, 19 áreas especificadas e 21 vistas** (incluindo apresentação). O [Plano V3](PLANO-V3-CONSOLIDADO.md) e os complementos R80–R83/UX-134–UX-139 são propostas posteriores para discussão, fora desses totais auditados. [Histórico visível do Codex](HISTORICO-CODEX.md).

Proposta de [[Dominic]] para Theus · 25/09/2026. A síntese posterior está no [Plano V3 consolidado](PLANO-V3-CONSOLIDADO.md), com [maquete própria](PLANO-V3-VISUAL.html). Consulte também a [maquete V2](PLANO-VISUAL.html), a [fala preservada](PEDIDO-INTEGRAL.md), a [auditoria](AUDITORIA.md) e o [TODO](TODO.md).

**Complementos incorporados:** [Pets 3D e terminais](PETS-3D-E-TERMINAIS.md), [projetos, conclusão, cronômetro e ponteiro](PROJETOS-E-CONCLUSAO.md) e [Criador e Vyra](CRIADOR-E-VYRA.md). O último acrescenta S17–S18, página modular do corpo, distribuições, modo solo e laboratório secundário. **Catálogo final: Claude Code, Codex, OpenCode e Vyra.** Toda atividade produz substrato; Python fica fora da arquitetura. **Implementar após a concordância do Theus**, como determinado no [adendo](ADENDO-INTEGRAL.md).

## 1. O produto que vamos organizar

O babel-coop é uma estação de construção em equipe, operada por pessoas e agentes. O terminal executa; o projeto dá contexto; os artefatos tornam o resultado visível; tarefas organizam a passagem de trabalho; conversa e presença aproximam a equipe. Aprender acontece dentro desse trabalho.

A sensação de jogo vem de **montar, conectar, experimentar, descobrir e construir junto**. Cada peça pode ser compreendida e manipulada. Cada efeito corresponde a algo que aconteceu. A pessoa pode começar com linguagem natural, abrir o código quando quiser e aprender a relação entre intenção, comando e resultado.

### Decisões da proposta

- O projeto passa a ser o contexto de trabalho comum a todos os módulos.
- Cinco modelos iniciais: Site, Frontend, Backend, LP e Agente de IA. Cada um tem caminho até uma entrega aceita; outros quatro tipos ficam no backlog separado.
- O cronômetro acompanha a tarefa em execução; foco humano e tempo de agentes são distintos.
- Meu dia continua como primeiro destino da navegação. Ao reabrir o app, a pessoa pode retomar o último trabalho; não precisa atravessar Meu dia em toda abertura.
- Criar vira uma ação universal com um único menu; seus resultados abrem na área de construção.
- Mapas e Máquina abrem usando a janela inteira. As ferramentas aparecem ao redor do objeto, sem colunas permanentes comprimindo o centro.
- Conversa com agente e terminal são modos do mesmo posto de trabalho, sempre acessíveis.
- Transmitir vira um verbo e um estado explícito. Preparar reunião não transmite automaticamente.
- Tech e Vibe permanecem. A expressividade visual/sonora será projetada como parte do produto.
- Esta é a proposta recomendada; nomes e composições novos ainda não foram implementados ou aprovados como decisões finais pelo Theus.

## 2. Mapa de navegação

```text
babel-coop
├── Meu dia        continuar • pendências • novidades relevantes
├── Projetos       recentes • em equipe • meus projetos • arquivados
├── Conversas      projetos • diretas • WhatsApp • reuniões
├── Biblioteca     materiais • modelos • prompts • aprendizados • extensões
└── Aprender       próxima missão • trilhas • minhas construções

Cabeçalho persistente
  [Livre / Projeto ▾]  [Buscar / comando]  [+ Criar]  [Navegador]
  [Pessoas presentes]  [Transmitir]  [Perfil / Preferências]

Dentro do projeto
  Construir | Tarefas | Conversa | Visão geral
  ├── arquivos, documentos, páginas, mapas, Máquina, quadros e navegador
  ├── meu terminal + meus agentes; ver terminais da equipe
  ├── etapa atual, responsável, ajuda e evidência
  └── objetivo, membros, resultados, histórico e reuniões

Modo de construção integral
  [Voltar ao projeto] [nome do artefato • salvamento] [Colaborar] [Transmitir]
  [             mapa / mundo 3D / resultado ocupa a janela             ]
  [ferramentas contextuais]                        [abrir agente/terminal]
```

**Dois caminhos, um objeto:** a conversa de um projeto aparece tanto em Conversas quanto na aba Conversa do projeto. É o mesmo canal, com o mesmo histórico. A tarefa, o arquivo e o mapa também têm um identificador estável; abrir por busca, chat ou agente chega ao mesmo objeto.

### O que sai da barra atual e para onde vai

| Hoje | Destino proposto | O que se preserva |
|---|---|---|
| Meu dia | Meu dia | Caixa de entrada, check-in, contribuição e ideias, com prioridade e ajuda contextual |
| Criar | Botão + Criar e área Construir | Explorador, tipos, importação, modelos e edição |
| Trabalho / Demandas / Tarefas | Projeto → Tarefas; minhas pendências em Meu dia | Responsável, prazo, estimativa, etapas, pausa, OK, histórico e aprendizado |
| Chat | Conversas | Canais, diretas, anexos, respostas e reações |
| WhatsApp | Conversas → WhatsApp | Sessão pessoal separada; integração real a construir |
| Reunião | Projeto → Reunir; Conversas → Reuniões | Pauta, materiais, decisões, próximos passos e ata |
| Terminais | Painel de agentes/terminal → Equipe; atalho pelas pessoas presentes | Terminais próprios, parede ao vivo, ajuda e controle compartilhado |
| Projetos | Projetos | Criação, participação, visão geral e retomada |
| Acervo / Inteligência | Biblioteca | Busca, fontes, aprendizados, prompts e resumos com evidência |
| Equipe / Mapa da equipe | Pessoas no cabeçalho → Equipe | Perfis, convite, disponibilidade, ajuda e grafo de colaboração |
| Metas e campanhas | Projeto → Visão geral → Resultados; agregação da equipe | Meta, dono, prazo, campanha e celebração de resultado real |
| Loja | Biblioteca → Extensões | Skills, MCPs, agentes, plugins e modelos, somente com status de instalação verdadeiro |
| Oficina | Preferências → Oficina | Quem pode mudar o app, prévia, publicação, atualização e histórico |
| Perfil / Minha contribuição | Avatar → Perfil; resumo em Meu dia | Produções, selos e progresso pessoal; sem ranking de pessoas |
| Tela da TV e seus modos | Transmitir | Destino, prévia, palco, quadro, site, modo visita e painel de atividade real |
| Rota #ipad | Criar → Quadro → Conectar iPad | App dedicado de desenho, arquivo, sincronização e transmissão |

Rotas antigas redirecionam para os novos destinos. Remover uma entrada não apaga dados ou uma capacidade. Os arquivos atuais não serão movidos em massa como efeito colateral da mudança visual.

## 3. Modelo de trabalho e continuidade

| Objeto | Identidade e contexto necessários | Experiência resultante |
|---|---|---|
| Espaço de trabalho | Pessoa, projeto ou Livre, abas, layout, seleção, rascunhos | Voltar ao mesmo lugar |
| Projeto | ID, objetivo, membros, arquivos, tarefas, canal e eventos | A equipe reconhece uma construção comum |
| Artefato | ID, tipo, projeto opcional, caminho, autoria, revisão, sincronização | O mesmo mapa/arquivo abre a partir de qualquer lugar |
| Tarefa | Projeto, resultado esperado, etapas, responsáveis, dependências, provas | Saber o que falta, quem segue e o que foi entregue |
| Sessão de terminal | Pessoa, máquina, projeto, diretório, processo e estado real | Cada um trabalha no seu terminal sem perder o contexto comum |
| Agente | Nome, provedor, modelo, esforço, contexto, tarefa, acesso e sessão | Configuração e responsabilidade compreensíveis |
| Reunião | Projeto, participantes, cenas, decisões e destino de transmissão | Apresentar o trabalho e transformá-lo em próximos passos |
| Evento | Ação, autor humano/agente, objeto, antes/depois e evidência | Histórico, desfazer possível e efeitos ligados ao fato |

**Livre:** abre um espaço pessoal sem exigir cadastro de projeto. Documento, mapa, página e Máquina podem nascer ali. “Levar para projeto” mostra destino e conflitos, conserva identidade/histórico e atualiza as referências.

**Colaboração:** a visão principal dos arquivos é a do projeto. Autoria, proprietário, local de armazenamento e permissão são informações distintas. No início da migração, um resolvedor pode reunir caminhos existentes por pessoa sem copiar tudo. O plano inclui versões e resolução de conflito antes de permitir edição simultânea do mesmo objeto.

**Trocar de projeto:** troca arquivos, tarefas, canal e agentes vinculados. Terminal com processo em execução continua identificado com seu projeto original; não recebe `cd` silencioso. Um terminal novo nasce no projeto escolhido. Um pedido já enviado a um agente mantém o contexto registrado naquele envio.

**Retomar:** salvar abas, documento/posição, seleção de nó, câmera 3D, painéis, rascunhos e tarefa atual por pessoa/projeto. Guardar histórico público, arquivos produzidos e próximo passo dos agentes. Processo encerrado aparece como encerrado; restaurar a tela não finge restaurar um processo. Reexecução de comando e continuidade cobrável do agente são ações explícitas.

## 4. Especificação das telas

### S01 · Meu dia — continuar

**Entrada:** primeiro ícone global, abertura sem sessão anterior, ou escolha da pessoa.

**Composição:** Continuar no topo, com projeto/arquivo/tarefa e último ponto de trabalho; em seguida Precisa de você (revisão, menção, ajuda); depois atividade relevante. Um primeiro uso oferece Criar projeto, Criar livre e Entrar na equipe. Check-in e contribuição ficam acessíveis sem monopolizar a tela.

**Limpeza:** retirar o parágrafo “A caixa de entrada junta… A TV nunca mostra…”. A regra de privacidade continua no funcionamento e nas preferências de transmissão. Retirar quadros vazios repetidos. “Tudo em dia” pode ocupar uma linha. A trilha 0/6 deixa de competir com a retomada e vai para Aprender.

**Estados:** primeira entrada, sessão para retomar, sem pendências, pendência com prazo, aguardando sincronização. Abertura nunca marca tarefa como iniciada nem horas como trabalhadas automaticamente.

### S02 · Projetos e Visão geral — quem está construindo o quê

**Lista:** recentes primeiro; nome, objetivo curto, próxima etapa, pessoas presentes e estado. Criar projeto pede nome, objetivo e critério de pronto. Oferece somente Site, Frontend, Backend, LP e Agente de IA; o modelo sugere etapas editáveis. Membros e detalhes vêm em seguida. Os processos completos estão em [Levar o projeto até o fim](PROJETOS-E-CONCLUSAO.md).

**Ao abrir:** voltar ao espaço de construção salvo. Visão geral é uma aba com objetivo, entregas, etapas, membros, resultados e atividade. Convidar, Reunir e Configurar ficam neste contexto. “Entrar na equipe” e “participar do projeto” não são a mesma operação.

**Equipe:** convite pelo fluxo local existente, com pessoa identificada e acesso do projeto; cada integrante instala/abre sua Estação e usa sua conta de agente. Mostrar desconectado/última atualização em vez de presença inventada. Arquivar projeto conserva links e permite reabrir.

### S03 · Tarefas — resultado, processo e passagem

**Uma linguagem:** “Tarefa” cobre a demanda simples e o processo com etapas. Criação curta: resultado, projeto, responsável ou Disponível; prazo/estimativa/etapas em detalhes. Modelos oferecem processos reutilizáveis.

**Modos:** Lista, Quadro e Etapas; filtros Minha parte, Equipe, Disponíveis, Em revisão e Bloqueadas. Cartão mostra resultado, responsável e próximo estado. Abrir tarefa revela contexto, artefatos, conversa, dependências, histórico, tempo pessoal e próxima ação.

**Fluxo:** Disponível → Em andamento → Em revisão → Concluída; Bloqueada e Pausada têm motivo e retomada. Uma etapa aceita libera a próxima, avisa o responsável e entrega links/provas. “Entregar para revisão” difere de “Aprovar entrega”. Preservar o combinado de quem pode dar o OK dos registros existentes.

**Prova:** link ao arquivo, alteração, resultado ou verificação real. Aprendizado pode ser extraído/proposto e confirmado sem obrigar uma redação ritual em todo pequeno gesto. Não somar pontos por clicar numa caixa vazia. Tarefas legadas conservam IDs e histórico durante a unificação.

**Cronômetro e conclusão:** iniciar pelo botão, terminal ou agente apresenta a cápsula de tempo em qualquer modo de trabalho. Intervalos, pausa e retomada persistem; execuções de agentes não contam como horas da pessoa. Dependências, bloqueios e próximo destinatário estão claros. A visão “Até a entrega” mostra marcos aceitos, o que falta e quem aprova o resultado final. Contrato detalhado no complemento §2–§3.

### S04 · Construir — arquivos, código e resultado

**Layout comum:** navegação global compacta; árvore recolhível de 220–260 px; abas de artefatos no centro; painel de agentes regulável de 360–480 px. Valores são ponto de partida de projeto, sujeitos a medição.

Quando o centro cair abaixo de aproximadamente 720 px, recolher a árvore ou oferecer o agente como gaveta. No tamanho observado de 1223 px, manter as duas colunas largas não é aceitável. A preferência manual da pessoa prevalece; ajustes automáticos são reversíveis e não oscilam durante a digitação.

**Árvore:** Arquivos do projeto, Favoritos e Recentes; filtro por nome/tipo/autor, não três cópias da mesma árvore. Arquivos técnicos ocultos ficam em uma seção opcional. Mostrar ícone reconhecível, nome e estado de gravação/sincronização; autoria aparece ao selecionar ou em atividade.

**Editor:** título/breadcrumb, Salvo/Salvando/Conflito, visualização adequada, Compartilhar e menu. Markdown alterna Documento/Código; página alterna Resultado/Código/Dividir; PDF/imagem/vídeo/CSV conservam visualizadores. Renomear, mover, copiar, exportar, versões, desfazer e ajuda ficam previsíveis. Não confundir “salvo neste computador” com “sincronizado com a equipe”.

### S05 · Criar — escolher o objeto e começar

Uma paleta no mesmo lugar, por botão e comando. Seis tipos principais: **Documento, Página/app, Mapa mental, Máquina, Quadro no iPad, Pasta**. Rodapé: Importar e Usar modelo. Arquivo bruto por extensão fica no modo avançado. Pesquisa começa por Navegador/Biblioteca e gera um documento com fontes.

Cada opção mostra um ícone da mesma família e uma frase curta apenas quando necessário. Nome sugerido editável, destino visível (Livre ou projeto + pasta) e criação imediata com salvamento inicial. O tipo não obriga a atravessar uma tela promocional. Nova tarefa, novo projeto e reunião ficam nas ações de seus contextos e na paleta de comandos.

Documento substitui a separação artificial entre “nota” e “arquivo Markdown”. Os arquivos `.md` continuam compatíveis. Quadro no iPad abre a conexão do dispositivo ou o quadro já associado, com visualização no desktop.

### S06 · Agentes, Presença e terminais — potência com controle compreensível

**Composição do posto (direção pedida pelo Theus):** manter como base a segunda opção aprovada, com a área de trabalho/projeto à esquerda e o terminal sempre visível no painel direito da mesma janela. O terminal não deve virar uma página separada nem cobrir o conteúdo por padrão. A divisão é redimensionável; recolher o terminal amplia o trabalho e um comando persistente o reabre no mesmo contexto. Em telas estreitas, a pessoa alterna entre as áreas sem perder estado. A organização nova do plano entra dentro dessa composição, sem substituir o arranjo que o Theus prefere. Detalhes de abas, divisões e PTY continuam em UX-084.

**Painel:** abas por agente e terminal; cabeçalho com nome, ferramenta/modelo e estado; histórico público; anexos/contexto; compositor. A presença visual terá companheiro 3D escolhido pela pessoa, começando com cinco e ampliando a coleção para 30 (S16 no complemento). Em repouso pode se recolher; durante construção participa dos eventos sem ocupar permanentemente o lugar da conversa. Claude Code, Codex e OpenCode têm adaptadores próprios; Vyra é a quarta IA, com modo solo. Espelho do Criador e evolução ficam nos detalhes do agente.

**Compositor:** textarea com cerca de 96 px de altura inicial, crescimento até 240 px e botão Expandir; anexos e chips em linha própria; Enter envia e Shift+Enter quebra linha, configurável. Rascunho por agente/projeto, colagem multilinha, seleção de arquivo/nó/tarefa, arrastar anexos e contexto removível. Enviar mostra destinatário; Parar permanece encontrável durante execução. Trocar de aba conserva o texto não enviado.

**Uso e métricas do Codex:** no painel do agente, abrir uma visão de uso sem sair do terminal. Separar claramente **limites da conta** (janelas primária/secundária, percentual usado, duração e horário de renovação, quando retornados), **uso da sessão/conversa** (tokens de entrada e saída, cache e raciocínio quando disponíveis, total acumulado e janela/contexto reportado) e **último turno** (tokens e custo estimado apenas se a própria integração fornecer). Identificar escopo e horário da atualização. Distinguir dado ao vivo, estimativa, indisponível e erro; nunca calcular porcentagens, custo ou limites por suposição. Não misturar consumo de agentes diferentes nem publicar dados privados da conta para a equipe. Os campos exatos dependem da versão e da conta do Codex; inventário e critérios em UX-134.

**Configuração por agente:** nome e função; provedor conectado; modelo disponível naquela conta; esforço de raciocínio quando suportado; limites de uso e ferramentas/acessos. “Rápido”, “Equilibrado” e “Profundo” podem ser perfis, desde que mostrem qual modelo/esforço de fato aplicam. Não usar um número fictício de potência. Permissão de executar ou enviar mensagem não aumenta junto com esforço. Valores indisponíveis ficam identificados, nunca silenciosamente substituídos.

**Dois agentes cooperando:** atribuir objetivo e resultado a cada um (ex.: construir e revisar), arquivos/áreas de atuação e dependências. Cada agente tem terminal/sessão e log próprios; mudanças conflitantes passam por integração explícita. A pessoa vê quem faz o quê, pode conversar com cada agente, interromper um ou todos, reassumir uma etapa e revisar a entrega. Trabalho de agentes continua ligado à tarefa do projeto, com autoria e evidência. O plano não iniciou subagentes nesta missão.

**Terminais humanos:** Meu terminal e Equipe. Ver terminal é distinto de Controlar. Convite aponta projeto/tarefa; dono vê observador/controlador e pode encerrar. Ao sair, quem ajuda deixa o contexto e devolve o controle. O painel identifica claramente a máquina remota; nada troca de terminal por ambiguidade de nome.

### S07 · Mapa mental — pensar em toda a tela

Abre em modo integral do aplicativo: cabeçalho compacto, canvas, ferramentas flutuantes, zoom/enquadrar e agente recolhido. Escape/Voltar recupera o layout anterior. Tela cheia do macOS é opcional e separada desse modo.

Preservar e aprimorar MindForge: Tab cria filho, Enter irmão, edição direta, arrastar ramo, dobrar/expandir, seleção múltipla, busca, notas, links/anexos, conexão entre ramos, desfazer/refazer, estilos, exportar e minimapa. Todos os atalhos aparecem na ajuda contextual e respeitam edição de texto.

Cursores/seleções da equipe, histórico e conflito resolvido sem sobrescrita silenciosa. Um nó pode virar tarefa com vínculo de volta; agente pode criar/mover/renomear nós pelo mesmo contrato da UI. “Apresentar” salva enquadramentos/cenas sem bagunçar a estrutura do mapa. A referência MindMeister orienta fluidez, não uma cópia de marca.

### S08 · Máquina — universo 3D livre de construção

**Mundo:** canvas integral, pan/orbita/zoom, enquadrar seleção/tudo, posições XYZ persistidas, vistas salvas, escala compreensível e mapa de navegação. Arrastar monta; selecionar revela inspector; Esc limpa seleção antes de sair. A pessoa não precisa controlar uma câmera difícil para selecionar uma tabela: oferecer também vista 2D e lista dos mesmos objetos.

**Construção:** paleta de peças para dados, telas, funções, automações, integrações e agentes; portas identificadas por tipo; prévia de ligação; encaixe, grupos, múltipla seleção, duplicar, desfazer e modelos reutilizáveis. A construção pode ser livre ou vinculada ao projeto. O espaço organiza regiões sem impor uma grade fixa.

**Verdade técnica:** separar layout espacial da definição executável. Peça planejada, recurso criado e execução comprovada têm estados diferentes. A Máquina atual e o banco local existente são a base a integrar. Alterar posição não altera uma tabela; alterar schema mostra a operação concreta. Não criar um desenho sem ligação com o backend e chamá-lo de backend pronto.

**Execução:** comando do agente monta a peça e expõe origem, arquivos/consulta e resultado. Fluxo acende somente onde houve evento real. Erro permanece na peça, com causa e como corrigir. Inspecionar registros, dependências, entradas/saídas e histórico no objeto. Ambiente local/revisão/publicação é visível; publicar ou migrar dados mostra destino e mudanças reais. Nenhuma infraestrutura externa nova é presumida como autorizada só por este plano.

**Retomada:** câmera e seleção voltam ao abrir; mudança de uma pessoa chega à outra com autoria; layout e alterações executáveis têm desfazer apropriado. Em máquina sem 3D utilizável, o mesmo projeto continua operável em grafo/lista.

### S09 · Navegador — entrada visível e uso normal

Globo no cabeçalho, + Aba → Navegador e comando de busca. Abrir e navegar não exige agente em execução. Barra de endereço, voltar/avançar, atualizar, abas, histórico e downloads no projeto escolhido. O navegador é também uma **bancada central do agente**, com missão, múltiplas abas/sessões, leitura estrutural e visual, inspeção, ações e evidências; detalhes no complemento §4.

Agente e pessoa compartilham a sessão sob um modo visível: Você controla / Agente controlando. Assumir interrompe a automação daquele navegador; devolver permite continuar a tarefa definida. Raio-X/Inspecionar abre lateral temporária com HTML, CSS, Textos, Rede e Console. Clonar/exportar/capturar informa pasta, origem e resultado; opções avançadas não dominam a navegação cotidiana.

**No osso do terminal:** a sessão nativa tem vínculo com pessoa/projeto/tarefa/terminal. Clique manual e comando do agente operam a mesma aba e o mesmo estado; controlar não abre uma cópia invisível diferente. Controle, foco, navegação, popups e reconexão têm contrato comum. [Detalhes](PROJETOS-E-CONCLUSAO.md).

### S10 · Conversas — equipe, projeto e WhatsApp

Coluna de conversas, histórico central e contexto abrível. Canais por projeto, diretas e reuniões; fixados, busca, respostas, menções, anexos e estado de envio. Mensagem pode gerar tarefa mantendo link de origem. Convite para ajuda abre arquivo/tarefa exatos.

**WhatsApp:** seção própria dentro de Conversas, com conta pessoal e sessão isolada. Jornada: Conectar → QR real entregue pelo WhatsApp Web → escanear no telefone → conversas carregadas → desconectar quando quiser. Antes da integração, avaliar compatibilidade de login/persistência/renderização no Electron; não assumir que qualquer webview funciona.

**Agente no WhatsApp:** selecionar conversa e pedido; sugerir resposta no compositor, revisar ou mandar quando isso foi explicitamente solicitado com destinatário e conteúdo claros. Mostrar o contato e anexos antes de uma ação ambígua. Não copiar automaticamente conversas para biblioteca, equipe ou transmissão. Se Theus pedir compartilhar um trecho, o trecho e o destino ficam visíveis. Este plano não envia mensagens.

### S11 · Reunir e Transmitir — palco vivo

**Sala do projeto:** participantes, pauta breve, fila de cenas e palco central. Cenas aceitam documento, página/site, mapa, Máquina 3D, quadro iPad, tarefa e resultado de terminal. Terminal cru só é transmitido quando escolhido; notas e painel privado do apresentador ficam fora do palco.

**Direção:** no terminal, a pessoa pode pedir “mostre o mapa”, “foque esta etapa”, “monte a tabela nesta cena”, “avance” ou “registre esta decisão”. Cada pedido usa o mesmo comando da interface e aponta a cena/objeto. A plateia acompanha a mudança real; entradas de equipe podem ser permitidas por cena, com autoria.

**Transmissão:** escolher destino (janela, monitor/TV conectado ou dispositivo pareado), ver prévia, iniciar. Selo permanente de Ao vivo e botão Parar. Trocar de aba pessoal não muda o conteúdo público sem comando. Preparar uma próxima cena pode ocorrer fora do palco. Sem conexão, mostrar última atualização e tentar reconectar com estado real.

**Apresentação impactante:** enquadramentos do mapa, viagem curta entre regiões 3D, encaixe de peças e revelação do resultado; ritmo comandado pelo apresentador. Não rodar conteúdo por cronômetro arbitrário. Registrar decisões e gerar tarefas da reunião com artefatos e responsáveis. Encerrar conserva ata e roteiro.

Voz/transcrição/gravação só aparecem como conectadas quando houver implementação e sessão reais. Indicador de gravação, pausa e revisão da transcrição fazem parte do fluxo. O plano preserva a intenção de memória da sala, sem tratar simulação antiga como voz pronta.

### S12 · Babel Quadro no iPad — desenhar onde faz sentido

**Desktop:** Criar → Quadro no iPad ou abrir um quadro existente; mostrar Conectar iPad, QR/código de conexão e Abrir no iPad. Depois, visualizar, navegar, comentar, transmitir e pedir alterações estruturadas ao agente. O desenho à mão livre fica no app do iPad, como pedido.

**iPad:** proposta inicial de app web dedicado e instalável pela tela inicial. A decisão técnica depende do spike de instalação, conexão local segura e Pencil; se não sustentar a experiência, a alternativa é um invólucro nativo, com custo/limites registrados antes de escolher. Não chamar a atual rota `#ipad` de app instalado completo.

**Fluxo:** entrar como pessoa → parear dispositivo → escolher projeto/quadro → desenhar. Caneta, marca-texto, borracha, formas, texto, post-it, camadas quando necessárias, undo/redo; gesto de dois dedos navega, Pencil desenha; avaliar pressão e rejeição de palma no hardware. Barra pequena reposicionável para destros/canhotos. Autosave local, sincronização e retomada offline visíveis.

O traço aparece no desktop/palco quando o quadro está compartilhado. Sem rede, conserva o trabalho e informa a fila. Reconexão trata conflitos e autoria. Emparelhar não dá ao iPad acesso a terminais ou sessão pessoal inteira do anfitrião.

### S13 · Biblioteca — aproveitar o que já foi construído

Materiais, Modelos, Prompts, Aprendizados e Extensões. Busca universal com fonte, projeto, autor e última revisão; alternar texto/semelhança só quando disponível. Um resultado abre a fonte, não uma afirmação sem origem.

Salvar uma página, uma Máquina ou processo como modelo guarda arquivos necessários, dependências, versão e prova de uso. “Usar no projeto” mostra o destino. Conhecimento novo dos agentes preserva resposta pública, fontes, limitações e correções; não arquiva credenciais, WhatsApp privado ou raciocínio interno do provedor.

Resumos/“sonhos” podem continuar como reflexão da equipe, com fontes e status real de geração. A Loja fica em Extensões, distinguindo disponível, configurado e instalado de verdade.

### S14 · Aprender — escola de programação com IA

Trilhas de construção: primeiro projeto, pedir e conferir, arquivos e versões, montar página, dados e Máquina, colaboração, apresentação e publicar. Cada missão produz algo útil no próprio projeto ou num espaço de prática que a pessoa escolhe.

Três intensidades de ajuda: Guiado, Autônomo e Avançado. Não ocultar potência permanentemente nem obrigar uma aula para usar um recurso. No contexto: “Explicar esta peça”, “Mostrar o código”, “Por que falhou?”, “Tentar comigo”. A pessoa pode sair da ajuda e voltar sem perder trabalho.

Progresso mostra construções, conceitos praticados e evidência. Selos celebram capacidade adquirida, contribuição e cooperação; sem ranking de velocidade ou horas. Uma revisão humana ou verificação real fecha a missão. A IA não declara domínio da pessoa só porque escreveu o código por ela.

### S15 · Preferências, equipe e Oficina

Preferências: aparência Tech/Vibe, som/movimento, atalhos, notificações, conexões de agentes, dispositivos, armazenamento/sincronização e atualizações. Não transformar configurações técnicas em páginas obrigatórias da jornada comum.

Equipe: convidar, perfis, presença, disponibilidade, ajuda e mapa de colaboração. Horas individuais permanecem no escopo permitido; Transmitir mostra o público real. Oficina conserva permissão de alterar o app, alterações pendentes, prévia, versão e publicação/atualização com estado verdadeiro. Ajustar potência do agente não libera Oficina.

### S16 · Companheiros de construção

Escolher entre cinco pets iniciais com corpos, gestos e estados próprios; ampliar a coleção a 30. Alegria, tristeza, ação e sono respondem a acontecimentos e interação. Pet, identidade, ferramenta e modelo são escolhas distintas. Direção, catálogo e pipeline: [Pets 3D](PETS-3D-E-TERMINAIS.md).

### S17 · Espelho do Criador

Página modular para apresentar e operar o corpo do agente. Mapa explorável de Perceber/Lembrar/Agir/Conferir/Evoluir; módulos com função/estado/prova; distribuições; versões; relato de erros. A composição pública vira apresentação. Entrada em Agentes → Espelho e Biblioteca → Criador; sem novo destino permanente na barra. [Especificação completa](CRIADOR-E-VYRA.md).

### S18 · Laboratório Vyra

Área secundária do Espelho/Preferências: ativação assistida por Gemma‑Vyra, substrato de toda a atividade, conhecimento, exemplos, avaliação e versões candidatas. Vyra tem modo Solo, sem exigir as outras três IAs abertas. Dependência de Gemma permanece explícita até o marco de independência demonstrado. Arquitetura sem Python e comparações de potência/leveza em [Criador e Vyra](CRIADOR-E-VYRA.md).

### S20 · Laboratório de Agentes — validar antes de entregar

Bancada para qualquer agente do catálogo, separada do laboratório de pesquisa da Vyra. Escolher uma versão candidata e uma cópia isolada do projeto; testar por conversa humana ou IA × IA; revisar cenários repetíveis, permissões, transcript, chamadas de ferramenta, diff, falhas e métricas disponíveis; corrigir/repetir ou propor piloto delimitado. IA desafiante procura lacunas; IA revisora compara provas com a régua, mas não aprova sozinha. A decisão de disponibilizar a versão fica com uma pessoa responsável. Maquete e fluxo detalhados em [Laboratório de Agentes](LABORATORIO-DE-AGENTES.md).

## 5. Jornada completa: Theus + duas pessoas

Ana e Bruno são nomes fictícios para exemplificar os papéis.

| Passo | Theus | Ana | Bruno | Continuidade garantida |
|---|---|---|---|---|
| 1. Começar | Cria projeto “Órbita”, objetivo e mapa; convida | Entra na equipe e no projeto | Entra na equipe e no projeto | Mesmo ID de projeto, pessoas identificadas |
| 2. Organizar | Converte ramos em tarefas; define resultado e etapas | Assume interface | Assume dados/Máquina | Todos veem dependências e próxima entrega |
| 3. Construir | Especifica e acompanha a visão geral | Terminal próprio + agente + página | Terminal próprio + agente + mundo 3D | Cada sessão sabe projeto, tarefa e arquivos |
| 4. Ajudar | Recebe menção vinculada à integração | Abre peça do Bruno em leitura; pede ajuda | Mostra seu terminal; concede controle quando necessário | Contexto compartilhado sem recontar tudo |
| 5. Integrar | Usa segundo agente para revisar mudança delimitada | Entrega interface com prova | Entrega endpoint/dados com prova | Conflito detectado; integração explícita |
| 6. Apresentar | Abre Reunir, monta cenas e transmite | Mostra fluxo pela página | Demonstra execução real da Máquina | Terminal comanda palco; decisões viram tarefas |
| 7. Sair | Deixa checkpoint e próximo passo | Fecha app com rascunho preservado | Desconecta e conserva alterações locais | Processos encerrados identificados; nada finge estar rodando |
| 8. Voltar | Continua da cena/tarefa pendente | Retoma arquivo, seleção e conversa | Retoma câmera, peça e contexto do agente | Sincroniza e resolve conflitos antes de sobrescrever |

### Jornada livre → projeto

Criar mapa em Livre → experimentar página/Máquina → escolher “Levar para projeto” → nomear projeto e convidar → preservar arquivos e referências → dividir tarefas. Não exigir que a pessoa decida a estrutura final antes de pensar.

### Jornada aprender → fazer → ensinar

Escolher uma missão → construir peça real com apoio → abrir código e resultado → obter evidência → salvar aprendizado/modelo → apresentar à equipe → outra pessoa reutiliza com origem. O produto cresce em repertório compartilhado.

## 6. Palavras, símbolos e ações

| Hoje / problema | Proposta | Contexto |
|---|---|---|
| Tela da TV | Transmitir | Ação global; destino escolhido depois |
| Projetar na TV | Transmitir este arquivo/mapa/quadro | Objeto selecionado |
| Nova demanda | Nova tarefa | Migração mantém registros e semântica de aprovação |
| Pronta | Entregar para revisão | Quem executou entrega; quem revisa aprova |
| Esperando meu OK | Para revisar | Meu dia/Tarefas |
| Tarefas livres | Disponíveis | Filtro de tarefas |
| Entrar em… | Ver terminal de… / Pedir controle | A ação deve dizer o que concede |
| Presença | Conversa com [agente] dentro da experiência Presença | A marca pode continuar; o modo precisa ser compreensível |
| Potência | Modelo + Esforço | Capacidade real, separada de permissões |
| Neon | Efeitos da presença | Preferências; não ocupa comando principal |
| Nota / Markdown / TXT como ícone | Documento com ícone; extensão em detalhe | Criação e árvore |
| Copy / Print inteiro | Textos / Capturar página | Navegador; termos técnicos preservados no modo avançado se úteis |
| Salvo na equipe | Salvo neste computador / Sincronizado com a equipe | Cada estado precisa corresponder à confirmação recebida |
| Explicações permanentes | Ajuda contextual ou preferência | Informação aparece quando muda uma decisão |
| Recurso não implementado com botão de sucesso | Estado real com próxima ação válida | Conexões, voz, instalação e compartilhamento |

**Ícones:** família SVG coerente, grade de 24 px e traço óptico consistente; alvos de 40–44 px mesmo quando desenho é menor. Tarefas usa colunas com cartões/checagem, substituindo o símbolo atual de Trabalho. Mapa usa nó e ramos; Máquina usa peças conectadas; Transmitir usa tela com sinal; Navegador usa globo; Quadro usa folha e caneta; Documento usa folha; agentes usam presença distinta de pessoa.

Ícone não substitui nome em entrada primária. Estados não dependem só de cor. Evitar emojis e siglas como família misturada de navegação. Tooltips têm nome e atalho; seleção, foco, desabilitado, erro e carregamento têm desenho consistente. A revisão cobre também menu de contexto, diálogo, toast, mensagem vazia, arrastar, atalho e descrição acessível de cada controle do inventário.

## 7. Direção visual, movimento e som

### Linguagem visual

Tech: profundidade escura, contraste legível, materiais de construção e luz pontual nas ações. Vibe: superfície clara quente, relevo/sombra discretos, mesmo significado de cores e mesmo espaço útil. Tipografia humana na navegação, mono em código/dados, títulos com identidade sem competir com o objeto. Menos molduras vazias; mais área para resultado. O `b` permanece identidade e pode pulsar conforme preferência já registrada, respeitando redução de movimento.

### Gramática de acontecimentos

| Acontecimento verdadeiro | Movimento proposto | Som proposto | Informação permanente |
|---|---|---|---|
| Peça criada e confirmada | Volume se forma e encaixa no lugar | Toque material curto com nota de confirmação | Nome, autor, estado, abrir origem |
| Conexão válida | Fio percorre origem → destino; portas assentam | Dois timbres que convergem | Tipo, direção e resultado |
| Execução real | Pulso atravessa apenas o trajeto executado | Motivo curto opcional; agrupar eventos rápidos | Log/resultado e duração medida |
| Ajuda/handoff aceito | Caminho liga tarefa à pessoa; avatar recebe contexto | Sinal cooperativo suave | Próximo responsável e etapa |
| Etapa/entrega concluída | Revelação do artefato e assinatura da construção | Acorde curto reconhecível | Prova e próximo passo |
| Falha | Peça retém foco e mostra ponto de interrupção | Sinal curto sem alarme agressivo | Mensagem e ação de recuperação |
| Apresentação muda de cena | Enquadramento com continuidade espacial | Transição opcional controlada pelo apresentador | Título/cena e estado ao vivo |

Interações comuns começam a responder imediatamente; transições de interface têm referência inicial de 120–250 ms. Celebrações especiais podem durar aproximadamente 1–2,5 s, são interrompíveis e não bloqueiam a próxima ação. Esses valores são propostas para experimentar, não desempenho medido.

**Som:** amostra acionada pela pessoa, volume global e categorias; perfis Imersivo, Estúdio e Silencioso; saída de apresentação separada quando suportada. Nenhum som por tecla. Agregar rajadas de eventos; reduzir música/efeito quando há fala; um evento significativo não dispara dez sons. Todo estado sonoro tem equivalente visual.

**Qualidade:** orçamento medido de frames/CPU/memória, pausa fora de foco, qualidade adaptativa e movimento reduzido independente do tema. Isso permite investir em momentos memoráveis sem manter a máquina ocupada por enfeites em repouso. Não se usa o antigo teto fixo de partículas como substituto de projeto e medição; qualquer teto definitivo vem das evidências no hardware.

## 8. Comando universal: interface e agente no mesmo contrato

Cada ação recebe um ID, entradas tipadas, pessoa/projeto/objeto, capacidade necessária, pré-condições, resultado, evento de progresso e reversão quando aplicável. O botão, a paleta, o terminal `coop` e o agente chamam essa ação comum.

Cobrir criar/editar/mover/abrir artefato; tarefas/etapas; chat solicitado; configuração de agentes permitida; mapa; peças e ligações da Máquina; navegador; WhatsApp solicitado; reunião/cenas/transmissão; quadro; biblioteca/modelos; aprendizado; configurações e Oficina dentro da permissão da pessoa.

O agente consegue manipular um quadro por comandos estruturados; desenhar com Pencil continua sendo uma interação física. Escanear QR, conectar um dispositivo e decisões de autenticação podem exigir a pessoa. A interface deixa clara a etapa humana em vez de inventar uma automação concluída.

Seleção e comandos têm escopo explícito. Texto de uma página/arquivo recebido não se torna autorização para o agente. Ação externa ambígua produz rascunho ou revisão; uma instrução explícita já autorizada não pede confirmação repetida sem motivo. Efeitos e histórico consomem os mesmos eventos de sucesso/erro do executor.

## 9. Estados transversais e critérios de qualidade

Todas as telas relevantes têm: primeiro uso, vazio útil, carregamento, erro recuperável, offline, reconectando, conflito, só leitura, trabalho pendente e conclusão com evidência. Rascunho nunca some por trocar de painel. A busca sabe diferenciar objeto ausente de falta de acesso/conexão. Desfazer não promete reverter uma mensagem externa já enviada nem operação irreversível no banco.

Metas propostas para avaliar com pessoas reais:

- A pessoa identifica projeto, tarefa, arquivo e responsável sem explicação verbal.
- Do projeto aberto, chega a arquivo, tarefa, conversa ou terminal em até duas ações usuais.
- Mapa/Máquina ocupam toda a área de construção; controles sobrepostos não cobrem o objeto selecionado.
- Pedido longo cabe no compositor; contexto e envio não competem pela largura do texto.
- Sair e voltar recupera o posto; perdas/conflitos são detectados e apresentados.
- Três pessoas entregam uma etapa de ponta a ponta, inclusive uma ajuda remota e uma revisão.
- Apresentação mostra exatamente o conteúdo escolhido e para ao comando; quadro funciona em iPad real.
- Cada celebração aponta para um evento verdadeiro; silêncio e redução de movimento conservam a informação.

São critérios de aceite futuros. Não são resultados obtidos nesta análise. A ordem de execução e a evidência exigida estão no [TODO](TODO.md).
