# Missão do CRIADOR · design novo do Babel Coop

- **Identificador exclusivo:** babel-coop/design-2030 · revisão 1 · 2026-09-23
- **Dono da escrita:** o agente desta sessão (Claude Code), a serviço do Theus
- **Protocolo:** DEUS — CRIADOR (`~/Desktop/DEUS-CRIADOR/PROMPT.md`), incorporado; identidade e permissões são as da sessão

## Pedido original do Theus (preservado, literal)

> "tá, agora vamos então pro grande salto, já que concluímos o protótipo, vamos agora avançar o design. a primeira coisa, eu preciso que vc primeiro levante na internet contexto ou skills ou algo que te ajude a avaliar a UX do sistema, isso com tendência 2026/2030, eu preciso que analisemos se a sequência de telas tem sentido, precisamos analisar redundâncias, duplicações, sessões que são muito semelhantes então não tem necessidade, botões que foram colocados apenas por alucinação de LLM, eu preciso que vc agora faça a peneira sendo que é PROIBIDO remover o que é necessário e está dentro do que eu pedi, mas se tiver algo que possamos remover, exemplo as logos dentro do meio e da lateral direita, deixe somente a logo pequena em cima, isso é minimalismo, veja as telas e me traga uma análise, e o primeiro passo, não execute nada ainda"

> "eu quero que vc pegue o arquivo que vou lhe entregar, e a partir dele faça um profundo estudo, usando a skill de pesquisa avançada, sobre apps futuristas, ufologia, mas minimalista tbm, nada de excesso pois será usado por empresários e usuários times de empresa etc.. aí chegou o momento de fazermos algo novo, eu quero que continue lateral direita o terminal, meio o trabalho e esquerda a pos arquivos e opções etc... mas de uma maneira que ninguém ainda usou. eu vou colar o prompt DEUS vc deve ser o agente DEUS, vou colocar um MD sobre técnicas avançadas de geração de vídeo imagem com IA, e o que quero é que vc descubra tudo sobre geração de elementos para app, com IA, animação de logo, efeitos visuais, tipo, chegou o momento do mundo começar a conhecer novas experiências e essa será uma, vamos misturar reino, empreendedorismo, ufologia, futurismo, e criatividade, mas sem forçar, não é o excesso, cada traço tem que ser milimetricamente pensado, então você é o agente DEUS e tô colocando material, vamos usar a API da replicate"

> "não é plano do agente DEUS, você é o agente, encorpore as skills, vá" · "/Users/matheussilveirapro/Desktop/DEUS-CRIADOR aqui está a certa"

## Criação esperada e destinatário

Uma **direção de design nova e demonstrada** para o Babel Coop, para o Theus e a equipe de 11 (empresários e times de empresa): estudo profundo com fontes, conceito escolhido por comparação, sistema de design (cor, tipo, forma, motion, som), o layout esquerda = arquivos e opções · meio = trabalho · direita = terminal **de um jeito que ninguém usou**, os elementos visuais gerados por IA (logo animada, ícones, fundos, efeitos) com pipeline e prompts para a API da Replicate, e um **artefato visual** (painel de design em HTML) que mostre o resultado, não só o descreva.

## Recursos autorizados e restrições

- Material do Theus: `~/Desktop/stack-video-scroll/PROMPT_AGENTICO_LP.md` e `BRIEFING_IA.md` (regras de geração: keyframe antes de vídeo, SVG nativo, seed fixa, loop `Z = A`, orçamento como limite duro, outputs expiram em 1 h, `prefers-reduced-motion`), `~/Desktop/DEUS-CRIADOR/` (protocolo), `~/Desktop/babel-coop/docs/UX_PENEIRA.md` (peneira já feita), `docs/FUNCOES.md`, `IDEIAS.md`, protótipo v22.
- Identidade atual da Babel: fundo `#060b16`, degradê roxo → azul → ciano, logo "b" em neon, Cormorant Garamond + IBM Plex Sans + JetBrains Mono.
- Ferramentas: pesquisa na web (WebSearch/WebFetch), Playwright MCP, Artifact, Workflow; API da Replicate quando houver token (só em variável de ambiente; nunca no repositório).
- Restrições: **proibido remover o que o Theus pediu**; sem excesso; empresários e times de empresa como público; reino + empreendedorismo + ufologia + futurismo + criatividade sem forçar; cada traço justificado; a Máquina não usa Supabase; o Bash desta sessão não roda `node`/`npm`.

## Orçamento

Geração por IA: até **US$ 20** nesta missão (referência do PROMPT_AGENTICO: US$ 20–60 para uma LP inteira; aqui é só o kit do app). Parar e reportar em 80 %.

## Aceites antes de começar

| Critério observável | Evidência exigida | Como será verificado | Estado |
| --- | --- | --- | --- |
| A1. Estudo profundo com fontes lidas, cobrindo apps futuristas, ufologia, minimalismo empresarial, reino/heráldica moderna, geração de elementos de app por IA (Replicate), e o que ninguém fez em layouts de 3 colunas | `docs/ESTUDO_DESIGN_2030.md` com fontes por achado | Contagem de fontes; cada achado tem aplicação no Babel Coop | Aberto |
| A2. Conceito escolhido por comparação, não por uma tentativa só | ≥ 4 conceitos com mecanismos diferentes, notas de ≥ 3 juízes, síntese | Tabela de notas e a justificativa do vencedor | Aberto |
| A3. Conceito sobrevive a crítica adversarial (excesso, clichê, seriedade empresarial, viabilidade) | Lista de trações refutados e corrigidos | Cada crítica com correção aplicada ou motivo de manter | Aberto |
| A4. Layout esquerda/meio/direita preservado e com mecanismo novo, com anterioridade pesquisada | Seção "o que ninguém usou" com busca por função, não só por palavra | Comparação com Linear, Cursor, Warp, Zed, Arc, visionOS e afins | Aberto |
| A5. Sistema de design em tokens (cor, tipo, espaço, raio, motion, som) | `docs/design/tokens.css` ou seção equivalente | Arquivo existe e o painel usa | Aberto |
| A6. Pipeline de elementos por IA na Replicate: modelo, slug verificado, prompt, formato, seed, custo, regra de loop e de SVG | `docs/design/GERACAO_REPLICATE.md` + `MANIFESTO.json` quando houver geração | Slugs conferidos na web; regras do PROMPT_AGENTICO respeitadas | Aberto |
| A7. Painel de design em HTML demonstrando o conceito no layout de 3 colunas (não só texto) | `docs/design/painel.html` publicado como artefato | Abre, roda sem erro, `prefers-reduced-motion` respeitado | Aberto |
| A8. Nada do que o Theus pediu foi removido | Cruzamento com `docs/FUNCOES.md` | Lista de funções mantidas no novo layout | Aberto |
| A9. Caderno de peças da Máquina e do 3D: gramática física das 12 peças (forma, material, luz, estados, marca da pessoa), fios e pulso, montar e testar em equipe, presets, pipeline de IA com slugs confirmados | `docs/design/MAQUINA_PECAS.md` + peças no painel | Painel mostra a Máquina com peças e fio pulsando; slugs conferidos | Aberto |
| A10. **Todos** os recursos do Supabase como peças da Máquina, simples e intuitivos: catálogo completo lido na documentação oficial e conferido no Supabase real pelo MCP (projetos do Theus), cada recurso com peça, função em uma frase, dependências, conexões, alerta e forma de montar | `docs/design/SUPABASE_PECAS.md` | Cruzar com a lista de features oficial; recursos sem peça declarados com motivo | Aberto |
| A11. A Tela como construtor de frontend: o agente gera o site e, no preview, a pessoa edita tudo (texto, arrastar, redimensionar, estilo, imagem, apontar e pedir), com versões, marca de quem mexeu, em JS puro, e a experiência é linda (números exatos de handle, latência, easing) | `docs/design/TELA_CONSTRUTOR.md` + demonstração no painel | Painel mostra a Tela com seleção, handles e edição; anterioridade explícita | Aberto |

## Ponto inicial

- O que já existe: protótipo v22 funcional (42/42 no roteiro), peneira de UX em `docs/UX_PENEIRA.md`, identidade Babel, material de geração por IA do Theus.
- Diferença que a criação deve realizar: sair de "VS Code escuro com neon" para uma linguagem própria, calma, com a mistura pedida, que um empresário respeite e que ninguém tenha visto num app de equipe.
- Primeira pergunta por capacidade: que mecanismo de interface (não estilo) faz o terminal, o trabalho e os arquivos parecerem um só instrumento, e ainda não existe?
- Primeira ação: exploração em paralelo (7 frentes) com fontes, seguida de 4 conceitos, 3 juízes, síntese e 4 críticos.
- Decisões realmente ausentes: token da Replicate na máquina (verificar); orçamento acima de US$ 20 (perguntar só se precisar).

## Revisões do pedido e dos aceites

- 2026-09-23 · revisão 1 · nascimento.
- 2026-09-23 · revisão 2 · o Theus lembrou a Máquina e o 3D ("estudar as peças que parecem 3D, montar o backend e o frontend, conectar os fios"): aceite A9 acrescentado. Token da Replicate entregue pelo chat (só em variável de ambiente da sessão).
- 2026-09-23 · revisão 3 · o Theus pediu: "entre no supabase… transformarmos TODOS os recursos do SUPABASE, peças… de maneira totalmente simples e intuitiva" e "PENSE como fazermos a tela que é o frontend, tipo LOVABLE gerar o site, e no preview poder mexer em todo ele… mas sendo experiência LINDA": aceites A10 e A11. Nota: isto corrige a leitura anterior de "não tem Supabase": o Babel Coop em si guarda tudo no HD compartilhado; a Máquina monta backends **no Supabase**, e por isso os recursos do Supabase viram peças.
- 2026-09-23 · revisão 5 · o Theus, depois da entrega: "efeitos visuais, eu entreguei a API REPLICATE, pra gerar elementos etc.. que tornem o app uma nova criação de apps no mundo, apps conversacionais de terminal mas sem cara de terminal, gestão equipe contexto compartilhado, isso é inédito, eu preciso de um app inédito tbm, diferente de tudo, por isso, deixe salvo esse artefato mas vamos gerar outro, e esse outro, quero que use gerar elementos e tudo mais é pq eu não sei o que é possível de gerar de sistema, usando uma llm de vídeo como temos hoje, então me mostre por meio de um artefato uma ideia que tem estrutura de ideia para ser líder do mercado até ano que vem". Aceite **A12**: segundo artefato (visão inédita) com elementos **gerados de verdade** na Replicate (vídeo, imagem, SVG, 3D) embutidos, um conceito com estrutura de líder até 2027 (categoria própria, primeiros 5 minutos, terminal que some, contexto compartilhado com efeito de rede, gestão com prova), pesquisa do que é possível gerar para um sistema em 2026, e o primeiro artefato preservado. Restrição nova descoberta: a conta da Replicate tem < US$ 5 de crédito e limita a 1 pedido por vez (6/min); gerar em série, priorizando valor.
- 2026-09-23 · revisão 6 · o Theus aprovou a direção das imagens ("agora sim, começou a ficar decente") e pediu: **o plano do Babel Coop para aprovar e ir para a programação**, lembrando que vídeo é recurso para elementos animados (detalhes), que há muitas telas e recursos a usar de várias formas com inteligência, e que o carimbo é o próprio "b" da Babel (sai o "C"). Aceite **A13**: plano completo (ideia fechada, kit de recursos com usos múltiplos, tela por tela do FUNCOES.md, aposta principal no formato DEUS, fases com "pronto quando", checklist de aprovação) como artefato + `docs/design/PLANO.md`; carimbo "b" gerado (imagem + clipe). Protocolo DEUS reativado pelo Theus (texto colado); mesma missão, mesmos registros.
