# Missão do CRIADOR

- Identificador exclusivo: babel-coop/maquina-jogo
- Autoridade/pedido original do usuário, preservado:
  > 25/09/2026, Theus: "imagina tipo cada imagem 3d representar uma sequencia de codigos ou açoes que vao acontecendo no terminal, tipo, criar tela login, ai nisso aparece a peça que representa login, uns efeitos visuais pra mostrar que está sendo ativado, ai preciso que crie tal coisa, e ai vai mexendo as peças, a tela do meio com os elementos 3d vai tornando visual as açoes do banco, e ai quando clicar em subir pra nuvem, ai tem que colocar as credenciais no terminal, e ai aparece algo que seja indo para a nuvem, ai tipo se tornando um ambiente seguro, exemplo, peço pra IA fazer um xerox do banco de dados na nuvem ai puxa os dados da nuvem pra pasta e ai já aparece todas as peças 3d ai [...] pensa montar um motor de um carro, pensa lego, pensa manicraft, eu penso na babel-coop um construtor assim, interativo, game, diversao, adrenalina"
  > 25/09/2026, Theus: "eu preciso que tipo, os itens do menu lateral e o terminal se converse [...] mas vamos começar por partes, eu quero ver ser possivel construir um banco de dados vendo os elementos 3d interagirem"
- Criação esperada e destinatário: a Máquina do babel-coop como construtor-jogo; nesta primeira parte, um banco de dados de verdade sendo construído pelo agente no terminal enquanto as peças 3D nascem, se ligam e reagem na tela do meio. Para o Theus e a equipe.
- Pasta exclusiva e responsável pela escrita: .deus/maquina-jogo/ · Ryan (um só escritor da memória).
- Recursos autorizados e restrições do projeto: Node/JS/npm liberados; PGlite (Postgres em WASM, sem compilação nativa); proibido Python, .sh, make; sem push sem ordem; sem credencial em arquivo. Nuvem (Supabase "Networking Reino") só nas partes seguintes e com o ok do Theus.
- Orçamento informado pelo usuário/cliente, quando houver: não informado (ultracode ligado na sessão).
- Entregável utilizável: no app instalado, o Theus pede ao agente no terminal "cria o banco de ..." e vê, na Máquina em 3D, cada tabela nascer como gaveta com efeito, os vínculos virarem fios que se desenham, as regras fecharem cadeados, os gatilhos virarem robôs, e linhas de teste entrando nas gavetas.

## Aceites antes de começar

| Critério observável | Evidência exigida | Como será verificado | Estado |
| --- | --- | --- | --- |
| P1 · Banco real local por projeto | tabela criada existe no Postgres local e sobrevive a reabrir o app | teste de servidor com PGlite (criar, fechar, reabrir, ler catálogo) | Aberto |
| P2 · O agente constrói pelo terminal | ferramenta MCP aplica SQL, grava a migração em arquivo na pasta do projeto e devolve o que mudou | teste do conector + e2e chamando a ferramenta | Aberto |
| P3 · Cada mudança vira peça viva | tabela→gaveta com campos, FK→fio, RLS/política→cadeado, gatilho→robô, função→porta, na Máquina do projeto | e2e: catálogo × peças na tela | Aberto |
| P4 · Ver acontecendo em 3D | a Máquina abre sozinha em 3D e anima cada mudança em sequência (nascer, fio se desenhando, cadeado, dados entrando) | e2e com medidas do 3D + prints em sequência | Aberto |
| P5 · Dados passando | inserir/consultar pelo agente mostra linhas entrando na gaveta (contador real do banco) | e2e + print | Aberto |
| P6 · Erro visível e honesto | SQL errado não quebra nada: peça pisca em erro e o agente recebe a mensagem do Postgres | teste de servidor + e2e | Aberto |
| P7 · Leve e instalável | efeitos com começo e fim; app empacota e instala com o PGlite | teste de pacote/instalar + medida de CPU parado | Aberto |

## Ponto inicial

- O que já existe, com fonte: Máquina 2D/3D com peças e fios no estado da equipe (prototipo/maquina.js, visual3d.js); ferramentas coop_maquina* (app/servidor/coop-mcp.js, app/interface/coop-ui.js); PGlite 0.5.8 testado no scratchpad (abre em 0,9 s, catálogo com tabelas, FK, políticas e gatilhos).
- Diferença que a criação deve realizar: sair da maquete para um banco real local que o agente constrói e a Máquina mostra ao vivo.
- Primeira pergunta por capacidade: o catálogo do Postgres local, lido antes e depois de cada migração, dá a lista ordenada de mudanças para animar? (sim no teste do scratchpad)
- Primeira ação que produzirá informação ou artefato: módulo servidor/banco.js com PGlite + diff de catálogo + testes.
- Decisões realmente ausentes: menu lateral × terminal "conversando" (parte seguinte); nuvem e xerox (parte seguinte, com credenciais do Theus).

## Revisões do pedido e dos aceites

- (nenhuma ainda)
