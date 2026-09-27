/* babel-coop · campanha.js · F3 "gera a campanha" (docs/design/PLANO.md §5 F3 · assets/visao/imag-campanha.jpg)

   O pedido "gera a campanha <nome> para <pessoa> até <data>" transforma o meio: abre o palco da campanha com a Tela
   (landing), 3 anúncios, a mensagem de WhatsApp e o calendário, cada peça com dono (nome e anel na cor da pessoa),
   anel de progresso que fecha conforme a peça fica pronta, o plano à direita item a item e o rito ao concluir.
   Cada peça abre no editor certo: a Tela no alternador Site|Código (é um arquivo .html de verdade), o anúncio como
   Imagem|Texto, o WhatsApp como mensagem sugerida e o calendário como lista de datas. Tudo mora num endereço:
   equipe › Campanhas › <nome> › <peça>, com um arquivo por peça (landing.html, anuncio-N.svg, whatsapp.txt, calendario.csv).

   Régua (docs/design/REGUA_ORGANISMO.md): toda luz é um evento real. O "agente" do protótipo escreve passo a passo
   (campanhaPasso); cada passo que entra no estado é o que acende: a coluna da presença sobe com os caracteres escritos,
   a seção nova da landing nasce com rastro, e a peça pronta recebe o pulso roxo → ciano da presença, faíscas e um tique.
   Campanha pronta = o palco respira uma vez e soa "duas"; OK de quem pediu em todas = "Campanha no ar", ouro e "tres".
   Com o motor do organismo (app: BC.organismo) vêm pulso, faíscas, respirar e som; sem ele (protótipo puro) o efeito
   cai para CSS simples. prefers-reduced-motion: cor e texto, sem movimento. Nada anima com o palco escondido.
   HUD do Babel OS (contexto Gabriel) só na peça viva (sendo escrita): vidro, borda 1 px rgba(63,227,255,.22), glow
   discreto e scanlines ≤ 5 %; esfria quando a peça fica pronta.

   Para os outros (o conector coop do app chama): BC.campanha.gerar({ nome, meta, para, prazo, por }) → { id, pecas, … }.
   JS puro, sem módulos. Carregado depois de oficina.js e antes de estacao.js. */
window.BC = window.BC || {};
BC.acoes = BC.acoes || {};
BC.formularios = BC.formularios || {};
BC.vistas = BC.vistas || {};

(function (BC) {
  'use strict';

  var VERSAO = '1.0.0';
  var U = BC.util, esc = U.esc, DIA = U.DIA;
  var A = BC.acoes, F = BC.formularios;
  var LARGURA_TELA = 1100;   /* a landing é desenhada a 1100 px e reduzida para caber no cartão */
  var MV_CURTA = 6000;       /* --mv-curta: a luz de evento esfria em 6 s (lei 3) */

  function L() { return BC.loja; }
  function E() { return BC.loja.estado; }
  function org() { var o = BC.organismo; return o && o.versao ? o : null; }
  function reduzido() { var o = org(); if (o && o.semMovimento) return o.semMovimento(); return U.movimentoReduzido(); }
  function estacao() { return BC.estacao && BC.estacao.ui ? BC.estacao : null; }
  function naEstacao() {
    var v = document.documentElement.getAttribute('data-vista');
    if (v && v !== 'estacao') return false;
    return !/^#?(tv|ipad|cronometro)\b/.test(location.hash || '');
  }
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function dm(ts) { var d = new Date(ts); return U.pad(d.getDate()) + '/' + U.pad(d.getMonth() + 1); }
  function dma(ts) { var d = new Date(ts); return dm(ts) + '/' + d.getFullYear(); }
  function iso(ts) { var d = new Date(ts); return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate()); }
  function diaCurto(ts) { return ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][new Date(ts).getDay()]; }
  function meiaNoite(ts) { var d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function css(s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&'); }

  /* ================================================================== pessoas, prazo, meta */

  function pessoa(id) { return L().pessoa(id); }
  function nomeDe(id) { return L().nome(id); }
  function acharPessoa(x) {
    if (!x) return null;
    if (typeof x === 'object' && x.id) x = x.id;
    var p = L().pessoa(x);
    if (p) return p;
    var n = U.normalizar(String(x).replace(/^@/, '')).trim();
    return E().pessoas.filter(function (q) { return U.normalizar(q.nome) === n || q.id === n; })[0] || null;
  }
  function lerPrazo(x, base) {
    base = base || Date.now();
    if (x == null || x === '') return null;
    if (typeof x === 'number' && isFinite(x)) return x;
    var s = String(x).trim(), m;
    if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return new Date(+m[1], +m[2] - 1, +m[3], 18, 0, 0).getTime();
    if ((m = s.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/))) {
      var ano = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : new Date(base).getFullYear();
      var ts = new Date(ano, +m[2] - 1, +m[1], 18, 0, 0).getTime();
      if (!m[3] && ts < base - DIA) ts = new Date(ano + 1, +m[2] - 1, +m[1], 18, 0, 0).getTime(); /* "até 10/01" dito em dezembro é o ano que vem */
      return ts;
    }
    var t = Date.parse(s);
    return isNaN(t) ? null : t;
  }
  function lerMeta(x) {
    if (x == null || x === '') return null;
    if (typeof x === 'number' && isFinite(x)) return { n: x, unidade: 'clientes', texto: x + ' clientes' };
    if (typeof x === 'object') { var n = +x.n || +x.alvo || null, un = String(x.unidade || 'clientes'); return { n: n, unidade: un, texto: n ? n + ' ' + un : un }; }
    var s = String(x).trim(), m = s.match(/(\d+)\s*(.*)$/);
    if (m) { var u = (m[2] || 'clientes').trim() || 'clientes'; return { n: +m[1], unidade: u, texto: m[1] + ' ' + u }; }
    return { n: null, unidade: '', texto: s.slice(0, 60) };
  }

  /* "gera a campanha da Clínica Vida de 40 clientes para a Carla até 30/09" → { nome, meta, para, prazo } */
  function interpretar(pedido) {
    var s = String(pedido || '').replace(/^["“]|["”]$/g, '').trim(), r = { pedido: s };
    var mp = s.match(/\bat[ée]\s+(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i);
    if (mp) { r.prazo = mp[1]; s = s.replace(mp[0], ' '); }
    var mq = s.match(/\bpara\s+(?:a\s+|o\s+)?([A-Za-zÀ-ÿ]+)/i);
    if (mq && acharPessoa(mq[1])) { r.para = acharPessoa(mq[1]).id; s = s.replace(mq[0], ' '); }
    var mc = s.match(/\bcampanha\b\s*([\s\S]*)$/i), resto = mc ? mc[1] : '';
    resto = resto.replace(/^(?:d[aoe]s?|chamada|nomeada|com o nome)\s+/i, '').replace(/[.,;:!?]+\s*$/, '').trim();
    var mm = resto.match(/\s*,?\s*(?:\bde\b|\bcom meta de\b|\bmeta(?:\s+de)?\b|\bpara fechar\b)\s+(\d+)\s+([A-Za-zÀ-ÿ ]+)$/i);
    if (mm) { r.meta = mm[1] + ' ' + mm[2].trim(); resto = resto.slice(0, mm.index).trim(); }
    r.nome = resto.replace(/\s+/g, ' ').replace(/^["“]|["”]$/g, '').trim();
    return r;
  }

  /* ================================================================== o conteúdo (simulado no protótipo; no app, é o agente) */

  function tomDe(nome) {
    var n = U.normalizar(nome);
    if (/clinic|consult|odont|saude|medic|dent|estetic|fisio|vet|pet|laborat|psico|nutri/.test(n)) return 'saude';
    if (/loja|black|friday|promo|liquida|natal|oferta|moda|varejo|outlet|desconto/.test(n)) return 'varejo';
    return 'servico';
  }

  function textos(tom, nome, quem, prazo, meta) {
    var vagas = meta && meta.n ? 'São só ' + meta.n + ' vagas' : 'Vagas limitadas';
    if (tom === 'saude') return {
      h1: nome + ': sua consulta marcada em 1 minuto',
      sub: 'Agenda pelo WhatsApp, lembrete um dia antes e atendimento sem fila. Condição especial até ' + prazo + '.',
      cta: 'Quero agendar',
      beneficios: [['Marque pelo WhatsApp', 'Escolha o horário numa conversa, sem ligação e sem espera.'], ['Lembrete automático', 'Um dia antes chega a confirmação: ninguém esquece.'], ['Sem fila na recepção', 'Chegou, foi atendido: a recepção já sabe quem vem.']],
      form: 'Quero ser chamado', anuncios: [
        ['dor', 'Cansou de esperar para ser atendido?', 'Agende pelo WhatsApp', 'Na ' + nome + ' a consulta é marcada numa conversa e confirmada um dia antes. Sem fila, sem ligação. Condição especial até ' + prazo + '.'],
        ['prova', 'Quem vem uma vez, volta.', 'Conheça a ' + nome, 'Horário respeitado, atendimento de perto e lembrete no celular. É assim que a ' + nome + ' trabalha.'],
        ['oferta', 'Condição especial até ' + prazo, 'Garanta seu horário', vagas + ' com condição especial até ' + prazo + '. Responda e a gente reserva o seu.']],
      wa: ['Oi, {{nome}}! Aqui é ' + quem + ', da equipe ' + nome + '. 😊', 'Estamos com uma condição especial para consultas até ' + prazo + ': você marca por aqui mesmo e recebe o lembrete um dia antes.', 'Quer que eu reserve um horário para você? É só responder *SIM* que eu mando as opções.', quem + ' · ' + nome]
    };
    if (tom === 'varejo') return {
      h1: nome + ': os melhores preços do ano, até ' + prazo,
      sub: 'Estoque separado, entrega rápida e atendimento pelo WhatsApp. Quando acabar, acabou.',
      cta: 'Quero ver as ofertas',
      beneficios: [['Preço de verdade', 'Desconto sobre o preço de sempre, sem letra miúda.'], ['Compra pelo WhatsApp', 'Pergunte, reserve e pague numa conversa só.'], ['Entrega rápida', 'Separado hoje, na sua casa em poucos dias.']],
      form: 'Quero receber as ofertas', anuncios: [
        ['dor', 'Esperou o ano todo por este preço?', 'Ver ofertas', 'A ' + nome + ' separou o estoque para quem chega primeiro. Só até ' + prazo + '.'],
        ['prova', 'Quem comprou, recomenda.', 'Conheça a ' + nome, 'Atendimento de perto, entrega no prazo e troca sem complicação.'],
        ['oferta', 'Só até ' + prazo, 'Garanta o seu', vagas + ' no preço da campanha. Responda e a gente separa o seu.']],
      wa: ['Oi, {{nome}}! Aqui é ' + quem + ', da equipe ' + nome + '. 😊', 'Separamos ofertas da campanha até ' + prazo + ' e lembrei de você.', 'Quer que eu mande a lista? É só responder *SIM*.', quem + ' · ' + nome]
    };
    return {
      h1: nome + ': o próximo passo começa hoje',
      sub: 'Uma proposta simples, atendimento de perto e resposta no mesmo dia. Condição especial até ' + prazo + '.',
      cta: 'Quero participar',
      beneficios: [['Resposta no mesmo dia', 'Você pergunta de manhã e recebe a proposta à tarde.'], ['Tudo pelo WhatsApp', 'Sem formulário comprido: uma conversa resolve.'], ['Acompanhamento de perto', 'Uma pessoa da equipe cuida do seu caso do começo ao fim.']],
      form: 'Quero ser chamado', anuncios: [
        ['dor', 'Chega de esperar resposta.', 'Fale com a gente', 'Na ' + nome + ' você pergunta e recebe a proposta no mesmo dia. Condição especial até ' + prazo + '.'],
        ['prova', 'Quem conhece, indica.', 'Conheça a ' + nome, 'Atendimento de perto e resposta rápida: é assim que a ' + nome + ' trabalha.'],
        ['oferta', 'Condição especial até ' + prazo, 'Garanta a sua', vagas + ' com condição especial até ' + prazo + '. Responda e a gente reserva a sua.']],
      wa: ['Oi, {{nome}}! Aqui é ' + quem + ', da equipe ' + nome + '. 😊', 'Abrimos uma condição especial até ' + prazo + ' e lembrei de você.', 'Quer que eu te mande os detalhes? É só responder *SIM*.', quem + ' · ' + nome]
    };
  }

  /* quem é dono de cada peça: a área certa da equipe (Programação faz a Tela, Marketing os anúncios, Atendimento o
     WhatsApp); o calendário é de quem responde pela campanha. Sem ninguém na área, fica com quem pediu. */
  function daArea(areas, reserva) {
    for (var i = 0; i < areas.length; i++) {
      var p = E().pessoas.filter(function (x) { return x.area === areas[i]; })[0];
      if (p) return p.id;
    }
    return reserva;
  }
  function escolherDonos(para, por) {
    return { tela: daArea(['programacao'], por), anuncio: daArea(['marketing'], por), whatsapp: daArea(['atendimento', 'vendas', 'comercial'], por), calendario: para };
  }

  /* as datas do calendário, do dia do pedido até o prazo, fugindo do fim de semana (menos o fechamento) */
  function montarDatas(inicio, prazo, meta, donos, para) {
    var ini = meiaNoite(inicio), fim = meiaNoite(prazo), span = Math.max(1, Math.round((fim - ini) / DIA));
    var plano = [[0, 'Landing no ar', 'tela'], [0.1, 'Anúncio 1 · feed', 'anuncio-1'], [0.2, 'WhatsApp · primeira leva', 'whatsapp'], [0.4, 'Anúncio 2 · feed', 'anuncio-2'],
      [0.6, 'Anúncio 3 · stories', 'anuncio-3'], [0.85, 'WhatsApp · lembrete', 'whatsapp'], [1, 'Fechamento' + (meta && meta.n ? ' · meta ' + meta.texto : ''), 'calendario']];
    var ult = ini - DIA;
    return plano.map(function (x, i) {
      var d = ini + Math.round(x[0] * span) * DIA, fecha = i === plano.length - 1;
      if (!fecha) { var wd = new Date(d).getDay(); if (wd === 6) d -= DIA; if (wd === 0) d += DIA; }
      if (d <= ult && !fecha) d = ult + DIA;
      if (d > fim) d = fim;
      ult = d;
      var dono = x[2] === 'calendario' ? para : x[2].indexOf('anuncio') === 0 ? donos.anuncio : donos[x[2]];
      return { ts: d + 10 * 3600000, oque: x[1], peca: x[2], dono: dono };
    });
  }

  function seguro(nome) { return String(nome).replace(/[\/\\]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 60) || 'campanha'; }
  function pastaLivre(base) {
    var p = base, n = 1, usada = function (x) { return E().arquivos.some(function (a) { return a.caminho.indexOf(x + '/') === 0; }) || (E().campanhas || []).some(function (c) { return c.pasta === x; }); };
    while (usada(p)) { n++; p = base + ' ' + n; }
    return p;
  }

  /* o que o agente consultou antes (memória com nome): os aprendizados da equipe mais perto de campanha e peças */
  function consultar(nome) {
    var aps = E().aprendizados || [];
    if (!BC.acervo || !BC.acervo.parecidos || !aps.length) return [];
    return BC.acervo.parecidos('campanha anúncio banner whatsapp landing cliente proposta ' + nome, aps).filter(function (x) { return x.sim > 0.04; }).slice(0, 1)
      .map(function (x) { return { texto: x.item.texto, pessoa: x.item.pessoa, confirmacoes: (x.item.confirmacoes || []).length }; });
  }

  function montar(quem, d) {
    var por = d.por && pessoa(d.por) ? d.por : quem, para = d.para && pessoa(d.para) ? d.para : por;
    var prazo = d.prazo || (d.ts + 14 * DIA), prazoTexto = dm(prazo), meta = d.meta || null;
    var pasta = pastaLivre('equipe/Campanhas/' + seguro(d.nome));
    var t = textos(tomDe(d.nome), d.nome, nomeDe(para), prazoTexto, meta), donos = escolherDonos(para, por);
    var datas = montarDatas(d.ts, prazo, meta, donos, para);
    var ags = t.anuncios, pecas = [
      { id: 'tela', tipo: 'tela', n: 1, titulo: 'Landing', rotulo: 'Landing page', sub: 'Tela · landing.html', arquivo: pasta + '/landing.html', dono: donos.tela,
        passos: ['Cabeçalho e marca', 'Chamada principal', 'Benefícios', 'Formulário', 'Rodapé'],
        conteudo: { marca: d.nome, h1: t.h1, sub: t.sub, cta: t.cta, beneficios: t.beneficios, form: t.form, quem: nomeDe(para), prazo: prazoTexto, meta: meta ? meta.texto : '' } }
    ];
    ags.forEach(function (x, i) {
      var st = i === 2;
      pecas.push({ id: 'anuncio-' + (i + 1), tipo: 'anuncio', n: i + 2, titulo: 'Anúncio ' + (i + 1), rotulo: 'Anúncio ' + (i + 1) + (st ? ' · stories' : ' · feed'),
        sub: (st ? 'stories 9:16' : 'feed 1:1') + ' · ' + x[0], arquivo: pasta + '/anuncio-' + (i + 1) + '.svg', dono: donos.anuncio,
        passos: ['Ângulo', 'Título', 'Arte', 'Legenda'],
        conteudo: { angulo: x[0], titulo: x[1], chamada: x[2], legenda: x[3], formato: st ? 'stories' : 'feed', paleta: i, marca: d.nome, prazo: prazoTexto } });
    });
    pecas.push({ id: 'whatsapp', tipo: 'whatsapp', n: 5, titulo: 'WhatsApp', rotulo: 'Mensagem de WhatsApp', sub: 'mensagem sugerida · whatsapp.txt', arquivo: pasta + '/whatsapp.txt', dono: donos.whatsapp,
      passos: ['Saudação', 'Oferta', 'Chamada', 'Assinatura'], conteudo: { partes: t.wa } });
    pecas.push({ id: 'calendario', tipo: 'calendario', n: 6, titulo: 'Calendário', rotulo: 'Calendário de posts', sub: datas.length + ' datas até ' + prazoTexto, arquivo: pasta + '/calendario.csv', dono: para,
      passos: datas.map(function (x) { return x.oque; }), conteudo: { datas: datas } });
    pecas.forEach(function (p) { p.feitos = 0; p.estado = 'fila'; p.ok = null; p.rompido = null; p.inicio = null; p.prontaEm = null; });
    return {
      id: d.id, tipo: 'gerada', titulo: d.nome, nome: d.nome, meta: meta ? meta.texto : null, alvo: meta && meta.n ? meta.n : null, unidade: meta ? meta.unidade : '', atual: 0,
      pessoa: para, por: por, agente: d.agente || null, prazo: prazo, prazoTexto: prazoTexto, ts: d.ts, pasta: pasta, estado: 'gerando',
      pedido: d.pedido || '', consulta: Array.isArray(d.consulta) ? d.consulta.slice(0, 2) : consultar(d.nome), pecas: pecas, prontaEm: null, noArEm: null
    };
  }

  /* ---------------- a landing (a mesma HTML vai para o arquivo e para a prévia do cartão) ---------------- */

  var CSS_LANDING = '*{box-sizing:border-box}body,.pagina{margin:0;font-family:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif;background:#060b16;color:#d7e4fb}' +
    '.nav{display:flex;align-items:center;justify-content:space-between;padding:22px 56px;border-bottom:1px solid rgba(215,228,251,.09)}' +
    '.marca{display:flex;align-items:center;gap:10px;font-weight:600;font-size:20px}.marca i{width:12px;height:12px;border-radius:50%;background:linear-gradient(135deg,#a376e9,#2ad5e5)}' +
    '.nav nav a{color:#a8b8d5;text-decoration:none;margin-left:28px;font-size:15px}.nav nav a.cta{color:#060b16;background:#2ad5e5;padding:10px 18px;border-radius:999px;font-weight:600}' +
    '.heroi{display:grid;grid-template-columns:1.25fr .75fr;gap:48px;align-items:center;padding:72px 56px 64px;background:radial-gradient(120% 90% at 85% 10%,rgba(42,213,229,.16),transparent 60%),radial-gradient(90% 80% at 0% 100%,rgba(163,118,233,.18),transparent 60%)}' +
    '.heroi h1{font-size:54px;line-height:1.06;margin:0 0 18px;letter-spacing:-.01em;color:#fff8e7}.heroi p{font-size:20px;line-height:1.5;color:#a8b8d5;margin:0 0 28px;max-width:560px}' +
    '.botao{display:inline-block;padding:16px 28px;border-radius:999px;background:linear-gradient(90deg,#a376e9,#2ad5e5);color:#060b16;font-weight:700;text-decoration:none;font-size:17px;border:0}' +
    '.mostrador{justify-self:end;width:280px;height:280px;border-radius:50%;border:1px solid rgba(42,213,229,.35);display:grid;place-items:center;text-align:center;position:relative}' +
    '.mostrador::before{content:"";position:absolute;inset:16px;border-radius:50%;border:1px dashed rgba(215,228,251,.18)}.mostrador b{display:block;font-size:52px;color:#2ad5e5;line-height:1}.mostrador span{display:block;font-size:15px;color:#a8b8d5;margin-top:8px}' +
    '.beneficios{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:56px}.beneficios div{border:1px solid rgba(215,228,251,.12);border-radius:12px;padding:26px;background:#0b1320}' +
    '.beneficios i{display:block;width:34px;height:34px;border-radius:50%;border:1.5px solid #2ad5e5;margin-bottom:16px}.beneficios h3{margin:0 0 8px;font-size:20px;color:#fff8e7}.beneficios p{margin:0;color:#a8b8d5;font-size:16px;line-height:1.5}' +
    '.form{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;margin:0 56px 56px;padding:40px;border-radius:16px;background:linear-gradient(135deg,#161e2d,#0b1320);border:1px solid rgba(42,213,229,.22)}' +
    '.form h2{margin:0 0 10px;font-size:32px;color:#fff8e7}.form p{margin:0;color:#a8b8d5;font-size:17px}.form form{display:grid;gap:14px}.form label{display:grid;gap:6px;font-size:14px;color:#a8b8d5}' +
    '.form input{height:48px;border-radius:8px;border:1px solid #4d5564;background:#060b16;color:#d7e4fb;padding:0 14px;font-size:16px}' +
    'footer{padding:28px 56px;border-top:1px solid rgba(215,228,251,.09);color:#6c7b96;font-size:14px}';

  function landingPartes(k) {
    var mostr = k.meta ? '<b>' + esc(String(k.meta).split(' ')[0]) + '</b><span>' + esc(String(k.meta).split(' ').slice(1).join(' ')) + ' até ' + esc(k.prazo) + '</span>' : '<b>' + esc(k.prazo) + '</b><span>condição especial até lá</span>';
    return [
      '<header class="nav"><span class="marca"><i></i>' + esc(k.marca) + '</span><nav><a href="#beneficios">Como funciona</a><a href="#contato">Contato</a><a class="cta" href="#contato">' + esc(k.cta) + '</a></nav></header>',
      '<section class="heroi"><div><h1>' + esc(k.h1) + '</h1><p>' + esc(k.sub) + '</p><a class="botao" href="#contato">' + esc(k.cta) + '</a></div><div class="mostrador">' + mostr + '</div></section>',
      '<section class="beneficios" id="beneficios">' + k.beneficios.map(function (b) { return '<div><i></i><h3>' + esc(b[0]) + '</h3><p>' + esc(b[1]) + '</p></div>'; }).join('') + '</section>',
      '<section class="form" id="contato"><div><h2>' + esc(k.form) + '</h2><p>Deixe seu nome e WhatsApp: ' + esc(k.quem) + ' responde no mesmo dia.</p></div><form><label>Nome<input placeholder="Seu nome"></label><label>WhatsApp<input placeholder="(11) 90000-0000"></label><button class="botao" type="button">' + esc(k.cta) + '</button></form></section>',
      '<footer>' + esc(k.marca) + ' · campanha até ' + esc(k.prazo) + ' · responde: ' + esc(k.quem) + ' · feito na babel-coop</footer>'
    ];
  }
  function landingHtml(c, p) {
    return '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>' + esc(p.conteudo.marca) + ' · campanha até ' + esc(c.prazoTexto) + '</title>\n<style>' + CSS_LANDING + '</style>\n</head>\n<body>\n' +
      landingPartes(p.conteudo).join('\n') + '\n</body>\n</html>\n';
  }

  /* ---------------- o anúncio: arte vetorial (texto de verdade, nada de texto em pixel) ---------------- */

  var PALETAS = [['#2a1350', '#0c2a4a', '#2ad5e5'], ['#0b2733', '#1d1640', '#a376e9'], ['#1a0f33', '#0d3340', '#7fd6a6']];
  function quebrar(txt, max) {
    var out = [], l = '';
    String(txt || '').split(/\s+/).forEach(function (w) { if (!w) return; if (l && (l + ' ' + w).length > max) { out.push(l); l = w; } else l = (l + ' ' + w).trim(); });
    if (l) out.push(l);
    return out.slice(0, 4);
  }
  function textoSvg(txt, x, y, fs, largura, extra) {
    var ls = quebrar(txt, Math.max(8, Math.floor(largura / (fs * 0.55))));
    return '<text x="' + x + '" y="' + y + '" font-size="' + fs + '" ' + (extra || '') + '>' + ls.map(function (l, i) { return '<tspan x="' + x + '" dy="' + (i ? Math.round(fs * 1.12) : 0) + '">' + esc(l) + '</tspan>'; }).join('') + '</text>';
  }
  function svgAnuncio(p, feitos, pref, novo, k) {
    k = k || p.conteudo;
    var st = k.formato === 'stories', W = 1080, H = st ? 1920 : 1080, pal = PALETAS[(+k.paleta || 0) % 3], id = pref || 'cpa';
    var fonte = 'font-family="IBM Plex Sans, Helvetica, Arial, sans-serif"';
    function grupo(n, corpo) { return '<g class="cp-arte-' + n + (novo === n ? ' cp-novo' : '') + '">' + corpo + '</g>'; }
    /* o anel-instrumento no alto à direita; o título embaixo dele, sem cruzar; a chamada e o prazo na base */
    var cx = st ? 740 : 790, cy = st ? 470 : 300, r = st ? 250 : 200, tique = '';
    for (var i = 0; i < 48; i++) { var a = i / 48 * Math.PI * 2, r1 = r + 18, r2 = r + (i % 6 ? 30 : 48); tique += 'M' + (cx + Math.cos(a) * r1).toFixed(1) + ' ' + (cy + Math.sin(a) * r1).toFixed(1) + 'L' + (cx + Math.cos(a) * r2).toFixed(1) + ' ' + (cy + Math.sin(a) * r2).toFixed(1); }
    var g = [grupo(1, '<rect width="' + W + '" height="' + H + '" fill="url(#' + id + '-f)"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 1.5).toFixed(0) + '" fill="url(#' + id + '-r)"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r.toFixed(0) + '" fill="none" stroke="' + pal[2] + '" stroke-opacity=".55" stroke-width="3"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.8).toFixed(0) + '" fill="none" stroke="#d7e4fb" stroke-opacity=".22" stroke-width="2" stroke-dasharray="6 10"/>' +
      '<path d="' + tique + '" stroke="#d7e4fb" stroke-opacity=".35" stroke-width="3"/>' +
      '<rect x="' + (cx - 13) + '" y="' + (cy - r * 0.55).toFixed(0) + '" width="26" height="' + (r * 1.1).toFixed(0) + '" rx="13" fill="url(#' + id + '-c)"/>')];
    var fsT = st ? 96 : 80, linhasT = quebrar(k.titulo, Math.floor((W - 160) / (fsT * 0.55))).length;
    if (linhasT > 3) fsT = st ? 80 : 66;
    if (feitos >= 2) g.push(grupo(2, textoSvg(k.titulo, 80, st ? 1010 : 620, fsT, W - 160, fonte + ' font-weight="700" fill="#fff8e7"')));
    if (feitos >= 3) g.push(grupo(3, '<circle cx="96" cy="' + (st ? 150 : 104) + '" r="16" fill="url(#' + id + '-c)"/>' +
      '<text x="126" y="' + (st ? 162 : 116) + '" font-size="36" font-weight="600" fill="#d7e4fb" ' + fonte + '>' + esc(k.marca) + '</text>' +
      '<rect x="80" y="' + (H - (st ? 330 : 200)) + '" rx="46" width="' + Math.min(W - 160, 120 + String(k.chamada).length * 24) + '" height="92" fill="' + pal[2] + '"/>' +
      '<text x="120" y="' + (H - (st ? 330 : 200) + 58) + '" font-size="40" font-weight="700" fill="#060b16" ' + fonte + '>' + esc(k.chamada) + '</text>' +
      '<text x="' + (W - 80) + '" y="' + (H - (st ? 330 : 200) + 56) + '" font-size="32" text-anchor="end" fill="#c3cfe5" ' + fonte + '>até ' + esc(k.prazo) + '</text>'));
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('Arte do anúncio: ' + k.titulo) + '">' +
      '<defs><linearGradient id="' + id + '-f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + pal[0] + '"/><stop offset="1" stop-color="' + pal[1] + '"/></linearGradient>' +
      '<radialGradient id="' + id + '-r"><stop offset="0" stop-color="' + pal[2] + '" stop-opacity=".45"/><stop offset="1" stop-color="' + pal[2] + '" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + id + '-c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a376e9"/><stop offset="1" stop-color="#2ad5e5"/></linearGradient></defs>' + g.join('') + '</svg>';
  }

  function whatsappTexto(p) { return p.conteudo.partes.join('\n\n') + '\n'; }
  function calendarioCsv(p) {
    return 'data,o que,peça,dono\n' + p.conteudo.datas.map(function (x) {
      return [dma(x.ts), String(x.oque).replace(/,/g, ' ·'), nomePeca(x.peca), nomeDe(x.dono)].join(',');
    }).join('\n') + '\n';
  }
  function nomePeca(pid) { return pid === 'tela' ? 'landing.html' : pid === 'whatsapp' ? 'whatsapp.txt' : pid === 'calendario' ? 'calendario.csv' : pid + '.svg'; }
  function conteudoArquivo(c, p) {
    if (p.tipo === 'tela') return landingHtml(c, p);
    if (p.tipo === 'anuncio') return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgAnuncio(p, 99, 'cpa'));
    if (p.tipo === 'whatsapp') return whatsappTexto(p);
    return calendarioCsv(p);
  }
  function tipoArquivo(p) { return p.tipo === 'tela' ? 'html' : p.tipo === 'anuncio' ? 'imagem' : p.tipo === 'whatsapp' ? 'txt' : 'csv'; }
  function tamanho(s) { return Math.max(1, Math.round(String(s).length / 1024)) + ' KB'; }

  /* ================================================================== o estado (ações da loja: valem na Estação, na TV e nas outras máquinas) */

  function geradas() { return (E().campanhas || []).filter(function (c) { return c.tipo === 'gerada'; }); }
  function achar(id) { return geradas().filter(function (c) { return c.id === id; })[0] || null; }
  function peca(c, pid) { return c ? c.pecas.filter(function (p) { return p.id === pid; })[0] || null : null; }
  function prontas(c) { return c.pecas.filter(function (p) { return p.estado === 'pronta'; }).length; }
  function comOk(c) { return c.pecas.filter(function (p) { return !!p.ok; }).length; }
  function ev(tipo, quem, texto, extra) { return L()._evento(tipo, quem, texto, extra); }
  function nomeAgente(c) { return c.agente && c.agente.nome ? c.agente.nome : 'o agente'; }
  function podeOk(quem, c) { var p = pessoa(quem); return quem === c.por || !!(p && p.papel === 'admin'); }
  /* o agente que gera fica 'pensando' enquanto escreve e 'parado' quando a campanha fica pronta (a aba do agente e o "b" do topo acompanham) */
  function marcarAgente(c, estado) { var p = pessoa(c.por), a = p && c.agente && c.agente.id && (p.agentes || []).filter(function (x) { return x.id === c.agente.id; })[0]; if (a) a.estado = estado; }

  var LA = BC.loja.A;
  LA.campanhaGerar = function (quem, dados) {
    if (!dados || !dados.id || !dados.nome || achar(dados.id)) return;
    var c = montar(quem, dados);
    E().campanhas = E().campanhas || [];
    E().campanhas.unshift(c);
    if (c.alvo) E().campanha = { nome: 'Campanha ' + c.nome, descricao: c.unidade || 'novos clientes', atual: 0, alvo: c.alvo, fim: c.prazo };
    marcarAgente(c, 'pensando');
    return [ev('campanha-gerando', quem, nomeAgente(c) + ' gera a campanha "' + c.nome + '" para ' + nomeDe(c.pessoa) + ' · até ' + c.prazoTexto + ' · 6 peças com dono',
      { tv: true, campanha: c.id, para: c.pessoa !== quem ? c.pessoa : undefined })];
  };
  LA.campanhaPasso = function (quem, cid, pid) {
    var c = achar(cid), p = peca(c, pid);
    if (!p || p.estado === 'pronta') return;
    if (!p.inicio) p.inicio = Date.now();
    p.feitos = Math.min(p.passos.length, p.feitos + 1);
    p.estado = p.feitos >= p.passos.length ? 'pronta' : 'gerando';
    marcarAgente(c, 'pensando');
    if (p.estado !== 'pronta') return [];
    p.prontaEm = Date.now();
    var conteudo = conteudoArquivo(c, p), evs = [];
    if (!L().arquivo(p.arquivo)) evs = evs.concat(LA.criarArquivo(quem, p.arquivo, tipoArquivo(p), conteudo, tamanho(conteudo)) || []);
    evs.push(ev('campanha-peca', quem, nomeAgente(c) + ' deixou pronta a peça "' + p.rotulo + '" da campanha "' + c.nome + '" · dono: ' + nomeDe(p.dono),
      { discreto: true, campanha: c.id, para: p.dono !== quem ? p.dono : undefined }));
    if (prontas(c) === c.pecas.length && c.estado === 'gerando') {
      c.estado = 'pronta'; c.prontaEm = Date.now();
      marcarAgente(c, 'parado');
      evs.push(ev('campanha-pronta', quem, 'Campanha "' + c.nome + '" pronta: 6 peças com dono · espera o OK de ' + nomeDe(c.por), { tv: true, campanha: c.id, para: c.por !== quem ? c.por : undefined }));
    }
    return evs;
  };
  /* OK de quem pediu (a função do Selo: nome e hora na peça). pid '*' = todas as prontas ainda sem OK */
  LA.campanhaOk = function (quem, cid, pid) {
    var c = achar(cid);
    if (!c || !podeOk(quem, c)) return;
    var alvo = c.pecas.filter(function (p) { return p.estado === 'pronta' && !p.ok && (pid === '*' || p.id === pid); });
    if (!alvo.length) return;
    var agora = Date.now();
    alvo.forEach(function (p) { p.ok = { quem: quem, ts: agora }; p.rompido = null; });
    if (comOk(c) === c.pecas.length) {
      c.estado = 'no-ar'; c.noArEm = agora;
      return [ev('campanha-no-ar', quem, 'Campanha "' + c.nome + '" no ar · 6 peças · OK de ' + nomeDe(quem) + ' · ' + U.hora(agora), { tv: true, campanha: c.id, para: c.pessoa !== quem ? c.pessoa : undefined })];
    }
    return [ev('campanha-ok', quem, 'OK · ' + nomeDe(quem) + ' · ' + U.hora(agora) + ' em ' + alvo.map(function (p) { return '"' + p.rotulo + '"'; }).join(', ') + ' da campanha "' + c.nome + '"', { discreto: true, campanha: c.id })];
  };
  /* editar uma peça pronta: muda o conteúdo e o arquivo; se já tinha OK, o Selo rompe (nome e hora de quem mexeu) */
  LA.campanhaEditar = function (quem, cid, pid, campos) {
    var c = achar(cid), p = peca(c, pid);
    if (!p || p.estado !== 'pronta' || !campos) return;
    var k = p.conteudo, mudou = false;
    function pega(ch, max) { if (campos[ch] == null) return; var v = String(campos[ch]).slice(0, max); if (k[ch] !== v) { k[ch] = v; mudou = true; } }
    if (p.tipo === 'anuncio') { pega('titulo', 90); pega('chamada', 40); pega('legenda', 600); }
    if (p.tipo === 'whatsapp' && campos.texto != null) {
      var partes = String(campos.texto).replace(/\r\n?/g, '\n').trim().split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 12);
      if (partes.join('\n\n') !== k.partes.join('\n\n')) { k.partes = partes.length ? partes : k.partes; mudou = true; }
    }
    if (p.tipo === 'calendario' && Array.isArray(campos.datas)) {
      campos.datas.slice(0, k.datas.length).forEach(function (x, i) {
        var d = k.datas[i], ts = lerPrazo(x.data), oque = String(x.oque || '').slice(0, 80).trim();
        if (ts && meiaNoite(ts) !== meiaNoite(d.ts)) { d.ts = meiaNoite(ts) + 10 * 3600000; mudou = true; }
        if (oque && oque !== d.oque) { d.oque = oque; mudou = true; }
      });
      k.datas.sort(function (a, b) { return a.ts - b.ts; });
    }
    if (!mudou) return [];
    var evs = [], a = L().arquivo(p.arquivo), novo = conteudoArquivo(c, p);
    if (a) evs = evs.concat(LA.salvarArquivo(quem, a.id, novo) || []);
    else evs = evs.concat(LA.criarArquivo(quem, p.arquivo, tipoArquivo(p), novo, tamanho(novo)) || []);
    var agora = Date.now(), rompeu = !!p.ok;
    p.editadoPor = quem; p.editadoEm = agora;
    if (rompeu) { p.rompido = { quem: quem, ts: agora, ok: p.ok }; p.ok = null; if (c.estado === 'no-ar') c.estado = 'pronta'; }
    evs.push(ev('campanha-editada', quem, nomeDe(quem) + ' mudou "' + p.rotulo + '" da campanha "' + c.nome + '"' + (rompeu ? ' · o OK voltou a abrir' : ''), { discreto: true, campanha: c.id, para: p.dono !== quem ? p.dono : undefined }));
    return evs;
  };
  LA.campanhaDesfazer = function (quem, cid) {
    var cs = E().campanhas || [], i = cs.map(function (c) { return c.id; }).indexOf(cid);
    if (i === -1) return;
    var c = cs[i];
    cs.splice(i, 1);
    pararMotor(cid);
    return [ev('campanha-desfeita', quem, nomeDe(quem) + ' desfez a campanha "' + c.nome + '"', { discreto: true })];
  };

  /* ================================================================== o motor: o agente escreve passo a passo (só na Estação de quem pediu) */

  var motores = {};
  function pararMotor(cid) { var m = motores[cid]; if (!m) return; m.timers.forEach(clearTimeout); delete motores[cid]; }
  function iniciarMotor(cid) {
    var c = achar(cid);
    if (!c || motores[cid] || c.estado !== 'gerando') return;
    var m = motores[cid] = { timers: [], t0: Date.now() };
    /* as peças andam juntas (cada uma com o seu dono), e ficam prontas uma de cada vez, na ordem do plano: 1 pulso por vez */
    c.pecas.forEach(function (p, i) {
      var falta = p.passos.length - p.feitos;
      if (falta <= 0) return;
      var inicio = 900 + i * 200, fim = 2800 + i * 800, passo = (fim - inicio) / falta;
      for (var k = 0; k < falta; k++) {
        (function (quando) {
          m.timers.push(setTimeout(function () { if (!achar(cid)) { pararMotor(cid); return; } L().fazer('campanhaPasso', cid, p.id); }, quando));
        })(Math.round(inicio + passo * (k + 1) - (k === falta - 1 ? 0 : (hash(cid + p.id + k) % 120))));
      }
    });
    m.timers.push(setTimeout(function () { terminarMotor(cid); }, 2800 + c.pecas.length * 800 + 400));
  }
  function terminarMotor(cid) {
    var c = achar(cid), m = motores[cid];
    if (!m) return;
    delete motores[cid];
    if (!c) return;
    if (c.estado !== 'gerando') {
      dizerNoTerminal(c, '✓ Campanha <b>' + esc(c.nome) + '</b> pronta: 6 peças · ' + donosDistintos(c) + ' donos · ' + U.duracao((c.prontaEm || Date.now()) - c.ts) + ' · espera o seu OK', true);
    }
  }
  function donosDistintos(c) { var s = {}; c.pecas.forEach(function (p) { s[p.dono] = 1; }); return Object.keys(s).length; }
  /* a linha do agente no terminal simulado (na aba do agente que gerou, mesmo que a pessoa tenha trocado de aba) */
  function dizerNoTerminal(c, html, comVer) {
    var t = estacao() && BC.estacao.terminal;
    if (!t || !t.linhas || !c.agente || !c.agente.id || c.por !== L().eu) return;
    var k = L().eu + '|' + c.agente.id;
    (t.linhas[k] = t.linhas[k] || []).push('<div class="term-linha term-cartao"><span>' + html + '</span>' +
      (comVer ? '<button type="button" class="term-mini" data-term="campanha:' + esc(c.id) + '">ver</button>' : '') + '</div>');
    if (t.aba === c.agente.id) t.mostrar();
  }

  /* ================================================================== API pública */

  function agenteDe(por, qual) {
    var ags = (por && por.agentes) || [], a = null;
    if (qual) a = ags.filter(function (x) { return x.id === qual || U.normalizar(x.nome) === U.normalizar(qual); })[0];
    a = a || ags[0];
    return a ? { id: a.id, nome: a.nome, cor: a.cor } : { id: null, nome: typeof qual === 'string' && qual ? qual : 'o agente', cor: por ? por.cor : '#a376e9' };
  }

  function gerar(o) {
    o = o || {};
    if (!L() || !E()) return { erro: 'a Estação ainda não carregou' };
    var ts = Date.now(), nome = String(o.nome || '').replace(/\s+/g, ' ').trim().slice(0, 60) || ('Novos clientes de ' + U.mes());
    var por = acharPessoa(o.por) || pessoa(L().eu), para = o.para ? acharPessoa(o.para) : null;
    if (o.para && !para) return { erro: 'Não achei "' + o.para + '" na equipe.' };
    para = para || por;
    var prazo = lerPrazo(o.prazo, ts);
    if (o.prazo && !prazo) return { erro: 'Não entendi o prazo "' + o.prazo + '" (use 30/09 ou 2026-09-30).' };
    if (prazo && prazo < meiaNoite(ts)) return { erro: 'O prazo ' + dm(prazo) + ' já passou.' };
    /* a memória com nome que a presença cita (PLANO §1.3): quem chama pode passar o que o agente de verdade consultou
       (o.consulta); sem isso, cita o melhor achado da equipe, sem contar uso (contar é do agente que usou de fato: R3/R10) */
    var ag = agenteDe(por, o.agente), consulta = null;
    if (Array.isArray(o.consulta)) consulta = o.consulta.slice(0, 2).map(function (x) { return { rotulo: String(x.rotulo || '').slice(0, 120), texto: String(x.texto || x.titulo || '').slice(0, 200), pessoa: x.pessoa || x.autorId || null, id: x.id || null }; });
    else if (BC.memoria && BC.memoria.consultar) {
      try {
        consulta = BC.memoria.consultar('campanha ' + nome + ' anúncio landing whatsapp cliente', { quem: por.id, agente: ag.nome, limite: 8, citar: 0, contar: false })
          .filter(function (x) { return x.memoria && x.tipo !== 'prompt' && x.autorId && x.autorId !== por.id; }).slice(0, 1)
          .map(function (x) { return { rotulo: String(x.rotulo || '').slice(0, 120), texto: String(x.titulo || x.trecho || '').slice(0, 200), pessoa: x.autorId, id: x.id }; });
      } catch (e) { consulta = null; }
    }
    if (consulta && !consulta.length) consulta = null;
    var dados = {
      id: 'cp-' + ts.toString(36) + '-' + Math.random().toString(36).slice(2, 6), nome: nome, meta: lerMeta(o.meta), para: para.id, por: por.id,
      prazo: prazo || null, ts: ts, agente: ag, consulta: consulta, pedido: String(o.pedido || ('gera a campanha ' + nome + ' para ' + para.nome + (prazo ? ' até ' + dm(prazo) : ''))).slice(0, 300)
    };
    if (!L().fazer('campanhaGerar', dados)) return { erro: 'não deu para criar a campanha' };
    var c = achar(dados.id);
    iniciarMotor(c.id);
    if (o.abrir !== false && naEstacao() && estacao()) abrir(c.id);
    return resumo(c);
  }
  function resumo(c) {
    return {
      id: c.id, nome: c.nome, estado: c.estado, para: c.pessoa, por: c.por, prazo: iso(c.prazo), meta: c.meta, endereco: c.pasta,
      pecas: c.pecas.map(function (p) { return { id: p.id, tipo: p.tipo, titulo: p.rotulo, dono: p.dono, arquivo: p.arquivo, estado: p.estado, progresso: +(p.feitos / p.passos.length).toFixed(2), ok: p.ok ? { quem: p.ok.quem, ts: p.ok.ts } : null }; })
    };
  }

  function abrir(cid) {
    var c = achar(cid), e = estacao();
    if (!c || !e) return false;
    e.abrirAba({ id: 'campanha:' + cid, tipo: 'campanha', ref: cid, titulo: 'Campanha · ' + c.nome, atividade: 'campanha' });
    sincronizar();
    return true;
  }
  function abrirPeca(cid, pid) {
    var c = achar(cid), p = peca(c, pid), e = estacao();
    if (!p || !e) return false;
    if (p.estado !== 'pronta') { e.aviso(p.rotulo + ' ainda está nascendo · ' + p.feitos + ' de ' + p.passos.length + ' · abre quando o anel fechar.'); return false; }
    if (p.tipo === 'tela') {
      var a = L().arquivo(p.arquivo);
      if (!a) { e.aviso('A landing ainda não foi gravada.'); return false; }
      BC.explorador.abrirArquivo(a.id);
      return true;
    }
    e.abrirAba({ id: 'campanha-peca:' + cid + ':' + pid, tipo: 'campanha', ref: cid, peca: pid, titulo: p.titulo + ' · ' + c.nome, atividade: 'campanha' });
    return true;
  }

  /* ================================================================== o palco (painel próprio ao lado de #e-conteudo: o render da Estação não o toca) */

  var vista = null, palcos = {}, obs = null, relogioT = null;
  function garantirVista() {
    if (vista && vista.isConnected) return vista;
    var ed = document.querySelector('#vista-estacao .e-editor');
    if (!ed) return null;
    vista = document.createElement('section');
    vista.className = 'cp-vista';
    vista.setAttribute('aria-label', 'Campanha');
    vista.hidden = true;
    ed.appendChild(vista);
    return vista;
  }
  function vigiar() {
    if (obs || !window.MutationObserver) return;
    var abas = document.getElementById('e-abas'), cont = document.getElementById('e-conteudo');
    if (!abas || !cont) return;
    obs = new MutationObserver(function () { sincronizar(); });
    obs.observe(abas, { childList: true });
    obs.observe(cont, { childList: true });
  }

  function sincronizar() {
    var e = estacao(), ed = document.querySelector('#vista-estacao .e-editor');
    if (!e || !ed) return;
    vigiar();
    var tab = e.abaAtual(), abertas = {};
    e.ui.abas.forEach(function (t) { abertas[t.id] = true; });
    Object.keys(palcos).forEach(function (k) { if (!abertas['campanha:' + k] || !achar(k)) destruir(k); });
    var cid = tab && tab.tipo === 'campanha' && !tab.peca && achar(tab.ref) ? tab.ref : null;
    if (cid && !palcos[cid]) construir(cid);
    ed.classList.toggle('cp-on', !!cid);
    if (vista) vista.hidden = !cid;
    Object.keys(palcos).forEach(function (k) {
      var P = palcos[k], mostra = k === cid;
      if (P.el.hidden === !mostra) return;
      P.el.hidden = !mostra;
      if (mostra) { atualizar(k); medirTela(P); } else pararAnimacoes(P.el);
    });
    relogio();
  }
  function pararAnimacoes(raiz) {
    try { raiz.getAnimations({ subtree: true }).forEach(function (a) { if (window.CSSAnimation && a instanceof CSSAnimation) return; if (window.CSSTransition && a instanceof CSSTransition) return; a.finish(); }); } catch (e) { /* sem getAnimations({subtree}) */ }
  }
  function destruir(cid) {
    var P = palcos[cid];
    if (!P) return;
    if (P.ro) P.ro.disconnect();
    if (P.pres && P.pres.destruir) { try { P.pres.destruir(); } catch (e) { /* segue */ } }
    if (P.el.parentNode) P.el.parentNode.removeChild(P.el);
    delete palcos[cid];
  }

  var GLIFO = {
    tela: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 8h18M6 6h.01M8.5 6h.01"/>',
    anuncio: '<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M4 16l4.5-4.5 3 3L15 11l5 5"/><circle cx="9" cy="8.5" r="1.3"/>',
    whatsapp: '<path d="M4 20l1.3-3.8A8 8 0 1 1 8.4 19z"/><path d="M9 10.5h6M9 13.5h4"/>',
    calendario: '<rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2"/>'
  };
  function glifo(t, tam) { return '<svg class="cp-glifo" viewBox="0 0 24 24" width="' + (tam || 16) + '" height="' + (tam || 16) + '" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + GLIFO[t] + '</svg>'; }
  function corDe(id) { var p = pessoa(id); return p ? p.cor : '#6c7b96'; }
  function avatar(id, tam) { var p = pessoa(id); return p ? U.avatar(p, tam || 18) : ''; }
  function anel(pct, tam) {
    var r = 9, circ = 2 * Math.PI * r;
    return '<svg class="cp-anel" viewBox="0 0 22 22" width="' + (tam || 22) + '" height="' + (tam || 22) + '" aria-hidden="true"><circle class="cp-anel-trilho" cx="11" cy="11" r="' + r + '"/>' +
      '<circle class="cp-anel-valor" cx="11" cy="11" r="' + r + '" stroke-dasharray="' + circ.toFixed(2) + '" stroke-dashoffset="' + (circ * (1 - pct)).toFixed(2) + '"/></svg>';
  }
  function setAnel(el, pct) { var v = el && el.querySelector('.cp-anel-valor'); if (v) v.setAttribute('stroke-dashoffset', (2 * Math.PI * 9 * (1 - pct)).toFixed(2)); }

  function esqueleto(c) {
    return '<header class="cp-cab">' +
        '<div class="cp-cab-linha"><div class="cp-titulo"><span class="rotulo">Campanha</span><h1>' + esc(c.nome) + '</h1></div>' +
        '<div class="cp-cab-dir"><span class="cp-estado" aria-live="polite"></span>' +
        '<button type="button" class="botao cp-ok-todas" data-acao="cp-ok" data-campanha="' + esc(c.id) + '" data-peca="*" hidden><span class="cp-selo-ic" aria-hidden="true"></span><span class="cp-ok-todas-t">OK</span></button></div></div>' +
        '<div class="cp-cab-linha cp-cab-sub"><nav class="cp-endereco" aria-label="Endereço">' + endereco(c) + '</nav>' +
        '<span class="cp-meta">para ' + avatar(c.pessoa, 18) + ' <b>' + esc(nomeDe(c.pessoa)) + '</b> · até <b class="num">' + esc(c.prazoTexto) + '</b>' + (c.meta ? ' · meta <b>' + esc(c.meta) + '</b>' : '') + ' · pedida por ' + esc(nomeDe(c.por)) + '</span></div>' +
        '<ol class="cp-regua" aria-label="Peças">' + c.pecas.map(function (p) { return '<li data-peca="' + p.id + '" style="--dono:' + corDe(p.dono) + '"><b>' + p.n + '</b><span>' + esc(p.titulo) + '</span></li>'; }).join('') + '</ol>' +
      '</header>' +
      '<div class="cp-corpo"><div class="cp-pecas-caixa"><section class="cp-pecas">' + c.pecas.map(function (p) { return cartao(c, p); }).join('') + '</section></div>' +
      '<aside class="cp-plano" aria-label="Plano do agente">' +
        '<div class="cp-pres"><span class="cp-pres-lugar"></span><div class="cp-pres-txt"><b>' + esc(nomeAgente(c)) + '</b><span class="cp-pres-l2">agente de ' + esc(nomeDe(c.por)) + '</span><span class="cp-pres-st"></span></div></div>' +
        '<div class="cp-bloco pedido"><span class="cp-tipo">Pedido</span><p>' + esc(c.pedido) + '</p></div>' +
        (c.consulta && c.consulta.length ? '<div class="cp-bloco consulta"><span class="cp-tipo">Consulta</span><p>' + c.consulta.map(function (x) {
          return '<span class="cp-memoria">' + esc(x.rotulo || 'Aprendizado · ' + nomeDe(x.pessoa)) + '</span> · “' + esc(x.texto) + '”' + (!x.rotulo && x.confirmacoes ? ' · +' + x.confirmacoes : '');
        }).join('<br>') + '</p></div>' : '') +
        '<div class="cp-bloco plano"><span class="cp-tipo">Plano</span><ol class="cp-check">' + c.pecas.map(function (p) {
          return '<li data-peca="' + p.id + '" style="--dono:' + corDe(p.dono) + '"><span class="cp-luz"></span><i class="cp-ck" aria-hidden="true"></i><span class="cp-ck-t">' + esc(p.rotulo) + '</span><span class="cp-ck-dono">' + esc(nomeDe(p.dono)) + '</span><span class="cp-ck-pts">+2</span></li>';
        }).join('') + '</ol></div>' +
        '<div class="cp-rito" hidden aria-live="polite"><b></b><small></small></div>' +
        '<div class="cp-pontos" hidden><span class="rotulo">Seus pontos nesta campanha</span><b class="cp-pts-n num">0</b><small class="cp-pts-o"></small></div>' +
      '</aside></div>';
  }
  function endereco(c, p) {
    var partes = c.pasta.split('/');
    return '<span>' + esc(partes[0]) + '</span><i>›</i><span>' + esc(partes.slice(1, -1).join(' › ')) + '</span><i>›</i>' +
      (p ? '<button type="button" class="cp-link" data-acao="cp-campanha" data-campanha="' + esc(c.id) + '">' + esc(partes[partes.length - 1]) + '</button><i>›</i><b>' + esc(p.rotulo) + '</b>' : '<b>' + esc(partes[partes.length - 1]) + '</b>');
  }
  function cartao(c, p) {
    return '<article class="cp-peca" data-peca="' + p.id + '" data-tipo="' + p.tipo + '" data-estado="' + p.estado + '" style="--dono:' + corDe(p.dono) + '" data-endereco="' + esc(p.arquivo) + '">' +
      '<header class="cp-peca-cab">' + glifo(p.tipo) + '<span class="cp-peca-nome"><b>' + esc(p.titulo) + '</b><small>' + esc(p.sub) + '</small></span>' +
      '<span class="cp-progresso" title="">' + anel(p.feitos / p.passos.length) + '<i class="num">0%</i></span></header>' +
      '<div class="cp-previa" data-acao="cp-abrir" data-campanha="' + esc(c.id) + '" data-peca="' + p.id + '" role="button" tabindex="0" aria-label="Abrir ' + esc(p.rotulo) + '"></div>' +
      '<footer class="cp-peca-pe"><span class="cp-dono" title="Dono da peça">' + avatar(p.dono, 18) + '<span>' + esc(nomeDe(p.dono)) + '</span></span>' +
      '<span class="cp-peca-st"></span><span class="cp-selo" hidden></span>' +
      '<span class="cp-peca-acoes"><button type="button" class="botao discreto cp-abrir" data-acao="cp-abrir" data-campanha="' + esc(c.id) + '" data-peca="' + p.id + '">Abrir</button>' +
      '<button type="button" class="botao cp-ok" data-acao="cp-ok" data-campanha="' + esc(c.id) + '" data-peca="' + p.id + '" hidden><span class="cp-selo-ic" aria-hidden="true"></span>OK</button></span></footer>' +
      '<span class="cp-scan" aria-hidden="true"></span></article>';
  }

  function construir(cid) {
    if (!garantirVista()) return null;
    var c = achar(cid), el = document.createElement('article');
    el.className = 'cp-palco';
    el.setAttribute('data-campanha', cid);
    el.hidden = true;
    el.innerHTML = esqueleto(c);
    vista.appendChild(el);
    var P = palcos[cid] = { id: cid, el: el, visto: { pecas: {} }, pres: null, tela: null, pts: 0 };
    /* a presença: o anel-instrumento do organismo; sem ele, a coluna de luz em CSS */
    var lugar = el.querySelector('.cp-pres-lugar'), o = org();
    if (o && o.Presenca) { try { P.pres = new o.Presenca(lugar, { tamanho: 'grande', estado: 'shell' }); } catch (e) { P.pres = null; } }
    if (!P.pres) lugar.innerHTML = '<span class="cp-pres-css" data-estado="shell"><i></i></span>';
    /* o plano aparece item a item (120 ms cada) quando o palco nasce junto com o pedido */
    var novo = c.estado === 'gerando' && c.pecas.every(function (p) { return p.feitos === 0; });
    el.querySelectorAll('.cp-check li').forEach(function (li, i) {
      if (!novo || reduzido()) { li.classList.add('on'); return; }
      setTimeout(function () { li.classList.add('on'); var oo = org(); if (oo) oo.acender(li, 1500); }, 180 + i * 120);
    });
    if (window.ResizeObserver) { P.ro = new ResizeObserver(function () { medirTela(P); }); P.ro.observe(el.querySelector('.cp-peca[data-tipo="tela"] .cp-previa')); }
    c.pecas.forEach(function (p) { P.visto.pecas[p.id] = { feitos: p.feitos, estado: p.estado, ok: p.ok ? p.ok.ts : null }; desenharPrevia(P, c, p, 0); });
    P.visto.estado = c.estado;
    atualizar(cid, true);
    return P;
  }

  /* ---------------- prévias ---------------- */

  function desenharPrevia(P, c, p, novo) {
    var card = P.el.querySelector('.cp-peca[data-peca="' + p.id + '"]'), box = card && card.querySelector('.cp-previa');
    if (!box) return;
    if (p.tipo === 'tela') return previaTela(P, c, p, box, novo);
    if (p.tipo === 'anuncio') {
      box.innerHTML = '<div class="cp-arte' + (p.conteudo.formato === 'stories' ? ' stories' : '') + '">' + svgAnuncio(p, p.feitos, 'cpa-' + c.id + '-' + p.id, novo ? p.feitos : 0) + '</div>' +
        (p.feitos >= 4 ? '<p class="cp-legenda' + (novo && p.feitos === 4 ? ' cp-novo' : '') + '">' + esc(p.conteudo.legenda) + '</p>' : '<p class="cp-legenda vazia">' + esc(p.passos[p.feitos] || '') + '…</p>');
      return;
    }
    if (p.tipo === 'whatsapp') { box.innerHTML = balao(c, p, novo, textoWhatsapp(p)); return; }
    box.innerHTML = calendarioHtml(c, p, novo, datasDe(p), p.estado === 'pronta' ? 99 : p.feitos);
  }

  /* a Tela nasce seção a seção numa sombra (shadow DOM) com o mesmo HTML do arquivo; pronta, mostra o arquivo de verdade
     (se alguém editou a landing no Site|Código, a prévia é o arquivo, num iframe sem scripts) */
  function previaTela(P, c, p, box, novo) {
    var a = L().arquivo(p.arquivo), gerado = p.estado === 'pronta' ? landingHtml(c, p) : null;
    if (a && gerado && a.conteudo !== gerado) {
      if (!P.tela || P.tela.modo !== 'arquivo') { box.innerHTML = '<div class="cp-tela-quadro"><iframe sandbox="" tabindex="-1" title="Prévia da landing" aria-hidden="true"></iframe></div>'; P.tela = { modo: 'arquivo', src: null }; medirTela(P); }
      if (P.tela.src !== a.conteudo) { box.querySelector('iframe').srcdoc = a.conteudo; P.tela.src = a.conteudo; }
      return;
    }
    if (!P.tela || P.tela.modo !== 'sombra' || !P.tela.root) {
      box.innerHTML = '<div class="cp-tela-quadro"><div class="cp-tela-host"></div></div>';
      var host = box.querySelector('.cp-tela-host'), root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
      root.innerHTML = '<style>' + CSS_LANDING + ':host{display:block}.pagina{min-height:100%}.nasce{animation:nasce .6s cubic-bezier(.2,0,0,1) both;position:relative}' +
        '.nasce::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(163,118,233,.28),rgba(42,213,229,.10) 60%,transparent);animation:rastro 1.2s linear both}' +
        '@keyframes nasce{from{opacity:0;transform:translateY(10px)}}@keyframes rastro{from{opacity:1}to{opacity:0}}' +
        '@media (prefers-reduced-motion:reduce){.nasce,.nasce::after{animation:none}}</style><div class="pagina"></div>';
      P.tela = { modo: 'sombra', root: root, host: host, pagina: root.querySelector('.pagina'), n: 0 };
      medirTela(P);
    }
    var partes = landingPartes(p.conteudo), alvo = p.estado === 'pronta' ? partes.length : p.feitos;
    while (P.tela.n < alvo) {
      var d = document.createElement('div');
      d.innerHTML = partes[P.tela.n];
      var sec = d.firstElementChild;
      if (novo && !reduzido()) sec.classList.add('nasce');
      P.tela.pagina.appendChild(sec);
      P.tela.n++;
    }
    seguirTela(P, p.estado === 'pronta');
  }
  function medirTela(P) {
    var q = P.el.querySelector('.cp-tela-quadro');
    if (!q) return;
    var k = q.clientWidth / LARGURA_TELA;
    if (!k) return;
    q.style.setProperty('--k', k.toFixed(4));
    q.style.setProperty('--alt', Math.round(q.clientHeight / k) + 'px');
    if (P.tela && P.tela.modo === 'sombra') seguirTela(P, P.tela.fim);
  }
  /* enquanto nasce, a prévia acompanha a seção mais nova; pronta, volta ao topo (o herói da página) */
  function seguirTela(P, fim) {
    if (!P.tela || !P.tela.host) return;
    P.tela.fim = !!fim;
    var q = P.el.querySelector('.cp-tela-quadro'), k = parseFloat(q && q.style.getPropertyValue('--k')) || 0;
    if (!k) return;
    var visivel = q.clientHeight / k, total = P.tela.pagina.offsetHeight, y = fim ? 0 : Math.max(0, total - visivel);
    P.tela.host.style.setProperty('--y', (-y).toFixed(0) + 'px');
  }

  function textoWhatsapp(p) { var a = p.estado === 'pronta' && L().arquivo(p.arquivo); return a && typeof a.conteudo === 'string' ? a.conteudo.trim().split(/\n\s*\n/) : p.conteudo.partes; }
  function formatarWa(t) { return esc(t).replace(/\*([^*\n]+)\*/g, '<b>$1</b>').replace(/\{\{(\w+)\}\}/g, '<mark class="cp-var">{{$1}}</mark>').replace(/\n/g, '<br>'); }
  function balao(c, p, novo, partes) {
    var vivas = partes.slice(0, p.estado === 'pronta' ? partes.length : p.feitos);
    return '<div class="cp-wa"><div class="cp-wa-topo"><span class="cp-wa-av" aria-hidden="true"></span><span><b>{{nome}}</b><small>cliente · mensagem sugerida</small></span></div>' +
      '<div class="cp-wa-conversa">' + (vivas.length ? '<div class="cp-wa-balao">' + vivas.map(function (t, i) {
        return '<p' + (novo && i === vivas.length - 1 ? ' class="cp-novo"' : '') + '>' + formatarWa(t) + (p.estado !== 'pronta' && i === vivas.length - 1 ? '<i class="cp-cursor" aria-hidden="true"></i>' : '') + '</p>';
      }).join('') + '<time>' + U.hora(p.prontaEm || Date.now()) + (p.estado === 'pronta' ? ' · sugere e você manda' : '') + '</time></div>' : '<p class="cp-wa-espera">' + esc(nomeAgente(c)) + ' vai escrever aqui…</p>') + '</div></div>';
  }

  function datasDe(p) {
    var a = p.estado === 'pronta' && L().arquivo(p.arquivo);
    if (!a || typeof a.conteudo !== 'string' || a.conteudo === calendarioCsv(p)) return p.conteudo.datas;
    /* alguém editou o calendario.csv direto: a prévia segue o arquivo */
    var linhas = a.conteudo.trim().split('\n').slice(1), r = [];
    linhas.forEach(function (l) {
      var x = l.split(','), ts = lerPrazo(x[0]);
      if (!ts) return;
      var pid = (x[2] || '').replace(/\.(svg|html|txt|csv)$/, '').replace('landing', 'tela');
      r.push({ ts: ts, oque: x[1] || '', peca: pid, dono: (acharPessoa(x[3]) || {}).id || p.dono });
    });
    return r.length ? r : p.conteudo.datas;
  }
  function calendarioHtml(c, p, novo, datas, quantas) {
    var vivas = datas.slice(0, quantas), inicio = meiaNoite(c.ts), seg = inicio - ((new Date(inicio).getDay() + 6) % 7) * DIA;
    var fim = meiaNoite(c.prazo), semanas = Math.min(6, Math.max(1, Math.ceil((fim - seg + DIA) / (7 * DIA)))), porDia = {};
    vivas.forEach(function (x) { var k = meiaNoite(x.ts); (porDia[k] = porDia[k] || []).push(x); });
    var hoje = meiaNoite(Date.now()), grade = '<div class="cp-cal-grade" role="presentation">' + ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map(function (d) { return '<span class="cp-cal-dsem">' + d + '</span>'; }).join('');
    for (var i = 0; i < semanas * 7; i++) {
      var d = seg + i * DIA, xs = porDia[d] || [], fora = d < inicio || d > fim;
      grade += '<span class="cp-cal-dia' + (fora ? ' fora' : '') + (d === hoje ? ' hoje' : '') + (d === fim ? ' prazo' : '') + '">' + new Date(d).getDate() +
        (xs.length ? '<i>' + xs.map(function (x) { return '<b style="--dono:' + corDe(x.dono) + '"></b>'; }).join('') + '</i>' : '') + '</span>';
    }
    grade += '</div>';
    return '<div class="cp-cal">' + grade + '<ol class="cp-cal-lista">' + vivas.map(function (x, i) {
      return '<li' + (novo && i === vivas.length - 1 ? ' class="cp-novo"' : '') + ' style="--dono:' + corDe(x.dono) + '"><time class="num">' + diaCurto(x.ts) + ' ' + dm(x.ts) + '</time><span>' + esc(x.oque) + '</span>' + avatar(x.dono, 16) + '</li>';
    }).join('') + '</ol></div>';
  }

  /* ---------------- atualizar: o estado manda; a luz só acende na mudança que o palco viu acontecer ---------------- */

  function atualizar(cid, primeira) {
    var P = palcos[cid], c = achar(cid);
    if (!P || !c) return;
    var el = P.el, eu = L().eu, meu = c.por === eu, vivo = !el.hidden && document.visibilityState !== 'hidden', efeitos = vivo && !primeira;
    var n = prontas(c), ok = comOk(c);
    /* cabeçalho */
    el.setAttribute('data-estado', c.estado);
    var st = el.querySelector('.cp-estado');
    st.textContent = c.estado === 'gerando' ? nomeAgente(c) + ' gera · ' + n + ' de 6 peças prontas' : c.estado === 'pronta' ? '6 de 6 prontas · ' + (meu ? 'espera o seu OK' : 'espera o OK de ' + nomeDe(c.por)) + (ok ? ' · ' + ok + ' com OK' : '') : 'no ar · OK de ' + nomeDe(c.por) + ' · ' + U.hora(c.noArEm || Date.now());
    var faltam = c.pecas.filter(function (p) { return p.estado === 'pronta' && !p.ok; }).length, bt = el.querySelector('.cp-ok-todas');
    bt.hidden = !(podeOk(eu, c) && faltam > 1);
    bt.querySelector('.cp-ok-todas-t').textContent = 'OK nas ' + faltam + ' prontas';
    /* peças */
    c.pecas.forEach(function (p) {
      var v = P.visto.pecas[p.id], card = el.querySelector('.cp-peca[data-peca="' + p.id + '"]'), pct = p.feitos / p.passos.length;
      if (!card) return;
      card.setAttribute('data-estado', p.estado);
      card.classList.toggle('com-ok', !!p.ok);
      setAnel(card, pct);
      card.querySelector('.cp-progresso i').textContent = Math.round(pct * 100) + '%';
      card.querySelector('.cp-progresso').title = p.feitos + ' de ' + p.passos.length + (p.passos[p.feitos] ? ' · agora: ' + p.passos[p.feitos] : '');
      card.querySelector('.cp-peca-st').textContent = p.estado === 'fila' ? 'na fila' : p.estado === 'gerando' ? nomeAgente(c) + ' escreve · ' + (p.passos[p.feitos] || '').toLowerCase() : 'pronta · ' + U.hora(p.prontaEm);
      var selo = card.querySelector('.cp-selo');
      selo.hidden = p.estado !== 'pronta' || (!p.ok && !p.rompido && podeOk(eu, c));
      selo.className = 'cp-selo ' + (p.ok ? 'selado' : p.rompido ? 'rompido' : meu ? 'esperando-eu' : 'aberto');
      selo.style.setProperty('--quem', corDe(p.ok ? p.ok.quem : p.rompido ? p.rompido.quem : c.por));
      selo.innerHTML = '<span class="cp-selo-ic" aria-hidden="true"></span>' + (p.ok ? 'OK · ' + esc(nomeDe(p.ok.quem)) + ' · <span class="num">' + U.hora(p.ok.ts) + '</span>' :
        p.rompido ? 'Rompido por ' + esc(nomeDe(p.rompido.quem)) + ' · <span class="num">' + U.hora(p.rompido.ts) + '</span>' : meu ? 'espera o seu OK' : 'espera o OK de ' + esc(nomeDe(c.por)));
      card.querySelector('.cp-ok').hidden = !(p.estado === 'pronta' && !p.ok && podeOk(eu, c));
      var marco = el.querySelector('.cp-regua li[data-peca="' + p.id + '"]');
      if (marco) { marco.className = p.ok ? 'ok' : p.estado; }
      /* transições */
      if (p.feitos !== v.feitos || (p.tipo !== 'anuncio' && p.tipo !== 'tela' && p.estado === 'pronta')) {
        desenharPrevia(P, c, p, efeitos && p.feitos > v.feitos);
        if (efeitos && p.feitos > v.feitos) {
          var escrito = p.tipo === 'tela' ? (landingPartes(p.conteudo)[p.feitos - 1] || '').length : p.tipo === 'whatsapp' ? String(p.conteudo.partes[p.feitos - 1] || '').length : 180;
          if (P.pres && P.pres.bytes) P.pres.bytes(escrito * 6);
          var oo = org(); if (oo) oo.acender(card, 1500);
          if (BC.poderes && p.feitos < p.passos.length) BC.poderes.faisca(card.querySelector('.cp-progresso') || card, { cor: corDe(p.dono) });
        }
      } else if (p.tipo === 'tela' && p.estado === 'pronta') desenharPrevia(P, c, p, false);
      if (p.estado === 'pronta' && v.estado !== 'pronta') {
        if (efeitos) efeitoPronta(P, c, p); else marcarItem(el, p, false);
      } else if (p.estado === 'pronta' && !v.pulso) marcarItem(el, p, false);
      if (p.ok && v.ok !== p.ok.ts && efeitos) efeitoOk(P, c, p, card);
      v.feitos = p.feitos; v.estado = p.estado; v.ok = p.ok ? p.ok.ts : null;
    });
    /* a presença diz o estado do agente */
    var estPres = c.estado === 'gerando' ? 'rodando' : c.estado === 'pronta' ? (faltam ? 'espera' : 'terminou') : 'terminou';
    if (P.pres && P.pres.estadoAtual && P.pres.estadoAtual() !== estPres) P.pres.estado(estPres, { desde: c.ts, fim: c.prontaEm || Date.now(), duracao: (c.prontaEm || Date.now()) - c.ts });
    var pc = el.querySelector('.cp-pres-css'); if (pc) pc.setAttribute('data-estado', estPres);
    frasePresenca(P, c);
    /* o rito e os pontos */
    if (c.estado !== P.visto.estado) {
      var antes = P.visto.estado;
      P.visto.estado = c.estado;
      if (efeitos && c.estado === 'pronta' && antes === 'gerando') { P.ritoAgendado = true; setTimeout(function () { P.ritoAgendado = false; if (palcos[cid] === P) rito(P, achar(cid), 'pronta'); }, 700); }
      else if (efeitos && c.estado === 'no-ar') { P.ritoAgendado = true; setTimeout(function () { P.ritoAgendado = false; if (palcos[cid] === P) rito(P, achar(cid), 'no-ar'); }, 420); }
      else textoRito(P, c);
    } else if (!P.ritoAgendado) textoRito(P, c);
    pontos(P, c, meu, efeitos);
    relogio();
  }

  function frasePresenca(P, c) {
    var el = P.el.querySelector('.cp-pres-st'), faltam = c.pecas.filter(function (p) { return p.estado === 'pronta' && !p.ok; }).length;
    if (!el) return;
    el.textContent = c.estado === 'gerando' ? 'escreve há ' + U.duracao(Date.now() - c.ts) + ' · ' + prontas(c) + ' de 6' :
      faltam ? 'terminou · ' + U.hora(c.prontaEm) + ' · espera o OK' : 'terminou · ' + U.hora(c.prontaEm || c.ts) + ' · campanha no ar';
    el.classList.toggle('espera', c.estado === 'pronta' && faltam > 0);
  }
  function relogio() {
    var precisa = Object.keys(palcos).some(function (k) { var c = achar(k); return c && c.estado === 'gerando' && !palcos[k].el.hidden; });
    if (precisa && !relogioT) relogioT = setInterval(function () {
      if (document.visibilityState === 'hidden') return;
      Object.keys(palcos).forEach(function (k) { var c = achar(k); if (c && !palcos[k].el.hidden) frasePresenca(palcos[k], c); });
    }, 1000);
    if (!precisa && relogioT) { clearInterval(relogioT); relogioT = null; }
  }

  function marcarItem(el, p, aceso) {
    var li = el.querySelector('.cp-check li[data-peca="' + p.id + '"]');
    if (!li) return;
    li.classList.add('feito', 'on');
    if (aceso) { var o = org(); if (o) o.acender(li, MV_CURTA); else { li.classList.remove('cp-acende'); void li.offsetWidth; li.classList.add('cp-acende'); } }
  }

  /* peça pronta: o pulso roxo → ciano sai da presença e corre até a peça; ao chegar, a peça acende, o item do plano ganha
     o ✓, 6 faíscas sobem da peça e soa o tique (só para quem pediu) */
  function efeitoPronta(P, c, p) {
    var v = P.visto.pecas[p.id], card = P.el.querySelector('.cp-peca[data-peca="' + p.id + '"]');
    var origem = P.pres || P.el.querySelector('.cp-pres-lugar'), o = org(), meu = c.por === L().eu;
    v.pulso = true;
    function chegou() {
      v.pulso = false;
      if (!palcos[P.id]) return;
      marcarItem(P.el, p, true);
      card.classList.remove('cp-chegou'); void card.offsetWidth; card.classList.add('cp-chegou');
      var pd = BC.poderes;
      if (o) { o.acender(card, MV_CURTA); o.faiscas(card, p.tipo === 'tela' ? 8 : 6, p.tipo === 'tela'); if (meu && !pd) o.som('tique'); }
      if (pd) poderPronta(P, p, card, meu);
    }
    if (o) o.pulso(origem, card, { cor: 'marca', forte: p.tipo === 'tela', aoChegar: chegou });
    else pulsoCss(P, origem, card, chegou);
  }
  /* o poder da peça pronta (BC.poderes): explosão na cor do dono, "+2" subindo e 4 orbes que voam até o placar */
  function poderPronta(P, p, card, meu) {
    var pd = BC.poderes, corP = corDe(p.dono), placar = P.el.querySelector('.cp-pts-n'), caixa = P.el.querySelector('.cp-pontos');
    pd.explodir(card, { cor: corP, forca: p.tipo === 'tela' ? 1.4 : 1 });
    pd.flutuar(card, '+2', { cor: corP, topo: true });
    if (!meu) return;
    pd.som('poder');
    if (placar && caixa && !caixa.hidden) pd.voar(card, placar, { n: 4, cor: corP });
  }
  /* sem o motor do organismo (protótipo puro): um ponto de luz em CSS corre da presença até a peça */
  function pulsoCss(P, de, para, aoChegar) {
    var a = de && de.getBoundingClientRect ? de.getBoundingClientRect() : null, b = para.getBoundingClientRect(), base = P.el.getBoundingClientRect();
    if (reduzido() || !a || !a.width || !b.width || !document.body.animate) { aoChegar(); return; }
    var bola = document.createElement('i');
    bola.className = 'cp-pulso';
    P.el.appendChild(bola);
    var x0 = a.left + a.width / 2 - base.left + P.el.scrollLeft, y0 = a.top + a.height / 2 - base.top + P.el.scrollTop, x1 = b.left + b.width / 2 - base.left + P.el.scrollLeft, y1 = b.top + 14 - base.top + P.el.scrollTop;
    var meio = { x: (x0 + x1) / 2, y: Math.min(y0, y1) - 40 };
    var an = bola.animate([
      { transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(.6)', opacity: 0, background: '#a376e9' },
      { transform: 'translate(' + meio.x + 'px,' + meio.y + 'px) scale(1)', opacity: 1, offset: 0.45 },
      { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(1.4)', opacity: 0.9, background: '#2ad5e5' }
    ], { duration: 600, easing: 'cubic-bezier(.2,0,0,1)' });
    var feito = false;
    function fim() { if (feito) return; feito = true; if (bola.parentNode) bola.parentNode.removeChild(bola); aoChegar(); }
    an.onfinish = fim; an.oncancel = fim;
    setTimeout(fim, 1000); /* aba escondida: o pulso chega do mesmo jeito */
  }
  /* OK de quem pediu: a luz percorre a peça e o Selo fecha com nome e hora (400 ms) */
  function efeitoOk(P, c, p, card) {
    card.classList.remove('cp-selando'); void card.offsetWidth; card.classList.add('cp-selando');
    var o = org(); if (o) o.acender(card, MV_CURTA);
  }

  function textoRito(P, c) {
    var box = P.el.querySelector('.cp-rito');
    if (c.estado === 'gerando') { box.hidden = true; return; }
    box.hidden = false;
    box.classList.toggle('no-ar', c.estado === 'no-ar');
    box.querySelector('b').textContent = c.estado === 'no-ar' ? 'Campanha no ar' : 'Campanha pronta';
    box.querySelector('small').textContent = c.estado === 'no-ar'
      ? '6 peças com OK de ' + nomeDe(c.por) + ' · ' + U.hora(c.noArEm) + ' · a parede já viu'
      : '6 peças · ' + donosDistintos(c) + ' donos · ' + U.duracao(c.prontaEm - c.ts) + ' · ' + nomeAgente(c) + ', agente de ' + nomeDe(c.por) + ' · falta o OK de ' + nomeDe(c.por) + ' em ' + c.pecas.filter(function (p) { return !p.ok; }).length;
  }
  /* o rito (REGUA R6): o palco respira uma vez, faíscas sobem, o placar sobe contando; depois esfria */
  function rito(P, c, qual) {
    if (!c || !palcos[P.id]) return;
    textoRito(P, c);
    var box = P.el.querySelector('.cp-rito'), pecas = P.el.querySelector('.cp-pecas'), o = org(), meu = c.por === L().eu;
    box.classList.remove('nasce'); void box.offsetWidth; box.classList.add('nasce');
    var pd = BC.poderes;
    if (pd) {
      var tot = contaPontos(c).reduce(function (s, x) { return s + x.n; }, 0);
      pd.combo(pecas, qual === 'no-ar' ? 'Campanha no ar' : 'Campanha pronta', qual === 'no-ar' ? '6 OKs · a parede já viu' : 'COMBO ×6' + (meu ? ' · ' + tot + ' pontos' : ''), { cor: qual === 'no-ar' ? 'ouro' : 't0' });
      if (meu) pd.som('combo');
    }
    if (o) {
      o.respirar(pecas, qual === 'no-ar' ? { cor: 'ouro' } : {});
      o.faiscas(box, 12, true, qual === 'no-ar' ? { cor: 'ouro' } : {});
      if (meu && !pd) o.som(qual === 'no-ar' ? 'tres' : 'duas');
    } else { pecas.classList.remove('cp-respira', 'ouro'); void pecas.offsetWidth; pecas.classList.add('cp-respira'); if (qual === 'no-ar') pecas.classList.add('ouro'); }
    P.el.querySelectorAll('.cp-peca').forEach(function (card) { if (o) o.acender(card, MV_CURTA); });
    if (!box.getBoundingClientRect().height || box.getBoundingClientRect().top > window.innerHeight) box.scrollIntoView({ block: 'nearest', behavior: reduzido() ? 'auto' : 'smooth' });
  }

  /* pontos com origem (REGUA §3): só quem pediu vê; peça pronta = 2; campanha pronta = 8 × surpresa (antes do prazo 1,5) */
  function contaPontos(c) {
    var itens = [];
    c.pecas.forEach(function (p) { if (p.estado === 'pronta') itens.push({ n: 2, origem: p.rotulo + ' pronta · ' + nomeDe(p.dono) + ' · ' + U.hora(p.prontaEm) }); });
    if (c.estado !== 'gerando' && c.prontaEm) {
      var sur = c.prontaEm < c.prazo - DIA ? 1.5 : c.prontaEm <= c.prazo ? 1 : 0.75;
      itens.push({ n: Math.round(8 * sur), origem: 'Campanha pronta · 8 × surpresa ' + String(sur).replace('.', ',') + (sur > 1 ? ' (antes do prazo)' : '') });
    }
    return itens;
  }
  function pontos(P, c, meu, efeitos) {
    var box = P.el.querySelector('.cp-pontos');
    box.hidden = !meu;
    P.el.querySelectorAll('.cp-ck-pts').forEach(function (x) { x.hidden = !meu; });
    if (!meu) return;
    var itens = contaPontos(c), total = itens.reduce(function (s, x) { return s + x.n; }, 0), nEl = box.querySelector('.cp-pts-n');
    if (total !== P.pts) {
      var de = P.pts, para = total;
      P.pts = total;
      box.querySelector('.cp-pts-o').innerHTML = itens.length ? '<b>+' + itens[itens.length - 1].n + '</b> · ' + esc(itens[itens.length - 1].origem) : '';
      if (!efeitos || reduzido()) nEl.textContent = para;
      else {
        var t0 = performance.now(), passo = function (t) { var k = Math.min(1, (t - t0) / 700); nEl.textContent = Math.round(de + (para - de) * (1 - Math.pow(1 - k, 3))); if (k < 1 && palcos[P.id]) requestAnimationFrame(passo); };
        nEl.classList.remove('sobe'); void nEl.offsetWidth; nEl.classList.add('sobe');
        requestAnimationFrame(passo);
      }
    }
  }

  /* ================================================================== as vistas (abas) */

  BC.vistas.campanha = {
    conteudo: function (tab) {
      setTimeout(sincronizar, 0);
      if (tab.peca) return editorDaPeca(tab);
      return achar(tab.ref) ? '<div class="cp-lugar" aria-hidden="true"></div>' : '<div class="pagina-cab"><div><h1 class="pagina-titulo">Campanha</h1><p class="pagina-sub">Esta campanha foi desfeita.</p></div></div>';
    },
    lateral: function () {
      var cs = geradas(), e = estacao(), tab = e ? e.abaAtual() : null;
      var atual = tab && tab.tipo === 'campanha' ? tab.ref : cs[0] && cs[0].id;
      var h = '<div class="lat-titulo"><span class="rotulo">Campanhas geradas</span></div>';
      if (!cs.length) return h + '<p class="form-ajuda cp-lat-vazio">Peça ao agente: “gera a campanha Clínica Vida para a Carla até 30/09”. Nasce com a Tela, 3 anúncios, o WhatsApp e o calendário, cada peça com dono.</p>';
      return h + '<ul class="lat-lista cp-lat">' + cs.map(function (c) {
        var aberta = c.id === atual;
        return '<li><button type="button" class="lat-item cp-lat-camp"' + (aberta ? ' aria-current="true"' : '') + ' data-acao="cp-campanha" data-campanha="' + esc(c.id) + '" data-estado="' + c.estado + '">' +
          '<span class="rotulo-texto">' + esc(c.nome) + '</span><span class="conta num">' + (c.estado === 'no-ar' ? 'no ar' : prontas(c) + '/6') + '</span></button>' +
          (aberta ? '<ul class="cp-lat-pecas">' + c.pecas.map(function (p) {
            return '<li><button type="button" class="lat-item cp-lat-peca" data-acao="cp-abrir" data-campanha="' + esc(c.id) + '" data-peca="' + p.id + '" data-estado="' + (p.ok ? 'ok' : p.estado) + '" style="--dono:' + corDe(p.dono) + '" title="' + esc(p.arquivo) + '">' +
              anel(p.feitos / p.passos.length, 14) + '<span class="rotulo-texto">' + esc(p.rotulo) + '</span>' + avatar(p.dono, 16) + '</button></li>';
          }).join('') + '<li class="cp-lat-pasta form-ajuda">' + esc(c.pasta) + '</li></ul>' : '') + '</li>';
      }).join('') + '</ul>';
    }
  };

  function cabecalhoEditor(c, p, tab, modos) {
    var meu = podeOk(L().eu, c);
    return '<header class="cp-ed-cab"><nav class="cp-endereco" aria-label="Endereço">' + endereco(c, p) + '<small class="cp-ed-arq">' + esc(p.arquivo.split('/').pop()) + '</small></nav>' +
      '<div class="cp-ed-cab-dir"><span class="cp-dono" title="Dono da peça" style="--dono:' + corDe(p.dono) + '">' + avatar(p.dono, 20) + '<span>' + esc(nomeDe(p.dono)) + ' · dono</span></span>' +
      '<span class="cp-selo ' + (p.ok ? 'selado' : p.rompido ? 'rompido' : meu ? 'esperando-eu' : 'aberto') + '" style="--quem:' + corDe(p.ok ? p.ok.quem : p.rompido ? p.rompido.quem : c.por) + '"><span class="cp-selo-ic" aria-hidden="true"></span>' +
      (p.ok ? 'OK · ' + esc(nomeDe(p.ok.quem)) + ' · <span class="num">' + U.hora(p.ok.ts) + '</span>' : p.rompido ? 'Rompido por ' + esc(nomeDe(p.rompido.quem)) + ' · <span class="num">' + U.hora(p.rompido.ts) + '</span>' : meu ? 'espera o seu OK' : 'espera o OK de ' + esc(nomeDe(c.por))) + '</span>' +
      (p.estado === 'pronta' && !p.ok && meu ? '<button type="button" class="botao cp-ok" data-acao="cp-ok" data-campanha="' + esc(c.id) + '" data-peca="' + p.id + '"><span class="cp-selo-ic" aria-hidden="true"></span>OK</button>' : '') +
      (modos ? '<span class="alternar cp-alternar">' + modos.map(function (m) { return '<button type="button" class="' + (m[2] ? 'ativo' : '') + '" data-acao="cp-ed-modo" data-modo="' + m[0] + '">' + m[1] + '</button>'; }).join('') + '</span>' : '') +
      '</div></header>';
  }
  /* o endereço de uma aba de campanha, pronto para o cabeçalho do objeto (sala › bancada › peça) */
  BC.vistas.campanha.endereco = function (tab) {
    var c = tab && achar(tab.ref), p = c && tab.peca ? peca(c, tab.peca) : null;
    if (!c) return null;
    var partes = [{ rotulo: 'Campanhas', nivel: 'sala' }, { rotulo: c.nome, nivel: p ? 'bancada' : 'peca', ir: { campanha: c.id } }];
    if (p) partes.push({ rotulo: p.rotulo, nivel: 'peca', arquivo: p.arquivo, dono: p.dono });
    return { partes: partes, texto: partes.map(function (x) { return x.rotulo; }).join(' › '), pasta: c.pasta, arquivo: p ? p.arquivo : null };
  };
  function editorDaPeca(tab) {
      var c = achar(tab.ref), p = peca(c, tab.peca);
      if (!p) return '<div class="pagina-cab"><div><h1 class="pagina-titulo">Peça</h1><p class="pagina-sub">Esta peça não existe mais: a campanha foi desfeita.</p></div></div>';
      if (p.estado !== 'pronta') return '<div class="cp-ed">' + cabecalhoEditor(c, p, tab) + '<p class="form-ajuda">' + esc(p.rotulo) + ' ainda está nascendo · ' + p.feitos + ' de ' + p.passos.length + '.</p></div>';
      var id = 'cped-' + c.id + '-' + p.id;
      if (p.tipo === 'anuncio') {
        var modo = tab.modo === 'texto' ? 'texto' : 'imagem', k = p.conteudo;
        var corpo = modo === 'imagem'
          ? '<div class="cp-ed-anuncio"><figure class="cp-ed-arte' + (k.formato === 'stories' ? ' stories' : '') + '">' + svgAnuncio(p, 99, id) + '</figure>' +
            '<div class="cp-ed-feed"><div class="cp-ed-post"><span class="cp-ed-marca"><i></i>' + esc(k.marca) + '</span><p class="cp-legenda">' + esc(k.legenda) + '</p></div>' +
            '<dl class="cp-ed-ficha"><dt>Formato</dt><dd>' + (k.formato === 'stories' ? 'Stories · 9:16' : 'Feed · 1:1') + '</dd><dt>Ângulo</dt><dd>' + esc(k.angulo) + '</dd><dt>Chamada</dt><dd>' + esc(k.chamada) + '</dd><dt>Arquivo</dt><dd>' + esc(p.arquivo) + '</dd></dl>' +
            '<p class="form-ajuda">A arte é vetor com texto de verdade (nada de texto em pixel). Para mudar o texto: <button type="button" class="cp-link" data-acao="cp-ed-modo" data-modo="texto">Texto</button>.</p></div></div>'
          : '<form class="cp-ed-form cp-ed-anuncio" data-form="cp-peca" data-campanha="' + esc(c.id) + '" data-peca="' + p.id + '"><figure class="cp-ed-arte pequena' + (k.formato === 'stories' ? ' stories' : '') + '" data-cp-arte="' + id + '">' + svgAnuncio(p, 99, id + 't') + '</figure>' +
            '<div class="cp-ed-campos"><label>Título da arte<input type="text" id="cpf-titulo" maxlength="90" value="' + esc(k.titulo) + '" data-cp-vivo></label>' +
            '<label>Chamada do botão<input type="text" id="cpf-chamada" maxlength="40" value="' + esc(k.chamada) + '" data-cp-vivo></label>' +
            '<label>Legenda do post<textarea id="cpf-legenda" rows="5" maxlength="600">' + esc(k.legenda) + '</textarea></label>' +
            '<div class="dem-acoes"><button type="submit" class="botao primario">Salvar anúncio</button><span class="form-ajuda">Salvar grava ' + esc(p.arquivo.split('/').pop()) + (p.ok ? ' e rompe o OK de ' + esc(nomeDe(p.ok.quem)) : '') + '.</span></div></div></form>';
        return '<div class="cp-ed" data-peca="' + p.id + '">' + cabecalhoEditor(c, p, tab, [['imagem', 'Imagem', modo === 'imagem'], ['texto', 'Texto', modo === 'texto']]) + corpo + '</div>';
      }
      if (p.tipo === 'whatsapp') {
        var partes = textoWhatsapp(p);
        return '<div class="cp-ed" data-peca="' + p.id + '">' + cabecalhoEditor(c, p, tab) +
          '<div class="cp-ed-wa"><div class="cp-ed-wa-tela">' + balao(c, p, false, partes) + '<p class="form-ajuda">Mensagem sugerida: o babel-coop sugere e você manda. {{nome}} vira o nome de cada cliente.</p></div>' +
          '<form class="cp-ed-form" data-form="cp-peca" data-campanha="' + esc(c.id) + '" data-peca="' + p.id + '"><label>Mensagem (linha em branco separa os balões)<textarea id="cpf-texto" rows="10" maxlength="1200">' + esc(partes.join('\n\n')) + '</textarea></label>' +
          '<div class="dem-acoes"><button type="submit" class="botao primario">Salvar mensagem</button><button type="button" class="botao" data-acao="cp-copiar" data-campanha="' + esc(c.id) + '" data-peca="' + p.id + '">Copiar</button>' +
          '<button type="button" class="botao" data-acao="cp-wa">Abrir o WhatsApp</button></div></form></div></div>';
      }
      var ds = datasDe(p), modoC = tab.modo === 'mes' ? 'mes' : 'lista';
      return '<div class="cp-ed" data-peca="' + p.id + '">' + cabecalhoEditor(c, p, tab, [['lista', 'Lista', modoC === 'lista'], ['mes', 'Mês', modoC === 'mes']]) +
        (modoC === 'mes' ? '<div class="cp-ed-mes">' + calendarioHtml(c, p, false, ds, 99) + '</div>' :
          '<form class="cp-ed-form cp-ed-datas" data-form="cp-peca" data-campanha="' + esc(c.id) + '" data-peca="' + p.id + '"><ol class="cp-datas">' + ds.map(function (x, i) {
            return '<li style="--dono:' + corDe(x.dono) + '"><input type="date" id="cpf-data-' + i + '" value="' + iso(x.ts) + '" aria-label="Data"><input type="text" id="cpf-oque-' + i + '" value="' + esc(x.oque) + '" maxlength="80" aria-label="O que sai">' +
              '<button type="button" class="cp-link" data-acao="cp-abrir" data-campanha="' + esc(c.id) + '" data-peca="' + esc(x.peca) + '">' + esc(nomePeca(x.peca)) + '</button>' + avatar(x.dono, 18) + '</li>';
          }).join('') + '</ol><div class="dem-acoes"><button type="submit" class="botao primario">Salvar calendário</button><span class="form-ajuda">Grava calendario.csv · o prazo é ' + esc(c.prazoTexto) + '.</span></div></form>') + '</div>';
  }

  /* ================================================================== ações da interface (cliques e formulários) */

  A['cp-campanha'] = function (el) { abrir(el.dataset.campanha); };
  A['cp-abrir'] = function (el, ev) { if (ev) ev.stopPropagation(); abrirPeca(el.dataset.campanha, el.dataset.peca); };
  A['cp-ok'] = function (el, ev) {
    if (ev) ev.stopPropagation();
    var c = achar(el.dataset.campanha), e = estacao();
    if (!c) return;
    if (!L().fazer('campanhaOk', c.id, el.dataset.peca)) { if (e) e.aviso(podeOk(L().eu, c) ? 'Nada para dar OK agora.' : 'Só ' + nomeDe(c.por) + ', que pediu a campanha, dá o OK.'); }
  };
  A['cp-ed-modo'] = function (el) { var e = estacao(); if (!e) return; var t = e.abaAtual(); t.modo = el.dataset.modo; e.render(); };
  A['cp-copiar'] = function (el) {
    var p = peca(achar(el.dataset.campanha), el.dataset.peca), campo = document.getElementById('cpf-texto'), txt = campo ? campo.value : p ? textoWhatsapp(p).join('\n\n') : '';
    var ok = function () { estacao().aviso('Mensagem copiada: cole na conversa do WhatsApp. {{nome}} vira o nome de cada cliente.'); };
    try { navigator.clipboard.writeText(txt).then(ok, function () { estacao().aviso('Não deu para copiar aqui: selecione o texto e use Ctrl C.'); }); } catch (e) { estacao().aviso('Não deu para copiar aqui: selecione o texto e use Ctrl C.'); }
  };
  A['cp-wa'] = function () { estacao().abrir('whatsapp'); };
  F['cp-peca'] = function (f) {
    var c = achar(f.dataset.campanha), p = peca(c, f.dataset.peca), e = estacao(), campos = {};
    if (!p) return;
    if (p.tipo === 'anuncio') campos = { titulo: f.querySelector('#cpf-titulo').value.trim(), chamada: f.querySelector('#cpf-chamada').value.trim(), legenda: f.querySelector('#cpf-legenda').value.trim() };
    if (p.tipo === 'whatsapp') campos = { texto: f.querySelector('#cpf-texto').value };
    if (p.tipo === 'calendario') { campos = { datas: [] }; f.querySelectorAll('.cp-datas li').forEach(function (li, i) { campos.datas.push({ data: (li.querySelector('#cpf-data-' + i) || {}).value, oque: (li.querySelector('#cpf-oque-' + i) || {}).value }); }); }
    var tinhaOk = p.ok, r = L().fazer('campanhaEditar', c.id, p.id, campos);
    if (!r) { e.aviso('Não deu para salvar.'); return; }
    e.aviso((p.editadoEm && Date.now() - p.editadoEm < 2000 ? 'Salvo: ' + p.rotulo + ' · ' + p.arquivo.split('/').pop() + ' mudou' : 'Nada mudou.') + (tinhaOk && !p.ok ? ' · o OK de ' + nomeDe(tinhaOk.quem) + ' foi rompido: peça de novo.' : ''));
    if (p.tipo === 'anuncio') { var t = e.abaAtual(); t.modo = 'imagem'; }
    e.render();
  };
  /* a arte do anúncio acompanha o que se digita (sem gravar nada até Salvar) */
  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (!t || !t.hasAttribute || !t.hasAttribute('data-cp-vivo')) return;
    var f = t.closest('form[data-form="cp-peca"]'), p = f && peca(achar(f.dataset.campanha), f.dataset.peca), fig = f && f.querySelector('[data-cp-arte]');
    if (!p || !fig) return;
    var k = {}; Object.keys(p.conteudo).forEach(function (x) { k[x] = p.conteudo[x]; });
    k.titulo = f.querySelector('#cpf-titulo').value; k.chamada = f.querySelector('#cpf-chamada').value;
    fig.innerHTML = svgAnuncio(p, 99, fig.getAttribute('data-cp-arte') + 'v', 0, k);
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    var t = ev.target;
    if (t && t.classList && t.classList.contains('cp-previa')) { ev.preventDefault(); t.click(); }
  });

  /* o estado mudou (aqui, na TV ou em outra máquina): cada palco confere o que mudou */
  L().aoMudar(function () {
    if (!naEstacao()) return;
    Object.keys(palcos).forEach(function (k) { if (!achar(k)) return; atualizar(k); });
  });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') Object.keys(palcos).forEach(function (k) { pararAnimacoes(palcos[k].el); }); relogio(); });
  window.addEventListener('load', function () {
    setTimeout(function () {
      vigiar();
      /* recarregou no meio da geração: a Estação de quem pediu retoma de onde parou */
      if (naEstacao()) geradas().forEach(function (c) { if (c.estado === 'gerando' && c.por === L().eu) iniciarMotor(c.id); });
    }, 1500);
  });

  BC.campanha = {
    versao: VERSAO,
    /* gerar({ nome, meta, para, prazo, por, agente?, pedido?, abrir? }) → { id, nome, estado, endereco, pecas:[{id,tipo,titulo,dono,arquivo,estado,progresso,ok}] } ou { erro } */
    gerar: gerar,
    abrir: abrir,
    abrirPeca: abrirPeca,
    ok: function (cid, pid) { return L().fazer('campanhaOk', cid, pid || '*'); },
    lista: function () { return geradas().map(resumo); },
    estado: function (cid) { var c = achar(cid); return c ? resumo(c) : null; },
    interpretar: interpretar,
    /* o intérprete do terminal simulado: "gera a campanha …" */
    entende: function (n) { return /\b(gera|gere|gerar|gerem|materializa|materialize)\b[^.]*\bcampanha\b/.test(n); },
    pedido: function (texto, ag, term) {
      var d = interpretar(texto);
      if (!d.nome && !d.para) { term.escrever('Diga o nome da campanha: gera a campanha Clínica Vida para a Carla até 30/09', 'erro'); return; }
      var r = gerar({ nome: d.nome, meta: d.meta, para: d.para, prazo: d.prazo, por: L().eu, agente: ag && ag.id, pedido: texto });
      if (r.erro) { term.escrever(r.erro, 'erro'); return; }
      var c = achar(r.id);
      if (c.consulta.length && !(BC.memoria && BC.memoria.consultar)) term.escrever('⌕ consultei: ' + c.consulta.map(function (x) { return (x.rotulo || 'Aprendizado · ' + nomeDe(x.pessoa)) + ' · "' + x.texto + '"'; }).join(' · '), 'ia', true);
      term.escrever('plano: 1 Landing · 2–4 Anúncios · 5 WhatsApp · 6 Calendário · donos: ' + c.pecas.map(function (p) { return p.titulo + ' ' + nomeDe(p.dono); }).join(' · '), 'ia');
      term.cartao('Campanha <b>' + esc(c.nome) + '</b> gerando para <b>◉ ' + esc(nomeDe(c.pessoa)) + '</b> · até ' + esc(c.prazoTexto) + (c.meta ? ' · meta ' + esc(c.meta) : '') + ' · 6 peças com dono em ' + esc(c.pasta),
        'campanhaDesfazer:' + c.id, '<button type="button" class="term-mini" data-term="campanha:' + esc(c.id) + '">ver</button>');
    },
    /* instrumentação para os testes */
    _palcos: function () { return Object.keys(palcos); },
    _motores: function () { return Object.keys(motores); }
  };
})(window.BC);
