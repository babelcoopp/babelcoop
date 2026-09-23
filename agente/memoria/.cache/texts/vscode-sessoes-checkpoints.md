---
id: vscode-sessoes-checkpoints
type: knowledge
title: "Claude Code 2.1.280 — VS Code, sessões e checkpoints"
tags: [claude-code, configuracao, knowledge, vscode-sessoes-checkpoints]
confidence: 0.9
status: active
source: dossier
sources: ["https://code.claude.com/docs/en/vs-code.md", "https://code.claude.com/docs/en/sessions.md", "https://code.claude.com/docs/en/checkpointing.md", "https://code.claude.com/docs/en/chrome.md", "https://code.claude.com/docs/en/artifacts.md", "https://code.claude.com/docs/en/desktop.md", "https://code.claude.com/docs/en/desktop-scheduled-tasks.md", "https://code.claude.com/docs/en/claude-directory.md", "https://code.claude.com/docs/en/hooks.md", "https://code.claude.com/docs/en/settings-reference.md", "https://code.claude.com/docs/en/statusline.md", "https://code.claude.com/docs/en/headless.md"]
pinned: false
created: "2026-09-22T23:39:41-03:00"
updated: "2026-09-22T23:39:41-03:00"
version: 1
hash: c2ca6f801f62e86cb49482dada0ae653885f6d65909073fdc8fd79bf55e6e2ef
---
# Claude Code 2.1.280 — VS Code, sessões e checkpoints

Resumo verificado em 2026-09-22 contra os docs oficiais; detalhes nas fontes.

Key facts a builder must know (VS Code / Desktop / sessions / checkpoints / Chrome / artifacts), all verified against code.claude.com docs on 2026-09-22:

- Extension id `anthropic.claude-code`, VS Code >= 1.94.0; extension bundles its own CLI; `claude` in terminal needs the standalone binary (present at ~/.local/bin/claude). Running `claude` in the integrated terminal auto-reinstalls the extension (`autoInstallIdeExtension: false` or `CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL=1` to stop).
- Extension and CLI share `~/.claude/settings.json` (hooks, permissions, env), plugins and the same conversation history (`claude --resume` continues extension chats). MCP servers live in `~/.claude.json` (user) or `.mcp.json` (project). CLI and Desktop each keep their own session list; VS Code + CLI share history; claude.ai/code: not documented.
- VS Code settings use prefix `claudeCode.`; `initialPermissionMode` is read from user settings only. On Pro/Max/Team the built-in starting mode is Auto; setting `initialPermissionMode` overrides it and disables plan-mode restore on resume. `preferredLocation: sidebar` puts Claude in the secondary sidebar and enables the Status Bar button. Keep `lockEditorGroups`, `attachOpenFile`, `archiveInactiveSessions` (14 days default) in mind.
- URI handler: `open "vscode://anthropic.claude-code/open?prompt=<url-encoded>"` (prompt prefilled, not sent; `session=<id>` to resume).
- Built-in `ide` MCP server sends editor selection + open-file path on every prompt (`⧉ Selected N lines from <file>` in transcript); a `Read` deny rule for `.env`-style files blocks both.
- HTML preview in VS Code is not covered by Claude Code docs: use the VS Code integrated browser (`file://` supported; `workbench.browser.newTabPlacement: sideGroup`, `workbench.browser.autoReloadOnFileChange: true`) or `python3 -m http.server 8765 --bind 127.0.0.1` (localhost links open in the integrated browser). Live Preview extension is 'still under development'. Embed data in the generated HTML rather than fetching JSONL from `file://`.
- Sessions: `claude --continue`, `claude --resume [<id>|<name>]`, `/rename`, `/branch`; `-p`/SDK sessions are outside the picker and `--continue`. Only names and AI-generated titles are resume handles; the default display name (`babel-os-3f`) is not. Picker and `/resume` do not restore saved permission mode; `--continue`/`--resume <id>` do (except bypassPermissions/plan).
- Transcripts: `~/.claude/projects/<project>/<session-id>.jsonl`, project slug for this repo `-Users-marcelomaximos-Desktop-babel-os`. JSONL format is internal and changes between versions; use `/export`, `claude -p --output-format json` (`.result`, `.session_id`), or hook `transcript_path`. Plaintext at rest.
- Retention: `cleanupPeriodDays` default 30, integer min 1, `0` errors, doc suggests `3650`; sweep also removes `file-history/` checkpoint snapshots; auto memory `projects/<project>/memory/` is not swept; sweep skipped in `claude -p --bare`, paused (warning in `/status`) when settings can't be parsed. `desktopSessionCleanupPeriodDays` deletes only when older than both.
- Auto memory: `MEMORY.md` index loads only its first 200 lines / 25 KB at session start; topic files on demand; `/memory` or `autoMemoryEnabled`.
- Hooks (critical for the logger): SessionEnd default budget is 1.5 s (exit, /clear, interactive /resume); per-hook `timeout` raises it up to 60 s; `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS` (ms) overrides; timed-out hooks are cancelled and output discarded; SessionEnd has no decision control, JSON output discarded, stderr shown only. `reason` values: `clear`, `resume`, `logout`, `prompt_input_exit`, `other`. So SessionEnd must only copy `transcript_path`; never run `claude -p --resume` inside it (summaries go to launchd/manual scripts).
- `transcript_path` may lag the in-memory conversation when a hook fires; use `last_assistant_message` on Stop/SubagentStop for the final assistant text.
- Common hook input fields: `session_id`, `prompt_id`, `transcript_path`, `cwd`, `scratchpad_dir`, `permission_mode` (`default`,`plan`,`acceptEdits`,`auto`,`dontAsk`,`bypassPermissions`; Manual arrives as `default`), `effort.level` (ultracode = `xhigh`), `hook_event_name`, plus `agent_id`/`agent_type` in subagents. Hook processes inherit env except OTEL_*.
- Hook timeouts: 600 s default for command hooks; 30 s on UserPromptSubmit (timeout discards `additionalContext`), PreModelSwitch, PostModelSwitch; 10 s on MessageDisplay.
- Status line: `session_name` is absent when there is neither a custom name nor an AI title; scripted `claude -p` sessions get no AI title; use `jq -r '.session_name // "sem nome"'`.
- Checkpoints: automatic before each turn-starting prompt, 100 most recent, stored in `~/.claude/file-history/<session>/`; `/rewind` or `Esc Esc`; NOT tracked: Bash changes (rm/mv/python scripts), background subagent edits, external edits, symlinks. Git must cover the memory folder (auto-commit on Stop/SessionEnd is the pattern; keep the SessionEnd part fast).
- Chrome: `claude --chrome`, extension >= 1.0.36, requires `/login` subscription (API key disables it), MCP server name `claude-in-chrome`; 'Enabled by default' costs context. In VS Code use `@browser ...`.
- Artifacts: single HTML/MD page published to a private claude.ai URL, 16 MiB, strict CSP (no external images, scripts only from cdnjs/jsdelivr/tailwind/jquery/unpkg, fonts only Google Fonts), needs `/login` subscription. Republishes silently after first approval except when a runtime capability is declared or the artifact was shared publicly / with latest-version chosen. `/design` needs v2.1.265+. Disable with `"enableArtifact": false`, `CLAUDE_CODE_DISABLE_ARTIFACT=1` or `Artifact` in `permissions.deny`. Design tokens in CLAUDE.md (heading `## Design system` is only an example).
- Desktop: reads the same settings files; `permissions.defaultMode` values `default`,`acceptEdits`,`plan`,`auto`,`bypassPermissions`; Browser pane opens static HTML/PDF/images (`Cmd+Shift+B`). `/desktop` moves a CLI session to the app (macOS/x64 Windows, subscription login only). `.claude/launch.json` entry for this machine: `runtimeExecutable: "python3"`, `runtimeArgs: ["-m","http.server","8765","--bind","127.0.0.1"]`, `port: 8765`, `autoPort: false` (true would pass another port via `PORT`, which http.server ignores); `env` is committed, no secrets.
- Desktop scheduled tasks (Routines → New routine → Local, Desktop 1.1.5368+): prompt at `~/.claude/scheduled-tasks/<task-name>/SKILL.md` (frontmatter `name`, `description`); only run while the app is open and the machine awake; one catch-up run for the most recent missed slot; run history shows skip reasons; delete dialog has 'Also delete files on disk'. For deterministic refinement scripts, macOS `launchd` calling python3 is more robust; guard scheduled prompts with time checks.
