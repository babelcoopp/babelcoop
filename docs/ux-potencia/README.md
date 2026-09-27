# babel-coop · construir juntos

Plano de UX solicitado por Theus em 25/09/2026. Autor: **[[Dominic]]**, executor único.

**Versão atual para revisão — V4, 26/09:** [abrir a estação V4](http://127.0.0.1:4790/PLANO-V4-VISUAL.html), [plano consolidado e ordem de produção](PLANO-V4.md), [check dos 83 requisitos](CHECK-V4.md). Mantém a casca no estilo VS Code, demonstra abas/painéis recolhíveis e 3D manipulável, recupera destinos que ficaram escondidos e aponta os bloqueios reais de produção. Para abrir: `node docs/ux-potencia/apresentar-v4.mjs`. [Conferência da maquete](VERIFICACAO-V4.json).

**Apresentação concluída para revisão em 25/09, após recuperar a conversa:** [abrir apresentação local](http://127.0.0.1:4788/PLANO-VISUAL.html#plano). [Histórico público recuperado](HISTORICO-CODEX.md), com 35 mensagens do recorte de UX e retomada. [Música, seleção e régua de aceite](MUSICA-SELECAO-E-ACEITE.md), [quinto adendo](ADENDO-5-INTEGRAL.md) e [sexto adendo](ADENDO-6-INTEGRAL.md).

**Plano V3 consolidado:** [comparação entre a estação V1 e o fluxo V2](PLANO-V3-CONSOLIDADO.md) + [maquete com terminal universal permanente à direita](PLANO-V3-VISUAL.html). V1 e V2 continuam preservadas como referências.

No V3, a tela Projetos também mostra a sequência de pastas por projeto; o plano separa essa árvore da estrutura real do repositório, que foi mapeada sem ser movida.

**Ajustes pedidos em 25/09:** S06 e a maquete anterior mostram a área de trabalho à esquerda e o terminal aberto à direita. S20/R81/UX-135 propõem um Laboratório de Agentes. O V3 consolida os dois desenhos, dá ao terminal controle do app e preserva a densidade/imersão; os requisitos R80–R83 e tarefas UX-134–UX-139 são propostas fora dos totais auditados (79 requisitos/133 tarefas). Tudo fica em design e documentação; não altera nem instala o aplicativo.

Para reabrir com o MP3 original: executar `node docs/ux-potencia/apresentar.mjs` na raiz do Babel Coop e acessar o endereço acima. A maquete também abre diretamente como HTML; nesse caso, reconecte o MP3 por **+ Adicionar MP3**. Nenhuma música inicia automaticamente.

1. **[Abrir a maquete navegável](PLANO-VISUAL.html)** — proposta visual com dados fictícios; não opera o app.
2. **[Plano das telas e jornadas](PLANO-DAS-TELAS.md)** — estrutura, destinos dos recursos, interação, colaboração, agentes, som e movimento.
3. **[Pipeline de implementação](TODO.md)** — tarefas em ordem de dependência, com critério de conclusão.
4. [Cobertura de cada exigência](REQUISITOS.md) e [fala integral preservada](PEDIDO-INTEGRAL.md).
5. [Auditoria do estado atual](AUDITORIA.md), [inventário de controles](INVENTARIO-CONTROLES.csv) e [fontes de UX](REFERENCIAS.md).
6. [Pipeline desta análise](PIPELINE.md) e [conferência dos artefatos](CONFERENCIA.md).
7. **[Pets 3D, Replicate, terminais e navegador do agente](PETS-3D-E-TERMINAIS.md)** — cinco iniciais, coleção de 30, Claude Code/Codex/OpenCode e quarta ferramenta no final; [adendo integral](ADENDO-INTEGRAL.md).
8. **[Levar o projeto até o fim](PROJETOS-E-CONCLUSAO.md)** — cinco modelos, cronômetro, navegador no terminal, ponteiro reativo e pesquisa das peças de backend; [segundo adendo](ADENDO-2-INTEGRAL.md).
9. **[Criador e Vyra](CRIADOR-E-VYRA.md)** — HTML do corpo, página modular, relatos/versões, Gemma‑Vyra, substrato e laboratório; [terceiro adendo](ADENDO-3-INTEGRAL.md) e [quarto adendo](ADENDO-4-INTEGRAL.md).
10. [Tipos de projeto para depois](../PARA-DEPOIS-TIPOS-DE-PROJETO.md) e [captura original](REFERENCIA-17h28.png).

**Ideia central:** abrir um projeto é voltar ao lugar onde a equipe estava construindo. Arquivos, tarefas, conversas, terminais e agentes compartilham esse contexto. Mapas e a Máquina têm a janela inteira para construir; a reunião transforma esse trabalho em uma apresentação viva.

Esta entrega é uma proposta de produto: **79 requisitos, 133 tarefas, 19 áreas especificadas e maquete com 21 vistas**, além dos diálogos de criação/configuração. **Implementação somente após a concordância do Theus.** As tarefas UX permanecem abertas. A maquete foi conferida no Chrome em 1440×1000 e 1223×800; copiar/colar, MP3, pulso, pausa, rascunho e catálogo tiveram verificação funcional. [Evidência e limites](CONFERENCIA.md). O código/pacote do app, o Criador/Gemma e a geração paga permanecem fora desta entrega.

**Decisões mais recentes:** cinco projetos iniciais (Site, Frontend, Backend, LP, Agente de IA); quatro IAs (Claude Code, Codex, OpenCode, Vyra); Vyra pode trabalhar sozinha; toda atividade gera substrato com origem; nenhuma rota de produto depende de Python. O Laboratório de Agentes é a etapa de validação pré-piloto; o laboratório de pesquisa da Vyra é secundário. Independência da Gemma é um marco de pesquisa com critérios próprios, separado da entrega do app.
