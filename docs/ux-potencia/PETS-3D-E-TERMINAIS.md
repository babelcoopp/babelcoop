# Companheiros 3D, terminais e navegador do agente

Atualização do catálogo após o quarto adendo: **Claude Code, Codex, OpenCode e Vyra**. Vyra é a quarta integração e pode operar sozinha. Ver [Criador e Vyra](CRIADOR-E-VYRA.md) e [cronômetro, ponteiro e projetos](PROJETOS-E-CONCLUSAO.md).

Complemento incorporado ao plano em 25/09/2026, a partir do [adendo integral](ADENDO-INTEGRAL.md). **A implementação começa após a concordância do Theus.** Esta etapa produziu documentação e maquete; não chamou a API paga da Replicate nem instalou ferramentas.

## 1. S16 · Companheiros de construção

Proposta: começar com **cinco pets completos**, construir a linguagem de interação e ampliar para **30 personagens distintos**. O pet assume a presença visual hoje concentrada no anel/ponteiro. O estado textual do agente continua explícito: executando, aguardando, concluído, falhou ou desconectado.

O companheiro é uma escolha de expressão da pessoa, associável à apresentação visual de seu agente. Nome do agente, ferramenta, modelo e permissões continuam separados da aparência. Trocar Dominic de Casca para Fio não troca o Codex, não muda a autoridade e não altera o histórico. A pessoa pode nomear o pet, escolher seu temperamento e usar presença compacta sem personagem.

### Cinco iniciais

| Pet | Corpo e silhueta | Movimento e expressão | Afinidade proposta |
|---|---|---|---|
| **Fio** | Fita contínua que se enlaça; termina em pequenos filamentos; volumes de tecido luminoso | Desfaz um nó para investigar, cria uma alça ao receber contexto, percorre uma conexão | Curiosidade, exploração, associação de ideias |
| **Casca** | Semente de cerâmica com três apoios, abertura assimétrica e uma folha pequena | Inclina o corpo para observar; abre a casca para acolher uma peça; recolhe apoios ao dormir | Calma, atenção, organização e cuidado |
| **Dobra** | Criatura de planos dobrados, asas desiguais e articulações de origami | Se desdobra para descobrir; vira pequena bancada ao trabalhar; saltos angulares de alegria | Invenção, brincadeira, experimentação visual |
| **Brasa** | Corpo baixo de pedra vulcânica, patas curtas e fissuras quentes | Impulso firme ao agir; concentra luz durante a ação; pequenas faíscas só em eventos significativos | Energia, decisão, execução e objetividade |
| **Maré** | Manta fluida suspensa, membranas largas e caudas de fita; material acetinado translúcido | Ondula para acompanhar; envolve visualmente uma entrega sem cobri-la; pousa dobrada ao descansar | Serenidade, colaboração, ritmo e síntese |

São direções de criação propostas; não uma alegação de ineditismo absoluto. A maquete contém **silhuetas vetoriais**, úteis para comparar formas. Elas não são os modelos 3D finais nem provam rig/animação.

### Estados e interações

| Estado | Gatilho | Comportamento | Como sair |
|---|---|---|---|
| Repouso | Sem tarefa em execução | Pose característica; pequenos movimentos espaçados, conforme preferência | Nova interação/evento |
| Curioso | Pessoa seleciona objeto ou pede explorar | Orienta atenção para aquele objeto, sem roubar foco | Seleção muda ou começa execução |
| Trabalhando / ação | Executor confirma atividade | Gesto de montar, consultar ou conectar conforme ferramenta | Evento de conclusão, bloqueio ou interrupção |
| Aguardando você | Há decisão/permissão/pergunta real | Gesto de convite junto à pendência, sem repetição insistente | Resposta ou cancelamento |
| Alegria | Entrega aprovada, conexão bem-sucedida ou interação escolhida | Animação própria do personagem, breve assinatura sonora opcional | Retorna à atividade/repouso |
| Tristeza / frustração | Tentativa falhou ou expressão escolhida na interação | Reação breve, seguida de postura de recuperação e acesso ao erro | Corrigir, tentar de novo, dispensar ou repousar |
| Dormindo | Pessoa manda descansar, sessão fica inativa ou o app perde foco | Recolhe-se; renderização pode parar numa pose estática | Pessoa volta ou surge evento relevante |
| Colaborando | Passagem de tarefa/contexto confirmada | Dois pets trocam um objeto visual e reconhecem a entrega | Confirmação do destinatário |
| Desconectado | Conexão/processo caiu | Estado visual distinto de sono, acompanhado de texto e recuperação | Reconectar ou encerrar |

Alegria/tristeza são **expressões do personagem**, não diagnóstico emocional da pessoa. Não usar câmera/microfone para adivinhar personalidade ou humor. Não punir ausência, cobrar carinho, criar fome obrigatória, fazer o pet “morrer” ou entristecer para pressionar retorno. Dormir pode ser uma experiência agradável de encerramento do trabalho.

**Interações diretas:** cumprimentar por clique/toque; escolher um gesto; pedir para acompanhar um objeto; chamar outro companheiro para uma passagem; descansar/acordar; mostrar o que foi construído; acessar o estado real do agente. A interação pode ser iniciada também por comando explícito. Nenhuma personalidade altera os limites de execução.

**Lugar:** no painel, presença compacta em uma área própria, com expansão opcional. No modo integral, abrigo recolhível na borda, movível e afastado da seleção. Na reunião, o diretor escolhe se o pet participa como guia, aparece só nas passagens ou fica fora do palco. Dois agentes podem mostrar dois pets; uma coleção de 30 não significa 30 modelos animados permanentemente.

## 2. Caminho para 30 — diversidade além da cor

Os primeiros cinco ocupam as posições 01–05. Os outros são candidatos de direção artística, a selecionar/ajustar ao produzir os lotes. Cada um precisa diferir em silhueta, material, locomoção, ritmo e gestos; recolorir não conta como personagem novo.

| # | Nome de trabalho | Corpo / modo de existir | Expressão predominante |
|---|---|---|---|
| 01 | Fio | Fita que se enlaça e desliza | Explorador |
| 02 | Casca | Semente cerâmica de três apoios | Atento |
| 03 | Dobra | Planos de origami que se transformam | Inventivo |
| 04 | Brasa | Pedra baixa de fissuras quentes | Decisivo |
| 05 | Maré | Manta suspensa de membranas e fitas | Cooperativo |
| 06 | Ninho | Estrutura trançada que caminha com a própria trama | Acolhedor |
| 07 | Prisma | Cristais assimétricos que se reorganizam em passos | Analítico |
| 08 | Esporo | Colônia macia sobre longas hastes flexíveis | Curioso |
| 09 | Catraca | Criatura circular de madeira e pequenos pés radiais | Metódico |
| 10 | Véu | Tecido suspenso com bordas que apontam e abraçam | Contemplativo |
| 11 | Estalo | Corpo em zigue-zague que se move por compressão | Rápido |
| 12 | Broto | Bulbo com raízes móveis e copa que se abre | Paciente |
| 13 | Ímã | Duas metades suspensas que se aproximam e afastam | Conector |
| 14 | Sopro | Foles translúcido com pequenas asas de ar | Leve |
| 15 | Mosa | Placas de mosaico que mudam a organização do corpo | Estruturador |
| 16 | Pêndulo | Arco caminhante com centro de massa pendurado | Ritmado |
| 17 | Lagoa | Corpo de líquido contido por uma borda elástica | Adaptável |
| 18 | Trama | Tear diminuto que produz e recolhe seus próprios membros | Articulador |
| 19 | Toco | Madeira arredondada sobre raízes curtas assimétricas | Estável |
| 20 | Eco | Conchas acústicas articuladas que abrem por turnos | Ouvinte |
| 21 | Arco | Pontes flexíveis que se revezam como pernas | Resolvedor |
| 22 | Névoa | Cápsulas porosas formando um corpo descontínuo | Imaginativo |
| 23 | Quilha | Corpo estreito de barquinho que desliza e inclina | Direcionado |
| 24 | Pétala | Coroa de pétalas estruturais com deslocamento rotativo | Expressivo |
| 25 | Rastro | Centopeia curta de blocos que desenha trajetos | Persistente |
| 26 | Lume | Lanternas pequenas em uma estrutura articulada vertical | Guia |
| 27 | Grão | Conjunto compacto de grãos magnéticos com forma mutável | Experimental |
| 28 | Laço | Dois corpos macios ligados por um braço comprido | Parceiro |
| 29 | Pedra-sol | Disco mineral de pernas telescópicas e face lateral | Concentrado |
| 30 | Nave | Abrigo ambulante que se abre em pequenas plataformas | Construtor |

Não atribuir “tipo de personalidade” automaticamente nem prometer representar todas as pessoas com uma classificação fechada. A coleção oferece afinidades e combinações; nome, intensidade e escolha permanecem livres.

## 3. Pipeline de arte 3D e Replicate

### O que já existe

- Script local `app/scripts/gera-replicate.mjs` e plano histórico `docs/design/GERACAO_REPLICATE.md`.
- 17 caminhos `.glb` localizados: 16 em `prototipo/midia/pecas/` e um cofre em `prototipo/midia/`. Existência de arquivo não prova qualidade, licença ou adequação à nova direção.
- Peças atuais incluem tela, gaveta, armário, portaria, cofre, robô, fio, cano e outras. Antes de gerar substituições, classificar reutilizar/adaptar/substituir/falta.
- Credencial não foi lida nem validada nesta missão. Nenhuma geração foi executada; preços históricos não foram reutilizados como cotação atual.

### Produção após aprovação do plano

1. **Direção:** folhas de silhueta, vistas, escala, materiais e movimentos; escolher um pet piloto e uma peça estrutural. No início, privilegiar superfícies legíveis para a reconstrução; transparência de Maré pode ser material aplicado depois.
2. **Modelo gerador:** conferir catálogo, schema, versão, licença e preço no momento de uso. O catálogo atual inclui famílias Hunyuan, TRELLIS e Rodin; comparar uma amostra segundo resultado necessário. Não adotar o slug/preço do plano antigo sem reconferir. [Catálogo Replicate](https://replicate.com/collections/3d-models).
3. **Geração controlada:** chamada via Node/HTTP compatível com o projeto; limite de tentativas e gasto por lote documentado antes de consumir créditos. Token em mecanismo de segredo já autorizado, nunca em HTML, repositório, prompt, captura ou log. Não enviar documentos da equipe como referências de arte.
4. **Baixar e registrar:** salvar saídas imediatamente com manifesto: modelo/versão, parâmetros, referência, seed quando suportada, ID da geração, hash, direitos de uso, tamanho e custo real quando disponível. As saídas de previsões pela API podem ser apagadas pela Replicate após uma hora. [Arquivos de saída](https://replicate.com/docs/topics/predictions/output-files).
5. **Preparar para animar:** examinar geometria, separar partes móveis, corrigir topologia, pivôs, escala, normais e materiais; rig apropriado ou deformação procedural; criar biblioteca de animações. Um `.glb` gerado não deve ser considerado automaticamente pronto para atuar como personagem.
6. **Empacotar:** GLB/glTF com convenção de nomes, animações, pontos de interação, níveis de detalhe e imagem estática. Otimizar textura e geometria por tamanho de exibição; carregar sob demanda. Ferramentas e scripts usados neste projeto devem respeitar a proibição de Python. [Especificação glTF](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html).
7. **Dar comportamento:** máquina de estados local + eventos reais + escolhas da pessoa; transições, prioridades, duração, cancelamento e interação entre dois pets. Não usar chamadas de LLM contínuas para respirar, piscar ou dormir.
8. **Aceitar o piloto:** provar os estados pedidos, uma passagem entre pets, legibilidade pequeno/grande, desempenho, silêncio/movimento reduzido e recuperação após sair/voltar. Só então produzir os outros quatro; expandir em lotes até 30 após o conjunto inicial funcionar.

### Peças e elementos adicionais a considerar

Biblioteca da Máquina: peça de função, fila/evento, conexão externa, arquivo/objeto, ponto de entrada, grupo de recursos e marcador de execução. Cada peça precisa corresponder a conceito/estado real. Portas, seleção, fios e rótulos exigem geometria previsível e podem continuar procedurais.

Palco: bases de apresentação, pontos de enquadramento, suportes para artefatos, transições entre regiões e pequenos abrigos dos pets. Gerar ativos onde enriquecem a leitura espacial; manter texto e controles em elementos nítidos, com escala adequada à TV. Não gerar uma coleção de cenários antes de confirmar a composição do palco.

## 4. Navegador como bancada do agente

Além de uma aba web normal, o navegador terá uma área de missão: objetivo, projeto, agente, abas/sessões envolvidas, etapa, último resultado e Assumir/Parar.

Capacidades propostas:

- Navegar, pesquisar em várias abas, comparar fontes, citar e transformar achados em arquivo/tarefa/modelo do projeto.
- Ler estrutura/DOM/acessibilidade, localizar elementos, preencher, clicar, rolar e esperar estado com evidência de antes/depois.
- Usar captura visual quando a estrutura não representar a interface; identificar limitações em canvas, frames, login e desafios que exijam pessoa.
- Inspecionar rede/console/erros, mapear elemento a arquivo local quando possível, ajustar página e conferir resultado.
- Capturar, importar assets autorizados, baixar e anexar ao projeto com origem e destino.
- Gerenciar sessão por pessoa/conta e missão; múltiplos agentes não disputam o mesmo controle da aba. Handoff humano conserva contexto.
- Distinguir leitura/pesquisa de mudança externa; usar a intenção autorizada da pessoa. Conteúdo de site não vira instrução privilegiada do agente.
- Histórico de ações, retorno de erro, retomada e interrupção confiável. “Feito” aponta resultado observado.

O navegador existente é uma base valiosa; paridade dessas capacidades por Claude Code, Codex e OpenCode exige contrato comum e prova. A pessoa mantém navegação manual completa.

## 5. Terminal como experiência principal

### Ferramenta de agente e modelo LLM

| Ferramenta | Base encontrada | Plano |
|---|---|---|
| Claude Code | Adaptador e PTY em `agentes.js` | Preservar terminal nativo; traduzir eventos públicos, perguntas, ações, saída e erros para Presença |
| Codex | Adaptador `codex.js` via app-server; thread atual efêmera | Configuração efetiva, continuidade suportada pela versão instalada e equivalência de controles |
| OpenCode | Não localizado no seletor/adaptador de agentes examinado | Novo adaptador; detectar versão; integrar sessões/eventos/capacidades e TUI/terminal correspondente |
| Vyra | Perfil Gemma‑Vyra e Criador recebidos/localizados; ainda sem integração comprovada no Babel | Quarta IA definida pelo Theus; integração final com modo Solo, substrato e motor explícito; independência da Gemma é marco próprio |

Ferramenta é o programa de agente; provedor/modelo LLM é uma capacidade dentro dele. A interface precisa explicar essa diferença. Não apresentar seleção de “Claude” ou “Codex” como se resolvesse todos os modelos, custos e esforços possíveis.

O OpenCode documenta servidor HTTP/OpenAPI e SDK para integração. Há também documentação de uma linha v2 com API diferente; a implementação deve fixar a versão realmente instalada, evitando misturar contratos. Isso apoia a proposta de adaptador, mas não prova compatibilidade pronta com Babel. [Servidor](https://opencode.ai/docs/server/), [SDK](https://opencode.ai/docs/sdk/), [linha v2](https://opencode.ai/v2/docs/build/sdk).

### Uso cotidiano do terminal

Abas nomeadas por tarefa/agente, dividir painéis, destacar/ampliar terminal, localizar sessão e buscar no histórico. Fontes, zoom e contraste funcionam em Tech/Vibe. Seleção/cópia e colagem multilinha não brigam com atalhos do editor. PTY/TUI precisa receber tamanho, teclado, Unicode e eventos de foco corretos; não converter arbitrariamente saída interativa em cartões quebrados.

Cada sessão mostra pessoa, máquina, projeto, diretório e processo. Estado de comando em execução, código de saída quando disponível, processo encerrado, reconexão e ação Parar são compreensíveis. Links para arquivos/erros abrem a origem no projeto. A tela Presença traduz atividade, enquanto o terminal original continua acessível.

Atalhos têm escopo: editor, terminal e canvas não competem pelo mesmo gesto. Copiar texto selecionado não deve interromper processo acidentalmente. Colagem que dispara comandos, entrada sensível, eco oculto e autorização de controle remoto precisam conservar o comportamento esperado do terminal. Sessão retomada não finge que o PID anterior sobreviveu.

## 6. A tela transmitida merece composição própria

Quatro modos de cena: **explicar** (mapa/documento), **demonstrar** (página/navegador), **construir ao vivo** (Máquina/terminal escolhido) e **decidir** (resultado/próximo passo). Mesmo objeto, enquadramento e hierarquia próprios para audiência.

Em 16:9: área segura, tipografia legível à distância, nome do projeto/cena, autoria quando útil e grande foco visual. Uma cena pode começar com o sistema inteiro, aproximar uma peça, mostrar sua execução e revelar o resultado. Pet pode apresentar, receber uma peça ou celebrar uma passagem; o diretor controla sua presença.

Terminal privado, credenciais, conversa pessoal e rascunhos ficam fora da composição. Compartilhar terminal cru exige escolher aquela superfície. Prévia e monitor de confiança no computador mostram exatamente o que a plateia recebe. O navegador e o agente podem preparar a próxima cena sem mudar a atual. Layout da reunião não é a janela de trabalho apenas espremida ou espelhada.

## 7. Pontos adicionais que apareceram na análise

| Ponto | Por que interfere na potência | Decisão de projeto / tarefa |
|---|---|---|
| O computador anfitrião pode dormir ou sair da rede | Pessoas podem confundir cópia local com estado compartilhado | Definir fonte de verdade, disponibilidade, fila offline e reconciliação; informar “última sincronização” |
| Dois agentes podem atuar no mesmo arquivo ou aba | Cooperar pode virar sobrescrita ou ação cruzada | Delimitar escopo, posse da sessão, integração e conflito; autoria por evento |
| Personagem animado pode mentir sobre o agente | Dormindo, desconectado e aguardando autorização são estados diferentes | Expressão artística acompanhada de estado textual verdadeiro |
| 30 modelos podem comprometer memória e bateria | Catálogo inteiro carregado elimina fluidez | Carregamento sob demanda; um ou poucos ativos; pose estática; descarte e medição |
| Malha bonita pode ser difícil de animar | Geometria gerada não garante articulação | Piloto completo com rig/gestos antes do lote de cinco e de 30 |
| “Tudo controlável” precisa de uma linguagem comum | Cada CLI implementada isoladamente multiplica inconsistências | Ações tipadas compartilhadas e tabela de capacidades por adaptador |
| Trabalho local, sincronizado e publicado são estados diferentes | A pessoa pode acreditar que equipe/cliente já recebeu | Estados e destinos explícitos; prova no receptor |
| Janelas, atalhos e foco podem disputar o comando | Um Enter no lugar errado muda o resultado | Escopo de teclado, foco visível, contexto do envio e restauração de rascunho |
| Uma entrega pode funcionar só no computador do autor | Não basta o efeito de sucesso na Máquina | Ambiente, dependências, evidência de execução e revisão em outra Estação |
| Crescer o escopo sem catálogo torna o produto confuso de novo | Mais pets/provedores/peças podem multiplicar menus | Mesmos objetos e contratos; novos conteúdos entram nos catálogos existentes |

Esses pontos foram acrescentados ao TODO. Não são tarefas já realizadas nem justificativa para reduzir a ambição do pedido.
