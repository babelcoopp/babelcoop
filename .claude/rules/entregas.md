---
paths:
  - "entregas/**"
---
# Padrão de entregas (sites, LPs, sistemas)

- **Site ou LP:** um `.html` autocontido em `entregas/sites/<slug>.html` (CSS e JS inline, sem build, sem `fetch()` de arquivo local). pt-BR em tudo: `<html lang="pt-BR">`, `<title>` de 2 a 4 palavras, botões e textos.
- **Identidade:** a do Babel Coop, em `docs/design/CONCEITO.md` (tabela de tokens) e `docs/design/tokens.css`. Leia antes de desenhar; não invente paleta nem fonte.
- **Mobile primeiro:** 16 px de margem lateral, sem rolagem horizontal, alvos de toque ≥ 44 px, texto ≥ 16 px, contraste ≥ 4.5:1, `prefers-reduced-motion` respeitado. Conferir em 390 px e 1280 px.
- **Sem** rastreador de terceiros, chave embutida ou formulário que envie para servidor desconhecido.
- **Sistema:** `entregas/sistemas/<slug>.md` com problema em 1 frase → quem usa → fluxo principal passo a passo → telas (o que cada uma mostra) → dados (entidades e campos) → integrações → MVP → riscos → métricas → onde entra no Babel Coop. Sem prazo em dias ou semanas: fases são ordem de construção. Protótipo clicável opcional em `entregas/sistemas/<slug>-prototipo.html`.
- **Antes de entregar:** abrir no navegador (Playwright ou `open`), console sem erro, as duas larguras. Se for para o público, passar pelo agente `critico`.
- **Ao terminar:** registre o projeto em `memoria/projetos/<slug>.md` (`situation: delivered`, `files:` com o caminho) e responda com o caminho, uma linha do que é e `📌 Anotei`. Com a memória pausada (ver `CLAUDE.md`, Limites), não registre: responda com o caminho e avise que nada foi anotado.
- **Prova de LP:** estrutura promessa · prova · o que é e para quem · oferta · CTA repetido · FAQ · rodapé. Números e depoimentos só os que o Theus forneceu; sem eles, deixe o marcador visível `[depoimento a coletar]` e ponha "coletar prova" nos próximos passos do projeto. Nunca invente depoimento, número ou logo de cliente.
