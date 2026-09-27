# Pente fino inicial · Babel Coop · 2026-09-25

## Escopo e método

Inventário dos arquivos Markdown, estado do Git, leitura das instruções da casa e do projeto, índices e memória do Babel Coop, lista `A-FAZER.md`, checklist, planos centrais, cápsulas/rodadas das missões e busca textual por passos, prioridades e pendências. Há 245 arquivos `.md` no repositório; o inventário cobriu todos, e a leitura detalhada focou nos documentos operacionais e nos que definem a sequência. Nenhum teste, build, app ou integração foi executado nesta auditoria.

## Estado encontrado

- A instrução principal para este cliente é [[Dominic]]. O `AGENTS.md` local confirma a exceção do Babel Coop para JavaScript/TypeScript/Node e ferramentas de build; Python continua proibido. O contrato da pasta pai foi lido e mantém as restrições gerais fora dessa exceção específica.
- A árvore está em `main`, 7 commits à frente de `origin/main`, com alterações locais ainda sem commit: `git diff --stat` mostrou 88 arquivos rastreados alterados (5.239 inserções, 2.455 remoções), além de arquivos novos, arquivos removidos em `docs/pesquisa/research_notes/` e outros untracked. Não foi feita limpeza, restauração, commit ou push.
- O trabalho não deve começar de uma cópia limpa: há mudanças e evidências locais que precisam ser preservadas. `A-FAZER.md` é o índice operacional das faltas; os relatórios em `memoria/relatorios/` já comparam planos e código.
- A memória do projeto estava desatualizada: dizia para decidir D1–D9, mas `A-FAZER.md` registra D1, D3 e D6–D9 respondidas. As decisões ainda abertas são D2, D4 e D5.
- Há uma inconsistência editorial em `A-FAZER.md`: o total de 173 abertos corresponde à fila A-001–A-173, enquanto A-174/A-175 aparecem depois como candidatos a conferir e A-176–A-183 como feitos. A-181 aparece duas vezes com significados diferentes. Não corrigi a lista porque a reconciliação precisa preservar IDs e provas já citados.
- `agente/` contém material arquivado do antigo Dominic feito para outra pessoa, incluindo instruções e procedimentos incompatíveis/obsoletos. `agente/LEIA-ME.md` ainda menciona motor, hooks, Python e caminhos antigos. Esse conteúdo não é o procedimento atual do Babel Coop; nada sob `agente/` foi alterado.

## Passos já documentados

1. Resolver com Theus as decisões D2, D4 e D5 listadas no início de `A-FAZER.md`; as propostas estão no próprio arquivo.
2. Começar pela Onda 1. Itens diretamente relevantes: A-001 (endereço/QR para a rede local), A-002 (consolidar o trabalho em commits; push depende do Theus), A-003 (sonda com três pessoas), A-005 (decidir o destino das notas de pesquisa já removidas) e A-007 (teste entre dois computadores reais). Há dependências do Theus explícitas nos itens.
3. Antes de marcar item como feito, acrescentar log com prova sob o item, conforme a regra de `A-FAZER.md`; item parcial recebe log sem `[x]`.
4. Conferir itens marcados `em parte` contra o código e os testes atuais antes de agir: o checkout tem mudanças posteriores às auditorias citadas, portanto o relatório antigo não demonstra por si só o estado presente.
5. Depois de decisões e provas da Onda 1, seguir as Ondas 2–4 na ordem do arquivo; nuvem/Supabase está na Onda 4 e depende de decisão/credenciais do Theus.

## Documentos com orientação de processo

- `AGENTS.md`: identidade, autorização específica do app, Python proibido e obrigação de preservar dados e registrar limites na memória.
- `A-FAZER.md`: fila única, critérios de pronto e regra de evidência por item.
- `CLAUDE.md` e `memoria/LEIA-ME.md`: sequência de lembrar/situar/trabalhar/registrar/indexar/fechar e o modo de missão DEUS para a sessão Ryan/Claude. Para esta sessão, a instrução GPT/Codex continua [[Dominic]]; as regras de memória aplicáveis foram seguidas sem abrir ou modificar uma missão antiga.
- `.deus/terminal-ao-vivo/CAPSULA.json`: contém ordem mais recente para parar ajustes visuais da TV e restaurar o visual anterior, embora o contexto antigo ainda descreva tarefas passadas. A cápsula não foi alterada.
- `.deus/maquina-jogo/CAPSULA.json`: a próxima ação registrada é mostrar a Máquina ao Theus e medir CPU parado com banco aberto; não foi executada neste pente fino.
- `agente/` é referência histórica, não ordem operacional para esta pasta.

## Limites e próxima ação

Esta revisão é documental e do estado do Git. Não confirma que testes citados anteriormente continuam verdes, nem resolve divergências visuais ou a consistência dos IDs de `A-FAZER.md`. Próximo passo sugerido: alinhar D2/D4/D5 com Theus e reconciliar A-174/A-175 e o ID A-181 com base nos logs existentes; em seguida tratar A-001 e os testes da equipe da Onda 1. A-002 e A-005 devem ser resolvidos antes de consolidar/empurrar o conjunto.

## Fontes principais lidas

`AGENTS.md`, `CLAUDE.md`, `A-FAZER.md`, `CHECKLIST.md`, `COMO-INSTALAR.md`, `PROMPT-CONSTRUIR.md`, `IDEIAS.md`, `UX.md`, `HISTORICO-2026-09-24-25.md`, `memoria/INDICE.md`, `memoria/LEIA-ME.md`, `memoria/projetos/babel-coop.md`, `docs/CHECK_DO_THEUS.md`, `docs/FUNCOES.md`, `docs/MAQUINA.md`, `docs/UX_PENEIRA.md`, `docs/design/PLANO.md`, `docs/design/CONCEITO.md`, `docs/design/MAQUINA_PECAS.md`, `docs/design/TELA_CONSTRUTOR.md`, `docs/ESTUDO_DESIGN_2030.md`, relatórios recentes de atualização e auditoria, cápsulas e rodadas das duas missões, `agente/LEIA-ME.md`, `Desktop/Dominic/AGENTS.md` e `saber/personalizacao/CONTRATO.md`.
