# PLANO BABEL COOP · para aprovação do Theus

> 23/09/2026 · missão DEUS `babel-coop/design-2030`, revisão 6 · Fecha a fase de ideia; o que vem depois é programação. Base: `docs/FUNCOES.md` (todas as telas e recursos), `docs/design/CONCEITO.md` (a casca), `docs/design/visao.html` (as imagens), `SUPABASE_PECAS.md`, `MAQUINA_PECAS.md`, `TELA_CONSTRUTOR.md`, `GERACAO_REPLICATE.md`. Nada do FUNCOES.md sai.

---

## 0. Em uma frase

**Babel Coop é o sistema da empresa com corpo, à vista de todos**: a equipe e seus agentes trabalham na mesma sala, conversando com uma presença que comanda o terminal inteiro (troca telas, gera campanhas, monta o backend), tudo o que acontece fica à vista com prova e só entra com um OK carimbado com o "b" da Babel, e a parede da sala mostra o sistema vivo.

O que fica igual: Arquivos · Trabalho · Agentes; as quatro leis (o painel diz onde está apontado · todo OK deixa nome e hora · nada tem luz fixa · o que está na frente vai para o agente); tokens, tipografia e motion do CONCEITO; cada computador sustenta o próprio armazenamento; token de instalação; TV sem botão; iPad só quadro; celular com 5 abas.

---

## 1. O que torna único: a maneira de organizar

Não é um recurso: é como os recursos se combinam. Seis propriedades, cada uma reaproveitando as mesmas peças:

| # | Propriedade | Como funciona | Onde aparece |
|---|---|---|---|
| 1 | **A presença no lugar do terminal** | À direita não há prompt: há uma coluna de luz dentro de um anel-instrumento (o mostrador). Ela escreve o estado ("pensando há 4 s", "terminou · 14:32", "espera o seu OK"), recebe pedidos em português, roda o shell por baixo e mostra cada ação como bloco com prova. "Ver o comando" a um clique; terminal real em Ctrl+J. | painel de agentes, abas, cabeçalho do objeto, parede de Terminais, TV, celular |
| 2 | **Tudo tem endereço** | Sala (projeto ou atividade) › bancada (pasta/tipo) › peça (arquivo, Máquina, tela, demanda, canal). Presença vira posição ("Carla está na landing.html"); o histórico do agente vira rastro com um carimbo em cada parada; Ctrl K → "Onde estão"; "Ir até". | cabeçalho do objeto, Onde estão, planta na TV, celular ("onde estão?") |
| 3 | **A memória tem nome** | Quando a presença consulta, cita: "Aprendizado · Davi · reembolso · usado 7×", e o Davi vê a luz acender. Todo agente novo nasce sabendo ("já li 76 coisas que a equipe aprendeu"). Presets, aprendizados, ideias faladas e atas com autor e usos. | bloco consulta, Acervo, Perfil, número público semanal |
| 4 | **O sistema tem corpo** | As 16 peças do Supabase em 3D (geradas uma vez pelo mesmo pipeline do cofre), o pulso do teste andando pelos canos, a peça nova nasce tracejada e **ganha corpo** ao publicar. Na Estação a Máquina é 2D em nós; o 3D é a parede e o "ver de dentro". | TV (corpo do projeto), Tela em 3D, Ver o agente montando, Loja |
| 5 | **O mapa vira máquina** | O mapa mental (2D, MindMeister sobre o chão da Babel) é o plano vivo: cada galho pode ser materializado pela presença em Tela, campanha, demanda ou peça da Máquina; o galho fechado ganha carimbo; a luz anda pelos galhos conforme o trabalho acontece. | Criar → Mapa, campanhas, TV em apresentação |
| 6 | **O organismo vivo e a pontuação com origem** (substitui o carimbo, por ordem do Theus) | Toda luz é um evento real: o arquivo nasce linha a linha no meio; cada item do checklist concluído dispara um pulso roxo → ciano da presença até o item, com faíscas; "Documento concluído" faz o organismo pulsar inteiro e o placar subir contando; a Máquina testada brilha junta e as peças ganham corpo. Cada ponto mostra de onde veio; nunca por tempo, nunca comprado, nunca sorteado. Pontos pessoais informam (competência); o corpo do projeto cresce na parede (vínculo); nunca ranking. O OK de quem pediu continua existindo com nome e hora, mas como função, não como cerimônia. Régua completa em `REGUA_ORGANISMO.md`; demonstração em código em `organismo.html`. | meio, painel, rodapé (pontos, meta semanal, sequência), Perfil, TV |

---

## 2. O kit de recursos (gerados uma vez) e como cada um serve a várias telas

Regra de ouro: **um recurso, muitos usos; cada uso preso a um evento real.** Vídeo é material para detalhes animados (o carimbo carimbando, o b se desenhando, a peça ganhando corpo, o pulso no cano), nunca a interface inteira (provado: texto miúdo vira massa).

| Recurso | Como se gera | Usos (os mesmos arquivos) |
|---|---|---|
| **R1 · O "b" que se desenha** (4 s, pronto: `b-entrada.mp4`) | nano-banana-2 keyframes → wan 2.7 first/last | entrada com token (uma vez) · abertura da TV ao ligar · espera longa do agente (> 3 s, só o traço andando) · o "b" estático no topo (último quadro) |
| **R2 · O jogo das luzes** (código: pulsos, faíscas, "concluído", placar; `organismo.html`) | CSS + canvas, custo 0; vídeo só onde o CSS não chega | item concluído · documento concluído · nó encaixado · teste passou/barrou · máquina funcionando · OK recebido · meu trabalho usado · meta semanal · fim do dia (a tabela inteira está em `REGUA_ORGANISMO.md` §2) |
| **R3 · A presença** (coluna de luz no anel-instrumento; keyframe pronto na `imag-estacao`; clipes de estado a gerar: pensando · terminou · espera · falhou, 4 s cada) | nano-banana-2 → wan 2.7 (4 clipes) | painel de agentes (grande) · abas de agentes (14 px, o mesmo desenho) · cabeçalho do objeto · parede de Terminais · TV ("agentes trabalhando") · celular · "ver o agente montando" |
| **R4 · O chão vivo** (pronto: `chao-vivo.mp4`) | nano-banana-2 16:9 → wan 4 s | TV enquanto a sala trabalha (para quando para) · modo Visita · fundo do modo Reunião · pôster no celular |
| **R5 · As 16 peças do Supabase em 3D** (cofre pronto: `cofre.glb`; 15 a gerar) + **"a peça ganha corpo"** (pronto como prova: `chegada-lupa.mp4`, cubo → objeto) | folha de estilo → keyframe isométrico → recorte → Trellis → gltfpack; clipe cubo → peça no wan | TV (corpo do projeto, muda só ao publicar) · Tela em 3D · Ver o agente montando · Loja (preset em 3D) · Máquina 2D usa os mesmos glifos das peças |
| **R6 · O mapa-observatório** (pronto: `imag-mapa`) | estilo fechado; em CSS/SVG no produto | Criar → Mapa · plano de campanha · TV em apresentação galho a galho · "galho vira peça" |
| **R7 · Detalhes animados presos a evento** | CSS/SVG (custo 0) ou vídeo curto onde o CSS não chega | pulso verde/vermelho no cano e nos fios · luz que corre na linha das abas quando o agente toca outro objeto · anel que fecha na meta a 100 % · traços da memória da sala · "salvo na equipe" que esfria |
| **R8 · Som "espera"** | oscilador Web Audio; stable-audio só se soar barato | o agente precisa de você e você olhou para outro lado; desligado por padrão; nunca na TV |
| **R9 · Identidade viva por equipe** | a mesma receita R1–R4 com o logo do cliente | onboarding de cada sala; a Loja vende "salas com a sua marca" (≈ US$ 5–7 por equipe) |
| **R10 · Ícones (61) à mão** | SVG monoline 1,5 px (o Recraft reprovou) | toda a casca; os 16 glifos da Máquina |
| Nunca | rostos de agente ou de pessoa gerados · texto em pixel · loop sem dado · fundo atrás de texto · a interface como vídeo | — |

---

## 3. Tela por tela: o que faz, como a presença comanda, que recurso usa

| Tela (FUNCOES) | O que a pessoa faz | O que a presença faz por pedido | Recursos |
|---|---|---|---|
| **A · Casca** (barra, lateral, abas, paleta, rodapé, novidades, TV, celular) | navega; Ctrl K; rodapé de casas fixas | "abre a proposta", "mostra a landing na TV", "fecha tudo", "onde estão?" | R1 (topo), R2 (Atualizar vN), R3 (abas), R7 (luz nas abas) |
| **B · Criar · arquivos** (árvore, projetos, versões, editar, sugerir mudança) | abre, edita, versiona, manda para pessoa | "explica", "resume", "cria uma nota com…", "manda para a Carla", "volta como estava ontem" | R2 (recebido de X · aceitar sugestão), R7 (linha acende) |
| **B · Criar · Tela** (Site · Código · 3D, editar na tela) | arrasta blocos, edita texto, versões | "cria a landing da clínica", "põe em duas colunas", "gera as variações" | R2 (bloco aprovado), R5 (modo 3D), R7 (assentar) |
| **B · Criar · Máquina** (peças, testar, publicar, presets) | monta em 2D com nós e fios; testa; publica | "cria uma tabela de pacientes", "liga a tela à porta", "testa como a outra empresa", "publica" | R5 (peça ganha corpo, 3D), R7 (pulso), R2 (Publicar, preset) |
| **B · Criar · Mapa** (MindForge) | mapeia; apresenta | "cria um mapa sobre o lançamento", "materializa o galho Landing", "leva o mapa para a TV" | R6, R2 (galho fechado), R7 (luz nos galhos) |
| **B · Criar · Quadro / Pesquisa** | risca; pesquisa | "pesquisa no acervo", "resume o que achou" | R7 |
| **C · Agentes** (painel, abas, receitas, comandos, parede de Terminais, navegador) | conversa; puxa peças; entra no terminal do outro | tudo: gera campanha, avisa a TV, cria demanda, navega, clona, muda o app | R3 (a presença), R2 (Confirma? s/N · entrar), R7 |
| **D · Meu dia · Demandas · Tarefas · Metas** | caixa, check-in, cronômetro, fluxo, placar | "cria uma demanda para o Davi até sexta", "quantas esperam meu OK", "cancela a campanha" | R2 (OK só de quem pediu · herói), R7 (anel da meta), R3 |
| **E · Chat · WhatsApp · Reunião · sala** | conversa; reunião como modo; memória da sala | "@Lia responde o cliente", "marca a decisão", "salva essa ideia" | R2 (decisão), R4 (fundo da reunião), R7 (traços da sala) |
| **F · Acervo · Inteligência · Sonho** | busca; aprendizados; melhores prompts | "o que a equipe aprendeu sobre reembolso", "usa o melhor prompt" | R3 (memória com nome), R7 |
| **G · Equipe · Perfil · Mapa da equipe · Projetos** | pessoas, carga, regras, convite, planta | "onde está o Davi", "quem sabe de clínicas", "convida a Rita" | R2 (histórico de carimbos), R1 (entrada), R3 |
| **H · Loja · Oficina** | instala; muda o próprio app; publica vN | "muda no app: …", "publica a versão", "instala o preset" | R2 (Aguardando publicação · Atualizar), R5 (preset em 3D), R9 |
| **I · TV** | sem botão | `coop tv …` e a engrenagem | R4 (chão), R5 (corpo do projeto), R3 (agentes), R2 (carimbo ao vivo), R6 (apresentação), R1 (abertura) |
| **J · iPad** | quadro | — | R7 (risca na TV) |
| **K · Celular** | 5 abas; onde estão; OK por toque | igual, por voz ou texto | R3, R2, R4 (pôster) |
| **L · Só no app** | token real, node-pty, Supabase real, webview, voz | — | — |

---

## 4. A aposta principal (formato DEUS)

- **Destino:** uma equipe de empresa trabalha inteira dentro de uma sala conversacional, sem cara de terminal, e o próprio sistema da empresa aparece com corpo na parede; em 12 meses é a categoria "sistema com corpo · trabalho à vista".
- **Indício atual:** os cinco elementos gerados hoje (b que se desenha, chegada cubo → objeto, chão vivo, cofre em 3D em 31 s por US$ 0,035, seis imagens do app) saíram na primeira ou segunda tentativa, com 35 predições e ≈ US$ 4,5; o protótipo v22 já faz 42/42 do roteiro; o mercado lido (25 produtos) não tem sala física nem carimbo com autoria (analogia para "categoria nova": Warp/ADE, Linear/"issue tracking is broken").
- **Hipótese de mecanismo:** quando a conversa fica apontada para o objeto (endereço + presença) e todo consentimento vira carimbo com nome e hora, a equipe deixa de precisar de terminal e de gestor perguntando; o pressuposto removido é "agente = janela de chat / terminal".
- **Ponte mínima:** o protótipo v22 (tudo já existe em JS puro) + uma extensão decisiva: **o painel da direita vira presença** (mostrador + blocos + carimbo b), com endereço e "Onde estão" derivados do que o app já grava. Substituições provisórias declaradas: shell simulado (o real é node-pty no app), Supabase simulado na Máquina (o real é o MCP/CLI), mídia gerada com dados de exemplo.
- **Sinal precoce (limiar fixado antes):** 3 pessoas da Babel, sem ajuda, chegam ao primeiro carimbo de outra pessoa no próprio objeto em < 5 min, 3 de 3; ninguém abre o terminal real na primeira semana; tempo de tarefa "onde está o Davi?" < 30 s.
- **Rival e controle:** o mesmo protótipo com o painel de terminal atual (v22) medido com as mesmas 3 pessoas e tarefas; controle: o carimbo sem nome/hora (só um botão OK) para ver se a autoria é o que muda o comportamento.
- **Decisão seguinte:** a sonda = as fases 1 e 2 + ≈ US$ 20 de mídia; se o sinal aparecer, reproduzir com 3 outras pessoas e integrar (fases 3–5); se falhar, manter a casca v2 e o plano de retirada por peça, e reabrir quando a Máquina ler o Supabase real.

---

## 5. Mão na massa: fases, entregas, "pronto quando"

> **Sem calendário (ordem do Theus, 23/09/2026):** as fases abaixo são a ordem de construção, não datas. Nada de "dias" ou "semanas": a equipe de construção trabalha as fases em sequência contínua até o CHECKLIST fechar. "Pronto quando" é critério observável, nunca prazo.

| Fase | O que se constrói (no protótipo v22, JS puro, mesmo link) | Pronto quando |
|---|---|---|
| **F0 · Kit** (primeira) | recarregar a Replicate; gerar R2 (carimbo, feito), R3 (4 clipes de estado), R5 (15 peças + "ganha corpo" das 4 com gesto); ícones à mão; `tokens.css` no protótipo | `assets/visao/` completo com MANIFESTO; roteiro passa 42/42 |
| **F1 · A presença** | o painel da direita vira presença: mostrador apontado ("→ objeto · pensando há N s"), blocos tipados (pedido · consulta com nome · plano · ação com desfazer · resultado com prova · espera · falha), "ver o comando" dobrado, campo ❯ endereçado, receitas ≤ 3 por objeto, o carimbo "b" em todo OK (ficha, cabeçalho, bloco, TV), o b que se desenha na entrada | 3 pessoas: primeiro carimbo de outra pessoa em < 5 min; zero "cara de terminal" |
| **F2 · A sala** | endereço em todo objeto; Ctrl K "Onde estão"; "Ir até"; "por onde passou"; a planta na TV (gemba walk) com carimbos e cronômetros; memória com nome no bloco consulta; agente nasce sabendo | "onde está o Davi?" < 30 s; a TV responde sem perguntar |
| **F3 · Gera a campanha** | o pedido "gera a campanha" transforma o meio: Tela + 3 anúncios + WhatsApp + calendário como abas/cartões com anel de progresso e carimbo; o mapa que vira máquina (galho → Tela, campanha, demanda, peça) | uma campanha inteira nasce de um pedido e cada peça tem dono e carimbo |
| **F4 · O corpo** | as 16 peças em 3D na TV (corpo do projeto), "a peça ganha corpo" ao publicar, o pulso nos canos; Máquina 2D em nós com glifos das peças; presets em 3D na Loja | publicar vN muda a parede; teste "como a outra empresa" barra no cadeado, na Estação e na TV |
| **F5 · O app real** | Electron + token + node-pty + Supabase real na Máquina (MCP/CLI) + webview + voz; teste com 3 pessoas e retirada por peça; identidade viva para a primeira equipe cliente | 2 máquinas na rede local com o token; a sonda (§4) medida |

Cada fase republica o protótipo no mesmo link e atualiza `docs/testes/roteiro.js`.

---

## 6. O que você aprova (marque)

- [ ] Nome e linha: **sistema com corpo · Trabalho à vista** (teste com 3 empresários decide a ordem).
- [ ] **O organismo vivo e a pontuação com origem** (`REGUA_ORGANISMO.md`, `organismo.html`): pulsos e faíscas por item concluído, "Documento concluído", "Máquina funcionando", placar que sobe com origem, meta semanal minha, corpo do projeto na parede; sem carimbo, sem ranking, sem pontos por tempo.
- [ ] O corpo do agente é a **presença de luz no anel-instrumento** (sem rosto, sem objeto de escritório; a versão da imagem 1 da visão, ainda melhorável); nome humano e dono.
- [ ] **Todo o motor do Supabase em peças**: as 16 peças (+ vitrine, janela, Vistoria, Diário) cobrem os 79 recursos oficiais (`SUPABASE_PECAS.md`); **todas** em 3D na parede; Máquina de trabalho em **2D com nós**; mapa em **2D** que vira máquina.
- [ ] Vídeo como material para **detalhes animados presos a evento** (R1, R2, R3, R5, R7); nunca a interface inteira.
- [ ] Ordem das fases F0–F5.
- [ ] Recarga da Replicate (≈ US$ 20) e troca do token.

---

## 7. Evidência e pendências

- Gerado hoje: 35+ predições, ≈ US$ 4,5, tudo em `docs/design/assets/raw/*/MANIFESTO.jsonl` e `assets/visao/`; artefatos: https://claude.ai/artifact/KruF3NjV9EddMRm69367P3 (painel v2) e https://claude.ai/artifact/SU3FQypcRxSmPoBuCZLGxn (visão v4).
- Pesquisa: 4 frentes + 3 conceitos + 2 juízes + síntese em `.deus/missao-design/pesquisa/visao-*.md`.
- Pendências: recarga e troca do token; APCA conferido num verificador; a Máquina lendo o Supabase real (F5) é o que tira o corpo da condição de maquete.
