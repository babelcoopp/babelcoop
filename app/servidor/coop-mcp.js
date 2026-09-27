/* Babel Coop · o conector `coop`: um servidor MCP por HTTP dentro do servidor da Estação (PROTOCOLO §8)
   O Claude Code que roda no terminal do app (§7) fala com ele por `--mcp-config` do tipo http em /mcp/<sessao>.

   Transporte (conferido em https://modelcontextprotocol.io/specification, 23/09/2026):
   - "Streamable HTTP" no modo simples: cada mensagem JSON-RPC 2.0 chega num POST e a resposta sai em application/json
     (nunca SSE). Notificação aceita = 202 sem corpo. GET e DELETE no endpoint = 405 (não há fluxo SSE nem sessão).
   - Servidor das duas eras ("dual-era"):
       · legada (2025-11-25, 2025-06-18, 2025-03-26, 2024-11-05): `initialize` negocia a versão (devolve a pedida se
         a conhecemos, senão a mais nova legada), `notifications/initialized` → 202, depois tools/list e tools/call;
         método desconhecido = erro -32601 no corpo (HTTP 200). Não criamos Mcp-Session-Id (é opcional).
       · moderna (2026-07-28): sem handshake; cada pedido traz `_meta["io.modelcontextprotocol/protocolVersion"]` e os
         cabeçalhos MCP-Protocol-Version, Mcp-Method e (em tools/call) Mcp-Name, conferidos contra o corpo
         (divergência = 400 com -32020 HeaderMismatch; versão desconhecida = 400 com -32022 e a lista `supported`;
         método desconhecido = 404 com -32601). `server/discover` responde versões, capacidades e serverInfo.
         Resultados levam `resultType: "complete"`; server/discover e tools/list levam ttlMs e cacheScope (dica de cache
         obrigatória nessa revisão: sem ela o Claude Code 2.1.281 recusa a lista e fica sem ferramentas).
         Cabeçalho espelhado ausente é aceito e registrado (loopback, sem intermediário); divergente é recusado.
       · medido em 23/09/2026: o Claude Code 2.1.281 fala a era moderna (server/discover → tools/list → tools/call,
         negotiatedProtocolVersion 2026-07-28, com os três cabeçalhos).
   - Origin presente e que não é desta máquina = 403 (proteção contra "DNS rebinding").

   Ferramentas:
   - navegador_*: delegadas ao módulo do navegador próprio (app/navegador/navegador.js, §9). Sem Electron (servidor
     sozinho), respondem "navegador disponível só no app". Campo de senha nunca é preenchido pelo agente.
   - coop_*: a tela local (app/interface/coop-ui.js) executa com L.fazer e assina "<agente> · <pessoa>".
     Ida e volta: servidor → tela `mcp-chamada {cid, sessao, ferramenta, args, agente:{id,nome,dono}}`;
     tela → servidor `mcp-resposta {cid, ok, resultado|erro}` (entregue a aoMensagemUi); 30 s de prazo.
   - coop_banco_*: também vão para a tela, que chama /api/banco/* (o Postgres local do projeto), monta as peças na Máquina
     e espera a animação 3D antes de responder; por isso o prazo delas é maior (120 s: o primeiro uso liga o banco).
   - coop_abrir, coop_fechar, coop_onde, coop_tela: o terminal comanda a Estação da própria pessoa (abre atividade, arquivo,
     projeto, Máquina em 2D/3D ou perfil; fecha abas; diz onde cada um está e o que está na tela). Só a tela que recebeu a
     chamada troca e nada vai assinado pelo agente, mas o que ela passa a ver é a posição da pessoa, como num clique dela:
     a Estação grava a posição no diário (700 ms parada no objeto) e a equipe vê no endereço; arquivo de outra pessoa avisa
     o dono ("vendoArquivo"); o Chat aberto marca a conversa como lida ("lida"); a Máquina em 3D publica o corpo das peças
     ("corpoPeca"). Edição não salva não se perde: com texto digitado no modo Editar ou mudança visual pendente,
     abrir outra coisa é recusado e fechar deixa essa aba aberta (a resposta diz qual).

   Uso no servidor.js (quem liga é o agente das rotas /mcp):
     const coop = require('./coop-mcp').criar({ cfg: () => cfg, enviarUi: paraLocais, pedirUi, navegador, agentes });
     POST|GET|DELETE /mcp/<sessao>  →  (depois de conferir o segredo da sessão)  coop.tratar(req, res, sessao, agente)
     mensagem local {tipo:'mcp-resposta'}  →  coop.aoMensagemUi(m)
   `tratar` lê o corpo sozinho; se o servidor já tiver lido, ponha o texto (ou o objeto) em req.coopCorpo antes.
   Segredo da sessão: prefira um cabeçalho (ex.: "headers": {"X-Coop-Segredo": "…"} no --mcp-config) a pô-lo na URL
   (o log de depuração do Claude Code imprime a URL). Segredo errado = 403, nunca 401: o transporte http do Claude Code
   tem provedor de OAuth ("hasAuthProvider": true) e um 401 o faria começar um fluxo de login.
   pedirUi deve mandar a mcp-chamada só às telas locais (Estação e TV desta máquina); quem executa é a Estação líder.
   Nada vai para o disco: o registro das chamadas fica só em memória (as últimas 200, sem argumentos nem respostas).
*/
'use strict';
const path = require('path');
const crypto = require('crypto');

const VERSAO_APP = (() => { try { return require('../package.json').version; } catch (e) { return '0.0.0'; } })();
const VERSOES_MODERNAS = ['2026-07-28'];
const VERSOES_LEGADAS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const TODAS_AS_VERSOES = VERSOES_MODERNAS.concat(VERSOES_LEGADAS);
const META_VERSAO = 'io.modelcontextprotocol/protocolVersion';
const TEMPO_UI = 30000;
const TEMPO_UI_BANCO = 120000;
const MAX_CORPO = 1024 * 1024;
const MAX_PENDENTES = 32;
const MAX_TEXTO_RESULTADO = 100000;
/* era moderna: server/discover e tools/list levam dica de cache (obrigatória em 2026-07-28, server/utilities/caching).
   A lista é igual para todo mundo (public) e só muda com o app novo; 5 min de validade. */
const CACHE = { ttlMs: 300000, cacheScope: 'public' };

const ERRO = { PARSE: -32700, PEDIDO: -32600, METODO: -32601, PARAMS: -32602, INTERNO: -32603, CABECALHO: -32020, VERSAO: -32022 };

const INSTRUCOES = 'Conector do babel-coop. As ferramentas coop_* mexem no app da equipe (TV, avisos, mural, demandas, campanhas, ' +
  'acervo, aprendizados, a Máquina dos projetos) e cada ação fica assinada "<agente> · <pessoa>" para todo mundo ver. As ferramentas navegador_* controlam ' +
  'o navegador próprio do babel-coop, à vista da pessoa, na aba do meio: nunca abra o Google Chrome nem outro navegador. ' +
  'Senhas só a pessoa digita. Antes de criar algo, consulte (coop_buscar, coop_pessoas, coop_projetos). ' +
  'Para montar o banco do projeto use coop_banco_sql (a Máquina anima ao vivo), e para dados de teste coop_banco_consulta. ' +
  'Quando a pessoa pedir para abrir, mostrar ou ir para algo (uma tela da barra, um arquivo, um projeto, a Máquina, o perfil de alguém), use coop_abrir; ' +
  'coop_tela diz o que ela está vendo, coop_onde diz onde cada um está e coop_fechar fecha abas. Essas quatro trocam só a tela da própria pessoa, ' +
  'mas valem como um clique dela: o que ela passa a ver vira a posição dela, que a equipe vê no endereço. Abra só o que ela pediu.';

/* ---------- as ferramentas (ordem fixa: o cliente pode guardar a lista) ---------- */
const texto = (descricao, max) => ({ type: 'string', description: descricao, maxLength: max || 2000 });
const PESSOA = texto('Nome ou id da pessoa da equipe (ex.: "Carla"). Veja coop_pessoas.', 80);
const PRAZO = texto('Data limite: "30/09", "30/09/2026" ou "2026-09-30". Vale até as 18h do dia.', 20);
const nada = () => ({ type: 'object', properties: {}, additionalProperties: false });

/* ações do app que o agente pode pedir por coop_acao (a mesma lista vale na tela, em coop-ui.js).
   Fora da lista, de propósito: aprovar/devolver/cancelar trabalho dos outros, controle de terminal, gravar a sala,
   transmissão, WhatsApp para cliente, fotos e perfil, loja/chaves, Oficina e arquivos (o agente grava arquivo de
   verdade com as ferramentas dele, na pasta compartilhada). */
const ACOES_PERMITIDAS = [
  'novaDemanda', 'pegar', 'comecar', 'pausar', 'retomar', 'pronta', 'perguntar', 'responder', 'travado', 'cutucar', 'valeu',
  'aprendizado', 'confirmar', 'novaTarefa', 'concluirEtapa', 'marcarChecklist', 'mensagem',
  'aviso', 'recado', 'projetar', 'pagina', 'rolarProjecao', 'rolarProjecaoPara', 'encerrarProjecao', 'tvSite', 'tvModo', 'visita',
  'cronometroTv', 'pararCronometroTv', 'novaCampanha', 'desfazerCampanha', 'maisUmCliente',
  'iniciarReuniao', 'jogarNaReuniao', 'destacar', 'pauta', 'marcarPauta', 'decisao', 'proximo',
  'ideia', 'apoiar', 'responderPergunta', 'guardarMomento', 'sonhar',
  'novoProjeto', 'entrarProjeto', 'proximoPasso', 'mensagemProjeto', 'chamarParaTela', 'fazendo',
  'quadroItem', 'quadroMudar',
  'maquinaPeca', 'maquinaLigar'
];

const FERRAMENTAS = [
  /* ---- navegador próprio (§9) ---- */
  { name: 'navegador_abrir', title: 'Abrir endereço no navegador do babel-coop', annotations: { openWorldHint: true },
    description: 'Abre um endereço (http ou https) ou um arquivo HTML da pasta compartilhada no navegador do agente, dentro do babel-coop, na aba do meio que a pessoa vê. ' +
      'Arquivo: passe o caminho (ex.: /Users/.../BabelCoop/theus/sites/lp/index.html, ~/..., ou file://); fora da pasta compartilhada, copie a pasta do site para dentro dela antes. ' +
      'Nunca sirva arquivos com python nem outro servidor local: o navegador recusa localhost/127.0.0.1 vindo do agente. Nunca use o Google Chrome.',
    inputSchema: { type: 'object', properties: { url: texto('Endereço (https://exemplo.com.br) ou caminho de um arquivo da pasta compartilhada', 2048) }, required: ['url'], additionalProperties: false } },
  { name: 'navegador_clicar', title: 'Clicar na página', annotations: { openWorldHint: true },
    description: 'Clica num elemento da página aberta, por seletor CSS ou pelo texto visível (um dos dois). O cursor do agente aparece na página.',
    inputSchema: { type: 'object', properties: { seletor: texto('Seletor CSS, ex.: button[type=submit]', 500), texto: texto('Texto visível do botão ou link', 200) }, additionalProperties: false } },
  { name: 'navegador_digitar', title: 'Digitar num campo', annotations: { openWorldHint: true },
    description: 'Digita num campo da página. Campo de senha é recusado: a pessoa digita a senha.',
    inputSchema: { type: 'object', properties: { seletor: texto('Seletor CSS do campo', 500), texto: texto('O que digitar', 5000) }, required: ['seletor', 'texto'], additionalProperties: false } },
  { name: 'navegador_ler', title: 'Ler a página', annotations: { readOnlyHint: true, openWorldHint: true },
    description: 'Devolve o texto da página aberta em Markdown.', inputSchema: nada() },
  { name: 'navegador_raio_x', title: 'Raio-X da página', annotations: { readOnlyHint: true, openWorldHint: true },
    description: 'Raio-X do site aberto: DOM resumido, estilos, fontes, cores, copy em ordem, rede e console. Com seletor, foca num elemento.',
    inputSchema: { type: 'object', properties: { seletor: texto('Seletor CSS (opcional)', 500) }, additionalProperties: false } },
  /* inspeção até o osso, só leitura (nada de código livre na página nem comando livre de CDP) */
  { name: 'navegador_codigo', title: 'Código da página', annotations: { readOnlyHint: true, openWorldHint: true },
    description: 'Sem url: lista os recursos carregados (documentos, scripts, estilos, imagens, fontes) com tipo e tamanho. Com url (de um desses recursos, ou de um fetch da página): devolve o conteúdo (JS, CSS, o HTML original) e o source map quando existe. url "dom" devolve o DOM vivo serializado. Só leitura.',
    inputSchema: { type: 'object', properties: { url: texto('Endereço de um recurso da lista, ou "dom" para o DOM vivo', 2048), max: { type: 'integer', minimum: 1000, maximum: 400000, description: 'Máximo de caracteres do conteúdo (padrão 100000)' } }, additionalProperties: false } },
  { name: 'navegador_rede', title: 'Rede da página', annotations: { readOnlyHint: true, openWorldHint: true },
    description: 'Pedidos e respostas gravados desde que a página abriu: método, url, status, cabeçalhos (autorização redigida), tempos e, com corpo = true, o corpo das respostas (até 10). Só leitura.',
    inputSchema: { type: 'object', properties: { filtro: texto('Parte da url, do método, do tipo ou do status (ex.: "api", "POST", "404")', 200), corpo: { type: 'boolean', description: 'Trazer o corpo das respostas (padrão: não)' } }, additionalProperties: false } },
  { name: 'navegador_console', title: 'Console da página', annotations: { readOnlyHint: true, openWorldHint: true },
    description: 'Mensagens e erros do console da página (log, aviso, erro, exceções), com arquivo e linha. Só leitura.',
    inputSchema: { type: 'object', properties: { nivel: { type: 'string', enum: ['log', 'info', 'aviso', 'erro', 'debug'], description: 'Só um nível (opcional)' } }, additionalProperties: false } },
  { name: 'navegador_armazenamento', title: 'Cookies e armazenamento', annotations: { readOnlyHint: true, openWorldHint: true },
    description: 'Cookies da partição do navegador do agente para a página aberta, localStorage e sessionStorage. Nada com cara de senha é devolvido. Só leitura.', inputSchema: nada() },
  /* navegação */
  { name: 'navegador_rolar', title: 'Rolar a página', annotations: { openWorldHint: true },
    description: 'Rola a página: para = "topo", "fim", um seletor CSS ou um texto visível; ou pixels (positivo desce, negativo sobe).',
    inputSchema: { type: 'object', properties: { para: texto('topo, fim, seletor CSS ou texto visível', 500), pixels: { type: 'integer', minimum: -100000, maximum: 100000, description: 'Quantos pixels rolar' } }, additionalProperties: false } },
  { name: 'navegador_esperar', title: 'Esperar na página', annotations: { openWorldHint: true },
    description: 'Espera um seletor ou um texto aparecer (até ms, padrão 10 s, máximo 30 s); só com ms, espera esse tempo.',
    inputSchema: { type: 'object', properties: { seletor: texto('Seletor CSS', 500), texto: texto('Texto visível', 200), ms: { type: 'integer', minimum: 100, maximum: 30000, description: 'Prazo em milissegundos' } }, additionalProperties: false } },
  { name: 'navegador_voltar', title: 'Voltar', annotations: { openWorldHint: true }, description: 'Volta para a página anterior do navegador do agente.', inputSchema: nada() },
  { name: 'navegador_avancar', title: 'Avançar', annotations: { openWorldHint: true }, description: 'Avança para a página seguinte do navegador do agente.', inputSchema: nada() },
  { name: 'navegador_recarregar', title: 'Recarregar', annotations: { openWorldHint: true }, description: 'Recarrega a página aberta.', inputSchema: nada() },
  { name: 'navegador_teclas', title: 'Apertar teclas', annotations: { openWorldHint: true },
    description: 'Aperta teclas na página, no elemento com foco: Enter, Tab, Shift+Tab, Esc, setas (cima, baixo, esquerda, direita), Backspace, Delete, Home, End, PageUp, PageDown, Espaço. Várias separadas por espaço ("Tab Tab Enter"). Com o foco num campo de senha é recusado: a senha é da pessoa.',
    inputSchema: { type: 'object', properties: { teclas: texto('Ex.: "Enter", "Tab Tab Enter", "Shift+Tab", "baixo baixo Enter"', 300) }, required: ['teclas'], additionalProperties: false } },
  { name: 'navegador_arquivo_baixar', title: 'Baixar arquivo', annotations: { openWorldHint: true },
    description: 'Baixa um arquivo (http ou https; relativo à página aberta) com os cookies do navegador do agente e salva em Downloads/ da pasta compartilhada (até 100 MB).',
    inputSchema: { type: 'object', properties: { url: texto('Endereço do arquivo', 2048) }, required: ['url'], additionalProperties: false } },
  { name: 'navegador_clonar', title: 'Clonar a página', annotations: { openWorldHint: true },
    description: 'Clona a página aberta (HTML, CSS, imagens e fontes) em Clones/<site>/ da pasta compartilhada, que abre como site.',
    inputSchema: { type: 'object', properties: { pasta: texto('Subpasta da pasta compartilhada (padrão: Clones)', 200) }, additionalProperties: false } },
  { name: 'navegador_copy', title: 'Tirar a copy da página', annotations: { openWorldHint: true },
    description: 'Gera copy.md com o texto da página por seção, em Clones/<site>/ da pasta compartilhada.', inputSchema: nada() },
  { name: 'navegador_print', title: 'Print da página inteira', annotations: { openWorldHint: true },
    description: 'Tira um print da página inteira (PNG) em Clones/<site>/ da pasta compartilhada.', inputSchema: nada() },

  /* ---- o app (executadas pela tela local, assinadas "<agente> · <pessoa>") ---- */
  { name: 'coop_tv', title: 'Mudar a TV da sala', annotations: { destructiveHint: false },
    description: 'Muda o que a TV da sala mostra: painel, reuniao, quadro, visita (ligado true/false, só a gestão) ou site (com url).',
    inputSchema: { type: 'object', properties: { modo: { type: 'string', enum: ['painel', 'reuniao', 'quadro', 'visita', 'site'], description: 'O modo da TV' }, url: texto('Endereço, quando modo = site', 2048), ligado: { type: 'boolean', description: 'Modo visita: ligar (padrão) ou desligar' } }, required: ['modo'], additionalProperties: false } },
  { name: 'coop_projetar', title: 'Projetar arquivo na TV', annotations: { destructiveHint: false },
    description: 'Projeta um arquivo do acervo na TV (pelo nome ou pelo caminho).',
    inputSchema: { type: 'object', properties: { arquivo: texto('Nome ou caminho do arquivo, ex.: precos.md', 300) }, required: ['arquivo'], additionalProperties: false } },
  { name: 'coop_aviso', title: 'Aviso oficial na TV', annotations: { destructiveHint: false },
    description: 'Manda um aviso oficial para a TV (só quem é da gestão). Para recado de qualquer um, use coop_mural.',
    inputSchema: { type: 'object', properties: { texto: texto('O aviso, curto', 280) }, required: ['texto'], additionalProperties: false } },
  { name: 'coop_mural', title: 'Recado no mural da TV', annotations: { destructiveHint: false },
    description: 'Deixa um recado no mural da TV.',
    inputSchema: { type: 'object', properties: { texto: texto('O recado, curto', 280) }, required: ['texto'], additionalProperties: false } },
  { name: 'coop_ideia', title: 'Registrar uma ideia', annotations: { destructiveHint: false },
    description: 'Registra uma ideia da pessoa; ela aparece na TV e na lista de ideias.',
    inputSchema: { type: 'object', properties: { texto: texto('A ideia', 500) }, required: ['texto'], additionalProperties: false } },
  { name: 'coop_demanda', title: 'Criar uma demanda', annotations: { destructiveHint: false },
    description: 'Cria uma demanda para uma pessoa da equipe (sem "para", fica livre: pega quem puder).',
    inputSchema: { type: 'object', properties: { titulo: texto('Título da demanda', 120), para: PESSOA, prazo: PRAZO, descricao: texto('Detalhes (opcional)', 2000), prioridade: { type: 'string', enum: ['baixa', 'média', 'alta'] }, estimativa_min: { type: 'integer', minimum: 1, maximum: 10000, description: 'Estimativa em minutos' } }, required: ['titulo'], additionalProperties: false } },
  { name: 'coop_campanha', title: 'Criar uma campanha', annotations: { destructiveHint: false },
    description: 'Cria uma campanha com meta numérica para uma pessoa, até um prazo. Vira a campanha principal da TV. Ex.: nome "50 clientes", meta 50, para "Carla", prazo "30/09".',
    inputSchema: { type: 'object', properties: { nome: texto('Nome da campanha, ex.: "50 clientes"', 80), meta: { type: 'integer', minimum: 1, maximum: 1000000, description: 'Número a alcançar' }, para: PESSOA, prazo: PRAZO, unidade: texto('O que se conta (padrão: tirado do nome, ex.: "clientes")', 40), principal: { type: 'boolean', description: 'Vira a campanha da TV (padrão: sim)' } }, required: ['nome', 'meta', 'para', 'prazo'], additionalProperties: false } },
  { name: 'coop_meta', title: 'Meta da campanha', annotations: { destructiveHint: false },
    description: 'Sem argumentos, mostra a meta da campanha principal. Com "mais", registra N clientes fechados (a TV comemora quando bate).',
    inputSchema: { type: 'object', properties: { mais: { type: 'integer', minimum: 1, maximum: 20, description: 'Quantos clientes a mais' } }, additionalProperties: false } },
  { name: 'coop_buscar', title: 'Buscar no acervo', annotations: { readOnlyHint: true },
    description: 'Busca no acervo da equipe (arquivos, aprendizados, atas, demandas, históricos de terminal, clones) sem LLM, por palavras e por semelhança, nas Estações ligadas. Use antes de responder ou criar algo e cite quem ensinou.',
    inputSchema: { type: 'object', properties: { termo: texto('O que procurar', 200), modo: { type: 'string', enum: ['tudo', 'palavras', 'semelhanca'], description: 'tudo (padrão), só palavras (BM25) ou só semelhança (vetores)' } }, required: ['termo'], additionalProperties: false } },
  { name: 'coop_aprendi', title: 'Registrar um aprendizado', annotations: { destructiveHint: false },
    description: 'Registra algo que a equipe aprendeu (se já era conhecido, soma +1 no aprendizado parecido). Se um aprendizado da lista está errado, registre o certo e passe corrige com o cartão dele (ex.: apr-002): o errado sai de APRENDIZADOS.md.',
    inputSchema: { type: 'object', properties: { texto: texto('O aprendizado, uma frase', 500), corrige: texto('Cartão do aprendizado errado que este substitui (ex.: apr-002)', 60) }, required: ['texto'], additionalProperties: false } },
  { name: 'coop_ler', title: 'Ler um item do acervo', annotations: { readOnlyHint: true },
    description: 'Lê um item inteiro do acervo (arquivo, aprendizado, ata, histórico de terminal…) pelo id que o coop_buscar devolveu, pelo cartão (ex.: apr-003) ou pelo caminho do arquivo.',
    inputSchema: { type: 'object', properties: { id: texto('Id do item (ex.: "apr:theus:12") ou o cartão (ex.: "apr-003")', 300), caminho: texto('Caminho do arquivo na pasta compartilhada, ex.: "propostas/clinica.md"', 500) }, additionalProperties: false } },
  { name: 'coop_aprendizados', title: 'Aprendizados mais usados', annotations: { readOnlyHint: true },
    description: 'Os aprendizados da equipe mais usados, com quem ensinou, quantas vezes foi usado e confirmado. Leia ao começar um trabalho.',
    inputSchema: { type: 'object', properties: { limite: { type: 'integer', minimum: 1, maximum: 50, description: 'Quantos (padrão 20)' } }, additionalProperties: false } },
  { name: 'coop_momento', title: 'Guardar os últimos 5 minutos da sala', annotations: { destructiveHint: false },
    description: 'Guarda no acervo os últimos 5 minutos do que foi dito na sala (quando a memória da sala está ligada).', inputSchema: nada() },
  { name: 'coop_sonhar', title: 'Sonhar agora', annotations: { destructiveHint: false },
    description: 'Roda o "sonho" que refina o dia: junta aprendizados novos e temas.', inputSchema: nada() },
  { name: 'coop_pessoas', title: 'Pessoas da equipe', annotations: { readOnlyHint: true },
    description: 'Lista as pessoas da equipe: nome, id, papel, área, se está online e os agentes de cada uma.', inputSchema: nada() },
  { name: 'coop_projetos', title: 'Projetos da equipe', annotations: { readOnlyHint: true },
    description: 'Lista os projetos: nome, membros, pasta e próximos passos.', inputSchema: nada() },
  { name: 'coop_demandas', title: 'Demandas abertas', annotations: { readOnlyHint: true },
    description: 'Lista as demandas abertas (de uma pessoa, ou as da pessoa dona deste agente) e as livres.',
    inputSchema: { type: 'object', properties: { pessoa: PESSOA }, additionalProperties: false } },
  /* ---- a Máquina (backend visual do projeto, prototipo/maquina.js): o agente lê o sistema real e monta as peças; a tela aplica ---- */
  { name: 'coop_maquina', title: 'Ler a Máquina de um projeto', annotations: { readOnlyHint: true },
    description: 'Mostra a Máquina (o backend visual) de um projeto: as peças (gaveta = tabela, porta = rota/função, robô = gatilho/agenda, tela, cano = tempo real, depósito = arquivos, portaria = login, cofre = segredos), os fios entre elas, o que está publicado e o que ainda está no local. Sem projeto: o primeiro projeto da equipe.',
    inputSchema: { type: 'object', properties: { projeto: texto('Nome ou id do projeto (veja coop_projetos)', 120) }, additionalProperties: false } },
  { name: 'coop_maquina_peca', title: 'Montar uma peça na Máquina', annotations: { destructiveHint: false },
    description: 'Monta uma peça na Máquina de um projeto a partir do sistema real (leia o código antes: tabelas, rotas, gatilhos, telas). A peça entra tracejada na tela de todos, assinada "<agente> · <pessoa>", e ganha corpo quando a pessoa publicar. de/para ligam a peça nova a uma que já existe (pelo nome). Uma Tela não liga direto numa Gaveta: passa por uma Porta.',
    inputSchema: { type: 'object', properties: {
      projeto: texto('Nome ou id do projeto (padrão: o primeiro)', 120),
      tipo: { type: 'string', enum: ['gaveta', 'porta', 'robo', 'tela', 'cano', 'deposito', 'portaria', 'cofre', 'carteiro', 'empresa'], description: 'gaveta = tabela · porta = rota, Edge Function ou RPC · robo = gatilho, cron ou webhook · tela = página · cano = tempo real ou fila · deposito = bucket · portaria = login · cofre = segredos (só nomes) · carteiro = e-mail/SMS · empresa = separação por empresa' },
      nome: texto('Nome curto, como está no sistema (ex.: "pacientes", "novo agendamento")', 60),
      frase: texto('O que a peça faz, numa frase simples', 200),
      campos: { type: 'array', maxItems: 30, description: 'Gaveta: colunas "nome (tipo)", ex.: "nascimento (data)", "clinica (ligação com clinicas)". Porta: o que recebe.', items: { type: 'string' } },
      chave: { type: 'string', enum: ['cada empresa vê só o seu', 'só o dono', 'todos leem, só o dono muda', '⚠ aberta para todos'], description: 'Gaveta: quem pode ver e mexer (a política de acesso real; sem política = aberta para todos)' },
      verbo: { type: 'string', enum: ['RECEBE', 'DEVOLVE'], description: 'Porta: grava um registro (RECEBE) ou devolve uma lista (DEVOLVE)' },
      login: { type: 'boolean', description: 'Porta: confere o login (padrão sim)' },
      quando: texto('Robô: quando dispara, ex.: "quando entra", "todo dia às 08:00"', 60),
      de: texto('Liga uma peça existente À nova (nome ou id), ex.: a tela que chama esta porta', 80),
      para: texto('Liga a nova A uma peça existente (nome ou id), ex.: a gaveta onde esta porta grava', 80)
    }, required: ['tipo', 'nome'], additionalProperties: false } },
  { name: 'coop_maquina_ligar', title: 'Ligar duas peças da Máquina', annotations: { destructiveHint: false },
    description: 'Liga duas peças que já estão na Máquina (fio de "de" para "para", pelo nome ou id). O pulso do teste anda nessa direção: tela → porta → gaveta → robô/cano.',
    inputSchema: { type: 'object', properties: { projeto: texto('Nome ou id do projeto (padrão: o primeiro)', 120), de: texto('Peça de onde sai o fio', 80), para: texto('Peça onde o fio chega', 80) }, required: ['de', 'para'], additionalProperties: false } },
  /* ---- o banco de verdade do projeto (Postgres local deste computador): a tela chama /api/banco/* e a Máquina anima em 3D ---- */
  { name: 'coop_banco_sql', title: 'Construir o banco do projeto', annotations: { destructiveHint: true },
    description: 'Constrói o banco de verdade do projeto (Postgres local deste computador): cria/altera tabelas, vínculos, regras de acesso (RLS), funções e gatilhos. Cada comando vira peça viva na Máquina, em 3D, na hora; a migração fica gravada na pasta do projeto. ' +
      'Roda numa transação, comando a comando: se o Postgres recusar, nada é gravado e a resposta traz o erro dele. Cada migração tem até 30 s; passou disso, o Postgres local para no meio e desfaz tudo. ' +
      'A chave de cada gaveta (quem pode ver e mexer) sai da regra de verdade da política (USING/WITH CHECK), não do nome dela. É o banco local deste computador (cada Estação tem o seu; a Máquina diz de quem é cada peça); a nuvem vem depois. Para dados de teste, use coop_banco_consulta.',
    inputSchema: { type: 'object', properties: {
      projeto: texto('Nome ou id do projeto (veja coop_projetos)', 120),
      sql: texto('O SQL da migração: CREATE TABLE, ALTER TABLE, CREATE POLICY, CREATE FUNCTION, CREATE TRIGGER…', 200000),
      nome: texto('Nome curto da migração, vira o nome do arquivo (ex.: "cria pacientes")', 80)
    }, required: ['projeto', 'sql'], additionalProperties: false } },
  { name: 'coop_banco_consulta', title: 'Dados de teste no banco', annotations: { destructiveHint: true },
    description: 'Insere, muda ou lê dados de teste no banco local do projeto (INSERT, UPDATE, DELETE, SELECT) e mostra os dados entrando nas gavetas da Máquina, com o número real de linhas. Devolve até 50 linhas e o total. Até 30 s por consulta: consulta sem fim é interrompida e desfeita. ' +
      'Mudar a estrutura aqui (tabela, coluna, regra, função, gatilho, permissão, schema) é desfeito: use coop_banco_sql.',
    inputSchema: { type: 'object', properties: {
      projeto: texto('Nome ou id do projeto (veja coop_projetos)', 120),
      sql: texto('Um comando de dados, ex.: INSERT INTO pacientes (nome) VALUES (\'Pessoa de teste\')', 100000)
    }, required: ['projeto', 'sql'], additionalProperties: false } },
  { name: 'coop_banco_estado', title: 'Ler o banco do projeto', annotations: { readOnlyHint: true },
    description: 'Mostra o banco local do projeto como está agora: tabelas com colunas, regra de acesso (RLS) e número de linhas, vínculos, políticas com a regra de verdade, funções e gatilhos. Só leitura.',
    inputSchema: { type: 'object', properties: { projeto: texto('Nome ou id do projeto (veja coop_projetos)', 120) }, required: ['projeto'], additionalProperties: false } },
  /* ---- a Estação da pessoa: o terminal comanda o meio e a barra (só a tela que recebeu a chamada troca; o que ela vê vira a posição dela) ---- */
  { name: 'coop_abrir', title: 'Abrir na Estação', annotations: { destructiveHint: false },
    description: 'Abre algo no meio da Estação da pessoa, com a luz de chegada para ela ver que foi o agente. ' +
      'o = "atividade" (ref: Meu dia, Criar, Trabalho, Chat, WhatsApp, Reunião, Terminais, Projetos, Acervo, Equipe, Loja ou Oficina; também Demandas, Tarefas, Inteligência, Metas e Mapa), ' +
      '"arquivo" (ref: caminho na pasta compartilhada, ex.: "propostas/clinica.md", ou só o nome do arquivo), "projeto" (ref: nome do projeto), ' +
      '"maquina" (ref: nome do projeto, sem ref o primeiro; modo "2d" ou "3d") ou "pessoa" (ref: nome; abre o perfil). ' +
      'Use sempre que a pessoa pedir para abrir, mostrar ou ir para algo, e só o que ela pediu. Troca só a tela desta Estação, mas vale como um clique da pessoa: ' +
      'o que abre vira a posição dela, que a equipe vê no endereço; arquivo de outra pessoa avisa o dono que ela está vendo; o Chat aberto marca a conversa como lida. ' +
      'Se a pessoa está editando um arquivo sem salvar, recusa em vez de jogar fora o texto: peça para ela salvar ou cancelar.',
    inputSchema: { type: 'object', properties: {
      o: { type: 'string', enum: ['atividade', 'arquivo', 'projeto', 'maquina', 'pessoa'], description: 'O que abrir' },
      ref: texto('A atividade, o caminho ou nome do arquivo, o projeto ou a pessoa (sem acento e sem maiúscula também vale)', 1000),
      modo: { type: 'string', enum: ['2d', '3d'], description: 'Só na Máquina: em 2D (padrão) ou em 3D' }
    }, required: ['o'], additionalProperties: false } },
  { name: 'coop_fechar', title: 'Fechar abas na Estação', annotations: { destructiveHint: false },
    description: 'Fecha abas do meio da Estação da pessoa: o = "tudo" fecha todas (o meio fica vazio); o = "aba" fecha a aba com esse título (ref, ex.: "proposta.md", "Projetos", "Máquina") ou, sem ref, a aba ativa. Nada é apagado: só sai da tela. ' +
      'Aba com edição não salva (texto digitado no modo Editar ou mudança visual pendente) não fecha: a resposta diz qual ficou, para a pessoa salvar ou descartar.',
    inputSchema: { type: 'object', properties: { o: { type: 'string', enum: ['tudo', 'aba'], description: 'Fechar todas ou uma aba' }, ref: texto('Título da aba (ou parte dele), quando o = aba', 200) }, required: ['o'], additionalProperties: false } },
  { name: 'coop_onde', title: 'Onde está cada um', annotations: { readOnlyHint: true },
    description: 'Onde está agora cada pessoa e cada agente da equipe, no endereço Sala › bancada › peça (ex.: "Clínicas › Máquina › pacientes"), com o que está fazendo e há quanto tempo. Com pessoa (nome de pessoa ou de agente), só ela e o rastro: por onde passou. Só leitura.',
    inputSchema: { type: 'object', properties: { pessoa: texto('Nome de uma pessoa ou de um agente (opcional)', 80) }, additionalProperties: false } },
  { name: 'coop_tela', title: 'O que está na tela', annotations: { readOnlyHint: true },
    description: 'O que está aberto agora na Estação da pessoa: a aba ativa (com o endereço), as abas abertas e a atividade da barra. Leia antes de agir quando a pessoa falar de "isso aqui" ou "esse arquivo". Só leitura.', inputSchema: nada() },
  { name: 'coop_acao', title: 'Outra ação do app', annotations: { destructiveHint: false },
    description: 'Qualquer outra ação do app da lista permitida, com os argumentos na ordem da ação (sem o "quem"). Prefira as ferramentas coop_* específicas.',
    inputSchema: { type: 'object', properties: { acao: { type: 'string', enum: ACOES_PERMITIDAS, description: 'Nome da ação' }, args: { type: 'array', maxItems: 6, description: 'Argumentos da ação, na ordem', items: {} } }, required: ['acao'], additionalProperties: false } }
];
const POR_NOME = new Map(FERRAMENTAS.map((f) => [f.name, f]));
/* com o acervo ligado (opcoes.acervo), estas respondem no servidor; sem ele, vão para a tela como antes */
const FERRAMENTAS_ACERVO = ['coop_buscar', 'coop_ler', 'coop_aprendi', 'coop_aprendizados'];

/* ---------- validação dos argumentos pelo próprio inputSchema (o bastante para estes esquemas rasos) ---------- */
function tipoDe(v) { return Array.isArray(v) ? 'array' : v === null ? 'null' : Number.isInteger(v) ? 'integer' : typeof v; }
function validar(esquema, args) {
  if (args == null) args = {};
  if (tipoDe(args) !== 'object') return 'os argumentos têm de ser um objeto';
  for (const k of esquema.required || []) if (args[k] == null || args[k] === '') return 'faltou "' + k + '"';
  for (const k of Object.keys(args)) {
    const p = (esquema.properties || {})[k];
    if (!p) { if (esquema.additionalProperties === false) return 'argumento desconhecido: "' + k + '"'; continue; }
    const v = args[k];
    if (v == null) continue;
    const t = tipoDe(v);
    const esperado = p.type;
    if (esperado === 'integer' ? t !== 'integer' : esperado === 'number' ? typeof v !== 'number' : esperado && esperado !== t) return '"' + k + '" tem de ser ' + ({ string: 'texto', integer: 'número inteiro', boolean: 'verdadeiro ou falso', array: 'lista', object: 'objeto' }[esperado] || esperado);
    if (p.enum && !p.enum.includes(v)) return '"' + k + '" tem de ser um de: ' + p.enum.join(', ');
    if (t === 'string' && p.maxLength && v.length > p.maxLength) return '"' + k + '" passou de ' + p.maxLength + ' caracteres';
    if (t === 'integer' && ((p.minimum != null && v < p.minimum) || (p.maximum != null && v > p.maximum))) return '"' + k + '" fora do intervalo ' + p.minimum + '–' + p.maximum;
    if (t === 'array' && p.maxItems != null && v.length > p.maxItems) return '"' + k + '" com itens demais (máximo ' + p.maxItems + ')';
  }
  return null;
}

/* cabeçalho que pode vir em Base64 (Mcp-Name: =?base64?...?=) */
function decodificarCabecalho(v) {
  if (typeof v !== 'string') return v;
  const m = /^=\?base64\?(.*)\?=$/.exec(v);
  if (!m) return v;
  try { return Buffer.from(m[1], 'base64').toString('utf8'); } catch (e) { return null; }
}

function origemLocal(origem, host) {
  if (!origem) return true;
  let u; try { u = new URL(origem); } catch (e) { return false; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  const h = u.hostname.replace(/^\[|\]$/g, '');
  if (!['localhost', '127.0.0.1', '::1'].includes(h)) return false;
  /* mesma porta do servidor, quando dá para saber */
  const porta = String(host || '').match(/:(\d+)$/);
  return !porta || !u.port || u.port === porta[1];
}

/* texto do resultado de uma ferramenta: string, {texto}, {markdown} ou JSON */
function textoDoResultado(r) {
  if (r == null) return 'feito';
  if (typeof r === 'string') return r;
  if (typeof r.texto === 'string') return r.texto;
  if (typeof r.markdown === 'string') return r.markdown;
  try { return JSON.stringify(r, null, 2); } catch (e) { return String(r); }
}
const cortar = (s) => (s.length > MAX_TEXTO_RESULTADO ? s.slice(0, MAX_TEXTO_RESULTADO) + '\n… (cortado em ' + MAX_TEXTO_RESULTADO + ' caracteres)' : s);

/* campo de senha: o agente nunca digita (o navegador também confere o tipo do campo no DOM) */
const PARECE_SENHA = /pass(word|wd)?\b|senha|\bpwd\b|type\s*=\s*["']?password/i;

/* navegador_codigo em texto que o modelo lê bem: a lista, uma linha por recurso; o conteúdo, cru, com um cabeçalho */
function formatarCodigo(r) {
  if (!r || typeof r !== 'object') return { valor: r };
  if (Array.isArray(r.recursos)) {
    const linhas = r.recursos.map((x) => '- ' + x.tipo + ' · ' + (x.mime || '?') + (x.bytes ? ' · ' + x.bytes + ' B' : '') + (x.falhou ? ' · falhou' : '') + (x.quadro === 'filho' ? ' · quadro filho' : '') + ' · ' + x.url);
    return { valor: { texto: r.total + ' recursos em ' + r.url + ':\n' + linhas.join('\n') + '\n\nPara ler um: navegador_codigo com url = o endereço. url "dom" = o DOM vivo.' }, dados: { url: r.url, porTipo: r.porTipo, total: r.total } };
  }
  const cab = '/* ' + r.url + ' · ' + (r.tipo || '') + ' · ' + (r.mime || '') + ' · ' + r.bytes + ' bytes' + (r.cortado ? ' · cortado' : '') + ' */';
  if (r.binario) return { valor: { texto: cab + '\n' + r.nota }, dados: { url: r.url, tipo: r.tipo, mime: r.mime, bytes: r.bytes, binario: true } };
  let t = cab + '\n' + (r.conteudo || '');
  const sm = r.sourceMap;
  if (sm) t += '\n\n/* source map: ' + (sm.url || sm.ref) + (sm.erro ? ' · não abriu: ' + sm.erro : ' · ' + sm.bytes + ' bytes · fontes: ' + (sm.fontes || []).join(', ')) + ' */' + (sm.conteudo ? '\n' + sm.conteudo : '');
  return { valor: { texto: t }, dados: { url: r.url, tipo: r.tipo, mime: r.mime, bytes: r.bytes, cortado: !!r.cortado, sourceMap: sm ? { url: sm.url || sm.ref, fontes: sm.fontes || [], erro: sm.erro } : null } };
}

function criar(opcoes) {
  opcoes = opcoes || {};
  const conf = () => (typeof opcoes.cfg === 'function' ? opcoes.cfg() : opcoes.cfg) || {};
  const enviarUi = typeof opcoes.enviarUi === 'function' ? opcoes.enviarUi : null;
  const pedirUi = typeof opcoes.pedirUi === 'function' ? opcoes.pedirUi : enviarUi;
  const navegador = opcoes.navegador || null;
  const agentes = opcoes.agentes || null;
  const tempoUi = +opcoes.tempoUi || TEMPO_UI;
  /* o banco (ligar o Postgres na primeira vez, a migração, a animação da Máquina) espera mais que as outras */
  const tempoBanco = +opcoes.tempoUiBanco || (+opcoes.tempoUi ? tempoUi : TEMPO_UI_BANCO);
  const aoRegistro = typeof opcoes.registrar === 'function' ? opcoes.registrar : null;
  const pendentes = new Map(); /* cid → {ok, t, ferramenta} */
  const registro = [];

  function registrar(r) {
    registro.push(r);
    if (registro.length > 200) registro.shift();
    if (aoRegistro) { try { aoRegistro(r); } catch (e) { /* o registro nunca derruba a chamada */ } }
  }

  /* ---------- HTTP ---------- */
  function responder(res, status, corpo, cabecalhos) {
    if (res.writableEnded) return;
    const h = Object.assign({ 'Cache-Control': 'no-store' }, cabecalhos || {});
    if (corpo === undefined) { res.writeHead(status, h); res.end(); return; }
    const s = JSON.stringify(corpo);
    h['Content-Type'] = 'application/json; charset=utf-8';
    h['Content-Length'] = Buffer.byteLength(s);
    res.writeHead(status, h);
    res.end(s);
  }
  const erroRpc = (id, code, message, data) => ({ jsonrpc: '2.0', id: id === undefined ? null : id, error: data === undefined ? { code, message } : { code, message, data } });
  const okRpc = (id, result) => ({ jsonrpc: '2.0', id, result });

  function lerCorpo(req) {
    if (req.coopCorpo !== undefined) return Promise.resolve(typeof req.coopCorpo === 'string' ? req.coopCorpo : JSON.stringify(req.coopCorpo));
    return new Promise((ok, falha) => {
      let tam = 0; const partes = [];
      req.on('data', (c) => { tam += c.length; if (tam > MAX_CORPO) { falha(Object.assign(new Error('corpo grande demais'), { status: 413 })); req.destroy(); return; } partes.push(c); });
      req.on('end', () => ok(Buffer.concat(partes).toString('utf8')));
      req.on('error', falha);
    });
  }

  async function tratar(req, res, sessao, agente) {
    const inicio = Date.now();
    const metodoHttp = String(req.method || 'GET').toUpperCase();
    if (metodoHttp !== 'POST') {
      /* sem fluxo SSE (GET) e sem sessão para encerrar (DELETE) */
      registrar({ ts: inicio, sessao, http: metodoHttp, status: 405 });
      return responder(res, 405, erroRpc(null, ERRO.PEDIDO, 'use POST: este servidor MCP não abre fluxo SSE'), { Allow: 'POST' });
    }
    if (!origemLocal(req.headers.origin, req.headers.host)) {
      registrar({ ts: inicio, sessao, http: 'POST', status: 403 });
      return responder(res, 403, erroRpc(null, ERRO.PEDIDO, 'origem recusada'));
    }
    let bruto;
    try { bruto = await lerCorpo(req); } catch (e) { return responder(res, e.status || 400, erroRpc(null, ERRO.PEDIDO, e.message)); }
    let msg;
    try { msg = JSON.parse(bruto); } catch (e) {
      registrar({ ts: inicio, sessao, http: 'POST', status: 400, erro: 'json inválido' });
      return responder(res, 400, erroRpc(null, ERRO.PARSE, 'JSON inválido'));
    }
    const ag = agenteDe(sessao, agente);
    const ctx = { req, res, sessao, agente: ag, inicio, cancelado: false };
    res.on('close', () => { if (!res.writableFinished) ctx.cancelado = true; });

    /* lote (só na era legada 2025-03-26 existia; atendemos por compatibilidade) */
    if (Array.isArray(msg)) {
      if (!msg.length) return responder(res, 400, erroRpc(null, ERRO.PEDIDO, 'lote vazio'));
      const respostas = [];
      for (const m of msg.slice(0, 20)) {
        const r = await processar(m, ctx, true);
        if (r && r.corpo !== undefined) respostas.push(r.corpo);
      }
      return respostas.length ? responder(res, 200, respostas) : responder(res, 202);
    }
    const r = await processar(msg, ctx, false);
    if (ctx.cancelado) return; /* o cliente desistiu: nada mais a mandar */
    return responder(res, r.status, r.corpo);
  }

  function agenteDe(sessao, agente) {
    let a = agente;
    if (!a && agentes && typeof agentes.agente === 'function') { try { a = agentes.agente(sessao); } catch (e) { a = null; } }
    a = a || {};
    const c = conf();
    return { id: String(a.id || sessao || 'agente').slice(0, 64), nome: String(a.nome || 'agente').slice(0, 40), dono: String(a.dono || c.id || '').slice(0, 64) };
  }

  /* uma mensagem JSON-RPC → {status, corpo} (corpo undefined = 202 sem corpo) */
  async function processar(m, ctx, emLote) {
    const cab = ctx.req.headers;
    if (!m || typeof m !== 'object' || m.jsonrpc !== '2.0') return { status: 400, corpo: erroRpc(m && m.id, ERRO.PEDIDO, 'não é JSON-RPC 2.0') };
    const temId = Object.prototype.hasOwnProperty.call(m, 'id') && m.id !== null;
    /* resposta do cliente (nunca pedimos nada a ele) ou notificação: aceita e segue */
    if (typeof m.method !== 'string') {
      if (temId && (m.result !== undefined || m.error !== undefined)) return { status: 202 };
      return { status: 400, corpo: erroRpc(m.id, ERRO.PEDIDO, 'falta o método') };
    }
    if (!temId) {
      registrar({ ts: ctx.inicio, sessao: ctx.sessao, era: 'notificacao', metodo: m.method, status: 202 });
      return { status: 202 };
    }
    if (typeof m.id !== 'string' && typeof m.id !== 'number') return { status: 400, corpo: erroRpc(null, ERRO.PEDIDO, 'id inválido') };
    const params = m.params && typeof m.params === 'object' ? m.params : {};
    const meta = params._meta && typeof params._meta === 'object' ? params._meta : null;
    const versaoCorpo = meta && typeof meta[META_VERSAO] === 'string' ? meta[META_VERSAO] : null;
    const versaoCab = cab['mcp-protocol-version'];
    const moderno = m.method !== 'initialize' && (!!versaoCorpo || VERSOES_MODERNAS.includes(versaoCab));
    const reg = { ts: ctx.inicio, sessao: ctx.sessao, era: moderno ? 'moderna' : 'legada', versao: versaoCorpo || versaoCab || null, metodo: m.method, ua: String(cab['user-agent'] || '').slice(0, 80) || null };
    const fim = (status, corpo, extra) => { registrar(Object.assign(reg, { status, ms: Date.now() - ctx.inicio }, extra || {})); return { status, corpo }; };

    if (moderno) {
      /* era moderna: os cabeçalhos espelham o corpo. Divergência = 400 -32020 (a norma manda).
         Cabeçalho ausente: aceitamos e registramos (aqui é loopback, não há intermediário que roteie pelo cabeçalho,
         e um cliente um pouco fora da norma não pode derrubar o agente da pessoa). */
      const faltou = [];
      if (!versaoCorpo) return fim(400, erroRpc(m.id, ERRO.CABECALHO, 'Header mismatch: MCP-Protocol-Version (' + versaoCab + ') sem _meta["' + META_VERSAO + '"] no corpo'));
      if (versaoCab && versaoCab !== versaoCorpo) return fim(400, erroRpc(m.id, ERRO.CABECALHO, 'Header mismatch: MCP-Protocol-Version (' + versaoCab + ') difere de _meta (' + versaoCorpo + ')'));
      if (!versaoCab) faltou.push('MCP-Protocol-Version');
      if (!VERSOES_MODERNAS.includes(versaoCorpo) && !VERSOES_LEGADAS.includes(versaoCorpo)) return fim(400, erroRpc(m.id, ERRO.VERSAO, 'Unsupported protocol version', { supported: TODAS_AS_VERSOES, requested: versaoCorpo }));
      if (!emLote) {
        const cm = cab['mcp-method'];
        if (cm !== undefined && cm !== m.method) return fim(400, erroRpc(m.id, ERRO.CABECALHO, 'Header mismatch: Mcp-Method (' + cm + ') difere do método ' + m.method));
        if (cm === undefined) faltou.push('Mcp-Method');
        if (m.method === 'tools/call') {
          const cn = cab['mcp-name'];
          if (cn !== undefined && decodificarCabecalho(cn) !== params.name) return fim(400, erroRpc(m.id, ERRO.CABECALHO, 'Header mismatch: Mcp-Name (' + cn + ') difere de ' + params.name));
          if (cn === undefined) faltou.push('Mcp-Name');
        }
      }
      if (faltou.length) reg.cabecalhosAusentes = faltou;
    } else if (m.method !== 'initialize' && versaoCab && !TODAS_AS_VERSOES.includes(versaoCab)) {
      return fim(400, erroRpc(m.id, ERRO.PEDIDO, 'versão do protocolo não suportada: ' + versaoCab + ' (conheço ' + TODAS_AS_VERSOES.join(', ') + ')'));
    }
    const completo = (obj) => (moderno ? Object.assign({ resultType: 'complete' }, obj) : obj);

    switch (m.method) {
      case 'initialize': {
        const pedida = typeof params.protocolVersion === 'string' ? params.protocolVersion : null;
        const versao = VERSOES_LEGADAS.includes(pedida) ? pedida : VERSOES_LEGADAS[0];
        reg.versao = versao; reg.pedida = pedida;
        reg.cliente = params.clientInfo && typeof params.clientInfo.name === 'string' ? (params.clientInfo.name + ' ' + (params.clientInfo.version || '')).trim().slice(0, 80) : null;
        return fim(200, okRpc(m.id, { protocolVersion: versao, capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'coop', title: 'babel-coop', version: VERSAO_APP }, instructions: INSTRUCOES }));
      }
      case 'server/discover':
        return fim(200, okRpc(m.id, completo(Object.assign({ supportedVersions: TODAS_AS_VERSOES, capabilities: { tools: { listChanged: false } }, _meta: { 'io.modelcontextprotocol/serverInfo': { name: 'coop', title: 'babel-coop', version: VERSAO_APP } }, instructions: INSTRUCOES }, CACHE))));
      case 'ping':
        return fim(200, okRpc(m.id, completo({})));
      case 'tools/list':
        return fim(200, okRpc(m.id, moderno ? Object.assign({ resultType: 'complete', tools: FERRAMENTAS }, CACHE) : { tools: FERRAMENTAS }), { ferramentas: FERRAMENTAS.length });
      case 'tools/call': {
        const nome = params.name;
        const f = typeof nome === 'string' && POR_NOME.get(nome);
        if (!f) return fim(200, erroRpc(m.id, ERRO.PARAMS, 'ferramenta desconhecida: ' + String(nome).slice(0, 80)));
        let resultado;
        try { resultado = await chamar(f, params.arguments, ctx); } catch (e) { resultado = { erro: e.message || String(e) }; }
        const corpo = { content: [{ type: 'text', text: cortar(resultado.erro != null ? resultado.erro : textoDoResultado(resultado.valor)) }] };
        if (resultado.erro != null) corpo.isError = true;
        else if (resultado.dados !== undefined) corpo.structuredContent = resultado.dados;
        return fim(200, okRpc(m.id, completo(corpo)), { ferramenta: nome, ok: resultado.erro == null });
      }
      default:
        return fim(moderno ? 404 : 200, erroRpc(m.id, ERRO.METODO, 'método desconhecido: ' + m.method.slice(0, 80)));
    }
  }

  /* ---------- executar uma ferramenta: {valor, dados?} ou {erro} ---------- */
  async function chamar(f, args, ctx) {
    args = args == null ? {} : args;
    const invalido = validar(f.inputSchema, args);
    if (invalido) return { erro: f.name + ': ' + invalido + '.' };
    if (f.name.startsWith('navegador_')) return chamarNavegador(f.name, args, ctx.agente);
    const ac = typeof opcoes.acervo === 'function' ? opcoes.acervo() : opcoes.acervo;
    if (ac && FERRAMENTAS_ACERVO.includes(f.name)) return chamarAcervo(ac, f.name, args, ctx.agente);
    return chamarUi(f.name, args, ctx);
  }

  /* acervo (servidor/acervo.js, IDEIAS §8.1–8.2): buscar, ler, aprendi e aprendizados respondem direto do SQLite da Estação.
     Quem consulta é a pessoa dona do agente (o uso do próprio autor não conta); o aprendizado vai para o diário. */
  async function chamarAcervo(ac, nome, a, ag) {
    const um = (x) => ({ id: x.id, tipo: x.tipo, cartao: x.cartao, titulo: x.titulo, autor: x.autor, dono: x.dono, usos: x.usos, confirmacoes: x.confirmacoes, rotulo: x.rotulo, trecho: x.trecho, quando: x.quando, pontuacao: x.pontuacao, remoto: !!x.remoto });
    try {
      if (nome === 'coop_buscar') {
        const o = { modo: a.modo, quem: ag.dono, limite: 8 };
        const r = typeof ac.buscarEquipe === 'function' ? await ac.buscarEquipe(a.termo, o) : { resultados: ac.buscar(a.termo, o), fichas: [] };
        const linhas = r.resultados.map((x) => '- ' + x.rotulo + (x.remoto ? ' · Estação de ' + (x.donoNome || x.dono) : '') + ' — ' + x.titulo + ': ' + String(x.trecho || '').slice(0, 220) + ' (id ' + x.id + ')');
        (r.fichas || []).forEach((f) => linhas.push('- ' + f.texto));
        return { valor: { texto: r.resultados.length + ' resultado(s) para "' + a.termo + '" no acervo da equipe (sem LLM)' + (linhas.length ? ':\n' + linhas.join('\n') + '\nAo usar algo daqui, cite quem ensinou. Para ler inteiro: coop_ler com o id.' : '.') },
          dados: { termo: a.termo, resultados: r.resultados.map(um), fichas: r.fichas || [] } };
      }
      if (nome === 'coop_ler') {
        const ref = a.id || a.caminho;
        if (!ref) return { erro: 'coop_ler: diga o id (ou o cartão) ou o caminho.' };
        const it = ac.ler(ref, { quem: ag.dono });
        if (!it) return { erro: 'coop_ler: não achei "' + String(ref).slice(0, 200) + '" no acervo desta Estação.' };
        return { valor: { texto: it.rotulo + (it.cartao ? ' · ' + it.cartao : '') + '\n' + it.titulo + '\n\n' + it.texto }, dados: Object.assign(um(it), { origem: it.origem, vizinhos: it.vizinhos }) };
      }
      if (nome === 'coop_aprendi') {
        const r = ac.aprendi(a.texto, ag.dono, 'agente ' + ag.nome, a.corrige || null);
        if (a.corrige && !r.corrigiu) return { erro: 'coop_aprendi: não achei o aprendizado "' + String(a.corrige).slice(0, 60) + '" para corrigir (use o cartão, ex.: apr-002). O novo foi registrado.' };
        return { valor: { texto: r.novo
          ? 'novo: aprendizado registrado' + (r.cartao ? ' (' + r.cartao + ')' : '') + (r.corrigiu ? ', no lugar do errado (' + a.corrige + ')' : '') + ', assinado ' + ag.nome + ' · ' + r.autor + '. A IA de todos vai ler isso.'
          : '+1 confirmado: a equipe já sabia "' + r.texto + '" (' + r.autor + (r.cartao ? ', ' + r.cartao : '') + ', confirmado ' + (r.confirmacoes + 1) + '×, usado ' + r.usos + '×).' },
          dados: { novo: r.novo, item: r.item, cartao: r.cartao, confirmacoes: r.confirmacoes, usos: r.usos } };
      }
      if (nome === 'coop_aprendizados') {
        const lista = ac.aprendizados(a.limite || 20);
        return { valor: { texto: lista.length ? lista.map((x, i) => (i + 1) + '. ' + x.texto + ' — ' + x.autor + ' · usado ' + x.usos + '×' + (x.confirmacoes ? ' · +' + x.confirmacoes + ' confirmado' : '') + (x.cartao ? ' (' + x.cartao + ')' : '')).join('\n') : 'A equipe ainda não registrou aprendizados.' },
          dados: { aprendizados: lista.map((x) => Object.assign(um(x), { texto: x.texto })) } };
      }
    } catch (e) { return { erro: nome + ': ' + ((e && e.message) || String(e)) + '.' }; }
    return { erro: 'ferramenta do acervo desconhecida' };
  }

  /* o módulo do navegador grava em <destino>/Clones/<site>/: o destino padrão é a própria pasta compartilhada (antes ia
     <pasta>/Clones e o clone caía em Clones/Clones/<site>). "Clones" pedido pelo agente vale como o padrão. */
  function arquivoLocal(s) {
    if (/^file:\/\//i.test(s)) { try { return require('url').fileURLToPath(s); } catch (e) { return null; } }
    if (/^~(\/|$)/.test(s)) return path.join(require('os').homedir(), s.slice(1));
    if (/^\//.test(s) || /^[a-z]:[\\\/]/i.test(s)) return s;
    return null;
  }
  function paraPasta(arquivo) {
    const c = conf(), base = c.pasta ? path.resolve(c.pasta) : null, alvo = path.resolve(arquivo);
    if (!base) return { erro: 'esta Estação ainda não tem pasta compartilhada' };
    if (alvo !== base && !alvo.startsWith(base + path.sep)) {
      const dir = path.dirname(alvo), destino = path.join(base, 'sites', path.basename(dir));
      return { erro: 'o arquivo está fora da pasta compartilhada (' + base + '), e o navegador do babel-coop só abre arquivos dela. ' +
        'Copie a pasta do site para dentro dela (cp -R "' + dir + '" "' + path.join(base, 'sites') + '/") e chame navegador_abrir de novo com "' + path.join(destino, path.basename(alvo)) + '". ' +
        'Não sirva com python nem abra localhost/127.0.0.1: endereço interno vindo do agente é recusado.' };
    }
    const rel = path.relative(base, alvo).split(path.sep).map(encodeURIComponent).join('/');
    return { url: 'http://localhost:' + (c.porta || 4711) + '/pasta/' + rel };
  }
  function pastaDestino(sub) {
    const base = conf().pasta;
    if (!base) throw new Error('esta Estação ainda não tem pasta compartilhada');
    const rel = String(sub || '').replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
    if (!rel || /^clones$/i.test(rel)) return path.resolve(base);
    const alvo = path.resolve(base, rel);
    if (alvo !== path.resolve(base) && !alvo.startsWith(path.resolve(base) + path.sep)) throw new Error('a pasta tem de ficar dentro da pasta compartilhada');
    return alvo;
  }

  async function chamarNavegador(nome, a, ag) {
    if (!navegador) return { erro: 'navegador disponível só no app: abra o babel-coop (Electron) para o agente navegar; nunca use o Google Chrome.' };
    const N = navegador;
    if (nome === 'navegador_clicar' && !a.seletor && !a.texto) return { erro: 'navegador_clicar: diga o seletor ou o texto do elemento.' };
    /* o agente no navegador é {id, nome}: o pedido de aba mostra "Navegador · <nome>" */
    const quem = { id: ag.id, nome: ag.nome };
    if (nome === 'navegador_digitar' && PARECE_SENHA.test(a.seletor)) {
      /* nada é digitado; a aba do navegador marca "sua vez" no campo (sem o módulo, só a recusa) */
      if (typeof N.recusarSenha === 'function') { try { await N.recusarSenha(quem, a.seletor); } catch (e) { /* a recusa vale mesmo sem achar o campo */ } }
      return { erro: 'sua vez: a pessoa digita a senha. O agente nunca preenche campo de senha.' };
    }
    let url = null;
    if (nome === 'navegador_abrir') {
      url = String(a.url).trim();
      /* arquivo local (caminho, ~/ ou file://): dentro da pasta compartilhada vira /pasta/ da própria Estação (links relativos,
         áudio e imagens do site funcionam); fora dela, a resposta diz o que fazer, em vez de o agente inventar um servidor local */
      const local = arquivoLocal(url);
      if (local) { const r = paraPasta(local); if (r.erro) return { erro: r.erro }; url = r.url; }
      if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) url = 'https://' + url;
      if (!/^https?:\/\//i.test(url)) return { erro: 'navegador_abrir: só endereços http ou https.' };
    }
    try {
      let r;
      switch (nome) {
        case 'navegador_abrir': r = await N.abrir(quem, url); break;
        case 'navegador_clicar': r = await N.clicar(quem, a.seletor ? { seletor: a.seletor } : { texto: a.texto }); break;
        case 'navegador_digitar': r = await N.digitar(quem, a.seletor, a.texto); break;
        case 'navegador_ler': r = await N.ler(quem); break;
        case 'navegador_raio_x': r = await N.raioX(quem, { seletor: a.seletor || null }); break;
        case 'navegador_clonar': r = await N.clonar(quem, pastaDestino(a.pasta)); break;
        case 'navegador_copy': r = await N.copy(quem, pastaDestino()); break;
        case 'navegador_print': r = await N.print(quem, pastaDestino()); break;
        case 'navegador_codigo': r = await N.codigo(quem, { url: a.url || null, max: a.max }); return formatarCodigo(r);
        case 'navegador_rede': r = await N.rede(quem, { filtro: a.filtro || '', corpo: !!a.corpo }); break;
        case 'navegador_console': r = await N.console(quem, { nivel: a.nivel || null }); break;
        case 'navegador_armazenamento': r = await N.armazenamento(quem); break;
        case 'navegador_rolar': if (a.para == null && a.pixels == null) return { erro: 'navegador_rolar: diga para onde (topo, fim, seletor, texto) ou os pixels.' }; r = await N.rolar(quem, { para: a.para, pixels: a.pixels }); break;
        case 'navegador_esperar': r = await N.aguardar(quem, { seletor: a.seletor, texto: a.texto, ms: a.ms }); break;
        case 'navegador_voltar': r = await N.voltar(quem); break;
        case 'navegador_avancar': r = await N.avancar(quem); break;
        case 'navegador_recarregar': r = await N.recarregar(quem); break;
        case 'navegador_teclas': r = await N.teclas(quem, a.teclas); break;
        case 'navegador_arquivo_baixar': r = await N.baixar(quem, a.url); if (r && r.relativo) return { valor: { texto: 'Baixado em ' + r.relativo + ' (' + r.bytes + ' bytes' + (r.mime ? ', ' + r.mime : '') + ').' }, dados: { relativo: r.relativo, bytes: r.bytes, mime: r.mime } }; break;
        default: return { erro: 'ferramenta de navegador desconhecida' };
      }
      if (r && (r.senha || r.recusado === 'senha')) return { erro: 'sua vez: a pessoa digita a senha' + (r.campo ? ' (' + r.campo + ')' : '') + '. O agente nunca preenche campo de senha.' };
      /* clone: o caminho relativo e o endereço para abrir como site pela Estação (/pasta/) */
      if (nome === 'navegador_clonar' && r && typeof r.relativo === 'string') {
        const pasta = conf().porta ? 'http://localhost:' + conf().porta + '/pasta/' + r.relativo.split('/').map(encodeURIComponent).join('/') : null;
        return { valor: Object.assign({ texto: 'Clonado em ' + r.relativo.replace(/\/index\.html?$/i, '/') + ' (' + (r.arquivos || 0) + ' arquivos' + (r.faltaram && r.faltaram.length ? ', ' + r.faltaram.length + ' não vieram' : '') + '). Arquivo: ' + (r.index || r.relativo) + ' · abre como site em ' + (pasta || '/pasta/' + r.relativo) + '.' }), dados: { relativo: r.relativo, index: r.index || null, arquivos: r.arquivos, bytes: r.bytes, site: pasta } };
      }
      return { valor: r };
    } catch (e) {
      if (e && (e.codigo === 'senha' || e.code === 'senha')) return { erro: 'sua vez: a pessoa digita a senha. O agente nunca preenche campo de senha.' };
      if (e && e.codigo === 'assumido') return { erro: 'a pessoa está no controle do navegador: espere ela devolver. (' + e.message + ')' };
      return { erro: nome + ': ' + ((e && e.message) || String(e)) };
    }
  }

  function chamarUi(ferramenta, args, ctx) {
    if (!pedirUi) return Promise.resolve({ erro: 'a tela do babel-coop não está ligada a este servidor.' });
    if (pendentes.size >= MAX_PENDENTES) return Promise.resolve({ erro: 'muitas chamadas ao mesmo tempo: tente de novo em instantes.' });
    const cid = 'mcp-' + crypto.randomBytes(8).toString('hex');
    const prazo = /^coop_banco_/.test(ferramenta) ? tempoBanco : tempoUi;
    return new Promise((ok) => {
      const acabar = (r) => { if (!pendentes.has(cid)) return; clearTimeout(p.t); pendentes.delete(cid); ok(r); };
      const segundos = prazo >= 1000 ? String(Math.round(prazo / 1000)) : (prazo / 1000).toFixed(1).replace('.', ',');
      const p = { ferramenta, acabar, t: setTimeout(() => acabar({ erro: 'a tela do babel-coop não respondeu em ' + segundos + ' s: o app está aberto nesta Estação?' }), prazo) };
      pendentes.set(cid, p);
      ctx.res.on('close', () => { if (ctx.cancelado) acabar({ erro: 'cancelada pelo cliente' }); });
      let entregue;
      try { entregue = pedirUi({ tipo: 'mcp-chamada', cid, sessao: ctx.sessao, ferramenta, args, agente: ctx.agente }); } catch (e) { entregue = false; }
      if (entregue === false || entregue === 0) acabar({ erro: 'nenhuma tela do babel-coop aberta nesta Estação: abra o app para o agente mexer nele.' });
    });
  }

  /* resposta da tela: {tipo:'mcp-resposta', cid, ok, resultado|erro}. true = era nossa. */
  function aoMensagemUi(m) {
    if (!m || m.tipo !== 'mcp-resposta' || typeof m.cid !== 'string') return false;
    const p = pendentes.get(m.cid);
    if (!p) return false;
    if (m.ok) {
      const r = m.resultado;
      const out = { valor: r };
      if (r && typeof r === 'object' && r.dados !== undefined) out.dados = r.dados;
      p.acabar(out);
    } else {
      p.acabar({ erro: typeof m.erro === 'string' && m.erro ? m.erro.slice(0, 4000) : 'a ação não deu certo' });
    }
    return true;
  }

  return {
    tratar,
    aoMensagemUi,
    ferramentas: () => FERRAMENTAS.map((f) => ({ name: f.name, title: f.title, consulta: !!(f.annotations && f.annotations.readOnlyHint), navegador: f.name.startsWith('navegador_') })),
    registro: () => registro.slice(),
    pendentes: () => pendentes.size,
    parar: () => { pendentes.forEach((p) => p.acabar({ erro: 'o servidor da Estação parou' })); }
  };
}

module.exports = { criar, FERRAMENTAS, ACOES_PERMITIDAS, VERSOES_MODERNAS, VERSOES_LEGADAS };
