# TV, projeção e conhecimento — 25/09/2026 13:10 -0300

[[Dominic]] · pedido: aplicar as decisões do Theus rapidamente e conferir a projeção.

## Entregue

- Logo superior pulsante e Meu dia primeiro já existiam, mantidos. Celular adiado.
- Resposta final pública recebida pelo servidor preservada integralmente no histórico e índice do acervo: removidos cortes de 8.000/20.000 caracteres nesse caminho. Instruções dos agentes reforçam registro de cada aprendizado reutilizável com evidência, limites e hipótese identificada. Pausa privada preservada. Isso fornece memória consultável, não treinamento automático de modelo nem garantia de que todo agente obedecerá às instruções.
- TV: fundo só reage a trabalho real; pessoas offline não mantêm agentes ativos; indicador conta agentes trabalhando, não presume atividade por haver alguém online. Pontos pessoais retirados da TV. Novidades mudam por dados, inclusive cartões novos; estado vazio explícito. Desconexão identifica dados antigos e interrompe contadores e vídeo.
- Projeção: janela da TV passa a carregar o conteúdo real sob demanda. Arquivo projetado entra no conjunto de arquivos que devem recarregar. Correção adicional do intervalo de 1,5 s que descartava alterações rápidas.

## Prova desta sessão

- Quatro arquivos de runtime passaram na checagem de sintaxe antes do pacote inicial; empacotamento final concluído em 25,2 s com assinatura ad hoc verificada pelo empacotador.
- Teste novo `app/testes/e2e/projecao-real.test.js`, executado contra o executável empacotado em `app/dist/mac-arm64/babel-coop.app`, com raiz temporária e portas isoladas: **1/1 passou, 0 falhas, 1.380 ms** no relatório do runner.
- O teste confere TV inicialmente sem conteúdo carregado, projeção de Markdown, texto visível, fundo parado sem trabalho, alteração do arquivo visível imediatamente e encerramento da projeção.
- Primeira execução com Electron de desenvolvimento falhou ao iniciar. Execução seguinte no pacote detectou a perda de alterações rápidas; depois da correção e novo empacotamento, passou.
- A ferramenta de controle da janela pessoal ficou bloqueada por mais de dez minutos e retornou erro; ela não forneceu prova visual. A prova acima vem do teste isolado com Electron.

## Limites

AirPlay/HDMI e a TV física não foram conferidos. O teste cobre arquivo Markdown local, não todos os formatos nem sites externos que proíbem iframe. A bateria completa do projeto e a ingestão de respostas por um agente real não foram executadas nesta entrega. D2/D4 e títulos do Perfil continuam pendentes. Não houve commit, push ou notarização Apple.

App: `app/dist/mac-arm64/babel-coop.app`. Instalador: `app/dist/babel-coop-0.1.0-arm64.dmg`.
