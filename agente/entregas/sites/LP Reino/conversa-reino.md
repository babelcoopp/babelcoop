# Conversa: construção da LP do Reino
> Registro das conversas entre o Marcelo e o Claude sobre o Reino e a LP. Começou em 22/09/2026.
> Projeto técnico em `~/reino/` (agente, skills, bibliotecas, base de conhecimento).
> A base completa e organizada está em `reino-base-de-conhecimento.md` (cópia de `~/reino/conhecimento/reino.md`, que é a versão viva).

## 1. Início
- **Marcelo:** "crie uma pasta com o nome reino e gere um agente lá dentro, construtor de LPs super comerciais"
- **Feito:** `~/reino/.claude/agents/construtor-lp.md`, um agente copywriter de resposta direta e dev front-end focado em conversão.

## 2. Objetivo
- **Marcelo:** quer "a melhor landing page de pré-cadastro e vendas do mundo, focada em experiência imersiva e super impactante". Vai explicando o Reino e o Claude vai perguntando.
- **Feito:** base de conhecimento `conhecimento/reino.md` + `CLAUDE.md` do projeto.

## 3. O que é o Reino (palavras do Marcelo)
- "O Reino é um clube de network e significa R = Relacionamento, E = Empresários, I = Influência, N = Network, O = Oportunidade. Todo empresário do Brasil entra no Reino. É uma experiência única, onde conecta nossa IA (Babel) a um sistema de network de empresários onde terá clube de benefícios, rede social, níveis de conquista e status, revista de informações sobre os afiliados, matchmaking. A IA localizará empresários que fazem negócios com empresários."
- 7 níveis: Visconde (1º), Conde, Marquês, Duque, Príncipe, Rei, Imperador (7º). Cada nível com benefícios, acessos e mensalidades diferentes. A partir do Duque não há mensalidade: é conquistado.
- Mapa mental: https://mm.tt/map/4068653729?t=ZKaNq7Pc26 (lido, com complemento do `REINO.pdf` no Desktop).

## 4. Ferramentas instaladas
- **Marcelo:** "instala skills de construção de páginas de alto impacto e bibliotecas de vídeo para poder rolar páginas fatiando frames"
- **Feito:** skills `lp-imersiva`, `scroll-frames`, `frontend-design` e `webapp-testing`; GSAP + ScrollTrigger + SplitText + ScrollSmoother, Lenis e Three.js em `libs/`; ffmpeg + `tools/fatiar-video.sh` (testado).

## 5. Funil (palavras do Marcelo)
- "A LP serve para fazer um pré-cadastro, cair no Reino, fazer o login. Depois, dentro do Reino, ela vive uma experiência, copia um link de indicação e envia para um amigo empresário. Esse já cai na LP, entende como o Reino funciona em uma experiência imersiva, e torna-se um ciclo vicioso."
- "Durante mais de 30 dias eu vou cadastrando os pré-cadastrados em um canal do WhatsApp e em canais de comunicação dentro do Reino, para que eu vá mostrando todos os benefícios dia após dia. Quando eu abrir o carrinho de vendas, já começo o Reino grande, com milhares de empresários."
- Ainda nenhum empresário cadastrado. O time de co-fundadores está sendo reunido. Os cadastros começam depois da LP.
- Os ganhos de rede variam por nível (está no mapa). O anel é físico.

## 6. Exclusividade de nicho
- Claude propôs um produto de exclusividade por nicho e cidade, com preço escalonado por habitantes (R$ 2.997 a R$ 11.997/ano).
- **Marcelo:** "eu não coloquei exclusividade para nenhum nível, que fique claro." Gostou do escalonamento por habitantes, mas **achou barato**.
- Os "10 primeiros afiliados" (ganhos de liderança) vinham do PDF antigo e **não estão mais em uso**.

## 7. Próximos passos
- Marcelo vai passar o acesso ao app do Reino para o Claude conhecer a identidade visual (ele mesmo faz o login no navegador).
- Marcelo vai mandar a LP atual.
- Definir o preço final da exclusividade.

## 8. Protótipo do app (https://o-reino.vercel.app/)
- Claude analisou o código público: identidade "Babel OS" (azul-noite, ciano/violeta, ouro nos títulos, Exo 2 + Inter, castelo neon no lago), 24 telas, Supabase.
- Problemas apontados: títulos e preços divergem do mapa; o cadastro não pede WhatsApp; 9 etapas obrigatórias no cadastro; ~9 MB de JS sem build; texto provisório na tela pública; chave do Google precisa de restrição.
- **Marcelo:** "sim, os preços tão errados, iremos corrigir".

## 9. Pertencimento
- **Marcelo** pediu ideias inspiradas em clubes de empresários, sociedades secretas, maçonaria e cortes medievais, para que todos queiram pertencer ao Reino.
- Claude entregou `ideias-pertencimento.md` (14 ideias + LP + cuidado jurídico). O Claude não vai desenhar mecanismos que tirem a escolha das pessoas: o vínculo deve vir de valor real, identidade e ritual.

## 10. Mitologia
- O Claude propôs construir a mitologia do Reino (lenda de origem Babel, crônica dos títulos, símbolos, Livro do Reino).
- **Marcelo:** "traga para nós conceitos ufológicos e converta para a linguagem do Reino" → `mitologia-ufologica.md`.

## 11. Respostas do Marcelo
- O fundador é **Marcelo Rocha** (os registros anteriores diziam "Diego" por engano do Claude).
- "Criei o Reino porque sou apaixonado por network. Todo mundo precisa de um clube de network onde a IA ajude os empresários, deixe-os imersivos e faça com que se conectem de forma mais fácil e barata."
- O Reino proíbe: falcatrua, roubo, golpe e estelionato.
- Os 144 (ainda incompletos) são pessoas próximas que vão liderar e puxar os primeiros mil afiliados.
- Afiliado ativo = mensalidade em dia ou quem puxa rede.
- Presencial: depois. Foco no Reino digital.
- Anel: proposta em `anel.md`.

## 12. Público e números
- "Qualquer empresário com vontade de fazer network é bom para o Reino."
- Babel: 30 clientes × R$ 3.000/mês.
- Caso Diego (amigo): R$ 2.100 em tráfego → 2.199 leads → 59 contratos × R$ 600.
- ~50 pessoas já ouviram a apresentação, sem objeções; todas esperam a LP.
- O Marcelo pensa em fechar com um clube de benefícios existente.

## 13. Foco da LP e copy v1
- **Marcelo:** "o foco da LP são os benefícios que o Reino dará para os empresários ao entrarem e o que a Babel pode fazer. O empresário vai 'comprar' o Reino primeiro, e dentro do Reino será atraído para a Babel."
- Pediu: pesquisar 5 concorrentes, fazer a copy "7× mais imersiva" e trazer uma prova validada.
- Claude entregou `copy-lp-v1.md`: BNI, G4 Club, LIDE, YPO e Clube de Empresários; copy em 12 cenas; tabela de evidências; protocolo de teste. Não é possível garantir conversão antes de medir.

## 14. Especificação técnica + Replicate
- O Marcelo enviou `PROMPT_AGENTICO_LP.md` (spec completa: geração de mídia via Replicate, motion, performance, checklist) e um token da Replicate.
- Token guardado em `~/reino/.env` (protegido, fora dos documentos) e testado: funciona.
- Catálogo verificado: 39/40 modelos existem; `seedream-5` → `seedream-5-pro`.
- Spec salva em `~/reino/specs/prompt-agentico-lp.md` com notas de adaptação; skill de frames e fatiador alinhados.
- Nenhuma mídia foi gerada (nada foi gasto). A geração depende de aprovação.

## 15. A LP foi construída (v1)
- **Marcelo:** "eu quero que tu gere a LP, será minha primeira LP, será um momento incrível, me impressione".
- A Replicate recusou por falta de crédito (402), sem custo. A mídia foi feita em código: castelo neon com lago (canvas), torre da Babel com 7 terraços, anel 3D (Three.js) que troca pedra e metal por título, trilha ao vivo (Web Audio).
- 12 cenas + Carta de Apresentação (?de=/?ref=) + Juramento (segurar para entrar) + boas-vindas com convite pelo WhatsApp.
- Testado em desktop e celular, com movimento reduzido e sem JavaScript. Carga inicial ≈ 209 KB gzip.
- Pendências: Supabase (SQL pronto), canal do WhatsApp, autorização do Diego, jurídico, og:image, domínio.
- Local: `~/reino/lp/` → `python3 -m http.server 8080`.

## 16. Arquivo único
- **Marcelo:** "salve o HTML dessa LP na pasta de forma que eu ache facilmente".
- Criado `LP-Reino.html` nesta pasta: a LP inteira num só arquivo (1,4 MB), com fontes, scripts e anel 3D embutidos. Abre com dois cliques, sem servidor. Testado.

## 17. Revisão da LP (v2)
- Pedidos do Marcelo: tirar todos os valores; "Primeira Corte" no lugar de "fundadores"; código de conduta mais sofisticado; FAQ virar "Dúvidas que você pode ter" sem a pergunta de pirâmide; preço da Primeira Corte 40% melhor que o da inauguração; Babel sem citar 30 empresas; captura prometendo Reino demonstrativo + comunidade, com portão ao fundo; trilha medieval sem direito autoral; guiar o scroll devagar; arquivo `networkreino.html`; corrente de indicação.
- Tudo aplicado. A trilha é uma composição própria em modo dórico (alaúde, bordão, tambor), tocada ao vivo pelo Web Audio.
- Corrente de indicação documentada em `INDICACAO.md` (o que falta é ligar o link de afiliado do app à LP).

## 18. Publicação e migração de conta
- LP publicada e pública: **https://networkreino.netlify.app** (dona da conta Netlify hoje: silvaadrian481@gmail.com — revisar).
- Link de prévia no Claude: https://claude.ai/artifact/UwQMwhJvBBhuJPyDVEthvC
- Domínio `networkreino.com` continua **livre** (~US$ 11/ano). Nada foi comprado.
- **Pré-cadastros ainda NÃO são salvos.** SQL pronto em `~/reino/lp/supabase-pre-cadastro.sql`.
- O Supabase conectado não tem o projeto do app do Reino (`fxlansnepokjxdikxocb`).
- O Marcelo vai criar a própria conta no Claude: guia em `CONTINUAR-EM-OUTRA-CONTA.md`, transcrição completa em `transcricao-completa.md`.

## 19. Conta nova do Marcelo (22/09/2026, noite)
- O Marcelo continuou na conta dele. O conector do Supabase ficou na conta antiga e ainda não foi ligado na nova.
- O painel do Supabase caía ao abrir o projeto: havia um incidente oficial (erros 401 de JWT). O Claude ficou vigiando o status.
- **Marcelo:** "mantenha sempre em português", pedido que vale inclusive para as descrições dos comandos.
- **Canal da Primeira Corte:** https://whatsapp.com/channel/0029VbE2VHJ0bIdsPQHW9f06, ligado ao botão "Entrar na comunidade" das boas-vindas.
- Contagem do topo agora com segundos. Anel corrigido para quem usa "movimento reduzido" (aparecia parado e "preto e branco").
- **Supabase ligado:** o Marcelo rodou o SQL no projeto `ifkiznmltykogvjrjjwu` e mandou a chave pública. Função testada (recusa dados inválidos) e tabela protegida (leitura pública bloqueada). A LP já grava os pré-cadastros.
- **Site republicado na conta do Marcelo** (marcelomaximus@…): o Adrian liberou o nome e o Marcelo criou o site `networkreino` no Netlify dele. O Netlify cria sites novos como privados: foi preciso clicar em "Tornar público". Conferido no ar em 22/09/2026 com canal, segundos, anel corrigido e Supabase.
- **Matrícula nº 000001:** o primeiro pré-cadastro real foi do Marcelo e entrou no Supabase.
- **Marcelo:** busca reversa "pra pessoa digitar e aparecer de acordo com o que ela digitou" → feita (18 segmentos, reconhece cidade/região).
- **Marcelo:** castelo "moderno, porém com um impacto medieval" (compararam com Alice no País das Maravilhas) → virou fortaleza medieval em neon, com estandartes, tochas, rosácea, grade levadiça e coroa holográfica.
- **Marcelo:** botão do Reino demonstrativo com mais destaque que o do canal → virou o botão principal das boas-vindas.
- **Marcelo:** castelo mais sóbrio, base Neuschwanstein, "pegada Game of Thrones", imponência → castelo de pedra realista sobre rochedo, Alpes nevados, farol ciano como toque de tecnologia.
- **Marcelo:** "coloca a floresta escura com um caminho com algumas luzes até chegar" no portão → lago trocado por estrada de pedra com lampiões pela floresta.
- **Publicação automática:** o Marcelo criou a chave do Netlify; agora o Claude publica com `tools/publicar.sh`. Primeira publicação assim em 22/09/2026 (castelo, caminho, busca, boas-vindas).
- **Erro na publicação automática (22/09/2026):** o primeiro envio em .zip fez o Netlify servir a página como texto puro (quem abria via o código). Corrigido na hora: republicado pelo método de arquivos, e `tools/publicar.sh` agora confere se a página sai como HTML.
- **Marcelo:** luzes da estrada se aproximando e sumindo ao caminhar + estrada mais tecnológica → feito (faixas ciano, grade em movimento, pulsos de luz).
- **Marcelo:** música "estilo Ameno remix, bem parecida, para proteger o direito autoral" → "Hino do Reino": mesmo gênero (coro épico + taikos + batida), melodia 100% original. Prévia em MP3 no Desktop.
- **Marcelo:** como fazer o prompt no Suno para sair parecido com o Ameno (2010 Remix) sem infringir → prompt pronto em `prompt-suno-hino-do-reino.md` (estilo descritivo, letra original em latim, cuidados).
- **Trilha oficial no ar (23/09/2026):** "Orave Lumina (Remix v4 - 85 BPM)", feita no Suno pelo Marcelo. Publicada junto com a estrada tecnológica e os lampiões que passam.
- **Marcelo:** tirar "Powered by Netlify" (feito), mapa do Brasil cortado no computador (corrigido), botão de cadastro do celular vivo (halo pulsando + feixe de luz).
