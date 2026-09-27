# Plano V3 · a Estação que se constrói pelo terminal

**Objetivo:** consolidar a estação da v1 com o fluxo e os critérios de trabalho da v2, sem apagar capacidades nem deixar a experiência vazia. A V3 é uma proposta de design para discussão; não é implementação do Babel Coop.

**Fontes comparadas:** [UX V1](../../UX.md), [proposta de estação e terminal](../design/PLANO.md), [terminal e presença](../design/TERMINAL_2030.md), [peneira de duplicações/capacidades](../UX_PENEIRA.md) e [UX Potência V2](PLANO-DAS-TELAS.md), incluindo seus requisitos e aceites.

**Maquete:** [abrir o design navegável V3](PLANO-V3-VISUAL.html). A maquete reutiliza as telas de proposta existentes, demonstra o terminal universal fixo à direita e mostra a sequência de pastas no espaço de Projetos. Dados e comandos são exemplos; nada é executado no app.

## 1. Auditoria entre as duas versões

| Área | V1 · UX e estação | V2 · UX Potência | Decisão V3 |
|---|---|---|---|
| Estrutura | Casca estilo IDE: barra de atividades, contexto à esquerda, trabalho no centro e agentes/terminal à direita | Navegação enxuta; projetos e tarefas viram eixo do trabalho | Manter a casca permanente da v1 e usar projeto/tarefa da v2 como contexto que acompanha cada tela |
| Terminal | Fixo à direita, multiagente, comandos para o app e resultado integrado à saída | Terminal é um modo/painel acessível; ação comum entre botão, paleta, `coop` e agente está descrita | Terminal aberto à direita sempre; além de shell e agentes, vira a entrada universal para navegar e operar o app |
| Organização | 12 áreas de uso, algumas duplicadas; pessoas, equipe e atividade visíveis | 21 vistas, 79 requisitos e tarefas com dependências e aceites | Preservar todas as capacidades; agrupar duplicações sem enterrar os caminhos de uso |
| Continuidade | Arquivos ao vivo, ajuda remota, terminal compartilhado, TV e memória da sala | Projeto, tarefa, artefato, autoria, estado, retomada e revisão conectados | Ligar cada comando/terminal a pessoa, projeto, tarefa e artefato, mantendo dono, sessão e máquina explícitos |
| Agente | Nome/foto, receitas contextuais, ações na saída e ajuda para entrar no terminal de alguém | Provedores/modelos/esforço, sessões próprias, cooperação, interrupção e limites | Presença reconhecível + capacidades reais; cada aba tem identidade, terminal, contexto, estado e botão Parar |
| Interface | Rica, viva e próxima de uma IDE; também repete ferramentas/explicações e deixa consentimento desigual | Fluxo mais claro, menos duplicação, bons estados e critérios; algumas capacidades ficam implícitas ou escondidas | Reduzir repetição, não potência: densidade em camadas, funções encontráveis e tela central rica |
| Imersão | Efeitos, peças, TV e presença conectam acontecimento e espaço | Direção visual, som e eventos reais foram especificados, mas a maquete parece mais calma e editorial | Mundo de trabalho com resposta visual forte, amarrada a ação comprovada, sem partículas decorativas ou sucesso falso |
| Governança | Confirmação simples, ajuda e identidade; cobertura varia conforme ação | Ação tipada, autorização, reversão, estado e evidência são princípios | Um registro de ações comum governa botão, terminal, atalho, agente e MCP; a interface mostra prévia/resultado reais |

### O que a V2 limpou demais

O diagnóstico da V1 identificou 16 atividades, repetição de caixas e listas, muitas receitas fixas, explicações de protótipo e itens demais no rodapé. A redução e a fusão eram necessárias. Mas esconder entradas como Trabalho, Terminais, Equipe, TV, Loja, Oficina, Perfil, Metas, Memória e presença pode fazer parecer que a capacidade sumiu. Na V3, essas funções têm endereço permanente ou contextual com rótulo e atalho; não dependem de adivinhar um menu.

Também ficou faltando uma regra de produto forte: o terminal não é uma tela opcional do agente. Ele é a coluna de operação de toda a Estação. Os modos do mapa/Máquina podem ampliar o canvas central, mas não expulsam o terminal direito.

## 2. Anatomia permanente da Estação

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ b  babel-coop · Projeto ▾   Buscar / comandar Ctrl K     Criar  TV  equipe  perfil│
├────┬───────────────┬─────────────────────────────────────┬──────────────────────┤
│    │ CONTEXTO      │ ÁREA DE TRABALHO                    │ ESTAÇÃO DE COMANDO   │
│    │ Projeto       │ abas: página · mapa · tarefa        │ Meu terminal         │
│    │ arquivos      │                                     │ agentes: Codex · ... │
│nav │ pessoas       │ resultado/código/mapa/mundo/reunião │ modo: App/Shell/IA   │
│    │ tarefa atual  │ efeitos ligados ao evento real      │ saída, prova, estado │
│    │ atividade     │                                     │ prompt universal    │
├────┴───────────────┴─────────────────────────────────────┴──────────────────────┤
│ estado da conexão · tarefa/foco · sincronização · sala · transmissão · atalhos  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

- **Direita, sempre presente:** coluna de comando entre 320 e 520 px, redimensionável e aberta por padrão. Não some em mapas, Máquina, navegador, laboratório ou apresentação. Em foco imersivo, a área central ocupa todo o espaço restante; o terminal continua à vista.
- **Ação temporária:** recolher reduz a coluna a uma lingueta de 44–52 px com estado e comando rápido, sem removê-la da casca. `Ctrl` + acento grave alterna largura; `Ctrl+Shift` + acento grave amplia a área central mantendo acesso ao terminal. No celular, o painel vira uma superfície fixa inferior com alternância explícita, pois a largura não comporta duas colunas.
- **Esquerda, em duas camadas:** barra principal compacta com Meu dia, Construir, Trabalho, Conversas, Agentes/Terminais, Projetos, Biblioteca/Aprender, Equipe e Mais. A coluna de contexto abre o conteúdo do destino: árvore, membros, metas, projetos, reuniões, acervo e preferências. Os caminhos menos frequentes ficam no grupo Mais com nomes visíveis e busca.
- **Centro por abas:** cada arquivo, mapa, tarefa, conversa, Máquina e área imersiva é reabrível, endereçável e mantém estado. Abas agrupam por projeto e mostram salvamento/conflito sem duplicar cabeçalhos.
- **Topo persistente:** projeto/Livre; busca e comando; Criar; transmissão/TV; pessoas e notificações; perfil e tema Tech/Vibe. O cabeçalho mostra o destino atual do comando.
- **Rodapé de sinais úteis:** conexão, sincronização, cronômetro da pessoa, tarefa ativa, memória/gravação da sala, transmissão e controle remoto. Sinal aparece quando muda; contadores permanentes não competem com o trabalho.
- **Espaço de comando direito:** sessões próprias de agentes e terminais humanos são separadas por proprietário/máquina/projeto. “Ver” e “Controlar” nunca são o mesmo gesto. Pessoas podem pedir, conceder e devolver controle com identificação constante.

## 3. O terminal comanda o aplicativo

O campo de comando da direita aceita linguagem natural e comandos curtos. Ele pode abrir telas, localizar pessoas, consultar estado, criar objetos, conduzir agentes e iniciar ações permitidas. A superfície não é uma caixa de texto isolada: contém roteamento, retorno tipado, provas, interrupção e histórico.

### Três modos claramente identificados

1. **Comandar Babel** — comandos sobre o app: navegar, buscar, criar, organizar, consultar, editar, compartilhar, reunir, transmitir e aprender. É o modo padrão. Exemplos: “abra o mapa do projeto Órbita”, “crie uma tarefa para conectar as inscrições”, “mostre os limites de uso do Codex”, “leve esta página para a reunião”.
2. **Agente** — conversa e execução de uma sessão de Codex, Claude Code, OpenCode ou Vyra. A mensagem fica ligada à pessoa, tarefa, projeto e artefatos selecionados. Exemplo: “revise o formulário e proponha o menor ajuste; pare antes de publicar”.
3. **Shell** — terminal nativo para comandos do sistema e ferramentas CLI, em sessões PTY independentes. O diretório e a máquina aparecem no cabeçalho. Exemplo: `npm run dev`. O app não interpreta um pedido de Babel como shell, nem executa código bruto no modo Comandar Babel.

Os três modos compartilham uma coluna direita, histórico consultável e atalho de foco. A aba ativa e o destinatário ficam sempre visíveis. “Meu terminal” mantém o terminal humano; cada agente tem sua sessão. Ação da interface que cria/abre/edita uma tela também pode ser iniciada pelo modo Comandar Babel.

### Caminho obrigatório de uma ação

```text
entrada → intenção e destino → ação tipada → checagem de capacidade/acesso
       → prévia se houver ambiguidade/impacto → execução → prova/estado → desfazer ou próximo passo
```

1. Resolver intenção e contexto atual (projeto, pessoa, tarefa, objeto, agente e ambiente).
2. Chamar a mesma ação tipada usada pelo botão, paleta, `coop`, API de agente ou MCP; não criar uma implementação paralela para linguagem natural.
3. Checar conexão, identidade, permissões, escopo e pré-condições. Se faltar destino ou houver mais de um resultado plausível, perguntar dentro do terminal e preservar o rascunho.
4. Ações de leitura/baixo impacto mostram resposta direta. Escrita local mostra plano conciso. Exclusão, publicação, mensagem externa, controle de sessão alheia e operação irreversível exigem prévia clara e aceite apropriado.
5. Registrar pedido, ação, autoria, destino, mudança, resultado, erro, tempo e prova. Mostrar “desfazer” somente quando a ação puder ser realmente revertida.
6. Oferecer Parar durante execução, fila dos próximos passos, intervenção humana e retomada do contexto.

### Cobertura mínima do comando Babel

- **Ir e localizar:** abrir qualquer vista/aba/objeto, trocar projeto, focar elemento, encontrar responsável/estado, navegar de resultado a origem.
- **Criar e organizar:** projeto, tarefa, etapa, documento, página, mapa, Máquina, pasta, reunião, modelo e conversa; escolher destino explicitamente.
- **Construir e conferir:** alterar objeto/código via agente, visualizar diferença, executar caso de teste, consultar saída, ligar página/dados, abrir navegador na mesma sessão e pedir revisão.
- **Trabalho e equipe:** cronômetro, demandas/tarefas/metas, fila de revisão, pedir ajuda, abrir/observar/pedir controle de terminal, devolver, convidar e encaminhar.
- **Conhecimento:** buscar no acervo, consultar memória/ideias/aprendizados, guardar uma ideia falada ou preparar ata conforme a configuração de privacidade.
- **Apresentar:** preparar cena, abrir TV/projeção, escolher destino, mudar tema e encerrar. Preparar não transmite sozinho; janela da TV continua sem controles.
- **Agentes e oficina:** escolher ferramenta/modelo/esforço disponíveis, parar/retomar, testar candidata no laboratório, inspecionar versão e preparar mudança do app conforme acesso concedido.
- **Acompanhar uso:** abrir limites da conta e tokens/contexto/custo do agente quando a fonte reportar. Dado indisponível ou estimado é rotulado; nunca inferido como valor real.

Para ações demais para uma frase, o terminal apresenta passos tipados e editáveis. “Faz o lançamento inteiro” pode propor página, tarefas, cronograma, peça de dados e cena; a pessoa escolhe o que prossegue. Pedido não vira permissão global.

## 4. Organização completa de capacidades

| Área permanente V3 | Reúne e preserva da V1 | Incorpora e organiza da V2 |
|---|---|---|
| Meu dia | entrada rápida, pendências, check-in, contribuição, ajuda | continuar de onde parou, resumo sem repetir listas, estado e próxima ação |
| Construir | Criar, árvore, arquivos de todos, tela, código, 3D, editar na tela | abas por artefato, salvamento/conflito, contexto do projeto e resultado |
| Trabalho | demandas, tarefas, metas, cronômetro e OK | projeto → etapas → dependências → revisão → entrega com autoria/prova |
| Agentes e Terminais | nomes/fotos, receitas, terminal direito, parede ao vivo, entrar/chamar/ajudar | ferramenta/modelo/esforço, sessões duráveis, colaboração delimitada, controle seguro |
| Projetos | pastas por pessoa, membros, arrastar/entregar arquivo, voz e canal | objetivo, modelos de projeto, visão geral, artefatos compartilhados e conclusão |
| Conversas | chat, WhatsApp e reunião, ideias faladas e memória da sala | canais vinculados a projeto/tarefa, privacidade, estados de envio, pauta e ata |
| Criar | Tela, Máquina, Pesquisa, mapa, presets | seis objetos primários, destino visível, fluxo comum e criação por terminal |
| Navegador | pessoa e agente compartilham aba; Raio-X e captura | múltiplas sessões, inspeção estrutural/visual, evidência, controle coordenado |
| Máquina e Mapa | Máquina como jogo de montar; MindForge; presets e objetos com origem | 2D/3D equivalente, dados reais separados de layout, undo, execução e estado |
| TV e palco | TV espelho sem botão, cenas, parede viva, placar, visitas | transmissão explícita, preview/destino, reunião com decisão e parada |
| Biblioteca e Aprender | Acervo, Inteligência, sonhos, prompts e perfil/gamificação | fontes, aprendizados confirmados, trilhas ligadas ao trabalho e uso contextual |
| Equipe | pessoas, ajuda, presença, mapa/fluxo, cores e permissões | identidade, carga/estado real, consentimento, projeto e métricas com escopo |
| Loja e Oficina | instalar/publish skills/plugins/MCP/agentes; evoluir próprio app | versões, capacidades, prévia, permissão e recuperação antes de publicar |
| Quadro no iPad | desenhar com Pencil no app próprio e projetar | pareamento e vínculo de projeto, quadro visualizável no desktop |
| Presença e jogo | pets, estados, brilhos, sons, animações e progressão | contexto, redução de movimento, efeitos baseados em eventos e desligamento |
| Laboratórios | histórico e ciclos de melhoria de agentes | Lab de Agentes pré-entrega (S20) e pesquisa Vyra (S18) com finalidade distinta |

Uma fusão de navegação muda o endereço, não apaga o comportamento. Demandas e tarefas usam Trabalho; Meu dia mostra um resumo com caminho à fila completa. Ideias têm casa em Biblioteca; sala e reunião oferecem atalho. Memória pessoal, da equipe e conteúdo público têm visibilidade separada.

### Sequência de pastas do projeto no Babel Coop

Dentro de cada projeto, a árvore de pastas segue a jornada de trabalho. São espaços lógicos da interface, com modelos e filtros; a pessoa pode renomear, mover e criar pastas sem o app impor uma estrutura rígida. “Recentes” e “Tudo” continuam disponíveis para quem prefere não navegar pela sequência.

```text
Projeto/
├── 00 · Visão geral/             objetivo, pessoas, estado e próximos passos
├── 01 · Planejamento/            etapas, tarefas, decisões e cronograma
├── 02 · Construção/              telas, documentos, código, mapas e Máquina
├── 03 · Equipe/                  conversas, reuniões, pedidos de ajuda e quadro
├── 04 · Laboratório de IAs/      candidatas, cenários, execuções e relatórios
├── 05 · Verificação/             testes, revisões, evidências e aceite
├── 06 · Entrega/                 versões, publicação, apresentação e notas
├── 07 · Conhecimento/             fontes, aprendizados confirmados e referências
└── 99 · Arquivo/                  material encerrado, pesquisável e recuperável
```

A sequência recomendada é **Visão geral → Planejamento → Construção → Laboratório de IAs → Verificação → Entrega → Conhecimento → Arquivo**. Equipe e conversas ficam acessíveis em todas as etapas. O Laboratório pode ser aberto a partir da pasta 04 ou pelo comando/atalho global; seus dados de teste não se misturam aos artefatos ativos do projeto. A pessoa define se um relatório aprovado vira evidência em Verificação e se uma versão liberada segue para Entrega.

Essa é a organização das pastas que a equipe vê dentro do produto, não uma instrução para mover diretórios do repositório. A estrutura real do repositório continua intacta; qualquer proposta de reorganizá-la precisa de um inventário e plano de migração próprios para preservar caminhos, histórico e dados.

### Mapa de pastas do repositório atual

O check local encontrou código do app em `app/`, experimento visual em `prototipo/`, documentação em `docs/`, memória de equipe em `memoria/`, materiais do agente em `agente/` e missões/evidências em `.deus/`. Esta ordem é um mapa para encontrar as coisas, não uma solicitação de migração:

```text
babel-coop/
├── app/         produto Electron: interface, servidor, navegador, scripts e testes
├── prototipo/   experimentos de experiência e telas demonstrativas
├── docs/        produto, arquitetura, pesquisa e planos (inclui ux-potencia/)
├── memoria/     decisões, histórico, projetos e relatórios da equipe
├── agente/      instruções, planos, entregas e material do Dominic
├── .deus/       missões, registros e evidências de execução
└── raiz/        contratos e comandos do projeto, como package.json e A-FAZER.md
```

Para não confundir as duas estruturas: a árvore acima descreve o repositório existente; a árvore “Projeto/” descreve como uma equipe poderia organizar o trabalho dentro da interface do Babel Coop. O que está no repositório deve continuar onde está nesta proposta.

## 5. Jogo de telas: imersão com orientação

O jogo vem do ciclo **intenção → comando → construção → descoberta → prova → próxima etapa**, não de pontuação decorativa.

- A moldura espacial conserva direção: projetos são mundos; tarefas são missões; artefatos e integrações são peças; reuniões são palco; terminal é o painel de comando que nunca sai da estação.
- Cada vista tem objeto central, ferramentas próprias e sinais do estado. O mapa é navegável; a Máquina deixa encaixar/conectar; a página responde; a missão revela próximos passos; a sala ganha forma enquanto a equipe trabalha.
- Efeito visual ou sonoro nasce somente de evento real: arquivo salvo, comando executado, conexão comprovada, agente esperando, revisão aceita, transmissão iniciada. Falha interrompe a trilha e abre recuperação; sucesso sempre liga a prova.
- Progresso mostra dependências, autoria, eventos e próximo destinatário. Pontos/níveis do perfil vêm de resultados aceitos, ajuda e aprendizado reutilizável, não de cliques, tokens, tempo conectado ou atividade sem contribuição.
- Densidade em camadas: ações frequentes e estado à vista; filtros, ferramentas técnicas e configurações em painéis contextuais; sem telas vazias artificiais ou explicações repetidas. Modo Guiado ensina junto da construção; Avançado deixa o terminal comandar diretamente.
- Transições têm continuidade espacial entre objeto e projeto. O ponteiro pode reagir a uma construção, mas nunca imita ação humana nem oculta onde está o controle.
- Tech/Vibe mudam material e atmosfera, não posição, semântica ou acesso. Movimento reduzido, silêncio, pausa quando sem foco e TV muda permanecem disponíveis.

## 6. Jornadas que comprovam o fluxo

### A. A pessoa constrói a partir do terminal

Seleciona o projeto → digita “abra o formulário e a tarefa de inscrições” → app abre ambos e aponta vínculos → muda para modo Agente e descreve resultado → agente apresenta plano/arquivos → pessoa aprova a execução → terminal mostra progresso real e efeito de peça no centro → diff/testes reais aparecem → pessoa envia para revisão → responsável aceita ou pede ajuste.

### B. A pessoa sem conhecimento técnico pede ajuda

Está no objeto → “quero que funcione” → agente identifica qual teste falhou e pergunta quando a intenção estiver ambígua → pode executar diagnóstico de leitura → mostra erro com explicação e caminhos (tentar, pedir ajuda, fazer junto) → pedido de ajuda abre a mesma tarefa/terminal para o colega → selo de controle aparece → colega devolve o terminal com causa/evidência.

### C. O agente passa pelo laboratório antes de chegar à equipe

Responsável seleciona candidata e fixture → conversa humana percorre cenários → execução termina e preserva transcript/diff/uso real → teste IA × IA desafia e revisa casos selecionados → rubrica aponta falhas e cobertura → agente corrige versão candidata → repetir mesma bateria → responsável autoriza piloto para projeto/grupo delimitados → acompanhar e revogar com retorno para versão anterior.

### D. A equipe apresenta o trabalho

No terminal: “prepare a reunião com o mapa e a página” → app propõe sequência editável → pessoa confere TV/destino/privacidade → iniciar publicação → cenas reais e autoria aparecem → terminal continua à direita para conduzir perguntas/comandos → encerrar transmite estado final e decisões para tarefas.

## 7. Estados, segurança e honestidade

- Mostrar identidade e máquina da sessão, terminal escolhido, ferramenta/modelo, projeto/diretório e quem está observando/controlando.
- Leitura, escrita local, execução de shell, navegação web, envio externo, transmissão e publicação são capacidades distintas. Configuração de modelo/esforço não concede acesso.
- Contexto retirado de arquivo/site/mensagem é dado a interpretar, não uma ordem autorizada. A pessoa vê o que o agente consultou e o que pretende fazer antes de uma ação sensível.
- Cada execução pode estar em: preparando, executando, esperando pessoa, concluída com prova, falhou com recuperação, parada ou desconectada. Sem estado sintético de sucesso.
- Percentuais/limites/tokens/custo só são mostrados com fonte e escopo; métricas ausentes mostram “não fornecido”. Histórico local de uso não é enviado ao restante da equipe por padrão.
- Cada tela contempla vazio, carregamento, offline, erro, conflito, só leitura, retomada, permissões negadas e dados desatualizados.
- Undo é específico ao tipo de operação. Mensagem externa, publicação ou migração pode não ser reversível; nesse caso o sistema mostra o limite antes da execução.
- Barreira de transmissão identifica público, objeto e estado; o painel privado do usuário e segredos não entram no palco.

## 8. Check de integridade: nada importante sumiu

Antes de decompor implementação, manter rastreio de cada requisito da v1, v2, complementos e decisões posteriores. A auditoria não marca proposta como pronta e não converte em implementação sem concordância explícita.

| Família da V1 | Checagem V3 |
|---|---|
| 12 atividades e paleta Ctrl+K | Endereço principal/secundário, busca e comando Babel chegam a cada uma; recursos frequentes não dependem só da paleta |
| Agente com nome/foto, receitas, desfazer e terminal da equipe | Identidade, chips contextuais, ações tipadas, Parar, recibo e observação/controle explícitos |
| Parede de terminais e pedido/chamada de ajuda | Grade ao vivo, erro/parada contextual, privacidade e controle com dono |
| Projeto com arquivos/pessoas/canal/quadro/voz | Mesmo contexto e autoria; cada objeto tem endereço e a árvore não duplica |
| WhatsApp, memória da sala e ideias faladas | Conversa selecionada; conteúdo privado separado; gravação/pausa/retensão configuráveis; nada é republicado por padrão |
| TV espelho, Loja, perfil, metas, Oficina, iPad | Destino e responsabilidades com caminho na navegação e nos comandos; módulos separados quando a regra de acesso difere |
| Tela/Código/3D, Máquina/MindForge, presets | Resultado, código e geometria conectados; 2D acessível; estado “planejado/criado/executado” verdadeiro |
| Pets, cor por pessoa e efeitos | Preferência pessoal, leitura por forma/nome, eventos verdadeiros, redução de movimento e nenhum som de tecla |
| 21 vistas e 79 requisitos da V2 | Preservar links e aceites; mapear qualquer item fora da navegação principal para contexto específico sem removê-lo |
| R80–R83 e UX-134–UX-139 | Terminal direito sempre aberto; métrica Codex honesta; comando universal; Laboratório humano + IA×IA separado do Lab Vyra; preservação da imersão |

## 9. Critérios de aceitação do design

- Terminal permanece visível à direita em Meu dia, Construir, conversas, mapa, Máquina, navegador, reunião e laboratório.
- Uma pessoa abre e opera uma capacidade por botão, paleta ou terminal e chega ao mesmo resultado/estado registrado.
- Comandos cobrem todas as famílias de ação mapeadas, com ambiguidade, permissão, prévia, erro e reversão definidos.
- Pessoa consegue alternar entre projeto, artefato e tarefa sem perder rascunho, sessão ou diretório do terminal.
- Controle de terminal alheio é identificado, autorizado e encerrável pelo dono.
- Uma candidata testada em laboratório é distinguível da ativa; testes são repetíveis e não alteram produção.
- Efeitos imersivos têm referência a evento/resultado e podem ser percebidos sem cor ou som.
- Teste de compreensão com pessoas técnicas e não técnicas cobre descoberta de Trabalho, TV, Equipe, Biblioteca, terminal e comandos principais.

## 10. Próxima etapa do plano

1. Revisar este check e a maquete V3 como uma direção única.
2. Mapear R01–R83 e UX-001–UX-139 para componentes, estados e critérios; apontar lacunas e duplicações restantes.
3. Fechar o registro universal de ações e sua lista de intents antes de construir terminal de controle do app.
4. Detalhar telas/fases verticais: casca + terminal → contexto/projetos → criação/artefatos → trabalho/equipe → agentes e laboratório → apresentação/TV → memória/biblioteca/loja/oficina.
5. Estimar somente depois de escolher a direção; manter testes funcionais e integração fora desta maquete.

**Resultado deste documento:** a v1 fornece a estação e a potência visível; a v2 fornece o fluxo e os aceites; a V3 preserva ambos, acrescenta terminal como controle permanente e dá de volta densidade, presença e progressão. É o design completo para revisão, ainda não a especificação final aprovada nem a implementação.
