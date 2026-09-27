# Música, seleção e régua de conclusão

Complemento recuperado do histórico do Codex em 25/09/2026. [Conversa recuperada](HISTORICO-CODEX.md). A implementação do produto continua aguardando a análise do Theus; a apresentação pode ser concluída agora, conforme pedido de 20:49.

## S19 · Playlist babel-coop

A primeira faixa é o MP3 **GOD ON THE CODE · 1990s Ambient Vaporwave — Liminal Stages**, indicado pelo Theus em Downloads. O original permanece preservado. Uma cópia menor é trabalho da implementação: comparar original e candidata, duração, tamanho, consumo e audição; adotar somente uma versão aceita. O arquivo encontrado tem aproximadamente 222 MiB; a maquete o lê sob demanda, sem carregar o áudio inteiro em memória e sem afirmar compressão já realizada.

O player pessoal acompanha a pessoa ao mudar de tela: tocar/pausar, anterior/próxima, posição, volume, lista, adicionar arquivos e remover/reordenar. Começa silencioso e retoma a posição sem tocar automaticamente ao reabrir. Ausência da faixa mostra reconectar arquivo. A playlist inicial contém uma música; não inventar outras faixas. Uma reunião permite escolher se o áudio também será transmitido, com prévia; entrar na reunião não muda essa escolha.

**Bordas que acompanham a música:** analisar o próprio áudio reproduzido, sem microfone. Usar energia suavizada por bandas para intensidade/cor e transições lentas. A borda fica fora da área de leitura e não desloca o conteúdo nem captura cliques. Pausa, silêncio e aba oculta interrompem o ciclo visual. Intensidade regulável e opção desligar; respeitar movimento reduzido. Som de aviso não disputa volume com a música. Não prometer um detector exato de batidas: a demonstração mede energia do sinal.

**Aceite:** primeira faixa correta; pausa/avanço/volume/posição funcionam; trocar de tela preserva reprodução; fila com duas faixas locais avança; original intacto; versão leve tem comparação registrada. Com áudio, energia varia; com silêncio/pausa, pulso zera. Aba oculta e movimento reduzido param o ciclo. Medir CPU/memória/frame time com e sem efeito no mesmo Mac. Leveza é resultado medido, não adjetivo de conclusão.

## Selecionar → copiar → colar

O pedido é copiar para a **área de transferência** ao concluir uma seleção, permitindo Ctrl+V e, no macOS, ⌘V. Ativo por padrão para seleções elegíveis; preferência acessível para desligar. Nada muda no teclado físico.

| Seleção | Conteúdo copiado e destino |
|---|---|
| Texto de documento, conversa, terminal, campo ou código | Texto exato, com quebras, acentos e Unicode; copiar ao soltar o ponteiro ou terminar seleção por teclado; não executar nem enviar o texto |
| Arquivo ou pasta | Referência/representação suportada pelo sistema; colar no explorador copia o item, preservando o original; colisão pede resolução; colar em texto fornece nome/caminho apropriado |
| Nó de mapa ou peça da Máquina | Payload versionado do objeto e texto legível; colar em canvas compatível duplica com novo ID e ligações internas válidas; colar em texto dá a representação textual |
| Seleção múltipla | Ordem e conjunto preservados, operação única com confirmação de sucesso/falha |

Seleção vazia não limpa a área de transferência. Arrastar um objeto, mover câmera, redimensionar ou posicionar o cursor não copia. Seleções em senha e em campos explicitamente secretos são excluídas. Copiar dado público não autoriza transmiti-lo à equipe. O clipboard não entra no substrato por monitoramento global: somente operações explícitas do app recebem seu registro de ação.

No navegador, cada página mantém o isolamento da origem. A implementação deve definir o contrato no navegador integrado e no terminal; não injetar código arbitrário em páginas para capturar tudo. No app Electron, a ponte faz a cópia real e só anuncia sucesso depois de confirmada. Na maquete, a área de demonstração usa a API de clipboard do navegador e mostra a falha se o ambiente negar acesso.

**Aceite:** seleção por mouse e Shift+setas, texto multilinha/Unicode, terminal, objeto e seleção múltipla; colagem em campo e app externo; desligamento da preferência; erro real de clipboard; segredo/seleção vazia/arrasto não copiam. Cada tipo é verificado no seu destino, sem usar o simples destaque como prova de cópia.

## Régua para analisar e começar a construir

| Portão | O que precisa estar demonstrado |
|---|---|
| Plano para revisão | Pedido e seis complementos preservados; 79 requisitos com tarefas/aceites; 133 tarefas sem dependências circulares; 21 vistas abrem; configuração mostra as quatro IAs; música e seleção têm demonstração e limites visíveis |
| Primeira entrega do produto | Criar/retomar projeto, cinco modelos, arquivos/contexto, tarefa com cronômetro e passagem de trabalho entre três pessoas; iniciar pela fatia indicada no TODO |
| Construção e agentes | Mapa/Máquina com área integral; Claude Code/Codex/OpenCode e integração final Vyra; dois agentes com prova, navegador operável por pessoa/agente, contexto e interrupção |
| Palco e identidade | Reunião e iPad físicos; cinco pets funcionais antes de 30; música, ponteiro, efeitos e escola; dados reais e acesso coerente |
| Distribuição | Jornada inteira e retorno de versão; evidência por requisito; pacote identificável; aceite do Theus sobre o resultado |
| Pesquisa da Vyra | Laboratório e substrato com origem; modo solo distinguido de independência da Gemma, que só fecha com prova própria |

**Pronto para revisão** não marca UX-001…UX-133 como executadas. A opinião estética e a concordância do Theus continuam dele. Conferência desta entrega: [CONFERENCIA.md](CONFERENCIA.md).
