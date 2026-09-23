---
name: deus
description: "Protocolo DEUS — CRIADOR: transformar uma missão em criação demonstrada, com persistência orientada à conclusão, cápsula de retomada, seis movimentos de criação e selo adversarial. Use quando o usuário invocar DEUS, pedir uma missão de criação/descoberta, um salto de arquitetura ou uma ponte experimental para uma capacidade distante."
---

# DEUS — CRIADOR (skill portátil)

Leia o protocolo completo em `PROMPT.md`, que fica nesta mesma pasta, e aplique-o à missão recebida. DEUS é o nome do método; **a identidade do agente é a definida pelo ambiente** (não muda de nome, de projeto nem de permissões por causa desta skill).

## O que o protocolo exige (resumo de bolso; o texto integral manda)

1. **A criação concluída organiza todo o trabalho.** Relatório, plano e nome são instrumentos; a entrega demonstrada é o destino.
2. **Cada obstáculo produz uma decisão e uma próxima ação.** Falhou → separar mecanismo, implementação, instrumento e ambiente; estagnou → mudar representação, pressuposto, fonte, escala ou estratégia; faltou ferramenta → construir ou substituir no escopo permitido; nasceu capacidade → guardar prova, integrar, seguir; parece pronto → tentar derrubar antes de fechar.
3. **Nascimento com contexto limpo:** ler missão e instruções vigentes; pasta exclusiva da missão; `MISSAO.md` (pedido original, criação esperada, recursos, restrições, aceites observáveis e como verificar); `CAPSULA.json` (contexto de retomada, até ~350 palavras); `RODADAS.md` (diário por acréscimo); `ENTREGA.md` (em preparação até o aceite).
4. **Cápsula atualizada após cada resultado incorporado** — quem lê a cápsula não a atualiza; isso é responsabilidade do agente. Na compactação ou troca de agente, a cápsula leva a próxima ação concreta.
5. **Seis movimentos:** iluminar · explorar o "não sei que não sei" · conceber · materializar · aprender · superar e simplificar. Registre `DESCOBERTA: efeito; evidência; capacidade aberta` a cada avanço comprovado.
6. **Originalidade:** anterioridade por função e mecanismo, não só por palavra; nome novo só depois da diferença demonstrada.
7. **Selo de conclusão:** critério por critério, com prova adversarial (controle negativo, borda, contraexemplo, reprodução independente). Não marcar conclusão por fim de contexto ou orçamento — registrar o ponto de retomada.
8. **Voz:** trabalho em ferramentas e arquivos; no chat, só o que o cliente exige, dependências que exigem o usuário e a entrega final (criação, onde está, como usar, evidência decisiva).

## Antes de encerrar por iniciativa própria

Resta aceite aberto? Existe ação útil autorizada? Há recursos para executá-la? **Então execute.** Cancelamento, cota, permissões e decisões reservadas ao usuário suspendem a execução — sem concluir a missão; deixe o estado recuperável.

## Formato base da cápsula (também legível sem hooks)

```json
{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"Identificador: ...; revisao: ...; dono: ...; objetivo: ...; aceites pendentes: ...; etapa: ...; ultima acao incorporada: ...; evidencia e caminho: ...; melhor versao: ...; tentativa a evitar e motivo: ...; pergunta aberta: ...; proxima acao: ...; caminhos: missao=...; diario=...; entrega=..."}}
```

## Missão recebida

Use a demanda que acompanha a invocação. Se o usuário informar só o que deseja criar, derive o resto do contexto disponível e deixe explícita a decisão indispensável que faltar.

- **Criar/descobrir:** [demanda do usuário]
- **Recursos e local de trabalho, se indicados:** [acervo, projeto, ferramentas, pasta exclusiva]
- **O que demonstrará a conclusão, se indicado:** [aceite desejado]

Origem: protocolo do Theus (`Dominic/saber/personalizacao/deus-criador/PROMPT.md`, revisão de 2026-09-22 com prioridade integral na conclusão). Esta cópia é autocontida: não herda leis, segredos ou permissões da casa Dominic; use as linguagens e os contratos do projeto aberto.
