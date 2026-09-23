# Visão · conceito "Colegas" — o Babel Coop como colega de equipe (categoria: trabalho à vista)

> Missão `babel-coop/design-2030` · 23/09/2026 · síntese de produto sobre as quatro frentes desta rodada (`visao-geracao-viva.md`, `visao-mercado-conversacional.md`, `visao-lideranca-12-meses.md`, `visao-media-viva-como-dna.md`, mesma pasta) e sobre o contexto obrigatório: `docs/design/CONCEITO.md`, `docs/design/GERACAO_REPLICATE.md`, `docs/FUNCOES.md`, `~/Desktop/stack-video-scroll/PROMPT_AGENTICO_LP.md`.
> Regras desta nota: **nada do FUNCOES.md sai**; as três colunas (Arquivos · Trabalho · Agentes), as quatro leis, a identidade (`#060b16`, roxo → azul → ciano como escala de tempo, o "b", Cormorant + Plex + JetBrains Mono) e o §8 do CONCEITO ("o que não tem") ficam. Cada afirmação de mercado ou de modelo traz a URL lida pelas frentes ou por mim nesta sessão (cinco páginas da Replicate sobre texto→fala, lidas em 23/09/2026). O que não foi lido está marcado **não confirmado**. Opinião de produto está marcada **[decisão]**.
> Pedido literal do Theus: "efeitos visuais, eu entreguei a API REPLICATE, pra gerar elementos etc.. que tornem o app uma nova criação de apps no mundo, apps conversacionais de terminal mas sem cara de terminal, gestão equipe contexto compartilhado, isso é inédito, eu preciso de um app inédito também, diferente de tudo... quero que use gerar elementos e tudo mais é porque eu não sei o que é possível de gerar de sistema, usando uma LLM de vídeo como temos hoje, então me mostre por meio de um artefato uma ideia que tem estrutura de ideia para ser líder do mercado até ano que vem".

---

## 0. Em uma página

**A tese.** O Babel Coop deixa de ser só um instrumento que a pessoa usa e passa a ser **um colega que a equipe tem**. Cada agente é um membro da equipe: tem nome humano, **retrato-ferramenta** (um objeto no material da casa, gerado uma vez, nunca um rosto), um lugar na parede da sala, uma **história** (o Perfil com cada trabalho, cada OK e cada "rompido") e uma **taxa de aceite** que só o dono e a gestão veem. A memória da equipe tem **autoria** e cresce à vista de todos: quando um agente consulta o que a Carla aprendeu, a Carla vê a luz acender. A gestão diz **quem está com o quê, agora, com prova** (o objeto, o cronômetro, a miniatura real, o Selo). E o terminal some porque tudo vira **conversa entre colegas com peças na mesa**: o agente fala em blocos de português, entrega peças que pousam no meio, e o comando real fica a um clique ("ver o comando") e a um atalho (Ctrl+J).

**A categoria.** "**Trabalho à vista**": equipe, agentes e sala no mesmo objeto; tudo o que um colega de máquina faz fica à vista, com prova e com o seu OK assinado com nome e hora. Nenhum dos 25 produtos lidos na Frente 2 usa a expressão nem combina as cinco propriedades que ela nomeia (`visao-mercado-conversacional.md` §6).

**O que é inédito (a combinação, não as partes).** (1) Agente como **membro com dono** (quadrado com a cor da pessoa, retrato-objeto, história de selos, aceites), não como thread nem como "AI teammate" genérico; (2) **memória da equipe com autoria** que o agente cita por nome no bloco "o que consultei" e que acende para quem escreveu; (3) **gestão no objeto**, não num painel de admin: quem está com o quê, agora, com miniatura real e Selo; (4) a **sala física** como tela do mesmo sistema (TV sem botão com o mural de resultados selados e o backend real do projeto em 3D; iPad que risca na TV); (5) **não-programadores** com o terminal real por baixo e a equipe mudando o próprio app com publicação vN; (6) mídia gerada usada como **material com metáfora** (retrato-ferramenta, geometria da Máquina, Entrada) e nunca como enfeite. Cada uma das partes tem anterioridade parcial (§12); a combinação não foi vista.

**O que uma LLM de vídeo faz aqui, de verdade.** Pouco e certo: o clipe de Entrada da pessoa (4 s, candidato com portão), a chegada de um agente novo (4 s, candidato com portão), o filme de marca do site (15 s). O resto do "vivo" é imagem gerada uma vez (retratos, keyframes, folhas de estilo), geometria 3D gerada uma vez e renderizada ao vivo, ícones em SVG nativo, e uma voz opcional em português. A interface não é gerada; o que se move é dado (Frente 4, tese: "o vivo é o dado; o gerado é o material; o material nunca se mexe sozinho").

**Custo do kit inteiro**: ≈ US$ 23–28 (casca ≈ 12, colega ≈ 6, site ≈ 5–10), em três lotes com `MANIFESTO.json` cada; **[decisão]** propor orçamento v3 de US$ 40 com parada em 32 (o GERACAO_REPLICATE.md fixou 20/16 só para a casca).

---

## 1. Nome da categoria e a linha

- **Categoria**: **Trabalho à vista**.
- **Linha**: "Sua equipe, seus agentes e sua sala no mesmo lugar. Tudo o que um colega de máquina faz fica à vista, com prova, e só entra com o seu OK, assinado com nome e hora."
- **Tagline do site** (fora da interface): "Colegas de máquina. Trabalho à vista."
- **Por que este nome**: a Frente 3 mostrou que quem lidera batiza a categoria e a repete com um número (Warp "Agentic Development Environment" → "Factories", https://www.warp.dev/blog/reimagining-coding-agentic-development-environment · https://www.warp.dev/blog; Linear "issue tracking is dead", https://linear.app/now/sharing-growth-with-the-people-building-linear; Lovable "age of the builder", https://lovable.dev/blog/series-c). "À vista" diz o que muda (o trabalho do agente deixa de ser caixa preta) e carrega o segundo sentido em português (pago à vista: sem dívida, sem surpresa), que é exatamente a promessa do Selo e da Carga visível. A Linear pede "Don't invent terms if possible" (https://linear.app/method/introduction): "trabalho", "à vista", "colega" e "máquina" são palavras que a equipe já usa.
- **Onde aparece**: primeira linha do site, primeira abertura (abaixo do "Bem-vinda, Carla" em Cormorant), página de uma folha para quem manda. **Nunca** como rótulo dentro da casca (CONCEITO §10: a interface não carrega vocabulário de spec).
- **Colisão a evitar**: "colega de máquina" × "Máquina" (a peça de backend do FUNCOES B). Regra: na interface o agente é sempre "Lia · agente da Carla"; "colega de máquina" fica no site, na primeira abertura e na fala da equipe. Se em teste as três pessoas de fora confundirem, a tagline cai e fica só "Trabalho à vista".
- **Teste** (Frente 3 §5.1): 3 empresários de fora repetem o nome e a linha no dia seguinte, sem reler.

---

## 2. O colega: rosto, voz, lugar, história, reputação (sem ferir o CONCEITO)

O ângulo pedido é "cada agente é um membro com rosto (não humano, gerado), voz, mesa, história e reputação". Cada palavra tem uma tradução que cabe nas quatro leis e no §8:

| Pedido | O que é no Babel Coop | Onde já existia (FUNCOES / CONCEITO) | O que muda na v3 |
|---|---|---|---|
| **Rosto (não humano, gerado)** | **Retrato-ferramenta**: um objeto isométrico no material da casa (ardósia fosca, uma aresta em ciano) que diz o que o agente faz: telefone (responde), lupa (pesquisa), chave inglesa (monta a Máquina), caneta (escreve páginas), gaveta (organiza arquivos), cronômetro (demandas), fone (ouve a sala), compasso (projeta mapas). Gerado uma vez em `google/nano-banana-2` + `bria/remove-background`, aprovado pela pessoa, guardado como PNG com alfa. Vai **dentro do quadrado de 14 px** (o agente continua quadrado; a pessoa continua círculo) e em ≥ 24 px no Perfil, na parede de Terminais e na TV | FUNCOES C: agente com "foto de letra", ⋯ "Pôr foto · Trocar · Tirar"; CONCEITO §3.3: "com foto, a foto vai dentro do quadrado"; Frente 4 §5.1 item 6: retrato como objeto, nunca rosto | "Pôr foto" ganha a opção **Gerar** (a partir de "o que faz"); o retrato herda a cor do dono no contorno; nunca rosto, letra ou brilho (aceite) |
| **Voz** | Duas camadas. **Escrita**: o "jeito" do agente (curto · detalhado), escolhido na criação, e a assinatura fixa "Lia · agente da Carla" em todo bloco; o Registro já é a voz (blocos em português). **Falada** (opcional, desligada por padrão, só após gesto, nunca na TV nem no iPad): uma voz fixa por agente em português, gerada por `resemble-ai/chatterbox-multilingual` (`language_id: "pt"`, `seed` fixo, sem clonar voz de ninguém) ou `google/gemini-3.1-flash-tts` (`language_code: "pt-BR"`, 30 vozes). Usos: "Falar com" o agente e o ícone de alto-falante num bloco de resultado ("ler a entrega") | FUNCOES G: "Falar com" (voz WebRTC entre pessoas, só no app); CONCEITO §4.6: um só som, após gesto | a voz do agente é **leitura do Registro**, nunca conversa livre por áudio; um timbre por agente, gravado no Perfil; **não confirmado** que `pt` no Chatterbox seja pt-BR (a página lista `Portuguese (pt)`): testar com 3 pessoas |
| **Mesa** | O **cartão do agente na parede de Terminais** (atividade Terminais) e a zona "agora" da TV: retrato + "→ objeto" + estado medido ("pensando há 4 s") + peças esperando + Entrar · Chamar · Falar · Assumir · Sair. No documento chamo de "mesa do agente"; **na interface não tem nome** (o termo "Mesa" é proibido no CONCEITO §10) | FUNCOES C: parede de Terminais, um cartão por agente; CONCEITO §3.3 | o cartão ganha o retrato e a linha "esperando OK de Carla · 3"; no modo 3D da TV, o retrato em 3D fica ao lado da peça da Máquina que o agente está montando |
| **História** | O **Perfil do agente** como aba inteira, igual ao de uma pessoa: trabalhos feitos, tempo, peças criadas, presets salvos, aprendizados registrados, **selos dados e rompidos sobre as ações dele**, linha do tempo na escala de tempo (`--t0` agora · `--t1` hoje · `--t2` antes), "aprendeu com: Davi 12 · Carla 4", consumo (Carga) | FUNCOES G: Perfil com "agentes"; CONCEITO §3.3: Perfil do agente com o bitmap 7×11 como assinatura opcional | vira aba inteira aberta por Ctrl K ("Perfil Lia") ou pelo quadrado |
| **Reputação** | **Aceites**: "OK 46 · rompido 5 · esta semana", calculado só dos Selos sobre as ações do agente. Visível **só para o dono e a gestão**, no Perfil e no cartão. **Nunca na TV, nunca comparado entre agentes ou pessoas** (CONCEITO §8: sem ranking). Serve para uma coisa: o dono decide ampliar a **rotina** (o que o agente pode fazer sem OK, por receita e por contato), e cada ação de rotina continua gravando "rotina · Lia · 14:32" no histórico | FUNCOES H: "automático por contato com aviso de bloqueio"; CONCEITO lei 2: "Rotina continua clique simples, sem selo" | a rotina passa a ser uma concessão registrada (quem liberou, quando, para quê), como a "conditional tool call approval" da Linear (https://linear.app/now/how-we-built-linear-agent), mas escrita no objeto |

**Termos** (documento → interface): retrato-ferramenta → "foto" (o ⋯ já diz "Pôr foto"); mesa do agente → (cartão na parede, sem nome); história → "Perfil"; reputação → "aceites" (escrito como "OK 46 · rompido 5"); chegada → (sem nome: é a mesma Entrada); memória da equipe → "memória da equipe" (palavra comum, fica); colega de máquina → só no site e na primeira abertura.

---

## 3. O que é inédito (por função, com a anterioridade ao lado)

| Propriedade | Quem tem algo parecido (URL lida) | O que falta neles | O que o Babel faz |
|---|---|---|---|
| Agente como **membro com dono** (cor herdada, quadrado × círculo, retrato-objeto) | Notion 3.0: agente mencionável, "Anything you can do in Notion, your Agent can do too" (https://www.notion.com/blog/introducing-notion-3-0); GitHub Agent HQ: identidade "just like you would with any other developer" (https://github.blog/news-insights/company-news/welcome-home-agents/); Claude `claude agents`: nome tingido por `/color` (https://code.claude.com/docs/en/agent-view) | o agente é da organização ou da sessão, não de uma pessoa; identidade = inicial/ícone; sem dono visível no objeto | cada agente tem dono; o contorno é a cor do dono; a ação assina "Lia · agente da Carla"; o retrato diz o que ele faz |
| **Memória da equipe com autoria** citada pelo agente | Cursor Projects (memória entre agentes de uma conta, https://cursor.com/blog/projects); Claude Projects ("Every thread now adds to and draws from a shared memory", "aren't available on Team or Enterprise plans yet", https://code.claude.com/docs/en/claude-projects); Claude Tag (memória por canal, https://claude.com/docs/claude-tag/overview); Devin Knowledge (https://docs.devin.ai/llms.txt) | memória sem "quem"; ninguém vê a própria contribuição sendo usada | o bloco "o que consultei" lista "Aprendizado · Davi · reembolso (usado 7×)"; o Davi vê a luz "Lia usou o seu aprendizado" |
| **Gestão no objeto** com prova | Linear delegate ("humans maintain ownership while agents act on their behalf", https://linear.app/developers/agents); Microsoft Agent 365 ("You can't govern what you can't see", https://www.microsoft.com/en-us/security/blog/2026/05/01/microsoft-agent-365-now-generally-available-expands-capabilities-and-integrations/); Notion "bird's eye view of AI actions" (https://www.notion.com/product/ai) | painel de admin ou ticket; sem cronômetro, sem "OK só de quem pediu", sem sala | "Agora" na Equipe e na TV: pessoa/agente → objeto · tempo · miniatura real · Selo |
| **Sala física como tela** | nenhum dos 25 (Frente 2 §6) | zero | TV sem botão com mural selado + backend real em 3D; iPad que risca na TV |
| **Não-programadores com terminal real por baixo** | Cowork/Copilot Cowork escondem tudo (https://claude.com/blog/cowork-is-now-claude · https://www.microsoft.com/en-us/copilot/blog/2026/06/16/copilot-cowork-is-now-generally-available/); Zed Terminal Threads/Warp mostram tudo (https://zed.dev/blog/terminal-threads · https://www.warp.dev/) | ou esconde, ou é só para dev | blocos em português + "ver o comando" + Ctrl+J |
| **Mídia gerada como material com metáfora** | Vercel gerou 15 mil e publicou um shader (https://vercel.com/blog/designing-and-building-the-vercel-ship-conference-platform); Figma Config gerou três texturas com significado (https://www.figma.com/blog/the-visual-identity-behind-config-2026/) | são identidades de evento, não de um produto de equipe | retrato, geometria, Entrada: cada uma com metáfora, portão e desligamento |

"Não vi" não é "não existe": produtos vendidos como "AI teammate" (Atlassian Rovo, Glean, Lindy, Relevance AI, Salesforce Agentforce, Dust, Sana) **não foram lidos** nesta missão.

---

## 4. Os primeiros 5 minutos (o momento "aha")

**Definição do aha** (Frente 3 §4): "a primeira coisa que outra pessoa ou um agente fez no seu objeto, com Selo, enquanto você olhava; e a parede mostrou". Meta: em < 5 min para 5 de 5 novatos, sem ajuda.

**Antes** (rito, fora do app): a gestão gera o token `babel-…` (FUNCOES G) e marca 30 min com alguém da Babel (Superhuman: onboarding 1:1, https://review.firstround.com/how-superhuman-built-an-engine-to-find-product-market-fit/); deixa uma demanda esperando na caixa da pessoa nova. A equipe já tem um agente da casa ("Rita · agente do Theus") com retrato.

| Tempo | O que a Carla vê | Lei / função |
|---|---|---|
| 0:00–0:15 | Cola o token. O "b" se desenha (1,2 s; qualquer tecla pula) e termina no b estático do topo. "Bem-vinda, Carla." em Cormorant. Diagrama Arquivos · Trabalho · Agentes (uma tela) | CONCEITO §4.4 (herói 1); FUNCOES G |
| 0:15–0:45 | Meu dia abre com a caixa: "Ler o README da equipe e dizer o que faltou", Selo aberto na cor do Theus. À direita, o cabeçalho diz "→ README.md"; a Rita se apresenta **uma vez**: "Sou a Rita, agente do Theus. Já li 76 coisas que a equipe aprendeu. Estou com o README." Receitas: Explicar · Projetar · Pedir ajuda | Lei 1; FUNCOES D (caixa) |
| 0:45–1:15 | Enter em Explicar. Anel em laço, "pensando há 3 s". Bloco **consulta**: "o que consultei: README.md · Aprendizado · Davi · onboarding (usado 4×)". Bloco **resultado** com trecho. A peça espera no cabeçalho ("A Rita terminou um resumo · Enter abre") e pousa ao lado do README | Lei 1, lei 4; primeiro contato com a memória com autoria |
| 1:15–2:30 | "+ agente" no painel: nome ("Lia"), o que faz ("responde clientes no WhatsApp e resume reuniões"), jeito (curto). **Pôr foto → Gerar**: o app propõe dois objetos ("um telefone · um fone"), 10–20 s, Carla aprova um. O quadrado da aba recebe o retrato com o contorno na cor dela. Chegada: por padrão um crossfade de 400 ms da inicial para o retrato; o clipe de 4 s é candidato com portão (§9, item 6). A Lia escreve: "Sou a Lia, agente da Carla. Comecei agora e já li o que a equipe aprendeu (76). O que faço primeiro?" | FUNCOES C; §9 itens 4–6; o "nasce sabendo" (§6) |
| 2:30–3:30 | Carla arrasta a ficha da demanda até o ❯ (ou Ctrl+Enter): vira chip. Pede: "escreve o que faltou no README e cria uma demanda para o Theus revisar até sexta". Bloco **plano** (3 passos, editável) → Enter → dois blocos **ação** com desfazer ("criei `Carla/Notas/faltou-no-readme.md`", "criei a demanda #42 para o Theus · prazo sexta · seu Selo aberto") → **resultado** com miniatura 96×54. A linha da árvore, a aba e o bloco acendem juntos e esfriam em 6 s | Lei 4, lei 3 ("um evento, três luzes"), lei 2 |
| 3:30–4:30 | Carla marca "Pronta" na demanda que recebeu (escreve o aprendizado em uma linha). Rodapé: "1 esperando OK de Theus". **Ramo A** (Theus online, o normal com 11 pessoas): na tela dele o anel em `--atencao`; ele clica OK; na tela dela: "OK · Theus · 14:32" com o herói "selo abre" (400 ms); a TV da sala mostra no mural "Carla · primeira demanda pronta · 14:32" e a Lia aparece em "agora" com "→ demanda #42". **Ramo B** (ninguém online): o aha é o OK que ela dá à ação da Lia ("OK · Carla · 14:31"), a miniatura da Lia entra na cachoeira da TV com o Selo e o rodapé diz "Salvo na equipe" | Lei 2 (herói 3); FUNCOES I; §7 |
| 4:30–5:00 | Ctrl K → "Perfil Lia": "1 trabalho · 1 OK · aprendeu com Davi 1". Fim | §2 (história) |

**Medição**: (a) tempo do token até o primeiro bloco de ação com Selo (meta < 4 min); (b) "a TV mostrou" registrado como evento; (c) "Gerar retrato" ≤ 20 s e aceito na primeira ou segunda tentativa. Se (a) falhar em 2 de 5, o roteiro corta a criação do agente (a Carla usa a Rita) e a geração do retrato vai para depois do aha.

---

## 5. Como o terminal some sem perder poder

O terminal não é escondido; ele é **traduzido**, e a versão crua fica a um clique.

1. **Uma entrada só**: o campo ❯ aceita pedido em português ou comando (`coop …`, `ls`, `git status`); detecta qual é (o "Universal Input" da Warp, https://www.warp.dev/blog/reimagining-coding-agentic-development-environment). Ctrl K é a única outra porta (lição das fusões confusas: Cowork + chat, https://claude.com/blog/cowork-is-now-claude; "Post-merger app has become a mess", https://hn.algolia.com/api/v1/search?query=%22Codex%20app%22&tags=comment).
2. **Todo comando vira bloco comum** (FUNCOES C: "comandos coop e shell como blocos"): título humano de uma linha ("Lia listou a pasta Clínicas · 12 arquivos"), e por baixo, colapsado, "**ver o comando**": comando, saída, código de saída, tempo, em mono 12,5 px. Bloco fechado = imutável. Nada é resumido sem o original ao lado.
3. **Toda ação do agente que toca o mundo** (arquivo, Máquina, WhatsApp, TV, demanda, terminal de outro) deixa bloco **ação** com desfazer (rompe o Selo com nome e hora) e, quando cabe, o Selo aberto de quem precisa consentir. "■ parar" e Esc sempre.
4. **As peças pousam no meio** (lei 4): o resultado não é texto num terminal, é uma nota, uma tabela, uma tela, uma peça da Máquina, um galho de mapa, que aparece na bancada da pessoa (ou espera se ela está digitando). A conversa tem peças na mesa; o agente e a pessoa apontam para as mesmas coisas (chips do Puxar).
5. **Os colegas se chamam pelo nome**: "@Lia" no chat da equipe manda o pedido para o Registro da Lia e devolve **um** cartão de resultado com Selo na thread, com link para o bloco (como o checklist do Claude Tag no Slack, https://claude.com/docs/claude-tag/overview, mas o trabalho vive no objeto). O chat é porta, não segundo lugar: nunca dois lugares para a mesma tarefa.
6. **A parede de Terminais** vira a parede de colegas: um cartão por agente (retrato, dono, "→ objeto", "pensando há 4 s", "esperando OK de Carla · 3", Entrar · Chamar · Falar · Assumir · Sair; "Pedir para os outros" = Selo aberto). O dono vê "Davi está no seu terminal · Encerrar" no rodapé.
7. **O terminal real existe** (FUNCOES C, L): Ctrl+J abre xterm.js + node-pty numa aba do meio ("Terminal · Carla"), na mesma pasta `~/BabelCoop` em que o agente trabalha; "entrar no terminal de X" pede Selo; a casca é DOM/SVG e o xterm só vive ali (armadilha "terminal que pisca", https://api.github.com/search/issues?q=repo:anthropics/claude-code+is:issue+is:open&sort=reactions-%2B1).
8. **No celular** não há terminal: o painel abre como folha inteira e lê como conversa com um colega (blocos, retrato no cabeçalho "→ README.md · pensando há 4 s", OK por toque). **Na TV** nunca aparece saída de terminal: só resultados com Selo.
9. **Poder que fica**: `coop` inteiro, shell, MCP/skills/plugins pela Loja, navegador do agente com Assumir/Devolver, Máquina pelo terminal, "muda no app: …" (Oficina). O que muda é só a forma: bloco em português com o original dobrado.

---

## 6. Contexto compartilhado que melhora com mais gente (efeito de rede interno)

A memória da equipe já existe (FUNCOES F: Acervo, Aprendizados com +1, Melhores prompts, Sonho; B: presets com quem fez e usos; E: ideias faladas com hora e quem apertou). O que a v3 acrescenta é **autoria visível no uso** e **nascimento com memória**:

1. **"O que consultei" com nome** (bloco consulta): todo item da equipe que o agente usou aparece com autor e contagem ("Aprendizado · Davi · reembolso · usado 7×"; "Preset · Login com empresa · Davi · 7 usos"; "Ata · 12/09 · decisão 3"). O autor recebe a luz (meia-vida curta, relevância: dirigido a mim): "Lia usou o seu aprendizado". É a única forma de uma pessoa ver a própria contribuição virando trabalho de outra, e é o oposto da vigilância: acende só para o autor, nunca "quem consultou o quê" para os outros (Zed Delta apanhou por "reviewing every single intermediate edit", https://hn.algolia.com/api/v1/search?query=Zed%20Delta%20PRs&tags=comment).
2. **Nasce sabendo**: todo agente novo começa com a memória da equipe carregada e diz o número na primeira linha ("já li 76 coisas que a equipe aprendeu"). Com 11 pessoas, o décimo primeiro agente nasce tão bom quanto os dez anteriores tornaram a memória. Mais gente → mais aprendizados, presets e atas → agentes melhores para todos → mais gente quer ficar dentro. É o efeito de rede da Frente 3 ("só existe quando o trabalho fica dentro", Figma/Notion/Linear/Slack, https://kwokchain.com/2019/08/16/the-arc-of-collaboration/ · https://linear.app/now/sharing-growth-with-the-people-building-linear).
3. **Perguntas abertas**: quando a consulta de um agente dá "Nada encontrado · 0 de N" (FUNCOES F), ele deixa uma "pergunta aberta" no Acervo; quem responde ganha o +1 e o agente que perguntou volta a consultar. A equipe alimenta a equipe.
4. **Contador da memória** no cabeçalho do Acervo ("memória da equipe: 76 → 81 esta semana") e como o **número público de segunda** na TV e no site (§11, ponto 6).
5. **Perfil do agente mostra de quem aprendeu** ("aprendeu com: Davi 12 · Carla 4"): a história do colega é a história da equipe.
6. **Privacidade fixa**: WhatsApp nunca vai ao Acervo nem à TV (FUNCOES H); "Conversa particular" pausa a escuta; a luz só acende para o que me toca (lei 3).

**Número mágico candidato** (Slack: 2.000 mensagens → 93 % ficam, https://review.firstround.com/from-0-to-1b-slacks-founder-shares-their-epic-launch-strategy/): **20 Selos fechados + 10 consultas com autor** numa equipe. Teste em 30 dias: % das ações de agentes que citam ≥ 1 item da equipe (meta ≥ 50 %).

---

## 7. Gestão de equipe com prova (quem está com o quê, agora)

Regra: **nada é dito sem o objeto**. Cada linha de gestão é um link para a coisa real, com a última prova e o Selo.

- **Equipe → Agora** (primeira zona da atividade Equipe; a mesma zona na TV): uma linha por pessoa **e** por agente: "Carla → landing.html · há 2 min · demanda #41 00:12:40" · "Lia (Carla) → WhatsApp Clínica Vida · 3 sugestões esperando OK de Carla" · "Otto (Davi) → Máquina Clínicas · montando · pensando há 4 s". Prova: miniatura real 96×54 do último resultado com o anel do Selo no canto; clique abre o objeto só leitura ("Chamar para cá" continua sendo o convite). Presença por meia-vida média. Só "agora": sem histórico por pessoa na TV, sem mapa de calor, sem ranking (CONCEITO §8).
- **A ficha da demanda é o livro-razão**: pedido por · começou · pausou (motivo) · retomou · pronta (aprendizado) · **OK só de quem pediu** (herói 400 ms) · rompido por X · hora · "voltou como estava". Tudo já no FUNCOES D e na lei 2; a v3 só põe a mesma ficha, resumida em uma linha, no "Agora".
- **Carga** (só gestão, FUNCOES G) passa a incluir agentes: consumo por agente (tokens/US$) ao lado das horas das pessoas. Armadilha "quotas invisíveis" (Antigravity, Claude Max, Codex 5 h; Frente 2 §5): nunca surpresa.
- **Aceites** por agente (§2): OK vs rompido na semana, só para dono e gestão; a **rotina** é concessão registrada ("rotina liberada por Carla · 14:00 · Responder para contatos marcados") e cada ação de rotina grava "rotina · Lia · hora". Se um agente passa a ser rompido mais do que aceito, a gestão vê no Perfil dele; nada acontece sozinho (o Selo aberto fica aberto; Codex "disable 60-second auto-resolve", 214 reações, https://api.github.com/search/issues?q=repo:openai/codex+is:issue+is:open&sort=reactions-%2B1).
- **Rodapé**: "3 esperando meu OK" continua sendo a casa da gestão; a coluna de novidades lista os Selos abertos dirigidos a mim.
- **Cuidando da gente** (FUNCOES F/G) fica como está: sinais que persistem, aviso à pessoa antes da TV, nunca ranking.

---

## 8. As superfícies

- **Estação** (CONCEITO §3 inteiro): à esquerda Arquivos, no meio Trabalho, à direita Agentes. Novo: retrato dentro do quadrado de 14 px; "+ agente" com "o que faz", "jeito" e "Pôr foto → Gerar"; "ver o comando" dobrado em todo bloco de comando; ícone de alto-falante (voz, opt-in) no bloco de resultado; Equipe → Agora; Perfil do agente como aba inteira; a parede de Terminais com retratos. Tudo o mais igual: cabeçalho de 56 px, Selo, meia-vida, Puxar, Ctrl K, rodapé de oito casas.
- **TV** (16:9, sem botão, F): o **mural**: zona "agora" (pares pessoa/agente → objeto, tempo, anel); **cachoeira** dos últimos resultados **com Selo** (miniaturas reais 96×54 ampliadas na grade, nunca resultados esperando OK: só a contagem); **chão 3D** da zona "evolução dos projetos": a Máquina real do projeto (peças em DOM/three.js + as geometrias geradas do §9, câmera fixa, luz fixa), que muda só quando o backend muda (crossfade 400 ms) e onde o retrato 3D do agente aparece ao lado da peça que ele está montando; retrospectiva de sexta (7 linhas + fala humana em Cormorant, sequência de telas, sem imagem gerada); placar de metas, cronômetros, relógio; Visita em Latte como **link** para cliente (sem dado sensível). Sem som, sem loop, sem fundo que respira, sem retrato animado (CONCEITO §3.5, §8).
- **Celular** (< 760 px): abas de 56 px; o painel de agentes abre de "Mais" ou da borda direita como folha inteira e lê como conversa com um colega: retrato no cabeçalho "→ README.md · pensando há 4 s", blocos, Selo de 24 px em alvo de 48 fechado por toque; "Gerar retrato" funciona; voz só após toque; sem terminal, sem Ctrl+J.
- **iPad** (`#ipad`): inalterado: só o quadro, sem cromo, caneta/marca-texto/borracha/post-it/texto, risca na TV, salva no `.quadro`, Projetar na TV. Sem agente, sem retrato, sem som (FUNCOES J; CONCEITO §3.5).

---

## 9. Elementos gerados (12), cada um com função, modelo, entrada, prompt, saída, custo

Regras herdadas (GERACAO_REPLICATE.md §0 e PROMPT_AGENTICO_LP.md §1): keyframe antes de vídeo; SVG nativo para ícone; saídas baixadas em ≤ 1 h; seed `19770815` onde há; schema lido antes; `enable_prompt_expansion: false`; sem áudio automático (`-an`); `Cancel-After: 15m` e polling em vídeo; toda animação com desligamento; orçamento duro com `MANIFESTO.json`; **um efeito só entra se for metáfora do serviço**. Preços lidos pelas frentes nas páginas da Replicate em 23/09/2026 (`visao-geracao-viva.md` §1, §3, §4, §5) e por mim nas cinco páginas de texto→fala; conferir `billingConfig` antes de cada lote.

**Bloco-base isométrico** (usado nos itens 4, 5, 6, 7, 8; de GERACAO §3.4):
```
isometric orthographic view, elevation 35 degrees, rotated 45 degrees, single object centered, one small key light from upper-left, soft fill, no cast shadow on ground, matte dark slate body, uniform 2mm beveled edges, one thin cyan edge light, solid #060b16 background, no text, no labels, no people, clean product render, same scale as reference sheet, the object fits a 1-unit cube. [NEGATIVE] no perspective, no ground plane, no gradient background, no extra objects, no letters, no reflections of environment, no faces, no glow
```

| # | Elemento | Função no serviço (metáfora) | Modelo (slug confirmado) | Entrada | Saída e uso na UI | Custo (US$) |
|---|---|---|---|---|---|---|
| 1 | **61 ícones em SVG nativo** (43 casca + 12 peças + 6 estados; +4 do Supabase = 65) | "A mesma mão": o instrumento é um só objeto; cada ícone é rótulo de função | `recraft-ai/recraft-v4-svg` (`prompt`, `size "1024x1024"`; sem seed; 0,08) | bloco de prompt idêntico + um sujeito por chamada (GERACAO §3.1) | `.svg` com `<path stroke>`, viewBox 20, `currentColor`, sprite `<symbol>`; estáticos | 0,24 (portão de 3) + 6,34 (lote) |
| 2 | **Keyframes A e N do "b"** | O material da marca é um só (chapado, fosco): poster da Entrada e imagem de compartilhamento | `google/nano-banana-2` (`image_input: [babel-logo.png]`, 1:1, 2K, png; sem seed; 0,101) | `prototipo/babel-logo.png` | 2 png 2K; A = b em `--texto`, N = 15 % do traço em `--t0` | 0,40 |
| 3 | **Clipe de Entrada da pessoa** (candidato com portão; base = b em SVG que se desenha, custo 0) | O token convoca; a marca se escreve uma vez e vira o b estático | rascunho `bytedance/seedance-2.0-fast` (480p, 4 s, 0,07/s) → final `wan-video/wan-2.7-i2v` (720p, 4 s, 0,10/s) | `first_frame` = N, `last_frame` = A, seed, `-an` | mp4 720p 4 s sem áudio = a própria tela de login; termina em A; qualquer tecla pula | 0,28 + 0,40 = 0,70 (teto 1,40) |
| 4 | **Folha de estilo dos retratos** (8 arquétipos de "o que faz") | Todos os colegas têm a mesma escala e o mesmo material: são da mesma casa | `google/nano-banana-2` (1K, png; 0,067) | prompt da folha + bloco-base | 1 png 1K com 8 objetos; é a referência de todos os retratos | 3 × 0,067 = 0,20 |
| 5 | **Retrato-ferramenta por agente** | O colega tem cara de instrumento, não de gente: diz o que faz e herda a cor do dono | `google/nano-banana-2` (1K, `image_input: [folha.png]`; 0,067) → `bria/remove-background` (`preserve_alpha`; 0,018) | "o que faz" → arquétipo ou objeto livre; folha como referência | png com alfa 1K; dentro do quadrado 14 px, ≥ 24 px no Perfil/parede/TV | 0,085 por tentativa; ≈ 0,17 por agente (2 tentativas); 11 agentes ≈ 1,9 |
| 6 | **Chegada do agente** (candidato com portão; base = crossfade CSS 400 ms) | O colega toma forma a partir do que a pessoa descreveu; a mesma Entrada, agora para um agente | rascunho `bytedance/seedance-2.0-fast` (480p 4 s) → final `wan-video/wan-2.7-i2v` (720p 4 s) | `first_frame` = cubo de ardósia (nano-banana-2 com a folha) · `last_frame` = retrato aprovado; seed; `-an` | mp4 4 s dentro do painel, uma vez, na criação; termina no retrato estático; qualquer tecla pula | 0,68 por agente no teste (3 agentes = 2,04); aprovado, 0,40 por agente novo |
| 7 | **Retrato 3D do agente** (só com o modo 3D da TV construído) | Na TV, o colega está fisicamente ao lado da peça que monta: "quem está com o quê" tem forma | `firtoz/trellis` (`images` array, seed, `randomize_seed false`; 0,035) → `gltfpack -cc -tc` | png recortado do item 5 | glb ≤ 120 KB, albedo descartado, matcap da casa; posicionado por dado (o objeto do cabeçalho do agente) | 0,105 por agente (3 seeds); 11 = 1,16 |
| 8 | **Peças orgânicas da Máquina em 3D** (Portaria, Cofre + Armário, Carteiro, Casa de máquinas, Ferramenta) | O backend que a equipe construiu existe e tem forma; a TV mostra o sistema real, não um wallpaper | folha `google/nano-banana-2` 1K → keyframe `black-forest-labs/flux-2-max` (`input_images`, seed; 0,04 + 0,03/MP) → `bria/remove-background` → `firtoz/trellis` (+ `tencent/hunyuan3d-2mv` para o Cofre por trás, ≈ 0,13, preço **não confirmado**) | bloco-base + `[PIECE]` | glb ≤ 120 KB cada; chão 3D da TV e modo 3D da Máquina; muda só com dado | ≈ 1,9 (2 peças, já orçado) + ≈ 1,0 (4 do Supabase) |
| 9 | **Imagens do site** (3 cenas: a sala com a TV, a Estação de longe, a Visita em Latte) | Criação pública: a sala é a peça de marketing (Midjourney: a cachoeira pública era o marketing) | rascunho `google/nano-banana-2` (2K, 0,101) → final `black-forest-labs/flux-2-max` (`input_images: [rascunho]`, seed) | prompts abaixo | png 4 MP; só site/LP; nunca atrás de texto do app | ≈ 1,6 (2 iterações) |
| 10 | **Filme de marca de 15 s para o site** (3 planos numa geração) | A demo é captura real do protótipo; o filme é só a moldura: a sala, a TV, a Visita | rascunho `bytedance/seedance-2.0-fast` (480p, 15 s, 0,07/s) → final `kwaivgi/kling-v3-video` (`multi_prompt` 3 shots, pro 1080p, `generate_audio false`; 0,224/s) ou `bytedance/seedance-2.0` (720p, 0,18/s) | `start_image` = cena 1 aprovada; seed | mp4 15 s sem áudio, `muted playsinline poster`, `prefers-reduced-motion` = poster | 1,05 + 3,36 = 4,41 (teto 2 tentativas ≈ 8) |
| 11 | **Som "espera"** (só se o oscilador Web Audio soar barato a 3 pessoas) | O agente precisa de você e você olhou para outro lado: um só canal sonoro | `stability-ai/stable-audio-2.5` (`duration 3`, `steps 8`, `cfg_scale 7`, seed; 0,20) | prompt GERACAO §3.5 | wav → mp3/ogg ≤ 300 ms; desligado por padrão; nunca na TV/iPad | 0–0,40 |
| 12 | **Voz do agente** (opt-in, após gesto) | O colega lê a própria entrega em voz alta quando você pede; um timbre por agente, fixo | `resemble-ai/chatterbox-multilingual` (`language_id "pt"`, `exaggeration`, `cfg_weight`, `temperature`, `seed`; **0,0059/execução**, "169 runs per $1"; lido em https://replicate.com/resemble-ai/chatterbox-multilingual) · alternativa `google/gemini-3.1-flash-tts` (`text` ≤ 4.000 bytes, `voice` (30), `prompt` de estilo, `language_code`; preço **não na página**; lido em https://replicate.com/google/gemini-3.1-flash-tts) | texto do bloco de resultado (≤ 4.000 bytes) | áudio por fala, tocado no painel após clique; nunca na TV/iPad; nunca clone de voz real (`reference_audio` proibido) | 0,0059 por fala; 100 falas = 0,59 |

**Totais**: casca (1, 2, 3, 8, 11) ≈ 12,2 · colega (4, 5, 6, 7, 12) ≈ 5,9 · site (9, 10) ≈ 6,0–9,6 → **≈ 24–28**. Três `MANIFESTO.json` (`icones`, `colega`, `site`). Ordem: portão dos ícones → keyframes A/N → folha dos retratos → 3 retratos (teste) → chegada (3, teste) → resto.

### 9.1 Prompts prontos (inglês, colar como está)

**Item 4 · folha de estilo dos retratos** (`google/nano-banana-2`, 1K, png):
```
Style sheet with eight small tool objects in two rows of four at identical scale, evenly spaced, each inside an invisible 1-unit cube: (1) a telephone handset, (2) a magnifying glass, (3) an adjustable wrench, (4) a fountain pen, (5) a small filing drawer, (6) a stopwatch, (7) a pair of over-ear headphones, (8) a drafting compass. <bloco-base>
```
Aceite: 8 objetos, mesma escala, sem letras, sem rosto, sem brilho; 3 pessoas identificam os 8 a 24 px.

**Item 5 · retrato por agente** (`google/nano-banana-2`, 1K, `image_input: [folha.png]`):
```
Same style, light, material and scale as the reference sheet. [PIECE] a telephone handset resting on its cradle, single object, centered, nothing else. <bloco-base>
```
(Trocar `[PIECE]` pelo arquétipo escolhido ou pelo objeto que a pessoa escreveu; um objeto por chamada.) Depois `bria/remove-background` com `preserve_alpha: true`. Aceite: nenhum rosto, letra, brilho ou fundo; silhueta legível a 14 px (teste com 3 pessoas a 24 px); no máximo 2 tentativas por agente; se falhar, fica a inicial.

**Item 6 · chegada do agente** (`first_frame` = cubo, `last_frame` = retrato; 4 s; seed 19770815):
- Keyframe do cubo (`google/nano-banana-2`, `image_input: [folha.png]`): `Same style, light, material and scale as the reference sheet. A plain matte dark slate cube, 1 unit, centered, no edge light, nothing else. <bloco-base>`
- Vídeo (`bytedance/seedance-2.0-fast` → `wan-video/wan-2.7-i2v`):
```
[LENS] fixed 50mm orthographic look, locked-off camera, no movement. [MOTION] over 4 seconds the plain dark slate cube in the first frame is shaped into the object in the last frame, as if cut by an invisible lathe, at constant speed, no hands, no tools visible; in the final second the thin cyan edge light appears and everything holds perfectly still. [SUBJECT] a single matte dark slate object, exactly as in the last frame, on solid #060b16. [LIGHT] one small key light from upper-left, soft fill, no cast shadow. [NEGATIVE] no camera motion, no zoom, no cut, no flicker, no glow, no halo, no gradient background, no text, no extra objects, no hands, no people, no sound.
```
`negative_prompt: camera shake, zoom, cut, flicker, text, watermark, lens flare, bloom, glow, hands, people, extra objects, color banding` · `enable_prompt_expansion: false` · pós `ffmpeg -an -pix_fmt yuv420p -crf 18`. Aceite: quadro 0 e último indistinguíveis dos keyframes (≤ 1 nível); rejeitar halo ou objeto intermediário estranho. **Portão**: só entra se 3 pessoas o preferirem ao crossfade CSS lado a lado.

**Item 7 · retrato 3D** (`firtoz/trellis`):
```json
{ "images": ["<retrato-recortado.png>"], "seed": 19770815, "randomize_seed": false, "mesh_simplify": 0.95, "texture_size": 512, "generate_color": true, "generate_normal": false, "generate_model": true }
```
→ `gltfpack -cc -tc`; albedo descartado; matcap da casa. Aceite: fecha o cubo de 1 unidade sem furo; 3 seeds, fica a melhor.

**Item 8 · peças do Supabase** (`black-forest-labs/flux-2-max`, `input_images: [folha-maquina.png]`, seed; sujeitos a `docs/design/SUPABASE_PECAS.md`):
```
Same style, light and scale as the reference sheet. [PIECE] a small wall cabinet with two closed doors and one handle (Armário)
Same style, light and scale as the reference sheet. [PIECE] a small mail cart with a single satchel on top (Carteiro)
Same style, light and scale as the reference sheet. [PIECE] a compact engine-room block with a vent grille on the front (Casa de máquinas)
Same style, light and scale as the reference sheet. [PIECE] a single screwdriver standing upright on a small square base (Ferramenta)
```
(+ os prompts de Portaria e Cofre de GERACAO §3.4.)

**Item 9 · imagens do site** (`google/nano-banana-2` 2K rascunho → `black-forest-labs/flux-2-max` final, seed 19770815):
```
Cena 1: Wide photograph of a small Brazilian office at dusk, eleven desks in a loose U shape, a large wall-mounted TV showing a dark dashboard (#060b16) made of thin light lines and small squares, no readable text on any screen, warm desk lamps, one person standing near the TV seen from behind, matte surfaces, 35mm lens, f/4, natural key light from a window at left, quiet and orderly. [NEGATIVE] no logos, no readable text anywhere, no faces in focus, no gradient overlays, no glow, no lens flare, no watermark, no cartoon, no oversaturation.
Cena 2: The same office seen from the doorway; in the foreground one workstation with a three-column dark interface on the monitor (narrow left column, wide center, narrow right column), no readable text, a small cyan square on the right column, hands on the keyboard, same light and lens as the reference. [NEGATIVE] same as above.
Cena 3: The same wall TV now in a bright cream mode (#fff8e7) with thin dark lines and no readable text, daylight, a visitor in a jacket turned toward it, the team at their desks slightly out of focus, same lens as the reference. [NEGATIVE] same as above.
```

**Item 10 · filme de marca 15 s** (`kwaivgi/kling-v3-video`, `start_image` = cena 1, `multi_prompt` 3 × 5 s, `generate_audio false`, seed):
```
Shot 1 (5 s): locked-off wide of the office at dusk; nothing moves except the thin lines on the wall TV, which change once, slowly.
Shot 2 (5 s): slow dolly-in, 0.4 m over the whole shot, toward one workstation; on the screen's right column a small square lights up in cyan for a moment and then rests.
Shot 3 (5 s): the wall TV in cream mode; a visitor turns toward it and stops; hold perfectly still for the last two seconds.
[NEGATIVE] no readable text, no logos, no faces in close-up, no extra people, no glow, no lens flare, no camera shake, no cut inside a shot, no sound.
```
`negative_prompt: text, watermark, logo, glow, lens flare, camera shake, close-up faces, extra people, cartoon`. Rascunho em `bytedance/seedance-2.0-fast` 480p antes. Aceite: nenhum texto legível surge; nenhum rosto em foco; último quadro parado. Uso: `<video autoplay loop muted playsinline poster>` só no site; `prefers-reduced-motion` = poster; pausa fora da viewport.

**Item 11 · som "espera"** (`stability-ai/stable-audio-2.5`): prompt de GERACAO §3.5 (`Minimal user-interface sound, dry studio recording... One gentle glass ping, 300 ms, low volume.`), `duration 3`, `steps 8`, `cfg_scale 7`, seed.

**Item 12 · voz do agente** (`resemble-ai/chatterbox-multilingual`):
```json
{ "text_to_synthesize": "Sou a Lia, agente da Carla. Estou com o WhatsApp da Clínica Vida. Três respostas esperam o seu OK.", "language_id": "pt", "exaggeration": 0.4, "cfg_weight": 0.5, "temperature": 0.6, "seed": 19770815 }
```
(Sem `reference_audio`: nunca clonar a voz de uma pessoa real.) Alternativa `google/gemini-3.1-flash-tts`: `{ "text": "<mesmo texto>", "voice": "Kore", "language_code": "pt-BR", "prompt": "Speak calm, neutral Brazilian Portuguese, unhurried, like a colleague reporting across a desk; no drama, no emphasis." }`. Aceite: 3 pessoas entendem a frase inteira; sotaque aceitável para a Babel; timbre fixo por agente (seed/voz gravados no Perfil). **Não confirmado**: se `pt` no Chatterbox soa pt-BR (a página lista só `Portuguese (pt)`); se o Gemini TTS aceita `pt-BR` como código (a página cita "Portuguese" e "BCP-47"); preço do Gemini TTS na Replicate (não na página).

---

## 10. O que NÃO se gera, e por quê

1. **A interface (casca)**: precisa responder em < 100 ms (CONCEITO §4.4); UI generativa leva "a minute or more" com "occasional inaccuracies" (https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/); "output isn't design" (https://linear.app/now/output-isn-t-design). Peça gerada sob pedido só como aba efêmera no meio, com Selo e preset (Frente 1 §6).
2. **Rostos humanos para agentes**: o agente é quadrado, a pessoa é círculo; rosto gerado é o sinal 4 do slop (https://en.wikipedia.org/wiki/AI_slop) e fingiria gente; Sora bloqueia semelhança humana por padrão (https://developers.openai.com/api/docs/guides/video-generation).
3. **Fotos ou retratos de pessoas por IA**: pessoa usa foto real (FUNCOES G).
4. **Loop na TV, fundo que respira, "campo profundo"**: cortados no CONCEITO §7/§8; "nice the first time, but now it's getting annoying" (https://www.nngroup.com/articles/animation-usability/); WCAG 2.2.2 exige pausa acima de 5 s (https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).
5. **Texto dentro de imagem ou vídeo gerado**: Wan avisa que "text or small patterns… may not be perfectly preserved" (https://replicate.com/wan-video/wan-2.7-i2v); Genie 3 só rende texto que veio na descrição (https://deepmind.google/blog/genie-3-a-new-frontier-for-world-models/). Todo texto que a equipe lê nasce em SVG/HTML.
6. **Ilustração do Sonhar, da pergunta da semana, da ideia falada, da ata, do aviso**: ninguém pediu ("thrust upon someone who didn't ask for it", https://simonwillison.net/2024/May/8/slop/); a fala humana é Cormorant em Latte.
7. **Vídeo de "agente pensando" ou de "entrega"**: o estado é o anel + "pensando há 4 s" medido; movimento sem dado é o sinal 6 do slop (https://vercel.com/design; HIG Motion: "Don't add motion for the sake of adding motion", https://developer.apple.com/tutorials/data/design/human-interface-guidelines/motion.json).
8. **Confete, fogos ou clipe na meta a 100 %**: o anel fecha em 800 ms, `--ouro` chapado, uma vez; a Frente 1 listou o "clipe de estado" como possível e a Frente 4 o recusou por falta de metáfora: fica recusado.
9. **Prova de resultado gerada**: a miniatura 96×54 é captura real do app; imagem gerada fingindo resultado é o erro de "Remember Devin? It's good now" (https://hn.algolia.com/api/v1/search_by_date?query=Devin%20Cognition&tags=comment).
10. **Voz clonada de gente da equipe**: `reference_audio` proibido; vozes só de catálogo.
11. **Mundo 3D navegável / world model como interface**: Genie 3 e Project Genie são prévia para assinantes Ultra sem API; Odyssey é demo (https://labs.google/projectgenie · https://odyssey.systems/). O chão 3D da TV é geometria gerada uma vez e renderizada localmente.
12. **Vídeo em tempo real como estado** (Decart Lucy 2.5: US$ 0,02/s = 72/h por stream; 11 streams ≈ 792/h; exige UDP; https://docs.platform.decart.ai/getting-started/pricing): só cabe um dia como momento de Reunião, não nesta versão.
13. **Sons além de "espera"**, insígnias, matcap, anel, Selo, chip, grade, b estático, coluna de intensidade, linha do agente: tudo à mão, custo zero (GERACAO §1).
14. **Demo de 60 s gerada**: a demo é captura real do protótipo (Frente 3 §6); a Replicate faz só o filme de marca do site.
15. **Retrato animado na TV ou no cartão**: o retrato é estático; o único movimento do colega é o anel de estado.

---

## 11. Estrutura de líder em 7 pontos verificáveis (Frente 3 §5, cruzada com este conceito)

1. **Um nome de categoria, uma linha**: "Trabalho à vista" + a linha do §1. Teste: 3 empresários de fora repetem no dia seguinte, sem reler. Fonte do padrão: Warp, Linear, Lovable (§1).
2. **Um gesto que paga em segundos**: token → primeiro bloco de ação com Selo em < 5 min, 5 de 5 novatos, sem ajuda (roteiro do §4); "Gerar retrato" ≤ 20 s. Fonte: Cursor Tab (https://sacra.com/c/cursor/), Superhuman < 100 ms, Slack 2.000 mensagens.
3. **O trabalho fica dentro**: ≥ 80 % das demandas da Babel nascem, rodam e fecham com Selo sem sair do app em 30 dias; ≥ 90 % das ações de agentes com Selo ou rotina registrada; ≥ 50 % das ações de agentes citam ≥ 1 item da memória da equipe. Fonte: Figma, Notion, Linear (95 % dos workspaces com agentes), Kwok 2019.
4. **Criação pública por padrão**: a TV mostra ≥ 20 itens selados por dia; o modo Visita existe como link; ≥ 1 pedido de acesso por semana vindo de quem viu a TV ou o link. Fonte: Midjourney (https://www.theregister.com/2022/08/01/david_holz_midjourney/), Lovable, Manus.
5. **Rito de entrada escasso e com gente**: token + 30 min guiados por alguém da Babel; após 4 semanas, ≥ 40 % dos 11 respondem "muito desapontado" se perdessem o Babel. Fonte: Superhuman (40 %), Slack (preview), Manus (fila).
6. **Um número público por semana**: toda segunda, "memória da equipe" (aprendizados + presets + ideias, e quantas vezes agentes a consultaram) na TV e no site, 12 semanas seguidas. Fonte: Cursor (1 bi caracteres/dia), Lovable (100 mil projetos/dia), Warp (75 mi linhas, 95 %).
7. **Imposto da novidade sob controle**: % de pessoas que usaram cada lei e cada elemento gerado (retrato, chegada, voz, chão 3D, Agora) nesta semana; qualquer um < 20 % em 30 dias entra no plano de retirada (§13). Fonte: Arc (5,52 % / 4,17 %, https://browsercompany.substack.com/p/letter-to-arc-members-2025), Dia, Linear.

---

## 12. Anterioridade honesta (o que já existe parecido e a diferença exata)

| Já existe | URL lida | Diferença exata do Babel |
|---|---|---|
| Notion 3.0: agente mencionável em páginas, "Anything you can do in Notion, your Agent can do too" | https://www.notion.com/blog/introducing-notion-3-0 | o agente age em arquivo, Máquina, WhatsApp, TV e terminal, com Selo; tem dono, retrato-objeto, história e aceites |
| Linear: agente é `delegate`, "Agent Session" visível, "Text attribution", "conditional tool call approval" | https://linear.app/developers/agents · https://linear.app/changelog · https://linear.app/now/how-we-built-linear-agent | o consentimento é objeto em três estados (aberto · selado · rompido) em três colunas, sem modal; cronômetro com OK só de quem pediu; rotina como concessão registrada |
| GitHub Agent HQ: identidade do agente "just like… any other developer"; PR revisado "the same way you'd review a teammate's work" | https://github.blog/news-insights/company-news/welcome-home-agents/ · https://github.blog/news-insights/company-news/pick-your-agent-use-claude-and-codex-on-agent-hq/ | a identidade vive no objeto de trabalho e na parede, não no PR; herda a cor da pessoa dona |
| Claude Tag: memória por canal, checklist na thread; Claude Projects: memória compartilhada entre threads ("aren't available on Team or Enterprise plans yet"); Cursor Projects: memória entre agentes | https://claude.com/docs/claude-tag/overview · https://code.claude.com/docs/en/claude-projects · https://cursor.com/blog/projects | memória **de pessoas**, com autoria citada no bloco consulta e luz para o autor; agente nasce com a memória e diz o número |
| Devin Knowledge / Playbooks: "share tips, docs, and instructions Devin recalls across sessions" | https://docs.devin.ai/llms.txt | sem autoria visível no uso; só código; sem sala |
| Zed Delta: pessoas + agente no mesmo thread, "they can keep working with the agent where you left off" | https://zed.dev/blog/introducing-delta · https://zed.dev/blog/delta-public-beta | só código; lido como vigilância; o Babel acende só para quem escreveu e nunca mostra "quem consultou o quê" |
| Claude Code "Buddy" (mascote removido; "Bring Back Buddy", 2.092 reações); Codex "Pets" como sinal de estado | https://api.github.com/search/issues?q=repo:anthropics/claude-code+is:issue+is:open&sort=reactions-%2B1 · https://learn.chatgpt.com/codex/long-running-work | prova que as pessoas querem um companheiro; o retrato do Babel é instrumento com dono, ligado ao estado do trabalho, e pertence à pessoa: nunca é "mascote do app" que se possa tirar |
| Claude `claude agents`: nome tingido por `/color`, ícone por estado, resumo de uma linha | https://code.claude.com/docs/en/agent-view | a cor é da pessoa dona (não da sessão); o estado é medido no objeto ("pensando há 4 s"); o resumo é bloco com o comando dobrado |
| Microsoft Agent 365: registro de agentes com dono, "You can't govern what you can't see" | https://www.microsoft.com/en-us/security/blog/2026/05/01/microsoft-agent-365-now-generally-available-expands-capabilities-and-integrations/ | governança no objeto (Selo, Agora, Carga), não num plano de controle; US$ 0 por usuário |
| Warp Universal Input + blocos; Zed Terminal Threads | https://www.warp.dev/blog/reimagining-coding-agentic-development-environment · https://zed.dev/blog/terminal-threads | blocos em português para quem não programa, "ver o comando" dobrado, terminal real só em Ctrl+J |
| Midjourney: cachoeira pública no Discord | https://www.theregister.com/2022/08/01/david_holz_midjourney/ | a cachoeira é a TV da sala, só com resultados selados, e vira link em Visita |
| Vercel Ship 2025 (gerações → shader); Figma Config 2026 (três texturas com significado) | https://vercel.com/blog/designing-and-building-the-vercel-ship-conference-platform · https://www.figma.com/blog/the-visual-identity-behind-config-2026/ | mesma disciplina (gerar material, publicar código), aplicada a um produto de equipe, com portão por elemento |
| Frente 4 (interna): retrato do agente como objeto; chão da TV = Máquina em 3D | `visao-media-viva-como-dna.md` §5.1 itens 5 e 6 | este conceito dá função de equipe às duas peças (dono, história, aceites; "quem está com o quê" no chão 3D) |
| ElevenLabs Agents / TTS (~75–280 ms) | https://elevenlabs.io/docs/capabilities/text-to-speech | a voz do Babel é leitura do Registro após gesto, um timbre fixo por agente, sem clone; Replicate confirmada com `pt` (Chatterbox) |

**Não lidos** (não confirmado; "não vi" não é "não existe"): Atlassian Rovo, Glean, Lindy, Relevance AI, Salesforce Agentforce, Dust, Sana, Sintra, Google Stitch, Lovable/Bolt como "UI generativa", Pika em detalhe, Tripo, Genspark, Perplexity Computer (403), o site da Midjourney (403).

---

## 13. Riscos e plano de retirada

1. **Antropomorfismo**: o colega vira "gente" e a equipe confia demais ou estranha. Guarda: quadrado × círculo; retrato-objeto, nunca rosto; assinatura "agente da Carla"; o agente nunca diz "eu sinto". Retirada: retrato → inicial; o resto fica.
2. **Efeito Buddy** (tirar o delight depois dói: 2.092 reações): o retrato pertence à pessoa e é dado dela, nunca mascote do app; não se remove em versão futura.
3. **Reputação vira ranking**: aceites só para dono e gestão, nunca na TV, nunca comparados. Retirada: esconder o número, manter o livro-razão.
4. **Custo por agente** (retrato 0,17 + chegada 0,40 + voz): teto de US$ 1 por agente e `MANIFESTO.json` por lote; chegada com portão; voz desligada por padrão.
5. **Retrato vem com rosto, letra ou brilho** (Nano Banana não tem seed): aceite em 2 tentativas; fallback = inicial.
6. **Colisão "colega de máquina" × "Máquina"**: na interface só "agente da Carla"; se 3 pessoas de fora confundirem, cai a tagline.
7. **O aha depende de colega online**: ramo B do §4 (OK próprio + TV); medir os dois.
8. **Memória com autoria vira vigilância**: luz só para o autor; nunca "quem consultou"; WhatsApp fora; "Conversa particular".
9. **Voz**: não determinística; `pt` pode não soar brasileiro; Gemini TTS sem preço na página. Teste com 3 pessoas; desligada por padrão; nunca TV/iPad; nunca clone.
10. **Chão 3D da TV sem o Supabase real** (FUNCOES B) é maquete: só entra quando a Máquina lê o backend de verdade; até lá, a zona mostra as 7 linhas.
11. **Vídeo**: texto não é confiável, causalidade falha ("effects sometimes precede causes", https://runway.com/research/introducing-runway-gen-4.5); todo clipe termina parado, sem texto, com aceite quadro a quadro; halo = rejeitar.
12. **Token da Replicate** passou pelo chat: trocar ao fim; saídas expiram em 1 h; nada de token no manifesto.
13. **Imposto da novidade** (Arc): % de uso por lei e por elemento; retirada por peça (retrato → inicial; chegada → crossfade; voz → desligada; chão 3D → 7 linhas; Agora → o rodapé de hoje).
14. **"Trabalho à vista" lido como "pagamento à vista"**: o segundo sentido é ativo (sem dívida, sem surpresa), mas testar a linha com 3 pessoas de fora; alternativa reserva: "Sala à vista".
15. **"@Lia" no chat como segunda porta**: só recebe; o cartão devolvido linka o bloco; se em teste virar "dois lugares", sai e fica "mensagem vira demanda".
16. **Direitos das mídias geradas**: termos de uso da Replicate, Recraft, Google (Nano Banana, SynthID no Veo) e Resemble **não lidos** nesta missão: não confirmado; conferir antes de publicar o site.
17. **Anterioridade**: "não vi" não é "não existe" (§12).

---

## 14. Orçamento e ordem de execução

| Lote | Itens | Custo est. (US$) | Portão |
|---|---|---|---|
| `icones` | 1 | 0,24 → 6,34 | stroke vs fill nos 3 primeiros; se fill, à mão |
| `casca` | 2, 3, 8, 11 | ≈ 5,8 (teto 7,5) | keyframes A/N antes do clipe; o b em SVG é a base |
| `colega` | 4, 5 (3 agentes), 6 (3 testes), 7 (só com modo 3D), 12 (10 falas) | ≈ 3,0 no teste; ≈ 5,9 com os 11 agentes | folha aprovada antes do retrato; retrato aprovado antes da chegada; chegada vence o CSS com 3 pessoas |
| `site` | 9, 10 | ≈ 6,0 (teto 9,6) | cena 1 aprovada antes do filme; rascunho fast antes do Kling |
| **Total** | | **≈ 21–28** | **[decisão]** orçamento v3 US$ 40, parada em 32 |

Ordem: portão dos ícones → keyframes A/N → folha dos retratos → 3 retratos → 3 chegadas (teste com 3 pessoas) → som (só se o oscilador reprovar) → peças do Supabase quando `SUPABASE_PECAS.md` fechar → cenas do site → filme. Trocar o token da Replicate ao fim.

---

## 15. Fontes

**Lidas por mim nesta sessão (Replicate, texto→fala, 23/09/2026)**: https://replicate.com/collections/text-to-speech · https://replicate.com/resemble-ai/chatterbox-multilingual · https://replicate.com/google/gemini-3.1-flash-tts · https://replicate.com/minimax/speech-02-hd (parâmetros e preço não na página) · https://replicate.com/jaaari/kokoro-82m (sem português; descartado).

**Lidas pelas frentes (citadas acima com a URL)**: Frente 1 `visao-geracao-viva.md` §11 (Replicate: veo-3.1, wan-2.7-i2v, seedance-2.0 e -fast, kling-v3-video, ray-3.2, hailuo-2.3, nano-banana-2 e -pro, flux-2-max, recraft-v4-svg, ideogram-v3-quality, seedream-4.5, trellis, hunyuan3d-2, hunyuan-3d-3.1, stable-audio-2.5, bria/remove-background; DeepMind, Gemini API, OpenAI, Runway, Luma, Decart, Odyssey, Krea, Stability, ElevenLabs, Google Research, v0, Figma Make, Claude Design; Chrome/WebKit/MDN/W3C). Frente 2 `visao-mercado-conversacional.md` §8 (Warp, Cursor, Claude Code/Cowork/Tag/Projects, Codex, Devin, Factory, Zed, Antigravity, GitHub, Replit, Lovable, Manus, Notion, Linear, Slack, Microsoft, Google Workspace, Superhuman, Raycast, Rabbit, Humane, Arc/Dia; HN Algolia; GitHub issues; fórum do Cursor). Frente 3 `visao-lideranca-12-meses.md` §7 (Cursor, Lovable, Linear, Warp, Notion, Superhuman, Arc, Perplexity, Manus, ElevenLabs, Midjourney, Figma, Slack; Sacra como estimativa). Frente 4 `visao-media-viva-como-dna.md` §8 (Apple HIG por JSON, Vercel, Figma, Linear, Raycast, Nothing, Teenage Engineering, Spotify, labs, world models, Journey, Monument Valley, Arrival, Her, calmtech, AI slop, NN/g, WCAG, web.dev, MDN, WebKit, ffmpeg).

**Internas**: `docs/design/CONCEITO.md` · `docs/design/GERACAO_REPLICATE.md` · `docs/FUNCOES.md` · `~/Desktop/stack-video-scroll/PROMPT_AGENTICO_LP.md` · `docs/design/MAQUINA_PECAS.md`, `SUPABASE_PECAS.md`, `TELA_CONSTRUTOR.md` (referidos, não relidos nesta sessão).
