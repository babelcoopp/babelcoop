# Conferência e limites da entrega

## Retomada concluída · 25/09/2026

O histórico original foi encontrado em `.codex-backup`; [35 mensagens públicas](HISTORICO-CODEX.md) recuperam o pedido de UX e sua retomada. Os pedidos faltantes de música/bordas e cópia automática da seleção entraram nos adendos 5 e 6, em R77–R79, UX-130–UX-133 e no [contrato de aceite](MUSICA-SELECAO-E-ACEITE.md). Catálogo da maquete corrigido para Claude Code, Codex, OpenCode e Vyra.

- **Estrutura:** `node docs/ux-potencia/conferir.mjs` → 79 requisitos, 133 tarefas abertas, 21 vistas, dependências sem ciclos e zero erros. [Saída](CONFERENCIA-DADOS.json).
- **Navegador:** `node docs/ux-potencia/verificar-visual.mjs` → 42 carregamentos (21 vistas × duas janelas: 1440×1000 e 1223×800), nove verificações, zero erros de JavaScript/overflow horizontal detectados. [Resultado](VERIFICACAO-VISUAL.json).
- **Interação conferida:** quatro IAs na configuração; rascunho entre vistas; Criar/Escape; seleção textual Unicode/multilinha e referência de peça com colagem real por ⌘V; desligamento da cópia; MP3 real e energia da borda; reprodução entre telas; movimento reduzido; pausa zerando o ciclo.
- **Inspeção visual:** [apresentação](VERIFICADO-plano.png), [construção](VERIFICADO-construir.png), [música/seleção](VERIFICADO-ritmo.png), [Máquina](VERIFICADO-maquina.png) e [Criador](VERIFICADO-criador.png).

O servidor de apresentação só escuta `127.0.0.1:4788`; entrega esta pasta e o MP3 indicado, com leitura parcial sob demanda. Não expõe o app, contas ou diretórios arbitrários. O Chrome de teste usou contexto temporário e foi fechado. O bloqueio inicial do sandbox foi resolvido pela liberação explícita do navegador/porta local, sem contornar a permissão.

**Limites atuais:** não houve compressão do MP3, auditoria de CPU/RAM, audição humana, validação exaustiva de todos os botões, rig 3D, transmissão física, iPad, contas/agentes reais ou ciclo de laboratório. Cópia de arquivos/objetos tipados do produto está especificada; a maquete demonstra texto e referência textual. O player demonstra adicionar/selecionar faixas, anterior/próxima, volume, posição e persistência entre vistas; reordenar/remover e retomada após reiniciar são tarefas do produto. A prova é da apresentação, não da implementação das 133 tarefas.

## Registro anterior · entrega de 19:42, antes desta retomada

As contagens e limitações abaixo descrevem o artefato anterior e ficam preservadas como histórico. O estado atual é o bloco acima.

## Escopo produzido

- Pedido original e quatro complementos preservados integralmente.
- Matriz de 76 requisitos, com destinos no plano e referências às tarefas.
- 129 tarefas de implementação/pesquisa abertas, com dependências e critérios de conclusão.
- 18 telas/áreas especificadas; maquete com 19 vistas selecionáveis, mais diálogos de criação, configuração e contexto.
- Inventário heurístico de 726 declarações de controles em 50 arquivos: 679 em HTML literal, 9 por `createElement`, 38 por fábrica `h`.
- Fontes externas primárias documentadas; estado atual e proposta separados.
- Plano específico para cinco pets completos, expansão a 30, uso da Replicate, terminais e navegador do agente.
- Cinco modelos de projeto e backlog separado; tempo de tarefa, ponteiro, Criador modular e laboratório Vyra; catálogo Claude Code/Codex/OpenCode/Vyra, substrato integral e modo Solo sem Python.

## Conferência reproduzível

`node docs/ux-potencia/conferir.mjs` confere IDs, referências requisito/tarefa, dependências sem ciclos, links locais e correspondência entre seletor e funções das vistas. Também compila os quatro scripts da maquete concatenados, sem executá-los, para detectar erros de sintaxe e declarações incompatíveis.

O resultado efetivamente obtido fica em [CONFERENCIA-DADOS.json](CONFERENCIA-DADOS.json). O script não altera o app; grava somente esse relatório. A leitura semântica relacionou os pedidos às linhas R01–R76; a matriz permite a Theus revisar essa interpretação. A conferência estática não substitui o aceite visual e funcional futuro.

## Limites

1. A observação nativa cobriu Meu dia, Criar e Demandas. As outras telas foram analisadas pelo código e documentação, sem alegar passagem visual completa.
2. A abertura de localhost no navegador de inspeção foi rejeitada por permissão negada. Não se contornou a rejeição.
3. A maquete é um artefato local de proposta, sem serviços. Sintaxe e estrutura podem ser conferidas estaticamente; aparência, áudio e interações **não foram validados em navegador nesta entrega**.
4. As silhuetas dos pets são vetores conceituais. Não houve geração de modelos 3D, rig, animações finais ou consumo da Replicate.
5. Contagens, nomes de colegas, conversas, tarefas e resultados exibidos na maquete são fictícios. Os controles ilustram os caminhos; não são funcionalidades adicionadas ao app.
6. Nenhum teste funcional do app, login, pareamento de WhatsApp, instalação no iPad, uso do OpenCode, cooperação real de agentes ou transmissão física foi executado nesta missão.
7. Código/pacote do app e alterações preexistentes foram preservados. A implementação depende da concordância expressamente pedida pelo Theus no complemento.
8. Criador/Gemma‑Vyra não foram executados. A chamada Python encontrada no material de origem está apontada para retirada na integração, sem executar a sonda nem desinstalar software do Mac. O perfil e suas provas anteriores foram lidos como registros, sem repetir os testes.

## Como revisar a proposta

Abrir [PLANO-VISUAL.html](PLANO-VISUAL.html). Usar o seletor de telas no topo para percorrer as 19 vistas. Alternar Tech/Vibe pelo sol; abrir + Criar; escrever no campo do agente e expandir; abrir mapa e Máquina; girar a ilustração/encaixar peça; percorrer cenas da reunião; escolher gestos dos pets; ver conclusão de projeto, ponteiro, Espelho e laboratório. O cronômetro é um contador ilustrativo local. Em Ajustes, “Ouvir assinatura” toca uma amostra sintetizada apenas após o clique.

Para avaliar implementação, usar os aceites do [TODO](TODO.md), não a aparência desta maquete como prova de backend ou integração pronta.
