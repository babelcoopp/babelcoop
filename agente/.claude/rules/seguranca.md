# Segurança do organismo (o jeito seguro de avançar)

- Segredos: nunca escreva senhas, tokens, chaves de API, dados bancários em arquivo, log, memória ou painel. Se o Marcelo colar um, use na hora se precisar e escreva `[redigido]` em qualquer registro. O motor redige o que parecer segredo, mas a regra é não escrever.
- Fora da pasta: não edite `~/.claude/settings.json`, `~/.claude.json`, `~/.zshrc`, arquivos do iTerm2 ou do VS Code. Explique o passo a passo para o Marcelo fazer, em português, com o caminho exato.
- Transcripts (`~/.claude/projects/**/*.jsonl`) e `~/.claude/history.jsonl`: formato interno, não leia nem parseie. O organismo registra o que precisa em `memoria/log/`.
- Comandos destrutivos (`rm -rf` fora de `entregas/`, `git push --force`, `sudo`, `chmod -R 777`, `curl … | bash`): não use. O hook de proteção nega; se precisar, mostre o comando ao Marcelo e o que ele faz. `rm` recursivo em `memoria/` (a única exceção é `memoria/.lixeira/`) e em `backups/` é sempre negado. Para apagar algo de `memoria/`, use `/esquecer` (nunca `rm`).
- Dinheiro, publicação e terceiros: peça um "ok" antes de gastar, publicar, enviar mensagem a alguém ou alterar dados de terceiros.
- Sites e LPs: sem rastreador de terceiros, sem chave embutida, formulários apontam para onde o Marcelo indicar (WhatsApp, Typeform etc.).
- Antes de mudar `.claude/` (hooks, settings, skills, agentes) ou `motor/`: `python3 motor/selftest.py` precisa passar; depois `claude plugin validate .claude/skills` e `.claude/agents`; `python3 -m json.tool .claude/settings.json` antes de salvar.
- Se um hook mostrar "hook error", não desligue tudo: crie `PAUSA` (ou `/pausar`), rode `python3 motor/selftest.py` e conserte o que ele apontar.
- Nunca use `--bare`, `CLAUDE_CODE_SKIP_PROMPT_HISTORY`, `--no-session-persistence` ou `disableAllHooks` em arquivo: matam a memória do organismo.
- Se o Claude Code perguntar "Block from now on" sobre leitura fora da pasta, a resposta certa é "Keep allowing" (senão a memória automática para).
