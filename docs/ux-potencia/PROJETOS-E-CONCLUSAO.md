# Levar o projeto até o fim

Complemento central do plano. Fonte: [segundo adendo do Theus](ADENDO-2-INTEGRAL.md). A experiência deve ajudar uma equipe a concluir entregas, com terminal, agente, conversa, artefato e cronômetro no mesmo processo.

## 1. Escopo inicial: cinco tipos de projeto

**Site, Frontend, Backend, Landing page (LP) e Agente de IA.** São modelos de processo; documentos, mapas, quadros e peças continuam sendo artefatos dentro deles ou criações livres. Escolher um tipo não cria uma aplicação isolada nem obriga a seguir um formulário extenso.

Mídia social, edição de vídeo, edição de foto e tráfego pago ficam exclusivamente no [registro para depois](../PARA-DEPOIS-TIPOS-DE-PROJETO.md). Não entram como modelos ativos desta versão.

### Estrutura mínima do projeto

1. **Resultado:** o que precisa passar a existir e para quem.
2. **Definição de pronto:** resultados observáveis que permitem encerrar; quem aceita.
3. **Marcos e tarefas:** ordem útil, dependências e responsáveis; uma primeira fatia funcional cedo.
4. **Contexto:** arquivos, mapa, Máquina, referência, conversa e sessão associados.
5. **Execução e revisão:** próximo passo, cronômetro, bloqueio, entrega e prova.
6. **Conclusão:** aceite, artefatos finais, instruções de uso/manutenção e pendências conscientemente separadas.

### Modelos de processo

| Tipo | Etapas recomendadas | Primeira fatia útil | Evidência de conclusão |
|---|---|---|---|
| **Site** | Objetivo/público → mapa de páginas → conteúdo e direção visual → primeira página com navegação → demais páginas/integrações → revisão → publicar/entregar conforme combinado | Uma página real com navegação e ação principal | URLs/arquivos acordados, fluxos e formulários funcionando, responsividade, acessibilidade, metadados essenciais e aceite do responsável |
| **Frontend** | Jornada/contratos → estrutura visual/componentes → fluxo vertical ligado a dados → estados e variações → revisão de uso → integração/entrega | Um percurso utilizável com contrato real ou mock claramente identificado até conectar | Interface com carregamento, vazio, erro e sucesso; evidência da integração, navegação por teclado e critérios do projeto aceitos |
| **Backend** | Contrato de entrada/saída → dados/identidade/acesso → primeiro fluxo de ponta a ponta → arquivos/eventos/jobs necessários → observabilidade/recuperação → revisão de ambiente → entregar | Uma operação recebida pela porta, autorizada, persistida e respondida | Schema/migrações, acesso verificado, operação real, logs úteis, limites e recuperação documentados; destino de publicação explícito |
| **LP** | Oferta/público/conversão → mensagem e estrutura → primeira versão da página → formulário/ação e confirmação → revisão de conteúdo/uso → publicar/entregar | Uma pessoa percorre a oferta e completa a conversão prevista | Página, destino da conversão e confirmação reais; responsividade, metadados e medição somente quando prevista/autorizada; aceite |
| **Agente de IA** | Missão/limites → pacote inicial e modelo → ferramentas/contexto → primeira tarefa com prova → erros/interrupção/retomada → avaliação de casos → operar/entregar | Agente resolve uma tarefa delimitada usando uma ferramenta real | Entradas/saídas e escopo documentados, tarefas representativas conferidas, limites/consumo conhecidos, supervisão e retomada funcionando |

Cada modelo é editável. Projetos mistos (ex.: frontend + backend) podem combinar entregas no mesmo projeto; não duplicar membros, arquivos ou conversa por tipo. Site e LP se distinguem pelo resultado e processo, não apenas por um ícone.

## 2. Projeto não pode virar um depósito de tarefas

**Tela de projeto:** objetivo e definição de pronto em um lugar acessível; próximo marco; o que bloqueia; quem está fazendo; o que precisa de revisão; evidência já aceita. “Continuar” abre a próxima tarefa concreta ou o checkpoint de quem voltou.

**Tarefa bem construída:** resultado esperado, responsável, revisor quando necessário, pré-requisitos, artefatos, critério de aceite, próximo destinatário e histórico. Prazo e estimativa podem ser adicionados, sem ocultar o resultado sob campos administrativos.

**Passagem:** executar → entregar com prova → revisar → aceitar/liberar dependente ou devolver com motivo. Quem recebe encontra arquivo, estado, contexto do agente, decisão e próximo passo; não precisa reconstruir a conversa inteira.

**Bloqueio:** causa, desde quando, quem pode resolver e ação de destravar. Pedir ajuda leva o objeto correto à pessoa correta. Um agente pode sugerir a divisão ou a próxima etapa; o sistema não inventa responsável ou conclusão.

**Progresso:** mostrar entregas aceitas e marcos restantes. Percentual, quando usado, deriva de entregas/ponderações declaradas. Não basear avanço em mensagens, horas, tokens, animações ou tarefas fragmentadas para inflar contagem.

**Pronto para encerrar:** critérios obrigatórios aceitos; nenhuma pendência bloqueante oculta; resultado acessível no ambiente/destino combinado; responsável sabe usar e retomar. Itens opcionais podem ir para próxima versão com motivo registrado. Projeto fechado conserva materiais, decisões, aprendizados e ponto de manutenção.

## 3. Cronômetro visível e verdadeiro

### O que o código atual mostra

`prototipo/demandas.js:21` escolhe uma demanda da pessoa em andamento, pausada ou aguardando OK. Em `:283`, retorna conteúdo vazio se não encontrar demanda. `prototipo/estacao.js:403` esconde a caixa nesse caso. `prototipo/cronometro.js` conserva janela destacada e retomada associada a objetos. O elemento existe em `prototipo/index.html:58`.

Logo, **não foi demonstrado que o cronômetro tenha sido removido**. O vínculo atual com `demandas`, separado de `tarefas`, é uma lacuna a investigar. A hipótese também precisa considerar estado da pessoa, tarefa ativa, posição salva, CSS e diferenças do pacote aberto. Não foi iniciado trabalho real no app para reproduzir o relato nesta missão.

### Contrato novo

- Ao começar uma tarefa/etapa pelo botão, terminal ou agente, ela entra em execução e o cronômetro aparece. O evento precisa identificar tarefa, pessoa/sessão e início confirmado.
- Mostrar uma cápsula persistente com tarefa, tempo e Pausar; abrir detalhe, retomar, entregar, minimizar ou destacar. Trocar de tela, entrar no mapa/Máquina integral ou recolher painéis não a elimina.
- A cápsula é movível, lembra posição e volta para dentro da janela após resize ou mudança de monitor. Não cobre campo de digitação, nó selecionado ou controles de transmissão.
- **Foco pessoal** e **execução de agente/processo** são medidas diferentes. A pessoa pode ter uma tarefa de foco enquanto dois agentes executam outras; a UI mostra cada execução, sem somar tudo como horas humanas.
- Pausa, espera por revisão, bloqueio e processo encerrado não continuam somando trabalho ativo indevidamente. A aprovação final conserva a regra do registro legado, com tempo congelado quando apropriado.
- Sair/reabrir conserva intervalos, autoria e estado. Fechar a UI não prova que um processo externo acabou; heartbeat/estado do executor resolve a diferença. Queda de conexão mostra duração estimada/último estado quando necessário, sem apresentar certeza falsa.
- Horas pessoais não aparecem automaticamente no palco. Apresentação pode ter cronômetro próprio de sessão, distinto do tempo de tarefa.
- Guardar intervalos/eventos, não apenas um contador na tela. Reconexão trata duplicação, relógios diferentes e múltiplos dispositivos. Atualização visual não exige renderizar o app inteiro a cada segundo.

É prioridade da primeira fatia de melhoria: UX-104/UX-105 junto da navegação e do compositor.

## 4. Navegador “no osso” do terminal

Proposta de contrato: **uma sessão nativa de navegador, um estado de página, dois caminhos de comando** — mouse/teclado da pessoa e ferramenta do agente do terminal. O navegador continua dentro do Electron do Babel.

```text
Pessoa ── clique / teclado ───┐
                            ├── sessão do navegador ── página real
Agente no terminal ─ ação ───┘           │
                                       └── estado / observação / evidência
```

Vincular `browserSessionId` a pessoa, projeto, terminal/agente e tarefa. CLI não automatiza uma cópia invisível diferente da página que a pessoa vê. Cada navegação atualiza a revisão da página; ações atrasadas não clicam em elementos de uma revisão anterior. Popups, abas novas, downloads e redirecionamentos mantêm a associação.

“Assumir” encerra ou suspende a ação de automação pertinente; a pessoa navega normalmente; “Devolver” retoma a missão com nova observação da página. Múltiplos agentes recebem sessões/posse de controle explícitas. Estado de teclado/foco, campos sensíveis, login e desafios humanos são tratados no contrato.

O código existente `app/interface/navegador-real.js`, `app/main.js` e a ponte oferecem uma base de webview nativa. A tarefa é conectar e conferir o fluxo completo de Claude Code, Codex e OpenCode ao mesmo mecanismo; não abrir Chrome externo como experiência do produto.

## 5. Ponteiro que participa dos acontecimentos

Consultados exemplos e documentação de geração SVG da Replicate. [Recraft V4 SVG](https://replicate.com/recraft-ai/recraft-v4-svg/readme) oferece uma rota para explorar formas vetoriais; o comportamento interativo e o alinhamento do ponto de clique precisam ser implementados no app. A referência não prova que um cursor gerado venha pronto ou tenha hotspot correto.

Seis direções para comparar depois da aprovação:

| Direção | Quando entra | Como reage | Uso indicado |
|---|---|---|---|
| **Ponta viva** | Hover/click em ação válida | Pequeno assentamento e confirmação junto da ponta | Linguagem padrão discreta, Tech/Vibe |
| **Encaixe** | Arrastar peça da Máquina | Contorno de encaixe no alvo, indicação de porta e pulso ao confirmar | Construção 3D |
| **Fio condutor** | Ligar portas ou ramos | Segmento acompanha a ligação e retorna ao cancelar | Máquina e mapa |
| **Traço de ideia** | Criar nó, seleção ou anotação | Marca breve de origem e direção | Mapa e quadro, respeitando Pencil |
| **Companheiro próximo** | Pet recebe interação solicitada | Pet acompanha por um curto trecho e devolve espaço | Expressão/lúdico sem seguir o mouse o tempo inteiro |
| **Ponteiro de palco** | Apresentação | Sinalizador legível à distância, foco suave e anotação temporária | Guia da plateia separado do cursor privado |

**Precisão primeiro:** conservar hotspot e affordances de texto, link, resize, arrastar, proibido e seleção; sem atraso elástico na posição de clique, rastro permanente ou ocultação do texto. Efeito pode aparecer ao redor do ponto, sem substituir o cursor nativo onde isso compromete precisão, webview ou acessibilidade. Compatibilidade de `cursor`, DPI, janelas nativas e webview entra no aceite técnico. Um cursor do agente é identificado como agente, nunca finge ser a mão da pessoa.

Produção: comparar três pequenas famílias pela Replicate → conferir vetor/silhueta em tamanhos de uso → ajustar hotspot/estados → implementar gatilhos verdadeiros → medir precisão/foco/latência → oferecer Padrão/Expressivo/Do sistema. Movimento reduzido conserva estados estáticos. O pacote pode compartilhar materiais/ritmo com o pet sem transformar todo clique em uma cena.

## 6. Pesquisa das peças de backend: encontrada

Fontes locais:

- [SUPABASE_PECAS.md](../design/SUPABASE_PECAS.md), de 23/09/2026.
- [Catálogo de recursos](../../.deus/missao-design/pesquisa/supabase-catalogo-de-recursos.md).
- [Caderno de peças](../../.deus/missao-design/pesquisa/supabase-pecas-da-maquina.md).

A pesquisa salva registra **79 recursos do índice de features**, organizados em **16 famílias de peças + duas ações de tela**. Portanto, a referência localizada não é uma lista de 72 peças obrigatórias para todo backend. Essa é a contagem histórica documentada; não foi refeita uma auditoria atual de todo o catálogo Supabase ou consulta à base de produção nesta missão.

| Famílias de peças | Papel |
|---|---|
| Gaveta, Campo, Fio | Tabelas/variantes, tipos/colunas e relações |
| Chave, Empresa, Portaria | Acesso, separação por organização e identidade |
| Porta, Robô, Cano | Entrada/saída, automações e fluxos/eventos |
| Depósito, Cofre | Arquivos e segredos |
| Tela | Interface ligada ao backend |
| Armário, Ferramenta, Carteiro | Schemas, extensões e entrega de mensagens |
| Casa de Máquinas | Infraestrutura e operação, apresentada como painel |

**Vistoria** e **Diário** são ações: conferir problemas e inspecionar eventos/logs. Variantes ficam nas famílias (view, tabela externa, fila, vetor etc.). Os 16 GLBs em `midia/pecas/` encontrados na pesquisa desta missão têm nomes alinhados a essas famílias; ainda é preciso conferir conteúdo e qualidade, não só o nome.

Próxima etapa: matriz por recurso/variante com estado **local existente / Supabase existente / integrar / fora do projeto**, capacidade real, dependências, entrada/saída, exemplo mínimo e aceite. O banco local PGlite atual não deve ser apresentado como implementação de todos os serviços do Supabase. Cada backend usa as peças necessárias à sua definição de pronto, mantendo o catálogo completo encontrável.

Ao implementar, reconferir documentação oficial e acesso de cada projeto, usando a skill `supabase`; pesquisa de outro projeto não autoriza modificar sua produção.

## 7. Arquivo gerador do agente

Theus forneceu `/Users/matheussilveirapro/Downloads/criador` e um link do Claude. **A cópia local foi lida e incorporada ao plano**, sem executar o corpo ou o instalador. Template HTML, retrato, distribuições e Gemma‑Vyra foram mapeados em [CRIADOR-E-VYRA.md](CRIADOR-E-VYRA.md). Isso ainda não significa integração no app.

Plano de incorporação:

1. Preservar original, versão e distribuições; identificar entradas, saídas, dependências e instruções que já funcionam.
2. Separar núcleo comum (identidade, missão, projeto, contratos, definição de pronto, prova, memória e limites) dos adaptadores de distribuição.
3. Acrescentar contexto do projeto/etapa, navegador nativo, ferramentas disponíveis, peças da Máquina, progresso/timer e regras de colaboração.
4. Gerar a forma aceita por Claude Code, Codex e OpenCode conforme a versão instalada; integrar Vyra como quarta IA no final, com funcionamento solo.
5. Prévia/diff antes de substituir instruções existentes. Não sobrescrever regras globais, misturar segredos, instalar dependências ou executar o gerador apenas porque foi recebido para análise.
6. Toda sessão nova mostra qual pacote inicial/versão recebeu, contexto e capacidades efetivas. Sessões existentes preservam checkpoint; troca de versão é explícita.

O arquivo vai orientar a inicialização; não substitui o contrato de integração nem garante sozinho que uma ferramenta consiga controlar o app.
