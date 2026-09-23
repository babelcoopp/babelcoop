# Protocolo de memória do organismo

## O que registrar (sempre via `python3 motor/remember.py`)
- preference: como o Marcelo gosta das coisas (formato, tom, ferramentas, horários). Sempre com **Por quê** e **Como aplicar**.
- profile: fatos estáveis sobre ele, o Reino, sócios, clientes, eventos (o essencial vai direto em `memoria/perfil/marcelo.md`).
- fact: dados do negócio, datas, números, nomes, links (sem segredos).
- decision: toda escolha com alternativas descartadas e o porquê (`--type decision` ou `/decidir`).
- project: cada entrega (site, LP, sistema, pesquisa): situação, arquivos, próximos passos. Um arquivo por projeto, atualizado (`--id <slug>`), não duplicado.
- learning: o que funcionou ou não em uma entrega; erros de ferramenta e a saída encontrada.
- idea: o que o Marcelo cogitou e ainda não pediu (é ouro para o "puxar para o maior"). Confiança 0.5.
- reference / knowledge: links, nomes, números e pesquisas com fonte.

## Quando
- Assim que a informação aparece, no mesmo turno. Não acumule para o fim.
- Antes de encerrar um turno que mudou arquivos em `entregas/` ou criou algo novo. Se o organismo cobrar (uma vez por pedido), registre e encerre; se não houver nada novo de verdade, responda "nada novo a registrar" e pare.
- Compactações e relatórios de subagentes são guardados sozinhos; não os copie.

## Como
- Título curto e específico ("Marcelo prefere sites em arquivo único", não "preferências"). Um fato por memória.
- Texto em 1–3 frases + "Por quê" + "Como aplicar". Tags em minúsculas, 2–5; inclua o projeto quando houver (`--project <slug>`).
- Confiança: 0.9 quando ele disse com todas as letras; 0.6 quando você inferiu; 0.5 ideia.
- Links: cite outros ids com `[[id]]` no corpo quando houver relação; o refinador transforma em arestas do grafo.
- Não duplique: se o "Dominic lembra" já traz o fato, atualize (o script imprime `similar_to` quando existe memória parecida; use `--supersedes`).
- Corrigir = nova memória com `--supersedes <id>` ou `/esquecer <id> <correção>`. Nunca apagar, nunca editar arquivos antigos de `memorias/` e `decisoes/`.
- Agenda: `python3 motor/agenda.py new --when AAAA-MM-DD --text "…"`. O organismo reinjeta na próxima sessão; não prometa alarme.

## O que NUNCA registrar
- Senhas, tokens, chaves, números de cartão, dados bancários, documentos pessoais de terceiros.
- Conteúdo integral de arquivos ou de conversas: registre o fato, não o texto.
- `@` solto: e-mails e handles entre crases (viram `@import` se ficarem soltos no índice).

## Consulta
- `python3 motor/recall.py --search "tema"` (o mesmo cérebro do "Dominic lembra", com mais resultados) · `/consultar tema` · `memoria/INDICE-completo.md` (tudo) · `/cruzar-memoria <pergunta>` para perguntas que cruzam muita coisa.

## Arquivos gerados (não edite: `INDICE.md`, `INDICE-completo.md`, `state.json`, `graph.json`, `perfil/retrato.md`, `memoria/log/*`, `dashboard/index.html`, `dashboard/data.js`)
Se parecerem errados, `/evoluir reparar` ou `python3 motor/rebuild.py` e conte ao Marcelo o que mudou.
