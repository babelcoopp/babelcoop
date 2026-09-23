---
name: lembrete
description: Guarda um lembrete com data (ex. "/lembrete sexta revisar o checklist"). Ele fica no índice e, na primeira resposta de cada sessão, o Ryan avisa os vencidos e os do dia. Use quando o Theus pedir para lembrar de algo numa data.
argument-hint: "<quando> <texto>"
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash(date)
  - Bash(date *)
---
Pedido: $ARGUMENTS

Se o cabeçalho do índice diz `⏸ PAUSADO`, responda que a memória está pausada e pare.

1. Separe a data do texto: a primeira palavra ou expressão é a data ("hoje", "amanhã", "sexta", "25/09", "2026-09-25"). Converta para `AAAA-MM-DD` a partir de hoje (dia da semana = o próximo; `date '+%Y-%m-%d %A'` se precisar).
2. Acrescente `- [ ] AAAA-MM-DD · <texto>` em "## Abertos" de `memoria/agenda.md`, em ordem de data.
3. Índice: a mesma linha em "Pendências e agenda" e a contagem de pendências sobe. Diário: `- AAAA-MM-DD HH:MM · lembrete para AAAA-MM-DD: <texto>`.
4. Responda: `📌 Anotado para dd/mm.` e o limite honesto na mesma linha: o aviso sai na primeira resposta de uma sessão aberta naquele dia ou depois; alarme fora daqui não existe.
