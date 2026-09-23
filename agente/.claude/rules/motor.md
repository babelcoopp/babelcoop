---
paths:
  - "motor/**"
  - ".claude/hooks/**"
---
# Regras técnicas do motor e do hook

- Python 3.9 do sistema (`/usr/bin/python3`): sem `match`, sem `X | Y` em tipos, sem `zoneinfo`, sem `fromisoformat` com `Z`, sem dependência externa (nem PyYAML: frontmatter é YAML-lite próprio).
- Todo script sai com `0` sempre. Erro → 1 linha em `memoria/log/errors.jsonl` + stderr curto. Nunca `sys.exit(1)`, nunca traceback em stdout.
- Hook: stdout vazio ou UM objeto JSON via `json.dumps`; `hookEventName` copiado de `payload["hook_event_name"]`; nada de texto + JSON; nada de jsonl em stdout.
- `Stop` jamais devolve `additionalContext`; só o portão devolve `decision: block`, e só depois de checar `stop_hook_active`, `agent_id`, `hook_event_name`, `config.learning_gate` e `stop_blocks[prompt_id]`.
- Appends em jsonl só por `common.append_jsonl` (flock no próprio arquivo + linha ≤ 1.000 chars + `redact()`). Escritas de gerados só por `common.write_atomic` (tmp + `os.replace`). JSON lido-modificado-gravado (turn cache) só por `common.update_json_locked` (lock lateral `<arquivo>.lock`: flock no próprio arquivo + `os.replace` perde atualizações). Leitura de JSON de `.cache/` só por `common.load_json(path, default)`. Refinador/manutenção/rebuild só sob `common.exclusive_lock("refine")` (`LOCK_EX|LOCK_NB`; `--quick` espera até 0,5 s).
- Limites de tempo dentro do Python (`subprocess.run(timeout=…)`, `time.monotonic()`): não existe `timeout`/`gtimeout` na máquina.
- Antes e depois de mudar qualquer coisa em `motor/` ou `.claude/hooks/`: `python3 motor/selftest.py` precisa passar (ele guarda a cópia aprovada em `memoria/.history/motor/`); depois `claude --debug-file /tmp/dominic-debug.txt --init-only` e procurar "hook error".
- Qualquer `@` escrito em Markdown gerado vai entre crases (`escape_at`). Nunca escrever `@/…` ou `@~/…`.
- Caminhos: sempre derivados de `os.path.dirname(os.path.abspath(__file__))` (ou de `BABEL_ROOT`, que **só** o `selftest.py` exporta para rodar tudo numa caixa em `memoria/.cache/test/root/`); nunca de `cwd` nem de `$CLAUDE_PROJECT_DIR` (vazio no Bash tool). Nunca um caminho do scratchpad da sessão de construção.
- Nunca escrever nos índices da memória automática do Claude Code (`~/.claude/projects/…/memory/`); só medir.
