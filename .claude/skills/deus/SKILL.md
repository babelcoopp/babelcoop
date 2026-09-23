---
name: deus
description: Protocolo DEUS — CRIADOR. Transforma uma missão em criação demonstrada, com pasta exclusiva em .deus/<slug>/ (MISSAO, CAPSULA, RODADAS, ENTREGA), persistência orientada à conclusão, seis movimentos e selo adversarial. Use quando o Theus invocar DEUS, pedir uma missão de criação ou descoberta, um salto de arquitetura ou uma ponte experimental para uma capacidade distante.
argument-hint: "<missão: o que criar · recursos · o que demonstra a conclusão>"
---
Missão: $ARGUMENTS

Leia o protocolo integral em [PROMPT.md](PROMPT.md) e aplique-o à missão. DEUS é o nome do método: você continua sendo o Ryan, com as regras, linguagens e permissões deste projeto.

Se o cabeçalho do índice diz `⏸ PAUSADO`: trabalhe só dentro de `.deus/<slug>/` (missão, cápsula, rodadas, entrega), sem mexer no índice, sem `/decidir` e sem `/lembrar`, e avise numa linha que a missão ainda não está no índice.

## Adaptação ao Ryan

1. **Pasta e identificador:** missão nova usa `.deus/<slug>/` na raiz do repositório e o identificador `babel-coop/<slug>`, com o mesmo slug (minúsculas ASCII com hífen). A `.deus/missao-design/` (identificador `babel-coop/design-2030`) é exceção histórica. Antes de escrever, confira que a pasta não pertence a outra missão nem a outro agente.
2. **Missão:** `MISSAO.md` pelo molde [MODELO-MISSAO.md](MODELO-MISSAO.md), com o pedido literal do Theus.
3. **Cápsula:** missão nova grava `CAPSULA.json` no formato base do protocolo ([modelo-CAPSULA.json](modelo-CAPSULA.json)). Ao retomar uma missão cuja cápsula está em outro formato (a `missao-design` usa JSON plano), preserve o formato dela e reconcilie os mesmos fatos. Aqui não há hooks: leia a cápsula antes de cada ação de trabalho da missão e regrave depois de cada resultado. Anote no `RODADAS.md` que a modalidade é "somente prompt".
4. **Memória:** a missão aparece no índice, em `## Missão DEUS`, no formato de linha de `.claude/rules/memoria.md` (`- Ativa: …` e `- Última: …`). Atualize ao abrir, a cada mudança de etapa e ao fechar (a que fecha vira a `Última`). Decisões da missão que valem fora dela vão para `/decidir`; descobertas que o Ryan deve lembrar, para `/lembrar`.
5. **Salto:** quando o Theus pedir hipótese ousada ou capacidade distante, use também [SALTO.md](SALTO.md).
6. **Delegar:** fatias independentes podem ir ao agente `deus-criador` ou a um workflow. Missão inteira delegada: o `deus-criador` vira o dono da pasta enquanto trabalha, e você não escreve nela até ele devolver.

## Antes de encerrar por iniciativa própria

Resta aceite aberto? Existe ação útil autorizada? Há recursos? Então execute. Cancelamento, cota, permissão ou decisão do Theus suspendem sem concluir: deixe a cápsula com a próxima ação e o índice atualizado.
