---
id: hooks
type: knowledge
title: Claude Code 2.1.280 — hooks (ganchos)
tags: [claude-code, configuracao, hooks, knowledge]
confidence: 0.9
status: active
source: dossier
sources: ["https://code.claude.com/docs/en/hooks.md", "https://code.claude.com/docs/en/hooks-guide.md", "https://code.claude.com/docs/en/permissions.md", "https://code.claude.com/docs/en/settings-reference.md", "https://code.claude.com/docs/en/tools-reference.md", "https://code.claude.com/docs/en/sub-agents.md", "https://code.claude.com/docs/en/permission-modes.md", "https://code.claude.com/docs/en/headless.md"]
pinned: false
created: "2026-09-22T23:39:41-03:00"
updated: "2026-09-22T23:39:41-03:00"
version: 1
hash: 536cdad7bc185e25d8fc944855514f7d8bef75d8ebf371a9c0bc9da73917d645
---
# Claude Code 2.1.280 — hooks (ganchos)

Resumo verificado em 2026-09-22 contra os docs oficiais; detalhes nas fontes.

Fatos-chave de hooks para quem vai construir o babel-os (Claude Code 2.1.280, macOS, python3 3.9.6, jq, sem Node):

1. Config: `.claude/settings.json` → `"hooks": { "<Event>": [ { "matcher": "...", "hooks": [ { "type": "command", "command": "python3", "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/x.py"], "timeout": N } ] } ] }`. Com `args` presente = exec form (sem shell, sem ~/.zshrc). JSON puro: vírgula sobrando ou comentário = nenhum hook carrega e `/hooks` fica vazio; se a edição não aparecer em segundos, reiniciar a sessão.
2. Tipos: `command`, `http`, `mcp_tool`, `prompt`, `agent`. `SessionStart`/`Setup` só aceitam `command` e `mcp_tool` (e `mcp_tool` é pulado no launch). Prompt hook responde `{ok, reason, impossible}`; agent hook responde só `{ok, reason}` (sem `impossible`, sem `continueOnBlock`; em `ok:false` age como prompt com `continueOnBlock:true`).
3. Input chega em stdin como JSON: `session_id`, `prompt_id`, `transcript_path` (escrito async, pode atrasar), `cwd`, `scratchpad_dir`, `permission_mode`, `effort.level`, `hook_event_name`, mais `agent_id`/`agent_type` em subagentes. Não existe `$CLAUDE_MODEL`.
4. Exit codes: 0 = sucesso; 2 = bloqueia (stderr vira motivo); qualquer outro (1, 127) = erro NÃO bloqueante, ação prossegue. "For most hook events, exit code 2 is the only exit code that blocks" — exceções: `WorktreeCreate`/`WorktreeRemove`, onde qualquer não-zero falha.
5. stdout só vira contexto em `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`, `PostModelSwitch`; nos outros vai ao debug log. stdout que começa com `{` e termina com `}` é parseado como JSON; se falhar (v2.1.248+) o texto é DESCARTADO e aparece `<hook name> hook error`. Várias linhas JSON (jsonl) com uma que seta campo = falha de parse. Nunca imprimir jsonl em stdout.
6. Output JSON: `continue`, `stopReason`, `systemMessage`, `terminalSequence` (OSC 0/1/2/9/99/777 + BEL; só interativo) no top-level; `decision: "block"` + `reason`; `hookSpecificOutput` exige `hookEventName` exato e é onde `additionalContext` DEVE ficar (no top-level é ignorado). Limite 10.000 chars por campo.
7. `Stop`: dispara toda vez que o Claude termina de responder. `decision:"block"` E `hookSpecificOutput.additionalContext` AMBOS impedem a parada e abrem novo turno (mesmas proteções: `stop_hook_active` + cap de 8 = `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`); só muda o rótulo no transcript. Para só gravar memória: exit 0, stdout vazio. Input traz `last_assistant_message` (use este, não o transcript), `background_tasks`/`session_crons` (opcionais, presentes só com task registry acessível).
8. `SessionStart`: matchers `startup|resume|clear|compact|fork`; input `source`, `model?`, `agent_type?`, `session_title?`. Roda em background, mas o prompt do usuário só chega ao Claude quando os hooks terminam; `/clear`/troca durante a execução descarta o retorno; `Esc` devolve o prompt. Output: texto puro (não começar com `{`) ou `hookSpecificOutput` com `additionalContext`, `sessionTitle` (checar `session_title` antes; ignorado em clear/compact), `watchPaths`, `reloadSkills`, `initialUserMessage` (só -p). `CLAUDE_ENV_FILE` disponível para persistir env vars.
9. `Setup`: só com `claude --init-only` (ou `-p --init`/`--maintenance`); roda Setup + SessionStart(startup) e sai. Ideal para criar a estrutura `memoria/` na primeira ativação de forma determinística.
10. `UserPromptSubmit`: input `prompt`; default timeout 30 s e bloqueia o processamento. Contexto injetado como system reminder com o nome do hook; NADA aparece na tela. `decision:"block"` apaga o prompt.
11. `PreToolUse`: `tool_name`, `tool_input`, `tool_use_id`; output `hookSpecificOutput.permissionDecision` allow/deny/ask/defer + `permissionDecisionReason`, `updatedInput`. Dispara em todo permission mode; `deny` vale até em bypassPermissions. `if: "Bash(rm *)"` só em eventos de ferramenta, best-effort.
12. `PostToolUse`: `tool_response` por ferramenta (`Write` → `{filePath,type}`; `Bash` → `stdout,stderr,interrupted,isImage,bashEditDiff?`; `Agent` → `status,agentId,content,...`; `ExitPlanMode` → `plan,filePath`). Não dispara para arquivo reescrito via Bash (usar `FileChanged` ou `bashEditDiff`).
13. `bashEditDiff` (v2.1.269+, beta): `changedFiles` (≤200), `files` (≤5 diffs, `created`/`deleted`), `moreFiles`, `unavailable`, `skipped`, `shared`. Só gravado em auto/bypassPermissions, a não ser `"bashEditDiffEnabled": true` nos settings. Arquivos gitignored não aparecem.
14. `SubagentHandback` (v2.1.271+, auto mode): relatório do subagente vai por esse tool; `last_assistant_message` do `SubagentStop` e `content` do `Agent` NÃO trazem o relatório — casar `PostToolUse` em `SubagentHandback` e ler `tool_input.message`.
15. `SubagentStop`: agentes internos (/btw, prompt suggestions) também disparam; `agent_type` = nome do agente da sessão (`--agent gabriel` → "gabriel"), vazio só sem agente. Matcher nomeado não casa vazio; omitido/""/"*" casa.
16. `SessionEnd`: orçamento 1.5 s; setar `timeout` em CADA hook (um sem timeout fica em 1.5 s mesmo se outro subir o orçamento, máx 60 s); `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS` sobe o orçamento e vira timeout per-hook (v2.1.268+). JSON descartado.
17. `Notification`: matchers `permission_prompt|idle_prompt|...`; no terminal `permission_prompt` só após ~6 s sem digitar; em Desktop/VS Code (hosts SDK) ~6 s após o pedido, sem adiar por digitação, e não dispara se já respondido; `CLAUDE_CODE_DISABLE_PERMISSION_PROMPT_NOTIFY_HOOKS=1` desliga nesses hosts. `osascript` no macOS exige permissão de notificação para o Script Editor (senão falha em silêncio) — testar com `osascript -e 'display notification "test"'` e habilitar em Ajustes > Notificações. Alternativa: `terminalSequence` OSC 777 (só terminal interativo).
18. `PreCompact`/`PostCompact`: `trigger` manual/auto; `PostCompact.compact_summary` é memória de longo prazo de graça. `InstructionsLoaded`: `file_path`, `memory_type`, `load_reason`; não dispara para AGENTS.md lido direto. `ConfigChange`: `source`, `file_path`. `StopFailure`: output ignorado.
19. Timeouts default: 600 s command/http/mcp_tool; 30 s prompt e em UserPromptSubmit/Pre/PostModelSwitch; 60 s agent; 10 s MessageDisplay. Hook com timeout em PreToolUse não bloqueia; em PreModelSwitch bloqueia.
20. Matchers: `""`/`*`/omitido = tudo; só [A-Za-z0-9_- ,|] = strings exatas; qualquer outro char = regex não ancorada (`Edit.*` casa `NotebookEdit`). MCP: `mcp__<server>__<tool>` ou `mcp__<server>__.*`. Case-sensitive. Matcher em evento sem suporte é ignorado.
21. Hooks rodam em paralelo, sem /dev/tty, com as permissões do usuário; mesmo handler em vários settings roda uma vez; hooks de settings rodam dentro de subagentes; `once: true` só em skill frontmatter e só removido por run bem-sucedido; hooks em frontmatter de subagente do projeto exigem trust dialog aceito (-p não conta). `disableAllHooks: true` desliga tudo. `/hooks` é somente leitura. Debug: `claude --debug` (log em ~/.claude/debug/<session-id>.txt).
22. Padrão babel-os: um `log_event.py` para todos os eventos (stdin → json.loads → append em memoria/eventos.jsonl → exit 0, stdout vazio, exceções capturadas); `session_start.py` imprime texto puro rápido; `refinar_memoria.py` no Stop sem nenhum JSON; `"bashEditDiffEnabled": true` para o dashboard ver mudanças via Bash; `SubagentHandback` coberto pelo matcher `*` do PostToolUse; `Setup`+`--init-only` para a primeira ativação.
