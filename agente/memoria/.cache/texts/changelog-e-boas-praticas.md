---
id: changelog-e-boas-praticas
type: knowledge
title: Claude Code 2.1.280 — changelog e boas práticas
tags: [changelog-e-boas-praticas, claude-code, configuracao, knowledge]
confidence: 0.9
status: active
source: dossier
sources: ["https://code.claude.com/docs/en/changelog.md", "https://code.claude.com/docs/en/best-practices.md", "https://code.claude.com/docs/en/debug-your-config.md", "https://code.claude.com/docs/en/how-claude-code-works.md", "https://code.claude.com/docs/en/costs.md", "https://code.claude.com/docs/en/model-config.md", "https://code.claude.com/docs/en/settings-reference.md", "https://code.claude.com/docs/en/memory.md", "https://code.claude.com/docs/en/hooks.md", "https://code.claude.com/docs/en/statusline.md", "https://code.claude.com/docs/en/commands.md"]
pinned: false
created: "2026-09-22T23:39:41-03:00"
updated: "2026-09-22T23:39:41-03:00"
version: 1
hash: 8f7a8b347ae8700389c836a54265214c5f0665fc9d6bc0e5d703732a91700a69
---
# Claude Code 2.1.280 — changelog e boas práticas

Resumo verificado em 2026-09-22 contra os docs oficiais; detalhes nas fontes.

Claude Code 2.1.280 (2026-09-22), native binary, no Node. Key facts for the babel-os builder:

1. Hooks live only under the `hooks` key of a settings file (`~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`); no standalone hooks file. Hooks MERGE across files (never replace); managed hooks cannot be removed. `disableAllHooks: true` turns off hooks + custom status line + file suggestion.
2. Structure: event -> array of `{ "matcher", "hooks": [handlers] }`. `matcher` is a STRING (`"Edit|Write"`, `"*"`, omitted); an array rejects the whole settings file. Case-sensitive tool names.
3. Handler fields: `type` (`command`/`http`/`mcp_tool`/`prompt`/`agent`), `command`, `args`, `async`, `asyncRewake`, `timeout` (s; default 600, 30 on UserPromptSubmit, 1.5 s shared budget on SessionEnd), `if`, `statusMessage`, `shell`.
4. Path placeholder: `${CLAUDE_PROJECT_DIR}` = project root where the session started (does not follow worktrees; input `cwd` does). Exported as env var `CLAUDE_PROJECT_DIR` too. Use exec form: `"command": "python3", "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/log.py"]`; in shell form wrap the placeholder in double quotes.
5. Common input fields (stdin JSON): `session_id`, `prompt_id`, `transcript_path`, `cwd`, `scratchpad_dir` (2.1.257+), `permission_mode`, `effort.level`, `hook_event_name`; in subagents `agent_id`, `agent_type`.
6. UserPromptSubmit input: `prompt` (pasted text expanded). Output: `decision: "block"` (erases prompt), `reason`, `hookSpecificOutput.additionalContext`, `sessionTitle`, `suppressOriginalPrompt`. Plain stdout AND additionalContext both reach Claude as a system reminder named after the hook.
7. PostToolUse input: `tool_name`, `tool_input`, `tool_response` (schema per tool), `tool_use_id`, optional `duration_ms`; with `bashEditDiffEnabled` (2.1.269+) `tool_response.bashEditDiff`. Output: `updatedToolOutput` (must match tool shape), `additionalContext`, `decision`/`reason`, `classifierContext`.
8. SessionStart: matchers `startup|resume|clear|compact|fork`; input `source` + optional `model`, `agent_type`, `session_title`; on resume/fork: `seconds_since_last_response`, `context_tokens`, `prompt_cache_likely_expired`, `estimated_cache_write_usd`. Output: `additionalContext`, `initialUserMessage` (-p only), `sessionTitle` (= /rename), `watchPaths`, `reloadSkills`. Runs in background at launch; Claude's first reply waits. `CLAUDE_ENV_FILE` lets it persist `export` lines for later Bash.
9. SessionEnd: input `reason` in `clear|resume|logout|prompt_input_exit|other` (matcher filters by it); no decision control; 1.5 s default shared budget -> set per-hook `timeout` (raises budget up to 60 s) or `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`.
10. PreCompact/PostCompact: matchers `manual|auto`; PreCompact `trigger` + `custom_instructions` (null when none), can block; PostCompact `trigger` + `compact_summary` (the generated summary; store it in the memory substrate), no decision control.
11. Stop: `stop_hook_active`, `last_assistant_message`, `background_tasks`, `session_crons`; `{"decision":"block","reason":...}`; max 8 consecutive blocks. SubagentStop adds `agent_id`, `agent_type`, `agent_transcript_path`; matcher naming types does not match empty `agent_type`.
12. Exit codes: 0 = ok (stdout parsed as JSON only if it starts with `{` and ends with `}`; plain stdout becomes context ONLY on UserPromptSubmit, UserPromptExpansion, SessionStart, PostModelSwitch, otherwise debug log). Stderr on exit 0 -> debug log only. Exit 2 = block (stderr as reason; PostToolUse shows stderr to Claude). Exit 1 = non-blocking `hook error` notice. Since 2.1.248 malformed `{...}` is a hook error. Output strings capped at 10,000 chars.
13. Async (`"async": true`): only on `type: "command"`; cannot block or decide; output delivered on next turn; no timeout once started; killed at `claude -p` teardown. Fine for loggers, never for a Stop gate.
14. Loggers should print nothing (or `{}`) and exit 0.
15. `language` setting (Any file, string, unvalidated): `"language": "portuguese"` makes Claude always answer in Portuguese.
16. Status line: `statusLine: {type:"command", command, padding, refreshInterval, hideVimModeIndicator}`; script must be `chmod +x` (or invoked via `python3 path`); updates debounced 300 ms; prefer `workspace.current_dir` over `cwd`; `workspace.project_dir` = launch dir. Key fields: `model.display_name`, `effort.level`, `context_window.used_percentage`, `cost.total_cost_usd`, `prompt_cache.warm`, `rate_limits.five_hour.used_percentage`, `session_name`; many can be missing/null.
17. Auto memory: `~/.claude/projects/<project>/memory/`, `<project>` derived from the git repo, or the project root when not a git repo (babel-os case); override with `autoMemoryDirectory` (absolute or `~/`). `MEMORY.md` loads only first 200 lines/25KB; Claude Code reminds near the limit and errors over it.
18. CLAUDE.md: keep < 200 lines; `@imports` load at launch (cost context); HTML comments stripped; `.claude/rules/*.md` with only `paths:` frontmatter honored; AGENTS.md read only when no CLAUDE.md exists (2.1.277+).
19. Effort: Opus 5.5 (new default, `medium`); `/effort` saves per model into `modelSettings`; `ultracode` is a settings key (`"ultracode": true`), not an `effortLevel` value; `maxEffortLevel` caps.
20. Todo/Task tools (`TodoWrite`, `TaskCreate...`) absent on Opus 4.8+/Sonnet 5/Fable 5 unless `CLAUDE_CODE_ENABLE_TODO_TOOLS=1`, so `TaskCreated`/`TaskCompleted` hooks are useless there.
21. Project `.claude/settings.json`: `defaultMode: "auto"/"bypassPermissions"` ignored; `env` cannot set `CLAUDE_CONFIG_DIR`/`TMPDIR`.
22. Debug: `/hooks`, `/context`, `/memory`, `/doctor`, `claude doctor`, `claude --debug` (log `~/.claude/debug/<session-id>.txt`), `claude --safe-mode`, `CLAUDE_CONFIG_DIR=/tmp/claude-clean claude`.
23. `/remember` is not a documented command; memory is saved via natural language or `/memory`.
