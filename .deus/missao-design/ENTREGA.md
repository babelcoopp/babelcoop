# Entrega · babel-coop/design-2030

**Estado: entregue com uma pendência declarada** (23/09/2026, fim da manhã). A pendência: nenhuma predição foi criada na Replicate porque a execução do portão dos ícones foi negada pela permissão do Bash desta sessão; o pipeline está pronto e documentado, custo US$ 0,00 de 20.

## Artefatos

| Artefato | Caminho | Tamanho |
|---|---|---|
| Estudo com fontes | `docs/ESTUDO_DESIGN_2030.md` (+ fechamento em §3) | 7 frentes, 200+ URLs lidas |
| Conceito final (v2) | `docs/design/CONCEITO.md` | 14 seções |
| Tokens | `docs/design/tokens.css` | escuro + Latte + Ametista derivado + reduced-motion + contrast |
| Pipeline de IA | `docs/design/GERACAO_REPLICATE.md` | kit, prompts, slugs, script, MANIFESTO |
| Caderno da Máquina e do 3D | `docs/design/MAQUINA_PECAS.md` | 12 peças, fios, pulso, presets, 3D, pipeline |
| Supabase como peças | `docs/design/SUPABASE_PECAS.md` | 16 peças + 2 variantes + 2 verbos; catálogo de 79 recursos; retrato real |
| Tela como construtor | `docs/design/TELA_CONSTRUTOR.md` | números com fonte, mecânica, anterioridade |
| Painel visual | `docs/design/painel.html` → https://claude.ai/artifact/KruF3NjV9EddMRm69367P3 | 3 colunas + Máquina + Tela + leis + tokens + TV |
| Notas das frentes | `.deus/missao-design/pesquisa/*.md` (21 arquivos) | brutas, com URL por achado |

## Provas por critério

| Aceite | Prova | Estado |
|---|---|---|
| A1 estudo com fontes | `docs/ESTUDO_DESIGN_2030.md` §2 (sete frentes, cada achado com aplicação e URL) e §4; notas em `pesquisa/` | **cumprido** |
| A2 conceito por comparação | 4 conceitos (`conceito-instrumento.md`, `conceito-corte.md`, `conceito-silencio.md`, `bancada-viva.md`), 3 juízes (`resultados/juiz_*.json`), tabela em ESTUDO §3 e CONCEITO §1; síntese em `conceito-final.md` | **cumprido** |
| A3 sobrevive a crítica adversarial | 4 críticos (`resultados/critico_1..4.json`: todos refutaram a v1), revisão em `conceito-final-v2.md`, tabela de correções em CONCEITO §12 | **cumprido** |
| A4 layout preservado + mecanismo novo com anterioridade | CONCEITO §3 (esquerda/meio/direita mantidos) e §6 (busca por função: Zed, Framer, Live Share, Warp, DSN, Linear, JetBrains, Cursor, Phosphor, 37signals, GitLens, FigJam, GitHub, Drive…); "não vi" declarado | **cumprido** |
| A5 tokens | `docs/design/tokens.css`; o painel usa os mesmos valores | **cumprido** |
| A6 pipeline Replicate | `GERACAO_REPLICATE.md`: 13 slugs confirmados por schema, prompts, seeds, custos, regras, script; `MANIFESTO.json` **não existe** porque nada foi gerado | **cumprido no plano; geração pendente** |
| A7 painel HTML publicado | artefato acima; verificado no Playwright: zero erros de JS; Testar da Máquina (pulso, gaveta abre, robô gira, cano, tela; "como a outra empresa" barra no cadeado); Tela (arrastar reordena com FLIP, duplo clique edita, Ver por pessoa, agente edita com cursor e etiqueta que some em 3 s); OK da demanda sela com nome e hora; meia-vida esfria; tema claro; 400 px sem rolagem horizontal; reduced-motion respeitado | **cumprido** |
| A8 nada removido | CONCEITO §9 cruza A–L do `docs/FUNCOES.md`; só as 5 mudanças de casa da peneira | **cumprido** |
| A9 caderno Máquina/3D | `MAQUINA_PECAS.md` (12 fichas, 3 fios, pulso, montar/testar, presets, modo 3D, tokens, pipeline com slugs); o painel mostra a Máquina com peças, fio pulsando e cadeado barrando | **cumprido** |
| A10 Supabase → peças | `SUPABASE_PECAS.md`: 79 recursos do índice oficial + changelog 2026, cada um com peça; 4 peças novas com motivo; 30 regras dos Advisors traduzidas; retrato real do projeto do Theus pelo MCP (292 tabelas, 677 políticas, 91 edge functions…) | **cumprido** |
| A11 Tela construtor | `TELA_CONSTRUTOR.md` (números de alça/latência/easing com fonte; mecânica parse5 + patch por offset + CDP; anterioridade de 18 construtores; "ninguém combina" com 14 itens); painel demonstra seleção, alças, arraste, cor por pessoa, régua, agente editando | **cumprido** |

## Selo adversarial (o que eu mesmo tentaria derrubar)

1. **A geração por IA não aconteceu.** O pedido dizia "vamos usar a API da Replicate". A missão confirmou 17 slugs pela API, leu os schemas, escreveu os prompts e o script, e parou na permissão do Bash. É a única linha do pedido sem prova de execução. Custa US$ 0,24 para abrir o portão no próximo terminal.
2. **Contrastes calculados, não verificados.** APCA por implementação própria (0.0.98G) e WCAG à mão para a Máquina. Conferir em apcacontrast.com antes de fixar `tokens.css`.
3. **"Ninguém usou" tem buracos declarados.** DocuSign/Adobe Sign, Codex app, Superhuman Split View, Observable e governança de agentes de 2026 não foram cobertos; a cota de WebSearch acabou nas frentes tardias (tudo por WebFetch direto).
4. **O painel é demonstração, não o protótipo.** Os mecanismos rodam em HTML puro, mas o protótipo v22 (`prototipo/`) ainda tem o design antigo; a construção (fatia por fatia, com plano de retirada por lei) é a próxima fase.
5. **Quatro novidades somadas.** Mesmo sendo uma lei cada, o imposto da novidade só se mede com 3 pessoas da equipe medindo tempo de tarefa e erro. O plano de retirada por peça está em CONCEITO §13.
6. **Token da Replicate passou pelo chat.** Trocar.

## O que não foi feito de propósito

Loop da logo, campo profundo, loop da TV, seis sons, metais do Reino, bitmap na casca, coluna Wow! no rodapé, ponto pálido, disco do cronômetro, linha sólida da trava, Apontar, crossfade de aba: todos cortados pelos críticos com motivo em `conceito-final-v2.md` §0. Nada do `docs/FUNCOES.md` saiu.

---

# Revisão 5 · segundo artefato: visão inédita com elementos gerados (aceite A12)

**Estado: entregue (v2 publicada), com a síntese final da pesquisa entrando por cima quando fechar.**

| Item | Prova |
|---|---|
| Artefato | https://claude.ai/artifact/SU3FQypcRxSmPoBuCZLGxn (`docs/design/visao.html` + 19 arquivos em `docs/design/assets/visao/`); o primeiro artefato preservado em https://claude.ai/artifact/KruF3NjV9EddMRm69367P3 |
| Elementos gerados de verdade | 26 predições na Replicate (≈ US$ 3,3), `docs/design/assets/raw/*/2026-09-23/MANIFESTO.jsonl`: keyframes A/N do "b" e o clipe **b-entrada** (wan 2.7, 42 s); **chão vivo** (keyframe + 4 s); **cofre** isométrico → recorte → **3D no Trellis** (GLB 1,1 MB + giro, 31 s, US$ 0,035); **retratos-objeto** lupa · fone · chave (+ recortes); orbe (gerado e reprovado no portão); 8 ícones no Recraft (reprovados: fill sem stroke); **ui-viva** (a interface real animada: destrói o texto pequeno) |
| Pesquisa | 4 frentes com URL por achado (`pesquisa/visao-geracao-viva.md`, `visao-mercado-conversacional.md`, `visao-lideranca-12-meses.md`, `visao-media-viva-como-dna.md`) → 3 conceitos (`visao-conceito-organismo.md`, `-lugar.md`, `-colega.md`) → 2 juízes (Organismo 44 · Chão 42/40 · Colegas 38, vitória condicional) → síntese (`visao-conceito-final.md`, em curso) |
| Conceito | categoria "Trabalho à vista"; endereço → posição → rastro → planta na parede (gemba walk); agentes como colegas com dono e retrato-objeto (nunca rosto); memória com nome; o sistema com corpo em 3D na parede; identidade viva por equipe (US$ 3, provado); 7 pontos de líder com teste cada |
| O que não se gera (provado) | interface e texto (ui-viva.mp4, quadro 0), ícones monoline (Recraft = fill), rostos, loops sem dado, ata em vídeo (crossfade real), filme do projeto/marca antes da demo real |
| Verificação | Playwright: zero erros, toda a mídia carrega, 400 px sem rolagem; defeito pôster+vídeo corrigido |

## Selo adversarial (revisão 5)
1. **A síntese final ainda não entrou**: a v2 aplica os dois juízes por minha mão; o sintetizador pode mudar nome ou cortes; entra na v3 se divergir.
2. **Crédito**: a conta da Replicate tem < US$ 5 e limita a 1 pedido por vez; o kit por equipe (≈ US$ 5–7) exige recarga; o token passou pelo chat e deve ser trocado.
3. **Sem dado é maquete**: corpo 3D na parede, ata e rastro só valem com a Máquina lendo o Supabase real e o token real (FUNCOES B e L), ainda não executados.
4. **Anterioridade**: "não vi" não é "não existe" (Rovo, Glean, Lindy, Agentforce, Dust, Sana não lidos).
5. **Os números de liderança** (Cursor, Lovable, Superhuman) são de páginas públicas e analistas, não balanços.

**v4 (rodada 9):** galeria "Como eu imagino" com 6 imagens geradas do app (Estação, campanha, parede, Máquina 3D com todas as peças do Supabase, mapa 2D que vira máquina, selo), por ordem do Theus; síntese do workflow incorporada (nome "sistema com corpo" + linha "Trabalho à vista"); retratos-objeto ficam só como registro de portão. 35 predições, ≈ US$ 4,5.

# Revisão 6 · o plano para aprovação (aceite A13)

**Estado: entregue, aguardando aprovação.** https://claude.ai/artifact/HBYjVPSUwSBZYrJExJnFbQ (`docs/design/plano.html` + `PLANO.md`). Contém: a ideia fechada em seis propriedades; o kit R1–R10 (o que já está pronto e o que a F0 gera) com usos múltiplos por tela; tela por tela A–L; a aposta principal no formato DEUS com limiar fixado antes; fases F0–F5 com "pronto quando"; checklist de 7 aprovações. Carimbo "b" gerado (imagem + clipe). Selo adversarial: o plano depende de recarga da Replicate para a F0; a sonda (F1–F2) é o que prova a hipótese; sem a Máquina lendo o Supabase real (F5) o corpo é demonstração com dados de exemplo.

# Revisão 7 · o organismo vivo (aceite A14)

**Entregue.** `docs/design/REGUA_ORGANISMO.md` (10 regras a partir do acervo do Dominic: luz = evento real com intensidade pelo erro de previsão; pontos com origem, nunca por tempo/compra/sorteio; pessoal informa, equipe une, nunca ranking; meta escolhida; sessão com fim; medir exposição ≠ aceite ≠ resultado) e `docs/design/organismo.html` → https://claude.ai/artifact/CDf3bDN7Hf1SV6gz84t7UM (demonstração em código: arquivo nascendo, pulsos e faíscas por item, "Documento concluído", Máquina testada, peças ganhando corpo com as imagens isométricas geradas, placar com origem, meta semanal, constelação da parede). Playwright: zero erros; 24 + 25 pontos; meta em ouro. Fora, por ordem do Theus: carimbo, retratos-objeto. Pendente: aprovação do plano; recarga da Replicate para as 10 peças 3D restantes e os 4 clipes da presença.
