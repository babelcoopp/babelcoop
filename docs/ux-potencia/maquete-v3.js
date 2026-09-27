/* Plano V3: terminal permanente e comandos ilustrativos. Não executa o Babel Coop. */
(() => {
  const output = document.querySelector('#v3-terminal-output');
  const form = document.querySelector('#v3-command-form');
  const input = document.querySelector('#v3-command-input');
  const panel = document.querySelector('#v3-terminal');
  if (!output || !form || !input || !panel) return;

  let mode = 'app';
  const labels = {app:'COMANDO BABEL',agent:'MENSAGEM PARA AGENTE',shell:'SHELL · DEMONSTRAÇÃO'};
  const escapePattern = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();

  if (typeof pages !== 'undefined' && pages.projetos) {
    const projectScreen = pages.projetos;
    const folderSequence = `<section class="v3-project-folders"><div><span class="eyebrow">PASTAS DE ÓRBITA · SEQUÊNCIA DO PROJETO</span><p>Da intenção à entrega, com Equipe presente em todas as etapas.</p></div><div class="v3-folder-flow">${[['00','Visão geral'],['01','Planejamento'],['02','Construção'],['03','Equipe'],['04','Laboratório de IAs'],['05','Verificação'],['06','Entrega'],['07','Conhecimento'],['99','Arquivo']].map(([n,name],i)=>`<button data-go="${name==='Laboratório de IAs'?'laboratorio':name==='Verificação'?'tarefas':name==='Entrega'?'concluir':name==='Construção'?'construir':name==='Equipe'?'conversas':name==='Conhecimento'?'biblioteca':name==='Arquivo'?'projetos':'projetos'}"><b>${n}</b><span>${name}</span>${i<8?'<i>→</i>':''}</button>`).join('')}</div><small>Árvore lógica da interface · pastas podem ser personalizadas · nenhum diretório do repositório foi movido.</small></section>`;
    pages.projetos = () => projectScreen().replace('<div class="project-list">', `${folderSequence}<div class="project-list">`);
  }

  function appendLine(className, text) {
    const row = document.createElement('div');
    row.className = className;
    row.textContent = text;
    output.append(row);
    output.scrollTop = output.scrollHeight;
  }

  function eventBlock(command, result, detail) {
    appendLine('v3-event-time', `${new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date())} · ${labels[mode]}`);
    appendLine('v3-command-line', command);
    const row = document.createElement('div');
    row.className = 'v3-command-result';
    const mark = document.createElement('b');
    mark.textContent = '✓';
    const copy = document.createElement('span');
    copy.append(document.createTextNode(result));
    const sub = document.createElement('small');
    sub.textContent = detail;
    copy.append(document.createElement('br'), sub);
    row.append(mark, copy);
    output.append(row);
    output.scrollTop = output.scrollHeight;
  }

  function chooseScreen(id, command, message) {
    if (typeof render !== 'function') {
      eventBlock(command, message, 'Esta tela está prevista no plano; a maquete não a executa.');
      return;
    }
    render(id);
    eventBlock(command, message, 'Ação ilustrativa · rota prevista; sem execução de produto.');
  }

  function navigate(command) {
    const c = escapePattern(command);
    if (/\b(novo projeto|criar projeto|crie um projeto)\b/.test(c)) {
      if (typeof actions !== 'undefined' && actions.newProject) actions.newProject();
      return eventBlock(command,'Criação de projeto preparada','Formulário ilustrativo; nenhum dado foi salvo.');
    }
    if (/\b(nova tarefa|criar tarefa|crie uma tarefa)\b/.test(c)) {
      if (typeof actions !== 'undefined' && actions.newTask) actions.newTask();
      return eventBlock(command,'Criação de tarefa preparada','Formulário ilustrativo; nenhum dado foi salvo.');
    }
    if (/\b(criar|novo|nova|crie)\b/.test(c)) {
      if (typeof actions !== 'undefined' && actions.create) actions.create();
      return eventBlock(command,'Paleta Criar aberta','Escolha o tipo e o destino; esta maquete não grava.');
    }
    const routes = [
      [/\b(meu dia|inicio|home)\b/,'dia','Meu dia aberto'],
      [/\b(mapa|mindforge)\b/,'mapa','Mapa da construção aberto'],
      [/\b(maquina|backend visual|pecas)\b/,'maquina','Máquina aberta'],
      [/\b(laboratorio|lab de agentes|testar agente)\b/,'laboratorio','Laboratório de Agentes aberto'],
      [/\b(agentes|terminal|terminais)\b/,'agentes','Agentes e terminais abertos'],
      [/\b(tarefas|trabalho|demandas)\b/,'tarefas','Trabalho aberto'],
      [/\b(projetos)\b/,'projetos','Lista de projetos aberta'],
      [/\b(pastas|estrutura do projeto)\b/,'projetos','Sequência de pastas do projeto aberta'],
      [/\b(construir|editor|pagina|codigo|arquivo)\b/,'construir','Área de construção aberta'],
      [/\b(conversas|chat|whatsapp)\b/,'conversas','Conversas abertas'],
      [/\b(reuniao|transmitir|tv|palco)\b/,'reuniao','Sala de reunião aberta'],
      [/\b(biblioteca|acervo|ideias|memoria)\b/,'biblioteca','Biblioteca aberta'],
      [/\b(aprender|trilha|escola)\b/,'aprender','Aprender aberto'],
      [/\b(navegador|browser|site)\b/,'navegador','Navegador aberto'],
      [/\b(ipad|quadro)\b/,'ipad','Quadro aberto'],
      [/\b(pets|companheiros|presenca)\b/,'pets','Companheiros abertos'],
      [/\b(vyra)\b/,'vyra','Laboratório Vyra aberto'],
      [/\b(criador|espelho)\b/,'criador','Espelho do Criador aberto'],
      [/\b(musica|playlist|som)\b/,'ritmo','Música e seleção abertas'],
      [/\b(projeto|orbita)\b/,'construir','Projeto Órbita aberto']
    ];
    for (const [pattern,id,message] of routes) if (pattern.test(c)) return chooseScreen(id,command,message);
    if (/\b(buscar|pesquisar|encontrar)\b/.test(c)) {
      if (typeof actions !== 'undefined' && actions.search) actions.search();
      return eventBlock(command,'Busca aberta no contexto atual','A maquete não consulta arquivos reais.');
    }
    if (/\b(tema vibe|modo vibe|vibe)\b/.test(c) && typeof actions !== 'undefined') {
      if (document.documentElement.dataset.theme!=='vibe') actions.theme();
      return eventBlock(command,'Tema Vibe selecionado','Apenas a aparência desta maquete mudou.');
    }
    if (/\b(tema tech|modo tech|tech)\b/.test(c) && typeof actions !== 'undefined') {
      if (document.documentElement.dataset.theme!=='tech') actions.theme();
      return eventBlock(command,'Tema Tech selecionado','Apenas a aparência desta maquete mudou.');
    }
    if (/\b(uso do codex|metricas|limites de uso|tokens)\b/.test(c)) {
      return eventBlock(command,'Uso do Codex apontado','Amostras no desenho são fictícias; dados reais só entram com fonte conectada.');
    }
    if (/\b(ajuda|comandos|o que posso)\b/.test(c)) {
      morePanel();
      return eventBlock(command,'Catálogo de comandos aberto','Navegação, criação, trabalho, agentes, biblioteca e palco.');
    }
    appendLine('v3-event-time', `${new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date())} · INTENÇÃO NÃO RESOLVIDA`);
    appendLine('v3-command-line', command);
    appendLine('v3-command-hint', 'Não alterei nada. Diga o projeto, objeto ou destino; ou abra o catálogo de comandos.');
  }

  function morePanel() {
    if (typeof info !== 'function') return;
    info('Tudo continua alcançável.','O comando Babel abre telas, cria tarefas/projetos, procura pessoas e objetos, consulta estado, chama agentes, conduz o palco e abre laboratórios. Ações com impacto mostram destino, permissão e prévia antes de executar.',
      `<div class="v3-more-grid">${[['tarefas','Trabalho'],['agentes','Agentes e terminais'],['mapa','Mapa'],['maquina','Máquina'],['laboratorio','Laboratório de Agentes'],['navegador','Navegador'],['biblioteca','Biblioteca'],['reuniao','Reunião / TV']].map(([id,label])=>`<button data-go="${id}">${label}</button>`).join('')}</div>`);
  }

  document.querySelectorAll('[data-v3-mode]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.v3Mode;
    document.querySelectorAll('[data-v3-mode]').forEach(item => item.classList.toggle('active',item===button));
    input.placeholder = mode==='app' ? 'Ex.: abra tarefas e mostre o que falta…' : mode==='agent' ? 'Ex.: revise o formulário e pare antes de publicar…' : 'Ex.: npm run dev (não executa nesta maquete)…';
    input.setAttribute('aria-label', mode==='app'?'Comando do Babel Coop':mode==='agent'?'Mensagem para agente':'Comando de shell ilustrativo');
    input.focus();
  }));

  document.addEventListener('click', event => {
    if (!event.target.closest('[data-v3-more]')) return;
    morePanel();
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const command = input.value.trim();
    if (!command) return input.focus();
    input.value='';
    if (mode==='app') return navigate(command);
    if (mode==='agent') return eventBlock(command,'Pedido endereçado à sessão candidata','Demonstração apenas; nenhum agente foi chamado.');
    eventBlock(command,'Sessão Shell selecionada','A maquete não inicia processos nem executa comandos no sistema.');
  });

  input.addEventListener('keydown', event => {
    if (event.key==='Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); }
  });

  const screen = document.querySelector('#screen');
  const railRoutes = {dia:'dia',construir:'construir',tarefas:'tarefas',conversas:'conversas',whatsapp:'conversas',agentes:'agentes',laboratorio:'agentes',projetos:'projetos',biblioteca:'biblioteca',aprender:'aprender',mapa:'construir',maquina:'construir',navegador:'construir',ipad:'construir',pets:'agentes',criador:'agentes',vyra:'agentes',ritmo:'biblioteca',concluir:'tarefas'};
  const syncRail = () => {
    const current = document.querySelector('#screen-picker')?.value || 'construir';
    const route = railRoutes[current] || current;
    document.querySelectorAll('.rail [data-go]').forEach(button => button.classList.toggle('active',button.dataset.go===route));
    panel.dataset.screen = current;
  };
  new MutationObserver(syncRail).observe(screen,{childList:true,subtree:true});
  document.querySelector('#screen-picker')?.addEventListener('change',()=>requestAnimationFrame(syncRail));
  document.querySelectorAll('.rail [data-go]').forEach(button => button.addEventListener('click',()=>requestAnimationFrame(syncRail)));
  syncRail();
})();
