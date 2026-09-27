# Babel Coop — checklist de construção

> Lista do que precisa existir, para conferir na entrega de cada fatia.
> Criado em 23/09/2026 · Theus + Claude · fonte: `IDEIAS.md` v0.4 (fase de projeto fechada) e `UX.md`
>
> Marque `[x]` só depois de testar de verdade, com a evidência anotada na frente.
> Legenda: **[Theus]** = pedido dele · **[definido]** = decidido por inferência, muda se ele discordar

---

## 0. Antes de começar

- [ ] Combinado escrito com a equipe: o que é visto (pastas, terminais, sala com memória de 5 min), para quê, quem vê e como pausar. Assinado por todos.
- [ ] Papel "gestão" definido pelo Theus (quem entra em terminal sem pedir, cria meta e campanha).
- [ ] node-pty compilado contra a versão do Electron no Mac e no Windows. Evidência: `claude` roda dentro do terminal nos dois.
- [ ] Microfone de sala cotado (array ou teto, não viva-voz de mesa).

## 1. Esqueleto

**Estação (Electron, Mac e Windows)**
- [ ] Instalador .dmg e .exe, assinados. Evidência: instalar limpo nos dois e abrir sem aviso de segurança.
- [ ] Auto-update nos dois sistemas (Electron: electron-updater; a interface atualiza pela Oficina, abaixo).
- [ ] Oficina do app [Theus]: quem a gestão liberar muda o Babel Coop pelo terminal (o agente edita a pasta Oficina/app da pessoa e roda os testes); a mudança fica aguardando; a gestão publica; todo mundo vê "⬆ Atualizar vN" e, ao clicar, a Estação baixa os arquivos da Estação de quem publicou, confere os hashes e recarrega. Evidência: publicar numa máquina e a outra atualizar sozinha. (protótipo v17 faz o fluxo inteiro simulado; código real em `app/servidor/atualizacao.js`, não executado)
- [ ] Cara de VS Code: barra de atividades, Criar (com a árvore de arquivos) à esquerda, editor no meio, terminal à direita [Theus].
- [ ] Laterais recolhem (Ctrl+B e Ctrl+`) e as bordas arrastam.
- [ ] Terminal de verdade (xterm.js + node-pty): zsh/bash no Mac, PowerShell no Windows.
- [x] Mais de um terminal aberto ao mesmo tempo, em abas [Theus]. ✅ Evidência: e2e painel.test.js A2: duas abas com PIDs diferentes vivos ao mesmo tempo.
- [x] Visual do Babel Terminal: fundo `#060b16`, degradê roxo → azul → ciano, logo "b" em neon (liga e desliga). ✅ Evidência: e2e painel.test.js A3: fundo #060b16 computado, degradê no texto, b neon liga e desliga.
- [x] Terminal abre por padrão dentro da pasta compartilhada. ✅ Evidência: e2e painel.test.js A4: pwd = <raiz>/<id>.
- [ ] Paleta de comandos Ctrl+K com arquivos, comandos e acervo.

**Cada computador é um servidor [Theus]**
- [ ] Servidor Node + SQLite embutido na Estação, sobe junto com o app.
- [ ] As Estações se acham na rede local (mDNS/Bonjour). Evidência: duas máquinas se veem sem digitar IP.
- [ ] A pasta compartilhada de cada pessoa aparece na árvore de todos (nome, tamanho, data, tipo).
- [ ] Abrir arquivo de outra pessoa pede direto à Estação dela. Computador desligado = ficha pontilhada.
- [ ] A Estação nunca aceita caminho fora da pasta compartilhada (`../`).
- [ ] Ignorados: `.DS_Store`, `Thumbs.db`, `~$*`, `.env`, `.pem`, `.ssh`, `credentials*`, `node_modules`, `.git`.
- [ ] Diário de eventos: cada Estação guarda os próprios eventos numerados e replica os dos outros. Evidência: criar demanda com a máquina B desligada; ligar B; a demanda aparece em B.
- [ ] Toda ação é autorizada no servidor de quem executa, nunca só na tela.
- [ ] Nada preso ao IP local, para abrir para fora depois.

**Login**
- [ ] Entrada sem cadastro [Theus]: na rede local a pessoa instala o app, acha a equipe, confere o código de 4 dígitos e a gestão aceita; ela vê a equipe e a equipe vê ela. Plano B: a gestão gera o token na Estação (Equipe → Convidar pessoa) e a pessoa cola. Quem não tem o aceite nem o segredo da equipe não entra na rede. Evidência: segunda máquina entra pela rede local (e pelo token) e as duas se veem. (revisto em 25/09/2026: antes só o token; a entrada pela rede local foi feita em 25/09 — marcar `[x]` com a evidência anotada; token em `app/servidor/token.js` e `app/ponte.js`)
- [ ] Nome + PIN depois da entrada (rede local ou token), sessão longa, limite de tentativas. Mesmo login no celular e no iPad.
- [ ] A TV não tem login: é uma janela da Estação do Theus.

**Editor**
- [ ] Markdown, código com cores e números de linha, CSV em tabela, PDF, imagem, vídeo local.
- [ ] HTML abre renderizado como site por padrão (iframe com sandbox), alternador "Site | Código", live preview ao salvar [Theus].
- [ ] Editar e salvar com versões; "Voltar como estava". Salvar aparece na hora em todas as Estações.
- [ ] Foto de quem salvou por último no cabeçalho do arquivo e ao lado do nome na árvore [Theus].
- [ ] Dono, gestão e admin editam qualquer arquivo; pastas comuns e README da equipe todo mundo edita.
- [ ] Fechar todas as abas deixa o meio vazio e liso, só com "Nada aberto · Ctrl K" (revisto em 25/09/2026: sem marca d'água — Theus, 23/09, `.deus/missao-design/MISSAO.md:9`: tirar as logos do meio e da lateral); a lateral esquerda continua aberta na última atividade; com o meio vazio, o ícone da barra só troca a lateral e o meio abre só por um item da lateral [Theus].
- [ ] Aviso ao dono quando a gestão corrige o arquivo dele; versão anterior guardada.
- [ ] Status de gravação sempre à vista: "Salvando…", "Salvo", "Conflito".

**TV e celular**
- [ ] Botão "Tela da TV" na Estação do Theus abre a tela numa janela própria, sem nenhum botão dentro [Theus].
- [ ] Espelhar essa janela na TV por HDMI ou AirPlay, em tela cheia.
- [ ] Celular abre no navegador, no Wi-Fi do escritório, com abas embaixo.

## 2. Terminal ao vivo com controle [Theus]

- [x] Parede dos terminais da equipe em tempo real, cada um com nome do agente e foto da pessoa; um clique amplia. ✅ Evidência: e2e parede.test.js com duas Estações (Theus e Rita) + prints em .deus/terminal-ao-vivo/evidencias/parede/.
- [x] Transmissão da saída (mais redimensionamento) por WebSocket. ✅ Evidência: equipe.test.js b) A6: quem assiste recebe a saída e cols/rows do dono.
- [x] Quem tem permissão digita no terminal ampliado e as teclas chegam na sessão do dono. Evidência: comando digitado pelo Theus roda na tela do outro. ✅ Evidência: equipe.test.js c) A7 + parede.test.js: o comando do Theus roda na sessão da Rita.
- [x] Theus e gestão entram direto; membros do mesmo projeto entram direto; os outros pedem e o dono aceita com um clique. ✅ Evidência: equipe.test.js d) A8: matriz de permissões no servidor do dono, sem permissão recusado.
- [x] Selo "Theus está no seu terminal Rita" na tela do dono; o dono encerra quando quiser. ✅ Evidência: equipe.test.js e) A9 + print a9-selo-na-rita.png: após encerrar, as teclas são recusadas.
- [x] Pausar a transmissão de um terminal (ex.: enquanto digita senha). ✅ Evidência: equipe.test.js f) A10: o marcador não chega a quem assiste, nem depois.
- [x] Nada é gravado nesta fase. ✅ Evidência: equipe.test.js g) A11: o marcador não existe em disco e nenhum shell ficou vivo.
- [x] Latência aceitável na rede local: digitar e ver em menos de 100 ms. ✅ Evidência: equipe.test.js i) A12: 200 teclas, p50 2,55 ms · p95 3,46 ms · máx 4,31 ms (23/09/2026, duas Estações na mesma máquina).

## 3. Agentes com nome humano [Theus]

- [ ] Cada terminal é um agente com nome, foto e instruções próprias; a pessoa cria, renomeia e apaga os seus.
- [ ] Um agente é uma sessão de Claude Code (ou outra IA) com a conta da pessoa.
- [ ] Conector `coop`/MCP com todas as ações do app: buscar, ler, aprendi, aprendizados, demandas, campanha, meta, aviso, projetar, tv, pessoas, projetos, whatsapp, loja.
- [x] Evidência: no terminal, "cria uma campanha de 50 clientes para a Carla até 30/09" cria a campanha de verdade, e ela aparece na TV. ✅ Evidência: e2e coop-ui.test.js (24/09): coop_campanha cria "50 clientes" para a Carla até 30/09 e a TV mostra; o pedido em linguagem natural ao claude real foi provado em 23/09 (evidencias/integracao, haiku).
- [ ] Menção de pessoa: ao digitar um nome da equipe no terminal, o nome fica marcado e aparece a foto.
- [ ] `coop tv painel | reuniao | site <url> | visita` e `coop projetar <arquivo>` trocam a TV.
- [ ] Toda ação de agente fica assinada com o nome do agente e da pessoa dona; "Voltar como estava" desfaz.
- [ ] Ações que apagam ou encerram algo de outra pessoa pedem confirmação no terminal.
- [ ] Cada pasta tem um CLAUDE.md que manda o agente consultar o acervo e ler os aprendizados.
- [ ] Receitas em cima do terminal para quem está começando.
- [x] Navegador do agente [Theus]: aba "Navegador · <agente>" com `<webview>` próprio; as ferramentas de navegar, clicar, digitar, ler página, raio-x, clonar e print são do nosso conector `coop` (MCP nativo, sobre webContents/CDP do Electron), sem Playwright; o agente navega, clica e preenche e a pessoa vê cada passo; "Assumir" e "Devolver"; senhas só a pessoa digita. Evidência: "Rita, entra no site X e preenche o cadastro" acontece na aba, à vista. ✅ Evidência: e2e navegador.test.js (webview + CDP, sem Playwright nem Chrome: abrir, clicar, digitar, senha recusada, assumir/devolver) e navegador-ui.test.js (aba "Navegador · <agente>", passos à vista, Assumir/Devolver), 24/09; pedido real ao claude "preenche o cadastro" em 23/09 (evidencias/integracao 08–09c).
- [x] Raio-X do site [Theus]: painel ao lado da página com HTML (DOM vivo, busca, copiar bloco), CSS (estilos do elemento, fontes, cores), Copy (textos em ordem, exportar Markdown), Rede (pedidos e respostas) e Console; "Selecionar elemento". ✅ Evidência: e2e navegador-ui.test.js: HTML (DOM vivo, busca, copiar bloco), CSS (regras pelo CDP, fontes, cores), Copy (exportar Markdown), Rede, Console e Selecionar elemento.
- [x] Clonar página [Theus]: salva HTML, CSS, imagens e fontes em `Clones/<site>/` da pessoa e abre como site editável na Estação. Evidência: clonar uma landing e abrir a cópia funcionando. ✅ Evidência: e2e navegador-ui.test.js e navegador.test.js: Clones/<site>/ com CSS, imagem e fonte abre sozinho, sem o site no ar.
- [x] Clonar copy [Theus]: gera `copy.md` com os textos por seção. Print inteiro da página. ✅ Evidência: e2e navegador-ui.test.js: copy.md por seção e print da página inteira mais alta que a janela.
- [ ] O agente faz tudo isso por pedido ("clona a landing do concorrente e me traz a copy").
- [ ] Os agentes de cada pessoa aparecem na parede de terminais e na Equipe.

**Perfil como tela inteira [Theus]**
- [ ] Clicar no meu perfil ou no nome de qualquer pessoa abre uma aba no meio, nunca uma janela por cima.
- [ ] Trabalhos feitos: demandas com OK, tarefas, ajudas dadas, ideias, aprendizados, skills publicadas, quadros e mapas; filtro por mês.
- [ ] Tempo: horas em demandas, média por demanda, pausas, horários de foco.
- [ ] Dados e materiais da pessoa, com o que mais foi aberto pelos outros.
- [ ] Fatia da pessoa no Babel Coop: % do acervo, das demandas do mês, dos projetos e das ajudas, com barras por tipo.
- [ ] Gamificação pessoal: nível, selos, sequência de dias, próxima conquista. Sem ranking entre pessoas e sem placar na TV.
- [ ] Linha do tempo dos últimos dias e os agentes da pessoa.

## 4. Chat, demandas e WhatsApp

**Chat**
- [ ] Visual e gestos do WhatsApp com a cara da Babel: lista, balões, ✓✓, citar, reações, foto, arquivo, áudio, "digitando…".
- [ ] #geral, canais livres, canal por projeto, conversas diretas, menções.
- [ ] Mensagem vira tarefa; mensagem marcada "guardar no acervo" entra no acervo (as outras não).
- [ ] Silêncio fora do expediente, com resumo.

**Demandas com cronômetro [Theus]**
- [ ] Quem recebe só pausa; quem pediu dá o OK e encerra.
- [ ] Cronômetro da demanda arrastável para qualquer lugar da tela, posição lembrada; minimiza, não fecha [Theus].
- [ ] Cronômetro persegue a pessoa [Theus]: "⧉ destacar" abre uma janela do Electron sem moldura, sempre por cima, em todas as mesas e por cima de tela cheia (`main.js` · `setVisibleOnAllWorkspaces`); no navegador, Document Picture-in-Picture. Evidência: minimizar a Estação e o cronômetro continuar à vista; trocar de mesa e ele seguir. (protótipo v18 faz no Chrome)
- [ ] Sai da pausa sozinho [Theus]: peças mexidas enquanto a demanda rodava ficam lembradas; pausou, saiu, voltou e mexeu numa delas (ou na demanda, ou num arquivo citado nela) → retoma, avisa e registra no histórico; 45 s de graça depois de pausar. Evidência: protótipo v18 (quatro casos testados); no app, as peças também incluem o terminal real e a pasta do projeto.
- [ ] Tarefas livres: pega quem puder. Aparecem no Meu dia, em Demandas, na TV e em `coop livres`.
- [ ] Aprendizado obrigatório para concluir; repetido soma +1 em vez de entrar de novo.
- [ ] Pausa automática fora do expediente, com horário por área.
- [ ] Botões "Pedir ajuda", "Estou travado" e "Levar para a reunião".
- [ ] Eventos aparecem na TV.

**WhatsApp [Theus]**
- [ ] Tela WhatsApp na Estação: WhatsApp Web em `<webview>` com sessão separada; QR code uma vez; sessão persiste.
- [ ] Só a própria pessoa vê. Não entra no acervo, nem na TV, nem para a equipe.
- [ ] O agente lê as conversas abertas pela ferramenta `whatsapp` do `coop`.
- [ ] Modo "sugere e eu mando" (padrão): a resposta aparece no campo, a pessoa aperta Enter ou corrige.
- [ ] Modo "automático" por contato, ligado à mão, com aviso do risco de bloqueio.
- [ ] Evidência: chega mensagem de teste, o agente sugere resposta em menos de 10 s.

## 5. Projetos e ajuda par a par [definido]

**Projetos**
- [ ] Criar projeto: nome, membros, pasta de cada membro dedicada a ele.
- [ ] Tela do projeto: árvore com as pastas de todos os membros, canal, demandas, quadro, agentes trabalhando nele.
- [ ] Criar (antes Explorador; revisto em 25/09/2026, CHECK_DO_THEUS.md §9) com dois modos [Theus]: "Sozinho · minha pasta" e um por projeto. Em projeto, só as pastas do projeto, agrupadas por membro com nome e foto, a minha primeiro.
- [ ] Faixa "N pessoas com você agora" e, ao lado de cada membro, o que a pessoa está fazendo (só para quem aceitou aparecer).
- [ ] Quem está vendo o meu arquivo aparece como foto pequena ao lado dele.
- [ ] Arrastar arquivo para o nome de um membro copia para a pasta de projeto dele com o selo "recebido de X"; ele recebe aviso na hora. Evidência: arrastar em uma máquina e ver aparecer na outra.
- [ ] Conversa no projeto com chips "com todos" e "com <pessoa>"; mensagem pode apontar para um arquivo do projeto.
- [ ] Editar ao vivo o arquivo de outro membro, pela Estação do dono, com dois cursores (Yjs). Evidência: duas pessoas digitando no mesmo arquivo sem perder texto.
- [ ] Membros entram nos terminais uns dos outros sem pedir.
- [ ] Membro desligado: parte dele pontilhada, o resto segue.
- [ ] Projeto de código (Babel OS) [Theus]: repositório git na pasta de projeto; branch, mudanças e histórico na Estação; `.env` fora da pasta compartilhada; chaves no cofre de cada um com "Pedir ao Theus"; agente roda com as chaves injetadas; MCPs do Supabase e da Vercel pela Loja.
- [ ] Evolução do projeto na zona que gira da TV.

**Ajuda par a par**
- [ ] "Chamar para a minha tela": convite; quem aceita cai no mesmo arquivo ou terminal.
- [ ] "O que cada um está fazendo agora" na Equipe e no Meu dia, só para quem aceitou aparecer.
- [ ] "Falar com": voz um a um ou com o projeto, WebRTC na rede local, sem vídeo.
- [ ] "Pedir ajuda a quem sabe": manda o arquivo como demanda para quem a pessoa escolher.

## 6. Acervo, aprendizados e Loja da equipe

**Acervo**
- [ ] SQLite FTS5 com `unicode61 remove_diacritics`.
- [ ] Vetores locais (sqlite-vec + modelo pequeno de embeddings, sem LLM).
- [ ] Indexa o que cada Estação serve: texto, notas, mapas, quadros, PDF (texto extraído), atas, demandas, aprendizados, ideias faladas, respostas da pergunta da semana.
- [ ] Reindexa quando algo muda; ficha continua quando o dono está desligado.
- [ ] `APRENDIZADOS.md` da equipe gerado e lido pelos agentes ao começar; checagem de repetido e novo com limiar.
- [ ] Busca por palavras e por semelhança na Estação e em `coop buscar`.

**Loja da equipe [definido]**
- [ ] Pasta `Loja/` na pasta compartilhada de cada pessoa, com skills, MCPs, plugins, hooks, CLAUDE.md e agentes.
- [ ] Tela Loja da equipe: tudo o que está nas `Loja/` de todos, com nome, dono, descrição e botão Instalar.
- [ ] Instalar escreve na configuração do Claude Code da pessoa sem ela abrir terminal. Evidência: instalar uma skill do Bruno e ela aparecer no `claude` da Carla.
- [ ] "Versão nova" quando o dono muda; atualizar com um clique.
- [ ] Chaves de API nunca na pasta compartilhada: ficam no Keychain (Mac) ou Credential Manager (Windows). A Loja só avisa "precisa da chave X".
- [ ] Publicação de skill entra na evolução da semana na TV.

## 7. TV completa, sem botão [Theus]

- [ ] Nenhum botão, menu ou campo na tela da TV. Tudo trocado pela Estação, pelo celular e por `coop tv`.
- [ ] Modos: painel, reunião, quadro ao vivo, projeção, site, visita.
- [ ] Painel com zona que gira: avisos e mural, evolução da semana, pergunta da semana, sonho, tarefas livres, ideias, evolução dos projetos.
- [ ] "Cuidando da gente": avisa a pessoa primeiro; sem resposta em 10 min, vai para a TV como convite.
- [ ] Reunião com a mesa: "Levar para a reunião" de qualquer material; material em destaque; decisões e próximos passos; ata ao encerrar.
- [ ] Projeção com o conteúdo real (PDF, imagem, vídeo, documento) vindo da Estação do dono; quem projetou controla da Estação, inclusive rolando o arquivo para baixo [Theus].
- [ ] Indicador de projeção: só uma luz de borda roxa na identidade da Babel, sem aro âmbar [Theus].
- [ ] Site em tela cheia por `coop tv site <url>`.
- [ ] Modo visita; comemoração em meta ou campanha 100%.
- [ ] Luz "● sala com memória de 5 min" sempre à vista quando a memória da sala está ligada.
- [ ] Três tamanhos de letra na configuração da Estação do Theus.
- [ ] Relógio e cronômetros vindos do diário, não do relógio da TV.

## 8. Memória da sala [Theus]

- [ ] Microfone de sala ligado ao Mac do Theus; buffer circular de 5 minutos em memória, sem disco.
- [ ] whisper.cpp `stream` local (Metal, `-l pt`) transcrevendo sempre; Silero VAD parando no silêncio.
- [ ] Botão "Salvar ideia falada" na Estação, no celular, no iPad, em atalho de teclado e em botão físico: os últimos 5 min viram texto em Ideias e no acervo, com hora e quem apertou; a frase mais parecida com ideia vira título.
- [ ] Botão "Começar a gravar": junta os 5 min anteriores (até 10, segurando) com o que vem depois, transcreve até "Parar"; hora de início real.
- [ ] Palavra de ativação local "Babel, guarda isso" e "Babel, começa a gravar" (openWakeWord).
- [ ] A sala sugere: frase com cara de ideia faz a TV mostrar "parece que saiu uma ideia: salvar?" por 30 s.
- [ ] Ideia falada individual de até 1 min no computador, celular e iPad.
- [ ] Gravar reunião = botão 2 com nome; transcrição entra na ata.
- [ ] Áudio apagado assim que vira texto. Evidência: nenhum arquivo de áudio em disco depois de salvar.
- [ ] Pausa "conversa particular" em todo lugar; nunca em conversa de RH ou individual.
- [ ] Primeira versão sem saber quem falou.

## 9. iPad: app à parte com quadro de borda infinita [Theus]

- [ ] App instalado só no iPad (PWA primeiro; nativo se o Safari atrapalhar).
- [ ] Borda infinita: arrasta e dá zoom em qualquer direção.
- [ ] Caneta com pressão (Apple Pencil), marca-texto, borracha, post-it, texto.
- [ ] Risca no iPad, risca na TV na hora. Evidência: traço aparece na TV em menos de 200 ms.
- [ ] Socket reconecta sozinho ao voltar de segundo plano.
- [ ] Salvar no iPad é salvar no Babel Coop [Theus]: o `.quadro` vai para a pasta Quadros da pessoa, aparece na árvore de todos na hora, abre na Estação e entra no acervo. Salva sozinho a cada traço.
- [ ] HTTPS na rede local (Caddy com desafio DNS), sem o qual o PWA não instala.

## 10. Sonho noturno

- [ ] Trabalho agendado de madrugada no Mac do Theus.
- [ ] Resumo do dia por contas e regras: o que se repetiu, o que surpreendeu, top 3 de prompts.
- [ ] Atualiza o `APRENDIZADOS.md`.
- [ ] Exportação em JSONL por dia (eventos, aprendizados, ideias, transcrições) mais o SQLite do acervo, com API local, para a IA do Theus.

## 11a-0. Criar e o modo 3D da tela [Theus]

- [ ] A atividade Explorador chama-se **Criar**; a Máquina vive dentro dela, não como atividade à parte.
- [ ] Em Criar: Tela (site), Máquina (backend), Pesquisa (MD/TXT/PDF). A tela do meio vira a forma certa conforme o que se cria.
- [ ] Tela HTML com o alternador Site | Código | 3D [Theus].
- [ ] Modo 3D: a página como painel plano num ambiente 3D; os próximos itens ligados a ela ao lado e atrás (outras telas como painéis, peças do backend como placas simples); nada de caixa de edição nas peças; só as telas são interativas.
- [ ] Enter na tela manda o pulso pelo fio: verde libera e segue (Portaria, gavetas, próxima tela), vermelho barra. Evidência: login com senha errada fica vermelho na Portaria.
- [ ] O agente cria a próxima tela ligada a esta pelo terminal; no app, os próximos itens vêm do código, do banco local do projeto (Postgres local, PGlite) e das telas do site; o Supabase do projeto do cliente/equipe entra depois, com o ok e as credenciais do Theus (revisto em 25/09/2026).

## 11a. A Bancada: a tela do meio como super Lovable [Theus]

- [ ] A aba mostra a forma certa sozinha: visual (site, imagem), Máquina (backend), leitura (md, pdf, planilha), mapa, quadro; troca conforme o agente cria.
- [~] Editar no visual muda o código: mover, redimensionar, trocar texto, cor e imagem na prévia; mapeamento elemento → arquivo:linha por transformação nossa; o que não mapeia vira pedido ao agente com o elemento selecionado. Evidência: trocar um título na prévia e ver o arquivo mudar. (protótipo v16 já faz mover, texto, duplicar e apagar por serialização do DOM; o app troca pelo mapeamento arquivo:linha)
- [ ] Régua de versões em toda aba, com foto de quem salvou, "Voltar como estava" e comparar lado a lado.
- [ ] "Ver por pessoa": cor de quem criou ou mexeu por último em volta de blocos do site, peças da Máquina, trechos de texto e galhos do mapa.
- [ ] "Projetar na TV" em qualquer aba da Bancada, ao vivo enquanto o agente constrói, inclusive Máquina e site em construção.
- [ ] Terminal com o computador inteiro: shell real com as permissões da pessoa; só a pasta compartilhada é visível à equipe.

## 11b. A Máquina: backend visual [Theus] (desenho em `docs/MAQUINA.md`)

- [ ] Fatia 1, ler e desenhar: lê o repositório e o banco local do projeto (Postgres local, PGlite, feito em 25/09); depois, com o ok e as credenciais do Theus, o Supabase do projeto do cliente/equipe (a nuvem é a onda seguinte; rede local primeiro) (revisto em 25/09/2026: era "o Supabase (local, branch ou projeto)"); desenha gavetas, campos, fios, chaves, empresa, portas, robôs, depósitos, cofre, telas e canos, com o dicionário de português; clicar abre a ficha da peça com "onde fica guardado". Evidência: abrir o Babel OS e reconhecer todas as tabelas e políticas.
- [ ] Fatia 2, montar sozinha: observa migrações e código; redesenha com animação de encaixe a cada mudança do agente; peças em construção tracejadas; linha do tempo com o nome do agente.
- [ ] Fatia 3, testar: formulário por porta, "como quem" (uma pessoa por empresa de exemplo), animação do pedido pela máquina, linhas entrando nas gavetas ao vivo (Realtime), cadeado barrando a outra empresa, "encher de exemplo". Nunca em produção.
- [ ] Fatia 4, montar arrastando: gaveta na moldura Empresa, fio entre gavetas, cadeado com as quatro opções, robô com "quando"; tudo vira código pelo agente com cartão e desfazer.
- [ ] Fatia 5, dividir em peças: "Pedir para o Davi" vira demanda ligada à peça; foto na peça; cofre com chaves faltando e "Pedir ao Theus".
- [ ] Fatia 6, publicar: "O que muda" em português com "ver SQL"; antes e depois em cores; confirmação escrita; só quem pode.
- [ ] Alertas na peça: gaveta aberta para todos, ligação sem índice, porta sem login, chave faltando no cofre.
- [ ] Presets [Theus]: construiu e o teste passou → "Salvar como preset" (peças e fios, ou a tela); lista da equipe na Máquina e em Criar; "Usar em <projeto>" monta; telas viram preset pelo editor; "usa o preset X" no terminal. O babel-coop não guarda os próprios dados no Supabase (pasta compartilhada e diário); a Máquina monta primeiro o banco local do projeto (PGlite) e, com o ok e as credenciais do Theus, sobe para o Supabase do projeto do cliente/equipe (revisto em 25/09/2026: era "sem Supabase: a Máquina lê o servidor do projeto"). Evidência: protótipo v21, roteiro B.
- [ ] Traduções desconhecidas gravadas no banco como comentário, para a verdade carregar a frase.

## 11. Tarefas com fluxo, metas, mapa, celular

- [ ] Tarefas com fluxo: visões lista, quadro, por pessoa e trilha; etapa com cronômetro; OK de quem passou.
- [ ] Metas e campanhas com placar na TV; campanha = meta com prazo, dono e o que conta um ponto.
- [ ] Mapa da equipe.
- [ ] Celular com notificações (exige HTTPS).

**Mapa mental = MindForge [Theus]** (o clone do MindMeister do Theus, copiado para `prototipo/mindforge`; fundo na cor da identidade, o resto igual)
- [x] MindForge dentro da aba; `.mapa` na pasta da pessoa; salva, versiona e espelha na TV em modo apresentação. Evidência: protótipo v16.
- [x] O agente cria e mexe no mapa por conversa: cria, adiciona, expande, renomeia, apaga. Evidência: protótipo v16 (simulado; no app o Claude Code consulta o acervo antes).
- [ ] Tab filho, Enter irmão, duplo clique edita, arrastar move; tela infinita; tema da Babel.
- [ ] O agente expande ou resume um galho, consultando o acervo antes.
- [ ] Galho vira demanda, tarefa, meta ou ideia num clique, e mostra o estado no mapa.
- [ ] Galho aponta para arquivo (arrastar da árvore), pessoa (@nome com foto) ou projeto.
- [ ] Vários membros editando o mesmo mapa ao vivo pela Estação do dono.
- [ ] Modo apresentação na TV, galho a galho; "Levar para a reunião".
- [ ] Texto dos galhos no acervo; `coop buscar` abre o mapa centrado no galho.
- [ ] Versões com "Voltar como estava"; exportar Markdown, PNG e formato do M Master.

## Para depois

- [ ] Acesso de fora do escritório: mesma Estação, ponto de encontro numa VPS, ver e mexer nos terminais de qualquer lugar.
- [ ] Histórico gravado dos terminais (só a saída, nunca a entrada).
- [ ] WhatsApp Business pela API oficial.
- [ ] Saber quem falou na sala (cada computador grava o próprio microfone e alinha pelo relógio).
- [ ] Mini PC para TV e microfone.
- [ ] Linux.

## Do protótipo para o sistema real

Reaproveita: os CSS e a paleta; `util.js`; o modelo de dados de `dados.js`; as regras puras de `loja.js`; o formato de ação `A.x(quem, args) → estado + eventos` de `acoes.js`, que vira evento do diário.

Refaz: o transporte entre janelas (manda o estado inteiro e uma janela apaga a outra); a autorização das ações da TV (`encerrarProjecao`, `visita`, `regra`, `tvModo`, `pararCronometroTv` não checam quem chama); as telas montadas com `innerHTML`; o terminal simulado; a busca por hash do `acervo.js`; o `simulador.js` (descarte).
