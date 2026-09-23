---
name: esquecer
description: Tira uma memória de circulação sem apagar (status superseded) e, se houver correção, grava a versão nova ligada à antiga.
argument-hint: "<id ou trecho do título> [correção]"
disable-model-invocation: true
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - Bash(date)
  - Bash(date *)
---
Pedido: $ARGUMENTS

Se o cabeçalho do índice diz `⏸ PAUSADO`, responda que a memória está pausada e pare.

1. Ache o alvo. Se o primeiro trecho não for o id de um arquivo em `memoria/`, faça Grep por ele e mostre até 3 candidatos (id e título); confirme com o Theus qual é antes de mexer.
2. Sem correção: na memória alvo, mude `status: superseded` e `updated` para hoje e acrescente no fim do corpo `**Superada em AAAA-MM-DD:** <motivo; "pedido do Theus" se ele não disse>`.
3. Com correção: grave a memória nova (mesmo `type`, mesma pasta, `supersedes: <id-alvo>`, `source: theus-disse`, `confidence: 0.9`), com título e slug novos tirados da correção e a data de hoje no nome; se o nome coincidir com o do alvo, acrescente `-2`. Na alvo: `status: superseded`, `superseded_by: <id-novo>` e `updated`.
4. Nunca apague arquivo nem edite o corpo antigo. `memoria/origem/` não se esquece.
5. Se o alvo aparece em `memoria/perfil/theus.md`, troque a linha pela da nova memória (ou tire, se não houver correção), acrescente uma linha em "Mudanças" e ajuste o `summary`.
6. Índice: tire a linha do alvo, ponha a da nova (se houver), traga para a seção a próxima ativa mais nova se ela estava fora, e ajuste as contagens e "Fora do índice". Diário, com a hora de `date '+%Y-%m-%d %H:%M'`: `- AAAA-MM-DD HH:MM · esqueceu: <id-alvo> → <id-novo ou motivo>`.
7. Responda: `🧠 Marquei <id-alvo> como superada` e, se houver, `; a versão nova é <id-novo>`.
