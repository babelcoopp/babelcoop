/* Babel Coop — protótipo · a equipe simulada (só roda numa janela: a "líder") */
window.BC = window.BC || {};

(function (BC) {
  'use strict';

  var U = BC.util, L = BC.loja, HORA = U.HORA;
  var S = {}, timer = null, timerTerminal = null, timerFala = null;

  var APRENDI = [
    'Proposta com o prazo de implantação escrito evita a pergunta mais comum do cliente.',
    'Chamado de login costuma ser sessão expirando; olhar o relógio do servidor antes de tudo.',
    'Cliente de clínica responde melhor a áudio curto do que a texto longo.',
    'Página de preços com o plano anual em destaque converte mais.',
    'Revisar o contrato com a Carla antes de mandar economiza uma volta.',
    'Quando o cliente pede desconto, oferecer o plano anual antes de baixar o preço.',
    'Testar o relatório com um mês já fechado evita erro falso.'
  ];
  var APRENDI_IA = [
    'Em Python, dataclass com tipos deixa o teste do cálculo mais legível.',
    'O CSV de chamados usa vírgula; ler com o separador explícito evita coluna trocada.',
    'Planilha exportada do banco traz datas como texto; converter antes de somar.',
    'Proposta em PDF fica melhor com o investimento na primeira página.'
  ];
  var TERMINAL = {
    programacao: [['prompt', 'Explique o erro no teste de comissão e sugira a correção.', 'ia', 'O teste falha porque a taxa de renovação está 0.4; o certo é 0.04.'],
      ['cmd', 'npm test', 'saida', '14 passed · 0 failed'], ['cmd', 'git diff --stat', 'saida', '2 files changed, 18 insertions(+), 4 deletions(-)']],
    vendas: [['cmd', 'coop buscar "desconto plano anual"', 'saida', '3 trechos: Proposta Clínica Vida.pdf · aprendizado da Ana · …'],
      ['prompt', 'Resuma a proposta do Grupo Norte em 5 linhas para mandar no WhatsApp.', 'ia', 'Pronto: 5 linhas com escopo, prazo e investimento.']],
    financeiro: [['cmd', 'coop ler "carla/Fluxo de caixa setembro.csv"', 'saida', 'item,valor,situação · Recebido,84200,ok · …'],
      ['prompt', 'Some as despesas de viagem e compare com o mês passado.', 'ia', 'Total de R$ 397,00, 12% acima do mês passado.']],
    marketing: [['prompt', 'Escreva 3 legendas curtas para o banner da campanha.', 'ia', '1. Atendimento que não dorme. 2. Sua clínica aberta às 23h. 3. …'],
      ['cmd', 'coop aprendizados legenda', 'saida', '1 aprendizado: banner com uma frase só é lido de longe']],
    suporte: [['cmd', 'coop buscar "boleto duplicado"', 'saida', '2 trechos: Chamados agosto.csv · Respostas rápidas.txt'],
      ['prompt', 'Monte uma resposta curta e gentil para o chamado #482.', 'ia', 'Oi! Achamos o problema: a sessão expirava cedo. Já corrigimos.']],
    geral: [['cmd', 'coop status', 'saida', 'Nenhuma demanda rodando agora.'], ['cmd', 'coop demandas', 'saida', '1. [enviada] Levantar leads de clínicas em Campinas']]
  };
  TERMINAL.comercial = TERMINAL.vendas;
  TERMINAL.atendimento = TERMINAL.suporte;

  var CHAT = [
    ['geral', 'joao', 'Subi a página de preços nova em homologação 🚀'], ['geral', 'iara', 'Alguém sabe se a Acme já recebeu o contrato?'],
    ['comercial', 'bruno', 'A Clínica Vida quer começar na segunda'], ['suporte', 'felipe', '#482 resolvido, era a sessão mesmo'],
    ['dev', 'davi', 'Testes do relatório de comissões passando ✅'], ['marketing', 'eva', 'Legendas do banner estão no meu HD'],
    ['geral', 'carla', 'Lembrando: notas de despesas até quinta!']
  ];
  var FALAS = [
    ['ana', 'E se a gente fizesse um webinar só para dentistas de Campinas?'], ['bruno', 'Os clientes sempre perguntam do plano anual primeiro.'],
    ['davi', 'Dá para gerar o relatório de comissão direto do acervo.'], ['eva', 'Que tal um vídeo de 30 segundos mostrando a TV funcionando?'],
    ['theus', 'Vamos testar a pergunta da semana na segunda de manhã.'], ['felipe', 'Metade dos chamados de hoje era a mesma coisa.'],
    ['iara', 'A gente podia mandar um áudio de boas-vindas para cliente novo.'], ['joao', 'O preço anual em destaque aumentou os cliques.'],
    ['carla', 'Toda proposta com desconto precisa passar por mim antes.']
  ];
  var PEDIDOS = [['Conferir a nota fiscal da Acme', 'carla', 20], ['Aprovar o post de sexta', 'eva', 15],
    ['Liberar acesso ao banco de homologação', 'felipe', 10], ['Assinar a proposta da vaga de SDR', 'gabi', 10]];
  var LIVRES = [['Traduzir o folheto da Babel para o espanhol', 'eva', 60], ['Testar a página de preços no celular', 'joao', 20],
    ['Juntar as dúvidas mais comuns de clientes desta semana', 'iara', 30], ['Conferir os contatos duplicados na planilha de leads', 'ana', 25]];
  var RECADOS = ['Café novo na copa', 'Alguém viu o cabo HDMI da sala 2?', 'Hoje tem pizza depois das 18h', 'Impressora do corredor voltou a funcionar'];

  function ativo(id) { var p = L.pessoa(id); return !!p && id !== L.eu && p.status !== 'offline' && p.status !== 'ausente'; }
  function outros() { return L.estado.pessoas.filter(function (p) { return ativo(p.id); }); }

  function agir() {
    var e = L.estado, agora = Date.now(), op = [];
    function add(peso, fn) { for (var i = 0; i < peso; i++) op.push(fn); }

    e.demandas.forEach(function (d) {
      if (d.id === 'd6') return; /* a da Carla fica demorando, para o "cuidando da gente" aparecer */
      if (ativo(d.para)) {
        if (d.estado === 'enviada' && agora - d.criada > 15000) add(3, function () { L.fazerComo(d.para, 'comecar', d.id); });
        if (d.estado === 'andamento' && agora - d.inicio > 40000) {
          add(2, function () { L.fazerComo(d.para, 'pronta', d.id, U.sorteia(APRENDI)); });
          add(1, function () { L.fazerComo(d.para, 'pausar', d.id, U.sorteia(BC.MOTIVOS.slice(0, 4))); });
        }
        if (d.estado === 'pausada' && L.ultimaPausa(d).motivo !== 'travado') add(2, function () { L.fazerComo(d.para, 'retomar', d.id); });
      }
      if (ativo(d.de) && d.estado === 'pronta') add(3, function () { L.fazerComo(d.de, 'ok', d.id); });
    });

    e.demandas.forEach(function (d) {
      if (d.estado === 'livre' && agora - d.criada > 90000) add(1, function () { var p = U.sorteia(outros()); if (p) L.fazerComo(p.id, 'pegar', d.id); });
    });
    if (e.demandas.filter(function (d) { return d.estado === 'livre'; }).length < 2 && Math.random() < 0.3) {
      add(1, function () {
        var x = U.sorteia(LIVRES), p = L.pessoa(x[1]);
        if (p && ativo(p.id)) L.fazerComo(p.id, 'novaDemanda', { titulo: x[0], para: null, estimativaMin: x[2], prioridade: 'baixa', descricao: 'Quem puder, pega.' });
      });
    }

    e.tarefas.forEach(function (t) {
      var n = L.fluxo(t.fluxo).etapas.length;
      if (t.atual < n && ativo(t.donos[t.atual])) add(1, function () { L.fazerComo(t.donos[t.atual], 'concluirEtapa', t.id); });
    });

    add(2, function () { var x = U.sorteia(CHAT); if (ativo(x[1])) L.fazerComo(x[1], 'mensagem', x[0], x[2]); });
    add(1, function () { L.fazerComo(U.sorteia(['ana', 'bruno']), 'maisUmCliente'); });
    add(1, function () { var i = U.sorteia(e.ideias), p = U.sorteia(outros()); if (i && p) L.fazerComo(p.id, 'apoiar', i.id); });
    add(1, function () { var pr = U.sorteia(e.prompts), p = U.sorteia(outros()); if (pr && p && p.id !== pr.pessoa) L.fazerComo(p.id, 'estrela', pr.id); });
    if (Math.random() < 0.25) add(1, function () { var p = U.sorteia(outros()); if (p) L.fazerComo(p.id, 'recado', U.sorteia(RECADOS)); });

    var pendentes = e.demandas.filter(function (d) { return d.para === L.eu && d.estado === 'enviada'; }).length;
    if (pendentes < 2 && Math.random() < 0.3) {
      var pd = U.sorteia(PEDIDOS);
      if (ativo(pd[1])) add(1, function () { L.fazerComo(pd[1], 'novaDemanda', { titulo: pd[0], para: L.eu, estimativaMin: pd[2], prioridade: 'média', prazo: Date.now() + 4 * HORA }); });
    }

    if (op.length) U.sorteia(op)();
  }

  /* os terminais da equipe ao vivo */
  function terminais() {
    var e = L.estado, p = U.sorteia(e.pessoas.filter(function (x) { return ativo(x.id) && e.transmissao[x.id] !== false; }));
    if (!p) return;
    var par = U.sorteia(TERMINAL[p.area] || TERMINAL.geral), ags = p.agentes || [], ag = ags.length ? U.sorteia(ags) : null;
    var entrada = par[0] === 'prompt' ? par[1] : par[1];
    if (par[0] === 'prompt') L.A.prompt(p.id, par[1]);
    L.fazerComo(p.id, 'terminal', [{ tipo: par[0], texto: entrada, agente: ag && ag.id }, { tipo: par[2], texto: par[3], agente: ag && ag.id }]);
    if (par[0] === 'prompt' && Math.random() < 0.3) L.fazerComo(p.id, 'aprendizado', U.sorteia(APRENDI_IA), 'terminal de ' + p.nome, true);
  }

  /* falas na sala, quando a memória ou a gravação estão ligadas; a sala sugere quando a frase tem cara de ideia */
  function fala() {
    var s = L.estado.sala, r = L.estado.reuniao;
    if (!s.memoria && !s.gravando) return;
    if (!(r && r.ativa) && Math.random() < 0.6) return;
    var x = U.sorteia(FALAS);
    if (x[0] !== L.eu && !ativo(x[0])) return;
    L.fazerComo(x[0], 'falaSala', x[1]);
    if (/^(e se|que tal|a gente podia)/i.test(x[1]) && Math.random() < 0.7) L.fazerComo(x[0], 'ideiaSugerida', x[1]);
  }

  /* gente junta: o que cada um está fazendo, quem está vendo o meu arquivo, quem pede para entrar no terminal, WhatsApp chegando */
  var FAZENDO = ['editando {arq}', 'no terminal {ag}', 'no chat', 'lendo {arq}', 'no WhatsApp', 'na Máquina do projeto', 'no navegador · clinicavida.com.br'];
  function juntos() {
    var e = L.estado, ps = outros();
    if (!ps.length) return;
    var p = U.sorteia(ps), meus = e.arquivos.filter(function (a) { return a.dono === p.id; }), ag = (p.agentes || [])[0];
    var texto = U.sorteia(FAZENDO).replace('{arq}', meus.length ? U.sorteia(meus).caminho.split('/').pop() : 'notas.md').replace('{ag}', ag ? ag.nome : 'terminal');
    L.fazerComo(p.id, 'fazendo', texto);
    if (Math.random() < 0.45) {
      var deMim = e.arquivos.filter(function (a) { return a.dono === L.eu; }), alvo = deMim.length ? U.sorteia(deMim) : null;
      if (alvo) { L.fazerComo(p.id, 'vendoArquivo', alvo.id); setTimeout(function () { L.fazerComo(p.id, 'vendoArquivo', null); }, 30000); }
    }
    var cs = e.controles || [], jaComigo = cs.some(function (c) { return c.dono === L.eu && c.estado !== 'encerrado'; });
    if (!jaComigo && Math.random() < 0.28) {
      var quem = L.eAdmin() ? U.sorteia(ps) : (L.pessoa('theus') && Math.random() < 0.6 ? L.pessoa('theus') : U.sorteia(ps));
      if (quem && quem.id !== L.eu) {
        L.fazerComo(quem.id, 'pedirEntrar', L.eu, ag && (L.pessoa(L.eu).agentes || [])[0] ? L.pessoa(L.eu).agentes[0].id : null);
        var c = (L.estado.controles || []).filter(function (x) { return x.quem === quem.id && x.dono === L.eu && x.estado !== 'encerrado'; }).pop();
        if (c && c.estado === 'ativo') {
          setTimeout(function () { L.fazerComo(quem.id, 'controleDigitar', c.id, 'coop status'); }, 4000);
          setTimeout(function () { L.fazerComo(quem.id, 'controleDigitar', c.id, 'cat README.md'); }, 12000);
          setTimeout(function () { L.fazerComo(quem.id, 'sairTerminal', c.id); }, 40000);
        }
      }
    }
    if (e.whatsapp && e.whatsapp.pareado && Math.random() < 0.2) {
      var conv = U.sorteia(e.whatsapp.conversas);
      L.fazerComo(L.eu, 'waReceber', conv.id, U.sorteia(['Oi! Ainda dá para começar esta semana?', 'Recebi a proposta, obrigada. Tem desconto no anual?', 'Qual o horário de atendimento?']), ag ? ag.nome : 'Assistente');
    }
  }

  function passo() {
    try { agir(); } catch (e) { console.error(e); }
    timer = setTimeout(passo, U.entre(11000, 18000));
  }

  var timerJuntos = null;
  S.iniciar = function () {
    if (timer) return;
    timer = setTimeout(passo, 7000);
    timerTerminal = setInterval(function () { try { terminais(); } catch (e) { console.error(e); } }, 9000);
    timerFala = setInterval(function () { try { fala(); } catch (e) { console.error(e); } }, 7000);
    timerJuntos = setInterval(function () { try { juntos(); } catch (e) { console.error(e); } }, 21000);
    setTimeout(function () { try { juntos(); } catch (e) { console.error(e); } }, 5000);
  };
  S.parar = function () {
    clearTimeout(timer); clearInterval(timerTerminal); clearInterval(timerFala); clearInterval(timerJuntos);
    timer = timerTerminal = timerFala = timerJuntos = null;
  };

  BC.simulador = S;
})(window.BC);
