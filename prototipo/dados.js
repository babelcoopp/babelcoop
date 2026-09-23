/* Babel Coop — protótipo · estado inicial (tudo relativo ao momento em que a página abre) */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var U = BC.util, MIN = U.MIN, HORA = U.HORA, DIA = U.DIA;

  var AREAS = {
    gestao: 'Gestão', vendas: 'Vendas', comercial: 'Comercial', financeiro: 'Financeiro',
    programacao: 'Programação', marketing: 'Marketing', suporte: 'Suporte', rh: 'RH',
    operacao: 'Operação', atendimento: 'Atendimento'
  };

  var PESSOAS = [
    ['theus', 'Theus', 'gestao', '#8670ff', 'online', 'admin'], ['ana', 'Ana', 'vendas', '#29ccec', 'online'],
    ['bruno', 'Bruno', 'comercial', '#f2a65a', 'online'], ['carla', 'Carla', 'financeiro', '#7fd6a6', 'online'],
    ['davi', 'Davi', 'programacao', '#5b8cff', 'foco'], ['eva', 'Eva', 'marketing', '#ff7ab8', 'online'],
    ['felipe', 'Felipe', 'suporte', '#c3e36b', 'online'], ['gabi', 'Gabi', 'rh', '#e0a3ff', 'ausente'],
    ['hugo', 'Hugo', 'operacao', '#6fd1c1', 'offline'], ['iara', 'Iara', 'atendimento', '#ffcf5c', 'online'],
    ['joao', 'João', 'programacao', '#9fb4ff', 'online']
  ];

  var FLUXOS = [
    { id: 'proposta', nome: 'Proposta comercial', etapas: ['Levantamento', 'Proposta', 'Revisão', 'Envio'] },
    { id: 'peca', nome: 'Peça de marketing', etapas: ['Briefing', 'Criação', 'Revisão', 'Publicação'] },
    { id: 'chamado', nome: 'Chamado de suporte', etapas: ['Triagem', 'Resolução', 'Validação'] },
    { id: 'funcionalidade', nome: 'Nova funcionalidade', etapas: ['Especificação', 'Desenvolvimento', 'Teste', 'Entrega'] },
    { id: 'contratacao', nome: 'Contratação', etapas: ['Vaga', 'Entrevistas', 'Proposta', 'Integração'] }
  ];

  BC.MOTIVOS = ['almoço', 'reunião', 'aguardando informação', 'outra urgência', 'fim do expediente'];

  function hojeAs(h, m) { var d = new Date(); d.setHours(h, m || 0, 0, 0); return d.getTime(); }
  function fimDoMes() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime(); }
  function h(ts, quem, acao, nota) { return { ts: ts, quem: quem, acao: acao, nota: nota || '' }; }
  function dem(o) {
    o.pausas = o.pausas || []; o.devolucoes = o.devolucoes || 0; o.kudos = !!o.kudos; o.historico = o.historico || [];
    o.fim = o.fim || null; o.inicio = o.inicio || null; return o;
  }

  BC.criarEstado = function () {
    var t = Date.now(), mes = U.mes(), ontem = t - DIA;

    var AGENTES = {
      theus: [['Rita', 'Cria demandas, campanhas e avisos; consulta o acervo antes de responder.', '#c7a2ff'], ['Dev', 'Código, servidor e testes.', '#29ccec']],
      ana: [['Sol', 'Propostas, leads e follow-up de clientes.', '#ffcf5c']], bruno: [['Bruno-bot', 'Propostas comerciais no padrão Babel.', '#f2a65a']],
      carla: [['Lu', 'Financeiro, contratos e planilhas.', '#7fd6a6']], davi: [['Dev', 'Testes e relatórios.', '#5b8cff'], ['Doc', 'Documenta o código.', '#9fb4ff']],
      eva: [['Musa', 'Textos, roteiros e artes.', '#ff7ab8']], felipe: [['Zé', 'Chamados de suporte.', '#c3e36b']], gabi: [['Gente', 'Vagas e RH.', '#e0a3ff']],
      hugo: [['Base', 'Estoque e inventário.', '#6fd1c1']], iara: [['Fala', 'Respostas rápidas de atendimento.', '#ffcf5c']], joao: [['Pixel', 'Site novo e páginas.', '#9fb4ff']]
    };
    var pessoas = PESSOAS.map(function (p) {
      return { id: p[0], nome: p[1], area: p[2], cor: p[3], status: p[4], papel: p[5] || 'membro', foto: null,
        ultimaVez: p[0] === 'hugo' ? t - 3 * DIA : p[0] === 'gabi' ? t - 3 * HORA : t - Math.round(Math.random() * 8) * MIN, naoMostrarCuidado: false,
        agentes: (AGENTES[p[0]] || []).map(function (a, i) { return { id: p[0] + '-ag' + (i + 1), nome: a[0], oQueFaz: a[1], cor: a[2], visivel: true, estado: 'parado' }; }) };
    });

    var demandas = [
      dem({ id: 'd1', titulo: 'Aprovar reembolso da viagem a Campinas', de: 'carla', para: 'theus', descricao: 'As notas estão no HD da Carla, em "Notas de despesas". Preciso do OK até hoje para fechar o mês.', criada: t - 25 * MIN, prazo: hojeAs(18), estimativaMin: 15, prioridade: 'alta', estado: 'enviada', historico: [h(t - 25 * MIN, 'carla', 'enviou')] }),
      dem({ id: 'd2', titulo: 'Revisar o roteiro do vídeo depoimento', de: 'eva', para: 'theus', descricao: 'Roteiro no meu HD: Campanha/roteiro-depoimento.md. Olhar principalmente a abertura.', criada: t - 50 * MIN, prazo: hojeAs(17), estimativaMin: 30, prioridade: 'média', estado: 'andamento', inicio: t - 18 * MIN, pausas: [{ inicio: t - 12 * MIN, fim: t - 9 * MIN, motivo: 'reunião' }], historico: [h(t - 50 * MIN, 'eva', 'enviou'), h(t - 18 * MIN, 'theus', 'começou'), h(t - 12 * MIN, 'theus', 'pausou', 'reunião'), h(t - 9 * MIN, 'theus', 'retomou')] }),
      dem({ id: 'd3', titulo: 'Ajustar a planilha de comissões', de: 'theus', para: 'davi', descricao: 'Separar comissão de renovação e de cliente novo.', criada: t - 70 * MIN, prazo: t + DIA, estimativaMin: 60, prioridade: 'alta', estado: 'andamento', inicio: t - 47 * MIN, pausas: [{ inicio: t - 30 * MIN, fim: t - 22 * MIN, motivo: 'aguardando informação' }], historico: [h(t - 70 * MIN, 'theus', 'enviou'), h(t - 47 * MIN, 'davi', 'começou'), h(t - 30 * MIN, 'davi', 'pausou', 'aguardando informação'), h(t - 22 * MIN, 'davi', 'retomou')] }),
      dem({ id: 'd4', titulo: 'Arte do banner da campanha de ' + mes, de: 'theus', para: 'eva', descricao: 'Banner 1200×628 para o site e versão quadrada para o Instagram.', criada: t - 4 * HORA, prazo: hojeAs(18), estimativaMin: 90, prioridade: 'média', estado: 'pronta', inicio: t - 3 * HORA, pausas: [{ inicio: t - 150 * MIN, fim: t - 115 * MIN, motivo: 'almoço' }, { inicio: t - 15 * MIN, fim: null, motivo: 'aguardando conferência' }], aprendizado: 'Banner com uma frase só é lido de longe; duas frases viram ruído.', historico: [h(t - 4 * HORA, 'theus', 'enviou'), h(t - 3 * HORA, 'eva', 'começou'), h(t - 150 * MIN, 'eva', 'pausou', 'almoço'), h(t - 115 * MIN, 'eva', 'retomou'), h(t - 15 * MIN, 'eva', 'avisou que está pronta', 'aprendeu: banner com uma frase só é lido de longe')] }),
      dem({ id: 'd5', titulo: 'Levantar leads de clínicas em Campinas', de: 'theus', para: 'ana', descricao: 'Umas 30 clínicas com mais de 5 dentistas.', criada: t - 10 * MIN, prazo: t + 2 * DIA, estimativaMin: 120, prioridade: 'média', estado: 'enviada', historico: [h(t - 10 * MIN, 'theus', 'enviou')] }),
      dem({ id: 'd6', titulo: 'Conferir o contrato do Grupo Norte', de: 'ana', para: 'carla', descricao: 'Ver cláusula de reajuste e forma de pagamento.', criada: t - 3 * HORA, prazo: t + DIA, estimativaMin: 40, prioridade: 'alta', estado: 'andamento', inicio: t - 2 * HORA - 10 * MIN, historico: [h(t - 3 * HORA, 'ana', 'enviou'), h(t - 2 * HORA - 10 * MIN, 'carla', 'começou')] }),
      dem({ id: 'd7', titulo: 'Relatório de chamados de agosto', de: 'theus', para: 'felipe', descricao: 'Tempo médio de resposta, reabertos e os 5 assuntos mais frequentes.', criada: ontem - 7 * HORA, prazo: ontem, estimativaMin: 180, prioridade: 'média', estado: 'concluida', inicio: ontem - 6 * HORA - 30 * MIN, fim: ontem, kudos: true, aprendizado: 'Chamado de login quase sempre é sessão expirando; conferir o relógio do servidor primeiro.', pausas: [{ inicio: ontem - 5 * HORA - 10 * MIN, fim: ontem - 4 * HORA - 50 * MIN, motivo: 'reunião' }, { inicio: ontem - 3 * HORA - 40 * MIN, fim: ontem - 2 * HORA - 25 * MIN, motivo: 'almoço' }, { inicio: ontem - HORA, fim: ontem, motivo: 'aguardando conferência' }], historico: [h(ontem - 7 * HORA, 'theus', 'enviou'), h(ontem - 6 * HORA - 30 * MIN, 'felipe', 'começou'), h(ontem - HORA, 'felipe', 'avisou que está pronta'), h(ontem, 'theus', 'deu OK'), h(ontem, 'theus', 'agradeceu')] })
    ];

    /* tarefas livres: ninguém pegou ainda; quem puder, pega e começa */
    demandas.push(
      dem({ id: 'l1', titulo: 'Atualizar a planilha de leads com as clínicas novas', de: 'ana', para: null, descricao: 'São umas 20 clínicas que vieram do evento. A planilha está no HD da Ana.', criada: t - 90 * MIN, prazo: t + DIA, estimativaMin: 45, prioridade: 'média', estado: 'livre', historico: [h(t - 90 * MIN, 'ana', 'deixou livre para quem puder pegar')] }),
      dem({ id: 'l2', titulo: 'Revisar o texto da página de preços', de: 'joao', para: null, descricao: 'Ler o precos.html e apontar erros de português e frases confusas.', criada: t - 40 * MIN, prazo: t + 2 * DIA, estimativaMin: 20, prioridade: 'baixa', estado: 'livre', historico: [h(t - 40 * MIN, 'joao', 'deixou livre para quem puder pegar')] }),
      dem({ id: 'l3', titulo: 'Organizar a pasta EQUIPE/Quadros', de: 'theus', para: null, descricao: 'Dar nome claro aos quadros e apagar os vazios.', criada: t - 3 * HORA, prazo: null, estimativaMin: 30, prioridade: 'baixa', estado: 'livre', historico: [h(t - 3 * HORA, 'theus', 'deixou livre para quem puder pegar')] })
    );

    var tarefas = [
      { id: 't1', titulo: 'Proposta Acme Logística', fluxo: 'proposta', donos: ['ana', 'bruno', 'carla', 'ana'], atual: 1, prazo: t + 2 * DIA, prioridade: 'alta', paradaDesde: t - 3 * DIA - 2 * HORA },
      { id: 't2', titulo: 'Proposta Clínica Vida', fluxo: 'proposta', donos: ['ana', 'bruno', 'theus', 'ana'], atual: 2, prazo: hojeAs(18), prioridade: 'urgente', paradaDesde: t - 12 * MIN, checklist: [{ texto: 'Conferir os valores', feito: true }, { texto: 'Checar o prazo de implantação', feito: false }, { texto: 'Aprovar o desconto de 8%', feito: false }] },
      { id: 't3', titulo: 'Post de lançamento de ' + mes, fluxo: 'peca', donos: ['theus', 'eva', 'theus', 'eva'], atual: 2, prazo: hojeAs(17), prioridade: 'alta', paradaDesde: t - 40 * MIN },
      { id: 't4', titulo: 'Chamado #482 · erro no login', fluxo: 'chamado', donos: ['iara', 'felipe', 'iara'], atual: 1, prazo: hojeAs(16), prioridade: 'urgente', paradaDesde: t - 2 * HORA },
      { id: 't5', titulo: 'Relatório de comissões', fluxo: 'funcionalidade', donos: ['theus', 'davi', 'felipe', 'davi'], atual: 1, prazo: t + 3 * DIA, prioridade: 'alta', paradaDesde: t - DIA },
      { id: 't6', titulo: 'Contratar SDR', fluxo: 'contratacao', donos: ['gabi', 'theus', 'carla', 'gabi'], atual: 1, prazo: t + 4 * DIA, prioridade: 'média', paradaDesde: t - 5 * HORA },
      { id: 't7', titulo: 'Site novo · página de preços', fluxo: 'funcionalidade', donos: ['theus', 'joao', 'felipe', 'joao'], atual: 3, prazo: t + DIA, prioridade: 'alta', paradaDesde: t - 3 * HORA },
      { id: 't8', titulo: 'Vídeo depoimento de cliente', fluxo: 'peca', donos: ['theus', 'eva', 'theus', 'eva'], atual: 1, prazo: t + 6 * DIA, prioridade: 'média', paradaDesde: t - 2 * DIA }
    ];

    var arquivos = BC.conteudos.arquivos().map(function (a, i) {
      var dono = a[0].split('/')[0];
      return { id: 'f' + (i + 1), caminho: a[0], dono: dono, autor: dono === 'equipe' ? 'theus' : dono, tipo: a[1], tamanho: a[2],
        modificado: t - a[3] * MIN, conteudo: a[4], versoes: [], consultas: [3, 7, 2, 12, 5, 9, 1, 4][i % 8], salvoPor: dono === 'equipe' ? 'theus' : dono };
    });
    /* arquivos dos projetos: cada membro guarda a sua parte no próprio computador */
    var LANDING = '<!doctype html>\n<html lang="pt-BR">\n<head><meta charset="utf-8"><title>Clínicas em Campinas · Babel</title>\n<style>\n  body{margin:0;font-family:"IBM Plex Sans",system-ui,sans-serif;background:#060b16;color:#d7e4fb}\n  header{padding:64px 32px;text-align:center;background:linear-gradient(135deg,#291c48,#12314a)}\n  h1{font-size:40px;margin:0 0 12px;background:linear-gradient(90deg,#9160ec,#29ccec);-webkit-background-clip:text;color:transparent}\n  p.sub{font-size:18px;color:#8799bc;max-width:560px;margin:0 auto 24px}\n  .cta{display:inline-block;padding:14px 28px;border-radius:999px;background:#8670ff;color:#fff;text-decoration:none;font-weight:600}\n  section{padding:48px 32px;max-width:960px;margin:0 auto}\n  .planos{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}\n  .plano{padding:24px;border:1px solid #1b2640;border-radius:12px;background:#0a1221}\n  .plano b{font-size:28px;display:block;margin:8px 0}\n  .plano.destaque{border-color:#8670ff;box-shadow:0 0 0 1px #8670ff}\n  blockquote{border-left:3px solid #29ccec;padding-left:16px;color:#c7a2ff;font-style:italic}\n</style></head>\n<body>\n<header><h1>Sua clínica atendida 24 horas</h1><p class="sub">A Babel responde seus pacientes no WhatsApp a qualquer hora, marca consultas e lembra do retorno.</p><a class="cta" href="#planos">Quero para a minha clínica</a></header>\n<section id="planos"><h2>Planos</h2><div class="planos"><div class="plano">Essencial<b>R$ 490</b>por mês · 1 número</div><div class="plano destaque">Clínica<b>R$ 890</b>por mês · 3 números · agenda</div><div class="plano">Rede<b>R$ 1.900</b>por mês · ilimitado</div></div></section>\n<section><h2>Quem já usa</h2><blockquote>"Em duas semanas a agenda encheu e ninguém mais perde ligação."<br>— Dra. Marta, Clínica Vida</blockquote></section>\n</body>\n</html>';
    [
      ['carla/Projetos/Clínicas/planilha-clinicas.csv', 'csv', '3 KB', 35, 'clínica,dentistas,cidade,contato,situação\nClínica Vida,7,Campinas,Dra. Marta,proposta enviada\nSorriso Campinas,5,Campinas,Dr. Paulo,fechado\nOdonto Barão,9,Campinas,Sra. Lúcia,ligar\nClínica Taquaral,4,Campinas,Dr. Renan,sem interesse\n'],
      ['carla/Projetos/Clínicas/custos.md', 'md', '1 KB', 120, '# Custos do projeto Clínicas\n\n- Tráfego pago: R$ 3.000/mês\n- Vídeo depoimento: R$ 1.200\n- Landing: interno\n\nMargem esperada por clínica: 62%.\n'],
      ['bruno/Projetos/Clínicas/proposta-clinicas.md', 'md', '2 KB', 22, '# Proposta padrão · Clínicas em Campinas\n\n## O que a clínica ganha\n\n- Atendimento no WhatsApp 24h\n- Agenda cheia sem ligação perdida\n- Lembrete de retorno automático\n\n## Investimento\n\nPlano Clínica: **R$ 890/mês**, sem fidelidade.\n\n## Próximo passo\n\nReunião de 20 minutos para configurar o número.\n'],
      ['davi/Projetos/Clínicas/landing.html', 'html', '4 KB', 8, LANDING],
      ['davi/Projetos/Site novo/roadmap.md', 'md', '1 KB', 200, '# Site novo · roadmap\n\n1. Página de preços (João)\n2. Landing por segmento (Davi)\n3. Blog (Eva)\n'],
      ['eva/Projetos/Site novo/copy-home.md', 'md', '1 KB', 60, '# Copy da home\n\n**Título:** Atendimento que não dorme.\n\n**Subtítulo:** A Babel responde, agenda e lembra. Você cuida do paciente.\n'],
      ['theus/Projetos/Site novo/decisoes.md', 'md', '1 KB', 400, '# Decisões do site novo\n\n- Plano anual em destaque\n- Fonte IBM Plex\n- Sem pop-up\n'],
      ['iara/Projetos/Onboarding/checklist-cliente-novo.md', 'md', '1 KB', 300, '# Checklist · cliente novo\n\n- [ ] Boas-vindas no WhatsApp\n- [ ] Configurar o número\n- [ ] Treinar as respostas rápidas\n- [ ] Ligar no 7º dia\n'],
      ['felipe/Projetos/Onboarding/faq-tecnico.md', 'md', '1 KB', 250, '# FAQ técnico do onboarding\n\n**Não recebe mensagens?** Conferir se o número está conectado.\n\n**Sessão expira?** Relógio do servidor.\n']
    ].forEach(function (a, i) {
      var dono = a[0].split('/')[0];
      arquivos.push({ id: 'fp' + (i + 1), caminho: a[0], dono: dono, autor: dono, tipo: a[1], tamanho: a[2], modificado: t - a[3] * MIN, conteudo: a[4], versoes: [], consultas: 2 + i, salvoPor: dono });
    });
    var projetos = [
      { id: 'clinicas', nome: 'Clínicas em Campinas', membros: ['carla', 'bruno', 'davi', 'theus'], desde: t - 13 * DIA, pasta: 'Projetos/Clínicas', canal: 'clinicas', conversas: {}, proximos: [{ texto: 'Fechar a landing até sexta', quem: 'davi', ts: t - 2 * HORA }], descricao: '50 clínicas com mais de 5 dentistas até o fim do mês.' },
      { id: 'site', nome: 'Site novo', membros: ['davi', 'eva', 'theus', 'joao'], desde: t - 30 * DIA, pasta: 'Projetos/Site novo', canal: 'dev', conversas: {}, proximos: [], descricao: 'Página de preços, landings por segmento e blog.' },
      { id: 'onboarding', nome: 'Onboarding de clientes', membros: ['iara', 'felipe'], desde: t - 6 * DIA, pasta: 'Projetos/Onboarding', canal: 'suporte', conversas: {}, proximos: [], descricao: 'Do contrato assinado ao primeiro atendimento em 7 dias.' }
    ];
    var whatsapp = {
      pareado: false,
      conversas: [
        { id: 'w1', nome: 'Clínica Vida · Dra. Marta', telefone: '+55 19 99812-4410', automatico: false, sugestao: null, mensagens: [{ de: 'eles', texto: 'Boa tarde! Vocês conseguem começar na segunda?', ts: t - 35 * MIN }, { de: 'eu', texto: 'Boa tarde, Dra. Marta! Conseguimos sim.', ts: t - 30 * MIN }, { de: 'eles', texto: 'Ótimo. E a proposta, chega hoje?', ts: t - 6 * MIN }] },
        { id: 'w2', nome: 'Dr. Marcos · Odonto Barão', telefone: '+55 19 99700-1120', automatico: false, sugestao: null, mensagens: [{ de: 'eles', texto: 'Qual o horário de atendimento do suporte?', ts: t - 50 * MIN }] },
        { id: 'w3', nome: 'Ana da Acme', telefone: '+55 11 98222-3301', automatico: false, sugestao: null, mensagens: [{ de: 'eles', texto: 'Recebemos o contrato, obrigada!', ts: t - 3 * HORA }, { de: 'eu', texto: 'Ótimo! Qualquer coisa é só chamar.', ts: t - 170 * MIN }] },
        { id: 'w4', nome: 'Gráfica Central', telefone: '+55 19 3232-8800', automatico: false, sugestao: null, mensagens: [{ de: 'eles', texto: 'Os folhetos ficam prontos quinta.', ts: t - 5 * HORA }] }
      ]
    };
    var lojaEquipe = [
      { id: 'lj1', tipo: 'skill', nome: 'Proposta comercial', dono: 'bruno', descricao: 'Escreve uma proposta no padrão Babel a partir de uma nota ou de uma conversa.', versao: 3, precisaChave: null, instaladoPor: { theus: 3, ana: 2, carla: 3, iara: 3, eva: 3 }, atualizadoEm: t - 2 * DIA },
      { id: 'lj2', tipo: 'mcp', nome: 'CNPJ grátis', dono: 'theus', descricao: 'Consulta o quadro societário pela BrasilAPI. Sem chave.', versao: 1, precisaChave: null, instaladoPor: { ana: 1, bruno: 1, carla: 1, davi: 1, eva: 1, felipe: 1, iara: 1, joao: 1, gabi: 1 }, atualizadoEm: t - 9 * DIA },
      { id: 'lj3', tipo: 'plugin', nome: 'Revisor de texto', dono: 'eva', descricao: 'Revisa português, tom da Babel e tamanho de frase em qualquer arquivo.', versao: 2, precisaChave: null, instaladoPor: { theus: 2, iara: 1, ana: 2 }, atualizadoEm: t - 5 * HORA },
      { id: 'lj4', tipo: 'agente', nome: 'Zé do suporte', dono: 'felipe', descricao: 'Agente pronto para triagem de chamados: lê o acervo de chamados antes de responder.', versao: 1, precisaChave: null, instaladoPor: { iara: 1 }, atualizadoEm: t - 3 * DIA },
      { id: 'lj5', tipo: 'claudemd', nome: 'Padrão Babel', dono: 'theus', descricao: 'CLAUDE.md de referência: consultar o acervo, ler os aprendizados, escrever em pt-BR.', versao: 4, precisaChave: null, instaladoPor: { ana: 4, bruno: 4, carla: 3, davi: 4, eva: 4, felipe: 4, iara: 4, joao: 4 }, atualizadoEm: t - DIA },
      { id: 'lj6', tipo: 'skill', nome: 'Planilha de preços', dono: 'carla', descricao: 'Monta a planilha de preços com margem por plano e exporta para o Google Sheets.', versao: 1, precisaChave: 'SHEETS_API_KEY', instaladoPor: {}, atualizadoEm: t - 6 * HORA },
      { id: 'lj7', tipo: 'mcp', nome: 'Banco do Babel OS', dono: 'theus', descricao: 'Tabelas, políticas e funções do Babel OS, no servidor do projeto, para o agente consultar. Precisa da chave do projeto.', versao: 2, precisaChave: 'BANCO_CHAVE', instaladoPor: { davi: 2, joao: 2 }, atualizadoEm: t - 4 * DIA },
      { id: 'lj8', tipo: 'skill', nome: 'Resumo de reunião', dono: 'ana', descricao: 'Transforma a ata em 5 próximos passos com responsável e prazo.', versao: 1, precisaChave: null, instaladoPor: { theus: 1, eva: 1 }, atualizadoEm: t - 12 * DIA },
      { id: 'lj9', tipo: 'plugin', nome: 'Navegador Raio-X', dono: 'davi', descricao: 'Clona páginas, extrai a copy e mostra o HTML e o CSS de qualquer site que o agente abrir.', versao: 1, precisaChave: null, instaladoPor: { theus: 1, joao: 1 }, atualizadoEm: t - 8 * HORA },
      { id: 'lj10', tipo: 'agente', nome: 'Musa das legendas', dono: 'eva', descricao: 'Agente para legendas e posts curtos, no tom da Babel.', versao: 2, precisaChave: null, instaladoPor: { ana: 1 }, atualizadoEm: t - 40 * MIN }
    ];

    function msg(pessoa, texto, antes, extra) {
      var m = { id: U.id('m'), pessoa: pessoa, texto: texto, ts: t - antes * MIN, respondeA: null, reacoes: {} };
      if (extra) Object.keys(extra).forEach(function (k) { m[k] = extra[k]; });
      return m;
    }

    var geral = [
      msg('iara', 'Bom dia, time! Fila de atendimento zerada ☀️', 300),
      msg('bruno', '@Theus mandei a proposta da Clínica Vida para a sua revisão', 180),
      msg('carla', 'Fechamento do mês: preciso das notas de despesas até quinta', 150, { reacoes: { '👍': ['ana', 'bruno', 'eva'] } }),
      msg('davi', 'Subo o relatório de comissões à tarde, se o Felipe conseguir testar', 60),
      msg('ana', 'Fechei com a Clínica Sorriso! Mais um para a campanha 🎉', 55, { reacoes: { '🎉': ['theus', 'bruno', 'iara', 'eva'] } }),
      msg('eva', 'Banner da campanha pronto, está no meu HD', 16, { arquivo: 'eva/Campanha/banner-1200x628.png' })
    ];
    geral[5].respondeA = null;

    return {
      areas: AREAS, pessoas: pessoas, fluxos: FLUXOS, demandas: demandas, tarefas: tarefas, arquivos: arquivos,
      metas: [
        { id: 'm1', area: 'vendas', titulo: 'Faturamento do mês', atual: 129600, alvo: 180000, unidade: 'R$' },
        { id: 'm2', area: 'suporte', titulo: 'Chamados resolvidos em 24h', atual: 41, alvo: 70, unidade: '' },
        { id: 'm3', area: 'marketing', titulo: 'Peças publicadas', atual: 20, alvo: 22, unidade: '' },
        { id: 'm4', area: 'programacao', titulo: 'Entregas do ciclo', atual: 7, alvo: 11, unidade: '' },
        { id: 'm5', area: 'financeiro', titulo: 'Inadimplência abaixo de 3%', atual: null, alvo: 3, unidade: '%' }
      ],
      campanha: { nome: 'Campanha de ' + mes, descricao: 'novos clientes', atual: 38, alvo: 50, fim: fimDoMes() },
      cronometroTv: null,
      avisos: [
        { id: 'a1', pessoa: 'theus', texto: 'Reunião geral hoje às 16h, na sala grande', ts: t - 3 * HORA },
        { id: 'a2', pessoa: 'theus', texto: 'Sexta: entrega do site novo. Todos no #dev às 10h', ts: t - DIA }
      ],
      mural: [
        { id: 'r1', pessoa: 'gabi', texto: 'Bolo de aniversário da Iara na copa às 15h!', ts: t - 40 * MIN },
        { id: 'r2', pessoa: 'felipe', texto: 'Quem pegou o carregador USB-C da sala 2, devolve, por favor', ts: t - 2 * HORA }
      ],
      conversas: [
        { id: 'geral', tipo: 'grupo', nome: 'Babel · todos', fixada: true },
        { id: 'comercial', tipo: 'grupo', nome: 'Comercial', membros: ['theus', 'ana', 'bruno', 'carla'] },
        { id: 'suporte', tipo: 'grupo', nome: 'Suporte', membros: ['theus', 'felipe', 'iara', 'joao'] },
        { id: 'marketing', tipo: 'grupo', nome: 'Marketing', membros: ['theus', 'eva', 'ana'] },
        { id: 'dev', tipo: 'grupo', nome: 'Dev', membros: ['theus', 'davi', 'joao', 'felipe'] },
        { id: 'dm:eva:theus', tipo: 'direta', membros: ['eva', 'theus'] },
        { id: 'dm:ana:theus', tipo: 'direta', membros: ['ana', 'theus'] },
        { id: 'cli:clinica-vida', tipo: 'cliente', nome: 'Clínica Vida · Dra. Marta', canal: 'WhatsApp Business', membros: ['bruno', 'theus'] }
      ],
      mensagens: {
        geral: geral,
        comercial: [msg('ana', 'Alguém tem o contato do financeiro da Acme?', 240), msg('bruno', 'Mandei no privado', 230)],
        suporte: [msg('felipe', 'O #482 é a sessão expirando cedo. Corrijo até as 16h', 100)],
        marketing: [msg('eva', 'Theus, o roteiro do depoimento está com você', 50)],
        dev: [msg('joao', 'Página de preços no ar em homologação', 180), msg('davi', 'Boa! Vou olhar o app.js', 170)],
        'dm:eva:theus': [msg('eva', 'Oi! Conseguiu ver o roteiro?', 45), msg('theus', 'Vendo agora, te falo já', 40), msg('eva', 'Perfeito, obrigada 💜', 39)],
        'dm:ana:theus': [msg('ana', 'Posso mandar a proposta do Grupo Norte hoje?', 20)],
        'cli:clinica-vida': [msg('cliente', 'Boa tarde! Vocês conseguem começar na segunda?', 35), msg('bruno', 'Boa tarde, Dra. Marta! Conseguimos sim. Te mando a proposta hoje.', 30), msg('cliente', 'Ótimo. E o desconto do plano anual continua?', 8)]
      },
      lidas: { theus: { geral: t - 20 * MIN, comercial: t, suporte: t, marketing: t - 60 * MIN, dev: t, 'dm:eva:theus': t, 'dm:ana:theus': t - 30 * MIN, 'cli:clinica-vida': t - 10 * MIN } },
      checkins: {
        ana: { hoje: 'Mandar o contrato do Grupo Norte e ligar para 10 clínicas.', bloqueio: '', ts: t - 5 * HORA },
        felipe: { hoje: 'Corrigir o #482 e testar o relatório de comissões.', bloqueio: 'Preciso de acesso ao banco de homologação.', ts: t - 5 * HORA },
        eva: { hoje: 'Banner e roteiro do depoimento.', bloqueio: '', ts: t - 4 * HORA },
        davi: { hoje: 'Planilha de comissões.', bloqueio: '', ts: t - 4 * HORA }
      },
      reuniao: {
        ativa: true, titulo: 'Reunião geral · campanha', inicio: t - 24 * MIN, condutor: 'theus',
        pauta: [{ texto: 'Campanha do mês', feito: true }, { texto: 'Site novo', feito: false }, { texto: 'Contratação de SDR', feito: false }],
        materiais: [
          { id: 'mt1', caminho: 'ana/Proposta Grupo Norte.pdf', por: 'ana', ts: t - 18 * MIN },
          { id: 'mt2', caminho: 'equipe/Mapas/Babel Coop.mapa', por: 'davi', ts: t - 12 * MIN },
          { id: 'mt3', caminho: 'eva/Campanha/banner-1200x628.png', por: 'eva', ts: t - 6 * MIN }
        ],
        destaque: 'mt3',
        decisoes: [{ texto: 'Priorizar clínicas em Campinas até o fim do mês.', por: 'theus', ts: t - 15 * MIN }],
        proximos: [{ texto: 'Mandar a proposta do Grupo Norte revisada', quem: 'ana', ts: t - 10 * MIN }],
        participantes: ['theus', 'ana', 'bruno', 'carla', 'davi', 'eva', 'felipe', 'iara', 'joao']
      },
      ideias: [
        { id: 'i1', texto: 'Um "modo foco" que silencia o chat por 50 minutos', pessoa: 'davi', ts: t - DIA, apoios: ['joao', 'felipe', 'ana'] },
        { id: 'i2', texto: 'Kit de boas-vindas para cliente novo, com um vídeo de 2 minutos', pessoa: 'eva', ts: t - 5 * HORA, apoios: ['theus', 'iara'] },
        { id: 'i3', texto: 'Resposta automática de boleto no fim de semana', pessoa: 'iara', ts: t - 2 * HORA, apoios: ['carla'] }
      ],
      pergunta: {
        texto: 'Que trabalho acontece hoje fora de qualquer sistema, e ninguém vê?', desde: t - 2 * DIA,
        respostas: [
          { pessoa: 'iara', texto: 'Os áudios de cliente que eu ouço no carro e respondo depois.', ts: t - 30 * HORA },
          { pessoa: 'bruno', texto: 'As anotações de reunião que ficam no meu caderno.', ts: t - 20 * HORA },
          { pessoa: 'felipe', texto: 'Quando eu ajudo o João com o servidor, não fica registrado em lugar nenhum.', ts: t - 3 * HORA }
        ]
      },
      aprendizados: [
        { id: 'ap1', texto: 'Clínica pequena decide rápido quando a proposta cabe em uma página.', pessoa: 'ana', ts: t - 3 * DIA, confirmacoes: ['bruno'], origem: 'Proposta Clínica Sorriso' },
        { id: 'ap2', texto: 'Contrato com cláusula de reajuste precisa passar pelo financeiro antes de ir ao cliente.', pessoa: 'carla', ts: t - 2 * DIA, confirmacoes: [], origem: 'Proposta Acme' },
        { id: 'ap3', texto: 'Chamado de login quase sempre é sessão expirando; conferir o relógio do servidor primeiro.', pessoa: 'felipe', ts: ontem, confirmacoes: ['joao', 'iara'], origem: 'Relatório de chamados de agosto' },
        { id: 'ap4', texto: 'Página de preços converte melhor com o plano anual em destaque.', pessoa: 'joao', ts: ontem - 2 * HORA, confirmacoes: [], origem: 'Site novo' },
        { id: 'ap5', texto: 'Roteiro de depoimento funciona melhor começando pela dor do cliente, não pelo produto.', pessoa: 'eva', ts: t - 4 * HORA, confirmacoes: ['theus'], origem: 'Vídeo depoimento' },
        { id: 'ap6', texto: 'Separar a regra de negócio (as taxas) do cálculo deixa o teste mais fácil.', pessoa: 'davi', ts: t - 5 * HORA, confirmacoes: [], origem: 'Relatório de comissões' },
        { id: 'ap7', texto: 'Em planilhas exportadas do banco, datas vêm como texto dd/mm; converter antes de somar.', pessoa: 'davi', ia: true, ts: t - 3 * HORA, confirmacoes: ['carla'], origem: 'terminal do Davi' },
        { id: 'ap8', texto: 'Responder "recebi, volto em 1 hora" reduz a ansiedade do cliente com boleto.', pessoa: 'iara', ts: t - 2 * DIA, confirmacoes: ['felipe'], origem: 'Chamado #471' }
      ],
      prompts: [
        { id: 'pr1', pessoa: 'davi', texto: 'Leia calculo.py e escreva testes para renovação e cliente novo, sem mudar a regra.', ts: t - 3 * HORA, estrelas: ['joao', 'theus'], reusos: 3, resultado: 'ok' },
        { id: 'pr2', pessoa: 'eva', texto: 'Com base no roteiro-depoimento.md, sugira 3 aberturas de 5 segundos no tom da Babel.', ts: t - 4 * HORA, estrelas: ['theus'], reusos: 1, resultado: 'ok' },
        { id: 'pr3', pessoa: 'joao', texto: 'Compare precos.html com o guia de marca e liste o que está fora do padrão.', ts: t - 2 * HORA, estrelas: ['davi', 'eva', 'theus'], reusos: 2, resultado: 'ok' },
        { id: 'pr4', pessoa: 'felipe', texto: 'Procure no acervo chamados parecidos com o #482 e resuma a solução de cada um.', ts: t - HORA, estrelas: ['iara'], reusos: 4, resultado: 'ok' },
        { id: 'pr5', pessoa: 'ana', texto: 'Transforme esta ata em 5 próximos passos com responsável e prazo.', ts: t - 30 * MIN, estrelas: [], reusos: 1, resultado: null },
        { id: 'pr6', pessoa: 'carla', texto: 'Some os valores do CSV de despesas e aponte o que passa de R$ 150.', ts: t - 6 * HORA, estrelas: ['theus'], reusos: 0, resultado: 'ok' },
        { id: 'pr7', pessoa: 'theus', texto: 'Explique para a equipe, em português simples, o que o gerar-relatorio.sh faz.', ts: ontem, estrelas: ['ana', 'gabi'], reusos: 2, resultado: 'ok' },
        { id: 'pr8', pessoa: 'bruno', texto: 'faz uma proposta', ts: t - 50 * MIN, estrelas: [], reusos: 0, resultado: 'devolvida' }
      ],
      terminais: {
        theus: [{ ts: t - 20 * MIN, tipo: 'cmd', texto: 'coop status' }, { ts: t - 20 * MIN, tipo: 'saida', texto: 'Rodando: "Revisar o roteiro do vídeo depoimento"' }],
        davi: [{ ts: t - 3 * HORA, tipo: 'prompt', texto: 'claude "Leia calculo.py e escreva testes para renovação e cliente novo, sem mudar a regra."' }, { ts: t - 3 * HORA + 40000, tipo: 'ia', texto: 'Criei tests/test_calculo.py com 6 testes. Nenhuma regra mudou.' }, { ts: t - 3 * HORA + 90000, tipo: 'cmd', texto: 'pytest -q' }, { ts: t - 3 * HORA + 95000, tipo: 'saida', texto: '6 passed in 0.12s' }],
        joao: [{ ts: t - 2 * HORA, tipo: 'cmd', texto: 'npm run dev' }, { ts: t - 2 * HORA, tipo: 'saida', texto: 'Local: http://localhost:5173' }, { ts: t - 2 * HORA + 60000, tipo: 'prompt', texto: 'claude "Compare precos.html com o guia de marca e liste o que está fora do padrão."' }, { ts: t - 2 * HORA + 90000, tipo: 'ia', texto: '3 diferenças: fonte do título, cor do botão e espaçamento entre os planos.' }],
        felipe: [{ ts: t - HORA, tipo: 'cmd', texto: 'coop buscar "sessão expirando"' }, { ts: t - HORA, tipo: 'saida', texto: '3 trechos: Procedimento de suporte v3.pdf · aprendizado do Felipe · Chamados agosto.csv' }],
        eva: [{ ts: t - 4 * HORA, tipo: 'prompt', texto: 'claude "Com base no roteiro-depoimento.md, sugira 3 aberturas de 5 segundos no tom da Babel."' }, { ts: t - 4 * HORA + 50000, tipo: 'ia', texto: '1. "Quantos pacientes você perdeu ontem à noite?" 2. …' }],
        carla: [{ ts: t - 40 * MIN, tipo: 'cmd', texto: 'coop ler "carla/Fluxo de caixa setembro.csv"' }, { ts: t - 40 * MIN, tipo: 'saida', texto: 'item,valor,situação · Recebido,84200,ok · …' }],
        ana: [{ ts: t - 30 * MIN, tipo: 'cmd', texto: 'coop aprendizados proposta' }, { ts: t - 30 * MIN, tipo: 'saida', texto: '2 aprendizados: proposta de uma página · reajuste passa pelo financeiro' }],
        iara: [{ ts: t - 15 * MIN, tipo: 'cmd', texto: 'coop buscar "boleto"' }, { ts: t - 15 * MIN, tipo: 'saida', texto: '4 trechos: Respostas rápidas.txt · aprendizado da Iara · …' }],
        bruno: [{ ts: t - 50 * MIN, tipo: 'prompt', texto: 'claude "faz uma proposta"' }, { ts: t - 50 * MIN + 20000, tipo: 'ia', texto: 'Para qual cliente? Com qual escopo e preço? Preciso de mais detalhes.' }],
        gabi: [], hugo: []
      },
      transmissao: { gabi: false },
      eventos: [
        { id: 'e5', tipo: 'passagem', pessoa: 'bruno', de: 'bruno', para: 'theus', tarefa: 't2', texto: 'Bruno passou "Proposta Clínica Vida" para Theus', ts: t - 12 * MIN, tv: true },
        { id: 'e4', tipo: 'pronta', pessoa: 'eva', texto: 'Eva avisou que "Arte do banner da campanha de ' + mes + '" está pronta', ts: t - 15 * MIN, para: 'theus', demanda: 'd4' },
        { id: 'e3', tipo: 'recado', pessoa: 'gabi', texto: 'Bolo de aniversário da Iara na copa às 15h!', ts: t - 40 * MIN, tv: true },
        { id: 'e2', tipo: 'campanha', pessoa: 'ana', texto: 'Ana fechou mais um cliente · campanha em 38 de 50', ts: t - 55 * MIN, tv: true },
        { id: 'e1', tipo: 'aprendizado', pessoa: 'eva', texto: 'Eva aprendeu: roteiro de depoimento funciona melhor começando pela dor do cliente', ts: t - 4 * HORA, tv: true }
      ],
      sala: {
        gravando: false, desde: null, memoria: true, trechos: [],
        momentos: [{ id: 'mo1', ts: t - 20 * HORA, por: 'ana', trechos: [
          { quem: 'ana', texto: 'E se a gente fizesse um webinar só para dentistas de Campinas?', ts: t - 20 * HORA - 90000 },
          { quem: 'theus', texto: 'Gostei. Quem puxa isso?', ts: t - 20 * HORA - 60000 },
          { quem: 'eva', texto: 'Eu faço a arte e o convite até sexta.', ts: t - 20 * HORA - 30000 }
        ], ideias: ['E se a gente fizesse um webinar só para dentistas de Campinas?'] }]
      },
      seq: 100, concluidasHoje: 12, projecao: null, visita: false, temaTv: 'roxo', tvModo: 'painel', tvQuadro: null, tvSite: null,
      regras: { pausaAutomatica: false }, cuidadoOk: {}, sonho: null,
      controles: [], projetos: projetos, whatsapp: whatsapp, lojaEquipe: lojaEquipe, chaves: {},
      fazendo: { carla: 'editando planilha-clinicas.csv', bruno: 'no terminal Bruno-bot', davi: 'editando landing.html', eva: 'no chat', joao: 'no terminal Pixel', ana: 'lendo Proposta Grupo Norte.pdf', felipe: 'no terminal Zé', iara: 'no WhatsApp' },
      vendo: {}, campanhas: [], sugestaoIdeia: null,
      /* presets: tudo o que a equipe construiu na Máquina (ou como tela) e funcionou fica guardado para usar de novo em qualquer projeto */
      presets: [
        { id: 'pre1', tipo: 'backend', nome: 'Login com empresa', descricao: 'Portaria com login, gaveta de usuários fechada por empresa e cadeado.', por: 'davi', projeto: 'Clínicas', ts: t - 6 * DIA, testadoEm: t - 6 * DIA, usos: 3,
          pecas: [{ tipo: 'porta', nome: 'login', frase: 'recebe usuário e senha e abre a sessão', login: true }, { tipo: 'gaveta', nome: 'Usuários', frase: 'guarda quem entra', campos: ['nome (texto)', 'e-mail (texto)', 'empresa (ligação com Empresas)'], chave: 'fechada por empresa' }], fios: [['login', 'Usuários']] },
        { id: 'pre2', tipo: 'backend', nome: 'Agendamento com lembrete', descricao: 'Gaveta de agendamentos, porta "novo agendamento" e robô que manda o lembrete no WhatsApp.', por: 'theus', projeto: 'Clínicas', ts: t - 2 * DIA, testadoEm: t - 2 * DIA, usos: 1,
          pecas: [{ tipo: 'gaveta', nome: 'Agendamentos', frase: 'guarda os agendamentos', campos: ['quando (data e hora)', 'paciente (ligação com Pacientes)'], chave: 'fechada por empresa' }, { tipo: 'porta', nome: 'novo agendamento', frase: 'recebe os dados e grava na gaveta Agendamentos', login: true }, { tipo: 'robo', nome: 'lembrete', frase: 'um dia antes, manda o lembrete no WhatsApp' }], fios: [['novo agendamento', 'Agendamentos'], ['Agendamentos', 'lembrete']] },
        { id: 'pre3', tipo: 'tela', nome: 'Landing com planos', descricao: 'Página com cabeçalho, planos e depoimentos, na identidade da Babel.', por: 'davi', projeto: 'Clínicas', ts: t - 4 * DIA, testadoEm: t - 4 * DIA, usos: 2, arquivo: 'davi/Projetos/Clínicas/landing.html' }
      ],
      /* a Oficina: o próprio Babel Coop é mudado pelo terminal por quem o Theus liberar; ele publica e todo mundo vê "Atualizar" */
      app: { versao: 2, notas: 'v2 · TV sem botão, agentes com nome e parede de terminais', publicadaEm: t - 2 * DIA, por: 'theus', construtores: ['theus', 'bruno'],
        mudancas: [{ id: 'm1', quem: 'bruno', agente: 'Bruno-bot', texto: 'Botão "Copiar" no token de convite e atalho Ctrl+Shift+E para a Equipe', arquivos: ['vistas-b.js', 'estacao.js'], ts: t - 3 * HORA, versao: null }],
        instalada: { theus: 2, carla: 2, bruno: 2, davi: 2, eva: 2, joao: 2, ana: 1, felipe: 2, iara: 2, gabi: 2, rita: 2 },
        historico: [{ versao: 1, notas: 'v1 · Estação, TV, demandas e acervo', por: 'theus', ts: t - 9 * DIA }, { versao: 2, notas: 'v2 · TV sem botão, agentes com nome e parede de terminais', por: 'theus', ts: t - 2 * DIA }] }
    };
  };
})(window.BC);
