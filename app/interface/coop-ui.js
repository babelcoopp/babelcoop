/* Babel Coop · coop-ui: a tela local executa as ferramentas coop_* do conector MCP (PROTOCOLO §8)
   Fluxo: o Claude Code chama uma ferramenta coop_* → servidor (servidor/coop-mcp.js) → esta tela recebe
   `mcp-chamada {cid, sessao, ferramenta, args, agente:{id,nome,dono}}` pelo BC.real.ouvir → executa com L.fazer
   (as mesmas ações do protótipo: prototipo/acoes.js, os comandos `coop ...` de prototipo/terminal.js) →
   responde `mcp-resposta {cid, ok, resultado:{texto, dados?}}` ou `{cid, ok:false, erro}` pelo BC.real.enviar.

   Assinatura: toda ação feita por agente passa pela ação `porAgente` (definida aqui, em L.A). Ela roda a ação do app
   e marca o que nasceu dela com "<agente> · <pessoa>": o texto do evento (Novidades da Estação e ticker da TV),
   `ev.agente`, `ev.assinatura` e o item criado (aviso, recado, campanha, demanda…). Como `porAgente` é uma ação,
   ela vai para o diário e as outras Estações aplicam a mesma coisa, com a mesma assinatura.

   Quem responde: só a janela da Estação (nunca a TV nem o iPad) e, com mais de uma janela da Estação aberta,
   só a líder (L.lider). Cada cid é executado uma vez.
   Visível na tela: um aviso curto na Estação ("Rita · Theus: aviso na TV") e o evento de janela `coop-feito`
   (detail {tipo:'acao'|'consulta', ferramenta, agente, assinatura, resumo, sessao, ts}); BC.coop.aoFeito(fn) para as peças
   que queiram mostrar (presença, parede, placar). Som só quando a meta da campanha bate 100 % ('tres', TERMINAL_2030 §6).
   Carregado depois de ponte.js (lista INJETAR do servidor: /coop/coop-ui.js). JS puro, sem módulos.
*/
(function () {
  'use strict';
  var BC = window.BC;
  if (!BC || !BC.loja || !BC.real) return;
  if (BC.coop && BC.coop.versao) return; /* já carregado nesta página */
  var L = BC.loja, U = BC.util || {};

  /* a mesma lista de servidor/coop-mcp.js (o teste confere que as duas batem) */
  var PERMITIDAS = [
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
  var permitida = {};
  PERMITIDAS.forEach(function (a) { permitida[a] = true; });

  function normalizar(s) {
    if (U.normalizar) return U.normalizar(String(s == null ? '' : s));
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  }
  function curto(s, max) { s = String(s == null ? '' : s).trim(); return s.length > max ? s.slice(0, max) : s; }
  function dois(n) { return (n < 10 ? '0' : '') + n; }
  function dataCurta(ts) { var d = new Date(ts); return dois(d.getDate()) + '/' + dois(d.getMonth() + 1); }
  function recusa(msg) { var e = new Error(msg); e.recusa = true; return e; }

  /* ---------- a ação assinada ---------- */
  var COLECOES = ['avisos', 'mural', 'ideias', 'campanhas', 'demandas', 'aprendizados', 'projetos', 'tarefas'];
  function primeiros() {
    var e = L.estado || {}, r = { campanha: e.campanha || null };
    COLECOES.forEach(function (c) { var l = e[c]; r[c] = l && l[0] ? l[0].id : null; });
    return r;
  }
  function assinar(ev, agente, assinatura) {
    if (!ev || typeof ev !== 'object') return;
    ev.agente = agente;
    ev.assinatura = assinatura;
    if (typeof ev.texto === 'string' && ev.texto.indexOf(assinatura + ': ') !== 0) ev.texto = assinatura + ': ' + ev.texto;
    if (typeof ev.textoTv === 'string' && ev.textoTv) ev.textoTv = ev.textoTv + ' · ' + assinatura;
  }
  /* porAgente(quem, {id, nome}, acao, [args], resumo): roda L.A[acao] em nome de quem e assina com o agente */
  L.A.porAgente = function (quem, ag, acao, args, resumo) {
    if (!ag || typeof ag !== 'object' || typeof ag.nome !== 'string' || !ag.nome.trim()) return;
    if (!permitida[acao] || typeof L.A[acao] !== 'function') return;
    var agente = { id: curto(ag.id, 64), nome: curto(ag.nome, 24) };
    var assinatura = agente.nome + ' · ' + L.nome(quem);
    var antes = primeiros();
    var r = L.A[acao].apply(null, [quem].concat(Array.isArray(args) ? args.slice(0, 6) : []));
    if (!r || r === 'cedo') return r;
    var depois = primeiros(), e = L.estado;
    COLECOES.forEach(function (c) { if (depois[c] && depois[c] !== antes[c]) { var it = e[c][0]; it.agente = agente; it.assinatura = assinatura; } });
    if (depois.campanha && depois.campanha !== antes.campanha) { depois.campanha.agente = agente; depois.campanha.assinatura = assinatura; }
    var evs = Array.isArray(r) ? r.slice() : [];
    evs.forEach(function (ev) { assinar(ev, agente, assinatura); });
    if (!evs.length) evs.push(L._evento('agente-fez', quem, assinatura + ': ' + curto(resumo || acao, 200), { discreto: true, agente: agente, assinatura: assinatura, acao: acao }));
    return evs;
  };

  /* ---------- procurar pessoa, arquivo e prazo ---------- */
  function pessoas() { return (L.estado && L.estado.pessoas) || []; }
  function acharPessoa(txt) {
    var q = normalizar(txt).replace(/^(para|pra|com)\s+/, '').replace(/^(a|o|as|os)\s+/, '').trim();
    if (!q) return null;
    var lista = pessoas(), i, p;
    for (i = 0; i < lista.length; i++) if (lista[i].id === String(txt).trim() || normalizar(lista[i].id) === q) return lista[i];
    for (i = 0; i < lista.length; i++) if (normalizar(lista[i].nome) === q) return lista[i];
    for (i = 0; i < lista.length; i++) { p = normalizar(lista[i].nome).split(/\s+/)[0]; if (p === q.split(/\s+/)[0]) return lista[i]; }
    return null;
  }
  function nomesDaEquipe() { return pessoas().map(function (p) { return p.nome; }).join(', '); }
  function pessoaOuRecusa(txt) {
    var p = acharPessoa(txt);
    if (!p) throw recusa('não achei "' + curto(txt, 60) + '" na equipe. Pessoas: ' + nomesDaEquipe() + '.');
    return p;
  }
  function lerPrazo(txt) {
    var s = String(txt || '').trim(), m, ano, mes, dia, hoje = new Date();
    if ((m = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/.exec(s))) { dia = +m[1]; mes = +m[2]; ano = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : hoje.getFullYear(); }
    else if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s))) { ano = +m[1]; mes = +m[2]; dia = +m[3]; }
    else throw recusa('prazo "' + curto(s, 30) + '" não entendido: use 30/09, 30/09/2026 ou 2026-09-30.');
    var d = new Date(ano, mes - 1, dia, 18, 0, 0, 0);
    if (d.getMonth() !== mes - 1 || d.getDate() !== dia) throw recusa('a data ' + s + ' não existe.');
    return { ts: d.getTime(), texto: dois(dia) + '/' + dois(mes) };
  }
  function acharArquivo(txt) {
    var q = String(txt || '').trim(), ql = q.toLowerCase(), lista = (L.estado && L.estado.arquivos) || [];
    return L.arquivo(q) || lista.filter(function (a) { return a.caminho.toLowerCase() === ql; })[0] ||
      lista.filter(function (a) { return a.caminho.split('/').pop().toLowerCase() === ql; })[0] ||
      lista.filter(function (a) { return a.caminho.toLowerCase().indexOf(ql) !== -1; })[0] || null;
  }
  function membrosReais() {
    var r = {}, eu = BC.real.eu && BC.real.eu();
    if (eu && eu.id) r[eu.id] = true;
    ((BC.real.pares && BC.real.pares()) || []).forEach(function (p) { if (p && p.id) r[p.id] = true; });
    return r;
  }

  /* ---------- as ferramentas: cada uma devolve {texto, dados?} ou lança uma recusa em português ---------- */
  var F = {};

  F.coop_tv = function (a, c) {
    var modo = a.modo;
    if (modo === 'site') {
      if (!a.url) throw recusa('diga o endereço do site (url).');
      var url = curto(a.url, 2048);
      c.fazer('tvSite', [url], 'site ' + url.replace(/^https?:\/\//, '') + ' na TV');
      return { texto: 'Site ' + L.estado.tvSite.url + ' na TV. A TV só mostra; para tirar, coop_tv com modo painel.' };
    }
    if (modo === 'visita') {
      if (!L.eAdmin()) throw recusa('só a gestão liga o modo visita.');
      var ligado = a.ligado !== false;
      c.fazer('visita', [ligado], 'modo visita ' + (ligado ? 'ligado' : 'desligado'));
      return { texto: 'Modo visita ' + (ligado ? 'ligado' : 'desligado') + ' na TV.' };
    }
    if (['painel', 'reuniao', 'quadro'].indexOf(modo) === -1) throw recusa('modo da TV desconhecido: ' + curto(modo, 20));
    c.fazer('tvModo', [modo], 'TV no modo ' + modo);
    return { texto: 'TV no modo ' + modo + '.' };
  };

  F.coop_projetar = function (a, c) {
    var arq = acharArquivo(a.arquivo);
    if (!arq) {
      var alguns = ((L.estado && L.estado.arquivos) || []).slice(0, 12).map(function (x) { return x.caminho; }).join(' · ');
      throw recusa('arquivo "' + curto(a.arquivo, 80) + '" não encontrado no acervo.' + (alguns ? ' Alguns: ' + alguns : ''));
    }
    c.fazer('projetar', [arq.caminho], 'projetou ' + arq.caminho.split('/').pop() + ' na TV');
    return { texto: 'Projetando "' + arq.caminho + '" na TV. Role com coop_acao rolarProjecao [0.25] ou [-0.25].', dados: { caminho: arq.caminho } };
  };

  F.coop_aviso = function (a, c) {
    if (!L.eAdmin()) throw recusa('só a gestão manda aviso oficial. Use coop_mural para um recado.');
    var t = curto(a.texto, 280);
    c.fazer('aviso', [t], 'aviso na TV');
    var av = L.estado.avisos[0];
    return { texto: 'Aviso na TV: "' + t + '" · assinado ' + c.assinatura + '.', dados: { id: av && av.id, texto: t, assinatura: c.assinatura } };
  };

  F.coop_mural = function (a, c) {
    var t = curto(a.texto, 280);
    c.fazer('recado', [t], 'recado no mural');
    return { texto: 'Recado no mural da TV: "' + t + '" · assinado ' + c.assinatura + '.' };
  };

  F.coop_ideia = function (a, c) {
    var t = curto(a.texto, 500);
    c.fazer('ideia', [t], 'ideia registrada');
    return { texto: 'Ideia registrada e na TV: "' + t + '" · assinada ' + c.assinatura + '.' };
  };

  F.coop_demanda = function (a, c) {
    var p = a.para ? pessoaOuRecusa(a.para) : null;
    var prazo = a.prazo ? lerPrazo(a.prazo) : null;
    var titulo = curto(a.titulo, 120);
    var dados = {
      titulo: titulo, para: p ? p.id : null, prazo: prazo ? prazo.ts : null, estimativaMin: a.estimativa_min || null,
      prioridade: a.prioridade || 'média',
      descricao: (a.descricao ? curto(a.descricao, 2000) + '\n\n' : '') + 'Criada pelo agente ' + c.agente.nome + ' a pedido de ' + L.nome(L.eu) + '.'
    };
    c.fazer('novaDemanda', [dados], 'demanda "' + titulo + '"' + (p ? ' para ' + p.nome : ' livre'));
    var d = L.estado.demandas[0];
    return {
      texto: 'Demanda "' + titulo + '" ' + (p ? 'enviada para ' + p.nome : 'deixada livre: pega quem puder') + (prazo ? ' · até ' + prazo.texto : '') + ' · assinada ' + c.assinatura + '.',
      dados: { id: d && d.id, titulo: titulo, para: p ? p.id : null, prazo: prazo ? prazo.texto : null }
    };
  };

  F.coop_campanha = function (a, c) {
    var p = pessoaOuRecusa(a.para), prazo = lerPrazo(a.prazo), nome = curto(a.nome, 80);
    /* "gera a campanha" do plano (prototipo/campanha.js, F3): quando existe, a campanha nasce com as peças no palco
       (landing, anúncios, WhatsApp, calendário), cada uma com dono, e o agente assina o pedido. Sem ele, o caminho de antes. */
    if (BC.campanha && typeof BC.campanha.gerar === 'function') {
      var g;
      try { g = BC.campanha.gerar({ nome: nome, meta: a.meta, para: p.id, prazo: prazo.texto, por: L.eu, agente: c.agente.id, pedido: 'coop_campanha · ' + nome + ' para ' + p.nome + ' até ' + prazo.texto + ' · pedido por ' + c.assinatura }); }
      catch (e) { g = { erro: 'a campanha não nasceu: ' + e.message }; }
      if (!g || g.erro) throw recusa((g && g.erro) || 'a campanha não nasceu.');
      c.anunciar('campanha "' + nome + '" para ' + p.nome + ' (gerando as peças)');
      var pecas = (g.pecas || []).map(function (x) { return x.titulo + (x.arquivo ? ' (' + x.arquivo + ')' : ''); });
      return {
        texto: 'Campanha "' + nome + '" gerada para ' + p.nome + ' · meta ' + a.meta + ' · até ' + prazo.texto + (g.endereco ? ' · em ' + g.endereco : '') +
          (pecas.length ? ' · peças: ' + pecas.join(', ') : '') + ' · pedida por ' + c.assinatura + '.',
        dados: { id: g.id, nome: nome, meta: a.meta, para: p.id, prazo: prazo.texto, estado: g.estado, endereco: g.endereco || null, pecas: g.pecas || [] }
      };
    }
    var m = /^\s*\d+\s+(.+)$/.exec(nome), unidade = curto(a.unidade || (m ? m[1] : nome), 40);
    var dados = { titulo: nome, alvo: a.meta, unidade: unidade, pessoa: p.id, prazo: prazo.ts, prazoTexto: prazo.texto, principal: a.principal !== false };
    c.fazer('novaCampanha', [dados], 'campanha "' + nome + '" para ' + p.nome);
    var camp = (L.estado.campanhas || [])[0];
    return {
      texto: 'Campanha "' + nome + '" criada para ' + p.nome + ' · meta ' + a.meta + ' · até ' + prazo.texto + (dados.principal ? ' · já está na TV' : '') + ' · assinada ' + c.assinatura + '.',
      dados: { id: camp && camp.id, nome: nome, meta: a.meta, para: p.id, prazo: prazo.texto }
    };
  };

  F.coop_meta = function (a, c) {
    var camp = L.estado.campanha;
    if (!camp) throw recusa('não há campanha principal agora. Crie com coop_campanha.');
    var linha = function () { return 'Campanha "' + camp.nome + '": ' + camp.atual + ' de ' + camp.alvo + ' ' + (camp.descricao || '') + (camp.atual < camp.alvo ? ' · faltam ' + (camp.alvo - camp.atual) : ' · meta batida!') + (camp.fim ? ' · até ' + dataCurta(camp.fim) : ''); };
    if (!a.mais) return { texto: linha() + '.', dados: { nome: camp.nome, atual: camp.atual, alvo: camp.alvo } };
    if (camp.atual >= camp.alvo) return { texto: linha() + '. Nada a somar.', dados: { nome: camp.nome, atual: camp.atual, alvo: camp.alvo } };
    var feitos = 0, i;
    for (i = 0; i < a.mais && camp.atual < camp.alvo; i++) { c.fazer('maisUmCliente', [], 'mais um cliente na campanha'); feitos++; camp = L.estado.campanha; }
    if (camp.atual >= camp.alvo && BC.organismo && BC.organismo.som) BC.organismo.som('tres');
    return { texto: '+' + feitos + ' · ' + linha() + '.', dados: { nome: camp.nome, atual: camp.atual, alvo: camp.alvo, somados: feitos } };
  };

  F.coop_buscar = function (a, c) {
    var q = curto(a.termo, 200), e = L.estado;
    /* a memória com nome (prototipo/memoria-nome.js): quando existe, a busca cita quem ensinou ("Aprendizado · Davi · … ·
       usado N×") e conta o uso para o autor (a luz acende na tela dele). Sem ela, a busca do acervo de antes. */
    if (BC.memoria && typeof BC.memoria.consultar === 'function') {
      var achados;
      try { achados = BC.memoria.consultar(q, { quem: L.eu, agente: c.agente.id, limite: 8 }); } catch (err) { achados = null; }
      if (Array.isArray(achados)) {
        var lista = achados.map(function (x) {
          return { onde: x.caminho || x.titulo, tipo: x.tipo, rotulo: x.rotulo || '', autor: x.autor || '', usos: x.usos, memoria: !!x.memoria, trecho: String(x.trecho || '').slice(0, 160) };
        });
        c.consulta('consultou a memória da equipe: "' + q + '"');
        return {
          texto: lista.length + ' resultado(s) para "' + q + '" (memória com nome, sem LLM)' + (lista.length ? ':\n' + lista.map(function (x) { return '- ' + (x.memoria ? x.rotulo : x.onde + ' · ' + x.tipo) + ' · ' + x.trecho; }).join('\n') + '\nAo usar algo daqui, cite quem ensinou.' : '.'),
          dados: { termo: q, resultados: lista }
        };
      }
    }
    if (!BC.acervo) throw recusa('o acervo não está carregado nesta tela.');
    var res = BC.acervo.buscar(e, q, { limite: 8 });
    if (!res.length) res = BC.acervo.buscar(e, q, { limite: 8, modo: 'semelhanca' });
    var itens = res.map(function (x) {
      return { onde: x.doc.caminho || x.doc.titulo, tipo: x.doc.tipo, trecho: String(x.trecho || '').replace(/<\/?mark>/g, '').replace(/&[a-z#0-9]+;/g, ' ').slice(0, 160) };
    });
    c.consulta('consultou o acervo: "' + q + '"');
    return {
      texto: itens.length + ' resultado(s) para "' + q + '" (busca sem LLM)' + (itens.length ? ':\n' + itens.map(function (x) { return '- ' + x.onde + ' · ' + x.tipo + ' · ' + x.trecho; }).join('\n') : '.'),
      dados: { termo: q, resultados: itens }
    };
  };

  F.coop_aprendi = function (a, c) {
    var t = curto(a.texto, 500);
    if (t.length < 8) throw recusa('escreva o aprendizado numa frase (8 letras ou mais).');
    var n = L.A.checarNovidade ? L.A.checarNovidade(t) : { repetido: false };
    c.fazer('aprendizado', [t, 'agente ' + c.agente.nome, true], 'aprendizado registrado');
    return { texto: n.repetido ? 'A equipe já sabia: somou +1 em "' + n.parecido.texto + '".' : 'Aprendizado novo registrado: a IA de todos vai ler isso. Assinado ' + c.assinatura + '.' };
  };

  /* coop_ler e coop_aprendizados: no app real o servidor responde do acervo (servidor/acervo.js); aqui é a volta da tela
     quando a Estação não tem acervo (runtime sem node:sqlite) */
  F.coop_ler = function (a, c) {
    var ref = curto(a.id || a.caminho, 500), e = L.estado;
    if (!ref) throw recusa('diga o id ou o caminho.');
    var d = BC.acervo && BC.acervo.doc ? BC.acervo.doc(e, ref) : null;
    if (!d) d = (e.arquivos || []).filter(function (x) { return x.caminho === ref || x.id === ref; }).map(function (x) { return { titulo: x.caminho, texto: x.conteudo || '', tipo: x.tipo }; })[0] || null;
    if (!d) throw recusa('não achei "' + ref + '" no acervo desta tela.');
    c.consulta('leu no acervo: ' + curto(d.titulo, 80));
    return { texto: d.titulo + '\n\n' + String(d.texto || ''), dados: { id: ref, tipo: d.tipo || null } };
  };

  F.coop_aprendizados = function (a, c) {
    var n = Math.max(1, Math.min(50, +a.limite || 20));
    var lista = (L.estado.aprendizados || []).map(function (x) {
      return { texto: x.texto, autor: L.nome(x.pessoa), usos: BC.memoria && BC.memoria.usos ? BC.memoria.usos('ap:' + x.id) : 0, confirmacoes: (x.confirmacoes || []).length };
    }).sort(function (p, q) { return (q.usos - p.usos) || (q.confirmacoes - p.confirmacoes); }).slice(0, n);
    c.consulta('leu os aprendizados da equipe');
    return { texto: lista.length ? lista.map(function (x, i) { return (i + 1) + '. ' + x.texto + ' — ' + x.autor + ' · usado ' + x.usos + '×' + (x.confirmacoes ? ' · +' + x.confirmacoes + ' confirmado' : ''); }).join('\n') : 'A equipe ainda não registrou aprendizados.', dados: { aprendizados: lista } };
  };

  F.coop_momento = function (a, c) {
    c.fazer('guardarMomento', [], 'guardou os últimos 5 minutos da sala', 'a sala não tem falas guardadas agora (a memória da sala está ligada?).');
    return { texto: 'Os últimos 5 minutos da sala foram guardados no acervo.' };
  };

  F.coop_sonhar = function (a, c) {
    c.fazer('sonhar', [], 'sonho feito');
    var s = L.estado.sonho || {};
    return { texto: 'Sonho feito: ' + ((s.novos || []).length) + ' aprendizados novos e ' + ((s.temas || []).length) + ' temas. Veja em Inteligência → Sonho.' };
  };

  F.coop_pessoas = function (a, c) {
    var reais = membrosReais();
    var lista = pessoas().map(function (p) {
      return { id: p.id, nome: p.nome, papel: p.papel === 'admin' ? 'gestão' : 'membro', area: p.area || '', online: p.status !== 'offline', status: p.status || '',
        origem: reais[p.id] ? 'token' : 'exemplo', agentes: (p.agentes || []).map(function (x) { return x.nome; }) };
    });
    c.consulta('consultou as pessoas da equipe');
    return {
      texto: lista.length + ' pessoas na equipe:\n' + lista.map(function (p) {
        return '- ' + p.nome + ' (' + p.id + ') · ' + p.papel + (p.area ? ' · ' + p.area : '') + ' · ' + (p.online ? 'online' : 'offline') +
          ' · agentes: ' + (p.agentes.join(', ') || 'nenhum') + (p.origem === 'exemplo' ? ' · (sem token: equipe de exemplo)' : '');
      }).join('\n'),
      dados: { pessoas: lista }
    };
  };

  F.coop_projetos = function (a, c) {
    var lista = ((L.estado && L.estado.projetos) || []).map(function (pj) {
      return { id: pj.id, nome: pj.nome, membros: (pj.membros || []).map(L.nome), pasta: pj.pasta || '', proximos: (pj.proximos || []).slice(-3).map(function (x) { return x.texto; }) };
    });
    c.consulta('consultou os projetos');
    return {
      texto: lista.length ? lista.length + ' projeto(s):\n' + lista.map(function (p) { return '- ' + p.nome + ' · ' + p.membros.join(', ') + (p.pasta ? ' · ' + p.pasta : '') + (p.proximos.length ? ' · próximos: ' + p.proximos.join('; ') : ''); }).join('\n') : 'Nenhum projeto ainda.',
      dados: { projetos: lista }
    };
  };

  F.coop_demandas = function (a, c) {
    var alvo = a.pessoa ? pessoaOuRecusa(a.pessoa) : L.pessoa(L.eu);
    var ds = (L.estado && L.estado.demandas) || [];
    var minhas = ds.filter(function (d) { return alvo && d.para === alvo.id && d.estado !== 'concluida' && d.estado !== 'cancelada'; });
    var livres = ds.filter(function (d) { return d.estado === 'livre'; });
    var fmt = function (d) { return { id: d.id, titulo: d.titulo, estado: d.estado, de: L.nome(d.de), para: d.para ? L.nome(d.para) : null, prazo: d.prazo ? dataCurta(d.prazo) : null }; };
    c.consulta('consultou as demandas' + (alvo ? ' de ' + alvo.nome : ''));
    return {
      texto: (alvo ? alvo.nome : 'Você') + ': ' + minhas.length + ' demanda(s) aberta(s)' + (minhas.length ? ':\n' + minhas.map(function (d) { return '- [' + d.estado + '] ' + d.titulo + ' · de ' + L.nome(d.de) + (d.prazo ? ' · até ' + dataCurta(d.prazo) : ''); }).join('\n') : '.') +
        '\nLivres: ' + (livres.length ? livres.map(function (d) { return d.titulo; }).join(' · ') : 'nenhuma') + '.',
      dados: { pessoa: alvo ? alvo.id : null, abertas: minhas.map(fmt), livres: livres.map(fmt) }
    };
  };

  /* ---------- a Máquina (prototipo/maquina.js): o estado da equipe guarda as peças de cada projeto; a tela aplica ---------- */
  function maquinaOuRecusa() {
    var M = BC.maquina;
    if (!M || typeof M.doEstado !== 'function') throw recusa('a Máquina não está carregada nesta tela.');
    return M;
  }
  function projetoOuRecusa(txt) {
    var lista = (L.estado && L.estado.projetos) || [];
    if (!lista.length) throw recusa('a equipe ainda não tem projeto: crie um com coop_acao {"acao":"novoProjeto","args":[{"nome":"…"}]} e depois monte a Máquina dele.');
    if (txt == null || String(txt).trim() === '') return lista[0];
    var id = String(txt).trim(), q = normalizar(txt);
    var pj = lista.filter(function (p) { return p.id === id; })[0] || lista.filter(function (p) { return normalizar(p.nome) === q; })[0] || lista.filter(function (p) { return normalizar(p.nome).indexOf(q) !== -1; })[0];
    if (!pj) throw recusa('não achei o projeto "' + curto(txt, 80) + '". Projetos: ' + lista.map(function (p) { return p.nome; }).join(', ') + '.');
    return pj;
  }
  function nomeTipo(M, t) { return (M.TIPOS && M.TIPOS[t]) || t; }
  function pecasDaMaquina(M, pj) { var d = M.doEstado(pj.id); return d.pecas.length ? d.pecas.map(function (p) { return nomeTipo(M, p.tipo) + ' "' + p.nome + '"'; }).join(', ') : 'nenhuma ainda'; }
  function pecaOuRecusa(M, pj, ref) {
    var p = M.pecaDoEstado(pj.id, ref);
    if (!p) throw recusa('não achei a peça "' + curto(ref, 80) + '" na Máquina de ' + pj.nome + '. Peças: ' + pecasDaMaquina(M, pj) + '.');
    return p;
  }
  /* a Máquina deste projeto aparece no meio enquanto o agente monta (como o arquivo que nasce, §10) */
  function mostrarMaquina(M, pj) {
    try { var t = BC.estacao && BC.estacao.abaAtual && BC.estacao.abaAtual(); if (!t || t.tipo !== 'maquina' || t.ref !== pj.id) M.abrir(pj.id); } catch (e) { /* a Estação é de outra peça */ }
  }

  F.coop_maquina = function (a, c) {
    var M = maquinaOuRecusa(), pj = projetoOuRecusa(a.projeto), d = M.doEstado(pj.id), nomes = {};
    d.pecas.forEach(function (p) { nomes[p.id] = p.nome; });
    var pecas = d.pecas.map(function (p) {
      return { id: p.id, tipo: p.tipo, nome: p.nome, frase: p.frase || '', campos: p.campos || [], chave: p.chave || null, verbo: p.verbo || null, publicada: !!p.publicada, por: L.nome(p.por), assinatura: p.assinatura || null };
    });
    var fios = d.fios.map(function (f) { return { de: nomes[f[0]] || f[0], para: nomes[f[1]] || f[1] }; });
    var pub = pecas.filter(function (p) { return p.publicada; }).length;
    c.consulta('leu a Máquina de ' + pj.nome);
    return {
      texto: 'Máquina de ' + pj.nome + ' · v' + d.versao + ' · ' + pecas.length + ' peça(s)' + (pecas.length ? ' (' + pub + ' publicada(s), ' + (pecas.length - pub) + ' no local)' : '') + ' · ' + fios.length + ' fio(s)' +
        (pecas.length ? ':\n' + pecas.map(function (p) { return '- ' + nomeTipo(M, p.tipo) + ' "' + p.nome + '"' + (p.publicada ? '' : ' (no local, tracejada)') + (p.frase ? ' · ' + p.frase : '') + (p.campos.length ? ' · campos: ' + p.campos.join(', ') : '') + (p.chave ? ' · chave: ' + p.chave : ''); }).join('\n') +
          (fios.length ? '\nFios: ' + fios.map(function (f) { return f.de + ' → ' + f.para; }).join('; ') : '') : '. Vazia: leia o código do projeto e monte com coop_maquina_peca.'),
      dados: { projeto: { id: pj.id, nome: pj.nome }, versao: d.versao, pecas: pecas, fios: fios }
    };
  };

  F.coop_maquina_peca = function (a, c) {
    var M = maquinaOuRecusa(), pj = projetoOuRecusa(a.projeto), tipo = String(a.tipo || '');
    if ((M.TIPOS_REAIS || []).indexOf(tipo) === -1) throw recusa('tipo de peça desconhecido: ' + curto(tipo, 20) + '. Use: ' + (M.TIPOS_REAIS || []).join(', ') + '.');
    var nome = curto(a.nome, 60);
    if (!nome) throw recusa('dê um nome à peça.');
    var existe = M.pecaDoEstado(pj.id, nome);
    if (existe && existe.tipo === tipo) throw recusa(nomeTipo(M, tipo) + ' "' + existe.nome + '" já está na Máquina de ' + pj.nome + '.');
    var de = a.de ? pecaOuRecusa(M, pj, a.de) : null, para = a.para ? pecaOuRecusa(M, pj, a.para) : null;
    if ((de && de.tipo === 'tela' && tipo === 'gaveta') || (tipo === 'tela' && para && para.tipo === 'gaveta')) throw recusa('uma Tela não grava direto numa Gaveta: monte uma Porta entre as duas.');
    var id = 'mq' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    var peca = { id: id, tipo: tipo, nome: nome, agente: c.agente, assinatura: c.assinatura };
    if (a.frase) peca.frase = curto(a.frase, 200);
    if (Array.isArray(a.campos) && a.campos.length) peca.campos = a.campos.slice(0, 30).map(function (x) { return curto(x, 80); }).filter(Boolean);
    if (a.chave) peca.chave = a.chave;
    if (a.verbo) peca.verbo = a.verbo;
    if (a.login === false) peca.login = false;
    if (a.quando) peca.quando = curto(a.quando, 60);
    var fios = [];
    if (de) fios.push([de.id, id]);
    if (para) fios.push([id, para.id]);
    var tn = nomeTipo(M, tipo);
    c.fazer('maquinaPeca', [{ projeto: pj.id, peca: peca, fios: fios, texto: c.assinatura + ' montou ' + tn + ' "' + nome + '"' }], 'montou ' + tn + ' "' + nome + '" na Máquina de ' + pj.nome, 'a Máquina recusou a peça "' + nome + '" (confira o tipo e o nome).');
    mostrarMaquina(M, pj);
    var salva = M.pecaDoEstado(pj.id, id) || peca;
    return {
      texto: tn + ' "' + nome + '" montada na Máquina de ' + pj.nome + ': entra tracejada (no local) e ganha corpo quando a pessoa publicar' +
        (fios.length ? ' · ligada: ' + fios.map(function (f) { return (f[0] === id ? nome : de.nome) + ' → ' + (f[1] === id ? nome : para.nome); }).join('; ') : '') + ' · assinada ' + c.assinatura + '.',
      dados: { projeto: { id: pj.id, nome: pj.nome }, peca: { id: id, tipo: tipo, nome: nome, chave: salva.chave || null, publicada: false }, fios: fios }
    };
  };

  F.coop_maquina_ligar = function (a, c) {
    var M = maquinaOuRecusa(), pj = projetoOuRecusa(a.projeto), de = pecaOuRecusa(M, pj, a.de), para = pecaOuRecusa(M, pj, a.para);
    var motivo = M.motivoSemFio(pj.id, de.id, para.id);
    if (motivo) throw recusa(motivo + ' (' + de.nome + ' → ' + para.nome + ').');
    var txt = nomeTipo(M, de.tipo) + ' "' + de.nome + '" a ' + nomeTipo(M, para.tipo) + ' "' + para.nome + '"';
    c.fazer('maquinaLigar', [{ projeto: pj.id, de: de.id, para: para.id, texto: c.assinatura + ' ligou ' + txt }], 'ligou ' + txt + ' na Máquina de ' + pj.nome);
    mostrarMaquina(M, pj);
    return { texto: 'Fio novo na Máquina de ' + pj.nome + ': ' + de.nome + ' → ' + para.nome + ' · assinado ' + c.assinatura + '.', dados: { projeto: { id: pj.id, nome: pj.nome }, de: de.id, para: para.id } };
  };

  F.coop_acao = function (a, c) {
    if (!permitida[a.acao] || typeof L.A[a.acao] !== 'function') throw recusa('a ação "' + curto(a.acao, 40) + '" não está na lista permitida ao agente.');
    var args = Array.isArray(a.args) ? a.args.slice(0, 6) : [];
    c.fazer(a.acao, args, 'ação ' + a.acao);
    return { texto: 'Feito: ' + a.acao + ' · assinado ' + c.assinatura + '.' };
  };

  /* ---------- aviso visível e ouvintes ---------- */
  var ouvintesFeito = [], historico = [];
  function anunciar(detalhe) {
    historico.push(detalhe);
    if (historico.length > 50) historico.shift();
    if (detalhe.tipo === 'acao' && BC.estacao && typeof BC.estacao.aviso === 'function') { try { BC.estacao.aviso(detalhe.assinatura + ': ' + detalhe.resumo); } catch (e) { /* sem aviso */ } }
    try { window.dispatchEvent(new CustomEvent('coop-feito', { detail: detalhe })); } catch (e) { /* navegador antigo */ }
    ouvintesFeito.forEach(function (fn) { try { fn(detalhe); } catch (e) { console.warn('[coop-ui] ouvinte falhou:', e); } });
  }

  /* ---------- a chamada ---------- */
  var feitos = {}, ordemFeitos = [];
  function devoResponder() {
    if (L.papel !== 'estacao') return false;                              /* TV e iPad só mostram */
    if (!L.lider && L.conectado && L.conectado('estacao')) return false;  /* outra janela da Estação é a líder */
    return true;
  }
  function responder(m) { try { BC.real.enviar(m); } catch (e) { console.warn('[coop-ui] não deu para responder:', e); } }

  function executar(m) {
    if (!m || typeof m.cid !== 'string' || !devoResponder()) return;
    if (feitos[m.cid]) return; /* a mesma chamada chegou duas vezes */
    feitos[m.cid] = true; ordemFeitos.push(m.cid);
    if (ordemFeitos.length > 300) delete feitos[ordemFeitos.shift()];
    var falha = function (erro) { responder({ tipo: 'mcp-resposta', cid: m.cid, ok: false, erro: String(erro) }); };
    var eu = BC.real.eu && BC.real.eu();
    if (!eu || !eu.pronto || !L.pessoa(L.eu)) return falha('esta Estação ainda não entrou numa equipe: cole o token ou funde a equipe.');
    var fn = F[m.ferramenta];
    if (!fn) return falha('ferramenta desconhecida na tela: ' + curto(m.ferramenta, 60));
    var ag = m.agente && typeof m.agente === 'object' ? m.agente : {};
    var agente = { id: curto(ag.id || m.sessao || 'agente', 64), nome: curto(ag.nome || 'agente', 24) };
    var assinatura = agente.nome + ' · ' + L.nome(L.eu);
    var base = { ferramenta: m.ferramenta, agente: agente, assinatura: assinatura, sessao: m.sessao || null };
    var c = {
      agente: agente, assinatura: assinatura,
      /* faz a ação do app assinada; recusa com a mensagem certa se o app disse não */
      fazer: function (acao, args, resumo, seNao) {
        var r = L.fazer('porAgente', agente, acao, args || [], resumo || acao);
        if (r === 'cedo') throw recusa('cedo demais: essa pessoa já foi lembrada há menos de uma hora.');
        if (r !== true) throw recusa(seNao || 'não deu: ' + (resumo || acao) + ' (o app recusou; confira o estado).');
        anunciar(Object.assign({ tipo: 'acao', resumo: resumo || acao, acao: acao, ts: Date.now() }, base));
      },
      consulta: function (resumo) { anunciar(Object.assign({ tipo: 'consulta', resumo: resumo, ts: Date.now() }, base)); },
      /* ação feita por outra peça (ex.: BC.campanha.gerar), já assinada por ela: só o aviso e o 'coop-feito' */
      anunciar: function (resumo) { anunciar(Object.assign({ tipo: 'acao', resumo: resumo, ts: Date.now() }, base)); }
    };
    var args = m.args && typeof m.args === 'object' && !Array.isArray(m.args) ? m.args : {};
    var r;
    try { r = fn(args, c); } catch (e) {
      if (!e.recusa) console.warn('[coop-ui] ' + m.ferramenta + ' falhou:', e);
      return falha(e.recusa ? e.message : m.ferramenta + ' falhou na tela: ' + e.message);
    }
    responder({ tipo: 'mcp-resposta', cid: m.cid, ok: true, resultado: r });
  }

  BC.real.ouvir(function (m) { if (m && m.tipo === 'mcp-chamada') executar(m); });

  BC.coop = {
    versao: '1.0.0',
    permitidas: PERMITIDAS.slice(),
    ferramentas: Object.keys(F),
    aoFeito: function (fn) { ouvintesFeito.push(fn); return function () { var i = ouvintesFeito.indexOf(fn); if (i >= 0) ouvintesFeito.splice(i, 1); }; },
    historico: function () { return historico.slice(); },
    /* testes e ferramentas internas: executa como se a chamada viesse do servidor */
    executar: executar,
    lerPrazo: lerPrazo,
    acharPessoa: acharPessoa
  };
})();
