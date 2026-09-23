/* Babel Coop — protótipo · Navegador do agente: o agente abre um navegador dele dentro da Estação, navega, clica e preenche
   enquanto a pessoa vê tudo; ao lado, o Raio-X (HTML, CSS, Copy, Rede, Console), Clonar página e Clonar copy.
   No app real é código nosso sobre o webContents do Electron, exposto ao Claude pelo conector coop. Aqui é simulado. */
window.BC = window.BC || {};
BC.acoes = BC.acoes || {};
BC.vistas = BC.vistas || {};

(function (BC) {
  'use strict';

  var U = BC.util, esc = U.esc, A = BC.acoes;
  function L() { return BC.loja; }
  function ui() { return BC.estacao.ui; }
  var N = { sessoes: {} };

  function dominio(url) { return String(url).replace(/^https?:\/\//, '').split('/')[0].toLowerCase(); }
  function nomeSite(url) { var d = dominio(url).replace(/^www\./, ''); return d.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }

  /* o site falso que o agente vai visitar (parece um site comum, tema claro) */
  function paginaFalsa(url) {
    var nome = nomeSite(url), d = dominio(url);
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>' + esc(nome) + ' · Cadastro de fornecedor</title>' +
      '<style>body{margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1f2937;background:#fff}nav{display:flex;gap:24px;align-items:center;padding:16px 32px;border-bottom:1px solid #e5e7eb}nav b{color:#0ea5a4;font-size:20px}nav a{color:#374151;text-decoration:none}' +
      'header{padding:56px 32px;background:linear-gradient(135deg,#e0f7f6,#f0f9ff)}h1{margin:0 0 8px;font-size:34px;color:#0f172a}header p{color:#475569;font-size:18px;max-width:600px}.btn{display:inline-block;margin-top:16px;padding:12px 22px;background:#0ea5a4;color:#fff;border-radius:8px;text-decoration:none;font-weight:600}' +
      'section{padding:40px 32px;max-width:720px}h2{color:#0f172a}form{display:grid;gap:14px;max-width:460px}label{display:grid;gap:6px;font-size:14px;color:#334155}input{padding:10px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:15px}input.ok{border-color:#0ea5a4;background:#ecfeff}button{padding:12px 20px;border:0;border-radius:8px;background:#0ea5a4;color:#fff;font-size:15px;font-weight:600;cursor:pointer}button.clicado{background:#0f766e}' +
      '#feito{display:none;margin-top:16px;padding:14px;border-radius:8px;background:#dcfce7;color:#166534}.dep{margin-top:32px;padding:20px;border-left:4px solid #0ea5a4;background:#f8fafc;color:#334155;font-style:italic}footer{padding:24px 32px;color:#94a3b8;font-size:13px;border-top:1px solid #e5e7eb}</style></head>' +
      '<body><nav><b>' + esc(nome) + '</b><a href="#planos">Planos</a><a href="#cadastro" id="link-cadastro">Cadastro de fornecedor</a><a href="#contato">Contato</a></nav>' +
      '<header><h1>Atendimento que cuida do seu paciente</h1><p>A ' + esc(nome) + ' atende em Campinas há 12 anos. Agende sua consulta em 2 minutos.</p><a class="btn" href="#planos">Agendar consulta</a></header>' +
      '<section id="planos"><h2>Planos</h2><p>Consulta avulsa R$ 180 · Plano família R$ 390/mês · Plano empresa sob consulta.</p></section>' +
      '<section id="cadastro"><h2>Cadastro de fornecedor</h2><form onsubmit="return false"><label>Nome da empresa<input id="nome" name="nome"></label><label>E-mail<input id="email" name="email"></label><label>Telefone<input id="telefone" name="telefone"></label><label>O que fornece<input id="servico" name="servico"></label><button id="enviar" type="button">Enviar cadastro</button></form><div id="feito">✓ Cadastro recebido. Retornamos em até 2 dias úteis.</div></section>' +
      '<section><div class="dep">"Marquei pelo WhatsApp às 23h e às 8h já tinha a confirmação." — Paula R., paciente</div></section>' +
      '<footer>' + esc(d) + ' · CNPJ 12.345.678/0001-90 · Campinas, SP</footer>' +
      '<script>window.addEventListener("message",function(e){var m=e.data||{};var el=m.sel?document.querySelector(m.sel):null;if(m.t==="fill"&&el){el.focus();el.value=m.v;el.classList.add("ok")}if(m.t==="click"&&el){el.classList.add("clicado");if(el.id==="enviar"){document.getElementById("feito").style.display="block";el.disabled=true}if(el.getAttribute("href")){var a=document.querySelector(el.getAttribute("href"));if(a)a.scrollIntoView({behavior:"smooth"})}}if(m.t==="scroll"){window.scrollTo({top:m.y,behavior:"smooth"})}});</script></body></html>';
  }

  var REDE = [['GET', '/', '200', 'text/html · 14 KB', 'HTML da página'], ['GET', '/assets/style.css', '200', 'text/css · 6 KB', 'body{margin:0;font-family:…}'], ['GET', '/assets/logo.svg', '200', 'image/svg+xml · 2 KB', '<svg …>'],
    ['GET', '/api/planos.json', '200', 'application/json · 1 KB', '{"planos":[{"nome":"Consulta avulsa","preco":180},{"nome":"Plano família","preco":390}]}'], ['POST', '/api/fornecedores', '201', 'application/json · 0,2 KB', '{"ok":true,"id":"f-2091"}'], ['GET', '/analytics.js', '200', 'text/javascript · 41 KB', '(function(){…})()']];

  function passosDe(tarefa, url) {
    var nome = nomeSite(url);
    if (tarefa === 'clonar') {
      return [['abrindo ' + dominio(url) + '…', 50, 12], ['lendo o HTML da página (Raio-X › HTML)…', 50, 30, 'raiox', 'html'], ['extraindo o CSS e as fontes…', 50, 40, 'raiox', 'css'],
        ['baixando as imagens…', 50, 55, 'raiox', 'rede'], ['separando a copy: títulos, subtítulos, botões, depoimentos…', 50, 70, 'raiox', 'copy'], ['salvando em Clones/' + dominio(url) + '/…', 50, 80, 'clonar'], ['✓ página e copy clonadas', 50, 80, 'fim']];
    }
    if (tarefa === 'preencher') {
      return [['abrindo ' + dominio(url) + '…', 50, 12], ['procurando "Cadastro de fornecedor" no menu…', 44, 5, 'click', '#link-cadastro'], ['preenchendo Nome da empresa: Babel…', 30, 48, 'fill', '#nome', 'Babel Atendimento Inteligente'],
        ['preenchendo E-mail…', 30, 57, 'fill', '#email', 'contato@babel-os.com'], ['preenchendo Telefone…', 30, 66, 'fill', '#telefone', '(19) 99999-0000'], ['preenchendo O que fornece…', 30, 75, 'fill', '#servico', 'Atendimento no WhatsApp 24h'],
        ['clicando em Enviar cadastro…', 22, 84, 'click', '#enviar'], ['✓ cadastro feito em ' + dominio(url), 22, 84, 'fim']];
    }
    return [['abrindo ' + dominio(url) + '…', 50, 12], ['lendo a página: ' + nome + ', planos e contato…', 50, 30], ['rolando até os planos…', 50, 60, 'scroll', 600], ['✓ li a página: consulta avulsa R$ 180, plano família R$ 390/mês', 50, 60, 'fim']];
  }

  /* ---------- abrir: o terminal pede, o navegador aparece no meio ---------- */

  N.abrir = function (ag, url, tarefa, terminal) {
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    var s = N.sessoes[ag.id] = { agente: ag, url: url, tarefa: tarefa, passos: passosDe(tarefa, url), i: -1, log: [], assumido: false, raiox: false, aba: 'html', srcdoc: paginaFalsa(url), fim: false, terminal: terminal, feito: [] };
    BC.estacao.abrirAba({ id: 'nav:' + ag.id, tipo: 'navegador', ref: ag.id, titulo: 'Navegador · ' + ag.nome, atividade: 'terminais' });
    if (terminal) terminal.escrever('🌐 ' + ag.nome + ' abriu o navegador dela em ' + dominio(url) + '. Você vê cada passo na aba do meio.', 'ia', true);
    L().fazer('fazendo', 'no navegador · ' + dominio(url));
    setTimeout(function () { N.passo(ag.id); }, 900);
    return s;
  };

  N.passo = function (agId) {
    var s = N.sessoes[agId];
    if (!s || s.fim) return;
    if (s.assumido) { setTimeout(function () { N.passo(agId); }, 800); return; }
    s.i++;
    var p = s.passos[s.i];
    if (!p) return;
    s.log.push({ texto: p[0], ts: Date.now() });
    var el = document.getElementById('nav-' + agId), f = el && el.querySelector('.nav-iframe');
    if (p[3] === 'fill' && f) f.contentWindow.postMessage({ t: 'fill', sel: p[4], v: p[5] }, '*');
    if (p[3] === 'click' && f) f.contentWindow.postMessage({ t: 'click', sel: p[4] }, '*');
    if (p[3] === 'scroll' && f) f.contentWindow.postMessage({ t: 'scroll', y: p[4] }, '*');
    if (p[3] === 'raiox') { s.raiox = true; s.aba = p[4]; }
    if (p[3] === 'clonar') N.clonar(s, true);
    if (p[3] === 'fim') {
      s.fim = true;
      L().fazer('fazendo', 'no terminal ' + s.agente.nome);
      if (s.terminal) {
        if (s.tarefa === 'preencher') s.terminal.cartao('Cadastro feito em <b>' + esc(dominio(s.url)) + '</b> · Babel, contato@babel-os.com, (19) 99999-0000', null, '<button type="button" class="term-mini" data-term="aba:' + agId + '">ver</button>');
        else if (s.tarefa !== 'clonar') s.terminal.cartao(esc(s.agente.nome) + ' leu <b>' + esc(dominio(s.url)) + '</b>: consulta avulsa R$ 180, plano família R$ 390/mês, cadastro de fornecedor disponível');
        s.terminal.mostrar();
      }
    }
    N.atualizar(agId);
    if (!s.fim) setTimeout(function () { N.passo(agId); }, p[3] === 'fill' ? 1500 : 1900);
  };

  /* atualiza só o cursor e o registro, sem recarregar a página do agente */
  N.atualizar = function (agId) {
    var s = N.sessoes[agId], el = document.getElementById('nav-' + agId);
    if (!s || !el) { if (s && BC.estacao.abaAtual().id === 'nav:' + agId) BC.estacao.render(); return; }
    var p = s.passos[Math.max(0, s.i)], cur = el.querySelector('.nav-cursor');
    if (cur && p) { cur.style.left = p[1] + '%'; cur.style.top = p[2] + '%'; cur.classList.toggle('clicando', p[3] === 'click'); }
    var log = el.querySelector('.nav-log');
    if (log) { log.innerHTML = s.log.map(function (x, i) { return '<li class="' + (i === s.log.length - 1 ? 'atual' : '') + '"><time>' + U.hora(x.ts) + '</time>' + esc(x.texto) + '</li>'; }).join(''); log.scrollTop = log.scrollHeight; }
    var st = el.querySelector('.nav-estado');
    if (st) st.textContent = s.fim ? 'concluído' : s.assumido ? 'você está no controle' : 'controlado por ' + s.agente.nome + ' · você vê tudo';
    var rx = el.querySelector('.nav-raiox');
    if (rx && (rx.hidden === s.raiox || rx.dataset.aba !== s.aba)) BC.estacao.render();
  };

  /* ---------- Raio-X ---------- */

  function cssDe(src) {
    var m = src.match(/<style>([\s\S]*?)<\/style>/), regras = [];
    if (!m) return regras;
    m[1].split('}').forEach(function (r) { var p = r.split('{'); if (p.length === 2 && p[0].trim()) regras.push({ sel: p[0].trim(), props: p[1].trim().split(';').filter(Boolean) }); });
    return regras;
  }
  function copyDe(src) {
    var t = src.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, ''), r = { 'Títulos': [], 'Subtítulos': [], 'Parágrafos': [], 'Botões e links': [], 'Depoimentos': [] }, m;
    var re = /<(h1|h2|h3|p|a|button|div class="dep"|label)[^>]*>([\s\S]*?)<\/(h1|h2|h3|p|a|button|div|label)>/g;
    while ((m = re.exec(t))) {
      var tag = m[1].split(' ')[0], texto = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (!texto) continue;
      if (tag === 'h1') r['Títulos'].push(texto); else if (tag === 'h2' || tag === 'h3') r['Subtítulos'].push(texto); else if (tag === 'p') r['Parágrafos'].push(texto); else if (tag === 'a' || tag === 'button') r['Botões e links'].push(texto); else if (tag === 'div') r['Depoimentos'].push(texto);
    }
    return r;
  }
  function copyMd(src, url) {
    var c = copyDe(src), md = ['# Copy de ' + dominio(url), '', '> Extraída pelo navegador do agente em ' + U.dataLonga() + '.', ''];
    Object.keys(c).forEach(function (k) { if (c[k].length) { md.push('## ' + k, ''); c[k].forEach(function (x) { md.push('- ' + x); }); md.push(''); } });
    return md.join('\n');
  }

  N.clonar = function (s, tambemCopy) {
    var eu = L().eu, base = eu + '/Clones/' + dominio(s.url) + '/';
    L().fazer('criarArquivo', base + 'index.html', 'html', s.srcdoc, '14 KB');
    var pag = L().estado.arquivos[L().estado.arquivos.length - 1];
    s.feito.push(pag.id);
    if (tambemCopy) { L().fazer('criarArquivo', base + 'copy.md', 'md', copyMd(s.srcdoc, s.url), '2 KB'); s.feito.push(L().estado.arquivos[L().estado.arquivos.length - 1].id); }
    ['Clones', 'Clones/' + dominio(s.url)].forEach(function (p) { ui().abertas[eu + '/' + p] = true; });
    if (s.terminal) { s.terminal.cartao('Clonado em <b>Clones/' + esc(dominio(s.url)) + '/</b> · index.html com CSS e imagens' + (tambemCopy ? ' · copy.md com os textos por seção' : ''), null, '<button type="button" class="term-mini" data-term="abrir:' + pag.id + '">abrir</button>'); s.terminal.mostrar(); }
    return pag;
  };

  function raiox(s) {
    var abas = [['html', 'HTML'], ['css', 'CSS'], ['copy', 'Copy'], ['rede', 'Rede'], ['console', 'Console']], q = U.normalizar(ui().raioxBusca || ''), corpo = '';
    if (s.aba === 'html') {
      var linhas = s.srcdoc.replace(/></g, '>\n<').split('\n').filter(function (l) { return !q || U.normalizar(l).indexOf(q) !== -1; });
      corpo = '<input type="text" id="raiox-busca" placeholder="buscar no HTML (ex.: form, h1, btn)" value="' + esc(ui().raioxBusca || '') + '" autocomplete="off"><div class="raiox-html">' + linhas.slice(0, 120).map(function (l) { return '<div class="raiox-linha"><code>' + esc(l.slice(0, 160)) + '</code><button type="button" class="term-mini" data-acao="raiox-copiar" data-t="' + esc(l) + '">copiar</button></div>'; }).join('') + '</div>';
    } else if (s.aba === 'css') {
      corpo = '<p class="form-ajuda">Fontes: -apple-system, Segoe UI · Cores: #0ea5a4 (ação), #0f172a (títulos), #475569 (texto), #e0f7f6 → #f0f9ff (fundo do topo)</p><div class="raiox-html">' + cssDe(s.srcdoc).map(function (r) { return '<div class="raiox-regra"><b>' + esc(r.sel) + '</b>' + r.props.map(function (p) { return '<span>' + esc(p.trim()) + '</span>'; }).join('') + '</div>'; }).join('') + '</div>';
    } else if (s.aba === 'copy') {
      var c = copyDe(s.srcdoc);
      corpo = '<div class="dem-acoes"><button class="botao" type="button" data-acao="raiox-copiar" data-t="' + esc(copyMd(s.srcdoc, s.url)) + '">copiar tudo em Markdown</button></div><div class="raiox-html">' + Object.keys(c).map(function (k) { return c[k].length ? '<div class="raiox-secao"><span class="rotulo">' + esc(k) + '</span>' + c[k].map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') + '</div>' : ''; }).join('') + '</div>';
    } else if (s.aba === 'rede') {
      var sel = ui().raioxReq;
      corpo = '<div class="raiox-html">' + REDE.map(function (r, i) { return '<button type="button" class="raiox-req' + (sel === i ? ' ativo' : '') + '" data-acao="raiox-req" data-i="' + i + '"><b>' + r[0] + '</b><span>' + esc(r[1]) + '</span><i class="' + (r[2][0] === '2' ? 'ok' : '') + '">' + r[2] + '</i><small>' + esc(r[3]) + '</small></button>' + (sel === i ? '<pre class="raiox-resp">' + esc(r[4]) + '</pre>' : ''); }).join('') + '</div>';
    } else corpo = '<div class="raiox-html"><div class="raiox-linha"><code>[log] página carregada em 412 ms</code></div><div class="raiox-linha"><code>[info] analytics bloqueado pelo navegador do agente</code></div></div>';
    return '<aside class="nav-raiox" data-aba="' + s.aba + '"><div class="nav-raiox-cab"><span class="rotulo">Raio-X do site</span><button class="botao discreto" type="button" data-acao="raiox-fechar">✕</button></div>' +
      '<div class="dem-acoes nav-raiox-botoes"><button class="botao primario" type="button" data-acao="raiox-clonar">Clonar página</button><button class="botao" type="button" data-acao="raiox-copy">Clonar copy</button><button class="botao" type="button" data-acao="raiox-print">Print inteiro</button><button class="botao discreto" type="button" data-acao="raiox-selecionar">⌖ Selecionar elemento</button></div>' +
      '<div class="alternar">' + abas.map(function (a) { return '<button type="button" class="' + (s.aba === a[0] ? 'ativo' : '') + '" data-acao="raiox-aba" data-aba="' + a[0] + '">' + a[1] + '</button>'; }).join('') + '</div>' + corpo + '</aside>';
  }

  /* ---------- a vista ---------- */

  BC.vistas.navegador = {
    lateral: function () { return BC.vistas.terminais.lateral(); },
    conteudo: function (tab) {
      var s = N.sessoes[tab.ref];
      if (!s) return '<div class="pagina"><h1 class="pagina-titulo">Navegador</h1><p class="pagina-sub">O mesmo navegador que o agente usa. Você navega como em qualquer navegador; o agente vê a mesma página, e você pode pedir "clona esta página" ou "preenche o cadastro".</p>' +
        '<form class="campo-inline" data-form="nav-ir"><input type="text" id="nav-url-nova" placeholder="endereço do site (ex.: clinicavida.com.br)" autocomplete="off"><button class="botao primario" type="submit">Abrir</button></form>' +
        '<p class="form-ajuda">Ou peça ao agente no terminal: "entra em clinicavida.com.br e preenche o cadastro" · "clona a landing clinicavida.com.br". No app, é um navegador de verdade dentro da Estação (webview do Electron); aqui as páginas são de exemplo.</p></div>';
      var p = s.passos[Math.max(0, s.i)] || s.passos[0];
      return '<div class="nav" id="nav-' + s.agente.id + '"><div class="nav-barra"><span class="term-av" style="--cor:' + s.agente.cor + '">' + esc(s.agente.nome.slice(0, 2).toUpperCase()) + '</span>' + (s.assumido ? '<form class="nav-url-form" data-form="nav-ir"><input type="text" id="nav-url-nova" value="' + esc(s.url) + '" aria-label="Endereço" autocomplete="off"><button class="botao discreto" type="submit">Ir</button></form>' : '<span class="nav-url" title="controlado pelo agente; assuma para navegar você">🔒 ' + esc(s.url) + '</span>') +
        '<span class="nav-estado">' + (s.fim ? 'concluído' : s.assumido ? 'você está no controle' : 'controlado por ' + esc(s.agente.nome) + ' · você vê tudo') + '</span>' +
        '<button class="botao' + (s.assumido ? ' primario' : '') + '" type="button" data-acao="nav-assumir" data-id="' + s.agente.id + '">' + (s.assumido ? 'Devolver para ' + esc(s.agente.nome) : 'Assumir') + '</button>' +
        '<button class="botao' + (s.raiox ? ' primario' : '') + '" type="button" data-acao="raiox-abrir">Raio-X</button></div>' +
        '<div class="nav-corpo"><div class="nav-pagina"><iframe class="nav-iframe" sandbox="allow-scripts" title="Navegador do agente"></iframe><div class="nav-cursor' + (p && p[3] === 'click' ? ' clicando' : '') + '" style="left:' + (p ? p[1] : 50) + '%;top:' + (p ? p[2] : 12) + '%"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 3l14 8-6 2-3 7z" fill="#fff" stroke="#111" stroke-width="1.5"/></svg><span>' + esc(s.agente.nome) + '</span></div></div>' + (s.raiox ? raiox(s) : '') + '</div>' +
        '<ol class="nav-log">' + s.log.map(function (x, i) { return '<li class="' + (i === s.log.length - 1 ? 'atual' : '') + '"><time>' + U.hora(x.ts) + '</time>' + esc(x.texto) + '</li>'; }).join('') + '</ol>' +
        '<p class="form-ajuda">No app real: a Estação é um Chromium, e o conector coop dá ao Claude as ferramentas de navegar, clicar, digitar, ler o DOM, capturar e salvar a página, direto do Electron, sem Playwright. Senhas só você digita: o agente para e escreve "sua vez".</p></div>';
    },
    montar: function (tab, el) {
      var s = N.sessoes[tab.ref], f = el.querySelector('.nav-iframe');
      if (s && f && !f.srcdoc) f.srcdoc = s.srcdoc;
    }
  };

  function sessaoAtual() { var t = BC.estacao.abaAtual(); return t.tipo === 'navegador' ? N.sessoes[t.ref] : null; }
  /* a pessoa usa o navegador do app como navegador: digita o endereço e vai; o agente continua vendo a mesma página */
  BC.formularios = BC.formularios || {};
  BC.formularios['nav-ir'] = function () {
    var campo = document.getElementById('nav-url-nova'), url = (campo ? campo.value : '').trim().replace(/^https?:\/\//, '');
    if (!url) return;
    var t = BC.estacao.abaAtual(), s = t.tipo === 'navegador' ? N.sessoes[t.ref] : null;
    if (!s) {
      var ag = ((L().pessoa(L().eu) || {}).agentes || [])[0] || { id: 'nav', nome: 'Navegador', cor: '#29ccec' };
      N.abrir(ag, url, 'navegar', BC.estacao.terminal);
      s = N.sessoes[ag.id];
      s.assumido = true; s.passos = []; s.i = 0; s.fim = true;
    } else {
      s.url = url; s.srcdoc = paginaFalsa(url); s.passos = []; s.i = 0; s.fim = true; s.log.push({ texto: 'você abriu ' + url });
    }
    BC.estacao.render();
    BC.estacao.aviso('Abrindo ' + url + '. Você está no controle; o agente vê a mesma página.');
  };
  A['nav-assumir'] = function (el) { var s = N.sessoes[el.dataset.id]; if (!s) return; s.assumido = !s.assumido; BC.estacao.aviso(s.assumido ? 'Você assumiu o navegador. ' + s.agente.nome + ' espera. Clique em "Devolver" quando terminar.' : s.agente.nome + ' retomou.'); BC.estacao.render(); };
  A['raiox-abrir'] = function () { var s = sessaoAtual(); if (s) { s.raiox = !s.raiox; BC.estacao.render(); } };
  A['raiox-fechar'] = function () { var s = sessaoAtual(); if (s) { s.raiox = false; BC.estacao.render(); } };
  A['raiox-aba'] = function (el) { var s = sessaoAtual(); if (s) { s.aba = el.dataset.aba; BC.estacao.render(); } };
  A['raiox-req'] = function (el) { ui().raioxReq = ui().raioxReq === +el.dataset.i ? null : +el.dataset.i; BC.estacao.render(); };
  A['raiox-copiar'] = function (el) { try { navigator.clipboard.writeText(el.dataset.t); } catch (e) { /* sem área de transferência */ } BC.estacao.aviso('Copiado.'); };
  A['raiox-clonar'] = function () { var s = sessaoAtual(); if (!s) return; var pag = N.clonar(s, false); BC.explorador.abrirArquivo(pag.id); BC.estacao.aviso('Página clonada em Clones/' + dominio(s.url) + '/index.html: abre como site e já dá para editar.'); };
  A['raiox-copy'] = function () { var s = sessaoAtual(); if (!s) return; var eu = L().eu; L().fazer('criarArquivo', eu + '/Clones/' + dominio(s.url) + '/copy.md', 'md', copyMd(s.srcdoc, s.url), '2 KB'); var a = L().estado.arquivos[L().estado.arquivos.length - 1]; ui().abertas[eu + '/Clones'] = ui().abertas[eu + '/Clones/' + dominio(s.url)] = true; BC.explorador.abrirArquivo(a.id); BC.estacao.aviso('copy.md criado com títulos, subtítulos, botões e depoimentos por seção.'); };
  A['raiox-print'] = function () { var s = sessaoAtual(); if (s) BC.estacao.aviso('Print da página inteira salvo em Clones/' + dominio(s.url) + '/print.png (no app; aqui é só o aviso).'); };
  A['raiox-selecionar'] = function () { var s = sessaoAtual(); if (!s) return; s.raiox = true; s.aba = 'html'; ui().raioxBusca = 'form'; BC.estacao.render(); BC.estacao.aviso('Modo selecionar: aponte um elemento na página e o Raio-X vai até ele (aqui, filtrei pelo formulário).'); };
  document.addEventListener('input', function (ev) { if (ev.target.id === 'raiox-busca') { ui().raioxBusca = ev.target.value; clearTimeout(N.t); N.t = setTimeout(function () { BC.estacao.render(); }, 200); } });

  BC.navegador = N;
})(window.BC);
