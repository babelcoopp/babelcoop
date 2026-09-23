# DECISÕES: LP do Reino (22/09/2026)

| # | Decisão | Por quê (uma linha) |
|---|---|---|
| 1 | Sem Vite: HTML/CSS/JS estático com as libs em `libs/` | Não há Node na máquina; LP não precisa de build e fica mais leve (seção 2 permite). |
| 2 | Mídia do herói, da torre e do anel feita em código (canvas 2D + Three.js) em vez da Replicate | A conta Replicate retornou 402 "Insufficient credit"; código é nítido em qualquer tela e reage ao scroll. |
| 3 | Vídeo do app (`fundo-login.mp4`) NÃO usado como sequência | 524×276 px e quase estático: ficaria borrado em tela cheia. |
| 4 | Anel em Three.js real, não sequência de frames | Troca de pedra/metal por título em tempo real (impossível com 1 vídeo) e pesa 166 KB gzip sob demanda. |
| 5 | Ícones SVG escritos à mão, traço único, `currentColor` | Sem crédito para `recraft-v4-svg`; família coerente de 11 ícones em ~3 KB. |
| 6 | Trilha gerada ao vivo com Web Audio | Zero bytes de áudio, zero custo; respeita a regra 7 (só após gesto). |
| 7 | Fontes self-hospedadas só no subconjunto latin | Português cabe no latin (ç, ã, é); latin-ext cortado economizou ~50%. |
| 8 | Exo 2 + Inter (do app) + Cinzel só em momentos cerimoniais | Continuidade com o app; Cinzel dá a voz de "reino" sem virar fantasia. |
| 9 | Formulário com 5 campos e envio por função RPC no Supabase | Menos atrito (evidência na copy v1); tabela fechada por RLS, sem leitura pública. |
| 10 | Números da Babel publicados como "um cliente da Babel", sem nome | Falta a autorização do Diego; marcado TROCAR. |
| 11 | Porcentagens de ganho de rede fora da LP | Risco jurídico (pirâmide); ficam dentro do app. |
| 12 | Concorrentes não citados por nome | CONAR; uso só "clubes de elite" + dado público (R$ 280 mil/ano). |
| 13 | DPR capado em 1,5, 12 primeiros frames com prioridade no template, IO + visibilitychange pausando todos os laços | Checklist da seção 8. |
| 14 | O motion desacelera na captura (Juramento sem canvas nem pin) | Seção 6.1: o espetáculo não compete com o formulário. |

## Revisão de 22/09/2026 (pedidos do Marcelo)
| # | Decisão | Por quê |
|---|---|---|
| 15 | **Nenhum valor do Reino na LP** (adesão, mensalidades e preços dos títulos removidos) | A fase é de pré-cadastro: o preço só aparece na abertura do carrinho. Mantido apenas o dado público de concorrente (R$ 280 mil/ano), que não é preço do Reino. |
| 16 | "Fundador" → **Primeira Corte** em toda a página | Nome oficial do grupo que entra antes da inauguração. |
| 17 | Código de conduta reescrito: "A palavra de um membro vale mais que o contrato" | A versão anterior ("não entra falcatrua, golpe, roubo") era pesada; a nova diz o mesmo pela positiva, e mantém a consequência ("deixa de pertencer, em silêncio"). |
| 18 | FAQ vira **"Dúvidas que você pode ter"** e a pergunta "é pirâmide?" sai | Levantar a suspeita cria a suspeita. As objeções continuam respondidas, sem plantar a dúvida. |
| 19 | Preço na FAQ: Primeira Corte com **condição 40% melhor** que a da inauguração, sem valor | Como o Marcelo pediu. ⚠️ Os 40% precisam ser verdade na abertura. |
| 20 | Acessibilidade dita como "cabe no orçamento de qualquer empresário", sem constranger quem não puder | Constrangimento fecha porta e queima reputação numa rede que vive de indicação; a mensagem de acessibilidade continua. |
| 21 | Babel: "várias empresas" no lugar de "30 empresas" | 30 ainda é número pequeno para exibir. |
| 22 | Captura com **o portão ao fundo** (segunda instância da cena, estática) | O pedido do Marcelo, sem violar a regra de desacelerar o motion na captura: o fundo não se move nem tem scrub. |
| 23 | Trilha medieval **composta em código** (modo dórico, alaúde, bordão e tambor) | Sem direito autoral e sem baixar arquivo; nível de áudio medido em teste (RMS ~0,04). Começa só após o clique (regra 7). |
| 24 | Guia de leitura: "Role devagar", barra de travessia no topo e pílula "Ative o som" | Orienta o ritmo da experiência sem travar o scroll de quem tem pressa. |
| 25 | Arquivo único renomeado para **networkreino.html** | Pedido do Marcelo. |
