# A fazer · babel-coop

Lista única do que falta, sem repetição. Fontes: auditoria dos planos (memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md), plano 2030 × código (memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md), CHECKLIST.md, .deus/terminal-ao-vivo/FALTAS.md, .deus/maquina-jogo/MISSAO.md e os pedidos do Theus de 24–25/09. Montada em 2026-09-25 e conferida por um crítico de completude.

**Como usar (regra):** cada item só muda para [x] com a prova (teste que passou, print ou medida) numa linha de log embaixo dele: `  - log 2026-09-25 · o que foi feito · prova`. Item parcial ganha log sem marcar [x]. Nada se apaga: item que deixou de valer vira ~~riscado~~ com o motivo. O Ryan atualiza este arquivo a cada entrega.

**Abertos: 173** (onda 1: 35 · onda 2: 97 · onda 3: 35 · onda 4: 6) · **Feitos hoje: 8** · **Decisões: 6 respondidas, 3 pendentes (D2, D4 e parte de D5)**

## Decisões do Theus (planos que se contradizem e nenhuma fala sua decide)

As outras 16 contradições já foram resolvidas pelas suas falas e estão sendo corrigidas nos planos (ver o log no fim).

Log 2026-09-25 13:10 · D1/D3/D6/D7/D8/D9 respondidas diretamente por Theus nesta sessão. Implementação e limites em `memoria/relatorios/2026-09-25-tv-projecao-conhecimento.md`. Projeção de arquivo real, atualização e encerramento passaram no teste do app empacotado; AirPlay/HDMI físico pendente.

- [x] **D1** · Theus, 25/09: a logo “b” no canto superior esquerdo permanece pulsando. Preservados movimento reduzido e pausa sem foco.
- [ ] **D2** · Teto de efeitos: 2 efeitos vivos e 24 faíscas × poderes de jogo — Proposta: o teto vale para efeito contínuo; rito de jogo (conclusão, combo, peça nascendo) tem teto próprio e sempre termina.
- [x] **D3** · Theus, 25/09: resposta final e todo conhecimento novo servem de substrato para a IA futura. Preservar resposta pública integral; agente registra aprendizados reutilizáveis com evidência, limites e correções no acervo. Pausa privada continua respeitada.
- [ ] **D4** · O "b" em neon dentro do terminal e o botão Neon: fica ou sai? — Proposta: fica pequeno, com liga e desliga.
- [ ] **D5** · Pontos pessoais na TV e títulos no Perfil — Os planos proíbem placar na TV e ranking. Proposta: tirar "N pontos hoje" da TV e os títulos do Perfil.
- [x] **D6** · Theus, 25/09: primeiro botão é Meu dia (mantido).
- [x] **D7** · Theus, 25/09: TV somente com dados reais do que acontece em tempo real; fundo reage a trabalho efetivo, presença online sozinha não o anima.
- [x] **D8** · Theus, 25/09: celular fica para próximas atualizações.
- [x] **D9** · Theus, 25/09: TV acompanha mudanças reais; sem rodízio arbitrário por relógio. Sem conexão, identificar que os dados são da última atualização.

## Onda 1 · já (usar na rede local com a equipe)

### Rede e instalação

- [ ] **A-001** · Mostrar endereço e QR para celular, iPad e TV abrirem a Estação **[Theus]**
  - pronto quando: Uma tela da Estação mostra http://<IP>:4711 e um QR. O QR lido no celular, no mesmo Wi-Fi, abre a Estação com as 5 abas embaixo, e no iPad abre o quadro.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:119 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:184 · CHECKLIST.md:61
- [ ] **A-002** · Fazer commit do trabalho de 24 e 25/09 e o Theus dar push **[Theus]**
  - pronto quando: O git status não tem mais mudanças soltas do app, há commits por fatia, e o push feito pelo Theus (git push origin main) aparece no GitHub theusveyra/babel-coop.
  - fontes: .deus/terminal-ao-vivo/RODADAS.md:32 · .deus/terminal-ao-vivo/RODADAS.md:44 · .deus/terminal-ao-vivo/MISSAO.md:6
- [ ] **A-003** · Rodar a sonda com 3 pessoas da equipe
  - pronto quando: Três pessoas chegam ao primeiro OK de outra em menos de 5 min e respondem 'onde está o Davi?' em menos de 30 s, com grupo de controle. O resultado fica anotado.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:255 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:262
- [ ] **A-004** · Apagar o app/d1.png solto, com o ok do Theus
  - pronto quando: O arquivo não existe mais em app/, não entra no pacote e não aparece no git status.
  - fontes: .deus/terminal-ao-vivo/ENTREGA.md:56
- [ ] **A-005** · Decidir com o Theus as notas de pesquisa apagadas antes do commit **[Theus]**
  - pronto quando: O Theus diz se as notas de docs/pesquisa/research_notes/ (a pasta está vazia no disco e o git status mostra os .md como apagados, ainda sem commit) saem ou voltam. Se voltam, são restauradas. Se saem, o commit registra a remoção, e o relatório citado no IDEIAS §12 continua existindo.
  - fontes: IDEIAS.md:666 · .claude/rules/seguranca.md:5
- [ ] **A-006** · Gerar o .exe e passar o CI do Windows **[Theus]** _(em parte)_
  - pronto quando: Os jobs de .github/workflows/terminal-pty.yml ficam verdes no GitHub. O .exe instala num Windows, o terminal do app abre o PowerShell e o claude roda dentro dele. A0 e A29 fecham no selo da missão.
  - fontes: .deus/terminal-ao-vivo/MISSAO.md:18 · .deus/terminal-ao-vivo/MISSAO.md:19 · .deus/terminal-ao-vivo/MISSAO.md:47 · .deus/terminal-ao-vivo/FALTAS.md:152 (+7)
- [ ] **A-007** · Testar a equipe em dois computadores reais **[Theus]** _(em parte)_
  - pronto quando: Com dois computadores no mesmo Wi-Fi, o segundo entra na equipe e a parede mostra os terminais dos dois. Digitar no terminal do outro tem p95 abaixo de 100 ms. Uma demanda criada com o segundo desligado aparece nele quando ele liga. O aviso de 'Rede Local' do macOS está explicado no COMO-INSTALAR.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:254 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:262 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:265 · CHECKLIST.md:34 (+4)
- [ ] **A-008** · Empacotar com o PGlite, reinstalar, medir a CPU e mostrar a Máquina-jogo ao Theus _(em parte)_
  - pronto quando: pacote.test e instalar.test passam com o PGlite dentro do .app. O app em /Applications cria um banco de projeto, fecha, reabre e lê o banco. A CPU com o app parado, medida pela árvore de processos, fica em cerca de 2% sem foco e até 18% com foco. O Theus vê o banco nascer em 3D no app instalado e P1 a P7 recebem o selo.
  - fontes: .deus/maquina-jogo/MISSAO.md:23 · .deus/maquina-jogo/CAPSULA.json:7 · .deus/maquina-jogo/CAPSULA.json:8 · memoria/memorias/2026-09-24-leveza-animacao-so-no-compositor.md:14
- [ ] **A-009** · Rodar a suíte inteira verde numa rodada só antes de reinstalar _(em parte)_
  - pronto quando: Os testes de servidor, os e2e e o roteiro do protótipo passam juntos numa execução só, sem o OOM que derrubou o banco.test sob carga paralela. O placar fica anotado no RODADAS.md antes de empacotar.
  - fontes: .deus/maquina-jogo/CAPSULA.json:8 · .deus/terminal-ao-vivo/RODADAS.md:45
### Segurança

- [ ] **A-010** · Escrever e assinar o combinado com a equipe
  - pronto quando: Um documento diz o que é visto (pastas, terminais, sala com memória de 5 min), para quê, quem vê e como pausar. Todos assinam antes da instalação na equipe.
  - fontes: CHECKLIST.md:13
- [ ] **A-011** · Definir quem é gestão **[Theus]**
  - pronto quando: O Theus nomeia a gestão e o papel fica gravado na equipe. O servidor aplica: a gestão entra em terminal sem pedir, cria meta e campanha e publica a Oficina; o membro comum recebe 403.
  - fontes: CHECKLIST.md:14
- [ ] **A-012** · Tirar do app real a equipe simulada e os restos do protótipo **[Theus]**
  - pronto quando: Com duas Estações, mandar mensagem direta ou marcar uma demanda como 'pronta', 'perguntar' ou 'cutucar' não gera resposta, OK nem 'começar' automáticos: o A._reagir fica desligado no app real, com teste no limpo.test. O simulador.js e o terminal simulado não são carregados. Nenhum innerHTML monta texto de usuário sem escape.
  - fontes: prototipo/acoes.js:821 · prototipo/loja.js:254 · .deus/terminal-ao-vivo/MISSAO.md:45 · CHECKLIST.md:277 (+1)
- [ ] **A-013** · Decidir se a saída do agente pode ser gravada **[Theus]**
  - pronto quando: O Theus escolhe entre 'nada é gravado nesta fase' e o acervo guardar a saída final do agente em terminal.jsonl. CHECKLIST §2, IDEIAS e o acervo passam a dizer e fazer a mesma coisa. Se a escolha for gravar, grava só a saída e nunca a entrada, com teste.
  - fontes: memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md:17 · CHECKLIST.md:71 · CHECKLIST.md:267
- [ ] **A-014** · Mascarar senhas e chaves antes de gravar no acervo
  - pronto quando: Uma resposta do agente ou um arquivo com 'sk-…', 'senha: …' ou um token entra no acervo, no .coop/historico/terminal.jsonl e nas exportações JSONL como [redigido]. O acervo.test cobre isso. Hoje o acervo grava o texto final do agente sem nenhuma máscara.
  - fontes: IDEIAS.md:681 · IDEIAS.md:500 · app/servidor/acervo.js:5
- [ ] **A-015** · Mostrar onde cada um está só para quem aceitou aparecer
  - pronto quando: O Perfil tem a escolha 'mostrar onde estou e o que estou fazendo'. Sem o aceite, a pessoa não aparece na planta da TV, no Ctrl K 'Onde estão', no rastro, no coop_onde nem na faixa 'N pessoas com você'. Hoje só existe a escolha do 'cuidando da gente' (naoMostrarCuidado), e a posição de todos fica sempre à vista.
  - fontes: CHECKLIST.md:135 · CHECKLIST.md:147 · IDEIAS.md:124 · IDEIAS.md:298 (+2)
- [ ] **A-016** · Avisar na primeira abertura que a pasta compartilhada fica visível para todos
  - pronto quando: Ao fundar a equipe ou entrar nela, a tela diz que tudo em ~/BabelCoop/<id> fica visível para a equipe e pede para não pôr ali RH, financeiro nem chaves. A pessoa confirma antes de seguir. Hoje ponte.js e arquivos-real.js não mostram esse aviso.
  - fontes: IDEIAS.md:204 · IDEIAS.md:206 · IDEIAS.md:676
- [ ] **A-017** · Tirar do app real os textos de protótipo que prometem o que não acontece **[Theus]** _(em parte)_
  - pronto quando: No app instalado nenhuma tela diz 'No protótipo…', 'no app de verdade…' ou '(simulado)'. A lista de hoje: o Falar ('No protótipo é só este aviso'); o Falar ideia ('Ouvindo… (simulado)', 'a fala é simulada'); as Regras ('No protótipo começa desligada', com a caixa 'Pausar os cronômetros sozinho' que nenhum código lê); a Loja ('Chave guardada no cofre do seu computador', mas o valor digitado é descartado e só fica um true no estado); e o mapa ('expandiu… (simulado)'). O que não funciona some da tela ou diz a verdade, e o limpo.test confere.
  - fontes: prototipo/estacao.js:529 · prototipo/estacao.js:532 · prototipo/estacao.js:799 · prototipo/vistas-b.js:282 (+6)
### Máquina e banco

- [ ] **A-018** · Corrigir o IDEIAS e o FUNCOES: banco local primeiro, nuvem depois **[Theus]**
  - pronto quando: Três trechos passam a dizer o que o Theus pediu em 25/09 (banco local PGlite por projeto agora; 'subir para a nuvem' e 'xerox do banco' depois, pelo terminal): IDEIAS.md:354 ('uma projeção viva do código e do Supabase'), IDEIAS.md:797 ('Não há Supabase no Babel Coop') e FUNCOES.md:59 ('no app lê o Supabase de verdade').
  - fontes: IDEIAS.md:354 · IDEIAS.md:797 · docs/FUNCOES.md:59 · .deus/maquina-jogo/MISSAO.md:5
### Arquivos

- [ ] **A-019** · Mandar arquivo para a pasta de outra pessoa **[Theus]** _(em parte)_
  - pronto quando: Arrastar um arquivo para o nome de um membro, ou pedir 'manda para a Carla' ao agente, grava a cópia na pasta de projeto dele com o selo 'recebido de X', e ele recebe o aviso na hora. Provado com duas Estações (hoje o arquivos-real.js avisa 'ainda não grava').
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:77 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:78 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:90 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:171 (+1)
- [ ] **A-020** · Mostrar 'Salvando… / Salvo / Conflito' e salvar ao vivo em todas as Estações _(em parte)_
  - pronto quando: Com duas pessoas editando o mesmo arquivo, quem salva por último vê 'Conflito' com as duas versões, e nada se perde. 'Salvo' aparece na hora na árvore das outras Estações.
  - fontes: CHECKLIST.md:51 · CHECKLIST.md:56 · memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md:12
- [ ] **A-021** · Mostrar a foto de quem salvou por último **[Theus]** _(em parte)_
  - pronto quando: Quando a Rita salva um arquivo da pasta do Theus, a foto dela, e não a do dono, aparece no cabeçalho do arquivo e ao lado do nome na árvore.
  - fontes: CHECKLIST.md:52 · memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md:12
### Jogo e placar

- [ ] **A-022** · Decidir entre os efeitos de jogo e o teto da régua **[Theus]**
  - pronto quando: O Theus decide se a ordem dos 'poderes de jogo' e a Máquina-jogo ('game, diversão, adrenalina') revogam três regras: o teto de 2 efeitos vivos e 24 faíscas; o movimento percussivo sem bounce; e o 3D sem partículas nem câmera passeando. A decisão fica em memoria/decisoes/, e REGUA_ORGANISMO.md, ESTUDO_DESIGN_2030.md e MAQUINA_PECAS.md passam a dizer a mesma regra. Se o teto continuar valendo, o poderes.js (420 partículas) passa pelo reservar do motor.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:125 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:149 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:153 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:195 (+4)
### TV

- [ ] **A-023** · Decidir se a planta da sala na TV mostra o cronômetro de cada pessoa **[Theus]**
  - pronto quando: O Theus escolhe entre duas regras que se contradizem: a planta com o cronômetro de cada um (PLANO F2, feito em tv.js) ou 'na TV nunca o tempo por pessoa' (IDEIAS §5.4, §6 e §9). O plano que perder é corrigido, e o tv.js segue a escolha. Se a regra do IDEIAS valer, a planta mostra onde a pessoa está sem o tempo dela.
  - fontes: IDEIAS.md:182 · IDEIAS.md:428 · IDEIAS.md:590 · docs/design/PLANO.md:93 (+1)
### WhatsApp e Loja

- [ ] **A-024** · Tirar da Loja o aviso falso 'Instalado no seu Claude Code'
  - pronto quando: Clicar em Instalar só mostra 'Instalado' depois de gravar de verdade. Até lá, o texto diz que é apenas uma marcação.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:177
### Design e acabamento

- [ ] **A-025** · Corrigir o ESTUDO e o CONCEITO para os modos Tech | Vibe **[Theus]**
  - pronto quando: ESTUDO_DESIGN_2030.md e CONCEITO.md trocam 'o tema segue o sistema / Latte' pelo seletor Tech | Vibe. O Theus diz se o modo inicial segue o do sistema (prefers-color-scheme), e o código faz o que ele decidir.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:150 · memoria/decisoes/2026-09-25-dois-modos-tech-e-vibe.md:15
- [ ] **A-026** · Decidir o que pode ficar aceso sem evento **[Theus]**
  - pronto quando: O Theus decide, item por item, entre as ordens dele (o b que brilha e pulsa; as fotos brilhando com luz nas laterais) e a regra 'nada anima sem dado' (b como medidor de estado, avatar parado, chão da TV só com trabalho, selo que só esfria). CONCEITO, ESTUDO, PLANO e REGUA ficam com a regra escolhida, e o que não ficar sai do CSS e do JS. O b passa a acender quando a sala grava ou há projeção. A CPU com o app parado é medida de novo.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:89 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:127 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:144 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:146 (+8)
- [ ] **A-027** · Decidir entre o HUD do Babel OS e as proibições do ESTUDO **[Theus]**
  - pronto quando: O Theus decide se vale o HUD (vidro, scanlines, halo radial, neon) do contexto que ele mandou injetar. O ESTUDO e o CONCEITO passam a dizer isso. O que continuar proibido sai de terminal-real.css, navegador-real.css, nascendo.css, campanha.css, tv-2030.css, casca-2030.css e placar.css.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:116 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:149 · .deus/terminal-ao-vivo/MISSAO.md:44 · .deus/terminal-ao-vivo/MISSAO.md:63
- [ ] **A-028** · Corrigir o R8 do plano: seis sons ligados por padrão **[Theus]**
  - pronto quando: PLANO.md, plano.html e GERACAO_REPLICATE.md dizem o que o Theus mandou, igual ao código: seis sons, ligados na Estação, com botão para desligar e nunca na TV.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:168 · .deus/terminal-ao-vivo/MISSAO.md:61
- [ ] **A-029** · Corrigir o CONCEITO: a projeção tem luz de borda roxa **[Theus]**
  - pronto quando: CONCEITO.md e TELA_CONSTRUTOR.md trocam a hairline --t0 da projeção pela luz de borda roxa que o Theus pediu, igual ao código.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:94 · CHECKLIST.md:177 · memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md:13
- [ ] **A-030** · Corrigir o ESTUDO: o degradê fica no texto do terminal **[Theus]**
  - pronto quando: ESTUDO_DESIGN_2030.md:152 abre uma exceção, por ordem do Theus, para o degradê no texto do xterm (terminal e parede). Nos outros textos e botões, o degradê sai.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:147 · memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md:19 · CHECKLIST.md:28
- [ ] **A-031** · Manter o botão do b neon e decidir o rótulo 'Neon' **[Theus]**
  - pronto quando: A UX_PENEIRA deixa de mandar tirar o botão, porque o Theus pediu o b neon que liga e desliga. O Theus escolhe entre manter 'Neon' e usar 'luz da marca' no cromo, e o CONCEITO e o código ficam iguais.
  - fontes: memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md:18 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:117 · CHECKLIST.md:28
- [ ] **A-032** · Atualizar o CHECKLIST.md e a tabela da MISSAO com o que já tem prova
  - pronto quando: Os itens já provados passam a [x] com a evidência (cara de VS Code, servidor com SQLite, token, cronômetro destacável, CLAUDE.md na pasta, ignorados). A tabela de aceites da MISSAO deixa de dizer 'Aberto' no que o ENTREGA já selou. A lista única de afazeres vira a fonte do que falta.
  - fontes: CHECKLIST.md:7 · CHECKLIST.md:24 · CHECKLIST.md:33 · CHECKLIST.md:44 (+2)
- [ ] **A-033** · Corrigir no IDEIAS o que as decisões novas mudaram **[Theus]**
  - pronto quando: Quatro trechos do IDEIAS passam a dizer o mesmo que o app e a decisão mais nova: §14.11 ('paleta uma só') passa aos modos Tech | Vibe; §5 (barra com Explorador e 10 atividades) passa às 12 atividades com Criar; §15 (cor da pessoa por 'data-por' no bloco) passa à cor derivada do histórico, como no TELA_CONSTRUTOR; §11 e CHECKLIST §1 ('mDNS/Bonjour') passam ao anúncio por UDP do rede.js.
  - fontes: IDEIAS.md:702 · IDEIAS.md:98 · IDEIAS.md:796 · IDEIAS.md:637 (+3)
- [ ] **A-034** · Atualizar o docs/FUNCOES.md para o app real
  - pronto quando: O guia de teste de UX lista as 12 atividades na ordem do app, sem 'Ver como' e sem 'Tema roxo/azul/claro'. Marca como 'falta' o que o app real não faz (WhatsApp, voz, Loja, memória da sala) e aponta para o app instalado, e não para o link do protótipo v18.
  - fontes: docs/FUNCOES.md:4 · docs/FUNCOES.md:9 · docs/FUNCOES.md:10 · docs/FUNCOES.md:146 (+2)
- [ ] **A-035** · Escrever babel-coop minúsculo na Oficina e nos títulos dos planos **[Theus]** _(em parte)_
  - pronto quando: A Oficina mostra 'babel-coop · versão atual', 'Atualização vN do babel-coop publicada' e o aviso de atualizar em minúsculo, e os títulos de CHECKLIST.md e IDEIAS.md seguem a mesma grafia. Procurar 'Babel Coop' nos textos que aparecem na tela não acha nada.
  - fontes: memoria/memorias/2026-09-23-o-nome-e-babel-coop-minusculo.md:15 · prototipo/oficina.js:43 · prototipo/oficina.js:50 · prototipo/oficina.js:93 (+3)
## Onda 2 · logo (experiência de jogo, comandos e acabamento)

### Rede e instalação

- [ ] **A-036** · Assinar o .dmg e o .exe com os certificados do Theus
  - pronto quando: O .dmg assinado com Developer ID e notarizado e o .exe assinado instalam em outro Mac e num Windows sem aviso de segurança e sem precisar de botão direito > Abrir.
  - fontes: CHECKLIST.md:21 · memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md:7 · .deus/terminal-ao-vivo/MISSAO.md:37 · .deus/terminal-ao-vivo/ENTREGA.md:52
- [ ] **A-037** · Atualizar o app sozinho no Mac e no Windows (electron-updater)
  - pronto quando: Quando sai um instalador novo, as Estações instaladas avisam, baixam e reiniciam na versão nova, no Mac e no Windows.
  - fontes: CHECKLIST.md:22 · memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md:14 · app/servidor/atualizacao.js:4
- [ ] **A-038** · Pôr a Estação na bandeja e abrir junto com o computador
  - pronto quando: Fechar a janela deixa a Estação na barra de menus ou na bandeja, ainda servindo a pasta. A opção 'abrir ao ligar' faz o app subir no login, no Mac e no Windows.
  - fontes: memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md:14
- [ ] **A-039** · Fazer cópia diária do diário, do acervo e dos bancos para outro disco
  - pronto quando: Uma vez por dia, cada Estação copia o .coop/diario.jsonl, o acervo e os bancos PGlite dos projetos para um disco escolhido. Apagar o .coop e restaurar da cópia traz de volta os eventos, os aprendizados e as tabelas. Hoje não há backup: 'backup' não aparece em app/servidor/.
  - fontes: IDEIAS.md:653
- [ ] **A-040** · Impedir o Mac do Theus de dormir enquanto a TV e a sala estão ligadas
  - pronto quando: Com a janela da TV aberta e o Mac na tomada, o Mac não entra em repouso (powerSaveBlocker do Electron, que hoje não aparece em app/main.js). Depois de 30 min sem mexer, a TV e a memória da sala continuam de pé.
  - fontes: IDEIAS.md:670
### Segurança

- [ ] **A-041** · Confirmar no terminal antes de apagar ou encerrar algo de outra pessoa **[Theus]**
  - pronto quando: Pedir ao agente para apagar ou encerrar uma demanda, um arquivo ou uma campanha de outra pessoa mostra um bloco de espera s/N. Sem 'sim', nada muda. O teste do conector cobre isso.
  - fontes: CHECKLIST.md:83
- [ ] **A-042** · Decidir o alcance do agente no navegador próprio **[Theus]**
  - pronto quando: O Theus decide sobre executar JS/CDP livre (negado 2× pelo classificador) e sobre o agente abrir sites por conta própria (localhost:3000, babel.coop). A decisão fica em memoria/decisoes/ e a ferramenta segue o que foi decidido, com teste.
  - fontes: .deus/terminal-ao-vivo/RODADAS.md:17 · .deus/terminal-ao-vivo/RODADAS.md:18 · .deus/terminal-ao-vivo/RODADAS.md:31 · .deus/terminal-ao-vivo/ENTREGA.md:54 (+1)
- [ ] **A-043** · Criar o cofre de chaves por pessoa, com 'Pedir ao Theus' e chaves injetadas no agente **[Theus]**
  - pronto quando: Cada pessoa vê só o próprio cofre (Keychain no Mac, Credential Manager no Windows). 'Pedir ao Theus' entrega a chave uma vez. O terminal do agente roda com a chave no ambiente, sem ela ir para arquivo, pasta compartilhada ou diário. A Loja só avisa 'precisa da chave X'. Passar o mouse numa chave acende as peças que a usam.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:248 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:38 · CHECKLIST.md:142 · CHECKLIST.md:166 (+1)
### Terminal e agente

- [ ] **A-044** · Fazer o menu lateral conversar com o agente **[Theus]**
  - pronto quando: Abrir um item no menu lateral (arquivo, demanda, Máquina) muda o '→ alvo' do cabeçalho do painel, com as iniciais de quem está nele (cabeçalho de 56 px em --s2). O próximo pedido ao agente leva esse objeto como contexto sem a pessoa digitar.
  - fontes: .deus/maquina-jogo/MISSAO.md:6 · .deus/maquina-jogo/MISSAO.md:31 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:99 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:141
- [ ] **A-045** · Puxar um trecho ou uma peça até o agente como chip **[Theus]**
  - pronto quando: Arrastar uma seleção até o ❯, ou apertar Ctrl+Enter, cria um chip no campo. '⋯ > Levar para o agente' faz o mesmo. A peça espera 2 s sem tecla antes de pousar, e o cabeçalho mostra '1 peça esperando · Enter'.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:16 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:100 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:141 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:174
- [ ] **A-046** · Seguir o agente (tecla S) e só abrir sozinho o que ele escreve com Seguir ligado **[Theus]**
  - pronto quando: O botão Seguir e a tecla S ligam e desligam o modo. Ligado, o meio acompanha o objeto que o agente toca. Desligado, o arquivo que o agente escreve não abre sozinho no meio, só acende (guarda-corpo do ESTUDO:132).
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:100 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:141
- [ ] **A-047** · Ver o antes e o depois segurando Espaço sobre um bloco de ação **[Theus]**
  - pronto quando: Com Espaço pressionado sobre um bloco de ação do agente, o objeto mostra o estado anterior. Ao soltar, volta ao atual.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:15 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:141
- [ ] **A-048** · Criar a aba 'Revisar mudanças' com aceitar e rejeitar por trecho
  - pronto quando: Depois de uma ação do agente, a aba lista cada trecho alterado. Aceitar ou rejeitar um trecho grava só esse trecho no arquivo.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:18
- [ ] **A-049** · Endereçar o campo ❯ com verbo sublinhado e objeto pontilhado
  - pronto quando: Ao digitar 'abre a proposta', o verbo fica sublinhado e o objeto reconhecido fica pontilhado. A menção vira chip.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:107
- [ ] **A-050** · Deixar âmbar o cartão da parede quando o agente espera há mais de 10 min
  - pronto quando: Um agente em 'espera' há mais de 10 min deixa o cartão dele âmbar na parede. Quando ele volta a responder, o cartão volta ao normal.
  - fontes: memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md:13
- [ ] **A-051** · Dar o mapa ao agente: criar, expandir com o acervo, materializar galho e apresentar na TV **[Theus]**
  - pronto quando: No terminal funcionam pelo coop, com teste no mcp.test: 'cria um mapa de X'; 'expande o galho Y', consultando o acervo antes; 'materializa o galho em demanda, Tela ou peça'; 'apresenta na TV galho a galho'.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:82 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:173 · CHECKLIST.md:256 · CHECKLIST.md:257 (+1)
- [ ] **A-052** · Convidar pessoa pelo agente ('convida a Rita')
  - pronto quando: Pedir ao agente 'convida a Rita' gera o convite (código, QR ou token) e mostra na tela da gestão. A Rita entra com esse convite.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:78 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:176
- [ ] **A-053** · Ter o comando coop no terminal real para quem digita sem o agente
  - pronto quando: No shell de verdade funcionam coop livres, coop tv painel|reuniao|site <url>|visita, coop projetar <arquivo> e coop buscar <termo>, assinados pela pessoa, sem pedir ao agente. Hoje esses comandos só existem no terminal simulado do protótipo, e o app não tem binário coop.
  - fontes: IDEIAS.md:234 · CHECKLIST.md:81 · CHECKLIST.md:115 · docs/FUNCOES.md:72
- [ ] **A-054** · Dar ao agente o teste da Máquina ('testa como a outra empresa')
  - pronto quando: Pedir no terminal 'testa a porta X como a outra empresa' roda o Testar da Máquina pelo coop, contra o banco local. O pulso aparece na Máquina, e a resposta traz se passou ou foi barrado, com as linhas. O mcp.test cobre isso. Hoje as ações do agente na Máquina são só maquinaPeca, maquinaLigar e coop_banco_*.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:78 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:172 · app/servidor/coop-mcp.js:97
- [ ] **A-055** · Guardar os pedidos ao agente para os 3 melhores prompts e a biblioteca **[Theus]**
  - pronto quando: O Theus decide se o pedido digitado no ❯ pode ser guardado: é entrada, e o IDEIAS §8.3 manda gravar só a saída, enquanto o §8.5 manda guardar todo pedido. Se puder, cada pedido fica no histórico com autor e demanda, e a Inteligência e a TV mostram os 3 melhores do dia pelos critérios à vista, com 'usar' mandando para o terminal. Hoje nenhum código do app real grava prompt, e o estado nasce com prompts vazio.
  - fontes: IDEIAS.md:518 · IDEIAS.md:519 · IDEIAS.md:520 · IDEIAS.md:500
- [ ] **A-056** · Pôr desfazer em toda ação real do agente e miniatura no resultado **[Theus]** _(em parte)_
  - pronto quando: Cada ação do coop (demanda, aviso, peça, mapa, campanha) aparece como bloco assinado 'agente · pessoa', com 'desfazer' que reverte pelo diário. O bloco de resultado mostra uma miniatura de 96×54.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:106 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:181 · CHECKLIST.md:82
- [ ] **A-057** · Parar o agente com Esc no campo ❯ e com o ■ ao lado dele _(em parte)_
  - pronto quando: Com o agente rodando, Esc no campo ❯ para o turno (hoje só limpa o texto). O ■ aparece junto do ❯, além do botão Parar do cabeçalho.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:105 · memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md:13
- [ ] **A-058** · Mudar as receitas com o objeto e criar o grupo 'Receitas' no Ctrl K **[Theus]** _(em parte)_
  - pronto quando: Até 3 chips mudam conforme o objeto aberto: arquivo; Máquina (Testar · Ver montando); WhatsApp; Reunião. O Ctrl K tem o grupo 'Receitas' com as 8.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:101 · CHECKLIST.md:85
- [ ] **A-059** · Dar foto e menu ⋯ ao agente **[Theus]** _(em parte)_
  - pronto quando: Na aba do agente, o ⋯ oferece renomear, apagar e Pôr, Trocar ou Tirar foto. A foto aparece na aba, na parede e na Equipe, e continua lá depois de reabrir o app.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:108 · CHECKLIST.md:76 · memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md:13
- [ ] **A-060** · Mostrar várias pessoas no meu terminal com anéis sobrepostos e '+N' _(em parte)_
  - pronto quando: Com 2 visitantes, os anéis ficam numa linha só, sobrepostos em −4 px. Com 3 ou mais, aparecem um anel e '+N'.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:122
- [ ] **A-061** · Pôr o selo '● ao vivo / ● pausado' à direita das abas e o + com Ctrl+Shift+T _(em parte)_
  - pronto quando: O selo fica à direita da fila de abas e mostra '● pausado'; clicar nele pausa a transmissão. Ctrl+Shift+T abre uma aba nova. Alternativa: o TERMINAL_2030.md registra a posição atual como escolha.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:121
- [ ] **A-062** · Fazer o b do painel esfriar sozinho quando a saída para _(em parte)_
  - pronto quando: Sem saída nova, o --bc-nivel decai até 0 por meia-vida e o halo apaga. Hoje o nível fica parado no último valor, com o halo em base .3.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:120
- [ ] **A-063** · Retomar a demanda sozinha também pelo terminal real e pelos arquivos reais **[Theus]** _(em parte)_
  - pronto quando: Com a demanda pausada há mais de 45 s, digitar no terminal real do agente dela, ou abrir e salvar um arquivo real citado nela, retoma o cronômetro, avisa e registra no histórico.
  - fontes: CHECKLIST.md:114 · prototipo/cronometro.js:127
### Máquina e banco

- [ ] **A-064** · Montar a Máquina ao vivo a partir do código do projeto **[Theus]**
  - pronto quando: O agente cria uma tela de login no projeto e, sem outro comando, a Tela e a Portaria nascem com efeito na Máquina. Mudar uma rota ou uma função atualiza a Porta com a frase do comentário de uma linha. Buckets, process.env, fetch/.from e .channel viram Depósito, Cofre, Tela e Cano. Salvar um arquivo faz a Máquina reler o projeto.
  - fontes: .deus/maquina-jogo/MISSAO.md:5 · memoria/memorias/2026-09-25-maquina-como-jogo-de-montar.md:13 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:69 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:224 (+7)
- [ ] **A-065** · Ler as migrações do repositório e mostrar tracejado o que ainda não foi aplicado **[Theus]**
  - pronto quando: Uma migração em arquivo que ainda não foi aplicada aparece como peça tracejada. Ao aplicar, a peça ganha corpo.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:68 · CHECKLIST.md:236
- [ ] **A-066** · Montar e ligar a Máquina com a mão, arrastando **[Theus]**
  - pronto quando: Arrastar da paleta põe a peça tracejada. Soltar a Gaveta na Empresa põe tenant_id, chave e índice. Puxar de um pino faz a ligação: o alvo cresce, fica vermelho se a ligação é inválida, soltar no vazio cancela, dá para soltar peça sobre fio e o duplo clique cria desvio. O modo 'Ligar' da barra arrasta de qualquer ponto da peça. O agente escreve a migração e a peça ganha corpo ao ser aplicada.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:31 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:41 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:185 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:202 (+4)
- [ ] **A-067** · Transformar cada gesto da Máquina em cartão '[ver SQL] [desfazer]' e em migração **[Theus]**
  - pronto quando: Todo gesto ou mudança pela ficha gera no terminal '✓ … [ver SQL] [desfazer]' e um arquivo de migração em projetos/<pj>/banco/. 'O que muda' mostra o SQL real, não um esboço. Desfazer gera a migração inversa.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:70 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:207 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:237 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:249 (+3)
- [ ] **A-068** · Gravar as traduções no banco com COMMENT ON POLICY **[Theus]**
  - pronto quando: Uma política que a Máquina não reconhece ganha, escrita pelo agente em COMMENT ON POLICY, a frase em português. A Máquina lê essa frase de volta ao reabrir.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:238 · CHECKLIST.md:243
- [ ] **A-069** · Pedir uma peça a alguém, com demanda ligada à peça, foto e pisca ao concluir **[Theus]**
  - pronto quando: 'Pedir para o Davi' na peça cria uma demanda ligada à peça, com cronômetro. A foto dele aparece na peça, a peça pisca quando a demanda recebe OK e o aprendizado vai para o acervo.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:247 · CHECKLIST.md:239
- [ ] **A-070** · Mostrar na Máquina onde está cada pessoa e o agente
  - pronto quando: Quem está numa peça aparece nela com halo, cursor e foto. A peça montada pelo agente leva um quadrado de 14 px com a inicial, na cor do dono. A presença do agente fica junto da Máquina enquanto ele monta. 'Seguir o Davi' funciona na TV.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:42 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:86 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:186
- [ ] **A-071** · Mostrar as gavetas ao vivo por um proxy da Estação **[Theus]**
  - pronto quando: Com o app do projeto rodando pela Estação, cada leitura e escrita aparece na gaveta com entrada, saída e tempo. Clicar numa linha mostra a gaveta, o projeto e o backup.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:71 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:72 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:236 · CHECKLIST.md:237
- [ ] **A-072** · Dar vida aos fios e aos campos (hover, quem ligou, piscar ao gravar)
  - pronto quando: Hover no fio mostra destaque ciano, etiqueta em português e 'ligado por Davi · 14:32'. O Campo pisca quando o pulso grava e, em 'Ver por pessoa', mostra a cor de quem o adicionou. O campo de ligação tem pino próprio.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:29 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:30
- [ ] **A-073** · Dar à peça Tela uma miniatura real e abrir a aba certa
  - pronto quando: A Tela mostra a miniatura real da página (iframe congelado ou captura). Uma Tela nova mostra 'tela ainda sem conteúdo'. O clique abre a aba Site | Código | 3D.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:39 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:40
- [ ] **A-074** · Decidir com o Theus quais regras do MAQUINA_PECAS caem diante da Máquina-jogo **[Theus]**
  - pronto quando: O Theus decide, regra por regra: nada flutua sobre a Máquina; peça sem drop-shadow; sem PNG isométrico nem clipe no 2D; só duas camadas de cor (sem o anel roxo); vista frontal, sem isometria; glTF só para Portaria e Cofre (hoje há 16). O MAQUINA_PECAS.md é reescrito com o que vale e o código segue. Movimento e partículas ficam na decisão dos efeitos de jogo.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:187 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:188 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:190 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:191 (+3)
- [ ] **A-075** · Fazer o Testar da Máquina gravar e ler o banco local de verdade **[Theus]** _(em parte)_
  - pronto quando: Testar numa Porta insere a linha no PGlite do projeto, e a gaveta mostra o contador real (50 → 51) com os valores. As ligações do formulário viram listas de escolha. 'Como quem' cria duas empresas com um usuário cada. 'Como a outra empresa' roda a consulta com o outro usuário e o cadeado barra de verdade. Login com senha errada fica vermelho na Portaria. 'Encher de exemplo' põe 20 pacientes e 50 agendamentos em duas empresas.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:73 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:80 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:81 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:172 (+8)
- [ ] **A-076** · Completar os alertas das peças **[Theus]** _(em parte)_
  - pronto quando: Com um esquema de teste que tenha cada caso, os alertas aparecem na peça certa: gaveta aberta para todos; 'por empresa, mas aberta'; ligação sem índice; fio solto em vermelho tracejado; sem papéis (Portaria); sem alvo (Robô); público sem querer (Depósito); porta que não existe (Tela); sem assinante (Cano). Cada alerta usa o glifo SVG e hairline de 1,5 px, e aparece como selo grande atrás da placa na TV.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:28 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:32 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:34 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:48 (+3)
- [ ] **A-077** · Fazer a Empresa agrupar as gavetas do banco _(em parte)_
  - pronto quando: Uma Empresa montada pelo agente, ou lida do banco pelo tenant_id, recebe as gavetas certas sem depender do id 'empresa'. A etiqueta escala com o zoom e tem a fita da pessoa. Arrastar a bandeja leva as gavetas junto.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:33 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:202 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:240
- [ ] **A-078** · Completar os presets da Máquina **[Theus]** _(em parte)_
  - pronto quando: 'Salvar como preset' só aparece depois de um teste verde, com ✓ verde em cada peça que vira âmbar se a peça mudar. O cartão do preset tem glifo, selo 'verificado', versão e o aviso 'mudou depois do teste'. O preset: se arrasta da paleta; publica as portas 'precisa de' e 'entrega' (o que falta entra tracejado com ⚠); dá crédito ao autor na Ficha; sobe de versão ('atualizar preset v3'); aparece em 3D na Loja. No terminal, 'usa o preset X' e 'instala o preset' funcionam.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:5 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:10 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:43 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:44 (+9)
- [ ] **A-079** · Parar o teste numa peça e fixar os dados numa Porta _(em parte)_
  - pronto quando: Durante o teste, dá para parar numa peça, marcada por uma seta vermelha. A Porta pode ficar 'fixada', com a faixa 'dados fixos para teste', para retestar só o Robô. Depois do teste, uma bolha clicável em cada peça abre a entrada e a saída.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:35 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:204 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:211 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:212
- [ ] **A-080** · Completar a ficha da peça com região, backup e 'Explicar com o agente' de verdade _(em parte)_
  - pronto quando: A ficha mostra onde o dado fica guardado: tabela, linhas, região e backup. 'Explicar com o agente' manda o pedido ao agente real, e a resposta volta ao terminal.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:242
- [ ] **A-081** · Deixar a linha do tempo da Máquina clicável, com filtro por pessoa e por peça **[Theus]** _(em parte)_
  - pronto quando: Clicar num item da linha do tempo leva até a peça. Os filtros por pessoa e por peça funcionam, e a lista tem um limite de itens.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:210 · CHECKLIST.md:236
- [ ] **A-082** · Guardar o estado pessoal da Máquina (zoom, colapso, opacidade) _(em parte)_
  - pronto quando: Zoom, rolagem, colapso e opacidade voltam iguais ao reabrir a Máquina (localStorage com try/catch). O estado da equipe continua no diário.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:208
- [ ] **A-083** · Evitar espaguete: junção no fio, título da moldura que escala e sugestão de preset _(em parte)_
  - pronto quando: Dois fios que saem do mesmo pino se juntam. O título da moldura escala com o zoom. Montar o mesmo grupo duas vezes sugere salvar como preset.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:209
- [ ] **A-084** · Mostrar a Ferramenta (extensões do Postgres) no modo real **[Theus]** _(em parte)_
  - pronto quando: As extensões do banco local aparecem como peça Ferramenta no modo real, e a vitrine mostra o número real em vez do '2' fixo.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:143
- [ ] **A-085** · Acabar as peças 2D como pede o MAQUINA_PECAS _(em parte)_
  - pronto quando: Conferido peça a peça. Gaveta: puxador de 16×2 e frente que abre −4° com perspective de 1400 px no .mq-palco. Porta: cabeçalho mais claro e ponto 'entra' de 4 px. Robô: 96×96, fio vermelho de erro separado e, com reduce, só o LED. Depósito: 'recebeu' com uma caixa a mais e entrada pelo topo. Pinos por função. 'Pronta' passa de tracejado a sólido em 180 ms. Larguras em múltiplos de 8.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:35 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:36 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:37 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:49 (+6)
- [ ] **A-086** · Deixar o 3D leve e na gramática da Máquina _(em parte)_
  - pronto quando: O 3D da Máquina e da Tela respeita os limites: pixelRatio até 1,5; laço só enquanto algo anima (IntersectionObserver e visibilitychange param); até 3 luzes e 3 pulsos; damping desligado com reduce; câmera parada; aviso quando o zoom não está em 100 %. Visual: material 0x161e2d/0x212a3b com chanfro e sem emissive em repouso, uma luz só, fio #506b94, jacks e fios como tubos. Cada GLB tem até 120 KB (hoje 11 de 16 passam) e o cofre.glb de 1,1 MB sai. Com 40 peças, 12 fios e 3 pulsos, cada quadro leva até 10 ms.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:46 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:47 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:182 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:194 (+5)
- [ ] **A-087** · Trocar os emojis e o ⚠ de texto pelos ícones da família _(em parte)_
  - pronto quando: O 3D da aba Site | Código | 3D usa os glifos de icones.js no lugar de 🗄 🚪 ⚙ 🛂 🔐 📦, e o alerta da peça usa o glifo SVG 'alerta'.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:189 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:198
### Arquivos

- [ ] **A-088** · Deixar a gestão editar arquivo de outra pessoa, com aviso e versão guardada
  - pronto quando: Gestão e admin salvam arquivos de outra pessoa; o dono recebe o aviso 'a gestão corrigiu' e a versão anterior fica guardada. O membro comum continua recusado. Todo mundo edita as pastas comuns e o README da equipe.
  - fontes: CHECKLIST.md:53 · CHECKLIST.md:55 · memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md:12
- [ ] **A-089** · Criar o projeto de código com git na Estação **[Theus]**
  - pronto quando: Um projeto de código tem repositório git na pasta do projeto, e a Estação mostra branch, mudanças e histórico. O .env fica fora da pasta compartilhada. Os MCPs do Supabase e da Vercel vêm pela Loja.
  - fontes: CHECKLIST.md:142
- [ ] **A-090** · Ligar galho do mapa a arquivo, pessoa ou projeto e abrir o mapa pela busca **[Theus]**
  - pronto quando: Arrastar um arquivo da árvore até um galho, ou digitar @Carla nele, cria o vínculo, com ícone ou foto. O coop buscar e o Acervo acham o texto de um galho e abrem o mapa centrado nele. Hoje mapamental.js e mindforge/ não têm drop nem menção, e a busca não centra o galho.
  - fontes: CHECKLIST.md:258 · CHECKLIST.md:261 · IDEIAS.md:286 · IDEIAS.md:289
- [ ] **A-091** · Deixar a divisão dos arquivos no meio 'super limpa', como o Theus pediu **[Theus]** _(em parte)_
  - pronto quando: O Theus olha a árvore e o meio no app instalado e aprova a divisão dos arquivos. O que ele apontar fica corrigido e fotografado nos dois modos.
  - fontes: .deus/terminal-ao-vivo/RODADAS.md:19
- [ ] **A-092** · Pôr régua de versões em toda aba, com as versões do disco **[Theus]** _(em parte)_
  - pronto quando: Arquivo, Tela e mapa listam as versões gravadas em .coop/versoes por uma rota do servidor, com a foto de quem salvou. O hover mostra a prévia e dá para arrastar pela régua. 'Voltar como estava' funciona depois de reabrir o app, e também pelo agente ('volta como estava ontem'). 'Comparar' mostra as versões lado a lado. Na Tela, avisa que o banco não volta junto.
  - fontes: CHECKLIST.md:51 · CHECKLIST.md:228 · CHECKLIST.md:262 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:78 (+4)
- [ ] **A-093** · Subir imagem, PDF e vídeo pelo próprio app **[Theus]** _(em parte)_
  - pronto quando: Arrastar ou escolher imagem, PDF e vídeo na Estação grava o arquivo na pasta compartilhada e o abre no meio, sem passar pelo Finder.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:77 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:171
- [ ] **A-094** · Pôr 'mudaram por último' com marca de tempo na lateral _(em parte)_
  - pronto quando: A lateral tem o cabeçalho 'mudaram por último', com a marca de tempo de 6 px em cada linha.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:109 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:147
- [ ] **A-095** · Exportar o mapa em Markdown, PNG e no formato do M Master **[Theus]** _(em parte)_
  - pronto quando: O menu de exportar do mapa gera .md, .png e o formato do M Master. Hoje ele só exporta JSON, SVG e texto.
  - fontes: CHECKLIST.md:262 · prototipo/mindforge/app.js:385
### Jogo e placar

- [ ] **A-096** · Resolver a gamificação do Perfil: títulos, dias corridos e meta **[Theus]**
  - pronto quando: O Theus decide entre a gamificação do CHECKLIST (nível, selos, sequência de dias) e a do ESTUDO e da REGUA (selos presos a fato, sem títulos, dias úteis). Conforme a decisão, o Perfil tira ou mantém os níveis 'Aprendiz…Lenda', o '🔥 N dias' e o selo '7 dias seguidos'. O Perfil mostra o anel da meta vindo do BC.placar, e a sequência congela em folga e feriado.
  - fontes: CHECKLIST.md:99 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:132 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:142 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:159
- [ ] **A-097** · Fechar o dia com resumo que esfria, 'hora de dormir' e pausa fora do expediente
  - pronto quando: No horário configurado para cada área, o organismo esfria com o resumo do dia, as demandas pausam sozinhas e o chat silencia com um resumo. No expediente seguinte, tudo volta.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:20 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:85 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:163 · CHECKLIST.md:108 (+1)
- [ ] **A-098** · Escrever a ficha de cada mecânica e o mecanismo de controle
  - pronto quando: docs/testes/ tem uma ficha por mecânica (hipótese, medida com denominador, controle) e a tabela 'Como medir'. O app deixa esconder os pontos para metade da equipe, fazer semanas sem pulso e desligar a meta.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:21
- [ ] **A-099** · Somar todos os eventos num placar só (BC.placar.somar) **[Theus]** _(em parte)_
  - pronto quando: Estes eventos sobem o mesmo número do rodapé, com origem clicável: item (+1 a +4), documento (+8), nó (+1), teste (+6), barrado (+2), Máquina funcionando (+12), OK recebido (+8), uso do meu trabalho (+2) e Campanha no ar. Placar, palcos locais e Perfil leem a mesma contagem. Há teste para cada evento.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:83 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:85 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:129 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:130 (+3)
- [ ] **A-100** · Fazer do rito de conclusão um evento da equipe, com luz dirigida ao autor **[Theus]** _(em parte)_
  - pronto quando: 'Documento concluído', 'Máquina funcionando', 'Campanha no ar' e o OK viram eventos do diário, e a TV e a parede acendem. No OK, a luz percorre a ficha da demanda de quem fez e mostra +8. 'Lia usou o seu aprendizado' acende no autor. O corpo da equipe na parede soma documentos, campanhas e OKs.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:85 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:131 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:133 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:134 (+2)
- [ ] **A-101** · Tirar os pontos pessoais da TV e mostrá-los à gestão _(em parte)_
  - pronto quando: A barra da TV não mostra os pontos de quem está logado (regra R4: nada pessoal na TV), e o 'N pontos' sugerido no FALTAS F2.2 sai. A gestão vê os pontos do placar.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:83 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:131 · CHECKLIST.md:99 · .deus/terminal-ao-vivo/FALTAS.md:45
- [ ] **A-102** · Dar intensidade ao plano do agente (prazo, item que travava, 120 ms por item) _(em parte)_
  - pronto quando: O servidor manda o prazo no agente-plano. Um item concluído antes do prazo, ou que travava há mais de 1 dia, faz pulso duplo, 12 faíscas, 900 ms e pontos ×2. Os itens do checklist aparecem um a um, apagados, a cada 120 ms.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:128 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:135 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:136
- [ ] **A-103** · Criar a engrenagem 'luzes · faíscas · som · pontos' e o 'sair do jogo' _(em parte)_
  - pronto quando: A engrenagem desliga luzes, faíscas, som e pontos, cada um separado. 'Sair do jogo' para a contagem, em vez de só esconder o número.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:126
- [ ] **A-104** · Acender a casca quando o agente toca um objeto **[Theus]** _(em parte)_
  - pronto quando: Quando o agente escreve ou mexe num arquivo, a aba, a linha da árvore (com o selo 'novo') e o bloco acendem juntos por 6 s, e uma linha tracejada corre pelo trilho das abas (--trilho-y). Os eventos acendem a árvore, a barra e o rodapé com filtro de relevância. O toast sai: a notificação nasce a 100 % e esfria em 6 s, uma por vez.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:88 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:102 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:104 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:138 (+3)
### TV

- [ ] **A-105** · Mostrar a evolução da semana na TV **[Theus]**
  - pronto quando: A zona que gira da TV tem o bloco de 7 linhas empilhadas na escala de tempo, ao lado de um número, com a evolução dos projetos e as skills publicadas. O aviso da Loja que cita esse bloco passa a ser verdadeiro.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:13 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:22 · CHECKLIST.md:143 · CHECKLIST.md:167 (+1)
- [ ] **A-106** · Acertar a hora entre as Estações para os cronômetros e o relógio
  - pronto quando: Com dois computadores de relógios 2 min diferentes, o cronômetro de uma demanda começada no segundo aparece certo na TV e na Estação do primeiro, sem tempo negativo nem salto. O relógio e os cronômetros da TV vêm do diário. Hoje ponte.js, diario.js e rede.js não compensam a diferença de relógio.
  - fontes: CHECKLIST.md:182
- [ ] **A-107** · Projetar ao vivo qualquer aba na TV, inclusive a Máquina e um site em construção **[Theus]** _(em parte)_
  - pronto quando: 'Projetar na TV' na Máquina, ou numa Tela sendo construída, mostra a mesma aba na TV e atualiza enquanto o agente monta. A TV lê o maquinaTv, em vez de escolher o projeto mais recente.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:250 · CHECKLIST.md:230
- [ ] **A-108** · Levar o chão vivo para a Visita, o fundo da Reunião e o celular _(em parte)_
  - pronto quando: O chao-vivo aparece no modo Visita, no fundo da Reunião e como pôster no celular, e não só em tv.js.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:87 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:165
- [ ] **A-109** · Resolver a constelação da sala (nó por terminal ou por pessoa) e mostrar o nome da sala _(em parte)_
  - pronto quando: Decidido entre um nó por terminal (TERMINAL_2030) e um anel por pessoa (o código atual), o TERMINAL_2030.md e o código passam a dizer o mesmo. O centro mostra o nome da sala em Cormorant, e não o texto fixo 'a sala'.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:123
### Reunião e sala

- [ ] **A-110** · Fazer a Reunião tomar a tela, com a ata em Cormorant sobre Latte **[Theus]** _(em parte)_
  - pronto quando: Abrir a Reunião ocupa a tela inteira, com o material em destaque, as decisões e os próximos passos. Ao encerrar, a ata sai em Cormorant sobre Latte.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:92 · CHECKLIST.md:175
### WhatsApp e Loja

- [ ] **A-111** · Fazer a Oficina atualizar as outras Estações e o agente propor mudanças **[Theus]** _(em parte)_
  - pronto quando: A gestão publica a vN numa Estação e as outras mostram '⬆ Atualizar vN'. Ao clicar, elas baixam os arquivos, conferem o sha256 e recarregam, em teste com duas Estações. Pedir 'muda no app' ao agente prepara a mudança na Oficina/app da pessoa, roda os testes e deixa a mudança aguardando publicação.
  - fontes: CHECKLIST.md:23 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:78 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:93 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:174 (+1)
- [ ] **A-112** · Completar o chat com 'digitando…' real e mensagem de áudio _(em parte)_
  - pronto quando: 'digitando…' aparece para a outra pessoa quando alguém digita de verdade (hoje só aparece junto de uma resposta simulada), e dá para mandar mensagem de áudio no chat.
  - fontes: CHECKLIST.md:105 · prototipo/acoes.js:842
- [ ] **A-113** · Pôr 'guardar no acervo' no menu da mensagem do chat _(em parte)_
  - pronto quando: O menu da mensagem tem 'guardar no acervo'. A mensagem marcada aparece no Acervo e no coop_buscar, e as outras continuam fora. O servidor já aceita a marca (acervo.js:354), mas o chat só tem responder, reagir, virar demanda e mandar para a TV.
  - fontes: CHECKLIST.md:107 · IDEIAS.md:710 · app/servidor/acervo.js:354 · prototipo/chat.js:80
### Celular e iPad

- [ ] **A-114** · Dar identidade ao celular e ao iPad (nome + PIN) **[Theus]**
  - pronto quando: Depois de entrar, a pessoa cadastra nome e PIN, com sessão longa e limite de tentativas. No celular ela dá OK por toque, manda chat, vê o painel de agentes ('→ README.md · pensando há 4 s') e a presença, e faz pedidos ao agente por texto. Tudo sai assinado por ela, e não pelo dono da Estação.
  - fontes: CHECKLIST.md:45 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:86 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:97 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:140 (+2)
- [ ] **A-115** · Deixar o iPad só com o quadro e uma barra embaixo com alvos de 48 px **[Theus]** _(em parte)_
  - pronto quando: No iPad, a tela mostra só o quadro, sem cromo, com a barra embaixo e alvos de 48 px.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:96
### Design e acabamento

- [ ] **A-116** · Resolver o Selo diante do 'organismo sem carimbo' **[Theus]**
  - pronto quando: O Theus diz o que sobra do Selo e do 'carimbo reto', já que o organismo substitui o carimbo. O que ficar é feito: OK com nome e hora preso ao objeto, 'Desfeito por', 'Rompido por … voltou como estava' e o mesmo objeto acendendo nas 3 colunas. O CONCEITO é atualizado.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:103 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:158 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:161 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:276
- [ ] **A-117** · Fazer a primeira abertura em um passo, com o diagrama 'Arquivos · Trabalho · Agentes'
  - pronto quando: A primeira abertura mostra o diagrama de traço único Arquivos · Trabalho · Agentes, com o b se desenhando, e termina em um passo.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:23 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:118
- [ ] **A-118** · Enxugar a ajuda: um '?' por atividade e Ctrl Shift B
  - pronto quando: Os 46 textos de ajuda saem e cada atividade ganha um '?'. Ctrl Shift B sai dos modos que tomam a tela.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:17 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:24
- [ ] **A-119** · Aprovar o nome e a linha 'sistema com corpo · Trabalho à vista' **[Theus]**
  - pronto quando: O Theus aprova ou troca. Se aprovar, a linha aparece na entrada e na TV.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:14 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:26
- [ ] **A-120** · Criar a densidade compacta para o app inteiro
  - pronto quando: Uma opção troca o app inteiro entre a densidade confortável e a compacta.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:150
- [ ] **A-121** · Medir com o app rodando (contraste, digitação, resposta e visual)
  - pronto quando: Medido e anotado no app instalado: contraste APCA nos dois modos (corpo Lc ≥ 75, rótulo ≥ 60); da tecla ao quadro, p95 abaixo de 16 ms; resposta abaixo de 100 ms; pulso de cerca de 600 ms e faíscas de cerca de 866 ms; nenhuma animação ao trocar de aba. O Theus julga se está 'sem excesso' e se o anel parece o de imag-estacao.jpg.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:256 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:257 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:258 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:259 (+2)
- [ ] **A-122** · Trocar o logo PNG por SVG em todo lugar **[Theus]** _(em parte)_
  - pronto quando: O babel-logo.png (204 KB) sai do topo, da entrada, do Criar, do vazio, do terminal e do iPad, e no lugar fica o b em SVG.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:145 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:162 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:184 · memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md:13
- [ ] **A-123** · Desenhar o b na entrada, ao ligar a TV e na espera longa _(em parte)_
  - pronto quando: O b se desenha na primeira entrada (boas-vindas ou pedido aceito), pulável com qualquer tecla, e ao ligar a TV. O b estático do topo é o último quadro desse desenho. Para a espera de mais de 3 s, fica decidido e feito o traço andando ou o anel com 'pensando há N s'.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:9 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:84 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:114 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:162 (+1)
- [ ] **A-124** · Limpar o rodapé: 24 px, 8 casas e 'Salvo na equipe' que esfria _(em parte)_
  - pronto quando: O rodapé tem 24 px e 8 casas fixas, como luzes apagadas (presença · caixa · cronômetro · sala). Saem 'acervo: N', 'TV conectada/não aberta' e '● terminal ao vivo'. 'Salvo na equipe' nasce aceso e esfria em 6 s.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:88 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:113 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:156
- [ ] **A-125** · Ajustar a tipografia e os alvos (Cormorant a partir de 24 px, piso de 11 px) _(em parte)_
  - pronto quando: Nenhuma Cormorant abaixo de 24 px, e nenhuma em rito do sistema. Nenhuma fonte abaixo de 11 px nos CSS 2030 (hoje são cerca de 46). Alvos de pelo menos 24 px na Estação e 48 px no celular e no iPad.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:148 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:151
- [ ] **A-126** · Reduzir o movimento efeito por efeito, sem a regra global de 0,01 ms _(em parte)_
  - pronto quando: Sai a regra global de prototipo/base.css:244-249. Com prefers-reduced-motion, cada efeito tem um equivalente estático.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:115 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:152 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:196
- [ ] **A-127** · Fixar a cor de cada pessoa (11 matizes oklch, escolhida por ela) _(em parte)_
  - pronto quando: A cor vem dos tokens --pessoa-N e nunca se repete nem é reatribuída, mesmo com mais de 8 pessoas. Cada pessoa escolhe a sua.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:160
- [ ] **A-128** · Mostrar a demanda como ficha em coluna mono _(em parte)_
  - pronto quando: A demanda mostra título, PARA/livre, PRAZO, ESTIMA, PRIOR. e PROJETO, com rótulos mono em coluna.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:91 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:161
- [ ] **A-129** · Completar o menu ⋯ e ter um só botão + _(em parte)_
  - pronto quando: Todo objeto tem um ⋯ de 24×24 com Projetar, Levar para a reunião, Pedir ajuda, Chamar para cá, Enviar para, Sugerir mudança e Versões. Nenhuma ação fica só no hover. Há um único +, com menu.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:110
- [ ] **A-130** · Pôr o rótulo 'local · ramo' na fila de abas _(em parte)_
  - pronto quando: Com a Máquina ou um .html aberto, a fila de abas mostra 'local · ramo'. O 'produção' só aparece quando houver nuvem.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:111
- [ ] **A-131** · Acertar as larguras do painel e da lateral e a casa 'agentes' _(em parte)_
  - pronto quando: O painel da direita tem 360 px e só arrasta entre 312 e 520 px (hoje vai de 280 a 900). A lateral tem 264 px, entre 208 e 424. Recolhido, o painel deixa a casa 'agentes' no rodapé.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:109 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:112 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:315
- [ ] **A-132** · Gerar os 4 clipes de estado da presença e os 'ganha corpo' que faltam _(em parte)_
  - pronto quando: Com o ok do Theus para o gasto, a Replicate gera os 4 clipes de 4 s da presença e os 'ganha corpo' das outras 3 peças com gesto, com o custo no MANIFESTO, e o app passa a usá-los. O Cofre visto por trás entra se o Theus quiser. Alternativa: o Theus decide que o efeito feito em código basta.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:27 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:79 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:86 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:164 (+2)
## Onda 3 · depois (os grandes: WhatsApp real, voz, construtor tipo Lovable)

### Rede e instalação

- [ ] **A-133** · Suportar Linux
  - pronto quando: Um pacote Linux gerado no CI instala, o terminal abre o bash e a Estação entra na equipe.
  - fontes: CHECKLIST.md:271
### Terminal e agente

- [ ] **A-134** · Pedir ao agente por voz, na Estação e no celular **[Theus]**
  - pronto quando: Segurar o botão de voz e falar vira o pedido escrito no campo ❯, com transcrição local e sem nuvem, na Estação e no celular.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:77 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:97 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:98 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:178 (+1)
### Telas e construtor

- [ ] **A-135** · Pôr alças e barra do bloco na prévia (tamanho, posição, margem, padding, cor, imagem) **[Theus]**
  - pronto quando: O bloco selecionado tem contorno de 2 px em --t0 e 8 alças de 8 px. Arrastar muda tamanho, posição, margem e padding. A barra flutua a 8 px com Texto · ↑ · ↓ · Duplicar · Apagar · Cor · Imagem · Pedir ao agente. A imagem pode ser trocada, cortada e gerada por IA.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:61 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:221 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:225 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:229 (+2)
- [ ] **A-136** · Dar ao construtor a física e o teclado do TELA_CONSTRUTOR **[Theus]**
  - pronto quando: Arraste: começa a 4 px com mouse, 6 px com dedo e 25 px no iPad, em distância euclidiana, com transform e setPointerCapture; levantar leva 80 ms (scale 1.01, opacidade 0,9), assentar 160 ms, os irmãos deslizam em 200 ms (FLIP) e cancelar volta em 200 ms; toque longo de 500 ms. Seleção: duplo clique põe o caret no ponto clicado; Enter, Shift+Enter e Tab andam pela árvore; ⌘+clique seleciona por dentro. Teclado: setas, Delete, ⌘D e multi-seleção com Shift. Aparência: hover com 1 px sólido em --t0. Texto: contenteditable plaintext-only com beforeinput e contorno --ok.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:53 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:54 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:56 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:57 (+5)
- [ ] **A-137** · Medir e alinhar no construtor (Alt, guias, rotação, esconder a camada)
  - pronto quando: Alt mostra as medidas, as guias fazem snap e dá para girar o bloco. O medidor é honesto. ⌘ + barra invertida esconde a camada. Dá para deixar anotação para o agente.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:55 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:58
- [ ] **A-138** · Criar o 'Pedir ao agente' com pacote de contexto e resposta em patches **[Theus]**
  - pronto quando: Pedir ao agente sobre um bloco manda arquivo:linha:coluna, trecho, seletor, regras CSS e recorte. A resposta volta como patch aplicado no arquivo, com desfazer.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:62 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:230 · memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md:11
- [ ] **A-139** · Deixar o agente editar o site ao vivo, com cursor próprio e blocos no painel
  - pronto quando: Quando o agente edita, a aba mostra a prévia do site, e não o texto. O cursor dele move em 320 ms e some em 3 s ou 60 s; há Seguir e Esc para parar, e ele espera o caret de quem está digitando. Cada geração vira um bloco no painel, com desfazer e marca na régua.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:51 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:52 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:223
- [ ] **A-140** · Fazer o agente escrever HTML/CSS puro, com comentário por seção e tokens
  - pronto quando: Os sites novos do agente saem em HTML/CSS sem framework, com um comentário de uma linha por seção e tokens em :root, pedidos pelo CLAUDE.md ou pela skill da pasta.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:50
- [ ] **A-141** · Editar os estilos direto na regra e o responsivo pela largura da prévia
  - pronto quando: Ao mudar uma cor, o construtor pergunta 'o token ou só aqui?' e aplica o patch na regra (folha construída, CSS.supports). Arrastar a largura da prévia escolhe qual @media é editado.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:59 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:60
- [ ] **A-142** · Fazer a tabela de movimento reduzido e o roteiro de testes da Tela
  - pronto quando: Com prefers-reduced-motion, cada efeito da Tela é reduzido (não removido), conforme a tabela. O roteiro (a) a (i) roda automatizado. Do toque até a mudança visível, a medida fica em até 100 ms.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:65 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:67 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:264
- [ ] **A-143** · Gravar a edição visual como patch no arquivo de origem **[Theus]** _(em parte)_
  - pronto quando: Trocar um título na prévia muda só aquela linha no arquivo (posição pelo parse5, patch por offset com magic-string), e não o HTML inteiro serializado do DOM. O postMessage só sai ao soltar, ao sair do texto ou ao apagar. O que não mapeia vira pedido ao agente com o elemento selecionado.
  - fontes: CHECKLIST.md:227 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:64 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:222 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:232 (+1)
- [ ] **A-144** · Criar o 'Ver por pessoa' com a cor de quem mexeu **[Theus]** _(em parte)_
  - pronto quando: Ligado, blocos do site, peças da Máquina, trechos de texto e galhos do mapa ganham a cor de quem mexeu por último. A cor vem do histórico de patches, e não de um data-por no HTML. A idade aparece como opacidade (::highlight, sem span). Fora do modo fica uma borda de 3 px. Há desfazer por pessoa.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:63 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:234 · CHECKLIST.md:229 · memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md:11
### Arquivos

- [ ] **A-145** · Editar junto com dois cursores (Yjs)
  - pronto quando: Duas pessoas digitam no mesmo arquivo, e no mesmo mapa, pela Estação do dono, cada uma com seu cursor e sem perder texto.
  - fontes: CHECKLIST.md:139 · CHECKLIST.md:259 · memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md:14
- [ ] **A-146** · Criar os documentos a várias mãos (atas, roteiros, procedimentos) **[Theus]**
  - pronto quando: Um documento vivo fica no diário, com cópia em todas as Estações. Tem o cursor colorido de cada pessoa, histórico e exportação para a pasta em PDF ou Markdown, e continua abrindo com o autor desligado.
  - fontes: IDEIAS.md:211 · IDEIAS.md:213 · IDEIAS.md:214
- [ ] **A-147** · Indexar PDF e usar embeddings locais no acervo _(em parte)_
  - pronto quando: O texto de um PDF da pasta entra no acervo e o coop buscar o encontra. A busca por semelhança usa um modelo pequeno de embeddings local, sem LLM, além do trigrama.
  - fontes: CHECKLIST.md:155 · CHECKLIST.md:156 · memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md:14
- [ ] **A-148** · Agendar o sonho noturno _(em parte)_
  - pronto quando: De madrugada, no Mac do Theus, o sonho roda sozinho. Ele faz o resumo do dia por contas e regras (o que se repetiu, o que surpreendeu, top 3 de prompts), atualiza o APRENDIZADOS.md e exporta o JSONL do dia com uma API local para a IA do Theus.
  - fontes: CHECKLIST.md:210 · CHECKLIST.md:211 · CHECKLIST.md:212 · CHECKLIST.md:213 (+1)
### Jogo e placar

- [ ] **A-149** · Decidir os recursos de gestão que ficaram fora (captura rápida, modelos, recorrentes, decisões, não perturbe)
  - pronto quando: O Theus diz quais entram entre: captura rápida, modelos de demanda, demandas recorrentes, registro de decisões e 'não perturbe' com o status em foco. Os escolhidos funcionam no app real, e os outros ficam marcados como fora no IDEIAS §9.
  - fontes: IDEIAS.md:584 · IDEIAS.md:585 · IDEIAS.md:586 · IDEIAS.md:587 (+1)
### TV

- [ ] **A-150** · Ter três tamanhos de letra na TV **[Theus]**
  - pronto quando: A configuração da Estação do Theus troca a TV entre três tamanhos de letra, e a TV muda na hora.
  - fontes: CHECKLIST.md:181 · memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md:14
- [ ] **A-151** · Ligar um mini PC à TV e ao microfone
  - pronto quando: Um mini PC ligado à TV roda a janela da TV e o microfone da sala sem depender do Mac do Theus.
  - fontes: CHECKLIST.md:270
### Reunião e sala

- [ ] **A-152** · Ligar a memória da sala com microfone e transcrição local **[Theus]**
  - pronto quando: Com o microfone da sala no Mac do Theus, o whisper.cpp local (pt, Metal, VAD) transcreve num buffer de 5 min só em memória. 'Salvar ideia falada' (na Estação, no celular, no iPad, por atalho ou botão físico) vira texto em Ideias e no acervo, com a hora e quem apertou. Nenhum arquivo de áudio fica em disco. A coluna de 25 traços da TV acende com fala real e o '● sala com memória de 5 min' fica à vista. O anel da ideia salva fecha. A primeira versão não identifica quem falou.
  - fontes: CHECKLIST.md:180 · CHECKLIST.md:186 · CHECKLIST.md:187 · CHECKLIST.md:188 (+8)
- [ ] **A-153** · Cotar e comprar o microfone da sala
  - pronto quando: O Theus aprova o orçamento de um microfone de array ou de teto (não um viva-voz de mesa).
  - fontes: CHECKLIST.md:16
- [ ] **A-154** · Gravar reunião e 'Começar a gravar', com transcrição na ata **[Theus]**
  - pronto quando: 'Começar a gravar' junta os 5 min anteriores (até 10 min, segurando o botão) com o que vem depois, até 'Parar', com a hora real de início. A transcrição entra na ata da reunião.
  - fontes: CHECKLIST.md:189 · CHECKLIST.md:193 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:92
- [ ] **A-155** · Ativar a sala por voz ('Babel, guarda isso') **[Theus]**
  - pronto quando: Dizer 'Babel, guarda isso' ou 'Babel, começa a gravar' dispara a ação, com detecção local (openWakeWord).
  - fontes: CHECKLIST.md:190
- [ ] **A-156** · Gravar ideia falada individual de até 1 min **[Theus]**
  - pronto quando: No computador, no celular e no iPad, segurar o botão grava até 1 min, que vira ideia escrita no acervo sem deixar áudio em disco.
  - fontes: CHECKLIST.md:192
- [ ] **A-157** · Pausar a sala em 'conversa particular' **[Theus]**
  - pronto quando: Um botão pausa a memória da sala em qualquer tela, e a TV mostra a pausa. Nunca grava conversa de RH nem conversa individual.
  - fontes: CHECKLIST.md:195
- [ ] **A-158** · Saber quem falou na sala
  - pronto quando: Cada computador grava o próprio microfone e alinha pelo relógio, e a transcrição marca quem falou.
  - fontes: CHECKLIST.md:269
- [ ] **A-159** · Falar com uma pessoa ou com o projeto por voz (WebRTC)
  - pronto quando: 'Falar com' abre uma chamada de voz, sem vídeo, com uma pessoa ou com o projeto na rede local. O botão Falar fica no pé de cada cartão da parede, e não só no cartão ampliado.
  - fontes: CHECKLIST.md:148 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:124 · memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md:14
- [ ] **A-160** · Alinhar o motor da transcrição: ditado do sistema primeiro ou whisper.cpp **[Theus]**
  - pronto quando: O CHECKLIST §8 e o IDEIAS §8.7 (whisper.cpp stream) passam a dizer o mesmo que o IDEIAS §15: começar pelo ditado do Mac (SFSpeechRecognizer pt-BR no aparelho) ou pelo Vosk, e trocar pelo whisper.cpp quando a qualidade pedir. Ou o Theus escolhe outro caminho. O item 'Ligar a memória da sala' segue essa ordem.
  - fontes: IDEIAS.md:788 · IDEIAS.md:541 · CHECKLIST.md:187
- [ ] **A-161** · Sugerir a ideia só quando a frase persiste **[Theus]** _(em parte)_
  - pronto quando: Com fala real, a TV só mostra 'parece que saiu uma ideia: salvar?' (por 30 s) quando a frase persiste por 2 janelas de 12 s.
  - fontes: CHECKLIST.md:191 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:157
### WhatsApp e Loja

- [ ] **A-162** · Parear o WhatsApp real dentro do app **[Theus]**
  - pronto quando: A tela WhatsApp abre o WhatsApp Web num webview com sessão separada. O QR é lido uma vez e a sessão continua ao reabrir o app. Só a própria pessoa vê: nada vai para o acervo, a TV ou a equipe.
  - fontes: CHECKLIST.md:122 · CHECKLIST.md:123 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:12 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:77 (+2)
- [ ] **A-163** · Dar ao agente a ferramenta whatsapp ('sugere e eu mando') **[Theus]**
  - pronto quando: O agente lê as conversas abertas pela ferramenta whatsapp do coop. No modo padrão, a sugestão aparece no campo e a pessoa manda com Enter. O modo automático liga à mão, por contato, com aviso do risco de bloqueio. Uma mensagem de teste recebe sugestão em menos de 10 s.
  - fontes: CHECKLIST.md:78 · CHECKLIST.md:124 · CHECKLIST.md:125 · CHECKLIST.md:126 (+3)
- [ ] **A-164** · Fazer a Loja ler as pastas Loja/ e instalar de verdade no Claude Code **[Theus]** _(em parte)_
  - pronto quando: A tela Loja lista o que está nas pastas Loja/ de todos, com nome, dono e descrição. Instalar grava a skill, o MCP ou o plugin na configuração do Claude Code da pessoa, sem ela abrir terminal: a skill do Bruno aparece no claude da Carla. 'Versão nova' atualiza com um clique. O coop ganha a ferramenta loja.
  - fontes: CHECKLIST.md:78 · CHECKLIST.md:162 · CHECKLIST.md:163 · CHECKLIST.md:164 (+5)
### Celular e iPad

- [ ] **A-165** · Instalar o iPad como app com HTTPS e salvar o .quadro na pasta **[Theus]**
  - pronto quando: Com HTTPS na rede local (Caddy com desafio DNS), o PWA instala no iPad. A cada traço, o .quadro é salvo na pasta Quadros da pessoa: aparece na árvore de todos, abre na Estação e entra no acervo. O socket reconecta sozinho quando o app volta do segundo plano.
  - fontes: CHECKLIST.md:200 · CHECKLIST.md:204 · CHECKLIST.md:205 · CHECKLIST.md:206 (+1)
- [ ] **A-166** · Mandar notificações ao celular
  - pronto quando: Com HTTPS, o celular recebe notificação de OK, demanda e menção mesmo com o navegador em segundo plano.
  - fontes: CHECKLIST.md:250 · memoria/relatorios/2026-09-24-auditoria-planos-contra-o-app.md:14 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:155
### Design e acabamento

- [ ] **A-167** · Aplicar a identidade de cada equipe cliente e vender 'salas com a sua marca'
  - pronto quando: O logo e as cores de uma equipe cliente aparecem no b, na TV e no chão, e a Loja oferece 'salas com a sua marca'.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:11 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:25
## Onda 4 · nuvem (subir para o Supabase, com as credenciais do Theus)

### WhatsApp e Loja

- [ ] **A-168** · Usar o WhatsApp Business pela API oficial
  - pronto quando: Uma conta Business ligada pela API oficial manda e recebe mensagens pelo babel-coop.
  - fontes: CHECKLIST.md:268
### Nuvem (depois)

- [ ] **A-169** · Decidir com o Theus como ligar a Máquina ao Supabase 'Networking Reino' **[Theus]**
  - pronto quando: O Theus decide o acesso (MCP, CLI ou chave) e onde a credencial fica guardada. MAQUINA.md e CHECKLIST §11b passam a dizer 'banco local primeiro, Supabase depois'.
  - fontes: .deus/terminal-ao-vivo/CAPSULA.json:1 · .deus/terminal-ao-vivo/RODADAS.md:38 · .deus/maquina-jogo/MISSAO.md:9 · .deus/maquina-jogo/MISSAO.md:31 (+1)
- [ ] **A-170** · Subir para a nuvem pelo terminal com o efeito de 'ambiente seguro' **[Theus]**
  - pronto quando: 'Subir para a nuvem' pede as credenciais no terminal, nunca em arquivo. Aplica as migrações no Supabase (db push) e publica (vercel deploy), mostrando antes o 'O que muda' em português, o antes e depois em cores e pedindo confirmação escrita; só quem pode consegue. A Máquina mostra as peças indo para a nuvem e virando ambiente seguro.
  - fontes: .deus/maquina-jogo/MISSAO.md:5 · memoria/memorias/2026-09-25-maquina-como-jogo-de-montar.md:13 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:172 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:269 (+3)
- [ ] **A-171** · Fazer o 'xerox do banco' da nuvem para a pasta **[Theus]**
  - pronto quando: Pedir ao agente 'faz um xerox do banco' puxa o esquema e os dados do Supabase para o banco local do projeto, e todas as peças 3D aparecem na Máquina, uma depois da outra.
  - fontes: .deus/maquina-jogo/MISSAO.md:5 · memoria/memorias/2026-09-25-maquina-como-jogo-de-montar.md:13 · memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:270
- [ ] **A-172** · Decidir os presets de Tela da Supabase UI Library
  - pronto quando: O Theus diz se Realtime Cursor, Avatar Stack, Chat, Dropzone e Auth entram, sabendo que dependem da nuvem. Se entrarem, viram presets de Tela.
  - fontes: memoria/relatorios/2026-09-25-plano-2030-contra-o-codigo.md:66
- [ ] **A-173** · Abrir o acesso de fora do escritório
  - pronto quando: Com um ponto de encontro numa VPS, a mesma Estação é vista e os terminais são controlados de fora da rede local. Nada no código depende do IP local.
  - fontes: CHECKLIST.md:41 · CHECKLIST.md:266

## A conferir (o crítico acha que já está feito)

- [ ] **A-174** · Entrar na equipe pela rede com código de 4 dígitos — prova apontada: Prova de que o código está pronto: RODADAS 25/09 06:57 registra 'entrada-facil-e-vibe concluído' (compromisso e revelação, código de 4 dígitos à prova de adivinhação, token cifrado, anúncio forjado não troca a gestão, nome repetido dá 409; entrada 12/12). app/servidor/entrada.js:1-15 tem o fluxo /api/entrar/pedido, ponte.js:200 mostra o código e ponte.js:279 mostra o cartão 'Aceite só se a tela mostra o mesmo código'. Falta só a prova em dois computadores reais, que já é o item 'Testar a equipe em dois computadores reais'. Este item pode passar a feito no código.
- [ ] **A-175** · Deixar o modo Vibe bonito e legível em todas as telas — prova apontada: Prova: RODADAS 25/09 06:57 registra o Vibe em todas as telas fora a Máquina (xterm claro, cores de pessoa, quadro legível; vibe 7/7). maquina-jogo RODADAS 07:01 registra a Máquina 2D e 3D no Vibe (maquina-vibe 5/5; maquina-real + banco-real 12/12). Falta só o Theus aprovar os prints de Tech e Vibe lado a lado.

## Feito (log)

- [x] **A-176** · Entrar na equipe pela rede com código de 4 dígitos
  - log 2026-09-25 · entrada pelo Wi-Fi com código de 4 dígitos (compromisso e revelação), token cifrado, plano B por token · entrada.test 12/12
- [x] **A-177** · Servir o instalador pela rede local
  - log 2026-09-25 · página /instalar serve o .dmg pelo Wi-Fi (http://192.168.1.116:4711/instalar), link com Copiar na tela Convidar · instalador.test ok; .dmg de 137 MB baixado pelo IP
- [x] **A-178** · Funcionar sem internet, com fontes e bibliotecas servidas pela Estação
  - log 2026-09-25 · fontes e bibliotecas servidas em /vendor; nada busca a internet · sem-internet.test 7/7
- [x] **A-179** · Dar ao agente coop_abrir, coop_fechar, coop_onde e coop_tela
  - log 2026-09-25 · coop_abrir, coop_fechar, coop_onde, coop_tela · coop-telas 8/8
- [x] **A-180** · Deixar o modo Vibe bonito e legível em todas as telas
  - log 2026-09-25 · modo Vibe em todas as telas e na Máquina (2D e 3D), Tech igual · vibe.test 7/7, maquina-vibe 5/5
- [x] **A-181** · Máquina com banco de verdade (Postgres local), peças 3D nascendo pelas ações do agente
  - log 2026-09-25 · coop_banco_sql/consulta/estado, worker com limite de 30 s, efeitos nascer/fio/cadeado/dados/erro · banco 28/28, banco-real 8/8
- [x] **A-182** · Arquivo nascendo com efeitos de jogo e botões Apagar/Editar
  - log 2026-09-25 · faíscas, micro-explosões +1, combo com pontos reais; lixeira com Desfazer · meio 11/11, arquivos 15/15
- [x] **A-183** · Instalar tudo no Mac do Theus
  - log 2026-09-25 · empacotado e instalado em /Applications 07:18; servidor 158/159, e2e 149/151 (1 pulado, 1 instável conhecido: painel 12/12 sozinho), roteiro 109/109, pacote 5/5, instalar 7/7
- [x] **A-181** · Corrigir nos planos as contradições já decididas pelas falas do Theus (16 temas)
  - log 2026-09-25 · brilhos/poderes presos a evento, som ligado com botão, degradê só no terminal, Tech/Vibe, borda roxa, banco local antes da nuvem, sem cronograma, sem carimbo, meio liso, Criar e 12 atividades, TV sem botão, arquivo nasce no meio, Máquina 3D, presença com terminal, entrada com código, script Node · conferido por um segundo agente; sobras nas páginas antigas (painel.html, visao.html) marcadas como superadas
