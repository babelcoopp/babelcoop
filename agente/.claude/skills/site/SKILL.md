---
name: site
description: Cria um site ou landing page autocontido (um .html) em entregas/sites/ com a identidade Babel OS, pt-BR, mobile primeiro, e registra o projeto. Use quando o Marcelo pedir site, LP, página, landing.
argument-hint: "<briefing: para quem, promessa, oferta, CTA>"
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash(/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/*)
  - Bash(python3 ${CLAUDE_PROJECT_DIR}/motor/*)
  - Bash(open ${CLAUDE_PROJECT_DIR}/entregas/*)
  - Bash(open entregas/*)
---
Briefing: $ARGUMENTS

1. Leia `.claude/rules/entregas-web.md` e `memoria/perfil/marcelo.md` com a ferramenta Read. Use o "🧠 Dominic lembra" e, se precisar, `/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/recall.py --search "site LP <tema>" --k 8` para reaproveitar marca, público, depoimentos e LPs anteriores.
2. Se faltar promessa, público ou CTA, proponha os três em uma linha cada e siga com eles (não trave esperando). Pergunte no máximo 2 coisas, e só se mudarem a entrega.
3. Escreva `entregas/sites/<slug>.html`: um arquivo, CSS/JS inline, identidade Babel OS, seções: promessa, prova, oferta, CTA (WhatsApp), FAQ, rodapé.
4. `open entregas/sites/<slug>.html`; confira console e larguras 390/1280. Se a página for grande (> 600 linhas) ou pública, delegue a construção ao agente `construtor-web` e a revisão ao `critico`.
5. Registre: `/usr/bin/python3 ${CLAUDE_PROJECT_DIR}/motor/remember.py --session ${CLAUDE_SESSION_ID} --type project --id <slug> --title "<nome>" --tags site,lp --situation delivered --files entregas/sites/<slug>.html --next "coletar depoimentos;validar textos" --text "status v1"` e uma memória com o que aprendeu do gosto dele.
6. Responda curto: link `file:///Users/marcelomaximos/Desktop/babel-os/entregas/sites/<slug>.html`, uma linha do que é, `📌 Anotei`, e UMA provocação de crescimento. Para LP de campanha grande, ofereça `/construir-lp`.
