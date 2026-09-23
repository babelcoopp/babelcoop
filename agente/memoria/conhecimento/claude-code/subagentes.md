---
id: subagentes
type: knowledge
title: Claude Code 2.1.280 — subagentes
tags: [claude-code, configuracao, knowledge, subagentes]
confidence: 0.9
status: active
source: dossier
sources: ["https://code.claude.com/docs/en/sub-agents.md", "https://code.claude.com/docs/en/agents.md", "https://code.claude.com/docs/en/agent-teams.md", "https://code.claude.com/docs/en/cross-session-messaging.md", "https://code.claude.com/docs/en/agent-view.md", "https://code.claude.com/docs/en/hooks.md", "https://code.claude.com/docs/en/settings-reference.md", "https://code.claude.com/docs/en/tools-reference.md"]
pinned: false
created: "2026-09-22T23:39:41-03:00"
updated: "2026-09-22T23:39:41-03:00"
version: 1
hash: 1ead9b1b2e6214407b89c386d9a9a629e1360a9adec89f4ea3037d3b479282f2
---
# Claude Code 2.1.280 — subagentes

Resumo verificado em 2026-09-22 contra os docs oficiais; detalhes nas fontes.

- Subagents = Markdown file with YAML frontmatter in .claude/agents/ (project) or ~/.claude/agents/ (user), scanned recursively, identity only from `name`; only `name` and `description` are required; unknown/misspelled fields (must be exact camelCase: `maxTurns`, `disallowedTools`, `permissionMode`, `mcpServers`, `omitClaudeMd`, `initialPrompt`) are silently ignored; `name` with `:` or leading `-` makes the file skipped.
- Other frontmatter: `tools`, `disallowedTools` (a specifier entry like `Bash(git push *)` removes the whole tool; use permissions.deny instead), `model` (sonnet/opus/haiku/fable/full ID/inherit), `permissionMode`, `maxTurns`, `skills` (full content preloaded), `mcpServers` (inline or by name), `hooks`, `memory` (user/project/local), `background`, `omitClaudeMd`, `effort`, `isolation: worktree`, `color`, `initialPrompt`, `experimental.cacheTtl`.
- MCP patterns: `mcp__<server>` and `mcp__<server>__*` in both `tools` and `disallowedTools`; `mcp__*` only documented in `disallowedTools`.
- `memory: project` writes `.claude/agent-memory/<name>/MEMORY.md` (first 200 lines or 25KB injected); requires auto memory on (`autoMemoryEnabled` not false, no CLAUDE_CODE_DISABLE_AUTO_MEMORY).
- Built-ins: Explore and Plan skip CLAUDE.md and cannot be resumed; Explore inherits main model capped at Opus only on the Claude API (other providers inherit directly). `general-purpose`, `claude` (default agent for background sessions) load CLAUDE.md.
- Model resolution: per-call `model` > frontmatter `model` > CLAUDE_CODE_SUBAGENT_MODEL > main model (v2.1.251+); CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1 overrides all.
- Tools filter: all subagents lose AskUserQuestion, EnterPlanMode, etc.; background subagents (default under fork mode) keep only Read, Grep, Glob, LSP, Bash, PowerShell, Edit, Write, NotebookEdit, WebFetch, WebSearch, TodoWrite, Skill, ToolSearch, EnterWorktree, ExitWorktree, Monitor, TaskStop, SendMessage, Artifact (+ SubagentHandback in auto mode) plus all MCP tools.
- Subagent starts in main cwd; `cd` does not persist between Bash calls — use absolute paths in agent bodies.
- Frontmatter hooks in project .claude/agents/ run only after the folder trust dialog is accepted; inline mcpServers likewise (debug log names `projects["<path>"].hasTrustDialogAccepted`).
- Settings hooks: `SubagentStart` (input: agent_id, agent_type; can return hookSpecificOutput.additionalContext; exit 2 does NOT block, notice goes to the subagent transcript; additionalContext is injected once at launch and re-injected only after auto-compaction) and `SubagentStop` (stop_hook_active, agent_id, agent_type, agent_transcript_path, last_assistant_message, background_tasks, session_crons scoped to parent; permission_mode; effort.level / $CLAUDE_EFFORT). Matcher = frontmatter `name`; internal agents have empty agent_type.
- CRITICAL for logging: in auto mode (default on Pro/Max/Team, v2.1.271+) the subagent's report is delivered via the `SubagentHandback` tool; `last_assistant_message` holds only closing text and PostToolUse Agent `content` holds a hand-back note. Hook `PostToolUse` matcher `SubagentHandback` and read `tool_input.message`.
- Cost: PostToolUse Agent `totalTokens`/`usage` are the final request only; with fork mode on (default interactive) responses are `async_launched` with no usage fields (only agentId, description, prompt, outputFile, resolvedModel). Use token/cost counters filtered by query_source "subagent".
- Transcripts: ~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl; deleted after `cleanupPeriodDays` (whole number, min 1, default 30, 0 fails; 3650 for long retention).
- Limits: spawn depth 3 (CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH), 20 concurrent (CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS), 15,000-token warning on combined descriptions.
- Fork (/subtask) inherits the whole conversation; /fork copies the session to a background session (agent view) — different things.
- Agent teams: experimental, off unless env CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1; with it on, any named subagent becomes a teammate. Setting "0" in user settings beats shell export, but project/local/--settings "1" still win. Files under ~/.claude/teams/ and ~/.claude/tasks/ are not config; do not pre-create. teammateDefaultModel removed (v2.1.234). Split panes do not work in the VS Code terminal.
- Task tools (TaskCreate/TaskGet/TaskUpdate/TaskList/TodoWrite) are absent by default on models other than Claude 3.x, Opus 4–4.7, Sonnet 4–4.6, Haiku 4.5 (so absent on Opus 5.x/Fable); opt in with CLAUDE_CODE_ENABLE_TODO_TOOLS=1; background and cloud sessions always have them; TaskCreated/TaskCompleted hooks need them.
- Cross-session messaging is on by default (v2.1.224+): ListAgents/SendMessage, /list-agents, `@-mention` sessions; messages are text only, never approve permissions or change config. `crossSessionInbound` accept/hold/refuse (any file); `dialogExpiry` only User or managed scope ("60s"/"5m"/"10m"/"never", default "5m"). Denying SendMessage also breaks subagent resume. Delivered messages count toward usage. `-p` workers need crossSessionInbound accept via --settings; --bare binds no socket.
- Inbox socket: default directory not documented; /tmp/cc-socks-<uid> is only a fallback; read $CLAUDE_CODE_MESSAGING_SOCKET and $CLAUDE_CODE_MESSAGING_TOKEN (auth line optional on macOS, required on Windows); message wire format beyond the auth line is not documented, so a script cannot post from the docs alone.
- Agent view (`claude agents`, research preview): requires accepting the workspace trust dialog (v2.1.225+); `claude --bg`, `claude attach/logs/stop/rm/respawn`, `claude daemon status`; `claude agents --json` lists live + working/blocked background sessions, `--all` adds completed ones — this is the only supported external interface (never ~/.claude/jobs/<id>/state.json). JSON fields: cwd, kind, startedAt, id, state (working/blocked/done/failed/stopped), pid, status (busy/waiting/idle), waitingFor, sessionId, name. `--bg --agent <unknown>` exits with `--agent '<name>' not found`.
- Notification hook types agent_needs_input/agent_completed fire ONLY while agent view is open — poll `claude agents --json --all` for a dashboard instead.
- UX trap: `←` on an empty prompt backgrounds the conversation and opens agent view; Esc undoes; disable with `leftArrowOpensAgents` in /config.
- Non-git folder (babel-os): isolation: worktree and background-session worktree isolation do not apply; parallel sessions edit the same files. No Node: npx-based MCP examples will not run.
- `subagentPromptCacheTtl` ("5m"/"1h", v2.1.242+) also covers compaction/session-title requests; precedence FORCE_PROMPT_CACHING_5M > CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL > key > ENABLE_PROMPT_CACHING_1H; 1h cache writes are billed higher.
- Keep persona Gabriel in CLAUDE.md (loads in main and all non-Explore/Plan subagents); do not use `agent:` setting as default main agent (replaces the whole system prompt); do not use omitClaudeMd on agents that talk to the user.
