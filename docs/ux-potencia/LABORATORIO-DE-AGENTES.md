# Laboratório de Agentes · proposta complementar

O Laboratório de Agentes é uma bancada de **validação pré-entrega**. A pessoa responsável testa uma versão candidata em cenários controlados antes de colocá-la à disposição da equipe. Ele responde: “esta versão executa bem estas tarefas, nesta configuração e dentro deste escopo?” Não promete que um agente funcionará corretamente em qualquer situação.

Este laboratório é diferente do **Laboratório Vyra** (S18): aquele pesquisa evolução, dados e candidatos da Vyra. Este testa qualquer agente configurado para uso no Babel Coop, incluindo Claude Code, Codex, OpenCode e Vyra. Os dois podem compartilhar registro de execuções e evidências, mas não compartilham automaticamente dados, permissões ou objetivos.

## Fluxo da bancada

1. **Escolher candidata:** ferramenta, versão do agente/instruções, modelo, esforço, ferramentas habilitadas, projeto-alvo e responsável pela entrega. A versão em teste fica separada da configuração publicada.
2. **Preparar sandbox:** usar cópia ou fixture do projeto, permissões mínimas e credenciais de teste. Produção, publicação, mensagens externas e dados pessoais ficam bloqueados por padrão. Antes da rodada, a tela mostra o que o agente pode ler, escrever ou acionar.
3. **Selecionar cenário e régua:** tarefa, contexto disponível, resultado esperado, evidência exigida e casos de borda. Cenários podem ser salvos e repetidos em outra versão.
4. **Executar teste humano ou IA × IA:** acompanhar conversa, ferramenta chamada, alteração, saída, falhas e interrupção. A pessoa pode assumir o controle, parar e repetir a rodada sem contaminar o projeto real.
5. **Revisar evidências:** diff/artefatos, sequência de ações, logs relevantes, versão, modelo, instruções, permissões, duração e métricas de consumo quando a fonte as fornece.
6. **Decidir e encaminhar:** corrigir e repetir, arquivar com motivo, ou propor piloto limitado. A aprovação final é de uma pessoa responsável, que define destino, grupo e escopo de acesso.

## Dois modos de teste

### Teste humano

A pessoa conversa diretamente com a candidata, usa tarefas representativas e faz perguntas de seguimento. O roteiro deve cobrir pelo menos: pedido claro; contexto insuficiente; erro/falha e retomada; ferramenta e permissão; qualidade do resultado; explicação de limites. Campo livre continua disponível para exploração, mas a régua exige registrar cenário e expectativa para que uma rodada possa ser repetida.

### Teste IA × IA

Papéis explícitos evitam uma conversa vaga entre dois agentes:

- **Candidata:** executa a tarefa como faria para a equipe, na sandbox e com permissões delimitadas.
- **Desafiante:** procura ambiguidades, casos de borda e pontos de falha sem ganhar acesso além do necessário.
- **Revisora:** compara a entrega e as provas com a régua, aponta divergências e cita trechos observáveis.

Desafiante e revisora podem ser duas instâncias ou ferramentas diferentes. Quando só houver duas, o resultado da revisora permanece sugestão e a tela exige conferência humana. Um agente nunca aprova a própria entrega; votação entre modelos não substitui evidência nem aceite humano.

## Régua, registro e saída

Avaliar separadamente: acerto do objetivo; aderência a instruções/contexto; escolha de ferramentas; limites e permissões; qualidade do artefato; provas; comunicação de incerteza; recuperação após erro/interrupção; tempo e consumo observados. Resultado não vira uma nota única sem mostrar critérios e falhas.

Cada rodada guarda ID, data, pessoa responsável, candidata/configuração, cenário e versão dos fixtures, papéis das IAs, transcript de trabalho, chamadas de ferramenta, artefatos/diff, medições disponíveis, achados e decisão. Segredos e conversas pessoais ficam fora do registro compartilhável. Repetir o mesmo caso permite comparar versões; casos reservados diminuem a chance de ajustar o agente apenas às perguntas conhecidas.

Estados sugeridos: **não executado**, **em andamento**, **falhou**, **precisa de revisão**, **apto para piloto delimitado**. “Apto” sempre referencia versão, configuração, tarefas cobertas e limites conhecidos. O piloto começa com escopo explícito e pode ser revogado; não publica nem atualiza o agente automaticamente.

## Layout da vista

A vista mostra a candidata e seu escopo, seletor de modo, roteiros de casos, conversa/execução da rodada e régua de evidências. No modo IA × IA, papéis e modelos ficam visíveis. Ações **Parar**, **Repetir**, **Comparar versão** e **Encaminhar para revisão** ficam próximas da execução. A maquete usa pessoas, resultados e percentuais fictícios e não inicia nenhum agente.

## Critérios para considerar o laboratório funcional

- Um usuário consegue testar uma candidata sem publicar ou alterar a versão ativa.
- Testes humanos e IA × IA deixam reproduzir o mesmo cenário e identificar cada participante/modelo.
- É possível interromper, inspecionar a saída, revisar alterações e comparar versões.
- Falhas e métricas indisponíveis aparecem como tais; indisponível não significa zero ou sucesso.
- Evidência, permissão e decisão humana ficam vinculadas à versão enviada para piloto.
- A interface explica cobertura e limites; aprovação não é apresentada como garantia universal.
