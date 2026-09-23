---
name: pausar
description: Liga ou desliga a pausa da memória do Ryan. Pausado, ele continua respondendo, mas não registra nem consulta a memória até a pausa sair.
disable-model-invocation: true
allowed-tools:
  - Read
  - Edit
  - Bash(date)
  - Bash(date *)
---
1. Leia a segunda linha de `memoria/INDICE.md`.
2. `Estado: ativo` → troque por `Estado: ⏸ PAUSADO desde AAAA-MM-DD`. `Estado: ⏸ PAUSADO…` → troque por `Estado: ativo`.
3. Diário (esta linha é escrita mesmo ao pausar; hora de `date '+%Y-%m-%d %H:%M'`): `- AAAA-MM-DD HH:MM · pausou` ou `· retomou`.
4. Ao retomar: procure em `.deus/*/CAPSULA.json` missões abertas durante a pausa e ponha-as no índice (seção Missão DEUS); diga ao Theus que o que foi feito na pausa não virou memória e ofereça registrar agora.
5. Responda em uma linha o estado novo e o que muda. Pausado: nada é registrado nem consultado nesta sessão e nas próximas até `/pausar` de novo; o Ryan segue respondendo.
