# TV do escritório (wallboard) e tela pessoal "Meu dia": padrões de design e hardware

Contexto do pedido: 11 usuários no mesmo escritório, rede local, uma TV. Pesquisa feita em 22/09/2026. Preços em BRL quando encontrados (voláteis; conferir antes de comprar).

## 1. Quais são as diretrizes de "10-foot UI" e de dashboards para TV (tamanho de fonte, quantidade de widgets, cor, leitura em um relance, rotação, tempo real, animações)?

### Takeaway
Todas as fontes convergem: pouca informação, letras grandes e grossas, alto contraste, cor com moderação, nada que exija clique ou rolagem. A regra física mais citada é 1 polegada (25 mm) de altura de letra a cada 10 pés (3 m) para leitura confortável, e metade disso como mínimo. A 3-5 m, numa TV de 55" em 1080p, isso dá corpo de texto de uns 30-50 px no mínimo e números-chave bem maiores. Rotação (carrossel) é comum, mas as fontes que dão números usam de 30 a 90 s por tela. Animação contínua atrapalha, porque movimento na visão periférica sequestra a atenção.

### Cited Findings

#### Princípios gerais
- Dashboards de TV "geralmente têm menor densidade de informação, fontes maiores e cores de alto contraste para serem entendidos do outro lado da sala". Precisam ficar em tela cheia sem menus nem cursor, não podem depender de interação (nem clique nem rolagem), devem se atualizar sozinhos e com frequência e não podem ter sessão que expira — [Geckoboard, Ultimate guide to TV dashboards](https://geckoboard.com/best-practice/tv-dashboards/)
- Em 2018 a Geckoboard lançou o "Large Font Mode", ligado por padrão em dashboards novos. Ele "aumenta o tamanho de rótulos e textos importantes para ficarem muito mais legíveis de longe" e também engrossa as linhas de tendência — [Geckoboard, update de 20/02/2018](https://www.geckoboard.com/updates/75/)
- Cabeçalhos maiores que os títulos dos widgets dão contexto às métricas que pode ser lido à distância — [Geckoboard, Dashboard headings](https://www.geckoboard.com/updates/35/)
- Teardown da Geckoboard (Sam Gane, 25/03/2026): "clareza importa mais que novidade", porque quem olha está do outro lado da sala fazendo outra coisa. O texto cita a Lei de Miller e a teoria de carga cognitiva, com o limite de elementos processáveis caindo com a distância. O que funciona: widgets de número, barras e linhas. O que evitar: pizza (comparar ângulos é difícil), 3D, visualizações pouco familiares, gauges repetidos (só valem para mostrar faixa ou meta) e tabelas "para enfiar o máximo de dados" (tabela só para exceções, como tickets atrasados). Frase-chave: "Se um dashboard parece lotado, geralmente está tentando mostrar coisa demais" — [Geckoboard, Data visualization for TV dashboards: a teardown](https://www.geckoboard.com/blog/data-visualization-for-tv-dashboards-a-teardown/)
- Numa TV na horizontal, "limite o dashboard a um punhado das métricas mais críticas, para que cada uma continue grande o bastante para ser lida num relance". A tela vertical funciona para dashboards com mais de 5 ou 6 métricas — [Klipfolio, Choose the right dashboard display](https://www.klipfolio.com/blog/dashboard-display)
- Um fornecedor de sinalização recomenda 5-10 KPIs por tela; títulos de 40-80 px para TVs de 55-65" vistas a 3-5 m; 30-90 s por tela quando há rotação; e atualização a cada 1-5 min para dados operacionais ou 30-60 min para financeiros — [SignageTube, Office TV Dashboard Solutions](https://signagetube.com/blog/enhance-business-visibility-with-office-tv-dashboard-solutions/). É fornecedor e os números não trazem fundamentação.
- Wallboard da Atlassian (Jira): o dashboard aparece sobre fundo preto. Com o slideshow ativado, gadgets com a mesma cor de cabeçalho numa coluna se revezam e gadgets com cores diferentes aparecem ao mesmo tempo — [Atlassian Support, Set up a wallboard](https://support.atlassian.com/jira-software-cloud/docs/set-up-a-wallboard/)
- Ainda na Atlassian (Dan Radigan, 2013): o wallboard é um "information radiator", em que quem passa entende o estado do time sem contexto. Recomenda layouts de 2 colunas para monitores largos e o nome do time ou sprint em cada gadget quando há vários times — [Atlassian, 3 steps to a rocking agile wallboard](https://www.atlassian.com/blog/jira-software/3-steps-to-a-rocking-agile-wallboard)

#### Tipografia e distância
- Regra de sinalização: "cerca de 1 polegada (25 mm) de altura de letra para cada 10 pés (3 m) de distância é leitura confortável; 1 polegada a cada 20 pés é o mínimo". Fórmula para corpo mínimo numa tela 1080p: `pt = 12 + 7,9 × distância (m)`; títulos com 2× o corpo e letras miúdas com 2/3. Exemplos para 55" em 1080p: 24 a 6 pés, 36 a 10 pés, 48 a 15 pés e 60 a 20 pés. Em 4K é preciso dobrar o tamanho para manter a mesma altura física. Contraste de 7:1 no corpo (o WCAG pede 4,5:1). Pesos: títulos Bold/ExtraBold (700-800), corpo Regular/Medium (400-500), e Light/Thin são "invisíveis à distância". A "regra 3×5" pede no máximo 3 linhas de 5 palavras, lidas em 3-5 s — [DigitalSignage.com, Typography & Viewing Distance Guide](https://digitalsignage.com/digital_signage/docs/guides/typography-viewing-distance/)
- Fire TV (Amazon): texto de corpo com "pelo menos 14sp, aproximadamente 19 px em 720p e 28 px em 1080p". Deixe livres os 5% externos de cada borda da tela. Use "cores menos saturadas"; cores frias (azul, roxo, cinza) funcionam melhor que as quentes (vermelho, laranja), e a TV exibe contraste maior que um monitor. Pede "baixa densidade de informação" — [Amazon, Fire TV Design and User Experience Guidelines](https://developer.amazon.com/docs/fire-tv/design-and-user-experience-guidelines.html)
- Android TV (Google): "interfaces com tipografia maior são mais legíveis e confortáveis". A fonte padrão é a Roboto, e a largura do traço precisa ser legível porque "linhas mais finas não são reconhecidas instantaneamente" — [Android Developers, Typography (TV)](https://developer.android.com/design/ui/tv/guides/styles/typography)

#### Área segura, grade e cor
- Android TV: o layout é projetado em 960×540 dp (entregue em 1080p). A margem de overscan de 5% dá 48 dp nas laterais e 27 dp em cima e embaixo; a margem segura recomendada é de 58 dp nas laterais e 28 dp em cima e embaixo. Grade de 12 colunas de 52 dp com gutters de 20 dp — [Android Developers, Layouts (TV)](https://developer.android.com/design/ui/tv/guides/styles/layouts)

#### Rotação (carrossel) versus layout fixo
- A Geckoboard oferece "Loops", que alternam dashboards com um intervalo escolhido pelo usuário. É "útil para exibir muito mais informação sem espremer tudo num dashboard". Não é possível avançar manualmente — [Geckoboard Help, Use loops](https://support.geckoboard.com/hc/en-us/articles/203233027-Use-loops-to-cycle-multiple-dashboards-on-a-single-screen)
- Exemplo de fornecedor: vendas por 30 s, depois suporte, depois notícias da empresa, "para manter o conteúdo fresco" — [Look Digital Signage](https://www.lookdigitalsignage.com/blog/why-use-tv-dashboards-in-your-office). A TelemetryTV sugere programar por horário, com métricas de produção na troca de turno e avisos de RH no meio do dia — [TelemetryTV, Office TV dashboards how-to](https://www.telemetrytv.com/posts/ttv-office-tv-dashboards-a-how-to-guide/)
- Caso prático de carrossel de wallboard (jan/2026): cada tela fica de 30 a 45 s. A sobreposição com "próxima tela" só aparece nos últimos 5 s, para não ocupar espaço no resto do tempo. O código limpa os timers para não acumular intervalos — [Artic6, Building a Reliable Dashboard Carousel](https://www.a6n.co.uk/2026/01/building-reliable-dashboard-carousel.html)
- Grafana: playlists com intervalo configurável. O modo TV liga sozinho após 1 min sem interação e sai com qualquer movimento de mouse ou tecla; o modo kiosk esconde menu, barra e controles; há opção de "auto fit panels"; o auto-refresh vai de 5 s a 1 dia — [AWS, Amazon Managed Grafana (Grafana 8.x): Playlist](https://docs.aws.amazon.com/grafana/latest/userguide/dashboard-playlist.html). Em versões recentes o parâmetro `kiosk=tv` aparece como obsoleto em favor de `kiosk=true` — [espelho da documentação do Grafana, Playlists](https://mintlify.wiki/grafana/grafana/dashboards/playlists). O utilitário oficial `grafana-kiosk` monta o kiosk num Raspberry Pi ou NUC — [GitHub grafana/grafana-kiosk](https://github.com/grafana/grafana-kiosk)

#### Tempo real, animações e alertas
- Movimento na visão periférica provoca desvio involuntário da atenção. "Animações repetidas funcionam como barreiras ao conteúdo"; o recomendado é evitar animações que se repetem com frequência e preferir transições mais lentas quando a animação não foi disparada pelo usuário — [NN/g, Animation for Attention and Comprehension (Aurora Harley, 2014)](https://www.nngroup.com/articles/animation-usability/)
- "Calm technology" (Weiser e Brown, Xerox PARC): a tecnologia deve transitar entre o centro e a periferia da atenção, informando sem exigir foco — [Weiser & Brown, Designing Calm Technology (PDF)](https://people.csail.mit.edu/rudolph/Teaching/weiser.pdf)

### Inferences
- **Tamanho de fonte para 3-5 m (cálculo meu a partir da regra de 1"/10 pés, com altura de maiúscula ≈ 0,7 do tamanho da fonte e TV em 1080p ou em 4K com escala de 200%, isto é, viewport de 1920×1080 px CSS):**

  | TV (16:9) | mm por px | Mínimo 3 m / 4 m / 5 m | Confortável 3 m / 4 m / 5 m |
  |---|---|---|---|
  | 50" | 0,58 | 31 / 41 / 52 px | 62 / 82 / 103 px |
  | 55" | 0,63 | 28 / 38 / 47 px | 56 / 75 / 94 px |
  | 65" | 0,75 | 24 / 32 / 40 px | 48 / 63 / 79 px |

  A conta bate com o mínimo do Fire TV (28 px em 1080p para cerca de 3 m) e com a fórmula da DigitalSignage.com (36-52 px a 3-5 m). A SignageTube (títulos de 40-80 px) fica abaixo disso; eu seguiria a tabela. Sugestão prática para uma TV de 55" a até 5 m: rótulos com no mínimo 36-40 px, corpo de 48 px, títulos de seção de 72-80 px e números-chave (KPIs e relógio) de 140-220 px. Tudo em peso 500-800, sem fontes finas.
- **Resolução:** projetar em 1920×1080 px CSS com unidades relativas (`vw`/`vh`/`clamp()`). Se o dispositivo rodar 4K com escala 1×, o texto fica com metade do tamanho, e aí é preciso forçar a escala. Isso ecoa a observação da DigitalSignage.com de que 4K "dobra o tamanho".
- **Margem segura:** deixar livres pelo menos 5% das bordas (cerca de 96 px nas laterais e 54 px em cima e embaixo em 1920×1080), ou 116/56 px pela recomendação do Android.
- **Quantidade:** de 4 a 7 blocos visíveis ao mesmo tempo, cada um com uma única mensagem. Mais que isso contraria Geckoboard, Klipfolio e a teardown (Miller).
- **Layout fixo com uma zona rotativa, e não carrossel de página inteira.** O que precisa ser lido sempre (relógio, "hoje na equipe", avisos) fica fixo. Só um bloco secundário (comemorações, arquivo recente, destaque do chat) gira a cada 20-45 s, com indicador discreto de progresso. Isso fica dentro da faixa de 30-90 s das fontes, sem o problema de a informação sumir antes da leitura.
- **Tema escuro** (fundo quase preto, texto quase branco com contraste ≥ 7:1): segue o wallboard da Atlassian, reduz ofuscamento e desgaste em OLED. Cor só com função (status), sempre com ícone ou texto junto, e evitando vermelho saturado, como pede o Fire TV.
- **Alertas de evento** (mensagem nova, tarefa concluída, arquivo compartilhado), sugestão minha derivada de NN/g e calm technology: um aviso ("toast") entra suave pelo canto, fica 8-12 s e sai. Eventos em sequência entram numa fila e são agregados quando vêm em rajada ("3 tarefas concluídas nos últimos 5 min"). Nada pisca, nada rola continuamente (nada de letreiro correndo) e não há som por padrão. Animação maior, como confete, só para marcos raros (meta do mês batida). O painel deve mostrar "atualizado às HH:MM" e um indicador discreto de "sem conexão", para que dado velho nunca pareça atual.

### Gaps
- Não achei estudo acadêmico sobre o intervalo ideal de rotação em wallboards de escritório. Os números (30-90 s) vêm de fornecedores e de um caso prático.
- A antiga documentação do Android TV (Android 5.0) citaria 12sp como mínimo e 18sp como padrão, mas o espelho estava fora do ar e não consegui confirmar. A documentação atual do Android TV não traz números de fonte (remete à escala do Material 3).
- A Geckoboard não publica número de widgets, tamanho exato de fonte nem intervalo de loop recomendado.

## 2. O que painéis de TV de equipes pequenas costumam mostrar com sucesso, e o que não deve aparecer numa TV compartilhada?

### Takeaway
O que funciona é o que é coletivo e muda ao longo do dia: metas e progresso do time, entregas concluídas, agenda do dia, avisos, comemorações (aniversários, entradas, conquistas), relógio e clima. A pesquisa acadêmica sobre "displays semi-públicos" para grupos pequenos e co-localizados aponta ganho de colaboração e de percepção leve do que o grupo está fazendo. Não deve aparecer nada individual ou sensível: mensagens privadas, dados de clientes ou pessoais, métricas que exponham quem está rendendo menos, nem sessão logada com permissão ampla no aparelho da TV.

### Cited Findings

#### Conteúdo que funciona
- Recomendação de fornecedor: mostrar "KPIs e metas" junto de "notícias da empresa, aniversários, tempo de casa e reconhecimento de conquistas", além de clima local ou relógios mundiais — [Look Digital Signage](https://www.lookdigitalsignage.com/blog/why-use-tv-dashboards-in-your-office)
- Exemplo de sequência: slide de KPI, captura de um site em tempo real, aviso da empresa e gráfico de desempenho — [TelemetryTV](https://www.telemetrytv.com/posts/ttv-office-tv-dashboards-a-how-to-guide/)
- Times ágeis: "sprint health", dias restantes do sprint, fluxo de trabalho e status do build — [Atlassian, 2013](https://www.atlassian.com/blog/jira-software/3-steps-to-a-rocking-agile-wallboard)
- Huang e Mynatt (CHI 2003) estudaram "semi-public displays", telas públicas restritas a um grupo pequeno e co-localizado cujos membros já se conhecem. A tela tornava certos tipos de informação visíveis no ambiente, "promovendo a colaboração e dando informação leve sobre a atividade do grupo" — [Huang & Mynatt, Semi-public displays for small, co-located groups (CHI 2003)](https://www.researchgate.net/publication/221518160_Semi-public_displays_for_small_co-located_groups)

#### Privacidade (o que não mostrar)
- "Evite mostrar nomes de clientes ou outros dados pessoais identificáveis (PII) em áreas abertas"; se precisar, anonimize. "Evite expor baixo desempenho individual de forma que envergonhe as pessoas"; prefira métricas de time ou rankings anonimizados. Use contas somente-leitura (exemplo: `tv-viewer@empresa.com`) e nunca digite credenciais de administrador em aparelhos de parede. Dados confidenciais vão para áreas de acesso restrito, não para a recepção. Em setores regulados, TI e compliance devem revisar o que aparece e onde — [SignageTube](https://signagetube.com/blog/enhance-business-visibility-with-office-tv-dashboard-solutions/)
- "Se suas métricas são confidenciais e o espaço recebe visitas de clientes ou público, a TV pode expor informação que você preferiria manter interna" — [Klipfolio](https://www.klipfolio.com/blog/dashboard-display). "Evite mostrar detalhes sensíveis de clientes na recepção" — [Look Digital Signage](https://www.lookdigitalsignage.com/blog/why-use-tv-dashboards-in-your-office)
- Alternativa de fornecedor para painéis que exigem login: capturas de tela ("Web Screenshots") atualizadas em intervalos, com as credenciais ficando fora da TV — [TelemetryTV](https://www.telemetrytv.com/posts/ttv-office-tv-dashboards-a-how-to-guide/)
- Estudo em 4 escritórios abertos: a atenção tem papel central em como as pessoas gerenciam confidencialidade e isolamento — [Privacy in the open (ACM GROUP 2007)](https://dl.acm.org/doi/10.1145/1316624.1316632)
- Sobre deixar a tela ligada à noite: "se ninguém age a partir daquela informação, apague a tela e mande os alertas por outro canal" — [KTC, Burn-in prevention for 24/7 displays](https://us.ktcplay.com/blogs/support-tips/burn-in-prevention-24-7-monitoring-displays)

### Inferences
- **Conteúdo sugerido para 11 pessoas numa TV:**
  1. Faixa fixa no topo com relógio grande, data e clima.
  2. "Hoje na equipe": número de tarefas concluídas no dia (numeral grande) e as 3-5 conclusões mais recentes (primeiro nome e título curto).
  3. Agenda do dia com as próximas 2-3 reuniões ou eventos.
  4. Avisos fixados, no máximo 2.
  5. Quem está no escritório ou disponível, apenas com opt-in e só a presença, sem "tempo ativo".
  6. Zona rotativa: aniversários e datas de casa, arquivo compartilhado recentemente (só de espaços públicos), destaque do chat escolhido por uma pessoa e não automático, meta do mês.
- **Regras de privacidade para a TV:**
  - Nunca mostrar conversas privadas nem prévias de mensagens diretas.
  - Evento de canal ou projeto privado vira no máximo um contador anônimo ("2 novidades em projetos privados") ou nem aparece.
  - Arquivo: mostrar quem compartilhou e em qual espaço, com nome do arquivo só se o espaço for público.
  - Nada de ranking individual de produtividade.
  - A TV autentica com um token de dispositivo somente-leitura, restrito ao "feed público do escritório", e não com a conta de alguém.
  - Um "modo visita" (atalho no app ou no controle) troca o painel por relógio, clima e logo quando há cliente na sala.
- A presença ("quem está online") é o item mais delicado. Pelo estudo de escritórios abertos e pela lógica de não expor indivíduos, é melhor ser opcional por pessoa e mostrar só "no escritório / remoto / ausente", nunca horário de atividade.

### Gaps
- Não encontrei estudo quantitativo recente (2020-2026) sobre qual conteúdo de TV de escritório gera mais engajamento. As listas são de fornecedores de sinalização.
- Não achei fonte específica sobre LGPD e exibição de dados de funcionários (aniversário, foto, presença) em telas internas. Vale uma consulta jurídica, pois aniversário e foto são dados pessoais.

## 3. Quais são os padrões comprovados para telas pessoais "Home"/"Meu trabalho" (Asana, Linear, Basecamp, ClickUp, Microsoft Viva Connections)?

### Takeaway
Os produtos convergem em cinco padrões:
1. Uma **caixa de triagem** para o que acabou de chegar (atribuições, menções).
2. **Baldes de tempo**: hoje e atrasadas, próximos dias, depois, sem data. Algumas ferramentas **promovem itens automaticamente** conforme o prazo se aproxima.
3. **Ordem de foco explícita**: urgente e bloqueios primeiro.
4. **Agenda do dia** junto das tarefas.
5. **Atalhos fixados** para projetos ou espaços.

As versões mais configuráveis (ClickUp, Viva) usam "cards" que o usuário mostra, esconde e reordena, com limite sugerido de cerca de 20 cards. A proteção de foco aparece como horário em que as notificações podem chegar (Basecamp "Work Can Wait").

### Cited Findings
- **Asana, My Tasks** (artigo de 02/09/2026): 4 seções padrão, "Recently assigned" (o que acabou de chegar), "Today", "Upcoming" e "Later". Tarefas sobem sozinhas para Upcoming uma semana antes do prazo e para Today um dia antes; sem data de entrega não há promoção automática. Recomenda triar o Recently assigned toda manhã. O Inbox, separado, cuida de comentários e pedidos — [Asana, 4 Ways to Master Asana My Tasks](https://asana.com/resources/asana-tips-my-tasks). Divergência: fontes mais antigas chamam as seções de "Do today / Do next week / Do later" — [Trilogi, sobre o My Tasks atualizado](https://medium.com/asana-consulting-trilogi-solutions/your-simple-or-advanced-strategy-for-asanas-updated-my-tasks-8e45e304fc3a); [Asana Forum](https://forum.asana.com/t/asana-my-tasks-section-do-today-do-tomorrow-do-this-week/145260). Parece só mudança de nome, com a mesma lógica.
- **Linear, My Issues**: 4 abas (atribuídas a você, criadas por você, inscritas, atividade recente). As atribuídas seguem uma "ordem de foco": urgente, com SLA, bloqueios, ciclo atual, outras ativas, triagem, backlog e concluídas. Dentro de cada grupo, a ordem é por prioridade, com as iniciadas primeiro. Atalho `G` `M` — [Linear Docs, My issues](https://linear.app/docs/my-issues). O Inbox mostra notificações do que exige atenção — [Linear Docs, Inbox](https://linear.app/docs/inbox)
- **Basecamp, nova Home** (dez/2023): o objetivo declarado era deixá-la "mais sobre você e o que você está fazendo". Tem logo da empresa, "dock" com até 12 projetos ou times fixados, lista A-Z do resto, agenda com os próximos eventos e tarefas atribuídas recentemente ou com prazo próximo. `Cmd/Ctrl-J` pula para qualquer projeto — [37signals, Preview: the all-new Home Screen](https://updates.37signals.com/post/preview-the-all-new-home-screen). No Basecamp 5, a Home tem projetos com estrela, até 10 projetos visitados recentemente, pastas e uma coluna de "atividade recente" — [Basecamp 5 Help, The Home Screen](https://5.basecamp-help.com/article/1159-the-home-screen)
- **Basecamp, menu "Hey!"**: é a caixa pessoal com menções, tarefas atribuídas, tarefas que você atribuiu e foram concluídas, e comentários — [Basecamp 4 Help, How notifications work](https://3.basecamp-help.com/article/86-how-notifications-work). **"Work Can Wait"**: cada pessoa define horário e dias de trabalho (padrão 8h-18h no próprio fuso). Fora disso as notificações ficam retidas, e depois chega um resumo do que foi perdido — [Signal v. Noise, Basecamp 3: Work Can Wait](https://signalvnoise.com/svn3/basecamp-3-work-can-wait/)
- **ClickUp, My Tasks (antes "Home")**: "hub personalizado para começar o dia, priorizar e planejar o que importa". O card "My Work" separa Overdue, Next e Unscheduled; a página "Today & Overdue" junta os cards My Work e Agenda; há ainda cards de Priorities/LineUp e Reminders. O usuário adiciona, remove, reordena e redimensiona cards — [ClickUp Help, My Tasks page](https://help.clickup.com/hc/en-us/articles/18944788880791-My-Tasks-page-formerly-Home); [ClickUp Help, My Work card](https://help.clickup.com/hc/en-us/articles/18947060934423-Use-the-My-Work-card-in-Home). As páginas bloquearam leitura direta; o conteúdo veio dos trechos do buscador.
- **Microsoft Viva Connections**: três partes, um dashboard de cards para tarefas e ferramentas, um feed (notícias do SharePoint mais conversas do Viva Engage) e recursos (links curados) — [Microsoft, Viva Connections](https://www.microsoft.com/en-us/microsoft-viva/connections); [Silicon Reef, What is Viva Connections?](https://siliconreef.co.uk/blog/what-is-viva-connections/). A estrutura em três partes veio dos trechos do buscador; não li a página da Microsoft inteira. O dashboard aceita segmentação por público. A recomendação é "limitar a cerca de 20 cards para a melhor experiência". O usuário pode reordenar, esconder ou adicionar cards, e isso só afeta a visão dele. Os cards não se atualizam sozinhos com o Teams aberto e ocioso, só com refresh manual ou ao reabrir — [Microsoft Learn, Create and edit the dashboard](https://learn.microsoft.com/en-us/viva/connections/create-dashboard)

### Inferences
- **Estrutura sugerida para "Meu dia" (síntese dos padrões acima):**
  1. **"Chegou pra você"**: triagem com atribuições novas, menções e arquivos compartilhados comigo, com ações rápidas (aceitar, agendar para hoje, depois). É o equivalente ao Recently assigned, ao Hey! e ao Inbox.
  2. **"Foco de hoje"**: 1-3 itens que a própria pessoa escolhe, no estilo LineUp/Priorities.
  3. **"Hoje e atrasadas"**: ordenadas por foco (atrasada e bloqueio primeiro, depois prazo de hoje, depois em andamento), no espírito da ordem do Linear.
  4. **"Agenda de hoje"**: reuniões e eventos.
  5. **"Próximos 7 dias"** e **"Sem data"**: recolhidos por padrão, com promoção automática ao se aproximar o prazo, como no Asana.
  6. **"Meus espaços"**: projetos fixados, até 12 como no Basecamp.
  7. **"Atividade recente"**: só do que me envolve.
- Para 11 pessoas não há necessidade de cards configuráveis no estilo Viva (pensados para grandes organizações). Basta permitir esconder ou reordenar 5-7 blocos.
- **Separação TV/pessoal:** tudo que é individual (minhas tarefas, menções, mensagens) fica na tela pessoal; a TV mostra só o coletivo. Um link "ver na TV" ou "o que está na TV" ajuda a pessoa a entender o que é público.
- **Foco:** um horário de "não perturbe" por pessoa, com resumo ao voltar como no Work Can Wait, e contadores discretos no lugar de badges vermelhos.

### Gaps
- Não encontrei dados públicos de uso ou eficácia (por exemplo, quanto a triagem diária reduz atraso) de nenhuma dessas telas. Os padrões são de desenho de produto, não resultados medidos.
- A documentação do ClickUp foi lida só por trechos do buscador (a página devolveu 403).

## 4. Qual montagem de hardware e software é mais confiável e barata para rodar um dashboard web em tela cheia numa TV 24/7? Quais navegadores de smart TV são problemáticos?

### Takeaway
Um aparelho dedicado ligado por HDMI, rodando Chrome/Chromium (ou Edge) em modo kiosk, é o consenso: Raspberry Pi 4 (4 GB) ou 5, ou um mini PC x86. No Brasil, um mini PC Intel N100 com Windows 11 (cerca de R$ 1.000-1.100) sai mais barato que um Raspberry Pi 5 homologado com fonte, case e cartão (cerca de R$ 1.400-1.500) e ainda roda Chrome x86. Evite:
- o navegador da smart TV, que não é confiável segundo a Geckoboard e a própria LG;
- Chromecast/Apple TV, que servem só para apresentação temporária;
- Fire TV Stick: os modelos novos rodam Vega OS, sem sideload.

A confiabilidade 24/7 depende de camadas. No sistema operacional:
- login automático;
- navegador que reinicia se cair;
- disco protegido contra queda de energia;
- liga/desliga da TV por HDMI-CEC;
- acesso remoto.

Na página:
- reconexão com backoff;
- ressincronização do estado;
- recarga periódica contra vazamento de memória;
- indicador de "desatualizado".

### Cited Findings

#### O que evitar
- **Navegador da smart TV:** "não é uma forma confiável". Motivos citados: pouca potência para conteúdo dinâmico, raras atualizações, pouca memória, o que leva a widgets que param de atualizar. Isso vale "até para smart TVs novas e topo de linha", porque os fabricantes "priorizam apps de streaming a manter navegadores modernos" — [Geckoboard Help, smart TV](https://support.geckoboard.com/en/articles/6055778-displaying-a-geckoboard-dashboard-on-a-smart-tv)
- A LG admite que TVs anteriores ao webOS 3.5 (2017) não suportam os padrões web atuais. Quando falta memória para imagens e dados de uma página, "a Internet ou a energia podem ser desligadas e reiniciadas para evitar funcionamento anormal"; a correção sugerida é apagar apps — [LG Support, Low memory notifications](https://www.lg.com/us/support/help-library/lg-tv-troubleshooting-low-memory-notifications-and-apps-not-working--20153165912773)
- **Chromecast / Apple TV:** o guia da Geckoboard lista o Chromecast entre os aparelhos a evitar porque "exige configuração diária" — [Geckoboard guide](https://geckoboard.com/best-practice/tv-dashboards/). Segundo trechos da central de ajuda, o cast só serve "para testes ou apresentações breves e temporárias" — [Geckoboard Help, casting devices](https://support.geckoboard.com/en/articles/6055765-use-casting-devices-to-display-a-dashboard-on-a-screen)
- O Google descontinuou o Chromecast. O Chromecast com Google TV nunca foi vendido oficialmente no Brasil — [EpicGeek](https://epicgeek.com.br/chromecast-fim-da-linha-alternativas-brasil/). O sucessor Google TV Streamer custa US$ 99,99 nos EUA, não tem lançamento oficial no Brasil e aparece por cerca de R$ 1.250 em importadores — [TechTudo, mar/2025](https://www.techtudo.com.br/guia/2025/03/google-tv-streamer-4k-veja-preco-e-tudo-sobre-o-sucessor-do-chromecast-edinfoeletro.ghtml)
- **Fire TV:** o guia da Geckoboard põe o Fire TV Stick entre os aparelhos a evitar porque "não consegue tela cheia/modo kiosk" — [Geckoboard guide](https://geckoboard.com/best-practice/tv-dashboards/). Segundo trechos da central de ajuda, o Fire OS não tem navegador padrão, é menos potente que um PC stick e tem "mais chance de problemas de desempenho ao rodar um dashboard por longo período" — [Geckoboard Help, casting devices](https://support.geckoboard.com/en/articles/6055765-use-casting-devices-to-display-a-dashboard-on-a-screen). O Fire TV Stick 4K Select roda Vega OS (baseado em Linux), que não instala apps Android por sideload. A Amazon diz que "a partir do Fire TV Stick 4K Select, todos os futuros Fire TV Sticks rodarão Vega" — [AFTVnews, lista de Fire TVs sem sideload](https://www.aftvnews.com/these-are-the-fire-tvs-that-dont-support-sideloading-or-downloader-due-to-vega-os-replacing-fire-os/); [AFTVnews, Sideloading is truly dead on the 4K Select](https://www.aftvnews.com/sideloading-is-truly-dead-on-the-fire-tv-stick-4k-select-with-vega-os/); [Cord Busters](https://www.cordbusters.co.uk/amazon-no-sideloading-all-new-fire-tv-sticks/). No Brasil (set/2026): Fire TV Stick HD 2026 (Vega) por R$ 250-340, 4K Select (Vega) por R$ 300-420, 4K Plus (Fire OS) por R$ 250-350 e 4K Max 2ª geração (Fire OS) por R$ 450-550 — [Promotop, 15/09/2026](https://promotop.net/blog/qual-fire-tv-stick-comprar-em-2026-guia-completo-de-todos-os-modelos/)

#### Dispositivos recomendados
- A Geckoboard recomenda qualquer computador com Chrome ou Firefox atual. Tem app de kiosk para Windows e para Raspberry Pi OS 64-bit (Trixie), mas só recomenda Pi 4 Model B com pelo menos 4 GB ou Pi 5. Mínimo para Windows: dual-core (ideal quad), 4 GB de RAM (ideal 8), 32 GB de armazenamento (ideal 64). Modelos citados: MeLE PCG02 (stick com Windows 11) e Station P1 Pro. Vantagens de um aparelho dedicado segundo ela: roda 24/7 sem degradar, "se recupera sozinho após queda de energia" e não prende o PC de ninguém. Dica: ligar o aparelho numa **tomada inteligente** para poder desligar e religar remotamente — [Geckoboard Help, recommended devices](https://support.geckoboard.com/hc/en-us/articles/360024537072-Display-your-dashboard-on-a-TV-our-guide-and-recommended-devices)
- Faixas de preço da Geckoboard (USD): Raspberry Pi 4/5 por cerca de US$ 35-50, PC stick por US$ 150-300, Station P1 Pro por US$ 150, PC compacto a partir de US$ 300 — [Geckoboard guide](https://geckoboard.com/best-practice/tv-dashboards/). Isso está desatualizado para o Pi 5, lançado a US$ 60 (4 GB) e US$ 80 (8 GB) — [Adrenaline](https://www.adrenaline.com.br/hardware/raspberry-pi-5-e-oficialmente-lancada-no-mercado/)
- N100 contra Raspberry Pi (XDA, 01/04/2026): um Pi decente com acessórios passa de US$ 150, enquanto um mini PC N100 (4 núcleos x86, RAM, case e SSD) sai por menos de US$ 200, com melhor compatibilidade de software por ser x86 — [XDA Developers](https://www.xda-developers.com/budget-mini-pcs-peaked-with-the-n100/)

#### Raspberry Pi em modo kiosk
- Tutorial oficial: Raspberry Pi OS 64-bit com labwc (compositor Wayland). O arquivo `~/.config/labwc/autostart` recebe `chromium <URL> --kiosk --noerrdialogs --disable-infobars --no-first-run --enable-features=OverlayScrollbar --start-maximized &`. Requisito: Pi 3 ou mais novo, com 1 GB ou mais de RAM. O tutorial não cobre cursor, apagamento de tela nem watchdog — [Raspberry Pi, How to use a Raspberry Pi in kiosk mode](https://www.raspberrypi.com/tutorials/how-to-use-a-raspberry-pi-in-kiosk-mode/)
- Projeto open source de kiosk: Raspberry Pi OS Lite, labwc, login automático via `greetd`, cursor escondido pela ação HideCursor do labwc, opção de "esperar a rede antes de abrir o Chromium" e controle remoto da TV via HDMI-CEC repassado ao navegador — [TOLDOTECHNIK, Raspberry-Pi-Kiosk-Display-System](https://github.com/TOLDOTECHNIK/Raspberry-Pi-Kiosk-Display-System)
- Montagem automatizada de 2025: gravar o cartão e ligar, com kiosk acelerado por GPU no labwc, Tailscale para acesso remoto e um utilitário `kiosk-set-url` para trocar a URL — [Ben Swift, jul/2025](https://benswift.me/blog/2025/07/16/automated-rpi-web-kiosk-setup-in-2025/)
- **Proteção contra queda de energia:** `raspi-config`, Performance Options, Overlay File System. As escritas vão para uma camada em RAM e somem no reboot; é o uso típico em kiosks e sinalização — [With Raspberry Pi, OverlayFS kiosk guide](https://ohyaan.github.io/tips/overlayfs_-_layer-based_filesystems_for_raspberry_pi/); [Core Electronics, Read-only Raspberry Pi](https://core-electronics.com.au/guides/read-only-raspberry-pi/). Com a camada de baixo montada só para leitura, o sistema fica "100% tolerante a quedas de energia" e dá para simplesmente puxar a tomada — [nils-werner/raspi-overlayroot](https://github.com/nils-werner/raspi-overlayroot)
- **Acesso remoto oficial e gratuito (Raspberry Pi Connect):** compartilhamento de tela e shell pelo navegador, sem abrir portas no roteador. O compartilhamento de tela exige Pi 4/5 com sistema 64-bit e Wayland — [Raspberry Pi Documentation, Connect](https://www.raspberrypi.com/documentation/services/connect.html)
- **Ligar e desligar a TV por HDMI-CEC:** `echo standby 0 | cec-client -s -d 1` desliga e `echo on 0 | cec-client -s -d 1` liga, agendados no cron. É preciso ativar o CEC na TV (Anynet+, SimpLink etc.) — [Pi My Life Up, HDMI-CEC](https://pimylifeup.com/raspberrypi-hdmi-cec/); [gist cec-client](https://gist.github.com/rmtsrc/dc35cd1458cd995631a4f041ab11ff74)

#### Pacotes prontos: Anthias, DAKboard, Fully Kiosk, Edge kiosk
- **Anthias** (antigo Screenly OSE): gratuito e open source, roda em Raspberry Pi, PCs x86 e placas ARM; exibe imagens, vídeos e páginas web por playlist; sem assinatura. Instala pelo Raspberry Pi Imager em "Digital signage and kiosks" e dá para gerenciar por um painel web — [Anthias](https://anthias.screenly.io/). A versão v2026.05.0 (15/05/2026) trouxe auto-refresh de páginas web em intervalo configurável e agendamento por item — [Screenly blog](https://www.screenly.io/blog/2026/05/15/anthias-v2026-05-0/). O projeto voltou a ter desenvolvimento ativo ("de um Pi de 1 GB a um Pi 5, simplesmente roda") — [Raspberry Pi Forums, 02/06/2026](https://forums.raspberrypi.com/viewtopic.php?t=398741). Houve um bug em que uma página web sozinha na playlist não recarregava (só fazia requisições HEAD); está marcado como resolvido — [GitHub Anthias #1972](https://github.com/Screenly/Anthias/issues/1972)
- **DAKboard OS** (Raspbian modificado): configuração de Wi-Fi, agenda de liga/desliga ("On/Off Sleep Schedule") via HDMI-CEC, resolução e fuso horário. Funciona melhor em Pi 3B+ e 4B; o Pi 5 é suportado a partir da versão 4.01 — [DAKboard Support, Raspberry Pi OS](https://dakboard.freshdesk.com/support/solutions/articles/35000125880-raspberry-pi-download-and-install-the-dakboard-os); [DAKboard Support, Sleep schedule](https://dakboard.freshdesk.com/support/solutions/articles/35000112868-how-to-set-the-on-off-sleep-schedule)
- **Fully Kiosk Browser** (Android, Android TV, Fire OS): recarrega a página após erro de carregamento, ao ligar a tela, ao sair do protetor de tela, ao reconectar a rede ou a internet, e quando fica ocioso; pode limpar cache e armazenamento antes de recarregar — [Fully Kiosk Browser](https://www.fully-kiosk.com/en/); [Google Play](https://play.google.com/store/apps/details?id=de.ozerov.fully&hl=en)
- **Edge kiosk no Windows:** o modo "Digital/Interactive Signage" abre um site em tela cheia (`msedge.exe --kiosk URL --edge-kiosk-type=fullscreen --no-first-run`), sempre numa sessão InPrivate. `--kiosk-idle-timeout-minutes` aceita de 1 a 1440 (padrão 0 em tela cheia) e fecha a sessão quando o tempo acaba. O Edge não reabre sozinho: para isso é preciso Assigned Access ou Shell Launch. A configuração é feita em Windows Settings, "Set up a kiosk (assigned access)". Não há suporte para Linux — [Microsoft Learn, Configure Microsoft Edge kiosk mode](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-configure-kiosk-mode)

#### Robustez da página 24/7
- **Vazamento de memória em kiosk:** um Chromium 111 em Debian 11 exibindo um dashboard do Home Assistant chegou a quase 2 GB de RAM "depois de alguns minutos ou horas". A issue foi fechada sem solução — [GitHub home-assistant/frontend #21006, jun/2024](https://github.com/home-assistant/frontend/issues/21006). No Node-RED, gráficos "vazam mais que tudo"; a solução paliativa sugerida foi matar e reabrir o Chromium a cada cerca de 2 h por cron — [Node-RED Forum, 2018](https://discourse.nodered.org/t/chromium-eats-up-all-the-ram/3082)
- **Screen Wake Lock API:** chegou no Chrome 84, só funciona em HTTPS e é liberada automaticamente quando a aba fica oculta ou minimizada ou quando entra a economia de bateria. O padrão recomendado é pedir de novo no evento `visibilitychange` — [Chrome for Developers, Wake Lock](https://developer.chrome.com/docs/capabilities/web-apis/wake-lock). A API é suportada em todos os navegadores principais — [web.dev](https://web.dev/blog/screen-wake-lock-supported-in-all-browsers)
- **Reconexão WebSocket:** backoff exponencial começando em 500 ms, dobrando até o teto de 30 s, com jitter para evitar reconexões simultâneas. Numerar as mensagens para o servidor reenviar o que se perdeu, e usar ID de sessão separado da conexão. Para apps comuns, desistir após 10-15 tentativas ou 2-5 min e mostrar "desconectado" — [WebSocket.org, Reconnection guide](https://websocket.org/guides/reconnection/)
- Em fornecedores comerciais, o console "avisa se uma tela fica offline" — [TelemetryTV](https://www.telemetrytv.com/posts/ttv-office-tv-dashboards-a-how-to-guide/)

#### Energia e recuperação
- Mac: em Ajustes, Energia, ativar "Start up automatically after a power failure" (ou "Start up when power is connected: Always") — [Apple Support](https://support.apple.com/en-am/125517). Mini PC: na BIOS, "After Power Failure" (ou "AC Power Recovery") em "Power On" — [Intel Support](https://www.intel.com/content/www/us/en/support/articles/000059976/server-products/server-boards.html); [ASUS NUC FAQ](https://www.asus.com/support/faq/1052162/)

#### A TV em si: uso contínuo e burn-in
- A Samsung, que vende telas comerciais e portanto tem interesse na recomendação, diz que TVs de consumo são projetadas para "talvez oito horas por dia" e que a garantia é "invalidada se usada para fins comerciais". Telas comerciais rodam 24/7 e costumam ter 3 anos de garantia, contra cerca de 1 ano das de consumo. Brilho: 250-400 nits na TV comum contra até 2.500 nits nas comerciais — [Samsung Business Insights, out/2024](https://insights.samsung.com/2024/10/21/why-you-shouldnt-use-consumer-tvs-for-commercial-digital-signage/)
- A retenção de imagem em LCD "na maioria dos perfis de uso é apenas transitória". Em OLED, o pixel mais usado escurece em relação aos vizinhos. Mitigações: deslocar o conteúdo alguns pixels periodicamente, usar protetor de tela e desligar a tela — [Wikipedia, Screen burn-in](https://en.wikipedia.org/wiki/Screen_burn-in)
- O KTC, fabricante de monitores, diz que o LCD é "geralmente mais seguro para uso estático" e o OLED é mais arriscado para dashboards fixos. Recomenda brilho só no necessário, alternar posições de gráficos e tons de fundo, esconder barras do sistema e do navegador (kiosk) e, para uso 24/7 de verdade, painéis comerciais ou de vigilância — [KTC](https://us.ktcplay.com/blogs/support-tips/burn-in-prevention-24-7-monitoring-displays)

#### Preços no Brasil (setembro de 2026, varejo; confirmar)
- Raspberry Pi 5 4 GB (homologado Anatel): R$ 1.124,84, ou R$ 1.068,60 no PIX, indisponível no momento da consulta — [NextPi](https://www.nextpi.com.br/loja/raspberry-pi-5-4gb/)
- Acessórios na RoboCore (preços PIX): fonte oficial 27 W por R$ 123,31, case com cooler por R$ 89,96, cabo micro HDMI de 1,5 m por R$ 28,40, microSD de 32 GB por R$ 119,70, cooler ativo por R$ 47,40. O preço do Pi 5 8 GB não apareceu na página — [RoboCore](https://www.robocore.net/placa-raspberry-pi/raspberry-pi-5-8gb)
- Mini PC Intel N100 com 8 GB, 256 GB e Windows 11: R$ 1.099,99, ou R$ 989,99 no PIX, sob encomenda — [PCImbativel](https://store.pcimbativel.com/loja/mini-pc-intel-n100-8gb-ram-256gb-ssd-windows-11/). O Beelink EQ12 (N100, 16 GB) aparece na Kabum, mas estava esgotado e sem preço visível — [Kabum](https://www.kabum.com.br/produto/514906/mini-pc-beelink-eq12-500gb-16gb-processador-intel-lake-n100)
- Mac mini M4 (16 GB, 256 GB): R$ 7.499 no preço oficial de lançamento, em out/2024 — [Hardware.com.br](https://www.hardware.com.br/noticias/mac-mini-m4-brasil-lancamento-precos.html/)
- Google TV Streamer: cerca de R$ 1.250 importado. Fire TV Stick: R$ 250-550 conforme o modelo (fontes acima).

### Inferences
- **Recomendação para o escritório (11 pessoas, rede local, 1 TV):**
  1. **Opção A, mais barata no Brasil e mais simples:** mini PC N100 com 8 GB (cerca de R$ 1.000-1.100) por cabo de rede, BIOS em "Power On after power failure", Windows 11 com Edge em kiosk "Digital Signage" via Assigned Access (que reabre o Edge sozinho) ou Linux com Chromium `--kiosk`.
  2. **Opção B, mais "appliance":** Raspberry Pi 5 com 4 GB, fonte oficial, case com cooler e cartão (cerca de R$ 1.430-1.500 somando os preços acima), Raspberry Pi OS com labwc e Chromium kiosk, OverlayFS ligado, Raspberry Pi Connect para suporte remoto e HDMI-CEC para ligar e desligar a TV. Consome menos energia e fica protegido contra queda de luz, mas é mais caro no Brasil que o N100.
  3. **Anthias ou DAKboard** só valem a pena se a ideia for alternar a página com imagens e vídeos geridos por não-técnicos. Para uma página própria em tempo real, o Chromium kiosk puro é mais simples.
  4. **Descartar:** navegador da TV, Chromecast/Streamer por cast e Fire TV Stick com Vega OS. Google TV Streamer com Fully Kiosk é possível, mas no Brasil custa mais que o N100 e roda sobre WebView.
- **Pegadinha do Edge kiosk:** a sessão é InPrivate, então login, cookies e localStorage se perdem a cada reinício. A página da TV deve se autenticar sozinha, com token de dispositivo na URL ou pareamento por código, e nunca por login interativo. Isso também atende a regra de não digitar credenciais em aparelho de parede.
- **Checklist de robustez da página da TV:**
  1. WebSocket com backoff e jitter (500 ms a 30 s) e heartbeat (sugestão minha: ping a cada cerca de 30 s, reconectar após 2 falhas).
  2. Na TV, nunca desistir. Depois de cerca de 5 min sem conexão, fazer `location.reload()` completo; ao reconectar, pedir um instantâneo do estado inteiro e não só os eventos novos.
  3. Recarga completa agendada todo dia de madrugada (por exemplo, 4h), contra os vazamentos de memória relatados.
  4. Wake Lock quando houver HTTPS. Na rede local, `http://localhost` também é contexto seguro, mas o mais robusto é desligar o apagamento de tela no sistema.
  5. Rodapé com "atualizado às HH:MM" e aviso visível se passar de X minutos sem dados.
  6. No sistema: login automático, navegador supervisionado (reinicia se cair), reboot semanal programado e tomada inteligente como último recurso.
- **Liga/desliga:** desligar a TV por CEC fora do expediente (por exemplo, 19h-8h e fins de semana) põe o uso perto das cerca de 8 h/dia para as quais, segundo a Samsung, uma TV de consumo foi projetada. Também reduz o risco de burn-in e o consumo, e segue o "se ninguém olha, apague" do KTC.
- **Tipo de TV:** preferir LED/LCD a OLED para um painel fixo. Com OLED, ligar o pixel shift da TV, usar fundo escuro e deslocar sutilmente o layout (poucos pixels a cada N minutos) via CSS.

### Gaps
- Não encontrei relato técnico específico de falhas de WebSocket nos navegadores Tizen (Samsung) ou webOS (LG). As fontes falam de memória, desatualização e travamento em geral.
- Os preços em USD do Raspberry Pi podem ter mudado desde o lançamento; não verifiquei a tabela atual. Não consegui o preço em BRL do Pi 5 de 8 GB (a página da RoboCore carrega o preço dinamicamente; MakerHero e Saravati devolveram 403).
- Não verifiquei se o `cec-client` funciona no Raspberry Pi OS atual (driver KMS) ou se é preciso usar `cec-ctl`/`/dev/cec0`; um resultado de busca sugere que isso varia. Testar no aparelho.
- A afirmação de que a garantia é invalidada por uso comercial vem da Samsung (perspectiva dos EUA). Não pesquisei como isso fica sob o Código de Defesa do Consumidor e as garantias no Brasil.
- Não há dado confiável de horas até o burn-in em TVs LCD com dashboard estático.

## 5. A TV deve ser interativa (controle remoto ou teclado) ou só exibir? O que as equipes relatam?

### Takeaway
As fontes de fornecedores tratam o wallboard como tela passiva. Ferramentas maduras seguem um padrão híbrido: dá para mexer, mas a tela volta sozinha ao modo exibição depois de um tempo sem uso (Grafana liga o modo TV após 1 min; Edge kiosk reinicia por ociosidade; Fully Kiosk recarrega ao ficar ocioso). Não encontrei estudo de campo comparando TVs interativas e passivas em escritórios.

### Cited Findings
- Requisito da Geckoboard para o software da TV: exibir tudo "sem necessidade de clicar ou rolar", ou seja, não interativo — [Geckoboard guide](https://geckoboard.com/best-practice/tv-dashboards/). Os loops da Geckoboard não permitem avançar manualmente — [Geckoboard Help, loops](https://support.geckoboard.com/hc/en-us/articles/203233027-Use-loops-to-cycle-multiple-dashboards-on-a-single-screen)
- A TV como exibição passiva mantém as métricas "à vista o dia todo", ao contrário de dashboards no navegador ou no celular, que servem para interagir — [Klipfolio](https://www.klipfolio.com/blog/dashboard-display)
- Grafana: o modo TV liga automaticamente após 1 min sem interação, e qualquer movimento de mouse ou tecla o desliga — [AWS / Grafana 8.x Playlist](https://docs.aws.amazon.com/grafana/latest/userguide/dashboard-playlist.html)
- O Edge kiosk no modo "Digital/Interactive Signage" tem "reset on inactivity" configurável de 1 a 1440 min — [Microsoft Learn](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-configure-kiosk-mode). O Fully Kiosk recarrega a URL inicial quando ocioso — [Fully Kiosk Browser](https://www.fully-kiosk.com/en/)
- Um kiosk open source repassa o controle remoto da TV (HDMI-CEC) ao navegador — [TOLDOTECHNIK](https://github.com/TOLDOTECHNIK/Raspberry-Pi-Kiosk-Display-System). A TelemetryTV trata "kiosks interativos" como produto separado dos dashboards — [TelemetryTV](https://www.telemetrytv.com/posts/ttv-office-tv-dashboards-a-how-to-guide/)
- Gestão remota em vez de interação na TV: a Geckoboard oferece "Send to TV" para parear a TV e gerenciar os dashboards à distância — [Geckoboard Help, Send to TV](https://support.geckoboard.com/hc/en-us/articles/206834867-Display-your-dashboard-on-a-TV-using-Send-to-TV); [Geckoboard update](https://www.geckoboard.com/updates/50/). Só li os títulos dessas páginas, não o conteúdo.

### Inferences
- **Só exibição por padrão, sem teclado nem mouse junto à TV.** Um periférico ali convida a navegar para fora, deixar sessões abertas e mexer em configurações, o que contraria as recomendações de privacidade da seção 2.
- **Interação mínima e opcional pelo controle da TV via CEC** (se o aparelho suportar): pausar ou avançar a zona rotativa e ativar o "modo visita". Depois de 60 s sem uso, volta ao estado padrão, como no Grafana e no Edge.
- **Toda configuração acontece no app, pelo celular ou PC** de quem tem permissão: avisos fixados, o que aparece na TV, horário de liga/desliga, pareamento da TV por código. Nada se configura na própria TV.

### Gaps
- Não encontrei relatos sistemáticos (estudos, pesquisas com usuários ou threads com dados) sobre TVs interativas contra passivas em escritórios. As posições acima vêm de documentação de fornecedores e de como ferramentas maduras se comportam.
- O artigo de Huang e Mynatt (2003) provavelmente descreve interações num display semi-público, mas não consegui abrir o texto completo (ResearchGate devolveu 403).
