# LEIA-ME · Ryan, o agente do Theus no babel-coop

## O que é

O Ryan é o agente desta pasta. Ele junta as duas peças que estavam em `agente/`:

- o **método** DEUS — CRIADOR (`agente/DEUS-CRIADOR/`): missão com pasta própria, cápsula de retomada, persistência até a entrega demonstrada e selo adversarial;
- o **organismo de memória** (o antigo `agente/babel-os/`, hoje solto em `agente/`; o Gabriel feito para o Marcelo, renomeado Dominic): cada fato vira um arquivo `.md`, um índice vivo entra em toda sessão, e há comandos para lembrar, decidir, consultar e evoluir.

Tudo em Markdown puro: sem motor, sem hooks, sem status line, sem painel. Quem lê e grava é o próprio Ryan, com Read, Write, Edit, Glob e Grep.

## Onde fica cada peça

| peça | caminho |
|---|---|
| identidade, voz, método e a sequência de informação | `CLAUDE.md` |
| contrato da memória (tipos, nomes, frontmatter, índice) | `.claude/rules/memoria.md` |
| segurança | `.claude/rules/seguranca.md` |
| padrão de sites, LPs e sistemas | `.claude/rules/entregas.md` |
| comandos (20) | `.claude/skills/` |
| subagentes (6) | `.claude/agents/` |
| protocolo DEUS integral, molde de missão, salto | `.claude/skills/deus/` |
| a memória | `memoria/` |
| missões DEUS | `.deus/<slug>/` |

## Como acordar

1. No terminal: `cd ~/Desktop/babel-coop` e depois `claude`.
2. Os arquivos valem a partir da primeira sessão nova depois da montagem. Numa sessão que já estava aberta, skills e agentes novos podem não aparecer: abra outra.
3. Teste rápido: `/estado` responde com versão, geração e contagens; `/ajuda` lista os comandos.

## A sequência de informação

A cada pedido: **lembrar** (índice + Grep na memória) → **situar** (missão DEUS, se houver) → **trabalhar** → **registrar** (arquivo em `memoria/`, `📌 Anotei`) → **indexar** (`INDICE.md` + diário) → **fechar** (resposta curta com evidência). O detalhe está no `CLAUDE.md`.

## Comandos

| comando | o que faz |
|---|---|
| `/lembrar` | guarda um fato, preferência, ideia, aprendizado ou referência |
| `/decidir` | registra uma decisão com contexto, alternativas, escolha e consequências |
| `/consultar` | pergunta à memória: "o que sabemos sobre X?" |
| `/estado` | sinais vitais e avisos |
| `/perfil` | o que o Ryan sabe de você e o que quer aprender |
| `/pendencias` | o que está aberto, e o de agora |
| `/lembrete` | lembrete com data (volta quando o Ryan é aberto) |
| `/pesquisar` | pesquisa com fontes, guardada em `memoria/conhecimento/` |
| `/site` · `/sistema` | LP ou desenho de sistema em `entregas/` |
| `/deus` | abre ou retoma uma missão DEUS |
| `/esquecer` | tira uma memória de circulação (nunca apaga) |
| `/evoluir` | refino completo, reconstrói o índice (`major`, `reparar`) |
| `/origem` | o pedido de nascimento e a linha do tempo |
| `/pausar` | liga ou desliga a pausa da memória |
| `/ajuda` | a tabela completa com exemplos |
| `/cruzar-memoria` · `/pesquisa-profunda` · `/construir-lp` · `/auditoria-organismo` | orquestrações pesadas (workflow) |

## Como ele lembra

- Cada memória é um arquivo em `memoria/`, com frontmatter. Nada se apaga: corrigir cria uma memória nova ligada à antiga, e a antiga fica `superseded`.
- O índice (`memoria/INDICE.md`) é importado pelo `CLAUDE.md`: entra no contexto em sessão nova, `/clear` ou `/compact`. No meio da sessão, o Ryan lê o arquivo.
- O histórico das versões é o git: vale a partir do seu próximo commit.

## O que ficou de fora do Gabriel, e por quê

| peça do babel-os | no Ryan | por quê |
|---|---|---|
| motor Python (17 scripts) e hook único (16 eventos) | apagados ao fim da montagem | suas regras globais negam Python; ordem sua |
| `settings.json` (hooks, permissões, status line, spinner) | não instalado | o agente não edita `settings*.json` |
| painel HTML e `/painel` | não instalados | eram gerados pelo motor |
| 4 workflows `.js` | viraram skills-receita | o Ryan não escreve `.js`; a ferramenta Workflow roda o script inline |
| snapshots em `backups/` | substituídos pelo git | memória versionada com o repositório |
| recall automático a cada pedido | passo 1 da sequência (Grep) | sem hook |
| portão de aprendizado no Stop | passo 4 da sequência | sem hook |
| memória do Marcelo, dossiê do Claude Code 2.1.280, LP do Reino | ficaram em `agente/` (`memoria/`, `entregas/`) | você pediu o sistema limpo |

## Limites honestos

- Nada é registrado sozinho: o que o Ryan não gravou não existe para ele.
- Lembretes: na primeira resposta de cada sessão o Ryan avisa os vencidos e os do dia; fora dele não há alarme.
- Sem status line: a saúde se vê com `/estado`.

## Se algo estranhar

1. `/estado` mostra os avisos.
2. `/evoluir reparar` refaz o índice a partir dos arquivos.
3. `/auditoria-organismo` faz a revisão completa com agentes independentes.
