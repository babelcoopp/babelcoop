---
name: site
description: Cria um site ou landing page autocontido (um .html) em entregas/sites/ com a identidade do Babel Coop, pt-BR, mobile primeiro, e registra o projeto. Use quando o Theus pedir site, LP, página ou landing.
argument-hint: "<briefing: para quem, promessa, oferta, CTA>"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - Bash(open entregas/*)
  - Bash(date)
  - Bash(date *)
---
Briefing: $ARGUMENTS

Se o cabeçalho do índice diz `⏸ PAUSADO`: construa a página sem consultar nem registrar memória e avise numa linha; se chamar `construtor-web` ou `critico`, diga no briefing "não leia `memoria/`".

1. Leia `.claude/rules/entregas.md`, a tabela de tokens de `docs/design/CONCEITO.md` e `docs/design/tokens.css`. Consulte a memória (`/consultar` o tema) para reaproveitar decisões e entregas anteriores.
2. Falta público, promessa ou CTA? Proponha os três em uma linha cada e siga com eles; pergunte no máximo 2 coisas, e só se mudarem a entrega.
3. Escreva `entregas/sites/<slug>.html`: um arquivo, CSS e JS inline, na estrutura de LP de `.claude/rules/entregas.md`. Prova só com números e depoimentos que o Theus forneceu; sem eles, o marcador `[depoimento a coletar]`.
4. Abra no navegador (Playwright ou `open`), confira o console e as larguras 390 e 1280. Página grande (mais de 600 linhas) ou pública: construção pelo `construtor-web` e revisão pelo `critico`.
5. Registre o projeto em `memoria/projetos/<slug>.md` (`situation: delivered`, `files: [entregas/sites/<slug>.html]`, próximos passos) e, se aprendeu algo do gosto do Theus, `/lembrar`. Índice e diário.
6. Responda curto: o caminho, uma linha do que é e `📌 Anotei`. LP de campanha grande: ofereça `/construir-lp`.
