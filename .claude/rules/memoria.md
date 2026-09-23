# Contrato da memória do Ryan

Cada fato é um arquivo `.md` com frontmatter YAML, um fato por arquivo. Você grava com Write e edita com Edit. O passado não se reescreve: corrige-se com uma memória nova.

## Onde cada tipo mora

| `type` | arquivo | o que guarda |
|---|---|---|
| `preference` | `memoria/memorias/AAAA-MM-DD-<slug>.md` | como o Theus gosta das coisas; sempre com **Por quê** e **Como aplicar** |
| `profile` | idem (o essencial também em `memoria/perfil/theus.md`) | fato estável sobre o Theus, a equipe ou a empresa |
| `fact` | idem | dado do projeto ou do negócio: nome, número, data, link (sem segredo) |
| `learning` | idem | o que funcionou ou falhou numa entrega, e a saída encontrada |
| `idea` | idem, `confidence: 0.5` | o que o Theus cogitou e ainda não pediu |
| `reference` | idem | onde algo está: pasta, URL, documento |
| `decision` | `memoria/decisoes/AAAA-MM-DD-<slug>.md` | escolha de caminho: **Contexto** / **Alternativas** / **Escolha** / **Consequências** |
| `project` | `memoria/projetos/<slug>.md` (um por projeto, atualizado no lugar) | cada entrega ou frente: situação, arquivos, próximos passos, histórico |
| `knowledge` | `memoria/conhecimento/<tema>/AAAA-MM-DD-<slug>.md` (`<tema>` também é slug) | pesquisa: fatos numerados, cada um com URL e data |

- `<slug>`: minúsculas ASCII, sem acento, palavras separadas por hífen, até 50 caracteres.
- `id` = nome do arquivo sem `.md` (projeto: o próprio slug). Mesmo dia e mesmo slug: acrescente `-2`.
- Fora da tabela: `memoria/perfil/theus.md` (`id: theus`, `type: profile`, editado no lugar) e `memoria/origem/pedido-original.md` (`id: pedido-original`, imutável). Nenhum dos dois conta como memória ativa nem entra nas seções de memórias do índice: o perfil alimenta a seção Theus e a origem é lida por `/origem`.
- Data e hora vêm de `date '+%Y-%m-%d %H:%M'` (a máquina está no fuso de São Paulo). Nunca invente a hora: sem o comando, escreva `--:--`.

## Frontmatter

```yaml
---
id: 2026-09-23-theus-quer-respostas-curtas
type: preference
title: "Theus quer respostas diretas e curtas"
tags: [voz, theus]
confidence: 0.9
status: active
source: theus-disse
created: 2026-09-23
updated: 2026-09-23
supersedes:
superseded_by:
links: []
---
```

- `title` entre aspas, até 80 caracteres, específico ("Theus prefere X", não "preferências").
- `confidence`: 0.9 quando o Theus disse com todas as letras · 0.6 quando você inferiu · 0.5 ideia.
- `source`: `theus-disse` · `ryan-inferiu` · `pesquisa` · `subagente:<nome>` · `repositorio` (cite o caminho no corpo).
- `tags`: 2 a 5, minúsculas; inclua o slug do projeto quando houver.
- `status`: `active` ou `superseded`. `supersedes`, `superseded_by` e `links` são opcionais: podem faltar ou ficar vazios.
- `pinned: true` (opcional): a linha fica no índice mesmo quando sai das mais novas. Use pouco.
- Projeto acrescenta `situation: in-progress | delivered | paused | dropped`, `summary: "1 linha"` e `files: [caminhos]`. Corpo com `## Situação`, `## Próximos passos` (`- [ ] …`) e `## Histórico` (`- AAAA-MM-DD — …`, por acréscimo).
- Conhecimento acrescenta `topic: <tema>` e `sources: [url, …]`.

## Corpo
1 a 3 frases. `preference` e `learning` terminam com `**Por quê:** …` e `**Como aplicar:** …`. Cite outras memórias com `[[id]]`.

## Corrigir, nunca apagar
- Corrigir = memória nova com `supersedes: <id-antigo>`. Na antiga, mude só `status: superseded`, `superseded_by: <id-novo>` e `updated`. O corpo antigo não se edita.
- Esquecer sem correção (`/esquecer`) = `status: superseded` + uma linha no fim do corpo: `**Superada em AAAA-MM-DD:** motivo`.
- Nunca apague arquivo de `memoria/`, nem com `rm`. Edição no lugar só em: `projetos/*.md`, `perfil/theus.md`, `agenda.md`, `INDICE.md`, `diario/` (acréscimo) e nos campos de status acima.
- `memoria/origem/` é imutável.

## Antes de gravar
1. Grep em `memoria/` por 2 ou 3 palavras do título. Se já existe fato parecido, corrija com `supersedes` em vez de duplicar, ou pergunte ao Theus se devem ser juntados.
2. Nunca grave senha, token, chave, dado bancário ou documento de terceiro: escreva `[redigido]`.
3. E-mail e handle com arroba vão sempre entre crases (arroba solta no índice vira import).
4. Registre o fato, não o texto integral de um arquivo ou da conversa.

## O índice (`memoria/INDICE.md`)
Mantido por você, até 150 linhas. Seções fixas, nesta ordem, cada uma com sua fonte:

| seção | fonte | linha |
|---|---|---|
| cabeçalho | contagens reais | `# Índice vivo do Ryan — vX.Y.Z · geração N · A memórias ativas · P projetos abertos · Q pendências` e, na linha seguinte, `Estado: ativo` ou `Estado: ⏸ PAUSADO desde AAAA-MM-DD` |
| `## Theus` | `summary` de `perfil/theus.md` | o summary + `Detalhes: memoria/perfil/theus.md` |
| `## Missão DEUS` | `.deus/*/CAPSULA.json` | `- Ativa: **<identificador>** — etapa: … · próxima: … · .deus/<slug>/CAPSULA.json` (ou `- Nenhuma ativa.`) e `- Última: **<identificador>** — <estado> · .deus/<slug>/CAPSULA.json` |
| `## Projetos abertos` | `projetos/*.md` com `situation: in-progress` ou `paused` | `- **slug** (situation) — summary · próximo: <primeiro - [ ]> · memoria/projetos/slug.md` |
| `## Decisões que valem` | `decisoes/` ativas | `- AAAA-MM-DD · Título (id)`: as fixadas e as 5 mais novas |
| `## Memórias recentes` | `memorias/` ativas | `- [type confidence] Título (id)`: as fixadas e as 8 mais novas |
| `## Conhecimento` | `conhecimento/` ativos | `- [knowledge] topic · Título (id)`, ou uma linha dizendo que ainda não há |
| `## Pendências e agenda` | abertos de `agenda.md` e `- [ ]` dos projetos abertos | `- [ ] AAAA-MM-DD · texto` (agenda, por data, primeiro) e `- [ ] slug: item` |
| `## Fora do índice` | o que os limites deixaram de fora | `- N memórias ativas fora do índice; /consultar <tema> acha tudo.` |

- No cabeçalho, use o singular quando o número for 1 ("1 projeto aberto", "1 pendência"). O comentário `<!-- … -->` logo abaixo da linha `Estado:` faz parte do cabeçalho e se preserva.
- A = arquivos com `status: active` em `memorias/`, `decisoes/` e `conhecimento/`. P = projetos com `situation: in-progress` ou `paused`. Q = itens `- [ ]` nos próximos passos desses projetos mais os abertos da agenda. Missões DEUS não entram em Q: têm seção própria.
- Ordem dentro de cada seção: fixadas primeiro; depois `created` mais novo; empate, nome do arquivo em ordem decrescente.
- `<estado>` da linha "Última": o estado da cápsula em até 12 palavras (entregue, concluída ou em andamento, com a revisão), sem URL nem custo; se a próxima ação depende do Theus, diga. Ex.: `entregue (revisão 7), aguardando aprovação do plano pelo Theus`.
- Missão ativa = a que está em andamento (cápsula sem estado de entregue ou concluída); suspensa por cota, permissão ou decisão do Theus continua ativa. Mais de uma: a de revisão mais nova fica em "Ativa" e as outras vão para `/pendencias`. "Última" = a entregue ou concluída mais recente.
- Ao gravar: ponha a linha na posição que a ordem manda (normalmente o topo), tire o excedente do fim e atualize as contagens. O que sai continua achável por Grep.
- `/evoluir` reconstrói o índice do zero a partir dessas fontes. A geração sobe 1 no `/evoluir` normal e no `major`; a versão sobe só no `major`; `reparar` não muda nenhuma das duas.

## Diário (`memoria/diario/AAAA-MM.md`)
Uma linha por acontecimento que vale lembrar, por acréscimo: `- AAAA-MM-DD HH:MM · o que aconteceu · ids`. É a linha do tempo de `/origem` e `/estado`.

## Agenda (`memoria/agenda.md`)
Aberto: `- [ ] AAAA-MM-DD · texto`. Feito: `- [x] AAAA-MM-DD · texto (feito em AAAA-MM-DD)`. Os abertos também entram em "Pendências e agenda" no índice: é assim que voltam na próxima sessão. Não existe alarme fora do Ryan.

## Busca
Grep sem diferenciar maiúsculas em `memoria/` (e em `.deus/*/CAPSULA.json` quando o tema for de missão), com o termo, singular e plural e a forma sem acento. Ordem: `status: active` antes de `superseded`, depois confiança, depois data mais nova. Leia os melhores com Read antes de responder.

## Relatórios (`memoria/relatorios/AAAA-MM-DD-<slug>.md`)
Relatório de subagente ou workflow que valha guardar inteiro. O fato que ele trouxe vira memória própria que cita o relatório.
