# LEIA-ME · Dominic, o organismo que mora nesta pasta

Oi, Marcelo. Este é o manual de bolso do Dominic. Leia uma vez, guarde, e volte aqui quando algo estranhar.

## O que é isso

Esta pasta é o **corpo do Dominic**: ele lembra, aprende e evolui a cada pedido seu.
- `memoria/` é a memória — cada coisa aprendida vira um arquivo `.md`, um neurônio.
- `motor/` são os órgãos — scripts que refinam, indexam, cruzam e versionam tudo.
- `.claude/` é o sistema nervoso — os "ganchos" que sentem cada evento da conversa.
- `dashboard/` é o painel — o HTML que você abre na lateral do VS Code.
- `entregas/` é o que ele produz — sites, LPs, ideias de sistemas. `backups/` são as fotos da memória.
Você pediu um empresário automatizado que não esquece nada e cruza tudo a cada requisição. É isto.

## Um dia com o Dominic

1. Abra o iTerm2 (ou o terminal do VS Code).
2. Digite `cd ~/Desktop/babel-os` e depois `claude`.
3. A linha de baixo do terminal já fala português (`🧬 Dominic v0.x`).
4. A primeira resposta já vem com contexto: "ontem a gente parou na LP do Reino…".
5. Fale normal, como no WhatsApp: "faz uma LP pro evento".
Quando ele aprende algo, aparece `📌 Anotei: …`. Quando usa a memória, `🧠 Lembrei: …`.
Se ele disser "nada novo a registrar", é normal: nem toda conversa gera neurônio novo.
Ao fechar, ele guarda. Ao reabrir, continua de onde parou.

## Como saber que ele está vivo (primeira vez)

- Na primeira resposta ele se apresenta: "Organismo Dominic v0.x (geração N)".
- A linha de baixo do terminal mostra `🧬 Dominic v0.x`.
- `/hooks` lista 16 eventos do projeto (mais os do iTerm2).
- `/status` mostra `.claude/settings.json` entre as fontes de configuração.
- `/estado` responde com os sinais vitais.
Se aparecer "hook error" logo de cara, é quase sempre o anotador do iTerm2 (veja os dois avisos lá embaixo), não o Dominic: `/estado` diz qual é. Sem pânico: nada disso apaga memória.

## Como conversar e os comandos

Fale como você fala. Os comandos são atalhos; `/ajuda` lista todos com um exemplo cada.

| Comando | O que faz |
|---|---|
| `/lembrar` | guarda uma memória (fato, preferência, ideia) |
| `/decidir` | registra uma decisão que vale daqui pra frente |
| `/consultar` | pergunta à memória: "o que sei sobre X?" |
| `/estado` | sinais vitais: versão, memórias, pendências, saúde |
| `/perfil` | o que ele já aprendeu sobre você |
| `/pendencias` | o que está aberto |
| `/lembrete` | lembrete com data (aparece quando você abre o Dominic) |
| `/site` | cria site ou LP em `entregas/` |
| `/sistema` | desenha uma ideia de sistema |
| `/pesquisar` | vai à internet e guarda o que achou |
| `/evoluir` | refino completo + relatório da evolução |
| `/esquecer` | marca uma memória como superada (nunca apaga) |
| `/painel` | atualiza o painel e ensina a abrir |
| `/origem` | mostra seu pedido original, intacto |
| `/pausar` | liga/desliga a pausa do organismo |

## O painel (a janela para ver ele evoluir)

1. Abra a pasta `babel-os` no VS Code. Se aparecer a faixa **Modo restrito / Confiar nos autores**, clique em **Confiar** (ou `Cmd+Shift+P` → "Workspaces: Gerenciar Workspace Trust"). Esse é o trust do **VS Code**, diferente do trust do Claude Code; sem ele o navegador integrado devolve 403 ("Forbidden") para qualquer `file://`.
2. `Cmd+Shift+P` → digite `Browser: Open Integrated Browser` → Enter.
3. Na barra de endereço cole `file:///Users/marcelomaximos/Desktop/babel-os/dashboard/index.html` → Enter.
4. A aba abre ao lado. Arraste para a direita se quiser chat de um lado e painel do outro. Pronto: ele atualiza sozinho a cada refino (em até 10 s depois de um `/lembrar`).
5. Atalho opcional (tente): botão direito em `dashboard/index.html` → **Open With…** → Browser. Se não existir na sua versão, o passo 2 sempre funciona.
6. Se ficar em branco (fallback): no terminal, `bash dashboard/serve.sh` → ele imprime `http://127.0.0.1:8765/dashboard/` → cole no navegador integrado. `bash dashboard/serve.sh --stop` desliga. O Claude Desktop também abre o `index.html` direto (`Cmd+Shift+B`).

O que você vê lá: cabeçalho com versão e "vivo desde"; sinais vitais (memórias, decisões, projetos, pendências, custo); **o que eu sei de você** (o retrato, "aprendi hoje", "ainda quero aprender"); **o que o Dominic lembrou agora** (o cruzamento acontecendo); a linha da evolução (versões); a linha do tempo viva; o grafo de memórias; projetos, pendências e agenda; entregas com link; contexto; saúde e avisos.

## Como ele lembra

- Cada memória vira um arquivo em `memoria/`. Nada é apagado: só "superado" com `/esquecer`.
- Correções nunca perdem a versão antiga: a anterior vai para `memoria/.history/`.
- A cada pedido, ele cruza o que você escreveu com tudo o que sabe e injeta o que combina (`🧠 Dominic lembra`).
- O índice fixo (o resumo que ele carrega no bolso) só entra na conversa **nova** ou depois de `/compact`. Por isso, às vezes ele lembra "na próxima sessão". Se tiver pressa: `/clear`.
- O que ele lembrou agora aparece no painel, em "O que o Dominic lembrou agora".

## A linha de baixo do terminal

`🧬 Dominic v0.4.13 · 🧠 28 mem · 📌 1 pendência · 🗓 1 lembrete │ cérebro Fable · esforço ultra · modo auto`
`▓▓░░░░░░░░ memória 12% · US$ 0,42 · 13 min · ⚡ cache quente · limite 5h 34% · lembrou há 2 min │ Shift+Tab modo · Esc Esc voltar · /ajuda`
- versão (ouro) · memórias · pendências · lembretes │ modelo · esforço · modo de permissão.
- barra de memória da conversa (verde, amarelo, vermelho; a partir de 80% ele pede `/compact`) · custo da sessão · minutos · cache (quente = mais barato) · limite de 5 horas do plano · há quanto tempo ele lembrou algo │ dicas.
- Se aparecer `⚠️ /estado tem um aviso` ou `⚠ iTerm (veja LEIA-ME)`, é só olhar; nada trava.

## Pausar, desligar, voltar no tempo

- **Pausar**: `/pausar` (ou crie um arquivo chamado `PAUSA` na raiz da pasta). Ele continua respondendo, mas não registra nem lembra nada. Apague o arquivo para voltar.
- **Desligar de vez**: renomeie `.claude/settings.json` para `settings.json.off`. A memória fica intacta. Renomeie de volta e tudo acorda.
- **Voltar no tempo**: `python3 motor/snapshot.py --list` e depois `python3 motor/snapshot.py --restore <arquivo>`. As fotos ficam em `backups/`, **fora** de `memoria/`, de propósito: sobrevivem mesmo se a memória for apagada. O que estava lá vai para `memoria/.lixeira/`, nunca some.

## Dois avisos importantes

**(a) iTerm2.** O iTerm2 instalou um "anotador" (`cc-status`) que aponta para uma pasta temporária do macOS. Um dia essa pasta some e você vai ver `hook error` em tudo. **Não é o Dominic.** Para resolver: abra o iTerm2 → menu **iTerm2** → refaça a integração com o Claude Code (com o iTerm em `/Applications`). O Dominic não mexe em `~/.claude/settings.json`, que é seu; se quiser, ele te mostra o passo a passo.

**(b) "Block from now on".** Se o Claude Code perguntar sobre ler um arquivo fora da pasta e oferecer "Block from now on", responda **"Keep allowing"**. O Block apaga a memória automática do Claude Code.

## Limites honestos

- Lembretes só aparecem quando você abre o Dominic. Não existe alarme fora dele: para isso, use o calendário.
- Abrir o painel é você que faz (uma vez por sessão do VS Code). Depois ele se vira.
- No painel de chat do VS Code a linha de baixo pode não aparecer. O painel HTML cobre.
- Telegram/WhatsApp precisam de Node/Bun, que a máquina não tem hoje. É um passo futuro.
- O Dominic pensa com o Fable (o cérebro caro). Pesquisas grandes ele delega a agentes mais baratos.
- Nunca abra o `claude` na pasta pessoal (`~`), só dentro de `babel-os`. Fora dela, ele acorda sem corpo.

## Se algo estranhar

1. `/estado` primeiro: ele diz o que está acontecendo, em português.
2. `python3 motor/selftest.py` (roda tudo numa caixa de teste, não mexe na memória).
3. `claude doctor`.
4. A regra do `PAUSA`: pausou, parou de registrar; apagou, voltou.
5. `/evoluir reparar` refaz o que faltar.
Backups em `backups/` (na raiz, fora de `memoria/`). Seu pedido original, intacto, em `memoria/origem/pedido-original.md`.

## Dicas

- `/config` → desligue `leftArrowOpensAgents` (a seta ← num prompt vazio manda a conversa para o fundo).
- `/terminal-setup` uma vez no VS Code para Shift+Enter quebrar linha (ou `\` + Enter em qualquer lugar).
- `Esc Esc` volta no tempo dos arquivos que o Dominic editou. `Shift+Tab` troca o modo.
- `/effort ultracode` só em construções grandes: custa mais.
- `git init` na pasta é um passo futuro consciente: muda a chave da memória automática e do trust. O Dominic explica quando for a hora.
