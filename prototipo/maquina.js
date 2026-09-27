/* babel-coop · protótipo · a Máquina 2030: o backend da equipe em 2D, com nós e fios, e o organismo vivo.
   Peças com nome de gente (Gaveta, Campo, Fio, Chave, Empresa, Portaria, Porta, Robô, Depósito, Cofre, Tela, Cano
   + Armário, Ferramenta, Carteiro, Casa de Máquinas = as 16). Os fios são calculados pela posição real dos nós depois de
   cada desenho. Testar manda um pulso pelos fios, peça a peça; a outra empresa morre no cadeado; "Máquina funcionando"
   dá corpo às peças; Publicar dá corpo à peça nova tracejada. Pontos sempre com origem (docs/design/REGUA_ORGANISMO.md).
   Contrato: docs/design/MAQUINA_PECAS.md · SUPABASE_PECAS.md · PLANO.md §1 (4), §3 (B · Criar · Máquina), F4.
   Efeitos: usa window.BC.organismo quando existe (app); no protótipo puro cai para CSS e um som mínimo.
   Tudo aqui é simulado sobre um projeto de exemplo (Clínicas). No app, a Máquina vive no estado da equipe (diário).
   Peça com banco:true (ids bd-t-/bd-g-/bd-f-, montada por coop_banco_sql em app/interface/coop-ui.js) existe de verdade no
   banco local da Estação que a montou (campo estacao = quem assinou o evento; peça antiga sem ele = quem a montou): tem corpo
   e o selo "no banco local" (de outra Estação: "no banco local de <nome>"). Só essa Estação muda ou tira a peça: o banco é
   de cada computador, a Máquina é da equipe. As outras são só desenho.
   Testar continua sendo animação local e Publicar só marca as peças (a subida para a nuvem vem depois). */
window.BC = window.BC || {};
BC.acoes = BC.acoes || {};
BC.vistas = BC.vistas || {};
BC.formularios = BC.formularios || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc, A = BC.acoes;
  function L() { return BC.loja; }
  function ui() { return BC.estacao.ui; }
  function agora() { return Date.now(); }
  function aviso(t) { if (BC.estacao && BC.estacao.aviso) BC.estacao.aviso(t); }
  var M = { maquinas: {} };
  var ouvintes = [];
  function avisar(ev) { ouvintes.forEach(function (fn) { try { fn(ev); } catch (e) { /* quem ouve não derruba a Máquina */ } }); }

  /* ================================================================== as 16 peças (SUPABASE_PECAS.md §A) */
  var PECAS = [
    { id: 'gaveta', nome: 'Gaveta', oque: 'guarda uma lista de coisas: pacientes, agendamentos, pedidos', porBaixo: 'tabela do banco · variantes: vitrine (view) e janela (tabela de fora)', forma: 'caixa com frente, cadeado e rodapé com o número de linhas', monta: true },
    { id: 'campo', nome: 'Campo', oque: 'uma informação de cada linha da gaveta: nome, data, telefone, ligação', porBaixo: 'coluna e tipo · etiqueta = chave primária · marcador = índice', forma: 'linha dentro da gaveta, com o glifo do tipo' },
    { id: 'fio', nome: 'Fio', oque: 'liga uma gaveta a outra: cada agendamento pertence a um paciente', porBaixo: 'chave estrangeira · ao apagar: apagam junto, impedem ou ficam sem', forma: 'cabo fino com losango na ponta "muitos"' },
    { id: 'chave', nome: 'Chave', oque: 'o cadeado da gaveta: diz quem pode ver e mexer', porBaixo: 'política de acesso por linha (RLS)', forma: 'cadeado na frente da gaveta; treme quando barra' },
    { id: 'empresa', nome: 'Empresa', oque: 'a bandeja: tudo dentro dela é separado por empresa, cada uma vê só o seu', porBaixo: 'marca da empresa em cada linha (tenant_id) + chave + crachá do login', forma: 'bandeja rebaixada em volta das gavetas' },
    { id: 'portaria', nome: 'Portaria', oque: 'onde as pessoas entram: e-mail e senha, link, papéis', porBaixo: 'login e papéis (Auth), sessão, crachá (JWT)', forma: 'peça alta com a fresta que acende verde ou vermelha' },
    { id: 'porta', nome: 'Porta', oque: 'por onde um pedido entra e sai: "novo agendamento", "listar do dia"', porBaixo: 'Edge Function, rota de API ou função do banco (RPC)', forma: 'conector grande à esquerda; círculo = um registro, três traços = muitos', monta: true },
    { id: 'robo', nome: 'Robô', oque: 'faz algo sozinho quando algo acontece ou numa hora marcada', porBaixo: 'gatilho (trigger), agenda (cron), webhook, função interna', forma: 'quadrado com engrenagem que gira 60° ao disparar', monta: true },
    { id: 'deposito', nome: 'Depósito', oque: 'a prateleira de arquivos: fotos, PDFs, contratos', porBaixo: 'bucket de arquivos, público ou privado, com a chave dele', forma: 'prateleira baixa com a régua de uso', monta: true },
    { id: 'cofre', nome: 'Cofre', oque: 'guarda as senhas das integrações; aqui aparece só o nome, nunca o valor', porBaixo: 'variáveis de ambiente, segredos e o cofre do banco (Vault)', forma: 'obsidiana, uma luz por chave' },
    { id: 'tela', nome: 'Tela', oque: 'a página que a equipe ou o cliente usa', porBaixo: 'página do frontend no repositório', forma: 'miniatura da página, que atualiza quando o cano avisa', monta: true },
    { id: 'cano', nome: 'Cano', oque: 'avisa na hora quando uma gaveta muda; vazio quando nada acontece', porBaixo: 'tempo real (Realtime), fila (pgmq) ou pipeline', forma: 'tubo; as bolinhas passam só quando há evento', monta: true },
    { id: 'armario', nome: 'Armário', oque: 'onde as gavetas ficam; o armário da frente tem porta na rua', porBaixo: 'schema: public = da frente; private, auth, storage = dos fundos', forma: 'a moldura do palco inteiro' },
    { id: 'ferramenta', nome: 'Ferramenta', oque: 'uma habilidade que a máquina ganha: busca por parecido, mapa, agenda', porBaixo: 'extensão do Postgres (pgvector, PostGIS, pg_cron…)', forma: 'chave inglesa ligada ou desligada' },
    { id: 'carteiro', nome: 'Carteiro', oque: 'quem manda os e-mails e SMS da Portaria', porBaixo: 'remetente de e-mail (SMTP) ou SMS; o padrão manda 2 por hora, só para a equipe', forma: 'peça pequena presa à Portaria' },
    { id: 'casa', nome: 'Casa de Máquinas', oque: 'o chão da máquina: tamanho, disco, cópia de segurança, região', porBaixo: 'compute, disco, backups, volta no tempo (PITR), réplicas, domínio', forma: 'uma linha fixa embaixo do palco' }
  ];
  var INFO = {}, TIPOS = {}, POR_BAIXO = {};
  PECAS.forEach(function (p) { INFO[p.id] = p; TIPOS[p.id] = p.nome; POR_BAIXO[p.id] = p.porBaixo; });

  /* glifos monoline 1,5 px (leva única da casca quando BC.icones existir; estes são a reserva, nunca emoji) */
  var GLIFOS = {
    gaveta: '<rect x="4.5" y="3" width="15" height="18" rx="1.5"/><path d="M4.5 9h15M4.5 15h15M10 6h4M10 12h4M10 18h4"/>',
    campo: '<rect x="3" y="8" width="18" height="8" rx="1.5"/><path d="M6.5 12h7"/><circle cx="17" cy="12" r="1.2"/>',
    fio: '<circle cx="5" cy="17" r="2"/><circle cx="19" cy="7" r="2"/><path d="M7 17c6 0 4-10 10-10"/>',
    chave: '<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.5"/>',
    empresa: '<path d="M3 21h18M5 21V5.5L12 3v18M12 8.5h7V21M8 8h1.5M8 12h1.5M8 16h1.5M15 12h1.5M15 16h1.5"/>',
    portaria: '<path d="M3.5 21V7h7v14M3.5 11h7M2.5 21h9M10.5 14.5H21"/><circle cx="10.5" cy="14.5" r="1.1"/><path d="M5.5 4.5h3"/>',
    porta: '<path d="M12.5 3.5h7v17h-7M3 12h11M10.5 8.5 14 12l-3.5 3.5"/>',
    robo: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/><circle cx="12" cy="12" r="6.5"/>',
    deposito: '<path d="M3 3.5v17M21 3.5v17M3 12h18M3 20.5h18"/><rect x="5.5" y="6.5" width="4" height="5.5"/><rect x="11" y="8" width="4" height="4"/><rect x="6" y="15" width="5.5" height="5.5"/>',
    cofre: '<rect x="3.5" y="3.5" width="17" height="16" rx="2"/><circle cx="12" cy="11.5" r="3.8"/><path d="M12 7.7v1.6M12 13.7v1.6M8.2 11.5h1.6M14.2 11.5h1.6M6.5 19.5v1.5M17.5 19.5v1.5"/>',
    tela: '<rect x="3" y="5" width="18" height="13.5" rx="1.5"/><path d="M3 9h18M6 12.5h8M6 15h5"/>',
    cano: '<path d="M2 8.5h20M2 15.5h20"/><circle cx="7" cy="12" r=".9"/><circle cx="12" cy="12" r=".9"/><circle cx="17" cy="12" r=".9"/>',
    armario: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M12 3v18M10 11v2.5M14 11v2.5"/>',
    ferramenta: '<path d="M14.7 3.8a4.8 4.8 0 0 0-5.3 6.4L3.6 16a1.9 1.9 0 0 0 2.7 2.7l5.8-5.8a4.8 4.8 0 0 0 6.4-5.3l-2.8 2.8-2.6-.4-.4-2.6z"/>',
    carteiro: '<rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3.5 6.5 12 13l8.5-6.5"/>',
    casa: '<path d="M3 10.5 12 4l9 6.5V21H3z"/><path d="M8 21v-6.5h8V21M8 17.5h8"/>',
    maquina: '<rect x="3" y="4" width="8" height="6" rx="1.2"/><rect x="13" y="4" width="8" height="6" rx="1.2"/><rect x="8" y="14" width="8" height="6" rx="1.2"/><path d="M7 10v2h10v-2M12 12v2"/>',
    alerta: '<path d="M12 3.5 21.5 20h-19z"/><path d="M12 10v4.5M12 17.2v.3"/>',
    barrado: '<circle cx="12" cy="12" r="8.5"/><path d="M6 18 18 6"/>',
    aberto: '<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V8a4 4 0 0 1 7.6-1.7M12 14.5v2.5"/>'
  };
  var ICONE_NOME = { casa: ['casa-de-maquinas', 'casa-maquinas', 'casa'], robo: ['robo'], deposito: ['deposito'], armario: ['armario'] };
  function glifo(tipo, tam) {
    tam = tam || 14;
    var ic = BC.icones;
    if (ic && typeof ic.svg === 'function' && typeof ic.nomes === 'function' && tipo !== 'aberto') {
      var nomes = null;
      try { nomes = ic.nomes(); } catch (e) { nomes = null; }
      var cands = ICONE_NOME[tipo] || [tipo];
      for (var i = 0; nomes && i < cands.length; i++) {
        if (nomes.indexOf(cands[i]) === -1) continue;
        try {
          var s = ic.svg(cands[i], tam);
          if (typeof s === 'string' && s.indexOf('<svg') !== -1) return '<span class="mq-g" style="--g:' + tam + 'px" data-g="' + tipo + '">' + s + '</span>';
        } catch (e) { /* cai para o glifo daqui */ }
      }
    }
    return '<span class="mq-g" style="--g:' + tam + 'px" data-g="' + tipo + '"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + (GLIFOS[tipo] || GLIFOS.gaveta) + '</svg></span>';
  }

  /* ================================================================== o corpo das peças (as imagens isométricas) */
  var CORPO_PADRAO = { gaveta: 'midia/pecas/gaveta-iso.png', portaria: 'midia/pecas/portaria-iso.png', porta: 'midia/pecas/porta-iso.png', robo: 'midia/pecas/robo-iso.png', cano: 'midia/pecas/cano-iso.png', cofre: 'midia/pecas/cofre.jpg' };
  var catalogo = { pecas: {}, lido: false };
  function tipoDeId(s) {
    var n = U.normalizar(String(s || '')).replace(/[^a-z]/g, '');
    if (!n) return null;
    if (n.indexOf('casa') === 0) return 'casa';
    for (var i = 0; i < PECAS.length; i++) if (n === PECAS[i].id || n === U.normalizar(PECAS[i].nome).replace(/[^a-z]/g, '')) return PECAS[i].id;
    return null;
  }
  function caminhoMidia(c) {
    if (!c || typeof c !== 'string') return null;
    if (/^(https?:|data:)/.test(c)) return c;
    var i = c.indexOf('midia/pecas/');
    return i !== -1 ? c.slice(i) : 'midia/pecas/' + c.replace(/^\.?\//, '');
  }
  /* grande = o PNG recortado de 512 px (ficha, vitrine, zoom Peça); pequeno = a miniatura do canto da peça */
  function imagemDe(tipo, grande) {
    var c = catalogo.pecas[tipo];
    if (c && grande && c.png) return c.png;
    if (c && (c.mini || c.png)) return c.mini || c.png;
    return CORPO_PADRAO[tipo] || '';
  }
  function clipeDe(tipo) { var c = catalogo.pecas[tipo]; return c && c.clipe ? c.clipe : null; }
  function carregarCatalogo() {
    if (!window.fetch) return;
    fetch('midia/pecas/pecas.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j) return;
      var lista = Array.isArray(j) ? j : (j.pecas || j.itens || []);
      lista.forEach(function (e) {
        if (!e) return;
        var t = tipoDeId(e.id || e.slug || e.tipo || e.nome);
        if (!t) return;
        var arq = e.arquivos || {};
        catalogo.pecas[t] = { id: e.id || t, png: caminhoMidia(e.png || arq.png || e.imagem || e.recorte || null), mini: caminhoMidia(e.mini || arq.mini || null), clipe: caminhoMidia(e.clipe || arq.clipe || null), nome: e.nome || null };
      });
      catalogo.lido = true;
      carregarScriptPecas();
      redesenharSeAberta();
    }).catch(function () { /* sem catálogo: ficam as peças prontas copiadas de docs/design/assets/visao */ });
  }
  function carregarScriptPecas() {
    if (BC.pecas || !window.fetch || document.querySelector('script[data-mq-pecas]')) return;
    fetch('midia/pecas/pecas.js', { method: 'HEAD', cache: 'no-store' }).then(function (r) {
      if (!r.ok || BC.pecas) return;
      var s = document.createElement('script');
      s.src = 'midia/pecas/pecas.js'; s.setAttribute('data-mq-pecas', '1');
      s.onload = function () { if (BC.pecas && typeof BC.pecas.carregar === 'function') { try { Promise.resolve(BC.pecas.carregar()).then(redesenharSeAberta, function () { /* segue */ }); } catch (e) { /* segue */ } } redesenharSeAberta(); };
      document.head.appendChild(s);
    }).catch(function () { /* segue sem o 3D */ });
  }

  /* ================================================================== a máquina de exemplo */
  var QUEM_EXEMPLO = {
    ana: { nome: 'Ana', empresa: 'Clínica Vida', papel: 'atendente' },
    outra: { nome: 'Beto', empresa: 'Clínica Sorriso', papel: 'atendente' }
  };
  /* no app real o teste usa duas pessoas de teste neutras (nunca gente inventada com nome de cliente) */
  var QUEM_REAL = {
    ana: { nome: 'Pessoa A', empresa: 'empresa A', papel: 'teste' },
    outra: { nome: 'Pessoa B', empresa: 'empresa B', papel: 'teste' }
  };
  function QM() { return real() ? QUEM_REAL : QUEM_EXEMPLO; }
  var EXEMPLO = 'Clínicas (exemplo)'; /* sem projeto na equipe: a máquina de exemplo mostra como fica (só no protótipo puro) */
  var DOMINIOS = { acesso: 'Acesso', cadastro: 'Cadastro', agenda: 'Agenda', novas: 'Peças novas', banco: 'Banco local' };

  /* ================================================================== app real (COOP_REAL sem exemplos): a Máquina de verdade
     Nada de peça, linha do tempo ou pessoa inventada. A máquina de cada projeto vive no estado da equipe
     (estado.maquinas[<projeto>] = { pecas, fios, linha, versao }) e muda só por ação da loja (maquinaPeca, maquinaLigar,
     maquinaPublicar): vai para o diário, as outras Estações e a TV aplicam a mesma coisa, e o agente monta pelo conector
     coop (coop_maquina_*, app/interface/coop-ui.js). O protótipo puro continua com a máquina de exemplo (o roteiro depende dela). */
  function real() { return !!(window.COOP_REAL && !window.COOP_REAL.exemplos); }
  function projetoDe(pjId) { return (L().estado.projetos || []).filter(function (p) { return p.id === pjId; })[0] || null; }
  function nomeMaquina(m) { return m.pj ? m.pj.nome : real() ? 'sem projeto' : EXEMPLO; }
  var TIPOS_REAIS = ['carteiro', 'portaria', 'tela', 'porta', 'gaveta', 'empresa', 'robo', 'deposito', 'cofre', 'cano']; /* as que viram nó no palco */
  var CHAVES = ['cada empresa vê só o seu', 'só o dono', 'todos leem, só o dono muda', '⚠ aberta para todos'];
  function fonteReal(pjId, criar) {
    var e = L().estado;
    if (!e) return null;
    if (!e.maquinas || typeof e.maquinas !== 'object') { if (!criar) return null; e.maquinas = {}; }
    if (!e.maquinas[pjId] && criar) e.maquinas[pjId] = { pecas: [], fios: [], linha: [], versao: 1 };
    return e.maquinas[pjId] || null;
  }
  /* nº real de linhas das gavetas do banco local (BC.maquina.contagem, pela tela do conector): só nesta janela, nunca no diário */
  var contagens = {};
  function contagemDe(pjId, id) { var c = contagens[pjId]; return c && typeof c[id] === 'number' ? c[id] : null; }
  function linhasTxt(n) { return n + (n === 1 ? ' linha' : ' linhas'); }
  /* a peça como fica guardada no estado (só dados; luz, teste e animação são desta janela) */
  var CAMPOS_PECA = ['id', 'tipo', 'nome', 'frase', 'campos', 'chave', 'verbo', 'login', 'quando', 'alvo', 'usa', 'papeis', 'provedor', 'uso', 'usoPct', 'linhas', 'chaves', 'faltando', 'dom', 'por', 'agente', 'assinatura', 'criadaEm', 'publicada', 'publicadaEm', 'dePreset', 'banco', 'estacao'];
  function pecaParaEstado(p) {
    var r = {};
    CAMPOS_PECA.forEach(function (k) { if (p[k] !== undefined && p[k] !== null) r[k] = Array.isArray(p[k]) ? JSON.parse(JSON.stringify(p[k])) : p[k]; });
    return r;
  }
  /* de qual Estação (computador) é o banco de uma peça banco:true; peça antiga, sem o campo, é de quem a montou */
  function donoBanco(p) { return p && p.banco ? (p.estacao || p.por || null) : null; }
  function bancoDaqui(p) { return !!(p && p.banco && donoBanco(p) === L().eu); }
  function seloBanco(p) { return bancoDaqui(p) ? 'no banco local' : 'no banco local de ' + L().nome(donoBanco(p)); }
  /* peça do banco local (banco:true) existe de verdade: entra pronta e com corpo, nunca tracejada */
  function pecaDoEstado(x, animar) {
    var bd = !!x.banco;
    var p = Object.assign({}, x, { pronta: !animar || bd, publicada: !!x.publicada, corpo: x.publicada || bd ? (x.publicadaEm || x.criadaEm || 1) : 0 });
    if (Array.isArray(x.campos)) p.campos = x.campos.slice();
    if (Array.isArray(x.chaves)) p.chaves = x.chaves.map(function (k) { return Object.assign({}, k); });
    if (animar) { p.criadaEm = agora(); p.nova = !bd; p.mudouEm = agora(); if (bd) p.corpo = agora(); }
    if (!p.dom) p.dom = 'novas';
    return p;
  }

  function pecasIniciais(pj) {
    var dono = pj ? pj.membros[0] : 'theus', m2 = pj && pj.membros[1] || 'davi', m3 = pj && pj.membros[2] || 'bruno';
    return [
      { id: 'carteiro', tipo: 'carteiro', nome: 'Carteiro', frase: 'manda os e-mails de acesso da Portaria', provedor: 'remetente padrão', dom: 'acesso', por: dono, alertaTxt: '⚠ padrão: 2 e-mails por hora, só para a equipe' },
      { id: 'portaria', tipo: 'portaria', nome: 'Portaria', frase: 'entra com e-mail e senha', papeis: ['dono', 'atendente'], campos: ['e-mail', 'senha', 'papel (lista: dono, atendente)'], dom: 'acesso', por: dono },
      { id: 'empresa', tipo: 'empresa', nome: 'Empresa', frase: 'tudo aqui dentro é separado por empresa (cada uma vê só o seu)', dom: 'acesso', por: dono },
      { id: 'clinicas', tipo: 'gaveta', nome: 'Clínicas', frase: 'guarda as clínicas', campos: ['nome (texto)', 'cnpj (texto)', 'cidade (texto)', 'plano (lista)'], chave: 'cada empresa vê só o seu', linhas: 4, dom: 'cadastro', por: dono },
      { id: 'pacientes', tipo: 'gaveta', nome: 'Pacientes', frase: 'guarda os pacientes de cada clínica', campos: ['nome (texto)', 'nascimento (data)', 'telefone (texto)', 'clínica (ligação com Clínicas)', 'foto (arquivo no Depósito)'], chave: 'cada empresa vê só o seu', linhas: 20, dom: 'cadastro', por: m2 },
      { id: 'agendamentos', tipo: 'gaveta', nome: 'Agendamentos', frase: 'guarda as consultas marcadas', campos: ['quando (data e hora)', 'paciente (ligação com Pacientes)', 'status (lista: marcado, feito, faltou)', 'obs (texto)'], chave: 'cada empresa vê só o seu', linhas: 50, dom: 'agenda', por: m3 },
      { id: 'porta-novo', tipo: 'porta', nome: 'novo agendamento', frase: 'recebe paciente e horário e grava na gaveta Agendamentos', campos: ['paciente', 'quando'], verbo: 'RECEBE', login: true, dom: 'agenda', por: m2 },
      { id: 'porta-listar', tipo: 'porta', nome: 'listar agendamentos', frase: 'devolve os agendamentos do dia da clínica', campos: ['dia'], verbo: 'DEVOLVE', login: true, dom: 'agenda', por: m2 },
      { id: 'robo-zap', tipo: 'robo', nome: 'aviso no WhatsApp', frase: 'quando entra um Agendamento, manda a confirmação no WhatsApp', quando: 'quando entra', alvo: 'agendamentos', usa: ['ZAPI_TOKEN'], dom: 'agenda', por: m3 },
      { id: 'deposito', tipo: 'deposito', nome: 'fotos', frase: 'guarda as fotos dos pacientes', uso: '1,2 GB', usoPct: 24, dom: 'cadastro', por: m2 },
      { id: 'tela-agenda', tipo: 'tela', nome: 'Agenda', frase: 'a tela Agenda usa as portas "novo" e "listar"', dom: 'agenda', por: m3 },
      { id: 'cano', tipo: 'cano', nome: 'ao vivo', frase: 'cada mudança em Agendamentos avisa a tela na hora', dom: 'agenda', por: m3 },
      { id: 'cofre', tipo: 'cofre', nome: 'Cofre', frase: 'as senhas das integrações (só os nomes)', chaves: [{ nome: 'BANCO_URL', ok: true }, { nome: 'BANCO_CHAVE', ok: true }, { nome: 'ZAPI_TOKEN', ok: false }], faltando: ['ZAPI_TOKEN'], dom: 'acesso', por: dono }
    ].map(function (p) { return Object.assign({ pronta: true, publicada: true, corpo: 0 }, p); });
  }
  var FIOS = [['portaria', 'carteiro'], ['portaria', 'tela-agenda'], ['portaria', 'empresa'], ['clinicas', 'pacientes'], ['pacientes', 'agendamentos'], ['tela-agenda', 'porta-novo'], ['tela-agenda', 'porta-listar'], ['porta-novo', 'agendamentos'], ['porta-listar', 'agendamentos'], ['agendamentos', 'robo-zap'], ['agendamentos', 'cano'], ['pacientes', 'deposito'], ['cano', 'tela-agenda']];

  function maquinaDe(pjId) {
    var m = M.maquinas[pjId];
    if (m) return m;
    var pj = projetoDe(pjId), eReal = real();
    var src = eReal ? fonteReal(pjId, true) : null;
    m = M.maquinas[pjId] = {
      id: pjId, pj: pj, pecas: eReal ? src.pecas.map(function (x) { return pecaDoEstado(x, false); }) : pecasIniciais(pj), fios: eReal ? src.fios.map(function (f) { return [f[0], f[1]]; }) : FIOS.slice(),
      linha: eReal ? src.linha : [], sel: null, ambiente: 'local', teste: null, mudancas: [], porPessoa: false, modo: 'ver',
      zoom: 'dominio', dominio: null, painel: 'ficha', tipoSel: null, versao: eReal ? src.versao || 1 : 1, rev: 1, pontos: [], chavesPontos: {}, fioLuz: {}, fioNasce: {}, cacheD: {}, escala: {}, tam: {},
      testeComo: 'as-duas', testePorta: null, fichaAberta: false, rolagem: {}, okAna: null, okOutra: null, funcionandoAss: null, funcionandoEm: 0, real: eReal
    };
    if (eReal) { m.mudancas = m.pecas.filter(function (p) { return !p.publicada; }).map(function (p) { return 'Cria ' + (TIPOS[p.tipo] || 'peça') + ' "' + p.nome + '"'; }); return m; }
    var t = agora(), ag = pj ? ((L().pessoa(pj.membros[0]) || {}).agentes || [])[0] : null;
    m.linha = [{ ts: t - 3 * U.HORA, texto: (ag ? ag.nome : 'Rita') + ' criou a gaveta Pacientes', quem: pj ? pj.membros[0] : 'theus', peca: 'pacientes' }, { ts: t - 170 * U.MIN, texto: 'fechou Pacientes por empresa', quem: pj ? pj.membros[0] : 'theus', peca: 'pacientes' }, { ts: t - 2 * U.HORA, texto: 'Dev criou a porta "novo agendamento"', quem: pj ? pj.membros[1] || pj.membros[0] : 'davi', peca: 'porta-novo' }, { ts: t - 40 * U.MIN, texto: 'Bruno-bot ligou o robô do WhatsApp', quem: pj ? pj.membros[2] || pj.membros[0] : 'bruno', peca: 'robo-zap' }];
    return m;
  }
  function peca(m, id) { return m.pecas.filter(function (p) { return p.id === id; })[0]; }
  function chaveFio(a, b) { return a + '__' + b; }
  function domFio(k) { return 'mqf-' + String(k).replace(/[^\w-]/g, '_'); }
  function achaFio(m, a, b) {
    for (var i = 0; i < m.fios.length; i++) {
      if (m.fios[i][0] === a && m.fios[i][1] === b) return { chave: chaveFio(a, b), rev: false };
      if (m.fios[i][0] === b && m.fios[i][1] === a) return { chave: chaveFio(b, a), rev: true };
    }
    return null;
  }
  function tipoFio(m, f) {
    var a = peca(m, f[0]), b = peca(m, f[1]);
    if (!a || !b) return 'fluxo';
    if (a.tipo === 'gaveta' && b.tipo === 'gaveta') return 'relacao';
    if (b.tipo === 'empresa' || b.tipo === 'deposito' || b.tipo === 'carteiro' || a.tipo === 'cofre' || b.tipo === 'cofre') return 'referencia';
    if (a.tipo === 'cano' && b.tipo === 'tela') return 'dado';
    return 'fluxo';
  }
  function naBandeja(m, p) { return p.tipo === 'gaveta' && !!peca(m, 'empresa') && /empresa/i.test(p.chave || '') && !/⚠/.test(p.chave || ''); }
  function verboDe(p) { return p.verbo || (/listar|lista|devolve|busca|consulta/i.test(p.nome) ? 'DEVOLVE' : 'RECEBE'); }
  function alertaDe(m, p) {
    if (p.tipo === 'gaveta' && /⚠/.test(p.chave || '')) return '⚠ aberta para todos';
    if (p.tipo === 'cofre' && p.faltando && p.faltando.length) return '⚠ chave faltando: ' + p.faltando.join(', ');
    if (p.tipo === 'porta' && p.login === false) return '⚠ sem checagem de login';
    if (p.alertaTxt) return p.alertaTxt;
    return '';
  }
  function suja(p) { return !!(p.testadaEm && p.mudouEm && p.mudouEm > p.testadaEm); }
  function nomeDom(d) { return DOMINIOS[d] || d || 'Peças'; }
  /* a "assinatura" do conteúdo: pontos e "funcionando" valem para o que a máquina É, não para quantas vezes se testa */
  function assinatura(m) {
    var s = m.pecas.map(function (p) { return p.id + ':' + (p.chave || '') + ':' + (p.pronta ? 1 : 0) + ':' + (p.login === false ? 0 : 1); }).join('|') + '#' + m.fios.map(function (f) { return f[0] + '>' + f[1]; }).join('|');
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }

  /* ================================================================== organismo: som, faíscas, luz (BC.organismo quando existe) */
  function org() { return BC.organismo && BC.organismo.versao ? BC.organismo : null; }
  function semMovimento() {
    var o = org();
    if (o && typeof o.semMovimento === 'function') { try { return o.semMovimento(); } catch (e) { /* segue */ } }
    return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function passo(ms) { return semMovimento() ? Math.min(ms, 220) : ms; }
  function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  var SONS = { tique: [[880, 0.08]], duas: [[660, 0.16], [880, 0.2]], tres: [[523, 0.12], [659, 0.12], [784, 0.2]], erro: [[311, 0.12], [233, 0.2]] };
  var audio = null;
  function tocar(nome) {
    var o = org();
    if (o && typeof o.som === 'function') { try { o.som(nome); } catch (e) { /* segue */ } return; }
    /* reserva no protótipo puro: mesmo desenho do organismo, ganho baixo, só depois de um gesto, nunca na TV */
    try {
      if (/^#?(tv|ipad)/.test(location.hash) || localStorage.getItem('babel-coop:som') === '0') return;
      if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC || !SONS[nome]) return;
      audio = audio || new AC();
      var t0 = audio.currentTime + 0.01, off = 0;
      SONS[nome].forEach(function (n) {
        var os = audio.createOscillator(), g = audio.createGain();
        os.type = nome === 'erro' ? 'triangle' : 'sine'; os.frequency.value = n[0];
        g.gain.setValueAtTime(0, t0 + off); g.gain.linearRampToValueAtTime(0.05, t0 + off + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + off + n[1]);
        os.connect(g); g.connect(audio.destination); os.start(t0 + off); os.stop(t0 + off + n[1] + 0.03);
        off += n[1] * 0.8;
      });
    } catch (e) { /* sem som, a luz continua */ }
  }

  /* camada de efeitos fora do conteúdo (os redesenhos da Estação não a apagam) */
  var fx = null, faiscasVivas = 0;
  function camadaFx() {
    if (fx && fx.isConnected) return fx;
    if (!document.body) return null;
    fx = document.createElement('div');
    fx.className = 'mq-fx';
    fx.setAttribute('aria-hidden', 'true');
    document.body.appendChild(fx);
    return fx;
  }
  var CORES = { ok: ['var(--ok)', 'var(--ok)'], alarme: ['var(--alarme)', 'var(--alarme)'], atencao: ['var(--atencao)', 'var(--atencao)'], marca: ['var(--t2)', 'var(--t0)'], t0: ['var(--t0)', 'var(--t0)'] };
  function faiscasNoPonto(x, y, n, cor, forte) {
    if (semMovimento()) return 0;
    /* com o organismo (app), as faíscas passam pela tela única dele enquanto houver vaga (teto de 2 efeitos, 24 partículas na tela);
       sem vaga ou sem organismo, a camada da Máquina desenha, dividindo o mesmo teto de 24 */
    var o = org(), vivosOrg = 0;
    if (o && typeof o.faiscas === 'function') {
      try { vivosOrg = typeof o.vivos === 'function' ? o.vivos() : 0; } catch (e) { vivosOrg = 0; }
      if (vivosOrg < 2) { try { if (o.faiscas({ x: x, y: y }, n, !!forte, { cor: cor })) return n; } catch (e) { /* cai para a camada daqui */ } }
    }
    var cam = camadaFx();
    if (!cam) return 0;
    n = Math.max(0, Math.min(n, (vivosOrg ? 12 : 24) - faiscasVivas));
    var cs = CORES[cor] || CORES.marca;
    for (var i = 0; i < n; i++) {
      var s = document.createElement('i'), ang = -Math.PI / 2 + (Math.random() - 0.5) * (forte ? 2.2 : 1.6), dist = (forte ? 30 : 20) + Math.random() * (forte ? 34 : 22);
      s.className = 'mq-faisca';
      s.style.left = x + 'px'; s.style.top = y + 'px';
      s.style.setProperty('--dx', Math.round(Math.cos(ang) * dist) + 'px');
      s.style.setProperty('--dy', Math.round(Math.sin(ang) * dist) + 'px');
      s.style.setProperty('--c', cs[i % 2]);
      cam.appendChild(s);
      faiscasVivas++;
      setTimeout(function (el) { return function () { if (el.parentNode) el.parentNode.removeChild(el); faiscasVivas = Math.max(0, faiscasVivas - 1); }; }(s), 950);
    }
    return n;
  }
  function centroDe(el) { if (!el || !el.isConnected) return null; var r = el.getBoundingClientRect(); if (!r.width && !r.height) return null; return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
  function noEl(id) { return document.querySelector('.mq2 [data-no="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]'); }
  function faiscasNaPeca(id, n, cor, forte) {
    var el = noEl(id);
    if (!el) return;
    var pinos = document.querySelectorAll('.mq2 .mq-pinos circle[data-de="' + id + '"], .mq2 .mq-pinos circle[data-para="' + id + '"]');
    if (pinos.length) {
      var cada = Math.max(1, Math.round(n / Math.min(pinos.length, 3)));
      Array.prototype.slice.call(pinos, 0, 3).forEach(function (c) { var p = centroDe(c); if (p) faiscasNoPonto(p.x, p.y, cada, cor, forte); });
      return;
    }
    var r = el.getBoundingClientRect();
    faiscasNoPonto(r.left + r.width / 2, r.top + 6, n, cor, forte);
  }
  function mostrarPontos(pts, origem, id) {
    var cam = camadaFx(), el = id ? noEl(id) : document.querySelector('.mq2 .mq-palco');
    if (!cam || !el) return;
    var r = el.getBoundingClientRect(), d = document.createElement('div'), pal = document.querySelector('.mq2 .mq-palco'), rp = pal ? pal.getBoundingClientRect() : null;
    if (id && rp && (r.bottom < rp.top + 20 || r.top > rp.bottom - 20)) { id = null; r = rp; }
    d.className = 'mq-ganho' + (semMovimento() ? ' parado' : '');
    d.innerHTML = '<b>+' + pts + '</b> ' + esc(origem);
    d.style.left = Math.round(r.left + r.width / 2) + 'px';
    d.style.top = Math.round(id ? r.top - 6 : r.top + r.height - 70) + 'px';
    cam.appendChild(d);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 2300);
  }

  /* pontos com origem (REGUA §3): teste +6 · barrado +2 · Máquina funcionando +12 · nó encaixado +1. Nunca repetidos para a mesma máquina. */
  function pontuar(m, pts, origem, chave, noId) {
    if (m.chavesPontos[chave]) return false;
    var ev = { pts: pts, origem: origem, chave: chave, t: agora(), pj: m.id };
    m.chavesPontos[chave] = true;
    m.pontos.unshift(ev);
    if (m.pontos.length > 40) m.pontos.length = 40;
    mostrarPontos(pts, origem, noId);
    var P = BC.placar, fn = P && (P.ganhar || P.somarEvento || P.registrarEvento);
    if (typeof fn === 'function') { try { fn.call(P, { chave: 'maquina:' + chave, pts: pts, origem: 'Máquina · ' + origem, tipo: 'maquina', t: ev.t }); } catch (e) { /* o placar é de outra peça */ } }
    avisar({ tipo: 'pontos', pj: m.id, pts: pts, origem: origem });
    return true;
  }
  function pontosHoje(m) { var d = new Date(); d.setHours(0, 0, 0, 0); return m.pontos.filter(function (p) { return p.t >= d.getTime(); }).reduce(function (s, p) { return s + p.pts; }, 0); }

  function acender(p, cor, mv) { p.luz = { cor: cor, t: agora(), mv: mv || 6000 }; }
  function luzAttrs(l, extra) {
    if (!l) return '';
    var idade = agora() - l.t;
    if (idade > l.mv * 7) return '';
    var v = Math.pow(2, -idade / l.mv);
    if (semMovimento()) v = v > 0.6 ? 1 : v > 0.2 ? 0.35 : 0; /* três degraus, sem transição */
    return ' data-luz-t="' + l.t + '" data-luz-mv="' + l.mv + '" data-luz-cor="' + l.cor + '" style="--luz:' + v.toFixed(3) + ';' + (extra || '') + '"';
  }
  var relogio = null;
  function passoLuz() {
    var els = document.querySelectorAll('.mq2 [data-luz-t]'), t = agora(), vivos = 0, red = semMovimento();
    for (var i = 0; i < els.length; i++) {
      var el = els[i], l = Math.pow(2, -(t - +el.getAttribute('data-luz-t')) / (+el.getAttribute('data-luz-mv') || 6000));
      if (l < 0.02) l = 0; else vivos++;
      if (red) l = l > 0.6 ? 1 : l > 0.2 ? 0.35 : 0;
      el.style.setProperty('--luz', l.toFixed(3));
    }
    if (!vivos && relogio) { clearInterval(relogio); relogio = null; }
  }
  function garantirRelogio() { if (!document.querySelector('.mq2 [data-luz-t]')) return; if (!relogio) relogio = setInterval(passoLuz, 250); }

  /* ================================================================== o pulso: um ponto com rastro que corre pelo fio de verdade */
  var pulsos = [], lacoVivo = false, seqPulso = 0;
  function criarPonto(p) {
    var cam = camadaFx();
    if (!cam) return null;
    var d = document.createElement('div');
    d.className = 'mq-ponto ' + p.cor;
    d.innerHTML = '<i></i><i></i><i></i><i></i>';
    cam.appendChild(d);
    return d;
  }
  function tirarPonto(p) { if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el); p.el = null; }
  function suave(k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function desenharPonto(p, t, rp) {
    var path = document.getElementById(domFio(p.chave)) || (p.dom ? document.getElementById(domFio(p.dom)) : null);
    if (!p.el) p.el = criarPonto(p);
    if (!p.el) return;
    if (!path || !rp || document.hidden || !path.getTotalLength) { p.el.style.opacity = '0'; return; }
    var svg = path.ownerSVGElement, rs = svg.getBoundingClientRect(), vb = svg.viewBox && svg.viewBox.baseVal;
    var sx = vb && vb.width ? rs.width / vb.width : 1, sy = vb && vb.height ? rs.height / vb.height : 1;
    var len = path.getTotalLength(), k = Math.min(1, Math.max(0, (t - p.t0) / p.dur)), e = suave(k);
    var rev = path.id === domFio(p.chave) ? p.rev : p.revDom;
    var sc = p.morre && k > 0.82 ? Math.max(0, (1 - k) / 0.18) : 1;
    var filhos = p.el.children, dentro = true;
    for (var j = 0; j < filhos.length; j++) {
      var s = (rev ? 1 - e : e) * len + (rev ? 1 : -1) * j * 7;
      s = Math.max(0, Math.min(len, s));
      var pt = path.getPointAtLength(s), x = rs.left + pt.x * sx, y = rs.top + pt.y * sy;
      if (j === 0) dentro = x >= rp.left - 4 && x <= rp.right + 4 && y >= rp.top - 4 && y <= rp.bottom + 4;
      filhos[j].style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + (j === 0 ? sc : sc * (1 - j * 0.18)).toFixed(3) + ')';
    }
    p.el.style.opacity = dentro ? '1' : '0';
  }
  function quadro(t) {
    if (!pulsos.length) { lacoVivo = false; return; }
    var palco = document.querySelector('.mq2 .mq-palco'), rp = palco ? palco.getBoundingClientRect() : null;
    pulsos.forEach(function (p) { desenharPonto(p, t, rp); });
    requestAnimationFrame(quadro);
  }
  function garantirLaco() { if (lacoVivo) return; lacoVivo = true; requestAnimationFrame(quadro); }
  function pulsar(m, de, para, cor, op) {
    op = op || {};
    var f = achaFio(m, de, para);
    if (!f) return esperar(passo(200));
    m.fioLuz[f.chave] = { cor: cor, t: agora(), mv: 6000 };
    var el = document.getElementById(domFio(f.chave)), len = 240;
    try { if (el && el.getTotalLength) len = el.getTotalLength(); } catch (e) { len = 240; }
    var dur = Math.round(Math.max(380, Math.min(760, 360 + len * 0.7)));
    redesenhar();
    if (semMovimento()) return esperar(passo(dur));
    var pa = peca(m, de), pb = peca(m, para), da = pa && pa.dom, db = pb && pb.dom;
    var p = { id: ++seqPulso, chave: f.chave, rev: f.rev, cor: cor, t0: performance.now(), dur: dur, morre: !!op.morre, dom: da && db && da !== db ? 'dom:' + da + '__dom:' + db : null, revDom: false };
    if (p.dom && !document.getElementById(domFio(p.dom))) { p.dom = 'dom:' + db + '__dom:' + da; p.revDom = true; }
    pulsos.push(p);
    garantirLaco();
    return esperar(dur).then(function () { var i = pulsos.indexOf(p); if (i >= 0) pulsos.splice(i, 1); tirarPonto(p); });
  }

  /* ================================================================== redesenho e o gancho depois de cada desenho */
  function abaMaquina() { try { var t = BC.estacao.abaAtual(); return t && t.tipo === 'maquina' ? t : null; } catch (e) { return null; } }
  function mAtual() { var t = abaMaquina(); return t ? maquinaDe(t.ref) : null; }
  function redesenhar() {
    if (!BC.estacao || !BC.estacao.render) return;
    var v = document.getElementById('vista-estacao');
    if (!v || v.hidden) return;
    BC.estacao.render();
    aposDesenho();
  }
  function redesenharSeAberta() { if (abaMaquina()) redesenhar(); }

  function caixa(el, mesa) {
    if (!el.offsetParent) return null;
    var x = 0, y = 0, e = el;
    while (e && e !== mesa) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    if (e !== mesa) return null;
    return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight, col: +(el.getAttribute('data-col') || 0), el: el };
  }
  function pinoY(c) { return c.y + Math.min(c.h / 2, 22); }
  function rota(a, b, fundo, todas) {
    var x0, y0, x1, y1, d;
    if (a.col < b.col) {
      x0 = a.x + a.w; y0 = pinoY(a); x1 = b.x; y1 = pinoY(b);
      var dx = Math.max(22, (x1 - x0) * 0.5);
      d = 'M' + x0 + ' ' + y0 + ' C' + (x0 + dx) + ' ' + y0 + ' ' + (x1 - dx) + ' ' + y1 + ' ' + x1 + ' ' + y1;
    } else if (a.col > b.col) {
      /* volta por baixo de tudo: cano → tela, como um cano de retorno */
      x0 = a.x + a.w / 2; y0 = a.y + a.h; x1 = b.x + b.w / 2; y1 = b.y + b.h;
      var yb = fundo + 22, r = 12;
      d = 'M' + x0 + ' ' + y0 + ' L' + x0 + ' ' + (yb - r) + ' Q' + x0 + ' ' + yb + ' ' + (x0 - r) + ' ' + yb + ' L' + (x1 + r) + ' ' + yb + ' Q' + x1 + ' ' + yb + ' ' + x1 + ' ' + (yb - r) + ' L' + x1 + ' ' + y1;
    } else {
      var cima = a.y <= b.y, entre = todas.some(function (c) { return c !== a && c !== b && c.col === a.col && c.y > Math.min(a.y, b.y) && c.y < Math.max(a.y, b.y); });
      if (!entre) {
        x0 = a.x + a.w / 2; y0 = cima ? a.y + a.h : a.y; x1 = b.x + b.w / 2; y1 = cima ? b.y : b.y + b.h;
        var dy = (y1 - y0) / 2;
        d = 'M' + x0 + ' ' + y0 + ' C' + x0 + ' ' + (y0 + dy) + ' ' + x1 + ' ' + (y1 - dy) + ' ' + x1 + ' ' + y1;
      } else {
        x0 = a.x; y0 = pinoY(a); x1 = b.x; y1 = pinoY(b);
        var xl = Math.min(a.x, b.x) - 20;
        d = 'M' + x0 + ' ' + y0 + ' C' + xl + ' ' + y0 + ' ' + xl + ' ' + y1 + ' ' + x1 + ' ' + y1;
      }
    }
    return { d: d, x0: x0, y0: y0, x1: x1, y1: y1 };
  }
  function desenharFios(m, raiz) {
    var mesa = raiz.querySelector('.mq-mesa'), svg = mesa && mesa.querySelector('.mq-fios'), pinos = mesa && mesa.querySelector('.mq-pinos');
    if (!svg) return;
    var W = mesa.offsetWidth, H = mesa.offsetHeight;
    [svg, pinos].forEach(function (s) { if (!s) return; s.setAttribute('viewBox', '0 0 ' + W + ' ' + H); s.setAttribute('width', W); s.setAttribute('height', H); });
    var cx = {}, todas = [], fundo = 0;
    mesa.querySelectorAll('[data-no]').forEach(function (el) { var c = caixa(el, mesa); if (!c) return; cx[el.getAttribute('data-no')] = c; todas.push(c); fundo = Math.max(fundo, c.y + c.h); });
    var circ = [];
    svg.querySelectorAll('path.mq-fio[data-de]').forEach(function (path) {
      var a = cx[path.getAttribute('data-de')], b = cx[path.getAttribute('data-para')];
      if (!a || !b) { path.setAttribute('d', ''); return; }
      var r = rota(a, b, fundo, todas), k = path.getAttribute('data-k');
      path.setAttribute('d', r.d);
      if (k) m.cacheD[k] = r.d;
      var L0 = 0;
      try { L0 = path.getTotalLength(); } catch (e) { L0 = 0; }
      if (path.classList.contains('nasce')) path.style.setProperty('--L', Math.ceil(L0));
      var los = svg.querySelector('path.mq-losango[data-k="' + k + '"]');
      if (los && L0 > 8) {
        /* no banco o fio sai da filha (a tabela com a ligação) para a mãe: a ponta "muitos" é o começo do fio */
        var fa = peca(m, path.getAttribute('data-de')), fb = peca(m, path.getAttribute('data-para')), ini = !!(fa && fb && fa.banco && fb.banco);
        var p1 = path.getPointAtLength(ini ? 0 : L0), p0 = path.getPointAtLength(ini ? 6 : L0 - 6), ux = p1.x - p0.x, uy = p1.y - p0.y, n = Math.sqrt(ux * ux + uy * uy) || 1;
        ux /= n; uy /= n;
        var bx = p1.x - ux * 8, by = p1.y - uy * 8, mx = p1.x - ux * 4, my = p1.y - uy * 4;
        los.setAttribute('d', 'M' + p1.x + ' ' + p1.y + ' L' + (mx - uy * 3.2) + ' ' + (my + ux * 3.2) + ' L' + bx + ' ' + by + ' L' + (mx + uy * 3.2) + ' ' + (my - ux * 3.2) + 'Z');
      }
      if (!path.classList.contains('referencia') && a.el.getAttribute('data-pronta') !== '0') circ.push('<circle class="mq-pino" data-de="' + esc(path.getAttribute('data-de')) + '" cx="' + r.x0 + '" cy="' + r.y0 + '" r="3"/>');
      if (!path.classList.contains('referencia') && b.el.getAttribute('data-pronta') !== '0') circ.push('<circle class="mq-pino" data-para="' + esc(path.getAttribute('data-para')) + '" cx="' + r.x1 + '" cy="' + r.y1 + '" r="3"/>');
      var bolha = mesa.querySelector('.mq-bolha[data-k="' + k + '"]');
      if (bolha && L0) { var pm = path.getPointAtLength(L0 / 2); bolha.style.left = Math.round(pm.x) + 'px'; bolha.style.top = Math.round(pm.y) + 'px'; }
    });
    if (pinos) pinos.innerHTML = circ.join('');
  }
  function ajustarEscala(m, raiz) {
    var palco = raiz.querySelector('.mq-palco'), escala = raiz.querySelector('.mq-escala'), mesa = raiz.querySelector('.mq-mesa');
    if (!palco || !escala || !mesa) return;
    var pw = palco.clientWidth - 20, ph = palco.clientHeight - 16, mw = mesa.offsetWidth, mh = mesa.offsetHeight;
    if (!mw || !mh || pw < 40) return;
    var k = Math.min(1.2, pw / mw, Math.max(ph / mh, 0.82));
    k = Math.max(0.62, Math.round(k * 1000) / 1000);
    m.escala[m.zoom] = k; m.tam[m.zoom] = [mw, mh];
    mesa.style.transform = 'scale(' + k + ')';
    escala.style.width = Math.ceil(mw * k) + 'px';
    escala.style.height = Math.ceil(mh * k) + 'px';
  }
  function aposDesenho() {
    var c = document.getElementById('e-conteudo'), raiz = c && c.querySelector('.mq2');
    if (!raiz) return;
    var m = M.maquinas[raiz.getAttribute('data-pj')];
    if (!m) return;
    ajustarEscala(m, raiz);
    desenharFios(m, raiz);
    var palco = raiz.querySelector('.mq-palco'), r = m.rolagem[m.zoom];
    if (palco && r) { palco.scrollLeft = r[0]; palco.scrollTop = r[1]; }
    garantirRelogio();
  }
  function ligarGanchos() {
    var c = document.getElementById('e-conteudo');
    if (!c || c.getAttribute('data-mq-gancho')) return;
    c.setAttribute('data-mq-gancho', '1');
    if (window.MutationObserver) new MutationObserver(function () { aposDesenho(); }).observe(c, { childList: true });
    if (window.ResizeObserver) new ResizeObserver(function () { aposDesenho(); }).observe(c);
    /* o palco rola por dentro: a posição sobrevive aos redesenhos da Estação */
    c.addEventListener('scroll', function (ev) {
      var t = ev.target;
      if (!t || !t.classList || !t.classList.contains('mq-palco')) return;
      var raiz = t.closest('.mq2'), m = raiz && M.maquinas[raiz.getAttribute('data-pj')];
      if (m) m.rolagem[m.zoom] = [t.scrollLeft, t.scrollTop];
    }, true);
    /* duplo clique numa peça = ver de perto (a terceira altura do zoom) */
    c.addEventListener('dblclick', function (ev) {
      var el = ev.target.closest && ev.target.closest('.mq2 .mq-peca[data-no]');
      var m = mAtual();
      if (!el || !m) return;
      m.sel = el.getAttribute('data-no'); m.zoom = 'peca'; m.painel = 'ficha'; m.fichaAberta = true;
      redesenhar();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ligarGanchos); else ligarGanchos();
  document.addEventListener('visibilitychange', function () { if (document.hidden) pulsos.forEach(function (p) { if (p.el) p.el.style.opacity = '0'; }); });

  /* ================================================================== montar: o agente constrói e a peça entra tracejada */
  function entrar(m, p, texto, quem, fiosNovos) {
    var t = agora();
    Object.assign(p, { criadaEm: t, pronta: false, publicada: false, corpo: 0, mudouEm: t, nova: true });
    if (!p.dom) p.dom = 'novas';
    m.pecas.push(p);
    var fiosFeitos = [];
    (fiosNovos || []).forEach(function (f) { if (peca(m, f[0]) && peca(m, f[1]) && !achaFio(m, f[0], f[1])) { m.fios.push([f[0], f[1]]); m.fioNasce[chaveFio(f[0], f[1])] = t; fiosFeitos.push([f[0], f[1]]); } });
    m.rev++;
    /* app real: a peça vai para o estado da equipe (diário); a linha do tempo é a do estado, a ação escreve nela */
    if (m.real) L().fazer('maquinaPeca', { projeto: m.id, peca: pecaParaEstado(p), fios: fiosFeitos, texto: texto });
    else m.linha.push({ ts: t, texto: texto, quem: quem || L().eu, peca: p.id });
    avisar({ tipo: 'encaixou', pj: m.id, peca: p.id, nome: p.nome, tipoPeca: p.tipo });
    return p;
  }
  /* rola só o palco (nunca a página) até a peça ficar à vista */
  function mostrarNoPalco(m, id) {
    var el = noEl(id), pal = document.querySelector('.mq2 .mq-palco');
    if (!el || !pal) return;
    var r = el.getBoundingClientRect(), rp = pal.getBoundingClientRect();
    if (r.bottom > rp.bottom - 12) pal.scrollTop += r.bottom - rp.bottom + 24;
    else if (r.top < rp.top + 12) pal.scrollTop -= rp.top - r.top + 24;
    if (r.right > rp.right - 12) pal.scrollLeft += r.right - rp.right + 24;
    else if (r.left < rp.left + 12) pal.scrollLeft -= rp.left - r.left + 24;
    m.rolagem[m.zoom] = [pal.scrollLeft, pal.scrollTop];
  }
  function ficouPronta(m, p) {
    if (!p || p.pronta) return;
    p.pronta = true; p.nova = false; p.mudouEm = agora();
    acender(p, 'marca', 6000);
    m.rev++;
    redesenhar();
    mostrarNoPalco(m, p.id);
    faiscasNaPeca(p.id, 5, 'marca', false);
    tocar('tique');
    pontuar(m, 1, 'nó encaixado · ' + (TIPOS[p.tipo] || 'peça') + ' ' + p.nome, 'encaixe:' + m.id + ':' + p.id, p.id);
  }

  /* app real: o id que não é projeto de verdade (o atalho "clinicas" de Criar) cai no primeiro projeto real, ou no estado vazio */
  function refReal(pjId) { var pjs = L().estado.projetos || []; return projetoDe(pjId) ? pjId : (pjs[0] || {}).id || null; }
  M.abrir = function (pjId) {
    if (real()) pjId = refReal(pjId);
    var pj = projetoDe(pjId);
    /* a aba da Máquina é uma só e abrirAba só troca o título: trocar de projeto troca também a ref dela */
    try { var ja = (ui().abas || []).filter(function (t) { return t.id === 'maquina'; })[0]; if (ja) ja.ref = pjId; } catch (e) { /* a Estação é de outra peça */ }
    BC.estacao.abrirAba({ id: 'maquina', tipo: 'maquina', ref: pjId, titulo: 'Máquina' + (pj ? ' · ' + pj.nome : real() ? '' : ' · ' + EXEMPLO), atividade: 'maquina' });
  };
  M.pedido = function (texto, ag, terminal) {
    ag = ag || { nome: 'o agente' };
    var pjId = (abaMaquina() ? abaMaquina().ref : null) || ui().projetoAtivo || ((L().estado.projetos || [])[0] || {}).id || 'clinicas';
    var mp, n0 = U.normalizar(texto);
    /* presets pelo terminal: "usa o preset Login com empresa" · "salva como preset Agendamento" */
    if ((mp = texto.match(/\b(?:usa|use|usar|aplica|aplique|monta|monte|coloca|coloque)\s+(?:o |a )?preset\s+(.+?)\s*[.!]?$/i))) {
      var alvoN = U.normalizar(mp[1]), pre = (L().estado.presets || []).filter(function (p) { return p.tipo !== 'tela' && (U.normalizar(p.nome) === alvoN || U.normalizar(p.nome).indexOf(alvoN) !== -1); })[0];
      if (!pre) { if (terminal) terminal.escrever('Não achei o preset "' + esc(mp[1]) + '". Os da equipe: ' + (L().estado.presets || []).map(function (p) { return p.nome; }).join(' · '), 'dica'); return; }
      M.abrir(pjId);
      setTimeout(function () { M.usarPreset(maquinaDe(pjId), pre, terminal); }, 200);
      return;
    }
    if ((mp = texto.match(/\b(?:salva|salve|salvar|guarda|guarde|guardar)\s+(?:isso |isto |esta máquina |essa máquina |a máquina )?(?:como )?preset\s*:?\s*(.+?)\s*[.!]?$/i))) {
      var m0 = maquinaDe(pjId), pf0 = pecasParaPreset(m0);
      if (L().fazer('presetSalvar', { tipo: 'backend', nome: mp[1].trim(), descricao: 'Guardado pelo terminal por ' + ag.nome, projeto: m0.pj ? m0.pj.nome : '', pecas: pf0.pecas, fios: pf0.fios })) {
        m0.linha.push({ ts: agora(), texto: ag.nome + ' guardou o preset "' + mp[1].trim() + '"', quem: L().eu });
        if (terminal) terminal.cartao('Preset <b>' + esc(mp[1].trim()) + '</b> guardado com ' + pf0.pecas.length + ' peça(s). Qualquer projeto usa com "usa o preset ' + esc(mp[1].trim()) + '".', null, '');
        M.abrir(pjId); BC.estacao.render();
      }
      return;
    }
    /* "testa como a outra empresa" · "testa a máquina" · "publica" (quando o terminal encaminhar) */
    var criando = /\b(cria|crie|criar|monta|monte|montar|adiciona|adicione|gera|gere|faz|faca)\b/.test(n0);
    if (!criando && /\b(testa|testar|teste como|teste a)\b/.test(n0)) {
      M.abrir(pjId);
      var mt = maquinaDe(pjId), como = /outra empresa|outra clinica|sorriso/.test(n0) ? 'outra' : /como (a )?ana|clinica vida/.test(n0) ? 'ana' : 'as-duas';
      if (terminal) terminal.escrever('⚙ ' + ag.nome + ' testa a Máquina ' + (como === 'outra' ? 'como a outra empresa' : como === 'ana' ? 'como Ana, da Clínica Vida' : 'como Ana e depois como a outra empresa') + ': veja o pulso andar pelos fios.', 'ia', true);
      setTimeout(function () { M.testar(mt, { como: como }); }, 250);
      return;
    }
    if (!criando && /\b(publica|publique|publicar)\b/.test(n0)) {
      M.abrir(pjId);
      var mpb = maquinaDe(pjId);
      mpb.modo = 'publicar'; mpb.painel = 'ficha'; mpb.fichaAberta = true;
      if (terminal) terminal.escrever('⚙ Publicar pede a sua confirmação: digite o nome do projeto no painel da Máquina.', 'ia', true);
      BC.estacao.render();
      return;
    }
    var mliga = texto.match(/\bliga(?:r|e)?\s+(?:a |o )?(.+?)\s+(?:à|a|ao|na|no|com)\s+(?:a |o )?(.+?)\s*[.!]?$/i);
    if (mliga && !criando) { M.abrir(pjId); M.ligar(maquinaDe(pjId), mliga[1], mliga[2], terminal); return; }
    var m = maquinaDe(pjId), nomeM = (texto.match(/(?:gaveta|tabela)\s+(?:de\s+|para\s+|chamada\s+)?([A-Za-zÀ-ú]+)/i) || [])[1] || 'Retornos';
    nomeM = nomeM.charAt(0).toUpperCase() + nomeM.slice(1);
    M.abrir(pjId);
    var base = Date.now().toString(36), novas = [];
    var g = { id: 'g' + base, tipo: 'gaveta', nome: nomeM, frase: 'guarda ' + nomeM.toLowerCase(), dom: nomeM, por: L().eu, campos: ['nome (texto)', 'quando (data e hora)', 'paciente (ligação com Pacientes)'], chave: /empresa|clinica|separad/.test(n0) ? 'cada empresa vê só o seu' : '⚠ aberta para todos', linhas: 0 };
    novas.push({ p: g, fios: peca(m, 'pacientes') ? [['pacientes', g.id]] : [] });
    if (/\b(robo|robô|aviso|lembr|manda|whatsapp|quando)\b/.test(n0)) { var r = { id: 'r' + base, tipo: 'robo', nome: 'lembrete', frase: 'quando entra em ' + nomeM + ', manda o lembrete no WhatsApp', dom: nomeM, por: L().eu, quando: 'quando entra', alvo: g.id, usa: ['ZAPI_TOKEN'] }; novas.push({ p: r, fios: [[g.id, r.id]] }); }
    if (/\b(porta|api|rota|tela|recebe)\b/.test(n0)) { var po = { id: 'p' + base, tipo: 'porta', nome: 'novo ' + nomeM.toLowerCase().replace(/s$/, ''), frase: 'recebe os dados e grava na gaveta ' + nomeM, dom: nomeM, por: L().eu, login: true, verbo: 'RECEBE', campos: ['paciente', 'quando'] }; novas.push({ p: po, fios: [[po.id, g.id]].concat(peca(m, 'tela-agenda') ? [['tela-agenda', po.id]] : []) }); }
    if (terminal) terminal.escrever('⚙ ' + ag.nome + ' está montando o backend: a Máquina abriu no meio e as peças entram tracejadas, uma a uma.', 'ia', true);
    novas.forEach(function (x, i) {
      setTimeout(function () {
        var p = x.p;
        entrar(m, p, ag.nome + (p.tipo === 'gaveta' ? ' criou a gaveta ' + p.nome + (p.chave.indexOf('⚠') === 0 ? ' (aberta: falta a chave)' : ' e fechou por empresa') : p.tipo === 'robo' ? ' ligou o robô "' + p.nome + '"' : ' criou a porta "' + p.nome + '"'), L().eu, x.fios);
        m.mudancas.push(p.tipo === 'gaveta' ? 'Cria a gaveta ' + p.nome + (p.chave.indexOf('⚠') === 0 ? '' : ' fechada por empresa') : p.tipo === 'robo' ? 'Liga o robô "' + p.nome + '"' : 'Cria a porta "' + p.nome + '"');
        redesenhar();
        setTimeout(function () { ficouPronta(m, p); }, 1600);
        if (terminal && i === novas.length - 1) { terminal.cartao(esc(ag.nome) + ' montou ' + novas.length + ' peça(s) na Máquina: ' + esc(novas.map(function (y) { return TIPOS[y.p.tipo] + ' ' + y.p.nome; }).join(', ')) + ' · só o desenho: nenhuma migração foi escrita', null, '<button type="button" class="term-mini" data-acao="pj-maquina" data-id="' + pjId + '">ver</button>'); terminal.mostrar(); }
      }, 700 + i * 1900);
    });
  };
  /* ligar duas peças pelo nome, com a regra em português (uma Tela não grava direto numa Gaveta) */
  M.ligar = function (m, nomeA, nomeB, terminal) {
    function achar(n) { var x = U.normalizar(n).replace(/^(a|o)\s+/, ''); return m.pecas.filter(function (p) { return U.normalizar(p.nome) === x || U.normalizar(TIPOS[p.tipo] + ' ' + p.nome) === x; })[0] || m.pecas.filter(function (p) { return U.normalizar(p.nome).indexOf(x) !== -1 || x.indexOf(U.normalizar(TIPOS[p.tipo] || '')) === 0; })[0]; }
    var a = achar(nomeA), b = achar(nomeB), msg;
    if (!a || !b) msg = 'Não achei ' + (!a ? '"' + nomeA + '"' : '"' + nomeB + '"') + ' nesta Máquina.';
    else if (a.tipo === 'tela' && b.tipo === 'gaveta') msg = 'Uma Tela não grava direto numa Gaveta: passa por uma Porta. Peça "cria uma porta para ' + b.nome + '" e ligue a Tela nela.';
    else if (achaFio(m, a.id, b.id)) msg = TIPOS[a.tipo] + ' "' + a.nome + '" já está ligada a ' + TIPOS[b.tipo] + ' "' + b.nome + '".';
    if (msg) { if (terminal) terminal.escrever(msg, 'dica'); else aviso(msg); return false; }
    m.fios.push([a.id, b.id]); m.fioNasce[chaveFio(a.id, b.id)] = agora(); m.rev++; a.mudouEm = b.mudouEm = agora();
    var txtLiga = 'ligou ' + TIPOS[a.tipo] + ' "' + a.nome + '" a ' + TIPOS[b.tipo] + ' "' + b.nome + '"';
    if (m.real) L().fazer('maquinaLigar', { projeto: m.id, de: a.id, para: b.id, texto: txtLiga });
    else m.linha.push({ ts: agora(), texto: txtLiga, quem: L().eu, peca: a.id });
    m.mudancas.push('Liga ' + TIPOS[a.tipo] + ' "' + a.nome + '" a ' + TIPOS[b.tipo] + ' "' + b.nome + '"');
    acender(a, 't0'); acender(b, 't0');
    redesenhar();
    tocar('tique');
    avisar({ tipo: 'fio', pj: m.id, de: a.id, para: b.id });
    if (terminal) terminal.cartao('Fio novo: <b>' + esc(a.nome) + '</b> → <b>' + esc(b.nome) + '</b>. Teste de novo para ver o pulso passar.', null, '');
    return true;
  };
  var MODELOS = {
    gaveta: function (n) { return { nome: 'Nova gaveta ' + n, frase: 'guarda o que a equipe definir', campos: ['nome (texto)', 'quando (data e hora)'], chave: 'cada empresa vê só o seu', linhas: 0 }; },
    porta: function (n) { return { nome: 'nova porta ' + n, frase: 'recebe um pedido e grava na gaveta Agendamentos', verbo: 'RECEBE', login: true, campos: ['paciente', 'quando'] }; },
    robo: function (n) { return { nome: 'robô ' + n, frase: 'quando entra um Agendamento, faz a tarefa combinada', quando: 'quando entra', alvo: 'agendamentos' }; },
    deposito: function (n) { return { nome: 'arquivos ' + n, frase: 'guarda os arquivos do projeto', uso: 'vazio', usoPct: 0 }; },
    tela: function (n) { return { nome: 'Tela ' + n, frase: 'uma página nova do projeto' }; },
    cano: function (n) { return { nome: 'ao vivo ' + n, frase: 'avisa a tela quando Agendamentos muda' }; }
  };
  /* no app real a peça montada pela vitrine não fala de gaveta que não existe: a frase é neutra até o agente escrever a de verdade */
  var FRASE_REAL = { gaveta: 'guarda o que a equipe definir', porta: 'recebe um pedido e grava numa gaveta', robo: 'faz uma tarefa sozinho quando algo acontece', deposito: 'guarda os arquivos do projeto', tela: 'uma página nova do projeto', cano: 'avisa a tela quando uma gaveta muda' };
  M.montarTipo = function (m, tipo) {
    if (!MODELOS[tipo]) return null;
    var n = m.pecas.filter(function (p) { return p.tipo === tipo; }).length + 1, id = tipo.slice(0, 2) + Date.now().toString(36);
    var p = Object.assign({ id: id, tipo: tipo, dom: 'novas', por: L().eu }, MODELOS[tipo](n));
    if (m.real) { p.frase = FRASE_REAL[tipo]; delete p.alvo; if (tipo === 'gaveta') p.chave = '⚠ aberta para todos'; if (tipo === 'porta') p.campos = ['dados']; }
    var tem = function (x) { return !!peca(m, x); }, fios = [];
    if (tipo === 'porta' && tem('agendamentos')) fios.push([id, 'agendamentos']);
    if (tipo === 'robo' && tem('agendamentos')) fios.push(['agendamentos', id]);
    if (tipo === 'cano' && tem('agendamentos')) fios.push(['agendamentos', id]);
    if (tipo === 'cano' && tem('tela-agenda')) fios.push([id, 'tela-agenda']);
    if (tipo === 'tela' && tem('portaria')) fios.push(['portaria', id]);
    if (tipo === 'deposito' && tem('pacientes')) fios.push(['pacientes', id]);
    entrar(m, p, L().nome(L().eu) + ' montou ' + TIPOS[tipo] + ' "' + p.nome + '" pela vitrine', L().eu, fios);
    m.mudancas.push('Cria ' + TIPOS[tipo] + ' "' + p.nome + '"');
    m.sel = id; m.painel = 'ficha';
    if (m.dominio && m.dominio !== p.dom) m.dominio = null;
    if (m.zoom === 'inteira') { m.zoom = 'dominio'; m.dominio = null; } /* na vista Inteira só aparecem os domínios: a peça nova ficaria escondida */
    redesenhar();
    requestAnimationFrame(function () { mostrarNoPalco(m, id); });
    setTimeout(function () { ficouPronta(m, p); }, 1600);
    return p;
  };

  /* ================================================================== testar: o pedido anda pela máquina */
  var EXEMPLOS = { paciente: 'Maria Souza', quando: 'amanhã 14:30', dia: 'hoje', nome: 'Maria Souza', 'e-mail': 'maria@clinicavida.com.br', usuario: 'ana', senha: 'senha de teste' };
  function portas(m) { return m.pecas.filter(function (p) { return p.tipo === 'porta' && p.pronta; }); }
  function portaPadrao(m) { var ps = portas(m); return (m.testePorta && peca(m, m.testePorta) && peca(m, m.testePorta).pronta ? peca(m, m.testePorta) : null) || (peca(m, 'porta-novo') && peca(m, 'porta-novo').pronta ? peca(m, 'porta-novo') : null) || ps.filter(function (p) { return verboDe(p) === 'RECEBE'; })[0] || ps[0] || null; }
  function camposPorta(p) { return (p.campos && p.campos.length ? p.campos : verboDe(p) === 'DEVOLVE' ? ['dia'] : ['nome', 'quando']).map(function (c) { return String(c).replace(/\s*\(.*$/, ''); }); }
  var EXEMPLOS_REAIS = { quando: 'amanhã 14:30', dia: 'hoje', nome: 'Pessoa de teste', 'e-mail': 'teste@exemplo.com', senha: 'senha de teste' };
  function dadosPadrao(m, p) { var ex = m.real ? EXEMPLOS_REAIS : EXEMPLOS, d = {}; camposPorta(p).forEach(function (c) { d[c] = (m.testeDados && m.testeDados[p.id] && m.testeDados[p.id][c]) || ex[U.normalizar(c)] || ex[c] || 'exemplo'; }); return d; }
  function dadosTexto(d) { return Object.keys(d).map(function (k) { return d[k]; }).join(' · '); }
  function ligadas(m, id, filtro) { return m.fios.filter(function (f) { return f[0] === id; }).map(function (f) { return peca(m, f[1]); }).filter(function (p) { return p && p.pronta && (!filtro || filtro(p)); }); }
  function caminho(m, porta) {
    var portaria = m.pecas.filter(function (p) { return p.tipo === 'portaria' && p.pronta; })[0] || null;
    var telas = m.fios.filter(function (f) { return f[1] === porta.id; }).map(function (f) { return peca(m, f[0]); }).filter(function (p) { return p && p.tipo === 'tela' && p.pronta; });
    var tela = telas[0] || null, grupos = [];
    if (portaria && tela && achaFio(m, portaria.id, tela.id)) grupos.push([[portaria, tela]]);
    if (tela) grupos.push([[tela, porta]]);
    var gav = ligadas(m, porta.id, function (p) { return p.tipo === 'gaveta'; })[0];
    if (gav) {
      grupos.push([[porta, gav]]);
      if (verboDe(porta) === 'RECEBE') {
        var ramos = ligadas(m, gav.id, function (p) { return p.tipo === 'robo' || p.tipo === 'cano'; }).slice(0, 3);
        if (ramos.length) grupos.push(ramos.map(function (r) { return [gav, r]; }));
        var volta = [];
        ramos.filter(function (r) { return r.tipo === 'cano'; }).forEach(function (c) { ligadas(m, c.id, function (p) { return p.tipo === 'tela'; }).slice(0, 1).forEach(function (t) { volta.push([c, t]); }); });
        if (volta.length) grupos.push(volta);
      }
    }
    return { portaria: portaria, tela: tela, gaveta: gav || null, grupos: grupos };
  }
  function registrar(T, texto, cor, pecaId) { T.log.push({ t: agora(), texto: texto, cor: cor || '', peca: pecaId || null, rodada: T.rodada }); }
  function chaveBarra(gav, verbo) {
    var c = gav.chave || '';
    if (/⚠/.test(c)) return false;
    if (/todos leem/.test(c)) return verbo === 'RECEBE';
    return true;
  }
  function narrar(m, T, de, p, quem, porta) {
    var outra = quem === 'outra', d = T.dados, dt = dadosTexto(d);
    switch (p.tipo) {
      case 'tela':
        if (de && de.tipo === 'cano') return outra ? ['⚠ a tela ' + p.nome + ' da ' + QM().ana.empresa + ' recebe um agendamento que é da ' + QM().outra.empresa, '⚠ vazou'] : ['✓ a tela ' + p.nome + ' mostra a consulta nova na hora', '✓ atualizou'];
        return [outra ? 'a tela ' + p.nome + ' envia o mesmo pedido, agora com o crachá da ' + QM().outra.empresa : 'a tela ' + p.nome + ' envia o formulário: ' + dt, 'enviou'];
      case 'porta': return [outra ? 'a porta "' + p.nome + '" recebe e leva até a gaveta' : 'a porta "' + p.nome + '" ' + (verboDe(p) === 'DEVOLVE' ? 'pede ' + dt : 'recebe ' + camposPorta(p).join(' e ')) + ' e confere o login', '1 pedido'];
      case 'gaveta':
        if (outra) return ['⚠ passou: a ' + QM().outra.empresa + ' ' + (verboDe(porta) === 'DEVOLVE' ? 'leu' : 'gravou na') + ' gaveta ' + p.nome + ' da ' + QM().ana.empresa + (/todos leem/.test(p.chave || '') ? ' (todos leem: é de propósito)' : '. A chave está aberta para todos.'), /todos leem/.test(p.chave || '') ? 'leu (de propósito)' : '⚠ vazou'];
        if (verboDe(porta) === 'DEVOLVE') return real() ? ['a gaveta ' + p.nome + ' devolveria as linhas do dia, só as da ' + QM().ana.empresa + ' (simulado: o teste não lê o banco)', 'leu (teste)'] : ['a gaveta ' + p.nome + ' devolve 3 linhas do dia, só as da ' + QM().ana.empresa, '3 linhas'];
        return ['uma linha de teste entra na gaveta ' + p.nome + ' (simulada): ' + dt + ' · marcado ' + (real() ? '(nada é gravado: o teste não escreve no banco)' : '(' + p.linhas + ' → ' + (p.linhas + 1) + ' linhas)'), real() ? '+1 linha (teste)' : '+1 linha'];
      case 'robo':
        var cof = m.pecas.filter(function (x) { return x.tipo === 'cofre'; })[0], falta = (p.usa || []).filter(function (k) { return cof && (cof.faltando || []).indexOf(k) !== -1; });
        if (outra) return ['⚠ o robô "' + p.nome + '" dispara com o dado da outra empresa', '⚠ vazou'];
        return ['o robô "' + p.nome + '" dispara: ' + p.frase.replace(/^quando [^,]+,\s*/, '') + ' · simulado, nada é enviado' + (falta.length ? ' (e falta ' + falta.join(', ') + ' no Cofre)' : ''), 'disparou (teste)'];
      case 'cano': return [outra ? '⚠ o cano "' + p.nome + '" leva a mudança da outra empresa adiante' : 'o cano "' + p.nome + '" avisa a tela na hora', outra ? '⚠ vazou' : '1 aviso'];
      default: return ['chegou em ' + (TIPOS[p.tipo] || 'peça') + ' ' + p.nome, 'recebeu'];
    }
  }
  function chegou(m, T, de, p, quem, porta) {
    var cor = quem === 'outra' ? 'alarme' : 'ok', n = narrar(m, T, de, p, quem, porta), t = agora();
    acender(p, cor, 6000);
    p.recebeuEm = t;
    T.atual = T.atual.concat([p.id]);
    T.status[p.id] = n[1];
    if (quem !== 'outra') T.passaram[p.id] = true;
    if (p.tipo === 'gaveta' && quem !== 'outra' && verboDe(porta) === 'RECEBE' && !T.linhaNova) { if (!real()) p.linhas = (p.linhas || 0) + 1; p.abriuEm = t; T.linhaNova = { gaveta: p.id, texto: dadosTexto(T.dados) + ' · marcado · empresa: ' + QM().ana.empresa }; }
    if (p.tipo === 'robo') { p.giros = (p.giros || 0) + 1; p.disparouEm = t; }
    if (p.tipo === 'cano') p.eventoEm = t;
    if (p.tipo === 'tela' && de && de.tipo === 'cano') p.atualizouEm = t;
    if (p.tipo === 'portaria') p.frestaEm = t;
    registrar(T, n[0], quem === 'outra' && /⚠/.test(n[0]) ? 'alarme' : '', p.id);
    redesenhar();
    faiscasNaPeca(p.id, 3, cor, false);
    tocar('tique');
  }
  async function rodada(m, T, porta, quem) {
    var outra = quem === 'outra', P = QM()[quem], c = caminho(m, porta);
    T.rodada = quem;
    T.atual = [];
    registrar(T, (outra ? 'Agora como ' : 'Como ') + P.nome + ', da ' + P.empresa + (outra ? ' (a outra empresa)' : '') + ' · porta "' + porta.nome + '"', 'titulo');
    if (c.portaria) {
      acender(c.portaria, outra ? 'alarme' : 'ok', 6000);
      c.portaria.frestaEm = agora();
      T.atual = [c.portaria.id];
      T.status[c.portaria.id] = 'entrou: ' + P.nome;
      if (!outra) T.passaram[c.portaria.id] = true;
      registrar(T, 'entrou pela Portaria como ' + P.nome + ', da ' + P.empresa + ' · papel: ' + P.papel, '', c.portaria.id);
      redesenhar();
      faiscasNaPeca(c.portaria.id, 3, outra ? 'alarme' : 'ok', false);
      tocar('tique');
      await esperar(passo(320));
    }
    var barrouEm = null;
    for (var i = 0; i < c.grupos.length && !barrouEm; i++) {
      if (T.cancelado) return;
      T.atual = [];
      var g = c.grupos[i];
      var res = await Promise.all(g.map(function (h) {
        var alvo = h[1], barra = outra && alvo.tipo === 'gaveta' && chaveBarra(alvo, verboDe(porta));
        return pulsar(m, h[0].id, alvo.id, outra ? 'alarme' : 'ok', { morre: barra }).then(function () {
          if (T.cancelado) return null;
          if (barra) return { barrou: alvo, de: h[0] };
          chegou(m, T, h[0], alvo, quem, porta);
          if (outra && alvo.tipo === 'gaveta') T.vazou = !/todos leem/.test(alvo.chave || '');
          return null;
        });
      }));
      res.forEach(function (r) { if (r && r.barrou) barrouEm = r; });
      if (T.cancelado) return;
      if (!barrouEm) await esperar(passo(160));
    }
    if (T.cancelado) return;
    var ass = assinatura(m), pjNome = nomeMaquina(m);
    if (!outra) {
      /* tudo verde: todas as peças do caminho brilham juntas, faíscas nos pinos */
      var ids = Object.keys(T.passaram), t = agora();
      T.passou = true; T.passouEm = t; T.atual = []; T.todasEm = t;
      m.okAna = ass;
      ids.forEach(function (id) { var p = peca(m, id); if (p) { acender(p, 'ok', 7000); p.recebeuEm = t; p.testadaEm = t; } });
      m.fios.forEach(function (f) { if (T.passaram[f[0]] && T.passaram[f[1]] && tipoFio(m, f) !== 'referencia') m.fioLuz[chaveFio(f[0], f[1])] = { cor: 'ok', t: t, mv: 7000 }; });
      registrar(T, 'tudo verde: ' + ids.length + ' peças · o pedido andou do login até a tela', 'ok');
      m.testeOkEm = t;
      m.linha.push({ ts: t, texto: 'testou como ' + P.nome + ': passou por ' + ids.length + ' peças', quem: L().eu, peca: porta.id });
      redesenhar();
      ids.forEach(function (id) { faiscasNaPeca(id, 3, 'ok', true); });
      tocar('duas');
      T.pontos.push({ pts: 6, origem: 'teste passou · ' + ids.length + ' peças · porta "' + porta.nome + '"' });
      if (!pontuar(m, 6, 'teste passou · ' + ids.length + ' peças', 'teste:' + m.id + ':' + ass + ':' + porta.id, c.tela ? c.tela.id : porta.id)) T.pontos[T.pontos.length - 1].repetido = true;
      evento(m, L().nome(L().eu) + ' testou a Máquina de ' + pjNome + ' como ' + P.nome + ': passou por ' + ids.length + ' peças', 'teste-passou');
      avisar({ tipo: 'teste-passou', pj: m.id, porta: porta.id, pecas: ids });
      await esperar(passo(900));
      return;
    }
    if (barrouEm) {
      var gav = barrouEm.barrou, tb = agora(), k2 = chaveFio(barrouEm.de.id, gav.id);
      T.barrado = true; T.barradoEm = tb; T.atual = [gav.id];
      m.okOutra = ass;
      acender(gav, 'alarme', 6000);
      gav.trancouEm = tb;
      T.status[gav.id] = 'barrou 1';
      T.bolhas[achaFio(m, barrouEm.de.id, gav.id) ? achaFio(m, barrouEm.de.id, gav.id).chave : k2] = '0 passaram · 1 barrado pela chave: ' + (gav.chave || 'cada empresa vê só o seu');
      registrar(T, 'barrado pela chave "' + (gav.chave || '') + '": a ' + P.empresa + ' não ' + (verboDe(porta) === 'DEVOLVE' ? 'vê' : 'grava') + ' nada da ' + QM().ana.empresa, 'alarme', gav.id);
      m.linha.push({ ts: tb, texto: 'testou como a outra empresa: barrado no cadeado de ' + gav.nome, quem: L().eu, peca: gav.id });
      redesenhar();
      faiscasNaPeca(gav.id, 4, 'alarme', false);
      tocar('erro');
      T.pontos.push({ pts: 2, origem: 'a segurança funcionou · barrado no cadeado de ' + gav.nome });
      if (!pontuar(m, 2, 'a segurança funcionou · barrado no cadeado', 'barrado:' + m.id + ':' + ass + ':' + porta.id, gav.id)) T.pontos[T.pontos.length - 1].repetido = true;
      evento(m, L().nome(L().eu) + ' testou como a outra empresa: barrado no cadeado de ' + gav.nome + ', como devia', 'barrado');
      avisar({ tipo: 'barrado', pj: m.id, peca: gav.id });
      await esperar(passo(700));
    } else {
      T.vazouFim = !!T.vazou;
      if (T.vazou) {
        registrar(T, 'a outra empresa passou pela máquina inteira: feche a chave da gaveta antes de publicar', 'alarme');
        tocar('erro');
        evento(m, 'Teste da Máquina de ' + pjNome + ': a outra empresa passou. A chave precisa fechar antes de publicar', 'vazou');
        avisar({ tipo: 'vazou', pj: m.id });
      }
    }
  }
  M.testar = function (m, op) {
    op = op || {};
    if (!m || m.ambiente === 'produção') return Promise.resolve(null);
    var porta = (op.porta && peca(m, op.porta)) || portaPadrao(m);
    if (!porta) { aviso('Esta Máquina ainda não tem uma porta pronta para testar.'); return Promise.resolve(null); }
    var como = op.como || 'as-duas';
    if (m.teste && m.teste.rodando) m.teste.cancelado = true;
    var T = m.teste = { id: U.id('tst'), porta: porta.id, como: como, dados: op.dados || dadosPadrao(m, porta), log: [], atual: [], status: {}, bolhas: {}, pontos: [], passaram: {}, rodando: true, fim: false, passou: false, barrado: false, vazou: false, t0: agora(), linhaNova: null };
    m.painel = 'teste'; m.modo = 'ver'; m.testePorta = porta.id; m.fichaAberta = !estreito();
    avisar({ tipo: 'teste', pj: m.id, porta: porta.id, como: como });
    redesenhar();
    var seq = Promise.resolve();
    if (como !== 'outra') seq = seq.then(function () { return rodada(m, T, porta, 'ana'); });
    if (como !== 'ana') seq = seq.then(function () { if (T.cancelado) return null; return esperar(como === 'as-duas' ? passo(450) : 0).then(function () { return T.cancelado ? null : rodada(m, T, porta, 'outra'); }); });
    return seq.then(function () {
      if (T.cancelado) return T;
      T.rodando = false; T.fim = true; T.atual = [];
      redesenhar();
      return verificarFuncionando(m).then(function () { return T; });
    }).catch(function (e) { T.rodando = false; T.erro = String(e && e.message || e); console.error('[máquina] teste', e); redesenhar(); return T; });
  };

  /* ================================================================== "Máquina funcionando": as peças ganham corpo */
  async function verificarFuncionando(m) {
    var ass = assinatura(m);
    if (m.okAna !== ass || m.okOutra !== ass || m.funcionandoAss === ass) return;
    m.funcionandoAss = ass; m.funcionandoEm = agora();
    var lista = m.pecas.filter(function (p) { return p.publicada && p.pronta && !p.corpo && p.tipo !== 'empresa'; });
    var ordem = ['carteiro', 'portaria', 'tela', 'porta', 'gaveta', 'robo', 'cano', 'deposito', 'cofre'];
    lista.sort(function (a, b) { return ordem.indexOf(a.tipo) - ordem.indexOf(b.tipo); });
    var n = m.pecas.filter(function (p) { return p.publicada && p.pronta && p.tipo !== 'empresa'; }).length, pjNome = nomeMaquina(m);
    if (m.teste) { registrar(m.teste, 'Máquina funcionando: ' + n + ' peças com corpo', 'marca'); m.teste.pontos.push({ pts: 12, origem: 'Máquina funcionando · ' + n + ' peças com corpo' }); }
    m.ritoN = n;
    redesenhar();
    tocar('tres');
    var o = org(), palco = document.querySelector('.mq2 .mq-palco');
    if (o && palco && typeof o.respirar === 'function') { try { o.respirar(palco, { cor: 'marca' }); } catch (e) { /* segue */ } }
    for (var i = 0; i < lista.length; i++) {
      lista[i].corpo = agora();
      acender(lista[i], 'marca', 8000);
      redesenhar();
      faiscasNaPeca(lista[i].id, 2, 'marca', true);
      await esperar(passo(80));
    }
    if (!pontuar(m, 12, 'Máquina funcionando · ' + n + ' peças com corpo', 'funcionando:' + m.id + ':' + m.funcionandoAss, null) && m.teste) m.teste.pontos[m.teste.pontos.length - 1].repetido = true;
    m.linha.push({ ts: agora(), texto: 'Máquina funcionando: ' + n + ' peças ganharam corpo', quem: L().eu });
    evento(m, 'Máquina de ' + pjNome + ' funcionando · ' + n + ' peças com corpo', 'funcionando');
    avisar({ tipo: 'funcionando', pj: m.id, pecas: n });
    redesenhar();
  }

  /* ================================================================== publicar: a peça nova tracejada ganha corpo */
  M.publicar = async function (m) {
    var novas = m.pecas.filter(function (p) { return !p.publicada; }), pjNome = nomeMaquina(m), qtd = m.mudancas.length;
    m.versao++;
    var txtPub = L().nome(L().eu) + ' publicou v' + m.versao + ': ' + qtd + ' mudança(s) marcadas para a equipe';
    if (!m.real) m.linha.push({ ts: agora(), texto: txtPub, quem: L().eu });
    m.mudancas = []; m.modo = 'ver';
    redesenhar();
    for (var i = 0; i < novas.length; i++) {
      var p = novas[i];
      p.pronta = true; p.nova = false; p.publicada = true; p.corpo = agora(); p.publicadaEm = agora();
      acender(p, 'marca', 8000);
      redesenhar();
      mostrarNoPalco(m, p.id);
      faiscasNaPeca(p.id, 4, 'marca', true);
      tocarClipe(p);
      tocar('tique');
      await esperar(passo(260));
    }
    if (novas.length) tocar('duas');
    /* app real: a publicação vai para o estado da equipe (as outras Estações e a TV veem as peças ganharem corpo) */
    if (m.real) L().fazer('maquinaPublicar', { projeto: m.id, versao: m.versao, pecas: novas.map(function (p) { return p.id; }), texto: txtPub });
    /* o começo do texto é lido por visual3d.js (/publicad[oa] em produção/): só a ressalva do fim é nova */
    L().fazer('recado', 'Máquina: ' + pjNome + ' publicada em produção (v' + m.versao + ') · só no desenho da equipe: nenhum banco mudou');
    evento(m, L().nome(L().eu) + ' publicou a Máquina de ' + pjNome + ' v' + m.versao + (novas.length ? ' · ' + novas.length + ' peça(s) ganharam corpo' : ''), 'publicou');
    avisar({ tipo: 'publicou', pj: m.id, versao: m.versao, pecas: novas.map(function (p) { return p.id; }) });
    aviso(novas.length ? 'Publicado v' + m.versao + ': ' + novas.length + ' peça(s) ganharam corpo.' : 'Publicado v' + m.versao + '.');
    redesenhar();
    return novas.length;
  };

  /* o clipe gerado (cubo de ardósia → peça) toca uma vez em cima da peça, só no evento; sem movimento, não toca */
  function tocarClipe(p) {
    var src = clipeDe(p.tipo), el = noEl(p.id), cam = camadaFx();
    if (!src || !el || !cam || semMovimento()) return false;
    var r = el.getBoundingClientRect(), v = document.createElement('video'), tam = 84;
    v.className = 'mq-clipe'; v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = src; v.setAttribute('aria-hidden', 'true');
    v.style.left = Math.round(r.right - tam * 0.62) + 'px'; v.style.top = Math.round(r.bottom - tam * 0.66) + 'px'; v.style.width = v.style.height = tam + 'px';
    var feito = false;
    function fim() { if (feito) return; feito = true; if (v.parentNode) v.parentNode.removeChild(v); }
    v.addEventListener('ended', fim); v.addEventListener('error', fim);
    setTimeout(fim, 5000);
    cam.appendChild(v);
    var pr = v.play(); if (pr && pr.catch) pr.catch(fim);
    return true;
  }

  /* eventos da equipe (vão para a TV pelo diário da loja; pontos pessoais nunca vão) */
  var LA = BC.loja.A;
  LA.maquinaEvento = function (quem, d) { if (!d || !d.texto) return; return [L()._evento('maquina', quem, d.texto, { tv: true, pj: d.pj || null, maquina: d.tipo || null })]; };
  LA.maquinaTv = function (quem, d) { if (!d || !d.pj) return; L().estado.maquinaTv = { pj: d.pj, nome: d.nome, ts: Date.now(), retrato: d.retrato || null }; return [L()._evento('maquina', quem, L().nome(quem) + ' levou a Máquina de ' + d.nome + ' para a TV', { tv: true, pj: d.pj, maquina: 'tv', maquinaRetrato: d.retrato || null })]; };
  function evento(m, texto, tipo) { try { L().fazer('maquinaEvento', { texto: texto, pj: m.id, tipo: tipo }); } catch (e) { /* a loja é de outra peça */ } }

  /* ---------- app real: a máquina de cada projeto no estado da equipe (ações da loja: vão para o diário) ---------- */
  function linhaCurta(s, max) { return String(s == null ? '' : s).replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, max); }
  function pecaDaFonte(src, ref) {
    if (!src || ref == null) return null;
    var id = String(ref), n = U.normalizar(id).replace(/^(a|o)\s+/, '');
    return src.pecas.filter(function (p) { return p.id === id; })[0] || src.pecas.filter(function (p) { return U.normalizar(p.nome) === n || U.normalizar((TIPOS[p.tipo] || '') + ' ' + p.nome) === n; })[0] || null;
  }
  /* uma Tela não grava direto numa Gaveta: passa por uma Porta (a mesma regra de M.ligar) */
  function motivoSemFio(src, a, b) {
    if (!a || !b) return 'peça não encontrada';
    if (a.id === b.id) return 'a peça não se liga a ela mesma';
    if (a.tipo === 'tela' && b.tipo === 'gaveta') return 'uma Tela não grava direto numa Gaveta: passa por uma Porta';
    if (src.fios.some(function (f) { return (f[0] === a.id && f[1] === b.id) || (f[0] === b.id && f[1] === a.id); })) return 'já estão ligadas';
    return '';
  }
  M.motivoSemFio = function (pjId, de, para) { var src = fonteReal(pjId, false); if (!src) return 'esta Máquina ainda não tem peças'; return motivoSemFio(src, pecaDaFonte(src, de), pecaDaFonte(src, para)); };
  /* maquinaPeca {projeto, peca:{id?, tipo, nome, frase?, campos?, chave?, verbo?, login?, quando?, …}, fios?:[[de,para]], texto?} */
  LA.maquinaPeca = function (quem, d) {
    if (!d || !d.projeto || !d.peca || typeof d.peca !== 'object') return;
    var pjId = String(d.projeto), pj = projetoDe(pjId), x = d.peca, tipo = String(x.tipo || ''), nome = linhaCurta(x.nome, 60);
    if (!pj || TIPOS_REAIS.indexOf(tipo) === -1 || !nome) return;
    var src = fonteReal(pjId, true), id = linhaCurta(x.id, 64).replace(/[^\w-]/g, '') || L()._novoId('mq');
    /* a gaveta desenhada e a do banco local podem ter o mesmo nome: uma é o desenho, a outra existe de verdade. Peça do banco
       só se repete pelo id (o Postgres deixa o mesmo gatilho set_updated_at em várias tabelas: cada um é um robô) */
    if (src.pecas.some(function (p) { return p.id === id || (!x.banco && !p.banco && p.tipo === tipo && U.normalizar(p.nome) === U.normalizar(nome)); })) return;
    var p = pecaParaEstado(x);
    p.id = id; p.tipo = tipo; p.nome = nome; p.frase = linhaCurta(x.frase || INFO[tipo].oque, 200); p.por = x.por && L().pessoa(x.por) ? x.por : quem;
    p.criadaEm = Date.now(); p.publicada = false; delete p.publicadaEm;
    if (x.banco === true) { p.banco = true; p.estacao = quem; } else { delete p.banco; delete p.estacao; } /* o banco é de quem assinou o evento */
    if (Array.isArray(p.campos)) p.campos = p.campos.slice(0, 30).map(function (c) { return linhaCurta(c, 80); }).filter(Boolean);
    if (tipo === 'gaveta') { if (CHAVES.indexOf(p.chave) === -1) p.chave = '⚠ aberta para todos'; if (typeof p.linhas !== 'number') p.linhas = 0; }
    if (tipo === 'porta') { if (p.verbo !== 'DEVOLVE' && p.verbo !== 'RECEBE') delete p.verbo; if (p.login !== false) p.login = true; }
    src.pecas.push(p);
    (Array.isArray(d.fios) ? d.fios : []).forEach(function (f) { var a = Array.isArray(f) && pecaDaFonte(src, f[0]), b = Array.isArray(f) && pecaDaFonte(src, f[1]); if (a && b && !motivoSemFio(src, a, b)) src.fios.push([a.id, b.id]); });
    var texto = linhaCurta(d.texto, 200) || L().nome(quem) + ' montou ' + TIPOS[tipo] + ' "' + nome + '"';
    src.linha.push({ ts: Date.now(), texto: texto, quem: quem, peca: id });
    if (src.linha.length > 200) src.linha.splice(0, src.linha.length - 200);
    return [L()._evento('maquina', quem, L().nome(quem) + ' montou ' + TIPOS[tipo] + ' "' + nome + '" na Máquina de ' + pj.nome, { discreto: true, pj: pjId, maquina: 'peca', peca: id })];
  };
  /* maquinaLigar {projeto, de, para, texto?}: de e para são id ou nome da peça */
  LA.maquinaLigar = function (quem, d) {
    if (!d || !d.projeto || !projetoDe(String(d.projeto))) return;
    var src = fonteReal(String(d.projeto), false), a = pecaDaFonte(src, d.de), b = pecaDaFonte(src, d.para);
    if (!src || motivoSemFio(src, a, b)) return;
    src.fios.push([a.id, b.id]);
    var texto = linhaCurta(d.texto, 200) || L().nome(quem) + ' ligou ' + TIPOS[a.tipo] + ' "' + a.nome + '" a ' + TIPOS[b.tipo] + ' "' + b.nome + '"';
    src.linha.push({ ts: Date.now(), texto: texto, quem: quem, peca: a.id });
    return [L()._evento('maquina', quem, L().nome(quem) + ' ligou ' + TIPOS[a.tipo] + ' "' + a.nome + '" a ' + TIPOS[b.tipo] + ' "' + b.nome + '"', { discreto: true, pj: String(d.projeto), maquina: 'fio' })];
  };
  /* maquinaPublicar {projeto, versao?, pecas?:[ids], texto?}: as peças ainda no local ganham corpo em todas as telas */
  LA.maquinaPublicar = function (quem, d) {
    if (!d || !d.projeto || !projetoDe(String(d.projeto))) return;
    var src = fonteReal(String(d.projeto), false);
    if (!src) return;
    var t = Date.now(), ids = Array.isArray(d.pecas) && d.pecas.length ? d.pecas.map(String) : null, n = 0;
    src.pecas.forEach(function (p) { if (!p.publicada && (!ids || ids.indexOf(p.id) !== -1)) { p.publicada = true; p.publicadaEm = t; n++; } });
    src.versao = Math.max((src.versao || 1) + 1, +d.versao || 0);
    src.linha.push({ ts: t, texto: linhaCurta(d.texto, 200) || L().nome(quem) + ' publicou v' + src.versao, quem: quem });
    return [L()._evento('maquina', quem, L().nome(quem) + ' publicou a Máquina de ' + projetoDe(String(d.projeto)).nome + ' v' + src.versao + (n ? ' · ' + n + ' peça(s) com corpo' : ''), { discreto: true, pj: String(d.projeto), maquina: 'publicou-estado' })];
  };
  /* maquinaMudar {projeto, peca, chave? (+ frase?) | quando? | chaveEntregue? | campos? | sai? | semFio?, texto?}: o que a ficha
     (ou o banco local, pela tela do conector) muda numa peça que já existe. campos, sai e semFio só valem para peça banco:true:
     quem manda nela é a migração do banco, e ela sai da Máquina quando sai do banco. */
  LA.maquinaMudar = function (quem, d) {
    if (!d || !d.projeto || !projetoDe(String(d.projeto))) return;
    var src = fonteReal(String(d.projeto), false), p = pecaDaFonte(src, d.peca), feito, i, f;
    if (!p) return;
    /* o banco é de cada computador: a migração de outra Estação (outro banco) não muda nem tira a peça deste */
    if (p.banco && donoBanco(p) !== quem) return;
    if (d.chave != null) { if (p.tipo !== 'gaveta' || CHAVES.indexOf(d.chave) === -1) return; p.chave = d.chave; if (p.banco && d.frase != null) p.frase = linhaCurta(d.frase, 200); feito = 'mudou a chave de ' + p.nome + ' para "' + p.chave + '"'; }
    else if (Array.isArray(d.campos)) { if (!p.banco) return; p.campos = d.campos.slice(0, 30).map(function (c) { return linhaCurta(c, 80); }).filter(Boolean); feito = 'atualizou os campos de ' + p.nome + ' (' + p.campos.length + ')'; }
    else if (d.sai === true) {
      if (!p.banco) return;
      src.pecas.splice(src.pecas.indexOf(p), 1);
      for (i = src.fios.length - 1; i >= 0; i--) if (src.fios[i][0] === p.id || src.fios[i][1] === p.id) src.fios.splice(i, 1);
      feito = 'tirou ' + TIPOS[p.tipo] + ' "' + p.nome + '" (saiu do banco local)';
    } else if (d.semFio != null) {
      var outra = pecaDaFonte(src, d.semFio), n0 = src.fios.length;
      if (!p.banco || !outra) return;
      for (i = src.fios.length - 1; i >= 0; i--) { f = src.fios[i]; if ((f[0] === p.id && f[1] === outra.id) || (f[0] === outra.id && f[1] === p.id)) src.fios.splice(i, 1); }
      if (src.fios.length === n0) return;
      feito = 'desligou ' + p.nome + ' de ' + outra.nome + ' (o vínculo saiu do banco local)';
    } else if (d.quando != null) { var q = linhaCurta(d.quando, 60); if (p.tipo !== 'robo' || !q) return; p.quando = q; feito = 'fez o robô "' + p.nome + '" disparar ' + q; }
    else if (d.chaveEntregue != null) {
      var k = p.tipo === 'cofre' && (p.chaves || []).filter(function (x) { return x.nome === String(d.chaveEntregue); })[0];
      if (!k) return;
      k.ok = true; k.entregueEm = Date.now(); p.faltando = (p.faltando || []).filter(function (x) { return x !== k.nome; });
      feito = 'marcou a chave ' + k.nome + ' do Cofre como entregue';
    } else return;
    src.linha.push({ ts: Date.now(), texto: linhaCurta(d.texto, 200) || feito, quem: quem, peca: p.id });
    if (src.linha.length > 200) src.linha.splice(0, src.linha.length - 200);
    return [L()._evento('maquina', quem, L().nome(quem) + ' ' + feito + ' na Máquina de ' + projetoDe(String(d.projeto)).nome, { discreto: true, pj: String(d.projeto), maquina: 'mudou', peca: p.id })];
  };
  function luzesCofre(p) { return (p.chaves || []).map(function (k) { return k.nome + ':' + (k.ok ? 1 : 0); }).join('|'); }
  /* o que chegou pelo estado (outra Estação, o agente pelo conector, o diário ao abrir) entra na Máquina aberta nesta janela */
  function sincronizarReal() {
    if (!real()) return;
    var e = L().estado, mudou = false;
    if (!e || !e.maquinas) return;
    Object.keys(M.maquinas).forEach(function (pjId) {
      var m = M.maquinas[pjId], src = e.maquinas[pjId];
      if (!m.real || !src) return;
      if (m.linha !== src.linha) m.linha = src.linha;
      if (!m.pj) m.pj = projetoDe(pjId);
      src.pecas.forEach(function (x) {
        var p = peca(m, x.id);
        if (!p) {
          p = pecaDoEstado(x, !x.publicada);
          m.pecas.push(p); m.rev++; mudou = true;
          /* do banco local: já nasce com corpo (a animação no 3D é de maquina-efeitos.js); publicar continua sendo a subida futura */
          if (x.banco) { acender(p, 'marca', 6000); if (!x.publicada) m.mudancas.push('Cria ' + (TIPOS[p.tipo] || 'peça') + ' "' + p.nome + '" (já ' + seloBanco(x) + '; a nuvem vem depois)'); }
          else if (!x.publicada) { m.mudancas.push('Cria ' + (TIPOS[p.tipo] || 'peça') + ' "' + p.nome + '"'); setTimeout(function () { ficouPronta(m, p); }, 1600); }
          avisar({ tipo: 'encaixou', pj: m.id, peca: p.id, nome: p.nome, tipoPeca: p.tipo });
          return;
        }
        if (x.publicada && !p.publicada) { p.publicada = true; p.pronta = true; p.nova = false; p.corpo = agora(); p.publicadaEm = x.publicadaEm; acender(p, 'marca', 8000); mudou = true; }
        /* o que a ficha mudou em outra tela (maquinaMudar): chave, "quando" e as chaves do Cofre */
        if (x.chave !== undefined && x.chave !== p.chave) { p.chave = x.chave; p.mudouEm = agora(); m.rev++; m.mudancas.push('Muda a chave de ' + p.nome + ' para "' + p.chave + '"'); acender(p, /⚠/.test(p.chave) ? 'alarme' : 't0', 4000); mudou = true; }
        if (x.quando !== undefined && x.quando !== p.quando) { p.quando = x.quando; p.mudouEm = agora(); m.rev++; m.mudancas.push('Robô "' + p.nome + '" passa a disparar ' + p.quando); mudou = true; }
        if (Array.isArray(x.chaves) && luzesCofre(x) !== luzesCofre(p)) { p.chaves = x.chaves.map(function (k) { return Object.assign({}, k); }); p.faltando = (x.faltando || []).slice(); acender(p, 'ok', 6000); mudou = true; }
        /* banco local: colunas novas e a frase da regra de acesso acompanham o banco */
        if (Array.isArray(x.campos) && x.campos.join('\n') !== (p.campos || []).join('\n')) { p.campos = x.campos.slice(); p.mudouEm = agora(); m.rev++; acender(p, 't0', 4000); mudou = true; }
        if (typeof x.frase === 'string' && x.frase !== p.frase) { p.frase = x.frase; mudou = true; }
      });
      /* o que saiu do banco local (maquinaMudar sai/semFio) sai desta janela também; peça só de desenho nunca some por aqui */
      var naFonte = {}, saiu = {}, fiosFonte = {}, i;
      src.pecas.forEach(function (x) { naFonte[x.id] = true; });
      for (i = m.pecas.length - 1; i >= 0; i--) if (m.pecas[i].banco && !naFonte[m.pecas[i].id]) { saiu[m.pecas[i].id] = true; if (m.sel === m.pecas[i].id) m.sel = null; m.pecas.splice(i, 1); m.rev++; mudou = true; }
      src.fios.forEach(function (f) { fiosFonte[chaveFio(f[0], f[1])] = true; });
      for (i = m.fios.length - 1; i >= 0; i--) {
        var fa = m.fios[i][0], fb = m.fios[i][1], pa = peca(m, fa), pb = peca(m, fb);
        if (saiu[fa] || saiu[fb] || (((pa && pa.banco) || (pb && pb.banco)) && !fiosFonte[chaveFio(fa, fb)])) { m.fios.splice(i, 1); m.rev++; mudou = true; }
      }
      src.fios.forEach(function (f) { if (peca(m, f[0]) && peca(m, f[1]) && !achaFio(m, f[0], f[1])) { m.fios.push([f[0], f[1]]); m.fioNasce[chaveFio(f[0], f[1])] = agora(); m.rev++; mudou = true; } });
      if ((src.versao || 1) > m.versao) m.versao = src.versao;
    });
    if (mudou && abaMaquina()) setTimeout(redesenharSeAberta, 0);
  }
  L().aoMudar(function () { try { sincronizarReal(); } catch (err) { console.warn('[máquina] sincronizar', err); } });

  /* ================================================================== desenho */
  function cadeadoHtml(p, t) {
    var aberto = /⚠/.test(p.chave || ''), anim = p.trancouEm && t - p.trancouEm < 400 ? ' treme' : p.fechouEm && t - p.fechouEm < 200 ? ' clique' : '';
    var delay = anim === ' treme' ? t - p.trancouEm : anim === ' clique' ? t - p.fechouEm : 0;
    return '<span class="mq-cadeado' + (aberto ? ' aberto' : ' fechado') + anim + '" title="' + esc(p.chave || '') + '"' + (anim ? ' style="animation-delay:-' + delay + 'ms"' : '') + '>' + glifo(aberto ? 'aberto' : 'chave', 13) + '</span>';
  }
  var TIPO_CAMPO = [[/liga/, '○'], [/data|hora/, '▭'], [/lista/, '≡'], [/n[uú]mero|quantidade/, '#'], [/dinheiro|valor|pre[cç]o/, '$'], [/sim|n[aã]o/, '◐'], [/arquivo/, '▣'], [/json|livre/, '{}'], [/texto/, '¶']];
  function campoHtml(c, nova) {
    var mm = String(c).match(/^(.*?)\s*\((.*)\)\s*$/), nome = mm ? mm[1] : c, tipo = mm ? mm[2] : '', g = '¶';
    for (var i = 0; i < TIPO_CAMPO.length; i++) if (TIPO_CAMPO[i][0].test(U.normalizar(tipo))) { g = TIPO_CAMPO[i][1]; break; }
    return '<em' + (nova ? ' class="nova"' : '') + '><i>' + g + '</i><span>' + esc(nome) + '</span><small>' + esc(tipo.replace(/^liga[cç][aã]o com /i, '→ ')) + '</small></em>';
  }
  function animAttr(nome, t0, dur, t) { return t0 && t - t0 < dur ? { cls: ' ' + nome, delay: t - t0 } : null; }
  function pecaHtml(m, p, op) {
    op = op || {};
    var t = agora(), pessoa = L().pessoa(p.por), cor = pessoa ? pessoa.cor : null, T = m.teste;
    var ativa = !!(T && T.atual && T.atual.indexOf(p.id) !== -1 && t - (p.recebeuEm || p.luz && p.luz.t || 0) < 2500), al = alertaDe(m, p), sj = suja(p);
    var cls = 'mq-peca mq-' + p.tipo + (!p.pronta ? ' construindo' : !p.publicada && !p.banco ? ' local' : '') + (p.corpo ? ' corpo' : '') + (p.banco ? ' banco' : '') + (m.sel === p.id ? ' sel' : '') + (ativa ? ' ativa' : '') + (al ? ' alerta' : '') + (sj ? ' suja' : '') + (op.fora ? ' fora' : '') + (op.grande ? ' grande' : '') + (op.mini ? ' mini' : '');
    var anims = [animAttr('encaixe', p.criadaEm, 260, t), animAttr('ganhando', p.corpo, 900, t), animAttr('recebe', p.recebeuEm, 320, t)].filter(Boolean).slice(0, 1);
    anims.forEach(function (a) { cls += a.cls; });
    var estilo = (cor ? '--pessoa:' + cor + ';' : '') + (anims.length ? 'animation-delay:-' + anims[0].delay + 'ms;' : '');
    var luz = luzAttrs(p.luz, estilo);
    if (!luz && estilo) luz = ' style="' + estilo + '"';
    var dentro = '';
    var max = op.grande ? 20 : 4;
    switch (p.tipo) {
      case 'gaveta':
        var gNova = T && T.linhaNova && T.linhaNova.gaveta === p.id;
        dentro = '<span class="mq-campos">' + (p.campos || []).slice(0, max).map(function (c) { return campoHtml(c); }).join('') + ((p.campos || []).length > max ? '<em class="mais"><span>+' + ((p.campos || []).length - max) + ' campo(s)</span></em>' : '') + '</span>' +
          (gNova ? '<span class="mq-linha-entrou"' + (p.abriuEm ? ' style="animation-delay:-' + Math.min(2000, t - p.abriuEm) + 'ms"' : '') + '>' + esc(T.linhaNova.texto.split(' · ').slice(0, 2).join(' · ')) + '</span>' : '') +
          (p.banco
            ? '<span class="mq-rodape-peca">TABELA · ' + esc(p.nome) + ' · ' + (gNova ? 'teste, não gravou' : contagemDe(m.id, p.id) != null ? linhasTxt(contagemDe(m.id, p.id)) : seloBanco(p)) + '</span>'
            : '<span class="mq-rodape-peca">TABELA · ' + esc(U.normalizar(p.nome).replace(/\s+/g, '_')) + ' · ' + (real() ? (gNova ? 'teste, não gravou' : 'sem banco ainda') : (gNova ? (p.linhas - 1) + ' → ' + p.linhas : (p.linhas || 0)) + ' linhas') + '</span>');
        break;
      case 'porta':
        var vb = verboDe(p);
        dentro = '<i class="mq-conector ' + (vb === 'DEVOLVE' ? 'muitos' : 'um') + '"></i><span class="mq-verbo">' + vb + ' ' + esc(camposPorta(p).join(' + ')) + '</span>' + (op.mini ? '' : '<span class="mq-frase">' + esc(p.frase) + '</span>');
        break;
      case 'robo':
        dentro = '<span class="mq-robo-corpo"><span class="mq-engrenagem" style="transform:rotate(' + ((p.giros || 0) * 60) + 'deg)">' + glifo('robo', 22) + '</span><i class="mq-led"' + (p.disparouEm ? luzAttrs({ cor: 'atencao', t: p.disparouEm, mv: 6000 }) : '') + '></i></span>' +
          '<span class="mq-verbo">' + esc((p.quando || 'quando entra').toUpperCase()) + (p.alvo && peca(m, p.alvo) ? ' · ' + esc(U.normalizar(peca(m, p.alvo).nome)) : '') + '</span>' + (p.usa && p.usa.length ? '<span class="mq-usa">usa: ' + esc(p.usa.join(', ')) + '</span>' : '');
        break;
      case 'cano':
        var ev = p.eventoEm && t - p.eventoEm < 700;
        dentro = '<span class="mq-tubo' + (ev ? ' evento' : '') + '"' + (ev ? ' style="animation-delay:-' + (t - p.eventoEm) + 'ms"' : '') + '><i></i><i></i><i></i></span><span class="mq-verbo">AO VIVO · ' + esc(ligadasNomes(m, p)) + '</span>';
        break;
      case 'deposito':
        dentro = '<span class="mq-prateleira"><i></i><i></i><i></i></span><span class="mq-regua"><i style="width:' + (p.usoPct || 0) + '%"></i></span><span class="mq-verbo">' + esc(p.uso || 'vazio') + ' · privada</span>';
        break;
      case 'cofre':
        dentro = '<span class="mq-chaves-lista">' + (p.chaves || []).map(function (k) { return '<em class="' + (k.ok ? 'ok' : 'falta') + (k.entregueEm && t - k.entregueEm < 200 ? ' clique' : '') + '"><i class="mq-led"></i>' + esc(k.nome) + (k.ok ? '' : '<small>pedir ao ' + esc(L().nome(p.por) || 'dono') + '</small>') + '</em>'; }).join('') + '</span>';
        break;
      case 'tela':
        var nl = p.atualizouEm && T && T.linhaNova;
        dentro = '<span class="mq-mini-tela' + (p.atualizouEm && t - p.atualizouEm < 6000 ? ' atualizou' : '') + '"><i class="barra"></i><i></i><i></i><i></i>' + (nl ? '<i class="nova"></i>' : '') + '</span>' + (op.mini ? '' : '<span class="mq-frase">' + esc(p.frase) + '</span>');
        break;
      case 'portaria':
        dentro = '<i class="mq-fresta"' + (p.frestaEm ? luzAttrs({ cor: (p.luz && p.luz.cor) || 'ok', t: p.frestaEm, mv: 6000 }) : '') + '></i><span class="mq-chips">' + (p.papeis || []).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</span>' + (op.mini ? '' : '<span class="mq-frase">' + esc(p.frase) + '</span>');
        break;
      case 'carteiro':
        dentro = '<span class="mq-verbo">' + esc((p.provedor || '').toUpperCase()) + '</span>';
        break;
      default:
        dentro = '<span class="mq-frase">' + esc(p.frase || '') + '</span>';
    }
    var img = p.corpo ? imagemDe(p.tipo, !!op.grande) : '';
    /* o selo da peça do banco local (na gaveta sem contagem, o rodapé já diz "no banco local"); de outra Estação, diz de quem */
    var estado = p.banco ? (p.tipo === 'gaveta' && contagemDe(m.id, p.id) == null ? '' : '<span class="mq-estado-txt banco' + (bancoDaqui(p) ? '' : ' outra') + '">' + esc(seloBanco(p)) + '</span>')
      : !p.pronta ? '<span class="mq-estado-txt">em construção · só o desenho</span>' : !p.publicada ? '<span class="mq-estado-txt">no local · falta publicar</span>' : '';
    var status = T && T.status[p.id] ? '<span class="mq-status' + (/barrou|vazou/.test(T.status[p.id]) ? ' barrou' : '') + '">' + esc(T.status[p.id]) + '</span>' : '';
    return '<button type="button" class="' + cls + '" data-no="' + esc(p.id) + '" data-col="' + (op.col != null ? op.col : coluna(m, p)) + '" data-pronta="' + (p.pronta ? 1 : 0) + '" data-acao="mq-sel" data-id="' + esc(p.id) + '"' + luz + ' aria-label="' + esc((TIPOS[p.tipo] || 'Peça') + ' ' + p.nome) + (al ? ' · ' + esc(al) : '') + '">' +
      '<span class="mq-cab">' + glifo(p.tipo, 14) + '<b class="mq-nome">' + esc(p.nome) + '</b>' + (p.tipo === 'gaveta' ? cadeadoHtml(p, t) : '') + (pessoa && !op.mini ? U.avatar(pessoa, 14) : '') + '</span>' +
      dentro + estado + (al && !op.mini ? '<span class="mq-alerta">' + esc(al) + '</span>' : '') + (sj ? '<span class="mq-suja">mudou depois do teste · testar de novo</span>' : '') + status +
      (!p.publicada ? '<i class="mq-nao-pub" title="' + (p.banco ? esc(seloBanco(p)) + ' · ainda não publicada' : 'não publicada') + '"></i>' : '') +
      (img ? '<img class="mq-corpo-img' + (/\.jpe?g($|\?)/i.test(img) ? ' escuro' : '') + '" src="' + esc(img) + '" alt="" loading="lazy" decoding="async">' : '') +
      '</button>';
  }
  function ligadasNomes(m, p) { var e = m.fios.filter(function (f) { return f[1] === p.id; }).map(function (f) { return peca(m, f[0]); }).filter(Boolean)[0]; return e ? U.normalizar(e.nome) : 'sem gaveta'; }
  var COLUNA = { carteiro: 0, portaria: 0, tela: 0, porta: 1, gaveta: 2, empresa: 2, robo: 3, deposito: 3, cofre: 3, cano: 3 };
  var ORDEM_COL = { carteiro: 0, portaria: 1, tela: 2, robo: 0, deposito: 1, cofre: 2, cano: 3 };
  function coluna(m, p) { return COLUNA[p.tipo] != null ? COLUNA[p.tipo] : 3; }
  function fiosSvg(m, lista) {
    var t = agora(), T = m.teste, bolhas = '', paths = lista.map(function (f) {
      var k = f.k || chaveFio(f[0], f[1]), tipo = f.tipo || tipoFio(m, f), l = m.fioLuz[k], nasce = m.fioNasce[k] && t - m.fioNasce[k] < 600;
      var pa = m.zoom === 'dominio' && m.dominio ? peca(m, f[0]) : null, pb = pa ? peca(m, f[1]) : null;
      var fora = !!(pa && pb && pa.dom !== m.dominio && pb.dom !== m.dominio);
      var cls = 'mq-fio ' + tipo + (l && t - l.t < l.mv * 7 ? ' ' + l.cor : '') + (nasce ? ' nasce' : '') + (fora ? ' fora' : '');
      var d = m.cacheD[k] || '';
      var luz = l ? luzAttrs(l, nasce ? 'animation-delay:-' + (t - m.fioNasce[k]) + 'ms;' : '') : nasce ? ' style="animation-delay:-' + (t - m.fioNasce[k]) + 'ms"' : '';
      if (T && T.bolhas[k]) bolhas += '<span class="mq-bolha barrou" data-k="' + esc(k) + '">' + esc(T.bolhas[k]) + '</span>';
      if (f.rotulo) bolhas += '<span class="mq-bolha" data-k="' + esc(k) + '">' + esc(f.rotulo) + '</span>';
      return '<path id="' + domFio(k) + '" class="' + cls + '" data-k="' + esc(k) + '" data-de="' + esc(f[0]) + '" data-para="' + esc(f[1]) + '" d="' + d + '"' + luz + '/>' + (tipo === 'relacao' ? '<path class="mq-losango" data-k="' + esc(k) + '" d=""/>' : '');
    }).join('');
    return { svg: '<svg class="mq-fios" aria-hidden="true">' + paths + '</svg><svg class="mq-pinos" aria-hidden="true"></svg>', bolhas: bolhas };
  }
  function mesaDominio(m) {
    var cols = [[], [], [], []], fora = function (p) { return !!(m.dominio && p.dom !== m.dominio); };
    var emp = peca(m, 'empresa'), dentro = [], soltas = [];
    m.pecas.forEach(function (p) {
      if (p.tipo === 'empresa') return;
      if (p.tipo === 'gaveta') { (naBandeja(m, p) ? dentro : soltas).push(p); return; }
      cols[coluna(m, p)].push(p);
    });
    [0, 3].forEach(function (i) { cols[i].sort(function (a, b) { return (ORDEM_COL[a.tipo] || 0) - (ORDEM_COL[b.tipo] || 0); }); });
    var html = function (p) { return pecaHtml(m, p, { fora: fora(p) }); };
    var col2 = (emp ? '<div class="mq-bandeja' + (fora(emp) ? ' fora' : '') + (m.sel === 'empresa' ? ' sel' : '') + '" data-no="empresa" data-col="2" data-acao="mq-sel" data-id="empresa"' + luzAttrs(emp.luz) + '><span class="mq-bandeja-rot">' + glifo('empresa', 12) + '<span>EMPRESA<small>cada uma vê só o seu</small></span></span>' + dentro.map(html).join('') + (dentro.length ? '' : '<span class="mq-vazio">solte uma gaveta aqui</span>') + '</div>' : '') + soltas.map(html).join('');
    var f = fiosSvg(m, m.fios.filter(function (x) { return peca(m, x[0]) && peca(m, x[1]); }));
    return '<span class="mq-armario">' + glifo('armario', 12) + 'ARMÁRIO DA FRENTE · as gavetas daqui têm porta na rua</span>' + f.svg +
      '<div class="mq-col" data-c="0">' + cols[0].map(html).join('') + '</div>' +
      '<div class="mq-col" data-c="1">' + cols[1].map(html).join('') + '</div>' +
      '<div class="mq-col" data-c="2">' + col2 + '</div>' +
      '<div class="mq-col" data-c="3">' + cols[3].map(html).join('') + '</div>' + f.bolhas;
  }
  function dominios(m) {
    var ds = {}, ordem = [];
    m.pecas.forEach(function (p) { var d = p.dom || 'novas'; if (!ds[d]) { ds[d] = { id: d, nome: nomeDom(d), pecas: [], soma: 0 }; ordem.push(d); } ds[d].pecas.push(p); ds[d].soma += coluna(m, p); });
    return ordem.map(function (d) { var x = ds[d]; x.media = x.soma / x.pecas.length; return x; }).sort(function (a, b) { return a.media - b.media; });
  }
  function mesaInteira(m) {
    var ds = dominios(m), idx = {}, t = agora();
    ds.forEach(function (d, i) { idx[d.id] = i; });
    var agreg = {};
    m.fios.forEach(function (f) {
      var a = peca(m, f[0]), b = peca(m, f[1]);
      if (!a || !b || tipoFio(m, f) === 'referencia') return;
      var da = a.dom || 'novas', db = b.dom || 'novas';
      if (da === db) return;
      if (idx[da] > idx[db]) { var x = da; da = db; db = x; }
      var k = 'dom:' + da + '__dom:' + db;
      agreg[k] = agreg[k] || { k: k, 0: 'dom:' + da, 1: 'dom:' + db, tipo: 'fluxo', n: 0 };
      agreg[k].n++;
    });
    var lista = Object.keys(agreg).map(function (k) { var a = agreg[k]; a.rotulo = a.n + (a.n === 1 ? ' fio' : ' fios'); a.length = 2; return a; });
    var f = fiosSvg(m, lista);
    var cards = ds.map(function (d, i) {
      var cont = {}, al = 0, corpo = 0, luzT = 0, luzCor = 'ok', testada = 0;
      d.pecas.forEach(function (p) { cont[p.tipo] = (cont[p.tipo] || 0) + 1; if (alertaDe(m, p)) al++; if (p.corpo) corpo++; if (p.luz && p.luz.t > luzT) { luzT = p.luz.t; luzCor = p.luz.cor; } if (p.testadaEm > testada) testada = p.testadaEm; });
      var imgs = d.pecas.filter(function (p) { return p.corpo && imagemDe(p.tipo); }).slice(0, 3);
      var resumo = Object.keys(cont).filter(function (k) { return k !== 'empresa'; }).map(function (k) { return cont[k] + ' ' + (TIPOS[k] || k).toLowerCase() + (cont[k] > 1 ? (/[aeiouô]$/i.test(TIPOS[k] || '') ? 's' : 'es') : ''); }).join(' · ');
      return '<button type="button" class="mq-dominio' + (m.dominio === d.id ? ' sel' : '') + '" data-no="dom:' + esc(d.id) + '" data-col="' + i + '" data-acao="mq-dominio" data-d="' + esc(d.id) + '"' + (luzT ? luzAttrs({ cor: luzCor, t: luzT, mv: 6000 }) : '') + '>' +
        '<span class="mq-dominio-nome">' + esc(d.nome) + '</span><span class="mq-dominio-conta">' + esc(resumo) + '</span>' +
        '<span class="mq-dominio-glifos">' + d.pecas.map(function (p) { return '<i class="' + (!p.pronta ? 'construindo' : !p.publicada && !p.banco ? 'local' : '') + (alertaDe(m, p) ? ' alerta' : '') + (p.corpo ? ' corpo' : '') + '" title="' + esc((TIPOS[p.tipo] || '') + ' ' + p.nome) + '">' + glifo(p.tipo, 14) + '</i>'; }).join('') + '</span>' +
        '<span class="mq-dominio-estado">' + (testada ? '✓ testado ' + U.hora(testada) : 'ainda não testado') + (al ? ' · <b>' + al + ' alerta' + (al > 1 ? 's' : '') + '</b>' : '') + ' · ' + corpo + '/' + d.pecas.length + ' com corpo</span>' +
        (imgs.length ? '<span class="mq-dominio-corpos">' + imgs.map(function (p) { var im = imagemDe(p.tipo); return '<img src="' + esc(im) + '" alt=""' + (/\.jpe?g($|\?)/i.test(im) ? ' class="escuro"' : '') + '>'; }).join('') + '</span>' : '') +
        '</button>';
    }).join('');
    return f.svg + '<div class="mq-dominios" style="--n:' + Math.min(ds.length, 4) + '">' + cards + '</div>' + f.bolhas;
  }
  function mesaPeca(m, p) {
    var ent = [], sai = [];
    m.fios.forEach(function (f) { if (f[1] === p.id && peca(m, f[0])) ent.push(f); if (f[0] === p.id && peca(m, f[1])) sai.push(f); });
    var f = fiosSvg(m, ent.concat(sai));
    return f.svg +
      '<div class="mq-col" data-c="0">' + (ent.length ? ent.map(function (x) { var q = peca(m, x[0]); return q.tipo === 'empresa' ? '<div class="mq-bandeja mini" data-no="empresa" data-col="0"><span class="mq-bandeja-rot">EMPRESA</span></div>' : pecaHtml(m, q, { mini: true, col: 0 }); }).join('') : '<span class="mq-vazio">nada entra aqui</span>') + '</div>' +
      '<div class="mq-col central" data-c="1">' + (p.tipo === 'empresa' ? '<div class="mq-bandeja grande" data-no="empresa" data-col="1"><span class="mq-bandeja-rot">' + glifo('empresa', 12) + 'EMPRESA · cada uma vê só o seu</span><span class="mq-frase">' + esc(p.frase) + '</span></div>' : pecaHtml(m, p, { grande: true, col: 1 })) + '</div>' +
      '<div class="mq-col" data-c="2">' + (sai.length ? sai.map(function (x) { var q = peca(m, x[1]); return q.tipo === 'empresa' ? '<div class="mq-bandeja mini" data-no="empresa" data-col="2"><span class="mq-bandeja-rot">EMPRESA</span></div>' : pecaHtml(m, q, { mini: true, col: 2 }); }).join('') : '<span class="mq-vazio">nada sai daqui</span>') + '</div>' + f.bolhas;
  }
  function trilhaHtml(m) {
    var partes = ['<button type="button" class="mq-trilha-item' + (m.zoom === 'inteira' ? ' atual' : '') + '" data-acao="mq-zoom" data-z="inteira">Máquina inteira</button>'];
    if (m.zoom === '3d') partes.push('<span class="mq-trilha-item atual">3D · peças e fios</span>');
    else if (m.zoom !== 'inteira') partes.push('<button type="button" class="mq-trilha-item' + (m.zoom === 'dominio' ? ' atual' : '') + '" data-acao="mq-zoom" data-z="dominio">' + esc(m.dominio ? nomeDom(m.dominio) : 'todas as peças') + '</button>');
    var s = m.zoom === 'peca' && m.sel && peca(m, m.sel);
    if (s) partes.push('<span class="mq-trilha-item atual">' + esc(s.nome) + '</span>');
    return '<nav class="mq-trilha" aria-label="Onde estou na Máquina">' + partes.join('<span class="mq-trilha-sep">›</span>') + '</nav>';
  }
  function ritoHtml(m) {
    var t = agora();
    if (!m.funcionandoEm || t - m.funcionandoEm > 12000) return '';
    return '<div class="mq-rito" role="status"' + luzAttrs({ cor: 'marca', t: m.funcionandoEm, mv: 3000 }) + '><span class="mq-rito-titulo">Máquina funcionando</span><small>' + (m.ritoN || 0) + ' peças com corpo · 2 testes · ' + U.hora(m.funcionandoEm) + '</small></div>';
  }
  /* a máquina ainda sem peça (app real): uma frase e o que fazer */
  function vaziaHtml(m) {
    return '<div class="mq-vazio-estado" role="note"><p class="mq-vazio-frase">A Máquina de ' + esc(nomeMaquina(m)) + ' ainda está vazia.</p>' +
      '<p class="mq-texto">Peça ao agente no terminal: ele lê o código do projeto e monta as peças aqui (gavetas, portas, robôs), assinadas. Ou monte a primeira pela vitrine das 16 peças.</p>' +
      '<div class="dem-acoes"><button class="botao primario" type="button" data-acao="mq-terminal">Pedir ao agente no terminal</button><button class="botao" type="button" data-acao="mq-painel" data-p="vitrine">Montar pela vitrine</button></div></div>';
  }
  function palcoHtml(m) {
    var sel = m.sel && peca(m, m.sel), zoom = m.zoom === 'peca' && !sel ? 'dominio' : m.zoom;
    var vazia = !m.pecas.length, tres = zoom === '3d';
    var mesa = vazia || tres ? '' : zoom === 'inteira' ? mesaInteira(m) : zoom === 'peca' ? mesaPeca(m, sel) : mesaDominio(m);
    var k = m.escala[zoom] || 0.86, tam = m.tam[zoom];
    var com = m.pecas.filter(function (p) { return p.tipo !== 'empresa' && (p.publicada || p.banco) && p.pronta; }).length, trac = m.pecas.filter(function (p) { return p.tipo !== 'empresa'; }).length - com;
    var nb = m.pecas.filter(bancoDaqui).length, nbFora = m.pecas.filter(function (p) { return p.banco && !bancoDaqui(p); }).length;
    var tabs = m.pecas.filter(function (p) { return bancoDaqui(p) && p.tipo === 'gaveta'; }).length, tabsFora = m.pecas.filter(function (p) { return p.banco && !bancoDaqui(p) && p.tipo === 'gaveta'; });
    var donosFora = tabsFora.map(function (p) { return L().nome(donoBanco(p)); }).filter(function (n, i, l) { return l.indexOf(n) === i; }).join(', ');
    var noBanco = [nb ? nb + ' no banco local' : '', nbFora ? nbFora + ' no banco de outra Estação' : ''].filter(Boolean).join(', ');
    var dentro = vazia ? vaziaHtml(m) : tres
      ? '<div class="mq-3d-lugar" aria-label="A Máquina inteira em 3D"></div><p class="mq-3d-legenda">' + com + ' peça' + (com === 1 ? '' : 's') + ' com corpo' + (noBanco ? ' (' + noBanco + ')' : '') + (trac ? ' · ' + trac + ' tracejada' + (trac === 1 ? '' : 's') + ' (publique para ganhar corpo)' : '') + ' · ' + m.fios.length + ' fio' + (m.fios.length === 1 ? '' : 's') + '</p>'
      : '<div class="mq-escala"' + (tam ? ' style="width:' + Math.ceil(tam[0] * k) + 'px;height:' + Math.ceil(tam[1] * k) + 'px"' : '') + '><div class="mq-mesa mq-mesa-' + zoom + '" style="transform:scale(' + k + ')">' + mesa + '</div></div>';
    return '<section class="mq-palco-caixa">' +
      '<div class="mq-barra">' + trilhaHtml(m) +
        '<span class="alternar mq-zoom" role="group" aria-label="Altura do zoom">' + [['inteira', 'Inteira'], ['dominio', 'Domínio'], ['peca', 'Peça'], ['3d', '3D']].map(function (z) { return '<button type="button" class="' + (zoom === z[0] ? 'ativo' : '') + '" data-acao="mq-zoom" data-z="' + z[0] + '"' + (z[0] === 'peca' && !sel ? ' title="Escolha uma peça (duplo clique)"' : z[0] === '3d' ? ' title="A Máquina inteira em 3D: as peças publicadas têm corpo, as novas ficam tracejadas"' : '') + '>' + z[1] + '</button>'; }).join('') + '</span>' +
        '<button class="botao discreto mq-pessoa' + (m.porPessoa ? ' ligado' : '') + '" type="button" data-acao="mq-pessoa" aria-pressed="' + !!m.porPessoa + '">por pessoa</button>' +
      '</div>' +
      '<div class="mq-palco' + (m.porPessoa ? ' por-pessoa' : '') + (tres && !vazia ? ' mq-palco-3d' : '') + (vazia ? ' mq-palco-vazio' : '') + '" data-zoom="' + zoom + '">' + dentro + '</div>' + ritoHtml(m) +
      '<div class="mq-casa" title="' + esc(INFO.casa.oque) + '">' + glifo('casa', 12) + '<b>CASA DE MÁQUINAS</b><span>' + (m.real ? (nb ? 'banco local deste computador (Postgres do projeto) · ' + tabs + ' tabela' + (tabs === 1 ? '' : 's') + (tabsFora.length ? ' · e ' + tabsFora.length + ' no banco local de ' + donosFora : '') + ' · a nuvem vem depois'
        : tabsFora.length ? 'este computador ainda não tem o banco deste projeto · ' + tabsFora.length + ' tabela' + (tabsFora.length === 1 ? '' : 's') + ' no banco local de ' + donosFora + ' · a nuvem vem depois'
        : 'sem banco ainda · peça ao agente para montar o banco do projeto: ele cria no Postgres local e as peças nascem aqui') : 'exemplo · pequena · 2 GB · São Paulo · cópia diária por 7 dias · sem volta no tempo · 90 conexões') + '</span></div>' +
    '</section>';
  }

  /* ---------- a coluna da direita: ficha da peça · teste · as 16 peças ---------- */
  /* diz onde a peça está hoje: no banco local (banco:true) ou só no desenho, e onde vai morar no banco (só com os dados da peça) */
  function ondeGuardado(m, p) {
    var slug = U.normalizar(p.nome).replace(/\s+/g, '_'), destino;
    if (p.banco) {
      var alvo = p.alvo && peca(m, p.alvo);
      var oque = p.tipo === 'gaveta' ? 'a tabela <code>' + esc(p.nome) + '</code>' : p.tipo === 'robo' ? 'o gatilho <code>' + esc(p.nome) + '</code>' + (alvo ? ' da tabela ' + esc(alvo.nome) : '') : p.tipo === 'porta' ? 'a função <code>' + esc(p.nome) + '</code>' : '<code>' + esc(p.nome) + '</code>';
      if (!bancoDaqui(p)) return 'Existe de verdade no banco local de ' + esc(L().nome(donoBanco(p))) + ' (a Estação dessa pessoa, outro computador): ' + oque + '. Este computador não tem esse banco: aqui a peça aparece para a equipe ver, e só a migração de lá muda ou tira ela. A migração fica em <code>projetos/' + esc(m.id) + '/banco/</code> da pasta compartilhada. Publicar (a subida para a nuvem) vem depois.';
      return 'Existe de verdade no banco local deste computador (Postgres do projeto): ' + oque + '. A migração que a criou fica em <code>projetos/' + esc(m.id) + '/banco/</code> da pasta compartilhada. Publicar (a subida para a nuvem) vem depois.';
    }
    switch (p.tipo) {
      case 'gaveta': destino = 'tabela <code>' + esc(slug) + '</code> no banco do projeto' + (naBandeja(m, p) ? ', cada linha com a marca da empresa' : ''); break;
      case 'porta': destino = 'função <code>funcoes/' + esc(slug) + '</code> no código do projeto; ' + (p.login === false ? '⚠ desenhada para responder a qualquer um' : 'desenhada para responder só a quem passou pela Portaria'); break;
      case 'robo': var al = p.alvo && peca(m, p.alvo); destino = 'gatilho no banco do projeto' + (al ? ', na gaveta ' + esc(al.nome) : ''); break;
      case 'deposito': destino = 'pasta de arquivos privada do projeto'; break;
      case 'cofre': destino = 'variáveis de ambiente e cofre do banco. O valor nunca aparece aqui: só o nome'; break;
      case 'tela': destino = '<code>telas/' + esc(slug) + '.html</code> no repositório do projeto'; break;
      case 'portaria': destino = 'login do projeto, com as senhas embaralhadas (hash); papéis: ' + esc((p.papeis || []).join(', ') || 'nenhum'); break;
      case 'cano': destino = 'canal ao vivo do projeto; não guarda nada, só avisa quem está com a tela aberta'; break;
      case 'empresa': destino = 'uma coluna com a marca da empresa em cada gaveta da bandeja e a chave que confere essa marca'; break;
      case 'carteiro': destino = 'configuração de e-mail do login; para mandar a clientes, ligar um remetente próprio'; break;
      default: destino = 'o projeto';
    }
    return (m.real ? 'Hoje: só o desenho da peça, no diário da equipe; ela ainda não existe no banco.' : 'Máquina de exemplo, sem banco.') + ' Quando ligar ao banco do projeto: ' + destino + '.';
  }
  function fichaPeca(m, p) {
    var pessoa = L().pessoa(p.por), ult = m.linha.slice().reverse().filter(function (l) { return l.peca === p.id || l.texto.indexOf(p.nome) !== -1; })[0], T = m.teste, info = INFO[p.tipo] || {};
    var chips = [p.banco ? seloBanco(p) + (p.tipo === 'gaveta' && contagemDe(m.id, p.id) != null ? ' · ' + linhasTxt(contagemDe(m.id, p.id)) : '') : '', !p.pronta ? 'em construção' : !p.publicada ? (p.banco ? 'ainda não publicada (a nuvem vem depois)' : 'no local · falta publicar') : 'publicada', p.corpo ? 'com corpo' : '', p.testadaEm ? '✓ passou no teste ' + U.hora(p.testadaEm) : '', suja(p) ? 'mudou depois do teste' : ''].filter(Boolean);
    var img = p.corpo && imagemDe(p.tipo, true);
    return '<div class="mq-ficha-peca">' +
      '<div class="secao-cab"><span class="rotulo mq-ficha-tipo">' + glifo(p.tipo, 14) + esc(TIPOS[p.tipo] || 'Peça') + '</span><button class="botao discreto" type="button" data-acao="mq-sel" data-id="" aria-label="Fechar a ficha">✕</button></div>' +
      '<h2 class="mq-ficha-nome">' + esc(p.nome) + '</h2><p class="mq-ficha-frase">' + esc(p.frase || '') + '</p>' +
      '<p class="mq-chips-estado">' + chips.map(function (c) { return '<span class="chip">' + esc(c) + '</span>'; }).join('') + '</p>' +
      (img ? '<img class="mq-ficha-img' + (/\.jpe?g($|\?)/i.test(img) ? ' escuro' : '') + '" src="' + esc(img) + '" alt="">' : '') +
      (alertaDe(m, p) ? '<p class="mq-ficha-alerta">' + glifo('alerta', 14) + esc(alertaDe(m, p)) + '</p>' : '') +
      '<span class="rotulo">O que é</span><p class="mq-texto">' + esc(info.oque || p.frase || '') + '</p>' +
      '<span class="rotulo">Onde fica guardado</span><p class="mq-onde">' + ondeGuardado(m, p) + '</p>' +
      (p.campos && p.tipo === 'gaveta' ? '<span class="rotulo">Campos</span><div class="mq-campos ficha">' + p.campos.map(function (c) { return campoHtml(c); }).join('') + '</div>' : '') +
      /* a chave e o "quando" da peça do banco vêm do banco (RLS, gatilho): a ficha mostra, quem muda é a migração */
      (p.tipo === 'gaveta' && p.banco ? '<span class="rotulo">Chave · quem pode ver e mexer</span><p class="mq-texto">' + esc(p.chave || '') + ' · resumo da regra real do banco (RLS); a regra inteira está na frase da gaveta. Para mudar, peça ao agente' + (bancoDaqui(p) ? '' : ' de ' + esc(L().nome(donoBanco(p))) + ' (o banco é de lá)') + ': ele muda no banco e a chave acompanha.</p>' : '') +
      (p.tipo === 'robo' && p.banco ? '<span class="rotulo">Quando</span><p class="mq-texto">' + esc(p.quando || '') + ' · vem do gatilho real do banco.</p>' : '') +
      (p.tipo === 'gaveta' && !p.banco ? '<span class="rotulo">Chave · quem pode ver e mexer</span><div class="alternar mq-chaves">' + ['cada empresa vê só o seu', 'só o dono', 'todos leem, só o dono muda', '⚠ aberta para todos'].map(function (c) { return '<button type="button" class="' + (p.chave === c || (c === 'cada empresa vê só o seu' && /empresa/.test(p.chave || '') && !/⚠/.test(p.chave || '')) ? 'ativo' : '') + '" data-acao="mq-chave" data-id="' + esc(p.id) + '" data-c="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>' : '') +
      (p.tipo === 'robo' && !p.banco ? '<span class="rotulo">Quando</span><div class="alternar">' + ['quando entra', 'quando muda', 'todo dia às 08:00'].map(function (q) { return '<button type="button" class="' + ((p.quando || 'quando entra') === q ? 'ativo' : '') + '" data-acao="mq-quando" data-id="' + esc(p.id) + '" data-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div>' : '') +
      (p.tipo === 'cofre' ? '<span class="rotulo">Chaves</span><ul class="mq-lista mq-cofre-lista">' + (p.chaves || []).map(function (k) { return '<li><i class="mq-led ' + (k.ok ? 'ok' : 'falta') + '"></i><code>' + esc(k.nome) + '</code> ' + (k.ok ? '<span class="mq-ok">entregue</span>' : '<button class="botao discreto" type="button" data-acao="mq-cofre" data-id="' + esc(p.id) + '" data-k="' + esc(k.nome) + '">' + (L().eu === p.por ? 'marcar entregue' : 'pedir ao ' + esc(L().nome(p.por))) + '</button>') + '</li>'; }).join('') + '</ul>' : '') +
      (p.tipo === 'porta' ? '<span class="rotulo">Recebe</span><p class="mq-texto">' + esc(camposPorta(p).join(', ')) + ' · ' + (verboDe(p) === 'DEVOLVE' ? 'devolve muitos (três traços)' : 'grava um registro (círculo)') + '</p>' : '') +
      (T && T.status[p.id] ? '<span class="rotulo">O que chegou no último teste</span><p class="mq-texto">' + esc(T.log.filter(function (l) { return l.peca === p.id; }).map(function (l) { return l.texto; }).join(' · ') || T.status[p.id]) + '</p>' : '') +
      (T && T.linhaNova && T.linhaNova.gaveta === p.id ? '<div class="mq-linha-nova"><b>linha que acabou de entrar</b><span>' + esc(T.linhaNova.texto) + '</span></div>' : '') +
      '<span class="rotulo">Quem mexeu</span><p class="pagina-sub">' + (pessoa ? U.avatar(pessoa, 18) + ' ' + esc(pessoa.nome) : '') + (ult ? ' · ' + esc(ult.texto) + ' · ' + U.relativo(ult.ts) : '') + '</p>' +
      '<p class="mq-porbaixo">por baixo: ' + esc(POR_BAIXO[p.tipo] || '') + '</p>' +
      '<div class="dem-acoes">' + (m.zoom !== 'peca' ? '<button class="botao" type="button" data-acao="mq-perto" data-id="' + esc(p.id) + '">Ver de perto</button>' : '') + (BC.pecas && typeof BC.pecas.vitrine === 'function' ? '<button class="botao" type="button" data-acao="mq-3d" data-t="' + esc(p.tipo) + '">Ver em 3D</button>' : '') + '<button class="botao" type="button" data-acao="mq-explicar" data-id="' + esc(p.id) + '">Explicar com o agente</button><button class="botao" type="button" data-acao="mq-pedir" data-id="' + esc(p.id) + '">Pedir para alguém</button></div>' +
    '</div>';
  }
  function resumoHtml(m) {
    var als = m.pecas.filter(function (p) { return alertaDe(m, p); }), hoje = pontosHoje(m), func = m.funcionandoAss && m.funcionandoAss === assinatura(m);
    return '<div class="mq-resumo">' +
      '<span class="rotulo">Esta máquina</span>' +
      '<p class="mq-texto">' + (func ? '<b class="mq-ok">funcionando</b> desde ' + U.hora(m.funcionandoEm) : m.testeOkEm ? 'testada às ' + U.hora(m.testeOkEm) + '; falta testar como a outra empresa' : 'ainda não testada nesta sessão') + ' · v' + m.versao + ' · ' + m.pecas.length + ' peças</p>' +
      (als.length ? '<span class="rotulo">Alertas</span><ul class="mq-alertas">' + als.map(function (p) { return '<li><button type="button" class="mq-link" data-acao="mq-sel" data-id="' + esc(p.id) + '">' + glifo(p.tipo, 14) + '<b>' + esc(p.nome) + '</b> ' + esc(alertaDe(m, p)) + '</button></li>'; }).join('') + '</ul>' : '') +
      '<span class="rotulo">Pontos com origem · hoje ' + hoje + '</span>' +
      (m.pontos.length ? '<ul class="mq-pontos">' + m.pontos.slice(0, 6).map(function (x) { return '<li><b>+' + x.pts + '</b> ' + esc(x.origem) + ' · ' + U.hora(x.t) + '</li>'; }).join('') + '</ul>' : '<p class="form-ajuda">Nenhum ainda. Teste a máquina: +6 quando passa, +2 quando o cadeado barra a outra empresa, +12 quando ela fica funcionando. Nunca por tempo.</p>') +
      (m.real ? '' : '<span class="rotulo">Ferramentas ligadas</span><p class="mq-ferramentas">' + [['agenda (cron)', true], ['avisos ao vivo', true], ['busca por parecido', false], ['mapa', false]].map(function (f) { return '<span class="' + (f[1] ? 'on' : '') + '">' + glifo('ferramenta', 12) + esc(f[0]) + '</span>'; }).join('') + '</p>') +
      '<p class="form-ajuda">Clique numa peça para ver o que ela é e onde fica guardado; duplo clique para ver de perto. Testar manda um pedido pelos fios.</p>' +
    '</div>';
  }
  function testeForm(m) {
    var ps = portas(m), porta = portaPadrao(m);
    if (!porta) return '<p class="vazio">Nenhuma porta pronta para testar.</p>';
    var d = dadosPadrao(m, porta), rodando = m.teste && m.teste.rodando;
    return '<form class="mq-teste-form" data-form="mq-testar">' +
      '<label class="mq-campo-form"><span>Pela porta</span><select id="mq-t-porta" data-acao-mudar="mq-t-porta">' + ps.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === porta.id ? ' selected' : '') + '>' + esc(p.nome) + '</option>'; }).join('') + '</select></label>' +
      camposPorta(porta).map(function (c, i) { return '<label class="mq-campo-form"><span>' + esc(c) + '</span><input type="text" id="mq-t-c-' + porta.id + '-' + i + '" data-campo="' + esc(c) + '" value="' + esc(d[c]) + '" autocomplete="off"></label>'; }).join('') +
      '<fieldset class="mq-como"><legend>Como quem</legend>' + [['as-duas', QM().ana.nome + ' e depois a outra empresa'], ['ana', QM().ana.nome + ' · ' + QM().ana.empresa], ['outra', QM().outra.nome + ' · ' + QM().outra.empresa + ' (a outra empresa)']].map(function (o) { return '<label><input type="radio" name="mq-t-como" value="' + o[0] + '" data-acao-mudar="mq-t-como"' + ((m.testeComo || 'as-duas') === o[0] ? ' checked' : '') + '> ' + esc(o[1]) + '</label>'; }).join('') + '</fieldset>' +
      '<button class="botao primario" type="submit"' + (rodando || m.ambiente === 'produção' ? ' disabled' : '') + '>' + (m.ambiente === 'produção' ? 'Produção não tem teste' : rodando ? 'Testando…' : 'Enviar pelo fio') + '</button>' +
      '<p class="form-ajuda">Simulação sobre o desenho: o pedido anda pelos fios e as chaves decidem quem passa. Nenhum banco recebe nada.</p>' +
    '</form>';
  }
  function testeLog(m) {
    var T = m.teste;
    if (!T) return '';
    return '<div class="mq-teste-log">' +
      '<span class="rotulo">Teste simulado em ' + esc(m.ambiente) + (T.rodando ? ' · andando' : ' · terminou') + '</span>' +
      '<ol aria-live="polite">' + T.log.map(function (l, i) { return '<li class="' + (l.cor || '') + (i === T.log.length - 1 && T.rodando ? ' atual' : '') + '">' + esc(l.texto) + '</li>'; }).join('') + '</ol>' +
      (T.linhaNova ? '<div class="mq-linha-nova"><b>linha que entrou</b><span>' + esc(T.linhaNova.texto) + '</span></div>' : '') +
      (T.barrado ? '<p class="mq-barrado">' + glifo('barrado', 14) + '<span><b>0 passaram · 1 barrado pela chave.</b> É assim que a equipe entende quem vê o quê, sem saber o nome técnico.</span></p>' : '') +
      (T.vazouFim ? '<p class="mq-ficha-alerta">' + glifo('alerta', 14) + 'A outra empresa passou. Feche a chave da gaveta e teste de novo.</p>' : '') +
      (T.pontos.length ? '<ul class="mq-pontos">' + T.pontos.map(function (x) { return '<li' + (x.repetido ? ' class="repetido"' : '') + '><b>+' + x.pts + '</b> ' + esc(x.origem) + (x.repetido ? ' · já contou (nada mudou desde o último teste)' : '') + '</li>'; }).join('') + '</ul>' : '') +
      (T.passou ? '<div class="mq-funcionou">✓ Passou: o pedido andou pela máquina' + (T.barrado ? ' e o cadeado barrou a outra empresa.' : '.') + ' <button class="botao primario" type="button" data-acao="mq-preset-form">Salvar como preset</button>' + (!T.barrado && !T.rodando ? '<button class="botao" type="button" data-acao="mq-testar-outra">Testar como a outra empresa</button>' : '') + '</div>' : '') +
      (T.erro ? '<p class="mq-ficha-alerta">O teste parou: ' + esc(T.erro) + '</p>' : '') +
      '<button class="botao discreto" type="button" data-acao="mq-teste-fechar">fechar</button>' +
    '</div>';
  }
  function vitrineHtml(m) {
    var sel = m.tipoSel && INFO[m.tipoSel];
    var cont = {};
    m.pecas.forEach(function (p) { cont[p.tipo] = (cont[p.tipo] || 0) + 1; });
    var aqui = { campo: m.pecas.reduce(function (s, p) { return s + (p.campos && p.tipo === 'gaveta' ? p.campos.length : 0); }, 0), fio: m.fios.length, chave: cont.gaveta || 0, armario: 1, ferramenta: 2, casa: 1 };
    var detalhe = '';
    if (sel) {
      var n = cont[sel.id] || aqui[sel.id] || 0, img = imagemDe(sel.id, true);
      /* as ações vêm logo abaixo do nome (o painel é baixo: antes a imagem grande empurrava "Montar uma" para fora da vista) */
      var recem = m.vitrineAviso && m.vitrineAviso.tipo === sel.id && agora() - m.vitrineAviso.t < 30000 && peca(m, m.vitrineAviso.id) ? m.vitrineAviso : null;
      detalhe = '<div class="mq-vitrine-detalhe' + (img ? ' com-img' : '') + '">' + (img ? '<img class="mq-ficha-img mq-vitrine-img' + (/\.jpe?g($|\?)/i.test(img) ? ' escuro' : '') + '" src="' + esc(img) + '" alt="">' : '') +
        '<div class="mq-vitrine-cab"><h3>' + glifo(sel.id, 16) + esc(sel.nome) + '</h3><p class="mq-texto">' + esc(sel.oque) + '</p>' +
        '<p class="mq-texto">Nesta máquina: <b>' + (n || 'nenhuma') + '</b></p>' +
        '<div class="dem-acoes">' + (sel.monta ? '<button class="botao primario" type="button" data-acao="mq-montar-tipo" data-t="' + sel.id + '">Montar uma</button>' : '') + (cont[sel.id] ? '<button class="botao" type="button" data-acao="mq-ver-tipo" data-t="' + sel.id + '">Ver nesta máquina</button>' : '') + (BC.pecas && typeof BC.pecas.vitrine === 'function' ? '<button class="botao" type="button" data-acao="mq-3d" data-t="' + sel.id + '">Ver em 3D</button>' : '') + '</div>' +
        (recem ? '<p class="mq-vitrine-aviso" role="status"><b>' + esc(recem.nome) + '</b> entrou no palco, tracejada: é só o desenho da peça e ganha corpo ao publicar. <button class="mq-link" type="button" data-acao="mq-ver-tipo" data-t="' + sel.id + '" data-id="' + esc(recem.id) + '">ver no palco</button></p>' : '') + '</div>' +
        '<p class="mq-texto mq-vitrine-extra"><span class="rotulo">Como aparece</span> ' + esc(sel.forma) + '</p><p class="mq-porbaixo mq-vitrine-extra">por baixo: ' + esc(sel.porBaixo) + '</p></div>';
    }
    return '<div class="mq-vitrine"><p class="form-ajuda">As 16 peças cobrem o backend inteiro. Cada uma com nome de gente; o nome técnico fica pequeno.</p>' + detalhe +
      '<div class="mq-vitrine-grade">' + PECAS.map(function (p) {
        var n = cont[p.id] || aqui[p.id] || 0;
        return '<button type="button" class="mq-vitrine-item' + (m.tipoSel === p.id ? ' sel' : '') + '" data-acao="mq-tipo" data-t="' + p.id + '">' + glifo(p.id, 20) + '<b>' + esc(p.nome) + '</b><small>' + esc(p.oque) + '</small><span class="mq-vitrine-n">' + (n ? n + ' aqui' : '—') + '</span></button>';
      }).join('') + '</div></div>';
  }
  function modoHtml(m) {
    if (m.modo === 'muda') return '<div class="mq-modo cartao"><div class="secao-cab"><span class="rotulo">O que muda · ainda não publicado</span><button class="botao discreto" type="button" data-acao="mq-modo" data-m="ver" aria-label="Fechar">✕</button></div>' + (m.mudancas.length ? '<ul class="mq-lista">' + m.mudancas.map(function (x, i) { return '<li>' + esc(x) + ' <button class="botao discreto" type="button" data-acao="mq-sql" data-i="' + i + '">ver esboço</button></li>'; }).join('') + '</ul>' : '<p class="vazio">Nada para publicar: tudo já está publicado para a equipe.</p>') + '</div>';
    if (m.modo === 'publicar') { var novas = m.pecas.filter(function (p) { return !p.publicada; }).length; return '<div class="mq-modo cartao"><div class="secao-cab"><span class="rotulo">Publicar · v' + (m.versao + 1) + '</span><button class="botao discreto" type="button" data-acao="mq-modo" data-m="ver" aria-label="Fechar">✕</button></div><p class="pagina-sub">' + (m.mudancas.length ? m.mudancas.length + ' mudança(s): ' + esc(m.mudancas.join('; ')) : 'nada a publicar') + '. Publicar marca as peças como publicadas para a equipe (as outras telas e a TV veem). Nenhum banco nem servidor muda: isso entra quando a Máquina for ligada ao banco do projeto.' + (novas ? ' ' + novas + ' peça(s) tracejada(s) ganham corpo.' : '') + '</p>' + (m.mudancas.length ? '<form class="campo-inline" data-form="mq-publicar"><input type="text" id="mq-confirma" placeholder="digite o nome do projeto para confirmar" autocomplete="off"><button class="botao primario" type="submit">Publicar</button></form>' : '') + '</div>'; }
    if (m.modo === 'preset') return '<div class="mq-modo cartao"><div class="secao-cab"><span class="rotulo">Salvar como preset da equipe</span><button class="botao discreto" type="button" data-acao="mq-modo" data-m="ver" aria-label="Fechar">✕</button></div><form class="mq-preset-form" data-form="mq-preset"><input type="text" id="mq-preset-nome" placeholder="Nome do preset (ex.: Agendamento com lembrete)" required autocomplete="off"><input type="text" id="mq-preset-desc" placeholder="O que ele faz, em uma linha"><p class="form-ajuda">Guarda as ' + m.pecas.filter(function (p) { return p.tipo !== 'empresa' && p.tipo !== 'cofre'; }).length + ' peças desta Máquina e os fios entre elas. Qualquer pessoa usa em qualquer projeto.</p><div><button class="botao primario" type="submit">Guardar preset</button></div></form></div>';
    return '';
  }
  /* a ficha recolhida (só no estreito) vira uma legenda: a peça escolhida, ou o teste andando/terminado */
  function linhaRecolhida(m, p, painel) {
    var T = m.teste;
    if (painel === 'teste' && T) {
      var ult = T.log[T.log.length - 1] || { texto: '' }, soma = T.pontos.filter(function (x) { return !x.repetido; }).reduce(function (a, x) { return a + x.pts; }, 0);
      var txt = T.rodando ? ult.texto : (T.barrado ? '0 passaram · 1 barrado pela chave' : T.passou ? '✓ passou pelo login até a tela' : ult.texto) + (soma ? ' · +' + soma : '');
      return '<div class="mq-ficha-linha teste' + (T.rodando ? ' andando' : '') + '" role="status" aria-live="polite">' + glifo(T.barrado && !T.rodando ? 'barrado' : 'fio', 14) + '<b>Teste</b>' +
        (!T.rodando && T.passou && !T.barrado ? '<button class="botao discreto" type="button" data-acao="mq-testar-outra">como a outra empresa</button>' : '') +
        '<button class="botao discreto" type="button" data-acao="mq-ficha-alternar">abrir ▴</button><span class="mq-legenda-txt">' + esc(txt) + '</span></div>';
    }
    if (!p) return '';
    return '<button type="button" class="mq-ficha-linha" data-acao="mq-ficha-alternar">' + glifo(p.tipo, 14) + '<b>' + esc(p.nome) + '</b><span class="mq-legenda-txt">' + esc(alertaDe(m, p) || (INFO[p.tipo] || {}).oque || p.frase || '') + '</span><em>abrir a ficha ▴</em></button>';
  }
  function fichaHtml(m) {
    var p = m.sel && peca(m, m.sel), painel = m.painel || 'ficha', corpo;
    if (painel === 'teste') corpo = m.teste ? testeLog(m) + testeForm(m) : testeForm(m);
    else if (painel === 'vitrine') corpo = vitrineHtml(m);
    else corpo = p ? fichaPeca(m, p) : resumoHtml(m);
    return '<aside class="mq-ficha' + (m.fichaAberta ? '' : ' recolhida') + '" aria-label="Ficha da Máquina">' +
      '<div class="mq-ficha-topo"><div class="alternar mq-ficha-abas" role="tablist">' + [['ficha', p ? 'Ficha · ' + p.nome : 'Ficha'], ['teste', 'Teste'], ['vitrine', '16 peças']].map(function (a) { return '<button type="button" role="tab" aria-selected="' + (painel === a[0]) + '" class="' + (painel === a[0] ? 'ativo' : '') + '" data-acao="mq-painel" data-p="' + a[0] + '">' + esc(a[1]) + '</button>'; }).join('') + '</div>' +
      '<button type="button" class="botao discreto mq-ficha-alternar" data-acao="mq-ficha-alternar" aria-expanded="' + !!m.fichaAberta + '" aria-label="' + (m.fichaAberta ? 'Recolher a ficha' : 'Abrir a ficha') + '">' + (m.fichaAberta ? '▾' : '▴') + '</button></div>' +
      (!m.fichaAberta && estreito() ? linhaRecolhida(m, p, painel) : '') +
      modoHtml(m) + '<div class="mq-ficha-corpo">' + corpo + '</div></aside>';
  }
  function topoHtml(m) {
    var pj = m.pj, als = m.pecas.filter(function (p) { return alertaDe(m, p); }).length, func = m.funcionandoAss && m.funcionandoAss === assinatura(m);
    return '<header class="mq-topo"><div class="mq-titulo"><h1 class="pagina-titulo">' + glifo('maquina', 18) + 'Máquina · ' + esc(nomeMaquina(m)) + '</h1>' +
      '<p class="mq-sub"><span class="alternar mq-amb-alt" role="group" aria-label="Ambiente">' + ['local', 'branch', 'produção'].map(function (a) { return '<button type="button" class="mq-amb ' + a + (m.ambiente === a ? ' ativo' : '') + '" data-acao="mq-amb" data-a="' + a + '">' + a + (m.ambiente === a ? ' ●' : '') + '</button>'; }).join('') + '</span> v' + m.versao + ' · ' + m.pecas.length + ' peças · ' + als + ' alerta' + (als === 1 ? '' : 's') + (m.mudancas.length ? ' · <b class="mq-pendente">' + m.mudancas.length + ' mudança(s) não publicada(s)</b>' : '') + (func ? ' · <b class="mq-ok">funcionando</b>' : '') + '</p></div>' +
      '<div class="dem-acoes mq-acoes">' +
        '<button class="botao primario mq-testar" type="button" data-acao="mq-testar-abrir"' + (m.ambiente === 'produção' ? ' disabled title="Nunca em produção"' : '') + '>Testar</button>' +
        '<button class="botao" type="button" data-acao="mq-publicar">Publicar' + (m.mudancas.length ? ' · ' + m.mudancas.length : '') + '</button>' +
        '<button class="botao" type="button" data-acao="mq-muda">O que muda</button>' +
        (m.real ? '' : '<button class="botao" type="button" data-acao="mq-montar">▶ Ver o agente montando</button>') +
        '<button class="botao discreto" type="button" data-acao="mq-tv">Projetar na TV</button>' +
      '</div></header>';
  }

  function semProjetoHtml() {
    return '<div class="mq mq2 mq-sem-projeto" data-pj=""><header class="mq-topo"><div class="mq-titulo"><h1 class="pagina-titulo">' + glifo('maquina', 18) + 'Máquina</h1><p class="mq-sub">o backend de cada projeto, em peças com nome de gente</p></div></header>' +
      '<div class="mq-vazio-estado" role="note"><p class="mq-vazio-frase">Ainda não há projeto na equipe, então não há Máquina para mostrar.</p>' +
      '<p class="mq-texto">Crie um projeto e a Máquina dele nasce vazia, pronta para as peças. Ou peça ao agente no terminal: "cria o projeto X e monta a Máquina dele a partir do código".</p>' +
      '<div class="dem-acoes"><button class="botao primario" type="button" data-acao="pj-novo-form">＋ Criar projeto</button><button class="botao" type="button" data-acao="mq-terminal">Pedir ao agente no terminal</button></div></div></div>';
  }
  BC.vistas.maquina = {
    lateral: function () {
      var tab = BC.estacao.abaAtual(), eReal = real(), m = tab.tipo === 'maquina' && tab.ref && (!eReal || projetoDe(tab.ref)) ? maquinaDe(tab.ref) : null;
      var pjs = L().estado.projetos || [];
      var linha = m ? m.linha.slice().reverse() : [], filtro = m && m.sel && peca(m, m.sel);
      if (filtro) linha = linha.filter(function (l) { return l.peca === filtro.id || l.texto.indexOf(filtro.nome) !== -1; });
      return '<div class="lat-titulo"><span class="rotulo">Máquina · backend visual</span></div><p class="lat-nota">O backend de cada projeto em peças de montar, com nome de gente. Escolha o projeto:</p><ul class="lat-lista">' + (pjs.length ? '' : eReal ? '<li><span class="lat-nota">Nenhum projeto ainda: crie um e a Máquina dele aparece aqui.</span></li>' : '<li><button class="lat-item" type="button" data-acao="pj-maquina" data-id="clinicas" aria-current="' + !!(m && !m.pj) + '"><span class="rotulo-texto mq-lat-pj">' + glifo('maquina', 14) + esc(EXEMPLO) + '</span></button></li>') + pjs.map(function (p) { return '<li><button class="lat-item" type="button" data-acao="pj-maquina" data-id="' + p.id + '" aria-current="' + !!(m && m.pj && m.pj.id === p.id) + '"><span class="rotulo-texto mq-lat-pj">' + glifo('maquina', 14) + esc(p.nome) + '</span></button></li>'; }).join('') + '</ul>' +
        (m ? '<div class="lat-titulo"><span class="rotulo">Linha do tempo' + (filtro ? ' · ' + esc(filtro.nome) : '') + '</span>' + (filtro ? '<button class="botao discreto" type="button" data-acao="mq-sel" data-id="">todas</button>' : '<span class="conta">' + m.linha.length + '</span>') + '</div><ul class="mq-linha">' + linha.slice(0, 8).map(function (l) { return '<li>' + U.avatar(L().pessoa(l.quem), 16) + '<span>' + esc(l.texto) + '</span><time>' + U.relativo(l.ts) + '</time></li>'; }).join('') + (linha.length ? '' : '<li><span class="lat-nota">' + (filtro ? 'Nada ainda nesta peça.' : 'Nada ainda: a linha do tempo começa quando a primeira peça entrar.') + '</span></li>') + '</ul>' : '') +
        M.presetsHtml(m) +
        '<p class="lat-nota">A Máquina é o desenho do backend da equipe: o agente monta as peças pelo conector e elas ficam no diário da equipe. Testar é uma simulação pelos fios; "Publicar" marca as peças para a equipe. As peças com o selo "no banco local" existem de verdade no Postgres de uma Estação (o agente monta o banco pelo conector): sem nome, neste computador; "no banco local de Davi", no computador dessa pessoa. As outras são só desenho. A nuvem entra depois. ' + (eReal ? 'Peça ao agente no terminal: "monta a Máquina deste projeto a partir do código".' : 'Peça no terminal: "cria uma gaveta de retornos separada por clínica com um robô de lembrete".') + '</p>';
    },
    conteudo: function (tab) {
      if (real()) {
        /* app real: só projeto de verdade; sem projeto, o estado vazio (nada de máquina de exemplo) */
        var ref = refReal(tab.ref);
        if (ref !== tab.ref) { tab.ref = ref; tab.titulo = 'Máquina' + (ref ? ' · ' + projetoDe(ref).nome : ''); }
        if (!ref) return semProjetoHtml();
      } else if (!tab.ref) { tab.ref = ((L().estado.projetos || [])[0] || {}).id || 'clinicas'; }
      var m = maquinaDe(tab.ref);
      /* a rolagem do palco é lida antes de o conteúdo ser trocado (evento de rolagem pode nem chegar com a janela escondida) */
      var velho = document.querySelector('#e-conteudo .mq2[data-pj="' + String(tab.ref).replace(/"/g, '') + '"] .mq-palco');
      if (velho && velho.getAttribute('data-zoom')) m.rolagem[velho.getAttribute('data-zoom')] = [velho.scrollLeft, velho.scrollTop];
      return '<div class="mq mq2' + (m.porPessoa ? ' por-pessoa' : '') + '" data-pj="' + esc(tab.ref) + '">' + topoHtml(m) +
        '<div class="mq-corpo' + (m.fichaAberta ? '' : ' ficha-recolhida') + '">' + palcoHtml(m) + fichaHtml(m) + '</div>' +
        '<footer class="mq-rodape">' + m.linha.slice(-3).map(function (l) { return '<span>' + U.hora(l.ts) + ' ' + esc(l.texto) + '</span>'; }).join('') + '</footer></div>';
    }
  };

  /* ================================================================== ações */
  /* o redesenho troca o nó entre os dois cliques, e o navegador não junta os dois num duplo clique: a Máquina junta (450 ms, mesma peça) */
  var ultimoClique = { id: null, t: 0 };
  A['mq-sel'] = function (el) { var m = mAtual(); if (!m) return; var id = el.dataset.id || null, t = agora(), duplo = !!(id && ultimoClique.id === id && t - ultimoClique.t < 450 && el.classList && el.classList.contains('mq-peca')); ultimoClique = { id: id, t: duplo ? 0 : t }; m.sel = id; if (id) { m.painel = 'ficha'; if (!estreito()) m.fichaAberta = true; } if (duplo) { m.zoom = 'peca'; m.fichaAberta = true; BC.estacao.render(); return; } if (!id && m.zoom === 'peca') m.zoom = 'dominio'; BC.estacao.render(); };
  A['mq-perto'] = function (el) { var m = mAtual(); if (!m) return; m.sel = el.dataset.id; m.zoom = 'peca'; m.fichaAberta = true; BC.estacao.render(); };
  A['mq-zoom'] = function (el) {
    var m = mAtual(); if (!m) return;
    var z = el.dataset.z;
    if (z === 'peca' && !(m.sel && peca(m, m.sel))) { var pr = m.pecas.filter(function (p) { return p.tipo === 'gaveta'; })[0] || m.pecas[0]; m.sel = pr ? pr.id : null; }
    if (z === 'dominio' && m.zoom === 'dominio') m.dominio = null;
    m.zoom = z;
    BC.estacao.render();
  };
  A['mq-dominio'] = function (el) { var m = mAtual(); if (!m) return; m.dominio = el.dataset.d || null; m.zoom = 'dominio'; BC.estacao.render(); };
  A['mq-painel'] = function (el) { var m = mAtual(); if (!m) return; m.fichaAberta = !(m.fichaAberta && m.painel === el.dataset.p) || !estreito(); m.painel = el.dataset.p; BC.estacao.render(); };
  A['mq-ficha-alternar'] = function () { var m = mAtual(); if (!m) return; m.fichaAberta = !m.fichaAberta; BC.estacao.render(); };
  function estreito() { var r = document.querySelector('.mq2'); return !!(r && r.clientWidth < 920); }
  A['mq-amb'] = function (el) { var m = mAtual(); if (m) { m.ambiente = el.dataset.a; if (m.teste && m.teste.rodando) m.teste.cancelado = true; m.teste = null; BC.estacao.render(); } };
  A['mq-pessoa'] = function () { var m = mAtual(); if (m) { m.porPessoa = !m.porPessoa; BC.estacao.render(); } };
  A['mq-testar-abrir'] = function () { var m = mAtual(); if (!m || m.ambiente === 'produção') return; m.painel = 'teste'; m.modo = 'ver'; m.fichaAberta = true; BC.estacao.render(); var b = document.querySelector('.mq-teste-form button[type="submit"]'); if (b && !b.disabled) b.focus(); };
  /* sem formulário (roteiro, receitas): testa pela porta padrão, como Ana e depois como a outra empresa */
  A['mq-testar'] = function () { var m = mAtual(); if (!m || m.ambiente === 'produção') return; M.testar(m, { como: 'as-duas' }); aviso('Teste em ' + m.ambiente + ': veja o pedido andar pelos fios.'); };
  A['mq-testar-outra'] = function () { var m = mAtual(); if (!m || !m.teste) return; M.testar(m, { como: 'outra', porta: m.teste.porta, dados: m.teste.dados }); };
  A['mq-t-porta'] = function (el) { var m = mAtual(); if (m) { m.testePorta = el.value; BC.estacao.render(); } };
  A['mq-t-como'] = function (el) { var m = mAtual(); if (m) m.testeComo = el.value; };
  BC.formularios['mq-testar'] = function (f) {
    var m = mAtual(); if (!m) return;
    var sel = f.querySelector('#mq-t-porta'), porta = sel ? sel.value : null, dados = {};
    f.querySelectorAll('input[data-campo]').forEach(function (i) { dados[i.getAttribute('data-campo')] = i.value.trim() || 'exemplo'; });
    var como = (f.querySelector('input[name="mq-t-como"]:checked') || {}).value || m.testeComo || 'as-duas';
    m.testeComo = como;
    if (porta) { m.testeDados = m.testeDados || {}; m.testeDados[porta] = dados; }
    M.testar(m, { porta: porta, como: como, dados: dados });
  };
  A['mq-teste-fechar'] = function () { var m = mAtual(); if (m) { if (m.teste) m.teste.cancelado = true; m.teste = null; m.painel = 'ficha'; BC.estacao.render(); } };
  A['mq-tipo'] = function (el) {
    var m = mAtual(); if (!m) return;
    m.tipoSel = m.tipoSel === el.dataset.t ? null : el.dataset.t; m.painel = 'vitrine'; m.fichaAberta = true; BC.estacao.render();
    requestAnimationFrame(function () { var c = document.querySelector('.mq2 .mq-ficha-corpo'); if (c) c.scrollTop = 0; });
  };
  A['mq-ver-tipo'] = function (el) {
    var m = mAtual(); if (!m) return;
    var doTipo = m.pecas.filter(function (x) { return x.tipo === el.dataset.t; }), i = doTipo.map(function (x) { return x.id; }).indexOf(m.sel);
    var p = (el.dataset.id && peca(m, el.dataset.id)) || (i > 0 ? doTipo[i - 1] : doTipo[doTipo.length - 1]);
    if (!p) return;
    m.sel = p.id; m.painel = 'ficha'; m.fichaAberta = true; m.zoom = m.zoom === 'inteira' ? 'dominio' : m.zoom;
    if (m.dominio && m.dominio !== (p.dom || 'novas')) m.dominio = null; /* dentro de outro domínio a peça não apareceria */
    acender(p, 't0', 4000); BC.estacao.render();
    requestAnimationFrame(function () { mostrarNoPalco(m, p.id); });
  };
  A['mq-montar-tipo'] = function (el) {
    var m = mAtual(); if (!m) return;
    var daVitrine = m.painel === 'vitrine', p = M.montarTipo(m, el.dataset.t);
    if (!p) return;
    if (!daVitrine) { aviso(TIPOS[el.dataset.t] + ' entrou tracejada: é só o desenho da peça e ganha corpo ao publicar. Nenhuma migração é escrita pela Máquina.'); return; }
    m.painel = 'vitrine'; m.fichaAberta = true; m.tipoSel = p.tipo;
    m.vitrineAviso = { tipo: p.tipo, id: p.id, nome: p.nome, t: agora() };
    BC.estacao.render();
    requestAnimationFrame(function () { mostrarNoPalco(m, p.id); var c = document.querySelector('.mq2 .mq-ficha-corpo'); if (c) c.scrollTop = 0; });
  };
  /* app real: a mudança da ficha vai para o diário (maquinaMudar) e chega às outras telas; no exemplo fica nesta janela */
  function mudarNaEquipe(m, p, dados, texto) {
    if (m.real) L().fazer('maquinaMudar', Object.assign({ projeto: m.id, peca: p.id, texto: texto }, dados));
    else m.linha.push({ ts: agora(), texto: texto, quem: L().eu, peca: p.id });
  }
  A['mq-quando'] = function (el) { var m = mAtual(), p = m && peca(m, el.dataset.id); if (!p) return; if (p.banco) { aviso('Este robô é um gatilho real do banco local: quem muda é a migração. Peça ao agente.'); return; } p.quando = el.dataset.q; p.mudouEm = agora(); m.rev++; m.mudancas.push('Robô "' + p.nome + '" passa a disparar ' + p.quando); mudarNaEquipe(m, p, { quando: p.quando }, 'robô "' + p.nome + '" agora dispara ' + p.quando); BC.estacao.render(); };
  A['mq-cofre'] = function (el) {
    var m = mAtual(), p = m && peca(m, el.dataset.id); if (!p) return;
    var k = (p.chaves || []).filter(function (x) { return x.nome === el.dataset.k; })[0]; if (!k) return;
    if (L().eu !== p.por) { L().fazer('recado', 'Máquina: ' + L().nome(L().eu) + ' pediu a chave ' + k.nome + ' do Cofre de ' + (m.pj ? m.pj.nome : '')); aviso('Pedido enviado a ' + L().nome(p.por) + '. O valor nunca passa por aqui.'); return; }
    k.ok = true; k.entregueEm = agora(); p.faltando = (p.faltando || []).filter(function (x) { return x !== k.nome; });
    acender(p, 'ok', 6000);
    mudarNaEquipe(m, p, { chaveEntregue: k.nome }, 'marcou a chave ' + k.nome + ' do Cofre como entregue');
    redesenhar(); faiscasNaPeca(p.id, 3, 'ok', false); tocar('tique');
    aviso('Chave ' + k.nome + ' marcada como entregue: a luz ficou verde. O valor não passa pela Máquina: fica no .env ou no cofre do projeto.');
  };

  /* ---------- presets: o que a equipe construiu e funcionou fica guardado para usar de novo ---------- */
  function presets() { var e = L().estado; if (!e.presets) e.presets = []; return e.presets; }
  LA.presetSalvar = function (quem, dados) {
    if (!dados || !dados.nome || !dados.tipo) return;
    var p = { id: U.id('pre'), tipo: dados.tipo, nome: dados.nome, descricao: dados.descricao || '', por: quem, projeto: dados.projeto || '', ts: Date.now(), testadoEm: dados.testadoEm || Date.now(), usos: 0, pecas: dados.pecas || [], fios: dados.fios || [], arquivo: dados.arquivo || null, versao: 1 };
    presets().unshift(p);
    return [L()._evento('preset', quem, L().nome(quem) + ' guardou o preset "' + p.nome + '" (' + (p.tipo === 'tela' ? 'tela' : 'backend') + '): a equipe pode usar em qualquer projeto.', { tv: true })];
  };
  LA.presetUso = function (quem, id) { var p = presets().filter(function (x) { return x.id === id; })[0]; if (!p) return; p.usos = (p.usos || 0) + 1; return []; };

  function pecasParaPreset(m) {
    var minhas = m.pecas.filter(function (p) { return p.tipo !== 'empresa' && p.tipo !== 'cofre'; });
    var nomes = {}; minhas.forEach(function (p) { nomes[p.id] = p.nome; });
    return { pecas: minhas.map(function (p) { return { tipo: p.tipo, nome: p.nome, frase: p.frase, campos: p.campos, chave: p.chave, login: p.login }; }),
      fios: m.fios.filter(function (f) { return nomes[f[0]] && nomes[f[1]]; }).map(function (f) { return [nomes[f[0]], nomes[f[1]]]; }) };
  }
  M.usarPreset = function (m, p, terminal) {
    var ids = {}, t = agora();
    var novas = p.pecas.map(function (x, i) {
      var id = 'pre' + Date.now().toString(36) + i, nova = Object.assign({}, x, { id: id, dom: p.nome, por: L().eu, linhas: 0, dePreset: p.nome, presetAutor: p.por });
      if (x.tipo === 'gaveta' && !nova.chave) nova.chave = 'cada empresa vê só o seu';
      if (x.tipo === 'porta' && !nova.verbo) nova.verbo = verboDe(nova);
      ids[x.nome] = id;
      return nova;
    });
    var fios = (p.fios || []).filter(function (f) { return ids[f[0]] && ids[f[1]]; }).map(function (f) { return [ids[f[0]], ids[f[1]]]; });
    novas.forEach(function (nova, i) {
      entrar(m, nova, 'usou o preset "' + p.nome + '": ' + TIPOS[nova.tipo] + ' ' + nova.nome, L().eu, i === novas.length - 1 ? fios : []);
      nova.criadaEm = t + i * 120;
      m.mudancas.push('Preset "' + p.nome + '": ' + TIPOS[nova.tipo] + ' ' + nova.nome);
      setTimeout(function () { ficouPronta(m, nova); }, 1400 + i * 500);
    });
    L().fazer('presetUso', p.id);
    if (terminal) terminal.cartao('Preset <b>' + esc(p.nome) + '</b> entrou na Máquina de ' + esc(nomeMaquina(m)) + ': ' + p.pecas.length + ' peça(s) encaixando.', null, '');
    BC.estacao.render();
  };
  A['mq-preset-usar'] = function (el) {
    var m = mAtual(), p = presets().filter(function (x) { return x.id === el.dataset.id; })[0];
    if (!m || !p) { aviso('Abra a Máquina de um projeto para usar o preset.'); return; }
    M.usarPreset(m, p, BC.estacao.terminal);
    aviso('Preset "' + p.nome + '" montado. Teste e, se funcionar, publique.');
  };
  A['mq-preset-form'] = function () { var m = mAtual(); if (m) { m.modo = 'preset'; m.fichaAberta = true; BC.estacao.render(); } };
  BC.formularios['mq-preset'] = function () {
    var m = mAtual(), nome = (document.getElementById('mq-preset-nome') || {}).value || '', desc = (document.getElementById('mq-preset-desc') || {}).value || '';
    if (!m || !nome.trim()) { aviso('Dê um nome ao preset.'); return; }
    var pf = pecasParaPreset(m);
    if (L().fazer('presetSalvar', { tipo: 'backend', nome: nome.trim(), descricao: desc.trim(), projeto: m.pj ? m.pj.nome : '', pecas: pf.pecas, fios: pf.fios, testadoEm: m.testeOkEm || Date.now() })) {
      m.modo = 'ver'; m.linha.push({ ts: Date.now(), texto: 'guardou o preset "' + nome.trim() + '"', quem: L().eu });
      aviso('Preset "' + nome.trim() + '" guardado. Está na lista da equipe, em qualquer Máquina.');
      BC.estacao.render();
    }
  };
  M.presetsHtml = function (m) {
    var lista = presets();
    return '<div class="lat-titulo"><span class="rotulo">Presets da equipe</span><span class="conta">' + lista.length + '</span></div>' +
      (lista.length ? '<ul class="lat-lista mq-presets">' + lista.map(function (p) {
        var dono = L().pessoa(p.por), d = p.testadoEm ? new Date(p.testadoEm) : null;
        return '<li class="mq-preset"><span class="mq-preset-cab">' + (dono ? U.avatar(dono, 16) : '') + '<b>' + esc(p.nome) + '</b><span class="chip">' + (p.tipo === 'tela' ? 'tela' : (p.pecas || []).length + ' peças') + '</span></span><small>' + esc(p.descricao || '') + (p.usos ? ' · usado ' + p.usos + '×' : '') + (p.projeto ? ' · veio de ' + esc(p.projeto) : '') + (d ? ' · ✓ testou e passou em ' + String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + ' ' + U.hora(p.testadoEm) : '') + ' · v' + (p.versao || 1) + '</small>' +
          (p.tipo === 'tela' ? '<button class="botao discreto" type="button" data-acao="preset-tela" data-id="' + p.id + '">Começar desta tela</button>' : '<button class="botao' + (m ? ' primario' : '') + '" type="button" data-acao="mq-preset-usar" data-id="' + p.id + '">Usar' + (m ? ' em ' + esc(nomeMaquina(m)) : '') + '</button>') + '</li>';
      }).join('') + '</ul>' : '<p class="lat-nota">Nada guardado ainda. Quando algo for construído e o teste passar, clique "Salvar como preset".</p>') +
      '<p class="lat-nota">Presets são o que a equipe já construiu e funcionou: backends e telas. Entram em qualquer projeto com um clique ou por "usa o preset X" no terminal.</p>';
  };
  /* uma tela guardada como preset vira um arquivo novo na minha pasta */
  A['preset-tela'] = function (el) {
    var p = presets().filter(function (x) { return x.id === el.dataset.id; })[0], a = p && L().arquivo(p.arquivo);
    if (!a) { aviso('O arquivo desta tela não está disponível.'); return; }
    var caminhoArq = L().eu + '/' + (ui().projetoAtivo ? 'Projetos/' + (((L().estado.projetos || []).filter(function (x) { return x.id === ui().projetoAtivo; })[0] || {}).nome || 'Projeto') + '/' : '') + p.nome.replace(/[^\wÀ-ÿ ]+/g, '').trim() + '.html';
    L().fazer('criarArquivo', caminhoArq, 'html', a.conteudo);
    L().fazer('presetUso', p.id);
    var novo = L().arquivo(caminhoArq);
    if (novo) BC.explorador.abrirArquivo(novo.id);
    aviso('Tela "' + p.nome + '" copiada para a sua pasta. Edite na tela ou no código.');
  };
  A['mq-modo'] = function (el) { var m = mAtual(); if (m) { m.modo = el.dataset.m; if (m.modo !== 'ver') m.fichaAberta = true; BC.estacao.render(); } };
  A['mq-muda'] = function () { var m = mAtual(); if (m) { m.modo = 'muda'; m.fichaAberta = true; BC.estacao.render(); } };
  A['mq-publicar'] = function () { var m = mAtual(); if (m) { m.modo = 'publicar'; m.fichaAberta = true; BC.estacao.render(); var i = document.getElementById('mq-confirma'); if (i) i.focus(); } };
  /* "ver esboço": só o que a peça tem de verdade (campos, chave, "quando"); a Máquina não gera nem aplica SQL */
  A['mq-sql'] = function (el) {
    var m = mAtual(); if (!m) return;
    var txt = m.mudancas[+(el && el.dataset.i)] || '', p = m.pecas.filter(function (x) { return x.nome && txt.indexOf(x.nome) !== -1; }).sort(function (a, b) { return b.nome.length - a.nome.length; })[0];
    if (!p) { aviso('Esboço, ainda não aplicado: ' + txt + '. A Máquina não gera SQL; o código de verdade vem do agente, no projeto.'); return; }
    var slug = U.normalizar(p.nome).replace(/\s+/g, '_');
    var det = p.tipo === 'gaveta' ? 'tabela ' + slug + ' (' + ((p.campos || []).join(', ') || 'sem campos') + ') · chave: ' + (p.chave || 'nenhuma')
      : p.tipo === 'porta' ? 'porta ' + slug + ' · recebe ' + camposPorta(p).join(', ') + (p.login === false ? ' · sem login' : ' · pede login')
      : p.tipo === 'robo' ? 'robô ' + slug + ' · ' + (p.quando || 'quando entra')
      : (TIPOS[p.tipo] || 'peça') + ' "' + p.nome + '"' + (p.frase ? ' · ' + p.frase : '');
    aviso('Esboço, ainda não aplicado em banco nenhum: ' + det + '.');
  };
  A['mq-tv'] = function () {
    var m = mAtual(); if (!m) return;
    L().fazer('maquinaTv', { pj: m.id, nome: nomeMaquina(m), retrato: M.retrato(m.id) });
    aviso('A Máquina foi para a TV: a parede recebe o retrato (peças, corpo e o último teste).');
  };
  A['mq-chave'] = function (el) {
    var m = mAtual(), p = m && peca(m, el.dataset.id); if (!p) return;
    if (p.banco) { aviso('A chave desta gaveta é a regra real do banco local (RLS): quem muda é a migração. Peça ao agente.'); return; }
    var antesBandeja = naBandeja(m, p);
    p.chave = el.dataset.c; p.mudouEm = agora(); p.fechouEm = agora(); m.rev++;
    mudarNaEquipe(m, p, { chave: p.chave }, 'chave de ' + p.nome + ' mudou para "' + p.chave + '"');
    m.mudancas.push('Muda a chave de ' + p.nome + ' para "' + p.chave + '"');
    var emp = peca(m, 'empresa');
    if (emp && !antesBandeja && naBandeja(m, p)) acender(emp, 't0', 1500);
    acender(p, /⚠/.test(p.chave) ? 'alarme' : 't0', 4000);
    aviso('Chave de ' + p.nome + ' agora é "' + p.chave + '" no desenho da equipe. A regra de verdade no banco entra quando a Máquina for ligada ao banco do projeto.');
    BC.estacao.render();
  };
  A['mq-explicar'] = function (el) { var m = mAtual(), p = m && peca(m, el.dataset.id); if (!p) return; BC.estacao.alternarTerminal(true); var t = BC.estacao.terminal; if (t) { t.escrever('⚙ ' + TIPOS[p.tipo] + ' "' + p.nome + '": ' + p.frase + '. Por baixo é ' + (POR_BAIXO[p.tipo] || 'a moldura da empresa') + '.' + (p.chave ? ' Quem pode ver: ' + p.chave + '.' : ''), 'ia', true); t.mostrar(); } };
  A['mq-pedir'] = function (el) { var m = mAtual(), p = m && peca(m, el.dataset.id); if (!p) return; ui().rascunho = { titulo: 'Montar a peça "' + p.nome + '" (' + TIPOS[p.tipo] + ')', para: '', descricao: 'Peça da Máquina do projeto ' + (m.pj ? m.pj.nome : '') + ': ' + p.frase, projeto: m.pj ? m.pj.id : null }; A['nova-demanda'](); };
  A['mq-montar'] = function () { var m = mAtual(); if (!m) return; var ag = ((L().pessoa(L().eu) || {}).agentes || [])[0] || { nome: 'Rita' }; M.pedido('cria uma gaveta de retornos separada por clínica com um robô de lembrete e uma porta', ag, BC.estacao.terminal); };
  BC.formularios['mq-publicar'] = function () {
    var m = mAtual(), v = (document.getElementById('mq-confirma') || {}).value || '';
    if (!m) return;
    if (U.normalizar(v) !== U.normalizar(nomeMaquina(m))) { aviso('Digite o nome do projeto exatamente para confirmar.'); return; }
    M.publicar(m);
  };
  /* ver em 3D: a vitrine do PEÇAS (midia/pecas/pecas.js) numa camada própria, fora do conteúdo que redesenha */
  A['mq-3d'] = function (el) {
    if (!BC.pecas || typeof BC.pecas.vitrine !== 'function') { aviso('O 3D das peças ainda não chegou nesta Estação.'); return; }
    var velho = document.getElementById('mq-3d');
    if (velho) velho.parentNode.removeChild(velho);
    var palco = document.querySelector('.mq2 .mq-corpo'), r = palco ? palco.getBoundingClientRect() : { left: 80, top: 80, width: 800, height: 520 };
    var d = document.createElement('div');
    d.id = 'mq-3d'; d.className = 'mq-3d';
    d.style.left = r.left + 'px'; d.style.top = r.top + 'px'; d.style.width = r.width + 'px'; d.style.height = r.height + 'px';
    d.innerHTML = '<button type="button" class="botao discreto mq-3d-fechar" aria-label="Fechar o 3D">✕ fechar o 3D</button><div class="mq-3d-alvo"></div>';
    document.body.appendChild(d);
    d.querySelector('.mq-3d-fechar').addEventListener('click', function () { if (d.parentNode) d.parentNode.removeChild(d); });
    try {
      var t = el && el.dataset && el.dataset.t;
      BC.pecas.vitrine(d.querySelector('.mq-3d-alvo'), t ? { abrir: catalogo.pecas[t] ? catalogo.pecas[t].id : t } : {});
    } catch (e) { if (d.parentNode) d.parentNode.removeChild(d); aviso('O 3D não abriu: ' + (e && e.message || e)); }
  };
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { var d = document.getElementById('mq-3d'); if (d && d.parentNode) d.parentNode.removeChild(d); } });

  /* a Máquina inteira em 3D (zoom "3D"): o corpo do projeto de visual3d.js (BC.visual3d.corpo) com as peças e os fios desta máquina.
     Publicada = corpo; ainda no local = tracejada, e ao Publicar a peça sobe do chão dentro do contorno (o mesmo "ganhar corpo" da TV).
     O quadro vive num nó próprio que troca de lugar a cada redesenho da Estação (o WebGL não recomeça a cada render). */
  var V3 = { host: null, vista: null, pj: null, assin: '' };
  /* peça do banco local tem corpo mesmo antes de publicar; banco e o nº real de linhas (BC.maquina.contagem) vão para o 3D,
     que põe o selo "no banco local · N linhas" no rótulo (o nome fica limpo, senão a contagem aparece duas vezes) */
  function dados3d(m) {
    var ids = {}, pecas = m.pecas.filter(function (p) { return p.tipo !== 'empresa'; }).map(function (p) {
      ids[p.id] = true;
      var n = p.banco && p.tipo === 'gaveta' ? contagemDe(m.id, p.id) : null;
      return { id: p.id, tipo: p.tipo, nome: p.nome, estado: (p.publicada || p.banco) && p.pronta ? 'corpo' : 'tracejada', ts: p.publicadaEm || p.criadaEm || 0, por: p.por, banco: !!p.banco, linhas: n, bancoDe: p.banco && !bancoDaqui(p) ? L().nome(donoBanco(p)) : null };
    });
    return { nome: nomeMaquina(m), pecas: pecas, fios: m.fios.filter(function (f) { return ids[f[0]] && ids[f[1]]; }).map(function (f) { return [f[0], f[1]]; }) };
  }
  function montar3d(m, lugar) {
    if (!BC.visual3d || typeof BC.visual3d.corpo !== 'function') { lugar.innerHTML = '<p class="mq-3d-aviso">O 3D ainda não chegou nesta Estação.</p>'; return; }
    if (!V3.host) { V3.host = document.createElement('div'); V3.host.className = 'mq-3d-corpo'; }
    var mudouLugar = V3.host.parentNode !== lugar;
    if (mudouLugar) lugar.appendChild(V3.host);
    if (!V3.vista || V3.pj !== m.id) {
      if (V3.vista) { try { V3.vista.destruir(); } catch (e) { /* já */ } }
      V3.host.innerHTML = ''; V3.host.className = 'mq-3d-corpo';
      V3.vista = BC.visual3d.corpo(V3.host); V3.pj = m.id; V3.assin = '';
    }
    var d = dados3d(m), a = JSON.stringify(d.pecas.map(function (p) { return [p.id, p.estado, p.nome, p.banco, p.linhas, p.bancoDe]; })) + '|' + JSON.stringify(d.fios);
    if (a !== V3.assin) { V3.assin = a; V3.vista.atualizar(d); }
    else if (mudouLugar && V3.vista.pedir) V3.vista.pedir('tamanho');
  }
  var aposDesenho2d = aposDesenho;
  aposDesenho = function () {
    aposDesenho2d();
    var c = document.getElementById('e-conteudo'), raiz = c && c.querySelector('.mq2'), lugar = raiz && raiz.querySelector('.mq-3d-lugar');
    var m = raiz && M.maquinas[raiz.getAttribute('data-pj')];
    if (lugar && m) montar3d(m, lugar);
  };
  /* sem projeto ou com a máquina vazia: o terminal abre para pedir ao agente */
  A['mq-terminal'] = function () {
    try { if (BC.estacao && typeof BC.estacao.alternarTerminal === 'function') BC.estacao.alternarTerminal(true); } catch (e) { /* segue */ }
    aviso('Peça no terminal: "monta a Máquina do projeto a partir do código". O agente usa o conector coop e as peças entram aqui, assinadas.');
  };

  /* ================================================================== API para as outras peças (TV, terminal, parede) */
  M.PECAS = PECAS;
  M.imagem = imagemDe;
  M.glifo = glifo;
  M.ouvir = function (fn) { ouvintes.push(fn); return function () { var i = ouvintes.indexOf(fn); if (i >= 0) ouvintes.splice(i, 1); }; };
  M.retrato = function (pjId) {
    var id = pjId || (abaMaquina() ? abaMaquina().ref : null) || ((L().estado.projetos || [])[0] || {}).id || 'clinicas', m = maquinaDe(id), T = m.teste;
    return {
      pj: id, nome: nomeMaquina(m), versao: m.versao, ambiente: m.ambiente, funcionando: !!(m.funcionandoAss && m.funcionandoAss === assinatura(m)), funcionandoEm: m.funcionandoEm || null,
      pecas: m.pecas.map(function (p) { return { id: p.id, tipo: p.tipo, nome: p.nome, dominio: p.dom || null, pronta: !!p.pronta, publicada: !!p.publicada, corpo: !!p.corpo, banco: !!p.banco, bancoEm: donoBanco(p), alerta: alertaDe(m, p) || null, suja: suja(p), imagem: imagemDe(p.tipo) || null, por: p.por }; }),
      fios: m.fios.map(function (f) { return { de: f[0], para: f[1], tipo: tipoFio(m, f) }; }),
      ultimoTeste: T ? { como: T.como, porta: T.porta, passou: !!T.passou, barrado: !!T.barrado, vazou: !!T.vazouFim, em: T.t0, rodando: !!T.rodando } : null
    };
  };
  M.comando = function (texto, ag, terminal) { if (!/\b(gaveta|porta|robo|robô|cano|tela|maquina|máquina|preset|testa|publica|liga)\b/i.test(texto)) return false; M.pedido(texto, ag, terminal); return true; };
  M.pontos = function (pjId) { var m = pjId ? M.maquinas[pjId] : mAtual(); return m ? m.pontos.slice() : []; };
  M.maquinaDe = maquinaDe;
  M.real = real;
  /* o 3D da Máquina inteira (testes e a auditoria): a vista (canvas, cena, câmera) e as medidas dela */
  M.vista3d = function () { return V3.vista; };
  M.medidas3d = function () { return V3.vista && V3.vista.medidas ? Object.assign({ pj: V3.pj, ligado: !!(V3.host && V3.host.isConnected) }, V3.vista.medidas()) : null; };
  /* o que o agente lê pelo conector (coop_maquina): peças, fios e a linha do tempo do estado da equipe */
  M.doEstado = function (pjId) { var src = fonteReal(pjId, false); return src ? { pecas: src.pecas.slice(), fios: src.fios.slice(), linha: src.linha.slice(-20), versao: src.versao || 1 } : { pecas: [], fios: [], linha: [], versao: 1 }; };
  M.pecaDoEstado = function (pjId, ref) { return pecaDaFonte(fonteReal(pjId, false), ref); };
  M.TIPOS_REAIS = TIPOS_REAIS.slice();
  /* de qual Estação é o banco de uma peça (id) e se é deste computador: a tela do conector só mexe nas daqui */
  M.donoBanco = donoBanco;
  M.bancoDaqui = bancoDaqui;
  M.CHAVES = CHAVES.slice();
  M.TIPOS = TIPOS;
  /* a Máquina do projeto já no zoom 3D (a tela do conector abre antes de tocar os efeitos do banco) */
  M.abrir3d = function (pjId) {
    if (real()) pjId = refReal(pjId);
    if (!pjId) return false;
    var m = maquinaDe(pjId), t = abaMaquina();
    m.zoom = '3d';
    if (t && t.ref === pjId) redesenhar(); else M.abrir(pjId);
    return true;
  };
  /* o nº real de linhas de uma gaveta do banco local: guardado só nesta janela; atualiza o rodapé e o rótulo do 3D.
     Sem n, devolve o que está guardado (ou null). Vários números seguidos pedem um redesenho só. */
  var redesenhoContagem = null;
  M.contagem = function (pjId, pecaId, n) {
    if (!pjId || !pecaId) return null;
    if (n === undefined) return contagemDe(pjId, pecaId);
    n = Math.max(0, Math.floor(+n));
    if (!isFinite(n)) return null;
    contagens[pjId] = contagens[pjId] || {};
    if (contagens[pjId][pecaId] === n) return n;
    contagens[pjId][pecaId] = n;
    if (!redesenhoContagem) redesenhoContagem = setTimeout(function () { redesenhoContagem = null; redesenharSeAberta(); }, 0);
    return n;
  };

  BC.maquina = M;
  carregarCatalogo();
})(window.BC);
