---
name: auditoria-organismo
description: Audita o organismo do Ryan (memória, índice, contrato, CLAUDE.md, rules, skills, agentes e missões DEUS) com agentes independentes e propõe 3 mutações. Use quando algo parecer inconsistente ou para uma revisão periódica.
disable-model-invocation: true
---
Se o cabeçalho do índice diz `⏸ PAUSADO`, responda que a memória está pausada (a auditoria lê a memória inteira) e pare.

O Theus pediu uma orquestração. Rode a ferramenta Workflow com um script escrito na hora (inline, nunca gravado em arquivo), nesta receita, toda só de leitura:

1. **Diagnóstico:** 3 agentes em paralelo.
   - **Memória:** cada arquivo de `memoria/` contra `.claude/rules/memoria.md` (frontmatter, `id` igual ao nome, ligações que apontam para o nada, duplicatas, órfãs, projetos sem próximo passo, índice × arquivos, contagens do cabeçalho).
   - **Configuração:** `CLAUDE.md`, `.claude/rules/`, `.claude/skills/` e `.claude/agents/` (caminhos citados que não existem, comandos que não batem com as skills, instruções contraditórias, qualquer dependência de Python, motor, hook ou settings).
   - **Contexto e missões:** linhas de `CLAUDE.md` + `memoria/INDICE.md` + rules sem `paths` (custo fixo por sessão) e cápsulas de `.deus/*/` coerentes com o índice.
2. **Curadoria:** agente `bibliotecario` propõe, a partir do diagnóstico, o que juntar, superar e ligar, sem aplicar.
3. **Proposta:** um agente escreve o estado do organismo em até 10 linhas e 3 mutações (o quê, por quê, esforço, se mexe em `.claude/`).

Depois do workflow: mostre ao Theus, aplique só o que ele aprovar, você mesmo e pelo contrato, e guarde o relatório em `memoria/relatorios/AAAA-MM-DD-auditoria.md`.
