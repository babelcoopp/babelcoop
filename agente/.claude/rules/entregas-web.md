---
paths:
  - "entregas/**"
  - "dashboard/**"
---
# Padrão de sites, LPs, sistemas e painel (Babel OS)

- Um arquivo `.html` autocontido por entrega: CSS e JS inline, sem build, sem `fetch()` de arquivo local (em `file://` só `<script src>` funciona). Fontes do Google Fonts com fallback `system-ui`. Imagens por URL ou SVG inline.
- Identidade Babel OS: fundo `#030817`, ciano `#3fe3ff`, azul `#3b82ff`, violeta `#8b5cff`, magenta `#e04bff`, ouro `#f5c76a` (títulos, versão, destaques de rank), verde `#34e6a6` (ok), texto `#e6efff`. Exo 2 (títulos) + Inter (texto). Painéis de vidro (`backdrop-filter: blur(12px)`, borda 1px `rgba(63,227,255,.22)`, cantos 14px), scanlines sutis (`repeating-linear-gradient`, opacidade ≤ 0.05), glow discreto. Contraste mínimo 4.5:1.
- Mobile primeiro: 16px de margem lateral, sem rolagem horizontal, botões com ≥ 44px de altura, texto ≥ 16px. Testar a 390px e a 1280px.
- pt-BR em tudo: `<html lang="pt-BR">`, `<title>` de 2–4 palavras, títulos, botões, placeholders.
- LP que converte para o público do Reino: 1 promessa no topo, prova (números, depoimentos que o Marcelo forneceu), o que é / para quem, oferta, CTA repetido (WhatsApp por padrão), FAQ curto, rodapé com contato. Copy em português, tom do Marcelo (líder que fala com líderes).
- Sistemas (`entregas/sistemas/<slug>.md`): problema em 1 frase → quem usa → fluxo principal passo a passo → telas (o que cada uma mostra) → dados (entidades e campos) → integrações → MVP de 1 semana → riscos → métricas → como o Reino/Babel entra. Protótipo clicável opcional em `<slug>-prototipo.html`.
- Nada de rastreador de terceiros, chave de API embutida ou formulário que envie para servidor desconhecido.
- Antes de entregar: `open entregas/sites/<slug>.html`, conferir console sem erro, larguras 390/1280. Se for para o público, revisão do agente `critico`.
- Ao terminar: `python3 motor/remember.py --type project --id <slug> --title "…" --situation delivered --files entregas/sites/<slug>.html --next "…"`; responda com link, 1 linha, `📌 Anotei` e UMA provocação de crescimento.
- Painel (`dashboard/`): `template.html` é o único arquivo desenhado à mão; `index.html` e `data.js` são gerados por `motor/panel.py`. O template precisa manter o marcador `/*__BABEL_DADOS__*/` dentro de `<script id="babel-data">`, a função global `render(BABEL)`, só `textContent` para dados (nunca `innerHTML` com dados) e o contrato `window.BABEL` da spec. Depois de mudar o template: `python3 motor/panel.py` e conferir no navegador integrado.
