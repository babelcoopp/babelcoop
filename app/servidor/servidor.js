/* Babel Coop · o servidor de cada computador
   - serve a Estação (a mesma interface do protótipo, com ponte.js por cima) para esta máquina, o celular e a TV na rede local
   - guarda o diário de eventos e replica com os outros computadores (rede.js)
   - serve a pasta compartilhada desta pessoa e busca as dos outros direto na Estação deles
   - transmite os terminais (node-pty) para quem assiste e aceita teclas de quem tem controle
   Sobe junto com o app (main.js) ou sozinho: `node servidor/servidor.js`.
*/
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');
const config = require('./config');
const token = require('./token');
const { Diario } = require('./diario');
const { Arquivos } = require('./arquivos');
const { Terminais } = require('./terminal');
const { Rede } = require('./rede');
const { Atualizacao } = require('./atualizacao');

const PASTA_UI_PADRAO = fs.existsSync(path.join(__dirname, '..', '..', 'prototipo')) ? path.join(__dirname, '..', '..', 'prototipo') : path.join(process.resourcesPath || '', 'prototipo');
const MIME = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json; charset=utf-8', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml', ico: 'image/x-icon', md: 'text/markdown; charset=utf-8', txt: 'text/plain; charset=utf-8', pdf: 'application/pdf', mp4: 'video/mp4', webp: 'image/webp', gif: 'image/gif', woff2: 'font/woff2' };

function iniciar(opcoes) {
  opcoes = opcoes || {};
  let cfg = config.carregar();
  const diario = new Diario(cfg.diario, cfg.id);
  const arquivos = new Arquivos(cfg.pasta, cfg.id);
  const terminais = new Terminais(cfg);
  const atualizacao = new Atualizacao(cfg, PASTA_UI_PADRAO, path.join(__dirname, '..', 'ponte.js'));
  const navegadores = new Set(); /* Estação, celular, TV desta máquina */
  let rede = null;

  /* ---------- utilidades ---------- */
  const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': MIME.json, 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
  const corpo = (req) => new Promise((ok) => { let s = ''; req.on('data', (c) => { s += c; if (s.length > 20e6) req.destroy(); }); req.on('end', () => { try { ok(JSON.parse(s || '{}')); } catch (e) { ok({}); } }); });
  const mandar = (ws, msg) => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg)); };
  const espalharNavegadores = (msg, exceto) => navegadores.forEach((ws) => { if (ws !== exceto) mandar(ws, msg); });
  const quem = () => ({ id: cfg.id, nome: cfg.nome, papel: cfg.papel, equipe: cfg.equipe || null, pronto: !!cfg.segredo });

  /* ---------- rede entre computadores ---------- */
  function ligarRede() {
    if (rede) rede.parar();
    if (!cfg.segredo) return;
    rede = new Rede(cfg, diario, aoMensagemDePar);
    rede.aoMudar((pares) => espalharNavegadores({ tipo: 'pares', lista: pares }));
    rede.iniciar();
  }

  /* mensagens que chegam de outra Estação (terminais e pedidos que passam de máquina em máquina) */
  function aoMensagemDePar(par, m) {
    if (m.tipo === 'term-assistir') { mandar(par.ws, { tipo: 'term-tela', dono: cfg.id, id: m.id, dados: terminais.tela(m.id), lista: terminais.lista() }); par.assiste = par.assiste || new Set(); par.assiste.add(m.id); return; }
    if (m.tipo === 'term-parar') { if (par.assiste) par.assiste.delete(m.id); return; }
    if (m.tipo === 'term-entrada') { terminais.escrever(m.id, m.dados, par.papel === 'gestao' ? { papel: 'gestao' } : par.id); return; }
    if (m.tipo === 'term-lista?') { mandar(par.ws, { tipo: 'term-lista', dono: cfg.id, lista: terminais.lista() }); return; }
    if (m.tipo === 'term-controle') { /* o dono aceitou na tela dele; a decisão vem pelo diário (aceitarEntrar) */ return; }
    /* o que vem de um terminal de outra máquina para quem assiste daqui */
    if (m.tipo === 'term-saida' || m.tipo === 'term-tela' || m.tipo === 'term-lista' || m.tipo === 'term-fim') { espalharNavegadores(m); return; }
    if (m.tipo === 'arquivos?') { mandar(par.ws, { tipo: 'arquivos', dono: cfg.id, lista: arquivos.listar() }); return; }
    if (m.tipo === 'arquivos') { espalharNavegadores(m); return; }
  }

  /* saída dos meus terminais: para as minhas telas e para quem assiste de fora */
  terminais.aoEvento((ev) => {
    espalharNavegadores(ev);
    if (!rede) return;
    rede.pares.forEach((p) => { if (p.ws && (ev.tipo === 'term-lista' || (p.assiste && p.assiste.has(ev.id)))) mandar(p.ws, ev); });
  });

  /* eventos do diário: os meus vão para os pares; todos vão para as minhas telas */
  diario.aoNovo((ev, meu) => {
    espalharNavegadores({ tipo: 'evento', evento: ev });
    if (meu && rede) rede.espalhar({ tipo: 'evento', evento: ev });
  });

  arquivos.vigiar(() => { espalharNavegadores({ tipo: 'arquivos', dono: cfg.id, lista: arquivos.listar() }); if (rede) rede.espalhar({ tipo: 'arquivos', dono: cfg.id, lista: arquivos.listar() }); });

  /* ---------- HTTP ---------- */
  const servidor = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const p = url.pathname;
    try {
      if (p === '/api/eu') return json(res, 200, Object.assign(quem(), { pares: rede ? rede.lista() : [], terminalReal: terminais.disponivel(), pasta: cfg.pasta, versao: require('../package.json').version, app: atualizacao.atual() }));
      if (p === '/api/fundar' && req.method === 'POST') {
        if (cfg.segredo) return json(res, 400, { erro: 'esta Estação já está numa equipe' });
        const b = await corpo(req);
        cfg = config.salvar(Object.assign(cfg, { nome: b.nome || cfg.nome, id: config.normalizar(b.nome || cfg.nome), papel: 'gestao', equipe: b.equipe || 'babel', segredo: token.novoSegredo(), encontro: [] }));
        ligarRede();
        return json(res, 200, quem());
      }
      if (p === '/api/token' && req.method === 'POST') {
        const b = await corpo(req);
        let t; try { t = token.ler(b.token); } catch (e) { return json(res, 400, { erro: e.message }); }
        cfg = config.salvar(Object.assign(cfg, { id: t.id, nome: t.nome, papel: t.papel, equipe: t.equipe, segredo: t.segredo, encontro: t.encontro || [] }));
        ligarRede();
        return json(res, 200, quem());
      }
      if (p === '/api/convite' && req.method === 'POST') {
        const b = await corpo(req);
        try { return json(res, 200, { token: token.gerar(cfg, b) }); } catch (e) { return json(res, 400, { erro: e.message }); }
      }
      /* Oficina do app: publicar e atualizar pela rede local */
      if (p === '/api/app/manifesto') { const m = atualizacao.manifesto(atualizacao.ultima()); return m ? json(res, 200, m) : json(res, 404, { erro: 'nenhuma versão publicada aqui' }); }
      if (p === '/api/app/arquivo') {
        const alvo = atualizacao.arquivo(+url.searchParams.get('versao'), url.searchParams.get('caminho') || '');
        if (!alvo) { res.writeHead(404); return res.end('não achei'); }
        res.writeHead(200, { 'Content-Type': MIME[alvo.split('.').pop().toLowerCase()] || 'application/octet-stream' });
        return fs.createReadStream(alvo).pipe(res);
      }
      if (p === '/api/app/publicar' && req.method === 'POST') {
        const b = await corpo(req);
        try {
          const m = atualizacao.publicar(b.notas, b.versaoBase);
          diario.anexar(cfg.id, 'oficinaPublicar', [m.notas], b.origem); /* o evento é o que faz "Atualizar" aparecer em todas as Estações */
          return json(res, 200, m);
        } catch (e) { return json(res, 400, { erro: e.message }); }
      }
      if (p === '/api/app/atualizar' && req.method === 'POST') {
        const b = await corpo(req);
        const par = rede && [...rede.pares.values()].find((x) => x.id === b.de);
        if (!par) return json(res, 502, { erro: 'a Estação de ' + b.de + ' não está na rede agora' });
        try { const m = await atualizacao.atualizar(par.host, par.porta, b.versao); return json(res, 200, m); } catch (e) { return json(res, 500, { erro: e.message }); }
      }
      if (p === '/api/diario') return json(res, 200, diario.todos());
      if (p === '/api/evento' && req.method === 'POST') { const b = await corpo(req); if (!b.acao) return json(res, 400, { erro: 'faltou a ação' }); return json(res, 200, diario.anexar(cfg.id, b.acao, b.args)); }
      if (p === '/api/arquivos') return json(res, 200, arquivos.listar());
      if (p === '/api/arquivo') {
        const rel = url.searchParams.get('caminho') || '';
        if (req.method === 'PUT') {
          const b = await corpo(req);
          const autor = req.headers['x-coop-quem'] || '';
          const pode = autor === cfg.id || (rede && [...rede.pares.values()].some((x) => x.id === autor && x.papel === 'gestao'));
          if (!pode) return json(res, 403, { erro: 'só o dono ou a gestão grava aqui' });
          return json(res, arquivos.escrever(rel, String(b.conteudo || '')) ? 200 : 400, { ok: true });
        }
        const a = arquivos.ler(rel);
        if (!a) return json(res, 404, { erro: 'não existe ou fora da pasta compartilhada' });
        if (a.caminhoReal) { res.writeHead(200, { 'Content-Type': MIME[a.caminhoReal.split('.').pop().toLowerCase()] || 'application/octet-stream' }); return fs.createReadStream(a.caminhoReal).pipe(res); }
        return json(res, 200, a);
      }
      /* a pasta de outra pessoa: pergunta direto à Estação dela (computador desligado = 502, a Estação mostra a ficha pontilhada) */
      const outro = p.match(/^\/api\/de\/([a-z0-9-]+)(\/.*)$/);
      if (outro) {
        const par = rede && [...rede.pares.values()].find((x) => x.id === outro[1]);
        if (!par) return json(res, 502, { erro: 'computador de ' + outro[1] + ' desligado' });
        const alvo = 'http://' + par.host + ':' + par.porta + '/api' + outro[2] + url.search;
        return http.get(alvo, (r2) => { res.writeHead(r2.statusCode, { 'Content-Type': r2.headers['content-type'] || MIME.json }); r2.pipe(res); }).on('error', () => json(res, 502, { erro: 'sem resposta de ' + outro[1] }));
      }
      /* a interface */
      let rel = p === '/' ? '/index.html' : p;
      const PASTA_UI = atualizacao.pastaUi(); /* a versão instalada pela Oficina, ou a que veio com o app */
      if (rel === '/ponte.js') { res.writeHead(200, { 'Content-Type': MIME.js, 'Cache-Control': 'no-store' }); return fs.createReadStream(atualizacao.pontePath()).pipe(res); }
      const alvo = path.normalize(path.join(PASTA_UI, rel));
      if (!alvo.startsWith(PASTA_UI) || !fs.existsSync(alvo) || fs.statSync(alvo).isDirectory()) { res.writeHead(404); return res.end('não achei'); }
      if (rel === '/index.html') {
        /* injeta a ponte no fim da página: é ela que troca o simulado pelo real */
        const html = fs.readFileSync(alvo, 'utf8').replace('<script src="app.js"></script>', '<script src="ponte.js"></script>\n<script src="app.js"></script>');
        res.writeHead(200, { 'Content-Type': MIME.html, 'Cache-Control': 'no-store' });
        return res.end(html);
      }
      res.writeHead(200, { 'Content-Type': MIME[rel.split('.').pop().toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(alvo).pipe(res);
    } catch (e) { json(res, 500, { erro: e.message }); }
  });

  /* ---------- WebSocket: telas desta máquina e pares ---------- */
  const wss = new WebSocketServer({ server: servidor, path: '/ws' });
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://x');
    if (url.searchParams.get('par') === '1') { if (rede) rede.aceitar(ws, req.socket.remoteAddress.replace('::ffff:', '')); else ws.close(); return; }
    navegadores.add(ws);
    mandar(ws, { tipo: 'bemvindo', eu: quem(), pares: rede ? rede.lista() : [], eventos: diario.todos(), terminais: terminais.lista(), terminalReal: terminais.disponivel() });
    ws.on('close', () => navegadores.delete(ws));
    ws.on('message', (buf) => {
      let m; try { m = JSON.parse(buf.toString()); } catch (e) { return; }
      if (m.tipo === 'fazer') { if (m.acao) diario.anexar(cfg.id, m.acao, m.args || [], m.origem); return; }
      if (m.tipo === 'term-abrir') { try { mandar(ws, { tipo: 'term-aberto', info: terminais.abrir(m), tela: terminais.tela(m.id) }); } catch (e) { mandar(ws, { tipo: 'erro', erro: e.message }); } return; }
      if (m.tipo === 'term-entrada') {
        if (!m.dono || m.dono === cfg.id) { terminais.escrever(m.id, m.dados, cfg.id); return; }
        if (rede) rede.enviar(m.dono, { tipo: 'term-entrada', id: m.id, dados: m.dados }); /* teclas para o terminal de outra pessoa */
        return;
      }
      if (m.tipo === 'term-tamanho') { terminais.redimensionar(m.id, m.cols, m.rows); return; }
      if (m.tipo === 'term-pausar') { terminais.pausar(m.id, m.sim); return; }
      if (m.tipo === 'term-controle') { if (m.dar) terminais.darControle(m.id, m.quem); else terminais.tirarControle(m.id, m.quem); return; }
      if (m.tipo === 'term-fechar') { terminais.fechar(m.id); return; }
      if (m.tipo === 'term-assistir') { if (rede && m.dono !== cfg.id) rede.enviar(m.dono, { tipo: 'term-assistir', id: m.id }); else mandar(ws, { tipo: 'term-tela', dono: cfg.id, id: m.id, dados: terminais.tela(m.id), lista: terminais.lista() }); return; }
      if (m.tipo === 'term-parar') { if (rede && m.dono !== cfg.id) rede.enviar(m.dono, { tipo: 'term-parar', id: m.id }); return; }
      if (m.tipo === 'term-lista?') { if (rede) rede.espalhar({ tipo: 'term-lista?' }); mandar(ws, { tipo: 'term-lista', dono: cfg.id, lista: terminais.lista() }); return; }
    });
  });

  servidor.listen(cfg.porta, '0.0.0.0', () => {
    console.log('[babel-coop] ' + cfg.nome + ' (' + cfg.id + ') em http://localhost:' + cfg.porta + '  · pasta ' + cfg.pasta + (cfg.segredo ? '' : '  · aguardando token'));
    ligarRede();
  });

  return {
    porta: cfg.porta, cfg: () => cfg,
    parar: () => { terminais.fecharTodos(); if (rede) rede.parar(); servidor.close(); }
  };
}

module.exports = { iniciar };
if (require.main === module) iniciar();
