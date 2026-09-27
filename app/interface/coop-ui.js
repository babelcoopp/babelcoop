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
   (detail {tipo:'acao'|'consulta'|'tela', ferramenta, agente, assinatura, resumo, sessao, ts}); BC.coop.aoFeito(fn) para as peças
   que queiram mostrar (presença, parede, placar). Som só quando a meta da campanha bate 100 % ('tres', TERMINAL_2030 §6).
   O banco de verdade (coop_banco_sql, coop_banco_consulta, coop_banco_estado): a tela chama /api/banco/* do servidor desta
   Estação (Postgres local do projeto), monta cada mudança como peça banco:true na Máquina pelo mesmo caminho assinado
   (maquinaPeca, maquinaLigar e maquinaMudar), abre a Máquina em 3D (BC.maquina.abrir3d), toca os efeitos
   (BC.maquinaEfeitos.tocar, prototipo/maquina-efeitos.js) e só então responde. A ferramenta devolve uma Promise.
   O terminal comanda a Estação (coop_abrir, coop_fechar, coop_onde, coop_tela): abre atividade da barra, arquivo, projeto,
   Máquina (2D/3D) ou perfil com as funções da própria Estação e a luz de chegada do endereço; fecha abas; diz onde cada um
   está (BC.endereco) e o que está na tela. Só esta tela muda (tipo 'tela' no 'coop-feito'): nada vai para o diário.
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
  /* ações que só as ferramentas desta tela fazem, assinadas, e que o agente não pede por coop_acao: maquinaMudar leva as
     colunas, a chave e a saída das peças do banco local (só o banco manda nelas, nunca um pedido solto) */
  var DA_TELA = { maquinaMudar: true };

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
    if ((!permitida[acao] && !DA_TELA[acao]) || typeof L.A[acao] !== 'function') return;
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
      var bancoDe = p.banco && typeof M.bancoDaqui === 'function' && !M.bancoDaqui(p) ? L.nome(M.donoBanco(p)) : null;
      return { id: p.id, tipo: p.tipo, nome: p.nome, frase: p.frase || '', campos: p.campos || [], chave: p.chave || null, verbo: p.verbo || null, publicada: !!p.publicada, banco: !!p.banco, bancoDe: bancoDe, por: L.nome(p.por), assinatura: p.assinatura || null };
    });
    var fios = d.fios.map(function (f) { return { de: nomes[f[0]] || f[0], para: nomes[f[1]] || f[1] }; });
    var pub = pecas.filter(function (p) { return p.publicada; }).length;
    c.consulta('leu a Máquina de ' + pj.nome);
    return {
      texto: 'Máquina de ' + pj.nome + ' · v' + d.versao + ' · ' + pecas.length + ' peça(s)' + (pecas.length ? ' (' + pub + ' publicada(s), ' + (pecas.length - pub) + ' no local)' : '') + ' · ' + fios.length + ' fio(s)' +
        (pecas.length ? ':\n' + pecas.map(function (p) { return '- ' + nomeTipo(M, p.tipo) + ' "' + p.nome + '"' + (p.banco ? ' (no banco local' + (p.bancoDe ? ' de ' + p.bancoDe : '') + ', com corpo)' : p.publicada ? '' : ' (no local, tracejada)') + (p.frase ? ' · ' + p.frase : '') + (p.campos.length ? ' · campos: ' + p.campos.join(', ') : '') + (p.chave ? ' · chave: ' + p.chave : ''); }).join('\n') +
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
    var tn = nomeTipo(M, tipo), g = /^(gaveta|porta|tela|portaria|empresa)$/.test(tipo) ? 'a' : 'o'; /* Gaveta montada, Robô montado */
    c.fazer('maquinaPeca', [{ projeto: pj.id, peca: peca, fios: fios, texto: c.assinatura + ' montou ' + tn + ' "' + nome + '"' }], 'montou ' + tn + ' "' + nome + '" na Máquina de ' + pj.nome, 'a Máquina recusou a peça "' + nome + '" (confira o tipo e o nome).');
    mostrarMaquina(M, pj);
    var salva = M.pecaDoEstado(pj.id, id) || peca;
    return {
      texto: tn + ' "' + nome + '" montad' + g + ' na Máquina de ' + pj.nome + ': entra tracejad' + g + ' (no local) e ganha corpo quando a pessoa publicar' +
        (fios.length ? ' · ligad' + g + ': ' + fios.map(function (f) { return (f[0] === id ? nome : de.nome) + ' → ' + (f[1] === id ? nome : para.nome); }).join('; ') : '') + ' · assinad' + g + ' ' + c.assinatura + '.',
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

  /* ---------- o banco de verdade do projeto (Postgres local desta Estação, rotas /api/banco/* do servidor) ----------
     A migração roda no servidor; aqui cada mudança vira peça banco:true na Máquina (gaveta 'bd-t-<tabela>',
     robô 'bd-g-<tabela>-<gatilho>', porta 'bd-f-<funcao>'), a Máquina abre em 3D e os efeitos tocam antes da resposta. */
  var BANCO_PRAZO = 95000, EFEITOS_TETO = 15000; /* somados, abaixo dos 120 s que o servidor espera por estas ferramentas */
  function slugBd(s, max) { return normalizar(s).replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, max) || 'x'; }
  function idT(t) { return 'bd-t-' + slugBd(t, 58); }
  function idG(t, g) { return 'bd-g-' + slugBd(t, 28) + '-' + slugBd(g, 29); }
  function idF(f) { return 'bd-f-' + slugBd(f, 58); }
  /* "public.avisar()" ou "avisar" → "avisar" */
  function nomeFuncao(s) { return String(s == null ? '' : s).trim().replace(/\(.*$/, '').replace(/^.*\./, '').replace(/"/g, '').trim(); }
  function listaArgs(a) { return Array.isArray(a) ? a.join(', ') : String(a == null ? '' : a).trim(); }
  function pecaBd(M, pj, id) { var p = M.pecaDoEstado(pj.id, id); return p && p.id === id ? p : null; }
  function temFio(M, pj, a, b) { return M.doEstado(pj.id).fios.some(function (f) { return f[0] === a && f[1] === b; }); }
  function msgErro(r) { var e = r && r.erro; if (typeof e === 'string') return e; e = e || {}; return (e.mensagem || 'o banco recusou sem dizer o motivo') + (e.detalhe ? ' (' + e.detalhe + ')' : ''); }

  function pedirBanco(metodo, rota, corpo) {
    if (!window.fetch) return Promise.reject(recusa('esta tela não consegue falar com o servidor da Estação.'));
    var ctl = window.AbortController ? new AbortController() : null, t = null, onde = rota.split('?')[0];
    var op = { method: metodo, cache: 'no-store' };
    if (corpo) { op.headers = { 'Content-Type': 'application/json' }; op.body = JSON.stringify(corpo); }
    if (ctl) { op.signal = ctl.signal; t = setTimeout(function () { ctl.abort(); }, BANCO_PRAZO); }
    return fetch(rota, op).then(function (r) {
      return r.text().then(function (s) {
        var j = null;
        try { j = JSON.parse(s); } catch (e) { j = null; }
        if (r.status === 404 && (!j || j.ok !== false)) throw recusa('o servidor desta Estação ainda não tem o banco do projeto (' + onde + ' respondeu 404).');
        if (!j || typeof j !== 'object') throw recusa('o servidor da Estação respondeu ' + r.status + ' sem JSON em ' + onde + '.');
        if (!r.ok && j.ok !== false) throw recusa('o servidor da Estação recusou (' + r.status + '): ' + curto(msgErro(j), 300) + '.');
        return j;
      });
    }, function (e) {
      throw recusa(e && e.name === 'AbortError' ? 'o banco local não respondeu em ' + Math.round(BANCO_PRAZO / 1000) + ' s.' : 'não deu para falar com o servidor da Estação: ' + ((e && e.message) || e) + '.');
    }).then(function (j) { clearTimeout(t); return j; }, function (e) { clearTimeout(t); throw e; });
  }

  /* o tipo da coluna em palavra de gente (o glifo do campo na Máquina lê essa palavra); o tipo do banco vai junto */
  var TIPOS_PG = [
    [/^(text|character varying|varchar|character|char|bpchar|citext|name)\b/, 'texto'],
    [/^(smallint|integer|bigint|int2|int4|int8|int|serial|bigserial|smallserial|numeric|decimal|real|double precision|float4|float8)\b/, 'número'],
    [/^money\b/, 'dinheiro'], [/^bool(ean)?\b/, 'sim/não'], [/^timestamp/, 'data e hora'], [/^date\b/, 'data'], [/^time\b/, 'hora'],
    [/^uuid\b/, 'identificador'], [/^jsonb?\b/, 'json']
  ];
  function tipoGente(pg) {
    var t = String(pg || '').toLowerCase().trim(), lista = /\[\]$/.test(t), base = t.replace(/\[\]$/, '');
    for (var i = 0; i < TIPOS_PG.length; i++) if (TIPOS_PG[i][0].test(base)) return (lista ? 'lista de ' : '') + TIPOS_PG[i][1];
    return lista || t === 'array' ? 'lista' : '';
  }
  /* uma coluna como campo da gaveta: "nome (tipo de gente · tipo do banco)"; num vínculo, "ligação com <mãe>" */
  function campoBd(col, liga) {
    if (typeof col === 'string') return curto(col, 80);
    col = col || {};
    var nome = curto(col.nome, 36), pg = curto(col.tipo, 30), gente = liga ? 'ligação com ' + curto(liga, 24) : tipoGente(pg);
    var tipo = (gente ? gente + (pg && pg !== gente ? ' · ' + pg : '') : pg || 'sem tipo') + (col.pk ? ' · chave' : '');
    return nome ? nome + ' (' + curto(tipo, 77 - nome.length) + ')' : '';
  }
  function snapDe(r) {
    var s = r && r.snapshot && typeof r.snapshot === 'object' ? r.snapshot : {}, o = {};
    ['tabelas', 'fios', 'politicas', 'gatilhos', 'funcoes'].forEach(function (k) { o[k] = Array.isArray(s[k]) ? s[k].filter(Boolean) : []; });
    return o;
  }
  function tabelaDo(snap, nome) { return snap.tabelas.filter(function (t) { return t.nome === nome; })[0] || null; }
  function camposDe(snap, nome, reserva) {
    var t = tabelaDo(snap, nome), cols = t && Array.isArray(t.colunas) ? t.colunas : Array.isArray(reserva) ? reserva : [], liga = {};
    snap.fios.forEach(function (f) { if (f.de === nome && typeof f.coluna === 'string') liga[f.coluna] = f.para; });
    return cols.slice(0, 30).map(function (c) { return campoBd(c, c && liga[c.nome]); }).filter(Boolean);
  }
  var CMD_BD = { ALL: 'tudo', '*': 'tudo', SELECT: 'ler', INSERT: 'inserir', UPDATE: 'atualizar', DELETE: 'apagar' };
  function cmdBd(c) { var k = String(c || '').toUpperCase().trim(); return CMD_BD[k] || String(c || '').toLowerCase(); }
  /* a chave da gaveta pela regra de verdade (a expressão das políticas; o nome delas não conta):
     sem RLS = aberta para todos · RLS sem política permissiva = só o dono da tabela passa ·
     política permissiva com regra "true" para todos: só ler = todos leem, só o dono muda; mudar também = aberta para todos ·
     regra que confere empresa/tenant/clínica… = cada empresa vê só o seu · outra regra = só o dono (a frase traz a regra inteira) */
  var TENANT = /empresa|tenant|cl[ií]nica|organiza|\borg(_id)?\b|company|conta_id|account|workspace|loja|escola|equipe_id|team/i;
  var ABERTURA = { 'só o dono': 0, 'cada empresa vê só o seu': 1, 'todos leem, só o dono muda': 2, '⚠ aberta para todos': 3 };
  function paraTodos(p) { var r = Array.isArray(p.papeis) ? p.papeis : []; return !r.length || r.some(function (x) { return /^(public|anon|authenticated)$/i.test(String(x)); }); }
  function livre(p, cmd) { var e = cmd === 'INSERT' && p.checa != null ? p.checa : p.usando; return /^\(*\s*true\s*\)*$/i.test(String(e == null ? '' : e).trim()); }
  function regraTxt(p) {
    var u = String(p.usando == null ? '' : p.usando).replace(/\s+/g, ' ').trim(), k = String(p.checa == null ? '' : p.checa).replace(/\s+/g, ' ').trim();
    return (u + (k && k !== u ? (u ? ' · grava se ' : 'grava se ') + k : '')) + (p.permissiva === false ? ' (restritiva)' : '');
  }
  function chaveDe(M, snap, nome) {
    var t = tabelaDo(snap, nome), pols = snap.politicas.filter(function (p) { return p.tabela === nome; });
    if (!t || !t.rls) return { chave: '⚠ aberta para todos', pols: pols, rls: false };
    var perm = pols.filter(function (p) { return p.permissiva !== false; });
    function aberta(cmd) { return perm.some(function (p) { var k = String(p.cmd || 'ALL').toUpperCase(); return (k === 'ALL' || k === cmd) && paraTodos(p) && livre(p, cmd); }); }
    var le = aberta('SELECT'), muda = aberta('INSERT') || aberta('UPDATE') || aberta('DELETE');
    if (muda) return { chave: '⚠ aberta para todos', pols: pols, rls: true };
    if (le) return { chave: 'todos leem, só o dono muda', pols: pols, rls: true };
    if (perm.some(function (p) { return TENANT.test(regraTxt(p)); })) return { chave: 'cada empresa vê só o seu', pols: pols, rls: true };
    return { chave: 'só o dono', pols: pols, rls: true };
  }
  function fraseGaveta(nome, ch) {
    var base = 'tabela ' + nome + ' do banco local';
    if (!ch.rls) return curto(base + ' · sem RLS: quem acessa o banco vê e muda tudo' + (ch.pols.length ? ' (as ' + ch.pols.length + ' políticas só valem com o RLS ligado)' : ''), 200);
    if (!ch.pols.length) return curto(base + ' · RLS ligado, sem política: só o dono da tabela passa', 200);
    return curto(base + ' · regra de acesso: ' + ch.pols.map(function (p) { var r = regraTxt(p); return '"' + p.nome + '" (' + cmdBd(p.cmd) + ')' + (r ? ': ' + r : ''); }).join(', '), 200);
  }
  var QUANDO_BD = { BEFORE: 'antes', AFTER: 'depois', 'INSTEAD OF': 'no lugar' }, EVENTO_BD = { INSERT: 'inserir', UPDATE: 'atualizar', DELETE: 'apagar', TRUNCATE: 'esvaziar' };
  function eventosDe(ev) { return String(Array.isArray(ev) ? ev.join(' OR ') : ev || '').split(/\s+OR\s+|\s*,\s*/i).map(function (e) { return e.trim().toUpperCase(); }).filter(Boolean); }
  function quandoBd(g) {
    var q = String(g.quando || '').toUpperCase().trim(), evs = g.eventos.map(function (e) { return EVENTO_BD[e] || e.toLowerCase(); });
    return curto((g.ligado === false ? 'desligado · ' : '') + (QUANDO_BD[q] || q.toLowerCase() || 'quando') + ' de ' + (evs.join(' ou ') || 'mudar'), 60);
  }
  /* o snapshot pode trazer uma linha por evento do mesmo gatilho: junta por tabela + nome */
  function gatilhosDe(lista) {
    var por = {}, ordem = [];
    lista.forEach(function (g) {
      if (!g.tabela || !g.nome) return;
      var k = idG(g.tabela, g.nome);
      if (!por[k]) { por[k] = { id: k, tabela: g.tabela, nome: g.nome, quando: g.quando, eventos: [], funcao: g.funcao, ligado: g.ligado }; ordem.push(k); }
      eventosDe(g.evento).forEach(function (e) { if (por[k].eventos.indexOf(e) === -1) por[k].eventos.push(e); });
    });
    return { por: por, ordem: ordem };
  }

  /* as mudanças do banco viram peças pelo caminho assinado (maquinaPeca, maquinaLigar, maquinaMudar). Cada peça que
     não entrar vira uma falha dita na resposta (o banco já mudou: a Máquina diz o que não conseguiu mostrar).
     O banco é deste computador e a Máquina é da equipe: só as peças do banco DAQUI mudam ou saem (peça do banco de outra
     Estação fica como está e a resposta diz). No fim, a Máquina acerta pelo snapshot: o que falta nasce, o que não está
     mais no banco daqui sai, e campos e chave das gavetas daqui seguem o banco. */
  function daqui(M, p) { return !!(p && p.banco) && (typeof M.bancoDaqui !== 'function' || M.bancoDaqui(p)); }
  function aplicarNaMaquina(M, pj, r, c) {
    var snap = snapDe(r), temSnap = !!(r.snapshot && Array.isArray(r.snapshot.tabelas)), mud = Array.isArray(r.mudancas) ? r.mudancas : [];
    var tabs = {}, gat = gatilhosDe(snap.gatilhos), deGatilho = {};
    snap.tabelas.forEach(function (t) { if (t.nome) tabs[t.nome] = t; });
    gat.ordem.forEach(function (k) { deGatilho[normalizar(nomeFuncao(gat.por[k].funcao))] = true; });
    mud.forEach(function (x) { if (x && x.k === 'gatilho') deGatilho[normalizar(nomeFuncao(x.funcao))] = true; });
    var R = { efeitos: [], nasceram: [], ligou: [], mudaram: [], sairam: [], falhas: [], deOutra: [] }, nasceu = {}, jaEfeito = {}, tocarCampos = {}, tocarChave = {}, outra = {}, acertando = false;
    /* peça do banco de outra Estação com o mesmo id: não é deste banco; a resposta diz uma vez (só se esta migração mexeu nela) */
    function deOutra(p) {
      if (!p || daqui(M, p)) return false;
      if (!outra[p.id] && !acertando) { outra[p.id] = true; R.deOutra.push(nomeTipo(M, p.tipo) + ' "' + p.nome + '"' + (p.banco && typeof M.donoBanco === 'function' ? ' (no banco local de ' + L.nome(M.donoBanco(p)) + ')' : ' (desenho)')); }
      return true;
    }

    function efeito(e) { var k = e.tipo + ':' + (e.peca || e.de + '>' + e.para); if (jaEfeito[k]) return; jaEfeito[k] = true; R.efeitos.push(e); }
    function tentar(oque, fn) { try { fn(); return true; } catch (e) { R.falhas.push(oque + ' (' + ((e && e.message) || e) + ')'); return false; } }
    function mudar(id, dados, oque) {
      return tentar(oque, function () { c.fazer('maquinaMudar', [Object.assign({ projeto: pj.id, peca: id, texto: c.assinatura + ' ' + oque }, dados)], oque, 'a Máquina não conseguiu: ' + oque); });
    }
    function nascer(peca, fios, rotulo) {
      var tn = nomeTipo(M, peca.tipo);
      Object.assign(peca, { banco: true, dom: 'banco', agente: c.agente, assinatura: c.assinatura });
      if (!tentar(tn + ' "' + peca.nome + '"', function () {
        c.fazer('maquinaPeca', [{ projeto: pj.id, peca: peca, fios: fios || [], texto: c.assinatura + ' criou no banco local ' + tn + ' "' + peca.nome + '"' }], tn + ' "' + peca.nome + '" no banco local de ' + pj.nome, 'a Máquina recusou ' + tn + ' "' + peca.nome + '"');
      })) return false;
      nasceu[peca.id] = true; R.nasceram.push(rotulo);
      efeito({ tipo: 'nascer', peca: peca.id });
      (fios || []).forEach(function (f) { if (temFio(M, pj, f[0], f[1])) efeito({ tipo: 'fio', de: f[0], para: f[1] }); });
      return true;
    }
    function tirar(id) {
      var p = pecaBd(M, pj, id), tn = p && nomeTipo(M, p.tipo);
      if (!p || !daqui(M, p)) return; /* a de outra Estação não saiu do banco dela */
      if (mudar(id, { sai: true }, 'tirou ' + tn + ' "' + p.nome + '" (saiu do banco local)')) R.sairam.push(tn + ' "' + p.nome + '"');
    }
    /* a gaveta nasce já com as colunas, a chave e a frase do fim da migração (o snapshot) */
    function gaveta(nome, reserva) {
      var id = idT(nome), ja = nome && pecaBd(M, pj, id);
      if (ja) { deOutra(ja); return; }
      if (!nome || (temSnap && !tabs[nome])) return; /* saiu do banco nesta mesma migração */
      var campos = camposDe(snap, nome, reserva), ch = chaveDe(M, snap, nome);
      nascer({ id: id, tipo: 'gaveta', nome: curto(nome, 60), campos: campos, chave: ch.chave, frase: fraseGaveta(nome, ch) }, [],
        'Gaveta "' + nome + '" (' + campos.length + ' coluna' + (campos.length === 1 ? '' : 's') + ', chave: ' + ch.chave + ')');
    }
    /* vínculo: fio da gaveta filha (quem tem a coluna) para a mãe */
    function ligar(de, para) {
      if (!de || !para) return;
      gaveta(de); gaveta(para);
      var a = idT(de), b = idT(para);
      if (!pecaBd(M, pj, a) || !pecaBd(M, pj, b) || !daqui(M, pecaBd(M, pj, a))) return; /* o fio sai da filha, e ela tem de ser deste banco */
      tocarCampos[de] = true;
      if (temFio(M, pj, a, b) || M.motivoSemFio(pj.id, a, b)) return; /* já ligadas (dois vínculos entre as mesmas tabelas são um fio) ou a tabela aponta para ela mesma */
      if (tentar('fio ' + de + ' → ' + para, function () { c.fazer('maquinaLigar', [{ projeto: pj.id, de: a, para: b, texto: c.assinatura + ' ligou no banco local ' + de + ' → ' + para }], 'ligou ' + de + ' → ' + para + ' no banco local de ' + pj.nome); })) {
        R.ligou.push(de + ' → ' + para);
        efeito({ tipo: 'fio', de: a, para: b });
      }
    }
    /* função que não é de gatilho = porta; a de gatilho aparece no robô */
    function funcao(nome, args) {
      var n = nomeFuncao(nome), sf;
      if (!n || deGatilho[normalizar(n)]) return;
      sf = snap.funcoes.filter(function (f) { return nomeFuncao(f.nome) === n; })[0];
      if (temSnap && !sf) return;
      var id = idF(n), a = listaArgs(sf ? sf.args : args);
      if (pecaBd(M, pj, id)) { if (!deOutra(pecaBd(M, pj, id))) efeito({ tipo: 'nascer', peca: id }); return; } /* CREATE OR REPLACE: a mesma porta pisca */
      nascer({ id: id, tipo: 'porta', nome: curto(n, 60), frase: curto('função do banco local: ' + n + '(' + a + ')', 200), campos: a ? a.split(/\s*,\s*/).filter(Boolean).slice(0, 30) : ['sem argumentos'] }, [], 'Porta "' + n + '" (função)');
    }
    /* gatilho = robô com o "quando" de verdade e o fio gaveta → robô */
    function gatilho(x) {
      if (!x.tabela || !x.nome) return;
      var id = idG(x.tabela, x.nome), g = gat.por[id];
      if (!g) { if (temSnap) return; g = { id: id, tabela: x.tabela, nome: x.nome, quando: x.quando, eventos: eventosDe(x.evento), funcao: x.funcao }; }
      var q = quandoBd(g), idTab = idT(g.tabela), existe = pecaBd(M, pj, id), fn = nomeFuncao(g.funcao);
      gaveta(g.tabela);
      if (existe) {
        if (deOutra(existe)) return;
        if (existe.quando !== q && mudar(id, { quando: q }, 'fez o robô "' + existe.nome + '" disparar ' + q + ' (banco local)')) R.mudaram.push('Robô "' + existe.nome + '": ' + q);
        efeito({ tipo: 'nascer', peca: id });
        return;
      }
      /* o mesmo nome de gatilho em outra tabela (set_updated_at em todas): o robô leva a tabela no nome */
      var nomeR = g.nome;
      if (M.doEstado(pj.id).pecas.some(function (p) { return p.tipo === 'robo' && p.id !== id && normalizar(p.nome) === normalizar(nomeR); })) nomeR = g.nome + ' · ' + g.tabela;
      nascer({ id: id, tipo: 'robo', nome: curto(nomeR, 60), quando: q, alvo: idTab, frase: curto('gatilho do banco local: ' + q + ' em ' + g.tabela + (fn ? ', roda ' + fn + '()' : ''), 200) },
        pecaBd(M, pj, idTab) ? [[idTab, id]] : [], 'Robô "' + nomeR + '" (gatilho: ' + q + ' em ' + g.tabela + ')');
    }
    /* o cadeado conta o que aconteceu com a chave: fecha quando a gaveta ficou mais protegida (ou ganhou regra), abre quando
       ficou mais aberta (RLS desligado, política "true", política que saiu e liberou) */
    function cadeado(t) {
      var id = idT(t), p = pecaBd(M, pj, id), depois, antes;
      if (!p || !daqui(M, p) || !tabs[t]) return;
      depois = chaveDe(M, snap, t).chave; antes = nasceu[id] ? null : p.chave;
      if (antes == null || ABERTURA[antes] == null) { if (depois !== '⚠ aberta para todos') efeito({ tipo: 'cadeado', peca: id }); return; }
      if (ABERTURA[depois] > ABERTURA[antes]) efeito({ tipo: 'cadeado', peca: id, abre: true });
      else if (ABERTURA[depois] < ABERTURA[antes] || depois !== '⚠ aberta para todos') efeito({ tipo: 'cadeado', peca: id });
    }

    mud.forEach(function (x) {
      if (!x || typeof x !== 'object') return;
      switch (x.k) {
        case 'tabela': gaveta(x.nome, x.colunas); break;
        case 'coluna': if (x.tabela) { gaveta(x.tabela); tocarCampos[x.tabela] = true; if (daqui(M, pecaBd(M, pj, idT(x.tabela)))) efeito({ tipo: 'nascer', peca: idT(x.tabela) }); } break;
        case 'rls': case 'politica': if (x.tabela) { gaveta(x.tabela); tocarChave[x.tabela] = true; cadeado(x.tabela); } break;
        case 'fio': ligar(x.de, x.para); break;
        case 'funcao': funcao(x.nome, x.args); break;
        case 'gatilho': gatilho(x); break;
        case 'sai':
          if (x.o === 'tabela') tirar(idT(x.nome));
          else if (x.o === 'gatilho' && x.tabela) tirar(idG(x.tabela, x.nome));
          else if (x.o === 'funcao') tirar(idF(nomeFuncao(x.nome)));
          else if (x.o === 'coluna' && x.tabela) tocarCampos[x.tabela] = true;
          else if (x.o === 'politica' && x.tabela) { tocarChave[x.tabela] = true; cadeado(x.tabela); }
          break; /* fio e gatilho sem tabela: o acerto do fim compara com o snapshot */
      }
    });
    /* o acerto pelo snapshot: o que está no banco daqui e falta na Máquina nasce (sem efeito para quem já está) */
    if (temSnap) {
      acertando = true;
      snap.tabelas.forEach(function (t) { if (t.nome) { gaveta(t.nome); tocarCampos[t.nome] = true; tocarChave[t.nome] = true; } });
      snap.fios.forEach(function (f) { if (f.de && f.para) ligar(f.de, f.para); });
      snap.funcoes.forEach(function (f) { var n = nomeFuncao(f.nome); if (n && !deGatilho[normalizar(n)] && !pecaBd(M, pj, idF(n))) funcao(f.nome, f.args); });
      gat.ordem.forEach(function (k) { if (!pecaBd(M, pj, k)) gatilho(gat.por[k]); });
      acertando = false;
    }
    /* gavetas que já existiam: colunas e vínculos viram campos; RLS e políticas viram a chave e a frase */
    Object.keys(tocarCampos).forEach(function (t) {
      var id = idT(t), p = pecaBd(M, pj, id), campos;
      if (!p || nasceu[id] || !tabs[t] || !daqui(M, p)) return;
      campos = camposDe(snap, t);
      if ((p.campos || []).join('\n') === campos.join('\n')) return;
      if (mudar(id, { campos: campos }, 'atualizou os campos da gaveta ' + t + ' (banco local)')) R.mudaram.push('Gaveta "' + t + '": ' + campos.length + ' coluna' + (campos.length === 1 ? '' : 's'));
    });
    Object.keys(tocarChave).forEach(function (t) {
      var id = idT(t), p = pecaBd(M, pj, id), ch, fr;
      if (!p || nasceu[id] || !tabs[t] || !daqui(M, p)) return;
      ch = chaveDe(M, snap, t); fr = fraseGaveta(t, ch);
      if (p.chave === ch.chave && p.frase === fr) return;
      if (mudar(id, { chave: ch.chave, frase: fr }, 'mudou a chave da gaveta ' + t + ' para "' + ch.chave + '" (banco local)')) R.mudaram.push('Gaveta "' + t + '": chave "' + ch.chave + '"' + (ch.rls && ch.pols.length ? ' (' + ch.pols.map(function (x) { return 'política "' + x.nome + '"'; }).join(', ') + ')' : ''));
    });
    /* o que não está mais no banco DAQUI sai da Máquina: tabela, gatilho, função e vínculo (as de outra Estação ficam) */
    if (temSnap) {
      var vivos = {}, vinculos = {};
      snap.tabelas.forEach(function (t) { if (t.nome) vivos[idT(t.nome)] = true; });
      gat.ordem.forEach(function (k) { vivos[k] = true; });
      snap.funcoes.forEach(function (f) { var n = nomeFuncao(f.nome); if (n && !deGatilho[normalizar(n)]) vivos[idF(n)] = true; });
      M.doEstado(pj.id).pecas.forEach(function (p) { if (daqui(M, p) && /^bd-[tgf]-/.test(p.id) && !vivos[p.id]) tirar(p.id); });
      snap.fios.forEach(function (f) { if (f.de && f.para) { vinculos[idT(f.de) + '>' + idT(f.para)] = true; vinculos[idT(f.para) + '>' + idT(f.de)] = true; } });
      M.doEstado(pj.id).fios.forEach(function (f) {
        if (!/^bd-t-/.test(f[0]) || !/^bd-t-/.test(f[1]) || vinculos[f[0] + '>' + f[1]]) return;
        var a = pecaBd(M, pj, f[0]), b = pecaBd(M, pj, f[1]);
        if (a && b && daqui(M, a) && daqui(M, b) && mudar(f[0], { semFio: f[1] }, 'desligou ' + a.nome + ' de ' + b.nome + ' (o vínculo saiu do banco local)')) R.sairam.push('fio ' + a.nome + ' → ' + b.nome);
      });
    }
    /* o nº real de linhas de cada gaveta (só nesta janela) */
    contarDaqui(M, pj, snap.tabelas.map(function (t) { return [t.nome, t.linhas]; }));
    /* só efeito de peça (e fio) que ficou na Máquina: o 3D não espera por quem não vem */
    R.efeitos = R.efeitos.filter(function (e) { return e.tipo === 'fio' ? temFio(M, pj, e.de, e.para) : !!pecaBd(M, pj, e.peca); });
    return R;
  }

  /* o nº real de linhas vai para a gaveta só se ela é deste banco (a de outra Estação com o mesmo nome conta lá) */
  function contarDaqui(M, pj, pares) {
    if (!M || typeof M.contagem !== 'function') return;
    pares.forEach(function (x) { var p = x[0] && pecaBd(M, pj, idT(x[0])), n = +x[1]; if (p && daqui(M, p) && isFinite(n)) M.contagem(pj.id, p.id, n); });
  }
  /* a Máquina do projeto no 3D (sem a API nova, a Máquina como antes) */
  function abrir3d(M, pj) {
    try { if (typeof M.abrir3d === 'function') M.abrir3d(pj.id); else mostrarMaquina(M, pj); } catch (e) { console.warn('[coop-ui] a Máquina não abriu em 3D:', e); }
  }
  /* toca a fila de efeitos (prototipo/maquina-efeitos.js) e espera, com teto; diz quantos tocaram pelo que a própria fila
     devolve (o registro desta chamada; duas filas seguidas não se misturam) */
  function tocarEfeitos(pjId, lista) {
    var E = BC.maquinaEfeitos, fila;
    if (!lista.length) return Promise.resolve({ total: 0 });
    if (!E || typeof E.tocar !== 'function') return Promise.resolve({ total: lista.length, sem: true });
    try { fila = Promise.resolve(E.tocar(pjId, lista)); } catch (e) { return Promise.resolve({ total: lista.length, sem: true }); }
    return new Promise(function (ok) {
      var acabou = false, teto = setTimeout(function () { fim(true); }, EFEITOS_TETO);
      function fim(noTeto, feitos) {
        if (acabou) return;
        acabou = true; clearTimeout(teto);
        var r = { total: lista.length, teto: !!noTeto, tocaram: null, pulos: [] };
        if (!noTeto && Array.isArray(feitos)) {
          r.tocaram = feitos.filter(function (x) { return x && x.tocou; }).length;
          feitos.forEach(function (x) { var mv = x && !x.tocou && x.motivo ? curto(x.motivo, 80) : ''; if (mv && r.pulos.indexOf(mv) === -1 && r.pulos.length < 3) r.pulos.push(mv); });
        }
        ok(r);
      }
      fila.then(function (feitos) { fim(false, feitos); }, function () { fim(false); });
    });
  }
  function textoEfeitos(ef) {
    if (!ef || !ef.total) return '';
    if (ef.sem) return 'A Máquina abriu em 3D (a animação não está carregada nesta tela).';
    if (ef.teto) return 'A Máquina abriu em 3D e ainda estava animando quando respondi.';
    if (ef.tocaram == null) return 'A Máquina abriu em 3D e tocou a animação.';
    return 'A Máquina abriu em 3D: ' + ef.tocaram + ' de ' + ef.total + ' efeito' + (ef.total === 1 ? '' : 's') + (ef.tocaram === 1 ? ' tocou' : ' tocaram') + (ef.pulos && ef.pulos.length ? ' (pulados: ' + ef.pulos.join('; ') + ')' : '') + '.';
  }
  /* a tabela que o erro do Postgres cita (entre aspas na mensagem, ou a do comando), se ela já é gaveta do banco na Máquina */
  function pecaCitada(M, pj, r, sql) {
    var e = r.erro || {}, txt = typeof e === 'string' ? e : String(e.mensagem || '') + ' ' + String(e.detalhe || ''), nomes = [], m, i, p;
    var aspas = /"([^"]{1,63})"/g, comando = /\b(?:table|into|update|from|on|references)\s+(?:if\s+(?:not\s+)?exists\s+)?(?:only\s+)?(?:public\.)?"?([A-Za-z_][\w$]{0,62})"?/gi;
    while ((m = aspas.exec(txt))) nomes.push(m[1].replace(/^public\./, ''));
    while ((m = comando.exec(String(sql || '')))) nomes.push(m[1]);
    for (i = 0; i < nomes.length; i++) { p = pecaBd(M, pj, idT(nomes[i])); if (p) return p.id; }
    return null;
  }
  function respostaSql(pj, r, R, ef) {
    var mud = Array.isArray(r.mudancas) ? r.mudancas : [], partes = [], fx = textoEfeitos(ef);
    partes.push('Migração aplicada no banco local de ' + pj.nome + (r.arquivo ? ' e gravada em ' + r.arquivo : '') + '.');
    if (!mud.length) partes.push('Nada que a Máquina desenha mudou (tabelas, colunas, regras, vínculos, funções e gatilhos continuam como estavam): o que a migração fez está no banco e no arquivo.');
    else if (!R.nasceram.length && !R.ligou.length && !R.mudaram.length && !R.sairam.length && !R.deOutra.length) {
      var dentro = mud.map(porDentro).filter(Boolean).slice(0, 8);
      if (dentro.length) partes.push('Mudou por dentro do que a Máquina já mostra: ' + dentro.join('; ') + '.');
    }
    if (R.nasceram.length) partes.push('Nasceram na Máquina, com corpo: ' + R.nasceram.join('; ') + '.');
    if (R.ligou.length) partes.push('Fios: ' + R.ligou.join('; ') + '.');
    if (R.mudaram.length) partes.push('Mudaram: ' + R.mudaram.join('; ') + '.');
    if (R.sairam.length) partes.push('Saíram: ' + R.sairam.join('; ') + '.');
    if (R.falhas.length) partes.push('No banco está feito, mas a Máquina não mostrou: ' + R.falhas.join('; ') + '.');
    if (R.deOutra.length) partes.push('Já estavam na Máquina por outra Estação (o banco delas é outro; esta migração não mexe nelas): ' + R.deOutra.join('; ') + '.');
    if (fx) partes.push(fx);
    partes.push('É o banco local deste computador (Postgres, só nesta Estação); a nuvem vem depois.');
    return { texto: partes.join(' '), dados: { projeto: { id: pj.id, nome: pj.nome }, arquivo: r.arquivo || null, mudancas: mud, nasceram: R.nasceram, ligou: R.ligou, mudaram: R.mudaram, sairam: R.sairam, falhas: R.falhas, deOutra: R.deOutra, efeitos: ef } };
  }
  function porDentro(x) {
    switch (x && x.k) {
      case 'coluna': return 'coluna ' + x.tabela + '.' + x.nome + ' (' + x.tipo + ')';
      case 'rls': return 'RLS de ' + x.tabela + (x.ligado ? ' ligado' : ' desligado');
      case 'politica': return 'regra "' + x.nome + '" de ' + x.tabela;
      case 'funcao': return 'função ' + x.nome + '(' + listaArgs(x.args) + ')';
      case 'gatilho': return 'gatilho ' + x.nome + ' de ' + x.tabela;
      case 'fio': return 'vínculo ' + x.de + ' → ' + x.para;
      default: return '';
    }
  }
  function resumoBanco(pj, s) {
    var l = ['Banco local de ' + pj.nome + ' (Postgres deste computador; a nuvem vem depois): ' + s.tabelas.length + ' tabela' + (s.tabelas.length === 1 ? '' : 's') + '.'], g = gatilhosDe(s.gatilhos);
    s.tabelas.forEach(function (t) {
      var pols = s.politicas.filter(function (p) { return p.tabela === t.nome; });
      l.push('- ' + t.nome + ' · ' + (typeof t.linhas === 'number' ? t.linhas + ' linha' + (t.linhas === 1 ? '' : 's') : 'linhas: ?') + ' · ' +
        (t.rls ? 'RLS ligado' + (pols.length ? ': ' + pols.map(function (p) { return '"' + p.nome + '" (' + cmdBd(p.cmd) + ')'; }).join(', ') : ', sem política') : 'sem RLS' + (pols.length ? ' (' + pols.length + ' política(s) sem efeito)' : '')) +
        ' · colunas: ' + (Array.isArray(t.colunas) && t.colunas.length ? t.colunas.map(function (c) { return c.nome + ' ' + (c.tipo || '?') + (c.pk ? ' pk' : '') + (c.nulo === false ? ' not null' : ''); }).join(', ') : 'nenhuma'));
    });
    if (s.fios.length) l.push('Vínculos: ' + s.fios.map(function (f) { return f.de + (f.coluna ? '.' + f.coluna : '') + ' → ' + f.para; }).join('; ') + '.');
    var regras = s.politicas.filter(function (p) { return regraTxt(p); });
    if (regras.length) l.push('Regras das políticas: ' + regras.map(function (p) { return p.tabela + ' "' + p.nome + '" (' + cmdBd(p.cmd) + '): ' + curto(regraTxt(p), 160); }).join('; ') + '.');
    if (s.funcoes.length) l.push('Funções: ' + s.funcoes.map(function (f) { return f.nome + '(' + listaArgs(f.args) + ')'; }).join('; ') + '.');
    if (g.ordem.length) l.push('Gatilhos: ' + g.ordem.map(function (k) { var x = g.por[k]; return x.tabela + ' "' + x.nome + '" ' + quandoBd(x) + (x.funcao ? ' → ' + nomeFuncao(x.funcao) + '()' : ''); }).join('; ') + '.');
    if (!s.tabelas.length) l.push('Ainda vazio: monte com coop_banco_sql.');
    return l.join('\n');
  }

  F.coop_banco_sql = function (a, c) {
    var M = maquinaOuRecusa(), pj = projetoOuRecusa(a.projeto), sql = String(a.sql == null ? '' : a.sql), corpo = { projeto: pj.id, sql: sql };
    if (!sql.trim()) throw recusa('mande o SQL da migração (sql).');
    if (a.nome) corpo.nome = curto(a.nome, 80);
    return pedirBanco('POST', '/api/banco/aplicar', corpo).then(function (r) {
      if (!r.ok) {
        /* nada foi gravado: nenhuma peça; o erro pisca na gaveta citada (se houver) e volta ao agente com a mensagem do Postgres.
           Parado pelo limite: a mensagem do servidor já diz o que houve. Parte gravada (raro: r.parcial): a Máquina acerta pelo snapshot e a resposta avisa */
        var msg = msgErro(r), alvo = pecaCitada(M, pj, r, sql), ef = { tipo: 'erro', texto: curto(msg, 160) }, parou = /foi interrompida|derrubou o Postgres/.test(msg), acerto = '';
        if (alvo) ef.peca = alvo;
        if (r.parcial === true && r.snapshot) {
          try { var Rp = aplicarNaMaquina(M, pj, { snapshot: r.snapshot, mudancas: [] }, c); acerto = [Rp.nasceram.length ? 'nasceram ' + Rp.nasceram.join('; ') : '', Rp.sairam.length ? 'saíram ' + Rp.sairam.join('; ') : '', Rp.mudaram.length ? 'mudaram ' + Rp.mudaram.join('; ') : ''].filter(Boolean).join(' · '); } catch (e) { console.warn('[coop-ui] a Máquina não acompanhou o banco:', e); }
        }
        abrir3d(M, pj);
        return tocarEfeitos(pj.id, [ef]).then(function () {
          c.anunciar('o banco local de ' + pj.nome + (parou ? ' parou a migração' : ' recusou a migração'));
          if (r.parcial === true) throw recusa((parou ? 'o banco local parou: ' : 'o Postgres recusou: ') + msg + '. Atenção: parte pode ter ficado gravada, sem arquivo de migração; a Máquina foi acertada pelo banco' + (acerto ? ' (' + acerto + ')' : '') + '. Confira com coop_banco_estado antes de tentar de novo.');
          if (parou) throw recusa('o banco local parou: ' + msg + ' Divida a migração ou tire o que demora e chame coop_banco_sql de novo.');
          throw recusa('o Postgres recusou: ' + msg + '. Nada foi gravado: a transação foi desfeita e nenhum arquivo de migração foi criado. Corrija o SQL e chame coop_banco_sql de novo.');
        });
      }
      var R;
      try { R = aplicarNaMaquina(M, pj, r, c); } catch (e) {
        console.warn('[coop-ui] a Máquina não acompanhou o banco:', e);
        R = { efeitos: [], nasceram: [], ligou: [], mudaram: [], sairam: [], falhas: ['a Máquina parou no meio (' + ((e && e.message) || e) + ')'] };
      }
      abrir3d(M, pj);
      return tocarEfeitos(pj.id, R.efeitos).then(function (ef) {
        c.anunciar('migração ' + (r.arquivo ? String(r.arquivo).split('/').pop() + ' ' : '') + 'no banco local de ' + pj.nome);
        return respostaSql(pj, r, R, ef);
      });
    });
  };

  F.coop_banco_consulta = function (a, c) {
    var M = BC.maquina && typeof BC.maquina.doEstado === 'function' ? BC.maquina : null, pj = projetoOuRecusa(a.projeto), sql = String(a.sql == null ? '' : a.sql);
    if (!sql.trim()) throw recusa('mande o comando SQL (sql).');
    return pedirBanco('POST', '/api/banco/consulta', { projeto: pj.id, sql: sql }).then(function (r) {
      if (!r.ok) { var m = msgErro(r); throw recusa(/foi interrompida|derrubou o Postgres/.test(m) ? 'o banco local parou: ' + m : 'o Postgres recusou: ' + m + '.' + (r.parcial === true ? ' Atenção: parte pode ter ficado gravada; confira com coop_banco_estado.' : ' Nada foi gravado.')); }
      var cont = r.contagens && typeof r.contagens === 'object' ? r.contagens : {}, mudou = r.mudou && typeof r.mudou === 'object' ? r.mudou : {}, lista = [], deltas = [];
      var cmd = String(r.comando || 'SQL').toUpperCase(), linhas = Array.isArray(r.linhas) ? r.linhas.slice(0, 50) : [], total = +r.total || 0;
      /* a contagem nova de cada gaveta (só nesta janela); os dados entram na gaveta que cresceu */
      contarDaqui(M, pj, Object.keys(cont).map(function (t) { return [t, cont[t]]; }));
      Object.keys(mudou).forEach(function (t) {
        var dl = +mudou[t];
        if (!dl || !isFinite(dl)) return;
        deltas.push(t + ' ' + (dl > 0 ? '+' : '') + dl);
        if (dl > 0 && M && daqui(M, pecaBd(M, pj, idT(t)))) lista.push({ tipo: 'dados', peca: idT(t), n: dl });
      });
      if (lista.length) abrir3d(M, pj);
      return tocarEfeitos(pj.id, lista).then(function (ef) {
        if (cmd === 'SELECT') c.consulta('leu o banco local de ' + pj.nome);
        else c.anunciar(cmd + ' no banco local de ' + pj.nome + (deltas.length ? ' (' + deltas.join(', ') + ')' : ''));
        var agora = Object.keys(cont).map(function (t) { return t + ' ' + cont[t]; }).join(' · '), fx = textoEfeitos(ef);
        var texto = cmd + ' no banco local de ' + pj.nome + ': ' + total + ' linha' + (total === 1 ? '' : 's') + (cmd === 'SELECT' ? ' devolvida' : ' afetada') + (total === 1 ? '' : 's') + '.' +
          (deltas.length ? ' Mudou: ' + deltas.join(', ') + '.' : '') + (agora ? ' Linhas agora: ' + agora + '.' : '') + (fx ? ' ' + fx : '') +
          (linhas.length ? '\n' + (total > linhas.length ? 'As primeiras ' + linhas.length + ':' : 'Linhas:') + '\n' + linhas.map(function (x) { try { return JSON.stringify(x); } catch (e) { return String(x); } }).join('\n') : '');
        return { texto: texto, dados: { projeto: { id: pj.id, nome: pj.nome }, comando: cmd, total: total, linhas: linhas, contagens: cont, mudou: mudou } };
      });
    });
  };

  F.coop_banco_estado = function (a, c) {
    var M = BC.maquina && typeof BC.maquina.contagem === 'function' ? BC.maquina : null, pj = projetoOuRecusa(a.projeto);
    return pedirBanco('GET', '/api/banco/estado?projeto=' + encodeURIComponent(pj.id)).then(function (r) {
      if (!r.ok) throw recusa('o banco local de ' + pj.nome + ' não respondeu: ' + msgErro(r) + '.');
      var s = snapDe(r);
      contarDaqui(M, pj, s.tabelas.map(function (t) { return [t.nome, t.linhas]; }));
      c.consulta('leu o banco local de ' + pj.nome);
      return { texto: resumoBanco(pj, s), dados: { projeto: { id: pj.id, nome: pj.nome }, snapshot: s } };
    });
  };

  /* ---------- a Estação da pessoa: o terminal comanda o meio e a barra ----------
     Só esta tela troca (a Estação que recebeu a chamada) e nada vai assinado pelo agente. Mas quem abre são as funções que a
     própria Estação usa (BC.estacao.abrir/abrirAba/abrirPerfil/abrirProjeto, BC.explorador.abrirArquivo, BC.maquina.abrir/
     abrir3d), então vale o mesmo que num clique da pessoa: o que fica aberto 700 ms vira a posição dela (endereco.js registrar →
     L.fazer("posicao"), diário e as outras Estações), arquivo de outra pessoa avisa o dono (estacao.js → "vendoArquivo"), o Chat
     aberto marca a conversa como lida (chat.js → "lida") e a Máquina em 3D publica o corpo das peças (visual3d.js → "corpoPeca").
     A chegada é a mesma luz do endereço (endereco.js). */
  var ATIVIDADES_TELA = [
    ['dia', 'Meu dia', ['meu dia', 'dia', 'hoje', 'inicio']],
    ['explorador', 'Criar', ['criar', 'explorador', 'arquivos']],
    ['demandas', 'Trabalho', ['trabalho', 'demandas', 'demanda']],
    ['tarefas', 'Tarefas', ['tarefas', 'tarefa', 'fluxos']],
    ['chat', 'Chat', ['chat', 'conversas']],
    ['whatsapp', 'WhatsApp', ['whatsapp', 'whats', 'zap']],
    ['reuniao', 'Reunião', ['reuniao', 'reunioes']],
    ['terminais', 'Terminais', ['terminais', 'terminal', 'terminais ao vivo']],
    ['projetos', 'Projetos', ['projetos']],
    ['acervo', 'Acervo', ['acervo', 'busca']],
    ['inteligencia', 'Inteligência', ['inteligencia', 'inteligencia da equipe', 'sonho']],
    ['equipe', 'Equipe', ['equipe', 'pessoas']],
    ['metas', 'Metas', ['metas', 'meta', 'campanhas', 'metas e campanhas']],
    ['mapa', 'Mapa da equipe', ['mapa', 'mapa da equipe']],
    ['loja', 'Loja', ['loja', 'loja da equipe']],
    ['oficina', 'Oficina', ['oficina', 'oficina do app']]
  ];
  var ALIAS_ABA = { maquina: 'explorador', navegador: 'terminais', perfil: 'equipe', projeto: 'projetos', arquivo: 'explorador', demanda: 'demandas', tarefa: 'tarefas', 'nova-demanda': 'demandas', 'nova-tarefa': 'tarefas' };
  function atividadePorId(id) { return ATIVIDADES_TELA.filter(function (x) { return x[0] === id; })[0] || null; }
  function acharAtividade(txt) {
    var q = normalizar(txt).trim().replace(/^(a|o|as|os|na|no|em|para|pra)\s+/, '').replace(/^(tela|aba|atividade|vista)\s+(de\s+|do\s+|da\s+)?/, '').trim();
    if (!q) return null;
    return ATIVIDADES_TELA.filter(function (x) { return x[0] === q || normalizar(x[1]) === q || x[2].indexOf(q) !== -1; })[0] || null;
  }
  function estacaoOuRecusa() {
    var E = BC.estacao;
    if (!E || typeof E.abaAtual !== 'function' || !E.ui) throw recusa('a Estação não está carregada nesta tela.');
    return E;
  }
  /* o arquivo pelo caminho da pasta compartilhada (com ou sem a pasta da pessoa, ou o caminho inteiro do disco) ou pelo nome */
  function arquivoDaTela(ref) {
    var bruto = String(ref == null ? '' : ref).trim().replace(/\\/g, '/').replace(/^file:\/\//i, '');
    try { bruto = decodeURIComponent(bruto); } catch (e) { /* fica como veio */ }
    var rel = bruto.replace(/^\.?\/+/, ''), bl = bruto.toLowerCase(), lista = (L.estado && L.estado.arquivos) || [];
    if (!rel) return null;
    return L.arquivo(rel) || L.arquivo(L.eu + '/' + rel) ||
      lista.filter(function (a) { var c = '/' + a.caminho.toLowerCase(); return bl.length > c.length && bl.slice(-c.length) === c; })[0] || acharArquivo(rel);
  }
  /* arquivo que o agente acabou de gravar: a árvore pode não ter visto ainda; pede a lista e espera até 4 s */
  function esperarArquivo(ref) {
    var achado = arquivoDaTela(ref);
    if (achado) return Promise.resolve(achado);
    var R = BC.arquivosReal;
    if (R && typeof R.buscar === 'function') { try { R.buscar(L.eu); } catch (e) { /* segue sem a lista nova */ } }
    return new Promise(function (ok) {
      var fim = Date.now() + 4000;
      (function olhar() {
        var a = arquivoDaTela(ref);
        if (a || Date.now() > fim) return ok(a || null);
        setTimeout(olhar, 200);
      })();
    });
  }
  /* edição que a pessoa ainda não salvou. O texto do modo Editar mora só no <textarea> da aba ativa (trocar de aba redesenha
     o meio e ele some); a edição visual (tab.rascunhoVisual) sobrevive à troca, mas some quando a aba fecha. O agente age
     enquanto ela digita: em vez de jogar isso fora em silêncio, abrir recusa e fechar deixa a aba aberta. */
  function textoNaoSalvo(t, E) {
    if (!t || t.tipo !== 'arquivo' || (t.modo || 'ver') !== 'editar' || t.id !== E.ui.ativa) return false;
    var a = L.arquivo(t.ref), campo = a && document.getElementById('ed-texto-' + a.id);
    return !!(campo && campo.value !== campo.defaultValue);
  }
  function edicaoPendente(t, E, fechando) {
    if (!t || t.tipo !== 'arquivo') return '';
    if (textoNaoSalvo(t, E)) return 'texto digitado no modo Editar';
    return fechando && t.rascunhoVisual != null ? 'mudança visual pendente' : '';
  }
  /* antes de trocar a aba ativa (alvoId: a aba que vai abrir, quando se sabe; a mesma aba não perde nada) */
  function protegerEdicao(E, alvoId) {
    var atual = E.abaAtual();
    if (!atual || atual.id === alvoId || !textoNaoSalvo(atual, E)) return;
    throw recusa(L.nome(L.eu) + ' está editando ' + tituloDaAba(atual) + ' e ainda não salvou: abrir outra coisa agora jogaria fora o texto digitado. ' +
      'Peça para salvar (Ctrl+S) ou cancelar a edição e chame de novo.');
  }
  function tituloDaAba(t) {
    if (!t) return '';
    if (t.tipo === 'arquivo') { var a = L.arquivo(t.ref); return a ? a.caminho.split('/').pop() : t.titulo || 'arquivo'; }
    if (t.tipo === 'perfil') return 'Sobre ' + L.nome(t.ref);
    if (t.tipo === 'projeto') { var pj = ((L.estado && L.estado.projetos) || []).filter(function (x) { return x.id === t.ref; })[0]; return pj ? pj.nome : 'Projeto'; }
    if (t.titulo) return t.titulo;
    var at = atividadePorId(t.tipo);
    return at ? at[1] : t.tipo;
  }
  function descreverAba(t, ativa) {
    var En = BC.endereco, end = null;
    try { end = En && typeof En.daAba === 'function' ? En.daAba(t) : null; } catch (e) { end = null; }
    var d = { id: t.id, tipo: t.tipo, ref: t.ref != null ? t.ref : null, titulo: tituloDaAba(t), endereco: end ? end.texto : '', ativa: !!ativa };
    if (t.tipo === 'arquivo') { var a = L.arquivo(t.ref); if (a) d.caminho = a.caminho; }
    if (t.tipo === 'maquina') { var m = BC.maquina && BC.maquina.maquinas && BC.maquina.maquinas[t.ref]; d.modo = m && m.zoom === '3d' ? '3d' : '2d'; }
    if (t.tipo === 'navegador') { var s = BC.navegador && BC.navegador.sessoes ? BC.navegador.sessoes[t.ref] : null; if (s && s.url) d.url = s.url; }
    return d;
  }
  function atividadeDaAba(t) {
    if (!t || t.tipo === 'vazio') return null;
    var id = t.atividade || t.tipo;
    id = atividadePorId(id) ? id : ALIAS_ABA[id] || id;
    var at = atividadePorId(id);
    return at ? { id: at[0], nome: at[1] } : { id: id, nome: id };
  }
  /* a luz de chegada (a mesma do endereço): do terminal até o que abriu, faíscas e um tique (BC.organismo); o cabeçalho do
     endereço varre uma vez em CSS. Tudo com fim: o pulso chega, a classe sai em 1,4 s; movimento reduzido fica com o CSS parado. */
  function chegada() {
    var O = BC.organismo && BC.organismo.versao ? BC.organismo : null, nav = document.getElementById('e-endereco');
    var alvo = (nav && !nav.hidden && nav.querySelector('.end-p-peca')) || document.querySelector('#e-abas .e-aba[aria-selected="true"]') || document.getElementById('e-conteudo');
    var r = { pulso: false, varredura: false };
    if (!alvo) return r;
    if (O && typeof O.pulso === 'function') {
      var painel = document.getElementById('e-painel'), caixa = painel && painel.getBoundingClientRect(), de = null;
      if (caixa && caixa.width > 0) de = { x: caixa.left + 24, y: caixa.top + caixa.height / 2 };
      else if (nav) { var n = nav.getBoundingClientRect(); de = { x: n.left + 24, y: n.top + n.height / 2 }; }
      try {
        O.pulso(de || alvo, alvo, { cor: 'marca', aoChegar: function () { try { O.faiscas(alvo, 5, false, { onde: 'centro' }); } catch (e) { /* sem faíscas */ } } });
        O.som('tique');
        r.pulso = true;
      } catch (e) { console.warn('[coop-ui] a luz de chegada não acendeu:', e); }
    }
    if (nav && !nav.hidden) {
      nav.classList.remove('end-chegada'); void nav.offsetWidth; nav.classList.add('end-chegada');
      setTimeout(function () { nav.classList.remove('end-chegada'); }, 1400);
      r.varredura = true;
    }
    return r;
  }
  /* depois de abrir: a luz, o aviso e a resposta com o que está na tela */
  function abriu(E, c, oque) {
    var atual = E.abaAtual(), d = descreverAba(atual, true);
    setTimeout(chegada, 30);
    c.tela('abriu ' + oque);
    return {
      texto: 'Abri ' + oque + ' na Estação de ' + L.nome(L.eu) + (d.endereco ? ' · ' + d.endereco : '') + '.',
      dados: { aberto: d, atividade: atividadeDaAba(atual) }
    };
  }
  function abrirMaquina(E, c, a) {
    var M = maquinaOuRecusa(), pj = projetoOuRecusa(a.ref), tres = a.modo === '3d';
    protegerEdicao(E, null);
    if (tres) {
      if (typeof M.abrir3d !== 'function' || M.abrir3d(pj.id) === false) throw recusa('a Máquina de ' + pj.nome + ' não abriu em 3D nesta tela.');
    } else {
      M.abrir(pj.id);
      var m = M.maquinas && M.maquinas[pj.id];
      if (m && m.zoom === '3d') { m.zoom = 'dominio'; E.render(); }
    }
    return abriu(E, c, 'a Máquina de ' + pj.nome + (tres ? ' em 3D' : ' em 2D'));
  }

  F.coop_abrir = function (a, c) {
    var E = estacaoOuRecusa(), o = a.o, ref = a.ref == null ? '' : String(a.ref).trim();
    if (o === 'atividade') {
      if (!ref) throw recusa('diga qual atividade (ref): ' + ATIVIDADES_TELA.map(function (x) { return x[1]; }).join(', ') + '.');
      if (/^(a\s+)?maquina$/.test(normalizar(ref).trim())) return abrirMaquina(E, c, { modo: a.modo });
      var at = acharAtividade(ref);
      if (!at) throw recusa('não conheço a atividade "' + curto(ref, 60) + '". As da barra: ' + ATIVIDADES_TELA.map(function (x) { return x[1]; }).join(', ') + '.');
      protegerEdicao(E, null);
      if (at[0] === 'explorador') E.abrirAba({ id: 'explorador', tipo: 'explorador' }); else E.abrir(at[0]);
      return abriu(E, c, at[1]);
    }
    if (o === 'maquina') return abrirMaquina(E, c, a);
    if (o === 'projeto') {
      if (!ref) { protegerEdicao(E, null); E.abrir('projetos'); return abriu(E, c, 'Projetos'); }
      var pj = projetoOuRecusa(ref);
      protegerEdicao(E, 'projeto:' + pj.id);
      if (typeof E.abrirProjeto === 'function') E.abrirProjeto(pj.id); else E.abrirAba({ id: 'projeto:' + pj.id, tipo: 'projeto', ref: pj.id, atividade: 'projetos' });
      return abriu(E, c, 'o projeto ' + pj.nome);
    }
    if (o === 'pessoa') {
      if (!ref) throw recusa('diga de quem (ref). Pessoas: ' + nomesDaEquipe() + '.');
      var p = pessoaOuRecusa(ref);
      protegerEdicao(E, 'perfil:' + p.id);
      E.abrirPerfil(p.id);
      return abriu(E, c, 'o perfil de ' + p.nome);
    }
    if (o === 'arquivo') {
      if (!ref) throw recusa('diga o caminho ou o nome do arquivo (ref).');
      if (!BC.explorador || typeof BC.explorador.abrirArquivo !== 'function') throw recusa('o explorador de arquivos não está carregado nesta tela.');
      return esperarArquivo(ref).then(function (arq) {
        if (!arq) {
          var alguns = ((L.estado && L.estado.arquivos) || []).filter(function (x) { return x.dono === L.eu; }).slice(0, 12).map(function (x) { return x.caminho; }).join(' · ');
          throw recusa('não achei o arquivo "' + curto(ref, 200) + '" na pasta compartilhada.' + (alguns ? ' Alguns da pasta de ' + L.nome(L.eu) + ': ' + alguns : ''));
        }
        protegerEdicao(E, 'arq:' + arq.id);
        BC.explorador.abrirArquivo(arq.id);
        return abriu(E, c, arq.caminho);
      });
    }
    throw recusa('o que abrir? o = atividade, arquivo, projeto, maquina ou pessoa.');
  };

  F.coop_fechar = function (a, c) {
    var E = estacaoOuRecusa(), abas = E.ui.abas.slice();
    var plural = function (n) { return n + ' aba' + (n === 1 ? '' : 's'); };
    if (a.o === 'tudo') {
      if (!abas.length) return { texto: 'O meio da Estação já está vazio: nenhuma aba aberta.', dados: { fechadas: [] } };
      /* aba com edição não salva fica aberta (fecharTodas jogaria fora o texto e o rascunho visual) */
      var presas = abas.map(function (t) { return { t: t, oque: edicaoPendente(t, E, true) }; }).filter(function (x) { return x.oque; });
      if (!presas.length) {
        E.fecharTodas();
        c.tela('fechou todas as abas');
        return { texto: 'Fechei ' + plural(abas.length) + ' (' + abas.map(tituloDaAba).join(', ') + '): o meio da Estação ficou vazio.', dados: { fechadas: abas.map(tituloDaAba), mantidas: [] } };
      }
      var ficam = presas.map(function (x) { return tituloDaAba(x.t) + ' (edição não salva: ' + x.oque + ')'; }).join(', ');
      var saem = abas.filter(function (t) { return !presas.some(function (x) { return x.t === t; }); });
      if (!saem.length) throw recusa('não fechei nada: ' + ficam + '. Peça para ' + L.nome(L.eu) + ' salvar ou descartar antes.');
      saem.forEach(function (t) { E.fecharAba(t.id); });
      c.tela('fechou ' + plural(saem.length) + ' (a edição não salva ficou)');
      return {
        texto: 'Fechei ' + plural(saem.length) + ' (' + saem.map(tituloDaAba).join(', ') + '). Deixei aberta' + (presas.length === 1 ? '' : 's') + ' ' + ficam + ': peça para ' + L.nome(L.eu) + ' salvar ou descartar antes de fechar.',
        dados: { fechadas: saem.map(tituloDaAba), mantidas: presas.map(function (x) { return { titulo: tituloDaAba(x.t), oque: x.oque }; }) }
      };
    }
    var alvo;
    if (a.ref == null || String(a.ref).trim() === '') {
      alvo = E.abaAtual();
      if (!alvo || alvo.tipo === 'vazio') throw recusa('não há aba aberta para fechar.');
    } else {
      /* título igual; senão, entre as que contêm o texto, a ativa, depois a que começa com ele; por fim a atividade da aba */
      var q = normalizar(a.ref).trim(), nomes = abas.map(function (t) { return normalizar(tituloDaAba(t)); }), ativaId = E.ui.ativa;
      var contem = abas.filter(function (t, i) { return nomes[i].indexOf(q) !== -1; });
      alvo = abas.filter(function (t, i) { return nomes[i] === q; })[0] || contem.filter(function (t) { return t.id === ativaId; })[0] ||
        contem.filter(function (t) { return normalizar(tituloDaAba(t)).indexOf(q) === 0; })[0] || contem[0] ||
        abas.filter(function (t) { var at = atividadeDaAba(t); return at && (at.id === q || normalizar(at.nome) === q); })[0];
      if (!alvo) throw recusa('não há aba "' + curto(a.ref, 80) + '" aberta.' + (abas.length ? ' Abertas: ' + abas.map(tituloDaAba).join(', ') + '.' : ' O meio está vazio.'));
    }
    var titulo = tituloDaAba(alvo), pendente = edicaoPendente(alvo, E, true);
    if (pendente) throw recusa('a aba "' + titulo + '" tem edição não salva (' + pendente + '): não fechei. Peça para ' + L.nome(L.eu) + ' salvar ou descartar antes.');
    E.fecharAba(alvo.id);
    c.tela('fechou a aba ' + titulo);
    var agora = E.abaAtual();
    return { texto: 'Fechei a aba "' + titulo + '".' + (agora && agora.tipo !== 'vazio' ? ' Agora na tela: ' + tituloDaAba(agora) + '.' : ' O meio ficou vazio.'), dados: { fechadas: [titulo], ativa: agora && agora.tipo !== 'vazio' ? descreverAba(agora, true) : null } };
  };

  /* quem, pelo nome: pessoa (id) ou agente ('ag:<id>') */
  function quemPorNome(txt) {
    var p = acharPessoa(txt);
    if (p) return { id: p.id, nome: p.nome };
    var q = normalizar(txt).trim(), achado = null;
    pessoas().forEach(function (ps) { (ps.agentes || []).forEach(function (ag) { if (!achado && (ag.id === String(txt).trim() || normalizar(ag.nome).trim() === q)) achado = { id: 'ag:' + ag.id, nome: ag.nome }; }); });
    return achado;
  }
  function linhaOnde(pos) {
    var quem = pos.nome + (pos.tipo === 'agente' ? ' (agente de ' + pos.dono.nome + ')' : pos.eu ? ' (esta Estação)' : '');
    var onde = pos.end ? pos.end.texto : pos.fora ? 'desligado(a)' : 'sem posição agora';
    var oque = pos.oque && pos.oque !== 'aqui' ? pos.oque : '';
    var quando = pos.eu ? 'agora' : pos.ts && U.relativo ? U.relativo(pos.ts) : '';
    return quem + ': ' + onde + (oque ? ' · ' + oque : '') + (quando && pos.end ? ' · ' + quando : '') + (pos.fora && pos.end ? ' · desligado(a)' : '');
  }
  function dadoOnde(pos) {
    return { id: pos.id, nome: pos.nome, tipo: pos.tipo, dono: pos.tipo === 'agente' ? pos.dono.id : null, endereco: pos.end ? pos.end.texto : null, sala: pos.end ? pos.end.sala.rotulo : null, peca: pos.end ? pos.end.rotulo : null, alvo: pos.alvo || null, oque: pos.oque || '', ts: pos.ts || null, fora: !!pos.fora, eu: !!pos.eu };
  }

  F.coop_onde = function (a, c) {
    var En = BC.endereco;
    if (!En || typeof En.ondeEstao !== 'function' || typeof En.posicao !== 'function') throw recusa('o endereço (quem está onde) não está carregado nesta tela.');
    if (a.pessoa) {
      var quem = quemPorNome(a.pessoa);
      if (!quem) throw recusa('não achei "' + curto(a.pessoa, 60) + '" na equipe nem entre os agentes. Pessoas: ' + nomesDaEquipe() + '.');
      var pos = En.posicao(quem.id);
      if (!pos) throw recusa('não sei onde ' + quem.nome + ' está.');
      var rastro = typeof En.rastro === 'function' ? En.rastro(quem.id, 8) : [];
      var hora = U.hora || function (ts) { var d = new Date(ts); return dois(d.getHours()) + ':' + dois(d.getMinutes()); };
      c.consulta('viu onde ' + quem.nome + ' está');
      return {
        texto: linhaOnde(pos) + (rastro.length ? '\nPor onde passou:\n' + rastro.map(function (x) { return '- ' + hora(x.ts) + ' · ' + x.end.texto + (x.oque ? ' · ' + curto(x.oque, 80) : ''); }).join('\n') : ''),
        dados: { posicao: dadoOnde(pos), rastro: rastro.map(function (x) { return { ts: x.ts, endereco: x.end.texto, oque: x.oque || '' }; }) }
      };
    }
    var lista = En.ondeEstao();
    c.consulta('viu onde cada um está');
    return {
      texto: lista.length ? 'Onde cada um está (Sala › bancada › peça):\n' + lista.map(function (p) { return '- ' + linhaOnde(p); }).join('\n') : 'Ninguém com posição agora.',
      dados: { posicoes: lista.map(dadoOnde) }
    };
  };

  F.coop_tela = function (a, c) {
    var E = estacaoOuRecusa(), atual = E.abaAtual(), abas = E.ui.abas.map(function (t) { return descreverAba(t, t.id === atual.id); });
    var ativa = atual && atual.tipo !== 'vazio' ? descreverAba(atual, true) : null, at = atividadeDaAba(atual);
    c.consulta('viu o que está na tela');
    return {
      texto: 'Na Estação de ' + L.nome(L.eu) + ' agora:\n' +
        '- aba ativa: ' + (ativa ? ativa.titulo + ' (' + ativa.tipo + ')' + (ativa.endereco ? ' · ' + ativa.endereco : '') + (ativa.caminho ? ' · arquivo ' + ativa.caminho : '') + (ativa.modo ? ' · Máquina em ' + ativa.modo.toUpperCase() : '') + (ativa.url ? ' · ' + ativa.url : '') : 'nenhuma: o meio está vazio') + '\n' +
        '- abas abertas (' + abas.length + '): ' + (abas.length ? abas.map(function (x) { return x.titulo; }).join(' · ') : 'nenhuma') + '\n' +
        '- atividade da barra: ' + (at ? at.nome : 'nenhuma'),
      dados: { ativa: ativa, abas: abas, atividade: at }
    };
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
    if ((detalhe.tipo === 'acao' || detalhe.tipo === 'tela') && BC.estacao && typeof BC.estacao.aviso === 'function') { try { BC.estacao.aviso(detalhe.assinatura + ': ' + detalhe.resumo); } catch (e) { /* sem aviso */ } }
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
      /* o agente mexeu só nesta tela (abriu ou fechou algo no meio): o aviso visível e o 'coop-feito', sem diário */
      tela: function (resumo) { anunciar(Object.assign({ tipo: 'tela', resumo: resumo, ts: Date.now() }, base)); },
      /* ação feita por outra peça (ex.: BC.campanha.gerar), já assinada por ela: só o aviso e o 'coop-feito' */
      anunciar: function (resumo) { anunciar(Object.assign({ tipo: 'acao', resumo: resumo, ts: Date.now() }, base)); }
    };
    var args = m.args && typeof m.args === 'object' && !Array.isArray(m.args) ? m.args : {};
    var r;
    try { r = fn(args, c); } catch (e) {
      if (!e.recusa) console.warn('[coop-ui] ' + m.ferramenta + ' falhou:', e);
      return falha(e.recusa ? e.message : m.ferramenta + ' falhou na tela: ' + e.message);
    }
    /* ferramenta que espera (o banco, a animação da Máquina): responde quando acabar; recusa vira falha */
    if (r && typeof r.then === 'function') {
      r.then(function (v) { responder({ tipo: 'mcp-resposta', cid: m.cid, ok: true, resultado: v }); }, function (e) {
        if (!e || !e.recusa) console.warn('[coop-ui] ' + m.ferramenta + ' falhou:', e);
        falha(e && e.recusa ? e.message : m.ferramenta + ' falhou na tela: ' + ((e && e.message) || e));
      });
      return;
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
