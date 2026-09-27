# Codex, abertura da logo e Oficina local

2026-09-25 · [[Dominic]] · retomado após desligamento do Mac por bateria.

## Pedido e permissão

Theus pediu: logo da TV começa escura e ganha cor; Codex disponível na Presença; edição do próprio Babel Coop apenas na versão liberada na Oficina, com prévia e empacotamento ao final; logo também na abertura da Estação; Tech/Vibe na TV.

Theus confirmou a permissão de linguagens/ferramentas do app, mantendo Python bloqueado. A liberação anterior de JS/TS/Node já constava em `CLAUDE.md:55`. Não foi encontrado arquivo OpenCode na raiz deste projeto. `AGENTS.md` local agora registra a exceção; `CLAUDE.md` foi alinhado com a confirmação.

## Mudanças

- TV e Estação: vídeo da logo começa escondido sobre fundo escuro, sem poster colorido antecipado; aparece ao começar a reprodução. Respeita redução de movimento.
- TV: Tech/Vibe persistido no estado da equipe, controlado pela Estação; TV local também oferece seletor para gestão. A TV remota permanece de leitura.
- Presença: botão Codex e seleção Claude Code/Codex ao criar agente. Codex usa processo `app-server` próprio, login já existente e conexão MCP Coop por sessão. Ligar não envia pedido ao modelo. Presença recebe estado, plano, ações, perguntas, permissões e resultado; permite interromper.
- Codex: instruções de trabalho e contexto da Oficina; `workspace-write` e aprovação solicitada à pessoa; resultado público completo enviado ao acervo. Conteúdo de raciocínio interno não é exibido. Pausa conserva privacidade.
- Oficina: autorização da gestão vinculada ao hash e caminho desta instalação; seleção nativa da pasta fonte; sessão dedicada; atualizar prévia para interface, reiniciar prévia para servidor. Mudanças em main/preload entram no pacote final.
- Reempacotar e reiniciar: encerra sessões da Oficina, gera app/DMG numa subpasta exclusiva de `app/dist`, preserva app aberto e dados, depois relança o novo executável. A nova instalação começa sem autorização de edição. Não publica para a equipe.
- Revogar autorização encerra sessões da Oficina. Erro ao carregar servidor da prévia desliga a prévia para recuperar a versão instalada. Instância única evita abrir duas cópias usando a mesma porta.

## Como usar

1. Presença: clique **Codex** ou **+ → Codex**. Se faltar autenticação, faça `codex login` no Terminal e chame novamente.
2. Oficina: **Permitir mudanças nesta versão → Escolher pasta fonte**, selecionando a pasta completa `babel-coop` com `app/node_modules`.
3. **Editar pelo terminal** cria o agente na pasta autorizada. Faça o pedido. **Atualizar prévia** mostra arquivos da interface; **Reiniciar prévia** recarrega servidor.
4. Ao concluir: **Reempacotar e reiniciar**. O instalador é mostrado no registro do empacotamento; a versão antiga fica preservada.

## Evidência e limites

- Checagem de sintaxe (`node --check`) passou em 13 arquivos JavaScript alterados. Revisão de integração dos três trabalhos paralelos concluída.
- `npm run empacotar` concluído (22,9 s): app 285,3 MB; DMG 129,3 MB; 22 arquivos de interface, 4 de navegador, 17 de servidor e 111 de protótipo. Assinatura ad hoc conferida pelo empacotador com `codesign --verify --deep --strict`; pacote local sem atributo de quarentena. A primeira tentativa encontrou restrição de rede; a repetição com acesso aprovado concluiu.
- Artefatos: `app/dist/mac-arm64/babel-coop.app`, `app/dist/babel-coop-0.1.0-arm64.dmg` e `app/dist/pacote.json`.
- Comando de abertura concluiu; processo do executável novo confirmado com PID 11473. `git diff --check` dos arquivos desta mudança passou.
- Nenhum teste funcional novo nem pedido real ao modelo foi executado nesta retomada. Uso autenticado do Codex, TV física/AirPlay e ciclo completo de editar/empacotar/reabrir ainda precisam de avaliação em uso.
- A autorização da Oficina controla os fluxos oferecidos pelo app; não substitui as permissões do macOS para programas externos.
- Distribuição continua com assinatura ad hoc, sem Developer ID/notarização; download/AirDrop podem aplicar quarentena. Não há garantia de abertura sem aviso em outros Macs.

## Conhecimento para retomada

### Ajuste pedido após abrir

Theus observou bordas pretas na abertura do app e pediu a logo expandida como na TV. `#estacao-abertura video` agora ocupa 100% da janela, com `object-fit: cover` e centro preservado; a abertura escura→cores permanece. Em proporções diferentes do vídeo, corta as extremidades para preencher a tela.

Novo build em `app/dist/abertura-expandida-20260925` concluído em 24,3 s com assinatura ad hoc conferida. App anterior fechado antes da cópia; app, DMG e manifesto do caminho padrão atualizados e comando de reabertura concluído. Sem nova bateria de testes funcionais.

### Correção de proporção após retorno do Theus

O preenchimento `cover` aumentou demais a logo. O vídeo é quadrado (960×960, metadados lidos com ffprobe), por isso preencher uma janela larga produz zoom. Regra atual: lado limitado ao menor entre 74% da altura, 82% da largura e 720px, `contain` para preservar a logo inteira, centralização e máscara suave nas extremidades para disfarçar a transição do vídeo ao fundo. Substitui a expansão de 100% descrita acima. Pedido: “ficou grande de mais, precisa ajustar a dimensão”.

- A Presença antiga dependia dos ganchos do Claude; simplesmente executar Codex no shell não produzia os eventos esperados. O adaptador separado traduz o protocolo do Codex para esses eventos.
- Um build sobre `dist` em uso poderia substituir o próprio app aberto. A Oficina usa saída exclusiva para cada build.
- A prévia de servidor exige reinício para sair dela: os caminhos de módulos já carregados não mudam apenas ao trocar o HTML.
- O hash da instalação inclui o arquivo ASAR e o selo dos recursos externos, pois a pasta `prototipo` fica fora do ASAR.

- 2026-09-25 · [[Dominic]] · retorno do Theus: logo estava grande. Abertura agora proporcional, centralizada, sem cover: min(74vh,82vw,720px), máscara suave. Build23,4s com assinatura ad hoc conferida; app/DMG padrão substituídos após encerrar processo e comando de reabertura concluiu. Sem teste funcional adicional.
