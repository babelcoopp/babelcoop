---
id: skills-e-comandos
type: knowledge
title: Claude Code 2.1.280 — skills e comandos
tags: [claude-code, configuracao, knowledge, skills-e-comandos]
confidence: 0.9
status: active
source: dossier
sources: ["https://code.claude.com/docs/en/skills.md", "https://code.claude.com/docs/en/commands.md", "https://code.claude.com/docs/en/output-styles.md", "https://code.claude.com/docs/en/hooks.md", "https://code.claude.com/docs/en/settings-reference.md", "https://code.claude.com/docs/en/memory.md", "https://code.claude.com/docs/en/permissions.md"]
pinned: false
created: "2026-09-22T23:39:41-03:00"
updated: "2026-09-22T23:39:41-03:00"
version: 1
hash: 8cc556056a871c1f0633b2b6f8f99b0ab04c4d470deb3edfbcb35835f62f5ddd
---
# Claude Code 2.1.280 — skills e comandos

Resumo verificado em 2026-09-22 contra os docs oficiais; detalhes nas fontes.

Skills e comandos (Claude Code 2.1.280, docs 2026-09-22) — fatos-chave para o builder do babel-os:

1. Uma skill = pasta com SKILL.md (frontmatter YAML iniciando na linha 1 + corpo Markdown). Nome da pasta vira o comando `/nome`. `.claude/commands/*.md` é legado (sem `name`/`paths`, sem arquivos de apoio); skill de mesmo nome vence. Use `.claude/skills/` de projeto.
2. Locais: enterprise > personal (~/.claude/skills) > project (.claude/skills) > nested > --add-dir > plugin > claude.ai synced (~/.claude/skills/synced, nome `synced` reservado). Skills têm detecção ao vivo; output styles NÃO (reinicie).
3. Frontmatter (minúsculas com hífen, exceto `when_to_use`; campo errado é ignorado sem erro): name, description, when_to_use, argument-hint, arguments, disable-model-invocation, user-invocable, allowed-tools, disallowed-tools, model, effort, context, agent, background, hooks, paths, shell, metadata, license, compatibility. Booleanos aceitam yes/no/on/off/1/0.
4. `disable-model-invocation: true` = só o usuário invoca, descrição sai do contexto; se Claude tentar, Claude Code bloqueia e ele sugere rodar `/nome`. `user-invocable: false` = só Claude invoca.
5. `allowed-tools` pré-aprova ferramentas só no turno da invocação; deny/ask ainda vencem. `${CLAUDE_SKILL_DIR}` e `${CLAUDE_PROJECT_DIR}` (v2.1.196+) são substituídos no corpo E nas regras Bash de allowed-tools — padrão oficial render-chart para rodar script sem prompt.
6. Substituições no corpo: $ARGUMENTS, $ARGUMENTS[N], $N ($0 = primeiro!), $name (via `arguments`), ${CLAUDE_SESSION_ID}, ${CLAUDE_EFFORT}, ${CLAUDE_SKILL_DIR}, ${CLAUDE_PROJECT_DIR}, ${CLAUDE_PLUGIN_ROOT/DATA}. Escape com `\$1.00`.
7. Injeção dinâmica: !`cmd` (início de linha ou após espaço) e blocos ```! rodam ANTES de enviar a skill, via Bash tool, cwd do shell da sessão, timeout 2 min, stderr mesclado. Exit ≠ 0 aborta a skill inteira (exceto exit 1 de grep/diff) → use `|| true`.
8. Permissão dos comandos injetados: nunca pedem prompt; fora do auto mode, qualquer resultado ≠ allow (inclusive "ask") ABORTA a invocação. Pré-aprove com `allowed-tools` (o `|| true` não cobre isso). Em auto mode não aborta, exceto skill forkada com `agent` ou sessão sem shell tool.
9. NÃO documentado: `$ARGUMENTS` dentro de !`cmd` (ordem de substituição vs execução); substituição de `${CLAUDE_PROJECT_DIR}` em regras de permissão do settings.json (use caminho absoluto lá). Regras Bash batem cada subcomando de `cmd || true` separadamente.
10. Skill de consulta corrigida: frontmatter com `allowed-tools: Bash(python3 ${CLAUDE_PROJECT_DIR}/scripts/*)`, injeção fixa `!`python3 .../consultar.py --recentes || true``, `$ARGUMENTS` no corpo Markdown, e Claude roda a busca por tema via regra pré-aprovada. Ideal: script sempre sai com 0.
11. `disableSkillShellExecution: true` troca cada `!` por `[shell command execution disabled by policy]`; skills sincronizadas do claude.ai nunca rodam `!` localmente.
12. Ciclo de vida: conteúdo renderizado entra como uma mensagem e fica no contexto; não é relido; reinvocação com conteúdo novo reanexa tudo; após compaction mantém 5.000 tokens/skill, 25.000 no total. Corpo deve ser enxuto (< 500 linhas; use reference.md/examples.md/scripts/).
13. Listagem: descrições de todas as skills entram a cada turno; orçamento = 1% da janela (`skillListingBudgetFraction` 0.01, ou env `SLASH_COMMAND_TOOL_CHAR_BUDGET` em chars fixos); cap 1.536 chars por skill (`skillListingMaxDescChars`). `/context` mostra tamanho pós-orçamento; `/doctor` estima custo; `/skill-doctor` (v2.1.252+, não via Remote Control) mostra custo/uso.
14. `context: fork` roda em subagente (`agent`: Explore/Plan/general-purpose/custom) sem histórico da conversa; background por padrão (v2.1.218+), `background: false` espera e mantém todas as ferramentas; edições em background não são revertidas por /rewind. Não use `!` em skill forkada com `agent`.
15. Empilhamento (`/a /b args`): até 6 skills; para na primeira skill com `context: fork` ou em `/loop` — `/consultar /refinar` NÃO roda /refinar.
16. `hooks` no frontmatter ficam registrados pelo resto da sessão; `once: true` remove só após execução bem-sucedida (falha/exit 2/timeout mantém). Hooks de skill de projeto seguem a regra de trust dos settings (registram até em -p); hooks de subagent exigem aceitar o trust dialog.
17. Controle: regras `Skill(name)`/`Skill(name *)`; `deny` bate em aliases e nomes não qualificados, `allow` só no nome próprio. `skillOverrides` (on | name-only | user-invocable-only | off) em settings; `/skills` escreve em settings.local.json mas não cicla skills com disable-model-invocation nem de plugin; alias só em managed/--settings; "off" esconde também de Remote Control/SDK. `disableBundledSkills: true` também esconde built-ins como /init do modelo; `skillOverrides: {"doctor":"off"}` ou env DISABLE_DOCTOR_COMMAND escondem /doctor.
18. Validar: `claude plugin validate .claude/skills` (v2.1.233+); erro de parse com `claude --debug`.
19. Comandos embutidos úteis: /memory, /init, /context [all], /compact, /clear [nome], /resume, /rewind, /hooks (somente leitura), /statusline, /config key=value, /permissions, /skills, /reload-skills, /output-style, /effort, /model, /usage (/cost), /insights, /loop [interval] [prompt], /goal, /doctor (bundled skill, alias /checkup). `/remember` NÃO existe; `/agents` só imprime lembrete (v2.1.198+); /vim, /pr-comments, /ultraplan removidos. Claude só consegue invocar alguns built-ins via Skill tool (/init, /security-review), não /compact, /clear, /memory.
20. Output styles: não deprecados; 4 embutidos (Proactive, Concise, Explanatory, Learning) + custom em `.claude/output-styles/<arquivo>.md` com frontmatter name/description/keep-coding-instructions/force-for-plugin. Custom REMOVE instruções de engenharia salvo `keep-coding-instructions: true`. Setting `"outputStyle": "Gabriel"` é case-sensitive; arquivo lido só no startup; não afeta subagents (persona também no CLAUDE.md). `/output-style` v2.1.269+; via Remote Control só estilos embutidos; menu VS Code inclui custom (v2.1.257+) e cria o arquivo (v2.1.261+).
21. Divisão: logging garantido = hooks; persona/fatos = CLAUDE.md; voz = output style; procedimentos = skills; trabalho pesado isolado = context: fork ou subagent; custo = skillOverrides name-only + /skill-doctor.
22. Sem Node.js: qualquer `!` com node/npm aborta; use python3, jq, git, curl.
