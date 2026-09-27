# Babel Coop · V4 · estação completa, espaço bem gerenciado

26/09/2026 · [[Dominic]] · plano corrigido para orientar a implementação e a liberação. [Abrir V4](http://127.0.0.1:4790/PLANO-V4-VISUAL.html) · [arquivo visual](PLANO-V4-VISUAL.html) · [cobertura dos requisitos](CHECK-V4.md).

## 1. Decisão

Preservar a estação no estilo VS Code: atividades à esquerda, contexto recolhível, abas centrais e terminal à direita. Incorporar da V2 o contexto único de projeto, tarefa, artefato, pessoa e evidência. Organizar o espaço sem substituir o app por uma sequência de painéis de resumo.

**Cobertura de design:** todas as famílias da estação anterior, V1, V2 e complementos têm destino na V4. **Produção:** ainda não está comprovada para o escopo completo. Pareamento WhatsApp, bancada do Laboratório de IAs e edição espacial livre da Máquina têm lacunas concretas. Um plano completo não encerra essas implementações.

Esta entrega corrige o plano e sua apresentação. A V4 navegável demonstra layout, navegação, abas e cena 3D; usa projetos e valores fictícios. Não instala uma nova versão do app.

## 2. O que foi confrontado

- **Estação anterior / atual:** interface servida pelo app local em `127.0.0.1:4711`, observada em 1440×900; casca e rotas de `prototipo/estacao.js`, vistas e integrações em `app/interface/`.
- **V1:** [UX original](../../UX.md), [plano da estação](../design/PLANO.md), [terminal 2030](../design/TERMINAL_2030.md) e [peneira](../UX_PENEIRA.md).
- **V2:** [plano das telas](PLANO-DAS-TELAS.md), 79 requisitos originais/133 tarefas, complementos de 3D, projetos, Criador/Vyra, música e seleção.
- **V3:** [síntese](PLANO-V3-CONSOLIDADO.md), terminal universal, laboratório e pastas. Seu texto prometia abas/recolhimento que a maquete ainda não demonstrava.

| Família | Atual / V1 | Evolução V2 | Correção V4 |
|---|---|---|---|
| Casca e navegação | Abas, resize e recolhimento já existem; 12 atividades agrupam 16 vistas | Contexto mais claro; redução para poucos destinos | Reaproveitar a casca. Barra compacta, nomes visíveis e endereço para cada área |
| Meu dia | Listas vazias e onboarding competem com o trabalho | Retomada e próxima ação | Continuar + pendências + atividade relevante; ajuda sob demanda |
| Projetos e arquivos | Árvore de pessoas e pastas; contexto parcial | Projeto e artefato com identidade | Projeto como raiz; autoria/máquina em metadados; visão por pessoa continua disponível |
| Trabalho e metas | Demandas, tarefas e campanhas em módulos distintos | Etapas, dependências, revisão e prova | Uma entrada Trabalho com subáreas; preservar IDs e históricos durante a unificação |
| Terminal e agentes | PTY, presença, agentes, ajuda e parede; código Codex/uso presente | Modelo, esforço, sessões, cooperação e retomada especificados | Terminal direito padrão; dono, máquina, destino, Parar e Uso visíveis |
| Mapa | MindForge encaixado na estação | Canvas e apresentação | Foco central; recolher contexto e ferramentas; terminal continua disponível |
| Máquina 3D | Three.js real, câmera ortográfica e posições calculadas por índice | Mundo XYZ, execução e retomada | Editar posições/câmera; inspector sob seleção; alternar lista/grafo sem mudar identidade |
| Navegador | Integração real com entrada discreta | Navegação manual e agente na mesma sessão | Globo visível e aba normal; Raio-X temporário dentro da área central |
| Conversas / WhatsApp | Chat presente; fonte informa ausência de pareamento WhatsApp | Sessões e privacidade mais claras | Conversas com WhatsApp explicitamente listado; conexão pendente nunca ganha QR fictício |
| Reunião / TV / iPad | Palco e quadros existentes; jornadas dispersas | Destino, prévia e pareamento | Preparar na Estação, transmitir por ação explícita; validar instalação/Pencil no iPad |
| Equipe / perfil | Pessoas, disponibilidade, ajuda, metas e contribuição visíveis | Agrupamento reduziu a descoberta | Páginas próprias; nenhuma capacidade desaparece em “Mais” |
| Acervo / aprender / loja | Acervo, inteligência, ideias, prompts e extensões | Origem, modelos e trilhas | Biblioteca preserva busca/sonhos/ideias; Loja conserva instalação e versões |
| Oficina / ajustes | Módulos e integração presentes em fonte | Prévia, acesso, pacote e recuperação | Página dedicada; versão instalada, candidata e retorno identificados |
| Laboratórios | Bancada pré-entrega não encontrada nas integrações consultadas | Complemento humano + IA×IA | Laboratório de IAs e pesquisa Vyra distintos, ligados pela versão candidata |
| Criador / pets / música | Fontes e peças existentes; estados variam | Corpo, cinco pets iniciais/30 direções, player e seleção | Preservar materiais existentes, catálogo e acesso; marcar o que ainda está planejado |

## 3. Gestão inteligente do espaço

```text
atividades │ contexto ↔ │ abas do trabalho / artefato │ ↔ terminal
    58 px  │ 160–310 px │        espaço flexível      │ 280–560 px
```

- **Um conjunto de abas:** arquivo, mapa, navegador, tarefa e laboratório abrem na mesma faixa. Reabrir foca a aba existente. Fechar a aba não encerra o agente nem apaga rascunho. Abas excedentes têm rolagem e busca. Arquivo alterado sinaliza salvamento antes de fechar.
- **Contexto:** botão no topo, atalho Ctrl/⌘B e divisor arrastável. Contexto segue a atividade e o projeto; não repetir a mesma árvore dentro do editor.
- **Terminal:** aberto à direita desde a entrada. Redimensionar ou recolher é uma escolha da pessoa. Recolhido vira faixa identificada de 44 px, com restauração em um clique; sessão e pedido continuam. Abrir mapa/3D/reunião não o esconde automaticamente.
- **Foco:** amplia o centro recolhendo contexto e faixa de abas. Mantém o terminal e um caminho de volta. Escape restaura sem abandonar o artefato ou mudar câmera.
- **Ferramentas do objeto:** Raio-X, propriedades, peças e evidências ocupam uma superfície contextual central, aberta quando necessária. Evitar três inspectores competindo com o terminal.
- **Retomada:** por pessoa/projeto, guardar abas, ativo, larguras, contexto, rascunho, sessão, diretório, seleção e câmera. A maquete conserva layout/abas/pedido localmente; integração completa é critério do app.
- **Larguras menores:** reorganizar o conteúdo central em uma coluna. Desktop é o alvo desta entrega; celular não bloqueia o lançamento. A pessoa pode recolher o contexto para dar espaço ao canvas.
- **Tech/Vibe:** mesmos controles, ordem, contraste e navegação. Movimento reduzido e silêncio devem conservar a compreensão dos estados.

## 4. Todas as telas e seus destinos

| Entrada | Vistas e capacidades preservadas | Regra de UX |
|---|---|---|
| Meu dia | Retomada, caixa de entrada, revisão, check-in, contribuição, avisos, pergunta da semana | Resumo curto leva ao objeto original |
| Construir | Arquivos, Resultado/Código/Dividir, documentos, páginas, pesquisa, presets, mapa, Máquina, navegador, quadro iPad | Um artefato/aba; terminal não troca de projeto silenciosamente |
| Projetos | Livre/equipe, objetivo, membros, árvore, modelos, etapas, conclusão e arquivo | Abrir o posto de trabalho; resumo não duplica as listas inteiras |
| Trabalho | Demandas/tarefas, metas/campanhas, cronômetro, dependências, revisão e entrega | Mesma tarefa pode aparecer filtrada em Meu dia e Projeto |
| Conversas | Canal, diretas, anexos, ajuda, WhatsApp | Contexto clicável; destinatário e conta identificados |
| Agentes | Minhas sessões, terminais ao vivo, controle/ajuda, configuração, uso, laboratório, pets, Criador e Vyra | Sessão pertence a pessoa/máquina/projeto; observar não concede controle |
| Reunião | Pauta, cenas, palco/TV, direção, gravação/memória da sala, decisões e ata | Abrir/preparar não inicia transmissão ou gravação |
| Biblioteca | Acervo, ideias, fontes, modelos, prompts, aprendizados, sonhos e Aprender | Resultado abre origem; sonho mostra processo e estado reais |
| Equipe | Pessoas, perfis, disponibilidade, ajuda, metas e mapa de colaboração | Mapa de pessoas é distinto do mapa mental de artefatos |
| Loja | Skills, plugins, MCPs, agentes e configurações publicadas | Disponível, instalado, conectado e atualizado são estados diferentes |
| Oficina | Modificar app, diferenças, prévia, verificação, versões, pacote, atualização e retorno | Acesso à Oficina é independente do modelo/esforço do agente |
| Perfil / Ajustes | Contribuições, trilhas, aparência, som, movimento, atalhos, conta, dispositivos, armazenamento e conexões | Avatar abre perfil; ajustes não viram onboarding obrigatório |

As 30 vistas da maquete incluem as 22 da V3 e oito destinos explícitos: Equipe, Metas, Loja, Oficina, Perfil, Preferências, Uso/métricas e Terminais ao vivo. São vistas de proposta; o número não indica 30 módulos de produção concluídos.

## 5. 3D, mapa, presença e palco

**Máquina:** preservar os corpos e modelos locais existentes. O problema é a edição do espaço e o vínculo com a execução. A V4 demonstra câmera orbital, zoom, deslocamento, seleção por clique, arrasto de peça, coordenadas XYZ e lista com as mesmas peças. A cena usa WebGL/Three.js local; as formas e ligações da apresentação são ilustrativas.

No app, posições/câmera pertencem ao layout; comandos de banco/código pertencem à execução. Mover uma peça não executa uma migração. Toda peça conserva ID, tipo, fonte, projeto, ambiente, portas, dependências e estado. Conectar valida tipos/direção; desfazer distingue layout e operações reversíveis. Execução ilumina somente o trecho com evento real. Erro permanece selecionável com causa, log e recuperação.

**Mapa mental:** hierarquia, teclado, seleção múltipla, zoom/pan, coedição, estilos, foco e apresentação. A equivalência 2D/lista preserva operações quando 3D não estiver disponível. Mapa da equipe e mapa de artefatos têm rótulos distintos.

**Pets:** cinco identidades iniciais, expansão para 30 direções já documentadas. Corpo, ferramenta, modelo e identidade não são a mesma configuração. Usar materiais/modelos existentes; não gerar uma coleção nova nesta revisão. Estado reage a eventos; não consome animação contínua quando invisível.

**Palco/TV:** própria superfície pública. A Estação mantém terminal, notas privadas e prévia. Foco de câmera pode conduzir mapa/3D, sem deslocar a câmera de trabalho dos colegas. Tema e volume do palco são explícitos; nenhuma aba privada vira cena por navegação acidental.

**Desempenho:** render por mudança/interação; limitar densidade de pixels; pausar superfícies fora de foco; liberar geometrias e listeners ao fechar; fallback em lista. Na maquete 3D não há loop contínuo. Não foi medida taxa de quadros no hardware final.

## 6. Terminal comanda o app e mostra uso

Comandar Babel, Agente e Shell continuam identificados. Botão, paleta, linguagem natural, `coop` e MCP chamam o mesmo registro de ações do app. Intenção ambígua pede destino. O contexto mostra pessoa, projeto, tarefa, máquina e diretório. Parar interrompe a execução suportada; histórico conserva resultado, erro e prova.

Uso fica resumido no painel e detalhado em **Uso e métricas**: janelas de limite e renovação; tokens/contexto; último turno e acumulado; modelo/esforço; custo reportado/estimado; chamadas/latência/erros; avaliação do laboratório; saúde da Estação quando instrumentada. Cada valor identifica fonte, escopo e horário. Cache/raciocínio não são somados duas vezes; cota da assinatura não é custo por token. Indisponível continua indisponível.

A maquete roteia exemplos de navegação e conserva o pedido. Ela não prova paridade universal com as ações do app. Esse aceite precisa de uma matriz ação → UI → comando → resultado.

## 7. Laboratório de IAs antes da entrega

**Candidata → contexto isolado → cenários → teste humano ou IA×IA → evidências → correção/repetição → revisão humana → piloto delimitado.**

- Humano conversa, tenta casos comuns/ambíguos e avalia clareza, acerto, ferramenta, recuperação e limites.
- IA×IA define candidata, desafiante e revisora; limita turnos, tempo, ferramentas e gasto; interrompe ciclos. Comparar também contra casos fixos e critérios determinísticos quando cabíveis. Concordância entre IAs não certifica qualidade.
- Versão, instruções, ferramentas, modelo/esforço, dataset/fixture e rubrica ficam registrados com cada execução. Separar treino, desenvolvimento e avaliação para evitar que os mesmos exemplos simulem evolução.
- Guardar conversa, ferramentas, diff, falhas, latência, uso disponível e decisão. Reproduzir cenário compara versões; modelo remoto pode variar, e seed só existe quando suportada.
- Testes usam cópia/fixture e acesso restrito; erro não publica nem altera projeto ativo. Segredos e sessões pessoais não são copiados automaticamente.
- Aceite libera piloto por projeto/grupo, com responsável e versão anterior recuperável. Laboratório Vyra permanece área de pesquisa/evolução, com finalidade distinta.

## 8. Pastas sem burocracia

Preservar os caminhos reais do repositório. Dentro de um projeto, oferecer o modelo opcional **Visão geral → Planejamento → Construção → Laboratório → Verificação → Entrega → Conhecimento → Arquivo**. Equipe atravessa todas as etapas. Pastas podem ser renomeadas e o modelo pode ser dispensado.

Tarefa, pessoa, sessão e reunião são objetos com identidade: suas “pastas” podem ser vistas filtradas. Não duplicar arquivos físicos nem impor nove diretórios vazios a cada projeto. A árvore deve conservar abrir/renomear/mover/copiar/apagar/recuperar, autoria, colaboração, sincronização e destino. A visão técnica pode mostrar extensões e arquivos ocultos.

## 9. Ordem para colocar em produção

| Ordem | Entrega concreta | Aceite que libera a próxima |
|---|---|---|
| 1 | Aplicar casca V4 à estação existente; conservar rotas, dados e módulos | Abrir todas as áreas, recolher/restaurar/redimensionar, trocar abas e reiniciar sem perder sessão/rascunho |
| 2 | Unificar contexto de projeto/tarefa/artefato e registro de ações | Mesma ação por UI e terminal produz o mesmo ID, estado e prova; migração preserva históricos |
| 3 | Terminal, agentes e Laboratório humano + IA×IA | Sessão real; Parar/retomar; métricas por fonte; candidata isolada; falha preservada; piloto limitado |
| 4 | Mapa, Máquina, navegador e apresentação | Layout XYZ persistido, fallback, sessão compartilhada; TV na tela de destino sem expor painel privado |
| 5 | Fechar integrações incluídas na distribuição e empacotar | Duas máquinas cooperam; offline/reconexão/conflito; atualização preserva dados e volta à versão anterior |

**Bloqueios concretos do escopo completo:** WhatsApp sem pareamento real (`vistas-d.js` informa explicitamente); bancada integrada do laboratório ainda só proposta nos arquivos consultados; edição espacial livre não demonstrada no corpo 3D atual (`_posicao` calcula grade e `_enquadrar` repõe câmera). Instalação/Pencil no iPad, colaboração entre dois computadores, identidade/permissões de toda ação, pacote e recuperação exigem verificação na candidata — não foram comprovados por esta revisão de design.

Não fazer pesquisa Vyra, independência da Gemma, coleção completa de 30 pets ou novo hardware virar condição oculta para usar a estação. Conservar esses itens no roteiro com disponibilidade real. Se a primeira distribuição tiver escopo menor, sua lista pública deve dizer o que está disponível; o Laboratório pedido pelo Theus permanece na entrega principal prevista.

## 10. Conferência desta entrega

O relatório [VERIFICACAO-V4.json](VERIFICACAO-V4.json) registra carregamentos e interações da maquete. A conferência cobre telas em duas larguras, terminal persistente, recolhimento, abas, resize, pedido preservado, comando para laboratório e cena 3D. Capturas mostram Estação, Máquina e Laboratório. Esses resultados validam a apresentação; não são testes do pacote instalado ou das integrações futuras.

Para reabrir: `node docs/ux-potencia/apresentar-v4.mjs`, depois `http://127.0.0.1:4790/PLANO-V4-VISUAL.html`. O servidor atende somente os artefatos do plano e Three.js local no loopback. V1/V2/V3 continuam disponíveis como referências.
