# Check das telas V1/V2 e Plano V3 · 2026-09-25

Theus pediu um comparativo entre o layout que prefere e o fluxo da versão mais organizada, mantendo o terminal sempre à direita, acrescentando o Laboratório de IAs e mostrando a sequência de pastas.

## Check realizado

- **V1:** casca de estação tipo IDE, área central ampla, contexto à esquerda e agentes/terminal à direita. Tinha potência e presença visíveis, mas repetia atividades, listas e indicadores.
- **V2:** organizou projetos, tarefas, continuidade, estados e critérios de aceite; a navegação mais enxuta podia deixar capacidades da V1 escondidas e não mantinha o terminal aberto em todas as telas.
- **V3:** propõe a casca da V1 com vínculo de projeto/tarefa e critérios da V2; terminal persistente com Comandar Babel, Agente e Shell; mapa de cobertura das capacidades; densidade/imersão por evento real; Laboratório humano + IA×IA em sandbox distinto do Laboratório Vyra.
- **Pastas:** registra uma sequência lógica de pastas por projeto dentro do app e um mapa de leitura da árvore de diretórios já existente no repositório. Nenhuma pasta real foi movida ou criada para reestruturação.

## Arquivos

- `docs/ux-potencia/PLANO-V3-CONSOLIDADO.md` — comparação, navegação, comando universal, Laboratório, pastas e critérios.
- `docs/ux-potencia/PLANO-V3-VISUAL.html` — maquete navegável da proposta com terminal fixo à direita.
- `docs/ux-potencia/README.md`, `REQUISITOS.md`, `TODO.md` e `PLANO-DAS-TELAS.md` mantêm os links e a distinção entre V2 auditada e propostas adicionais R80–R83/UX-134–UX-139.

## Limites da conferência

A maquete contém dados fictícios e os comandos nela são demonstrativos, não executam o Babel Coop nem agentes. O Laboratório é desenho de produto, não sandbox funcional. A pasta de projeto é proposta de organização da interface; a árvore real do repositório foi apenas consultada. O comando para abrir o HTML no Chrome concluiu; a automação do navegador falhou ao iniciar o app-server, então a inspeção visual não foi confirmada. `node --check` passou em `maquete-v3.js`; nenhum teste automatizado/funcional foi executado e o app instalado não foi alterado.
