# Check do Theus · tudo o que foi pedido nesta conversa, conferido no app

> Montado em 23/09/2026 a partir do histórico inteiro da conversa (22 e 23/09). Cada linha é uma coisa que o Theus disse.
> `[x]` o protótipo faz · `[~]` o protótipo faz simulado ou em parte (o resto é do app real) · `[ ]` só no desenho, entra na construção real
> Conferido no protótipo publicado em https://claude.ai/artifact/KQZbUM13TjEt473zBQr1y4 (versão 14).

## 1. Começo: histórico, telas e auditoria

- [x] Ver o histórico da tarefa, dizer o que foi concluído e o que faltou, abrir as telas para ver, contar tudo o que foi feito.
- [x] Responder em 3 linhas: dá para instalar em Mac e Windows e o terminal ser real como o iTerm? (sim; Electron + node-pty)
- [x] Responder em 3 linhas: dá para ir para a nuvem mantendo instalado, com gente de qualquer lugar vendo os terminais? (sim)
- [x] Auditoria rápida do sistema: tem condições reais de funcionar? (feita, com tabela por peça)
- [x] Segunda auditoria: fácil todo mundo olhar todo mundo e se ajudar; 2+ pessoas num projeto; MCPs, plugins, APIs e skills compartilhados; "quanto podemos operar juntos".

## 2. Terminal e agentes

- [x] Não é gravação: é ver o terminal dos outros **e mexer** nele, porque o Theus é técnico e precisa ajudar. Parede de terminais, Entrar, digitar no terminal do outro, selo "X está no seu terminal", Encerrar, pedir e aceitar.
- [~] Local primeiro, online depois. (protótipo é local por definição; o online está no desenho, fatia "para depois")
- [x] Terminal fica à direita.
- [x] Dá para abrir mais de um terminal.
- [x] Os terminais têm nomes humanos de agentes; cada pessoa cria os seus agentes (botão +, nome, o que faz, foto de letra).
- [x] Os agentes mexem no app inteiro: "cria uma campanha de 50 clientes para a Carla até 30/09" cria de verdade e aparece na TV; demanda, aviso, projetar, site na TV, entrar em terminal.
- [x] Ao escrever o nome de uma pessoa no terminal, seleciona o usuário e aparece a foto dela.
- [x] O terminal mexe no computador inteiro como o iTerm (`cd ~`, `mkdir`), só a pasta compartilhada é visível. (simulado no protótipo, real no Electron)

## 3. Servidor e arquivos

- [x] Cada computador é um servidor; os arquivos de cada um ficam dentro dele. (decisão registrada; protótipo mostra ficha pontilhada quando o dono está desligado)
- [x] Não perguntar mais sobre armazenamento.

## 4. WhatsApp

- [x] O WhatsApp do próprio computador da pessoa numa tela dentro do app (WhatsApp Web, QR code uma vez).
- [x] O agente do terminal responde as mensagens do WhatsApp ("sugere e eu mando" por padrão; automático por contato com aviso).
- [x] O WhatsApp só o próprio usuário vê; não é compartilhado.

## 5. iPad

- [x] Quadro com borda infinita (arrasta e dá zoom sem fim).
- [x] App à parte, instalado só no iPad; sem botão de iPad na Estação (só o próprio iPad tem "Projetar na TV").
- [x] Riscar no iPad risca na TV.
- [x] Ao salvar no iPad, salva também no Babel Coop (o quadro é um arquivo `.quadro` na pasta da pessoa e entra no acervo).

## 6. TV

- [x] A TV é um espelho do que acontece; não tem botão, nem tela, nem nada para fazer. Um botão na Estação abre a tela e espelha na TV.
- [x] A TV espelha vídeos, arquivos, reunião, desenho do iPad e sites; os botões são controlados na Estação e no terminal (`coop tv …`).
- [x] Rolar o arquivo projetado quando ele tem mais partes para baixo (pela Estação: botões, PageUp/PageDown, `coop rolar`).
- [x] Projetando: só uma luz de borda roxa na identidade da Babel.
- [x] O aviso de gravar áudio na TV ficou feio: melhorado (selos discretos em pílula, ponto que bate quando grava; a sugestão de ideia virou uma faixa fina).

## 7. Áudio da sala

- [x] Gravar áudio e transcrever, porque a equipe conversa o tempo todo e as ideias se perdem.
- [x] Guardar os últimos 5 minutos e, se foi dito algo, clicar "Salvar ideia falada".
- [x] "Começar a gravar" junta os 5 minutos anteriores (até 10) com o que vem depois e transcreve sempre.
- [x] Pesquisa de maneiras mais criativas (palavra de ativação, a sala sugere, botão físico) feita e registrada em `docs/pesquisa/`.
- [~] Transcrição de verdade (whisper.cpp) é do app real; no protótipo as falas são simuladas.

## 8. Anotar e concluir

- [x] Ir anotando as ideias num checklist para garantir a criação (`CHECKLIST.md`).
- [x] Parar de fazer perguntas e concluir a fase por inferência; pensar a UX (`UX.md`, seção 14 do IDEIAS com as decisões).

## 9. Explorador, que virou Criar

- [x] Escolher o projeto no Explorador e ver os arquivos daquele projeto; se tem mais pessoas, aparece o nome delas; vejo os meus arquivos.
- [x] Se alguém arrastar um arquivo para mim, ele aparece; eu posso arrastar arquivos para outro.
- [x] Falar dentro da conversa do projeto com uma pessoa ou com outra sobre o projeto.
- [x] Trabalhar sozinho é uma coisa, em equipe é outra; o fluxo parece que as pessoas estão juntas ("3 pessoas com você agora", o que cada um está fazendo, quem está vendo o meu arquivo).
- [x] Trocar a palavra Explorar por **Criar**; é lá que tudo acontece (tela, backend, pesquisa); conforme o que se cria, a tela do meio vira a coisa certa.
- [x] A Máquina não fica como ícone à parte: vive dentro de Criar.

## 10. Editor e tela do meio

- [x] Editar o README funciona; editar no Babel Coop altera imediatamente.
- [x] Ao salvar fica a minha foto; se outra pessoa salvar, fica a foto dela (no cabeçalho e na árvore).
- [x] A tela do meio pode fechar tudo e ficar vazia.
- [x] Ao fechar o meio, a lateral esquerda não some: continua aberta.
- [x] Com o meio vazio, clicar num ícone da barra da esquerda só troca a lateral; o meio só abre ao clicar num item da lateral.
- [x] Arquivo HTML abre renderizado como site, igual ao VS Code (Site | Código).
- [x] Cronômetro móvel e arrastável por qualquer lugar da tela.
- [~] Tela do meio como super Lovable: visual/backend/leitura conforme o que se cria (feito); versões (a lista de versões existe; a régua visual fica para a construção); editar no visual e mudar o código (só no desenho); cores por pessoa em volta das partes (só no desenho); projetar o trabalho sendo criado (arquivos sim; a Máquina na TV fica para a construção).

## 11. Navegador do agente

- [x] Tipo a extensão Claude in Chrome, mas dentro do app: o agente abre um navegador dele, navega, clica e preenche, e eu vejo tudo.
- [x] Poderoso em ver código: clonar páginas, clonar copy, descobrir o HTML e o CSS dos sites (Raio-X com HTML, CSS, Copy, Rede, Console).
- [x] Sem Playwright: código nativo nosso sobre o Electron, pelo conector coop (decisão registrada; o protótipo simula).

## 12. Perfil e gamificação

- [x] Clicar no meu perfil não abre por cima: abre uma tela geral com trabalhos feitos, tempo, dados, materiais, quanto % do Babel Coop eu faço parte e contribuo, e gamificação (nível, selos, sequência).

## 13. Babel OS e backend visual (a Máquina)

- [~] Babel OS: a pasta do projeto com envs do Supabase e da Vercel, fácil de trabalhar e de dividir peças para outros (desenho em 5.15 do IDEIAS; no protótipo a Loja tem o MCP do Supabase com chave no cofre e a Máquina tem "Pedir para alguém").
- [x] Prévia do backend em nós, como MindMeister/n8n; recursos do Supabase viram peças (multi-tenancy, tabelas, políticas) em linguagem simples, como Lego ou hardware virtual.
- [x] Ao comandar o terminal, a tela se monta conforme constrói ("Ver o agente montando" e pedido no terminal).
- [x] Dá para testar e ver os dados passando e onde ficam guardados (Testar, linha entrando na gaveta, cadeado barrando a outra empresa, ficha "onde fica guardado").
- [x] Perfeitamente fácil e visual: pensado com profundidade em `docs/MAQUINA.md`.

## 14. O 3D

- [x] O primeiro Mundo 3D (grafo) ficou ruim: refeito.
- [x] Depois: apagar o Mundo 3D como coisa à parte.
- [x] O 3D é o visualizador de site: a tela HTML como painel quadrado num ambiente 3D, com os próximos itens ao lado; as outras telas não precisam ser monitor; peças não abrem caixa de edição; só as telas HTML abrem e são interativas (digita, Enter, o pulso vai para a peça seguinte).

## 15. Outros pedidos ao longo do caminho

- [x] Mapa mental melhor que o MindMeister: desenho registrado (base M Master), fica para a construção. `[ ]` no protótipo.
- [x] Responder curto quando pedido (3 linhas).
- [x] Derrubar os executores travados e concluir eu mesmo.
- [x] Abrir a Máquina e as telas na aba dele quando não achava.
- [x] Sem botão de iPad na Estação.

## O que entra na construção real (não é protótipo)

- Terminal de verdade (node-pty), transmissão e controle pela rede, Electron Mac + Windows.
- Cada computador servindo os próprios arquivos e o diário de eventos replicado.
- WhatsApp Web real em webview e o agente lendo pela ferramenta `whatsapp`.
- Transcrição local (whisper.cpp), palavra de ativação, botão físico.
- Navegador do agente sobre o webContents do Electron, sem Playwright.
- Máquina lendo o Supabase e o repositório de verdade.
- Editar no visual e mudar o código; régua de versões; cores por pessoa; Máquina projetada na TV.
- iPad como app próprio (PWA e depois nativo).

## 18. Máquina = construtor de backend em equipe, com presets (versão 21)

- [x] Correção do Theus: o Babel Coop não usa Supabase; cada computador guarda o próprio HD compartilhado e o diário replicado. A Máquina é um **construtor de backend em equipe** (telas e backends), não um leitor de Supabase. Tirados todos os nomes Supabase/Vercel da Máquina, da Loja e do cofre (agora "servidor do projeto", "BANCO_URL", "Banco do Babel OS").
- [x] **Presets:** toda vez que algo é construído e o teste passa, aparece "✓ Funcionou · Salvar como preset"; o preset guarda as peças e os fios e entra na lista "Presets da equipe" (lateral da Máquina e tela Criar, "Começar de um preset"). "Usar em <projeto>" monta as peças encaixando; conta os usos. Telas também viram preset: botão "★ Salvar como preset" na vista Site de um `.html`, e "Começar desta tela" copia para a minha pasta. Pelo terminal: "usa o preset Login com empresa", "salva como preset Agendamento". Evidência: roteiro de testes, itens B.
- [x] **Roteiro de testes de comportamento** em `docs/testes/roteiro.js`: 41 verificações que dizem o que fazem, o que esperam e o que acharam (casca, Criar, edição na tela, 3D, mapa, Máquina, presets, terminal, navegador do agente, parede de terminais, demanda, cronômetro com arraste lento e volta da pausa, chat, sala, acervo, perfil, token, projeto, WhatsApp, Loja, Oficina, TV). Resultado na versão 21: **41/41**. Roda no Playwright MCP com `filename` apontando para o arquivo. Não existe MCP "webtestapp" nesta sessão; o que há é o Playwright MCP e a extensão do Chrome.

## 19. Perguntas finais de 23/09 (versão 22)

- [x] **MCP de testar telas:** procurei no GitHub; não existe um MCP chamado "webtestapp". O que existe e é o padrão para testar telas é o **Playwright MCP**, que já está instalado nesta sessão e é o que roda o `docs/testes/roteiro.js`. Alternativas achadas (webappMCP, ui-test-generation-mcp, BrowserStack MCP) não fazem nada que o Playwright não faça aqui. Instalar outro exige `npx`, que o Bash desta sessão não pode rodar; se o Theus tiver o nome exato, a configuração é uma linha em `.mcp.json`.
- [x] **O usuário usa o app como navegador?** Sim. Aba "Navegador": endereço + Abrir; a pessoa navega; "Assumir" e "Devolver" trocam o controle com o agente; o agente vê a mesma página e age por pedido. Evidência: roteiro C. No app real é o `<webview>` do Electron; no protótipo, páginas de exemplo.
- [x] **O terminal controla o navegador como no histórico?** Sim, do jeito escrito em `IDEIAS.md` 5.7: pedidos "entra em X e preenche", "clona a landing", "traz a copy"; cursor do agente à vista; Raio-X (HTML, CSS, Copy, Rede, Console); Clonar página e copy; Print. No app, as ferramentas são do conector `coop` sobre o webContents do Electron, sem Playwright.
- [x] **Marca da pessoa em cada peça:** Máquina mostra cor e foto de quem criou em toda peça, sempre; edição na tela grava `data-por` no bloco mexido e mostra a cor e o nome de quem mexeu. Evidência: 11 de 11 peças com cor e foto; `<h1 data-por="theus">` com a borda roxa do Theus.

## 17. Varredura mecânica de 23/09 (depois do cronômetro que não arrastava)

O Theus pegou o cronômetro sem arrastar no artefato e pediu para desconfiar de tudo. O que foi feito, na versão 19 e 20:

- Levantamento do cronômetro no histórico: `IDEIAS.md` 5.4 (quem recebe pausa, quem pediu dá o OK, minimiza e arrasta para qualquer lugar), 5.4.1 (tarefa livre liga o cronômetro), 14.6 (cronômetro de demanda + contagem regressiva de campanha na TV), 14.13 (etapa de tarefa com cronômetro), 9 (pausa automática fora do expediente), 6 (cronômetro e placar na TV), 15 (persegue a pessoa e volta sozinho da pausa); `CHECKLIST.md` 4 e 7; `UX.md` 46 (barra de status).
- **Bug 1, o arraste:** o relógio redesenha a caixa a cada segundo; o redesenho devolvia a caixa à posição gravada no meio do arraste. Corrigido: nada redesenha durante o arraste, posição gravada a cada movimento, pega por qualquer ponto da caixa, margem da Estação descontada.
- **Bug 2, Nova demanda:** ao enviar, a aba fechava antes de ler o campo "para quem" de novo; dava erro e o aviso "Demanda enviada para X" nunca aparecia (a demanda era criada). Corrigido.
- Varredura com o Playwright sobre os mesmos arquivos do artefato (tamanhos conferidos): 16 atividades; todos os `data-acao` renderizados na lateral e no meio têm função; abas abertas a partir dos itens da lateral (arquivo, demanda, chat, projeto, perfil, terminais, loja, oficina) sem erro; "ver como" as 11 pessoas em todas as atividades sem erro; 43 comandos e pedidos do terminal responderam; 23 formulários submetidos sem erro (depois da correção); TV nos modos painel, reunião, quadro, site e visita sem erro nosso (o `crypto.randomUUID` vem do site babel-os.com dentro do iframe, não é nosso); iPad risca, salva no arquivo `.quadro` e manda para a TV.
- Lição registrada: teste de arraste tem de ter esperas no meio e cobrir o estado minimizado.

## 16. Pedidos de 23/09 à tarde (conferidos na versão 16)

- [x] Transcrição sem LLM: respondido. O whisper não é LLM, é um modelo pequeno de voz; roda em um só computador (o que tem o microfone da sala), os outros só recebem texto. Sem modelo nenhum: o ditado do próprio Mac (`SFSpeechRecognizer`, pt-BR no aparelho) ou o Vosk (~50 MB). Decisão em `IDEIAS.md` 15.
- [x] Editar a página HTML pela tela, arrastando e soltando, já no protótipo: botão **✎ Editar na tela** na vista Site. Clique seleciona, arraste move (antes/depois do vizinho), duplo clique edita o texto, Delete apaga; barra com Texto, ↑, ↓, Duplicar, Apagar; **Salvar (n)** grava e a vista Código mostra o HTML mudado. Evidência: texto do h1 trocado e salvo no arquivo; ordem dos blocos mudou no código.
- [x] Estrutura real em localhost para testar na rede local: pasta `app/` (Electron + servidor Node por computador, diário replicado, descoberta por UDP, node-pty, pasta compartilhada). Escrita, não executada nesta sessão (o Node não pôde rodar aqui); o primeiro `npm start` diz o que ajustar.
- [x] Design antes ou depois do instalador: respondido. Antes de empacotar; o instalador só embala, e o design (HTML/CSS) muda sem reempacotar.
- [x] O clone do MindMeister (MindForge, em `Documents/Codex/2026-09-23/eu-qu/outputs/mindforge`) virou o mapa mental do Babel Coop: arquivo `.mapa` abre com o MindForge dentro da aba; salva no arquivo, versiona, espelha na TV em modo apresentação. Só o fundo mudou para a cor da identidade (`#060b16`); o resto do desenho ficou igual.
- [x] O agente do terminal cria e mexe no mapa por conversa: "cria um mapa sobre X com A, B e C", "adiciona X em Y", "expande Y", "renomeia Y para Z", "apaga Y". Evidência: os cinco testados; "apaga a campanha" segue para o terminal comum.
- [x] Token de instalação: Equipe → **Convidar pessoa** → nome → **Gerar token** → Copiar. No app real, o token leva id, nome, papel, segredo da equipe e o endereço da Estação de quem convidou; a pessoa instala, cola o token, entra e vê a equipe (e a equipe vê ela). Nenhum cadastro. No app: `app/servidor/token.js`, tela de boas-vindas em `app/ponte.js`.
- [x] Oficina do app (versão 17): um espaço onde o Theus, e quem ele liberar, muda o próprio Babel Coop pelo terminal ("muda no app: …"); a mudança fica aguardando na Oficina; o Theus escreve as notas e clica **Publicar atualização vN**; todo mundo vê **⬆ Atualizar para vN** na barra de baixo; ao clicar, o app da pessoa atualiza. A Oficina mostra quem pode mudar (Liberar/Tirar), o que está aguardando, as versões e quem ainda está na versão antiga. Evidência: mudança pelo terminal, publicação v3, "Atualizar" apareceu para a Carla e sumiu depois de atualizar; a Ana, não liberada, foi barrada. No app real: `app/servidor/atualizacao.js` (manifesto com hash por arquivo; cada Estação baixa da Estação de quem publicou, confere e recarrega).
- [x] Cronômetro desliza pela tela. **Estava quebrado até a versão 18** e o Theus pegou: o relógio redesenha a caixa a cada segundo, e o redesenho devolvia a caixa para a posição antiga no meio do arraste (o teste automático era rápido demais para ver). Corrigido na versão 19: durante o arraste nada é redesenhado, a posição é gravada a cada movimento, dá para pegar por qualquer ponto da caixa (não só pela pega ⋮⋮) e a margem da Estação entra na conta. Evidência: arraste lento com redesenhos no meio, caixa fica onde soltou.
- [x] Cronômetro persegue a pessoa fora do app: botão **⧉ destacar** abre uma janelinha só com o cronômetro (título, relógio, estado, Pausar/Continuar). No Chrome usa Document Picture-in-Picture (fica por cima de tudo, em qualquer mesa); no app real (`app/main.js`) é uma janela do Electron sem moldura, sempre por cima, visível em todas as mesas e por cima de apps em tela cheia; se nada disso existir, uma janela popup. Evidência: janelinha aberta, relógio andando, Continuar/Pausar nela muda o estado na Estação.
- [x] Sai da pausa sozinho: enquanto a demanda roda, o app lembra as peças que a pessoa mexeu (arquivos, terminal, projeto). Se ela pausar e, ao voltar, mexer numa dessas peças, na demanda, ou num arquivo citado na demanda, o cronômetro volta a contar sozinho, avisa ("voltou a contar: você mexeu em X; se não era isso, pause de novo") e registra no histórico. Nos primeiros 45 s depois de pausar não volta. Evidência: arquivo citado retomou; README, que não tem a ver, não retomou; terminal usado durante a demanda retomou; pausa recente não retomou.
