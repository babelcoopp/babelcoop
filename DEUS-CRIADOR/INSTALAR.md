# DEUS — CRIADOR · pacote portátil (2026-09-23)

Clone autocontido do protocolo do Theus (`Dominic/saber/personalizacao/deus-criador/PROMPT.md`, revisão de 2026-09-22 com prioridade integral na conclusão). Serve a qualquer agente: como **skill** (Claude Code, Codex), como **agente** (subagente do Claude Code) ou como **system prompt** colado (ChatGPT, Gemini, Claude.ai, modelos locais). Não carrega leis, segredos nem permissões da casa Dominic.

## O que há na pasta

| arquivo | uso |
|---|---|
| `PROMPT.md` | o protocolo inteiro — cole como system prompt ou peça ao agente para ler |
| `skill/deus/SKILL.md` + `skill/deus/PROMPT.md` + `skill/deus/agents/openai.yaml` | skill instalável (Claude Code e Codex); `SKILL-original-dominic.md` é a versão condensada que o [[Dominic]] escreveu (foco em salto/ponte experimental) |
| `agents/deus-criador.md` | subagente do Claude Code (`~/.claude/agents/`) |
| `MODELO-MISSAO.md` | molde para fixar pedido e aceites antes de começar |
| `capsula-claude-code/{hooks.json, CAPSULA.json, RETOMAR.md}` | reinjeção da cápsula por hooks (opcional) |

## 1. Claude Code — skill global (`/deus`)

```
cp -R ~/Desktop/DEUS-CRIADOR/skill/deus ~/.claude/skills/deus
```

Em qualquer projeto: `/deus <missão>` (ou "aplique DEUS à missão: …"). Só num projeto: copie para `<projeto>/.claude/skills/deus/`.

## 2. Claude Code — subagente global

```
cp ~/Desktop/DEUS-CRIADOR/agents/deus-criador.md ~/.claude/agents/deus-criador.md
```

Depois: "use o agente deus-criador para: <missão>" — ele nasce com o protocolo inteiro como instrução de sistema e usa as ferramentas e permissões da sessão.

## 3. Claude Code — protocolo como system prompt da sessão

```
claude --append-system-prompt-file ~/Desktop/DEUS-CRIADOR/PROMPT.md
```

Com reinjeção da cápsula (opcional): crie `<projeto>/.deus/missao/` com os três arquivos de `capsula-claude-code/` e abra `claude --append-system-prompt-file ~/Desktop/DEUS-CRIADOR/PROMPT.md --settings ~/Desktop/DEUS-CRIADOR/capsula-claude-code/hooks.json`. O hook só LÊ a cápsula (`cat`); quem a atualiza é o agente. Antes de chamar a reinjeção de "ativa", faça o teste A→B descrito no protocolo (cápsula com identificador A, uma chamada, cápsula B, outra chamada, conferir no registro dos hooks).

## 4. Codex (OpenAI)

Skill: copie `skill/deus/` para a pasta de skills do Codex (`~/.codex/skills/deus/` [verificar o caminho na versão instalada]); a interface está em `agents/openai.yaml` (`$deus`). Ou cole o `PROMPT.md` no `AGENTS.md` do projeto / nas instruções do agente.

## 5. Qualquer outro agente (ChatGPT, Gemini, Claude.ai, local)

Cole o conteúdo de `PROMPT.md` como system prompt (ou primeira mensagem) e em seguida a missão: *"Criar/descobrir: … · Recursos e local: … · O que demonstrará a conclusão: …"*. Sem ferramentas de arquivo, o agente mantém missão, cápsula, rodadas e entrega no próprio texto da conversa (mesmos campos).

## Como usar (o mínimo)

1. Diga o que quer criar e como saberá que está pronto (use `MODELO-MISSAO.md` se quiser fixar aceites antes).
2. O agente abre a pasta exclusiva da missão com `MISSAO.md`, `CAPSULA.json`, `RODADAS.md`, `ENTREGA.md` e começa pela prova que mais pode mudar a arquitetura.
3. Ele continua enquanto houver aceite aberto, ação autorizada e recursos; para em cancelamento, cota, permissão ou decisão sua — sempre com a cápsula pronta para retomar.
4. A entrega fecha só com prova adversarial por critério; o que não fechou fica declarado com a próxima ação.

Instalado nesta máquina em 2026-09-23 (se as cópias acima foram feitas): `~/.claude/skills/deus/` e `~/.claude/agents/deus-criador.md`. Para remover: apague os dois.
